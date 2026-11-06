---
title: "Справочник по стилям"
description: "Все ключи стилей, которые принимает NSH, сгруппированные по LayoutStyle, ViewStyle, TextStyle, InputStyle и ImageStyle, с указанием типа и назначения каждого ключа."
order: 16
source_hash: 012ce37fb9fe065c
---

# Справочник по стилям

Эта страница перечисляет каждый ключ пропа `style` и метод `Styled`, который задаёт его в Rust. Компоненты на Rust стилизуют элементы типизированными методами, названными по утилитам Tailwind (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)` из `nsh_core::prelude`), которые преобразуются в те же ключи; TSX передаёт объекты `style` (и классы). В колонке Rust указан метод; в большинство методов можно передать значение, сигнал или замыкание, а `.style_when(…)` / `.style_with(…)` делают любой из них условным. Ключи и их типы берутся из сгенерированных объявлений в `.nsh/types/nsh/types.d.ts`, поэтому редактор проверяет их по мере ввода. Ключ стиля означает CSS-свойство с тем же именем, так же как и класс, который его задаёт: `paddingLeft` — это `padding-left` и `pl-4` в CSS, `boxShadow` — это `box-shadow` и `shadow-md`; несколько ключей имеют более простые имена, которые используют приложения (`paddingHorizontal` вместо `padding-inline`, `marginStart` вместо `margin-inline-start`, `numberOfLines` вместо `line-clamp`). Числа задаются в пунктах, и возможности CSS тоже доступны: grid, градиенты, тени блоков, фильтры, режимы наложения, контуры, трансформации, переходы и анимации по ключевым кадрам.

О том, как применять стили, комбинировать их с классами и наследовать стили текста, см. [Стилизация](../docs/styling.md). О синтаксисе классов см. [справочник по Tailwind](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## Пять интерфейсов

Каждый интерфейс расширяет предыдущий:

| Интерфейс | Расширяет | Где используется |
|---|---|---|
| `LayoutStyle` | | Раскладка каждого элемента (flexbox, grid, размеры, отступы, позиционирование) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, элементы управления и все остальные элементы |
| `TextStyle` | `ViewStyle` | `<Text>` и `<Input>` (а также представления, чьи стили текста передаются тексту внутри них) |
| `InputStyle` | `TextStyle` | `<Input>`: добавляет `placeholderColor` и `caretColor` |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style` также принимает массив; элементы объединяются слева направо, а ложные элементы пропускаются, так что для условных стилей не нужно использовать spread. В Rust `.style_when(condition, …)` добавляет стили, пока выполняется условие:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> Встроенный `style` всегда приоритетнее `class`. Установка ключа в `null` или `undefined` сбрасывает его к значению по умолчанию.

<a id="how-style-keys-read"></a>

## Как читать ключи стилей

Ключи стилей следуют CSS, поэтому стиль и класс, называющие одно свойство, делают одно и то же:

