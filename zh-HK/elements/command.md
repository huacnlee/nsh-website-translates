---
title: "Command"
description: "Command：命令面板，一個搜尋欄位，會在使用者輸入時篩選應用程式的命令：可以是對話框中的 Cmd+K 面板、行內命令選單，或由應用程式回應的搜尋。支援虛擬化，以鍵盤操作為優先，並為螢幕閱讀器提供 list box。每個部分的外觀都由應用程式決定。"
group: base
demo: el-command
---

# Command

命令面板是一個搭配命令清單的搜尋欄位：使用者輸入幾個字母，清單就會縮減為相符的命令，方向鍵移動醒目提示，按下 Return 即執行醒目提示的命令。`Command` 負責這類面板的行為：篩選、區段、醒目提示、鍵盤操作，以及螢幕閱讀器所朗讀的內容。篩選以原生方式執行，且資料列採用虛擬化：只會建立可見範圍內的資料列，因此即使面板有數千個命令、檔案或表情符號，每次按鍵都能即時篩選。外觀由應用程式決定：Command 本身不繪製任何內容，應用程式為各個部件（`itemClass`、`groupClass`、`searchClass` 等）設定樣式，並繪製資料列的內容（`renderItem`：圖示、標籤、快速鍵的按鍵）。

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

`Command` 源自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。當應用程式設定 `query` 時，查詢字串由應用程式掌控，並在 `onQueryChange` 中更新；未設定時，搜尋欄位會自行保存查詢字串，並從 `defaultQuery` 開始。項目以應用程式自訂的 `id` 識別，而不是以標籤識別：`onSelect({ id })` 會告知使用者選擇了哪一個。在 Rust 中由 `command()` 建立，每個 prop 各有一個 setter（`.items(..)`、`.query(..)`、`.render_item(..)`），每個事件各有一個監聽方法，另有具型別的樣式方法。

<a id="items"></a>

## 項目

