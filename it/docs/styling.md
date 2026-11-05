---
title: "Stile"
description: "Metodi di stile tipizzati in Rust e la prop style in TSX - flexbox, grid ed effetti CSS - colori, bordi, angoli, ombre, gradienti, filtri, trasformazioni e transizioni, con le differenze tra le piattaforme."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# Stili

Ogni elemento è stilizzato con gli stessi stili nativi, scritti in due modi. In Rust, gli stili sono metodi tipizzati concatenati sull'elemento (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`); in TSX, una prop `style` di proprietà in camelCase, oppure [classi Tailwind](./tailwind.md). Entrambi includono funzionalità CSS come box shadow, gradienti, filtri, outline, transizioni e grid, e alla vista nativa vengono inviate solo le proprietà modificate.

I tre modi scrivono un unico insieme di proprietà e hanno lo stesso significato. I nomi sono quelli del CSS (alcuni usano i nomi più semplici che le app scrivono, come `paddingHorizontal`, `marginStart` e `numberOfLines`). I valori CSS (colori, gradienti, filtri, ombre, trasformazioni, parole chiave di allineamento) e le utility Tailwind hanno il significato che hanno sul web, con ogni metodo Rust e ogni utility che imposta ciò che Tailwind CSS 4 genera per esso, quindi ciò che conosci dal web vale anche qui: `paddingLeft` è `padding-left` e `pl-4`, `boxShadow` è `box-shadow`, `display: "flex"` è una riga come lo è la classe `flex`. Il resto è pensato per le app native: le lunghezze sono in punti (`16`, `"50%"`, `"auto"`; le classi accettano `rem` e le altre unità del CSS), i valori predefiniti sono quelli del layout nativo (elencati più avanti), un valore che cambia accetta numeri invece di una stringa (`translate: [x, 0]`, i livelli di un'ombra), e ciò che le piattaforme offrono oltre il CSS ha [estensioni](#extensions) proprie.

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

Questa pagina descrive come si combinano gli stili e le proprietà visive. Le proprietà di layout (flexbox, grid, dimensioni, posizioni) sono in [Layout](./layout.md), le proprietà del testo in [Testo](./text.md), e ogni proprietà con il suo tipo è elencata nel [riferimento degli stili](../modules/style-reference.md).

<a id="combining-styles"></a>

## Combinare gli stili

In Rust, gli stili condivisi sono funzioni che prendono un elemento e lo restituiscono stilizzato, e le condizioni sono semplice Rust: `.when(condition, |v| ..)` per ciò che è noto quando l'elemento viene creato, `.style_when(signal, |s| ..)` per gli stili che cambiano mentre l'app è in esecuzione. In TSX, `style` accetta un oggetto, o un array di oggetti uniti da sinistra a destra; le voci falsy (`false`, `null`, `undefined`) vengono ignorate, il che rende brevi gli stili condizionali:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

In TSX, definisci gli stili condivisi come costanti fuori dai componenti (con `as const`, così TypeScript mantiene i tipi letterali come `"row"`). Basta un semplice oggetto: gli stili vengono analizzati in Rust ogni volta che vengono impostati, a partire da oggetti che nessuno deve registrare.

Uno stile che legge dei signal li segue: in Rust, passa al metodo una closure (`.bg(move || ..)`), e solo quella proprietà viene impostata di nuovo quando i signal cambiano; in TSX, un'espressione di stile che legge dei signal viene ricostruita, e NSH invia solo le proprietà i cui valori sono diversi:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

Quando un elemento TSX ha entrambi, `style` prevale su `class`: le classi vengono applicate per prime, poi lo stile inline sopra di esse. Una chiave impostata a `undefined` non imposta nulla (`backgroundColor: active ? accent : undefined` mantiene il colore della classe quando è inattivo); `null` imposta il valore predefinito. In Rust, un metodo successivo prevale su uno precedente per la stessa proprietà.

All'interno di un singolo stile (un oggetto, o un array unito in uno solo), l'ordine delle chiavi non fa differenza: una proprietà più specifica prevale sulla sua forma abbreviata, `borderTopWidth` su `borderWidth`, `borderLeftColor` su `borderColor`, `marginTop` su `marginVertical` su `margin` (lo stesso vale per il padding), `rowGap` su `gap`, `flexGrow` su `flex`, `gridColumnStart` su `gridColumn`. Una proprietà specifica impostata a `null` in quel contesto mostra il valore della forma abbreviata.

<a id="units-and-values"></a>

## Unità e valori

- **Le lunghezze sono in punti** (pixel indipendenti dalla densità): `px(100.0)` in Rust e `width: 100` in TSX valgono 100pt, cioè 200 o 300 pixel fisici su uno schermo 2× o 3×.
- **Le percentuali** (`relative(0.5)` in Rust, `"50%"` in TSX) sono relative al genitore, per dimensioni, posizioni, margini e padding ([Layout](./layout.md)).
- **Gli angoli** sono `deg(45.0)`, `radians(0.5)` o `turn(0.25)` in Rust, e gradi come numeri o stringhe con unità in TSX: `45`, `"45deg"`, `"0.5rad"`; `rotate` e `transform` del CSS accettano anche `"0.25turn"`, e all'interno di una stringa `transform` ogni angolo ha la sua unità.
- **Le durate** sono in millisecondi: `.duration(150.0)` in Rust, numeri o stringhe (`"150ms"`, `"0.2s"`) in TSX.

<a id="defaults"></a>

## Valori predefiniti

Dove nessuno stile imposta una proprietà, si applicano i valori predefiniti di NSH:

| | Valore predefinito |
|---|---|
| Layout dei figli di una vista | una colonna (un contenitore flex con `flexDirection: "column"`); `display: "flex"` crea una riga a meno che `flexDirection` sia impostato, come in CSS |
| `flexShrink` | `0` (i figli non si restringono se non richiesto) |
| `alignContent` | `"flex-start"` (nelle grid, `"normal"` del CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | trasparente |
| Testo | nero, 14pt, peso 400 |
| Colore di bordo e outline | il colore del testo (`currentColor` del CSS) |

Le nuove viste non hanno alcuno stile finché non gliene assegni uno, quindi i wrapper senza stile non hanno costo sul lato nativo.

<a id="colors"></a>

## Colori

In Rust, i colori sono valori tipizzati: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, e la palette di Tailwind come `nsh_core::element::palette` (`BLUE.shade(500)`). I metodi dei colori accettano un `AdaptiveColor`, un valore chiaro e uno scuro: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` cambia con l'aspetto del sistema in modo nativo, senza render. Anche i colori del tema dell'app (`theme().primary` da `nsh_base`) sono adattivi ([Rust](./rust.md#theme)).

In TSX, le proprietà dei colori accettano stringhe di colore CSS:

| Forma | Esempio |
|---|---|
| Esadecimale | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| Con nome | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: il colore del testo, anche all'interno di un gradiente, di un'ombra, di un `drop-shadow()` o di un `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`); le classi lo scrivono `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

Per la modalità scura in TSX, leggi [`colorScheme()`](../modules/nsh.md#device) da `nsh`, un accessor che segue l'aspetto del sistema, oppure usa la variante `dark:` di Tailwind:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Per gli stili diversi dai colori, `.dark(|s| ..)` in Rust applica gli stili nell'aspetto scuro, e `dark()` legge l'aspetto. Il colore del testo predefinito è nero in entrambi gli aspetti: imposta i colori esplicitamente nelle app che supportano la modalità scura.

<a id="borders-and-corners"></a>

## Bordi e angoli

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Larghezze e colori** per lato: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., che mantengono il proprio lato in entrambe le direzioni; e `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, che seguono la [direzione del layout](./layout.md#right-to-left) (`.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ... in Rust).
- **Il colore** di un lato di cui è impostata la larghezza ma non il colore è il colore del testo, come `currentColor` del CSS: `{ borderWidth: 1, color: "#0969da" }` disegna un bordo blu.
- **I raggi** per angolo: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, e `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (alto inizio, alto fine, basso inizio, basso fine), che seguono la [direzione del layout](./layout.md#right-to-left) (`.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)` in Rust, e i preset `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) disegna angoli la cui curvatura sfuma dolcemente nei bordi, come le icone delle app iOS, su entrambe le piattaforme. Una pillola (`borderRadius` pari a metà altezza) resta una pillola.
- **`overflow: "hidden"`** (`.overflow_hidden()`) ritaglia i figli secondo la forma arrotondata. Ciò che viene ritagliato lo è anche nel layout: non raggiunge la dimensione del contenuto di una scroll view contenitore, quindi un box che dispone un figlio più largo di sé e lo riduce con un `transform` (le trasformazioni non influiscono sul layout) non altera la scroll view.

