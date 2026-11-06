---
title: "Pagination"
description: "Pagination 元件:在一組頁面之間切換,顯示目前頁面前後的頁碼、省略號、「上一頁」與「下一頁」、精簡版分頁器、鍵盤操作,以及供螢幕閱讀器使用的目前頁面資訊,樣式由應用程式自行決定。"
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---


# Pagination

Pagination 在一組頁面之間移動：搜尋結果、表格的資料列、封存內容。它顯示「上一頁」、當前頁面前後的頁面（首頁和末頁必定顯示，每段被省略的頁面以一個省略號表示）、應用程式的子元件，以及「下一頁」。它負責行為：顯示哪些頁面、按下操作、鍵盤、在首尾兩端停用「上一頁」和「下一頁」、導覽地標，以及供螢幕閱讀器使用的當前頁面。外觀由應用程式決定：各項目本身沒有顏色、大小或標籤，由應用程式為它們設定樣式或自行繪製。

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

`Pagination` 來自 Rust 的 `nsh-base` crate [`nsh/base`](../modules/nsh-base.md)。在 Rust 中，`pagination()` 會建立一個 Pagination，每個 prop 各有一個 setter（`.page(..)`、`.total_pages(..)`），以 `.on_change(..)` 處理使用者選取的頁面，以具型別的樣式方法設定資料列，並以 `.child(..)` 放入應用程式的內容。

<a id="the-page"></a>

## 頁面

頁面由應用程式掌管：`page` 是當前頁面，從 1 起算；`onChange({ page })` 會回報使用者透過按下某一頁、「上一頁」或「下一頁」所選取的頁面。應用程式設定該頁、載入該頁並顯示其資料列。`totalPages` 是總頁數；超出末頁的 `page` 會顯示末頁。按下當前頁面不會回報任何事件，在首頁按「上一頁」和在末頁按「下一頁」亦然。

<a id="the-pages-shown"></a>

## 顯示的頁面

使用 `visiblePages`（至少為 5，此為預設值）時，只要空間足夠，資料列會顯示所有頁面。超出後，它會顯示首頁和末頁，以及當前頁面和其兩側盡可能多的頁面，`(visiblePages - 3) / 2`，並為每段被省略的頁面顯示一個省略號：

| 共 20 頁中的 `page`，`visiblePages={7}` | 顯示 |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

即使有一萬頁，也只會顯示同樣的七個項目。奇數的 `visiblePages` 會使當前頁面居中。

<a id="items"></a>

## 項目

每個項目都會套用應用程式的 `itemClass` 和 `itemStyle`：當前頁面是 `selected:`，不接受按下操作的項目是 `disabled:`，擁有鍵盤焦點的項目是 `focus:`。資料列的版面由應用程式以 `class` 決定（預設為橫排；`gap-*`、`justify-*`）。

沒有 `renderItem` 時，頁面顯示its頁碼，省略號顯示 `…`，「上一頁」和「下一頁」則顯示其無障礙標籤（沒有標籤時為 `‹` 和 `›`）。`renderItem` 會根據 `PaginationItemState` 繪製每個項目的內容：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | 項目的種類。 |
| `page` | `number` | 頁面的頁碼；「上一頁」或「下一頁」前往的頁面（在兩端時為當前頁面）；省略號所隱藏的第一頁。 |
| `start`、`end` | `number` | 省略號所隱藏的頁面：包含 `start`，不包含 `end`（下一個顯示的頁面）。 |
| `current` | `boolean` | 當前頁面。 |
| `disabled` | `boolean` | 不接受按下操作：首頁的「上一頁」、末頁的「下一頁」，以及已停用的 Pagination 中的所有項目。 |

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

省略號本身不接受按下操作：它的作用由應用程式決定。在其中繪製的 `Menu` 會列出它所隱藏的頁面，就如上方的 `JumpMenu` 一樣。

<a id="compact"></a>

## 精簡模式

`compact` 只顯示「上一頁」、子元件和「下一頁」：適用於窄螢幕的翻頁器，頁碼資訊由子元件顯示。

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

在兩種形式中，子元件都位於頁面之後、「下一頁」之前：例如頁數統計，或用來跳到指定頁面的欄位。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | 必填 | 當前頁面，從 1 起算；應用程式在 `onChange` 中設定。 |
| `totalPages` | `.total_pages(..)` | `number` | 必填 | 總頁數，至少為 1。 |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | 同時顯示的最多頁數，包括首頁和末頁；至少為 5。 |
| `compact` | `.compact(..)` | `boolean` | `false` | 只顯示「上一頁」、子元件和「下一頁」。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 沒有任何項目接受按下操作或鍵盤焦點；`disabled:` 樣式仍會套用，而螢幕閱讀器會表示它們已變暗。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對該導覽的稱呼：即它所分頁的內容。 |
| `previousAccessibilityLabel`、`nextAccessibilityLabel` | `.previous_accessibility_label(..)`、`.next_accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對「上一頁」和「下一頁」的朗讀內容，以及在沒有 `renderItem` 時它們的內容。 |
| `itemClass`、`itemStyle` | `.item_class(..)`、`.item_style(\|s\| ..)` | `string`、`StyleProp<TextStyle>` | 無 | 各項目的外觀：`selected:` 用於當前頁面，另有 `disabled:`、`focus:`；文字樣式會傳給其內容。 |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | 無 | 根據項目的狀態繪製其內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的內容，位於頁面之後、「下一頁」之前。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 資料列的外觀和版面。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`：使用者透過某一頁、「上一頁」或「下一頁」所選取的頁面。當前頁面不會被回報。 |

<a id="motion"></a>

## 動態效果

當前頁面會依照應用程式的 `selected:` class 所指定的方式，由一個項目移到另一個項目：在 `itemClass` 上設定 `transition-colors`，會令高亮顯示由原來的頁面淡出並移至新到達的頁面。換頁時每個項目都保持原位，只更改項目所顯示的內容，因此資料列不會閃爍；啟用減少動態效果（`motion-reduce:transition-none`）時，應用程式的過渡效果會保持靜止。

<a id="accessibility"></a>

## 無障礙功能

- 資料列是導覽地標，以 `accessibilityLabel` 命名。
- 每個頁面、「上一頁」和「下一頁」都是按鈕。當前頁面會被朗讀為當前頁面（ARIA 的 `aria-current="page"`）並處於選取狀態；首頁的「上一頁」和末頁的「下一頁」會變暗。
- 在 macOS 和 web 上，每個頁面、「上一頁」和「下一頁」都是鍵盤焦點的停駐點，可按 Return 和 Space 來按下。以鍵盤按下某一頁後，待應用程式顯示該頁，焦點會保留在該頁上，無論它在資料列中的位置為何；當「上一頁」或「下一頁」到達首頁或末頁時，焦點亦會保留在該頁上。

有關標籤、角色和朗讀通知的一般說明，請參閱 [無障礙功能](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst：按下操作是在項目上結束的輕按。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：按下操作是點按；在 macOS 和 web 上，可用 Tab 鍵移到各項目。
- 所有平台都會繪製應用程式所設定的樣式。
