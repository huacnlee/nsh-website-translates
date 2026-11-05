---
title: "JSX и компоненты"
description: "Как NSH описывает UI в Rust и в TSX: элементы, компоненты, props, дочерние элементы, управление потоком, refs и spreads, а также как компилятор JSX и билдеры Rust создают одни и те же нативные элементы."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX и компоненты

Приложения NSH описывают свой UI с помощью элементов и компонентов, на Rust или на TSX. Rust строит элементы функциями и типизированными методами-билдерами (`view().gap_4().child(..)`); TSX записывает их как JSX, который компилятор NSH превращает в прямые вызовы того же нативного рендерера, без React и без виртуального DOM. В любом случае компонент — это функция, которая выполняется один раз и строит свою часть дерева. Актуальность UI после этого поддерживает [реактивность](./reactivity.md): привязки, читающие сигналы, отслеживаются нативно, и повторно выполняются только они.

<a id="elements"></a>

## Элементы

Каждый из **host-элементов** опирается на нативное представление. Rust создаёт их функциями из prelude; TSX импортирует их из `nsh` как компоненты, и только `If` и `Each` являются глобальными и не требуют импорта:

| Rust | TSX | Нативное представление | Страница |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: контейнер для раскладки, стилизации и касаний | [View](../elements/view.md) |
| `text(..)` | `<Text>` | Нативное текстовое представление; вложенные текстовые элементы — это spans | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | Представление изображения (локальные ресурсы и URL) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | Виртуализированный список с переиспользованием строк | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | Рисунок, веб-страница, видеоплеер | [Элементы](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` из `nsh/base` | Отображаемый слой | [Элементы](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Управление потоком, собственного представления нет | [Управление потоком](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

В Rust стили — это типизированные методы с теми же именами, что и у утилит Tailwind (`.px_4()`, `.rounded_lg()`, `.bg(..)`), а слушатели событий тоже являются методами (`.on_press(..)`); настройки, специфичные для платформы, имеют собственные методы. В TSX props сохраняют свои имена в camelCase (`onPress`, `allowFontScaling`, `backgroundColor`); каждый элемент принимает `style`, `class` / `classList` ([Tailwind](./tailwind.md)), `ref`, обработчики касаний, props доступности и `testID`, а props, специфичные для платформы, передаются в `ios={{…}}` и `android={{…}}`, причём отправляется только объект текущей платформы:

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

Теги TSX пишутся в PascalCase, чтобы TypeScript проверял каждый из них по привязке, которую он называет: строчный тег проверяется по одному глобальному типу на имя, поэтому обобщённый компонент вроде `List` или `Each` не смог бы вывести тип своих строк из `each` / `of`, а собственные компоненты приложения вообще остались бы без типов. Импорты ничего не стоят во время выполнения: компилятор распознаёт примитивы по их импортам (в том числе по псевдонимам) и создаёт нативный элемент на месте, так что `<View>` — это прямой вызов рендерера, а импорт удаляется из бандла. Тег в нижнем регистре — ошибка сборки, в которой сказано, что нужно написать:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> Текст отображается только внутри текстового элемента: `text(..)` в Rust, `<Text>` в TSX. Строка, помещённая прямо в `<View>`, не создаёт нативного представления и не отображается.

<a id="components"></a>

## Компоненты

Внешний вид приложения — это дело самого приложения. NSH предоставляет два слоя: примитивы (элементы выше, стили, классы Tailwind) и базовые компоненты без стилей из [`nsh/base`](../modules/nsh-base.md) (`nsh_base` в Rust), которые отвечают за такое поведение, как навигация, диалоги, клавиатура, строка состояния и безопасные области. Третий слой, библиотека компонентов, ваш: кнопки, карточки и все остальные части вашего UI — это компоненты, которые вы пишете на этих двух слоях, в крейте приложения ([Building with Rust](./rust.md)) или на TSX, либо библиотека от сообщества ([Three layers](./architecture.md#three-layers)).

Компонент на Rust — это `#[component] fn`, который принимает структуру props (а если у него есть события, то ещё и `Scope` для их отправки) и возвращает свои элементы. `#[component]` также создаёт его конструктор — имя функции в snake case: `Badge` размещается с помощью `badge()`, как `view()` размещает представление, с сеттером для каждого prop (`.label(..)`, `.color(..)`: значение, сигнал или замыкание). Компонент на TSX — это функция, которая принимает объект props и возвращает JSX:

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

Функция выполняется **один раз**, при создании компонента, и не отслеживает то, что читает: повторного рендеринга нет. Код в её теле (создание сигналов, запуск эффектов, вычисление констант) выполняется один раз. Возвращаемые ею элементы остаются связанными с props и сигналами, которые они читают, поэтому `Badge` выше обновляет свой текст при каждом изменении `unread`, не запуская `Badge` снова.

Пишите `#[component]`, когда у UI есть собственные props или события, либо когда его импортирует точка входа на TSX: компонент на Rust регистрируется под своим типом (`registry.register::<Badge>()`), а типы props берутся из структуры ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). Для фрагмента UI, который использует только Rust, достаточно обычной функции, возвращающей `impl IntoElement`, а её аргументы и есть props. В TSX компонент может вернуть элемент, строку или число, массив, `null` или функцию, возвращающую любое из этого (которую отслеживает рендерер); тип `Component<P>` из `nsh` описывает такое значение:

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

