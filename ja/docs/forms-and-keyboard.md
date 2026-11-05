---
title: "フォームとキーボード"
description: "input 要素によるテキスト入力 - 制御された値と制御されない値、キーボードの種類、リターンキー、フォーカス、選択範囲、自動で高さが伸びる複数行入力 - と、ソフトウェアキーボードにコンテンツが隠れないようにする方法。"
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# フォームとキーボード

テキスト入力は input 要素で、Rust では `input()`、TSX では `<Input>` です。iOS では UITextField または UITextView、Android では EditText になります。入力、キャレット、選択、自動修正、オートフィルはプラットフォーム自身の機能です。アプリはイベントを通じてテキストを受け取り、制御することもできます。NSH はフォーカスされた入力を自動でソフトウェアキーボードの上に保ち、自動では対処できない場合のために、キーボードの高さをリアクティブな値として提供します。

input は他のビューと同様にスタイルを受け取るため(Rust では型付きのスタイルメソッド、TSX ではスタイルと Tailwind クラス)、フォームのフィールドにアプリ独自の見た目を与えられます。ラベル付きフィールドは、自分で書く短いコンポーネントです。

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## 制御入力と非制御入力

値を渡すと(`.value(..)`、TSX では `value`)、input は**制御入力**になります。signal が保持している内容が表示され、change イベント(`.on_change(..)`、TSX では `onChange`)から signal を更新します。

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

値を制御しているので、ユーザーが入力した内容を変換できます。`.on_change(move |t: &str| tag.set(t.to_uppercase()))` は大文字に変換し、`onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` は数字だけを残します。

<a id="input-methods"></a>

### 入力メソッド

中国語、日本語、韓国語の入力メソッドは、テキストを確定する前に組み立てます。たとえばピンインは、文字が選ばれると 腾 になります。`onCompositionChange`(Rust では `.on_composition_change(..)`)は組み立ての進行を報告します。ユーザーが入力している間は `{ composing: true, text: "teng" }`、終了時は `{ composing: false, text: "" }` です。確定したテキストは、終了の前に `onChange` に届きます。iOS、Android、macOS、Web では、これらのシステムが組み立て中のテキストを input 内に保持するため、`onChange` も組み立て中のテキストを報告します。Windows、Linux、GPUI では確定したテキストを報告します。制御入力は、アプリが値をどう扱っても組み立てを継続します。ユーザーが組み立てている間に設定された `value` は、組み立てが終わってから表示されます。そのため、テキストを大文字にしたりフィルタしたりする input でも、ピンインは入力されたとおりに受け付けられます。

確定したテキストだけを検索する検索ボックスの例です。

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

value を指定しない input は**非制御入力**です。input が自分でテキストを保持し、デフォルト値(`.default_value(..)`、TSX では `defaultValue`)から始まります。テキストが必要になったときは、change または submit イベントから読み取ります。パスワードのように、送信時にだけ読み取るフィールドに使います。

> [!NOTE]
> 制御入力はキー入力を失いません。ネイティブ側の編集にはそれぞれ編集カウントが付き、JS から返ってきた `value` は、最新の編集に対応するものである場合にのみ適用されます。JS の処理が遅く、その間にユーザーがさらに入力していた場合、古い値は新しいテキストを上書きせずに破棄されます。

<a id="props"></a>

## プロパティ

