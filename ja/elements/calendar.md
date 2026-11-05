---
title: "Calendar"
description: "Calendar コンポーネント: 日の並ぶ月表示から単一の日付または日付範囲を選択できます。月表示と年表示、キーボード操作に対応し、スタイルはアプリ側で設定できます。"
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

Calendar は、週ごとに並べた月の日付から、日付を1つ、または `range` を指定すると日付の範囲を選ばせるコンポーネントです。フォームの期限日、宿泊の日程、レポートの対象日などに使います。1か月、または複数の月を横に並べて表示し、Previous と Next で月をめくります。遠くへ移動するときは、年の月の表示や年のページに切り替えます。[DatePicker](./date-picker.md) のポップアップ内にあるカレンダーであり、ページ内で単独でも使えます。

Calendar は動作を担います。値（アプリのもの、または Calendar 自身のもの）、表示中の月、ビュー、選択できない日、キーボード、スクリーンリーダーが読み上げる内容です。見た目はアプリ側の担当です。ヘッダー、ボディ、各月、各行、各アイテムにスタイルを付け、アイテムの内容（月名や曜日名、今日の印、範囲の帯）を描画します。グリッドは、テーブルの列と同様に、与えられた幅いっぱいに広がります。月は幅を分け合い、行のアイテムは行を均等に分け合うため、スマートフォンのシートではカレンダーが画面幅いっぱいになり、内容に合わせたサイズのポップアップではアイテムの幅が保たれます（`flex-none` を `itemClass` または `monthClass` に指定すると、アイテムや月がそれ自身の幅のままになります）。

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

`Calendar` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では、`calendar()` でプロパティごとのセッター（`.value(..)`、`.range(..)`、`.number_of_months(..)`）とイベントごとのリスナー（`.on_change(..)`）を持つ Calendar を作成します。その値は `Date`（`Date::Single`、`Date::Range`、または `chrono::NaiveDate` もしくはその組から作成）で、無効にする日は `Matcher` です。

<a id="value"></a>

## 値

値は ISO 形式の日付 `"2026-10-28"` で、HTML の `<input type="date">` の値と同じです。`range` を指定すると `[start, end]` となり、`null` は日付なしを表します。`value` を指定した場合は、アプリが値を所有します。Calendar はその値を選択済みとして表示し、選択を `onChange({ value })` で通知します。アプリは `value` を設定してそれに追従します。省略した場合、Calendar は自身の値を保持し、最初は `defaultValue` から始まります。

`onChange` は、`gpui-base` の `Selected` と同様に、完成した値のみを通知します。押された日、または範囲の終端です。

