---
title: "nsh"
description: "コアモジュール: シグナル、エフェクト、コンテキスト、マウント、デザイントークン、アニメーション、環境、ジェスチャー、クリップボード、ストレージ、ホストチャネル、キーボードショートカット、アクセシビリティ、および要素型とスタイル型。"
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` はコアモジュールです。リアクティブ API(シグナル、算出値、エフェクト、コンテキスト)、`mount`、`token`、ホスト要素の `View`、`Text`、`Scroll`、`Overlay`、[選択可能なビュー](#selectable-views)、[セーフエリアとキーボード](#safe-area-and-keyboard)、[アニメーション](#animation)、[デバイスとその環境](#device)、[`PanResponder`](#panresponder)、[クリップボード](#clipboard)、[フォトピッカー](#picker)、[音声認識](#speech)、[ストレージ](#storage)、[ホストチャネル](#host)、[キーボードショートカット](#keymap)、[ネイティブコンポーネントとモジュール](#nativecomponent-and-nativemodule)、[アクセシビリティ](#accessibility)、そして要素・スタイル・イベントの TypeScript 型を提供します。リアクティブグラフ自体は Rust でネイティブに動作します。シグナルの読み取りはランタイムへの呼び出しで、数ナノ秒しかかかりません。JavaScript インタプリタで実行されるのは、あなた自身のクロージャだけです。

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

NSH のリアクティビティは SolidJS と同じモデルに従います。コンポーネント関数は **1 回だけ** 実行され、シグナルを読み取っている UI の部分は、そのシグナルが変化したときにその場で更新されます。コンポーネントの再レンダリングも仮想 DOM もありません。ガイドは [リアクティビティ](../docs/reactivity.md) を参照してください。

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

シグナルは値を保持します。呼び出すと値を読み取り、追跡スコープ(JSX 式、`computed`、`effect`)の内側であれば、そのスコープをシグナルに購読させます。`set` と `update` は値を書き込み、それを読み取っていたものがすべて更新されます。

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

既定では、現在の値と `===` な値の書き込みは何も行いません。書き込みのたびに通知したい場合(オブジェクトをその場で変更し、同じオブジェクトを再度設定するときに便利です)は `equals: false` を渡すか、独自の比較関数を渡してください。

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

シグナルから導出される値です。読み取ったシグナルが変化すると `fn` が再実行されます。算出値の読み取り側は、その結果が変わったとき(既定では `equals`、`===` による比較)にのみ更新されます。`fn` は直前の結果を受け取ります。

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

導出のコストが高い場合や複数の場所で読み取る場合は `computed` を使います。軽い式であれば、通常の関数(`const full = () => first() + " " + last()`)でも同じようにリアクティブになります。

## effect

```ts
function effect(fn: () => void): void;
```

レンダリングの後に `fn` を実行し、読み取ったシグナルが変化するたびに再度実行します。エフェクトはログ出力、タイマー、ネイティブモジュールとのやり取りなどの副作用に使います。エフェクトは、それが作成されたコンポーネント(またはエフェクト)に属し、そのコンポーネントとともに破棄されます。

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

エフェクトが再実行される前(またはコンポーネントが消える前)に何かを元に戻したい場合は、エフェクト内で [`cleanup`](#cleanup) を呼び出します。

## batch

```ts
function batch<T>(fn: () => T): T;
```

`fn` を実行し、その中のすべての書き込みを最後にまとめて適用します。これにより、読み取り側は書き込みごとではなく 1 回だけ更新されます。戻り値は `fn` の戻り値です。

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

現在のスコープを読み取り対象に購読させずに `fn` を実行します。エフェクトや JSX 式の内側で、依存せずにシグナルを読み取りたいときに使います。

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

現在のエフェクトが再実行される前、または現在のコンポーネントやエフェクトが消えるときに実行される `fn` を登録します。

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

コンポーネントが、描画するすべての要素(どれだけ深くても)へ提供する値です。コンテキストを呼び出す(`Theme()`)と、最も近いプロバイダーの値を読み取ります。プロバイダーがない場合は `defaultValue` を返します。

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

`app` をサーフェス(ウィンドウ、またはアプリが埋め込まれている `NshAppView` / `NshView`)にレンダリングし、それを取り除く関数を返します。すべてのアプリのエントリファイルは `mount(App)` で終わります。

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

props オブジェクトを、`keys` で指定した名前の props と、それ以外に分割します。両方の結果はリアクティブなままです。値が変化する props はゲッターであり、`split` はそれらをゲッターとして保持します。一部の props を自分で処理し、残りを渡す場合のコンポーネントで使います。props を分割代入(`const { label } = props`)すると、一度だけ読み取られ、更新が失われます。

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

子要素を描画し、その配下で何かが例外を投げたとき(コンポーネントの本体、バインディング、エフェクト、イベントハンドラー)は `fallback` を描画します。失敗した部分は取り除かれ、その場所にフォールバックが表示されます。関数 `fallback` は、スローされた値と、子要素を再度描画する `reset` を引数として `fallback(error, reset)` のように呼び出されます。宣言しているパラメータが何であっても同様です。`fallback` 要素はそのまま表示されます。失敗は、その上にある最も近いバウンダリに渡され、フォールバック内での失敗はさらにその上のバウンダリに渡されます。Rust コンポーネントでは `catch_error` を使います([エラーバウンダリ](../docs/reactivity.md#error-boundaries))。

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

アプリのテーマ(`nsh.json` の `"theme"`。shadcn/ui のトークンをベースにしています)のデザイントークン `name` を、表示中の外観(appearance)に合わせて返します。
色は `#rrggbbaa`、長さはポイント数、フォントはファミリー名です。名前はテーマの CSS 変数から
`--` を除いたもの(`primary`、`muted-foreground`、`radius`、`font-mono`、およびアプリ独自の `up` など)です。読み取りは
リアクティブです。トークンを読み取るコンポーネント、メモ、エフェクトは、テーマや外観が変わると再実行されます。
`Tokens` にはアプリのトークンが型とともに列挙されており、NSH がテーマから `.nsh/types/nsh/tokens.d.ts` に書き出します。
クラスでは、トークンを直接指定します(`bg-primary`、`rounded-(--radius)`)。詳しくは [テーマトークン](../docs/tailwind.md#theme-tokens) を参照してください。

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

`nsh` がエクスポートするホスト要素で、タグとして記述します。`<View>`、`<Text>`、`<Scroll>`、`<Overlay>`(その
子要素をウィンドウの最前面に、アンカーを基準に配置します。[Overlay](../elements/overlay.md))です。コンパイラは、
インポート経由でこれらのいずれかを指すタグ(エイリアスも含む)に対して、その場でネイティブビューを
生成するため、インポートしても実行時のコストはかかりません。これらは他のコンポーネントと同様の
コンポーネントなので、受け渡すこともできます(`const Tag = inline ? Text : View`)。
`nsh` は他のプリミティブも同じ方法でエクスポートしており、[`List`](./nsh-list.md)、[`Image`](./nsh-image.md)、
[`Canvas`](./nsh-canvas.md)、[`WebView`](./nsh-webview.md)、[`Video`](./nsh-video.md) それぞれに専用のリファレンス
ページがあります。それらの props は [要素](../elements/index.md) に記載されています。テキスト入力の `Input` は
[`nsh/base`](./nsh-base.md#input) から提供されます。

<a id="safe-area-and-keyboard"></a>

## セーフエリアとキーボード

CSS の環境変数を使うと、任意のビューの padding と margin で、コンテンツをシステム UI から離して配置できます
(`padding`、`paddingTop` など。同じ `margin` キー。Tailwind の `p*` / `m*` の任意値。Rust では `Styled` のメソッド
`.p_safe_area()`、`.pt_safe_area_plus(..)`、`.pb_keyboard()` など)。値は `EnvValue` です。
`env(name)`、`env(name, <length>)`、`calc(env(name) + <length>)`、`calc(<length> + env(name))`。

| 変数 | 値 |
|---|---|
| `safe-area-inset-top`、`-right`、`-bottom`、`-left` | ノードが描画されるルートビューのインセットです。最も近いページ(ヘッダーの下)、最も近いダイアログ、またはそれ以外の場合はサーフェスのセーフエリアです。[セーフエリア](../elements/safe-area.md) を参照してください。 |
| `keyboard-inset-height` | サーフェス上のソフトウェアキーボードの高さです。非表示の間は 0 で、変化はキーボードに合わせてネイティブにアニメーションします。[キーボード](../elements/keyboard.md) を参照してください。 |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

### safeArea and safeAreaInsets

`safeArea()` はサーフェスのセーフエリア(Rust では `safe_area()`)、`safeAreaInsets()` はコンポーネントが
描画される場所のインセット(Rust では `cx.insets()`)で、`safe-area-inset-*` 変数の値です。どちらもリアクティブな `Edges`
(`{ top, right, bottom, left }` はポイント単位)です。詳しくは
[safeArea and safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets) を参照してください。

### Keyboard and keyboardFrame

`Keyboard.dismiss()` はソフトウェアキーボードを非表示にし(Rust では `dismiss_keyboard()`)、`keyboardFrame()` は画面のどれだけが
キーボードで覆われているかを返します(Rust では `keyboard_height()` と `keyboard_duration()`)。詳しくは
[キーボードを隠す](../elements/keyboard.md#hiding-the-keyboard) と
[キーボードの高さ](../elements/keyboard.md#the-keyboards-height) を参照してください。

<a id="selectable-views"></a>

## 選択可能なビュー

`<View selectable>`(Rust では `view().selectable(true)`)は、内部のテキストを Web ページと同じように一緒に選択できるようにします。
1 つの選択範囲が、ビュー、`Text` 要素、`TextView` をまたいで読み順に連続します。詳しくは
[テキスト選択](../elements/text-selection.md) を参照してください。

<a id="animation"></a>

## アニメーション

アニメーション API は UI スレッド上でアニメーションを実行します。**アニメーション値** を作成し、それ(またはそこから導出した値)をスタイルプロパティにバインドして、アニメーションを開始します。以降、すべてのフレームはアプリのコードを実行することなくネイティブに計算されます。エンジンや JS スレッドがビジー状態でもアニメーションがカクつくことはなく、アニメーションによるフレームごとのアプリ側の処理もありません。Rust のコードでは `nsh_core::prelude` の `animated_value()`、`motion()`、`Animation`、`Spring`、`Timing`、`KeyframeTiming`、`MotionPreset`、`Easing` を使い、要素の `.bind_*` メソッドで値をバインドします。TSX では `nsh` からインポートします。

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

ガイドは [アニメーション](../docs/animation.md) を参照してください。

<a id="what-an-animated-value-can-drive"></a>

### アニメーション値が駆動できるもの

| 対象 | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`、`color` | `.bind_border_color(&node)`、`.bind_color(&node)` | 同じ。色のノードです。`borderColor` はすべての辺に色を付け、`Text` の `color` はテキスト全体に色を付けます |
| `transform` | `.bind_translate_x(&value)`、`.bind_translate_y`、`.bind_scale`、`.bind_rotate`(度) | `translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`、`rotateX`、`rotateY`、`rotateZ` ステップ: `transform: [{ translateX: value }]` |
| スクロール位置 | スクロールビューまたはリストの `.scroll_value(&value)` | `<Scroll scrollValue={value}>` と `<List scrollValue={value}>` が、フレームごとにスクロールオフセットをその値に書き込みます |
| ジェスチャー | `.pan_values(Some(&x), Some(&y))`、`.pinch_value(&scale)`、`.rotation_value(&angle)` | 任意の要素上の `pan={{ x, y }}`、`pinch={{ scale }}`、`rotation={{ angle }}`。ジェスチャーが値を直接書き込みます([タッチとジェスチャー](../docs/touch-and-gestures.md) を参照) |
| ビューが固定される位置 | `.sticky().bind_sticky_top(&value)`(水平スクロールビューでは `.bind_sticky_left`)、リストの `.bind_sticky_header_offset(&value)` | `style={{ position: "sticky", top: value }}`、`<List stickyHeaderOffset={value}>`。スティッキービューとヘッダーが、ビューポートの開始位置からその距離で固定され、フレームごとに値に追従します |
| キャンバス | ペインター呼び出しのアニメーション引数 | [キャンバス](./nsh-canvas.md) の描画呼び出しの任意の数値または色の引数 |
| シェーダー | `.uniform(name, &value)` | [シェーダー](../elements/shader.md) の `struct Uniforms` のメンバー: `uniforms={{ name: value }}`(数値、または `vec3f` / `vec4f` では色のノード) |

その他のスタイルプロパティは通常の値を受け取ります。レイアウト自体(サイズ、フロー内の位置)をアニメーションさせるには、[`LayoutAnimation`](#layoutanimation) を使います。

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

`value`(既定は `0`)から始まるアニメーション値を作成します。Rust では `animated_value(value)` で、作成したコンポーネントが保持する `Copy` ハンドルです。

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
> アニメーション値は UI スレッド上に存在し、フレームごとにそこで変化するため、アプリは非同期に読み取ります。`await value.getValue()`(または `stop()` が解決する `{ value }`)はその時点の値を返し、Rust ではタスク内で `value.value().await` を使います。コードがターゲットをすぐに必要とする場合は、上記のように変数またはシグナルに保持してください。ジェスチャーイベントは、終了時点の値を報告します(`PanEvent.value`)。

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

| メソッド | Rust | 説明 |
|---|---|---|
| `set(value)` | `set(value)` | 実行中のアニメーションを停止して、`value` にジャンプします。 |
| `stop()` | `stop()`、続いて `value().await` | 実行中のアニメーションをその場で停止します。その時点の値である `{ value }` で解決されます。 |
| `getValue()` | `value().await` | UI スレッドで読み取った現在の値(オフセット込み)で解決されます。 |
| `setOffset(offset)` | `set_offset(offset)` | 値に加算されるオフセットです。バインディングには value + offset が見え、`set`、アニメーション、ドラッグは値を動かします。 |
| `flattenOffset()` | `flatten_offset()` | オフセットを値に加算し、オフセットを 0 にします。 |
| `extractOffset()` | `extract_offset()` | 値をオフセットに移し、値を 0 にします(これにより、次のドラッグは前回終了した位置から始まります)。 |
| `timing(to, options)` | `timing(to, ms, easing)`、`timing_with(to, Timing { … })` | イージングカーブに沿って `to` までアニメーションします。`duration` はミリ秒(既定は 300)、`easing`(既定は `"easeInOut"`)、`delay` はミリ秒(既定は 0)です。 |
| `spring(to, options)` | `spring(to, Spring { … })` | `to` までスプリングで動きます。`stiffness`(既定は 170)、`damping`(既定は 26)、`mass`(既定は 1)、`velocity`(初速度、1 秒あたりの単位数)です。 |
| `decay(options)` | `decay(velocity, deceleration)`、`decay_within(velocity, deceleration, (min, max), bounce)` | `velocity`(1 秒あたりの単位数)から慣性で進み、1 ミリ秒ごとに `deceleration`(既定は 0.998)の割合で減速します。フリングの後に、`onPanEnd` から得た速度とともに使います。`clamp: [min, max]` を指定すると、境界で停止するか、速度の `bounce`(0〜1、既定は 0)を保ったまま跳ね返ります。 |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | CSS キーフレームの再生と同様に、[キーフレーム](#keyframes) を再生します。セグメントごとのイージング、`direction` の `iterations` 回の繰り返しに対応します。 |

各アニメーションメソッドは、`{ finished }` で解決される Promise を返します。アニメーションが完了した場合は `true`、停止された場合(`stop`、`set`、または同じ値への別のアニメーションによる)は `false` です。Rust では `AnimationEnd` を返し、タスクが同じ `bool` を得るためにそれを await します。

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

ネイティブのアニメーショングラフのノードです。`AnimatedValue`、または他の値から導出された値です。導出されたノードは、入力が変化するたびに UI スレッドで評価されます。

| メソッド | Rust | 説明 |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`、`interpolate_colors(&input, &colors)`、`interpolate_with(&input, output, Interpolation { … })` | 入力を区分的な範囲でマッピングします。`outputRange` には、数値、色(`"#ff0000"`、`"rgba(…)"`)、角度(`"45deg"`、`"1rad"`)を指定できます。`inputRange` の外側では既定でクランプされます。`extrapolate`(または `extrapolateLeft` / `extrapolateRight`)には `"extend"`(線を延長する)、`"clamp"`、`"identity"`(入力をそのまま通す)を指定できます。`easing` は各セグメントの形を決めます。Rust は、数値、テーマカラー(外観に追従します)、`bind_rotate` 用の度単位の角度を受け取ります。 |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`、`diff_clamp_with(min, max, DiffClamp::snapping())` | 入力の変化に追従しながら、結果を `min..max` の範囲内に保ちます。コンテンツが上にスクロールする間は隠れ、下にスクロールするとすぐに戻るヘッダーなどに使えます。`snap: true` は、対応するスクロールビューが静止したときに 200 ms で近い方の境界に落ち着かせます。`max` では、入力が `max` に達した場合にのみ行います。 |
| `add`、`sub`、`mul`、`div` | `add`、`sub`、`mul`、`div` | 別のノードまたは定数との算術演算です。 |
| `mod(b)` | `modulo(b)` | 剰余です。正の `b` に対して負になりません(角度を 0〜360 に保ちます)。 |

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

`value.keyframes(frames, options)` はキーフレームを通して値を再生し、終了したかどうかを表す `{ finished }` で解決します。`Animated.keyframes(value, { keyframes, ...options })` は composite のステップと同じです。Rust: `value.keyframes(frames, KeyframeTiming)` と `Animation::keyframes(&value, frames, KeyframeTiming)`。`Keyframe::new(value)`(均等に配置)、`Keyframe::at(offset, value)`、`.ease(easing)`、そして `KeyframeTiming::new(ms)` に `.delay(ms)`、`.easing(e)`、`.iterations(Some(n))`、`.infinite()`、`.direction(PlaybackDirection::…)` を指定します。

再生は CSS keyframes と同じ規則に従います。イージングは1つのセグメントに作用します(キーフレームのイージングはそのキーフレームから始まるセグメント、timing のイージングはそれ以外のすべてのセグメント)。キーフレームで省略されたオフセットは均等に配置され、最初は 0、最後は 1 になります。各イテレーションは最初のキーフレームへのジャンプで始まり、0 にキーフレームがない場合、値は現在の位置から始まります。`delay` の間、値は最初のキーフレームを保持します(CSS の `animation-fill-mode: backwards`)。逆方向のイテレーションはセグメントを逆順に、カーブを反転して実行します。値は最後のイテレーションが終わった位置に留まります。

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

モーションを作成します。ビューの不透明度と transform の各チャネルに対するアニメーション値(静止状態は、不透明度とスケールが 1、それ以外が 0)と、それらをネイティブで再生するモーションです。`style={motion.style}` でバインドするか、`motion.style` または `motion.transform` をスタイルにスプレッドします。transform は、移動、回転、スケールの順に適用され、`scale` は `scaleX` と `scaleY` に畳み込まれます。これはビューの8つの transform ステップのうち7つを使い、1つはあなた用に残ります(3D フリップ用の `[{ perspective: 600 }, ...motion.transform]`)。`initial` はチャネルの開始位置を設定します(`{ opacity: 0 }`。それ以外は静止状態から始まります)。`enter` を指定すると、それが動かすチャネルはそのモーションの開始位置から始まり(`initial` の間)、すぐに再生されます。その他のオプションはタイミングとして使われます(`delay`、`duration`、...)。モーションが動かすのは不透明度と transform だけです。`motion.style` をスプレッドするとビューの `opacity` が設定されるため、独自の不透明度を保つには `motion.transform` だけをバインドしてください。色の変化はアニメーション値と `interpolate` で行います。Rust: `motion()`。作成したコンポーネントが保持する `Copy` ハンドルで、`.bind_motion(&m)` でバインドします。`motion().entering(spec)` は入場です。

| メンバー | Rust(`Motion`) | 説明 |
|---|---|---|
| `opacity`、`translateX`、... `scaleY` | `value(MotionChannel::Opacity)`、... | 各チャネルのアニメーション値。 |
| `style`、`transform` | 要素の `.bind_motion(&m)` | バインディング。 |
| `play(motion, options?)` | `play(spec)`、`play_ignoring_reduce_motion(spec)` | 名前でプリセットを、またはチャネル上の [`MotionSpec`](#motions) を再生します。新しいものは再生中のものを中断します。`options` はそのタイミングを変更します。`{ finished }` で解決します。終了した場合は `true`、何かに止められた場合は `false` です(Rust では `AnimationEnd`)。 |
| `animation(motion, options?)` | `animation(spec)` | 同じモーションを、開始せずに合成用の [`CompositeAnimation`](#animated) として返します。`Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })`(Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`)。モーション低減は作成時に決まります。 |
| `stop()` | `stop()` | その位置で停止します。 |
| `reset()` | `reset()` | 停止し、すべてのチャネルを静止状態に戻します。 |

ユーザーがモーションの低減を求めている場合(`reduceMotion()`)、`play`、`animation`、`enter` は、動かずに即座にモーションの終点に到達します。ただし、(オプションまたはモーションで)`ignoreReduceMotion` が設定されている場合を除きます。

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

既成のモーションをデータとして提供します。`motion.play("shake")` は `motions.shake` を再生します。`MotionName` は次のいずれかです。`fadeIn`、`fadeInUp`、`fadeInDown`、`fadeInLeft`、`fadeInRight`、`zoomIn`、`popIn`、`bounceIn`、`slideInUp`、`slideInDown`、`flipInX`、`flipInY`(入場)。`fadeOut`、`fadeOutUp`、`fadeOutDown`、`fadeOutLeft`、`fadeOutRight`、`zoomOut`、`popOut`、`slideOutDown`、`slideOutUp`(退場)。`shake`、`headShake`、`wiggle`、`swing`、`pulse`、`heartbeat`、`rubberBand`、`jello`、`tada`、`jump`、`flash`(注目)。`spin`、`float`、`breathe`、`sway`、`bob`、`glow`(ループ)。それぞれの説明は [Animation](../docs/animation.md#presets) を参照してください。プリセットをスプレッドすると変更できます: `motion.play({ ...motions.fadeInUp, duration: 600 })`。

`MotionSpec` は独自のモーションです。各チャネルのキーフレーム(`{ opacity: [0, 1], translateY: [24, 0] }`)、または Web Animations API の書式によるフレームのリスト(`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`。オフセットのないフレームはリスト内の位置によって配置されます)に、[キーフレームのタイミング](#keyframes)を組み合わせます。Rust: `MotionSpec::new(KeyframeTiming)` に `.values(channel, values)`(均等に配置)、`.track(channel, keyframes)`、`.timing(|t| …)` を指定します。`MotionPreset::FadeInUp`(または `.spec()`)はプリセットで、`MotionChannel` はチャネルに名前を付けます。

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

`Animated` は、ステップ(`timing`、`spring`、`decay`、`sequence`、`parallel`、...)を組み合わせてアニメーションを構築します。`start()` を呼ぶまで何も実行されません。呼ぶとツリー全体がネイティブで実行され、各ステップは前のステップが終わるちょうどその瞬間に UI スレッド上で開始されます(フレームの隙間も、ステップ間でのアプリのコードへの往復もありません)。Rust では `Animation` で同じツリーを構築します。

| 関数 | Rust | 説明 |
|---|---|---|
| `timing`、`spring`、`decay` | `Animation::timing(&value, to, Timing)`、`Animation::spring(&value, to, Spring)`、`Animation::decay(&value, velocity, deceleration)` | 1つの値に対する1つのアニメーション。[`AnimatedValue`](#animatedvalue) のメソッドと同じオプションとデフォルトで、対象は `toValue` として指定します。 |
| `sequence(list)` | `Animation::sequence(list)` | アニメーションを順番に実行します。 |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | 同時に実行します。`stopTogether`(デフォルトは `true`)を指定すると、1つを止めると全部が止まります。 |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`、`Animation::stagger_from(ms, StaggerFrom::Center, list)` | 並列に実行し、それぞれ前のものから `ms` ずつ遅れて開始します。起点は `from` で数えます。`"first"`(デフォルト)、`"last"`、`"center"`(中央が即座に開始し、他はそこから広がります。個数が偶数の場合は中央の2つが同時に開始します)、またはインデックス(`StaggerFrom::First`、`Last`、`Center`、`Index(i)`)。 |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [キーフレーム](#keyframes)を通した値。 |
| `delay(ms)` | `Animation::delay(ms)` | 待機します。`sequence` の中で便利です。 |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | `animation` を `iterations` 回繰り返します(デフォルトは無限)。`resetBeforeIteration` が `false` でない限り、実行のたびに値を元に戻します。 |
| `add`、`subtract`、`multiply`、`divide`、`modulo`、`diffClamp` | ノードのメソッド | [`AnimatedNode`](#animatednode) のメソッドと同じものを関数として提供します。 |
| `sampleSpring`、`sampleDecay` | `nsh_core::element::sample_spring`、`sample_decay` | スプリングまたは減衰の値をフレームごとに1つ返します([Easing](#easing) を参照)。 |

`CompositeAnimation`:

| メソッド | Rust(`Animation`) | 説明 |
|---|---|---|
| `start(callback?)` | `start()`、await する `AnimationEnd` | (再び)実行します。ツリー全体で1回だけ解決し、`callback` を呼び出します。`{ finished }` は、停止されたのではなく最後まで終了したかどうかを表します。 |
| `stop()` | `stop()` | その位置で停止します。 |
| `reset()` | `reset()` | 停止し、値を開始時の状態に戻します。 |

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

イージングはデータであり、アプリの関数ではありません。ランタイムがネイティブで評価します。Rust では列挙型 `Easing` で、`Linear`、`EaseIn`、`EaseOut`、`EaseInOut`、`Bezier(x1, y1, x2, y2)`、`Steps(count, StepPosition)`、`Curve(curve, mode)` があり、`Curve`(`Quad`、`Cubic`、`Poly(n)`、`Sin`、`Circle`、`Exp`、`Elastic(bounciness)`、`Back(s)`、`Bounce`)と `EaseMode`(`In`、`Out`、`InOut`)を持ちます。カーブを描画するには、`Easing.sample(easing, count)`(Rust: `nsh_core::element::sample_easing`)が 0 から 1 までの `count` 個の等間隔の点での値を返します。`Animated.sampleSpring` と `Animated.sampleDecay`(`sample_spring`、`sample_decay`)は、`from`(0)から終了するまでの、スプリングまたは減衰の値をフレームごとに1つ返します(`fps` で指定し、デフォルトは 60)。3つともアニメーションが実行されるネイティブコードから得られます。TSX で `Easing` を受け付ける場所ではどこでも、名前(`"easeOut"`)、4つの数値による3次ベジェ曲線、または `Easing` オブジェクトのカーブを渡せます。

| カーブ | Rust | 形状 |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ`(`n` のデフォルトは 2) |
| `sin` | `Curve::Sin` | 正弦波 |
| `circle` | `Curve::Circle` | 円形 |
| `exp` | `Curve::Exp` | 指数 |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | バネのようなオーバーシュート(`bounciness` のデフォルトは 1) |
| `back(s)` | `Curve::Back(s)` | 動き出す前に引き戻す。`s` はオーバーシュート量(デフォルトは 1.70158) |
| `bounce` | `Curve::Bounce` | 終わりでバウンドする |

`Easing.steps(count, position)` は CSS の `steps()` です。値は動く代わりに `count` 段階の間でジャンプします(コマ送りのスプライト、時を刻む針など)。`position` はジャンプの位置を指定します。`"jump-end"`(デフォルト、`"end"` も同じ)、`"jump-start"`(`"start"`)、`"jump-none"`、または `"jump-both"`。Rust では `Easing::Steps(count, StepPosition::JumpEnd)`、`JumpStart`、`JumpNone`、`JumpBoth` です。

カーブは「in」形式(始まりがゆっくり)です。`Easing.out(curve)` は反転し、`Easing.inOut(curve)` は対称にし、`Easing.in(curve)` はそのままにします。Rust では `Easing::Curve` の `EaseMode` がこれに当たります。

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

`LayoutAnimation.configureNext(config)` は、次のコミットでのレイアウト変更をネイティブでアニメーションさせます。移動またはリサイズするビューは新しいフレームへ滑らかに移り、新しいビューは(`property` に応じて、フェードインまたはスケールインで)現れ、削除されたビューは消えます。レイアウトを変える状態変更の直前に呼び出してください。Rust: `animate_layout(LayoutAnimation)`。`nsh_core::element::LayoutAnimation` のプリセット、または `create`、`update`、`delete` のトランジションを使います。

| メンバー | Rust | 説明 |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 次のコミットの変更をアニメーションさせます。`onEnd` は完了時に実行されます。 |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | 3つのフェーズすべてに同じカーブを使う設定。 |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms、ビューがフェードインとフェードアウトします。 |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms、一定の速度。 |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms。フレームはスプリング(減衰 0.4)で動き、ビューは線形にフェードします。 |
| `easeInEaseOut(onEnd?)`、`linear(onEnd?)`、`spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | `configureNext(Presets.…)` の省略形。 |
| `Types`、`Properties` | `LayoutCurve`、`LayoutProperty` | 名前を定数として提供します。 |

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

Device API は、デバイスとその環境についてアプリに伝えます。Rust コードは `nsh_core::prelude` の関数(`window()`、`dark()`、`font_scale()`、`locale()`、`lifecycle()`、`os()`、`idiom()`、`pixel_ratio()`、`set_color_scheme()`、...)を呼び出し、TSX は `nsh` からそれらをインポートします。ウィンドウサイズ、カラースキーム、フォントスケール、ピクセル比、ロケール、アプリの状態はリアクティブです。バインディング(Rust では要素に渡すクロージャ、TSX では JSX)、`computed`、または `effect` の中で読み取ると、プラットフォームが変更を通知したとき(回転、ウィンドウのリサイズ、ダークモードへの切り替え、文字サイズや言語の変更、別の密度の画面への移動、アプリを離れて戻ってきたとき)に、それを読み取っているものが更新されます。

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

ガイドは [デバイスと環境](../docs/device-and-environment.md) を参照してください。

### windowSize

```ts
const windowSize: Accessor<Size>;
```

サーフェスのサイズ(ポイント単位)です。ウィンドウ、または埋め込まれた `NshAppView` / `NshView` のサイズを指します。リアクティブです。Rust: `window() -> Size<Points>`。

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

表示されている外観です。アプリが独自に設定していない限り、システムの外観になります(`nsh.json` `"appearance"`、[`setColorScheme`](#setcolorscheme))。リアクティブです。Rust: `dark() -> bool`。テーマカラー(`AdaptiveColor`)と `.dark(…)` スタイルバリアントは、これを読み取らなくても追従します。Tailwind の `dark:` バリアントも追従します([Tailwind](../docs/tailwind.md) を参照)。

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

デフォルトに対するユーザーの希望する文字サイズです(`1` がデフォルトのサイズ。iOS では Dynamic Type、Android ではフォントサイズ)。または、その代わりに埋め込み側のアプリが設定した文字サイズです。リアクティブです。Rust: `font_scale() -> f32`。`allowFontScaling={false}` を指定しない限り、テキストはすでにこれに合わせて拡大縮小されます。テキストの横のアイコンなど、他のサイズも追従させたい場合に読み取ってください。

### locale

```ts
const locale: Accessor<string>;
```

BCP 47 タグ(`"en-US"`、`"zh-Hans-CN"`)で表されるユーザーのロケールです。または、その代わりに埋め込み側のアプリが設定したロケールです。リアクティブです。Rust: `locale() -> Locale`(`locale().as_str()` がタグです)。`Intl` はデフォルトでこれに合わせてフォーマットします。独自の翻訳の文字列を選ぶために読み取ってください([デバイスと環境](../docs/device-and-environment.md#language-and-region))。

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

アプリが使われているかどうかを、React Native の `AppState` の用語で表します。`"active"` は前面にあり入力を受け付けている状態、`"inactive"` は表示されているがフォーカスがない状態(別のアプリやウィンドウがフォーカスを持っている、またはアプリスイッチャーや着信など、システムが上に何かを表示している)、`"background"` は表示されていない状態(バックグラウンド、最小化、非表示のブラウザタブ)です。ネイティブアプリの中に表示されている場合は、そのアプリの状態に従います。リアクティブです。Rust: `lifecycle() -> Lifecycle`(`Lifecycle::Active`、`Inactive`、`Background`)。

誰にも見えない処理を一時停止し、アプリが戻ってきたら再開するには、effect の中で読み取ります。

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

システムの外観に関係なく、アプリを `scheme` で即座に表示します。`colorScheme()`、`dark:` クラス、コンポーネントのテーマ、プラットフォームのコントロール(アラート、ステータスバーのデフォルトスタイル)が追従します。`"system"` を指定すると、再びシステムに従います。`nsh.json` `"appearance"` は最初から設定します。Rust: `set_color_scheme(Appearance::Dark)`(`Appearance::Light`、`Appearance::System`)。
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

アプリが動作しているプラットフォームです。実行中は変化しません。

| メンバー | Rust | 説明 |
|---|---|---|
| `os` | `os() -> Os`(`os().name()` は TS の文字列) | オペレーティングシステム。iOS、iOS シミュレータ、Mac Catalyst は `"ios"`、ブラウザは `"web"` を返します。 |
| `version` | `os_version() -> (u16, u16)` | iOS とデスクトップでは OS のバージョン(`"17.5"`)、Android では API レベル(`"35"`)、Web では `"0.0"`。Rust ではメジャーバージョンとマイナーバージョンを返します。Android では API レベルと 0 を返します。 |
| `idiom` | `idiom() -> Idiom` | デバイスの種類。`desktop` が `true` の場合に限り `"desktop"`、それ以外では `"phone"`、`"pad"`(iPad、Android タブレット、iPad イディオムの Mac Catalyst)、`"mac"`(UIKit の Mac イディオムの Mac Catalyst。モバイルのイディオムです)、または `"tv"`(Apple TV、Android TV)。 |
| `desktop` | `is_desktop() -> bool` | デスクトップの動作が適用されます。macOS、Windows、Linux、およびマウスと広いウィンドウを備えたブラウザが該当します。`desktop={{…}}` props、`select({ desktop })`、`idiom` `"desktop"` はすべてこれに従います。Mac Catalyst は iOS バックエンドで動作するため、モバイル扱いとなり、`ios={{…}}` props が適用されます。[`nsh/desktop`](./nsh-desktop.md#isavailable)の `isAvailable` は、macOS、Windows、Linux にあるウィンドウおよびメニュー API 向けの、より限定的なチェックです。 |
| `catalyst` | `is_catalyst() -> bool` | アプリが Mac Catalyst 上で、Mac または iPad イディオムで動作しています(`os` が `"ios"`)。 |
| `select(spec)` | `match os() { … }` | このプラットフォーム向けの値です(下記参照)。 |

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

現在の OS(`ios`、`android`、`web` など)に対応する値を返します。なければ `desktop` または `mobile`(`platform.desktop` による)、次に `native`(Web 以外のすべてのプラットフォーム)、次に `default`、最後に `undefined` を返します。Rust のコードでは `os()`(`mobile` / `desktop` には `is_desktop()`)でマッチさせます。

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
> 特定の 1 つのプラットフォームにしかない props については、`platform` で分岐するよりも、TSX の要素やコンポーネントの `ios={{…}}` / `android={{…}}` props を使うことをお勧めします([Platform-specific code](../docs/platform-specific.md)を参照)。

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

1 ポイントあたりのデバイスピクセル数です(例: 多くの iPhone では `3`)。リアクティブな値で、ウィンドウが別の密度の画面に移動したとき(Mac Catalyst、デスクトップ、外部ディスプレイ)や、Android のディスプレイサイズ設定で密度が変わったときに更新されます。Rust では `pixel_ratio() -> f32`、デバイスピクセル単位の長さには `round_to_nearest_pixel(points)` を使います。TSX ではその長さは `Math.round(x * pixelRatio()) / pixelRatio()` です。

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

`url` をアプリの外で開きます。Web ページはブラウザで、`mailto:` リンクはメールアプリで、`tel:` リンクは電話アプリで、そのほか他のアプリが登録した任意のスキーム(`maps:`、ホストアプリ独自の `lb://` リンク)も開きます。何かが開いたかどうかを表す `{ opened }` で解決され、そのスキームを処理するアプリがない場合は `false` になります。Rust では `nsh_core::prelude` の `open_url(url)` を返します。これはタスク内で await する(または破棄する)ための応答で、意味は同じ `bool` です。

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

- URL は絶対 URL(スキームを持つもの)でなければなりません。コードを実行したり、アプリ自身のデータにアクセスしたりする URL(`javascript:`、`data:`、`blob:`、`file:`、`about:`、`asset:`)は、相対アドレスと同様に、`TypeError` で Promise を reject します。`openUrl` は決して throw しません。すべての失敗は reject になります。
- capabilities を宣言しているアプリには `openUrl` が必要です。すべてのスキームには `"openUrl": true`、列挙したスキームのみには `"openUrl": { "schemes": ["https", "mailto"] }` を指定します。それ以外の URL は、`code` が `"ERR_ACCESS_DENIED"`、`permission` `"openUrl"`、`resource` が URL である `Error` で reject されます([Sandbox and capabilities](../docs/sandbox-and-capabilities.md)を参照)。Rust では、`open_url` はこれらに対して `false` を返し、理由をログに出力します。
- 組み込み先のアプリが最初に URL を受け取り、代わりに独自のルーターで処理することができます(Swift の `NshAppView.onOpenURL`、Java の `NshView.setOpenUrlHandler`、Rust の `AppView::host().handle_open_url`。[iOS](../docs/ios.md#links-the-app-opens)と [Android](../docs/android.md#links-the-app-opens)を参照)。その場合、`opened` は `true` になります。
- 各プラットフォームは、それぞれ固有の方法で開きます。iOS では `UIApplication.open`(組み込み時はホストアプリのアプリケーション)、Android では `ACTION_VIEW` インテント、macOS では `NSWorkspace`、Windows では `ShellExecuteW`、Linux では `GtkUriLauncher`、GPUI では `open_url`、Web では新しいタブです。`nsh test` は URL を開く代わりに記録します。
- [`TextView`](../elements/text-view.md)は、`links="open"` を使ってこの方法でリンクを開きます。

<a id="layout-direction"></a>

### レイアウト方向

レイアウト方向はユーザーの言語に従います。右から左へ書く言語(アラビア語、ヘブライ語など)では、アプリは右から左にレイアウトされ、行は右から始まり、`left` / `right` のスタイルプロパティ(`marginLeft`、`paddingRight` など)は開始側と終了側を意味します。変更は再起動なしですぐに反映されます。

ビューの `direction` スタイル(`"ltr"`、`"rtl"`、またはデフォルトの `"inherit"`)は、そのサブツリーの方向を設定します。Rust では `.direction(LayoutDirection::..)` です。

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

### 関連項目

- セーフエリアのインセット(Rust では `safe_area()`、TSX では `safeArea()`、`safeAreaInsets()`)とソフトウェアキーボード(Rust では `keyboard_height()`、TSX では `keyboardFrame()`)については、[Safe area and keyboard](#safe-area-and-keyboard)を参照してください。
- スクリーンリーダーとモーション低減の設定については、[Accessibility](#accessibility)を参照してください。

## PanResponder

Pan responder は、ジェスチャーレスポンダーシステムの上に構築されたドラッグジェスチャーです。要素がジェスチャーのタッチを占有し、その後はそのタッチだけを、ジェスチャー状態とともに受け取ります。ジェスチャー状態には、タッチの重心、移動距離、速度が含まれ、自動的に追跡されます。Rust のコードでは `.claim_touches(TouchClaim::…)` でタッチを占有し、`.on_responder_*` リスナーで受け取ります。リスナーの `ResponderEvent` は `PanGesture` を持ち、すべて `nsh_core::prelude` にあります。TSX では `nsh` から `PanResponder` をインポートし、その `onPanResponder…` コールバックがタッチイベントとジェスチャー状態を受け取ります。

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Pan responder はすべての移動をアプリのコードに渡すため、アプリの状態を変更するジェスチャー(並べ替え、スワイプ削除の判定など)に適しています。指に合わせてビューを動かすには、ネイティブのジェスチャー値のほうが高速です。Rust では `.pan_values(x, y)`、`.pinch_value(scale)`、`.rotation_value(angle)`、TSX では `pan={{ x, y }}`、`pinch`、`rotation` props です。ドラッグは UI スレッド上で[アニメーション値](#animation)を書き換え、アプリは開始時と終了時(`on_pan_start` / `on_pan_end`、`onPanStart` / `onPanEnd`)にのみ通知を受けます。[Touch and gestures](../docs/touch-and-gestures.md)を参照してください。

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Pan responder を作成します。ジェスチャーを受け取るビューに `panHandlers` をスプレッドしてください。Rust では、ビュー自身がタッチを占有し、リッスンします。

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

### コールバック

すべてのコールバックは、タッチイベント(`GestureResponderEvent`、[`nsh`](#types)由来)とジェスチャー状態を受け取ります。Rust では、占有の可否を `.ask(|request: &ClaimRequest| …)` で判断し、タッチを取得するには `request.claim()` を呼び出します(`ask` がない場合は常に取得します)。各リスナーは、状態を `gesture` に持つ `ResponderEvent` を受け取ります。

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| コールバック | Rust | 戻り値 | 呼び出されるタイミング |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | 指が触れたとき。レスポンダーになるには `true` を返します。タッチされたビューから外側に向かって問い合わせられます。 |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | 同様ですが、バブリングのものより先に、外側から内側に向かって問い合わせられます(親が子からジェスチャーを奪う場合)。 |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | 指が動いたとき。レスポンダーになるには `true` を返します(例: `Math.abs(g.dx) > 10` になってからのみ)。 |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | 同様ですが、キャプチャフェーズです。 |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | このビューがレスポンダーになりました。ジェスチャーの開始です。 |
| `onPanResponderReject` | `.on_responder_reject(…)` | | 別のビューがレスポンダーであり、手放そうとしません。 |
| `onPanResponderStart` | `.on_responder_start(…)` | | レスポンダー中に別の指が触れました。 |
| `onPanResponderMove` | `.on_responder_move(…)` | | 指が動きました。 |
| `onPanResponderEnd` | `.on_responder_end(…)` | | レスポンダー中に指が離れました。 |
| `onPanResponderRelease` | `.on_responder_release(…)` | | 最後の指が離れました。ジェスチャーの終了です。 |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | 別のビュー(またはスクロールビューのようなネイティブジェスチャー)がタッチを取得しました。 |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` で保持 | `boolean` | 別のビューがタッチを求めています。保持するには `false` を返します(デフォルトは `true`)。 |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | レスポンダー中に、ネイティブのスクロールビューがタッチを取得するのを防ぐかどうか(デフォルトは `true`)。 |

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

Rust では `PanGesture` で、ポイントは `Point<Points>` です。

| フィールド | Rust | 説明 |
|---|---|---|
| `stateID` |  | ジェスチャーを識別します。 |
| `moveX`、`moveY` | `position` | タッチの重心の最新位置(サーフェスのポイント単位)。 |
| `x0`、`y0` | `origin` | レスポンダーが付与されたときの重心の位置。 |
| `dx`、`dy` | `delta` | 付与されてからの移動距離。 |
| `vx`、`vy` | `vx`、`vy` | 速度(ポイント/秒)。 |
| `numberActiveTouches` | `active_touches` | 触れている指の数。 |

<a id="inside-scroll-views"></a>

### スクロールビュー内

Pan responder がレスポンダーである間は、その周囲のネイティブのスクロールビューはスクロールしません(`onShouldBlockNativeResponder` のデフォルトは `true`)。横スワイプと縦スクロールを共存させるには、横方向の移動のときにのみレスポンダーになります。

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

プラットフォームが認識するパンについては、`TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` が指の動きに合わせてメインスレッドで判断します。基盤となるレスポンダー props(`onStartShouldSetResponder`、`onResponderGrant`、`onTouchStart` など)も、任意の要素で直接使用できます。[Elements](../elements/index.md)を参照してください。

## Clipboard

Clipboard API は、システムのクリップボードの読み書きを行います。テキストはすべての環境で扱え(iOS では `UIPasteboard`、Android では `ClipboardManager`、デスクトップでは `NSPasteboard`、GDK、Win32 クリップボード、Web では `navigator.clipboard`)、画像は iOS、デスクトップ、Web で、ファイルマネージャーでコピーしたファイルはデスクトップと Mac Catalyst で扱えます。Rust のコードでは `nsh_core::prelude` の関数(`set_clipboard`、`clipboard_string` など)を呼び出します。TSX では `nsh` から `Clipboard` をインポートします。

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

| TS | Rust(`nsh_core::prelude`) |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

Rust の読み取り関数は、タスク内で await する応答を返します(`spawn`、または `async` モジュールの関数)。`ClipboardImage` は `nsh_core::element::ClipboardImage` で、`url` と `size`(`Size<DevicePixels>`)を持ちます。

画像は、iOS、デスクトップ、Web ではクリップボード経由で扱えます。Android のクリップボードで扱えるのはテキストです。`writeImage` と `readImage` は、`code` が `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` である `Error` で reject し、`hasImage` は `false` で解決されます。Rust では、`set_clipboard_image` はクリップボードをそのままにし、`clipboard_image` は `None` を返します。

ユーザーは[選択可能なテキスト](../elements/text.md)から自分でコピーすることもできます。Clipboard API は、コピーボタンのように、コードからコピーする場合のためのものです。

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

`text` をクリップボードに置き、元の内容を置き換えます。Rust では `set_clipboard(text)` です。

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

クリップボードのテキストで解決され、テキストがない場合は `""` で解決されます。Rust では `clipboard_string()` です。iOS では、クリップボードの読み取り時にシステムのペースト通知(「App pasted from …」)が表示されることがあります。Android 10 以降では、フォアグラウンドのアプリだけが読み取れます。画面ごとに読み取るのではなく、ユーザーがペーストを求めたときに読み取ってください。

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

クリップボードにテキストがあるかどうかを、内容を読み取らずに返して解決されます。iOS ではペースト通知は表示されません。Rust では `clipboard_has_string()` です。ペーストボタンを表示するかどうかの判断に使います。Web では、ブラウザは読み取らないと判断できないため、ユーザーに許可を求める場合があります。

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

クリップボードの画像で解決され、画像がない場合は `null` で解決されます。貼り付けられたスクリーンショットや、ブラウザや画像エディタでコピーされた画像が対象です。Rust では `clipboard_image()` で、画像がない場合は `None` です。`url` は画像の URL(PNG、またはクリップボード自体の JPEG、GIF、WebP、BMP)で、[`Image`](../elements/image.md)がその `src` として表示し、`fetch` が読み取ります。`fetch(url)` はアップロード用にそのバイト列を返します。`size`(`width` と `height`)は、デコード後のピクセル単位のサイズです。`readText` と同様に、ユーザーがペーストを求めたときに読み取ってください。最大 48 MB(エンコード後)までの画像が読み取られ、画像はアプリのメモリに収まります。それより大きい画像は、`code` が `"ERR_NSH_QUOTA_EXCEEDED"` である `Error` で reject されます(メッセージには画像のサイズと上限が含まれます)。一方、`hasImage` は `true` で解決されます。Rust では、`clipboard_image()` がこの場合に `None` を返します。

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

ユーザーがコンポーザーにスクリーンショットを貼り付けるチャット形式のアプリでは、入力欄にフォーカスがある間ペーストのショートカットをバインドし、画像があればそれを取得します。

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

クリップボードに画像があるかどうかを、内容を読み取らずに返して解決されます。iOS ではペースト通知は表示されません。Rust では `clipboard_has_image()` です。Android では `false` で解決されます。

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

`src`(base64 の `data:` URL、または `readImage` が返した `url`)の画像をクリップボードに置き、元の内容を置き換えます。Rust では `set_clipboard_image(src)` です。Windows では PNG を受け付けます。これはブラウザ、Office、Snipping Tool が読み取る形式です。Android では `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` で reject されます。

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

ファイルマネージャー(Finder、Explorer、Files)でコピーされたファイルとフォルダの `file:` URL を、その順序のまま返して解決されます。何もなければ `[]` で解決されます。これらは[ファイルドロップ](../elements/view.md#desktop-file-drops)が返すものと同じ URL です。Rust では `clipboard_files()` です。パスを取得するには URL をパースしてください。

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
> アプリが `nsh.json` に `capabilities` を宣言している場合、クリップボードは `"clipboard": true` で許可する必要があります。許可がないと、`Clipboard` のすべての関数は、`code` が `"ERR_ACCESS_DENIED"`、`permission` `"clipboard"`、`resource` `""` である `Error` で reject され、システムのクリップボードには何も届きません。Rust では、書き込みはクリップボードをそのままにし、読み取りは空のクリップボードと同じ結果(`""`、`None`、空のリスト、`false`)を返し、拒否された旨がログに出力されます。[Sandbox and capabilities](../docs/sandbox-and-capabilities.md)を参照してください。
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

picker API は、システムの写真ピッカーを表示し、ユーザーが選んだ画像をアプリに渡します。iOS では Photos ピッカー(`PHPickerViewController`)、Android では Photo Picker、デスクトップでは open panel またはファイルダイアログ、ブラウザーではファイル入力を使います。iOS と Android ではピッカーはアプリの外で動作し、ユーザーが選んだものだけを渡すため、フォトライブラリの権限は不要です。選ばれた各画像は `File`(TSX)または `PickedFile`(Rust)として届き、そのバイト列はネイティブ側に残ります。`URL.createObjectURL(file)` で [`Image`](../elements/image.md) に表示し、`fetch` と `FormData` でアップロードします。Rust コードは `nsh_core::prelude` の `pick_images` を呼び出し、TSX は `nsh` から `Picker` をインポートします。

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
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 を指定すると最大 100 枚) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

ピッカーを表示し、ユーザーが選んだ画像を選んだ順に解決します。ユーザーがキャンセルした場合は `[]` で解決します。Rust: `pick_images(request)`。タスク(`spawn`、または `async` モジュール関数)内で await する応答です。`pickImages` は決して throw しません。範囲外のオプション(`limit: 0`、0〜1 の範囲外の `quality`)は `RangeError` で promise を reject し、アプリの capability が許可していない pick は `ERR_ACCESS_DENIED` で reject します(後述)。キャンセルはユーザーの回答であり失敗ではないため、`[]` で解決します。

画像はそのまま送信できる状態で届きます。

- **あらゆるブラウザーとサーバーが扱える形式。** JPEG、PNG、GIF、WebP はそのまま届き、別の形式(iPhone の HEIC、HEIF、TIFF)で保存された写真は JPEG として届きます。`format: "current"` は保存された形式を保持します。
- **ネイティブでの縮小。** `maxDimension` を指定すると、長辺がそれを超える画像は収まるように縮小され、向きを正した上で再エンコードされます。PNG は PNG、それ以外は `quality` の JPEG になります。スマートフォンの写真は 12〜48 メガピクセルありますが、アップロード前に 2048 ピクセルへ縮小すると数百キロバイトになります。`quality` を指定した場合も JPEG は再エンコードされます。
- **表示されるとおりの情報。** `size` は、カメラの向きを適用した、表示されるとおりの画像のピクセル単位のサイズです。NSH が再エンコードした画像にはメタデータ(位置情報)が含まれません。そのまま届く画像は元のメタデータを保持します。

Windows、Linux、および GPUI ウィンドウでは、ダイアログにリクエストが受け付ける形式(`"compatible"` では JPEG、PNG、GIF、WebP)が表示され、ファイルは保存されたまま、元のサイズで届きます。

チャットの入力欄で写真を添付し、メッセージを書いている間それを表示し、送信時にアップロードする例です。

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

複数の写真を一度に選ぶ例です。

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

### 組み込みアプリ

NSH を組み込み、独自のピッカー(たとえばアプリ独自のアルバムを持つもの)を持つアプリは、pick に自分で応答します。Rust では、エンジン(`EngineConfig::picker`、GPUI および GPUI Kit アプリでは `AppView::set_picker`)に渡した `PickerBackend`(`nsh_core::picker`)がすべての pick の `PickRequest` を受け取ってファイルを返し、システムのピッカーは表示されません。返されたファイルはプラットフォームのものと同様に補完されます。リクエストの上限に切り詰められ、サイズ、種類、拡張子がバイト列から読み取られます。

<a id="tests"></a>

### テスト

`nsh test` はヘッドレス実行で pick に応答します。`app.onPick(handler)` はユーザーが選ぶファイルを返し(`{ name, type, data }`)、ハンドラーがない場合、pick はキャンセルされます。[テスト](../docs/testing-and-trace.md)を参照してください。

> [!NOTE]
> アプリが `nsh.json` で `capabilities` を宣言している場合、ピッカーは `"picker": true` で許可する必要があります。許可がないと `pickImages` は何も表示せず、`code` が `"ERR_ACCESS_DENIED"` である `Error` で reject します。`permission` `"picker"` と `resource` `""`。Rust では、`pick_images` はファイルなしで応答し、拒否はログに記録されます。[サンドボックスと capability](../docs/sandbox-and-capabilities.md)を参照してください。

## Speech

speech API は、ユーザーが話した内容をテキストに変換します(ディクテーション)。アプリがセッションを開始すると、プラットフォームがマイクから聞き取り、文字起こしが伸びるたびに届きます。macOS と iOS ではシステムの Speech framework で認識し、システムがマイクと音声認識の許可を一度ユーザーに求めます。それ以外のプラットフォームでは、セッションはエラー `"unavailable"` で即座に終了するため、マイクボタンを表示する前に `Speech.available()` を確認してください。Rust コードは `nsh_core::prelude` の `recognize_speech` を呼び出し、TSX は `nsh` から `Speech` をインポートします。

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
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (drop すると中止されます) |

### Speech.start

セッションを開始し、すぐに返します。セッションは次の順序で通知します。マイクがオンになり認識器が聞き取りを始めたときの `start`、文字起こしが変わるたびの `result`(`text` は常にそれまでの文字起こし全体なので、アプリはそのまま表示できます)、そして 1 回だけの `end` です。その後は何も届きません。`stop()` は聞き取りを止め、認識器が聞き取った内容を確定させます。`isFinal: true` 付きの最後の結果が届き、続いて `end` が届きます。`abort()` はエラーなしでセッションを即座に終了し、通知されていない内容を破棄します。同時に実行できるセッションは 1 つで、別のセッションを開始すると実行中のものは中止されます。

`end` は最後の文字起こしを持ち、セッションが失敗した場合は Web Speech API と同じ名前の `error` を持ちます。

| `error` | 条件 |
|---|---|
| `"not-allowed"` | ユーザーまたはシステムが、マイクまたは音声認識を許可していない。 |
| `"no-speech"` | 何も話されなかった。 |
| `"audio-capture"` | マイクを使用できなかった。 |
| `"network"` | 認識器がネットワークを必要とするが、接続できなかった。 |
| `"language-not-supported"` | 認識器が `lang` に対応していない。 |
| `"unavailable"` | このプラットフォームでは音声認識ができない、または現在できない。 |
| `"failed"` | 認識器がその他の理由で失敗した。 |

`start` は、オプションの型が誤っている場合は `TypeError` を、`lang` が言語タグではない場合は `RangeError` を throw します。

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

セッションを実行できる場所(macOS と iOS、および組み込みアプリ自身が音声を認識する場所)で `true` で解決します。

### Info.plist

macOS と iOS では、アプリがマイクと音声認識を必要とする理由がシステムによって表示されます。アプリが音声を使える場合(`capabilities` が `speech` を許可しているとき、または何も宣言していないとき)、`nsh package` と `nsh run` が `NSMicrophoneUsageDescription` と `NSSpeechRecognitionUsageDescription` をアプリの Info.plist に書き込みます。

<a id="embedding-apps-1"></a>

### 組み込みアプリ

NSH を組み込み、独自の方法(独自のエンジンやサービス)で音声を認識するアプリは、セッションに自分で応答します。Rust では、エンジン(`EngineConfig::speech`)に渡した `SpeechBackend`(`nsh_core::speech`)が、各セッションの `SpeechRequest` と、任意のスレッドから報告できる `SpeechSink` を受け取り、コアがセッションの停止と中止に使う `SpeechControl` を返します。この場合、プラットフォームの認識器は使われません。

<a id="tests-1"></a>

### テスト

`nsh test` はヘッドレス実行で、偽の認識器上でセッションを実行します。セッションは即座に開始し、`app.hear(text)` は `text` をそれまでの文字起こしとして報告し、`app.endSpeech(error?)` がセッションを終了し、`app.speechRequests()` はアプリが開始したセッションを一覧します。[テスト](../docs/testing-and-trace.md)を参照してください。

> [!NOTE]
> アプリが `nsh.json` で `capabilities` を宣言している場合、音声は `"speech": true` で許可する必要があります。許可がないと `Speech.start` は、`code` が `"ERR_ACCESS_DENIED"` である `Error` を throw します。`permission` `"speech"` と `resource` `""`。Rust では、セッションは `not-allowed` で終了し、拒否はログに記録されます。[サンドボックスと capability](../docs/sandbox-and-capabilities.md)を参照してください。

## Storage

storage API は、アプリのデータをデバイス上に保持します。文字列キーに対する文字列を保存し、次回アプリを起動したときにも残っています。設定、下書き、ユーザーが最後に開いていたタブ、サーバーから送られたもののキャッシュなど、アプリのプロセスより長く残すべき状態に使います。Rust コードは `nsh_core::storage::Storage` を使い、TSX は `nsh` から `Storage` をインポートします。どちらも同じエントリを読み書きするため、Rust のエントリと TSX のエントリを持つアプリは 1 つのデータセットを参照します。

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

Rust の関数は、エントリがメモリ上にあるため同期的です。コンポーネントが実行される場所(本体、ハンドラー、タスク)から呼び出してください。

各アプリは独自の storage を持ち、キーと値の合計は最大 5 MB です。呼び出しはアプリが行った順に実行されるため、`setItem` の後の `getItem` は、書き込みを待たずに新しい値を参照します。読み取りはメモリから行われ、書き込みはバックグラウンドで少しずつディスクに反映されます。

| プラットフォーム | データの保存場所 |
|---|---|
| iOS | アプリのコンテナ内の `Library/Application Support/nsh/<app id>/storage.json` |
| Android | アプリの専用ディレクトリ内の `files/nsh/<app id>/storage.json` |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | ブラウザーの `localStorage`。アプリ id にちなんだキー名(`nsh:com.example.todo:…`)で保存されます |

破損した `storage.json` はその隣に `storage.json.corrupt` として保存され、アプリは空の storage で起動します。読み取れないファイルの場合は、アプリの変更がメモリ上に残り、ファイルが置き換えられることはありません。

app id は `nsh.json` の `id` で、アプリとともに移動します。`nsh build` と `nsh package` はバンドルの隣に書き込み、開発サーバーが送信し、署名済みパッケージはリリースキーの証明書が保証する id を持ちます。そのため、設定なしで、どこで実行してもすべてのアプリが独自のデータを保持します。id のないアプリは `default` の下にデータを保持します。組み込みアプリは別の場所を選べます([iOS への組み込み](../docs/ios.md)と [Android への組み込み](../docs/android.md)を参照)。

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

`key` の値で解決し、値がなければ `null` で解決します。Rust: `Storage::get_item(key)`、値がなければ `None`。

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

`key` を `value` に設定し、それまでの内容を置き換えます。storage が 5 MB を超える場合は、`code` が `"ERR_NSH_QUOTA_EXCEEDED"` である `Error` で reject し、その値は保存されません。Rust: `Storage::set_item(key, value)`。この場合は `Err(StorageFull)` を返します。値は文字列です。構造化データは JSON として保持し(Rust では `serde_json::to_string`、TSX では `JSON.stringify`)、読み戻します(`serde_json::from_str`、`JSON.parse`)。

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

`key` とその値を削除します。値のないキーを削除しても何も起きません。Rust: `Storage::remove_item(key)`。

### Storage.keys

```ts
keys(): Promise<string[]>;
```

すべてのキーを順序付きで返して解決します。Rust: `Storage::get_all_keys()`。

### Storage.clear

```ts
clear(): Promise<void>;
```

ユーザーがサインアウトするときなど、アプリのすべてのキーを削除します。Rust: `Storage::clear()`。

<a id="keeping-a-signal-on-the-device"></a>

### signal をデバイスに保持する

アプリの起動時に保存された値を読み取り、signal が変わるたびに書き戻します。

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

`host` は、NSH を組み込むアプリ、つまり `NshAppView` / `NshView` を囲むネイティブアプリ、またはウェブではプレーヤーを実行するページと通信します。アプリは JSON 引数を付けて名前でホストの関数を呼び出し、ホストが送るイベントをリッスンします。

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

プラットフォームに、呼び出しに応答するホストがあるかどうかを示します。ウェブでは、ページがプレーヤーにホストを渡している場合に `true` になります([ウェブでのホスト](#the-host-on-the-web))。

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

ホストの関数 `name` を `args`(任意の JSON 値。指定しない場合は `null`)付きで呼び出し、その戻り値で解決します。`host.call` は決して throw しません。すべての失敗は promise を reject し、`code` が何が起きたかを示す `Error` で reject します(メッセージは人向けで、変更されることがあります)。

| `code` | 条件 |
|---|---|
| `ERR_NSH_HOST_ERROR` | ホストの関数が失敗した、またはホストに関数 `name` がない。メッセージはホストのもの |
| `ERR_ACCESS_DENIED` | `name` がアプリの [`host` capability](#capability) にない。`permission` は `"host"`、`resource` は名前 |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | プラットフォームにホストがない。`host.available()` は `false` |
| `ETIMEDOUT` | ホストが時間内に応答しなかった |
| `ERR_NSH_QUOTA_EXCEEDED` | 組み込みアプリの応答を、すでに 1024 件の呼び出しが待っている |

有効でない名前(`A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:`、`-` のいずれか 1〜128 文字。`..` を除く)は `TypeError` で reject されます。

呼び出しはホストの応答を 30 秒待ち、その後 `ETIMEDOUT` で reject します。後から届いた応答は破棄されます。`options.timeout` は待ち時間をミリ秒で設定し、`0` は無制限を意味します。時計が到達しないほど大きなタイムアウト(約 1e22 ms)も無制限で待ち、負の値、`NaN`、または無限大の値は `RangeError` で呼び出しを reject します。時間はアプリのタイマーと同じくアプリの時計に従い、手動クロックを使う `nsh test` では時計とともに進みます。

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

プラットフォームイベントは、ホストが送る `event` ごとのペイロードで `listener` を呼び出し、`host.on` が返す関数が呼ばれるまで続きます。コンポーネントのレンダー中に追加されたリスナーは、そのコンポーネントとともに停止します。アプリの起動前にホストが送ったイベントはアプリの起動後に届くため、アプリのトップレベルで登録したリスナーが受け取ります。リスナーの登録前に送られたイベントは、そのリスナーには再送されません。アプリが起動時に持つ状態は `host.call` で読み取り、その変化は `host.on` で追跡します。

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### 権限(Capability)

アプリが呼び出すすべての関数は、`nsh.json`の`capabilities.host`に列挙されている必要があります。指定できるのは、正確な名前、`*`で終わるプレフィックス、またはすべてを表す`true`です。これは他の`capabilities`を持たないアプリも含め、すべてのアプリに当てはまります。ホストの関数がデフォルトで許可されることはありません。許可されていない呼び出しは`ERR_ACCESS_DENIED`で reject され、ログに記録されます。そのような名前に対する埋め込みアプリへの`host.post`も同じエラーをスローします。また、`capabilities.host`なしで`nsh`から`host`をインポートするアプリをビルドすると警告が出ます。イベントに許可は不要です。詳しくは[サンドボックスとケイパビリティ](../docs/sandbox-and-capabilities.md#host)を参照してください。

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### Web 上のホスト

Web ではページ自体がホストです。`createPlayer`の`host`オプションが呼び出しに応答し、`player.hostEvent(event, payload)`がイベントを送信します。

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

公開されたアプリは、`nsh.json`でホストを指定します。`web.host`はアプリのディレクトリ内にある JS モジュールで、`nsh.json`からの相対パスで指定し、`call`を持つオブジェクトを返す`createHost(player)`をエクスポートします。`nsh package --target web`はこれをサイトと一緒に配布し、`nsh run --target web`は開発用ページで実行し、`nsh test`はテストが開くアプリ向けに実行します。`web.connect`には、ホスト自身のリクエストが到達するホストを列挙します。ページの Content-Security-Policy は、アプリの`capabilities.network`に加えてこれらも許可します。詳しくは [Web](../docs/web.md#the-hosts-functions) を参照してください。

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

埋め込みアプリがあなたのアプリを起動する前に設定したパラメーターです。コードの最初の行から同期的に読み取れます。何も設定されていない場合は`{}`です。アプリの実行中は変わりません。以降のリクエストはイベントとして届きます。

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```


<a id="native-sdk-channel"></a>

### Native SDK チャネル

Native SDK の`send`は、アプリがリッスンするまでイベントを最大 256 件保持します。配信中に最後のリスナーが停止した場合、残りのイベントは順序を保ったまま待機します。シャットダウン中に送信されたイベントは、次に読み込まれるアプリまで待機します。`host.post(name, data)`はデータを Native SDK のハンドラーに配信し、ハンドラーは`isPost`で post と call を区別します。

<a id="the-embedding-apps-side"></a>

### 埋め込みアプリ側

各ビューは、読み込むすべてのアプリに対して 1 つのチャネルを保持します。パラメーターは読み込み前に設定し、イベントは任意のスレッドからいつでも送信でき、ハンドラーは名前で登録します。call と post にはアプリの`capabilities.host`の許可が必要です。ハンドラーは今すぐでも後からでも、一度だけ応答します。応答が返ってこない場合、その呼び出しは失敗します。

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

[iOS への埋め込み](../docs/ios.md#talking-to-the-app)、[Android への埋め込み](../docs/android.md#talking-to-the-app)、[GPUI](../docs/gpui.md)を参照してください。

> [!NOTE]
> Native SDK の call と post は、プラットフォームの呼び出しと同じ[`host` ケイパビリティ](../docs/sandbox-and-capabilities.md#host)を使用します。Rust アプリは、登録した関数([`nativeModule`](#nativemodule)と Rust のインポート)を通じて、埋め込みアプリの Rust に直接アクセスします。

## keymap

keymap は、アプリのキーボードショートカットを結び付けます。`"mod+k"`のようなキーストロークと、それが実行する関数を対応付けます。Rust のコードは`nsh_core::prelude`から`on_key`、`on_key_with`、`key_label`を呼び出し、TSX は`nsh`から`keymap`をインポートします。どちらも同じキーストロークを受け付け、同じルールに従います。

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
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`。`when`は`nsh_core::keymap::When`(`Auto`、`Always`、`NotEditing`) |
| `keymap.bind({ … })` | キーストロークごとに 1 つの`on_key` |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Rust のバインディングは、それを作成したコンポーネント(オーナー)が存在する間だけ有効です。ハンドラーには、記述したとおりのキーストロークが渡されます。

ショートカットは macOS、Windows、Linux、ブラウザーで動作します(ブラウザー自身のキー、たとえば Ctrl+T や Cmd+W はページには届きません)。また、ハードウェアキーボードを使う iOS と Android でも動作します。対象は iPad のキーボード、iPad アプリを実行する Mac のキーボード、タブレットや Chromebook のキーボード、シミュレーターとエミュレーターです。どこでも同じコードが動きます。キーボードがない場合、バインディングを発火させるキーはありません。

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

`keystroke`が押されたときに`handler`を実行し、バインディングを削除する関数を返します。ハンドラーには`{ keystroke }`が渡されます。これは、記述したとおりの大文字小文字を保ったキーストロークです。Rust では`on_key(keystroke, handler)`を使い、ハンドラーにはキーストローク自体が渡されます。

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

オブジェクトを渡すと、複数のキーストロークを一度にバインドできます。返される関数はそれらすべてを削除します。Rust では、各キーストロークが 1 つの`on_key`になります。

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

コンポーネントのレンダリング中に作成したバインディングは、そのコンポーネントとともに削除されます。そのため、画面のショートカットは画面が存在する間だけ有効です。

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

開発サーバーでは、モジュールを編集すると、そのモジュールのトップレベルのコードが作成したバインディングが、コードが再実行される前に削除されます。そのため、ホットリロードで古いショートカットが残ることはありません。

### keymap.label

```ts
label(keystroke: string): string;
```

`keystroke`を、アプリが動作する環境のメニューやヒントでの表示形式で返します。`"mod+shift+l"`に対して、macOS と iOS(および Mac、iPhone、iPad 上のブラウザー)では`"⇧⌘L"`、Windows、Linux、その他のブラウザーでは`"Ctrl+Shift+L"`を返します。Rust では`key_label(keystroke)`です。実際に動作するキーでアプリのショートカットを表示するのに使います。

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

無効なキーストロークに対しては、`bind`と同様に`TypeError`をスローします。`key_label`と`on_key`も同じメッセージで panic します。

<a id="keystrokes"></a>

### キーストローク

キーストロークは、修飾キーとキーを`+`でつなげたものです。`"mod+k"`、`"ctrl+shift+p"`、`"alt+enter"`、`"escape"`、`"f5"`、`"cmd+-"`(Command とマイナス)。

| 修飾キー | macOS | Windows | Linux |
|---|---|---|---|
| `mod`(`cmdorctrl`でも可) | Command (⌘) | Ctrl | Ctrl |
| `cmd`(`command`、`meta`、`super`、`win`でも可) | Command (⌘) | Windows キー | Super |
| `ctrl`(`control`でも可) | Control (⌃) | Ctrl | Ctrl |
| `alt`(`option`、`opt`でも可) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS は macOS に準じ(`mod`は Command)、Android は Windows と Linux に準じます(`mod`は Ctrl、`cmd`は Meta キー)。ブラウザーでは、キーはブラウザーが動作しているプラットフォームに従います。`mod`は、Mac、iPhone、iPad では Command、それ以外では Ctrl です。

アプリ独自のショートカットには`mod`を使ってください。各プラットフォームのアプリがショートカットに使うキーであり(macOS では ⌘K、Windows と Linux では Ctrl+K)、1 つの書き方であらゆる環境に対応できます。Windows キーと Super はほとんどがシステム用なので、macOS 以外で`cmd`が適切になることはまれです。

キーは、文字、数字、記号のキーで、US キーボードで Shift なしで入力される文字として記述します(`k`、`1`、`,`、`/`、`[`。`"shift+/"`は`?`用、`"shift+k"`は Shift+K 用)。または名前で指定します。`plus`(`=` / `+`キー、`=`とも記述可)、`minus`(`-`でも可)、`space`、`enter`(`return`)、`escape`(`esc`)、`tab`、`backspace`、`delete`(`del`)、`insert`、矢印の`up`、`down`、`left`、`right`(`arrowup`など)、`home`、`end`、`pageup`、`pagedown`、`f1`から`f24`まで。大文字小文字は区別されません。`"Mod+Shift+K"`は`"mod+shift+k"`であり、大文字は同じキーを指し、Shift の指定にはなりません(`"mod+K"`は`"mod+k"`)。小文字が推奨のスタイルで、これらのページでもそれを使っています。`"mod-k"`と`"mod++"`はエラーで、メッセージに正しい書き方が示されます。`nsh/desktop`のメニューショートカットも同じキーストロークを受け付けます。

ショートカットはどのキーボードレイアウトでも動作します。キリル文字やギリシャ文字のレイアウトでは、`mod+k`は US レイアウトで K を入力するキーです。これはメニューショートカットと同じです。

`bind`は、無効なキーストローク(`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`)に対して何が間違っているかを示す`TypeError`をスローします。また、システムが自分用に確保しているキーストロークは拒否するため、アプリがそれらを壊すことはありません。

| プラットフォーム | 予約済み |
|---|---|
| macOS、iOS | Cmd+Q(終了)、Cmd+H(隠す)、Option+Cmd+H(ほかを隠す)、Cmd+M(最小化)、Ctrl+Cmd+F(フルスクリーン) |
| Linux、Windows、Android | Ctrl+Q(終了)、Alt+F4(閉じる)、F11(フルスクリーン) |
| Web | なし(ブラウザーが自身のキーを保持します) |

<a id="while-typing"></a>

### 入力中の動作

キーボードフォーカスを持つテキスト入力には、文字入力、キャレットの移動、削除、そして全選択、切り取り、コピー、貼り付け、元に戻す、やり直しのためのキーが必要です。そのためデフォルトでは、テキスト入力(または Web ビュー)にフォーカスがある間、キーストロークが次のいずれかである場合、バインディングは発火しません。修飾キーなし、または Shift か Option のみのキー、矢印、Home、End、Page Up / Down、Return、Tab、Escape、Backspace、Delete、そして`mod+a`、`mod+c`、`mod+v`、`mod+x`、`mod+z`です。Command や Control を伴うそのほかのキーストロークとファンクションキーは、フォーカスがどこにあっても発火します。

`when`でこれを変更できます(Rust では`KeyOptions { when: When::Always, .. }`)。

| `when` | 発火するタイミング |
|---|---|
| (デフォルト) | 上記のとおり |
| `"always"` | テキスト入力でも発火し、入力がキーを受け取る前に実行される |
| `"notEditing"` | テキスト入力にフォーカスがある間は発火しない |

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

iOS と Android では、入力メソッドが変換中のキー(候補の選択、確定)は入力メソッドのものとして扱われます。GPUI バックエンドでは、キーボードフォーカスを持つネイティブコンポーネントはテキストエディターである可能性があるため、テキスト入力として扱われます。ネイティブコンポーネントが先に各キーを受け取ります。自身で処理したキーはバインディングには届かず、テキスト編集中に発火するバインディングは、ネイティブコンポーネントが通したキーを受け取ります。

<a id="which-binding-runs"></a>

### どのバインディングが実行されるか

バインディングを発火させたキーは消費されます。文字は入力されず、システムのビープ音も鳴らず、NSH 自身のキー(Escape で戻る、Tab でフォーカスを移動する、矢印でスクロールするなど)にも渡りません。複数のバインディングが同じキーストロークを持つ場合は、発火できるもののうち最も新しいものが実行されます。そのため、ダイアログは画面のバインディングの上に Escape をバインドでき、ダイアログのバインディングがなくなると画面のバインディングが復活します。バインディングはキーが押された瞬間にネイティブ側で判定され、ハンドラーはその直後に、エンジンスレッド(Rust)または JS スレッド(TSX)で実行されます。

キーを押し続けても、キーが離されるまでバインディングは 1 回だけ発火します。`repeat: true`を指定すると、オートリピートのたびに再び発火します(たとえばリストを順に移動する場合)。

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

メニューのショートカットは、同じキーストロークのバインディングに譲ります。対象は、すべてのデスクトップではアプリケーションメニュー([`nsh/desktop`](./nsh-desktop))で、macOS では組み込みメニュー(Cmd+W、Cmd+C など)も含まれます。`nsh run`で開発している間は、アプリが`mod+r`をバインドしていても、Cmd+R / Ctrl+R は常にアプリをリロードします。パッケージ化されたアプリはこれをバインドできます。

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent と nativeModule

`nativeComponent`と`nativeModule`は、ホストアプリが提供するものに、実行時に名前であなたのアプリを接続します。NSH を埋め込む iOS や Android のアプリは、独自のビュー(地図、チャート、カメラプレビューなど)を名前で登録でき、`nativeComponent`はそのうちの 1 つに対する型付きコンポーネントを提供します。NSH は本物のネイティブビューでレンダリングするため、このようなコンポーネントは他のビューと同じようにビュー階層に配置されます。NSH によってレイアウトされ、親とともにクリップとスクロールが行われ、重なりも正しく処理されます。Rust から NSH を埋め込むアプリは、関数、クラス、Rust コンポーネントも登録でき、`nativeModule`はそれらを 1 つの型付きオブジェクトとして提供します。どちらの場合も、アプリは標準の`nsh build`でビルドされ、ホストはアプリを実行するときに、提供するものを接続します。Rust のコードでは、`nsh_core::prelude`の`native(name)`で登録済みのビューを配置し、`.prop(name, value)`(JSON 値、またはその signal かクロージャ)でプロパティを設定するか、`.bind_prop(name, &value)`でアニメーション値にバインドし、`.on_native_event(…)`でイベントを受け取り、`ElementRef`を通じてコマンドを呼び出します。TSX では`nsh`をインポートします。

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

ネイティブ側の登録については[ネイティブコンポーネント](../docs/native-components.md)を、[iOS への埋め込み](../docs/ios.md) / [Android への埋め込み](../docs/android.md)も参照してください。

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

埋め込みアプリが`name`として登録したネイティブコンポーネントに対応するコンポーネントを返します(Swift では`NshAppView.register(component:)`、Java では`NshView.registerComponent`)。Rust では`native(name)`で、プロパティが JSON 値(`.prop("text", json!(…))`)であり、イベントが`NativeEvent { name, data }`として届くビューです。

- `P`は、そのコンポーネント自身のプロパティの型です。`spec.props`に列挙された各プロパティは、変更されたときに JSON としてネイティブ側へ送られます。`undefined`に設定すると削除されます。
- `E`は、イベント名とそのペイロードを対応付けます。イベント`regionChange`は、ハンドラープロパティ`onRegionChange`になります。
- このコンポーネントは、`children`を除くすべての[ビューのプロパティ](../elements/view.md)も受け付けます。`style`、`class`、レイアウト、アクセシビリティ、タッチハンドラー、`ref`です。

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### サイズ

コンポーネントはビューと同様に、スタイルで指定されたサイズでレイアウトされます。スタイルで寸法が未指定の場合は、ネイティブコンポーネントが報告するサイズが使われます(画像が本来のサイズを使うのと同様です)。

<a id="commands"></a>

#### コマンド

その`ref`は`NativeComponentRef`を受け取ります。`ref.command(name, args)`は、ネイティブコンポーネントのコマンド`name`を`args`(任意の JSON 値)とともに呼び出します。Rust では`ElementRef::command(name, args)`です。

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### 何も登録されていない場合

`name`で何も登録されていない場合(別のホストアプリ、開発ホスト、ブラウザーなど)、コンポーネントは空のビューをレンダリングし、警告が一度だけログに記録されます。それがなくてもアプリを使える状態に保つか、使用する前にホストを確認してください。

<a id="example"></a>

### 例

ここでのバッジは、`embed.badge`として登録されたホストアプリのネイティブビューです。NSH はこれをレイアウトし、`text`と`color`を送り、その`tap`イベントを受け取り、その`pulse`コマンドを呼び出します。

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

組み込み先のアプリが `specifier` として登録したセットのエクスポート(モジュール、クラス、関数、Rust コンポーネント)を、1 つのオブジェクトとして返します。型 `T` はアプリ自身が記述するため、ビルド時にホストに関する情報は必要ありません。ホストの crate と一緒にビルドされる Rust コードはこれらの関数を Rust として呼び出し、TSX からこれらに到達するための手段が `nativeModule` です。

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

- 呼び出しは、セットを import した場合と同じように動作します。通常の Rust 関数は値をすぐに返し、`async` の関数は promise を返し、渡した関数は Rust が後から呼び出せるコールバックになります。Rust はすべての引数を検証し、不正な引数があれば `TypeError` をスローします。
- 同じ `specifier` での呼び出しは、毎回同じオブジェクトを返します。
- `specifier` で何も登録されていない場合、`nativeModule` はその名前を示す `ReferenceError` をスローします。アプリがそれを処理できる場所で呼び出すか、対象となるホストでのみ呼び出してください。

ホストは、ビューを開始する前に、プラットフォーム crate の `set_ui_sets`(NSH 自身のセットと並べて)、または `EngineConfig::ui_sets` を使って、Rust からセットを登録します。

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

`on` は、ホストがすべてのアプリを自身のデータと同期させるための仕組みです。開始されたタスクはホストの変更を待ち受け、変更のたびにアプリへ通知します。そのため、ホスト自身による変更や、別の関数を通じたいずれかのアプリによる変更が、待ち受けているすべてのアプリに届きます。`Stop` が返す関数は、TSX で `Trading.on` が返す関数と同じものです。この関数は、アプリが呼び出したとき、または `on` を呼び出したもの(コンポーネント、またはホットリロード時のモジュールの実行)が終了したときに一度だけ実行され、ここではリスナーを解除してタスクを終了させます。

> [!NOTE]
> props、イベント、コマンドの引数は JSON としてネイティブ側に渡されます。登録されたコンポーネントと関数はホストアプリ自身のコードであり、NSH の[サンドボックスの制限と権限](../docs/sandbox-and-capabilities.md)は、それらの処理には適用されません。

<a id="accessibility"></a>

## アクセシビリティ

アクセシビリティ API は、ユーザーのアクセシビリティ設定(スクリーンリーダーが動作しているか、モーションの軽減を求めているか)を読み取り、スクリーンリーダーと連携します。Rust コードは `nsh_core::prelude` から `screen_reader()`、`reduce_motion()`、`announce_for_accessibility()` を呼び出し、`ElementRef` でフォーカスを移動します。TSX は `nsh` から `screenReaderEnabled()`、`reduceMotion()`、`announce()`、`setAccessibilityFocus()` を import します。設定はリアクティブです。バインディング、`computed`、`effect` の中で読み取ると、ユーザーが設定を変更したときに、それを読み取っているものが更新されます。要素のアクセシビリティ props(`accessibilityLabel`、`role` など)は[要素](../elements/index.md)に記載されており、ガイドは[アクセシビリティ](../docs/accessibility.md)です。

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

スクリーンリーダー(VoiceOver、TalkBack)が動作しているかどうかを返します。リアクティブで、ユーザーがスクリーンリーダーをオンまたはオフにすると、これを読み取っているものが更新されます。Rust では `screen_reader() -> bool` で、同様にリアクティブです。

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

ユーザーがモーションの軽減を求めているか(iOS の「動きを減らす」、Android の「アニメーションを削除」)を返します。リアクティブです。Rust では `reduce_motion() -> bool` です。Tailwind のクラスも `motion-reduce:` バリアントでこれに従います。

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

スクリーンリーダーが `message` を読み上げます(VoiceOver のアナウンス、TalkBack)。「保存しました」のように、フォーカスが移動せずに表示される結果に使用します。Rust では `announce_for_accessibility(message)` です。

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

スクリーンリーダーのフォーカスを `node`(要素の `ref`)に移動します。Rust では `ElementRef::set_accessibility_focus()` です。

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

## 型

`nsh` は、リアクティブ API とホスト要素の型も export します。主なものは次のとおりです。

| 型 | 内容 |
|---|---|
| `Accessor<T>` | 読み取り可能な値: `() => T` |
| `Signal<T>` | `set` と `update` を持つ `Accessor<T>` |
| `SignalOptions<T>` | `signal` と `computed` のオプション(`equals`) |
| `Context<T>` | `context` が返すもの |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | JSX 名前空間(`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | `ref` が受け取るもの。各要素固有の型(`ViewRef` とその上位の型)で、フォーカス、スクロールなどのコマンドを提供します。`ViewRef` は要素そのものを表す型でもあります(`JSX.Element`)。[ref メソッド](../elements/index.md#ref-methods)を参照してください |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | ホスト要素の props |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | スタイルオブジェクト。[スタイルリファレンス](./style-reference.md)を参照してください |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | スタイル内の値 |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | イベントのペイロード |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | ペイロードや props を構成する形状で、GPUI のフィールドを持ちます(`nsh_core::geometry`) |
| `PixelSize` | 画像や動画自体のピクセル単位のサイズ(`onLoad`、`Image.getSize`、クリップボードやピッカーの画像)。`Size` はポイント単位です |
| `ImageAsset` | 画像ファイルを import したときに得られるもの(`{ url, size: Size, scales? }`。`scales` は[ピクセル密度のバリアント](../docs/images-and-assets.md#pixel-densities)を列挙します) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | アクセシビリティ props |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` は、1 つのスタイル、または左から右へマージされるスタイルのリストを受け取り、falsy なエントリは無視します。

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
