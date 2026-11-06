---
title: "リアクティビティ"
description: "Rust と TSX における Signal、computed 値、effect、resource、batch、untracked、クリーンアップ、context について解説します。NSH が変更された部分だけを正確に更新する仕組みと、避けるべきミスを紹介します。"
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# リアクティビティ

NSH は **シグナル** でUIを更新します。シグナルとは、誰が読み取っているかを把握している値です。シグナルが変化すると、NSH はそのシグナルを読み取った計算(テキスト、スタイル、エフェクト)だけを正確に再実行し、それ以外は何もしません。コンポーネントは再レンダリングされません。このモデルは Solid のものですが、リアクティブグラフ自体はネイティブです。Rust コンポーネントと TSX は Rust で書かれた同じグラフ上で動作するため、TSX でもスケジューリング、依存関係の追跡、クリーンアップはすべてインタープリタの外で行われます。

Rust コンポーネントでは、このページの内容をすべてプレリュードから利用できます。TSX では `nsh` からインポートします。

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## シグナル

`signal(value)` はシグナルを作ります。Rust では `get()` で読み取り、TSX では呼び出して読み取ります。書き込みには `set` と `update` を使います。

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

追跡スコープ(バインディング、`computed`、`effect`)内での読み取りは、そのスコープをシグナルに購読させます。値が変化した場合、書き込みは購読者に通知されます。比較は Rust では `PartialEq`、TSX では `===` で行われます。

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

タップすると、`count` を読み取っている1つのテキストノードだけが更新されます。`counter()` / `Counter` 自体は一度だけ実行されます。Rust のシグナルは `Copy` ハンドルなので、クロージャは `move` で取り込み、自由に使えます。

シグナルはすべての書き込みを変更として扱うこともでき、TSX では独自の方法で値を比較することもできます。

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

TSX では、値なしの `signal<T>()` は `undefined` で始まり、型は `Signal<T | undefined>` になります。Rust では `Option` が同じ意味を表します(`signal(None::<User>)`)。

<a id="objects-and-arrays"></a>

### オブジェクトと配列

Rust では、`update` が値をその場で変更して読み取り側に通知し、`set` は値を置き換えます。TSX ではシグナルは `===` で比較されるため、その場で変更された値は変更とみなされません。新しいオブジェクトや配列を書き込んでください。

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

