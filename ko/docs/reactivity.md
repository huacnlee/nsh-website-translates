---
title: "반응성"
description: "Rust와 TSX에서 사용하는 시그널(signal), 계산된 값(computed), 이펙트(effect), 리소스(resource), batch, untracked, 정리(cleanup), 컨텍스트(context) - NSH가 변경된 부분만 정확하게 업데이트하는 방법과 피해야 할 실수를 설명합니다."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# 반응성

NSH는 **시그널(signal)**로 UI를 업데이트합니다. 시그널은 누가 자신을 읽는지 아는 값입니다. 시그널이 바뀌면 NSH는 그 시그널을 읽은 계산(텍스트, 스타일, effect)만 정확히 다시 실행하고 다른 것은 실행하지 않습니다. 컴포넌트는 다시 렌더링되지 않습니다. 모델은 Solid의 것이며, 반응형 그래프 자체는 네이티브입니다. Rust 컴포넌트와 TSX가 Rust로 작성된 같은 그래프 위에서 실행되므로, TSX에서도 스케줄링, 의존성 추적, 정리(cleanup)가 모두 인터프리터 밖에서 일어납니다.

Rust 컴포넌트는 이 페이지의 모든 것을 prelude에서 가져오고, TSX는 `nsh`에서 import합니다:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## 시그널

시그널을 만드는 것은 `signal(value)`입니다. 읽기는 Rust에서 `get()`, TSX에서 시그널 호출로 하고, 쓰기에는 `set` 및 `update`을 사용합니다:

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

추적 스코프(바인딩, `computed`, `effect`) 안에서 읽으면 그 스코프가 시그널을 구독합니다. 값이 바뀌었을 때 쓰기는 구독자에게 알립니다. Rust에서는 `PartialEq`, TSX에서는 `===` 기준으로 비교합니다.

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

탭하면 `count` 값을 읽는 텍스트 노드 하나만 업데이트됩니다. `counter()` / `Counter` 자체는 한 번만 실행됩니다. Rust 시그널은 `Copy` 핸들이므로 클로저는 `move` 방식으로 가져가 자유롭게 사용할 수 있습니다.

시그널은 모든 쓰기를 변경으로 간주하도록 할 수 있고, TSX에서는 값을 직접 정한 방식으로 비교할 수도 있습니다:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