- `range` を指定しない場合、日を押すとその日が選択されます。
- `range` を指定すると、最初の押下で範囲が始まり、2回目の押下で終わります。その間の日が範囲に入ります（それぞれ `selected`。両端を含みます。[アイテム](#items)を参照）。より前の日を2回目に押すと、その日から範囲をやり直します。範囲が完成した後に押した場合も同様です。未完成の範囲は完成するまで表示され、完成して初めて通知されます。

Calendar は、値（範囲の場合は開始日）の月を開き、なければ今日の月を開きます。

<a id="months-and-views"></a>

## 月とビュー

`numberOfMonths` は、表示中の月から数えてその数の月を横に並べて表示します。Previous と Next は1か月ずつめくります。`firstDayOfWeek` は週の始まりの曜日で、`0` の日曜日（デフォルト）から `6` の土曜日までです。

ヘッダーには、Previous、2つのトグル、Next があります。

- 日ビューは月の日を表示します。各月は、曜日の行とその週を縦に並べた1列です。前後の月の日が週を埋めます（`outside`、`data-outside`）。
- 月トグル（`monthToggle`）は月ビューを開きます。12か月を3つずつの行で表示します。1つ選ぶと、その月が日ビューに表示されます。
- 年トグル（`yearToggle`）は年ビューを開きます。20年分のページを5つずつの行で表示し、Previous と Next でページをめくります。1つ選ぶと、その年が日ビューに表示されます。`yearRange` はページが及ぶ年の範囲で、`[start, end)`（デフォルト：今年の50年前から50年後まで）です。

複数の月を表示する場合、ヘッダーにはトグルの代わりに各月のタイトルが表示されます（押下を受け付けない `monthToggle` アイテム）。`gpui-base` と同様です。

<a id="disabled-dates"></a>

## 無効な日付

`disabledMatcher` はユーザーが選べない日で、`gpui-base` の `Matcher` と同じく、次の4つの形式のいずれかで指定します。

| 形式 | 無効にする日 |
|---|---|
| `[0, 6]` | 指定した曜日。`0` の日曜日から `6` の土曜日まで。 |
| `{ before, after }` | `before` より前と `after` より後の日（どちらか一方は省略可）。 |
| `{ from, to }` | `from` から `to` までの日（両端を含む。どちらか一方を省略すると、その側は開いた範囲）。 |
| `(date) => boolean` | 関数が `true` を返す日。表示中の各日の ISO 日付が渡されます。 |

関数は、表示中の各日について次の JS ターンで1回だけ呼ばれ、すでに答えた日については再度呼ばれません。月をめくると新しく現れる日についてのみ問い合わせるため、答えは日付のみに依存する純粋関数でなければなりません。別の関数を渡すと、改めて問い合わせます。無効な日は `disabled:` で、押下を受け付けず、Return と Space でも選択されません。

<a id="items"></a>

## アイテム

Calendar の押下対象とラベルはすべてアイテムです。Previous、トグル、Next、曜日、日、月、年が該当します。各アイテムは `itemClass` と `itemStyle` でスタイルを付けるパーツに描画され、そのバリアントはアイテムの状態に従います。

| バリアント | アイテム |
|---|---|
| `selected:` | 選択されている。日付、完成した範囲のすべての日（React Aria の範囲カレンダーと同様に両端を含む）、未完成の範囲の開始日、表示中の月または年、開いているビューのトグル。スクリーンリーダーは選択済みと読み上げます。 |
| `disabled:` | 押下を受け付けない。無効な日付、曜日、月のタイトル、月ビューや年の端での Previous と Next。 |
| `focus:` | キーボードフォーカスを持つ。 |
| `data-range-start:`、`data-range-end:` | 完成した範囲の最初または最後の日（1日だけの範囲は両方）。 |
| `data-range-middle:` | 完成した範囲の内側の日（両端を除く）。 |
| `data-today:` | 今日。 |
| `data-outside:` | 前後の月の日で、週を埋めているもの。 |

`data-*` バリアントは Tailwind のもので（`data-range-start:` は `[data-range-start]` に一致します）、shadcn の Calendar が日にスタイルを付けるのと同じです。`itemClass` に `group` を指定すると、内容は `group-selected:`、`group-data-range-middle:` などでそれらに追従します。`selected:` は範囲のすべての日を意味するため、範囲の両端はその上に自身の見た目を適用し（後のバリアントが優先されます。`data-*` は `selected:` の後に来ます）、中間の日はそれぞれの見た目になります。

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` は、アイテムの内容を、そのアイテムが何であるか（`CalendarEntry`）から描画し、状態からは決して描画しません。描画は一度だけ行われ、アイテムが選択、フォーカス、範囲への包含の状態にある間も保持されるため、キー操作、選択、フォーカスによって再描画されることはありません。月をめくると、新しく現れる日が一度ずつ描画されます（日は月と日付をキーとして描画を保持します。複数の月を表示している場合、引き続き表示されている月はその描画を保持します）。

| フィールド | 意味 |
|---|---|
| `kind` | `"previous"`、`"monthToggle"`、`"yearToggle"`、`"next"`、`"weekday"`、`"day"`、`"month"`、または `"year"`。 |
| `value` | その番号。月の日、月（1〜12）、年、曜日（`0` の日曜日から `6` まで）。Previous と Next では `0`。 |
| `date` | 日の ISO 日付。 |
| `year`、`month` | それが属する年と月。日の場合はその日を週に表示している月、月トグルやタイトルの場合はその月、月ビューの月の場合はその月、年トグルと年の場合はその年自身。Previous、Next、曜日では `0`（年トグルと年では `month`）。 |
| `today` | その日が今日である。 |
| `outside` | その日が前後の月のものである。 |

`renderItem` がない場合、アイテムはその番号を表示し、Previous と Next は `gpui-base` と同様に `‹` と `›` を表示します。曜日も番号（`0` から `6`）を表示します。月名や曜日名は、アプリの言語によるアプリ自身の言葉だからです。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | なし | 値。アプリが所有します。 |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | 最初の値。`value` を指定しない場合に使います。 |
| `range` | `.range(..)` | `boolean` | `false` | 範囲を選択します。最初の押下で開始し、2回目の押下で終了します。 |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | 横に並べて表示する月の数。 |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | 週の始まりの曜日。`0` の日曜日から `6` の土曜日まで。 |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | なし | 選択できない日付。 |
| `yearRange` | `.year_range(..)` | `[number, number]` | 前後50年 | 年ビューがページ送りする年の範囲（`[start, end)`）。 |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | なし | スクリーンリーダーが Previous に対して読み上げる内容。 |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | なし | スクリーンリーダーが Next に対して読み上げる内容。 |
| `headerClass`、`headerStyle` | `.header_class(..)`、`.header_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | ヘッダー。Previous、トグル（または月のタイトル）、Next。 |
| `bodyClass`、`bodyStyle` | `.body_class(..)`、`.body_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | ボディ。横に並んだ月、または月ビューや年ビューの行。 |
| `monthClass`、`monthStyle` | `.month_class(..)`、`.month_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | 日ビューの各月。 |
| `rowClass`、`rowStyle` | `.row_class(..)`、`.row_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | 各行。曜日、週、月または年の行。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(..)` | `string`、`StyleProp<TextStyle>` | なし | 各アイテム。`selected:`、`disabled:`、`focus:`、日の `data-range-start:`、`data-range-end:`、`data-range-middle:`、`data-today:`、`data-outside:`（[アイテム](#items)）。 |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | なし | アイテムの内容。アイテムが何であるかに基づいてアプリが描画します。指定しない場合はその番号。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | Calendar 本体。ヘッダーがボディの上に来ます。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | ユーザーが完成した値（`{ value }`、日または範囲）を選択しました。追従するには `value` を設定します。アプリが渡した `value` は通知されません。 |

<a id="parts"></a>

## パーツ

| パーツ | 場所 | スタイル指定 |
|---|---|---|
| Calendar | ルート | `class`、`style` |
| ヘッダー | Calendar の最初 | `headerClass`、`headerStyle` |
| ボディ | Calendar 内、ヘッダーの後 | `bodyClass`、`bodyStyle` |
| 月 | ボディ（日ビュー） | `monthClass`、`monthStyle` |
| 行 | 月、またはボディ（月ビューと年ビュー） | `rowClass`、`rowStyle` |
| アイテム | ヘッダーと行 | `itemClass`、`itemStyle`、`renderItem`（内部に `group-selected:`、`group-data-range-middle:` など。`itemClass` の `group` の下） |

<a id="keyboard"></a>

## キーボード

日付全体が Tab の1つの停止位置です。Tab は選択された日に移り、なければ今日、それもなければ表示中の最初の日に移ります。その後は次のとおりです。

| キー | 動作 |
|---|---|
| Left / Right | 前日または翌日。 |
| Up / Down | 1週間前または1週間後の同じ曜日。 |
| Home / End | 週の最初または最後の日。 |
| Page Up / Page Down | 1か月前または1か月後の同じ日。 |
| Shift+Page Up / Shift+Page Down | 1年前または1年後の同じ日。 |
| Return、Space | その日を選択します。 |

右から左へのレイアウトでは週が右から始まるため、Left が翌日、Right が前日になります。Up と Down は週単位のままです。表示中の月を越えて移動すると、月がめくられます。Previous、トグル、Next、月、年は押下を受け付けます。`gpui-base` の日は押下のみを受け付けます。キー操作は NSH 独自のもので、WAI-ARIA の date picker dialog に倣っています。

<a id="accessibility"></a>

## アクセシビリティ

- 各日は ISO 日付を名前とするボタンで、その日付または範囲の日である間は選択済みとなり（React Aria の範囲カレンダーと同様に両端を含む）、無効の間は薄く表示されます。
- Previous と Next は `previousAccessibilityLabel` と `nextAccessibilityLabel` を名前とするボタンです。トグル、月、年は、表示している内容を名前とするボタンです。

ラベル、ロール、読み上げ全般については [アクセシビリティ](../docs/accessibility.md) を参照してください。
