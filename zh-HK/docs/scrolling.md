---
title: "捲動"
description: "以 Rust 和 TSX 實作捲動檢視：分頁與對齊、縮放、下拉重新整理、捲動事件、使用 scrollValue 的捲動連動效果、捲動檢視中的鍵盤處理，以及透過程式碼控制捲動。"
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---


# 捲動

scroll view（Rust 中為 `scroll()`，TSX 中為 `<Scroll>`）是平台原生的 scroll view（iOS 上為 UIScrollView，Android 上為 ScrollView）：慣性滑動（fling）、回彈、捲動指示器和下拉重新整理都是原生的，吸附（snapping）也是。你的程式碼透過事件得知捲動情況，並可將偏移量綁定到[動畫值](./animation.md#animated-values)，製作逐幀跟隨手指的效果。

內容大小已知且適中時，請使用 scroll view，例如設定頁面、表單、文章或一排 chip。長資料或無上限的資料請使用 [list](./lists.md)，它會回收列，並接受相同的捲動屬性。

<a id="a-scroll-view"></a>

## 一個 scroll view

scroll view 是視口（viewport），其子項是內容。視口需要由父項給予大小（通常是 `flex: 1`、`.flex_1()`），內容則按視口的寬度（垂直）或高度（水平）排版，長度按需要而定。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

上面的子 view 是 scroll view 的內容容器；在 TSX 中，`contentStyle`（或 `contentClass`）會替你建立一個，將子項包在帶有該樣式的 view 中，並隨子項一起捲動。`flexGrow: 1`（`.flex_grow(1.0)`）令內容至少與視口一樣高，因此較短的內容可以置中，較長的內容仍可捲動：

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

水平 scroll view 使用 `horizontal`（`.horizontal()`），並以一個 row 作為子項：

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

在由右至左的排版下（參閱[裝置與環境](./device-and-environment.md#right-to-left)），水平 scroll view 從右端開始，並保持與右端的距離。

手指可拖動 scroll view。在桌面平台（macOS、Windows、Linux）和瀏覽器中，滑鼠的捲動方式與桌面應用程式相同：使用滾輪（Shift + 滾輪可水平捲動）、觸控板、鍵盤和捲動指示器；滑鼠移到 view 上時會顯示指示器，並可像捲軸一樣拖動；滑鼠拖動則交給應用程式的 pan、responder 和文字選取。桌面上的觸控螢幕會像手指一樣拖動 scroll view。水平 view 在桌面上即使設定了 `scrollbar={false}` 也會保留指示器，因為沒有水平滾輪的滑鼠要靠它來移動 view。

<a id="behavior-props"></a>

### 行為屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 水平捲動。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 用戶可以捲動。以程式碼捲動仍然有效。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 可捲過邊緣（過度捲動）。 |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | 顯示捲動指示器。在桌面和桌面瀏覽器中，水平 view 會保留指示器：它是滑鼠的捲軸。 |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | 內容四周的空間，可捲動進入。 |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 起始位置。 |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | 平台預設值 | 慣性滑動減速的快慢：`"normal"`、`"fast"`，或每毫秒保留的速度（`0.998` 為正常，`0.99` 為快速；`0` 為平台預設值）。 |

<a id="paging-and-snapping"></a>

## 分頁與吸附

吸附會在手指離開時由原生層根據放開時的偏移量、預計滑行距離和速度決定；之後 scroll view 會滑行至選定的停靠點，完全不涉及你的程式碼。

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | 停在視口大小的倍數位置。 |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | 停在此長度的倍數位置（0：關閉）。 |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | 停在這些偏移量。 |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | 配合 `snapToInterval`：項目的哪個位置與視口對齊。 |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | 一次 fling 最多移動一個停靠點。 |

分頁器：頁面與 scroll view 同寬，並在滑行結束時更新指示器。

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

卡片輪播，卡片吸附至中央，每次 fling 移動一張卡片：

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

list 接受相同的吸附屬性，因此較長的輪播更適合使用 list。

<a id="scroll-events"></a>

## 捲動事件

| 屬性 | Rust | 載荷 | 時機 |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | 偏移量改變。每幀最多一次；`scrollEventThrottle` 可進一步拉開間隔。 |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | `onScroll` 事件之間的最短毫秒數。 |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | 用戶開始拖動。 |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | 用戶提起手指。 |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | fling 之後的滑行開始。 |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | 滑行結束（新的拖動攔住滑行時也算）。 |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | 用戶的捲動停下：在滑行之後，或在沒有滑行的拖動結束時。 |

`ScrollEvent` 帶有偏移量（`offset`，一個 `Point`；Rust 中相同）、內容的大小（已計入縮放）（`contentSize`，一個 `Size`；`content_size`）、視口（`size`）以及 `zoomScale`（`zoom_scale`）。其他事件帶有偏移量：TSX 中為帶有 `Point` 的 `{ offset }`，Rust 中為 `Point<Points>`。

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` 會在捲動的每一幀執行你的程式碼（受節流限制）。如果只是要讓效果*看起來*與捲動連動，例如淡出的標題或視差圖片，請改用 [`scrollValue`](#scroll-linked-effects-scrollvalue)：它完全在原生層執行。

<a id="scroll-linked-effects-scrollvalue"></a>

## 與捲動連動的效果：scrollValue

`scrollValue`（`.scroll_value(&value)`）接受一個[動畫值](./animation.md#animated-values)，並在內容移動的同一幀，以原生方式將捲動偏移量（沿主軸）寫入其中。將該值，或由它經 `interpolate`、`diffClamp`（`diff_clamp`）或算術運算衍生出的節點，綁定到樣式。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

內容向上捲動時滑走、一向下捲動就立即回來的標題，是偏移量的 `diffClamp`：

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

插值預設會在輸入範圍之外進行限制（clamp），因此拉過頂部（負偏移量）時，效果會停留在終點；如要製作拉動時會變大的伸展式標題，請傳入 `extrapolate: "extend"`（Rust 中為 `interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))`）。

<a id="pull-to-refresh"></a>

## 下拉重新整理

`refreshing` 和 `onRefresh`（`.refreshing(..)` 和 `.on_refresh(..)`）會加入平台的下拉重新整理控制項。當 `refreshing` 為 true 時顯示該控制項；在 `onRefresh` 中設定它，並在工作完成時清除。

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

在 iOS 上，該控制項是 UIRefreshControl；在 Mac Catalyst 的 Mac 風格（idiom）下，NSH 會顯示自己的 spinner，行為相同。list 接受相同的屬性。在桌面和瀏覽器中，下拉是觸控螢幕的手勢（或 macOS 觸控板拉過頂部的手勢），因為滑鼠捲動時不會拖動；請在那裏提供其他重新整理方式，例如按鈕或鍵盤快速鍵。

<a id="an-indicator-of-your-own"></a>

### 自訂指示器

下拉的外觀由應用程式自行決定。`refreshIndicator={{ height }}` 表示應用程式自行繪製指示器，高度為 `height` point：平台的 spinner 會隱藏，下拉到 `height` 時便會重新整理，而重新整理期間會在內容上方保留 `height` 給指示器。`pullValue` 會將內容被拉過頂部的距離傳入一個動畫值：靜止時為 0，隨下拉增大，重新整理期間為 `height`。將指示器繪製在 scroll view 頂部之上，並由該值對其樣式進行插值：它們會在 UI thread 上跟隨手指，每幀都不需要 JS。

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

請將 `height` 保持在視口的一半以內：越過頂部後，拉得越遠，內容對手指的阻力越大，過高的高度永遠無法達到。在 iOS 上，應用程式自訂的指示器會以 NSH 自行偵測的下拉取代 UIRefreshControl，與 Mac idiom 相同。

<a id="zooming"></a>

## 縮放

當最大縮放比例高於最小縮放比例時，scroll view（list 的縮放比例固定為 1）便可縮放：雙指捏合會縮放內容，放大時可向兩個方向捲動。

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最小縮放比例。 |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最大縮放比例；高於最小值時，可捏合縮放。 |
| `zoomScale` | `.zoom(scale)` | `number` | | 屬性改變時縮放至此比例；否則保留用戶的縮放。 |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | 捏合可超出限制，並會彈回。 |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | 用戶可捏合縮放。 |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | 小於視口的內容（縮小時）會置中。 |

捲動事件會回報縮放比例和縮放後的內容大小。在程式碼中，`zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` 會縮放，使內容點（以未縮放的 point 計）落在視口中央；雙擊縮放就是由 press handler 呼叫它：

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

縮放結束後，已縮放的 scroll view 內的文字和 canvas 會以新的解像度重新繪製，因此在 iOS 上保持清晰。在 Android 上，NSH 使用自己的 scroll view 來縮放，它會以捏合的焦點為中心縮放、可用任意數量的手指平移、支援 fling，並在邊緣和縮放限制處產生橡皮筋效果。Android 在手指相距約 27 mm 時才開始捏合，與系統的手勢偵測器相同。

<a id="scrolling-from-code"></a>

## 以程式碼捲動

為 scroll view 提供 ref（Rust 中是 `element_ref()` 和 `.element_ref(&scroller)`，TSX 中是 [`ref`](./jsx-and-components.md)）並呼叫其方法。命令會在同一次更新的其他變更之後執行，因此捲動至剛加入的內容也能正常運作。

| Rust | TSX | 說明 |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 捲動至某個偏移量。在 TSX 中預設帶動畫。 |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | 可縮放的 scroll view：縮放至 `scale`（限制在範圍內），以內容點或中央為中心。 |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

list 另外提供 `scrollToIndex`、`scrollToOffset` 和 `scrollToEnd`；參閱 [Lists](./lists.md#scrolling-from-code)。

<a id="scroll-views-and-the-keyboard"></a>

## scroll view 與鍵盤

NSH 會自動讓取得焦點的輸入框保持可見：鍵盤顯示時，輸入框外圍的 scroll view 會獲得與鍵盤同高的底部內邊距（inset），並將輸入框捲動至可見位置。這是原生完成的，你的應用程式無需任何程式碼。對於 scroll view 以外的內容，例如固定在底部的訊息列，請使用 `env(keyboard-inset-height)` 作為底部 padding（[scroll view 以外的內容](./forms-and-keyboard.md#content-outside-scroll-views)）。

兩個屬性決定捲動和點按如何與鍵盤互動：

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖動內容時是否隱藏鍵盤。`"interactive"` 讓鍵盤在 iOS 上跟隨手指下移；在 Android 上則與 `"on-drag"` 相同。 |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | 鍵盤顯示時點按的行為。 |

`keyboardShouldPersistTaps`：

- `"never"`：在取得焦點的輸入框以外點按只會隱藏鍵盤，按鈕要等下一次點按才會收到。用戶點一次以收起鍵盤，再點一次才按下。
- `"handled"`：點按會處理點按的元件（例如按鈕）時，點按會直接穿透，鍵盤保持顯示；點按空白處則隱藏鍵盤。通常是表單的正確選擇。
- `"always"`：每次點按鍵盤都保持顯示。

兩者都在點按或拖動發生時由原生層決定，無需等待你的程式碼。如要從程式碼隱藏鍵盤，Rust 中呼叫 `dismiss_keyboard()`，TSX 中呼叫 [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) 的 `Keyboard.dismiss()`。

<a id="nested-scroll-views"></a>

## 巢狀 scroll view

垂直 scroll view 內的水平 scroll view 會如預期運作：各自處理沿自身軸向的拖動。同一軸向的兩個 scroll view 也可以巢狀（內層先捲動）。需要手指的 responder，例如 scroll view 內的繪圖 canvas，會令外圍的 scroll view 無法取得手指：Rust 中使用 `.keep_touches(true)`，TSX 中由 `onResponderGrant` 回傳 `true`；參閱[觸控與手勢](./touch-and-gestures.md#the-responder-system)。

<a id="related"></a>

## 相關內容

- [Scroll](../elements/scroll.md)：元素參考，包含所有屬性和事件。
- [Lists](./lists.md)：虛擬化 list，使用相同的捲動屬性。
- [動畫](./animation.md)：動畫值，以及用於捲動連動效果的 `interpolate` 和 `diffClamp`。
- [表單與鍵盤](./forms-and-keyboard.md)：輸入框、焦點與鍵盤。
