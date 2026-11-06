---
title: "Sheet"
description: "Sheet 元件:顯示於螢幕邊緣、位於背景遮罩之上的面板,可透過點擊背景遮罩、按下 Escape 鍵或返回操作關閉,樣式由應用程式自行決定。"
group: base
demo: el-sheet
---

# Sheet

Sheet 是位於螢幕邊緣的面板，下方覆蓋一層遮罩，蓋住畫面其餘部分：篩選器、分享面板、側邊抽屜皆屬此類。按下遮罩、按 Escape、Android 返回鍵，以及 VoiceOver 的退出手勢，都可以關閉它。它會顯示在視窗內所有內容的最上層，在每種裝置上表現一致，本身不繪製任何內容：面板與遮罩都由應用程式自行提供。

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` 來自 [`nsh/base`](../modules/nsh-base.md)。其內容在每次開啟時重新產生。`side` 會將它放在螢幕的 `"bottom"`（預設）或 `"top"`，寬度與螢幕相同；或放在 `"left"` 或 `"right"`，高度與螢幕相同；橫跨方向的尺寸由面板決定，取決於其內容或 `popupClass`。

在進場過程中，內容建立或增長時，滑動動畫會跟隨面板實際量測到的尺寸。延遲載入的內容與非同步的尺寸更新共用同一個動畫進度；面板最終會停在其當前尺寸。

## Open state

未設定 `open` 時，Sheet 會自行維護狀態，初始值為 `defaultOpen`。設定 `open` 後，狀態由應用程式掌控：請在 `onOpenChange({ open, reason })` 中變更，它會回報每一次關閉請求及其原因（`"backdropPress"`、`"cancel"`、`"swipe"`）。
無論是誰開啟或關閉，`onOpen` 與 `onClose` 都會隨之觸發。

`closeOnEscape={false}` 會讓 Sheet 在按下 Escape 與返回鍵時保持開啟，`closeOnBackdropPress={false}` 則針對按下遮罩的情況；
`onCancel` 仍然會收到這些事件，以便先行詢問。

## Dragging a bottom sheet

設定 `closeOnSwipe`，可讓底部面板跟隨向下拖曳。遮罩會隨拖曳距離而淡出；放開時若超過面板高度的 30%，或向下速度達每秒 800 點，就會以原因 `"swipe"` 請求關閉。
較短的拖曳會平滑地回彈。受控的擁有者可以在關閉請求之後讓 `open` 維持為 true，使面板回到原位。
啟用減少動態效果時，放開後以及程式化的開啟／關閉會立即完成；直接拖曳仍會跟隨手指。

面板會貼合其內容，包括較短的選單；若要限制較高的內容，請使用 `popupStyle` 或子元件的高度。
把手由應用程式自行繪製，可以是面板內的任何 view。在 iOS 上，內部的垂直 `Scroll` 或 `List` 會先消耗拖曳，直到捲動到頂端，並在同一次手勢中將剩餘的向下移動交給面板。
在 Android、桌面平台與 Web 上，拖曳把手或捲動區域之外的內容時，使用各平台原生的平移支援；內部捲動區域則維持其平台一般的手勢仲裁方式。將 `closeOnSwipe` 設為 false 會讓面板保持不動，並保留已掛載的內容與捲動位置。其他邊緣則維持原有行為。

## Native sheets

Sheet 由 NSH 繪製在應用程式的視窗中，樣式由應用程式決定。若需要平台自身呈現的 Sheet（例如 iOS 上的 page sheet），請使用帶有 `presentation="pageSheet"` 的 [Dialog](./dialog.md)。

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 開啟狀態，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始即為開啟，不含 `open`。 |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 所在的邊緣。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | 按 Escape 與 Android 返回鍵會關閉它。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | 按下遮罩會關閉它。 |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | 底部面板跟隨向下拖曳，並在放開時達到門檻即關閉。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 面板的外觀。 |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 遮罩的外觀，例如半透明顏色。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |

## Events

| Event | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 關閉請求，並附上原因：`"backdropPress"`、`"cancel"` 或 `"swipe"`。 |
| `onOpen` | `.on_open(\|\| ..)` | 已進場：全部內容皆已就位。 |
| `onClose` | `.on_close(\|\| ..)` | 已離場：全部內容皆已消失。應用程式主動關閉時也會觸發。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 使用者嘗試關閉它（按 Escape 或返回鍵、按下遮罩、已啟用的滑動手勢），無論最終是否關閉。 |

在 Web 上，使用 `dialogs: "viewport"` 嵌入時，Sheet 及其遮罩會呈現在宿主頁面之上，包括同源的 iframe。跨來源的 frame 請使用 [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page)。
