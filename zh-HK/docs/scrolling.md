---
title: "捲動"
description: "使用 Rust 與 TSX 的捲動檢視：分頁與對齊、縮放、下拉重新整理、捲動事件、搭配 scrollValue 的捲動連動效果、捲動檢視中的鍵盤，以及透過程式碼進行捲動。"
order: 39
group: ui
demo: guide-scrolling
---

# 捲動

捲動檢視（Rust 中為 `scroll()`，TSX 中為 `<Scroll>`）就是平台原生的捲動檢視（iOS 上是 UIScrollView，Android 上是 ScrollView）：甩動（fling）、邊緣回彈、捲動指示器和下拉重新整理都是原生的，吸附（snapping）也是。你的程式碼透過事件得知捲動狀態，也可以把偏移量繫結到[動畫值](./animation.md#animated-values)，做出逐幀跟隨手指的效果。

捲動檢視適用於大小已知且適中的內容：設定頁面、表單、文章、一排標籤。對於很長或沒有上限的資料，請使用[清單](./lists.md)，它會回收列，並接受相同的捲動屬性。

<a id="a-scroll-view"></a>

## 捲動檢視

捲動檢視是可視區域（viewport），它的子元素是內容。可視區域需要由父層給定大小（通常是 `flex: 1`、`.flex_1()`），內容則以可視區域的寬度（垂直捲動）或高度（水平捲動）進行配置，長度則依內容需要而定。

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

上面的子檢視是捲動檢視的內容容器；在 TSX 中，`contentStyle`（或 `contentClass`）會替你建立一個，將子元素包在套用該樣式的檢視中，並一起捲動。`flexGrow: 1`（`.flex_grow(1.0)`）會讓內容至少與可視區域一樣高，因此較短的內容可以置中，較長的內容仍然可以捲動：

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

水平捲動檢視使用 `horizontal`（`.horizontal()`），並以一個橫列（row）作為子元素：

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

在從右到左的排版下（請參閱[裝置與環境](./device-and-environment.md#right-to-left)），水平捲動檢視會從右端開始，並保持與右端的距離。

手指可以拖曳捲動檢視。在桌面平台（macOS、Windows、Linux）和瀏覽器中，滑鼠的捲動方式與桌面應用程式相同：使用滾輪（Shift + 滾輪可水平捲動）、觸控板、鍵盤和捲動指示器；滑鼠移到檢視上時會顯示指示器，並可作為捲軸拖曳。滑鼠拖曳則交給應用程式的平移（pan）、responder 和文字選取。桌面裝置上的觸控螢幕與手指一樣可以拖曳捲動檢視。水平檢視即使設定了 `scrollbar={false}`，在這些平台上仍會保留指示器，因為沒有水平滾輪的滑鼠需要靠它來捲動。

<a id="behavior-props"></a>

### 行為屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 橫向捲動。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 使用者可以捲動。從程式碼捲動仍然有效。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 可超出邊緣過度捲動。 |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | 顯示捲動指示器。在桌面平台和桌面瀏覽器上，水平檢視會保留它：它是滑鼠的捲軸。 |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | 內容周圍的空間，可捲動進入。 |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 起始位置。 |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | 平台預設值 | 甩動減速的快慢：`"normal"`、`"fast"`，或每毫秒保留的速度（`0.998` 為一般，`0.99` 為快速；`0` 為平台預設值）。 |

<a id="paging-and-snapping"></a>

## 分頁與吸附

吸附由原生端在手指離開時決定，依據放開時的偏移量、預估的滑行距離和速度；捲動檢視接著會滑行到選定的停駐點，完全不需要你的程式碼介入。

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | 停在可視區域大小的整數倍處。 |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | 停在此長度的整數倍處（0：關閉）。 |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | 停在這些偏移量處。 |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | 搭配 `snapToInterval`：項目的哪個位置與可視區域對齊。 |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | 一次甩動最多移動一個停駐點。 |

分頁器範例：頁面寬度與捲動檢視相同，並在滑行結束時更新指示器。

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

吸附到中央的卡片輪播，每次甩動移動一張卡片：

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

清單也接受相同的吸附屬性，因此較長的輪播更適合使用清單。

<a id="scroll-events"></a>

## 捲動事件

| 屬性 | Rust | 事件資料 | 觸發時機 |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | 偏移量改變。每幀最多一次；`scrollEventThrottle` 可拉長間隔。 |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | `onScroll` 事件之間的最小間隔毫秒數。 |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | 使用者開始拖曳。 |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | 使用者放開手指。 |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | 甩動後的滑行開始。 |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | 滑行結束（新的拖曳攔住滑行時也會觸發）。 |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | 使用者的捲動停止：在滑行之後，或在沒有滑行的拖曳結束時。 |

`ScrollEvent` 包含偏移量（`offset`，一個 `Point`；Rust 中相同）、內容大小、縮放後的大小（`contentSize`，一個 `Size`；`content_size`）、可視區域（`size`）以及 `zoomScale`（`zoom_scale`）。其他事件則包含偏移量：TSX 中為 `{ offset }` 搭配 `Point`，Rust 中為 `Point<Points>`。

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
> `onScroll` 會在捲動的每一幀執行你的程式碼（受節流設定限制）。如果只是要讓某些效果*看起來*與捲動連動，例如淡出的標頭或視差圖片，請改用 [`scrollValue`](#scroll-linked-effects-scrollvalue)：它完全在原生端執行。

<a id="scroll-linked-effects-scrollvalue"></a>

## 與捲動連動的效果：scrollValue

`scrollValue`（`.scroll_value(&value)`）接受一個[動畫值](./animation.md#animated-values)，並在內容移動的同一幀，於原生端把（主軸方向的）捲動偏移量寫入其中。你可以把這個值，或由它透過 `interpolate`、`diffClamp`（`diff_clamp`）或算術運算衍生的節點，繫結到樣式上。

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

向上捲動時滑出、向下捲動時立刻回來的標頭，是偏移量的 `diffClamp`：

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

內插預設會在輸入範圍之外進行夾限（clamp），因此拉過頂端（負偏移量）時，效果會維持在終點；若要做出下拉時會變大的彈性標頭，請傳入 `extrapolate: "extend"`（Rust 中為 `interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))`）。

<a id="pull-to-refresh"></a>

## 下拉重新整理

`refreshing` 和 `onRefresh`（`.refreshing(..)` 和 `.on_refresh(..)`）會加入平台的下拉重新整理控制項。當 `refreshing` 為 true 時顯示該控制項；請在 `onRefresh` 中設定它，並在工作完成時清除。

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

在 iOS 上，該控制項是 UIRefreshControl；在 Mac Catalyst 的 Mac 慣用模式中，NSH 會顯示自己的旋轉指示器，行為相同。清單也接受相同的屬性。在桌面平台和瀏覽器中，下拉是觸控螢幕（或 macOS 觸控板，可拉過頂端）的手勢，因為滑鼠捲動時不會拖曳；請在這些平台上提供其他重新整理的方式，例如按鈕或鍵盤快速鍵。

<a id="an-indicator-of-your-own"></a>

### 自訂指示器

下拉的外觀由應用程式自行決定。`refreshIndicator={{ height }}` 表示應用程式自行繪製指示器，`height` 指定其高度（以點為單位）：平台的旋轉指示器會被隱藏，下拉達到 `height` 時觸發重新整理，重新整理期間會在內容上方保留 `height` 的空間給指示器。`pullValue` 會以內容被拉過頂端的距離來更新一個動畫值：靜止時為 0，隨下拉增大，重新整理期間為 `height`。把指示器繪製在捲動檢視的頂端，並依該值內插其樣式：它們會在 UI 執行緒上跟隨手指，每幀都不需要 JS。

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

請讓 `height` 保持在可視區域高度的一半以內：拉過頂端後，內容越往下拉，對手指的阻力越大，過高的高度永遠無法達到。在 iOS 上，應用程式自己的指示器會以 NSH 自行偵測的下拉取代 UIRefreshControl，與 Mac 慣用模式相同。

<a id="zooming"></a>

## 縮放

當最大縮放比例大於最小縮放比例時，捲動檢視（清單的縮放比例固定為 1）可以縮放：雙指捏合會縮放內容，放大時可以雙向捲動。

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最小縮放。 |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最大縮放；大於最小值時，可用捏合縮放。 |
| `zoomScale` | `.zoom(scale)` | `number` | | 屬性改變時縮放到此比例；否則保留使用者的縮放。 |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | 捏合可超出限制，並彈回。 |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | 使用者可以捏合縮放。 |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | 小於可視區域的內容（縮小時）會置中。 |

捲動事件會回報縮放比例和縮放後的內容大小。從程式碼呼叫 `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` 時，會縮放並讓該內容座標點（以未縮放的點為單位）落在可視區域的中央；雙擊縮放就是呼叫它的按壓處理函式：

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

縮放後的捲動檢視中的文字和畫布，會在縮放結束時以新的解析度重新繪製，因此在 iOS 上能保持清晰。在 Android 上，NSH 使用自己的捲動檢視來縮放，它會以捏合的焦點為中心縮放、支援任意數量手指的平移、甩動，並在邊緣和縮放限制處產生橡皮筋效果。Android 在手指間距約 27 mm 時才開始捏合，與系統的手勢偵測器相同。

<a id="scrolling-from-code"></a>

## 從程式碼捲動

為捲動檢視指定一個 ref（Rust 中為 `element_ref()` 和 `.element_ref(&scroller)`，TSX 中為 [`ref`](./jsx-and-components.md)），然後呼叫它的方法。這些命令會在同一次更新中的其他變更之後執行，因此捲動到剛加入的內容也能正常運作。

| Rust | TSX | 說明 |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 捲動到指定偏移量。TSX 中預設帶有動畫。 |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | 可縮放的捲動檢視：縮放到 `scale`（受限於縮放限制），以內容座標點或中央為中心。 |

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

清單另外提供 `scrollToIndex`、`scrollToOffset` 和 `scrollToEnd`；請參閱[清單](./lists.md#scrolling-from-code)。

<a id="scroll-views-and-the-keyboard"></a>

## 捲動檢視與鍵盤

NSH 會自動讓獲得焦點的輸入框保持可見：鍵盤顯示時，輸入框外層的捲動檢視會取得與鍵盤同高的底部內縮（inset），並把輸入框捲動到可見位置。這是在原生端完成的，應用程式中不需要任何程式碼。對於捲動檢視以外的內容，例如固定在底部的訊息列，請把 `env(keyboard-inset-height)` 當作底部內距使用（[捲動檢視以外的內容](./forms-and-keyboard.md#content-outside-scroll-views)）。

有兩個屬性決定捲動和點擊如何與鍵盤互動：

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳內容是否會隱藏鍵盤。`"interactive"` 會讓鍵盤在 iOS 上跟著手指向下收起；在 Android 上，其行為與 `"on-drag"` 相同。 |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | 鍵盤顯示時，點擊會有什麼作用。 |

`keyboardShouldPersistTaps`：

- `"never"`：在獲得焦點的輸入框之外點擊，只會隱藏鍵盤，按鈕要等到下一次點擊才會作用。使用者要先點一次來關閉鍵盤，再點一次來按下按鈕。
- `"handled"`：點擊會處理該事件的元素（例如按鈕）時，事件會穿透並讓鍵盤保持顯示；點擊空白處則會隱藏鍵盤。通常是表單的最佳選擇。
- `"always"`：無論點擊什麼，鍵盤都保持顯示。

這兩者都在點擊或拖曳發生時由原生端決定，不需要等待你的程式碼。若要從程式碼隱藏鍵盤，在 Rust 中呼叫 `dismiss_keyboard()`，在 TSX 中呼叫 [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) 的 `Keyboard.dismiss()`。

<a id="nested-scroll-views"></a>

## 巢狀捲動檢視

垂直捲動檢視內的水平捲動檢視會如預期運作：各自處理沿著自己軸向的拖曳。兩個同軸向的捲動檢視也可以巢狀（內層先捲動）。需要手指的 responder，例如捲動檢視內的繪圖畫布，會讓外層的捲動檢視無法取得手指：Rust 中使用 `.keep_touches(true)`，TSX 中使用從 `onResponderGrant` 回傳的 `true`；請參閱[觸控與手勢](./touch-and-gestures.md#the-responder-system)。

<a id="related"></a>

## 相關內容

- [Scroll](../elements/scroll.md)：元素參考文件，包含所有屬性和事件。
- [清單](./lists.md)：具有相同捲動屬性的虛擬化清單。
- [動畫](./animation.md)：動畫值，以及用於捲動連動效果的 `interpolate` 和 `diffClamp`。
- [表單與鍵盤](./forms-and-keyboard.md)：輸入框、焦點和鍵盤。
