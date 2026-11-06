---
title: "Overlay"
description: "Overlay 元件：將內容顯示在螢幕最上層，不受父元素裁切影響，可配置為固定方塊，或相對於其跟隨的錨點進行定位，並會回報外部點擊與 Escape 按鍵事件。"
order: 100
group: primitives
demo: el-overlay
---

# Overlay

Overlay 會將其子元素顯示在所在根視圖（視窗，或其外圍的對話框）中所有內容之上。父元素的大小、`overflow: hidden` 和捲動視圖都不會裁切它。在其他方面，它仍留在你撰寫它的位置：它會讀取周圍的 context，其處理函式屬於它所在的元件，並且會隨父元素一同消失。Popover、選單、工具提示和 sheet 都以它為基礎建構；[`nsh/base`](../modules/nsh-base.md) 已提供現成的版本（[Popover](./popover.md)、[Menu](./menu.md)、[Tooltip](./tooltip.md)、[Sheet](./sheet.md)），而 overlay 則用來建構你自己的元件。

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

`Overlay` 在 TSX 中來自 `nsh`，`overlay()` 在 Rust 中來自 `nsh_core::prelude`。它在視圖中存在時就會顯示：將它放入 `If`（Rust：`when(..)`）即可開啟與關閉。較晚顯示的 overlay 位於較早顯示的 overlay 之上，而位於另一個 overlay 內的 overlay 則位於其上方。

<a id="placement"></a>

## 位置

沒有 `anchor` 時，overlay 會作為其根視圖的 `position: fixed` 方塊進行佈局：它的 `top`、`left`、`inset`、尺寸與邊距都是相對於整個視窗（或對話框）。`class="inset-0"` 會覆蓋整個畫面，可用作背景遮罩或全視窗圖層；`class="bottom-0 left-0 right-0"` 則是沿著底部的一條列。

有 `anchor` 時，NSH 會將它放在錨點旁邊：

- `anchor` 可以是視圖（`ref`）、根視圖座標中的 `Point`（`{ x, y }`）、觸控的 `pageX` / `pageY`（選單出現在指標所在處），或該處的 `Bounds`（`{ origin, size }`）：輸入框的插入符號（`onCaretMove` 的 `pageBounds`），也就是輸入內容的建議開啟之處。
- `placement` 是它所在的一側：`"top"`、`"bottom"`（預設）、`"left"` 或 `"right"`。當該側放不下而另一側放得下時，它會移到另一側；兩側都放不下時，則放在空間較大的一側。
- `align` 決定它沿該側如何對齊：`"start"`、`"center"`（預設）或 `"end"`。在錨點的上方與下方，start 與 end 會依佈局方向而定：start 是左緣，在由右至左的佈局中則是右緣。
- `offset` 是錨點與 overlay 之間的間距；`margin` 是它與安全區域邊緣保持的距離，它會停留在安全區域內：它會沿著所在的一側滑動以符合空間。

錨點式 overlay 會跟隨其錨點：當錨點捲動、移動或改變大小時，overlay 會在 NSH 進行佈局的同一個影格中一起移動。`onPosition` 會告訴你它最後的位置，因此箭頭可以指向錨點，較長的選單也可以限制自己的高度：

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

Overlay 會回報通常會讓彈出視窗關閉的情況，並將決定權留給你：

- `onPressOutside` 會在手指或滑鼠按鍵於 overlay、其錨點以及其內部的 overlay 之外按下時觸發。該次按下會繼續傳遞給其下方的元素。
- `onCancel` 會在按下 Escape、Android 返回鍵，以及 iOS 上 VoiceOver 的 escape 手勢時觸發，且僅限於監聽它的最上層 overlay。它會先於頁面和 `BackHandler` 取得這些操作。

若要封鎖彈出視窗後方的畫面，請在它下方再放一個帶有 `class="inset-0"` 的 overlay，並搭配一個會同時關閉兩者的 `onPress`：[Sheet](./sheet.md) 與 [Popover](./popover.md) 的手機版呈現就是這樣運作的。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`、`.anchor_point(point)`、`.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | 無 | 用來定位的視圖、點或方塊。未設定時，它是其根視圖中的固定方塊。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 它所在的錨點側邊。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 它沿該側與錨點的對齊方式。 |
| `offset` | `.offset(px(..))` | `number` | `0` | 錨點與 overlay 之間的間距。 |
| `margin` | `.margin(px(..))` | `number` | `0` | 它與安全區域邊緣保持的距離。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 它所顯示的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 它的外觀，以及在沒有錨點時它所在的位置。 |

它也接受視圖的[通用 props](./index.md#common-props)。

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | 在 overlay、其錨點以及其內部的 overlay（`pagePosition`、`Point`）之外按下。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 在它是正在監聽的最上層 overlay 時，按下 Escape、Android 返回鍵或 VoiceOver 的 escape 手勢。 |
| `onPosition` | `.on_position(\|position\| ..)` | NSH 已完成定位：`placement`（它所在的一側）、根視圖中的 `bounds`，以及 `available`（`Size`：該側的可用空間）。 |

<a id="platform-notes"></a>

## 平台說明

- 每個平台都將 overlay 顯示為視窗（或對話框）根視圖的原生視圖，其繪製與命中測試方式與周圍的視圖相同：UIKit、Android views、AppKit、GTK、Win32、GPUI 與 DOM。
- [Dialog](./dialog.md) 內的 overlay 會顯示在該對話框中，位於其內容之上。
- Overlay 會留在其所屬的視窗內：會超出視窗邊緣的選單會滑回視窗內。
