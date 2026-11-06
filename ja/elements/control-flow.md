---
title: "If / Each"
description: "制御フロー: If は条件に応じてブランチを描画し、Each はリストの各項目に対してキー付きの行を描画します。Rust と TSX の両方に対応しています。"
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` と `Each` は、どの要素を存在させるかを決めます。条件付きコンテンツと繰り返しコンテンツを扱い、それ自体はネイティブビューを作りません。
ネイティブレンダラーは変更された部分だけを更新します。`If` は条件が切り替わると分岐を差し替え、`Each` はリストを再構築せず、キーに基づいて行の追加、移動、削除を行います。Rust では
`nsh_core::prelude` に `when(..)`、`each(..)`、`dynamic(..)` があり、TSX ではインポート不要のグローバルである `<If>` と `<Each>` を使います。

```rust tabs
use nsh_core::prelude::*;

view()
    .child(
        when(move || user.with(|u| u.is_some()), move || {
            text(move || format!("Hello, {}", user.with(|u| u.as_ref().map(|u| u.name.clone()).unwrap_or_default())))
        })
        .otherwise(|| text("Signed out")),
    )
    .child(each(todos, |t: &Todo| t.id, |todo, _index| text(move || todo.get().title)))
```

```tsx tabs
<View>
  <If when={user()} else={<Text>Signed out</Text>}>
    {(u) => <Text>Hello, {u().name}</Text>}
  </If>
  <Each of={todos()}>{(todo) => <Text>{todo().title}</Text>}</Each>
</View>
```

TSX ではこれらはグローバルです(スコープ内に同名のバインディングがあれば、そちらが優先されます)。JSX 式の内部では通常の JavaScript(`cond ? a : b`、`items.map(…)`)も使え、Rust では `dynamic(move || ..)` も使えます。ただしこれらは、読み取る値が変わるたびに要素を作り直します。一方、`If` と `Each`(Rust では `when` と `each`)は、残る要素を保持します。

## If

条件が成立している間は一方の分岐をレンダリングし、成立しない間はもう一方の分岐(または何も表示しない状態)にします。

| Prop | Rust | Type | 説明 |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | 条件。Rust では値、シグナル、またはクロージャ。TSX ではその真偽値として評価されます。 |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | `when` が成立しない間レンダリングされます。 |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | `when` が成立している間レンダリングされます。TSX では、関数を渡すと `when` の値のアクセサーが渡されます。 |

分岐は条件がその分岐に切り替わったときに作られ、切り替わって外れると、作られたものは破棄されます。TSX の `when` が真の値から別の真の値へ変わる場合(`user()` があるオブジェクトから別のオブジェクトに変わるなど)は、分岐は保持され、その内部の式が自動的に更新されます。

```rust tabs
let loading = signal(true);

when(move || !loading.get(), || profile())
    .otherwise(|| text("Loading…").text_color(rgb(0x6e7781)))
```

```tsx tabs
const loading = signal(true);

<If when={!loading()} else={<Text style={{ color: "#6e7781" }}>Loading…</Text>}>
  <Profile />
</If>;
```

TSX では、関数の子は `when` が渡した値を読み取ります。その型に `null` や `undefined` は含まれないため、分岐に `!` は不要です。Rust では、分岐がシグナルを直接読み取るか、`dynamic` が値を要素にマッピングします。

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

リストの各アイテムに対して行をレンダリングします。

| Prop | Rust | Type | 説明 |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | アイテム。Rust では `Vec`、そのシグナル、またはそれを返すクロージャ。`null` と `undefined` は何もレンダリングしません。 |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | アイテムの識別子。TSX のデフォルトはアイテム自身です(オブジェクトは参照、プリミティブは値で識別)。 |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | 1 行をレンダリングします。 |

行関数が受け取るのは値ではなく**アクセサー**です。TSX では `item()` と `index()` を、Rust では `item.get()` と `index.get()` を呼び出してください(どちらも `ReadSignal` です)。アイテムが変更されても、キーが残っている行は保持され(位置が変わった場合は移動され)、そのアイテムとインデックスが更新されて、それらを読み取る式だけが再実行されます。新しいキーには新しい行が作られ、キーがなくなった行は削除されます。

```rust tabs
#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    title: String,
    done: bool,
}

let todos = signal(Vec::<Todo>::new());

each(todos, |t: &Todo| t.id, |todo, index| {
    view()
        .flex_row()
        .gap_2()
        .child(text(move || format!("{}.", index.get() + 1)))
        .child(
            text(move || todo.get().title)
                .style_when(move || todo.get().done, |s| s.line_through()),
        )
})
```

```tsx tabs
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

<Each of={todos()} key={(t: Todo) => t.id}>
  {(todo, index) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text>{index() + 1}.</Text>
      <Text style={{ textDecorationLine: todo().done ? "line-through" : "none" }}>{todo().title}</Text>
    </View>
  )}
</Each>;
```

<a id="choosing-a-key"></a>

### キーの選び方

- 更新のたびに新しいオブジェクトに置き換えられるアイテム(イミュータブルな更新、`{ ...t, done: true }`)には、通常は id などの `key` が必要です。
  指定しないと、新しいオブジェクトごとに新しい行となり、その要素が作り直されます。Rust では常にキーを指定します。
- TSX では、文字列や数値の配列はキーなしで動作します。値で比較されるためです。
- 各行は独自のオーナーを持ちます。行の中で作成されたエフェクトとクリーンアップは、その行が削除されると終了します。

> [!NOTE]
> `Each` と `each` はジェネリックです。TypeScript では `of` から、Rust ではアイテムからアイテムの型が推論されるため、行の `todo()` と `key` パラメーターには型注釈が不要です。

<a id="each-or-a-list"></a>

## Each かリストか

`Each` はすべての行を作成します。数十から数百程度のアイテムであれば、ビューや[スクロールビュー](./scroll.md)の中で使っても問題ありません。
長いデータや上限のないデータには、[リスト](./list.md)を使ってください。リストはビューポート付近の行だけを作成し、再利用します。

式がどのように更新されるかについては、[JSX とコンポーネント](../docs/jsx-and-components.md)と[リアクティビティ](../docs/reactivity.md)を参照してください。