`items` 是依序排列的命令，每個都是一個 `CommandItem`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | `string` | 在 `onSelect` 與 `onHighlightChange` 中用來識別該項目的值：在所有項目中必須唯一。 |
| `label` | `string` | 資料列所顯示的內容（除非由 `renderItem` 繪製）、螢幕閱讀器所朗讀的內容，以及查詢所比對的對象。 |
| `keywords` | `string[]` | 查詢會比對的更多字詞：同義詞，或翻譯後標籤旁的英文名稱。 |
| `group` | `string` | 它所屬的區段：同一群組中相鄰的項目會顯示在以此標題命名的標頭下。 |
| `shortcut` | `string` | 同一命令的按鍵組合，採用 [`keymap`](../modules/nsh.md#keymap) 的命名方式（`"mod+shift+p"`），供其資料列顯示。應用程式以 `keymap.bind` 進行綁定。 |
| `disabled` | `boolean` | 無法被選取：按鍵會跳過它、按下沒有作用，並套用 `disabled:` 樣式。 |
| `checked` | `boolean` | 它是目前生效的項目（例如佈景主題、語言）：套用 `checked:` 樣式，螢幕閱讀器會朗讀為已勾選。 |

當項目的標籤或其中一個關鍵字包含查詢字串時，查詢即與該項目相符，並忽略大小寫以及前後的空白。項目維持原有順序，沒有任何相符項目的區段會連同其標頭一併隱藏。`renderItem` 會為每個可見的資料列取得一個 `CommandEntry`：包含項目的各欄位，以及 `shortcutLabel`，也就是此處以提示方式顯示的 `shortcut`（Apple 平台上為 `⇧⌘P`，其他平台為 `Ctrl+Shift+P`）。它代表項目本身，而醒目提示則是資料列的 `focus:`：每個項目只會繪製一次，醒目提示移動時會保留其檢視。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | 依序排列的命令。 |
| `query` | `.query(..)` | `string` | 無 | 查詢字串（受控），由應用程式在 `onQueryChange` 中設定。 |
| `defaultQuery` | `.default_query(..)` | `string` | 無 | 初始的查詢字串，僅在未設定 `query` 時使用。 |
| `searchable` | `.searchable(..)` | `boolean` | `true` | 資料列上方的搜尋欄位。若沒有搜尋欄位，所有項目都會顯示，且 Command 會成為鍵盤焦點的一個停駐點，並支援輸入即跳轉（typeahead）。 |
| `filterable` | `.filterable(..)` | `boolean` | `true` | 由查詢字串篩選項目。關閉後會顯示所有項目：適用於由應用程式自行回應的搜尋（伺服器的結果會設為 `items`）。新的查詢字串仍會醒目提示第一個項目。 |
| `loading` | `.loading(..)` | `boolean` | `false` | 搜尋正在進行中：`empty` 會等待，且螢幕閱讀器會將清單視為忙碌中。請在 `searchSuffix` 中顯示你的指示器。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 搜尋欄位的預留文字。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 搜尋欄位在顯示後即取得鍵盤焦點：適用於開啟後就要輸入的面板。 |
| `separator` | `.separator(..)` | `boolean` | `true` | 在兩個已顯示的區段之間加入分隔列，由 `separatorClass` 設定樣式；不會出現在最前、最後或連續出現兩次。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對清單的稱呼（「Commands」），在未設定 `searchAccessibilityLabel` 時也是搜尋欄位的名稱。 |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | 螢幕閱讀器對搜尋欄位的稱呼：描述其搜尋的對象（「Search commands」）。 |
| `header`、`footer` | `.header(..)`、`.footer(..)` | `JSX.Element` | 無 | 顯示在搜尋欄位上方（標題）與資料列下方（按鍵提示、數量）的內容。 |
| `empty` | `.empty(..)` | `JSX.Element` | 無 | 沒有任何項目可顯示時所顯示的內容：查詢字串沒有任何相符項目，或根本沒有項目。 |
| `searchPrefix`、`searchSuffix` | `.search_prefix(..)`、`.search_suffix(..)` | `JSX.Element` | 無 | 顯示在搜尋列中搜尋欄位前後的內容：搜尋圖示、`loading` 時的載入指示器。 |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | 無 | 可見資料列的內容；未設定時，資料列顯示項目的標籤。 |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | 無 | 區段的標頭（`{ heading }`）；未設定時，標頭顯示其標題。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | Command 本身：其尺寸、框線與表面。 |
| `searchBarClass`、`searchBarStyle` | `.search_bar_class(..)`、`.search_bar_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | `searchPrefix`、搜尋欄位與 `searchSuffix` 所在的列。 |
| `searchClass`、`searchStyle` | `.search_class(..)`、`.search_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 搜尋欄位。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 資料列的捲動檢視。請為它指定高度（`max-h-80`，或設定 Command 的尺寸）：資料列會在其中捲動，且只會建立可見的資料列。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的資料列及其狀態（見下方）；其文字樣式會作用於標籤。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個區段的標頭。 |
| `separatorClass`、`separatorStyle` | `.separator_class(..)`、`.separator_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每條分隔線：分隔線的高度與顏色。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | 使用者選擇了一個項目：按下 Return，或按下其資料列。 |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | 醒目提示移動時（按鍵、指標、新的查詢字串或新的項目、`highlight`）：用於預覽按下 Return 會執行的內容。 |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | 使用者在搜尋欄位中輸入，或按下 Escape 清除了內容。 |
| `onCancel` | `.on_cancel(..)` | 無 | 查詢字串為空時按下 Escape：關閉容納 Command 的元件（例如對話框的 `open`）。 |

<a id="parts"></a>

## 部件

| 部件 | 所在位置 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| Command 本身 | | `class`、`style` | |
| `header` | Command | 應用程式的元素 | |
| 搜尋列 | Command | `searchBarClass`、`searchBarStyle` | |
| `searchPrefix`、搜尋欄位、`searchSuffix` | 搜尋列 | 應用程式的元素；`searchClass`、`searchStyle` | 欄位的 `focus:` |
| 清單 | Command | `listClass`、`listStyle` | |
| 區段的標頭 | 清單 | `groupClass`、`groupStyle`、`renderGroup` | |
| 分隔線 | 清單 | `separatorClass`、`separatorStyle` | |
| 資料列 | 清單 | `itemClass`、`itemStyle` | `focus:`（醒目提示）、`checked:`、`disabled:`、`hover:`、`active:` |
| 資料列的內容 | 資料列 | `renderItem` | `group-focus:`、`group-checked:`、`group-disabled:`（位於 `itemClass` 中的 `group` 之下） |
| `empty` | Command | 應用程式的元素 | |
| `footer` | Command | 應用程式的元素 | |

請以 `focus:` 顯示醒目提示的資料列（參閱[設計指南](../docs/design-guides.md#interaction-states)）。

## Ref

| 方法 | 說明 |
|---|---|
| `focus()` | 讓搜尋欄位取得鍵盤焦點（若沒有搜尋欄位，則由 Command 取得）。 |
| `highlight(id)` | 醒目提示 `id` 所指的項目，並將其資料列捲動至可見範圍；未顯示或已停用的項目則維持不變。 |
| `matchedCount()` | `Promise<number>`：查詢字串所顯示的項目數量，包含已停用的項目。 |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## 對話框中的命令面板

將 Command 放入 [`Dialog`](./dialog.md)，並以應用程式的快速鍵開啟。Escape 會先清除查詢字串；查詢字串為空時，則觸發 `onCancel`，由應用程式關閉對話框。

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

<a id="a-search-the-app-answers"></a>

## 由應用程式回應的搜尋

設定 `filterable={false}` 後，會顯示應用程式提供的所有項目：應用程式在 `onQueryChange` 中進行搜尋（伺服器、資料庫），並以結果設定 `items`，等待期間則設定 `loading`。

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

<a id="accessibility"></a>

## 無障礙

- 清單的角色為 `"listbox"`，由 `accessibilityLabel` 命名；每個資料列是一個 `"option"`，以其項目的標籤命名，勾選與停用狀態與其項目一致；區段的標頭是 `"header"`，分隔線則會被隱藏。
- 搜尋欄位是一個文字欄位，由 `searchAccessibilityLabel` 命名（否則由 `accessibilityLabel` 命名）；其預留文字是在欄位為空時顯示的提示。
- 方向鍵移動醒目提示時，搜尋欄位仍保有鍵盤焦點，螢幕閱讀器會朗讀醒目提示的標籤。沒有搜尋欄位時，醒目提示的資料列會取得螢幕閱讀器的焦點。
- 當 `loading` 時，清單處於忙碌狀態。

標籤、角色與公告的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

| 按鍵 | 作用 |
|---|---|
| 輸入文字 | 篩選項目；第一個相符且可用的項目會被醒目提示。 |
| Down、Up | 醒目提示下一個或上一個項目，並跳過已停用的項目，從最後一個循環到第一個，反之亦然。 |
| Page Down、Page Up | 依可見的資料列數移動醒目提示。 |
| Return | 選擇醒目提示的項目（`onSelect`）。 |
| Escape | 清除查詢字串；查詢字串為空時，回報 `onCancel`。 |
| Home、End | 沒有搜尋欄位時：跳到第一個或最後一個項目（在欄位中則移動其插入點）。 |
| Space、字母、數字 | 沒有搜尋欄位時：Space 選擇項目，字母與數字則以輸入即跳轉（typeahead）醒目提示。 |

<a id="platform-notes"></a>

## 平台說明

- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：指標會醒目提示其移過的資料列，且在按下按鈕的當下即選擇項目，因此搜尋欄位會保有鍵盤焦點。
- iOS、Android 與 Mac Catalyst：點一下即選擇資料列，鍵盤的 return 鍵會選擇醒目提示的項目，並讓欄位保持可輸入，以便輸入下一個查詢。
- 每個平台都會繪製應用程式所設定樣式的內容：Command、其搜尋列、資料列及其內容。
