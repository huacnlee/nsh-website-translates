---
title: "Testo"
description: "Mostrare testo con l'elemento text in Rust e TSX: span annidati e link, view inline, font e decorazioni, troncamento, dimensione del testo di sistema, selezione e onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# Testo

Tutto il testo viene mostrato da elementi text: `text(..)` in Rust, `<Text>` in TSX. Un elemento text è un paragrafo, composto dal motore di testo della piattaforma (CoreText sulle piattaforme Apple, `StaticLayout` su Android) sul thread del motore durante il layout, e disegnato solo sul thread principale. Gli elementi text annidati sono span dello stesso paragrafo, non view separate.

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
> Le stringhe vengono mostrate dagli elementi text. In TSX, una stringa inserita direttamente in un `<View>` non viene mostrata: racchiudila in `<Text>`.

L'elemento in sé è documentato in [text](../elements/text.md); questa pagina riguarda il suo utilizzo.

<a id="strings-and-whitespace"></a>

## Stringhe e spazi

In Rust, il contenuto di un testo è una stringa, mostrata così com'è scritta: `\n` va a capo. Il contenuto che legge dei signal è una closure, e il testo si aggiorna quando questi cambiano. In TSX, il testo JSX segue le stesse regole di React: ogni riga viene rifilata, le righe composte solo da spazi vengono scartate e le righe rimanenti vengono unite con un singolo spazio. Gli spazi all'interno di una stessa riga vengono mantenuti, quindi `{first} {last}` conserva il suo spazio. Usa `{" "}` per uno spazio all'inizio o alla fine di una riga e `{"\n"}` per un'interruzione di riga:

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

Le espressioni nel testo seguono ciò che leggono: `text(move || format!("{} items", count.get()))` e `<Text>{count()} items</Text>` si aggiornano quando `count` cambia.

<a id="spans-and-inheritance"></a>

## Span ed ereditarietà

Un text dentro un text è uno span. Eredita lo stile di testo del genitore e sovrascrive ciò che imposta:

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

Anche gli stili di testo passano dalle view verso il basso, come in CSS: `view().text_color(white()).text_sm()` in Rust e `<View class="text-white text-sm">` in TSX applicano lo stile agli elementi text e input al loro interno.

<a id="links"></a>

### Link

Uno span con un gestore di pressione (`.on_press(..)` o `.on_long_press(..)`; `onPress` o `onLongPress`) è un link: una pressione sui suoi caratteri va allo span, una pressione altrove va al paragrafo. I link funzionano anche negli span annidati.

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

### Sfondi degli span

