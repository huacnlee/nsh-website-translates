---
title: "Toolbar"
description: "Toolbar、ToolbarGroup 與 ToolbarSeparator:由按鈕、切換鈕與連結組成的工具列,整體僅佔鍵盤焦點的一個停駐點,可用方向鍵在其中移動,並支援具名群組與分隔線。各控制項的外觀與狀態由應用程式自行決定。"
group: base
demo: el-toolbar
---

# Toolbar

工具列是一條控制項列：文字編輯器的格式設定、媒體播放器的播放控制、垂直排列的工具面板。
`Toolbar` 負責工具列的鍵盤操作與語意：螢幕閱讀器會朗讀工具列（以其
`accessibilityLabel` 命名），鍵盤只需一次停留即可到達，並以其
`axis` 對應的方向鍵在各項目之間移動。其項目是位於其中任何層級的 `Button`、`Toggle` 與 `Link`。`ToolbarGroup` 是一組具名的
相關項目（復原與重做、對齊方式），`ToolbarSeparator` 則是應用程式在各組之間繪製的線。外觀由應用程式決定：
工具列本身沒有顏色、內距或間距，每個控制項各自保有自己的狀態。

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

`Toolbar`、`ToolbarGroup` 與 `ToolbarSeparator` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。工具列不持有任何值：
其中的切換按鈕會被告知是否已按下，並回報 `onChange`；按鈕則回報 `onPress`，狀態由應用程式自行保管。在 Rust 中，
`toolbar()`、`toolbar_group()` 與 `toolbar_separator()` 用來建立它們，每個屬性都有對應的 setter（`.axis(..)`、`.disabled(..)`），另有具型別的樣式方法，以及用於內容的
`.child(..)`。

<a id="props"></a>

## 屬性

<a id="toolbar-1"></a>

### Toolbar

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 項目排列的方向：沿此方向移動的方向鍵（左右鍵，或上下鍵），以及子元素的排版方向（橫列或直欄）。於建立工具列時讀取。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 工具列的所有項目一律停用，不論各自的 `disabled` 為何：無法按下、不再是鍵盤焦點的停留點，並對螢幕閱讀器顯示為已淡化。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對工具列的稱呼（如「Formatting」），適用於同一頁面有多個工具列的情況。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目、其群組與分隔線，以及應用程式在其間排版的其他內容（標題、間隔元素、輸入框）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 工具列的版面與外觀：對齊、間距、內距、表面。 |

### ToolbarGroup

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 群組的所有項目一律停用，不論各自的 `disabled` 為何。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對群組的稱呼（如「History」、「Alignment」）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 群組的項目，以及應用程式在其間排版的其他內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 群組的版面與外觀。沿著工具列的軸向排列。 |

### ToolbarSeparator

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 線條：橫列中（`h-5 w-px bg-border`）或直欄中（`h-px self-stretch bg-border`）橫跨的細線。 |

<a id="items"></a>

## 項目

工具列的項目是位於其中的 `Button`、`Toggle` 與 `Link`，包含在其群組內，以及在其內的
[`ToggleGroup`](./toggle.md) 中的這些控制項。[`Menu`](./menu.md) 或 [`Popover`](./popover.md) 的觸發元件同樣是
項目：即其 `trigger` 插槽中的檢視，彈出層會賦予它按下、焦點與 `expanded` 狀態。應用程式自行繪製的
工具是帶有應用程式類別的 `Button`：`Button` 本身沒有外觀，因此外觀完全依應用程式的樣式而定，且屬於項目（帶有 `onPress` 的 `View`
仍是獨立的停留點，不受方向鍵控制）。工具列內的 `ToggleGroup` 屬於其群組之一：其切換按鈕即是工具列的項目，螢幕閱讀器會讀出一個群組，
而其 `disabled` 仍會停用它自己的切換按鈕。其他控制項（`Input`、`Select`、`Slider`）仍是各自獨立的停留點，並保留自己的方向鍵；請將它們放在工具列的末端。項目所開啟的彈出層所顯示的內容（popover 的
欄位與按鈕、選單的項目、hover card 的連結）不屬於工具列。方向鍵依工具列排版的順序走過各個項目，不論每個項目位於多深的層級，
應用程式稍後才顯示的項目也會在其中佔有相應的位置。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 工具列本體 | | `Toolbar` 的 `class`、`style` | |
| 群組 | 工具列 | `ToolbarGroup` 的 `class`、`style` | |
| 分隔線 | 工具列、群組 | `ToolbarSeparator` 的 `class`、`style` | |
| 項目 | 工具列、群組 | 項目自己的 `class`、`style` | 自身的：`aria-pressed:`、`disabled:`、`hover:`、`focus:`、`active:` |

請以 `focus:` 樣式顯示鍵盤目前所在的項目，並透過切換按鈕自身的表面呈現其已按下的狀態（請參閱
[設計指南](../docs/design-guides.md#interaction-states)）。

<a id="vertical"></a>

## 垂直

工具面板是一個直欄：`axis="vertical"` 會將項目由上到下排列，並以上、下鍵沿著項目移動。

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

在工具列上設定 `disabled` 會停用其中的每個項目，也就是由應用程式鎖定的工具列；在群組上則停用該群組的項目。已停用的項目
無法按下，方向鍵會跳過它，螢幕閱讀器會將其朗讀為已淡化：

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## 無障礙

- `Toolbar` 的角色為 `"toolbar"`，以 `accessibilityLabel` 命名；其項目仍是各自獨立的元素。在 iOS 上，
  工具列是 VoiceOver 可進入的語意群組。
- `ToolbarGroup` 的角色為 `"group"`，以其 `accessibilityLabel` 命名，因此一組項目會被讀成一個單元。工具列內的
  `ToggleGroup` 同樣是群組。
- `ToolbarSeparator` 對螢幕閱讀器而言不是元素。
- `disabled` 依平台自身的方式朗讀（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙
  樹）。

有關標籤、角色與朗讀的一般說明，請參閱 [無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 與網頁上，Tab 可到達會接受按下操作的檢視，`Toolbar` 遵循
[WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 進入工具列時停在焦點上次離開的項目（初次則為第一個未停用的項目），並一步離開工具列。 |
| 右、左（`axis="horizontal"`） | 將焦點移到下一個或上一個項目，從最後一個循環到第一個，反之亦然。 |
| 下、上（`axis="vertical"`） | 將焦點移到下一個或上一個項目，從最後一個循環到第一個，反之亦然。 |
| Home、End | 將焦點移到第一個或最後一個項目。 |
| Space、Return | 按下目前取得焦點的項目。 |

方向鍵會跳過已停用的項目，且不會按下任何東西：切換按鈕只有在被按下時才會改變。另一組
方向鍵留給項目自己使用（選單的觸發元件以下鍵開啟其選單）。在由右至左的版面中，橫向
工具列從右側開始排列，因此左鍵移到下一個項目，右鍵移到上一個項目；直向工具列則維持下鍵與
上鍵不變。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 與 Mac Catalyst：每個項目以輕點按下；工具列是螢幕閱讀器會朗讀的群組。
- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：按下即是點擊。在 macOS 與網頁上，工具列是 Tab 的單一停留點，
  方向鍵、Home 與 End 在其項目之間移動（[鍵盤](#keyboard)）。
- 每個平台都會繪製應用程式所設定樣式的內容：工具列、其群組、其分隔線與其項目。
