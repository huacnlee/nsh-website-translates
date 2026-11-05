---
title: "Riferimento degli stili"
description: "Ogni chiave di stile accettata da NSH, raggruppata per LayoutStyle, ViewStyle, TextStyle, InputStyle e ImageStyle, con il relativo tipo e significato."
order: 16
source_hash: 012ce37fb9fe065c
---

# Riferimento degli stili

Questa pagina elenca ogni chiave della prop `style` e il metodo di `Styled` che la imposta in Rust. I componenti Rust applicano gli stili agli elementi con metodi tipizzati che prendono il nome dalle utility di Tailwind (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`, da `nsh_core::prelude`), che si traducono nelle stesse chiavi; TSX passa oggetti `style` (e classi). La colonna Rust indica il metodo; a quasi tutti si può passare un valore, un signal o una closure, e `.style_when(…)` / `.style_with(…)` rendono condizionale qualsiasi metodo. Le chiavi e i loro tipi provengono dalle dichiarazioni generate in `.nsh/types/nsh/types.d.ts`, quindi l'editor le controlla mentre scrivi. Una chiave di stile corrisponde alla proprietà CSS con lo stesso nome, esattamente come la classe che la imposta: `paddingLeft` è `padding-left` e `pl-4` di CSS, `boxShadow` è `box-shadow` e `shadow-md`; alcune chiavi hanno nomi più semplici, usati dalle app (`paddingHorizontal` per `padding-inline`, `marginStart` per `margin-inline-start`, `numberOfLines` per `line-clamp`). I numeri sono punti, e sono disponibili anche le funzionalità CSS: grid, gradienti, box shadow, filtri, blend mode, outline, transform, transizioni e animazioni keyframe.

Per sapere come applicare gli stili, combinarli con le classi ed ereditare gli stili del testo, vedi [Styling](../docs/styling.md). Per la sintassi delle classi, vedi il [riferimento Tailwind](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## Le cinque interfacce

Ogni interfaccia estende quella precedente:

| Interfaccia | Estende | Usata da |
|---|---|---|
| `LayoutStyle` | | Layout di ogni elemento (flexbox, grid, dimensioni, spaziatura, posizione) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, controlli e ogni altro elemento |
| `TextStyle` | `ViewStyle` | `<Text>` e `<Input>` (e le view, i cui stili del testo passano al testo al loro interno) |
| `InputStyle` | `TextStyle` | `<Input>`: aggiunge `placeholderColor` e `caretColor` |
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

`style` accetta anche un array; le voci vengono unite da sinistra a destra e quelle falsy vengono ignorate, quindi gli stili condizionali non richiedono lo spread. In Rust, `.style_when(condition, …)` aggiunge stili finché la condizione è vera:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> `style` inline ha sempre la precedenza su `class`. Impostare una chiave su `null` o `undefined` la riporta al valore predefinito.

<a id="how-style-keys-read"></a>

## Come si leggono le chiavi di stile

Le chiavi di stile seguono il CSS, quindi uno stile e una classe che indicano la stessa proprietà fanno la stessa cosa:

- **Direzione del layout.** Una view che non imposta `display` dispone i figli in colonna. `display: "flex"` è una riga a meno che `flexDirection` sia impostato, come in CSS e nella classe `flex`. `flexShrink` è `0` se non impostato.
- **Lati fisici e logici.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` e `textAlign: "left"` mantengono il proprio lato nei layout da destra a sinistra. Le chiavi start ed end (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), la famiglia `borderTopStartRadius` e `textAlign: "start" | "end"` seguono la direzione: l'inline start è a sinistra nei layout da sinistra a destra e a destra in quelli da destra a sinistra.
- **Colori dei bordi.** Un bordo o un outline con larghezza impostata e colore non impostato viene disegnato con il colore del testo (`currentColor` di CSS).
- **Transform.** `translate`, `rotate` e `scale` sono proprietà a sé stanti, e `transform` accetta la stringa di funzioni CSS oppure un elenco di passaggi i cui valori possono essere valori animati. Si compongono in quest'ordine: `translate`, `rotate`, `scale`, poi `transform`.

<a id="value-types"></a>

## Tipi di valore

| Tipo | Accetta | Rust |
|---|---|---|
| `number` | Punti (indipendenti dalla densità). `1` è un punto su iOS e un dp su Android. | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (punti), `` `${number}%` `` (rispetto al genitore) oppure `"auto"`. | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (punti) oppure `` `${number}%` ``. Nessun `"auto"`. | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | Una stringa di colore CSS: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()`, oppure un colore CSS con nome (`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, colori del tema (`theme().primary`) |
| `EnvValue` | Una variabile d'ambiente in un padding o margin: `env(name)`, `env(name, <length>)` (la lunghezza sostituisce un nome sconosciuto), `calc(env(name) + <length>)` oppure `calc(<length> + env(name))`. I nomi sono `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Safe area](../elements/safe-area.md)) e `keyboard-inset-height` ([Keyboard](../elements/keyboard.md)). Accettata dalle chiavi fisiche di padding e margin e dalle relative scorciatoie. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | Un valore animato nativo o un nodo derivato da esso (vedi [l'API di animazione di `nsh`](./nsh.md#animation)). Accettato da `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, dai passaggi di un elenco `transform` e da `top` / `left` di una view sticky; il valore si anima quindi sul thread UI senza JS. | `AnimatedValue` / `AnimatedNode`, associato con `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... |

Le stringhe con sintassi CSS (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) accettano lunghezze in `px` e numeri semplici (entrambi in punti), `pt` (4/3 di punto, come in CSS) oppure `rem` (16 punti).

## LayoutStyle

Il layout viene calcolato in Rust (flexbox e CSS grid). Una view che non imposta `display` è un flex container i cui figli sono impilati in colonna; `display: "flex"` ne fa una riga a meno che `flexDirection` sia impostato, come in CSS. Gli elementi hanno come valori predefiniti `flexShrink: 0`, `alignContent: "flex-start"` (grid: `"normal"` di CSS), `alignItems: "stretch"` e nessuna dimensione minima automatica. Vedi [Layout](../docs/layout.md).

<a id="display-and-position"></a>

### Display e posizione

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | Il layout dei figli. `"flex"` li dispone in riga a meno che `flexDirection` imposti una direzione, come in CSS; una view che non imposta display li dispone in colonna. `"none"` rimuove l'elemento dal layout e lo nasconde. `"block"` impila i figli come fa il layout block di CSS. |
| `boxSizing` | `"border-box" \| "content-box"` | | Le dimensioni includono bordi e padding, oppure solo il contenuto. Predefinito `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` toglie l'elemento dal flusso e lo posiziona con `top` / `right` / `bottom` / `left` rispetto all'antenato posizionato più vicino (il genitore, a meno che sia `"static"`). `"static"` resta nel flusso e ignora gli inset. `"fixed"` preserva il tipo dell'elemento e lo dispone e lo monta nella propria surface o root modale, mantenendolo fermo mentre il contenuto circostante scorre. `"sticky"` resta nel flusso e, finché il genitore è visibile, si blocca a `top` (`left` in una scroll view orizzontale) dall'inizio del viewport della scroll view che lo contiene, finché la sua fine non incontra quella del content box del genitore; viene disegnato sopra i fratelli con lo stesso `zIndex`. Predefinito `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | Offset dal bordo superiore del genitore (absolute) o dalla posizione propria dell'elemento (relative). Su una view sticky, indica dove si blocca, e un valore animato lo sposta a ogni frame. |
| `right` | `DimensionValue` | `.right(…)` | Offset dal bordo destro, in entrambe le direzioni. |
| `bottom` | `DimensionValue` | `.bottom(…)` | Offset dal bordo inferiore. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | Offset dal bordo sinistro, in entrambe le direzioni. Su una view sticky in una scroll view orizzontale, indica dove si blocca, e un valore animato lo sposta a ogni frame. |
| `start` | `DimensionValue` | | Offset dal bordo inline start: sinistra nei layout da sinistra a destra, destra in quelli da destra a sinistra. |
| `end` | `DimensionValue` | | Offset dal bordo inline end: destra nei layout da sinistra a destra, sinistra in quelli da destra a sinistra. |
| `zIndex` | `number` | `.z_index(z)` | Ordine tra i fratelli (stabile a parità di valore); è anche l'ordine di sovrapposizione nativo. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | Direzione del layout, ereditata per impostazione predefinita. Come in CSS, le proprietà `left` e `right` mantengono i propri lati da destra a sinistra, mentre quelle inline start / end (`marginStart`, `end`, ...) prendono i lati che la direzione assegna loro. |

### Flexbox

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | L'asse principale. Predefinito `"column"` per una view che non imposta `display`, `"row"` una volta impostato `display: "flex"`. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | Indica se i figli vanno a capo su più righe. Predefinito `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | Un solo numero, non la scorciatoia CSS: un numero positivo imposta `flexGrow` a quel valore, `flexShrink: 1` e `flexBasis: 0`; `0` rende l'elemento non flessibile; un numero negativo lo riduce fino alla dimensione minima. |
| `flexGrow` | `number` | `.flex_grow(f)` | Quanto dello spazio libero occupa l'elemento. Predefinito `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | Quanto si riduce l'elemento quando lo spazio finisce. Predefinito `0`, non `1` come in CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | La dimensione sull'asse principale prima che lo spazio libero venga distribuito. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | Distribuzione dei figli lungo l'asse principale. Predefinito `"normal"`: `"flex-start"` nei flex container; nelle grid, le track di dimensione `auto` si estendono. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | Allineamento dei figli sull'asse trasversale. Predefinito `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | Sostituisce `alignItems` del genitore per questo elemento. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | Distribuzione delle righe a capo (e delle track della grid) sull'asse trasversale. Predefinito `"flex-start"` nei flex container e `"normal"` nelle grid, dove le track di dimensione `auto` si estendono. `"start"` / `"end"` seguono la direzione di scrittura. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | Spazio tra righe e colonne dei figli. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | Spazio tra le righe. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | Spazio tra le colonne. |

### Grid

Imposta `display: "grid"` per disporre i figli in una CSS grid. Gli elenchi di track usano la sintassi CSS.

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Track delle colonne: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, nomi di linea (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Track delle righe, stessa sintassi. |
| `gridAutoColumns` | `string` | | Dimensione delle colonne create implicitamente. |
| `gridAutoRows` | `string` | | Dimensione delle righe create implicitamente. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | Come gli elementi senza posizionamento riempiono la grid. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Posizionamento sulle colonne: `"1 / 3"`, `"span 2"`, un numero di linea o un nome di linea (`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | Linea di colonna iniziale. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | Linea di colonna finale. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Posizionamento sulle righe, stessa sintassi di `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | Linea di riga iniziale. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | Linea di riga finale. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Come gli elementi della grid si collocano nelle loro aree lungo la riga. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Sostituisce `justifyItems` per questo elemento. |

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

### Dimensioni

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | Larghezza. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | Altezza. |
| `minWidth` | `LengthValue` | `.min_w(…)` | Larghezza minima. |
| `minHeight` | `LengthValue` | `.min_h(…)` | Altezza minima. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | Larghezza massima. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | Altezza massima. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | Larghezza divisa per altezza, un numero (`1.5`) o il rapporto CSS (`"16 / 9"`); la dimensione mancante viene calcolata dall'altra. `"auto"` non ne imposta nessuna. |

### Margin

I margin accettano `"auto"` (assorbe lo spazio libero, come in flexbox) e valori negativi. Le chiavi fisiche (tutte tranne `marginStart` / `marginEnd`) accettano anche un `EnvValue`: `marginBottom: "env(keyboard-inset-height)"` (in Rust `.mb_keyboard()`, `.mt_safe_area()`, ...).

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | Tutti e quattro i lati. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | Sinistra e destra. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | Sopra e sotto. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | Sopra. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | Destra. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | Sotto. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | Sinistra. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Inline start: sinistra nei layout da sinistra a destra, destra in quelli da destra a sinistra. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Inline end: il lato opposto a `marginStart`. |

### Padding

Le chiavi fisiche (tutte tranne `paddingStart` / `paddingEnd`) accettano anche un `EnvValue`: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (in Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Un padding è almeno 0.

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | Tutti e quattro i lati. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | Sinistra e destra. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | Sopra e sotto. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | Sopra. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | Destra. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | Sotto. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | Sinistra. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Inline start: sinistra nei layout da sinistra a destra, destra in quelli da destra a sinistra. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Inline end: il lato opposto a `paddingStart`. |

## ViewStyle

Tutto ciò che viene disegnato da una view. Si applicano anche tutte le chiavi di `LayoutStyle`.

<a id="background"></a>

### Sfondo

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | Il colore di riempimento. Accetta un colore animato nativo. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` con `.gradient_from` / `_via` / `_to` | Gradienti CSS disegnati sopra il colore di sfondo: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, più gradienti separati da virgole. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### Bordi

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | Spessore di tutti e quattro i lati. |
| `borderTopWidth` | `number` | `.border_t(w)` | Lato superiore. |
| `borderRightWidth` | `number` | `.border_r(w)` | Lato destro. |
| `borderBottomWidth` | `number` | `.border_b(w)` | Lato inferiore. |
| `borderLeftWidth` | `number` | `.border_l(w)` | Lato sinistro. |
| `borderStartWidth` | `number` | `.border_s(w)` | Lato di inizio inline (sinistro nei layout da sinistra a destra, destro in quelli da destra a sinistra). |
| `borderEndWidth` | `number` | `.border_e(w)` | Lato di fine inline. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | Colore di tutti e quattro i lati. Accetta un colore animato nativo. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | Lato superiore. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | Lato destro. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | Lato inferiore. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | Lato sinistro. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | Lato di inizio inline. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | Lato di fine inline. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | Stile della linea. Valore predefinito `"solid"`. `"none"` e `"hidden"` non disegnano né occupano spazio con alcun bordo, qualunque sia lo spessore, impostato prima o dopo, come in CSS. |

Un lato con lo spessore impostato e un colore che nessuno imposta viene disegnato con il colore del testo, il `currentColor` di CSS: `{ borderWidth: 1, color: "#2563eb" }` disegna un bordo blu. Anche gli outline prendono il colore del testo allo stesso modo.

<a id="corners"></a>

### Angoli

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | Raggio di tutti e quattro gli angoli. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | Angolo in alto a sinistra. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | Angolo in alto a destra. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | Angolo in basso a destra. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | Angolo in basso a sinistra. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | Angolo superiore sul lato di inizio inline. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | Angolo superiore sul lato di fine inline. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | Angolo inferiore sul lato di inizio inline. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | Angolo inferiore sul lato di fine inline. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: angoli la cui curvatura si raccorda gradualmente ai bordi, come le icone delle app iOS. Dove il box è troppo piccolo la curva torna circolare, così le forme a pillola restano tali. Funziona su entrambe le piattaforme. |

### Outline

Un outline viene disegnato all'esterno del bordo e non occupa spazio nel layout.

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | Spessore della linea. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | Colore della linea. Per impostazione predefinita è il colore del testo. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | Stile della linea. |
| `outlineOffset` | `number` | `.outline_offset(o)` | Distanza dal bordo; i valori negativi lo spostano all'interno. |

<a id="shadows"></a>

### Ombre

Una vista proietta ombre con il `boxShadow` di CSS: più livelli, ombre con spread e ombre inset. Le transizioni la animano (`transitionProperty: "boxShadow"`).

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | `box-shadow` di CSS: offset, sfocatura, spread e colore, più livelli separati da virgole, `inset` per le ombre interne; oppure i suoi livelli come numeri, `[{ x, y, blur, spread, color, inset }]` (solo `x` e `y` sono obbligatori); un livello senza colore viene disegnato con il colore del testo, come il `currentColor` di CSS. `.shadow_color(c)` ricolora i livelli di un preset o di `.shadow(…)`. |

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
> Su Android le ombre richiedono uno sfondo: una vista con sfondo trasparente (ad esempio testo senza nulla dietro) non proietta alcuna ombra. Per l'ombra material di Android usa invece la prop `android={{ elevation }}` al posto di uno stile.

<a id="opacity-visibility-and-overflow"></a>

### Opacità, visibilità e overflow

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | Da 0 (invisibile) a 1. Accetta un valore animato nativo. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | Le viste nascoste mantengono il loro spazio nel layout (a differenza di `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` ritaglia i figli ai limiti della vista (e ai suoi angoli). |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: invisibile mentre una rotazione 3D la volta di spalle. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | Dove una vista o un'immagine all'interno di un `<Text>` si colloca nella sua riga, come il `vertical-align` di CSS: con il bordo inferiore sulla linea di base (predefinito), con il bordo superiore o inferiore alla sommità o alla base del font del testo, oppure con il centro a metà dell'altezza della x sopra la linea di base. La riga cresce per contenerla. |

<a id="transforms"></a>

### Trasformazioni

Le trasformazioni sono quelle di CSS: le proprietà `translate`, `rotate` e `scale` e `transform`, composte in quest'ordine. Ciascuna è una proprietà a sé, quindi il `scale` di uno stile sostituisce il `scale-*` di una classe e mantiene il suo `rotate-*`, e il `transform` di uno stile sostituisce le funzioni di trasformazione di una classe (`rotate-x-*`, `skew-*`).

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | `translate` di CSS: x, poi y (`"10px 20px"`; percentuali della dimensione della vista stessa, `"-50% 0"`). Un numero indica punti lungo x. `[x, y]` accetta un numero, una stringa (`"50%"`, `"10px"`) o un valore animato per asse; un valore animato da solo la sposta lungo x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | `rotate` di CSS: `"45deg"`, `"0.5turn"`, oppure attorno a un asse, `"x 90deg"`. Un numero, così come un valore animato, indica gradi attorno a z, in senso orario. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | `scale` di CSS: `1.5`, `"150%"`, x e y (`"1 2"`). Un valore animato scala entrambi gli assi; `[x, y]` accetta un numero o un valore animato per asse. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; passi animati: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (dopo ogni trasformazione di stile) | `transform` di CSS: `"translateX(10px) rotate(45deg) scale(1.5)"`, oppure `"none"`. Funzioni: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. Le lunghezze accettano `px` (le traslazioni anche `%`, della dimensione della vista stessa), gli angoli `deg`, `rad` o `turn`. Oppure un elenco di passi le cui quantità possono essere valori animati: ciò che la stringa non può contenere, come una rotazione 3D animata (`[{ perspective: 800 }, { rotateY: angle }]`), e i canali di un movimento (`m.transform`). Il `transform` di uno stile è l'una o l'altra forma, quindi una prospettiva prima di passi animati è un passo dell'elenco. Applicato dopo `translate`, `rotate` e `scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | Il punto attorno al quale agiscono le trasformazioni: parole chiave, percentuali e lunghezze (`"top left"`, `"50% 0"`, `[10, 20]`). Per impostazione predefinita è il centro. |

Un `TransformStep` è un oggetto con una sola chiave, applicato nell'ordine dell'elenco:

| Passo | Valore | Animato nativo |
|---|---|---|
| `translateX`, `translateY` | `number` (punti) | sì |
| `scale`, `scaleX`, `scaleY` | `number` (fattore) | sì |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (gradi) o `string` (`"45deg"`, `"0.5rad"`) | sì |
| `skewX`, `skewY` | `number` (gradi) o `string` | no |
| `perspective` | `number` (punti) | no |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

Un valore animato pilota direttamente `translate`, `rotate` e `scale`, e i passi di un elenco `transform`:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android non disegna lo skew: `skew()`, `skewX()` e `skewY()` lasciano la vista senza skew su quella piattaforma.

<a id="filters-and-blending"></a>

### Filtri e blending

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | Filtri CSS della vista e del suo contenuto: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | Filtri CSS di ciò che sta dietro la vista, come `"blur(10px)"` per il vetro smerigliato. |
| `maskImage` | `string` | | Un gradiente CSS il cui alfa decide quanta parte della vista viene disegnata, per intero dove è opaco e per nulla dove è trasparente: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. Maschera tutto ciò che la vista disegna, compreso il suo filtro di sfondo. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass dietro il contenuto della vista su iOS 26 e macOS 26 e successivi. `"regular"` usa il materiale standard; `"clear"` prende meno colore dallo sfondo. `"none"` è il valore predefinito. Abbinalo a `backdropFilter` per la sfocatura mostrata nelle versioni precedenti di iOS e sulle altre piattaforme. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | Come la vista si fonde con ciò che le sta dietro. |

> [!WARNING]
> Limiti delle piattaforme:
> - iOS applica alle viste solo `opacity()`, `brightness()` fino a 1 e `drop-shadow()`. `<Image>` accetta ogni filtro colore e `blur()`, applicati mentre l'immagine viene decodificata.
> - La sfocatura `backdropFilter` di iOS usa un materiale di sistema a una frazione, un'approssimazione del raggio esatto.
> - Android richiede API 31 per `blur()`, `drop-shadow()` e `backdropFilter`; al di sotto si applicano solo i filtri colore. Le modalità di blend richiedono API 29.

<a id="transitions"></a>

### Transizioni

Quando una proprietà con transizione cambia (da un nuovo stile, una classe o una variante come `active:`), la piattaforma la anima in modo nativo. Durante l'animazione non viene eseguito alcun JS.

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | Proprietà da animare, separate da virgole: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (ogni proprietà di trasformazione), `"boxShadow"`, `"borderRadius"`, `"borderWidth"`, oppure `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | Millisecondi come numero, oppure `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | Ritardo prima dell'inizio della transizione. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | La curva di easing. |

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

### Animazioni keyframe

Animazioni keyframe integrate, eseguite in modo nativo (`animate-*` di Tailwind).

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | L'animazione. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Durata di una iterazione. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Ritardo prima della prima iterazione. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | La curva di easing. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | Quante volte viene eseguita. |

Per le animazioni guidate da valori, gesti o molle, usa invece l'[API di animazione di `nsh`](./nsh.md#animation).

<a id="pointer-and-selection"></a>

### Puntatore e selezione

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (ogni parola chiave di cursore CSS, e `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | La forma del puntatore sopra la vista, per i dispositivi di puntamento (trackpad dell'iPad, Mac Catalyst, desktop). Le parole chiave di ridimensionamento diagonale mantengono il loro asse: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) e `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, il web e GPUI mostrano i cursori diagonali; AppKit li usa su macOS 15+, con una mano aperta su macOS 14. UIKit usa gli effetti del puntatore su iPad e Mac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | Quali tocchi la vista e le viste al suo interno accettano (`pointer-events-none`, `pointer-events-auto`). `"none"`: nessuno, anche per le viste al suo interno a meno che una non imposti `"auto"`, ereditato come in CSS. `"box-none"`: nessuno sulla vista stessa, le viste al suo interno accettano i propri; `"box-only"`: la vista stessa li accetta, le viste al suo interno nessuno (entrambi quelli di React Native, solo per la vista). Valore predefinito `"auto"`. Vedi [tocco e gesti](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | Se un `<Text>` può essere selezionato e copiato (`"text"`, `select-text`) o no (`"none"`, `select-none`); il valore di una vista raggiunge i testi al suo interno che non ne impostano alcuno. `"auto"` (`select-auto`), il valore predefinito, lo lascia alla vista che lo circonda, altrimenti alla piattaforma. Vedi [testo](../elements/text.md). |

<a id="svg-paint"></a>

### Paint SVG

Le proprietà di paint CSS delle forme SVG, che qualsiasi elemento accetta e che gli elementi al suo interno ereditano, come in un browser.
Dipingono ciò che i componenti Rust disegnano sui canvas.

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | Con cosa vengono riempite le forme; `currentColor` è il colore del testo dell'elemento. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | Con cosa vengono dipinti i contorni delle forme. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | Lo spessore di quei contorni, una lunghezza (1 per impostazione predefinita). |
| `strokeDasharray` | `number \| string` | — | Tratti e spazi lungo quei contorni: lunghezze separate da spazi o virgole (`"4 2"`), un elenco dispari viene ripetuto, oppure `"none"`. |

## TextStyle

Gli stili di testo si applicano a `<Text>` e `<Input>`. Sono anche ereditati, come in CSS: le proprietà di testo impostate su una vista passano ai testi e agli input al suo interno, e gli span `<Text>` annidati ereditano dal testo genitore. Si applicano anche tutte le chiavi di `ViewStyle`. Vedi [Testo](../docs/text.md).

### Font

| Chiave | Tipo | Rust | Descrizione |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | Colore del testo. Accetta un colore animato nativo. È anche il colore di bordi e outline che non ne impostano alcuno. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | Dimensione in punti. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) oppure 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | Una famiglia di sistema, o il nome a cui si valuta un font importato (`import Inter from "./Inter.ttf"`), o un elenco di essi, dal più preferito (`"Brand, 'Noto Sans SC', sans-serif"`). Vedi [Font](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | Corsivo. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | Forme OpenType di numeri e lettere, un elenco (`["tabular-nums"]`) oppure i nomi CSS separati da spazi (`"tabular-nums small-caps"`). `tabular-nums` mantiene le cifre della stessa larghezza, utile per contatori e timer. |
<a id="spacing-and-alignment"></a>

### Spaziatura e allineamento

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | Altezza della riga in punti. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | Spazio aggiuntivo tra i caratteri, in punti. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | Allineamento orizzontale. `"left"` e `"right"` mantengono i rispettivi lati nei layout da destra a sinistra; `"start"` e `"end"` seguono la direzione. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | Direzione di base del testo; `"auto"` la ricava dal contenuto. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | Trasformazione maiuscole/minuscole. |

> [!TIP]
> Le classi `leading-*` e `tracking-*` di Tailwind impostano l'altezza della riga come multiplo della dimensione del font e la spaziatura tra le lettere in `em`, quindi si adattano alle dimensioni `text-*`.

<a id="lines-and-overflow"></a>

### Righe e overflow

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | Il numero massimo di righe mostrate da un `<Text>` (`line-clamp`, `line-clamp-*` di CSS); `0` (`line-clamp-none`), il valore predefinito, le mostra tutte. `truncate` è una sola riga troncata con i puntini di sospensione. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | Come viene troncato un `<Text>` limitato: con i puntini di sospensione alla fine (`"ellipsis"`, `text-ellipsis`, il valore predefinito), con un taglio netto (`"clip"`, `text-clip`), oppure con i puntini di sospensione all'inizio o al centro (percorsi di file). |

<a id="decoration"></a>

### Decorazione

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | Linee disegnate insieme al testo. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | Colore delle linee (per impostazione predefinita, il colore del testo). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | Stile della linea. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | Spessore della linea. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | Distanza della sottolineatura dalla linea di base. |

<a id="placeholder-caret-and-selection"></a>

### Segnaposto, cursore e selezione

`placeholderColor` e `caretColor` appartengono a `InputStyle`, lo stile di `<Input>`; `selectionColor` a `TextStyle`, poiché anche i testi selezionabili lo accettano.

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` di un input | Il colore del segnaposto di un `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | Dove si posiziona il testo più corto del suo riquadro (un `<Text>` con un'altezza). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` di un input o di un testo | L'evidenziazione della selezione e le maniglie di un `<Input>` o di un `<Text>` selezionabile (`selection:bg-*`); per impostazione predefinita, il colore di accento della piattaforma. Su iOS anche il cursore di un input, a meno che `caretColor` non sia impostato (UIKit colora entrambi con un solo colore). |
| `caretColor` | `ColorValue` | `.caret_color(c)` di un input | Il cursore di un `<Input>` (`caret-*`); se non impostato, il valore predefinito della piattaforma. |

<a id="text-shadow"></a>

### Ombra del testo

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | `text-shadow` di CSS: scostamenti, sfocatura e colore (`"0 1px 2px rgb(0 0 0 / 0.3)"`), oppure i suoi livelli come numeri, `[{ x, y, blur, color }]`; se ci sono più livelli, viene disegnato come il più ampio; un livello senza colore viene disegnato con il colore del testo; `"none"`. |

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
> iOS non disegna gradienti (`backgroundImage`) né ombre interne del riquadro su `<Text>`.

## ImageStyle

Tutte le chiavi di `ViewStyle`, più:

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` di un'immagine | Ricolora un'immagine template (ogni pixel opaco assume questo colore), per icone monocromatiche. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | `object-fit` di CSS: come un'immagine o un video si adatta al proprio riquadro. `"cover"` lo riempie e ritaglia, `"contain"` lo adatta all'interno, `"fill"` lo stira, `"none"` mantiene la dimensione naturale, `"scale-down"` equivale a `"none"` o `"contain"`, a seconda di quale sia il più piccolo. Per impostazione predefinita le immagini coprono il proprio riquadro, mentre i video vi sono contenuti. |
| `objectPosition` | `string` | `.object_position(p)`, `.object_top()`, ... di un'immagine | Dove si posiziona l'immagine nel proprio riquadro dopo che `objectFit` l'ha dimensionata, come `object-position` di CSS: parole chiave, percentuali e lunghezze (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). Un'immagine che copre il riquadro viene ritagliata attorno a questo punto. Per impostazione predefinita, il centro. |

`objectFit` si applica anche a `<Video>`; vedi [image](../elements/image.md) e [video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## Prop che sembrano stili

L'ombra material di Android è una prop della piattaforma, impostata accanto allo stile:

| Setting | Prop | Rust | Class |
|---|---|---|---|
| Ombra material (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## Correlati

- [Styling](../docs/styling.md): `style`, `class`, ereditarietà e precedenza.
- [Tailwind reference](./tailwind-reference.md): ogni utility e variante supportata.
- [Layout](../docs/layout.md): flexbox e grid in pratica.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): gli elementi a cui si applicano questi stili.

`width`, `height` e `flexBasis` accettano anche `"min-content"`, `"max-content"` e `"fit-content"`, calcolati da Taffy.
