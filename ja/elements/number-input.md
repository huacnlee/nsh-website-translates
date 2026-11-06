---
title: "NumberInput"
description: "NumberInputコンポーネント: フィールドへの直接入力のほか、ボタン、矢印キー、スクリーンリーダーによるステップ操作で数値を扱います。値は step の小数桁数と min および max の範囲内に保たれます。フィールド、ボタン、コントロール列はアプリ側でスタイルを設定できます。"
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---

# NumberInput

数値入力は、ユーザーが入力またはステップ操作する数値(数量、価格、サイズなど)を保持します。振る舞いは入力自身が持ちます。フィールドは数値、または数値になりかけのテキスト(`-`、`1.`)を受け付け、それ以外は、他のキーボードの数字や符号も含めて受け付けません。ボタン、Up と Down キー、スクリーンリーダーの増加・減少操作は、小数桁を保ったまま数値を `step` ずつ変化させ、`min` と `max` で止まります。フィールドを離れると、入力された数値はその範囲内に収められます。見た目はアプリ側が決めます。`NumberInput` は独自の色、サイズ、枠線、アイコン、文字列を持ちません。減少ボタン、アプリの `prefix` と `suffix` に挟まれたフィールド、増加ボタン(または、フィールドと、両方のボタンを縦に並べた列 `controlsRight`)で構成され、アプリが各パーツにスタイルを設定し、ボタンの中身を用意します。

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では、`number_input()` により、プロパティごとのセッター(`.value(..)`、`.input_style(..)`)、イベントごとのリスナーメソッド(`.on_change(..)`)、入力自体の型付きスタイルメソッド、フィールドの周囲に置くもののための `.prefix(..)` / `.suffix(..)` を備えた入力を作成できます。値は `Option<f64>` です。

<a id="value"></a>

## 値

値は数値、または空のフィールドを表す `null` です。アプリは `value` で値を所有し、`onChange` が通知した値を設定します。これは `nsh/base` のすべてのコントロールと同じです。あるいは `defaultValue` で値を入力に任せることもでき、その場合も変更は通知されます。

ユーザーが自由に入力できるよう、フィールドのテキストと値は必要な部分で分けて扱われます。

- `onChange` は、テキストが読み取られる数値が変わるたびにその数値を通知します。テキストがどの数値としても読み取れない間(空、`-`、`.`)は `null` を通知します。`1` の後に `1.` を入力した場合や、`1.5` の後に `1.50` を入力した場合は、何も通知されません。
- テキストが入力の保持する値として読み取れる間、テキストはユーザーが入力したままに保たれます。そのため、通知された各値をそのまま返す制御された入力では、`1.` や `2.50` がそのまま残ります。アプリが設定した値が入力の通知したものでない場合は、その値として読み取れる最短のテキスト(`0.3`、`12`)がフィールドに表示されます。
- 入力中は、数値が `min` と `max` の範囲外になることがあり(`min={10}` で 15 を入力する途中の 1 など)、入力されたまま通知されます。フィールドを離れたとき、または Return / Enter を押したときに範囲内に収められ、その値が通知されます。数値として読み取れないテキストはそのまま残ります。
- ステップ操作(ボタン、キー、スクリーンリーダーのアクション)は、`onChange` で次の値を要求します。制御された値では、アプリが値を返したときにフィールドが動き、ステップの小数桁が保たれます(`99.5` を `max={100}` まで上げると `100.0` と表示されます)。そのため、ステップを拒否したアプリではフィールドはその場に留まります。アプリが拒否した編集は、編集中はフィールドに残り、フィールドを離れると消えます。

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

フィールドが受け付けるもの:

- 数字、1 つの小数点、先頭の符号(`+` または `-`)。文字、2 つ目の小数点や符号、先頭以外の符号は拒否され、フィールドは元のテキストに戻ります。
- 全角の数字、符号、小数点、マイナス記号(U+2212)、句点(`。`)は、中国語や日本語の入力メソッドで入力されるものとして、ASCII の形として読み取られます。
- テキストに小数点がない間は、カンマが小数点として扱われます(`3,25` は 3.25)。多くの言語のキーボードでは、小数点キーがカンマを入力するためです。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | なし | 値(制御): 数値、または空のフィールドを表す `null`。アプリは `onChange` が通知した値を設定します。 |
| `defaultValue` | `.default_value(..)` | `number \| null` | なし | `value` が未設定の場合の初期値。この場合、入力が自身で値を保持します。 |
| `min` | `.min(..)` | `number` | なし | 最小値。ステップはここで止まり、これを下回る入力値はフィールドを離れたときにこの値に収められます。 |
| `max` | `.max(..)` | `number` | なし | 最大値。上限側について `min` と同様に働きます。`min` を下回る値は `min` になります。 |
| `step` | `.step(..)` | `number` | `1` | 1 回のステップの幅(Page Up / Page Down では 10 ステップ分)。正の数でない値は `1` になります。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 入力、ステップ操作、フォーカスができません。入力とそのパーツには `disabled:` クラスが適用されます。 |
| `readonly` | `.readonly(..)` | `boolean` | `false` | テキストの選択とコピーはできますが、入力でもステップ操作でも変更できません。ボタンは無効になります。 |
| `placeholder` | `.placeholder(..)` | `string` | なし | フィールドが空の間に表示されます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | フィールドを示す表示ラベルがない場合に、スクリーンリーダーがフィールドについて読み上げる内容。 |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | 両方のボタンをフィールドの右側に縦に並べ、増加ボタンを減少ボタンの上に置きます。入力の作成時に読み取られます。 |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | なし | フィールド: そのボックスとテキスト(`color`、`fontSize`、`textAlign`、`placeholderColor`、`caretColor`)。 |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | 減少ボタン。 |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | 増加ボタン。 |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | なし | ボタンの中身: 記号やアイコン。 |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | `controlsRight` のときに両方のボタンを収める列。 |
| `prefix` | `.prefix(..)` | `JSX.Element` | なし | フィールドの前、左側のボタンの後ろに置くもの: 通貨記号、アイコンなど。 |
| `suffix` | `.suffix(..)` | `JSX.Element` | なし | フィールドの後ろ、右側のボタンの前に置くもの: 単位、通貨など。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | 入力自体: フィールドとボタンを囲む行。 |

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | 発生条件 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | フィールドが読み取る数値が変化したとき(入力、ステップ、スクリーンリーダーの増加・減少、範囲外の値のままフィールドを離れたとき)。 |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | フィールドで Return / Enter を押したとき: `min` と `max` の範囲に収められた値。 |
| `onFocus` | `.on_focus(..)` | なし | フィールドがキーボードフォーカスを得たとき。 |
| `onBlur` | `.on_blur(..)` | なし | フィールドがキーボードフォーカスを失ったとき(先に値が `min` と `max` の範囲に収められます)。 |

