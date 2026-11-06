---
title: "キーボード"
description: "keyboard-inset-height 環境変数、Keyboard.dismiss、キーボードの高さ:ソフトウェアキーボードの上にコンテンツを保ち、キーボードに合わせて移動させます。"
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# キーボード

`env(keyboard-inset-height)` は、サーフェス上に表示されるソフトウェアキーボードの高さです。キーボードが非表示のときは 0 になります。ビューの下パディングまたは下マージンとして使うと、コンテンツがキーボードの上に保たれます。キーボードが表示または非表示になると、ビューはその高さ分の余白を確保し、その変化はネイティブにキーボードと一緒にアニメーションします。チャット画面下部のメッセージバーのように、スクロールビューの外にあるコンテンツに使ってください。[スクロールビュー](./scroll.md)や [List](./list.md) の内側にある入力欄は、ネイティブに表示位置までスクロールされます。あわせて、キーボードを非表示にする `Keyboard.dismiss()` と、独自のレイアウト向けにキーボードの高さも利用できます。

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

キーボードの高さ全体は、画面コンテンツのように画面の下端まで届くビューに適しています。タブバーなど、ビューの下に別の要素がある場合は、長さを使ってその分を差し引きます。`calc(env(keyboard-inset-height) + -49px)` は、高さ 49 pt のタブバーの上にビューを保ち、`calc(env(keyboard-inset-height) + 12px)` はキーボードの上に余白を加えます。パディングは 0 未満にはなりません。

<a id="padding-or-margin"></a>

## パディングかマージンか

| スタイル | 余白の確保方法 |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"`（Tailwind では `pb-[env(keyboard-inset-height)]`、Rust では `.pb_keyboard()`） | 上側のコンテンツが縮みます。背景は画面の下端まで届いたままです。 |
| `marginBottom: "env(keyboard-inset-height)"`（Tailwind では `mb-[env(keyboard-inset-height)]`、Rust では `.mb_keyboard()`） | 背景を含むビュー全体が、キーボードの上端で終わります。 |

キーボードの高さは、同じ宣言内の長さにのみ加算されます。そのため、ビュー自身の余白と組み合わせる場合は `calc()` に記述します。Rust では、`.pb_keyboard_plus(px(..))` と `.mb_keyboard_plus(px(..))` が長さを加算します。

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

この例では、ビューの下にある 49 pt のタブバーが、すでにキーボードの高さの一部を覆っています。余白の確保をオフにするには、たとえばシグナルの条件を使うなどして、スタイルから変数を外します。

<a id="hiding-the-keyboard"></a>

## キーボードを非表示にする

`nsh` の `Keyboard.dismiss()` は、フォーカス中の入力欄のフォーカスを外し、キーボードを非表示にします。フォーカス中の入力欄がない場合は、何も変更しません。Rust コンポーネントでは `dismiss_keyboard()` を呼び出します。

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> ユーザーがスクロールビューをドラッグしたときにキーボードを非表示にするには、[スクロールビュー](./scroll.md)または [List](./list.md) に `keyboardDismissMode="on-drag"` または `"interactive"` を設定します。

<a id="the-keyboards-height"></a>

## キーボードの高さ

| TSX | Rust | 戻り値 |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`、`keyboard_duration()` | NSH サーフェス上のソフトウェアキーボードの高さ（ポイント単位。非表示の間は 0）と、その表示・非表示アニメーションの所要時間（ミリ秒単位）。 |

どちらもリアクティブです。これらを読み取るエフェクト、JSX 式、スタイルのクロージャは、キーボードが表示・非表示になったとき、または高さが変わったときに再実行されます。

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

この高さは、キーボードのうち NSH サーフェスと重なる部分です。キーボードに合わせてウィンドウ自体が縮む場合（サイズ変更を行う Android のアクティビティ）や、キーボードの上で終わるビューに NSH が埋め込まれている場合、高さは 0 になります。

> [!NOTE]
> コンテンツをキーボードの上に保つなら、`env(keyboard-inset-height)` のほうが簡単です。コードを実行せずに、ネイティブにキーボードと一緒にアニメーションします。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- **iOS**: 余白は、キーボード自身の所要時間と ease-in-ease-out カーブでアニメーションします。
- **Android**: キーボードに合わせてウィンドウが縮む場合（サイズ変更を行うアクティビティ）、コンテンツはすでにキーボードの上で終わっており、変数は 0 です。キーボードがビューに重なる場合は、iOS と同様に余白を確保します。
- **デスクトップと Mac Catalyst**: ハードウェアキーボードで入力するため、変数は 0 のままで、ビューのレイアウトは変わりません。
- **Web**: 変数はブラウザ自身の値（VirtualKeyboard API の値）です。

フォーカス順序、リターンキー、入力アクセサリについては[フォームとキーボード](../docs/forms-and-keyboard.md)を、その他の環境変数については[セーフエリア](./safe-area.md)を参照してください。
