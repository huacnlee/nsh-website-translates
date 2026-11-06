---
title: "響應式機制"
description: "介紹 Rust 與 TSX 中的 signal、computed 值、effect、resource、batch、untracked、cleanup 及 context，說明 NSH 如何只更新有變動的部分，以及應避免的常見錯誤。"
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---


# 響應式機制

NSH 以**訊號**（signal）更新 UI：訊號是知道有誰讀取自己的值。訊號改變時，NSH 只會重新執行讀取過它的運算（文字、樣式、effect），其他一概不動。元件不會重新渲染。此模型取自 Solid，而響應式圖（reactive graph）本身是原生的：Rust 元件和 TSX 在同一個以 Rust 寫成的圖上運行，因此即使是 TSX，排程、依賴追蹤和清理都在直譯器之外完成。

Rust 元件從 prelude 取得本頁的所有內容；TSX 則從 `nsh` 匯入：

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

## Signals

`signal(value)` 建立訊號。在 Rust 中以 `get()` 讀取，在 TSX 中則直接呼叫它；`set` 和 `update` 負責寫入：

```rust tabs
let count = signal(0);

count.get();                    // 0, and tracks the read
count.set(5);
count.update(|n| *n += 1);      // 6
```

```tsx tabs
const count = signal(0);

count();                     // 0, and tracks the read
count.set(5);
count.update((n) => n + 1);  // 6
```

在追蹤範圍（binding、`computed`、`effect`）內讀取訊號，會令該範圍訂閱此訊號。寫入時若值有變，就會通知訂閱者：Rust 以 `PartialEq` 比較，TSX 以 `===` 比較。

```rust tabs
fn counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Tapped {} times", count.get())))
}
```

```tsx tabs
function Counter() {
  const count = signal(0);
  return (
    <View onPress={() => count.update((n) => n + 1)}>
      <Text>Tapped {count()} times</Text>
    </View>
  );
}
```

輕按只會更新讀取 `count` 的那個文字節點。`counter()` / `Counter` 本身只執行一次。Rust 訊號是 `Copy` handle，因此閉包可用 `move` 取得並自由使用。

訊號可以把每次寫入都當作變更，TSX 也可以用自己的方式比較值：

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

在 TSX 中，不帶值的 `signal<T>()` 以 `undefined` 開始，類型為 `Signal<T | undefined>`；在 Rust 中，`Option` 表達同一意思（`signal(None::<User>)`）。

<a id="objects-and-arrays"></a>

### 物件與陣列

在 Rust 中，`update` 會就地修改值並通知讀取者；`set` 則是取代整個值。在 TSX 中，訊號以 `===` 比較，所以就地修改的值不算變更：請寫入新的物件或陣列。

```rust tabs
let todos = signal(Vec::<Todo>::new());

todos.update(|list| list.push(Todo { id: 3, title: "New".into(), done: false }));   // notifies
todos.update(|list| {
    if let Some(todo) = list.iter_mut().find(|t| t.id == id) {
        todo.done = true;
    }
});
```

```tsx tabs
const todos = signal<Todo[]>([]);

todos.update((list) => [...list, { id: 3, title: "New" }]);                 // notifies
todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: true } : t)));

todos().push(item);    // does not notify anyone
todos.set(todos());    // still the same array: no change
```

