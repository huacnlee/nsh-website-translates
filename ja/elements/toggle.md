---
title: "Toggle"
description: "Toggle と ToggleGroup:オンとオフを切り替えるボタン、およびそれらをまとめたツールバー。各 Toggle は、プレス操作、キーボードによる操作、無効状態、そしてスクリーンリーダー向けのロールと押下状態を管理します。ToggleGroup はキーボードフォーカスの停止位置を 1 つだけ持つツールバーです。見た目やどの Toggle が押下状態になるかはアプリ側で決定します。"
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

Toggle は、オンまたはオフの状態を保つボタンです。テキストツールバーの太字、お気に入りの星、表示オプションなどに使います。`Toggle` は、押下、キーボードによる操作、無効状態、そしてスクリーンリーダーがトグルボタンとして読み上げるための、押下状態を持つボタンロールといった、トグルの振る舞いを受け持ちます。複数のトグルを `ToggleGroup` で囲むとツールバーになります。スクリーンリーダーはそれを 1 つのツールバーとして読み上げ、キーボードでは 1 回のフォーカスで到達でき、矢印キーでトグル間を移動できます。見た目はアプリ側が決めます。トグル自体には、色、サイズ、アイコン、ラベルはありません。子要素はアプリ側のアイコンやラベルで、トグルに付けた `aria-pressed:` クラスや、その内側の要素に付けた `group-aria-pressed:` クラスが、トグルの状態に追従します。

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` と `ToggleGroup` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に含まれています。値はアプリ側が持ちます。各トグルには押下状態が渡され、押下すると、トグルが求める値が `onChange` で通知され、トグルはアプリが返した `pressed` を表示します。グループも値を持たないため、同時に押下状態にできるトグルの数もアプリ側で決まります。任意の数（太字、斜体、下線）にすることも、ちょうど 1 つ（配置、ビューの切り替え）にすることもできます。後者では、アプリが求められたトグルを押下状態にし、ほかのトグルを解除し、押下状態のトグルは押下状態のままにします。Rust では、`toggle()` と `toggle_group()` でこれらを作成します。プロパティごとのセッター（`.pressed(..)`）、イベントごとのリスナー（`.on_change(..)`）、型付きのスタイルメソッド、そして内容を指定する `.child(..)` が用意されています。

<a id="props"></a>

## プロパティ

<a id="toggle-1"></a>

### Toggle

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | オンまたはオフ。スクリーンリーダーは押下状態と読み上げ、`aria-pressed:` スタイルが適用されます。押下すると、反対の値が `onChange` で通知されます。トグルは、アプリが返した値を表示します。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下を受け付けず、押下フィードバックもありません。`disabled:` スタイルが適用され、スクリーンリーダーは減光状態と読み上げます。無効な `ToggleGroup` の中のトグルも無効になります。 |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | 押下状態かつ無効でないときのトグルのスタイル。`aria-pressed:` クラスで指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが読み上げる内容。子要素に内容を表すテキストがない場合（アイコンなど）に、トグルが何をオンにするかを示します。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | なし | 境界の外側で、どこまで押下として扱うか（単位はポイント）。全辺に対する 1 つの数値、または辺ごとの指定ができます。ビューの `hitSlop` と同じです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アプリ側のアイコンまたはラベル。スクリーンリーダーが読み上げます。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | トグル自体。内容を囲むサーフェスです。 |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下の進行中、ホバー中、フォーカス中、無効のときのトグルのスタイル。`<state>:` クラスで指定します。 |

### ToggleGroup

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | グループ内のすべてのトグルを、それぞれの `disabled` に関係なく無効にします。 |
| `children` | `.child(..)` | `JSX.Element` | なし | グループのトグルと、その間にアプリが配置するもの（区切り線など）。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | グループのレイアウトと見た目。デフォルトは縦並びで、横並びにするには `flex-row` を使います。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | トグルが押下されました。タップ、クリック、キーボードフォーカス中の Space または Return、スクリーンリーダーによる操作が該当します。`{ pressed }` はトグルが求める値で、`pressed` の反対です。何かが変わる前に実行され、トグルはアプリが返した `pressed` を表示します。 |

`ToggleGroup` の矢印キーはキーボードフォーカスを移動するだけで、何も押下しません。無効なトグルは何も通知しません。

<a id="parts"></a>

## パーツ

| パーツ | 配置場所 | スタイルの指定 | 状態 |
|---|---|---|---|
| グループ | | `ToggleGroup` の `class`, `style` | |
| トグル | グループの中、またはどこでも | `Toggle` の `class`, `style` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:`（または `pressedStyle`, `disabledStyle`, ...） |
| アイコンまたはラベル | トグルの中 | それ自身の要素（`children`） | トグルの `class` に `group` を付けた `group-aria-pressed:`, `group-disabled:` などの `group-*:` バリアント |

