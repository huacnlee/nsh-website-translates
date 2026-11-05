---
title: "nsh"
description: "Il modulo principale: signal, effect, context, mount, design token, animazioni, l'ambiente, gesti, appunti, storage, il canale host, scorciatoie da tastiera, accessibilità e i tipi per elementi e stili."
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` è il modulo core: l'API reattiva (signal, valori computed, effect, context), `mount`, `token`, gli elementi host `View`, `Text`, `Scroll` e `Overlay`, le [viste selezionabili](#selectable-views), [l'area sicura e la tastiera](#safe-area-and-keyboard), l'[animazione](#animation), [il dispositivo e il suo ambiente](#device), [`PanResponder`](#panresponder), gli [appunti](#clipboard), il [selettore di foto](#picker), il [riconoscimento vocale](#speech), lo [storage](#storage), il [canale host](#host), le [scorciatoie da tastiera](#keymap), i [componenti e moduli nativi](#nativecomponent-and-nativemodule), l'[accessibilità](#accessibility) e i tipi TypeScript di elementi, stili ed eventi. Il grafo reattivo stesso viene eseguito nativamente in Rust; leggere un signal è una chiamata al runtime che costa pochi nanosecondi, e solo le tue closure vengono eseguite nell'interprete JavaScript.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

La reattività di NSH segue lo stesso modello di SolidJS: una funzione componente viene eseguita **una sola volta**, e le parti della UI che leggono signal vengono aggiornate sul posto quando quei signal cambiano. Non c'è alcun nuovo render del componente e non c'è un DOM virtuale. Consulta [Reattività](../docs/reactivity.md) per la guida.

## signal

```ts
function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;

interface Signal<T> {
  (): T;                              // read (tracked)
  set(value: T): void;                // write
  update(fn: (value: T) => T): void;  // write from the current value
}

interface SignalOptions<T> {
  /** When a new value counts as a change (default `===`); `false`: always. */
  equals?: false | ((previous: T, next: T) => boolean);
}
```

Un signal contiene un valore. Chiamarlo legge il valore e, all'interno di uno scope di tracciamento (espressioni JSX, `computed`, `effect`), vi sottoscrive quello scope. `set` e `update` lo scrivono; tutto ciò che lo ha letto viene aggiornato.

```tsx
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>Count: {count()}</Text>
      <Text onPress={() => count.update((n) => n + 1)}>Add one</Text>
    </View>
  );
}

mount(Counter);
```

Per impostazione predefinita, una scrittura `===` al valore corrente non fa nulla. Passa `equals: false` per notificare a ogni scrittura (utile quando modifichi un oggetto sul posto e imposti di nuovo lo stesso oggetto), oppure passa un tuo confronto:

```ts
const items = signal<string[]>([], { equals: false });
const point = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

## computed

```ts
function computed<T>(fn: (previous: T | undefined) => T, options?: SignalOptions<T>): Accessor<T>;

interface Accessor<T> {
  (): T;
}
```

Un valore derivato da signal. `fn` viene eseguita di nuovo quando cambia un signal che ha letto; i lettori del valore computed si aggiornano solo quando il suo risultato cambia (secondo `equals`, `===` per impostazione predefinita). `fn` riceve il risultato precedente.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

Usa `computed` quando una derivazione è costosa o viene letta in più punti. Per un'espressione economica, una semplice funzione (`const full = () => first() + " " + last()`) è altrettanto reattiva.

## effect

```ts
function effect(fn: () => void): void;
```

Esegue `fn` dopo il rendering, e di nuovo ogni volta che cambia un signal che ha letto. Usa gli effect per gli effetti collaterali: logging, timer, comunicazione con i moduli nativi. Un effect appartiene al componente (o effect) in cui è stato creato e viene eliminato insieme a esso.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Per annullare qualcosa prima che l'effect venga eseguito di nuovo (o quando il suo componente scompare), chiama [`cleanup`](#cleanup) al suo interno.

## batch

```ts
function batch<T>(fn: () => T): T;
```

Esegue `fn` e applica tutte le sue scritture insieme alla fine, così i lettori si aggiornano una volta sola invece che una volta per scrittura. Restituisce ciò che restituisce `fn`.

```ts
batch(() => {
  first.set("Grace");
  last.set("Hopper");
}); // `full` recomputes once
```

## untracked

```ts
function untracked<T>(fn: () => T): T;
```

Esegue `fn` senza sottoscrivere lo scope corrente a ciò che legge. Usalo per leggere un signal all'interno di un effect o di un'espressione JSX senza dipendere da esso.

```ts
effect(() => {
  // Runs again when `query` changes, not when `page` changes.
  search(query(), untracked(() => page()));
});
```

## cleanup

```ts
function cleanup(fn: () => void): void;
```

Registra `fn` da eseguire prima che l'effect corrente venga eseguito di nuovo, o quando il componente o l'effect corrente scompare.

```tsx
function Clock() {
  const now = signal(new Date());
  const timer = setInterval(() => now.set(new Date()), 1000);
  cleanup(() => clearInterval(timer));
  return <Text>{now().toLocaleTimeString()}</Text>;
}
```

## context

```ts
function context<T>(defaultValue: T): Context<T>;

interface Context<T> extends Accessor<T> {
  Provider: (props: { value: T; children?: JSX.Element }) => JSX.Element;
}
```

Un valore che un componente fornisce a tutto ciò che renderizza, a qualsiasi profondità. Chiamare il context (`Theme()`) legge il valore del provider più vicino, oppure `defaultValue` se non ce n'è nessuno.

```tsx
import { context, mount, signal, Text, View } from "nsh";

const Theme = context<"light" | "dark">("light");

function Label(props: { text: string }) {
  return <Text style={{ color: Theme() === "dark" ? "#fff" : "#000" }}>{props.text}</Text>;
}

function App() {
  const dark = signal(false);
  return (
    <Theme.Provider value={dark() ? "dark" : "light"}>
      <View style={{ flex: 1, padding: 24, backgroundColor: dark() ? "#000" : "#fff" }}>
        <Label text="Hello" />
        <Text onPress={() => dark.update((d) => !d)}>Toggle</Text>
      </View>
    </Theme.Provider>
  );
}

mount(App);
```

## mount

```ts
function mount<P extends object>(app: Component<P>, props?: P): () => void;
```

Renderizza `app` nella superficie (la finestra, oppure `NshAppView` / `NshView` in cui l'app è incorporata) e restituisce una funzione che lo rimuove. Il file di ingresso di ogni app termina con `mount(App)`.

```tsx
mount(App);
```

## split

```ts
function split<T extends object, K extends readonly (keyof T)[]>(
  props: T,
  keys: K,
): [Pick<T, K[number]>, Omit<T, K[number]>];
```

Divide un oggetto props nelle props indicate in `keys` e nel resto. Entrambe le metà restano reattive: le props i cui valori cambiano sono getter, e `split` le mantiene come getter. Usalo in un componente che gestisce da sé alcune props e passa le altre. Destrutturare le props (`const { label } = props`) le leggerebbe una sola volta e perderebbe gli aggiornamenti.

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function LabeledInput(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input {...rest} />
    </View>
  );
}
```

## ErrorBoundary

```ts
function ErrorBoundary(props: {
  fallback: JSX.Element | ((error: unknown, reset: () => void) => JSX.Element);
  children?: JSX.Element;
}): JSX.Element;
```

Renderizza i suoi figli, oppure `fallback` non appena qualcosa al di sotto di essi genera un errore: il corpo di un componente, un binding, un effect o un gestore di eventi. La parte che ha fallito viene rimossa e al suo posto compare il fallback. Una funzione `fallback` viene chiamata come `fallback(error, reset)` con il valore lanciato e con `reset`, che renderizza di nuovo i figli, qualunque parametro dichiari; un elemento `fallback` viene mostrato così com'è. Un errore va al boundary più vicino sopra di esso, e uno in un fallback va al boundary sopra quello. I componenti Rust usano `catch_error` ([Error boundary](../docs/reactivity.md#error-boundaries)).

```tsx
import { ErrorBoundary, Text, View } from "nsh";

function Feed() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>{error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Posts />
    </ErrorBoundary>
  );
}
```

## token

```ts
function token<K extends keyof Tokens>(name: K): Tokens[K];
```

Il design token `name` del tema dell'app (`"theme"` in `nsh.json`, sopra i token di shadcn/ui) nell'aspetto mostrato:
un colore come `#rrggbbaa`, una lunghezza come numero di punti, un font come nome della sua famiglia. I nomi sono le variabili CSS del tema
senza `--` (`primary`, `muted-foreground`, `radius`, `font-mono`, e quelli propri dell'app, come `up`). La lettura è
reattiva: un componente, memo o effect che legge un token viene eseguito di nuovo quando cambiano il tema o l'aspetto.
`Tokens` elenca i token dell'app con i loro tipi; NSH lo scrive in `.nsh/types/nsh/tokens.d.ts` a partire dal tema. Per
le classi, indica direttamente i token (`bg-primary`, `rounded-(--radius)`): [Token del tema](../docs/tailwind.md#theme-tokens).

```tsx
import { effect, token } from "nsh";

effect(() => console.log("primary is", token("primary"), "radius", token("radius")));
```

## View, Text, Scroll, Overlay

```ts
function View(props: ViewProps): JSX.Element;
function Text(props: TextProps): JSX.Element;
function Scroll(props: ScrollProps): JSX.Element;
function Overlay(props: OverlayProps): JSX.Element;
```

Gli elementi host esportati da `nsh`, scritti come tag: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (i suoi
figli sopra la finestra, posizionati rispetto a un'ancora: [Overlay](../elements/overlay.md)). Il compilatore crea la
vista nativa sul posto per un tag che ne nomina uno tramite il proprio import (anche con un alias), quindi importarli non costa
nulla a run time. Sono componenti come tutti gli altri, quindi possono anche essere passati in giro (`const Tag = inline ? Text : View`).
`nsh` esporta allo stesso modo le altre primitive: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) e [`Video`](./nsh-video.md), ciascuna con la propria pagina di
riferimento. Le loro props sono documentate in [Elementi](../elements/index.md). L'input di testo, `Input`, proviene da
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## Area sicura e tastiera

Le variabili d'ambiente di CSS mantengono il contenuto libero dalla UI di sistema, nel padding e nel margin di qualsiasi vista
(`padding`, `paddingTop`, ..., le stesse chiavi di `margin`; i valori arbitrari `p*` / `m*` di Tailwind; i metodi di `Styled`
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ... in Rust). I loro valori sono `EnvValue`:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` e `calc(<length> + env(name))`.

| Variabile | Valore |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | Gli inset della vista radice in cui viene renderizzato il nodo: quelli della pagina più vicina (sotto il suo header), del dialog più vicino, oppure l'area sicura della superficie. Consulta [Area sicura](../elements/safe-area.md). |
| `keyboard-inset-height` | L'altezza della tastiera software sopra la superficie, 0 mentre è nascosta; le variazioni sono animate nativamente insieme alla tastiera. Consulta [Tastiera](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea e safeAreaInsets

`safeArea()` è l'area sicura della superficie (`safe_area()` in Rust); `safeAreaInsets()` sono gli inset del punto in cui un componente
viene renderizzato (`cx.insets()` in Rust), i valori delle variabili `safe-area-inset-*`. Entrambi sono `Edges` reattivi
(`{ top, right, bottom, left }` in punti). Consulta
[safeArea e safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

<a id="keyboard-and-keyboardframe"></a>

### Keyboard e keyboardFrame

`Keyboard.dismiss()` nasconde la tastiera software (`dismiss_keyboard()` in Rust) e `keyboardFrame()` indica quanta
parte dello schermo copre (`keyboard_height()` e `keyboard_duration()` in Rust). Consulta
[Nascondere la tastiera](../elements/keyboard.md#hiding-the-keyboard) e
[L'altezza della tastiera](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## Viste selezionabili

`<View selectable>` (`view().selectable(true)` in Rust) fa sì che i testi al suo interno vengano selezionati insieme, come quelli di una pagina web: una sola selezione attraversa viste, elementi `Text` e `TextView`, in ordine di lettura. Consulta
[Selezione del testo](../elements/text-selection.md).

<a id="animation"></a>

## Animazione

L'API di animazione anima sul thread della UI. Crei un **valore animato**, lo leghi (o leghi valori derivati da esso) a una proprietà di stile e avvii un'animazione; da quel momento ogni frame viene calcolato nativamente, senza eseguire il codice dell'app. Un engine o un thread JS occupato non può far scattare l'animazione, e un'animazione non costa all'app alcun lavoro per frame. Il codice Rust usa `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` e `Easing` da `nsh_core::prelude` e lega i valori con i metodi `.bind_*` degli elementi; TSX li importa da `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

Consulta [Animazione](../docs/animation.md) per la guida.

<a id="what-an-animated-value-can-drive"></a>

### Cosa può pilotare un valore animato

| Dove | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | Lo stesso: un nodo di colori. `borderColor` colora ogni lato; il `color` di un `Text` colora l'intero testo |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (gradi) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` passi: `transform: [{ translateX: value }]` |
| Posizione di scroll | `.scroll_value(&value)` su una vista scroll o una lista | `<Scroll scrollValue={value}>` e `<List scrollValue={value}>` scrivono in esso l'offset di scroll a ogni frame |
| Gesti | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}` su qualsiasi elemento: il gesto scrive direttamente i valori (vedi [Tocco e gesti](../docs/touch-and-gestures.md)) |
| Dove si fissano le viste | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` in una vista scroll orizzontale), `.bind_sticky_header_offset(&value)` su una lista | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: le viste e gli header sticky si fissano a quella distanza dall'inizio del viewport, seguendo il valore a ogni frame |
| Canvas | un argomento animato della chiamata di un painter | Qualsiasi argomento numerico o di colore di una chiamata di disegno di un [canvas](./nsh-canvas.md) |
| Shader | `.uniform(name, &value)` | Un membro di `struct Uniforms` di uno [shader](../elements/shader.md): `uniforms={{ name: value }}` (numeri, oppure un nodo di colori per `vec3f` / `vec4f`) |

Le altre proprietà di stile accettano valori semplici; per animare il layout stesso (dimensioni, posizioni nel flusso), usa [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

Crea un valore animato che parte da `value` (predefinito `0`). Rust: `animated_value(value)`, un handle `Copy` mantenuto dal componente che lo ha creato.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let right = stored(false);
    let toggle = move || {
        let to_right = !right.get();
        right.replace(to_right);
        let _ = x.spring(if to_right { 200.0 } else { 0.0 }, Spring::default());
    };
    view()
        .flex_1()
        .p_6()
        .pt_12()
        .gap_4()
        .child(view().size(px(60.0)).rounded(px(12.0)).bg(rgb(0x6366f1)).bind_translate_x(&x))
        .child(text("Move").on_press(toggle))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  let right = false;
  const toggle = () => {
    right = !right;
    x.spring(right ? 200 : 0);
  };
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 48, gap: 16 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#6366f1", transform: [{ translateX: x }] }} />
      <Text onPress={toggle}>Move</Text>
    </View>
  );
}

