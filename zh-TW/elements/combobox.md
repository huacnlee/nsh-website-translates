---
title: "Combobox"
description: "Combobox 元件：透過在輸入框中輸入文字來篩選項目清單，並從中選取一個或多個值；在桌面裝置上以欄位下方的彈出視窗呈現，在手機上則以底部面板呈現，樣式由應用程式自行定義。"
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Combobox 可從項目清單中選取值，可單選，或搭配 `multiple` 複選：例如文章的標籤、頻道的成員、文件的語言。它的觸發元件是輸入框：輸入文字會開啟清單並篩選項目，與 shadcn/ui 的 combobox 相同。它是 [Select](./select.md) 的姊妹元件，共用同一份清單，並依各種裝置的慣例呈現：

- 在桌面平台與桌面瀏覽器上，是欄位下方的彈出視窗，寬度與欄位相同（可由應用程式的 `popupStyle` / `popupClass` 寬度另行設定），高度依列數而定，最高不超過周圍可用的空間。
- 在手機與平板上，是螢幕底部的面板（sheet），後方有背景遮罩。

Combobox 負責行為：值（由應用程式持有，或由自身持有）、開啟狀態、鍵盤操作、搜尋、分區、醒目提示的列，以及螢幕閱讀器所朗讀的內容。使用 `multiple` 時，每次選擇都會切換該項目是否在值中，且清單保持開啟，因此可一次選取多個項目。外觀由應用程式決定：可為欄位、彈出視窗、清單、列、分區標題、輸入框與頁尾設定樣式，或自行繪製各列。

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`combobox()` 會建立一個 combobox，每個 prop 對應一個 setter（`.items(..)`、`.value(..)`、`.multiple(..)`），每個事件對應一個監聽器（`.on_change(..)`）。它的項目與 `Select` 相同：`SelectItem::new(value, title)`，包含 `.disabled(..)` 與 `.group(..)`，並可如 select 一般分成多個分區（見 [Items](./select.md#items)）。

## Value

值是由所選項目的值組成的陣列。使用 `value` 時，值由應用程式持有：combobox 會將這些項目顯示為已選取，並以 `onChange({ value })` 回報每次變更；應用程式可設定 `value` 來跟隨變更，或自行保留一份值。若省略，combobox 會自行保存值，起初取自 `defaultValue`。

- 使用 `multiple` 時，按下、Return 或 Space 會切換醒目提示的項目：原本不在值中就加入，原本在值中就移除。清單保持開啟。
- 不使用時，選擇會以該項目的值取代整個值並關閉清單；再次選擇已選取的項目只會關閉清單。

`onConfirm({ value })` 會在清單關閉時告知目前的值：每次開啟只觸發一次，無論以何種方式關閉（選擇、Escape、在外部按下、觸發按鈕），所帶的值都是使用者離開時的狀態。在 Mac 上按 Cmd+Return（其他平台為 Ctrl+Return）會關閉清單並確認。

`cleanable` 會在有項目被選取時加入清除按鈕：按下會清空值（`onChange({ value: [] })`）。此按鈕位於輸入框之後、觸發按鈕之前；按下它絕不會開啟清單。其內容由應用程式填入，方式與 [select 的清除按鈕](./select.md#value)相同。

## Input

觸發元件是 combobox 那一列中的文字輸入框（其 `class` 與 `style`：欄位的邊框與填色），前方有應用程式提供的 `prefix`（以標籤形式顯示的已選項目、圖示），後方則依序是清除按鈕、應用程式提供的 `triggerButton`（例如箭頭符號）與 `suffix`。

- 輸入文字會開啟清單，並依標題篩選項目，不分大小寫；沒有任何項目符合時會顯示 `empty`。按下 Down 與 Up 同樣會開啟清單，按下觸發按鈕可開啟與關閉清單，在觸控螢幕上點一下輸入框即可開啟。
- 單選時，輸入框會顯示所選項目的標題（尚無選取時顯示 `placeholder`）。輸入框取得焦點時，內容會被全選，因此輸入的文字會取代原有內容。
- 使用 `multiple` 時，輸入框顯示的是查詢字串；所選項目由應用程式顯示，可放在 `prefix` 中或 combobox 旁邊。

查詢字串可由 combobox 自行持有，每次開啟都從 `defaultQuery` 開始（未設定則為空），也可由應用程式以 `query` 持有：`onQueryChange({ query })` 會回報所輸入的內容，應用程式可設定 `query` 來跟隨，以自己的方式篩選，或提供一個起始建議。

## Footer

`footer` 是列下方的內容，位於自己專屬的區塊（`footerClass`、`footerStyle`）：例如一個動作（「Manage tags」）、一個計數或一則提示。列捲動時，它會停留在原位。

## Props

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 項目，依順序排列。 |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 選擇會切換該項目是否在值中，且清單保持開啟。 |
| `value` | `.value(..)` | `string[]` | 無 | 所選項目的值，由應用程式持有。 |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | 初始的值，未使用 `value` 時適用。 |
| `open`、`defaultOpen` | `.open(..)`、`.default_open(..)` | `boolean` | `false` | 開啟狀態，由應用程式或 combobox 自行持有。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 輸入框的預留文字，在輸入框為空時顯示。 |
| `query` | `.query(..)` | `string` | 無 | 查詢字串，由應用程式持有。 |
| `defaultQuery` | `.default_query(..)` | `string` | 無 | 每次開啟時的起始查詢字串，未使用 `query` 時適用。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 有項目被選取時顯示清除按鈕；按下會清空值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 保持關閉，不接受按下操作，也不接受鍵盤焦點。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 此選擇的用途說明，供螢幕閱讀器使用。 |
| `placement`、`align`、`offset`、`margin` | `.placement(..)`, ... | 同 `Select` | `"bottom"`、`"start"`、0、0 | 桌面平台：彈出視窗相對於欄位的位置。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗（桌面平台）或面板（觸控螢幕）。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 面板後方的背景遮罩。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清單，即列的捲動檢視。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的列：醒目提示時為 `focus:`，已選取時為 `selected:`，無法選取時為 `disabled:`。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分區的標題。 |
| `inputClass`、`inputStyle` | `.input_class(..)`、`.input_style(..)` | `string`、`StyleProp<InputStyle>` | 無 | 輸入框：編輯時為 `focus:`，與 combobox 同時作用時為 `disabled:`。 |
| `footerClass`、`footerStyle` | `.footer_class(..)`、`.footer_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 頁尾，位於列下方。 |
| `clearButtonClass`、`clearButtonStyle` | `.clear_button_class(..)`、`.clear_button_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清除按鈕（`cleanable`）。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 無 | 清除按鈕的內容。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對清除按鈕的稱呼。 |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | 無 | 輸入框後方的按鈕（箭頭符號）：按下會開啟與關閉清單。 |
| `prefix` | `.prefix(..)` | `JSX.Element` | 無 | 輸入框前方的內容：標籤、圖示。 |
| `suffix` | `.suffix(..)` | `JSX.Element` | 無 | 觸發按鈕後方的內容。 |
| `empty` | `.empty(..)` | `JSX.Element` | 無 | 沒有任何項目可顯示時，清單所顯示的內容。 |
| `footer` | `.footer(..)` | `JSX.Element` | 無 | 顯示於列下方的內容。 |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | 無 | 由應用程式依項目本身（而非其狀態）繪製的項目列：內容依列的 `group-focus:`、`group-selected:` 與 `group-disabled:`（`itemClass` 中的 `group`）而定，因此醒目提示的移動或切換不會重新繪製任何內容；未設定時顯示項目的標題。 |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | 無 | 由應用程式繪製的分區標題；未設定時顯示其標題。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 欄位：由前綴、輸入框、按鈕與後綴組成的一列；清單的寬度與它相同。 |

## Events

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 值已變更（選擇、切換、清除按鈕）：`{ value }`，即所選項目的值。設定 `value` 以跟隨變更。 |
| `onConfirm` | `.on_confirm(\|value\| ..)` | 清單已關閉：`{ value }` 為此時的值，每次開啟只觸發一次。 |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | 使用者在輸入框中輸入文字：`{ query }`。設定 `query` 以跟隨變更。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 清單已開啟或關閉，並附上原因（`{ open, reason }`）。設定 `open` 以跟隨變更。 |
| `onOpen`、`onClose` | `.on_open(..)`、`.on_close(..)` | 清單已顯示，或已消失。 |
| `onCancel` | `.on_cancel(..)` | 使用者在沒有會關閉清單的選擇下關閉了清單（Escape 或返回、在外部或背景遮罩上按下）。 |

它們依下列順序觸發：選擇時先觸發 `onChange`，未選擇就關閉時先觸發 `onCancel`，接著是 `onOpenChange`，清單關閉時再觸發 `onConfirm`，最後在清單顯示或消失後觸發 `onOpen` 或 `onClose`。

## Parts

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 欄位 | combobox 的檢視，一列 | `class`、`style` |
| 前綴 | 欄位中，最前面 | 應用程式自己的元素（`prefix`） |
| 輸入框 | 欄位中，前綴之後 | `inputClass`、`inputStyle`、`placeholder` |
| 清除按鈕 | 欄位中，輸入框之後（`cleanable`，有項目被選取時） | `clearButtonClass`、`clearButtonStyle`；其內容為 `clearButton` |
| 觸發按鈕 | 欄位中，清除按鈕之後 | 應用程式自己的元素（`triggerButton`） |
| 後綴 | 欄位中，最後面 | 應用程式自己的元素（`suffix`） |
| 彈出視窗或面板 | 位於所有內容之上，在欄位下方（桌面平台）或螢幕底部（觸控螢幕） | `popupClass`、`popupStyle` |
| 背景遮罩 | 面板後方（觸控螢幕） | `backdropClass`、`backdropStyle` |
| 清單 | 彈出視窗中 | `listClass`、`listStyle` |
| 分區標題 | 清單中，位於其項目之前 | `groupClass`、`groupStyle`、`renderGroup` |
| 項目的列 | 清單中 | `itemClass`、`itemStyle`、`renderItem`（內部為 `group-focus:`、`group-selected:`、`group-disabled:`，位於 `itemClass` 的 `group` 之下） |
| 空狀態 | 彈出視窗中，沒有任何項目顯示時 | 專屬的元素（`empty`） |
| 頁尾 | 彈出視窗中，最後面 | `footerClass`、`footerStyle`；其內容為 `footer` |

## Keyboard

當輸入框保持焦點時，按鍵操作與 select 相同（見 [Keyboard](./select.md#keyboard)），但有以下差異：字母與數字會輸入到輸入框中並篩選清單，而不是進行 typeahead；Down 與 Up 會開啟已關閉的清單；使用 `multiple` 時，Return 會切換醒目提示的項目並保持清單開啟；在 Mac 上按 Cmd+Return（其他平台為 Ctrl+Return）會關閉清單並確認。在桌面平台上清單關閉時，輸入框會保持焦點。

## Accessibility

- 對螢幕閱讀器而言，輸入框是一個 combobox：其標籤為 `accessibilityLabel`，其值為所選項目的標題（以逗號連接），並會說明清單是否已展開。`disabled` 會使它呈現為暗淡狀態。
- 清單是 listbox，每一列是一個 option，以其標題命名；已選取的 option 會標示為已選取，停用的則呈現為暗淡。分區標題是標題（header）。
- 清除按鈕是以 `clearButtonAccessibilityLabel` 命名的按鈕；它不是 Tab 的停駐點。觸發按鈕對螢幕閱讀器隱藏，因為輸入框已說明清單是否開啟，它同樣不是 Tab 的停駐點。

標籤、角色與朗讀內容的一般說明，請見 [Accessibility](../docs/accessibility.md)。
