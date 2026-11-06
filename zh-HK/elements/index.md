---
title: "元素"
description: "每個 NSH 應用程式都由這些基本元素和基礎元件組成，支援 Rust 和 TSX，並包含它們共用的屬性、事件和 ref 方法。"
order: 1
source_hash: 84e4cb96ec250ab2
---


# 元素

Native Shell 以一小組元素構建每個畫面:`View`、`Text` 和 `Image` 等基本元素,以及 `Button`、`Dialog` 和 `NavStack` 等基礎元件。每個基本元素都是原生視圖(在 iOS 和 Mac Catalyst 上是 UIView 子類別,在 Android 上是 `View`,在桌面平台上是 AppKit、GTK 或 Win32 視圖),由 NSH runtime 建立並排版。應用程式顯示的一切都由它們組成:應用程式的按鈕、卡片、列和畫面都是它自己的元件,以這些元素繪製並由應用程式設定樣式,所以應用程式的外觀完全由自己決定。

這些頁面上的每個範例都提供 Rust 和 TSX 兩個版本:選擇一個分頁,頁面上所有範例都會跟着切換。

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

在 Rust 中,基本元素是 `nsh_core::prelude` 的函式(`view()`、`text(..)`、`image(..)`),基礎元件來自 `nsh_base` crate。樣式是有型別的方法(`.flex_1()`、`.gap_3()`、`.px(px(20.0))`、`.bg(..)`),狀態樣式接受一個閉包(`.active(|s| s.opacity(0.6))`),監聽器是接收其事件的閉包(`.on_press(move || ..)`、`.on_change(move |text: &str| ..)`),而 `.child(..)` 用來加入子元素。一段 UI 就是一個回傳 `impl IntoElement` 的普通函式;它只會執行一次,而在閉包(`text(move || ..)`、`.bg(move || ..)`)中讀取的 signal 會更新它們所綁定的內容。參閱[以 Rust 構建](../docs/rust.md)。

在 TSX 中,每個標籤都使用 PascalCase,並指向作用域內的一個綁定:基本元素來自 `nsh`,基礎元件來自 `nsh/base`。只有 `<If>` 和 `<Each>` 是全域的,無需匯入。小寫標籤(例如 `<view>`)會造成建置錯誤,因為 TypeScript 會按每個名稱一個全域型別來檢查它,而 `List` 和 `Each` 等泛型元件將無法推斷其項目型別。編譯器透過匯入來識別這些元素,並就地建立原生視圖,因此匯入它們不會增加任何執行時成本。參閱 [JSX 與元件](../docs/jsx-and-components.md)。

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## 基本元素

TSX 中從 `nsh` 匯入,Rust 中從 `nsh_core::prelude` 匯入。

| 元素 | Rust | 原生視圖(iOS / Android) | 頁面 |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup;配合 `selectable` 時,其中的文字會一併選取 | [View](./view.md)、[文字選取](./text-selection.md) |
| `<Text>` | `text(content)` | CoreText 視圖 / StaticLayout 視圖 | [Text](./text.md) |
| `<Image>` | `image(src)` | 帶有圖像圖層的視圖 / 圖像視圖 | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / 回收儲存格的 ScrollView | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | 重播 2D 繪圖的視圖 | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | 由 WGSL 程式在 GPU 上於其子元素下方繪製其範圍的視圖 | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`、`web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / TextureView 上的 MediaPlayer | [Video](./video.md) |
| `<Overlay>` | `overlay()` | 位於視窗(或其所在對話框)最上層、相對錨點定位的視圖 | [Overlay](./overlay.md) |
| `<If>`、`<Each>` | `when(..)`、`each(..)`、`dynamic(..)` | 控制流程:選擇要顯示的元素 | [控制流程](./control-flow.md) |
| `<InputAccessoryView>`(`nsh/mobile`) | `input_accessory_view(id)` | iOS 上位於鍵盤上方的工具列 | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

