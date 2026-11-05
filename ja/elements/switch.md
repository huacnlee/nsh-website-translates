---
title: "Switch"
description: "Switch コンポーネント:オン/オフを切り替えるコントロールで、プレス操作、キーボードによる操作、無効状態、およびスクリーンリーダー向けのロールと値を管理し、トラックとサムはアプリ側でスタイルを指定します。"
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

スイッチは設定のオンとオフを切り替え、その変更は即座に反映されます。スイッチが担うのは動作です。プレス、キーボードによる操作、無効状態、そしてスクリーンリーダー向けのスイッチロールとその値が含まれます。見た目はアプリ側が決めます。`Switch` 自体には色、サイズ、モーション、ラベルがありません。スイッチは、thumb を内側に持つ track、続いてその子要素(ラベル)で構成され、アプリはスイッチに追従する `checked:` と `disabled:` クラスを使って各パーツをスタイル指定します。

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。値はアプリが保持します。プレスすると `onChange` で次の値が通知され、スイッチはアプリが返した `checked` を表示します。Rust では、`switch()` でスイッチを作成できます。プロパティごとのセッター(`.checked(..)`、`.track_style(..)`)、イベントごとのリスナー(`.on_change(..)`)、スイッチ自体用の型付きスタイルメソッド、ラベル用の `.child(..)` が用意されています。パーツのスタイルでは、スイッチに追従するステートメソッド(`.checked(..)`、`.disabled_style(..)`)を使用できます。

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | オンかオフかを表します。プレスすると `onChange` で次の値が通知され、スイッチはアプリが返した値を表示します。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | プレスとプレスのフィードバックが無効になります。`disabled:` スタイルがスイッチとそのパーツに適用され、スクリーンリーダーには薄く表示されている(dimmed)状態として伝えられます。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | none | `checked` かつ無効でないときのスイッチのスタイルです。`checked:` クラスで指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | none | スクリーンリーダーが読み上げる内容です。子要素にそれを伝えるテキストがない場合に、スイッチが何をオンにするのかを示します。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | none | track です。thumb が沿って動くパーツです。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | none | thumb です。track の内側に配置されます。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | none | 境界の外側どこまでをプレスとして扱うかをポイント単位で指定します。すべての辺に同じ数値を指定するか、辺ごとに名前を付けて指定します。view の `hitSlop` と同様です。 |
| `children` | `.child(..)` | `JSX.Element` | none | track の後ろに置くコンテンツです。ラベルで、スクリーンリーダーが読み上げます。 |
| `class`、`style` | style methods | `string`、`StyleProp<ViewStyle>` | none | スイッチ自体、つまり track とラベルを囲む行です。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | none | プレス中、ホバー中、フォーカス中、無効のときのスイッチのスタイルです。`<state>:` クラスで指定します。 |

## Events

| Event | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | スイッチがプレスされました。タップ、クリック、キーボードフォーカス中の Space または Return、あるいはスクリーンリーダーによるアクティベーションが該当します。スイッチが求める値を `checked` として通知します。これは現在の `checked` の反対の値です。 |

無効なスイッチは何も通知しません。

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| スイッチ | | `class`、`style` | `checked:`、`disabled:`、`active:`、`hover:`、`focus:`(または `checkedStyle`、`disabledStyle` など) |
| track | スイッチの先頭 | `trackClass`、`trackStyle` | `checked:`、`disabled:` はスイッチに追従します |
| thumb | track | `thumbClass`、`thumbStyle` | `checked:`、`disabled:` はスイッチに追従します |
| ラベル | スイッチ内の track の後ろ | 独自の要素(`children`) | `group-checked:` と、スイッチの `class` に `group` を付けたその他の `group-*:` バリアント |

thumb は、それ自身の `checked:` スタイルで動きます。translation(`checked:translate-x-5`)、マージン、または track の配置(track 側の `checked:justify-end`)を使います。`transition-*` クラスを使うと、変化がネイティブにアニメーションします。ラベルを track の前に置くには、行を反転させます(`class="flex-row-reverse justify-between"`)。

## Disabled

無効なスイッチはプレスを受け付けず、スクリーンリーダーには薄く表示されている(dimmed)状態として伝えられます。`disabled:` クラスと、track および thumb のそれらが、`checked:` のクラスより優先して適用されます。

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

## A small target with hitSlop

ラベルのないスイッチは、指よりも小さくなることがあります。`hitSlop` を使うと、レイアウトや見た目を変えずに、スイッチの近くで行われたプレスも有効になります。範囲は各辺の外側へのポイント単位で指定し、すべての辺に同じ数値を指定するか、辺ごとに名前を付けて指定します(`{ top: 8, bottom: 8 }`)。[view の `hitSlop`](./index.md#presses-and-feedback) と同じ指定方法です。

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

## Accessibility

- スイッチはスクリーンリーダーにとって 1 つの要素であり、ロールは `"switch"`、値はオンまたはオフです。track と thumb はその一部です。ラベルは子要素のテキストです。子要素にテキストがない場合は `accessibilityLabel` を指定してください。
- `disabled` は、各プラットフォームの方法で読み上げられます(VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー)。
- macOS とウェブでは、スイッチはキーボードフォーカスの停止位置になります。Tab で移動でき、Space と Return で切り替えられ、`focus:` スタイルでフォーカスの位置が示されます。

ラベル、ロール、読み上げ全般については、[Accessibility](../docs/accessibility.md) を参照してください。

## Platform notes

- iOS、Android、Mac Catalyst: プレスとは、ラベルを含むスイッチ上で終了するタップです。
- デスクトップ(macOS、Windows、Linux、GPUI)とウェブ: プレスとはクリックです。macOS とウェブでは、Space と Return でも、キーボードフォーカスのあるスイッチを切り替えられます。
- すべてのプラットフォームで、アプリがスタイル指定した内容が描画されます。thumb は、アプリのスタイルとトランジションに従って動きます。
