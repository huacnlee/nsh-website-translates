---
title: "Pagination"
description: "Pagination कॉम्पोनेंट: किसी सेट के पेज, जिनके बीच नेविगेट किया जा सके, जिसमें वर्तमान पेज के आसपास के पेज, एलिप्सिस (ellipses), Previous और Next, एक कॉम्पैक्ट पेजर, कीबोर्ड सपोर्ट और स्क्रीन रीडर के लिए वर्तमान पेज की जानकारी शामिल है, और जिसे ऐप द्वारा स्टाइल किया जाता है।"
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# Pagination

Pagination पृष्ठों के किसी समूह में आगे-पीछे जाने के लिए है: खोज परिणाम, तालिका की पंक्तियाँ, कोई आर्काइव। यह Previous, वर्तमान पृष्ठ के आसपास के पृष्ठ (पहला और आख़िरी पृष्ठ हमेशा, और छोड़े गए हर क्रम के लिए एक ellipsis), ऐप के children और Next दिखाता है। व्यवहार इसी का है: कौन-से पृष्ठ दिखें, प्रेस, कीबोर्ड, सिरों पर Previous और Next का disabled होना, नेविगेशन लैंडमार्क और स्क्रीन रीडर के लिए वर्तमान पृष्ठ। रूप ऐप का है: आइटम का अपना कोई रंग, आकार या लेबल नहीं होता, ऐप उन्हें स्टाइल करता है या खुद बनाता है।

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। Rust में `pagination()` हर prop के लिए एक setter (`.page(..)`, `.total_pages(..)`), उपयोगकर्ता के चुने पृष्ठ के लिए `.on_change(..)`, पंक्ति के लिए टाइप किए गए स्टाइल मेथड और ऐप की सामग्री के लिए `.child(..)` के साथ एक Pagination बनाता है।

<a id="the-page"></a>

## पृष्ठ

पृष्ठ ऐप का होता है: `page` वर्तमान पृष्ठ है, जो 1 से शुरू होता है, और `onChange({ page })` किसी पृष्ठ, Previous या Next पर प्रेस से उपयोगकर्ता द्वारा चुना गया पृष्ठ बताता है। ऐप उसे सेट करता है, वह पृष्ठ लोड करता है और उसकी पंक्तियाँ दिखाता है। `totalPages` बताता है कि कुल कितने पृष्ठ हैं; आख़िरी पृष्ठ से आगे का `page` आख़िरी पृष्ठ दिखाता है। वर्तमान पृष्ठ को दबाने पर कुछ रिपोर्ट नहीं होता, और पहले पृष्ठ पर Previous और आख़िरी पृष्ठ पर Next दबाने पर भी नहीं।

<a id="the-pages-shown"></a>

## दिखाए जाने वाले पृष्ठ

`visiblePages` के साथ (कम से कम 5, यही डिफ़ॉल्ट है) पंक्ति सभी पृष्ठ दिखाती है, जब तक वे समा जाएँ। उससे आगे वह पहला और आख़िरी पृष्ठ दिखाती है, वर्तमान पृष्ठ दिखाती है और उसके दोनों ओर उतने पृष्ठ जितने समा सकें, `(visiblePages - 3) / 2`, और छोड़े गए पृष्ठों के हर क्रम के लिए एक ellipsis।

| 20 में से `page`, `visiblePages={7}` | दिखता है |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

दस हज़ार पृष्ठ होने पर भी वही सात आइटम दिखते हैं। विषम `visiblePages` वर्तमान पृष्ठ को बीच में रखता है।

<a id="items"></a>

## आइटम

हर आइटम ऐप का `itemClass` और `itemStyle` लेता है: वर्तमान पृष्ठ `selected:` होता है, जो आइटम प्रेस नहीं लेता वह `disabled:` होता है, और कीबोर्ड फ़ोकस वाला आइटम `focus:` होता है। पंक्ति का लेआउट ऐप `class` से तय करता है (डिफ़ॉल्ट रूप से row; `gap-*`, `justify-*`)।

`renderItem` के बिना पृष्ठ अपना नंबर दिखाता है, ellipsis `…` दिखाता है, और Previous तथा Next अपने accessibility लेबल दिखाते हैं (उनके बिना `‹` और `›`)। `renderItem` हर आइटम की सामग्री एक `PaginationItemState` से बनाता है:

