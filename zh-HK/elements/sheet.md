---
title: "Sheet"
description: "Sheet 元件:顯示於畫面邊緣、位於背景遮罩之上的面板,可透過背景遮罩、Escape 鍵及返回操作關閉,並由應用程式自行設定樣式。"
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---


# Sheet

Sheet 是顯示在螢幕邊緣的面板，下方有一層背景遮罩蓋住畫面其餘部分，適用於篩選器、分享面板、側邊抽屜等。按下背景遮罩、按 Escape、按 Android 返回按鈕，以及使用 VoiceOver 的退出手勢，都會關閉它。它顯示在視窗內所有內容之上，在每部裝置上表現一致，本身不繪製任何東西：面板和背景遮罩都由應用程式負責。

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

`Sheet` 來自 [`nsh/base`](../modules/nsh-base.md)。它的內容會在每次開啟時建立。`side` 會把它放在螢幕的 `"bottom"`（預設）或 `"top"`，寬度與螢幕相同；或放在 `"left"` 或 `"right"`，高度與螢幕相同。另一方向的尺寸由面板決定，取決於其內容或 `popupClass`。

滑動動畫會跟隨面板量度所得的尺寸，即使內容在進場期間才建立或增長也一樣。延遲載入的內容和非同步的尺寸更新共用同一個動畫進度；面板最終會停在其當前尺寸。

<a id="open-state"></a>

## 開啟狀態

未設定 `open` 時，Sheet 自行管理狀態，初始值為 `defaultOpen`。設定 `open` 後，狀態由應用程式掌管：請在 `onOpenChange({ open, reason })` 中更改，它會回報每次關閉請求及其原因（`"backdropPress"`、`"cancel"`、`"swipe"`）。
無論是誰開啟或關閉它，`onOpen` 和 `onClose` 都會隨之觸發。

`closeOnEscape={false}` 會令 Escape 和返回鍵不能關閉它，`closeOnBackdropPress={false}` 則令按下背景遮罩不能關閉它；
`onCancel` 仍會收到這些操作，方便先行確認。

<a id="dragging-a-bottom-sheet"></a>

## 拖曳底部 Sheet

設定 `closeOnSwipe` 後，底部面板可跟隨向下拖曳。背景遮罩會隨拖曳距離淡出；放開時若超過面板高度的 30%，或向下速度達每秒 800 點，就會以原因 `"swipe"` 請求關閉。
較短的拖曳會平滑地彈回原位。受控的擁有者可在關閉請求後保持 `open` 為 true，令面板回到原位。
啟用減少動態效果時，放開手指以及以程式開啟或關閉都會即時完成；直接拖曳時仍會跟隨手指。

面板會貼合其內容，包括較短的選單；如內容較高，請使用 `popupStyle` 或子視圖的高度來限制。
把手由應用程式自行繪製，可以是面板內的任何視圖。在 iOS 上，內部的垂直 `Scroll` 或 `List` 會先處理拖曳直至捲動到頂部，然後在同一次手勢中把餘下的向下移動交給面板。
在 Android、桌面平台和網頁上，拖曳把手或捲動區域以外的內容時，會使用各平台原生的平移支援；
內部的捲動區域則維持其平台一般的手勢仲裁方式。把 `closeOnSwipe` 設為 false 會令面板保持不動，並保留已掛載的內容和捲動位置。其他邊緣的行為維持不變。

<a id="native-sheets"></a>

## 原生 Sheet

Sheet 由 NSH 在應用程式視窗內繪製，樣式由應用程式決定。如需使用平台本身的呈現式 Sheet（例如 iOS 上的頁面 Sheet），請使用帶有 `presentation="pageSheet"` 的 [Dialog](./dialog.md)。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 是否開啟，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始是否開啟，未設定 `open` 時適用。 |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 所在的邊緣。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape 和 Android 返回按鈕會關閉它。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | 按下背景遮罩會關閉它。 |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | 底部面板跟隨向下拖曳，放開時達到足夠距離便會關閉。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 面板的外觀。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 背景遮罩的外觀，例如半透明顏色。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 關閉請求，並附上原因：`"backdropPress"`、`"cancel"` 或 `"swipe"`。 |
| `onOpen` | `.on_open(\|\| ..)` | 已進場：內容已全部就位。 |
| `onClose` | `.on_close(\|\| ..)` | 已退場：內容已全部消失。應用程式主動關閉時同樣會觸發。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 用戶嘗試關閉它（Escape 或返回、按下背景遮罩、已啟用的滑動手勢），不論最終有否關閉。 |

在網頁上，使用 `dialogs: "viewport"` 嵌入時，Sheet 及其背景遮罩會呈現在宿主頁面之上，包括同源的 iframe。跨源的框架請使用 [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page)。
