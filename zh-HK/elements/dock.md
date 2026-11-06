---
title: "Dock"
description: "DockArea：可停靠的工作區，包含分割區、分頁群組，以及位於左、右和底部邊緣的停靠區，其版面配置是由應用程式擁有的資料。DockArea 負責處理分頁的拖放、調整大小、停靠區、縮放和鎖定，在面板移動時保留各面板的內容，並可適應手機；外觀和面板的內容則由應用程式決定。"
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---


# Dock

停靠工作區是由使用者自行編排的工作空間：面板放在分頁群組中，群組可並排或上下堆疊分割，而左、右、下三邊的停靠欄可以開啟、關閉及調整大小。把分頁拖到另一個群組，就會加入該群組；拖到群組邊緣，就會分割該群組；面板移動時會保留其內容。`DockArea` 負責行為：分頁的拖放（以原生方式逐幀執行）、調整分割及停靠欄的大小、開啟和關閉停靠欄、縮放與鎖定。外觀則由應用程式決定：分頁、分頁列、拖曳把手、放置指示器及各面板的內容，都由應用程式渲染並設定樣式，工作區本身不繪製任何內容。

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` 及其接受的值來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 的 `nsh-base` crate（`nsh_base::dock_area()`，值在 `nsh_base::dock` 中）。在 Rust 中，由 `dock_area()` 建立，每個屬性有一個 setter，每個事件有一個監聽器，並提供具型別的樣式方法；`DockLayout` 以面板的 key 描述版面配置（`h_split()`、`v_split()`、`tabs()`、`.child(layout, size)`、`.panel(key)`）。

<a id="the-layout"></a>

## 版面配置

版面配置是一個值，即 `DockAreaLayout`：包含中央區域，以及左、右、下三邊各一個停靠欄，每個都是可選的。每個區域都是由兩種節點組成的樹：

| 節點 | 內容 | 欄位 |
|---|---|---|
| `{ type: "split" }` | 其他節點，並排（`axis: "horizontal"`）或上下堆疊（`"vertical"`） | `children`，以及 `sizes`：每個子節點沿軸向的長度（以點為單位），`null` 表示平分餘下空間 |
| `{ type: "tabs" }` | 面板（以 key 表示），一次只顯示一個 | `panels`（key，依分頁順序）、`activeIndex`（顯示中的一個，預設為 0） |

面板一定位於某個分頁群組中：只有一個面板的區域，就是只含一個分頁的群組。面板的 key 是應用程式為它指定的字串（`"files"`、文件的 id），而且每個 key 在整個版面配置中只能出現一次。停靠欄（`DockRegion`）包含它的樹（`layout`）、橫跨其邊緣的大小（`size`，預設為 200，最小為 100）、是否開啟（`open`，預設為 `true`），以及將其邊緣拖到小於最小尺寸時是否會關閉它（`collapsible`，預設為 `true`）。

每個節點都有 `id`。應用程式寫入的版面配置可以省略 id：工作區會自動指派，而它回報的每個版面配置都帶有 id。將回報的版面配置傳回去，可保留每個群組的身分，ref 的方法正是以此來指定群組。工作區也會整理收到的內容：空的群組或分割會被移除，只有一個子節點的分割會變成該子節點，位於同軸向分割內的分割會併入其父節點，`activeIndex` 會保持在有效範圍內，重複列出的 key 只保留第一個位置。它回報的版面配置一律採用這種標準形式。

版面配置由應用程式持有（`layout`）：使用者所做的每項更改（選取、拖動或關閉分頁，調整分割或停靠欄大小，開啟或關閉停靠欄）都會以完整的新版面配置回報（`onLayoutChange`），而工作區會顯示應用程式傳回的版面配置。應用程式透過傳入新值來自行更改版面配置，例如還原已儲存的版面配置，或執行重新編排工作空間的命令。沒有 `layout` 的工作區會自行維護版面配置，從 `defaultLayout` 開始，並仍會回報每項更改。

<a id="panels-content"></a>

## 面板內容

面板顯示的內容由應用程式決定：`renderPanel` 根據面板的 key 渲染內容（`panel.id`）。群組中的每個面板都會被配置位置，但只有顯示中的面板可見，因此切換分頁時，每個面板的內容都會保留；而當面板移動（到另一個群組、移入停靠欄、進入縮放再返回）時，相同的內容會隨之移動：它建立的 signal、輸入框的文字、捲動位置、web view 的頁面都會保留。工作區只會在面板首次出現時渲染一次，並在面板離開版面配置時釋放其內容（`onPanelRemove`）。

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` 以 key 設定每個面板的許可；未列出的面板允許所有操作：

