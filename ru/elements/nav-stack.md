---
title: "NavStack"
description: "Нативные стеки навигации: NavStack, NavPage и createNavStack, переход на новые страницы и возврат назад (push и pop), слоты заголовка, уход со страницы и то, как каждая платформа отображает стек."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

Навигационный стек показывает одну страницу за раз и сохраняет страницы под ней: `UINavigationController` на iOS и Mac Catalyst, с системным заголовком и свайпом назад, и стек страниц с тулбаром и предиктивным «назад» на Android.
На десктопах (macOS, Windows, Linux, GPUI) и в вебе каждая страница показывает собственный заголовок приложения в верхней части, а клавиши «назад» и кнопка «назад» браузера снимают страницу со стека. `NavStack` — это стек, `NavPage` — одна из его страниц.

Стек отвечает за поведение навигации (переходы, жесты и кнопки «назад», состояние страниц, пока они перекрыты); содержимое страниц и заголовок на десктопах определяет само приложение.

```rust tabs
use nsh_base::{button, nav_page, nav_stack};
use nsh_core::prelude::*;

/// A button with the app's look.
fn action(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text(title).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// The header on the desktops and the web, with a back button over the first page.
fn bar(title: impl Into<SharedString>, routes: Signal<Vec<u32>>) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .px_4()
        .py_3()
        .border_b_1()
        .border_color(rgb(0xe5e5e5))
        .child(when(
            move || !routes.with(Vec::is_empty),
            move || {
                action("Back", move || {
                    routes.update(|r| {
                        r.pop();
                    })
                })
            },
        ))
        .child(text(title.into()).text_lg().font_weight(FontWeight::SEMIBOLD))
}

fn app() -> impl IntoElement {
    // The messages pushed over the inbox, bottom to top.
    let routes = signal(Vec::<u32>::new());
    nav_stack()
        .flex_1()
        .child(
            nav_page()
                .title("Inbox")
                .header(bar("Inbox", routes))
                .child(view().flex_1().p_4().child(action("Open message 1", move || {
                    routes.update(|r| r.push(1))
                }))),
        )
        .child(each(
            move || routes.get(),
            |id: &u32| *id,
            move |id, depth| {
                let title: SharedString = format!("Message {}", id.get_untracked()).into();
                nav_page()
                    .title(title.clone())
                    .header(bar(title, routes))
                    // The user went back natively: this page and those above it are gone.
                    .on_dismiss(move || routes.update(|r| r.truncate(depth.get_untracked())))
                    .child(view().flex_1().p_4().child(text("The message.")))
            },
        ))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { Button, createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "home" } | { name: "detail"; id: number };

const nav = createNavStack<Route>([{ name: "home" }]);

function Action(props: { title: string; onPress: () => void }) {
  return (
    <Button onPress={props.onPress} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center text-base font-semibold text-white">{props.title}</Text>
    </Button>
  );
}

function Bar(props: { title: string }) {
  return (
    <View class="flex-row items-center gap-3 border-b border-neutral-200 px-4 py-3">
      {nav.routes().length > 1 && <Action title="Back" onPress={() => nav.pop()} />}
      <Text class="text-lg font-semibold">{props.title}</Text>
    </View>
  );
}

function Home() {
  return (
    <NavPage title="Inbox" header={<Bar title="Inbox" />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Action title="Open message 1" onPress={() => nav.push({ name: "detail", id: 1 })} />
      </View>
    </NavPage>
  );
}

function Detail(props: { id: number }) {
  const title = `Message ${props.id}`;
  return (
    <NavPage title={title} header={<Bar title={title} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The message.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => (route.name === "home" ? <Home /> : <Detail id={route.id} />)}
    </NavStack>
  );
}

mount(App);
```

На iOS и Android страница показывает системный заголовок с `title` и кнопкой «назад»; на десктопах и в вебе она показывает `header`. Приложение, ориентированное только на телефоны, обходится без `header`; приложение только для десктопов не использует опции системного заголовка. В [руководстве по навигации](../docs/navigation.md) разобрана навигация целого приложения: состояние стека, диалоги, кнопка «назад» на Android и вкладки.

