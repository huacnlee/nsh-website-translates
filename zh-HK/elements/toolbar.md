---
title: "Toolbar"
description: "Toolbar、ToolbarGroup 和 ToolbarSeparator:由按鈕、切換按鈕和連結組成的工具列,整條工具列只佔一個鍵盤焦點停駐位置,可用方向鍵在其中移動,並支援具名群組和分隔線。各控制項的外觀和狀態由應用程式自行決定。"
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---


# Toolbar

工具列是一列控制項：文字編輯器的格式設定、媒體播放器的播放控制，或是垂直的工具面板。
`Toolbar` 負責工具列的鍵盤操作與語意：螢幕閱讀器會朗讀工具列（以其
`accessibilityLabel` 命名），鍵盤只需一次停駐即可進入，並以其
`axis` 對應的方向鍵在項目之間移動。其項目是內部任何層級的 `Button`、`Toggle` 和 `Link`。`ToolbarGroup` 是一組有名稱的相關項目（復原與重做、對齊方式），`ToolbarSeparator` 則是應用程式在各組之間繪製的線條。外觀由應用程式決定：工具列本身沒有顏色、內距或間距，每個控制項各自保有自己的狀態。

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`、`ToolbarGroup` 和 `ToolbarSeparator` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。工具列不持有任何值：其中的切換鈕會被告知是否已按下並回報 `onChange`，按鈕回報 `onPress`，狀態由應用程式保管。在 Rust 中，`toolbar()`、`toolbar_group()` 和 `toolbar_separator()` 用來建立它們，每個 prop 有對應的 setter（`.axis(..)`、`.disabled(..)`），另有具型別的樣式方法，以及用於內容的 `.child(..)`。

## Props

### Toolbar

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 項目延伸的方向：沿該方向移動的方向鍵（左右，或上下），以及子項目的排列方向（橫列或直欄）。在建立工具列時讀取。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 工具列的每個項目都會停用，不論其自身的 `disabled`：無法按下、不成為鍵盤焦點的停駐點，並對螢幕閱讀器顯示為變暗。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對工具列的稱呼（「格式設定」），適用於一個頁面有多個工具列的情況。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目、其群組和分隔線，以及應用程式在其間排版的其他內容（標題、間隔元件、輸入框）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 工具列的版面與外觀：對齊、間距、內距及其表面。 |

### ToolbarGroup

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 群組的每個項目都會停用，不論其自身的 `disabled`。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對群組的稱呼（「歷史記錄」、「對齊方式」）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 群組的項目，以及應用程式在其間排版的其他內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 群組的版面與外觀。群組沿工具列的軸向排列。 |

### ToolbarSeparator

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 線條：橫跨一列（`h-5 w-px bg-border`）或一欄（`h-px self-stretch bg-border`）的細線。 |

<a id="items"></a>

## 項目

工具列的項目是其內部的 `Button`、`Toggle` 和 `Link`，包括位於其群組之中，以及位於其內部的 [`ToggleGroup`](./toggle.md) 之中的項目。[`Menu`](./menu.md) 或 [`Popover`](./popover.md) 的觸發元件同樣是項目：即其 `trigger` slot 中的視圖，彈出層會為它提供按下、焦點和 `expanded` 狀態。應用程式自行繪製的工具是套用應用程式 class 的 `Button`：`Button` 本身沒有外觀，因此會依應用程式的樣式顯示，並且是項目（`View` 若帶有 `onPress`，則仍是獨立的停駐點，不在方向鍵的範圍內）。工具列內的 `ToggleGroup` 是其群組之一：其切換鈕是工具列的項目，螢幕閱讀器會讀出為一個群組，而其 `disabled` 仍會停用其自身的切換鈕。其他控制項（`Input`、`Select`、`Slider`）仍是獨立的停駐點，並保留各自的方向鍵；請把它們放在工具列的末端。項目開啟的彈出層所顯示的內容（popover 的欄位和按鈕、menu 的項目、hover card 的連結）不屬於工具列。方向鍵依工具列排版的順序走過各個項目，不論項目位於多深的層級，應用程式稍後才顯示的項目也會在其中佔有位置。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 工具列本體 | | `Toolbar` 的 `class`、`style` | |
| 群組 | 工具列 | `ToolbarGroup` 的 `class`、`style` | |
| 分隔線 | 工具列、群組 | `ToolbarSeparator` 的 `class`、`style` | |
| 項目 | 工具列、群組 | 項目自身的 `class`、`style` | 其自身的：`aria-pressed:`、`disabled:`、`hover:`、`focus:`、`active:` |

以 `focus:` 樣式顯示鍵盤所在的項目，已按下的切換鈕則透過其自身的表面顯示（見[設計指南](../docs/design-guides.md#interaction-states)）。

<a id="vertical"></a>

## 垂直排列

工具面板是一欄：`axis="vertical"` 由上而下排列項目，並以上鍵和下鍵沿項目移動。

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## 停用

工具列上的 `disabled` 會停用其中每個項目，即由應用程式鎖定的工具列；用在群組上，則停用該群組的項目。已停用的項目不接受按下，方向鍵會略過它，螢幕閱讀器會將其讀為變暗：

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## 無障礙

- `Toolbar` 的角色為 `"toolbar"`，由 `accessibilityLabel` 命名；其項目仍是各自獨立的元素。在 iOS 上，工具列是 VoiceOver 會進入的語意群組。
- `ToolbarGroup` 的角色為 `"group"`，由其 `accessibilityLabel` 命名，因此一連串項目會被讀為一個單位。工具列內的 `ToggleGroup` 同樣是群組。
- `ToolbarSeparator` 不是螢幕閱讀器的元素。
- `disabled` 依各平台的方式朗讀（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。

標籤、角色和朗讀的一般說明，請見[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和網頁上，Tab 可到達接受按下操作的視圖，`Toolbar` 遵循 [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 進入工具列時，焦點落在上次離開的項目（初次為第一個未停用的項目），並一步離開。 |
| 右、左（`axis="horizontal"`） | 把焦點移到下一個或上一個項目，由最後一個循環到第一個，反之亦然。 |
| 下、上（`axis="vertical"`） | 把焦點移到下一個或上一個項目，由最後一個循環到第一個，反之亦然。 |
| Home、End | 把焦點移到第一個或最後一個項目。 |
| Space、Return | 按下取得焦點的項目。 |

方向鍵會略過已停用的項目，且不會按下任何東西：切換鈕只有在被按下時才會改變。另一對方向鍵留給項目使用（menu 的觸發元件以下鍵開啟其 menu）。在由右至左的版面中，橫向工具列從右方開始排列，因此左鍵移到下一個項目，右鍵移到上一個；直向工具列則仍以下鍵和上鍵移動。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 和 Mac Catalyst：每個項目以輕觸按下；工具列是螢幕閱讀器會朗讀的群組。
- 桌面平台（macOS、Windows、Linux、GPUI）和網頁：按下即是點按。在 macOS 和網頁上，工具列是 Tab 的一個停駐點，方向鍵、Home 和 End 在其項目之間移動（[鍵盤](#keyboard)）。
- 每個平台都會繪製應用程式所設定的樣式：工具列本體、群組、分隔線和項目。
