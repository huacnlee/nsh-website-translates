---
title: "Select"
description: "Select 元件:從項目清單中選取單一數值,在桌面平台於觸發元素旁顯示彈出視窗,在手機上則以底部面板呈現,支援鍵盤操作、輸入即時跳選、搜尋及分組,並由應用程式自行設定樣式。"
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---


# Select

Select 讓使用者從一列項目中選出一個值，例如設定、篩選條件、國家或時區。應用程式的觸發元素會開啟列表，並按各種裝置的慣例呈現：

- 在桌面平台及桌面瀏覽器上，彈出視窗會疊在觸發元素之上，已選取的列覆蓋在觸發元素的位置，使所選標題停留在原處（shadcn/ui 的 `item-aligned` 定位）。視窗寬度與觸發元素相同（應用程式的 `popupStyle` / `popupClass` 寬度可另行指定，一如 `gpui-component` 的 `menu_width`），高度隨各列而定，上限為螢幕可用的空間。未選取任何項目時，視窗會在觸發元素下方開啟。鍵盤可在項目之間移動並選取其中一項。
- 在手機及平板電腦上，列表以螢幕底部的面板呈現，並置於背景遮罩之上。

Select 負責行為：值（由應用程式持有，或由 Select 自行持有）、開啟狀態、鍵盤、輸入即選（typeahead）、搜尋、分組、高亮列，以及螢幕閱讀器讀出的內容。外觀則由應用程式負責：它為觸發元素、彈出視窗、列表、各列、分組標題和搜尋欄設定樣式，或自行繪製各列。

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

`Select` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`select()` 會建立一個 Select，每個 prop 各有一個 setter（`.items(..)`、`.value(..)`、`.item_style(..)`），每個事件各有一個監聽器（`.on_change(..)`）；`SelectItem::new(value, title)` 會建立一個項目，並附帶 `.disabled(..)` 和 `.group(..)`。

<a id="items"></a>

## 項目

`items` 是以資料表示的列表：每個項目都有 `value`（在所有項目中必須唯一，即選取該項目時所設定的值）、`title`（該列顯示的內容，也是搜尋和輸入即選所比對的文字，以及螢幕閱讀器讀出的內容），以及可選的 `disabled` 和 `group`。屬於同一個 `group` 的相鄰項目會組成一個分組，並置於以該標題命名的分組標題之下：

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

各列是彈出視窗捲動視圖中的虛擬化列表：即使列表有數千個項目，也只會建立可見範圍內的列；當各列高於可用空間時，彈出視窗會捲動。

<a id="value"></a>

## 值

使用 `value` 時，所選項目由應用程式持有：Select 顯示該值對應的項目，並以 `onChange({ value })` 回報選取操作；應用程式可設定 `value` 以跟隨該操作，也可保留自己的值。`value={null}` 表示未選取任何項目。如果省略，Select 會自行保存值，起始值來自 `defaultValue`。`onChange` 會回報變更：再次選取已選的項目只會關閉列表。

`cleanable` 會在已選取項目時加入清除按鈕：按下後會清除該值，並以 `onChange({ value: null })` 回報，列表保持關閉。此按鈕位於 Select 視圖中觸發元素之後，而不在觸發元素內，因此按下它不會開啟列表；其位置和內容由應用程式決定（以 `absolute` 置於觸發元素的末端，即原本箭嘴所在處）：

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

觸發元素是應用程式自己的元素，因此可以按應用程式的需要顯示所選項目：標題、圖示，或在未選取時顯示佔位文字。在 TSX 中，它就是你傳入的元素：它本身即是 combobox，並自行接收按壓、鍵盤焦點、展開狀態和 `disabled`，因此它自己的 `active:`、`focus:` 和 `disabled:` class 會跟隨 Select，它自己的 `onPress` 也會照常執行，而列表會以它為基準定位，寬度亦與它相同。

<a id="open-state"></a>

## 開啟狀態

