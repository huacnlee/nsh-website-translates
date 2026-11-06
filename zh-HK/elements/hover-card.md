---
title: "HoverCard"
description: "HoverCard 元件:當指標停留在觸發元素上時,顯示該觸發元素所指向內容的預覽,其樣式由應用程式自行定義。"
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---


# HoverCard

懸停卡片（hover card）可在不離開頁面的情況下預覽觸發元素所指向的內容：提及背後的個人檔案、連結背後的頁面、股票代號背後的報價。在桌面平台及桌面瀏覽器上，當指標在觸發元素上停留 `openDelay`（600 毫秒），或鍵盤焦點移到觸發元素時，卡片便會開啟。當指標由觸發元素移到卡片再移回來，以及鍵盤焦點停留在觸發元素或卡片內的連結或按鈕時，卡片會保持開啟，因此卡片內的所有內容都可同時以指標和鍵盤操作。指標離開兩者，且焦點不在兩者之內 `closeDelay`（300 毫秒）後，卡片便會關閉。按下 Escape 或在卡片外按一下，卡片會立即關閉。在手機和平板上，按一下觸發元素可開啟或關閉卡片，在卡片外按一下則會關閉。

來自 [`nsh/base`](../modules/nsh-base.md) 的 `HoverCard` 本身不繪製任何內容：觸發元素是你的元素，彈出視窗及其內容也由你提供。

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

觸發元素保留自身的角色、按下行為和外觀：帶有 `role="link"` 及自身 `onPress` 的 view 在被按下時，仍會前往原本的目標，而卡片則為它加上預覽。內容會在每次卡片開啟時才產生，因此可在當時載入要顯示的資料。在手機和平板上，按一下會開啟卡片，此時觸發元素會告知螢幕閱讀器其卡片是否已開啟。在 [Toolbar](./toolbar.md) 中，觸發元素可以是其項目之一；但卡片所顯示的內容則不是：卡片內的按鈕和連結各自保留自己的 Tab 停駐點，而 Toolbar 的 `disabled` 不會改動它們。

<a id="delays"></a>

## 延遲

`openDelay` 可避免指標在經過觸發元素、前往其他位置的途中，卡片突然彈出；`closeDelay` 則讓指標有時間越過觸發元素與卡片之間的空隙。兩者均以毫秒為單位。指標和延遲均由原生層追蹤，因此在觸發元素上停留，以及在觸發元素與卡片之間移動，在卡片開啟或關閉之前都不會執行你的任何程式碼。`openDelay` 設為 `Infinity` 時，開啟交由應用程式決定（觸控螢幕上的按下操作亦然）；`closeDelay` 設為 `Infinity` 時，關閉則交由 Escape、在卡片外按下及應用程式決定。

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## 開啟狀態

未設定 `open` 時，卡片自行維護狀態，初始值為 `defaultOpen`。設定 `open` 後，狀態由應用程式掌管：請在 `onOpenChange({ open, reason })` 中更改狀態，它會回報每次開啟或關閉的請求及其原因：`"hover"`（指標）、`"focus"`（鍵盤焦點）、`"triggerPress"`（在觸控螢幕上按下）、`"pressOutside"` 或 `"cancel"`（Escape 或返回）。

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## 進場與退場

懸停卡片的出現和消失會配合你的過渡效果，與 [Popover](./popover.md) 相同。`popupStartingClass` 是彈出視窗在第一個畫面幀的外觀，而 `popupClass` 的 `transition-*` 類別會將它帶到其自身的外觀。`popupEndingClass` 是彈出視窗關閉後的外觀：在這些過渡運行期間，卡片會保留但不接收指標操作，之後才移除，然後 `onClose` 隨之觸發。在卡片消失期間再次停留在觸發元素上，可令它回復。當使用者要求減少動態效果時，卡片會即時出現和消失。

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

卡片預設出現在觸發元素下方（`placement`、`align`），沒有足夠空間時則出現在另一側，並保持在安全區域之內。`onPosition({ placement, bounds, available })` 會說明它最終出現的位置。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 是否開啟，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始是否開啟，不使用 `open`。 |
| `openDelay` | `.open_delay(..)` | `number` | `600` | 指標停留在觸發元素上，或焦點停留在其上，直至卡片開啟前的毫秒數；`Infinity`：絕不自行開啟。 |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | 指標離開觸發元素和卡片，且焦點不在兩者之內，直至卡片關閉前的毫秒數；`Infinity`：絕不自行關閉。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 卡片出現在觸發元素的哪一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 卡片沿該側如何與觸發元素對齊。 |
| `offset` | `.offset(..)` | `number` | `0` | 觸發元素與卡片之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 卡片與安全區域邊緣保持的距離。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗的外觀，即放置內容的卡片。 |
| `popupStartingClass`、`popupStartingStyle` | `.popup_starting_class(..)`、`.popup_starting_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗在第一個畫面幀的外觀，疊加於其自身外觀之上：過渡效果由此開始。 |
| `popupEndingClass`、`popupEndingStyle` | `.popup_ending_class(..)`、`.popup_ending_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗關閉後的外觀，疊加於其自身外觀之上：在過渡效果運行期間會保留。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 所預覽的對象；卡片會相對於它定位。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容，每次開啟時才產生。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 請求開啟或關閉，並附上原因：`"hover"`、`"focus"`、`"triggerPress"`、`"pressOutside"` 或 `"cancel"`。 |
| `onOpen` | `.on_open(\|\| ..)` | 卡片已顯示。 |
| `onClose` | `.on_close(\|\| ..)` | 卡片已在退場後消失；應用程式將其關閉時亦會觸發。 |
| `onPosition` | `.on_position(\|e\| ..)` | 彈出視窗已完成定位：`placement`（出現在哪一側）、`bounds`（其框架）、`available`（該側的剩餘空間）。 |

<a id="accessibility"></a>

## 無障礙

懸停卡片會為其觸發元素增添功能：觸發元素保留其角色和標籤，而按下時所開啟或執行的操作維持不變。鍵盤使用者在焦點停留於觸發元素時便會看到卡片，按下 Escape 即可關閉。卡片本身不會取得焦點，因此 Tab 會如常從觸發元素移到下一項。卡片內的連結和按鈕與其他位置一樣可取得焦點，而當其中一項取得焦點時，卡片會保持開啟；卡片中的重要內容，亦應可在觸發元素所指向的頁面中找到。
