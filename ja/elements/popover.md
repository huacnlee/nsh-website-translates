---
title: "Popover"
description: "Popover コンポーネント: トリガーに固定され、すべての要素の最前面に表示されるコンテンツです。トリガー、外側のタップ、Escape キー、戻る操作で閉じることができ、スタイルはアプリ側で指定します。"
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

Popover は、トリガーの隣に、他のすべての要素の上に重ねてコンテンツを表示します。詳細、小さなフォーム、カラーピッカーなどに使えます。トリガーを押すと開閉し、外側の押下、Escape、Android の戻るボタン、VoiceOver のエスケープジェスチャで閉じます。トリガーのいずれかの辺に配置され、スペースが足りなければ反対側に移動し、セーフエリア内に収まり、スクロールに合わせてトリガーに追従します。Popover 自体は何も描画しません。ポップアップとその内容はアプリ側のものです。

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` は [`nsh/base`](../modules/nsh-base.md) から提供されます。コンテンツは開くたびに作り直されるため、その内部の状態は毎回初期状態から始まります。

<a id="open-state"></a>

## 開閉状態

`open` を指定しない場合、Popover は自身で状態を保持し、`defaultOpen` から始まります。`open` を指定した場合は、アプリが状態を所有し、`onOpenChange({ open, reason })` の中で変更します。このコールバックは、開閉のリクエストのたびに、その理由（`"triggerPress"`、`"pressOutside"`、`"cancel"`）とともに呼ばれます。

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` を指定すると、Escape と戻るボタンでは閉じなくなります（`onCancel` には引き続き通知されるため、閉じる前に確認できます）。`closeOnPressOutside={false}` を指定すると、外側の押下では閉じなくなります。

<a id="phones-and-desktops"></a>

## スマートフォンとデスクトップ

Popover はどのデバイスでもトリガーに固定されます。表示する内容は、それを開いた要素の隣にあるべきだからです。

- デスクトップとデスクトップブラウザでは、外側の押下で閉じたあと、その押下はポインターの下にある要素にも渡されます。そのため、1 回のクリックで Popover を閉じると同時に、クリックした先のボタンも押されます。
- スマートフォンとタブレットでは、外側の押下は閉じるだけです。システムの Popover と同様に、透明なバックドロップが押下を受け取ります。

アクションの一覧には [Menu](./menu.md) を使ってください。スマートフォンではシートになります。パネルには [Sheet](./sheet.md) を使ってください。

<a id="entrance-and-exit"></a>

## 表示と非表示のアニメーション

Popover は、アプリで定義したトランジションに合わせて現れ、消えます。`popupStartingClass` は最初のフレームでのポップアップの見た目で、`popupClass` の `transition-*` クラスがそれをポップアップ本来の見た目へと遷移させます。これが表示時のアニメーションです。`popupEndingClass` は閉じたあとの見た目です。これらのトランジションが実行されている間、Popover は残りますが押下は受け付けず、その後に消え、続いて `onClose` が呼ばれます。消えている途中で再び開かれた場合は、その時点の見た目から元に戻ります。`popupStartingStyle` と `popupEndingStyle` はインラインスタイルで同じことを行います。ユーザーがモーションの軽減を求めている場合は、即座に表示され、即座に消えます。

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` は、ポップアップがどこに配置されたかを示します。トリガーのどちらの辺か（`placement` に十分なスペースがなかった場合は反対側）、そのフレーム、その辺の余白です。これを使って、矢印や表示アニメーションをトリガーに向けることができます。

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | なし | 開閉状態。アプリが制御します。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 最初から開いているかどうか。`open` を指定しない場合に使います。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | トリガーのどの辺に配置するか。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | その辺に沿って、トリガーとどう揃えるか。 |
| `offset` | `.offset(..)` | `number` | `0` | トリガーとポップアップの間隔。 |
| `margin` | `.margin(..)` | `number` | `0` | セーフエリアの端から保つ距離。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape と Android の戻るボタンで閉じるかどうか。 |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | 外側の押下で閉じるかどうか。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | ポップアップ、つまりコンテンツを収めるボックスの見た目。 |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 最初のフレームでのポップアップの見た目。本来の見た目に重ねて適用され、トランジションはここから始まります。 |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 閉じたあとのポップアップの見た目。本来の見た目に重ねて適用され、トランジションの実行中は残ります。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | なし | Popover を開く要素。配置の基準になります。Popover が開いている間は、その `aria-expanded:` クラスと `expandedStyle` が適用されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | コンテンツ。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 開いた、または閉じた。理由は `"triggerPress"`、`"pressOutside"`、`"cancel"` のいずれかです。 |
| `onOpen` | `.on_open(\|\| ..)` | 表示された。 |
| `onClose` | `.on_close(\|\| ..)` | 終了アニメーションのあとで消えた。アプリが閉じた場合も呼ばれます。 |
| `onCancel` | `.on_cancel(\|\| ..)` | ユーザーが閉じようとした（Escape や戻るボタン、外側の押下）。実際に閉じたかどうかにかかわらず呼ばれます。 |
| `onPosition` | `.on_position(\|e\| ..)` | ポップアップが配置された。`placement`（配置された辺）、`bounds`（そのフレーム）、`available`（その辺の余白）が渡されます。 |

<a id="accessibility"></a>

## アクセシビリティ

トリガーは、Popover が展開されているかどうかをスクリーンリーダーに伝えます。Escape と戻るボタンは、ユーザーがポップアップに期待するとおりに Popover を閉じます。TSX では、トリガーは渡した要素で、`Button` や独自のビューが使えます。この要素が押下と展開状態を自身で受け取るため、押されている間はその要素自身の `active:` クラスと `activeStyle` が適用され、その要素自身の `onPress` も実行されます。
