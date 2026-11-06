---
title: "Tooltip"
description: "Tooltip 元件:提供所在元素的提示說明,在桌面平台上當指標停留於該元素時顯示,樣式由應用程式自行定義。"
group: base
demo: el-tooltip
---

# Tooltip

Tooltip 是緊鄰其對象的簡短提示：說明圖示按鈕的作用，或顯示被截斷標籤的完整文字。
在桌面平台與桌面瀏覽器上，指標在觸發元素上停留 `delay`（500 ms）後顯示，指標離開或按下觸發元素時隱藏。手機與平板只有在應用程式開啟時才會顯示 Tooltip
（`open`）。它不會攔截指標或按壓操作，因此觸發元素的運作方式與沒有 Tooltip 時完全相同。

來自 [`nsh/base`](../modules/nsh-base.md) 的 `Tooltip` 會作為每個元素都有的 `tooltip` prop 傳入
（[Common props](index.md#tooltips)），即 GPUI 的 `.tooltip(..)`：該元素就是指標停留的對象，也是 Tooltip 定位時所依附的對象。Tooltip 本身就是氣泡：以 `class` / `style` 設定樣式，其子元素就是它所顯示的內容。

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

Tooltip 預設顯示在觸發元素上方（`placement`），空間不足時會改到另一側，並且始終保持在安全區域內。使用 `open` 時，由應用程式決定何時顯示：它會跟隨 `onOpenChange`，後者會回報指標停留在觸發元素上或離開觸發元素，並且可以在任何裝置上顯示。

它會隨著你的轉場效果出現與消失：`startingClass` 是它在第一個影格的外觀，`endingClass` 則是隱藏後的外觀，在其 `class` 的 `transition-*` class 執行期間會保持該外觀；`onClose` 隨後接續。

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 無 | 它所顯示的內容。 |
| `class`、`style` | `.app_class(..)`、`Styled` 方法 | `string`、`StyleProp<ViewStyle>` | 無 | 氣泡的外觀：即 Tooltip 本身。 |
| `startingClass`、`startingStyle` | `.starting_class(..)`、`.starting_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 它在第一個影格的外觀：其轉場效果從此開始執行。 |
| `endingClass`、`endingStyle` | `.ending_class(..)`、`.ending_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 它隱藏後的外觀：在其轉場效果執行期間會保持。 |
| `open` | `.open(..)` | `boolean` | 無 | 顯示狀態，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始即顯示，不需要 `open`。 |
| `delay` | `.delay(..)` | `number` | `500` | 指標在觸發元素上停留多少毫秒後顯示；`Infinity`：不會自行顯示，只在應用程式開啟時顯示。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 永不顯示。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | 它位於觸發元素的哪一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 它沿該側與觸發元素的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `4` | 觸發元素與 Tooltip 之間的間距。 |
| `margin` | `.margin(..)` | `number` | `4` | 它與安全區域邊緣保持的距離。 |

## Events

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 指標停留在觸發元素上，或離開或按下觸發元素（`reason` `"hover"`）。 |
| `onOpen` | `.on_open(\|\| ..)` | 已顯示。 |
| `onClose` | `.on_close(\|\| ..)` | 已消失，於退場效果結束之後；應用程式將其隱藏時也會觸發。 |

## Accessibility

Tooltip 會向螢幕閱讀器重複其觸發元素所傳達的內容：也請為觸發元素提供 `accessibilityLabel`，讓每個人都能獲得這項提示。