沒有 `open` 時，Select 自行保存開啟狀態（起始值來自 `defaultOpen`）。使用 `open` 時，開啟狀態由應用程式持有，並在 `onOpenChange({ open, reason })` 中更改：`"triggerPress"`（按下觸發元素或其按鍵）、`"select"`（作出選取）、`"pressOutside"`、`"backdropPress"` 或 `"cancel"`（Escape 或返回）。`onOpen` 和 `onClose` 分別表示列表已顯示和已消失（對面板而言，是指它進場完成和退場完成之後），`onCancel` 則表示使用者未選取任何項目便關閉了列表。

<a id="search"></a>

## 搜尋

`searchable` 會在項目上方加入搜尋欄：輸入文字時會按標題篩選項目（不分大小寫），沒有任何符合項目的分組會連同其標題一併隱藏。高亮會移到第一個符合的項目，搜尋欄擁有鍵盤時，按鍵仍可移動高亮，按 Return 則選取該項目。`empty` 是沒有任何項目符合時列表所顯示的內容：

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

在桌面平台上，列表開啟時搜尋欄會取得鍵盤；在觸控螢幕上，按下搜尋欄後才會彈出鍵盤。每次開啟時，搜尋內容都會重新清空。

<a id="rows-the-app-draws"></a>

## 由應用程式繪製的列

