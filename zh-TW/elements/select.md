---
title: "Select"
description: "Select 元件:從項目清單中選取單一值,在桌面裝置上於觸發元件處顯示彈出視窗,在手機上則顯示底部面板,支援鍵盤操作、輸入即跳選、搜尋與分區,並可由應用程式自訂樣式。"
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Select 讓使用者從項目清單中選出一個值：設定、篩選條件、國家、時區。應用程式的觸發元件會開啟清單，並依各裝置的慣例呈現：

- 在桌面平台與桌面瀏覽器上，清單是位於觸發元件上方的彈出層，已選取的列會疊在觸發元件上，讓所選標題維持在原位（shadcn/ui 的 `item-aligned` 定位）。彈出層的寬度與觸發元件相同（應用程式的 `popupStyle` / `popupClass` 寬度可另行設定，如 `gpui-component` 的 `menu_width`），高度則依列數而定，最高不超過螢幕上的可用空間；未選取任何項目時，會在觸發元件下方開啟。鍵盤可在項目間移動並選取其中一項。
- 在手機與平板上，清單是位於螢幕底部、置於背景遮罩之上的底部面板。

行為由 select 負責：值（應用程式的值，或 select 自身的值）、開啟狀態、鍵盤、輸入即跳轉（typeahead）、搜尋、分區、反白列，以及螢幕閱讀器所朗讀的內容。外觀則由應用程式決定：它為觸發元件、彈出層、清單、列、分區標題與搜尋欄位設定樣式，或自行繪製列。

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`select()` 會建立一個 select，每個屬性有一個 setter（`.items(..)`、`.value(..)`、`.item_style(..)`），每個事件有一個監聽器（`.on_change(..)`）；`SelectItem::new(value, title)` 則建立一個項目，並提供 `.disabled(..)` 與 `.group(..)`。

<a id="items"></a>

## 項目

`items` 是以資料表示的清單：每個項目都有 `value`（在所有項目中唯一，選取該項目時會設定的值）、`title`（其列所顯示的內容，也是搜尋與輸入即跳轉所比對的對象，以及螢幕閱讀器所朗讀的內容），並可選擇性地帶有 `disabled` 與 `group`。相鄰且 `group` 相同的項目會組成一個分區，置於以該名稱為標題的標頭之下：

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

各列是彈出層捲動檢視中的虛擬化清單：即使有數千個項目，也只會建立可見範圍內的列；當列的總高度超過可用空間時，彈出層會捲動。

<a id="value"></a>

## 值

有 `value` 時，所選項目由應用程式持有：select 會顯示該值所對應的項目，並以 `onChange({ value })` 回報選取結果；應用程式設定 `value` 來跟隨，或保留自己的值。`value={null}` 表示未選取任何項目。若省略，select 會保有自己的值，起初取自 `defaultValue`。`onChange` 回報變更：再次選取已選的項目只會關閉清單。

`cleanable` 會在已選取項目時加上清除按鈕：按下後會清除值，並以 `onChange({ value: null })` 回報，清單則保持關閉。按鈕位於 select 的 view 中觸發元件之後，而非其內部，因此按下它不會開啟清單；應用程式負責放置它（以 `absolute` 疊在觸發元件的末端，也就是通常放置箭頭符號的位置）並填入內容：

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

觸發元件是應用程式自己的元素，因此可以為所選項目顯示任何內容：標題、圖示，或在未選取時顯示的預設提示文字。在 TSX 中，它就是你傳入的元素：它本身即是 combobox，並自行接收按壓、鍵盤焦點、展開狀態與 `disabled`，因此它自己的 `active:`、`focus:` 與 `disabled:` class 會跟隨 select，它自己的 `onPress` 也會執行，清單則以它為基準定位，且寬度與它相同。

<a id="open-state"></a>

## 開啟狀態

