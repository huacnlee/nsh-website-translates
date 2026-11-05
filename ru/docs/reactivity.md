---
title: "Реактивность"
description: "Сигналы, вычисляемые значения, эффекты, ресурсы, batch, untracked, очистка и контекст в Rust и TSX: как NSH обновляет ровно то, что изменилось, и каких ошибок следует избегать."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# Реактивность

NSH обновляет UI с помощью **сигналов** (signals): значений, которые знают, кто их читает. Когда сигнал меняется, NSH заново запускает ровно те вычисления, которые его читали (текст, стиль, эффект), и ничего больше. Компоненты не перерисовываются. Модель взята из Solid, а сам реактивный граф нативный: компоненты на Rust и TSX работают на одном графе, написанном на Rust, поэтому и в TSX планирование, отслеживание зависимостей и очистка происходят вне интерпретатора.

Компоненты на Rust берут всё с этой страницы из prelude; TSX импортирует это из `nsh`:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## Сигналы

`signal(value)` создаёт сигнал. Читайте его через `get()` в Rust и вызовом в TSX; `set` и `update` записывают значение:

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

Чтение внутри отслеживаемой области (привязка, `computed`, `effect`) подписывает эту область на сигнал. Запись уведомляет подписчиков, если значение изменилось: сравнение выполняется через `PartialEq` в Rust и через `===` в TSX.

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

Нажатие обновляет единственный текстовый узел, который читает `count`. Сам `counter()` / `Counter` выполняется один раз. Сигнал в Rust — это handle `Copy`, поэтому замыкания захватывают его через `move` и могут свободно использовать.

Сигнал может считать каждую запись изменением, а TSX позволяет сравнивать значения по-своему:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

