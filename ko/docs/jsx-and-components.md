---
title: "JSX와 컴포넌트"
description: "NSH가 Rust와 TSX에서 UI를 기술하는 방법(엘리먼트, 컴포넌트, props, children, 제어 흐름, ref, 스프레드)과 JSX 컴파일러와 Rust의 빌더가 동일한 네이티브 엘리먼트를 만들어 내는 방식을 설명합니다."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX와 컴포넌트

NSH 앱은 Rust 또는 TSX로 요소(element)와 컴포넌트를 사용해 UI를 기술합니다. Rust는 함수와 타입이 지정된 빌더 메서드(`view().gap_4().child(..)`)로 요소를 만들고, TSX는 JSX로 작성합니다. NSH의 컴파일러는 이 JSX를 동일한 네이티브 렌더러에 대한 직접 호출로 변환하며, React와 가상 DOM은 사용하지 않습니다. 어느 쪽이든 컴포넌트는 한 번 실행되어 트리의 자기 부분을 만드는 함수입니다. 이후 UI를 최신 상태로 유지하는 것은 [반응성](./reactivity.md)입니다. 시그널을 읽는 바인딩은 네이티브에서 추적되며, 그 바인딩만 다시 실행됩니다.

<a id="elements"></a>

## 요소

**호스트 요소**는 각각 네이티브 뷰를 기반으로 합니다. Rust는 prelude의 함수로 요소를 만들고, TSX는 `nsh`에서 컴포넌트로 import합니다. import 없이 쓸 수 있는 전역은 `If`와 `Each`뿐입니다.