mount(App);
```

> [!NOTE]
> Un valore animato vive sul thread della UI e cambia lì a ogni frame, quindi l'app lo legge in modo asincrono: `await value.getValue()` (o il `{ value }` con cui si risolve `stop()`) restituisce il valore in quel momento, e in Rust `value.value().await` in un task. Mantieni il target in una variabile o in un signal quando il tuo codice ne ha bisogno subito, come sopra. Gli eventi dei gesti riportano i valori alla loro fine (`PanEvent.value`).

### AnimatedValue

```ts
class AnimatedValue extends AnimatedNode {
  constructor(value: number);
  set(value: number): void;
  stop(): Promise<{ value: number }>;
  getValue(): Promise<number>;
  setOffset(offset: number): void;
  flattenOffset(): void;
  extractOffset(): void;
  timing(to: number, options?: { duration?: number; easing?: Easing; delay?: number }): Promise<{ finished: boolean }>;
  spring(to: number, options?: { stiffness?: number; damping?: number; mass?: number; velocity?: number }): Promise<{ finished: boolean }>;
  decay(options?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): Promise<{ finished: boolean }>;
  keyframes(keyframes: KeyframeValue[], options?: KeyframeTiming): Promise<{ finished: boolean }>;
}
```

| Metodo | Rust | Descrizione |
|---|---|---|
| `set(value)` | `set(value)` | Salta a `value`, interrompendo qualsiasi animazione in corso. |
| `stop()` | `stop()`, poi `value().await` | Interrompe l'animazione in corso dove si trova; si risolve con `{ value }`, il valore in quel punto. |
| `getValue()` | `value().await` | Si risolve con il valore corrente (con il suo offset), letto sul thread della UI. |
| `setOffset(offset)` | `set_offset(offset)` | Un offset aggiunto al valore: i binding vedono valore + offset; `set`, le animazioni e i trascinamenti muovono il valore. |
| `flattenOffset()` | `flatten_offset()` | Aggiunge l'offset al valore e lo porta a 0. |
| `extractOffset()` | `extract_offset()` | Sposta il valore nell'offset e porta il valore a 0 (un trascinamento parte poi da dove è finito l'ultimo). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | Anima verso `to` lungo una curva di easing. `duration` in ms (predefinito 300), `easing` (predefinito `"easeInOut"`), `delay` in ms (predefinito 0). |
| `spring(to, options)` | `spring(to, Spring { … })` | Raggiunge `to` con una molla. `stiffness` (predefinito 170), `damping` (predefinito 26), `mass` (predefinito 1), `velocity` (velocità iniziale, unità al secondo). |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Procede per inerzia da `velocity` (unità al secondo) e rallenta di `deceleration` per millisecondo (predefinito 0.998). Usalo dopo un fling, con la velocità di `onPanEnd`. Con `clamp: [min, max]` si ferma a un limite, oppure rimbalza indietro da esso mantenendo `bounce` (0..1, predefinito 0) della sua velocità. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | Riproduce i [keyframe](#keyframes) come vengono riprodotti i keyframe CSS: un easing per segmento, `iterations` volte in `direction`. |

Ogni metodo di animazione restituisce una promise che si risolve con `{ finished }`: `true` quando l'animazione è terminata, `false` quando è stata interrotta (da `stop`, `set` o da un'altra animazione dello stesso valore). In Rust restituisce un `AnimationEnd`, che un task attende per lo stesso `bool`.

```rust tabs
let opacity = animated_value(1.0);
spawn(async move {
    if opacity.timing(0.0, 200.0, Easing::EaseInOut).await {
        visible.set(false);
    }
});
```

```tsx tabs
const opacity = createAnimatedValue(1);
const { finished } = await opacity.timing(0, { duration: 200 });
if (finished) visible.set(false);
```

### AnimatedNode

```ts
class AnimatedNode {
  interpolate(config: {
    inputRange: number[];
    outputRange: number[] | string[];
    extrapolate?: Extrapolation;
    extrapolateLeft?: Extrapolation;
    extrapolateRight?: Extrapolation;
    easing?: Easing;
  }): AnimatedNode;
  diffClamp(min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  add(b: AnimatedNode | number): AnimatedNode;
  sub(b: AnimatedNode | number): AnimatedNode;
  mul(b: AnimatedNode | number): AnimatedNode;
  div(b: AnimatedNode | number): AnimatedNode;
  mod(b: AnimatedNode | number): AnimatedNode;
}

type Extrapolation = "extend" | "clamp" | "identity";
```

Un nodo del grafo di animazione nativo: un `AnimatedValue`, oppure un valore derivato da altri. I nodi derivati vengono valutati sul thread della UI ogni volta che cambiano i loro input.

| Metodo | Rust | Descrizione |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Mappa l'input attraverso intervalli a tratti. `outputRange` contiene numeri, colori (`"#ff0000"`, `"rgba(…)"`) o angoli (`"45deg"`, `"1rad"`). Fuori da `inputRange` applica per impostazione predefinita un clamp; `extrapolate` (oppure `extrapolateLeft` / `extrapolateRight`) può essere `"extend"` (continua la retta), `"clamp"` o `"identity"` (lascia passare l'input). `easing` modella ogni segmento. Rust accetta numeri, colori del tema (che seguono l'aspetto) e angoli in gradi per `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Segue le variazioni dell'input ma mantiene il risultato entro `min..max`: un header che si nasconde mentre il contenuto scorre verso l'alto e ritorna non appena scorre verso il basso. `snap: true` lo porta al limite più vicino in 200 ms quando la sua vista scroll si ferma, a `max` solo quando l'input ha raggiunto `max`. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | Aritmetica con un altro nodo o una costante. |
| `mod(b)` | `modulo(b)` | Modulo, mai negativo per un `b` positivo (mantiene gli angoli in 0..360). |

```rust tabs
let scroll_y = animated_value(0.0);
let header = scroll_y.diff_clamp(0.0, 44.0);

view()
    .flex_1()
    .child(scroll().scroll_value(&scroll_y).flex_1() /* rows */)
    .child(view().h(px(44.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 44);

<Scroll scrollValue={scroll} style={{ flex: 1 }}>{/* rows */}</Scroll>
<View style={{ height: 44, transform: [{ translateY: header.mul(-1) }] }} />
```

```rust tabs
let progress = animated_value(0.0);
let rotate = progress.interpolate(&[0.0, 1.0], &[0.0, 360.0]); // degrees, for bind_rotate
let color = progress.interpolate_colors(&[0.0, 0.5, 1.0], &[rgb(0x22c55e), rgb(0xeab308), rgb(0xef4444)]);
```

```tsx tabs
const progress = createAnimatedValue(0);
const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
const color = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["#22c55e", "#eab308", "#ef4444"] });
```
### Keyframes

```ts
interface Keyframe {
  offset?: number;          // 0..1 of an iteration; missing offsets spread evenly
  value: number | string;   // a number, or an angle ("45deg", "0.5turn") in degrees
  easing?: Easing;          // the segment that starts here
}
type KeyframeValue = number | string | Keyframe;

interface KeyframeTiming {
  duration?: number;        // one iteration, ms (300)
  delay?: number;           // before the first iteration, ms (0)
  easing?: Easing;          // segments without their own (CSS "ease")
  iterations?: number | "infinite";   // 1
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}
```

`value.keyframes(frames, options)` riproduce un valore attraverso i keyframe e si risolve con `{ finished }`, che indica se sono terminati; `Animated.keyframes(value, { keyframes, ...options })` equivale a un passo di una composizione. Rust: `value.keyframes(frames, KeyframeTiming)` e `Animation::keyframes(&value, frames, KeyframeTiming)`, con `Keyframe::new(value)` (distribuiti uniformemente), `Keyframe::at(offset, value)` e `.ease(easing)`, e `KeyframeTiming::new(ms)` con `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` e `.direction(PlaybackDirection::…)`.

Vengono riprodotti come i keyframe CSS: un easing modella un segmento (quello di un keyframe è il segmento che parte da esso, quello del timing è ogni altro segmento); gli offset mancanti nei keyframe vengono distribuiti uniformemente, il primo a 0 e l'ultimo a 1; ogni iterazione inizia con un salto al suo primo keyframe, e senza un keyframe a 0 il valore parte da dove si trova; durante un `delay` il valore mantiene il primo keyframe (CSS `animation-fill-mode: backwards`); le iterazioni all'indietro eseguono i segmenti al contrario, con le curve invertite; il valore resta dove lo lascia l'ultima iterazione.

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).iterations(Some(3)),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, iterations: 3 });
```

### createMotion

```ts
function createMotion(options?: MotionOptions): Motion;

interface MotionOptions extends MotionPlayOptions {
  initial?: { [C in MotionChannel]?: number };   // where channels start (the others at rest)
  enter?: MotionName | MotionSpec;   // start where it starts and play it at once
}

interface MotionPlayOptions extends KeyframeTiming {
  ignoreReduceMotion?: boolean;      // play even when the user asks for less motion
}

interface Motion {
  readonly opacity: AnimatedValue;
  readonly translateX: AnimatedValue;
  readonly translateY: AnimatedValue;
  readonly rotate: AnimatedValue;    // degrees
  readonly rotateX: AnimatedValue;
  readonly rotateY: AnimatedValue;
  readonly scale: AnimatedValue;
  readonly scaleX: AnimatedValue;
  readonly scaleY: AnimatedValue;
  readonly style: { opacity: AnimatedValue; transform: MotionTransform };
  readonly transform: MotionTransform;
  play(motion: MotionName | MotionSpec, options?: MotionPlayOptions): Promise<{ finished: boolean }>;
  animation(motion: MotionName | MotionSpec, options?: MotionPlayOptions): CompositeAnimation;
  stop(): void;
  reset(): void;
}
```

Crea un motion: un valore animato per ciascun canale di opacità e transform di una view, a riposo (opacità e scale a 1, gli altri a 0), e motion da riprodurre su di essi in modo nativo. Si associa con `style={motion.style}`, oppure si fa lo spread di `motion.style` o `motion.transform` in uno stile; il transform applica prima le traslazioni, poi le rotazioni, poi le scale, con `scale` inglobato in `scaleX` e `scaleY`: 7 degli 8 passi di transform di una view, il che ne lascia uno per il tuo (`[{ perspective: 600 }, ...motion.transform]` per i flip 3D). `initial` imposta da dove partono i canali (`{ opacity: 0 }`; gli altri partono a riposo). Con `enter`, i canali che muove partono da dove parte quel motion (su `initial`) e viene riprodotto subito, con le altre opzioni come timing (`delay`, `duration`, ...). Un motion muove solo opacità e transform: lo spread di `motion.style` imposta il `opacity` della view, quindi associa solo `motion.transform` per mantenere un'opacità tua, e muovi i colori con un valore animato e `interpolate`. Rust: `motion()`, un handle `Copy` conservato dal componente che lo ha creato, associato con `.bind_motion(&m)`; `motion().entering(spec)` entra.

| Membro | Rust (`Motion`) | Descrizione |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | I valori animati dei canali. |
| `style`, `transform` | `.bind_motion(&m)` sull'elemento | Le associazioni. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | Riproduce un preset per nome o un [`MotionSpec`](#motions) sui canali; uno nuovo interrompe quello in riproduzione. `options` ne modificano il timing. Si risolve con `{ finished }`: `true` se è terminato, `false` se qualcosa lo ha fermato (`AnimationEnd` in Rust). |
| `animation(motion, options?)` | `animation(spec)` | Lo stesso motion come [`CompositeAnimation`](#animated), non avviato, da comporre: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). La riduzione del movimento viene decisa quando viene creato. |
| `stop()` | `stop()` | Lo ferma dov'è. |
| `reset()` | `reset()` | Lo ferma e riporta ogni canale a riposo. |

Quando l'utente chiede meno movimento (`reduceMotion()`), `play`, `animation` e `enter` arrivano subito dove termina il motion, senza muoversi, a meno che `ignoreReduceMotion` sia impostato (nelle opzioni o sul motion).

```rust tabs
let card = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(80.0)));
view().size(px(120.0)).rounded(px(16.0)).bg(rgb(0x0969da)).bind_motion(&card).on_press(move || {
    card.play(MotionPreset::Pulse);
})
```

```tsx tabs
const card = createMotion({ enter: "fadeInUp", delay: 80 });
<View onPress={() => card.play("pulse")} style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }} />
```

### motions

```ts
const motions: Readonly<Record<MotionName, MotionPreset>>;

type MotionChannel = "opacity" | "translateX" | "translateY" | "rotate" | "rotateX" | "rotateY" | "scale" | "scaleX" | "scaleY";

interface MotionSpec extends KeyframeTiming {
  keyframes: { [C in MotionChannel]?: KeyframeValue[] } | MotionFrame[];
  ignoreReduceMotion?: boolean;
}
type MotionFrame = { [C in MotionChannel]?: number | string } & { offset?: number; easing?: Easing };

interface MotionPreset extends MotionSpec {
  kind: "enter" | "exit" | "attention" | "loop";
}
```

I motion predefiniti come dati: `motion.play("shake")` riproduce `motions.shake`. `MotionName` è uno tra `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (ingresso); `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (uscita); `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (attenzione); `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (ciclo). [Animation](../docs/animation.md#presets) descrive ciascuno di essi. Fai lo spread di un preset per modificarlo: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

Un `MotionSpec` è un motion tutto tuo: i keyframe di ogni canale (`{ opacity: [0, 1], translateY: [24, 0] }`), oppure un elenco di frame come li scrive la Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, un frame senza offset viene collocato in base alla sua posizione nell'elenco), con il [timing dei keyframe](#keyframes). Rust: `MotionSpec::new(KeyframeTiming)` con `.values(channel, values)` (distribuiti uniformemente), `.track(channel, keyframes)` e `.timing(|t| …)`; `MotionPreset::FadeInUp` (o `.spec()`) è un preset, e `MotionChannel` nomina i canali.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(MotionChannel::TranslateY, [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)]);
card.play(rise);
```

```tsx tabs
card.play({ duration: 400, keyframes: [{ opacity: 0, translateY: 24, easing: "easeOut" }, { opacity: 1, translateY: 0 }] });
```

### Animated

