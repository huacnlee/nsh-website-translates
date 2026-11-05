---
title: "Scrollbar"
description: "Scrollbar 元件:一個具有應用程式自有外觀的捲軸,可透過一次性設定的主題套用於所有捲動檢視與清單,也可僅套用於單一檢視,並可放置在應用程式指定的位置;其滑塊會跟隨內容移動,拖曳與按壓皆可捲動內容;可選擇在捲動時、滑鼠懸停時或始終顯示,並依應用程式設定的時間淡入與淡出。"
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# 捲軸

捲軸讓捲動檢視或清單擁有應用程式自己風格的捲軸：一個指標移上去會變寬的細長膠囊形滑塊、符合品牌色調的軌道、位於固定標題旁或沿著兩個窗格的捲軸。將其設為應用程式的主題後，每個捲動檢視與清單都會繪製一個捲軸來取代平台的指示器（[內建捲軸](#built-in-bars)）；由應用程式自行放置時，它會指定所要移動的捲動檢視，並可放在應用程式指定的任何位置。它自行負責其行為：滑塊的長度與位置會隨內容、可視區域與偏移量而變（清單增長或視窗調整大小時亦然）；拖曳滑塊會捲動內容，在軌道上按一下會讓滑塊的中央移到該處；它會在內容捲動時、指標位於其上時，或始終顯示，並以原生方式淡入淡出。外觀與時間由應用程式決定：`Scrollbar` 本身沒有顏色、尺寸或圓角，在應用程式給定時間之前，淡入淡出不耗費任何時間。

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

`Scrollbar` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`scrollbar()` 會以每個屬性一個設定方法（`.scroll(..)`、`.thumb_style(..)`）以及捲軸本身的具型別樣式方法來建立捲軸；其 `scroll` 接受 `ElementRef`（或 `ScrollbarTarget`）。

<a id="built-in-bars"></a>

## 內建捲軸

每個捲動檢視與清單都可以繪製 `Scrollbar` 來取代平台的指示器，無需另外放置捲軸：`Scrollbar.setTheme` 只需在應用程式啟動時設定一次，就會為每個 `scrollbar` 為 `true` 的檢視賦予應用程式的捲軸外觀。每個檢視在其可視區域上方各有自己的捲軸，內容捲動時它仍留在原處（與黏性檢視一樣，於主執行緒上處理），並繪製在內容之上；它的跟隨、捲動與淡入淡出方式與已放置的 `Scrollbar` 相同。

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

`ScrollbarTheme` 包含對所有檢視都相同的捲軸屬性，以及每個軸向的外觀：

| 欄位 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | 捲軸何時顯示：[何時顯示](#when-it-shows)。 |
| `motion` | `ScrollbarMotion` | 立即切換，`idle` `2000` | 捲軸如何顯示與隱藏：[動態效果](#motion)。 |
| `minThumbLength` | `number` | `48` | 滑塊的最短長度。 |
| `vertical`、`horizontal` | `ScrollbarLook` | 無 | 垂直檢視與水平檢視的捲軸外觀：軌道使用 `class` 與 `style`，並放置於檢視的可視區域中；此外還有 `thumbClass` 與 `thumbStyle`；以及 `accessibilityLabel`。若檢視的某個軸向沒有設定外觀，則保留平台的指示器。 |

之後的 `setTheme` 會重新設定捲軸樣式，而 `Scrollbar.setTheme(null)` 會把平台的指示器還給各檢視。單一檢視可以透過自己的 `scrollbar` 屬性（`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`）採用專屬主題，無論應用程式是否已設定主題皆然；`scrollbar={false}` 會讓檢視不顯示捲軸。在其父層可視區域中排版的清單（`viewport="parent"`）會與該檢視及其捲軸一起捲動。多行的 `Input` 也會在文字上方取得其垂直外觀的捲軸，並像文字檢視自己的指示器一樣捲動文字。

<a id="the-scroll-view-it-moves"></a>

## 它所移動的捲動檢視

`scroll` 指定捲軸所跟隨的捲動檢視或清單，也就是它的 `ref`。捲軸會在其顯示於畫面後找到它，因此 `ref` 可以由同一次渲染中較後面的元素設定；請把捲軸寫在其捲動檢視之後（或將 `ref` 保存在 signal 中）。使用 `scrollbar={false}` 關閉捲動檢視自己的指示器，並使用 `class` 放置捲軸：可置於捲動檢視邊緣之上、包住兩者的 `relative` 方塊中，或畫面上的其他任何位置。

- 滑塊的長度等於可視區域所顯示內容的比例，沿著軌道的內容方塊（其內距之內）計算，且不短於 `minThumbLength`。它的位置代表內容已捲動的距離；當內容彈跳超出任一端時，滑塊會停在該端。
- 拖曳滑塊時，內容捲動的量等於滑塊移動的量。在軌道上按一下會讓滑塊的中央移到指標下方，之後的拖曳會從該處繼續。
- 垂直捲軸跟隨垂直捲動檢視；`axis="horizontal"` 會為水平捲動檢視建立捲軸（請將它沿底部邊緣放置）。每個軸向一個捲軸。
- 清單的運作方式相同：隨著列被測量與新增，滑塊會跟隨清單的整體長度。

<a id="when-it-shows"></a>

## 何時顯示

| `mode` | 顯示時機 |
|---|---|
| `"scrolling"`（預設） | 內容捲動時，並在停止後持續到 `motion.idle` 為止；捲軸顯示期間若指標位於其上，則會持續顯示。 |
| `"hover"` | 指標位於捲軸上時（即使處於隱藏狀態，它所在之處仍會顯示），以及與 `"scrolling"` 相同的時機。 |
| `"always"` | 始終顯示。 |

在所有模式下，拖曳滑塊時都會顯示，並在最後一次捲動、拖曳或懸停之後維持 `motion.idle`。當內容能容納於可視區域時，捲軸保持隱藏。隱藏時，捲軸的狀態為 `opacity: 0`，並讓按下的操作穿透到其下方的元素。

<a id="motion"></a>

## 動態效果

`motion` 控制捲軸淡入淡出的時間，這些效果以原生方式執行，與 `gpui-base` 的 `ScrollbarMotion` 相同：

| 欄位 | 預設值 | 說明 |
|---|---|---|
| `idle` | `2000` | 捲軸在最後一次捲動、拖曳或懸停後停留的時間，單位為毫秒。 |
| `enter` | `0` | 出現所需的時間：不透明度線性上升，滑動則採用緩出。 |
| `exit` | `0` | 在 `idle` 結束後淡出所需的時間，採用緩入；淡出時會滑出其軌道。 |
| `entrance` | `"fade"` | 進場方式：原地 `"fade"`，或從其所在的邊緣（右側、底部）`"slideAndFade"`。 |
| `thumbHoverEntrance` | `"fade"` | 指標位於隱藏的滑塊上而使其顯示時（`"hover"`）的進場方式。 |

若未設定時間長度，捲軸會立即出現與消失。淡入淡出在中途反轉時會保持其速度：它會執行剩餘尚未完成的那一部分時間。`"always"` 捲軸從不播放動畫，在使用者要求減少動態效果時，任何捲軸也都不會。軌道會裁切滑動的部分。滑塊自身的動態效果，例如在 `hover:` 時變寬的寬度，則由其樣式決定（`thumbClass` 上的 `transition-all`）。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | 無 | 捲軸所跟隨並移動的捲動檢視或清單（其 `ref`）。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | 捲動檢視的軸向：軌道沿著它延伸。在建立捲軸時讀取。 |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | 捲軸何時顯示。 |
| `motion` | `.motion(..)` | `ScrollbarMotion` | 立即切換，`idle` `2000` | 捲軸如何顯示與隱藏：[動態效果](#motion)。 |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | 內容很長時滑塊的最短長度，使其保持容易抓取。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 滑塊。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對捲軸的朗讀內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 捲軸：它的軌道，位於應用程式放置之處。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定方式 |
|---|---|---|
| 軌道 | 應用程式放置之處 | `class`、`style` |
| 滑塊 | 軌道的內容方塊 | `thumbClass`、`thumbStyle` |

捲軸會沿著軸向調整滑塊的大小並移動它；滑塊的粗細及其在軌道上橫向的位置則由應用程式決定（在軌道上設定 `w-1.5` 與 `items-end`，會在右側放置一個 6 點寬的滑塊）。軌道的內距可讓滑塊遠離其兩端與兩側。

各部分會顯示的狀態：

- 軌道：指標位於其下時為 `hover:`；它是一個 `group`，因此滑塊會從它取得 `group-hover:`（例如指標靠近時會變寬的滑塊）。
- 滑塊：指標位於其下時為 `hover:`，被拖曳時為 `active:`。

捲軸的可見度就是它的不透明度：請將顏色的透明度設定在軌道的背景或滑塊上。會變寬的滑塊使用 `transition-all`（它絕不會延遲滑塊的位置，位置由捲軸獨立於滑塊樣式之外設定），而 `motion-reduce:` 會讓要求減少動態效果的使用者看到它保持靜止。

<a id="accessibility"></a>

## 無障礙

- 螢幕閱讀器所捲動的仍是捲動檢視：它們以自己的手勢移動它，並朗讀其內容。
- 對於能夠存取捲軸的螢幕閱讀器，捲軸以 `accessibilityLabel` 作為標籤。

關於標籤、角色與動作的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 每個平台都會繪製應用程式所設定的樣式，滑塊則跟隨各平台為捲動檢視所回報的偏移量。拖曳滑塊與在軌道上按壓，可使用滑鼠、手寫筆或手指操作。
- `"hover"` 會跟隨滑鼠或觸控板的指標（桌面平台與網頁）；在觸控螢幕上，捲軸會在內容捲動時顯示，其隱藏的軌道則會讓觸控穿透。
