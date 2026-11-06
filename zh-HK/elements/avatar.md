---
title: "Avatar"
description: "Avatar 與 AvatarGroup 元件:用於顯示使用者的圖片,並在圖片載入中、載入失敗或沒有圖片時顯示替代內容,且載入狀態由原生層處理;以及一排頭像,只顯示前幾個,其餘以彙總方式表示。"
group: base
demo: el-avatar
---

# Avatar

Avatar 顯示一個人的圖片：團隊成員、留言作者、標頭中的帳號。在圖片載入完成之前、載入失敗時以及沒有圖片時，它會顯示一個後備內容：此人的 `name` 的縮寫字母，或是應用程式自己的內容（例如圖示）。它負責管理圖片的載入狀態，直接由圖片本身的載入與錯誤事件以原生方式執行，不需要 JavaScript，也負責螢幕閱讀器所收到的內容：一張以此人姓名作為標籤的圖片。外觀由應用程式決定：`Avatar` 本身沒有尺寸、形狀、顏色或字型。`AvatarGroup` 會顯示一排頭像中的前幾個，以及代表其餘成員的溢位項目（「+5」）。

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

`Avatar` 與 `AvatarGroup` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`avatar()` 與 `avatar_group()` 以每個 prop 對應一個 setter 的方式建立它們（`.src(..)`、`.fallback_delay(..)`），頭像本身使用具型別的樣式方法，而覆蓋在圖片上方的內容則使用 `.child(..)`。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | 無 | 圖片，格式與 [`<Image>`](./image.md) 的 `src` 接受的相同：URL、`asset:/` 或 `data:` URI、`blob:` URL（使用者挑選的照片：`URL.createObjectURL(file)`），或匯入的圖片。圖片載入完成後才會顯示；空字串表示沒有圖片。 |
| `name` | `.name(..)` | `string` | 無 | 此人的姓名：螢幕閱讀器會朗讀的內容，也是應用程式未傳入 `fallback` 時，後備內容所顯示的縮寫字母。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | 螢幕閱讀器會朗讀的內容，優先於 `name`。`""` 會使頭像成為裝飾性元素，對螢幕閱讀器隱藏。 |
| `fallbackDelay` | `.fallback_delay(..)` | `number`（毫秒） | `0` | 圖片載入期間，後備內容要等待多久才顯示，讓載入很快的圖片可以直接顯示，而不會先閃現後備內容。`Infinity`：載入期間不顯示後備內容，只在載入失敗或沒有圖片時顯示。 |
| `imageClass`、`imageStyle` | `.image_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 圖片：其填滿方式、圓角半徑與動態效果。 |
| `fallbackClass`、`fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 後備內容：其背景、文字顏色與大小，以及內容的對齊方式。 |
| `fallback` | `.fallback(..)` | `JSX.Element` | 縮寫字母 | 取代縮寫字母的後備內容：圖示，或是沒有姓名者的預留圖示。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 顯示在圖片上方的內容：狀態圓點、徽章。螢幕閱讀器朗讀的是頭像的標籤，而不是這些內容（請參閱[無障礙](#accessibility)）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 頭像本身：其尺寸與形狀。 |

| 事件 | Rust | Payload | 說明 |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | 圖片的狀態已變更：`"idle"`（沒有 `src`）、`"loading"`、`"loaded"` 或 `"error"`。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 頭像 | | `class`、`style` |
| 後備內容 | 位於頭像內，排在最前面，大小與頭像相同；在圖片載入期間（`fallbackDelay` 之後）、載入失敗或沒有圖片時存在 | `fallbackClass`、`fallbackStyle`；其內容為縮寫字母或 `fallback` |
| 圖片 | 位於頭像內，覆蓋在後備內容上方並填滿它 | `imageClass`、`imageStyle` |
| 應用程式的內容 | 位於頭像內，排在最後 | 其自身的元素（`children`） |

請為頭像指定尺寸（`class="size-10"`）：後備內容與圖片會填滿它，因此後備內容消失時不會重新進行任何版面配置。圖片從一開始就會被排入版面，初始為透明，載入完成後才變為不透明，此時後備內容隨即消失。在 `imageClass` 中加入 `transition-opacity` 可使圖片淡入（若使用者設定減少動態效果，則會立即顯示）。請替圖片與後備內容分別設定圓角（各自使用 `rounded-full`），而不要裁切頭像本身，這樣放在頭像邊緣的狀態圓點（`absolute bottom-0 right-0`）才能完整顯示。

縮寫字母取自姓名前兩個單字的第一個字母，並轉為大寫（「Ada Lovelace」為「AL」）；只有單一單字時，取其前兩個字母（「huacnlee」為「HU」）；若姓名使用沒有大小寫之分的文字，則取第一個字元（「王小明」為「王」）。

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

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | 最多顯示這麼多個頭像，取最前面的幾個；其餘的不會建立檢視。 |
| `total` | `.total(..)` | `number` | 子項目的數量 | 此群組代表多少人，用於應用程式只傳入其中前幾位的情況。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對此群組朗讀的內容。 |
| `overflowClass`、`overflowStyle` | `.overflow_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 溢位部分，位於所顯示的頭像之後。 |
| `overflow` | `.overflow(..)` | `JSX.Element` | 無 | 代表未顯示人數的內容（「+5」、「⋯」），當群組中的人數多於所顯示的頭像時才會出現。 |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對溢位項目朗讀的內容，用以取代其內容：例如以「5 more people」取代「+5」。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 依序排列的頭像。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 這一排：其方向（`flex-row`）與間距。 |

重疊方式、外圈與溢位項目的形狀由應用程式決定：對第一個之後的每個頭像設定負邊距（`-ml-2`）即可使其堆疊，並以背景色的外圈將它們區隔開來。對於很長的清單，請只傳入前 `limit` 位成員以及 `total`：只有顯示出來的頭像才會被建立。溢位項目所代表的數量是 `total` 減去所顯示的頭像數，而所顯示的頭像數為子項目數量與 `limit` 中較小的一個：`total={8}` 搭配兩個子項目時，會顯示兩個頭像與「+6」。

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，頭像是一張圖片，以 `accessibilityLabel` 或 `name` 作為標籤：姓名只會朗讀一次。後備內容與圖片會對螢幕閱讀器隱藏，因此縮寫字母不會被單獨朗讀。沒有這兩者，或設定為 `accessibilityLabel=""` 的頭像是裝飾性的：會對螢幕閱讀器隱藏，這適用於緊鄰其所顯示姓名的頭像。
- 群組是一個群組，以其 `accessibilityLabel` 作為標籤（「Ada, Grace and 5 others」）；所顯示的頭像是其中的圖片。溢位項目會朗讀其內容（「+5」），若應用程式提供了 `overflowAccessibilityLabel`，則朗讀該內容（「5 more people」）：NSH 不會自行撰寫任何文字。
- 對螢幕閱讀器而言，頭像是單一元素，因此其子項目所顯示的內容不會被單獨朗讀，而且在 iOS 上，其中的按鈕或連結完全無法被觸及。請在 `accessibilityLabel` 中說明狀態圓點或徽章的意義（「Ada Lovelace, online」），並將可按下的元件放在頭像旁邊，而不是放在頭像內部。
- 兩者都不接受按壓或鍵盤焦點：若要使頭像可被按下，請將它放在 `Button` 中。

關於標籤、角色與公告的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 每個平台都使用自己的圖片載入器與快取來載入圖片（請參閱 [Image](./image.md)）；其載入與錯誤事件會在 Rust 中改變頭像的狀態，因此圖片載入中或載入失敗，只會改變圖片與後備內容，不會影響其他部分。
- 圖片在取得框架（frame）後才開始載入，因此在透明狀態下它仍保持在版面中。
