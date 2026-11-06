---
title: "Overlay"
description: "Overlay 元素:在畫面最上層顯示內容,不受父元素裁剪影響;可按固定方框排版,或相對於其跟隨的錨點定位,並會回報在外部的按下操作及 Escape 按鍵。"
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---


# Overlay

Overlay 會將其子項顯示在所屬根視圖(即視窗,或其外圍的對話框)內所有內容之上。父項的大小、`overflow: hidden` 和捲動視圖都不會裁切它。除此之外,它仍留在你撰寫它的位置:它會讀取周圍的 context,它的處理器屬於其所在的元件,並會隨父項一併移除。Popover、選單、工具提示和 Sheet 都是以它建構而成;[`nsh/base`](../modules/nsh-base.md) 已備有現成的版本([Popover](./popover.md)、[Menu](./menu.md)、[Tooltip](./tooltip.md)、[Sheet](./sheet.md)),而 Overlay 則用來建構你自己的版本。

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

TSX 中的 `Overlay` 來自 `nsh`,Rust 中的 `overlay()` 則來自 `nsh_core::prelude`。Overlay 只要在視圖中就會顯示:將它放進 `If`(Rust:`when(..)`)即可開啟和關閉。較後顯示的 Overlay 會在較早顯示的之上,而位於另一個 Overlay 內的 Overlay 則在它之上。

<a id="placement"></a>

## 位置

沒有 `anchor` 時,Overlay 會以其根視圖的 `position: fixed` 方塊進行排版:它的 `top`、`left`、`inset`、大小和邊距都以整個視窗(或對話框)為基準。`class="inset-0"` 會覆蓋整個範圍,可用作背景遮罩或全視窗圖層;`class="bottom-0 left-0 right-0"` 則是沿底部的一條橫列。

有 `anchor` 時,NSH 會將它放在錨點旁邊:

- `anchor` 可以是一個視圖(`ref`)、根視圖座標中的一個 `Point`(`{ x, y }`)、觸控的 `pageX` / `pageY`(在指標所在位置開啟的選單),或當中的一個 `Bounds`(`{ origin, size }`):例如輸入框的插入符號(`onCaretMove` 的 `pageBounds`),即輸入內容的建議開啟之處。
- `placement` 是它所在的一側:`"top"`、`"bottom"`(預設)、`"left"` 或 `"right"`。當該側放不下而另一側放得下時,它會移到另一側;兩側都放不下時,它會移到空間較多的一側。
- `align` 決定它沿該側如何對齊:`"start"`、`"center"`(預設)或 `"end"`。在錨點的上方和下方時,start 和 end 會跟隨版面方向:start 是左邊緣,在由右至左的版面中則是右邊緣。
- `offset` 是錨點與 Overlay 之間的間距;`margin` 是它與安全區域邊緣保持的距離,它會留在安全區域之內:它會沿所在的一側滑動以適應空間。

錨點式 Overlay 會跟隨其錨點:當錨點捲動、移動或改變大小時,Overlay 會在 NSH 排版的同一個畫面影格中一併移動。`onPosition` 會告知它最終的位置,讓箭頭可以指向錨點,或讓較長的選單限制自己的高度:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## 關閉

Overlay 會回報通常用來關閉彈出視窗的操作,並由你決定如何處理:

- 當手指或滑鼠按鍵在 Overlay、它的錨點及其內部的 Overlay 之外按下時,會觸發 `onPressOutside`。該次按下會繼續傳給其下方的內容。
- 按下 Escape、Android 返回按鈕,以及 iOS 上 VoiceOver 的退出手勢時,會觸發 `onCancel`,而且只限最上層並監聽此事件的 Overlay。它會先於頁面和 `BackHandler` 接收這些操作。

若要封鎖彈出視窗後面的畫面,可在其下方放置第二個帶有 `class="inset-0"` 的 Overlay,並使用會同時關閉兩者的 `onPress`:[Sheet](./sheet.md) 和 [Popover](./popover.md) 的手機版呈現方式就是這樣運作。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`、`.anchor_point(point)`、`.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | 無 | 用作定位基準的視圖、點或方塊。沒有錨點時,它是其根視圖中的固定方塊。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 它所在的錨點一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 它沿該側如何與錨點對齊。 |
| `offset` | `.offset(px(..))` | `number` | `0` | 錨點與 Overlay 之間的間距。 |
| `margin` | `.margin(px(..))` | `number` | `0` | 它與安全區域邊緣保持的距離。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 它所顯示的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 它的外觀,以及在沒有錨點時它所在的位置。 |

它也支援視圖的[通用屬性](./index.md#common-props)。

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | 在它、它的錨點及其內部的 Overlay 之外有按下操作(`pagePosition`,一個 `Point`)。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 按下 Escape、Android 返回按鈕或 VoiceOver 的退出手勢,而它是正在監聽的最上層 Overlay。 |
| `onPosition` | `.on_position(\|position\| ..)` | NSH 已完成它的定位:`placement`(它所在的一側)、根視圖中的 `bounds`,以及 `available`(一個 `Size`:該側的可用空間)。 |

<a id="platform-notes"></a>

## 平台說明

- 各平台都會將 Overlay 顯示為視窗(或對話框)根視圖的原生視圖,其繪製和點擊測試方式與周圍的視圖相同:UIKit、Android views、AppKit、GTK、Win32、GPUI 和 DOM。
- [Dialog](./dialog.md) 內的 Overlay 會顯示在該對話框中,位於其內容之上。
- Overlay 會留在所屬視窗內:原本會伸出視窗邊緣的選單,會滑回視窗之內。
