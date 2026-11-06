---
title: "Pagination"
description: "Компонент Pagination: страницы набора, между которыми можно переходить, с соседними страницами вокруг текущей, многоточиями, кнопками «Назад» и «Далее», компактным пейджером, управлением с клавиатуры и озвучиванием текущей страницы для программ чтения с экрана; оформление задаётся приложением."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# Pagination

Пагинация переключает страницы набора: результаты поиска, строки таблицы, архив. Она показывает «Назад», страницы вокруг текущей (первая и последняя показываются всегда, а на каждый пропущенный участок приходится многоточие), дочерние элементы приложения и «Вперёд». Поведение за ней: какие страницы показаны, нажатия, клавиатура, отключённые «Назад» и «Вперёд» на краях, ориентир навигации и текущая страница для скринридеров. Внешний вид остаётся за приложением: у элементов нет собственного цвета, размера или подписи, приложение стилизует их или рисует само.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` приходит из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` на Rust. В Rust
`pagination()` создаёт его с сеттером на каждый проп (`.page(..)`, `.total_pages(..)`), `.on_change(..)` для страницы, которую
выбирает пользователь, типизированными методами стиля для строки и `.child(..)` для содержимого приложения.

<a id="the-page"></a>

## Страница

Страница принадлежит приложению: `page` — текущая страница, начиная с 1, а `onChange({ page })` сообщает о странице, которую пользователь выбрал
нажатием на страницу, на «Назад» или на «Вперёд». Приложение задаёт её, загружает эту страницу и показывает её строки. `totalPages` — это
количество страниц; `page` за последней страницей показывает последнюю. Нажатие на текущую страницу ничего не сообщает, как и
«Назад» на первой странице и «Вперёд» на последней.

<a id="the-pages-shown"></a>

## Показанные страницы

При `visiblePages` (не менее 5, по умолчанию) строка показывает все страницы, пока они помещаются. Сверх этого она показывает первую и
последнюю страницы, текущую с таким количеством страниц с каждой стороны, какое помещается, `(visiblePages - 3) / 2`, и многоточие на
каждый пропущенный участок страниц:

| `page` из 20, `visiblePages={7}` | Показано |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

Десять тысяч страниц показывают те же семь элементов. Нечётное `visiblePages` центрирует текущую страницу.

<a id="items"></a>

## Элементы

Каждый элемент получает `itemClass` и `itemStyle` приложения: текущая страница — `selected:`, элемент, не принимающий нажатия, — 
`disabled:`, элемент с фокусом клавиатуры — `focus:`. Строку раскладывает приложение с помощью `class` (по умолчанию в ряд;
`gap-*`, `justify-*`).

Без `renderItem` страница показывает свой номер, многоточие — `…`, а «Назад» и «Вперёд» — свои метки доступности (`‹` и
`›` без них). `renderItem` рисует содержимое каждого элемента из `PaginationItemState`:

| Поле | Тип | Описание |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | Что представляет собой элемент. |
| `page` | `number` | Номер страницы; страница, на которую ведёт «Назад» или «Вперёд» (на краях — текущая); первая скрытая страница многоточия. |
| `start`, `end` | `number` | Скрытые страницы многоточия: `start` включительно, `end` (следующая показанная страница) не включается. |
| `current` | `boolean` | Текущая страница. |
| `disabled` | `boolean` | Не принимает нажатия: «Назад» на первой странице, «Вперёд» на последней, все элементы отключённой пагинации. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

Многоточие само не принимает нажатий: что оно делает, решает приложение. `Menu`, нарисованный в нём, перечисляет скрытые им страницы, как
это делает `JumpMenu` выше.

<a id="compact"></a>

## Компактный вид

`compact` показывает только «Назад», дочерние элементы и «Вперёд»: пейджер для узкого экрана, где страница указана в дочерних элементах.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

Дочерние элементы стоят после страниц и перед «Вперёд» в любой из форм: счётчик страниц, поле для перехода на страницу.

## Props

| Проп | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | обязательно | Текущая страница, начиная с 1; приложение задаёт её в `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | обязательно | Сколько всего страниц, не менее 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | Наибольшее число одновременно показанных страниц, включая первую и последнюю; не менее 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | Только «Назад», дочерние элементы и «Вперёд». |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ни один элемент не принимает нажатия и фокус клавиатуры; стили `disabled:` применяются, а скринридеры сообщают, что элементы приглушены. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют навигацию: по чему она листает. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | нет | Что скринридеры произносят для «Назад» и «Вперёд», а также их содержимое без `renderItem`. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | нет | Внешний вид каждого элемента: `selected:` на текущей странице, `disabled:`, `focus:`; текстовые стили передаются его содержимому. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | нет | Рисует содержимое каждого элемента из его состояния. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое приложения после страниц, перед «Вперёд». |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Внешний вид и раскладка строки. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: страница, которую пользователь выбрал нажатием на страницу, «Назад» или «Вперёд». Текущая страница никогда не сообщается. |

<a id="motion"></a>

## Анимация

Текущая страница переходит от элемента к элементу так, как указывают классы `selected:` приложения: `transition-colors` на `itemClass` плавно
переводит выделение со страницы, которую покинули, на страницу, которую выбрали. Смена страницы оставляет каждый элемент на месте и меняет то, что
элементы показывают, поэтому строка никогда не мерцает; переходы приложения не выполняются при уменьшенной анимации (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## Доступность

- Строка является ориентиром навигации с именем из `accessibilityLabel`.
- Каждая страница, «Назад» и «Вперёд» — это кнопка. Текущая страница озвучивается как текущая (ARIA
  `aria-current="page"`) и выбрана; «Назад» на первой странице и «Вперёд» на последней приглушены.
- На macOS и в вебе каждая страница, «Назад» и «Вперёд» — остановка фокуса клавиатуры, а Return и Space нажимают её. Страница,
  нажатая с клавиатуры, сохраняет фокус, как только приложение её покажет, где бы она ни оказалась в строке; так же
  сохраняют его первая или последняя страница, когда до неё доходит «Назад» или «Вперёд».

Общие сведения о метках, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).

<a id="platform-notes"></a>

## Особенности платформ

- iOS, Android и Mac Catalyst: нажатие — это касание, заканчивающееся на элементе.
- Настольные платформы (macOS, Windows, Linux, GPUI) и веб: нажатие — это щелчок; на macOS и в вебе Tab переходит по элементам.
- Каждая платформа рисует то, что стилизует приложение.
