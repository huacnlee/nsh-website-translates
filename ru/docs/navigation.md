---
title: "Навигация"
description: "Нативные навигационные стеки с createNavStack, NavStack и NavPage, заголовки на каждой платформе, удержание пользователя на странице с помощью popOnBack, диалоги и кнопка «Назад» на Android."
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# Навигация

`nsh_base` (TSX: `nsh/base`) предоставляет нативный стек навигации и нативные диалоги. Стек навигации (`nav_stack()` в Rust, `NavStack` в TSX) — это UINavigationController на iOS с его заголовком, свайпом назад и большими заголовками, а на Android — стек с тулбаром и предиктивным жестом «назад». На десктопах и в вебе каждая страница показывает заголовок, который рисует ваше приложение. Маршруты вы храните в своём состоянии; стек отображает каждый маршрут как страницу и держит её смонтированной вместе с её состоянием, пока она находится в стеке.

В Rust импортируйте билдеры по имени рядом с прелюдией (`use nsh_base::{dialog, nav_page, nav_stack};`; системные алерты — `nsh_base::alert_dialog()`). Маршруты — это сигнал, а дочерние элементы стека — его страницы, по одной на маршрут, различаемые по ключу (`each`): страница добавляется, чтобы выполнить push, и убирается, чтобы выполнить pop. В TSX `createNavStack` хранит маршруты, а `NavStack` их отображает.

```rust tabs
use nsh_base::{nav_page, nav_stack};
use nsh_core::prelude::*;

#[derive(Debug, Clone, PartialEq)]
enum Route {
    Inbox,
    Message(u32),
}

/// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
fn header(routes: Signal<Vec<Route>>, title: &'static str) -> impl IntoElement {
    view()
        .h(px(48.0))
        .flex_row()
        .items_center()
        .gap_3()
        .border_b_1()
        .border_color(rgb(0xe5e7eb))
        .px_4()
        .child(when(
            move || routes.with(|r| r.len() > 1),
            move || {
                text("Back")
                    .role(AccessibilityRole::Button)
                    .on_press(move || routes.update(|r| { r.pop(); }))
                    .text_color(rgb(0x2563eb))
                    .active(|s| s.opacity(0.6))
            },
        ))
        .child(text(title).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
}

fn inbox(routes: Signal<Vec<Route>>) -> Screen {
    nav_page()
        .title("Inbox")
        .header(header(routes, "Inbox"))
        .child(scroll().flex_1().children((1..=5).map(move |id| {
            view()
                .on_press(move || routes.update(|r| r.push(Route::Message(id))))
                .p_4()
                .active(|s| s.bg(rgb(0xf3f4f6)))
                .child(text(format!("Message {id}")))
        })))
}

fn message(routes: Signal<Vec<Route>>, id: u32) -> Screen {
    nav_page()
        .title(format!("Message {id}"))
        .header(header(routes, "Message"))
        .child(view().flex_1().p(px(16.0)).child(text(format!("The body of message {id}."))))
}

#[component]
pub fn App() -> impl IntoElement {
    let routes = signal(vec![Route::Inbox]);
    nav_stack().flex_1().child(each(
        move || routes.get(),
        |route: &Route| format!("{route:?}"),
        move |route, index| {
            let page = match route.get_untracked() {
                Route::Inbox => inbox(routes),
                Route::Message(id) => message(routes, id),
            };
            // The user went back natively: drop the route (and those above it).
            page.on_dismiss(move || routes.update(|r| r.truncate(index.get_untracked())))
        },
    ))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "inbox" } | { name: "message"; id: number };

const nav = createNavStack<Route>([{ name: "inbox" }]);

// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
function Header(props: { title: string }) {
  return (
    <View class="h-12 flex-row items-center gap-3 border-b border-gray-200 px-4">
      <If when={nav.routes().length > 1}>
        <Text role="button" onPress={() => nav.pop()} class="text-blue-600 active:opacity-60">
          Back
        </Text>
      </If>
      <Text style={{ fontSize: 17, fontWeight: "600" }}>{props.title}</Text>
    </View>
  );
}

function Inbox() {
  return (
    <NavPage title="Inbox" header={<Header title="Inbox" />}>
      <Scroll style={{ flex: 1 }}>
        <Each of={[1, 2, 3, 4, 5]}>
          {(id) => (
            <View onPress={() => nav.push({ name: "message", id: id() })} class="p-4 active:bg-gray-100">
              <Text>Message {id()}</Text>
            </View>
          )}
        </Each>
      </Scroll>
    </NavPage>
  );
}

function Message(props: { id: number }) {
  return (
    <NavPage title={`Message ${props.id}`} header={<Header title={`Message ${props.id}`} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The body of message {props.id}.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => {
        switch (route.name) {
          case "inbox":
            return <Inbox />;
          case "message":
            return <Message id={route.id} />;
        }
      }}
    </NavStack>
  );
}

mount(App);
```

