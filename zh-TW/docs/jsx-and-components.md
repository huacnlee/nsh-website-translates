---
title: "JSX 與元件"
description: "說明 NSH 如何以 Rust 與 TSX 描述 UI,包括元素、元件、props、children、控制流程、refs 與展開語法,以及 JSX 編譯器與 Rust 的 builders 如何產生相同的原生元素。"
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX 與元件

NSH 應用程式以元素（element）和元件（component）描述 UI，可使用 Rust 或 TSX。Rust 以函式和具型別的 builder 方法建構元素（`view().gap_4().child(..)`）；TSX 則把元素寫成 JSX，再由 NSH 的編譯器轉成對同一個原生 renderer 的直接呼叫，不使用 React，也沒有 virtual DOM。無論採用哪種方式，元件都是只執行一次、用來建構其所屬樹狀結構部分的函式。之後讓 UI 保持最新的是[響應式](./reactivity.md)：讀取 signal 的綁定會由原生層追蹤，只有這些綁定會再次執行。

<a id="elements"></a>

## 元素

**宿主元素（host elements）**各由一個原生檢視支撐。Rust 以 prelude 的函式建立它們；TSX 則從 `nsh` 以元件的形式匯入，只有 `If` 和 `Each` 是不需匯入的全域變數：

| Rust | TSX | 原生檢視 | 頁面 |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`：用於版面配置、樣式與觸控的容器 | [View](../elements/view.md) |
| `text(..)` | `<Text>` | 原生文字檢視；巢狀的文字元素為 span | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | 圖片檢視（本機資源與 URL） | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | 虛擬化且會回收項目的列表 | [List](../elements/list.md) |
| `canvas(..)`、`web_view(url)`、`video(url)` | `<Canvas>`、`<WebView>`、`<Video>` | 繪圖、網頁、影片播放器 | [元素](../elements/index.md) |
| `nsh_base::dialog()` | 從 `nsh/base` 匯入的 `<Dialog>` | 被呈現的圖層 | [元素](../elements/index.md) |
| `when(..)`、`each(..)` | `<If>`、`<Each>` | 控制流程，本身沒有檢視 | [控制流程](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

在 Rust 中，樣式是具型別的方法，命名方式與 Tailwind 的 utility 相同（`.px_4()`、`.rounded_lg()`、`.bg(..)`），
監聽器也是方法（`.on_press(..)`）；僅限特定平台的設定則有各自的方法。在 TSX 中，props 保留
camelCase 名稱（`onPress`、`allowFontScaling`、`backgroundColor`）；每個元素都接受 `style`、`class` /
`classList`（[Tailwind](./tailwind.md)）、`ref`、觸控處理器、無障礙 props 以及 `testID`，
僅限特定平台的 props 則放在 `ios={{…}}` 和 `android={{…}}` 中，只有目前平台的物件會被送出：

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

TSX 標籤使用 PascalCase，是為了讓 TypeScript 能針對每個標籤所指名的 binding 進行檢查：小寫標籤只會依每個名稱對應的單一全域型別檢查，因此像 `List` 或 `Each` 這類泛型元件就無法從 `each` / `of` 推斷其資料列的型別，應用程式自己的元件也完全不會有型別。這些 import 在執行時沒有任何成本：編譯器會透過 import 辨識這些 primitive（別名也可以），並就地建立原生元素，因此 `<View>` 就是對 renderer 的直接呼叫，而該 import 會從 bundle 中移除。使用小寫標籤會造成建置錯誤，並說明應該改寫成什麼：

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> 文字只會顯示在文字元素內：Rust 中是 `text(..)`，TSX 中是 `<Text>`。直接放在 `<View>` 內的字串不會建立原生檢視，也不會顯示。

<a id="components"></a>

## 元件

應用程式的外觀由應用程式自己決定。NSH 提供兩個層級：primitive（上述元素、樣式、Tailwind class）以及 [`nsh/base`](../modules/nsh-base.md)（Rust 中為 `nsh_base`）中無樣式的基礎元件，後者負責導覽、對話框、鍵盤、狀態列與安全區域等行為。第三層，也就是元件庫，則屬於你：按鈕、卡片以及 UI 中的其他每個部分，都是你在這兩個層級之上，於應用程式的 crate（[以 Rust 建構](./rust.md)）或 TSX 中撰寫的元件，也可以使用社群提供的函式庫（[三個層級](./architecture.md#three-layers)）。

Rust 元件是一個 `#[component] fn`，接收其 props struct（若有事件，還會接收用於發出事件的 `Scope`），並回傳其元素。`#[component]` 同時會產生它的建構函式，名稱為該函式名稱的 snake case：`Badge` 以 `badge()` 放置，就像 `view()` 放置檢視一樣，每個 prop 都有一個 setter（`.label(..)`、`.color(..)`：可接受值、signal 或 closure）。TSX 元件則是接收 props 物件並回傳 JSX 的函式：

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

