---
title: "リスト"
description: "RustとTSXにおける長いリストや無限リスト - リサイクル、行の識別、列、スティッキーヘッダー、反転チャットリスト、水平リスト、ページ内のリスト、追加読み込み、表示状態の検出、アイテムへのスクロール。"
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# リスト

リスト(Rust では `virtual_list(..)`、TSX では `nsh` の `List`)は、長いデータをネイティブのスクロールビュー上に描画し、画面付近の行だけを作成します。どの行が存在するか、どこに配置されるか、列、スティッキーヘッダー、どのアイテムが表示されているかはすべてネイティブ側で計算されます。あなたのコードは、ネイティブ側から要求されたときにセルの内容を埋めるだけです。100万件のリストのコストは、30件のリストとほぼ同じです。

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

Rust では、`virtual_list(count, row)` は行数(値、シグナル、またはクロージャ)と、位置(`at.index()`)から行を構築する関数を受け取ります。行はそのインデックスでデータを読み取ります。TSX では、`each` はアイテムを受け取り、行関数にはそのアイテムが渡されます。[スクロールビュー](./scrolling.md)と同様に、リストはビューポートであり、親からサイズを与えられる必要があります(`.flex_1()`、`flex: 1`、または高さ)。

<a id="how-recycling-works"></a>

## リサイクルの仕組み

行関数はアイテムごとに一度呼ばれるわけではありません。**セルごとに一度**呼ばれ、セルは再利用されます。行が画面から大きく外れると、そのセルには別の行が割り当てられ、その位置(Rust では `at.index()`、TSX では `item()` と `index()`)が変化します。位置を読み取っている行内のすべてのものは、他の[シグナル](./reactivity.md)と同様にその場で更新されます。

ここから2つのルールが導かれます。

**位置は使う場所で読み取ってください。** 行関数の先頭で取り出してコピーした値は、そのセルが最初に表示した行のものになってしまいます。

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**アイテムごとの状態は、行ではなくデータに持たせてください。** 行の内部で作成したシグナルはセルに属し、セルとともに次のアイテムへ移ります。「この行は展開されている/選択されている/いいねされている」といった状態は、アイテム自身に、または ID をキーにしたセットに保存してください。

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

行の高さは異なっていてもかまいません。行が計測されるまでは、リストは推定アイテムサイズ(デフォルトは 50 ポイント)を仮定します。スクロールインジケーターや遠いアイテムへのジャンプを最初から正確にするため、典型的な行の高さに近い値を渡してください。

<a id="changing-the-data"></a>

## データの変更

Rust では、行数をシグナルまたはクロージャ(`move || posts.with(Vec::len)`)として渡すと、リストはその場で増減します。末尾への行の追加や削除には、それ以上何も必要ありません。それ以外の場所で行が増減する場合は、`.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))` で行の識別子を渡してください。リストは先頭と末尾の共通部分を保持し、その間は削除と挿入として扱います。

TSX では、新しい配列を渡してアイテムを変更します(`posts.set([...posts(), ...more])`)。リストは古い配列と新しい配列を**アイテムの同一性**(`===`)で比較し、先頭と末尾の共通部分を保持して、その間を削除と挿入として扱います。

どちらの場合も、計測結果は行とともに保持され、表示中の行より上に行が挿入されても、表示中の行はジャンプせずその場にとどまります。

- TSX では、イミュータブルに更新してください。変更のないアイテムのオブジェクトは再利用した新しい配列を作ります。配列をその場で変更(`push`)しても検知されません。
- 変更されたアイテムは新しいオブジェクト(`{ ...post, title }`)にしてください。そうすれば行に変更が反映されます。
- 先頭への追加(新着メッセージ、更新されたフィード)では、ユーザーの位置が保たれます。

`keyExtractor` は、ビューアビリティトークン(後述)の中でアイテムに名前を付けます。デフォルトでは、キーは `item.key`、次に `item.id`、最後にインデックスです。TSX での変更の対応付けには影響せず、常に同一性で行われます。

<a id="props"></a>

## プロパティ

