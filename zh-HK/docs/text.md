---
title: "文字"
description: "在 Rust 和 TSX 中使用 text 元素顯示文字：巢狀 span 與連結、內嵌視圖、字型與裝飾、截斷、系統文字大小、文字選取及 onTextLayout。"
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---


# 文字

所有文字都由 text 元素顯示:Rust 中用 `text(..)`,TSX 中用 `<Text>`。一個 text 元素就是一個段落,在佈局時由平台的文字引擎(Apple 平台為 CoreText,Android 為 `StaticLayout`)在引擎線程上排版,只在主線程上繪製。巢狀的 text 元素是同一段落的 span,並非獨立的視圖。

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
> 字串由 text 元素顯示。在 TSX 中,直接放在 `<View>` 內的字串不會顯示:請用 `<Text>` 包起來。

元素本身的說明見 [text](../elements/text.md);本頁介紹其用法。

<a id="strings-and-whitespace"></a>

## 字串與空白

在 Rust 中,text 的內容是字串,按原樣顯示:`\n` 會換行。讀取 signal 的內容則是閉包(closure),signal 變化時文字會更新。在 TSX 中,JSX 文字遵循與 React 相同的規則:每行會去除首尾空白,只含空白的行會被丟棄,其餘各行以單一空格連接。同一行內的空白會保留,因此 `{first} {last}` 會保留其空格。行首或行尾的空格請用 `{" "}`,換行請用 `{"\n"}`:

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

text 中的表達式會跟隨其所讀取的內容:`count` 變化時,`text(move || format!("{} items", count.get()))` 和 `<Text>{count()} items</Text>` 會更新。

<a id="spans-and-inheritance"></a>

## Span 與繼承

放在 text 內的 text 就是 span。它會繼承父元素的文字樣式,並覆寫自己設定的部分:

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

文字樣式也會像 CSS 一樣從 view 向下傳遞:Rust 中的 `view().text_color(white()).text_sm()` 與 TSX 中的 `<View class="text-white text-sm">` 會為其內的 text 和 input 元素設定樣式。

<a id="links"></a>

### 連結

設有按壓處理器(`.on_press(..)` 或 `.on_long_press(..)`;`onPress` 或 `onLongPress`)的 span 就是連結:按在其字元上的按壓會交給該 span,按在其他位置則交給段落。巢狀 span 中的連結同樣有效。

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

### Span 的背景

