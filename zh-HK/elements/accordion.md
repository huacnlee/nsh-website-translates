---
title: "Accordion"
description: "Accordion 及其組成部分：堆疊的區段可在各自標題下方展開和收合，可一次展開一個或同時展開多個，由應用程式的值控制開啟，並可按需要以彈性高度動畫展開內容，所有外觀均由應用程式自行決定。"
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---


# Accordion

Accordion 把多個區段疊在一起，每個區段都可以在其標題下展開和收合：例如常見問題的各條提問、設定頁面的各個群組、結帳流程的各個步驟。它由五個部分組成，每個部分只負責一項行為，外觀完全不管：

- `Accordion`，即堆疊：它保存應用程式的 `value`（即已展開項目的值），並以 `onChange` 回報下一組值。一次只展開一個項目，或以 `multiple` 同時展開多個。
- `AccordionItem`，即單一區段，由其 `value` 識別。只要 Accordion 的 `value` 包含它，它就是展開的。
- `AccordionHeader`，即項目的標題，帶有屏幕閱讀器會朗讀的 `level`。
- `AccordionTrigger`，即標題中用來展開和收合項目的按鈕，並會說明項目是否已展開。
- `AccordionPanel`，即項目的內容，展開時顯示；配合 `reveal`，其高度會以彈簧動畫展開和收合。

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

這些部分來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 的 `nsh-base` crate。值由應用程式持有：按下觸發器時，會以 `onChange` 回報下一個 `value`，而 Accordion 會展開應用程式傳回的值所對應的項目。每個部分都會自行找到包住它的上一層，因此應用程式可以自由編排：在項目之間加分隔線、在標題中加徽章、在標題文字前加圖示。在 Rust 中，`accordion()`、`accordion_item()`、`accordion_header()`、`accordion_trigger()` 和 `accordion_panel()` 負責建立這些部分，每個屬性都有對應的 setter，內部內容則以 `.child(..)` 設定。

<a id="props"></a>

## 屬性

### Accordion

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | 已展開項目的 `value`。這些值由應用程式持有：按下觸發器時，會以 `onChange` 回報下一組值，而 Accordion 只顯示應用程式傳回的那些項目。 |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 允許同時展開多個項目：展開一個項目時，其他項目保持展開。未設定時，展開一個項目會收合原本展開的那個。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 停用所有項目：沒有觸發器會接受按下操作，屏幕閱讀器會將每個項目讀作已變暗。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 各個項目，以及應用程式在它們之間排版的任何內容（例如分隔線）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 堆疊的版面和外觀：例如包住各項目的卡片、項目之間的間距。 |

### AccordionItem

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 必填 | 在 Accordion 的 `value` 中識別此項目的值：應是應用程式自己的 id，而不是會隨語言改變的標題。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 其觸發器不接受按下操作，屏幕閱讀器會將它讀作已變暗。它仍依 Accordion 的 `value` 保持展開或收合。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目的標題和面板，以及應用程式在其中排版的任何其他內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 該區段：例如其下方的分隔線、包住它的卡片。 |

### AccordionHeader

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | 此標題在頁面所有標題中的層級，供屏幕閱讀器使用（1 為最高層）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目的觸發器，以及標題內的任何其他內容（例如徽章，或其自有的操作）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 標題的版面。 |

### AccordionTrigger

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 其項目展開時觸發器的樣式，以 `aria-expanded:` class 設定。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 當子元素沒有可供朗讀的文字時，屏幕閱讀器會讀出的內容。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 標題文字和箭咀圖示（chevron）；內部的 `group-aria-expanded:` class 會跟隨觸發器，方法是在其 `class` 上設定 `group`。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 觸發器本身：即用戶按下的那一行。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 觸發器在被按下、懸停、取得焦點或停用時的樣式，以 `<state>:` class 設定。 |

