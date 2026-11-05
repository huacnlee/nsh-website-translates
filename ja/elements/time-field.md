---
title: "TimeField"
description: "TimeField コンポーネント: 時、分、秒を区切りごとに編集できる時刻入力です。キーボードやスマートフォンのテンキーで操作でき、スタイルはアプリ側で設定します。"
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

時刻フィールドは、1日の時刻をセグメントごとに編集します。時、分、`precision="second"` を指定すると秒、`hourCycle="h12"` を指定すると AM または PM です。リマインダーの時刻、会議の開始時刻、店の営業時間などに使います。これは、`timePrecision` を指定した [DatePicker](./date-picker.md) のカレンダーの下にある時刻部分を、単独でページに置いたものです。

フィールドが動作を担います。時刻(アプリが持つ時刻、またはフィールド自身の時刻)、キーで編集するセグメント、数字の入力とステップ操作、スクリーンリーダーが読み上げる内容です。見た目はアプリ側が決めます。セグメントとその間の `:` にスタイルを適用するか、セグメントを自前で描画します。

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

`TimeField` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では、`time_field()` がプロパティごとのセッター(`.value(..)`、`.precision(..)`、`.hour_cycle(..)`)とイベントごとのリスナー(`.on_change(..)`)を備えたインスタンスを作成します。時刻は `TimeOfDay`、つまり `chrono::NaiveTime` です。

<a id="value"></a>

## 値

値は24時間制の時刻で、HTML の `<input type="time">` と同じ形式です。`"HH:MM"`、または `precision="second"` を指定した場合は `"HH:MM:SS"` となり、フィールドが表示する `hourCycle` にかかわらずこの形式です。`value` を指定すると、アプリが値を保持します。フィールドはその値を表示し、編集のたびに `onChange({ value })` で通知します。アプリは `value` を設定してそれに追従させます。省略した場合、フィールドは自身の時刻を保持し、最初は `defaultValue` の値になります(デフォルトは `00:00`)。

`precision` はフィールドが編集する最小単位で、`"minute"`(デフォルト)または `"second"` です。`hourCycle` は時の数え方で、`"h23"`(デフォルト)は 00 から 23、`"h12"` は 12 から 11 までで、数字の後ろに AM/PM セグメントが付きます。

<a id="editing"></a>

## 編集

1つのセグメントが選択され、キー操作はそのセグメントを編集します。`gpui-base` の時刻フィールドと同様です。

- 上下キーでセグメントを1ずつ増減し、(59 から 00 のように)循環します。隣のセグメントへの繰り上げ・繰り下げはしません。
- 数字キーで入力します。2桁ずつ入力され、それ以上長い値の先頭になり得ない数字(時の `7` など)を入力するとセグメントが確定し、次のセグメントに移ります。
- `a` と `p` で AM と PM を設定します。
- Backspace と Delete でセグメントをリセットします。

セグメントを押すと選択されます。選択中の AM/PM セグメントを押すと切り替わります。スマートフォンには `a` キーと `p` キーがないためです。キー入力は、[OtpInput](./otp-input.md) と同様に、セグメントの背後にある透明なネイティブテキストフィールド1つに渡されます。スマートフォンとタブレットでは、これによりテンキーが表示されます。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | なし | アプリが保持する時刻。 |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | `value` がない場合の初期時刻。 |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | 編集する最小単位。 |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | 時の数え方。`"h12"` では AM/PM セグメントが加わります。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | フォーカスも編集もできなくなります。`disabled:` のスタイルがフィールドとそのセグメントに適用されます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがフィールドを呼ぶ名前。 |
| `segmentClass`、`segmentStyle` | `.segment_class(..)`、`.segment_style(..)` | `string`、`StyleProp<TextStyle>` | なし | 各セグメント。フィールドにフォーカスがある間は選択中のセグメントに `focus:`、フィールドと同時に `disabled:` が適用されます。`group` を使うと、内容がそれらに追従します(`group-focus:`、`group-disabled:`)。 |
| `separatorClass`、`separatorStyle` | `.separator_class(..)`、`.separator_style(..)` | `string`、`StyleProp<TextStyle>` | なし | 数字の間にある各 `:`。 |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | なし | セグメントの内容。表示する値をもとにアプリが描画します。指定しない場合はそのラベルが表示されます。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | セグメントを囲むフィールド(行)。 |

`renderSegment` は `TimeFieldSegmentEntry` を受け取ります。`segment`(`"hour"`、`"minute"`、`"second"`、`"period"` のいずれか)、`value`(フィールドの時計表記での時、分、または秒。AM は `0`、PM は `1`)、`label`(2桁の数字、または `AM` / `PM`)です。セグメントの状態は渡されません。セグメントは、キーで編集中は `focus:`、フィールドと同時に `disabled:` となり、`segmentClass` の `group` を使うと、その内容は `group-focus:` と `group-disabled:` に追従します。そのため、セグメントが再描画されるのは値が変わったときだけです。セグメント間の移動やフォーカスの出入りでは何も再描画されません。

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | ユーザーが時刻を変更しました:`{ value }`。追従するには `value` を設定します。アプリが渡した `value` は通知されません。 |

<a id="parts"></a>

## パーツ

| パーツ | 位置 | スタイルの指定 |
|---|---|---|
| フィールド | ルート(行) | `class`、`style` |
| セグメント | フィールド内:時、分、秒、AM/PM | `segmentClass`、`segmentStyle`、`renderSegment`(`segmentClass` の `group` の下では内部の `group-focus:`、`group-disabled:`) |
| 区切り | フィールド内、2つの数字の間 | `separatorClass`、`separatorStyle` |

<a id="keyboard"></a>

## キーボード

Tab キーで、選択中のセグメントを持つフィールドにフォーカスが移ります。その後:

| キー | 動作 |
|---|---|
| 左 / 右 | 前または次のセグメント。 |
| Tab / Shift+Tab | 次または前のセグメント。最後のセグメントでの Tab と最初のセグメントでの Shift+Tab はフィールドから抜けます。 |
| 上 / 下 | セグメントを1ずつ増減し、循環します。 |
| 0〜9 | セグメントに入力します。 |
| A / P | AM または PM。 |
| Backspace、Delete | セグメントをリセットします。 |

<a id="accessibility"></a>

## アクセシビリティ

- フィールドは `accessibilityLabel` で名前が付けられたテキストフィールドで、スクリーンリーダーは表示されている時刻を読み上げます。`disabled` にすると薄く表示されます。
- スマートフォンとタブレットではテンキーが表示されます。

ラベル、ロール、読み上げ全般については、[Accessibility](../docs/accessibility.md) を参照してください。
