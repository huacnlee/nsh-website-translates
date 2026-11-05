---
title: "Sheet"
description: "Sheet コンポーネント:バックドロップの上で画面の端に表示されるパネル。バックドロップ、Escape、戻る操作で閉じられ、スタイルはアプリ側で指定します。"
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---

# Sheet

シートは、画面の端に表示されるパネルで、残りの部分を覆うバックドロップの上に重なります。フィルター、共有パネル、サイドドロワーなどに使います。バックドロップへのプレス、Escape、Android の戻るボタン、VoiceOver のエスケープジェスチャーで閉じます。シートはウィンドウ内のすべての要素の最前面に表示され、どのデバイスでも同じように動作します。シート自体は何も描画しません。パネルとバックドロップはアプリ側で用意します。

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` は [`nsh/base`](../modules/nsh-base.md) から提供されます。コンテンツは開くたびに作成されます。`side` は、シートを画面の `"bottom"`(デフォルト)または `"top"` に画面幅いっぱいで配置するか、`"left"` または `"right"` に画面の高さいっぱいで配置します。横断方向のサイズはパネル自身のもので、コンテンツまたは `popupClass` によって決まります。

スライドは、表示アニメーション中にコンテンツが作成されたり大きくなったりしても、パネルの計測サイズに追従します。遅延コンテンツと非同期のサイズ更新は同じアニメーションの進行を共有し、パネルは現在のサイズに落ち着きます。

## Open state

`open` がない場合、シートは自身の状態を保持し、`defaultOpen` から始まります。`open` を指定すると、状態はアプリが所有します。閉じる要求は理由(`"backdropPress"`、`"cancel"`、`"swipe"`)とともに `onOpenChange({ open, reason })` に通知されるので、その中で状態を変更します。`onOpen` と `onClose` は、誰が開閉したかにかかわらず、その開閉に追従します。

`closeOnEscape={false}` は Escape と戻る操作で開いたままにし、`closeOnBackdropPress={false}` はバックドロップへのプレスで開いたままにします。`onCancel` は、事前に確認できるよう、これらの操作を引き続き受け取ります。

## Dragging a bottom sheet

`closeOnSwipe` を設定すると、下部のパネルが下方向へのドラッグに追従します。バックドロップは距離に応じてフェードします。パネルの高さの 30% を超えて離すか、毎秒 800 ポイントを超える速さで下方向に離すと、理由 `"swipe"` で閉じる要求が出されます。それより短いドラッグでは、滑らかに元の位置に戻ります。制御されたオーナーは、閉じる要求の後にパネルを元に戻すために `open` を true のままにしておくことができます。モーション軽減が有効な場合、指を離したときとプログラムによる開閉は即座に確定します。直接のドラッグは引き続き指に追従します。

パネルは、短いメニューも含め、コンテンツに合わせたサイズになります。背の高いコンテンツを制限するには、`popupStyle` または子の高さを使います。ハンドルはアプリ側で描画し、パネル内の任意のビューにできます。iOS では、内側の縦方向の `Scroll` または `List` は、先頭に達するまでドラッグを消費し、残りの下方向の動きを同じジェスチャー内でパネルに引き渡します。Android、デスクトップ、Web では、スクロール外のハンドルやコンテンツをドラッグすると、各プラットフォームのネイティブなパンのサポートが使われます。内側のスクロールは、そのプラットフォーム標準のジェスチャー調停に従います。`closeOnSwipe` を false に設定すると、パネルは動かず、マウントされたコンテンツとスクロール位置が保持されます。ほかの辺では、従来の動作が維持されます。

## Native sheets

シートは NSH がアプリのウィンドウ内に描画し、スタイルはアプリが決めます。プラットフォーム自身が表示するシート(iOS のページシート)を使うには、`presentation="pageSheet"` を指定した [Dialog](./dialog.md) を使用してください。

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | なし | 開いているかどうか。アプリが制御します。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 最初から開いている状態にします。`open` がない場合に使います。 |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 配置される辺。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape と Android の戻るボタンで閉じます。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | バックドロップへのプレスで閉じます。 |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | 下部のパネルが下方向へのドラッグに追従し、十分な距離で離すと閉じます。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | パネルの見た目。 |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | バックドロップの見た目(半透明の色など)。 |
| `children` | `.child(..)` | `JSX.Element` | なし | コンテンツ。 |

## Events

| Event | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 閉じる要求。理由は `"backdropPress"`、`"cancel"`、`"swipe"` のいずれかです。 |
| `onOpen` | `.on_open(\|\| ..)` | 表示が完了し、すべてが表示された状態です。 |
| `onClose` | `.on_close(\|\| ..)` | 非表示が完了し、すべてが消えた状態です。アプリが閉じた場合にも発生します。 |
| `onCancel` | `.on_cancel(\|\| ..)` | ユーザーが閉じようとした操作(Escape または戻る、バックドロップへのプレス、有効なスワイプ)。実際に閉じたかどうかにかかわらず発生します。 |

Web では、`dialogs: "viewport"` で埋め込むと、same-origin の iframe を含め、ホストページの上にシートとそのバックドロップが表示されます。クロスオリジンのフレームには [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page) を使用します。