I raggi maggiori di metà del lato vengono limitati, quindi `borderRadius: 9999` (`.rounded_full()`) crea un cerchio o una pillola.

<a id="shadows"></a>

## Ombre

Le viste proiettano le `boxShadow` del CSS, e Android aggiunge la propria material elevation:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` segue il CSS: `offsetX offsetY blur spread color`, `inset` per le ombre interne. Accetta i propri livelli anche come numeri, la forma adatta ai valori che cambiano, che non costruisce alcuna stringa: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (solo `x` e `y` sono obbligatori; un livello senza colore usa il colore del testo). Rust accetta i livelli, `.shadow([BoxShadow { .. }])`. Le ombre seguono la forma arrotondata della vista, e una transizione le anima (`transitionProperty: "boxShadow"`, `.transition_shadow()`). I preset di Tailwind sono `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... in Rust, e `.shadow_color(..)` ricolora i loro livelli. Un'ombra che segue il contenuto di una vista trasparente (ad esempio i glifi di un'icona) è un `filter: "drop-shadow(...)"` ([Filtri](#filters-and-blending)); il testo ha `textShadow` ([Testo](./text.md)).

> [!NOTE]
> Su Android, le ombre richiedono uno sfondo: una vista con sfondo trasparente (ad esempio un testo senza sfondo) non proietta alcuna ombra.

<a id="gradients"></a>

## Gradienti

`backgroundImage` accetta gradienti CSS, disegnati sopra il colore di sfondo; in Rust, `.bg_linear(angle)`, `.bg_radial()` e `.bg_conic(angle)` con gli stop `.gradient_from(..)`, `.gradient_via(..)` e `.gradient_to(..)`, come `bg-linear-*` di Tailwind con `from-*`, `via-*` e `to-*`. In TSX, più gradienti sono separati da virgole.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

Gli stop di colore sono posizionati con percentuali o lunghezze (`px`, `pt`, `rem`; i numeri semplici sono punti) lungo un gradiente lineare o radiale, e con percentuali o angoli (`deg`, `turn`, `rad`, `grad`) attorno a uno conico. Uno stop con due posizioni (`#8250df 0 12px`) è una banda di un solo colore, come lo sono due stop nella stessa posizione. Le lunghezze sono misurate lungo la linea del gradiente alla dimensione attuale della vista, quindi una banda di 12px resta larga 12px quando la vista viene ridimensionata.

I colori si mescolano tra gli stop come in CSS: nello spazio indicato da un gradiente (`linear-gradient(in oklab, …)`; anche `srgb`, `srgb-linear`, `xyz`, `oklch` con un metodo per la tonalità come `longer hue`, e `hsl`), e altrimenti in sRGB quando ogni colore è esadecimale, `rgb()`, `hsl()` o con nome, e in Oklab quando uno è `oklch()`, `oklab()`, `lab()`, `lch()` o `color()`.

Gli elementi di testo non disegnano gradienti su iOS.

<a id="filters-and-blending"></a>

## Filtri e fusione

| Proprietà | Valore | Rust |
|---|---|---|
| `filter` | Filtri CSS della vista e del suo contenuto: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (senza colore, nel colore del testo, come in CSS); più filtri separati da spazi | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | Filtri di ciò che sta dietro la vista: `"blur(10px)"` (vetro smerigliato) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` o `"clear"` per il Liquid Glass di Apple su iOS 26 e macOS 26 e successivi; `"none"` (il valore predefinito) usa `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | Come la vista si fonde con ciò che sta dietro: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

Il supporto varia tra le piattaforme:

| | iOS | Android |
|---|---|---|
| `filter` sulle viste | `opacity`, `brightness` fino a 1 e solo `drop-shadow` | Tutti, da Android 12 (API 31); sotto, solo i filtri colore |
| `filter` sulle immagini | Ogni filtro colore e `blur` | Come per le viste |
| `backdropFilter` | Un materiale di sfocatura di sistema, che approssima il raggio | Da Android 12 (API 31) |
| `mixBlendMode` | Sì | Da Android 10 (API 29) |

Web, Windows e Linux applicano ogni filtro alle viste, macOS come iOS; GPUI disegna i filtri colore e `drop-shadow()`. Il filtro di sfondo è una sfocatura su iOS, macOS e Android, ogni filtro sul web e su Windows; Linux e GPUI non ne disegnano alcuno, e GPUI disegna le viste in modalità di fusione normale. Di un `filter` con più `drop-shadow()`, iOS, macOS e Android disegnano l'ultimo. `mixBlendMode` fonde la vista con tutto ciò che è disegnato dietro di essa.

Su iOS, `ios={{ backdropMaterial: "regular" }}` seleziona il materiale di sistema usato da una sfocatura `backdropFilter`. I valori sono `"ultraThin"` (il valore predefinito), `"thin"`, `"regular"`, `"thick"` e `"chrome"`. Abbina la prop a un raggio di sfocatura positivo per mostrare il materiale. Rust usa `.backdrop_material(BackdropMaterial::Regular)` insieme a `.backdrop_blur(px(30.0))`. Il raggio approssima l'intensità del materiale: NSH applica una frazione del materiale scelto, raggiungendo la piena intensità a 30 punti. La variante chiara o scura segue il colore di sfondo della vista. Queste scelte corrispondono ai [materiali di sfocatura di sistema](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) di Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` disegna il Liquid Glass dietro il contenuto di una vista su iOS 26 e macOS 26 e successivi. `"regular"` usa il materiale standard; `"clear"` assorbe meno colore dallo sfondo. Abbinalo a `backdropFilter` per la sfocatura mostrata nelle versioni precedenti di iOS e su altre piattaforme. Il vetro segue la dimensione e gli angoli arrotondati della vista.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Outline, opacità e visibilità

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): una linea esterna al bordo che non occupa spazio (gli offset negativi disegnano all'interno). `outlineStyle: "none"` (o `"hidden"`, `.outline_none()`) nasconde l'outline qualunque sia la sua larghezza, come in CSS.
- `opacity` (`.opacity(n)`): da 0 a 1, applicata alla vista e ai suoi figli.
- `visibility: "hidden"` (`.invisible()` in Rust): la vista non viene disegnata ma mantiene il suo spazio, e gli screen reader la saltano insieme al suo sottoalbero, come in un browser. `display: "none"` (`.hidden()`) la rimuove dal layout.
- `zIndex` (`.z_index(n)`): l'ordine tra i fratelli, anche l'ordine di sovrapposizione nativo (stabile per valori uguali).
- `cursor` (`.cursor(..)`, `.cursor_pointer()`): la forma del puntatore sulla vista, per puntatori e desktop.
<a id="transforms"></a>

## Trasformazioni

Le trasformazioni sono quelle di CSS. In TSX, `translate`, `rotate` e `scale` sono proprietà a sé stanti e `transform` accetta la stringa di funzioni di CSS o un elenco di passi; si compongono nell'ordine di CSS, `translate`, poi `rotate`, poi `scale`, poi `transform`, qualunque sia l'ordine delle chiavi. In Rust, le trasformazioni sono metodi (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...) composti nello stesso ordine:

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| Proprietà | Valore |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (percentuali della dimensione della view stessa), un numero (punti lungo x) o `[x, y]` con un numero, una stringa o un valore animato per asse |
| `rotate` | `"45deg"`, `"0.25turn"`, attorno a un asse `"x 90deg"`, un numero (gradi) o un valore animato (gradi) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x e y), un valore animato (entrambi gli assi) o `[x, y]` |
| `transform` | Funzioni di CSS: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`; lunghezze in `px` (le traslazioni anche `%`), angoli in `deg`, `rad` o `turn`; `"none"`; oppure un elenco di passi (`[{ perspective: 800 }, { rotateY: angle }]`) le cui quantità possono essere valori animati |

Ogni proprietà è a sé stante, come per le classi: il `scale` di uno stile sostituisce una classe `scale-95` e mantiene la sua `rotate-3`. I valori animati muovono `translate`, `rotate` e `scale` in modo nativo; per ciò che la stringa di CSS non può contenere con una quantità animata, come una rotazione 3D, passa a `transform` un elenco di passi: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` e `perspective` ([Animation](./animation.md)). Il `transform` di uno stile è l'una o l'altra forma, quindi una prospettiva prima di passi animati è un passo dell'elenco.

Il `.perspective(..)` di Rust è la proprietà `perspective` di CSS, come `perspective-*` di Tailwind: dà profondità ai figli della view, mentre la funzione `perspective()` di un `transform` si applica alla trasformazione della view stessa. `transformOrigin` accetta parole chiave, percentuali e lunghezze (`"top left"`, `"50% 0"`, `[10, 20]`; `.origin_top_left()`, `.transform_origin(..)` in Rust); il valore predefinito è il centro. Le trasformazioni non influenzano il layout: i fratelli vengono posizionati come se la view non fosse trasformata.

Android non supporta le trasformazioni skew.

<a id="transitions"></a>

## Transizioni

Una view anima le modifiche del proprio stile quando indichi cosa animare. L'animazione viene eseguita in modo nativo; nessuna parte del tuo codice viene eseguita a ogni frame.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| Proprietà | Valore | Rust |
|---|---|---|
| `transitionProperty` | Cosa viene animato: `"all"`, oppure nomi separati da virgole: colori (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (ogni proprietà di trasformazione), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | Come la durata | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

Dimensioni e posizioni fanno parte del layout, non dello stile, e non hanno transizioni; anima le modifiche di layout con `LayoutAnimation` oppure guida i valori con animazioni native ([Animation](./animation.md)).

<a id="keyframe-animations"></a>

### Animazioni keyframe

`animationName` esegue in modo nativo una delle animazioni keyframe integrate di Tailwind: `"spin"`, `"ping"`, `"pulse"` o `"bounce"`, con `animationDuration`, `animationDelay`, `animationTimingFunction` e `animationIterationCount` (un numero o `"infinite"`), in qualsiasi ordine. In Rust, `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` e `.animate_bounce()` le eseguono con i tempi di Tailwind, e `.animation(KeyframeAnimation::new(..))` con i tuoi:

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## Feedback alla pressione

Il feedback alla pressione è l'insieme degli stili dell'app per lo stato di pressione, applicati in modo nativo senza un viaggio di andata e ritorno verso il tuo codice; gli stati hover, focus e disabilitato accettano stili allo stesso modo (`.hover(..)`, `.focus(..)`, `.disabled_style(..)` in Rust; `hoverStyle`, `focusStyle` e `disabledStyle`, oppure `hover:`, `focus:`, `disabled:`, in TSX):

| Rust | TSX | Effetto durante la pressione |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | La view sfuma fino a questa opacità |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | Lo sfondo assume questo colore |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Il ripple material di Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | Qualsiasi stile |

Vedi [Touch and gestures](./touch-and-gestures.md).

<a id="extensions"></a>

## Estensioni

Queste chiavi e classi gestiscono ciò che le piattaforme native offrono oltre CSS:

| Chiave | Classe | Cosa fa |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | Il colore del segnaposto di un `<Input>` |
| `selectionColor` | `selection:bg-*` | L'evidenziazione della selezione di un `<Input>` o di un `<Text>` selezionabile |
| `tintColor` | `tint-*` | Ricolora i pixel opachi di un `<Image>` (immagini template, icone) |
| `borderCurve` | | `"continuous"`: angoli che si raccordano con i bordi in modo graduale, come quelli del sistema (gli angoli continui di Apple) |
| `glassEffect` | | Il Liquid Glass di Apple dietro la view su iOS 26 e macOS 26, `backdropFilter` altrove |
| `writingDirection` | | La direzione di base di un testo, `"auto"` (il valore predefinito: dedotta dal contenuto, come fanno le view di testo delle piattaforme), `"ltr"` o `"rtl"`; `direction` imposta quella del layout |
| `textAlignVertical` | | Dove si colloca il testo più corto del suo riquadro `<Text>`: `"top"` (il valore predefinito), `"center"` o `"bottom"` |
| `textAlign: "auto"` | | Il lato naturale del testo, in base alla sua direzione (il valore predefinito) |
| `selectedStyle` | `selected:` | Lo stile mentre `accessibilityState.selected` è `true` (un `Button` selezionato, una tab) |
| | `ios:`, `android:`, `web:` | Classi per una sola piattaforma (`ios:pt-2`) |

I valori che cambiano accettano anche numeri dove CSS accetta una stringa: `transform` come elenco di passi, `translate` e `scale` come `[x, y]`, `boxShadow` e `textShadow` come livelli.

<a id="related"></a>

## Correlati

- [Tailwind](./tailwind.md): gli stessi stili come classi, con varianti per la modalità scura, gli stati di pressione e i breakpoint, e i loro equivalenti tipizzati.
- [Layout](./layout.md) e [Text](./text.md).
- [Style reference](../modules/style-reference.md): ogni proprietà di stile e il suo tipo.