```ts
const Animated: {
  timing(value: AnimatedValue, config: { toValue: number; duration?: number; easing?: Easing; delay?: number }): CompositeAnimation;
  spring(value: AnimatedValue, config: { toValue: number; stiffness?: number; damping?: number; mass?: number; velocity?: number }): CompositeAnimation;
  decay(value: AnimatedValue, config?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): CompositeAnimation;
  sequence(list: CompositeAnimation[]): CompositeAnimation;
  parallel(list: CompositeAnimation[], config?: { stopTogether?: boolean }): CompositeAnimation;
  stagger(ms: number, list: CompositeAnimation[], config?: { from?: "first" | "last" | "center" | number }): CompositeAnimation;
  delay(ms: number): CompositeAnimation;
  loop(animation: CompositeAnimation, config?: { iterations?: number; resetBeforeIteration?: boolean }): CompositeAnimation;
  keyframes(value: AnimatedValue, config: KeyframeTiming & { keyframes: KeyframeValue[] }): CompositeAnimation;
  add(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  subtract(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  multiply(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  divide(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  modulo(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  diffClamp(a: AnimatedNode, min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  sampleSpring(config: SpringConfig & { from?: number }, fps?: number): number[];
  sampleDecay(config: DecayConfig & { from?: number }, fps?: number): number[];
};

interface CompositeAnimation {
  start(callback?: (result: { finished: boolean }) => void): Promise<{ finished: boolean }>;
  stop(): void;
  reset(): void;
}
```

`Animated` costruisce animazioni a partire da passi (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...). Nulla viene eseguito finché non si chiama `start()`; a quel punto l'intero albero viene eseguito in modo nativo, e ogni passo parte sul thread UI nell'istante esatto in cui termina il precedente (nessun intervallo tra i frame, nessun round trip verso il codice dell'app tra un passo e l'altro). Rust costruisce lo stesso albero con `Animation`.

| Funzione | Rust | Descrizione |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | Un'animazione di un valore; stesse opzioni e valori predefiniti dei metodi di [`AnimatedValue`](#animatedvalue), con il target come `toValue`. |
| `sequence(list)` | `Animation::sequence(list)` | Esegue le animazioni una dopo l'altra. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | Le esegue contemporaneamente. Con `stopTogether` (predefinito `true`), fermarne una le ferma tutte. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Le esegue in parallelo, ciascuna con avvio `ms` dopo la precedente, contando da `from`: `"first"` (predefinito), `"last"`, `"center"` (quella centrale parte subito, le altre si distribuiscono a partire da essa; con un numero pari di elementi partono subito entrambe quelle centrali) o un indice (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Un valore attraverso i [keyframe](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | Attende; utile dentro `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | Ripete `animation` per `iterations` volte (all'infinito per impostazione predefinita), ripristinando i suoi valori prima di ogni esecuzione a meno che `resetBeforeIteration` sia `false`. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | i metodi del nodo | Gli stessi metodi di [`AnimatedNode`](#animatednode), come funzioni. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | I valori di una spring o di un decay, uno per frame (vedi [Easing](#easing)). |

`CompositeAnimation`:

| Metodo | Rust (`Animation`) | Descrizione |
|---|---|---|
| `start(callback?)` | `start()`, un `AnimationEnd` su cui fare await | La esegue (di nuovo). Si risolve, e chiama `callback`, una volta per l'intero albero con `{ finished }`: indica se è terminata anziché essere stata fermata. |
| `stop()` | `stop()` | La ferma dov'è. |
| `reset()` | `reset()` | La ferma e riporta i suoi valori a dove erano quando è partita. |

```rust tabs
let ys: Vec<AnimatedValue> = (0..4).map(|_| animated_value(0.0)).collect();
let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -36.0, Timing::new(220.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);
let run = hop.start();
spawn(async move { log::info!("{}", if run.await { "done" } else { "stopped" }) });
```

```tsx tabs
const ys = [0, 1, 2, 3].map(() => createAnimatedValue(0));
const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -36, duration: 220, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);
hop.start(({ finished }) => console.log(finished ? "done" : "stopped"));
```

### Easing

```ts
type Easing =
  | "linear" | "ease" | "easeIn" | "easeOut" | "easeInOut"
  | [number, number, number, number]   // cubic Bézier x1, y1, x2, y2
  | EasingCurve
  | EasingSteps;                     // Easing.steps(…)

const Easing: {
  linear: Easing;
  ease: Easing;
  bezier(x1: number, y1: number, x2: number, y2: number): Easing;
  steps(count: number, position?: "jump-start" | "jump-end" | "jump-none" | "jump-both" | "start" | "end"): EasingSteps;
  in(e: Easing): Easing;
  out(e: Easing): Easing;
  inOut(e: Easing): Easing;
  sample(easing: Easing, count: number): number[];
  quad: EasingCurve;
  cubic: EasingCurve;
  poly(n?: number): EasingCurve;
  sin: EasingCurve;
  circle: EasingCurve;
  exp: EasingCurve;
  elastic(bounciness?: number): EasingCurve;
  back(s?: number): EasingCurve;
  bounce: EasingCurve;
};
```

Un easing è un dato, non una funzione dell'app: il runtime lo valuta in modo nativo. In Rust è l'enum `Easing`: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` e `Curve(curve, mode)`, con un `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) e un `EaseMode` (`In`, `Out`, `InOut`). Per disegnarne uno, `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) restituisce i suoi valori in `count` punti equidistanti da 0 a 1; `Animated.sampleSpring` e `Animated.sampleDecay` (`sample_spring`, `sample_decay`) restituiscono i valori di una spring o di un decay, uno per frame (a `fps`, 60 per impostazione predefinita) da `from` (0) fino alla sua fine. Tutti e tre provengono dal codice nativo su cui girano le animazioni. Ovunque in TSX sia accettato un `Easing` puoi passare un nome (`"easeOut"`), una Bézier cubica come quattro numeri, o una curva dall'oggetto `Easing`.

| Curva | Rust | Forma |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` vale 2 per impostazione predefinita) |
| `sin` | `Curve::Sin` | Sinusoidale |
| `circle` | `Curve::Circle` | Circolare |
| `exp` | `Curve::Exp` | Esponenziale |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Overshoot elastico (`bounciness` vale 1 per impostazione predefinita) |
| `back(s)` | `Curve::Back(s)` | Arretra prima di partire; `s` è l'overshoot (predefinito 1.70158) |
| `bounce` | `Curve::Bounce` | Rimbalza alla fine |

`Easing.steps(count, position)` è il CSS `steps()`: il valore salta tra `count` livelli invece di muoversi (uno sprite frame per frame, una lancetta che scatta). `position` indica dove cadono i salti: `"jump-end"` (il valore predefinito, anche `"end"`), `"jump-start"` (`"start"`), `"jump-none"` o `"jump-both"`; Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

Le curve sono nella loro forma "in" (lente all'inizio). `Easing.out(curve)` ne inverte una, `Easing.inOut(curve)` la rende simmetrica, `Easing.in(curve)` la lascia così com'è; in Rust si tratta del `EaseMode` di `Easing::Curve`.

```rust tabs
let _ = value.timing(1.0, 600.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
let _ = value.timing_with(1.0, Timing { easing: Easing::Bezier(0.2, 0.0, 0.0, 1.0), ..Timing::default() });
let _ = value.timing_with(1.0, Timing { easing: Easing::EaseOut, ..Timing::default() });
```

```tsx tabs
value.timing(1, { duration: 600, easing: Easing.out(Easing.back()) });
value.timing(1, { easing: Easing.bezier(0.2, 0, 0, 1) });
value.timing(1, { easing: "easeOut" });
```

### LayoutAnimation

```ts
const LayoutAnimation: {
  configureNext(config: LayoutAnimationConfig, onEnd?: () => void): void;
  create(duration: number, type?: LayoutAnimationType, property?: LayoutAnimationProperty): LayoutAnimationConfig;
  Types: { easeInEaseOut; spring; linear; easeIn; easeOut; keyboard };
  Properties: { opacity; scaleXY };
  Presets: { easeInEaseOut: LayoutAnimationConfig; linear: LayoutAnimationConfig; spring: LayoutAnimationConfig };
  easeInEaseOut(onEnd?: () => void): void;
  linear(onEnd?: () => void): void;
  spring(onEnd?: () => void): void;
};

interface LayoutAnimationConfig {
  duration: number;                // ms
  create?: LayoutAnimationAnimation;    // views inserted
  update?: LayoutAnimationAnimation;    // views moved or resized
  delete?: LayoutAnimationAnimation;    // views removed
}

interface LayoutAnimationAnimation {
  type?: "easeInEaseOut" | "spring" | "linear" | "easeIn" | "easeOut" | "keyboard";
  property?: "opacity" | "scaleXY" | "scale";
  duration?: number;
  delay?: number;
  springDamping?: number;          // 0..1, default 0.7
}
```

`LayoutAnimation.configureNext(config)` anima in modo nativo le modifiche di layout del commit successivo: le view che si spostano o cambiano dimensione scivolano verso i nuovi frame, le nuove view compaiono (con dissolvenza o scala in ingresso, in base a `property`) e quelle rimosse scompaiono. Chiamalo subito prima del cambio di stato che modifica il layout. Rust: `animate_layout(LayoutAnimation)`, con i preset di `nsh_core::element::LayoutAnimation` o le sue transizioni `create`, `update` e `delete`.

| Membro | Rust | Descrizione |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anima le modifiche del commit successivo; `onEnd` viene eseguito al termine. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | Una configurazione che usa la stessa curva per tutte e tre le fasi. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, view in dissolvenza in ingresso e in uscita. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms a velocità costante. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms; i frame hanno un effetto spring (damping 0.4), le view sfumano in modo lineare. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | Scorciatoie per `configureNext(Presets.…)`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | I nomi, come costanti. |

```rust tabs
let open = signal(false);
let toggle = move || {
    animate_layout(LayoutAnimation::SPRING);
    open.update(|o| *o = !*o);
};

view()
    .child(text("Details").on_press(toggle))
    .child(when(move || open.get(), || text("Shown with a spring.")))
```

```tsx tabs
const open = signal(false);
const toggle = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  open.update((o) => !o);
};

<View>
  <Text onPress={toggle}>Details</Text>
  <If when={open()}>
    <Text>Shown with a spring.</Text>
  </If>
</View>
```

## Device

L'API Device informa l'app sul dispositivo e sul suo ambiente. Il codice Rust chiama le funzioni di `nsh_core::prelude` (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...); TSX le importa da `nsh`. La dimensione della finestra, lo schema di colori, la scala del font, il rapporto di pixel, il locale e lo stato dell'app sono reattivi: leggili in un binding (una closure passata a un elemento in Rust, JSX in TSX), `computed` o `effect`, e ciò che li legge si aggiorna quando la piattaforma segnala un cambiamento (rotazione, ridimensionamento della finestra, passaggio alla modalità scura, modifica della dimensione del testo o della lingua, spostamento su uno schermo di densità diversa, uscita dall'app e ritorno).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

Vedi [Device e ambiente](../docs/device-and-environment.md) per la guida.

### windowSize

```ts
const windowSize: Accessor<Size>;
```

La dimensione della superficie in punti: la finestra, oppure l'elemento `NshAppView` / `NshView` incorporato. Reattivo. Rust: `window() -> Size<Points>`.

```rust tabs
let wide = move || window().width >= px(600.0);

view().style_when(wide, |s| s.flex_row())
```

```tsx tabs
const wide = () => windowSize().width >= 600;

<View style={{ flexDirection: wide() ? "row" : "column" }}>{/* ... */}</View>
```

### colorScheme

```ts
const colorScheme: Accessor<"light" | "dark">;
```

L'aspetto mostrato: quello del sistema, a meno che l'app non ne imposti uno proprio (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). Reattivo. Rust: `dark() -> bool`; i colori del tema (`AdaptiveColor`) e la variante di stile `.dark(…)` lo seguono senza bisogno di leggerlo. Anche la variante `dark:` di Tailwind lo segue (vedi [Tailwind](../docs/tailwind.md)).

```rust tabs
view().flex_1().bg(move || if dark() { black() } else { white() })
```

```tsx tabs
const dark = () => colorScheme() === "dark";

<View style={{ flex: 1, backgroundColor: dark() ? "#000" : "#fff" }} />
```

### fontScale

```ts
const fontScale: Accessor<number>;
```

La dimensione del testo preferita dall'utente rispetto a quella predefinita (`1` è la dimensione predefinita; Dynamic Type su iOS, dimensione del font su Android), oppure la dimensione del testo impostata al suo posto dall'app che incorpora. Reattivo. Rust: `font_scale() -> f32`. Il testo si adatta già ad essa a meno che `allowFontScaling={false}`; leggila quando altre dimensioni devono seguirla, come le icone accanto al testo.

### locale

```ts
const locale: Accessor<string>;
```

Il locale dell'utente come tag BCP 47 (`"en-US"`, `"zh-Hans-CN"`), oppure il locale impostato al suo posto dall'app che incorpora. Reattivo. Rust: `locale() -> Locale` (`locale().as_str()` è il tag). `Intl` formatta per esso in modo predefinito; leggilo per scegliere le stringhe delle tue traduzioni ([Device e ambiente](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

Indica se l'app è in uso, nei termini di `AppState` di React Native: `"active"` in primo piano e in grado di ricevere input, `"inactive"` mentre è visibile senza il focus (un'altra app o finestra lo ha, oppure il sistema mostra qualcosa sopra di essa, come il selettore delle app o una chiamata in arrivo), `"background"` mentre non è visibile (in background, ridotta a icona, una scheda del browser nascosta). Un'app mostrata all'interno di un'app nativa segue quella di quest'ultima. Reattivo. Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`).

Leggilo in un effect per mettere in pausa il lavoro che nessuno vede e riprenderlo quando l'app torna:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

### setColorScheme

```ts
function setColorScheme(scheme: "light" | "dark" | "system"): void;
```

Mostra l'app in `scheme` qualunque sia l'aspetto del sistema, subito: `colorScheme()`, le classi `dark:`, il tema dei componenti e i controlli della piattaforma (gli alert, lo stile predefinito della status bar) lo seguono; `"system"` torna a seguire il sistema. `nsh.json` `"appearance"` lo imposta fin dall'inizio. Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`).
### platform

```ts
const platform: Platform;

interface Platform {
  readonly os: "ios" | "android" | "macos" | "windows" | "linux" | "web";
  readonly version: string;
  readonly idiom: "phone" | "pad" | "mac" | "tv" | "desktop";
  readonly desktop: boolean;
  readonly catalyst: boolean;
  select<T>(spec: PlatformSelectSpec<T>): T | undefined;
}
```