內距(padding)和外距(margin)可使用 CSS 的 `env()` 讓內容避開系統 UI:`env(safe-area-inset-top)` 及其他邊緣([安全區域](./safe-area.md))和 `env(keyboard-inset-height)`([鍵盤](./keyboard.md))。

<a id="base"></a>

## 基礎元件

TSX 中從 `nsh/base` 匯入,Rust 中來自 `nsh_base` crate。它們負責行為、狀態、焦點和無障礙功能,外觀則由應用程式決定。

| 元件 | Rust | 用途 | 頁面 |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | 系統的警示框和動作表 | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` 及其組成部分 | `nsh_base::accordion()`、`accordion_item()`、... | 在標題下展開和收合的層疊區段,可一次展開一個或多個 | [Accordion](./accordion.md) |
| `<Avatar>`、`<AvatarGroup>` | `nsh_base::avatar()`、`avatar_group()` | 一個人的圖片,或在載入中或載入失敗時的後備內容,以及只顯示最前幾個的一排頭像 | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | 帶有各種狀態和角色的可按壓控制項 | [Button](./button.md) |
| `<Carousel>` 及其組成部分 | `nsh_base::carousel()`、`carousel_content()`、... | 一次顯示一張的投影片,支援原生滑動、上一張 / 下一張、分頁指示、按鍵操作和無縫循環 | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | 帶有指示符號、可處於已勾選、未勾選或不確定狀態的控制項 | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | 內容可展開和收合的區域 | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | 命令面板:搜尋欄加上以原生方式篩選的命令、虛擬化列表,以及 Cmd+K 面板的按鍵操作 | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | 列和欄數目不限的表格,可選取、可排序,欄可調整大小和移動 | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | 將其子元素顯示於所有其他內容之上 | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | 兩段文字之間或補丁(patch)的差異,以並排或統一方式顯示 | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | 由使用者自行排列分割區、分頁群組和邊緣停靠區的工作區 | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | 支援語法突顯、多個插入點、摺疊和搜尋的程式碼編輯器 | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | 指標停留在觸發元素上時,預覽其指向的內容 | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | 原生文字輸入(UITextField 或 UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | 可按壓並開啟頁面、網站或應用程式路由的目標 | [Link](./link.md) |
| `<Menu>`、`<ContextMenu>`、`<MenuItem>`、`<MenuSeparator>`、`<Submenu>` | `nsh_base::menu()`、... | 選單:桌面平台上帶有層疊子選單的彈出選單,手機上則為底部面板 | [Menu](./menu.md) |
| `<NavStack>`、`<NavPage>` | `nsh_base::nav_stack()`、`nsh_base::nav_page()` | 原生導覽:帶有平台標題列和返回手勢的頁面堆疊 | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | 在欄位中輸入或以按鈕和按鍵逐步調整的數字 | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | 固定位數的一次性代碼,可輸入、貼上或自動填入各個儲存格 | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | 一組內容的頁碼:上一頁、目前頁附近的頁碼、省略號和下一頁 | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | 項目可包含項目,可展開和收合,並可選取其中一項:已虛擬化,佔鍵盤焦點的一個停駐點 | [Tree](./tree.md) |
| `<Plot>`、`<Line>`、`<Area>`、`<Bar>`、`<Grid>`、`<Pie>`、`<Arc>`(`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | 圖表的框架及其標記,根據應用程式的資料列以原生方式繪製 | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | 錨定於觸發元素、顯示於所有內容之上的內容 | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | 進度條:顯示任務完成了多少,或表示任務正在進行 | [Progress](./progress.md) |
| `<Radio>`、`<RadioGroup>` | `nsh_base::radio()`、`radio_group()` | 供使用者在一組選項中選擇其一的單個選項,以及該組選項 | [Radio](./radio.md) |
| `<ResizablePanelGroup>`、`<ResizablePanel>` | `nsh_base::h_resizable()`、`resizable_panel()` | 並排或上下堆疊的面板,帶有可調整其大小的拖曳把手 | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | 為捲動視圖或列表提供應用程式自有外觀的捲軸 | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | 從項目列表中選擇一個值,支援鍵盤、搜尋和分組 | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | 位於螢幕邊緣、置於背景遮罩之上的面板 | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | 沿軌道選取的一個值,或兩個值組成的範圍 | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | 帶有軌道和滑塊的開 / 關控制項 | [Switch](./switch.md) |
| `<Table>` 及其組成部分 | `nsh_base::table()`、`table_row()`、... | 由應用程式自有的列和儲存格組成的表格,帶有表格的角色 | [Table](./table.md) |
| `<Tab>`、`<Tabs>` | `nsh_base::tab()`、`tabs()` | 分頁列表中的單個分頁,以及該列表 | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | 以文字和視圖顯示 Markdown 或 HTML 文件 | [TextView](./text-view.md) |
| `<Toast>`、`<ToastStack>` | `nsh_base::toast()`、`toast_stack()` | 一則 toast 的語意根節點;從邊緣起以圖層方式排列的多則 toast | [Toast](./toast.md) |
| `<Toggle>`、`<ToggleGroup>` | `nsh_base::toggle()`、`toggle_group()` | 可開啟或關閉的按鈕,以及由這些按鈕組成的工具列 | [Toggle](./toggle.md) |
| `<Toolbar>`、`<ToolbarGroup>`、`<ToolbarSeparator>` | `nsh_base::toolbar()`、`toolbar_group()`、`toolbar_separator()` | 由按鈕、切換按鈕和連結組成的列,佔鍵盤焦點的一個停駐點 | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | 在懸停或手指按住時,顯示於觸發元素旁的提示 | [Tooltip](./tooltip.md) |

