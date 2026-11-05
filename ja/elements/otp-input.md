---
title: "OtpInput"
description: "OtpInput コンポーネント: 固定長の数字のワンタイムコードを、入力、貼り付け、または自動入力で 1 つのネイティブフィールドに取り込み、アプリ側でスタイルを設定できるセル、グループ、キャレットとして表示します。"
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

ワンタイムコード入力は、決まった桁数の数字(SMS の認証コードや認証アプリのコード)を受け取り、セルに表示します。動作はすべて入力側が担います。セルの上に重ねた透明なネイティブのテキストフィールドが 1 つだけキーボードを受け取るため、タイピング、入力メソッド、ペースト、テンキー、システムのコード自動入力(iOS の「メッセージから」、Android の SMS 候補)はプラットフォーム標準のものになり、スクリーンリーダーからは 1 つのテキストフィールドとして見えます。入力できるのは数字だけで、`length` 桁までです。Backspace で末尾の 1 桁を削除でき、コードが埋まったことは `onComplete` で通知されます。見た目はアプリ側が決めます。`OtpInput` には、色、サイズ、枠線、ラベルが一切ありません。構成要素はセル、セルを分割したグループ、キャレットで、アプリがそれぞれにスタイルを指定します。

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput` は [`nsh/base`](../modules/nsh-base.md)、つまり Rust の `nsh-base` クレートに含まれます。Rust では、`otp_input()` が、プロパティごとのセッター(`.length(..)`、`.cell_style(..)`)、イベントごとのリスナーメソッド(`.on_complete(..)`)、入力自体に対する型付きスタイルメソッドを備えたインスタンスを作成します。

<a id="the-code"></a>

## コード

- **制御コンポーネント**: `value` を渡し、`onChange` で更新します。セルにはアプリが渡した `value` がそのまま表示されます。アプリが設定した値(誤ったコードの後でコードをクリアする場合など)は通知されません。
- **非制御コンポーネント**: `defaultValue` を渡す(または何も渡さない)場合、コードは `onChange` と `onComplete` から読み取ります。

ユーザーの操作はフィールドから読み取られ、キャレットは常に末尾にあります。

| ユーザーの操作 | コード |
|---|---|
| 数字を入力する | コードが `length` より短い間は末尾に追加されます。すべて埋まっている場合は何も変わりません。 |
| 全角数字(`０`–`９`、東アジアの入力メソッドが出力するもの)を入力する | ASCII の数字が追加されます。 |
| それ以外を入力する | 何も変わりません。フィールドが破棄します。 |
| Backspace を押す | 最後の数字が削除されます。 |
| ペーストする、またはシステムがコードを自動入力する | その数字が同じ規則で追加されます。`length` 桁以上の数字を含むテキスト(`123-456`、メッセージ内のコードなど)は、コードを最初の `length` 桁で置き換えます。 |

`onChange` は変更のたびに新しいコードとともに通知されます。変更によって最後のセルが埋まった場合は、その後に `onComplete` が続くため、アプリはここでコードを検証します。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | 必須 | コードの桁数。1 桁につき 1 セルです。 |
| `value` | `.value(..)` | `string` | なし | アプリが制御するコード(そのまま表示されます)。指定しない場合、入力が自身で保持します。 |
| `defaultValue` | `.default_value(..)` | `string` | なし | `value` が未設定のときの、初期のコード。 |
| `masked` | `.masked(..)` | `boolean` | `false` | 埋まったセルに数字の代わりにドットを表示し、フィールドはセキュアなものになります。スクリーンリーダーはコードを読み上げず、システムもコードを候補に出しません。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | フォーカスも編集もできません。`disabled:` スタイルが入力とその各パーツに適用され、スクリーンリーダーは無効状態(dimmed)であると伝えます。 |
| `groups` | `.groups(..)` | `number` | `1` | セルを分割するグループの数。できるだけ均等に分けます(6 桁を 2 グループなら 3 + 3)。最小 1、最大でセルごとに 1 つです。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがフィールドについて読み上げる内容。コードの用途と桁数を伝えます。 |
| `cellClass`、`cellStyle` | `.cell_class(..)`、`.cell_style(\|s\| ..)` | `string`、`StyleProp<TextStyle>` | なし | 各セルのサイズ、枠線、テキスト(`color`、`fontSize`。数字はこれを継承します)。`focus:` と `data-filled:` はセルの状態をスタイルします(「パーツ」を参照)。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | セルの各グループ(`flex-row gap-2`)。 |
| `caretClass`、`caretStyle` | `.caret_class(..)`、`.caret_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | キャレットの幅、高さ、色。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 入力自体。グループを囲む行(または列)です。 |

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | ユーザーがコードを変更したとき(入力、削除、ペースト、自動入力)。 |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | ユーザーの変更によって最後のセルが埋まったとき。`onChange` の後に発生します。 |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | なし | 入力がキーボードフォーカスを得た / 失ったとき。 |

