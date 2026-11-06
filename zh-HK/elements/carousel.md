---
title: "Carousel"
description: "Carousel 及其組成部分：每次只在同一個位置顯示一張投影片，可透過滑動、滾輪與觸控板（採用平台原生的捲動方式）、上一張與下一張控制項、分頁指示器以及鍵盤來切換，並可在首尾之間無縫循環。Carousel 負責管理目前顯示哪一張投影片、對齊吸附、循環、按鍵操作與無障礙功能；外觀與所有標籤則由應用程式自行決定。"
group: base
demo: el-carousel
---

# Carousel

輪播一次只在同一個位置顯示一張投影片：商品的相片、引導流程的步驟、自動輪換的橫幅，或是一排卡片。`Carousel` 負責行為：目前顯示哪一張投影片、投影片之間的滑動、上一張與下一張控制項、分頁指示、方向鍵、在兩端循環，以及螢幕閱讀器會朗讀的內容。它的各個部件透過 context 找到它，因此應用程式可以在自己的版面中自由安排這些部件。外觀由應用程式決定：輪播本身沒有任何顏色、尺寸、箭頭、圓點或標籤。

內容是原生的捲動檢視。手指、滾輪與觸控板會在平台的主執行緒上移動投影片，並與指標在同一個影格中同步；放開後，內容會貼齊最近的一張投影片，每次快速滑動只前進一張。內容靜止後，輪播會以 `onChange` 回報目前的投影片。控制項、分頁指示、按鍵以及應用程式的 `index` 會以動畫將內容原生捲動到該投影片。

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` 及其部件來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 的 `nsh-base` crate。顯示哪一張投影片由應用程式的 `index` 決定：滑動、控制項或按鍵會以 `onChange` 回報下一張，輪播再捲動到應用程式回傳的 `index`。滑動後停下來的那張投影片會持續顯示，直到應用程式回應其 `onChange` 為止：若應用程式將它回傳為 `index`，則會停留在該張；若應用程式保留原本的 `index`，內容會以動畫彈回應用程式指定的投影片。未設定 `index` 時，輪播會自行保存目前的投影片，起始值來自 `defaultIndex`。在 Rust 中，`carousel()`、`carousel_content()`、`carousel_item()`、`carousel_previous()`、`carousel_next()`、`carousel_pagination()` 與 `carousel_pagination_item()` 用來建立各個部件，每個屬性都有對應的 setter（`.index(..)`），每個事件都有對應的 listener（`.on_change(..)`），另有具型別的樣式方法，以及用於放置內容的 `.child(..)`。

## Props

<a id="carousel-1"></a>

### Carousel

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 無 | 目前顯示的投影片，從 0 開始，並限制在實際的投影片數量之內。由應用程式掌控：變更會以 `onChange` 回報，新的 `index` 會以動畫捲動到該處。 |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | 一開始顯示的投影片，僅在未設定 `index` 時有效。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 投影片依序排列的方向；於建立輪播時讀取。垂直輪播的方向鍵為上與下。 |
| `looping` | `.looping(..)` | `boolean` | `false` | 投影片首尾相接循環：最後一張之後是第一張，第一張之前是最後一張，且無縫銜接，適用於滑動、上一張、下一張、按鍵以及應用程式的 `index`（[循環](#looping)）。於建立輪播時讀取。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對輪播（一個區域）的稱呼：說明這些投影片是什麼（`"Featured products"`）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | `CarouselContent`、控制項，以及應用程式在它們周圍安排的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 輪播的版面：內容與控制項的位置。 |

### CarouselContent

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個 `CarouselItem`，每一個都是內容的子元素。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 可視區域的大小，以及投影片在其中形成的軌道：投影片之間的 `gap`，以及讓目前投影片旁邊的投影片露出一角的 padding。 |

### CarouselItem

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對投影片（一個群組）的稱呼：它在所有投影片中的位置，以及它所顯示的內容（`"2 of 5: Ocean view"`）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 投影片的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 沿軸向的大小（每個視野一張投影片用 `w-full`，三張用 `basis-1/3`）與外觀。在循環的輪播中，它的位移由輪播控制：請將 `transform` 加在它內部的檢視上。 |

### CarouselPrevious, CarouselNext

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 控制項的名稱，用於其子元素沒有文字可說明用途時（例如箭頭圖示）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的圖示或標籤。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 外觀與位置：位於內容旁邊，或以 `absolute` 疊放在其邊緣上。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 被按下、懸停、取得焦點，或在端點停用時的樣式，使用 `<state>:` 類別。 |

### CarouselPagination

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對分頁項目群組的稱呼（`"Choose a slide"`）。 |
| `indicatorClass` | `.indicator_class(..)` | `string` | 無 | 指示器的 Tailwind 類別。指示器是位於目前投影片之項目上的一個檢視（圓點後方的膠囊形狀、底線等）：決定它的外觀，以及它在該列橫向上的位置（`inset-y-0`、`bottom-0 h-0.5`）。沿著該列的方向，它會涵蓋該項目，並以原生方式彈到下一個項目。 |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 指示器的樣式，疊加在 `indicatorClass` 之上。兩者都未設定時，分頁指示沒有指示器。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個 `CarouselPaginationItem`，以及應用程式安排在它們之間的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 該列的版面（`flex-row gap-2`）。 |

### CarouselPaginationItem

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 必填 | 它所對應的投影片，從 0 開始。超過最後一張投影片的索引會被停用。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 其投影片顯示中時的樣式，使用 `selected:` 類別。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 它對應哪一張投影片（`"Slide 3"`），用於其子元素沒有文字可說明時（例如圓點）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的圓點、縮圖或數字。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 它的外觀；其內部的 `group-selected:` 類別會在 `group` 之下跟隨它。 |

## Events

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange`（`Carousel`） | `.on_change(\|index: &u32\| ..)` | 使用者移到了另一張投影片：滑動、滾輪或觸控板停在該張，或是控制項、分頁項目或按鍵要求前往該張。`{ index }` 即為該張投影片。應用程式傳入新的 `index` 時不會回報任何事件。 |
| `onDragStart`（`Carousel`） | `.on_drag_start(\|\| ..)` | 使用者開始拖曳內容（手指、觸控板）。 |
| `onDragEnd`（`Carousel`） | `.on_drag_end(\|\| ..)` | 使用者拖曳過的內容已靜止。 |
| `onFocus`（`Carousel`） | `.on_focus(\|\| ..)` | 鍵盤焦點進入了輪播：進入它自己的檢視、上一張或下一張控制項、分頁項目，或投影片中可取得焦點的檢視。在這些之間移動不會回報任何事件。 |
| `onBlur`（`Carousel`） | `.on_blur(\|\| ..)` | 鍵盤焦點離開了輪播：包括它自己的檢視、控制項、分頁項目與投影片的內容。 |