> [!NOTE]
> 字串只會在 `Text` 內繪製。`View` 的字串子元素不會建立原生視圖,也不會參與排版。

<a id="common-props"></a>

## 通用屬性

每個基本元素都接受以下屬性(TSX 中為 `CommonProps` 型別;Rust 中為 `Styled`、`Interactive` 和 `Accessible` trait)。各元素頁面只列出其專屬屬性。Rust 欄列出對應的建構方法。

<a id="styling"></a>

### 樣式

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `style` | 有型別的 `Styled` 方法;`.inline_style(style)` | `StyleProp<ViewStyle>`(`TextStyle` 用於 `<Text>` 和 `<Input>`,`ImageStyle` 用於 `<Image>`) | 內嵌樣式,或由左至右合併的樣式陣列(會略過假值項目;陣列可巢狀,所以 `style={[base, props.style]}` 可接受本身也是陣列的 `props.style`)。優先於 `class`。參閱[樣式參考](../modules/style-reference.md)。 |
| `class` | 有型別的 `Styled` 方法(`.flex_row().gap_2().p_4()`) | `string` | Tailwind class,以原生方式解析(`"flex-row gap-2 p-4 dark:bg-zinc-900"`)。後面的 class 優先於前面的。參閱 [Tailwind](../docs/tailwind.md)。 |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | 在其值為真值時套用的 class(`{ "opacity-50": busy() }`)。 |
| `disabled` | `.disabled(..)` | `boolean` | 忽略按壓(也沒有按壓回饋),套用 `disabled:` 樣式,停用輸入框等控制項,並讓螢幕閱讀器讀出它已停用(`accessibilityState.disabled`)。 |

<a id="presses-and-feedback"></a>

### 按壓與回饋

按壓處理在原生層執行:平台負責識別按壓並套用應用程式的按壓樣式,應用程式的程式碼事後才會得知。只有最內層的可按壓視圖會作出回應;在捲動視圖內,按下(press-in)會等待約 130 毫秒,讓捲動可以先開始。

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | 在視圖內結束的一次點按。 |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | 手指按住達 `delayLongPress`。 |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | 手指按在視圖上。 |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | 手指抬起或離開。 |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | 按壓變為長按前的毫秒數。 |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | 將觸控區域延伸至邊界之外,單位為 point。 |

