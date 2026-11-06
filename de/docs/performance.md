---
title: "Leistung"
description: "Wie NSH Apps schnell hält (Rust-Apps, eine native Runtime, gebündelte Übergänge, native Animationen, virtualisierte Listen), was das für Ihren Code bedeutet und wie Sie headless und auf dem Bildschirm messen."
order: 62
group: tools
source_hash: f8f220699bc54685
---


# Leistung

Performance hat bei NSH oberste Priorität, und das meiste davon entscheidet das Framework, nicht Ihre App: Die Runtime ist nativ, jedes Update überquert Threads nur einmal, Animationen und Listenvirtualisierung laufen ohne JS, und eine in Rust geschriebene App führt überhaupt kein JS aus. Diese Seite erklärt die Regeln, denen NSH folgt, was sie für den Code bedeuten, den Sie schreiben, in Rust und in TSX, und wie Sie messen.

<a id="the-rules"></a>

## Die Regeln

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS tut so wenig wie möglich

**Eine in Rust geschriebene App ist von Anfang bis Ende nativer Code**: Ihre Komponenten, ihr State und ihre Handler werden mit der Engine von NSH kompiliert, und es läuft kein Interpreter ([Building with Rust](./rust.md)). Das ist der schnellste Weg, eine App zu schreiben, und die richtige Wahl für anspruchsvolle Geschäftslogik.

In einer TSX-App ist QuickJS ein Interpreter: klein, schnell gestartet und bei aufwendigen Berechnungen deutlich langsamer als nativer Code. Deshalb ist in NSH **nur der Code Ihrer App JS**. Der reaktive Graph (Signals, berechnete Werte, Effects), der Renderer, den Ihr kompiliertes JSX aufruft, die Layout-Engine, die Listenvirtualisierung, die Animation und jedes Modul, das Sie importieren, sind in Rust geschrieben. Parsing, Diffing, Layout und Stringverarbeitung laufen nativ.

Der Effekt ist messbar. Dieselbe Counter-App mit der früheren JS-Runtime von NSH und mit der nativen Runtime (Release-Builds):

| | Frühere JS-Runtime | Native Runtime |
|---|---|---|
| Bundle-Größe | 14 KB JS / 19,6 KB Bytecode | 886 B JS / 1,7 KB Bytecode |
| Auswertung des Bundles | ~390 µs | ~95 µs |
| JS-Zeit eines Taps (Median) | ~14 µs | ~5 µs |
| Commit eines Taps | ~22 µs | ~15 µs |
| Scrollen einer Liste mit 1000 Zeilen, JS pro Rebinding-Frame | ~150 µs | ~77 µs |

Dasselbe gilt für Komponenten: ein als Rust-Komponente geschriebener Button im Vergleich zu einem gleichwertigen TSX-Button, jeweils 200 Stück:

| | Rust-Button: JS / Core | TSX-Button: JS / Core |
|---|---|---|
| Erster Frame (Ops) | 1,32 ms / 0,77 ms (1015) | 2,32 ms / 0,70 ms (2415) |
| Aktualisierung aller 200 Titel (Ops) | 0,42 ms / 0,42 ms (200) | 0,77 ms / 0,36 ms (600) |

(Gemessen auf Apple Silicon; die zweite Tabelle mit der früheren Runtime. Beide stammen aus den Performance-Baselines von NSH.)

**Für Ihren Code:** Halten Sie Event-Handler und berechnete Werte leichtgewichtig. Aufwendige Berechnungen (große Payloads parsen, Tausende Einträge bei jedem Tastendruck sortieren) kosten in QuickJS mehr, als Sie es von V8 oder JavaScriptCore mit JIT gewohnt sind. Führen Sie sie einmal aus, speichern Sie das Ergebnis in einem `computed` oder verlagern Sie sie vom Interaktionspfad weg.

<a id="2-cross-threads-in-batches"></a>

### 2. Threads nur im Batch überqueren

Der Code Ihrer App, ob Rust oder JS, läuft auf einem Engine-Thread, nie auf dem Main-Thread. Ein Durchlauf, zum Beispiel ein Event-Handler mit allem, was er ändert, wird zu **einem Commit**: Die Runtime rendert Komponenten, berechnet das Layout, führt das Diffing durch und erzeugt einen Batch nativer View-Operationen, der den Main-Thread in **einem Sprung** erreicht. Es gibt keine Bridge-Nachricht pro View und keine Serialisierung pro Prop.