| Rust | TSX | 네이티브 뷰 | 페이지 |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: 레이아웃, 스타일링, 터치를 위한 박스 | [View](../elements/view.md) |
| `text(..)` | `<Text>` | 네이티브 텍스트 뷰. 중첩된 텍스트 요소는 span이 됩니다 | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | 이미지 뷰(로컬 에셋과 URL) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | 가상화되고 재활용되는 리스트 | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | 그림(drawing), 웹 페이지, 비디오 플레이어 | [요소](../elements/index.md) |
| `nsh_base::dialog()` | `nsh/base`의 `<Dialog>` | 표시되는 레이어 | [요소](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | 제어 흐름, 자체 뷰 없음 | [제어 흐름](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

Rust에서 스타일은 Tailwind 유틸리티와 같은 이름의 타입 지정 메서드(`.px_4()`, `.rounded_lg()`, `.bg(..)`)이고, 리스너도 메서드(`.on_press(..)`)입니다. 플랫폼 전용 설정에는 별도의 메서드가 있습니다. TSX에서 props는 camelCase 이름을 유지합니다(`onPress`, `allowFontScaling`, `backgroundColor`). 모든 요소는 `style`, `class` / `classList`([Tailwind](./tailwind.md)), `ref`, 터치 핸들러, 접근성 props, `testID`를 받습니다. 플랫폼 전용 props는 `ios={{…}}`와 `android={{…}}`에 넣으며, 현재 플랫폼의 객체만 전달됩니다.

```rust tabs
view()
    .rounded(px(12.0))
    .bg(move || theme().background)
    .on_press(move || open.set(true))
    .child(text("Open").font_weight(FontWeight::SEMIBOLD))
```

```tsx tabs
<View android={{ elevation: 4, ripple: { color: "#0001" } }} style={{ borderRadius: 12 }} onPress={() => open.set(true)}>
  <Text style={{ fontWeight: "600" }}>Open</Text>
</View>
```

TSX 태그가 PascalCase인 이유는 TypeScript가 각 태그를 그것이 가리키는 바인딩에 대해 검사할 수 있게 하기 위해서입니다. 소문자 태그는 이름마다 하나의 전역 타입에 대해 검사되므로, `List`나 `Each` 같은 제네릭 컴포넌트는 `each` / `of`에서 행의 타입을 추론할 수 없고, 앱 자체의 컴포넌트에는 타입이 전혀 지정되지 않습니다. import는 런타임 비용이 없습니다. 컴파일러가 import(별칭 포함)를 통해 프리미티브를 인식하고 네이티브 요소를 그 자리에서 만들기 때문에, `<View>`는 렌더러의 직접 호출이 되고 import는 번들에서 제거됩니다. 소문자 태그는 빌드 오류이며, 무엇을 써야 하는지 알려 줍니다.

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> 텍스트는 텍스트 요소 안에서만 표시됩니다. Rust에서는 `text(..)`, TSX에서는 `<Text>`입니다. `<View>` 안에 직접 넣은 문자열은 네이티브 뷰를 만들지 않으며 표시되지 않습니다.

<a id="components"></a>

## 컴포넌트

앱의 외관은 앱 자체의 몫입니다. NSH는 두 개의 계층을 제공합니다. 하나는 프리미티브(위의 요소, 스타일, Tailwind 클래스)이고, 다른 하나는 [`nsh/base`](../modules/nsh-base.md)(Rust에서는 `nsh_base`)의 스타일 없는 기본 컴포넌트로, 내비게이션, 다이얼로그, 키보드, 상태 표시줄, 안전 영역 같은 동작을 담당합니다. 세 번째 계층인 컴포넌트 라이브러리는 여러분의 몫입니다. 버튼, 카드를 비롯한 UI의 모든 부분은 이 두 계층 위에서 앱의 crate([Rust로 빌드하기](./rust.md)) 또는 TSX로 직접 작성하는 컴포넌트이거나, 커뮤니티의 라이브러리입니다([세 가지 계층](./architecture.md#three-layers)).

Rust 컴포넌트는 props 구조체(이벤트가 있으면 이를 내보낼 `Scope`도 함께)를 받아 요소를 반환하는 `#[component] fn`입니다. `#[component]`는 함수 이름을 스네이크 케이스로 바꾼 생성자도 만듭니다. `Badge`는 `view()`가 뷰를 배치하는 것처럼 `badge()`로 배치하며, prop마다 setter(`.label(..)`, `.color(..)`: 값, 시그널 또는 클로저)가 있습니다. TSX 컴포넌트는 props 객체를 받아 JSX를 반환하는 함수입니다.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct BadgeProps {
    /// The text.
    pub label: Prop<SharedString>,
    /// The background (light blue when left out).
    #[prop(default = Hsla::from(rgb(0xddf4ff)))]
    pub color: Prop<Hsla>,
}

/// A small rounded label.
#[component]
pub fn Badge(props: BadgeProps) -> impl IntoElement {
    view()
        .rounded_full()
        .px(px(10.0))
        .py_1()
        .bg(move || props.color.get())
        .child(text(props.label).text_size(px(13.0)).font_weight(FontWeight::SEMIBOLD))
}

// Placed in another component's view:
badge()
    .label(move || format!("{} new", unread.get()))
    .color(rgb(0xfff8c5))
```

```tsx tabs
function Badge(props: { label: string; color?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: props.color ?? "#ddf4ff" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" }}>{props.label}</Text>
    </View>
  );
}

<Badge label={`${unread()} new`} color="#fff8c5" />
```

이 함수는 컴포넌트가 생성될 때 **한 번** 실행되며, 읽는 값을 추적하지 않습니다. 리렌더링은 없습니다. 본문의 코드(시그널 생성, 이펙트 시작, 상수 계산)는 한 번만 실행됩니다. 반환된 요소는 읽는 props와 시그널에 연결된 채로 유지되므로, 위의 `Badge`는 `Badge`를 다시 실행하지 않고도 `unread`가 바뀔 때마다 텍스트를 갱신합니다.

UI에 고유한 props나 이벤트가 있거나 TSX 진입점이 import해야 할 때는 `#[component]`를 작성하세요. Rust 컴포넌트는 자신의 타입(`registry.register::<Badge>()`)으로 등록되며, props는 구조체로부터 타입이 정해집니다([Rust로 빌드하기](./rust.md#extending-a-rust-app-with-tsx)). Rust에서만 사용하는 UI 조각이라면 `impl IntoElement`를 반환하는 일반 함수로 충분하며, 그 인자가 props입니다. TSX에서 컴포넌트는 요소, 문자열 또는 숫자, 배열, `null`, 또는 이 중 하나를 반환하는 함수(렌더러가 따라갑니다)를 반환할 수 있습니다. `nsh`의 `Component<P>` 타입이 이를 나타냅니다.

```rust tabs
fn row(title: impl Into<SharedString>, content: impl IntoElement) -> impl IntoElement {
    view()
        .flex_row()
        .gap_2()
        .child(text(title.into()))
        .child(content)
}
```

```tsx tabs
import type { Component, JSX } from "nsh";
import { Text, View } from "nsh";

const Row: Component<{ title: string; children?: JSX.Element }> = (props) => (
  <View style={{ flexDirection: "row", gap: 8 }}>
    <Text>{props.title}</Text>
    {props.children}
  </View>
);
```

<a id="what-runs-again"></a>

### 다시 실행되는 것

요소에 전달된 값은 한 번만 설정되고, 바인딩은 읽는 값을 따라갑니다. Rust에서 바인딩은 값이 들어갈 자리에 전달된 클로저(또는 시그널, 메모, prop)입니다. TSX에서는 컴파일러가 JSX 안의 각 표현식을 판단합니다. 표현식이 (중첩 함수 바깥에서) **함수를 호출하거나 프로퍼티를 읽으면** 변경되는 것으로 취급하고, 그 외에는 모두 한 번만 설정합니다.

```rust tabs
text(move || format!("{}", count.get()))     // follows count
text(props.title)                            // follows the prop
text(label.clone())                          // a plain value: set once
view().opacity(move || if busy.get() { 0.5_f32 } else { 1.0 })   // follows busy
```

```tsx tabs
<Text>{count()}</Text>              // follows count
<Text>{props.title}</Text>          // follows the prop
<Text>{user.name}</Text>            // re-read when something it depends on changes
<Text>{label}</Text>                // a plain variable: set once
<View style={{ opacity: busy() ? 0.5 : 1 }} />   // the style object is rebuilt when busy changes
```

변경되는 prop이나 자식은 작은 네이티브 이펙트로, 해당 prop 하나를 설정하거나 해당 자식 하나를 교체합니다. Rust에서는 스타일을 diff하므로, 변경된 스타일은 바뀐 프로퍼티만 전송합니다.

이벤트 핸들러는 한 번만 설정됩니다. Rust에서는 클로저, TSX에서는 함수 또는 이름입니다(`onPress={() => …}`, `onPress={save}`). TSX에서 다른 표현식은 추적됩니다(`onPress={props.onPress}`가 prop을 따라갑니다).

### Props

Rust 컴포넌트의 props는 `#[derive(Props)]` 구조체의 필드이며, 각각 `Prop<T>`입니다. 즉 값이거나 부모가 전달한 바인딩입니다. 바인딩(`text(props.title)`, `move || props.title.get()`) 안에서 읽으면 따라가고, 본문에서 `props.title.get()`를 호출하면 한 번만 읽습니다. `#[prop(default)]` 또는 `#[prop(default = …)]`가 있는 필드와 `Option`는 선택 사항입니다. 생성자는 모든 prop을 기본값으로 시작하고, 부모는 필요한 prop의 setter를 호출합니다: `badge().label("New")`.

변경되는 표현식이 전달된 TSX prop은 getter로 전달됩니다. `props.title`를 읽으면 getter가 호출되며, 이것이 그 prop을 읽는 JSX가 prop을 따라갈 수 있게 합니다. 정적 props는 일반 값입니다. 두 경우 모두 props는 사용되는 곳에서 읽습니다.

```rust tabs
// Wrong: reads the prop once, when the component runs.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    let content = props.text.get();
    text(content)
}

// Right: binds the text to the prop.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    text(props.text)
}
```

```tsx tabs
// Wrong: reads the prop once, when the component runs.
function Title(props: { text: string }) {
  const { text } = props;
  return <Text>{text}</Text>;
}

// Right: reads it in JSX, which follows it.
function Title(props: { text: string }) {
  return <Text>{props.text}</Text>;
}
```

매개변수에서 props를 분해하는 TSX 컴포넌트(`function Title({ text }: …)`)도 마찬가지로 한 번만 읽으며, 빌드는 이에 대해 경고하고 대신 읽어야 할 props를 알려 줍니다.

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

컴포넌트가 처음 시작할 때 쓰는 id처럼 한 번만 필요한 prop은 본문에서 읽으며(`props.id.get_untracked()`, `const { id } = props;`), 이렇게 하면 그 의도가 드러납니다.

TSX에서는 기본값에도 같은 규칙이 적용됩니다. 기본값을 지정하며 분해하는 대신 JSX에서 `props.color ?? "#ddf4ff"`를 작성하세요. props로부터 무언가를 계산하려면 클로저나 [`computed`](./reactivity.md#computed)를 사용하세요.

```rust tabs
#[component]
fn Price(props: PriceProps) -> impl IntoElement {
    let formatted = move || format!("${:.2}", props.cents.get() as f64 / 100.0);
    text(formatted)
}
```

```tsx tabs
function Price(props: { cents: number }) {
  const formatted = () => `$${(props.cents / 100).toFixed(2)}`;
  return <Text>{formatted()}</Text>;
}
```

<a id="children"></a>

### 자식

부모가 컴포넌트 안에 배치한 것은 그 컴포넌트의 자식으로 전달됩니다. Rust에서는 부모가 `.child(..)`로 채우는 `children: Prop<Children>` 필드이고, TSX에서는 `props.children`이며 읽을 때 해당 요소를 만드는 getter입니다.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct CardProps {
    /// The title.
    pub title: Prop<SharedString>,
    /// The content.
    pub children: Prop<Children>,
}

#[component]
pub fn Card(props: CardProps) -> impl IntoElement {
    view()
        .p(px(14.0))
        .rounded(px(12.0))
        .bg(move || theme().background)
        .gap_2()
        .child(text(props.title).font_weight(FontWeight::SEMIBOLD))
        .child(props.children)
}

card()
    .title("Account")
    .child(text(move || format!("Signed in as {}", user.get().name)))
```

```tsx tabs
function Card(props: { title: string; children?: JSX.Element }) {
  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#ffffff", gap: 8 }}>
      <Text style={{ fontWeight: "600" }}>{props.title}</Text>
      {props.children}
    </View>
  );
}

<Card title="Account">
  <Text>Signed in as {user().name}</Text>
</Card>
```

TSX에서는 `props.children`를 읽을 때마다 자식이 다시 만들어지므로(새 네이티브 뷰), 자식이 들어갈 자리에서 한 번만 읽으세요. 여러 자식 중 변경되는 것(`<If>`, `<Each>`, `{cond() ? a : b}`)은 함수로 전달되며, `{props.children}`는 그 자식만 갱신합니다. 형제 요소는 뷰를 그대로 유지하고, 입력 요소는 텍스트와 포커스를 유지합니다. 프래그먼트(`<>…</>`)는 뷰 없이 요소를 묶습니다.

자식은 컴포넌트가 인자와 함께 호출하는 함수, 즉 렌더 콜백으로도 만들 수 있습니다.

```rust tabs
fn repeat<E: IntoElement>(times: usize, row: impl Fn(usize) -> E) -> impl IntoElement {
    view().child((0..times).map(row))
}

repeat(3, |i| text(format!("Row {i}")))
```

```tsx tabs
function Repeat(props: { times: number; children: (i: number) => JSX.Element }) {
  return <View>{Array.from({ length: props.times }, (_, i) => props.children(i))}</View>;
}

<Repeat times={3}>{(i) => <Text>Row {i}</Text>}</Repeat>
```

<a id="control-flow"></a>

## 제어 흐름

Rust의 `when`와 `each`, TSX의 `<If>`와 `<Each>`는 내장 제어 흐름입니다. 자체 뷰는 렌더링하지 않습니다.

```rust tabs
when(move || user.get().is_some(), move || {
    text(move || format!("Hello, {}", user.get().map(|u| u.name).unwrap_or_default()))
})
.otherwise(|| text("Signed out"))

each(todos, |todo| todo.id, |todo, index| {
    text(move || format!("{}. {}", index.get() + 1, todo.get().title))
})
```

```tsx tabs
<If when={user()} else={<Text>Signed out</Text>}>
  {(u) => <Text>Hello, {u().name}</Text>}
</If>

<Each of={todos()} key={(t) => t.id}>
  {(todo, index) => (
    <Text>
      {index() + 1}. {todo().title}
    </Text>
  )}
</Each>
```

- **`when`** / **`<If>`**는 조건이 성립하는 동안 해당 분기를 표시하고, 그렇지 않으면 `otherwise` / `else` 분기를 표시합니다. 조건이 다시 평가될 때마다가 아니라 조건의 성립 여부가 바뀔 때만 분기를 다시 렌더링합니다. TSX에서 함수 자식은 `when` 값의 접근자를 받으며, 이 접근자는 `null`와 `undefined` 없이 타입이 지정됩니다. `u()`는 분기가 표시되는 동안의 user이며, user가 바뀌면 그 변경을 따라갑니다.
- **`each`** / **`<Each>`**는 행 함수가 만든 행을 항목마다 렌더링합니다. 행은 키로 유지됩니다(Rust: 키 함수, TSX: `key`이며 기본값은 항목 자체로, 객체는 동일성, 원시값은 값으로 비교). 리스트가 바뀌면 유지된 행은 다시 만들지 않고 이동하며, 새 키에 대해서만 새 행이 만들어집니다. 행 함수는 항목과 인덱스의 **시그널**(Rust에서는 `todo.get()`와 `index.get()`, TSX에서는 `todo()`과 `index()`)을 받는데, 유지된 행의 항목과 위치가 바뀔 수 있기 때문입니다. TSX에서 `key="index"`(또는 `key={(item, i) => i}`)는 대신 위치로 행을 유지합니다. 스트리밍되는 텍스트처럼 제자리에서 바뀌는 문자열 리스트는 행을 유지하고 `item()`만 바뀝니다.

클로저 안에서 이루어지는 선택(Rust의 `dynamic(move || if busy.get() { … } else { … })`, TSX의 삼항 연산자 또는 `&&`)은 읽는 값이 하나라도 바뀔 때마다 분기를 다시 만듭니다. 분기가 몇 개의 요소보다 클 때는 `when` / `<If>`를 사용하는 것이 좋습니다.

긴 리스트나 무한 리스트에는 [`List`](./lists.md)(Rust에서는 `virtual_list`)를 사용하세요. 화면에 보이는 행에 대해서만 뷰를 만들고 이를 재활용합니다. 자세한 내용은 [제어 흐름](../elements/control-flow.md)을 참고하세요.

## Refs

ref는 명령형 호출을 위해 호스트 요소에 이름을 붙입니다: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()`([뷰의 위치](./touch-and-gestures.md#where-a-view-is-measure)) 등. Rust에서는 `element_ref()`가 ref를 만들고 `.element_ref(&handle)`가 요소에 연결합니다. TSX에서는 `ref`가 요소의 ref를 제공하며, 그 타입은 요소 자체의 타입입니다(여기서는 `InputRef`, `View`의 경우 `ViewRef`. [ref 메서드](../elements/index.md#ref-methods) 참고).

```rust tabs
fn search() -> impl IntoElement {
    let field = element_ref();
    view()
        .child(input().element_ref(&field).placeholder("Search"))
        .child(text("Focus").on_press(move || field.focus()))
}
```

```tsx tabs
import type { InputRef } from "nsh";
import { Text, View } from "nsh";
import { Input } from "nsh/base";

function Search() {
  let input: InputRef | undefined;
  return (
    <View>
      <Input ref={input} placeholder="Search" />
      <View onPress={() => input?.focus()}>
        <Text>Focus</Text>
      </View>
    </View>
  );
}
```

Rust ref는 `Copy` 핸들입니다. 호출은 ref를 가진 요소로 전달되며, 소유자가 사라지면 아무 동작도 하지 않습니다. TSX에서 `ref={…}`가 가리키는 대상은 노드를 받습니다.

- `let`로 선언된 변수에는 노드가 대입됩니다.
- 필드(`ref={refs.input}`, `ref={refs[name]}`)에는 노드가 대입됩니다.
- [시그널](./reactivity.md)에는 노드가 설정되며, 시그널을 읽는 쪽이 이를 따라갑니다.
- 함수는 노드를 인자로 호출됩니다(`<Scroll ref={(node) => (scroller = node)} />`).

`const`나 import는 `const input = signal<InputRef>()`에서 `<Input ref={input} />`와 `input()?.focus()`처럼 시그널이나 함수를 가리켜야 하며, 그 외의 것을 가리키면 요소가 만들어질 때 무엇을 써야 하는지와 함께 보고됩니다.

ref는 요소가 생성될 때, 컴포넌트가 반환되기 전에 설정되므로 [이펙트](./reactivity.md#effect)와 이벤트 핸들러에서 사용할 수 있습니다. 호출은 그보다 먼저 이루어진 변경과 같은 순서로 뷰에 전달됩니다. 기본 컴포넌트와 여러분의 crate에 있는 Rust 컴포넌트도 `ref`를 받습니다(Rust에서는 `component_ref()`이며 `.component_ref(&r)`로 요소에 연결합니다: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## props 펼치기

Rust에서는 부모가 필요한 props의 setter를 호출하고 나머지는 기본값을 유지하며, 래퍼는 자신의 `Prop`를 그대로 전달합니다(`card().title(props.title)`). `Prop`는 전달받은 값을 계속 따라갑니다.

TSX에서는 `{...props}`로 props 객체를 요소나 컴포넌트에 펼칩니다. getter는 getter로 유지되므로, 펼친 props는 읽는 값을 계속 따라갑니다. 일부 props는 자신이 사용하고 나머지는 전달하려면 `split`를 사용하세요.

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function Field(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} {...rest} />
    </View>
  );
}

<Field label="Email" value={email()} onChange={({ value }) => email.set(value)} keyboardType="email-address" />
```

`split(props, keys)`는 `[picked, rest]`를 반환하며, 둘 다 원래의 props를 통해 계속 읽습니다(`{ label, ...rest } = props`를 분해하면 모든 prop을 한 번씩 읽게 됩니다). JSX에서 나중에 오는 요소 props가 앞의 것보다 우선합니다.

`<If>`와 `<Each>`는 펼친 props를 받지 않으며, 펼친 자식(`{...items}`)도 지원되지 않습니다. 대신 `<Each>` 또는 배열 표현식을 사용하세요.

<a id="tags-and-names"></a>

## 태그와 이름

Rust 요소는 코드가 호출하는 무엇이든 될 수 있습니다. 프리미티브의 함수, 컴포넌트의 생성자(`badge()`, `nsh_base::button()`), 또는 직접 작성한 함수입니다. TSX 태그는 평소처럼 스코프 안의 바인딩을 가리킵니다: `<Badge />`, `<Theme.Provider>`, 직접 작성한 `<Button>`. 스코프 안에서 아무것도 가리키지 않는 태그는 전역인 `<If>`와 `<Each>`를 제외하고 빌드 오류입니다.

```rust tabs
/// The app's button: a press target styled by the app.
fn primary_button(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_5()
        .py_3()
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text(title).text_base().font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

primary_button("Save", save)
```

```tsx tabs
import { Text, View } from "nsh";

function Button(props: { title: string; onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} role="button" class="rounded-lg bg-blue-600 px-5 py-3">
      <Text class="text-base font-semibold text-white">{props.title}</Text>
    </View>
  );
}

<Button title="Save" onPress={save} />
```

`nsh_base`의 `Button`(Rust에서는 `button()`, `nsh/base`의 `<Button>`)은 스타일이 없는 누름 대상으로, 비활성화 및 선택 상태와 그에 따른 접근성을 갖추고 있습니다. 외관은 앱이 부여합니다: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

TSX에서는 여러분의 바인딩이 전역보다 우선합니다. 스코프에 `Each`라는 이름의 컴포넌트가 있으면 `<Each>`는 그 컴포넌트가 됩니다. 프리미티브는 import로 인식되므로 `import { View as Box } from "nsh"`는 `<Box>`를 뷰로 만들고, `Text`라는 이름의 직접 작성한 컴포넌트는 그저 여러분의 컴포넌트입니다. 프리미티브도 실제 컴포넌트이므로 `const Tag = inline ? Text : View;` 다음에 `<Tag>…</Tag>`도 동작합니다.

컴포넌트는 자체 선언으로 타입이 지정됩니다. Rust의 props 구조체는 컴파일러가 검사하고, TSX 컴포넌트의 props는 사용되는 모든 곳에서 TypeScript가 검사하며, 따로 생성할 것은 없습니다. TSX 진입점이 import하는 Rust 컴포넌트에는 그 구조체로부터 TypeScript 선언이 생성됩니다.

<a id="mounting-and-the-root"></a>

## 마운트와 루트

Rust 앱의 루트는 `nsh.json`의 `"root"`가 가리키는 컴포넌트이며, `nsh run`와 `nsh package`가 이를 마운트합니다. TSX 진입점은 `mount(App)`를 호출하여 루트 컴포넌트를 렌더링합니다(`mount(App, props)`는 props를 전달합니다). 루트 뷰는 서피스(창, 또는 앱이 NSH를 임베드하는 뷰)를 가득 채웁니다. 루트가 화면을 채우도록 `flex: 1`를 지정하고 배경색도 지정하세요. 서피스 자체의 배경은 플랫폼에 따라 다릅니다.

```rust tabs
// nsh.json: { "rust": ".", "root": "App" }
#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(home())
}
```

```tsx tabs
mount(() => (
  <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <App />
  </View>
));
```
<a id="related"></a>

## 관련 문서

- [Reactivity](./reactivity.md): 시그널, 이펙트, 컨텍스트.
- [Elements](../elements/index.md): 모든 호스트 엘리먼트와 해당 props.
- [Styling](./styling.md) 및 [Tailwind](./tailwind.md): 컴포넌트의 외관.
- [Building with Rust](./rust.md): Rust 앱, 앱 자체 크레이트의 컴포넌트, 그리고 그 위의 TSX.
