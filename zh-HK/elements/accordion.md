---
title: "Accordion"
description: "Accordion 及其組成部分:堆疊的區段,可在各自標題下展開與收合,可一次展開一個或多個,由應用程式的值決定開啟狀態,並可依需求以彈性高度動畫呈現,所有外觀皆由應用程式自行決定。"
group: base
demo: el-accordion
---

# Accordion

Accordion 將可展開與收合的區段堆疊在其標題之下：FAQ 的問題、設定頁的群組、結帳流程的步驟。它由五個部件組成，每個部件只負責一項行為，不負責任何外觀：

- `Accordion`，堆疊本體：它持有應用程式的 `value`（開啟中項目的值），並以 `onChange` 回報下一組值。一次開啟一個項目，或以 `multiple` 同時開啟多個。
- `AccordionItem`，單一區段，由其 `value` 識別。當 accordion 的 `value` 包含它時即為開啟。
- `AccordionHeader`，項目的標題，具有螢幕閱讀器會朗讀的 `level`。
- `AccordionTrigger`，標題中用來展開與收合其項目的按鈕，並會表明是否已展開。
- `AccordionPanel`，項目的內容，開啟時顯示；搭配 `reveal` 時，其高度會以彈簧動畫展開與收合。

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

這些部件來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。值由應用程式持有：觸發器被按下時，以 `onChange` 回報下一個 `value`，accordion 則開啟應用程式傳回的值所對應的項目。每個部件都會自行找到包住它的部件，因此應用程式可以自由安排：在項目之間放分隔線、在標題中放徽章、在標題文字前放圖示。在 Rust 中，以 `accordion()`、`accordion_item()`、`accordion_header()`、`accordion_trigger()` 與 `accordion_panel()` 建立它們，每個屬性都有對應的 setter，並以 `.child(..)` 放入內部內容。

<a id="props"></a>

## 屬性

<a id="accordion-1"></a>

### Accordion

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | 開啟中項目的 `value`。由應用程式持有：觸發器被按下時以 `onChange` 回報下一組值，accordion 則顯示應用程式傳回的那些項目。 |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 同時開啟多個項目：開啟一個項目時，其他項目維持開啟。未設定時，開啟一個項目會關閉原本開啟的那一個。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 停用所有項目：沒有觸發器接受按壓，且螢幕閱讀器會說明每個項目呈暗淡狀態。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個項目，以及應用程式安排在它們之間的內容（分隔線）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 堆疊的版面配置與外觀：包住各項目的卡片、項目之間的間距。 |

### AccordionItem

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 必填 | 在 accordion 的 `value` 中識別此項目的依據：使用應用程式自己的 id，而非標題，因為標題會隨語言改變。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 其觸發器不接受按壓，且螢幕閱讀器會說明它呈暗淡狀態。它仍依 accordion 的 `value` 保持開啟或關閉。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目的標題區與面板，以及應用程式在其中安排的其他內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 區段本身：其下方的分隔線、包住它的卡片。 |

### AccordionHeader

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | 此標題在頁面所有標題中的層級，供螢幕閱讀器使用（1 為最上層）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目的觸發器，以及標題區中的其他內容（徽章、自有的動作）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 標題的版面配置。 |

### AccordionTrigger

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 其項目開啟時觸發器的樣式，以 `aria-expanded:` classes 表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器所朗讀的內容，用於子元素中沒有可說明它的文字時。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 標題文字與箭頭符號（chevron）；內部的 `group-aria-expanded:` classes 會透過觸發器 `class` 上的 `group` 跟隨觸發器。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 觸發器本身：使用者按壓的那一列。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 觸發器在被按下、滑過、取得焦點或停用時的樣式，以 `<state>:` classes 表示。 |

