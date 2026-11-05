---
title: "Link"
description: "Компонент Link: содержимое, которое при нажатии ведёт в другое место — на страницу, на сайт или на маршрут приложения. Поддерживает нажатия, активацию с клавиатуры, состояние disabled и роль link для программ чтения с экрана; оформление задаётся приложением."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

Ссылка ведет пользователя куда-либо: на веб-страницу, в другое приложение (`mailto:`, `tel:`) или на экран самого приложения. Она отвечает за поведение: нажатия, Return и Space, пока у нее есть фокус клавиатуры, отключенное состояние и роль ссылки для скринридеров. Внешний вид определяет приложение: у `Link` нет собственного цвета, подчеркивания или подписи, виден только его дочерний контент. `href` указывает, куда ведет ссылка; это данные для открытия, а не текст на экране.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` берется из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` в Rust. В Rust `link()` создает ссылку с сеттером для каждого свойства (`.href(..)`, `.open_with(..)`), слушателем для каждого события (`.on_open(..)`, `.on_press(..)`), типизированными методами стиля для самой ссылки и `.child(..)` для ее содержимого.

<a id="opening"></a>

## Открытие

Нажатие, клик или Return либо Space на ссылке в фокусе открывает ее `href`:

1. `onOpen({ href })` сообщает, куда ведет ссылка.
2. При `openWith="system"` (по умолчанию) URL другого приложения или сайта, то есть URL со схемой (`https:`, `mailto:`, `tel:`, схема, зарегистрированная другим приложением), открывается за пределами приложения так же, как его открывает [`openUrl`](../modules/nsh.md): сначала его обрабатывает маршрутизатор встраивающего приложения, затем система. Любой другой `href`, путь самого приложения (`/orders/42`) или `#anchor`, передается в событии и остается за приложением.
3. `onPress()` сообщает о нажатии.

При `openWith="app"` ссылку открывает обработчик `onOpen` приложения: собственный маршрут, страница во встроенном веб-представлении или сначала подтверждение.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

Открытие URL за пределами приложения требует разрешения `openUrl`, если приложение объявляет разрешения в `nsh.json` (`"openUrl": true` или `{ "schemes": ["https", "mailto"] }`).

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | нет | Куда ведет ссылка: URL или путь приложения. Передается в `onOpen`, никогда не отображается. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | Кто открывает `href`: система открывает URL другого приложения или сайта; `"app"` оставляет это на усмотрение `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нет нажатий, отклика на нажатие и фокуса клавиатуры; стили `disabled:` применяются, а скринридеры сообщают, что элемент неактивен. |
| `current` | `.current(..)` | `boolean` | `false` | Ссылка на страницу, на которой находится пользователь, в навигации или хлебных крошках: скринридеры сообщают, что это текущая страница. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что произносят скринридеры, когда содержимое говорит слишком мало (иконка). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | нет | На сколько за пределами границ нажатия все еще засчитываются, в пунктах: одно число для всех сторон или отдельно по сторонам. Как `hitSlop` у view. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое: подпись, иконка, всё, что показывает приложение. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Внешний вид ссылки: цвет, подчеркивание, отступы; свойства текста передаются вложенным в нее текстам. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль ссылки при нажатии, наведении, фокусе или в отключенном состоянии, как классы `<state>:`. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | Ссылка открывает `href`: при `openWith="app"` ее открывает обработчик, при `"system"` он узнает, что именно система попросила открыть. Происходит до `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | Ссылку нажали: тап, клик или Return либо Space, пока у нее есть фокус клавиатуры. |

Отключенная ссылка ничего не сообщает, а нажатие на нее не доходит до нажимаемых view вокруг.

<a id="states"></a>

## Состояния

Приложение стилизует каждое состояние с помощью классов или свойств стиля:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Посещенные ссылки запоминает приложение: оно хранит открытые href и стилизует такие ссылки по собственному состоянию.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## Внутри текста

`Link` внутри `<Text>` является строчным блоком абзаца, как и любое view внутри текста: он находится в строке, сохраняет собственные состояния, фокус и роль и остается на одной строке. `align-text-bottom` размещает ссылку с одной строкой текста на базовой линии абзаца:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

Ссылка, которая переносится вместе со строками абзаца, является вложенным `<Text>` с `role="link"` и `onPress` (см. [Text](./text.md)); так [TextView](./text-view.md) отображает ссылки документа.

<a id="a-small-target-with-hitslop"></a>

## Маленькая цель и hitSlop

Ссылка может быть меньше пальца: иконка, короткое слово. `hitSlop` заставляет засчитываться нажатия, попавшие рядом с ней, в пунктах за каждой из сторон, не меняя ее раскладку и внешний вид: одно число для всех сторон или отдельно по сторонам (`{ top: 8, bottom: 8 }`), как их принимает [`hitSlop` у view](./index.md#presses-and-feedback).

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## Доступность

- Ссылка для скринридеров является одним элементом с ролью `"link"`; ее подпись — это текст дочерних элементов или `accessibilityLabel`. `href` остается данными: скринридеры произносят подпись.
- `current` произносится как текущая страница (`aria-current="page"` из ARIA), а `disabled` — так, как платформа произносит неактивный элемент.
- В macOS и вебе ссылка является остановкой фокуса клавиатуры: Tab переходит на нее, Return и Space ее открывают, а стили `focus:` показывают, где находится фокус.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Доступность](../docs/accessibility.md).

<a id="platform-notes"></a>

## Примечания по платформам

- iOS, Android и Mac Catalyst: нажатие — это тап, который заканчивается на ссылке.
- Десктопы (macOS, Windows, Linux, GPUI) и веб: нажатие — это клик. В macOS и вебе Return и Space также открывают ссылку, у которой есть фокус клавиатуры.
- В вебе ссылка отображается как элемент с `role="link"`.
- На каждой платформе отображается то, что задает стиль приложения.