<a id="parts"></a>

## パーツ

| パーツ | 配置先 | スタイル設定 |
|---|---|---|
| 入力 | | `class`, `style` |
| 減少ボタン | 入力の最初(`controlsRight` の場合: コントロール列の 2 番目) | `decrementButtonClass`, `decrementButtonStyle`。中身は `decrementButton` |
| フィールド | 入力の内側 | `inputClass`, `inputStyle` |
| プレフィックス | 入力の内側、フィールドの前 | 独自の要素(`prefix`) |
| サフィックス | 入力の内側、フィールドの後 | 独自の要素(`suffix`) |
| 増加ボタン | 入力の最後(`controlsRight` の場合: コントロール列の 1 番目) | `incrementButtonClass`, `incrementButtonStyle`。中身は `incrementButton` |
| コントロール列 | 入力の最後、`controlsRight` の場合 | `controlsClass`, `controlsStyle` |

入力はアプリがレイアウトする行です。`class` に `flex-row` を、フィールドに `flex-1` を指定して、ボタンが使わない余白をフィールドに割り当てます。パーツが示す状態:

- 入力: フィールドが編集中の間は `focus-within:`(入力全体を囲むリング)、`disabled:`。
- フィールド: 編集中の間は `focus:`、`disabled:`。
- ボタン: ポインターの下にあるときは `hover:`、押されている間は `active:`、入力が無効または読み取り専用のとき、およびステップしても何も起きない場合(`min` での減少、`max` での増加)は `disabled:`。無効なボタンが反応して見えないよう、ホバーは `enabled:`(`enabled:hover:bg-accent`)の条件の下に置きます。

状態の動きはアプリが選びます(`transition-colors`)。動きを減らす設定にしている人に対しては、`motion-reduce:` が動きを止めます。

<a id="keyboard"></a>

## キーボード

フィールドの編集中、入力は WAI-ARIA のスピンボタンのキーを受け付け、押し続けると繰り返されます。

| キー | 動作 |
|---|---|
| Up | 1 ステップ増やす。 |
| Down | 1 ステップ減らす。 |
| Page Up, Page Down | 10 ステップ増やす、または減らす。 |

Home と End はフィールド本来の動作のままで、テキスト内のキャレットを移動します。ボタンはキーボードフォーカスの停止位置ではありません。Tab はフィールドから入力の次の要素へ移動し、ボタンを押してもフォーカスはフィールドに残ります(デスクトップでは、フォーカスが別の場所にあった場合、押すとフォーカスがフィールドに移ります。タッチスクリーンではフォーカスを移さないため、キーボードは表示されません)。

<a id="accessibility"></a>

## アクセシビリティ

- フィールドはスピンボタン(`"spinbutton"`)で、ラベル、値(`min` と `max` の間で、読み取られる数値)、およびテキストを持ちます。
- スクリーンリーダーの増加・減少アクション(VoiceOver の上下スワイプ)は、Up や Down と同様にステップ操作を行います。
- ボタンは、ブラウザーの数値フィールドのボタンと同様に、スクリーンリーダーからは隠されます。フィールド自身の増加・減少アクションがステップ操作を行います。
- `disabled` の間、スクリーンリーダーはフィールドが淡色表示(無効)であると伝えます。

ラベル、ロール、アクションに関する一般的な説明は、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- フィールドはプラットフォームのテキストフィールド([Input](./input.md))です。キーボード、キャレット、選択、コピーと貼り付け、入力メソッドはシステムのものです。スマートフォンでは小数点付きのキーボードが表示され、`min` が 0 未満の場合や未設定の場合は符号も表示されます。
- どのプラットフォームでも、アプリがスタイルを設定したものがそのまま描画されます。Up / Down と Page Up / Page Down は、どのプラットフォームでもハードウェアキーボードから入力に届きます。