Rust では、各プロパティは `input()` のメソッドで、スネークケースの名前になります(`.placeholder(..)`、`.masked(true)`、`.max_length(6)`、`.return_key_type(ReturnKeyType::Next)`、`.selected_range((0, 4))`)。次のものだけは独自の名前を持ちます。`.keyboard_type(KeyboardType::Email)` とその他の `KeyboardType` バリアント、`autoComplete` に対する `.auto_fill(AutoFill::Email)`、`ios={{ … }}` プロパティに対する `.keyboard_appearance(..)` と `.input_accessory(..)` です。各イベントは `on_` のメソッドです。`.on_change(|text: &str| ..)`、`.on_submit(|text: &str| ..)`、`.on_focus(..)`、`.on_blur(..)`、`.on_selection_change(|s: &Selection| ..)`、`.on_key_press(|key: &str| ..)`、`.on_content_size_change(|size: &Size<Points>| ..)`。

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string` | | テキスト。JS が制御します。 |
| `defaultValue` | `string` | | 非制御入力の初期テキスト。 |
| `placeholder` | `string` | | 入力が空の間に表示されます。 |
| `masked` | `boolean` | `false` | テキストを隠します(パスワード用)。 |
| `keyboardType` | `KeyboardType` | `"default"` | キーボードのレイアウト。 |
| `returnKeyType` | `ReturnKeyType` | `"default"` | リターンキーのラベル。 |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 自動大文字化。 |
| `autoCorrect` | `boolean` | `true` | システムによる修正。 |
| `autoComplete` | `AutoComplete` | | オートフィル用に、入力が保持する内容を示します。 |
| `multiline` | `boolean` | `false` | 複数行。`submitBehavior` で指定しない限り、リターンは改行を挿入します。 |
| `maxLength` | `number` | | ユーザーが入力できる最大文字数。 |
| `readonly` | `boolean` | `false` | ユーザーはテキストを選択およびコピーできますが、変更はできません。 |
| `autoFocus` | `boolean` | `false` | 表示されたときにフォーカスされます。 |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | 単一行は `"blurAndSubmit"`、複数行は `"newline"` | リターンの動作。送信してフォーカスを保つ、送信してフォーカスを外す、改行を挿入する(複数行のみ)のいずれかです。 |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | ペーストの動作。そのテキストを挿入するか、何もしないかを選びます([ペースト](#pasting-images-and-files))。 |
| `caret` | `boolean` | `true` | キャレットを描画します。`false` で非表示になります。 |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | キーボードの外観(iOS)。 |
| `selectedRange` | `{ start: number; end?: number }` | | 制御される選択範囲。UTF-16 単位です。 |
| `allowFontScaling` | `boolean` | `true` | システムのテキストサイズに従います。 |
| `maxFontSizeMultiplier` | `number` | | システムスケールの上限(0 は上限なし)。 |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: キーボードの上に表示されるバー(後述)。 |
| `ios={{ textContentType }}` | `TextContentType` | | `autoComplete` の値に対する iOS 側の名前。 |

イベント:

| イベント | ペイロード | タイミング |
|---|---|---|
| `onChange` | `{ value }` | テキストが変更されたとき。`value` が現在のテキストです。 |
| `onSubmit` | `{ text }` | 送信を行う input でリターンキーが押されたとき(単一行、または `submitBehavior` が `"submit"` / `"blurAndSubmit"` の場合)。 |
| `onFocus` / `onBlur` | | input がフォーカスを得た / 失ったとき。 |
| `onSelectionChange` | `{ start, end }` | キャレットまたは選択範囲が移動したとき(UTF-16 単位)。 |
| `onPaste` | `{ text, html, files, uris }` | ユーザーがペーストしたとき。テキスト、その HTML(Linux、Web)、`File` としての画像、ローカルファイルの URL が渡されます([ペースト](#pasting-images-and-files))。 |
| `onCaretMove` | `{ bounds, pageBounds }` | キャレットが移動したとき。input 内とウィンドウ内での位置が渡されます([キャレット](#the-caret))。 |
| `onKeyPress` | `{ key }` | テキストが変更される前。`key` は入力されたテキストで、`"Backspace"` または `"Enter"` です。 |
| `onContentSizeChange` | `{ size }` | 入力中にテキストのサイズ(`size`)が変わったとき(複数行の場合は input の幅を基準にします)。空の input は、プレースホルダーに関わらず、空の 1 行として報告されます。 |
| `onCompositionChange` | `{ composing, text }` | 入力メソッドの組み立てが開始、変更、終了したとき([入力メソッド](#input-methods)を参照)。 |

input はテキストと同じようにスタイルを指定します。`fontSize`、`color`、`fontFamily`、`textAlign`、`letterSpacing` などの[テキストスタイル](./text.md)に加えて、ボーダー、パディング、背景も使えます。フォーカス時のスタイル(Rust では `.focus(|s| ..)`、TSX では Tailwind バリアントの `focus:` または `focusStyle`)は、input がフォーカスを持っている間に適用されます。プレースホルダーの色は `.placeholder_color(..)`(スタイルキーは `placeholderColor`、`placeholder:text-*`)、キャレットの色は `.caret_color(..)`(`caretColor`、`caret-*`)、選択ハイライトの色は `.selection_color(..)`(`selectionColor`、`selection:text-*`)です。UIKit はキャレットと選択を 1 つの色で着色し、キャレットの色が設定されていればそれを使います。

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## キーボードとオートフィル

キーボードタイプ(`.keyboard_type(..)`、TSX では `keyboardType`)でレイアウトを選びます。

| Rust | TSX | キーボード |
|---|---|---|
| `KeyboardType::Default` | `"default"` | テキスト。 |
| `KeyboardType::Email` | `"email-address"` | `@` と `.` を入力しやすいテキスト。 |
| `KeyboardType::Url` | `"url"` | `/` と `.com` を備えたテキスト。 |
| `KeyboardType::Number` | `"number-pad"` | 数字のみ。符号も小数点記号もありません(コード、PIN など)。 |
| `KeyboardType::Decimal` | `"decimal-pad"` | 数字と小数点記号。 |
| `KeyboardType::Numeric` | `"numeric"` | React Native と同じです。iOS では小数点パッド、Android では符号と小数点記号付きの数字キーボードです。 |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | 数字、マイナス記号、句読点(iOS の数字と句読点のキーボード。Android では符号と小数点記号付きの数字)。iOS で負の数を入力させる場合に使います。 |
| `KeyboardType::Phone` | `"phone-pad"` | 電話のダイヤルパッド。 |

iOS では、`.keyboard_appearance(KeyboardAppearance::Dark)`(TSX では `ios={{ keyboardAppearance: "dark" }}`。light がデフォルト)を指定すると、システムの外観に関わらずキーボードがライトまたはダークの見た目になります。ライトモードで動作するダークテーマのアプリで使います。Android のキーボードは常にシステムのテーマに従います。

オートフィル(`.auto_fill(AutoFill::Email)`、TSX では `autoComplete`)は、フィールドが保持する内容をシステムに伝え、保存済みの名前、住所、パスワード、メッセージからのワンタイムコードを提案できるようにします。Rust の `AutoFill` には種類ごとにバリアントがあります(`Name`、`GivenName`、`FamilyName`、`Email`、`Tel`、`Username`、`Password`、`NewPassword`、`OneTimeCode`、`StreetAddress`、`PostalCode`、`Country`、`CreditCardNumber`、`Url`、`Birthdate`、…、そして `Off`)。TSX では次の値を受け付けます。`"name"`、`"given-name"`、`"family-name"`、`"email"`、`"tel"`、`"username"`、`"current-password"`、`"new-password"`、`"one-time-code"`、`"street-address"`、`"postal-code"`、`"country"`、`"cc-number"`、`"cc-exp"`、`"cc-csc"`、`"url"`、`"birthdate-full"` などがあり、または `"off"` も使えます。iOS 固有の名前(`"emailAddress"`、`"oneTimeCode"`、…)も、`autoComplete` または `ios={{ textContentType }}` で受け付けられます。

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## リターンキーとフィールド間の移動

リターンキータイプ(`.return_key_type(ReturnKeyType::Next)`、TSX では `returnKeyType`)は、リターンキーのラベルを決めます。default、done、go、next、search、send のいずれかです。送信動作(`.submit_behavior(..)`、TSX では `submitBehavior`)は、押したときの動作を決めます。

| Rust | TSX | リターン | デフォルトの対象 |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | submit イベントを発火し、その後 input がフォーカスを失います | 単一行の input |
| `SubmitBehavior::Submit` | `"submit"` | submit イベントを発火します。input はフォーカスを保ちます | |
| `SubmitBehavior::Newline` | `"newline"` | 改行を挿入します(複数行の input のみ) | 複数行の input |

`"submit"` または `"blurAndSubmit"` を指定した複数行の input は、チャットの入力欄のようにリターンで送信しつつ、行は折り返します。ハードウェアキーボード(デスクトップ、Mac、タブレットのキーボード)では、Shift+Return または Option / Alt+Return で改行を挿入します。入力メソッドの組み立て(たとえば中国語や日本語の入力)を確定するリターンは、確定するだけで、送信はしません。

次のフィールドに移動するには、input への ref(Rust では `element_ref()` と `.element_ref(&r)`、TSX では `ref`)を保持し、`focus()` を呼び出します。

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

最初のフィールドでフォーカスを外さずに送信すると(`SubmitBehavior::Submit`、`submitBehavior="submit"`)、フォーカスが移動する間もキーボードが表示されたままになり、下がってまた上がることがありません。リターンで送信してフォーカスを保つチャット入力欄も、同じ方法で送信します(下の入力欄の例([下記](#content-outside-scroll-views))を参照)。

最大文字数と送信動作はどちらもネイティブ側で適用されます。ユーザーが入力するたびに、プラットフォームが「この文字を追加してよいか」「リターンで編集を終了すべきか」を尋ね、NSH は JS を待たずにプロパティから答えます。

<a id="focus-from-code"></a>

## コードからのフォーカス

input の ref には次のものがあります。

| Rust | TSX | 説明 |
|---|---|---|
| `focus()` | `focus()` | input にフォーカスし、キーボードを表示します。 |
| `blur()` | `blur()` | フォーカスを外します。 |
| `set_selection(start, end)` | `setSelection(start, end?)` | `start..end` を選択します(UTF-16 単位)。2 つが等しい場合はキャレットになります(TSX では `end` を省略した場合)。 |

macOS と Web では、プレスを受け付けるビューの ref に対する `focus()` と `blur()` が、Tab キーと同じようにキーボードフォーカスを移動します([キーボードフォーカス](../elements/index.md#keyboard-focus))。

Rust の `dismiss_keyboard()` と、TSX で `nsh` からインポートする `Keyboard.dismiss()` は、フォーカスを持っている input をどれであっても解除します。

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## 選択

selection イベント(`.on_selection_change(..)`、TSX では `onSelectionChange`)はキャレットと選択範囲を報告します。ref の `set_selection` や、選択範囲の指定(`.selected_range(..)`、TSX では `selectedRange`)でそれらを設定します。位置は JavaScript の文字列インデックスと同じく UTF-16 コードユニットなので、TSX では `text.slice(start, end)` が選択されたテキストになります。Rust では、テキストの UTF-16 単位でスライスします。

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## キャレット

caret イベント(`.on_caret_move(..)`、TSX では `onCaretMove`)はキャレットの位置を伝えるので、キャレットの位置に属するものをそこに開くことができます。たとえば `@` メンションの候補、スラッシュコマンドのメニュー、絵文字ピッカーです。`bounds` は input 内の `Bounds` で(`origin` と `size`。input のパディングとスクロールが反映されます)、幅はプラットフォームがキャレットを描画する幅、高さはその行の高さです。`pageBounds` は同じボックスをウィンドウ内(input がダイアログ内にある場合はそのダイアログ内)で表したもので、オーバーレイはこれを `anchor` として受け取ります。このイベントは input がフォーカスを持っている間、キャレットが移動するたびに発生します。選択範囲の変化に伴う場合や、input のテキストがスクロールしたり別の行に折り返したりする場合です。Rust では、オーバーレイは `.anchor_bounds(..)` でボックスを基準に配置します。

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` は、イベントが発生した時点のキャレットの位置です。input の下でページがスクロールすると input は動きますが、イベントは送られません。そのため、スクロール時には候補を閉じるか、候補を input 自体に固定してください。

