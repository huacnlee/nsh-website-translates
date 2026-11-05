---
title: "ColorPicker"
description: "Компонент ColorPicker и его части: цвет, выбираемый на области насыщенности и яркости, на ползунках любого канала RGB, HSL, HSB или OKLCH и альфа-канала, вводимый в любой форме CSS, выбираемый из образцов или с экрана с помощью пипетки, с клавишами WAI-ARIA и настраиваемыми элементами для программ чтения с экрана, с компоновкой и стилями, задаваемыми приложением."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

Выбор цвета хранит один цвет, а его части показывают и меняют его: `ColorArea` насыщенности и
яркости, `ColorSlider` для любого канала RGB, HSL, HSB или OKLCH и альфа-канала, `ColorField`, которые принимают
цвет как текст или один канал как число, `ColorSwatch` с готовыми цветами и `ColorEyeDropper`, выбирающий цвет
в любом месте экрана. Приложение раскладывает части
своими элементами между ними (строка на канал с его буквой, пространство, выбираемое с помощью `Tabs`, выбор цвета в `Popover`)
и стилизует каждую из них: части рисуют цвета каналов, а все размеры, радиусы, границы и тени задаёт
приложение.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` и `ColorEyeDropper` поставляются из [`nsh/base`](../modules/nsh-base.md),
крейта `nsh-base` в Rust. В Rust `color_picker()` и функции его частей создают их с помощью сеттера на каждое свойство
(`.channel(..)`, `.thumb_style(..)`), метода-слушателя на каждое событие (`.on_change(..)`) и типизированных методов стиля; цвет —
это `Hsla`, пространства, каналы и форматы — `ColorSpace`, `ColorChannel` и `ColorFormat`.

<a id="value"></a>

## Значение

Цвет — это CSS-цвет: hex (`#3b82f6`, `#3b82f680` с альфа-каналом), `rgb()`, `hsl()`, `hsb()`, `oklch()` или CSS-имя; в Rust — `Hsla`. Приложение владеет им через `value` и устанавливает тот цвет, о котором сообщает `onChange`, как для каждого элемента управления
`nsh/base`; либо оставляет цвет выбору с помощью `defaultValue` и всё равно получает уведомления об изменениях.

