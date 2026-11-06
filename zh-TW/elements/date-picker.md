---
title: "DatePicker"
description: "DatePicker 元件:讓使用者從日曆中選取日期、日期範圍,或日期與時間。在桌面平台上,日曆會顯示於觸發元素旁的彈出視窗中;在手機上則顯示於底部面板,外觀可由應用程式自訂。"
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

日期選擇器會透過從應用程式的觸發元件開啟的 [Calendar](./calendar.md) 來設定日期:截止日期、生日、搭配 `range` 的旅程天數,或搭配 `timePrecision` 的日期與時間。與 [Select](./select.md) 相同,它會依各裝置的慣例開啟:

- 在桌面平台與桌面瀏覽器上,於觸發元件處顯示彈出視窗;開啟後,鍵盤焦點會移到日期上。
- 在手機與平板上,於螢幕底部顯示覆蓋在遮罩上的面板。

選擇器負責行為:值(由應用程式管理,或由選擇器自行管理)、開啟狀態、日曆、時間、預設選項、鍵盤操作,以及螢幕閱讀器所朗讀的內容。外觀則由應用程式決定:應用程式繪製觸發元件(包含值、預留文字、圖示),並設定彈出視窗、日曆各部位、預設選項與時間欄位的樣式。

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

`DatePicker` 來自 [`nsh/base`](../modules/nsh-base.md),即 Rust 中的 `nsh-base` crate。在 Rust 中,`date_picker()` 會建立一個選擇器,每個屬性有對應的 setter(`.value(..)`、`.range(..)`、`.time_precision(..)`),每個事件有對應的監聽器(`.on_change(..)`)。其值為 `DateTime`(`DateTime::Single`、`DateTime::Range`,來自 `chrono` 日期,或日期與時間);`onChange` 會回傳 `PickedDate`,即帶有選擇器時間精確度的值。

<a id="value"></a>

## 值

值採用 HTML input 的格式:ISO 日期 `"2026-10-28"`,與 `<input type="date">` 的格式相同;搭配 `range` 時為 `[start, end]`;搭配 `timePrecision` 時為日期與時間 `"2026-10-28T09:30"`(精確到秒時為 `"2026-10-28T09:30:15"`),與 `<input type="datetime-local">` 的格式相同;`null` 表示沒有值。使用 `value` 時,值由應用程式管理:選擇器會顯示該值,並以 `onChange({ value })` 回報每次變更;應用程式需設定 `value` 以跟隨變更。若省略,選擇器會自行保存值,起初取自 `defaultValue`。

