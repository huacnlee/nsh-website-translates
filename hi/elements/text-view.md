---
title: "TextView"
description: "TextView कॉम्पोनेंट: Markdown, HTML या ब्लॉक्स का दस्तावेज़, जिसे नेटिव टेक्स्ट और व्यूज़ के साथ दिखाया जाता है और जिसे हिस्से-दर-हिस्से स्टाइल किया जा सकता है। AI चैट उत्तरों, लेखों और सहायता पृष्ठों के लिए उपयोगी।"
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` Markdown या HTML में लिखा हुआ, या ऐप द्वारा बनाए गए ब्लॉक के रूप में दिया गया दस्तावेज़ दिखाता है: हेडिंग, पैराग्राफ़, इमफ़ेसिस, लिंक, सूचियाँ और टास्क सूचियाँ, कोट और GitHub के अलर्ट, कोड, टेबल, इमेज, फ़ॉर्मूले, फ़ुटनोट और डिस्क्लोज़र। इसे चैट में AI मॉडल के उत्तरों के लिए बनाया गया है: उत्तर Markdown के रूप में स्ट्रीम होकर आता है, और हर चंक टेक्स्ट को उसकी फ़ॉर्मैटिंग के साथ दिखाता है। पार्सिंग Rust में होती है, और दस्तावेज़ [`Text`](./text.md) एलिमेंट और व्यू से बनाया जाता है।

यह व्यवहार खुद संभालता है और पढ़ने के लिए अपनी टाइपोग्राफ़ी के साथ आता है: 15pt का टेक्स्ट 25.5pt की खुली पंक्तियों में, ऊपर जगह के साथ सेमीबोल्ड हेडिंग, थीम के `primary` रंग में रेखांकित लिंक, थीम के `font-mono` में कोड, बॉर्डर वाले गोल कोनों के बॉक्स में, हर ओर रेखाओं वाली टेबल जिसकी हेडर पंक्ति पर हल्का रंग होता है, किनारे पर रेखा वाले कोट, और GitHub के अलर्ट रंगों में आइकन वाले रंगीन बॉक्स के रूप में अलर्ट। इसके रंग थीम के टोकन हैं (`foreground`, `muted-foreground`, `border`, `muted`, `primary`, और सावधानी के लिए `destructive`), इसलिए थीम और डार्क अपीयरेंस इस तक पहुँचते हैं। हर भाग इन डिफ़ॉल्ट स्टाइल के ऊपर ऐप की स्टाइल लेता है: TSX में `classes` और `styles`, Rust में भाग के अनुसार टाइप्ड स्टाइल (`TextViewParts`)। Rust में इसे `nsh_base::text_view()` से बनाया जाता है, TSX में `nsh/base` से `<TextView>` के साथ।

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view, theme};
use nsh_core::prelude::*;

const README: &str = "# Release notes

**Faster lists** and a new `TextView`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with `TextViewParts`.";

fn release_notes() -> impl IntoElement {
    scroll().flex_1().child(
        text_view()
            .markdown(README)
            .on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| log::info!("open {url}"))
            .p_5()
            .text_base()
            .text_color(theme().foreground),
    )
}
```

```tsx tabs
import { mount, Scroll } from "nsh";
import { TextView } from "nsh/base";

const README = `# Release notes

**Faster lists** and a new \`TextView\`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with \`classes\`.`;

function App() {
  return (
    <Scroll class="flex-1" contentClass="p-5">
      <TextView
        markdown={README}
        class="text-base text-neutral-900 dark:text-neutral-100"
        classes={{
          heading1: "text-3xl",
          code: "rounded bg-neutral-100 dark:bg-neutral-800",
          link: "text-blue-600",
          alertTip: "border-l-4 border-green-600 pl-3",
        }}
        onLinkPress={({ url }) => console.log("open", url)}
      />
    </Scroll>
  );
}

mount(App);
```

Rust में `text_view()` इसे वैसे ही बनाता है जैसे `view()` व्यू बनाता है: हर प्रॉप के लिए एक सेटर (`.markdown(..)`, `.options(..)`, `.selectable(..)`), हर रेंडर फ़ंक्शन के लिए एक क्लोज़र (`.render_image(|image| ..)`), हर इवेंट के लिए एक लिसनर (`.on_link_press(..)`) और इसके रूट के लिए टाइप्ड स्टाइल मेथड (`.p_5()`, `.text_color(..)`), जिनकी टेक्स्ट स्टाइल हर भाग तक पहुँचती हैं।

<a id="built-on-text"></a>

## Text पर बना

`TextView` [`Text`](./text.md) एलिमेंट से बना है, और इसका टेक्स्ट ठीक वैसे ही काम करता है जैसा Text पेज बताता है। हर पैराग्राफ़, हेडिंग, टेबल सेल और कोड ब्लॉक एक नेटिव `Text` है: एक ब्लॉक जो लेआउट होता है, रैप होता है, फ़ॉन्ट स्केल का पालन करता है और `selectable` के साथ चुना और कॉपी किया जा सकता है। स्ट्रॉन्ग, इमफ़ेसिस, स्ट्राइक-थ्रू और अन्य इनलाइन मार्क इसके [स्पैन](./text.md#spans) हैं; इनलाइन कोड [स्पैन बैकग्राउंड](./text.md#span-backgrounds) वाला स्पैन है, इसलिए `code: "rounded bg-neutral-100"` उसे गोल बैकग्राउंड देता है; लिंक [प्रेस किए जा सकने वाले स्पैन](./text.md#links) हैं; इमेज और इनलाइन कस्टम नोड [इनलाइन अटैचमेंट](./text.md#inline-views-and-images) हैं। रूट पर दी गई टेक्स्ट स्टाइल हर भाग तक पहुँचती हैं, जैसे [टेक्स्ट स्टाइल](./text.md#text-styles) एक `Text` से उसके स्पैन तक पहुँचती हैं।

`selectable` के साथ पूरा दस्तावेज़ वेब पेज की तरह एक साथ चुना जाता है: ड्रैग (या टच स्क्रीन पर लॉन्ग प्रेस और हैंडल) एक पैराग्राफ़, सूची आइटम, सेल या कोड ब्लॉक से अगले तक जाता है, और Copy उन सबका टेक्स्ट लेता है। `selectable` `TextView` अपने आप में अलग से चुना जाता है; [selectable view](./text-selection.md) के अंदर उसका चयन आसपास के टेक्स्ट और अन्य `TextView` तक भी बढ़ता है।

`TextView` बाकी सब जोड़ता है: Markdown, HTML या दस्तावेज़ को ब्लॉक में पढ़ना, टेक्स्ट के आसपास के व्यू (सूचियाँ, कोट, टेबल, कोड ब्लॉक, डिस्क्लोज़र, फ़ुटनोट), स्ट्रीमिंग, भाग के अनुसार स्टाइल, रेंडर फ़ंक्शन और एक्सटेंशन।

<a id="the-document"></a>

## दस्तावेज़

सामग्री तीन प्रॉप में से एक से आती है, जिन्हें इसी क्रम में पढ़ा जाता है:

- **`markdown`**: GitHub के जोड़ों (टेबल, टास्क सूचियाँ, स्ट्राइकथ्रू, ऑटोलिंक, फ़ुटनोट, अलर्ट) के साथ CommonMark, फ़ॉर्मूले (`$…$` और `$$…$$`) और Markdown के अंदर HTML।
- **`html`**: HTML जैसा रीडर उसे दिखाता है। टेक्स्ट, संरचना और इनलाइन फ़ॉर्मैटिंग आती है; स्क्रिप्ट, स्टाइल, फ़ॉर्म कंट्रोल और छिपे हुए एलिमेंट बाहर रहते हैं। फ़्रैगमेंट और पूरा पेज, दोनों चलते हैं (पेज की बॉडी दिखती है)।
- **`document`**: ऐप द्वारा बनाए या रखे गए ब्लॉक: TSX में सादे ऑब्जेक्ट, Rust में `nsh_base::text_view::Document` ([दस्तावेज़ मॉडल](#the-document-model))।

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{Block, Document, Inline};
use nsh_core::prelude::*;

fn shipping() -> impl IntoElement {
    text_view().html(r#"<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>"#)
}

fn total() -> impl IntoElement {
    text_view().document(Document::new(vec![
        Block::Heading { level: 2, content: vec![Inline::text("Total")], anchor: None },
        Block::paragraph(vec![Inline::Strong { content: vec![Inline::text("$42.00")] }]),
    ]))
}
```

