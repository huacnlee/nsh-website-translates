---
title: "Tabs"
description: "Tab 與 Tabs:分別是標籤列表中的標籤,以及列表本身。每個 Tab 負責處理按下操作、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的角色和選取狀態;Tabs 則是標籤的集合,附有以原生方式跟隨已選取標籤的指示器;外觀、數值以及每個標籤所顯示的內容,均由應用程式自行決定。"
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---


# Tabs

標籤頁用來在同一處的各個部分之間切換:專案的概覽與動態,文件的各種檢視。
每個 `Tab` 負責一個標籤頁的行為:點按、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的標籤頁角色及其選取狀態。包住它們的 `Tabs` 就是標籤列表,螢幕閱讀器會將它們作為一組來朗讀。外觀由應用程式決定:標籤頁本身沒有顏色、尺寸或標籤。它的子元素就是應用程式的標籤,標籤頁上的 `selected:` 類別,或其內部元素上的 `group-selected:` 類別,會跟隨它的狀態。每個部分的內容同樣由應用程式決定:它會在列表旁邊顯示其值所指的那一個。列表的指示器(由應用程式設定樣式的底線或膠囊形)位於已選取的標籤頁上,並以原生方式移動到下一個標籤頁([指示器](#indicator))。

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

`Tab` 和 `Tabs` 來自 [`nsh/base`](../modules/nsh-base.md),即 Rust 中的 `nsh-base` crate。值由應用程式持有,列表本身不保存任何值。每個標籤頁都會被告知自己是否已選取;點按時會回報 `onPress`,應用程式設定其值並顯示該部分,而每個標籤頁都會顯示應用程式回傳的 `selected`。列表與標籤頁的圓角是同心的:列表的內距(`p-1`)是 `radius.lg` 與 `radius` 之差。已選取標籤頁的填色就是列表的指示器(`indicatorClass`,位於該內距之內:`inset-y-1`),它會以彈簧動畫移到應用程式所選取的標籤頁。在 Rust 中,由 `tab()` 和 `tabs()` 建立它們,每個屬性有一個 setter(`.selected(..)`),每個事件有一個監聽器(`.on_press(..)`),並提供具型別的樣式方法,以及用於設定其內容的 `.child(..)`。

<a id="props"></a>

## 屬性

### Tab

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | 其列表中的目前標籤頁:螢幕閱讀器會讀出它已選取,並套用 `selected:` 樣式。點按時會回報 `onPress`;標籤頁會顯示應用程式回傳的值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受點按,也沒有點按回饋;套用 `disabled:` 樣式,而螢幕閱讀器會讀出它呈暗淡狀態。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 標籤頁在已選取且未停用時的樣式,以 `selected:` 類別設定。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器所讀出的內容:當子元素沒有文字可表達名稱時(例如圖示),即為標籤頁的名稱。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的標籤、圖示或徽章,螢幕閱讀器會將其讀出。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 標籤頁本身:標籤周圍的表面。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 標籤頁在按下、懸停、取得焦點或停用時的樣式,以 `<state>:` 類別設定。 |

### Tabs

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | 無 | 已選取標籤頁上指示器的 Tailwind 類別:它的外觀,以及它在列表橫向的位置(橫排時用 `bottom-0 h-0.5` 作底線,用 `inset-y-1` 作膠囊形)。沿著列表方向,它會涵蓋已選取的標籤頁,並保留其自身在該軸向上的邊距。設定 `indicatorClass` 或 `indicatorStyle` 後,列表便有指示器。 |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 指示器的樣式,疊加於 `indicatorClass` 之上。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 列表中的標籤頁,以及應用程式在它們之間排列的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 列表的版面與外觀:預設為直排,用 `flex-row` 則為橫排。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onPress`(`Tab`) | `.on_press(\|_: &()\| ..)` | 標籤頁被點按:輕按、點擊、在它取得鍵盤焦點時按 Space 或 Return、螢幕閱讀器的啟動操作;或是其列表中的方向鍵、Home 或 End 將鍵盤焦點移到它身上。此事件在任何改變發生之前執行:標籤頁會顯示應用程式回傳的 `selected`。 |

已選取的標籤頁同樣會回報點按,讓應用程式可以處理第二次點按(例如將其部分捲動至頂部)。
已停用的標籤頁不會回報任何事件。

<a id="parts"></a>

## 部件

| 部件 | 位於 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| 列表 | | `Tabs` 的 `class`、`style` | |
| 指示器 | 列表內,位於標籤頁後面 | `indicatorClass`、`indicatorStyle` | 位於已選取的標籤頁上 |
| 標籤頁 | 列表 | `Tab` 的 `class`、`style` | `selected:`、`disabled:`、`active:`、`hover:`、`focus:`(或 `selectedStyle`、`disabledStyle` 等) |
| 標籤 | 標籤頁 | 其自身的元素(`children`) | `group-selected:`、`group-disabled:`,以及在標籤頁的 `class` 上帶有 `group` 的其他 `group-*:` 變體 |
| 該部分的內容 | 列表旁邊 | 應用程式的元素 | 應用程式的值 |

請透過標籤頁本身的表面來顯示已選取的狀態:填色、較強的標籤顏色、較粗的字重(參閱[設計指南](../docs/design-guides.md#interaction-states))。

<a id="indicator"></a>

## 指示器

已選取標籤頁下的底線、它背後的膠囊形,或分段控制項中凸起的區段,都是列表的指示器:這是一個由應用程式以 `indicatorClass` 和 `indicatorStyle` 設定樣式的視圖,繪製在標籤頁後面,並在列表中絕對定位。Native Shell 會在每次版面配置後將它放到已選取的標籤頁上。沿著列表方向(橫排的寬度、直排的高度),它會涵蓋該標籤頁,並保留指示器自身在該軸向上的邊距(用 `mx-3` 可令底線比標籤頁短);橫跨列表方向的位置則由它的類別決定:

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

當應用程式選取另一個標籤頁時,指示器會以原生方式用彈簧動畫移到該處,與 GPUI Kit 的標籤列指示器一樣;在減少動態效果的設定下,它會即時移動。沒有任何標籤頁被選取時,它會隱藏;有多個標籤頁被選取時,它會位於第一個之上。視窗大小改變或標籤頁寬度改變時,它會與標籤頁在同一影格內移動。指示器不需要版面配置事件,也不需要應用程式的任何程式碼:已選取的標籤頁就是 `selected` 為 true 的那一個。在可捲動的列表中,捲動視圖要包住 `Tabs`,指示器會隨標籤頁一同捲動。

<a id="disabled"></a>

## 停用

已停用的標籤頁不接受點按,螢幕閱讀器會將它讀作暗淡狀態。它的 `disabled:` 類別會覆蓋其 `selected:` 類別,而其內部的 `group-disabled:` 類別亦會隨之變化:

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

- 對螢幕閱讀器而言,標籤頁是單一元素,角色為 `"tab"`,並帶有其選取狀態。它的標籤是其子元素的文字,或 `accessibilityLabel`。
- `Tabs` 的角色為 `"tablist"`:螢幕閱讀器會將其中的標籤頁作為一組來朗讀,而每個標籤頁仍是獨立的元素。
- `disabled` 會依各平台的方式朗讀(VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹)。
- 在 macOS 和網頁上,列表是鍵盤焦點的單一停駐點,方向鍵可在其標籤頁之間移動(見下文)。
- 指示器對螢幕閱讀器隱藏,也不會取得焦點:列表的元素只有標籤頁。

有關標籤、角色和朗讀內容的一般說明,請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和網頁上,Tab 鍵可以到達接受點按的視圖,此時 `Tabs` 列表遵循 [WAI-ARIA 標籤頁模式](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 在已選取的標籤頁進入列表(若沒有已選取的標籤頁,則為第一個未停用的標籤頁),並一步離開列表。 |
| 向右鍵、向下鍵 | 將焦點移到下一個標籤頁,由最後一個移到第一個。 |
| 向左鍵、向上鍵 | 將焦點移到上一個標籤頁,由第一個移到最後一個。 |
| Home、End | 將焦點移到第一個或最後一個標籤頁。 |
| Space、Return | 點按取得焦點的標籤頁。 |

方向鍵會略過已停用的標籤頁,而它們移到的標籤頁會回報 `onPress`,因此應用程式可在焦點移動時選取它:該部分會跟隨焦點。無論列表的版面如何(這由應用程式的類別決定),兩對方向鍵都會移動焦點。在由右至左的版面中,橫排從右方開始,因此向左鍵與向右鍵的作用對調:向左鍵移到下一個標籤頁,向右鍵移到上一個;向上鍵、向下鍵、Home 和 End 則維持不變。`focus:` 樣式會顯示焦點所在。位於 `Tabs` 之外的 `Tab` 是獨立的停駐點。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 和 Mac Catalyst:點按是指在標籤頁上結束的輕按,包括其標籤部分。
- 桌面平台(macOS、Windows、Linux、GPUI)和網頁:點按是指點擊。在 macOS 和網頁上,Space 和 Return 也會點按取得鍵盤焦點的標籤頁,而方向鍵、Home 和 End 則會移動焦點([鍵盤](#keyboard))。
- 每個平台都會繪製應用程式設定了樣式的內容:標籤頁、已選取標籤頁的表面、指示器和各部分的內容。指示器的移動在每個平台上都是原生的版面配置動畫。
