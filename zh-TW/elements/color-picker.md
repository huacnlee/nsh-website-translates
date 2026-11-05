---
title: "ColorPicker"
description: "ColorPicker 元件及其各部件：可在飽和度與亮度區域上選取顏色，可透過 RGB、HSL、HSB 或 OKLCH 任一色彩通道及透明度的滑桿調整，可輸入任何 CSS 格式的色彩值，可從色票中選擇，或使用滴管工具在螢幕上取色；支援 WAI-ARIA 的按鍵操作，並為螢幕閱讀器提供可調整的元素，版面配置與樣式皆由應用程式自行決定。"
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

顏色選擇器持有一個顏色，其內部的各個部件負責顯示並修改它：飽和度與亮度的 `ColorArea`、RGB、HSL、HSB 或 OKLCH 任一通道以及 alpha 的 `ColorSlider`、以文字接收顏色或以數字接收單一通道的 `ColorField`、預設顏色的 `ColorSwatch`，以及可在螢幕任意位置取色的 `ColorEyeDropper`。應用程式以自己的元素穿插排版這些部件（每個通道一列並附上其字母、以 `Tabs` 選取的色彩空間、放在 `Popover` 中的選擇器），並為每個部件設定樣式：部件負責繪製各通道的顏色，而所有尺寸、圓角、邊框與陰影都由應用程式決定。

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

`ColorPicker`、`ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch` 與 `ColorEyeDropper` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`color_picker()` 及其各部件的函式以每個屬性一個 setter（`.channel(..)`、`.thumb_style(..)`）、每個事件一個監聽器方法（`.on_change(..)`）以及具型別的樣式方法來建立它們；顏色是 `Hsla`，色彩空間、通道與格式分別是 `ColorSpace`、`ColorChannel` 與 `ColorFormat`。

<a id="value"></a>

## 值

顏色是一個 CSS 顏色：十六進位（`#3b82f6`、含 alpha 的 `#3b82f680`）、`rgb()`、`hsl()`、`hsb()`、`oklch()` 或 CSS 名稱；在 Rust 中為 `Hsla`。應用程式以 `value` 掌控顏色，並設定 `onChange` 所回報的值，與 `nsh/base` 的每個控制項相同；或者以 `defaultValue` 將顏色交給選擇器自行管理，同樣能收到變更通知。

- `onChange({ value, formatted })` 會回報使用者要求的每一個顏色：拖曳色域或滑桿的每一步、每次按鍵、欄位中正在輸入的數字、按下的色票。`value` 是該顏色，`formatted` 是依 `format` 所指定的方式寫成的同一個顏色（`"hex"`、`"rgb"`、`"hsl"`、`"hsb"` 或 `"oklch"`），可直接儲存或設為 token。
- `onChangeEnd({ value, formatted })` 只回報一次變更最終停留的顏色：指標放開時、每次按鍵之後、離開或送出欄位時、按下色票時。
- 選擇器會在每個色彩空間中保留使用者所設定的顏色。灰色會保留其色相與飽和度，因此色相滑桿會停在使用者離開時的位置；在 OKLCH 中編輯的顏色會保留輸入的明度、彩度與色相，即使超出 sRGB 所能顯示的範圍（回報的顏色是 sRGB 能顯示的最接近顏色，而 `"oklch"` 中的 `formatted` 會保留這些通道）。
- 應用程式設定的、且選擇器未曾回報過的 `value`，會取代每個色彩空間中的顏色。

<a id="spaces-and-channels"></a>

## 色彩空間與通道

| `colorSpace` | 通道（`channel`） | 範圍 |
|---|---|---|
| `"rgb"` | `"red"`、`"green"`、`"blue"` | 0 到 255 |
| `"hsl"` | `"hue"`、`"saturation"`、`"lightness"` | 色相 0 到 360，其餘 0 到 100 |
| `"hsb"` | `"hue"`、`"saturation"`、`"brightness"` | 色相 0 到 360，其餘 0 到 100 |
| `"oklch"` | `"lightness"`、`"chroma"`、`"hue"` | 明度 0 到 100（步進 0.1），彩度 0 到 0.4（步進 0.001），色相 0 到 360（步進 0.1） |
| 任一 | `"alpha"` | 0 到 100 |

