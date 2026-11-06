---
title: "Scrollbar"
description: "Scrollbar 元件:可為每個捲動視圖和清單(一次性設定的主題)或單一視圖提供應用程式自訂外觀的捲軸,並可放置在應用程式指定的位置。捲軸滑塊會跟隨內容移動,拖曳和按壓操作皆可捲動內容;捲軸可在捲動時、滑鼠懸停時或始終顯示,並按照應用程式設定的時間淡入淡出。"
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---


# Scrollbar

捲軸讓捲動視圖或列表擁有應用程式自家風格的捲軸：一條在指標下會變寬的細長膠囊形滑塊、配合品牌色調的軌道、緊貼固定標題的捲軸，或沿著兩個窗格擺放的捲軸。作為應用程式的主題設定一次後，每個捲動視圖和列表都會繪製一條捲軸，取代平台的指示條（[內建捲軸](#built-in-bars)）；由應用程式自行放置時，捲軸會指明它所控制的捲動視圖，並可放在應用程式指定的任何位置。它自行負責行為：滑塊的長度和位置會隨內容、視口和偏移量而變（列表增長或視窗縮放時亦然）；拖曳滑塊會捲動內容，按一下軌道則會把滑塊的中點移到該處；它會在內容捲動時、指標位於其上時顯示，或始終顯示，並以原生方式淡入淡出。外觀和時間由應用程式決定：`Scrollbar` 本身沒有顏色、尺寸或圓角半徑，在應用程式提供時間之前，淡入淡出不需任何時間。

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`scrollbar()` 會建立一條捲軸，每個 prop 有一個 setter（`.scroll(..)`、`.thumb_style(..)`），並提供用於捲軸本身的具型別樣式方法；其 `scroll` 接受 `ElementRef`（或 `ScrollbarTarget`）。

<a id="built-in-bars"></a>

## 內建捲軸

每個捲動視圖和列表都可以繪製 `Scrollbar` 來取代平台的指示條，無需另外放置捲軸：`Scrollbar.setTheme` 只需在應用程式啟動時設定一次，就會為每個 `scrollbar` 為 `true` 的視圖套用應用程式的捲軸外觀。每個視圖在其視口上方各有自己的捲軸，內容捲動時它會留在原位（在主執行緒上，與黏性視圖相同），並繪製在內容之上；它的跟隨、捲動和淡入淡出方式與已放置的 `Scrollbar` 相同。

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

`ScrollbarTheme` 包含對每個視圖都相同的捲軸 props，以及各軸的外觀：

| 欄位 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | 捲軸何時顯示：[何時顯示](#when-it-shows)。 |
| `motion` | `ScrollbarMotion` | 瞬間切換，`idle` `2000` | 捲軸如何顯示和隱藏：[動態效果](#motion)。 |
| `minThumbLength` | `number` | `48` | 滑塊的最短長度。 |
| `vertical`、`horizontal` | `ScrollbarLook` | 無 | 垂直視圖和水平視圖捲軸的外觀：`class` 和 `style` 用於軌道，放置在視圖的視口內；`thumbClass` 和 `thumbStyle`；`accessibilityLabel`。若某視圖的軸沒有設定外觀，則沿用平台的指示條。 |

之後再設定 `setTheme` 會重新套用捲軸樣式，而 `Scrollbar.setTheme(null)` 會把平台的指示條還給各視圖。單一視圖可透過其 `scrollbar` prop（`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`）使用自己的主題，不論應用程式有否設定主題；`scrollbar={false}` 則讓視圖不顯示捲軸。在父視圖視口中排版的列表（`viewport="parent"`）會與該視圖及其捲軸一同捲動。多行 `Input` 也會在其文字上方獲得垂直外觀的捲軸，並像文字視圖自身的指示條一樣捲動文字。

<a id="the-scroll-view-it-moves"></a>

## 捲軸所控制的捲動視圖

`scroll` 指明捲軸所跟隨的捲動視圖或列表：即其 `ref`。捲軸會在顯示於畫面後才找到它，因此 `ref` 可以由同一次渲染中較後的元素設定；請把捲軸寫在其捲動視圖之後（或把 `ref` 存放在 signal 中）。請用 `scrollbar={false}` 關閉捲動視圖自身的指示條，並用 `class` 放置捲軸：可放在包住兩者的 `relative` 方框內捲動視圖的邊緣之上，或畫面上的任何其他位置。

- 滑塊的長度等於視口所顯示的內容比例，沿著軌道的內容框（在其內距之內）計算，並且不短於 `minThumbLength`。其位置反映內容已捲動的距離；內容在末端彈跳越界時，滑塊會停留在該末端。
- 拖曳滑塊時，內容捲動的幅度與滑塊移動的幅度相同。按一下軌道會把滑塊的中點移到指標之下，之後的拖曳會由該處繼續。
- 垂直捲軸跟隨垂直捲動視圖；`axis="horizontal"` 會為水平捲動視圖建立捲軸（請沿底部邊緣放置）。每個軸只有一條捲軸。
- 列表的運作方式相同：隨著各列被量度和加入，滑塊會跟隨列表的整體長度。

<a id="when-it-shows"></a>

## 何時顯示

| `mode` | 顯示時機 |
|---|---|
| `"scrolling"`（預設） | 內容捲動期間，以及停止後直至 `motion.idle` 為止；捲軸顯示時，指標停在其上會令它保持顯示。 |
| `"hover"` | 指標位於捲軸上方時（即使捲軸處於隱藏狀態，該處也會顯示），並且與 `"scrolling"` 的行為相同。 |
| `"always"` | 始終顯示。 |

在所有模式下，拖曳滑塊時都會顯示，並在最後一次捲動、拖曳或懸停之後保持 `motion.idle`。當內容可完整放入視口時，捲軸保持隱藏。隱藏時，捲軸處於 `opacity: 0`，並讓按壓操作穿透到其下方的元素。

<a id="motion"></a>

## 動態效果

`motion` 設定捲軸淡入淡出的時間，淡入淡出以原生方式執行，與 `gpui-base` 的 `ScrollbarMotion` 相同：

| 欄位 | 預設值 | 說明 |
|---|---|---|
| `idle` | `2000` | 最後一次捲動、拖曳或懸停後，捲軸停留的時間（以毫秒計）。 |
| `enter` | `0` | 出現所需的時間：不透明度線性上升，滑動則為緩出。 |
| `exit` | `0` | `idle` 結束後淡出所需的時間，採用緩入；淡出時會滑出其軌道。 |
| `entrance` | `"fade"` | 進場方式：原地 `"fade"`，或從其所在的邊緣（右側、底部）`"slideAndFade"`。 |
| `thumbHoverEntrance` | `"fade"` | 指標停在已隱藏的滑塊上而令捲軸顯示時的進場方式（`"hover"`）。 |

沒有設定時長時，捲軸會瞬間出現和消失。淡入淡出在中途反轉時會保持其速度：它只會運行尚待完成的那部分時長。`"always"` 捲軸不會有動畫，在使用者要求減少動態效果時，任何捲軸也不會有動畫。軌道會裁剪滑動的部分。滑塊自身的動態效果，例如在 `hover:` 時變寬的寬度，則由其樣式決定（`thumbClass` 上的 `transition-all`）。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | 無 | 捲軸所跟隨和控制的捲動視圖或列表（即其 `ref`）。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | 捲動視圖的軸：軌道沿著它延伸。在捲軸建立時讀取。 |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | 捲軸何時顯示。 |
| `motion` | `.motion(..)` | `ScrollbarMotion` | 瞬間切換，`idle` `2000` | 捲軸如何顯示和隱藏：[動態效果](#motion)。 |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | 內容很長時滑塊的最短長度，使它仍然容易抓取。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 滑塊。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對捲軸的朗讀內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 捲軸：其軌道，位於應用程式放置的位置。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定 |
|---|---|---|
| 軌道 | 應用程式放置的位置 | `class`、`style` |
| 滑塊 | 軌道的內容框 | `thumbClass`、`thumbStyle` |

捲軸負責沿軸向調整滑塊的大小並移動它；其粗細以及在軌道上橫向的位置則由應用程式決定（在軌道上設定 `w-1.5` 和 `items-end`，會把 6 點寬的滑塊放在右側）。軌道的內距讓滑塊與其兩端和兩側保持距離。

各部分會呈現的狀態：

- 軌道：指標在其下時為 `hover:`；它是 `group`，因此滑塊會從它取得 `group-hover:`（指標靠近時滑塊會變寬）。
- 滑塊：指標在其下時為 `hover:`，被拖曳時為 `active:`。

捲軸的可見度就是它的不透明度：請把顏色的透明度設定在軌道的背景或滑塊上。會變寬的滑塊使用 `transition-all`（它絕不會延遲滑塊的位置，因為捲軸設定位置時與滑塊的樣式無關），而 `motion-reduce:` 會讓要求減少動態效果的使用者看到靜止的滑塊。

<a id="accessibility"></a>

## 無障礙

- 捲動視圖仍然是螢幕閱讀器所捲動的對象：它們以自己的手勢移動捲動視圖並朗讀其內容。
- 對於能夠接觸到捲軸的螢幕閱讀器，捲軸以 `accessibilityLabel` 作為標籤。

有關標籤、角色和操作的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 每個平台都會繪製應用程式所設定的樣式，而滑塊會跟隨各平台為捲動視圖回報的偏移量。拖曳滑塊和按壓軌道都支援滑鼠、手寫筆或手指。
- `"hover"` 跟隨滑鼠或觸控板指標（桌面平台和網頁）；在觸控螢幕上，捲軸會在內容捲動時顯示，而其隱藏的軌道會讓觸控穿透。
