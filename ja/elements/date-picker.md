---
title: "DatePicker"
description: "DatePicker コンポーネント: デスクトップではトリガーの位置にポップアップで、スマートフォンではシートで表示されるカレンダーから、日付、日付の範囲、または日付と時刻を選択します。見た目はアプリ側でスタイル設定できます。"
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

DatePicker は、アプリのトリガーから開く [Calendar](./calendar.md) で日付を設定します。期限日や誕生日のほか、`range` を使えば旅行の日程、`timePrecision` を使えば日付と時刻も設定できます。[Select](./select.md) と同様に、各デバイスが期待する形で開きます。

- デスクトップおよびデスクトップブラウザーでは、トリガーの位置にポップアップが開きます。開くと、キーボードフォーカスが日付に移ります。
- スマートフォンとタブレットでは、画面下部にバックドロップを伴うシートが開きます。

ピッカーは動作を管理します。値(アプリ側のもの、またはピッカー自身のもの)、開閉状態、カレンダー、時刻、プリセット、キーボード、そしてスクリーンリーダーが読み上げる内容です。見た目はアプリ側の担当です。アプリがトリガー(値、プレースホルダー、アイコン付き)を描画し、ポップアップ、カレンダーの各パーツ、プリセット、時刻フィールドをスタイルします。

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

`DatePicker` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では、`date_picker()` が、プロパティごとのセッター(`.value(..)`、`.range(..)`、`.time_precision(..)`)とイベントごとのリスナー(`.on_change(..)`)を持つピッカーを作成します。その値は `DateTime`(`DateTime::Single`、`DateTime::Range`、`chrono` の日付、または日付と時刻から成る)です。`onChange` は `PickedDate`、つまりピッカーの時刻精度を持つ値を返します。

<a id="value"></a>

## 値

値は HTML の input と同じ形式です。ISO 形式の日付 `"2026-10-28"` は `<input type="date">` のものと同じで、`range` を指定すると `[start, end]` になります。`timePrecision` を指定すると日付と時刻の `"2026-10-28T09:30"`(秒まで扱う場合は `"2026-10-28T09:30:15"`)となり、`<input type="datetime-local">` のものと同じです。`null` は値なしを表します。`value` を指定すると、値はアプリが管理します。ピッカーはその値を表示し、変更のたびに `onChange({ value })` で通知します。アプリはそれに追従するために `value` を設定します。省略すると、ピッカーは自身の値を保持し、最初は `defaultValue` の値になります。