<a id="pasting-images-and-files"></a>

## 画像とファイルのペースト

paste イベント(`.on_paste(..)`、TSX では `onPaste`)は、キーボードショートカット、メニューの「ペースト」、キーボードの画像入力のいずれかでユーザーがペーストした内容を伝えます。`text`、`html`、`files`、`uris` です。`html` は、ブラウザ、オフィススイート、リッチテキストエディタがコピーしたときの書式付きの同じ内容です(Linux と Web)。`files` は、クリップボードがデータとして保持していたもので、スクリーンショットや、ページや他のアプリからコピーした画像などです。アプリがアップロードや表示に使えるバイト列を持つ `File` で、名前は `image.png`(または、その種類)です。`uris` は、ファイルマネージャーでコピーしたファイルの `file:` URL で、ファイルドロップの場合と同じです。プラットフォームは、ユーザーがペーストしたときにだけクリップボードを読み取ります。

input は、これまでどおり、ペーストされたテキストを自動で挿入します。このイベントは、そのテキストの `onChange` より前に発生します。input はテキストを保持するものなので、画像とファイルが挿入されることはありません。`pasteBehavior` を `"report"` にすると input は何も挿入せず、ペーストの動作をアプリが決めます。たとえば、長いテキストを添付ファイルとして送信したり、整形したバージョンを挿入したりできます。システムがその場で input に問い合わせるため、input はプロパティから即座に判断します。

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