`aria-pressed:` はトグルがオンの状態、`active:` はオンかオフかを問わず押下が進行中の状態です。押下状態のトグルは、塗りつぶし、浮き上がったピル、強調したアイコンなど、トグル自身のサーフェスで示してください（[デザインガイド](../docs/design-guides.md#interaction-states)を参照）。

## Segmented

トグルを連結し、一度に 1 つだけを押下状態にするグループは、セグメントコントロール（ビューの切り替え）です。アプリが 1 つの値を保持し、その値に対応するトグルを押下状態にします。連結した見た目は、アプリのクラスで作ります。

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

## Disabled

無効なトグルは押下を受け付けず、スクリーンリーダーは減光状態と読み上げます。その `disabled:` クラスは `aria-pressed:` クラスより優先して適用され、内側の `group-disabled:` クラスも追従します。`ToggleGroup` に `disabled` を指定すると、その中のすべてのトグルが無効になります。アプリがロックしたツールバーがその例です。

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop で小さなターゲットを扱う

アイコンのトグルは、指より小さくなることがあります。`hitSlop` を使うと、レイアウトや見た目を変えずに、トグルの近くで行われた押下を有効にできます。単位は各辺の外側へのポイントで、全辺に対する 1 つの数値、または辺ごとの指定（`{ top: 8, bottom: 8 }`）ができます。これは[ビューの `hitSlop`](./index.md#presses-and-feedback)と同じ指定方法です。

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## アクセシビリティ

- トグルは、スクリーンリーダーにとって 1 つの要素で、ロールは `"button"` で、押下状態を持ちます。つまりトグルボタンです。ラベルは、子要素のテキスト、または `accessibilityLabel` です。
- `ToggleGroup` のロールは `"toolbar"` です。スクリーンリーダーは、内側のトグルを 1 つのツールバーとして読み上げ、各トグルはそれぞれ独立した要素のままです。
- `disabled` は、各プラットフォームの方式で読み上げられます（VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー）。
- macOS と web では、グループはキーボードフォーカスの 1 つの停止位置になり、矢印キーでトグル間を移動します（下記参照）。

ラベル、ロール、読み上げ全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="keyboard"></a>

## キーボード

macOS と web では、Tab で押下を受け付けるビューに到達でき、`ToggleGroup` は [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) に従います。

| キー | 動作 |
|---|---|
| Tab, Shift+Tab | 押下状態の最初のトグルでグループに入ります（押下状態のものがなければ、無効でない最初のトグル）。1 回の操作でグループから出ます。 |
| Right, Down | フォーカスを次のトグルに移動します。最後のトグルからは最初に戻ります。 |
| Left, Up | フォーカスを前のトグルに移動します。最初のトグルからは最後に移動します。 |
| Home, End | フォーカスを最初または最後のトグルに移動します。 |
| Space, Return | フォーカス中のトグルを押下します。 |

矢印キーは無効なトグルを飛ばし、何も押下しません。トグルが変わるのは、押下されたときだけです。グループのレイアウトはアプリのクラスで決まりますが、それに関係なく、2 組の矢印キーのどちらでも移動できます。右から左へ進むレイアウトでは、Left と Right の役割が入れ替わります。Left が次のトグルへ、Right が前のトグルへ移動し、Up、Down、Home、End は変わりません。`focus:` スタイルがフォーカスの位置を示します。`ToggleGroup` の外にある `Toggle` は、それ自身が独立した停止位置になります。

<a id="platform-notes"></a>

## プラットフォームの補足

- iOS、Android、Mac Catalyst: 押下は、内容を含むトグル上で終わるタップです。
- デスクトップ（macOS、Windows、Linux、GPUI）と web: 押下はクリックです。macOS と web では、Space と Return でキーボードフォーカス中のトグルも押下でき、矢印キー、Home、End でフォーカスを移動できます（[キーボード](#keyboard)）。
- どのプラットフォームでも、アプリがスタイル指定したものが描画されます。トグル、押下状態のトグルのサーフェス、グループのトラックが該当します。
