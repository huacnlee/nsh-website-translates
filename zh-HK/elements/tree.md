---
title: "Tree"
description: "Tree：項目可包含其他項目，能展開與收合，並可選取其中一個，例如專案的檔案、設定側邊欄、大綱。支援虛擬化，在鍵盤焦點順序中僅佔一個停駐點，並為螢幕閱讀器提供樹狀結構。每一列的外觀由應用程式自行決定。"
group: base
demo: el-tree
---

# Tree

樹狀結構用來顯示包含其他項目的項目：專案的檔案與資料夾、設定側邊欄的各個區段、文件的大綱。`Tree` 負責其行為：哪些項目已展開、哪一個已選取、鍵盤操作，以及螢幕閱讀器所朗讀的內容。它的資料列採用虛擬化：只建立可見範圍內的資料列，收合項目的子項目則完全不會建立，因此擁有數千個項目的樹也能立即開啟並捲動。外觀由應用程式決定：樹本身不繪製任何內容，應用程式為每個資料列設定樣式（`itemClass`）並繪製其內容（`renderItem`：圖示、依項目深度縮排的標籤、箭頭符號、徽章）。

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

`Tree` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。當應用程式設定 `expanded` 與 `selected`，並在 `onExpandedChange` 與 `onSelectedChange` 中更新它們時，展開的項目與選取的項目由應用程式掌管；若未設定，樹會自行維持狀態，從 `defaultExpanded` 與 `defaultSelected` 開始。項目以其 `id` 識別，這是應用程式自己的值（路徑、記錄的鍵），絕不以標籤識別。在 Rust 中，`tree()` 負責建立它，每個屬性有一個 setter（`.items(..)`、`.expanded(..)`、`.render_item(..)`），每個事件有一個監聽方法，並提供具型別的樣式方法。

## Items

`items` 是最上層的項目，每個都是一個 `TreeItem`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | `string` | 在 `expanded`、`selected` 與各事件中用來識別它的值：在整棵樹中必須唯一（id 重複時會記錄日誌，且只有第一個項目能展開或被選取）。 |
| `label` | `string` | 其資料列顯示的內容（除非由 `renderItem` 繪製）、螢幕閱讀器朗讀的內容，以及 typeahead 比對的對象。 |
| `children` | `TreeItem[]` | 其下的項目，依順序排列。只要有任何子項目，它就是資料夾：可展開與收合。 |
| `disabled` | `boolean` | 使用者無法選取、展開或收合它：點按與按鍵都會略過它，`disabled:` 樣式會生效。其子項目依 `expanded` 的設定而定。 |

`renderItem` 會為每個可見的資料列取得一個 `TreeEntry`：項目的 `id`、`label` 與 `disabled`、其 `depth`（最上層為 0，最上層項目之下為 1，依此類推），以及它是否為 `folder`。它描述項目本身是什麼，而資料列的狀態則以 class 表示：每個項目的內容只繪製一次，並在資料列被選取、展開或收合時保留其 view，因此箭頭符號可以帶著轉場動畫旋轉。

## Props

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | 最上層的項目，每個項目都帶有其下的項目。 |
| `expanded` | `.expanded(..)` | `string[]` | 無 | 已展開項目的 id（受控）。只有在上層所有項目都已展開時，項目才會顯示。 |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | 在未設定 `expanded` 時，起始時已展開的項目。 |
| `selected` | `.selected(..)` | `string \| null` | 無 | 已選取項目的 id（受控），`null` 表示未選取任何項目。 |
| `defaultSelected` | `.default_selected(..)` | `string` | 無 | 在未設定 `selected` 時，起始時已選取的項目。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 唯讀的樹：不接受點按或按鍵，不會成為鍵盤焦點的停駐點，每個資料列都帶有 `disabled:`；它顯示 `expanded` 與 `selected` 所指定的內容。 |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 展開與收合時，該項目之後的資料列會以彈簧動畫（原生執行）移動到新位置。在減少動態效果時會關閉。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器稱呼這棵樹的名稱（「Files」）。 |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | 無 | 可見資料列的內容；若未提供，資料列會顯示項目的標籤。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個資料列：其高度、內距、表面與狀態（見下方）；其文字樣式會作用於標籤。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 樹內部資料列的捲動檢視：其內距與間距。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 樹本身。請為它指定高度（或在有高度的父層中使用 `flex-1`）：資料列會在其內捲動，且只會建立可見範圍內的資料列。 |

## Events