```tsx tabs
<TextView html={`<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>`} />

<TextView document={{
  blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "Total" }] },
    { type: "paragraph", content: [{ type: "strong", content: [{ type: "text", text: "$42.00" }] }] },
  ],
}} />
```

`TextView` अपनी सामग्री के साथ बढ़ता है। लंबे दस्तावेज़ों के लिए इसे [`Scroll`](./scroll.md) में रखें (या [`List`](./list.md) की किसी पंक्ति में)।

<a id="styling-the-parts"></a>

## भागों की स्टाइलिंग

`class` और `style` रूट को स्टाइल करते हैं, जो ब्लॉक का एक कॉलम है; वहाँ सेट की गई टेक्स्ट स्टाइल (रंग, आकार, फ़ॉन्ट) हर भाग तक पहुँचती हैं। रूट भी एक भाग है, `root`: `styles.root` टेक्स्ट स्टाइल को उनके टाइप के साथ लेता है (`style` व्यू की तरह टाइप किया गया है), और `classes.root` क्लासेज़। `classes` भाग के अनुसार Tailwind क्लासेज़ लेता है और `styles` भाग के अनुसार इनलाइन स्टाइल। किसी भाग की क्लासेज़ उसकी अपनी डिफ़ॉल्ट स्टाइल के बाद आती हैं, इसलिए वही लागू होती हैं; उसके `styles` क्लासेज़ पर भारी पड़ते हैं। Rust में भाग टाइप्ड स्टाइल लेते हैं: `TextViewParts` हर `TextViewPart` को अपनी स्टाइल निखारने वाला एक फ़ंक्शन देता है, उस व्यू के नीचे के हर `TextView` के लिए जो उसे उपलब्ध कराता है ([टाइप्ड पार्ट स्टाइल](#typed-part-styles)), और रूट स्टाइल मेथड लेता है। डिफ़ॉल्ट में लाइन की ऊँचाई पॉइंट में तय है: जो क्लास किसी भाग का आकार बदलती है, वह उसकी लाइन की ऊँचाई भी तय करती है (Tailwind की `text-*` क्लासेज़ ऐसा करती हैं)।

```rust tabs
use nsh_base::{TextViewPart, TextViewParts, text_view, theme};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading, |s| s.text_color(rgb(0x0a0a0a)))
            .part(TextViewPart::Heading2, |s| s.text_xl().mt_2())
            .part(TextViewPart::Blockquote, |s| {
                s.border_l(px(2.0)).border_color(rgb(0xd4d4d4)).pl_3().text_color(rgb(0x525252))
            })
            .part(TextViewPart::CodeBlock, |s| s.rounded_lg().bg(rgb(0xf5f5f5)))
            .part(TextViewPart::CodeBlockHeader, |s| s.px_3().pt_2())
            .part(TextViewPart::CodeBlockCode, |s| s.p_3().text_size(px(13.0)))
            .part(TextViewPart::Table, |s| s.rounded_lg().border_1().border_color(rgb(0xe5e5e5)))
            .part(TextViewPart::TableHead, |s| s.bg(rgb(0xfafafa)))
            .part(TextViewPart::TableCell, |s| {
                s.px_3().py_2().border_t_1().border_color(rgb(0xe5e5e5))
            })
            .part(TextViewPart::TaskMarkerChecked, |s| s.text_color(rgb(0x16a34a)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
    text_view()
        .markdown(move || markdown.get())
        .gap_3()
        .text_size(px(15.0))
        .line_height(px(24.0))
        .text_color(rgb(0x262626))
        .font_family("Inter")
}
```

```tsx tabs
<TextView
  markdown={reply()}
  class="gap-3 text-[15px] leading-6 text-neutral-800"
  classes={{
    heading: "text-neutral-950",
    heading2: "text-xl mt-2",
    blockquote: "border-l-2 border-neutral-300 pl-3 text-neutral-600",
    codeBlock: "rounded-lg bg-neutral-100",
    codeBlockHeader: "px-3 pt-2",
    codeBlockCode: "p-3 text-[13px]",
    table: "rounded-lg border border-neutral-200",
    tableHead: "bg-neutral-50",
    tableCell: "px-3 py-2 border-t border-neutral-200",
    taskMarkerChecked: "text-green-600",
  }}
  styles={{ root: { fontFamily: "Inter" }, link: { color: "#2563eb" } }}
/>
```

कुछ नोड कई भाग होते हैं, जो क्रम से लागू होते हैं: लेवल 2 की हेडिंग `heading` और फिर `heading2` है; अलर्ट `blockquote`, `alert`, फिर उसका प्रकार (`alertNote`, ...) है; टास्क मार्कर `listMarker`, `taskMarker` है, और पूरा होने पर `taskMarkerChecked`; हेडर पंक्ति `tableRow` फिर `tableHead` है, और उसकी सेल `tableCell` फिर `tableHeaderCell`।

| भाग | Rust | यह क्या है |
|---|---|---|
| `root` | `Root` | स्वयं टेक्स्ट व्यू, उसके ब्लॉक का एक कॉलम; यहाँ की टेक्स्ट स्टाइल हर भाग तक पहुँचती हैं। |
| `paragraph` | `Paragraph` | हर पैराग्राफ़। |
| `heading` | `Heading` | हर हेडिंग, उसके स्तर के भाग से पहले। |
| `heading1` … `heading6` | `Heading1` … `Heading6` | उस स्तर की हेडिंग (27, 20, 17, फिर 15pt, सेमीबोल्ड)। |
| `blockquote` | `Blockquote` | कोटेशन और अलर्ट: उनके ब्लॉक का एक कॉलम, किनारे पर एक रेखा के साथ। |
| `alert` | `Alert` | हर अलर्ट (`> [!NOTE]`), `blockquote` के बाद: एक रंगीन बॉक्स, जिसमें उसका आइकन और उसके ब्लॉक की एक पंक्ति होती है। |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | उस प्रकार के अलर्ट। |
| `alertIcon` | `AlertIcon` | अलर्ट का आइकन: अलर्ट के रंग में एक ग्लिफ़ वाला रिंग। |
| `list` | `List` | हर सूची: उसके आइटम का एक कॉलम। |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | क्रमांकित और बुलेट वाली सूचियाँ, `list` के बाद। |
| `listItem` | `ListItem` | हर आइटम: उसके मार्कर और उसके ब्लॉक की एक पंक्ति। |
| `listMarker` | `ListMarker` | आइटम का मार्कर (गहराई के अनुसार `•`, `◦`, `▪`, या `1.`), आइटम से पहले के इंडेंट में दाईं ओर संरेखित। |
| `taskMarker` | `TaskMarker` | टास्क आइटम का मार्कर: व्यू के रूप में बना एक बॉक्स, पूरा होने पर `✓` से भरा हुआ; `listMarker` के बाद। |
| `taskMarkerChecked` | `TaskMarkerChecked` | पूरे हो चुके टास्क आइटम का मार्कर, `taskMarker` के बाद। |
| `listItemContent` | `ListItemContent` | आइटम के ब्लॉक का कॉलम। |
| `codeBlock` | `CodeBlock` | कोड ब्लॉक: कोड का एक बॉर्डर वाला, गोल बॉक्स, जिसके ऊपर हेडर होता है। |
| `codeBlockHeader` | `CodeBlockHeader` | कोड ब्लॉक की क्रियाओं (`codeBlockActions`) की पंक्ति, जो उसके ऊपरी दाएँ कोने पर तैरती है। |
| `codeBlockScroll` | `CodeBlockScroll` | कोड ब्लॉक के कोड के चारों ओर का क्षैतिज स्क्रॉल व्यू। |
| `codeBlockCode` | `CodeBlockCode` | कोड ब्लॉक का कोड (मोनोस्पेस, जैसा लिखा गया हो)। |
| `code` | `Code` | टेक्स्ट में कोड (मोनोस्पेस, गोल बैकग्राउंड पर)। |
| `keyboard` | `Keyboard` | कीज़ (`<kbd>`, कोड की तरह)। |
| `strong` | `Strong` | स्ट्रॉन्ग टेक्स्ट (सेमीबोल्ड)। |
| `emphasis` | `Emphasis` | इमफ़ेसाइज़ किया हुआ टेक्स्ट (इटैलिक)। |
| `strikethrough` | `Strikethrough` | स्ट्राइक-थ्रू टेक्स्ट। |
| `underline` | `Underline` | रेखांकित टेक्स्ट (`<u>`, `<ins>`)। |
| `highlight` | `Highlight` | हाइलाइट किया हुआ टेक्स्ट (`<mark>`, गोल पीले बैकग्राउंड पर)। |
| `superscript`, `subscript` | `Superscript`, `Subscript` | सुपरस्क्रिप्ट और सबस्क्रिप्ट (छोटे)। |
| `link` | `Link` | लिंक (थीम के `primary` रंग में, रेखांकित)। |
| `image` | `Image` | इमेज। |
| `math` | `Math` | टेक्स्ट में फ़ॉर्मूले, जो `renderMath` न होने पर टाइपसेट होते हैं। |
| `mathBlock` | `MathBlock` | फ़ॉर्मूला ब्लॉक, जो `renderMath` न होने पर टाइपसेट और केंद्रित होते हैं। |
| `table` | `Table` | टेबल: `renderTableActions` की सामग्री, फिर सेल का स्क्रॉल व्यू। |
| `tableScroll` | `TableScroll` | टेबल की सेल का क्षैतिज स्क्रॉल व्यू: जगह होने पर कॉलम अपनी सामग्री के अनुसार फैलते हैं, व्यू संकरा होने पर एक न्यूनतम सीमा तक रैप होते हैं, और उसके बाद टेबल स्क्रॉल होती है। |
| `tableRow` | `TableRow` | टेबल की हर पंक्ति: उसकी सेल के पीछे एक व्यू, बैकग्राउंड और बॉर्डर के लिए (टेक्स्ट स्टाइल `tableCell` पर जाती हैं)। |
| `tableHead` | `TableHead` | हेडर पंक्ति, `tableRow` के बाद। |
| `tableCell` | `TableCell` | हर सेल। |
| `tableHeaderCell` | `TableHeaderCell` | हेडर पंक्ति की सेल (छोटी, धीमे रंग की), `tableCell` के बाद। |
| `rule` | `Rule` | थीमैटिक ब्रेक: ऊपरी बॉर्डर के रूप में बनी एक रेखा। |
| `details` | `Details` | डिस्क्लोज़र (`<details>`)। |
| `summary` | `Summary` | डिस्क्लोज़र का सारांश; प्रेस करने पर वह खुलता और बंद होता है। |
| `summaryMarker` | `SummaryMarker` | सारांश का मार्कर (`▸`, `▾`)। |
| `footnotes` | `Footnotes` | ब्लॉक के बाद के फ़ुटनोट: एक कॉलम। |
| `footnote` | `Footnote` | एक फ़ुटनोट: उसके नंबर और उसके ब्लॉक की एक पंक्ति। |
| `footnoteLabel` | `FootnoteLabel` | फ़ुटनोट का नंबर। |
| `footnoteReference` | `FootnoteReference` | टेक्स्ट में फ़ुटनोट का संदर्भ (उसका नंबर, छोटा)। |
| `custom` | `Custom` | अपनी सामग्री के रूप में दिखाए गए कस्टम नोड (जब कोई रेंडर फ़ंक्शन उन्हें न दिखाए)। |

<a id="streaming-ai-replies"></a>

## AI उत्तरों की स्ट्रीमिंग

उत्तर को जैसे-जैसे वह बढ़ता है, `options={{ streaming: true }}` (Rust में `MarkdownOptions { streaming: true, .. }`) के साथ पास करें। अभी आ रहे टेक्स्ट के अंत में अक्सर सिंटैक्स खुला रह जाता है (`**bold`, `` `code ``, `[a link](htt`, a table whose header just arrived); स्ट्रीमिंग उसे वैसा दिखाती है जैसा वह बंद होने पर दिखेगा, इसलिए पाठक को कभी बेमतलब के `**` या `[` नहीं दिखते। ब्लॉक स्थिति के अनुसार रखे जाते हैं: जो ब्लॉक पूरे हो चुके हैं वे अपने व्यू रखते हैं, और केवल लिखा जा रहा ब्लॉक दोबारा बनाया जाता है, इसलिए लंबे उत्तर को अपडेट करना सस्ता रहता है।

`streamingCaret` दस्तावेज़ के अंत का अनुसरण करता है: इनलाइन, अंतिम टेक्स्ट के अंत में, जहाँ भी अंतिम ब्लॉक समाप्त हो (पैराग्राफ़, सूची आइटम, कोड ब्लॉक, टेबल की अंतिम सेल), अन्यथा अंतिम ब्लॉक (रेखा, रेंडर फ़ंक्शन की सामग्री) के बाद अपनी अलग पंक्ति में। उत्तर पूरा होने पर इसे हटा दें।

```rust tabs
use nsh_base::{MarkdownOptions, text_view};
use nsh_core::prelude::*;

/// A reply the app appends to as chunks arrive, with `done` set at the end.
fn reply(text: Signal<SharedString>, done: Signal<bool>) -> impl IntoElement {
    text_view()
        .markdown(move || text.get())
        .options(move || MarkdownOptions { streaming: !done.get(), ..Default::default() })
        .streaming_caret(when(
            move || !done.get(),
            || view().ml_0p5().h_4().w_2().rounded_sm().bg(rgb(0xa3a3a3)),
        ))
}
```

```tsx tabs
import { signal, View } from "nsh";
import { TextView } from "nsh/base";

function Reply(props: { stream: AsyncIterable<string> }) {
  const text = signal("");
  const done = signal(false);
  (async () => {
    for await (const chunk of props.stream) text.update((t) => t + chunk);
    done.set(true);
  })();
  return (
    <TextView
      markdown={text()}
      options={{ streaming: !done() }}
      streamingCaret={done() ? undefined : <View class="ml-0.5 h-4 w-2 rounded-sm bg-neutral-400" />}
    />
  );
}
```

कैरेट ऐप का अपना व्यू है, इसलिए वह [`nsh` के एनिमेशन API](../modules/nsh.md#animation) से ब्लिंक या पल्स कर सकता है, और नए ब्लॉक ऐप के एनिमेशन से फ़ेड-इन हो सकते हैं।

<a id="links"></a>

## लिंक

लिंक [प्रेस किए जा सकने वाले स्पैन](./text.md#links) हैं। उन पर प्रेस करने से `onLinkPress` को `{ url }` के साथ कॉल किया जाता है; क्या खोलना है, यह ऐप तय करता है (अपना कोई पेज, एक [`WebView`](./web-view.md), किसी हेडिंग तक स्क्रॉल)। हेडिंग में एंकर होते हैं (GitHub वाले: `## Getting started` का एंकर `#getting-started` है), इसलिए `#getting-started` का लिंक उसी स्ट्रिंग के रूप में आता है, और फ़ुटनोट का संदर्भ `#footnote-<label>` के रूप में आता है।

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view};
use nsh_core::prelude::*;

fn doc(markdown: &'static str) -> impl IntoElement {
    text_view().markdown(markdown).on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| {
        match url.strip_prefix('#') {
            Some(anchor) => scroll_to_anchor(anchor),
            None => open_web(url),
        }
    })
}
```

```tsx tabs
<TextView
  markdown={doc}
  onLinkPress={({ url }) => {
    if (url.startsWith("#")) scrollToAnchor(url.slice(1));
    else nav.push({ name: "web", url });
  }}
/>
```

`scroll_to_anchor` और `open_web` (TSX में `scrollToAnchor` और `nav`) ऐप के अपने फ़ंक्शन के प्रतीक हैं।

`links="open"` के साथ, किसी दूसरी साइट या ऐप के लिंक (स्कीम वाला URL: `https:`, `mailto:`, ...) पर प्रेस करने से वह ऐप के बाहर भी खुलता है, [`openUrl`](../modules/nsh.md#openurl) से, ऐप की `openUrl` क्षमता के तहत, `onLinkPress` के उसे रिपोर्ट करने के बाद; दस्तावेज़ के अंदर के एंकर (`#…`) केवल रिपोर्ट किए जाते हैं। डिफ़ॉल्ट, `"report"`, कुछ नहीं खोलता।

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## रेंडर फ़ंक्शन

रेंडर फ़ंक्शन ऐप की अपनी सामग्री को दस्तावेज़ में रखते हैं। हर एक किसी भाग की वैल्यू लेता है और उसकी सामग्री लौटाता है (TSX में JSX, Rust में एक एलिमेंट); जब तक भाग की वैल्यू वही रहती है, भाग उसके लिए रेंडर की गई सामग्री को रखता है, इसलिए स्ट्रीमिंग के दौरान केवल लिखा जा रहा भाग दोबारा रेंडर होता है।

| प्रॉप | Rust | वैल्यू | क्या बदलता या जोड़ता है |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | कोड ब्लॉक को बदलता है (आपकी अपनी सिंटैक्स हाइलाइटिंग)। |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | ऐप की किसी कोड ब्लॉक क्रिया (`codeBlockActions`) का आइकन; उसके चारों ओर का बटन `TextView` का है। |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | टेबल के ऊपर सामग्री जोड़ता है (कॉपी, एक्सपोर्ट)। |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | फ़ॉर्मूले को बदलता है: `{ tex, display }`, `$$…$$` ब्लॉक के लिए `display`। |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | इमेज (`{ src, alt, title }`) को बदलता है: आपकी अपनी लोडिंग, साइज़िंग, प्रेस पर व्यूअर। |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | कस्टम नोड को उसके `name` से दिखाता है ([Markdown एक्सटेंशन](#markdown-extensions))। |

कोड ब्लॉक के ऊपरी दाएँ कोने पर क्रियाएँ होती हैं, सभी एक जैसी बनी हुई: घोस्ट बटन, जिनका बैकग्राउंड होवर या प्रेस के दौरान दिखता है, और जो डेस्कटॉप पर तब दिखते हैं जब पॉइंटर ब्लॉक के ऊपर हो, और टच स्क्रीन पर हमेशा। `copy` बिल्ट-इन है: वह कोड कॉपी करता है और कुछ पल के लिए चेक दिखाता है। बाकी क्रियाएँ ऐप की हैं: `renderCodeBlockAction` उनका आइकन बनाता है और `onCodeBlockAction` उनके प्रेस रिपोर्ट करता है (बिल्ट-इन `copy` भी, कॉपी करने के बाद)। `copy` क्लिपबोर्ड को वैसे ही लिखता है जैसे `Clipboard`, इसलिए उसे ऐप की `clipboard` क्षमता (`nsh.json`) चाहिए।

```rust tabs
use nsh_base::{TextViewCodeAction, TextViewCodeActionEvent, text_view};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .code_block_actions(vec![
            TextViewCodeAction::new("copy").with_label("Copy code"),
            TextViewCodeAction::new("run").with_label("Run"),
        ])
        .render_code_block_action(|_action: &TextViewCodeAction| text("▶").text_xs())
        .on_code_block_action(|event: &TextViewCodeActionEvent| {
            if event.id == "run" {
                run(&event.code.code);
            }
        })
}
```

```tsx tabs
import { Text } from "nsh";
import { TextView } from "nsh/base";

<TextView
  markdown={reply()}
  codeBlockActions={[
    { id: "copy", label: "Copy code" },
    { id: "run", label: "Run" },
  ]}
  renderCodeBlockAction={(action) => <Text class="text-xs">▶</Text>}
  onCodeBlockAction={({ id, code }) => id === "run" && run(code.code)}
/>
```

कोड ब्लॉक पहले से हाइलाइट होते हैं: फ़ेंस पर बताई गई भाषा (`ts`, `tsx`, `rust`, `python`, `bash`, `json`, `toml`, `yaml`, `diff` और लगभग दो सौ और) के लिए कोड Allsum के कोड पैलेट में दिखता है, अपीयरेंस के अनुसार लाइट या डार्क; बिना भाषा वाला ब्लॉक सादा दिखता है। जिस ऐप की अपनी हाइलाइटिंग है, वह अपना कोड `renderCodeBlock` से दिखाता है, अपने कॉम्पोनेंट से या अपने Rust क्रेट के किसी कॉम्पोनेंट से; Rust व्यू `TextView` को उसका हाइलाइटर [`CodeHighlighter`](#syntax-highlighting) से देता है। यहाँ ऐप की अपनी हाइलाइटिंग वाला कोड है, और एक इमेज जो पूरी चौड़ाई भरती है:

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{CodeBlock, Image};
use nsh_base::TextViewMath;
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .render_code_block(|code: &CodeBlock| highlighted(code.language.clone(), code.code.clone()))
        .render_image(|img: &Image| {
            image(img.src.clone())
                .label(img.alt.clone())
                .aspect_ratio(16.0 / 9.0)
                .w_full()
                .rounded_lg()
        })
        .render_math(|math: &TextViewMath| math_view(math.tex.to_string(), math.display))
}
```

```tsx tabs
import { Image, View } from "nsh";

<TextView
  markdown={reply()}
  renderCodeBlock={(code) => <Highlighted language={code.language} code={code.code} />}
  renderImage={(image) => (
    <Image src={image.src} accessibilityLabel={image.alt} class="aspect-video w-full rounded-lg" />
  )}
  renderMath={(math) => <MathView tex={math.tex} display={math.display} />}
/>
```

`Highlighted` और `MathView` (Rust में `highlighted` और `math_view`) ऐप के अपने कॉम्पोनेंट के प्रतीक हैं (हाइलाइटर, फ़ॉर्मूला रेंडरर, या उसके Rust क्रेट का कोई कॉम्पोनेंट)। `renderMath` के बिना `TextView` फ़ॉर्मूले को खुद टाइपसेट करता है (`math` और `mathBlock` भाग), KaTeX के TeX सपोर्ट और फ़ॉन्ट के साथ, टेक्स्ट के रंग में, हर प्लेटफ़ॉर्म पर एक जैसा; जो TeX वह पढ़ नहीं पाता, वह मोनोस्पेस में अपने सोर्स के रूप में दिखता है।
<a id="markdown-extensions"></a>

## Markdown एक्सटेंशन

`extensions` ऐप की अपनी सिंटैक्स को कस्टम नोड में बदलता है, जिन्हें `renderCustom` दिखाता है। हर एक्सटेंशन में एक `name`
(उसके बनाए नोड का `name`) और चार प्रकार की सिंटैक्स में से एक होती है:

| प्रकार | Rust | मिलान | नोड |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | टेक्स्ट में एक रेगुलर एक्सप्रेशन (Rust की `regex` सिंटैक्स), कोड और लिंक के बाहर | इनलाइन; `text` मिलान है, `attributes` उसके समूह: `"1"`, `"2"`, … और नामित समूह अपने नाम से |
| `language` | `MarkdownExtension::language(name, language)` | उस भाषा के fenced कोड ब्लॉक (```` ```chart ````) | A block; `text` is the code, `attributes.meta` info string का शेष भाग |
| `tag` | `MarkdownExtension::tag(name, tag)` | उस टैग के HTML या MDX एलिमेंट, किसी भी केस में (`<Callout kind="tip">`) | उसके एट्रिब्यूट, उसकी पार्स की गई सामग्री: `children` (ब्लॉक) अपनी अलग पंक्तियों वाले एलिमेंट के लिए, `content` (इनलाइन) टेक्स्ट के भीतर |
| `container` | `MarkdownExtension::container(name, container)` | कंटेनर `:::name` … `:::` | भीतर के Markdown का एक ब्लॉक (`children`); `:::note[Heads up]` से `attributes.label` मिलता है, `{key=value}` बाकी एट्रिब्यूट देता है |

````rust tabs
use nsh_base::text_view::{CustomNode, Document};
use nsh_base::{MarkdownExtension, text_view};
use nsh_core::prelude::*;

const MESSAGE: &str = r#"Thanks @ada! Here are the numbers:

```chart
12, 19, 7, 25
```

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::"#;

fn custom(node: &CustomNode) -> AnyElement {
    match node.name.as_str() {
        "mention" => text(node.text.clone())
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x2563eb))
            .into_element(),
        "chart" => bar_chart(node.text.split(',').filter_map(|v| v.trim().parse().ok()).collect())
            .into_element(),
        "callout" => view()
            .rounded_lg()
            .bg(rgb(0xfffbeb))
            .p_3()
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
        _ => view()
            .gap_1()
            .border_l(px(4.0))
            .border_color(rgb(0x3b82f6))
            .pl_3()
            .child(
                text(node.attributes.get("label").cloned().unwrap_or_else(|| "Note".into()))
                    .font_weight(FontWeight::SEMIBOLD),
            )
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
    }
}

fn message() -> impl IntoElement {
    text_view()
        .markdown(MESSAGE)
        .extensions(vec![
            MarkdownExtension::pattern("mention", r"@(\w+)"),
            MarkdownExtension::language("chart", "chart"),
            MarkdownExtension::tag("callout", "callout"),
            MarkdownExtension::container("note", "note"),
        ])
        .render_custom(custom)
}
````

````tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";
import type { MarkdownExtension, TextViewCustomNode } from "nsh/base";

const extensions: MarkdownExtension[] = [
  { name: "mention", pattern: "@(\\w+)" },
  { name: "chart", language: "chart" },
  { name: "callout", tag: "callout" },
  { name: "note", container: "note" },
];

const message = `Thanks @ada! Here are the numbers:

\`\`\`chart
12, 19, 7, 25
\`\`\`

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::`;

function Custom(props: { node: TextViewCustomNode }) {
  const node = props.node;
  switch (node.name) {
    case "mention":
      return <Text class="font-semibold text-blue-600">{node.text}</Text>;
    case "chart":
      return <BarChart values={node.text!.split(",").map(Number)} />;
    case "callout":
      return (
        <View class="rounded-lg bg-amber-50 p-3">
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
    default:
      return (
        <View class="gap-1 border-l-4 border-blue-500 pl-3">
          <Text class="font-semibold">{node.attributes?.label ?? "Note"}</Text>
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
  }
}

<TextView markdown={message} extensions={extensions} renderCustom={(node) => <Custom node={node} />} />;
````

`BarChart` (Rust में `bar_chart`) ऐप के अपने चार्ट को दर्शाता है। मेंशन पैटर्न का समूह
`node.attributes?.["1"]` में है (Rust में `node.attributes["1"]`: `ada`) और पूरा मिलान `node.text` (`@ada`) में है। जिस कस्टम नोड का कोई रेंडर फ़ंक्शन नहीं होता, वह अपनी सामग्री दिखाता है।
इनलाइन नोड (चिप) के लिए लौटाया गया व्यू अपनी `verticalAlign` के अनुसार अपनी पंक्ति में बैठता है: `align-middle`
(`verticalAlign: "middle"`) उसे टेक्स्ट के केंद्र में रखता है, और उसकी पंक्ति पैराग्राफ़ की `lineHeight` बनाए रखती है, जब तक कि व्यू उससे ऊँचा न हो।

<a id="options"></a>

### विकल्प

`options` चुनता है कि CommonMark और GitHub की सिंटैक्स के अलावा कौन-सी Markdown सिंटैक्स पढ़ी जाए; Rust में यह उन्हीं
फ़ील्ड वाला एक `MarkdownOptions` है (`MarkdownOptions { streaming: true, ..Default::default() }`):

| कुंजी | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `math` | `boolean` | `true` | सूत्र: टेक्स्ट में `$…$`, ब्लॉक में `$$…$$`। |
| `html` | `boolean` | `true` | Markdown के भीतर का HTML वैसे ही पढ़ा जाता है जैसे `html` प्रॉप उसे पढ़ता है; `false` उसे टेक्स्ट के रूप में दिखाता है। |
| `alerts` | `boolean` | `true` | GitHub के अलर्ट: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`। |
| `frontmatter` | `boolean` | `false` | YAML front matter (सबसे पहले `---` … `---`) एक कस्टम नोड `frontmatter` बन जाता है, जिसका `text` वह YAML है। |
| `mdx` | `boolean` | `false` | MDX: JSX एलिमेंट अपने टैग के नाम वाले कस्टम नोड बनते हैं, `{expressions}` कस्टम नोड `expression`; इसके बाद raw HTML टेक्स्ट के रूप में पढ़ा जाता है। |
| `streaming` | `boolean` | `false` | टेक्स्ट अभी आ रहा है: जो सिंटैक्स उसके अंत में खुली रह जाती है, वह ऐसे दिखती है जैसे बंद हो। |

<a id="the-document-model"></a>

## दस्तावेज़ मॉडल

`document` प्रॉप और रेंडर फ़ंक्शनों के मान सामान्य ऑब्जेक्ट हैं, जिनमें हर नोड अपने `type` से टैग किया गया है। टाइप
`nsh/base` से आते हैं: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` और `TextViewCustomNode`। Rust में ये
`nsh_base::text_view` के टाइप हैं (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block` और `Inline` ऐसे enum हैं जिनके variant नीचे दिए गए टाइप हैं, PascalCase में
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), और उनके फ़ील्ड वही हैं, snake case में।

| ब्लॉक `type` | फ़ील्ड |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (हर कॉलम के लिए `"none"`, `"left"`, `"center"`, `"right"`), `head` (सेल), `rows?` (सेल की पंक्तियाँ); एक सेल `{ content }` है |
| `rule` | |
| `details` | `open?`, `summary` (इनलाइन), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| इनलाइन `type` | फ़ील्ड |
|---|---|
| `text` | `text` |
| `strong`, `emphasis`, `strikethrough`, `underline`, `highlight`, `superscript`, `subscript` | `content` |
| `code` | `code` |
| `keyboard` | `text` |
| `link` | `url`, `title?`, `content` |
| `image` | `src`, `alt?`, `title?` |
| `math` | `tex` |
| `break` | |
| `footnoteReference` | `label`, `index` |
| `custom` | ब्लॉक के समान |

एक दस्तावेज़ में `footnotes?` भी होता है: `{ label, index, children }`, जो ब्लॉक के बाद उनके पहले संदर्भ के क्रम में दिखाया जाता है। एक ऐप उत्तरों को दस्तावेज़ के रूप में संग्रहीत कर सकता है, उन्हें अपने डेटा से बना सकता है, या ऐसे कस्टम नोड मिला सकता है जिन्हें
`renderCustom` दिखाता है।

<a id="parsing-and-plain-text"></a>

### पार्सिंग और सादा टेक्स्ट

`TextView` दस्तावेज़ों को बिना दिखाए, सिंक्रोनस रूप से भी पढ़ता है:

| फ़ंक्शन | Rust | लौटाता है |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | वह `TextViewDocument` जो `markdown` प्रॉप दिखाता। |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | वह `TextViewDocument` जो `html` प्रॉप दिखाता। |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | मार्कअप के बिना दस्तावेज़ का टेक्स्ट: ब्लॉक खाली पंक्तियों से अलग, सूची आइटम और टेबल की पंक्तियाँ लाइन ब्रेक से अलग, सेल टैब से अलग। |

पूरे उत्तर के लिए एक कॉपी बटन:

```rust tabs
use nsh_base::{TextView, button};
use nsh_core::prelude::*;

fn copy_reply(reply: Signal<SharedString>) -> impl IntoElement {
    button()
        .on_press(move || {
            let document = TextView::parse(reply.get().to_string(), None, None);
            set_clipboard(TextView::plain_text(document));
        })
        .child(text("Copy"))
}
```

```tsx tabs
<Button onPress={() => Clipboard.writeText(TextView.plainText(TextView.parse(reply())))}>
  <Text>Copy</Text>
</Button>
```

एक ऐप एक बार पार्स करके दस्तावेज़ को रख भी सकता है (`document={doc}`), या उसे दिखाने से पहले बदल सकता है।

<a id="in-rust"></a>

## Rust में

Rust व्यू `nsh-base` क्रेट के उसी कंपोनेंट का उपयोग करते हैं, ऊपर के उदाहरण उनके Rust टैब में हैं। तीन चीज़ें Rust की अपनी हैं:
ऐप का हाइलाइटर, भाग के अनुसार टाइप्ड स्टाइल, और Markdown प्लगइन; इनमें से हर एक को व्यू के नीचे के हर `TextView` को
`provide_context` से दिया जाता है। दस्तावेज़ के टाइप `nsh_base::text_view` के अंतर्गत हैं, जहाँ `Parser` प्लगइन के साथ
दस्तावेज़ भी पढ़ता है (`Parser::new().plugin(..).markdown(source)`)।

<a id="syntax-highlighting"></a>

### सिंटैक्स हाइलाइटिंग

`TextView` कोड को syntect से Allsum के कोड पैलेट में हाइलाइट करता है (`nsh-base` का फ़ीचर `highlight`, डिफ़ॉल्ट रूप से चालू);
बड़ा ब्लॉक पहले सादा दिखता है और बैकग्राउंड थ्रेड द्वारा हाइलाइट किए जाने पर अपने रंग लेता है।
`CodeHighlighter` उसकी जगह ऐप का अपना हाइलाइटर है, जो व्यू के नीचे के हर `TextView` को `provide_context` से दिया जाता है।
उसे हर कोड ब्लॉक मिलता है और वह अपने कोड की बाइट रेंज के स्टाइल लौटाता है (क्रम में, ओवरलैप किए बिना; जो वह छोड़ देता है
वह सादा रहता है); `TextView` कोड को उन स्टाइल वाले स्पैन के रूप में दिखाता है, अपने सामान्य कोड ब्लॉक (हेडर, एक्शन,
स्क्रॉल व्यू, भाग) के भीतर। हाइलाइटर कुछ भी हो सकता है जो कोड को स्टाइल की गई रेंज में बदले: `tree-sitter`, ऐप की अपनी थीम वाला
syntect, ...

```rust
use std::ops::Range;

use nsh_base::{CodeHighlighter, text_view::CodeBlock};
use nsh_core::{element::StyleRefinement, prelude::*};

/// The app's highlighter (here with syntect, set up once by the app).
fn highlight(code: &CodeBlock) -> Vec<(Range<usize>, StyleRefinement)> {
    my_syntect::ranges(code.language.as_deref(), &code.code)
        .map(|(range, color, bold)| {
            let style = StyleRefinement::default().text_color(color);
            (range, if bold { style.font_weight(FontWeight::BOLD) } else { style })
        })
        .collect()
}

fn chat() -> impl IntoElement {
    provide_context(CodeHighlighter::new(highlight));
    view().child(messages())
}
```

`my_syntect::ranges` ऐप के हाइलाइटर से जोड़ने वाले कोड को दर्शाता है और `messages` चैट के ऐप के व्यू को।
`renderCodeBlock`, यदि दिया गया हो, तो इस सबकी जगह कोड ब्लॉक को दिखाता है।

<a id="typed-part-styles"></a>

### टाइप्ड पार्ट स्टाइल

`TextViewParts` Rust व्यू के लिए भागों को क्लास स्ट्रिंग की जगह टाइप्ड स्टाइल से स्टाइल करता है: हर `TextViewPart` ([ऊपर की तालिका](#styling-the-parts) के
हर भाग के लिए एक) को एक फ़ंक्शन मिलता है जो उसकी `StyleRefinement` को परिष्कृत करता है। `provide_context` से दिए जाने पर, वे नीचे के हर
`TextView` पर लागू होते हैं, उसके `classes` और `styles` से पहले; उनमें पढ़े गए थीम रंग
लाइट और डार्क अपीयरेंस के अनुसार बदलते हैं।

```rust
use nsh_base::{TextViewPart, TextViewParts, theme};
use nsh_core::prelude::*;

fn chat_parts() {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading1, |s| s.text_2xl().font_weight(FontWeight::BOLD))
            .part(TextViewPart::Code, |s| s.bg(theme().muted).rounded(px(4.0)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
}
```

<a id="markdown-plugins"></a>

### Markdown प्लगइन

एक `MarkdownPlugin` Rust में Markdown सिंटैक्स पढ़ता है: पार्सर के पढ़ने से पहले उसे सिंटैक्स ट्री का हर नोड मिलता है (markdown-rs का `mdast`), और वह अपनी ब्लॉक या इनलाइन सामग्री लौटाता है, आमतौर पर एक `CustomNode`; वह अपने बनाए
कस्टम नोड भी दिखा सकता है। एक व्यू अपने नीचे के हर `TextView` को प्लगइन देता है:

```rust
use nsh_base::text_view::{mdast, CustomNode, Inline, MarkdownPlugin, MarkdownPlugins, ParseContext};
use nsh_core::prelude::*;

struct Tickers;

impl MarkdownPlugin for Tickers {
    fn name(&self) -> &str {
        "tickers"
    }

    /// `$AAPL` in inline code becomes a ticker node.
    fn inline(&self, node: &mdast::Node, _cx: &mut ParseContext<'_>) -> Option<Inline> {
        let mdast::Node::InlineCode(code) = node else { return None };
        let symbol = code.value.strip_prefix('$')?;
        Some(Inline::Custom(CustomNode::new("ticker").with_text(symbol)))
    }

    fn render(&self, node: &CustomNode) -> Option<AnyElement> {
        (node.name == "ticker").then(|| text(node.text.clone()).font_weight(FontWeight::BOLD).into_element())
    }
}

fn chat() -> impl IntoElement {
    provide_context(MarkdownPlugins::new().with(Tickers));
    view().child(messages())
}
```

प्लगइन का `render` पहले आता है, फिर `renderCustom`, फिर नोड की सामग्री। `configure` markdown-rs की और
सिंटैक्स चालू करता है, और `ParseContext` किसी नोड के चिल्ड्रन को वैसे पढ़ता है जैसे पार्सर पढ़ता है।

<a id="props"></a>

## प्रॉप

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Markdown के रूप में दस्तावेज़। |
| `html` | `.html(..)` | `string` | | HTML के रूप में दस्तावेज़, जब `markdown` न दिया गया हो। |
| `document` | `.document(..)` | `TextViewDocument` | | ब्लॉक के रूप में दस्तावेज़, जब न `markdown` दिया गया हो न `html`। |
| `options` | `.options(..)` | `MarkdownOptions` | सभी डिफ़ॉल्ट | पढ़ी जाने वाली Markdown सिंटैक्स ([विकल्प](#options))। |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | ऐप की अपनी सिंटैक्स, कस्टम नोड के रूप में ([Markdown एक्सटेंशन](#markdown-extensions))। |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | भाग के अनुसार Tailwind क्लास। |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | भाग के अनुसार इनलाइन स्टाइल (हर एक `StyleProp<TextStyle>`), क्लास के ऊपर। |
| `selectable` | `.selectable(..)` | `boolean` | `false` | दस्तावेज़ एक इकाई के रूप में चुना जा सकता है: चयन उसके पैराग्राफ़, हेडिंग, सेल और कोड ब्लॉक के आर-पार चलता है ([टेक्स्ट चयन](./text-selection.md))। |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | लिंक पर प्रेस करने से क्या होता है: वह उसकी रिपोर्ट करता है (`onLinkPress`), और `"open"` के साथ किसी दूसरी साइट या ऐप के लिंक को ऐप के बाहर खोलता भी है ([लिंक](#links))। |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | कोड ब्लॉक अपना क्षैतिज स्क्रॉल संकेतक दिखाते हैं। |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | टेबल अपना क्षैतिज स्क्रॉल संकेतक दिखाते हैं। |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | दस्तावेज़ के अंत में दिखाया जाता है: अंतिम टेक्स्ट के बाद इनलाइन, अन्यथा अपनी अलग पंक्ति में। |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | कस्टम नोड दिखाता है। |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | कोड ब्लॉक दिखाता है। |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | हर कोड ब्लॉक के ऊपरी दाएँ कोने पर एक्शन: `{ id: "copy" }` बिल्ट-इन है, बाकी ऐप के अपने। |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | ऐप के अपने एक्शन का आइकन। |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | हर टेबल के ऊपर की सामग्री। |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | सूत्र दिखाता है। |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | इमेज दिखाता है। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | | रूट, ब्लॉक का एक कॉलम; उसके टेक्स्ट स्टाइल हर भाग को पास होते हैं (टाइप्ड टेक्स्ट स्टाइल: `styles.root`)। |

Rust में भाग के अनुसार क्लास और स्टाइल `TextViewClasses` और `TextViewStyles` हैं; Rust व्यू आमतौर पर भागों को
[`TextViewParts`](#typed-part-styles) से स्टाइल करता है।

<a id="events"></a>

## इवेंट

| इवेंट | Rust | विवरण |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | किसी लिंक पर प्रेस किया गया: `{ url }`: उसका URL, हेडिंग के लिए `#anchor`, फ़ुटनोट के लिए `#footnote-<label>`। |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | किसी कोड ब्लॉक के एक्शन पर प्रेस किया गया (`copy` के कॉपी करने के बाद)। |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | लिंक में न होने वाली किसी इमेज पर प्रेस किया गया: `{ image }`, ताकि ऐप उसे बड़ा दिखा सके (अपना ज़ूम करने योग्य व्यूअर)। |

<a id="accessibility"></a>

## एक्सेसिबिलिटी

स्क्रीन रीडर दस्तावेज़ को क्रम से, टेक्स्ट दर टेक्स्ट पढ़ते हैं। `TextView` संरचना को उसकी भूमिकाएँ देता है: हेडिंग
हेडर हैं, लिंक लिंक हैं (उनका शीर्षक संकेत है), टास्क मार्कर अपनी चेक्ड स्थिति के साथ चेकबॉक्स हैं,
डिस्क्लोज़र का सारांश एक बटन है जो बताता है कि वह विस्तारित है या नहीं, और इमेज अपने alt टेक्स्ट से पढ़ी जाती हैं।

<a id="related"></a>

## संबंधित

- [Text](./text.md): वह एलिमेंट जो `TextView` का हर टेक्स्ट है, अपने स्पैन, लिंक, इनलाइन अटैचमेंट और चयन के साथ।
- [टेक्स्ट चयन](./text-selection.md): कई `TextView` और टेक्स्ट के आर-पार एक चयन।
- [`nsh/base`](../modules/nsh-base.md): अन्य बेस कंपोनेंट।
- [Styling](../docs/styling.md) और [Tailwind](../docs/tailwind.md)।
