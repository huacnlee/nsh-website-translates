---
title: "Dock"
description: "DockArea:可停靠的工作區,包含分割區域、分頁群組,以及位於左側、右側與底部邊緣的停靠區,其版面配置是由應用程式擁有的資料。此區域負責處理分頁的拖曳與放置、調整大小、停靠區、縮放與鎖定,並在面板移動時保留各面板的內容,同時能適應手機;外觀與面板的內容則由應用程式負責。"
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

Dock 區域是由使用者自行安排的工作區：面板放在分頁群組中，群組可以左右並排或上下堆疊，左、右與下方邊緣則可以有 dock，能開啟、關閉與調整大小。將分頁拖到另一個群組上會加入該群組，拖到群組邊緣則會分割該群組，而且每個面板在移動時都會保留其內容。`DockArea` 負責行為：分頁的拖曳與放置（以原生方式逐幀執行）、調整分割與 dock 的大小、開啟與關閉 dock、縮放以及鎖定。外觀則由應用程式決定：分頁、分頁列、拖曳把手、放置指示器與每個面板的內容都由應用程式負責渲染與設定樣式，區域本身不繪製任何東西。

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

`DockArea` 及其所接受的值來自 [`nsh/base`](../modules/nsh-base.md)，這是 Rust 的 `nsh-base` crate（`nsh_base::dock_area()`，值位於 `nsh_base::dock`）。在 Rust 中，由 `dock_area()` 建立它，每個 prop 都有對應的 setter、每個事件都有對應的監聽器，並提供具型別的樣式方法；`DockLayout` 則以面板的 key 來描述版面配置（`h_split()`、`v_split()`、`tabs()`、`.child(layout, size)`、`.panel(key)`）。

<a id="the-layout"></a>

## 版面配置

版面配置是一個值，即 `DockAreaLayout`：包含中央區域，以及左、右、下三個邊緣上各自可有可無的 dock。每個區域都是由兩種節點組成的樹：

| 節點 | 內容 | 欄位 |
|---|---|---|
| `{ type: "split" }` | 其他節點，並排（`axis: "horizontal"`）或堆疊（`"vertical"`） | `children`，以及 `sizes`：每個子節點沿軸向的長度（以 point 為單位），`null` 表示平分剩餘空間 |
| `{ type: "tabs" }` | 面板（以 key 表示），一次只顯示一個 | `panels`（key 清單，依分頁順序）、`activeIndex`（目前顯示的面板，預設為 0） |

面板一律位於某個分頁群組中：只有一個面板的區域就是只含一個分頁的群組。面板的 key 是應用程式為它指定的字串（`"files"`、文件的 id），且同一個 key 在整個版面配置中只能出現一次。dock（`DockRegion`）包含它的樹（`layout`）、橫跨其邊緣的大小（`size`，預設 200，至少 100）、是否開啟（`open`，預設 `true`），以及將其邊緣拖到最小尺寸以下時是否會關閉它（`collapsible`，預設 `true`）。

每個節點都有 `id`。應用程式撰寫的版面配置可以省略 id：區域會自動指派，而它回報的每個版面配置都帶有 id。將回報的版面配置傳回去，可以保留每個群組的身分，ref 的方法就是依此來指稱群組。區域也會整理收到的內容：空的群組或分割會被移除，只有一個子節點的分割會變成該子節點，位於同軸向分割內的分割會併入其父節點，`activeIndex` 會保持在有效範圍內，重複列出的 key 只保留第一個位置。它回報的版面配置永遠是這種標準形式。

版面配置由應用程式持有（`layout`）：使用者所做的每一項變更（選取、拖曳或關閉分頁，調整分割或 dock 的大小，開啟或關閉 dock）都會以整個新版面配置的形式回報（`onLayoutChange`），而區域顯示的是應用程式傳回的版面配置。應用程式則透過傳入新的值來變更版面配置：例如還原已儲存的版面配置，或是重新排列工作區的指令。沒有 `layout` 的區域會自行保管版面配置，從 `defaultLayout` 開始，並仍會回報每一項變更。

<a id="panels-content"></a>

## 面板內容

