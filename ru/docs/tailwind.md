---
title: "Tailwind"
description: "Классы Tailwind CSS, разрешаемые нативно в TSX, и их типизированные эквиваленты в Rust: class и classList, варианты для состояний нажатия, тёмная тема и контрольные точки, тема в nsh.json и проверка классов во время сборки."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

Стили NSH следуют Tailwind CSS 4. В Rust утилиты Tailwind — это типизированные методы стиля с теми же именами и значениями (`.p_4()` — это `p-4`, `.rounded_2xl()` — это `rounded-2xl`, `ZINC.shade(900)` — это `zinc-900`); в TSX каждый элемент принимает сами классы в `class`, которые разрешаются нативно относительно темы Tailwind 4 по умолчанию. В каждом примере ниже сначала показаны типизированные методы, затем классы:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

Типизированные методы преобразуются в те же правила стиля, в которые компилируются классы, без разбора строки. Для классов CSS не генерируется и ничего не выполняется в JavaScript: строка передаётся ядру, которое разбирает каждую уникальную строку классов один раз (и кэширует результат), превращает её в правила стиля и применяет их. Варианты, зависящие от состояния (нажатие, тёмный режим, ширина окна), ядро применяет повторно при изменении этого состояния, а состояния нажатия и фокуса отслеживаются нативно, поэтому обратная связь `active:` (`.active(..)` в Rust) не требует обращения к вашему коду.

Классы и [проп `style`](./styling.md) создают одни и те же нативные стили и могут сочетаться; на этой странице описано то, что специфично для классов и их типизированных эквивалентов. В [справочнике по Tailwind](../modules/tailwind-reference.md) перечислены все поддерживаемые утилиты.

<a id="class-and-classlist"></a>

## class и classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** — строка классов. Она может быть динамической: ``class={`h-6 rounded bg-${color()}-500`}`` работает, потому что классы разрешаются во время выполнения.
- **`classList`** сопоставляет классам условия: класс применяется, пока его значение истинно. Применяется после `class`.
- **В Rust** метод, которому передано замыкание или сигнал, следует за ним (`.bg(move || ..)`), `.style_when(condition, |s| ..)` применяет стили, пока выполняется условие, а `.when(condition, |v| ..)` решает один раз, при создании элемента.

Как разрешаются конфликты:

1. **Более поздние классы побеждают** более ранние в той же строке: `"p-2 p-4"` — это `p-4`. `tailwind-merge` не нужен: компонент может добавить в конец `class`, переданный вызывающим кодом. В Rust более поздние методы тоже побеждают.
2. **Классы с вариантами применяются после простых**, в порядке вариантов Tailwind (`hover:` перед `active:`, `max-*:` от самого широкого, брейкпоинты по возрастанию, `dark:` последним), независимо от их позиции в строке. Как и в Tailwind, решает старший вариант класса, затем следующий по старшинству, а класс с одним дополнительным вариантом идёт позже: `dark:hover:bg-a dark:bg-b` — это `bg-a` при наведении в тёмном режиме, а `max-md:p-2 max-lg:p-4` — это `p-2` ниже `md`. Как и в CSS, `odd:bg-a last:bg-b` даёт нечётной последней строке `bg-a`, потому что Tailwind сортирует `odd` после `last`.
3. **`style` побеждает классы.** Ключ стиля — это CSS-свойство с его именем, то самое, которое задают классы, поэтому он заменяет только это свойство: `style={{ paddingLeft: 8 }}` заменяет `pl-4` и сохраняет `pr-4`.
4. `!` делает класс важным: `!p-0`.

Компоненты на Rust (из `nsh/base` и из собственного крейта приложения) принимают `class` и `classList` и из TSX; ваши классы объединяются после собственных стилей компонента и при равном приоритете побеждают.

<a id="variants"></a>

## Варианты

