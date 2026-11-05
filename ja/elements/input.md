---
title: "Input"
description: "ネイティブのテキストフィールド: 制御・非制御テキスト、キーボード、オートフィル、選択、複数行入力、フォーカスについて説明します。"
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` はネイティブのテキストフィールドです。iOS と Mac Catalyst では UITextField(単一行)または UITextView(複数行)、Android では EditText が使われます。入力、キャレット、選択、自動修正、オートフィルはプラットフォーム本来の動作です。Rust では `nsh_base::input()`、TSX では `nsh/base` の `<Input>` で作成します。

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## 制御コンポーネントと非制御コンポーネント

- **制御**: `value` を渡し、`onChange` で更新します。アプリはユーザーが入力した内容を書き換えられます(トリムや整形など)。テキストには編集が即座に反映され、新しい `value` が届いた時点で修正されます。ネイティブでの各編集にはカウントが付き、アプリからの `value` は最新の編集に基づいている場合にのみ適用されるため、遅い更新よりも新しい入力が常に優先されます。
- **非制御**: `defaultValue`(`.default_value(..)`、または何も指定しない)を渡し、テキストは `onChange` または `onSubmit` から読み取ります。

ユーザーの入力中に常に守られるべきルールは、props としてネイティブ側で処理されます。`maxLength` は長さを制限し、`submitBehavior` は return キーの動作を決めます。[フォームとキーボード](../docs/forms-and-keyboard.md)を参照してください。

## Props

[共通 props](./index.md#common-props)に加えて(`style` は `TextStyle` 型です。フォント、色、配置、ビューのスタイルが適用されます):

<a id="text"></a>

### テキスト

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | アプリが制御するテキスト。 |
| `defaultValue` | `.default_value(..)` | `string` | | 初期テキスト。 |
| `placeholder` | `.placeholder(..)` | `string` | | 入力が空の間に表示されます。 |
| `multiline` | `.multiline(..)` | `boolean` | `false` | 複数行。`submitBehavior` で別の指定をしない限り、return は改行を挿入します。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 複数行入力のスクロールバー。プラットフォームのインジケーター、またはアプリが設定した場合はアプリ組み込みのバー([Scrollbar](./scrollbar.md#built-in-bars))。オブジェクトを渡すと独自のテーマになり、`false` は表示なしです。 |
| `maxLength` | `.max_length(..)` | `number` | | ユーザーが入力できる最大文字数。 |
| `readonly` | `.readonly(..)` | `boolean` | `false` | ユーザーはテキストを選択してコピーできますが、変更はできません。 |
| `masked` | `.masked(..)` | `boolean` | `false` | テキストを隠します(パスワード用)。 |
| `allowFontScaling` | | `boolean` | `true` | システムのテキストサイズに従います。 |
| `maxFontSizeMultiplier` | | `number` | `0` | システムスケールの上限(0 は上限なし)。 |

<a id="keyboard"></a>

### キーボード

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | キーボードレイアウト([値の一覧](../docs/forms-and-keyboard.md#keyboards-and-autofill))。`numbers-and-punctuation` には iOS ではマイナス記号があります。 |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | return キーのラベル。 |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 自動大文字化。 |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | システムの修正機能。 |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | 入力内容の種類。iOS、Android、Web でのオートフィルに使われます。`"username"`、`"current-password"`、`"new-password"`、`"one-time-code"`、`"email"`、`"tel"`、`"postal-code"`、`"cc-number"`、`"off"`、… |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | ペーストの動作。`"insert"` はペーストされたテキストを挿入し、`"report"` は何も挿入せず、`onPaste` が報告する内容をアプリが処理できるようにします。画像とファイルは挿入されません。 |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"`(単一行)、`"newline"`(複数行) | return キーの動作。`"submit"` は `onSubmit` を報告してフォーカスを維持し、`"blurAndSubmit"` はさらにフォーカスも外し、`"newline"` は改行を挿入します(複数行のみ。単一行では送信されます)。送信する複数行入力でも、ハードウェアキーボードでは Shift+Return または Option / Alt+Return で改行できます。`"submit"` はキーボードを表示したままにします(例: 複数のメッセージを続けて送信する場合)。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 表示時にフォーカスされます。 |

<a id="caret-and-selection"></a>

### キャレットと選択

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | キャレットを描画します(デフォルトは `true`。`false` で非表示)。 |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | 制御された選択範囲(UTF-16 単位)。`end` のデフォルトは `start`(キャレット)です。 |

