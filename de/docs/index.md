---
title: "Einführung"
description: "Was Native Shell ist: ein Rust-first-Framework für native Benutzeroberflächen auf iOS, Android, macOS, Windows, Linux und im Web, das die jeweils eigene Benutzeroberfläche und Interaktion jeder Plattform nutzt."
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---


# Einführung

Native Shell (kurz NSH) ist ein natives UI-Framework für jede Plattform. Du baust eine App einmal, mit einem App-Modell – Komponenten, Signals, Styles und überall dieselbe API – und NSH führt sie auf **iOS, Android, macOS, Windows, Linux und im Web** aus, jeweils als App der jeweiligen Plattform: aus ihren eigenen Views aufgebaut, mit ihrem eigenen Textsystem bearbeitet und so bedienbar, wie es ihre Nutzer erwarten. Schreibe die ganze App in **Rust**, schreibe Screens in **TSX** oder kombiniere beides auf einer Engine. Auf derselben Engine können bereits ausgelieferte Apps zur Laufzeit neue UI erhalten – von deinem Team geschrieben oder von einem Modell generiert – als signierte Module, in einer Sandbox, die der Host konfiguriert.

> [!IMPORTANT]
> NSH stellt native Views und Interaktion bereit; das visuelle Design gehört der App. Komponenten, State und APIs werden plattformübergreifend geteilt, während Farben, Typografie, Abstände und Formen von der App kommen. Texteingabe, Fokus und Menüs folgen den Interaktionskonventionen des jeweiligen Geräts. Siehe [Ziele und Designprinzipien](./goals.md).

<a id="what-native-means"></a>

## Was „nativ“ bedeutet

Nativ bedeutet in NSH zweierlei: die Grundlagen der Plattform und die Interaktion der Plattform.

**Die Grundlagen der Plattform.** Jede Plattform hat ein eigenes Backend, das auf der UI aufbaut, die die Plattform bereits mitbringt:

| Plattform | Views | Text | Texteingabe |
|---|---|---|---|
| iOS | UIKit | CoreText | Die Textfelder und Textviews des Systems |
| Android | Android-Views | `StaticLayout` | `EditText` |
| macOS | AppKit, Core Animation | CoreText | `NSTextField`, `NSTextView` |
| Windows | Win32-Fenster, mit Direct2D gezeichnet | DirectWrite | Der Editor von NSH, mit den Eingabemethoden des Systems (IMM32) |
| Linux | GTK 4 | Pango | `Text` und `TextView` von GTK |
| Web | HTML-Elemente, mit CSS gestaltet | Die Schriften des Browsers | Die Eingabefelder des Browsers |

Textauswahl samt Menü, Eingabemethoden, Barrierefreiheit und Scrollen kommen von der Plattform, und was eine neue OS-Version dabei mitbringt, erreicht die App automatisch. Native Komponenten – eine Karte, eine Web-View, ein Videoplayer, jede vom Host registrierte View – sind einfach eine weitere View in derselben Hierarchie und werden wie alle anderen angeordnet, beschnitten und gescrollt ([Native Komponenten](./native-components.md)).

**Die Interaktion der Plattform.** Die Komponenten, die NSH in [`nsh/base`](../modules/nsh-base.md) bereitstellt, verhalten sich so, wie die Nutzer des jeweiligen Geräts es erwarten, sodass die App sie nur einmal schreibt:

| | Desktops (und Desktop-Browser) | Smartphones und Tablets |
|---|---|---|
| `Menu` | Ein Popup an seinem Auslöser; Untermenüs öffnen sich kaskadierend neben ihrem Eintrag | Ein Sheet von unten; ein Untermenü ersetzt die Einträge seines Menüs |
| `ContextMenu` | Ein Rechtsklick öffnet es am Mauszeiger | Ein auf dem Auslöser gehaltener Finger öffnet es als Sheet |
| `Tooltip` | Wird angezeigt, wenn der Mauszeiger auf dem Auslöser verweilt | Wird angezeigt, wenn die App es öffnet |
| `Popover` | Ein Klick außerhalb schließt es und erreicht, was unter dem Mauszeiger liegt | Ein Tippen außerhalb schließt es |

Seiten, Dialoge, die Tastatur und die Statusleiste folgen derselben Idee: Navigationsstapel pushen und poppen mit der jeweiligen Bewegung der Plattform, und die Zurück-Taste, Escape und Swipe-Back tun dort, was sie üblicherweise tun ([Navigation](./navigation.md)).

<a id="from-phone-to-desktop-to-web"></a>

## Vom Smartphone über den Desktop bis ins Web

