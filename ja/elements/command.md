---
title: "Command"
description: "Command: アプリのコマンドを対象とした検索フィールドで、ユーザーの入力に応じてコマンドが絞り込まれるコマンドパレットです。ダイアログ内の Cmd+K パレット、インラインのコマンドメニュー、アプリが応答する検索として利用できます。仮想化に対応し、キーボード操作を第一に設計されており、スクリーンリーダー向けにはリストボックスとして扱われます。各パーツの見た目はアプリ側で自由に定義できます。"
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

コマンドパレットは、コマンドの一覧に対する検索フィールドです。ユーザーが数文字入力すると、一覧は一致するコマンドに絞り込まれ、矢印キーでハイライトが移動し、Return でハイライトされたコマンドが実行されます。`Command` は、フィルタリング、セクション、ハイライト、キーボード、スクリーンリーダーが読み上げる内容といった、パレットの動作を担います。フィルタリングはネイティブで実行され、行は仮想化されます。表示範囲の行だけが作成されるため、数千件のコマンド、ファイル、絵文字を含むパレットでも、キー入力のたびにフィルタリングできます。見た目はアプリ側が決めます。コマンド自体は何も描画せず、アプリが各パーツ(`itemClass`、`groupClass`、`searchClass` など)にスタイルを適用し、行の内容(`renderItem`:アイコン、ラベル、ショートカットのキー)を描画します。

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。`query` を設定すると、クエリはアプリが管理し、アプリは `onQueryChange` で更新します。設定しない場合は、検索フィールドが自身でクエリを保持し、`defaultQuery` から始まります。アイテムは、ラベルではなく、アプリ独自の `id` で識別されます。`onSelect({ id })` は、ユーザーがどれを選んだかを伝えます。Rust では `command()` が作成し、prop ごとのセッター(`.items(..)`、`.query(..)`、`.render_item(..)`)、イベントごとのリスナーメソッド、型付きのスタイルメソッドを備えます。

<a id="items"></a>

## アイテム