ペーストされたファイルは、他の `File` と同様に `fetch` と `FormData`(`form.append("image", file)`)でアップロードします。そのバイト列は、送信されるまでネイティブ側に残ります。Android では、画像(GIF やステッカー)を挿入するキーボードも、同じ方法で画像を報告します。Linux ではクリップボードが非同期に読み取られるため、イベントは、挿入されるテキストの `onChange` より後に発生することがあります。macOS のマスクされた input は AppKit 標準のペーストを維持し、何も報告しません。

<a id="multiline-inputs-that-grow"></a>

## 伸びる複数行入力

複数行の input(`.multiline(true)`、TSX では `multiline`)は、テキストを自身の高さの内側でスクロールします。内容に合わせて伸ばすには、content size イベントの高さ(`.on_content_size_change(..)`、TSX では `onContentSizeChange`)を、上限を設けてスタイルに反映します。

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

報告される高さはテキストの高さ(input の幅を基準にしたもの)なので、上の例のように、垂直方向のパディングは自分で加えてください。
<a id="keeping-inputs-above-the-keyboard"></a>

## キーボードの上に入力欄を保つ

<a id="inside-scroll-views-automatic"></a>

### スクロールビュー内: 自動

スクロールビューやリスト内のフォーカス中の入力欄の上にキーボードが表示されると、NSH はキーボードの高さと同じ下側のインセットをスクロールビューに設定し、入力欄が見えるようにスクロールします。これはネイティブの処理であり、コードは不要です。長いフォームは、入力欄を並べたスクロールビューにすぎません。

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

