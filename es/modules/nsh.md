---
title: "nsh"
description: "El módulo principal: señales, efectos, contexto, montaje, tokens de diseño, animación, el entorno, gestos, el portapapeles, almacenamiento, el canal del host, atajos de teclado, accesibilidad y los tipos de elemento y de estilo."
order: 2
source_hash: 0264c3f02c420628
---


# nsh

`nsh` es el módulo principal: la API reactiva (signals, valores computed, effects, context), `mount`, `token`, los elementos host `View`, `Text`, `Scroll` y `Overlay`, las [vistas seleccionables](#selectable-views), [el área segura y el teclado](#safe-area-and-keyboard), la [animación](#animation), [el dispositivo y su entorno](#device), [`PanResponder`](#panresponder), el [portapapeles](#clipboard), el [selector de fotos](#picker), el [reconocimiento de voz](#speech), el [almacenamiento](#storage), el [canal del host](#host), los [atajos de teclado](#keymap), los [componentes y módulos nativos](#nativecomponent-and-nativemodule), la [accesibilidad](#accessibility) y los tipos de TypeScript de elementos, estilos y eventos. El grafo reactivo se ejecuta de forma nativa en Rust; leer un signal es una llamada al runtime que cuesta unos pocos nanosegundos, y solo tus propias closures se ejecutan en el intérprete de JavaScript.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

La reactividad de NSH sigue el mismo modelo que SolidJS: una función de componente se ejecuta **una sola vez**, y las partes de la UI que leen signals se actualizan en su sitio cuando esos signals cambian. No hay un nuevo renderizado del componente ni DOM virtual. Consulta [Reactividad](../docs/reactivity.md) para ver la guía.

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

Un signal guarda un valor. Llamarlo lee el valor y, dentro de un ámbito de seguimiento (expresiones JSX, `computed`, `effect`), suscribe ese ámbito al signal. `set` y `update` lo escriben; todo lo que lo leyó se actualiza.

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

Por defecto, una escritura que sea `===` al valor actual no hace nada. Pasa `equals: false` para notificar en cada escritura (útil cuando modificas un objeto en su sitio y vuelves a asignar el mismo objeto), o tu propia comparación:

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

Un valor derivado de signals. `fn` se ejecuta de nuevo cuando cambia un signal que leyó; los lectores del valor computed solo se actualizan cuando cambia su resultado (según `equals`, `===` por defecto). `fn` recibe el resultado anterior.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

Usa `computed` cuando una derivación sea costosa o se lea en varios lugares. Para una expresión barata, una función simple (`const full = () => first() + " " + last()`) es igual de reactiva.

## effect

```ts
function effect(fn: () => void): void;
```

Ejecuta `fn` después del renderizado, y de nuevo cada vez que cambia un signal que leyó. Usa los effects para efectos secundarios: logging, temporizadores, comunicación con módulos nativos. Un effect pertenece al componente (o effect) en el que se creó y se elimina junto con él.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Para deshacer algo antes de que el effect se ejecute de nuevo (o cuando su componente desaparece), llama a [`cleanup`](#cleanup) dentro de él.

## batch

```ts
function batch<T>(fn: () => T): T;
```

Ejecuta `fn` y aplica todas sus escrituras juntas al final, de modo que los lectores se actualizan una vez en lugar de una vez por escritura. Devuelve lo que devuelve `fn`.

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

Ejecuta `fn` sin suscribir el ámbito actual a lo que lee. Úsalo para leer un signal dentro de un effect o de una expresión JSX sin depender de él.

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

Registra `fn` para que se ejecute antes de que el effect actual se ejecute de nuevo, o cuando el componente o effect actual desaparece.

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

Un valor que un componente proporciona a todo lo que renderiza, sin importar la profundidad. Llamar al context (`Theme()`) lee el valor del proveedor más cercano, o `defaultValue` si no hay ninguno.

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

Renderiza `app` en la superficie (la ventana, o el `NshAppView` / `NshView` en el que está incrustada la app) y devuelve una función que lo elimina. El archivo de entrada de toda app termina con `mount(App)`.

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

Divide un objeto de props en las props nombradas en `keys` y el resto. Ambas mitades siguen siendo reactivas: las props cuyos valores cambian son getters, y `split` las mantiene como getters. Úsalo en un componente que gestiona algunas props por sí mismo y pasa las demás. Desestructurar las props (`const { label } = props`) las leería una sola vez y perdería las actualizaciones.

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

Renderiza sus hijos, o `fallback` cuando algo debajo de ellos lanza un error: el cuerpo de un componente, un binding, un effect o un manejador de eventos. La parte que falló se elimina y el fallback se muestra en su lugar. Una función `fallback` se llama como `fallback(error, reset)` con el valor lanzado y `reset`, que vuelve a renderizar los hijos, sea cual sea el número de parámetros que declare; un elemento `fallback` se muestra tal cual. Un fallo va al boundary más cercano por encima, y uno en un fallback va al boundary que está por encima de este. Los componentes de Rust usan `catch_error` ([Error boundaries](../docs/reactivity.md#error-boundaries)).

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

El design token `name` del tema de la app (`"theme"` en `nsh.json`, sobre los tokens de shadcn/ui) en la apariencia mostrada:
un color como `#rrggbbaa`, una longitud como un número de puntos, una fuente como el nombre de su familia. Los nombres son las variables CSS del tema
sin `--` (`primary`, `muted-foreground`, `radius`, `font-mono`, y los propios de la app, como `up`). Leerlo es
reactivo: un componente, memo o effect que lee un token se ejecuta de nuevo cuando cambia el tema o la apariencia.
`Tokens` lista los tokens de la app con sus tipos; NSH lo escribe en `.nsh/types/nsh/tokens.d.ts` a partir del tema. Para
las clases, nombra los tokens directamente (`bg-primary`, `rounded-(--radius)`): [Tokens del tema](../docs/tailwind.md#theme-tokens).

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

Los elementos host que exporta `nsh`, escritos como etiquetas: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (sus
hijos encima de la ventana, colocados respecto a un ancla: [Overlay](../elements/overlay.md)). El compilador crea la
vista nativa en su sitio para una etiqueta que nombra a uno de ellos mediante su import (también con alias), de modo que importarlos no cuesta
nada en tiempo de ejecución. Son componentes como cualquier otro, así que también se pueden pasar como valores (`const Tag = inline ? Text : View`).
`nsh` exporta las demás primitivas del mismo modo: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) y [`Video`](./nsh-video.md), cada una con su propia página de
referencia. Sus props están documentadas en [Elementos](../elements/index.md). El campo de entrada de texto, `Input`, proviene de
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## Área segura y teclado

Las variables de entorno de CSS mantienen el contenido despejado de la UI del sistema, en el padding y el margin de cualquier vista
(`padding`, `paddingTop`, ..., las mismas claves de `margin`; los valores arbitrarios `p*` / `m*` de Tailwind; los métodos `Styled`
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ... en Rust). Sus valores son `EnvValue`s:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` y `calc(<length> + env(name))`.

| Variable | Valor |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | Los insets de la vista raíz en la que se renderiza el nodo: los de la página más cercana (debajo de su cabecera), los del diálogo más cercano o, si no, el área segura de la superficie. Consulta [Área segura](../elements/safe-area.md). |
| `keyboard-inset-height` | La altura del teclado de software sobre la superficie, 0 mientras está oculto; los cambios se animan de forma nativa junto con el teclado. Consulta [Teclado](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

### safeArea and safeAreaInsets

`safeArea()` es el área segura de la superficie (`safe_area()` en Rust); `safeAreaInsets()` son los insets del lugar donde se
renderiza un componente (`cx.insets()` en Rust), los valores de las variables `safe-area-inset-*`. Ambos son `Edges`
reactivos (`{ top, right, bottom, left }` en puntos). Consulta
[safeArea y safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

### Keyboard and keyboardFrame

`Keyboard.dismiss()` oculta el teclado de software (`dismiss_keyboard()` en Rust) y `keyboardFrame()` te dice cuánto
de la pantalla cubre (`keyboard_height()` y `keyboard_duration()` en Rust). Consulta
[Ocultar el teclado](../elements/keyboard.md#hiding-the-keyboard) y
[La altura del teclado](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## Vistas seleccionables

`<View selectable>` (`view().selectable(true)` en Rust) hace que los textos que contiene se seleccionen juntos, como los
de una página web: una sola selección recorre vistas, elementos `Text` y `TextView`s, en orden de lectura. Consulta
[Selección de texto](../elements/text-selection.md).

<a id="animation"></a>

## Animación

La API de animación anima en el hilo de la UI. Creas un **valor animado**, lo enlazas (o enlazas valores derivados de él) a una propiedad de estilo e inicias una animación; a partir de ahí cada fotograma se calcula de forma nativa, sin ejecutar el código de la app. Un motor o un hilo de JS ocupado no puede hacer que la animación se entrecorte, y una animación no le cuesta a la app trabajo por fotograma. El código Rust usa `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` y `Easing` de `nsh_core::prelude` y enlaza valores con los métodos `.bind_*` de los elementos; TSX los importa de `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

Consulta [Animación](../docs/animation.md) para ver la guía.

<a id="what-an-animated-value-can-drive"></a>

### Qué puede controlar un valor animado

| Dónde | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | Lo mismo: un nodo de colores. `borderColor` colorea todos los lados; el `color` de un `Text` colorea todo el texto |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (grados) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` pasos: `transform: [{ translateX: value }]` |
| Posición de scroll | `.scroll_value(&value)` en una vista de scroll o una lista | `<Scroll scrollValue={value}>` y `<List scrollValue={value}>` escriben en él el desplazamiento del scroll en cada fotograma |
| Gestos | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}` en cualquier elemento: el gesto escribe los valores directamente (consulta [Toque y gestos](../docs/touch-and-gestures.md)) |
| Dónde se fijan las vistas | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` en una vista de scroll horizontal), `.bind_sticky_header_offset(&value)` en una lista | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: las vistas y cabeceras sticky se fijan a esa distancia del inicio del viewport, siguiendo el valor en cada fotograma |
| Canvas | un argumento animado de una llamada de un painter | Cualquier argumento numérico o de color de una llamada de dibujo de [canvas](./nsh-canvas.md) |
| Shader | `.uniform(name, &value)` | Un miembro de `struct Uniforms` de un [shader](../elements/shader.md): `uniforms={{ name: value }}` (números, o un nodo de colores para un `vec3f` / `vec4f`) |

Las demás propiedades de estilo aceptan valores simples; para animar el propio layout (tamaños, posiciones en el flujo), usa [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

Crea un valor animado que empieza en `value` (por defecto `0`). Rust: `animated_value(value)`, un handle `Copy` que conserva el componente que lo creó.

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
> Un valor animado vive en el hilo de la UI y cambia allí en cada fotograma, por lo que la app lo lee de forma asíncrona: `await value.getValue()` (o el `{ value }` con el que se resuelve `stop()`) da el valor en ese momento, y en Rust `value.value().await` en una task. Conserva el destino en una variable o en un signal cuando tu código lo necesite de inmediato, como arriba. Los eventos de gesto informan de los valores al terminar (`PanEvent.value`).

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

| Método | Rust | Descripción |
|---|---|---|
| `set(value)` | `set(value)` | Salta a `value`, deteniendo cualquier animación en curso. |
| `stop()` | `stop()`, luego `value().await` | Detiene la animación en curso donde esté; se resuelve con `{ value }`, el valor en ese punto. |
| `getValue()` | `value().await` | Se resuelve con el valor actual (con su offset), leído en el hilo de la UI. |
| `setOffset(offset)` | `set_offset(offset)` | Un offset que se suma al valor: los bindings ven valor + offset; `set`, las animaciones y los arrastres mueven el valor. |
| `flattenOffset()` | `flatten_offset()` | Suma el offset al valor y lo deja en 0. |
| `extractOffset()` | `extract_offset()` | Mueve el valor al offset y deja el valor en 0 (un arrastre posterior empieza desde donde terminó el último). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | Anima hasta `to` siguiendo una curva de easing. `duration` en ms (por defecto 300), `easing` (por defecto `"easeInOut"`), `delay` en ms (por defecto 0). |
| `spring(to, options)` | `spring(to, Spring { … })` | Se mueve con un resorte hasta `to`. `stiffness` (por defecto 170), `damping` (por defecto 26), `mass` (por defecto 1), `velocity` (velocidad inicial, unidades por segundo). |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Avanza por inercia desde `velocity` (unidades por segundo) y se frena en `deceleration` por milisegundo (por defecto 0.998). Úsalo después de un fling, con la velocidad de `onPanEnd`. Con `clamp: [min, max]` se detiene en un límite, o rebota desde él conservando `bounce` (0..1, por defecto 0) de su velocidad. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | Reproduce [keyframes](#keyframes) como se reproducen los keyframes de CSS: un easing por segmento, `iterations` veces en `direction`. |

Cada método de animación devuelve una promesa que se resuelve con `{ finished }`: `true` cuando la animación terminó, `false` cuando se detuvo (por `stop`, `set` u otra animación del mismo valor). En Rust devuelve un `AnimationEnd`, que una task espera para obtener el mismo `bool`.

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

Un nodo del grafo de animación nativo: un `AnimatedValue`, o un valor derivado de otros. Los nodos derivados se evalúan en el hilo de la UI cada vez que cambian sus entradas.

| Método | Rust | Descripción |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Mapea la entrada mediante rangos por tramos. `outputRange` contiene números, colores (`"#ff0000"`, `"rgba(…)"`) o ángulos (`"45deg"`, `"1rad"`). Fuera de `inputRange` se limita por defecto; `extrapolate` (o `extrapolateLeft` / `extrapolateRight`) puede ser `"extend"` (continuar la recta), `"clamp"` o `"identity"` (pasar la entrada tal cual). `easing` da forma a cada segmento. Rust acepta números, colores del tema (que siguen la apariencia) y ángulos en grados para `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Sigue los cambios de la entrada pero mantiene el resultado dentro de `min..max`: una cabecera que se oculta mientras el contenido se desplaza hacia arriba y vuelve en cuanto se desplaza hacia abajo. `snap: true` la lleva al límite más cercano en 200 ms cuando su vista de scroll se detiene, en `max` solo una vez que la entrada alcanzó `max`. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | Aritmética con otro nodo o una constante. |
| `mod(b)` | `modulo(b)` | Módulo, nunca negativo para un `b` positivo (mantiene los ángulos en 0..360). |

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

`value.keyframes(frames, options)` reproduce un valor a través de keyframes y se resuelve con `{ finished }`, que indica si terminaron; `Animated.keyframes(value, { keyframes, ...options })` equivale a un paso de una composición. Rust: `value.keyframes(frames, KeyframeTiming)` y `Animation::keyframes(&value, frames, KeyframeTiming)`, con `Keyframe::new(value)` (repartidos uniformemente), `Keyframe::at(offset, value)` y `.ease(easing)`, y `KeyframeTiming::new(ms)` con `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` y `.direction(PlaybackDirection::…)`.

Se reproducen igual que los keyframes de CSS: un easing da forma a un segmento (el de un keyframe es el segmento que empieza en él; el del timing, todos los demás); los offsets que faltan en los keyframes se reparten uniformemente, el primero en 0 y el último en 1; cada iteración empieza con un salto a su primer keyframe, y sin un keyframe en 0 el valor parte de donde está; durante un `delay` el valor mantiene el primer keyframe (CSS `animation-fill-mode: backwards`); las iteraciones hacia atrás recorren los segmentos al revés con sus curvas invertidas; el valor se queda donde lo deja la última iteración.

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

Crea un motion: un valor animado para cada canal de la opacidad y la transformación de una vista, en reposo (opacidad y escalas a 1, los demás a 0), y motions para reproducir sobre ellos de forma nativa. Enlázalo con `style={motion.style}`, o expande `motion.style` o `motion.transform` en un estilo; la transformación aplica sus traslaciones, luego sus rotaciones y después sus escalas, con `scale` integrado en `scaleX` y `scaleY`: 7 de los 8 pasos de transformación de una vista, lo que deja uno para el tuyo (`[{ perspective: 600 }, ...motion.transform]` para giros 3D). `initial` establece dónde empiezan los canales (`{ opacity: 0 }`; los demás empiezan en reposo). Con `enter`, los canales que mueve empiezan donde empieza ese motion (durante `initial`) y se reproduce de inmediato, con las demás opciones como su timing (`delay`, `duration`, ...). Un motion solo mueve la opacidad y la transformación: expandir `motion.style` establece el `opacity` de la vista, así que enlaza solo `motion.transform` para conservar una opacidad propia, y mueve los colores con un valor animado y `interpolate`. Rust: `motion()`, un handle `Copy` que conserva el componente que lo creó, enlazado con `.bind_motion(&m)`; `motion().entering(spec)` entra.

| Miembro | Rust (`Motion`) | Descripción |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | Los valores animados de los canales. |
| `style`, `transform` | `.bind_motion(&m)` en el elemento | Los enlaces. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | Reproduce un preset por nombre o un [`MotionSpec`](#motions) sobre los canales; uno nuevo interrumpe al que se está reproduciendo. `options` cambian su timing. Se resuelve con `{ finished }`: `true` cuando terminó, `false` cuando algo lo detuvo (`AnimationEnd` en Rust). |
| `animation(motion, options?)` | `animation(spec)` | El mismo motion como un [`CompositeAnimation`](#animated), sin iniciar, para componer: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). El movimiento reducido se decide al crearlo. |
| `stop()` | `stop()` | Lo detiene donde está. |
| `reset()` | `reset()` | Lo detiene y devuelve cada canal al reposo. |

Cuando el usuario pide menos movimiento (`reduceMotion()`), `play`, `animation` y `enter` llegan de inmediato a donde termina el motion, sin moverse, salvo que `ignoreReduceMotion` esté activado (en las opciones o en el motion).

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

Los motions prediseñados como datos: `motion.play("shake")` reproduce `motions.shake`. `MotionName` es uno de `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (entrada); `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (salida); `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (atención); `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (bucle). [Animation](../docs/animation.md#presets) describe cada uno. Expande un preset para modificarlo: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

Un `MotionSpec` es un motion propio: los keyframes de cada canal (`{ opacity: [0, 1], translateY: [24, 0] }`), o una lista de frames tal como los escribe la Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, un frame sin offset se coloca según su posición en la lista), con el [timing de los keyframes](#keyframes). Rust: `MotionSpec::new(KeyframeTiming)` con `.values(channel, values)` (repartidos uniformemente), `.track(channel, keyframes)` y `.timing(|t| …)`; `MotionPreset::FadeInUp` (o `.spec()`) es un preset, y `MotionChannel` nombra los canales.

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

`Animated` construye animaciones a partir de pasos (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...). No se ejecuta nada hasta `start()`; entonces todo el árbol se ejecuta de forma nativa, y cada paso empieza en el hilo de la UI en el momento exacto en que termina el anterior (sin hueco entre frames y sin ida y vuelta al código de la app entre pasos). Rust construye el mismo árbol con `Animation`.

| Función | Rust | Descripción |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | Una animación de un valor; mismas opciones y valores por defecto que los métodos de [`AnimatedValue`](#animatedvalue), con el destino como `toValue`. |
| `sequence(list)` | `Animation::sequence(list)` | Ejecuta las animaciones una tras otra. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | Las ejecuta al mismo tiempo. Con `stopTogether` (por defecto `true`), detener una las detiene todas. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Las ejecuta en paralelo, cada una empezando `ms` después de la anterior, contando desde `from`: `"first"` (por defecto), `"last"`, `"center"` (la del medio empieza de inmediato y las demás se escalonan a partir de ella; con un número par de elementos, los dos del medio empiezan de inmediato) o un índice (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Un valor a través de [keyframes](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | Espera; útil dentro de `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | Repite `animation` `iterations` veces (indefinidamente por defecto), devolviendo sus valores a su estado inicial antes de cada ejecución salvo que `resetBeforeIteration` sea `false`. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | los métodos del nodo | Lo mismo que los métodos de [`AnimatedNode`](#animatednode), como funciones. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | Los valores de un spring o de un decay, uno por frame (véase [Easing](#easing)). |

`CompositeAnimation`:

| Método | Rust (`Animation`) | Descripción |
|---|---|---|
| `start(callback?)` | `start()`, un `AnimationEnd` para esperar con await | Lo ejecuta (de nuevo). Se resuelve, y llama a `callback`, una sola vez para todo el árbol con `{ finished }`: si terminó en lugar de haber sido detenido. |
| `stop()` | `stop()` | Lo detiene donde está. |
| `reset()` | `reset()` | Lo detiene y devuelve sus valores a donde estaban cuando empezó. |

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

Un easing es un dato, no una función de la app: el runtime lo evalúa de forma nativa. En Rust es el enum `Easing`: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` y `Curve(curve, mode)`, con un `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) y un `EaseMode` (`In`, `Out`, `InOut`). Para dibujar uno, `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) da sus valores en `count` puntos equidistantes de 0 a 1; `Animated.sampleSpring` y `Animated.sampleDecay` (`sample_spring`, `sample_decay`) dan los valores de un spring o de un decay, uno por frame (a `fps`, 60 por defecto) desde `from` (0) hasta que termina. Los tres provienen del código nativo con el que se ejecutan las animaciones. En cualquier lugar donde TSX acepte un `Easing` puedes pasar un nombre (`"easeOut"`), una curva Bézier cúbica como cuatro números, o una curva del objeto `Easing`.

| Curva | Rust | Forma |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` vale 2 por defecto) |
| `sin` | `Curve::Sin` | Sinusoidal |
| `circle` | `Curve::Circle` | Circular |
| `exp` | `Curve::Exp` | Exponencial |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Rebote elástico con sobrepaso (`bounciness` vale 1 por defecto) |
| `back(s)` | `Curve::Back(s)` | Retrocede antes de avanzar; `s` es el sobrepaso (1.70158 por defecto) |
| `bounce` | `Curve::Bounce` | Rebota al final |

`Easing.steps(count, position)` es el `steps()` de CSS: el valor salta entre `count` niveles en lugar de moverse (un sprite fotograma a fotograma, una aguja que marca los segundos). `position` indica dónde caen los saltos: `"jump-end"` (el valor por defecto, también `"end"`), `"jump-start"` (`"start"`), `"jump-none"` o `"jump-both"`; Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

Las curvas están en su forma «in» (lentas al principio). `Easing.out(curve)` invierte una, `Easing.inOut(curve)` la hace simétrica, `Easing.in(curve)` la deja tal cual; en Rust eso es el `EaseMode` de `Easing::Curve`.

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

`LayoutAnimation.configureNext(config)` anima de forma nativa los cambios de layout del siguiente commit: las vistas que se mueven o cambian de tamaño se deslizan hasta sus nuevos frames, las vistas nuevas aparecen (con fundido o escala de entrada, según `property`) y las vistas eliminadas desaparecen. Llámalo justo antes del cambio de estado que modifica el layout. Rust: `animate_layout(LayoutAnimation)`, con los presets de `nsh_core::element::LayoutAnimation` o sus transiciones `create`, `update` y `delete`.

| Miembro | Rust | Descripción |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anima los cambios del siguiente commit; `onEnd` se ejecuta al terminar. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | Una configuración que usa la misma curva en las tres fases. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, vistas que aparecen y desaparecen con fundido. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms a velocidad constante. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms; los frames se mueven con efecto spring (damping 0.4), las vistas se desvanecen linealmente. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | Atajos para `configureNext(Presets.…)`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Los nombres, como constantes. |

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

La API de device informa a la app sobre el dispositivo y su entorno. El código Rust llama a las funciones de `nsh_core::prelude` (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...); TSX las importa desde `nsh`. El tamaño de la ventana, el esquema de color, la escala de fuente, la proporción de píxeles, el locale y el estado de la app son reactivos: léelos en un binding (un closure que se pasa a un elemento en Rust, JSX en TSX), `computed` o `effect`, y lo que los lee se actualiza cuando la plataforma informa de un cambio (rotación, redimensionar la ventana, pasar al modo oscuro, cambiar el tamaño del texto o el idioma, moverse a una pantalla de otra densidad, salir de la app y volver).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

Consulta [Dispositivo y entorno](../docs/device-and-environment.md) para ver la guía.

### windowSize

```ts
const windowSize: Accessor<Size>;
```

El tamaño de la superficie en puntos: la ventana, o el `NshAppView` / `NshView` embebido. Reactivo. Rust: `window() -> Size<Points>`.

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

La apariencia que se muestra: la del sistema, salvo que la app establezca la suya (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). Reactivo. Rust: `dark() -> bool`; los colores del tema (`AdaptiveColor`) y la variante de estilo `.dark(…)` la siguen sin necesidad de leerla. La variante `dark:` de Tailwind también la sigue (véase [Tailwind](../docs/tailwind.md)).

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

El tamaño de texto preferido del usuario relativo al predeterminado (`1` es el tamaño predeterminado; Dynamic Type en iOS, tamaño de fuente en Android), o el tamaño de texto que establece en su lugar la app anfitriona. Reactivo. Rust: `font_scale() -> f32`. El texto ya escala con él salvo que `allowFontScaling={false}`; léelo cuando otros tamaños deban seguirlo, como los iconos junto al texto.

### locale

```ts
const locale: Accessor<string>;
```

El locale del usuario como etiqueta BCP 47 (`"en-US"`, `"zh-Hans-CN"`), o el locale que establece en su lugar la app anfitriona. Reactivo. Rust: `locale() -> Locale` (`locale().as_str()` es la etiqueta). `Intl` formatea según él por defecto; léelo para elegir las cadenas de tus propias traducciones ([Dispositivo y entorno](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

Indica si la app está en uso, en los términos de `AppState` de React Native: `"active"` en primer plano y recibiendo entrada, `"inactive"` mientras es visible sin el foco (otra app o ventana lo tiene, o el sistema muestra algo encima, como el selector de apps o una llamada entrante), `"background"` mientras no es visible (en segundo plano, minimizada, una pestaña del navegador oculta). Una app mostrada dentro de una app nativa sigue el estado de esa app. Reactivo. Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`).

Léelo en un efecto para pausar el trabajo que nadie ve y reanudarlo cuando la app vuelva:

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

Muestra la app en `scheme` sea cual sea la apariencia del sistema, de inmediato: `colorScheme()`, las clases `dark:`, el tema de los componentes y los controles de la plataforma (alertas, el estilo predeterminado de la barra de estado) la siguen; `"system"` vuelve a seguir al sistema. `nsh.json` `"appearance"` lo establece desde el inicio. Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`).
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

La plataforma en la que se ejecuta la app, constante mientras se ejecuta.

| Miembro | Rust | Descripción |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` es la cadena de TS) | El sistema operativo. iOS, el simulador de iOS y Mac Catalyst informan `"ios"`; los navegadores, `"web"`. |
| `version` | `os_version() -> (u16, u16)` | iOS y escritorio: la versión del SO (`"17.5"`); Android: el nivel de API (`"35"`); la web: `"0.0"`. Rust da la versión mayor y menor, o el nivel de API y 0 en Android. |
| `idiom` | `idiom() -> Idiom` | El tipo de dispositivo: `"desktop"` exactamente donde `desktop` es `true`; en el resto, `"phone"`, `"pad"` (un iPad, una tableta Android, Mac Catalyst en el idioma iPad), `"mac"` (Mac Catalyst en el idioma Mac de UIKit, un idioma móvil) o `"tv"` (Apple TV, Android TV). |
| `desktop` | `is_desktop() -> bool` | Se aplica el comportamiento de escritorio: macOS, Windows, Linux y navegadores con ratón y una ventana ancha. Las props `desktop={{…}}`, `select({ desktop })` y `idiom` `"desktop"` lo siguen. Mac Catalyst ejecuta el backend de iOS, por lo que es móvil: allí se aplican las props `ios={{…}}`. El `isAvailable` de [`nsh/desktop`](./nsh-desktop.md#isavailable) es la comprobación más estrecha para sus APIs de ventana y menú, que tienen macOS, Windows y Linux. |
| `catalyst` | `is_catalyst() -> bool` | La app se ejecuta bajo Mac Catalyst, en el idioma Mac o iPad (`os` es `"ios"`). |
| `select(spec)` | `match os() { … }` | El valor para esta plataforma (véase más abajo). |

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

Devuelve el valor para el SO actual (`ios`, `android`, `web`, ...); si no, `desktop` o `mobile` (según `platform.desktop`); si no, `native` (todas las plataformas excepto la web); si no, `default`; si no, `undefined`. El código Rust hace match sobre `os()` (y `is_desktop()` para `mobile` / `desktop`).

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
> Para las props que solo tiene una plataforma, es preferible usar las props `ios={{…}}` / `android={{…}}` de los elementos y componentes TSX en lugar de ramificar con `platform` (véase [Código específico de plataforma](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

Píxeles de dispositivo por punto (p. ej. `3` en la mayoría de los iPhone). Reactivo: cambia cuando la ventana se mueve a una pantalla de otra densidad (en Mac Catalyst, los escritorios o una pantalla externa) y cuando el ajuste de tamaño de pantalla de Android cambia la densidad. Rust: `pixel_ratio() -> f32`, y `round_to_nearest_pixel(points)` para una longitud en píxeles de dispositivo enteros; en TSX esa longitud es `Math.round(x * pixelRatio()) / pixelRatio()`.

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

Abre `url` fuera de la app: una página web en el navegador, un enlace `mailto:` en la app de correo, un enlace `tel:` en la app de teléfono, y cualquier esquema que otra app haya registrado (`maps:`, los enlaces `lb://` propios de una app anfitriona). Se resuelve con `{ opened }`, que indica si algo lo abrió: `false` cuando ninguna app gestiona el esquema. Rust: `open_url(url)` de `nsh_core::prelude`, una respuesta que se espera con await en una tarea (o que se descarta), el mismo `bool`.

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

- La URL es absoluta (tiene un esquema). Las URL que ejecutarían código o accederían a los datos propios de la app, `javascript:`, `data:`, `blob:`, `file:`, `about:` y `asset:`, rechazan la promesa con un `TypeError`, igual que las direcciones relativas. `openUrl` nunca lanza una excepción: todo fallo se rechaza.
- Una app que declara capacidades necesita `openUrl`: `"openUrl": true` para todos los esquemas, o `"openUrl": { "schemes": ["https", "mailto"] }` para los indicados; las demás URL se rechazan con un `Error` cuyo `code` es `"ERR_ACCESS_DENIED"`, `permission` `"openUrl"` y `resource` la URL (véase [Sandbox y capacidades](../docs/sandbox-and-capabilities.md)). En Rust, `open_url` responde `false` en esos casos y registra el motivo.
- La app anfitriona ve la URL primero y puede enrutarla por su propio router en su lugar (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; véanse [iOS](../docs/ios.md#links-the-app-opens) y [Android](../docs/android.md#links-the-app-opens)). En ese caso `opened` es `true`.
- Cada plataforma la abre con su propio mecanismo: `UIApplication.open` en iOS (la aplicación de la app anfitriona cuando está incrustada), un intent `ACTION_VIEW` en Android, `NSWorkspace` en macOS, `ShellExecuteW` en Windows, `GtkUriLauncher` en Linux, `open_url` de GPUI, una pestaña nueva en la web. `nsh test` registra las URL en lugar de abrirlas.
- Un [`TextView`](../elements/text-view.md) abre sus enlaces de esta manera con `links="open"`.

<a id="layout-direction"></a>

### Dirección del diseño

La dirección del diseño sigue el idioma del usuario: en un idioma de derecha a izquierda (árabe, hebreo, ...) la app se dispone de derecha a izquierda, las filas parten desde la derecha, y las propiedades de estilo `left` / `right` (`marginLeft`, `paddingRight`, ...) significan inicio y fin. Los cambios se aplican al instante, sin reiniciar.

El estilo `direction` de una vista (`"ltr"`, `"rtl"` o `"inherit"`, el valor predeterminado) fija la dirección de su propio subárbol; en Rust, `.direction(LayoutDirection::..)`.

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

### Relacionado

- Los márgenes de área segura (Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`) y el teclado de software (Rust `keyboard_height()`; TSX `keyboardFrame()`) están en [Área segura y teclado](#safe-area-and-keyboard).
- Los ajustes de lector de pantalla y de movimiento reducido están en [Accesibilidad](#accessibility).

## PanResponder

Los pan responders son gestos de arrastre sobre el sistema de gesture responder: el elemento reclama los toques de un gesto y luego los escucha en exclusiva junto con el estado del gesto, que sigue por ti el centroide de los toques, la distancia recorrida y la velocidad. El código Rust los reclama con `.claim_touches(TouchClaim::…)` y los escucha con listeners `.on_responder_*` cuyo `ResponderEvent` lleva un `PanGesture`, todo en `nsh_core::prelude`; TSX importa `PanResponder` de `nsh`, cuyos callbacks `onPanResponder…` reciben el evento táctil y el estado del gesto.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Un pan responder entrega cada movimiento al código de la app, por lo que resulta adecuado para gestos que cambian el estado de la app (reordenar, decisiones de deslizar para eliminar). Para mover una vista con el dedo, los valores de gesto nativos son más rápidos: `.pan_values(x, y)`, `.pinch_value(scale)` y `.rotation_value(angle)` en Rust, las props `pan={{ x, y }}`, `pinch` y `rotation` en TSX. El arrastre escribe [valores animados](#animation) en el hilo de la UI y la app solo se entera cuando empieza y termina (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`). Véase [Toques y gestos](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Crea un pan responder. Aplica su `panHandlers` con spread en la vista que debe recibir el gesto. En Rust, la vista reclama los toques y escucha por sí misma:

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

### Callbacks

Cada callback recibe el evento táctil (`GestureResponderEvent`, de [`nsh`](#types)) y el estado del gesto. En Rust, un claim decide con `.ask(|request: &ClaimRequest| …)`, llamando a `request.claim()` para tomar los toques (sin `ask` los toma siempre), y cada listener recibe un `ResponderEvent` cuyo `gesture` es el estado.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Callback | Rust | Devuelve | Se llama cuando |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | Un dedo toca la pantalla: devuelve `true` para convertirte en el responder. Se pregunta desde la vista tocada hacia fuera. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | Lo mismo, pero se pregunta de fuera hacia dentro antes que en la fase de burbujeo (un padre que le quita el gesto a sus hijos). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | Un dedo se mueve: devuelve `true` para convertirte en el responder (p. ej. solo una vez que `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | Lo mismo, en la fase de captura. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | Esta vista es ahora el responder: el gesto comienza. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | Otra vista es el responder y no quiso soltarlo. |
| `onPanResponderStart` | `.on_responder_start(…)` | | Un dedo tocó la pantalla mientras se respondía. |
| `onPanResponderMove` | `.on_responder_move(…)` | | Los dedos se movieron. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | Un dedo se levantó mientras se respondía. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | Se levantó el último dedo: el gesto terminó. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | Otra vista (o un gesto nativo, como una scroll view) tomó los toques. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` los conserva | `boolean` | Otra vista quiere los toques: devuelve `false` para conservarlos (por defecto `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | Si se debe impedir que las scroll views nativas tomen los toques mientras se responde (por defecto `true`). |

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

Rust: `PanGesture`, con los puntos como `Point<Points>`.

| Campo | Rust | Descripción |
|---|---|---|
| `stateID` |  | Identifica el gesto. |
| `moveX`, `moveY` | `position` | Última posición del centroide de los toques, en puntos de la superficie. |
| `x0`, `y0` | `origin` | Dónde estaba el centroide cuando se concedió el responder. |
| `dx`, `dy` | `delta` | Distancia recorrida desde la concesión. |
| `vx`, `vy` | `vx`, `vy` | Velocidad en puntos por segundo. |
| `numberActiveTouches` | `active_touches` | Dedos apoyados. |

<a id="inside-scroll-views"></a>

### Dentro de scroll views

Mientras un pan responder es el responder, las scroll views nativas que lo rodean no se desplazan (`onShouldBlockNativeResponder` es `true` por defecto). Para que un deslizamiento horizontal conviva con el desplazamiento vertical, conviértete en el responder solo en los movimientos horizontales:

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

Para un pan que la plataforma reconoce, `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` decide en el hilo principal mientras se mueven los dedos. Las props de responder subyacentes (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) también se pueden usar directamente en cualquier elemento; véase [Elementos](../elements/index.md).

## Clipboard

La API de Clipboard lee y escribe el portapapeles del sistema: texto en todas partes (`UIPasteboard` en iOS, `ClipboardManager` en Android, `NSPasteboard`, GDK y el portapapeles de Win32 en escritorio, `navigator.clipboard` en la web), imágenes en iOS, escritorio y la web, y los archivos copiados en un administrador de archivos en escritorio y Mac Catalyst. El código Rust llama a las funciones de `nsh_core::prelude` (`set_clipboard`, `clipboard_string`, ...); TSX importa `Clipboard` de `nsh`.

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

Las lecturas de Rust devuelven respuestas que se esperan con await en una tarea (`spawn`, o una función de módulo `async`); `ClipboardImage` es `nsh_core::element::ClipboardImage`, con `url` y `size` (un `Size<DevicePixels>`).

Las imágenes pasan por el portapapeles en iOS, escritorio y la web. En Android el portapapeles transporta texto: `writeImage` y
`readImage` se rechazan con un `Error` cuyo `code` es `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`, y `hasImage` se resuelve
`false`. En Rust, `set_clipboard_image` deja el portapapeles como está allí y `clipboard_image` responde `None`.

El usuario también puede copiar por sí mismo desde un [texto seleccionable](../elements/text.md); la API de Clipboard sirve para copiar desde el código, por ejemplo con un botón Copiar.

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

Pone `text` en el portapapeles, reemplazando lo que hubiera. Rust: `set_clipboard(text)`.

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

Se resuelve con el texto del portapapeles, o con `""` cuando no contiene ninguno. Rust: `clipboard_string()`. En iOS, leer el portapapeles puede mostrar el aviso de pegado del sistema ("App pegó desde …"), y en Android 10 y posteriores solo la app en primer plano puede leerlo. Léelo cuando el usuario pida pegar, no en cada pantalla.

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

Se resuelve con un valor que indica si el portapapeles contiene texto, sin leerlo: sin aviso de pegado en iOS. Rust: `clipboard_has_string()`. Úsalo para decidir si mostrar un botón Pegar. En la web, los navegadores solo lo saben leyendo, por lo que puede pedir permiso al usuario.

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

Se resuelve con la imagen del portapapeles, o con `null` cuando no contiene ninguna: una captura de pantalla pegada, o una imagen copiada en un navegador
o en un editor de imágenes. Rust: `clipboard_image()`, `None` cuando no contiene ninguna. `url` es una URL de la imagen (PNG, o el
JPEG, GIF, WebP o BMP propio del portapapeles) que un [`Image`](../elements/image.md) muestra como su `src` y que `fetch` lee:
`fetch(url)` da sus bytes, para una subida. `size` (`width` y `height`) es su tamaño en píxeles, tal como se decodifica. Igual que con
`readText`, léela cuando el usuario pida pegar. Se leen imágenes de hasta 48 MB (codificadas), de modo que la imagen quepa en la
memoria de la app; una mayor se rechaza con un `Error` cuyo `code` es `"ERR_NSH_QUOTA_EXCEEDED"` (su mensaje indica el
tamaño de la imagen y el límite), mientras que `hasImage` se resuelve `true`. Rust: `clipboard_image()` responde `None` en ese caso.

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

Una app de estilo chat donde los usuarios pegan capturas de pantalla en un compositor enlaza el atajo de pegado mientras su input tiene el foco
y toma la imagen cuando hay una:

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

Se resuelve con un valor que indica si el portapapeles contiene una imagen, sin leerla: sin aviso de pegado en iOS. Rust:
`clipboard_has_image()`. En Android se resuelve `false`.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

Pone en el portapapeles la imagen de `src`, una URL `data:` en base64 o la `url` que dio `readImage`, reemplazando lo que contiene.
Rust: `set_clipboard_image(src)`. En Windows toma un PNG, el formato que leen los navegadores, Office y la Herramienta Recortes. En
Android se rechaza con `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.

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

Se resuelve con las URL `file:` de los archivos y carpetas copiados en un administrador de archivos (Finder, Explorer, Files), en su
orden, o `[]`: las mismas URL que da un [file drop](../elements/view.md#desktop-file-drops). Rust: `clipboard_files()`.
Analiza una URL para obtener su ruta.

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
> Cuando tu app declara `capabilities` en `nsh.json`, el portapapeles debe concederse con `"clipboard": true`. Sin ello, todas las funciones de `Clipboard` se rechazan con un `Error` cuyo `code` es `"ERR_ACCESS_DENIED"`, `permission` `"clipboard"` y `resource` `""`, y nada llega al portapapeles del sistema. En Rust, las escrituras dejan el portapapeles como está y las lecturas responden lo que respondería un portapapeles vacío (`""`, `None`, una lista vacía, `false`), y la denegación se registra. Véase [Sandbox y capacidades](../docs/sandbox-and-capabilities.md).
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

La API de picker muestra el selector de fotos del sistema y entrega a la app las imágenes que elige el usuario: el selector de Photos en iOS (`PHPickerViewController`), el Photo Picker en Android, un panel de apertura o un diálogo de archivos en los escritorios y un file input en un navegador. En iOS y Android el selector se ejecuta fuera de la app y entrega solo lo que el usuario elige, por lo que no necesita permiso para la fototeca. Cada imagen elegida llega como un `File` (TSX) o un `PickedFile` (Rust) cuyos bytes permanecen nativos: muéstrala con `URL.createObjectURL(file)` en un [`Image`](../elements/image.md), súbela con `fetch` y `FormData`. El código Rust llama a `pick_images` de `nsh_core::prelude`; TSX importa `Picker` de `nsh`.

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
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 para hasta 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

Muestra el selector y se resuelve con las imágenes que el usuario eligió, en el orden en que las eligió, o con `[]` cuando el usuario cancela.
Rust: `pick_images(request)`, una respuesta que se espera en una tarea (`spawn`, o una función de módulo de `async`). `pickImages`
nunca lanza excepciones: las opciones fuera de rango (`limit: 0`, un `quality` fuera de 0 a 1) rechazan la promesa con un `RangeError`, y una
selección que las capacidades de la app no permiten la rechaza con `ERR_ACCESS_DENIED` (más abajo). Cancelar es una respuesta del usuario, no un
fallo: se resuelve con `[]`.

Las imágenes llegan listas para enviar:

- **Formatos que aceptan todos los navegadores y servidores.** JPEG, PNG, GIF y WebP llegan tal cual; una foto almacenada en otro
  formato (HEIC en los iPhone, HEIF, TIFF) llega como JPEG. `format: "current"` conserva el formato almacenado.
- **Reducidas de forma nativa.** Con `maxDimension`, una imagen cuyo lado más largo supere ese valor se reduce para ajustarse a él, en posición vertical, y
  se codifica de nuevo: un PNG como PNG, cualquier otro como JPEG de `quality`. Las fotos de teléfono tienen de 12 a 48 megapíxeles; reducirlas
  a 2048 píxeles antes de subirlas las deja en unos cientos de kilobytes. Un `quality` también vuelve a codificar los JPEG.
- **Lo que muestra.** `size` es el tamaño de la imagen en píxeles tal como se ve, con su orientación de cámara aplicada. Una imagen que NSH
  codifica de nuevo no lleva metadatos (ni ubicación); una que llega tal cual conserva los suyos.

En Windows, Linux y en las ventanas GPUI, el diálogo ofrece los formatos que admite la solicitud (con `"compatible"`: JPEG, PNG,
GIF y WebP) y los archivos llegan tal como están almacenados, con su propio tamaño.

Un compositor de chat adjunta una foto, la muestra mientras se escribe el mensaje y la sube cuando se envía:

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

Varias fotos a la vez:

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

### Apps que incorporan NSH

Una app que incorpora NSH y tiene un selector propio (por ejemplo, uno con los álbumes de la propia app) responde ella misma a las selecciones: en
Rust, un `PickerBackend` (`nsh_core::picker`) entregado al motor (`EngineConfig::picker`, o `AppView::set_picker` en
las apps de GPUI y GPUI Kit) recibe el `PickRequest` de cada selección y devuelve los archivos, y el selector del sistema no
se muestra. Los archivos que devuelve se completan igual que los de la plataforma: se recortan al límite de la solicitud y sus tamaños, tipos y
extensiones se leen a partir de sus bytes.

<a id="tests"></a>

### Pruebas

`nsh test` responde a las selecciones en ejecuciones headless: `app.onPick(handler)` devuelve los archivos que elige el usuario (`{ name, type, data }`),
y sin un manejador la selección se cancela. Consulta [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Cuando tu app declara `capabilities` en `nsh.json`, el selector debe concederse con `"picker": true`. Sin ello,
> `pickImages` no muestra nada y rechaza con un `Error` cuyo `code` es `"ERR_ACCESS_DENIED"`, `permission`
> `"picker"` y `resource` `""`. En Rust, `pick_images` responde sin archivos y la denegación se registra en el log. Consulta
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

## Speech

La API de speech convierte lo que dice el usuario en texto (dictado): la app inicia una sesión, la plataforma escucha el
micrófono y la transcripción llega a medida que crece. macOS e iOS reconocen con el framework Speech del sistema;
el sistema pide al usuario una sola vez el permiso para el micrófono y para el reconocimiento de voz. En otras plataformas una sesión termina de inmediato
con el error `"unavailable"`, así que comprueba `Speech.available()` antes de mostrar un botón de micrófono. El código Rust llama a
`recognize_speech` de `nsh_core::prelude`; TSX importa `Speech` de `nsh`.

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
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (al soltarla se aborta) |

### Speech.start

Inicia una sesión y la devuelve de inmediato. Una sesión informa, en este orden: `start` cuando el micrófono está activo y el
reconocedor escucha, `result` cada vez que cambia la transcripción (`text` es siempre la transcripción completa hasta el momento, de modo que la
app la muestra tal cual) y un `end`, después del cual no llega nada más. `stop()` deja de escuchar y permite que el reconocedor
termine con lo que oyó: un último resultado con `isFinal: true` y luego `end`. `abort()` termina la sesión de inmediato, sin
error, y descarta lo que no se había informado. Solo se ejecuta una sesión a la vez: iniciar otra aborta la que está en curso.

`end` contiene la última transcripción y, cuando la sesión falló, `error`, con nombres como en la Web Speech API:

| `error` | Cuándo |
|---|---|
| `"not-allowed"` | El usuario o el sistema no permiten el micrófono o el reconocimiento de voz. |
| `"no-speech"` | No se dijo nada. |
| `"audio-capture"` | No se pudo usar el micrófono. |
| `"network"` | El reconocedor necesita la red y no pudo acceder a ella. |
| `"language-not-supported"` | El reconocedor no conoce `lang`. |
| `"unavailable"` | Esta plataforma no reconoce voz, o no por ahora. |
| `"failed"` | El reconocedor falló por otro motivo. |

`start` lanza un `TypeError` para opciones de tipos incorrectos y un `RangeError` para un `lang` que no es una etiqueta de idioma.

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

Se resuelve con `true` donde puede ejecutarse una sesión: en macOS e iOS, y en cualquier lugar donde la app que incorpora NSH reconozca la voz por sí misma.

### Info.plist

En macOS e iOS el sistema muestra por qué la app quiere el micrófono y el reconocimiento de voz. `nsh package` y
`nsh run` escriben `NSMicrophoneUsageDescription` y `NSSpeechRecognitionUsageDescription` en el Info.plist de la app
cuando la app puede usar speech (su concesión de `capabilities` `speech`, o no declara ninguna).

<a id="embedding-apps-1"></a>

### Apps que incorporan NSH

Una app que incorpora NSH y reconoce la voz a su manera (con su propio motor o servicio) responde ella misma a las sesiones: en
Rust, un `SpeechBackend` (`nsh_core::speech`) entregado al motor (`EngineConfig::speech`) recibe el
`SpeechRequest` de cada sesión y un `SpeechSink` al que informa desde cualquier hilo, y devuelve el `SpeechControl` con el que el núcleo detiene y
aborta la sesión. En ese caso no se usa el reconocedor de la plataforma.

<a id="tests-1"></a>

### Pruebas

`nsh test` ejecuta sesiones con un reconocedor simulado en ejecuciones headless: una sesión se inicia de inmediato, `app.hear(text)` informa
`text` como la transcripción hasta el momento, `app.endSpeech(error?)` la termina y `app.speechRequests()` enumera las sesiones que la
app inició. Consulta [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Cuando tu app declara `capabilities` en `nsh.json`, speech debe concederse con `"speech": true`. Sin ello,
> `Speech.start` lanza un `Error` cuyo `code` es `"ERR_ACCESS_DENIED"`, `permission` `"speech"` y `resource` `""`.
> En Rust, la sesión termina con `not-allowed` y la denegación se registra en el log. Consulta
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

## Storage

La API de storage conserva los datos de la app en el dispositivo: cadenas por clave de tipo cadena, que siguen ahí la próxima vez que se inicia la app. Úsala para ajustes, borradores, la última pestaña que el usuario tenía abierta, una caché de lo que envió el servidor: cualquier estado que deba sobrevivir al proceso de la app. El código Rust usa `nsh_core::storage::Storage`, TSX importa `Storage` de `nsh`; ambos leen y escriben las mismas entradas, así que una app con una entrada en Rust y otra en TSX ve un único conjunto de datos.

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

Las funciones de Rust son síncronas, ya que las entradas están en memoria: llámalas donde se ejecutan los componentes (sus cuerpos, manejadores y tareas).

Cada app tiene su propio almacenamiento, de hasta 5 MB entre claves y valores. Las llamadas se ejecutan en el orden en que la app las hace, así que un `getItem` posterior a un `setItem` ve el nuevo valor sin esperar a la escritura. Las lecturas provienen de la memoria; las escrituras llegan al disco en segundo plano, unas pocas a la vez.

| Plataforma | Dónde se guardan los datos |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` en el contenedor de la app |
| Android | `files/nsh/<app id>/storage.json` en el directorio privado de la app |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | El `localStorage` del navegador, bajo claves con el nombre del id de la app (`nsh:com.example.todo:…`) |

Un `storage.json` dañado se conserva como `storage.json.corrupt` junto a él, y la app se inicia con un almacenamiento vacío; uno que no se puede leer deja los cambios de la app en memoria, de modo que el archivo nunca se reemplaza.

El id de la app es el `id` de `nsh.json`, y viaja con la app: `nsh build` y `nsh package` lo escriben junto al bundle, el servidor de desarrollo lo envía y un paquete firmado lleva el que avala el certificado de su clave de publicación. Así, cada app conserva sus propios datos sin ningún ajuste, se ejecute donde se ejecute; una app sin id los conserva bajo `default`. Una app que incorpora NSH puede elegir otro lugar (consulta [Embedding on iOS](../docs/ios.md) y [Embedding on Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

Se resuelve con el valor de `key`, o con `null` cuando no tiene ninguno. Rust: `Storage::get_item(key)`, `None` cuando no tiene ninguno.

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

Asigna `value` a `key`, reemplazando lo que contenía. Rechaza con un `Error` cuyo `code` es `"ERR_NSH_QUOTA_EXCEEDED"` cuando el almacenamiento superaría los 5 MB; en ese caso el valor no se conserva. Rust: `Storage::set_item(key, value)`, que entonces devuelve `Err(StorageFull)`. Los valores son cadenas: guarda los datos estructurados como JSON (`serde_json::to_string` en Rust, `JSON.stringify` en TSX) y léelos de nuevo (`serde_json::from_str`, `JSON.parse`).

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

Elimina `key` y su valor. Eliminar una clave que no tiene valor no hace nada. Rust: `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

Se resuelve con todas las claves, en orden. Rust: `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

Elimina todas las claves de la app, por ejemplo cuando el usuario cierra sesión. Rust: `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### Conservar una señal en el dispositivo

Lee el valor almacenado cuando se inicia la app y vuelve a escribirlo cada vez que cambia la señal:

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

`host` llega a la app que incorpora NSH: la app nativa que envuelve un `NshAppView` / `NshView`, o, en la web, la página que ejecuta el player. La app llama por nombre a las funciones del host con argumentos JSON y escucha los eventos que envía el host.

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

Indica si la plataforma tiene un host que responde a las llamadas. En la web es `true` cuando la página le da un host al player ([The host on the web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

Llama a la función `name` del host con `args` (cualquier valor JSON; `null` si no se da ninguno) y se resuelve con lo que esta devuelve. `host.call` nunca lanza excepciones: todo fallo rechaza la promesa con un `Error` cuyo `code` indica lo que ocurrió (el mensaje es para personas y puede cambiar):

| `code` | Cuándo |
|---|---|
| `ERR_NSH_HOST_ERROR` | La función del host falló, o el host no tiene ninguna función `name`; el mensaje es el del host |
| `ERR_ACCESS_DENIED` | `name` no está en la [capacidad `host`](#capability) de la app; `permission` es `"host"`, `resource` el nombre |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | La plataforma no tiene host: `host.available()` es `false` |
| `ETIMEDOUT` | El host no respondió a tiempo |
| `ERR_NSH_QUOTA_EXCEEDED` | Ya hay 1024 llamadas esperando las respuestas de la app que incorpora NSH |

Un nombre que no es válido (de 1 a 128 de `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`, sin `..`) rechaza con un `TypeError`.

Una llamada espera 30 segundos la respuesta del host y luego rechaza con `ETIMEDOUT`; una respuesta que llegue más tarde se descarta. `options.timeout` fija la espera en milisegundos, `0` para no tener límite; un tiempo de espera tan grande que el reloj nunca llega a él (unos 1e22 ms) también espera sin límite, y uno negativo, `NaN` o infinito rechaza la llamada con un `RangeError`. El tiempo es el de la app, igual que el de sus temporizadores: en `nsh test` con un reloj manual avanza con el reloj.

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

Los eventos de la plataforma llaman a `listener` con la carga de cada `event` que envía el host, hasta que se llama a la función que devuelve `host.on`; un listener añadido mientras se renderiza un componente se detiene con el componente. Los eventos que el host envía antes de que se inicie la app llegan cuando esta se inicia, por lo que los listeners registrados en el nivel superior de la app los reciben; un evento enviado antes de que se registre un listener no se reproduce para él. Lee el estado con el que se inicia la app mediante `host.call` y sigue sus cambios con `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### Capacidad

Cada función que la app llama debe figurar en el `capabilities.host` de `nsh.json`: nombres exactos o prefijos que terminan en `*`, o `true` para todas. Esto vale para toda app, incluso una sin otros `capabilities`: las funciones del host nunca se conceden por defecto. Una llamada no concedida se rechaza con `ERR_ACCESS_DENIED` y queda registrada, un `host.post` de ese nombre a una app anfitriona lanza el mismo error, y al compilar una app que importa `host` de `nsh` sin `capabilities.host` se emite una advertencia. Los eventos no necesitan concesión. Consulta [Sandbox y capacidades](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### El host en la web

En la web, la página es el host. La opción `host` de `createPlayer` responde a las llamadas, y `player.hostEvent(event, payload)` envía eventos:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

Una app publicada nombra a su host en `nsh.json`: `web.host` es un módulo JS en el directorio de la app, relativo a `nsh.json`, que exporta `createHost(player)`, el cual devuelve el objeto con `call`. `nsh package --target web` lo incluye con el sitio, `nsh run --target web` lo ejecuta en la página de desarrollo y `nsh test` lo ejecuta para las apps que abren sus pruebas. `web.connect` enumera los hosts a los que llegan las peticiones propias del host, que la Content-Security-Policy de la página permite junto con el `capabilities.network` de la app. Consulta [Web](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

Los parámetros que la app anfitriona estableció antes de iniciar tu app, que se leen de forma síncrona desde la primera línea de tu código; `{}` cuando no estableció ninguno. Permanecen iguales mientras tu app se ejecuta: las solicitudes posteriores llegan como eventos.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```

<a id="native-sdk-channel"></a>

### Canal del Native SDK

El `send` del Native SDK conserva los eventos hasta que la app escucha, hasta un máximo de 256. Cuando el último oyente se detiene durante la entrega, los eventos restantes siguen esperando en orden; los eventos enviados durante el cierre esperan a la siguiente app cargada. `host.post(name, data)` entrega datos al manejador del Native SDK, cuyo `isPost` distingue los posts de las llamadas.

<a id="the-embedding-apps-side"></a>

### El lado de la app anfitriona

Cada vista mantiene un único canal para todas las apps que carga. Establece los parámetros antes de cargar, envía eventos en cualquier momento desde cualquier hilo y registra manejadores por nombre. Las llamadas y los posts requieren la concesión `capabilities.host` de la app. Los manejadores responden una sola vez, ahora o más tarde; una respuesta que nunca llega hace fallar la llamada.

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

Consulta [Integración en iOS](../docs/ios.md#talking-to-the-app), [Integración en Android](../docs/android.md#talking-to-the-app) y [GPUI](../docs/gpui.md).

> [!NOTE]
> Las llamadas y los posts del Native SDK usan la misma [capacidad `host`](../docs/sandbox-and-capabilities.md#host) que las llamadas de plataforma. Una app Rust accede directamente al Rust de la app anfitriona, a través de las funciones que esta registra ([`nativeModule`](#nativemodule) e importaciones de Rust).

## keymap

El keymap asocia los atajos de teclado de la app: una combinación de teclas como `"mod+k"` y la función que ejecuta. El código Rust llama a `on_key`, `on_key_with` y `key_label` desde `nsh_core::prelude`; TSX importa `keymap` desde `nsh`. Ambos aceptan las mismas combinaciones de teclas y siguen las mismas reglas.

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
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when` es `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | un `on_key` por combinación de teclas |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Un binding de Rust vive tanto como el componente (el propietario) que lo creó; el manejador recibe la combinación de teclas tal como se escribió.

Los atajos funcionan en macOS, Windows, Linux y en navegadores (las teclas propias del navegador, como Ctrl+T o Cmd+W, nunca llegan a la página), y en iOS y Android con teclado físico: el de un iPad, el de un Mac que ejecuta una app de iPad, el de una tableta o un Chromebook, el del simulador y el del emulador. El mismo código se ejecuta en todas partes; sin teclado, ninguna tecla activa los bindings.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

Ejecuta `handler` cuando se pulsa `keystroke` y devuelve una función que elimina el binding. El manejador recibe `{ keystroke }`: la combinación de teclas tal como la escribiste, con sus mayúsculas o minúsculas. Rust: `on_key(keystroke, handler)`, cuyo manejador recibe la propia combinación de teclas.

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

Pasa un objeto para asociar varias combinaciones de teclas a la vez; la función devuelta las elimina todas. En Rust, cada combinación de teclas es un `on_key`:

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

Un binding creado mientras se renderiza un componente se elimina junto con el componente, de modo que los atajos de una pantalla viven tanto como la pantalla:

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

Con el servidor de desarrollo, al editar un módulo se eliminan los bindings creados por su código de nivel superior antes de que vuelva a ejecutarse, de modo que la recarga en caliente nunca deja atajos obsoletos.

### keymap.label

```ts
label(keystroke: string): string;
```

Devuelve `keystroke` tal como lo muestran los menús y las sugerencias donde se ejecuta la app: `"⇧⌘L"` en macOS e iOS (y en un navegador en un Mac, iPhone o iPad), `"Ctrl+Shift+L"` en Windows, Linux y otros navegadores, para `"mod+shift+l"`. Rust: `key_label(keystroke)`. Úsalo para mostrar los atajos de una app con las teclas que funcionan:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

Lanza un `TypeError` ante una combinación de teclas no válida, igual que `bind`; `key_label` y `on_key` entran en pánico con el mismo mensaje.

<a id="keystrokes"></a>

### Combinaciones de teclas

Una combinación de teclas es un conjunto de modificadores y una tecla unidos por `+`: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command y menos).

| Modificador | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (también `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (también `command`, `meta`, `super`, `win`) | Command (⌘) | Tecla Windows | Super |
| `ctrl` (también `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (también `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS sigue a macOS (`mod` es Command) y Android sigue a Windows y Linux (`mod` es Ctrl, `cmd` la tecla Meta). En un navegador, las teclas siguen a la plataforma en la que se ejecuta el navegador: `mod` es Command en un Mac, iPhone o iPad y Ctrl en el resto.

Usa `mod` para los atajos propios de una app: es la tecla que las apps de cada plataforma usan para ellos (⌘K en macOS, Ctrl+K en Windows y Linux), de modo que una sola grafía sirve en todas partes. La tecla Windows y Super pertenecen sobre todo al sistema, por lo que `cmd` rara vez es adecuado fuera de macOS.

La tecla es una letra, un dígito o un signo de puntuación, escrito como el carácter que produce en un teclado estadounidense sin Shift (`k`, `1`, `,`, `/`, `[`; `"shift+/"` para `?`, `"shift+k"` para Shift+K), o un nombre: `plus` (la tecla `=` / `+`, también escrita `=`), `minus` (también `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, las flechas `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1` a `f24`. Las mayúsculas y minúsculas no importan: `"Mod+Shift+K"` es `"mod+shift+k"`, y una letra mayúscula es la misma tecla, no Shift (`"mod+K"` es `"mod+k"`). Se recomienda usar minúsculas, que es lo que usan estas páginas. `"mod-k"` y `"mod++"` son errores cuyos mensajes indican la grafía correcta. Los atajos de menú en `nsh/desktop` aceptan las mismas combinaciones de teclas.

Los atajos funcionan con cualquier distribución de teclado: en una distribución cirílica o griega, `mod+k` es la tecla que escribe K en una distribución estadounidense, igual que los atajos de menú.

`bind` lanza un `TypeError` que indica qué falla en una combinación de teclas no válida (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`), y rechaza las combinaciones que el sistema se reserva, de modo que una app nunca pueda romperlas:

| Plataforma | Reservado |
|---|---|
| macOS, iOS | Cmd+Q (salir), Cmd+H (ocultar), Option+Cmd+H (ocultar otras), Cmd+M (minimizar), Ctrl+Cmd+F (pantalla completa) |
| Linux, Windows, Android | Ctrl+Q (salir), Alt+F4 (cerrar), F11 (pantalla completa) |
| Web | Ninguna (el navegador conserva sus propias teclas) |

<a id="while-typing"></a>

### Al escribir

Un campo de texto con el foco del teclado necesita sus teclas: escribir, mover el cursor, borrar, y seleccionar todo, cortar, copiar, pegar, deshacer y rehacer. Por ello, por defecto un binding no se activa mientras un campo de texto (o una web view) tiene el foco si su combinación de teclas es una de estas: teclas simples y teclas con solo Shift u Option, las flechas, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, y `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`. Las demás combinaciones con Command o Control, y las teclas de función, se activan donde quiera que esté el foco.

`when` cambia esto (Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | Se activa |
|---|---|
| (predeterminado) | Como se indica arriba |
| `"always"` | También en campos de texto, antes de que el campo vea la tecla |
| `"notEditing"` | Nunca mientras un campo de texto tiene el foco |

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

En iOS y Android, una tecla con la que un método de entrada está componiendo (elegir un candidato, confirmar) sigue siendo del método de entrada. En el backend GPUI, un componente nativo con el foco del teclado cuenta como campo de texto, ya que puede ser un editor de texto. Ve cada tecla primero: una tecla que maneja por sí mismo nunca llega a los bindings, y los bindings que se activan mientras se edita texto reciben las teclas que él deja pasar.

<a id="which-binding-runs"></a>

### Qué binding se ejecuta

Una tecla que activa un binding se consume: no se escribe, el sistema no emite un pitido y las teclas propias de NSH no la ven (Escape para volver atrás, Tab para mover el foco, las flechas para desplazarse). Cuando varios bindings tienen la misma combinación de teclas, se ejecuta el más reciente que puede activarse, de modo que un diálogo puede asociar Escape por encima del binding de la pantalla, y el de la pantalla vuelve cuando el del diálogo desaparece. Los bindings se comprueban de forma nativa en el momento en que se pulsa la tecla; el manejador se ejecuta justo después, en el hilo del motor (Rust) o en el hilo JS (TSX).

Mantener una tecla pulsada activa su binding una sola vez, hasta que se suelta; con `repeat: true` se activa de nuevo en cada repetición automática (por ejemplo, para recorrer una lista):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

Los atajos de menú ceden ante un binding de la misma combinación de teclas: los del menú de la aplicación ([`nsh/desktop`](./nsh-desktop)) en todos los escritorios, y en macOS también los de los menús integrados (Cmd+W, Cmd+C, ...). Mientras desarrollas con `nsh run`, Cmd+R / Ctrl+R siempre recarga la app, incluso si esta asocia `mod+r`; una app empaquetada puede asociarlo.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent y nativeModule

`nativeComponent` y `nativeModule` conectan tu app con lo que proporciona la app anfitriona, por nombre, en tiempo de ejecución. Una app iOS o Android que integra NSH puede registrar sus propias vistas (un mapa, un gráfico, una vista previa de la cámara) por nombre; `nativeComponent` te da un componente tipado para una de ellas. Como NSH renderiza con vistas nativas reales, un componente así se sitúa en la jerarquía de vistas como cualquier otra vista: NSH lo dispone, se recorta y se desplaza con sus padres, y se superpone correctamente. Una app que integra NSH desde Rust también puede registrar funciones, clases y componentes Rust; `nativeModule` te los da como un único objeto tipado. En cualquier caso, tu app se compila con el `nsh build` estándar: el host conecta lo que proporciona cuando ejecuta la app. El código Rust coloca una vista registrada con `native(name)` de `nsh_core::prelude`, establece sus props con `.prop(name, value)` (un valor JSON, o una señal o closure de uno) o vincula una a un valor animado con `.bind_prop(name, &value)`, escucha sus eventos con `.on_native_event(…)` y llama a sus comandos mediante un `ElementRef`; TSX importa `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

Consulta [Componentes nativos](../docs/native-components.md) para registrar el lado nativo, y [Integración en iOS](../docs/ios.md) / [Integración en Android](../docs/android.md).

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

Devuelve un componente para el componente nativo que la app anfitriona registró como `name` (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`). Rust: `native(name)`, una vista cuyas props son valores JSON (`.prop("text", json!(…))`) y cuyos eventos llegan como `NativeEvent { name, data }`.

- `P` es el tipo de sus propias props. Cada prop listada en `spec.props` se envía al lado nativo como JSON cuando cambia; establecerla en `undefined` la elimina.
- `E` asocia los nombres de eventos con sus cargas. Un evento `regionChange` se convierte en la prop manejadora `onRegionChange`.
- El componente también acepta todas las [props de vista](../elements/view.md) excepto `children`: `style`, `class`, el layout, la accesibilidad, los manejadores táctiles y `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### Tamaño

El componente se dispone como una vista, con el tamaño que le da su estilo. Donde el estilo deja una dimensión abierta, usa el tamaño que informa el componente nativo (como una imagen usa su tamaño natural).

<a id="commands"></a>

#### Comandos

Su `ref` recibe un `NativeComponentRef`; `ref.command(name, args)` llama al comando `name` del componente nativo con `args` (cualquier valor JSON). Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### Cuando no hay nada registrado

Donde no hay nada registrado bajo `name` (otra app anfitriona, el host de desarrollo, el navegador), el componente renderiza una vista vacía y se registra una advertencia una sola vez. Mantén la app utilizable sin él, o comprueba tu host antes de usarlo.

<a id="example"></a>

### Ejemplo

La insignia de aquí es una vista nativa de la app anfitriona, registrada como `embed.badge`. NSH la dispone, le envía `text` y `color`, recibe sus eventos `tap` y llama a su comando `pulse`:

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

Devuelve las exportaciones del conjunto que la app anfitriona registró como `specifier`: sus módulos, clases, funciones y componentes de Rust, como un único objeto. La app escribe el tipo `T` por sí misma, así que no se necesita nada del host cuando se compila. El código Rust compilado junto con el crate del host llama a esas funciones como Rust; `nativeModule` es la forma en que TSX llega a ellas.

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

- Las llamadas funcionan igual que a través de la importación de un conjunto: una función Rust simple devuelve su valor de inmediato, una función `async` devuelve una promesa, y una función que pasas es un callback que Rust puede llamar más tarde. Rust comprueba cada argumento y lanza un `TypeError` si alguno es incorrecto.
- Cada llamada con el mismo `specifier` devuelve el mismo objeto.
- Si no hay nada registrado bajo `specifier`, `nativeModule` lanza un `ReferenceError` que lo nombra. Llámalo donde la app pueda gestionarlo, o solo en el host para el que está hecho.

El host registra el conjunto desde Rust, con el `set_ui_sets` del crate de la plataforma (junto a los conjuntos propios de NSH) antes de iniciar sus vistas, o con `EngineConfig::ui_sets`:

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

`on` es la forma en que el host mantiene sincronizadas todas las apps con sus propios datos: la tarea que inicia espera los cambios del host y envía cada uno a la app, de modo que un cambio hecho por el host, o por cualquier app mediante otra función, llega a todas las apps que escuchan. El `Stop` que devuelve es la función que `Trading.on` devuelve en TSX: se ejecuta una sola vez, cuando la app la llama o cuando termina lo que llamó a `on` (un componente, o la ejecución del módulo bajo hot reload), y aquí elimina el listener, de modo que la tarea termina.

> [!NOTE]
> Las props, los eventos y los argumentos de los comandos pasan al lado nativo como JSON. Los componentes y las funciones registrados son código propio de la app anfitriona: los [límites y capacidades del sandbox](../docs/sandbox-and-capabilities.md) de NSH no se aplican a lo que hacen.

<a id="accessibility"></a>

## Accesibilidad

La API de accesibilidad lee los ajustes de accesibilidad del usuario (si hay un lector de pantalla en ejecución, si ha pedido menos movimiento) y se comunica con el lector de pantalla. El código Rust llama a `screen_reader()`, `reduce_motion()` y `announce_for_accessibility()` desde `nsh_core::prelude` y mueve el foco con un `ElementRef`; TSX importa `screenReaderEnabled()`, `reduceMotion()`, `announce()` y `setAccessibilityFocus()` desde `nsh`. Los ajustes son reactivos: léelos en un binding, `computed` o `effect`, y lo que los lee se actualiza cuando el usuario los cambia. Las props de accesibilidad de los elementos (`accessibilityLabel`, `role`, ...) están documentadas en [Elementos](../elements/index.md); la guía es [Accesibilidad](../docs/accessibility.md).

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

Indica si hay un lector de pantalla (VoiceOver, TalkBack) en ejecución. Reactivo: lo que lo lee se actualiza cuando el usuario activa o desactiva el lector de pantalla. Rust: `screen_reader() -> bool`, reactivo de la misma forma.

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

Indica si el usuario ha pedido menos movimiento (Reducir movimiento en iOS, Eliminar animaciones en Android). Reactivo. Rust: `reduce_motion() -> bool`. Las clases de Tailwind también lo siguen con la variante `motion-reduce:`.

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

El lector de pantalla lee `message` (un anuncio de VoiceOver, TalkBack). Úsalo para resultados que aparecen sin que se mueva el foco, como "Guardado". Rust: `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Mueve el foco del lector de pantalla a `node` (el `ref` de un elemento). Rust: `ElementRef::set_accessibility_focus()`.

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

<a id="types"></a>

## Tipos

`nsh` también exporta los tipos de la API reactiva y de los elementos host. Los más usados:

| Tipo | Qué es |
|---|---|
| `Accessor<T>` | Un valor legible: `() => T` |
| `Signal<T>` | Un `Accessor<T>` con `set` y `update` |
| `SignalOptions<T>` | Opciones de `signal` y `computed` (`equals`) |
| `Context<T>` | Lo que devuelve `context` |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | El namespace de JSX (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | Lo que recibe un `ref`, el tipo propio de cada elemento (`ViewRef` y los tipos construidos sobre él): foco, scroll y otros comandos. `ViewRef` es también lo que es un elemento (`JSX.Element`). Consulta los [métodos de ref](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | Props de los elementos host |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Objetos de estilo; consulta la [referencia de estilos](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | Valores dentro de los estilos |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Payloads de eventos |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | Las formas de las que se componen los payloads y las props, con los campos de GPUI (`nsh_core::geometry`) |
| `PixelSize` | El tamaño propio de una imagen o un vídeo en píxeles (`onLoad`, `Image.getSize`, las imágenes del portapapeles y del selector), donde `Size` son puntos |
| `ImageAsset` | Lo que da importar un archivo de imagen (`{ url, size: Size, scales? }`; `scales` lista sus [variantes de densidad de píxeles](../docs/images-and-assets.md#pixel-densities)) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Props de accesibilidad |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` acepta un estilo o una lista que se combina de izquierda a derecha, omitiendo las entradas falsy:

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