- 單一日期:點選某一天即設定值並關閉彈出視窗。
- 使用 `range` 時,第一次點選開始範圍,第二次點選結束範圍,與[日曆](./calendar.md#value)相同;完整的範圍會設定值並關閉彈出視窗。
- 使用 `timePrecision`(僅限單一日期)時,日曆下方會顯示時間欄位,且時間的每次編輯都會回報。在桌面平台上,選擇日期後彈出視窗會保持開啟以供設定時間,並回報帶有時間的日期;再次點選已選取的日期則會關閉彈出視窗。在手機與平板上,點選某一天會以其時間選取該日並關閉面板,與單一日期相同;若要設定時間,需再次開啟面板。若在設定任何時間之前就選了日期,則會採用 `defaultTime`(預設為 `00:00`)。`hourCycle` 決定欄位如何計算小時。

`cleanable` 會在有值時新增清除按鈕:按下即可清除值(`onChange({ value: null })`)。它位於觸發元件之後而非之內,因此按下它不會開啟彈出視窗;應用程式負責放置並填入內容(`clearButton`),與[select 的清除按鈕](./select.md#value)相同。

<a id="presets"></a>

## 預設選項

`presets` 是位於日曆旁、用來設定值的按鈕:「今天」、「最近 7 天」、「明天 9 點」。每個預設選項皆為 `{ label, value }`,其 `value` 為日期、範圍,或日期與時間,並依給定內容原樣保留;按下即設定值並關閉彈出視窗。`contentClass` 負責排列預設選項欄與日曆(含時間)(橫向排列,`flex-row`);`presetsClass` 設定該欄的樣式,`presetClass` 設定每個按鈕的樣式。

<a id="the-calendar"></a>

## 日曆

除了日曆的值之外,[Calendar](./calendar.md) 的每個屬性都會傳遞給選擇器:`numberOfMonths`、`firstDayOfWeek`、`disabledMatcher`、`yearRange`、`previousAccessibilityLabel`、`nextAccessibilityLabel`、各部位(`headerClass` 到 `itemStyle`)以及 `renderItem`。`calendarClass` 與 `calendarStyle` 用來設定日曆本身的樣式。其檢視與按鍵操作與日曆相同。

時間列(`timeClass`、`timeStyle`)的開頭有 `timeLabel`,即應用程式用於時間的文字(「時間」),結尾則是時間欄位(`timeFieldClass`、`timeFieldStyle`、`timeAccessibilityLabel`):這是一個項目置中且兩端分散對齊的橫列(`flex-row items-center justify-between`,與 `gpui-component` 相同)。欄位的區段與 [TimeField](./time-field.md) 的相同(`segmentClass`、`separatorClass`、`renderSegment`)。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | 無 | 值,由應用程式管理。 |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | 未使用 `value` 時的初始值。 |
| `range` | `.range(..)` | `boolean` | `false` | 選取日期範圍。 |
| `open`、`defaultOpen` | `.open(..)`、`.default_open(..)` | `boolean` | `false` | 開啟狀態,由應用程式或選擇器自行管理。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 保持關閉,且不接受點按或鍵盤焦點。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對它的稱呼。 |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` 與時間 | 螢幕閱讀器朗讀值的方式,採用 `chrono` 的格式。 |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | 無 | 同時編輯時間,精確到此單位。 |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 時間欄位如何計算小時。 |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | 使用者設定時間之前,日期所採用的時間。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 有值時顯示清除按鈕。 |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | 彈出視窗中用來設定值的按鈕。 |
| `numberOfMonths`、`firstDayOfWeek`、`disabledMatcher`、`yearRange` | 同 `Calendar` | 同 `Calendar` | 同 `Calendar` | 日曆的月份、週、停用日期與年份。 |
| `previousAccessibilityLabel`、`nextAccessibilityLabel` | 同 `Calendar` | `string` | 無 | 螢幕閱讀器對日曆「上一個」與「下一個」所朗讀的內容。 |
| `placement`、`align`、`offset`、`margin` | `.placement(..)`, ... | 同 `Select` | `"bottom"`、`"start"`、0、0 | 桌面平台:彈出視窗相對於觸發元件的位置。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗(桌面平台)或面板(觸控螢幕)。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 面板後方的遮罩。 |
| `contentClass`、`contentStyle` | `.content_class(..)`、`.content_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗的內容:位於日曆與時間旁的預設選項。 |
| `presetsClass`、`presetsStyle` | `.presets_class(..)`、`.presets_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 預設選項欄。 |
| `presetClass`、`presetStyle` | `.preset_class(..)`、`.preset_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個預設選項的按鈕。 |
| `calendarClass`、`calendarStyle` | `.calendar_class(..)`、`.calendar_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 日曆。 |
| `headerClass` … `itemStyle` | 同 `Calendar` | 同 `Calendar` | 無 | 日曆的標頭、主體、月份、列與項目。 |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | 無 | 日曆的每個項目,由應用程式依其內容繪製;其狀態為各項目的 class,與 `Calendar` 相同。 |
| `timeClass`、`timeStyle` | `.time_class(..)`、`.time_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 時間列:開頭為其標籤,結尾為欄位。 |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | 無 | 時間列在欄位之前顯示的內容。 |
| `timeFieldClass`、`timeFieldStyle` | `.time_field_class(..)`、`.time_field_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 時間欄位。 |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對時間欄位的稱呼。 |
| `segmentClass`、`segmentStyle`、`separatorClass`、`separatorStyle`、`renderSegment` | 同 `TimeField` | 同 `TimeField` | 無 | 時間欄位的區段與 `:`。 |
| `clearButtonClass`、`clearButtonStyle` | `.clear_button_class(..)`、`.clear_button_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 清除按鈕(`cleanable`)。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 無 | 清除按鈕的內容。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對清除按鈕的稱呼。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 按下後會開啟彈出視窗的元素;彈出視窗相對於它定位。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 包覆觸發元件的檢視。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 值已變更(某一天、範圍的結束日、預設選項、時間、清除按鈕):`{ value }`。設定 `value` 以跟隨變更。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 彈出視窗已開啟或關閉,並附上原因(`{ open, reason }`)。設定 `open` 以跟隨變更。 |
| `onOpen`、`onClose` | `.on_open(..)`、`.on_close(..)` | 彈出視窗已顯示,或已消失。 |
| `onCancel` | `.on_cancel(..)` | 使用者未做選擇就關閉了彈出視窗(按 Escape 或返回、點選外部或遮罩)。 |

<a id="parts"></a>

## 部位

| 部位 | 位置 | 樣式設定方式 |
|---|---|---|
| 觸發元件 | 選擇器的檢視 | 應用程式自己的元素(`trigger`) |
| 清除按鈕 | 選擇器的檢視中,位於觸發元件之後(`cleanable`,有值時顯示) | `clearButtonClass`、`clearButtonStyle`;其內容為 `clearButton` |
| 彈出視窗或面板 | 位於所有內容之上,在觸發元件處(桌面平台)或螢幕底部(觸控螢幕) | `popupClass`、`popupStyle` |
| 遮罩 | 面板後方(觸控螢幕) | `backdropClass`、`backdropStyle` |
| 內容 | 彈出視窗 | `contentClass`、`contentStyle` |
| 預設選項 | 內容中,位於最前(`presets`) | `presetsClass`、`presetsStyle`;每個選項為 `presetClass`、`presetStyle` |
| 日曆 | 內容 | `calendarClass`、`calendarStyle`,以及 [Calendar](./calendar.md#parts) 的各部位 |
| 時間列 | 日曆下方(`timePrecision`) | `timeClass`、`timeStyle`;其標籤為 `timeLabel` |
| 時間欄位 | 時間列 | `timeFieldClass`、`timeFieldStyle`,以及 [TimeField](./time-field.md#parts) 的各部位 |

<a id="keyboard"></a>

## 鍵盤

| 按鍵 | 動作 |
|---|---|
| Return(在觸發元件上) | 開啟或關閉彈出視窗。 |
| Delete、Backspace(在觸發元件上) | 在彈出視窗關閉時清除值。 |
| Escape | 未做選擇就關閉彈出視窗。 |

在彈出視窗中,日曆的按鍵可在日期之間移動並選取日期(請見[鍵盤](./calendar.md#keyboard)),時間欄位的按鍵則用來編輯時間(請見[鍵盤](./time-field.md#keyboard))。

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言,觸發元件是一個 combobox:其標籤為 `accessibilityLabel`,其值為 `dateFormat` 所寫出的日期(預設為 `2026/10/28`,時間則採用 `timePrecision`),並會說明彈出視窗是否已展開。`disabled` 會使其變暗。
- 日曆中的日期是以 ISO 日期命名的按鈕(請見[無障礙](./calendar.md#accessibility));預設選項是以其標籤命名的按鈕;時間欄位則以 `timeAccessibilityLabel` 命名。
- 清除按鈕是以 `clearButtonAccessibilityLabel` 命名的按鈕。

標籤、角色與朗讀內容的整體說明,請見[無障礙](../docs/accessibility.md)。
