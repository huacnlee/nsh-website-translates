---
title: "響應式機制"
description: "在 Rust 與 TSX 中使用 signal、computed 值、effect、resource、batch、untracked、cleanup 與 context——說明 NSH 如何僅更新確實發生變化的部分,以及應避免的常見錯誤。"
order: 31
group: ui
demo: guide-reactivity
---

# 響應式

NSH 以 **signal** 來更新 UI:signal 是知道誰在讀取它的值。當 signal 改變時,NSH 只會重新執行讀取過它的運算(文字、樣式、effect),不會執行其他任何東西。元件不會重新渲染。此模型源自 Solid,而響應式圖本身是原生的:Rust 元件與 TSX 在同一張以 Rust 撰寫的圖上執行,因此即使在 TSX 中,排程、相依追蹤與清理也都在直譯器之外完成。

Rust 元件從 prelude 取得本頁的所有內容;TSX 則從 `nsh` 匯入:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

## Signals

`signal(value)` 會建立一個 signal。在 Rust 中以 `get()` 讀取,在 TSX 中則直接呼叫它;`set` 與 `update` 負責寫入:

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

在追蹤範圍(binding、`computed`、`effect`)內進行讀取,會讓該範圍訂閱此 signal。當值改變時,寫入會通知訂閱者:Rust 以 `PartialEq` 比較,TSX 以 `===` 比較。

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

點按只會更新讀取 `count` 的那一個文字節點。`counter()` / `Counter` 本身只會執行一次。Rust 的 signal 是 `Copy` handle,因此閉包可以用 `move` 取得它並隨意使用。

signal 可以把每一次寫入都視為變更,TSX 也可以用自己的方式比較值:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

在 TSX 中,不帶值的 `signal<T>()` 初始值為 `undefined`,型別為 `Signal<T | undefined>`;在 Rust 中,
`Option` 表達相同的意思(`signal(None::<User>)`)。

<a id="objects-and-arrays"></a>

### 物件與陣列

在 Rust 中,`update` 會就地修改值並通知讀取者;`set` 則會取代整個值。在 TSX 中,signal 以 `===` 比較,因此就地修改的值不算變更:請寫入新的物件或陣列。

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

