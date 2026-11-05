---
title: "TimeField"
description: "TimeField 컴포넌트: 시, 분, 초를 세그먼트 단위로 키보드나 휴대폰 숫자 키패드로 편집하는 시각 입력 필드이며, 앱에서 스타일을 지정할 수 있습니다."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

시간 필드는 하루 중 시각을 세그먼트 단위로 편집합니다. 시, 분, `precision="second"` 사용 시 초, `hourCycle="h12"` 사용 시 AM 또는 PM 세그먼트가 있습니다. 알림 시각, 회의 시작 시각, 가게 영업 시간 등에 쓸 수 있습니다. `timePrecision` 사용 시 [DatePicker](./date-picker.md)의 캘린더 아래에 있는 시간 입력과 같으며, 여기서는 페이지에서 단독으로 쓰입니다.

동작은 필드가 담당합니다. 시간(앱이 가진 값 또는 필드 자체의 값), 키로 편집할 세그먼트, 숫자 입력과 증감, 스크린 리더가 읽는 내용이 여기에 포함됩니다. 외형은 앱이 담당합니다. 앱이 세그먼트와 그 사이의 `:`을 스타일링하거나 세그먼트를 직접 그립니다.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField`은(는) Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `time_field()`이 prop마다 setter(`.value(..)`, `.precision(..)`, `.hour_cycle(..)`)를, 이벤트마다 리스너(`.on_change(..)`)를 가진 인스턴스를 만듭니다. 시간 값은 `TimeOfDay`, 즉 `chrono::NaiveTime`입니다.

## Value

값은 HTML `<input type="time">`과 같은 24시간제 시각입니다. 형식은 `"HH:MM"`이며, `precision="second"`이 있으면 `"HH:MM:SS"`입니다. 필드가 표시하는 `hourCycle`에 따라 달라집니다. `value`을 지정하면 앱이 값을 소유합니다. 필드는 그 값을 표시하고 편집할 때마다 `onChange({ value })`로 알리며, 앱은 `value`을 설정해 이를 따라갑니다. 지정하지 않으면 필드가 자체 시간을 유지하며, 처음에는 `defaultValue`에서 가져옵니다(기본값 `00:00`).

`precision`은 필드가 편집하는 가장 작은 단위로, `"minute"`(기본값) 또는 `"second"`입니다. `hourCycle`은 시를 세는 방식입니다. `"h23"`(기본값)은 00부터 23까지이고, `"h12"`는 12부터 11까지이며 숫자 뒤에 AM/PM 세그먼트가 붙습니다.

## Editing

한 번에 하나의 세그먼트가 선택되며, 키는 그 세그먼트를 편집합니다. `gpui-base`의 시간 필드와 같은 방식입니다.

- 위/아래 키는 세그먼트를 1씩 증감하며 처음과 끝이 이어집니다(59에서 00). 다음 세그먼트로 올림되지는 않습니다.
- 숫자는 두 자리씩 입력됩니다. 더 긴 값의 시작이 될 수 없는 숫자(시에서 `7`)를 입력하면 세그먼트가 완성되고 다음 세그먼트로 이동합니다.
- `a`와 `p`는 AM과 PM을 설정합니다.
- Backspace와 Delete는 세그먼트를 초기화합니다.

세그먼트를 누르면 선택됩니다. 이미 선택된 AM/PM 세그먼트를 누르면 값이 전환됩니다. 휴대폰에는 `a` 키와 `p` 키가 없기 때문입니다. 키 입력은 세그먼트 뒤에 있는 투명한 네이티브 텍스트 필드 하나로 전달되며, [OtpInput](./otp-input.md)과 같은 방식입니다. 휴대폰과 태블릿에서는 숫자 키패드가 표시됩니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 없음 | 앱이 소유하는 시간. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | `value` 없이 사용할 때의 초기 시간. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | 편집하는 가장 작은 단위. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 시를 세는 방식. `"h12"`는 AM/PM 세그먼트를 추가합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 포커스와 편집이 불가능합니다. `disabled:` 스타일이 필드와 세그먼트에 적용됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 필드를 부르는 이름. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 세그먼트. `focus:`은 필드에 포커스가 있는 동안 선택된 세그먼트에, `disabled:`은 필드와 함께 적용됩니다. `group`를 사용하면 내용이 이 값들을 따릅니다(`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 숫자 사이의 각 `:`. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | 없음 | 세그먼트가 표시하는 값을 기반으로 앱이 그리는 세그먼트 내용. 지정하지 않으면 레이블이 사용됩니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 세그먼트를 감싸는 필드(행). |

`renderSegment`는 `TimeFieldSegmentEntry`을 받습니다. 여기에는 `segment`(`"hour"`, `"minute"`, `"second"` 또는 `"period"`), `value`(필드의 시계 기준 시, 분 또는 초이며, AM은 `0`, PM은 `1`), `label`(두 자리 숫자 또는 `AM` / `PM`)이 있습니다. 세그먼트의 상태는 전달되지 않습니다. 세그먼트는 키로 편집하는 동안 `focus:` 상태이고 필드와 함께 `disabled:` 상태가 되며, `segmentClass`에서 `group`를 사용하면 내용이 `group-focus:`과 `group-disabled:`을 따릅니다. 따라서 세그먼트는 값이 바뀔 때만 다시 그려집니다. 세그먼트 사이를 이동하거나 포커스가 들어오고 나가는 것만으로는 다시 그려지지 않습니다.

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

## Events

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 사용자가 시간을 변경했습니다: `{ value }`. 이를 따라가려면 `value`을 설정합니다. 앱이 전달한 `value`은 보고되지 않습니다. |

## Parts

| Part | 위치 | 스타일링 방법 |
|---|---|---|
| 필드 | 루트, 행 | `class`, `style` |
| 세그먼트 | 필드 안: 시, 분, 초, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:`는 내부에서 `segmentClass`의 `group` 아래) |
| 구분자 | 필드 안, 두 숫자 사이 | `separatorClass`, `separatorStyle` |

## Keyboard

Tab 키로 필드에 이동하면 선택된 세그먼트에 포커스가 놓입니다. 이후 동작은 다음과 같습니다.

| 키 | 동작 |
|---|---|
| 왼쪽 / 오른쪽 | 이전 또는 다음 세그먼트. |
| Tab / Shift+Tab | 다음 또는 이전 세그먼트. 마지막 세그먼트에서 Tab, 첫 세그먼트에서 Shift+Tab을 누르면 필드를 벗어납니다. |
| 위 / 아래 | 세그먼트를 1씩 증감하며 처음과 끝이 이어집니다. |
| 0~9 | 세그먼트에 숫자를 입력합니다. |
| A / P | AM 또는 PM. |
| Backspace, Delete | 세그먼트를 초기화합니다. |

## Accessibility

- 필드는 `accessibilityLabel`로 이름이 지정되는 텍스트 필드이며, 스크린 리더는 필드에 표시된 시간을 읽습니다. `disabled`는 필드를 흐리게 표시합니다.
- 휴대폰과 태블릿에서는 숫자 키패드가 표시됩니다.

레이블, 역할, 안내 방송에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.
