---
title: "Select"
description: "Select コンポーネント: 項目のリストから 1 つの値を選択します。デスクトップではトリガーの位置にポップアップとして、スマートフォンではシートとして表示され、キーボード操作、タイプアヘッド、検索、セクションに対応し、スタイルはアプリ側で指定できます。"
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Select は、アイテムのリストから 1 つの値を選ぶコンポーネントです。設定、フィルター、国、タイムゾーンなどに使います。アプリのトリガーがリストを開き、リストは各デバイスに合わせた形で表示されます。

- デスクトップおよびデスクトップブラウザーでは、選択中の行をトリガーに重ねたポップアップとして表示するため、選ばれたタイトルは元の位置に留まります(shadcn/ui の `item-aligned` position)。幅はトリガーと同じで(アプリの `popupStyle` / `popupClass` の幅で別の幅を指定でき、`gpui-component` の `menu_width` と同様です)、高さは行の高さに合わせ、画面に収まる範囲までです。何も選択されていない場合はトリガーの下に開きます。キーボードでアイテム間を移動し、選択できます。
- スマートフォンとタブレットでは、バックドロップの上に画面下部のシートとして表示します。

Select は動作を担います。値(アプリが持つ値、または Select 自身の値)、開閉状態、キーボード、タイプアヘッド、検索、セクション、ハイライトされた行、スクリーンリーダーが読み上げる内容です。見た目はアプリ側が決めます。トリガー、ポップアップ、リスト、行、セクションのヘッダー、検索フィールドをスタイルするか、行を自分で描画します。

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では、`select()` がプロパティごとのセッター(`.items(..)`、`.value(..)`、`.item_style(..)`)とイベントごとのリスナー(`.on_change(..)`)を備えた Select を作り、`SelectItem::new(value, title)` が `.disabled(..)` と `.group(..)` を持つアイテムを作ります。

<a id="items"></a>

## アイテム

`items` はデータとしてのリストです。各アイテムは、`value`(アイテム間で一意。選択すると設定される値)、`title`(行に表示され、検索とタイプアヘッドの照合対象となり、スクリーンリーダーが読み上げる内容)、そして任意の `disabled` と `group` を持ちます。同じ `group` を持つ隣接アイテムは、そのタイトルのヘッダーの下で 1 つのセクションになります。

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

行はポップアップのスクロールビュー内の仮想化リストです。数千件のアイテムがあっても、表示範囲の行だけが生成され、行の高さが利用可能な領域を超える場合はポップアップがスクロールします。

<a id="value"></a>

## 値

`value` を指定すると、選択中のアイテムはアプリが保持します。Select はその値のアイテムを表示し、選択を `onChange({ value })` で通知します。アプリは `value` を設定して追従するか、独自の値を保持し続けます。`value={null}` は何も選択されていない状態です。省略すると、Select は自身で値を保持し、最初は `defaultValue` の値になります。`onChange` は変更を通知します。選択中のアイテムをもう一度選ぶと、リストが閉じます。

`cleanable` を指定すると、アイテムが選択されている間、クリアボタンが追加されます。押すと値がクリアされ、`onChange({ value: null })` として通知され、リストは閉じたままです。このボタンは Select のビュー内でトリガーの後ろに置かれ、トリガーの内側にはないため、押してもリストは開きません。配置と中身はアプリが決めます(`absolute` でトリガーの末尾に重ねると、シェブロンの位置になります)。

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

トリガーはアプリの要素なので、選択中のアイテムについて好きな内容(タイトル、アイコン、何も選択されていないときのプレースホルダー)を表示できます。TSX では、渡した要素そのものがトリガーです。この要素がコンボボックスとなり、プレス、キーボードフォーカス、展開状態、`disabled` を引き受けます。そのため、要素自身の `active:`、`focus:`、`disabled:` クラスは Select に追従し、要素自身の `onPress` も実行され、リストはこの要素を基準に配置されて同じ幅になります。

<a id="open-state"></a>

## 開閉状態

