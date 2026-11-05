---
title: "Text"
description: "Элемент, который отображает текст: вложенные спаны, ссылки, ограничение числа строк, масштабирование шрифта, встроенные представления и события компоновки текста."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---

# Text

`Text` рисует абзац. Это элемент, который показывает строки: строка-потомок `View` ничего не рисует. Абзац верстается нативно (CoreText на iOS и Mac Catalyst, `StaticLayout` на Android) и измеряется в потоке движка, поэтому основной поток его только рисует. В Rust его создаёт `text(content)`, в TSX — `<Text>` из `nsh`.

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` принимает строку, `SharedString`, сигнал или замыкание (`text(move || format!("{} items", count.get()))`): замыкание или сигнал обновляет текст на месте, когда меняется то, что они читают.

<a id="spans"></a>

## Спаны

Text внутри text — это спан того же абзаца, а не отдельное представление. Спаны наследуют стили текста абзаца (`color`, `fontSize`, `fontWeight`, …) и переопределяют те, которые задают сами. Весь блок — одно нативное представление. В Rust `text(..)` показывает свой контент, а затем потомков: `.child(text(..))` добавляет спан, `.child("…")` — обычный фрагмент текста.

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

<a id="span-backgrounds"></a>

### Фоны спанов

Спан с фоном заливает область своих символов позади них: высотой со свой шрифт (подъём над базовой линией и спуск под ней, независимо от высоты строки) и на каждой строке, на которую он переносится, часть спана на этой строке образует отдельную область со скруглением спана. Вложенные в него спаны используют его фон, если не задают собственный. Это только отрисовка: текст раскладывается так же, как без фона, а выделяемый текст копирует символы спана вместе с остальными. Строчный код — это спан:

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Классы Tailwind работают так же: `<Text class="bg-gray-100 rounded">`. Отступы и рамки — стили блока и спаны не затрагивают; пробелы внутри спана оставляют области место по бокам.

<a id="links"></a>

### Ссылки

Спан с обработчиком нажатия — это ссылка: нажатие на его символы попадает в спан, нажатие в другом месте — в абзац.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

<a id="inline-views-and-images"></a>

### Встроенные представления и изображения

Любой другой элемент внутри text (представление, изображение, в том числе внутри спанов) — это встроенное вложение: оно раскладывается в своём размере, располагается на базовой линии (или там, куда его ставит стиль `verticalAlign`: `"text-top"`, `"text-bottom"`, `"middle"`, как в CSS; строка увеличивается, чтобы его вместить) и переносится вместе со словами. Оно принимает собственные нажатия.

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Вложения, обрезанные `numberOfLines` или многоточием, скрываются. При копировании выделяемого текста они не попадают в результат.

<a id="whitespace"></a>

### Пробелы

Текст в JSX следует правилам React: строки обрезаются, кроме краёв текста, строки только из пробелов отбрасываются, а оставшиеся строки соединяются одним пробелом. Пробелы внутри одной строки сохраняются (`{a} {b}` сохраняет свой пробел). Пишите `{" "}` или строковое выражение, когда спану нужен пробел в начале или в конце. Строки Rust рисуются как написаны.

<a id="props"></a>

## Свойства

Помимо [общих свойств](./index.md#common-props) (с `style` типа `TextStyle`):

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `numberOfLines` (стиль) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | Максимальное число показываемых строк; `0` показывает все. |
| `textOverflow` (стиль) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | Как обрезается текст, не помещающийся в `numberOfLines`: многоточие в конце, в начале или в середине либо простая обрезка. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | Следовать системной настройке размера текста. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | Верхняя граница системного масштаба; `0` означает отсутствие границы. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | Уменьшать шрифт, пока текст не поместится в свои строки (`numberOfLines`) и в свой блок. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | Насколько максимально `adjustsFontSizeToFit` уменьшает шрифт (0..1; не менее 0.1). |
| `userSelect` (стиль) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: пользователь может выделять фрагменты текста: долгое нажатие выделяет слово, маркеры расширяют выделение, меню правки копирует его. `"auto"` берёт настройку окружающих представлений; если она нигде не задана, текст не выделяется, кроме настольных браузеров, где он выделяется, если не находится внутри интерактивного элемента; `"none"` запрещает выделение и там. |
| `selectionColor` (стиль) | `.selection_color(..)` | `ColorValue` | акцентный цвет платформы | Подсветка и маркеры выделения. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | Разложенные строки после каждой раскладки. |

Классы Tailwind `select-text`, `select-none` и `select-auto` задают `userSelect`, `line-clamp-*` задаёт `numberOfLines`, `text-ellipsis` и `text-clip` задают `textOverflow`, а `truncate` — это одна строка, обрезанная многоточием. Подсветка и маркеры выделения берут ключ стиля `selectionColor` (`selection:text-*`), по умолчанию — акцентный цвет платформы.

<a id="text-styles"></a>

## Стили текста

`TextStyle` дополняет стили представления: `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` или 100–900), `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (аналог `text-shadow` в CSS), `fontVariant`, `writingDirection`, `numberOfLines` и `textOverflow`. В Rust это методы `Styled`: `.text_color(..)`, `.text_size(..)` (или `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`, `.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`, `.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` и остальные. См. [справочник по стилям](../modules/style-reference.md#textstyle) и [text](../docs/text.md).

Семейство шрифтов — это системное семейство или файл шрифта приложения:

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

Шрифт регистрируется до первого кадра. См. [шрифты](../docs/fonts.md).

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | После каждой раскладки абзаца. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (в Rust отсутствуют) | Как у [view](./view.md#events); у спана — нажатия на его символы. |
| `onLayout` | `.on_layout` | `{ bounds }` | Кадр блока изменился. |

`TextLayoutLine` — это `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }` в области контента текста:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust измеряет строку до раскладки с помощью `measure_text(..)`.

<a id="ref-methods"></a>

## Методы ref

Собственных нет.

<a id="platform-notes"></a>

## Примечания по платформам

- Выделение остаётся внутри одного текстового блока (один text и его спаны). На iOS показывается меню правки (Copy, Select All, Look Up, Translate, Share), на Android — плавающая панель (Copy, Select all, Share).
- Оформление текста, отличное от сплошной одинарной линии (`double`, `dotted`, `dashed`, `wavy`), на iOS рисуется силами NSH.
- Тексты на iOS рисуют сплошные фоны и внешние тени.
- `fontScale()` из [`nsh`](../modules/nsh.md#device) (`font_scale()` в Rust) сообщает текущий системный масштаб текста.