## Parts

| 部件 | 所在位置 | 樣式來源 | 狀態 |
|---|---|---|---|
| 輪播 | | `Carousel` 的 `class`、`style` | `focus:` |
| 內容 | 輪播 | `CarouselContent` 的 `class`、`style` | |
| 投影片 | 內容 | `CarouselItem` 的 `class`、`style` | |
| 上一張、下一張 | 輪播 | 它們的 `class`、`style` | `disabled:`、`active:`、`hover:`、`focus:` |
| 分頁指示 | 輪播 | `CarouselPagination` 的 `class`、`style` | |
| 指示器 | 分頁指示 | `indicatorClass`、`indicatorStyle` | |
| 分頁項目 | 分頁指示 | 它的 `class`、`style` | `selected:`、`disabled:`、`active:`、`hover:`、`focus:` |

## Several slides per view

投影片的寬度由它自己的類別決定，因此一排卡片就是可視區域中有多張投影片。每張投影片的起點都是一個貼齊點：內容靜止時，該投影片會停在第一張投影片停靠的位置，所以第一張之前的 padding 會在每一張之前都保留。在範圍的末端，無法到達該位置的投影片會與最後一張一起靜止，而下一張到此為止。`index` 指的是位於第一個位置的投影片；與最後一張一起靜止的投影片顯示的是同一個位置，在那裡滑動時會回報其中的第一張：

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

在手機寬度下使用 `basis-1/2`，或使用 `basis-[85%]`，可以露出下一張卡片的一角。垂直輪播（`axis="vertical"`）則依投影片的高度決定其大小。

## Looping

