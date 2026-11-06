---
title: "Radio"
description: "Radio と RadioGroup: ユーザーが選択肢の中からちょうど1つを選ぶためのコンポーネントです。各 Radio は、押下、キーボードによる操作、無効状態、およびスクリーンリーダー向けのロールとチェック状態を管理します。RadioGroup は Radio の集合を表し、見た目と値はアプリ側が決定します。"
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

Radio は、ユーザーがちょうど 1 つだけ選ぶ選択肢の集合を提供します。たとえばプラン、並び順、テーマなどです。各 `Radio` は 1 つの選択肢の動作を担います。具体的には、押下、キーボードによる操作、無効状態、そしてスクリーンリーダー向けの radio ロールとそのチェック状態です。それらを囲む `RadioGroup` が集合となり、スクリーンリーダーは 1 つのグループとして読み上げます。見た目はアプリ側のものです。radio 自身には円、ドット、色、サイズ、ラベルがありません。その子要素がアプリ側のインジケーターとラベルであり、radio 上の `checked:` クラス、またはその内側にある要素の `group-checked:` クラスが radio の状態に追従します。

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` と `RadioGroup` は [`nsh/base`](../modules/nsh-base.md) から提供されます。これは Rust の `nsh-base` クレートです。値はアプリが持ち、グループは値を保持しません。各 radio にはチェックされているかどうかが渡されます。チェックされていない radio を押すと `onChange({ checked: true })` が通知され、アプリが値を設定し、すべての radio はアプリが返した `checked` を表示します。Rust では、`radio()` と `radio_group()` でそれらを作成します。prop ごとのセッター（`.checked(..)`）、イベントごとのリスナー（`.on_change(..)`）、型付きのスタイルメソッド、そして内容を渡す `.child(..)` を利用できます。

## Props

<a id="radio-1"></a>

### Radio

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | チェックされているかどうか。チェックされていない radio を押すと、`onChange` とともに `true` が通知されます。radio はアプリが返した値を表示します。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下も押下フィードバックも行われません。`disabled:` スタイルが適用され、スクリーンリーダーは薄く表示されている（dimmed）と読み上げます。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | チェックされていて、かつ無効でないときの radio のスタイル。`checked:` クラスで指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが読み上げる内容。子要素に選択肢を示すテキストがない場合に、その選択肢を表します。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | なし | 境界の外側どこまでの押下を有効とみなすか（ポイント単位）。すべての辺に共通の数値、または辺ごとの指定ができます。view の `hitSlop` と同じです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アプリ側のインジケーターとラベル。スクリーンリーダーはこれを読み上げます。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | radio 自身。インジケーターとラベルを囲む行です。 |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下中、ホバー中、フォーカス中、無効のときの radio のスタイル。`<state>:` クラスで指定します。 |

### RadioGroup

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | なし | 集合に含まれる radio と、その間にアプリが配置する任意の要素。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | グループのレイアウトと見た目。デフォルトは縦並びで、横並びにするには `flex-row` を使います。 |

## Events

| Event | Rust | Description |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | チェックされていない radio が押されました。タップ、クリック、キーボードフォーカスがある状態での Space または Return、スクリーンリーダーによる操作、あるいはグループ内の矢印キーによるキーボードフォーカスの移動が該当します。チェックを要求するため、`checked` は `true` です。何かが変わる前に実行され、radio はアプリが返した `checked` を表示します。 |

チェックされている radio はチェックされたままで、何も通知しません。radio 自身はチェックを外せないためです。無効な radio も何も通知しません。

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| グループ | | `RadioGroup` の `class`, `style` | |
| radio | グループ | `Radio` の `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:`（または `checkedStyle`, `disabledStyle`, ...） |
| インジケーターとラベル | radio | それぞれの要素（`children`） | radio の `class` に `group` を指定した上での `group-checked:`, `group-disabled:` およびその他の `group-*:` バリアント |

インジケーターはアプリ側のコンテンツです。ドット付きのリング、チェックマーク、ハイライトされたカードなどが考えられます。radio の `class` に `group` を指定すると、その `group-checked:` クラスにより、radio がチェックされている間ドットが表示されます。

## Disabled

無効な radio は押下を受け付けず、スクリーンリーダーは薄く表示されている（dimmed）と読み上げます。その `disabled:` クラスは `checked:` クラスより優先して適用され、内側の `group-disabled:` クラスもそれに追従します。

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

## A small target with hitSlop

横にラベルがない radio（テーブルの行にあるドットなど）は、指よりも小さくなることがあります。`hitSlop` を使うと、レイアウトや見た目を変えずに、近くに触れた押下を有効にできます。範囲は各辺の外側へのポイント数で指定し、すべての辺に共通の数値、または辺ごとの指定（`{ top: 8, bottom: 8 }`）が使えます。これは [view の `hitSlop`](./index.md#presses-and-feedback) と同じ形式です。

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

## Accessibility

- radio は、スクリーンリーダーにとって 1 つの要素であり、ロールは `"radio"` です。状態として、チェックされているかどうかと、チェック中は selected であることが伝わります。スクリーンリーダーによって読み上げるのがどちらか異なるためです（UI Automation の radio は selection item です）。インジケーターとラベルはその一部です。ラベルは子要素のテキスト、または `accessibilityLabel` です。
- `RadioGroup` のロールは `"radiogroup"` です。スクリーンリーダーは内側の radio を 1 つの集合として読み上げますが、各 radio は引き続き個別の要素です。
- `disabled` は、各プラットフォームの方法で読み上げられます（VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー）。
- macOS とウェブでは、`RadioGroup` はキーボードフォーカスの 1 つの停止位置であり、矢印キーで radio 間を移動してチェックできます（下記参照）。

ラベル、ロール、読み上げ全般については [Accessibility](../docs/accessibility.md) を参照してください。

## Keyboard

Tab で押下を受け付ける view に移動できる macOS とウェブでは、`RadioGroup` は [WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) に従います。

| Key | What it does |
|---|---|
| Tab, Shift+Tab | チェックされている radio（どれもチェックされていない場合は、無効でない最初の radio）からグループに入り、1 回の操作でグループを出ます。 |
| Down, Right | フォーカスを次の radio に移動し、チェックします。最後の radio からは最初に戻ります。 |
| Up, Left | フォーカスを前の radio に移動し、チェックします。最初の radio からは最後に移動します。 |
| Space | フォーカスされている radio をチェックします。 |

矢印キーは無効な radio をスキップします。移動先の radio は `onChange` でチェックを要求し、アプリがチェックします。右から左へのレイアウトでは Left と Right の役割が入れ替わり、Left が次の radio、Right が前の radio へ移動します。Up と Down は変わりません。`focus:` スタイルでフォーカスの位置が分かります。`RadioGroup` の外にある `Radio` はそれ単独の停止位置となり、Tab で到達でき、Space と Return でチェックされます。

## Platform notes

- iOS、Android、Mac Catalyst: 押下とは、ラベルを含む radio 上で終わるタップです。
- デスクトップ（macOS、Windows、Linux、GPUI）とウェブ: 押下とはクリックです。macOS とウェブでは、Space と Return でもキーボードフォーカスのある radio をチェックでき、矢印キーでフォーカスを移動できます（[Keyboard](#keyboard)）。
- すべてのプラットフォームで、アプリがスタイル指定したもの（インジケーター、ラベル、およびそのトランジション）が描画されます。
