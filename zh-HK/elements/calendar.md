---
title: "Calendar"
description: "Calendar 元件:可從按月份排列的日期中選取單一日期或日期範圍,提供月份和年份檢視,並支援鍵盤操作,樣式由應用程式自行設定。"
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---


# Calendar

日曆用來選取一個日期，或在設定 `range` 時選取一段日期範圍，日期按週排列於各個月份之中：例如表單中的到期日、住宿的晚數、報表涵蓋的日子。它可顯示一個月，或並排顯示多個月，以「上一頁」和「下一頁」翻月，並可切換到按年顯示各月份的檢視，或以一頁頁的年份快速跳到較遠的日期。它就是 [DatePicker](./date-picker.md) 彈出視窗中的日曆，亦可獨立放在頁面上。

日曆負責行為：值（由應用程式持有，或由日曆自行持有）、顯示的月份、各個檢視、不可選取的日期、鍵盤操作，以及螢幕閱讀器讀出的內容。外觀則由應用程式決定：它為標頭、主體、每個月份、每一列和每個項目設定樣式，並繪製項目的內容（月份和星期的名稱、今天的標記、範圍的色帶）。網格會填滿所得的寬度，一如表格的欄：各月份均分寬度，每列的項目亦均分該列，因此手機底部面板中的日曆會橫跨整個螢幕，而按內容決定大小的彈出視窗中的日曆則保持項目原有的寬度（在 `itemClass` 或 `monthClass` 中使用 `flex-none`，可讓項目或月份保持自身寬度）。

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`calendar()` 會建立一個日曆，每個 prop 有一個 setter（`.value(..)`、`.range(..)`、`.number_of_months(..)`），每個事件有一個監聽器（`.on_change(..)`）。其值為 `Date`（`Date::Single`、`Date::Range`，可由一個 `chrono::NaiveDate` 或一對這類值建立），其停用的日期為 `Matcher`。

<a id="value"></a>

## 值

值為 ISO 日期 `"2026-10-28"`，與 HTML 的 `<input type="date">` 相同；設定 `range` 時則為 `[start, end]`，而 `null` 表示沒有日期。設定 `value` 時，值由應用程式持有：日曆將其顯示為已選取，並以 `onChange({ value })` 回報使用者的選取；應用程式須設定 `value` 以跟隨。若省略，日曆會自行保存值，起初取自 `defaultValue`。

`onChange` 只回報完整的值，一如 `gpui-base` 的 `Selected`：即被按下的日子，或範圍的結束日。