面板顯示什麼由應用程式決定：`renderPanel` 會依面板的 key 來渲染它（`panel.id`）。群組中的每個面板都會被安置，但只有目前顯示的那個會被顯示，因此切換分頁時會保留各面板的內容；而當面板移動時（移到另一個群組、移進 dock、進入縮放狀態再回來），相同的內容會隨之移動：它建立的 signal、輸入框中的文字、捲動位置、web view 的頁面都會保留。區域只會在面板首次出現時渲染一次，並在面板離開版面配置時釋放其內容（`onPanelRemove`）。

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` 以 key 設定每個面板允許的操作；未列出的面板允許所有操作：

| 欄位 | 預設值 | 說明 |
|---|---|---|
| `id` | | 面板的 key。 |
| `closable` | `true` | 可以關閉。 |
| `zoomable` | `true` | 顯示期間，其群組可以縮放。 |
| `visible` | `true` | 會顯示。隱藏的面板會保留其位置，並在回來時回到該處；所有面板都隱藏的群組或分割則不佔用空間。 |

<a id="tabs"></a>

## 分頁

每個群組都有一個分頁列，每個可見的面板各有一個分頁，順序依 `panels` 而定。`renderTab` 負責渲染分頁所顯示的內容（標題、圖示、應用程式自訂的關閉按鈕）；若未提供，分頁會顯示面板的 key。區域會把它變成分頁：按下即選取、拖曳即移動其面板、螢幕閱讀器會將其讀作帶有選取狀態的分頁，而 `tabClass` 的 `selected:` class 則用來為目前顯示的分頁設定樣式。分頁的值包含應用程式繪製它所需的資訊：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `panel` | `string` | 面板的 key。 |
| `group` | `number` | 它所在分頁群組的 id。 |
| `index` | `number` | 它在該群組可見分頁中的位置。 |
| `active` | `boolean` | 它是該群組目前顯示的分頁。 |
| `closable` | `boolean` | 區域會關閉它：它可關閉、區域未鎖定，且其群組可以放棄它。 |
| `zoomed` | `boolean` | 其群組處於縮放狀態。 |

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

將分頁拖曳到群組上方時，會顯示它將落在何處，放開後便會放到該處：

| 放置於 | 面板會 |
|---|---|
| 分頁列 | 加入該群組，位於放置處旁邊的分頁之間 |
| 群組內容的中央 | 加入該群組 |
| 群組內容的邊緣（每一側外側 35%） | 分割該群組：在該側建立一個全新的群組 |

拖曳懸停時，區域會在面板將佔用的群組部分上方顯示放置指示器（加入時為整個內容，分割時為一半）：這是由應用程式設定樣式的部分（`dropIndicatorClass`），若應用程式渲染了自己的內容，也可以包含其內容（`renderDropIndicator`，會收到 `group`、它所分割出的 `side` 或分頁列 `index`）。它會以原生方式移動到每個新位置，平順過渡，並在移到另一個群組時淡入，同時上一個淡出（當使用者要求減少動態效果時則立即切換）。跟隨指標或手指的內容同樣由應用程式決定（`renderDragPreview`）。一次放置就是一次版面配置變更，只會回報一次；不會造成任何改變的放置，就不會改變任何東西。

鎖定的區域、處於縮放狀態的區域，以及旁邊沒有其他內容的群組中的最後一個面板，都無法拖曳。

<a id="docks"></a>

## Dock

dock 在開啟與關閉時不會失去其面板或大小：關閉時會保留它的樹，開啟時則以相同的大小顯示相同的群組。dock 與中央區域之間的邊緣是一個把手，使用者可以拖曳它來調整 dock 的大小；dock 至少保持 100 point，中央區域也至少保持 100 point，而可收合的 dock 在放開時若小於 50 point 就會關閉，並保留其大小以供下次開啟。區域一律會符合其邊界：dock 以其 `size` 顯示，但不超出區域留給它的空間，若連這樣都放不下，dock 會與其他部分一起縮小，分割的最小尺寸也會讓步。`renderDock` 會在 dock 的版面配置之前繪製 dock 自己的外框（標題列、收合按鈕），並會收到它的 `placement`、`open`、`size` 與 `collapsible`；`dockClass` 則為其外框設定樣式。

應用程式可以透過 ref 開啟、關閉與調整 dock 的大小（`toggleDock`、`setDockOpen`、`setDockSize`），這在兩種呈現方式下都可運作；也可以在傳入的版面配置中寫入 dock 的 `open` 與 `size`（`open` 屬於完整呈現方式）。`onDockOpenChange` 會在每次 dock 顯示或隱藏時回報，並以版面配置的 `open` 為基準來衡量（一開始就是精簡呈現的區域，會將每個在版面配置中開啟的 dock 回報為隱藏），因此以版面配置的 `open` 為起點並跟隨 `onDockOpenChange` 的切換開關，永遠能顯示 dock 的狀態：

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

被縮放的群組會填滿整個區域，直到被縮小或離開版面配置為止（`area.toggleZoom(group)`，以及用來縮小的 `area.toggleZoom()`），而 `onZoomChange` 會回報它所顯示的面板，或回報 `null`。縮放屬於群組，因此當它所顯示的面板關閉、由下一個面板接手時，群組仍維持縮放狀態。帶有 `zoomable: false` 的面板在顯示期間，會讓其群組無法縮放。

<a id="locking"></a>

## 鎖定

`locked` 會讓排列保持原樣：不能拖曳分頁、不能放置、不能關閉。選取分頁、調整大小以及開啟與關閉 dock 仍然可用，因此鎖定的工作區仍是可以使用的工作區。

<a id="methods"></a>

## 方法

`ref={area}` 提供區域的方法（`DockAreaRef`），供應用程式的指令、快速鍵與選單使用。每次編輯都會像使用者的操作一樣，以 `onLayoutChange` 回報。若傳給方法的面板、群組、分頁索引或 dock 在版面配置中不存在，則版面配置保持不變，並記錄一則指出該方法與該值的警告。

| 方法 | 說明 |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`：目前顯示的版面配置。 |
| `addPanel(panel, placement?, size?)` | 將面板加入某個區域（`"center"`，預設值，`"left"`、`"right"`、`"bottom"`），放入其第一個分頁群組並顯示；不存在的 dock 會被建立，橫跨大小為 `size`。區域已持有的面板會移到該處。 |
| `removePanel(panel)` | 移除面板，不論其選項如何設定。 |
| `closePanel(panel)` | 像它的分頁一樣關閉面板：除非區域已鎖定、面板不可關閉，或它是旁邊沒有其他內容的群組中的最後一個面板。 |
| `movePanel(panel, target)` | 將面板移到 `target`：`{ group, side?, index?, activate?, size? }`，移入分頁群組 `group`（位於 `index`），或移到其 `side` 上的新群組（`size` point 沿著新的分割）。 |
| `splitAt(group, panel, side)` | 將面板放入容器某一側（`"left"`、`"right"`、`"top"`、`"bottom"`）的新分頁群組中。 |
| `selectPanel(panel)` | 在面板所屬的群組中顯示該面板。 |
| `selectTab(group, index)` | 顯示群組中的某個分頁。 |
| `toggleDock(placement)`、`setDockOpen(placement, open)` | 開啟或關閉 dock。 |
| `setDockSize(placement, size)` | 設定 dock 橫跨其邊緣的大小（至少 100）。 |
| `toggleZoom(group?)` | 放大群組，或在群組已縮放時將其縮小；若沒有 `group`，則縮小目前被縮放的群組。 |
| `zoomedGroup()` | `Promise<number \| null>`：被縮放群組的 id。 |
| `groupOf(panel)` | `Promise<number \| null>`：持有某個面板的分頁群組的 id。 |

