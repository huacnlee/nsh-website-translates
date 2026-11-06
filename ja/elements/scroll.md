---
title: "スクロール"
description: "ネイティブのスクロールビュー:縦方向・横方向のスクロール、ページングとスナップ、プルトゥリフレッシュ、ズーム、スクロールイベント。"
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# Scroll

`Scroll` は、ネイティブのスクロールビューです(iOS と Mac Catalyst では UIScrollView、Android では ScrollView)。すべての子要素をコンテンツとしてレイアウトし、ネイティブにスクロールさせます。スクロール、フリング、バウンス、スナップはプラットフォーム側でディスプレイのリフレッシュレートで動作します。Rust では `scroll()`、TSX では `nsh` の `<Scroll>` で作成します。

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

スクロールビューはすべての子要素を作成するため、中程度のサイズのページに向いています。長いデータや際限のないデータには[リスト](./list.md)を使用してください。リストはビューポート付近の行だけを作成し、再利用します。

スクロールビューにはスクロール方向に境界のあるサイズが必要です。`flex: 1`(`.flex_1()`)を指定するか、境界のある高さを持つコンテナー内に配置してください。コンテンツはスクロールビューの幅(横スクロールの場合は高さ)でレイアウトされ、必要なだけの高さ(幅)になります。

## Props

