---
title: "List"
description: "ネイティブのスクロールビュー上で動作する、仮想化およびリサイクル対応のリストコンポーネント List。すべての props、イベント、ref メソッドを解説します。"
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`nsh` は `List` をエクスポートします。ネイティブのスクロールビュー上に構築された仮想化リストです。ビューポート付近の行だけが存在し、スクロールに応じてセルが再利用されます。どの行が存在するか、行の位置、列、スティッキーヘッダー、可視状態(viewability)はすべてネイティブ側で計算されるため、1万件のアイテムのリストをスクロールしても、セルの再利用時に変更される行のバインディング以外では JS は実行されません。

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

ガイドは [Lists](../docs/lists.md)、要素のプロパティは [`<List>`](../elements/list.md) を参照してください。

<a id="list-1"></a>

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### 行は再利用される

`children` は**1つのセル**を描画する関数です。アイテムごとではなくセルごとに1回だけ実行されます。セルが画面外にスクロールされると別のアイテムのために再利用され、`item()` と `index()`(どちらもアクセサ)が変化します。再利用時にセルが更新されるよう、これらは JSX 式(`{item().name}`)の中で読み取ってください。

> [!WARNING]
> 行関数の中で作成したシグナルにアイテムごとの状態を持たせないでください。セルは他のアイテムのために再利用されるため、シグナルはアイテムではなくセルに付いて回ります。状態は ID をキーにしてデータ側に保持してください(たとえば、選択された ID の `Set` を保持するシグナルなど)。

<a id="props"></a>

## プロパティ

`ListProps<T>` は、リスト自身のプロパティ、`<Scroll>` と共通のスクロール用プロパティ、およびすべての要素が受け取るプロパティを組み合わせたものです。これらはリストのスクロールビューに渡されます。

<a id="data-and-rendering"></a>

