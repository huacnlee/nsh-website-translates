---
title: "Text"
description: "Das Element, das Text darstellt: verschachtelte Spans, Links, Zeilenbegrenzungen, Schriftskalierung, Inline-Views und Ereignisse zum Text-Layout."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---


# Text

`Text` zeichnet einen Absatz. Es ist das Element, das Strings anzeigt: Ein String-Kind eines `View` zeichnet nichts. Der Absatz wird nativ gesetzt (CoreText unter iOS und Mac Catalyst, `StaticLayout` unter Android) und im Engine-Thread vermessen, sodass der Main-Thread ihn nur noch zeichnet. In Rust erzeugst du ihn mit `text(content)`, in TSX mit `<Text>` aus `nsh`.

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` nimmt einen String, ein `SharedString`, ein Signal oder eine Closure (`text(move || format!("{} items", count.get()))`) entgegen: Eine Closure oder ein Signal aktualisiert den Text an Ort und Stelle, wenn sich ändert, was sie lesen.

## Spans

Ein Text innerhalb eines Textes ist ein Span desselben Absatzes, keine eigene View. Spans erben die Textstile des Absatzes (`color`, `fontSize`, `fontWeight`, …) und überschreiben, was sie selbst setzen. Der gesamte Block ist eine einzige native View. In Rust zeigt `text(..)` zuerst seinen Inhalt und danach seine Kinder: `.child(text(..))` fügt einen Span hinzu, `.child("…")` einen einfachen Run.

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

<a id="span-backgrounds"></a>

### Span-Hintergründe

Ein Span mit Hintergrund füllt hinter seinen Zeichen deren Box: so hoch wie seine Schrift (der Ascent über der Grundlinie und der Descent darunter, unabhängig von der Zeilenhöhe), und zwar in jeder Zeile, in die er umbricht. Der Teil jeder Zeile ist dabei eine eigene Box mit dem Eckenradius des Spans. Spans darin teilen seinen Hintergrund, sofern sie nicht einen eigenen setzen. Es betrifft nur das Zeichnen: Der Text wird so gesetzt, als gäbe es den Hintergrund nicht, und ein auswählbarer Text kopiert die Zeichen des Spans mit dem Rest. Inline-Code ist ein Span:

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Die Tailwind-Klassen funktionieren genauso: `<Text class="bg-gray-100 rounded">`. Padding und Rahmen sind Box-Stile und lassen Spans unverändert; Leerzeichen innerhalb des Spans geben der Box seitlich Platz.

### Links

Ein Span mit einem Press-Handler ist ein Link: Ein Tippen auf seine Zeichen geht an den Span, ein Tippen anderswo an den Absatz.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

<a id="inline-views-and-images"></a>

### Inline-Views und Bilder

Jedes andere Element innerhalb eines Textes (eine View, ein Bild, auch innerhalb von Spans) ist ein Inline-Attachment: Es wird in seiner eigenen Größe gesetzt, sitzt auf der Grundlinie (oder dort, wohin sein `verticalAlign`-Stil es setzt: `"text-top"`, `"text-bottom"`, `"middle"`, wie in CSS; die Zeile wächst, um es aufzunehmen) und bricht mit den Wörtern um. Es nimmt eigene Presses entgegen.

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Attachments, die durch `numberOfLines` oder eine Ellipse abgeschnitten werden, sind ausgeblendet. Beim Kopieren eines auswählbaren Textes werden sie ausgelassen.

### Whitespace

JSX-Text folgt den Regeln von React: Zeilen werden getrimmt, außer an den Enden des Textes, Zeilen, die nur aus Whitespace bestehen, entfallen, und die übrigen Zeilen werden mit einem Leerzeichen verbunden. Leerzeichen innerhalb einer Zeile bleiben erhalten (`{a} {b}` behält sein Leerzeichen). Schreibe `{" "}` oder einen String-Ausdruck, wenn ein Span ein führendes oder abschließendes Leerzeichen braucht. Rust-Strings werden so gezeichnet, wie sie geschrieben sind.

## Props

Zusätzlich zu den [allgemeinen Props](./index.md#common-props) (wobei `style` als `TextStyle` typisiert ist):

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | Die maximale Zeilenzahl; `0` zeigt alle Zeilen. |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | Wie Text abgeschnitten wird, der nicht in `numberOfLines` passt: mit einer Ellipse an seinem Ende, an seinem Anfang oder in seiner Mitte, oder einfach beschnitten. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | Folgt der Systemeinstellung für die Textgröße. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | Die Obergrenze der Systemskalierung; `0` bedeutet keine. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | Verkleinert die Schrift, bis der Text in seine Zeilen (`numberOfLines`) und seine Box passt. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | Wie weit `adjustsFontSizeToFit` höchstens verkleinert (0..1; mindestens 0.1). |
| `userSelect` (style) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: Der Nutzer kann Textbereiche auswählen: Langes Drücken wählt ein Wort aus, Griffe erweitern die Auswahl, das Bearbeitungsmenü kopiert sie. `"auto"` übernimmt die Einstellung der umgebenden Views; ist keine gesetzt, ist Text nicht auswählbar, außer in Desktop-Browsern, wo er auswählbar ist, sofern er sich nicht in einem interaktiven Element befindet; `"none"` hält ihn dort ebenfalls nicht auswählbar. |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | Akzentfarbe der Plattform | Die Hervorhebung und die Griffe der Auswahl. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | Die gesetzten Zeilen nach jedem Layout. |

Die Tailwind-Klassen `select-text`, `select-none` und `select-auto` setzen `userSelect`, `line-clamp-*` setzt `numberOfLines`, `text-ellipsis` und `text-clip` setzen `textOverflow`, und `truncate` ist eine einzelne Zeile, die mit einer Ellipse abgeschnitten wird. Die Hervorhebung und die Griffe der Auswahl verwenden den Style-Key `selectionColor` (`selection:text-*`), standardmäßig die Akzentfarbe der Plattform.

## Text-Styles

`TextStyle` ergänzt die View-Stile um: `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` oder 100–900), `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (CSS-`text-shadow`), `fontVariant`, `writingDirection`, `numberOfLines` und `textOverflow`. In Rust sind es `Styled`-Methoden: `.text_color(..)`, `.text_size(..)` (oder `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`, `.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`, `.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` und die übrigen. Siehe die [Style-Referenz](../modules/style-reference.md#textstyle) und [Text](../docs/text.md).

Die Schriftfamilie ist eine Systemfamilie oder eine Schriftdatei der App:

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

Die Schrift wird vor dem ersten Frame registriert. Siehe [Schriften](../docs/fonts.md).

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | Nach jedem Layout des Absatzes. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (in Rust keine) | Wie bei [View](./view.md#events); bei einem Span Presses auf seine Zeichen. |
| `onLayout` | `.on_layout` | `{ bounds }` | Der Frame des Blocks hat sich geändert. |

`TextLayoutLine` ist `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`, in der Content-Box des Textes:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust vermisst einen String, bevor er ihn setzt, mit `measure_text(..)`.

<a id="ref-methods"></a>

## Ref-Methoden

Keine eigenen.

<a id="platform-notes"></a>

## Plattformhinweise

- Die Auswahl bleibt innerhalb eines Textblocks (ein Text und seine Spans). iOS zeigt sein Bearbeitungsmenü (Copy, Select All, Look Up, Translate, Share), Android eine schwebende Toolbar (Copy, Select all, Share).
- Textdekorationen außer einer durchgezogenen einfachen Linie (`double`, `dotted`, `dashed`, `wavy`) werden unter iOS von NSH gezeichnet.
- iOS-Texte zeichnen einfarbige Hintergründe und äußere Schatten.
- `fontScale()` aus [`nsh`](../modules/nsh.md#device) (`font_scale()` in Rust) meldet die aktuelle Systemtextskalierung.
