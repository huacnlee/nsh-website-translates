---
title: "Carousel"
description: "Carousel 及其組成部分:幻燈片一次只顯示一張,可透過滑動、滑鼠滾輪和觸控板(沿用平台原生捲動)、上一張與下一張控制項、分頁指示器以及鍵盤來切換,並可在首尾之間無縫循環。Carousel 負責管理顯示哪一張幻燈片、貼齊對位、循環、按鍵操作和無障礙功能;外觀和所有標籤則由應用程式自行決定。"
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---


# Carousel

輪播一次在同一位置顯示一張幻燈片：產品的相片、引導流程的步驟、自動輪換的橫幅，或是一排卡片。`Carousel` 負責行為：顯示哪一張幻燈片、在幻燈片之間滑動、上一張和下一張控制項、分頁指示、方向鍵、首尾循環，以及螢幕閱讀器會讀出的內容。它的各個部分透過 context 找到它，因此應用程式可以在自己的版面中自由安排這些部分。外觀由應用程式決定：輪播本身沒有顏色、尺寸、箭頭、圓點或標籤。

內容是原生捲動視圖。手指、滑鼠滾輪和觸控板會在平台的主執行緒上移動幻燈片，與指標處於同一影格；放開後內容會貼齊最近的幻燈片，每次快速滑動只移動一張。停止後，輪播以 `onChange` 回報目前的幻燈片。控制項、分頁指示、按鍵和應用程式的 `index` 會以動畫將內容原生捲動至該幻燈片。

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

`Carousel` 及其各部分來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。顯示的幻燈片屬於應用程式的 `index`：滑動、控制項或按鍵會以 `onChange` 回報下一張，輪播則捲動到應用程式回傳的 `index`。滑動停下的幻燈片會一直顯示，直至應用程式回應其 `onChange`：若應用程式將它回傳為 `index`，就會維持；若應用程式保留原有的 `index`，內容會以動畫彈回應用程式的幻燈片。沒有 `index` 時，輪播會自行保存，初始值來自 `defaultIndex`。在 Rust 中，`carousel()`、`carousel_content()`、`carousel_item()`、`carousel_previous()`、`carousel_next()`、`carousel_pagination()` 和 `carousel_pagination_item()` 用來建立各部分，每個屬性有一個 setter（`.index(..)`），每個事件有一個監聽器（`.on_change(..)`），另有具型別的樣式方法，以及用於其內容的 `.child(..)`。

<a id="props"></a>

## 屬性

