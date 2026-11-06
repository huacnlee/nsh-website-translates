---
title: "Calendar"
description: "Calendar 元件:從以月份呈現的日期中選取單一日期或日期範圍,提供月份與年份檢視並支援鍵盤操作,樣式由應用程式自行定義。"
group: base
demo: el-date-picker
---

# Calendar

Calendar 讓使用者從按週排列的各月日期中選取一個日期，搭配 `range` 時則可選取一段日期範圍：表單中的截止日期、住宿的夜數、報表涵蓋的日子。它可以顯示一個月，或並排顯示多個月，以「上一個」與「下一個」切換月份，並可切換到該年各月份的檢視或年份頁面，以快速跳到較遠的時間。它就是 [DatePicker](./date-picker.md) 彈出視窗中的日曆，在此則獨立呈現於頁面中。

Calendar 掌管行為：值（由應用程式持有，或由它自己持有）、顯示的月份、各檢視、無法選取的日期、鍵盤操作，以及螢幕閱讀器朗讀的內容。外觀則由應用程式決定：應用程式為標頭、主體、每個月、每一列與每個項目設定樣式，並繪製項目的內容（月份與星期的名稱、今天的標記、範圍的色帶）。格線會填滿所給定的寬度，如同表格的欄：各月平分該寬度，同一列的項目也均分該列，因此手機底部面板中的日曆會橫跨整個螢幕，而大小隨內容決定的彈出視窗中的日曆則維持項目原本的寬度（`flex-none` 搭配 `itemClass` 或 `monthClass` 可讓項目或月份保持其自身寬度）。

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

`Calendar` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`calendar()` 會建立一個實例，每個 prop 有一個 setter（`.value(..)`、`.range(..)`、`.number_of_months(..)`），每個事件有一個監聽器（`.on_change(..)`）。它的值是 `Date`（`Date::Single`、`Date::Range`，來自單一 `chrono::NaiveDate` 或其成對組合），它所停用的日期則為 `Matcher`。

<a id="value"></a>

## 值

值為 ISO 日期 `"2026-10-28"`，與 HTML `<input type="date">` 的值相同；搭配 `range` 時為 `[start, end]`，而 `null` 代表沒有日期。有 `value` 時，值由應用程式持有：日曆將其顯示為已選取，並透過 `onChange({ value })` 回報選取；應用程式設定 `value` 以跟隨該選取。若省略，日曆會保有自己的值，起初取自 `defaultValue`。

`onChange` 只回報完整的值，形式如同 `gpui-base` 的 `Selected`：被按下的日期，或範圍的結束日。

