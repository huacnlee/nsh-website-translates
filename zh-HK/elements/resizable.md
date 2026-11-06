---
title: "可調整大小"
description: "ResizablePanelGroup 和 ResizablePanel:面板可並排或上下堆疊,每兩個面板之間設有拖曳把手,讓使用者拖曳以分配可用空間。ResizablePanelGroup 負責處理拖曳操作、面板的尺寸限制、調整大小的游標,以及把手供螢幕閱讀器使用的角色;而各面板的尺寸、把手的外觀和面板的內容則由應用程式自行決定。"
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---


# 可調整大小

可調整大小的群組會將面板並排或上下堆疊排列,並在每兩個面板之間的邊界放置一個把手:例如側邊欄與文件並排、編輯器在主控台之上、清單與其詳情並排。使用者拖曳把手即可移動邊界,而每個面板都會保持在應用程式容許的尺寸範圍內。`ResizablePanelGroup` 負責行為:拖曳(在原生層逐幀執行)、空間如何分配、調整大小的游標,以及方便手指操作的較大觸控區域。外觀則由應用程式決定:把手是一條沒有線條、顏色或握把的區帶,其上繪製的是應用程式自己的指示器;面板亦是應用程式的視圖。

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` 和 `ResizablePanel` 來自 [`nsh/base`](../modules/nsh-base.md),即 Rust 中的 `nsh-base` crate。面板是群組的直接子項。在 Rust 中,`h_resizable()` 和 `v_resizable()` 分別建立沿各軸排列的群組(`resizable_panel_group().axis(..)` 以值指定軸向),`resizable_panel()` 建立面板,每個屬性有對應的 setter,每個事件有對應的監聽器,另有具型別的樣式方法,以及用於放置內容的 `.child(..)`;`.size_range(min..max)` 可同時設定兩個限制。

<a id="sizes"></a>

## 尺寸

面板的 `size` 是它想要的尺寸,並限制在其 `minSize` 和 `maxSize` 之內。沒有設定尺寸的面板會平均分配剩餘空間,不論其內容為何;當每個面板都有尺寸時,剩餘空間則按尺寸比例分配。使用者拖曳把手時,群組在核心層於面板之間移動空間,過程中不涉及 JS:

- 放大把手之前的面板時,會從其後的面板取得空間,由最近的開始,每個最多縮減至其 `minSize`,並略過 `fixed` 的面板。
- 將其縮小至低於其 `minSize` 時,會從其前面的面板取得空間。
- 沒有面板會超出其 `maxSize`,而面板的總和亦不會超過群組。

當拖曳結束並改變了尺寸,群組會按面板的排列次序回報每個可見面板的尺寸(群組上的 `onResize`),而尺寸有變的每個面板亦會回報自己的尺寸(面板上的 `onResize`)。被拖曳移動過的面板會保留使用者設定的尺寸,直至應用程式傳入新的 `size`;應用程式可將回報的尺寸以 `size` 傳回,令這些尺寸在群組的生命週期之後仍得以保留,因此從[儲存空間](../modules/nsh.md#storage)還原的版面會以使用者上次離開時的尺寸開啟。只有拖曳和螢幕閱讀器的調整步驟才會回報:視窗大小改變,或面板顯示或隱藏,都不會回報。

當群組變大或變小(視窗被調整大小)時,有尺寸的面板會保持其尺寸,沒有尺寸的面板則承擔差額。當群組小於各尺寸之和時,面板會縮小,但 `fixed` 的面板(例如側邊欄、檢視器)除外,待空間恢復後,面板便會回復至原有尺寸。設有 `visible={false}` 的面板不佔空間:其他面板會分享其空間,而它再次顯示時會回復至原有尺寸。

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## 把手

每兩個可見面板之間的邊界都有一個把手:這是一條橫跨軸向、厚 9 點、以邊界為中心的區帶,並帶有該軸向的調整大小游標。在觸控螢幕上,其觸控區域向兩側各延伸 10 點,因此即使只有一點粗的線條,也容易抓取。把手是一個 `group`:其上繪製的是應用程式的指示器,以 `handleClass` / `handleStyle` 設定樣式:橫跨軸向 1 點,長度為邊界的全長,因此單用 `bg-border` 在任何軸向上都是一條細線,而 `w-[3px]` 或 `h-[3px]` 會令它變粗,其 `group-hover:` 和 `group-active:` 類別會跟隨指標在區帶上的位置以及按壓或拖曳狀態。若需要線條以外的內容(圓點握把、圖示),`renderHandle` 會繪製指示器的內容,並獲告知把手的 `index`、`axis` 和 `state`;它會在狀態改變時重新繪製,每次拖曳只會有數次,不會在每次移動時都重繪。帶動畫的握把是把手的拇指(`handleThumbClass` / `handleThumbStyle`):它是置中於線條上的單一視圖,在垂直線上直立繪製,在水平線上則轉四分之一圈,因此同一個類別可同時用於兩個軸向,並由 `group-hover:` 和 `group-active:` 類別顯示及過渡;在整個拖曳過程中,不論指標去到哪裏,把手都會保持按下狀態。

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` 會令每個把手固定不動(鎖定的版面)。

