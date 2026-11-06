---
title: "If / Each"
description: "流程控制:If 會根據條件渲染分支,Each 會為列表中的每個項目渲染一個帶 key 的列,支援 Rust 與 TSX。"
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---


# If / Each

`If` 和 `Each` 決定哪些元素存在：條件內容和重複內容。它們本身不會產生原生 view。
原生渲染器只更新有變化的部分：條件翻轉時，`If` 會切換分支；`Each` 按 key 新增、移動和移除列，而不是重建整個列表。Rust 在 `nsh_core::prelude` 中提供 `when(..)`、`each(..)` 和 `dynamic(..)`；TSX 提供 `<If>` 和 `<Each>`，它們是全域變數，無需 import。

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

在 TSX 中它們是全域變數（作用域內同名的綁定會取代它們）。在 JSX 表達式內，你仍然可以使用普通 JavaScript（`cond ? a : b`、`items.map(…)`），在 Rust 中則可使用 `dynamic(move || ..)`：這些寫法會在其讀取的內容每次改變時重新建立其元素，而 `If` 和 `Each`（Rust 中為 `when` 和 `each`）則會保留沒有變動的元素。

## If

條件成立時渲染其分支，否則渲染另一個分支（或不渲染任何內容）。

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | 條件：在 Rust 中可以是值、signal 或 closure；在 TSX 中則按其真值判斷。 |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | `when` 不成立時渲染的內容。 |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | `when` 成立時渲染的內容。在 TSX 中，函式會收到 `when` 的值的 accessor。 |

條件翻轉到某個分支時，該分支才會建立；翻轉離開時，它所建立的內容會被移除。TSX 的 `when` 如果由一個真值變為另一個真值（例如 `user()` 由一個物件變為另一個物件），會保留該分支，其中的表達式會自行更新。

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

在 TSX 中，函式子項會讀取 `when` 提供的值，其類型中不含 `null` 或 `undefined`，因此分支不需要 `!`。在 Rust 中，分支可以自行讀取 signal，或由 `dynamic` 將該值映射為元素：

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

為列表中的每個項目渲染一列。

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | 項目：在 Rust 中可以是 `Vec`、其 signal 或返回它的 closure。`null` 和 `undefined` 不會渲染任何內容。 |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | 項目的識別依據。TSX 的預設值為項目本身（物件按引用識別，原始值按值識別）。 |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | 渲染單一列。 |

列函式取得的是 **accessor**，而不是值：在 TSX 中呼叫 `item()` 和 `index()`，在 Rust 中呼叫 `item.get()` 和 `index.get()`（兩者都是 `ReadSignal`）。項目改變時，key 仍然存在的列會被保留（位置改變時會被移動）；它們的 item 和 index 會更新，只有讀取它們的表達式會重新執行。新的 key 會建立新的列；key 已不存在的列會被移除。

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

### 選擇 key

- 每次更新都以新物件取代項目的情況（不可變更新、`{ ...t, done: true }`）需要設定 `key`，通常使用 id。
  否則每個新物件都會被視為新的一列，其元素會重新建立。Rust 一律需要提供 key。
- 在 TSX 中，字串或數字陣列無需 key 也能運作：它們按值比較。
- 每一列都有自己的 owner：在列中建立的 effect 和 cleanup 會在該列被移除時結束。

> [!NOTE]
> `Each` 和 `each` 是泛型：TypeScript 會從 `of` 推斷項目類型，Rust 則從項目推斷，因此列的 `todo()` 和 `key` 參數無需標註即可獲得類型。

<a id="each-or-a-list"></a>

## Each 還是 list

`Each` 會建立每一列。對於數十個或數百個項目，在 view 或 [scroll view](./scroll.md) 中使用是合適的。
對於很長或沒有上限的資料，請使用 [list](./list.md)：它只會為視口附近的列建立內容，並回收重用。

有關表達式如何更新，請參閱 [JSX 與元件](../docs/jsx-and-components.md)和[響應式](../docs/reactivity.md)。
