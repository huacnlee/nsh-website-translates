---
title: "Riferimento Tailwind"
description: "Tutte le utility e le varianti di Tailwind che NSH risolve in modo nativo, la sintassi dei valori arbitrari e come estendere il tema in nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---

# Riferimento Tailwind

Ogni elemento accetta classi Tailwind CSS nella prop `class` (e quelle condizionali in `classList`). NSH le risolve in Rust rispetto al tema predefinito di Tailwind 4: JS passa solo la stringa, ogni stringa distinta viene analizzata una sola volta e messa in cache, e varianti come `dark:` o `active:` vengono rivalutate in modo nativo quando cambiano l'aspetto, la dimensione della finestra o lo stato di pressione, senza eseguire alcun JS.

Ogni utility imposta esattamente ciò che Tailwind CSS 4 genera per essa, con lo stesso significato che ha in un browser. Questa pagina elenca ciò che è supportato. Per un'introduzione vedi [Tailwind](../docs/tailwind.md); per le chiavi di stile impostate dalle utility, vedi il [Riferimento degli stili](./style-reference.md).

I componenti Rust non accettano stringhe di classi: stilizzano gli elementi con i metodi tipizzati di `Styled` (`nsh_core::prelude`), che prendono il nome da queste utility e si risolvono negli stessi valori, comprese le scale predefinite di Tailwind (`px-4` è `.px_4()`, `rounded-2xl` `.rounded_2xl()`, `shadow-md` `.shadow_md()`, `bg-linear-to-br` `.bg_linear_to_br()`). I colori sono valori: colori del tema, oppure la palette di Tailwind come `nsh_core::element::palette` (`ZINC.shade(800)` è `zinc-800`). Le varianti sono metodi che accettano una closure di stili: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)` e `.style_when(condition, …)` per tutte le altre. Il [Riferimento degli stili](./style-reference.md) indica il metodo di ogni chiave di stile.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Come si combinano le classi

- **Vince l'ultima.** Tra utility dello stesso livello di variante, vince quella che compare più avanti nella stringa: `"p-4 p-2"` è `p-2`. Un componente può accettare una prop `class` e aggiungerla alle proprie classi senza `tailwind-merge`.
- **Le varianti si applicano dopo le utility semplici**, nell'ordine delle varianti di Tailwind: `group-*:` (prima per stato, poi per nome del gruppo), `selection:`, `placeholder:`, posizione (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (per nome), movimento, `max-*:` breakpoint dal più ampio, poi breakpoint in ordine crescente, orientamento, direzione, `dark:`, infine piattaforma. Decide la variante più alta di una classe, poi la successiva più alta, e un'altra variante viene dopo (`dark:hover:` dopo `dark:`), come Tailwind le ordina. Quindi `"active:bg-red-500 bg-blue-500"` è rosso mentre è premuto.
- **`style` vince sulle classi.** Lo `style` inline viene applicato sopra le classi risolte. Una chiave di stile è la proprietà CSS con lo stesso nome, quella impostata dalle utility, quindi sostituisce quella proprietà e nient'altro: `style={{ paddingLeft: 8 }}` batte `pl-4` e mantiene `pr-4`. Anche un'utility important (`!p-4` o `p-4!`) vince sullo stile inline.
- **Gli stili di testo si ereditano.** Le utility di testo su una view (`text-white`, `font-bold`, `text-center`, ...) passano agli elementi `<Text>` e `<Input>` al suo interno, come in CSS.
- **Il display è quello di CSS.** `flex` e `inline-flex` creano una riga a meno che un'utility di direzione dica altrimenti, ovunque si trovi nella stringa (`flex-col flex` è una colonna). Anche il `display: "flex"` di uno stile è una riga allo stesso modo; le view che non impostano alcun display mantengono la colonna predefinita di NSH.

<a id="units-and-the-theme"></a>

## Unità e tema

Le lunghezze sono in punti (`1` = un punto su iOS, un dp su Android). Il `1rem` di Tailwind è di 16 punti, quindi il tema corrisponde a quello del web alla stessa densità: un passo di spaziatura è di 4 punti (`p-4` = 16 punti), `text-base` è di 16 punti.

<a id="spacing-values"></a>

### Valori di spaziatura

Le utility che accettano un valore di spaziatura (padding, margin, gap, inset, larghezza, altezza, `basis`, `translate`, `leading`) accettano:

| Valore | Esempio | Risultato |
|---|---|---|
| Passi (sono ammessi i quarti di passo) | `p-4`, `gap-1.5`, `m-0.25` | passo × 4 punti |
| `px` | `p-px`, `-mt-px` | 1 punto |
| `0` | `m-0` | 0 |
| Frazione (inset, larghezza, altezza, `basis`, `translate`) | `w-1/2`, `left-1/3` | percentuale del genitore |
| `full` (lo stesso) | `w-full`, `inset-full` | 100% |
| `auto` (margin, inset, larghezza, altezza, basis) | `mx-auto`, `w-auto` | `"auto"` |
| Arbitrario | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | la lunghezza indicata |

Margin, inset, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, le linee della griglia e gli angoli dei gradienti accettano un `-` iniziale per i valori negativi: `-mt-2`, `-translate-x-1/2`, `-rotate-6`. Tailwind non ha una forma negativa per le altre (`-p-4`, `-gap-2`, `-w-4`), e nemmeno NSH.

<a id="colors"></a>

### Colori

L'intera palette di Tailwind 4 è integrata: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, ciascuno nelle tonalità `50`, `100`–`900`, `950`; più `black`, `white` e `transparent`. I tuoi colori personalizzati provengono da `nsh.json` (vedi [Personalizzazione del tema](#theme-customization)).

Ogni utility di colore accetta:

| Forma | Esempio |
|---|---|
| Un colore del tema | `bg-sky-500`, `text-brand` |
| Un modificatore di opacità (percentuale) | `bg-black/50`, `ring-black/5` |
| Un'opacità arbitraria | `text-black/[0.35]` |
| Un colore arbitrario | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Un colore arbitrario con un modificatore | `bg-[rgb(0_0_255)]/25` |

`currentColor` e `inherit` non sono valori di colore. Come in un browser, un bordo, un outline o un ring senza una classe di colore viene disegnato con il colore del testo dell'elemento, il proprio o quello ereditato (`<View class="text-white"><View class="border ring-2" /></View>` li disegna entrambi bianchi), e lo stesso vale per un bordo la cui larghezza è impostata dalla prop `style` senza un colore.

<a id="arbitrary-values"></a>

## Valori arbitrari

Le parentesi quadre passano un valore che il tema non possiede: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` sta per uno spazio (`grid-cols-[1fr_2fr]`); scrivi `\_` per un trattino basso letterale.
- Lunghezze: un numero semplice o `px` (punti), `pt` (4/3 di punto, come in CSS), `rem` (16 punti), e `%` dove le percentuali hanno senso.
- Angoli (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`.
- Tempi (`duration-[...]`, `delay-[...]`): `ms` o `s`; un numero semplice è in millisecondi.
- Gli indizi di tipo risolvono i valori ambigui: `text-[length:22px]` è una dimensione, `text-[color:#333]` un colore; `border-[length:3px]` allo stesso modo.

Le proprietà CSS arbitrarie (`[mask-type:luminance]`) non sono supportate.

## Layout

| Classe | Imposta |
|---|---|
| `flex`, `inline-flex` | `display: "flex"`, e una riga a meno che sia presente un'utility di direzione |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | layout a blocchi o un contesto di formattazione a blocchi indipendente |
| `box-border`, `box-content` | le dimensioni includono bordi e padding, oppure solo il contenuto |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | dimensioni intrinseche di Taffy: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: ciò che un browser calcola per essi in un genitore flex o grid |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: nel flusso, con i suoi inset ignorati; i discendenti assoluti usano l'antenato posizionato più vicino |
| `sticky` | `position: "sticky"`: nel flusso, resta fissato `top` (`left` in una scroll view orizzontale) all'interno della scroll view che lo circonda finché il suo genitore è visibile |
| `fixed` | `position: "fixed"`: un elemento disposto nel riquadro della sua root view (la finestra o il suo modal) sopra i figli di quella root view, rimanendo al suo posto mentre ciò che lo circonda scorre |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | l'offset corrispondente |
| `start-<n>`, `end-<n>` | `start` / `end` (sensibile alla direzione) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` è 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (mantiene il proprio spazio) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, nessuno) |

Lo scorrimento è un elemento, non una classe: `overflow-auto` e `overflow-scroll` non sono supportati; usa [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox e grid

| Classe | Imposta |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1, shrink 1, basis 0 |
| `flex-<n>` | grow n, shrink 1, basis 0 |
| `flex-auto` | grow 1, shrink 1, basis auto |
| `flex-initial` | grow 0, shrink 1, basis auto |
| `flex-none` | grow 0, shrink 0, basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | la scorciatoia CSS: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (senza valore: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (senza valore: 1) |
| `basis-<n>` | `flexBasis` (spaziatura, frazione, `full`, `auto`, arbitrario) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` e `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` e `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` e `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (e negativo) | un margin su ogni figlio tranne l'ultimo: il margine finale (`space-x`) o quello inferiore (`space-y`), sotto i margini propri del figlio, come in Tailwind CSS; si somma a un `gap` |
| `space-x-reverse`, `space-y-reverse` | invece il margin sul lato iniziale / superiore (figli in ordine inverso) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (e `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (e `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## Spaziatura

| Classe | Imposta |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (sensibile alla direzione) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (sensibile alla direzione) |

<a id="sizing"></a>

## Dimensionamento

| Classe | Imposta |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (spaziatura, frazione, `full`, `auto`, arbitrario) |
| `size-<n>` | `width` e `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | il limite corrispondente |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | la larghezza della finestra (anche su `min-w-` / `max-w-`) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | l'altezza della finestra (anche su `min-h-` / `max-h-`) |
| `w-auto`, `h-auto` | `auto` (dimensionato in base al contenuto) |
| `max-w-none`, `max-h-none` | nessun limite |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | una larghezza di container (sotto) |

Larghezze dei container (punti): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280; `prose` è 65 volte la larghezza del `0` del font dell'elemento (il `65ch` di CSS), come in Tailwind CSS.

<a id="typography"></a>

## Tipografia

### Font

| Classe | Imposta |
|---|---|
| `font-sans` | il font di sistema |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | un peso numerico, altrimenti una famiglia: `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (si combinano; `normal-nums` reimposta le forme numeriche) |

<a id="size-color-and-line-height"></a>

### Dimensione, colore e altezza di riga

`text-<size>` imposta la dimensione del font e la corrispondente altezza di riga di Tailwind, che una classe `leading-*` sostituisce ovunque si trovi nella stringa e qualunque sia la sua variante (`leading-tight md:text-lg` mantiene l'interlinea stretta):

| Classe | Dimensione | Altezza di riga |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Classe | Imposta |
|---|---|
| `text-<size>/<leading>` | dimensione e altezza di riga: `text-sm/6` (24 punti), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | `lineHeight` come multiplo della dimensione del font |
| `leading-<n>`, `leading-[<length>]` | `lineHeight` in punti (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` come multiplo della dimensione del font (`leading-[1.5]`), ereditato come quel moltiplicatore; `em` e `%` calcolano una lunghezza alla dimensione del font dell'elemento prima dell'ereditarietà |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | `letterSpacing` relativo alla dimensione del font |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Allineamento, maiuscole/minuscole e a capo

| Classe | Imposta |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: l'inizio o la fine della riga nella direzione del layout |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (view e immagini all'interno di un testo) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | una riga, ellissi finale, nessun a capo, `overflow: hidden` (su una view: i suoi testi non vanno a capo) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` mostra tutte le righe) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | le righe non vanno mai a capo; su una view, le righe dei testi al suo interno (ereditato, come il `white-space` di CSS) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | le righe vanno a capo (il bilanciamento non viene eseguito) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`; su una view, dei testi al suo interno che non ne impostano alcuno |
| `select-auto` | `userSelect: "auto"`: decide la view che lo circonda, come il `user-select: auto` di CSS (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### Decorazione e ombra

| Classe | Imposta |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | un'ombra del testo dal tema (un solo livello: il più ampio tra quelli del tema); il modificatore è l'alfa dei livelli: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | il suo colore, con l'alfa della dimensione |
| `text-shadow-none` | la rimuove |

Le ombre del testo di Tailwind hanno più livelli; in modo nativo viene disegnata una sola ombra, il livello più ampio.

<a id="inputs"></a>

### Input

| Classe | Imposta |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (l'evidenziazione della selezione di un input o di un testo selezionabile, e di quelli all'interno dell'elemento) |
| `caret-<color>` | il colore del cursore |

<a id="backgrounds"></a>

## Sfondi

| Classe | Imposta |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | un gradiente lineare verso un lato o un angolo (`bg-gradient-to-*` è il nome della v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | un gradiente lineare con un angolo: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | un gradiente radiale dal centro |
| `bg-conic`, `bg-conic-<angle>` | un gradiente conico, con un angolo iniziale facoltativo |
| `from-<color>`, `via-<color>`, `to-<color>` | gli stop del gradiente (per impostazione predefinita trasparenti alle estremità) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | posizioni degli stop: `via-40%`, `from-[15%]` |
| `bg-none` | rimuove il gradiente |

Le utility dei gradienti mescolano i colori in Oklab, come le scrive Tailwind CSS (`in oklab`); a una posizione arbitraria (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`) seguono il comportamento predefinito di CSS: Oklab con i colori della palette e sRGB quando ogni stop è un colore esadecimale, `rgb()`, `hsl()` o con nome.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## Bordi

| Classe | Imposta |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (da sola: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (con `-<n>` o da sole) | gli spessori dei lati corrispondenti |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` e i colori per lato |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: nessun bordo qualunque siano le classi di spessore, in qualsiasi ordine (`md:border-solid` lo mostra di nuovo) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (da sola: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | gli angoli corrispondenti |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | angoli di inizio / fine (sensibili alla direzione): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (da sola: 1), continuo salvo che una classe di stile sia presente in un punto qualsiasi della stringa (`outline-dashed outline-2` è tratteggiato, `outline-none outline-2` non disegna nulla) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`; uno stile da solo ha lo spessore medium di CSS, 3 punti |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

Dimensioni del raggio (punti): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### Anelli

Gli anelli sono ombre del box con uno spread, disegnate fuori dal bordo senza occupare spazio.

| Classe | Imposta |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | un anello di quello spessore (da solo: 1) |
| `ring-<color>` | il suo colore (predefinito: il colore del testo dell'elemento) |
| `ring-inset` | disegna l'anello all'interno |
| `ring-offset-<n>`, `ring-offset-<color>` | uno spazio tra elemento e anello (predefinito: bianco) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | un anello interno |

<a id="effects"></a>

## Effetti

| Classe | Imposta |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | `boxShadow` dal tema; il modificatore è l'alfa dei livelli: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | un'ombra arbitraria: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | ricolora i livelli dell'ombra, con l'alfa della dimensione: `shadow-indigo-500/40` |
| `shadow-none` | nessuna ombra |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | un'ombra interna |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

Ombre, anelli e ombre interne si combinano in un'unica lista `boxShadow`, come in CSS. Il colore dell'ombra sostituisce il colore di ogni livello, alfa compreso, come `--tw-shadow-color` di Tailwind: `shadow-md shadow-red-500` è un'ombra rossa opaca, `shadow-md/20 shadow-red-500` una al 20%.

<a id="filters"></a>

## Filtri

| Classe | Imposta |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | fattori percentuali: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | da sola: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>` su entrambi | un `drop-shadow()` per livello, dopo gli altri filtri; un colore sostituisce quello dei livelli, con l'alfa della dimensione; Web, Linux, Windows e GPUI disegnano ogni livello, iOS, macOS e Android il più ampio |
| `drop-shadow-none` | lo rimuove |
| `filter-none` | rimuove tutti i filtri |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | sfoca ciò che sta dietro la vista |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | filtri backdrop |
| `backdrop-filter-none` | li rimuove |

> [!WARNING]
> iOS applica solo `opacity`, `brightness` fino a 1 e `drop-shadow` alle viste; `<Image>` accetta ogni filtro colore e `blur`. Android richiede API 31 per `blur`, `drop-shadow` e il backdrop blur. Vedi il [riferimento degli stili](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## Trasformazioni

| Classe | Imposta |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (spaziatura, `full`, frazioni della dimensione dell'elemento stesso: `-translate-x-1/2`, arbitrario) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | rotazione 3D (in `transform`, dopo la traslazione, la rotazione e la scala) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100` specchia |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | inclinazione (skew), in `transform` (non su Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | profondità per le rotazioni 3D dei figli dell'elemento, vista dal suo centro (`perspective` di CSS: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | azzera le rotazioni 3D e le inclinazioni (`transform: none` di CSS) |
| `translate-none`, `rotate-none`, `scale-none` | azzera la traslazione, la rotazione, la scala |

Le utility di trasformazione si compongono come in CSS: `translate-*`, `rotate-*` e `scale-*` impostano le proprietà `translate`, `rotate` e `scale` e si combinano indipendentemente dall'ordine; poi si applica `transform` (`rotate-x-*`, `skew-*`). Le chiavi della prop `style` con gli stessi nomi sostituiscono solo la propria proprietà: `style={{ scale: 1.1 }}` sostituisce `scale-95` e mantiene `rotate-3`. `transform`, `transform-gpu`, `transform-cpu` e `transform-flat` sono accettate e non fanno nulla: NSH compone ogni trasformazione allo stesso modo, in piano. Le traslazioni per una frazione della dimensione vengono risolte rispetto al frame dell'elemento e lo seguono quando viene ridimensionato.

<a id="transitions-and-animation"></a>

## Transizioni e animazione

| Classe | Imposta |
|---|---|
| `transition` | colori, opacità, ombra e trasformazione; 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | le proprietà animate |
| `transition-none` | nessuna transizione |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | un'animazione nativa a keyframe, ripetuta all'infinito |
| `animate-none` | la ferma |

Le transizioni vengono eseguite sul thread UI quando un valore cambia, anche quando una variante inizia o smette di corrispondere, quindi `transition active:scale-95` anima la pressione senza JS. Racchiudi le animazioni in `motion-safe:` per rispettare l'impostazione di riduzione del movimento.

<a id="interactivity"></a>

## Interattività

| Classe | Imposta |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: se la vista è un bersaglio per i tocchi e il puntatore, ereditato come in CSS: dentro una vista `pointer-events-none`, una `pointer-events-auto` torna a essere un bersaglio |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (ogni parola chiave del cursore CSS) |
| `select-none`, `select-text`, `select-auto` | selezione del testo (vedi Tipografia) |

## SVG

| Classe | Imposta |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` è `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## Immagini

| Classe | Imposta |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` stira, `none` mantiene la dimensione naturale, posizionata in `objectPosition`, `scale-down` è uguale ma ridotta per adattarsi dove è più grande); immagini e video |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... equivalgono a `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (ricolora le immagini template) |

<a id="accepted-without-effect"></a>

## Accettate senza effetto

Queste utility sono suggerimenti di rendering, o ciò che ogni vista nativa è già; vengono analizzate senza avvisi e non cambiano nulla: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. Scorrimento, snapping e overscroll sono prop di [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## Non supportate

Le varianti `peer-*`, gli pseudo-elementi (`before:`, `after:`), le proprietà arbitrarie (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, le container query, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, i vincoli min/max intrinseci (come `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` e `isolate` sono classi sconosciute. `nsh build` e `nsh dev` segnalano le classi sconosciute che trovano nel tuo sorgente (`file:line:col: unknown class '...'`), e il runtime registra nel log ogni classe sconosciuta una sola volta.

<a id="variants"></a>

## Varianti

Le varianti rendono condizionale una utility: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. Si combinano (`dark:active:bg-zinc-700`) e vengono valutate in modo nativo ogni volta che cambia ciò da cui dipendono.

<a id="appearance-and-environment"></a>

### Aspetto e ambiente

| Variante | Si applica quando | Rust |
|---|---|---|
| `dark:` | l'aspetto è scuro | `.dark(\|s\| …)` |
| `ios:` | in esecuzione su iOS o Mac Catalyst | `.when(os() == Os::Ios, …)` |
| `android:` | in esecuzione su Android | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | la finestra è più alta che larga / più larga che alta | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | la direzione del layout | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | l'utente non ha richiesto / ha richiesto la riduzione del movimento | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### Breakpoint

I breakpoint confrontano la larghezza della finestra in punti.

| Variante | Larghezza minima |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| Forma | Esempio | Si applica quando |
|---|---|---|
| `<bp>:` | `md:p-8` | larghezza ≥ breakpoint |
| `max-<bp>:` | `max-md:p-1` | larghezza < breakpoint |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | larghezza ≥ la lunghezza |
| `max-[<length>]:` | `max-[400px]:text-sm` | larghezza < la lunghezza |

Un telefono in verticale (largo 390 punti) non corrisponde a nessuno dei breakpoint predefiniti; un tablet o un telefono in orizzontale ne soddisfa diversi. In Rust, un breakpoint è una condizione sulla finestra: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` è `md:p-8`.

<a id="interaction-states"></a>

### Stati di interazione

Gli stati sono tracciati dalla piattaforma solo per gli elementi le cui classi li usano, e le modifiche si applicano in modo nativo, senza round trip verso JS.

| Variante | Si applica quando | Rust |
|---|---|---|
| `active:` | l'elemento è premuto | `.active(\|s\| …)` |
| `hover:` | un puntatore è sopra l'elemento (puntatore iPad, Mac Catalyst, mouse Android) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | l'input ha il focus | `.focus(\|s\| …)` |
| `focus-within:` | l'elemento o un discendente ha il focus (il contenuto di un `Overlay` è un discendente dell'elemento in cui si trova) | `.focus_within(…)` |
| `disabled:` | l'elemento ha la prop `disabled` | `.disabled_style(\|s\| …)` |
| `enabled:` | l'elemento non ha la prop `disabled` |  |
| `selected:` | l'elemento è selezionato: `selected` di un `Button`, oppure `accessibilityState.selected` |  |
| `checked:` | l'elemento è spuntato: `accessibilityState.checked` è `true` (`"mixed"` non è spuntato) |  |
| `indeterminate:` | l'elemento è indeterminato: `accessibilityState.checked` è `"mixed"` |  |
| `aria-expanded:` | l'elemento è espanso: `accessibilityState.expanded` è `true` (il trigger di un `Popover` o di un `Menu` mentre il suo popup è aperto) |  |
| `aria-pressed:` | l'elemento è un pulsante a due stati attivo: `accessibilityState.pressed` è `true` (`"mixed"` non è premuto; non `active:`, una pressione in corso) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | l'elemento è occupato: `accessibilityState.busy` è `true` |  |
| `aria-checked:` | l'elemento è spuntato: `accessibilityState.checked` è `true`, come `checked:` |  |
| `aria-selected:` | l'elemento è selezionato: `accessibilityState.selected` è `true`, come `selected:` |  |
| `data-<name>:` | l'elemento ha l'attributo booleano `data-*` `name` (`&[data-<name>]` di Tailwind; nomi composti da lettere minuscole, cifre e `-`): ciò che la parte di un componente mostra oltre ai suoi stati, il giorno di un calendario all'inizio di un intervallo `data-range-start` | `Interactive::project_data(name, …)` ne imposta uno |

Gli stessi stati come oggetti di stile sono le prop `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` e `pressedStyle` di ogni elemento (e `selectedStyle` di un `Button`); hanno la precedenza sullo stile e sulle classi dell'elemento.

`disabled` funziona su qualsiasi elemento: applica `disabled:` e rimuove i gestori di pressione dell'elemento, quindi non mostra nemmeno alcun feedback di pressione.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### Gruppi

Contrassegna un antenato con `group` e applica stili ai discendenti in base al suo stato con `group-<state>:`. Assegna un nome ai gruppi per annidarli: `group/card` e `group-hover/card:`.

| Variante | Si applica quando il gruppo è | Rust |
|---|---|---|
| `group-active:` | premuto | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | in hover | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | con il focus |  |
| `group-focus-within:` | con il focus o contenente il focus | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | disabilitato |  |
| `group-selected:` | selezionato |  |
| `group-checked:` | selezionato (checked) |  |
| `group-indeterminate:` | indeterminato |  |
| `group-aria-expanded:` | espanso |  |
| `group-aria-pressed:` | un toggle button attivo |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | occupato, selezionato (checked), selezionato |  |
| `group-data-<name>:` | che mostra l'attributo `data-*` `name` |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### Posizione tra i fratelli

| Variante | Si applica a |
|---|---|
| `first:` | il primo figlio |
| `last:` | l'ultimo figlio |
| `only:` | il figlio unico |
| `odd:` | il 1°, 3°, ... figlio |
| `even:` | il 2°, 4°, ... figlio |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Placeholder e selezione

`placeholder:` si applica al placeholder di un `<Input>` e accetta solo un colore del testo: `placeholder:text-zinc-400` (la chiave di stile `placeholderColor`). `selection:` si applica alla selezione di un `<Input>` o di un `<Text>` selezionabile e, su qualsiasi elemento, a quelli al suo interno (il `& *::selection` di Tailwind; prevale l'elemento più vicino), e accetta lo sfondo, cioè l'evidenziazione: `selection:bg-violet-200` (la chiave di stile `selectionColor`, che colora anche il cursore di un input dove la piattaforma li disegna con un unico colore).

### Important

`!` prima o dopo una utility (`!p-4`, `p-4!`) la fa prevalere su ogni altra classe e sul `style` inline.

<a id="theme-customization"></a>

## Personalizzazione del tema

Estendi il tema nell'oggetto `"tailwind"` del `nsh.json` della tua app. Le voci con un nome nuovo vengono aggiunte; le voci con un nome già esistente sostituiscono quelle predefinite. Le lunghezze sono in punti. Il tema viene verificato quando l'app viene impacchettata: una chiave sconosciuta o un valore non valido causa un errore di build.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

Con questo tema funzionano `bg-brand-500`, `bg-brand` (la sfumatura `DEFAULT`), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` e `max-w-content`.

| Chiave | Valore | Usata da |
|---|---|---|
| `colors` | `{ name: color }` o `{ name: { shade: color } }`; `DEFAULT` indica il colore base. Qualsiasi sintassi di colore CSS. | ogni utility di colore |
| `spacing` | punti per passo (predefinito 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | punti per `rem` (predefinito 16) | |
| `breakpoints` | `{ name: width }` | varianti dei breakpoint (ordinate per larghezza) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (una famiglia di sistema o il nome di un font incluso nel bundle) | `font-*` |
| `fontSize` | `{ name: size }` o `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Il tema Tailwind definisce solo le classi della tua app. I design token dell'app (i colori di shadcn/ui, `radius`, i font e quelli propri dell'app) costituiscono il suo tema, la chiave `"theme"` di `nsh.json`, con cui i componenti Rust disegnano; vedi [Rust](../docs/rust.md#theme). Le classi richiamano quei token come variabili `@theme` con i nomi di Tailwind (`bg-primary`, `bg-up/30`, `rounded-(--radius)`): vedi [Token del tema](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## Correlati

- [Tailwind](../docs/tailwind.md): la guida.
- [Styling](../docs/styling.md): `class`, `classList`, `style` e come si combinano.
- [Riferimento degli stili](./style-reference.md): le chiavi di stile impostate dalle utility.
