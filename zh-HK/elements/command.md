---
title: "Command"
description: "Command：命令面板，即一個搜尋欄位，會在使用者輸入時篩選應用程式的命令，可用作對話框中的 Cmd+K 面板、行內命令選單，或由應用程式回應的搜尋。支援虛擬化，以鍵盤操作為先，並為螢幕閱讀器提供 list box。每個部分的外觀均由應用程式自行決定。"
group: base
demo: el-command
source_hash: b1a002e27d282723
---


# Command

命令面板是由搜尋欄位加上命令列表組成的元件：用戶輸入幾個字母，列表便會收窄至符合的命令，方向鍵移動高亮，按 Return 執行高亮的命令。`Command` 負責處理其行為：篩選、分區、高亮、鍵盤操作，以及螢幕閱讀器讀出的內容。篩選以原生方式執行，列經過虛擬化處理，只會建立可見範圍內的列，因此即使面板有數千個命令、檔案或 emoji，每次按鍵都能即時篩選。外觀由應用程式決定：Command 本身不繪製任何內容，由應用程式為各部分（`itemClass`、`groupClass`、`searchClass` 等）設定樣式，並繪製列的內容（`renderItem`：圖示、標籤、快速鍵的按鍵）。

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` 源自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 的 `nsh-base` crate。當應用程式設定 `query` 時，查詢由應用程式掌管，並在 `onQueryChange` 中更新；未設定時，搜尋欄位自行保存查詢，初始值為 `defaultQuery`。項目以應用程式自訂的 `id` 識別，絕不以標籤識別：`onSelect({ id })` 會指出用戶選了哪一項。在 Rust 中，由 `command()` 建立，每個 prop 有對應的 setter（`.items(..)`、`.query(..)`、`.render_item(..)`），每個事件有對應的監聽方法，另有具型別的樣式方法。

## Items

`items` 是按順序排列的命令，每項為一個 `CommandItem`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | `string` | 它在 `onSelect` 和 `onHighlightChange` 中的識別依據：在所有項目中必須唯一。 |
| `label` | `string` | 除非由 `renderItem` 繪製，否則為其列所顯示的內容，同時是螢幕閱讀器讀出的內容，以及查詢所匹配的對象。 |
| `keywords` | `string[]` | 查詢會匹配的更多字詞：同義詞，或在已翻譯標籤旁附上的英文名稱。 |
| `group` | `string` | 所屬區段：同一組的相鄰項目會顯示在以此標題命名的標題列之下。 |
| `shortcut` | `string` | 同一命令的按鍵組合，依 [`keymap`](../modules/nsh.md#keymap) 的命名方式（`"mod+shift+p"`），供其列顯示。應用程式以 `keymap.bind` 綁定。 |
| `disabled` | `boolean` | 無法選取：按鍵會跳過它，按下沒有作用，並套用 `disabled:` 樣式。 |
| `checked` | `boolean` | 它是目前生效的一項（例如主題、語言）：套用 `checked:` 樣式，螢幕閱讀器會讀出它已勾選。 |

當項目的標籤或其中一個關鍵字包含查詢內容時（忽略大小寫及前後空格），查詢即匹配該項目。項目保持原有順序，沒有匹配項目的區段會連同其標題列一併隱藏。`renderItem` 會為每個可見的列收到一個 `CommandEntry`：包含項目的各欄位，以及 `shortcutLabel`，即提示在此處顯示的 `shortcut`（Apple 平台上為 `⇧⌘P`，其他平台為 `Ctrl+Shift+P`）。它代表項目本身，而高亮則是該列的 `focus:`：每個項目的繪製內容只製作一次，高亮移動時其視圖會保持不變。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | 按順序排列的命令。 |
| `query` | `.query(..)` | `string` | 無 | 查詢（受控），由應用程式在 `onQueryChange` 中設定。 |
| `defaultQuery` | `.default_query(..)` | `string` | 無 | 初始查詢，在未設定 `query` 時使用。 |
| `searchable` | `.searchable(..)` | `boolean` | `true` | 列上方的搜尋欄位。沒有搜尋欄位時會顯示所有項目，而 Command 本身成為鍵盤焦點的一個停駐點，並支援 typeahead。 |
| `filterable` | `.filterable(..)` | `boolean` | `true` | 查詢會篩選項目。關閉後會顯示所有項目：適用於由應用程式自行回應的搜尋（伺服器的結果以 `items` 設定）。新的查詢仍會高亮第一個項目。 |
| `loading` | `.loading(..)` | `boolean` | `false` | 搜尋正在進行：`empty` 會等待，而列表對螢幕閱讀器而言處於忙碌狀態。請在 `searchSuffix` 中顯示你的指示器。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 搜尋欄位的預留文字。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 搜尋欄位在顯示後取得鍵盤焦點：適用於打開後即供輸入的面板。 |
| `separator` | `.separator(..)` | `boolean` | `true` | 在兩個已顯示的區段之間加入分隔列，由 `separatorClass` 設定樣式；絕不會出現在最前、最後，也不會連續出現兩次。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對列表的稱呼（「Commands」），在未設定 `searchAccessibilityLabel` 時也是搜尋欄位的稱呼。 |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | 螢幕閱讀器對搜尋欄位的稱呼：說明它搜尋的內容（「Search commands」）。 |
| `header`、`footer` | `.header(..)`、`.footer(..)` | `JSX.Element` | 無 | 顯示在搜尋欄位上方（標題）及列下方（按鍵提示、數量）的內容。 |
| `empty` | `.empty(..)` | `JSX.Element` | 無 | 沒有任何項目顯示時所顯示的內容：查詢沒有匹配結果，或根本沒有項目。 |
| `searchPrefix`、`searchSuffix` | `.search_prefix(..)`、`.search_suffix(..)` | `JSX.Element` | 無 | 在搜尋列中顯示於搜尋欄位前後的內容：搜尋圖示，以及 `loading` 時的載入指示器。 |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | 無 | 可見的列的內容；未設定時，列會顯示項目的標籤。 |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | 無 | 區段的標題列（`{ heading }`）；未設定時，標題列會顯示其標題。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | Command 本身：其大小、外框和表面。 |
| `searchBarClass`、`searchBarStyle` | `.search_bar_class(..)`、`.search_bar_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | `searchPrefix`、搜尋欄位和 `searchSuffix` 所在的一行。 |
| `searchClass`、`searchStyle` | `.search_class(..)`、`.search_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 搜尋欄位。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 列的捲動檢視。請為它指定高度（`max-h-80`，或為 Command 指定尺寸）：列會在其中捲動，而且只會建立可見的列。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的列及其狀態（見下文）；其文字樣式會套用到標籤。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個區段的標題列。 |
| `separatorClass`、`separatorStyle` | `.separator_class(..)`、`.separator_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每條分隔線：線條的高度和顏色。 |