`itemClass` 為每個項目的列設定樣式，列預設顯示項目的標題，直至 `renderItem` 接手繪製：`focus:` 套用於高亮列（按鍵或指標所在之處），`selected:` 套用於已選取的列，`disabled:` 套用於已停用的列。若要自行繪製列，請提供 `renderItem`：它會取得該項目的資料（[`SelectEntry`](#types)），並傳回該列的內容，且只為可見的列執行。它永遠不會取得列的狀態：只要在 `itemClass` 中使用 `group`，內容就會透過 `group-focus:`、`group-selected:` 和 `group-disabled:` class 跟隨列的狀態，因此每個項目只會繪製一次，高亮移動或作出選取時不會重新繪製。`renderGroup` 以同樣方式繪製分組標題：

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

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 項目，按順序排列。 |
| `value` | `.value(..)` | `string \| null` | 無 | 所選項目的 `value`，由應用程式持有；`null` 表示未選取。省略時，Select 自行保存。 |
| `defaultValue` | `.default_value(..)` | `string` | 無 | 沒有 `value` 時的起始值。 |
| `open` | `.open(..)` | `boolean` | 無 | 開啟狀態，由應用程式持有。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 沒有 `open` 時，是否一開始就開啟。 |
| `searchable` | `.searchable(..)` | `boolean` | `false` | 項目上方的搜尋欄，按標題篩選項目。 |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | 無 | 搜尋欄的佔位文字。 |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對搜尋欄的稱呼：即它所搜尋的內容。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 已選取項目時顯示清除按鈕；按下後會清除該值（`onChange({ value: null })`）。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 保持關閉：觸發元素不接受按壓和鍵盤焦點，並套用 `disabled:` 樣式。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對它的稱呼：即這項選擇與什麼有關。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 桌面平台：列表位於觸發元素的哪一側；若只有另一側有足夠空間，則改用另一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | 桌面平台：與觸發元素的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面平台：觸發元素與列表之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 桌面平台：與安全區域邊緣保持的距離。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 容納列表的彈出視窗（桌面平台）或面板（觸控螢幕）。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 觸控螢幕：面板後方的背景遮罩。 |
| `listClass`、`listStyle` | `.list_class(..)`、`.list_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 列表，即各列的捲動視圖。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的列，其文字樣式由標題繼承：高亮時為 `focus:`，已選取時為 `selected:`，無法選取時為 `disabled:`。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個分組的標題。 |
| `searchClass`、`searchStyle` | `.search_class(..)`、`.search_style(..)` | `string`、`StyleProp<InputStyle>` | 無 | 搜尋欄：其方框和文字（`color`、`fontSize`、`placeholderColor`）。 |
| `clearButtonClass`、`clearButtonStyle` | `.clear_button_class(..)`、`.clear_button_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清除按鈕（`cleanable`）；`disabled:` 與 Select 一同套用。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 無 | 清除按鈕的內容：叉號或圖示。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對清除按鈕的稱呼。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 按下後會開啟列表的元素；列表以它為基準定位。 |
| `empty` | `.empty(..)` | `JSX.Element` | 無 | 沒有項目可顯示時（搜尋沒有符合項目）列表所顯示的內容。 |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | 無 | 項目的列，由應用程式根據項目資料繪製（其狀態即列的 class）；否則顯示項目的標題。 |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | 無 | 分組的標題，由應用程式繪製；否則顯示其標題文字。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 包住觸發元素的視圖。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 使用者選取了另一個項目（按壓、Return 或 Space、在觸發元素上輸入即選）：傳回其 `value`；若由清除按鈕清除，則傳回 `null`。設定 `value` 以跟隨此變更。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 列表已開啟或關閉，並附帶原因。設定 `open` 以跟隨此變更。 |
| `onOpen` | `.on_open(\|\| ..)` | 列表已顯示；若為面板，則在進場完成後觸發。 |
| `onClose` | `.on_close(\|\| ..)` | 列表已消失；若為面板，則在退場完成後觸發。應用程式自行關閉列表時亦會觸發。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 使用者未選取任何項目便關閉了列表（Escape 或返回、在外部或背景遮罩上按壓）。 |

事件按以下次序發生：作出選取時先觸發 `onChange`，未選取便關閉時先觸發 `onCancel`，接著是 `onOpenChange`，最後在列表顯示或消失後觸發 `onOpen` 或 `onClose`。

<a id="types"></a>

<a id="types"></a>

## 類型

| 類型 | 成員 | 說明 |
|---|---|---|
| `SelectItem` | `value: string`、`title: string`、`disabled?: boolean`、`group?: string` | `items` 的一個項目。 |
| `SelectEntry` | `value`、`title`、`disabled`、`group?`（項目的），`index: number` | `renderItem` 所取得的內容：項目及其在 `items` 中的索引，絕不包含項目的狀態（列的 `focus:`、`selected:` 和 `disabled:`）。 |
| `SelectGroup` | `title: string` | `renderGroup` 所取得的內容：分組的 `group`。 |

在 Rust 中，它們分別是 `nsh_base::SelectItem`、`SelectEntry` 和 `SelectGroup`；`value` 是一個 `SelectValue`（`Controlled(Some(..))` 表示有值，`Controlled(None)` 表示 `null`），`.value(..)` 會由 `Option<SharedString>` 或字串建立它。

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 觸發元素 | Select 的視圖 | 應用程式自己的元素（`trigger`） |
| 清除按鈕 | Select 的視圖中，位於觸發元素之後（`cleanable`，已選取項目時） | `clearButtonClass`、`clearButtonStyle`；其內容為 `clearButton` |
| 彈出視窗或面板 | 位於所有內容之上，在觸發元素處（桌面平台）或在底部（觸控螢幕） | `popupClass`、`popupStyle` |
| 背景遮罩 | 面板後方（觸控螢幕） | `backdropClass`、`backdropStyle` |
| 搜尋欄 | 彈出視窗內，排在最前（`searchable`） | `searchClass`、`searchStyle`、`searchPlaceholder`、`searchAccessibilityLabel` |
| 列表 | 彈出視窗內，位於搜尋欄之後 | `listClass`、`listStyle` |
| 分組標題 | 列表內，位於其項目之前 | `groupClass`、`groupStyle`、`renderGroup` |
| 項目的列 | 列表內 | `itemClass`、`itemStyle`、`renderItem`（內部為 `group-focus:`、`group-selected:`、`group-disabled:`，位於 `itemClass` 中的 `group` 之下） |
| 空狀態 | 彈出視窗內，沒有項目顯示時 | 其自身的元素（`empty`） |

彈出視窗是一個直欄：其高度隨搜尋欄和各列而定，因此在 `popupClass` 上設定 `max-h-*` 會限制其高度，列表則在其中捲動。

<a id="keyboard"></a>

## 鍵盤

在桌面平台上，未 `disabled` 的 Select 可用 Tab 鍵移到其觸發元素。列表關閉時，按 Down、Up、Return 和 Space 會在已選取的項目上開啟列表（未選取任何項目時，Up 會移到最後一個可用項目，其他按鍵則移到第一個），而字母和數字鍵則會像原生 select 一樣，選取標題以所輸入內容開頭的項目。列表開啟時：

| 按鍵 | 動作 |
|---|---|
| Down、Up | 移到下一個或上一個可用項目，到達盡頭時會循環。 |
| Home、End | 移到第一個或最後一個可用項目（搜尋欄擁有鍵盤時，則由搜尋欄自行處理）。 |
| Page Down、Page Up | 向前或向後移動一頁的列數。 |
| Return | 選取高亮的項目並關閉列表。 |
| Space | 選取高亮的項目（沒有搜尋欄時）。 |
| 字母、數字 | 移到下一個標題以最近一秒內所輸入內容開頭的項目（沒有搜尋欄時）。 |
| Escape | 不作選取並關閉列表。 |

列表關閉後，鍵盤焦點會回到觸發元素，除非在外部按壓時已將焦點移到別處。指標移過的列會被高亮；按鍵移動時，高亮的列會被捲動至可見位置。

<a id="on-each-device"></a>

## 各種裝置

| | 桌面平台及桌面瀏覽器 | 手機及平板電腦 |
| --- | --- | --- |
| 列表 | 位於觸發元素之上的彈出視窗，已選取的列疊在觸發元素上（未選取任何項目時則在其下方），寬度與觸發元素相同（除非 `popupStyle` 指定了寬度），高度隨各列而定，上限為螢幕可用的空間 | 位於底部、置於背景遮罩之上的面板，高度隨各列而定，上限為狀態列 |
| 關閉方式 | 作出選取、Escape、在外部按壓（該按壓會繼續傳到指標下方的元素） | 作出選取、背景遮罩、Android 返回按鈕 |
| 搜尋 | 列表開啟時，搜尋欄會取得鍵盤 | 按下搜尋欄後才會彈出鍵盤 |
| 選取 | 按下的瞬間即選取，因此搜尋欄會保持鍵盤焦點 | 輕按 |

`popupClass` 在桌面平台上為彈出視窗設定樣式，在手機上則為面板設定樣式；若兩者的樣式不同，可以用 `"desktop"` 比較 `platform.idiom`（`nsh/device`）。
<a id="accessibility"></a>

## 無障礙設計

- 對螢幕閱讀器而言,觸發器是一個組合框(combobox):其標籤為 `accessibilityLabel`,其值為所選項目的標題,並會說明清單是否已展開。`disabled` 會令它變暗。
- 清除按鈕是一個按鈕,名稱由 `clearButtonAccessibilityLabel` 指定;它不是 Tab 鍵的停駐點。
- 搜尋欄位是一個文字欄位,名稱由 `searchAccessibilityLabel` 指定;其預留位置文字(placeholder)是在欄位為空時顯示的提示。
- 清單是一個 listbox,每一列是一個 option,以其標題命名;已選取的選項會標示為選取狀態,已停用的選項則會變暗。各區段的標頭屬於標題(header)。
- 當按鍵移動醒目標示時,螢幕閱讀器的焦點會移到被標示的列;當搜尋欄位正在接收鍵盤輸入時,則會改為朗讀被標示項目的標題,讓使用者可以繼續輸入。

有關標籤、角色及朗讀內容的一般說明,請參閱[無障礙設計](../docs/accessibility.md)。