### AccordionPanel

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | 以展開動畫開啟與關閉，與 `Collapsible` 的相同：面板會裁切其內容，高度以臨界阻尼的彈簧從零彈至內容本身的高度，再彈回（約 265 ms，不會過衝），其後的項目隨之移動。在減少動態效果的設定下，則會立即開啟與關閉。 |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | 項目關閉時，內容仍留在樹中，但看不見，也不會取得鍵盤焦點，螢幕閱讀器也讀不到：影片會保留其播放位置，web view 會保留其頁面。未設定時，內容會在面板關閉時（展開動畫將其收合之後）離開樹，並在重新開啟時恢復原狀。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對此區域的稱呼：通常是項目的標題，與其標題區所說的相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 此區域的版面配置與外觀。使用 `reveal` 時，面板在關閉狀態下仍位於版面中、高度為零，因此其內距與邊框應放在包住內容的 view 上。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange({ value })`（`Accordion`） | `.on_change(\|value: &Vec<SharedString>\| ..)` | 觸發器被按下：點按、點擊、在其取得鍵盤焦點時按下 Space 或 Return，或螢幕閱讀器的啟動操作。`value` 是開啟中項目「將會是」的值：已開啟項目的值會從中移除，已關閉項目的值會加到最後；未設定 `multiple` 時，則會取代原有的值。它在任何變更發生之前執行：設定 `value` 以跟隨它。 |

<a id="parts"></a>

## 組成部分

| 部件 | 位於 | 樣式來源 | 狀態 |
|---|---|---|---|
| 堆疊本體 | | `Accordion` 的 `class`、`style` | |
| 項目 | 堆疊本體 | `AccordionItem` 的 `class`、`style` | 應用程式的值 |
| 標題 | 項目 | `AccordionHeader` 的 `class`、`style` | |
| 觸發器 | 標題 | `AccordionTrigger` 的 `class`、`style` | `aria-expanded:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `expandedStyle`、`disabledStyle`……） |
| 標題文字與箭頭符號 | 觸發器 | 各自的元素（`children`） | `group-aria-expanded:`、`group-disabled:`，並在觸發器的 `class` 上使用 `group` |
| 面板 | 項目，位於標題之後 | `AccordionPanel` 的 `class`、`style` | |
| 內容 | 面板 | 其自身的元素（`children`） | |

未設定 `reveal` 時，關閉的面板不在版面中，其內容也不在樹中。設定 `reveal` 後，這項變更會成為變更 `value` 的那次 commit 的版面配置動畫（如同 `LayoutAnimation.configureNext`，在原生層執行，因此動畫進行期間不會執行任何 JavaScript）：開啟中的面板從零長到其內容的高度，關閉中的面板則縮回，兩者使用相同的彈簧，其後的項目隨之移動。應用程式自己的 transition 會一併作用：箭頭符號會旋轉（`transition-transform group-aria-expanded:rotate-180`）。

<a id="disabled"></a>

## 停用

被停用項目的觸發器不接受按壓，螢幕閱讀器會將其朗讀為暗淡狀態；觸發器上的 `disabled:` classes 與其內部的 `group-disabled:` 隨之生效。accordion 的 `disabled` 會停用每一個項目。被停用的項目仍會顯示應用程式的 `value` 所指定的狀態：應用程式可以將它開啟。

<a id="accessibility"></a>

## 無障礙

- 堆疊本體是一個群組，每個標題區是其 `level` 層級的標題，每個觸發器則是其中的按鈕，並會說明其項目是否已展開。螢幕閱讀器可以在標題之間移動。
- 開啟的面板是一個區域（region），以其 `accessibilityLabel` 命名；關閉的面板對螢幕閱讀器是隱藏的，連保留在其中的內容也一樣。
- 開啟項目的外觀由應用程式決定，且不應只依賴顏色：如範例所示，讓箭頭符號旋轉。

關於標籤、角色與朗讀內容的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在可按壓的 view 屬於鍵盤焦點停駐點的平台（macOS 與 Web）上，每個觸發器都是一個停駐點，順序依頁面順序，Space 與 Return 可按下它。被停用的觸發器會被略過，已關閉面板的內容也會被略過。Tab 會從觸發器移入其開啟面板中的控制項，再移到下一個觸發器。

<a id="platform-notes"></a>

## 平台說明

- 所有平台都會在標題之下顯示開啟項目的面板，並將關閉的面板排除在版面之外（使用 `reveal` 時則為高度為零）。
- 使用 `reveal` 時，所有平台都以各自的動畫引擎讓面板高度以彈簧方式變化（iOS、Android、macOS、Windows、Linux、GPUI 與 Web），而在系統要求減少動態效果時，則立即開啟與關閉。
- 各平台的螢幕閱讀器在瀏覽標題時會朗讀標題及其層級，並將其中的觸發器朗讀為帶有展開狀態的按鈕；在 iOS 上，VoiceOver 會直接朗讀觸發器本身。
- iOS、Android 與 Mac Catalyst：觸發器的按壓是點按。桌面平台（macOS、Windows、Linux、GPUI）與 Web：點擊；在 macOS 與 Web 上，對取得焦點的觸發器按下 Space 或 Return 亦可。
