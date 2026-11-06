---
title: "Avatar"
description: "Avatar 與 AvatarGroup 元件：顯示用戶的圖片，並會在圖片載入中、載入失敗或沒有圖片時顯示後備內容，載入狀態由原生層處理；以及一列頭像，只顯示最前面的幾個，其餘的則以數量代表。"
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---


# Avatar

頭像（avatar）顯示一個人的圖片：團隊成員、留言作者、標題列中的帳戶。在圖片載入完成之前、載入失敗時以及沒有圖片時，它會顯示後備內容：以此人的 `name` 取得的姓名縮寫，或應用程式自己的內容（圖示）。它負責管理圖片的載入狀態，由圖片自身的 load 和 error 事件以原生方式驅動，不需要 JavaScript；它也決定螢幕閱讀器讀到的內容：一張以此人姓名作標籤的圖片。外觀由應用程式決定：`Avatar` 本身沒有尺寸、形狀、顏色或字型。`AvatarGroup` 顯示一列頭像中的前幾個，以及代表其餘頭像的溢出標示（「+5」）。

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` 和 `AvatarGroup` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`avatar()` 和 `avatar_group()` 以每個 prop 一個 setter（`.src(..)`、`.fallback_delay(..)`）來建立它們；頭像本身使用具型別的樣式方法，而位於圖片上方的內容則使用 `.child(..)`。

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | 無 | 圖片，格式與 [`<Image>`](./image.md) 的 `src` 相同：URL、`asset:/` 或 `data:` URI、`blob:` URL（使用者選取的相片：`URL.createObjectURL(file)`），或匯入的圖片。圖片載入完成後才會顯示；空字串代表沒有圖片。 |
| `name` | `.name(..)` | `string` | 無 | 此人的姓名：螢幕閱讀器會讀出它；若應用程式沒有傳入 `fallback`，後備內容也會以它產生縮寫。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | 螢幕閱讀器讀出的內容，優先於 `name`。`""` 會令頭像成為裝飾性元素，對螢幕閱讀器隱藏。 |
| `fallbackDelay` | `.fallback_delay(..)` | `number`（毫秒） | `0` | 圖片載入期間，後備內容等待多久才顯示，讓載入很快的圖片不會先閃現後備內容。`Infinity`：載入期間不顯示後備內容，只在載入失敗或沒有圖片時顯示。 |
| `imageClass`、`imageStyle` | `.image_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 圖片：其適配方式、圓角半徑和動態效果。 |
| `fallbackClass`、`fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 後備內容：其背景、文字顏色和大小，以及內容的對齊方式。 |
| `fallback` | `.fallback(..)` | `JSX.Element` | 姓名縮寫 | 取代姓名縮寫的後備內容：圖示，或給沒有姓名的人使用的佔位內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 顯示在圖片上方的內容：在線狀態圓點、徽章。螢幕閱讀器讀出的是頭像的標籤，而不是這些內容（參閱[無障礙功能](#accessibility)）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 頭像本身：其大小和形狀。 |

| 事件 | Rust | 負載 | 說明 |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | 圖片的狀態改變：`"idle"`（沒有 `src`）、`"loading"`、`"loaded"` 或 `"error"`。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定 |
|---|---|---|
| 頭像 | | `class`、`style` |
| 後備內容 | 在頭像內，排在最前，大小與頭像相同；圖片載入期間（`fallbackDelay` 之後）、載入失敗或沒有圖片時才會出現 | `fallbackClass`、`fallbackStyle`；其內容為姓名縮寫或 `fallback` |
| 圖片 | 在頭像內，位於後備內容之上，填滿頭像 | `imageClass`、`imageStyle` |
| 應用程式的內容 | 在頭像內，排在最後 | 自身的元素（`children`） |

請為頭像指定大小（`class="size-10"`）：後備內容和圖片會填滿頭像，因此後備內容離開時不會令版面重新排列。圖片從一開始就已排進版面，初始為透明，載入完成後變為不透明，然後後備內容離開。在 `imageClass` 中設定 `transition-opacity` 可令圖片淡入（啟用減少動態效果時會立即顯示）。請為圖片和後備內容分別設定圓角（各自使用 `rounded-full`），而不要裁切頭像本身，這樣放在頭像邊緣的在線狀態圓點（`absolute bottom-0 right-0`）才會保持完整。

姓名縮寫是姓名中前兩個詞的首個字母，以大寫表示（「Ada Lovelace」得出「AL」）；只有一個詞時取其前兩個字母（「huacnlee」得出「HU」）；使用沒有大小寫之分的文字時，則取第一個字元（「王小明」得出「王」）。

<a id="groups"></a>

## 群組

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | 最多顯示這麼多個頭像，取最前面的；其餘的不會建立視圖。 |
| `total` | `.total(..)` | `number` | 子元素的數量 | 群組代表多少人；用於應用程式只傳入其中最前面幾人的情況。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對該群組讀出的內容。 |
| `overflowClass`、`overflowStyle` | `.overflow_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 溢出部分，排在顯示的頭像之後。 |
| `overflow` | `.overflow(..)` | `JSX.Element` | 無 | 代表未顯示人數的內容（「+5」、「⋯」），當群組人數多於所顯示的頭像時才會出現。 |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對溢出部分讀出的內容，取代其原有內容：「+5」讀作「另外 5 人」。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 頭像，按順序排列。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 該列：其方向（`flex-row`）和間距。 |

