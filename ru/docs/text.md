---
title: "Текст"
description: "Отображение текста с помощью элемента text в Rust и TSX: вложенные span и ссылки, встроенные представления, шрифты и декорации, усечение, системный размер текста, выделение и onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# Текст

Весь текст отображается текстовыми элементами: `text(..)` в Rust, `<Text>` в TSX. Текстовый элемент — это один абзац, который набирается текстовым движком платформы (CoreText на платформах Apple, `StaticLayout` на Android) в потоке движка при вычислении раскладки, а отрисовывается только в главном потоке. Вложенные текстовые элементы — это спаны (span) одного и того же абзаца, а не отдельные представления.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> Строки отображаются текстовыми элементами. В TSX строка, помещённая прямо в `<View>`, не отображается: оберните её в `<Text>`.

Сам элемент описан на странице [text](../elements/text.md); эта страница посвящена его использованию.

<a id="strings-and-whitespace"></a>

## Строки и пробельные символы

В Rust содержимое текста — это строка, которая отображается как написано: `\n` переносит строку. Содержимое, читающее сигналы, — это замыкание, и текст обновляется при их изменении. В TSX текст JSX подчиняется тем же правилам, что и в React: каждая строка обрезается по краям, строки, состоящие только из пробельных символов, отбрасываются, а оставшиеся строки соединяются одним пробелом. Пробелы внутри одной строки сохраняются, поэтому `{first} {last}` сохраняет свой пробел. Используйте `{" "}` для пробела в начале или конце строки и `{"\n"}` для переноса строки:

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

Выражения в тексте следуют за тем, что они читают: `text(move || format!("{} items", count.get()))` и `<Text>{count()} items</Text>` обновляются при изменении `count`.

<a id="spans-and-inheritance"></a>

## Спаны и наследование

Текст внутри текста — это спан. Он наследует текстовый стиль родителя и переопределяет то, что задаёт сам:

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

Текстовые стили также передаются вниз от представлений, как в CSS: `view().text_color(white()).text_sm()` в Rust и `<View class="text-white text-sm">` в TSX задают стиль текстовых элементов и элементов ввода внутри них.

<a id="links"></a>

### Ссылки

Спан с обработчиком нажатия (`.on_press(..)` или `.on_long_press(..)`; `onPress` или `onLongPress`) является ссылкой: нажатие на его символы попадает в спан, нажатие в другом месте — в абзац. Ссылки во вложенных спанах тоже работают.

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Фон спанов