沒有 `open` 時，select 會保有自己的開啟狀態（起初取自 `defaultOpen`）。有 `open` 時，開啟狀態由應用程式持有，並在 `onOpenChange({ open, reason })` 中變更：`"triggerPress"`（按下觸發元件，或按下其按鍵）、`"select"`（選取）、`"pressOutside"`、`"backdropPress"` 或 `"cancel"`（Escape 或返回）。`onOpen` 與 `onClose` 表示清單已顯示與已消失（以底部面板呈現時，分別指面板滑入完成與滑出完成之後），`onCancel` 表示使用者未選取就關閉了清單。

<a id="search"></a>

## 搜尋

`searchable` 會在項目上方放置一個搜尋欄位：輸入文字時會依標題篩選項目（不分大小寫），沒有任何符合項目的分區會連同其標頭一併消失。反白會移到第一個符合的項目，欄位持有鍵盤時，按鍵仍可移動反白，按下 Return 則選取該項目。`empty` 是沒有任何項目符合時清單所顯示的內容：

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

在桌面平台上，清單開啟時搜尋欄位會取得鍵盤；在觸控螢幕上，則是按下欄位時才會彈出鍵盤。每次開啟時，搜尋內容都是空的。

<a id="rows-the-app-draws"></a>

## 由應用程式繪製的列

