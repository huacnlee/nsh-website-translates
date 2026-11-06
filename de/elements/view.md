---
title: "View"
description: "Das grundlegende Container-Element: Layout, Hintergründe, Rahmen, Schatten, Press-Handling und Gesten."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---


# View

`View` ist der Baustein jedes Screens: ein nativer Container (eine UIView auf iOS und Mac Catalyst, eine ViewGroup auf
Android), der seine Kinder mit Flexbox oder Grid anordnet, einen Hintergrund, Rahmen, Schatten und Verläufe zeichnet und
Presses verarbeitet. Buttons, Karten, Zeilen und Screens sind alle Views. Rust erzeugt eine View mit `view()`, TSX mit `<View>` aus `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

## Layout

Eine View ordnet ihre Kinder mit Flexbox an, mit diesen Standardwerten: `flexDirection: "column"`, `flexShrink: 0`,
`alignContent: "flex-start"`, `position: "relative"`. `display: "grid"` (`.grid()` in Rust) schaltet auf CSS Grid um, und
`display: "block"` auf Block-Layout. Größen sind in Punkten angegeben. Siehe [Layout](../docs/layout.md) und die
[Style-Referenz](../modules/style-reference.md).

`display: "flex"` folgt CSS: In einem Style, als die Klasse `flex` und als Rusts `.flex()` ist es eine Zeile, sofern keine Richtung
gesetzt ist (`flexDirection: "column"`, `flex-col`, `.flex_col()`). Eine View, die kein Display setzt, stapelt ihre Kinder in einer Spalte.

## Props

`View` hat eine eigene Prop, `selectable` (`.selectable(true)` in Rust): Die Texte innerhalb der View werden gemeinsam als eine einzige Auswahl markiert ([Textauswahl](./text-selection.md)). Die übrigen sind die [allgemeinen Props](./index.md#common-props): ihre Styles (`style`, `class`,
`classList`; die `Styled`-Methoden in Rust), `disabled`, die Press-Props (`onPress`, `onLongPress`, `onPressDown`,
`onPressUp`, `delayLongPress`, `hitSlop`), die Zustands-Styles (`activeStyle`, `hoverStyle`,
`focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`,
`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, die
Gesten-Props (`pan`, `pinch`, `rotation` und ihre Events), die Touch- und Responder-Props, die Accessibility-Props
und `ios` / `android` / `desktop`.

<a id="selectable-views"></a>

## Auswählbare Views

Mit `selectable` verläuft eine Auswahl in Lesereihenfolge über die [`Text`](./text.md)-Elemente und [`TextView`](./text-view.md)s innerhalb
der View; Texte mit `selectable={false}` bleiben außen vor, und eine auswählbare View innerhalb einer anderen ist Teil
der äußeren. Siehe [Textauswahl](./text-selection.md) für die Gesten auf jeder Plattform.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

## Press-Feedback

Eine drückbare View ist jede View mit einem Press-Handler. Ihr Feedback gehört der App: ein Style während des Drückens, der nativ angewendet wird,
solange der Finger aufliegt, ohne Umweg über den Code der App. `hoverStyle`, `focusStyle` und `disabledStyle` leisten
dasselbe für die anderen Zustände:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

Auf Android fügt `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` in Rust) den Material-
Ripple hinzu (`borderless`, `radius` und `foreground` passen ihn an).