**Für Ihren Code:** Sie müssen Schreibzugriffe nicht aus Performance-Gründen bündeln; zehn Aufrufe von `set` in einem Handler erzeugen weiterhin nur einen Commit, in Rust wie in TSX. Verwenden Sie `batch`, wenn Effects und berechnete Werte alle Schreibzugriffe auf einmal sehen sollen, statt nach jedem einzelnen zu laufen.

<a id="3-fine-grained-updates"></a>

### 3. Feingranulare Updates

Komponenten laufen **einmal**, in Rust wie in TSX. Danach laufen nur noch die Bindings erneut, die ein Signal lesen, wenn es sich ändert: ein Text, eine Style-Eigenschaft, ein Zweig von `when` (`<If>`), die Zeilen von `each` (`<Each>`). Nichts rendert einen ganzen Teilbaum neu, um herauszufinden, was sich geändert hat.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**Für Ihren Code:**

- Lesen Sie Signals dort, wo sie verwendet werden (innerhalb von Bindings, `move ||`-Closures in Rust und JSX-Ausdrücken in TSX sowie in `computed` und `effect`), nicht am Anfang einer Komponente, damit das engste Binding aktualisiert wird.
- Verwenden Sie `each` / `<Each>` (Zeilen, die über einen Key erhalten bleiben) oder eine [virtuelle Liste](./lists.md) für Collections; Zeilen, die aus der gesamten Collection neu erzeugt werden (`dynamic` in Rust, ein einfaches `.map()` in JSX), werden bei jeder Änderung vollständig neu angelegt.
- Leiten Sie Werte mit `computed` ab, wenn mehrere Bindings sie verwenden, damit sie nur einmal pro Änderung berechnet werden.

Das Anhängen eines vierten Eintrags an eine Liste mit drei Einträgen, wie `nsh test --trace` es anzeigt:

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

Siehe [Reactivity](./reactivity.md).

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. Nichts senden, was nicht nötig ist

Der Core sendet nur, was sich geändert hat: Neue Views erhalten keinen Default-Style und keine leere Event-Maske, unveränderte Styles und Frames werden nicht gesendet, und eine Änderung der Textfarbe löst kein neues Text-Layout aus. Ein Tap, der eine einzelne Zahl ändert, sendet ein einziges Text-Item. Das sehen Sie in der Ausgabe von `nsh test --trace` (unten).

<a id="5-animate-natively"></a>

### 5. Nativ animieren

