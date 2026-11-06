---
title: "ColorPicker"
description: "Die ColorPicker-Komponente und ihre Teile: eine Farbe, die auf einer Fläche für Sättigung und Helligkeit, auf Schiebereglern für beliebige Kanäle von RGB, HSL, HSB oder OKLCH sowie für den Alphakanal ausgewählt, in jeder CSS-Schreibweise eingegeben, aus Farbfeldern gewählt oder mit einer Pipette direkt auf dem Bildschirm aufgenommen wird, mit den Tasten und anpassbaren Elementen von WAI-ARIA für Screenreader, deren Layout und Gestaltung der App überlassen bleiben."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---


# ColorPicker

Ein Color Picker hält eine Farbe, und die Teile darin zeigen und ändern sie: eine Fläche (`ColorArea`) aus Sättigung und Helligkeit, Slider (`ColorSlider`) für jeden beliebigen Kanal von RGB, HSL, HSB oder OKLCH sowie für Alpha, Felder (`ColorField`), die die Farbe als Text oder einen Kanal als Zahl annehmen, Farbfelder (`ColorSwatch`) mit voreingestellten Farben und eine Pipette (`ColorEyeDropper`), die irgendwo auf dem Bildschirm eine Farbe aufnimmt. Die App ordnet die Teile mit eigenen Elementen dazwischen an (eine Zeile pro Kanal mit seinem Buchstaben, der mit `Tabs` gewählte Farbraum, der Picker in einem `Popover`) und gestaltet jedes davon: Die Teile zeichnen die Farben der Kanäle, und jede Größe, jeder Radius, jeder Rahmen und jeder Schatten stammt von der App.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` und `ColorEyeDropper` stammen aus [`nsh/base`](../modules/nsh-base.md), dem Crate `nsh-base` in Rust. In Rust erzeugen `color_picker()` und die Funktionen seiner Teile sie mit einem Setter pro Prop (`.channel(..)`, `.thumb_style(..)`), einer Listener-Methode pro Event (`.on_change(..)`) und den typisierten Stilmethoden; die Farbe ist ein `Hsla`, die Farbräume, Kanäle und Formate sind `ColorSpace`, `ColorChannel` und `ColorFormat`.

<a id="value"></a>

## Wert

Die Farbe ist eine CSS-Farbe: Hex (`#3b82f6`, `#3b82f680` mit Alpha), `rgb()`, `hsl()`, `hsb()`, `oklch()` oder ein CSS-Name; in Rust ein `Hsla`. Die App besitzt sie mit `value` und setzt die Farbe, die `onChange` meldet, wie bei jedem Steuerelement von `nsh/base`; oder sie überlässt dem Picker die Farbe mit `defaultValue` und bekommt die Änderungen trotzdem mit.

