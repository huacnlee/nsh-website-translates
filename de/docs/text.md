---
title: "Text"
description: "Text anzeigen mit dem Text-Element in Rust und TSX – verschachtelte Spans und Links, Inline-Views, Schriften und Dekorationen, Kürzung, System-Textgröße, Auswahl und onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---


# Text

Aller Text wird von Text-Elementen angezeigt: `text(..)` in Rust, `<Text>` in TSX. Ein Text-Element ist ein Absatz, der von der Text-Engine der Plattform (CoreText auf Apple-Plattformen, `StaticLayout` auf Android) im Engine-Thread gesetzt wird, sobald er ein Layout erhält, und nur im Main-Thread gezeichnet wird. Verschachtelte Text-Elemente sind Spans desselben Absatzes, keine eigenständigen Views.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> Strings werden von Text-Elementen angezeigt. In TSX wird ein String, der direkt in ein `<View>` gesetzt wird, nicht angezeigt: Umschließe ihn mit `<Text>`.

Das Element selbst ist unter [text](../elements/text.md) dokumentiert; diese Seite behandelt seine Verwendung.

<a id="strings-and-whitespace"></a>

## Strings und Whitespace

In Rust ist der Inhalt eines Textes ein String und wird so angezeigt, wie er geschrieben ist: `\n` erzeugt einen Zeilenumbruch. Inhalt, der Signals liest, ist eine Closure, und der Text wird aktualisiert, wenn sich diese ändern. In TSX folgt JSX-Text denselben Regeln wie in React: Jede Zeile wird getrimmt, Zeilen, die nur aus Whitespace bestehen, entfallen, und die übrigen Zeilen werden mit einem einzelnen Leerzeichen verbunden. Whitespace innerhalb einer Zeile bleibt erhalten, sodass `{first} {last}` sein Leerzeichen behält. Verwende `{" "}` für ein Leerzeichen am Anfang oder Ende einer Zeile und `{"\n"}` für einen Zeilenumbruch:

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

Ausdrücke im Text folgen dem, was sie lesen: `text(move || format!("{} items", count.get()))` und `<Text>{count()} items</Text>` werden aktualisiert, wenn sich `count` ändert.

<a id="spans-and-inheritance"></a>

## Spans und Vererbung

Ein Text in einem Text ist ein Span. Er erbt den Textstil seines Elternelements und überschreibt, was er selbst setzt:

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

Textstile werden wie in CSS auch von Views weitergegeben: `view().text_color(white()).text_sm()` in Rust und `<View class="text-white text-sm">` in TSX gestalten die darin enthaltenen Text- und Input-Elemente.

### Links

Ein Span mit einem Press-Handler (`.on_press(..)` oder `.on_long_press(..)`; `onPress` oder `onLongPress`) ist ein Link: Ein Druck auf seine Zeichen geht an den Span, ein Druck an anderer Stelle an den Absatz. Links in verschachtelten Spans funktionieren ebenfalls.

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Hintergründe von Spans

