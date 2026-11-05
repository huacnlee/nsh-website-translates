---
title: "DatePicker"
description: "DatePicker 컴포넌트: 데스크톱에서는 트리거 위치의 팝업, 휴대폰에서는 시트로 표시되는 캘린더에서 날짜, 날짜 범위 또는 날짜와 시간을 선택하며, 스타일은 앱에서 지정합니다."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

DatePicker는 앱의 트리거에서 열리는 [Calendar](./calendar.md)로 날짜를 설정합니다. 마감일이나 생일은 물론, `range`를 쓰면 여행 기간의 날짜들을, `timePrecision`을 쓰면 날짜와 시각을 설정할 수 있습니다. [Select](./select.md)처럼 각 기기가 기대하는 방식으로 열립니다.

- 데스크톱과 데스크톱 브라우저에서는 트리거 위치에 팝업이 열리며, 팝업이 열리면 키보드 포커스가 날짜로 이동합니다.
- 휴대폰과 태블릿에서는 배경(backdrop) 위로 화면 하단에 시트가 열립니다.

동작은 선택기가 담당합니다. 값(앱이 소유하거나 선택기 자체의 값), 열림 상태, 캘린더, 시간, 프리셋, 키보드, 그리고 스크린 리더가 읽어 주는 내용이 이에 해당합니다. 외형은 앱이 담당합니다. 앱이 트리거(값, 플레이스홀더, 아이콘 포함)를 그리고, 팝업, 캘린더의 각 부분, 프리셋, 시간 필드의 스타일을 지정합니다.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker`는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `date_picker()`로 prop마다 하나의 setter(`.value(..)`, `.range(..)`, `.time_precision(..)`)를, 이벤트마다 하나의 리스너(`.on_change(..)`)를 가진 선택기를 만듭니다. 값은 `DateTime`입니다(`DateTime::Single`, `DateTime::Range`, 그리고 날짜 또는 날짜와 시각에 대한 `chrono`). `onChange`은 선택기의 시간 정밀도를 적용한 값인 `PickedDate`을 반환합니다.

## Value

값은 HTML input의 형식을 따릅니다. ISO 날짜 `"2026-10-28"`은 `<input type="date">`의 형식과 같고, `range`에서는 `[start, end]`, `timePrecision`에서는 날짜와 시각인 `"2026-10-28T09:30"`(초 단위에서는 `"2026-10-28T09:30:15"`)이며 이는 `<input type="datetime-local">`의 형식과 같습니다. `null`은 값이 없음을 뜻합니다. `value`을 쓰면 앱이 값을 소유합니다. 선택기는 그 값을 표시하고 변경될 때마다 `onChange({ value })`로 알리며, 앱은 `value`를 설정해 이를 따라갑니다. 생략하면 선택기가 자체 값을 유지하며, 처음에는 `defaultValue`에서 가져옵니다.

- 단일 날짜: 날짜를 누르면 값이 설정되고 팝업이 닫힙니다.
- `range`을 쓰면 첫 번째 누름이 범위를 시작하고 두 번째 누름이 범위를 끝내며, 이는 [calendar의 방식](./calendar.md#value)과 같습니다. 완성된 범위가 값으로 설정되고 팝업이 닫힙니다.
- `timePrecision`을 쓰면(단일 날짜에서만 가능) 캘린더 아래에 시간 필드가 표시되고 시간을 편집할 때마다 변경이 보고됩니다. 데스크톱에서는 날짜를 선택해도 시간을 입력할 수 있도록 팝업이 열린 채로 유지되며, 날짜와 시각이 함께 보고됩니다. 선택된 날짜를 다시 누르면 팝업이 닫힙니다. 휴대폰과 태블릿에서는 날짜를 탭하면 해당 시각으로 날짜가 선택되고 단일 날짜일 때처럼 시트가 닫히며, 시간을 편집하려면 시트를 다시 엽니다. 시각을 지정하기 전에 선택된 날짜에는 `defaultTime`(기본값 `00:00`)이 적용됩니다. `hourCycle`는 필드가 시(hour)를 표시하는 방식입니다.

`cleanable`은 값이 있는 동안 지우기 버튼을 추가하며, 누르면 값이 지워집니다(`onChange({ value: null })`). 지우기 버튼은 트리거 안이 아니라 트리거 뒤에 오므로 이 버튼을 눌러도 팝업이 열리지 않습니다. 앱이 버튼의 위치를 정하고 내용을 채우며(`clearButton`), 이는 [select의 지우기 버튼](./select.md#value)과 같습니다.

## Presets

`presets`은 캘린더 옆에서 값을 설정하는 버튼입니다. "오늘", "최근 7일", "내일 오전 9시" 같은 것이 해당합니다. 각 프리셋은 `{ label, value }`이며, `value`은 날짜, 범위, 또는 날짜와 시각이고 주어진 그대로 유지됩니다. 누르면 값이 설정되고 팝업이 닫힙니다. `contentClass`는 프리셋 열과 시간이 포함된 캘린더를 배치하고(행, `flex-row`), `presetsClass`는 열의 스타일을, `presetClass`는 각 버튼의 스타일을 지정합니다.

## The calendar

값을 제외한 [Calendar](./calendar.md)의 모든 prop이 선택기에도 그대로 전달됩니다. `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, 부분(`headerClass` ~ `itemStyle`), 그리고 `renderItem`가 해당합니다. `calendarClass`와 `calendarStyle`는 캘린더 자체의 스타일을 지정합니다. 뷰와 키는 캘린더와 같습니다.