La piattaforma su cui gira l'app, costante per tutta l'esecuzione.

| Membro | Rust | Descrizione |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` è la stringa TS) | Il sistema operativo. iOS, il simulatore iOS e Mac Catalyst riportano `"ios"`, i browser `"web"`. |
| `version` | `os_version() -> (u16, u16)` | iOS e desktop: la versione del sistema operativo (`"17.5"`); Android: il livello API (`"35"`); il web: `"0.0"`. Rust fornisce la versione major e minor, oppure il livello API e 0 su Android. |
| `idiom` | `idiom() -> Idiom` | Il tipo di dispositivo: `"desktop"` esattamente dove `desktop` è `true`; altrove `"phone"`, `"pad"` (un iPad, un tablet Android, Mac Catalyst con l'idioma iPad), `"mac"` (Mac Catalyst con l'idioma Mac di UIKit, un idioma mobile) o `"tv"` (Apple TV, Android TV). |
| `desktop` | `is_desktop() -> bool` | Vale il comportamento desktop: macOS, Windows, Linux e i browser con un mouse e una finestra ampia. Le prop `desktop={{…}}`, `select({ desktop })` e `idiom` `"desktop"` lo seguono tutte. Mac Catalyst esegue il backend iOS, quindi è mobile: qui si applicano le prop `ios={{…}}`. Il valore `isAvailable` di [`nsh/desktop`](./nsh-desktop.md#isavailable) è il controllo più ristretto per le sue API di finestre e menu, che hanno macOS, Windows e Linux. |
| `catalyst` | `is_catalyst() -> bool` | L'app gira sotto Mac Catalyst, nell'idioma Mac o iPad (`os` è `"ios"`). |
| `select(spec)` | `match os() { … }` | Il valore per questa piattaforma (vedi sotto). |

```rust tabs
let columns = if is_desktop() { 3 } else { 1 };
```

```tsx tabs
const columns = platform.desktop ? 3 : 1;
```

#### platform.select

```ts
interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  macos?: T;
  windows?: T;
  linux?: T;
  web?: T;
  mobile?: T;   // platform.desktop false: iOS (Mac Catalyst included), Android, phone and tablet browsers
  desktop?: T;  // platform.desktop true: macOS, Windows, Linux, desktop browsers
  native?: T;   // every platform but the web
  default?: T;
}
```

Restituisce il valore per il sistema operativo corrente (`ios`, `android`, `web`, ...), altrimenti `desktop` o `mobile` (in base a `platform.desktop`), altrimenti `native` (ogni piattaforma tranne il web), altrimenti `default`, altrimenti `undefined`. Il codice Rust usa il match su `os()` (e su `is_desktop()` per `mobile` / `desktop`).

```rust tabs
use nsh_core::platform::Os;

let card = view().p_4();
let card = match os() {
    Os::Ios => card.shadow([BoxShadow {
        offset_y: px(2.0),
        blur: px(8.0),
        color: rgba(0x00000026).into(),
        ..BoxShadow::default()
    }]),
    Os::Android => card.elevation(px(4.0)),
    _ => card,
};
```

```tsx tabs
const shadow = platform.select({
  ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.15)" },
  android: { elevation: 4 },
});
```

> [!TIP]
> Per le prop che esistono solo su una piattaforma, preferisci le prop `ios={{…}}` / `android={{…}}` degli elementi e dei componenti TSX al branching su `platform` (vedi [Codice specifico per piattaforma](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

Pixel del dispositivo per punto (ad es. `3` sulla maggior parte degli iPhone). Reattivo: cambia quando la finestra si sposta su uno schermo di densità diversa (su Mac Catalyst, sui desktop o su un display esterno) e quando l'impostazione della dimensione dello schermo di Android cambia la densità. Rust: `pixel_ratio() -> f32`, e `round_to_nearest_pixel(points)` per una lunghezza in pixel interi del dispositivo; in TSX quella lunghezza è `Math.round(x * pixelRatio()) / pixelRatio()`.

```rust tabs
let hairline = move || px(1.0 / pixel_ratio());
```

```tsx tabs
const hairline = () => 1 / pixelRatio();
```

### openUrl

```ts
function openUrl(url: string): Promise<OpenUrlResult>;

interface OpenUrlResult {
  opened: boolean;
}
```

Apre `url` fuori dall'app: una pagina web nel browser, un link `mailto:` nell'app di posta, un link `tel:` nell'app del telefono e qualsiasi schema registrato da un'altra app (`maps:`, i link `lb://` propri di un'app host). Si risolve con `{ opened }`, cioè se qualcosa l'ha aperto: `false` quando nessuna app gestisce lo schema. Rust: `open_url(url)` di `nsh_core::prelude`, una risposta da attendere (await) in un task (o da scartare), lo stesso `bool`.

```rust tabs
button()
    .child(text("Contact us"))
    .on_press(|| {
        spawn(async {
            if !open_url("mailto:help@example.com").await {
                log::warn!("no mail app");
            }
        });
    })
```

```tsx tabs
<Button
  onPress={async () => {
    const { opened } = await openUrl("mailto:help@example.com");
    if (!opened) {
      console.warn("no mail app");
    }
  }}
>
  <Text>Contact us</Text>
</Button>
```

- L'URL è assoluto (ha uno schema). Gli URL che eseguirebbero codice o raggiungerebbero i dati dell'app stessa, `javascript:`, `data:`, `blob:`, `file:`, `about:` e `asset:`, rifiutano la promise con un `TypeError`, così come gli indirizzi relativi. `openUrl` non lancia mai eccezioni: ogni errore rifiuta la promise.
- Un'app che dichiara capability richiede `openUrl`: `"openUrl": true` per ogni schema, oppure `"openUrl": { "schemes": ["https", "mailto"] }` per quelli elencati; gli altri URL vengono rifiutati con un `Error` il cui `code` è `"ERR_ACCESS_DENIED"`, `permission` `"openUrl"` e `resource` l'URL (vedi [Sandbox e capability](../docs/sandbox-and-capabilities.md)). In Rust, `open_url` risponde `false` per questi e registra il motivo nel log.
- L'app che incorpora vede l'URL per prima e può instradarlo invece tramite il proprio router (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; vedi [iOS](../docs/ios.md#links-the-app-opens) e [Android](../docs/android.md#links-the-app-opens)). `opened` è allora `true`.
- Ogni piattaforma lo apre con il proprio opener: `UIApplication.open` su iOS (l'application dell'app host quando è incorporata), un intent `ACTION_VIEW` su Android, `NSWorkspace` su macOS, `ShellExecuteW` su Windows, `GtkUriLauncher` su Linux, `open_url` di GPUI, una nuova scheda sul web. `nsh test` registra gli URL invece di aprirli.
- Un [`TextView`](../elements/text-view.md) apre i suoi link in questo modo con `links="open"`.

<a id="layout-direction"></a>

### Direzione del layout

La direzione del layout segue la lingua dell'utente: in una lingua da destra a sinistra (arabo, ebraico, ...) l'app viene disposta da destra a sinistra, le righe partono da destra e le proprietà di stile `left` / `right` (`marginLeft`, `paddingRight`, ...) significano inizio e fine. Le modifiche si applicano subito, senza riavvio.

Lo stile `direction` di una view (`"ltr"`, `"rtl"` o `"inherit"`, il valore predefinito) imposta la direzione del proprio sottoalbero; in Rust, `.direction(LayoutDirection::..)`.

```rust tabs
view().direction(LayoutDirection::Rtl).flex_row().gap_2().child(text("First")).child(text("Second"))
```

```tsx tabs
<View style={{ direction: "rtl", flexDirection: "row", gap: 8 }}>
  <Text>First</Text>
  <Text>Second</Text>
</View>
```

<a id="related"></a>

### Correlati

- Gli inset dell'area sicura (Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`) e la tastiera software (Rust `keyboard_height()`; TSX `keyboardFrame()`) sono in [Area sicura e tastiera](#safe-area-and-keyboard).
- Le impostazioni dello screen reader e della riduzione del movimento sono in [Accessibilità](#accessibility).

## PanResponder

I pan responder sono gesture di trascinamento costruite sul sistema dei gesture responder: l'elemento rivendica i tocchi di una gesture, poi li ascolta da solo insieme allo stato della gesture, che traccia per te il centroide dei tocchi, la distanza percorsa e la velocità. Il codice Rust li rivendica con `.claim_touches(TouchClaim::…)` e li ascolta con listener `.on_responder_*` il cui `ResponderEvent` porta un `PanGesture`, il tutto in `nsh_core::prelude`; TSX importa `PanResponder` da `nsh`, i cui callback `onPanResponder…` ricevono l'evento di tocco e lo stato della gesture.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Un pan responder consegna ogni movimento al codice dell'app, quindi è adatto alle gesture che modificano lo stato dell'app (riordinamento, decisioni di swipe-to-delete). Per spostare una view con il dito, i valori di gesture nativi sono più veloci: `.pan_values(x, y)`, `.pinch_value(scale)` e `.rotation_value(angle)` in Rust, le prop `pan={{ x, y }}`, `pinch` e `rotation` in TSX. Il trascinamento scrive negli [animated value](#animation) sul thread della UI e l'app viene avvisata solo all'inizio e alla fine (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`). Vedi [Tocco e gesture](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Crea un pan responder. Applica il suo `panHandlers` con lo spread sulla view che deve ricevere la gesture. In Rust, la view rivendica i tocchi e ascolta da sé:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view().flex_1().child(
        view()
            .size(px(64.0))
            .rounded(px(32.0))
            .bg(rgb(0x6366f1))
            .style_with(move |s| {
                let (x, y) = pos.get();
                s.translate_x(px(x)).translate_y(px(y))
            })
            .claim_touches(TouchClaim::on_start())
            .on_responder_grant(move |_: &ResponderEvent| {
                start.replace(pos.get_untracked());
            })
            .on_responder_move(move |e: &ResponderEvent| {
                let (x, y) = start.get();
                pos.set((x + e.gesture.delta.x.0, y + e.gesture.delta.y.0));
            })
            .on_responder_release(move |e: &ResponderEvent| {
                log::info!("released at {:.0} pt/s", e.gesture.vx);
            }),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function App() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => (start = pos()),
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log(`released at ${g.vx.toFixed(0)} pt/s`),
  });
  return (
    <View style={{ flex: 1 }}>
      <View
        {...pan.panHandlers}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#6366f1",
          transform: [{ translateX: pos().x }, { translateY: pos().y }],
        }}
      />
    </View>
  );
}

mount(App);
```

<a id="callbacks"></a>

### Callback

Ogni callback riceve l'evento di tocco (`GestureResponderEvent`, da [`nsh`](#types)) e lo stato della gesture. In Rust, una rivendicazione decide con `.ask(|request: &ClaimRequest| …)`, chiamando `request.claim()` per prendere i tocchi (senza `ask` li prende sempre), e ogni listener riceve un `ResponderEvent` il cui `gesture` è lo stato.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Callback | Rust | Restituisce | Chiamato quando |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | Un dito tocca lo schermo: restituisci `true` per diventare il responder. Viene chiesto dalla view toccata verso l'esterno. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | Lo stesso, ma chiesto dall'esterno verso l'interno prima di quello in bubbling (un genitore che toglie la gesture ai figli). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | Un dito si muove: restituisci `true` per diventare il responder (ad es. solo dopo `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | Lo stesso, nella fase di capture. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | Questa view è ora il responder: la gesture inizia. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | Un'altra view è il responder e non vuole cederlo. |
| `onPanResponderStart` | `.on_responder_start(…)` | | Un dito ha toccato lo schermo mentre si stava rispondendo. |
| `onPanResponderMove` | `.on_responder_move(…)` | | Le dita si sono mosse. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | Un dito si è sollevato mentre si stava rispondendo. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | L'ultimo dito si è sollevato: la gesture è terminata. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | Un'altra view (o una gesture nativa, come una scroll view) ha preso i tocchi. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` li mantiene | `boolean` | Un'altra view vuole i tocchi: restituisci `false` per mantenerli (predefinito `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | Se impedire alle scroll view native di prendere i tocchi mentre si risponde (predefinito `true`). |

### PanResponderGestureState

```ts
interface PanResponderGestureState {
  stateID: number;
  moveX: number;               // latest centroid of the touches (surface points)
  moveY: number;
  x0: number;                  // the centroid when the responder was granted
  y0: number;
  dx: number;                  // distance moved since the grant
  dy: number;
  vx: number;                  // velocity, points per second
  vy: number;
  numberActiveTouches: number;
}
```

Rust: `PanGesture`, con i punti come `Point<Points>`.

| Campo | Rust | Descrizione |
|---|---|---|
| `stateID` |  | Identifica la gesture. |
| `moveX`, `moveY` | `position` | Ultima posizione del centroide dei tocchi, in punti della superficie. |
| `x0`, `y0` | `origin` | Dove si trovava il centroide quando il responder è stato concesso. |
| `dx`, `dy` | `delta` | Distanza percorsa dalla concessione. |
| `vx`, `vy` | `vx`, `vy` | Velocità in punti al secondo. |
| `numberActiveTouches` | `active_touches` | Dita appoggiate. |

<a id="inside-scroll-views"></a>

### Dentro le scroll view

Mentre un pan responder è il responder, le scroll view native che lo circondano non scorrono (`onShouldBlockNativeResponder` vale `true` per impostazione predefinita). Per far coesistere uno swipe orizzontale con lo scorrimento verticale, diventa il responder solo sui movimenti orizzontali:

```rust tabs
view()
    .claim_touches(TouchClaim::on_move().ask(|request: &ClaimRequest| {
        let d = request.event.gesture.delta;
        if d.x.0.abs() > 10.0 && d.x.0.abs() > d.y.0.abs() {
            request.claim();
        }
    }))
    .on_responder_move(move |e: &ResponderEvent| offset.set(e.gesture.delta.x.0))
    .on_responder_release(move |e: &ResponderEvent| {
        if e.gesture.delta.x.0.abs() > 120.0 { remove() } else { offset.set(0.0) }
    })
    .on_responder_terminate(move |_: &ResponderEvent| offset.set(0.0))
```

```tsx tabs
const swipe = PanResponder.create({
  onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
  onPanResponderMove: (_, g) => offset.set(g.dx),
  onPanResponderRelease: (_, g) => (Math.abs(g.dx) > 120 ? remove() : offset.set(0)),
  onPanResponderTerminate: () => offset.set(0),
});
```

Per un pan che la piattaforma riconosce, `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` decide sul main thread mentre le dita si muovono. Le prop responder sottostanti (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) possono anche essere usate direttamente su qualsiasi elemento; vedi [Elementi](../elements/index.md).

## Clipboard