- `onChange({ value, formatted })` сообщает о каждом цвете, который запрашивает пользователь: на каждом шаге перетаскивания по области или слайдеру,
  при каждом нажатии клавиши, при вводе числа в поле, при нажатии на образец. `value` — это цвет, `formatted` — тот же цвет,
  записанный так, как указывает `format` (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` или `"oklch"`), готовый к сохранению или к использованию как токен.
- `onChangeEnd({ value, formatted })` один раз сообщает цвет, на котором закончилось изменение: когда указатель отпущен, после каждой клавиши,
  когда поле покинуто или отправлено, когда нажат образец.
- Выбор цвета хранит цвет в каждом пространстве в том виде, как его задал пользователь. Серый сохраняет оттенок и насыщенность, поэтому слайдер
  оттенка остаётся там, где его оставил пользователь; цвет, изменённый в OKLCH, сохраняет светлоту, chroma и оттенок так, как они введены, в том числе за пределами того, что
  показывает sRGB (сообщаемый цвет — ближайший из тех, что показывает sRGB, а `formatted` в `"oklch"` сохраняет каналы).
- `value`, заданный приложением и не сообщённый выбором цвета, заменяет цвет во всех пространствах.

<a id="spaces-and-channels"></a>

## Пространства и каналы

| `colorSpace` | Каналы (`channel`) | Диапазоны |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | от 0 до 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | оттенок от 0 до 360, остальные от 0 до 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | оттенок от 0 до 360, остальные от 0 до 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | светлота от 0 до 100 (шаг 0.1), chroma от 0 до 0.4 (шаг 0.001), оттенок от 0 до 360 (шаг 0.1) |
| любое | `"alpha"` | от 0 до 100 |

Трек слайдера рисует цвета своего канала при неизменных остальных каналах, поэтому показывает, к чему приводит каждое значение. Канал,
которого нет в его пространстве, заменяется первым каналом пространства (об этом сообщает предупреждение).

<a id="props"></a>

## Свойства

<a id="colorpicker-1"></a>

### ColorPicker

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | нет | Цвет (управляемый). Приложение устанавливает тот цвет, о котором сообщает `onChange`. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | Начальный цвет, пока `value` не задан; тогда выбор цвета хранит собственный цвет. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | Как `formatted` записывает цвет. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Никаких изменений ни от одной части; классы `disabled:` применяются к выбору цвета и его частям. |
| `children` | `.child(..)` | `JSX.Element` | нет | Части и элементы приложения между ними. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Сам выбор цвета: колонка (или строка) вокруг его частей. |

### ColorArea

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Панель, заполняющая область: цвета оттенка, насыщенность слева направо (справа налево в раскладке справа налево) и яркость снизу вверх, обрезанные по её углам. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Бегунок, центрированный на цвете. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | Фон бегунка — это цвет. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Никаких изменений от указателя, клавиатуры или средств чтения с экрана. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что средства чтения с экрана говорят о бегунке. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Область: её размер задаёт приложение. |

### ColorSlider

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | Пространство канала. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | Канал, который он меняет: один из каналов пространства или `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Направление трека: наименьшее значение в начале (слева, справа в раскладке справа налево) или внизу. Считывается при создании слайдера. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Трек: цвета канала вдоль него, обрезанные по его углам; бегунок размещается на нём. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Бегунок, центрированный на значении. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | Фон бегунка — это цвет (с его альфа-каналом на слайдере альфа-канала). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | нет | Цвет шахматного фона под треком, который просвечивает сквозь цвета слайдера альфа-канала. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Сторона квадратов шахматного фона. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Никаких изменений от указателя, клавиатуры или средств чтения с экрана. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что средства чтения с экрана говорят о бегунке. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Слайдер: полоса вокруг трека, принимающая нажатия и перетаскивания. |

### ColorField

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | нет | Канал, который поле принимает как число. Без него поле принимает весь цвет как текст. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | Пространство `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | Как поле записывает весь цвет. Читает любую форму CSS. |
| `placeholder` | `.placeholder(..)` | `string` | нет | Показывается, пока поле пусто. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ввод невозможен. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что средства чтения с экрана говорят о поле. |
| `class`, `style` | методы стиля | `string`, `StyleProp<TextStyle>` | нет | Поле, текстовый ввод. |

Поле канала меняет цвет по мере ввода числа, ограничивая его диапазоном канала; поле всего цвета меняет
его, когда поле покинуто или отправлено, если текст читается как цвет. При выходе из поля его значение записывается заново в своей
форме.

### ColorSwatch

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | нет | Цвет, который он показывает; нажатие выбирает его в окружающем выборе цвета. Без него — собственный цвет выбора: предпросмотр. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль, пока это цвет выбора, в виде классов `selected:`. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | нет | Шахматный фон под полупрозрачным цветом. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Сторона его квадратов. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нажатия не обрабатываются. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | цвет в hex | Что говорят средства чтения с экрана. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое поверх цвета: галочка на выбранном образце (`group-selected:`). |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Образец: его размер, форма и граница; его углы обрезают цвет. |

### ColorEyeDropper

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нажатия не обрабатываются. Кнопка также отключена там, где на платформе нет пипетки. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что говорят средства чтения с экрана. |
| `children` | `.child(..)` | `JSX.Element` | нет | Её содержимое: значок или подпись приложения. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Кнопка. |

Нажатие показывает системную пипетку: color sampler из AppKit на macOS, `EyeDropper` браузера в вебе (Chrome
и Edge). Выбранный цвет становится цветом выбора (`onChange`, затем `onChangeEnd`); Escape не выбирает ничего. Там, где на платформе
нет пипетки, кнопка отключена, а `disabled:hidden` скрывает её.

<a id="events"></a>

## События

| Событие | Чьё | Rust | Данные | Когда |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | Пользователь изменил цвет. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | Изменение завершено. Один раз на изменение. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | Образец нажат; работает и отдельно, как элемент палитры. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | Пользователь выбрал цвет на экране; работает и отдельно. |

В Rust `ColorPickerEvent::Change(Hsla, SharedString)` и `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` несут
цвет и его текст `formatted`.

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется через |
|---|---|---|
| `ColorArea` | выбор цвета | `class`, `style` |
| Панель области | область, заполняет её | `panelClass`, `panelStyle` |
| Бегунок области | область, по центру на цвете | `thumbClass`, `thumbStyle` |
| `ColorSlider` | выбор цвета | `class`, `style` |
| Трек слайдера | слайдер | `trackClass`, `trackStyle` |
| Бегунок слайдера | слайдер, по центру на значении на треке | `thumbClass`, `thumbStyle` |
| `ColorField` | выбор цвета | `class`, `style` |
| `ColorSwatch` | выбор цвета или отдельно | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | выбор цвета или отдельно | `class`, `style` |

Бегунок слайдера центрируется на концах трека при крайних значениях канала. Внутренний отступ слайдера, равный половине
ширины бегунка (`h-6 justify-center px-2.5` вокруг трека `h-3`), удерживает бегунок целиком внутри слайдера, где он принимает
нажатия на обоих концах. Состояния, которые показывают части: `active:` бегунка при перетаскивании и `focus:` при фокусе
клавиатуры, `selected:` образца и `disabled:` каждой части.

<a id="keyboard"></a>

## Клавиатура

На macOS и в вебе каждый бегунок — остановка фокуса клавиатуры (Tab):

| Клавиша | На слайдере | На области |
|---|---|---|
| Вправо, Вверх | Один шаг вверх | Вправо: больше насыщенности; Вверх: больше яркости |
| Влево, Вниз | Один шаг вниз | Влево: меньше насыщенности; Вниз: меньше яркости |
| Shift со стрелкой | Десять шагов | Десять шагов |
| Page Up, Page Down | Десять шагов | Десять шагов яркости |
| Home, End | Концы канала | |

В раскладке справа налево горизонтальный слайдер и область идут справа: наименьшее значение (наименьшая
насыщенность) находится на правом конце, Влево — это шаг вверх, а Вправо — шаг вниз, а нажатие или перетаскивание выбирает значение под
указателем так, как оно нарисовано. Вертикальный слайдер сохраняет Вправо и Вверх как шаг вверх; Вверх и Вниз на области сохраняют яркость.

Образец принимает Space и Return. Каждая клавиша сообщает `onChange`, а затем `onChangeEnd`; стрелки повторяются при удержании.

<a id="accessibility"></a>

## Доступность

- Бегунки области и каждого слайдера — регулируемые элементы (`"adjustable"`, слайдер в браузере) со своей
  меткой, значением и диапазоном; увеличение и уменьшение в средствах чтения с экрана двигают их по шагам.
- Каждое поле — текстовое поле со своей меткой; каждый образец — кнопка, выбранная, пока это цвет выбора, с именем по
  цвету в hex, если имя не задаёт `accessibilityLabel`. Пипетка — кнопка с меткой приложения.
- В отключённом состоянии средства чтения с экрана сообщают, что части затемнены, и они не принимают действий.

Подробнее о метках, ролях и действиях в целом см. в разделе [Доступность](../docs/accessibility.md).

<a id="platform-notes"></a>

## Примечания по платформам

- Каждая платформа рисует то, что стилизует приложение; цвета треков и панели — это градиенты, рисуемые платформой.
  Нажатия и перетаскивания отслеживаются в ядре для мыши, пера или пальца, а прокручиваемое представление вокруг выбора цвета
  сохраняет прокрутку для перетаскиваний, начатых в другом месте.
- `ColorEyeDropper` выбирает цвет с помощью color sampler из AppKit на macOS и `EyeDropper` браузера в вебе; цвет
  приходит в sRGB.
