---
title: "ColorPicker"
description: "ColorPicker 元件及其組成部分:可在飽和度與亮度區域上選取顏色,可透過 RGB、HSL、HSB 或 OKLCH 任何色彩通道以及透明度的滑桿調整,可輸入任何 CSS 格式的顏色,可從色板中選取,或使用滴管在螢幕上取色;支援 WAI-ARIA 的按鍵操作及可調整元素,方便螢幕閱讀器使用,版面配置與樣式由應用程式自行決定。"
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---


# ColorPicker

顏色選擇器持有一個顏色，內部的各部分負責顯示和更改它：飽和度與亮度的 `ColorArea`、RGB、HSL、HSB 或 OKLCH 任何通道以及 alpha 的 `ColorSlider`、以文字接收顏色或以數字接收單一通道的 `ColorField`、預設顏色的 `ColorSwatch`，以及可在螢幕任何位置取色的 `ColorEyeDropper`。應用程式以自己的元素在各部分之間排版（每個通道一行並附上其字母、以 `Tabs` 選取的色彩空間、放在 `Popover` 內的選擇器），並為每個部分設定樣式：各部分繪製通道的顏色，而所有尺寸、圓角、邊框和陰影都由應用程式決定。

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

`ColorPicker`、`ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch` 和 `ColorEyeDropper` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`color_picker()` 及其各部分的函數以每個屬性一個 setter（`.channel(..)`、`.thumb_style(..)`）、每個事件一個監聽方法（`.on_change(..)`）以及具型別的樣式方法來建立它們；顏色是 `Hsla`，色彩空間、通道和格式是 `ColorSpace`、`ColorChannel` 和 `ColorFormat`。

<a id="value"></a>

## 值

顏色是 CSS 顏色：十六進位（`#3b82f6`、連同 alpha 的 `#3b82f680`）、`rgb()`、`hsl()`、`hsb()`、`oklch()` 或 CSS 名稱；在 Rust 中是 `Hsla`。應用程式以 `value` 擁有它，並設定 `onChange` 所報告的那個值，與 `nsh/base` 的每個控制項相同；或者以 `defaultValue` 將顏色交給選擇器，同樣能收到變更通知。

- `onChange({ value, formatted })` 報告用戶要求的每個顏色：拖曳區域或滑桿的每一步、每次按鍵、欄位中輸入時的數字、按下的色板。`value` 是顏色，`formatted` 是按 `format` 所指方式寫出的同一顏色（`"hex"`、`"rgb"`、`"hsl"`、`"hsb"` 或 `"oklch"`），可直接儲存或設為 token。
- `onChangeEnd({ value, formatted })` 只報告一次變更結束時的顏色：指標抬起時、每次按鍵後、離開或提交欄位時、按下色板時。
- 選擇器會保留用戶在每個色彩空間中設定的顏色。灰色保留其色相和飽和度，因此色相滑桿停留在用戶離開時的位置；以 OKLCH 編輯的顏色會按輸入保留其明度、色度和色相，即使超出 sRGB 能顯示的範圍（所報告的顏色是 sRGB 能顯示的最接近顏色，而 `formatted` 在 `"oklch"` 中保留各通道）。
- 應用程式設定、但選擇器沒有報告過的 `value`，會取代每個色彩空間中的顏色。

<a id="spaces-and-channels"></a>

## 色彩空間與通道

| `colorSpace` | 通道（`channel`） | 範圍 |
|---|---|---|
| `"rgb"` | `"red"`、`"green"`、`"blue"` | 0 至 255 |
| `"hsl"` | `"hue"`、`"saturation"`、`"lightness"` | 色相 0 至 360，其餘 0 至 100 |
| `"hsb"` | `"hue"`、`"saturation"`、`"brightness"` | 色相 0 至 360，其餘 0 至 100 |
| `"oklch"` | `"lightness"`、`"chroma"`、`"hue"` | 明度 0 至 100（每步 0.1），色度 0 至 0.4（每步 0.001），色相 0 至 360（每步 0.1） |
| 任何 | `"alpha"` | 0 至 100 |