`each` / `<Each>` 以項目作為列的 key，因此改變其中一項只會重建該列（[JSX 與元件](./jsx-and-components.md#control-flow)）。

## computed

`computed(fn)` 由其他訊號推導出一個值。它執行 `fn`，記住結果，並在所讀取的訊號改變時再次執行。讀取它就像讀取訊號一樣：

```rust tabs
let price = signal(12);
let quantity = signal(2);
let total = computed(move || price.get() * quantity.get());

text(move || format!("Total: {}", total.get()))
```

```tsx tabs
const price = signal(12);
const quantity = signal(2);
const total = computed(() => price() * quantity());

<Text>Total: {total()}</Text>
```

推導出的值若在多處讀取或運算成本高，就用 `computed`：無論有多少讀取者，每次變更它只執行一次，而且只在結果改變時才通知讀取者。若是只讀取一次的廉價值，普通閉包已經足夠：

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

在 TSX 中，`fn` 會收到上一個值（第一次為 `undefined`），用於累積的值：

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` 執行 `fn`，並在所讀取的訊號改變時再次執行。Effect 用於副作用：記錄日誌、計時器、網絡請求，以及對 [ref](./jsx-and-components.md#refs) 的命令式呼叫。

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// What to search for.
    pub query: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let results = signal(Vec::<SharedString>::new());
    effect(move || {
        let q = props.query.get();          // tracked: runs again when the prop changes
        if q.is_empty() {
            return;
        }
        spawn(async move {
            if let Ok(response) = fetch(format!("https://api.example.com/search?q={q}")).await {
                results.set(response.text().lines().map(|line| SharedString::from(line.to_owned())).collect());
            }
        });
    });
    view().child(each(results, |item| item.clone(), |item, _| text(item)))
}
```

```tsx tabs
function Search(props: { query: string }) {
  const results = signal<string[]>([]);
  effect(() => {
    const q = props.query;          // tracked: runs again when the prop changes
    if (!q) return;
    fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => results.set(data.items));
  });
  return <Each of={results()}>{(item) => <Text>{item()}</Text>}</Each>;
}
```

Effect 會追蹤其同步執行期間的讀取。在 task、`.then` 回呼或 `await` 之後的讀取不會被追蹤。

呼叫 [ref](./jsx-and-components.md#refs) 的 effect 會作用於該 ref 所在的元素；在 TSX 中，effect 會在同一輪建立的元素都存在之後才執行，因此 ref 已設定好：

```rust tabs
let input = element_ref();
effect(move || {
    if editing.get() {
        input.focus();
    }
});
```

```tsx tabs
let input: InputRef | undefined;
effect(() => {
  if (editing()) input?.focus();
});
```

> [!TIP]
> 不要用 effect 令一個訊號與另一個訊號保持同步（`effect(() => b.set(a() * 2))`）。請使用 `computed`：它永遠不會過期，也不會引發第二輪更新。若 effect 寫入自己也讀取的訊號，會不斷重複執行，直至 NSH 以錯誤終止它。

## resource

`resource(source, fetcher)` 以非同步方式載入值，並記錄載入進行到哪一步，讓元件無須自行管理就能顯示資料、載入指示器或錯誤：

```rust tabs
let url = signal(SharedString::from("https://api.example.com/quote"));
let quote = resource(move || Some(url.get()), |url, _info| async move {
    let response = fetch(url.to_string()).await?;
    if !response.ok() {
        return Err(format!("HTTP {}", response.status()));
    }
    Ok(response.text())
});

view()
    .child(text(move || match (quote.get(), quote.error()) {
        (_, Some(error)) => format!("Failed: {error}"),
        (Some(quote), None) => quote,
        (None, None) => "Loading…".to_owned(),
    }))
    .child(text("Reload").on_press(move || quote.refetch()))
```

```tsx tabs
import { List, resource, signal, Text } from "nsh";

type Post = { id: number; title: string };

const url = signal("https://jsonplaceholder.typicode.com/posts?_limit=20");
const posts = resource(url, async (u, { signal }) => {
  const response = await fetch(u, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Post[];
});

<If when={posts.error()}>
  <Text>Failed: {String(posts.error())}</Text>
</If>
<List
  each={posts() ?? []}
  refreshing={posts.state() === "refreshing"}
  onRefresh={posts.refetch}
>
  {(post) => <Text>{post().title}</Text>}
</List>
```

`source` 會被追蹤：每當它給出新值，`fetcher(value, info)` 就會重新載入。在 Rust 中它是回傳 `Option` 的閉包，而 `None` 不會載入任何東西；在 TSX 中它是 accessor（訊號、函式）或一個值，而 `undefined`、`null` 或 `false` 不會載入任何東西：適用於尚未登入的用戶或未選取任何項目。沒有 source 時，Rust 傳入 `|| Some(())`，而 TSX 的 `resource(fetcher)` 只載入一次，並呼叫 `fetcher(info)`。Rust 的 fetcher 回傳 `Result`；TSX 的則回傳值或 promise，拋出錯誤即視為失敗。

| Rust | TSX | 說明 |
|---|---|---|
| `quote.get()` | `posts()` | 最新的值：第一次載入完成前為無，重新載入期間及失敗後都會保留。 |
| `quote.loading()` | `posts.loading()` | 是否有載入正在進行。 |
| `quote.error()` | `posts.error()` | 最近一次載入的錯誤；載入給出值後即為無。 |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"`（無須載入）、`Pending`（首次載入）、`Ready`、`Refreshing`（重新載入，保留原值）、`Errored`。 |
| `quote.refetch()` | `posts.refetch()` | 以同一個 source 重新載入：重試、下拉重新整理。 |
| `quote.mutate(value)` | `posts.mutate(value)` | 在此直接設定值而不載入，即樂觀更新，並清除錯誤。 |

Rust 的 resource 是 `Copy` handle，與訊號一樣；TSX 的成員已綁定，因此 `onRefresh={posts.refetch}` 和 `const loading = posts.loading` 可直接使用。

只有最新一次載入有效。新的載入會取消正在進行的載入，元件離開時也一樣；在 TSX 中，`info.signal` 會中止傳給它的 `fetch`。已被取代的載入即使之後完成，也不會改變任何東西。`info.refetching` 表示是 `refetch()` 啟動了該次載入。Rust 的 `resource_with_value(value, source, fetcher)` 和 TSX 的 `{ initialValue }` 讓 resource 一開始就有值。

## cleanup

`cleanup(fn)` 登記 `fn`，在目前的 effect 再次執行之前，或其所屬的元件或 effect 消失時執行：

```rust tabs
effect(move || {
    if !running.get() {
        return;
    }
    let ticker = spawn(async move {
        loop {
            timer(Duration::from_millis(100)).await;
            tick();
        }
    });
    cleanup(move || ticker.cancel());   // before the next run, or on removal
});
```

```tsx tabs
function Clock() {
  const now = signal(Date.now());
  const id = setInterval(() => now.set(Date.now()), 1000);
  cleanup(() => clearInterval(id));       // when Clock is removed
  return <Text>{new Date(now()).toLocaleTimeString()}</Text>;
}

effect(() => {
  if (!running()) return;
  const id = setInterval(tick, 100);
  cleanup(() => clearInterval(id));       // before the next run, or on removal
});
```

在 Rust 中，task、計時器和 interval（`spawn`、`set_timeout`、`set_interval`）會隨建立它們時所屬的 owner 一併結束，因此視圖自己的時鐘無須清理：

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

TSX 的 effect 也可以像 React 一樣回傳其清理函式：`fn` 回傳的函式，與傳給 `cleanup` 的函式在相同時機執行。

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

元件在不再被渲染時就會消失：其 `when` / `<If>` 分支被隱藏、其 `each` / `<Each>` 列被移除，或其頁面被彈出。它建立的一切（effect、computed 值、task、清理函式、巢狀元件）都會一併釋放。

## batch

每次寫入都會立即通知其訂閱者。若要讓多次寫入算作一次變更，請以 `batch` 包起來：依賴者只會在最後一次寫入後執行一次。

```rust tabs
let save = move || {
    batch(|| {
        first_name.set(form.first.clone());
        last_name.set(form.last.clone());
        dirty.set(false);
    })
};
```

```tsx tabs
const save = () =>
  batch(() => {
    firstName.set(form.first);
    lastName.set(form.last);
    dirty.set(false);
  });
```

事件處理器不會自動批次處理：按下處理器中的兩次寫入，會令一個同時讀取兩個訊號的 effect 執行兩次。`batch` 會回傳其函式的回傳值。

## untracked

`untracked(fn)` 執行 `fn` 時不會訂閱它所讀取的內容。在追蹤範圍內使用它，可讀取值而不依賴它：

```rust tabs
effect(move || {
    let q = query.get();                          // runs again when query changes
    let filters = untracked(|| active_filters.get());   // read, but not a reason to run again
    search(q, filters);
});
```

```tsx tabs
effect(() => {
  const q = query();                     // runs again when query changes
  const filters = untracked(activeFilters); // read, but not a reason to run again
  search(q, filters);
});
```

Rust 的 `get_untracked()` 以同樣方式讀取單個訊號。元件本體本來就是不追蹤的：在其中讀取訊號只會讀取一次。

## context

Context 是元件提供給其渲染的所有內容的值，無論多深。在 Rust 中，`provide_context(value)` 提供其類型的值，`use_context::<T>()` 找出最近的一個；在 TSX 中，`context(defaultValue)` 建立 context，呼叫它會讀取最近提供的值（或預設值），`<Ctx.Provider value>` 則負責提供值：

```rust tabs
#[derive(Clone, Copy)]
struct Dark(bool);

fn label(content: &'static str) -> impl IntoElement {
    let dark = use_context::<Dark>().is_some_and(|d| d.0);
    text(content).text_color(if dark { rgb(0xffffff) } else { rgb(0x1f2328) })
}

fn screen() -> impl IntoElement {
    provide_context(Dark(true));
    view().child(label("Hello"))
}
```

```tsx tabs
const Theme = context<"light" | "dark">("light");

function Label(props: { children: string }) {
  const theme = Theme();
  return <Text style={{ color: theme === "dark" ? "#ffffff" : "#1f2328" }}>{props.children}</Text>;
}

mount(() => (
  <Theme.Provider value="dark">
    <Label>Hello</Label>
  </Theme.Provider>
));
```

提供的值只會在查找時讀取一次。若要提供會變化的東西，請提供訊號（或包含訊號的 struct），並在 binding 中讀取：

```rust tabs
#[derive(Clone, Copy)]
struct Accent(Signal<Hsla>);

#[component]
fn App() -> impl IntoElement {
    provide_context(Accent(signal(rgb(0x0969da).into())));
    view().child(swatch())
}

fn swatch() -> impl IntoElement {
    let Accent(accent) = use_context::<Accent>().expect("an accent");
    view()
        .w(px(40.0))
        .h(px(40.0))
        .bg(move || accent.get())
        .on_press(move || accent.set(rgb(0x8250df).into()))
}
```

```tsx tabs
const Accent = context(signal("#0969da"));

function App() {
  const accent = signal("#0969da");
  return (
    <Accent.Provider value={accent}>
      <Swatch />
    </Accent.Provider>
  );
}

function Swatch() {
  const accent = Accent();
  return <View onPress={() => accent.set("#8250df")} style={{ width: 40, height: 40, backgroundColor: accent() }} />;
}
```

請在元件本體（或元件建立期間執行的程式碼）中讀取 context，不要在事件處理器或計時器中讀取，因為那裏沒有可供查找的元件。Rust 元件也是這樣取得應用程式的主題：`theme()` 來自 `nsh_base`（[主題](./rust.md#theme)）。

<a id="error-boundaries"></a>

## 錯誤邊界

錯誤邊界把視圖某一部分的失敗限制在該部分之內。當其下方的任何東西在渲染或執行時拋出（Rust：panic），例如元件本體、binding、effect 或事件處理器，失敗的部分會被移除，邊界會在原位顯示其 fallback；視圖的其餘部分保持不變。在 Rust 中是 `catch_error(view, fallback)`；在 TSX 中是來自 `nsh` 的 `<ErrorBoundary fallback>`。Fallback 會收到錯誤（TSX 中是被拋出的值本身，通常為 `Error`）以及一個 reset，可再次渲染視圖：

```rust tabs
fn profile_card(user: Signal<Option<User>>) -> impl IntoElement {
    catch_error(
        move || profile(user),
        |error, reset| {
            view()
                .child(text(format!("Something went wrong: {error}")))
                .child(text("Try again").on_press(move || reset.reset()))
        },
    )
}
```

```tsx tabs
import { ErrorBoundary, Text, View } from "nsh";

function ProfileCard(props: { user: User | undefined }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>Something went wrong: {error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Profile user={props.user} />
    </ErrorBoundary>
  );
}
```

失敗會交給發生處上方最近的邊界，fallback 中的失敗則交給再上一層的邊界。沒有邊界時，失敗會作為未捕獲錯誤回報（開發用的錯誤覆蓋層、日誌）。在 TSX 中，`fallback` 元素會原樣顯示（`fallback={<Text>Unavailable</Text>}`），函式則會以錯誤和 `reset` 呼叫，不論它宣告了甚麼參數。

<a id="what-runs-and-when"></a>

## 甚麼會執行，何時執行

| 你寫的 | 何時執行 | 何時再次執行 |
|---|---|---|
| 元件本體 | 建立時執行一次 | 不會（熱重載除外） |
| binding：在 Rust 中是傳給 `text`、樣式或 prop 的閉包；在 TSX 中是呼叫或讀取屬性的 `{expr}` 或 `prop={expr}` | 元素建立時執行一次 | 所讀取的訊號改變時；只更新該 prop 或子節點 |
| `computed(fn)` | 建立時 | 所讀取的訊號改變時 |
| `effect(fn)` | 當前這一輪的元素都存在之後 | 所讀取的訊號改變時 |
| `when(cond, ..)` / `<If when>` | 建立時 | 條件是否成立改變時 |
| `each(..)` / `<Each of>` 的列 | 其 key 首次出現時 | 不會；改變的是其 item 和 index 訊號 |

環境同樣是響應式的：Rust 中的 `window()`、`dark()`、`font_scale()`、`safe_area()` 和 `keyboard_height()`，TSX 中來自 [`nsh`](../modules/nsh.md#device) 的 `windowSize()`、`colorScheme()` 和 `fontScale()`，以及來自 [`nsh`](../modules/nsh.md) 的 `safeArea()` 和 `keyboardFrame()`，因此讀取它們的 binding 會跟隨旋轉、深色模式或鍵盤而變化。

<a id="common-mistakes"></a>

## 常見錯誤

**在元件本體中讀取訊號並期望它更新。**

```rust tabs
fn bad() -> impl IntoElement {
    let n = count.get();                       // read once
    text(format!("{n}"))                       // never changes
}

fn good() -> impl IntoElement {
    text(move || format!("{}", count.get()))   // a binding: follows count
}
```

```tsx tabs
function Bad() {
  const n = count();           // read once
  return <Text>{n}</Text>;     // never changes
}

function Good() {
  return <Text>{count()}</Text>;
}
```

**只讀取一次 props。** Rust 中在本體以 `props.title.get()` 讀取的 prop 只會讀取一次；請在 binding 中讀取（`text(props.title)`、`move || props.title.get()`）。在 TSX 中，`const { title } = props` 會把 `title` 讀取一次：請在使用處讀取 `props.title`，或以 [`split`](./jsx-and-components.md#spreading-props) 拆分 props。

**在 TSX 中就地修改而非設定。** `list().push(x)` 會改變陣列但不會通知任何人。請寫入新陣列，就像 Rust 的 `update` 替你做的一樣。

**以 effect 推導狀態。** `effect(() => total.set(price() * qty()))` 可行，但會令 `total` 在寫入與 effect 之間過期，並多花一輪更新。請使用 `computed`。

**在元件以外建立 effect。** Effect 和 computed 值屬於建立它們的元件，並隨該元件一併釋放。若在事件處理器或計時器回呼中建立，它們沒有 owner，會永遠存在。請在元件本體中建立它們，再讓它們讀取會改變的訊號。

**期望非同步程式碼會被追蹤。** 只有在 effect 或 computed 值執行期間同步進行的讀取才會被追蹤。請先讀取訊號，再開始非同步工作。

<a id="related"></a>

## 相關內容

- [JSX 與元件](./jsx-and-components.md)：元件、props、`when` / `<If>` 和 `each` / `<Each>`，Rust 與 TSX 皆有說明。
- [使用 Rust 構建](./rust.md)：Rust 應用程式、task 與主題。
- [`nsh` 模組參考](../modules/nsh.md)：每個 TSX 函式的簽章。
- [動畫](./animation.md)：在 UI 執行緒上運行、無須訊號的動畫值。
