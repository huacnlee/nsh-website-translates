---
title: "Раскладка"
description: "Flexbox с направлением column по умолчанию, CSS grid, размеры и проценты, соотношение сторон, абсолютное позиционирование, измерение с помощью onLayout, адаптивные раскладки и письмо справа налево на Rust и TSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# Раскладка

NSH размещает каждый элемент с помощью [Taffy](https://github.com/DioxusLabs/taffy), реализации на Rust flexbox-, grid- и block-раскладки CSS, настроенной так, что дочерние элементы по умолчанию выстраиваются вертикально и не сжимаются. Раскладка выполняется в ядре после каждого такта вашего кода, и в нативные представления отправляются только изменившиеся кадры. Текст измеряется текстовым движком платформы в том же потоке, поэтому раскладка никогда не ждёт главного потока.

Перечисленные ниже свойства раскладки являются свойствами стиля. В Rust это типизированные методы стиля (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`); в TSX это ключи пропа `style`, и у каждого есть класс [Tailwind](./tailwind.md) (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...). Оба варианта приводятся к одним и тем же нативным стилям.

## Flexbox

Представление раскладывает дочерние элементы с помощью flexbox. Представление, в котором не задан `display`, выстраивает потомков в столбец; `display: "flex"` в стиле делает строку, если не задан `flexDirection`, точно как в CSS и как класс Tailwind `flex`. Если ничего из этого не задано, действуют следующие значения по умолчанию:

| Свойство | Значение по умолчанию в NSH | Значение по умолчанию в вебе |
|---|---|---|
| `flexDirection` | `"column"` (представление, в котором не задан `display`); `"row"`, как только задан `display: "flex"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (сетки: `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| Свойство | Значения | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | Главная ось: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Поперечная ось: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | Выравнивание одного дочернего элемента по поперечной оси; `"auto"` следует `alignItems` родителя | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | Линии контейнера с переносом | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | Краткая запись одним числом (см. ниже) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | Как в CSS | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | Промежутки между дочерними элементами | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)` и шаги `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` и `flex-end` следуют направлению flex; `start` и `end` следуют направлению письма, как в CSS (при письме справа налево `start` означает правую сторону), а `self-start` / `self-end` следуют собственному направлению дочернего элемента.

`flex` является краткой записью CSS, как и классы Tailwind `flex-*`: число `n` означает рост на `n`, сжатие на 1 и начальный базис 0, поэтому соседние элементы `flex: 1` (`.flex_1()` в Rust, `flex-1`) делят пространство поровну независимо от содержимого; `"none"` равно `0 0 auto` (представление сохраняет свой размер), `"auto"` равно `1 1 auto`, `"initial"` равно `0 1 auto`, а рост, сжатие и базис можно записать явно (`"2 0 50%"`, `"1 1 120px"`). Поскольку минимальные размеры по умолчанию равны 0, `flex: 0` (`0 1 0`) сжимает представление до нуля, если `minWidth: "auto"` не сохраняет размер его содержимого.

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

Поскольку минимальные размеры по умолчанию равны 0, текст `flex: 1` в строке сжимается и переносится, а не выталкивает соседей. `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`, `.min_w(auto())` в Rust) задаёт автоматический минимум CSS: сжимаемый элемент останавливается на наименьшем размере своего содержимого (для текста это самое длинное слово), как в вебе.

> [!NOTE]
> `display: "flex"` означает строку, в стиле, в классе (`flex`) и в Rust (`.flex()`) одинаково, если не задано направление: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. Представлению без `display` ничего не нужно, чтобы быть столбцом.

<a id="sizes"></a>

## Размеры

| Свойство | Значения | Rust |
|---|---|---|
| `width`, `height` | Пункты, процент от родителя (`"50%"`) или `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, шаги `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Пункты или проценты; для `minWidth` / `minHeight` также `"auto"`, то есть наименьший размер содержимого | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | Ширина, делённая на высоту: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | Пункты или проценты | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ... и шаги `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | Пункты, проценты или `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

В Rust длина типизирована: `px(16.0)` равно 16 пунктам, `relative(0.5)` равно 50% от родителя, `auto()` равно `auto`. Методы-шаги следуют шкале отступов Tailwind, где один шаг равен 4 пунктам (`.p_4()` равно 16 пунктам, `.gap_0p5()` равно 2 пунктам).

Без заданного размера представление имеет размер своего содержимого (плюс отступы) и растягивается по поперечной оси родителя благодаря `alignItems: "stretch"` по умолчанию. Проценты считаются от размера родителя (для padding и margin, как в CSS, от его ширины).

`aspectRatio` вычисляет другое измерение по известному:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

Изображения из ресурсов приложения имеют естественный размер и раскладываются по нему, если размер не задан ([Изображения и ресурсы](./images-and-assets.md)). У удалённых изображений размера нет, пока они не загрузятся: задавайте его явно.

## Grid

`display: "grid"` (`.grid()` в Rust) раскладывает дочерние элементы по дорожкам сетки CSS:

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| Свойство | Значения | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | Списки дорожек CSS: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, имена линий | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | Дорожки неявно создаваемых столбцов и строк | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, номер или имя линии: `"content-start / content-end"`, `"2 col"` (вторая линия с именем `col`), `"span col"` (до следующей линии с именем `col`) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Номера или имена линий | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (номера линий) |
| `justifyItems`, `justifySelf` | Как элементы располагаются в своих областях вдоль строки: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | Как элементы располагаются в своих областях вдоль столбца | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | Как дорожки располагаются в сетке вдоль строки и столбца | `.justify_*()` |

Шаблоны называют свои линии в квадратных скобках, по одному или нескольку имён на линию, и элементы размещаются по этим именам, как в CSS (в Rust по номерам линий):

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

В сетке `justifyContent` и `alignContent` по умолчанию имеют значение CSS `"normal"`: дорожки размером `auto` растягиваются на весь контейнер, поэтому сетка с высотой и без шаблона строк делит эту высоту между своими строками. Явно заданное значение (`"start"`, `"center"`, `"space-between"`, ...) размещает дорожки так же, как в CSS. Классы выравнивания задают ровно то, что задаёт Tailwind CSS: `content-start` (`align-content: flex-start`) и `place-content-start` прижимают дорожки к началу, а `content-normal` и `justify-normal` растягивают их, как в браузере.

`display: "block"` использует блочную раскладку CSS (дочерние элементы друг под другом, каждый шириной с контейнер), а `display: "none"` (`.hidden()`) убирает представление из раскладки.

<a id="absolute-positioning"></a>

## Абсолютное позиционирование

`position: "absolute"` (`.absolute()`) выводит представление из потока и размещает его с помощью `top`, `right`, `bottom` и `left` относительно родителя:

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

Смещения принимают пункты и проценты (`.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)` в Rust). Представление с `left` и `right` (или `top` и `bottom`) и без размера растягивается между ними. Более поздние соседи рисуются поверх более ранних; `zIndex` (`.z_index(n)`) меняет порядок.

<a id="measuring"></a>

## Измерение

`onLayout` (`.on_layout(..)`) сообщает кадр представления относительно родителя после каждой раскладки, в которой он изменился:

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

Кадр задаётся в пунктах: `Bounds<Points>` в Rust, `{ bounds }` в TSX, `Bounds` (`{ origin: { x, y }, size: { width, height } }`). Для всего окна читайте `window()` в Rust или `windowSize()` из [`nsh`](../modules/nsh.md#device) в TSX; оба учитывают поворот и изменение размера окна, а стиль, который их читает, меняется вместе с окном:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Брейкпоинты Tailwind (`sm:`, `md:`, ...) и `portrait:` / `landscape:` дают тот же результат без кода.

<a id="safe-areas"></a>

## Безопасные области

Корневое представление занимает весь экран, в том числе область под строкой состояния и индикатором «Домой». Добавляйте к экранам отступы по безопасным областям с помощью CSS `env()` (`paddingTop: "env(safe-area-inset-top)"`, Tailwind `pt-[env(safe-area-inset-top)]`, `.p_safe_area()` в Rust; см. [Безопасная область](../elements/safe-area.md)) или читайте отступы через `safe_area()` в Rust либо `safeArea()` / `safeAreaInsets()` в TSX и применяйте их самостоятельно. Страницы [стека навигации](./navigation.md) уже расположены под своим заголовком.

<a id="right-to-left"></a>

## Письмо справа налево

Направление раскладки приложения следует языку системы, а стиль `direction` представления (`"ltr"`, `"rtl"` или `"inherit"`; `.direction(LayoutDirection::Rtl)` в Rust) задаёт направление его поддерева. Когда приложение раскладывается справа налево:

- строки идут справа;
- `left` и `right` остаются на своих сторонах, как в браузере, и в ключах стиля, и в классах: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` и `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` остаются слева;
- логические свойства следуют направлению, причём начало строки (inline start) находится справа: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (`ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start` как классы; `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ... в Rust); `marginHorizontal` и `paddingHorizontal` задают обе стороны;
- текст с `textAlign: "auto"` выравнивается вправо, а нативные элементы управления зеркалируются.

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

Изменения направления, языка или представления, применяются сразу, без перезапуска. Стиль `direction` также позволяет оставить одно представление и его потомков в собственном направлении, например телефонный номер слева направо. На Android приложениям, встраивающим NSH, нужен `android:supportsRtl="true"` в манифесте, чтобы нативные элементы управления зеркалировались.

<a id="related"></a>

## См. также

- [Стили](./styling.md): как стили сочетаются между собой.
- [Прокрутка](./scrolling.md) и [Списки](./lists.md): содержимое, которое больше экрана.
- [Справочник по стилям](../modules/style-reference.md): каждое свойство раскладки и его тип.
