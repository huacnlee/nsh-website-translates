---
title: "Tree"
description: "Tree:可包含子項目的項目,可展開與收合,並可選取其中一項,適用於專案檔案、設定側邊欄、大綱等情境。支援虛擬化,在鍵盤焦點中只佔一個停駐點,並為螢幕閱讀器提供樹狀結構。每一列的外觀由應用程式自行決定。"
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---


# Tree

樹狀檢視顯示包含項目的項目:專案的檔案和資料夾、設定側邊欄的各個區段、文件的大綱。`Tree` 負責其行為:哪些項目已展開、哪一項已選取、鍵盤操作,以及螢幕閱讀器讀出的內容。它的列已虛擬化:只會建立畫面內可見的列,而已收合項目的子項目根本不會建立,所以擁有數千個項目的樹狀檢視也能即時開啟和捲動。外觀由應用程式決定:樹狀檢視本身不繪製任何內容,應用程式為每一列設定樣式(`itemClass`)並繪製其內容(`renderItem`:圖示、按項目深度縮排的標籤、箭咀、徽章)。

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` 來自 [`nsh/base`](../modules/nsh-base.md),即 Rust 中的 `nsh-base` crate。當應用程式設定 `expanded` 和 `selected` 時,展開的項目和選取的項目由應用程式掌管,並在 `onExpandedChange` 和 `onSelectedChange` 中更新;沒有設定的話,樹狀檢視會自行保存狀態,由 `defaultExpanded` 和 `defaultSelected` 開始。項目以其 `id` 識別,這是應用程式自己的值(路徑、記錄的鍵),絕不以標籤識別。在 Rust 中,`tree()` 負責建立它,每個屬性有一個 setter(`.items(..)`、`.expanded(..)`、`.render_item(..)`),每個事件有一個監聽方法,以及具型別的樣式方法。

<a id="items"></a>

## 項目

`items` 是頂層的項目,每個都是 `TreeItem`:

| 欄位 | 類型 | 說明 |
|---|---|---|
| `id` | `string` | 在 `expanded`、`selected` 和事件中用來識別該項目:在樹狀檢視中必須唯一(重複給出的 id 會被記錄,而且只有第一個項目會展開或被選取)。 |
| `label` | `string` | 其列所顯示的內容(除非由 `renderItem` 繪製)、螢幕閱讀器讀出的內容,以及鍵入搜尋(typeahead)比對的對象。 |
| `children` | `TreeItem[]` | 其下的項目,按順序排列。有任何子項目時,它就是資料夾:可展開和收合。 |
| `disabled` | `boolean` | 使用者不能選取、展開或收合它:按下和按鍵都會略過它,`disabled:` 樣式會套用。其子項目維持 `expanded` 所指定的狀態。 |

`renderItem` 會為畫面內每一列取得一個 `TreeEntry`:項目的 `id`、`label` 和 `disabled`、其 `depth`(頂層為 0,頂層項目之下為 1,……)以及它是否為 `folder`。它描述項目本身是甚麼,而列的狀態則是它的 class:繪製內容每個項目只做一次,並在該列被選取、展開或收合時保留其視圖,因此箭咀可以帶著過渡動畫旋轉。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | 頂層的項目,每個項目附帶其下的項目。 |
| `expanded` | `.expanded(..)` | `string[]` | 無 | 已展開項目的 id(受控)。當一個項目上方所有項目都已展開時,它才會顯示。 |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | 起初已展開的項目,在未設定 `expanded` 時使用。 |
| `selected` | `.selected(..)` | `string \| null` | 無 | 已選取項目的 id(受控),`null` 表示沒有。 |
| `defaultSelected` | `.default_selected(..)` | `string` | 無 | 起初選取的項目,在未設定 `selected` 時使用。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 唯讀樹狀檢視:不接受按下或按鍵,不佔鍵盤焦點停駐位,每一列都有 `disabled:`;它顯示 `expanded` 和 `selected` 所指的內容。 |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 展開和收合時,該項目之後的列會以彈簧動畫移到新位置,並以原生方式執行。減少動態效果時關閉。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對樹狀檢視的稱呼(「Files」)。 |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | 無 | 列的內容,用於畫面內的列;未設定時,列顯示項目的標籤。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每一列:其高度、內距、表面和狀態(見下);其文字樣式會作用於標籤。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 樹狀檢視內列的捲動檢視:其內距和間距。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 樹狀檢視本身。請為它指定高度(或在有高度的父層中使用 `flex-1`):列在其中捲動,而且只會建立畫面內的列。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 資料 | 觸發時機 |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | 使用者展開或收合了項目(按下、Return、Space、向右鍵或向左鍵、`revealItem`):即將變成的展開 id。 |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | 使用者選取了另一個項目(按下、方向鍵、Home、End、鍵入搜尋)。 |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | 使用者展開了 `id` 的項目,在 `onExpandedChange` 之後。 |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | 使用者收合了 `id` 的項目,在 `onExpandedChange` 之後。 |
| `onAction` | `.on_action(..)` | `{ id: string }` | 使用者對 `id` 的項目執行了動作:對沒有子項目的已選取項目按 Return,或對任何項目雙擊或輕按兩下,在該次按下本身的事件之後。已停用的項目和已停用的樹狀檢視永不回報此事件。 |

選取會跟隨方向鍵移動,所以檔案總管應在 `onAction` 而不是 `onSelectedChange` 中開啟檔案:在檔案之間移動時逐一預覽,按 Return 或雙擊則開啟使用者想要的那一個。

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 樹狀檢視 | | `class`、`style` | |
| 清單 | 樹狀檢視 | `listClass`、`listStyle` | |
| 列 | 清單 | `itemClass`、`itemStyle` | `selected:`、`aria-expanded:`(已展開的資料夾)、`focus:`(樹狀檢視擁有鍵盤焦點時,按鍵所作用的列:已選取的列、隱藏的選取項所在的已收合項目,或在沒有選取任何項目時的第一列)、`disabled:`、`hover:`、`active:` |
| 列的內容 | 列 | `renderItem` | `group-selected:`、`group-aria-expanded:`、`group-focus:`、`group-disabled:`(在 `itemClass` 中的 `group` 之下) |

以 `selected:` 顯示已選取的列,以 `focus:` 顯示鍵盤所在位置(見[設計指南](../docs/design-guides.md#interaction-states))。請將焦點繪製在列內(`focus:outline-2 focus:-outline-offset-2`):清單會裁切伸出其兩側的內容。

## Ref

| 方法 | 說明 |
|---|---|
| `focus()` | 取得鍵盤焦點,效果等同按 Tab 來到樹狀檢視。 |
| `revealItem(id)` | 展開 `id` 的項目上方的項目(以 `onExpandedChange` 和 `onExpand` 回報,最外層優先),並在其列顯示後將它捲動到可見位置:若應用程式跟隨該變更,會立即進行;若不跟隨,請求就此結束。 |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## 停用

已停用的項目不接受按下,方向鍵會略過它,螢幕閱讀器會將它宣告為變暗。在樹狀檢視上設定 `disabled` 會使其成為唯讀:它顯示應用程式狀態所指示的內容,不接受輸入。

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## 無障礙

- 樹狀檢視的角色是 `"tree"`,由 `accessibilityLabel` 命名;每一列是以其項目標籤命名的 `"treeitem"`,並帶有其層級(深度 + 1)、是否已展開(資料夾)、是否已選取和是否已停用。
- 當樹狀檢視取得鍵盤焦點,以及按鍵移動選取時,按鍵所作用的列會取得螢幕閱讀器的焦點。

標籤、角色和宣告的一般說明,請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在桌面平台和網頁上,Tab 可以來到接受按下操作的檢視,`Tree` 遵循 [WAI-ARIA 樹狀檢視模式](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 一步進入樹狀檢視,也一步離開;返回時,按鍵會從已選取的列繼續。沒有選取任何項目時,焦點顯示在第一列,按 Down 會選取它。 |
| Down、Up | 選取下一列或上一列,略過已停用的項目,由最後一列循環到第一列,反之亦然。 |
| Right | 展開已收合的資料夾;若已展開,則選取其第一個可用的子項目。 |
| Left | 收合已展開的資料夾;其他情況則選取其父項目。 |
| Home、End | 選取第一列或最後一列。 |
| Return | 展開或收合已選取的資料夾;對沒有子項目的項目,則對它執行動作(`onAction`)。 |
| Space | 展開或收合已選取的資料夾。 |
| 字母、數字 | 選取標籤以所鍵入內容開頭的下一列。 |

當選取項被隱藏在已收合的項目之下(由應用程式收合),按鍵會作用於該項目的列:Right 或 Return 會展開它,Down 會選取它之後的一列。

在由右至左的版面中,列由右邊開始排列,所以 Left 和 Right 的作用互換,與該模式的規定一致:Left 展開資料夾並進入其中,Right 收合資料夾並選取父項目。Up、Down、Home 和 End 維持不變。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst:輕按會選取一列並展開或收合資料夾;輕按兩下會對項目執行動作(`onAction`)。
- 桌面平台(macOS、Windows、Linux、GPUI)和網頁:按一下會有相同效果,並讓樹狀檢視取得鍵盤焦點,上述按鍵即可在其中移動;雙擊會對項目執行動作。
- 每個平台都會繪製應用程式所設定樣式的內容:樹狀檢視、其列和列的內容。
