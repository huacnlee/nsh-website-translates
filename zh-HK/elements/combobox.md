---
title: "Combobox"
description: "Combobox 元件:可從清單中選取一個或多個值,清單項目會根據在輸入框中輸入的內容進行篩選;在桌面裝置上以欄位下方的彈出視窗顯示,在手機上則以底部面板顯示,外觀樣式由應用程式自行設定。"
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---


# Combobox

Combobox 從項目列表中選取值，可選一個，或在 `multiple` 下選取多個：文章的標籤、頻道的成員、文件的語言。它的觸發元件是一個輸入框：輸入文字會開啟並篩選列表，與 shadcn/ui 的 combobox 一樣。它是 [Select](./select.md) 的姊妹元件，並共用其列表，按各種裝置的習慣呈現：

- 在桌面平台和桌面瀏覽器上，是欄位下方的彈出視窗，寬度與欄位相同（應用程式的 `popupStyle` / `popupClass` 寬度可另行設定），高度依列數而定，最高為旁邊可用的空間。
- 在手機和平板上，是螢幕底部的面板，下方有背景遮罩。

Combobox 負責行為：值（由應用程式持有，或由它自己持有）、開啟狀態、鍵盤操作、搜尋、分組、高亮的列，以及螢幕閱讀器所讀出的內容。使用 `multiple` 時，選擇某個項目會在值中切換該項目，列表保持開啟，因此可以一次選取多個。外觀由應用程式決定：它為欄位、彈出視窗、列表、列、分組標題、輸入框和頁腳設定樣式，或自行繪製各列。

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