在 Rust 中，區域上的 `component_ref::<DockArea>()` 與 `.component_ref(&r)` 會提供一個 ref，其 `r.api::<DockAreaApi>()` 具有相同的方法，名稱採用 snake case。

<a id="saving-and-restoring"></a>

## 儲存與還原

回報的版面配置是單純的資料，因此儲存它只需要將 `JSON.stringify(layout)` 寫入[儲存空間](../modules/nsh.md#storage)，還原它則是將解析後的值作為 `layout` 傳入。`onLayoutChange` 會回報每一項變更，包括調整大小與選取分頁，因此請等變更穩定後再寫入儲存空間（例如每次回報時重置一個短計時器）。

在 Rust 中，`DockAreaLayout::to_state` 與 `from_state` 會讀寫 `DockAreaState`，這是 `gpui-base` 的 dock 也使用的版面配置檔案格式。

<a id="phones-and-narrow-windows"></a>

## 手機與窄視窗

Dock 會依自身寬度調整。寬度達 600 point 以上的區域（桌面視窗、網頁、平板、iPad 全螢幕、展開的折疊式裝置）是完整的工作區：分割、群組與 dock 並排顯示，就像平板的多窗格應用程式一樣。在手機或平板上用手指操作時，分頁拖曳會從長按開始，如同 iPadOS 的拖放，因此分頁列仍可在滑動時捲動，而把手則有更寬的觸控範圍，外觀不變。

寬度小於 600 point 的區域（手機、Slide Over 中的 iPad、窄的桌面或瀏覽器視窗，或寬區域中的窄欄）會將同一個版面配置呈現為單一螢幕，就像 iPad 的分割檢視會收合其欄位、Material Design 的輔助窗格會變成底部面板一樣：

- 中央區域一次顯示一個群組，滿版大小。它的分頁列會列出中央區域的每個可見面板，選取另一個群組的面板會讓該群組成為所顯示的群組。
- 左側與右側的 dock 是從其邊緣覆蓋在中央區域上的抽屜，寬度與 dock 相同；下方的 dock 則是高度與 dock 相同的面板。一次只會顯示一個，且由應用程式呈現時才顯示（`toggleDock`、`setDockOpen`，會讓另一個關閉）；它會滑入與滑出，按下其背景遮罩、按 Escape 或返回都會將它關閉。進入精簡呈現方式時不會顯示任何一個。
- 拖曳的分頁（手指長按後，或指標立即）會在分頁列內移動以重新排序。

每個面板在兩種呈現方式下都保持被安置的狀態，因此切換時會保留其內容。所顯示的抽屜或面板屬於精簡呈現方式本身：版面配置的 `open` 屬於完整呈現方式，而顯示或關閉抽屜不會回報 `onLayoutChange`，因此再次變寬的區域會讓 dock 恰好保持原樣。`onDockOpenChange` 兩者都會回報：在完整呈現方式中版面配置的 `open` 有變動的 dock、在精簡呈現方式中顯示或關閉的抽屜或面板，以及呈現方式切換時顯示狀態有變動的每個 dock。在 `renderDock` 中，`open` 表示該 dock 在目前的呈現方式下是否顯示。版面配置也仍是同一個值，因此跨越 600 point 的區域（折疊式裝置展開、iPad 加入 Split View、視窗或欄位被調整大小）會讓每個面板留在原處，應用程式也只需儲存一份版面配置。區域完成版面配置後便以其寬度決定呈現方式（在此之前以視窗寬度代替），而 `compact` 則會取代寬度來選擇呈現方式。抽屜、面板與背景遮罩是由應用程式設定樣式的部分（`drawerClass`、`sheetClass`、`backdropClass`），與區域的其餘部分相同。

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

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | 無 | 顯示的版面配置（受控）：傳回 `onLayoutChange` 所回報的內容。 |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | 空的中央區域 | 初始的版面配置，於未設定 `layout` 時使用；之後區域會自行維護其版面配置。 |
| `locked` | `.locked(..)` | `boolean` | `false` | 不允許任何分頁拖曳、放置或關閉。 |
| `compact` | `.compact(..)` | `boolean` | 依寬度 | 手機呈現（`true`）或完整呈現（`false`）；未設定時，區域寬度小於 600 點則為精簡呈現。 |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | 每個面板所允許的操作，依 key 指定：`closable`、`zoomable`、`visible`。 |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | 無 | 面板的內容，依其 key 指定（`panel.id`）。 |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | 其 key | 分頁所顯示的內容。 |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | 無 | 放置指示器內部所顯示的內容：`group`、`side`、`index`。 |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | 無 | 停靠區自身的外框，位於其版面配置之前：`placement`、`open`（顯示於目前的呈現方式中）、`size`、`collapsible`。 |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | 無 | 空的中央區域所顯示的內容。 |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | 無 | 拖曳分頁時，跟隨指標或手指的內容。 |
| `groupClass`、`groupStyle` | `.group_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分頁群組的外框。 |
| `tabBarClass`、`tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分頁列（`flex-row` 用於橫列）。 |
| `tabClass`、`tabStyle` | `.tab_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分頁；`selected:` 用於目前顯示的分頁。 |
| `contentClass`、`contentStyle` | `.content_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個群組的內容外框，其面板顯示於此。 |
| `dropIndicatorClass`、`dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 放置指示器。 |
| `handleClass`、`handleStyle` | `.handle_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的指示器，位於分割的群組之間及每個停靠區的邊緣；`group-hover:` 與 `group-active:` 會隨把手而定。其垂直於把手方向的粗細為 1 點，且除非另有指定，否則會延伸至把手的整個長度，因此無論哪種情況，`bg-border` 都是一條細線；`w-[3px]` / `h-[3px]` 可將其加粗。 |
| `handleThumbClass`、`handleThumbStyle` | `.handle_thumb_class(..)`、`.handle_thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個把手的握柄：置中於線上的握把，在垂直線上以直立方式繪製，在水平線上則旋轉四分之一圈，因此同一個 class 可同時適用於兩個軸向。當把手被懸停、按下及拖曳時，它仍是同一個 view，因此 `group-hover:` 與 `group-active:` class 會為它加上轉場（`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`）。 |
| `dockClass`、`dockStyle` | `.dock_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個停靠區的外框。 |
| `drawerClass`、`drawerStyle` | `.drawer_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 精簡呈現：側邊停靠區的抽屜。 |
| `sheetClass`、`sheetStyle` | `.sheet_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 精簡呈現：底部停靠區的底部面板。 |
| `backdropClass`、`backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 精簡呈現：開啟的抽屜或底部面板後方的背景遮罩，按下即會將其關閉。 |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為每個把手所朗讀的內容，包含分割的群組之間及每個停靠區的邊緣。 |
| `ref` | `.component_ref(&r)`（`component_ref::<DockArea>()`） | `DockAreaRef` | | 區域的[方法](#methods)。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 區域本身：其在父層中的大小（`flex-1`）與背景。它會限制在自身邊界內，且不會從內容取得最小尺寸。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | 版面配置已變更（拖曳、選取、調整大小、停靠區開啟或關閉、呼叫方法）：`{ layout }`，即完整的新版面配置，包含其中的每個 id。 |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)`（`PanelActiveChange(panel, active)`） | `{ panel, active }`：某個面板成為（或不再是）其群組所顯示的分頁（已關閉的停靠區不顯示任何分頁）。每次變更只觸發一次；離開的面板不會收到 `false`：`onPanelRemove` 就是它的結束。 |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`：某個面板永久離開區域：被關閉、被移除，或在新版面配置中不存在。被移動的面板不會收到此事件。 |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | 某個群組放大或縮小：`{ panel }`、其所顯示的面板，或 `null`。 |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)`（`DockOpenChange(placement, open)`） | `{ placement, open }`：某個停靠區顯示或隱藏：在完整呈現中其版面配置 `open` 變更，在精簡呈現中其抽屜或底部面板被顯示或關閉，或呈現方式切換。 |

<a id="parts"></a>

## 部件

| 部件 | 所在位置 | 樣式設定 | 狀態 |
|---|---|---|---|
| 區域 | | `class`、`style` | |
| 分頁群組 | 一個區塊 | `groupClass`、`groupStyle` | |
| 分頁列 | 一個群組 | `tabBarClass`、`tabBarStyle` | |
| 分頁 | 一個分頁列 | `tabClass`、`tabStyle`；`renderTab` | `selected:`、`active:`、`hover:` |
| 群組的內容 | 一個群組 | `contentClass`、`contentStyle`；`renderPanel` | |
| 把手的指示器 | 分割的群組之間、停靠區的邊緣 | `handleClass`、`handleStyle` | `group-hover:`、`group-active:` |
| 把手的握柄 | 置中於把手的線上 | `handleThumbClass`、`handleThumbStyle` | `group-hover:`、`group-active:`（按下狀態持續到拖曳結束） |
| 停靠區 | 一個邊緣 | `dockClass`、`dockStyle`；`renderDock` | |
| 放置指示器 | 拖曳期間位於群組上方 | `dropIndicatorClass`、`dropIndicatorStyle`；`renderDropIndicator` | |
| 拖曳預覽 | 位於指標或手指下方 | `renderDragPreview` | |
| 空的中央區域 | 中央區域 | `renderEmpty` | |
| 抽屜、底部面板、背景遮罩 | 位於中央區域上方，精簡呈現 | `drawerClass`、`sheetClass`、`backdropClass`（及其樣式） | |

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，每個分頁都是帶有選取狀態的分頁，如同 [`Tab`](./tabs.md)，啟用它即會選取該分頁。其標籤為 `renderTab` 所繪製的文字。
- 每個把手，包含分割的群組之間及每個停靠區的邊緣，都是標示為 `handleAccessibilityLabel` 的可調整元素。分割的群組之間的把手屬於 [Resizable](./resizable.md)：螢幕閱讀器每次將其移動 10 點，並以 `onLayoutChange` 回報。
- 在精簡呈現中，Escape 與返回會關閉目前顯示的抽屜或底部面板。

有關標籤、角色與播報的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台注意事項

- 指標（滑鼠、觸控板、懸停於螢幕上的手寫筆）在按鍵按下後移動 4 點即會拖曳分頁，所有平台皆然：使用觸控板的 iPad，以及以滑鼠拖曳操作的窄瀏覽器視窗，其行為與桌面版相同。在 macOS、Windows、Linux 與 GPUI 上，每次按下都視為指標操作，包括觸控螢幕筆記型電腦上的手指。
- 在 iOS、iPadOS 與 Android 上，手指需長按後才會拖曳分頁，如同 iPadOS 的拖放操作，因此在分頁列上滑動會使其捲動。
- 桌面平台與網頁：把手會顯示其軸向的調整大小游標。
- 手機與窄區域：使用精簡呈現，搭配抽屜與底部面板。
- 每個平台都會繪製應用程式所設定樣式的內容：分頁、分頁列、把手、放置指示器、停靠區、抽屜與底部面板。