시간 행(`timeClass`, `timeStyle`)은 시작 부분에 앱이 정한 문구("시간" 등)인 `timeLabel`를, 끝 부분에 시간 필드(`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`)를 담습니다. 항목이 세로 중앙에 정렬되고 양쪽으로 벌어지는 행입니다(`flex-row items-center justify-between`, `gpui-component`와 같음). 필드의 세그먼트는 [TimeField](./time-field.md)의 것과 같습니다(`segmentClass`, `separatorClass`, `renderSegment`).

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | 없음 | 앱이 소유하는 값. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | `value`가 없을 때의 초기 값. |
| `range` | `.range(..)` | `boolean` | `false` | 날짜 범위를 선택합니다. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | 열림 상태. 앱이 소유하거나 선택기 자체의 상태. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 닫힌 상태를 유지하며 누름과 키보드 포커스를 받지 않습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 부르는 이름. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"`과 시각 | 스크린 리더가 값을 읽는 방식. `chrono`의 형식을 따릅니다. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | 없음 | 시각도 이 단위까지 편집합니다. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 시간 필드가 시(hour)를 표시하는 방식. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | 사용자가 시각을 지정하기 전에 날짜에 적용되는 시각. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 값이 있는 동안 표시되는 지우기 버튼. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | 팝업에서 값을 설정하는 버튼. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | `Calendar`와 같음 | `Calendar`와 같음 | `Calendar`와 같음 | 캘린더의 월, 주, 비활성화된 날짜, 연도. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `Calendar`와 같음 | `string` | 없음 | 캘린더의 이전 및 다음에 대해 스크린 리더가 읽는 내용. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | `Select`와 같음 | `"bottom"`, `"start"`, 0, 0 | 데스크톱: 트리거를 기준으로 한 팝업의 위치. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업(데스크톱) 또는 시트(터치 스크린). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 시트 뒤의 배경(backdrop). |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업의 콘텐츠: 캘린더 옆의 프리셋과 시간. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 프리셋 열. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 프리셋의 버튼. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 캘린더. |
| `headerClass` … `itemStyle` | `Calendar`와 같음 | `Calendar`와 같음 | 없음 | 캘린더의 헤더, 본문, 월, 행, 항목. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | 없음 | 캘린더의 각 항목. 앱이 항목의 상태에 따라 그리며, 상태는 항목의 클래스로 나타납니다(`Calendar`와 같음). |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 시간 행: 시작 부분의 레이블과 끝 부분의 필드. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | 없음 | 시간 행에서 필드 앞에 표시되는 내용. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 시간 필드. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 시간 필드를 부르는 이름. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | `TimeField`와 같음 | `TimeField`와 같음 | 없음 | 시간 필드의 세그먼트와 `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 지우기 버튼(`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 없음 | 지우기 버튼의 내용. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 지우기 버튼을 부르는 이름. |
| `trigger` | `.trigger(..)` | `JSX.Element` | 없음 | 누르면 팝업을 여는 요소. 팝업은 이 요소를 기준으로 배치됩니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 트리거를 둘러싼 뷰. |

