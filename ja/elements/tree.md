---
title: "Tree"
description: "Tree: 他のアイテムを保持するアイテムを、展開・折りたたみ可能な形で表示し、そのうち1つを選択できるコンポーネントです。プロジェクトのファイル、設定のサイドバー、アウトラインなどに使用できます。仮想化に対応し、キーボードフォーカスの停止位置は1つで、スクリーンリーダー向けのツリーとしても公開されます。各行の見た目はアプリ側で自由に定義できます。"
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# Tree

Tree は、項目を持つ項目を表示します。プロジェクトのファイルとフォルダ、設定サイドバーのセクション、ドキュメントのアウトラインなどです。`Tree` は、どの項目が展開されているか、どの項目が選択されているか、キーボード操作、スクリーンリーダーが読み上げる内容といった、ツリーの動作を管理します。行は仮想化されています。表示範囲内の行だけが作られ、折りたたまれた項目の子は一切作られないため、数千の項目を持つツリーでも即座に開き、スクロールできます。見た目はアプリ側が決めます。Tree 自体は何も描画せず、アプリが各行のスタイル (`itemClass`) と内容 (`renderItem`: アイコン、項目の深さに応じてインデントされたラベル、シェブロン、バッジ) を描画します。

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` は [`nsh/base`](../modules/nsh-base.md) から提供されます。これは Rust の `nsh-base` クレートです。アプリが `expanded` と `selected` を設定すると、展開された項目と選択された項目はアプリのものになり、アプリは `onExpandedChange` と `onSelectedChange` でそれらを更新します。設定しない場合、Tree は `defaultExpanded` と `defaultSelected` を初期値として独自の状態を保持します。項目は、ラベルではなく、アプリ独自の `id` (パス、レコードのキーなど) で識別されます。Rust では `tree()` が Tree を作成し、プロパティごとのセッター (`.items(..)`、`.expanded(..)`、`.render_item(..)`)、イベントごとのリスナーメソッド、型付きのスタイルメソッドを備えています。

## Items

`items` は最上位の項目で、それぞれが `TreeItem` です。

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `expanded`、`selected`、各イベントで項目を識別するもので、ツリー内で一意である必要があります (同じ id が 2 回指定された場合はログに記録され、最初の項目だけが展開または選択されます)。 |
| `label` | `string` | `renderItem` が描画しない場合に行に表示される内容、スクリーンリーダーが読み上げる内容、そしてタイプアヘッドの照合対象です。 |
| `children` | `TreeItem[]` | その下にある項目を順に並べたものです。1 つでもあればフォルダとなり、展開と折りたたみができます。 |
| `disabled` | `boolean` | ユーザーは選択、展開、折りたたみができません。押下やキー操作はこの項目を飛ばし、`disabled:` のスタイルが適用されます。子の状態は `expanded` に従います。 |

`renderItem` は、表示範囲内の各行に対して `TreeEntry` を受け取ります。これには、項目の `id`、`label`、`disabled`、その `depth` (最上位は 0、最上位項目の下は 1、…)、そして `folder` かどうかが含まれます。これは項目が何であるかを表すもので、行の状態はそのクラスとして表されます。描画は項目ごとに 1 回だけ行われ、行が選択、展開、折りたたみされてもビューは保持されるため、シェブロンをトランジションで回転させることができます。

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | 最上位の項目で、それぞれがその下の項目を持ちます。 |
| `expanded` | `.expanded(..)` | `string[]` | none | 展開された項目の id (controlled)。項目は、その上位の項目がすべて展開されている間だけ表示されます。 |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | `expanded` が設定されていない場合の、最初に展開される項目です。 |
| `selected` | `.selected(..)` | `string \| null` | none | 選択された項目の id (controlled)。未選択の場合は `null` です。 |
| `defaultSelected` | `.default_selected(..)` | `string` | none | `selected` が設定されていない場合の、最初に選択される項目です。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 読み取り専用のツリーです。押下やキー操作を受け付けず、キーボードフォーカスも止まらず、すべての行に `disabled:` が付きます。`expanded` と `selected` が示す内容を表示します。 |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 展開と折りたたみの際に、項目の後ろの行がスプリングアニメーションで新しい位置へ移動します。アニメーションはネイティブに実行されます。モーション軽減が有効な場合はオフになります。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | none | スクリーンリーダーが Tree を呼ぶ名前です ("Files" など)。 |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | none | 表示範囲内の行の内容です。指定しない場合、行には項目のラベルが表示されます。 |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | none | 各行の高さ、パディング、サーフェス、状態 (後述) です。テキストスタイルはラベルに反映されます。 |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | none | Tree 内にある行のスクロールビューのパディングとギャップです。 |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | none | Tree 自体です。高さを指定してください (高さを持つ親の中では `flex-1` でも可)。行はその中でスクロールし、表示範囲内の行だけが作られます。 |

## Events

| Event | Rust | Payload | When |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | ユーザーが項目を展開または折りたたんだとき (押下、Return、Space、Right または Left、`revealItem`)。変更後になるはずの展開 id が渡されます。 |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | ユーザーが別の項目を選択したとき (押下、矢印キー、Home、End、タイプアヘッド)。 |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | ユーザーが `id` の項目を展開したとき。`onExpandedChange` の後に発生します。 |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | ユーザーが `id` の項目を折りたたんだとき。`onExpandedChange` の後に発生します。 |
| `onAction` | `.on_action(..)` | `{ id: string }` | ユーザーが `id` の項目に対して操作を行ったとき。子を持たない選択中の項目での Return、または任意の項目でのダブルクリックかダブルタップが該当し、押下自体のイベントの後に発生します。無効な項目や無効な Tree では報告されません。 |

選択は矢印キーに追従するため、ファイルエクスプローラーではファイルを `onAction` ではなく `onSelectedChange` で開きます。ファイル間を移動すると 1 つずつプレビューされ、Return またはダブルクリックでユーザーが望むファイルが開きます。

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| The tree | | `class`, `style` | |
| The list | the tree | `listClass`, `listStyle` | |
| A row | the list | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (開いているフォルダ), `focus:` (Tree がキーボードフォーカスを持っている間、キーが作用する行。選択中の行、非表示の選択項目が属する折りたたまれた項目、または何も選択されていない場合は最初の行), `disabled:`, `hover:`, `active:` |
| A row's content | a row | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `itemClass` 内の `group` の下の `group-disabled:` |

選択された行は `selected:` で、キーボードの位置は `focus:` で示してください ([Design guides](../docs/design-guides.md#interaction-states) を参照)。フォーカスは行の内側に描画してください (`focus:outline-2 focus:-outline-offset-2`)。リストは、側面からはみ出す部分をクリップします。

## Ref

| Method | Description |
|---|---|
| `focus()` | Tab で Tree に到達したときと同様に、キーボードフォーカスを取得します。 |
| `revealItem(id)` | `id` の項目より上位の項目を展開し (`onExpandedChange` と `onExpand` で、外側から順に報告されます)、その行が表示されたらスクロールして表示範囲に入れます。アプリが変更に従う場合は即座に行われ、従わない場合はそこで要求が終了します。 |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

## Disabled

無効な項目は押下を受け付けず、矢印キーはその項目を飛ばし、スクリーンリーダーは薄く表示されているものとして読み上げます。Tree に `disabled` を指定すると読み取り専用になり、アプリの状態が示す内容を表示するだけで、入力は受け付けません。

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

## Accessibility

- Tree のロールは `"tree"` で、`accessibilityLabel` によって名前が付けられます。各行は `"treeitem"` で、項目のラベルが名前になり、レベル (深さ + 1)、展開されているか (フォルダの場合)、選択されているか、無効かどうかが伝えられます。
- Tree がキーボードフォーカスを得たとき、およびキーで選択が移動したときに、キーが作用する行がスクリーンリーダーのフォーカスを得ます。

ラベル、ロール、アナウンス全般については [Accessibility](../docs/accessibility.md) を参照してください。

## Keyboard

Tab で押下を受け付けるビューに到達できるデスクトップとウェブでは、`Tree` は [WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) に従います。

| Key | What it does |
|---|---|
| Tab, Shift+Tab | 1 ステップで Tree に入り、1 ステップで Tree から出ます。戻ってきたときは、選択された行からキー操作が続きます。何も選択されていない場合、フォーカスは最初の行に表示され、Down でそれを選択します。 |
| Down, Up | 無効な項目を飛ばして、次または前の行を選択します。最後から最初へ、またその逆にも移動します。 |
| Right | 折りたたまれたフォルダを展開します。展開済みのフォルダでは、最初の有効な子を選択します。 |
| Left | 展開されたフォルダを折りたたみます。それ以外では、その親を選択します。 |
| Home, End | 最初または最後の行を選択します。 |
| Return | 選択中のフォルダを展開または折りたたみます。子を持たない項目では、その項目に対して操作を行います (`onAction`)。 |
| Space | 選択中のフォルダを展開または折りたたみます。 |
| Letters, digits | 入力された文字列で始まるラベルを持つ次の行を選択します。 |

選択が折りたたまれた項目の下に隠れている間 (アプリが折りたたんだ場合)、キーはその項目の行に作用します。Right または Return で展開され、Down でその次の行が選択されます。

右から左へのレイアウトでは行が右から並ぶため、パターンの定めるとおり Left と Right の役割が入れ替わります。Left はフォルダを展開してその中に入り、Right はフォルダを折りたたんで親を選択します。Up、Down、Home、End は変わりません。

## Platform notes

- iOS、Android、Mac Catalyst: タップで行を選択し、フォルダを展開または折りたたみます。ダブルタップで項目に対して操作を行います (`onAction`)。
- デスクトップ (macOS、Windows、Linux、GPUI) とウェブ: クリックでも同じことが行われ、Tree にキーボードフォーカスが移り、上記のキーで操作できます。ダブルクリックで項目に対して操作を行います。
- すべてのプラットフォームで、アプリがスタイルを設定したもの、つまり Tree、その行、行の内容が描画されます。