リストは、リストにとって意味のあるスクロールビューのスクロール関連プロパティをすべて受け取ります(`pagingEnabled`、`snapToInterval`、`snapToOffsets`、`snapToAlignment`、`decelerationRate`、`disableIntervalMomentum`、`bounces`、`scrollable`、`contentInset`、`contentOffset`、`keyboardShouldPersistTaps`、`keyboardDismissMode`、`scrollEventThrottle`、`onScroll`、`onScrollDragStart`、`onScrollDragEnd`、`onMomentumStart`、`onMomentumEnd`、`onScrollEnd`、`scrollValue`、`pullValue`。Rust ではスクロールビューと同じメソッド)。詳細は[スクロール](./scrolling.md)を参照してください。リストのスケールは 1 に保たれます。リスト固有のプロパティは次のとおりです。

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | アイテム。Rust では行数。 |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | セルを描画します。セルごとに一度呼ばれます。[リサイクル](#how-recycling-works)を参照してください。 |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | まだ計測されていない行のサイズ(ポイント単位)。 |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 横方向にスクロールします。 |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: リストは独自のスクロールビュー内でスクロールします。`"parent"`: リストは周囲のスクロールビュー内に全長で配置され、ページの他の部分とともにスクロールされます([ページ内のリスト](#lists-in-a-page-viewportparent)を参照)。リストの作成時に選択されます。 |
| `numColumns` | `.columns(n)` | `number` | `1` | 1行あたりのアイテム数(縦方向のリスト)。 |
| `inverted` | `.inverted()` | `boolean` | `false` | アイテム 0 を下端に配置します(チャット向け)。末尾から開始し、末尾からの距離を保ちます。 |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | 反転されていないリストは、コンテンツが増えても、末尾からこのポイント数以内にいる間は末尾にとどまります(後述)。 |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | スクロールで通り過ぎたときに上端に固定されるアイテム(1列、反転なし)。 |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`、`.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | スティッキーアイテムが上端からどれだけ下に固定されるか。CSS の `position: sticky` の `top` と同様です。コンテンツはその上の空間の下をスクロールし続けます。アニメーション値を渡すと、毎フレーム移動します。 |
| `contentStyle` | `.content_padding(..)`、`.content_padding_x(..)`、...、`.row_gap(..)`、`.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | コンテンツのパディングとギャップ。数値のみ。 |
| `contentClass` | | `string` | | クラスと同じです(`p-*`、`gap-*`)。`contentStyle` が優先されます。 |
| `header` | `.header(..)` | コンポーネントまたは要素 | | アイテムの前に表示されます。 |
| `footer` | `.footer(..)` | コンポーネントまたは要素 | | アイテムの後に表示されます。 |
| `empty` | `.empty(..)` | コンポーネントまたは要素 | | アイテムがない間、アイテムの代わりに表示されます。 |
| `separator` | `.separator(\|\| ..)` | コンポーネントまたは要素 | | アイテム間に表示されます(1列)。 |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 最初のフレームの前にこのアイテムまでスクロールします。 |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 末尾が近づきました(後述)。 |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | `onLoadMore` が発火する、末尾までの近さ(ビューポート単位)。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | スクロール後に、先頭が近づきました(後述)。 |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | `onLoadMoreAtStart` が発火する、先頭までの近さ(ビューポート単位)。 |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | アイテムが表示状態になった、または表示状態でなくなりました。 |
| `viewabilityConfig` | `.viewability(..)`、`.minimum_view_time(..)` | `ViewabilityConfig` | | アイテムが表示状態とみなされる条件。 |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | ビューアビリティトークンのキー。Rust では行の識別子。 |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | プルして更新。 |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | プラットフォームのスピナーの代わりに使う、アプリ独自のプルして更新のインジケーター([スクロール](./scrolling.md#an-indicator-of-your-own)を参照)。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | スクロールインジケーターを表示します。プラットフォーム標準のもの、またはアプリがテーマを設定した場合はアプリの[組み込みバー](../elements/scrollbar.md#built-in-bars)です。オブジェクトを渡すと、そのビュー独自のテーマになります。デスクトップおよびデスクトップブラウザーでは、横方向のビューはインジケーターを保持します。これはマウスのスクロールバーです。 |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`、`scrollToOffset`、`scrollToEnd`、`scrollTo`。 |

ヘッダー、フッター、空状態のスロットは、要素を受け取ります(TSX ではコンポーネントも可: `header={Header}`)。これらは独自のセルであり、リサイクルされず、他の要素と同様にリアクティブです。

<a id="columns-and-grids"></a>

## 列とグリッド

`numColumns`(`.columns(n)`)は、その列数ごとにアイテムを行として配置します。コンテンツのパディングはコンテンツの周囲に適用され、行と列の間にはギャップが入ります。グリッドの行の高さは異なっていてもかまいません。各行は、その中で最も高いアイテムの高さになります。

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## スティッキーヘッダー

`stickyHeaderIndices` は、コンテンツがスクロールして通り過ぎる間、ビューポートの上端に固定されるアイテムを指定します。次のスティッキーアイテムに押し出されるまで固定されます。セクションは、ヘッダーと行のアイテムを並べた1つのリストで表現し、ヘッダーのインデックスが固定されます。固定の処理は、スクロールの各フレームでネイティブ側が行います。

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

セルは、あるときはヘッダーを、後では名前を表示することがあるため、行は何を描画するかを、行が変わると切り替わる [`when` / `<If>`](../elements/control-flow.md) で決めます。スティッキーヘッダーには、1列で反転されていないリストが必要です。

`stickyHeaderOffset`(Rust では `.sticky_header_offset(..)`)を指定すると、ヘッダーは上端ではなく、そこからそのポイント数だけ下に固定されます。CSS の `position: sticky` の `top` と同様です。高さ 56 ポイントの半透明のバーの下では、`stickyHeaderOffset={56}`(`.sticky_header_offset(px(56.0))`)により、行がバーの下をスクロールし続ける間、各ヘッダーはバーの下に保たれ、次のヘッダーがそこから押し出します。負のオフセットを指定すると、ヘッダーの一部が見えなくなります。

オフセットには[アニメーション値](./animation.md#animated-values)(Rust では `.bind_sticky_header_offset(&node)`)を使えます。ヘッダーは UI スレッド上で毎フレームそれに追従するため、移動するバーの下に留まり続けます。コンテンツを下にスクロールすると隠れ、上にスクロールすると戻ってくるバー([`diffClamp`](./animation.md#arithmetic-and-diffclamp))と組み合わせると、ヘッダーはバーがどこにあってもその下端に固定されます。

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## チャット: 反転リスト

`inverted` は、リストを末尾から配置します。アイテム 0 が下端に置かれ、リストは末尾までスクロールされた状態で始まり、アイテムが変化しても末尾からの距離を保ちます。最新のメッセージを先頭に置いてください。メッセージを追加するには先頭に追加し、古いメッセージを読み込むには `onLoadMore` を使って末尾に追加します(反転リストの「末尾」は上端です)。古いメッセージで開いたチャットが新しいメッセージを読み込む場合は [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart) を使います。これを指定すると、リストは下端にいる間は下端からの距離を保ち、上にスクロールしているときは画面上のメッセージをその場に保ちます。

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <List
        each={messages()}
        inverted
        estimatedItemSize={44}
        style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 6 }}
        keyboardDismissMode="interactive"
        onLoadMore={loadOlder}
        loadMoreThreshold={0.5}
      >
        {(m) => (
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

反転リストでの `scroll_to_end(..)` / `scrollToEnd()` は、リストの先頭、つまり最新のメッセージまでスクロールします。

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### 反転されていないリストで末尾に追従する

読む順序(古いものが先)のリストも末尾に追従できます。Rust では `.follow_end(px(40.0))`、TSX では `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` を指定すると、ユーザーが末尾にいる間(または末尾から 40 ポイント以内にいる間)、コンテンツが増えてもリストは末尾にとどまります。たとえば、最後のアイテムに返信がストリーミングされる場合、新しいメッセージが追加される場合、キーボードによってリストが縮む場合などです。さらに上にスクロールしている場合は、表示中のコンテンツはその場に残り、新しいコンテンツはその下に増えていきます。表示中のアイテムより上に挿入されたアイテムは、このオプションの有無にかかわらず、表示中のアイテムを動かしません。

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## 横方向のリスト

`horizontal` を指定すると、リストが横向きになり、セルはリストの高さに合わせて配置されます。スナップと組み合わせると、任意の長さのカルーセルを作れます。

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

右から左への書字方向では、横方向のリストは右から始まり、左に向かって並びます。

<a id="lists-in-a-page-viewportparent"></a>

## ページ内のリスト: viewport="parent"

ページは、ヘッダー、いくつかのカード、長いリスト、さらにその下に別のリスト、というように、ひとつのまとまりとしてスクロールされることがよくあります。リストに `viewport="parent"`(Rust では `.viewport(ListViewport::Parent)`)を指定し、ページの他の要素とともに `Scroll` の中に置いてください。リストはページ内に全長で配置され、ページのスクロールビューが他のすべてとともにそれをスクロールします。それでもページのビューポート付近の行だけを作成してセルをリサイクルするため、1つのページに複数の長いリストを置けます。

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- リストの長さは行によって決まります。高さ(横方向の場合は幅)はビューと同様にコンテンツから決まり、パディング、ボーダー、マージンもビューと同じように機能します。
- リストの行は、その軸方向について、周囲で最も近いスクロールビュー、またはそれが載っている画面に従います。
- ページは、ブラウザーと同様に、あなたが読んでいる位置を保ちます。ビューポートの上端より完全に上にある行のサイズが変わると、その分だけページが移動します。リストの先頭が見えている間は、大きくなった行がその下にあるものを押し下げます。
- `scrollToIndex`、`scrollToEnd`、`initialScrollIndex` は、ページのコンテンツの範囲内で、ページをリストの行までスクロールします。`onLoadMore` はリストの末尾がビューポートに近づくと発火し、`onViewableItemsChange` はページのビューポート内にある行を報告します。
- `stickyHeaderIndices` と `stickyHeaderOffset` は、行をページの上端に固定します。セクションヘッダーは、その行が下をスクロールする間は上端に留まり、次のヘッダーに押し出されるまで続きます。最後のヘッダーは、そのリストの末尾とともに去ります。
- ページのスクロールの動作は、そのスクロールビューのものです。`Scroll` に対して、`onScroll` とその他のスクロールイベント、`scrollValue`、`refreshing` / `onRefresh`、ページングとスナップ、`contentInset`、`scrollbar`、`scrollable`、`keyboardDismissMode` を設定してください。反転リストと `maintainVisibleContentPosition` は、独自のビューポートを持つリスト(`viewport="own"`、デフォルト)の機能です。
- ビューポートはリストの作成時に選択されます。切り替えるには、新しいリストを描画してください。

<a id="loading-more-onloadmore"></a>

## さらに読み込む: onLoadMore

`onLoadMore`(`.on_load_more(..)`)は、ビューポートが末尾から `loadMoreThreshold` ビューポート以内に入ると発火します(デフォルトは 1、つまり1画面先)。次のページを追加してください。新しい末尾が近づくと、リストは再び発火します。

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

上記のように、読み込みが重複しないようにしてください。ページの取得中に、末尾が再び通知されることがあります。
<a id="loading-at-the-start-onloadmoreatstart"></a>

## 先頭からの読み込み: onLoadMoreAtStart

リストは、データの途中から開くこともできます。たとえば、古いメッセージ(検索結果や返信の引用)でチャットを開くと、そのメッセージを中心にしたページが表示され、新しいメッセージはまだ読み込まれていません。`onLoadMoreAtStart`(`.on_load_more_at_start(..)`)は、ビューポートが先頭(項目 0 の側。通常のリストでは上端、反転したリストでは下端)から `loadMoreAtStartThreshold` ビューポート分(デフォルトは 1)以内に入ったときに発火します。ページは先頭に追加(prepend)してください。画面上の行は、ページが手前に追加されても位置を保ちます(反転したリストでも、下端からスクロールして離れていれば同様です)。リストは次に先頭へ近づいたときに再び発火し、ページを追加してもまだ先頭の近くにある場合は、すぐに再度発火します。

このコールバックは、ユーザーがそこへスクロールしたとき、またはスクロールコマンドでリストがそこへ移動したとき(`initialScrollIndex`を含む)に発火します。そのため、最新の項目で開いたリストは何も要求せず、`initialScrollIndex`で先頭付近を開いたリストは、その手前のページをすぐに要求します。

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

最新のメッセージまで読み込んだら、読み込みを止めてください。以降は、一般的なチャットと同様に、新しいメッセージが先頭に届きます。

## Viewability

`onViewableItemsChange`(`.on_viewable_items_change(..)`)は、どの項目が画面上にあるかを報告します。分析、表示中の動画の自動再生、メッセージの既読化などに使えます。TSX では `{ viewableItems, changed }` を受け取り、これはトークン `{ item, key, index, isViewable }` の配列です。Rust では `ViewableItems` を受け取り、最初と最後の表示可能な行(`viewable`)と、状態が変わった行(`changed()`)が含まれます。Viewability はネイティブ側で計算され、コードには変化のみが通知されます。

| `viewabilityConfig` | Rust | 説明 |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | 項目がどれだけ見えている必要があるか(0 から 1)。 |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | 項目がビューポートのどれだけを占めている必要があるか(0 から 1)。 |
| `minimumViewTime` | `.minimum_view_time(Duration)` | 項目が報告されるまでに、表示可能な状態を保つ必要があるミリ秒数。 |

しきい値を指定しない場合は、1 ピクセルでも見えていれば対象になります。

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## コードからのスクロール

リストに ref を渡します(Rust では `element_ref()` と `.element_ref(&list)`、TSX では `ref`)。

| Rust | TSX | 説明 |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 項目 `index` が見える位置までスクロールします。表示位置(view position)で配置を指定します。0 はビューポートの先頭(デフォルト)、0.5 は中央、1 は末尾です。view offset でさらにずらせます。 |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | リストの軸方向のコンテンツオフセットまでスクロールします。 |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | コンテンツの末尾(反転したリストでは先頭)までスクロールします。 |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | スクロールビューと同様に、オフセットまでスクロールします。 |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

インデックス(および末尾)へのスクロールは、その時点で分かっているサイズを使ってネイティブ側で解決されます。計測済みの行は計測値を、それ以外は推定サイズを使います。その後、リストは周囲の行が計測されるあいだ目標を追従し続けるため、正確な位置に着地します。この追従は、ユーザーがスクロールするか、項目が変更されるまで続きます。特定の項目でリストを開くには、最初のフレームの後でスクロールするのではなく、`initialScrollIndex`(`.initial_scroll_index(..)`)を使用してください。

<a id="a-settings-style-list"></a>

## 設定画面スタイルのリスト

リストの見た目はアプリ側で決めます。リストは行の配置とリサイクルを担当し、行、区切り線、サーフェスはあなたのビューです。グループ化された設定画面スタイルのリストは、パディング、セパレーター、最初と最後の行の角丸を備えたリストです。これを独自のコンポーネントにして、アプリで設定を一覧表示するすべての場所で使用してください。

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## パフォーマンスに関する注意

- 各セルは個別にレイアウトされるため、スクロール時には変更されたセルだけがレイアウトされます。行は浅い階層に保ち、毎フレーム変化する行ではシグナルの読み取りを避けてください。
- ネイティブ側はセルをバッチで要求し、1 フレームにつき最大で数ラウンドまで行い、1 回の更新にまとめます。そのため、高速なフリングでも、セルごとにコードを呼び出すことなく、1 フレームで多数のセルがバインドされます。Rust の行は、それを必要とするコミットの中で、コア自身によってバインドされます。
- 行のフレームごとのコストを計測するには、[`nsh test --trace`(`scroll` ステップ付き)](./testing-and-trace.md#scrolling)を使用してください。

<a id="related"></a>

## 関連項目

- [`List` 要素](../elements/list.md): リファレンス。
- [スクロール](./scrolling.md): リストとスクロールビューが共有するスクロール用の props。
- [リアクティビティ](./reactivity.md): 行がバインディング内で自身の位置を読み取る理由。
- [パフォーマンス](./performance.md): リストの計測。