`itemClass` 為每個項目的列設定樣式，列預設顯示項目的標題，直到由 `renderItem` 來繪製：`focus:` 套用於反白的列（按鍵或指標所在之處），`selected:` 套用於已選取的列，`disabled:` 套用於停用的列。若要自行繪製列，請提供 `renderItem`：它會取得項目的資訊（[`SelectEntry`](#types)），並為可見範圍內的列回傳列的內容。它永遠不會取得列的狀態：在 `itemClass` 中搭配 `group`，內容會以 `group-focus:`、`group-selected:` 與 `group-disabled:` class 跟隨列的各種狀態，因此每個項目只會繪製一次，反白的移動或選取都不會觸發重新繪製。`renderGroup` 以相同方式繪製分區的標頭：

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 項目，依順序排列。 |
| `value` | `.value(..)` | `string \| null` | 無 | 所選項目的 `value`，由應用程式持有；`null` 表示未選取。省略時，select 會保有自己的值。 |
| `defaultValue` | `.default_value(..)` | `string` | 無 | 沒有 `value` 時，起初的值。 |
| `open` | `.open(..)` | `boolean` | 無 | 開啟狀態，由應用程式持有。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 沒有 `open` 時，起初是否開啟。 |
| `searchable` | `.searchable(..)` | `boolean` | `false` | 項目上方的搜尋欄位，依標題篩選項目。 |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | 無 | 搜尋欄位的預設提示文字。 |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對搜尋欄位的稱呼：它所搜尋的內容。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 已選取項目時顯示的清除按鈕；按下會清除值（`onChange({ value: null })`）。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 保持關閉：觸發元件不接受按壓，也不接受鍵盤焦點，並套用 `disabled:` 樣式。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對它的稱呼：這個選擇是關於什麼。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 桌面平台：清單位於觸發元件的哪一側；若只有另一側有空間，則改放另一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | 桌面平台：與觸發元件的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面平台：觸發元件與清單之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 桌面平台：與安全區域邊緣保持的距離。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清單所在的彈出層（桌面平台）或底部面板（觸控螢幕）。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 觸控螢幕：底部面板後方的背景遮罩。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清單，即各列的捲動檢視。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的列，其文字樣式由標題繼承：反白時套用 `focus:`，已選取時套用 `selected:`，無法選取時套用 `disabled:`。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分區的標頭。 |
| `searchClass`、`searchStyle` | `.search_class(..)`、`.search_style(..)` | `string`、`StyleProp<InputStyle>` | 無 | 搜尋欄位：其外框與文字（`color`、`fontSize`、`placeholderColor`）。 |
| `clearButtonClass`、`clearButtonStyle` | `.clear_button_class(..)`、`.clear_button_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清除按鈕（`cleanable`）；`disabled:` 與 select 一同生效。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 無 | 清除按鈕的內容：叉號或圖示。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對清除按鈕的稱呼。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 按下後會開啟清單的元素；清單以它為基準定位。 |
| `empty` | `.empty(..)` | `JSX.Element` | 無 | 沒有任何項目可顯示時（例如搜尋沒有符合項目）清單所顯示的內容。 |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | 無 | 項目的列，由應用程式依項目的資訊繪製（其狀態即列的 class）；未提供時顯示項目的標題。 |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | 無 | 分區的標頭，由應用程式繪製；未提供時顯示其標題。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 包住觸發元件的 view。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 使用者選取了另一個項目（按壓、Return 或 Space，或在觸發元件上輸入即跳轉）：回報其 `value`；若是由清除按鈕清除，則為 `null`。設定 `value` 即可跟隨。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 清單已開啟或關閉，並附上原因。設定 `open` 即可跟隨。 |
| `onOpen` | `.on_open(\|\| ..)` | 清單已顯示；以底部面板呈現時，指面板滑入完成之後。 |
| `onClose` | `.on_close(\|\| ..)` | 清單已消失；以底部面板呈現時，指面板滑出完成之後。應用程式自行關閉清單時也會觸發。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 使用者未選取就關閉了清單（Escape 或返回、在外部按壓或按壓背景遮罩）。 |

事件依下列順序發生：選取時先是 `onChange`，未選取就關閉時則是 `onCancel`，接著是 `onOpenChange`，最後在清單顯示或消失之後，分別是 `onOpen` 或 `onClose`。

<a id="types"></a>

<a id="types"></a>

## 型別

| 型別 | 成員 | 說明 |
|---|---|---|
| `SelectItem` | `value: string`、`title: string`、`disabled?: boolean`、`group?: string` | `items` 的一個項目。 |
| `SelectEntry` | `value`、`title`、`disabled`、`group?`（項目的）、`index: number` | `renderItem` 所取得的內容：項目及其在 `items` 中的索引，絕不包含項目的狀態（列的 `focus:`、`selected:` 與 `disabled:`）。 |
| `SelectGroup` | `title: string` | `renderGroup` 所取得的內容：分區的 `group`。 |

在 Rust 中，它們分別是 `nsh_base::SelectItem`、`SelectEntry` 與 `SelectGroup`；`value` 是一個 `SelectValue`（值用 `Controlled(Some(..))`，`null` 用 `Controlled(None)`），`.value(..)` 可從 `Option<SharedString>` 或字串建立它。

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 觸發元件 | select 的 view | 應用程式自己的元素（`trigger`） |
| 清除按鈕 | select 的 view，位於觸發元件之後（`cleanable`，已選取項目時） | `clearButtonClass`、`clearButtonStyle`；其內容為 `clearButton` |
| 彈出層或底部面板 | 位於所有內容之上，在觸發元件處（桌面平台）或螢幕底部（觸控螢幕） | `popupClass`、`popupStyle` |
| 背景遮罩 | 底部面板後方（觸控螢幕） | `backdropClass`、`backdropStyle` |
| 搜尋欄位 | 彈出層中，最前面（`searchable`） | `searchClass`、`searchStyle`、`searchPlaceholder`、`searchAccessibilityLabel` |
| 清單 | 彈出層中，位於搜尋欄位之後 | `listClass`、`listStyle` |
| 分區的標頭 | 清單中，位於其項目之前 | `groupClass`、`groupStyle`、`renderGroup` |
| 項目的列 | 清單中 | `itemClass`、`itemStyle`、`renderItem`（內部的 `group-focus:`、`group-selected:`、`group-disabled:`，位於 `itemClass` 的 `group` 之下） |
| 空狀態 | 彈出層中，沒有任何項目顯示時 | 其自己的元素（`empty`） |

彈出層是一個直欄：其高度隨搜尋欄位與各列而定，因此在 `popupClass` 上設定 `max-h-*` 即可限制其高度，清單則在其中捲動。

<a id="keyboard"></a>

## 鍵盤

在桌面平台上，按 Tab 可移到未 `disabled` 的 select 的觸發元件。清單關閉時，按 Down、Up、Return 與 Space 會在已選取的項目上開啟清單（未選取任何項目時，Up 會開啟在最後一個啟用的項目上，其他按鍵則開啟在第一個項目上），輸入字母與數字則會選取標題以所輸入內容開頭的項目，就像原生 select 一樣。清單開啟時：

| 按鍵 | 動作 |
|---|---|
| Down、Up | 下一個或上一個啟用的項目，到頭尾時會循環。 |
| Home、End | 第一個或最後一個啟用的項目（搜尋欄位持有鍵盤時，則由欄位自行處理）。 |
| Page Down、Page Up | 向後或向前翻一頁的列。 |
| Return | 選取反白的項目並關閉清單。 |
| Space | 選取反白的項目（沒有搜尋欄位時）。 |
| 字母、數字 | 標題以最近一秒內所輸入內容開頭的下一個項目（沒有搜尋欄位時）。 |
| Escape | 不選取並關閉清單。 |

清單關閉後，鍵盤焦點會回到觸發元件，除非在外部的按壓已將焦點帶到其他地方。指標會反白它移經的列；按鍵移動時，反白的列會被捲動到可見處。

<a id="on-each-device"></a>

## 各裝置上的行為

| | 桌面平台與桌面瀏覽器 | 手機與平板 |
| --- | --- | --- |
| 清單 | 位於觸發元件上方的彈出層，已選取的列疊在觸發元件上（未選取任何項目時則在其下方），寬度與觸發元件相同，除非 `popupStyle` 設定了寬度，高度依列數而定，最高不超過螢幕上的可用空間 | 位於螢幕底部、置於背景遮罩之上的底部面板，高度依列數而定，最高到狀態列為止 |
| 關閉 | 選取、Escape、在外部按壓（按壓會繼續作用於指標下方的元素） | 選取、背景遮罩、Android 返回鍵 |
| 搜尋 | 清單開啟時，欄位會取得鍵盤 | 按下欄位時才會彈出鍵盤 |
| 選取 | 按壓落下時即選取，因此搜尋欄位會保有鍵盤 | 點一下 |

`popupClass` 在桌面平台上為彈出層設定樣式，在手機上則為底部面板設定樣式；若樣式在兩者之間有所不同，可以用 `"desktop"` 來比較 `platform.idiom`（`nsh/device`）。
<a id="accessibility"></a>

## 無障礙功能

- 對螢幕閱讀器而言，觸發元件是一個 combobox：其標籤為 `accessibilityLabel`，其值為所選項目的標題，並會告知清單是否已展開。`disabled` 會使其呈現淡化狀態。
- 清除按鈕是一個以 `clearButtonAccessibilityLabel` 命名的 button；它不是 Tab 鍵的停駐點。
- 搜尋欄位是一個以 `searchAccessibilityLabel` 命名的文字欄位；其預留位置文字（placeholder）是欄位為空時顯示的提示。
- 清單是一個 listbox，每一列是一個 option，並以其標題命名；已選取的選項會標示為已選取，已停用的選項則呈現淡化狀態。各區段（section）的標頭則視為標頭（header）。
- 當按鍵移動醒目提示時，螢幕閱讀器的焦點會移至被醒目提示的列；當搜尋欄位正在接收鍵盤輸入時，則改為朗讀被醒目提示項目的標題，讓使用者能繼續輸入。

有關標籤、角色與朗讀內容的一般說明，請參閱[無障礙功能](../docs/accessibility.md)。
