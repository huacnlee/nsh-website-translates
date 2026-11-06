---
title: "ColorPicker"
description: "Il componente ColorPicker e le sue parti: un colore scelto su un'area di saturazione e luminosità, su cursori di qualsiasi canale di RGB, HSL, HSB o OKLCH e dell'alfa, digitato in qualsiasi forma CSS, selezionato da campioni o prelevato dallo schermo con un contagocce, con i tasti e gli elementi regolabili di WAI-ARIA per gli screen reader, disposto e stilizzato dall'app."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

Un color picker contiene un colore, e le parti al suo interno lo mostrano e lo modificano: un `ColorArea` di saturazione e luminosità, `ColorSlider` per qualsiasi canale di RGB, HSL, HSB o OKLCH e per l'alpha, `ColorField` che accettano il colore come testo o un canale come numero, `ColorSwatch` di colori predefiniti e un `ColorEyeDropper` che preleva un colore ovunque sullo schermo. L'app dispone le parti con i propri elementi frapposti (una riga per canale con la sua lettera, lo spazio scelto con `Tabs`, il picker in un `Popover`) e ne definisce lo stile: le parti disegnano i colori dei canali, mentre ogni dimensione, raggio, bordo e ombra è a cura dell'app.

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

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` e `ColorEyeDropper` provengono da [`nsh/base`](../modules/nsh-base.md),
il crate `nsh-base` in Rust. In Rust, `color_picker()` e le funzioni delle sue parti li creano con un setter per ogni prop
(`.channel(..)`, `.thumb_style(..)`), un metodo listener per ogni evento (`.on_change(..)`) e i metodi di stile tipizzati; il
colore è un `Hsla`, mentre spazi, canali e formati sono `ColorSpace`, `ColorChannel` e `ColorFormat`.

<a id="value"></a>

## Valore

Il colore è un colore CSS: esadecimale (`#3b82f6`, `#3b82f680` con il suo alpha), `rgb()`, `hsl()`, `hsb()`, `oklch()` o un nome CSS; in Rust un `Hsla`. L'app lo gestisce con `value` e imposta quello che `onChange` segnala, come per ogni controllo di
`nsh/base`; oppure lascia il colore al picker con `defaultValue` e ascolta comunque le modifiche.

