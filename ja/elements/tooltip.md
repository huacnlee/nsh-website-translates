---
title: "Tooltip"
description: "Tooltip コンポーネント: 配置された要素に関するヒントを、デスクトップ上でポインターがその要素に留まったときに表示します。スタイルはアプリ側で設定できます。"
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# Tooltip

Tooltip は、対象の隣に表示される短いヒントです。アイコンボタンの機能や、切り詰められたラベルの全文などを示します。
デスクトップおよびデスクトップブラウザーでは、ポインターがトリガー上で `delay`(500 ms)静止すると表示され、
ポインターがトリガーから離れるか、トリガーを押すと非表示になります。スマートフォンとタブレットでは、アプリが開いたときにのみ
tooltip を表示します(`open`)。tooltip がポインターやプレスを奪うことはないため、トリガーは tooltip がない場合とまったく同じように動作します。

[`nsh/base`](../modules/nsh-base.md) の `Tooltip` は、すべての要素が持つ `tooltip` プロパティ
([共通プロパティ](index.md#tooltips))として、GPUI の `.tooltip(..)` と同様に渡します。この要素が、ポインターが静止する対象であり、tooltip を配置する基準になります。
tooltip 自体は吹き出しです。スタイルは `class` / `style` で指定し、その子要素が tooltip の内容になります。

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

tooltip はデフォルトでトリガーの上に表示され(`placement`)、スペースがない場合は反対側に表示され、セーフエリアの内側に収まります。
`open` を使うと、表示するタイミングをアプリが決定します。tooltip は、ポインターがトリガー上で静止したこと、またはトリガーから離れたことを通知する `onOpenChange` に従い、どのデバイスでも表示できます。

tooltip は、トランジションに合わせて表示と非表示が切り替わります。`startingClass` は最初のフレームでの見た目、`endingClass` は非表示になった後の見た目で、
`class` の `transition-*` クラスが実行されている間はその状態が維持されます。続いて `onClose` が適用されます。

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | なし | 表示する内容。 |
| `class`, `style` | `.app_class(..)`, `Styled` メソッド | `string`, `StyleProp<ViewStyle>` | なし | 吹き出し(tooltip 自体)の見た目。 |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 最初のフレームでの見た目。トランジションはここから始まります。 |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 非表示になった後の見た目。トランジションが実行されている間は維持されます。 |
| `open` | `.open(..)` | `boolean` | なし | 表示状態。アプリが制御します。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 最初から表示します(`open` なし)。 |
| `delay` | `.delay(..)` | `number` | `500` | 表示されるまでにポインターがトリガー上で静止するミリ秒数。`Infinity`: 自動では表示されず、アプリが開いたときのみ表示されます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 表示されません。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | トリガーのどちら側に配置するか。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | その辺に沿ったトリガーとの揃え方。 |
| `offset` | `.offset(..)` | `number` | `4` | トリガーと tooltip の間隔。 |
| `margin` | `.margin(..)` | `number` | `4` | セーフエリアの端から保つ距離。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | ポインターがトリガー上で静止した、またはトリガーから離れた、もしくはトリガーを押した(`reason` `"hover"`)。 |
| `onOpen` | `.on_open(\|\| ..)` | 表示された。 |
| `onClose` | `.on_close(\|\| ..)` | 終了トランジションの後で非表示になった。アプリが非表示にした場合も発生します。 |

<a id="accessibility"></a>

## アクセシビリティ

tooltip は、トリガーが伝える内容をスクリーンリーダーに対して繰り返します。トリガーにも `accessibilityLabel` を指定して、
ヒントがすべてのユーザーに届くようにしてください。