TSX에서 값 없이 쓰는 `signal<T>()`은 `undefined`로 시작하며 타입은 `Signal<T | undefined>`입니다. Rust에서는 `Option`가 같은 의미입니다(`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### 객체와 배열

Rust에서 `update`는 값을 그 자리에서 변경하고 읽는 쪽에 알리며, `set`는 값을 교체합니다. TSX에서 시그널은 `===`로 비교하므로 제자리에서 변경한 값은 변경으로 취급되지 않습니다. 새 객체나 배열을 쓰세요.

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

`each` / `<Each>`는 항목 기준으로 행의 키를 지정하므로, 항목 하나를 바꾸면 해당 행만 다시 만들어집니다([JSX와 컴포넌트](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)`는 다른 시그널에서 값을 파생합니다. `fn`를 실행하고 결과를 기억하며, 읽은 시그널이 바뀌면 다시 실행합니다. 읽는 방법은 시그널과 같습니다:

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

파생 값을 여러 곳에서 읽거나 계산 비용이 클 때는 `computed`를 사용하세요. 읽는 쪽이 몇 개든 변경당 한 번만 실행되며, 결과가 바뀔 때만 읽는 쪽에 알립니다. 한 번만 읽는 저렴한 값이라면 일반 클로저로 충분합니다:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

TSX에서 `fn`는 이전 값을 받습니다(처음에는 `undefined`). 누적되는 값에 사용합니다:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)`는 `fn`를 실행하고, 읽은 시그널이 바뀔 때마다 다시 실행합니다. effect는 로깅, 타이머, 네트워크 요청, [ref](./jsx-and-components.md#refs)에 대한 명령형 호출 같은 부수 효과를 위한 것입니다.

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

effect는 동기적으로 실행되는 동안 발생한 읽기를 추적합니다. 태스크, `.then` 콜백 안에서, 또는 `await` 이후에 일어나는 읽기는 추적되지 않습니다.

[ref](./jsx-and-components.md#refs)를 호출하는 effect는 그 ref가 붙은 요소에 작용합니다. TSX에서는 같은 패스에서 만들어진 요소가 존재한 뒤에 effect가 실행되므로 ref가 설정되어 있습니다:

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
> effect를 사용해 한 시그널을 다른 시그널과 동기화하지 마세요(`effect(() => b.set(a() * 2))`). `computed`를 사용하세요. 값이 오래된 상태가 되지 않으며 두 번째 패스도 발생하지 않습니다. 자신이 읽는 시그널에 쓰는 effect는 NSH가 에러로 중단시킬 때까지 계속 반복해서 다시 실행됩니다.

## resource

`resource(source, fetcher)`는 값을 비동기로 로드하고 로드 상태를 함께 유지하므로, 컴포넌트는 직접 관리하지 않고도 데이터, 스피너, 에러를 표시할 수 있습니다:

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

`source`는 추적됩니다. 새 값이 나올 때마다 `fetcher(value, info)`가 다시 로드합니다. Rust에서는 `Option`를 반환하는 클로저이며 `None`이면 아무것도 로드하지 않습니다. TSX에서는 접근자(시그널, 함수) 또는 값이며, `undefined`, `null`, `false`이면 아무것도 로드하지 않습니다. 아직 로그인하지 않은 사용자나 선택된 것이 없는 경우에 해당합니다. 소스가 없으면 Rust는 `|| Some(())`를 전달하고, TSX의 `resource(fetcher)`는 `fetcher(info)`를 호출하여 한 번 로드합니다. Rust의 fetcher는 `Result`를 반환하고, TSX의 fetcher는 값 또는 promise를 반환하며 throw는 실패로 간주됩니다.

| Rust | TSX | 설명 |
|---|---|---|
| `quote.get()` | `posts()` | 최신 값: 첫 로드가 끝나기 전에는 없음. 다시 로드하는 동안과 실패 후에도 유지됩니다. |
| `quote.loading()` | `posts.loading()` | 로드가 실행 중인지 여부. |
| `quote.error()` | `posts.error()` | 마지막 로드의 에러. 로드가 값을 내면 없음. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"`(로드할 것 없음), `Pending`(첫 로드), `Ready`, `Refreshing`(다시 로드 중, 값 유지), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | 같은 소스에서 다시 로드합니다: 재시도, 당겨서 새로고침. |
| `quote.mutate(value)` | `posts.mutate(value)` | 로드 없이 값을 직접 설정하고(낙관적 업데이트) 에러를 지웁니다. |

Rust resource는 시그널과 마찬가지로 `Copy` 핸들입니다. TSX의 멤버는 바인딩되어 있어 `onRefresh={posts.refetch}` 및 `const loading = posts.loading`를 그대로 사용할 수 있습니다.

가장 최근 로드만 유효합니다. 새 로드는 실행 중인 로드를 버리며, 컴포넌트가 사라질 때도 마찬가지입니다. TSX에서는 `info.signal`가 전달받은 `fetch`을 abort합니다. 대체된 뒤에 끝난 로드는 아무것도 바꾸지 않습니다. `info.refetching`는 `refetch()`가 로드를 시작했음을 나타냅니다. Rust의 `resource_with_value(value, source, fetcher)`와 TSX의 `{ initialValue }`는 resource에 처음부터 값을 줍니다.

## cleanup

`cleanup(fn)`는 현재 effect가 다시 실행되기 전, 또는 그것이 속한 컴포넌트나 effect가 사라질 때 `fn`가 실행되도록 등록합니다:

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

Rust에서 태스크, 타이머, 인터벌(`spawn`, `set_timeout`, `set_interval`)은 만들어진 소유자와 함께 이미 종료되므로, 뷰 자체의 시계에는 cleanup이 필요 없습니다:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

