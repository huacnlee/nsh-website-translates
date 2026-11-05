---
title: "Overlay"
description: "Overlay 要素: 親が何でクリップされていても画面の最前面にコンテンツを表示します。固定ボックスとしてレイアウトすることも、追従するアンカーを基準に配置することもでき、外側でのプレスや Escape も通知されます。"
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

Overlay は、それが属するルートビュー(ウィンドウ、またはその周囲のダイアログ)内で、すべての要素の上に子要素を表示します。親のサイズ、`overflow: hidden`、スクロールビューによってクリップされることはありません。それ以外の点では、記述した位置に留まります。周囲のコンテキストを読み取り、ハンドラーはそのコンポーネントのものであり、親が消えると一緒に消えます。Popover、メニュー、ツールチップ、シートは Overlay を土台に作られています。[`nsh/base`](../modules/nsh-base.md) にはそれらが用意されており([Popover](./popover.md)、[Menu](./menu.md)、[Tooltip](./tooltip.md)、[Sheet](./sheet.md))、独自のものを作るときに使うのが Overlay です。

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

TSX では `Overlay` は `nsh` から、Rust では `overlay()` は `nsh_core::prelude` から提供されます。Overlay はビューの中にある間だけ表示されます。開閉するには `If`(Rust では `when(..)`)の中に置きます。後から表示された Overlay は先に表示されたものの上に重なり、別の Overlay の内側にある Overlay はその上に重なります。

<a id="placement"></a>

## 配置

`anchor` がない場合、Overlay はルートビューの `position: fixed` ボックスとしてレイアウトされます。`top`、`left`、`inset`、サイズ、マージンは、ウィンドウ(またはダイアログ)全体を基準にします。`class="inset-0"` は全体を覆うので、バックドロップやウィンドウ全面のレイヤーになります。`class="bottom-0 left-0 right-0"` は下端に沿ったバーです。

`anchor` を指定すると、NSH はアンカーの隣に Overlay を配置します。

- `anchor` には、ビュー(`ref`)、ルートビューの座標系における `Point`(`{ x, y }`)、タッチの `pageX` / `pageY`(ポインターの位置にメニューを出す場合)、またはそこにある `Bounds`(`{ origin, size }`)を指定できます。最後のものは入力欄のキャレット(`onCaretMove` の `pageBounds`)で、入力中の内容に対する候補が開く位置になります。
- `placement` は配置する側で、`"top"`、`"bottom"`(デフォルト)、`"left"`、`"right"` のいずれかです。その側に収まらず反対側に収まる場合は反対側に配置されます。どちらにも収まらない場合は、より余裕のある側に配置されます。
- `align` は、その側に沿った揃え方で、`"start"`、`"center"`(デフォルト)、`"end"` のいずれかです。アンカーの上または下では、start と end はレイアウト方向に従います。start は左端、右から左へのレイアウトでは右端です。
- `offset` はアンカーと Overlay の間の隙間です。`margin` は Overlay がセーフエリアの端から保つ距離で、Overlay はセーフエリアの内側に留まり、収まるようにその側に沿ってスライドします。

アンカー付きの Overlay はアンカーに追従します。アンカーがスクロール、移動、またはサイズ変更されると、NSH がレイアウトを行う同じフレームで Overlay も一緒に動きます。`onPosition` は Overlay が配置された場所を伝えるため、矢印でアンカーを指したり、長いメニューの高さを制限したりできます。

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## 閉じる

Overlay は、ポップアップを閉じる一般的な操作を通知するだけで、閉じるかどうかの判断は開発者に任せます。

- `onPressOutside` は、Overlay、そのアンカー、およびその内側の Overlay の外側で、指またはマウスボタンが押されたときに発火します。押下は、その下にある要素にそのまま伝わります。
- `onCancel` は、Escape、Android の戻るボタン、iOS の VoiceOver のエスケープジェスチャーで発火し、これを受け取るのは最上位の Overlay だけです。ページや `BackHandler` より先に受け取ります。

ポップアップの背後の画面をブロックするには、その下に `class="inset-0"` を指定した2つ目の Overlay を置き、両方を閉じる `onPress` を設定します。[Sheet](./sheet.md) や [Popover](./popover.md) のスマートフォン向け表示は、この方法で動いています。

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | なし | 配置の基準となるビュー、ポイント、またはボックス。指定しない場合は、ルートビューに対する固定ボックスになります。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | アンカーに対して配置する側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | その側に沿ったアンカーとの揃え方。 |
| `offset` | `.offset(px(..))` | `number` | `0` | アンカーと Overlay の間の隙間。 |
| `margin` | `.margin(px(..))` | `number` | `0` | セーフエリアの端から保つ距離。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 表示する内容。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | 見た目と、アンカーがない場合の位置。 |

ビューの[共通 props](./index.md#common-props)も使用できます。

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Overlay、そのアンカー、およびその内側の Overlay(`pagePosition`、`Point`)の外側で押下が発生した。 |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape、Android の戻るボタン、または VoiceOver のエスケープジェスチャー。対象の Overlay が、これらを受け取る最上位の Overlay である場合に発生します。 |
| `onPosition` | `.on_position(\|position\| ..)` | NSH が配置を行った。`placement`(配置された側)、ルートビューにおける `bounds`、`available`(`Size`:その側の余白)を含みます。 |

<a id="platform-notes"></a>

## プラットフォームに関する注意

- どのプラットフォームでも、Overlay はウィンドウ(またはダイアログ)のルートビューのネイティブビューとして表示され、周囲のビューと同じように描画およびヒットテストが行われます。対象は UIKit、Android views、AppKit、GTK、Win32、GPUI、DOM です。
- [Dialog](./dialog.md) の内側にある Overlay は、そのダイアログ内でコンテンツの上に表示されます。
- Overlay はウィンドウの外には出ません。ウィンドウの端からはみ出すメニューは、内側に戻るようにスライドします。