<a id="how-a-stack-works"></a>

## Как работает стек

- Страницы стека — это **маршруты** (routes): произвольные значения на ваш выбор, от низа стека к верху. Маршрут обычно называет страницу и несёт её параметры.
- В TSX маршруты хранятся в состоянии, которое создаёт `createNavStack`. `NavStack` вызывает свою дочернюю функцию один раз для каждого push и показывает результат как страницу. Страница хранится, пока её маршрут находится в стеке, поэтому она сохраняет своё состояние (сигналы, позицию прокрутки, поля ввода), пока её перекрывают другие страницы.
- В Rust дочерние элементы стека — это его страницы: `nav_page()`, помещённая в `nav_stack()`, добавляется в стек, а убранная из него снимается. Храните маршруты в сигнале и отрисовывайте страницы через `each(..)` с ключом по маршруту, чтобы нижние страницы сохраняли своё состояние.
- Каждый push создаёт отдельную страницу, в том числе при повторном добавлении одного и того же значения маршрута.
- Когда пользователь уходит со страницы штатными средствами (кнопка «назад», свайп назад, «назад» на Android, клавиши «назад» на десктопах, «назад» в браузере), страница удаляется. В TSX стек убирает её маршрут из состояния, поэтому `nav.routes()` всегда соответствует тому, что видит пользователь. В Rust страница сообщает `on_dismiss`, и в этом обработчике вы убираете её маршрут (и маршруты выше него).
- В TSX дочерняя функция, которая возвращает не `<NavPage>`, получает страницу с опциями по умолчанию. Верните `<NavPage>`, чтобы задать её заголовок и другие опции.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

Создаёт состояние стека, который начинается с `routes` (от низа к верху). Создайте его один раз, например на уровне модуля, и передайте в `<NavStack state>`. Любой код может импортировать его для навигации.

| Элемент | Описание |
|---|---|
| `routes: Accessor<readonly R[]>` | Маршруты от низа к верху. Реактивное значение. |
| `push(route: R): void` | Добавляет страницу. |
| `pop(count?: number): void` | Снимает `count` страниц (по умолчанию 1). Как минимум одна страница всегда остаётся. |
| `popToRoot(): void` | Возвращается к первой странице. |
| `replace(route: R): void` | Заменяет верхнюю страницу. |
| `setRoutes(routes: R[]): void` | Заменяет страницы; маршрут, который остаётся (то же значение), сохраняет свою страницу и её состояние. |
| `remove(route: R): void` | Удаляет самую верхнюю страницу с `route` (сравнение через `===`), где бы она ни находилась в стеке. |

В Rust те же операции выражаются изменениями сигнала с маршрутами: `routes.update(|r| r.push(route))` добавляет страницу, `r.pop()` снимает, `r.truncate(1)` возвращает к первой оставленной в нём странице, а `routes.set(..)` заменяет страницы.

```rust tabs
routes.update(|r| r.push(7));
routes.update(|r| r.truncate(r.len().saturating_sub(2)));
routes.set(vec![1, 2]);
let depth = move || routes.with(Vec::len);
```

```tsx tabs
nav.push({ name: "detail", id: 7 });
nav.pop(2);
nav.setRoutes([{ name: "home" }, { name: "detail", id: 1 }]);
const depth = () => nav.routes().length;
```

<a id="navstack-props"></a>