### Что выполняется повторно

Значение, переданное элементу, задаётся один раз; привязка следует за тем, что читает. В Rust привязка — это замыкание (или сигнал, memo, prop), переданное туда, где ожидается значение. В TSX компилятор решает это для каждого выражения в JSX: выражение изменяется, если оно **вызывает функцию или читает свойство** (вне вложенных функций), а всё остальное задаётся один раз:

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

Изменяющийся prop или дочерний элемент — это небольшой нативный эффект, который задаёт именно этот prop или заменяет именно этот дочерний элемент. Стили в Rust сравниваются построчно, поэтому изменившийся стиль отправляет только изменённые свойства.

Обработчики событий задаются один раз: замыкание в Rust, функция или имя в TSX (`onPress={() => …}`, `onPress={save}`). В TSX остальные выражения отслеживаются (`onPress={props.onPress}` следит за prop).

<a id="props"></a>

### Свойства (props)

Props компонента на Rust — это поля его структуры `#[derive(Props)]`, каждое из которых имеет тип `Prop<T>`: значение либо привязка, переданная родителем. Прочитайте prop в привязке (`text(props.title)`, `move || props.title.get()`), чтобы следовать за ним; `props.title.get()` в теле читает его один раз. Поля с `#[prop(default)]` или `#[prop(default = …)]`, а также `Option`, необязательны. Конструктор начинает каждый prop со значения по умолчанию, а родитель вызывает сеттеры только тех, которые ему нужны: `badge().label("New")`.

Prop в TSX, которому передано изменяющееся выражение, передаётся как геттер: чтение `props.title` вызывает его, благодаря чему JSX, который его читает, следует за ним. Статические props — это обычные значения. В обоих случаях props читаются там, где используются:

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

Компонент на TSX, который разбирает props прямо в параметре, `function Title({ text }: …)`, читает их так же один раз, и сборка предупреждает об этом, указывая, какие props читать вместо них:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

Prop, который компоненту нужен лишь один раз, например начальный id, читается в теле (`props.id.get_untracked()`, `const { id } = props;`), что явно об этом говорит.

