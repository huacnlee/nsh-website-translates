---
title: "Popover"
description: "Popover 元件:內容錨定於觸發器,顯示在所有內容的最上層,可透過觸發器、點按外部區域、Escape 鍵與返回操作關閉,樣式由應用程式自行定義。"
group: base
demo: el-popover
---

# Popover

Popover 會在觸發元件旁、所有內容的最上層顯示內容,例如詳細資訊、小型表單或色彩選擇器。
按下觸發元件即可開啟或關閉;在外部按一下、按 Escape、Android 返回鍵,以及 VoiceOver 的退出手勢,也都會關閉它。它會放在觸發元件的某一側,該側空間不足時會移到另一側,並停留在安全區域內,還會在觸發元件捲動時跟著移動。它本身不繪製任何內容:彈出層及其內容都由應用程式提供。

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

`Popover` 來自 [`nsh/base`](../modules/nsh-base.md)。其內容在每次開啟時重新產生,因此內部的狀態會從頭開始。

<a id="open-state"></a>

## 開啟狀態

未設定 `open` 時,popover 自行維護狀態,初始值為 `defaultOpen`。設定 `open` 後,狀態由應用程式掌控:請在 `onOpenChange({ open, reason })` 中變更它,該回呼會回報每一次開啟或關閉的請求及其原因(`"triggerPress"`、`"pressOutside"`、`"cancel"`)。

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` 會讓 popover 在按下 Escape 與返回鍵時保持開啟(`onCancel` 仍會收到這些事件,以便先行詢問);`closeOnPressOutside={false}` 則會讓它在外部按下時保持開啟。

<a id="phones-and-desktops"></a>

## 手機與桌面裝置

在每種裝置上,popover 都會錨定在其觸發元件旁:所顯示的內容應與開啟它的元件相鄰。

- 在桌面平台與桌面瀏覽器上,在外部按一下會關閉 popover,並繼續傳遞給指標下方的元件,因此一次點擊既會關閉 popover,也會按下點擊位置上的按鈕。
- 在手機與平板上,在外部按一下只會關閉 popover:由一個透明的背板接收這次按下,與系統的 popover 行為相同。

若要顯示動作清單,請使用 [Menu](./menu.md),它在手機上會變成 sheet;若要顯示面板,請使用 [Sheet](./sheet.md)。

<a id="entrance-and-exit"></a>

## 進場與退場

Popover 的出現與消失會搭配你的轉場效果。`popupStartingClass` 是彈出層在第一個影格的外觀,`popupClass` 的 `transition-*` 類別則帶它轉變為自己的外觀,也就是進場效果。`popupEndingClass` 是關閉後的外觀:在這些轉場執行期間,popover 仍會保留但不接收按下事件,結束後才會移除,隨後觸發 `onClose`。若在退場途中再次開啟,它會從當下的狀態回到開啟時的外觀。`popupStartingStyle` 與 `popupEndingStyle` 以行內樣式達成相同的效果。當使用者要求減少動態效果時,它會立即出現與消失。

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

`onPosition({ placement, bounds, available })` 會告知彈出層被放置的位置:觸發元件的哪一側(`placement` 空間不足時則為另一側)、它的框架,以及該側的可用空間,讓箭頭或進場效果可以指向觸發元件。

## Props

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 是否開啟,由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始是否開啟,不使用 `open` 時有效。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 放置在觸發元件的哪一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 沿著該側與觸發元件對齊的方式。 |
| `offset` | `.offset(..)` | `number` | `0` | 觸發元件與彈出層之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 與安全區域邊緣保持的距離。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | 按下 Escape 與 Android 返回鍵時關閉。 |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | 在外部按一下時關閉。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出層的外觀,即容納內容的方框。 |
| `popupStartingClass`、`popupStartingStyle` | `.popup_starting_class(..)`、`.popup_starting_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出層在第一個影格的外觀,疊加在其自身外觀之上:其轉場由此開始。 |
| `popupEndingClass`、`popupEndingStyle` | `.popup_ending_class(..)`、`.popup_ending_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出層關閉後的外觀,疊加在其自身外觀之上:在其轉場執行期間會保留。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 用來開啟它的元件;彈出層會相對於它放置。Popover 開啟期間,其 `aria-expanded:` 類別與 `expandedStyle` 會生效。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 已開啟或關閉,並附上原因:`"triggerPress"`、`"pressOutside"` 或 `"cancel"`。 |
| `onOpen` | `.on_open(\|\| ..)` | 已顯示。 |
| `onClose` | `.on_close(\|\| ..)` | 已在退場後消失;應用程式主動關閉它時也會觸發。 |
| `onCancel` | `.on_cancel(\|\| ..)` | 使用者嘗試關閉它(Escape 或返回鍵、在外部按下),無論是否真的關閉。 |
| `onPosition` | `.on_position(\|e\| ..)` | 彈出層已放置:`placement`(所在的一側)、`bounds`(它的框架)、`available`(該側的可用空間)。 |

<a id="accessibility"></a>

## 無障礙

觸發元件會告知螢幕閱讀器 popover 是否已展開。Escape 與返回鍵會關閉它,符合使用者對彈出層的預期。在 TSX 中,觸發元件就是你傳入的元素,可以是 `Button` 或你自己的 view:它自行處理按下與展開狀態,因此在按下期間,它自己的 `active:` 類別與 `activeStyle` 會生效,它自己的 `onPress` 也會照常執行。