dismiss モード(`.keyboard_dismiss_mode(..)`、TSX では `keyboardDismissMode`: none、on drag、interactive)では、フォームをドラッグしてキーボードを隠せます。handled taps(`.keyboard_taps(KeyboardTaps::Handled)`、TSX では `keyboardShouldPersistTaps="handled"`)では、キーボードの表示中にボタンをタップしても、キーボードを閉じるだけで終わらず、そのタップがボタンに渡されます。[Scrolling](./scrolling.md#scroll-views-and-the-keyboard)を参照してください。

<a id="content-outside-scroll-views"></a>

### スクロールビュー外のコンテンツ

iOS では、スクロールビューに含まれないフォーカス中の入力欄がキーボードに覆われる場合、NSH は SwiftUI と同様に、入力欄がキーボードのすぐ上に来るまで、その画面(またはダイアログ)のコンテンツをキーボードのカーブに沿って上に移動し、キーボードが隠れたとき、または入力欄がフォーカスを失ったときに元に戻します(Android では、`adjustPan` モードのウィンドウはシステムによってパンされます)。この移動が行われるのは、アプリ自身のレイアウトでは覆われたままになる部分に対してのみです。以下のようにアプリ自身が余白を確保している場合、さらに移動されることはありません。

この方法ではページ全体が移動します。画面の下部に固定されたメッセージバーはキーボードに乗って上がり、その上のコンテンツは代わりに縮むようにしたい場合は、画面の下側に CSS の `env(keyboard-inset-height)`(`paddingBottom: "env(keyboard-inset-height)"`、Tailwind では `pb-[env(keyboard-inset-height)]`、Rust では `.pb_keyboard()`)でパディングを設定してください。これにより、キーボードと同じ高さの余白が下側に確保され、キーボードに合わせてネイティブにアニメーションします。

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

パディング(`.pb_keyboard()`)では、背景は画面の下端まで届いたまま、その上のコンテンツが縮みます。下マージン(`marginBottom: "env(keyboard-inset-height)"`、`.mb_keyboard()`)では、ビュー全体がキーボードの上端で終わります。`calc(env(keyboard-inset-height) + <length>)`(Rust では `.pb_keyboard_plus(..)`、`.mb_keyboard_plus(..)`)は、たとえばビューの下にあるタブバーの高さを引くといった長さを加算します。

全高は、画面のコンテンツのように、サーフェスの下端まで届くビューに適しています。キーボードに合わせてウィンドウがリサイズされる Android ホストでは、ウィンドウ自体が縮むため、この変数は 0 になります。[Keyboard](../elements/keyboard.md)を参照してください。

<a id="the-keyboard-accessor"></a>

### キーボードアクセサ

Rust の `keyboard_height()` と `keyboard_duration()`、および TSX の `nsh` からの `keyboardFrame()`(`{ height, duration }`)はリアクティブで、キーボードがサーフェスにどれだけ入り込んでいるか(非表示のときは 0。その下のボトムセーフエリアを含む)と、そのアニメーションの長さ(ミリ秒)を表します。カスタムの処理にはこれらを読み取ってください。たとえば、入力中はフローティングボタンを隠したり、パネルのサイズを調整したりできます。キーボードの動きが始まる更新でこれらと共に変化するものは、`env(keyboard-inset-height)` と同様に、キーボードのカーブに沿って、動き始めた時点からのタイミングでキーボードと共に動きます(`LayoutCurve::Keyboard`)。アプリがその更新に対して設定したアニメーション(`LayoutAnimation.configureNext`)がある場合は、そちらが優先されます。

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## キーボード上のバー(iOS): InputAccessoryView

Rust の `input_accessory_view(id)` と TSX の `nsh/mobile` からの `InputAccessoryView` は、それを指定した入力欄がフォーカスされている間、キーボードの上端に取り付けられたバーを表示します。これは iOS の `inputAccessoryView` です。インタラクティブに閉じる操作中も含め、ネイティブにキーボードと共に動きます。ツリー内で配置された場所ではスペースを取らず、入力欄は id で参照します(`.input_accessory(id)`、TSX では `ios={{ inputAccessoryViewID }}` と `nativeID`)。

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

このバーの幅はウィンドウと同じで、高さはコンテンツに応じます。入力アクセサリは iOS 固有の機能です。Android ではバーは空の非表示ビューになるため、それらのコントロールは別の場所に配置してください。たとえば入力欄の上に配置します(Rust では `os() == Os::Android`、TSX では `platform.os === "android"`)。

<a id="related"></a>

## 関連項目

- [`Input`](../elements/input.md): 要素リファレンス。
- [Keyboard](../elements/keyboard.md)と[`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe)。
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`。
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard): スクロールビューでのキーボードの非表示とタップ。