- 未設定 `range` 時，按下某一日即選取該日。
- 設定 `range` 時，第一次按下開始範圍，第二次按下結束範圍，兩者之間的日子屬於該範圍（每一日皆為 `selected`，包括兩端，見[項目](#items)）。若第二次按下的是較早的日子，範圍會由該日重新開始；範圍完成後再按下任何一日亦然。未完成的範圍會顯示出來，直到完成後才會回報。

日曆開啟時會顯示值所在的月份（範圍則為其開始日所在的月份），否則顯示今天所在的月份。

<a id="months-and-views"></a>

## 月份與檢視

`numberOfMonths` 會由當前顯示的月份起，並排顯示該數量的月份；「上一頁」和「下一頁」每次翻動一個月。`firstDayOfWeek` 為每週的起始日，`0` 為星期日（預設）至 `6` 為星期六。

標頭包含「上一頁」、兩個切換按鈕和「下一頁」：

- 日檢視顯示各月份的日子，每個月份為一欄，包含星期列和各週；前後月份的日子會填滿各週（`outside`、`data-outside`）。
- 月份切換按鈕（`monthToggle`）會開啟月份檢視：十二個月份，每列三個。選取其一後會在日檢視中顯示該月。
- 年份切換按鈕（`yearToggle`）會開啟年份檢視：每頁 20 個年份，每列五個，以「上一頁」和「下一頁」翻頁。選取其一後會在日檢視中顯示該年。`yearRange` 為各頁涵蓋的年份範圍，即 `[start, end)`（預設：由今年前 50 年至今年後 50 年）。

顯示多個月份時，標頭會改為顯示每個月份的標題，而非切換按鈕（為 `monthToggle` 項目，不接受按下操作），一如 `gpui-base`。

<a id="disabled-dates"></a>

## 停用日期

`disabledMatcher` 為使用者無法選取的日子，即 `gpui-base` 的 `Matcher`，有以下四種形式：

| 形式 | 停用的日子 |
|---|---|
| `[0, 6]` | 這些星期幾，`0` 為星期日至 `6` 為星期六。 |
| `{ before, after }` | `before` 之前及 `after` 之後的日子（可省略任何一項）。 |
| `{ from, to }` | 由 `from` 至 `to`（包含首尾）的日子（省略任何一項即不設限）。 |
| `(date) => boolean` | 函式傳回 `true` 的日子，函式會接收每個顯示日子的 ISO 日期。 |

函式會在下一個 JS turn 中，就每個顯示的日子查詢一次，已回答過的日子不會再查詢：翻月時只會查詢新出現的日子，因此其結果必須是日期的純函式。傳入另一個函式則會重新查詢。被停用的日子為 `disabled:`：它不接受按下操作，Return 和 Space 亦不會選取它。

<a id="items"></a>

## 項目

日曆中每個可按下的目標和標籤都是項目：「上一頁」、切換按鈕、「下一頁」、星期、日子、月份和年份。每個項目都繪製在由 `itemClass` 和 `itemStyle` 設定樣式的部件中，其變體隨狀態而定：

| 變體 | 項目 |
|---|---|
| `selected:` | 已選取：該日期、完整範圍中的每一日（包括兩端，一如 React Aria 的範圍日曆）、未完成範圍的開始日、所顯示的月份或年份、已開啟檢視的切換按鈕。螢幕閱讀器會讀出其為已選取。 |
| `disabled:` | 不接受按下：被停用的日期、星期、月份的標題、月份檢視中或年份已到盡頭時的「上一頁」和「下一頁」。 |
| `focus:` | 擁有鍵盤焦點。 |
| `data-range-start:`、`data-range-end:` | 為完整範圍的第一日或最後一日（只有一日的範圍則兩者皆是）。 |
| `data-range-middle:` | 為完整範圍之內的日子，不是兩端。 |
| `data-today:` | 為今天。 |
| `data-outside:` | 為前一個月或後一個月的日子，用來填滿各週。 |

`data-*` 變體屬於 Tailwind（`data-range-start:` 對應 `[data-range-start]`），一如 shadcn 的日曆為其日子設定樣式；在 `itemClass` 中使用 `group` 時，內容會以 `group-selected:`、`group-data-range-middle:` 等跟隨這些變體。`selected:` 指範圍的每一日，因此範圍的兩端會蓋過它而採用自己的外觀（後面的變體優先：`data-*` 排在 `selected:` 之後），而中間的日子則採用它們的外觀：

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` 按項目本身是什麼（一個 `CalendarEntry`）來繪製其內容，絕不取決於其狀態：繪製只進行一次，並在項目被選取、取得焦點或納入範圍時保持不變，因此按鍵、選取和焦點都不會重新繪製；翻月時，新出現的日子各繪製一次（日子按其月份和日期保留繪製結果：顯示多個月份時，仍在顯示的月份會保留其繪製結果）。

| 欄位 | 意義 |
|---|---|
| `kind` | `"previous"`、`"monthToggle"`、`"yearToggle"`、`"next"`、`"weekday"`、`"day"`、`"month"` 或 `"year"`。 |
| `value` | 它的數字：該月的日、月份（1 至 12）、年份、星期幾（`0` 為星期日至 `6`）；「上一頁」和「下一頁」為 `0`。 |
| `date` | 某一日的 ISO 日期。 |
| `year`、`month` | 它所屬的年份和月份：日子的（顯示該日的週所屬的月份）、月份切換按鈕或標題的、月份檢視中月份的；年份切換按鈕和年份本身的年份。「上一頁」、「下一頁」和星期為 `0`（年份切換按鈕和年份的月份則為 `month`）。 |
| `today` | 該日為今天。 |
| `outside` | 該日屬於前一個月或後一個月。 |

未設定 `renderItem` 時，項目顯示其數字，「上一頁」和「下一頁」則顯示 `‹` 和 `›`，一如 `gpui-base`；星期同樣顯示其數字，即 `0` 至 `6`，因為月份和星期的名稱是應用程式的用語，須採用應用程式的語言。

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | 無 | 值，由應用程式持有。 |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | 未設定 `value` 時的初始值。 |
| `range` | `.range(..)` | `boolean` | `false` | 選取範圍：第一次按下開始，第二次按下結束。 |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | 並排顯示多少個月份。 |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | 每週的起始日，`0` 為星期日至 `6` 為星期六。 |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | 無 | 無法選取的日期。 |
| `yearRange` | `.year_range(..)` | `[number, number]` | 前後各 50 年 | 年份檢視分頁涵蓋的年份，`[start, end)`。 |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為「上一頁」讀出的內容。 |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為「下一頁」讀出的內容。 |
| `headerClass`、`headerStyle` | `.header_class(..)`、`.header_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 標頭：「上一頁」、切換按鈕（或各月份的標題）、「下一頁」。 |
| `bodyClass`、`bodyStyle` | `.body_class(..)`、`.body_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 主體：並排的各月份，或月份、年份檢視的各列。 |
| `monthClass`、`monthStyle` | `.month_class(..)`、`.month_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 日檢視的每個月份。 |
| `rowClass`、`rowStyle` | `.row_class(..)`、`.row_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每一列：星期、一週、一列月份或年份。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目：`selected:`、`disabled:`、`focus:`；日子的 `data-range-start:`、`data-range-end:`、`data-range-middle:`、`data-today:`、`data-outside:`（見[項目](#items)）。 |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | 無 | 項目的內容，由應用程式按項目本身是什麼來繪製；否則顯示其數字。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 日曆：標頭在主體之上。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 使用者選取了完整的值：`{ value }`，一個日子或一個範圍。設定 `value` 以跟隨。應用程式傳入的 `value` 永遠不會被回報。 |

<a id="parts"></a>

## 部件

| 部件 | 位置 | 樣式設定方式 |
|---|---|---|
| 日曆 | 根節點 | `class`、`style` |
| 標頭 | 日曆內，排在最前 | `headerClass`、`headerStyle` |
| 主體 | 日曆內，標頭之後 | `bodyClass`、`bodyStyle` |
| 月份 | 主體（日檢視） | `monthClass`、`monthStyle` |
| 列 | 月份，或主體（月份和年份檢視） | `rowClass`、`rowStyle` |
| 項目 | 標頭和各列 | `itemClass`、`itemStyle`、`renderItem`（內部為 `group-selected:`、`group-data-range-middle:` 等，位於 `itemClass` 中的 `group` 之下） |

<a id="keyboard"></a>

## 鍵盤

各日子共用一個 Tab 停駐點：它會停在已選取的日子；若無，則停在今天；再無，則停在顯示的第一日。之後：

| 按鍵 | 操作 |
|---|---|
| 向左 / 向右 | 前一日或後一日。 |
| 向上 / 向下 | 前一週或後一週的同一日。 |
| Home / End | 該週的第一日或最後一日。 |
| Page Up / Page Down | 前一個月或後一個月的同一日。 |
| Shift+Page Up / Shift+Page Down | 前一年或後一年的同一日。 |
| Return、Space | 選取該日。 |

在由右至左的版面中，各週由右邊開始排列，因此向左是後一日，向右是前一日；向上和向下則維持按週移動。移到所顯示的月份之外時會自動翻月。「上一頁」、切換按鈕、「下一頁」、月份和年份都接受按下操作。`gpui-base` 的日子只接受按下操作；按鍵由 NSH 提供，參照 WAI-ARIA 的 date picker dialog 模式。

<a id="accessibility"></a>

## 無障礙

- 每個日子都是以其 ISO 日期命名的按鈕；當它是該日期或範圍中的一日（包括兩端，一如 React Aria 的範圍日曆）時為已選取，被停用時則顯示為淡化。
- 「上一頁」和「下一頁」是分別以 `previousAccessibilityLabel` 和 `nextAccessibilityLabel` 命名的按鈕；切換按鈕、月份和年份則是以其所顯示內容命名的按鈕。

有關標籤、角色和朗讀內容的一般說明，請參閱[無障礙](../docs/accessibility.md)。