<a id="ref-methods"></a>

## Ref メソッド

| メソッド | Rust | 説明 |
|---|---|---|
| `focus()` | `focus()`(`OtpInputApi`) | 入力を押したときと同様に、キーボードフォーカスを取得してソフトウェアキーボードを表示します。 |

<a id="parts"></a>

## パーツ

| パーツ | 配置場所 | スタイル指定 |
|---|---|---|
| 入力 | | `class`、`style` |
| グループ | 入力内に、グループごとに 1 つ | `groupClass`、`groupStyle`。`disabled:` は入力に従います |
| セル | 所属するグループ内に、数字ごとに 1 つ | `cellClass`、`cellStyle`。入力にフォーカスがある間、次の数字を受け取るセルに `focus:`、数字が入っている各セルに `data-filled:`、`disabled:` は入力に従います |
| 数字 | 埋まったセル | セルのテキストスタイル(`text-xl`、`font-semibold`)。`masked` の間は `•` |
| キャレット | 入力にフォーカスがある間、次の数字を受け取る空のセル | `caretClass`、`caretStyle` |

次の数字を受け取るセルは、最後の数字の次のセルです。コードがすべて埋まった場合は最後のセルになります。キャレットはテキストフィールドと同様に点滅します(0.5 秒表示、0.5 秒非表示で、編集のたびにしばらく点灯したままになります)。点滅は opacity によってネイティブに行われ、レイアウト上の位置は保たれます。モーションの低減が有効な場合は静止します。入力上のどこを押してもフォーカスされます。フィールドがセルの上に重なっているためです。

数字が入っているセルは、マスクの有無にかかわらず属性 `data-filled` を持つため、`data-filled:` クラスでユーザーが入力済みのセルをスタイルできます(より強い枠線や塗りなど: `data-filled:border-foreground data-filled:bg-muted`)。これは shadcn/ui が状態を記述する方法と同じです。`cellClass` に `group` がある場合、`group-data-filled:` クラスで入力済みセルの内側、つまり数字をスタイルできます。セルが変えるのはクラスだけで、内容は変えません。そのため、キーを 1 回押しても再スタイルされるのは 1 つのセルだけで、再描画は発生しません。

<a id="accessibility"></a>

## アクセシビリティ

- スクリーンリーダーには、`accessibilityLabel` で名前が付けられた 1 つのテキストフィールドとして見え、コードがその値になります。セルはスクリーンリーダーからは隠されます。コードの用途と桁数を伝えてください(例: 「認証コード、6 桁」)。`masked` の間、フィールドはセキュアなものになるため、コードは読み上げられません。
- キーボードはプラットフォーム標準のものです。スマートフォンではテンキー、デスクトップでは任意のキーボード(入力できるのは数字のみ)と Backspace を使います。Tab キーで、他のテキストフィールドと同様に入力へ移動できます。
- `disabled` の間はフォーカスを受け取らず、スクリーンリーダーは無効状態(dimmed)であると伝えます。

ラベル、ロール、通知全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームの注意事項

- iOS: フィールドはコードフィールド(`textContentType` `oneTimeCode`)になるため、QuickType バーにメッセージやメールのコードが候補として表示され、テンキーが表示されます。`masked` フィールドは、フォーカスを失った後に再度入力するとやり直しになります。iOS のセキュアフィールドと同じ動作です。
- Android: `autofillHints` `smsOTPCode` により、キーボードと自動入力サービスが SMS のコードを候補として提示でき、数字キーボードが表示されます。
- macOS、Windows、Linux、Web: タイピングとペーストはフィールドに渡されます(ブラウザでは、スマートフォンの数字キーボード用に `inputmode="numeric"` を使用します)。セルの上には I ビームポインターが表示されます。
