---
title: "JSX とコンポーネント"
description: "NSH が Rust と TSX で UI をどのように記述するか(要素、コンポーネント、props、children、制御フロー、refs、スプレッド)、そして JSX コンパイラと Rust のビルダーが同じネイティブ要素をどのように生成するかを説明します。"
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX とコンポーネント

NSH アプリは、Rust または TSX で、要素とコンポーネントを使って UI を記述します。Rust では関数と型付きのビルダーメソッド(`view().gap_4().child(..)`)で要素を組み立て、TSX では JSX として記述します。NSH のコンパイラーは JSX を同じネイティブレンダラーの直接呼び出しに変換するため、React も仮想 DOM も使いません。どちらの場合でも、コンポーネントはツリーのうち自分の部分を構築するために一度だけ実行される関数です。その後 UI を最新に保つのは[リアクティビティ](./reactivity.md)です。シグナルを読むバインディングがネイティブに追跡され、それらだけが再実行されます。

<a id="elements"></a>

## 要素

**ホスト要素**は、それぞれネイティブビューに支えられています。Rust ではプレリュードの関数で作成します。TSX では `nsh` からコンポーネントとしてインポートします。インポートが不要なグローバルは `If` と `Each` だけです。

| Rust | TSX | ネイティブビュー | ページ |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: レイアウト、スタイル、タッチのためのボックス | [View](../elements/view.md) |
| `text(..)` | `<Text>` | ネイティブのテキストビュー。ネストしたテキスト要素はスパンになります | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | 画像ビュー(ローカルアセットと URL) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | 仮想化されたリサイクル式のリスト | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | 描画、Web ページ、ビデオプレーヤー | [要素](../elements/index.md) |
| `nsh_base::dialog()` | `nsh/base` の `<Dialog>` | 表示されるレイヤー | [要素](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | 制御フロー。独自のビューは持ちません | [制御フロー](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

Rust では、スタイルは Tailwind のユーティリティと同じ名前の型付きメソッド(`.px_4()`、`.rounded_lg()`、`.bg(..)`)で指定し、リスナーもメソッド(`.on_press(..)`)です。プラットフォーム固有の設定には専用のメソッドがあります。TSX では、props は camelCase の名前のままです(`onPress`、`allowFontScaling`、`backgroundColor`)。すべての要素が `style`、`class` / `classList`([Tailwind](./tailwind.md))、`ref`、タッチハンドラー、アクセシビリティ props、`testID` を受け取ります。プラットフォーム固有の props は `ios={{…}}` と `android={{…}}` に渡し、現在のプラットフォームのオブジェクトだけが送られます。

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

TSX のタグが PascalCase なのは、TypeScript が各タグを、それが指すバインディングに対して型チェックできるようにするためです。小文字のタグは名前ごとに 1 つのグローバル型に対してチェックされるため、`List` や `Each` のようなジェネリックコンポーネントは `each` / `of` から行の型を推論できず、アプリ独自のコンポーネントには型がまったく付かなくなります。インポートに実行時のコストはありません。コンパイラーはインポート(エイリアスも含む)を通じてプリミティブを認識し、ネイティブ要素をその場で生成します。そのため `<View>` はレンダラーの直接呼び出しになり、インポートはバンドルから取り除かれます。小文字のタグはビルドエラーになり、何を書くべきかが示されます。

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> テキストはテキスト要素の内側でのみ表示されます。Rust では `text(..)`、TSX では `<Text>` です。`<View>` の直下に置いた文字列はネイティブビューを作成せず、表示されません。

<a id="components"></a>

## コンポーネント

アプリの見た目はアプリ自身のものです。NSH は 2 つのレイヤーを提供します。1 つはプリミティブ(上記の要素、スタイル、Tailwind クラス)、もう 1 つは [`nsh/base`](../modules/nsh-base.md)(Rust では `nsh_base`)のスタイルなしのベースコンポーネントで、ナビゲーション、ダイアログ、キーボード、ステータスバー、セーフエリアといった動作を担います。3 つ目のレイヤーであるコンポーネントライブラリはあなたのものです。ボタン、カード、その他 UI のあらゆる部品は、この 2 つのレイヤーの上に、アプリのクレート([Rust でのビルド](./rust.md))または TSX で自分で書くコンポーネントか、コミュニティのライブラリです([3 つのレイヤー](./architecture.md#three-layers))。

Rust のコンポーネントは、props 構造体(イベントがある場合は、それを発行するための `Scope`)を受け取り、要素を返す `#[component] fn` です。`#[component]` はコンストラクターも生成します。名前は関数名のスネークケースで、`Badge` は `badge()` で配置します。これは `view()` でビューを配置するのと同じで、各 prop に対するセッター(`.label(..)`、`.color(..)`: 値、シグナル、またはクロージャー)を持ちます。TSX のコンポーネントは、props オブジェクトを受け取って JSX を返す関数です。

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

関数はコンポーネントの作成時に**一度だけ**実行され、読み取ったものを追跡しません。再レンダリングはありません。本体のコード(シグナルの作成、エフェクトの開始、定数の計算)は一度だけ実行されます。返される要素は、読み取る props とシグナルに接続されたままです。そのため上の `Badge` は、`unread` が変わるたびに、`Badge` を再実行することなくテキストを更新します。

UI に独自の props やイベントがある場合、または TSX のエントリがインポートする場合は、`#[component]` を書きます。Rust のコンポーネントはその型(`registry.register::<Badge>()`)で登録され、props は構造体から型付けされます([Rust でのビルド](./rust.md#extending-a-rust-app-with-tsx))。Rust でしか使わない UI の部品であれば、`impl IntoElement` を返す通常の関数で十分で、その引数が props になります。TSX では、コンポーネントは要素、文字列または数値、配列、`null`、またはこれらのいずれかを返す関数(レンダラーが追跡します)を返せます。`nsh` の `Component<P>` 型がこれらを表します。

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

### 再実行されるもの

要素に渡された値は一度だけ設定されます。バインディングは、読み取ったものを追跡します。Rust では、バインディングは値を渡す場所に与えるクロージャー(またはシグナル、メモ、prop)です。TSX では、コンパイラーが JSX 内の式ごとに判断します。式が**関数を呼び出すか、プロパティを読み取る**場合(ネストした関数の外側で)、その式は変化するものとして扱われ、それ以外はすべて一度だけ設定されます。

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

変化する prop や子は小さなネイティブエフェクトとなり、その 1 つの prop を設定するか、その 1 つの子を置き換えます。Rust ではスタイルの差分が取られるため、変化したスタイルは変更されたプロパティだけを送ります。

イベントハンドラーは一度だけ設定されます。Rust ではクロージャー、TSX では関数または名前です(`onPress={() => …}`、`onPress={save}`)。TSX では、それ以外の式は追跡されます(`onPress={props.onPress}` は prop を追跡します)。

### Props

Rust のコンポーネントの props は、`#[derive(Props)]` 構造体のフィールドで、それぞれが `Prop<T>` です。値、または親が渡したバインディングになります。バインディング(`text(props.title)`、`move || props.title.get()`)内で読み取ると追跡され、本体で `props.title.get()` を使うと一度だけ読み取られます。`#[prop(default)]` または `#[prop(default = …)]` を持つフィールドと `Option` は省略可能です。コンストラクターはすべての prop をデフォルト値から始め、親は必要なものだけセッターを呼び出します。`badge().label("New")`。

TSX では、変化する式が渡された prop はゲッターとして渡されます。`props.title` を読み取るとそれが呼び出され、これによってそれを読む JSX が追跡できます。静的な props は単なる値です。どちらの場合も、props は使う場所で読み取ります。

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

TSX のコンポーネントがパラメーターで props を分解する場合(`function Title({ text }: …)`)、同様に一度だけ読み取られます。ビルドはこれを警告し、代わりに読み取るべき props を示します。

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

コンポーネントが一度だけ必要とする prop、たとえば初期値として使う id は、本体で読み取ります(`props.id.get_untracked()`、`const { id } = props;`)。こうすることで、それが意図的であることが明示されます。

TSX ではデフォルト値にも同じことが当てはまります。デフォルト値付きで分解するのではなく、JSX 内に `props.color ?? "#ddf4ff"` と書いてください。props から何かを計算するには、クロージャーまたは [`computed`](./reactivity.md#computed) を使います。

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

### 子要素

親がコンポーネントの中に配置したものは、そのコンポーネントの子として渡されます。Rust では `children: Prop<Children>` フィールドで、親が `.child(..)` で埋めます。TSX では `props.children` で、読み取られたときにそれらの要素を構築するゲッターです。

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

TSX では、`props.children` を読み取るたびに子が再び構築されます(新しいネイティブビューになります)。子を配置する場所で、一度だけ読み取ってください。複数の子のうち変化するもの(`<If>`、`<Each>`、`{cond() ? a : b}`)は関数として渡され、`{props.children}` はその 1 つだけを更新します。兄弟要素はビューを保持し、入力欄はテキストとフォーカスを保持します。フラグメント(`<>…</>`)は、ビューを持たずに要素をグループ化します。

子は、コンポーネントが引数を付けて呼び出す関数、つまりレンダーコールバックでも作成できます。

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

## 制御フロー

Rust の `when` と `each`、TSX の `<If>` と `<Each>` は組み込みの制御フローです。独自のビューはレンダリングしません。

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

- **`when`** / **`<If>`** は、条件が成り立つ間はそのブランチを表示し、そうでなければ `otherwise` / `else` のブランチを表示します。ブランチが再レンダリングされるのは、条件が成り立つかどうかが変わったときだけで、条件が再評価されるたびではありません。TSX では、関数の子は `when` の値のアクセサーを受け取ります。その型は `null` と `undefined` を除いたもので、`u()` はブランチが表示されている間のユーザーであり、変化に追従します。
- **`each`** / **`<Each>`** は、行関数で作られる項目ごとの行をレンダリングします。行はキーで保持されます(Rust ではキー関数、TSX では `key`、デフォルトは項目自体で、オブジェクトは同一性、プリミティブは値で判定されます)。リストが変化すると、保持された行は再構築されずに移動され、新しい行は新しいキーに対してのみ作られます。行関数は、項目とそのインデックスの**シグナル**を受け取ります(Rust では `todo.get()` と `index.get()`、TSX では `todo()` と `index()`)。保持された行の項目と位置は変わりうるためです。TSX では、`key="index"`(または `key={(item, i) => i}`)を使うと、行を代わりに位置で保持します。ストリーミングされるテキストのように、その場で変化する文字列のリストでは、行は保持され、その `item()` だけが変わります。

クロージャー内で行った選択(Rust の `dynamic(move || if busy.get() { … } else { … })`、TSX の三項演算子または `&&`)は、読み取るものが何か変わるたびにそのブランチを再構築します。ブランチが数個を超える要素で構成される場合は、`when` / `<If>` を使ってください。

長いリストや無限リストには、[`List`](./lists.md)(Rust では `virtual_list`)を使います。画面上の行に対してのみビューを作成し、それらをリサイクルします。詳細は[制御フロー](../elements/control-flow.md)を参照してください。

## Refs

ref は、命令的な呼び出しのためにホスト要素に名前を付けます。`focus()`、`blur()`、`scroll_to()` / `scrollTo()`、`scroll_to_index()` / `scrollToIndex()`、`measure()`([ビューの位置](./touch-and-gestures.md#where-a-view-is-measure))などです。Rust では `element_ref()` で作成し、`.element_ref(&handle)` で要素に付けます。TSX では `ref` が要素の ref を与え、その型は要素自身の型です(ここでは `InputRef`、`View` では `ViewRef`。[ref メソッド](../elements/index.md#ref-methods)を参照)。

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

Rust の ref は `Copy` ハンドルです。その呼び出しは ref を持つ要素に送られ、所有者がなくなった後は何も行いません。TSX では、`ref={…}` が指すものがノードを受け取ります。

- `let` で宣言された変数には、ノードが代入されます。
- フィールド(`ref={refs.input}`、`ref={refs[name]}`)には、ノードが代入されます。
- [シグナル](./reactivity.md)には、ノードが設定され、そのシグナルを読むものがそれに追従します。
- 関数は、ノードを引数として呼び出されます(`<Scroll ref={(node) => (scroller = node)} />`)。

`const` やインポートはシグナルまたは関数を保持します。たとえば `<Input ref={input} />` と `input()?.focus()` を伴う `const input = signal<InputRef>()` のようにです。それ以外のものを保持している場合は、要素の作成時に報告され、何を書くべきかが示されます。

ref は、コンポーネントが返る前、要素の作成時に設定されるため、[エフェクト](./reactivity.md#effect)やイベントハンドラーで利用できます。呼び出しは、それ以前に行われた変更とともに、順番にビューへ送られます。ベースコンポーネントと、自分のクレートの Rust コンポーネントも `ref` を受け付けます(Rust では `component_ref()` で、`.component_ref(&r)` により要素に付けます: `dialog().component_ref(&r)`)。

<a id="spreading-props"></a>

## props のスプレッド

Rust では、親は必要な props のセッターを呼び出し、残りはデフォルトのままになります。ラッパーは自身の `Prop` をそのまま渡します(`card().title(props.title)`)。`Prop` は、与えられたものに追従し続けます。

TSX では、props のオブジェクトを `{...props}` で要素またはコンポーネントにスプレッドします。ゲッターはゲッターのままなので、スプレッドされた props も読み取るものに追従し続けます。一部の props を自分で使い、残りを渡すには、`split` を使います。

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

`split(props, keys)` は `[picked, rest]` を返し、どちらも元の props を通じて読み取ります(`{ label, ...rest } = props` を分解すると、すべての prop が一度ずつ読み取られてしまいます)。JSX 内で後に書かれた要素の props が、先のものより優先されます。

`<If>` と `<Each>` はスプレッド props を受け付けません。スプレッドされた子(`{...items}`)もサポートされていません。`<Each>` または配列式を使ってください。

<a id="tags-and-names"></a>

## タグと名前

Rust の要素は、コードが呼び出すものすべてです。プリミティブの関数、コンポーネントのコンストラクター(`badge()`、`nsh_base::button()`)、または自分で書いた関数です。TSX のタグは、通常どおりスコープ内のバインディングを指します。`<Badge />`、`<Theme.Provider>`、自分で書いた `<Button>` などです。スコープ内の何も指さないタグはビルドエラーになりますが、グローバルである `<If>` と `<Each>` は例外です。

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

`nsh_base` の `Button`(Rust では `button()`、`nsh/base` の `<Button>`)は、スタイルのない押下ターゲットで、無効状態と選択状態、およびそれらのアクセシビリティを備えています。見た目はアプリが与えます: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`。

TSX では、自分のバインディングがグローバルより優先されます。スコープ内に `Each` という名前のコンポーネントがあれば、`<Each>` はそのコンポーネントになります。プリミティブはインポートによって認識されるため、`import { View as Box } from "nsh"` とすると `<Box>` はビューになり、`Text` という名前の自作コンポーネントは単なる自作コンポーネントです。プリミティブも本物のコンポーネントです。`const Tag = inline ? Text : View;` とした後で `<Tag>…</Tag>` と書いても動作します。

コンポーネントは、それ自身の宣言によって型付けされます。Rust の props 構造体はコンパイラーがチェックし、TSX コンポーネントの props は使用される場所で TypeScript がチェックします。生成するものは何もありません。TSX のエントリがインポートする Rust コンポーネントには、その構造体から TypeScript の宣言が生成されます。

<a id="mounting-and-the-root"></a>

## マウントとルート

Rust アプリのルートは、`nsh.json` の `"root"` が指すコンポーネントで、`nsh run` と `nsh package` がそれをマウントします。TSX のエントリは、`mount(App)` を呼び出してルートコンポーネントをレンダリングします(`mount(App, props)` は props を渡します)。ルートビューはサーフェス(ウィンドウ、または NSH を埋め込むアプリのビュー)全体を占めます。ルートには、画面全体を占めるよう `flex: 1` と背景色を指定してください。サーフェス自体の背景はプラットフォームによって異なります。

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

## 関連項目

- [Reactivity](./reactivity.md): シグナル、エフェクト、コンテキスト。
- [Elements](../elements/index.md): すべてのホスト要素とそのprops。
- [Styling](./styling.md) と [Tailwind](./tailwind.md): コンポーネントの見た目。
- [Building with Rust](./rust.md): Rustアプリ、アプリ自身のcrate内のコンポーネント、その上のTSX。