<a id="the-stacks-state"></a>

## Состояние стека

В Rust маршруты — это ваш собственный сигнал (`signal(vec![..])` или `global::<Routes>()` для сигнала, доступного всему приложению), а push, pop и replace выполняются обновлением этого сигнала: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. Ключ каждой страницы (здесь это текст `Debug` маршрута) сообщает стеку, какая страница какая, поэтому страницы, чьи маршруты остаются, сохраняют своё состояние; для маршрутов, которые могут повторяться, задавайте уникальный ключ. Обрабатывайте `on_dismiss` каждой страницы: пользователь вернулся назад нативным способом, и маршрут (вместе с вышележащими) исчезает из вашего сигнала.

В TSX `createNavStack(routes)` создаёт состояние стека из массива маршрутов, снизу вверх. Маршрут — любое значение на ваш выбор (строка, объект, размеченное объединение, как выше), и каждый push создаёт отдельную страницу, в том числе при повторном добавлении того же маршрута. Создавайте состояние один раз, на уровне модуля или в корневом компоненте, и импортируйте его везде, где страницы выполняют навигацию.

| Элемент | Описание |
|---|---|
| `routes()` | Маршруты снизу вверх (реактивно). |
| `push(route)` | Добавляет страницу. |
| `pop(count?)` | Убирает `count` страниц (по умолчанию 1); хотя бы одна остаётся. |
| `popToRoot()` | Возвращается к первой странице. |
| `replace(route)` | Заменяет верхнюю страницу. |
| `setRoutes(routes)` | Заменяет страницы, например после входа в аккаунт; маршрут, который остаётся (то же значение), сохраняет свою страницу и её состояние. |
| `remove(route)` | Удаляет самую верхнюю страницу из `route`, где бы она ни находилась. |

Чтобы начать сразу с нескольких страниц в глубину, передайте больше маршрутов: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

Когда пользователь покидает страницу нативным способом (кнопка «назад» в заголовке, свайп назад на iOS, кнопка или жест «назад» на Android, клавиши и кнопка мыши «назад» на десктопах, кнопка «назад» в браузере), стек в TSX сам удаляет этот маршрут из своего состояния, так что `routes()` всегда соответствует тому, что на экране; страница в Rust сообщает об этом через `on_dismiss`, как описано выше.

Маршрут несёт то, что нужно странице. Приложения-галереи добавляют маршруты, которые содержат то, из чего строится страница, — так тип маршрута остаётся небольшим, даже когда страниц много:

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

/// A pushed page: its key (unique in the stack) and what makes it.
#[derive(Clone)]
pub struct Route {
    pub key: SharedString,
    pub page: Rc<dyn Fn() -> Screen>,
}

impl PartialEq for Route {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
}

/// The pushed pages, bottom to top: one signal for the whole app.
#[derive(Default, Clone)]
pub struct Routes(pub Vec<Route>);

pub fn routes() -> Signal<Routes> {
    global::<Routes>()
}

// Elsewhere: routes().update(|r| r.0.push(Route { key: "settings".into(), page: Rc::new(settings) }));
```

```ts tabs
import { type JSX } from "nsh";
import { createNavStack } from "nsh/base";

export type Route = { name: "home" } | { name: "page"; page: () => JSX.Element };
export const nav = createNavStack<Route>([{ name: "home" }]);