<a id="props"></a>

## 屬性

### ResizablePanelGroup

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `axis` | `h_resizable()`、`v_resizable()`、`.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 並排(把手向左右拖曳)或堆疊(向上下拖曳)。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不可拖曳:把手保持原位。 |
| `handleClass`、`handleStyle` | `.handle_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的指示器,位於把手區帶的邊界上:除非另有指定(`w-[3px]`、`h-[3px]`),否則橫跨軸向 1 點,長度為邊界全長;`group-hover:` 和 `group-active:` 跟隨區帶。 |
| `handleThumbClass`、`handleThumbStyle` | `.handle_thumb_class(..)`、`.handle_thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的拇指:置中於線條上的握把,如在垂直線上般直立繪製,在水平線上則轉四分之一圈,因此同一個類別可同時用於兩個軸向。在把手被懸停、按下和拖曳期間,它都是同一個視圖,因此 `group-hover:` 和 `group-active:` 類別可為它加上過渡效果(`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`)。 |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | 無 | 每個指示器內的內容,當把手的 `state` 改變時重新繪製。 |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為每個把手朗讀的內容:它調整的是什麼。螢幕閱讀器每次調整 10 點。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個 `ResizablePanel`,即其直接子項。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | `size-full` | 群組本身;除非其類別另有指定,否則會填滿其父項。 |

### ResizablePanel

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | 無 | 它沿群組軸向想要的長度(以點為單位),限制在 `minSize` 和 `maxSize` 之內;傳入新值會令其重新調整大小。沒有設定時,它會分享剩餘空間。 |
| `minSize` | `.min_size(..)`、`.size_range(..)` | `number` | `100` | 它的最小尺寸。 |
| `maxSize` | `.max_size(..)`、`.size_range(..)` | `number` | 無限制 | 它的最大尺寸。 |
| `fixed` | `.fixed(..)` | `boolean` | `false` | 當群組小於各面板之和時保持其尺寸;拖曳它自己的把手仍可調整其大小。它接受 `size`。 |
| `visible` | `.visible(..)` | `boolean` | `true` | 隱藏時不佔空間,其他面板會分享其空間。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 它的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 面板本身的表面。其沿軸向的尺寸由群組決定。 |

### ResizeHandleContext

| 欄位 | 類型 | 說明 |
|---|---|---|
| `index` | `number` | 第 `index` 個可見面板之後的邊界。 |
| `axis` | `"horizontal" \| "vertical"` | 它調整大小所沿的軸向。 |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | 指標或手指隨它移動了多遠。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onResize`(`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | 拖曳結束並移動了把手,或螢幕閱讀器調整了把手:`sizes`,即每個可見面板的尺寸,按排列次序(由左至右、由上至下)。 |
| `onResize`(`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | 拖曳結束並改變了此面板的尺寸:`size`,即新的尺寸,可傳回作為其 `size`。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 群組 | | `ResizablePanelGroup` 的 `class`、`style` | |
| 面板 | 群組內 | `ResizablePanel` 的 `class`、`style` | |
| 把手的指示器 | 把手的區帶內,位於邊界上 | `handleClass`、`handleStyle`、`renderHandle` | 指標下為 `group-hover:`,按壓或拖曳期間為 `group-active:`;在 `renderHandle` 中為 `state` |
| 把手的拇指 | 置中於把手的線條上 | `handleThumbClass`、`handleThumbStyle` | `group-hover:`、`group-active:`(按下直至拖曳結束) |

<a id="accessibility"></a>

## 無障礙

- 每個把手對螢幕閱讀器而言都是可調整的元素,以 `handleAccessibilityLabel` 作為標籤。其值是它之前那個面板的尺寸,並限制在該面板的 `minSize` 和 `maxSize` 之內。
- 使用 VoiceOver 在把手上向上或向下撥動,或使用 TalkBack 的音量鍵,會將它移動 10 點,效果與拖曳相同;群組會以 `onResize` 回報。`disabled` 群組的把手會保持原位。
- 面板的內容由應用程式負責,其朗讀方式與其他地方一樣。

有關標籤、角色和宣告的一般說明,請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 桌面平台(macOS、Windows、Linux、GPUI)和網頁:指標移到把手上時會顯示欄或列的調整大小游標,以滑鼠或觸控板拖曳可移動邊界。
- iOS、Android 和 Mac Catalyst:以手指拖曳把手,觸控區域在區帶兩側各闊 10 點。
- 在由右至左的版面中,面板及其尺寸會跟隨版面的次序。
- 每個平台都會繪製應用程式所設定樣式的內容:指示器和面板。
- [Dock](./dock.md) 的分割區是可調整大小的群組:它們的調整方式相同。
