---
title: "TimeField"
description: "TimeField 元件：以區段方式編輯一天中的時間（時、分、秒），可使用鍵盤或手機的數字鍵盤輸入，並由應用程式自訂樣式。"
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

時間欄位以一次一個區段的方式編輯一天中的時間：時、分，搭配 `precision="second"` 時還有秒，搭配 `hourCycle="h12"` 時還有 AM 或 PM。例如提醒的時間、會議的開始時間、商店的營業時間。它就是 [DatePicker](./date-picker.md) 搭配 `timePrecision` 時，日曆下方的時間欄位，只是單獨放在頁面中。

欄位負責行為：時間（由應用程式提供，或由欄位自行保存）、按鍵編輯的是哪個區段、數字的輸入與調整，以及螢幕閱讀器讀出的內容。外觀則由應用程式決定：可以為各區段與其間的 `:` 設定樣式，或自行繪製各區段。

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

`TimeField` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 的 `nsh-base` crate。在 Rust 中，`time_field()` 會建立一個欄位，每個屬性對應一個 setter（`.value(..)`、`.precision(..)`、`.hour_cycle(..)`），每個事件對應一個監聽器（`.on_change(..)`）。其時間是一個 `TimeOfDay`，也就是 `chrono::NaiveTime`。

## Value

值是 24 小時制的一天中的時間，格式與 HTML `<input type="time">` 相同：`"HH:MM"`，或在搭配 `precision="second"` 時為 `"HH:MM:SS"`，視 `hourCycle` 而定，也就是欄位所顯示的內容。搭配 `value` 時，時間由應用程式持有：欄位顯示該值，並以 `onChange({ value })` 回報每次編輯；應用程式設定 `value` 來跟隨變更。若省略，欄位會自行保存時間，起初取自 `defaultValue`（預設為 `00:00`）。

`precision` 是欄位可編輯的最小單位，為 `"minute"`（預設）或 `"second"`。`hourCycle` 決定小時的計算方式：`"h23"`（預設）為 00 到 23，`"h12"` 為 12 到 11，並在數字之後加上 AM/PM 區段。

## Editing

同一時間只有一個區段被選取，按鍵編輯的就是它，行為如同 `gpui-base` 的時間欄位：

- 上與下以 1 為單位調整區段並循環（59 之後回到 00），不會進位到下一個區段。
- 數字會輸入到區段中，每次兩位：若某個數字不可能作為更長數值的開頭（例如小時中的 `7`），就會完成該區段並移到下一個區段。
- `a` 與 `p` 分別設定 AM 與 PM。
- Backspace 與 Delete 會重設該區段。

按一下區段即可選取。按一下已選取的 AM/PM 區段會切換 AM 與 PM，因為手機沒有 `a` 與 `p` 鍵。按鍵會送到區段後方一個透明的原生文字欄位，做法與 [OtpInput](./otp-input.md) 相同：在手機與平板上，它會叫出數字鍵盤。

## Props

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 無 | 時間，由應用程式持有。 |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | 起初的時間，用於沒有 `value` 時。 |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | 可編輯的最小單位。 |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 小時的計算方式；`"h12"` 會加上 AM/PM 區段。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法取得焦點，也無法編輯；`disabled:` 樣式會套用到欄位及其區段。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對該欄位的稱呼。 |
| `segmentClass`、`segmentStyle` | `.segment_class(..)`、`.segment_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個區段：`focus:` 套用於欄位取得焦點時被選取的區段，`disabled:` 隨欄位套用；搭配 `group` 時，其內容會跟隨它們（`group-focus:`、`group-disabled:`）。 |
| `separatorClass`、`separatorStyle` | `.separator_class(..)`、`.separator_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 數字之間的每個 `:`。 |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | 無 | 區段的內容，由應用程式根據其顯示的值繪製；否則顯示其標籤。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 欄位本身，環繞其各區段（一個 row）。 |

`renderSegment` 會收到一個 `TimeFieldSegmentEntry`：`segment`（`"hour"`、`"minute"`、`"second"` 或 `"period"`）、`value`（欄位時鐘制式下的小時、分鐘或秒；`0` 代表 AM，`1` 代表 PM）以及 `label`（兩位數字，或 `AM` / `PM`）。它不會收到區段的狀態：按鍵正在編輯該區段時，區段為 `focus:`，隨欄位則為 `disabled:`；而在 `segmentClass` 中搭配 `group` 時，其內容會跟隨 `group-focus:` 與 `group-disabled:`。因此區段只會在其值改變時重新繪製；在區段之間移動，以及焦點的取得與失去，都不會觸發繪製：

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

## Events

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 使用者變更了時間：`{ value }`。設定 `value` 以跟隨變更。應用程式傳入的 `value` never 不會被回報。 |

## Parts

| 部件 | 位置 | 樣式設定方式 |
|---|---|---|
| 欄位 | 根節點，一個 row | `class`、`style` |
| 區段 | 位於欄位中：時、分、秒、AM/PM | `segmentClass`、`segmentStyle`、`renderSegment`（`group-focus:`、`group-disabled:` 在其內部，位於 `segmentClass` 中的 `group` 之下） |
| 分隔符號 | 位於欄位中，兩個數字之間 | `separatorClass`、`separatorStyle` |

## Keyboard

按 Tab 可進入欄位，並停在其已選取的區段。接著：

| 按鍵 | 動作 |
|---|---|
| 向左 / 向右 | 前一個或後一個區段。 |
| Tab / Shift+Tab | 後一個或前一個區段；從最後一個區段按 Tab，或從第一個區段按 Shift+Tab，會離開欄位。 |
| 向上 / 向下 | 以 1 為單位調整區段，並循環。 |
| 0 到 9 | 輸入到區段中。 |
| A / P | AM 或 PM。 |
| Backspace、Delete | 重設該區段。 |

## Accessibility

- 欄位是一個文字欄位，名稱由 `accessibilityLabel` 指定；螢幕閱讀器會讀出其顯示的時間。`disabled` 會讓它變暗。
- 手機與平板會顯示數字鍵盤。

關於標籤、角色與公告的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。
