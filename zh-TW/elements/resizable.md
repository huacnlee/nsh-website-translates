---
title: "Resizable"
description: "ResizablePanelGroup 與 ResizablePanel:面板可並排或堆疊,每兩個面板之間有一個控制把手,使用者可拖曳來分配空間。群組負責處理拖曳、面板的限制、調整大小的游標,以及控制把手供螢幕閱讀器使用的角色;而尺寸、控制把手的外觀與面板的內容則由應用程式決定。"
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

可調整大小群組（resizable group）會將面板並排或堆疊排列，並在每兩個相鄰面板的邊界放置一個把手：側邊欄與文件並排、編輯器位於主控台上方、清單與其詳細內容並排。使用者拖曳把手即可移動邊界，每個面板都會維持在應用程式所允許的尺寸範圍內。`ResizablePanelGroup` 負責行為：拖曳（逐幀以原生方式執行）、空間如何分配、調整大小的游標，以及供手指操作的較大觸控區域。外觀則由應用程式決定：把手是一條沒有自帶線條、顏色或抓點的帶狀區域，其所繪製的內容是應用程式的指示器；面板則是應用程式的檢視。

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

`ResizablePanelGroup` 與 `ResizablePanel` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。面板是群組的直接子元素。在 Rust 中，`h_resizable()` 與 `v_resizable()` 分別建立沿各軸排列的群組（`resizable_panel_group().axis(..)` 以值指定軸向），`resizable_panel()` 則建立面板，每個屬性都有對應的 setter、每個事件都有對應的 listener，並提供具型別的樣式方法，以及用於內容的 `.child(..)`；`.size_range(min..max)` 會同時設定兩個限制。

<a id="sizes"></a>

## 尺寸

面板的 `size` 是它希望取得的尺寸，並受其 `minSize` 與 `maxSize` 限制。沒有設定尺寸的面板會平均分配剩餘空間，與其內容無關；當每個面板都有尺寸時，剩餘空間則按其比例分配。使用者拖曳把手時，群組會在核心中於面板之間移動空間，過程中不經過 JS：

- 放大把手前方的面板時，會從其後方的面板取得空間，由最近的開始，每個面板最多縮小至其 `minSize`，並略過 `fixed` 的面板。
- 將其縮小到低於其 `minSize` 時，會從其前方的面板取得空間。
- 沒有面板會超出其 `maxSize`，且面板的總和永遠不會超過群組的大小。