使用 `looping` 時，投影片會無縫地首尾相接：最後一張之後是第一張，無論是滑動、以下一張或按鍵前進，或由應用程式的 `index` 設定，都不會倒轉經過中間的投影片。內容會在投影片前後各保留整整一圈的空間，並將每張投影片繪製在最接近檢視中央的位置；動畫在平台自己的影格上搭配捲動執行這項處理。每張投影片只存在一份：螢幕閱讀器與分頁指示都只會看到一次。

只要投影片涵蓋可視區域再多一張的寬度（三張滿版寬度的投影片，或五張三分之一寬的投影片），循環就是無縫的。若投影片更少，上一張、下一張與按鍵仍然會循環，但會往回捲動經過中間的投影片。

## Slides that move on by themselves

自動輪換的橫幅由應用程式負責：以計時器設定 `index`。輪播會回報使用者正在操作，讓計時器在此時暫停，正如 [WAI-ARIA 輪播模式](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)所要求的：拖曳前後使用 `onDragStart` / `onDragEnd`，鍵盤焦點位於輪播內（在輪播本身、它的控制項、它的分頁指示或投影片的內容上）時使用 `onFocus` / `onBlur`，以及指標停留在它周圍的檢視上時也要暫停。啟用減少動態效果時請關閉自動輪換，並提供使用者一個可以停止它的按鈕（輪換控制項）：

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

在 effect 中讀取 `index()` 會讓每次變更之後（包括使用者造成的變更）都重新開始一整段間隔。使用 `looping` 時，從最後一張到第一張會向前跨過接縫。

## Accessibility

- 輪播是一個以 `accessibilityLabel` 命名的區域；每張投影片是一個以其自身標籤命名的群組（它在所有投影片中的位置，以及它所顯示的內容）。
- 上一張與下一張是按鈕，除非輪播會循環，否則在兩端會被停用；每個分頁項目是一個按鈕，其投影片顯示時為選取狀態。
- 所有標籤都由應用程式提供，並使用應用程式的語言。
- 循環輪播中的每張投影片都只存在一份，無論它被繪製在哪裡。

關於標籤、角色與播報的一般說明，請參閱 [無障礙](../docs/accessibility.md)。

## Keyboard

在 macOS 與網頁上，Tab 可以到達接受按壓的檢視，輪播本身是鍵盤焦點的停駐點，它的控制項與分頁項目也是。當其中任一個取得焦點時：

| 按鍵 | 作用 |
|---|---|
| 左、右（垂直時為上、下） | 移到上一張或下一張投影片；循環時會繞過兩端。 |
| Home、End | 移到第一張或最後一張投影片。 |
| Space、Return | 按下取得焦點的控制項或分頁項目。 |

在由右至左的版面中，水平輪播的投影片從右側開始排列，因此左鍵移到下一張，右鍵移到上一張；垂直輪播仍然使用上與下。當控制項在取得焦點時變成停用（例如在最後一張投影片時的下一張），焦點會交給輪播，讓按鍵繼續在那裡運作。投影片中應用程式自己的可聚焦檢視會保留各自的按鍵：輸入框的方向鍵用來移動插入點。

## Motion

- 滑動、滾輪與觸控板會讓投影片與指標在同一個影格中一起移動：由平台負責捲動。
- 放開後，內容會滑向最近的一張投影片，每次快速滑動只前進一張，如同平台的貼齊行為。
- 上一張、下一張、分頁項目、按鍵與應用程式的 `index` 會以動畫將內容捲動到該投影片；啟用減少動態效果時則立即切換。
- 分頁指示的指示器會彈到目前投影片的項目；啟用減少動態效果時則立即移動。
- `looping` 從最後一張到第一張會向前跨過接縫一步；內容靜止後，會在沒有動畫的情況下整整往回移動一圈，畫面上不會有任何變化。

## Platform notes

- iOS、Android 與 Mac Catalyst：以手指滑動投影片；點一下會按下控制項。
- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：以滾輪與觸控板捲動投影片，點擊會按下控制項。在內容上以滑鼠拖曳是應用程式的事，如同那些平台上的每一個捲動檢視。
- 每個平台都會繪製應用程式所設定的樣式：投影片、控制項、分頁指示及其指示器。