span 的背景色和圓角半徑會在其所跨越的每一行字元後面繪製一個方框,高度與其字體相同;文字的排版不變,複製時也保持完整,因此行內程式碼可以用 span 實現([text 元素](../elements/text.md#span-backgrounds)):

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

### text 內的 view 與圖片

text 內除 text 以外的任何元素都會以行內方式排版,位於基線上,並隨文字一同換行。它可以自行接收按壓:

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

被 `numberOfLines` 或省略號截斷的行內元素會被隱藏;複製文字時也不會包含它們。行內元素內的文字會採用周圍文字的顏色,就像 CSS 的 `color` 會作用於 inline block 一樣,除非它自行設定顏色(上面的 `LIVE` 徽章就是如此);其字體和行高則保持自身設定。

樣式鍵 `verticalAlign` 決定行內元素在行中的位置,就像 CSS 的 `vertical-align` 決定圖片的位置一樣:`"baseline"`(預設)將其底部放在基線上,`"text-top"` 和 `"text-bottom"` 分別將其頂部或底部對齊文字字體的頂部或底部,`"middle"` 則將其置中於基線上方字體 x 高度一半的位置。只要元素超出字體範圍,行高就會增大以容納它,即使設定了固定的 `lineHeight` 也一樣。若段落開頭的圖示需要與文字底部對齊(如 Android 的 `ImageSpan` 的繪製方式),請使用 `"text-bottom"`。對應的 class 為 `align-baseline`、`align-text-top`、`align-text-bottom` 和 `align-middle`;在 Rust 中則是 `.align_text_bottom()` 及其他同名項目。

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## 文字樣式

| 屬性 | 值 | Rust |
|---|---|---|
| `color` | [顏色](./styling.md#colors)。預設為黑色 | `.text_color(..)` |
| `fontSize` | 點數。預設為 14 | `.text_size(px(..))`、`.text_sm()`、`.text_lg()`、... |
| `fontWeight` | `"normal"`(400)、`"bold"`(700),或 `100`–`900`(數字或字串) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`、`"italic"`:彩色 emoji 保持直立 | `.italic()` |
| `fontFamily` | 系統字體族、通用字體族,或[匯入的字體](./fonts.md) | `.font_family(..)` |
| `lineHeight` | 點數 | `.line_height(px(..))` |
| `letterSpacing` | 點數 | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`、`"left"`、`"center"`、`"right"`、`"justify"`、`"start"`、`"end"`:`left` 和 `right` 固定為左右兩側,`start` 和 `end` 則跟隨文字方向 | `.text_left()`、`.text_center()`、`.text_right()`、`.text_justify()` |
| `textAlignVertical` | `"auto"`、`"top"`、`"center"`、`"bottom"`:文字比其方框短時所處的位置 | |
| `textTransform` | `"none"`、`"uppercase"`、`"lowercase"`、`"capitalize"` | `.normal_case()`、`.uppercase()`、`.lowercase()`、`.capitalize()` |
| `textDecorationLine` | `"none"`、`"underline"`、`"line-through"`、`"underline line-through"` | `.no_underline()`、`.underline()`、`.line_through()` |
| `textDecorationColor`、`textDecorationStyle` | 顏色;`"solid"`、`"double"`、`"dotted"`、`"dashed"`、`"wavy"` | `.text_decoration_color(..)`、`.text_decoration_wavy()`、... |
| `textDecorationThickness`、`textUnderlineOffset` | 點數,或 `"auto"`(粗細也可用 `"from-font"`) | `.text_decoration_thickness(px(..))`、`.underline_offset(px(..))` |
| `textShadow` | CSS 的 `text-shadow`,即字形後方的陰影:`"2px 2px 4px rgb(0 0 0 / 0.6)"`(偏移、模糊、顏色),或以數字表示其各層,`[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`;多個層會按最寬的一層繪製 | `.text_shadow([TextShadow { .. }])`、`.text_shadow_sm()`、...、`.text_shadow_color(..)` |
| `fontVariant` | OpenType 功能:`["tabular-nums"]`、`"small-caps"`、`"oldstyle-nums"`、`"lining-nums"`、`"proportional-nums"` | `.tabular_nums()`、`.small_caps()`、`.oldstyle_nums()`、`.lining_nums()`、`.proportional_nums()` |
| `writingDirection` | `"auto"`、`"ltr"`、`"rtl"`:段落的基準方向 | `.writing_direction(WritingDirection::Rtl)` |

text 元素同時也是 view:它支援背景、邊框、圓角、內距(padding)及其他 [view 樣式](./styling.md)。

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

`tabular-nums` 令每個數字寬度相同,避免計數器和價格在變化時抖動。

<a id="truncation"></a>

## 截斷

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| 樣式鍵/屬性 | Rust | 說明 |
|---|---|---|
| `numberOfLines`(樣式) | `.number_of_lines(n)` | 最多顯示的行數;`0`(預設)顯示全部 |
| `textOverflow`(樣式) | `.text_overflow(EllipsizeMode::Middle)` | 放不下的文字如何截斷:在末端加省略號(`"ellipsis"`,預設)、在開頭(`"ellipsis-start"`)或中間(`"ellipsis-middle"`)加省略號,或 `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | 縮小字體,直至文字符合其行數與方框 |
| `minimumFontScale` | | `adjustsFontSizeToFit` 最多可縮小的幅度(0–1) |

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

Tailwind class `line-clamp-*`、`text-ellipsis` 和 `text-clip` 設定相同的鍵,`truncate`(`.truncate()`)是以省略號截斷的單行文字;作為樣式鍵時,它們也支援狀態樣式和變體。

<a id="system-text-size"></a>

## 系統文字大小

文字預設會跟隨用戶的文字大小設定(iOS 的 Dynamic Type、Android 的字體大小)。

| 屬性 | Rust | 說明 |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` 會令大小固定。預設為 `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | 套用的最大縮放比例,例如 `1.5`。`0` 表示無上限 |

Rust 中的 `font_scale()` 與 TSX 中來自 [`nsh`](../modules/nsh.md#device) 的 `fontScale()` 是目前的縮放比例,會在用戶更改設定時變化。input 也支援 `allowFontScaling` 和 `maxFontSizeMultiplier`。

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

與其關閉縮放,不如限制縮放上限:大字體是許多人依賴的無障礙設定。

<a id="selection"></a>

## 選取

樣式鍵 `userSelect: "text"`(`.select_text()`,class 為 `select-text`)讓用戶可以選取並複製文字,與系統自身的文字視圖一樣:長按會選取手指下的單詞,拖曳控點可移動選取範圍的兩端,編輯選單提供「拷貝」和「全選」(iOS 另加「查詢」、「翻譯」和「分享」;Android 另加「分享」)。選取範圍只限於同一個文字區塊內。樣式鍵 `selectionColor`(`.selection_color(..)`、`selection:text-*`)用來設定高亮和控點的顏色。在 view 上設定的 `userSelect` 會作用於其內未自行設定的 text。

在桌面瀏覽器中,文字預設可以選取,與網頁一樣,但互動元素內除外(設有按壓或觸控處理器的 view,例如按鈕和可按壓的列);`userSelect: "none"`(`.select_none()`,class 為 `select-none`)可令文字在那裡保持不可選取。手機和平板電腦的瀏覽器則遵循原生規則。

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

若要透過程式碼複製(例如「拷貝」按鈕),在 Rust 中使用 `set_clipboard(..)`,在 TSX 中使用 [`Clipboard`](../modules/nsh.md#clipboard)。

## onTextLayout

`onTextLayout`(Rust 中的 `TextLayout` 事件)會在每次佈局後回報已排版的各行,座標位於 text 的內容框內:

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

每一行都有 `text`、`x`、`y`、`width`、`height`、`ascender`、`descender`、`capHeight` 和 `xHeight`(Rust 中為 `cap_height` 和 `x_height`)。可利用它僅在文字被截斷時顯示「閱讀更多」按鈕,或讓其他內容與基線對齊。

<a id="accessibility"></a>

## 無障礙

螢幕閱讀器會將 text 元素的內容朗讀出來。請為作為標題的文字(`.role(AccessibilityRole::Header)`、`role="header"`)和連結(`AccessibilityRole::Link`、`role="link"`)指定角色。參見[無障礙](./accessibility.md)。

<a id="related"></a>

## 相關內容

- [字體](./fonts.md):自訂字體與字重。
- [text 元素](../elements/text.md):所有屬性。
- [表單與鍵盤](./forms-and-keyboard.md):文字輸入。
