---
title: "Elements"
description: "每個 NSH 應用程式所使用的基礎元件與原始元件，涵蓋 Rust 與 TSX，以及它們共用的屬性（props）、事件與 ref 方法。"
order: 1
source_hash: 84e4cb96ec250ab2
---

# 元素

Native Shell 以一小組元素建構每個畫面：基本元素，例如 `View`、`Text` 與 `Image`，以及基礎元件，例如 `Button`、`Dialog` 與 `NavStack`。每個基本元素都是一個原生 view（在 iOS 與 Mac Catalyst 上是 UIView 子類別，在 Android 上是 `View`，在桌面平台上是 AppKit、GTK 或 Win32 view），由 NSH runtime 建立並排版。App 顯示的一切都由它們組成：App 的按鈕、卡片、列與畫面都是 App 自己的元件，以這些元素繪製並由 App 設定樣式，因此 App 的外觀完全由自己決定。

這些頁面上的每個範例都同時提供 Rust 與 TSX 版本：選擇一個分頁，整頁的所有範例都會跟著切換。

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

在 Rust 中，基本元素是 `nsh_core::prelude` 的函式（`view()`、`text(..)`、`image(..)`），基礎元件來自 `nsh_base` crate。樣式是具型別的方法（`.flex_1()`、`.gap_3()`、`.px(px(20.0))`、`.bg(..)`），狀態樣式接受一個 closure（`.active(|s| s.opacity(0.6))`），監聽器是以其事件為參數的 closure（`.on_press(move || ..)`、`.on_change(move |text: &str| ..)`），而 `.child(..)` 用來加入子元素。一段 UI 就是一個回傳 `impl IntoElement` 的普通函式；它只會執行一次，在 closure 中讀取的 signal（`text(move || ..)`、`.bg(move || ..)`）會更新與其綁定的內容。請參閱 [使用 Rust 建構](../docs/rust.md)。

在 TSX 中，每個標籤都使用 PascalCase，並對應作用域內的一個綁定：基本元素來自 `nsh`，基礎元件來自 `nsh/base`。只有 `<If>` 與 `<Each>` 是不需匯入的全域變數。小寫標籤（例如 `<view>`）會造成建置錯誤，因為 TypeScript 會依每個名稱對應的單一全域型別來檢查它，而 `List` 與 `Each` 這類泛型元件將無法推論其項目型別。編譯器透過匯入來辨識這些元素，並就地建立原生 view，因此匯入它們在執行時不會有任何成本。請參閱 [JSX 與元件](../docs/jsx-and-components.md)。

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## 基本元素

在 TSX 中從 `nsh` 匯入，在 Rust 中從 `nsh_core::prelude` 匯入。

| 元素 | Rust | 原生 view（iOS / Android） | 頁面 |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup；搭配 `selectable` 時，其內的文字會一起被選取 | [View](./view.md)、[文字選取](./text-selection.md) |
| `<Text>` | `text(content)` | CoreText view / StaticLayout view | [Text](./text.md) |
| `<Image>` | `image(src)` | 帶有影像圖層的 view / image view | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | 使用回收 cell 的 UIScrollView / ScrollView | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | 重播 2D 繪圖的 view | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | 一個 view，其範圍由 WGSL 程式在 GPU 上繪製，位於其子元素之下 | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`、`web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / TextureView 上的 MediaPlayer | [Video](./video.md) |
| `<Overlay>` | `overlay()` | 位於視窗（或其所在的對話框）之上、相對於錨點定位的 view | [Overlay](./overlay.md) |
| `<If>`、`<Each>` | `when(..)`、`each(..)`、`dynamic(..)` | 控制流程：選擇要呈現哪些元素 | [控制流程](./control-flow.md) |
| `<InputAccessoryView>`（`nsh/mobile`） | `input_accessory_view(id)` | iOS 上位於鍵盤上方的工具列 | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