L'API clipboard legge e scrive gli appunti di sistema: testo ovunque (`UIPasteboard` su iOS, `ClipboardManager` su Android, `NSPasteboard`, GDK e gli appunti Win32 sui desktop, `navigator.clipboard` sul web), immagini su iOS, sui desktop e sul web, e i file copiati in un file manager sui desktop e su Mac Catalyst. Il codice Rust chiama le funzioni di `nsh_core::prelude` (`set_clipboard`, `clipboard_string`, ...); TSX importa `Clipboard` da `nsh`.

```rust tabs
use nsh_core::prelude::*; // set_clipboard, clipboard_string, clipboard_image, ...
use nsh_core::element::ClipboardImage;
```

```tsx tabs
import { Clipboard } from "nsh";
```

```ts
const Clipboard: {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  hasText(): Promise<boolean>;
  writeImage(src: string): Promise<void>;
  readImage(): Promise<ClipboardImage | null>;
  hasImage(): Promise<boolean>;
  readFiles(): Promise<string[]>;
};

interface ClipboardImage {
  url: string; // a URL that Image shows and fetch reads
  size: PixelSize; // in pixels
}
```

| TS | Rust (`nsh_core::prelude`) |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

Le letture Rust restituiscono risposte da attendere (await) in un task (`spawn`, o una funzione di modulo `async`); `ClipboardImage` è `nsh_core::element::ClipboardImage`, con `url` e `size` (un `Size<DevicePixels>`).

Le immagini passano dagli appunti su iOS, sui desktop e sul web. Su Android gli appunti trasportano testo: `writeImage` e
`readImage` vengono rifiutate con un `Error` il cui `code` è `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`, e `hasImage` si risolve con
`false`. In Rust, `set_clipboard_image` lascia gli appunti com'erano e `clipboard_image` risponde `None`.

L'utente può anche copiare da un [testo selezionabile](../elements/text.md) per conto proprio; l'API clipboard serve per copiare dal codice, ad esempio con un pulsante Copia.

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

Mette `text` negli appunti, sostituendo ciò che c'era. Rust: `set_clipboard(text)`.

```rust tabs
use nsh_core::prelude::*;

fn copy_button(code: Signal<String>) -> impl IntoElement {
    let copied = signal(false);
    view()
        .role(AccessibilityRole::Button)
        .on_press(move || {
            set_clipboard(code.get());
            copied.set(true);
        })
        .child(text(move || if copied.get() { "Copied" } else { "Copy" }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Clipboard } from "nsh";

const copied = signal(false);

<View
  onPress={async () => {
    await Clipboard.writeText(code());
    copied.set(true);
  }}
>
  <Text>{copied() ? "Copied" : "Copy"}</Text>
</View>;
```

### Clipboard.readText

```ts
readText(): Promise<string>;
```

Si risolve con il testo degli appunti, oppure con `""` quando non ne contengono. Rust: `clipboard_string()`. Su iOS, leggere gli appunti può mostrare l'avviso di incolla del sistema ("App ha incollato da …"), e su Android 10 e successivi solo l'app in primo piano può leggerli. Leggili quando l'utente chiede di incollare, non a ogni schermata.

```rust tabs
spawn(async move {
    let pasted = clipboard_string().await;
    if !pasted.is_empty() {
        code.set(pasted.trim().to_string());
    }
});
```

```tsx tabs
const pasted = await Clipboard.readText();
if (pasted) code.set(pasted.trim());
```

### Clipboard.hasText

```ts
hasText(): Promise<boolean>;
```

Si risolve indicando se gli appunti contengono testo, senza leggerlo: nessun avviso di incolla su iOS. Rust: `clipboard_has_string()`. Usalo per decidere se mostrare un pulsante Incolla. Sul web i browser lo sanno solo leggendo, quindi può chiedere il permesso all'utente.

```rust tabs
let can_paste = signal(false);
spawn(async move { can_paste.set(clipboard_has_string().await) });
```

```tsx tabs
const canPaste = signal(false);
Clipboard.hasText().then((has) => canPaste.set(has));
```

### Clipboard.readImage

```ts
readImage(): Promise<ClipboardImage | null>;
```

Si risolve con l'immagine degli appunti, oppure con `null` quando non ne contengono: uno screenshot incollato, o un'immagine copiata in un browser
o in un editor di immagini. Rust: `clipboard_image()`, `None` quando non ne contengono. `url` è un URL dell'immagine (PNG, oppure il
JPEG, GIF, WebP o BMP degli appunti) che un [`Image`](../elements/image.md) mostra come `src` e che `fetch` legge:
`fetch(url)` ne restituisce i byte, per un upload. `size` (`width` e `height`) è la sua dimensione in pixel, dopo la decodifica. Come per
`readText`, leggila quando l'utente chiede di incollare. Vengono lette immagini fino a 48 MB (codificate), così che l'immagine stia nella
memoria dell'app; una più grande viene rifiutata con un `Error` il cui `code` è `"ERR_NSH_QUOTA_EXCEEDED"` (il suo messaggio indica la
dimensione dell'immagine e il limite), mentre `hasImage` si risolve con `true`. Rust: `clipboard_image()` risponde `None` in questo caso.

```rust tabs
use base64::Engine as _;
use nsh_core::{element::ClipboardImage, prelude::*};

fn attachments() -> impl IntoElement {
    let attachments = signal(Vec::<ClipboardImage>::new());
    let paste = move || {
        spawn(async move {
            if let Some(image) = clipboard_image().await {
                attachments.update(|list| list.push(image));
            }
        });
    };
    view()
        .flex_row()
        .gap_2()
        .child(text("Paste").on_press(paste))
        .child(each(
            attachments,
            |shot: &ClipboardImage| shot.url.clone(),
            |shot, _| image(move || shot.with(|s| s.url.clone())).size(px(64.0)).rounded(px(8.0)),
        ))
}

async fn upload(image: &ClipboardImage) -> Result<HttpResponse, String> {
    let (_, data) = image.url.split_once(',').ok_or("not a data: URL")?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let request = HttpRequest::post("https://example.com/upload", bytes).header("Content-Type", "image/png");
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, View } from "nsh";
import { Clipboard, type ClipboardImage } from "nsh";

const attachments = signal<ClipboardImage[]>([]);

async function paste() {
  const image = await Clipboard.readImage();
  if (image) attachments.set([...attachments(), image]);
}

async function upload(image: ClipboardImage) {
  const body = new FormData();
  body.append("file", await (await fetch(image.url)).blob(), "screenshot.png");
  await fetch("https://example.com/upload", { method: "POST", body });
}

<View class="flex-row gap-2">
  <Each of={attachments()}>
    {(image) => <Image src={image().url} style={{ width: 64, height: 64, borderRadius: 8 }} />}
  </Each>
</View>;
```

Un'app in stile chat in cui gli utenti incollano screenshot in un composer associa la scorciatoia di incolla mentre il suo input ha il focus
e prende l'immagine quando ce n'è una:

```rust tabs
use nsh_core::keymap::When;

on_key_with("mod+v", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| {
    spawn(async move {
        if clipboard_has_image().await {
            paste().await;
        } else {
            insert_text(&clipboard_string().await);
        }
    });
});
```

```tsx tabs
import { keymap } from "nsh";

keymap.bind("mod+v", async () => {
  if (await Clipboard.hasImage()) return paste();
  insertText(await Clipboard.readText());
}, { when: "always" });
```

### Clipboard.hasImage

```ts
hasImage(): Promise<boolean>;
```

Si risolve indicando se gli appunti contengono un'immagine, senza leggerla: nessun avviso di incolla su iOS. Rust:
`clipboard_has_image()`. Su Android si risolve con `false`.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

Mette negli appunti l'immagine di `src`, un URL `data:` in base64 o il `url` restituito da `readImage`, sostituendo ciò che contengono.
Rust: `set_clipboard_image(src)`. Su Windows accetta un PNG, il formato che leggono i browser, Office e lo Strumento di cattura. Su
Android viene rifiutata con `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.

```rust tabs
set_clipboard_image(image.url.clone());
```

```tsx tabs
await Clipboard.writeImage(image.url);
```

### Clipboard.readFiles

```ts
readFiles(): Promise<string[]>;
```

Si risolve con gli URL `file:` dei file e delle cartelle copiati in un file manager (Finder, Explorer, Files), nel loro
ordine, oppure con `[]`: gli stessi URL che fornisce un [file drop](../elements/view.md#desktop-file-drops). Rust: `clipboard_files()`.
Analizza un URL per ottenerne il percorso.

```rust tabs
let paths: Vec<std::path::PathBuf> = clipboard_files()
    .await
    .iter()
    .filter_map(|file| url::Url::parse(file).ok()?.to_file_path().ok())
    .collect();
```

```tsx tabs
const files = await Clipboard.readFiles();
const names = files.map((url) => decodeURIComponent(new URL(url).pathname.split("/").pop()!));
```

> [!NOTE]
> Quando la tua app dichiara `capabilities` in `nsh.json`, gli appunti devono essere concessi con `"clipboard": true`. Senza, ogni funzione di `Clipboard` viene rifiutata con un `Error` il cui `code` è `"ERR_ACCESS_DENIED"`, `permission` `"clipboard"` e `resource` `""`, e nulla raggiunge gli appunti di sistema. In Rust, le scritture lasciano gli appunti com'erano e le letture rispondono come farebbero degli appunti vuoti (`""`, `None`, una lista vuota, `false`), e il rifiuto viene registrato nel log. Vedi [Sandbox e capability](../docs/sandbox-and-capabilities.md).
>
> ```tsx
> try {
>   await Clipboard.writeText(code());
> } catch (error) {
>   if (error.code === "ERR_ACCESS_DENIED") showHint("Copying is turned off for this app");
>   else throw error;
> }
> ```
## Picker

L'API picker mostra il selettore di sistema per le foto e consegna all'app le immagini scelte dall'utente: il Photos picker su
iOS (`PHPickerViewController`), il Photo Picker su Android, un pannello di apertura o una finestra di dialogo file sui desktop e un file
input in un browser. Su iOS e Android il selettore viene eseguito fuori dall'app e consegna solo ciò che l'utente sceglie, quindi
non richiede alcun permesso per la libreria foto. Ogni immagine scelta arriva come `File` (TSX) o `PickedFile` (Rust) i cui byte restano
nativi: mostrala con `URL.createObjectURL(file)` in un [`Image`](../elements/image.md), caricala con `fetch` e
`FormData`. Il codice Rust chiama `pick_images` di `nsh_core::prelude`; TSX importa `Picker` da `nsh`.

```rust tabs
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*; // pick_images
```

```tsx tabs
import { Picker, type PickedImage } from "nsh";
```

```ts
const Picker: {
  pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
};

interface PickImagesOptions {
  multiple?: boolean; // let the user pick several (false: one)
  limit?: number; // at most this many when multiple (up to 100)
  maxDimension?: number; // scale images whose longer side is longer, in pixels
  quality?: number; // JPEG quality from 0 to 1 (0.9)
  format?: "compatible" | "current"; // "compatible": HEIC and the like as JPEG
}

interface PickedImage {
  file: File; // name, type, size in bytes and the bytes
  size: PixelSize; // upright
}
```

| TS | Rust |
|---|---|
| `await Picker.pickImages(options)` | `pick_images(request).await -> Vec<PickedFile>` |
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 per un massimo di 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

Mostra il selettore e si risolve con le immagini scelte dall'utente, nell'ordine di scelta, oppure con `[]` quando l'utente annulla.
Rust: `pick_images(request)`, una risposta da attendere in un task (`spawn`, o una funzione di modulo `async`). `pickImages`
non lancia mai eccezioni: le opzioni fuori intervallo (`limit: 0`, un `quality` fuori dall'intervallo da 0 a 1) rifiutano la promise con un `RangeError`, e una
selezione che le capability dell'app non consentono la rifiuta con `ERR_ACCESS_DENIED` (sotto). Un annullamento è una risposta dell'utente, non un
fallimento: si risolve con `[]`.

Le immagini arrivano pronte per essere inviate:

- **Formati accettati da ogni browser e server.** JPEG, PNG, GIF e WebP arrivano così come sono; una foto memorizzata in un altro
  formato (HEIC su iPhone, HEIF, TIFF) arriva come JPEG. `format: "current"` mantiene il formato memorizzato.
- **Ridimensionate in modo nativo.** Con `maxDimension`, un'immagine il cui lato più lungo supera il valore viene ridimensionata per rientrarvi, in posizione verticale, e
  codificata di nuovo: un PNG come PNG, qualsiasi altro formato come JPEG con `quality`. Le foto dei telefoni sono da 12 a 48 megapixel; ridimensionarle
  a 2048 pixel prima di un upload le riduce a poche centinaia di kilobyte. Anche `quality` codifica di nuovo i JPEG.
- **Ciò che mostra.** `size` è la dimensione in pixel dell'immagine come appare, con l'orientamento della fotocamera applicato. Un'immagine che NSH
  codifica di nuovo non contiene metadati (nessuna posizione); quella che arriva così com'è mantiene i propri.

Su Windows, Linux e nelle finestre GPUI, la finestra di dialogo offre i formati accettati dalla richiesta (con `"compatible"`: JPEG, PNG,
GIF e WebP) e i file arrivano così come sono memorizzati, alla loro dimensione originale.

Un composer di chat allega una foto, la mostra mentre il messaggio viene scritto e la carica quando il messaggio viene inviato:

```rust tabs
use nsh_core::geometry::{DevicePixels, Percentage};
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*;

fn attach_button(attached: Signal<Option<PickedFile>>) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .accessibility_label("Choose a photo")
        .on_press(move || {
            let mut request = PickRequest::new(false, 1);
            request.max_dimension = Some(DevicePixels(2048));
            request.quality = Some(Percentage(0.85));
            let picked = pick_images(request);
            spawn(async move {
                if let Some(file) = picked.await.into_iter().next() {
                    attached.set(Some(file));
                }
            });
        })
        .child(text("Photo"))
}

async fn upload(file: &PickedFile) -> Result<HttpResponse, String> {
    let request = HttpRequest::post("https://example.com/upload", file.data.to_vec())
        .header("Content-Type", file.mime.as_str());
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, Text, View } from "nsh";
import { Picker } from "nsh";

const attached = signal<{ file: File; src: string } | null>(null);

async function choosePhoto() {
  const [picked] = await Picker.pickImages({ maxDimension: 2048, quality: 0.85 });
  if (picked) attached.set({ file: picked.file, src: URL.createObjectURL(picked.file) });
}

async function send(text: string) {
  const body = new FormData();
  body.append("text", text);
  if (attached()) body.append("photo", attached()!.file);
  await fetch("https://example.com/messages", { method: "POST", body });
  if (attached()) URL.revokeObjectURL(attached()!.src);
  attached.set(null);
}