| 事件 | Rust | 內容 | 時機 |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | 使用者展開或收合了某個項目（點按、Return、Space、Right 或 Left、`revealItem`）：內容為變更後會得到的已展開 id。 |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | 使用者選取了另一個項目（點按、方向鍵、Home、End、typeahead）。 |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | 使用者展開了 `id` 對應的項目，發生在 `onExpandedChange` 之後。 |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | 使用者收合了 `id` 對應的項目，發生在 `onExpandedChange` 之後。 |
| `onAction` | `.on_action(..)` | `{ id: string }` | 使用者對 `id` 對應的項目執行了動作：在沒有子項目的已選取項目上按 Return，或對任何項目按兩下或連點兩下，發生在該次點按本身的事件之後。已停用的項目與已停用的樹絕不會回報此事件。 |

選取會跟隨方向鍵，因此檔案總管應在 `onAction` 而非 `onSelectedChange` 中開啟檔案：在檔案之間移動時會逐一預覽，按 Return 或按兩下才會開啟使用者想要的那一個。

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

## Parts

| 部分 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 樹 | | `class`、`style` | |
| 清單 | 樹 | `listClass`、`listStyle` | |
| 資料列 | 清單 | `itemClass`、`itemStyle` | `selected:`、`aria-expanded:`（已開啟的資料夾）、`focus:`（當樹擁有鍵盤焦點時，按鍵所作用的資料列：已選取的資料列、隱藏的選取項目所在的已收合項目，或在未選取任何項目時的第一個資料列）、`disabled:`、`hover:`、`active:` |
| 資料列的內容 | 資料列 | `renderItem` | `group-selected:`、`group-aria-expanded:`、`group-focus:`，以及在 `itemClass` 中 `group` 之下的 `group-disabled:` |

以 `selected:` 顯示已選取的資料列，並以 `focus:` 顯示鍵盤所在的位置（參見[設計指南](../docs/design-guides.md#interaction-states)）。請將焦點繪製在資料列內部（`focus:outline-2 focus:-outline-offset-2`）：清單會裁切超出其兩側的內容。

## Ref

| 方法 | 說明 |
|---|---|
| `focus()` | 取得鍵盤焦點，效果與按 Tab 移到樹上相同。 |
| `revealItem(id)` | 展開 `id` 對應項目之上的各個項目（以 `onExpandedChange` 與 `onExpand` 回報，最外層優先），並在其資料列顯示後將它捲動到可見範圍：若應用程式跟隨此變更，會立即執行；若沒有跟隨，請求就此結束。 |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

## Disabled

已停用的項目不接受點按，方向鍵會略過它，螢幕閱讀器會將它宣告為已變暗。在樹上設定 `disabled` 會使其成為唯讀：它顯示應用程式狀態所指定的內容，不接受任何輸入。

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

## Accessibility

- 樹的角色為 `"tree"`，其名稱由 `accessibilityLabel` 指定；每個資料列是一個 `"treeitem"`，名稱為其項目的標籤，並帶有其層級（深度 + 1）、是否已展開（資料夾）、是否已選取以及是否已停用。
- 當樹取得鍵盤焦點，以及按鍵移動選取項目時，按鍵所作用的資料列會取得螢幕閱讀器的焦點。

關於標籤、角色與宣告的一般說明，請參閱[無障礙](../docs/accessibility.md)。

## Keyboard

在桌面平台與網頁上，Tab 可到達接受點按的 view，此時 `Tree` 遵循 [WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 一步進入樹，也一步離開樹；再回來時，按鍵會從已選取的資料列繼續。若未選取任何項目，焦點會顯示在第一個資料列上，按 Down 會選取它。 |
| Down、Up | 選取下一個或上一個資料列，略過已停用的項目，由最後一個循環到第一個，反之亦然。 |
| Right | 展開已收合的資料夾；在已展開的資料夾上，選取其第一個可用的子項目。 |
| Left | 收合已展開的資料夾；在其他項目上，選取其父項目。 |
| Home、End | 選取第一個或最後一個資料列。 |
| Return | 展開或收合已選取的資料夾；在沒有子項目的項目上，對它執行動作（`onAction`）。 |
| Space | 展開或收合已選取的資料夾。 |
| 字母、數字 | 選取下一個標籤以所輸入內容開頭的資料列。 |

當選取項目被隱藏在已收合的項目之下（由應用程式收合）時，按鍵會作用於該項目的資料列：Right 或 Return 會展開它，Down 會選取它之後的資料列。

在由右至左的版面配置中，資料列從右側開始排列，因此 Left 與 Right 會互換，與該 pattern 的規定相同：Left 展開資料夾並進入其中，Right 收合它並選取其父項目。Up、Down、Home 與 End 維持不變。

## Platform notes

- iOS、Android 與 Mac Catalyst：點一下會選取資料列，並展開或收合資料夾；連點兩下則對該項目執行動作（`onAction`）。
- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：點按的效果相同，並會讓樹取得鍵盤焦點，上述按鍵即可在其中移動；按兩下則對該項目執行動作。
- 所有平台都會繪製應用程式所設定樣式的內容：樹、其資料列及其內容。