// Elsewhere: nav.push({ name: "page", page: Settings });
```

## NavStack

В Rust `nav_stack()` — это view, дочерние элементы которого являются его страницами, снизу вверх; стилизуйте его как любой view (`.flex_1()`). В TSX:

| Свойство | Тип | Описание |
|---|---|---|
| `state` | `NavStackState<R>` | Маршруты для отображения. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | Отображает маршрут; верните `<NavPage>` для его заголовка. |
| `style`, `class` | | Собственный стиль стека (обычно `flex: 1`). |

Функция отрисовки выполняется один раз для каждого маршрута, в момент его добавления; `route` — это обычное значение, `index()` — его текущая позиция. То, что она возвращает, становится содержимым страницы. Верните `<NavPage>`, чтобы задать заголовок; всё остальное оборачивается в страницу с параметрами по умолчанию.

Страницы остаются смонтированными, пока их маршрут находится в стеке: при возврате назад предыдущая страница выглядит точно так, как её оставили, — с позицией прокрутки, полями ввода и сигналами. Обработчики [`cleanup`](./reactivity.md) страницы выполняются, когда её маршрут покидает стек.

<a id="navpage-and-the-header"></a>

## NavPage и заголовок

Страница (`nav_page()` в Rust, `NavPage` в TSX) оборачивает содержимое страницы и несёт её заголовок. iOS и Android показывают системный заголовок, настроенный через title и параметры заголовка. Десктопы и веб показывают слот заголовка страницы (`.header(..)`, в TSX `header`) — ваши собственные view в верхней части страницы: по ширине страницы, той высоты, какую задаёт раскладка, а содержимое находится под ним. Задайте странице и то и другое, как в примере выше, и она будет выглядеть естественно везде. Все параметры реактивны: измените сигнал, и заголовок последует за ним.

В Rust каждое свойство ниже — это метод `nav_page()` в snake case: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`; его дочерние элементы — это его содержимое.

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `header` | `JSX.Element` | | Десктопы и веб: заголовок страницы, который рисует приложение (title, кнопка «назад», кнопки тулбара). |
| `title` | `string` | | iOS и Android: title системного заголовка. |
| `headerVisible` | `boolean` | `true` | iOS и Android: системный заголовок показывается. |
| `headerTransparent` | `boolean` | `false` | iOS и Android: содержимое простирается под заголовок. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS и Android: фон заголовка, цвет title (`color`) и цвет кнопок (`tintColor`). |
| `headerClass` | `string` | | То же, что и classes: `bg-*`, `text-*` для title, `tint-*` для кнопок; `headerStyle` имеет приоритет над ними. |
| `headerBackVisible` | `boolean` | `true` | iOS и Android: кнопка «назад» показывается. |
| `headerLeft` | `JSX.Element` | | iOS и Android: view в начале заголовка (они заменяют кнопку «назад»). |
| `headerRight` | `JSX.Element` | | iOS и Android: view в конце заголовка. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: собственная bar button из UIKit в конце заголовка, с системным видом, символом или подписью, вместо view из `headerRight`; нажатие на неё — это нажатие на первый нажимаемый view из `headerRight`, поэтому держите там один такой view. Android показывает `headerRight` как есть. |
| `ios={{ headerLeftSystemItem }}` | как у `headerRightSystemItem` | | iOS: то же самое, в начале заголовка, по нажатию вызывается `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: собственная bar button из UIKit, показывающая SF Symbol с этим именем (`"slider.horizontal.3"`) вместо view из `headerRight`; нажатие на неё — это нажатие на первый нажимаемый view из `headerRight`, а VoiceOver зачитывает подпись этого view. `headerRightSystemItem` имеет приоритет над ним; имя, которого нет в SF Symbols, приводит к тому, что `headerRight` показывается как есть. Android показывает `headerRight` как есть. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: то же самое, в начале заголовка, по нажатию вызывается `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS и Android: view, заменяющие title. |
| `headerLargeTitle` | `boolean` | `false` | iOS: большой title, который сжимается в панель по мере прокрутки содержимого. |
| `headerBackTitle` | `string` | | Подпись кнопки «назад», ведущей обратно на эту страницу (iOS; стрелка «вверх» на Android произносится экранными читалками). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Как страница появляется и уходит. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS и Android: строка состояния, пока страница наверху ([Status bar](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | Интерактивный жест «назад» (свайп назад на iOS, предиктивный жест «назад» на Android) выполняет pop. Кнопки «назад» выполняют pop в любом случае. |
| `popOnBack` | `boolean` | `true` | Любой способ вернуться назад выполняет pop страницы: кнопки «назад», «назад» на Android, клавиши «назад» на десктопах, кнопка «назад» в браузере и свайп. |
| `onBackPress` | `() => void` | | Пользователь нажал «назад» на странице, независимо от того, позволил ли `popOnBack` выполнить pop. |
| `onDismiss` | `() => void` | | Пользователь убрал страницу; её маршрут уже удалён. |
| `style`, `class` | | | View с содержимым страницы. |

Элементы заголовка — обычные view, поэтому они могут быть нажимаемыми и реактивными:

```rust tabs
fn compose(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let cancel = move || {
        text("Cancel")
            .on_press(move || routes.update(|r| { r.pop(); }))
            .text_size(px(17.0))
            .text_color(rgb(0x0969da))
    };
    let send_button = move || {
        text("Send")
            .on_press(move || send(draft.get()))
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(move || if draft.with(String::is_empty) { rgb(0x8c959f) } else { rgb(0x0969da) })
    };
    nav_page()
        .title("New message")
        .header_left(cancel())
        .header_right(send_button())
        .header(
            view()
                .h(px(48.0))
                .flex_row()
                .items_center()
                .justify_between()
                .px_4()
                .child(cancel())
                .child(text("New message").text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
                .child(send_button()),
        )
        .child(
            input()
                .multiline(true)
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .flex_1()
                .p(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
function Compose() {
  const text = signal("");
  const cancel = () => (
    <Text onPress={() => nav.pop()} style={{ fontSize: 17, color: "#0969da" }}>
      Cancel
    </Text>
  );
  const sendButton = () => (
    <Text
      onPress={() => send(text())}
      style={{ fontSize: 17, fontWeight: "600", color: text() ? "#0969da" : "#8c959f" }}
    >
      Send
    </Text>
  );
  return (
    <NavPage
      title="New message"
      headerLeft={cancel()}
      headerRight={sendButton()}
      header={
        <View class="h-12 flex-row items-center justify-between px-4">
          {cancel()}
          <Text style={{ fontSize: 17, fontWeight: "600" }}>New message</Text>
          {sendButton()}
        </View>
      }
    >
      <Input multiline value={text()} onChange={({ value }) => text.set(value)} style={{ flex: 1, padding: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

Цветной системный заголовок (в Rust `header_style_with` принимает типизированные стили: `bg`, `text_color` и `tint_color` — цвет кнопок заголовка; цвета темы следуют внешнему виду системы):

```rust tabs
nav_page()
    .title("Profile")
    .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(rgb(0xffffff)).tint_color(rgb(0xffffff)))
```

```tsx tabs
<NavPage title="Profile" headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}>
  …