<View class="flex-row items-center gap-2">
  <View role="button" accessibilityLabel="Choose a photo" onPress={choosePhoto}>
    <Text>Photo</Text>
  </View>
  <If when={attached()}>
    <Image src={attached()!.src} style={{ width: 48, height: 48, borderRadius: 8 }} />
  </If>
</View>;
```

Più foto contemporaneamente:

```rust tabs
let picked = pick_images(PickRequest::new(true, 9));
spawn(async move {
    let files = picked.await;
    photos.update(|list| list.extend(files));
});
```

```tsx tabs
const images = await Picker.pickImages({ multiple: true, limit: 9, maxDimension: 2048 });
photos.set([...photos(), ...images.map((image) => URL.createObjectURL(image.file))]);
```

<a id="embedding-apps"></a>

### App che incorporano NSH

Un'app che incorpora NSH e ha un proprio selettore (ad esempio uno con gli album dell'app) risponde da sé alle selezioni: in
Rust, un `PickerBackend` (`nsh_core::picker`) passato al motore (`EngineConfig::picker`, o `AppView::set_picker` nelle
app GPUI e GPUI Kit) riceve il `PickRequest` di ogni selezione e restituisce i file, e il selettore di sistema non viene
mostrato. I file che restituisce vengono completati come quelli della piattaforma: tagliati al limite della richiesta, con dimensioni, tipi e
estensioni letti dai loro byte.

<a id="tests"></a>

### Test

`nsh test` risponde alle selezioni nelle esecuzioni headless: `app.onPick(handler)` restituisce i file scelti dall'utente (`{ name, type, data }`),
e senza un handler una selezione viene annullata. Vedi [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Quando la tua app dichiara `capabilities` in `nsh.json`, il selettore deve essere abilitato con `"picker": true`. Senza di esso
> `pickImages` non mostra nulla e rifiuta con un `Error` il cui `code` è `"ERR_ACCESS_DENIED"`, `permission`
> `"picker"` e `resource` `""`. In Rust, `pick_images` risponde senza file e il rifiuto viene registrato nel log. Vedi
> [Sandbox e capability](../docs/sandbox-and-capabilities.md).

## Speech

L'API speech trasforma ciò che l'utente dice in testo (dettatura): l'app avvia una sessione, la piattaforma ascolta il
microfono e la trascrizione arriva man mano che cresce. macOS e iOS riconoscono la voce con il framework Speech di sistema; il
sistema chiede all'utente una sola volta l'accesso al microfono e al riconoscimento vocale. Sulle altre piattaforme una sessione termina subito
con l'errore `"unavailable"`, quindi controlla `Speech.available()` prima di mostrare un pulsante del microfono. Il codice Rust chiama
`recognize_speech` di `nsh_core::prelude`; TSX importa `Speech` da `nsh`.

```rust tabs
use nsh_core::speech::{SpeechEvent, SpeechRequest};
```

```tsx tabs
import { Speech, type SpeechSession } from "nsh";
```

```ts
const Speech: {
  available(): Promise<boolean>;
  start(options?: SpeechOptions): SpeechSession;
};

interface SpeechOptions {
  /** The language spoken, a BCP 47 tag ("en-US", "zh-CN"); the user's when left out. */
  lang?: string;
  /** Results while the user speaks (true, the default), or only the final one. */
  interim?: boolean;
}

interface SpeechSession {
  on(event: "start", listener: () => void): () => void;
  on(event: "result", listener: (result: SpeechResult) => void): () => void;
  on(event: "end", listener: (end: SpeechEnd) => void): () => void;
  /** The whole transcript so far. */
  readonly text: string;
  readonly ended: boolean;
  stop(): void;
  abort(): void;
}

interface SpeechResult { text: string; isFinal: boolean }
interface SpeechEnd { text: string; error?: SpeechErrorCode }

type SpeechErrorCode =
  | "not-allowed" | "no-speech" | "audio-capture" | "network"
  | "language-not-supported" | "unavailable" | "failed";
```

| TSX | Rust |
|---|---|
| `await Speech.available()` | `speech_available().await -> bool` |
| `Speech.start(options)` | `recognize_speech(request) -> SpeechRecognition` |
| `session.on("result", ...)` | `recognition.next().await -> Option<SpeechEvent>` |
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (eliminarlo interrompe la sessione) |

### Speech.start

Avvia una sessione e la restituisce subito. Una sessione segnala, in quest'ordine: `start` quando il microfono è attivo e il
riconoscitore ascolta, `result` ogni volta che la trascrizione cambia (`text` è sempre l'intera trascrizione finora, quindi
l'app la mostra così com'è) e un solo `end`, dopo il quale non arriva più nulla. `stop()` smette di ascoltare e lascia che il riconoscitore
termini ciò che ha sentito: un ultimo risultato con `isFinal: true`, poi `end`. `abort()` termina subito la sessione, senza
errore, e scarta ciò che non è stato segnalato. Una sola sessione è attiva alla volta: avviarne un'altra interrompe quella in corso.

`end` contiene l'ultima trascrizione e, quando la sessione è fallita, `error`, denominato come nella Web Speech API:

| `error` | Quando |
|---|---|
| `"not-allowed"` | L'utente o il sistema non consente l'uso del microfono o del riconoscimento vocale. |
| `"no-speech"` | Non è stato detto nulla. |
| `"audio-capture"` | Non è stato possibile usare il microfono. |
| `"network"` | Il riconoscitore richiede la rete e non è riuscito a raggiungerla. |
| `"language-not-supported"` | Il riconoscitore non conosce `lang`. |
| `"unavailable"` | Questa piattaforma non riconosce la voce, o non in questo momento. |
| `"failed"` | Il riconoscitore è fallito per un altro motivo. |

`start` lancia un `TypeError` per opzioni di tipo errato e un `RangeError` per un `lang` che non è un tag di lingua.

```tsx
import { signal, Speech, type SpeechSession } from "nsh";

const transcript = signal("");
let session: SpeechSession | null = null;

function toggle() {
  if (session && !session.ended) {
    session.stop();
    return;
  }
  session = Speech.start({ lang: "en-US" });
  session.on("result", ({ text }) => transcript.set(text));
  session.on("end", ({ text, error }) => {
    if (error) console.warn("dictation ended:", error);
    else transcript.set(text);
  });
}
```

```rust
use nsh_core::prelude::*;
use nsh_core::speech::{SpeechEvent, SpeechRequest};

async fn dictate() -> String {
    let mut recognition = recognize_speech(SpeechRequest::default());
    let mut text = String::new();
    while let Some(event) = recognition.next().await {
        match event {
            SpeechEvent::Result { text: heard, .. } => text = heard,
            SpeechEvent::End { .. } => break,
            _ => {}
        }
    }
    text
}
```

### Speech.available

Si risolve con `true` dove una sessione può essere eseguita: su macOS e iOS, e ovunque l'app che incorpora NSH riconosca la voce da sé.

### Info.plist

Su macOS e iOS il sistema mostra perché l'app vuole accedere al microfono e al riconoscimento vocale. `nsh package` e
`nsh run` scrivono `NSMicrophoneUsageDescription` e `NSSpeechRecognitionUsageDescription` nell'Info.plist dell'app
quando l'app può usare la voce (la sua concessione `capabilities` `speech`, oppure non ne dichiara nessuna).

<a id="embedding-apps-1"></a>

### App che incorporano NSH

Un'app che incorpora NSH e riconosce la voce a modo suo (con un proprio motore o servizio) risponde da sé alle sessioni: in
Rust, un `SpeechBackend` (`nsh_core::speech`) passato al motore (`EngineConfig::speech`) riceve il
`SpeechRequest` di ogni sessione e un `SpeechSink` a cui può riferire da qualsiasi thread, e restituisce il `SpeechControl` con cui il core interrompe e
termina la sessione. Il riconoscitore della piattaforma non viene usato in questo caso.

<a id="tests-1"></a>

### Test

`nsh test` esegue le sessioni su un riconoscitore fittizio nelle esecuzioni headless: una sessione si avvia subito, `app.hear(text)` segnala
`text` come trascrizione finora, `app.endSpeech(error?)` la termina e `app.speechRequests()` elenca le sessioni che l'
app ha avviato. Vedi [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Quando la tua app dichiara `capabilities` in `nsh.json`, la voce deve essere abilitata con `"speech": true`. Senza di esso
> `Speech.start` lancia un `Error` il cui `code` è `"ERR_ACCESS_DENIED"`, `permission` `"speech"` e `resource` `""`.
> In Rust, la sessione termina con `not-allowed` e il rifiuto viene registrato nel log. Vedi
> [Sandbox e capability](../docs/sandbox-and-capabilities.md).

## Storage

L'API storage conserva i dati dell'app sul dispositivo: stringhe identificate da una chiave stringa, ancora presenti al successivo avvio dell'app. Usala per impostazioni, bozze, l'ultima scheda aperta dall'utente, una cache di ciò che il server ha inviato: qualsiasi stato che debba sopravvivere al processo dell'app. Il codice Rust usa `nsh_core::storage::Storage`, TSX importa `Storage` da `nsh`; entrambi leggono e scrivono le stesse voci, quindi un'app con una voce Rust e una voce TSX vede un unico insieme di dati.

```rust tabs
use nsh_core::storage::Storage;
```

```tsx tabs
import { Storage } from "nsh";
```

```ts
const Storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
};
```

| TS | Rust (`nsh_core::storage::Storage`) |
|---|---|
| `await Storage.getItem(key)` | `Storage::get_item(key) -> Option<String>` |
| `await Storage.setItem(key, value)` | `Storage::set_item(key, value) -> Result<(), StorageFull>` |
| `await Storage.removeItem(key)` | `Storage::remove_item(key)` |
| `await Storage.keys()` | `Storage::get_all_keys() -> Vec<String>` |
| `await Storage.clear()` | `Storage::clear()` |

Le funzioni Rust sono sincrone, poiché le voci sono in memoria: chiamale dove vengono eseguiti i componenti (i loro corpi, gli handler e i task).

Ogni app ha uno storage proprio, fino a 5 MB di chiavi e valori. Le chiamate vengono eseguite nell'ordine in cui l'app le effettua, quindi un `getItem` dopo un `setItem` vede il nuovo valore senza attendere la scrittura. Le letture provengono dalla memoria; le scritture raggiungono il disco in background, poche alla volta.

| Piattaforma | Dove sono conservati i dati |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` nel container dell'app |
| Android | `files/nsh/<app id>/storage.json` nella directory privata dell'app |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | Il `localStorage` del browser, sotto chiavi che prendono il nome dall'id dell'app (`nsh:com.example.todo:…`) |

Un `storage.json` danneggiato viene conservato come `storage.json.corrupt` accanto all'originale, e l'app si avvia con uno storage vuoto; uno che non può essere letto lascia le modifiche dell'app in memoria, così il file non viene mai sostituito.

L'id dell'app è il `id` in `nsh.json`, e viaggia con l'app: `nsh build` e `nsh package` lo scrivono accanto al bundle, il dev server lo invia, e un pacchetto firmato porta quello garantito dal certificato della sua chiave di rilascio. Così ogni app conserva i propri dati senza alcuna configurazione, ovunque venga eseguita; un'app senza id li conserva sotto `default`. Un'app che incorpora NSH può scegliere un altro percorso (vedi [Embedding su iOS](../docs/ios.md) ed [Embedding su Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

Si risolve con il valore di `key`, oppure con `null` quando non ne ha. Rust: `Storage::get_item(key)`, `None` quando non ne ha.

```rust tabs
let theme = Storage::get_item("theme").unwrap_or_else(|| "system".into());
```

```tsx tabs
const theme = (await Storage.getItem("theme")) ?? "system";
```

### Storage.setItem

```ts
setItem(key: string, value: string): Promise<void>;
```

Imposta `key` a `value`, sostituendo ciò che conteneva. Rifiuta con un `Error` il cui `code` è `"ERR_NSH_QUOTA_EXCEEDED"` quando lo storage supererebbe i 5 MB; il valore non viene conservato in tal caso. Rust: `Storage::set_item(key, value)`, che in tal caso restituisce `Err(StorageFull)`. I valori sono stringhe: conserva i dati strutturati come JSON (`serde_json::to_string` in Rust, `JSON.stringify` in TSX) e rileggili (`serde_json::from_str`, `JSON.parse`).

```rust tabs
let draft = serde_json::json!({ "title": title.get(), "body": body.get() });
if let Err(full) = Storage::set_item("draft", draft.to_string()) {
    log::warn!("{full}");
}
```

```tsx tabs
Storage.setItem("draft", JSON.stringify({ title: title(), body: body() }));
```

### Storage.removeItem

```ts
removeItem(key: string): Promise<void>;
```

Rimuove `key` e il suo valore. Rimuovere una chiave che non ha valore non fa nulla. Rust: `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

Si risolve con tutte le chiavi, in ordine. Rust: `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

Rimuove ogni chiave dell'app, ad esempio quando l'utente si disconnette. Rust: `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### Conservare un signal sul dispositivo

Leggi il valore conservato all'avvio dell'app, poi riscrivilo ogni volta che il signal cambia:

```rust tabs
use nsh_core::{storage::Storage, prelude::*};

#[component]
pub fn App() -> impl IntoElement {
    let saved = Storage::get_item("count").and_then(|n| n.parse().ok());
    let count = signal(saved.unwrap_or(0_u32));
    effect(move || {
        if let Err(full) = Storage::set_item("count", count.get().to_string()) {
            log::warn!("{full}");
        }
    });
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Pressed {} times", count.get())))
}
```

```tsx tabs
import { effect, mount, signal, Text, View } from "nsh";
import { Storage } from "nsh";

const count = signal(0);
const loaded = signal(false);
Storage.getItem("count").then((saved) => {
  count.set(Number(saved ?? 0));
  loaded.set(true);
});
effect(() => {
  if (loaded()) Storage.setItem("count", String(count()));
});