重疊方式、環形邊框和溢出部分的形狀由應用程式決定：為第一個之後的每個頭像設定負邊距（`-ml-2`）即可令它們疊起來，再用與背景同色的環形邊框把它們分隔開。對於很長的清單，請只傳入最前面 `limit` 人以及 `total`：只有顯示的頭像才會被建立。溢出部分代表的人數是 `total` 減去顯示的頭像數目；顯示的頭像數目是子元素數量與 `limit` 兩者中較小的一個：`total={8}` 配合兩個子元素時，會顯示兩個頭像和「+6」。

<a id="accessibility"></a>

## 無障礙功能

- 對螢幕閱讀器而言，頭像是一張圖片，標籤為 `accessibilityLabel` 或 `name`：姓名只會讀出一次。後備內容和圖片都對螢幕閱讀器隱藏，因此姓名縮寫不會被單獨讀出。沒有這兩者，或設為 `accessibilityLabel=""` 的頭像屬於裝飾性元素：對螢幕閱讀器隱藏，這正適合與其所代表的姓名並排顯示的頭像。
- 群組是一個群組，標籤為其 `accessibilityLabel`（「Ada、Grace 和另外 5 人」）；顯示的頭像是其中的圖片。溢出部分會讀出其內容（「+5」），若應用程式提供了 `overflowAccessibilityLabel`，則讀出該內容（「另外 5 人」）：NSH 本身不會寫入任何文字。
- 對螢幕閱讀器而言，頭像是單一元素，因此其子元素顯示的內容不會被單獨讀出，而在 iOS 上，其中的按鈕或連結更完全無法聚焦。請在 `accessibilityLabel` 中說明在線狀態圓點或徽章的意思（「Ada Lovelace，在線」），並把可按下的元素放在頭像旁邊，而不是放在頭像裏面。
- 兩者都不接受按下操作或鍵盤焦點：要令頭像可被按下，請把它放進 `Button`。

標籤、角色和播報的一般說明，請參閱[無障礙功能](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 各平台都使用自己的圖片載入器和快取來載入圖片（參閱 [Image](./image.md)）；圖片的 load 和 error 事件會在 Rust 中改變頭像的狀態，因此圖片載入中或載入失敗時，只會改變圖片和後備內容，不會影響其他部分。
- 圖片在取得框架（frame）後才開始載入，因此它在透明期間仍保持在版面中。
