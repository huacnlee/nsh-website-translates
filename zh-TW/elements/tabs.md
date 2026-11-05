---
title: "Tabs"
description: "Tab 與 Tabs:分別是標籤列中的各個標籤,以及標籤列本身。每個 Tab 負責處理點按、鍵盤啟用、停用狀態,以及供螢幕閱讀器使用的角色與選取狀態;Tabs 則是整組標籤,並提供以原生方式跟隨所選 Tab 移動的指示器;外觀、值,以及每個 Tab 顯示的內容則由應用程式自行決定。"
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# Tabs

Tabs 用來在同一處的各個區段之間切換，例如專案的總覽與動態，或文件的各個檢視。
每個 `Tab` 負責單一分頁的行為：按下、鍵盤啟用、停用狀態，以及供螢幕閱讀器使用的分頁角色與其選取狀態。包住這些分頁的 `Tabs` 就是分頁列表，螢幕閱讀器會將它們視為一組來朗讀。外觀由應用程式決定：分頁本身沒有顏色、尺寸或標籤。它的子元素就是應用程式的標籤，分頁上的 `selected:` class，或其內部元素上的 `group-selected:` class，會跟隨它的狀態。各區段的內容同樣由應用程式決定：它會顯示其 value 所對應的區段，位於列表旁邊。列表的指示器（由應用程式設定樣式的底線或膠囊形）位於選取的分頁上，並以原生方式移動到下一個分頁（[指示器](#indicator)）。

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` 與 `Tabs` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。value 由應用程式持有，列表本身不保存任何值。每個分頁都會被告知自己是否已選取；按下時會回報 `onPress`，應用程式設定其 value 並顯示該區段，每個分頁則顯示應用程式回傳的 `selected`。列表與分頁的圓角是同心的：列表的內距（`p-1`）等於 `radius.lg` 與 `radius` 的差值。選取分頁的填色就是列表的指示器（`indicatorClass`，位於該內距之內：`inset-y-1`），它會彈跳到應用程式所選取的分頁。在 Rust 中，`tab()` 與 `tabs()` 負責建立它們，每個屬性有一個 setter（`.selected(..)`），每個事件有一個 listener（`.on_press(..)`），並提供具型別的樣式方法，以及用於其內容的 `.child(..)`。

<a id="props"></a>

## 屬性

### Tab

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | 其列表中目前的分頁：螢幕閱讀器會說明它已選取，並套用 `selected:` 樣式。按下時會回報 `onPress`；分頁會顯示應用程式回傳的值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下，也沒有按下回饋；套用 `disabled:` 樣式，螢幕閱讀器會說明它已變暗。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 分頁在已選取且未停用時的樣式，以 `selected:` class 表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器朗讀的內容：當子元素沒有可表達名稱的文字（例如圖示）時，即為分頁的名稱。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的標籤、圖示或徽章，螢幕閱讀器會朗讀它。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 分頁本身：包住其標籤的表面。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 分頁在按下、懸停、取得焦點或停用時的樣式，以 `<state>:` class 表示。 |

<a id="tabs-1"></a>

### Tabs

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | 無 | 選取分頁上指示器的 Tailwind class：它的外觀，以及它在列表橫向上的位置（橫列中的底線用 `bottom-0 h-0.5`，膠囊用 `inset-y-1`）。沿著列表方向，它會涵蓋選取的分頁，並保留在該軸向上自身的邊距之內。設定 `indicatorClass` 或 `indicatorStyle` 後，列表便有指示器。 |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 指示器的樣式，疊加於 `indicatorClass` 之上。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 列表中的分頁，以及應用程式在它們之間安排的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 列表的版面與外觀：預設為直欄，橫列則用 `flex-row`。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onPress`（`Tab`） | `.on_press(\|_: &()\| ..)` | 分頁被按下：輕點、點擊、分頁擁有鍵盤焦點時按下 Space 或 Return、螢幕閱讀器的啟用操作；或是其列表的方向鍵、Home 或 End 將鍵盤焦點移到它身上。此事件在任何變化發生之前執行：分頁會顯示應用程式回傳的 `selected`。 |

已選取的分頁同樣會回報按下，因此應用程式可以對第二次按下做出反應（例如將其區段捲動到頂端）。
已停用的分頁不會回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| 列表 | | `Tabs` 的 `class`、`style` | |
| 指示器 | 列表內，位於分頁後方 | `indicatorClass`、`indicatorStyle` | 位於選取的分頁上 |
| 分頁 | 列表內 | `Tab` 的 `class`、`style` | `selected:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `selectedStyle`、`disabledStyle` 等） |
| 標籤 | 分頁內 | 其自有的元素（`children`） | `group-selected:`、`group-disabled:`，以及分頁的 `class` 上搭配 `group` 的其他 `group-*:` 變體 |
| 區段的內容 | 列表旁邊 | 應用程式的元素 | 應用程式的 value |

請透過分頁自身的表面來呈現選取狀態：填色、更醒目的標籤、更粗的字重（請參閱[設計指南](../docs/design-guides.md#interaction-states)）。

<a id="indicator"></a>

## 指示器

選取分頁下方的底線、其後方的膠囊，或分段控制項中凸起的區段，都是列表的指示器：它是由應用程式以 `indicatorClass` 與 `indicatorStyle` 設定樣式的視圖，繪製在分頁後方，並在列表中採絕對定位。Native Shell 會在每次版面配置後，將它放到選取的分頁上。沿著列表方向（橫列的寬度、直欄的高度），它會涵蓋該分頁，並保留在指示器自身於該軸向上的邊距之內（`mx-3` 可讓底線比其分頁更短）；在列表的橫向上，則由它的 class 決定位置：

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

當應用程式選取另一個分頁時，指示器會以原生方式彈跳過去，就像 GPUI Kit 的分頁列指示器一樣；啟用減少動態效果時，則會立即移動。沒有任何分頁被選取時，它會隱藏；有多個分頁被選取時，它位於第一個。調整大小或分頁寬度改變時，它會與分頁在同一個影格內一起移動。指示器不需要任何版面配置事件，也不需要應用程式的任何程式碼：選取的分頁就是 `selected` 為 true 的那一個。在可捲動的列表中，捲動視圖應包住 `Tabs`，指示器會隨分頁一起捲動。

<a id="disabled"></a>

## 停用狀態

已停用的分頁不接受按下，螢幕閱讀器會將它朗讀為已變暗。它的 `disabled:` class 會覆蓋其 `selected:` class，其內部的 `group-disabled:` class 也會隨之變化：

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，分頁是單一元素，具有 `"tab"` 角色及其選取狀態。它的標籤是其子元素的文字，或 `accessibilityLabel`。
- `Tabs` 具有 `"tablist"` 角色：螢幕閱讀器會將其內的分頁視為一組來朗讀，每個分頁仍各自是獨立的元素。
- `disabled` 會依各平台的方式朗讀（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 與 web 上，列表是鍵盤焦點的單一停駐點，方向鍵在其分頁之間移動（見下文）。
- 指示器會對螢幕閱讀器隱藏，也不接受焦點：列表的元素只有分頁本身。

關於標籤、角色與朗讀內容的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 與 web 上，Tab 鍵可以到達接受按下的視圖，此時 `Tabs` 列表遵循 [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 從選取的分頁進入列表（若沒有選取的分頁，則從第一個未停用的分頁進入），並一步離開列表。 |
| Right、Down | 將焦點移到下一個分頁，從最後一個回到第一個。 |
| Left、Up | 將焦點移到上一個分頁，從第一個回到最後一個。 |
| Home、End | 將焦點移到第一個或最後一個分頁。 |
| Space、Return | 按下取得焦點的分頁。 |

方向鍵會略過已停用的分頁，焦點移到的分頁會回報 `onPress`，因此應用程式會在焦點移動時選取它：區段會跟隨焦點。無論列表的版面為何（由應用程式的 class 決定），兩組方向鍵都會移動焦點。在由右至左的版面中，橫列從右側開始排列，因此 Left 與 Right 的作用互換：Left 移到下一個分頁，Right 移到上一個分頁；Up、Down、Home 與 End 則維持不變。`focus:` 樣式會顯示焦點所在。位於 `Tabs` 之外的 `Tab` 是獨立的停駐點。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 與 Mac Catalyst：按下是指在分頁上結束的輕點，包含其標籤範圍。
- 桌面平台（macOS、Windows、Linux、GPUI）與 web：按下是點擊。在 macOS 與 web 上，Space 與 Return 同樣可以按下取得鍵盤焦點的分頁，方向鍵、Home 與 End 則用來移動焦點（[鍵盤](#keyboard)）。
- 每個平台都會繪製應用程式設定樣式的內容：分頁、選取分頁的表面、指示器，以及各區段的內容。指示器的移動在每個平台上都是原生的版面配置動畫。
