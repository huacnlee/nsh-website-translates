---
title: "文字"
description: "使用 Rust 與 TSX 中的 text 元素顯示文字：巢狀 span 與連結、行內檢視、字型與裝飾、截斷、系統文字大小、選取，以及 onTextLayout。"
order: 35
group: ui
---

# 文字

所有文字都由 text 元素顯示:Rust 中使用 `text(..)`,TSX 中使用 `<Text>`。一個 text 元素就是一個段落,在佈局時由平台的文字引擎(Apple 平台為 CoreText,Android 為 `StaticLayout`)於引擎執行緒上排版,並且只在主執行緒上繪製。巢狀的 text 元素是同一段落中的 span,而不是獨立的 view。

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

元素本身記載於 [text](../elements/text.md);本頁說明如何使用它。

<a id="strings-and-whitespace"></a>

## 字串與空白

在 Rust 中,text 的內容是字串,並按原樣顯示:`\n` 會換行。讀取 signal 的內容則是閉包(closure),當 signal 改變時文字會隨之更新。在 TSX 中,JSX 文字遵循與 React 相同的規則:每一行都會去除前後空白,僅含空白的行會被捨棄,其餘各行以單一空格連接。單行內的空白會保留,因此 `{first} {last}` 會保留其空格。若要在行首或行尾加入空格,請使用 `{" "}`;若要換行,請使用 `{"\n"}`:

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

文字中的運算式會跟隨其所讀取的值:當 `count` 改變時,`text(move || format!("{} items", count.get()))` 與 `<Text>{count()} items</Text>` 會更新。

<a id="spans-and-inheritance"></a>

## Span 與繼承

text 內的 text 就是 span。它會繼承父層的文字樣式,並覆寫自己設定的部分:

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

文字樣式也會像 CSS 一樣由 view 向下傳遞:Rust 中的 `view().text_color(white()).text_sm()` 與 TSX 中的 `<View class="text-white text-sm">` 會為其內部的 text 與 input 元素設定樣式。

<a id="links"></a>

### 連結

帶有按壓處理函式的 span(`.on_press(..)` 或 `.on_long_press(..)`;`onPress` 或 `onLongPress`)就是連結:按壓其文字字元時由該 span 接收,按壓其他位置則由段落接收。巢狀 span 中的連結同樣有效。

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