`disabled` entfernt die Press-Listener von der nativen View (kein Press, kein Feedback) und wendet die Disabled-Styles an:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (in Rust keiner) | Ein Tap endete innerhalb der View. |
| `onLongPress` | `.on_long_press` | `PressEvent` (in Rust keiner) | Der Finger blieb für `delayLongPress` (500 ms) aufgelegt. |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (in Rust keiner) | Ein Finger wurde aufgelegt / abgehoben oder hat die View verlassen. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | Die Maus kam über die View (oder eine View darin) / verließ sie oder das Fenster ([Hover](./index.md#hover)); bei `onMouseLeave` ist es die Position, an der sie zuletzt war. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | Die Maus bewegte sich über der View (oder einer View darin), mit oder ohne gedrückte Taste, oder eine Modifikatortaste wurde gedrückt oder losgelassen, während sie dort ohne gedrückte Taste ruht: `position`, `pagePosition` (`Point`s), `modifiers` und `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` oder `null`); höchstens einmal pro Frame. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | Die sekundäre Taste wurde über der View gedrückt ([Kontextmenüs](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | keiner | Ein Drag lokaler Dateien betrat / verließ das aktive Desktop-Ziel. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | Lokale Dateien oder Verzeichnisse wurden auf dem Desktop-Ziel abgelegt. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | Der Frame relativ zum Parent hat sich geändert. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | Ein mit `pan` gebundener Drag wurde gestartet / beendet; `cancelled` ist true, wenn das System ihn abbricht. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | Ein mit `pinch` gebundener Pinch wurde gestartet / beendet. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | Eine mit `rotation` gebundene Rotation wurde gestartet / beendet. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | Eine benutzerdefinierte Accessibility-Aktion wurde ausgeführt. |

Touch- und Responder-Events: siehe [allgemeine Props](./index.md#raw-touches-and-the-responder-system).

<a id="desktop-file-drops"></a>

## Datei-Drops auf dem Desktop

Auf AppKit, GTK, Win32 und GPUI empfängt eine View mit `onFileDrop` lokale Dateien und Verzeichnisse, die aus einer anderen
Anwendung hineingezogen werden. `onFileDragEnter` und `onFileDragLeave` verfolgen das aktive Ziel; `onFileDrop` empfängt
`{ uris: string[] }` in der nativen Reihenfolge der Dateiliste. Jeder Eintrag ist eine absolute `file:`-URL mit maskierten Leerzeichen und
Nicht-ASCII-Zeichen. Parsen Sie die URL, um einen Dateisystempfad zu erhalten, anstatt das Präfix von Hand zu entfernen.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

Der nächstgelegene aktivierte Vorfahre, der auf `onFileDrop` lauscht, empfängt den Drop. Ein modales Root begrenzt diese Suche. `disabled`
entfernt die Listener für Datei-Drag-and-Drop; Verlassen, Abbruch, Abschluss und Entfernen des Ziels setzen den aktiven Zustand zurück.
Die Annahme verwendet die Copy-Operation und den gemounteten nativen Zustand. Die App entscheidet, ob sie die
empfangenen Dateien liest, öffnet oder überträgt.

<a id="ref-methods"></a>

## Ref-Methoden

Die Ref einer einfachen View ist ein `ViewRef`: `focus()`, `blur()` und `measure()`. `ref` (`.element_ref(&handle)` in Rust) liefert ihren Node, z. B. um ihn an
`setAccessibilityFocus` zu übergeben ([Accessibility-API von `nsh`](../modules/nsh.md#accessibility)) oder um sie zu messen
(`handle.measure()` in Rust).

<a id="views-inside-text"></a>

## Views innerhalb von Text

Eine View, die innerhalb eines Textes platziert wird, ist ein Inline-Anhang: Sie sitzt auf der Grundlinie, wird mit den Wörtern umbrochen und nimmt
eigene Presses entgegen. Siehe [Text](./text.md#inline-views-and-images).

<a id="platform-notes"></a>

## Plattformhinweise

- `boxShadow` zeichnet auf jeder Plattform; `android={{ elevation }}` liefert stattdessen Androids Material-Schatten. Auf Android benötigt ein Schatten eine
  Hintergrundfarbe (eine View mit transparentem Hintergrund wirft keinen).
- `filter` auf Views: iOS unterstützt `opacity()`, `brightness()` bis 1 und `drop-shadow()` (Bilder akzeptieren jeden Farbfilter und
  `blur()`); Android unterstützt alle ab API 31, darunter die Farbfilter.
- `backdropFilter: "blur(…)"` ist auf iOS ein System-Material (eine Annäherung) und erfordert auf Android API 31.
- Android zeichnet `translate`-, `scale`- und `rotate`-Transformationen; Skews (`skew()`, `skewX()`, `skewY()`) werden auf den anderen Plattformen angewendet.
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) zeichnet Ecken, die sanft in die Kanten übergehen (wie
  bei iOS-App-Icons), auf beiden Plattformen.
- Der Style `cursor` wird angewendet, wo es einen Zeiger gibt (Mac Catalyst, iPad mit Zeiger, Desktops).
