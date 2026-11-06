---
title: "Stilreferenz"
description: "Alle Stilschlüssel, die NSH akzeptiert, gruppiert nach LayoutStyle, ViewStyle, TextStyle, InputStyle und ImageStyle, jeweils mit Typ und Bedeutung."
order: 16
source_hash: 012ce37fb9fe065c
---


# Stilreferenz

Diese Seite listet jeden Key der `style`-Prop auf, dazu die Methode von `Styled`, die ihn in Rust setzt. Rust-Komponenten stylen Elemente mit typisierten Methoden, die nach Tailwinds Utilities benannt sind (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`, aus `nsh_core::prelude`) und auf dieselben Keys abgebildet werden; TSX übergibt `style`-Objekte (und Klassen). Die Rust-Spalte nennt die Methode; die meisten Methoden akzeptieren einen Wert, ein Signal oder eine Closure, und `.style_when(…)` / `.style_with(…)` machen jede davon bedingt. Die Keys und ihre Typen stammen aus den generierten Deklarationen in `.nsh/types/nsh/types.d.ts`, sodass dein Editor sie beim Tippen prüft. Ein Style-Key steht für die CSS-Eigenschaft gleichen Namens, genau wie die Klasse, die sie setzt: `paddingLeft` ist CSS' `padding-left` und `pl-4`, `boxShadow` ist `box-shadow` und `shadow-md`; einige Keys haben schlichtere Namen, wie Apps sie schreiben (`paddingHorizontal` für `padding-inline`, `marginStart` für `margin-inline-start`, `numberOfLines` für `line-clamp`). Zahlen sind Punkte, und auch die CSS-Features sind vorhanden: Grid, Verläufe, Box-Shadows, Filter, Blend-Modes, Outlines, Transforms, Transitions und Keyframe-Animationen.

Wie du Styles anwendest, mit Klassen kombinierst und Textstile vererbst, steht unter [Styling](../docs/styling.md). Die Klassensyntax findest du in der [Tailwind-Referenz](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## Die fünf Interfaces

Jedes Interface erweitert das vorherige:

| Interface | Erweitert | Verwendet von |
|---|---|---|
| `LayoutStyle` | | Layout jedes Elements (Flexbox, Grid, Größen, Abstände, Position) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, Controls und jedes andere Element |
| `TextStyle` | `ViewStyle` | `<Text>` und `<Input>` (und Views, deren Textstile an den Text in ihnen weitergegeben werden) |
| `InputStyle` | `TextStyle` | `<Input>`: ergänzt `placeholderColor` und `caretColor` |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style` akzeptiert auch ein Array; die Einträge werden von links nach rechts zusammengeführt, und falsy-Einträge werden übersprungen, sodass bedingte Styles kein Spreading brauchen. In Rust fügt `.style_when(condition, …)` Styles hinzu, solange die Bedingung zutrifft:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> Das Inline-`style` hat immer Vorrang vor `class`. Wird ein Key auf `null` oder `undefined` gesetzt, wird er auf seinen Standardwert zurückgesetzt.

<a id="how-style-keys-read"></a>

## Wie Style-Keys zu lesen sind

Style-Keys folgen CSS, daher bewirken ein Style und eine Klasse, die dieselbe Eigenschaft benennen, dasselbe:

- **Layout-Richtung.** Eine View ohne `display` ordnet ihre Kinder in einer Spalte an. `display: "flex"` ergibt eine Zeile, sofern nicht `flexDirection` gesetzt ist, wie in CSS und bei der Klasse `flex`. `flexShrink` ist `0`, sofern nicht anders gesetzt.
- **Physische und logische Seiten.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` und `textAlign: "left"` behalten ihre Seite auch in Right-to-Left-Layouts. Die Start- und End-Keys (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), die `borderTopStartRadius`-Familie und `textAlign: "start" | "end"` folgen der Richtung: Inline-Start ist in Left-to-Right-Layouts links und in Right-to-Left-Layouts rechts.
- **Rahmenfarben.** Ein Rahmen oder eine Outline, deren Breite gesetzt ist, deren Farbe aber nicht, wird in der Textfarbe gezeichnet (CSS' `currentColor`).
- **Transforms.** `translate`, `rotate` und `scale` sind eigene Eigenschaften, und `transform` akzeptiert CSS' String aus Funktionen oder eine Liste von Schritten, deren Beträge animierte Werte sein können. Sie werden in dieser Reihenfolge angewendet: `translate`, `rotate`, `scale`, dann `transform`.

<a id="value-types"></a>

## Werttypen

| Typ | Akzeptiert | Rust |
|---|---|---|
| `number` | Punkte (dichteunabhängig). `1` entspricht auf iOS einem Punkt und auf Android einem dp. | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (Punkte), `` `${number}%` `` (des Elternelements) oder `"auto"`. | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (Punkte) oder `` `${number}%` ``. Kein `"auto"`. | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | Ein CSS-Farbstring: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()` oder eine benannte CSS-Farbe (`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, Theme-Farben (`theme().primary`) |
| `EnvValue` | Eine Umgebungsvariable in einem Padding oder Margin: `env(name)`, `env(name, <length>)` (die Länge steht stellvertretend für einen unbekannten Namen), `calc(env(name) + <length>)` oder `calc(<length> + env(name))`. Die Namen sind `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Safe Area](../elements/safe-area.md)) und `keyboard-inset-height` ([Tastatur](../elements/keyboard.md)). Wird von den physischen Padding- und Margin-Keys und ihren Kurzformen akzeptiert. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | Ein nativer animierter Wert oder ein davon abgeleiteter Knoten (siehe [Animations-API von `nsh`](./nsh.md#animation)). Wird akzeptiert von `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, den Schritten einer `transform`-Liste sowie `top` / `left` einer Sticky-View; der Wert wird dann ohne JS auf dem UI-Thread animiert. | `AnimatedValue` / `AnimatedNode`, gebunden mit `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... |

Strings mit CSS-Syntax (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) akzeptieren Längen in `px` und als reine Zahlen (beides Punkte), `pt` (4/3 Punkt, wie in CSS) oder `rem` (16 Punkte).

## LayoutStyle

Das Layout wird in Rust berechnet (Flexbox und CSS Grid). Eine View ohne `display` ist ein Flex-Container, dessen Kinder in einer Spalte gestapelt werden; `display: "flex"` macht daraus eine Zeile, sofern nicht `flexDirection` gesetzt ist, wie in CSS. Elemente haben standardmäßig `flexShrink: 0`, `alignContent: "flex-start"` (Grids: CSS' `"normal"`), `alignItems: "stretch"` und keine automatische Mindestgröße. Siehe [Layout](../docs/layout.md).

<a id="display-and-position"></a>

### Display und Position

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | Das Layout der Kinder. `"flex"` ordnet sie in einer Zeile an, sofern `flexDirection` keine Richtung setzt, wie in CSS; eine View ohne display ordnet sie in einer Spalte an. `"none"` nimmt das Element aus dem Layout und blendet es aus. `"block"` stapelt Kinder wie das CSS-Block-Layout. |
| `boxSizing` | `"border-box" \| "content-box"` | | Die Abmessungen schließen Rahmen und Padding ein oder nur den Inhalt. Standard `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` nimmt das Element aus dem Fluss und platziert es per `top` / `right` / `bottom` / `left` relativ zu seinem nächsten positionierten Vorfahren (seinem Elternelement, sofern dieses nicht `"static"` ist). `"static"` bleibt im Fluss und ignoriert Insets. `"fixed"` behält den Elementtyp bei, legt es in seiner Surface oder seinem Modal-Root aus und mountet es dort, sodass es an seinem Platz bleibt, während der umgebende Inhalt scrollt. `"sticky"` bleibt im Fluss und haftet, solange sein Elternelement sichtbar ist, mit `top` (`left` in einer horizontalen Scroll-View) vom Anfang des Viewports der umgebenden Scroll-View, bis sein Ende auf das Ende der Content-Box des Elternelements trifft; es wird über seinen Geschwistern desselben `zIndex` gezeichnet. Standard `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | Abstand zur oberen Kante des Elternelements (absolute) oder zur eigenen Position des Elements (relative). Bei einer Sticky-View: wo sie haftet; ein animierter Wert verschiebt dies in jedem Frame. |
| `right` | `DimensionValue` | `.right(…)` | Abstand zur rechten Kante, in beiden Richtungen. |
| `bottom` | `DimensionValue` | `.bottom(…)` | Abstand zur unteren Kante. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | Abstand zur linken Kante, in beiden Richtungen. Bei einer Sticky-View in einer horizontalen Scroll-View: wo sie haftet; ein animierter Wert verschiebt dies in jedem Frame. |
| `start` | `DimensionValue` | | Abstand zur Inline-Start-Kante: links in Left-to-Right-Layouts, rechts in Right-to-Left-Layouts. |
| `end` | `DimensionValue` | | Abstand zur Inline-End-Kante: rechts in Left-to-Right-Layouts, links in Right-to-Left-Layouts. |
| `zIndex` | `number` | `.z_index(z)` | Reihenfolge unter Geschwistern (stabil bei gleichen Werten); zugleich die native Stapelreihenfolge. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | Layout-Richtung, standardmäßig vererbt. Wie in CSS behalten `left`- und `right`-Eigenschaften ihre Seiten auch bei Right-to-Left, während die Inline-Start-/End-Eigenschaften (`marginStart`, `end`, ...) die Seiten nehmen, die die Richtung ihnen zuweist. |

### Flexbox

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | Die Hauptachse. Standard `"column"` für eine View ohne `display`, `"row"`, sobald `display: "flex"` gesetzt ist. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | Ob Kinder auf mehrere Zeilen umbrechen. Standard `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | Eine einzelne Zahl, nicht die CSS-Kurzform: Eine positive Zahl setzt `flexGrow` auf diesen Wert, `flexShrink: 1` und `flexBasis: 0`; `0` macht das Element unflexibel; eine negative Zahl schrumpft es bis auf seine Mindestgröße. |
| `flexGrow` | `number` | `.flex_grow(f)` | Wie viel des freien Platzes das Element einnimmt. Standard `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | Wie stark das Element schrumpft, wenn der Platz ausgeht. Standard `0`, nicht `1` wie in CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | Die Größe auf der Hauptachse, bevor freier Platz verteilt wird. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | Verteilung der Kinder entlang der Hauptachse. Standard `"normal"`: `"flex-start"` in Flex-Containern; in Grids werden Tracks mit der Größe `auto` gestreckt. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | Ausrichtung der Kinder auf der Querachse. Standard `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | Überschreibt `alignItems` des Elternelements für dieses Element. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | Verteilung umgebrochener Zeilen (und Grid-Tracks) auf der Querachse. Standard `"flex-start"` in Flex-Containern und `"normal"` in Grids, wo Tracks mit der Größe `auto` gestreckt werden. `"start"` / `"end"` folgen der Schreibrichtung. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | Abstand zwischen Zeilen und Spalten der Kinder. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | Abstand zwischen Zeilen. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | Abstand zwischen Spalten. |

### Grid

Setze `display: "grid"`, um Kinder in einem CSS Grid anzuordnen. Track-Listen verwenden CSS-Syntax.

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Spalten-Tracks: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, Linienamen (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Zeilen-Tracks, gleiche Syntax. |
| `gridAutoColumns` | `string` | | Größe implizit erzeugter Spalten. |
| `gridAutoRows` | `string` | | Größe implizit erzeugter Zeilen. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | Wie Elemente ohne Platzierung das Grid füllen. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Spaltenplatzierung: `"1 / 3"`, `"span 2"`, eine Linienummer oder ein Linienname (`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | Start-Spaltenlinie. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | End-Spaltenlinie. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Zeilenplatzierung, gleiche Syntax wie `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | Start-Zeilenlinie. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | End-Zeilenlinie. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Wie Grid-Elemente in ihren Bereichen entlang der Zeile sitzen. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Überschreibt `justifyItems` für dieses Element. |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

<a id="size"></a>

### Größe

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | Breite. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | Höhe. |
| `minWidth` | `LengthValue` | `.min_w(…)` | Mindestbreite. |
| `minHeight` | `LengthValue` | `.min_h(…)` | Mindesthöhe. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | Maximalbreite. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | Maximalhöhe. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | Breite geteilt durch Höhe, als Zahl (`1.5`) oder als CSS-Verhältnis (`"16 / 9"`); die fehlende Abmessung wird aus der anderen berechnet. `"auto"` setzt keines. |

### Margin

Margins akzeptieren `"auto"` (nimmt freien Platz auf, wie in Flexbox) und negative Werte. Die physischen Keys (alle außer `marginStart` / `marginEnd`) akzeptieren auch eine `EnvValue`: `marginBottom: "env(keyboard-inset-height)"` (Rust `.mb_keyboard()`, `.mt_safe_area()`, ...).

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | Alle vier Seiten. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | Links und rechts. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | Oben und unten. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | Oben. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | Rechts. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | Unten. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | Links. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Inline-Start: links in Left-to-Right-Layouts, rechts in Right-to-Left-Layouts. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Inline-Ende: die gegenüberliegende Seite von `marginStart`. |

### Padding

Die physischen Keys (alle außer `paddingStart` / `paddingEnd`) akzeptieren auch eine `EnvValue`: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Ein Padding ist mindestens 0.

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | Alle vier Seiten. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | Links und rechts. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | Oben und unten. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | Oben. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | Rechts. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | Unten. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | Links. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Inline-Start: links in Left-to-Right-Layouts, rechts in Right-to-Left-Layouts. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Inline-Ende: die gegenüberliegende Seite von `paddingStart`. |

## ViewStyle

Alles, was eine View zeichnet. Alle Keys von `LayoutStyle` gelten ebenfalls.

<a id="background"></a>

### Hintergrund

| Key | Typ | Rust | Beschreibung |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | Die Füllfarbe. Akzeptiert eine native animierte Farbe. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` mit `.gradient_from` / `_via` / `_to` | CSS-Verläufe, die über der Hintergrundfarbe gezeichnet werden: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, mehrere durch Kommas getrennt. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### Rahmen

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | Breite aller vier Seiten. |
| `borderTopWidth` | `number` | `.border_t(w)` | Obere Seite. |
| `borderRightWidth` | `number` | `.border_r(w)` | Rechte Seite. |
| `borderBottomWidth` | `number` | `.border_b(w)` | Untere Seite. |
| `borderLeftWidth` | `number` | `.border_l(w)` | Linke Seite. |
| `borderStartWidth` | `number` | `.border_s(w)` | Seite am Inline-Anfang (links bei Layouts von links nach rechts, rechts bei Layouts von rechts nach links). |
| `borderEndWidth` | `number` | `.border_e(w)` | Seite am Inline-Ende. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | Farbe aller vier Seiten. Akzeptiert eine native animierte Farbe. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | Obere Seite. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | Rechte Seite. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | Untere Seite. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | Linke Seite. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | Seite am Inline-Anfang. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | Seite am Inline-Ende. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | Linienstil. Standard ist `"solid"`. `"none"` und `"hidden"` zeichnen und layouten keinen Rahmen, unabhängig von den Breiten, ob davor oder danach gesetzt, wie in CSS. |

Eine Seite, deren Breite gesetzt ist und deren Farbe nichts festlegt, wird in der Textfarbe gezeichnet, CSS' `currentColor`: `{ borderWidth: 1, color: "#2563eb" }` zeichnet einen blauen Rahmen. Konturen übernehmen die Textfarbe auf dieselbe Weise.

<a id="corners"></a>

### Ecken

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | Radius aller vier Ecken. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | Obere linke Ecke. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | Obere rechte Ecke. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | Untere rechte Ecke. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | Untere linke Ecke. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | Obere Ecke am Inline-Anfang. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | Obere Ecke am Inline-Ende. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | Untere Ecke am Inline-Anfang. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | Untere Ecke am Inline-Ende. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: Ecken, deren Krümmung sanft in die Kanten übergeht, wie bei iOS-App-Symbolen. Ist die Box zu klein, fällt die Kurve auf einen Kreisbogen zurück, sodass Kapselformen Kapselformen bleiben. Funktioniert auf beiden Plattformen. |

<a id="outline"></a>

### Kontur

Eine Kontur wird außerhalb des Rahmens gezeichnet und beansprucht im Layout keinen Platz.

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | Linienbreite. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | Linienfarbe. Standard ist die Textfarbe. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | Linienstil. |
| `outlineOffset` | `number` | `.outline_offset(o)` | Abstand zur Rahmenkante; negative Werte verschieben sie nach innen. |

<a id="shadows"></a>

### Schatten

Eine View wirft Schatten mit CSS' `boxShadow`: mehrere Ebenen, Spread- und Inset-Schatten. Transitions animieren sie (`transitionProperty: "boxShadow"`).

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | CSS `box-shadow`: Versätze, Unschärfe, Spread und Farbe, mehrere Ebenen durch Kommas getrennt, `inset` für innere Schatten; oder seine Ebenen als Zahlen, `[{ x, y, blur, spread, color, inset }]` (nur `x` und `y` erforderlich); eine Ebene ohne Farbe wird in der Textfarbe gezeichnet, wie CSS' `currentColor`. `.shadow_color(c)` färbt die Ebenen eines Presets oder von `.shadow(…)` um. |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> Unter Android benötigen Schatten einen Hintergrund: Eine View mit transparentem Hintergrund (zum Beispiel Text auf nichts) wirft keinen Schatten. Für Androids Material-Schatten verwende stattdessen die Prop `android={{ elevation }}` anstelle eines Styles.

<a id="opacity-visibility-and-overflow"></a>

### Deckkraft, Sichtbarkeit und Overflow

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | 0 (unsichtbar) bis 1. Akzeptiert einen nativen animierten Wert. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | Ausgeblendete Views behalten ihren Platz im Layout (anders als `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` beschneidet Kinder auf die Grenzen (und Ecken) der View. |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: unsichtbar, solange eine 3D-Rotation sie wegdreht. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | Wo eine View oder ein Bild innerhalb von `<Text>` in seiner Zeile sitzt, wie CSS' `vertical-align`: die Unterkante auf der Grundlinie (Standard), die Ober- oder Unterkante an der Ober- bzw. Unterkante der Textschrift, oder die Mitte eine halbe x-Höhe über der Grundlinie. Die Zeile wächst, um sie aufzunehmen. |

### Transforms

Transforms entsprechen denen von CSS: die Eigenschaften `translate`, `rotate` und `scale` sowie `transform`, in dieser Reihenfolge zusammengesetzt. Jede ist eine eigene Eigenschaft, sodass das `scale` eines Styles das `scale-*` einer Klasse ersetzt und dessen `rotate-*` beibehält, und das `transform` eines Styles die Transform-Funktionen einer Klasse ersetzt (`rotate-x-*`, `skew-*`).

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | CSS' `translate`: x, dann y (`"10px 20px"`; Prozentwerte der eigenen Größe der View, `"-50% 0"`). Eine Zahl sind Punkte entlang x. `[x, y]` akzeptiert eine Zahl, einen String (`"50%"`, `"10px"`) oder einen animierten Wert pro Achse; ein einzelner animierter Wert verschiebt entlang x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | CSS' `rotate`: `"45deg"`, `"0.5turn"` oder um eine Achse, `"x 90deg"`. Eine Zahl und ein animierter Wert sind Grad um z, im Uhrzeigersinn. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | CSS' `scale`: `1.5`, `"150%"`, x und y (`"1 2"`). Ein animierter Wert skaliert beide Achsen; `[x, y]` akzeptiert eine Zahl oder einen animierten Wert pro Achse. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; animierte Schritte: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (nach jeder Style-Transform) | CSS' `transform`: `"translateX(10px) rotate(45deg) scale(1.5)"` oder `"none"`. Funktionen: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. Längen akzeptieren `px` (Translationen auch `%`, bezogen auf die eigene Größe der View), Winkel `deg`, `rad` oder `turn`. Oder eine Liste von Schritten, deren Beträge animierte Werte sein dürfen: was der String nicht ausdrücken kann, etwa eine animierte 3D-Rotation (`[{ perspective: 800 }, { rotateY: angle }]`), sowie die Kanäle einer Bewegung (`m.transform`). Das `transform` eines Styles ist die eine oder die andere Form, daher ist eine Perspektive vor animierten Schritten ein Schritt der Liste. Angewendet nach `translate`, `rotate` und `scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | Der Punkt, um den die Transforms wirken: Schlüsselwörter, Prozentwerte und Längen (`"top left"`, `"50% 0"`, `[10, 20]`). Standard ist die Mitte. |

Ein `TransformStep` ist ein Objekt mit einem Schlüssel, angewendet in der Reihenfolge der Liste:

| Schritt | Wert | Nativ animiert |
|---|---|---|
| `translateX`, `translateY` | `number` (Punkte) | ja |
| `scale`, `scaleX`, `scaleY` | `number` (Faktor) | ja |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (Grad) oder `string` (`"45deg"`, `"0.5rad"`) | ja |
| `skewX`, `skewY` | `number` (Grad) oder `string` | nein |
| `perspective` | `number` (Punkte) | nein |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

Ein animierter Wert steuert `translate`, `rotate` und `scale` direkt sowie die Schritte einer `transform`-Liste:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android zeichnet keine Neigung (Skew): `skew()`, `skewX()` und `skewY()` lassen die View dort unverzerrt.

<a id="filters-and-blending"></a>

### Filter und Blending

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | CSS-Filter der View und ihres Inhalts: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | CSS-Filter dessen, was hinter der View liegt, etwa `"blur(10px)"` für Milchglas. |
| `maskImage` | `string` | | Ein CSS-Verlauf, dessen Alpha bestimmt, wie viel von der View gezeichnet wird, vollständig wo deckend und gar nicht wo transparent: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. Maskiert alles, was die View zeichnet, einschließlich ihres Backdrop-Filters. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass hinter dem Inhalt der View ab iOS 26 und macOS 26. `"regular"` verwendet das Standardmaterial; `"clear"` übernimmt weniger Farbe vom Hintergrund. `"none"` ist der Standard. Kombiniere mit `backdropFilter` für die Unschärfe, die auf früheren iOS-Versionen und anderen Plattformen angezeigt wird. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | Wie sich die View mit dem verbindet, was dahinter liegt. |

> [!WARNING]
> Plattformgrenzen:
> - iOS wendet auf Views nur `opacity()`, `brightness()` bis 1 und `drop-shadow()` an. `<Image>` akzeptiert jeden Farbfilter und `blur()`, angewendet beim Dekodieren des Bildes.
> - Die iOS-`backdropFilter`-Unschärfe verwendet ein Systemmaterial mit einem Bruchteil der Stärke, eine Annäherung an den exakten Radius.
> - Android benötigt API 31 für `blur()`, `drop-shadow()` und `backdropFilter`; darunter greifen nur Farbfilter. Blend-Modi benötigen API 29.

### Transitions

Ändert sich eine Eigenschaft mit Transition (durch einen neuen Style, eine Klasse oder eine Variante wie `active:`), animiert die Plattform sie nativ. Während der Animation läuft kein JS.

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | Durch Kommas getrennte Eigenschaften, die animiert werden: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (jede Transform-Eigenschaft), `"boxShadow"`, `"borderRadius"`, `"borderWidth"` oder `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | Millisekunden als Zahl oder `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | Verzögerung vor dem Start der Transition. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | Die Easing-Kurve. |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### Keyframe-Animationen

Eingebaute Keyframe-Animationen, nativ ausgeführt (Tailwinds `animate-*`).

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | Die Animation. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Dauer einer Iteration. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Verzögerung vor der ersten Iteration. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | Die Easing-Kurve. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | Wie oft sie läuft. |

Für Animationen, die von Werten, Gesten oder Springs gesteuert werden, verwende stattdessen die [Animations-API von `nsh`](./nsh.md#animation).

<a id="pointer-and-selection"></a>

### Zeiger und Auswahl

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (jedes CSS-Cursor-Schlüsselwort und `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | Die Zeigerform über der View, für Zeigegeräte (iPad-Trackpads, Mac Catalyst, Desktops). Diagonale Resize-Schlüsselwörter behalten ihre Achse: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) und `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, das Web und GPUI zeigen diagonale Cursor; AppKit verwendet sie ab macOS 15, unter macOS 14 wird eine offene Hand angezeigt. UIKit verwendet Pointer-Effekte auf iPad und Mac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | Welche Berührungen die View und die Views darin annehmen (`pointer-events-none`, `pointer-events-auto`). `"none"`: keine, auch für die Views darin, sofern nicht eine `"auto"` setzt, vererbt wie in CSS. `"box-none"`: keine auf der View selbst, die Views darin nehmen ihre an; `"box-only"`: die View selbst nimmt sie an, die Views darin keine (beide von React Native, nur für die View). Standard ist `"auto"`. Siehe [Touch und Gesten](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | Ob ein `<Text>` ausgewählt und kopiert werden kann (`"text"`, `select-text`) oder nicht (`"none"`, `select-none`); der Wert einer View gilt für die Texte darin, die keinen setzen. `"auto"` (`select-auto`), der Standard, überlässt es der umgebenden View, sonst der Plattform. Siehe [Text](../elements/text.md). |

### SVG-Paint

CSS' Paint-Eigenschaften von SVG-Formen, die jedes Element annimmt und die die darin enthaltenen Elemente erben, wie in einem Browser.
Sie malen, was Rust-Komponenten auf Canvases zeichnen.

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | Womit Formen gefüllt werden; `currentColor` ist die Textfarbe des Elements. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | Womit die Umrisse von Formen gemalt werden. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | Die Breite dieser Umrisse, eine Länge (standardmäßig 1). |
| `strokeDasharray` | `number \| string` | — | Striche und Lücken entlang dieser Umrisse: Längen, getrennt durch Leerzeichen oder Kommas (`"4 2"`), eine ungerade Liste wird wiederholt, oder `"none"`. |

## TextStyle

Text-Styles gelten für `<Text>` und `<Input>`. Sie werden außerdem vererbt, wie in CSS: Text-Eigenschaften, die auf einer View gesetzt sind, gehen an die Texte und Eingaben darin über, und verschachtelte `<Text>`-Spans erben von ihrem übergeordneten Text. Alle Schlüssel von `ViewStyle` gelten ebenfalls. Siehe [Text](../docs/text.md).

<a id="font"></a>

### Schrift

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | Textfarbe. Akzeptiert eine native animierte Farbe. Auch die Farbe von Rahmen und Konturen, die keine setzen. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | Größe in Punkten. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) oder 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | Eine Systemfamilie oder der Name, zu dem eine importierte Schrift ausgewertet wird (`import Inter from "./Inter.ttf"`), oder eine Liste davon, die bevorzugteste zuerst (`"Brand, 'Noto Sans SC', sans-serif"`). Siehe [Schriften](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | Kursiv. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | OpenType-Ziffern- und Buchstabenformen, eine Liste (`["tabular-nums"]`) oder CSS-Namen, durch Leerzeichen getrennt (`"tabular-nums small-caps"`). `tabular-nums` hält Ziffern gleich breit, nützlich für Zähler und Timer. |
<a id="spacing-and-alignment"></a>

### Abstände und Ausrichtung

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | Zeilenhöhe in Punkten. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | Zusätzlicher Abstand zwischen Zeichen, in Punkten. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | Horizontale Ausrichtung. `"left"` und `"right"` behalten ihre Seiten in Rechts-nach-links-Layouts bei; `"start"` und `"end"` folgen der Textrichtung. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | Grundrichtung des Textes; `"auto"` übernimmt sie aus dem Inhalt. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | Umwandlung der Groß- und Kleinschreibung. |

> [!TIP]
> Die Tailwind-Klassen `leading-*` und `tracking-*` legen Zeilenhöhen als Vielfache der Schriftgröße und den Zeichenabstand in `em` fest, sodass sie mit `text-*`-Größen skalieren.

<a id="lines-and-overflow"></a>

### Zeilen und Überlauf

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | Die maximale Anzahl an Zeilen, die ein `<Text>` anzeigt (CSS-`line-clamp`, `line-clamp-*`); `0` (`line-clamp-none`), der Standardwert, zeigt alle an. `truncate` ist eine einzelne Zeile, die mit Auslassungspunkten abgeschnitten wird. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | Wie ein begrenzter `<Text>` abgeschnitten wird: mit Auslassungspunkten am Ende (`"ellipsis"`, `text-ellipsis`, der Standardwert), einfach abgeschnitten (`"clip"`, `text-clip`) oder mit Auslassungspunkten am Anfang oder in der Mitte (Dateipfade). |

<a id="decoration"></a>

### Dekoration

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | Mit dem Text gezeichnete Linien. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | Farbe der Linien (standardmäßig die Textfarbe). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | Linienstil. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | Linienstärke. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | Abstand der Unterstreichung von der Grundlinie. |

<a id="placeholder-caret-and-selection"></a>

### Platzhalter, Cursor und Auswahl

`placeholderColor` und `caretColor` gehören zu `InputStyle`, dem Stil von `<Input>`; `selectionColor` zu `TextStyle`,
da auch auswählbare Texte ihn übernehmen.

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` einer Eingabe | Die Farbe des Platzhalters eines `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | Wo Text steht, der kürzer ist als seine Box (ein `<Text>` mit einer Höhe). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` einer Eingabe oder eines Textes | Die Auswahlmarkierung und die Anfasser eines `<Input>` oder eines auswählbaren `<Text>` (`selection:bg-*`); standardmäßig die Akzentfarbe der Plattform. Unter iOS auch der Cursor einer Eingabe, sofern `caretColor` nicht gesetzt ist (UIKit färbt beide mit einer Farbe ein). |
| `caretColor` | `ColorValue` | `.caret_color(c)` einer Eingabe | Der Cursor eines `<Input>` (`caret-*`); der Plattformstandard, wenn nicht gesetzt. |

<a id="text-shadow"></a>

### Textschatten

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | CSS-`text-shadow`: Versätze, Unschärfe und Farbe (`"0 1px 2px rgb(0 0 0 / 0.3)"`) oder die Ebenen als Zahlen, `[{ x, y, blur, color }]`; mehrere Ebenen werden als die breiteste gezeichnet; eine Ebene ohne Farbe wird in der Textfarbe gezeichnet; `"none"`. |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> iOS zeichnet auf `<Text>` keine Verläufe (`backgroundImage`) und keine inneren Box-Schatten.

## ImageStyle

Alle Schlüssel von `ViewStyle` sowie:

| Schlüssel | Typ | Rust | Beschreibung |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` eines Bildes | Färbt ein Template-Bild um (jedes deckende Pixel nimmt diese Farbe an), für einfarbige Icons. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | CSS-`object-fit`: wie ein Bild oder Video in seine Box passt. `"cover"` füllt sie aus und beschneidet, `"contain"` passt das Bild vollständig hinein, `"fill"` streckt es, `"none"` behält die natürliche Größe, `"scale-down"` ist `"none"` oder `"contain"`, je nachdem, was kleiner ist. Bilder bedecken ihre Box standardmäßig, Videos werden vollständig darin angezeigt. |
| `objectPosition` | `string` | `.object_position(p)`, `.object_top()`, ... eines Bildes | Wo das Bild in seiner Box sitzt, nachdem `objectFit` es skaliert hat, wie bei CSS-`object-position`: Schlüsselwörter, Prozentwerte und Längen (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). Ein bedeckendes Bild wird um diesen Punkt herum beschnitten. Standardmäßig die Mitte. |

`objectFit` gilt auch für `<Video>`; siehe [image](../elements/image.md) und [video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## Props, die wie Stile aussehen

Der Material-Schatten von Android ist eine plattformspezifische Prop, die neben dem Stil gesetzt wird:

| Einstellung | Prop | Rust | Klasse |
|---|---|---|---|
| Material-Schatten (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## Verwandte Themen

- [Styling](../docs/styling.md): `style`, `class`, Vererbung und Rangfolge.
- [Tailwind-Referenz](./tailwind-reference.md): alle unterstützten Utilities und Varianten.
- [Layout](../docs/layout.md): Flexbox und Grid in der Praxis.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): die Elemente, auf die diese Stile angewendet werden.

`width`, `height` und `flexBasis` akzeptieren auch `"min-content"`, `"max-content"` und `"fit-content"`, berechnet von Taffy.
