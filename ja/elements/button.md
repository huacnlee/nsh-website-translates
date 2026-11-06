---
title: "Button"
description: "Button コンポーネント: 押下を受け付けるターゲットで、押下操作、disabled 状態と selected 状態、およびスクリーンリーダー向けのロールを管理し、スタイルはアプリ側で指定します。"
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

ボタンは押下の対象です。押下、アプリの状態スタイルによる押下フィードバック、無効状態と選択状態、キーボードフォーカス、スクリーンリーダー向けのロールといった振る舞いを担います。見た目はアプリ側で決めます。`Button` は色、サイズ、パディング、ラベルを一切持たないため、与えるスタイルと子要素に応じて、1つのコンポーネントがプライマリボタン、アイコンボタン、タブ、ツールバーのトグル、リストの行のいずれにもなります。

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。TSX では、見た目は `class` と `style` で指定し、状態バリアントとして `active:`、`hover:`、`focus:`、`selected:`、`disabled:`(対応する `activeStyle`、`hoverStyle`、`focusStyle`、`selectedStyle`、`disabledStyle` も使えます)があります。Rust では、`button()` が、`view()` が view を作るのと同じ方法でボタンを作ります。プロパティごとのセッター(`.disabled(..)`、`.selected(..)`)、イベントごとのリスナー(`.on_press(..)`)、見た目のための型付きスタイルメソッド(`.px_4()`、`.bg(..)`)、状態のための状態メソッド(`.active(..)`、`.hover(..)`、`.focus(..)`、`.selected_style(..)`、`.disabled_style(..)`)、コンテンツのための `.child(..)` が用意されています。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | 既定値 | 説明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下も押下フィードバックも発生しません。`disabled:` スタイルが適用され、スクリーンリーダーは無効(dimmed)状態として読み上げます。 |
| `selected` | `.selected(..)` | `boolean` | `false` | 選択状態です。オンになっているトグルや現在のタブなどに使います。スクリーンリーダーもそのように読み上げます。値はアプリが保持し、スタイルもアプリが指定します。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | `selected` かつ無効でないときのスタイルで、`selected:` クラスとして指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | アイコンなどコンテンツだけでは不十分な場合に、スクリーンリーダーが読み上げる内容です。 |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | そのコントロールに該当する `nsh/base` コンポーネントがない場合に、スクリーンリーダーに伝える種類です。たとえば `"link"`(URL を開く)などがあります。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | なし | 境界の外側どこまでを押下として扱うかをポイント単位で指定します。全辺共通の1つの数値か、辺ごとの指定を渡せます。view の `hitSlop` と同じです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | コンテンツです。テキスト、アイコン、任意のレイアウトを指定できます。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 見た目のすべてです。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下中、ホバー中、フォーカス中、無効中のスタイルで、`<state>:` クラスとして指定します。後ろの状態が優先され、`disabled` はすべてに優先します。 |

Rust では、各プロパティは値、シグナル、クロージャのいずれかを受け取るセッターです。指定しなかったプロパティは既定値のままです。

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | ボタンが押されました。タップ、クリック、キーボードフォーカス中の Return または Space、スクリーンリーダーによるアクティベートが該当します。 |
| `onPressDown` | `.on_press_down(\|\| ..)` | ボタン上で押下が始まりました。 |
| `onPressUp` | `.on_press_up(\|\| ..)` | 押下が終わりました。指を離した、ボタンの外へ移動した、またはキャンセルされた場合です。 |

`onPressDown` と `onPressUp` は、スプリングアニメーションや状態スタイルでは表現できないハイライトなど、独自の押下フィードバックのためのものです。無効状態のボタンはこれらをいずれも通知しません。

<a id="styling"></a>

## スタイル設定

ボタンの見た目はアプリ側のものです。何をプライマリボタンやセカンダリボタンとするかはアプリが決めます。小さなコンポーネントを組にすると、その決定を1か所にまとめられます。

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

状態バリアントはネイティブに適用されます。押下時のボタンの暗色化はメインスレッド上で行われ、JS や Rust は動きません。Rust でも状態メソッドは同じバリアントです。`.active(..)`、`.hover(..)`、`.focus(..)`、`.selected_style(..)`、`.disabled_style(..)` はボタン自身の状態に追従します。テーマの色も同様に使えます。TSX では `bg-primary`、Rust では `theme().primary` です([テーマトークン](../docs/tailwind.md#theme-tokens)を参照)。

<a id="disabled"></a>

## 無効状態

無効状態のボタンは押下を受け付けず、フィードバックも返さず、スクリーンリーダーは無効(dimmed)として読み上げます。無効時の見た目は `disabled:` クラスや `disabledStyle` で自由に決められます。

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## selected によるトグル

`selected` を指定すると、ボタンはトグルになります。ツールバーの太字ボタン、フィルターチップ、現在のタブなどが例です。値はアプリが保持し、`onPress` で切り替え、選択状態のスタイルも指定します。スクリーンリーダーはボタンを選択状態として読み上げます。

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

タブの並びには [`Tabs`](./tabs.md)、オン/オフのコントロールには [`Switch`](./switch.md) を使います。どちらも `nsh/base` のコンポーネントで、それぞれの種類に応じたロール、選択状態、キーボード操作を備えています。`Button` に `role="tab"` や `role="switch"` を指定しても、これらは得られません。

<a id="a-small-target-with-hitslop"></a>

## hitSlop による小さなタップ対象

アイコンボタンは指より小さいことがあります。`hitSlop` を指定すると、レイアウトや見た目を変えずに、各辺の外側にあるポイント単位の範囲での押下も有効になります。全辺共通の1つの数値か、辺ごとの指定(`{ top: 8, bottom: 8 }`)を渡せます。これは [view の `hitSlop`](./index.md#presses-and-feedback) と同じ指定方法です。

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## アクセシビリティ

- ボタンはスクリーンリーダーにとって1つの要素で、`role` で別途指定しない限りロールは `"button"` です。ラベルはテキストコンテンツになります。コンテンツがアイコンの場合や情報が足りない場合は `accessibilityLabel` を指定してください。
- `disabled` と `selected` は、各プラットフォームの通常の方法で読み上げられます(VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー)。
- macOS と Web では、ボタンはキーボードフォーカスの停止位置になります。Tab で移動でき、Return と Space で押下でき、`focus:` スタイルでフォーカスの位置を示せます。

ラベル、ロール、読み上げ全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームごとの注記

- iOS、Android、Mac Catalyst: 押下は、ボタン上で終わるタップです。システム標準のボタンと同様に、外へ移動するとキャンセルされます。
- デスクトップ(macOS、Windows、Linux、GPUI)と Web: 押下はクリックです。macOS と Web では、キーボードフォーカスのあるボタンを Return や Space でも押下できます。`hover:` スタイルは、マウスやトラックパッドのポインターの下で適用されます。
- どのプラットフォームでも、描画されるのはアプリが指定したスタイルです。押下フィードバックは `active:` / `activeStyle` か、独自のアニメーションで実現します。
