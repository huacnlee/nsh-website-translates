---
title: "If / Each"
description: "控制流程：If 會依據條件渲染對應的分支，Each 會為清單中的每個項目渲染一個具有 key 的列，支援 Rust 與 TSX。"
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` 與 `Each` 決定哪些元素存在：條件式內容與重複內容。它們本身不會產生原生檢視。
原生渲染器只會更新有變動的部分：`If` 會在條件翻轉時切換分支，`Each` 則依 key 新增、移動與移除列，而不是重建整個清單。Rust 在
`nsh_core::prelude` 中提供 `when(..)`、`each(..)` 與 `dynamic(..)`；TSX 提供 `<If>` 與 `<Each>`，它們是全域變數，不需要 import。

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

在 TSX 中它們是全域變數（作用域內同名的繫結會取代它們）。在 JSX 運算式中，你仍可使用純 JavaScript（`cond ? a : b`、`items.map(…)`），在 Rust 中則可使用 `dynamic(move || ..)`：這些方式在所讀取的內容每次變動時，都會重新建立其元素；而 `If` 與 `Each`（Rust 中為 `when` 與 `each`）則會保留不變的元素。

## If

條件成立時渲染其分支，否則渲染另一個分支（或不渲染任何內容）。

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | 條件：在 Rust 中可為值、signal 或閉包；在 TSX 中則取其真值（truthiness）。 |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | 當 `when` 不成立時渲染。 |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | 當 `when` 成立時渲染。在 TSX 中，函式會取得 `when` 值的 accessor。 |

分支會在條件翻轉到該分支時建立，翻轉離開時，其所建立的內容也會一併移除。TSX 的 `when` 若從一個真值變為另一個真值（`user()` 從一個物件變為另一個物件），則會保留該分支，其內部的運算式會自行更新。

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

在 TSX 中，函式子節點會讀取 `when` 提供的值，其型別中不含 `null` 或 `undefined`，因此分支不需要 `!`。在 Rust 中，分支會自行讀取 signal，或由 `dynamic` 將該值對應為元素：

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

為清單中的每個項目渲染一列。

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | 項目：在 Rust 中為 `Vec`、其 signal，或回傳它的閉包。`null` 與 `undefined` 不會渲染任何內容。 |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | 項目的身分識別。TSX 的預設值：項目本身（物件以參考識別，原始值以值識別）。 |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | 渲染單一列。 |

列函式取得的是 **accessor**，而非值：在 TSX 中呼叫 `item()` 與 `index()`，在 Rust 中呼叫 `item.get()` 與 `index.get()`（兩者皆為 `ReadSignal`）。當項目變更時，key 仍存在的列會被保留（若位置改變則會移動）；它們的項目與索引會更新，且只有讀取這些值的運算式會重新執行。新的 key 會建立新的列；key 已消失的列則會被移除。

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

- 每次更新都會被新物件取代的項目（不可變更新、`{ ...t, done: true }`）需要 `key`，通常是 id。
  若沒有它，每個新物件都會成為新的列，其元素也會被重新建立。Rust 一律需要提供 key。
- 在 TSX 中，字串或數字的陣列不需要 key 也能運作：它們會以值進行比較。
- 每一列都有自己的 owner：在列中建立的 effect 與清理函式會在該列被移除時結束。

> [!NOTE]
> `Each` 與 `each` 是泛型：TypeScript 從 `of` 推斷項目型別，Rust 則從項目推斷，因此列的 `todo()` 與
> `key` 參數無需標註即具備型別。

<a id="each-or-a-list"></a>

## 使用 Each 還是 list

`Each` 會建立每一列。對於數十或數百個項目，在 view 或 [scroll view](./scroll.md) 中使用是合適的。
對於很長或沒有上限的資料，請使用 [list](./list.md)：它只會建立視口附近的列並回收重複利用。

關於運算式如何更新，請參閱 [JSX 與元件](../docs/jsx-and-components.md) 和 [響應式](../docs/reactivity.md)。