</NavPage>
```

Страница без заголовка всё равно окружена системными панелями; добавьте к её содержимому отступы по insets [безопасной области](../elements/safe-area.md):

```rust tabs
use nsh_base::nav_page;

nav_page()
    .header_visible(false)
    .child(view().flex_1().p_safe_area() /* … */)
```

```tsx tabs
<NavPage headerVisible={false}>
  <View class="flex-1 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)] px-4">…</View>
</NavPage>
```

<a id="safe-areas-under-the-header"></a>

### Безопасные области под заголовком

Внутри страницы переменные `env(safe-area-inset-*)` и insets страницы (`Scope::insets` в Rust, `safeAreaInsets()` в TSX) соответствуют области под системным заголовком, в пределах страницы. При прозрачном заголовке содержимое начинается от верха страницы, а верхний inset равен высоте заголовка, поэтому отступ по `env(safe-area-inset-top)` не даёт тексту оказаться под ним, а фоновое изображение при этом заполняет всю страницу. При большом title помещайте scroll view прямо в страницу, чтобы title мог сворачиваться при прокрутке. На десктопах и в вебе содержимое начинается под слотом заголовка страницы.

<a id="keeping-the-user-on-a-page-poponback"></a>

## Удержание пользователя на странице: popOnBack

Чтобы спросить подтверждение перед отбрасыванием несохранённых изменений, установите `pop_on_back` (в TSX `popOnBack`) в false, пока есть что терять, обработайте нажатие «назад» (`.on_back_press(..)`, в TSX `onBackPress`) и выполните pop, когда пользователь согласится:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| { r.pop(); });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || draft.with(String::is_empty))
        .on_back_press(move || {
            if !draft.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .placeholder("A note")
                .m(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const dirty = () => text().length > 0;
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Discard your changes?",
      actions: [
        { label: "Keep editing", role: "cancel", id: "keep" },
        { label: "Discard", role: "destructive", id: "discard" },
      ],
    });
    if (action === "discard") nav.pop();
  };
  return (
    <NavPage title="Edit" popOnBack={!dirty()} onBackPress={() => dirty() && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" style={{ margin: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

При `pop_on_back(false)` (`popOnBack={false}`) страница остаётся при любом способе вернуться назад (кнопки «назад», кнопка и жест «назад» на Android, клавиши «назад» на десктопах, кнопка «назад» в браузере, свайп), а событие нажатия «назад» сообщает вам о попытке пользователя. Pop из кода (удаление маршрута, `nav.pop()`) работает как обычно.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` — это свойство, а не колбэк, возвращающий true или false, потому что главный поток никогда не ждёт код приложения. Когда пользователь начинает свайп или нажимает «назад», система сразу спрашивает, можно ли покинуть страницу, и NSH отвечает нативно, исходя из уже имеющихся у него свойств. Устанавливайте его, как только появляется что терять (как выше, по тексту), до того как пользователь попытается уйти.