TSX effect는 React처럼 cleanup을 반환할 수도 있습니다. `fn`가 반환하는 함수는 `cleanup`에 전달한 함수와 같은 시점에 실행됩니다.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

컴포넌트는 더 이상 렌더링되지 않으면 사라집니다. `when` / `<If>` 분기가 숨겨지거나, `each` / `<Each>` 행이 제거되거나, 페이지가 pop되는 경우입니다. 컴포넌트가 만든 모든 것(effect, computed 값, 태스크, cleanup, 중첩 컴포넌트)이 함께 폐기됩니다.

## batch

각 쓰기는 구독자에게 즉시 알립니다. 여러 번의 쓰기를 하나의 변경으로 취급하려면 `batch`로 감싸세요. 의존하는 쪽은 마지막 쓰기 이후 한 번만 실행됩니다:

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

이벤트 핸들러는 자동으로 batch되지 않습니다. press 핸들러에서 두 번 쓰면 두 시그널을 모두 읽는 effect가 두 번 실행됩니다. `batch`는 전달된 함수가 반환하는 값을 반환합니다.

## untracked

`untracked(fn)`는 `fn`를 실행하되 읽은 값을 구독하지 않습니다. 추적 스코프 안에서 값에 의존하지 않고 읽고 싶을 때 사용하세요:

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

Rust의 `get_untracked()`는 시그널 하나를 같은 방식으로 읽습니다. 컴포넌트 본문은 이미 untracked 상태이므로, 거기서 시그널을 읽으면 한 번만 읽습니다.

## context

context는 컴포넌트가 자신이 렌더링하는 모든 것에, 아무리 깊더라도 제공하는 값입니다. Rust에서는 `provide_context(value)`가 해당 타입의 값을 제공하고 `use_context::<T>()`가 가장 가까운 값을 찾습니다. TSX에서는 `context(defaultValue)`가 context를 만들고, 이를 호출하면 가장 가까이 제공된 값(또는 기본값)을 읽으며, `<Ctx.Provider value>`가 값을 제공합니다:

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

제공된 값은 조회될 때 한 번 읽힙니다. 변하는 것을 제공하려면 시그널(또는 시그널로 이루어진 struct)을 제공하고 바인딩에서 읽으세요:

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

