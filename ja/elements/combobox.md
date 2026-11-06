---
title: "Combobox"
description: "Combobox コンポーネント: 入力欄に文字を入力して絞り込んだ項目リストから、1 つまたは複数の値を選択できます。デスクトップではフィールドの下にポップアップとして、スマートフォンではシートとして表示され、スタイルはアプリ側で設定します。"
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Combobox は、項目のリストから値を選びます。選べるのは1つですが、`multiple` を使うと複数選べます。たとえば、投稿のタグ、チャンネルのメンバー、ドキュメントの言語などです。トリガーは入力欄で、入力するとリストが開いて絞り込まれます。これは shadcn/ui の combobox と同じ動作です。[Select](./select.md) の兄弟コンポーネントで、そのリストを共有し、各デバイスが期待する形で表示します。

- デスクトップとデスクトップブラウザでは、フィールドの下にポップアップとして表示します。幅はフィールドと同じ(アプリが `popupStyle` / `popupClass` の幅を設定した場合はそちら)で、高さは行の高さに合わせ、横の空き領域を上限とします。
- スマートフォンとタブレットでは、バックドロップの上に、画面下部のシートとして表示します。

Combobox は動作を担います。具体的には、値(アプリの値または Combobox 自身の値)、開閉状態、キーボード、検索、セクション、ハイライトされた行、スクリーンリーダーが読み上げる内容です。`multiple` を指定すると、選択操作は値の中の項目をトグルし、リストは開いたままになるため、複数の項目を一度に選べます。見た目はアプリ側が決めます。フィールド、ポップアップ、リスト、行、セクションのヘッダー、入力欄、フッターのスタイルを設定するか、行を自前で描画します。

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` は [`nsh/base`](../modules/nsh-base.md)(Rust の `nsh-base` クレート)に由来します。Rust では、`combobox()` がプロパティごとのセッター(`.items(..)`、`.value(..)`、`.multiple(..)`)とイベントごとのリスナー(`.on_change(..)`)を備えた Combobox を作ります。項目は `Select` と同じで、`SelectItem::new(value, title)` に `.disabled(..)` と `.group(..)` を持たせ、select と同様にセクションに分けられます([アイテム](./select.md#items)を参照)。

<a id="value"></a>

## 値

値は、選択された項目の value の配列です。`value` を指定すると、値の管理はアプリが行います。Combobox はそれらの項目を選択済みとして表示し、変更のたびに `onChange({ value })` で通知します。アプリはそれに追従するよう `value` を設定するか、独自の値を保持します。指定しない場合、Combobox は自身で値を保持し、初期値は `defaultValue` から取ります。

- `multiple` を指定すると、押下、Return、Space でハイライト中の項目をトグルします。値に含まれていなければ追加し、含まれていれば取り除きます。リストは開いたままです。
- 指定しない場合、選択操作は値をその項目の値に置き換えてリストを閉じます。選択済みの項目をもう一度選んだときは、リストを閉じるだけです。

`onConfirm({ value })` は、リストが閉じるときに値を通知します。閉じ方(選択、Escape、外側の押下、トリガーボタン)にかかわらず、開くたびに1回、ユーザーが最終的に残した値で呼ばれます。Mac では Cmd+Return(それ以外では Ctrl+Return)でリストを閉じて確定します。

`cleanable` は、項目が選択されている間、クリアボタンを追加します。押すと値が空になります(`onChange({ value: [] })`)。ボタンは入力欄の後、トリガーボタンの前に置かれ、押してもリストは開きません。中身はアプリが用意します。[select のクリアボタン](./select.md#value)と同じです。

<a id="input"></a>

## 入力

トリガーは、Combobox の行(`class` と `style`: フィールドの枠線と塗り)の中にあるテキスト入力欄です。その前にアプリの `prefix`(選択された項目のチップやアイコン)があり、後ろにクリアボタン、アプリの `triggerButton`(シェブロンなど)、`suffix` が続きます。

- 入力するとリストが開き、大文字小文字を区別せずにタイトルで項目を絞り込みます。一致する項目がない間は `empty` が表示されます。Down と Up でもリストが開き、トリガーボタンを押すとリストが開閉します。タッチスクリーンでは、入力欄をタップするとリストが開きます。
- 値が1つの場合、入力欄には選択された項目のタイトルが表示されます(選択がない間は `placeholder`)。入力欄にフォーカスが移ると全体が選択されるため、入力した文字がそれを置き換えます。
- `multiple` を指定した場合、入力欄にはクエリが表示されます。選択された項目は、アプリが `prefix` または Combobox の横に表示します。

クエリは Combobox 自身が持ち、開くたびに `defaultQuery`(なければ空)から始めます。`query` を指定すると、アプリが持ちます。`onQueryChange({ query })` は入力された内容を通知し、アプリはそれに追従するよう `query` を設定して、独自の方法で絞り込んだり、開始点を提案したりします。

<a id="footer"></a>

## フッター

`footer` は、行の下にある専用のパーツ(`footerClass`、`footerStyle`)に置くコンテンツです。たとえば「Manage tags」のようなアクション、件数、ヒントなどです。行がスクロールしても、その位置に留まります。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 項目。表示順のとおりです。 |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 選択操作が値の中の項目をトグルし、リストは開いたままになります。 |
| `value` | `.value(..)` | `string[]` | なし | 選択された項目の value。アプリが管理します。 |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | 初期値。`value` を指定しない場合に使います。 |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | 開閉状態。アプリまたは Combobox 自身が持ちます。 |
| `placeholder` | `.placeholder(..)` | `string` | なし | 入力欄が空の間に表示するプレースホルダー。 |
| `query` | `.query(..)` | `string` | なし | クエリ。アプリが管理します。 |
| `defaultQuery` | `.default_query(..)` | `string` | なし | 開くたびに始まるクエリ。`query` を指定しない場合に使います。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 項目が選択されている間のクリアボタン。押すと値が空になります。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 閉じたままになり、押下もキーボードフォーカスも受け付けません。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | 何を選ぶのかを示す、スクリーンリーダー向けの説明。 |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | `Select` と同じ | `"bottom"`, `"start"`, 0, 0 | デスクトップ: フィールドに対するポップアップの配置。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | ポップアップ(デスクトップ)またはシート(タッチスクリーン)。 |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | シートの背後のバックドロップ。 |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | リスト。行を収めるスクロールビューです。 |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | なし | 各項目の行。ハイライト中は `focus:`、選択中は `selected:`、選択できない間は `disabled:`。 |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 各セクションのヘッダー。 |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | なし | 入力欄。編集中は `focus:`、Combobox と一緒にあるときは `disabled:`。 |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 行の下にあるフッター。 |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | クリアボタン(`cleanable`)。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | なし | クリアボタンの中身。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | なし | スクリーンリーダーがクリアボタンに使う名前。 |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | なし | 入力欄の後ろのボタン(シェブロンなど)。押すとリストが開閉します。 |
| `prefix` | `.prefix(..)` | `JSX.Element` | なし | 入力欄の前のコンテンツ(チップ、アイコンなど)。 |
| `suffix` | `.suffix(..)` | `JSX.Element` | なし | トリガーボタンの後ろのコンテンツ。 |
| `empty` | `.empty(..)` | `JSX.Element` | なし | 表示される項目がない間にリストが示す内容。 |
| `footer` | `.footer(..)` | `JSX.Element` | なし | 行の下に表示される内容。 |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | なし | アプリが描画する項目の行。項目そのものから描画し、状態からは描画しません。内容は行の `group-focus:`、`group-selected:`、`group-disabled:`(`itemClass` では `group`)に従うため、ハイライトの移動やトグルで再描画されることはありません。指定しない場合は項目のタイトルを表示します。 |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | なし | アプリが描画するセクションのヘッダー。指定しない場合はそのタイトルを表示します。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | フィールド。プレフィックス、入力欄、ボタン、サフィックスの行です。リストの幅はこれと同じになります。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 値が変更されました(選択、トグル、クリアボタン)。`{ value }` は選択された項目の value です。追従するには `value` を設定します。 |
| `onConfirm` | `.on_confirm(\|value\| ..)` | リストが閉じました。`{ value }` はそのときの値で、開くたびに1回です。 |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | ユーザーが入力欄に入力しました。`{ query }`。追従するには `query` を設定します。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | リストが開閉しました。理由(`{ open, reason }`)も渡されます。追従するには `open` を設定します。 |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | リストが表示された、または消えました。 |
| `onCancel` | `.on_cancel(..)` | ユーザーが、リストを閉じる選択をせずにリストを閉じました(Escape または戻る、外側またはバックドロップの押下)。 |

イベントは次の順序で発生します。選択の場合は `onChange`、選択なしで閉じた場合は `onCancel`、続いて `onOpenChange`、リストが閉じるときに `onConfirm`、リストが表示または消えた後に `onOpen` または `onClose` です。

<a id="parts"></a>

## パーツ

| パーツ | 場所 | スタイル |
|---|---|---|
| フィールド | Combobox のビュー(行) | `class`, `style` |
| プレフィックス | フィールドの先頭 | アプリ自身の要素(`prefix`) |
| 入力欄 | フィールド内、プレフィックスの後 | `inputClass`, `inputStyle`, `placeholder` |
| クリアボタン | フィールド内、入力欄の後(項目が選択されている間は `cleanable`) | `clearButtonClass`, `clearButtonStyle`。その中身は `clearButton` |
| トリガーボタン | フィールド内、クリアボタンの後 | アプリ自身の要素(`triggerButton`) |
| サフィックス | フィールドの末尾 | アプリ自身の要素(`suffix`) |
| ポップアップまたはシート | 他のすべての上。フィールドの下(デスクトップ)または画面下部(タッチスクリーン) | `popupClass`, `popupStyle` |
| バックドロップ | シートの背後(タッチスクリーン) | `backdropClass`, `backdropStyle` |
| リスト | ポップアップ内 | `listClass`, `listStyle` |
| セクションのヘッダー | リスト内、そのセクションの項目の前 | `groupClass`, `groupStyle`, `renderGroup` |
| 項目の行 | リスト内 | `itemClass`, `itemStyle`, `renderItem`(内側に `group-focus:`, `group-selected:`, `group-disabled:`。`itemClass` の `group` の下) |
| 空の状態 | ポップアップ内。表示される項目がない間 | 専用の要素(`empty`) |
| フッター | ポップアップ内、最後 | `footerClass`, `footerStyle`。その中身は `footer` |

<a id="keyboard"></a>

## キーボード

入力欄にフォーカスがある間のキーは select と同じです([キーボード](./select.md#keyboard)を参照)。ただし次の点が異なります。文字と数字はタイプアヘッドではなく入力欄に入力され、リストを絞り込みます。Down と Up は閉じているリストを開きます。`multiple` を指定すると、Return はハイライト中の項目をトグルし、リストは開いたままになります。Mac では Cmd+Return(それ以外では Ctrl+Return)でリストを閉じて確定します。デスクトップでリストが閉じるとき、フォーカスは入力欄に残ります。

<a id="accessibility"></a>

## アクセシビリティ

- 入力欄は、スクリーンリーダーに対しては combobox として扱われます。ラベルは `accessibilityLabel`、値は選択された項目のタイトルをカンマで連結したもので、リストが展開されているかどうかも伝えます。`disabled` を指定すると、入力欄が淡色表示になります。
- リストは listbox、各行は option として扱われ、タイトルが名前になります。選択された option は選択状態になり、無効な option は淡色表示になります。セクションのヘッダーは見出しとして扱われます。
- クリアボタンは `clearButtonAccessibilityLabel` を名前とするボタンで、Tab の停止位置にはなりません。トリガーボタンは、リストが開いているかどうかを入力欄が伝えるため、スクリーンリーダーからは隠され、こちらも Tab の停止位置にはなりません。

ラベル、ロール、アナウンスの一般的な内容については、[アクセシビリティ](../docs/accessibility.md)を参照してください。
