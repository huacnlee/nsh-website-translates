---
title: "nsh"
description: "核心模組:signals、effects、context、mount、design tokens、動畫、環境(environment)、手勢、剪貼簿、儲存空間、host channel、鍵盤快速鍵、無障礙功能,以及 element 與 style 型別。"
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` 是核心模組：響應式 API（signal、computed 值、effect、context）、`mount`、`token`、host 元素 `View`、`Text`、`Scroll` 與 `Overlay`、[可選取的檢視](#selectable-views)、[安全區域與鍵盤](#safe-area-and-keyboard)、[動畫](#animation)、[裝置及其環境](#device)、[`PanResponder`](#panresponder)、[剪貼簿](#clipboard)、[照片選擇器](#picker)、[語音辨識](#speech)、[儲存空間](#storage)、[host channel](#host)、[鍵盤快速鍵](#keymap)、[原生元件與模組](#nativecomponent-and-nativemodule)、[無障礙](#accessibility)，以及元素、樣式與事件的 TypeScript 型別。響應式圖本身以原生方式在 Rust 中執行；讀取 signal 是對執行階段的一次呼叫，只需數奈秒，只有你自己的閉包會在 JavaScript 直譯器中執行。

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

NSH 的響應式遵循與 SolidJS 相同的模型：元件函式只會執行**一次**，UI 中讀取 signal 的部分會在這些 signal 變更時原地更新。沒有元件重新渲染，也沒有虛擬 DOM。指南請見[響應式](../docs/reactivity.md)。

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

signal 保存一個值。呼叫它即可讀取該值，並且在追蹤範圍（JSX 運算式、`computed`、`effect`）內，讓該範圍訂閱它。`set` 與 `update` 負責寫入；所有讀取過它的內容都會更新。

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

預設情況下，寫入與目前值 `===` 的值不會有任何作用。傳入 `equals: false` 可在每次寫入時都發出通知（當你原地修改物件後又設定同一個物件時很有用），或傳入你自己的比較函式：

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

由 signal 衍生出的值。當它讀取過的 signal 變更時，`fn` 會再次執行；computed 值的讀取者只有在其結果改變時才會更新（依 `equals`，預設為 `===`）。`fn` 會接收前一次的結果。

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

當衍生計算成本高昂或在多處被讀取時，請使用 `computed`。對於簡單的運算式，一般函式（`const full = () => first() + " " + last()`）同樣具備響應性。

## effect

```ts
function effect(fn: () => void): void;
```

在渲染之後執行 `fn`，並且在它讀取過的 signal 變更時再次執行。effect 用於處理副作用：記錄日誌、計時器、與原生模組通訊。effect 屬於建立它的元件（或 effect），並隨之一起被釋放。

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

若要在 effect 再次執行之前（或其元件消失時）復原某些操作，請在其中呼叫 [`cleanup`](#cleanup)。

## batch

```ts
function batch<T>(fn: () => T): T;
```

執行 `fn`，並在結束時一併套用其所有寫入，讓讀取者只更新一次，而不是每次寫入都更新。回傳 `fn` 所回傳的內容。

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

執行 `fn`，但不讓目前的範圍訂閱其中所讀取的內容。可用於在 effect 或 JSX 運算式中讀取 signal，卻不依賴它。

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

註冊 `fn`，使其在目前的 effect 再次執行之前，或目前的元件或 effect 消失時執行。

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

元件提供給它所渲染的所有內容的值，無論層級多深。呼叫 context（`Theme()`）會讀取最近的 provider 的值；若沒有 provider，則為 `defaultValue`。

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

將 `app` 渲染到 surface（視窗，或應用程式所嵌入的 `NshAppView` / `NshView`），並回傳一個用來移除它的函式。每個應用程式的進入點檔案都以 `mount(App)` 結尾。

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

將 props 物件拆成 `keys` 中所列名稱的 props 與其餘的 props。兩部分都保持響應性：值會變動的 props 是 getter，而 `split` 會將它們保留為 getter。可用於一個自己處理部分 props、並將其他 props 往下傳遞的元件中。解構 props（`const { label } = props`）只會讀取一次，並且會遺失後續的更新。

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

渲染其子節點；一旦其下有任何內容擲出錯誤（元件本體、繫結、effect 或事件處理常式），就改為渲染 `fallback`。失敗的部分會被移除，並在原處顯示 fallback。函式形式的 `fallback` 會以 `fallback(error, reset)` 的形式被呼叫，傳入擲出的值與 `reset`（它會再次渲染子節點），無論該函式宣告了哪些參數；`fallback` 元素則原樣顯示。失敗會交給其上最近的邊界處理，而 fallback 中的失敗則交給更上一層的邊界。Rust 元件使用 `catch_error`（[錯誤邊界](../docs/reactivity.md#error-boundaries)）。

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

應用程式佈景主題的設計 token `name`（`"theme"` 位於 `nsh.json`，建立在 shadcn/ui 的 token 之上），以目前顯示的外觀呈現：
顏色為 `#rrggbbaa`，長度為以點為單位的數字，字型為其字型家族名稱。名稱為佈景主題的 CSS 變數，
去掉 `--`（`primary`、`muted-foreground`、`radius`、`font-mono`，以及應用程式自己的，例如 `up`）。讀取它具有響應性：
讀取 token 的元件、memo 或 effect，會在佈景主題或外觀改變時再次執行。
`Tokens` 列出應用程式的 token 及其型別；NSH 會依據佈景主題將它寫入 `.nsh/types/nsh/tokens.d.ts`。對於
class，請直接指名 token（`bg-primary`、`rounded-(--radius)`）：[佈景主題 token](../docs/tailwind.md#theme-tokens)。

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

`nsh` 匯出的 host 元素，以標籤形式書寫：`<View>`、`<Text>`、`<Scroll>`、`<Overlay>`（其
子節點置於視窗上方，並相對於錨點定位：[Overlay](../elements/overlay.md)）。對於透過 import 指名其中之一的標籤（別名亦可），編譯器會就地建立
原生檢視，因此匯入它們在執行時不需任何
成本。它們和其他元件一樣是元件，因此也可以被傳遞（`const Tag = inline ? Text : View`）。
`nsh` 以相同方式匯出其他基本元件：[`List`](./nsh-list.md)、[`Image`](./nsh-image.md)、
[`Canvas`](./nsh-canvas.md)、[`WebView`](./nsh-webview.md) 與 [`Video`](./nsh-video.md)，各有其專屬的參考
頁面。它們的 props 記載於[元素](../elements/index.md)。文字輸入 `Input` 來自
[`nsh/base`](./nsh-base.md#input)。

<a id="safe-area-and-keyboard"></a>

## 安全區域與鍵盤

CSS 環境變數可讓內容避開系統 UI，可用於任何檢視的 padding 與 margin
（`padding`、`paddingTop`、...，相同的 `margin` 鍵；Tailwind 的 `p*` / `m*` 任意值；Rust 中的 `Styled` 方法
`.p_safe_area()`、`.pt_safe_area_plus(..)`、`.pb_keyboard()`、...）。它們的值是 `EnvValue`：
`env(name)`、`env(name, <length>)`、`calc(env(name) + <length>)` 與 `calc(<length> + env(name))`。

| 變數 | 值 |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | 節點所渲染之根檢視的內縮：最近的頁面（位於其標頭下方）、最近的對話框，否則為 surface 的安全區域。請見[安全區域](../elements/safe-area.md)。 |
| `keyboard-inset-height` | 軟體鍵盤在 surface 上方的高度，隱藏時為 0；變更會與鍵盤一同以原生方式產生動畫。請見[鍵盤](../elements/keyboard.md)。 |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

### safeArea and safeAreaInsets

`safeArea()` 是 surface 的安全區域（Rust 中為 `safe_area()`）；`safeAreaInsets()` 是元件
渲染處的內縮（Rust 中為 `cx.insets()`），即 `safe-area-inset-*` 變數的值。兩者都是具響應性的 `Edges`
（`{ top, right, bottom, left }` 以點為單位）。請見
[safeArea and safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets)。

<a id="keyboard-and-keyboardframe"></a>

### 鍵盤與 keyboardFrame

`Keyboard.dismiss()` 會隱藏軟體鍵盤（Rust 中為 `dismiss_keyboard()`），`keyboardFrame()` 則告訴你鍵盤
遮住了多少螢幕（Rust 中為 `keyboard_height()` 與 `keyboard_duration()`）。請見
[隱藏鍵盤](../elements/keyboard.md#hiding-the-keyboard)與
[鍵盤的高度](../elements/keyboard.md#the-keyboards-height)。

<a id="selectable-views"></a>

## 可選取的檢視

`<View selectable>`（Rust 中為 `view().selectable(true)`）讓其內部的文字如同網頁一般可一起選取：
一次選取可依閱讀順序跨越檢視、`Text` 元素與 `TextView`。請見
[文字選取](../elements/text-selection.md)。

<a id="animation"></a>

## 動畫

動畫 API 在 UI 執行緒上執行動畫。你建立一個**動畫值**，將它（或由它衍生的值）繫結到樣式屬性，然後啟動動畫；此後每一幀都以原生方式計算，不會執行應用程式的程式碼。忙碌的引擎或 JS 執行緒不會讓動畫卡頓，而且動畫不會讓應用程式在每一幀付出任何工作。Rust 程式碼使用來自 `nsh_core::prelude` 的 `animated_value()`、`motion()`、`Animation`、`Spring`、`Timing`、`KeyframeTiming`、`MotionPreset` 與 `Easing`，並以元素的 `.bind_*` 方法繫結值；TSX 則從 `nsh` 匯入它們。

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

指南請見[動畫](../docs/animation.md)。

<a id="what-an-animated-value-can-drive"></a>

### 動畫值可以驅動什麼

| 位置 | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | 相同：顏色節點。`borderColor` 會為每一邊上色；`Text` 的 `color` 會為整段文字上色 |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate`（角度） | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` 的各個步驟：`transform: [{ translateX: value }]` |
| 捲動位置 | 捲動檢視或清單上的 `.scroll_value(&value)` | `<Scroll scrollValue={value}>` 與 `<List scrollValue={value}>` 會在每一幀把捲動位移寫入其中 |
| 手勢 | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | 任何元素上的 `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}`：手勢會直接寫入這些值（請見[觸控與手勢](../docs/touch-and-gestures.md)） |
| 檢視黏附的位置 | `.sticky().bind_sticky_top(&value)`（水平捲動檢視中為 `.bind_sticky_left`）、清單上的 `.bind_sticky_header_offset(&value)` | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`：黏性檢視與標頭會黏附在距離視口起點該距離之處，並在每一幀跟隨該值 |
| Canvas | painter 呼叫的動畫引數 | [canvas](./nsh-canvas.md) 繪製呼叫的任何數字或顏色引數 |
| Shader | `.uniform(name, &value)` | [shader](../elements/shader.md) 的 `struct Uniforms` 的成員：`uniforms={{ name: value }}`（數字，或用於 `vec3f` / `vec4f` 的顏色節點） |

其他樣式屬性接受一般的值；若要讓版面本身產生動畫（尺寸、流程中的位置），請使用 [`LayoutAnimation`](#layoutanimation)。

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

建立一個從 `value` 開始的動畫值（預設為 `0`）。Rust：`animated_value(value)`，一個由建立它的元件持有的 `Copy` 控制代碼。

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
> 動畫值存在於 UI 執行緒上，並在那裡於每一幀變更，因此應用程式是以非同步方式讀取它：`await value.getValue()`（或 `stop()` 所解析出的 `{ value }`）會給出當下的值，在 Rust 中則是在 task 裡使用 `value.value().await`。當你的程式碼需要立即取得目標值時，請如上所示將目標保存在變數或 signal 中。手勢事件會回報結束時的值（`PanEvent.value`）。

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

| 方法 | Rust | 說明 |
|---|---|---|
| `set(value)` | `set(value)` | 跳至 `value`，並停止任何執行中的動畫。 |
| `stop()` | `stop()`，然後 `value().await` | 在目前位置停止執行中的動畫；以 `{ value }`（即當下的值）解析。 |
| `getValue()` | `value().await` | 以目前的值（含其位移）解析，於 UI 執行緒上讀取。 |
| `setOffset(offset)` | `set_offset(offset)` | 加到值上的位移：繫結看到的是 value + offset；`set`、動畫與拖曳會移動 value。 |
| `flattenOffset()` | `flatten_offset()` | 將位移加到值上，並將位移歸零。 |
| `extractOffset()` | `extract_offset()` | 將值移入位移，並將值歸零（之後的拖曳會從上一次拖曳結束處開始）。 |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | 沿著緩動曲線以動畫過渡至 `to`。`duration` 單位為毫秒（預設 300），`easing`（預設 `"easeInOut"`），`delay` 單位為毫秒（預設 0）。 |
| `spring(to, options)` | `spring(to, Spring { … })` | 以彈簧動畫過渡至 `to`。`stiffness`（預設 170）、`damping`（預設 26）、`mass`（預設 1）、`velocity`（初始速度，單位為每秒的單位數）。 |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | 以 `velocity`（每秒單位數）的速度滑行，並每毫秒減速 `deceleration`（預設 0.998）。用於快速滑動（fling）之後，搭配來自 `onPanEnd` 的速度。搭配 `clamp: [min, max]` 時，它會在邊界處停止，或從邊界彈回並保留其速度的 `bounce`（0..1，預設 0）。 |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | 如同 CSS keyframes 的播放方式播放 [keyframes](#keyframes)：每個區段各有一個緩動，重複 `iterations` 次，於 `direction` 中。 |

每個動畫方法都會回傳一個 promise，並以 `{ finished }` 解析：動畫完成時為 `true`，被停止時為 `false`（被 `stop`、`set` 或同一個值的另一個動畫停止）。在 Rust 中它回傳 `AnimationEnd`，task 會等待它以取得相同的 `bool`。

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

原生動畫圖中的一個節點：`AnimatedValue`，或由其他值衍生出的值。衍生節點會在其輸入變更時於 UI 執行緒上求值。

| 方法 | Rust | 說明 |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | 透過分段範圍對映輸入。`outputRange` 可包含數字、顏色（`"#ff0000"`、`"rgba(…)"`）或角度（`"45deg"`、`"1rad"`）。在 `inputRange` 之外預設會鉗制；`extrapolate`（或 `extrapolateLeft` / `extrapolateRight`）可為 `"extend"`（延伸該線）、`"clamp"` 或 `"identity"`（原樣傳遞輸入）。`easing` 決定每個區段的形狀。Rust 的 `bind_rotate` 接受數字、佈景主題顏色（會跟隨外觀）以及以度為單位的角度。 |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | 跟隨輸入的變化，但將結果保持在 `min..max` 之內：例如標頭在內容向上捲動時隱藏，一向下捲動就立即回來。`snap: true` 會在其捲動檢視靜止時，於 200 毫秒內將它定位到較近的邊界；`max` 則僅在輸入到達 `max` 之後才定位。 |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | 與另一個節點或常數進行算術運算。 |
| `mod(b)` | `modulo(b)` | 取餘數，對正的 `b` 不會出現負值（使角度保持在 0..360）。 |

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

`value.keyframes(frames, options)` 讓一個值依關鍵影格播放，並以 `{ finished }` resolve，表示是否播放完成；`Animated.keyframes(value, { keyframes, ...options })` 與組合動畫中的一個步驟相同。Rust：`value.keyframes(frames, KeyframeTiming)` 與 `Animation::keyframes(&value, frames, KeyframeTiming)`，搭配 `Keyframe::new(value)`（平均分布）、`Keyframe::at(offset, value)` 與 `.ease(easing)`，以及 `KeyframeTiming::new(ms)` 搭配 `.delay(ms)`、`.easing(e)`、`.iterations(Some(n))`、`.infinite()` 與 `.direction(PlaybackDirection::…)`。

它們的播放方式與 CSS keyframes 相同：easing 作用於單一區段（關鍵影格的 easing 作用於從它開始的區段，timing 的 easing 作用於其餘每個區段）；keyframes 中缺少的 offset 會平均分布，第一個為 0、最後一個為 1；每次迭代都從跳到第一個關鍵影格開始，若 0 處沒有關鍵影格，則值從目前位置開始；在 `delay` 期間，值維持在第一個關鍵影格（CSS `animation-fill-mode: backwards`）；反向迭代會倒著執行各區段，且曲線也會反轉；值會停在最後一次迭代結束的位置。

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

建立一個 motion：為 view 的 opacity 與 transform 的每個通道各建立一個動畫值，初始處於靜止狀態（opacity 與 scale 為 1，其餘為 0），並提供可在這些通道上以原生方式播放的 motion。以 `style={motion.style}` 綁定，或將 `motion.style` 或 `motion.transform` 展開到 style 中；transform 依序套用平移、旋轉、縮放，其中 `scale` 會併入 `scaleX` 與 `scaleY`：佔用 view 8 個 transform 步驟中的 7 個，留下 1 個給你自己使用（`[{ perspective: 600 }, ...motion.transform]` 用於 3D 翻轉）。`initial` 設定各通道的起始位置（`{ opacity: 0 }`；其他通道從靜止狀態開始）。使用 `enter` 時，它所移動的通道會從該 motion 的起點開始（經過 `initial`），並立即播放，其餘選項則作為它的 timing（`delay`、`duration`、...）。motion 只會移動 opacity 與 transform：展開 `motion.style` 會設定 view 的 `opacity`，因此若要保留自己的 opacity，請只綁定 `motion.transform`，並以動畫值與 `interpolate` 來移動顏色。Rust：`motion()`，一個由建立它的元件持有的 `Copy` handle，以 `.bind_motion(&m)` 綁定；`motion().entering(spec)` 進場。

| 成員 | Rust（`Motion`） | 說明 |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | 各通道的動畫值。 |
| `style`, `transform` | 元素上的 `.bind_motion(&m)` | 綁定。 |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | 依名稱播放預設，或在各通道上播放 [`MotionSpec`](#motions)；新的 motion 會中斷正在播放的 motion。`options` 會改變其 timing。以 `{ finished }` resolve：完成時為 `true`，被其他操作停止時為 `false`（Rust 中為 `AnimationEnd`）。 |
| `animation(motion, options?)` | `animation(spec)` | 同一個 motion 以未啟動的 [`CompositeAnimation`](#animated) 形式提供，供組合使用：`Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })`（Rust：`Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`）。減少動態效果的設定會在建立時決定。 |
| `stop()` | `stop()` | 在目前位置停止。 |
| `reset()` | `reset()` | 停止並將每個通道恢復到靜止狀態。 |

當使用者要求減少動態效果（`reduceMotion()`）時，`play`、`animation` 與 `enter` 會立即到達 motion 的結束位置而不移動，除非設定了 `ignoreReduceMotion`（在選項或 motion 上）。

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

以資料形式提供的現成 motion：`motion.play("shake")` 播放 `motions.shake`。`MotionName` 為下列其中之一：`fadeIn`、`fadeInUp`、`fadeInDown`、`fadeInLeft`、`fadeInRight`、`zoomIn`、`popIn`、`bounceIn`、`slideInUp`、`slideInDown`、`flipInX`、`flipInY`（進場）；`fadeOut`、`fadeOutUp`、`fadeOutDown`、`fadeOutLeft`、`fadeOutRight`、`zoomOut`、`popOut`、`slideOutDown`、`slideOutUp`（退場）；`shake`、`headShake`、`wiggle`、`swing`、`pulse`、`heartbeat`、`rubberBand`、`jello`、`tada`、`jump`、`flash`（吸引注意）；`spin`、`float`、`breathe`、`sway`、`bob`、`glow`（循環）。[Animation](../docs/animation.md#presets) 說明每一個。展開預設即可修改它：`motion.play({ ...motions.fadeInUp, duration: 600 })`。

`MotionSpec` 是你自己的 motion：每個通道的關鍵影格（`{ opacity: [0, 1], translateY: [24, 0] }`），或以 Web Animations API 寫法的影格清單（`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`，沒有 offset 的影格依其在清單中的位置決定），並搭配[關鍵影格 timing](#keyframes)。Rust：`MotionSpec::new(KeyframeTiming)` 搭配 `.values(channel, values)`（平均分布）、`.track(channel, keyframes)` 與 `.timing(|t| …)`；`MotionPreset::FadeInUp`（或 `.spec()`）是預設，`MotionChannel` 指定通道。

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

`Animated` 以步驟（`timing`、`spring`、`decay`、`sequence`、`parallel`、...）組合出動畫。在 `start()` 之前不會執行任何東西；之後整棵樹會以原生方式執行，每個步驟在前一個步驟結束的那一刻於 UI thread 上啟動（沒有影格間隙，步驟之間也不會回到 app 的程式碼）。Rust 以 `Animation` 建立相同的樹。

| 函式 | Rust | 說明 |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | 單一值的一個動畫；選項與預設值與 [`AnimatedValue`](#animatedvalue) 的方法相同，目標以 `toValue` 指定。 |
| `sequence(list)` | `Animation::sequence(list)` | 依序執行這些動畫。 |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | 同時執行。使用 `stopTogether`（預設 `true`）時，停止其中一個會停止全部。 |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | 以平行方式執行，每個在前一個之後 `ms` 啟動，從 `from` 起算：`"first"`（預設）、`"last"`、`"center"`（中間的立即啟動，其他的由它向外展開；數量為偶數時，兩個中間項都立即啟動）或索引（`StaggerFrom::First`、`Last`、`Center`、`Index(i)`）。 |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | 讓一個值依[關鍵影格](#keyframes)變化。 |
| `delay(ms)` | `Animation::delay(ms)` | 等待；在 `sequence` 內很有用。 |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | 將 `animation` 重複 `iterations` 次（預設為無限次），每次執行前會將其值恢復原狀，除非 `resetBeforeIteration` 為 `false`。 |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | 節點方法 | 與 [`AnimatedNode`](#animatednode) 的方法相同，以函式形式提供。 |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | spring 或 decay 的值，每個影格一個（見 [Easing](#easing)）。 |

`CompositeAnimation`：

| 方法 | Rust（`Animation`） | 說明 |
|---|---|---|
| `start(callback?)` | `start()`，一個可 await 的 `AnimationEnd` | 執行（或再次執行）。整棵樹只會 resolve 一次並呼叫 `callback` 一次，帶入 `{ finished }`：表示是否已完成而非被停止。 |
| `stop()` | `stop()` | 在目前位置停止。 |
| `reset()` | `reset()` | 停止並將其值恢復到啟動時的樣子。 |

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

easing 是資料，而非 app 的函式：由 runtime 以原生方式計算。在 Rust 中它是列舉 `Easing`：`Linear`、`EaseIn`、`EaseOut`、`EaseInOut`、`Bezier(x1, y1, x2, y2)`、`Steps(count, StepPosition)` 與 `Curve(curve, mode)`，搭配 `Curve`（`Quad`、`Cubic`、`Poly(n)`、`Sin`、`Circle`、`Exp`、`Elastic(bounciness)`、`Back(s)`、`Bounce`）與 `EaseMode`（`In`、`Out`、`InOut`）。若要繪製曲線，`Easing.sample(easing, count)`（Rust：`nsh_core::element::sample_easing`）會給出從 0 到 1 之間 `count` 個等距點上的值；`Animated.sampleSpring` 與 `Animated.sampleDecay`（`sample_spring`、`sample_decay`）會給出 spring 或 decay 的值，每個影格一個（依 `fps`，預設 60），從 `from`（0）開始直到結束。這三者都來自動畫所執行的原生程式碼。在 TSX 中凡是接受 `Easing` 之處，都可以傳入名稱（`"easeOut"`）、以四個數字表示的三次貝茲曲線，或 `Easing` 物件中的曲線。

| 曲線 | Rust | 形狀 |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ`（`n` 預設為 2） |
| `sin` | `Curve::Sin` | 正弦 |
| `circle` | `Curve::Circle` | 圓形 |
| `exp` | `Curve::Exp` | 指數 |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | 彈性過衝（`bounciness` 預設為 1） |
| `back(s)` | `Curve::Back(s)` | 先向後拉再前進；`s` 為過衝量（預設 1.70158） |
| `bounce` | `Curve::Bounce` | 結尾處反彈 |

`Easing.steps(count, position)` 即 CSS `steps()`：值會在 `count` 個層級間跳動，而不是連續移動（逐格精靈圖、跳動的指針）。`position` 指定跳動發生的位置：`"jump-end"`（預設，也可寫作 `"end"`）、`"jump-start"`（`"start"`）、`"jump-none"` 或 `"jump-both"`；Rust：`Easing::Steps(count, StepPosition::JumpEnd)`、`JumpStart`、`JumpNone`、`JumpBoth`。

曲線皆為「in」形式（起始緩慢）。`Easing.out(curve)` 會將其反轉，`Easing.inOut(curve)` 使其對稱，`Easing.in(curve)` 則保持原樣；在 Rust 中這是 `Easing::Curve` 的 `EaseMode`。

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

`LayoutAnimation.configureNext(config)` 以原生方式為下一次 commit 的版面變化加上動畫：移動或改變大小的 view 會滑順過渡到新的 frame，新的 view 會出現（依 `property` 淡入或縮放進場），被移除的 view 會消失。請在改變版面的狀態變更之前呼叫它。Rust：`animate_layout(LayoutAnimation)`，搭配 `nsh_core::element::LayoutAnimation` 的預設，或其 `create`、`update` 與 `delete` 轉場。

| 成員 | Rust | 說明 |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 為下一次 commit 的變更加上動畫；完成時執行 `onEnd`。 |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | 三個階段都使用同一條曲線的 config。 |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms，view 淡入淡出。 |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms，等速。 |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms；frame 以 spring 運動（damping 0.4），view 線性淡入淡出。 |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | `configureNext(Presets.…)` 的簡寫。 |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | 這些名稱，以常數形式提供。 |

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

device API 讓 app 取得裝置及其環境的資訊。Rust 程式碼呼叫 `nsh_core::prelude` 的函式（`window()`、`dark()`、`font_scale()`、`locale()`、`lifecycle()`、`os()`、`idiom()`、`pixel_ratio()`、`set_color_scheme()`、...）；TSX 則從 `nsh` import。視窗大小、色彩配置、字型縮放、像素比例、locale 與 app 狀態皆為 reactive：在 binding（Rust 中傳給元素的 closure、TSX 中的 JSX）、`computed` 或 `effect` 中讀取它們，當平台回報變更時（旋轉、視窗調整大小、切換到深色模式、變更文字大小或語言、移到另一種密度的螢幕、離開 app 再回來），讀取它們的部分就會更新。

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

指南請見 [Device and environment](../docs/device-and-environment.md)。

### windowSize

```ts
const windowSize: Accessor<Size>;
```

surface 的大小（以 point 為單位）：視窗，或嵌入的 `NshAppView` / `NshView`。Reactive。Rust：`window() -> Size<Points>`。

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

目前顯示的外觀：系統的外觀，除非 app 自行設定（`nsh.json` `"appearance"`、[`setColorScheme`](#setcolorscheme)）。Reactive。Rust：`dark() -> bool`；主題顏色（`AdaptiveColor`）與 `.dark(…)` style variant 無須讀取它就會跟隨。Tailwind 的 `dark:` variant 同樣會跟隨（見 [Tailwind](../docs/tailwind.md)）。

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

使用者偏好的文字大小相對於預設值的比例（`1` 為預設大小；iOS 上為 Dynamic Type，Android 上為字型大小），或改由嵌入的 app 設定的文字大小。Reactive。Rust：`font_scale() -> f32`。除非 `allowFontScaling={false}`，否則文字已會隨之縮放；當其他尺寸也應跟隨時才需要讀取它，例如文字旁的圖示。

### locale

```ts
const locale: Accessor<string>;
```

使用者的 locale，以 BCP 47 標籤表示（`"en-US"`、`"zh-Hans-CN"`），或改由嵌入的 app 設定的 locale。Reactive。Rust：`locale() -> Locale`（`locale().as_str()` 為標籤）。`Intl` 預設會依它格式化；讀取它即可選擇你自己翻譯的字串（[Device and environment](../docs/device-and-environment.md#language-and-region)）。

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

app 是否正在使用，以 React Native 的 `AppState` 術語來說：`"active"` 表示在前景並接收輸入，`"inactive"` 表示可見但沒有焦點（另一個 app 或視窗取得焦點，或系統在其上顯示內容，例如 app 切換器或來電），`"background"` 表示不可見（在背景、最小化、隱藏的瀏覽器分頁）。顯示在原生 app 內的 app 會跟隨該 app 的狀態。Reactive。Rust：`lifecycle() -> Lifecycle`（`Lifecycle::Active`、`Inactive`、`Background`）。

在 effect 中讀取它，以暫停沒人看見的工作，並在 app 回來時恢復：

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

立即以 `scheme` 顯示 app，不論系統外觀為何：`colorScheme()`、`dark:` class、元件的主題與平台的控制項（alert、狀態列的預設樣式）都會跟隨；`"system"` 則再次跟隨系統。`nsh.json` `"appearance"` 從一開始就設定它。Rust：`set_color_scheme(Appearance::Dark)`（`Appearance::Light`、`Appearance::System`）。
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

App 執行時所在的平台，執行期間保持不變。

| 成員 | Rust | 說明 |
|---|---|---|
| `os` | `os() -> Os`（`os().name()` 為 TS 字串） | 作業系統。iOS、iOS 模擬器與 Mac Catalyst 回報 `"ios"`，瀏覽器回報 `"web"`。 |
| `version` | `os_version() -> (u16, u16)` | iOS 與桌面平台：作業系統版本（`"17.5"`）；Android：API 等級（`"35"`）；網頁：`"0.0"`。Rust 提供主版本與次版本，在 Android 上則為 API 等級與 0。 |
| `idiom` | `idiom() -> Idiom` | 裝置類型：僅在 `desktop` 為 `true` 時為 `"desktop"`；其他情況為 `"phone"`、`"pad"`（iPad、Android 平板、iPad 慣用模式的 Mac Catalyst）、`"mac"`（UIKit Mac 慣用模式的 Mac Catalyst，屬行動慣用模式）或 `"tv"`（Apple TV、Android TV）。 |
| `desktop` | `is_desktop() -> bool` | 套用桌面行為：macOS、Windows、Linux，以及使用滑鼠且視窗寬闊的瀏覽器。`desktop={{…}}` 屬性、`select({ desktop })` 與 `idiom` `"desktop"` 都依此判斷。Mac Catalyst 執行的是 iOS 後端，因此屬於行動平台：適用 `ios={{…}}` 屬性。[`nsh/desktop`](./nsh-desktop.md#isavailable) 的 `isAvailable` 是範圍較窄的檢查，用於其視窗與選單 API，僅 macOS、Windows 與 Linux 具備。 |
| `catalyst` | `is_catalyst() -> bool` | App 在 Mac Catalyst 下執行，無論是 Mac 或 iPad 慣用模式（`os` 為 `"ios"`）。 |
| `select(spec)` | `match os() { … }` | 此平台對應的值（見下文）。 |

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

傳回目前作業系統對應的值（`ios`、`android`、`web` ...），否則依 `platform.desktop` 傳回 `desktop` 或 `mobile`，再否則傳回 `native`（除網頁外的所有平台），再否則 `default`，再否則 `undefined`。Rust 程式碼對 `os()` 進行比對（`mobile` / `desktop` 則比對 `is_desktop()`）。

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
> 對於只有單一平台才有的屬性，建議使用 TSX 元素與元件的 `ios={{…}}` / `android={{…}}` 屬性，而非依 `platform` 分支（見[平台專屬程式碼](../docs/platform-specific.md)）。

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

每點的裝置像素數（例如大多數 iPhone 為 `3`）。具反應性：當視窗移到不同像素密度的螢幕（在 Mac Catalyst、桌面平台或外接顯示器上），以及 Android 的顯示大小設定改變密度時，它會隨之變動。Rust：`pixel_ratio() -> f32`，以及用於以整數裝置像素為單位的長度的 `round_to_nearest_pixel(points)`；在 TSX 中該長度為 `Math.round(x * pixelRatio()) / pixelRatio()`。

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

在 App 之外開啟 `url`：網頁在瀏覽器中開啟，`mailto:` 連結在郵件 App 中開啟，`tel:` 連結在電話 App 中開啟，以及其他 App 註冊的任何 scheme（`maps:`、宿主 App 自有的 `lb://` 連結）。它會以 `{ opened }` 完成，表示是否有東西開啟了它：當沒有 App 處理該 scheme 時為 `false`。Rust：`open_url(url)` 的 `nsh_core::prelude`，是可在任務中等待（或捨棄）的回應，同樣的 `bool`。

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

- URL 必須是絕對的（含有 scheme）。會執行程式碼或存取 App 自身資料的 URL，`javascript:`、`data:`、`blob:`、`file:`、`about:` 與 `asset:`，以及相對位址，都會以 `TypeError` 拒絕該 promise。`openUrl` 絕不會擲出例外：所有失敗都以拒絕表示。
- 宣告了 capabilities 的 App 需要 `openUrl`：`"openUrl": true` 表示所有 scheme，`"openUrl": { "schemes": ["https", "mailto"] }` 表示所列出的 scheme；其他 URL 會以 `Error` 拒絕，其 `code` 為 `"ERR_ACCESS_DENIED"`，`permission` `"openUrl"`，而 `resource` 為該 URL（見[沙盒與 capabilities](../docs/sandbox-and-capabilities.md)）。在 Rust 中，`open_url` 對這些 URL 回應 `false` 並記錄原因。
- 嵌入的 App 會先看到該 URL，並可改由自己的路由器處理（Swift `NshAppView.onOpenURL`、Java `NshView.setOpenUrlHandler`、Rust `AppView::host().handle_open_url`；見 [iOS](../docs/ios.md#links-the-app-opens) 與 [Android](../docs/android.md#links-the-app-opens)）。此時 `opened` 為 `true`。
- 各平台以自己的開啟器開啟：iOS 上為 `UIApplication.open`（嵌入時為宿主 App 的 application）、Android 上為 `ACTION_VIEW` intent、macOS 上為 `NSWorkspace`、Windows 上為 `ShellExecuteW`、Linux 上為 `GtkUriLauncher`、GPUI 的 `open_url`、網頁上為新分頁。`nsh test` 會記錄 URL 而不開啟。
- [`TextView`](../elements/text-view.md) 以 `links="open"` 用這種方式開啟其連結。

<a id="layout-direction"></a>

### 版面方向

版面方向會依使用者的語言而定：在由右至左的語言（阿拉伯文、希伯來文等）中，App 會由右至左排版，列從右側開始排列，而 `left` / `right` 樣式屬性（`marginLeft`、`paddingRight` 等）則代表起點與終點。變更會立即生效，無需重新啟動。

檢視的 `direction` 樣式（`"ltr"`、`"rtl"` 或預設的 `"inherit"`）會設定其自身子樹的方向；在 Rust 中為 `.direction(LayoutDirection::..)`。

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

### 相關內容

- 安全區域邊距（Rust `safe_area()`；TSX `safeArea()`、`safeAreaInsets()`）與軟體鍵盤（Rust `keyboard_height()`；TSX `keyboardFrame()`）請見[安全區域與鍵盤](#safe-area-and-keyboard)。
- 螢幕閱讀器與減少動態效果的設定請見[無障礙](#accessibility)。

## PanResponder

Pan responder 是建構在手勢回應器系統之上的拖曳手勢：元素會取得一次手勢的觸控，之後單獨接收這些觸控與手勢狀態，手勢狀態會為你追蹤觸控的質心、移動距離與速度。Rust 程式碼以 `.claim_touches(TouchClaim::…)` 取得觸控，並以 `.on_responder_*` 監聽器接收，監聽器的 `ResponderEvent` 帶有 `PanGesture`，全都在 `nsh_core::prelude` 中；TSX 從 `nsh` 匯入 `PanResponder`，其 `onPanResponder…` 回呼會接收觸控事件與手勢狀態。

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Pan responder 會把每一次移動都交給 App 的程式碼，因此適合會改變 App 狀態的手勢（重新排序、滑動刪除的判斷）。若要讓檢視跟著手指移動，原生手勢值更快：Rust 中的 `.pan_values(x, y)`、`.pinch_value(scale)` 與 `.rotation_value(angle)`，TSX 中的 `pan={{ x, y }}`、`pinch` 與 `rotation` 屬性。拖曳會在 UI 執行緒上寫入[動畫值](#animation)，App 只會在開始與結束時收到通知（`on_pan_start` / `on_pan_end`、`onPanStart` / `onPanEnd`）。見[觸控與手勢](../docs/touch-and-gestures.md)。

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

建立 pan responder。將其 `panHandlers` 展開到應接收手勢的檢視上。在 Rust 中，由檢視自行取得觸控並監聽：

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

### 回呼

每個回呼都會接收觸控事件（`GestureResponderEvent`，來自 [`nsh`](#types)）與手勢狀態。在 Rust 中，claim 以 `.ask(|request: &ClaimRequest| …)` 決定，呼叫 `request.claim()` 以取得觸控（沒有 `ask` 時一律取得），而每個監聽器會收到一個 `ResponderEvent`，其 `gesture` 即為該狀態。

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| 回呼 | Rust | 傳回 | 呼叫時機 |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | 手指按下：傳回 `true` 以成為回應者。由被觸碰的檢視向外詢問。 |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | 同上，但在冒泡階段之前由外向內詢問（父層從子層手中取得手勢）。 |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | 手指移動：傳回 `true` 以成為回應者（例如僅在 `Math.abs(g.dx) > 10` 之後）。 |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | 同上，捕捉階段。 |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | 此檢視現在是回應者：手勢開始。 |
| `onPanResponderReject` | `.on_responder_reject(…)` | | 另一個檢視是回應者且不肯放手。 |
| `onPanResponderStart` | `.on_responder_start(…)` | | 回應期間有手指按下。 |
| `onPanResponderMove` | `.on_responder_move(…)` | | 手指移動。 |
| `onPanResponderEnd` | `.on_responder_end(…)` | | 回應期間有手指抬起。 |
| `onPanResponderRelease` | `.on_responder_release(…)` | | 最後一根手指抬起：手勢結束。 |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | 另一個檢視（或原生手勢，例如捲動檢視）取走了觸控。 |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` 即保留觸控 | `boolean` | 另一個檢視想要取得觸控：傳回 `false` 以保留（預設為 `true`）。 |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | 回應期間是否阻止原生捲動檢視取走觸控（預設為 `true`）。 |

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

Rust：`PanGesture`，點為 `Point<Points>`。

| 欄位 | Rust | 說明 |
|---|---|---|
| `stateID` |  | 識別該手勢。 |
| `moveX`、`moveY` | `position` | 觸控質心的最新位置，以表面點為單位。 |
| `x0`、`y0` | `origin` | 授予回應者時質心所在的位置。 |
| `dx`、`dy` | `delta` | 自授予以來移動的距離。 |
| `vx`、`vy` | `vx`、`vy` | 速度，單位為每秒點數。 |
| `numberActiveTouches` | `active_touches` | 按下的手指數。 |

<a id="inside-scroll-views"></a>

### 在捲動檢視內

當 pan responder 為回應者時，其周圍的原生捲動檢視不會捲動（`onShouldBlockNativeResponder` 預設為 `true`）。若要讓水平滑動與垂直捲動並存，只在水平移動時成為回應者：

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

對於平台能辨識的 pan，`TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` 會在手指移動時於主執行緒上決定。底層的回應者屬性（`onStartShouldSetResponder`、`onResponderGrant`、`onTouchStart` 等）也可直接用於任何元素；見[元素](../elements/index.md)。

## Clipboard

Clipboard API 可讀寫系統剪貼簿：各平台皆支援文字（iOS 上為 `UIPasteboard`，Android 上為 `ClipboardManager`，桌面平台上為 `NSPasteboard`、GDK 與 Win32 剪貼簿，網頁上為 `navigator.clipboard`），iOS、桌面平台與網頁支援圖片，桌面平台與 Mac Catalyst 則支援在檔案管理員中複製的檔案。Rust 程式碼呼叫 `nsh_core::prelude` 的函式（`set_clipboard`、`clipboard_string` 等）；TSX 從 `nsh` 匯入 `Clipboard`。

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

| TS | Rust（`nsh_core::prelude`） |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

Rust 的讀取函式會傳回可在任務中等待的回應（`spawn`，或 `async` 模組函式）；`ClipboardImage` 為 `nsh_core::element::ClipboardImage`，帶有 `url` 與 `size`（一個 `Size<DevicePixels>`）。

圖片可透過剪貼簿在 iOS、桌面平台與網頁上使用。Android 的剪貼簿只承載文字：`writeImage` 與
`readImage` 會以 `Error` 拒絕，其 `code` 為 `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`，而 `hasImage` 會解析為
`false`。在 Rust 中，`set_clipboard_image` 在該處保持剪貼簿原狀，`clipboard_image` 回應 `None`。

使用者也可以自行從[可選取文字](../elements/text.md)複製；Clipboard API 用於從程式碼複製，例如「複製」按鈕。

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

將 `text` 放到剪貼簿，取代原有內容。Rust：`set_clipboard(text)`。

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

以剪貼簿的文字完成，若沒有文字則為 `""`。Rust：`clipboard_string()`。在 iOS 上，讀取剪貼簿可能會顯示系統的貼上通知（「App pasted from …」），在 Android 10 以上則僅有位於前景的 App 可以讀取。請在使用者要求貼上時才讀取，而不是每個畫面都讀。

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

以剪貼簿是否含有文字完成，且不讀取內容：iOS 上不會出現貼上通知。Rust：`clipboard_has_string()`。可用它決定是否顯示「貼上」按鈕。在網頁上，瀏覽器只能透過讀取來得知，因此可能會向使用者請求權限。

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

以剪貼簿中的圖片完成，若沒有圖片則為 `null`：貼上的螢幕截圖，或在瀏覽器
或圖片編輯器中複製的圖片。Rust：`clipboard_image()`，沒有圖片時為 `None`。`url` 是圖片的 URL（PNG，或
剪貼簿本身的 JPEG、GIF、WebP 或 BMP），[`Image`](../elements/image.md) 以其 `src` 顯示，`fetch` 也能讀取：
`fetch(url)` 提供其位元組，可用於上傳。`size`（`width` 與 `height`）是解碼後以像素為單位的大小。與
`readText` 相同，請在使用者要求貼上時才讀取。最大 48 MB（編碼後）的圖片會被讀取，以確保圖片能放入
App 的記憶體；更大的圖片會以 `Error` 拒絕，其 `code` 為 `"ERR_NSH_QUOTA_EXCEEDED"`（訊息中會給出
圖片的大小與上限），而 `hasImage` 會解析為 `true`。Rust：`clipboard_image()` 對此回應 `None`。

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

聊天式 App 若讓使用者把螢幕截圖貼到輸入區，可在輸入欄位取得焦點時綁定貼上快速鍵，
並在有圖片時取用：

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

以剪貼簿是否含有圖片完成，且不讀取內容：iOS 上不會出現貼上通知。Rust：
`clipboard_has_image()`。在 Android 上會解析為 `false`。

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

將 `src` 的圖片（base64 `data:` URL，或 `readImage` 提供的 `url`）放到剪貼簿，取代原有內容。
Rust：`set_clipboard_image(src)`。在 Windows 上它接受 PNG，這是瀏覽器、Office 與 Snipping Tool 所讀取的格式。在
Android 上會以 `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` 拒絕。

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

以在檔案管理員（Finder、Explorer、Files）中複製的檔案與資料夾的 `file:` URL 完成，依其
順序排列，或為 `[]`：與[檔案拖放](../elements/view.md#desktop-file-drops)給出的 URL 相同。Rust：`clipboard_files()`。
解析 URL 即可取得其路徑。

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
> 當你的 App 在 `nsh.json` 中宣告 `capabilities` 時，必須以 `"clipboard": true` 授予剪貼簿權限。否則 `Clipboard` 的每個函式都會以 `Error` 拒絕，其 `code` 為 `"ERR_ACCESS_DENIED"`，`permission` `"clipboard"`，以及 `resource` `""`，且不會觸及系統剪貼簿。在 Rust 中，寫入會保持剪貼簿原狀，讀取則回應空剪貼簿的結果（`""`、`None`、空清單、`false`），並記錄該次拒絕。見[沙盒與 capabilities](../docs/sandbox-and-capabilities.md)。
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

picker API 會顯示系統的照片選擇器,並將使用者挑選的圖片交給應用程式:iOS 上是 Photos picker(`PHPickerViewController`),Android 上是 Photo Picker,桌面平台上是開啟面板或檔案對話框,瀏覽器中則是 file input。在 iOS 與 Android 上,選擇器在應用程式之外執行,只交出使用者挑選的內容,因此不需要照片庫權限。每張選取的圖片會以 `File`(TSX)或 `PickedFile`(Rust)的形式送達,其位元組保留在原生端:以 `URL.createObjectURL(file)` 在 [`Image`](../elements/image.md) 中顯示,以 `fetch` 和 `FormData` 上傳。Rust 程式碼呼叫 `pick_images`(屬於 `nsh_core::prelude`);TSX 從 `nsh` 匯入 `Picker`。

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
| `multiple`、`limit` | `PickRequest::new(multiple, limit)`(`limit`:0 代表最多 100 張) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`、`.type`、`.size` | `file.name`、`file.mime`、`file.data.len()` |
| `image.size` | `file.size`(`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

顯示選擇器,並在使用者依選取順序挑選完圖片後 resolve 並回傳這些圖片;使用者取消時則回傳 `[]`。Rust:`pick_images(request)`,這是在 task 中 await 的結果(`spawn`,或 `async` 模組函式)。`pickImages` 不會 throw:超出範圍的選項(`limit: 0`,即不在 0 到 1 之間的 `quality`)會以 `RangeError` reject promise,而應用程式的 capabilities 未授權的選取會以 `ERR_ACCESS_DENIED` reject(見下方)。取消是使用者的回答,而非失敗:會 resolve `[]`。

圖片送達時已可直接傳送:

- **所有瀏覽器與伺服器都支援的格式。** JPEG、PNG、GIF 與 WebP 維持原樣;以其他格式儲存的照片(iPhone 上的 HEIC、HEIF、TIFF)會轉為 JPEG。`format: "current"` 則保留儲存時的格式。
- **在原生端縮小。** 設定 `maxDimension` 時,長邊超過該值的圖片會縮放至符合該值、轉正方向,並重新編碼:PNG 仍為 PNG,其他一律為 `quality` 品質的 JPEG。手機照片為 12 至 48 百萬像素;上傳前縮放到 2048 像素,可讓檔案只剩數百 KB。指定 `quality` 時,JPEG 也會重新編碼。
- **顯示的樣子。** `size` 是圖片顯示時的像素尺寸,已套用相機方向。NSH 重新編碼的圖片不含中繼資料(不含位置);維持原樣的圖片則保留自身的中繼資料。

在 Windows、Linux 以及 GPUI 視窗中,對話框會提供請求接受的格式(使用 `"compatible"` 時:JPEG、PNG、GIF 與 WebP),檔案以儲存時的樣子、原本的尺寸送達。

聊天輸入框附加照片、在撰寫訊息時顯示,並在送出時上傳:

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

一次選取多張照片:

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

### 內嵌應用程式

內嵌 NSH 且有自己選擇器(例如具備應用程式自有相簿)的應用程式,可自行回應選取:在 Rust 中,提供給 engine 的 `PickerBackend`(`nsh_core::picker`)(透過 `EngineConfig::picker`,在 GPUI 與 GPUI Kit 應用程式中則為 `AppView::set_picker`)會收到每次選取的 `PickRequest` 並回傳檔案,此時不會顯示系統選擇器。它回傳的檔案會如同平台所提供的檔案一樣被補全:依請求的上限裁切,並從位元組讀取其大小、類型與副檔名。

<a id="tests"></a>

### 測試

`nsh test` 在 headless 執行中回應選取:`app.onPick(handler)` 回傳使用者挑選的檔案(`{ name, type, data }`),沒有 handler 時選取會被取消。請參閱 [測試](../docs/testing-and-trace.md)。

> [!NOTE]
> 當你的應用程式在 `nsh.json` 中宣告 `capabilities` 時,必須以 `"picker": true` 授予選擇器。否則 `pickImages` 不會顯示任何內容,並以 `Error` reject,其 `code` 為 `"ERR_ACCESS_DENIED"`,`permission` `"picker"` 與 `resource` `""`。在 Rust 中,`pick_images` 回應無檔案,並記錄該次拒絕。請參閱 [沙箱與 capabilities](../docs/sandbox-and-capabilities.md)。

## Speech

speech API 會將使用者所說的話轉為文字(聽寫):應用程式啟動 session,平台聆聽麥克風,逐字稿隨內容增加而送達。macOS 與 iOS 以系統的 Speech framework 辨識;系統會向使用者詢問一次麥克風與語音辨識權限。在其他平台上,session 會立即以錯誤 `"unavailable"` 結束,因此顯示麥克風按鈕前請先檢查 `Speech.available()`。Rust 程式碼呼叫 `recognize_speech`(屬於 `nsh_core::prelude`);TSX 從 `nsh` 匯入 `Speech`。

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
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()`(捨棄它即中止) |

### Speech.start

啟動 session 並立即回傳。session 依下列順序回報:麥克風開啟且辨識器開始聆聽時的 `start`、每次逐字稿變動時的 `result`(`text` 永遠是到目前為止的完整逐字稿,因此應用程式可直接原樣顯示),以及一個 `end`,之後不會再有任何事件。`stop()` 停止聆聽並讓辨識器完成已聽到的內容:帶有 `isFinal: true` 的最後結果,然後是 `end`。`abort()` 立即結束 session,不產生錯誤,並捨棄尚未回報的內容。同一時間只會執行一個 session:啟動另一個會中止正在執行的 session。

`end` 帶有最後的逐字稿,session 失敗時還帶有 `error`,命名沿用 Web Speech API:

| `error` | 時機 |
|---|---|
| `"not-allowed"` | 使用者或系統不允許使用麥克風或語音辨識。 |
| `"no-speech"` | 沒有說話。 |
| `"audio-capture"` | 無法使用麥克風。 |
| `"network"` | 辨識器需要網路但無法連線。 |
| `"language-not-supported"` | 辨識器不支援 `lang`。 |
| `"unavailable"` | 此平台不支援語音辨識,或目前無法使用。 |
| `"failed"` | 辨識器因其他原因失敗。 |

`start` 在選項型別錯誤時 throw `TypeError`,在 `lang` 不是語言標籤時 throw `RangeError`。

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

在可執行 session 的地方 resolve `true`:macOS 與 iOS,以及內嵌應用程式自行辨識語音的任何地方。

### Info.plist

在 macOS 與 iOS 上,系統會顯示應用程式為何需要麥克風與語音辨識。當應用程式可使用語音時(其 `capabilities` 授予 `speech`,或未宣告任何授權),`nsh package` 與 `nsh run` 會將 `NSMicrophoneUsageDescription` 與 `NSSpeechRecognitionUsageDescription` 寫入應用程式的 Info.plist。

<a id="embedding-apps-1"></a>

### 內嵌應用程式

內嵌 NSH 且以自己的方式辨識語音(自有 engine 或服務)的應用程式,可自行回應 session:在 Rust 中,提供給 engine 的 `SpeechBackend`(`nsh_core::speech`)(透過 `EngineConfig::speech`)會收到每個 session 的 `SpeechRequest`,以及可從任何執行緒回報的 `SpeechSink`,並回傳 core 用來停止與中止 session 的 `SpeechControl`。此時不會使用平台的辨識器。

<a id="tests-1"></a>

### 測試

`nsh test` 在 headless 執行中以假的辨識器執行 session:session 立即啟動,`app.hear(text)` 將 `text` 回報為到目前為止的逐字稿,`app.endSpeech(error?)` 結束 session,`app.speechRequests()` 列出應用程式啟動的 session。請參閱 [測試](../docs/testing-and-trace.md)。

> [!NOTE]
> 當你的應用程式在 `nsh.json` 中宣告 `capabilities` 時,必須以 `"speech": true` 授予語音。否則 `Speech.start` 會 throw `Error`,其 `code` 為 `"ERR_ACCESS_DENIED"`,`permission` `"speech"` 與 `resource` `""`。在 Rust 中,session 以 `not-allowed` 結束,並記錄該次拒絕。請參閱 [沙箱與 capabilities](../docs/sandbox-and-capabilities.md)。

## Storage

storage API 將應用程式資料保存在裝置上:以字串 key 存放字串,下次應用程式啟動時仍在。可用於設定、草稿、使用者上次開啟的分頁、伺服器所送資料的快取,以及任何應在應用程式處理程序結束後仍須保留的狀態。Rust 程式碼使用 `nsh_core::storage::Storage`,TSX 從 `nsh` 匯入 `Storage`;兩者讀寫相同的項目,因此同時有 Rust 進入點與 TSX 進入點的應用程式看到的是同一份資料。

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

| TS | Rust(`nsh_core::storage::Storage`) |
|---|---|
| `await Storage.getItem(key)` | `Storage::get_item(key) -> Option<String>` |
| `await Storage.setItem(key, value)` | `Storage::set_item(key, value) -> Result<(), StorageFull>` |
| `await Storage.removeItem(key)` | `Storage::remove_item(key)` |
| `await Storage.keys()` | `Storage::get_all_keys() -> Vec<String>` |
| `await Storage.clear()` | `Storage::clear()` |

Rust 函式是同步的,因為項目都在記憶體中:請在元件執行之處(其本體、handler 與 task)呼叫。

每個應用程式有自己的 storage,key 與值合計最多 5 MB。呼叫依應用程式發出的順序執行,因此 `setItem` 之後的 `getItem` 不必等寫入完成就能看到新值。讀取來自記憶體;寫入則在背景分批寫入磁碟。

| 平台 | 資料保存位置 |
|---|---|
| iOS | 應用程式容器中的 `Library/Application Support/nsh/<app id>/storage.json` |
| Android | 應用程式私有目錄中的 `files/nsh/<app id>/storage.json` |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json`(`~/.local/share/…`) |
| Web | 瀏覽器的 `localStorage`,key 以應用程式 id 命名(`nsh:com.example.todo:…`) |

損毀的 `storage.json` 會以 `storage.json.corrupt` 的名稱保留在旁邊,應用程式則以空的 storage 啟動;無法讀取的檔案會讓應用程式的變更只留在記憶體中,因此該檔案永遠不會被取代。

應用程式 id 是 `nsh.json` 中的 `id`,並隨應用程式一起傳遞:`nsh build` 與 `nsh package` 會將它寫在 bundle 旁,dev server 會傳送它,簽署的套件則帶有其 release key 憑證所擔保的那一個。因此無論在何處執行,每個應用程式都不需任何設定就保有自己的資料;沒有 id 的應用程式則將資料保存於 `default` 之下。內嵌應用程式可選擇其他位置(請參閱 [在 iOS 上內嵌](../docs/ios.md) 與 [在 Android 上內嵌](../docs/android.md))。

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

以 `key` 的值 resolve,沒有值時為 `null`。Rust:`Storage::get_item(key)`,沒有值時為 `None`。

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

將 `key` 設為 `value`,取代原有內容。當 storage 會超過 5 MB 時,以 `Error` reject,其 `code` 為 `"ERR_NSH_QUOTA_EXCEEDED"`;此時不會保留該值。Rust:`Storage::set_item(key, value)`,此時回傳 `Err(StorageFull)`。值是字串:結構化資料請以 JSON 保存(Rust 中用 `serde_json::to_string`,TSX 中用 `JSON.stringify`),並讀回(`serde_json::from_str`、`JSON.parse`)。

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

移除 `key` 及其值。移除沒有值的 key 不會有任何作用。Rust:`Storage::remove_item(key)`。

### Storage.keys

```ts
keys(): Promise<string[]>;
```

依順序以所有 key resolve。Rust:`Storage::get_all_keys()`。

### Storage.clear

```ts
clear(): Promise<void>;
```

移除應用程式的所有 key,例如使用者登出時。Rust:`Storage::clear()`。

<a id="keeping-a-signal-on-the-device"></a>

### 將 signal 保存在裝置上

應用程式啟動時讀取保存的值,之後每當 signal 改變就寫回:

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

`host` 用來連接內嵌 NSH 的應用程式:即 `NshAppView` / `NshView` 周圍的原生應用程式,或在網頁上執行 player 的頁面。應用程式以名稱與 JSON 引數呼叫 host 的函式,並監聽 host 送出的事件。

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

平台是否有能回應呼叫的 host。在網頁上,當頁面提供 host 給 player 時為 `true`([網頁上的 host](#the-host-on-the-web))。

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

以 `args`(任何 JSON 值;沒有時為 `null`)呼叫 host 的函式 `name`,並以其回傳值 resolve。`host.call` 永不 throw:每種失敗都會以 `Error` reject promise,其 `code` 說明發生了什麼(訊息供人閱讀,可能變動):

| `code` | 時機 |
|---|---|
| `ERR_NSH_HOST_ERROR` | host 的函式失敗,或 host 沒有函式 `name`;訊息為 host 所提供 |
| `ERR_ACCESS_DENIED` | `name` 不在應用程式的 [`host` capability](#capability) 中;`permission` 為 `"host"`,`resource` 為名稱 |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | 平台沒有 host:`host.available()` 為 `false` |
| `ETIMEDOUT` | host 未在時限內回應 |
| `ERR_NSH_QUOTA_EXCEEDED` | 已有 1024 個呼叫在等待內嵌應用程式的回應 |

不是有效名稱的名稱(1 至 128 個 `A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:`、`-`,且不含 `..`)會以 `TypeError` reject。

呼叫會等待 host 回應 30 秒,之後以 `ETIMEDOUT` reject;之後才到的回應會被捨棄。`options.timeout` 以毫秒設定等待時間,`0` 代表不設限;大到時鐘永遠到不了的 timeout(約 1e22 ms)同樣無限等待,而負數、`NaN` 或無限大的值會以 `RangeError` reject 該呼叫。時間採用應用程式的時鐘,與其 timer 相同:在使用手動時鐘的 `nsh test` 中,它隨時鐘移動。

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

平台事件會以 host 每次送出的 `event` 的 payload 呼叫 `listener`,直到呼叫 `host.on` 回傳的函式為止;在元件 render 期間加入的 listener 會隨元件停止。host 在應用程式啟動前送出的事件會在啟動後送達,因此在應用程式頂層註冊的 listener 會收到它們;在 listener 註冊之前送出的事件不會重播給它。請透過 `host.call` 讀取應用程式啟動時的狀態,並以 `host.on` 追蹤其變化。

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### 能力授權

應用程式呼叫的每個函式，都必須列在 `nsh.json` 的 `capabilities.host` 中：可以是完整名稱、以 `*` 結尾的前綴，或以 `true` 代表全部。每個應用程式都適用此規則，即使沒有其他 `capabilities` 的應用程式也一樣：宿主的函式絕不會預設授權。未獲授權的呼叫會以 `ERR_ACCESS_DENIED` 拒絕並記錄；嵌入應用程式對這類名稱的 `host.post` 會擲回相同的錯誤；而建置從 `nsh` 匯入 `host` 卻沒有 `capabilities.host` 的應用程式時會顯示警告。事件不需要授權。請參閱 [沙箱與能力](../docs/sandbox-and-capabilities.md#host)。

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### Web 上的宿主

在 Web 上，頁面本身就是宿主。`createPlayer` 的 `host` 選項負責回應呼叫，`player.hostEvent(event, payload)` 則負責傳送事件：

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

已發布的應用程式在 `nsh.json` 中指定其宿主：`web.host` 是應用程式目錄中的 JS 模組，路徑相對於 `nsh.json`，匯出 `createHost(player)`，該函式會回傳帶有 `call` 的物件。`nsh package --target web` 會將它隨網站一併發布，`nsh run --target web` 在開發頁面上執行它，`nsh test` 則為其測試所開啟的應用程式執行它。`web.connect` 列出宿主自身請求可連線的主機，頁面的 Content-Security-Policy 會連同應用程式的 `capabilities.network` 一併允許這些主機。請參閱 [Web](../docs/web.md#the-hosts-functions)。

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

嵌入應用程式在啟動你的應用程式之前所設定的參數，可從程式碼的第一行起同步讀取；若未設定任何參數則為 `{}`。應用程式執行期間它們保持不變：之後的請求會以事件的形式傳來。

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```


<a id="native-sdk-channel"></a>

### Native SDK 通道

原生 SDK 的 `send` 會保留事件直到應用程式開始監聽，最多 256 個。當最後一個監聽器在傳遞期間停止時，其餘事件會依序繼續等待；關閉期間傳送的事件會等待下一個載入的應用程式。`host.post(name, data)` 將資料傳遞給原生 SDK 處理常式，其 `isPost` 用以區分 post 與 call。

<a id="the-embedding-apps-side"></a>

### 嵌入應用程式端

每個 view 會為其載入的所有應用程式保留一個通道。請在載入前設定參數，可隨時從任何執行緒傳送事件，並依名稱註冊處理常式。呼叫與 post 需要應用程式的 `capabilities.host` 授權。處理常式只回應一次，可以立即或稍後回應；若一直沒有回應，該呼叫即失敗。

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

請參閱 [在 iOS 上嵌入](../docs/ios.md#talking-to-the-app)、[在 Android 上嵌入](../docs/android.md#talking-to-the-app) 與 [GPUI](../docs/gpui.md)。

> [!NOTE]
> Native SDK 的呼叫與 post 和平台呼叫使用相同的 [`host` 能力](../docs/sandbox-and-capabilities.md#host)。Rust 應用程式可透過其註冊的函式（[`nativeModule`](#nativemodule) 與 Rust 匯入）直接存取嵌入應用程式的 Rust。

## keymap

keymap 用來繫結應用程式的鍵盤快速鍵：一個按鍵組合（例如 `"mod+k"`）及其執行的函式。Rust 程式碼從 `nsh_core::prelude` 呼叫 `on_key`、`on_key_with` 和 `key_label`；TSX 從 `nsh` 匯入 `keymap`。兩者接受相同的按鍵組合，並遵循相同的規則。

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
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`；`when` 為 `nsh_core::keymap::When`（`Auto`、`Always`、`NotEditing`） |
| `keymap.bind({ … })` | 每個按鍵組合一個 `on_key` |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Rust 繫結的存續時間與建立它的元件（擁有者）相同；處理常式取得的是按原樣書寫的按鍵組合。

快速鍵可在 macOS、Windows、Linux 與瀏覽器中運作（瀏覽器自身的按鍵，例如 Ctrl+T 或 Cmd+W，永遠不會傳到頁面），也可在連接實體鍵盤的 iOS 與 Android 上運作：iPad 的鍵盤、執行 iPad 應用程式的 Mac 的鍵盤、平板或 Chromebook 的鍵盤，以及模擬器的鍵盤。相同的程式碼在所有平台上執行；沒有鍵盤時，沒有任何按鍵會觸發繫結。

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

當 `keystroke` 被按下時執行 `handler`，並回傳一個用來移除該繫結的函式。處理常式會取得 `{ keystroke }`：即你所寫的按鍵組合，大小寫維持原樣。Rust：`on_key(keystroke, handler)`，其處理常式取得的是按鍵組合本身。

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

傳入物件即可一次繫結多個按鍵組合；回傳的函式會將它們全部移除。在 Rust 中，每個按鍵組合各為一個 `on_key`：

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

在元件渲染期間建立的繫結會隨元件一併移除，因此畫面的快速鍵會與該畫面同生共滅：

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

使用 dev server 時，編輯模組會先移除其頂層程式碼先前建立的繫結，再重新執行，因此熱重載不會留下過時的快速鍵。

### keymap.label

```ts
label(keystroke: string): string;
```

回傳 `keystroke` 在應用程式執行處的選單與提示中所呈現的樣子：在 macOS 與 iOS（以及 Mac、iPhone 或 iPad 上的瀏覽器）為 `"⇧⌘L"`，在 Windows、Linux 與其他瀏覽器為 `"Ctrl+Shift+L"`，對應 `"mod+shift+l"`。Rust：`key_label(keystroke)`。可用它以實際有效的按鍵來顯示應用程式的快速鍵：

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

對於無效的按鍵組合，它會擲回 `TypeError`，與 `bind` 相同；`key_label` 和 `on_key` 會以相同的訊息 panic。

<a id="keystrokes"></a>

### 按鍵組合

按鍵組合由修飾鍵與一個按鍵以 `+` 連接而成：`"mod+k"`、`"ctrl+shift+p"`、`"alt+enter"`、`"escape"`、`"f5"`、`"cmd+-"`（Command 與減號）。

| 修飾鍵 | macOS | Windows | Linux |
|---|---|---|---|
| `mod`（亦可寫作 `cmdorctrl`） | Command (⌘) | Ctrl | Ctrl |
| `cmd`（亦可寫作 `command`、`meta`、`super`、`win`） | Command (⌘) | Windows 鍵 | Super |
| `ctrl`（亦可寫作 `control`） | Control (⌃) | Ctrl | Ctrl |
| `alt`（亦可寫作 `option`、`opt`） | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS 遵循 macOS（`mod` 為 Command），Android 遵循 Windows 與 Linux（`mod` 為 Ctrl，`cmd` 為 Meta 鍵）。在瀏覽器中，按鍵遵循瀏覽器所執行的平台：`mod` 在 Mac、iPhone 或 iPad 上是 Command，其他平台則是 Ctrl。

應用程式自己的快速鍵請使用 `mod`：這是各平台應用程式用於此用途的按鍵（macOS 為 ⌘K，Windows 與 Linux 為 Ctrl+K），因此一種寫法即可通用各處。Windows 鍵與 Super 多半屬於系統，所以 `cmd` 在 macOS 以外很少適用。

按鍵可以是字母、數字或標點符號鍵，寫成它在美式鍵盤上不按 Shift 時所輸入的字元（`k`、`1`、`,`、`/`、`[`；`"shift+/"` 代表 `?`，`"shift+k"` 代表 Shift+K），或是名稱：`plus`（`=` / `+` 鍵，亦可寫作 `=`）、`minus`（亦可寫作 `-`）、`space`、`enter`（`return`）、`escape`（`esc`）、`tab`、`backspace`、`delete`（`del`）、`insert`、方向鍵 `up`、`down`、`left`、`right`（`arrowup`、…）、`home`、`end`、`pageup`、`pagedown`、`f1` 至 `f24`。大小寫無關：`"Mod+Shift+K"` 即 `"mod+shift+k"`，大寫字母與小寫是同一個鍵，而不是 Shift（`"mod+K"` 即 `"mod+k"`）。建議使用小寫，本文件各頁皆如此。`"mod-k"` 與 `"mod++"` 是錯誤，其訊息會給出正確的寫法。`nsh/desktop` 中的選單快速鍵接受相同的按鍵組合。

快速鍵適用於任何鍵盤配置：在西里爾字母或希臘字母配置上，`mod+k` 是在美式配置下輸入 K 的那個鍵，與選單快速鍵相同。

`bind` 對無效的按鍵組合會擲回 `TypeError` 並說明問題所在（`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`），也會拒絕系統自行保留的按鍵組合，因此應用程式絕不會破壞它們：

| 平台 | 保留的按鍵 |
|---|---|
| macOS、iOS | Cmd+Q（結束）、Cmd+H（隱藏）、Option+Cmd+H（隱藏其他）、Cmd+M（最小化）、Ctrl+Cmd+F（全螢幕） |
| Linux、Windows、Android | Ctrl+Q（結束）、Alt+F4（關閉）、F11（全螢幕） |
| Web | 無（瀏覽器保留自己的按鍵） |

<a id="while-typing"></a>

### 輸入文字時

取得鍵盤焦點的文字輸入框需要使用它的按鍵：輸入、移動插入點、刪除，以及全選、剪下、複製、貼上、復原與重做。因此預設情況下，當文字輸入框（或 web view）取得焦點時，若按鍵組合屬於下列之一，繫結不會觸發：單純的按鍵與僅搭配 Shift 或 Option 的按鍵、方向鍵、Home、End、Page Up / Down、Return、Tab、Escape、Backspace、Delete，以及 `mod+a`、`mod+c`、`mod+v`、`mod+x`、`mod+z`。其他搭配 Command 或 Control 的按鍵組合以及功能鍵，無論焦點在哪裡都會觸發。

`when` 可改變此行為（Rust：`KeyOptions { when: When::Always, .. }`）：

| `when` | 觸發時機 |
|---|---|
| （預設） | 如上所述 |
| `"always"` | 也會在文字輸入框中觸發，且早於輸入框接收到按鍵 |
| `"notEditing"` | 文字輸入框取得焦點時絕不觸發 |

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

在 iOS 與 Android 上，輸入法正在組字所用的按鍵（選擇候選字、確認輸入）仍歸輸入法所有。在 GPUI 後端上，取得鍵盤焦點的原生元件會被視為文字輸入框，因為它可能是文字編輯器。它會先接收每個按鍵：它自行處理的按鍵絕不會到達繫結，而在編輯文字時會觸發的繫結，取得的是它放行的按鍵。

<a id="which-binding-runs"></a>

### 哪個繫結會執行

觸發繫結的按鍵會被消耗：不會被輸入、系統不會發出提示音，NSH 自身的按鍵也看不到它（例如 Escape 返回、Tab 移動焦點、方向鍵捲動）。當多個繫結具有相同的按鍵組合時，會執行最新且可觸發的那一個，因此對話框可以將 Escape 繫結在畫面的繫結之上，對話框的繫結移除後，畫面的繫結便會恢復。繫結會在按下按鍵的當下由原生層檢查；處理常式隨後在引擎執行緒（Rust）或 JS 執行緒（TSX）上執行。

按住按鍵時，其繫結只會觸發一次，直到放開按鍵；使用 `repeat: true` 時，每次自動重複都會再次觸發（例如逐項走訪清單）：

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

選單快速鍵會讓位給相同按鍵組合的繫結：在所有桌面平台上是應用程式選單的（[`nsh/desktop`](./nsh-desktop)），在 macOS 上還包括內建選單的（Cmd+W、Cmd+C 等）。使用 `nsh run` 開發時，Cmd+R / Ctrl+R 一律會重新載入應用程式，即使它繫結了 `mod+r`；封裝後的應用程式則可以繫結它。

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent 與 nativeModule

`nativeComponent` 與 `nativeModule` 會在執行時依名稱將你的應用程式連接到宿主應用程式所提供的內容。嵌入 NSH 的 iOS 或 Android 應用程式可以依名稱註冊自己的 view（地圖、圖表、相機預覽）；`nativeComponent` 會為其中之一提供具型別的元件。由於 NSH 以真正的原生 view 渲染，這類元件如同其他 view 一樣位於 view 階層中：由 NSH 排版，隨其父層裁切與捲動，並能正確重疊。從 Rust 嵌入 NSH 的應用程式也可以註冊函式、類別與 Rust 元件；`nativeModule` 會將它們當作一個具型別的物件提供給你。無論哪種情況，你的應用程式都使用標準的 `nsh build` 建置：宿主在執行應用程式時才連接它所提供的內容。Rust 程式碼使用 `nsh_core::prelude` 的 `native(name)` 放置已註冊的 view，以 `.prop(name, value)`（JSON 值，或其 signal 或閉包）設定其 props，或以 `.bind_prop(name, &value)` 將其中一個繫結到動畫值，以 `.on_native_event(…)` 接收其事件，並透過 `ElementRef` 呼叫其命令；TSX 則匯入 `nsh`。

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

請參閱 [原生元件](../docs/native-components.md) 了解如何註冊原生端，以及 [在 iOS 上嵌入](../docs/ios.md) / [在 Android 上嵌入](../docs/android.md)。

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

回傳嵌入應用程式以 `name` 註冊的原生元件所對應的元件（Swift `NshAppView.register(component:)`、Java `NshView.registerComponent`）。Rust：`native(name)`，其 props 為 JSON 值（`.prop("text", json!(…))`），事件則以 `NativeEvent { name, data }` 傳來。

- `P` 是它自身 props 的型別。`spec.props` 中列出的每個 prop 在變更時都會以 JSON 傳送到原生端；將它設為 `undefined` 會移除該 prop。
- `E` 將事件名稱對應到其 payload。事件 `regionChange` 會成為處理常式 prop `onRegionChange`。
- 此元件也接受除 `children` 以外的所有 [view prop](../elements/view.md)：`style`、`class`、版面配置、無障礙、觸控處理常式與 `ref`。

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### 尺寸

元件的排版方式與 view 相同，尺寸取決於其樣式。當樣式未指定某個維度時，會使用原生元件回報的尺寸（如同影像使用其原始尺寸）。

<a id="commands"></a>

#### 命令

它的 `ref` 會接收一個 `NativeComponentRef`；`ref.command(name, args)` 以 `args`（任何 JSON 值）呼叫原生元件的命令 `name`。Rust：`ElementRef::command(name, args)`。

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### 未註冊任何項目時

當 `name` 下未註冊任何項目時（不同的宿主應用程式、dev host、瀏覽器），元件會渲染為空 view，並記錄一次警告。請讓應用程式在沒有它時仍可使用，或在使用前檢查你的宿主。

<a id="example"></a>

### 範例

這裡的徽章是宿主應用程式的原生 view，以 `embed.badge` 註冊。NSH 為它排版，傳送 `text` 與 `color`，接收其 `tap` 事件，並呼叫其 `pulse` 命令：

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

傳回內嵌應用程式以 `specifier` 註冊的集合所匯出的內容：其模組、類別、函式與 Rust 元件，合併為單一物件。型別 `T` 由應用程式自行撰寫，因此建置時不需要任何關於宿主的資訊。與宿主 crate 一同建置的 Rust 程式碼會直接以 Rust 方式呼叫這些函式；TSX 則透過 `nativeModule` 存取它們。

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

- 呼叫方式與匯入集合時相同：一般的 Rust 函式會立即傳回其值，`async` 函式會傳回 promise，而你傳入的函式則成為 Rust 日後可以呼叫的回呼。Rust 會檢查每個引數，若引數有誤就會擲出 `TypeError`。
- 以相同的 `specifier` 每次呼叫都會傳回同一個物件。
- 若 `specifier` 下沒有註冊任何內容，`nativeModule` 會擲出指名該名稱的 `ReferenceError`。請在應用程式能夠處理的地方呼叫它，或只在它所對應的宿主中呼叫。

宿主在啟動其檢視之前，以 Rust 透過平台 crate 的 `set_ui_sets`（與 NSH 自身的集合並列）或 `EngineConfig::ui_sets` 註冊集合：

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

`on` 是宿主讓每個應用程式與自身資料保持同步的方式：它啟動的任務會等待宿主的變更，並將每項變更傳送給應用程式，因此無論變更來自宿主，還是來自任何應用程式透過另一個函式所做的操作，都會傳達到每個正在監聽的應用程式。它傳回的 `Stop` 就是 TSX 中 `Trading.on` 所傳回的函式：它只會執行一次，當應用程式呼叫它，或當呼叫 `on` 的對象結束時（元件，或熱重載下模組的執行）觸發，並在此處移除監聽器，使任務結束。

> [!NOTE]
> 屬性、事件與命令引數會以 JSON 形式傳遞到原生端。已註冊的元件與函式是宿主應用程式自己的程式碼：NSH 的[沙箱限制與能力](../docs/sandbox-and-capabilities.md)不適用於它們所執行的操作。

<a id="accessibility"></a>

## 無障礙功能

無障礙功能 API 會讀取使用者的無障礙設定（是否有螢幕閱讀器正在執行、使用者是否要求減少動態效果），並與螢幕閱讀器溝通。Rust 程式碼從 `nsh_core::prelude` 呼叫 `screen_reader()`、`reduce_motion()` 與 `announce_for_accessibility()`，並以 `ElementRef` 移動焦點；TSX 則從 `nsh` 匯入 `screenReaderEnabled()`、`reduceMotion()`、`announce()` 與 `setAccessibilityFocus()`。這些設定是響應式的：在繫結、`computed` 或 `effect` 中讀取它們，當使用者變更設定時，讀取它們的內容就會更新。元素的無障礙功能屬性（`accessibilityLabel`、`role` 等）記載於[元素](../elements/index.md)；指南請見[無障礙功能](../docs/accessibility.md)。

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

螢幕閱讀器（VoiceOver、TalkBack）是否正在執行。具響應性：當使用者開啟或關閉螢幕閱讀器時，讀取它的內容會隨之更新。Rust：`screen_reader() -> bool`，同樣具響應性。

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

使用者是否要求減少動態效果（iOS 的「減少動態效果」，Android 的「移除動畫」）。具響應性。Rust：`reduce_motion() -> bool`。Tailwind 類別也會透過 `motion-reduce:` 變體跟隨此設定。

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

螢幕閱讀器會朗讀 `message`（VoiceOver 的公告、TalkBack）。適用於在焦點未移動的情況下出現的結果，例如「已儲存」。Rust：`announce_for_accessibility(message)`。

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

將螢幕閱讀器的焦點移到 `node`（元素的 `ref`）。Rust：`ElementRef::set_accessibility_focus()`。

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

## 型別

`nsh` 也會匯出響應式 API 與宿主元素的型別。最常用的有：

| 型別 | 說明 |
|---|---|
| `Accessor<T>` | 可讀取的值：`() => T` |
| `Signal<T>` | 具有 `set` 與 `update` 的 `Accessor<T>` |
| `SignalOptions<T>` | `signal` 與 `computed` 的選項（`equals`） |
| `Context<T>` | `context` 的傳回值 |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | JSX 命名空間（`JSX.Element`） |
| `ViewRef`、`InputRef`、`ScrollRef`、`ListRef`、`WebViewRef`、`VideoRef`、`NativeComponentRef` | `ref` 接收到的內容，即各元素自己的型別（`ViewRef` 及建構於其上的型別）：焦點、捲動與其他命令。`ViewRef` 同時也是元素本身的型別（`JSX.Element`）。參見 [ref 方法](../elements/index.md#ref-methods) |
| `ViewProps`、`TextProps`、`ImageProps`、`ScrollProps`、`CommonProps`、`TouchProps` | 宿主元素的屬性 |
| `ViewStyle`、`TextStyle`、`InputStyle`、`ImageStyle`、`LayoutStyle`、`StyleProp<T>` | 樣式物件；請見[樣式參考](./style-reference.md) |
| `ColorValue`、`DimensionValue`、`LengthValue`、`TransformStep` | 樣式內的值 |
| `GestureResponderEvent`、`MouseEvent`、`MouseButton`、`ContextMenuEvent`、`PressEvent`、`ScrollEvent`、`PanEvent`、`TouchPoint` | 事件負載 |
| `Point`、`Size`、`Bounds`、`Edges`、`Modifiers` | 組成負載與屬性的結構，欄位與 GPUI 相同（`nsh_core::geometry`） |
| `PixelSize` | 圖片或影片本身的像素尺寸（`onLoad`、`Image.getSize`、剪貼簿與選擇器的圖片），而 `Size` 的單位是點 |
| `ImageAsset` | 匯入圖片檔案所得到的內容（`{ url, size: Size, scales? }`；`scales` 列出其[像素密度變體](../docs/images-and-assets.md#pixel-densities)） |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`、`AccessibilityState` | 無障礙功能屬性 |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` 接受單一樣式，或由左至右合併的樣式清單，並會略過值為 falsy 的項目：

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