| 欄位 | 預設值 | 說明 |
|---|---|---|
| `id` | | 面板的 key。 |
| `closable` | `true` | 可以關閉。 |
| `zoomable` | `true` | 顯示期間，其所屬群組可以縮放。 |
| `visible` | `true` | 是否顯示。隱藏的面板會保留其位置，並在重新顯示時回到原處；所有面板均被隱藏的群組或分割不佔用空間。 |

<a id="tabs"></a>

## 分頁

每個群組都有一個分頁列，每個可見面板對應一個分頁，順序依照 `panels`。`renderTab` 渲染分頁所顯示的內容（標題、圖示、應用程式自訂的關閉按鈕）；未提供時，分頁會顯示面板的 key。工作區會把它作為分頁處理：按下即選取，拖曳即移動其面板，螢幕閱讀器會將它讀作帶有選取狀態的分頁，而 `tabClass` 的 `selected:` class 會為顯示中的分頁設定樣式。分頁的值說明了應用程式繪製它所需的資料：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `panel` | `string` | 面板的 key。 |
| `group` | `number` | 它所在分頁群組的 id。 |
| `index` | `number` | 它在群組可見分頁中的位置。 |
| `active` | `boolean` | 它是群組中顯示中的分頁。 |
| `closable` | `boolean` | 工作區可以關閉它：它可關閉、工作區未鎖定，而且其群組可以放棄它。 |
| `zoomed` | `boolean` | 其群組已縮放。 |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## 拖放

將分頁拖過群組時，會顯示它將落在何處，放開後就會放到該處：

| 放置位置 | 面板 |
|---|---|
| 分頁列 | 加入該群組，位於放開處兩旁的分頁之間 |
| 群組內容的中間 | 加入該群組 |
| 群組內容的邊緣（每側外圍 35%） | 分割該群組：在該側建立一個新的獨立群組 |

拖曳懸停期間，工作區會在面板將佔用的群組部分上方顯示放置指示器（加入時覆蓋全部內容，分割時覆蓋一半）：這是一個由應用程式設定樣式的部分（`dropIndicatorClass`），如果應用程式渲染了自己的內容（`renderDropIndicator`，會收到 `group`、它所分割出的 `side` 或分頁列 `index`），就會顯示該內容。它會以原生方式移動到每個新位置，並帶有緩動效果；移到另一個群組時，會在前一個消退的同時淡入（當使用者要求減少動態效果時則立即切換）。跟隨指標或手指的內容同樣由應用程式決定（`renderDragPreview`）。一次放置只算一次版面配置更改，只會回報一次；不會造成任何改變的放置，則不會更改任何內容。

已鎖定的工作區、已縮放的工作區，以及旁邊沒有其他內容的群組中的最後一個面板，都不能拖曳。

<a id="docks"></a>

## 停靠欄

停靠欄開啟和關閉時，不會失去其面板或大小：關閉時會保留它的樹，再開啟時會以相同大小顯示相同的群組。停靠欄與中央區域之間的邊緣是一個把手，使用者可拖曳它來調整停靠欄大小；停靠欄至少保持 100 點，中央區域也至少保持 100 點，而可收合的停靠欄若在小於 50 點時放開，就會關閉，並保留其大小供下次開啟時使用。工作區一定會配合其邊界：停靠欄會以其 `size` 顯示，但受限於工作區留給它的空間；若連這樣也放不下，停靠欄會與其餘部分一同縮小，而分割的最小尺寸也會讓步。`renderDock` 會在停靠欄的版面配置之前繪製它自己的外框內容（標題列、收合按鈕），並會收到它的 `placement`、`open`、`size` 和 `collapsible`；`dockClass` 為其外框設定樣式。

應用程式可透過 ref 開啟、關閉及調整停靠欄大小（`toggleDock`、`setDockOpen`、`setDockSize`），這些方法在兩種呈現方式下都有效；也可以在傳入的版面配置中寫入停靠欄的 `open` 和 `size`（`open` 屬於完整呈現方式）。每當停靠欄顯示或隱藏時，`onDockOpenChange` 都會回報，並以版面配置的 `open` 為基準來衡量（一開始就是精簡呈現的工作區，會將每個在版面配置中為開啟的停靠欄回報為隱藏），因此從版面配置的 `open` 開始並跟隨 `onDockOpenChange` 的切換，總能顯示停靠欄的狀態：

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

<a id="zoom"></a>

## 縮放

