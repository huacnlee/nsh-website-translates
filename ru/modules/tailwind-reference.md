---
title: "Справочник по Tailwind"
description: "Все утилиты и варианты Tailwind, которые NSH разрешает нативно, синтаксис произвольных значений и способы расширения темы в nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---

# Справочник по Tailwind

Каждый элемент принимает классы Tailwind CSS в свойстве `class` (а условные классы, в `classList`). NSH разбирает их в Rust по стандартной теме Tailwind 4: JS передаёт только строку, каждая уникальная строка разбирается один раз и кэшируется, а варианты вроде `dark:` или `active:` пересчитываются нативно при смене оформления, размера окна или состояния нажатия, без запуска JS.

Каждая утилита задаёт ровно то, что для неё генерирует Tailwind CSS 4, с тем же смыслом, что и в браузере. На этой странице перечислено то, что поддерживается. Введение см. в разделе [Tailwind](../docs/tailwind.md); ключи стиля, которые задают утилиты, описаны в [справочнике по стилям](./style-reference.md).

Компоненты Rust не принимают строки классов: они стилизуют элементы типизированными методами `Styled` (`nsh_core::prelude`), названными по этим утилитам и разрешающимися в те же значения, включая стандартные шкалы Tailwind (`px-4` это `.px_4()`, `rounded-2xl` это `.rounded_2xl()`, `shadow-md` это `.shadow_md()`, `bg-linear-to-br` это `.bg_linear_to_br()`). Цвета являются значениями: цвета темы или палитра Tailwind в виде `nsh_core::element::palette` (`ZINC.shade(800)` это `zinc-800`). Варианты это методы, принимающие замыкание со стилями: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)`, а для остальных `.style_when(condition, …)`. [Справочник по стилям](./style-reference.md) указывает метод для каждого ключа стиля.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Как комбинируются классы

- **Побеждает последний.** Среди утилит одного уровня варианта побеждает та, что стоит в строке позже: `"p-4 p-2"` это `p-2`. Компонент может принять свойство `class` и добавить его к своим классам без `tailwind-merge`.
- **Варианты применяются после обычных утилит** в порядке вариантов Tailwind: `group-*:` (по их состоянию, затем по имени группы), `selection:`, `placeholder:`, позиция (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (по имени), движение, точки останова `max-*:` от самых широких, затем точки останова по возрастанию, ориентация, направление, `dark:`, затем платформа. Решает старший вариант класса, затем следующий по старшинству, а класс с ещё одним вариантом идёт позже (`dark:hover:` после `dark:`), так же как их сортирует Tailwind. Поэтому `"active:bg-red-500 bg-blue-500"` красный, пока элемент нажат.
- **`style` побеждает классы.** Инлайновый `style` применяется поверх разрешённых классов. Ключ стиля это CSS-свойство с тем же именем, которое задают утилиты, поэтому он заменяет только это свойство и ничего больше: `style={{ paddingLeft: 8 }}` перекрывает `pl-4` и сохраняет `pr-4`. Важная утилита (`!p-4` или `p-4!`) побеждает и инлайновый стиль.
- **Стили текста наследуются.** Текстовые утилиты на представлении (`text-white`, `font-bold`, `text-center`, ...) передаются вложенным в него элементам `<Text>` и `<Input>`, как в CSS.
- **Display работает как в CSS.** `flex` и `inline-flex` дают строку, если утилита направления не указывает иное, где бы она ни стояла в строке (`flex-col flex` это столбец). `display: "flex"` в стиле так же означает строку; представления, не задающие display, сохраняют столбец по умолчанию, принятый в NSH.

<a id="units-and-the-theme"></a>

## Единицы измерения и тема

Длины измеряются в пунктах (`1` = один пункт на iOS, один dp на Android). `1rem` в Tailwind равен 16 пунктам, поэтому тема совпадает с веб-версией при той же плотности: один шаг отступа равен 4 пунктам (`p-4` = 16 пунктов), `text-base` равен 16 пунктам.

<a id="spacing-values"></a>

### Значения отступов

Утилиты, принимающие значение отступа (padding, margin, gap, inset, ширина, высота, `basis`, `translate`, `leading`), допускают:

| Значение | Пример | Результат |
|---|---|---|
| Шаги (допускаются четверти шага) | `p-4`, `gap-1.5`, `m-0.25` | шаг × 4 пункта |
| `px` | `p-px`, `-mt-px` | 1 пункт |
| `0` | `m-0` | 0 |
| Дробь (inset, ширина, высота, `basis`, `translate`) | `w-1/2`, `left-1/3` | процент от родителя |
| `full` (то же самое) | `w-full`, `inset-full` | 100% |
| `auto` (margin, inset, ширина, высота, basis) | `mx-auto`, `w-auto` | `"auto"` |
| Произвольное | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | заданная длина |

Margin, inset, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, линии сетки и углы градиента принимают ведущий `-` для отрицательных значений: `-mt-2`, `-translate-x-1/2`, `-rotate-6`. У остальных (`-p-4`, `-gap-2`, `-w-4`) в Tailwind нет отрицательной формы, нет её и в NSH.

<a id="colors"></a>

### Цвета

Полная палитра Tailwind 4 встроена: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, каждый в оттенках `50`, `100`–`900`, `950`; а также `black`, `white` и `transparent`. Собственные цвета берутся из `nsh.json` (см. [Настройка темы](#theme-customization)).

Каждая цветовая утилита принимает:

| Форма | Пример |
|---|---|
| Цвет темы | `bg-sky-500`, `text-brand` |
| Модификатор прозрачности (в процентах) | `bg-black/50`, `ring-black/5` |
| Произвольная прозрачность | `text-black/[0.35]` |
| Произвольный цвет | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Произвольный цвет с модификатором | `bg-[rgb(0_0_255)]/25` |

`currentColor` и `inherit` не являются значениями цвета. Как и в браузере, граница, outline или ring без цветового класса рисуется цветом текста элемента, собственным или унаследованным (`<View class="text-white"><View class="border ring-2" /></View>` рисует оба белым), и так же рисуется граница, толщину которой задаёт свойство `style` без цвета.

<a id="arbitrary-values"></a>

## Произвольные значения

Квадратные скобки передают значение, которого нет в теме: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` обозначает пробел (`grid-cols-[1fr_2fr]`); для буквального подчёркивания пишите `\_`.
- Длины: просто число или `px` (пункты), `pt` (4/3 пункта, как в CSS), `rem` (16 пунктов) и `%` там, где уместны проценты.
- Углы (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`.
- Время (`duration-[...]`, `delay-[...]`): `ms` или `s`; просто число означает миллисекунды.
- Подсказки типа разрешают неоднозначные значения: `text-[length:22px]` это размер, `text-[color:#333]` цвет; `border-[length:3px]` аналогично.

Произвольные CSS-свойства (`[mask-type:luminance]`) не поддерживаются.

<a id="layout"></a>

## Раскладка

| Класс | Задаёт |
|---|---|
| `flex`, `inline-flex` | `display: "flex"`, и строку, если не задана утилита направления |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | блочную раскладку или независимый контекст блочного форматирования |
| `box-border`, `box-content` | размеры включают границы и отступы или только содержимое |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | внутренние размеры Taffy: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: то, что браузер вычисляет для них во flex- или grid-родителе |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: в потоке, его смещения игнорируются; абсолютные потомки используют ближайшего позиционированного предка |
| `sticky` | `position: "sticky"`: в потоке, прилипает к `top` (`left` в горизонтальном scroll view) внутри окружающего scroll view, пока виден его родитель |
| `fixed` | `position: "fixed"`: элемент, размещённый в рамке своего корневого представления (окна или его модального окна) поверх дочерних элементов этого корневого представления, остаётся на месте, пока окружающее содержимое прокручивается |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | соответствующее смещение |
| `start-<n>`, `end-<n>` | `start` / `end` (с учётом направления) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` равно 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (сохраняет своё место) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, нет) |

Прокрутка это элемент, а не класс: `overflow-auto` и `overflow-scroll` не поддерживаются; используйте [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox и grid

| Класс | Задаёт |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | рост 1, сжатие 1, базис 0 |
| `flex-<n>` | рост n, сжатие 1, базис 0 |
| `flex-auto` | рост 1, сжатие 1, базис auto |
| `flex-initial` | рост 0, сжатие 1, базис auto |
| `flex-none` | рост 0, сжатие 0, базис auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | сокращённая запись CSS: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (без значения: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (без значения: 1) |
| `basis-<n>` | `flexBasis` (шаг отступа, дробь, `full`, `auto`, произвольное) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` и `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` и `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` и `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (и отрицательные) | margin у каждого дочернего элемента, кроме последнего: конечный margin (`space-x`) или нижний (`space-y`), под собственными margin дочернего элемента, как в Tailwind CSS; добавляется к `gap` |
| `space-x-reverse`, `space-y-reverse` | вместо этого margin с начальной / верхней стороны (дочерние элементы в обратном порядке) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (и `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (и `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## Отступы

| Класс | Задаёт |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (с учётом направления) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (с учётом направления) |

<a id="sizing"></a>

## Размеры

| Класс | Задаёт |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (шаг отступа, дробь, `full`, `auto`, произвольное) |
| `size-<n>` | `width` и `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | соответствующее ограничение |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | ширина окна (также для `min-w-` / `max-w-`) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | высота окна (также для `min-h-` / `max-h-`) |
| `w-auto`, `h-auto` | `auto` (размер определяется содержимым) |
| `max-w-none`, `max-h-none` | без ограничения |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | ширина контейнера (см. ниже) |

Ширина контейнеров (в пунктах): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280; `prose` равно 65 ширинам `0` шрифта элемента (`65ch` в CSS), как в Tailwind CSS.

<a id="typography"></a>

## Типографика

<a id="font"></a>

### Шрифт

| Класс | Задаёт |
|---|---|
| `font-sans` | системный шрифт |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | числовое значение задаёт насыщенность, иначе семейство шрифта: `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (они комбинируются; `normal-nums` сбрасывает формы чисел) |

<a id="size-color-and-line-height"></a>

### Размер, цвет и высота строки

`text-<size>` задаёт размер шрифта и соответствующую высоту строки из Tailwind; её заменяет класс `leading-*`, где бы он ни стоял в строке и каков бы ни был его вариант (`leading-tight md:text-lg` сохраняет плотный межстрочный интервал):

| Класс | Размер | Высота строки |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Класс | Задаёт |
|---|---|
| `text-<size>/<leading>` | размер и высоту строки: `text-sm/6` (24 пункта), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | `lineHeight` как кратное размера шрифта |
| `leading-<n>`, `leading-[<length>]` | `lineHeight` в пунктах (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` как кратное размера шрифта (`leading-[1.5]`), наследуется как этот множитель; `em` и `%` вычисляют длину при размере шрифта элемента до наследования |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | `letterSpacing` относительно размера шрифта |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Выравнивание, регистр и перенос

| Класс | Задаёт |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: начало или конец строки в направлении раскладки |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (представления и изображения внутри текста) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | одна строка, многоточие в конце, без переноса, `overflow: hidden` (у представления: его тексты не переносятся) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` показывает все строки) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | строки никогда не переносятся; у представления это строки находящихся в нём текстов (наследуется, как `white-space` в CSS) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | строки переносятся (балансировка не выполняется) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`; у представления для находящихся в нём текстов, у которых оно не задано |
| `select-auto` | `userSelect: "auto"`: решает окружающее представление, как `user-select: auto` в CSS (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### Оформление и тень

| Класс | Задаёт |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | текстовая тень из темы (один слой: самый широкий из слоёв темы); модификатор задаёт альфа-канал слоёв: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | её цвет с альфа-каналом размера |
| `text-shadow-none` | убирает её |

У текстовых теней Tailwind несколько слоёв; нативно рисуется одна тень — самый широкий слой.

<a id="inputs"></a>

### Поля ввода

| Класс | Задаёт |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (подсветка выделения в поле ввода или в выделяемом тексте, в том числе внутри элемента) |
| `caret-<color>` | цвет курсора |

<a id="backgrounds"></a>

## Фоны

| Класс | Задаёт |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | линейный градиент в сторону или к углу (`bg-gradient-to-*` — название из v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | линейный градиент под углом: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | радиальный градиент от центра |
| `bg-conic`, `bg-conic-<angle>` | конический градиент, при необходимости с начальным углом |
| `from-<color>`, `via-<color>`, `to-<color>` | опорные цвета градиента (по умолчанию на концах прозрачные) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | позиции опорных цветов: `via-40%`, `from-[15%]` |
| `bg-none` | убирает градиент |

Утилиты градиентов смешивают цвета в Oklab, как их записывает Tailwind CSS (`in oklab`); при произвольной позиции (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`) они следуют значению CSS по умолчанию: Oklab для цветов палитры и sRGB, когда каждый опорный цвет — hex, `rgb()`, `hsl()` или именованный цвет.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## Границы

| Класс | Задаёт |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (без значения: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (с `-<n>` или без значения) | ширина соответствующих сторон |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` и цвета отдельных сторон |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: границы нет независимо от классов ширины, в любом порядке (`md:border-solid` показывает её снова) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (без значения: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | соответствующие углы |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | начальные / конечные углы (с учётом направления): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (без значения: 1), сплошная, если в строке нет класса стиля (`outline-dashed outline-2` — пунктир, `outline-none outline-2` ничего не рисует) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`; один стиль даёт среднюю ширину CSS, 3 пункта |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

Размеры радиуса (в пунктах): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### Кольца

Кольца — это тени блока с растяжением (spread); они рисуются снаружи границы и не занимают места.

| Класс | Задаёт |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | кольцо такой ширины (без значения: 1) |
| `ring-<color>` | цвет кольца (по умолчанию цвет текста элемента) |
| `ring-inset` | рисует кольцо внутри |
| `ring-offset-<n>`, `ring-offset-<color>` | зазор между элементом и кольцом (по умолчанию белый) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | внутреннее кольцо |

<a id="effects"></a>

## Эффекты

| Класс | Задаёт |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | `boxShadow` из темы; модификатор задаёт альфа-канал слоёв: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | произвольная тень: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | перекрашивает слои тени с альфа-каналом размера: `shadow-indigo-500/40` |
| `shadow-none` | нет тени |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | внутренняя тень |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

Тени, кольца и внутренние тени объединяются в один список `boxShadow`, как в CSS. Цвет тени заменяет цвет каждого слоя, включая альфа-канал, как `--tw-shadow-color` в Tailwind: `shadow-md shadow-red-500` — непрозрачная красная тень, `shadow-md/20 shadow-red-500` — тень с альфа-каналом 20%.

<a id="filters"></a>

## Фильтры

| Класс | Задаёт |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | коэффициенты в процентах: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | без значения: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>` у любого из них | `drop-shadow()` на каждый слой, после остальных фильтров; цвет заменяет цвета слоёв, с альфа-каналом размера; Web, Linux, Windows и GPUI рисуют каждый слой, iOS, macOS и Android — самый широкий |
| `drop-shadow-none` | убирает его |
| `filter-none` | убирает все фильтры |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | размывает то, что находится позади представления |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | фильтры backdrop |
| `backdrop-filter-none` | убирает их |

> [!WARNING]
> iOS применяет к представлениям только `opacity`, `brightness` до 1 и `drop-shadow`; `<Image>` принимает все цветовые фильтры и `blur`. Android требует API 31 для `blur`, `drop-shadow` и размытия backdrop. См. [Справочник по стилям](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## Трансформации

| Класс | Задаёт |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (отступы, `full`, доли собственного размера элемента: `-translate-x-1/2`, произвольные значения) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | 3D-поворот (в `transform`, после сдвига, поворота и масштаба) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100` отражает |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | наклон, в `transform` (не на Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | глубина для 3D-поворотов дочерних элементов, если смотреть из его центра (`perspective` в CSS: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | сбрасывает 3D-повороты и наклоны (`transform: none` в CSS) |
| `translate-none`, `rotate-none`, `scale-none` | сбрасывает сдвиг, поворот, масштаб |

Утилиты трансформаций компонуются как в CSS: `translate-*`, `rotate-*` и `scale-*` задают свойства `translate`, `rotate` и `scale` и комбинируются независимо от порядка, затем применяется `transform` (`rotate-x-*`, `skew-*`). Ключи пропа `style` с теми же именами заменяют только своё свойство: `style={{ scale: 1.1 }}` заменяет `scale-95` и сохраняет `rotate-3`. `transform`, `transform-gpu`, `transform-cpu` и `transform-flat` принимаются и ничего не делают: NSH компонует все трансформации одинаково, плоско. Сдвиги на долю размера вычисляются относительно frame элемента и следуют за ним при изменении размера.

<a id="transitions-and-animation"></a>

## Переходы и анимация

| Класс | Задаёт |
|---|---|
| `transition` | цвета, прозрачность, тень и трансформацию; 150 мс, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | анимируемые свойства |
| `transition-none` | нет перехода |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | нативная покадровая анимация, повторяющаяся бесконечно |
| `animate-none` | останавливает её |

Переходы выполняются в UI-потоке при изменении значения, в том числе когда вариант начинает или перестаёт совпадать, поэтому `transition active:scale-95` анимирует нажатие без JS. Оборачивайте анимации в `motion-safe:`, чтобы учитывать настройку уменьшения движения.

<a id="interactivity"></a>

## Интерактивность

| Класс | Задаёт |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: является ли представление целью для касаний и указателя; наследуется как в CSS: внутри представления `pointer-events-none` представление `pointer-events-auto` снова становится целью |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (любое ключевое слово курсора CSS) |
| `select-none`, `select-text`, `select-auto` | выделение текста (см. «Типографика») |

## SVG

| Класс | Задаёт |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` — это `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## Изображения

| Класс | Задаёт |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` растягивает, `none` сохраняет естественный размер и размещает в `objectPosition`, `scale-down` — то же самое, но уменьшает, если изображение больше); изображения и видео |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... — то же, что `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (перекрашивает template-изображения) |

<a id="accepted-without-effect"></a>

## Принимаются без эффекта

Эти утилиты — подсказки для рендеринга или то, чем уже является любое нативное представление; они разбираются без предупреждения и ничего не меняют: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. Прокрутка, привязка (snapping) и overscroll — это пропы [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## Не поддерживается

Варианты `peer-*`, псевдоэлементы (`before:`, `after:`), произвольные свойства (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, контейнерные запросы, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, внутренние (intrinsic) ограничения min/max (например, `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` и `isolate` — неизвестные классы. `nsh build` и `nsh dev` предупреждают о неизвестных классах, найденных в вашем исходном коде (`file:line:col: unknown class '...'`), а рантайм логирует каждый неизвестный класс один раз.

<a id="variants"></a>

## Варианты

Варианты делают утилиту условной: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. Они комбинируются (`dark:active:bg-zinc-700`) и вычисляются нативно при каждом изменении того, от чего зависят.

<a id="appearance-and-environment"></a>

### Оформление и окружение

| Вариант | Применяется, когда | Rust |
|---|---|---|
| `dark:` | включено тёмное оформление | `.dark(\|s\| …)` |
| `ios:` | приложение запущено на iOS или Mac Catalyst | `.when(os() == Os::Ios, …)` |
| `android:` | приложение запущено на Android | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | окно выше, чем шире / шире, чем выше | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | направление раскладки | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | пользователь не запрашивал / запросил уменьшение движения | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### Брейкпоинты

Брейкпоинты сравниваются с шириной окна в пунктах.

| Вариант | Мин. ширина |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| Форма | Пример | Применяется, когда |
|---|---|---|
| `<bp>:` | `md:p-8` | ширина ≥ брейкпоинта |
| `max-<bp>:` | `max-md:p-1` | ширина < брейкпоинта |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | ширина ≥ указанной длины |
| `max-[<length>]:` | `max-[400px]:text-sm` | ширина < указанной длины |

Телефон в портретной ориентации (шириной 390 пунктов) не соответствует ни одному из брейкпоинтов по умолчанию; планшет или телефон в альбомной ориентации соответствует нескольким. В Rust брейкпоинт — это условие на окно: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` — это `md:p-8`.

<a id="interaction-states"></a>

### Состояния взаимодействия

Платформа отслеживает состояния только для элементов, в классах которых они используются, а изменения применяются нативно, без обращения к JS.

| Вариант | Применяется, когда | Rust |
|---|---|---|
| `active:` | элемент нажат | `.active(\|s\| …)` |
| `hover:` | над ним находится указатель (указатель iPad, Mac Catalyst, мышь на Android) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | поле ввода находится в фокусе | `.focus(\|s\| …)` |
| `focus-within:` | фокус у элемента или его потомка (содержимое `Overlay` является потомком элемента, в котором оно находится) | `.focus_within(…)` |
| `disabled:` | у элемента есть проп `disabled` | `.disabled_style(\|s\| …)` |
| `enabled:` | у элемента нет пропа `disabled` |  |
| `selected:` | элемент выбран: `selected` у `Button` или `accessibilityState.selected` |  |
| `checked:` | элемент отмечен: `accessibilityState.checked` равно `true` (`"mixed"` не отмечен) |  |
| `indeterminate:` | элемент в неопределённом состоянии: `accessibilityState.checked` равно `"mixed"` |  |
| `aria-expanded:` | элемент раскрыт: `accessibilityState.expanded` равно `true` (триггер `Popover` или `Menu`, пока открыто его всплывающее окно) |  |
| `aria-pressed:` | элемент — включённая кнопка-переключатель: `accessibilityState.pressed` равно `true` (`"mixed"` не нажат; это не `active:`, то есть не нажатие в процессе) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | элемент занят: `accessibilityState.busy` равно `true` |  |
| `aria-checked:` | элемент отмечен: `accessibilityState.checked` равно `true`, как `checked:` |  |
| `aria-selected:` | элемент выбран: `accessibilityState.selected` равно `true`, как `selected:` |  |
| `data-<name>:` | у элемента есть булев атрибут `data-*` `name` (`&[data-<name>]` в Tailwind; имена из строчных букв, цифр и `-`): то, что часть компонента показывает помимо своих состояний, например день календаря в начале диапазона `data-range-start` | `Interactive::project_data(name, …)` задаёт такой атрибут |

Те же состояния в виде объектов стиля — это пропы `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` и `pressedStyle` каждого элемента (и `selectedStyle` у `Button`); они накладываются поверх стиля и классов элемента.

`disabled` работает на любом элементе: он применяет `disabled:` и убирает обработчики нажатий элемента, поэтому обратной связи при нажатии тоже нет.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### Группы

Пометьте предка с помощью `group` и стилизуйте потомков по его состоянию с помощью `group-<state>:`. Назовите группы, чтобы вкладывать их друг в друга: `group/card` и `group-hover/card:`.

| Вариант | Применяется, когда группа | Rust |
|---|---|---|
| `group-active:` | нажата | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | под курсором | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | в фокусе |  |
| `group-focus-within:` | в фокусе или содержит фокус | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | отключена |  |
| `group-selected:` | выбрана |  |
| `group-checked:` | отмечена |  |
| `group-indeterminate:` | в неопределённом состоянии |  |
| `group-aria-expanded:` | развёрнута |  |
| `group-aria-pressed:` | переключатель включён |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | занята, отмечена, выбрана |  |
| `group-data-<name>:` | показывает атрибут `data-*` `name` |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### Позиция среди соседних элементов

| Вариант | Применяется к |
|---|---|
| `first:` | первому дочернему элементу |
| `last:` | последнему дочернему элементу |
| `only:` | единственному дочернему элементу |
| `odd:` | 1-му, 3-му, ... дочернему элементу |
| `even:` | 2-му, 4-му, ... дочернему элементу |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Плейсхолдер и выделение

`placeholder:` применяется к плейсхолдеру элемента `<Input>` и принимает только цвет текста: `placeholder:text-zinc-400` (ключ стиля `placeholderColor`). `selection:` применяется к выделению элемента `<Input>` или выделяемого элемента `<Text>`, а на любом элементе — к выделению внутри него (`& *::selection` в Tailwind; побеждает ближайший элемент), и принимает фон — подсветку: `selection:bg-violet-200` (ключ стиля `selectionColor`, который также окрашивает каретку поля ввода там, где платформа рисует её одним цветом).

<a id="important"></a>

### Важно

`!` до или после утилиты (`!p-4`, `p-4!`) делает её приоритетнее всех остальных классов и встроенного `style`.

<a id="theme-customization"></a>

## Настройка темы

Расширьте тему в объекте `"tailwind"` файла `nsh.json` вашего приложения. Записи с новым именем добавляются; записи с существующим именем заменяют значения по умолчанию. Длины задаются в пунктах. Тема проверяется при сборке приложения: неизвестный ключ или недопустимое значение приводят к ошибке сборки.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

С такой темой работают `bg-brand-500`, `bg-brand` (оттенок `DEFAULT`), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` и `max-w-content`.

| Ключ | Значение | Используется в |
|---|---|---|
| `colors` | `{ name: color }` или `{ name: { shade: color } }`; `DEFAULT` задаёт имя базового цвета. Любой синтаксис цвета CSS. | всех утилитах цвета |
| `spacing` | пунктов на шаг (по умолчанию 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | пунктов на `rem` (по умолчанию 16) | |
| `breakpoints` | `{ name: width }` | вариантах точек останова (сортируются по ширине) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (системное семейство или имя встроенного шрифта) | `font-*` |
| `fontSize` | `{ name: size }` или `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Тема Tailwind определяет только классы вашего приложения. Дизайн-токены приложения (цвета shadcn/ui, `radius`, шрифты и собственные токены приложения) — это его тема, ключ `"theme"` в `nsh.json`, которой рисуют компоненты Rust; см. [Rust](../docs/rust.md#theme). Классы обращаются к этим токенам как к переменным `@theme` в именовании Tailwind (`bg-primary`, `bg-up/30`, `rounded-(--radius)`): см. [Токены темы](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## См. также

- [Tailwind](../docs/tailwind.md): руководство.
- [Стилизация](../docs/styling.md): `class`, `classList`, `style` и как они сочетаются.
- [Справочник по стилям](./style-reference.md): ключи стиля, которые задают утилиты.
