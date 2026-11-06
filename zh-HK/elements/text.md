---
title: "Text"
description: "用於繪製文字的元素:巢狀 span、連結、行數限制、字體縮放、內嵌檢視及文字排版事件。"
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---


# Text

`Text` 負責繪製段落,是顯示字串的元素:`View` 的字串子節點不會繪製任何內容。段落由原生排版(iOS 和 Mac Catalyst 使用 CoreText,Android 使用 `StaticLayout`),並在 engine thread 上量度,因此 main thread 只負責繪製。Rust 以 `text(content)` 建立,TSX 則使用 `nsh` 的 `<Text>`。

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

`text(..)` 接受字串、`SharedString`、signal 或 closure(`text(move || format!("{} items", count.get()))`):closure 或 signal 會在其讀取的內容改變時就地更新文字。

<a id="spans"></a>

## Span

Text 內的 text 是同一段落的 span,而不是獨立的 view。Span 會繼承段落的文字樣式(`color`、`fontSize`、`fontWeight` 等),並覆寫自身所設定的樣式。整個區塊是一個原生 view。在 Rust 中,`text(..)` 先顯示其內容,再顯示其子節點:`.child(text(..))` 新增一個 span,`.child("…")` 新增一段純文字。

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

### Span 背景

設有背景的 span 會在字元後方填滿字元所佔的框:高度等同其字體高度(基線以上的 ascent 加基線以下的 descent,不受行高影響),並在換行時逐行各自形成一個框,每行的部分都套用該 span 的圓角半徑。Span 內的子 span 會共用其背景,除非自行設定背景。這純粹是繪製效果:文字的排版與沒有背景時相同,而可選取的文字在複製時會連同該 span 的字元一併複製。行內程式碼就是一個 span:

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

Tailwind class 的運作方式相同:`<Text class="bg-gray-100 rounded">`。Padding 和邊框屬於 box 樣式,不會套用於 span;在 span 內加入空格,可讓框的兩側留出空間。

<a id="links"></a>

### 連結

設有 press handler 的 span 就是連結:按下其字元時由該 span 處理,按下其他位置則由段落處理。

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

### 行內 view 和圖片

Text 內的任何其他元素(view、圖片,甚至位於 span 內的元素)都是行內附件:它按自身大小排版,位於基線上(或按其 `verticalAlign` 樣式所指定的位置:`"text-top"`、`"text-bottom"`、`"middle"`,與 CSS 相同;行高會增加以容納它),並隨文字一同換行。它可以自行接收按下事件。

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

被 `numberOfLines` 或省略號截去的附件會被隱藏。複製可選取的文字時,不會包含附件。

<a id="whitespace"></a>

### 空白字元

JSX 文字遵循 React 的規則:除文字首尾外,各行會被去除首尾空白,僅含空白的行會被丟棄,其餘各行以一個空格連接。同一行內的空格會保留(`{a} {b}` 會保留其空格)。當 span 需要前導或尾隨空格時,請寫 `{" "}` 或使用字串表達式。Rust 字串會按原樣繪製。

## Props

除了[通用 props](./index.md#common-props)之外(其中 `style` 的型別為 `TextStyle`):

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `numberOfLines`(style) | `.number_of_lines(n)`、`.truncate()` | `number` | `0` | 顯示的最大行數;`0` 表示全部顯示。 |
| `textOverflow`(style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | 文字超出 `numberOfLines` 時的截斷方式:在結尾、開頭或中間顯示省略號,或直接裁切。 |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | 跟隨系統的文字大小設定。 |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | 系統縮放比例的上限;`0` 表示沒有上限。 |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | 縮小字體,直至文字符合其行數(`numberOfLines`)及其框。 |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | `adjustsFontSizeToFit` 最多可縮小的幅度(0..1;最小為 0.1)。 |
| `userSelect`(style) | `.select_text()`、`.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`:使用者可選取文字範圍:長按可選取一個詞,拖曳控點可擴大選取範圍,透過編輯選單可拷貝所選內容。`"auto"` 沿用文字外層 view 的設定;若均未設定,文字不可選取,但桌面瀏覽器除外,在桌面瀏覽器中,除非文字位於互動元素內,否則文字可選取;`"none"` 在桌面瀏覽器中同樣令文字不可選取。 |
| `selectionColor`(style) | `.selection_color(..)` | `ColorValue` | 平台的強調色 | 選取範圍的高亮顏色和控點顏色。 |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | 每次排版後已排好的各行。 |

Tailwind class `select-text`、`select-none` 和 `select-auto` 設定 `userSelect`,`line-clamp-*` 設定 `numberOfLines`,`text-ellipsis` 和 `text-clip` 設定 `textOverflow`,而 `truncate` 表示單行並以省略號截斷。選取範圍的高亮和控點取用樣式鍵 `selectionColor`(`selection:text-*`),預設為平台的強調色。

<a id="text-styles"></a>

## 文字樣式

`TextStyle` 在 view 樣式之外新增:`color`、`fontSize`、`fontWeight`(`"normal"`、`"bold"` 或 100–900)、`fontStyle`、`fontFamily`、`lineHeight`、`letterSpacing`、`textAlign`、`textAlignVertical`、`textTransform`、`textDecorationLine`、`textDecorationColor`、`textDecorationStyle`、`textDecorationThickness`、`textUnderlineOffset`、`textShadow`(即 CSS 的 `text-shadow`)、`fontVariant`、`writingDirection`、`numberOfLines` 和 `textOverflow`。在 Rust 中,它們是 `Styled` 的方法:`.text_color(..)`、`.text_size(..)`(或 `.text_sm()`、`.text_lg()` 等)、`.font_weight(FontWeight::SEMIBOLD)`、`.italic()`、`.font_family(..)`、`.line_height(..)`、`.letter_spacing(..)`、`.text_center()`、`.uppercase()`、`.underline()`、`.line_through()`、`.tabular_nums()`、`.number_of_lines(..)` 及其餘方法。請參閱[樣式參考](../modules/style-reference.md#textstyle)和 [text](../docs/text.md)。

字體系列可以是系統字體系列,或應用程式的字體檔案:

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

字體會在第一個 frame 之前註冊。請參閱[字體](../docs/fonts.md)。

<a id="events"></a>

## 事件

| 事件 | Rust | Payload | 觸發時機 |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | 段落每次排版之後。 |
| `onPress`、`onLongPress` 等 | `.on_press`、`.on_long_press` 等 | `PressEvent`(Rust 中沒有) | 與 [view](./view.md#events) 相同;在 span 上,則為按下其字元時觸發。 |
| `onLayout` | `.on_layout` | `{ bounds }` | 區塊的 frame 已改變。 |

`TextLayoutLine` 是 `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`,位於文字的內容框內:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust 在排版前會以 `measure_text(..)` 量度字串。

<a id="ref-methods"></a>

## Ref 方法

沒有專屬方法。

<a id="platform-notes"></a>

## 平台備註

- 選取範圍只限於同一個文字區塊內(一個 text 及其 span)。iOS 會顯示其編輯選單(拷貝、全選、查詢、翻譯、分享),Android 則顯示浮動工具列(拷貝、全選、分享)。
- 除實線單線以外的文字裝飾(`double`、`dotted`、`dashed`、`wavy`),在 iOS 上由 NSH 繪製。
- iOS 上的文字會繪製純色背景和外陰影。
- [`nsh`](../modules/nsh.md#device) 的 `fontScale()`(Rust 中為 `font_scale()`)會回報目前的系統文字縮放比例。