`PressEvent` 是 `{ position, pagePosition, modifiers, clickCount }`:指標在視圖內及其根視圖內的位置(`Point`),按壓開始時按住的修飾鍵,以及連續點擊次數(雙擊為 2)。若平台沒有回報指標,則為視圖的原點、沒有按鍵,點擊次數為一。

樣式鍵 `pointerEvents`(Rust 中為 `.pointer_events(PointerEvents::BoxNone)`,class 為 `pointer-events-*`)決定視圖本身及其內部視圖接收哪些觸控:`"none"` 兩者皆不接收(內部設定 `"auto"` 的視圖會重新接收),`"box-none"` 只有其內部的視圖接收,`"box-only"` 只有視圖本身接收([觸控與手勢](../docs/touch-and-gestures.md#pointerevents))。

按壓回饋由應用程式決定:`activeStyle`(或 `active:` class,Rust 中為 `.active(..)`)在視圖被按壓期間以原生方式套用,無需與應用程式的程式碼往返溝通(見下文)。

<a id="state-styles"></a>

### 狀態樣式

當視圖處於某個狀態時套用的樣式,以原生方式疊加在其自有樣式之上。每一項都是 Tailwind variant 的物件形式。後面的狀態優先(selected、checked 和 indeterminate,其次是 hover、focus、active);`disabledStyle` 優先於全部,而在視圖停用時,其他狀態都不會套用。每一項都接受該元素自己的樣式:`<Text>` 上為 `TextStyle`,`<Input>` 上為 `InputStyle`,`<Image>` 上為 `ImageStyle`,其他元素為 `ViewStyle`。

| 屬性 | Rust | Class variant | 套用時機 |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | 被按壓時。 |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | 指標位於視圖上方時。 |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | 視圖擁有焦點時。 |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | 視圖或其內部的視圖擁有焦點時(`Overlay` 的內容視為位於其所在的視圖之內)。 |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | 當 `disabled` 時。 |
| `checkedStyle` | `.checked(\|s\| ..)`、`.checked_style(style)` | `checked:` | 當 `accessibilityState.checked` 為 `true` 時(核取方塊、開關、單選按鈕;`"mixed"` 不算已勾選)。 |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`、`.indeterminate_style(style)` | `indeterminate:` | 當 `accessibilityState.checked` 為 `"mixed"` 時(既非已勾選也非未勾選的核取方塊)。 |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | 當 `accessibilityState.selected` 為 `true` 時(已選取的 `Button`、分頁)。 |
| `expandedStyle` | `.expanded(\|s\| ..)`、`.expanded_style(style)` | `aria-expanded:` | 當 `accessibilityState.expanded` 為 `true` 時(`Popover` 或 `Menu` 的觸發元素在其彈出內容開啟期間)。 |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`、`.pressed_style(style)` | `aria-pressed:` | 當 `accessibilityState.pressed` 為 `true` 時(已開啟的切換按鈕;`"mixed"` 不算已按下)。並非 `activeStyle`,即正在進行中的按壓。 |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
<a id="hover"></a>

### 懸停

App 可以偵測滑鼠移入視圖、在其上移動及移出：支援 macOS、Windows、Linux、GPUI 後端和桌面瀏覽器；在 iOS 上支援 iPad 的指標或 Mac 的滑鼠；在 Android 上支援滑鼠或觸控筆。懸停樣式（`hover:`、`.hover(..)`）會在相同的平台上為被懸停的視圖設定樣式。

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | 滑鼠移入了該視圖或其內的視圖（對應 DOM 的 `mouseenter`）。 |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | 滑鼠在該視圖（或其內的視圖）上移動，不論有否按下按鈕；或者在沒有按下任何按鈕、滑鼠停留其上時，按下或放開了修飾鍵（對應 DOM 的 `mousemove`）。 |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | 滑鼠離開了該視圖及其內的視圖，或離開了視窗；`e` 是它最後所在的位置（對應 DOM 的 `mouseleave`）。 |

與 CSS 的 `:hover` 和 DOM 的 `mouseenter` 一樣，只要滑鼠在視圖上，或在其內任何內容上，該視圖即算被懸停，因此滑鼠下方那個視圖的外層視圖同樣會收到 `onMouseEnter`（由外至內；`onMouseLeave` 則由內至外）。這些事件在事後才觸發，觸控時永不觸發。若滑鼠下方的視圖被移除，該視圖會收到 `onMouseLeave`，在 Linux 和 Windows 上要待下次滑鼠移動時才收到。

`MouseEvent` 說明滑鼠的位置，與 GPUI 的 `MouseMoveEvent` 相同：`position` 是在該視圖內的位置（以點為單位的 `Point`，已還原其變換）；`pagePosition` 是在其所屬根視圖內的位置，與觸控事件提供的一致；`modifiers` 是按住的修飾鍵（`control`、`alt`、`shift`、`platform`：在 Apple 平台上是 Command，在其他平台上是 Windows 鍵）；`pressedButton` 是按住的按鈕（`"left"`、`"right"`、`"middle"`、`"back"` 或 `"forward"`，即 GPUI 的 `MouseButton`），或 `null`；在 Rust 中則為 `position`、`page_position`、`modifiers` 和 `pressed_button`。在桌面平台和網頁上，拖曳同時也是一次觸控（`onTouchMove`，即 responder），其移動會傳到 `onMouseMove`，並設定了 `pressedButton`：只需跟隨懸停的回饋會略過這些事件；在 iOS 和 Android 上，懸停回報的是沒有按下任何按鈕的指標。移動事件每幀最多一次，只取最新的一次，並且一定在緊隨其後的 `onMouseLeave` 之前送達，因此處理函式可以在每次移動時重繪：

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

<a id="tooltips"></a>

### 工具提示

`tooltip` 可為任何元素加上提示。在桌面平台（macOS、Windows、Linux、GPUI 後端和桌面瀏覽器）上，指標在元素上停留半秒後，提示會顯示在元素上方，直至指標離開或按下該元素為止。手機和平板電腦不會顯示提示。提示不會接管指標或按下操作，因此元素的運作與沒有提示時完全一樣。

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | 提示，一個由 app 設定樣式的元素：[`Tooltip`](tooltip.md) 的 `nsh/base` 本身就是工具提示，並自帶位置、延遲和事件；其他任何元素則按原樣顯示。 |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

`Tooltip` 自行設定外觀、位置、延遲和事件，就像 GPUI 的 `.tooltip(..)` 所接受的那樣。工具提示很多的 app，會自備一個小元件，把文字包在它的 `Tooltip` 中。

<a id="context-menus"></a>

### 情境選單

`onContextMenu` 會告知視圖，其上按下了次要按鈕：右鍵按一下、macOS 上的 Control-按一下、觸控板上的雙指按一下、iPad 指標的次要按一下；在瀏覽器中還包括鍵盤的選單鍵。在此打開 app 自己的選單；在 TSX 中，[`Menu.popup`](../modules/nsh-desktop.md) 則顯示系統的選單：

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | 在該視圖或其內的視圖上按下了次要按鈕。 |

`ContextMenuEvent` 包含視圖內的 `position`、其根視圖內的 `pagePosition`（`Menu.popup` 用它來放置選單：`Menu.popup(items, e.pagePosition)`）以及 `modifiers`；在 Rust 中則為 `position`、`page_position` 和 `modifiers`。由指標下方的視圖開始向外，最近的、有監聽的視圖會收到事件。若有文字輸入框，或帶編輯選單的可選取文字（Windows、GPUI 後端、瀏覽器）比該視圖更近，則會改為顯示它自己的選單。平台在按鈕按下的一刻，根據已掛載的內容作出決定，所以處理函式是事後才獲通知，無需取消任何東西。`disabled` 視圖會把點按交給其外層最近的已啟用監聽者。在觸控螢幕上，長按會打開選單：請用同一個函式處理 `onLongPress`。

<a id="keyboard-focus"></a>

### 鍵盤焦點

在 macOS 和網頁上，Tab 鍵會按樹狀順序在各個停駐點之間移動鍵盤焦點：輸入框、接受按下操作的視圖，以及每個 `focusable` 視圖。焦點樣式（`focus:`、`.focus(..)`）會為取得焦點的視圖設定樣式；若視圖接受按下操作，按 Return 或空白鍵即可按下它。點按會按下視圖但不會令它取得焦點，因此焦點樣式只會在鍵盤焦點下顯示。

焦點和按下操作是分開的。在取得焦點時接收按鍵的視圖（圖表、滑桿、以方向鍵移動選擇項的列表）會設定 `focusable`，並在取得焦點時綁定其按鍵（`onFocus` / `onBlur`，配合 [`keymap`](../modules/nsh.md#keymap)）；按下它時，操作仍會傳到其外層可按下的視圖，例如會打開頁面的卡片。

ref 的 `focus()` 會像 Tab 鍵一樣把鍵盤焦點移到某個停駐點（其焦點樣式會顯示，`onFocus` 也會觸發），例如在彈出視窗關閉後把焦點交還給觸發它的元素；`blur()` 則會移除焦點。

外層視圖可在焦點位於自身或其內任何視圖時，用 `focus-within:`（`focusWithinStyle`、`.focus_within(..)`）設定自己的樣式：例如包住正在編輯的輸入框的欄位外框，或其中一個按鈕取得焦點時的工具列。`Overlay` 的內容算作該疊加層所在視圖之內，不論它顯示在何處，因此彈出視窗算是包含其觸發元素的視圖的一部分。在 Rust 中，元件可透過其 ref 的 `on_focus_in(..)` 和 `on_focus_out(..)` 得知焦點進入和離開某個元素：在元素內部的視圖之間移動則兩者皆不算。

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | 接受按下操作的視圖為 `true` | 視圖是否為 Tab 的停駐點。`true` 令任何視圖都成為停駐點，不論它是接受按下操作，還是把按下操作留給外層視圖；`false` 則讓可按下的視圖只供指標操作（例如關閉彈出框的背景遮罩、以方向鍵在其間移動的列）。 |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab（或 `focus()`）令視圖取得了鍵盤焦點。 |
| `onBlur` | `.on_blur(..)` | `() => void` | | 鍵盤焦點離開了視圖。 |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### 版面配置與識別

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` 是視圖相對於其父視圖的框架，`{ origin, size }`，在每次令其改變的版面配置之後提供。 |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | 元素的 ref（見 [ref 方法](#ref-methods)）：`ViewRef`，或建基於其上的元素自身類型。`ref={el}` 指派變數，`ref={fn}` 呼叫函式。 |
| `nativeID` | `.native_id(id)` | `string` | 為視圖命名以供其他元素參照，例如輸入框所參照的 `InputAccessoryView`。 |
| `testID` | `.test_id(id)` | `string` | 供 UI 測試使用的識別碼（在 Android 上為視圖的 resource id）。 |
| `key` | `.key(key)` | `string` | 元素在其同層元素中的身分。 |

<a id="gestures-driving-animated-values"></a>

### 以手勢驅動動畫值

這些屬性把手勢綁定到[原生動畫值](../modules/nsh.md#animation)，動畫值在 UI 執行緒上移動，app 的程式碼無需逐幀處理。參閱[觸控與手勢](../docs/touch-and-gestures.md)。

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | 拖曳會驅動這些值（單位為點）。 |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | 拖曳開始。 |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | 拖曳結束，並附帶放開時的速度（例如用來啟動 `decay`）。 |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | 雙指捏合會驅動 `scale`。 |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | 捏合開始 / 結束。 |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | 雙指旋轉會驅動 `angle`（單位為度）。 |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | 旋轉開始 / 結束。 |

`PanEvent` 是 `{ cancelled, translation, velocity, value? }`（在 Rust 中為 `cancelled`、`translation`、`velocity_x`、`velocity_y`、`value_x`、`value_y`）：包括系統是否取消了拖曳、自開始以來的位移、以每秒點數計的速度（各個 `Point`），以及當下已綁定的值，即 `{ x?, y? }`，對應 `pan` 所綁定的軸（拖曳可以在動畫進行中抓住某個值）。

<a id="raw-touches-and-the-responder-system"></a>

### 原始觸控與 responder 系統

上述屬性未涵蓋的手勢，可使用每個元素都支援的觸控和 responder 屬性：`onTouchStart`、`onTouchMove`、`onTouchEnd`、`onTouchCancel`（及其 `…Capture` 形式）、`onStartShouldSetResponder`、`onMoveShouldSetResponder`（及 `…Capture`）、`onResponderGrant`、`onResponderReject`、`onResponderStart`、`onResponderMove`、`onResponderEnd`、`onResponderRelease`、`onResponderTerminate` 和 `onResponderTerminationRequest`。每個處理函式都會收到一個 `GestureResponderEvent`
（`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...）。
在 `onResponderGrant` 中回傳 `true` 可防止原生捲動視圖接管觸控。`panActivation`
（`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`）會令視圖只在平台啟動其平移手勢之後才成為 responder，因此捲動視圖內的拖曳會把另一個軸留給捲動視圖
（[觸控與手勢](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)）。
[`PanResponder`](../modules/nsh.md#panresponder) 中的 `PanResponder` 建基於這些屬性。在 Rust 中，`.on_touch(..)` 會接收每一次觸控
（`TouchEvent`），`.claim_touches(..)` 決定視圖何時接管觸控，`.on_responder_grant(..)`、
`.on_responder_move(..)`、`.on_responder_release(..)` 及其他則跟隨 responder。

<a id="accessibility"></a>

### 無障礙功能

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | 該視圖對輔助技術而言是單一元素；其子視圖不會被個別公開。 |
| `accessibilityLabel` | `.label(..)` | `string` | 螢幕閱讀器朗讀的內容。沒有標籤的視圖會朗讀其文字。 |
| `accessibilityHint` | `.hint(..)` | `string` | 啟用該元素會發生的操作。 |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | 元素的類別（`"button"`、`"header"`、`"link"`、`"switch"`……）。 |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | 輔助技術回報的狀態（`checked` 和 `pressed` 可以是 `"mixed"`；`current` 是 `true` 或 `"page"`、`"step"`、`"location"`、`"date"`、`"time"`）。 |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | 標題的級別（1 為最高），樹狀項目的深度（1 為最頂層）。 |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | 範圍型或文字型元素的值。 |
| `accessibilityElementsHidden` | | `boolean` | 對輔助技術隱藏該視圖及其子樹。 |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | 視圖是否被公開。 |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | 提供給輔助技術的自訂動作。 |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | 用戶觸發了 `accessibilityActions` 之一。 |

參閱[無障礙功能](../docs/accessibility.md)。

<a id="platform-only-props"></a>

### 平台專屬屬性

只存在於單一平台的屬性，在 TSX 中放在以該平台命名的物件內，因此共用屬性在各處都保持一致。只有當前平台的物件會被傳送，其餘的會被忽略。Rust builder 則以方法接受這些屬性，並只在相應平台上生效。

| 屬性 | 說明 |
|---|---|
| `ios={{…}}` | iOS 和 Mac Catalyst。`<Input>`、`Dialog` 和 `WebView` 會加入各自的鍵。 |
| `android={{…}}` | Android。每個元素都支援 `ripple`、`elevation` 和 `accessibilityLiveRegion`（見下文）。 |
| `desktop={{…}}` | 桌面平台和桌面瀏覽器；在行動平台上會被忽略。每個元素都支援 `windowDrag`（見下文）。 |
| `web={{…}}` | 瀏覽器；在其他平台上會被忽略。 |

| `android` 鍵 | Rust | 類型 | 說明 |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | 按下時的 material 漣漪效果。 |
| `elevation` | `.elevation(px(2.0))` | `number` | material 陰影（單位為點），形狀取自視圖。 |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | 視圖的變更如何向 TalkBack 播報。 |

| `desktop` 鍵 | Rust | 類型 | 說明 |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | 按下該視圖會拖動視窗，效果如同其標題列；`false` 令可拖動視圖的某部分仍可點按。參閱[自訂標題列](../modules/nsh-desktop.md#a-title-bar-of-your-own)。 |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

參閱[平台專屬程式碼](../docs/platform-specific.md)。
<a id="ref-methods"></a>

## Ref 方法

在 TSX 中，`ref` 會接收元素的 ref，其類型就是該元素本身的類型：`ViewRef`（`focus`、`blur`、`measure`）用於 `View`、`Text`、`Image`、`Canvas`、`Overlay` 和 `Shader`；其餘元素則使用以 `ViewRef` 為基礎、並附有該元素方法的類型：`InputRef`（`Input`）、`ScrollRef`（`Scroll`）、`ListRef`（`List`）、`WebViewRef`（`WebView`）、`VideoRef`（`Video`）和 `NativeComponentRef`（原生元件）。在 Rust 中，`element_ref()` 會建立一個 `ElementRef` 控制代碼，由 `.element_ref(&handle)` 附加。這些方法會向原生視圖發送指令，並與同一輪中先前所作的變更按順序執行。各元素頁面會說明哪些方法適用於該元素。ref 變數應以其元素本身的類型標註（`let field!: InputRef` 用於 `<Input>`）：類型為 `ViewRef` 的變數，並不適用於 ref 帶有自身方法的元素。

| 方法 | Rust | Ref | 說明 |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | 令 `<Input>` 取得焦點（顯示鍵盤），或令接受按壓的視圖取得／取消鍵盤焦點。 |
| `measure()` | `measure()` | `ViewRef` | [視圖的位置](../docs/touch-and-gestures.md#where-a-view-is-measure)。 |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | 以 UTF-16 單位選取 `start..end`；沒有 `end` 時則設定插入點。 |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`、`ListRef` | 捲動至指定偏移量。 |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef`（可縮放的 `<Scroll>`） | 以內容中某一點為中心縮放至 `scale`。 |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | 沿列表的軸向捲動至指定偏移量。 |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | 捲動至項目可見。 |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`、`ListRef` | 捲動至內容末端。 |
| `reload()`、`goBack()`、`goForward()`、`stopLoading()`、`injectJavaScript(script)`、`postMessage(data)` | `reload()`、`go_back()`、`go_forward()`、`stop_loading()`、`inject_java_script(..)`、`post_message(..)` | `WebViewRef` | 控制頁面。 |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | 跳至指定時間。 |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | 呼叫已註冊原生元件的指令（[`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)）。 |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## 為何處理函式不會阻塞 UI

主執行緒從不等待應用程式的程式碼。當系統需要即時得到答覆時（是否允許此文字變更、返回按鈕是否可以彈出、此 sheet 是否可以關閉），NSH 會根據事先設定的 prop（`maxLength`、`popOnBack`、`closeOnSwipe`……）在原生層直接回應，事件其後才會傳到應用程式。這就是此類行為屬於 prop，而不是處理函式回傳值的原因。