`each` / `<Each>` 以項目作為資料列的 key,因此更改某個項目只會重建該列([JSX 與元件](./jsx-and-components.md#control-flow))。

## computed

`computed(fn)` 從其他 signal 衍生出一個值。它會執行 `fn`、記住結果,並在它讀取過的 signal 改變時再次執行。讀取它的方式與讀取 signal 相同:

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

當衍生值會在多處被讀取或計算成本較高時,請使用 `computed`:無論有多少讀取者,每次變更它只會執行一次,而且只有在結果改變時才會通知讀取者。若只是讀取一次的輕量值,一般的閉包就足夠了:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

在 TSX 中,`fn` 會收到前一個值(第一次為 `undefined`),可用於需要累積的值:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` 會執行 `fn`,並在它讀取過的 signal 改變時再次執行。effect 用於處理副作用:記錄日誌、計時器、網路請求,以及對 [ref](./jsx-and-components.md#refs) 的命令式呼叫。

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

effect 會追蹤它在同步執行期間所做的讀取。在 task、`.then` callback 中,或在 `await` 之後所做的讀取不會被追蹤。

呼叫 [ref](./jsx-and-components.md#refs) 的 effect 會作用於該 ref 所在的元素;在 TSX 中,effect 會在同一輪中建立的元素都存在之後才執行,因此 ref 已經設定完成:

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
> 不要使用 effect 讓一個 signal 與另一個 signal 保持同步(`effect(() => b.set(a() * 2))`)。請使用 `computed`:它永遠不會過期,也不會造成第二輪執行。若 effect 寫入了它同時也讀取的 signal,它會一再重複執行,直到 NSH 以錯誤中止它。

## resource

`resource(source, fetcher)` 以非同步方式載入值,並記錄載入進行到哪個階段,因此元件可以顯示資料、載入指示器或錯誤,而不必自行管理這些狀態:

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

`source` 會被追蹤:每當它給出新值,`fetcher(value, info)` 就會重新載入。在 Rust 中它是回傳 `Option` 的閉包,而 `None` 不會載入任何東西;在 TSX 中它是 accessor(signal 或函式)或一個值,而 `undefined`、`null` 或 `false` 不會載入任何東西:適用於尚未登入的使用者或尚未選取任何項目的情況。沒有 source 時,Rust 會傳入 `|| Some(())`,而 TSX 的 `resource(fetcher)` 會載入一次,並呼叫 `fetcher(info)`。Rust 的 fetcher 回傳 `Result`;TSX 的 fetcher 回傳一個值或 promise,拋出例外即視為失敗。

| Rust | TSX | 說明 |
|---|---|---|
| `quote.get()` | `posts()` | 最新的值:第一次載入結束前為無,重新載入期間與失敗之後都會保留。 |
| `quote.loading()` | `posts.loading()` | 是否有載入正在執行。 |
| `quote.error()` | `posts.error()` | 最近一次載入的錯誤;一旦某次載入取得值就會變為無。 |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"`(沒有要載入的內容)、`Pending`(第一次載入)、`Ready`、`Refreshing`(重新載入中,保留原值)、`Errored`。 |
| `quote.refetch()` | `posts.refetch()` | 以相同的 source 重新載入:重試、下拉重新整理。 |
| `quote.mutate(value)` | `posts.mutate(value)` | 直接在此設定值而不載入(樂觀更新),並清除錯誤。 |

Rust 的 resource 與 signal 一樣是 `Copy` handle;TSX 的成員已經綁定,因此 `onRefresh={posts.refetch}` 與 `const loading = posts.loading` 可以直接使用。

只有最新的一次載入有效。新的載入會捨棄正在執行的載入,元件被移除時也一樣;在 TSX 中,`info.signal` 會中止傳給它的 `fetch`。在被取代之後才結束的載入不會造成任何改變。`info.refetching` 表示是 `refetch()` 啟動了該次載入。Rust 中的 `resource_with_value(value, source, fetcher)` 與 TSX 中的 `{ initialValue }` 會讓 resource 一開始就有值。

## cleanup

`cleanup(fn)` 會登記 `fn`,在目前的 effect 再次執行之前,或在它所屬的元件或 effect 被移除時執行:

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

在 Rust 中,task、計時器與 interval(`spawn`、`set_timeout`、`set_interval`)會隨著建立它們時所在的 owner 一同結束,因此 view 自己的時鐘不需要清理:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

TSX 的 effect 也可以回傳它的清理函式,與 React 相同:`fn` 回傳的函式與傳給 `cleanup` 的函式會在相同的時機執行。

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

當元件不再被渲染時就會被移除:它的 `when` / `<If>` 分支被隱藏、它的 `each` / `<Each>` 資料列被移除,或它的頁面被彈出。它所建立的一切(effect、computed 值、task、cleanup、巢狀元件)都會一併被釋放。

## batch

每次寫入都會立即通知其訂閱者。若要讓多次寫入算作一次變更,請以 `batch` 包住它們:相依項只會在最後一次寫入之後執行一次。

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

事件處理器不會自動為你進行批次處理:在 press handler 中寫入兩次,會讓同時讀取兩個 signal 的 effect 執行兩次。`batch` 會回傳其函式所回傳的值。

## untracked

`untracked(fn)` 會執行 `fn`,但不訂閱其中讀取的內容。在追蹤範圍中,若要讀取某個值而不依賴它,請使用它:

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

Rust 的 `get_untracked()` 以相同方式讀取單一 signal。元件本體本來就是不被追蹤的:在其中讀取 signal 只會讀取一次。

## context

context 是元件提供給它所渲染的一切內容的值,無論層級多深。在 Rust 中,`provide_context(value)` 會提供其型別的值,而 `use_context::<T>()` 會找到最近的那一個;在 TSX 中,`context(defaultValue)` 會建立 context,呼叫它會讀取最近提供的值(或預設值),而 `<Ctx.Provider value>` 則用來提供值:

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

提供的值只會在查找時讀取一次。若要提供會變動的內容,請提供一個 signal(或由 signal 組成的 struct),並在 binding 中讀取它:

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

請在元件本體(或在建立元件期間執行的程式碼)中讀取 context,而不要在事件處理器或計時器中讀取,因為那裡沒有可供查找的元件。Rust 元件也是以這種方式取得應用程式的主題:`theme()` 來自 `nsh_base`([主題](./rust.md#theme))。

<a id="error-boundaries"></a>

## 錯誤邊界

錯誤邊界會把失敗限制在 view 的某個部分。當其下方的內容在渲染或執行期間拋出例外(Rust:panic),例如元件本體、binding、effect 或事件處理器,失敗的部分會被移除,並由邊界在原處顯示其 fallback;view 的其餘部分維持不變。在 Rust 中使用 `catch_error(view, fallback)`;在 TSX 中使用來自 `nsh` 的 `<ErrorBoundary fallback>`。fallback 會收到錯誤(在 TSX 中是被拋出的值本身,通常為 `Error`)以及一個讓 view 重新渲染的 reset:

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

失敗會交給發生處上方最近的邊界;fallback 中的失敗則交給再上一層的邊界。若沒有邊界,該失敗會被回報為未捕捉的錯誤(開發用的錯誤覆蓋層、日誌)。在 TSX 中,`fallback` 元素會原樣顯示(`fallback={<Text>Unavailable</Text>}`),而函式會以錯誤與 `reset` 呼叫,無論它宣告了哪些參數。

<a id="what-runs-and-when"></a>

## 什麼會執行,以及何時執行

| 你撰寫的內容 | 執行時機 | 再次執行的時機 |
|---|---|---|
| 元件本體 | 建立時執行一次 | 不會(熱重載除外) |
| binding:Rust 中傳給 `text`、樣式或 prop 的閉包;TSX 中呼叫函式或讀取屬性的 `{expr}` 或 `prop={expr}` | 元素建立時執行一次 | 它讀取的 signal 改變時;只會更新該 prop 或子節點 |
| `computed(fn)` | 建立時 | 它讀取的 signal 改變時 |
| `effect(fn)` | 目前這一輪的元素都存在之後 | 它讀取的 signal 改變時 |
| `when(cond, ..)` / `<If when>` | 建立時 | 條件是否成立發生變化時 |
| `each(..)` / `<Each of>` 資料列 | 其 key 第一次出現時 | 不會;改為其項目與索引 signal 改變 |

環境也以相同方式具備響應性:Rust 中的 `window()`、`dark()`、`font_scale()`、`safe_area()` 與 `keyboard_height()`,TSX 中來自 [`nsh`](../modules/nsh.md#device) 的 `windowSize()`、`colorScheme()` 與 `fontScale()`,以及來自 [`nsh`](../modules/nsh.md) 的 `safeArea()` 與 `keyboardFrame()`,因此讀取它們的 binding 會跟隨螢幕旋轉、深色模式或鍵盤的變化。

<a id="common-mistakes"></a>

## 常見錯誤

**在元件本體中讀取 signal 卻期待它會更新。**

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

**只讀取一次 props。** 在本體中以 `props.title.get()` 讀取的 Rust prop 只會被讀取一次;請在 binding 中讀取它(`text(props.title)`、`move || props.title.get()`)。在 TSX 中,`const { title } = props` 只會讀取一次 `title`:請在使用處讀取 `props.title`,或以 [`split`](./jsx-and-components.md#spreading-props) 拆分 props。

**在 TSX 中以修改取代設定。** `list().push(x)` 會改變陣列,但不會通知任何人。請寫入新的陣列,就像 Rust 的 `update` 為你做的那樣。

**以 effect 衍生狀態。** `effect(() => total.set(price() * qty()))` 雖然可行,但會讓 `total` 在寫入與 effect 執行之間處於過期狀態,並多花一輪執行。請使用 `computed`。

**在元件之外建立 effect。** effect 與 computed 值屬於建立它們的元件,並隨該元件一同被釋放。若在事件處理器或計時器 callback 中建立,它們就沒有 owner,會永遠存在。請在元件本體中建立它們,並讓它們讀取會改變的 signal。

**期待非同步程式碼會被追蹤。** 只有在 effect 或 computed 值執行期間同步進行的讀取才會被追蹤。請先讀取 signal,再啟動非同步工作。

<a id="related"></a>

## 相關內容

- [JSX 與元件](./jsx-and-components.md):Rust 與 TSX 中的元件、props、`when` / `<If>` 以及 `each` / `<Each>`。
- [以 Rust 建置](./rust.md):Rust 應用程式、task 與主題。
- [`nsh` 模組參考](../modules/nsh.md):每個 TSX 函式的簽章。
- [動畫](./animation.md):在 UI 執行緒上進行動畫、不需要 signal 的動畫值。