`each` / `<Each>` は行をアイテムごとにキー付けするため、1つのアイテムを変更しても、その行だけが再構築されます([JSX and components](./jsx-and-components.md#control-flow))。

## computed

`computed(fn)` は他のシグナルから値を導出します。`fn` を実行して結果を記憶し、読み取ったシグナルが変化すると再び実行します。読み取り方はシグナルと同じです。

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

導出された値が複数の場所で読み取られる場合や、計算コストが高い場合は `computed` を使ってください。読み取り側がいくつあっても変更ごとに1回しか実行されず、読み取り側に通知されるのは結果が変化したときだけです。1か所でしか読まない軽い値であれば、通常のクロージャで十分です。

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

TSX では、`fn` は前回の値(初回は `undefined`)を受け取るため、値を累積する用途に使えます。

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` は `fn` を実行し、読み取ったシグナルが変化するたびに再実行します。エフェクトは副作用のためのものです。ログ出力、タイマー、ネットワークリクエスト、[ref](./jsx-and-components.md#refs) に対する命令的な呼び出しなどに使います。

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

エフェクトは、同期的に実行されている間に行われた読み取りを追跡します。タスク内、`.then` コールバック内、または `await` の後での読み取りは追跡されません。

[ref](./jsx-and-components.md#refs) を呼び出すエフェクトは、その ref が付いた要素に対して作用します。TSX では、エフェクトは同じパスで作成された要素が存在した後に実行されるため、ref は設定済みです。

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
> あるシグナルを別のシグナルと同期させるためにエフェクトを使わないでください(`effect(() => b.set(a() * 2))`)。代わりに `computed` を使ってください。古い値になることがなく、2回目のパスも発生しません。読み取るシグナルに自分自身が書き込むエフェクトは、NSH がエラーで停止するまで何度も自分自身を再実行します。

## resource

`resource(source, fetcher)` は値を非同期に読み込み、読み込みの状態を保持します。これにより、コンポーネントは状態を自前で管理せずに、データ、スピナー、エラーを表示できます。

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

`source` は追跡されます。新しい値が与えられるたびに、`fetcher(value, info)` が再び読み込みを行います。Rust では `Option` を返すクロージャで、`None` は何も読み込みません。TSX ではアクセサ(シグナルや関数)または値で、`undefined`、`null`、`false` は何も読み込みません。これは、まだサインインしていないユーザーや、何も選択されていない場合に使います。ソースがない場合、Rust は `|| Some(())` を渡し、TSX の `resource(fetcher)` は一度だけ読み込んで `fetcher(info)` を呼び出します。Rust のフェッチャーは `Result` を返し、TSX のフェッチャーは値または Promise を返します。throw は失敗として扱われます。

| Rust | TSX | 内容 |
|---|---|---|
| `quote.get()` | `posts()` | 最新の値。最初の読み込みが終わるまでは none で、再読み込み中や失敗後も保持されます。 |
| `quote.loading()` | `posts.loading()` | 読み込みが実行中かどうか。 |
| `quote.error()` | `posts.error()` | 直近の読み込みのエラー。読み込みが値を返すと none になります。 |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"`(読み込むものがない)、`Pending`(最初の読み込み)、`Ready`、`Refreshing`(再読み込み中で、値は保持)、`Errored`。 |
| `quote.refetch()` | `posts.refetch()` | 同じソースから再読み込みします。リトライやプルリフレッシュに使います。 |
| `quote.mutate(value)` | `posts.mutate(value)` | 読み込みなしでここに値を設定します(楽観的更新)。エラーもクリアされます。 |

Rust のリソースはシグナルと同様に `Copy` ハンドルです。TSX のメンバーはバインド済みなので、`onRefresh={posts.refetch}` や `const loading = posts.loading` はそのまま使えます。

有効なのは最新の読み込みだけです。新しい読み込みは実行中のものを破棄し、コンポーネントが消えた場合も同様です。TSX では、`info.signal` は渡された `fetch` を中断します。置き換えられた後に終了した読み込みは、何も変更しません。`info.refetching` は、`refetch()` が読み込みを開始したことを示します。Rust の `resource_with_value(value, source, fetcher)` と TSX の `{ initialValue }` は、リソースに最初から値を与えます。

## cleanup

`cleanup(fn)` は、現在のエフェクトが再実行される前、またはそれが属するコンポーネントやエフェクトが破棄されるときに、`fn` が実行されるよう登録します。

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

Rust では、タスク、タイマー、インターバル(`spawn`、`set_timeout`、`set_interval`)は、作成時のオーナーとともに自動的に終了するため、ビュー自身のクロックにクリーンアップは不要です。

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

TSX のエフェクトは、React のようにクリーンアップを返すこともできます。`fn` が返す関数は、`cleanup` に渡した関数と同じタイミングで実行されます。

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

コンポーネントは、レンダリングされなくなると破棄されます。たとえば、その `when` / `<If>` ブランチが非表示になった場合、`each` / `<Each>` の行が削除された場合、またはそのページがポップされた場合です。コンポーネントが作成したすべてのもの(エフェクト、computed 値、タスク、クリーンアップ、ネストされたコンポーネント)は、一緒に破棄されます。

## batch

各書き込みは、購読者へ即座に通知します。複数の書き込みを1つの変更として扱うには、`batch` で囲みます。依存するものは、最後の書き込みの後に1回だけ実行されます。

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

イベントハンドラは自動ではバッチ化されません。押下ハンドラ内で2回書き込むと、両方のシグナルを読み取るエフェクトが2回実行されます。`batch` は、渡された関数の戻り値を返します。

## untracked

`untracked(fn)` は、読み取ったものを購読せずに `fn` を実行します。追跡スコープ内で、依存せずに値を読み取りたいときに使います。

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

Rust の `get_untracked()` は、1つのシグナルを同じ方法で読み取ります。コンポーネント本体はすでに追跡されないので、そこでシグナルを読み取ると一度だけ読み取られます。

## context

コンテキストとは、コンポーネントが、その下でレンダリングされるすべてのものに、どれだけ深くても提供する値です。Rust では、`provide_context(value)` がその型の値を提供し、`use_context::<T>()` が最も近いものを見つけます。TSX では、`context(defaultValue)` がコンテキストを作成し、それを呼び出すと最も近い提供値(なければデフォルト)を読み取り、`<Ctx.Provider value>` が値を提供します。

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

提供された値は、検索されたときに一度だけ読み取られます。変化するものを提供するには、シグナル(またはシグナルを持つ構造体)を提供し、バインディング内で読み取ってください。

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

コンテキストは、コンポーネント本体(またはコンポーネントの作成中に実行されるコード)で読み取ってください。検索の起点となるコンポーネントがないイベントハンドラやタイマー内では読み取らないでください。Rust コンポーネントも、アプリのテーマをこの方法で受け取ります。`nsh_base` からの `theme()` です([Theme](./rust.md#theme))。

<a id="error-boundaries"></a>

## エラーバウンダリ

エラーバウンダリは、ビューの一部で起きた失敗をその部分に留めます。その配下で、コンポーネントの本体、バインディング、エフェクト、イベントハンドラなどのレンダリング中または実行中に何かが throw(Rust では panic)すると、失敗した部分は取り除かれ、バウンダリがその場所にフォールバックを表示します。ビューの残りの部分はそのままです。Rust では `catch_error(view, fallback)`、TSX では `nsh` からの `<ErrorBoundary fallback>` です。フォールバックは、エラー(TSX では throw された値そのもので、通常は `Error`)と、ビューを再びレンダリングするリセットを受け取ります。

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

失敗は、発生した場所より上にある最も近いバウンダリに渡され、フォールバック内で発生した失敗は、さらにその上のバウンダリに渡されます。バウンダリがない場合、失敗は未捕捉のエラーとして報告されます(開発用エラーオーバーレイ、ログ)。TSX では、`fallback` 要素はそのまま表示され(`fallback={<Text>Unavailable</Text>}`)、関数は、宣言されているパラメータに関係なく、エラーと `reset` を引数にして呼び出されます。

<a id="what-runs-and-when"></a>

## 何がいつ実行されるか

| 書くもの | 実行 | 再実行されるとき |
|---|---|---|
| コンポーネント本体 | 作成時に一度 | なし(ホットリロードを除く) |
| バインディング: Rust では `text`、スタイル、prop に渡すクロージャ。TSX では呼び出しやプロパティ読み取りを行う `{expr}` または `prop={expr}` | 要素の作成時に一度 | 読み取ったシグナルが変化したとき。更新されるのはその prop または子だけ |
| `computed(fn)` | 作成時 | 読み取ったシグナルが変化したとき |
| `effect(fn)` | 現在のパスの要素が存在した後 | 読み取ったシグナルが変化したとき |
| `when(cond, ..)` / `<If when>` | 作成時 | 条件の成否が変化したとき |
| `each(..)` / `<Each of>` の行 | そのキーが初めて現れたとき | なし。代わりにそのアイテムとインデックスのシグナルが変化する |

環境も同じようにリアクティブです。Rust では `window()`、`dark()`、`font_scale()`、`safe_area()`、`keyboard_height()`、TSX では [`nsh`](../modules/nsh.md#device) の `windowSize()`、`colorScheme()`、`fontScale()` と、[`nsh`](../modules/nsh.md) の `safeArea()`、`keyboardFrame()` がそうです。そのため、これらを読み取るバインディングは、画面の回転、ダークモード、キーボードに追従します。

<a id="common-mistakes"></a>

## よくある間違い

**コンポーネント本体でシグナルを読み取り、更新されることを期待する。**

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

**props を一度だけ読み取る。** 本体で `props.title.get()` により読み取った Rust の prop は一度だけ読み取られます。バインディング(`text(props.title)`、`move || props.title.get()`)内で読み取ってください。TSX では、`const { title } = props` は `title` を一度だけ読み取ります。使用する場所で `props.title` を読み取るか、[`split`](./jsx-and-components.md#spreading-props) で props を分割してください。

**TSX で、set せずに変更する。** `list().push(x)` は配列を変更しますが、誰にも通知しません。Rust の `update` が自動で行うように、新しい配列を書き込んでください。

**エフェクトで状態を導出する。** `effect(() => total.set(price() * qty()))` は動作しますが、書き込みからエフェクトまでの間 `total` が古いままになり、2回目のパスのコストもかかります。`computed` を使ってください。

**コンポーネントの外でエフェクトを作成する。** エフェクトと computed 値は、それを作成したコンポーネントに属し、そのコンポーネントとともに破棄されます。イベントハンドラやタイマーのコールバック内で作成すると、オーナーがないため永久に残ります。コンポーネント本体で作成し、変化するシグナルを読み取らせてください。

**非同期コードが追跡されると期待する。** 追跡されるのは、エフェクトまたは computed 値の実行中に同期的に行われた読み取りだけです。先にシグナルを読み取り、その後で非同期処理を開始してください。

<a id="related"></a>

## 関連項目

- [JSX and components](./jsx-and-components.md): Rust と TSX における、コンポーネント、props、`when` / `<If>`、`each` / `<Each>`。
- [Building with Rust](./rust.md): Rust アプリ、タスク、テーマ。
- [`nsh` module reference](../modules/nsh.md): すべての TSX 関数のシグネチャ。
- [Animation](./animation.md): シグナルなしで UI スレッド上でアニメーションする、アニメーション値。