### Carousel

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 無 | 顯示的幻燈片，從 0 起，上限為現有幻燈片的數目。由應用程式持有：變更以 `onChange` 回報，新的 `index` 會以動畫捲動到該處。 |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | 最初顯示的幻燈片，在未設定 `index` 時使用。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 幻燈片相接的方向；於建立輪播時讀取。垂直輪播的方向鍵為上和下。 |
| `looping` | `.looping(..)` | `boolean` | `false` | 幻燈片會循環：最後一張之後是第一張，第一張之前是最後一張，無縫銜接，適用於滑動、上一張、下一張、按鍵和應用程式的 `index`（[循環](#looping)）。於建立輪播時讀取。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器如何稱呼這個輪播（一個 region）：幻燈片是甚麼（`"Featured products"`）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | `CarouselContent`、控制項，以及應用程式在它們周圍安排的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 輪播的版面：內容和控制項的位置。 |

### CarouselContent

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個 `CarouselItem`，每個都是內容的子項。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 視埠的大小，以及幻燈片在其中形成的軌道：幻燈片之間的 `gap`，以及讓視圖中幻燈片旁邊的幻燈片露出一角的 padding。 |

### CarouselItem

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器如何稱呼該幻燈片（一個 group）：它在其他幻燈片中的位置，以及所顯示的內容（`"2 of 5: Ocean view"`）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 幻燈片的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 沿軸向的尺寸（每個視圖一張幻燈片用 `w-full`，三張用 `basis-1/3`）及其外觀。在循環的輪播中，它的位移由輪播控制：請將 `transform` 加在其內部的視圖上。 |

<a id="carouselprevious-carouselnext"></a>

### CarouselPrevious、CarouselNext

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 控制項的名稱，在其子項沒有文字可說明時使用（例如箭頭圖示）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的圖示或標籤。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 其外觀和位置：在內容旁邊，或以 `absolute` 蓋在內容的邊緣上。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 按下、懸停、取得焦點，或在末端停用時的樣式，以 `<state>:` 類別設定。 |

### CarouselPagination

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器如何稱呼這組分頁項目（`"Choose a slide"`）。 |
| `indicatorClass` | `.indicator_class(..)` | `string` | 無 | 指示器的 Tailwind 類別。指示器是位於目前幻燈片對應項目上的視圖（圓點後面的藥丸形、底線）：其外觀，以及它在列上橫向的位置（`inset-y-0`、`bottom-0 h-0.5`）。沿列的方向，它橫跨該項目，並以原生方式彈到下一個項目。 |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 指示器的樣式，疊加在 `indicatorClass` 之上。兩者都沒有時，分頁沒有指示器。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個 `CarouselPaginationItem`，以及應用程式在它們之間安排的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 列的版面（`flex-row gap-2`）。 |

### CarouselPaginationItem

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 必填 | 它所對應的幻燈片，從 0 起。超出最後一張幻燈片的索引會被停用。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 其幻燈片顯示時的樣式，以 `selected:` 類別設定。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 它對應哪一張幻燈片（`"Slide 3"`），在其子項沒有文字可說明時使用（例如圓點）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的圓點、縮圖或數字。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 其外觀；其內部的 `group-selected:` 類別在 `group` 下跟隨它。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange`（`Carousel`） | `.on_change(\|index: &u32\| ..)` | 使用者移到另一張幻燈片：滑動、滾輪或觸控板停在該張上，或控制項、分頁項目或按鍵要求移動。`{ index }` 就是那張幻燈片。應用程式傳入新的 `index` 不會回報。 |
| `onDragStart`（`Carousel`） | `.on_drag_start(\|\| ..)` | 使用者開始拖曳內容（手指、觸控板）。 |
| `onDragEnd`（`Carousel`） | `.on_drag_end(\|\| ..)` | 使用者拖曳過的內容已停下。 |
| `onFocus`（`Carousel`） | `.on_focus(\|\| ..)` | 鍵盤焦點進入輪播：到它自己的視圖、上一張或下一張控制項、分頁項目，或幻燈片中可取得焦點的視圖。在它們之間移動不會回報。 |
| `onBlur`（`Carousel`） | `.on_blur(\|\| ..)` | 鍵盤焦點離開輪播：包括它自己的視圖、控制項、分頁項目和幻燈片的內容。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式來源 | 狀態 |
|---|---|---|---|
| 輪播 | | `Carousel` 的 `class`、`style` | `focus:` |
| 內容 | 輪播 | `CarouselContent` 的 `class`、`style` | |
| 幻燈片 | 內容 | `CarouselItem` 的 `class`、`style` | |
| 上一張、下一張 | 輪播 | 其 `class`、`style` | `disabled:`、`active:`、`hover:`、`focus:` |
| 分頁 | 輪播 | `CarouselPagination` 的 `class`、`style` | |
| 指示器 | 分頁 | `indicatorClass`、`indicatorStyle` | |
| 分頁項目 | 分頁 | 其 `class`、`style` | `selected:`、`disabled:`、`active:`、`hover:`、`focus:` |

<a id="several-slides-per-view"></a>

## 每個視圖顯示多張幻燈片

幻燈片的寬度由其自身的類別決定，因此一排卡片就是視埠中的多張幻燈片。每張幻燈片的起點都是一個貼齊點：內容停下時，該幻燈片會位於第一張幻燈片停放的位置，因此第一張之前的 padding 會保留在每一張之前。在範圍末端，無法到達該位置的幻燈片會與最後一張一起停下，下一張在此停止。`index` 指的是位於第一個位置的幻燈片；與最後一張一起停下的幻燈片顯示相同的位置，在該處滑動會回報其中的第一張：

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

`basis-1/2` 在手機寬度下，或 `basis-[85%]`，會露出下一張卡片的一角。垂直輪播（`axis="vertical"`）以幻燈片的高度決定其尺寸。

<a id="looping"></a>

## 循環

設定 `looping` 後，幻燈片會無縫循環：最後一張之後是第一張，無論是滑動、以下一張或按鍵前進，還是由應用程式的 `index` 設定，都不會倒帶經過中間的幻燈片。內容在幻燈片之前和之後各保留整整一圈幻燈片的空間，並將每張幻燈片繪製在最接近視圖中央的位置；動畫在平台自己的影格上配合捲動執行這項工作。每張幻燈片只存在一次：螢幕閱讀器和分頁只會看到一次。

只要幻燈片涵蓋視埠再多一張（三張全寬幻燈片，或五張三分之一寬的幻燈片），循環就是無縫的。數量較少時，上一張、下一張和按鍵仍會循環，但會向回捲動經過中間的幻燈片。

<a id="slides-that-move-on-by-themselves"></a>

## 自動切換的幻燈片

自動輪換的橫幅由應用程式負責：以計時器設定 `index`。輪播會回報使用者何時正在操作，計時器便應在此時暫停，這也是 [WAI-ARIA carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) 的要求：拖曳前後用 `onDragStart` / `onDragEnd`，鍵盤焦點在輪播內（在輪播本身、其控制項、分頁或幻燈片內容上）時用 `onFocus` / `onBlur`，以及指標停留在周圍的視圖上時。在減少動態效果的設定下請保持關閉，並提供按鈕讓使用者停止輪換（輪換控制）：

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

在 effect 中讀取 `index()`，會在每次變更（包括使用者的變更）後重新開始一整段間隔。設定 `looping` 後，由最後一張前往第一張會向前越過接縫。

<a id="accessibility"></a>

## 無障礙

- 輪播是一個 region，名稱由 `accessibilityLabel` 提供；每張幻燈片是一個 group，名稱由其自身提供（它在其他幻燈片中的位置及所顯示的內容）。
- 上一張和下一張是按鈕，除非輪播循環，否則在末端會停用；每個分頁項目是按鈕，其幻燈片顯示時為已選取。
- 所有標籤都由應用程式提供，並使用應用程式的語言。
- 循環輪播的每張幻燈片都只存在一次，無論它被繪製在哪裏。

有關標籤、角色和播報的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和 web 上，Tab 鍵可以到達接受按壓的視圖，輪播是鍵盤焦點的一個停駐點，其控制項和分頁項目也是。當其中之一擁有焦點時：

| 按鍵 | 作用 |
|---|---|
| 左、右（垂直時為上、下） | 移到上一張或下一張幻燈片，循環時會繞過首尾。 |
| Home、End | 移到第一張或最後一張幻燈片。 |
| Space、Return | 按下已取得焦點的控制項或分頁項目。 |

在由右至左的版面中，水平輪播的幻燈片由右方開始排列，因此左鍵移到下一張，右鍵移到上一張；垂直輪播仍然使用上、下鍵。控制項在擁有焦點時變成停用（例如最後一張幻燈片上的下一張），會將焦點交給輪播，讓按鍵繼續在那裏生效。幻燈片中應用程式自己的可取得焦點的視圖保留各自的按鍵：輸入框的方向鍵用來移動游標。

<a id="motion"></a>

## 動態

- 滑動、滾輪和觸控板會與指標在同一影格移動幻燈片：由平台負責捲動。
- 放開後，內容會滑向最近的幻燈片，每次快速滑動只移動一張，按平台的貼齊方式進行。
- 上一張、下一張、分頁項目、按鍵和應用程式的 `index` 會以動畫將內容捲動至該幻燈片；開啟減少動態效果時則即時完成。
- 分頁的指示器會彈到目前幻燈片的項目；開啟減少動態效果時即時移動。
- `looping` 由最後一張幻燈片向前一步到第一張，越過接縫；內容停下後，會不帶動畫地回移整整一圈，畫面上不會有任何改變。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst：手指滑動幻燈片；輕按可按下控制項。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：滾輪和觸控板捲動幻燈片，點擊按下控制項。在內容上以滑鼠拖曳由應用程式處理，與當地所有捲動視圖一樣。
- 每個平台都會繪製應用程式設定樣式的內容：幻燈片、控制項、分頁及其指示器。