mount(() => (
  <View onPress={() => count.update((n) => n + 1)}>
    <Text>Pressed {count()} times</Text>
  </View>
));
```

## host

`host` raggiunge l'app che incorpora NSH: l'app nativa attorno a un `NshAppView` / `NshView`, oppure, sul web, la pagina che esegue il player. L'app chiama le funzioni dell'host per nome con argomenti JSON e ascolta gli eventi inviati dall'host.

```ts
import { host } from "nsh";
```

```ts
const host: {
  readonly params: { readonly [key: string]: unknown };
  post(name: string, data?: unknown): void;
  available(): boolean;
  call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
  on(event: string, listener: (payload: unknown) => void): () => void;
};
```

### host.available

```ts
available(): boolean;
```

Indica se la piattaforma ha un host che risponde alle chiamate. Sul web è `true` quando la pagina fornisce un host al player ([L'host sul web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

Chiama la funzione `name` dell'host con `args` (qualsiasi valore JSON; `null` se assente) e si risolve con ciò che restituisce. `host.call` non lancia mai eccezioni: ogni fallimento rifiuta la promise, con un `Error` il cui `code` dice cosa è successo (il messaggio è destinato alle persone e può cambiare):

| `code` | Quando |
|---|---|
| `ERR_NSH_HOST_ERROR` | La funzione dell'host è fallita, oppure l'host non ha alcuna funzione `name`; il messaggio è quello dell'host |
| `ERR_ACCESS_DENIED` | `name` non è nella [capability `host`](#capability) dell'app; `permission` è `"host"`, `resource` il nome |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | La piattaforma non ha un host: `host.available()` è `false` |
| `ETIMEDOUT` | L'host non ha risposto in tempo |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 chiamate sono già in attesa delle risposte dell'app che incorpora NSH |

Un nome non valido (da 1 a 128 caratteri tra `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`, senza `..`) rifiuta con un `TypeError`.

Una chiamata attende 30 secondi la risposta dell'host, poi rifiuta con `ETIMEDOUT`; una risposta che arriva dopo viene scartata. `options.timeout` imposta l'attesa in millisecondi, `0` per nessun limite; anche un timeout così grande che l'orologio non lo raggiunge mai (circa 1e22 ms) attende senza limite, mentre un valore negativo, `NaN` o infinito rifiuta la chiamata con un `RangeError`. Il tempo è quello dell'app, come i suoi timer: in `nsh test` con un orologio manuale si muove con l'orologio.

```ts
const user = (await host.call("getUserInfo")) as { name: string };
const quote = await host.call("quote.refresh", { symbol: "AAPL" }, { timeout: 5000 }).catch((error) => {
  if (error.code === "ETIMEDOUT" || error.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") return null;
  throw error;
});
```

### host.on

```ts
on(event: string, listener: (payload: unknown) => void): () => void;
```

Gli eventi della piattaforma chiamano `listener` con il payload di ogni `event` inviato dall'host, finché non viene chiamata la funzione restituita da `host.on`; un listener aggiunto durante il rendering di un componente si interrompe con il componente. Gli eventi inviati dall'host prima dell'avvio dell'app arrivano non appena questa si avvia, quindi i listener registrati al livello superiore dell'app li ricevono; un evento inviato prima che un listener si registri non viene riproposto a quest'ultimo. Leggi lo stato con cui l'app si avvia tramite `host.call`, e segui i suoi cambiamenti con `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
### Capability

Ogni funzione chiamata dall'app deve essere elencata in `capabilities.host` di `nsh.json`: nomi esatti o prefissi che terminano con `*`, oppure `true` per tutte. Questo vale per ogni app, anche per una senza altri `capabilities`: le funzioni dell'host non sono mai concesse per impostazione predefinita. Una chiamata non concessa viene rifiutata con `ERR_ACCESS_DENIED` e registrata nel log, un `host.post` verso un'app che incorpora con un nome di questo tipo genera lo stesso errore, e la build di un'app che importa `host` da `nsh` senza `capabilities.host` emette un avviso. Gli eventi non richiedono alcuna concessione. Vedi [Sandbox e capability](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### L'host sul web

Sul web l'host è la pagina. L'opzione `host` di `createPlayer` risponde alle chiamate e `player.hostEvent(event, payload)` invia gli eventi:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

Un'app pubblicata indica il proprio host in `nsh.json`: `web.host` è un modulo JS nella directory dell'app, relativo a `nsh.json`, che esporta `createHost(player)`, il quale restituisce l'oggetto con `call`. `nsh package --target web` lo include nel sito, `nsh run --target web` lo esegue nella pagina di sviluppo e `nsh test` lo esegue per le app aperte dai suoi test. `web.connect` elenca gli host raggiunti dalle richieste dell'host stesso, che la Content-Security-Policy della pagina consente insieme a `capabilities.network` dell'app. Vedi [Web](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

I parametri impostati dall'app che incorpora prima di avviare la tua app, letti in modo sincrono dalla prima riga del tuo codice; `{}` se non ne ha impostati. Restano invariati mentre l'app è in esecuzione: le richieste successive arrivano come eventi.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```

<a id="native-sdk-channel"></a>

### Canale del Native SDK

`send` del Native SDK conserva gli eventi finché l'app non si mette in ascolto, fino a 256. Quando l'ultimo listener si ferma durante la consegna, gli eventi rimanenti restano in attesa in ordine; gli eventi inviati durante lo spegnimento attendono la successiva app caricata. `host.post(name, data)` consegna i dati al gestore del Native SDK, il cui `isPost` distingue i post dalle chiamate.

<a id="the-embedding-apps-side"></a>

### Il lato dell'app che incorpora

Ogni vista mantiene un canale per ogni app che carica. Imposta i parametri prima del caricamento, invia eventi in qualsiasi momento da qualsiasi thread e registra i gestori per nome. Chiamate e post richiedono la concessione `capabilities.host` dell'app. I gestori rispondono una sola volta, subito o in seguito; una risposta che non arriva mai fa fallire la chiamata.

```rust tabs
// Any platform's AppView (GPUI, macOS, Windows, Linux, iOS): its HostChannel.
use serde_json::json;

let host = view.host();
let mut params = serde_json::Map::new();
params.insert("conversation".into(), json!("42"));
host.set_params(params);
// Runs on the engine thread: answer at once, or move the call and answer later from any thread.
host.handle("user.profile", |call| {
    let id = call.data()["id"].clone();
    call.resolve(json!({ "id": id, "name": "Ada" }));
});
host.send("conversation.open", json!({ "id": "43" })).unwrap();
```

```swift tabs
appView.params = ["conversation": "42"]
try appView.loadBundle(at: bundleURL)

// On the main thread; return the answer, or throw to reject the call.
appView.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"]
    return ["id": id ?? NSNull(), "name": try await profiles.name(of: id)]
}
appView.handle("analytics") { data, _ in analytics.log(data) }
appView.send("conversation.open", ["id": "43"])
```

```java tabs
nsh.setParams(Map.of("conversation", "42"));
nsh.loadAssetBundle("nsh");

// On the UI thread; answer now or later, from any thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    profiles.load(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});
nsh.send("conversation.open", Map.of("id", "43"));
```

Vedi [Embedding su iOS](../docs/ios.md#talking-to-the-app), [Embedding su Android](../docs/android.md#talking-to-the-app) e [GPUI](../docs/gpui.md).

> [!NOTE]
> Le chiamate e i post del Native SDK usano la stessa [capability `host`](../docs/sandbox-and-capabilities.md#host) delle chiamate di piattaforma. Un'app Rust raggiunge direttamente il Rust dell'app che incorpora, tramite le funzioni che registra ([`nativeModule`](#nativemodule) e import Rust).

## keymap

Il keymap associa le scorciatoie da tastiera dell'app: una sequenza di tasti come `"mod+k"` e la funzione che esegue. Il codice Rust chiama `on_key`, `on_key_with` e `key_label` da `nsh_core::prelude`; TSX importa `keymap` da `nsh`. Entrambi accettano le stesse sequenze di tasti e seguono le stesse regole.

```rust tabs
use nsh_core::prelude::*; // on_key, on_key_with, KeyOptions, key_label
```

```tsx tabs
import { keymap } from "nsh";
```

```ts
const keymap: {
  bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
  bind(bindings: Record<string, (e: { keystroke: string }) => void>, options?: KeyBindingOptions): () => void;
  label(keystroke: string): string;
};

interface KeyBindingOptions {
  when?: "always" | "notEditing";
  repeat?: boolean;
}
```

| TS | Rust |
|---|---|
| `keymap.bind(keystroke, handler)` | `on_key(keystroke, handler)` |
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when` è `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | un `on_key` per ogni sequenza di tasti |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Un binding Rust vive finché vive il componente (il proprietario) che lo ha creato; il gestore riceve la sequenza di tasti così come è scritta.

Le scorciatoie funzionano su macOS, Windows, Linux e nei browser (i tasti propri del browser, come Ctrl+T o Cmd+W, non raggiungono mai la pagina), e su iOS e Android con una tastiera fisica: quella di un iPad, di un Mac che esegue un'app per iPad, di un tablet o di un Chromebook, quella del simulatore e quella dell'emulatore. Lo stesso codice funziona ovunque; senza tastiera, nessun tasto attiva i binding.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

Esegue `handler` quando viene premuto `keystroke` e restituisce una funzione che rimuove il binding. Il gestore riceve `{ keystroke }`: la sequenza di tasti come l'hai scritta, con le sue maiuscole o minuscole. Rust: `on_key(keystroke, handler)`, il cui gestore riceve la sequenza di tasti stessa.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let open = signal(false);
    on_key("mod+k", move |_| open.set(true));
    on_key("escape", move |_| open.set(false));
    text(move || if open.get() { "Search…" } else { "Press ⌘K" })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(true));
keymap.bind("escape", () => open.set(false));

mount(() => <Text>{open() ? "Search…" : "Press ⌘K"}</Text>);
```

Passa un oggetto per associare più sequenze di tasti in una volta; la funzione restituita le rimuove tutte. In Rust, ogni sequenza di tasti è un `on_key`:

```rust tabs
on_key("mod+s", move |_| save());
on_key("mod+shift+p", move |_| open_palette());
on_key("f5", move |_| refresh());
```

```tsx tabs
const unbind = keymap.bind({
  "mod+s": save,
  "mod+shift+p": openPalette,
  f5: refresh,
});
```

Un binding creato mentre un componente viene renderizzato viene rimosso insieme al componente, quindi le scorciatoie di una schermata durano quanto la schermata:

```rust tabs
#[component]
fn Editor() -> impl IntoElement {
    on_key("mod+enter", move |_| send());
    input().multiline(true)
}
```

```tsx tabs
function Editor() {
  keymap.bind("mod+enter", send);
  return <Input multiline />;
}
```

Con il dev server, modificare un modulo rimuove i binding creati dal suo codice di primo livello prima che venga eseguito di nuovo, così l'hot reload non lascia mai scorciatoie obsolete.

### keymap.label

```ts
label(keystroke: string): string;
```

Restituisce `keystroke` come lo mostrano menu e suggerimenti dove l'app è in esecuzione: `"⇧⌘L"` su macOS e iOS (e in un browser su Mac, iPhone o iPad), `"Ctrl+Shift+L"` su Windows, Linux e altri browser, per `"mod+shift+l"`. Rust: `key_label(keystroke)`. Usalo per mostrare le scorciatoie di un'app con i tasti che funzionano:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

Genera un `TypeError` per una sequenza di tasti non valida, come fa `bind`; `key_label` e `on_key` vanno in panic con lo stesso messaggio.

<a id="keystrokes"></a>

### Sequenze di tasti

Una sequenza di tasti è composta da modificatori e un tasto uniti da `+`: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command e meno).