| Field | Type | Description |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | आइटम क्या है। |
| `page` | `number` | पृष्ठ का नंबर; वह पृष्ठ जहाँ Previous या Next जाता है (सिरों पर वर्तमान पृष्ठ); ellipsis का पहला छिपा पृष्ठ। |
| `start`, `end` | `number` | ellipsis के छिपे पृष्ठ: `start` शामिल, `end` (दिखाया गया अगला पृष्ठ) शामिल नहीं। |
| `current` | `boolean` | वर्तमान पृष्ठ। |
| `disabled` | `boolean` | यह प्रेस नहीं लेता: पहले पृष्ठ पर Previous, आख़िरी पृष्ठ पर Next, और disabled pagination का हर आइटम। |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

Ellipsis अपने आप में कोई प्रेस नहीं लेता: वह क्या करे, यह ऐप तय करता है। उसमें बनाया गया `Menu` उन पृष्ठों की सूची देता है जो वह छिपाता है, जैसा ऊपर `JumpMenu` करता है।

## Compact

`compact` केवल Previous, children और Next दिखाता है: संकरी स्क्रीन के लिए एक pager, जिसमें पृष्ठ की जानकारी children में दी जाती है।

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

दोनों रूपों में children पृष्ठों के बाद और Next से पहले आते हैं: जैसे पृष्ठों की गिनती, या किसी पृष्ठ पर जाने का फ़ील्ड।

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | आवश्यक | वर्तमान पृष्ठ, 1 से शुरू; ऐप इसे `onChange` में सेट करता है। |
| `totalPages` | `.total_pages(..)` | `number` | आवश्यक | कुल कितने पृष्ठ हैं, कम से कम 1। |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | एक बार में अधिकतम दिखाए जाने वाले पृष्ठ, पहला और आख़िरी शामिल; कम से कम 5। |
| `compact` | `.compact(..)` | `boolean` | `false` | केवल Previous, children और Next। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई आइटम प्रेस या कीबोर्ड फ़ोकस नहीं लेता; `disabled:` स्टाइल लागू होते हैं, और स्क्रीन रीडर बताते हैं कि वे dimmed हैं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर नेविगेशन को क्या कहते हैं: यह किसके पृष्ठों में चलता है। |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | कोई नहीं | Previous और Next के लिए स्क्रीन रीडर क्या बोलते हैं, और `renderItem` के बिना उनकी सामग्री। |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर आइटम का रूप: वर्तमान पृष्ठ पर `selected:`, `disabled:`, `focus:`; टेक्स्ट स्टाइल उसकी सामग्री तक पहुँचते हैं। |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | कोई नहीं | हर आइटम की सामग्री उसकी स्थिति से बनाता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | पृष्ठों के बाद, Next से पहले ऐप की सामग्री। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पंक्ति का रूप और लेआउट। |

## Events

| Event | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: वह पृष्ठ जो उपयोगकर्ता ने किसी पृष्ठ, Previous या Next से चुना। वर्तमान पृष्ठ कभी रिपोर्ट नहीं होता। |

<a id="motion"></a>

## गति

वर्तमान पृष्ठ एक आइटम से दूसरे पर वैसे ही जाता है जैसा ऐप की `selected:` क्लासें कहती हैं: `itemClass` पर `transition-colors` हाइलाइट को छोड़े गए पृष्ठ से पहुँचे पृष्ठ तक फ़ेड करता है। पृष्ठ बदलने पर हर आइटम अपनी जगह रहता है और केवल आइटम की सामग्री बदलती है, इसलिए पंक्ति कभी झिलमिलाती नहीं; reduced motion में ऐप के transitions थम जाते हैं (`motion-reduce:transition-none`)।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- पंक्ति एक नेविगेशन लैंडमार्क है, जिसका नाम `accessibilityLabel` से तय होता है।
- हर पृष्ठ, Previous और Next एक बटन है। वर्तमान पृष्ठ को वर्तमान पृष्ठ के रूप में बोला जाता है (ARIA का
  `aria-current="page"`) और वह selected होता है; पहले पृष्ठ पर Previous और आख़िरी पृष्ठ पर Next dimmed होते हैं।
- macOS और वेब पर हर पृष्ठ, Previous और Next कीबोर्ड फ़ोकस का एक पड़ाव है, और Return तथा Space उसे दबाते हैं। कीबोर्ड से दबाया गया पृष्ठ, ऐप के उसे दिखाने के बाद, फ़ोकस बनाए रखता है, चाहे वह पंक्ति में कहीं भी पहुँचे; वैसा ही पहले या आख़िरी पृष्ठ के साथ होता है जब Previous या Next उन तक पहुँचता है।

लेबल, रोल और घोषणाओं के सामान्य नियमों के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: प्रेस एक टैप है जो किसी आइटम पर समाप्त होता है।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: प्रेस एक क्लिक है; macOS और वेब पर Tab आइटम तक पहुँचता है।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है।