Цвет фона и радиус скругления спана рисуют прямоугольник позади его символов на каждой строке, которой он касается, высотой с его шрифт; раскладка текста не меняется, а копируется он целиком, поэтому строчный код — это спан
([Text element](../elements/text.md#span-backgrounds)):

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### Представления и изображения внутри текста

Любой элемент, кроме текста, внутри текста размещается строчно, на базовой линии, и переносится вместе со словами. Он может принимать собственные нажатия:

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Строчные элементы, обрезанные `numberOfLines` или многоточием, скрываются; при копировании текста они не включаются. Текст внутри строчного элемента берёт цвет окружающего текста, подобно тому как CSS-свойство `color` действует на inline-block, если только он не задаёт свой собственный
(как это делает значок `LIVE` выше); его шрифт и высота строки остаются собственными.

Ключ стиля `verticalAlign` размещает строчный элемент в его строке, подобно тому как `vertical-align` размещает изображение:
`"baseline"` (по умолчанию) ставит его низ на базовую линию, `"text-top"` и `"text-bottom"` помещают его верх или низ
на верх или низ шрифта текста, а `"middle"` центрирует его на половину x-высоты шрифта выше базовой линии.
Строка увеличивается, чтобы вместить элемент везде, где он выходит за пределы шрифта, в том числе при фиксированном `lineHeight`. Значок в начале абзаца, который должен
выравниваться по низу текста, как его рисует `ImageSpan` на Android, принимает `"text-bottom"`. Классы:
`align-baseline`, `align-text-top`, `align-text-bottom` и `align-middle`; в Rust — `.align_text_bottom()` и
остальные с такими же именами.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## Текстовые стили

| Свойство | Значения | Rust |
|---|---|---|
| `color` | [Цвет](./styling.md#colors). По умолчанию чёрный | `.text_color(..)` |
| `fontSize` | Пункты. По умолчанию 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700) или `100`–`900` (число или строка) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: цветные эмодзи остаются прямыми | `.italic()` |
| `fontFamily` | Системное семейство, обобщённое семейство или [импортированный шрифт](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Пункты | `.line_height(px(..))` |
| `letterSpacing` | Пункты | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` и `right` сохраняют свои стороны справа налево, `start` и `end` следуют направлению | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: где располагается текст, который короче своего блока | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | Цвет; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Пункты или `"auto"` (толщина также `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | CSS-свойство `text-shadow`, тень позади глифов: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (смещения, размытие, цвет) или её слои в виде чисел, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`; несколько слоёв рисуются как самый широкий | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | Возможности OpenType: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: базовое направление абзаца | `.writing_direction(WritingDirection::Rtl)` |

Текстовый элемент также является представлением: он принимает фоны, рамки, скругления, отступы и другие [стили представлений](./styling.md).

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` даёт всем цифрам одинаковую ширину, благодаря чему счётчики и цены не «дрожат» при изменении.

<a id="truncation"></a>

## Усечение

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Ключ стиля / свойство | Rust | Описание |
|---|---|---|
| `numberOfLines` (стиль) | `.number_of_lines(n)` | Наибольшее число показываемых строк; `0` (по умолчанию) показывает все |
| `textOverflow` (стиль) | `.text_overflow(EllipsizeMode::Middle)` | Как обрезается текст, который не помещается: многоточие в конце (`"ellipsis"`, по умолчанию), в начале (`"ellipsis-start"`) или в середине (`"ellipsis-middle"`), либо `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | Уменьшать шрифт, пока текст не поместится в свои строки и блок |
| `minimumFontScale` | | Насколько может уменьшаться `adjustsFontSizeToFit` (0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Классы Tailwind `line-clamp-*`, `text-ellipsis` и `text-clip` задают те же ключи, а `truncate` (`.truncate()`) — это одна строка, обрезанная многоточием; как ключи стиля они также принимают стили состояний и варианты.

<a id="system-text-size"></a>

## Системный размер текста

По умолчанию текст следует настройке размера текста пользователя (Dynamic Type на iOS, размер шрифта на Android).

| Свойство | Rust | Описание |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` фиксирует размер. По умолчанию `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | Наибольший применяемый масштаб, например `1.5`. `0` означает отсутствие ограничения |

`font_scale()` в Rust и `fontScale()` из [`nsh`](../modules/nsh.md#device) в TSX — это текущий масштаб; он меняется, когда пользователь меняет настройку. Поля ввода тоже принимают `allowFontScaling` и `maxFontSizeMultiplier`.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

Лучше ограничивать масштаб, чем отключать его: крупный текст — это настройка доступности, на которую полагаются люди.

<a id="selection"></a>

## Выделение

Ключ стиля `userSelect: "text"` (`.select_text()`, класс `select-text`) позволяет пользователю выделять и копировать текст, как в системных текстовых представлениях: долгое нажатие выделяет слово под пальцем, маркеры перемещают концы выделения, а меню правки предлагает «Копировать» и «Выбрать все» (на iOS добавляются «Найти», «Перевести» и «Поделиться»; на Android — «Поделиться»). Выделение остаётся внутри одного текстового блока. Ключ стиля `selectionColor` (`.selection_color(..)`, `selection:text-*`) задаёт цвет подсветки и маркеров. `userSelect`, заданный у представления, действует на тексты внутри него, которые не задают своего значения.

В десктопных браузерах текст по умолчанию выделяется, как на веб-странице, за исключением интерактивных элементов (представлений с обработчиками нажатия или касания, таких как кнопки и нажимаемые строки); `userSelect: "none"` (`.select_none()`, класс `select-none`) оставляет текст невыделяемым и там. Браузеры на телефонах и планшетах следуют нативному правилу.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

Чтобы копировать из кода (кнопка «Копировать»), используйте `set_clipboard(..)` в Rust или [`Clipboard`](../modules/nsh.md#clipboard) в TSX.

## onTextLayout

`onTextLayout` (событие `TextLayout` в Rust) сообщает о размещённых строках после каждой раскладки в контентном блоке текста:

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

Каждая строка содержит `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` и `xHeight` (`cap_height` и `x_height` в Rust). Используйте это, чтобы показывать кнопку «Читать далее» только когда текст был обрезан, или чтобы выровнять другое содержимое по базовой линии.

<a id="accessibility"></a>

## Доступность

Текстовый элемент читается экранными дикторами как его содержимое. Задавайте роль тексту, который выступает заголовком (`.role(AccessibilityRole::Header)`, `role="header"`), и ссылкам (`AccessibilityRole::Link`, `role="link"`). См. [Accessibility](./accessibility.md).

<a id="related"></a>

## См. также

- [Fonts](./fonts.md): пользовательские шрифты и начертания.
- [text element](../elements/text.md): все свойства.
- [Forms and keyboard](./forms-and-keyboard.md): ввод текста.