## Events

| 事件 | Rust | 載荷 | 觸發時機 |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | 用戶選取了一個項目：按 Return，或按下其列。 |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | 高亮已移動（因按鍵、指標、新查詢或新項目，`highlight`）：用於預覽按 Return 會執行的內容。 |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | 用戶在搜尋欄位中輸入，或按 Escape 清除了內容。 |
| `onCancel` | `.on_cancel(..)` | 無 | 查詢為空時按 Escape：關閉承載 Command 的容器（例如對話框的 `open`）。 |

## Parts

| 部分 | 位於 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| Command | | `class`、`style` | |
| `header` | Command | 應用程式的元素 | |
| 搜尋列 | Command | `searchBarClass`、`searchBarStyle` | |
| `searchPrefix`、搜尋欄位、`searchSuffix` | 搜尋列 | 應用程式的元素；`searchClass`、`searchStyle` | 欄位的 `focus:` |
| 列表 | Command | `listClass`、`listStyle` | |
| 區段的標題列 | 列表 | `groupClass`、`groupStyle`、`renderGroup` | |
| 分隔線 | 列表 | `separatorClass`、`separatorStyle` | |
| 列 | 列表 | `itemClass`、`itemStyle` | `focus:`（已高亮）、`checked:`、`disabled:`、`hover:`、`active:` |
| 列的內容 | 列 | `renderItem` | `group-focus:`、`group-checked:`、`group-disabled:`，位於 `itemClass` 的 `group` 之下 |
| `empty` | Command | 應用程式的元素 | |
| `footer` | Command | 應用程式的元素 | |