當拖曳結束且尺寸有所改變時，群組會依版面配置順序回報每個可見面板的尺寸（群組上的 `onResize`），而尺寸有變動的每個面板也會回報自己的尺寸（面板上的 `onResize`）。被拖曳移動過的面板會保留使用者設定的尺寸，直到應用程式傳入新的 `size`；應用程式可將回報的尺寸以 `size` 傳回，使這些尺寸在群組的生命週期之後仍得以保留，因此從[儲存空間](../modules/nsh.md#storage)還原的版面配置會以使用者離開時的尺寸開啟。只有拖曳與螢幕閱讀器的步進調整會觸發回報：視窗大小改變，或面板顯示或隱藏，則不會回報任何內容。

當群組變大或變小（視窗大小改變）時，有尺寸的面板會維持其尺寸，沒有尺寸的面板則吸收差額。當群組小到容納不下這些尺寸時，面板會縮小，但 `fixed` 的面板（側邊欄、檢閱面板）除外，待空間恢復後，面板會回到原本的尺寸。設有 `visible={false}` 的面板不佔用空間：其他面板會分享它的空間，而當它再次顯示時，會以原本的尺寸回來。

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

每兩個可見面板之間的邊界都有一個把手：這是一條垂直於軸向、厚度為 9 點、置中於邊界的帶狀區域，並帶有該軸向的調整大小游標。在觸控螢幕上，其觸控區域會向兩側各延伸 10 點，因此即使只有一點寬的線條也容易抓取。把手是一個 `group`：其所繪製的內容是應用程式的指示器，以 `handleClass` / `handleStyle` 設定樣式：垂直於軸向為 1 點，長度為邊界的完整長度，因此單獨使用 `bg-border` 在任一軸向上都是一條細線，而 `w-[3px]` 或 `h-[3px]` 會使其變粗，其 `group-hover:` 與 `group-active:` 類別會跟隨指標在帶狀區域上的位置以及按下或拖曳的狀態。若需要線條以外的內容（一排圓點的抓點、圖示），`renderHandle` 會算繪指示器的內容，並接收把手的 `index`、`axis` 與 `state`；它會在狀態改變時重新繪製，每次拖曳只會發生數次，而不會在每次移動時都重繪。帶有動畫的抓點是把手的 thumb（`handleThumbClass` / `handleThumbStyle`）：這是一個置中於線條上的檢視，在垂直線上以直立方式繪製，在水平線上則旋轉四分之一圈，因此同一個類別即可適用於兩個軸向，並由 `group-hover:` 與 `group-active:` 類別顯示並進行轉場；在整個拖曳過程中，無論指標移到何處，把手都會保持按下狀態。

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

`disabled` 會讓每個把手保持在原位（鎖定的版面配置）。

<a id="props"></a>

## 屬性

### ResizablePanelGroup

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `axis` | `h_resizable()`、`v_resizable()`、`.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 並排（把手向左右拖曳）或堆疊（向上下拖曳）。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法拖曳：把手保持在原位。 |
| `handleClass`、`handleStyle` | `.handle_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的指示器，位於邊界上、把手的帶狀區域內：除非另有指定（`w-[3px]`、`h-[3px]`），否則垂直於軸向為 1 點，長度為邊界的完整長度；`group-hover:` 與 `group-active:` 會跟隨帶狀區域。 |
| `handleThumbClass`、`handleThumbStyle` | `.handle_thumb_class(..)`、`.handle_thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的 thumb：置中於線條上的抓點，如同在垂直線上般直立繪製，在水平線上則旋轉四分之一圈，因此同一個類別即可適用於兩個軸向。在把手被懸停、按下與拖曳期間，它始終是同一個檢視，因此 `group-hover:` 與 `group-active:` 類別會對其進行轉場（`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`）。 |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | 無 | 每個指示器內的內容，在把手的 `state` 改變時重新繪製。 |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為每個把手朗讀的內容：它所調整的對象。螢幕閱讀器每次調整 10 點。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個 `ResizablePanel`，即其直接子元素。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | `size-full` | 群組本身；除非其類別另有指定，否則會填滿其父元素。 |

### ResizablePanel

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | 無 | 它沿群組軸向所希望的長度（以點為單位），受 `minSize` 與 `maxSize` 限制；傳入新值會使其調整大小。未設定時，會分享剩餘空間。 |
| `minSize` | `.min_size(..)`、`.size_range(..)` | `number` | `100` | 最小可取得的尺寸。 |
| `maxSize` | `.max_size(..)`、`.size_range(..)` | `number` | 無限制 | 最大可取得的尺寸。 |
| `fixed` | `.fixed(..)` | `boolean` | `false` | 當群組小到容納不下這些面板時，維持其尺寸；拖曳它自己的把手仍會調整其大小。它接受一個 `size`。 |
| `visible` | `.visible(..)` | `boolean` | `true` | 隱藏時不佔用空間，其他面板會分享它的空間。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 其內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 面板本身的表面。其沿軸向的尺寸由群組決定。 |

### ResizeHandleContext

| 欄位 | 型別 | 說明 |
|---|---|---|
| `index` | `number` | 第 `index` 個可見面板之後的邊界。 |
| `axis` | `"horizontal" \| "vertical"` | 它沿其調整大小的軸向。 |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | 指標或手指隨它移動了多遠。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onResize`（`ResizablePanelGroup`） | `.on_resize(\|sizes: &Vec<Points>\| ..)` | 拖曳結束並移動了把手，或螢幕閱讀器調整了把手：`sizes`，即依版面配置順序（由左至右、由上至下）排列的每個可見面板的尺寸。 |
| `onResize`（`ResizablePanel`） | `.on_resize(\|size: &Points\| ..)` | 拖曳結束並改變了此面板的尺寸：`size`，即新的尺寸，可作為其 `size` 傳回。 |

<a id="parts"></a>

## 部件

| 部件 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 群組 | | `ResizablePanelGroup` 的 `class`、`style` | |
| 面板 | 群組內 | `ResizablePanel` 的 `class`、`style` | |
| 把手的指示器 | 把手的帶狀區域內，位於邊界上 | `handleClass`、`handleStyle`、`renderHandle` | 指標位於其上時為 `group-hover:`，按下或拖曳期間為 `group-active:`；`renderHandle` 中為 `state` |
| 把手的 thumb | 置中於把手的線條上 | `handleThumbClass`、`handleThumbStyle` | `group-hover:`、`group-active:`（保持按下直到拖曳結束） |

<a id="accessibility"></a>

## 無障礙

- 每個把手對螢幕閱讀器而言都是可調整的元素，並以 `handleAccessibilityLabel` 作為其標籤。其值為前一個面板的尺寸，介於該面板的 `minSize` 與 `maxSize` 之間。
- 在把手上以 VoiceOver 向上或向下滑動，或使用 TalkBack 的音量鍵，會使其移動 10 點，與拖曳相同；群組會以 `onResize` 回報。設為 `disabled` 的群組，其把手會保持在原位。
- 面板的內容屬於應用程式，其朗讀方式與其他任何地方相同。

關於標籤、角色與公告的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台注意事項

- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：指標移到把手上時會顯示欄或列的調整大小游標，以滑鼠或觸控板拖曳即可移動邊界。
- iOS、Android 與 Mac Catalyst：以手指拖曳把手，觸控區域比帶狀區域的兩側各寬 10 點。
- 在由右至左的版面配置中，面板及其尺寸會依版面配置的順序排列。
- 每個平台都會繪製應用程式所設定樣式的內容：指示器與面板。
- [Dock](./dock.md) 的分割區域就是可調整大小的群組：它們的調整方式相同。