已縮放的群組會填滿整個工作區，直至被縮小或離開版面配置為止（`area.toggleZoom(group)`，以及用於縮小的 `area.toggleZoom()`），而 `onZoomChange` 會回報它所顯示的面板，或 `null`。縮放屬於群組，因此當其顯示中的面板關閉、由下一個面板接替時，群組仍保持縮放。設有 `zoomable: false` 的面板在顯示期間，會使其群組無法縮放。

<a id="locking"></a>

## 鎖定

`locked` 會讓編排保持原樣：不能拖曳分頁、不能放置、不能關閉。選取分頁、調整大小，以及開啟和關閉停靠欄仍然可用，因此已鎖定的工作空間依然可以使用。

<a id="methods"></a>

## 方法

`ref={area}` 提供工作區的方法（`DockAreaRef`），供應用程式的命令、快速鍵和選單使用。每項編輯都會像使用者的操作一樣，以 `onLayoutChange` 回報。如果傳給方法的面板、群組、分頁索引或停靠欄不存在於版面配置中，版面配置會維持原狀，並記錄一則指出方法名稱和該值的警告。

| 方法 | 說明 |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`：目前顯示的版面配置。 |
| `addPanel(panel, placement?, size?)` | 將面板加入某個區域（`"center"`，即預設值、`"left"`、`"right"`、`"bottom"`），放入其第一個分頁群組並設為顯示中；若停靠欄不存在則會建立，橫跨寬度為 `size`。工作區已有的面板則會移到該處。 |
| `removePanel(panel)` | 移除面板，不論其選項如何設定。 |
| `closePanel(panel)` | 以分頁關閉的方式關閉面板：若工作區已鎖定、面板不可關閉，或它是旁邊沒有其他內容的群組中的最後一個面板，則不會關閉。 |
| `movePanel(panel, target)` | 將面板移到 `target`：`{ group, side?, index?, activate?, size? }`、移入分頁群組 `group`（位於 `index`），或移到其 `side` 的新群組（`size` 為沿新分割的點數）。 |
| `splitAt(group, panel, side)` | 將面板放入容器某一側的新分頁群組（`"left"`、`"right"`、`"top"`、`"bottom"`）。 |
| `selectPanel(panel)` | 在其群組中顯示某個面板。 |
| `selectTab(group, index)` | 顯示群組的某個分頁。 |
| `toggleDock(placement)`、`setDockOpen(placement, open)` | 開啟或關閉停靠欄。 |
| `setDockSize(placement, size)` | 設定停靠欄橫跨其邊緣的大小（至少 100）。 |
| `toggleZoom(group?)` | 縮放群組；若群組已縮放則縮小；沒有 `group` 時，則縮小已縮放的群組。 |
| `zoomedGroup()` | `Promise<number \| null>`：已縮放群組的 id。 |
| `groupOf(panel)` | `Promise<number \| null>`：容納某個面板的分頁群組 id。 |

在 Rust 中，工作區上的 `component_ref::<DockArea>()` 和 `.component_ref(&r)` 會提供一個 ref，其 `r.api::<DockAreaApi>()` 具有相同的方法，名稱採用 snake case。

<a id="saving-and-restoring"></a>

## 儲存與還原

回報的版面配置是純資料，因此儲存只需對它執行 `JSON.stringify(layout)` 並寫入[儲存空間](../modules/nsh.md#storage)，而還原則是將解析後的值作為 `layout` 傳入。`onLayoutChange` 會回報每項更改，包括調整大小和選取分頁，因此請在更改穩定後才寫入儲存空間（使用在每次回報時重設的短計時器）。

在 Rust 中，`DockAreaLayout::to_state` 和 `from_state` 讀寫 `DockAreaState`，這是 `gpui-base` 的停靠欄同樣使用的版面配置檔案格式。

<a id="phones-and-narrow-windows"></a>

## 手機與窄視窗

停靠欄會配合自身的寬度。寬度達 600 點或以上的工作區（在桌面視窗、網頁、平板、全螢幕 iPad、展開的摺疊式裝置中）是完整的工作空間：分割、群組和停靠欄並排顯示，一如平板上的多窗格應用程式。在手機或平板上用手指操作時，分頁拖曳會在長按後開始，與 iPadOS 的拖放一樣，因此分頁列仍可透過滑動捲動，而把手會有更闊的觸控範圍，外觀則維持不變。

寬度少於 600 點的工作區（在手機、Slide Over 中的 iPad、窄的桌面或瀏覽器視窗，或寬版面中的窄欄內）會為單一畫面呈現相同的版面配置，就如 iPad 的分割檢視會收合其欄位，而 Material Design 的輔助窗格會變成底部面板：

- 中央區域一次以完整大小顯示一個群組。它的分頁列會列出中央區域的每個可見面板，選取另一個群組的面板，就會讓該群組成為顯示中的群組。
- 左右停靠欄是從邊緣覆蓋在中央區域上的抽屜，寬度與停靠欄相同；下方停靠欄則是高度與停靠欄相同的底部面板。同一時間只會顯示一個，由應用程式呈現時才會出現（`toggleDock`、`setDockOpen`，會令另一個被關閉）；它會滑入和滑出，按下背景遮罩、按 Escape 或返回，都會將它關閉。進入精簡呈現時，不會顯示任何一個。
- 拖曳分頁（手指在長按後，或指標立即拖曳）時，會在分頁列內移動以重新排序。

兩種呈現方式下，每個面板都保持已配置位置，因此切換時其內容會保留。所顯示的抽屜或底部面板屬於精簡呈現本身：版面配置的 `open` 屬於完整呈現，而呈現或關閉抽屜不會回報 `onLayoutChange`，因此再次變寬的工作區會原樣顯示停靠欄。`onDockOpenChange` 會回報兩種情況：在完整呈現中 `open` 改變的停靠欄、在精簡呈現中顯示或關閉的抽屜或底部面板，以及呈現方式切換時顯示狀態改變的每個停靠欄。在 `renderDock` 中，`open` 表示該停靠欄在目前的呈現方式下是否顯示。版面配置也仍是同一個值，因此當工作區跨越 600 點（摺疊式裝置展開、iPad 加入 Split View、視窗或欄位被調整大小）時，每個面板都會留在原處，應用程式也只需儲存一份版面配置。工作區完成版面配置後，由其寬度決定呈現方式（在此之前以視窗寬度代替），而 `compact` 會取代寬度來選擇呈現方式。抽屜、底部面板和背景遮罩都是由應用程式設定樣式的部分（`drawerClass`、`sheetClass`、`backdropClass`），與工作區其餘部分相同。

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | 無 | 顯示的版面配置（受控）：傳回 `onLayoutChange` 所報告的內容。 |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | 空白的中央區域 | 起始版面配置，在未設定 `layout` 時使用；此後區域自行維持其版面配置。 |
| `locked` | `.locked(..)` | `boolean` | `false` | 不可拖曳、放置或關閉分頁。 |
| `compact` | `.compact(..)` | `boolean` | 按寬度 | 手機呈現方式（`true`）或完整呈現方式（`false`）；未設定時，區域窄於 600 點便採用精簡呈現方式。 |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | 各面板允許的操作，按鍵值設定：`closable`、`zoomable`、`visible`。 |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | 無 | 面板的內容，按其鍵值（`panel.id`）設定。 |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | 鍵值 | 分頁顯示的內容。 |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | 無 | 放置指示器內顯示的內容：`group`、`side`、`index`。 |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | 無 | 停靠區本身的外框，位於其版面配置之前：`placement`、`open`（於目前呈現方式中顯示）、`size`、`collapsible`。 |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | 無 | 空白中央區域顯示的內容。 |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | 無 | 拖曳分頁時跟隨指標或手指的內容。 |
| `groupClass`、`groupStyle` | `.group_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分頁群組的外框。 |
| `tabBarClass`、`tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分頁列（`flex-row` 用於單行）。 |
| `tabClass`、`tabStyle` | `.tab_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分頁；`selected:` 用於正在顯示的分頁。 |
| `contentClass`、`contentStyle` | `.content_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個群組的內容外框，面板在此顯示。 |
| `dropIndicatorClass`、`dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 放置指示器。 |
| `handleClass`、`handleStyle` | `.handle_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的指示器，位於分割的群組之間及每個停靠區的邊緣；`group-hover:` 和 `group-active:` 跟隨把手。它橫跨把手寬 1 點，除非另有指定，否則沿整個長度延伸，所以 `bg-border` 無論哪個方向都是一條細線；`w-[3px]` / `h-[3px]` 可將它加粗。 |
| `handleThumbClass`、`handleThumbStyle` | `.handle_thumb_class(..)`、`.handle_thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的滑鈕：置中於線上的抓握部件，在垂直線上直立繪製，在水平線上則旋轉四分之一圈，因此同一個 class 可用於兩個軸向。把手在懸停、按下和拖曳期間，滑鈕始終是同一個視圖，所以 `group-hover:` 和 `group-active:` class 會為它加上過渡效果（`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`）。 |
| `dockClass`、`dockStyle` | `.dock_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個停靠區的外框。 |
| `drawerClass`、`drawerStyle` | `.drawer_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 精簡模式：兩側停靠區的抽屜。 |
| `sheetClass`、`sheetStyle` | `.sheet_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 精簡模式：底部停靠區的彈層。 |
| `backdropClass`、`backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 精簡模式：已開啟的抽屜或彈層後方的背景遮罩，按下即會關閉抽屜或彈層。 |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為每個把手朗讀的內容，包括分割的群組之間及每個停靠區邊緣的把手。 |
| `ref` | `.component_ref(&r)`（`component_ref::<DockArea>()`） | `DockAreaRef` | | 區域的[方法](#methods)。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 區域本身：其在父元件中的大小（`flex-1`）及背景。它保持在自身邊界內，不會從內容取得最小尺寸。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | 版面配置已變更（拖曳、選取、調整大小、停靠區開啟或關閉、呼叫方法）：`{ layout }`，即整個新版面配置，包括其中每個 id。 |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)`（`PanelActiveChange(panel, active)`） | `{ panel, active }`：某個面板成為或不再是其群組所顯示的分頁（已關閉的停靠區不顯示任何分頁）。每次變更只觸發一次；離開的面板不會收到 `false`：`onPanelRemove` 便是它的終結。 |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`：面板永久離開區域：已關閉、已移除，或在新版面配置中缺失。僅是移動位置的面板不會收到此事件。 |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | 群組放大或縮小：`{ panel }`、其所顯示的面板，或 `null`。 |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)`（`DockOpenChange(placement, open)`） | `{ placement, open }`：停靠區顯示或隱藏：在完整呈現方式中其版面配置 `open` 已變更，在精簡呈現方式中其抽屜或彈層已顯示或收起，或呈現方式已切換。 |

<a id="parts"></a>

## 部件

| 部件 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 區域 | | `class`、`style` | |
| 分頁群組 | 一個範圍 | `groupClass`、`groupStyle` | |
| 分頁列 | 一個群組 | `tabBarClass`、`tabBarStyle` | |
| 分頁 | 一個分頁列 | `tabClass`、`tabStyle`；`renderTab` | `selected:`、`active:`、`hover:` |
| 群組的內容 | 一個群組 | `contentClass`、`contentStyle`；`renderPanel` | |
| 把手的指示器 | 分割的群組之間、停靠區的邊緣 | `handleClass`、`handleStyle` | `group-hover:`、`group-active:` |
| 把手的滑鈕 | 置中於把手的線上 | `handleThumbClass`、`handleThumbStyle` | `group-hover:`、`group-active:`（按下狀態持續至拖曳結束） |
| 停靠區 | 一個邊緣 | `dockClass`、`dockStyle`；`renderDock` | |
| 放置指示器 | 拖曳期間位於群組之上 | `dropIndicatorClass`、`dropIndicatorStyle`；`renderDropIndicator` | |
| 拖曳預覽 | 指標或手指之下 | `renderDragPreview` | |
| 空白中央區域 | 中央 | `renderEmpty` | |
| 抽屜、彈層、背景遮罩 | 精簡模式下位於中央之上 | `drawerClass`、`sheetClass`、`backdropClass`（及其樣式） | |

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，每個分頁都是帶有選取狀態的分頁，與 [`Tab`](./tabs.md) 相同，啟用它即會選取該分頁。其標籤是 `renderTab` 繪製的文字。
- 每個把手，包括分割的群組之間及每個停靠區邊緣的把手，都是可調整的元素，標籤為 `handleAccessibilityLabel`。分割的群組之間的把手屬於 [Resizable](./resizable.md)：螢幕閱讀器每次移動 10 點，並以 `onLayoutChange` 報告。
- 在精簡呈現方式下，按 Escape 和返回會收起所顯示的抽屜或彈層。

有關標籤、角色和播報的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 在所有平台上，指標（滑鼠、觸控板、懸停於螢幕上的手寫筆）在按下按鈕後移動 4 點，便會拖曳分頁：配備觸控板的 iPad 和以滑鼠拖曳的窄瀏覽器視窗，行為與桌面平台一樣。在 macOS、Windows、Linux 和 GPUI 上，每次按下都視為指標操作，包括觸控螢幕手提電腦上的手指。
- 在 iOS、iPadOS 和 Android 上，手指長按後才會拖曳分頁，與 iPadOS 的拖放操作一樣，因此在分頁列上滑動會捲動分頁列。
- 桌面平台和網頁：把手會顯示其軸向的調整大小游標。
- 手機和窄區域：採用精簡呈現方式，配有抽屜和底部彈層。
- 所有平台都會繪製應用程式所設定的樣式：分頁、分頁列、把手、放置指示器、停靠區、抽屜和彈層。
