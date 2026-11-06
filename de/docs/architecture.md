---
title: "Architektur"
description: "Wie eine NSH-App läuft: die Build-Pipeline, die Engine- und Main-Threads, der Weg von einer Signaländerung zu nativen Views, der native reaktive Graph, das Text-Layout und die Crates."
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---


# Architektur

Diese Seite richtet sich an App-Entwickler, die wissen möchten, was zwischen `count.set(1)` und der Änderung eines Labels auf dem Bildschirm passiert,
in einer App, die in Rust oder TSX geschrieben ist.
Du brauchst dieses Wissen nicht, um Apps zu schreiben, aber es erklärt, warum sich NSH so verhält, wie es sich verhält: warum Komponenten nur einmal ausgeführt werden, warum
Animationen flüssig bleiben, während JS beschäftigt ist, und warum der Main-Thread nie auf deinen Code wartet.

<a id="the-big-picture"></a>

## Das große Ganze

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## Build: Nur dein Code wird zu JS

`nsh build`, `nsh dev` und die anderen Befehle bündeln deine App mit einer in Rust geschriebenen Toolchain (ohne Node.js):

1. **Oxc** entfernt die TypeScript-Typen.
2. **Der JSX-Compiler von NSH** wandelt JSX im selben Durchlauf in direkte Aufrufe des nativen Renderers um. Statische Props und
   Children werden einmal gesetzt; Ausdrücke, die sich ändern können (sie rufen eine Funktion auf oder lesen eine Property), werden zu Bindings, denen der
   Renderer folgt. Komponenten werden zu gewöhnlichen Funktionsaufrufen mit einem Props-Objekt, dessen veränderliche Props Getter sind.
3. **rolldown** bündelt deine Module zu einem einzigen ES-Modul. Imports von NSH-Modulen (`nsh`, `nsh/mobile`,
   `nsh/base`, ...) bleiben Imports: Diese Module sind nativ und werden von der Runtime bereitgestellt. **Das Bundle enthält nur den Code
   deiner App**; das Counter-Beispiel umfasst weniger als 1 KB JS.
4. Das Bundle wird zu **Bytecode** kompiliert (`bundle.nshc`), der schneller lädt als Quellcode, und eine **Source Map**
   wird über alle Schritte hinweg zusammengesetzt, sodass Stack Traces auf deine `.tsx`-Zeilen zeigen.

Bilder und Schriften, die du importierst, werden als Assets gesammelt, und Typdeklarationen für deinen Editor werden nach
`.nsh/types` geschrieben.

Eine in Rust geschriebene App hat kein Bundle: Cargo baut den Runner jedes Targets mit deinem eingebundenen Crate, und die Root-Komponente, die `nsh.json` benennt, läuft nativ auf der Engine. Alles Folgende gilt auch hier, wobei der Code deiner Komponenten in Rust läuft, wo er bei einer TSX-App in QuickJS läuft.

<a id="running-two-threads-per-app"></a>

## Laufzeit: zwei Threads pro App

Jede laufende App (ein `NshAppView` unter iOS, ein `NshView` unter Android, das Fenster einer paketierten App) ist eine **Engine** mit
eigenem **Engine-Thread** und, bei TSX, einer eigenen QuickJS-VM. Es gibt keine globalen Singletons, daher können mehrere Apps nebeneinander
in einer Host-App laufen.

<a id="the-engine-thread"></a>

### Der Engine-Thread

Hier passiert alles, was die Logik deiner App betrifft:

- **Dein Code** läuft hier: Komponenten, Event-Handler, Timer, Effects. Rust-Komponenten laufen nativ; TSX läuft in
  **QuickJS**.
- **Der reaktive Graph** (Signals, Computed Values, Effects, Owner, Context) ist nativ. Seine Knoten sind QuickJS-Objekte
  nativer Klassen, sodass der Garbage Collector die Referenzen durch sie hindurch sieht, doch das Verfolgen von Abhängigkeiten und das
  Planen von Updates erfolgt in Rust (es folgt dem Algorithmus von Solid 1.9).
- **Der Renderer**, den dein kompiliertes JSX aufruft, ist nativ. Er erzeugt Knoten und macht aus jeder Änderung eine **Op**, die
  direkt in eine native Queue geschrieben wird: kein JSON, keine Nachrichten pro Prop.