`Combobox` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`combobox()` 會建立一個 combobox，每個屬性有一個 setter（`.items(..)`、`.value(..)`、`.multiple(..)`），每個事件有一個監聽器（`.on_change(..)`）。其項目與 `Select` 的相同：`SelectItem::new(value, title)`，帶有 `.disabled(..)` 和 `.group(..)`，可如 select 般分組（見[項目](./select.md#items)）。

<a id="value"></a>

## 值

值是由已選項目的值組成的陣列。使用 `value` 時，值由應用程式持有：combobox 會將這些項目顯示為已選，並以 `onChange({ value })` 回報每次變更；應用程式把 `value` 設為相應的值以跟隨變更，或自行保留一份值。
若省略，combobox 會自行保留值，起始值來自 `defaultValue`。

- 使用 `multiple` 時，按下、Return 或 Space 會切換高亮的項目：原本不在值中就加入，原本已在值中就移除。列表保持開啟。
- 不使用時，選擇會以該項目的值取代原有的值並關閉列表；再次選擇已選的項目只會關閉列表。

`onConfirm({ value })` 會在列表關閉時告知值：每次開啟只觸發一次，無論以何種方式關閉（選擇、Escape、在外部按下、觸發按鈕），所帶的值都是用戶最終留下的值。在 Mac 上按 Cmd+Return（其他平台為 Ctrl+Return）會關閉列表並確認。

`cleanable` 會在有項目被選取時加入清除按鈕：按下會清空值（`onChange({ value: [] })`）。
該按鈕位於輸入框之後、觸發按鈕之前；按下它不會開啟列表。內容由應用程式填入，方式與 [select 的清除按鈕](./select.md#value)相同。

<a id="input"></a>

## 輸入框

觸發元件是 combobox 所在列中的文字輸入框（其 `class` 和 `style`：欄位的邊框和填色），前面是應用程式的 `prefix`（以標籤形式顯示已選項目、圖示），後面依次是清除按鈕、應用程式的 `triggerButton`（箭咀圖示）和 `suffix`。

- 輸入文字會開啟列表，並按標題篩選項目，不分大小寫；沒有任何項目符合時會顯示 `empty`。按 Down 和 Up 同樣會開啟列表，按觸發按鈕會開啟和關閉列表，在觸控螢幕上，輕按輸入框會開啟列表。
- 只有一個值時，輸入框會顯示已選項目的標題（沒有選取時顯示 `placeholder`）。輸入框獲得焦點時，內容會被選取，因此輸入的文字會取代它。
- 使用 `multiple` 時，輸入框顯示查詢文字；已選項目由應用程式顯示，可放在 `prefix` 中或 combobox 旁邊。

查詢文字可以由 combobox 自行持有，每次開啟時從 `defaultQuery` 開始（否則為空），也可以由應用程式以 `query` 持有：`onQueryChange({ query })` 會回報所輸入的內容，應用程式把 `query` 設為相應的值以跟隨變更，以自己的方式篩選，或提供一個起始建議。

<a id="footer"></a>

## 頁腳

`footer` 是列下方的內容，位於獨立的部分（`footerClass`、`footerStyle`）：可以是一個操作（「管理標籤」）、一個計數或一則提示。列捲動時，它保持原位。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 按順序排列的項目。 |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 選擇會在值中切換該項目，列表保持開啟。 |
| `value` | `.value(..)` | `string[]` | 無 | 已選項目的值，由應用程式持有。 |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | 起始值，不使用 `value` 時適用。 |
| `open`、`defaultOpen` | `.open(..)`、`.default_open(..)` | `boolean` | `false` | 開啟狀態，由應用程式或 combobox 自行持有。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 輸入框為空時顯示的佔位文字。 |
| `query` | `.query(..)` | `string` | 無 | 查詢文字，由應用程式持有。 |
| `defaultQuery` | `.default_query(..)` | `string` | 無 | 每次開啟時的起始查詢文字，不使用 `query` 時適用。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 有項目被選取時顯示清除按鈕；按下會清空值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 保持關閉，不接受按下操作或鍵盤焦點。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 這項選擇的用途，供螢幕閱讀器使用。 |
| `placement`、`align`、`offset`、`margin` | `.placement(..)`, ... | 同 `Select` | `"bottom"`、`"start"`、0、0 | 桌面平台：彈出視窗相對於欄位的位置。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗（桌面平台）或面板（觸控螢幕）。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 面板後方的背景遮罩。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 列表，即各列的捲動視圖。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的列：高亮時為 `focus:`，已選取時為 `selected:`，無法選取時為 `disabled:`。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分組的標題。 |
| `inputClass`、`inputStyle` | `.input_class(..)`、`.input_style(..)` | `string`、`StyleProp<InputStyle>` | 無 | 輸入框：編輯時為 `focus:`，隨 combobox 一起時為 `disabled:`。 |
| `footerClass`、`footerStyle` | `.footer_class(..)`、`.footer_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 頁腳，位於各列下方。 |
| `clearButtonClass`、`clearButtonStyle` | `.clear_button_class(..)`、`.clear_button_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清除按鈕（`cleanable`）。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 無 | 清除按鈕的內容。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對清除按鈕的稱呼。 |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | 無 | 輸入框後的按鈕（箭咀圖示）：按下會開啟和關閉列表。 |
| `prefix` | `.prefix(..)` | `JSX.Element` | 無 | 輸入框前的內容：標籤、圖示。 |
| `suffix` | `.suffix(..)` | `JSX.Element` | 無 | 觸發按鈕後的內容。 |
| `empty` | `.empty(..)` | `JSX.Element` | 無 | 沒有任何項目可顯示時，列表所顯示的內容。 |
| `footer` | `.footer(..)` | `JSX.Element` | 無 | 顯示於各列下方的內容。 |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | 無 | 由應用程式根據項目本身（而非其狀態）繪製的列：內容跟隨該列的 `group-focus:`、`group-selected:` 和 `group-disabled:`（`itemClass` 中的 `group`），因此高亮移動或切換選取時不會重新繪製；否則顯示項目的標題。 |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | 無 | 由應用程式繪製的分組標題；否則顯示其標題。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 欄位：由前綴、輸入框、按鈕和後綴組成的一列；列表與它同寬。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 值已變更（選擇、切換、清除按鈕）：`{ value }`，即已選項目的值。把 `value` 設為相應的值以跟隨變更。 |
| `onConfirm` | `.on_confirm(\|value\| ..)` | 列表已關閉：帶有此時的 `{ value }`，每次開啟只觸發一次。 |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | 用戶在輸入框中輸入文字：`{ query }`。把 `query` 設為相應的值以跟隨變更。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 列表已開啟或關閉，並附上原因（`{ open, reason }`）。把 `open` 設為相應的值以跟隨變更。 |
| `onOpen`、`onClose` | `.on_open(..)`、`.on_close(..)` | 列表已顯示，或已消失。 |
| `onCancel` | `.on_cancel(..)` | 用戶在沒有作出會關閉列表的選擇下關閉了列表（Escape 或返回、在外部或背景遮罩上按下）。 |

它們依以下順序觸發：選擇時先觸發 `onChange`，沒有選擇而關閉時先觸發 `onCancel`，然後是 `onOpenChange`，列表關閉時是 `onConfirm`，列表顯示或消失後是 `onOpen` 或 `onClose`。

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定 |
|---|---|---|
| 欄位 | combobox 的視圖，一列 | `class`、`style` |
| 前綴 | 欄位，最前面 | 應用程式自己的元素（`prefix`） |
| 輸入框 | 欄位，前綴之後 | `inputClass`、`inputStyle`、`placeholder` |
| 清除按鈕 | 欄位，輸入框之後（`cleanable`，有項目被選取時） | `clearButtonClass`、`clearButtonStyle`；其內容為 `clearButton` |
| 觸發按鈕 | 欄位，清除按鈕之後 | 應用程式自己的元素（`triggerButton`） |
| 後綴 | 欄位，最後面 | 應用程式自己的元素（`suffix`） |
| 彈出視窗或面板 | 位於所有內容之上，在欄位下方（桌面平台）或螢幕底部（觸控螢幕） | `popupClass`、`popupStyle` |
| 背景遮罩 | 面板後方（觸控螢幕） | `backdropClass`、`backdropStyle` |
| 列表 | 彈出視窗中 | `listClass`、`listStyle` |
| 分組標題 | 列表中，位於其項目之前 | `groupClass`、`groupStyle`、`renderGroup` |
| 項目的列 | 列表中 | `itemClass`、`itemStyle`、`renderItem`（內部的 `group-focus:`、`group-selected:`、`group-disabled:`，位於 `itemClass` 的 `group` 之下） |
| 空狀態 | 彈出視窗中，沒有項目顯示時 | 其自身的元素（`empty`） |
| 頁腳 | 彈出視窗中，最後面 | `footerClass`、`footerStyle`；其內容為 `footer` |

<a id="keyboard"></a>

## 鍵盤

輸入框保持焦點時，按鍵與 select 相同（見[鍵盤](./select.md#keyboard)），但有以下差異：字母和數字會輸入到輸入框中並篩選列表，而不是進行預先輸入定位；Down 和 Up 會開啟已關閉的列表；使用 `multiple` 時，Return 會切換高亮的項目並保持列表開啟；在 Mac 上按 Cmd+Return（其他平台為 Ctrl+Return）會關閉列表並確認。在桌面平台上，列表關閉後，輸入框會保持焦點。

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，輸入框是一個 combobox：其標籤為 `accessibilityLabel`，其值為已選項目的標題（以逗號連接），並會說明列表是否展開。`disabled` 會使它變暗。
- 列表是 listbox，每一列是一個 option，以其標題命名；已選取的 option 會標示為已選取，已停用的則顯示為變暗。分組標題是標題。
- 清除按鈕是以 `clearButtonAccessibilityLabel` 命名的按鈕；它不是 Tab 的停駐點。觸發按鈕對螢幕閱讀器隱藏，因為輸入框已說明列表是否開啟，同樣不是 Tab 的停駐點。

有關標籤、角色和播報的一般說明，見[無障礙](../docs/accessibility.md)。