滑桿的軌道會在固定其他通道的情況下繪製其通道的顏色，因此能顯示每個值會通向哪種顏色。若色彩空間沒有指定的通道，則使用該空間的第一個通道（並會發出警告）。

<a id="props"></a>

## 屬性

### ColorPicker

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 無 | 顏色（受控）。應用程式設定 `onChange` 所報告的那個值。 |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | 未設定 `value` 時的初始顏色；選擇器之後自行保管顏色。 |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | `formatted` 寫出顏色的方式。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 任何部分均不能更改顏色；`disabled:` 類別套用於選擇器及其各部分。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各部分，以及其間應用程式自己的元素。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 選擇器本身：圍繞各部分的直欄（或橫列）。 |

### ColorArea

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `panelClass`、`panelStyle` | `.panel_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 面板，填滿區域：色相的顏色，飽和度由左至右（右至左排版中則由右至左），亮度由下至上，並按其圓角裁切。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 滑鈕，置中於顏色上。 |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | 滑鈕的背景是該顏色。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受指標、鍵盤或螢幕閱讀器的更改。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為滑鈕讀出的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 區域：其尺寸由應用程式決定。 |

### ColorSlider

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | 通道所屬的色彩空間。 |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | 它更改的通道：該色彩空間的其中一個通道，或 `"alpha"`。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 軌道的方向：最小值在起點（左邊，右至左排版中為右邊）或在底部。於建立滑桿時讀取。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道：沿軌道排列該通道的顏色，並按其圓角裁切；滑鈕放置在軌道上。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 滑鈕，置中於數值上。 |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | 滑鈕的背景是該顏色（alpha 滑桿上包含其 alpha）。 |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | 無 | 軌道下方棋盤格的顏色，會透過 alpha 滑桿的顏色透出。 |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 棋盤格方格的邊長。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受指標、鍵盤或螢幕閱讀器的更改。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為滑鈕讀出的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 滑桿：圍繞軌道、接收按壓和拖曳的帶狀範圍。 |

### ColorField

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | 無 | 以數字接收的通道。沒有此屬性時，欄位以文字接收整個顏色。 |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | `channel` 的色彩空間。 |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | 欄位寫出整個顏色的方式。可讀取任何 CSS 形式。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 欄位為空時顯示。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不可輸入。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為欄位讀出的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<TextStyle>` | 無 | 欄位，即文字輸入框。 |

通道欄位會在輸入數字時更改顏色，並限制在通道的範圍內；整個顏色的欄位則在離開或提交欄位時，如果文字可讀作顏色才更改顏色。離開欄位時，會以其格式重新寫出欄位的值。

### ColorSwatch

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | 無 | 它顯示的顏色；按下會在其所屬的選擇器中選取該顏色。沒有此屬性時，使用選擇器自己的顏色：作為預覽。 |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | 無 | 成為選擇器顏色時的樣式，以 `selected:` 類別表示。 |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | 無 | 半透明顏色下方的棋盤格。 |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 方格的邊長。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按壓。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 十六進位的顏色 | 螢幕閱讀器讀出的內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 顏色上方的內容：已選取色板上的勾號（`group-selected:`）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 色板：其尺寸、形狀和邊框；其圓角會裁切顏色。 |

### ColorEyeDropper

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按壓。平台沒有取色器時亦會停用。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 其內容：應用程式的圖示或標籤。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 按鈕。 |

按下按鈕會顯示系統的取色器：macOS 上為 AppKit 的顏色取樣器，網頁上為瀏覽器的 `EyeDropper`（Chrome 和 Edge）。所取的顏色會成為選擇器的顏色（`onChange`，然後 `onChangeEnd`）；按 Escape 則不取任何顏色。平台沒有取色器時，按鈕會停用，而 `disabled:hidden` 會在該處將它隱藏。

<a id="events"></a>

## 事件