這個函式在元件建立時只會執行**一次**，而且不會追蹤它所讀取的內容：沒有重新渲染。函式主體中的程式碼（建立 signal、啟動 effect、計算常數）只會執行一次。它回傳的元素會持續與其讀取的 props 和 signal 保持連動，因此上面的 `Badge` 會在 `unread` 變更時更新其文字，而不需要再次執行 `Badge`。

當 UI 有自己的 props 或事件，或是 TSX 進入點要匯入它時，請撰寫 `#[component]`：Rust 元件會以其型別（`registry.register::<Badge>()`）註冊，props 的型別來自該 struct（[以 Rust 建構](./rust.md#extending-a-rust-app-with-tsx)）。如果只是僅供 Rust 使用的一小塊 UI，回傳 `impl IntoElement` 的一般函式就已足夠，其引數即為 props。在 TSX 中，元件可以回傳元素、字串或數字、陣列、`null`，或是回傳上述任一種的函式（renderer 會追蹤它）；來自 `nsh` 的 `Component<P>` 型別可描述這些回傳值：

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

### 重新執行的內容

提供給元素的值只會設定一次；binding 則會追蹤它所讀取的內容。在 Rust 中，binding 是放在值的位置上的 closure（或 signal、memo、prop）。在 TSX 中，編譯器會針對 JSX 中的每個運算式做判斷：運算式只要（在巢狀函式之外）**呼叫了函式或讀取了屬性**，就會隨之變更，其餘都只設定一次：

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

會變更的 prop 或子元素是一個小型的原生 effect，只會設定那一個 prop，或只替換那一個子元素。Rust 中的樣式會做差異比對，所以有變更的樣式只會送出改變的屬性。

事件處理器只會設定一次：Rust 中是 closure，TSX 中是函式或名稱（`onPress={() => …}`、`onPress={save}`）。在 TSX 中，其他運算式則會被追蹤（`onPress={props.onPress}` 會追蹤該 prop）。

### Props

Rust 元件的 props 是其 `#[derive(Props)]` struct 的欄位，每個欄位都是 `Prop<T>`：可以是一個值，也可以是父元件傳入的 binding。在 binding 中讀取它（`text(props.title)`、`move || props.title.get()`）即可追蹤它；在函式主體中使用 `props.title.get()` 則只會讀取一次。帶有 `#[prop(default)]` 或 `#[prop(default = …)]` 的欄位，以及 `Option`，皆為選用。建構函式會讓每個 prop 從預設值開始，父元件只需呼叫它所需的 setter：`badge().label("New")`。

在 TSX 中，被指定為會變更之運算式的 prop，會以 getter 的形式傳入：讀取 `props.title` 就會呼叫它，這使得讀取它的 JSX 能夠追蹤它。靜態 props 則是一般的值。無論哪種情況，props 都應在使用它們的地方讀取：

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

如果 TSX 元件在參數中就拆解 props，即 `function Title({ text }: …)`，也同樣只會讀取一次，建置時會發出警告，並指出應改為讀取的 props：

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

如果元件只需要某個 prop 一次，例如作為起始值的 id，則在函式主體中讀取它（`props.id.get_untracked()`、`const { id } = props;`），這樣的寫法就明確表達了這一點。

在 TSX 中，預設值也適用同樣的規則：請在 JSX 中寫 `props.color ?? "#ddf4ff"`，而不要在解構時指定預設值。若要從 props 計算出某些內容，請使用 closure 或 [`computed`](./reactivity.md#computed)：

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

### Children

父元件放進元件內的內容會以 children 的形式傳入：在 Rust 中是 `children: Prop<Children>` 欄位，由父元件以 `.child(..)` 填入；在 TSX 中是 `props.children`，一個在被讀取時才建構這些元素的 getter：

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

在 TSX 中，每次讀取 `props.children` 都會重新建構子元素（產生新的原生檢視）：請只讀取一次，並且在放置子元素的位置讀取。在多個子元素中，會變更的那一個（`<If>`、`<Each>`、`{cond() ? a : b}`）會以函式的形式傳入，`{props.children}` 只會更新該子元素：它的同層元素會保留各自的檢視，輸入框也會保留其文字與焦點。Fragment（`<>…</>`）可以將元素分組而不產生檢視。

子元素也可以由元件以引數呼叫的函式產生，也就是 render callback：

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

## 控制流程

Rust 中的 `when` 和 `each`，以及 TSX 中的 `<If>` 和 `<Each>`，是內建的控制流程。它們本身不會渲染任何檢視。

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

- **`when`** / **`<If>`** 在條件成立時顯示其分支，否則顯示 `otherwise` / `else` 分支。只有在「條件是否成立」這件事改變時，它才會重新渲染分支，而不是每次條件重新求值時都渲染。在 TSX 中，函式型的子元素會取得 `when` 之值的 accessor，其型別不含 `null` 和 `undefined`：在該分支顯示期間，`u()` 就是該使用者，並會在使用者變更時跟著更新。
- **`each`** / **`<Each>`** 為每個項目渲染一列，由其 row 函式建立。各列以 key 保留（Rust：key 函式；TSX：`key`，預設為項目本身，物件以參照比對，原始型別以值比對）：列表變更時，保留下來的列會被移動而不是重建，只有新的 key 才會建立新的列。row 函式接收的是項目及其索引的 **signal**（Rust 中的 `todo.get()` 和 `index.get()`，TSX 中的 `todo()` 和 `index()`），因為保留下來的列，其項目與位置都可能改變。在 TSX 中，`key="index"`（或 `key={(item, i) => i}`）則改為以位置保留各列：在原處變更的字串列表，例如串流進來的文字，會保留其各列，只有它們的 `item()` 會改變。

在 closure 中做出的選擇（Rust 中的 `dynamic(move || if busy.get() { … } else { … })`，TSX 中的三元運算式或 `&&`），每當它讀取的任何內容改變時，都會重新建構其分支。當分支超過少數幾個元素時，建議優先使用 `when` / `<If>`。

對於很長或無限的列表，請使用 [`List`](./lists.md)（Rust 中為 `virtual_list`）：它只會為畫面上的列建立檢視，並回收這些檢視。詳情請參閱[控制流程](../elements/control-flow.md)。

## Refs

ref 用來指名宿主元素，以進行命令式呼叫：`focus()`、`blur()`、`scroll_to()` / `scrollTo()`、`scroll_to_index()` / `scrollToIndex()`、`measure()`（[檢視所在位置](./touch-and-gestures.md#where-a-view-is-measure)）等。在 Rust 中，`element_ref()` 會建立一個 ref，`.element_ref(&handle)` 則把它放到元素上；在 TSX 中，`ref` 會給你該元素的 ref，其型別就是該元素自己的型別（這裡是 `InputRef`，`View` 則是 `ViewRef`；請參閱 [ref 方法](../elements/index.md#ref-methods)）：

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

Rust 的 ref 是一個 `Copy` handle；對它的呼叫會送到攜帶它的元素，而在其擁有者消失後則不會有任何作用。在 TSX 中，`ref={…}` 所指名的對象會接收到該節點：

- 以 `let` 宣告的變數會被指派該節點；
- 欄位（`ref={refs.input}`、`ref={refs[name]}`）會被指派該節點；
- [signal](./reactivity.md) 會被設為該節點，因此讀取該 signal 的內容會跟著更新；
- 函式會以該節點作為引數被呼叫（`<Scroll ref={(node) => (scroller = node)} />`）。

`const` 或 import 所持有的是 signal 或函式，如 `const input = signal<InputRef>()` 搭配 `<Input ref={input} />` 和 `input()?.focus()`；持有其他任何東西時，會在建立元素時回報，並說明應該怎麼寫。

ref 在元素建立時、元件回傳之前就會設定，因此可在 [effects](./reactivity.md#effect) 和事件處理器中使用。呼叫會與在它之前所做的變更依序送到檢視。基礎元件以及你自己 crate 中的 Rust 元件也接受 `ref`（在 Rust 中為 `component_ref()`，以 `.component_ref(&r)` 放到元素上：`dialog().component_ref(&r)`）。

<a id="spreading-props"></a>

## 展開 props

在 Rust 中，父元件會呼叫它所需 props 的 setter，其餘維持預設值，而包裝元件會原樣傳遞自己的 `Prop`（`card().title(props.title)`）：`Prop` 會持續追蹤它被給予的內容。

在 TSX 中，可以用 `{...props}` 把 props 物件展開到元素或元件上。getter 仍然是 getter，所以展開的 props 會持續追蹤它們所讀取的內容。若要自己取用部分 props 並將其餘的傳遞下去，請使用 `split`：

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

`split(props, keys)` 回傳 `[picked, rest]`，兩者仍會透過原本的 props 讀取（若解構 `{ label, ...rest } = props`，則會把每個 prop 都讀取一次）。在 JSX 中位置較後面的元素 props，會覆蓋較前面的。

`<If>` 和 `<Each>` 不接受展開的 props，也不支援展開 children（`{...items}`）：請改用 `<Each>` 或陣列運算式。

<a id="tags-and-names"></a>

## 標籤與名稱

Rust 元素就是程式碼所呼叫的對象：primitive 的函式、元件的建構函式（`badge()`、`nsh_base::button()`），或是你自己的函式。TSX 標籤則和平常一樣，指名作用域內的某個 binding：`<Badge />`、`<Theme.Provider>`，或是你自己的 `<Button>`。指名了作用域內不存在之對象的標籤會造成建置錯誤，但 `<If>` 和 `<Each>` 例外，它們是全域變數。

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

`nsh_base` 的 `Button`（Rust 中為 `button()`，TSX 中為從 `nsh/base` 匯入的 `<Button>`）是無樣式的按壓目標，具備停用與選取狀態及其無障礙支援；外觀由應用程式自行賦予：`button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`。

在 TSX 中，你自己的 binding 優先於全域變數：作用域內若有名為 `Each` 的元件，`<Each>` 就是該元件。primitive 是透過其 import 被辨識的，因此 `import { View as Box } from "nsh"` 會讓 `<Box>` 成為檢視，而你自己名為 `Text` 的元件就只是你的元件。primitive 也是真正的元件：`const Tag = inline ? Text : View;` 然後 `<Tag>…</Tag>` 同樣可行。

元件的型別由其自身的宣告決定：Rust 的 props struct 由編譯器檢查，TypeScript 則在每個使用處檢查 TSX 元件的 props，不需要產生任何東西。TSX 進入點所匯入的 Rust 元件，會從其 struct 產生 TypeScript 宣告。

<a id="mounting-and-the-root"></a>

## 掛載與根元件

Rust 應用程式的根是 `nsh.json` 的 `"root"` 所指名的元件；`nsh run` 和 `nsh package` 會掛載它。TSX 進入點則呼叫 `mount(App)` 來渲染根元件（`mount(App, props)` 會傳入 props）。根檢視會填滿整個 surface（視窗，或應用程式嵌入 NSH 的檢視）。請為根元素設定 `flex: 1` 使其填滿螢幕，並設定背景色：surface 本身的背景取決於平台。

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

## 相關資源

- [Reactivity](./reactivity.md)：signals、effects、context。
- [Elements](../elements/index.md)：所有 host element 及其 props。
- [Styling](./styling.md) 與 [Tailwind](./tailwind.md)：元件的外觀樣式。
- [Building with Rust](./rust.md)：Rust 應用程式、位於應用程式自有 crate 中的元件，以及疊加其上的 TSX。