`pop_on_swipe(false)` (`popOnSwipe={false}`) — более мягкий вариант: он отключает только интерактивный жест (свайп назад на iOS, анимацию предиктивного «назад» на Android), а кнопки «назад» по-прежнему выполняют pop.

<a id="dialogs"></a>

## Диалоги

Диалог (`dialog()` из `nsh_base` в Rust, `Dialog` в TSX) показывает содержимое поверх всего остального, в собственном нативном оконном слое: presented view controller на iOS, окно диалога на Android, слой поверх всего окна на десктопах и в вебе. Его внешний вид определяете вы. В Rust диалог показывается, пока он находится в view (внутри `when`), а его дочерние элементы заполняют его: фон-подложку и всплывающее окно рисуйте как view. В TSX `class` и `style` стилизуют всплывающее окно, которое содержит дочерние элементы, `backdropClass` или `backdropStyle` добавляют подложку за ним, а `open` управляет им:

```rust tabs
use nsh_base::dialog;
use nsh_core::prelude::*;

pub fn files() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .child(view().on_press(move || open.set(true)).p(px(16.0)).child(text("Delete the file")))
        .child(when(
            move || open.get(),
            move || {
                dialog()
                    .animation(ModalAnimation::Fade)
                    // Escape, Android's back button, a swipe down on a sheet.
                    .on_cancel(move || open.set(false))
                    .child(
                        // The backdrop and the popup are the app's views.
                        view()
                            .flex_1()
                            .bg(rgba(0x00000066))
                            .items_center()
                            .justify_center()
                            .on_press(move || open.set(false))
                            .child(
                                view()
                                    .w(px(320.0))
                                    .gap_3()
                                    .rounded_2xl()
                                    .bg(white())
                                    .p_5()
                                    .on_press(|| {})
                                    .child(text("Delete the file?").text_size(px(20.0)).font_weight(FontWeight::BOLD))
                                    .child(
                                        view()
                                            .on_press(move || open.set(false))
                                            .child(text("Delete").text_color(rgb(0xcf222e))),
                                    ),
                            ),
                    )
            },
        ))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Dialog } from "nsh/base";

function Files() {
  const open = signal(false);
  return (
    <View style={{ flex: 1 }}>
      <View onPress={() => open.set(true)} style={{ padding: 16 }}>
        <Text>Delete the file</Text>
      </View>
      <Dialog
        open={open()}
        animation="fade"
        onOpenChange={(e) => open.set(e.open)}
        backdropClass="bg-black/40"
        class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete the file?</Text>
        <View onPress={() => open.set(false)}>
          <Text style={{ color: "#cf222e" }}>Delete</Text>
        </View>
      </Dialog>
    </View>
  );
}
```