`open` がない場合、Select は自身で開閉状態を保持します(初期値は `defaultOpen`)。`open` を指定すると、アプリが状態を保持し、`onOpenChange({ open, reason })` で変更します。理由は `"triggerPress"`(トリガーのプレス、またはそのキー)、`"select"`(選択)、`"pressOutside"`、`"backdropPress"`、`"cancel"`(Escape または戻る)のいずれかです。`onOpen` と `onClose` はリストが表示されたとき、消えたときを通知します(シートの場合は、表示が完了したとき、消え終わったとき)。`onCancel` は、ユーザーが選択せずに閉じたことを通知します。

<a id="search"></a>

## 検索

`searchable` を指定すると、アイテムの上に検索フィールドが表示されます。入力するとタイトルで大文字小文字を区別せずに絞り込まれ、一致のないセクションはヘッダーごと消えます。ハイライトは最初の一致に移り、フィールドにキーボードがある間もキーでハイライトを動かせ、Return で選択します。`empty` は、一致するアイテムがないときにリストに表示される内容です。

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

デスクトップでは、リストが開くと同時に検索フィールドがキーボードを受け取ります。タッチスクリーンでは、フィールドを押したときにキーボードが表示されます。開くたびに検索は空の状態から始まります。

<a id="rows-the-app-draws"></a>

## アプリが描画する行

