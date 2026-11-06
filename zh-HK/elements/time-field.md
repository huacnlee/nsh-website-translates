---
title: "TimeField"
description: "TimeField 元件:以分段方式編輯一日中的時間(時、分、秒),可使用鍵盤或手機數字鍵盤輸入,外觀由應用程式自行設定樣式。"
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---


# TimeField

時間欄位以逐個欄段編輯一天中的時間：時、分，配合 `precision="second"` 可編輯秒，配合 `hourCycle="h12"` 可編輯 AM 或 PM。適用於提醒的時間、會議的開始時間、商店的營業時間。它就是 [DatePicker](./date-picker.md) 日曆下方配合 `timePrecision` 使用的時間部分，只是獨立放在頁面中。

欄位負責行為：時間（由應用程式提供，或由欄位自行保存）、按鍵編輯哪個欄段、輸入與步進數字，以及螢幕閱讀器讀出的內容。外觀則由應用程式決定：可為欄段及其之間的 `:` 設定樣式，或自行繪製欄段。

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

`TimeField` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`time_field()` 會建立一個欄位，每個 prop 有一個 setter（`.value(..)`、`.precision(..)`、`.hour_cycle(..)`），每個事件有一個監聽器（`.on_change(..)`）。它的時間是 `TimeOfDay`，即 `chrono::NaiveTime`。

<a id="value"></a>

## 值

值是以 24 小時制表示的一天中的時間，格式與 HTML `<input type="time">` 相同：`"HH:MM"`，若配合 `precision="second"` 則為 `"HH:MM:SS"`，視乎 `hourCycle` 欄位顯示的內容而定。使用 `value` 時，時間由應用程式持有：欄位顯示該值，並以 `onChange({ value })` 回報每次編輯；應用程式需設定 `value` 以跟隨變更。若省略，欄位會自行保存時間，初始值取自 `defaultValue`（預設為 `00:00`）。

`precision` 是欄位可編輯的最小單位，可為 `"minute"`（預設）或 `"second"`。`hourCycle` 決定小時的計算方式：`"h23"`（預設）為 00 至 23，`"h12"` 為 12 至 11，數字之後會加上 AM/PM 欄段。

<a id="editing"></a>

## 編輯

欄位中有一個已選取的欄段，按鍵會編輯該欄段，行為與 `gpui-base` 的時間欄位相同：

- 按上、下方向鍵以 1 為單位步進欄段並循環（59 之後回到 00），不會進位到下一個欄段。
- 數字會輸入到欄段中，每次兩位：若某個數字不可能作為更長數值的開頭（例如小時中的 `7`），便會完成該欄段並移到下一個欄段。
- `a` 和 `p` 分別設為 AM 和 PM。
- Backspace 和 Delete 會重設欄段。

按一下欄段即可選取。按一下已選取的 AM/PM 欄段會切換 AM 與 PM，因為手機沒有 `a` 和 `p` 鍵。按鍵會傳到欄段後方一個透明的原生文字欄位，做法與 [OtpInput](./otp-input.md) 相同：在手機和平板上會彈出數字鍵盤。

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 無 | 時間，由應用程式持有。 |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | 沒有 `value` 時的初始時間。 |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | 可編輯的最小單位。 |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 小時的計算方式；`"h12"` 會加入 AM/PM 欄段。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法取得焦點，也無法編輯；`disabled:` 樣式會套用於欄位及其欄段。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對該欄位的稱呼。 |
| `segmentClass`、`segmentStyle` | `.segment_class(..)`、`.segment_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個欄段：欄位取得焦點時，已選取的欄段套用 `focus:`，`disabled:` 則隨欄位套用；使用 `group` 時，其內容會跟隨這些狀態（`group-focus:`、`group-disabled:`）。 |
| `separatorClass`、`separatorStyle` | `.separator_class(..)`、`.separator_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 數字之間的每個 `:`。 |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | 無 | 欄段的內容，由應用程式根據欄段顯示的內容繪製；否則顯示其標籤。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 欄位本身，圍繞其欄段（一個 row）。 |

`renderSegment` 會收到一個 `TimeFieldSegmentEntry`：`segment`（`"hour"`、`"minute"`、`"second"` 或 `"period"`）、`value`（欄位時鐘上的小時、分鐘或秒；`0` 表示 AM，`1` 表示 PM）以及 `label`（兩位數字，或 `AM` / `PM`）。它不會收到欄段的狀態：按鍵編輯該欄段時，欄段為 `focus:`，`disabled:` 則隨欄位而定；在 `segmentClass` 中使用 `group` 時，其內容會跟隨 `group-focus:` 和 `group-disabled:`。因此，欄段只會在數值改變時重繪；在欄段之間移動，以及焦點進出，都不會觸發任何繪製：

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 用戶更改了時間：`{ value }`。設定 `value` 以跟隨變更。應用程式傳入的 `value` 不會被回報。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 欄位 | 根元素，一個 row | `class`、`style` |
| 欄段 | 欄位內：時、分、秒、AM/PM | `segmentClass`、`segmentStyle`、`renderSegment`（`group-focus:`、`group-disabled:` 在內部，位於 `segmentClass` 中的 `group` 之下） |
| 分隔符 | 欄位內，兩個數字之間 | `separatorClass`、`separatorStyle` |

<a id="keyboard"></a>

## 鍵盤

按 Tab 可進入欄位，並停在已選取的欄段。之後：

| 按鍵 | 動作 |
|---|---|
| 左 / 右 | 移到前一個或後一個欄段。 |
| Tab / Shift+Tab | 移到後一個或前一個欄段；在最後一個欄段按 Tab，或在第一個欄段按 Shift+Tab，會離開欄位。 |
| 上 / 下 | 以 1 為單位步進欄段並循環。 |
| 0 至 9 | 輸入到欄段中。 |
| A / P | 設為 AM 或 PM。 |
| Backspace、Delete | 重設欄段。 |

<a id="accessibility"></a>

## 無障礙

- 欄位是一個文字欄位，名稱由 `accessibilityLabel` 提供；螢幕閱讀器會讀出欄位顯示的時間。`disabled` 會令它變暗。
- 手機和平板會顯示數字鍵盤。

有關標籤、角色和通告的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。