- **Der Core** hält einen Shadow Tree aller Knoten. Wenn ein JS-Turn endet, nimmt er alle Ops in der Queue auf einmal und **committet**:
  Er rendert die Rust-Komponenten (die von `nsh/base` und die eigenen der App), löst `env()`-Insets in Padding und Margin auf, baut geänderte Texte neu auf, berechnet das Layout mit **Taffy** (Flexbox und Grid, mit
  Spalte als Standard und ohne Schrumpfen), vergleicht Frames und Styles und erzeugt einen **MountBatch**: die Liste der Operationen, die die nativen
  Views benötigen.

<a id="the-main-thread"></a>

### Der Main-Thread

Der Main-Thread (UI-Thread) der Plattform wendet jeden MountBatch in einem Durchgang an: Views erstellen, einfügen, Styles und Frames setzen,
bereits gesetzten Text übergeben. Darüber hinaus erledigt er nur, was auf ihm geschehen muss:

- **Text zeichnen**, der bereits auf dem Engine-Thread gesetzt wurde;
- **native Animationen**: Animierte Werte aus `nsh` werden Frame für Frame getrieben (ein `CADisplayLink` unter iOS, ein UI-Thread-
  Animator unter Android) und direkt in die Views geschrieben;
- **Gesten und Scrollen**: Touches werden zu Events, die an den Engine-Thread gesendet werden; `scrollValue` und `pan` speisen animierte
  Werte im selben Frame.

**Der Main-Thread wartet nie auf JS.** Wenn das System sofort eine Antwort braucht (darf sich dieser Text ändern, darf der
Zurück-Button diesen Screen entfernen, darf sich dieses Sheet schließen), wurde die Antwort vorab als Prop gemountet, und JS erfährt
danach über ein Event davon. Ein ausgelasteter Engine-Thread kann Updates verzögern, aber er kann weder Scrollen noch Animationen noch
die Gesten des Systems einfrieren.

<a id="from-a-tap-to-the-screen"></a>

## Vom Tippen bis zum Bildschirm

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

Im Counter-Beispiel kostet ein Tap in einem Release-Build auf einem Mac etwa 0,12 ms, JS und Commit zusammen, und erzeugt eine
Handvoll Mount-Items (siehe [Testen](./testing-and-trace.md)).

In einer Rust-App ist der Handler eine Rust-Closure (`count.set(count.get() + 1)`), und derselbe Graph, Commit und Batch
folgen, ohne Interpreter dazwischen.

Aus diesem Design ergeben sich drei Eigenschaften:

- **Ein Turn ist ein Commit.** Egal, wie viele Signals ein Handler setzt, die Views ändern sich einmal, gemeinsam.
- **Komponenten werden einmal ausgeführt.** Nur Bindings laufen erneut; es gibt kein erneutes Rendern einer Komponente und kein Virtual-DOM-Diff. Das
  verbleibende Diffing erfolgt im Core, über Frames und Styles, in Rust.
- **Nur Änderungen werden übertragen.** Unveränderte Styles und Frames werden nicht gesendet; neue Views erhalten keine Standardwerte.

<a id="text-laid-out-once-off-the-main-thread"></a>

## Text: einmal gesetzt, abseits des Main-Threads

Text ist oft der aufwendigste Teil einer UI. NSH setzt ihn auf dem Engine-Thread mit der plattformeigenen Text-Engine, sodass er genau wie nativer Text aussieht:

1. **Vorbereiten**: Ein `<Text>` und seine verschachtelten Spans werden zu einem Attributed String (CoreText auf Apple-Plattformen,
   `PrecomputedText` / `StaticLayout` unter Android);
2. **Messen** bei den Breiten, die das Layout anfordert; Messungen werden nach Inhalt und Breite zwischengespeichert, sodass eine reine Farbänderung
   nicht erneut misst;
3. **Layout** in der endgültigen Größe.

Der Main-Thread erhält das unveränderliche Ergebnis und zeichnet es nur. Ein in einem `<Text>` verschachtelter Text ist ein Span, keine View;
Strings außerhalb von `<Text>` rendern nichts.

<a id="lists"></a>

## Listen

`List` ist nativ virtualisiert. Der Core entscheidet, welche Zeilen nahe am Viewport liegen, berechnet Positionen, Spalten und
Sticky Header und recycelt Zellen. Wenn eine Zelle ein anderes Item benötigt, bindet die Runtime es (die Accessoren `item()` und `index()`
deiner Row-Funktion ändern sich); Frames, die keine neue Zeile sichtbar machen, rufen überhaupt kein JS auf. Siehe [Listen](./lists.md).

<a id="everything-else-the-runtime-does"></a>

## Alles andere, was die Runtime tut

