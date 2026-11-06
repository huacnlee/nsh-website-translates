---
title: "Pagination"
description: "Pagination コンポーネント:移動できる一連のページを表示します。現在のページの前後のページ、省略記号、前へ・次へ、コンパクトなページャー、キーボード操作、スクリーンリーダー向けの現在のページ情報に対応し、スタイルはアプリ側で指定できます。"
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# ページネーション

ページネーションは、検索結果、テーブルの行、アーカイブなど、ひとまとまりのページ間を移動するコンポーネントです。「前へ」、現在のページの周辺のページ(最初と最後は常に表示し、省略した区間ごとに省略記号を表示)、アプリの子要素、「次へ」を表示します。動作は Native Shell が担当します。表示するページ、押下、キーボード、両端での「前へ」と「次へ」の無効化、ナビゲーションランドマーク、スクリーンリーダー向けの現在のページです。見た目はアプリ側の責任です。各アイテムは色、サイズ、ラベルを持たず、アプリがスタイルを指定するか、描画します。

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。Rust では、`pagination()` がプロパティごとのセッター(`.page(..)`、`.total_pages(..)`)、ユーザーが選んだページを受け取る `.on_change(..)`、行用の型付きスタイルメソッド、アプリのコンテンツ用の `.child(..)` を備えたものを作成します。

<a id="the-page"></a>

## ページ

ページはアプリが管理します。`page` は 1 から始まる現在のページで、`onChange({ page })` はユーザーがページ、「前へ」、「次へ」を押して選んだページを通知します。アプリはそれを設定し、そのページを読み込んで行を表示します。`totalPages` はページの総数です。最後のページを超える `page` は最後のページとして表示されます。現在のページを押しても何も通知されず、最初のページでの「前へ」と最後のページでの「次へ」も同様です。

<a id="the-pages-shown"></a>

## 表示されるページ

`visiblePages`(5 以上、デフォルト)の範囲に収まる間、行はすべてのページを表示します。それを超えると、最初と最後のページ、現在のページとその両側に収まるだけのページ、`(visiblePages - 3) / 2`、そして省略した区間ごとに省略記号を表示します。

| `page` / 20、`visiblePages={7}` | 表示 |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

1 万ページあっても、表示されるアイテムは同じ 7 つです。`visiblePages` が奇数の場合、現在のページが中央に配置されます。

<a id="items"></a>

## アイテム

各アイテムにはアプリの `itemClass` と `itemStyle` が適用されます。現在のページは `selected:`、押下を受け付けないアイテムは `disabled:`、キーボードフォーカスのあるアイテムは `focus:` です。行のレイアウトはアプリが `class` で決めます(デフォルトは row で、`gap-*`、`justify-*` も使えます)。

`renderItem` がない場合、ページは番号、省略記号は `…` を表示し、「前へ」と「次へ」はアクセシビリティラベルを表示します(ラベルがない場合は `‹` と `›`)。`renderItem` は、`PaginationItemState` から各アイテムの内容を描画します。

| フィールド | 型 | 説明 |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | アイテムの種類。 |
| `page` | `number` | ページの番号。「前へ」または「次へ」の移動先のページ(両端では現在のページ)。省略記号の場合は、隠れている最初のページ。 |
| `start`、`end` | `number` | 省略記号が隠しているページ。`start` は含まれ、`end`(次に表示されるページ)は含まれません。 |
| `current` | `boolean` | 現在のページ。 |
| `disabled` | `boolean` | 押下を受け付けません。最初のページでの「前へ」、最後のページでの「次へ」、無効化されたページネーションのすべてのアイテムが該当します。 |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

省略記号自体は押下を受け付けません。その動作はアプリが決めます。省略記号の中に描画した `Menu` は、上の `JumpMenu` と同様に、隠れているページを一覧表示します。

<a id="compact"></a>

## コンパクト

`compact` は「前へ」、子要素、「次へ」だけを表示します。狭い画面向けのページャーで、ページ情報は子要素で伝えます。

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

子要素は、どちらの形式でもページの後、「次へ」の前に配置されます。ページ数の表示や、ページへ移動するための入力欄などに使えます。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | 必須 | 1 から始まる現在のページ。アプリが `onChange` で設定します。 |
| `totalPages` | `.total_pages(..)` | `number` | 必須 | ページの総数。1 以上。 |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | 一度に表示するページの最大数(最初と最後を含む)。5 以上。 |
| `compact` | `.compact(..)` | `boolean` | `false` | 「前へ」、子要素、「次へ」のみを表示します。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | どのアイテムも押下やキーボードフォーカスを受け付けません。`disabled:` のスタイルは適用され、スクリーンリーダーには無効(dimmed)と通知されます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがナビゲーションを呼ぶ名前。何をページ送りするものかを表します。 |
| `previousAccessibilityLabel`、`nextAccessibilityLabel` | `.previous_accessibility_label(..)`、`.next_accessibility_label(..)` | `string` | なし | スクリーンリーダーが「前へ」と「次へ」について読み上げる内容。`renderItem` がない場合は、その表示内容にもなります。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(\|s\| ..)` | `string`、`StyleProp<TextStyle>` | なし | 各アイテムの見た目。現在のページでは `selected:`、さらに `disabled:`、`focus:` が適用されます。テキストスタイルは内容に引き継がれます。 |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | なし | 各アイテムの内容をその状態から描画します。 |
| `children` | `.child(..)` | `JSX.Element` | なし | ページの後、「次へ」の前に置くアプリのコンテンツ。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 行の見た目とレイアウト。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: ユーザーがページ、「前へ」、「次へ」で選んだページ。現在のページは通知されません。 |

<a id="motion"></a>

## モーション

現在のページは、アプリの `selected:` クラスの指定に従ってアイテム間を移動します。`itemClass` に `transition-colors` を指定すると、ハイライトが移動元のページから移動先のページへフェードします。ページを変更しても各アイテムの位置は保たれ、表示内容だけが変わるため、行がちらつくことはありません。モーションを減らす設定(`motion-reduce:transition-none`)では、アプリのトランジションは停止します。

<a id="accessibility"></a>

## アクセシビリティ

- 行はナビゲーションランドマークであり、`accessibilityLabel` で名前が付けられます。
- 各ページ、「前へ」、「次へ」はボタンです。現在のページは現在のページとして読み上げられ(ARIA の `aria-current="page"`)、選択状態になります。最初のページでの「前へ」と最後のページでの「次へ」は無効(dimmed)になります。
- macOS とウェブでは、各ページ、「前へ」、「次へ」がキーボードフォーカスの停止位置となり、Return と Space で押下できます。キーボードで押したページは、アプリがそのページを表示した後も、行内のどこに移動してもフォーカスを保持します。「前へ」や「次へ」で最初または最後のページに到達した場合も同様です。

ラベル、ロール、アナウンス全般については、[Accessibility](../docs/accessibility.md) を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- iOS、Android、Mac Catalyst: 押下は、アイテム上で終了するタップです。
- デスクトップ(macOS、Windows、Linux、GPUI)とウェブ: 押下はクリックです。macOS とウェブでは、Tab キーでアイテムに移動できます。
- すべてのプラットフォームで、アプリがスタイルを指定したとおりに描画されます。