В TSX то же относится к значениям по умолчанию: пишите `props.color ?? "#ddf4ff"` в JSX, а не деструктурируйте со значением по умолчанию. Чтобы вычислить что-то из props, используйте замыкание или [`computed`](./reactivity.md#computed):

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

### Дочерние элементы (children)

То, что родитель помещает в компонент, приходит как его children: поле `children: Prop<Children>` в Rust, которое родитель заполняет с помощью `.child(..)`; `props.children` в TSX — геттер, который при чтении строит эти элементы:

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

В TSX каждое чтение `props.children` заново строит дочерние элементы (новые нативные представления): читайте его один раз, в том месте, куда children попадают. Среди нескольких дочерних элементов тот, который изменяется (`<If>`, `<Each>`, `{cond() ? a : b}`), приходит как функция, и `{props.children}` обновляет только его: соседние элементы сохраняют свои представления, а поле ввода — свой текст и фокус. Фрагменты (`<>…</>`) группируют элементы без представления.

Дочерние элементы также можно создавать функцией, которую компонент вызывает с аргументами, — render callback:

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

## Управление потоком

`when` и `each` в Rust, `<If>` и `<Each>` в TSX — встроенные конструкции управления потоком. Они не создают собственного представления.

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

- **`when`** / **`<If>`** показывает свою ветку, пока условие выполняется, иначе — ветку `otherwise` / `else`. Ветка рендерится заново, только когда меняется то, выполняется ли условие, а не при каждом повторном вычислении условия. В TSX дочерняя функция получает accessor значения `when` с типом без `null` и `undefined`: `u()` — это пользователь, пока ветка показана, и accessor следует за ним при изменении.
- **`each`** / **`<Each>`** рендерит строку для каждого элемента с помощью своей функции строки. Строки хранятся по ключу (Rust: функция ключа; TSX: `key`, по умолчанию сам элемент, объекты по идентичности, а примитивы по значению): при изменении списка сохранённые строки перемещаются, а не пересоздаются, и новые строки создаются только для новых ключей. Функция строки получает **сигналы** элемента и его индекса (`todo.get()` и `index.get()` в Rust, `todo()` и `index()` в TSX), потому что элемент и позиция сохранённой строки могут измениться. В TSX `key="index"` (или `key={(item, i) => i}`) вместо этого сохраняет строки по позиции: список строк, изменяющийся на месте, например поступающий потоком текст, сохраняет свои строки, и меняется только их `item()`.

Выбор, сделанный в замыкании (`dynamic(move || if busy.get() { … } else { … })` в Rust, тернарный оператор или `&&` в TSX), заново строит свою ветку при каждом изменении всего, что оно читает. Предпочитайте `when` / `<If>`, когда ветка состоит более чем из нескольких элементов.

Для длинных или бесконечных списков используйте [`List`](./lists.md) (`virtual_list` в Rust): он создаёт представления только для строк на экране и переиспользует их. Подробности см. в [Control flow](../elements/control-flow.md).

<a id="refs"></a>

## Ссылки (refs)

Ref именует host-элемент для императивных вызовов: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([где находится представление](./touch-and-gestures.md#where-a-view-is-measure)), ... В Rust `element_ref()` создаёт его, а `.element_ref(&handle)` помещает на элемент; в TSX `ref` даёт вам ref элемента, тип которого совпадает с типом самого элемента (здесь `InputRef`, для `View` — `ViewRef`; см. [методы ref](../elements/index.md#ref-methods)):

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

Ref в Rust — это дескриптор `Copy`; его вызовы направляются элементу, который его несёт, и ничего не делают, когда его владелец исчез. В TSX то, что называет `ref={…}`, получает узел:

- переменной, объявленной с `let`, он присваивается;
- полю (`ref={refs.input}`, `ref={refs[name]}`) он присваивается;
- [сигналу](./reactivity.md) он устанавливается, так что то, что читает сигнал, следует за ним;
- функция вызывается с ним (`<Scroll ref={(node) => (scroller = node)} />`).

`const` или импорт содержит сигнал или функцию, как в `const input = signal<InputRef>()` с `<Input ref={input} />` и `input()?.focus()`; всё, что содержит что-то другое, сообщается при создании элемента с указанием, что нужно написать.

Ref устанавливается при создании элемента, до возврата из компонента, поэтому он доступен в [эффектах](./reactivity.md#effect) и обработчиках событий. Вызовы отправляются в представление по порядку вместе с изменениями, сделанными до них. Базовые компоненты и компоненты на Rust из вашего собственного крейта тоже принимают `ref` (в Rust `component_ref()`, помещается на элемент с помощью `.component_ref(&r)`: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## Передача props через spread

В Rust родитель вызывает сеттеры нужных ему props, а остальные сохраняют значения по умолчанию, и обёртка передаёт свои `Prop` дальше как есть (`card().title(props.title)`): `Prop` продолжает следовать за тем, что ему передали.

В TSX распространите объект props на элемент или компонент с помощью `{...props}`. Геттеры остаются геттерами, поэтому распространённые props продолжают следовать за тем, что читают. Чтобы взять часть props себе, а остальные передать дальше, используйте `split`:

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

`split(props, keys)` возвращает `[picked, rest]`, оба по-прежнему читают значения из исходных props (деструктуризация `{ label, ...rest } = props` прочитала бы каждый prop один раз). Props элемента, которые идут в JSX позже, имеют приоритет над более ранними.

`<If>` и `<Each>` не принимают распространяемых props, а spread для дочерних элементов (`{...items}`) не поддерживается: используйте `<Each>` или выражение-массив.

<a id="tags-and-names"></a>

## Теги и имена

Элемент в Rust — это всё, что вызывает код: функция примитива, конструктор компонента (`badge()`, `nsh_base::button()`) или ваша собственная функция. Тег TSX называет привязку, находящуюся в области видимости, как обычно: `<Badge />`, `<Theme.Provider>`, ваш собственный `<Button>`. Тег, который не называет ничего в области видимости, — ошибка сборки, за исключением `<If>` и `<Each>`, которые являются глобальными.

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

`Button` у `nsh_base` (`button()` в Rust, `<Button>` из `nsh/base`) — это цель нажатия без стилей с состояниями disabled и selected и их доступностью; внешний вид ей придаёт приложение: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

В TSX ваши привязки имеют приоритет над глобальными: компонент с именем `Each` в области видимости делает `<Each>` этим компонентом. Примитив распознаётся по своему импорту, так что `import { View as Box } from "nsh"` делает `<Box>` представлением, а ваш собственный компонент с именем `Text` — это просто ваш компонент. Примитивы — тоже настоящие компоненты: `const Tag = inline ? Text : View;` и затем `<Tag>…</Tag>` работает.

Компоненты типизируются своими собственными объявлениями: структуры props в Rust проверяет компилятор, а props компонента на TSX TypeScript проверяет везде, где он используется, без какой-либо генерации. Для компонента на Rust, который импортирует точка входа на TSX, объявления TypeScript генерируются из его структуры.

<a id="mounting-and-the-root"></a>

## Монтирование и корень

Корень приложения на Rust — это компонент, который называет `"root"` у `nsh.json`; `nsh run` и `nsh package` монтируют его. Точка входа на TSX вызывает `mount(App)`, чтобы отрендерить корневой компонент (`mount(App, props)` передаёт ему props). Корневое представление заполняет поверхность (окно или представление, в которое приложение встраивает NSH). Задайте корню `flex: 1`, чтобы он заполнял экран, и цвет фона: собственный фон поверхности зависит от платформы.

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

## См. также

- [Реактивность](./reactivity.md): сигналы, эффекты, контекст.
- [Элементы](../elements/index.md): все host-элементы и их props.
- [Стилизация](./styling.md) и [Tailwind](./tailwind.md): внешний вид ваших компонентов.
- [Разработка на Rust](./rust.md): приложения на Rust, компоненты в собственном crate вашего приложения и TSX поверх.
