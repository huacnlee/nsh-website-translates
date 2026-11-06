---
title: "Scroll"
description: "原生捲動檢視:垂直及水平捲動、分頁與對齊、下拉更新、縮放及捲動事件。"
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---


# Scroll

`Scroll` 是原生捲動檢視（在 iOS 和 Mac Catalyst 上為 UIScrollView，在 Android 上為 ScrollView）。它會將所有子元件排版為其內容，並以原生方式捲動：捲動、拋甩、回彈和吸附都由平台以顯示器的更新率執行。Rust 以 `scroll()` 建立，TSX 則使用 `nsh` 中的 `<Scroll>`。

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

捲動檢視會建立所有子元件，適合中等大小的頁面。如果是很長或沒有上限的資料，請使用[列表](./list.md)：它只會為視口附近的列建立元件，並回收重用。

捲動檢視在其捲動軸向上需要有限的尺寸：請為它設定 `flex: 1`（`.flex_1()`），或將它放在有高度的容器內。其內容會按捲動檢視的寬度排版（橫向時按高度），而在捲動方向上的長度則按內容所需。

<a id="props"></a>

## 屬性

除了[通用屬性](./index.md#common-props)（`style` 的類型為 `ViewStyle`）之外，在 Rust 中，捲動屬性是 `Scrollable` trait 的方法，列表也共用這個 trait。

<a id="scrolling"></a>

### 捲動

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 橫向捲動。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 使用者可以捲動。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 是否顯示捲動指示條：使用平台的指示條，或在應用程式設定了主題後使用應用程式的[內建捲動條](./scrollbar.md#built-in-bars)；傳入物件則為此檢視自己的主題。在桌面和桌面瀏覽器上，橫向檢視會保留指示條，因為它是滑鼠的捲動條。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 可越過邊緣過度捲動。 |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | 停在視口的整數倍位置。 |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | 停在此長度的整數倍位置（0：關閉）。 |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | 停在這些偏移量。 |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | 配合 `snapToInterval` 時，項目的哪一點與視口對齊。 |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | 一次拋甩最多移動一個吸附點。 |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | 平台預設 | 拋甩減速的快慢：每毫秒保留的速度（`normal` 為 0.998，`fast` 為 0.99）。 |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | 內容四周的留白。 |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 起始位置。 |
| `contentStyle` | 內容檢視自身的樣式 | `ViewStyle` | | 包住子元件並隨之捲動的檢視的樣式；`flexGrow: 1` 會讓它的高度至少等於視口（例如置中的空狀態）。 |
| `contentClass` | 內容檢視自身的樣式 | `string` | | 與 classes 相同，例如 `"grow justify-center p-4"`。 |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳時是否收起鍵盤。 |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | 點擊時是否收起鍵盤：`never`（點擊只用來收起鍵盤）、`always`（鍵盤保持顯示）、`handled`（有元件處理該點擊時，鍵盤保持顯示）。 |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | 以捲動偏移量（主軸）驅動的動畫值，用於與捲動連動的動畫。 |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | `onScroll` 事件之間的最短間隔毫秒數（無論如何每個影格最多一次）。 |

<a id="pull-to-refresh"></a>

### 下拉重新整理

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | 顯示重新整理轉圈圖示。 |
| `onRefresh` | `.on_refresh(..)` | `() => void` | 使用者下拉要求重新整理：開始載入，並在載入結束前將 `refreshing` 設為 true。 |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | 應用程式自行繪製指示器，高度為 `height` 點：平台的轉圈圖示會隱藏，下拉到 `height` 即觸發重新整理，重新整理期間會在內容上方保留 `height`。高度為 0 或以下表示不使用。 |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | 以檢視被下拉超過頂部的距離驅動的動畫值（靜止時為 0，隨下拉增大；重新整理期間為內容上方保留的空間：`height` 配合 `refreshIndicator`），供應用程式的指示器使用。 |

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

<a id="zooming"></a>

### 縮放

將 `maximumZoomScale` 設為大於 `minimumZoomScale`（Rust 中為 `.zoom_range(min, max)`），內容即可透過雙指捏合縮放；放大後可向兩個方向捲動。列表不會縮放。

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最小縮放比例。 |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最大縮放比例。 |
| `zoomScale` | `.zoom(..)` | `number` | | 此值改變時縮放至該比例；否則保留使用者的縮放。 |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | 捏合時可超出限制，然後彈回。 |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | 使用者可以捏合縮放。 |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | 小於視口的內容（縮小時）會置中。 |

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

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 觸發時機 |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | 偏移量改變時（每個影格最多一次，且不會比 `scrollEventThrottle` 更頻密）。 |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }`（`Point<Points>`） | 使用者開始／停止拖曳。 |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 拖曳後的滑行開始／停止。被新的拖曳截停的滑行，仍然會以 `onMomentumEnd` 結束。 |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | 捲動靜止。 |
| `onRefresh` | `.on_refresh` | 無 | 下拉重新整理。 |

`ScrollEvent` 為 `{ offset: Point; contentSize: Size; size: Size; zoomScale }`（Rust 中為 `offset`、`content_size`、`size`、`zoom_scale`）：包含偏移量、（縮放後的）內容尺寸、視口尺寸，以及縮放比例（檢視不縮放時為 1）。

> [!TIP]
> 若要讓某些元素隨捲動位置移動（例如收縮的標題列、視差圖片），請將 `scrollValue` 綁定到原生值，並在樣式中進行插值。這會在 UI 執行緒上以顯示器的更新率運行，而 `onScroll` 則是每個影格在應用程式程式碼中觸發一次的事件。請參閱[動畫](../docs/animation.md)。

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | 捲動到指定偏移量。 |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | 縮放到 `scale`（限制在上下限之內），並將內容點（`x`、`y`，未縮放的點數）置於視口中央，或圍繞中央縮放。例如雙擊時放大到被點擊的位置。 |

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

<a id="keyboard"></a>

## 鍵盤

捲動檢視內的輸入元件會以原生方式避開鍵盤：捲動檢視會加上底部內距，並自動捲動到取得焦點的輸入元件。對於捲動檢視以外的內容，請在底部 padding 或 margin 中使用 [`env(keyboard-inset-height)`](./keyboard.md)。請參閱[表單與鍵盤](../docs/forms-and-keyboard.md)。

<a id="right-to-left"></a>

## 從右到左

在從右到左的版面配置中，橫向捲動檢視會從右端開始，並在內容改變時保持與右端的距離；其子元件會鏡像顯示。

<a id="platform-notes"></a>

## 平台備註

- Android：下拉重新整理由 NSH 繪製（過度捲動效果仍為原生），`contentInset` 會以 padding 套用，而 `decelerationRate` 會影響吸附滑行。
- Android 使用 NSH 自己的捲動檢視進行縮放，它會以左上角為基準縮放內容，並可向兩個方向捲動。捏合要在兩指間距超過 Android 的最小間距（約 27 mm）後才會開始。
- 在 Mac Catalyst（Mac idiom）上，NSH 會偵測下拉動作並顯示自己的轉圈圖示。
- 縮放結束時，iOS 會以縮放後的解析度重繪文字和 canvas。