Escape, кнопка «назад» на Android, нажатие на подложку (подложка в TSX, нативный sheet в Rust) и свайп вниз по sheet закрывают диалог нативно (`close_on_escape`, `close_on_backdrop_press` и `close_on_swipe`, в TSX `closeOnEscape`, `closeOnBackdropPress` и `closeOnSwipe`, каждое по умолчанию true). В Rust `on_cancel` сообщает о каждой попытке, а `on_close` — о закрытии, поэтому там нужно убрать диалог из view; подложка, нарисованная вашим приложением, закрывает его собственным обработчиком нажатия, как выше. В TSX об этом сообщает `onOpenChange({ open: false, reason })`, поэтому там установите `open` в `false`. Чтобы сначала запросить подтверждение, установите флаг в false и обработайте событие отмены (`on_cancel`, `onCancel`), которое сообщает о каждой попытке, а затем закройте диалог самостоятельно. На iOS `.presentation(ModalPresentation::PageSheet)` или `FormSheet` (`presentation="pageSheet"` или `"formSheet"`) показывает sheet, оставляющий то, что за ним, видимым.

Все свойства см. в [Dialog](../elements/dialog.md). Внутри диалога переменные `env(safe-area-inset-*)` и insets — собственные для диалога. Для системных диалогов (алерт с действиями, action sheet) используйте [`AlertDialog`](../modules/nsh-base.md#alertdialog) из `nsh_base` (TSX: `nsh/base`).

<a id="the-android-back-button"></a>

## Кнопка «назад» на Android

На Android кнопка (или жест) «назад» обрабатывается в таком порядке:

1. Верхний диалог: он сообщает об отмене (`on_cancel`, `onCancel`) и закрывается, пока `close_on_escape` / `closeOnEscape` равно true (по умолчанию).
2. Ваши слушатели «назад» (`on_back_press` в Rust, `BackHandler` из `nsh/mobile` в TSX), начиная с добавленных последними.
3. Верхний стек: его верхняя страница сообщает о нажатии «назад» и выполняет pop, пока `pop_on_back` / `popOnBack` равно true.
4. Никто не обработал нажатие: приложение закрывается.

Слушатель возвращает `true`, когда он обработал нажатие, и это не даёт стеку выполнить pop. Пока зарегистрирован слушатель, жест «назад» на Android не показывает предварительный просмотр pop (приложение отвечает только после завершения жеста), поэтому добавляйте слушателей только на то время, пока они могут перехватить нажатие:

```rust tabs
use nsh_core::prelude::*;

pub fn editor() -> impl IntoElement {
    let selecting = signal(false);
    // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
    effect(move || {
        if selecting.get() {
            on_back_press(move || {
                selecting.set(false);
                true
            });
        }
    });
    // …
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { BackHandler } from "nsh/mobile";

function Editor() {
  const selecting = signal(false);
  // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
  effect(() => {
    if (selecting()) {
      BackHandler.on("press", () => {
        selecting.set(false);
        return true;
      });
    }
  });
  // …
}
```

Слушатель, созданный в эффекте, живёт до следующего запуска эффекта или до удаления его компонента; в TSX его также останавливает функция, которую возвращает `BackHandler.on`. В TSX `BackHandler.exitApp()` закрывает приложение; `nsh/mobile` можно импортировать и на iOS, где вызовы `BackHandler` возвращаются сразу, так что один и тот же код работает на обеих платформах. См. [Platform-specific code](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## Вкладки и другие раскладки

Панель вкладок — это ваш собственный UI, собранный из примитивов: ряд нажимаемых view и сигнал, хранящий выбранную вкладку; содержимое выбранной вкладки отображайте через [`when` / `<If>`](../elements/control-flow.md) (или дочернюю функцию в TSX). Чтобы сохранять состояние каждой вкладки при переключении, дайте каждой вкладке собственный стек и маршруты и держите все они смонтированными, скрывая неактивные через `display: none`.

<a id="related"></a>

## См. также

- [`nsh/base`](../modules/nsh-base.md): справочник по `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` и `Dialog`; [Safe area](../elements/safe-area.md) для insets.
- [Строка состояния](../modules/nsh-base.md#status-bar) страниц и диалогов.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