## Events

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 값이 변경되었습니다(날짜, 범위의 끝, 프리셋, 시간, 지우기 버튼): `{ value }`. 이를 따라가려면 `value`를 설정합니다. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 팝업이 열리거나 닫혔으며, 그 이유(`{ open, reason }`)가 함께 전달됩니다. 이를 따라가려면 `open`를 설정합니다. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | 팝업이 표시되었거나 사라졌습니다. |
| `onCancel` | `.on_cancel(..)` | 사용자가 선택 없이 팝업을 닫았습니다(Escape 또는 뒤로 가기, 바깥쪽이나 배경을 누름). |

## Parts

| 부분 | 위치 | 스타일 지정 방법 |
|---|---|---|
| 트리거 | 선택기의 뷰 | 앱의 요소(`trigger`) |
| 지우기 버튼 | 선택기의 뷰, 트리거 뒤(`cleanable`, 값이 있는 동안) | `clearButtonClass`, `clearButtonStyle`. 내용은 `clearButton` |
| 팝업 또는 시트 | 모든 요소 위, 트리거 위치(데스크톱) 또는 하단(터치 스크린) | `popupClass`, `popupStyle` |
| 배경(backdrop) | 시트 뒤(터치 스크린) | `backdropClass`, `backdropStyle` |
| 콘텐츠 | 팝업 | `contentClass`, `contentStyle` |
| 프리셋 | 콘텐츠의 맨 앞(`presets`) | `presetsClass`, `presetsStyle`. 각 프리셋은 `presetClass`, `presetStyle` |
| 캘린더 | 콘텐츠 | `calendarClass`, `calendarStyle` 및 [Calendar](./calendar.md#parts)의 부분 |
| 시간 행 | 캘린더 아래(`timePrecision`) | `timeClass`, `timeStyle`. 레이블은 `timeLabel` |
| 시간 필드 | 시간 행 | `timeFieldClass`, `timeFieldStyle` 및 [TimeField](./time-field.md#parts)의 부분 |

## Keyboard

| 키 | 동작 |
|---|---|
| Return (트리거에서) | 팝업을 열거나 닫습니다. |
| Delete, Backspace (트리거에서) | 팝업이 닫혀 있는 동안 값을 지웁니다. |
| Escape | 선택 없이 팝업을 닫습니다. |

팝업에서는 캘린더의 키로 날짜 간에 이동하고 날짜를 선택하며([Keyboard](./calendar.md#keyboard) 참조), 시간 필드의 키로 시간을 편집합니다([Keyboard](./time-field.md#keyboard) 참조).

## Accessibility

- 트리거는 스크린 리더에게 콤보박스입니다. 레이블은 `accessibilityLabel`이고, 값은 `dateFormat`가 작성하는 형식의 날짜(기본값은 `2026/10/28`이며 시간은 `timePrecision`에서 지정)이며, 팝업이 펼쳐져 있는지도 알려 줍니다. `disabled`는 트리거를 흐리게 표시합니다.
- 캘린더의 날짜는 ISO 날짜로 이름이 붙은 버튼입니다([Accessibility](./calendar.md#accessibility) 참조). 프리셋은 레이블로 이름이 붙은 버튼이며, 시간 필드는 `timeAccessibilityLabel`로 이름이 붙습니다.
- 지우기 버튼은 `clearButtonAccessibilityLabel`로 이름이 붙은 버튼입니다.

레이블, 역할, 안내 방송에 대한 전반적인 내용은 [Accessibility](../docs/accessibility.md)를 참조하세요.