- 単一の日付: 日を押すと値が設定され、ポップアップが閉じます。
- `range` を指定すると、最初の押下で範囲が始まり、2 回目の押下で終わります。[カレンダー](./calendar.md#value)と同じです。範囲が完成すると値が設定され、ポップアップが閉じます。
- `timePrecision`(単一の日付のみ)を指定すると、カレンダーの下に時刻フィールドが表示され、時刻の編集のたびに通知されます。デスクトップでは、日を選んでもポップアップは開いたままで時刻を入力でき、日付が時刻付きで通知されます。選択済みの日をもう一度押すと、ポップアップが閉じます。スマートフォンとタブレットでは、日をタップするとその時刻で選択されてシートが閉じます(単一の日付と同じ)。時刻を設定するには、シートをもう一度開きます。時刻を設定する前に選ばれた日には `defaultTime`(デフォルトは `00:00`)が適用されます。`hourCycle` は、フィールドが時間をどう数えるかを指定します。

`cleanable` を指定すると、値がある間クリアボタンが追加されます。押すと値がクリアされます(`onChange({ value: null })`)。ボタンはトリガーの内側ではなく後ろに置かれるため、押してもポップアップは開きません。[Select のクリアボタン](./select.md#value)と同様に、配置と中身(`clearButton`)はアプリが決めます。

<a id="presets"></a>

## プリセット

`presets` は、カレンダーの横に置かれ、値を設定するボタンです。「今日」「過去 7 日間」「明日の 9 時」などがあります。各プリセットは `{ label, value }` と `value`(日付、範囲、または日付と時刻)から成り、与えられたまま保持されます。押すとその値が設定され、ポップアップが閉じます。`contentClass` は、プリセットの列と、時刻付きのカレンダーをレイアウトします(行方向、`flex-row`)。`presetsClass` は列を、`presetClass` は各ボタンをスタイルします。

<a id="the-calendar"></a>

## カレンダー

[Calendar](./calendar.md) のプロパティは、値を除くすべてがピッカーのプロパティとして引き継がれます。`numberOfMonths`、`firstDayOfWeek`、`disabledMatcher`、`yearRange`、`previousAccessibilityLabel`、`nextAccessibilityLabel`、パーツ(`headerClass` から `itemStyle`)、そして `renderItem` です。`calendarClass` と `calendarStyle` はカレンダー自体をスタイルします。ビューとキー操作は Calendar と同じです。

時刻の行(`timeClass`、`timeStyle`)は、先頭に `timeLabel`(アプリが付ける呼び名、たとえば「時刻」)を、末尾に時刻フィールド(`timeFieldClass`、`timeFieldStyle`、`timeAccessibilityLabel`)を持ちます。項目が中央揃えで両端に振り分けられた行です(`flex-row items-center justify-between`、`gpui-component` と同じ)。フィールドのセグメントは [TimeField](./time-field.md) のものです(`segmentClass`、`separatorClass`、`renderSegment`)。

## Props

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | なし | アプリが管理する値。 |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | `value` がない場合の初期値。 |
| `range` | `.range(..)` | `boolean` | `false` | 日付の範囲を選択する。 |
| `open`、`defaultOpen` | `.open(..)`、`.default_open(..)` | `boolean` | `false` | 開閉状態。アプリ側のもの、またはピッカー自身のもの。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 閉じたままになり、押下もキーボードフォーカスも受け付けない。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが読み上げる名前。 |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` と時刻 | スクリーンリーダーが値をどう読み上げるか。`chrono` の書式で指定する。 |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | なし | 時刻も編集する。指定した精度まで。 |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 時刻フィールドが時間をどう数えるか。 |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | ユーザーが時刻を設定する前に、日付に与えられる時刻。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 値がある間のクリアボタン。 |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | 値を設定する、ポップアップ内のボタン。 |
| `numberOfMonths`、`firstDayOfWeek`、`disabledMatcher`、`yearRange` | `Calendar` と同じ | `Calendar` と同じ | `Calendar` と同じ | カレンダーの月、週、無効な日付、年。 |
| `previousAccessibilityLabel`、`nextAccessibilityLabel` | `Calendar` と同じ | `string` | なし | カレンダーの「前へ」「次へ」についてスクリーンリーダーが読み上げる内容。 |
| `placement`、`align`、`offset`、`margin` | `.placement(..)`、... | `Select` と同じ | `"bottom"`、`"start"`、0、0 | デスクトップ: トリガーに対するポップアップの位置。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | ポップアップ(デスクトップ)またはシート(タッチスクリーン)。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | シートの背後のバックドロップ。 |
| `contentClass`、`contentStyle` | `.content_class(..)`、`.content_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | ポップアップのコンテンツ: カレンダーの横のプリセットと時刻。 |
| `presetsClass`、`presetsStyle` | `.presets_class(..)`、`.presets_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | プリセットの列。 |
| `presetClass`、`presetStyle` | `.preset_class(..)`、`.preset_style(..)` | `string`、`StyleProp<TextStyle>` | なし | 各プリセットのボタン。 |
| `calendarClass`、`calendarStyle` | `.calendar_class(..)`、`.calendar_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | カレンダー。 |
| `headerClass` … `itemStyle` | `Calendar` と同じ | `Calendar` と同じ | なし | カレンダーのヘッダー、本体、月、行、項目。 |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | なし | カレンダーの各項目。その種類に応じてアプリが描画する。状態は項目のクラスで表され、`Calendar` と同じ。 |
| `timeClass`、`timeStyle` | `.time_class(..)`、`.time_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | 時刻の行: 先頭のラベルと末尾のフィールド。 |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | なし | 時刻の行でフィールドの前に表示される内容。 |
| `timeFieldClass`、`timeFieldStyle` | `.time_field_class(..)`、`.time_field_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | 時刻フィールド。 |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | なし | 時刻フィールドについてスクリーンリーダーが読み上げる名前。 |
| `segmentClass`、`segmentStyle`、`separatorClass`、`separatorStyle`、`renderSegment` | `TimeField` と同じ | `TimeField` と同じ | なし | 時刻フィールドのセグメントと `:`。 |
| `clearButtonClass`、`clearButtonStyle` | `.clear_button_class(..)`、`.clear_button_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | クリアボタン(`cleanable`)。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | なし | クリアボタンの内容。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | なし | クリアボタンについてスクリーンリーダーが読み上げる名前。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | なし | 押すとポップアップを開くもの。ポップアップはこれを基準に配置される。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | トリガーを囲むビュー。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 値が変更された(日、範囲の終了、プリセット、時刻、クリアボタン): `{ value }`。追従するには `value` を設定する。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | ポップアップが開閉した。理由(`{ open, reason }`)付き。追従するには `open` を設定する。 |
| `onOpen`、`onClose` | `.on_open(..)`、`.on_close(..)` | ポップアップが表示された、または消えた。 |
| `onCancel` | `.on_cancel(..)` | ユーザーが選択せずにポップアップを閉じた(Escape または戻る操作、外側またはバックドロップの押下)。 |

<a id="parts"></a>

## パーツ

| パーツ | 位置 | スタイル指定 |
|---|---|---|
| トリガー | ピッカーのビュー | アプリ独自の要素(`trigger`) |
| クリアボタン | ピッカーのビュー内、トリガーの後(`cleanable`、値がある間) | `clearButtonClass`、`clearButtonStyle`。その内容は `clearButton` |
| ポップアップまたはシート | すべての上。トリガーの位置(デスクトップ)または下部(タッチスクリーン) | `popupClass`、`popupStyle` |
| バックドロップ | シートの背後(タッチスクリーン) | `backdropClass`、`backdropStyle` |
| コンテンツ | ポップアップ | `contentClass`、`contentStyle` |
| プリセット | コンテンツ内、先頭(`presets`) | `presetsClass`、`presetsStyle`。各ボタンは `presetClass`、`presetStyle` |
| カレンダー | コンテンツ | `calendarClass`、`calendarStyle`、および [Calendar](./calendar.md#parts) のパーツ |
| 時刻の行 | カレンダーの下(`timePrecision`) | `timeClass`、`timeStyle`。そのラベルは `timeLabel` |
| 時刻フィールド | 時刻の行 | `timeFieldClass`、`timeFieldStyle`、および [TimeField](./time-field.md#parts) のパーツ |

<a id="keyboard"></a>

## キーボード

| キー | 動作 |
|---|---|
| Return(トリガー上) | ポップアップを開く、または閉じる。 |
| Delete、Backspace(トリガー上) | ポップアップが閉じている間、値をクリアする。 |
| Escape | 選択せずにポップアップを閉じる。 |

ポップアップ内では、カレンダーのキーで日の間を移動して日を選択でき([キーボード](./calendar.md#keyboard)を参照)、時刻フィールドのキーで時刻を編集できます([キーボード](./time-field.md#keyboard)を参照)。

<a id="accessibility"></a>

## アクセシビリティ

- トリガーは、スクリーンリーダーに対してはコンボボックスです。ラベルは `accessibilityLabel`、値は `dateFormat` が書く形式の日付(デフォルトは `2026/10/28`、時刻付きの場合は `timePrecision`)で、ポップアップが展開されているかどうかも伝えます。`disabled` を指定すると淡色表示になります。
- カレンダーの日は、ISO 形式の日付を名前に持つボタンです([アクセシビリティ](./calendar.md#accessibility)を参照)。プリセットはラベルを名前に持つボタンで、時刻フィールドは `timeAccessibilityLabel` が名前になります。
- クリアボタンは、`clearButtonAccessibilityLabel` を名前に持つボタンです。

ラベル、ロール、読み上げ全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。