- `onChange({ value, formatted })` segnala ogni colore richiesto dall'utente: a ogni passo di un trascinamento sull'area o su uno slider,
  a ogni tasto, il numero di un campo mentre viene digitato, una campione premuto. `value` è il colore, `formatted` lo stesso colore
  scritto come indicato da `format` (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` o `"oklch"`), pronto per essere salvato o impostato come token.
- `onChangeEnd({ value, formatted })` segnala il colore a cui la modifica è terminata, una sola volta: quando il puntatore si solleva, dopo ogni tasto,
  quando si esce da un campo o lo si invia, quando si preme un campione.
- Il picker conserva il colore in ogni spazio così come l'utente lo ha impostato. Un grigio mantiene la sua tonalità e saturazione, così lo slider della tonalità
  resta dove l'utente lo ha lasciato; un colore modificato in OKLCH mantiene luminosità, croma e tonalità come digitati, anche oltre ciò che
  sRGB mostra (il colore segnalato è il più vicino tra quelli che sRGB mostra, e `formatted` in `"oklch"` conserva i canali).
- Un `value` impostato dall'app e non segnalato dal picker sostituisce il colore in ogni spazio.

<a id="spaces-and-channels"></a>

## Spazi e canali

| `colorSpace` | Canali (`channel`) | Intervalli |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | da 0 a 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | tonalità da 0 a 360, gli altri da 0 a 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | tonalità da 0 a 360, gli altri da 0 a 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | luminosità da 0 a 100 (a passi di 0,1), croma da 0 a 0,4 (a passi di 0,001), tonalità da 0 a 360 (a passi di 0,1) |
| qualsiasi | `"alpha"` | da 0 a 100 |

La traccia di uno slider disegna i colori del suo canale tenendo fermi gli altri canali, così mostra dove porta ogni valore. Un
canale che il suo spazio non possiede viene sostituito dal primo canale dello spazio (un avviso lo segnala).

## Props

<a id="colorpicker-1"></a>

### ColorPicker

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | nessuno | Il colore (controllato). L'app imposta quello che `onChange` segnala. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | Il colore iniziale finché `value` non è impostato; il picker poi mantiene il proprio. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | Come `formatted` scrive il colore. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna modifica da alcuna parte; le classi `disabled:` si applicano al picker e alle sue parti. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Le parti e gli elementi dell'app tra di esse. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il picker stesso: la colonna (o riga) attorno alle sue parti. |

### ColorArea

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il pannello, che riempie l'area: i colori della tonalità, la saturazione da sinistra a destra (da destra a sinistra in un layout da destra a sinistra) e la luminosità dal basso verso l'alto, ritagliati agli angoli. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il thumb, centrato sul colore. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | Lo sfondo del thumb è il colore. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna modifica da puntatore, tastiera o screen reader. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per il thumb. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'area: la sua dimensione spetta all'app. |

### ColorSlider

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | Lo spazio del canale. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | Il canale che modifica: uno di quelli dello spazio, oppure `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direzione della traccia: il valore minimo all'inizio (a sinistra, a destra in un layout da destra a sinistra) o in basso. Letta quando lo slider viene creato. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La traccia: i colori del canale lungo di essa, ritagliati agli angoli; il thumb è posizionato su di essa. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il thumb, centrato sul valore. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | Lo sfondo del thumb è il colore (con il suo alpha in uno slider alpha). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | nessuno | Il colore di una scacchiera sotto la traccia, che traspare attraverso i colori di uno slider alpha. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Il lato dei quadrati della scacchiera. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna modifica da puntatore, tastiera o screen reader. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per il thumb. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Lo slider: la fascia attorno alla traccia che riceve pressioni e trascinamenti. |

### ColorField

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | nessuno | Il canale che accetta come numero. Senza di esso, il campo accetta l'intero colore come testo. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | Lo spazio di `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | Come il campo scrive l'intero colore. Legge qualsiasi forma CSS. |
| `placeholder` | `.placeholder(..)` | `string` | nessuno | Mostrato mentre il campo è vuoto. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna digitazione. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per il campo. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<TextStyle>` | nessuno | Il campo, un input di testo. |

Il campo di un canale modifica il colore mentre si digita un numero, limitato all'intervallo del canale; il campo dell'intero colore lo modifica
quando si esce dal campo o lo si invia, se il testo è leggibile come colore. Uscendo da un campo, il suo valore viene riscritto nella
sua forma.

### ColorSwatch

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | nessuno | Il colore che mostra; una pressione lo sceglie nel picker che lo contiene. Senza di esso, il colore del picker stesso: un'anteprima. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile mentre è il colore del picker, come classi `selected:`. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | nessuno | Una scacchiera sotto un colore traslucido. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Il lato dei suoi quadrati. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | il colore in esadecimale | Ciò che gli screen reader dicono. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Contenuto sopra il colore: un segno di spunta sul campione selezionato (`group-selected:`). |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il campione: dimensione, forma e bordo; i suoi angoli ritagliano il colore. |

### ColorEyeDropper

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione. È disabilitato anche dove la piattaforma non ha un contagocce. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il suo contenuto: l'icona o l'etichetta dell'app. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il pulsante. |

Una pressione mostra il contagocce del sistema: il color sampler di AppKit su macOS, `EyeDropper` del browser sul web (Chrome
ed Edge). Il colore prelevato diventa quello del picker (`onChange`, poi `onChangeEnd`); Escape non preleva nulla. Dove la piattaforma
non ha un contagocce il pulsante è disabilitato, e `disabled:hidden` lo nasconde in quel caso.

<a id="events"></a>

## Eventi

| Evento | Di | Rust | Payload | Quando |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | L'utente ha modificato il colore. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | La modifica è terminata. Una volta per modifica. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | Il campione è stato premuto; funziona anche da solo, come chip di una palette. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | L'utente ha prelevato un colore sullo schermo; funziona anche da solo. |

In Rust, `ColorPickerEvent::Change(Hsla, SharedString)` e `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` contengono il
colore e il suo testo `formatted`.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stile con |
|---|---|---|
| `ColorArea` | il picker | `class`, `style` |
| Il pannello dell'area | l'area, che riempie | `panelClass`, `panelStyle` |
| Il thumb dell'area | l'area, centrato sul colore | `thumbClass`, `thumbStyle` |
| `ColorSlider` | il picker | `class`, `style` |
| La traccia dello slider | lo slider | `trackClass`, `trackStyle` |
| Il thumb dello slider | lo slider, centrato sul valore sulla traccia | `thumbClass`, `thumbStyle` |
| `ColorField` | il picker | `class`, `style` |
| `ColorSwatch` | il picker, oppure da solo | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | il picker, oppure da solo | `class`, `style` |

Il thumb di uno slider è centrato sulle estremità della traccia in corrispondenza delle estremità del canale. Un padding sullo slider pari a metà della larghezza del thumb
(`h-6 justify-center px-2.5` attorno a una traccia `h-3`) mantiene l'intero thumb dentro lo slider, dove riceve
le pressioni a entrambe le estremità. Gli stati mostrati dalle parti: `active:` di un thumb mentre viene trascinato e `focus:` con il
focus da tastiera, `selected:` di un campione, e `disabled:` di ogni parte.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web ogni thumb è una tappa del focus da tastiera (Tab):

| Tasto | Su uno slider | Sull'area |
|---|---|---|
| Destra, Su | Un passo in su | Destra: più saturazione; Su: più luminosità |
| Sinistra, Giù | Un passo in giù | Sinistra: meno saturazione; Giù: meno luminosità |
| Maiusc con una freccia | Dieci passi | Dieci passi |
| Pag Su, Pag Giù | Dieci passi | Dieci passi di luminosità |
| Home, Fine | Le estremità del canale | |

In un layout da destra a sinistra uno slider orizzontale e l'area partono da destra, con il valore minimo (la minima
saturazione) all'estremità destra: Sinistra è un passo in su e Destra un passo in giù, e una pressione o un trascinamento sceglie il valore sotto il
puntatore così come è disegnato. Uno slider verticale mantiene Destra e Su come passo in su; Su e Giù sull'area mantengono la luminosità.

Un campione accetta Spazio e Invio. Ogni tasto segnala `onChange` e poi `onChangeEnd`; le frecce si ripetono se tenute premute.

<a id="accessibility"></a>

## Accessibilità

- Il thumb dell'area e quello di ogni slider sono elementi regolabili (`"adjustable"`, uno slider nel browser) con la loro
  etichetta, valore e intervallo; l'incremento e il decremento degli screen reader li fanno avanzare di un passo.
- Ogni campo è un campo di testo con la sua etichetta; ogni campione un pulsante, selezionato mentre è il colore del picker, denominato dal
  suo colore in esadecimale a meno che `accessibilityLabel` non lo denomini. Il contagocce è un pulsante con l'etichetta dell'app.
- Quando sono disabilitate, gli screen reader indicano che le parti sono attenuate, ed esse non accettano azioni.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e azioni in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma disegna ciò che l'app definisce nello stile; i colori delle tracce e del pannello sono gradienti disegnati dalla piattaforma.
  Pressioni e trascinamenti sono seguiti nel core, per un mouse, una penna o un dito, e una scroll view attorno al picker
  limita il proprio scorrimento ai trascinamenti che iniziano altrove.
- `ColorEyeDropper` preleva con il color sampler di AppKit su macOS e con `EyeDropper` del browser sul web; il colore
  arriva in sRGB.