請以 `focus:` 顯示已高亮的列（參閱[設計指引](../docs/design-guides.md#interaction-states)）。

## Ref

| 方法 | 說明 |
|---|---|
| `focus()` | 令搜尋欄位取得鍵盤焦點（沒有搜尋欄位時，則令 Command 取得）。 |
| `highlight(id)` | 高亮 `id` 所指的項目，並將其列捲動至可見位置；若項目未顯示或已停用，則維持不變。 |
| `matchedCount()` | `Promise<number>`：查詢顯示了多少個項目（包括已停用的項目）。 |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

## A palette in a dialog

將 Command 放入 [`Dialog`](./dialog.md)，並以應用程式的快速鍵開啟。按 Escape 會先清除查詢；查詢為空時，則觸發 `onCancel`，由應用程式關閉對話框。

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

## A search the app answers

使用 `filterable={false}` 時，應用程式提供的每個項目都會顯示：由應用程式在 `onQueryChange` 中進行搜尋（例如伺服器、資料庫），並以 `items` 設定結果，在等待期間則設定 `loading`。

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

## Accessibility

- 列表的角色為 `"listbox"`，名稱由 `accessibilityLabel` 提供；每一列是一個 `"option"`，名稱為其項目的標籤，並隨項目而呈現已勾選和已停用的狀態；區段的標題列是 `"header"`，分隔線則會隱藏。
- 搜尋欄位是文字欄位，名稱由 `searchAccessibilityLabel` 提供（否則使用 `accessibilityLabel`）；其預留文字是在欄位為空時顯示的提示。
- 方向鍵移動高亮時，搜尋欄位會保持鍵盤焦點，而螢幕閱讀器會讀出已高亮的標籤。沒有搜尋欄位時，已高亮的列會取得螢幕閱讀器的焦點。
- 在 `loading` 期間，列表處於忙碌狀態。

有關標籤、角色和播報的一般說明，請參閱[無障礙功能](../docs/accessibility.md)。

## Keyboard

| 按鍵 | 作用 |
|---|---|
| 輸入文字 | 篩選項目；第一個已啟用的匹配項目會被高亮。 |
| Down、Up | 高亮下一個或上一個項目，並跳過已停用的項目，由最後一個循環至第一個，反之亦然。 |
| Page Down、Page Up | 按可見的列數移動高亮。 |
| Return | 選取已高亮的項目（`onSelect`）。 |
| Escape | 清除查詢；查詢為空時，回報 `onCancel`。 |
| Home、End | 沒有搜尋欄位時：移至第一個或最後一個項目（在欄位中則移動其插入點）。 |
| Space、字母、數字 | 沒有搜尋欄位時：Space 選取項目，字母和數字以 typeahead 方式高亮。 |

## Platform notes

- 桌面平台（macOS、Windows、Linux、GPUI）和網頁：指標移到哪一列，便高亮哪一列；點按在按鍵按下時即選取，因此搜尋欄位會保持鍵盤焦點。
- iOS、Android 和 Mac Catalyst：輕按即選取一列，鍵盤的 return 鍵會選取已高亮的項目，並保留欄位以便輸入下一個查詢。
- 各平台都會繪製應用程式所設定樣式的內容：Command、其搜尋列、其列及列的內容。