| Modificatore | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (anche `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (anche `command`, `meta`, `super`, `win`) | Command (⌘) | Tasto Windows | Super |
| `ctrl` (anche `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (anche `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS segue macOS (`mod` è Command) e Android segue Windows e Linux (`mod` è Ctrl, `cmd` il tasto Meta). In un browser, i tasti seguono la piattaforma su cui il browser è in esecuzione: `mod` è Command su Mac, iPhone o iPad e Ctrl altrove.

Usa `mod` per le scorciatoie proprie dell'app: è il tasto che le app di ogni piattaforma usano a tale scopo (⌘K su macOS, Ctrl+K su Windows e Linux), quindi un'unica scrittura va bene ovunque. Il tasto Windows e Super appartengono perlopiù al sistema, quindi `cmd` raramente è la scelta giusta al di fuori di macOS.

Il tasto è una lettera, una cifra o un segno di punteggiatura, scritto come il carattere che produce su una tastiera US senza Shift (`k`, `1`, `,`, `/`, `[`; `"shift+/"` per `?`, `"shift+k"` per Shift+K), oppure un nome: `plus` (il tasto `=` / `+`, scritto anche `=`), `minus` (anche `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, le frecce `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, da `f1` a `f24`. Maiuscole e minuscole non contano: `"Mod+Shift+K"` equivale a `"mod+shift+k"`, e una lettera maiuscola è lo stesso tasto, non Shift (`"mod+K"` equivale a `"mod+k"`). Lo stile minuscolo è quello consigliato e viene usato in queste pagine. `"mod-k"` e `"mod++"` sono errori i cui messaggi indicano la scrittura corretta. Le scorciatoie di menu in `nsh/desktop` accettano le stesse sequenze di tasti.

Le scorciatoie funzionano con qualsiasi layout di tastiera: con un layout cirillico o greco, `mod+k` è il tasto che digita K su un layout US, come avviene per le scorciatoie di menu.

`bind` genera un `TypeError` che indica cosa non va in una sequenza di tasti non valida (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`) e rifiuta le sequenze che il sistema riserva a sé, così un'app non può mai romperle:

| Piattaforma | Riservate |
|---|---|
| macOS, iOS | Cmd+Q (esci), Cmd+H (nascondi), Option+Cmd+H (nascondi altre), Cmd+M (riduci a icona), Ctrl+Cmd+F (schermo intero) |
| Linux, Windows, Android | Ctrl+Q (esci), Alt+F4 (chiudi), F11 (schermo intero) |
| Web | Nessuna (il browser mantiene i propri tasti) |

<a id="while-typing"></a>

### Durante la digitazione

Un input di testo con il focus della tastiera ha bisogno dei propri tasti: digitare, spostare il cursore, cancellare, e selezionare tutto, tagliare, copiare, incollare, annullare e ripristinare. Perciò, per impostazione predefinita, un binding non si attiva mentre un input di testo (o una web view) ha il focus se la sua sequenza di tasti è una di queste: tasti semplici e tasti con solo Shift oppure Option, le frecce, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, e `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`. Le altre sequenze con Command o Control, e i tasti funzione, si attivano ovunque si trovi il focus.

`when` modifica questo comportamento (Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | Si attiva |
|---|---|
| (predefinito) | Come sopra |
| `"always"` | Anche negli input di testo, prima che l'input veda il tasto |
| `"notEditing"` | Mai mentre un input di testo ha il focus |

```rust tabs
use nsh_core::keymap::When;

// Sends from the message field too.
on_key_with("mod+enter", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| send());
// Only when the user is not typing.
on_key_with("mod+e", KeyOptions { when: When::NotEditing, ..KeyOptions::default() }, move |_| archive());
```

```tsx tabs
// Sends from the message field too.
keymap.bind("mod+enter", send, { when: "always" });
// Only when the user is not typing.
keymap.bind("mod+e", archive, { when: "notEditing" });
```

Su iOS e Android, un tasto con cui un metodo di input sta componendo (scelta di un candidato, conferma) resta del metodo di input. Sul backend GPUI, un componente nativo con il focus della tastiera conta come input di testo, perché potrebbe essere un editor di testo. Vede ogni tasto per primo: un tasto che gestisce da sé non raggiunge mai i binding, e i binding che si attivano durante la modifica del testo ricevono i tasti che lascia passare.

<a id="which-binding-runs"></a>

### Quale binding viene eseguito

Un tasto che attiva un binding viene consumato: non viene digitato, il sistema non emette alcun segnale acustico e i tasti propri di NSH non lo vedono (Escape che torna indietro, Tab che sposta il focus, le frecce che scorrono). Quando più binding hanno la stessa sequenza di tasti, viene eseguito il più recente tra quelli che possono attivarsi, quindi una finestra di dialogo può associare Escape sopra il binding della schermata, e quello della schermata torna attivo quando scompare quello della finestra. I binding vengono controllati in modo nativo nel momento in cui il tasto è premuto; il gestore viene eseguito subito dopo, sul thread del motore (Rust) o sul thread JS (TSX).

Tenere premuto un tasto attiva il suo binding una sola volta, finché il tasto non viene rilasciato; con `repeat: true` si attiva di nuovo a ogni ripetizione automatica (per scorrere una lista, ad esempio):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

Le scorciatoie di menu cedono il passo a un binding con la stessa sequenza di tasti: quelle del menu dell'applicazione ([`nsh/desktop`](./nsh-desktop)) su ogni desktop e, su macOS, anche quelle dei menu integrati (Cmd+W, Cmd+C, ...). Durante lo sviluppo con `nsh run`, Cmd+R / Ctrl+R ricarica sempre l'app, anche se questa associa `mod+r`; un'app pacchettizzata può associarlo.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent e nativeModule

`nativeComponent` e `nativeModule` collegano la tua app a ciò che l'app host fornisce, per nome, a runtime. Un'app iOS o Android che incorpora NSH può registrare le proprie viste (una mappa, un grafico, un'anteprima della fotocamera) per nome; `nativeComponent` ti dà un componente tipizzato per una di esse. Poiché NSH esegue il rendering con vere viste native, un componente di questo tipo si trova nella gerarchia delle viste come qualsiasi altra vista: viene disposto da NSH, viene ritagliato e scorre insieme ai suoi genitori e si sovrappone correttamente. Un'app che incorpora NSH da Rust può anche registrare funzioni, classi e componenti Rust; `nativeModule` te li restituisce come un unico oggetto tipizzato. In entrambi i casi la tua app viene compilata con `nsh build` standard: l'host collega ciò che fornisce quando esegue l'app. Il codice Rust posiziona una vista registrata con `native(name)` da `nsh_core::prelude`, ne imposta le prop con `.prop(name, value)` (un valore JSON, oppure un signal o una closure che lo produce) oppure ne associa una a un valore animato con `.bind_prop(name, &value)`, ne ascolta gli eventi con `.on_native_event(…)` e ne chiama i comandi tramite un `ElementRef`; TSX importa `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

Vedi [Componenti nativi](../docs/native-components.md) per registrare il lato nativo, e [Embedding su iOS](../docs/ios.md) / [Embedding su Android](../docs/android.md).

### nativeComponent

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;

interface NativeComponentSpec<P, E> {
  /** Its own props: sent to the component (any JSON value), each when it changes. */
  props: readonly (keyof P & string)[];
  /** The events it emits. */
  events?: readonly (keyof E & string)[];
}
```

Restituisce un componente per il componente nativo che l'app che incorpora ha registrato come `name` (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`). Rust: `native(name)`, una vista le cui prop sono valori JSON (`.prop("text", json!(…))`) e i cui eventi arrivano come `NativeEvent { name, data }`.

- `P` è il tipo delle sue prop. Ogni prop elencata in `spec.props` viene inviata al lato nativo come JSON quando cambia; impostarla a `undefined` la rimuove.
- `E` associa i nomi degli eventi ai loro payload. Un evento `regionChange` diventa la prop del gestore `onRegionChange`.
- Il componente accetta anche ogni [prop di vista](../elements/view.md) tranne `children`: `style`, `class`, layout, accessibilità, gestori del tocco e `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### Dimensioni

Il componente viene disposto come una vista, con la dimensione indicata dal suo stile. Dove lo stile lascia una dimensione aperta, usa la dimensione riportata dal componente nativo (come un'immagine usa la propria dimensione naturale).

<a id="commands"></a>

#### Comandi

Il suo `ref` riceve un `NativeComponentRef`; `ref.command(name, args)` chiama il comando `name` del componente nativo con `args` (qualsiasi valore JSON). Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### Quando non è registrato nulla

Dove non è registrato nulla sotto `name` (un'altra app host, l'host di sviluppo, il browser), il componente esegue il rendering di una vista vuota e viene registrato un avviso una sola volta. Mantieni l'app utilizzabile anche senza di esso, oppure controlla il tuo host prima di usarlo.

<a id="example"></a>

### Esempio

Il badge qui è una vista nativa dell'app host, registrata come `embed.badge`. NSH la dispone, le invia `text` e `color`, riceve i suoi eventi `tap` e chiama il suo comando `pulse`:

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p_5()
        .gap_4()
        .child(
            native("embed.badge")
                .prop("text", json!("Tap the native badge"))
                .prop("color", json!("#8250df"))
                .element_ref(&badge)
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Tapped {}×", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, View } from "nsh";
import { nativeComponent } from "nsh";

const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", gap: 16 }}>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color="#8250df"
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
    </View>
  );
}

mount(App);
```
### nativeModule

```ts
function nativeModule<T extends object>(specifier: string): T;
```

Restituisce gli export del set che l'app ospitante ha registrato come `specifier`: i suoi moduli, classi, funzioni e componenti Rust, come un unico oggetto. Il tipo `T` lo scrive l'app stessa, quindi per costruirlo non serve sapere nulla dell'host. Il codice Rust compilato insieme al crate dell'host chiama queste funzioni come normali funzioni Rust; `nativeModule` è il modo in cui TSX le raggiunge.

```ts
import { nativeModule, signal } from "nsh";

interface TradingApi {
  quote(symbol: string): number;
  placeOrder(symbol: string, quantity: number, side: "Buy" | "Sell"): Promise<Order>;
  on(event: "change", listener: (desk: Desk) => void): () => void;
}

const { Trading } = nativeModule<{ Trading: TradingApi }>("host/trading");

const price = Trading.quote("AAPL");

const desk = signal<Desk | null>(null);
Trading.on("change", (d) => desk.set(d));
```

- Le chiamate funzionano come con l'import di un set: una normale funzione Rust restituisce subito il proprio valore, una funzione `async` restituisce una promise, e una funzione che passi è una callback che Rust può chiamare in seguito. Rust controlla ogni argomento e genera un `TypeError` se uno è errato.
- Ogni chiamata con lo stesso `specifier` restituisce lo stesso oggetto.
- Se non è registrato nulla sotto `specifier`, `nativeModule` genera un `ReferenceError` che lo indica. Chiamalo dove l'app può gestire questo caso, oppure solo nell'host per cui è stato creato.

L'host registra il set da Rust, con il `set_ui_sets` del crate della piattaforma (accanto ai set propri di NSH) prima di avviare le proprie view, oppure con `EngineConfig::ui_sets`:

```rust
use std::{cell::RefCell, rc::Rc};

use nsh_core::prelude::*;

pub struct Trading;

#[module]
impl Trading {
    /// A sample price.
    pub fn quote(symbol: String) -> Result<f64, String> { /* ... */ }

    /// Calls `listener` with the desk now and after every change
    /// (`change`, the one event), until the returned function is called
    /// or what called `on` goes.
    pub fn on(event: String, listener: Callback<Desk>, cx: CallCx<'_>) -> Result<Stop, String> {
        if event != "change" {
            return Err(format!("no Trading event `{event}`"));
        }
        let listener = Rc::new(RefCell::new(Some(listener)));
        let held = listener.clone();
        cx.start(async move {
            let mut desk = DESK.subscribe(); // a tokio watch channel the host keeps
            loop {
                let Some(listener) = held.borrow().clone() else { return };
                listener.post(desk.borrow_and_update().clone());
                if desk.changed().await.is_err() {
                    return;
                }
            }
        });
        Ok(Stop::new(move || drop(listener.take())))
    }
}

let mut trading = Registry::ui_set("host/trading");
trading.module::<Trading>();
nsh_platform_gpui::set_ui_sets(vec![nsh_base::registry(), trading]);
```

`on` è il modo in cui l'host mantiene ogni app allineata ai propri dati: il task che avvia attende le modifiche dell'host e invia ciascuna all'app, così una modifica fatta dall'host, o da una qualunque app tramite un'altra funzione, raggiunge ogni app in ascolto. Il `Stop` che restituisce è la funzione che `Trading.on` restituisce in TSX: viene eseguita una sola volta, quando l'app la chiama o quando termina ciò che ha chiamato `on` (un componente, oppure l'esecuzione del modulo con l'hot reload), e qui rimuove il listener, quindi il task termina.

> [!NOTE]
> Props, eventi e argomenti dei comandi passano al lato nativo come JSON. I componenti e le funzioni registrati sono codice dell'app ospitante: i [limiti e le capacità della sandbox](../docs/sandbox-and-capabilities.md) di NSH non si applicano a ciò che fanno.

## Accessibility

L'API di accessibilità legge le impostazioni di accessibilità dell'utente (se è attivo uno screen reader, se ha chiesto meno movimento) e dialoga con lo screen reader. Il codice Rust chiama `screen_reader()`, `reduce_motion()` e `announce_for_accessibility()` da `nsh_core::prelude` e sposta il focus con un `ElementRef`; TSX importa `screenReaderEnabled()`, `reduceMotion()`, `announce()` e `setAccessibilityFocus()` da `nsh`. Le impostazioni sono reattive: leggile in un binding, in `computed` o in `effect`, e ciò che le legge si aggiorna quando l'utente le modifica. Le props di accessibilità degli elementi (`accessibilityLabel`, `role`, ...) sono documentate in [Elements](../elements/index.md); la guida è [Accessibility](../docs/accessibility.md).

```rust tabs
use nsh_core::prelude::*; // screen_reader, reduce_motion, announce_for_accessibility, element_ref
```

```tsx tabs
import { announce, reduceMotion, screenReaderEnabled, setAccessibilityFocus } from "nsh";
```

### screenReaderEnabled

```ts
const screenReaderEnabled: Accessor<boolean>;
```

Indica se uno screen reader (VoiceOver, TalkBack) è in esecuzione. Reattivo: ciò che lo legge si aggiorna quando l'utente attiva o disattiva lo screen reader. Rust: `screen_reader() -> bool`, reattivo allo stesso modo.

```rust tabs
when(move || !screen_reader(), || text("Swipe for the next photo"))
    .otherwise(move || text("Next photo").on_press(next))
```

```tsx tabs
<If when={!screenReaderEnabled()} else={<Text onPress={next}>Next photo</Text>}>
  <Text>Swipe for the next photo</Text>
</If>
```

### reduceMotion

```ts
const reduceMotion: Accessor<boolean>;
```

Indica se l'utente ha chiesto meno movimento (Reduce Motion su iOS, Remove animations su Android). Reattivo. Rust: `reduce_motion() -> bool`. Anche le classi Tailwind lo seguono, con la variante `motion-reduce:`.

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        let _ = panel.spring(0.0, Spring::default());
    }
};
```

```tsx tabs
const open = () => {
  if (reduceMotion()) panel.set(0);
  else panel.spring(0);
};
```

### announce

```ts
function announce(message: string): void;
```

Lo screen reader legge `message` (un annuncio di VoiceOver, TalkBack). Usalo per i risultati che compaiono senza che il focus si sposti, come "Salvato". Rust: `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Sposta il focus dello screen reader su `node` (il `ref` di un elemento). Rust: `ElementRef::set_accessibility_focus()`.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Saved() -> impl IntoElement {
    let note = element_ref();
    let save = move || {
        announce_for_accessibility("Saved");
        note.set_accessibility_focus();
    };
    // Runs again when the setting changes, until the component goes.
    effect(|| log::info!("screen reader {}", screen_reader()));
    view()
        .gap_2()
        .child(text("Save").role(AccessibilityRole::Button).on_press(save))
        .child(text("Your changes are kept on this device.").element_ref(&note))
}
```

```tsx tabs
import { effect, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Saved() {
  let note!: ViewRef;
  const save = () => {
    announce("Saved");
    setAccessibilityFocus(note);
  };
  // Runs again when the setting changes, until the component goes.
  effect(() => console.log("screen reader", screenReaderEnabled()));
  return (
    <View style={{ gap: 8 }}>
      <Text onPress={save} role="button">Save</Text>
      <Text ref={note}>Your changes are kept on this device.</Text>
    </View>
  );
}
```

## Types

`nsh` esporta anche i tipi dell'API reattiva e degli elementi host. I più usati:

| Tipo | Cos'è |
|---|---|
| `Accessor<T>` | Un valore leggibile: `() => T` |
| `Signal<T>` | Un `Accessor<T>` con `set` e `update` |
| `SignalOptions<T>` | Opzioni di `signal` e `computed` (`equals`) |
| `Context<T>` | Ciò che restituisce `context` |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | Il namespace JSX (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | Ciò che riceve un `ref`, il tipo specifico di ciascun elemento (`ViewRef` e i tipi che vi si basano): focus, scroll e altri comandi. `ViewRef` è anche ciò che è un elemento (`JSX.Element`). Vedi [i metodi dei ref](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | Props degli elementi host |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Oggetti di stile; vedi il [riferimento degli stili](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | Valori all'interno degli stili |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Payload degli eventi |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | Le strutture di cui sono fatti payload e props, con i campi di GPUI (`nsh_core::geometry`) |
| `PixelSize` | La dimensione propria di un'immagine o di un video in pixel (`onLoad`, `Image.getSize`, le immagini degli appunti e del selettore), dove `Size` è in punti |
| `ImageAsset` | Ciò che si ottiene importando un file immagine (`{ url, size: Size, scales? }`; `scales` elenca le sue [varianti per densità di pixel](../docs/images-and-assets.md#pixel-densities)) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Props di accessibilità |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` accetta uno stile o un elenco di stili uniti da sinistra a destra, ignorando i valori falsy:

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
