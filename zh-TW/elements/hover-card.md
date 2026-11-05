---
title: "HoverCard"
description: "HoverCard 元件：當指標停留在觸發元素上時，顯示該觸發元素所指向內容的預覽，其樣式由應用程式自行定義。"
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

HoverCard 可在不離開頁面的情況下預覽觸發元素所指向的內容：提及背後的個人檔案、連結背後的頁面、股票代號背後的報價。在桌面平台與桌面瀏覽器上，當指標在觸發元素上停留 `openDelay`（600 ms）後，或鍵盤焦點移至觸發元素時，它便會開啟。當指標從觸發元素移到卡片上再移回來，以及鍵盤焦點位於觸發元素或卡片中的連結或按鈕上時，它會保持開啟，因此卡片中的所有內容都能同時以指標和鍵盤操作。當指標離開兩者且焦點不在任何一者之中 `closeDelay`（300 ms）後，它便會關閉。按下 Escape 或在卡片外按壓會立即關閉。在手機與平板上，按壓觸發元素可開啟與關閉，在卡片外按壓則會關閉。

來自 [`nsh/base`](../modules/nsh-base.md) 的 `HoverCard` 本身不繪製任何內容：觸發元素是你的元素，彈出視窗及其內容也由你自行提供。

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

觸發元素保有自己的角色、按壓行為與外觀：帶有 `role="link"` 及自身 `onPress` 的 view 被按下時仍會前往原本的目的地，而卡片只是為它加上預覽。內容會在每次卡片開啟時產生，因此可以在那時才載入要顯示的資料。在手機與平板上，按壓會開啟卡片，此時觸發元素會告知螢幕閱讀器其卡片是否已開啟。在 [Toolbar](./toolbar.md) 中，觸發元素可以是其中一個項目；但卡片所顯示的內容不是：其中的按鈕與連結保有各自的 Tab 停駐點，而工具列的 `disabled` 不會改動它們。

<a id="delays"></a>

## 延遲

`openDelay` 可避免指標在前往別處的途中掠過觸發元素時，卡片閃現開啟；`closeDelay` 則讓指標有時間越過觸發元素與卡片之間的間隙。兩者的單位皆為毫秒。指標與延遲皆由原生層追蹤，因此在觸發元素上停留，以及在它與卡片之間移動，在卡片開啟或關閉之前都不會執行你的任何程式碼。`openDelay` 為 `Infinity` 時，開啟交由應用程式決定（以及觸控螢幕上的按壓）；`closeDelay` 為 `Infinity` 時，關閉則交由 Escape、卡片外的按壓以及應用程式決定。

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## 開啟狀態

未提供 `open` 時，卡片會自行維護狀態，初始值為 `defaultOpen`。提供 `open` 時，狀態由應用程式掌控：請在 `onOpenChange({ open, reason })` 中變更它，該回呼會回報每一次開啟或關閉的請求及其原因：`"hover"`（指標）、`"focus"`（鍵盤焦點）、`"triggerPress"`（觸控螢幕上的按壓）、`"pressOutside"` 或 `"cancel"`（Escape 或返回）。

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## 進場與退場

HoverCard 的出現與消失會搭配你的轉場，與 [Popover](./popover.md) 相同。`popupStartingClass` 是彈出視窗在第一個影格的外觀，而 `popupClass` 的 `transition-*` 類別會將它帶往自身的外觀。`popupEndingClass` 是它關閉後的外觀：卡片會在這些轉場執行期間保留且不接收指標事件，之後才消失，接著觸發 `onClose`。在它消失的過程中再次停留於觸發元素上，可讓它重新回來。當使用者要求減少動態效果時，它會立即出現與消失。

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

預設情況下它會出現在觸發元素下方（`placement`、`align`），空間不足時改到另一側，並保持在安全區域內。`onPosition({ placement, bounds, available })` 會告知它最終出現在何處。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 是否開啟，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 未提供 `open` 時，初始是否開啟。 |
| `openDelay` | `.open_delay(..)` | `number` | `600` | 指標在觸發元素上停留，或焦點停留其上，直到開啟所需的毫秒數；`Infinity`：不會自行開啟。 |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | 指標離開觸發元素與卡片，且焦點不在任一者之中，直到關閉所需的毫秒數；`Infinity`：不會自行關閉。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 它出現在觸發元素的哪一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 它沿該側與觸發元素的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `0` | 觸發元素與卡片之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 它與安全區域邊緣保持的距離。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗的外觀，即放置內容的卡片。 |
| `popupStartingClass`、`popupStartingStyle` | `.popup_starting_class(..)`、`.popup_starting_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗在第一個影格的外觀，疊加於其自身外觀之上：其轉場由此開始執行。 |
| `popupEndingClass`、`popupEndingStyle` | `.popup_ending_class(..)`、`.popup_ending_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗關閉後的外觀，疊加於其自身外觀之上：在其轉場執行期間會保留。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 它所預覽的對象；卡片會相對於它來定位。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容，於每次開啟時產生。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 請求開啟或關閉，並附上原因：`"hover"`、`"focus"`、`"triggerPress"`、`"pressOutside"` 或 `"cancel"`。 |
| `onOpen` | `.on_open(\|\| ..)` | 已顯示。 |
| `onClose` | `.on_close(\|\| ..)` | 已消失，於退場結束後觸發；由應用程式關閉時同樣會觸發。 |
| `onPosition` | `.on_position(\|e\| ..)` | 彈出視窗已完成定位：`placement`（所在的一側）、`bounds`（其影格）、`available`（該側的可用空間）。 |

<a id="accessibility"></a>

## 無障礙

HoverCard 是附加在觸發元素上的功能：觸發元素保有自己的角色與標籤，按壓時所開啟或執行的內容也維持不變。當焦點停留在觸發元素上時，鍵盤使用者會看到卡片，按下 Escape 即可關閉。卡片本身不會取得焦點，因此 Tab 仍會像以前一樣從觸發元素移往下一個元素。卡片中的連結與按鈕會如同其他地方一樣取得焦點，且當其中之一擁有焦點時，卡片會保持開啟；卡片中重要的內容，也應能從觸發元素所通往的頁面中取得。