В TSX `signal<T>()` без значения начинается с `undefined` и имеет тип `Signal<T | undefined>`; в Rust то же самое выражает `Option` (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### Объекты и массивы

В Rust `update` изменяет значение на месте и уведомляет читателей; `set` заменяет его. В TSX сигналы сравниваются через `===`, поэтому значение, изменённое на месте, не считается изменением: записывайте новый объект или массив.

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

`each` / `<Each>` сопоставляет строки по элементу, поэтому изменение одного элемента перестраивает только его строку ([JSX и компоненты](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` вычисляет значение из других сигналов. Он выполняет `fn`, запоминает результат и запускает его снова, когда меняется прочитанный им сигнал. Читается он как сигнал:

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

Используйте `computed`, когда производное значение читается в нескольких местах или дорого вычисляется: он выполняется один раз на изменение, сколько бы у него ни было читателей, а читатели уведомляются, только когда меняется его результат. Для дешёвого значения, которое читается один раз, достаточно обычного замыкания:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

В TSX `fn` получает предыдущее значение (`undefined` в первый раз), что удобно для накапливаемых значений:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` выполняет `fn` и запускает его снова, когда меняется прочитанный им сигнал. Эффекты предназначены для побочных действий: логирования, таймеров, сетевых запросов, императивных вызовов у [refs](./jsx-and-components.md#refs).

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

Эффект отслеживает чтения, выполненные во время его синхронной работы. Чтения в задаче, в колбэке `.then` или после `await` не отслеживаются.

Эффект, вызывающий [ref](./jsx-and-components.md#refs), действует на элемент, к которому привязан этот ref; в TSX эффекты запускаются после того, как созданы элементы того же прохода, поэтому refs уже установлены:

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
> Не используйте эффекты, чтобы синхронизировать один сигнал с другим (`effect(() => b.set(a() * 2))`). Используйте `computed`: он никогда не устаревает и не вызывает второй проход. Эффект, который записывает сигнал, который сам же и читает, запускает себя снова и снова, пока NSH не остановит его с ошибкой.

## resource

`resource(source, fetcher)` загружает значение асинхронно и хранит состояние загрузки, поэтому компонент показывает данные, индикатор загрузки или ошибку, не управляя ими сам:

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

`source` отслеживается: всякий раз, когда он выдаёт новое значение, `fetcher(value, info)` загружает данные заново. В Rust это замыкание, возвращающее `Option`, и `None` ничего не загружает; в TSX это accessor (сигнал, функция) или значение, и `undefined`, `null` или `false` ничего не загружают: например, когда пользователь ещё не вошёл или ничего не выбрано. Без источника Rust передаёт `|| Some(())`, а `resource(fetcher)` в TSX загружает один раз, вызывая `fetcher(info)`. Fetcher в Rust возвращает `Result`; в TSX — значение или promise, а выброшенное исключение считается ошибкой загрузки.

| Rust | TSX | Что это |
|---|---|---|
| `quote.get()` | `posts()` | Последнее значение: отсутствует, пока не завершилась первая загрузка; сохраняется при повторной загрузке и после ошибки. |
| `quote.loading()` | `posts.loading()` | Выполняется ли загрузка. |
| `quote.error()` | `posts.error()` | Ошибка последней загрузки; отсутствует, как только загрузка дала значение. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (нечего загружать), `Pending` (первая загрузка), `Ready`, `Refreshing` (повторная загрузка, значение сохраняется), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | Загружает заново из того же источника: повторная попытка, обновление жестом «потянуть». |
| `quote.mutate(value)` | `posts.mutate(value)` | Устанавливает значение локально без загрузки (оптимистичное обновление) и сбрасывает ошибку. |

Ресурс в Rust — это handle `Copy`, как и сигналы; члены в TSX привязаны к ресурсу, поэтому `onRefresh={posts.refetch}` и `const loading = posts.loading` работают как есть.

Учитывается только последняя загрузка. Новая отменяет выполняющуюся, так же как и уничтожение компонента; в TSX `info.signal` прерывает переданный ему `fetch`. Загрузка, которая завершилась после того, как её заменили, ничего не меняет. `info.refetching` означает, что загрузку запустил `refetch()`. `resource_with_value(value, source, fetcher)` в Rust и `{ initialValue }` в TSX задают ресурсу значение с самого начала.

## cleanup

`cleanup(fn)` регистрирует `fn`, который выполнится перед очередным запуском текущего эффекта или когда компонент или эффект, которому он принадлежит, будет уничтожен:

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

В Rust задачи, таймеры и интервалы (`spawn`, `set_timeout`, `set_interval`) уже завершаются вместе с владельцем, под которым были созданы, поэтому собственным часам представления очистка не нужна:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

Эффект в TSX также может вернуть свою очистку, как в React: функция, которую возвращает `fn`, выполняется в те же моменты, что и функция, переданная в `cleanup`.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Компонент уничтожается, когда перестаёт отображаться: его ветка `when` / `<If>` скрыта, его строка `each` / `<Each>` удалена или его страница снята со стека. Всё, что он создал (эффекты, вычисляемые значения, задачи, очистки, вложенные компоненты), уничтожается вместе с ним.

## batch

Каждая запись сразу уведомляет подписчиков. Чтобы несколько записей считались одним изменением, оберните их в `batch`: зависимые вычисления выполнятся один раз, после последней записи.

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

Обработчики событий автоматически не группируются: две записи в обработчике нажатия запустят эффект, читающий оба сигнала, дважды. `batch` возвращает то, что возвращает его функция.

## untracked

`untracked(fn)` выполняет `fn`, не подписываясь на то, что тот читает. Используйте его в отслеживаемой области, чтобы прочитать значение, не завися от него:

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

`get_untracked()` в Rust читает один сигнал таким же образом. Тело компонента уже не отслеживается: чтение сигнала там происходит один раз.

## context

Контекст — это значение, которое компонент предоставляет всему, что он отображает, на любой глубине. В Rust `provide_context(value)` предоставляет значение своего типа, а `use_context::<T>()` находит ближайшее; в TSX `context(defaultValue)` создаёт контекст, его вызов читает ближайшее предоставленное значение (или значение по умолчанию), а `<Ctx.Provider value>` предоставляет значение:

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

Предоставленное значение читается один раз, в момент поиска. Чтобы предоставить изменяющееся значение, предоставьте сигнал (или структуру сигналов) и читайте его в привязке:

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

Читайте контекст в теле компонента (или в коде, который выполняется во время создания компонентов), а не в обработчике событий или таймере, где нет компонента, от которого можно вести поиск. Компоненты на Rust получают тему приложения тем же способом: `theme()` из `nsh_base` ([Тема](./rust.md#theme)).

<a id="error-boundaries"></a>

## Границы ошибок

Граница ошибок (error boundary) удерживает сбой в пределах одной части представления. Когда что-то под ней выбрасывает исключение (в Rust — паникует) при отрисовке или выполнении, например в теле компонента, привязке, эффекте или обработчике события, упавшая часть удаляется, а на её месте граница показывает fallback; остальное представление остаётся как есть. В Rust это `catch_error(view, fallback)`; в TSX — `<ErrorBoundary fallback>` из `nsh`. Fallback получает ошибку (в TSX — само выброшенное значение, обычно `Error`) и reset, который отображает представление заново:

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

Сбой попадает в ближайшую границу выше места, где он произошёл, а сбой внутри fallback — в границу выше неё. Без границы сбой сообщается как необработанная ошибка (оверлей ошибок разработки, лог). В TSX элемент `fallback` показывается как есть (`fallback={<Text>Unavailable</Text>}`), а функция вызывается с ошибкой и `reset`, какие бы параметры она ни объявляла.

<a id="what-runs-and-when"></a>

## Что и когда выполняется

| Вы пишете | Выполняется | Выполняется снова, когда |
|---|---|---|
| Тело компонента | Один раз, при создании | Никогда (кроме hot reload) |
| Привязка: замыкание, переданное в `text`, стиль или проп в Rust; `{expr}` или `prop={expr}`, которые вызывают или читают свойство, в TSX | Один раз, при создании элемента | Меняется прочитанный ею сигнал; обновляется только этот проп или дочерний элемент |
| `computed(fn)` | При создании | Меняется прочитанный им сигнал |
| `effect(fn)` | После того как созданы элементы текущего прохода | Меняется прочитанный им сигнал |
| `when(cond, ..)` / `<If when>` | При создании | Меняется выполнение условия |
| Строка `each(..)` / `<Each of>` | Когда её ключ появляется впервые | Никогда; вместо этого меняются сигналы её элемента и индекса |

Окружение реактивно таким же образом: `window()`, `dark()`, `font_scale()`, `safe_area()` и `keyboard_height()` в Rust, `windowSize()`, `colorScheme()` и `fontScale()` из [`nsh`](../modules/nsh.md#device), а также `safeArea()` и `keyboardFrame()` из [`nsh`](../modules/nsh.md) в TSX, поэтому привязки, которые их читают, следуют за поворотом экрана, тёмной темой или клавиатурой.

<a id="common-mistakes"></a>

## Типичные ошибки

**Чтение сигнала в теле компонента в расчёте на обновления.**

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

**Однократное чтение пропов.** Проп в Rust, прочитанный через `props.title.get()` в теле, читается один раз; читайте его в привязке (`text(props.title)`, `move || props.title.get()`). В TSX `const { title } = props` читает `title` один раз: читайте `props.title` там, где используете, или разделяйте пропы через [`split`](./jsx-and-components.md#spreading-props).

**Мутация вместо установки значения в TSX.** `list().push(x)` меняет массив, но никого не уведомляет. Записывайте новый массив, как это делает за вас `update` в Rust.

**Вывод состояния через эффекты.** `effect(() => total.set(price() * qty()))` работает, но оставляет `total` устаревшим между записью и эффектом и стоит второго прохода. Используйте `computed`.

**Создание эффектов вне компонентов.** Эффекты и вычисляемые значения принадлежат компоненту, который их создал, и уничтожаются вместе с ним. Если создать их в обработчике события или колбэке таймера, у них не будет владельца и они будут жить вечно. Создавайте их в теле компонента и позволяйте им читать сигналы, которые меняются.

**Ожидание, что асинхронный код отслеживается.** Отслеживаются только чтения, выполненные синхронно во время работы эффекта или вычисляемого значения. Сначала прочитайте сигналы, затем запускайте асинхронную работу.

<a id="related"></a>

## См. также

- [JSX и компоненты](./jsx-and-components.md): компоненты, пропы, `when` / `<If>` и `each` / `<Each>` в Rust и TSX.
- [Разработка на Rust](./rust.md): приложения на Rust, задачи и тема.
- [Справочник модуля `nsh`](../modules/nsh.md): сигнатура каждой функции TSX.
- [Анимация](./animation.md): анимированные значения, которые анимируются в UI-потоке без сигналов.