span 的背景顏色與圓角半徑會在其涵蓋的每一行字元後方繪製一個方框,高度與其字型相同;文字的排版方式不變,複製時也會完整複製,因此行內程式碼就是一個 span([文字元素](../elements/text.md#span-backgrounds)):

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

### 文字內的 view 與圖片

text 內除了 text 以外的任何元素都會以行內方式佈局,位於基線上,並隨文字一起換行。它也可以自行接收按壓:

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

被 `numberOfLines` 或省略號截掉的行內元素會被隱藏;複製文字時也不會包含它們。行內元素內的文字會採用周圍文字的顏色,就像 CSS 的 `color` 會作用到 inline block 一樣,除非它自行設定了顏色(上方的 `LIVE` 徽章即是如此);其字型與行高仍維持自己的設定。

樣式鍵 `verticalAlign` 用來決定行內元素在行中的位置,就像 CSS 的 `vertical-align` 決定圖片的位置一樣:`"baseline"`(預設)讓元素底部站在基線上,`"text-top"` 與 `"text-bottom"` 讓元素的頂部或底部對齊文字字型的頂端或底端,`"middle"` 則讓元素置中於基線上方半個字型 x 高度處。無論元素超出字型多少,該行都會增高以容納它,即使設定了固定的 `lineHeight` 也一樣。若要讓段落開頭的圖示對齊文字底部(如同 Android 的 `ImageSpan` 繪製方式),請使用 `"text-bottom"`。對應的 class 為 `align-baseline`、`align-text-top`、`align-text-bottom` 與 `align-middle`;在 Rust 中則是 `.align_text_bottom()` 及其他同名的項目。

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
| `fontSize` | 點(pt)。預設為 14 | `.text_size(px(..))`、`.text_sm()`、`.text_lg()` 等 |
| `fontWeight` | `"normal"`(400)、`"bold"`(700),或 `100`–`900`(數字或字串) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`、`"italic"`:彩色 emoji 保持直立 | `.italic()` |
| `fontFamily` | 系統字型家族、通用字型家族,或[匯入的字型](./fonts.md) | `.font_family(..)` |
| `lineHeight` | 點(pt) | `.line_height(px(..))` |
| `letterSpacing` | 點(pt) | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`、`"left"`、`"center"`、`"right"`、`"justify"`、`"start"`、`"end"`:`left` 與 `right` 固定左右兩側,`start` 與 `end` 則跟隨文字方向 | `.text_left()`、`.text_center()`、`.text_right()`、`.text_justify()` |
| `textAlignVertical` | `"auto"`、`"top"`、`"center"`、`"bottom"`:文字短於其容器時所在的位置 | |
| `textTransform` | `"none"`、`"uppercase"`、`"lowercase"`、`"capitalize"` | `.normal_case()`、`.uppercase()`、`.lowercase()`、`.capitalize()` |
| `textDecorationLine` | `"none"`、`"underline"`、`"line-through"`、`"underline line-through"` | `.no_underline()`、`.underline()`、`.line_through()` |
| `textDecorationColor`、`textDecorationStyle` | 顏色;`"solid"`、`"double"`、`"dotted"`、`"dashed"`、`"wavy"` | `.text_decoration_color(..)`、`.text_decoration_wavy()` 等 |
| `textDecorationThickness`、`textUnderlineOffset` | 點(pt),或 `"auto"`(粗細亦可使用 `"from-font"`) | `.text_decoration_thickness(px(..))`、`.underline_offset(px(..))` |
| `textShadow` | CSS 的 `text-shadow`,字形後方的陰影:`"2px 2px 4px rgb(0 0 0 / 0.6)"`(偏移、模糊、顏色),或以數字表示其圖層 `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`;多個圖層會以最寬者繪製 | `.text_shadow([TextShadow { .. }])`、`.text_shadow_sm()` 等、`.text_shadow_color(..)` |
| `fontVariant` | OpenType 功能:`["tabular-nums"]`、`"small-caps"`、`"oldstyle-nums"`、`"lining-nums"`、`"proportional-nums"` | `.tabular_nums()`、`.small_caps()`、`.oldstyle_nums()`、`.lining_nums()`、`.proportional_nums()` |
| `writingDirection` | `"auto"`、`"ltr"`、`"rtl"`:段落的基準方向 | `.writing_direction(WritingDirection::Rtl)` |

text 元素同時也是 view:它可使用背景、邊框、圓角、內距,以及其他 [view 樣式](./styling.md)。

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

`tabular-nums` 讓每個數字具有相同寬度,可避免計數器與價格在數值變動時產生跳動。

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

| 樣式鍵 / prop | Rust | 說明 |
|---|---|---|
| `numberOfLines`(style) | `.number_of_lines(n)` | 最多顯示的行數;`0`(預設)會顯示全部 |
| `textOverflow`(style) | `.text_overflow(EllipsizeMode::Middle)` | 放不下的文字如何截斷:在結尾加省略號(`"ellipsis"`,預設)、在開頭加省略號(`"ellipsis-start"`)、在中間加省略號(`"ellipsis-middle"`),或 `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | 縮小字型直到文字符合其行數與容器 |
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

Tailwind 的 `line-clamp-*`、`text-ellipsis` 與 `text-clip` class 會設定相同的鍵,而 `truncate`(`.truncate()`)是以省略號截斷的單行文字;作為樣式鍵時,它們也支援狀態樣式與變體。

<a id="system-text-size"></a>

## 系統文字大小

文字預設會跟隨使用者的文字大小設定(iOS 上為 Dynamic Type,Android 上為字型大小)。

| Prop | Rust | 說明 |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` 會讓大小固定。預設為 `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | 套用的最大縮放倍率,例如 `1.5`。`0` 表示不設上限 |

Rust 中的 `font_scale()` 與 TSX 中來自 [`nsh`](../modules/nsh.md#device) 的 `fontScale()` 代表目前的縮放倍率,並會在使用者變更設定時隨之改變。input 也支援 `allowFontScaling` 與 `maxFontSizeMultiplier`。

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

建議限制縮放倍率,而不是完全關閉:大字體是許多人仰賴的無障礙設定。

<a id="selection"></a>

## 選取

樣式鍵 `userSelect: "text"`(`.select_text()`,class 為 `select-text`)讓使用者可以選取並複製文字,與系統原生的文字檢視相同:長按會選取手指下的單字,拖曳控制把手可移動選取範圍的兩端,編輯選單則提供「拷貝」與「全選」(iOS 另有「查詢」、「翻譯」與「分享」;Android 有「分享」)。選取範圍不會跨出單一文字區塊。樣式鍵 `selectionColor`(`.selection_color(..)`、`selection:text-*`)用來設定反白區域與控制把手的顏色。設定在 view 上的 `userSelect` 會作用到其內部未自行設定的 text。

在桌面瀏覽器中,文字預設可選取,與網頁相同,但互動式元素內部除外(具有按壓或觸控處理函式的 view,例如按鈕與可按壓的列);`userSelect: "none"`(`.select_none()`,class 為 `select-none`)可讓文字在這些位置保持不可選取。手機與平板瀏覽器則遵循原生規則。

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

若要從程式碼中複製(例如「複製」按鈕),請在 Rust 中使用 `set_clipboard(..)`,在 TSX 中使用 [`Clipboard`](../modules/nsh.md#clipboard)。

## onTextLayout

`onTextLayout`(Rust 中為 `TextLayout` 事件)會在每次佈局後回報已排版的各行,座標位於 text 的內容框內:

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

每一行都包含 `text`、`x`、`y`、`width`、`height`、`ascender`、`descender`、`capHeight` 與 `xHeight`(Rust 中為 `cap_height` 與 `x_height`)。可用它來僅在文字被截斷時顯示「顯示更多」按鈕,或讓其他內容與基線對齊。

<a id="accessibility"></a>

## 無障礙

螢幕閱讀器會將 text 元素的內容朗讀出來。作為標題的文字(`.role(AccessibilityRole::Header)`、`role="header"`)與連結(`AccessibilityRole::Link`、`role="link"`)請指定 role。請參閱[無障礙](./accessibility.md)。

<a id="related"></a>

## 相關內容

- [字型](./fonts.md):自訂字型與字重。
- [text 元素](../elements/text.md):所有 prop。
- [表單與鍵盤](./forms-and-keyboard.md):文字輸入。
