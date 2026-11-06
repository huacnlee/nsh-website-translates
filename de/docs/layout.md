---
title: "Layout"
description: "Flexbox mit Spaltenrichtung als Standard, CSS Grid, Größen und Prozentwerte, Seitenverhältnis, absolute Positionierung, Messen mit onLayout, responsive Layouts und Rechts-nach-links-Unterstützung, in Rust und TSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---


# Layout

NSH layoutet jedes Element mit [Taffy](https://github.com/DioxusLabs/taffy), einer Rust-Implementierung von CSS Flexbox, Grid und Block-Layout. Taffy ist so konfiguriert, dass Kinder standardmäßig vertikal gestapelt werden und nicht schrumpfen. Das Layout läuft im Core nach jedem Durchlauf Ihres Codes, und nur die geänderten Frames werden an die nativen Views gesendet. Text wird von der Text-Engine der Plattform im selben Thread gemessen, sodass das Layout nie auf den Main-Thread wartet.

Die folgenden Layout-Eigenschaften sind Style-Eigenschaften. In Rust sind es typisierte Style-Methoden (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`); in TSX sind es Schlüssel des Props `style`, und jede hat eine [Tailwind](./tailwind.md)-Klasse (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...). Beide werden in dieselben nativen Styles übersetzt.

## Flexbox

Eine View layoutet ihre Kinder mit Flexbox. Eine View, die kein `display` setzt, stapelt ihre Kinder in einer Spalte; `display: "flex"` in einem Style erzeugt eine Zeile, sofern `flexDirection` nicht gesetzt ist, genau wie in CSS und wie Tailwinds Klasse `flex`. Wo nichts davon gesetzt ist, gelten diese Standardwerte:

| Eigenschaft | NSH-Standard | Web-Standard |
|---|---|---|
| `flexDirection` | `"column"` (eine View ohne `display`); `"row"`, sobald `display: "flex"` gesetzt ist | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (Grids: `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| Eigenschaft | Werte | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | Hauptachse: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Querachse: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | Ausrichtung eines einzelnen Kindes auf der Querachse; `"auto"` folgt dem `alignItems` des Elternelements | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | Zeilen eines umbrechenden Containers | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | Eine Kurzschreibweise mit einer einzelnen Zahl (siehe unten) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | Wie in CSS | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | Abstand zwischen Kindern | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)` und die Stufen `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` und `flex-end` folgen der Flex-Richtung; `start` und `end` folgen der Schreibrichtung, wie in CSS (bei Rechts-nach-links ist `start` die rechte Seite), und `self-start` / `self-end` der des Kindes selbst.

`flex` ist die Kurzschreibweise von CSS, ebenso wie Tailwinds Klassen `flex-*`: Eine Zahl `n` bedeutet, dass die View um `n` wächst, um 1 schrumpft und mit einer Basis von 0 startet. So teilen sich `flex: 1`-Geschwister (`.flex_1()` in Rust, `flex-1`) den Platz gleichmäßig auf, unabhängig von ihrem Inhalt; `"none"` ist `0 0 auto` (die View behält ihre Größe), `"auto"` ist `1 1 auto`, `"initial"` ist `0 1 auto`, und Grow, Shrink und Basis können einzeln ausgeschrieben werden (`"2 0 50%"`, `"1 1 120px"`). Da Mindestgrößen standardmäßig 0 sind, schrumpft `flex: 0` (`0 1 0`) eine View auf nichts zusammen, es sei denn, `minWidth: "auto"` erhält die Größe ihres Inhalts.

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

Da Mindestgrößen standardmäßig 0 sind, schrumpft ein Text mit `flex: 1` in einer Zeile und bricht um, statt seine Geschwister hinauszudrängen. `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`, `.min_w(auto())` in Rust) ist das automatische Minimum von CSS: Ein schrumpfendes Element hört bei der kleinsten Größe seines Inhalts auf, bei einem Text also beim längsten Wort, wie im Web.

> [!NOTE]
> `display: "flex"` bedeutet eine Zeile, in einem Style, einer Klasse (`flex`) und in Rust (`.flex()`) gleichermaßen, sofern keine Richtung gesetzt ist: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. Eine View ohne `display` braucht nichts, um eine Spalte zu sein.

<a id="sizes"></a>

## Größen

| Eigenschaft | Werte | Rust |
|---|---|---|
| `width`, `height` | Punkte, ein Prozentwert des Elternelements (`"50%"`) oder `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, die Stufen `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Punkte oder Prozentwerte; `minWidth` / `minHeight` auch `"auto"`, die kleinste Größe des Inhalts | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | Breite geteilt durch Höhe: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | Punkte oder Prozentwerte | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ... und die Stufen `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | Punkte, Prozentwerte oder `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

In Rust ist eine Länge typisiert: `px(16.0)` sind 16 Punkte, `relative(0.5)` sind 50 % des Elternelements, `auto()` ist `auto`. Die Stufen-Methoden folgen Tailwinds Abstandsskala mit 4 Punkten pro Stufe (`.p_4()` sind 16 Punkte, `.gap_0p5()` 2 Punkte).

Ohne Größenangabe ist eine View so groß wie ihr Inhalt (plus Padding) und wird durch das Standard-`alignItems: "stretch"` über die Querachse ihres Elternelements gestreckt. Prozentwerte beziehen sich auf die Größe des Elternelements (bei Padding und Margin wie in CSS auf dessen Breite).

`aspectRatio` bestimmt die jeweils andere Dimension aus der bekannten:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

Bilder aus den Assets der App haben eine natürliche Größe und werden in dieser gelayoutet, wenn keine Größe angegeben ist ([Bilder und Assets](./images-and-assets.md)). Entfernte Bilder haben keine Größe, bevor sie geladen sind: Geben Sie ihnen eine.

## Grid

`display: "grid"` (`.grid()` in Rust) layoutet Kinder in CSS-Grid-Tracks:

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| Eigenschaft | Werte | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | CSS-Track-Listen: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, Linienbezeichner | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | Tracks implizit erzeugter Spalten und Zeilen | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, eine Linienummer oder ein Linienname: `"content-start / content-end"`, `"2 col"` (die zweite Linie mit dem Namen `col`), `"span col"` (bis zur nächsten Linie mit dem Namen `col`) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Linienummern oder -namen | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (Linienummern) |
| `justifyItems`, `justifySelf` | Wie Elemente in ihren Bereichen entlang der Zeile sitzen: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | Wie Elemente in ihren Bereichen entlang der Spalte sitzen | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | Wie die Tracks im Grid entlang der Zeile und der Spalte sitzen | `.justify_*()` |

Templates benennen ihre Linien in eckigen Klammern, mit einem oder mehreren Namen pro Linie, und Elemente werden wie in CSS anhand dieser Namen platziert (in Rust anhand der Nummern der Linien):

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

In einem Grid sind `justifyContent` und `alignContent` standardmäßig CSS' `"normal"`: Tracks mit der Größe `auto` werden gestreckt, um den Container zu füllen, sodass ein Grid mit einer Höhe und ohne Zeilen-Template diese Höhe auf seine Zeilen verteilt. Ein explizit gesetzter Wert (`"start"`, `"center"`, `"space-between"`, ...) platziert die Tracks wie in CSS. Die Ausrichtungsklassen setzen genau das, was Tailwind CSS setzt: `content-start` (`align-content: flex-start`) und `place-content-start` packen die Tracks an den Anfang, und `content-normal` und `justify-normal` strecken sie, wie in einem Browser.

`display: "block"` verwendet das CSS-Block-Layout (Kinder gestapelt, jedes so breit wie der Container), und `display: "none"` (`.hidden()`) entfernt die View aus dem Layout.

<a id="absolute-positioning"></a>

## Absolute Positionierung

`position: "absolute"` (`.absolute()`) nimmt eine View aus dem Fluss und platziert sie relativ zu ihrem Elternelement mit `top`, `right`, `bottom` und `left`:

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

Offsets akzeptieren Punkte und Prozentwerte (`.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)` in Rust). Eine View mit `left` und `right` (oder `top` und `bottom`) und ohne Größe wird zwischen diesen gestreckt. Spätere Geschwister werden über früheren gezeichnet; `zIndex` (`.z_index(n)`) ändert die Reihenfolge.

<a id="measuring"></a>

## Messen

`onLayout` (`.on_layout(..)`) meldet den Frame einer View relativ zu ihrem Elternelement nach jedem Layout, in dem er sich geändert hat:

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

Der Frame ist in Punkten angegeben: `Bounds<Points>` in Rust, `{ bounds }` in TSX, ein `Bounds` (`{ origin: { x, y }, size: { width, height } }`). Für das gesamte Fenster lesen Sie `window()` in Rust oder `windowSize()` aus [`nsh`](../modules/nsh.md#device) in TSX; beide folgen Rotation und Größenänderung des Fensters, und ein Style, der sie liest, ändert sich mit dem Fenster:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Tailwinds Breakpoints (`sm:`, `md:`, ...) und `portrait:` / `landscape:` liefern dasselbe Ergebnis ohne Code.

## Safe Areas

Die Root-View deckt den gesamten Bildschirm ab, unter der Statusleiste und dem Home-Indikator. Versehen Sie Screens mit Padding in Höhe der Safe-Area-Insets, indem Sie das CSS-`env()` verwenden (`paddingTop: "env(safe-area-inset-top)"`, Tailwind `pt-[env(safe-area-inset-top)]`, `.p_safe_area()` in Rust; siehe [Safe Area](../elements/safe-area.md)), oder lesen Sie die Insets mit `safe_area()` in Rust bzw. `safeArea()` / `safeAreaInsets()` in TSX aus und wenden Sie sie selbst an. Seiten eines [Navigationsstacks](./navigation.md) liegen bereits unterhalb ihres Headers.

<a id="right-to-left"></a>

## Rechts-nach-links

Die Layout-Richtung der App folgt der Systemsprache, und der Style `direction` einer View (`"ltr"`, `"rtl"` oder `"inherit"`; `.direction(LayoutDirection::Rtl)` in Rust) legt die Richtung ihres Teilbaums fest. Wenn die App von rechts nach links layoutet:

- Zeilen laufen von rechts;
- `left` und `right` behalten ihre Seiten, wie in einem Browser, bei Style-Schlüsseln und Klassen gleichermaßen: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` und `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` bleiben links;
- die logischen Eigenschaften folgen der Richtung, wobei der Inline-Start die rechte Seite ist: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (`ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start` als Klassen; `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ... in Rust); `marginHorizontal` und `paddingHorizontal` setzen beide Seiten;
- Text mit `textAlign: "auto"` wird rechtsbündig ausgerichtet, und native Controls werden gespiegelt.

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

Änderungen der Richtung, sei es der Sprache oder einer View, werden sofort wirksam, ohne Neustart. Der Style `direction` hält außerdem eine View und ihre Kinder in einer eigenen Richtung, zum Beispiel eine Telefonnummer von links nach rechts. Unter Android benötigen Apps, die NSH einbetten, `android:supportsRtl="true"` in ihrem Manifest, damit native Controls gespiegelt werden.

<a id="related"></a>

## Siehe auch

- [Styling](./styling.md): wie Styles kombiniert werden.
- [Scrollen](./scrolling.md) und [Listen](./lists.md): Inhalte, die größer als der Bildschirm sind.
- [Style-Referenz](../modules/style-reference.md): jede Layout-Eigenschaft und ihr Typ.