- `onChange({ value, formatted })` meldet jede Farbe, die der Nutzer anfordert: bei jedem Schritt eines Ziehens auf der Fläche oder einem Slider, bei jeder Taste, bei der Zahl eines Feldes, während sie getippt wird, bei einem gedrückten Farbfeld. `value` ist die Farbe, `formatted` dieselbe Farbe, geschrieben, wie `format` es vorgibt (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` oder `"oklch"`), bereit zum Speichern oder zum Setzen als Token.
- `onChangeEnd({ value, formatted })` meldet die Farbe, bei der die Änderung endete, einmal: wenn der Zeiger losgelassen wird, nach jeder Taste, wenn ein Feld verlassen oder abgeschickt wird, wenn ein Farbfeld gedrückt wird.
- Der Picker behält die Farbe in jedem Farbraum so, wie der Nutzer sie gesetzt hat. Ein Grau behält seinen Farbton und seine Sättigung, sodass der Farbton-Slider dort bleibt, wo der Nutzer ihn gelassen hat; eine in OKLCH bearbeitete Farbe behält Helligkeit, Chroma und Farbton wie eingegeben, auch jenseits dessen, was sRGB darstellt (die gemeldete Farbe ist die nächstliegende, die sRGB darstellt, und `formatted` in `"oklch"` behält die Kanäle).
- Ein `value`, den die App setzt und den der Picker nicht gemeldet hat, ersetzt die Farbe in jedem Farbraum.

<a id="spaces-and-channels"></a>

## Farbräume und Kanäle

| `colorSpace` | Kanäle (`channel`) | Wertebereiche |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | 0 bis 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | Farbton 0 bis 360, die anderen 0 bis 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | Farbton 0 bis 360, die anderen 0 bis 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | Helligkeit 0 bis 100 (in Schritten von 0,1), Chroma 0 bis 0,4 (in Schritten von 0,001), Farbton 0 bis 360 (in Schritten von 0,1) |
| beliebig | `"alpha"` | 0 bis 100 |

Der Track eines Sliders zeichnet die Farben seines Kanals bei festgehaltenen anderen Kanälen, sodass er zeigt, wohin jeder Wert führt. Ein Kanal, den sein Farbraum nicht hat, wird zum ersten Kanal des Farbraums (eine Warnung weist darauf hin).

## Props

### ColorPicker

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | – | Die Farbe (kontrolliert). Die App setzt die Farbe, die `onChange` meldet. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | Die anfängliche Farbe, solange `value` nicht gesetzt ist; der Picker verwaltet sie dann selbst. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | Wie `formatted` die Farbe schreibt. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Änderungen durch irgendeinen Teil; die `disabled:`-Klassen gelten für den Picker und seine Teile. |
| `children` | `.child(..)` | `JSX.Element` | – | Die Teile und die Elemente der App dazwischen. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | – | Der Picker selbst: die Spalte (oder Zeile) um seine Teile. |

### ColorArea

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | – | Das Panel, das die Fläche füllt: die Farben des Farbtons, Sättigung von links nach rechts (von rechts nach links in einem Rechts-nach-links-Layout) und Helligkeit von unten nach oben, an seinen Ecken beschnitten. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | – | Der Thumb, auf der Farbe zentriert. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | Der Hintergrund des Thumbs ist die Farbe. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Änderungen per Zeiger, Tastatur oder Screenreader. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | – | Was Screenreader für den Thumb ansagen. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | – | Die Fläche: Ihre Größe bestimmt die App. |

### ColorSlider

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | Der Farbraum des Kanals. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | Der Kanal, den er ändert: einer des Farbraums oder `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Die Richtung des Tracks: der kleinste Wert am Anfang (links, in einem Rechts-nach-links-Layout rechts) oder unten. Wird beim Erstellen des Sliders gelesen. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | – | Der Track: die Farben des Kanals entlang seiner Länge, an seinen Ecken beschnitten; der Thumb wird darauf platziert. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | – | Der Thumb, auf dem Wert zentriert. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | Der Hintergrund des Thumbs ist die Farbe (bei einem Alpha-Slider mit ihrem Alpha). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | – | Die Farbe eines Schachbretts unter dem Track, das durch die Farben eines Alpha-Sliders scheint. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Die Seitenlänge der Quadrate des Schachbretts. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Änderungen per Zeiger, Tastatur oder Screenreader. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | – | Was Screenreader für den Thumb ansagen. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | – | Der Slider: das Band um den Track, das Drücken und Ziehen entgegennimmt. |

### ColorField

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | – | Der Kanal, den es als Zahl annimmt. Ohne ihn nimmt das Feld die ganze Farbe als Text an. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | Der Farbraum von `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | Wie das Feld die ganze Farbe schreibt. Es liest jede CSS-Form. |
| `placeholder` | `.placeholder(..)` | `string` | – | Wird angezeigt, solange das Feld leer ist. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Eingabe. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | – | Was Screenreader für das Feld ansagen. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<TextStyle>` | – | Das Feld, eine Texteingabe. |

Das Feld eines Kanals ändert die Farbe, während eine Zahl getippt wird, begrenzt auf den Wertebereich des Kanals; das Feld der ganzen Farbe ändert sie, wenn das Feld verlassen oder abgeschickt wird und der Text als Farbe lesbar ist. Beim Verlassen eines Feldes wird sein Wert erneut in seiner Form geschrieben.

### ColorSwatch

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | – | Die Farbe, die es zeigt; ein Druck wählt sie im umgebenden Picker. Ohne sie die eigene Farbe des Pickers: eine Vorschau. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | – | Der Stil, solange es die Farbe des Pickers ist, als `selected:`-Klassen. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | – | Ein Schachbrett unter einer durchscheinenden Farbe. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Die Seitenlänge seiner Quadrate. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Drücken. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | die Farbe als Hex | Was Screenreader ansagen. |
| `children` | `.child(..)` | `JSX.Element` | – | Inhalt über der Farbe: ein Häkchen auf dem ausgewählten Farbfeld (`group-selected:`). |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | – | Das Farbfeld: seine Größe, Form und sein Rahmen; seine Ecken beschneiden die Farbe. |

### ColorEyeDropper

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Drücken. Es ist auch deaktiviert, wo die Plattform keine Pipette hat. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | – | Was Screenreader ansagen. |
| `children` | `.child(..)` | `JSX.Element` | – | Sein Inhalt: das Symbol oder die Beschriftung der App. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | – | Der Button. |

Ein Druck zeigt die Pipette des Systems: den Color Sampler von AppKit unter macOS, die `EyeDropper` des Browsers im Web (Chrome und Edge). Die gewählte Farbe wird die des Pickers (`onChange`, dann `onChangeEnd`); Escape wählt keine. Wo die Plattform keine Pipette hat, ist der Button deaktiviert, und `disabled:hidden` blendet ihn dort aus.

## Events

| Event | Von | Rust | Payload | Wann |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | Der Nutzer hat die Farbe geändert. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | Die Änderung ist beendet. Einmal pro Änderung. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | Das Farbfeld wurde gedrückt; es funktioniert auch allein, als Chip einer Palette. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | Der Nutzer hat eine Farbe auf dem Bildschirm gewählt; es funktioniert auch allein. |

In Rust enthalten `ColorPickerEvent::Change(Hsla, SharedString)` und `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` die Farbe und ihren `formatted`-Text.

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit |
|---|---|---|
| `ColorArea` | der Picker | `class`, `style` |
| Das Panel der Fläche | die Fläche, füllt sie aus | `panelClass`, `panelStyle` |
| Der Thumb der Fläche | die Fläche, auf der Farbe zentriert | `thumbClass`, `thumbStyle` |
| `ColorSlider` | der Picker | `class`, `style` |
| Der Track des Sliders | der Slider | `trackClass`, `trackStyle` |
| Der Thumb des Sliders | der Slider, auf dem Wert auf dem Track zentriert | `thumbClass`, `thumbStyle` |
| `ColorField` | der Picker | `class`, `style` |
| `ColorSwatch` | der Picker oder allein | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | der Picker oder allein | `class`, `style` |

Der Thumb eines Sliders ist an den Enden des Kanals auf den Enden des Tracks zentriert. Ein Padding am Slider von der halben Breite des Thumbs (`h-6 justify-center px-2.5` um einen `h-3`-Track) hält den ganzen Thumb innerhalb des Sliders, wo er an beiden Enden Drücke entgegennimmt. Zustände, die die Teile zeigen: `active:` eines Thumbs, während er gezogen wird, und `focus:` bei Tastaturfokus, `selected:` eines Farbfelds und `disabled:` jedes Teils.

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web ist jeder Thumb ein Stopp des Tastaturfokus (Tab):

| Taste | Auf einem Slider | Auf der Fläche |
|---|---|---|
| Rechts, Hoch | Ein Schritt aufwärts | Rechts: mehr Sättigung; Hoch: mehr Helligkeit |
| Links, Runter | Ein Schritt abwärts | Links: weniger Sättigung; Runter: weniger Helligkeit |
| Shift mit einem Pfeil | Zehn Schritte | Zehn Schritte |
| Page Up, Page Down | Zehn Schritte | Zehn Schritte Helligkeit |
| Home, End | Die Enden des Kanals | |

In einem Rechts-nach-links-Layout laufen ein horizontaler Slider und die Fläche von rechts, der kleinste Wert (die geringste Sättigung) am rechten Ende: Links ist ein Schritt aufwärts und Rechts ein Schritt abwärts, und ein Drücken oder Ziehen wählt den Wert unter dem Zeiger, wie er gezeichnet ist. Ein vertikaler Slider behält Rechts und Hoch als Schritt aufwärts; Hoch und Runter auf der Fläche behalten die Helligkeit.

Ein Farbfeld nimmt Space und Return entgegen. Jede Taste meldet `onChange` und dann `onChangeEnd`; Pfeiltasten wiederholen sich, solange sie gehalten werden.

<a id="accessibility"></a>

## Barrierefreiheit

- Der Thumb der Fläche und der Thumb jedes Sliders sind einstellbare Elemente (`"adjustable"`, im Browser ein Slider) mit ihrer Beschriftung, ihrem Wert und ihrem Bereich; das Erhöhen und Verringern der Screenreader verstellt sie schrittweise.
- Jedes Feld ist ein Textfeld mit seiner Beschriftung; jedes Farbfeld ein Button, ausgewählt, solange es die Farbe des Pickers ist, benannt nach seiner Farbe in Hex, sofern nicht `accessibilityLabel` es benennt. Die Pipette ist ein Button mit der Beschriftung der App.
- Solange deaktiviert, sagen Screenreader an, dass die Teile abgeblendet sind, und sie nehmen keine Aktionen entgegen.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Beschriftungen, Rollen und Aktionen im Allgemeinen.

<a id="platform-notes"></a>

## Plattformhinweise

- Jede Plattform zeichnet, was die App gestaltet; die Farben der Tracks und des Panels sind Verläufe, die von der Plattform gezeichnet werden. Drücken und Ziehen werden im Core verfolgt, für Maus, Stift oder Finger, und eine Scroll-View um den Picker behält ihr Scrollen für Ziehbewegungen, die anderswo beginnen.
- `ColorEyeDropper` wählt unter macOS mit dem Color Sampler von AppKit und im Web mit der `EyeDropper` des Browsers; die Farbe kommt in sRGB an.