キャレットは、ウィンドウが表示されアクティブな間は点滅します。Linux の GPUI ウィンドウでは、GTK アプリと同様に、入力や移動がないまま 10 秒が経過すると表示されたままになるため、フォーカスされたまま放置されたフィールドがフレームを消費することはありません。

<a id="colors"></a>

### 色

プレースホルダー、キャレット、選択ハイライトの色はスタイルキーで、対応する Tailwind クラスと Rust のメソッドがあります(UIKit ではキャレットと選択を 1 つの色で着色し、設定されている場合はキャレットの色が使われます):

| スタイルキー | Rust | クラス | 説明 |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | プレースホルダーの色。 |
| `caretColor` | `.caret_color(..)` | `caret-*` | キャレットの色。 |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | 選択ハイライトの色。 |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| `ios` キー | Rust | 型 | 説明 |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | `autoComplete` の iOS での名称(`"oneTimeCode"`、`"newPassword"`、…)。 |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | 入力にフォーカスがある間、キーボード上に表示される `InputAccessoryView` の `nativeID`([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview))。 |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | キーボードの外観。`"default"` はシステムの外観に従います。Android のキーボードはシステムのテーマに従います。 |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | ユーザーがテキストを変更したとき。`value` は現在のテキストです。 |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | 送信を行う入力(単一行、または `submitBehavior` が `"submit"` / `"blurAndSubmit"`)で return キーが押されたとき。 |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | なし | 入力がフォーカスを得た / 失ったとき。 |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | キャレットまたは選択が移動したとき(UTF-16 単位)。 |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | ユーザーがペーストしたとき。テキスト、その書式(HTML。Linux、Web)、画像(スクリーンショットなど)は `File`、ローカルファイルは `file:` URL として渡されます。挿入されるテキストの `onChange` より前に発生します([フォームとキーボード](../docs/forms-and-keyboard.md#pasting-images-and-files))。 |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | 選択に伴って、またはテキストのスクロールや折り返しによってキャレットが移動したとき。`bounds` は入力内での位置、`pageBounds` はウィンドウ内での位置、`Overlay` の `anchor` です([フォームとキーボード](../docs/forms-and-keyboard.md#the-caret))。 |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | テキストが変更される前。`key` は入力されたテキストで、`"Backspace"` または `"Enter"` です。 |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | 入力に伴ってテキストのサイズが変化したとき(複数行の場合は入力の幅に基づく)。空の入力は、プレースホルダーに関係なく空の 1 行として報告されます。 |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | 入力メソッドの変換が開始、変更、または終了したとき。`text` は変換中の内容(文字を選択する前のピンイン、変換前のかななど)で、終了時は `""` です。確定したテキストは、終了の前に `onChange` に届きます。 |

テキストに合わせて伸びる複数行入力:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Ref メソッド

| メソッド | Rust | 説明 |
|---|---|---|
| `focus()` | `focus()` | 入力にフォーカスを移し、キーボードを表示します。 |
| `blur()` | `blur()` | フォーカスを外します。 |
| `setSelection(start, end?)` | `set_selection(start, end)` | `start..end` を選択します(UTF-16 単位)。両者が等しい場合はキャレットになります。 |

return で次のフィールドにフォーカスを移す例:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`nsh` の `Keyboard.dismiss()`(Rust では `dismiss_keyboard()`)は、どの入力がキーボードを使用していても、キーボードを閉じます。

<a id="platform-notes"></a>

## プラットフォームに関する注記

- macOS では、単一行のテキスト、プレースホルダー、キャレットはネイティブフィールドのフォントメトリクスを共有し、コンテンツボックス内でまとめて中央に配置されます。`lineHeight` はレイアウトに影響し、複数行エディターでは段落間隔にも使われます。
- [スクロールビュー](./scroll.md#keyboard)内の入力は、ネイティブ側でキーボードに隠れないよう調整されます。それ以外の場所では、[`env(keyboard-inset-height)`](./keyboard.md)を下側のパディングまたはマージンとして使用してください。
- `disabled` は、無効時のスタイルを適用するだけでなく、入力を無効化します(フォーカス不可)。`readonly` の入力はフォーカスと選択を維持します。
- `inputAccessoryViewID` は、キーボードにアクセサリーバーがある iOS で適用されます。
