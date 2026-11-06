---
title: "Layout"
description: "Flexbox con direzione predefinita a colonna, CSS grid, dimensioni e percentuali, rapporto d'aspetto, posizionamento assoluto, misurazione con onLayout, layout responsive e da destra a sinistra, in Rust e TSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# Layout

NSH dispone ogni elemento con [Taffy](https://github.com/DioxusLabs/taffy), un'implementazione in Rust di flexbox, grid e block layout di CSS, configurata in modo che per impostazione predefinita i figli si impilino verticalmente e non si restringano. Il layout viene eseguito nel core, dopo ogni turno del tuo codice, e solo i frame che sono cambiati vengono inviati alle view native. Il testo viene misurato dal motore di testo della piattaforma sullo stesso thread, quindi il layout non attende mai il thread principale.

Le proprietà di layout qui sotto sono proprietà di stile. In Rust sono metodi di stile tipizzati (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`); in TSX sono chiavi della prop `style`, e ciascuna ha una classe [Tailwind](./tailwind.md) (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...). Entrambe si traducono negli stessi stili nativi.

## Flexbox

Una view dispone i propri figli con flexbox. Una view che non imposta `display` impila i figli in colonna; `display: "flex"` in uno stile crea una riga a meno che non sia impostato `flexDirection`, esattamente come in CSS e come la classe `flex` di Tailwind. Dove nulla le imposta, si applicano questi valori predefiniti:

| Proprietà | Default di NSH | Default del web |
|---|---|---|
| `flexDirection` | `"column"` (una view che non imposta `display`); `"row"` una volta impostato `display: "flex"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (griglie: `"normal"`) | `normal` |
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

| Proprietà | Valori | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | Asse principale: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Asse trasversale: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | Allineamento sull'asse trasversale di un singolo figlio; `"auto"` segue `alignItems` del genitore | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | Righe di un contenitore con wrapping | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | Una scorciatoia a numero singolo (sotto) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | Come in CSS | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | Spazio tra i figli | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)` e i passi `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` e `flex-end` seguono la direzione flex; `start` e `end` seguono la direzione di scrittura, come in CSS (da destra a sinistra, `start` è il lato destro), e `self-start` / `self-end` quella propria del figlio.

`flex` è la scorciatoia di CSS, come lo sono le classi `flex-*` di Tailwind: un numero `n` significa crescere di `n`, restringersi di 1 e partire da una basis pari a 0, quindi i fratelli `flex: 1` (`.flex_1()` in Rust, `flex-1`) si dividono lo spazio in parti uguali qualunque sia il loro contenuto; `"none"` è `0 0 auto` (la view mantiene la propria dimensione), `"auto"` è `1 1 auto`, `"initial"` è `0 1 auto`, e grow, shrink e basis possono essere scritti esplicitamente (`"2 0 50%"`, `"1 1 120px"`). Poiché le dimensioni minime sono 0 per impostazione predefinita, `flex: 0` (`0 1 0`) riduce una view a nulla a meno che `minWidth: "auto"` non mantenga la dimensione del suo contenuto.

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

Poiché le dimensioni minime sono 0 per impostazione predefinita, un testo `flex: 1` in una riga si restringe e va a capo invece di spingere fuori i fratelli. `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`, `.min_w(auto())` in Rust) è il minimo automatico di CSS: un elemento che si restringe si ferma alla dimensione minima del proprio contenuto, la parola più lunga di un testo, come sul web.

> [!NOTE]
> `display: "flex"` significa riga, in uno stile, in una classe (`flex`) e in Rust (`.flex()`) allo stesso modo, a meno che non sia impostata una direzione: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. Una view senza `display` non ha bisogno di nulla per essere una colonna.

<a id="sizes"></a>

## Dimensioni

| Proprietà | Valori | Rust |
|---|---|---|
| `width`, `height` | Punti, una percentuale del genitore (`"50%"`) oppure `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, i passi `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Punti o percentuali; `minWidth` / `minHeight` accettano anche `"auto"`, la dimensione minima del contenuto | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | Larghezza divisa per altezza: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | Punti o percentuali | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ..., e i passi `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | Punti, percentuali oppure `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

In Rust una lunghezza è tipizzata: `px(16.0)` vale 16 punti, `relative(0.5)` è il 50% del genitore, `auto()` è `auto`. I metodi a passi seguono la scala di spaziatura di Tailwind, di 4 punti per passo (`.p_4()` vale 16 punti, `.gap_0p5()` 2 punti).

Senza una dimensione, una view è grande quanto il suo contenuto (più il padding), estesa lungo l'asse trasversale del genitore dal valore predefinito di `alignItems: "stretch"`. Le percentuali sono relative alla dimensione del genitore (per padding e margin, come in CSS, alla sua larghezza).

`aspectRatio` dimensiona l'altra dimensione a partire da quella nota:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

Le immagini degli asset dell'app hanno una dimensione naturale e vengono disposte con essa quando non ne viene indicata una ([Immagini e asset](./images-and-assets.md)). Le immagini remote non hanno dimensione finché non vengono caricate: assegna loro una dimensione.

<a id="grid"></a>

## Griglia

`display: "grid"` (`.grid()` in Rust) dispone i figli in tracce di una griglia CSS:

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

| Proprietà | Valori | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | Liste di tracce CSS: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, nomi di linea | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | Tracce di colonne e righe create implicitamente | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, un numero o un nome di linea: `"content-start / content-end"`, `"2 col"` (la seconda linea chiamata `col`), `"span col"` (fino alla linea successiva chiamata `col`) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Numeri o nomi di linea | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (numeri di linea) |
| `justifyItems`, `justifySelf` | Come gli elementi si posizionano nelle proprie aree lungo la riga: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | Come gli elementi si posizionano nelle proprie aree lungo la colonna | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | Come le tracce si posizionano nella griglia lungo la riga e la colonna | `.justify_*()` |

I template danno un nome alle proprie linee tra parentesi quadre, uno o più nomi per linea, e gli elementi vengono posizionati in base a quei nomi, come in CSS (in Rust, in base ai numeri delle linee):

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

In una griglia, `justifyContent` e `alignContent` hanno come valore predefinito `"normal"` di CSS: le tracce dimensionate `auto` si estendono fino a riempire il contenitore, quindi una griglia con un'altezza e senza template di righe divide quell'altezza tra le proprie righe. Un valore impostato esplicitamente (`"start"`, `"center"`, `"space-between"`, ...) posiziona le tracce come in CSS. Le classi di allineamento impostano esattamente ciò che imposta Tailwind CSS: `content-start` (`align-content: flex-start`) e `place-content-start` raggruppano le tracce all'inizio, mentre `content-normal` e `justify-normal` le estendono, come in un browser.

`display: "block"` usa il block layout di CSS (figli impilati, ciascuno largo quanto il contenitore), e `display: "none"` (`.hidden()`) rimuove la view dal layout.

<a id="absolute-positioning"></a>

## Posizionamento assoluto

`position: "absolute"` (`.absolute()`) toglie una view dal flusso e la posiziona tramite `top`, `right`, `bottom` e `left`, relativamente al suo genitore:

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

Gli offset accettano punti e percentuali (`.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)` in Rust). Una view con `left` e `right` (oppure `top` e `bottom`) e senza dimensione si estende tra i due. I fratelli successivi vengono disegnati sopra quelli precedenti; `zIndex` (`.z_index(n)`) cambia l'ordine.

<a id="measuring"></a>

## Misurazione

`onLayout` (`.on_layout(..)`) riporta il frame di una view, relativo al suo genitore, dopo ogni layout in cui è cambiato:

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

Il frame è espresso in punti: `Bounds<Points>` in Rust, `{ bounds }` in TSX, un `Bounds` (`{ origin: { x, y }, size: { width, height } }`). Per l'intera finestra, leggi `window()` in Rust oppure `windowSize()` da [`nsh`](../modules/nsh.md#device) in TSX; entrambi seguono la rotazione e il ridimensionamento della finestra, e uno stile che li legge cambia insieme alla finestra:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

I breakpoint di Tailwind (`sm:`, `md:`, ...) e `portrait:` / `landscape:` danno lo stesso risultato senza codice.

<a id="safe-areas"></a>

## Aree sicure

La view radice copre l'intero schermo, sotto la barra di stato e l'indicatore home. Applica alle schermate un padding pari agli inset dell'area sicura con `env()` di CSS (`paddingTop: "env(safe-area-inset-top)"`, `pt-[env(safe-area-inset-top)]` di Tailwind, `.p_safe_area()` in Rust; vedi [Area sicura](../elements/safe-area.md)), oppure leggi gli inset con `safe_area()` in Rust o `safeArea()` / `safeAreaInsets()` in TSX e applicali tu stesso. Le pagine di uno [stack di navigazione](./navigation.md) si trovano già sotto la propria intestazione.

<a id="right-to-left"></a>

## Da destra a sinistra

La direzione del layout dell'app segue la lingua di sistema, e lo stile `direction` di una view (`"ltr"`, `"rtl"` o `"inherit"`; `.direction(LayoutDirection::Rtl)` in Rust) imposta la direzione del suo sottoalbero. Quando l'app viene disposta da destra a sinistra:

- le righe procedono da destra;
- `left` e `right` mantengono i propri lati, come in un browser, sia nelle chiavi di stile sia nelle classi: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` e `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` restano a sinistra;
- le proprietà logiche seguono la direzione, con l'inizio inline che è il lato destro: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (`ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start` come classi; `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ... in Rust); `marginHorizontal` e `paddingHorizontal` impostano entrambi i lati;
- il testo con `textAlign: "auto"` si allinea a destra, e i controlli nativi vengono specchiati.

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

Le modifiche alla direzione, della lingua o di una view, si applicano subito, senza riavvio. Lo stile `direction` mantiene inoltre una view e i suoi figli in una direzione propria, ad esempio un numero di telefono da sinistra a destra. Su Android, le app che incorporano NSH richiedono `android:supportsRtl="true"` nel proprio manifest affinché i controlli nativi vengano specchiati.

<a id="related"></a>

## Correlati

- [Styling](./styling.md): come si combinano gli stili.
- [Scrolling](./scrolling.md) e [Liste](./lists.md): contenuti più grandi dello schermo.
- [Riferimento degli stili](../modules/style-reference.md): ogni proprietà di layout e il suo tipo.