滑桿的軌道會在固定其他通道的情況下繪製該通道的顏色，因此能顯示每個值會通往什麼顏色。若指定的通道不屬於該色彩空間，則使用該色彩空間的第一個通道（並顯示警告）。

<a id="props"></a>

## 屬性

<a id="colorpicker-1"></a>

### ColorPicker

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 無 | 顏色（受控）。應用程式設定 `onChange` 所回報的值。 |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | 在未設定 `value` 時的初始顏色；此時選擇器自行保存顏色。 |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | `formatted` 如何寫出顏色。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 任何部件都無法變更顏色；`disabled:` class 會套用到選擇器及其部件。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各部件，以及穿插其間的應用程式元素。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 選擇器本身：包住各部件的欄（或列）。 |

### ColorArea

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `panelClass`、`panelStyle` | `.panel_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 面板，填滿色域：呈現該色相的顏色，飽和度由左至右（在由右至左的版面中則由右至左），亮度由下至上，並依其圓角裁切。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 拇指滑塊，置中於該顏色上。 |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | 拇指滑塊的背景為該顏色。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 指標、鍵盤或螢幕閱讀器都無法變更顏色。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為拇指滑塊朗讀的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 色域：其大小由應用程式決定。 |

### ColorSlider

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | 通道所屬的色彩空間。 |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | 它所變更的通道：該色彩空間的其中一個通道，或 `"alpha"`。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 軌道的方向：最小值位於起點（左側，在由右至左的版面中為右側），或位於底部。於建立滑桿時讀取。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道：沿軌道呈現該通道的顏色，並依其圓角裁切；拇指滑塊放置在軌道上。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 拇指滑塊，置中於該值上。 |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | 拇指滑塊的背景為該顏色（在 alpha 滑桿上包含其 alpha）。 |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | 無 | 軌道下方棋盤格的顏色，會透過 alpha 滑桿的顏色顯現。 |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 棋盤格方塊的邊長。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 指標、鍵盤或螢幕閱讀器都無法變更顏色。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為拇指滑塊朗讀的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 滑桿：軌道周圍接收按壓與拖曳的區域。 |

### ColorField

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | 無 | 以數字接收的通道。若未設定，欄位會以文字接收整個顏色。 |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | `channel` 所屬的色彩空間。 |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | 欄位如何寫出整個顏色。可讀取任何 CSS 形式。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 欄位為空時顯示。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法輸入。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為欄位朗讀的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<TextStyle>` | 無 | 欄位，即文字輸入框。 |

通道欄位會在輸入數字時變更顏色，並限制在該通道的範圍內；整個顏色的欄位則在離開或送出欄位時，若文字可讀取為顏色才變更顏色。離開欄位時，會以其格式重新寫出欄位的值。

### ColorSwatch

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | 無 | 它所顯示的顏色；按下後會在其所屬的選擇器中選取該顏色。若未設定，則顯示選擇器本身的顏色，作為預覽。 |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | 無 | 當它是選擇器目前的顏色時所套用的樣式，以 `selected:` class 表示。 |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | 無 | 半透明顏色下方的棋盤格。 |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 方塊的邊長。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法按壓。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 十六進位的顏色 | 螢幕閱讀器朗讀的內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 顯示在顏色之上的內容：例如已選取色票上的勾號（`group-selected:`）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 色票：其大小、形狀與邊框；其圓角會裁切顏色。 |

### ColorEyeDropper

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法按壓。在平台沒有滴管功能時也會停用。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器朗讀的內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 其內容：應用程式的圖示或標籤。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 按鈕。 |

按下後會顯示系統的滴管：在 macOS 上為 AppKit 的取色器，在網頁上為瀏覽器的 `EyeDropper`（Chrome 與 Edge）。取得的顏色會成為選擇器的顏色（先觸發 `onChange`，再觸發 `onChangeEnd`）；按下 Escape 則不選取任何顏色。在平台沒有滴管功能時，按鈕會被停用，而 `disabled:hidden` 會在該處將其隱藏。

<a id="events"></a>

## 事件