context는 컴포넌트 본문(또는 컴포넌트가 생성되는 동안 실행되는 코드)에서 읽으세요. 조회할 컴포넌트가 없는 이벤트 핸들러나 타이머에서는 읽지 마세요. Rust 컴포넌트도 앱의 테마를 이런 방식으로 가져옵니다: `nsh_base`의 `theme()`([테마](./rust.md#theme)).

<a id="error-boundaries"></a>

## 에러 바운더리

에러 바운더리는 뷰 한 부분의 실패를 그 부분에 가둡니다. 그 아래의 무언가가 렌더링되거나 실행되는 동안(컴포넌트 본문, 바인딩, effect, 이벤트 핸들러 등) throw하면(Rust에서는 panic), 실패한 부분은 제거되고 바운더리가 그 자리에 fallback을 표시합니다. 뷰의 나머지는 그대로 유지됩니다. Rust에서는 `catch_error(view, fallback)`이고, TSX에서는 `nsh`의 `<ErrorBoundary fallback>`입니다. fallback은 에러(TSX에서는 throw된 값 자체이며 보통 `Error`)와 뷰를 다시 렌더링하는 reset을 받습니다:

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

실패는 발생한 위치보다 위에 있는 가장 가까운 바운더리로 전달되며, fallback 안에서 발생한 실패는 그 위의 바운더리로 전달됩니다. 바운더리가 없으면 실패는 처리되지 않은 에러로 보고됩니다(개발용 에러 오버레이, 로그). TSX에서 `fallback` 요소는 그대로 표시되고(`fallback={<Text>Unavailable</Text>}`), 함수는 선언한 매개변수와 관계없이 에러와 `reset`와 함께 호출됩니다.

<a id="what-runs-and-when"></a>

## 무엇이 언제 실행되는가

| 작성하는 코드 | 실행 시점 | 다시 실행되는 시점 |
|---|---|---|
| 컴포넌트 본문 | 한 번, 생성될 때 | 없음(hot reload 제외) |
| 바인딩: Rust에서 `text`, 스타일, prop에 전달한 클로저. TSX에서 프로퍼티를 호출하거나 읽는 `{expr}` 또는 `prop={expr}` | 한 번, 요소가 생성될 때 | 읽은 시그널이 바뀔 때. 해당 prop 또는 자식만 업데이트됩니다 |
| `computed(fn)` | 생성될 때 | 읽은 시그널이 바뀔 때 |
| `effect(fn)` | 현재 패스의 요소가 존재한 뒤 | 읽은 시그널이 바뀔 때 |
| `when(cond, ..)` / `<If when>` | 생성될 때 | 조건의 성립 여부가 바뀔 때 |
| `each(..)` / `<Each of>` 행 | 키가 처음 나타날 때 | 다시 실행되지 않음. 대신 항목과 인덱스 시그널이 바뀝니다 |

환경도 같은 방식으로 반응형입니다. Rust에서는 `window()`, `dark()`, `font_scale()`, `safe_area()`, `keyboard_height()`이고, TSX에서는 [`nsh`](../modules/nsh.md#device)의 `windowSize()`, `colorScheme()`, `fontScale()` 및 [`nsh`](../modules/nsh.md)의 `safeArea()`, `keyboardFrame()`입니다. 따라서 이를 읽는 바인딩은 화면 회전, 다크 모드, 키보드를 따라갑니다.

<a id="common-mistakes"></a>

## 흔한 실수

**컴포넌트 본문에서 시그널을 읽고 업데이트를 기대하는 경우.**

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

**prop을 한 번만 읽는 경우.** 본문에서 `props.title.get()`로 읽은 Rust prop은 한 번만 읽힙니다. 바인딩(`text(props.title)`, `move || props.title.get()`)에서 읽으세요. TSX에서 `const { title } = props`는 `title`를 한 번만 읽습니다. 사용하는 곳에서 `props.title`를 읽거나 [`split`](./jsx-and-components.md#spreading-props)로 props를 분리하세요.

**TSX에서 set 대신 변경하는 경우.** `list().push(x)`는 배열을 바꾸지만 아무에게도 알리지 않습니다. Rust의 `update`가 대신 해 주듯 새 배열을 쓰세요.

**effect로 상태를 파생하는 경우.** `effect(() => total.set(price() * qty()))`도 동작하지만, 쓰기와 effect 사이에 `total`가 오래된 값으로 남고 두 번째 패스 비용이 듭니다. `computed`를 사용하세요.

**컴포넌트 밖에서 effect를 만드는 경우.** effect와 computed 값은 그것을 만든 컴포넌트에 속하며 컴포넌트와 함께 폐기됩니다. 이벤트 핸들러나 타이머 콜백에서 만들면 소유자가 없어 영원히 살아 있습니다. 컴포넌트 본문에서 만들고, 변하는 시그널을 읽게 하세요.

**비동기 코드가 추적되기를 기대하는 경우.** effect나 computed 값이 실행되는 동안 동기적으로 수행된 읽기만 추적됩니다. 먼저 시그널을 읽은 다음 비동기 작업을 시작하세요.

<a id="related"></a>

## 관련 문서

- [JSX와 컴포넌트](./jsx-and-components.md): Rust와 TSX의 컴포넌트, props, `when` / `<If>`, `each` / `<Each>`.
- [Rust로 빌드하기](./rust.md): Rust 앱, 태스크, 테마.
- [`nsh` 모듈 레퍼런스](../modules/nsh.md): 모든 TSX 함수의 시그니처.
- [애니메이션](./animation.md): 시그널 없이 UI 스레드에서 애니메이션되는 애니메이션 값.
