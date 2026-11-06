---
title: "nsh"
description: "코어 모듈: 시그널(signals), 이펙트(effects), 컨텍스트(context), 마운트(mount), 디자인 토큰(design tokens), 애니메이션, 환경(environment), 제스처(gestures), 클립보드(clipboard), 스토리지(storage), 호스트 채널(host channel), 키보드 단축키, 접근성, 그리고 엘리먼트 및 스타일 타입을 다루는 모듈입니다."
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` 모듈은 핵심 모듈로, 반응형 API(signal, computed 값, effect, context), `mount`, `token`, 호스트 요소 `View`, `Text`, `Scroll`, `Overlay`, [선택 가능한 뷰](#selectable-views), [safe area와 키보드](#safe-area-and-keyboard), [애니메이션](#animation), [디바이스와 환경](#device), [`PanResponder`](#panresponder), [클립보드](#clipboard), [사진 선택기](#picker), [음성 인식](#speech), [스토리지](#storage), [호스트 채널](#host), [키보드 단축키](#keymap), [네이티브 컴포넌트와 모듈](#nativecomponent-and-nativemodule), [접근성](#accessibility), 그리고 요소, 스타일, 이벤트의 TypeScript 타입을 제공합니다. 반응형 그래프 자체는 Rust에서 네이티브로 실행됩니다. signal을 읽는 것은 수 나노초가 드는 런타임 호출이며, JavaScript 인터프리터에서 실행되는 것은 여러분이 작성한 클로저뿐입니다.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

NSH의 반응성은 SolidJS와 같은 모델을 따릅니다. 컴포넌트 함수는 **한 번만** 실행되고, signal을 읽는 UI 부분은 해당 signal이 바뀔 때 그 자리에서 갱신됩니다. 컴포넌트의 리렌더링도, 가상 DOM도 없습니다. 가이드는 [반응성](../docs/reactivity.md)을 참고하세요.

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

signal은 값을 保持합니다. 호출하면 값을 읽으며, 추적 스코프(JSX 표현식, `computed`, `effect`) 안에서는 해당 스코프가 그 signal을 구독하게 됩니다. `set`와 `update`는 값을 쓰며, 그 값을 읽은 모든 것이 갱신됩니다.

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

기본적으로 현재 값과 `===` 값을 쓰면 아무 일도 일어나지 않습니다. 쓸 때마다 알리려면(객체를 그 자리에서 변경한 뒤 같은 객체를 다시 설정할 때 유용합니다) `equals: false`를 전달하거나, 직접 만든 비교 함수를 전달하세요.

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

signal에서 파생된 값입니다. `fn`은 읽은 signal이 바뀌면 다시 실행되며, computed 값을 읽는 쪽은 그 결과가 바뀔 때만 갱신됩니다(기본적으로 `equals`, `===`로 비교). `fn`은 이전 결과를 받습니다.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

파생 계산이 비용이 크거나 여러 곳에서 읽힌다면 `computed`를 사용하세요. 비용이 작은 표현식이라면 일반 함수(`const full = () => first() + " " + last()`)도 똑같이 반응형입니다.

## effect

```ts
function effect(fn: () => void): void;
```

렌더링 후 `fn`를 실행하고, 읽은 signal이 바뀔 때마다 다시 실행합니다. 로깅, 타이머, 네이티브 모듈과의 통신 같은 부수 효과에 effect를 사용하세요. effect는 자신이 생성된 컴포넌트(또는 effect)에 속하며, 그와 함께 해제됩니다.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

effect가 다시 실행되기 전(또는 컴포넌트가 사라질 때) 무언가를 되돌리려면, effect 안에서 [`cleanup`](#cleanup)를 호출하세요.

## batch

```ts
function batch<T>(fn: () => T): T;
```

`fn`를 실행하고 모든 쓰기를 끝에서 한꺼번에 적용하므로, 읽는 쪽은 쓰기마다 한 번씩이 아니라 한 번만 갱신됩니다. `fn`가 반환하는 값을 반환합니다.

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

현재 스코프가 읽은 값을 구독하지 않은 채 `fn`를 실행합니다. effect나 JSX 표현식 안에서 signal에 의존하지 않고 읽으려는 경우에 사용하세요.

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

현재 effect가 다시 실행되기 전, 또는 현재 컴포넌트나 effect가 사라질 때 실행할 `fn`를 등록합니다.

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

컴포넌트가 자신이 렌더링하는 모든 것에, 아무리 깊더라도 제공하는 값입니다. context를 호출하면(`Theme()`) 가장 가까운 provider의 값을 읽고, provider가 없으면 `defaultValue`를 읽습니다.

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

`app`를 surface(창, 또는 앱이 포함된 `NshAppView` / `NshView`)에 렌더링하고, 이를 제거하는 함수를 반환합니다. 모든 앱의 진입 파일은 `mount(App)`로 끝납니다.

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

props 객체를 `keys`에 지정된 props와 나머지로 나눕니다. 두 부분 모두 반응형을 유지합니다. 값이 바뀌는 props는 getter이고, `split`는 이를 getter로 유지합니다. 일부 props는 직접 처리하고 나머지는 전달하는 컴포넌트에서 사용하세요. props를 구조 분해하면(`const { label } = props`) 한 번만 읽히고 이후 갱신을 놓치게 됩니다.

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

자식을 렌더링하다가, 그 아래의 무언가(컴포넌트 본문, 바인딩, effect, 이벤트 핸들러)가 예외를 던지면 `fallback`을 렌더링합니다. 실패한 부분은 제거되고 그 자리에 fallback이 표시됩니다. 함수인 `fallback`는 던져진 값과, 자식을 다시 렌더링하는 `reset`와 함께 `fallback(error, reset)` 형태로 호출되며, 선언한 매개변수가 무엇이든 동일합니다. `fallback` 요소는 그대로 표시됩니다. 실패는 그 위의 가장 가까운 boundary로 전달되고, fallback 안에서의 실패는 그 위의 boundary로 전달됩니다. Rust 컴포넌트는 `catch_error`를 사용합니다([오류 경계](../docs/reactivity.md#error-boundaries)).

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

앱 테마의 디자인 토큰 `name`을(를) 현재 표시 중인 외관(appearance)에 맞춰 반환합니다(`"theme"`는 `nsh.json` 안에 있으며, shadcn/ui의 토큰 위에 구성됩니다).
색상은 `#rrggbbaa`, 길이는 포인트 단위 숫자, 글꼴은 패밀리 이름으로 반환됩니다. 이름은 테마의 CSS 변수에서
`--`를 뗀 것입니다(`primary`, `muted-foreground`, `radius`, `font-mono`, 그리고 `up` 같은 앱 고유의 토큰). 토큰을 읽는 것은
반응형입니다. 토큰을 읽는 컴포넌트, memo, effect는 테마나 외관이 바뀔 때 다시 실행됩니다.
`Tokens`는 앱의 토큰을 타입과 함께 나열하며, NSH가 테마로부터 `.nsh/types/nsh/tokens.d.ts`에 작성합니다. 클래스에서는
토큰을 직접 지정하세요(`bg-primary`, `rounded-(--radius)`). [테마 토큰](../docs/tailwind.md#theme-tokens)을 참고하세요.

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

`nsh`가 내보내는 호스트 요소를 태그로 작성한 것입니다: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>`(자식을 창 최상단에, 앵커를 기준으로 배치합니다: [Overlay](../elements/overlay.md)). 컴파일러는 import를 통해 이들 중 하나를 가리키는 태그(별칭 포함)에 대해 네이티브 뷰를 그 자리에서 생성하므로, 이들을 import하는 데 런타임 비용은
들지 않습니다. 이들은 다른 컴포넌트와 같은 컴포넌트이므로 값으로 전달할 수도 있습니다(`const Tag = inline ? Text : View`).
`nsh`는 나머지 프리미티브도 같은 방식으로 내보냅니다: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md)이며, 각각 고유한 레퍼런스
페이지가 있습니다. 이들의 props는 [요소](../elements/index.md)에 문서화되어 있습니다. 텍스트 입력인 `Input`는
[`nsh/base`](./nsh-base.md#input)에서 가져옵니다.

<a id="safe-area-and-keyboard"></a>

## Safe area와 키보드

CSS의 환경 변수는 모든 뷰의 padding과 margin에서 콘텐츠가 시스템 UI를 침범하지 않게 해 줍니다
(`padding`, `paddingTop`, ..., 동일한 `margin` 키, Tailwind의 `p*` / `m*` 임의 값, Rust의 `Styled` 메서드
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ...). 이 값들은 `EnvValue`입니다:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)`, `calc(<length> + env(name))`.

| 변수 | 값 |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | 노드가 렌더링되는 루트 뷰의 인셋입니다. 가장 가까운 페이지의 인셋(헤더 아래), 가장 가까운 다이얼로그의 인셋, 그렇지 않으면 surface의 safe area입니다. [Safe area](../elements/safe-area.md)를 참고하세요. |
| `keyboard-inset-height` | surface 위에서의 소프트웨어 키보드 높이이며, 숨겨져 있을 때는 0입니다. 변경은 키보드와 함께 네이티브로 애니메이션됩니다. [키보드](../elements/keyboard.md)를 참고하세요. |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea와 safeAreaInsets

`safeArea()`는 surface의 safe area(Rust에서는 `safe_area()`)이고, `safeAreaInsets()`는 컴포넌트가
렌더링되는 위치의 인셋(Rust에서는 `cx.insets()`)으로, `safe-area-inset-*` 변수의 값입니다. 둘 다 반응형 `Edges`
입니다(`{ top, right, bottom, left }`는 포인트 단위). 자세한 내용은
[safeArea와 safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets)를 참고하세요.

<a id="keyboard-and-keyboardframe"></a>

### Keyboard와 keyboardFrame

`Keyboard.dismiss()`는 소프트웨어 키보드를 숨기며(Rust에서는 `dismiss_keyboard()`), `keyboardFrame()`는 키보드가 화면을
얼마나 가리는지 알려 줍니다(Rust에서는 `keyboard_height()`와 `keyboard_duration()`). 자세한 내용은
[키보드 숨기기](../elements/keyboard.md#hiding-the-keyboard)와
[키보드의 높이](../elements/keyboard.md#the-keyboards-height)를 참고하세요.

<a id="selectable-views"></a>

## 선택 가능한 뷰

`<View selectable>`(Rust에서는 `view().selectable(true)`)는 그 안의 텍스트가 웹 페이지의 텍스트처럼 함께 선택되도록 만듭니다.
하나의 선택이 뷰, `Text` 요소, `TextView`를 가로질러 읽는 순서대로 이어집니다. 자세한 내용은
[텍스트 선택](../elements/text-selection.md)을 참고하세요.

<a id="animation"></a>

## 애니메이션

애니메이션 API는 UI 스레드에서 애니메이션을 실행합니다. **애니메이션 값**을 만들고, 이를(또는 이로부터 파생된 값을) 스타일 속성에 바인딩한 뒤 애니메이션을 시작하면, 그 이후의 모든 프레임은 앱 코드를 실행하지 않고 네이티브로 계산됩니다. 엔진이나 JS 스레드가 바빠도 애니메이션이 끊기지 않으며, 애니메이션은 프레임마다 앱에 어떤 작업 비용도 발생시키지 않습니다. Rust 코드는 `nsh_core::prelude`의 `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset`, `Easing`를 사용하고 요소의 `.bind_*` 메서드로 값을 바인딩하며, TSX는 이들을 `nsh`에서 import합니다.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

가이드는 [애니메이션](../docs/animation.md)을 참고하세요.

<a id="what-an-animated-value-can-drive"></a>

### 애니메이션 값이 구동할 수 있는 것

| 대상 | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | 동일합니다: 색상의 노드입니다. `borderColor`는 모든 변의 색을 지정하고, `Text`의 `color`는 텍스트 전체의 색을 지정합니다 |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (도 단위) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` 단계: `transform: [{ translateX: value }]` |
| 스크롤 위치 | 스크롤 뷰 또는 리스트의 `.scroll_value(&value)` | `<Scroll scrollValue={value}>`와 `<List scrollValue={value}>`가 프레임마다 스크롤 오프셋을 그 안에 씁니다 |
| 제스처 | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | 모든 요소의 `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}`: 제스처가 값을 직접 씁니다([터치와 제스처](../docs/touch-and-gestures.md) 참고) |
| 뷰가 고정되는 위치 | `.sticky().bind_sticky_top(&value)`(가로 스크롤 뷰에서는 `.bind_sticky_left`), 리스트의 `.bind_sticky_header_offset(&value)` | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: sticky 뷰와 헤더가 뷰포트 시작점으로부터 그만큼 떨어진 곳에 고정되며, 프레임마다 값을 따라갑니다 |
| Canvas | painter 호출의 애니메이션 인자 | [canvas](./nsh-canvas.md) 그리기 호출의 모든 숫자 또는 색상 인자 |
| Shader | `.uniform(name, &value)` | [shader](../elements/shader.md)의 `struct Uniforms` 멤버: `uniforms={{ name: value }}`(숫자, 또는 `vec3f` / `vec4f`의 경우 색상의 노드) |

다른 스타일 속성은 일반 값을 받습니다. 레이아웃 자체(크기, 흐름 안에서의 위치)를 애니메이션하려면 [`LayoutAnimation`](#layoutanimation)를 사용하세요.

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

`value`(기본값 `0`)에서 시작하는 애니메이션 값을 만듭니다. Rust: `animated_value(value)`, 이를 만든 컴포넌트가 보관하는 `Copy` 핸들입니다.

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
> 애니메이션 값은 UI 스레드에 존재하며 프레임마다 그곳에서 바뀌므로, 앱은 이를 비동기로 읽습니다. `await value.getValue()`(또는 `stop()`가 resolve하는 `{ value }`)는 그 시점의 값을 제공하며, Rust에서는 태스크 안에서 `value.value().await`를 사용합니다. 코드가 값을 즉시 필요로 한다면 위와 같이 목표 값을 변수나 signal에 보관하세요. 제스처 이벤트는 종료 시점의 값을 보고합니다(`PanEvent.value`).

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

| 메서드 | Rust | 설명 |
|---|---|---|
| `set(value)` | `set(value)` | 실행 중인 애니메이션을 중단하고 `value`로 즉시 이동합니다. |
| `stop()` | `stop()`, 이후 `value().await` | 실행 중인 애니메이션을 현재 위치에서 멈추고, 그 시점의 값인 `{ value }`로 resolve합니다. |
| `getValue()` | `value().await` | UI 스레드에서 읽은 현재 값(오프셋 포함)으로 resolve합니다. |
| `setOffset(offset)` | `set_offset(offset)` | 값에 더해지는 오프셋입니다. 바인딩은 값 + 오프셋을 보며, `set`, 애니메이션, 드래그는 값을 움직입니다. |
| `flattenOffset()` | `flatten_offset()` | 오프셋을 값에 더하고 오프셋을 0으로 만듭니다. |
| `extractOffset()` | `extract_offset()` | 값을 오프셋으로 옮기고 값을 0으로 만듭니다(이후 드래그는 지난 드래그가 끝난 지점에서 시작합니다). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | 이징 곡선을 따라 `to`로 애니메이션합니다. `duration`은 ms 단위(기본값 300), `easing`(기본값 `"easeInOut"`), `delay`은 ms 단위(기본값 0)입니다. |
| `spring(to, options)` | `spring(to, Spring { … })` | `to`로 spring 애니메이션합니다. `stiffness`(기본값 170), `damping`(기본값 26), `mass`(기본값 1), `velocity`(초기 속도, 초당 단위)입니다. |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | `velocity`(초당 단위)에서 시작해 관성으로 움직이며 밀리초당 `deceleration`만큼 느려집니다(기본값 0.998). fling 이후에 `onPanEnd`의 속도와 함께 사용하세요. `clamp: [min, max]`를 지정하면 경계에서 멈추거나, 속도의 `bounce`(0..1, 기본값 0)을 유지한 채 경계에서 튕겨 돌아옵니다. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | CSS 키프레임이 재생되듯 [키프레임](#keyframes)을 재생합니다. 구간마다 이징이 있으며, `iterations`은 `direction`의 횟수입니다. |

각 애니메이션 메서드는 `{ finished }`로 resolve하는 promise를 반환합니다. 애니메이션이 끝났으면 `true`, 중단되었으면(`stop`, `set`, 또는 같은 값의 다른 애니메이션에 의해) `false`입니다. Rust에서는 `AnimationEnd`를 반환하며, 태스크가 이를 await하면 같은 `bool`를 얻습니다.

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

네이티브 애니메이션 그래프의 노드로, `AnimatedValue`이거나 다른 값들에서 파생된 값입니다. 파생 노드는 입력이 바뀔 때마다 UI 스레드에서 평가됩니다.

| 메서드 | Rust | 설명 |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | 입력을 구간별 범위로 매핑합니다. `outputRange`에는 숫자, 색상(`"#ff0000"`, `"rgba(…)"`), 또는 각도(`"45deg"`, `"1rad"`)를 넣을 수 있습니다. `inputRange` 밖에서는 기본적으로 값이 고정(clamp)되며, `extrapolate`(또는 `extrapolateLeft` / `extrapolateRight`)은 `"extend"`(선을 계속 연장), `"clamp"`, `"identity"`(입력을 그대로 통과)일 수 있습니다. `easing`는 각 구간의 곡선을 정합니다. Rust는 숫자, 테마 색상(외관을 따라감), 그리고 `bind_rotate`에 대해 도 단위의 각도를 받습니다. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | 입력의 변화를 따라가되 결과를 `min..max` 범위 안에 유지합니다. 콘텐츠가 위로 스크롤될 때 숨겨지고 아래로 스크롤되면 곧바로 돌아오는 헤더에 쓰입니다. `snap: true`는 스크롤 뷰가 멈출 때 200ms 안에 더 가까운 경계로 값을 안착시키며, `max`는 입력이 `max`에 도달한 뒤에만 안착시킵니다. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | 다른 노드 또는 상수와의 산술 연산입니다. |
| `mod(b)` | `modulo(b)` | 나머지 연산이며, 양수인 `b`에 대해 결코 음수가 되지 않습니다(각도를 0..360 안에 유지). |

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

`value.keyframes(frames, options)`는 값을 키프레임에 따라 재생하며, 완료 여부를 나타내는 `{ finished }`로 resolve됩니다. `Animated.keyframes(value, { keyframes, ...options })`는 composite의 한 단계와 같습니다. Rust: `value.keyframes(frames, KeyframeTiming)`와 `Animation::keyframes(&value, frames, KeyframeTiming)`, 그리고 `Keyframe::new(value)`(균등 분배), `Keyframe::at(offset, value)`, `.ease(easing)`, 또 `KeyframeTiming::new(ms)`과 `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()`, `.direction(PlaybackDirection::…)`.

CSS 키프레임과 같은 방식으로 재생됩니다. 이징은 한 구간의 모양을 정합니다(키프레임의 이징은 그 키프레임에서 시작하는 구간에, 타이밍의 이징은 나머지 모든 구간에 적용됩니다). 키프레임에서 빠진 offset은 균등하게 분배되며, 첫 번째는 0, 마지막은 1입니다. 각 반복은 첫 키프레임으로 점프하면서 시작하고, 0에 키프레임이 없으면 값은 현재 위치에서 출발합니다. `delay` 동안 값은 첫 키프레임을 유지합니다(CSS `animation-fill-mode: backwards`). 역방향 반복은 구간을 거꾸로 실행하며 곡선도 반전됩니다. 값은 마지막 반복이 끝난 위치에 머뭅니다.

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

모션을 만듭니다. 모션은 뷰의 opacity와 transform 각 채널에 대한 애니메이션 값을 휴지 상태(opacity와 scale은 1, 나머지는 0)로 만들어 주며, 그 위에서 네이티브로 재생할 모션을 제공합니다. `style={motion.style}`로 바인딩하거나, `motion.style` 또는 `motion.transform`를 style에 펼쳐서 사용하세요. transform은 이동, 회전, 크기 조절 순으로 적용되며, `scale`는 `scaleX`와 `scaleY`에 합쳐집니다. 이렇게 하면 뷰의 transform 단계 8개 중 7개를 사용하고 하나가 남아 직접 쓸 수 있습니다(3D 플립에는 `[{ perspective: 600 }, ...motion.transform]`). `initial`는 채널의 시작 위치를 정합니다(`{ opacity: 0 }`. 나머지는 휴지 상태에서 시작). `enter`를 지정하면, 그 모션이 움직이는 채널은 해당 모션이 시작하는 위치에서(`initial` 동안) 시작하고 즉시 재생되며, 나머지 옵션은 그 타이밍으로 쓰입니다(`delay`, `duration`, ...). 모션은 opacity와 transform만 움직입니다. `motion.style`를 펼치면 뷰의 `opacity`가 설정되므로, 직접 지정한 opacity를 유지하려면 `motion.transform`만 바인딩하고, 색상은 애니메이션 값과 `interpolate`로 움직이세요. Rust: `motion()`는 모션을 만든 컴포넌트가 보관하는 `Copy` 핸들이며, `.bind_motion(&m)`로 바인딩합니다. `motion().entering(spec)`는 진입 시 사용합니다.

| 멤버 | Rust (`Motion`) | 설명 |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | 각 채널의 애니메이션 값. |
| `style`, `transform` | element의 `.bind_motion(&m)` | 바인딩. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | 이름으로 프리셋을 재생하거나 채널에 [`MotionSpec`](#motions)을 재생합니다. 새로 재생하면 재생 중이던 것을 중단합니다. `options`는 타이밍을 변경합니다. `{ finished }`로 resolve됩니다. 끝까지 완료되면 `true`, 다른 요인으로 중단되면 `false`입니다(Rust에서는 `AnimationEnd`). |
| `animation(motion, options?)` | `animation(spec)` | 같은 모션을 시작하지 않은 [`CompositeAnimation`](#animated)로 반환하여 조합할 수 있게 합니다: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). 모션 줄이기 여부는 만들 때 결정됩니다. |
| `stop()` | `stop()` | 현재 위치에서 멈춥니다. |
| `reset()` | `reset()` | 멈추고 모든 채널을 휴지 상태로 되돌립니다. |

사용자가 모션 줄이기를 요청하면(`reduceMotion()`), `play`, `animation`, `enter`는 움직이지 않고 모션이 끝나는 위치로 즉시 이동합니다. 단, `ignoreReduceMotion`가 설정되어 있으면(옵션 또는 모션에) 그렇지 않습니다.

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

미리 만들어진 모션을 데이터로 제공합니다. `motion.play("shake")`는 `motions.shake`를 재생합니다. `MotionName`는 다음 중 하나입니다. `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY`(진입), `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp`(퇴장), `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash`(주목), `spin`, `float`, `breathe`, `sway`, `bob`, `glow`(반복). 각 모션에 대한 설명은 [Animation](../docs/animation.md#presets)을 참고하세요. 프리셋을 펼쳐서 변경할 수 있습니다: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

`MotionSpec`는 직접 만드는 모션입니다. 각 채널의 키프레임(`{ opacity: [0, 1], translateY: [24, 0] }`) 또는 Web Animations API 방식의 프레임 목록(`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, offset이 없는 프레임은 목록에서의 위치로 배치됨)에 [키프레임 타이밍](#keyframes)을 더해 구성합니다. Rust: `MotionSpec::new(KeyframeTiming)`에 `.values(channel, values)`(균등 분배), `.track(channel, keyframes)`, `.timing(|t| …)`을 사용합니다. `MotionPreset::FadeInUp`(또는 `.spec()`)는 프리셋이며, `MotionChannel`는 채널의 이름을 지정합니다.

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

`Animated`는 단계(`timing`, `spring`, `decay`, `sequence`, `parallel`, ...)로 애니메이션을 구성합니다. `start()`를 호출하기 전에는 아무것도 실행되지 않으며, 호출하면 전체 트리가 네이티브로 실행되고 각 단계는 이전 단계가 끝나는 정확한 순간에 UI 스레드에서 시작됩니다(프레임 간격이 없고, 단계 사이에 앱 코드로의 왕복도 없습니다). Rust에서는 `Animation`로 같은 트리를 구성합니다.

| 함수 | Rust | 설명 |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | 값 하나에 대한 애니메이션 하나입니다. [`AnimatedValue`](#animatedvalue) 메서드와 옵션 및 기본값이 같으며, 대상은 `toValue`로 지정합니다. |
| `sequence(list)` | `Animation::sequence(list)` | 애니메이션을 차례로 실행합니다. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | 동시에 실행합니다. `stopTogether`(기본값 `true`)를 사용하면 하나를 멈출 때 모두 멈춥니다. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | 병렬로 실행하되, 각각 이전 항목보다 `ms`만큼 늦게 시작합니다. 기준은 `from`입니다: `"first"`(기본값), `"last"`, `"center"`(가운데 항목이 즉시 시작하고 나머지는 그 항목에서 퍼져 나가며, 항목 수가 짝수이면 가운데 두 항목이 모두 즉시 시작) 또는 인덱스(`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [키프레임](#keyframes)을 거치는 값입니다. |
| `delay(ms)` | `Animation::delay(ms)` | 대기합니다. `sequence` 안에서 유용합니다. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | `animation`을 `iterations`회 반복하며(기본값은 무한 반복), `resetBeforeIteration`가 `false`이 아니면 매 실행 전에 값을 원래대로 되돌립니다. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | 노드 메서드 | [`AnimatedNode`](#animatednode) 메서드와 같으며, 함수 형태입니다. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | 스프링 또는 decay의 값을 프레임당 하나씩 제공합니다([Easing](#easing) 참고). |

`CompositeAnimation`:

| 메서드 | Rust (`Animation`) | 설명 |
|---|---|---|
| `start(callback?)` | `start()`, await할 `AnimationEnd` | (다시) 실행합니다. 전체 트리에 대해 한 번 resolve되고 `callback`를 `{ finished }`와 함께 호출합니다. 이 값은 중단되지 않고 끝까지 완료되었는지 여부입니다. |
| `stop()` | `stop()` | 현재 위치에서 멈춥니다. |
| `reset()` | `reset()` | 멈추고 값을 시작할 때의 위치로 되돌립니다. |

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

이징은 앱의 함수가 아니라 데이터이며, 런타임이 네이티브로 계산합니다. Rust에서는 enum `Easing`입니다. `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)`, `Curve(curve, mode)`이 있으며, `Curve`(`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`)와 `EaseMode`(`In`, `Out`, `InOut`)도 있습니다. 이징을 그리려면 `Easing.sample(easing, count)`(Rust: `nsh_core::element::sample_easing`)가 0부터 1까지 균등한 간격의 `count`개 지점에서의 값을 제공합니다. `Animated.sampleSpring`와 `Animated.sampleDecay`(`sample_spring`, `sample_decay`)는 `from`(0)부터 끝날 때까지 스프링 또는 decay의 값을 프레임당 하나씩(`fps` 기준, 기본값 60) 제공합니다. 세 가지 모두 애니메이션이 실행되는 네이티브 코드에서 가져옵니다. TSX에서 `Easing`를 받는 곳이라면 어디서든 이름(`"easeOut"`), 숫자 네 개로 지정한 cubic Bézier, 또는 `Easing` 객체의 곡선을 전달할 수 있습니다.

| 곡선 | Rust | 모양 |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ`(`n`의 기본값은 2) |
| `sin` | `Curve::Sin` | 사인 곡선 |
| `circle` | `Curve::Circle` | 원형 |
| `exp` | `Curve::Exp` | 지수 |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | 스프링처럼 튀는 오버슈트(`bounciness`의 기본값은 1) |
| `back(s)` | `Curve::Back(s)` | 출발하기 전에 뒤로 당겼다가 나아갑니다. `s`는 오버슈트 크기입니다(기본값 1.70158). |
| `bounce` | `Curve::Bounce` | 끝에서 튕깁니다. |

`Easing.steps(count, position)`는 CSS `steps()`입니다. 값이 연속적으로 움직이는 대신 `count`개의 단계 사이를 점프합니다(프레임 단위 스프라이트, 똑딱거리는 시곗바늘 등). `position`는 점프가 일어나는 위치를 정합니다. `"jump-end"`(기본값, `"end"`도 가능), `"jump-start"`(`"start"`), `"jump-none"` 또는 `"jump-both"`. Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

곡선은 기본적으로 "in" 형태(시작이 느림)입니다. `Easing.out(curve)`는 곡선을 반전하고, `Easing.inOut(curve)`는 대칭으로 만들며, `Easing.in(curve)`는 그대로 유지합니다. Rust에서는 `Easing::Curve`의 `EaseMode`가 이에 해당합니다.

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

`LayoutAnimation.configureNext(config)`는 다음 커밋의 레이아웃 변경을 네이티브로 애니메이션합니다. 이동하거나 크기가 바뀌는 뷰는 새 프레임으로 부드럽게 이동하고, 새 뷰는 `property`에 따라 페이드 인 또는 스케일 인으로 나타나며, 제거된 뷰는 사라집니다. 레이아웃을 바꾸는 상태 변경 직전에 호출하세요. Rust: `animate_layout(LayoutAnimation)`이며, `nsh_core::element::LayoutAnimation`의 프리셋 또는 `create`, `update`, `delete` 전환을 사용합니다.

| 멤버 | Rust | 설명 |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 다음 커밋의 변경을 애니메이션합니다. `onEnd`는 완료되면 실행됩니다. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | 세 단계 모두에 같은 곡선을 사용하는 config입니다. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, 뷰가 페이드 인/아웃됩니다. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms, 일정한 속도입니다. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms. 프레임은 스프링(damping 0.4)으로 움직이고, 뷰는 선형으로 페이드됩니다. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | `configureNext(Presets.…)`의 축약형입니다. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | 이름을 상수로 제공합니다. |

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

Device API는 앱에 기기와 그 환경에 대한 정보를 제공합니다. Rust 코드는 `nsh_core::prelude`의 함수(`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...)를 호출하고, TSX는 `nsh`에서 import합니다. 창 크기, 색상 스킴, 글꼴 배율, 픽셀 비율, 로케일, 앱 상태는 반응형입니다. 바인딩(Rust에서는 element에 전달하는 클로저, TSX에서는 JSX), `computed` 또는 `effect`에서 읽으면, 플랫폼이 변경을 알릴 때(회전, 창 크기 조정, 다크 모드 전환, 텍스트 크기나 언어 변경, 다른 밀도의 화면으로 이동, 앱을 떠났다가 돌아옴) 이를 읽는 쪽이 갱신됩니다.

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

가이드는 [Device and environment](../docs/device-and-environment.md)를 참고하세요.

### windowSize

```ts
const windowSize: Accessor<Size>;
```

표면의 크기를 포인트 단위로 제공합니다. 창 또는 임베드된 `NshAppView` / `NshView`의 크기입니다. 반응형입니다. Rust: `window() -> Size<Points>`.

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

현재 표시되는 외관입니다. 앱이 직접 설정하지 않았다면 시스템의 외관입니다(`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). 반응형입니다. Rust: `dark() -> bool`. 테마 색상(`AdaptiveColor`)과 `.dark(…)` 스타일 variant는 이 값을 읽지 않아도 자동으로 따라갑니다. Tailwind의 `dark:` variant도 마찬가지로 따라갑니다([Tailwind](../docs/tailwind.md) 참고).

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

기본값 대비 사용자가 선호하는 텍스트 크기입니다(`1`이 기본 크기이며, iOS에서는 Dynamic Type, Android에서는 글꼴 크기). 임베드하는 앱이 텍스트 크기를 설정했다면 그 값을 대신 제공합니다. 반응형입니다. Rust: `font_scale() -> f32`. 텍스트는 `allowFontScaling={false}`가 아닌 한 이미 이 값에 따라 크기가 조정됩니다. 텍스트 옆의 아이콘처럼 다른 크기도 함께 따라가야 할 때 이 값을 읽으세요.

### locale

```ts
const locale: Accessor<string>;
```

사용자의 로케일을 BCP 47 태그(`"en-US"`, `"zh-Hans-CN"`)로 제공합니다. 임베드하는 앱이 로케일을 설정했다면 그 값을 대신 제공합니다. 반응형입니다. Rust: `locale() -> Locale`(`locale().as_str()`는 태그). `Intl`는 기본적으로 이 로케일에 맞춰 포맷합니다. 직접 만든 번역 문자열을 선택할 때 이 값을 읽으세요([Device and environment](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

앱이 사용 중인지를 React Native의 `AppState` 기준으로 나타냅니다. `"active"`는 포그라운드에서 입력을 받는 상태, `"inactive"`는 화면에 보이지만 포커스가 없는 상태(다른 앱이나 창이 포커스를 갖고 있거나, 앱 전환기나 걸려 오는 전화처럼 시스템이 그 위에 무언가를 표시하는 경우), `"background"`는 화면에 보이지 않는 상태(백그라운드, 최소화, 숨겨진 브라우저 탭)입니다. 네이티브 앱 안에 표시되는 앱은 그 앱의 상태를 따릅니다. 반응형입니다. Rust: `lifecycle() -> Lifecycle`(`Lifecycle::Active`, `Inactive`, `Background`).

아무도 보지 않는 작업을 일시 중지하고 앱이 돌아오면 재개하려면 effect에서 읽으세요:

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

시스템의 외관과 관계없이 앱을 `scheme`로 즉시 표시합니다. `colorScheme()`, `dark:` 클래스, 컴포넌트의 테마, 플랫폼의 컨트롤(알림, 상태 표시줄의 기본 스타일)이 이를 따릅니다. `"system"`를 지정하면 다시 시스템을 따릅니다. `nsh.json` `"appearance"`은 처음부터 이 값을 설정합니다. Rust: `set_color_scheme(Appearance::Dark)`(`Appearance::Light`, `Appearance::System`).
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

앱이 실행되는 플랫폼이며, 앱이 실행되는 동안 변하지 않습니다.

| 멤버 | Rust | 설명 |
|---|---|---|
| `os` | `os() -> Os` (`os().name()`은 TS 문자열) | 운영 체제입니다. iOS, iOS 시뮬레이터, Mac Catalyst의 값은 `"ios"`, 브라우저의 값은 `"web"`입니다. |
| `version` | `os_version() -> (u16, u16)` | iOS와 데스크톱: OS 버전(`"17.5"`), Android: API 레벨(`"35"`), 웹: `"0.0"`. Rust는 주 버전과 부 버전을 제공하며, Android에서는 API 레벨과 0을 제공합니다. |
| `idiom` | `idiom() -> Idiom` | 기기의 종류입니다. `"desktop"`은(는) `desktop`이(가) `true`인 곳에서만 나오며, 그 외에는 `"phone"`, `"pad"`(iPad, Android 태블릿, iPad 관용구의 Mac Catalyst), `"mac"`(UIKit의 Mac 관용구로 실행되는 Mac Catalyst, 모바일 관용구) 또는 `"tv"`(Apple TV, Android TV)입니다. |
| `desktop` | `is_desktop() -> bool` | 데스크톱 동작이 적용됩니다: macOS, Windows, Linux, 그리고 마우스와 넓은 창을 갖춘 브라우저. `desktop={{…}}` props, `select({ desktop })`, `idiom` `"desktop"` 모두 이 값을 따릅니다. Mac Catalyst는 iOS 백엔드를 실행하므로 모바일이며, `ios={{…}}` props가 거기에 적용됩니다. [`nsh/desktop`](./nsh-desktop.md#isavailable)의 `isAvailable`은 창 및 메뉴 API에 대한 더 좁은 확인 방법으로, macOS, Windows, Linux가 이에 해당합니다. |
| `catalyst` | `is_catalyst() -> bool` | 앱이 Mac 또는 iPad 관용구로 Mac Catalyst에서 실행됩니다(`os` = `"ios"`). |
| `select(spec)` | `match os() { … }` | 이 플랫폼에 해당하는 값입니다(아래 참조). |

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

현재 OS의 값(`ios`, `android`, `web`, ...)을 반환하고, 없으면 `desktop` 또는 `mobile`(`platform.desktop`에 따라), 없으면 `native`(웹을 제외한 모든 플랫폼), 없으면 `default`, 그것도 없으면 `undefined`을(를) 반환합니다. Rust 코드는 `os()`에 대해 match합니다(`mobile` / `desktop`에는 `is_desktop()`도 사용).

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
> 한 플랫폼에만 있는 props에는 `platform`으로 분기하기보다 TSX 요소와 컴포넌트의 `ios={{…}}` / `android={{…}}` props를 사용하세요([플랫폼별 코드](../docs/platform-specific.md) 참조).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

포인트당 기기 픽셀 수입니다(예: 대부분의 iPhone에서 `3`). 반응형 값으로, 창이 다른 밀도의 화면으로 이동할 때(Mac Catalyst, 데스크톱 또는 외부 디스플레이에서), 그리고 Android의 디스플레이 크기 설정이 밀도를 바꿀 때 변경됩니다. Rust: `pixel_ratio() -> f32`, 그리고 정수 기기 픽셀 단위의 길이에는 `round_to_nearest_pixel(points)`. TSX에서 그 길이는 `Math.round(x * pixelRatio()) / pixelRatio()`입니다.

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

`url`을(를) 앱 밖에서 엽니다: 웹 페이지는 브라우저에서, `mailto:` 링크는 메일 앱에서, `tel:` 링크는 전화 앱에서, 그리고 다른 앱이 등록한 모든 스킴(`maps:`, 호스트 앱 자체의 `lb://` 링크)은 해당 앱에서 엽니다. 무언가가 열었는지 여부를 나타내는 `{ opened }`(으)로 resolve되며, 스킴을 처리하는 앱이 없으면 `false`입니다. Rust: `nsh_core::prelude`의 `open_url(url)`, 태스크에서 await하거나 (또는 버리는) 응답이며, 동일한 `bool`입니다.

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

- URL은 절대 주소여야 합니다(스킴이 있어야 함). 코드를 실행하거나 앱 자체 데이터에 접근하게 되는 URL인 `javascript:`, `data:`, `blob:`, `file:`, `about:`, `asset:`은 상대 주소와 마찬가지로 `TypeError`(으)로 프로미스를 reject합니다. `openUrl`은 절대 throw하지 않으며, 모든 실패는 reject로 처리됩니다.
- capability를 선언한 앱에는 `openUrl`이 필요합니다: 모든 스킴에는 `"openUrl": true`, 나열된 스킴에는 `"openUrl": { "schemes": ["https", "mailto"] }`. 그 외 URL은 `code`이(가) `"ERR_ACCESS_DENIED"`, `permission` `"openUrl"`, `resource`이(가) URL인 `Error`(으)로 reject됩니다([샌드박스와 capability](../docs/sandbox-and-capabilities.md) 참조). Rust에서는 `open_url`이(가) 이런 URL에 `false`(으)로 응답하고 이유를 로그에 남깁니다.
- 임베딩하는 앱이 URL을 먼저 확인하고, 대신 자체 라우터로 처리할 수 있습니다(Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; [iOS](../docs/ios.md#links-the-app-opens)와 [Android](../docs/android.md#links-the-app-opens) 참조). 이 경우 `opened`은(는) `true`입니다.
- 각 플랫폼은 자체 오프너로 엽니다: iOS에서는 `UIApplication.open`(임베드된 경우 호스트 앱의 application), Android에서는 `ACTION_VIEW` intent, macOS에서는 `NSWorkspace`, Windows에서는 `ShellExecuteW`, Linux에서는 `GtkUriLauncher`, GPUI의 `open_url`, 웹에서는 새 탭입니다. `nsh test`은(는) URL을 열지 않고 기록합니다.
- [`TextView`](../elements/text-view.md)은 `links="open"`을(를) 사용해 링크를 이 방식으로 엽니다.

<a id="layout-direction"></a>

### 레이아웃 방향

레이아웃 방향은 사용자의 언어를 따릅니다. 아랍어, 히브리어 등 오른쪽에서 왼쪽으로 쓰는 언어에서는 앱이 오른쪽에서 왼쪽으로 배치되고, 행은 오른쪽에서 시작하며, `left` / `right` 스타일 속성(`marginLeft`, `paddingRight`, ...)은 시작과 끝을 의미합니다. 변경은 재시작 없이 즉시 적용됩니다.

뷰의 `direction` 스타일(`"ltr"`, `"rtl"`, 또는 기본값인 `"inherit"`)은 해당 뷰의 하위 트리 방향을 설정합니다. Rust에서는 `.direction(LayoutDirection::..)`을(를) 사용합니다.

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

### 관련 문서

- 안전 영역 인셋(Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`)과 소프트웨어 키보드(Rust `keyboard_height()`; TSX `keyboardFrame()`)는 [안전 영역과 키보드](#safe-area-and-keyboard)에서 다룹니다.
- 스크린 리더와 동작 줄이기 설정은 [접근성](#accessibility)에서 다룹니다.

## PanResponder

Pan responder는 제스처 responder 시스템 위에 만든 드래그 제스처입니다. 요소가 제스처의 터치를 claim한 다음, 그 터치만 제스처 상태와 함께 받습니다. 제스처 상태는 터치의 중심점, 이동 거리, 속도를 대신 추적해 줍니다. Rust 코드는 `.claim_touches(TouchClaim::…)`(으)로 터치를 claim하고 `.on_responder_*` 리스너로 받으며, 리스너의 `ResponderEvent`은 `PanGesture`을(를) 담고 있고, 모두 `nsh_core::prelude`에 있습니다. TSX는 `nsh`에서 `PanResponder`을(를) import하며, `onPanResponder…` 콜백은 터치 이벤트와 제스처 상태를 받습니다.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Pan responder는 모든 이동을 앱 코드에 전달하므로, 앱 상태를 바꾸는 제스처(순서 변경, 스와이프로 삭제 여부 결정)에 적합합니다. 손가락으로 뷰를 움직이려면 네이티브 제스처 값이 더 빠릅니다: Rust에서는 `.pan_values(x, y)`, `.pinch_value(scale)`, `.rotation_value(angle)`, TSX에서는 `pan={{ x, y }}`, `pinch`, `rotation` props입니다. 드래그는 UI 스레드에서 [애니메이션 값](#animation)에 값을 쓰고, 앱은 시작과 끝(`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`)만 전달받습니다. [터치와 제스처](../docs/touch-and-gestures.md)를 참조하세요.

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

pan responder를 생성합니다. 제스처를 받아야 하는 뷰에 `panHandlers`을(를) spread하세요. Rust에서는 뷰가 터치를 claim하고 직접 리스닝합니다.

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

### 콜백

모든 콜백은 터치 이벤트(`GestureResponderEvent`, [`nsh`](#types)에서 제공)와 제스처 상태를 받습니다. Rust에서 claim은 `.ask(|request: &ClaimRequest| …)`(으)로 결정하며, 터치를 가져가려면 `request.claim()`을(를) 호출합니다(`ask`이 없으면 항상 가져갑니다). 각 리스너는 `ResponderEvent`을(를) 받으며, 그 `gesture`이 상태입니다.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| 콜백 | Rust | 반환값 | 호출 시점 |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | 손가락이 닿았습니다. responder가 되려면 `true`을(를) 반환하세요. 터치된 뷰에서 바깥쪽으로 차례로 묻습니다. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | 같은 질문이지만, 버블링 단계보다 먼저 바깥쪽에서 안쪽으로 묻습니다(부모가 자식에게서 제스처를 가져가는 경우). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | 손가락이 움직입니다. responder가 되려면 `true`을(를) 반환하세요(예: `Math.abs(g.dx) > 10` 이후에만). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | 같은 질문이며, 캡처 단계입니다. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | 이 뷰가 이제 responder입니다. 제스처가 시작됩니다. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | 다른 뷰가 responder이며 넘겨주려 하지 않습니다. |
| `onPanResponderStart` | `.on_responder_start(…)` | | responder인 동안 손가락이 닿았습니다. |
| `onPanResponderMove` | `.on_responder_move(…)` | | 손가락이 움직였습니다. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | responder인 동안 손가락이 떼어졌습니다. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | 마지막 손가락이 떼어졌습니다. 제스처가 끝났습니다. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | 다른 뷰(또는 스크롤 뷰 같은 네이티브 제스처)가 터치를 가져갔습니다. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)`이면 유지 | `boolean` | 다른 뷰가 터치를 원합니다. 유지하려면 `false`을(를) 반환하세요(기본값 `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | responder인 동안 네이티브 스크롤 뷰가 터치를 가져가지 못하게 할지 여부입니다(기본값 `true`). |

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

Rust: `PanGesture`, 포인트는 `Point<Points>` 타입입니다.

| 필드 | Rust | 설명 |
|---|---|---|
| `stateID` |  | 제스처를 식별합니다. |
| `moveX`, `moveY` | `position` | 터치 중심점의 최신 위치(표면 포인트 단위). |
| `x0`, `y0` | `origin` | responder가 부여되었을 때 중심점이 있던 위치. |
| `dx`, `dy` | `delta` | grant 이후 이동한 거리. |
| `vx`, `vy` | `vx`, `vy` | 초당 포인트 단위의 속도. |
| `numberActiveTouches` | `active_touches` | 닿아 있는 손가락 수. |

<a id="inside-scroll-views"></a>

### 스크롤 뷰 안에서

pan responder가 responder인 동안에는 그 주변의 네이티브 스크롤 뷰가 스크롤되지 않습니다(`onShouldBlockNativeResponder`의 기본값은 `true`). 가로 스와이프가 세로 스크롤과 공존하게 하려면 가로 이동에서만 responder가 되세요.

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

플랫폼이 인식하는 pan의 경우, 손가락이 움직이는 동안 `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))`이(가) 메인 스레드에서 결정합니다. 기반이 되는 responder props(`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...)도 모든 요소에서 직접 사용할 수 있습니다. [요소](../elements/index.md)를 참조하세요.

## Clipboard

클립보드 API는 시스템 클립보드를 읽고 씁니다. 텍스트는 모든 곳에서(iOS에서는 `UIPasteboard`, Android에서는 `ClipboardManager`, 데스크톱에서는 `NSPasteboard`, GDK, Win32 클립보드, 웹에서는 `navigator.clipboard`), 이미지는 iOS, 데스크톱, 웹에서, 파일 관리자에서 복사한 파일은 데스크톱과 Mac Catalyst에서 지원합니다. Rust 코드는 `nsh_core::prelude`의 함수(`set_clipboard`, `clipboard_string`, ...)를 호출하고, TSX는 `nsh`에서 `Clipboard`을(를) import합니다.

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

Rust 읽기 함수는 태스크에서 await할 응답을 반환합니다(`spawn` 또는 `async` 모듈 함수). `ClipboardImage`은(는) `nsh_core::element::ClipboardImage`이며, `url`와(과) `size`(`Size<DevicePixels>`)를 가집니다.

이미지는 iOS, 데스크톱, 웹에서 클립보드를 통해 전달됩니다. Android에서 클립보드는 텍스트만 담습니다. `writeImage`과(와)
`readImage`은(는) `code`이(가) `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`인 `Error`(으)로 reject되고, `hasImage`은(는)
`false`(으)로 resolve됩니다. Rust에서 `set_clipboard_image`은(는) 그곳의 클립보드를 그대로 두고, `clipboard_image`은(는) `None`(으)로 응답합니다.

사용자는 [선택 가능한 텍스트](../elements/text.md)에서 직접 복사할 수도 있습니다. 클립보드 API는 복사 버튼처럼 코드에서 복사할 때 사용합니다.

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

`text`을(를) 클립보드에 넣고, 기존 내용을 대체합니다. Rust: `set_clipboard(text)`.

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

클립보드의 텍스트로 resolve하며, 텍스트가 없으면 `""`입니다. Rust: `clipboard_string()`. iOS에서는 클립보드를 읽을 때 시스템의 붙여넣기 알림("App pasted from …")이 표시될 수 있고, Android 10 이상에서는 포그라운드의 앱만 읽을 수 있습니다. 화면마다 읽지 말고 사용자가 붙여넣기를 요청할 때 읽으세요.

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

클립보드에 텍스트가 있는지 여부로 resolve하며, 내용을 읽지 않으므로 iOS에서 붙여넣기 알림이 표시되지 않습니다. Rust: `clipboard_has_string()`. 붙여넣기 버튼을 표시할지 결정할 때 사용하세요. 웹에서는 브라우저가 읽어야만 알 수 있으므로 사용자에게 권한을 요청할 수 있습니다.

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

클립보드의 이미지로 resolve하며, 이미지가 없으면 `null`입니다. 붙여넣은 스크린샷이나 브라우저, 이미지 편집기에서 복사한 이미지가 해당합니다.
Rust: `clipboard_image()`, 이미지가 없으면 `None`. `url`은(는) 이미지의 URL(PNG, 또는 클립보드 자체의 JPEG, GIF, WebP, BMP)로, [`Image`](../elements/image.md)이 `src`(으)로 표시하고 `fetch`이(가) 읽습니다.
`fetch(url)`은(는) 업로드용으로 바이트를 제공합니다. `size`(`width`과(와) `height`)은 디코딩된 이미지의 픽셀 단위 크기입니다. `readText`과(와) 마찬가지로 사용자가 붙여넣기를 요청할 때 읽으세요. 최대 48 MB(인코딩 기준)의 이미지를 읽으므로 이미지가 앱의
메모리에 맞습니다. 더 큰 이미지는 `code`이(가) `"ERR_NSH_QUOTA_EXCEEDED"`인 `Error`(으)로 reject되며(메시지에 이미지의 크기와 제한이 나옵니다), `hasImage`은(는) `true`(으)로 resolve됩니다. Rust: `clipboard_image()`은(는) 이 경우 `None`(으)로 응답합니다.

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

사용자가 작성창에 스크린샷을 붙여넣는 채팅형 앱은 입력창에 포커스가 있는 동안 붙여넣기 단축키를 바인딩하고,
이미지가 있으면 가져옵니다.

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

클립보드에 이미지가 있는지 여부로 resolve하며, 내용을 읽지 않으므로 iOS에서 붙여넣기 알림이 표시되지 않습니다. Rust:
`clipboard_has_image()`. Android에서는 `false`(으)로 resolve됩니다.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

`src`(base64 `data:` URL 또는 `readImage`이(가) 제공한 `url`)의 이미지를 클립보드에 넣고, 기존 내용을 대체합니다.
Rust: `set_clipboard_image(src)`. Windows에서는 브라우저, Office, Snipping Tool이 읽는 형식인 PNG를 받습니다.
Android에서는 `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`(으)로 reject됩니다.

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

파일 관리자(Finder, Explorer, Files)에서 복사한 파일과 폴더의 `file:` URL을 복사한
순서대로 resolve하며, 없으면 `[]`입니다. [파일 드롭](../elements/view.md#desktop-file-drops)이 제공하는 것과 같은 URL입니다. Rust: `clipboard_files()`.
URL을 파싱해 경로를 얻으세요.

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
> 앱이 `capabilities`을(를) `nsh.json`에 선언하면 클립보드는 `"clipboard": true`(으)로 허가되어야 합니다. 허가가 없으면 `Clipboard`의 모든 함수가 `code`이(가) `"ERR_ACCESS_DENIED"`, `permission` `"clipboard"`, `resource` `""`인 `Error`(으)로 reject되며, 시스템 클립보드에는 아무것도 전달되지 않습니다. Rust에서는 쓰기가 클립보드를 그대로 두고, 읽기는 빈 클립보드가 하는 것처럼 응답하며(`""`, `None`, 빈 목록, `false`) 거부는 로그에 기록됩니다. [샌드박스와 capability](../docs/sandbox-and-capabilities.md)를 참조하세요.
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

Picker API는 시스템의 사진 선택기를 표시하고 사용자가 고른 이미지를 앱에 전달합니다. iOS에서는 Photos picker(`PHPickerViewController`), Android에서는 Photo Picker, 데스크톱에서는 열기 패널 또는 파일 대화상자, 브라우저에서는 파일 입력을 사용합니다. iOS와 Android에서 선택기는 앱 바깥에서 실행되며 사용자가 고른 항목만 넘겨주므로 사진 라이브러리 권한이 필요 없습니다. 선택된 각 이미지는 `File`(TSX) 또는 `PickedFile`(Rust)로 도착하며, 바이트는 네이티브 쪽에 남아 있습니다. `URL.createObjectURL(file)`로 [`Image`](../elements/image.md)에 표시하거나, `fetch`와 `FormData`로 업로드할 수 있습니다. Rust 코드는 `nsh_core::prelude`의 `pick_images`를 호출하고, TSX는 `nsh`에서 `Picker`를 import합니다.

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
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0은 최대 100개) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

선택기를 표시하고, 사용자가 고른 이미지를 고른 순서대로 resolve합니다. 사용자가 취소하면 `[]`로 resolve합니다.
Rust에서는 `pick_images(request)`이며, 태스크(`spawn` 또는 `async` 모듈 함수) 안에서 await하는 응답입니다. `pickImages`은
throw하지 않습니다. 범위를 벗어난 옵션(`limit: 0`, 0~1 범위 밖의 `quality`)은 `RangeError`로 promise를 reject하고, 앱의 capability가 허용하지 않는
선택은 `ERR_ACCESS_DENIED`(아래 참고)로 reject합니다. 취소는 실패가 아니라 사용자의 응답이므로 `[]`로 resolve합니다.

이미지는 바로 전송할 수 있는 상태로 도착합니다.

- **모든 브라우저와 서버가 받는 형식.** JPEG, PNG, GIF, WebP는 그대로 도착하고, 다른 형식으로 저장된 사진(iPhone의 HEIC, HEIF, TIFF)은 JPEG로 도착합니다. `format: "current"`는 저장된 형식을 유지합니다.
- **네이티브에서 축소.** `maxDimension`를 지정하면 긴 변이 그보다 긴 이미지는 그 크기에 맞게 똑바로 세워 축소한 뒤 다시 인코딩합니다. PNG는 PNG로, 그 외에는 `quality` 품질의 JPEG로 인코딩합니다. 휴대폰 사진은 12~48메가픽셀인데, 업로드 전에 2048픽셀로 줄이면 수백 킬로바이트가 됩니다. `quality`도 JPEG를 다시 인코딩합니다.
- **표시되는 크기.** `size`는 카메라 방향을 적용한, 화면에 표시되는 이미지의 픽셀 크기입니다. NSH가 다시 인코딩한 이미지에는 메타데이터(위치 정보)가 없고, 그대로 도착한 이미지는 자체 메타데이터를 유지합니다.

Windows, Linux, GPUI 창에서는 대화상자가 요청이 받는 형식(`"compatible"` 사용 시 JPEG, PNG, GIF, WebP)을 제공하며, 파일은 저장된 그대로 원래 크기로 도착합니다.

채팅 입력창은 사진을 첨부하고, 메시지를 작성하는 동안 표시하고, 전송할 때 업로드합니다.

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

한 번에 여러 장의 사진:

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

### 임베딩 앱

NSH를 임베드하면서 자체 선택기(예: 앱 고유의 앨범)를 가진 앱은 선택 요청에 직접 응답할 수 있습니다. Rust에서 엔진(`EngineConfig::picker`, GPUI 및 GPUI Kit 앱에서는 `AppView::set_picker`)에 `PickerBackend`(`nsh_core::picker`)을 주면 모든 선택 요청의 `PickRequest`를 받아 파일을 반환하며, 시스템 선택기는 표시되지 않습니다. 반환된 파일은 플랫폼의 파일과 같은 방식으로 처리됩니다. 요청의 제한에 맞게 잘리고, 크기, 형식, 확장자는 바이트에서 읽어 냅니다.

<a id="tests"></a>

### 테스트

`nsh test`는 헤드리스 실행에서 선택 요청에 응답합니다. `app.onPick(handler)`는 사용자가 고르는 파일(`{ name, type, data }`)을 반환하며, 핸들러가 없으면 선택은 취소됩니다. [Testing](../docs/testing-and-trace.md)을 참고하세요.

> [!NOTE]
> 앱이 `nsh.json`에서 `capabilities`를 선언하면 선택기는 `"picker": true`로 허용되어야 합니다. 허용되지 않으면
> `pickImages`는 아무것도 표시하지 않고 `code`가 `"ERR_ACCESS_DENIED"`, `permission`
> `"picker"`, `resource` `""`인 `Error`로 reject합니다. Rust에서는 `pick_images`가 파일 없음으로 응답하고 거부 내용이 로그에 기록됩니다.
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)를 참고하세요.

## Speech

Speech API는 사용자가 말한 내용을 텍스트로 바꿉니다(받아쓰기). 앱이 세션을 시작하면 플랫폼이 마이크를 듣고, 텍스트 변환 결과가 점점 늘어나며 도착합니다. macOS와 iOS는 시스템의 Speech framework로 인식하며, 시스템이 사용자에게 마이크와 음성 인식 권한을 한 번 요청합니다. 다른 플랫폼에서는 세션이 즉시 `"unavailable"` 오류와 함께 종료되므로, 마이크 버튼을 표시하기 전에 `Speech.available()`를 확인하세요. Rust 코드는 `nsh_core::prelude`의 `recognize_speech`를 호출하고, TSX는 `nsh`에서 `Speech`를 import합니다.

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
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (drop하면 abort됨) |

### Speech.start

세션을 시작하고 즉시 반환합니다. 세션은 다음 순서로 보고합니다. 마이크가 켜지고 인식기가 듣기 시작하면 `start`, 텍스트 변환 결과가 바뀔 때마다 `result`(`text`는 항상 지금까지의 전체 텍스트이므로 앱은 그대로 표시하면 됩니다), 마지막으로 `end` 하나를 보고하며, 그 뒤로는 아무것도 오지 않습니다. `stop()`는 듣기를 멈추고 인식기가 들은 내용을 마무리하게 합니다. `isFinal: true`가 있는 마지막 결과가 오고, 이어서 `end`가 옵니다. `abort()`는 오류 없이 세션을 즉시 종료하고, 아직 보고되지 않은 내용은 버립니다. 세션은 한 번에 하나만 실행되며, 다른 세션을 시작하면 실행 중인 세션이 abort됩니다.

`end`에는 마지막 텍스트 변환 결과가 담기며, 세션이 실패한 경우 Web Speech API와 같은 이름의 `error`가 함께 담깁니다.

| `error` | 발생 조건 |
|---|---|
| `"not-allowed"` | 사용자 또는 시스템이 마이크나 음성 인식을 허용하지 않음. |
| `"no-speech"` | 아무 말도 하지 않음. |
| `"audio-capture"` | 마이크를 사용할 수 없음. |
| `"network"` | 인식기가 네트워크를 필요로 하는데 연결할 수 없음. |
| `"language-not-supported"` | 인식기가 `lang`를 알지 못함. |
| `"unavailable"` | 이 플랫폼은 음성을 인식하지 않거나, 지금은 인식할 수 없음. |
| `"failed"` | 인식기가 다른 이유로 실패함. |

`start`는 옵션의 타입이 잘못되면 `TypeError`를, `lang`가 언어 태그가 아니면 `RangeError`를 throw합니다.

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

세션을 실행할 수 있는 곳, 즉 macOS와 iOS, 그리고 임베딩 앱이 직접 음성을 인식하는 곳에서 `true`로 resolve합니다.

### Info.plist

macOS와 iOS에서는 앱이 마이크와 음성 인식을 원하는 이유를 시스템이 표시합니다. `nsh package`와
`nsh run`는 앱이 음성을 사용할 수 있을 때(`capabilities` 권한이 `speech`이거나 아무것도 선언하지 않은 경우) `NSMicrophoneUsageDescription`와 `NSSpeechRecognitionUsageDescription`를 앱의 Info.plist에 기록합니다.

<a id="embedding-apps-1"></a>

### 임베딩 앱

NSH를 임베드하면서 자체 방식(자체 엔진이나 서비스)으로 음성을 인식하는 앱은 세션에 직접 응답할 수 있습니다. Rust에서 엔진(`EngineConfig::speech`)에 `SpeechBackend`(`nsh_core::speech`)를 주면 모든 세션의 `SpeechRequest`와, 어느 스레드에서든 보고할 수 있는 `SpeechSink`를 받고, 코어가 세션을 중지하고 abort할 때 사용하는 `SpeechControl`를 반환합니다. 이 경우 플랫폼의 인식기는 사용되지 않습니다.

<a id="tests-1"></a>

### 테스트

`nsh test`는 헤드리스 실행에서 가짜 인식기로 세션을 실행합니다. 세션은 즉시 시작되고, `app.hear(text)`는 지금까지의 텍스트 변환 결과로 `text`를 보고하며, `app.endSpeech(error?)`는 세션을 종료하고, `app.speechRequests()`는 앱이 시작한 세션을 나열합니다. [Testing](../docs/testing-and-trace.md)을 참고하세요.

> [!NOTE]
> 앱이 `nsh.json`에서 `capabilities`를 선언하면 음성은 `"speech": true`로 허용되어야 합니다. 허용되지 않으면
> `Speech.start`는 `code`가 `"ERR_ACCESS_DENIED"`, `permission` `"speech"`, `resource` `""`인 `Error`를 throw합니다.
> Rust에서는 세션이 `not-allowed`와 함께 종료되고 거부 내용이 로그에 기록됩니다. [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)를 참고하세요.

## Storage

Storage API는 앱의 데이터를 기기에 보관합니다. 문자열 키로 문자열을 저장하며, 다음에 앱을 시작할 때도 남아 있습니다. 설정, 임시 저장본, 사용자가 마지막으로 연 탭, 서버가 보낸 데이터의 캐시 등 앱 프로세스보다 오래 유지되어야 하는 모든 상태에 사용하세요. Rust 코드는 `nsh_core::storage::Storage`를 사용하고, TSX는 `nsh`에서 `Storage`를 import합니다. 둘은 같은 항목을 읽고 쓰므로, Rust 엔트리와 TSX 엔트리를 함께 가진 앱은 하나의 데이터 집합을 봅니다.

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

항목이 메모리에 있으므로 Rust 함수는 동기 방식입니다. 컴포넌트가 실행되는 곳(본문, 핸들러, 태스크)에서 호출하세요.

각 앱은 키와 값을 합쳐 최대 5MB의 고유한 저장소를 가집니다. 호출은 앱이 수행한 순서대로 실행되므로, `setItem` 뒤의 `getItem`는 쓰기가 끝나기를 기다리지 않고 새 값을 봅니다. 읽기는 메모리에서 이루어지고, 쓰기는 백그라운드에서 몇 건씩 모아 디스크에 반영됩니다.

| 플랫폼 | 데이터 저장 위치 |
|---|---|
| iOS | 앱 컨테이너의 `Library/Application Support/nsh/<app id>/storage.json` |
| Android | 앱 전용 디렉터리의 `files/nsh/<app id>/storage.json` |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | 브라우저의 `localStorage`, 앱 id(`nsh:com.example.todo:…`)를 딴 키 아래 |

손상된 `storage.json`는 옆에 `storage.json.corrupt`로 보관되고, 앱은 빈 저장소로 시작합니다. 읽을 수 없는 파일은 앱의 변경 사항을 메모리에만 남겨 두므로 파일이 교체되지 않습니다.

앱 id는 `nsh.json`의 `id`이며 앱과 함께 이동합니다. `nsh build`와 `nsh package`는 이를 번들 옆에 기록하고, 개발 서버가 전송하며, 서명된 패키지는 릴리스 키의 인증서가 보증하는 id를 담고 있습니다. 따라서 별도 설정 없이도 앱이 어디에서 실행되든 각자 자기 데이터를 보관합니다. id가 없는 앱은 `default` 아래에 보관합니다. 임베딩 앱은 다른 위치를 선택할 수 있습니다([Embedding on iOS](../docs/ios.md) 및 [Embedding on Android](../docs/android.md) 참고).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

`key`의 값으로 resolve하며, 값이 없으면 `null`로 resolve합니다. Rust에서는 `Storage::get_item(key)`이며, 값이 없으면 `None`입니다.

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

`key`를 `value`로 설정하고 기존 값을 대체합니다. 저장소가 5MB를 넘게 되면 `code`가 `"ERR_NSH_QUOTA_EXCEEDED"`인 `Error`로 reject하며, 이때 값은 저장되지 않습니다. Rust에서는 `Storage::set_item(key, value)`이며, 이 경우 `Err(StorageFull)`를 반환합니다. 값은 문자열이므로 구조화된 데이터는 JSON(Rust에서는 `serde_json::to_string`, TSX에서는 `JSON.stringify`)으로 보관하고 다시 읽어 옵니다(`serde_json::from_str`, `JSON.parse`).

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

`key`와 그 값을 제거합니다. 값이 없는 키를 제거해도 아무 일도 일어나지 않습니다. Rust에서는 `Storage::remove_item(key)`입니다.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

모든 키를 순서대로 resolve합니다. Rust에서는 `Storage::get_all_keys()`입니다.

### Storage.clear

```ts
clear(): Promise<void>;
```

사용자가 로그아웃할 때처럼 앱의 모든 키를 제거합니다. Rust에서는 `Storage::clear()`입니다.

<a id="keeping-a-signal-on-the-device"></a>

### 시그널을 기기에 보관하기

앱을 시작할 때 저장된 값을 읽고, 시그널이 바뀔 때마다 다시 기록합니다.

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

`host`는 NSH를 임베드한 앱, 즉 `NshAppView` / `NshView`를 감싸는 네이티브 앱에 접근합니다. 웹에서는 플레이어를 실행하는 페이지가 이에 해당합니다. 앱은 JSON 인자와 함께 이름으로 host의 함수를 호출하고, host가 보내는 이벤트를 수신합니다.

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

플랫폼에 호출에 응답하는 host가 있는지 나타냅니다. 웹에서는 페이지가 플레이어에 host를 제공하면 `true`입니다([The host on the web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

`args`(임의의 JSON 값이며, 없으면 `null`)로 host의 함수 `name`를 호출하고, 함수가 반환하는 값으로 resolve합니다. `host.call`은 throw하지 않습니다. 모든 실패는 promise를 reject하며, `code`가 무슨 일이 있었는지 알려 주는 `Error`를 사용합니다(메시지는 사람을 위한 것이며 바뀔 수 있습니다).

| `code` | 발생 조건 |
|---|---|
| `ERR_NSH_HOST_ERROR` | host의 함수가 실패했거나 host에 `name` 함수가 없음. 메시지는 host가 제공함 |
| `ERR_ACCESS_DENIED` | `name`가 앱의 [`host` capability](#capability)에 없음. `permission`는 `"host"`이고 `resource`는 해당 이름 |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | 플랫폼에 host가 없음. `host.available()`는 `false` |
| `ETIMEDOUT` | host가 제한 시간 안에 응답하지 않음 |
| `ERR_NSH_QUOTA_EXCEEDED` | 임베딩 앱의 응답을 기다리는 호출이 이미 1024개임 |

유효하지 않은 이름(`A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-` 중 1~128자이며 `..`는 포함하지 않음)은 `TypeError`로 reject합니다.

호출은 host의 응답을 30초 동안 기다린 뒤 `ETIMEDOUT`로 reject하며, 그 후에 도착한 응답은 버려집니다. `options.timeout`는 대기 시간을 밀리초 단위로 설정하고, `0`는 제한 없음을 의미합니다. 시계가 도달하지 못할 만큼 큰 timeout(약 1e22 ms)도 제한 없이 기다리며, 음수, `NaN` 또는 무한대 값은 `RangeError`로 호출을 reject합니다. 이 시간은 앱의 타이머와 마찬가지로 앱의 시간입니다. 수동 시계를 사용하는 `nsh test`에서는 시계에 맞춰 움직입니다.

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

플랫폼 이벤트는 host가 보내는 모든 `event`의 payload와 함께 `listener`를 호출하며, `host.on`가 반환하는 함수를 호출할 때까지 계속됩니다. 컴포넌트가 렌더링되는 동안 추가한 리스너는 컴포넌트와 함께 중지됩니다. 앱이 시작되기 전에 host가 보낸 이벤트는 앱이 시작되면 도착하므로, 앱 최상위에 등록한 리스너가 이를 받습니다. 리스너가 등록되기 전에 보낸 이벤트는 그 리스너에 다시 전달되지 않습니다. 앱이 시작될 때의 상태는 `host.call`로 읽고, 이후 변화는 `host.on`로 따라가세요.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### 권한(Capability)

앱이 호출하는 모든 함수는 `nsh.json`의 `capabilities.host`에 나열되어야 합니다. 정확한 이름이나 `*`로 끝나는 접두사를 쓰며, 전체를 허용하려면 `true`을 씁니다. 이는 다른 `capabilities`이 없는 앱을 포함해 모든 앱에 적용됩니다. 호스트의 함수는 기본적으로 허용되지 않습니다. 허용되지 않은 호출은 `ERR_ACCESS_DENIED`로 거부되고 로그에 기록되며, 임베딩 앱에 그런 이름의 `host.post`을 하면 같은 오류가 발생합니다. 또한 `nsh`에서 `host`을 import하는 앱을 `capabilities.host` 없이 빌드하면 경고가 표시됩니다. 이벤트에는 허용이 필요 없습니다. [Sandbox and capabilities](../docs/sandbox-and-capabilities.md#host)를 참고하세요.

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### 웹의 호스트

웹에서는 페이지가 호스트입니다. `createPlayer`의 `host` 옵션이 호출에 응답하고, `player.hostEvent(event, payload)`이 이벤트를 보냅니다:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

게시된 앱은 `nsh.json`에 호스트를 지정합니다. `web.host`은 앱 디렉터리에 있는 JS 모듈로, `nsh.json` 기준의 상대 경로이며, `call`이 포함된 객체를 반환하는 `createHost(player)`을 export합니다. `nsh package --target web`은 이를 사이트와 함께 배포하고, `nsh run --target web`은 개발 페이지에서 실행하며, `nsh test`은 테스트가 여는 앱을 위해 실행합니다. `web.connect`은 호스트 자체의 요청이 닿는 호스트 목록이며, 페이지의 Content-Security-Policy가 앱의 `capabilities.network`과 함께 이를 허용합니다. [Web](../docs/web.md#the-hosts-functions)을 참고하세요.

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

임베딩 앱이 앱을 시작하기 전에 설정한 매개변수로, 코드의 첫 줄부터 동기적으로 읽을 수 있습니다. 아무것도 설정하지 않았으면 `{}`입니다. 앱이 실행되는 동안 값은 그대로 유지되며, 이후의 요청은 이벤트로 전달됩니다.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```


<a id="native-sdk-channel"></a>

### Native SDK 채널

네이티브 SDK의 `send`은 앱이 수신을 시작하기 전까지 이벤트를 최대 256개까지 보관합니다. 전달 중에 마지막 리스너가 중지되면 남은 이벤트는 순서대로 계속 대기하며, 종료 중에 보낸 이벤트는 다음에 로드되는 앱을 기다립니다. `host.post(name, data)`은 네이티브 SDK 핸들러에 데이터를 전달하며, 핸들러의 `isPost`으로 post와 call을 구분합니다.

<a id="the-embedding-apps-side"></a>

### 임베딩 앱 쪽

각 뷰는 로드하는 모든 앱에 대해 하나의 채널을 유지합니다. 매개변수는 로드 전에 설정하고, 이벤트는 어느 스레드에서든 언제든 보낼 수 있으며, 핸들러는 이름으로 등록합니다. call과 post에는 앱의 `capabilities.host` 권한이 필요합니다. 핸들러는 지금 또는 나중에 한 번 응답하며, 응답이 오지 않으면 호출은 실패합니다.

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

[iOS에 임베딩](../docs/ios.md#talking-to-the-app), [Android에 임베딩](../docs/android.md#talking-to-the-app), [GPUI](../docs/gpui.md)를 참고하세요.

> [!NOTE]
> Native SDK의 call과 post는 플랫폼 호출과 동일한 [`host` capability](../docs/sandbox-and-capabilities.md#host)를 사용합니다. Rust 앱은 등록한 함수([`nativeModule`](#nativemodule) 및 Rust import)를 통해 임베딩 앱의 Rust에 직접 접근합니다.

## keymap

keymap은 앱의 키보드 단축키를 바인딩합니다. `"mod+k"` 같은 키 입력과 그 키 입력이 실행하는 함수를 연결합니다. Rust 코드는 `nsh_core::prelude`에서 `on_key`, `on_key_with`, `key_label`을 호출하고, TSX는 `nsh`에서 `keymap`을 import합니다. 둘 다 같은 키 입력을 받고 같은 규칙을 따릅니다.

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
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when`는 `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | 키 입력마다 하나의 `on_key` |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Rust 바인딩은 이를 만든 컴포넌트(소유자)가 존재하는 동안 유지되며, 핸들러는 작성된 그대로의 키 입력을 받습니다.

단축키는 macOS, Windows, Linux와 브라우저에서 동작합니다(Ctrl+T나 Cmd+W 같은 브라우저 자체의 키는 페이지에 전달되지 않습니다). iOS와 Android에서는 하드웨어 키보드가 있을 때 동작하며, iPad의 키보드, iPad 앱을 실행하는 Mac의 키보드, 태블릿이나 Chromebook의 키보드, 시뮬레이터와 에뮬레이터의 키보드가 이에 해당합니다. 같은 코드가 어디서나 실행되며, 키보드가 없으면 어떤 키도 바인딩을 실행하지 않습니다.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

`keystroke`을 누르면 `handler`을 실행하고, 바인딩을 제거하는 함수를 반환합니다. 핸들러는 `{ keystroke }`을 받으며, 이는 작성한 그대로(대소문자 포함)의 키 입력입니다. Rust: `on_key(keystroke, handler)`, 핸들러는 키 입력 자체를 받습니다.

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

객체를 전달하면 여러 키 입력을 한 번에 바인딩하며, 반환된 함수는 이를 모두 제거합니다. Rust에서는 각 키 입력이 하나의 `on_key`입니다:

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

컴포넌트가 렌더링되는 동안 만든 바인딩은 컴포넌트와 함께 제거되므로, 화면의 단축키는 그 화면이 존재하는 동안만 유지됩니다:

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

개발 서버에서 모듈을 편집하면, 모듈의 최상위 코드가 만든 바인딩은 코드가 다시 실행되기 전에 제거됩니다. 따라서 핫 리로드가 오래된 단축키를 남기지 않습니다.

### keymap.label

```ts
label(keystroke: string): string;
```

앱이 실행되는 곳에서 메뉴와 힌트가 표시하는 방식 그대로 `keystroke`을 반환합니다. macOS와 iOS(그리고 Mac, iPhone, iPad의 브라우저)에서는 `"⇧⌘L"`, Windows, Linux 및 다른 브라우저에서는 `"Ctrl+Shift+L"`이며, 대상은 `"mod+shift+l"`입니다. Rust: `key_label(keystroke)`. 앱의 단축키를 실제로 동작하는 키로 표시할 때 사용하세요:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

`bind`처럼, 잘못된 키 입력에 대해 `TypeError`를 던집니다. `key_label`과 `on_key`은 같은 메시지로 panic합니다.

<a id="keystrokes"></a>

### 키 입력

키 입력은 `+`로 연결된 수정자와 키입니다: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"`(Command와 마이너스).

| 수정자 | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (또는 `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (또는 `command`, `meta`, `super`, `win`) | Command (⌘) | Windows 키 | Super |
| `ctrl` (또는 `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (또는 `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS는 macOS를 따르고(`mod`는 Command), Android는 Windows와 Linux를 따릅니다(`mod`는 Ctrl, `cmd`는 Meta 키). 브라우저에서는 브라우저가 실행되는 플랫폼을 따릅니다. `mod`는 Mac, iPhone, iPad에서는 Command이고 그 외에서는 Ctrl입니다.

앱 고유의 단축키에는 `mod`를 사용하세요. 각 플랫폼의 앱이 단축키에 사용하는 키이므로(macOS에서는 ⌘K, Windows와 Linux에서는 Ctrl+K) 하나의 표기가 어디서나 맞습니다. Windows 키와 Super는 대부분 시스템이 사용하므로, macOS 외에서 `cmd`가 적절한 경우는 드뭅니다.

키는 문자, 숫자 또는 구두점 키이며, 미국식 키보드에서 Shift 없이 입력되는 문자로 씁니다(`k`, `1`, `,`, `/`, `[`. `?`에는 `"shift+/"`, Shift+K에는 `"shift+k"`). 또는 이름으로 씁니다: `plus`(`=` / `+` 키, `=`로도 씀), `minus`(`-`로도 씀), `space`, `enter`(`return`), `escape`(`esc`), `tab`, `backspace`, `delete`(`del`), `insert`, 화살표 `up`, `down`, `left`, `right`(`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`부터 `f24`까지. 대소문자는 구분하지 않습니다. `"Mod+Shift+K"`는 `"mod+shift+k"`와 같고, 대문자도 Shift가 아니라 같은 키입니다(`"mod+K"`는 `"mod+k"`와 같음). 소문자를 권장하며 이 문서에서도 소문자를 사용합니다. `"mod-k"`와 `"mod++"`는 오류이며, 오류 메시지가 올바른 표기를 알려 줍니다. `nsh/desktop`의 메뉴 단축키도 같은 키 입력을 받습니다.

단축키는 어떤 키보드 레이아웃에서도 동작합니다. 키릴 문자나 그리스 문자 레이아웃에서 `mod+k`은 미국식 레이아웃에서 K를 입력하는 키이며, 메뉴 단축키도 마찬가지입니다.

`bind`은 잘못된 키 입력(`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`)에 대해 무엇이 잘못되었는지 알려 주는 `TypeError`를 던지며, 시스템이 자체적으로 사용하는 키 입력은 거부합니다. 따라서 앱이 이를 깨뜨릴 수 없습니다:

| 플랫폼 | 예약된 키 |
|---|---|
| macOS, iOS | Cmd+Q (종료), Cmd+H (숨기기), Option+Cmd+H (다른 앱 숨기기), Cmd+M (최소화), Ctrl+Cmd+F (전체 화면) |
| Linux, Windows, Android | Ctrl+Q (종료), Alt+F4 (닫기), F11 (전체 화면) |
| Web | 없음 (브라우저가 자체 키를 유지함) |

<a id="while-typing"></a>

### 입력 중

키보드 포커스가 있는 텍스트 입력은 자신의 키를 필요로 합니다. 타이핑, 캐럿 이동, 삭제, 그리고 전체 선택, 잘라내기, 복사, 붙여넣기, 실행 취소, 다시 실행입니다. 따라서 기본적으로 텍스트 입력(또는 웹 뷰)에 포커스가 있을 때는, 키 입력이 다음 중 하나이면 바인딩이 실행되지 않습니다. 일반 키, Shift나 Option만 함께 누른 키, 화살표, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, 그리고 `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`입니다. Command나 Control이 포함된 다른 키 입력과 기능 키는 포커스가 어디에 있든 실행됩니다.

`when`로 이를 바꿀 수 있습니다(Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | 실행 시점 |
|---|---|
| (기본값) | 위와 같음 |
| `"always"` | 텍스트 입력에서도, 입력이 키를 받기 전에 실행 |
| `"notEditing"` | 텍스트 입력에 포커스가 있는 동안에는 실행하지 않음 |

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

iOS와 Android에서 입력기가 조합 중인 키(후보 선택, 확정)는 계속 입력기가 처리합니다. GPUI 백엔드에서는 키보드 포커스가 있는 네이티브 컴포넌트가 텍스트 에디터일 수 있으므로 텍스트 입력으로 간주됩니다. 이 컴포넌트가 각 키를 먼저 받으며, 스스로 처리한 키는 바인딩에 도달하지 않고, 텍스트 편집 중에 실행되는 바인딩은 컴포넌트가 통과시킨 키를 받습니다.

<a id="which-binding-runs"></a>

### 실행되는 바인딩

바인딩을 실행한 키는 소비됩니다. 키가 입력되지 않고, 시스템이 경고음을 내지 않으며, NSH 자체의 키(뒤로 가는 Escape, 포커스를 옮기는 Tab, 스크롤하는 화살표)도 이를 받지 못합니다. 여러 바인딩이 같은 키 입력을 가지면 실행 가능한 가장 최근 바인딩이 실행됩니다. 따라서 다이얼로그가 화면의 바인딩 위에 Escape를 바인딩할 수 있고, 다이얼로그의 바인딩이 사라지면 화면의 바인딩이 다시 동작합니다. 바인딩은 키가 눌리는 순간 네이티브에서 확인되며, 핸들러는 직후 엔진 스레드(Rust) 또는 JS 스레드(TSX)에서 실행됩니다.

키를 누르고 있으면 바인딩은 키를 뗄 때까지 한 번만 실행됩니다. `repeat: true`을 쓰면 자동 반복마다 다시 실행됩니다(예: 목록을 하나씩 이동할 때):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

메뉴 단축키는 같은 키 입력의 바인딩에 우선권을 내줍니다. 모든 데스크톱에서는 애플리케이션 메뉴([`nsh/desktop`](./nsh-desktop))가 그렇고, macOS에서는 기본 제공 메뉴(Cmd+W, Cmd+C 등)도 그렇습니다. `nsh run`로 개발하는 동안에는 앱이 `mod+r`을 바인딩하더라도 Cmd+R / Ctrl+R이 항상 앱을 다시 로드하며, 패키징된 앱은 이를 바인딩할 수 있습니다.

## nativeComponent and nativeModule

`nativeComponent`와 `nativeModule`은 실행 시점에 이름으로 앱을 호스트 앱이 제공하는 것과 연결합니다. NSH를 임베딩하는 iOS 또는 Android 앱은 자체 뷰(지도, 차트, 카메라 미리보기 등)를 이름으로 등록할 수 있으며, `nativeComponent`은 그중 하나에 대한 타입이 지정된 컴포넌트를 제공합니다. NSH는 실제 네이티브 뷰로 렌더링하므로, 이런 컴포넌트는 다른 뷰와 마찬가지로 뷰 계층에 놓입니다. NSH가 레이아웃하고, 부모와 함께 클리핑 및 스크롤되며, 올바르게 겹쳐집니다. Rust에서 NSH를 임베딩하는 앱은 함수, 클래스, Rust 컴포넌트도 등록할 수 있으며, `nativeModule`은 이를 타입이 지정된 하나의 객체로 제공합니다. 어느 경우든 앱은 기본 `nsh build`으로 빌드되며, 호스트가 앱을 실행할 때 호스트가 제공하는 것을 연결합니다. Rust 코드는 `nsh_core::prelude`의 `native(name)`로 등록된 뷰를 배치하고, `.prop(name, value)`(JSON 값, 또는 그 시그널이나 클로저)로 props를 설정하거나 `.bind_prop(name, &value)`로 props를 애니메이션 값에 바인딩하며, `.on_native_event(…)`으로 이벤트를 수신하고 `ElementRef`를 통해 명령을 호출합니다. TSX는 `nsh`을 import합니다.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

네이티브 쪽 등록은 [Native components](../docs/native-components.md)를, 임베딩은 [Embedding on iOS](../docs/ios.md) / [Embedding on Android](../docs/android.md)를 참고하세요.

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

임베딩 앱이 `name`로 등록한 네이티브 컴포넌트(Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`)에 대한 컴포넌트를 반환합니다. Rust: `native(name)`, props가 JSON 값(`.prop("text", json!(…))`)이고 이벤트가 `NativeEvent { name, data }`로 도착하는 뷰입니다.

- `P`는 컴포넌트 자체 props의 타입입니다. `spec.props`에 나열된 각 prop은 변경될 때 JSON으로 네이티브 쪽에 전송되며, `undefined`로 설정하면 제거됩니다.
- `E`는 이벤트 이름을 페이로드에 매핑합니다. 이벤트 `regionChange`는 핸들러 prop `onRegionChange`이 됩니다.
- 컴포넌트는 `children`을 제외한 모든 [뷰 prop](../elements/view.md)도 받습니다: `style`, `class`, 레이아웃, 접근성, 터치 핸들러, `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### 크기

컴포넌트는 뷰처럼 스타일이 지정한 크기로 레이아웃됩니다. 스타일에서 치수가 지정되지 않은 경우에는 네이티브 컴포넌트가 보고하는 크기를 사용합니다(이미지가 자체 크기를 사용하는 것과 같습니다).

<a id="commands"></a>

#### 명령

컴포넌트의 `ref`는 `NativeComponentRef`을 받으며, `ref.command(name, args)`는 `args`(임의의 JSON 값)과 함께 네이티브 컴포넌트의 명령 `name`를 호출합니다. Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### 아무것도 등록되지 않은 경우

`name` 아래에 아무것도 등록되지 않은 경우(다른 호스트 앱, 개발 호스트, 브라우저) 컴포넌트는 빈 뷰를 렌더링하고 경고가 한 번 기록됩니다. 이 컴포넌트 없이도 앱을 사용할 수 있게 하거나, 사용하기 전에 호스트를 확인하세요.

<a id="example"></a>

### 예제

여기의 배지는 `embed.badge`로 등록된 호스트 앱의 네이티브 뷰입니다. NSH가 이를 레이아웃하고, `text`과 `color`을 보내고, `tap` 이벤트를 받으며, `pulse` 명령을 호출합니다:

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

임베딩 앱이 `specifier`로 등록한 세트의 exports(모듈, 클래스, 함수, Rust 컴포넌트)를 하나의 객체로 반환합니다. 타입 `T`는 앱이 직접 작성하므로, 빌드할 때 호스트에 대한 정보는 필요하지 않습니다. 호스트의 crate와 함께 빌드되는 Rust 코드는 이 함수들을 Rust 함수로 호출하며, TSX에서는 `nativeModule`로 접근합니다.

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

- 호출은 세트를 import해서 호출할 때와 똑같이 동작합니다. 일반 Rust 함수는 값을 즉시 반환하고, `async` 함수는 promise를 반환하며, 인자로 넘긴 함수는 Rust가 나중에 호출할 수 있는 콜백이 됩니다. Rust가 모든 인자를 검사하고, 잘못된 인자가 있으면 `TypeError`를 throw합니다.
- 같은 `specifier`로 호출할 때마다 같은 객체가 반환됩니다.
- `specifier` 아래에 등록된 것이 없으면 `nativeModule`는 해당 이름을 담은 `ReferenceError`를 throw합니다. 앱이 이를 처리할 수 있는 위치에서 호출하거나, 해당 호스트에서만 호출하세요.

호스트는 시작하기 전에 Rust에서 플랫폼 crate의 `set_ui_sets`(NSH 자체 세트와 나란히 위치) 또는 `EngineConfig::ui_sets`로 세트를 등록합니다.

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

`on`는 호스트가 모든 앱을 자신의 데이터와 동기화하는 방법입니다. 시작된 태스크가 호스트의 변경을 기다렸다가 각 변경을 앱에 전달하므로, 호스트나 다른 함수를 통한 어떤 앱이 변경해도 이를 수신하는 모든 앱에 반영됩니다. 이 함수가 반환하는 `Stop`는 TSX에서 `Trading.on`가 반환하는 함수와 같습니다. 앱이 호출하거나 `on`를 호출한 대상이 사라질 때(컴포넌트, 또는 핫 리로드 중 모듈의 실행) 한 번 실행되며, 여기서는 리스너를 해제하여 태스크를 종료합니다.

> [!NOTE]
> props, 이벤트, 명령 인자는 JSON으로 네이티브 쪽에 전달됩니다. 등록된 컴포넌트와 함수는 호스트 앱 자체의 코드이므로, NSH의 [샌드박스 제한과 capability](../docs/sandbox-and-capabilities.md)는 이들이 수행하는 작업에 적용되지 않습니다.

## Accessibility

Accessibility API는 사용자의 접근성 설정(스크린 리더 실행 여부, 모션 감소 요청 여부)을 읽고 스크린 리더와 통신합니다. Rust 코드는 `nsh_core::prelude`에서 `screen_reader()`, `reduce_motion()`, `announce_for_accessibility()`을 호출하고 `ElementRef`로 포커스를 이동합니다. TSX는 `nsh`에서 `screenReaderEnabled()`, `reduceMotion()`, `announce()`, `setAccessibilityFocus()`을 import합니다. 이 설정들은 반응형입니다. 바인딩, `computed` 또는 `effect`에서 읽으면, 사용자가 설정을 변경할 때 이를 읽는 대상이 업데이트됩니다. 엘리먼트의 접근성 props(`accessibilityLabel`, `role` 등)는 [Elements](../elements/index.md)에, 가이드는 [Accessibility](../docs/accessibility.md)에 문서화되어 있습니다.

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

스크린 리더(VoiceOver, TalkBack)가 실행 중인지 여부입니다. 반응형이며, 사용자가 스크린 리더를 켜거나 끄면 이를 읽는 대상이 업데이트됩니다. Rust에서는 `screen_reader() -> bool`이며, 같은 방식으로 반응형입니다.

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

사용자가 모션 감소를 요청했는지 여부입니다(iOS의 동작 줄이기, Android의 애니메이션 제거). 반응형입니다. Rust에서는 `reduce_motion() -> bool`입니다. Tailwind 클래스도 `motion-reduce:` variant로 이 설정을 따릅니다.

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

스크린 리더가 `message`을 읽어 줍니다(VoiceOver 안내, TalkBack). "Saved"처럼 포커스가 이동하지 않고 나타나는 결과에 사용하세요. Rust에서는 `announce_for_accessibility(message)`입니다.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

스크린 리더의 포커스를 `node`(엘리먼트의 `ref`)로 이동합니다. Rust에서는 `ElementRef::set_accessibility_focus()`입니다.

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

`nsh`은 반응형 API와 호스트 엘리먼트의 타입도 export합니다. 가장 많이 쓰이는 타입은 다음과 같습니다.

| Type | 설명 |
|---|---|
| `Accessor<T>` | 읽을 수 있는 값: `() => T` |
| `Signal<T>` | `set`와 `update`를 가진 `Accessor<T>` |
| `SignalOptions<T>` | `signal`와 `computed`의 옵션(`equals`) |
| `Context<T>` | `context`가 반환하는 값 |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | JSX 네임스페이스(`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | `ref`가 받는 값이며, 각 엘리먼트 고유의 타입(`ViewRef`과 그 위의 타입들)입니다. 포커스, 스크롤 및 기타 명령을 다룹니다. `ViewRef`는 엘리먼트 자체이기도 합니다(`JSX.Element`). [ref 메서드](../elements/index.md#ref-methods)를 참고하세요 |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | 호스트 엘리먼트의 props |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | 스타일 객체. [스타일 레퍼런스](./style-reference.md)를 참고하세요 |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | 스타일 내부의 값 |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | 이벤트 페이로드 |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | 페이로드와 props를 구성하는 형태이며, GPUI의 필드(`nsh_core::geometry`)를 가집니다 |
| `PixelSize` | 이미지 또는 비디오 자체의 픽셀 단위 크기(`onLoad`, `Image.getSize`, 클립보드와 피커의 이미지)이며, `Size`는 포인트 단위입니다 |
| `ImageAsset` | 이미지 파일을 import하면 얻는 값(`{ url, size: Size, scales? }`, `scales`는 [픽셀 밀도 변형](../docs/images-and-assets.md#pixel-densities)을 나열) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | 접근성 props |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>`는 하나의 스타일 또는 왼쪽에서 오른쪽으로 병합되는 스타일 목록을 받으며, falsy 항목은 건너뜁니다.

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