- 沒有 `range` 時，按下某一天即選取該天。
- 有 `range` 時，第一次按下開始範圍，第二次按下結束範圍，兩者之間的日子都在範圍內（每一天皆為 `selected`，包含兩端，參見 [項目](#items)）。若第二次按下的是較早的日期，則從該日重新開始範圍；範圍完成後再按一次也是如此。未完成的半個範圍會持續顯示，直到完成後才會回報。

日曆開啟時顯示值所在的月份（範圍則為起始日所在月份），否則顯示今天所在的月份。

<a id="months-and-views"></a>

## 月份與檢視

`numberOfMonths` 會並排顯示相應數量的月份，從目前顯示的月份起算；「上一個」與「下一個」每次翻動一個月。`firstDayOfWeek` 是每週的起始日，從 `0` 星期日（預設）到 `6` 星期六。

標頭包含「上一個」、兩個切換鈕與「下一個」：

- 日檢視顯示各月的日期，每個月是一欄，包含星期列與各週；前一個月與後一個月的日期會填滿各週（`outside`、`data-outside`）。
- 月份切換鈕（`monthToggle`）會開啟月檢視：十二個月份，每列三個。選取其中一個後，會在日檢視中顯示該月。
- 年份切換鈕（`yearToggle`）會開啟年檢視：每頁 20 個年份，每列五個，以「上一個」與「下一個」翻頁。選取其中一個後，會在日檢視中顯示該年。`yearRange` 是各頁涵蓋的年份範圍，`[start, end)`（預設：今年之前 50 年到之後 50 年）。

有多個月份時，標頭會顯示每個月的標題以取代切換鈕（為不接受按下的 `monthToggle` 項目），如同 `gpui-base` 的做法。

<a id="disabled-dates"></a>

## 停用的日期

`disabledMatcher` 指定使用者無法選取的日期，如同 `gpui-base` 的 `Matcher`，有以下四種形式之一：

| 形式 | 停用的日期 |
|---|---|
| `[0, 6]` | 這些星期幾，`0` 星期日到 `6` 星期六。 |
| `{ before, after }` | 早於 `before` 與晚於 `after` 的日期（任一者可省略）。 |
| `{ from, to }` | 從 `from` 到 `to`（含）的日期（省略任一者即為無界）。 |
| `(date) => boolean` | 函式在收到每個顯示日期的 ISO 日期後回傳 `true` 的日期。 |

函式會在下一個 JS 回合中，對每個顯示的日期各詢問一次，已回答過的日期不會再詢問：翻動月份時只會詢問新出現的日期，因此它的回傳值必須是日期的純函式。傳入另一個函式則會重新詢問。停用的日期為 `disabled:`：它不接受按下，Return 與 Space 也無法選取它。

<a id="items"></a>

## 項目

日曆中每個可按下的目標與標籤都是一個項目：「上一個」、切換鈕、「下一個」、星期、日期、月份與年份。每個項目都繪製在由 `itemClass` 與 `itemStyle` 設定樣式的部件中，其變體會隨狀態而定：

| 變體 | 項目 |
|---|---|
| `selected:` | 已選取：該日期、完整範圍中的每一天（包含兩端，與 React Aria 的範圍日曆相同）、半個範圍的起始日、顯示中的月份或年份、已開啟檢視的切換鈕。螢幕閱讀器會朗讀為已選取。 |
| `disabled:` | 不接受按下：停用的日期、星期、月份的標題、月檢視中或年份已到盡頭時的「上一個」與「下一個」。 |
| `focus:` | 擁有鍵盤焦點。 |
| `data-range-start:`、`data-range-end:` | 是完整範圍的第一天或最後一天（只有一天的範圍同時符合兩者）。 |
| `data-range-middle:` | 是完整範圍內的日期，但不是兩端。 |
| `data-today:` | 是今天。 |
| `data-outside:` | 是前一個月或後一個月的日期，用來填滿各週。 |

`data-*` 變體是 Tailwind 的（`data-range-start:` 對應 `[data-range-start]`），如同 shadcn 的 calendar 為其日期設定樣式；在 `itemClass` 中使用 `group` 時，內容會以 `group-selected:`、`group-data-range-middle:` 等依循這些變體。`selected:` 代表範圍中的每一天，因此範圍的兩端會在其上套用自己的外觀（後面的變體優先：`data-*` 排在 `selected:` 之後），而中間的日期則套用各自的外觀：

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` 依據項目本身是什麼來繪製其內容，也就是一個 `CalendarEntry`，而不是依據其狀態：繪製只會進行一次，並在項目被選取、取得焦點或納入範圍期間保留，因此按鍵、選取與焦點都不會觸發重新繪製；翻動月份時，只會對新出現的日期各繪製一次（日期以其月份與日期保留繪製結果：有多個月份時，仍在顯示中的月份會保留其繪製）。

| 欄位 | 意義 |
|---|---|
| `kind` | `"previous"`、`"monthToggle"`、`"yearToggle"`、`"next"`、`"weekday"`、`"day"`、`"month"` 或 `"year"`。 |
| `value` | 其數字：月份中的日、月份（1 到 12）、年份、星期幾（`0` 星期日到 `6`）；「上一個」與「下一個」為 `0`。 |
| `date` | 日期項目的 ISO 日期。 |
| `year`、`month` | 所屬的年與月：日期的（顯示該日的那個月）、月份切換鈕或標題的、月檢視中某個月份的；年份切換鈕與年份項目則為其自身的年份。「上一個」、「下一個」與星期為 `0`（年份切換鈕與年份則為 `month`）。 |
| `today` | 該日為今天。 |
| `outside` | 該日屬於前一個月或後一個月。 |

沒有 `renderItem` 時，項目會顯示其數字，「上一個」與「下一個」則顯示 `‹` 與 `›`，如同 `gpui-base`；星期也顯示其數字，從 `0` 到 `6`，因為月份與星期的名稱是應用程式以其語言所用的詞彙。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | 無 | 由應用程式持有的值。 |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | 未提供 `value` 時的初始值。 |
| `range` | `.range(..)` | `boolean` | `false` | 選取範圍：第一次按下開始，第二次按下結束。 |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | 並排顯示的月份數量。 |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | 每週的起始日，`0` 星期日到 `6` 星期六。 |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | 無 | 無法選取的日期。 |
| `yearRange` | `.year_range(..)` | `[number, number]` | 前後各 50 年 | 年檢視翻頁涵蓋的年份，`[start, end)`。 |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為「上一個」朗讀的內容。 |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為「下一個」朗讀的內容。 |
| `headerClass`、`headerStyle` | `.header_class(..)`、`.header_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 標頭：「上一個」、切換鈕（或各月標題）、「下一個」。 |
| `bodyClass`、`bodyStyle` | `.body_class(..)`、`.body_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 主體：並排的各月，或月檢視、年檢視的各列。 |
| `monthClass`、`monthStyle` | `.month_class(..)`、`.month_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 日檢視的每個月。 |
| `rowClass`、`rowStyle` | `.row_class(..)`、`.row_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每一列：星期、一週、一列月份或年份。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目：`selected:`、`disabled:`、`focus:`；日期項目的 `data-range-start:`、`data-range-end:`、`data-range-middle:`、`data-today:`、`data-outside:`（[項目](#items)）。 |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | 無 | 項目的內容，由應用程式依項目本身是什麼來繪製；否則顯示其數字。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 日曆：標頭位於主體上方。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 使用者選取了完整的值：`{ value }`，為一個日期或一個範圍。設定 `value` 以跟隨它。應用程式傳入的 `value` 永遠不會被回報。 |

<a id="parts"></a>

## 部件

| 部件 | 位置 | 樣式設定方式 |
|---|---|---|
| 日曆 | 根節點 | `class`、`style` |
| 標頭 | 日曆中的第一個子項 | `headerClass`、`headerStyle` |
| 主體 | 日曆中，位於標頭之後 | `bodyClass`、`bodyStyle` |
| 月份 | 主體（日檢視） | `monthClass`、`monthStyle` |
| 列 | 月份中，或主體（月與年檢視） | `rowClass`、`rowStyle` |
| 項目 | 標頭與各列 | `itemClass`、`itemStyle`、`renderItem`（`group-selected:`、`group-data-range-middle:` 等位於內部，在 `itemClass` 中置於 `group` 之下） |

<a id="keyboard"></a>

## 鍵盤操作

所有日期合為 Tab 的一個停駐點：焦點會落在已選取的日期，否則落在今天，再否則落在第一個顯示的日期。接著：

| 按鍵 | 動作 |
|---|---|
| Left / Right | 前一天或後一天。 |
| Up / Down | 前一週或後一週的同一天。 |
| Home / End | 該週的第一天或最後一天。 |
| Page Up / Page Down | 前一個月或後一個月的同一天。 |
| Shift+Page Up / Shift+Page Down | 前一年或後一年的同一天。 |
| Return, Space | 選取該日期。 |

在由右至左的版面配置中，各週從右側開始排列，因此 Left 是後一天，Right 是前一天；Up 與 Down 維持以週為單位。移動超出顯示的月份時會自動翻月。「上一個」、切換鈕、「下一個」、月份與年份皆可按下。
`gpui-base` 的日期只接受按下；按鍵行為是 NSH 自己的，依循 WAI-ARIA 的 date picker dialog。

<a id="accessibility"></a>

## 無障礙

- 每一天都是以其 ISO 日期命名的按鈕，當它是該日期或範圍中的一天時為已選取（包含兩端，與 React Aria 的範圍日曆相同），停用時則呈現淡化。
- 「上一個」與「下一個」是分別以 `previousAccessibilityLabel` 與 `nextAccessibilityLabel` 命名的按鈕；切換鈕、月份與年份則是以其所顯示內容命名的按鈕。

有關標籤、角色與朗讀內容的一般說明，請參閱 [無障礙](../docs/accessibility.md)。