Hintergrundfarbe und Eckenradius eines Spans zeichnen auf jeder Zeile, die er erreicht, eine Box hinter seinen Zeichen, so hoch wie seine Schrift. Der Text wird unverändert gesetzt und lässt sich als Ganzes kopieren, daher ist Inline-Code ein Span
([Text-Element](../elements/text.md#span-backgrounds)):

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### Views und Bilder im Text

Jedes Element außer einem Text innerhalb eines Textes wird inline auf der Baseline gesetzt und umbricht zusammen mit den Wörtern. Es kann eigene Presses entgegennehmen:

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Inline-Elemente, die durch `numberOfLines` oder eine Ellipse abgeschnitten werden, sind ausgeblendet; beim Kopieren des Textes werden sie weggelassen. Text innerhalb eines
Inline-Elements übernimmt die Farbe des umgebenden Textes, so wie CSS' `color` einen Inline-Block erreicht, sofern er keine eigene setzt
(das `LIVE`-Badge oben tut das); Schrift und Zeilenhöhe bleiben seine eigenen.

Der Style-Key `verticalAlign` platziert ein Inline-Element in seiner Zeile, so wie CSS' `vertical-align` ein Bild platziert:
`"baseline"` (Standard) stellt seine Unterkante auf die Baseline, `"text-top"` und `"text-bottom"` setzen seine Ober- oder Unterkante
an die Ober- oder Unterkante der Schrift des Textes, und `"middle"` zentriert es eine halbe x-Höhe der Schrift über der Baseline. Die
Zeile wächst, um das Element aufzunehmen, wo es über die Schrift hinausragt, auch bei einer festen `lineHeight`. Ein Icon am Anfang eines Absatzes, das
mit der Unterkante des Textes abschließen soll, so wie Android's `ImageSpan` es zeichnet, verwendet `"text-bottom"`. Die Klassen lauten
`align-baseline`, `align-text-top`, `align-text-bottom` und `align-middle`; in Rust `.align_text_bottom()` und die
übrigen gleichnamigen.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## Textstile

| Eigenschaft | Werte | Rust |
|---|---|---|
| `color` | Eine [Farbe](./styling.md#colors). Standard: Schwarz | `.text_color(..)` |
| `fontSize` | Punkte. Standard: 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700) oder `100`–`900` (Zahl oder String) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: Farb-Emojis bleiben aufrecht | `.italic()` |
| `fontFamily` | Eine System-Schriftfamilie, eine generische Schriftfamilie oder eine [importierte Schrift](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Punkte | `.line_height(px(..))` |
| `letterSpacing` | Punkte | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` und `right` behalten ihre Seiten auch bei Schreibrichtung von rechts nach links, `start` und `end` folgen der Schreibrichtung | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: Position von Text, der kürzer als seine Box ist | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | Farbe; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Punkte oder `"auto"` (Stärke auch `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | Wie CSS' `text-shadow`, ein Schatten hinter den Glyphen: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (Offsets, Unschärfe, Farbe) oder seine Ebenen als Zahlen, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`; mehrere Ebenen werden wie die breiteste gezeichnet | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | OpenType-Features: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: die Basisrichtung des Absatzes | `.writing_direction(WritingDirection::Rtl)` |

Ein Text-Element ist auch eine View: Es unterstützt Hintergründe, Rahmen, Ecken, Padding und die übrigen [View-Stile](./styling.md).

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` gibt jeder Ziffer dieselbe Breite, wodurch Zähler und Preise beim Ändern nicht flackern.

<a id="truncation"></a>

## Kürzung

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Style-Key / Prop | Rust | Beschreibung |
|---|---|---|
| `numberOfLines` (Style) | `.number_of_lines(n)` | Die maximale Anzahl angezeigter Zeilen; `0` (Standard) zeigt alle |
| `textOverflow` (Style) | `.text_overflow(EllipsizeMode::Middle)` | Wie Text, der nicht passt, abgeschnitten wird: mit einer Ellipse am Ende (`"ellipsis"`, Standard), am Anfang (`"ellipsis-start"`) oder in der Mitte (`"ellipsis-middle"`), oder `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | Verkleinert die Schrift, bis der Text in seine Zeilen und seine Box passt |
| `minimumFontScale` | | Wie weit `adjustsFontSizeToFit` verkleinern darf (0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Die Tailwind-Klassen `line-clamp-*`, `text-ellipsis` und `text-clip` setzen dieselben Keys, und `truncate` (`.truncate()`) ist eine einzelne Zeile, die mit einer Ellipse abgeschnitten wird; als Style-Keys unterstützen sie auch State-Stile und Varianten.

<a id="system-text-size"></a>

## Systemtextgröße

Text folgt standardmäßig der Texteinstellung des Benutzers (Dynamic Type auf iOS, Schriftgröße auf Android).

| Prop | Rust | Beschreibung |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` hält die Größe fest. Standard: `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | Der größte angewendete Skalierungsfaktor, z. B. `1.5`. `0` bedeutet keine Begrenzung |

`font_scale()` in Rust und `fontScale()` aus [`nsh`](../modules/nsh.md#device) in TSX sind der aktuelle Skalierungsfaktor und ändern sich, wenn der Benutzer die Einstellung ändert. Auch Inputs unterstützen `allowFontScaling` und `maxFontSizeMultiplier`.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

Begrenze lieber die Skalierung, statt sie auszuschalten: Große Schrift ist eine Bedienungshilfe, auf die Menschen angewiesen sind.

<a id="selection"></a>

## Auswahl

Der Style-Key `userSelect: "text"` (`.select_text()`, die Klasse `select-text`) erlaubt dem Benutzer, den Text auszuwählen und zu kopieren, wie in den Text-Views des Systems: Langes Drücken wählt das Wort unter dem Finger aus, die Anfasser verschieben die Enden der Auswahl, und das Bearbeitungsmenü bietet Kopieren und Alles auswählen (iOS ergänzt Nachschlagen, Übersetzen und Teilen; Android Teilen). Eine Auswahl bleibt innerhalb eines Textblocks. Der Style-Key `selectionColor` (`.selection_color(..)`, `selection:text-*`) färbt die Hervorhebung und die Anfasser. `userSelect`, auf einer View gesetzt, gilt für die darin enthaltenen Texte, die keinen eigenen Wert setzen.

In Desktop-Browsern ist Text standardmäßig auswählbar, wie auf einer Webseite, außer innerhalb interaktiver Elemente (Views mit Press- oder Touch-Handlern, etwa Buttons und anklickbare Zeilen); `userSelect: "none"` (`.select_none()`, die Klasse `select-none`) hält einen Text dort nicht auswählbar. Browser auf Smartphones und Tablets folgen der nativen Regel.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

Um aus dem Code heraus zu kopieren (ein Copy-Button), verwende `set_clipboard(..)` in Rust oder [`Clipboard`](../modules/nsh.md#clipboard) in TSX.

## onTextLayout

`onTextLayout` (das Event `TextLayout` in Rust) meldet nach jedem Layout die gesetzten Zeilen, bezogen auf die Content-Box des Textes:

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

Jede Zeile hat `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` und `xHeight` (`cap_height` und `x_height` in Rust). Damit lässt sich ein „Mehr lesen“-Button nur dann anzeigen, wenn Text abgeschnitten wurde, oder anderer Inhalt an einer Baseline ausrichten.

<a id="accessibility"></a>

## Barrierefreiheit

Ein Text-Element wird von Screenreadern mit seinem Inhalt vorgelesen. Weise Text, der als Überschrift dient (`.role(AccessibilityRole::Header)`, `role="header"`), und Links (`AccessibilityRole::Link`, `role="link"`) eine Rolle zu. Siehe [Barrierefreiheit](./accessibility.md).

<a id="related"></a>

## Siehe auch

- [Schriften](./fonts.md): benutzerdefinierte Schriften und Schriftstärken.
- [text-Element](../elements/text.md): alle Props.
- [Formulare und Tastatur](./forms-and-keyboard.md): Texteingabe.