| Вариант | Когда применяется | Rust |
|---|---|---|
| `active:` | Представление нажато | `.active(\|s\| ..)` |
| `hover:` | Указатель находится над представлением (указатели iPad и Mac) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | Поле ввода имеет фокус | `.focus(\|s\| ..)` |
| `focus-within:` | Представление или его потомок имеет фокус (содержимое `Overlay` является потомком представления, в котором оно находится) | `.focus_within(..)` |
| `disabled:`, `enabled:` | Проп `disabled` элемента равен true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | Элемент выбран (`selected`, `accessibilityState.selected` у `Button`) | `.selected_style(..)` |
| `checked:` | Элемент отмечен (`accessibilityState.checked` — это `true`; `"mixed"` не отмечен) | `.checked_style(..)` |
| `indeterminate:` | Элемент в неопределённом состоянии (`accessibilityState.checked` — это `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | Элемент раскрыт (`accessibilityState.expanded` — это `true`): триггер `Popover` или `Menu`, пока открыто его всплывающее окно | `.expanded_style(..)` |
| `aria-pressed:` | Элемент — кнопка-переключатель во включённом состоянии (`accessibilityState.pressed` — это `true`; `"mixed"` не нажат). Не `active:`, то есть не нажатие в процессе | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, а не `"mixed"`) или `selected` — это `true`, как варианты `aria-*` в Tailwind: после псевдоклассов, в порядке их имён | |
| `data-<name>:` | У элемента есть атрибут `data-*` со значением `name`, как булевы варианты `data-*` в Tailwind (`&[data-range-start]`): то, что часть компонента показывает помимо своих состояний, например день календаря в начале диапазона (`data-range-start:`). После вариантов `aria-*`, в порядке их имён | `Interactive::project_data(name, ..)` задаёт его для части компонента |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | Ближайший предок с классом `group` находится в этом состоянии или имеет этот атрибут `data-*` | `.group()` на предке; `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` внутри |
| `group-active/name:` ... | То же для предка, помеченного `group/name` | `.group_named("name")`; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | Собственная позиция элемента среди соседних. Чтобы окрасить подпись строки в зависимости от позиции строки, задайте `last:text-*` на строке: подпись унаследует его | Обычный Rust по индексу строки (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | Стилизует подсказку поля ввода (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | Задаёт цвет выделения в поле ввода или выделяемом тексте, а также в тех, что находятся внутри элемента (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | Системное оформление тёмное | `AdaptiveColor` или `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | Ширина окна не менее 640, 768, 1024, 1280, 1536 пунктов | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | Окно уже брейкпоинта | То же, с `<` |
| `min-[600px]:`, `max-[600px]:` | Произвольные брейкпоинты | То же |
| `portrait:`, `landscape:` | Ориентация окна | `window().width > window().height` |
| `ios:`, `android:`, `web:` | Платформа | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | [Направление макета](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` на представлении |
| `motion-safe:`, `motion-reduce:` | Настройка пользователя «уменьшить движение» | `reduce_motion()` |

Варианты можно комбинировать: `dark:active:bg-zinc-700`, `md:landscape:flex-row`. В Rust `AdaptiveColor` в стиле `.active(..)` — это `dark:active:`.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

`disabled` на любом элементе (`.disabled(..)` в Rust) применяет классы `disabled:` (`.disabled_style(..)`) и убирает его обработчики нажатия из смонтированного, поэтому он тоже не показывает обратной связи при нажатии:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

Брейкпоинты сравниваются с окном (поверхностью, в которую рендерит NSH), а не с устройством: в режиме Split View на iPad или в окне с изменяемым размером они следуют ширине окна, как и `window()`.

<a id="what-differs-from-tailwind-on-the-web"></a>

## Отличия от Tailwind в вебе

- **Единицы измерения — пункты.** `p-4` (`.p_4()`) равен 16 пунктам (1 шаг интервала = 4pt, 1rem = 16pt). Произвольные значения в `px` тоже задаются в пунктах: `p-[13px]` (`.p(px(13.0))`) равно 13pt.
- **`flex` — это строка**, как в CSS: `class="flex"` располагает дочерние элементы в строку, если класс направления не говорит иного (в любом месте строки: `flex-col flex` — это столбец). `display: "flex"` стиля и `.flex()` в Rust точно так же являются строками, а представление, не задающее display, сохраняет столбец NSH по умолчанию. `block` и `flow-root` используют блочный макет, как и `inline` с `inline-block`, как их раскладывает браузер во flex- или grid-родителе. В Rust направление задают `.flex_row()` и `.flex_col()`.
- **Текстовые классы на представлениях наследуются.** `text-*`, `font-*`, `leading-*`, `tracking-*` и другие текстовые утилиты на представлении (`.text_color(..)`, `.font_weight(..)`, ... в Rust) передаются текстовым элементам и полям ввода внутри него, как при наследовании в CSS: `<View class="text-white">` делает его подписи белыми.
- **Каждое представление — собственный блок.** `overflow-x-hidden` и `overflow-y-hidden` обрезают по обеим осям, как `overflow-hidden` (прокрутка — задача элемента [scroll](../elements/scroll.md)); `invisible` скрывает представление и всё, что в нём; `mix-blend-*` смешивает представление со всем, что нарисовано под ним; блоки `block` хранят свои отступы и отступы своих дочерних элементов раздельно; представление `absolute` размещается в ближайшем позиционированном предке, как в CSS; `fixed` размещает представление в его корневом представлении (остальные элементы размещаются как `absolute`).
- **Текст сохраняет пробельные символы.** Пробелы и переводы строк в строке отрисовываются как написано, а перенос задаёт `whitespace-*`; компилятор JSX схлопывает пробельные символы в литеральном тексте JSX, как это делает JSX.
- **Переходы анимируют группы свойств**: `transition` анимирует цвета, непрозрачность, тени и трансформации, `transition-all` также радиусы скругления и ширину границ; фильтры, фильтры фона, градиенты и макет принимают новые значения сразу.
- **`focus-visible:` — это `focus:`**: применяется всякий раз, когда элемент имеет фокус.
- **Фоны состояний видны поверх градиентов.** В CSS градиент закрывает `background-color`, поэтому `active:bg-*` на поверхности `bg-linear-*` никогда не было бы видно; в NSH цвет фона из `active:`, `hover:`, `focus:` или `group-*:` заменяет градиент, пока это состояние сохраняется (если только состояние не задаёт собственный градиент, например `active:from-*`). То же относится к `activeStyle` и другим стилям состояний, а также к анимированным цветам фона.
- **Настройки текста и касания — это ключи стиля**: `line-clamp-*` задаёт `numberOfLines`, `text-ellipsis` и `text-clip` задают `textOverflow`, `truncate` — оба, `select-*` задаёт `userSelect`, а `pointer-events-*` задаёт `pointerEvents`, поэтому они работают в вариантах состояний и уступают встроенному `style`, как и любой класс; `caret-*`, `placeholder:text-*` и `selection:bg-*` таким же образом задают стили `caretColor`, `placeholderColor` и `selectionColor`. В Rust это методы `Styled` (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap` как класс удерживает текст в одной строке. `object-*` задают стили `objectFit` и `objectPosition` у изображений и видео, которые ключи стиля заменяют, как и любые другие.
- **Поддерживаемый набор**: утилиты и варианты Tailwind 4, имеющие нативный смысл. Варианты `peer-*`, псевдоэлементы (`before:`, `after:`) и произвольные свойства (`[mask-type:luminance]`) сообщаются как неизвестные классы, как и любая утилита, для которой в NSH нет нативного смысла, поэтому класс никогда не означает что-то иное, чем в браузере. Подсказки для рендеринга (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) принимаются и ничего не меняют.

Всё остальное работает так, как описано в документации Tailwind 4: цветовая палитра, модификаторы непрозрачности (`bg-black/40`), произвольные значения (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`; в `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` и утилитах `m` также переменные окружения, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, см. [Безопасная область](../elements/safe-area.md) и [Клавиатура](../elements/keyboard.md)), дроби (`w-1/2`, `translate-x-1/2`), тени и кольца, градиенты (`bg-linear-to-r`, `bg-radial`, `bg-conic` с `from-` / `via-` / `to-`), фильтры, `backdrop-blur-*`, `mix-blend-*`, трансформации, `transition-*` и `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce` и grid, каждое со своим типизированным методом в Rust. Платформенные ограничения [фильтров и смешивания](./styling.md#filters-and-blending) распространяются и на классы.

<a id="theme"></a>

## Тема

Классы разрешаются относительно темы Tailwind 4 по умолчанию. Расширьте её в `nsh.json` в разделе `"tailwind"`; ваши записи добавляются к значениям по умолчанию (или заменяют значение по умолчанию с тем же именем):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

С этой темой `bg-brand-500`, `text-brand` (оттенок `DEFAULT`), `border-ink`, `rounded-card`, `font-display` и `tablet:flex-row` являются допустимыми классами.

| Ключ | Значения | Создаёт |
|---|---|---|
| `colors` | Цвет CSS или объект оттенков (`"DEFAULT"` для имени без оттенка) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | Пункты на шаг интервала (по умолчанию 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Пункты на `rem` в произвольных значениях (по умолчанию 16) | |
| `breakpoints` | Пункты | варианты `name:` |
| `container` | Пункты | размеры `max-w-*` |
| `fontSize` | Пункты или `[size, lineHeight]`, где высота строки кратна размеру | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | Название семейства (системное семейство или название [импортированного шрифта](./fonts.md)) | `font-*` |
| `tracking` | Em | `tracking-*` |
| `leading` | Кратные размеру шрифта | `leading-*` |
| `radius` | Пункты | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | CSS `box-shadow` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | Пункты | `blur-*`, `backdrop-blur-*` |
| `perspective` | Пункты | `perspective-*` |
| `aspect` | Соотношение (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

Неизвестные ключи и недопустимые значения — это ошибки сборки (`nsh.json: tailwind: unknown theme key 'colours'`). Тема компилируется в бандл и применяется до первого кадра.

Тема Tailwind определяет ваши классы. Типизированные методы сохраняют шкалы Tailwind по умолчанию, поэтому компонент на Rust выглядит одинаково в каждом приложении, а внешний вид приложения берут из дизайн-токенов его темы, `"theme"` в `nsh.json` ([Rust](./rust.md#theme)).
<a id="theme-tokens"></a>

## Токены темы

Тема приложения (`"theme"` в `nsh.json`) содержит его дизайн-токены: цвета shadcn/ui (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), его `radius`, шрифты `font-sans` и `font-mono`, а также любые токены, которые добавляет приложение. Классы называют их так, как Tailwind называет переменные CSS `@theme`, компоненты Rust читают их с помощью `theme()` из `nsh_base`, а TSX читает их с помощью `token()` из `nsh`, поэтому экран на TSX и компоненты Rust следуют одной и той же теме:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

Имя токена совпадает с именем его переменной CSS без `--`, как оно записано в файле темы: `muted-foreground`, `radius`, `chart-1`. В Rust токены shadcn являются методами `theme()` (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), а каждый токен — это `theme().color("up")`, `theme().number("radius-card")` или `theme().font("font-display")`.

| Форма | Что принимает | Пример |
|---|---|---|
| Имя цвета в любой цветовой утилите | Цвет темы, в том числе с прозрачностью | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, сокращение для переменных в Tailwind 4 | Цвет темы или число | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | То же, но с указанием типа там, где утилита принимает значения нескольких видов | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | Шрифты темы, если она их задаёт | `font-mono` |

- **Собственные токены.** Каждое имя в файле темы является токеном, как и каждая переменная CSS `@theme`: `"up": "#16a34a"` создаёт `bg-up`, `text-up` и `bg-up/30`; `"radius-card": "14px"` создаёт `rounded-(--radius-card)`; `"font-display": "Pacifico"` создаёт `font-(family-name:--font-display)`. Длины задаются в пунктах; `(number:--name)` передаёт обычное число.
- **Шрифты.** `font-sans` — это шрифт приложения: им рисуется любой текст, у которого не задано собственное семейство, как страница рисуется шрифтом Tailwind `--font-sans`. `font-mono` — это шрифт для `font-mono` и для кода в `TextView`. Если шрифты не заданы, используются системные.
- **Оба оформления.** У токена есть светлое и тёмное значения темы: `bg-primary`, `theme().primary` и `token("primary")` переключаются вместе с оформлением автоматически, без класса `dark:`. Цвет, который тема задаёт только в одном оформлении, используется в обоих.
- **Ваши цвета Tailwind имеют приоритет.** Имя в `"tailwind"` `colors` или в палитре Tailwind означает именно этот цвет, поэтому `bg-primary` является токеном темы, только если в теме Tailwind нет цвета `primary`.
- **Тема может меняться во время работы приложения.** Когда приложению, встроенному в нативное приложение, передаётся тема этого приложения, а также при каждом изменении темы классы с именами токенов, привязки Rust, читающие `theme()`, и код TSX, читающий `token()`, обновляются; классы и привязки — на нативном уровне. Токены, которых нет в теме встроенного приложения, сохраняют значения из собственного `"theme"` приложения (а затем — из темы по умолчанию). Хост, который лишь добавляет свой бренд, передаёт переопределения темы — токены, которые его бренд меняет, в том же формате файла ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), `AppView::set_theme_overrides` на десктопах).
- **Проверка, как у других классов.** Имя, которое не является токеном темы по умолчанию или `"theme"` приложения, при сборке считается неизвестным классом (`unknown class 'bg-chart-up'`). Чтобы использовать токен, который предоставляет только встроенное приложение, задайте ему значение и в `"theme"` приложения: оно будет отображаться, когда приложение запущено само по себе.

Классы с именами токенов разрешаются один раз для каждой темы, как и любые другие классы: их отрисовка стоит столько же, сколько цвет из палитры.

<a id="445-in-tsx"></a>

### `token()` в TSX

`token(name)` из `nsh` — это значение токена в текущем оформлении: цвет в виде `#rrggbbaa`, длина в виде числа пунктов, шрифт в виде названия семейства. Оно реактивно, поэтому код, который читает его в компоненте, мемо или эффекте, выполняется снова при смене темы или оформления. Это удобно для значений, которые попадают туда, где классы не работают, например в canvas или диаграмму:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

Имена типизированы: NSH записывает токены приложения в `.nsh/types/nsh/tokens.d.ts` из его темы, поэтому `token("up")` имеет тип `string`, как только `"up"` появляется в теме, а имя, которого в теме нет, вызывает ошибку типов.

<a id="the-class-check"></a>

## Проверка классов

`nsh build`, `nsh dev`, `nsh run` и `nsh test` проверяют статические имена классов в вашем JSX (строковые литералы в `class` и ключи `classList`) тем же парсером и с той же темой, что и в рантайме, и предупреждают о несуществующих классах:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

Предупреждения не прерывают сборку. Классы, формируемые во время выполнения (``bg-${color()}-500``), проверяются, когда рантайм впервые их встречает; он записывает в лог каждый неизвестный класс один раз (`unknown classes: ...`). Типизированные методы проверяются компилятором Rust.

<a id="classes-or-styles"></a>

## Классы или стили?

Оба варианта разрешаются нативно и стоят примерно одинаково. Классы короче и дают варианты (состояния нажатия, тёмный режим, брейкпоинты) без кода. Инлайн-стили принимают значения, вычисленные в JavaScript, и работают с [нативными анимированными значениями](./animation.md) (`opacity: fade`, `translate: [x, 0]`). Большинство приложений на TSX используют классы для статичного внешнего вида и `style` для того, что вычисляется или анимируется. Компоненты Rust используют для обоих случаев типизированные методы, а анимированные значения привязывают с помощью `.bind_opacity(..)`, `.bind_translate_x(..)` и других привязок.

<a id="related"></a>

## См. также

- [Стилизация](./styling.md): свойство style, типизированные методы и платформенные ограничения эффектов.
- [Справочник по Tailwind](../modules/tailwind-reference.md): все утилиты и варианты.
- [Раскладка](./layout.md): flexbox и grid, также доступные в виде классов.