| 事件 | 所屬 | Rust | 載荷 | 時機 |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 用戶更改了顏色。 |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 更改已結束。每次更改只報告一次。 |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | 色板被按下；亦可單獨使用，作為調色盤的色塊。 |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | 用戶在螢幕上選取了顏色；亦可單獨使用。 |

在 Rust 中，`ColorPickerEvent::Change(Hsla, SharedString)` 和 `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` 帶有顏色及其 `formatted` 文字。

<a id="parts"></a>

## 組成部分

| 部分 | 所在位置 | 樣式設定方式 |
|---|---|---|
| `ColorArea` | 選擇器內 | `class`、`style` |
| 區域的面板 | 區域內，填滿區域 | `panelClass`、`panelStyle` |
| 區域的滑鈕 | 區域內，置中於顏色上 | `thumbClass`、`thumbStyle` |
| `ColorSlider` | 選擇器內 | `class`、`style` |
| 滑桿的軌道 | 滑桿內 | `trackClass`、`trackStyle` |
| 滑桿的滑鈕 | 滑桿內，置中於軌道上的數值處 | `thumbClass`、`thumbStyle` |
| `ColorField` | 選擇器內 | `class`、`style` |
| `ColorSwatch` | 選擇器內，或單獨使用 | `class`、`style`、`selectedStyle` |
| `ColorEyeDropper` | 選擇器內，或單獨使用 | `class`、`style` |

滑桿的滑鈕在通道兩端時，會置中於軌道的兩端。在滑桿上設定滑鈕寬度一半的內距（`h-6 justify-center px-2.5` 圍繞 `h-3` 軌道），可令整個滑鈕保持在滑桿之內，兩端都能接收按壓。各部分會顯示的狀態：拖曳時滑鈕的 `active:`、鍵盤焦點所在時的 `focus:`、色板的 `selected:`，以及每個部分的 `disabled:`。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和網頁上，每個滑鈕都是鍵盤焦點（Tab）的停靠點：

| 按鍵 | 在滑桿上 | 在區域上 |
|---|---|---|
| 右、上 | 增加一步 | 右：飽和度增加；上：亮度增加 |
| 左、下 | 減少一步 | 左：飽和度減少；下：亮度減少 |
| Shift 加方向鍵 | 十步 | 十步 |
| Page Up、Page Down | 十步 | 亮度十步 |
| Home、End | 通道的兩端 | |

在右至左排版中，水平滑桿和區域由右邊開始，最小值（最低飽和度）在右端：左是增加一步，右是減少一步，而按下或拖曳會按繪製所見選取指標下的值。垂直滑桿仍以右和上為增加一步；區域上的上和下則維持控制亮度。

色板接受空格鍵和 Return。每次按鍵會先報告 `onChange`，再報告 `onChangeEnd`；方向鍵按住時會重複。

<a id="accessibility"></a>

## 無障礙

- 區域和每個滑桿的滑鈕都是可調整元素（`"adjustable"`，在瀏覽器中為 slider），附有標籤、值和範圍；螢幕閱讀器的遞增和遞減操作可逐步調整它們。
- 每個欄位是附有標籤的文字欄位；每個色板是按鈕，在成為選擇器顏色時為已選取狀態，除非 `accessibilityLabel` 另行命名，否則以十六進位顏色命名。取色器是附有應用程式標籤的按鈕。
- 停用時，螢幕閱讀器會說明各部分已變暗，而且它們不接受任何操作。

有關標籤、角色和操作的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 每個平台都會繪製應用程式所設定樣式的內容；軌道和面板的顏色是由平台繪製的漸變。按壓和拖曳在核心中追蹤，適用於滑鼠、手寫筆或手指，而選擇器外圍的捲動視圖，只會將捲動保留給從其他位置開始的拖曳。
- `ColorEyeDropper` 在 macOS 上以 AppKit 的顏色取樣器取色，在網頁上以瀏覽器的 `EyeDropper` 取色；顏色以 sRGB 傳回。
