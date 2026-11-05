---
title: "Scroll"
description: "原生捲動視圖:垂直與水平捲動、分頁與對齊、下拉重新整理、縮放以及捲動事件。"
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# Scroll

`Scroll` 是原生的捲動檢視（在 iOS 和 Mac Catalyst 上為 UIScrollView，在 Android 上為 ScrollView）。它會將所有子元件排版為其內容，並以原生方式捲動：捲動、拋甩（fling）、回彈與對齊都在平台端以顯示器的更新率執行。在 Rust 中使用 `scroll()` 建立，在 TSX 中則使用來自 `nsh` 的 `<Scroll>`。

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

捲動檢視會建立所有的子元件，適合中等大小的頁面。若是資料很長或沒有上限，請使用[列表](./list.md)：它只會建立可視區域附近的列，並回收重複使用。

捲動檢視在其捲動軸向上需要有限的尺寸：請為它設定 `flex: 1`（`.flex_1()`），或將它放在已有高度的容器中。其內容會以捲動檢視的寬度（水平捲動時為高度）進行排版，並依需要延伸高度（寬度）。

## Props

除了[通用屬性](./index.md#common-props)之外（其中 `style` 的型別為 `ViewStyle`）。在 Rust 中，捲動相關屬性是 `Scrollable` trait 的方法，列表也共用這個 trait。

### Scrolling

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 水平捲動。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 使用者可以捲動。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 是否顯示捲動指示器：使用平台的指示器，或在應用程式設定主題後使用應用程式的[內建捲軸](./scrollbar.md#built-in-bars)；物件值表示該檢視專屬的主題。在桌面平台與桌面瀏覽器上，水平檢視會保留它：它就是滑鼠使用的捲軸。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 可超出邊緣過度捲動。 |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | 停在可視區域的整數倍位置。 |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | 停在此長度的整數倍位置（0：關閉）。 |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | 停在這些位移量。 |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | 使用 `snapToInterval` 時，項目的哪一個點會與可視區域對齊。 |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | 一次拋甩最多只移動一個對齊點。 |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | 平台預設 | 拋甩減速的快慢：每毫秒保留的速度比例（`normal` 為 0.998，`fast` 為 0.99）。 |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | 內容周圍的留白。 |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 起始位置。 |
| `contentStyle` | 內容檢視自身的樣式 | `ViewStyle` | | 包住子元件並隨之捲動的檢視樣式；`flexGrow: 1` 會讓它的高度至少與可視區域一樣高（例如置中的空狀態）。 |
| `contentClass` | 內容檢視自身的樣式 | `string` | | 與 classes 相同，例如 `"grow justify-center p-4"`。 |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳時是否收起鍵盤。 |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | 點擊時是否收起鍵盤：`never`（點擊只會收起鍵盤）、`always`（鍵盤保持顯示）、`handled`（若有其他元件處理該點擊，鍵盤保持顯示）。 |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | 以捲動位移量（主軸）驅動的動畫值，用於與捲動連動的動畫。 |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | `onScroll` 事件之間的最小間隔毫秒數（無論如何每個影格最多一次）。 |

### Pull to refresh

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | 顯示重新整理的旋轉指示器。 |
| `onRefresh` | `.on_refresh(..)` | `() => void` | 使用者下拉以重新整理：開始載入，並在結束前將 `refreshing` 設為開啟。 |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | 由應用程式自行繪製指示器，高度為 `height` 點：平台的旋轉指示器會被隱藏，下拉達到 `height` 時即觸發重新整理，重新整理期間會在內容上方保留 `height` 的空間。高度為 0 或更小表示不使用。 |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | 以檢視被下拉超過頂端的距離驅動的動畫值（靜止時為 0，隨下拉增大；重新整理期間在內容上方保留的空間：`height` 搭配 `refreshIndicator`），供應用程式自己的指示器使用。 |

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

將 `maximumZoomScale` 設為大於 `minimumZoomScale`（Rust 中為 `.zoom_range(min, max)`）時，內容即可透過雙指縮放來放大縮小；放大後可在兩個方向上捲動。列表不會縮放。

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最小縮放比例。 |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最大縮放比例。 |
| `zoomScale` | `.zoom(..)` | `number` | | 當此值變更時縮放到該比例；否則保留使用者的縮放。 |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | 雙指縮放可超出限制，並會彈回。 |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | 使用者可以雙指縮放。 |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | 小於可視區域的內容（縮小時）會置中。 |

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

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | 位移量改變時（每個影格最多一次，且頻率不超過 `scrollEventThrottle`）。 |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }`（`Point<Points>`） | 使用者開始／停止拖曳。 |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 拖曳後的滑行開始／結束。被新的拖曳中斷的滑行仍會以 `onMomentumEnd` 結束。 |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | 捲動靜止。 |
| `onRefresh` | `.on_refresh` | 無 | 下拉重新整理。 |

`ScrollEvent` 為 `{ offset: Point; contentSize: Size; size: Size; zoomScale }`（在 Rust 中為 `offset`、`content_size`、`size`、`zoom_scale`）：位移量、（縮放後的）內容尺寸、可視區域尺寸，以及縮放比例（檢視不縮放時為 1）。

> [!TIP]
> 若要讓某個元素隨捲動位置移動（例如逐漸縮小的標題列、視差圖片），請將 `scrollValue` 綁定到原生值，並在樣式中進行插值。它在 UI 執行緒上以顯示器的更新率執行，而 `onScroll` 則是每個影格都會在應用程式程式碼中觸發的事件。請參閱[動畫](../docs/animation.md)。

## Ref methods

| 方法 | Rust | 說明 |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | 捲動到指定位移量。 |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | 縮放到 `scale`（會限制在上下限內），並讓內容上的點（`x`、`y`，未縮放的點座標）位於可視區域中央，或在中央附近縮放。例如雙擊時對被點擊的位置放大。 |

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

捲動檢視內的輸入元件會以原生方式避開鍵盤：捲動檢視會取得底部內縮，並自動捲動到取得焦點的輸入元件。對於捲動檢視之外的內容，請在底部的 padding 或 margin 中使用 [`env(keyboard-inset-height)`](./keyboard.md)。請參閱[表單與鍵盤](../docs/forms-and-keyboard.md)。

## Right to left

在由右至左的版面配置中，水平捲動檢視會從右端開始，並在內容改變時保持與右端的距離；其子元件會被鏡像。

## Platform notes

- Android：下拉重新整理由 NSH 繪製（過度捲動仍為原生效果），`contentInset` 會以 padding 方式套用，`decelerationRate` 則決定對齊滑行的曲線。
- Android 使用 NSH 自己的捲動檢視來縮放，它會以內容左上角為基準縮放內容，並可在兩個方向上捲動。雙指縮放要在兩指間距超過 Android 的最小間距（約 27 毫米）後才會開始。
- 在 Mac Catalyst（Mac idiom）上，NSH 會偵測下拉動作並顯示其旋轉指示器。
- iOS 會在縮放結束時，以縮放後的解析度重新繪製文字與 canvas。
