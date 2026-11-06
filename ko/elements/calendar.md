---
title: "Calendar"
description: "Calendar 컴포넌트: 일 단위로 표시된 월 화면에서 날짜 또는 날짜 범위를 선택하며, 월 및 연도 보기와 키보드를 지원하고, 앱에서 스타일을 지정할 수 있습니다."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

캘린더는 날짜 하나를 선택하며, `range`를 사용하면 날짜 범위를 선택합니다. 주 단위로 배열된 월별 날짜 중에서 고르며, 폼의 마감일, 숙박 기간, 리포트 대상 일자 등에 쓰입니다. 한 달 또는 여러 달을 나란히 보여 주고, 이전/다음 버튼으로 달을 넘기며, 멀리 이동할 때는 연도의 월 보기나 연도 페이지 보기로 전환합니다. [DatePicker](./date-picker.md)의 팝업 안에 있는 캘린더와 같은 것이며, 페이지에 단독으로 놓을 수도 있습니다.

캘린더는 동작을 담당합니다. 값(앱이 소유하거나 캘린더 자체 값), 표시되는 달, 보기, 선택할 수 없는 날짜, 키보드, 스크린 리더가 읽는 내용이 여기에 해당합니다. 외관은 앱이 정합니다. 앱이 헤더, 본문, 각 월, 각 행, 각 항목의 스타일을 지정하고, 항목의 내용(월과 요일의 이름, 오늘 표시, 범위의 띠)을 그립니다. 그리드는 표의 열처럼 주어진 너비를 가득 채웁니다. 월들이 그 너비를 나눠 가지고, 한 행의 항목들도 행을 균등하게 나눠 가집니다. 그래서 휴대폰 시트 안의 캘린더는 화면 전체에 걸쳐 펼쳐지고, 내용 크기에 맞춘 팝업 안의 캘린더는 항목의 너비를 유지합니다(`itemClass` 또는 `monthClass` 안의 `flex-none`는 항목이나 월을 자신의 너비로 유지합니다).

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

`Calendar` 컴포넌트는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `calendar()`가 속성마다 setter를, 이벤트마다 리스너(`.on_change(..)`)를 가진 캘린더를 만듭니다(setter: `.value(..)`, `.range(..)`, `.number_of_months(..)`). 값은 `Date`(`Date::Single`, `Date::Range`, `chrono::NaiveDate` 또는 그 쌍에서 생성)이며, 비활성화할 날짜는 `Matcher`입니다.

<a id="value"></a>

## 값

값은 HTML `<input type="date">`의 값과 같은 ISO 날짜 `"2026-10-28"` 형식입니다. `range`를 사용하면 `[start, end]` 형식이며, `null`는 날짜가 없음을 뜻합니다. `value`를 지정하면 앱이 값을 소유합니다. 캘린더는 그 값을 선택된 상태로 표시하고, 사용자가 날짜를 고르면 `onChange({ value })`로 알립니다. 앱은 이를 따라가도록 `value`를 설정합니다. 생략하면 캘린더가 자체 값을 유지하며, 처음에는 `defaultValue`에서 가져옵니다.

`onChange` 이벤트는 `gpui-base`의 `Selected`처럼 완전한 값만 알립니다. 눌린 날짜 또는 범위의 끝이 여기에 해당합니다.

