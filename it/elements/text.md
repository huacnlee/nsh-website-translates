---
title: "Text"
description: "L'elemento che disegna il testo: span annidati, link, limiti di riga, scalatura dei font, viste inline ed eventi di layout del testo."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---

# Testo

`Text` disegna un paragrafo. È l'elemento che mostra le stringhe: una stringa figlia di un `View` non disegna nulla. Il
paragrafo viene composto nativamente (CoreText su iOS e Mac Catalyst, `StaticLayout` su Android) e misurato sul thread del
motore, quindi il main thread si limita a disegnarlo. In Rust se ne crea uno con `text(content)`, in TSX con `<Text>` da `nsh`.

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

`text(..)` accetta una stringa, un `SharedString`, un signal o una closure (`text(move || format!("{} items", count.get()))`):
una closure o un signal aggiorna il testo sul posto quando cambia ciò che legge.

<a id="spans"></a>

## Span

Un testo dentro un testo è uno span dello stesso paragrafo, non una view separata. Gli span ereditano gli stili di testo del
paragrafo (`color`, `fontSize`, `fontWeight`, …) e sovrascrivono ciò che impostano. L'intero blocco è un'unica view nativa. In
Rust, `text(..)` mostra il proprio contenuto e poi i propri figli: `.child(text(..))` aggiunge uno span, `.child("…")` una sequenza di testo semplice.

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

### Sfondi degli span

Uno span con uno sfondo riempie il riquadro dei suoi caratteri, dietro di essi: alto quanto il suo font (l'ascent sopra la
baseline e il descent sotto di essa, indipendentemente dall'altezza di riga), e su ogni riga in cui va a capo, con la parte di ciascuna riga come un
riquadro a sé con il raggio degli angoli dello span. Gli span al suo interno condividono il suo sfondo, a meno che non ne impostino uno proprio. Si tratta solo
di disegno: il testo viene impaginato come se lo sfondo non ci fosse, e un testo selezionabile copia i caratteri dello span insieme al resto. Il codice
inline è uno span:

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

Le classi Tailwind funzionano allo stesso modo: `<Text class="bg-gray-100 rounded">`. Il padding e i bordi sono stili del riquadro e
lasciano gli span invariati; gli spazi all'interno dello span danno al riquadro un po' di margine sui lati.

<a id="links"></a>

### Link

Uno span con un gestore di pressione è un link: una pressione sui suoi caratteri va allo span, una pressione altrove al paragrafo.

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

### View e immagini inline

Qualsiasi altro elemento dentro un testo (una view, un'immagine, anche all'interno di span) è un allegato inline: viene impaginato con le
proprie dimensioni, si appoggia sulla baseline (o dove lo posiziona il suo stile `verticalAlign`: `"text-top"`, `"text-bottom"`,
`"middle"`, come in CSS; la riga cresce per contenerlo) e va a capo insieme alle parole. Gestisce le proprie pressioni.

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

Gli allegati tagliati da `numberOfLines` o da un'ellissi sono nascosti. La copia di un testo selezionabile li esclude.

<a id="whitespace"></a>

### Spazi bianchi

Il testo JSX segue le regole di React: le righe vengono rifilate tranne che alle estremità del testo, le righe composte solo da spazi bianchi vengono eliminate e le
righe rimanenti sono unite da uno spazio. Gli spazi su una stessa riga vengono mantenuti (`{a} {b}` mantiene il proprio spazio). Scrivi
`{" "}` o un'espressione stringa quando uno span richiede uno spazio iniziale o finale. Le stringhe Rust vengono disegnate così come sono scritte.

## Props

Oltre alle [props comuni](./index.md#common-props) (con `style` di tipo `TextStyle`):

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | Il numero massimo di righe mostrate; `0` le mostra tutte. |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | Come viene tagliato il testo che non entra in `numberOfLines`: con un'ellissi alla fine, all'inizio o nel mezzo, oppure con un ritaglio. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | Segue l'impostazione di dimensione del testo di sistema. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | Il limite superiore della scala di sistema; `0` significa nessun limite. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | Riduce il font finché il testo non entra nelle sue righe (`numberOfLines`) e nel suo riquadro. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | Di quanto al massimo `adjustsFontSizeToFit` può ridurre (0..1; almeno 0.1). |
| `userSelect` (style) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: l'utente può selezionare intervalli del testo: una pressione prolungata seleziona una parola, le maniglie la estendono, il menu di modifica la copia. `"auto"` adotta l'impostazione delle view che circondano il testo; se nessuna è impostata, il testo non è selezionabile, tranne nei browser desktop, dove lo è a meno che non si trovi dentro un elemento interattivo; `"none"` lo mantiene non selezionabile anche lì. |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | il colore di accento della piattaforma | L'evidenziazione e le maniglie della selezione. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | Le righe impaginate dopo ogni layout. |

Le classi Tailwind `select-text`, `select-none` e `select-auto` impostano `userSelect`, `line-clamp-*` imposta `numberOfLines`, `text-ellipsis` e `text-clip` impostano `textOverflow`, e `truncate` è una sola riga tagliata con un'ellissi. L'evidenziazione e le maniglie della selezione usano la chiave di stile
`selectionColor` (`selection:text-*`), per impostazione predefinita il colore di accento della piattaforma.

<a id="text-styles"></a>

## Stili del testo

`TextStyle` si aggiunge agli stili delle view: `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` o 100–900), `fontStyle`,
`fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`,
`textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (l'equivalente di
`text-shadow` in CSS), `fontVariant`, `writingDirection`, `numberOfLines` e `textOverflow`. In Rust sono metodi di `Styled`:
`.text_color(..)`, `.text_size(..)` (o `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`,
`.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`,
`.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` e gli altri. Vedi il
[riferimento degli stili](../modules/style-reference.md#textstyle) e [il testo](../docs/text.md).

La famiglia di font è una famiglia di sistema o un file di font dell'app:

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

Il font viene registrato prima del primo frame. Vedi [i font](../docs/fonts.md).

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | Dopo ogni layout del paragrafo. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (nessuno in Rust) | Come per la [view](./view.md#events); su uno span, le pressioni sui suoi caratteri. |
| `onLayout` | `.on_layout` | `{ bounds }` | Il frame del blocco è cambiato. |

`TextLayoutLine` è `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`, nel riquadro del contenuto del testo:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust misura una stringa prima di impaginarla con `measure_text(..)`.

<a id="ref-methods"></a>

## Metodi del ref

Nessuno specifico.

<a id="platform-notes"></a>

## Note sulle piattaforme

- La selezione resta all'interno di un singolo blocco di testo (un testo e i suoi span). iOS mostra il suo menu di modifica (Copy, Select All, Look Up,
  Translate, Share), Android una toolbar flottante (Copy, Select all, Share).
- Le decorazioni del testo diverse da una singola linea continua (`double`, `dotted`, `dashed`, `wavy`) sono disegnate da NSH su iOS.
- I testi su iOS disegnano sfondi pieni e ombre esterne.
- `fontScale()` da [`nsh`](../modules/nsh.md#device) (`font_scale()` in Rust) riporta la scala corrente del testo di
  sistema.
