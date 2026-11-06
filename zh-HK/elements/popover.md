---
title: "Popover"
description: "Popover 元件:內容錨定於觸發元素,顯示在所有內容之上,可透過觸發元素、點按外部區域、Escape 鍵及返回操作關閉,樣式由應用程式自行設定。"
group: base
demo: el-popover
source_hash: 49f2e25232287792
---


# Popover

Popover 會在觸發元件旁邊、所有內容之上顯示內容，例如詳細資料、小型表單或顏色選擇器。
按下觸發元件可開啟和關閉；在外面按一下、Escape、Android 返回按鈕和 VoiceOver 的退出手勢都會將它關閉。它會放在觸發元件的某一邊，該邊沒有空間時會移到另一邊，並保持在安全區域內，亦會在觸發元件捲動時跟隨移動。它本身不繪製任何東西：彈出層及其內容由應用程式提供。

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` 來自 [`nsh/base`](../modules/nsh-base.md)。它的內容會在每次開啟時重新建立，因此其中的狀態會從頭開始。

<a id="open-state"></a>

## 開啟狀態

沒有 `open` 時，Popover 會自行保存狀態，起始值為 `defaultOpen`。有 `open` 時，狀態由應用程式持有：請在 `onOpenChange({ open, reason })` 中更改它，該回呼會回報每個開啟或關閉的請求及其原因（`"triggerPress"`、`"pressOutside"`、`"cancel"`）。

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` 會讓它在按下 Escape 和返回時保持開啟（`onCancel` 仍會收到這些操作，以便先作詢問）；`closeOnPressOutside={false}` 會讓它在外面被按下時保持開啟。

<a id="phones-and-desktops"></a>

## 手機與桌面裝置

Popover 在每種裝置上都固定在觸發元件旁：顯示的內容應該緊貼開啟它的元件。

- 在桌面平台和桌面瀏覽器上，在外面按一下會關閉它，並繼續作用於指標下方的元件，所以一次點擊既會關閉 Popover，也會按下點擊位置上的按鈕。
- 在手機和平板上，在外面按一下只會關閉它：透明的背景層會接收這次按下，與系統的 popover 一樣。

如需動作清單，請使用 [Menu](./menu.md)，它在手機上會變成 sheet；如需面板，請使用 [Sheet](./sheet.md)。

<a id="entrance-and-exit"></a>

## 進場與離場

Popover 會配合你的過渡效果出現和消失。`popupStartingClass` 是彈出層第一幀的外觀，`popupClass` 的 `transition-*` 類別會把它帶到自身的外觀，這就是進場效果。`popupEndingClass` 是它關閉後的外觀：在這些過渡進行期間，Popover 會繼續存在但不接受按下操作，之後才消失，然後觸發 `onClose`。如果在離場過程中再次開啟，它會從當時的外觀返回。`popupStartingStyle` 和 `popupEndingStyle` 以行內樣式達到同樣效果。當用戶要求減少動態效果時，它會立即出現和消失。

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` 會說明彈出層最終的位置：在觸發元件的哪一邊（若 `placement` 該邊沒有空間，則為另一邊）、它的框架，以及該邊的剩餘空間，讓箭頭或進場效果可以指向觸發元件。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 是否開啟，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 起初是否開啟，用於沒有 `open` 時。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 放在觸發元件的哪一邊。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 沿該邊與觸發元件如何對齊。 |
| `offset` | `.offset(..)` | `number` | `0` | 觸發元件與彈出層之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 與安全區域邊緣保持的距離。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape 和 Android 返回按鈕會關閉它。 |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | 在外面按一下會關閉它。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出層的外觀，即容納內容的方框。 |
| `popupStartingClass`、`popupStartingStyle` | `.popup_starting_class(..)`、`.popup_starting_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出層第一幀的外觀，疊加在其自身外觀之上：過渡效果從它開始。 |
| `popupEndingClass`、`popupEndingStyle` | `.popup_ending_class(..)`、`.popup_ending_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出層關閉後的外觀，疊加在其自身外觀之上：在過渡進行期間它會保留。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 開啟它的元件；彈出層會以它為基準定位。Popover 開啟時，它的 `aria-expanded:` 類別和 `expandedStyle` 會生效。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 已開啟或關閉，並附上原因：`"triggerPress"`、`"pressOutside"` 或 `"cancel"`。 |
| `onOpen` | `.on_open(\|\| ..)` | 已顯示。 |
| `onClose` | `.on_close(\|\| ..)` | 已消失，在離場之後；應用程式將它關閉時亦會觸發。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 用戶嘗試關閉它（Escape 或返回、在外面按一下），無論是否真的關閉。 |
| `onPosition` | `.on_position(\|e\| ..)` | 彈出層已定位：`placement`（所在的一邊）、`bounds`（它的框架）、`available`（該邊的剩餘空間）。 |

<a id="accessibility"></a>

## 無障礙

觸發元件會告知螢幕閱讀器 Popover 是否已展開。Escape 和返回按鈕會關閉它，符合用戶對彈出層的預期。在 TSX 中，觸發元件就是你傳入的元素，可以是 `Button` 或你自己的視圖：它會自行接收按下操作和展開狀態，因此在被按下時，它自己的 `active:` 類別和 `activeStyle` 會顯示，它自己的 `onPress` 也會照常執行。