### データとレンダリング

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `each` | `readonly T[]` | (必須) | アイテム。変更を追従するにはシグナルの値(`each={items()}`)を渡します。表示中の行より上にアイテムを挿入しても、それらの行は位置を保ちます。 |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (必須) | 1行を描画します(上記参照)。 |
| `estimatedItemSize` | `number` | `50` | まだ計測されていない行の、リストの軸方向のサイズ(ポイント単位)。見積もりが近いほど、スクロールインジケーターと `scrollToIndex` の精度が高まります。 |
| `numColumns` | `number` | `1` | 1行あたりのアイテム数(縦方向のリスト)。グリッドになります。 |
| `horizontal` | `boolean` | `false` | 横方向にスクロールします。 |
| `inverted` | `boolean` | `false` | 末尾からレイアウトし、アイテム0が最後になります(チャット形式)。末尾までスクロールした状態で開始し、コンテンツが変化しても末尾からの距離を保ちます。 |
| `stickyHeaderIndices` | `number[]` | | スクロールで通り過ぎたときに先頭に固定されるアイテム(1列のみ、反転なし)。 |
| `header` | `ListSlot` | | アイテムの前に描画されます。 |
| `footer` | `ListSlot` | | アイテムの後に描画されます。 |
| `empty` | `ListSlot` | | `each` が空のとき、アイテムの代わりに表示されます。 |
| `separator` | `ListSlot` | | アイテム間に描画されます(1列のみ)。 |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`、`item.id`、またはインデックス | viewability トークンにおけるアイテムのキー。 |
| `initialScrollIndex` | `number` | | 最初のフレームの前にこのアイテムまでスクロールします。 |
| `contentStyle` | `ListContentStyle` | | コンテンツのパディングとギャップ: `padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`、`gap`、`rowGap`、`columnGap`(数値)。 |
| `contentClass` | `string` | | クラスで指定するコンテンツのパディングとギャップ(`p-*`、`gap-*`)。`contentStyle` が優先されます。 |
| `style` | `StyleProp<ViewStyle>` | | リスト自身のスタイル(サイズを指定してください: `flex: 1` または高さ)。 |
| `testID` | `string` | | UI テストがリストのスクロールビューを見つけるための ID(`nsh test` の `id:`、XCUITest、UI Automator)。 |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | [ref メソッド](#ref-methods)を参照してください。 |

`ListSlot` はコンポーネント(`Header`)または要素(`<Header />`)です。

<a id="loading-refreshing-and-viewability"></a>

### 読み込み、更新、viewability

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `onLoadMore` | `() => void` | | 末尾が `loadMoreThreshold` ビューポート以内に近づいたときに呼ばれます。追加読み込みに使います。 |
| `loadMoreThreshold` | `number` | `1` | `onLoadMore` が発火する末尾からの近さ(ビューポート長単位)。 |
| `onLoadMoreAtStart` | `() => void` | | ユーザーまたはスクロールコマンドがリストを動かした後、先頭が `loadMoreAtStartThreshold` ビューポート以内に近づいたときに呼ばれます。最初のアイテムより前のデータを読み込みます。 |
| `loadMoreAtStartThreshold` | `number` | `1` | `onLoadMoreAtStart` が発火する先頭からの近さ(ビューポート長単位)。 |
| `refreshing` | `boolean` | | プルして更新のスピナーを表示します。 |
| `onRefresh` | `() => void` | | プルして更新を有効にします。読み込み中は `refreshing` を設定してください。 |
| `refreshIndicator` | `{ height: number }` | | スピナーの代わりに、アプリが高さ `height` の独自のプルして更新インジケーターを描画します。 |
| `pullValue` | `AnimatedValue` | | そのインジケーター用に、リストが先頭を越えて引っ張られた量が渡されます。 |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 可視になった、または可視でなくなったアイテム。 |
| `viewabilityConfig` | `ViewabilityConfig` | | アイテムが可視とみなされる条件。 |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

<a id="scrolling"></a>

### スクロール

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | スクロールインジケーターを表示します。プラットフォーム標準のもの、またはアプリの[組み込みバー](../elements/scrollbar.md#built-in-bars)を使います。オブジェクトを渡すと、ビュー自身のテーマになります。 |
| `scrollable` | `boolean` | `true` | ユーザーがスクロールできます。 |
| `bounces` | `boolean` | `true` | 端を越えたオーバースクロール。 |
| `pagingEnabled` | `boolean` | `false` | ビューポートの倍数位置で止まります。 |
| `snapToInterval` | `number` | `0` | この長さの倍数位置で止まります(0: オフ)。 |
| `snapToOffsets` | `number[]` | | これらのオフセットで止まります。 |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | `snapToInterval` を使うとき、アイテムのどの点をビューポートに揃えるか。 |
| `disableIntervalMomentum` | `boolean` | `false` | フリングで移動するのは最大1つのスナップポイントまでです。 |
| `decelerationRate` | `"normal" \| "fast" \| number` | プラットフォーム依存 | フリングが減速する速さ(`0.998` / `0.99`、またはミリ秒ごとに保持される速度)。 |
| `contentInset` | `Partial<Edges>` | | コンテンツの周囲の余白。 |
| `contentOffset` | `{ x?, y? }` | | 開始位置。 |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | タップでキーボードを閉じるかどうか(`"never"`: タップはキーボードを閉じるだけです)。 |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | ドラッグでキーボードを閉じるかどうか。 |
| `scrollEventThrottle` | `number` | | `onScroll` イベント間の最小ミリ秒数(いずれにせよ1フレームにつき最大1回です)。 |
| `scrollValue` | `AnimatedValue` | | スクロール連動エフェクト用に、UI スレッド上でスクロールオフセット(主軸)が渡される[アニメーション値](./nsh.md#animation)。 |

<a id="scroll-events"></a>

### スクロールイベント

| イベント | ペイロード | 発火タイミング |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | スクロール中。 |
| `onScrollDragStart` | `{ offset }` | ドラッグが始まったとき。 |
| `onScrollDragEnd` | `{ offset }` | 指が離れたとき。 |
| `onMomentumStart` | `{ offset }` | ドラッグの後に滑走が始まったとき。 |
| `onMomentumEnd` | `{ offset }` | 滑走が終わったとき(新たなドラッグで止められた場合も含む)。 |
| `onScrollEnd` | `{ offset }` | スクロールが静止したとき。 |

リストは、すべての要素が受け取るプロパティ([共通プロパティ](../elements/index.md))も受け取ります。

<a id="ref-methods"></a>

## ref メソッド

リストの `ref` は `ListRef` を受け取ります。`ViewRef` のメソッドに加えて、次のメソッドが使えます。

| メソッド | 説明 |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | アイテム `index` が見える位置までスクロールします。`viewPosition` で配置を指定します。`0` はビューポートの先頭(デフォルト)、`0.5` は中央、`1` は末尾です。`viewOffset` でさらにずらせます。計測済み(または見積もり)の行サイズを使って、ネイティブ側で解決されます。 |
| `scrollToOffset({ offset, animated? })` | リストの軸に沿ったコンテンツオフセットまでスクロールします。 |
| `scrollToEnd({ animated? })` | コンテンツの末尾(反転リストでは先頭)までスクロールします。 |
| `scrollTo({ x?, y?, animated? })` | オフセットまでスクロールします。 |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

<a id="examples"></a>

## 例

チャットの例です。最新のメッセージが下に表示され、上にスクロールすると古いメッセージが読み込まれます。

```tsx
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
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

プルして更新:

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

`ListProps` のうち、データと行に関する半分です。たとえば、独自のパディングや区切り線を付けて `List` をラップする設定リストのように、リストのレイアウトを自分で行う独自コンポーネントに渡すものです。