Eine Animation, die vom Engine-Thread aus gesteuert wird (ein Signal, das bei jedem Frame geschrieben wird), kostet einen Commit pro Frame, in TSX zusätzlich einen JS-Aufruf, und ruckelt, wenn der Engine-Thread ausgelastet ist. Animierte Werte ([Animation](./animation.md): `animated_value` in Rust, die [Animation-API von `nsh`](../modules/nsh.md#animation) in TSX) führen Animationen stattdessen nativ aus:

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring` und `decay` laufen frameweise auf dem UI-Thread der Plattform, ohne dass pro Frame Arbeit auf dem Engine-Thread anfällt.
- `scroll_value` (`scrollValue`) schreibt einen Scroll-Offset im selben Frame in einen animierten Wert; ein Pan (`pan={{ x, y }}`) lässt Drags eine View direkt bewegen. Ihr Code erfährt vom Ende (die Animation ist abgeschlossen, das Ende des Pans liefert die Geschwindigkeit).
- `Animated.sequence` / `parallel` / `stagger` / `loop` laufen als ein nativer Baum: Jeder Schritt startet in dem Moment, in dem der vorherige endet, ohne Lücke durch das Warten auf JS.
- `LayoutAnimation.configureNext` animiert die Frames, Einfügungen und Entfernungen des nächsten Commits nativ.

<a id="6-virtualize-long-lists"></a>

### 6. Lange Listen virtualisieren

[`List`](./lists.md) hält nur die Zeilen in der Nähe des Viewports vor, recycelt deren Zellen und berechnet Positionen, Spalten, Sticky Header und Viewability nativ. Scroll-Frames, die keine neue Zeile sichtbar machen, führen keinen Code von Ihnen aus und erzeugen keinen Batch; ein Frame, der eine neue Zeile der Fotoliste der Gallery bindet, umfasst 4 Operationen und 4 Mount-Items.

**Für Ihren Code:**

- Geben Sie `estimated_item_size` (`estimatedItemSize`) eine Größe nahe an der tatsächlichen Zeilenhöhe.
- Halten Sie State pro Eintrag in Ihren Daten (über die ID als Key), nicht in Signals, die innerhalb der Zeile erzeugt werden: Zellen werden für andere Einträge wiederverwendet, und die Position der Zeile (`at.index()`; `item()` / `index()` in TSX) ändert sich dabei.
- Halten Sie Zeilen günstig: Eine Zeile wird pro Recycling einmal gebunden, ihr Code läuft also, während der Nutzer scrollt.
- Verwenden Sie `scroll_value` (`scrollValue`) statt `on_scroll` (`onScroll`) für Effects, die der Scroll-Position folgen. Ein Scroll-Listener erhält höchstens ein Event pro Engine-Durchlauf, aber jedes davon ist trotzdem ein Aufruf in Ihren Code (in TSX in JS).

<a id="measuring"></a>

## Messen

### Headless: `--trace`

In einem Rust-Test protokolliert `EngineConfig::trace` dieselben `perf`-Zeilen, und `Headless::observe` sieht jeden Batch ([Testing](./testing-and-trace.md#tracing-with-trace)). `nsh test --trace` gibt sie für TSX aus:

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Worauf Sie achten sollten:

- **ops** (Operationen, die Ihr JS eingereiht hat) und **mount items** (native View-Operationen): Diese sind deterministisch. Wenn ein Tap, der ein einzelnes Label ändern sollte, 40 Items erzeugt, erzeugt etwas Views neu, die es aktualisieren sollte.
- **event js**: die JS-Kosten eines Handlers und dessen, was er ausgelöst hat.
- **commit**: die Kosten des Core für das Rendern von Komponenten, Layout und Diffing.
- **list js**: die JS-Zeit, die während dieses Commits für das Binden von Listenzeilen aufgewendet wurde.

Vollständige Anleitung: [Testing](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### Auf einem Gerät: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

protokolliert dieselben Commit-Zeilen vom echten Host einer TSX-App, mit der plattformeigenen Text-Engine. `NshAppView(trace: true)` und `new NshView(context, true)` tun dasselbe in einer Embedding-App.

<a id="on-screen-58"></a>

### Auf dem Bildschirm: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(`AppOptions { fps: true, .. }` im `run_app` einer Rust-App) zeigt die Framerate und die Kosten von Frames und Commits über der laufenden App an, zusammen mit CPU, GPU und Speicher ([macOS: performance monitor](./macos.md#performance-monitor)). Unter Linux und Windows protokollieren `--target linux --fps` und `--target windows --fps` dieselben Messwerte einmal pro Sekunde, mit der Zeit jeder Phase eines Frames; `nsh test --target linux --fps -v` (oder `windows`) erfasst sie, während ein Test die App steuert.

> [!TIP]
> Einzelmessungen werden vom Taktzustand der CPU dominiert: Ein Thread, der gerade geschlafen hat, läuft eine Weile langsamer. Vergleichen Sie das Minimum mehrerer Durchläufe auf derselben Maschine und bevorzugen Sie für Zeitmessungen Release-Builds.

<a id="reference-numbers"></a>

## Referenzwerte

Gemessene Werte, die Baselines von NSH und die Gallery Seite für Seite unter Linux finden Sie im [Performance-Bericht](./performance-report.md).

<a id="checklist"></a>

## Checkliste

- Sprache: Schreiben Sie die App oder die am meisten genutzten Teile in Rust ([Building with Rust](./rust.md)); nutzen Sie TSX für das, was sich oft ändert oder zur Laufzeit ausgeliefert wird.
- Interaktionen: Ein Tap ändert eine Handvoll Mount-Items, nicht Dutzende.
- Listen: eine virtuelle Liste (`virtual_list`, `List`) für alles Lange, mit geschätzter Item-Größe; State pro Eintrag in den Daten.
- Animationen: animierte Werte, keine Signals, die bei jedem Frame geschrieben werden.
- Scroll-Effekte: `scroll_value` (`scrollValue`), kein Scroll-Listener.
- Handler: keine aufwendige Arbeit pro Tastendruck oder pro Scroll-Event; Ergebnisse in `computed` zwischenspeichern.

<a id="see-also"></a>

## Siehe auch

- [Performance-Bericht](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md), [Animation](./animation.md), [Reactivity](./reactivity.md)