`itemClass` は各アイテムの行をスタイルします。`renderItem` が行を描画するまでは、アイテムのタイトルが表示されます。`focus:` はハイライトされた行(キーまたはポインターがある行)に、`selected:` は選択中の行に、`disabled:` は無効な行に適用されます。行を描画するには `renderItem` を指定します。これはアイテムの内容([`SelectEntry`](#types))を受け取り、表示範囲の行の内容を返します。行の状態は渡されません。`itemClass` の `group` を使うと、内容は行の状態に応じて `group-focus:`、`group-selected:`、`group-disabled:` クラスで変化します。そのため描画はアイテムごとに 1 回で済み、ハイライトの移動や選択で再描画されることはありません。`renderGroup` も同じ方法でセクションのヘッダーを描画します。

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | アイテム(順序どおり)。 |
| `value` | `.value(..)` | `string \| null` | なし | 選択中のアイテムの `value`。アプリが保持します。選択なしは `null`。省略すると Select が自身で保持します。 |
| `defaultValue` | `.default_value(..)` | `string` | なし | `value` がない場合の初期値。 |
| `open` | `.open(..)` | `boolean` | なし | 開閉状態(アプリが保持)。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` がない場合の初期の開閉状態。 |
| `searchable` | `.searchable(..)` | `boolean` | `false` | アイテムの上の検索フィールドで、タイトルによって絞り込みます。 |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | なし | 検索フィールドのプレースホルダー。 |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | なし | スクリーンリーダーが検索フィールドを指す名前(何を検索するか)。 |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | アイテムの選択中に表示されるクリアボタン。押すと値がクリアされます(`onChange({ value: null })`)。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 閉じたままになります。トリガーはプレスもキーボードフォーカスも受け付けず、`disabled:` のスタイルが適用されます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが Select を指す名前(何についての選択か)。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | デスクトップ: リストを置くトリガーの側。その側にしか余白がない場合は反対側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | デスクトップ: トリガーに対する揃え方。 |
| `offset` | `.offset(..)` | `number` | `0` | デスクトップ: トリガーとリストの間隔。 |
| `margin` | `.margin(..)` | `number` | `0` | デスクトップ: セーフエリアの端から保つ距離。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | リストを収めるポップアップ(デスクトップ)またはシート(タッチスクリーン)。 |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | タッチスクリーン: シートの背後のバックドロップ。 |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | リスト(行のスクロールビュー)。 |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | なし | 各アイテムの行。テキストスタイルはタイトルに継承されます。ハイライト中は `focus:`、選択中は `selected:`、選択できない間は `disabled:`。 |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 各セクションのヘッダー。 |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | なし | 検索フィールド。ボックスとテキスト(`color`、`fontSize`、`placeholderColor`)。 |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | クリアボタン(`cleanable`)。`disabled:` は Select に連動します。 |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | なし | クリアボタンの内容(×印、アイコンなど)。 |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | なし | スクリーンリーダーがクリアボタンを指す名前。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | なし | 押すとリストを開く要素。リストはこれを基準に配置されます。 |
| `empty` | `.empty(..)` | `JSX.Element` | なし | 表示するアイテムがないとき(一致のない検索など)にリストに表示される内容。 |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | なし | アプリがアイテムの内容から描画する行(状態は行のクラスとして反映)。省略時はアイテムのタイトル。 |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | なし | アプリが描画するセクションのヘッダー。省略時はそのタイトル。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | トリガーを囲むビュー。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | ユーザーが別のアイテムを選択した(プレス、Return または Space、トリガー上のタイプアヘッド)。その `value` を通知します。クリアボタンでクリアされた場合は `null`。追従するには `value` を設定します。 |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | リストが開いた、または閉じた。理由も通知します。追従するには `open` を設定します。 |
| `onOpen` | `.on_open(\|\| ..)` | リストが表示された。シートの場合は表示が完了したとき。 |
| `onClose` | `.on_close(\|\| ..)` | リストが消えた。シートの場合は消え終わったとき。アプリが閉じた場合にも発生します。 |
| `onCancel` | `.on_cancel(\|\| ..)` | ユーザーが選択せずにリストを閉じた(Escape または戻る、外側やバックドロップのプレス)。 |

発生順は、選択の場合は `onChange`、選択なしで閉じた場合は `onCancel`、続いて `onOpenChange`、最後にリストが表示された、または消えたときの `onOpen` または `onClose` です。

<a id="types"></a>

<a id="types"></a>

## 型

| 型 | メンバー | 説明 |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | `items` のアイテム。 |
| `SelectEntry` | `value`, `title`, `disabled`, `group?`(アイテムのもの), `index: number` | `renderItem` が受け取る内容。アイテムと `items` の中でのそのインデックスであり、状態(行の `focus:`、`selected:`、`disabled:`)は含みません。 |
| `SelectGroup` | `title: string` | `renderGroup` が受け取る内容。セクションの `group`。 |

Rust では、これらは `nsh_base::SelectItem`、`SelectEntry`、`SelectGroup` です。`value` は `SelectValue`(値があれば `Controlled(Some(..))`、`null` の場合は `Controlled(None)`)で、`.value(..)` が `Option<SharedString>` または文字列から作ります。

<a id="parts"></a>

## パーツ

| パーツ | 位置 | スタイル指定 |
|---|---|---|
| トリガー | Select のビュー | アプリ自身の要素(`trigger`) |
| クリアボタン | Select のビュー内、トリガーの後ろ(`cleanable`、アイテムの選択中) | `clearButtonClass`、`clearButtonStyle`。内容は `clearButton` |
| ポップアップまたはシート | 最前面。トリガーの位置(デスクトップ)または画面下部(タッチスクリーン) | `popupClass`、`popupStyle` |
| バックドロップ | シートの背後(タッチスクリーン) | `backdropClass`、`backdropStyle` |
| 検索フィールド | ポップアップ内の先頭(`searchable`) | `searchClass`、`searchStyle`、`searchPlaceholder`、`searchAccessibilityLabel` |
| リスト | ポップアップ内、検索フィールドの後ろ | `listClass`、`listStyle` |
| セクションのヘッダー | リスト内、そのアイテムの前 | `groupClass`、`groupStyle`、`renderGroup` |
| アイテムの行 | リスト | `itemClass`、`itemStyle`、`renderItem`(内側は `itemClass` の `group` の下で `group-focus:`、`group-selected:`、`group-disabled:`) |
| 空の状態 | ポップアップ内、アイテムが表示されないとき | 専用の要素(`empty`) |

ポップアップは縦方向のカラムで、高さは検索フィールドと行に応じて決まります。そのため `popupClass` に `max-h-*` を指定すると高さが制限され、リストはその中でスクロールします。

<a id="keyboard"></a>

## キーボード

デスクトップでは、`disabled` でない Select のトリガーに Tab で移動できます。リストが閉じている間、Down、Up、Return、Space で選択中のアイテムの位置にリストが開きます(何も選択されていない場合、Up は最後の有効なアイテム、それ以外は最初の有効なアイテムが対象です)。また、文字と数字を入力すると、ネイティブの select と同様に、入力した文字で始まるタイトルのアイテムが選択されます。リストが開いているときの操作は次のとおりです。

| キー | 動作 |
|---|---|
| Down, Up | 次または前の有効なアイテム。端では反対側へ循環します。 |
| Home, End | 最初または最後の有効なアイテム(検索フィールドがキーボードを持っている間は、フィールド自身の動作)。 |
| Page Down, Page Up | 1 ページ分、先または前の行へ。 |
| Return | ハイライトされたアイテムを選択してリストを閉じます。 |
| Space | ハイライトされたアイテムを選択します(検索フィールドがない場合)。 |
| 文字、数字 | 直近 1 秒間に入力した文字で始まるタイトルの次のアイテム(検索フィールドがない場合)。 |
| Escape | 選択せずにリストを閉じます。 |

リストが閉じると、キーボードフォーカスはトリガーに戻ります。ただし、外側のプレスによって別の場所へフォーカスが移った場合を除きます。ポインターは、通過した行をハイライトします。キーで移動したときは、ハイライトされた行が見える位置までスクロールされます。

<a id="on-each-device"></a>

## デバイスごとの動作

| | デスクトップとデスクトップブラウザー | スマートフォンとタブレット |
| --- | --- | --- |
| リスト | トリガーに重なるポップアップで、選択中の行がトリガーの位置に来ます(何も選択されていない場合はトリガーの下)。幅は、`popupStyle` で幅を指定しない限りトリガーと同じで、高さは行の高さに合わせ、画面に収まる範囲までです | バックドロップの上に表示される画面下部のシートで、高さは行の高さに合わせ、ステータスバーまでです |
| 閉じ方 | 選択、Escape、外側のプレス(プレスはポインター下の要素にも伝わります) | 選択、バックドロップ、Android の戻るボタン |
| 検索 | リストが開くと同時にフィールドがキーボードを受け取ります | フィールドを押すとキーボードが表示されます |
| 選択 | プレスの押下時点で選択されるため、検索フィールドはキーボードを保持します | タップ |

`popupClass` は、デスクトップではポップアップを、スマートフォンではシートをスタイルします。両者で異なるスタイルにしたい場合は、`platform.idiom`(`nsh/device`)を `"desktop"` と比較できます。
<a id="accessibility"></a>

## アクセシビリティ

- トリガーはスクリーンリーダー向けにはコンボボックスとして扱われます。ラベルは `accessibilityLabel`、値は選択された項目のタイトルで、リストが展開されているかどうかも伝えます。`disabled` を指定すると淡色表示になります。
- クリアボタンは `clearButtonAccessibilityLabel` という名前を持つボタンです。Tab キーのフォーカス停止位置にはなりません。
- 検索フィールドは `searchAccessibilityLabel` という名前を持つテキストフィールドです。プレースホルダーは、フィールドが空の間に表示されるヒントです。
- リストはリストボックス、各行はオプションで、タイトルが名前になります。選択中のオプションは選択状態になり、無効なオプションは淡色表示になります。セクションのヘッダーはヘッダーとして扱われます。
- キー操作でハイライトが移動すると、スクリーンリーダーのフォーカスもハイライトされた行に移動します。検索フィールドがキーボード入力を受け付けている間は、代わりにハイライトされた項目のタイトルが読み上げられるため、入力をそのまま続けられます。

一般的なラベル、ロール、読み上げについては、[アクセシビリティ](../docs/accessibility.md)を参照してください。
