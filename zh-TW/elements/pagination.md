---
title: "Pagination"
description: "Pagination 元件:用於在一組頁面之間切換,包含目前頁面周圍的頁碼、省略號、上一頁與下一頁、精簡版分頁器、鍵盤操作,以及供螢幕閱讀器辨識的目前頁面,並由應用程式自行設定樣式。"
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# Pagination

Pagination 用於在一組頁面之間切換，例如搜尋結果、表格的資料列或封存內容。它會顯示「上一頁」、目前頁面周圍的頁碼（第一頁與最後一頁一律顯示，每一段被省略的頁碼以一個省略符號表示）、應用程式的子元素，以及「下一頁」。它負責處理行為：要顯示哪些頁碼、按下操作、鍵盤操作、在首尾頁停用「上一頁」與「下一頁」，以及提供給螢幕閱讀器的導覽地標與目前頁面資訊。外觀則由應用程式決定：各項目本身沒有顏色、尺寸或標籤，由應用程式為它們設定樣式或自行繪製。

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`pagination()` 會建立一個 pagination：每個 prop 各有一個 setter（`.page(..)`、`.total_pages(..)`），以 `.on_change(..)` 處理使用者選取的頁面，以具型別的樣式方法設定資料列，並以 `.child(..)` 放入應用程式的內容。

<a id="the-page"></a>

## 頁面

頁面由應用程式掌控：`page` 是目前頁面（從 1 起算），`onChange({ page })` 會回報使用者透過按下某個頁碼、「上一頁」或「下一頁」所選取的頁面。應用程式負責設定它、載入該頁並顯示其資料列。`totalPages` 是總頁數；超出最後一頁的 `page` 會顯示最後一頁。按下目前頁面不會回報任何事件，在第一頁按下「上一頁」以及在最後一頁按下「下一頁」也一樣。

<a id="the-pages-shown"></a>

## 顯示的頁碼

使用 `visiblePages`（至少為 5，此為預設值）時，只要放得下，資料列就會顯示所有頁碼。超過之後，它會顯示第一頁與最後一頁、目前頁面以及其兩側盡可能放得下的頁碼，`(visiblePages - 3) / 2`，並以一個省略符號代表每一段被省略的頁碼：

| 20 頁中的 `page`，`visiblePages={7}` | 顯示 |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

即使有一萬頁，也同樣只顯示七個項目。奇數的 `visiblePages` 會讓目前頁面置中。

<a id="items"></a>

## 項目

每個項目都會採用應用程式的 `itemClass` 與 `itemStyle`：目前頁面為 `selected:`，不接受按下操作的項目為 `disabled:`，擁有鍵盤焦點的項目為 `focus:`。資料列的版面由應用程式以 `class` 自行配置（預設為橫列；`gap-*`、`justify-*`）。

未設定 `renderItem` 時，頁碼項目顯示其數字，省略符號顯示 `…`，「上一頁」與「下一頁」則顯示其無障礙標籤（若無標籤則分別為 `‹` 與 `›`）。`renderItem` 會根據 `PaginationItemState` 繪製每個項目的內容：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | 項目的種類。 |
| `page` | `number` | 頁碼項目的數字；「上一頁」或「下一頁」要前往的頁面（在首尾頁時為目前頁面）；省略符號所隱藏的第一頁。 |
| `start`、`end` | `number` | 省略符號所隱藏的頁面：包含 `start`，不包含 `end`（下一個顯示的頁面）。 |
| `current` | `boolean` | 目前頁面。 |
| `disabled` | `boolean` | 不接受按下操作：第一頁的「上一頁」、最後一頁的「下一頁」，以及已停用的 pagination 中的所有項目。 |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

省略符號本身不接受按下操作，其行為由應用程式決定。繪製於其中的 `Menu` 會列出它所隱藏的頁面，如上方的 `JumpMenu` 所示。

<a id="compact"></a>

## 精簡模式

`compact` 只顯示「上一頁」、子元素與「下一頁」：適用於窄螢幕的分頁器，頁面資訊則由子元素呈現。

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

無論哪種形式，子元素都位於頁碼之後、「下一頁」之前，例如頁數統計或前往指定頁面的欄位。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | 必填 | 目前頁面，從 1 起算；由應用程式在 `onChange` 中設定。 |
| `totalPages` | `.total_pages(..)` | `number` | 必填 | 總頁數，至少為 1。 |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | 同時顯示的最多頁數，包含第一頁與最後一頁；至少為 5。 |
| `compact` | `.compact(..)` | `boolean` | `false` | 只顯示「上一頁」、子元素與「下一頁」。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 沒有任何項目接受按下操作或鍵盤焦點；`disabled:` 樣式仍會套用，且螢幕閱讀器會說明它們已停用。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對此導覽的稱呼：即它所分頁的內容。 |
| `previousAccessibilityLabel`、`nextAccessibilityLabel` | `.previous_accessibility_label(..)`、`.next_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對「上一頁」與「下一頁」的朗讀內容，在沒有 `renderItem` 時也是它們的顯示內容。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(\|s\| ..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個項目的外觀：目前頁面使用 `selected:`，另有 `disabled:`、`focus:`；文字樣式會傳遞給其內容。 |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | 無 | 根據項目的狀態繪製其內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的內容，位於頁碼之後、「下一頁」之前。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 資料列的外觀與版面。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`：使用者透過頁碼、「上一頁」或「下一頁」所選取的頁面。目前頁面永遠不會被回報。 |

<a id="motion"></a>

## 動態效果

目前頁面會依照應用程式的 `selected:` class 在項目之間移動：在 `itemClass` 上使用 `transition-colors`，會讓醒目標示從原本的頁面淡出並淡入到新到達的頁面。換頁時，每個項目都保持在原位，只改變項目所顯示的內容，因此資料列不會閃爍；啟用減少動態效果時，應用程式的轉場會停止（`motion-reduce:transition-none`）。

<a id="accessibility"></a>

## 無障礙

- 資料列是一個導覽地標，其名稱由 `accessibilityLabel` 提供。
- 每個頁碼、「上一頁」與「下一頁」都是按鈕。目前頁面會被朗讀為目前頁面（ARIA 的 `aria-current="page"`）並處於選取狀態；第一頁的「上一頁」與最後一頁的「下一頁」呈現為停用。
- 在 macOS 與網頁上，每個頁碼、「上一頁」與「下一頁」都是鍵盤焦點的停駐點，按下 Return 與空白鍵即可觸發。以鍵盤按下某個頁碼後，一旦應用程式顯示該頁，焦點會保留在該頁碼上，無論它在資料列中的位置為何；當「上一頁」或「下一頁」抵達第一頁或最後一頁時，焦點也會停留在該頁。

標籤、角色與朗讀通知的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 與 Mac Catalyst：按下操作是在某個項目上結束的輕點。
- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：按下操作是點擊；在 macOS 與網頁上，可用 Tab 鍵移到各項目。
- 所有平台都會繪製應用程式所設定的樣式。