`items` はコマンドを順番に並べたもので、それぞれが `CommandItem` です。

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | `onSelect` と `onHighlightChange` でそのアイテムを識別するもの。アイテム間で一意です。 |
| `label` | `string` | `renderItem` が行を描画しない場合に行に表示される内容、スクリーンリーダーが読み上げる内容、クエリが照合する対象。 |
| `keywords` | `string[]` | クエリが照合する追加の語。同義語や、翻訳済みラベルと並べる英語名など。 |
| `group` | `string` | そのアイテムのセクション。同じグループの隣接するアイテムは、この見出しを持つヘッダーの下に表示されます。 |
| `shortcut` | `string` | 同じコマンドのキーストローク。[`keymap`](../modules/nsh.md#keymap) が定める名前表記(`"mod+shift+p"`)で指定し、行に表示されます。アプリは `keymap.bind` でバインドします。 |
| `disabled` | `boolean` | 選択できません。キー操作では飛ばされ、押しても何も起こらず、`disabled:` スタイルが適用されます。 |
| `checked` | `boolean` | 現在有効なもの(テーマ、言語など)。`checked:` スタイルが適用され、スクリーンリーダーはチェック済みと読み上げます。 |

クエリは、アイテムのラベルまたはキーワードのいずれかにクエリが含まれていれば、大文字小文字と前後の空白を無視して一致します。アイテムの順序は保たれ、一致するものがないセクションはヘッダーごと消えます。`renderItem` は、表示範囲の各行に対して `CommandEntry` を受け取ります。これにはアイテムのフィールドと、`shortcutLabel`(`shortcut` をここでのヒントの表示形式にしたもので、Apple のプラットフォームでは `⇧⌘P`、それ以外では `Ctrl+Shift+P`)が含まれます。これはアイテムそのものを表し、ハイライトは行の `focus:` です。描画はアイテムごとに一度だけ行われ、ハイライトが移動してもビューは保持されます。

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | コマンドを順番に並べたもの。 |
| `query` | `.query(..)` | `string` | なし | クエリ(制御)。アプリが `onQueryChange` で設定します。 |
| `defaultQuery` | `.default_query(..)` | `string` | なし | `query` が設定されていない間の、最初のクエリ。 |
| `searchable` | `.searchable(..)` | `boolean` | `true` | 行の上に置く検索フィールド。これがない場合はすべてのアイテムが表示され、コマンドはタイプアヘッド付きのキーボードフォーカスの停止位置の一つになります。 |
| `filterable` | `.filterable(..)` | `boolean` | `true` | クエリでアイテムを絞り込みます。オフにするとすべてのアイテムが表示されます。アプリ自身が応答する検索向けです(サーバーの結果を `items` として設定するなど)。新しいクエリでも最初のアイテムはハイライトされます。 |
| `loading` | `.loading(..)` | `boolean` | `false` | 検索中です。`empty` は待機し、スクリーンリーダーに対してリストはビジー状態になります。インジケーターは `searchSuffix` に表示してください。 |
| `placeholder` | `.placeholder(..)` | `string` | なし | 検索フィールドのプレースホルダー。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 表示されると検索フィールドがキーボードフォーカスを受け取ります。入力するために開くパレット向けです。 |
| `separator` | `.separator(..)` | `boolean` | `true` | 表示されている2つのセクションの間のセパレーター行。`separatorClass` でスタイル指定され、先頭、末尾、連続には現れません。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがリストを呼ぶ名前(「Commands」)。`searchAccessibilityLabel` が設定されていない間は、検索フィールドの名前にも使われます。 |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | スクリーンリーダーが検索フィールドを呼ぶ名前。何を検索するかを表します(「Search commands」)。 |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | なし | 検索フィールドの上(タイトルなど)と行の下(キーのヒント、件数など)に表示される内容。 |
| `empty` | `.empty(..)` | `JSX.Element` | なし | 表示するアイテムがないときに表示される内容。何にも一致しないクエリや、アイテムがない場合など。 |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | なし | 検索バー内で検索フィールドの前と後に表示される内容。検索アイコンや、`loading` の間のスピナーなど。 |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | なし | 表示範囲の行の内容。これがない場合、行にはアイテムのラベルが表示されます。 |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | なし | セクションのヘッダー(`{ heading }`)。これがない場合、ヘッダーには見出しが表示されます。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | コマンド自体のサイズ、フレーム、サーフェス。 |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | `searchPrefix`、検索フィールド、`searchSuffix` を含む行。 |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | なし | 検索フィールド。 |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 行のスクロールビュー。高さを指定してください(`max-h-80`、またはサイズを指定したコマンド)。行はその内側でスクロールし、表示範囲のものだけが作成されます。 |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | なし | 各アイテムの行とその状態(下記)。テキストスタイルはラベルに反映されます。 |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | なし | 各セクションのヘッダー。 |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 各セパレーター。罫線の高さと色。 |

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | ユーザーがアイテムを選択した。Return、または行の押下。 |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | ハイライトが移動した(キー、ポインター、新しいクエリや新しいアイテム、`highlight`)。Return で何が実行されるかをプレビューするためのものです。 |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | ユーザーが検索フィールドに入力した、または Escape でクリアした。 |
| `onCancel` | `.on_cancel(..)` | なし | クエリが空の状態での Escape。コマンドを保持しているもの(ダイアログの `open` など)を閉じます。 |

<a id="parts"></a>

## パーツ

| パーツ | 内側 | スタイル指定 | 状態 |
|---|---|---|---|
| コマンド | | `class`, `style` | |
| `header` | コマンド | アプリの要素 | |
| 検索バー | コマンド | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`、検索フィールド、`searchSuffix` | 検索バー | アプリの要素。`searchClass`, `searchStyle` | フィールドの `focus:` |
| リスト | コマンド | `listClass`, `listStyle` | |
| セクションのヘッダー | リスト | `groupClass`, `groupStyle`, `renderGroup` | |
| セパレーター | リスト | `separatorClass`, `separatorStyle` | |
| 行 | リスト | `itemClass`, `itemStyle` | `focus:`(ハイライト)、`checked:`, `disabled:`, `hover:`, `active:` |
| 行の内容 | 行 | `renderItem` | `itemClass` 内の `group` 配下の `group-focus:`, `group-checked:`, `group-disabled:` |
| `empty` | コマンド | アプリの要素 | |
| `footer` | コマンド | アプリの要素 | |

ハイライトされた行は `focus:` で表示します([デザインガイド](../docs/design-guides.md#interaction-states)を参照)。

## Ref

| メソッド | 説明 |
|---|---|
| `focus()` | 検索フィールドにキーボードフォーカスを与えます(検索フィールドがない場合はコマンドに与えます)。 |
| `highlight(id)` | `id` のアイテムをハイライトし、その行を表示範囲にスクロールします。表示されていないアイテムや無効なアイテムは、そのままです。 |
| `matchedCount()` | `Promise<number>`:クエリが表示するアイテムの数。無効なアイテムも含みます。 |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## ダイアログ内のパレット

コマンドを [`Dialog`](./dialog.md) に入れ、アプリのショートカットで開きます。Escape はまずクエリをクリアし、クエリが空のときは `onCancel` となり、アプリがダイアログを閉じます。

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## アプリが応答する検索

`filterable={false}` を指定すると、アプリが渡したアイテムがすべて表示されます。アプリは `onQueryChange`(サーバー、データベース)で検索し、結果を `items` に設定し、待機中は `loading` にします。

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## アクセシビリティ

- リストのロールは `"listbox"` で、`accessibilityLabel` によって名前が付けられます。各行は、アイテムのラベルを名前とする `"option"` で、チェック状態と無効状態はアイテムに従います。セクションのヘッダーは `"header"` で、セパレーターは非表示です。
- 検索フィールドは、`searchAccessibilityLabel`(なければ `accessibilityLabel`)を名前とするテキストフィールドです。プレースホルダーは、フィールドが空の間に表示されるヒントです。
- 矢印キーでハイライトが移動している間も、検索フィールドはキーボードフォーカスを保ち、スクリーンリーダーはハイライトされたラベルを読み上げます。検索フィールドがない場合は、ハイライトされた行がスクリーンリーダーのフォーカスを受け取ります。
- `loading` の間、リストはビジー状態になります。

ラベル、ロール、アナウンス全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="keyboard"></a>

## キーボード

| キー | 動作 |
|---|---|
| 文字入力 | アイテムを絞り込み、最初の有効な一致項目をハイライトします。 |
| Down, Up | 次または前のアイテムをハイライトします。無効なアイテムは飛ばし、最後から最初へ、またその逆へと循環します。 |
| Page Down, Page Up | 表示範囲の行数分だけハイライトを移動します。 |
| Return | ハイライトされたアイテムを選択します(`onSelect`)。 |
| Escape | クエリをクリアします。クエリが空の場合は `onCancel` を通知します。 |
| Home, End | 検索フィールドがない場合は、最初または最後のアイテムに移動します(フィールド内ではキャレットが移動します)。 |
| Space、文字、数字 | 検索フィールドがない場合:Space で選択し、文字と数字はタイプアヘッドでハイライトします。 |

<a id="platform-notes"></a>

## プラットフォームに関する注記

- デスクトップ(macOS、Windows、Linux、GPUI)と Web:ポインターが移動した行がハイライトされ、クリックはボタンを押した時点で選択されるため、検索フィールドはキーボードフォーカスを保ちます。
- iOS、Android、Mac Catalyst:タップで行を選択し、キーボードのリターンキーでハイライトされたアイテムを選択して、次のクエリのためにフィールドを保持します。
- すべてのプラットフォームで、アプリがスタイルを指定したものが描画されます。コマンド、その検索バー、行、行の内容です。