Padding 與 margin 透過 CSS 的 `env()` 讓內容避開系統 UI：`env(safe-area-inset-top)` 與其他邊緣（[安全區域](./safe-area.md)）以及 `env(keyboard-inset-height)`（[鍵盤](./keyboard.md)）。

<a id="base"></a>

## 基礎元件

在 TSX 中從 `nsh/base` 匯入，在 Rust 中從 `nsh_base` crate 匯入。它們負責行為、狀態、焦點與無障礙功能，外觀則由 App 決定。

| 元件 | Rust | 功能 | 頁面 |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | 系統的警示對話框與動作選單 | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` 及其組成部分 | `nsh_base::accordion()`、`accordion_item()`、... | 堆疊的區段，可在標題下展開與收合，一次一個或同時多個 | [Accordion](./accordion.md) |
| `<Avatar>`、`<AvatarGroup>` | `nsh_base::avatar()`、`avatar_group()` | 一個人的圖片，或在載入中或載入失敗時的替代內容，以及顯示前幾個的一排頭像 | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | 具有各種狀態與角色的可按壓控制項 | [Button](./button.md) |
| `<Carousel>` 及其組成部分 | `nsh_base::carousel()`、`carousel_content()`、... | 一次顯示一張的投影片，以原生方式滑動，附有上一張／下一張、分頁指示、按鍵操作與無縫循環 | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | 帶有指示器的已勾選、未勾選或不確定狀態控制項 | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | 內容可展開與收合的區域 | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | 命令面板：搜尋欄位搭配以原生方式篩選的命令、虛擬化清單，以及 Cmd+K 面板的按鍵操作 | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | 列與欄數量不限的表格，可選取、可排序，欄位可調整大小與移動 | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | 將其子元素顯示在其他所有內容之上 | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | 兩段文字之間或一個 patch 的差異，可分割或合併顯示 | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | 由使用者自行安排的工作區，包含分割區、分頁群組與邊緣停駐區 | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | 具有語法醒目提示、多個插入點、摺疊與搜尋功能的程式碼編輯器 | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | 當指標停留在觸發元素上時，顯示其所指內容的預覽 | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | 原生文字輸入（UITextField 或 UITextView / EditText） | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | 可按壓以開啟頁面、網站或 App 路由的目標 | [Link](./link.md) |
| `<Menu>`、`<ContextMenu>`、`<MenuItem>`、`<MenuSeparator>`、`<Submenu>` | `nsh_base::menu()`、... | 選單：在桌面平台上是附有階層式子選單的彈出視窗，在手機上是 sheet | [Menu](./menu.md) |
| `<NavStack>`、`<NavPage>` | `nsh_base::nav_stack()`、`nsh_base::nav_page()` | 原生導覽：一疊頁面，搭配平台的標頭與返回手勢 | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | 在欄位中輸入或以按鈕與按鍵逐步調整的數字 | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | 固定位數的一次性驗證碼，可輸入、貼上或自動填入各個儲存格 | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | 一組內容的頁碼：上一頁、目前頁面周圍的頁碼、省略號與下一頁 | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | 項目中包含項目，可展開與收合，可選取其中一個：已虛擬化，為鍵盤焦點的單一停駐點 | [Tree](./tree.md) |
| `<Plot>`、`<Line>`、`<Area>`、`<Bar>`、`<Grid>`、`<Pie>`、`<Arc>`（`nsh/base/plot`） | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | 圖表的外框與其標記，依 App 的資料列以原生方式繪製 | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | 錨定於觸發元素、顯示在其他所有內容之上的內容 | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | 進度列：顯示任務完成了多少，或表示任務正在進行中 | [Progress](./progress.md) |
| `<Radio>`、`<RadioGroup>` | `nsh_base::radio()`、`radio_group()` | 使用者從一組選項中擇一的單一選項，以及該組選項 | [Radio](./radio.md) |
| `<ResizablePanelGroup>`、`<ResizablePanel>` | `nsh_base::h_resizable()`、`resizable_panel()` | 並排或堆疊的面板，附有可調整其大小的控制把手 | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | 為 scroll view 或 list 提供 App 自有外觀的捲軸 | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | 從項目清單中選擇單一值，支援鍵盤、搜尋與分組 | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | 位於畫面邊緣、覆蓋在背景遮罩之上的面板 | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | 沿著軌道選取的單一值或兩個值構成的範圍 | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | 具有軌道與滑塊的開／關控制項 | [Switch](./switch.md) |
| `<Table>` 及其組成部分 | `nsh_base::table()`、`table_row()`、... | 由 App 自己的列與儲存格組成的表格，具備表格的角色 | [Table](./table.md) |
| `<Tab>`、`<Tabs>` | `nsh_base::tab()`、`tabs()` | 分頁列中的單一分頁，以及分頁列本身 | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | 以文字與 view 顯示 Markdown 或 HTML 文件 | [TextView](./text-view.md) |
| `<Toast>`、`<ToastStack>` | `nsh_base::toast()`、`toast_stack()` | toast 的語意根節點；從邊緣以圖層方式排版的 toast | [Toast](./toast.md) |
| `<Toggle>`、`<ToggleGroup>` | `nsh_base::toggle()`、`toggle_group()` | 可開啟或關閉的按鈕，以及由這類按鈕組成的工具列 | [Toggle](./toggle.md) |
| `<Toolbar>`、`<ToolbarGroup>`、`<ToolbarSeparator>` | `nsh_base::toolbar()`、`toolbar_group()`、`toolbar_separator()` | 由按鈕、toggle 與連結組成的工具列，為鍵盤焦點的單一停駐點 | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | 在懸停或手指按住時，顯示於觸發元素旁的提示 | [Tooltip](./tooltip.md) |

> [!NOTE]
> 字串只會在 `Text` 內繪製。`View` 的字串子元素不會建立原生 view，也不參與排版。

<a id="common-props"></a>

## 通用 props

每個基本元素都接受以下 props（TSX 中的 `CommonProps` 型別；Rust 中的 `Styled`、`Interactive` 與 `Accessible` trait）。各元素頁面只列出各自專屬的 props。Rust 欄位列出對應的 builder 方法。

<a id="styling"></a>

### 樣式

| Prop | Rust | 型別 | 說明 |
|---|---|---|---|
| `style` | 具型別的 `Styled` 方法；`.inline_style(style)` | `StyleProp<ViewStyle>`（`TextStyle` 用於 `<Text>` 與 `<Input>`，`ImageStyle` 用於 `<Image>`） | 行內樣式，或由左至右合併的樣式陣列（略過 falsy 項目；陣列可以巢狀，因此 `style={[base, props.style]}` 接受本身也是陣列的 `props.style`）。優先於 `class`。請參閱[樣式參考](../modules/style-reference.md)。 |
| `class` | 具型別的 `Styled` 方法（`.flex_row().gap_2().p_4()`） | `string` | 以原生方式解析的 Tailwind class（`"flex-row gap-2 p-4 dark:bg-zinc-900"`）。後面的 class 優先於前面的。請參閱 [Tailwind](../docs/tailwind.md)。 |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | 在其值為 truthy 時套用的 class（`{ "opacity-50": busy() }`）。 |
| `disabled` | `.disabled(..)` | `boolean` | 忽略按壓（也不會有按壓回饋），套用 `disabled:` 樣式，停用輸入欄位等控制項，並讓螢幕閱讀器唸出其已停用（`accessibilityState.disabled`）。 |

<a id="presses-and-feedback"></a>

### 按壓與回饋

按壓處理在原生端執行：平台辨識按壓並套用 App 的按壓樣式，App 的程式碼只會在事後收到通知。只有最內層的可按壓 view 會回應；在 scroll view 內，按下時會等待約 130 毫秒，讓捲動能先開始。

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | 點擊在 view 內結束。 |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | 手指持續按住了 `delayLongPress`。 |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | 手指按在 view 上。 |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | 手指抬起或離開。 |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | 按壓成為長按之前的毫秒數。 |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | 將觸控區域擴大到邊界之外，單位為 point。 |

`PressEvent` 是 `{ position, pagePosition, modifiers, clickCount }`：指標在 view 內以及在其根 view 中的位置（`Point`），按壓開始時按住的修飾鍵，以及連續點擊的次數（雙擊為 2）。若平台未回報指標，則為 view 的原點、無按鍵、點擊一次。

樣式鍵 `pointerEvents`（Rust 中為 `.pointer_events(PointerEvents::BoxNone)`，class 為 `pointer-events-*`）決定該 view 及其內部的 view 接收哪些觸控：`"none"` 兩者皆不接收（其內設定 `"auto"` 的 view 會重新接收），`"box-none"` 只有其內部的 view 接收，`"box-only"` 只有該 view 本身接收（[觸控與手勢](../docs/touch-and-gestures.md#pointerevents)）。

按壓回饋由 App 決定：`activeStyle`（或 `active:` class，Rust 中為 `.active(..)`）在 view 被按下時套用，以原生方式執行，不需往返 App 的程式碼（見下文）。

<a id="state-styles"></a>

### 狀態樣式

當 view 處於某個狀態時，以原生方式套用在其自身樣式之上的樣式。每一項都是 Tailwind variant 的物件形式。較後面的狀態優先（selected、checked 與 indeterminate，其次是 hover、focus、active）；`disabledStyle` 優先於全部，而其他樣式在 view 停用時不會套用。每一項都接受該元素自己的樣式：`<Text>` 上用 `TextStyle`，`<Input>` 上用 `InputStyle`，`<Image>` 上用 `ImageStyle`，其他元素用 `ViewStyle`。

| Prop | Rust | Class variant | 套用時機 |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | 被按下時。 |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | 指標位於 view 上方時。 |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | view 具有焦點時。 |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | view 或其內部的 view 具有焦點時（`Overlay` 的內容視為位於它所在的 view 內）。 |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | 當 `disabled` 時。 |
| `checkedStyle` | `.checked(\|s\| ..)`、`.checked_style(style)` | `checked:` | 當 `accessibilityState.checked` 為 `true` 時（checkbox、switch、radio；`"mixed"` 不算已勾選）。 |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`、`.indeterminate_style(style)` | `indeterminate:` | 當 `accessibilityState.checked` 為 `"mixed"` 時（既非已勾選也非未勾選的 checkbox）。 |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | 當 `accessibilityState.selected` 為 `true` 時（已選取的 `Button`、分頁）。 |
| `expandedStyle` | `.expanded(\|s\| ..)`、`.expanded_style(style)` | `aria-expanded:` | 當 `accessibilityState.expanded` 為 `true` 時（`Popover` 或 `Menu` 的觸發元素，在其彈出內容開啟期間）。 |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`、`.pressed_style(style)` | `aria-pressed:` | 當 `accessibilityState.pressed` 為 `true` 時（處於開啟狀態的 toggle 按鈕；`"mixed"` 不算被按下）。不是 `activeStyle`，後者指正在進行的按壓。 |

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

應用程式可以得知滑鼠進入檢視、在檢視上移動以及離開檢視：支援 macOS、Windows、Linux、GPUI 後端和桌面瀏覽器，在 iOS 上支援 iPad 的指標或 Mac 的滑鼠，在 Android 上支援滑鼠或觸控筆。懸停樣式（`hover:`、`.hover(..)`）會在相同的平台上為被懸停的檢視設定樣式。

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | 滑鼠進入了該檢視或其內部的檢視（對應 DOM 的 `mouseenter`）。 |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | 滑鼠在該檢視（或其內部的檢視）上移動，無論是否按住按鈕；或是在滑鼠未按下任何按鈕且停留於其上時，按下或放開了修飾鍵（對應 DOM 的 `mousemove`）。 |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | 滑鼠離開了該檢視及其內部的檢視，或離開了視窗；`e` 是滑鼠最後所在的位置（對應 DOM 的 `mouseleave`）。 |

與 CSS 的 `:hover` 和 DOM 的 `mouseenter` 相同，只要滑鼠位於檢視上或其內部的任何檢視上，該檢視就視為被懸停，因此滑鼠下方檢視周圍的檢視也會收到 `onMouseEnter`（由外而內；`onMouseLeave` 則由內而外）。這些事件是事後才送達的，且不會在觸控時發生。若檢視從滑鼠下方被移除，它會收到 `onMouseLeave`，在 Linux 和 Windows 上則是在下一次滑鼠移動時。

`MouseEvent` 會說明滑鼠的位置，與 GPUI 的 `MouseMoveEvent` 相同：`position` 是在該檢視中的位置（以點為單位的 `Point`，已還原其變換），`pagePosition` 是在所屬根檢視中的位置（與觸控所提供的相同），`modifiers` 是按住的修飾鍵（`control`、`alt`、`shift`、`platform`：在 Apple 平台上為 Command，其他平台為 Windows 鍵），而 `pressedButton` 是按住的按鈕（`"left"`、`"right"`、`"middle"`、`"back"` 或 `"forward"`，即 GPUI 的 `MouseButton`），或為 `null`；在 Rust 中則是 `position`、`page_position`、`modifiers` 和 `pressed_button`。在桌面平台和網頁上，拖曳同時也是一種觸控（`onTouchMove`，即回應者），其移動會以設定好的 `pressedButton` 傳到 `onMouseMove`：只需跟隨懸停的回饋應略過這些事件；在 iOS 和 Android 上，懸停回報的是未按下任何按鈕的指標。移動事件每個影格最多送出一次，且為最新的一次，並且一定在緊接其後的 `onMouseLeave` 之前送出，因此處理函式可以在每次移動時重新繪製：

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

`tooltip` 可為任何元素加上提示，在桌面平台（macOS、Windows、Linux、GPUI 後端和桌面瀏覽器）上，指標停留在元素上半秒後，提示便會顯示在元素上方，直到指標離開或按下該元素為止。手機和平板不會顯示。提示不會攔截指標或按壓，因此元素的運作方式與沒有提示時完全相同。

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | 提示內容，是由應用程式設定樣式的元素：`nsh/base` 的 [`Tooltip`](tooltip.md) 本身就是工具提示，具有自己的位置、延遲和事件；其他任何元素則依原樣顯示。 |

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

`Tooltip` 會自行設定外觀、位置、延遲和事件，就像 GPUI 的 `.tooltip(..)` 所接受的那樣。擁有許多工具提示的應用程式，可以自行維護一個小型元件，把文字包在其 `Tooltip` 中。

<a id="context-menus"></a>

### 內容選單

`onContextMenu` 會告訴檢視：次要按鈕在其上被按下了，例如按一下滑鼠右鍵、在 macOS 上按住 Control 並點擊、在觸控板上用兩指點擊、iPad 指標的次要點擊；在瀏覽器中還包括鍵盤的選單鍵。請在此開啟應用程式自己的選單；在 TSX 中，[`Menu.popup`](../modules/nsh-desktop.md) 會顯示系統的選單：

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

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | 次要按鈕在該檢視或其內部的檢視上被按下。 |

`ContextMenuEvent` 包含檢視中的 `position`、其根檢視中的 `pagePosition`（`Menu.popup` 用它來放置選單：`Menu.popup(items, e.pagePosition)`）以及 `modifiers`；在 Rust 中則是 `position`、`page_position` 和 `modifiers`。從指標下方的檢視向外，最近的一個有監聽的檢視會收到此事件。若在該檢視之內有更近的文字輸入框，或帶有編輯選單的可選取文字（Windows、GPUI 後端、瀏覽器），則會改為顯示它自己的選單。平台是在按鈕按下的當下，依據已掛載的內容來決定這一點，因此處理函式是事後才被通知，無需取消任何東西。`disabled` 的檢視會把點擊交給其周圍最近的已啟用監聽者。在觸控螢幕上，長按會開啟選單：請以同一個函式處理 `onLongPress`。

<a id="keyboard-focus"></a>

### 鍵盤焦點

在 macOS 和網頁上，Tab 鍵會依樹狀順序在各個停駐點之間移動鍵盤焦點：包括輸入框、接受按壓的檢視，以及每個 `focusable` 檢視。焦點樣式（`focus:`、`.focus(..)`）會為取得焦點的檢視設定樣式，若該檢視接受按壓，Return 或 Space 會按下它。點擊會按下檢視但不會使其取得焦點，因此焦點樣式只會在鍵盤焦點時顯示。

焦點與按壓是分開的。在取得焦點時接收按鍵的檢視（圖表、滑桿、以方向鍵移動選取項目的清單）會設定 `focusable`，並在取得焦點時綁定其按鍵（搭配 [`keymap`](../modules/nsh.md#keymap) 使用 `onFocus` / `onBlur`）；對它的按壓仍會傳到其周圍可按壓的檢視，例如會開啟頁面的卡片。

ref 的 `focus()` 會像 Tab 一樣把鍵盤焦點移到某個停駐點（其焦點樣式會顯示，且 `onFocus` 會觸發），例如把焦點還給已關閉的彈出視窗的觸發元素，而 `blur()` 則會移除焦點。

周圍的檢視可以在焦點位於它或其內部任何檢視時，以 `focus-within:`（`focusWithinStyle`、`.focus_within(..)`）設定自身樣式：例如圍繞著正在編輯的輸入框的欄位外框，或其中一個按鈕取得焦點時的工具列。`Overlay` 的內容無論顯示在何處，都位於覆蓋層所在的檢視之內，因此彈出視窗會被視為持有其觸發元素的檢視的一部分。在 Rust 中，元件可透過其 ref 的 `on_focus_in(..)` 和 `on_focus_out(..)` 得知焦點進入和離開某個元素：在其內部的檢視之間移動則兩者皆不算。

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | 接受按壓的檢視為 `true` | 該檢視是否為 Tab 的停駐點。`true` 會使任何檢視成為停駐點，無論它是接受按壓還是把按壓留給周圍的檢視；`false` 則讓可按壓的檢視只供指標操作（例如關閉彈出視窗的背景遮罩、以方向鍵在其間移動的列）。 |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab（或 `focus()`）使該檢視取得了鍵盤焦點。 |
| `onBlur` | `.on_blur(..)` | `() => void` | | 鍵盤焦點離開了該檢視。 |

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

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | 每次版面配置造成變化後，`bounds` 是檢視相對於其父層的框架，`{ origin, size }`。 |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | 元素的 ref（參閱 [ref 方法](#ref-methods)）：`ViewRef`，或在其之上的元素自身型別。`ref={el}` 會指派給變數，`ref={fn}` 會呼叫函式。 |
| `nativeID` | `.native_id(id)` | `string` | 為檢視命名，供其他元素參照，例如輸入框所參照的 `InputAccessoryView`。 |
| `testID` | `.test_id(id)` | `string` | 供 UI 測試使用的識別碼（在 Android 上為檢視的資源 id）。 |
| `key` | `.key(key)` | `string` | 元素在其同層元素之間的識別。 |

<a id="gestures-driving-animated-values"></a>

### 驅動動畫值的手勢

這些屬性會把手勢綁定到在 UI 執行緒上移動的[原生動畫值](../modules/nsh.md#animation)，應用程式的程式碼無需在每個影格進行任何處理。請參閱[觸控與手勢](../docs/touch-and-gestures.md)。

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | 拖曳會驅動這些值（以點為單位）。 |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | 拖曳開始。 |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | 拖曳結束，並帶有放開時的速度（例如用來啟動 `decay`）。 |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | 雙指縮放會驅動 `scale`。 |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | 縮放開始 / 結束。 |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | 雙指旋轉會驅動 `angle`（以度為單位）。 |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | 旋轉開始 / 結束。 |

`PanEvent` 是 `{ cancelled, translation, velocity, value? }`（在 Rust 中為 `cancelled`、`translation`、`velocity_x`、`velocity_y`、`value_x`、`value_y`）：包含系統是否取消了拖曳、自開始以來的位移、以每秒點數為單位的速度（`Point`），以及當下已綁定的值，`{ x?, y? }` 對應 `pan` 所綁定的軸（拖曳可以在動畫進行中抓住某個值）。

<a id="raw-touches-and-the-responder-system"></a>

### 原始觸控與回應者系統

對於上述屬性未涵蓋的手勢，每個元素都支援觸控與回應者屬性：`onTouchStart`、`onTouchMove`、`onTouchEnd`、`onTouchCancel`（以及它們的 `…Capture` 形式）、`onStartShouldSetResponder`、`onMoveShouldSetResponder`（以及 `…Capture`）、`onResponderGrant`、`onResponderReject`、`onResponderStart`、`onResponderMove`、`onResponderEnd`、`onResponderRelease`、`onResponderTerminate` 和 `onResponderTerminationRequest`。每個處理函式都會收到一個 `GestureResponderEvent`
(`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...)。
從 `onResponderGrant` 回傳 `true` 可防止原生捲動檢視攔截這些觸控。`panActivation`（`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`）只有在平台啟動其平移手勢之後，才會讓該檢視成為回應者，因此捲動檢視內的拖曳會把另一個軸留給它們（[觸控與手勢](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)）。[`PanResponder`](../modules/nsh.md#panresponder) 中的 `PanResponder` 便是以它們為基礎。在 Rust 中，`.on_touch(..)` 會接收每一次觸控（`TouchEvent`），`.claim_touches(..)` 決定檢視何時接管它們，而 `.on_responder_grant(..)`、`.on_responder_move(..)`、`.on_responder_release(..)` 與其他處理函式則跟隨回應者。

<a id="accessibility"></a>

### 無障礙

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | 該檢視對輔助技術而言是單一元素；其子項不會被個別公開。 |
| `accessibilityLabel` | `.label(..)` | `string` | 螢幕閱讀器所朗讀的內容。沒有標籤的檢視會朗讀其文字。 |
| `accessibilityHint` | `.hint(..)` | `string` | 啟用該元素會發生什麼事。 |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | 該元素是什麼（`"button"`、`"header"`、`"link"`、`"switch"` 等）。 |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | 輔助技術所回報的狀態（`checked` 和 `pressed` 可以是 `"mixed"`；`current` 是 `true` 或 `"page"`、`"step"`、`"location"`、`"date"`、`"time"`）。 |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | 標題的層級（1 為最上層）、樹狀項目的深度（1 為最上層）。 |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | 範圍型或文字型元素的值。 |
| `accessibilityElementsHidden` | | `boolean` | 對輔助技術隱藏該檢視及其子樹。 |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | 該檢視是否被公開。 |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | 提供給輔助技術的自訂動作。 |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | 使用者觸發了 `accessibilityActions` 其中之一。 |

請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-only-props"></a>

### 僅限特定平台的屬性

僅存在於單一平台的屬性，在 TSX 中會放在以該平台命名的物件內，因此共用屬性在各處都保持不變。只有目前平台的物件會被送出，其他的會被忽略。Rust 建構器則以方法的形式接受這些屬性，並在其對應的平台上生效。

| 屬性 | 說明 |
|---|---|
| `ios={{…}}` | iOS 和 Mac Catalyst。`<Input>`、`Dialog` 和 `WebView` 會加入各自的鍵。 |
| `android={{…}}` | Android。每個元素都支援 `ripple`、`elevation` 和 `accessibilityLiveRegion`（見下方）。 |
| `desktop={{…}}` | 桌面平台和桌面瀏覽器；在行動平台上會被忽略。每個元素都支援 `windowDrag`（見下方）。 |
| `web={{…}}` | 瀏覽器；在其他地方會被忽略。 |

| `android` 鍵 | Rust | 型別 | 說明 |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | 按下時的 Material 波紋效果。 |
| `elevation` | `.elevation(px(2.0))` | `number` | Material 陰影（以點為單位），依檢視的形狀而定。 |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | 檢視的變更如何向 TalkBack 播報。 |

| `desktop` 鍵 | Rust | 型別 | 說明 |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | 按下該檢視會拖動視窗，如同標題列一樣；`false` 可讓可拖動檢視的某個部分保持可點擊。請參閱[自訂標題列](../modules/nsh-desktop.md#a-title-bar-of-your-own)。 |

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

請參閱[平台專屬程式碼](../docs/platform-specific.md)。
<a id="ref-methods"></a>

## Ref 方法

在 TSX 中，`ref` 會接收元素的 ref，其型別就是該元素自身的型別：`ViewRef`（`focus`、`blur`、`measure`）用於 `View`、`Text`、`Image`、`Canvas`、`Overlay` 和 `Shader`，其他元素則使用建立在 `ViewRef` 之上、帶有該元素方法的型別：`InputRef`（`Input`）、`ScrollRef`（`Scroll`）、`ListRef`（`List`）、`WebViewRef`（`WebView`）、`VideoRef`（`Video`）和 `NativeComponentRef`（原生元件）。在 Rust 中，`element_ref()` 會建立一個 `ElementRef` handle，由 `.element_ref(&handle)` 負責附加。這些方法會向原生檢視傳送命令，並與同一輪中先前所做的變更依序執行。各元素頁面會說明哪些方法適用於該元素。請以元素自身的型別來標註 ref 變數（`<Input>` 使用 `let field!: InputRef`）：型別標註為 `ViewRef` 的變數，無法用於 ref 帶有專屬方法的元素。

| 方法 | Rust | Ref | 說明 |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | 讓 `<Input>` 取得焦點（顯示鍵盤），或讓可接收點按的檢視取得／取消鍵盤焦點。 |
| `measure()` | `measure()` | `ViewRef` | [檢視所在的位置](../docs/touch-and-gestures.md#where-a-view-is-measure)。 |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | 以 UTF-16 單位選取 `start..end`；若沒有 `end`，則為插入點。 |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`、`ListRef` | 捲動到指定的位移。 |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef`（可縮放的 `<Scroll>`） | 以內容中的某個點為中心縮放到 `scale`。 |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | 沿著清單的軸向捲動到指定的位移。 |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | 將項目捲動到可見範圍內。 |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`、`ListRef` | 捲動到內容的結尾。 |
| `reload()`、`goBack()`、`goForward()`、`stopLoading()`、`injectJavaScript(script)`、`postMessage(data)` | `reload()`、`go_back()`、`go_forward()`、`stop_loading()`、`inject_java_script(..)`、`post_message(..)` | `WebViewRef` | 控制頁面。 |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | 跳到指定的時間。 |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | 呼叫已註冊原生元件的命令（[`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)）。 |

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

## 為什麼處理常式永遠不會阻塞 UI

主執行緒從不等待應用程式的程式碼。當系統需要立即得到答覆時（例如這段文字可以變更嗎、返回按鈕可以彈出頁面嗎、這個 sheet 可以關閉嗎），NSH 會根據事先設定好的屬性（`maxLength`、`popOnBack`、`closeOnSwipe`……）在原生端直接回答，事件則在之後才傳遞給應用程式。這就是為什麼這類行為是屬性，而不是處理常式的回傳值。
