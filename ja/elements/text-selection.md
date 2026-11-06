---
title: "テキスト選択"
description: "選択可能なビュー: Webページのテキストが選択できるのと同じように、ビュー内のテキスト、ビュー間、Text要素、TextViewにまたがる単一の選択を実現します。"
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# テキスト選択

`selectable` を指定した [`View`](./view.md) は、Web ページと同じように、その内部のテキストをまとめて選択できるようにします。1 つの選択が、あるテキストの途中から別のテキストの途中まで、ビュー、[`Text`](./text.md) 要素、[`TextView`](./text-view.md) をまたいで読み順に続きます。チャットの会話履歴を選択可能にすれば、選択をあるメッセージで始めて次のメッセージで終えることができます。コピーすると選択したテキストがクリップボードに入り、横に並んだテキストはタブで、それ以外は改行で区切られます。Rust では `view().selectable(true)`、TSX では `<View selectable>` で設定します。単一のテキストを選択できるかどうかは、その `userSelect` スタイルで決まります。

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

ビューのレイアウトと見た目はアプリのスタイルによるもので、その内容は子要素です。選択そのものはプラットフォームが担い、ビューが選択のために独自に描画するものはありません。

<a id="a-chat-transcript"></a>

## チャットの会話履歴

1 つの選択可能なビューに入れた会話履歴は、1 つのページとして選択されます。ドラッグをある返信で始めて別の返信で終えると、コピーでその間にあるすべてのメッセージのテキストが取得されます。

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## 選択の方法

| プラットフォーム | 選択の方法 |
|---|---|
| macOS, Windows, Linux, GPUI | テキスト上をドラッグします。ダブルクリックで単語、トリプルクリックで段落を選択でき、その後のドラッグは単語単位または段落単位で続きます。Shift+クリックで選択範囲を拡張できます。Ctrl / Cmd+A でビュー内のすべてを選択、Ctrl / Cmd+C でコピー、Escape または外側のクリックで選択を解除します。 |
| iOS, Android | 長押しで単語を選択します。プラットフォームのハンドルで選択範囲を拡張でき、編集メニューにはコピーとすべてを選択があります。 |
| Web | ブラウザー標準の選択機能で、そのジェスチャー、メニュー、ショートカットがそのまま使えます。 |

<a id="what-it-selects"></a>

## 選択の対象

- **対象外のテキスト**: `userSelect: "none"`(Rust では `.select_none()`、クラスでは `select-none`)を持つテキスト(ラベルやボタンのキャプションなど)は、選択とそのジェスチャーの対象になりません。
- **ネストしたビュー**: 選択可能なビューの内側にある選択可能なビューは外側のビューの一部として扱われ、1 つの選択が両方にまたがります。
- **TextView**: `selectable` を指定した [`TextView`](./text-view.md) は、それ自体で 1 つのまとまりとして選択されます。段落、リスト項目、セル、コードブロックがまとめて選択されます。選択可能なビューの内側にある場合は、外側の選択に加わります。
- **単一のテキスト**: どの選択可能なビューにも含まれない、`userSelect: "text"` を持つテキストは、[Text](./text.md#props) で説明されているとおり単独で選択されます。
- **見た目**は、各テキストの `selectionColor`(`selection:text-*`)で指定されるプラットフォームのハイライトです。
- **リスト**: 仮想化された [List](./list.md) では、選択範囲はマウントされている行を対象とします。表示範囲外でリサイクルされた行は選択から外れます。

<a id="related"></a>

## 関連項目

- [View](./view.md): `selectable` プロパティ。
- [Text](./text.md): `userSelect`、`selectionColor`、および単一のテキストの選択。
- [TextView](./text-view.md): ブロックがまとめて選択されるドキュメント。