- **Направление раскладки.** Представление, в котором не задан `display`, раскладывает дочерние элементы в колонку. `display: "flex"` — это строка, если не задан `flexDirection`, как в CSS и в классе `flex`. `flexShrink` равно `0`, если не задано иное.
- **Физические и логические стороны.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` и `textAlign: "left"` сохраняют свою сторону в раскладках справа налево. Ключи start и end (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), семейство `borderTopStartRadius` и `textAlign: "start" | "end"` следуют направлению: inline start — это левая сторона в раскладках слева направо и правая в раскладках справа налево.
- **Цвета границ.** Граница или контур, у которых задана толщина, но не задан цвет, рисуются цветом текста (`currentColor` в CSS).
- **Трансформации.** `translate`, `rotate` и `scale` — отдельные свойства, а `transform` принимает строку функций CSS или список шагов, величины в которых могут быть анимированными значениями. Они применяются в таком порядке: `translate`, `rotate`, `scale`, затем `transform`.

<a id="value-types"></a>

## Типы значений

| Тип | Допускает | Rust |
|---|---|---|
| `number` | Пункты (не зависят от плотности). `1` — это один пункт на iOS и один dp на Android. | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (пункты), `` `${number}%` `` (от родителя) или `"auto"`. | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (пункты) или `` `${number}%` ``. Без `"auto"`. | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | Строка с цветом CSS: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()` или именованный цвет CSS (`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, цвета темы (`theme().primary`) |
| `EnvValue` | Переменная окружения в padding или margin: `env(name)`, `env(name, <length>)` (длина подставляется вместо неизвестного имени), `calc(env(name) + <length>)` или `calc(<length> + env(name))`. Допустимые имена: `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Безопасная область](../elements/safe-area.md)) и `keyboard-inset-height` ([Клавиатура](../elements/keyboard.md)). Принимается физическими ключами padding и margin и их сокращёнными формами. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | Нативное анимированное значение или узел, производный от него (см. [API анимации `nsh`](./nsh.md#animation)). Принимается ключами `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, шагами списка `transform` и ключами `top` / `left` закреплённого (sticky) представления; значение при этом анимируется в UI-потоке без JS. | `AnimatedValue` / `AnimatedNode`, привязывается с помощью `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... |

Строки с синтаксисом CSS (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) принимают длины в `px` и в виде чисел без единиц (оба варианта — пункты), `pt` (4/3 пункта, как в CSS) или `rem` (16 пунктов).

## LayoutStyle

Раскладка вычисляется в Rust (flexbox и CSS grid). Представление, в котором не задан `display`, является flex-контейнером, чьи дочерние элементы выстраиваются в колонку; `display: "flex"` превращает его в строку, если не задан `flexDirection`, как в CSS. По умолчанию у элементов `flexShrink: 0`, `alignContent: "flex-start"` (у grid: `"normal"` из CSS), `alignItems: "stretch"` и нет автоматического минимального размера. См. [Раскладка](../docs/layout.md).

<a id="display-and-position"></a>

### Display и позиционирование

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | Раскладка дочерних элементов. `"flex"` раскладывает их в строку, если `flexDirection` не задаёт направление, как в CSS; представление без заданного display раскладывает их в колонку. `"none"` убирает элемент из раскладки и скрывает его. `"block"` выстраивает дочерние элементы так же, как блочная раскладка CSS. |
| `boxSizing` | `"border-box" \| "content-box"` | | Размеры включают границы и внутренние отступы либо только содержимое. По умолчанию `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` изымает элемент из потока и размещает его по `top` / `right` / `bottom` / `left` относительно ближайшего позиционированного предка (его родителя, если только тот не `"static"`). `"static"` остаётся в потоке и игнорирует смещения. `"fixed"` сохраняет тип элемента, раскладывает и монтирует его в корне своей поверхности или модального окна, удерживая его на месте, пока окружающее содержимое прокручивается. `"sticky"` остаётся в потоке и, пока его родитель находится в области видимости, прилипает на расстоянии `top` (`left` в горизонтальном scroll view) от начала видимой области окружающего scroll view, пока его конец не встретится с концом content box родителя; он рисуется поверх соседних элементов с тем же `zIndex`. По умолчанию `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | Смещение от верхнего края родителя (absolute) или от собственной позиции элемента (relative). У sticky-представления — место, где оно прилипает; анимированное значение сдвигает его каждый кадр. |
| `right` | `DimensionValue` | `.right(…)` | Смещение от правого края при любом направлении. |
| `bottom` | `DimensionValue` | `.bottom(…)` | Смещение от нижнего края. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | Смещение от левого края при любом направлении. У sticky-представления в горизонтальном scroll view — место, где оно прилипает; анимированное значение сдвигает его каждый кадр. |
| `start` | `DimensionValue` | | Смещение от начального inline-края: слева в раскладках слева направо, справа в раскладках справа налево. |
| `end` | `DimensionValue` | | Смещение от конечного inline-края: справа в раскладках слева направо, слева в раскладках справа налево. |
| `zIndex` | `number` | `.z_index(z)` | Порядок среди соседних элементов (стабильный при равных значениях); также определяет нативный порядок наложения. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | Направление раскладки, по умолчанию наследуется. Как и в CSS, свойства `left` и `right` сохраняют свои стороны при раскладке справа налево, а свойства inline start / end (`marginStart`, `end`, ...) берут стороны, которые им задаёт направление. |

### Flexbox

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | Главная ось. По умолчанию `"column"` для представления, в котором не задан `display`, и `"row"`, как только задан `display: "flex"`. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | Переносятся ли дочерние элементы на несколько строк. По умолчанию `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | Одно число, а не сокращённая запись CSS: положительное число задаёт для `flexGrow` это значение, а `flexShrink: 1` и `flexBasis: 0`; `0` делает элемент негибким; отрицательное число сжимает его до минимального размера. |
| `flexGrow` | `number` | `.flex_grow(f)` | Какую долю свободного места занимает элемент. По умолчанию `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | Насколько элемент сжимается, когда места не хватает. По умолчанию `0`, а не `1`, как в CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | Размер по главной оси до распределения свободного места. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | Распределение дочерних элементов вдоль главной оси. По умолчанию `"normal"`: `"flex-start"` во flex-контейнерах; в grid растягиваются треки с размером `auto`. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | Выравнивание дочерних элементов по поперечной оси. По умолчанию `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | Переопределяет `alignItems` родителя для этого элемента. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | Распределение перенесённых строк (и треков grid) по поперечной оси. По умолчанию `"flex-start"` во flex-контейнерах и `"normal"` в grid, где растягиваются треки с размером `auto`. `"start"` / `"end"` следуют направлению письма. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | Расстояние между строками и колонками дочерних элементов. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | Расстояние между строками. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | Расстояние между колонками. |

### Grid

Задайте `display: "grid"`, чтобы раскладывать дочерние элементы в CSS grid. Списки треков используют синтаксис CSS.

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Треки колонок: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, имена линий (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Треки строк, тот же синтаксис. |
| `gridAutoColumns` | `string` | | Размер неявно создаваемых колонок. |
| `gridAutoRows` | `string` | | Размер неявно создаваемых строк. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | Как элементы без заданного размещения заполняют grid. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Размещение по колонкам: `"1 / 3"`, `"span 2"`, номер линии или имя линии (`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | Начальная линия колонки. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | Конечная линия колонки. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Размещение по строкам, тот же синтаксис, что и у `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | Начальная линия строки. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | Конечная линия строки. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Как элементы grid располагаются в своих областях вдоль строки. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Переопределяет `justifyItems` для этого элемента. |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

<a id="size"></a>

### Размер

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | Ширина. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | Высота. |
| `minWidth` | `LengthValue` | `.min_w(…)` | Минимальная ширина. |
| `minHeight` | `LengthValue` | `.min_h(…)` | Минимальная высота. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | Максимальная ширина. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | Максимальная высота. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | Ширина, делённая на высоту: число (`1.5`) или отношение из CSS (`"16 / 9"`); недостающий размер вычисляется из другого. `"auto"` не задаёт ничего. |

<a id="margin"></a>

### Внешние отступы

Внешние отступы принимают `"auto"` (поглощает свободное место, как во flexbox) и отрицательные значения. Физические ключи (все, кроме `marginStart` / `marginEnd`) также принимают `EnvValue`: `marginBottom: "env(keyboard-inset-height)"` (в Rust `.mb_keyboard()`, `.mt_safe_area()`, ...).

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | Все четыре стороны. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | Слева и справа. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | Сверху и снизу. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | Сверху. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | Справа. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | Снизу. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | Слева. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Inline start: слева в раскладках слева направо, справа в раскладках справа налево. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Inline end: противоположная сторона по отношению к `marginStart`. |

<a id="padding"></a>

### Внутренние отступы

Физические ключи (все, кроме `paddingStart` / `paddingEnd`) также принимают `EnvValue`: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (в Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Внутренний отступ не может быть меньше 0.

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | Все четыре стороны. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | Слева и справа. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | Сверху и снизу. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | Сверху. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | Справа. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | Снизу. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | Слева. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Inline start: слева в раскладках слева направо, справа в раскладках справа налево. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Inline end: противоположная сторона по отношению к `paddingStart`. |

## ViewStyle

Всё, что рисуется представлением. Применяются также все ключи `LayoutStyle`.

<a id="background"></a>

### Фон

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | Цвет заливки. Принимает нативный анимированный цвет. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` с `.gradient_from` / `_via` / `_to` | Градиенты CSS, рисуемые поверх цвета фона: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, несколько через запятую. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### Границы

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | Ширина всех четырёх сторон. |
| `borderTopWidth` | `number` | `.border_t(w)` | Верхняя сторона. |
| `borderRightWidth` | `number` | `.border_r(w)` | Правая сторона. |
| `borderBottomWidth` | `number` | `.border_b(w)` | Нижняя сторона. |
| `borderLeftWidth` | `number` | `.border_l(w)` | Левая сторона. |
| `borderStartWidth` | `number` | `.border_s(w)` | Начальная сторона по направлению строки (слева в раскладках слева направо, справа в раскладках справа налево). |
| `borderEndWidth` | `number` | `.border_e(w)` | Конечная сторона по направлению строки. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | Цвет всех четырёх сторон. Принимает нативный анимированный цвет. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | Верхняя сторона. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | Правая сторона. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | Нижняя сторона. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | Левая сторона. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | Начальная сторона по направлению строки. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | Конечная сторона по направлению строки. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | Стиль линии. По умолчанию `"solid"`. `"none"` и `"hidden"` не рисуют границу и не отводят под неё место в раскладке при любой ширине, заданной до или после, как в CSS. |

Сторона, у которой задана ширина, а цвет не задан нигде, рисуется цветом текста, как CSS `currentColor`: `{ borderWidth: 1, color: "#2563eb" }` рисует синюю границу. Контуры берут цвет текста так же.

<a id="corners"></a>

### Углы

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | Радиус всех четырёх углов. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | Верхний левый угол. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | Верхний правый угол. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | Нижний правый угол. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | Нижний левый угол. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | Верхний угол на начальной стороне по направлению строки. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | Верхний угол на конечной стороне по направлению строки. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | Нижний угол на начальной стороне по направлению строки. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | Нижний угол на конечной стороне по направлению строки. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: углы, кривизна которых плавно переходит в края, как у иконок приложений iOS. Если блок слишком мал, кривая становится круговой, поэтому «таблетки» остаются таблетками. Работает на обеих платформах. |

<a id="outline"></a>

### Контур

Контур рисуется снаружи границы и не занимает места в раскладке.

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | Ширина линии. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | Цвет линии. По умолчанию цвет текста. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | Стиль линии. |
| `outlineOffset` | `number` | `.outline_offset(o)` | Расстояние от края границы; отрицательные значения сдвигают контур внутрь. |

<a id="shadows"></a>

### Тени

Представление отбрасывает тени через CSS `boxShadow`: несколько слоёв, тени с растяжением и внутренние тени. Переходы анимируют их (`transitionProperty: "boxShadow"`).

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | CSS `box-shadow`: смещения, размытие, растяжение и цвет, несколько слоёв через запятую, `inset` для внутренних теней; либо слои в виде чисел, `[{ x, y, blur, spread, color, inset }]` (обязательны только `x` и `y`); слой без цвета рисуется цветом текста, как CSS `currentColor`. `.shadow_color(c)` перекрашивает слои пресета или `.shadow(…)`. |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> На Android для теней нужен фон: представление с прозрачным фоном (например, текст без подложки) тени не отбрасывает. Для material-тени Android используйте проп `android={{ elevation }}` вместо стиля.

<a id="opacity-visibility-and-overflow"></a>

### Прозрачность, видимость и переполнение

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | От 0 (невидимо) до 1. Принимает нативное анимированное значение. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | Скрытые представления сохраняют своё место в раскладке (в отличие от `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` обрезает дочерние элементы по границам представления (и его углам). |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: невидимо, пока 3D-поворот отворачивает его. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | Положение представления или изображения внутри `<Text>` в его строке, как CSS `vertical-align`: нижний край на базовой линии (по умолчанию), верх или низ на верхней или нижней границе шрифта текста, либо середина на половине x-высоты над базовой линией. Строка увеличивается, чтобы вместить его. |

<a id="transforms"></a>

### Трансформации

Трансформации устроены как в CSS: свойства `translate`, `rotate` и `scale` и свойство `transform` применяются в этом порядке. Каждое из них является отдельным свойством, поэтому `scale` в стиле заменяет `scale-*` из класса и сохраняет его `rotate-*`, а `transform` в стиле заменяет функции трансформации из класса (`rotate-x-*`, `skew-*`).

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | CSS `translate`: сначала x, затем y (`"10px 20px"`; проценты от собственного размера представления, `"-50% 0"`). Число задаёт точки по оси x. `[x, y]` принимает число, строку (`"50%"`, `"10px"`) или анимированное значение для каждой оси; одно анимированное значение сдвигает по оси x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | CSS `rotate`: `"45deg"`, `"0.5turn"` или вокруг оси, `"x 90deg"`. Число и анимированное значение задают градусы вокруг оси z по часовой стрелке. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | CSS `scale`: `1.5`, `"150%"`, x и y (`"1 2"`). Анимированное значение масштабирует обе оси; `[x, y]` принимает число или анимированное значение для каждой оси. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; анимированные шаги: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (после всех трансформаций стиля) | CSS `transform`: `"translateX(10px) rotate(45deg) scale(1.5)"` или `"none"`. Функции: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. Длины принимают `px` (сдвиги также `%`, от собственного размера представления), углы `deg`, `rad` или `turn`. Либо список шагов, величины которых могут быть анимированными значениями: то, что строка выразить не может, например анимированный 3D-поворот (`[{ perspective: 800 }, { rotateY: angle }]`), и каналы движения (`m.transform`). `transform` в стиле имеет одну из двух форм, поэтому перспектива перед анимированными шагами является шагом списка. Применяется после `translate`, `rotate` и `scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | Точка, относительно которой действуют трансформации: ключевые слова, проценты и длины (`"top left"`, `"50% 0"`, `[10, 20]`). По умолчанию центр. |

`TransformStep` — это объект с одним ключом, применяемый в порядке списка:

| Шаг | Значение | Нативная анимация |
|---|---|---|
| `translateX`, `translateY` | `number` (точки) | да |
| `scale`, `scaleX`, `scaleY` | `number` (коэффициент) | да |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (градусы) или `string` (`"45deg"`, `"0.5rad"`) | да |
| `skewX`, `skewY` | `number` (градусы) или `string` | нет |
| `perspective` | `number` (точки) | нет |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

Анимированное значение напрямую управляет `translate`, `rotate` и `scale`, а также шагами списка `transform`:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android не рисует наклон: `skew()`, `skewX()` и `skewY()` оставляют представление ненаклонённым.

<a id="filters-and-blending"></a>

### Фильтры и смешивание

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | CSS-фильтры представления и его содержимого: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | CSS-фильтры того, что находится позади представления, например `"blur(10px)"` для эффекта матового стекла. |
| `maskImage` | `string` | | CSS-градиент, альфа-канал которого определяет, какая часть представления рисуется: полностью там, где он непрозрачен, и совсем не рисуется там, где прозрачен: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. Маскирует всё, что рисует представление, включая его фильтр заднего плана. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass позади содержимого представления на iOS 26 и macOS 26 и новее. `"regular"` использует стандартный материал; `"clear"` берёт меньше цвета из фона. `"none"` — значение по умолчанию. Используйте вместе с `backdropFilter` для размытия, которое показывается на более ранних версиях iOS и других платформах. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | Как представление смешивается с тем, что находится позади него. |

> [!WARNING]
> Ограничения платформ:
> - iOS применяет к представлениям только `opacity()`, `brightness()` до 1 и `drop-shadow()`. `<Image>` принимает все цветовые фильтры и `blur()`, применяемые при декодировании изображения.
> - Размытие `backdropFilter` на iOS использует системный материал с долей непрозрачности, то есть приближение точного радиуса.
> - Android требует API 31 для `blur()`, `drop-shadow()` и `backdropFilter`; ниже применяются только цветовые фильтры. Режимы смешивания требуют API 29.

<a id="transitions"></a>

### Переходы

Когда меняется свойство с переходом (из-за нового стиля, класса или варианта вроде `active:`), платформа анимирует его нативно. Во время анимации JS не выполняется.

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | Свойства через запятую, которые анимируются: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (все свойства трансформации), `"boxShadow"`, `"borderRadius"`, `"borderWidth"` или `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | Миллисекунды в виде числа либо `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | Задержка перед началом перехода. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | Кривая плавности. |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### Анимации по ключевым кадрам

Встроенные анимации по ключевым кадрам, выполняются нативно (`animate-*` из Tailwind).

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | Анимация. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Длительность одной итерации. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Задержка перед первой итерацией. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | Кривая плавности. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | Сколько раз она выполняется. |

Для анимаций, управляемых значениями, жестами или пружинами, используйте вместо этого [API анимации `nsh`](./nsh.md#animation).

<a id="pointer-and-selection"></a>

### Указатель и выделение

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (все ключевые слова CSS cursor и `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | Форма указателя над представлением для указывающих устройств (трекпады iPad, Mac Catalyst, настольные системы). Диагональные ключевые слова изменения размера сохраняют свою ось: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) и `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, веб и GPUI показывают диагональные курсоры; AppKit использует их на macOS 15+, а на macOS 14 показывает открытую ладонь. UIKit использует эффекты указателя на iPad и Mac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | Какие касания принимают представление и вложенные в него представления (`pointer-events-none`, `pointer-events-auto`). `"none"`: никакие, в том числе для вложенных представлений, если только какое-то из них не задаёт `"auto"`, значение наследуется, как в CSS. `"box-none"`: само представление не принимает касания, а вложенные принимают свои; `"box-only"`: касания принимает само представление, а вложенные не принимают (оба значения как в React Native, только для самого представления). По умолчанию `"auto"`. См. [касания и жесты](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | Можно ли выделять и копировать `<Text>` (`"text"`, `select-text`) или нет (`"none"`, `select-none`); значение представления распространяется на вложенные в него тексты, которые его не задают. `"auto"` (`select-auto`), значение по умолчанию, оставляет решение окружающему представлению, а иначе платформе. См. [текст](../elements/text.md). |

<a id="svg-paint"></a>

### SVG-заливка и обводка

CSS-свойства отрисовки SVG-фигур, которые принимает любой элемент и наследуют вложенные в него элементы, как в браузере.
Они определяют, чем закрашивается то, что компоненты Rust рисуют на холстах.

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | Чем заливаются фигуры; `currentColor` — это цвет текста элемента. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | Чем рисуются контуры фигур. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | Ширина этих контуров, длина (по умолчанию 1). |
| `strokeDasharray` | `number \| string` | — | Штрихи и промежутки вдоль этих контуров: длины через пробелы или запятые (`"4 2"`), нечётный список повторяется, либо `"none"`. |

## TextStyle

Стили текста применяются к `<Text>` и `<Input>`. Они также наследуются, как в CSS: свойства текста, заданные на представлении, передаются находящимся внутри него текстам и полям ввода, а вложенные фрагменты `<Text>` наследуют их от родительского текста. Все ключи `ViewStyle` тоже применяются. См. [Текст](../docs/text.md).

<a id="font"></a>

### Шрифт

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | Цвет текста. Принимает нативный анимированный цвет. Это также цвет границ и контуров, у которых он не задан. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | Размер в пунктах. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) или 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | Системное семейство, либо имя, в которое вычисляется импортированный шрифт (`import Inter from "./Inter.ttf"`), либо их список, от наиболее предпочтительного (`"Brand, 'Noto Sans SC', sans-serif"`). См. [Шрифты](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | Курсив. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | Числовые и буквенные формы OpenType: список (`["tabular-nums"]`) или имена CSS через пробелы (`"tabular-nums small-caps"`). `tabular-nums` сохраняет одинаковую ширину цифр, что удобно для счётчиков и таймеров. |
<a id="spacing-and-alignment"></a>

### Интервалы и выравнивание

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | Высота строки в пунктах. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | Дополнительный интервал между символами, в пунктах. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | Горизонтальное выравнивание. `"left"` и `"right"` сохраняют свои стороны в раскладках справа налево; `"start"` и `"end"` следуют направлению. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | Базовое направление текста; `"auto"` берёт его из содержимого. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | Преобразование регистра. |

> [!TIP]
> Классы Tailwind `leading-*` и `tracking-*` задают высоту строки как кратное размеру шрифта, а межбуквенный интервал — в `em`, поэтому они масштабируются вместе с размерами `text-*`.

<a id="lines-and-overflow"></a>

### Строки и переполнение

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | Наибольшее число строк, которое показывает `<Text>` (CSS-свойства `line-clamp`, `line-clamp-*`); `0` (`line-clamp-none`), значение по умолчанию, показывает все строки. `truncate` — одна строка, обрезанная многоточием. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | Как обрезается ограниченный `<Text>`: многоточие в конце (`"ellipsis"`, `text-ellipsis`, по умолчанию), обрезка без многоточия (`"clip"`, `text-clip`) или многоточие в начале либо в середине (для путей к файлам). |

<a id="decoration"></a>

### Декорирование

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | Линии, рисуемые вместе с текстом. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | Цвет линий (по умолчанию цвет текста). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | Стиль линии. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | Толщина линии. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | Расстояние от подчёркивания до базовой линии. |

<a id="placeholder-caret-and-selection"></a>

### Плейсхолдер, каретка и выделение

`placeholderColor` и `caretColor` относятся к `InputStyle`, стилю `<Input>`; `selectionColor` — к `TextStyle`, так как
выделяемые тексты тоже его принимают.

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` поля ввода | Цвет плейсхолдера `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | Где располагается текст, который короче своего блока (`<Text>` с заданной высотой). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` поля ввода или текста | Подсветка выделения и маркеры выделения у `<Input>` или у выделяемого `<Text>` (`selection:bg-*`); по умолчанию — акцентный цвет платформы. В iOS также каретка поля ввода, если не задан `caretColor` (UIKit окрашивает оба элемента одним цветом). |
| `caretColor` | `ColorValue` | `.caret_color(c)` поля ввода | Каретка `<Input>` (`caret-*`); если не задана, используется значение платформы по умолчанию. |

<a id="text-shadow"></a>

### Тень текста

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | CSS-свойство `text-shadow`: смещения, размытие и цвет (`"0 1px 2px rgb(0 0 0 / 0.3)"`) или его слои в виде чисел, `[{ x, y, blur, color }]`; из нескольких слоёв рисуется самый широкий; слой без цвета рисуется цветом текста; `"none"`. |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> iOS не рисует градиенты (`backgroundImage`) и внутренние (inset) тени блока на `<Text>`.

## ImageStyle

Все ключи `ViewStyle`, а также:

| Ключ | Тип | Rust | Описание |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` изображения | Перекрашивает шаблонное изображение (каждый непрозрачный пиксель принимает этот цвет), для монохромных иконок. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | CSS-свойство `object-fit`: как изображение или видео вписывается в свой блок. `"cover"` заполняет блок и обрезает, `"contain"` вписывает целиком, `"fill"` растягивает, `"none"` сохраняет естественный размер, `"scale-down"` — это `"none"` или `"contain"`, в зависимости от того, что меньше. По умолчанию изображения покрывают свой блок, а видео вписываются в него. |
| `objectPosition` | `string` | `.object_position(p)`, `.object_top()`, ... изображения | Где изображение располагается в своём блоке после того, как `objectFit` задал размер, как в CSS `object-position`: ключевые слова, проценты и длины (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). Покрывающее изображение обрезается вокруг этой точки. По умолчанию — центр. |

`objectFit` применяется и к `<Video>`; см. [image](../elements/image.md) и [video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## Свойства, которые похожи на стили

Тень Material в Android — это свойство платформы, которое задаётся рядом со стилем:

| Настройка | Свойство | Rust | Класс |
|---|---|---|---|
| Тень Material (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## См. также

- [Стилизация](../docs/styling.md): `style`, `class`, наследование и приоритет.
- [Справочник Tailwind](./tailwind-reference.md): все поддерживаемые утилиты и варианты.
- [Раскладка](../docs/layout.md): flexbox и grid на практике.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): элементы, к которым применяются эти стили.

`width`, `height` и `flexBasis` также принимают `"min-content"`, `"max-content"` и `"fit-content"`, вычисляемые Taffy.