| 事件 | 所屬 | Rust | Payload | 時機 |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 使用者變更了顏色。 |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 變更結束。每次變更只觸發一次。 |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | 色票被按下；也可單獨使用，例如作為調色盤的色塊。 |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | 使用者在螢幕上選取了顏色；也可單獨使用。 |

在 Rust 中，`ColorPickerEvent::Change(Hsla, SharedString)` 與 `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` 帶有顏色及其 `formatted` 文字。

<a id="parts"></a>

## 部件

| 部件 | 位於 | 樣式設定方式 |
|---|---|---|
| `ColorArea` | 選擇器內 | `class`、`style` |
| 色域的面板 | 色域內，填滿色域 | `panelClass`、`panelStyle` |
| 色域的拇指滑塊 | 色域內，置中於該顏色 | `thumbClass`、`thumbStyle` |
| `ColorSlider` | 選擇器內 | `class`、`style` |
| 滑桿的軌道 | 滑桿內 | `trackClass`、`trackStyle` |
| 滑桿的拇指滑塊 | 滑桿內，置中於軌道上該值的位置 | `thumbClass`、`thumbStyle` |
| `ColorField` | 選擇器內 | `class`、`style` |
| `ColorSwatch` | 選擇器內，或單獨使用 | `class`、`style`、`selectedStyle` |
| `ColorEyeDropper` | 選擇器內，或單獨使用 | `class`、`style` |

滑桿的拇指滑塊在通道的兩端會置中於軌道的兩端。在滑桿上設定相當於拇指滑塊一半寬度的內距（`h-3` 軌道周圍使用 `h-6 justify-center px-2.5`），可讓整個拇指滑塊都留在滑桿內，使其在兩端都能接收按壓。部件會顯示的狀態包括：拇指滑塊被拖曳時的 `active:`、擁有鍵盤焦點時的 `focus:`、色票的 `selected:`，以及每個部件的 `disabled:`。

<a id="keyboard"></a>

## 鍵盤

在 macOS 與網頁上，每個拇指滑塊都是一個鍵盤焦點停駐點（Tab）：

| 按鍵 | 在滑桿上 | 在色域上 |
|---|---|---|
| 右、上 | 增加一步 | 右：飽和度增加；上：亮度增加 |
| 左、下 | 減少一步 | 左：飽和度減少；下：亮度減少 |
| Shift 加方向鍵 | 十步 | 十步 |
| Page Up、Page Down | 十步 | 亮度十步 |
| Home、End | 通道的兩端 | |

在由右至左的版面中，水平滑桿與色域由右側開始，最小值（最低飽和度）位於右端：按左鍵為增加一步，按右鍵為減少一步，而按壓或拖曳會選取指標在畫面上所指的位置的值。垂直滑桿仍以右與上為增加一步；色域上的上與下則維持亮度的方向。

色票接受 Space 與 Return。每次按鍵會先回報 `onChange`，再回報 `onChangeEnd`；按住方向鍵時會重複觸發。

<a id="accessibility"></a>

## 無障礙功能

- 色域與每個滑桿的拇指滑塊都是可調整的元素（`"adjustable"`，在瀏覽器中為 slider），具有各自的標籤、值與範圍；螢幕閱讀器的增加與減少操作可逐步調整它們。
- 每個欄位都是帶有標籤的文字欄位；每個色票都是按鈕，在它是選擇器目前的顏色時為已選取，並以其十六進位顏色命名，除非由 `accessibilityLabel` 指定名稱。滴管是帶有應用程式所設標籤的按鈕。
- 停用時，螢幕閱讀器會朗讀這些部件為暗淡狀態，且它們不接受任何動作。

關於標籤、角色與動作的一般說明，請參閱 [無障礙功能](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台注意事項

- 每個平台都會繪製應用程式所設定的樣式；軌道與面板的顏色是由平台繪製的漸層。按壓與拖曳由核心追蹤，適用於滑鼠、手寫筆或手指，而選擇器外圍的捲動檢視則只在拖曳從其他位置開始時才會捲動。
- `ColorEyeDropper` 在 macOS 上以 AppKit 的取色器取色，在網頁上則使用瀏覽器的 `EyeDropper`；取得的顏色以 sRGB 傳回。