- `range`가 없으면 날짜를 눌러 선택합니다.
- `range`를 사용하면 첫 번째 누름이 범위를 시작하고 두 번째 누름이 범위를 끝냅니다. 둘 사이의 날짜는 범위에 속합니다(각각 `selected`이며 양 끝을 포함합니다. [항목](#items) 참고). 더 이른 날짜를 다시 누르면 그 날짜에서 범위가 새로 시작되며, 범위가 완성된 뒤에 누를 때도 마찬가지입니다. 절반만 정해진 범위는 완성될 때까지 표시되고, 완성된 뒤에야 알려집니다.

캘린더는 값(범위라면 시작일)이 속한 달에서 열리며, 값이 없으면 오늘이 속한 달에서 열립니다.

<a id="months-and-views"></a>

## 월과 보기

`numberOfMonths`는 표시된 달부터 시작해 그 수만큼의 달을 나란히 보여 주며, 이전과 다음은 한 번에 한 달씩 넘깁니다. `firstDayOfWeek`는 주가 시작되는 요일로, `0` 일요일(기본값)부터 `6` 토요일까지입니다.

헤더에는 이전, 토글 두 개, 다음이 있습니다.

- 일 보기는 월들의 날짜를 보여 줍니다. 각 월은 요일 행과 주들로 이루어진 열이며, 앞뒤 달의 날짜가 주의 빈칸을 채웁니다(`outside`, `data-outside`).
- 월 토글(`monthToggle`)은 월 보기를 엽니다. 열두 달이 한 행에 세 개씩 표시되며, 하나를 고르면 일 보기에서 그 달이 표시됩니다.
- 연도 토글(`yearToggle`)은 연도 보기를 엽니다. 한 행에 다섯 개씩 20개 연도가 한 페이지로 표시되며, 이전과 다음이 페이지를 넘깁니다. 하나를 고르면 일 보기에서 그 연도가 표시됩니다. `yearRange`는 페이지가 이어지는 연도 범위로, `[start, end)`입니다(기본값: 올해 기준 50년 전부터 50년 후까지).

여러 달을 표시할 때 헤더는 토글 대신 각 월의 제목을 보여 줍니다(누름을 받지 않는 `monthToggle` 항목이며, `gpui-base`의 경우와 같습니다).

<a id="disabled-dates"></a>

## 비활성화된 날짜

`disabledMatcher`는 사용자가 선택할 수 없는 날짜로, `gpui-base`의 `Matcher`와 같으며 네 가지 형태 중 하나로 지정합니다.

| 형태 | 비활성화되는 날짜 |
|---|---|
| `[0, 6]` | 해당 요일들. `0` 일요일부터 `6` 토요일까지입니다. |
| `{ before, after }` | `before` 이전과 `after` 이후의 날짜(둘 중 하나는 생략 가능). |
| `{ from, to }` | `from`부터 `to`까지의 날짜(양 끝 포함, 생략한 쪽은 열려 있음). |
| `(date) => boolean` | 표시된 각 날짜의 ISO 날짜를 받아 함수가 `true`를 반환하는 날짜. |

함수는 표시된 날짜마다 한 번, 다음 JS 턴에 호출되며, 이미 답한 날짜에 대해서는 다시 호출되지 않습니다. 따라서 달을 넘기면 새로 나타나는 날짜에 대해서만 호출되므로, 함수의 결과는 날짜에 대한 순수 함수여야 합니다. 다른 함수를 전달하면 다시 호출됩니다. 비활성화된 날짜는 `disabled:` 상태입니다. 누름을 받지 않으며, Return과 Space로도 선택되지 않습니다.

<a id="items"></a>

## 항목

캘린더에서 누를 수 있거나 레이블이 있는 모든 요소는 항목입니다. 이전, 토글, 다음, 요일, 날짜, 월, 연도가 여기에 해당합니다. 각 항목은 `itemClass`와 `itemStyle`로 스타일을 지정하는 파트로 그려지며, 변형은 항목의 상태를 따릅니다.

| 변형 | 항목 |
|---|---|
| `selected:` | 선택된 항목: 날짜, 완성된 범위의 모든 날짜(React Aria의 range calendar처럼 양 끝 포함), 반쪽 범위의 시작일, 표시된 월이나 연도, 열려 있는 보기의 토글. 스크린 리더는 선택된 것으로 읽습니다. |
| `disabled:` | 누름을 받지 않는 항목: 비활성화된 날짜, 요일, 월의 제목, 월 보기에서의 이전과 다음, 또는 연도 범위의 끝에서의 이전과 다음. |
| `focus:` | 키보드 포커스를 가진 항목. |
| `data-range-start:`, `data-range-end:` | 완성된 범위의 첫째 또는 마지막 날(하루짜리 범위는 둘 다 해당). |
| `data-range-middle:` | 완성된 범위 안의 날짜(양 끝 제외). |
| `data-today:` | 오늘. |
| `data-outside:` | 주의 빈칸을 채우는 앞뒤 달의 날짜. |

`data-*` 변형은 Tailwind의 것입니다(`data-range-start:`는 `[data-range-start]`와 일치합니다). shadcn의 캘린더가 날짜를 스타일링하는 방식과 같습니다. `itemClass` 안에 `group`를 사용하면 내용도 `group-selected:`, `group-data-range-middle:` 등으로 같은 변형을 따릅니다. `selected:`는 범위의 모든 날짜를 뜻하므로, 범위의 양 끝은 그 위에 자신의 모양을 덮어쓰고(나중에 오는 변형이 우선하므로 `data-*`는 `selected:` 뒤에 옵니다), 중간 날짜는 자신의 모양을 가집니다.

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem`는 항목의 내용을 그 항목이 무엇인지, 즉 `CalendarEntry`로부터 그리며 상태로부터는 절대 그리지 않습니다. 그림은 한 번 만들어져 항목이 선택되거나 포커스를 받거나 범위에 들어가도 유지되므로, 키 입력, 선택, 포커스 이동은 다시 그리지 않습니다. 달을 넘기면 새로 나타나는 날짜만 한 번씩 그립니다(날짜는 월과 날짜를 기준으로 그림을 유지하므로, 여러 달을 표시할 때 계속 보이는 달은 그림을 유지합니다).

| 필드 | 의미 |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` 또는 `"year"`. |
| `value` | 항목의 숫자: 날짜의 일, 월(1~12), 연도, 요일(`0` 일요일부터 `6`까지). 이전과 다음은 `0`. |
| `date` | 날짜의 ISO 날짜. |
| `year`, `month` | 항목이 속한 연도와 월. 날짜의 경우 그 날짜를 보여 주는 주가 속한 월, 월 토글이나 제목의 경우 그 월, 월 보기의 월, 연도 토글과 연도의 경우 자신의 연도입니다. 이전, 다음, 요일은 `0`(연도 토글과 연도는 `month`). |
| `today` | 해당 날짜가 오늘임. |
| `outside` | 해당 날짜가 앞뒤 달에 속함. |

`renderItem`가 없으면 항목은 자신의 숫자를 보여 주고, 이전과 다음은 `gpui-base`의 경우처럼 `‹`와 `›`를 보여 줍니다. 요일도 숫자(`0`부터 `6`까지)를 보여 주는데, 월과 요일의 이름은 앱의 언어로 쓰는 앱의 말이기 때문입니다.

## Props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | 없음 | 앱이 소유하는 값. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | `value`가 없을 때의 초기 값. |
| `range` | `.range(..)` | `boolean` | `false` | 범위 선택: 첫 번째 누름이 시작하고 두 번째 누름이 끝냅니다. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | 나란히 표시할 월의 수. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | 주가 시작되는 요일. `0` 일요일부터 `6` 토요일까지. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | 없음 | 선택할 수 없는 날짜. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 양쪽 50년 | 연도 보기가 페이지로 넘기는 연도 범위, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 이전에 대해 읽는 내용. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 다음에 대해 읽는 내용. |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 헤더: 이전, 토글(또는 월의 제목), 다음. |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 본문: 나란히 놓인 월들, 또는 월 보기나 연도 보기의 행들. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 일 보기의 각 월. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 행: 요일, 한 주, 월이나 연도의 한 행. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 항목: `selected:`, `disabled:`, `focus:`. 날짜의 `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([항목](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | 없음 | 항목이 무엇인지에 따라 앱이 그리는 항목의 내용. 없으면 항목의 숫자. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 캘린더: 본문 위의 헤더. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 사용자가 완전한 값(`{ value }`, 날짜 또는 범위)을 선택했습니다. 이를 따라가려면 `value`를 설정하세요. 앱이 전달한 `value`는 알리지 않습니다. |

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일 지정 |
|---|---|---|
| 캘린더 | 루트 | `class`, `style` |
| 헤더 | 캘린더, 첫 번째 | `headerClass`, `headerStyle` |
| 본문 | 캘린더, 헤더 다음 | `bodyClass`, `bodyStyle` |
| 월 | 본문(일 보기) | `monthClass`, `monthStyle` |
| 행 | 월 또는 본문(월 보기와 연도 보기) | `rowClass`, `rowStyle` |
| 항목 | 헤더와 행 | `itemClass`, `itemStyle`, `renderItem` (안쪽의 `group-selected:`, `group-data-range-middle:`, ... 는 `itemClass` 안의 `group` 아래) |

<a id="keyboard"></a>

## 키보드

날짜들은 Tab의 정지점 하나입니다. 선택된 날짜에 포커스가 가고, 없으면 오늘, 그것도 없으면 표시된 첫 번째 날짜로 갑니다. 그 다음에는 다음과 같이 동작합니다.

| 키 | 동작 |
|---|---|
| Left / Right | 이전 날 또는 다음 날. |
| Up / Down | 한 주 전 또는 한 주 후의 같은 요일. |
| Home / End | 그 주의 첫째 날 또는 마지막 날. |
| Page Up / Page Down | 한 달 전 또는 한 달 후의 같은 날. |
| Shift+Page Up / Shift+Page Down | 일 년 전 또는 일 년 후의 같은 날. |
| Return, Space | 날짜를 선택. |

오른쪽에서 왼쪽으로 쓰는 레이아웃에서는 주가 오른쪽에서 시작하므로 Left는 다음 날, Right는 이전 날이 되며, Up과 Down은 주 단위 이동을 그대로 유지합니다. 표시된 월을 벗어나 이동하면 월이 넘어갑니다. 이전, 토글, 다음, 월, 연도는 누름을 받습니다.
`gpui-base` 안의 날짜는 누름만 받으며, 키 동작은 WAI-ARIA date picker dialog를 따른 NSH의 것입니다.

<a id="accessibility"></a>

## 접근성

- 각 날짜는 ISO 날짜를 이름으로 가진 버튼이며, 해당 날짜이거나 범위에 속한 날짜(React Aria의 range calendar처럼 양 끝 포함)이면 선택된 상태로, 비활성화되면 흐리게 표시됩니다.
- 이전과 다음은 `previousAccessibilityLabel`와 `nextAccessibilityLabel`를 이름으로 가진 버튼이며, 토글, 월, 연도는 표시된 내용을 이름으로 가진 버튼입니다.

레이블, 역할, 안내 방송에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.