[共通プロパティ](./index.md#common-props)(`style` の型は `ViewStyle`)に加えて、以下のプロパティがあります。Rust では、スクロール関連のプロパティは `Scrollable` トレイトのメソッドで、リストと共通です。

### Scrolling

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 横方向にスクロールします。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | ユーザーがスクロールできます。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | スクロールインジケーターを表示します。プラットフォーム標準のもの、またはアプリがテーマを設定した後は、アプリの[組み込みバー](./scrollbar.md#built-in-bars)が表示されます。オブジェクトを渡すと、そのビュー専用のテーマになります。デスクトップとデスクトップブラウザーでは、横スクロールのビューはインジケーターを維持します。マウス用のスクロールバーだからです。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 端を越えてオーバースクロールします。 |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | ビューポートの倍数の位置で止まります。 |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | この長さの倍数の位置で止まります(0 でオフ)。 |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | これらのオフセットで止まります。 |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | `snapToInterval` を使うとき、アイテムのどの位置をビューポートに揃えるかを指定します。 |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | フリングで移動できるのは最大で 1 つのスナップポイントまでです。 |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | プラットフォーム依存 | フリングが減速する速さです。1 ミリ秒あたりに保持される速度で指定します(`normal` は 0.998、`fast` は 0.99)。 |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | コンテンツの周囲の余白です。 |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 開始位置です。 |
| `contentStyle` | コンテンツビュー自身のスタイル | `ViewStyle` | | 子要素を囲み、子要素と一緒にスクロールするビューのスタイルです。`flexGrow: 1` を指定すると、少なくともビューポートと同じ高さになります(中央に配置する空状態の表示など)。 |
| `contentClass` | コンテンツビュー自身のスタイル | `string` | | classes と同じです。例: `"grow justify-center p-4"`。 |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | ドラッグでキーボードを閉じるかどうかを指定します。 |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | タップでキーボードを閉じるかどうかを指定します。`never`(タップはキーボードを閉じるだけ)、`always`(キーボードは表示されたまま)、`handled`(タップを処理するものがあればキーボードは表示されたまま)。 |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | スクロールオフセット(主軸)が入力されるアニメーション値で、スクロール連動アニメーション用です。 |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | `onScroll` イベントの最小間隔(ミリ秒)です(いずれにしても 1 フレームにつき最大 1 回です)。 |

### Pull to refresh

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | リフレッシュ用のスピナーを表示します。 |
| `onRefresh` | `.on_refresh(..)` | `() => void` | ユーザーがプルして更新しました。読み込みを開始し、終了するまで `refreshing` を設定してください。 |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | アプリが独自のインジケーターを描画します。高さは `height` ポイントです。プラットフォームのスピナーは非表示になり、プルが `height` に達するとリフレッシュが実行され、リフレッシュ中はコンテンツの上に `height` が確保されます。高さが 0 以下の場合は、インジケーターなしになります。 |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | ビューが上端を越えてどれだけプルされたかが入力されるアニメーション値です(静止時は 0、プルに応じて増加します。リフレッシュ中にコンテンツの上に確保される余白は `height`(`refreshIndicator` 使用時)です)。アプリ独自のインジケーター用です。 |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

### Zooming

`maximumZoomScale` を `minimumZoomScale`(Rust では `.zoom_range(min, max)`)より大きく設定すると、ピンチでコンテンツをズームできます。ズームインすると、縦横両方向にスクロールできます。リストはスケールを維持します。

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最小のズームです。 |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最大のズームです。 |
| `zoomScale` | `.zoom(..)` | `number` | | この値が変わると、そのスケールにズームします。それ以外のときは、ユーザーが操作したズームが維持されます。 |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | ピンチ操作で上限・下限を超えることができ、離すと元に戻ります。 |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | ユーザーがピンチでズームできます。 |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | ビューポートより小さい(ズームアウトした)コンテンツを中央に配置します。 |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

## Events

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | オフセットが変化したとき(1 フレームにつき最大 1 回、かつ `scrollEventThrottle` より短い間隔では発生しません)。 |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }`(`Point<Points>`) | ユーザーがドラッグを開始 / 終了したとき。 |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | ドラッグ後の慣性スクロールが開始 / 終了したとき。新しいドラッグで止められた慣性スクロールも、最後に `onMomentumEnd` が発生します。 |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | スクロールが静止したとき。 |
| `onRefresh` | `.on_refresh` | なし | プルして更新されたとき。 |

`ScrollEvent` は `{ offset: Point; contentSize: Size; size: Size; zoomScale }`(Rust では `offset`、`content_size`、`size`、`zoom_scale`)です。内容は、オフセット、(ズーム後の)コンテンツサイズ、ビューポートサイズ、ズームスケール(ビューがズームしない場合は 1)です。

> [!TIP]
> スクロール位置に合わせて何かを動かしたい場合(縮小するヘッダーやパララックス画像など)は、`scrollValue` をネイティブ値にバインドし、スタイル内で補間してください。この処理は UI スレッド上でディスプレイのリフレッシュレートで実行されます。一方、`onScroll` はアプリのコードで 1 フレームごとに発生するイベントです。[アニメーション](../docs/animation.md)を参照してください。

## Ref methods

| メソッド | Rust | 説明 |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | 指定したオフセットまでスクロールします。 |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | `scale`(上限・下限に丸められます)にズームします。コンテンツ上の点(`x`、`y`、ズームされていない座標)をビューポートの中央に置くか、中央付近を基準にします。例: ダブルタップでタップした点を拡大する場合など。 |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

## Keyboard

スクロールビュー内の入力欄は、ネイティブの仕組みでキーボードに隠れないように保たれます。スクロールビューに下部インセットが設定され、フォーカスされた入力欄まで自動的にスクロールされます。スクロールビューの外にあるコンテンツには、下部のパディングまたはマージンで [`env(keyboard-inset-height)`](./keyboard.md) を使用してください。[フォームとキーボード](../docs/forms-and-keyboard.md)を参照してください。

## Right to left

横スクロールのビューは、右から左へのレイアウトでは右端から始まり、コンテンツが変化しても右端からの距離を保ちます。子要素は左右反転されます。

## Platform notes

- Android: プルして更新は NSH が描画します(オーバースクロールはネイティブのままです)。`contentInset` はパディングとして適用され、`decelerationRate` は、スナップ時の慣性スクロールの動きを決めます。
- Android では、NSH 独自のスクロールビューでズームします。このビューはコンテンツを左上を基準に拡大縮小し、縦横両方向にスクロールします。ピンチは、Android が定める指の間隔の最小値(約 27 mm)を超えてから始まります。
- Mac Catalyst(Mac イディオム)では、NSH がプルを検出してスピナーを表示します。
- iOS では、ズームが終了すると、テキストとキャンバスをズーム後の解像度で再描画します。
