---
title: "nsh"
description: "Das Kernmodul: Signals, Effects, Context, Mount, Design-Tokens, Animation, die Umgebung, Gesten, die Zwischenablage, Storage, der Host-Kanal, Tastaturkürzel, Barrierefreiheit sowie die Element- und Style-Typen."
order: 2
source_hash: 0264c3f02c420628
---


# nsh

`nsh` ist das Kernmodul: die reaktive API (Signals, Computed Values, Effects, Context), `mount`, `token`, die Host-Elemente `View`, `Text`, `Scroll` und `Overlay`, [auswählbare Views](#selectable-views), [die Safe Area und die Tastatur](#safe-area-and-keyboard), [Animation](#animation), [das Gerät und seine Umgebung](#device), [`PanResponder`](#panresponder), die [Zwischenablage](#clipboard), den [Foto-Picker](#picker), die [Spracherkennung](#speech), [Storage](#storage), den [Host-Kanal](#host), [Tastenkürzel](#keymap), [native Komponenten und Module](#nativecomponent-and-nativemodule), [Barrierefreiheit](#accessibility) sowie die TypeScript-Typen von Elementen, Styles und Events. Der reaktive Graph selbst läuft nativ in Rust; das Lesen eines Signals ist ein Aufruf in die Runtime, der wenige Nanosekunden kostet, und nur deine eigenen Closures laufen im JavaScript-Interpreter.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

Die Reaktivität von NSH folgt demselben Modell wie SolidJS: Eine Komponentenfunktion läuft **einmal**, und die Teile der UI, die Signals lesen, werden an Ort und Stelle aktualisiert, wenn sich diese Signals ändern. Es gibt weder ein erneutes Rendern der Komponente noch ein Virtual DOM. Den Leitfaden findest du unter [Reaktivität](../docs/reactivity.md).

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

Ein Signal hält einen Wert. Ein Aufruf liest den Wert und abonniert dabei, innerhalb eines Tracking-Scopes (JSX-Ausdrücke, `computed`, `effect`), diesen Scope darauf. `set` und `update` schreiben es; alles, was es gelesen hat, wird aktualisiert.

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

Standardmäßig bewirkt ein Schreibvorgang, der `===` zum aktuellen Wert ist, nichts. Übergib `equals: false`, um bei jedem Schreibvorgang zu benachrichtigen (nützlich, wenn du ein Objekt direkt veränderst und dasselbe Objekt erneut setzt), oder einen eigenen Vergleich:

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

Ein aus Signals abgeleiteter Wert. `fn` läuft erneut, wenn sich ein gelesenes Signal ändert; Leser des Computed Value werden nur aktualisiert, wenn sich sein Ergebnis ändert (verglichen mit `equals`, standardmäßig `===`). `fn` erhält das vorherige Ergebnis.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

Verwende `computed`, wenn eine Ableitung aufwendig ist oder an mehreren Stellen gelesen wird. Bei einem günstigen Ausdruck ist eine einfache Funktion (`const full = () => first() + " " + last()`) genauso reaktiv.

## effect

```ts
function effect(fn: () => void): void;
```

Führt `fn` nach dem Rendern aus und erneut, sobald sich ein gelesenes Signal ändert. Verwende Effects für Seiteneffekte: Logging, Timer, Kommunikation mit nativen Modulen. Ein Effect gehört zu der Komponente (oder dem Effect), in der er erstellt wurde, und wird mit ihr entsorgt.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Um etwas rückgängig zu machen, bevor der Effect erneut läuft (oder wenn seine Komponente verschwindet), rufe darin [`cleanup`](#cleanup) auf.

## batch

```ts
function batch<T>(fn: () => T): T;
```

Führt `fn` aus und wendet alle Schreibvorgänge gebündelt am Ende an, sodass Leser einmal statt einmal pro Schreibvorgang aktualisiert werden. Gibt zurück, was `fn` zurückgibt.

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

Führt `fn` aus, ohne den aktuellen Scope auf das Gelesene zu abonnieren. Verwende es, um ein Signal in einem Effect oder JSX-Ausdruck zu lesen, ohne davon abhängig zu werden.

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

Registriert `fn`, damit es läuft, bevor der aktuelle Effect erneut läuft oder wenn die aktuelle Komponente bzw. der aktuelle Effect verschwindet.

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

Ein Wert, den eine Komponente allem bereitstellt, was sie rendert, egal wie tief. Der Aufruf des Context (`Theme()`) liest den Wert des nächstgelegenen Providers, ohne Provider dagegen `defaultValue`.

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

Rendert `app` in die Surface (das Fenster oder den `NshAppView` / `NshView`, in den die App eingebettet ist) und gibt eine Funktion zurück, die es wieder entfernt. Die Einstiegsdatei jeder App endet mit `mount(App)`.

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

Teilt ein Props-Objekt in die in `keys` genannten Props und den Rest auf. Beide Hälften bleiben reaktiv: Props, deren Werte sich ändern, sind Getter, und `split` behält sie als Getter. Verwende es in einer Komponente, die einige Props selbst verarbeitet und die übrigen weitergibt. Destrukturieren von Props (`const { label } = props`) würde sie einmal lesen und Aktualisierungen verlieren.

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

Rendert seine Children oder `fallback`, sobald darunter etwas einen Fehler wirft: der Body einer Komponente, ein Binding, ein Effect oder ein Event-Handler. Der fehlgeschlagene Teil wird entfernt, und an seiner Stelle erscheint der Fallback. Eine Funktion `fallback` wird als `fallback(error, reset)` aufgerufen, mit dem geworfenen Wert und `reset`, das die Children erneut rendert, unabhängig davon, welche Parameter sie deklariert; ein `fallback`-Element wird unverändert angezeigt. Ein Fehler geht an die nächste Boundary darüber, und ein Fehler in einem Fallback an die Boundary darüber. Rust-Komponenten verwenden `catch_error` ([Error Boundaries](../docs/reactivity.md#error-boundaries)).

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

Das Design-Token `name` des Themes der App (`"theme"` in `nsh.json`, über den Tokens von shadcn/ui) in der angezeigten Darstellung:
eine Farbe als `#rrggbbaa`, eine Länge als Anzahl von Punkten, eine Schrift als ihr Familienname. Die Namen sind die CSS-Variablen des Themes
ohne `--` (`primary`, `muted-foreground`, `radius`, `font-mono` und die eigenen der App, etwa `up`). Das Lesen ist
reaktiv: Eine Komponente, ein Memo oder ein Effect, das bzw. der ein Token liest, läuft erneut, wenn sich das Theme oder die Darstellung ändert.
`Tokens` listet die Tokens der App mit ihren Typen auf; NSH schreibt es aus dem Theme nach `.nsh/types/nsh/tokens.d.ts`. Für
Klassen benennst du die Tokens direkt (`bg-primary`, `rounded-(--radius)`): [Theme-Tokens](../docs/tailwind.md#theme-tokens).

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

Die Host-Elemente, die `nsh` exportiert, als Tags geschrieben: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (seine
Children liegen über dem Fenster und werden an einem Anker ausgerichtet: [Overlay](../elements/overlay.md)). Der Compiler erzeugt die
native View direkt an Ort und Stelle für ein Tag, das über seinen Import eines davon benennt (auch per Alias), sodass das Importieren zur Laufzeit
nichts kostet. Sie sind Komponenten wie alle anderen und können daher auch herumgereicht werden (`const Tag = inline ? Text : View`).
`nsh` exportiert die übrigen Primitive auf dieselbe Weise: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) und [`Video`](./nsh-video.md), jeweils mit eigener Referenzseite.
Ihre Props sind unter [Elemente](../elements/index.md) dokumentiert. Das Texteingabefeld, `Input`, stammt aus
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## Safe Area und Tastatur

Die Umgebungsvariablen von CSS halten Inhalte frei von der System-UI, im Padding und Margin jeder View
(`padding`, `paddingTop`, ..., dieselben `margin`-Schlüssel; die beliebigen Werte `p*` / `m*` von Tailwind; die `Styled`-Methoden
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ... in Rust). Ihre Werte sind `EnvValue`s:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` und `calc(<length> + env(name))`.

| Variable | Wert |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | Die Insets der Root-View, in der der Node gerendert wird: die der nächsten Page (unterhalb ihres Headers), der nächsten Dialog-View oder sonst die Safe Area der Surface. Siehe [Safe Area](../elements/safe-area.md). |
| `keyboard-inset-height` | Die Höhe der Software-Tastatur über der Surface, 0 solange sie ausgeblendet ist; Änderungen werden nativ mit der Tastatur animiert. Siehe [Tastatur](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea und safeAreaInsets

`safeArea()` ist die Safe Area der Surface (`safe_area()` in Rust); `safeAreaInsets()` die Insets dort, wo eine Komponente
gerendert wird (`cx.insets()` in Rust), die Werte der `safe-area-inset-*`-Variablen. Beide sind reaktive `Edges`
(`{ top, right, bottom, left }` in Punkten). Siehe
[safeArea und safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

<a id="keyboard-and-keyboardframe"></a>

### Tastatur und keyboardFrame

`Keyboard.dismiss()` blendet die Software-Tastatur aus (`dismiss_keyboard()` in Rust), und `keyboardFrame()` zeigt dir, wie
viel vom Bildschirm sie verdeckt (`keyboard_height()` und `keyboard_duration()` in Rust). Siehe
[Die Tastatur ausblenden](../elements/keyboard.md#hiding-the-keyboard) und
[Die Höhe der Tastatur](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## Auswählbare Views

`<View selectable>` (`view().selectable(true)` in Rust) sorgt dafür, dass die darin enthaltenen Texte gemeinsam ausgewählt werden, wie
auf einer Webseite: Eine Auswahl läuft in Lesereihenfolge über Views, `Text`-Elemente und `TextView`s hinweg. Siehe
[Textauswahl](../elements/text-selection.md).

## Animation

Die Animations-API animiert auf dem UI-Thread. Du erstellst einen **animierten Wert**, bindest ihn (oder davon abgeleitete Werte) an eine Style-Eigenschaft und startest eine Animation; ab dann wird jeder Frame nativ berechnet, ohne dass Code der App läuft. Eine ausgelastete Engine oder ein ausgelasteter JS-Thread kann die Animation nicht ruckeln lassen, und eine Animation verursacht der App keinen Aufwand pro Frame. Rust-Code verwendet `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` und `Easing` aus `nsh_core::prelude` und bindet Werte mit den `.bind_*`-Methoden von Elementen; TSX importiert sie aus `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

Den Leitfaden findest du unter [Animation](../docs/animation.md).

<a id="what-an-animated-value-can-drive"></a>

### Was ein animierter Wert steuern kann

| Wo | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | Dasselbe: ein Node aus Farben. `borderColor` färbt jede Seite; `color` eines `Text` färbt den gesamten Text |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (Grad) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` Schritte: `transform: [{ translateX: value }]` |
| Scrollposition | `.scroll_value(&value)` an einer Scroll-View oder einer Liste | `<Scroll scrollValue={value}>` und `<List scrollValue={value}>` schreiben in jedem Frame den Scroll-Offset hinein |
| Gesten | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}` an jedem Element: Die Geste schreibt die Werte direkt (siehe [Touch und Gesten](../docs/touch-and-gestures.md)) |
| Wo Views haften bleiben | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` in einer horizontalen Scroll-View), `.bind_sticky_header_offset(&value)` an einer Liste | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: Sticky-Views und -Header haften so weit vom Anfang des Viewports entfernt und folgen in jedem Frame dem Wert |
| Canvas | ein animiertes Argument eines Painter-Aufrufs | Jedes Zahlen- oder Farbargument eines Zeichenaufrufs im [Canvas](./nsh-canvas.md) |
| Shader | `.uniform(name, &value)` | Ein Member von `struct Uniforms` eines [Shaders](../elements/shader.md): `uniforms={{ name: value }}` (Zahlen oder ein Node aus Farben für ein `vec3f` / `vec4f`) |

Andere Style-Eigenschaften nehmen einfache Werte an; um das Layout selbst zu animieren (Größen, Positionen im Fluss), verwende [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

Erstellt einen animierten Wert, der bei `value` startet (Standard `0`). Rust: `animated_value(value)`, ein `Copy`-Handle, das von der Komponente gehalten wird, die ihn erzeugt hat.

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
> Ein animierter Wert lebt auf dem UI-Thread und ändert sich dort in jedem Frame, daher liest die App ihn asynchron: `await value.getValue()` (oder das `{ value }`, mit dem `stop()` aufgelöst wird) liefert den Wert zu diesem Zeitpunkt, und in Rust `value.value().await` in einem Task. Halte das Ziel in einer Variable oder einem Signal, wenn dein Code es sofort braucht, wie oben. Gesten-Events melden die Werte an ihrem Ende (`PanEvent.value`).

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

| Methode | Rust | Beschreibung |
|---|---|---|
| `set(value)` | `set(value)` | Springt zu `value` und stoppt jede laufende Animation. |
| `stop()` | `stop()`, dann `value().await` | Stoppt die laufende Animation an der aktuellen Stelle; wird mit `{ value }` aufgelöst, dem Wert an dieser Stelle. |
| `getValue()` | `value().await` | Wird mit dem aktuellen Wert (samt Offset) aufgelöst, gelesen auf dem UI-Thread. |
| `setOffset(offset)` | `set_offset(offset)` | Ein Offset, der zum Wert addiert wird: Bindings sehen Wert + Offset; `set`, Animationen und Drags bewegen den Wert. |
| `flattenOffset()` | `flatten_offset()` | Addiert den Offset zum Wert und setzt ihn auf 0. |
| `extractOffset()` | `extract_offset()` | Verschiebt den Wert in den Offset und setzt den Wert auf 0 (ein Drag beginnt dann dort, wo der letzte endete). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | Animiert entlang einer Easing-Kurve zu `to`. `duration` in ms (Standard 300), `easing` (Standard `"easeInOut"`), `delay` in ms (Standard 0). |
| `spring(to, options)` | `spring(to, Spring { … })` | Federt zu `to`. `stiffness` (Standard 170), `damping` (Standard 26), `mass` (Standard 1), `velocity` (Anfangsgeschwindigkeit, Einheiten pro Sekunde). |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Läuft mit `velocity` (Einheiten pro Sekunde) aus und wird um `deceleration` pro Millisekunde langsamer (Standard 0,998). Verwende es nach einem Fling, mit der Geschwindigkeit aus `onPanEnd`. Mit `clamp: [min, max]` stoppt es an einer Grenze oder prallt davon ab und behält dabei `bounce` (0..1, Standard 0) seiner Geschwindigkeit. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | Spielt [Keyframes](#keyframes) so ab, wie CSS-Keyframes abgespielt werden: ein Easing pro Segment, `iterations` Mal in `direction`. |

Jede Animationsmethode gibt ein Promise zurück, das mit `{ finished }` aufgelöst wird: `true`, wenn die Animation beendet wurde, `false`, wenn sie gestoppt wurde (durch `stop`, `set` oder eine andere Animation desselben Werts). In Rust gibt sie ein `AnimationEnd` zurück, das ein Task für dasselbe `bool` erwartet.

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

Ein Node des nativen Animationsgraphen: ein `AnimatedValue` oder ein aus anderen abgeleiteter Wert. Abgeleitete Nodes werden auf dem UI-Thread ausgewertet, sobald sich ihre Eingaben ändern.

| Methode | Rust | Beschreibung |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Bildet die Eingabe über stückweise Bereiche ab. `outputRange` enthält Zahlen, Farben (`"#ff0000"`, `"rgba(…)"`) oder Winkel (`"45deg"`, `"1rad"`). Außerhalb von `inputRange` wird standardmäßig begrenzt; `extrapolate` (oder `extrapolateLeft` / `extrapolateRight`) kann `"extend"` (die Linie fortsetzen), `"clamp"` oder `"identity"` (die Eingabe durchreichen) sein. `easing` formt jedes Segment. Rust nimmt Zahlen, Theme-Farben (die der Darstellung folgen) und Winkel als Grad für `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Folgt den Änderungen der Eingabe, hält das Ergebnis aber innerhalb von `min..max`: ein Header, der sich beim Hochscrollen des Inhalts ausblendet und sofort wiederkommt, sobald nach unten gescrollt wird. `snap: true` lässt ihn in 200 ms an der näheren Grenze einrasten, wenn seine Scroll-View zur Ruhe kommt, bei `max` erst, nachdem die Eingabe `max` erreicht hat. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | Arithmetik mit einem anderen Node oder einer Konstante. |
| `mod(b)` | `modulo(b)` | Modulo, für ein positives `b` nie negativ (hält Winkel in 0..360). |

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

`value.keyframes(frames, options)` spielt einen Wert durch Keyframes ab und wird mit `{ finished }` aufgelöst, das angibt, ob sie abgeschlossen wurden; `Animated.keyframes(value, { keyframes, ...options })` entspricht einem Schritt einer Komposition. Rust: `value.keyframes(frames, KeyframeTiming)` und `Animation::keyframes(&value, frames, KeyframeTiming)` mit `Keyframe::new(value)` (gleichmäßig verteilt), `Keyframe::at(offset, value)` und `.ease(easing)` sowie `KeyframeTiming::new(ms)` mit `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` und `.direction(PlaybackDirection::…)`.

Sie werden abgespielt wie CSS-Keyframes: Ein Easing formt ein Segment (das eines Keyframes ist das Segment, das bei ihm beginnt, das des Timings jedes andere); in Keyframes fehlende Offsets werden gleichmäßig verteilt, der erste bei 0 und der letzte bei 1; jede Iteration beginnt mit einem Sprung zu ihrem ersten Keyframe, und ohne Keyframe bei 0 geht der Wert von seiner aktuellen Position aus; während eines `delay` hält der Wert den ersten Keyframe (CSS `animation-fill-mode: backwards`); rückwärts laufende Iterationen spielen die Segmente rückwärts mit umgekehrten Kurven ab; der Wert bleibt dort, wo die letzte Iteration ihn zurücklässt.

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

Erzeugt eine Motion: pro Kanal von Deckkraft und Transform einer View einen animierten Wert, im Ruhezustand (Deckkraft und Skalierungen 1, die übrigen 0), sowie Motions, die nativ darauf abgespielt werden. Binde sie mit `style={motion.style}` oder verteile `motion.style` oder `motion.transform` in einen Style; der Transform wendet zuerst seine Translationen an, dann seine Rotationen, dann seine Skalierungen, wobei `scale` in `scaleX` und `scaleY` eingerechnet wird: 7 der 8 Transform-Schritte einer View, sodass einer für deinen eigenen bleibt (`[{ perspective: 600 }, ...motion.transform]` für 3D-Flips). `initial` legt fest, wo die Kanäle beginnen (`{ opacity: 0 }`; die übrigen beginnen im Ruhezustand). Mit `enter` beginnen die Kanäle, die sie bewegt, dort, wo diese Motion beginnt (über `initial`), und sie wird sofort abgespielt, wobei die übrigen Optionen ihr Timing bilden (`delay`, `duration`, ...). Eine Motion bewegt nur Deckkraft und Transform: Das Verteilen von `motion.style` setzt das `opacity` der View, binde daher nur `motion.transform`, um eine eigene Deckkraft zu behalten, und bewege Farben mit einem animierten Wert und `interpolate`. Rust: `motion()`, ein `Copy`-Handle, das die Komponente hält, die es erzeugt hat, gebunden mit `.bind_motion(&m)`; `motion().entering(spec)` tritt ein.

| Member | Rust (`Motion`) | Beschreibung |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | Die animierten Werte der Kanäle. |
| `style`, `transform` | `.bind_motion(&m)` am Element | Die Bindings. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | Spielt ein Preset per Name oder eine [`MotionSpec`](#motions) auf den Kanälen ab; eine neue unterbricht die laufende. `options` ändern ihr Timing. Wird mit `{ finished }` aufgelöst: `true`, wenn sie abgeschlossen wurde, `false`, wenn etwas sie gestoppt hat (in Rust `AnimationEnd`). |
| `animation(motion, options?)` | `animation(spec)` | Dieselbe Motion als [`CompositeAnimation`](#animated), nicht gestartet, zum Komponieren: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). Reduzierte Bewegung wird beim Erzeugen entschieden. |
| `stop()` | `stop()` | Hält sie an der aktuellen Stelle an. |
| `reset()` | `reset()` | Hält sie an und setzt jeden Kanal in den Ruhezustand zurück. |

Wenn der Nutzer weniger Bewegung wünscht (`reduceMotion()`), landen `play`, `animation` und `enter` sofort dort, wo die Bewegung endet, ohne sich zu bewegen, es sei denn, `ignoreReduceMotion` ist gesetzt (an den Optionen oder an der Motion).

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

Die vorgefertigten Motions als Daten: `motion.play("shake")` spielt `motions.shake` ab. `MotionName` ist eines von `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (Eintritt); `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (Austritt); `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (Aufmerksamkeit); `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (Schleife). [Animation](../docs/animation.md#presets) beschreibt jede einzelne. Per Spread lässt sich ein Preset ändern: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

Eine `MotionSpec` ist eine eigene Motion: die Keyframes jedes Kanals (`{ opacity: [0, 1], translateY: [24, 0] }`) oder eine Liste von Frames, wie die Web Animations API sie schreibt (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, wobei ein Frame ohne Offset anhand seiner Position in der Liste platziert wird), mit dem [Keyframe-Timing](#keyframes). Rust: `MotionSpec::new(KeyframeTiming)` mit `.values(channel, values)` (gleichmäßig verteilt), `.track(channel, keyframes)` und `.timing(|t| …)`; `MotionPreset::FadeInUp` (oder `.spec()`) ist ein Preset, und `MotionChannel` benennt die Kanäle.

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

`Animated` baut Animationen aus Schritten auf (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...). Nichts läuft, bis `start()` aufgerufen wird; dann läuft der gesamte Baum nativ, und jeder Schritt startet im UI-Thread genau in dem Moment, in dem der vorherige endet (keine Frame-Lücke, kein Roundtrip zum Code der App zwischen den Schritten). Rust baut denselben Baum mit `Animation`.

| Funktion | Rust | Beschreibung |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | Eine Animation eines Werts; dieselben Optionen und Standardwerte wie bei den Methoden von [`AnimatedValue`](#animatedvalue), wobei das Ziel als `toValue` übergeben wird. |
| `sequence(list)` | `Animation::sequence(list)` | Führt die Animationen nacheinander aus. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | Führt sie gleichzeitig aus. Mit `stopTogether` (Standard `true`) stoppt das Stoppen einer Animation alle. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Führt sie parallel aus, wobei jede `ms` nach der vorherigen startet, gezählt ab `from`: `"first"` (Standard), `"last"`, `"center"` (die mittlere startet sofort, die übrigen breiten sich von ihr aus; bei gerader Anzahl starten beide mittleren sofort) oder ein Index (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Ein Wert durch [Keyframes](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | Wartet; nützlich innerhalb von `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | Wiederholt `animation` `iterations` Mal (standardmäßig endlos) und setzt vor jedem Durchlauf seine Werte zurück, es sei denn, `resetBeforeIteration` ist `false`. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | die Node-Methoden | Dasselbe wie die Methoden von [`AnimatedNode`](#animatednode), als Funktionen. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | Die Werte einer Spring- bzw. Decay-Animation, einer pro Frame (siehe [Easing](#easing)). |

`CompositeAnimation`:

| Methode | Rust (`Animation`) | Beschreibung |
|---|---|---|
| `start(callback?)` | `start()`, ein `AnimationEnd` zum Abwarten | Führt sie (erneut) aus. Wird einmal für den gesamten Baum aufgelöst und ruft `callback` auf, mit `{ finished }`: ob sie abgeschlossen wurde, statt gestoppt zu werden. |
| `stop()` | `stop()` | Hält sie an der aktuellen Stelle an. |
| `reset()` | `reset()` | Hält sie an und setzt ihre Werte auf den Stand zurück, den sie beim Start hatten. |

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

Ein Easing sind Daten, keine Funktion der App: Die Runtime wertet es nativ aus. In Rust ist es das Enum `Easing`: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` und `Curve(curve, mode)`, mit einem `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) und einem `EaseMode` (`In`, `Out`, `InOut`). Zum Zeichnen liefert `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) seine Werte an `count` gleichmäßig verteilten Punkten von 0 bis 1; `Animated.sampleSpring` und `Animated.sampleDecay` (`sample_spring`, `sample_decay`) liefern die Werte einer Spring- bzw. Decay-Animation, einen pro Frame (bei `fps`, standardmäßig 60), ab `from` (0) bis zu ihrem Ende. Alle drei stammen aus dem nativen Code, in dem die Animationen laufen. Überall, wo in TSX ein `Easing` akzeptiert wird, kannst du einen Namen (`"easeOut"`), eine kubische Bézier-Kurve als vier Zahlen oder eine Kurve aus dem Objekt `Easing` übergeben.

| Kurve | Rust | Form |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` ist standardmäßig 2) |
| `sin` | `Curve::Sin` | Sinusförmig |
| `circle` | `Curve::Circle` | Kreisförmig |
| `exp` | `Curve::Exp` | Exponentiell |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Federndes Überschwingen (`bounciness` ist standardmäßig 1) |
| `back(s)` | `Curve::Back(s)` | Zieht sich zurück, bevor es losgeht; `s` ist das Überschwingen (Standard 1.70158) |
| `bounce` | `Curve::Bounce` | Springt am Ende nach |

`Easing.steps(count, position)` entspricht CSS `steps()`: Der Wert springt zwischen `count` Stufen, statt sich zu bewegen (ein Sprite Frame für Frame, ein tickender Zeiger). `position` legt fest, wo die Sprünge liegen: `"jump-end"` (Standard, auch `"end"`), `"jump-start"` (`"start"`), `"jump-none"` oder `"jump-both"`; Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

Die Kurven liegen in ihrer „in“-Form vor (langsam am Anfang). `Easing.out(curve)` kehrt eine um, `Easing.inOut(curve)` macht sie symmetrisch, `Easing.in(curve)` belässt sie unverändert; in Rust ist das der `EaseMode` von `Easing::Curve`.

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

`LayoutAnimation.configureNext(config)` animiert die Layout-Änderungen des nächsten Commits nativ: Views, die sich bewegen oder ihre Größe ändern, gleiten zu ihren neuen Frames, neue Views erscheinen (blenden ein oder skalieren ein, je nach `property`) und entfernte Views verschwinden. Rufe es direkt vor der Zustandsänderung auf, die das Layout ändert. Rust: `animate_layout(LayoutAnimation)` mit den Presets von `nsh_core::element::LayoutAnimation` oder dessen Übergängen `create`, `update` und `delete`.

| Member | Rust | Beschreibung |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Animiert die Änderungen des nächsten Commits; `onEnd` wird nach Abschluss ausgeführt. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | Eine Konfiguration, die dieselbe Kurve für alle drei Phasen verwendet. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, Views blenden ein und aus. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms mit konstanter Geschwindigkeit. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms; Frames federn (Dämpfung 0.4), Views blenden linear ein und aus. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | Kurzformen für `configureNext(Presets.…)`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Die Namen als Konstanten. |

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

Die Device-API informiert die App über das Gerät und seine Umgebung. Rust-Code ruft die Funktionen von `nsh_core::prelude` auf (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...); TSX importiert sie aus `nsh`. Die Fenstergröße, das Farbschema, die Schriftskalierung, das Pixelverhältnis, die Locale und der App-Zustand sind reaktiv: Lies sie in einem Binding (in Rust eine Closure, die an ein Element übergeben wird, in TSX JSX), `computed` oder `effect`, und alles, was sie liest, wird aktualisiert, wenn die Plattform eine Änderung meldet (Drehung, Größenänderung des Fensters, Wechsel in den Dark Mode, Änderung der Textgröße oder der Sprache, Wechsel auf einen Bildschirm mit anderer Dichte, Verlassen der App und Rückkehr).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

Den Leitfaden findest du unter [Gerät und Umgebung](../docs/device-and-environment.md).

### windowSize

```ts
const windowSize: Accessor<Size>;
```

Die Größe der Fläche in Punkten: das Fenster oder die eingebettete `NshAppView` / `NshView`. Reaktiv. Rust: `window() -> Size<Points>`.

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

Das angezeigte Erscheinungsbild: das des Systems, sofern die App kein eigenes festgelegt hat (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). Reaktiv. Rust: `dark() -> bool`; Theme-Farben (`AdaptiveColor`) und die Style-Variante `.dark(…)` folgen ihm, ohne es zu lesen. Auch die Variante `dark:` von Tailwind folgt ihm (siehe [Tailwind](../docs/tailwind.md)).

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

Die bevorzugte Textgröße des Nutzers relativ zum Standard (`1` ist die Standardgröße; Dynamic Type unter iOS, Schriftgröße unter Android) oder stattdessen die Textgröße, die die einbettende App festlegt. Reaktiv. Rust: `font_scale() -> f32`. Text skaliert bereits damit, außer bei `allowFontScaling={false}`; lies sie, wenn andere Größen folgen sollen, etwa Icons neben Text.

### locale

```ts
const locale: Accessor<string>;
```

Die Locale des Nutzers als BCP-47-Tag (`"en-US"`, `"zh-Hans-CN"`) oder stattdessen die Locale, die die einbettende App festlegt. Reaktiv. Rust: `locale() -> Locale` (`locale().as_str()` ist der Tag). `Intl` formatiert standardmäßig dafür; lies sie, um die Strings deiner eigenen Übersetzungen auszuwählen ([Gerät und Umgebung](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

Ob die App in Benutzung ist, in den Begriffen von React Native `AppState`: `"active"` im Vordergrund und Eingaben entgegennehmend, `"inactive"` solange sie sichtbar ist, aber nicht den Fokus hat (eine andere App oder ein anderes Fenster hat ihn, oder das System zeigt etwas darüber an, etwa den App-Umschalter oder einen eingehenden Anruf), `"background"` solange sie nicht sichtbar ist (im Hintergrund, minimiert, ein verborgener Browser-Tab). Eine App, die innerhalb einer nativen App angezeigt wird, folgt deren Zustand. Reaktiv. Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`).

Lies es in einem Effect, um Arbeit zu pausieren, die niemand sieht, und sie fortzusetzen, wenn die App zurückkommt:

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

Zeigt die App sofort in `scheme` an, unabhängig vom Erscheinungsbild des Systems: `colorScheme()`, `dark:`-Klassen, das Theme der Komponenten und die Steuerelemente der Plattform (Alerts, der Standardstil der Statusleiste) folgen ihm; `"system"` folgt wieder dem System. `nsh.json` `"appearance"` legt es von Anfang an fest. Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`).
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

Die Plattform, auf der die App läuft; sie bleibt konstant, solange die App läuft.

| Member | Rust | Beschreibung |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` ist der TS-String) | Das Betriebssystem. iOS, der iOS-Simulator und Mac Catalyst melden `"ios"`, Browser `"web"`. |
| `version` | `os_version() -> (u16, u16)` | iOS und Desktops: die OS-Version (`"17.5"`); Android: das API-Level (`"35"`); das Web: `"0.0"`. Rust liefert die Haupt- und Nebenversion bzw. auf Android das API-Level und 0. |
| `idiom` | `idiom() -> Idiom` | Die Art des Geräts: `"desktop"` genau dort, wo `desktop` `true` ist; sonst `"phone"`, `"pad"` (ein iPad, ein Android-Tablet, Mac Catalyst im iPad-Idiom), `"mac"` (Mac Catalyst im Mac-Idiom von UIKit, ein mobiles Idiom) oder `"tv"` (Apple TV, Android TV). |
| `desktop` | `is_desktop() -> bool` | Desktop-Verhalten greift: macOS, Windows, Linux und Browser mit Maus und breitem Fenster. `desktop={{…}}`-Props, `select({ desktop })` und `idiom` `"desktop"` richten sich alle danach. Mac Catalyst nutzt das iOS-Backend und ist daher mobil: `ios={{…}}`-Props gelten dort. Das `isAvailable` von [`nsh/desktop`](./nsh-desktop.md#isavailable) ist die engere Prüfung für dessen Fenster- und Menü-APIs, die macOS, Windows und Linux bieten. |
| `catalyst` | `is_catalyst() -> bool` | Die App läuft unter Mac Catalyst, im Mac- oder im iPad-Idiom (`os` ist `"ios"`). |
| `select(spec)` | `match os() { … }` | Der Wert für diese Plattform (siehe unten). |

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

Gibt den Wert für das aktuelle OS zurück (`ios`, `android`, `web`, ...), sonst `desktop` oder `mobile` (je nach `platform.desktop`), sonst `native` (jede Plattform außer dem Web), sonst `default`, sonst `undefined`. Rust-Code matcht auf `os()` (und `is_desktop()` für `mobile` / `desktop`).

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
> Für Props, die nur eine Plattform hat, sind die Props `ios={{…}}` / `android={{…}}` von TSX-Elementen und -Komponenten dem Verzweigen über `platform` vorzuziehen (siehe [Plattformspezifischer Code](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

Geräte-Pixel pro Punkt (z. B. `3` auf den meisten iPhones). Reaktiv: Der Wert ändert sich, wenn das Fenster auf einen Bildschirm mit anderer Dichte wechselt (auf Mac Catalyst, den Desktops oder einem externen Display) und wenn die Einstellung für die Anzeigegröße von Android die Dichte ändert. Rust: `pixel_ratio() -> f32` und `round_to_nearest_pixel(points)` für eine Länge in ganzen Geräte-Pixeln; in TSX ist diese Länge `Math.round(x * pixelRatio()) / pixelRatio()`.

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

Öffnet `url` außerhalb der App: eine Webseite im Browser, einen `mailto:`-Link in der Mail-App, einen `tel:`-Link in der Telefon-App und jedes Schema, das eine andere App registriert hat (`maps:`, die eigenen `lb://`-Links einer Host-App). Es wird mit `{ opened }` aufgelöst, also damit, ob etwas es geöffnet hat: `false`, wenn keine App das Schema behandelt. Rust: `open_url(url)` von `nsh_core::prelude`, eine Antwort, die man in einem Task awaitet (oder verwirft), dasselbe `bool`.

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

- Die URL ist absolut (sie hat ein Schema). URLs, die Code ausführen oder auf die eigenen Daten der App zugreifen würden, `javascript:`, `data:`, `blob:`, `file:`, `about:` und `asset:`, lehnen das Promise mit einem `TypeError` ab, ebenso relative Adressen. `openUrl` wirft nie: Jeder Fehler lehnt ab.
- Eine App, die Capabilities deklariert, braucht `openUrl`: `"openUrl": true` für jedes Schema oder `"openUrl": { "schemes": ["https", "mailto"] }` für die aufgeführten; andere URLs lehnen mit einem `Error` ab, dessen `code` `"ERR_ACCESS_DENIED"` ist, `permission` `"openUrl"` und `resource` die URL (siehe [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md)). In Rust antwortet `open_url` dafür mit `false` und protokolliert den Grund.
- Die einbettende App sieht die URL zuerst und kann sie stattdessen über ihren eigenen Router leiten (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; siehe [iOS](../docs/ios.md#links-the-app-opens) und [Android](../docs/android.md#links-the-app-opens)). `opened` ist dann `true`.
- Jede Plattform öffnet sie mit ihrem eigenen Opener: `UIApplication.open` auf iOS (die Application der Host-App, wenn eingebettet), ein `ACTION_VIEW`-Intent auf Android, `NSWorkspace` auf macOS, `ShellExecuteW` auf Windows, `GtkUriLauncher` auf Linux, `open_url` von GPUI, ein neuer Tab im Web. `nsh test` zeichnet die URLs auf, statt sie zu öffnen.
- Ein [`TextView`](../elements/text-view.md) öffnet seine Links auf diese Weise mit `links="open"`.

<a id="layout-direction"></a>

### Layout-Richtung

Die Layout-Richtung folgt der Sprache des Benutzers: In einer Rechts-nach-links-Sprache (Arabisch, Hebräisch, ...) wird die App von rechts nach links angeordnet, Zeilen beginnen rechts, und die Style-Eigenschaften `left` / `right` (`marginLeft`, `paddingRight`, ...) bedeuten Anfang und Ende. Änderungen wirken sofort, ohne Neustart.

Der Style `direction` einer View (`"ltr"`, `"rtl"` oder `"inherit"`, der Standard) legt die Richtung ihres eigenen Teilbaums fest; in Rust `.direction(LayoutDirection::..)`.

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

### Siehe auch

- Safe-Area-Insets (Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`) und die Software-Tastatur (Rust `keyboard_height()`; TSX `keyboardFrame()`) stehen unter [Safe Area und Tastatur](#safe-area-and-keyboard).
- Einstellungen für Screenreader und reduzierte Bewegung stehen unter [Barrierefreiheit](#accessibility).

## PanResponder

Pan Responder sind Drag-Gesten auf dem Gesture-Responder-System: Das Element beansprucht die Touches einer Geste und hört sie dann allein, zusammen mit dem Gesture-State, der den Schwerpunkt der Touches, die zurückgelegte Distanz und die Geschwindigkeit automatisch nachverfolgt. Rust-Code beansprucht sie mit `.claim_touches(TouchClaim::…)` und empfängt sie mit `.on_responder_*`-Listenern, deren `ResponderEvent` einen `PanGesture` trägt, alles in `nsh_core::prelude`; TSX importiert `PanResponder` aus `nsh`, dessen `onPanResponder…`-Callbacks das Touch-Event und den Gesture-State erhalten.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Ein Pan Responder liefert jede Bewegung an den Code der App und eignet sich daher für Gesten, die den App-Zustand ändern (Umsortieren, Swipe-to-Delete-Entscheidungen). Um eine View mit dem Finger zu bewegen, sind die nativen Gestenwerte schneller: `.pan_values(x, y)`, `.pinch_value(scale)` und `.rotation_value(angle)` in Rust, die Props `pan={{ x, y }}`, `pinch` und `rotation` in TSX. Das Ziehen schreibt [animierte Werte](#animation) im UI-Thread, und die App erfährt nur, wann es beginnt und endet (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`). Siehe [Touch und Gesten](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Erstellt einen Pan Responder. Sein `panHandlers` wird per Spread auf die View gesetzt, die die Geste erhalten soll. In Rust beansprucht die View die Touches und hört selbst zu:

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

Jeder Callback erhält das Touch-Event (`GestureResponderEvent`, aus [`nsh`](#types)) und den Gesture-State. In Rust entscheidet ein Claim mit `.ask(|request: &ClaimRequest| …)` und ruft `request.claim()` auf, um die Touches zu übernehmen (ohne `ask` übernimmt er sie immer), und jeder Listener erhält einen `ResponderEvent`, dessen `gesture` der State ist.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Callback | Rust | Rückgabe | Aufgerufen, wenn |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | Ein Finger setzt auf: `true` zurückgeben, um Responder zu werden. Wird von der berührten View nach außen abgefragt. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | Dasselbe, aber von außen nach innen und vor der Bubbling-Variante abgefragt (ein Parent übernimmt die Geste von seinen Children). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | Ein Finger bewegt sich: `true` zurückgeben, um Responder zu werden (z. B. erst bei `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | Dasselbe, Capture-Phase. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | Diese View ist jetzt der Responder: Die Geste beginnt. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | Eine andere View ist der Responder und gibt ihn nicht ab. |
| `onPanResponderStart` | `.on_responder_start(…)` | | Ein weiterer Finger setzt auf, während die View Responder ist. |
| `onPanResponderMove` | `.on_responder_move(…)` | | Die Finger haben sich bewegt. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | Ein Finger wurde angehoben, während die View Responder ist. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | Der letzte Finger wurde angehoben: Die Geste ist beendet. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | Eine andere View (oder eine native Geste, etwa eine Scroll View) hat die Touches übernommen. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` behält sie | `boolean` | Eine andere View will die Touches: `false` zurückgeben, um sie zu behalten (Standard `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | Ob native Scroll Views daran gehindert werden, die Touches zu übernehmen, solange die View Responder ist (Standard `true`). |

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

Rust: `PanGesture`, mit Punkten als `Point<Points>`.

| Feld | Rust | Beschreibung |
|---|---|---|
| `stateID` |  | Identifiziert die Geste. |
| `moveX`, `moveY` | `position` | Letzte Position des Schwerpunkts der Touches, in Punkten der Oberfläche. |
| `x0`, `y0` | `origin` | Wo der Schwerpunkt war, als der Responder gewährt wurde. |
| `dx`, `dy` | `delta` | Zurückgelegte Distanz seit der Gewährung. |
| `vx`, `vy` | `vx`, `vy` | Geschwindigkeit in Punkten pro Sekunde. |
| `numberActiveTouches` | `active_touches` | Aufgesetzte Finger. |

<a id="inside-scroll-views"></a>

### In Scroll Views

Solange ein Pan Responder der Responder ist, scrollen native Scroll Views um ihn herum nicht (`onShouldBlockNativeResponder` ist standardmäßig `true`). Damit ein horizontaler Swipe mit vertikalem Scrollen koexistieren kann, wird die View nur bei horizontalen Bewegungen zum Responder:

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

Bei einem Pan, den die Plattform erkennt, entscheidet `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` im Main-Thread, während sich die Finger bewegen. Die zugrunde liegenden Responder-Props (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) lassen sich auch direkt auf jedem Element verwenden; siehe [Elemente](../elements/index.md).

## Clipboard

Die Clipboard-API liest und schreibt die System-Zwischenablage: Text überall (`UIPasteboard` auf iOS, `ClipboardManager` auf Android, `NSPasteboard`, GDK und die Win32-Zwischenablage auf Desktops, `navigator.clipboard` im Web), Bilder auf iOS, den Desktops und im Web sowie die in einem Dateimanager kopierten Dateien auf den Desktops und Mac Catalyst. Rust-Code ruft die Funktionen von `nsh_core::prelude` auf (`set_clipboard`, `clipboard_string`, ...); TSX importiert `Clipboard` aus `nsh`.

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

Die Rust-Lesefunktionen liefern Antworten, die man in einem Task awaitet (`spawn` oder eine Modulfunktion von `async`); `ClipboardImage` ist `nsh_core::element::ClipboardImage`, mit `url` und `size` (ein `Size<DevicePixels>`).

Bilder laufen auf iOS, den Desktops und im Web über die Zwischenablage. Auf Android enthält die Zwischenablage Text: `writeImage` und
`readImage` lehnen mit einem `Error` ab, dessen `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` ist, und `hasImage` wird mit
`false` aufgelöst. In Rust lässt `set_clipboard_image` dort die Zwischenablage unverändert, und `clipboard_image` antwortet `None`.

Der Benutzer kann auch selbst aus einem [auswählbaren Text](../elements/text.md) kopieren; die Clipboard-API dient dem Kopieren aus Code, etwa für einen Kopieren-Button.

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

Legt `text` in die Zwischenablage und ersetzt deren bisherigen Inhalt. Rust: `set_clipboard(text)`.

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

Wird mit dem Text der Zwischenablage aufgelöst, oder mit `""`, wenn sie keinen enthält. Rust: `clipboard_string()`. Auf iOS kann das Lesen der Zwischenablage den System-Hinweis zum Einfügen anzeigen („App pasted from …“), und auf Android 10 und höher kann nur die App im Vordergrund sie lesen. Sie sollte gelesen werden, wenn der Benutzer das Einfügen anfordert, nicht auf jedem Screen.

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

Wird damit aufgelöst, ob die Zwischenablage Text enthält, ohne ihn zu lesen: kein Einfüge-Hinweis auf iOS. Rust: `clipboard_has_string()`. Damit lässt sich entscheiden, ob ein Einfügen-Button angezeigt wird. Im Web erfahren Browser es nur durch Lesen, daher kann dabei der Benutzer um Erlaubnis gefragt werden.

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

Wird mit dem Bild der Zwischenablage aufgelöst, oder mit `null`, wenn sie keines enthält: ein eingefügter Screenshot oder ein in einem Browser
oder Bildeditor kopiertes Bild. Rust: `clipboard_image()`, `None`, wenn sie keines enthält. `url` ist eine URL des Bildes (PNG oder das eigene JPEG, GIF, WebP oder BMP der
Zwischenablage), das ein [`Image`](../elements/image.md) als sein `src` anzeigt und `fetch` liest:
`fetch(url)` liefert seine Bytes, für einen Upload. `size` (`width` und `height`) ist seine Größe in Pixeln, wie dekodiert. Wie bei
`readText` sollte es gelesen werden, wenn der Benutzer das Einfügen anfordert. Bilder bis 48 MB (kodiert) werden gelesen, damit das Bild in den
Speicher der App passt; ein größeres lehnt mit einem `Error` ab, dessen `code` `"ERR_NSH_QUOTA_EXCEEDED"` ist (die Meldung nennt die
Größe des Bildes und das Limit), während `hasImage` mit `true` aufgelöst wird. Rust: `clipboard_image()` antwortet dafür `None`.

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

Eine Chat-App, in der Benutzer Screenshots in ein Eingabefeld einfügen, bindet den Einfügen-Shortcut, solange ihr Input den Fokus hat,
und übernimmt das Bild, falls vorhanden:

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

Wird damit aufgelöst, ob die Zwischenablage ein Bild enthält, ohne es zu lesen: kein Einfüge-Hinweis auf iOS. Rust:
`clipboard_has_image()`. Auf Android wird mit `false` aufgelöst.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

Legt das Bild von `src`, einer base64-`data:`-URL oder der `url`, die `readImage` lieferte, in die Zwischenablage und ersetzt deren Inhalt.
Rust: `set_clipboard_image(src)`. Auf Windows nimmt es ein PNG, das Format, das Browser, Office und das Snipping Tool lesen. Auf
Android lehnt es mit `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` ab.

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

Wird mit den `file:`-URLs der in einem Dateimanager (Finder, Explorer, Files) kopierten Dateien und Ordner aufgelöst, in ihrer
Reihenfolge, oder mit `[]`: dieselben URLs, die ein [Datei-Drop](../elements/view.md#desktop-file-drops) liefert. Rust: `clipboard_files()`.
Eine URL lässt sich parsen, um ihren Pfad zu erhalten.

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
> Deklariert die App `capabilities` in `nsh.json`, muss die Zwischenablage mit `"clipboard": true` freigegeben werden. Ohne das lehnt jede Funktion von `Clipboard` mit einem `Error` ab, dessen `code` `"ERR_ACCESS_DENIED"` ist, `permission` `"clipboard"` und `resource` `""`, und nichts erreicht die System-Zwischenablage. In Rust lassen die Schreibfunktionen die Zwischenablage unverändert, und die Lesefunktionen antworten, was eine leere Zwischenablage antwortet (`""`, `None`, eine leere Liste, `false`), und die Ablehnung wird protokolliert. Siehe [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md).
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

Die Picker-API zeigt den Foto-Picker des Systems an und gibt der App die Bilder, die der Nutzer auswählt: den Photos-Picker unter iOS (`PHPickerViewController`), den Photo Picker unter Android, einen Öffnen-Dialog bzw. Dateidialog auf den Desktop-Plattformen und ein File-Input im Browser. Unter iOS und Android läuft der Picker außerhalb der App und übergibt nur das, was der Nutzer auswählt. Deshalb braucht er keine Berechtigung für die Fotomediathek. Jedes ausgewählte Bild kommt als `File` (TSX) bzw. `PickedFile` (Rust) an, dessen Bytes nativ bleiben: Zeige es mit `URL.createObjectURL(file)` in einem [`Image`](../elements/image.md) an, lade es mit `fetch` und `FormData` hoch. Rust-Code ruft `pick_images` von `nsh_core::prelude` auf; TSX importiert `Picker` aus `nsh`.

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
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 für bis zu 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

Zeigt den Picker an und löst mit den Bildern auf, die der Nutzer ausgewählt hat, in der Reihenfolge der Auswahl, oder mit `[]`, wenn der Nutzer abbricht.
Rust: `pick_images(request)`, eine Antwort, auf die in einem Task gewartet wird (`spawn` oder eine Modulfunktion von `async`). `pickImages`
wirft nie: Optionen außerhalb des gültigen Bereichs (`limit: 0`, ein `quality` außerhalb von 0 bis 1) lehnen das Promise mit einem `RangeError` ab, und eine Auswahl, die die Capabilities der App nicht erlauben, lehnt mit `ERR_ACCESS_DENIED` ab (siehe unten). Ein Abbruch ist die Antwort des Nutzers, kein Fehler: Das Promise wird dann mit `[]` aufgelöst.

Die Bilder kommen versandfertig an:

- **Formate, die jeder Browser und Server akzeptiert.** JPEG, PNG, GIF und WebP kommen unverändert an; ein Foto, das in einem anderen Format gespeichert ist (HEIC auf iPhones, HEIF, TIFF), kommt als JPEG an. `format: "current"` behält das gespeicherte Format bei.
- **Nativ verkleinert.** Mit `maxDimension` wird ein Bild, dessen längere Seite größer ist, aufrecht auf diesen Wert verkleinert und neu kodiert: ein PNG als PNG, alles andere als JPEG mit `quality`. Handyfotos haben 12 bis 48 Megapixel; wenn man sie vor einem Upload auf 2048 Pixel verkleinert, werden daraus wenige hundert Kilobyte. Auch ein `quality` kodiert JPEGs neu.
- **Was angezeigt wird.** `size` ist die Größe des Bildes in Pixeln, wie es angezeigt wird, mit angewendeter Kameraausrichtung. Ein Bild, das NSH neu kodiert, enthält keine Metadaten (keinen Standort); ein Bild, das unverändert ankommt, behält seine eigenen.

Unter Windows, Linux und in GPUI-Fenstern bietet der Dialog die Formate an, die die Anfrage akzeptiert (mit `"compatible"`: JPEG, PNG, GIF und WebP), und die Dateien kommen so an, wie sie gespeichert sind, in ihrer eigenen Größe.

Ein Chat-Composer hängt ein Foto an, zeigt es an, während die Nachricht geschrieben wird, und lädt es hoch, wenn sie gesendet wird:

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

Mehrere Fotos auf einmal:

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

### Einbettende Apps

Eine App, die NSH einbettet und einen eigenen Picker hat (zum Beispiel einen mit den eigenen Alben der App), beantwortet die Auswahlen selbst: In Rust erhält ein `PickerBackend` (`nsh_core::picker`), das der Engine übergeben wird (`EngineConfig::picker`, oder `AppView::set_picker` in
GPUI- und GPUI-Kit-Apps), das `PickRequest` jeder Auswahl und gibt die Dateien zurück; der Picker des Systems wird dann nicht angezeigt. Die zurückgegebenen Dateien werden wie die der Plattform vervollständigt: auf das Limit der Anfrage gekürzt, ihre Größen, Typen und Erweiterungen aus ihren Bytes gelesen.

### Tests

`nsh test` beantwortet Auswahlen in Headless-Läufen: `app.onPick(handler)` gibt die Dateien zurück, die der Nutzer auswählt (`{ name, type, data }`),
und ohne Handler wird eine Auswahl abgebrochen. Siehe [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Wenn deine App `capabilities` in `nsh.json` deklariert, muss der Picker mit `"picker": true` freigegeben werden. Ohne diese Freigabe zeigt
> `pickImages` nichts an und lehnt mit einem `Error` ab, dessen `code` `"ERR_ACCESS_DENIED"` ist, `permission`
> `"picker"` und `resource` `""`. In Rust liefert `pick_images` keine Dateien, und die Verweigerung wird protokolliert. Siehe
> [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md).

## Speech

Die Speech-API wandelt das, was der Nutzer sagt, in Text um (Diktat): Die App startet eine Sitzung, die Plattform hört das Mikrofon ab, und das Transkript kommt an, während es wächst. macOS und iOS erkennen mit dem Speech-Framework des Systems; das System fragt den Nutzer einmalig nach dem Mikrofon und nach der Spracherkennung. Auf anderen Plattformen endet eine Sitzung sofort mit dem Fehler `"unavailable"`. Prüfe daher `Speech.available()`, bevor du eine Mikrofon-Schaltfläche anzeigst. Rust-Code ruft
`recognize_speech` von `nsh_core::prelude` auf; TSX importiert `Speech` aus `nsh`.

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
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (Verwerfen bricht ab) |

### Speech.start

Startet eine Sitzung und gibt sie sofort zurück. Eine Sitzung meldet in dieser Reihenfolge: `start`, wenn das Mikrofon an ist und der Recognizer zuhört, `result` jedes Mal, wenn sich das Transkript ändert (`text` ist immer das gesamte bisherige Transkript, die App zeigt es also unverändert an), und genau ein `end`, danach kommt nichts mehr. `stop()` hört auf zuzuhören und lässt den Recognizer verarbeiten, was er gehört hat: ein letztes Ergebnis mit `isFinal: true`, dann `end`. `abort()` beendet die Sitzung sofort und ohne Fehler und verwirft, was nicht gemeldet wurde. Es läuft jeweils nur eine Sitzung: Wer eine weitere startet, bricht die laufende ab.

`end` enthält das letzte Transkript und, wenn die Sitzung fehlgeschlagen ist, `error`, benannt wie in der Web Speech API:

| `error` | Wann |
|---|---|
| `"not-allowed"` | Der Nutzer oder das System erlaubt das Mikrofon oder die Spracherkennung nicht. |
| `"no-speech"` | Es wurde nichts gesagt. |
| `"audio-capture"` | Das Mikrofon konnte nicht verwendet werden. |
| `"network"` | Der Recognizer braucht das Netzwerk und konnte es nicht erreichen. |
| `"language-not-supported"` | Der Recognizer kennt `lang` nicht. |
| `"unavailable"` | Diese Plattform erkennt keine Sprache, oder gerade nicht. |
| `"failed"` | Der Recognizer ist aus einem anderen Grund fehlgeschlagen. |

`start` wirft einen `TypeError` bei Optionen mit falschen Typen und einen `RangeError` bei einem `lang`, das kein Sprach-Tag ist.

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

Löst mit `true` auf, wo eine Sitzung laufen kann: unter macOS und iOS sowie überall dort, wo die einbettende App Sprache selbst erkennt.

### Info.plist

Unter macOS und iOS zeigt das System an, warum die App das Mikrofon und die Spracherkennung möchte. `nsh package` und
`nsh run` schreiben `NSMicrophoneUsageDescription` und `NSSpeechRecognitionUsageDescription` in die Info.plist der App,
wenn die App Sprache verwenden darf (ihre `capabilities`-Freigabe `speech`, oder sie deklariert keine).

<a id="embedding-apps-1"></a>

### Einbettende Apps

Eine App, die NSH einbettet und Sprache auf eigene Weise erkennt (mit einer eigenen Engine oder einem eigenen Dienst), beantwortet die Sitzungen selbst: In Rust erhält ein `SpeechBackend` (`nsh_core::speech`), das der Engine übergeben wird (`EngineConfig::speech`), das
`SpeechRequest` jeder Sitzung und einen `SpeechSink`, an den es aus jedem Thread berichtet, und gibt das `SpeechControl` zurück, mit dem der Core die Sitzung stoppt und
abbricht. Der Recognizer der Plattform wird dann nicht verwendet.

### Tests

`nsh test` führt Sitzungen in Headless-Läufen auf einem Fake-Recognizer aus: Eine Sitzung startet sofort, `app.hear(text)` meldet
`text` als bisheriges Transkript, `app.endSpeech(error?)` beendet sie, und `app.speechRequests()` listet die Sitzungen auf, die die
App gestartet hat. Siehe [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Wenn deine App `capabilities` in `nsh.json` deklariert, muss Speech mit `"speech": true` freigegeben werden. Ohne diese Freigabe
> wirft `Speech.start` einen `Error`, dessen `code` `"ERR_ACCESS_DENIED"` ist, `permission` `"speech"` und `resource` `""`.
> In Rust endet die Sitzung mit `not-allowed`, und die Verweigerung wird protokolliert. Siehe
> [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md).

## Storage

Die Storage-API hält die Daten der App auf dem Gerät: Strings unter einem String-Schlüssel, die beim nächsten Start der App noch da sind. Verwende sie für Einstellungen, Entwürfe, den zuletzt geöffneten Tab des Nutzers, einen Cache dessen, was der Server gesendet hat – jeden Zustand, der den Prozess der App überdauern soll. Rust-Code verwendet `nsh_core::storage::Storage`, TSX importiert `Storage` aus `nsh`; beide lesen und schreiben dieselben Einträge, sodass eine App mit einem Rust-Einstiegspunkt und einem TSX-Einstiegspunkt einen gemeinsamen Datenbestand sieht.

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

Die Rust-Funktionen sind synchron, da die Einträge im Speicher liegen: Rufe sie dort auf, wo Komponenten laufen (in ihren Rümpfen, Handlern und Tasks).

Jede App hat einen eigenen Storage mit bis zu 5 MB an Schlüsseln und Werten. Aufrufe laufen in der Reihenfolge, in der die App sie macht, sodass ein `getItem` nach einem `setItem` den neuen Wert sieht, ohne auf das Schreiben zu warten. Lesezugriffe kommen aus dem Speicher; Schreibzugriffe erreichen den Datenträger im Hintergrund, jeweils einige auf einmal.

| Plattform | Wo die Daten liegen |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` im Container der App |
| Android | `files/nsh/<app id>/storage.json` im privaten Verzeichnis der App |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | Der `localStorage` des Browsers, unter Schlüsseln, die nach der App-ID benannt sind (`nsh:com.example.todo:…`) |

Eine beschädigte `storage.json` wird daneben als `storage.json.corrupt` aufbewahrt, und die App startet mit einem leeren Storage; eine Datei, die nicht gelesen werden kann, lässt die Änderungen der App im Speicher, sodass die Datei nie ersetzt wird.

Die App-ID ist die `id` in `nsh.json` und reist mit der App: `nsh build` und `nsh package` schreiben sie neben das Bundle, der Dev-Server sendet sie, und ein signiertes Paket trägt die ID, für die das Zertifikat seines Release-Schlüssels bürgt. So behält jede App ihre eigenen Daten ohne Einstellung, wo auch immer sie läuft; eine App ohne ID behält sie unter `default`. Eine einbettende App kann einen anderen Ort wählen (siehe [Einbetten unter iOS](../docs/ios.md) und [Einbetten unter Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

Löst mit dem Wert von `key` auf, oder mit `null`, wenn er keinen hat. Rust: `Storage::get_item(key)`, `None`, wenn er keinen hat.

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

Setzt `key` auf `value` und ersetzt, was er enthielt. Lehnt mit einem `Error` ab, dessen `code` `"ERR_NSH_QUOTA_EXCEEDED"` ist, wenn der Storage über 5 MB hinauswachsen würde; der Wert wird dann nicht behalten. Rust: `Storage::set_item(key, value)`, das dann `Err(StorageFull)` zurückgibt. Werte sind Strings: Halte strukturierte Daten als JSON (`serde_json::to_string` in Rust, `JSON.stringify` in TSX) und lies sie wieder ein (`serde_json::from_str`, `JSON.parse`).

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

Entfernt `key` und seinen Wert. Das Entfernen eines Schlüssels ohne Wert bewirkt nichts. Rust: `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

Löst mit allen Schlüsseln auf, in der Reihenfolge. Rust: `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

Entfernt jeden Schlüssel der App, zum Beispiel wenn sich der Nutzer abmeldet. Rust: `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### Ein Signal auf dem Gerät behalten

Lies den gespeicherten Wert beim Start der App und schreibe ihn zurück, sobald sich das Signal ändert:

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

`host` erreicht die App, die NSH einbettet: die native App um ein `NshAppView` / `NshView` herum, oder im Web die Seite, die den Player ausführt. Die App ruft die Funktionen des Hosts per Name mit JSON-Argumenten auf und hört auf die Ereignisse, die der Host sendet.

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

Gibt an, ob die Plattform einen Host hat, der Aufrufe beantwortet. Im Web ist es `true`, wenn die Seite dem Player einen Host gibt ([Der Host im Web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

Ruft die Funktion `name` des Hosts mit `args` auf (ein beliebiger JSON-Wert; `null` ohne einen) und löst mit dem auf, was sie zurückgibt. `host.call` wirft nie: Jeder Fehler lehnt das Promise ab, und zwar mit einem `Error`, dessen `code` angibt, was passiert ist (die Meldung ist für Menschen gedacht und kann sich ändern):

| `code` | Wann |
|---|---|
| `ERR_NSH_HOST_ERROR` | Die Funktion des Hosts ist fehlgeschlagen, oder der Host hat keine Funktion `name`; die Meldung stammt vom Host |
| `ERR_ACCESS_DENIED` | `name` steht nicht in der [`host`-Capability](#capability) der App; `permission` ist `"host"`, `resource` der Name |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | Die Plattform hat keinen Host: `host.available()` ist `false` |
| `ETIMEDOUT` | Der Host hat nicht rechtzeitig geantwortet |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 Aufrufe warten bereits auf die Antworten der einbettenden App |

Ein Name, der kein gültiger Name ist (1 bis 128 aus `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`, ohne `..`), lehnt mit einem `TypeError` ab.

Ein Aufruf wartet 30 Sekunden auf die Antwort des Hosts und lehnt dann mit `ETIMEDOUT` ab; eine Antwort, die später kommt, wird verworfen. `options.timeout` legt die Wartezeit in Millisekunden fest, `0` für kein Limit; ein Timeout, der so groß ist, dass die Uhr ihn nie erreicht (etwa 1e22 ms), wartet ebenfalls ohne Limit, und ein negativer, `NaN`- oder unendlicher Wert lehnt den Aufruf mit einem `RangeError` ab. Die Zeit ist die der App, wie bei ihren Timern: In `nsh test` mit einer manuellen Uhr bewegt sie sich mit der Uhr.

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

Plattformereignisse rufen `listener` mit der Nutzlast jedes `event` auf, das der Host sendet, bis die Funktion aufgerufen wird, die `host.on` zurückgibt; ein Listener, der während des Renderns einer Komponente hinzugefügt wird, endet mit der Komponente. Ereignisse, die der Host sendet, bevor die App startet, kommen an, sobald sie startet, sodass Listener, die auf der obersten Ebene der App registriert werden, sie erhalten; ein Ereignis, das vor der Registrierung eines Listeners gesendet wurde, wird ihm nicht erneut zugestellt. Lies den Zustand, mit dem die App startet, über `host.call` und verfolge seine Änderungen mit `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
### Capability

Jede Funktion, die die App aufruft, muss im `capabilities.host` von `nsh.json` aufgeführt sein: genaue Namen oder Präfixe, die auf `*` enden, oder `true` für alle. Das gilt für jede App, auch für eine ohne weitere `capabilities`: Die Funktionen des Hosts werden nie standardmäßig freigegeben. Ein nicht freigegebener Aufruf wird mit `ERR_ACCESS_DENIED` abgelehnt und protokolliert, ein `host.post` eines solchen Namens an eine einbettende App löst denselben Fehler aus, und das Bauen einer App, die `host` aus `nsh` importiert, ohne `capabilities.host` gibt eine Warnung aus. Events benötigen keine Freigabe. Siehe [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### Der Host im Web

Im Web ist die Seite der Host. Die Option `host` von `createPlayer` beantwortet die Aufrufe, und `player.hostEvent(event, payload)` sendet Events:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

Eine veröffentlichte App benennt ihren Host in `nsh.json`: `web.host` ist ein JS-Modul im Verzeichnis der App, relativ zu `nsh.json`, das `createHost(player)` exportiert; dieses gibt das Objekt mit `call` zurück. `nsh package --target web` liefert es mit der Site aus, `nsh run --target web` führt es auf der Entwicklungsseite aus, und `nsh test` führt es für die Apps aus, die seine Tests öffnen. `web.connect` listet die Hosts auf, die die eigenen Anfragen des Hosts erreichen und die die Content-Security-Policy der Seite neben dem `capabilities.network` der App erlaubt. Siehe [Web](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

Die Parameter, die die einbettende App gesetzt hat, bevor sie Ihre App gestartet hat, synchron lesbar ab der ersten Zeile Ihres Codes; `{}`, wenn sie keine gesetzt hat. Sie bleiben gleich, solange Ihre App läuft: Spätere Anfragen kommen als Events.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```


<a id="native-sdk-channel"></a>

### Native-SDK-Kanal

Der `send` des nativen SDK behält Events, bis die App zuhört, bis zu 256. Stoppt der letzte Listener während der Zustellung, warten die verbleibenden Events der Reihe nach weiter; Events, die während des Herunterfahrens gesendet werden, warten auf die nächste geladene App. `host.post(name, data)` übergibt Daten an den Handler des nativen SDK, dessen `isPost` Posts von Aufrufen unterscheidet.

<a id="the-embedding-apps-side"></a>

### Die Seite der einbettenden App

Jede View führt einen Kanal für jede App, die sie lädt. Setzen Sie Parameter vor dem Laden, senden Sie Events jederzeit von jedem Thread aus und registrieren Sie Handler nach Namen. Aufrufe und Posts erfordern die `capabilities.host`-Freigabe der App. Handler antworten einmal, sofort oder später; eine Antwort, die nie kommt, lässt den Aufruf fehlschlagen.

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

Siehe [Einbettung unter iOS](../docs/ios.md#talking-to-the-app), [Einbettung unter Android](../docs/android.md#talking-to-the-app) und [GPUI](../docs/gpui.md).

> [!NOTE]
> Aufrufe und Posts des nativen SDK verwenden dieselbe [`host`-Capability](../docs/sandbox-and-capabilities.md#host) wie Plattformaufrufe. Eine Rust-App erreicht das Rust der einbettenden App direkt über die Funktionen, die diese registriert ([`nativeModule`](#nativemodule) und Rust-Importe).

## keymap

Die Keymap bindet die Tastenkürzel der App: einen Tastenanschlag wie `"mod+k"` und die Funktion, die er ausführt. Rust-Code ruft `on_key`, `on_key_with` und `key_label` aus `nsh_core::prelude` auf; TSX importiert `keymap` aus `nsh`. Beide akzeptieren dieselben Tastenanschläge und folgen denselben Regeln.

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
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when` ist `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | ein `on_key` pro Tastenanschlag |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Eine Rust-Bindung lebt so lange wie die Komponente (der Owner), die sie erstellt hat; der Handler erhält den Tastenanschlag so, wie er geschrieben wurde.

Tastenkürzel funktionieren unter macOS, Windows, Linux und in Browsern (die browsereigenen Tasten wie Ctrl+T oder Cmd+W erreichen die Seite nie) sowie unter iOS und Android mit einer Hardware-Tastatur: der eines iPad, der eines Macs, der eine iPad-App ausführt, der eines Tablets oder Chromebooks, der des Simulators und des Emulators. Derselbe Code läuft überall; ohne Tastatur löst keine Taste die Bindungen aus.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

Führt `handler` aus, wenn `keystroke` gedrückt wird, und gibt eine Funktion zurück, die die Bindung entfernt. Der Handler erhält `{ keystroke }`: den Tastenanschlag so, wie Sie ihn geschrieben haben, in dessen Schreibweise. Rust: `on_key(keystroke, handler)`, dessen Handler den Tastenanschlag selbst erhält.

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

Übergeben Sie ein Objekt, um mehrere Tastenanschläge auf einmal zu binden; die zurückgegebene Funktion entfernt sie alle. In Rust ist jeder Tastenanschlag ein eigenes `on_key`:

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

Eine Bindung, die erstellt wird, während eine Komponente rendert, wird mit der Komponente entfernt, sodass die Tastenkürzel eines Screens so lange leben wie der Screen:

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

Beim Dev-Server entfernt das Bearbeiten eines Moduls die Bindungen, die sein Top-Level-Code erstellt hat, bevor er erneut läuft, sodass Hot Reload nie veraltete Tastenkürzel zurücklässt.

### keymap.label

```ts
label(keystroke: string): string;
```

Gibt `keystroke` so zurück, wie Menüs und Hinweise es dort anzeigen, wo die App läuft: `"⇧⌘L"` unter macOS und iOS (und in einem Browser auf einem Mac, iPhone oder iPad), `"Ctrl+Shift+L"` unter Windows, Linux und in anderen Browsern, für `"mod+shift+l"`. Rust: `key_label(keystroke)`. Verwenden Sie es, um die Tastenkürzel einer App mit den Tasten anzuzeigen, die tatsächlich funktionieren:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

Bei einem ungültigen Tastenanschlag löst es einen Fehler (`TypeError`) aus, ebenso wie `bind`; `key_label` und `on_key` lösen eine Panic mit derselben Meldung aus.

<a id="keystrokes"></a>

### Tastenanschläge

Ein Tastenanschlag besteht aus Modifikatoren und einer Taste, verbunden durch `+`: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command und Minus).

| Modifikator | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (auch `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (auch `command`, `meta`, `super`, `win`) | Command (⌘) | Windows-Taste | Super |
| `ctrl` (auch `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (auch `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS folgt macOS (`mod` ist Command) und Android folgt Windows und Linux (`mod` ist Ctrl, `cmd` die Meta-Taste). In einem Browser richten sich die Tasten nach der Plattform, auf der der Browser läuft: `mod` ist Command auf einem Mac, iPhone oder iPad und anderswo Ctrl.

Verwenden Sie `mod` für die eigenen Tastenkürzel einer App: Es ist die Taste, die die Apps jeder Plattform dafür nutzen (⌘K unter macOS, Ctrl+K unter Windows und Linux), sodass eine Schreibweise überall passt. Die Windows-Taste und Super gehören meist dem System, daher ist `cmd` außerhalb von macOS selten richtig.

Die Taste ist eine Buchstaben-, Ziffern- oder Satzzeichentaste, geschrieben als das Zeichen, das sie auf einer US-Tastatur ohne Shift erzeugt (`k`, `1`, `,`, `/`, `[`; `"shift+/"` für `?`, `"shift+k"` für Shift+K), oder ein Name: `plus` (die Taste `=` / `+`, auch `=` geschrieben), `minus` (auch `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, die Pfeiltasten `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1` bis `f24`. Groß- und Kleinschreibung spielt keine Rolle: `"Mod+Shift+K"` ist `"mod+shift+k"`, und ein Großbuchstabe ist dieselbe Taste, nicht Shift (`"mod+K"` ist `"mod+k"`). Kleinschreibung ist der empfohlene Stil, den diese Seiten verwenden. `"mod-k"` und `"mod++"` sind Fehler, deren Meldungen die richtige Schreibweise nennen. Menütastenkürzel in `nsh/desktop` akzeptieren dieselben Tastenanschläge.

Tastenkürzel funktionieren mit jedem Tastaturlayout: Bei einem kyrillischen oder griechischen Layout ist `mod+k` die Taste, die auf einem US-Layout K erzeugt, genau wie bei Menütastenkürzeln.

`bind` löst einen Fehler (`TypeError`) aus, der bei einem ungültigen Tastenanschlag sagt, was falsch ist (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`), und lehnt die Tastenanschläge ab, die das System für sich behält, sodass eine App sie nie außer Kraft setzen kann:

| Plattform | Reserviert |
|---|---|
| macOS, iOS | Cmd+Q (Beenden), Cmd+H (Ausblenden), Option+Cmd+H (Andere ausblenden), Cmd+M (Minimieren), Ctrl+Cmd+F (Vollbild) |
| Linux, Windows, Android | Ctrl+Q (Beenden), Alt+F4 (Schließen), F11 (Vollbild) |
| Web | Keine (der Browser behält seine eigenen Tasten) |

<a id="while-typing"></a>

### Während der Texteingabe

Ein Texteingabefeld mit Tastaturfokus braucht seine Tasten: Tippen, Cursor bewegen, Löschen sowie Alles auswählen, Ausschneiden, Kopieren, Einfügen, Rückgängig und Wiederholen. Daher wird eine Bindung standardmäßig nicht ausgelöst, solange ein Texteingabefeld (oder eine Web View) den Fokus hat und ihr Tastenanschlag einer dieser ist: einfache Tasten und Tasten nur mit Shift oder Option, die Pfeiltasten, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete sowie `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`. Andere Tastenanschläge mit Command oder Control und die Funktionstasten werden unabhängig vom Fokus ausgelöst.

`when` ändert das (Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | Wird ausgelöst |
|---|---|
| (Standard) | Wie oben |
| `"always"` | Auch in Texteingabefeldern, bevor das Feld die Taste sieht |
| `"notEditing"` | Nie, solange ein Texteingabefeld den Fokus hat |

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

Unter iOS und Android bleibt eine Taste, mit der eine Eingabemethode gerade komponiert (Kandidat auswählen, bestätigen), bei der Eingabemethode. Im GPUI-Backend zählt eine native Komponente mit Tastaturfokus als Texteingabefeld, da sie ein Texteditor sein kann. Sie sieht jede Taste zuerst: Eine Taste, die sie selbst verarbeitet, erreicht die Bindungen nie, und die Bindungen, die beim Bearbeiten von Text ausgelöst werden, erhalten die Tasten, die sie durchlässt.

<a id="which-binding-runs"></a>

### Welche Bindung ausgeführt wird

Eine Taste, die eine Bindung auslöst, wird verbraucht: Sie wird nicht getippt, das System gibt keinen Signalton aus, und die eigenen Tasten von NSH sehen sie nicht (Escape für Zurück, Tab zum Verschieben des Fokus, die Pfeiltasten zum Scrollen). Haben mehrere Bindungen denselben Tastenanschlag, wird die neueste ausgeführt, die ausgelöst werden darf. So kann ein Dialog Escape über die Bindung des Screens legen, und die des Screens kommt zurück, wenn die des Dialogs entfällt. Bindungen werden nativ in dem Moment geprüft, in dem die Taste gedrückt wird; der Handler läuft direkt danach, auf dem Engine-Thread (Rust) oder dem JS-Thread (TSX).

Hält man eine Taste gedrückt, wird ihre Bindung einmal ausgelöst, bis die Taste losgelassen wird; mit `repeat: true` wird sie bei jeder automatischen Wiederholung erneut ausgelöst (etwa um durch eine Liste zu schalten):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

Menütastenkürzel weichen einer Bindung desselben Tastenanschlags: die des Anwendungsmenüs ([`nsh/desktop`](./nsh-desktop)) auf jedem Desktop und unter macOS auch die der integrierten Menüs (Cmd+W, Cmd+C, ...). Während Sie mit `nsh run` entwickeln, lädt Cmd+R / Ctrl+R die App immer neu, auch wenn sie `mod+r` bindet; eine paketierte App kann es binden.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent und nativeModule

`nativeComponent` und `nativeModule` verbinden Ihre App zur Laufzeit über Namen mit dem, was die Host-App bereitstellt. Eine iOS- oder Android-App, die NSH einbettet, kann eigene Views (eine Karte, ein Diagramm, eine Kameravorschau) unter einem Namen registrieren; `nativeComponent` liefert Ihnen eine typisierte Komponente für eine davon. Da NSH mit echten nativen Views rendert, sitzt eine solche Komponente wie jede andere View in der View-Hierarchie: NSH legt sie aus, sie wird mit ihren Eltern beschnitten und gescrollt und überlappt korrekt. Eine App, die NSH aus Rust einbettet, kann auch Funktionen, Klassen und Rust-Komponenten registrieren; `nativeModule` liefert sie als ein typisiertes Objekt. Ihre App baut in beiden Fällen mit dem Standard-`nsh build`: Der Host verbindet, was er bereitstellt, wenn er die App ausführt. Rust-Code platziert eine registrierte View mit `native(name)` aus `nsh_core::prelude`, setzt ihre Props mit `.prop(name, value)` (ein JSON-Wert oder ein Signal oder eine Closure davon) oder bindet eine davon mit `.bind_prop(name, &value)` an einen animierten Wert, empfängt ihre Events mit `.on_native_event(…)` und ruft ihre Commands über `ElementRef` auf; TSX importiert `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

Siehe [Native Components](../docs/native-components.md) zum Registrieren der nativen Seite sowie [Einbettung unter iOS](../docs/ios.md) / [Einbettung unter Android](../docs/android.md).

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

Gibt eine Komponente für die native Komponente zurück, die die einbettende App als `name` registriert hat (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`). Rust: `native(name)`, eine View, deren Props JSON-Werte sind (`.prop("text", json!(…))`) und deren Events als `NativeEvent { name, data }` eintreffen.

- `P` ist der Typ der eigenen Props. Jede in `spec.props` aufgeführte Prop wird als JSON an die native Seite gesendet, wenn sie sich ändert; sie auf `undefined` zu setzen entfernt sie.
- `E` ordnet Event-Namen ihren Payloads zu. Ein Event `regionChange` wird zur Handler-Prop `onRegionChange`.
- Die Komponente akzeptiert außerdem jede [View-Prop](../elements/view.md) außer `children`: `style`, `class`, Layout, Barrierefreiheit, Touch-Handler und `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### Größe

Die Komponente wird wie eine View ausgelegt, in der Größe, die ihr Style vorgibt. Wo der Style eine Dimension offen lässt, verwendet sie die Größe, die die native Komponente meldet (wie ein Bild seine natürliche Größe verwendet).

#### Commands

Ihr `ref` erhält ein `NativeComponentRef`; `ref.command(name, args)` ruft den Command `name` der nativen Komponente mit `args` auf (ein beliebiger JSON-Wert). Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### Wenn nichts registriert ist

Ist unter `name` nichts registriert (eine andere Host-App, der Dev-Host, der Browser), rendert die Komponente eine leere View, und es wird einmalig eine Warnung protokolliert. Halten Sie die App auch ohne sie benutzbar oder prüfen Sie Ihren Host, bevor Sie sie verwenden.

<a id="example"></a>

### Beispiel

Das Badge hier ist eine native View der Host-App, registriert als `embed.badge`. NSH legt es aus, sendet ihm `text` und `color`, empfängt seine `tap`-Events und ruft seinen `pulse`-Command auf:

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

Gibt die Exporte des Sets zurück, das die einbettende App als `specifier` registriert hat: ihre Module, Klassen, Funktionen und Rust-Komponenten als ein Objekt. Den Typ `T` schreibt die App selbst, daher wird beim Build nichts über den Host benötigt. Rust-Code, der zusammen mit dem Crate des Hosts gebaut wird, ruft diese Funktionen als Rust auf; `nativeModule` ist der Weg, auf dem TSX sie erreicht.

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

- Aufrufe funktionieren wie bei einem Import eines Sets: Eine einfache Rust-Funktion gibt ihren Wert sofort zurück, eine `async`-Funktion gibt ein Promise zurück, und eine übergebene Funktion ist ein Callback, den Rust später aufrufen kann. Rust prüft jedes Argument und wirft bei einem falschen einen `TypeError`.
- Jeder Aufruf mit demselben `specifier` gibt dasselbe Objekt zurück.
- Ist unter `specifier` nichts registriert, wirft `nativeModule` einen `ReferenceError`, der es benennt. Rufen Sie es dort auf, wo die App das behandeln kann, oder nur im Host, für den es gedacht ist.

Der Host registriert das Set aus Rust mit `set_ui_sets` des Platform-Crates (neben den eigenen Sets von NSH), bevor er seine Views startet, oder mit `EngineConfig::ui_sets`:

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

`on` ist der Weg, wie der Host jede App mit seinen eigenen Daten synchron hält: Der dabei gestartete Task wartet auf Änderungen des Hosts und sendet jede davon an die App, sodass eine Änderung durch den Host oder durch eine beliebige App über eine andere Funktion jede App erreicht, die zuhört. Was `Stop` zurückgibt, ist die Funktion, die `Trading.on` in TSX zurückgibt: Sie läuft einmal, wenn die App sie aufruft oder wenn das, was `on` aufgerufen hat, endet (eine Komponente oder der Lauf des Moduls bei Hot Reload), und entfernt hier den Listener, sodass der Task endet.

> [!NOTE]
> Props, Events und Command-Argumente gelangen als JSON auf die native Seite. Registrierte Komponenten und Funktionen sind der eigene Code der Host-App: Die [Sandbox-Grenzen und Capabilities](../docs/sandbox-and-capabilities.md) von NSH gelten nicht für das, was sie tun.

## Accessibility

Die Accessibility API liest die Bedienungshilfen-Einstellungen des Nutzers (läuft ein Screenreader, wurde weniger Bewegung gewünscht) und kommuniziert mit dem Screenreader. Rust-Code ruft `screen_reader()`, `reduce_motion()` und `announce_for_accessibility()` aus `nsh_core::prelude` auf und bewegt den Fokus mit einem `ElementRef`; TSX importiert `screenReaderEnabled()`, `reduceMotion()`, `announce()` und `setAccessibilityFocus()` aus `nsh`. Die Einstellungen sind reaktiv: Lesen Sie sie in einem Binding, `computed` oder `effect`, und was sie liest, wird aktualisiert, wenn der Nutzer sie ändert. Die Accessibility-Props von Elementen (`accessibilityLabel`, `role`, ...) sind unter [Elements](../elements/index.md) dokumentiert; die Anleitung ist [Accessibility](../docs/accessibility.md).

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

Ob ein Screenreader (VoiceOver, TalkBack) läuft. Reaktiv: Was ihn liest, wird aktualisiert, wenn der Nutzer den Screenreader ein- oder ausschaltet. Rust: `screen_reader() -> bool`, auf dieselbe Weise reaktiv.

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

Ob der Nutzer weniger Bewegung angefordert hat (Reduce Motion unter iOS, Remove animations unter Android). Reaktiv. Rust: `reduce_motion() -> bool`. Tailwind-Klassen folgen ihr ebenfalls mit der Variante `motion-reduce:`.

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

Der Screenreader liest `message` vor (eine VoiceOver-Ansage, TalkBack). Verwenden Sie es für Ergebnisse, die erscheinen, ohne dass der Fokus wandert, etwa „Gespeichert". Rust: `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Verschiebt den Fokus des Screenreaders auf `node` (die `ref` eines Elements). Rust: `ElementRef::set_accessibility_focus()`.

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

## Typen

`nsh` exportiert außerdem die Typen der reaktiven API und der Host-Elemente. Die am häufigsten verwendeten:

| Typ | Was es ist |
|---|---|
| `Accessor<T>` | Ein lesbarer Wert: `() => T` |
| `Signal<T>` | Ein `Accessor<T>` mit `set` und `update` |
| `SignalOptions<T>` | Optionen von `signal` und `computed` (`equals`) |
| `Context<T>` | Was `context` zurückgibt |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | Der JSX-Namespace (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | Was ein `ref` erhält, jeweils der eigene Typ des Elements (`ViewRef` und die darüberliegenden Typen): Fokus, Scrollen und weitere Commands. `ViewRef` ist auch das, was ein Element ist (`JSX.Element`). Siehe [Ref-Methoden](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | Props von Host-Elementen |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Style-Objekte; siehe die [Style-Referenz](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | Werte innerhalb von Styles |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Event-Payloads |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | Die Strukturen, aus denen Payloads und Props bestehen, mit den Feldern von GPUI (`nsh_core::geometry`) |
| `PixelSize` | Die eigene Größe eines Bildes oder Videos in Pixeln (`onLoad`, `Image.getSize`, die Bilder der Zwischenablage und des Pickers), wobei `Size` in Punkten angegeben ist |
| `ImageAsset` | Was der Import einer Bilddatei liefert (`{ url, size: Size, scales? }`; `scales` listet ihre [Pixeldichte-Varianten](../docs/images-and-assets.md#pixel-densities)) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Accessibility-Props |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` akzeptiert einen Style oder eine Liste, die von links nach rechts zusammengeführt wird, wobei falsy-Einträge übersprungen werden:

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