Il colore di sfondo e il raggio degli angoli di uno span disegnano un riquadro dietro ai suoi caratteri su ogni riga che attraversa, alto quanto il suo font; il testo viene disposto allo stesso modo e si copia per intero, quindi il codice inline è uno span
([Elemento text](../elements/text.md#span-backgrounds)):

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

### View e immagini dentro il testo

Qualsiasi elemento diverso da un text dentro un text viene disposto inline, sulla linea di base, e va a capo insieme alle parole. Può ricevere pressioni proprie:

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

Gli elementi inline tagliati da `numberOfLines` o da un'ellissi vengono nascosti; copiando il testo, vengono esclusi. Il testo dentro un elemento inline assume il colore del testo che lo circonda, come il `color` di CSS raggiunge un inline block, a meno che non ne imposti uno proprio (come fa il badge `LIVE` qui sopra); il suo font e l'altezza di riga restano i suoi.

La chiave di stile `verticalAlign` colloca un elemento inline nella sua riga, come il `vertical-align` di CSS colloca un'immagine:
`"baseline"` (il valore predefinito) appoggia il suo bordo inferiore sulla linea di base, `"text-top"` e `"text-bottom"` portano il suo bordo superiore o inferiore
al limite superiore o inferiore del font del testo, e `"middle"` lo centra a metà dell'altezza x del font sopra la linea di base. La
riga cresce per contenere l'elemento ovunque sporga oltre il font, anche con un `lineHeight` fisso. Un'icona all'inizio di un paragrafo che deve
allinearsi con il fondo del testo, come la disegna `ImageSpan` di Android, usa `"text-bottom"`. Le classi sono
`align-baseline`, `align-text-top`, `align-text-bottom` e `align-middle`; in Rust `.align_text_bottom()` e gli
altri con gli stessi nomi.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## Stili di testo

| Proprietà | Valori | Rust |
|---|---|---|
| `color` | Un [colore](./styling.md#colors). Predefinito nero | `.text_color(..)` |
| `fontSize` | Punti. Predefinito 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700), o `100`–`900` (numero o stringa) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: le emoji a colori restano dritte | `.italic()` |
| `fontFamily` | Una famiglia di sistema, una famiglia generica o un [font importato](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Punti | `.line_height(px(..))` |
| `letterSpacing` | Punti | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` e `right` mantengono i propri lati anche da destra a sinistra, `start` e `end` seguono la direzione | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: dove si colloca un testo più corto del suo riquadro | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | Colore; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Punti, o `"auto"` (lo spessore anche `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | Il `text-shadow` di CSS, un'ombra dietro ai glifi: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (scostamenti, sfocatura, colore), oppure i suoi livelli come numeri, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`; più livelli vengono disegnati come il più ampio | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | Funzionalità OpenType: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: la direzione di base del paragrafo | `.writing_direction(WritingDirection::Rtl)` |

Un elemento text è anche una view: accetta sfondi, bordi, angoli, padding e gli altri [stili delle view](./styling.md).

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

`tabular-nums` dà a ogni cifra la stessa larghezza, evitando che contatori e prezzi tremolino quando cambiano.

<a id="truncation"></a>

## Troncamento

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Chiave di stile / prop | Rust | Descrizione |
|---|---|---|
| `numberOfLines` (stile) | `.number_of_lines(n)` | Il numero massimo di righe mostrate; `0` (predefinito) le mostra tutte |
| `textOverflow` (stile) | `.text_overflow(EllipsizeMode::Middle)` | Come viene tagliato il testo che non entra: un'ellissi alla fine (`"ellipsis"`, predefinito), all'inizio (`"ellipsis-start"`) o al centro (`"ellipsis-middle"`), oppure `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | Riduce il font finché il testo non entra nelle sue righe e nel suo riquadro |
| `minimumFontScale` | | Quanto può ridursi `adjustsFontSizeToFit` (0–1) |

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

Le classi Tailwind `line-clamp-*`, `text-ellipsis` e `text-clip` impostano le stesse chiavi, e `truncate` (`.truncate()`) è una sola riga tagliata con un'ellissi; come chiavi di stile accettano anche stili di stato e varianti.

<a id="system-text-size"></a>

## Dimensione del testo di sistema

Per impostazione predefinita, il testo segue l'impostazione della dimensione del testo dell'utente (Dynamic Type su iOS, dimensione del carattere su Android).

| Prop | Rust | Descrizione |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` mantiene la dimensione fissa. Predefinito `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | La scala massima applicata, ad es. `1.5`. `0` significa nessun limite |

`font_scale()` in Rust e `fontScale()` da [`nsh`](../modules/nsh.md#device) in TSX sono la scala corrente e cambiano quando l'utente modifica l'impostazione. Anche gli input accettano `allowFontScaling` e `maxFontSizeMultiplier`.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

Meglio limitare la scala che disattivarla: il testo grande è un'impostazione di accessibilità su cui le persone fanno affidamento.

<a id="selection"></a>

## Selezione

La chiave di stile `userSelect: "text"` (`.select_text()`, la classe `select-text`) permette all'utente di selezionare e copiare il testo, come nelle view di testo del sistema: una pressione lunga seleziona la parola sotto il dito, le maniglie spostano le estremità della selezione e il menu di modifica offre Copia e Seleziona tutto (iOS aggiunge Look Up, Translate e Share; Android Share). Una selezione resta all'interno di un solo blocco di testo. La chiave di stile `selectionColor` (`.selection_color(..)`, `selection:text-*`) colora l'evidenziazione e le maniglie. `userSelect` impostato su una view raggiunge i testi al suo interno che non ne impostano nessuno.

Nei browser desktop il testo è selezionabile per impostazione predefinita, come in una pagina web, tranne all'interno degli elementi interattivi (view con gestori di pressione o di tocco, come pulsanti e righe premibili); `userSelect: "none"` (`.select_none()`, la classe `select-none`) mantiene un testo non selezionabile in quel caso. I browser per telefoni e tablet seguono la regola nativa.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

Per copiare da codice (un pulsante Copia), usa `set_clipboard(..)` in Rust o [`Clipboard`](../modules/nsh.md#clipboard) in TSX.

## onTextLayout

`onTextLayout` (l'evento `TextLayout` in Rust) riporta le righe disposte dopo ogni layout, nel riquadro del contenuto del testo:

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

Ogni riga ha `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` e `xHeight` (`cap_height` e `x_height` in Rust). Usalo per mostrare un pulsante "Leggi tutto" solo quando il testo è stato tagliato, oppure per allineare altri contenuti a una linea di base.

<a id="accessibility"></a>

## Accessibilità

Un elemento text viene letto dagli screen reader come il suo contenuto. Assegna un ruolo ai testi che fungono da titolo (`.role(AccessibilityRole::Header)`, `role="header"`) e ai link (`AccessibilityRole::Link`, `role="link"`). Vedi [Accessibilità](./accessibility.md).

<a id="related"></a>

## Correlati

- [Font](./fonts.md): font personalizzati e pesi.
- [Elemento text](../elements/text.md): tutte le prop.
- [Moduli e tastiera](./forms-and-keyboard.md): input di testo.