## Свойства NavStack

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `state` | страницы — его дочерние элементы | `NavStackState<R>` | Состояние, в котором хранятся маршруты (`createNavStack`). Обязательно. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | Отрисовывает маршрут. Верните `<NavPage>`, чтобы задать его опции. Обязательно. |
| `style`, `class` | методы стиля | | Стиль стека; обычно `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | Находит стек в тестах и `nsh test --trace`. |

Дочерняя функция в TSX получает само значение маршрута и аксессор его позиции в стеке.

<a id="navpage-props"></a>

## Свойства NavPage

`NavPage` — это одна страница стека. Она содержит контент страницы, её `header` на десктопах и в вебе, а также опции системного заголовка на iOS и Android. В Rust `nav_page()` возвращает страницу, а её методы-билдеры называются так же, как свойства, но в snake_case.

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | нет | Десктопы и веб: заголовок страницы, расположенный в верхней части страницы, шириной со страницу и высотой по своей раскладке, с контентом под ним. |
| `title` | `.title(..)` | `string` | нет | iOS и Android: заголовок системного заголовка. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS и Android: системный заголовок показывается. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS и Android: контент простирается под прозрачный системный заголовок. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: системная панель вкладок скрывается, пока эта страница наверху, и уезжает вместе с переходом — той же анимацией, что и страница, при этом панель никогда не пересоздаётся; она возвращается, когда страница снимается. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: большой заголовок, который сжимается в панель при прокрутке контента; контент прокручивается под заголовком. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | нет | iOS и Android: подпись кнопки «назад», которая ведёт обратно на эту страницу (на Android — её описание для скринридеров). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS и Android: кнопка «назад» показывается. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | нет | iOS и Android: контент у переднего края системного заголовка вместо кнопки «назад». |
| `headerRight` | `.header_right(..)` | `JSX.Element` | нет | iOS и Android: контент у заднего края системного заголовка. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | нет | iOS и Android: контент, который заменяет заголовок. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | платформенное | iOS и Android: цвета системного заголовка: фон, цвет заголовка (`color`) и цвет кнопок (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | нет | Те же цвета в виде классов: `bg-*`, `text-*` для заголовка, `tint-*` для кнопок (в Rust `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, цвета темы, следующие за оформлением). `headerStyle` имеет приоритет над ними. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | Кнопки «назад» и свайп назад снимают страницу. См. [Уход со страницы](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | Интерактивный жест «назад» снимает страницу: свайп назад на iOS, предиктивное «назад» на Android, следующее за пальцем. Кнопки «назад» снимают страницу в любом случае. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Как страница появляется и уходит. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | нет | Страница появляется и уходит через шейдер WGSL вместо своего `animation`: `shade(uv)` читает страницу под ней как `sample_from`, а эту страницу как `sample_to`, пока `nsh.progress` меняется от 0 до 1 за `duration` миллисекунд (по умолчанию 350), а при уходе страницы — от 1 обратно к 0. Если система запрашивает уменьшенное движение, страница использует свой `animation`. См. [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | нет | iOS и Android: строка состояния, пока страница наверху. См. [Status bar](../modules/nsh-base.md#status-bar). |
| `style`, `class` | методы стиля | | нет | Стиль страницы. |
| `children` | `.child(..)` | `JSX.Element` | нет | Контент. |
| `testID` | `.test_id(..)` | `string` | нет | Находит страницу в тестах и `nsh test --trace`. |

<a id="navpage-events"></a>

## События NavPage

| Событие | Rust | Описание |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | Пользователь нажал «назад» на странице (кнопка «назад» в заголовке, «назад» на Android, Escape, Alt+Left или кнопка «назад» мыши на десктопах, «назад» в браузере), независимо от того, позволил ли `popOnBack` снять страницу. |
| `onDismiss` | `.on_dismiss(..)` | Пользователь снял страницу (кнопка «назад», свайп); в TSX её маршрут уже удалён, а в Rust вы убираете его здесь. |

<a id="header-slots"></a>

## Слоты заголовка

`header`, `headerLeft`, `headerRight` и `headerTitle` — это слоты: обычные элементы, которые читают сигналы, обрабатывают нажатия и обновляются, пока страница показана. `header` — весь заголовок приложения на десктопах и в вебе; остальные три размещаются в системном заголовке на iOS и Android.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn profile(edit: impl Fn() + 'static) -> Screen {
    nav_page()
        .title("Profile")
        .header(profile_bar())
        .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(white()).tint_color(white()))
        .header_right(text("Edit").text_color(white()).on_press(move || edit()))
        .child(scroll().flex_1())
}
```

```tsx tabs
<NavPage
  title="Profile"
  header={<ProfileBar />}
  headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}
  headerRight={<Text onPress={edit} style={{ color: "#ffffff", fontSize: 17 }}>Edit</Text>}
>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

Контент страницы начинается под заголовком: под непрозрачным системным заголовком на iOS и Android, под `header` на десктопах и в вебе. При `headerTransparent`, `headerLargeTitle` или `headerVisible={false}` на iOS и Android он начинается от верха страницы; используйте [`env(safe-area-inset-top)`](./safe-area.md) или `safeAreaInsets()`, чтобы удерживать его вне зоны заголовка и строки состояния.

На iOS `headerVisible={false}` оставляет свайп назад включённым, пока `popOnSwipe` и `popOnBack` равны true. Принятый интерактивный жест «назад» завершает редактирование в момент начала перехода, поэтому клавиатура скрывается во время перетаскивания. Если переход отменён, фокус возвращается тому же редактору, если его не занял другой элемент управления.

```rust tabs
nav_page()
    .title("Large title")
    .header_large_title(true)
    .child(scroll().flex_1())
```

```tsx tabs
<NavPage title="Large title" headerLargeTitle>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

<a id="leaving-a-page"></a>

## Уход со страницы

`popOnBack={false}` удерживает пользователя на странице, например пока в форме есть несохранённые изменения. Пока значение равно false, свайп назад отключён, а кнопки и клавиши «назад» вызывают `onBackPress`, не снимая страницу. Спросите пользователя, а затем снимите страницу самостоятельно:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<u32>>) -> Screen {
    let note = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| {
                    r.pop();
                });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || note.with(String::is_empty))
        .on_back_press(move || {
            if !note.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(note)
                .on_change(move |v: &str| note.set(v.to_owned()))
                .placeholder("A note"),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
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
    <NavPage title="Edit" popOnBack={text().length === 0} onBackPress={() => text().length > 0 && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" />
    </NavPage>
  );
}
```

> [!IMPORTANT]
> Система спрашивает, можно ли пользователю вернуться назад, в главном потоке, в момент действия пользователя, а главный поток никогда не ждёт ни JS, ни вашего кода на Rust. Поэтому NSH отвечает по уже смонтированному значению `popOnBack`. Установите `popOnBack={false}`, как только появится что терять, до того как пользователь пойдёт назад.

`onBackPress` вызывается при каждом нажатии «назад», в том числе когда страница снимается, поэтому он же сообщает, что пользователь вернулся назад. Чтобы отключить только жест свайпа и оставить кнопки «назад», используйте `popOnSwipe={false}`. Само подтверждение — это [AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## Заметки по платформам

- **iOS**: `UINavigationController` с системным заголовком, кнопкой «назад» и свайпом назад; `headerLargeTitle` — это большой заголовок UIKit. Изменения стека, поступившие во время выполняющегося перехода, применяются после его завершения.
- **Android**: стек с тулбаром. Системная кнопка «назад» снимает верхнюю страницу, с предиктивным «назад» на версиях Android, где оно есть; описание стрелки «вверх» для скринридеров — это `headerBackTitle` нижней страницы или системное. Чтобы обрабатывать кнопку «назад» самостоятельно, см. `BackHandler` в [`BackHandler`](../modules/nsh-mobile.md#backhandler).
- **Mac Catalyst**: как на iOS.
- **Десктопы (macOS, Windows, Linux, GPUI) и веб**: каждая страница показывает свой `header` вверху, а контент под ним. На десктопах «назад» выполняют Escape, Alt+Left и кнопка «назад» мыши, в вебе — кнопка «назад» браузера.

Для контента, показываемого поверх стека и его заголовка, например листа или полноэкранного сценария, используйте [Dialog](./dialog.md).