### AccordionPanel

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | 以展開動畫開合，與 `Collapsible` 的相同：面板會裁切其內容，高度以彈簧動畫由零展開至內容本身的高度，並可收回，採用臨界阻尼（約 265 毫秒，不會過衝），其後的項目會隨之移動。若系統設定為減少動態效果，則會即時開合。 |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | 項目收合時，內容仍保留在樹中，但看不見，也不會取得鍵盤焦點，屏幕閱讀器也讀不到：影片會保留播放位置，Web 視圖會保留其頁面。未設定時，面板收合時內容會離開樹（待展開動畫收合完畢後），再展開時會恢復原狀。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 屏幕閱讀器對此區域的稱呼：通常是項目的標題，與其標題所讀出的一致。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 此區域的版面和外觀。設定 `reveal` 後，面板在收合時仍留在版面中，高度為零，因此其內距和邊框應設在內容的視圖上。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange({ value })`（`Accordion`） | `.on_change(\|value: &Vec<SharedString>\| ..)` | 觸發器被按下：包括輕點、點擊、在其取得鍵盤焦點時按 Space 或 Return，或屏幕閱讀器的啟動操作。`value` 是假設操作生效後已展開項目的值：已展開項目的值會從中移除，已收合項目的值會加到末端；若未設定 `multiple`，則會取代原有的值。此事件在任何變更發生之前執行：請設定 `value` 以跟進。 |

<a id="parts"></a>

## 部分

| 部分 | 所在位置 | 樣式設定 | 狀態 |
|---|---|---|---|
| 堆疊 | | `Accordion` 的 `class`、`style` | |
| 項目 | 堆疊 | `AccordionItem` 的 `class`、`style` | 應用程式的值 |
| 標題 | 項目 | `AccordionHeader` 的 `class`、`style` | |
| 觸發器 | 標題 | `AccordionTrigger` 的 `class`、`style` | `aria-expanded:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `expandedStyle`、`disabledStyle`……） |
| 標題文字和箭咀圖示 | 觸發器 | 它們自己的元素（`children`） | `group-aria-expanded:`、`group-disabled:`，方法是在觸發器的 `class` 上設定 `group` |
| 面板 | 項目，位於標題之後 | `AccordionPanel` 的 `class`、`style` | |
| 內容 | 面板 | 其自己的元素（`children`） | |

未設定 `reveal` 時，收合的面板不在版面中，其內容也不在樹中。設定 `reveal` 後，這項變化是改變 `value` 的那次 commit 的版面動畫（與 `LayoutAnimation.configureNext` 一樣，由原生層執行，所以移動期間不會執行任何 JavaScript）：展開的面板由零增長至其內容的高度，收合的面板則縮回，兩者使用同一個彈簧，其後的項目會隨之移動。應用程式自己的 transition 亦會一併進行：箭咀圖示會轉動（`transition-transform group-aria-expanded:rotate-180`）。

<a id="disabled"></a>

## 停用

已停用項目的觸發器不接受按下操作，屏幕閱讀器會將它讀作已變暗；觸發器上的 `disabled:` class 和其內部的 `group-disabled:` 會隨之變化。Accordion 的 `disabled` 會停用所有項目。已停用的項目仍會按應用程式的 `value` 所指示的顯示：應用程式可以將它展開。

<a id="accessibility"></a>

## 無障礙

- 堆疊是一個群組，每個標題都是依其 `level` 而定的標題，每個觸發器則是其中的按鈕，並會說明其項目是否已展開。屏幕閱讀器可以在標題之間逐個跳轉。
- 展開的面板是一個區域，以其 `accessibilityLabel` 命名；收合的面板對屏幕閱讀器隱藏，包括保留在其中的內容。
- 展開項目的外觀由應用程式決定，而且不應只依靠顏色：請像範例一樣讓箭咀圖示轉動。

有關標籤、角色和朗讀內容的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在可讓接受按下操作的視圖成為鍵盤焦點停駐點的平台（macOS 和 Web），每個觸發器都是一個停駐點，順序依頁面而定，可按 Space 和 Return 觸發。已停用的觸發器會被跳過，收合面板的內容也一樣。Tab 會由觸發器移入其展開面板的控制項，再移到下一個觸發器。

<a id="platform-notes"></a>

## 平台備註

- 所有平台都會把展開項目的面板顯示在其標題之下，並讓收合的面板不佔用版面（以 `reveal` 設定時高度為零）。
- 設定 `reveal` 後，每個平台都會以自己的動畫器為面板高度加上彈簧動畫（iOS、Android、macOS、Windows、Linux、GPUI 和 Web），而在系統要求減少動態效果時，會即時開合。
- 各平台的屏幕閱讀器在逐個閱讀標題時，都會讀出標題及其層級，並將其中的觸發器讀作帶有展開狀態的按鈕；在 iOS 上，VoiceOver 會直接朗讀觸發器本身。
- iOS、Android 和 Mac Catalyst：觸發器的按下操作是輕點。桌面平台（macOS、Windows、Linux、GPUI）和 Web：點擊；在 macOS 和 Web 上，亦可在取得焦點的觸發器上按 Space 或 Return。