- **Netzwerk**: `fetch` und die anderen globalen APIs sind native Klassen. Anfragen gehen an den HTTP-Stack der Plattform
  (`NSURLSession`, `HttpURLConnection`) und werden in beide Richtungen gestreamt.
- **Bilder** werden abseits des Main-Threads heruntergeladen und dekodiert, in der Größe der View, mit einem Speicher-Cache.
- **Limits und Capabilities** werden von der Runtime in Rust durchgesetzt: siehe [Sandbox und Capabilities](./sandbox-and-capabilities.md).
- **Hot Module Replacement** ist ebenfalls nativ: Patches werden von der Runtime in deutlich unter einer Millisekunde angewendet (siehe
  [Dev-Server und Debugging](./dev-server-and-debugging.md)).

<a id="three-layers"></a>

## Drei Schichten

Die UI von NSH ist in drei Schichten aufgebaut, wie die von GPUI Kit:

| Schicht | NSH | GPUI Kit | Was es ist |
|---|---|---|---|
| Primitive | `nsh-core` und die Runtime (`nsh`, `nsh/mobile`, `nsh/desktop`) | `gpui` | Die Host-Elemente, Styles, Layout, Rendering, Reaktivität, die Umgebung |
| Basiskomponenten | `nsh-base` (`nsh/base`) | `gpui-base` | Ungestylte Komponenten, die Verhalten, State, Fokus, Tastatur und Barrierefreiheit verantworten und ihr Aussehen von der App beziehen |
| Komponentenbibliothek | die deiner App oder die der Community | `gpui-component` | Gestylte Komponenten: Buttons, Cards, Zeilen mit eigenem Look |

Die ersten beiden Schichten sind Native Shell. Die dritte gehört dir: Eine App baut ihre eigene Komponentenbibliothek auf `nsh/base` und
den Primitiven, in TSX oder als Rust-Komponenten in [einem eigenen Crate](./rust.md), nutzt eine von der Community veröffentlichte Bibliothek oder
stylt ihre UI direkt in der App.

<a id="the-crates"></a>

## Die Crates

NSH ist ein Rust-Workspace. Du baust ihn nie selbst, um Apps zu schreiben (die Distribution liefert die CLI und vorgebaute Runtimes mit), aber
die Namen tauchen in Logs und Dokumentation auf:

| Crate | Was es ist |
|---|---|
| `nsh-core` | Der plattformunabhängige Core: Shadow Tree, Styles, Taffy-Layout, Text-Merging, Listen-Virtualisierung, Mount-Items; CSS-Werte und Tailwind; der native Animationsgraph (Werte, Interpolation, Timing / Spring / Decay); das Framework und Theme der Rust-Komponenten; die Rust-Module der Runtime (das `BackHandler` von `nsh/mobile`, ...). |
| `nsh-base` | `nsh/base`, die ungestylten Basiskomponenten (das `gpui-base` von NSH): Navigation, Dialoge, Controls und die Statusleiste; Rust-Apps nutzen es als `nsh_base`. |
| `nsh-js` | Der QuickJS-Host und die Runtime von NSH: der reaktive Graph, der Renderer, jedes native Modul, die globalen APIs, Hot Module Replacement, Limits; und die TypeScript-Deklarationen für all das. |
| `nsh-engine` | Der Engine-Thread: treibt `nsh-js` und `nsh-core` an und übergibt einen Batch pro Frame an die Plattform. |
| `nsh-package` | Signierte Pakete: Schlüssel, Zertifikate, Widerruf, der Trust Store. |
| `nsh-bundler` | Der Bundler: rolldown, Oxc, der JSX-Compiler von NSH, Source Maps, Tailwind-Klassenprüfungen. |
| `nsh-dev` | Der Dev-Server und sein Client. |
| `nsh-platform-ios` | Das UIKit-Backend (iOS, Simulator, Mac Catalyst): View-Mounting, die CoreText-Text-Engine, Eingabe; das Embedding-SDK. |
| `nsh-platform-android` | Das Android-Backend: `libnsh.so` und die Java-Runtime (`NshView`, die Views, Bilder, Netzwerk). |
| `nsh-cli` | Der Befehl `nsh`. |

Die Abhängigkeitsrichtung ist `nsh-core` ← `nsh-js` ← `nsh-engine` ← Plattformen; `nsh-base` baut auf `nsh-core` auf. Der Core hängt weder von einer Plattform noch von einer JS-
Engine ab, und genau dadurch kann `nsh test` die echte Runtime headless auf jedem Rechner ausführen.

<a id="see-also"></a>

## Siehe auch

- [Performance](./performance.md)
- [Reaktivität](./reactivity.md)
