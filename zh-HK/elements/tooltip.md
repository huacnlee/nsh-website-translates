---
title: "Tooltip"
description: "Tooltip 元件:用於提示所在元素的說明,在桌面平台上當指標停留於該元素時顯示,外觀由應用程式自行設定。"
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---


# Tooltip

A Tooltip 是緊貼在其所指對象旁邊的簡短提示，例如說明圖示按鈕的作用，或顯示被截斷標籤的完整文字。
在桌面平台及桌面瀏覽器上，指標在觸發元素上停留 `delay`（500 毫秒）後便會顯示，指標離開或按下觸發元素時則會隱藏。手機和平板電腦只會在應用程式開啟 Tooltip 時才顯示（`open`）。Tooltip 從不攔截指標或按下操作，因此觸發元素的運作與沒有 Tooltip 時完全一樣。

來自 [`nsh/base`](../modules/nsh-base.md) 的 `Tooltip` 會作為每個元素都有的 `tooltip` 屬性傳入（[通用屬性](index.md#tooltips)），就像 GPUI 的 `.tooltip(..)`：該元素就是指標停留的對象，也是 Tooltip 定位所依據的對象。Tooltip 本身就是氣泡：用 `class` / `style` 設定其樣式，其子元素就是它所顯示的內容。

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

Tooltip 預設顯示在觸發元素上方（`placement`），空間不足時改到另一側，並保持在安全區域之內。使用 `open` 時由應用程式決定何時顯示：可跟隨 `onOpenChange` 的回報（指標停留在觸發元素上或離開），並可在任何裝置上顯示。

它會隨你的過渡效果出現和消失：`startingClass` 是它第一幀的外觀，`endingClass` 是隱藏後的外觀，在其 `class` 的 `transition-*` 類別運行期間會保持該外觀；`onClose` 隨後觸發。

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 無 | 顯示的內容。 |
| `class`, `style` | `.app_class(..)`, `Styled` 方法 | `string`, `StyleProp<ViewStyle>` | 無 | 氣泡的外觀：即 Tooltip 本身。 |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 第一幀的外觀：過渡效果由此開始。 |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 隱藏後的外觀：過渡效果運行期間會保持此外觀。 |
| `open` | `.open(..)` | `boolean` | 無 | 是否顯示，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始時是否顯示，不帶 `open`。 |
| `delay` | `.delay(..)` | `number` | `500` | 指標在觸發元素上停留多少毫秒後才顯示；`Infinity`：不會自行顯示，只在應用程式開啟時才顯示。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 永不顯示。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | 位於觸發元素的哪一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 沿該側與觸發元素的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `4` | 觸發元素與 Tooltip 之間的間距。 |
| `margin` | `.margin(..)` | `number` | `4` | 與安全區域邊緣保持的距離。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 指標停留在觸發元素上，或離開或按下觸發元素（`reason` `"hover"`）。 |
| `onOpen` | `.on_open(\|\| ..)` | 已顯示。 |
| `onClose` | `.on_close(\|\| ..)` | 已消失，即退出效果完成後；應用程式將其隱藏時亦會觸發。 |

<a id="accessibility"></a>

## 無障礙

Tooltip 會向螢幕閱讀器重複其觸發元素所說的內容：也請為觸發元素加上 `accessibilityLabel`，讓每個人都能獲得該提示。