Plattformübergreifend bedeutet in NSH, dass jedes Gerät die App bekommt, die es erwartet, und nicht denselben Screen, nur vergrößert oder verkleinert:

- **Ein App-Modell.** Komponenten, State, Geschäftslogik und Screens der App werden geteilt; jedes Backend bildet sie auf seine Plattform ab.
- **Layouts, die sich umformen.** Flexbox und CSS Grid werden auf jeder Plattform von [Taffy](https://github.com/DioxusLabs/taffy) berechnet, und die Breakpoints von Tailwind (`md:`, `lg:`) sowie die Fenstergröße (`window()` in Rust) verändern die Struktur, nicht nur die Größe: Eine Chat-App zeigt in einem breiten Fenster Seitenleiste, Unterhaltungen und Nachrichten nebeneinander und auf einem Smartphone jeweils einen Screen ([Layout](./layout.md), [Tailwind](./tailwind.md)).
- **Die Eingabe, die jedes Gerät erwartet.** Mauszeiger, Hover, Rechtsklicks, Tastenkürzel und Fokus auf dem Desktop; Touches, Gesten, die Software-Tastatur und Seitennavigation auf Smartphones. Wo eine App pro Plattform etwas Eigenes möchte, drücken `desktop={{…}}`-Props und `platform.select` das aus ([Plattformspezifischer Code](./platform-specific.md)).
- **Auf jedem Ziel geprüft.** `nsh test` führt die Tests der App headless aus – und dieselben Tests in Fenstern unter macOS, Windows, Linux und GPUI, in einem iOS-Simulator, auf einem Android-Gerät oder in einem Browser, mit der eigenen Eingabe der Plattform ([Testen und Tracing](./testing-and-trace.md)).

Nimm eine App wie einen Chat-Client. Ihr Entwickler baut sie auf dem Desktop mit `nsh run`, öffnet sie in einem iOS-Simulator mit `nsh run --target ios`, um das Smartphone-Layout zu prüfen, dann in einem Browser mit `nsh run --target web` – jedes Mal dasselbe Projekt – und `nsh package` erzeugt die installierbaren Apps und die Website. Ein einzelner Entwickler kann leisten, wofür früher pro Plattform ein ganzes Team nötig war, während parallel das Backend entsteht.

## Rust first

NSH ist in Rust gebaut, und Rust ist eine erstklassige Sprache, um damit Apps zu schreiben:

- **Ganze Apps in Rust.** UI, Logik und Komponenten sind Rust und werden auf jeder Plattform zu nativem Code kompiliert, mit Rusts Ownership, Typen, Threads und dem Ökosystem von crates.io. Berechnungen laufen mit nativer Geschwindigkeit, und große Datenmengen, Parsing und Systemarbeit bleiben in der Sprache, die dafür am besten geeignet ist ([Mit Rust entwickeln](./rust.md)).
- **TSX als zweiter Weg.** TSX eignet sich für schnell geschriebene Screens, Plugins, kleine Apps und UI, die zur Laufzeit ausgeliefert wird. Es läuft auf derselben Engine wie Rust, mit denselben Primitiven, Basiskomponenten und Signals.
- **Beides zusammen.** Eine Rust-App kann TSX-Screens einbinden, und TSX-Screens importieren die Rust-Komponenten, -Module und -Klassen der App.
- **Eine Toolchain.** Eine einzige ausführbare Datei, `nsh`, erstellt, baut, typprüft, führt mit Hot Reload aus, testet, paketiert und signiert Apps für jedes Ziel. Sie bringt einen eigenen TSX-Bundler und TypeScript-Checker mit, sodass ein Entwickler aus der Rust-, Swift-, Kotlin- oder C++-Welt Rust und `nsh` installiert und loslegt ([Installation](./installation.md), [CLI](./cli.md)).

<a id="an-app"></a>

## Eine App

Derselbe Zähler, in Rust und in TSX:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

Eine View (`view()`, `<View>`) wird unter iOS zu einer `UIView`, unter Android zu einer `ViewGroup`, unter macOS zu einer `NSView`, unter Linux zu einem GTK-Widget, unter Windows zu einer mit Direct2D gezeichneten Retained View und im Web zu einem HTML-Element; ein Text wird zu einer nativen Text-View, und das Press-Feedback des Buttons (`.active(..)`, `activeStyle`) läuft auf dem Main-Thread. Wenn du tippst, ändert `count.update` ein einzelnes Signal, und nur der Text, der es liest, wird aktualisiert: Die Komponentenfunktion läuft nicht erneut. Die Rust-App ist von Anfang bis Ende nativer Code; in der TSX-App ist nur der eigene Code des Moduls JavaScript.

## Retained Views

NSH arbeitet im Retained-Modus: Jedes Element ist eine View, die die Plattform vorhält, und ein Update ändert nur, was sich geändert hat.

- **Feingranulare Updates.** [Signals](./reactivity.md) wie die von Solid, nativ implementiert: Komponenten laufen einmal, und eine Änderung führt nur die Ausdrücke erneut aus, die das geänderte Signal lesen.
- **Nur Geändertes überquert Threads.** Die Änderungen eines Durchlaufs werden gemeinsam angeordnet und pro Frame als ein Batch von View-Operationen an den Main-Thread übergeben; unveränderte Styles und Frames werden nicht gesendet, und Views, die nichts berührt hat, bleiben unverändert.
- **Animationen laufen nativ.** Timing-, Spring- und Decay-Animationen, Gesten und Scroll-gekoppelte Werte werden auf dem Frame-Takt der Plattform ausgewertet, ohne pro Frame nach JS aufzurufen ([Animation](./animation.md)).

Das passt zu den Screens, aus denen die meisten Apps bestehen – Chats, Mail, Formulare, Listen, Dokumente, Einstellungen, eine einlaufende KI-Antwort –, bei denen sich jeweils nur wenige Views ändern und der Rest ruht. Solche Screens sind zwischen Updates nahezu im Leerlauf, und Scrollen und Animationen halten auf ProMotion-Displays 120 FPS. Im [NSH-Performance-Benchmark](https://github.com/longbridge/nsh-perf-bench) beansprucht eine Kurstabelle mit 500 Zeilen, die 1.000-mal pro Sekunde aktualisiert wird, unter Linux in NSH Rust 18 % eines Kerns, gegenüber 20 % für denselben Screen, direkt auf [GPUI Fast](https://github.com/longbridge/gpui-fast) geschrieben. Rechenintensive Aufgaben gehören in Rust: TSX läuft in QuickJS, einem Interpreter, während ein Rust-Modul auch dann mit nativer Geschwindigkeit läuft, wenn TSX es aufruft – das Sortieren von 100.000 Zeilen dauert so etwa 3 ms, genau wie in reinem Rust ([Performance](./performance.md)).

<a id="how-it-runs"></a>

## Wie es läuft

Die Toolchain ist eine einzelne `nsh`-Binary. Eine App wird in Rust, in TSX oder in beidem geschrieben, und jeder Weg führt auf eigene Art zur selben Rust-Engine.

### Rust-Apps

Eine Rust-App ist ein Crate, das vollständig mit Rust und Native Shell gebaut wird, ohne JavaScript-Runtime:

1. **Build.** `nsh` baut den Runner jedes Ziels – die iOS-, Android-, macOS-, Windows-, Linux- oder Web-App – mit deinem eingebundenen Crate. Komponenten, State, Handler und die Engine werden gemeinsam zu nativem Code kompiliert.
2. **Ausführung.** Die Root-Komponente der App läuft als Rust auf dem Engine-Thread. Der Runner hat keine JavaScript-Engine: QuickJS ist auf keiner Plattform Teil einer Rust-App.

### TSX-Apps

Eine TSX-App (ein Modul) ist eine Menge von `.tsx`- / `.ts`-Dateien mit einem Einstiegspunkt, meist `App.tsx`:

1. **Build.** `nsh` bündelt die Dateien des Moduls (mit rolldown und Oxc) und kompiliert das JSX mit einem eigenen Compiler. Imports von `nsh` und `nsh/*` bleiben Imports: Die Runtime stellt sie nativ bereit, sodass das Bundle nur deinen Code enthält. Das Bundle wird zu QuickJS-Bytecode kompiliert.
2. **Ausführung.** Der Engine-Thread führt den Bytecode in [QuickJS](https://github.com/quickjs-ng/quickjs) aus, eine VM pro View. Kompiliertes JSX ruft den nativen Renderer direkt auf, und JavaScript beschreibt nur die UI und behandelt Events; das Parsen von Styles, das Auflösen von Tailwind-Klassen, Diffing, Layout und Text geschehen alle in Rust.

<a id="the-difference"></a>

### Der Unterschied

| | Rust-App | TSX-App |
|---|---|---|
| Geschrieben in | Rust | TSX (TypeScript und JSX) |
| Gebaut zu | Nativem Code, in den Runner jedes Ziels gelinkt | QuickJS-Bytecode, von der Runtime geladen |
| JavaScript-Engine | Keine | QuickJS, eine VM pro View |
| Während der Entwicklung (`nsh run`) | Wird bei jedem Speichern neu gebaut und neu gestartet | Hot Updates bei jedem Speichern |
| Nach dem Release | Wird mit der App ausgeliefert | Wird zusätzlich zur Laufzeit als signierte Pakete in einer Sandbox ausgeliefert |
| Geeignet für | Ganze Apps, rechenintensive Aufgaben, Systemarbeit | Schnell geschriebene Screens, Plugins, KI-generierte UI |

Beides lässt sich kombinieren: Eine Rust-App kann TSX-Screens einbinden, und TSX-Screens importieren ihre Rust-Komponenten, -Module und -Klassen; eine solche App linkt QuickJS ein, um sie auszuführen ([Mit Rust entwickeln](./rust.md)).

<a id="the-shared-engine"></a>

### Die gemeinsame Engine

Ab der Engine sind beide Wege identisch. Änderungen werden pro Durchlauf gesammelt, mit Taffy (Flexbox und CSS Grid) angeordnet und pro Frame als ein Batch von View-Operationen an den Main-Thread übergeben; der Main-Thread wendet den Batch auf native Views an. Text wird einmal auf dem Engine-Thread gemessen und gesetzt (CoreText auf Apple-Plattformen, `StaticLayout` unter Android, DirectWrite unter Windows, Pango unter Linux, die Schriftmetriken des Browsers im Web) und auf dem Main-Thread nur noch gezeichnet.

Im Web läuft dieselbe Engine in der Seite: Der Browser zeigt HTML-Elemente, die mit CSS gestaltet sind, scrollt sie, wählt ihren Text aus und behandelt Eingaben, und `nsh package --target web` veröffentlicht die App als statische Website, deren Dateien nach ihrem Inhalt benannt sind und die für jedes CDN bereit ist ([Web](./web.md)).

> [!NOTE]
> Der Main-Thread wartet nie auf den Code der App. Fragen, die das System synchron stellt (darf dieses Eingabefeld ein weiteres Zeichen annehmen, darf der Nutzer zurückwischen, darf dieses Sheet geschlossen werden), werden nativ anhand vorher gesetzter Props beantwortet, etwa `maxLength`, `popOnBack` oder `closeOnSwipe`. Events erreichen die Handler der App erst danach.
<a id="dynamic-ui-and-ai-generated-ui"></a>

## Dynamische UI und KI-generierte UI

NSH entstand als Möglichkeit für native Apps, nach der Veröffentlichung noch UI nachzuladen, und das bleibt einer der wichtigsten Einsatzzwecke. Eine App bettet überall dort, wo ein Modul erscheinen soll, einen `NshAppView` (iOS), `NshView` (Android), `AppView` (macOS, Windows, Linux und GPUI-Apps) oder `createPlayer` (eine Webseite) ein, und NSH führt darin TSX-Module aus:

- **Nach der Veröffentlichung ausgeliefert.** Ein Modul ist ein signiertes Paket (`.nshpkg`), das die App zur Laufzeit herunterlädt. Die App prüft seine Signatur anhand der Schlüssel, denen sie vertraut, sowie anhand einer Sperrliste, bevor sie es ausführt ([Signierte Pakete](./signed-packages.md)). Die Host-App liefert die Runtime mit; Teams entwickeln Module gegen deren API und liefern sie nach ihrem eigenen Zeitplan aus.
- **Der Host behält die Kontrolle.** Jedes Modul läuft in einer eigenen QuickJS-VM mit Limits für Speicher, Aufrufdauer und Knoten und erreicht nur das, was der Host freigibt: Netzwerk-Hosts, Webseiten, die Statusleiste ([Sandbox und Capabilities](./sandbox-and-capabilities.md)). Mehrere Module laufen nebeneinander.
- **Es sieht aus wie der Rest der App.** Module werden mit der nativen UI der Plattform gerendert, und der Host kann eigene native Views registrieren, etwa eine Karte, einen Player oder eine Komponente des Designsystems, die Module verwenden können ([Native Komponenten](./native-components.md)).

Derselbe Mechanismus erlaubt es einer App, **mit einer Oberfläche zu antworten**. Ein Modell schreibt ein kleines TSX-Modul (ein Formular, ein Diagramm, eine Buchungskarte), Ihr Server prüft, baut und signiert es, und die App zeigt es nativ an:

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

Auf iOS besteht der Teil des Hosts aus wenigen Zeilen:

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## KI-freundlich

NSH ist für Software konzipiert, die mit KI entsteht, ganze Apps ebenso wie generierte Screens:

- **Ein App-Modell für alle Plattformen.** Ein Modell lernt eine einzige Art, UI zu schreiben, und das Ergebnis läuft auf Smartphones, Desktops und im Web; NSH passt die Interaktion pro Plattform an, sodass nichts sechsmal generiert wird.
- **Rust oder TSX, je nach Aufgabe.** Rust für ganze Apps und performancekritische Module, TSX für Screens, Plugins und pro Anfrage generierte UI, auf einer Engine.
- **Ein präziser, generierter Vertrag.** Für jedes Element, jede Prop, jeden Style-Key und jedes Modul gibt es TypeScript-Deklarationen, die aus den Rust-Quellen generiert werden (`.nsh/types`), und Rust-APIs sind typisiert, sodass generierter Code von einem Compiler geprüft wird. Diese Dokumentation wird für Modelle als Klartext bereitgestellt ([`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt)).
- **Eine Kommandozeile für den gesamten Ablauf.** Ein Agent erstellt die App, baut sie, führt sie auf einem Ziel aus, startet ihre Tests, liest das Ergebnis, behebt Fehler und paketiert sie, alles über `nsh`. `nsh test` läuft headless, ohne Gerät, und meldet Fehler und die erzeugten Views; der Compiler läuft außerdem im Prozess (`nsh_bundler::compile_module`) und im Browser ([Playground](/playground)).
- **Sicher ausführbar, auch wenn man ihr nicht vertraut.** Zur Laufzeit ausgelieferter generierter Code ist nicht vertrauenswürdiger Code: Er kommt signiert an, läuft in einer VM mit Limits und erreicht nur die Capabilities, die der Host freigibt.

<a id="where-it-runs"></a>

## Wo es läuft

| Plattform | Voraussetzung | Backend | Eingebettet mit |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Android Views | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | Moderne Browser | HTML | `createPlayer`, iframe |
| [GPUI](./gpui.md) | Desktops | GPUI | `AppView` (GPUI-, GPUI-Kit-Apps) |
| Mac Catalyst | macOS | UIKit | Für die Entwicklung (`--target catalyst`) |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell und GPUI Shell

[Longbridge](https://longbridge.com) entwickelt NSH für die eigenen Clients. Der erste Bedarf war eine Plugin-Schicht für den Mobile-Client, und den Ausgangspunkt bildete [GPUI Shell](https://gpui-kit.com/shell), das [GPUI](https://gpui-kit.com)-Desktop-Apps in JavaScript erweiterbar macht. Auf Smartphones hätte eine von GPUI selbst gezeichnete UI nachbauen müssen, was die Plattform bereits leistet: Textauswahl und ihr Menü (Kopieren, Teilen, Übersetzen, Nachschlagen), Eingabemethoden, Barrierefreiheit und die visuellen Materialien, die jede iOS-Version mitbringt; außerdem hätte jedes Mobile-Team einen neuen UI-Stack übernehmen müssen. NSH rendert deshalb mit der nativen UI jeder Plattform und ist aus dieser Plugin-Schicht zu einem Framework für ganze Apps auf jeder Plattform gewachsen.

Beide sind unterschiedlich positioniert. GPUI Shell erweitert GPUI-Desktopanwendungen; Native Shell ist ein Framework für native Apps auf Smartphones, Desktops und im Web, und sein GPUI-Backend bettet NSH-Apps in GPUI- und GPUI-Kit-Apps ein ([GPUI](./gpui.md)).

<a id="how-it-compares"></a>

## Vergleich

Für ganze Apps steht NSH unter plattformübergreifenden Frameworks wie React Native, Flutter, Qt, GPUI, Slint, Electron und Tauri; für nach der Veröffentlichung ausgelieferte UI unter Web Views, Server-Driven UI und Mini-Program-Containern. Seine Entscheidung ist die jeweils eigene UI und Interaktion jeder Plattform unter einem App-Modell, mit Rust als App-Sprache und TSX daneben. [Ansätze im Vergleich](./comparison.md) geht jeden davon durch.

<a id="next-steps"></a>

## Nächste Schritte

- [Installation](./installation.md) und [Erste Schritte](./getting-started.md): `nsh` installieren, eine erste App in Rust oder TSX schreiben und auf jeder Plattform ausführen.
- [Entwickeln mit Rust](./rust.md): in Rust geschriebene Apps und TSX darauf aufbauend.
- [Plattformen](./platforms.md): was wo läuft und wie man auf jeder Plattform ausführt, paketiert und einbettet.
- [JSX und Komponenten](./jsx-and-components.md) und [Reaktivität](./reactivity.md): die beiden Konzepte, auf denen alles andere aufbaut, in Rust und TSX.
- [Signierte Pakete](./signed-packages.md) und [Sandbox und Capabilities](./sandbox-and-capabilities.md): Module ausliefern und festlegen, was sie dürfen.
