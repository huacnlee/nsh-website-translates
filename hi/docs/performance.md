---
title: "प्रदर्शन"
description: "NSH ऐप्स को तेज़ कैसे रखता है (Rust ऐप्स, नेटिव रनटाइम, बैच किए गए क्रॉसिंग, नेटिव एनिमेशन, वर्चुअलाइज़्ड सूचियाँ), इसका आपके कोड के लिए क्या अर्थ है, और हेडलेस मोड में तथा स्क्रीन पर प्रदर्शन को कैसे मापें।"
order: 62
group: tools
source_hash: f8f220699bc54685
---

# प्रदर्शन

प्रदर्शन NSH की पहली प्राथमिकता है, और इसका अधिकांश हिस्सा आपके ऐप से नहीं, बल्कि फ्रेमवर्क से तय होता है: रनटाइम नेटिव है, हर अपडेट थ्रेड्स के बीच केवल एक बार गुज़रता है, एनिमेशन और लिस्ट वर्चुअलाइज़ेशन बिना JS के चलते हैं, और Rust में लिखा ऐप कोई JS चलाता ही नहीं। यह पृष्ठ बताता है कि NSH किन नियमों का पालन करता है, इनका आपके लिखे कोड के लिए (Rust और TSX दोनों में) क्या अर्थ है, और प्रदर्शन को कैसे मापें।

<a id="the-rules"></a>

## नियम

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS कम से कम काम करता है

**Rust में लिखा ऐप शुरू से अंत तक नेटिव कोड होता है**: उसके कॉम्पोनेंट, स्टेट और हैंडलर NSH के इंजन के साथ कंपाइल होते हैं, और कोई इंटरप्रेटर नहीं चलता ([Building with Rust](./rust.md))। ऐप लिखने का यह सबसे तेज़ तरीका है, और भारी बिज़नेस लॉजिक के लिए यही चुनना चाहिए।

TSX ऐप में QuickJS एक इंटरप्रेटर है: छोटा, जल्दी शुरू होने वाला, और भारी काम के लिए नेटिव कोड से काफ़ी धीमा। इसलिए NSH में **केवल आपके ऐप का कोड JS होता है**। रिएक्टिव ग्राफ़ (signals, computed values, effects), आपका कंपाइल किया हुआ JSX जिस रेंडरर को कॉल करता है, लेआउट इंजन, लिस्ट वर्चुअलाइज़ेशन, एनिमेशन और आपके द्वारा इम्पोर्ट किया गया हर मॉड्यूल Rust में है। पार्सिंग, डिफ़िंग, लेआउट और स्ट्रिंग प्रोसेसिंग नेटिव रूप से होती है।

इसका प्रभाव मापा जा सकता है। वही काउंटर ऐप NSH के पुराने JS रनटाइम पर और नेटिव रनटाइम पर (रिलीज़ बिल्ड):

| | पुराना JS रनटाइम | नेटिव रनटाइम |
|---|---|---|
| बंडल का आकार | 14 KB JS / 19.6 KB बाइटकोड | 886 B JS / 1.7 KB बाइटकोड |
| बंडल का मूल्यांकन | ~390 µs | ~95 µs |
| एक टैप का JS समय (माध्यिका) | ~14 µs | ~5 µs |
| एक टैप का कमिट | ~22 µs | ~15 µs |
| 1000 पंक्तियों की लिस्ट स्क्रॉल करना, प्रति रीबाइंडिंग फ़्रेम JS | ~150 µs | ~77 µs |

कॉम्पोनेंट के लिए भी यही सच है: Rust कॉम्पोनेंट के रूप में लिखा बटन बनाम समकक्ष TSX बटन, 200 की संख्या में:

| | Rust बटन: JS / कोर | TSX बटन: JS / कोर |
|---|---|---|
| पहला फ़्रेम (ops) | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| सभी 200 शीर्षक अपडेट करना (ops) | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

(Apple silicon पर मापा गया; दूसरी तालिका पुराने रनटाइम पर। दोनों NSH के प्रदर्शन बेसलाइन से।)

**आपके कोड के लिए:** इवेंट हैंडलर और computed values को हल्का रखें। भारी गणना (बड़े पेलोड पार्स करना, हर कीस्ट्रोक पर हज़ारों आइटम सॉर्ट करना) QuickJS में उससे अधिक महँगी पड़ती है जितनी आप JIT वाले V8 या JavaScriptCore में अपेक्षा करते हैं। इसे एक बार करें, `computed` में कैश करें, या इंटरैक्शन पथ से बाहर ले जाएँ।

<a id="2-cross-threads-in-batches"></a>

### 2. थ्रेड्स को बैच में पार करें

आपके ऐप का कोड, Rust हो या JS, इंजन थ्रेड पर चलता है, कभी मुख्य थ्रेड पर नहीं। एक टर्न, उदाहरण के लिए एक इवेंट हैंडलर और उसके द्वारा बदली गई हर चीज़, **एक कमिट** बन जाता है: रनटाइम कॉम्पोनेंट रेंडर करता है, लेआउट करता है, डिफ़ करता है और नेटिव व्यू ऑपरेशन्स का एक बैच बनाता है, जो **एक ही हॉप** में मुख्य थ्रेड तक पहुँचता है। हर व्यू के लिए कोई ब्रिज संदेश नहीं होता और हर prop के लिए कोई सीरियलाइज़ेशन नहीं होता।

**आपके कोड के लिए:** प्रदर्शन के लिए आपको राइट्स को एक साथ समेटने की ज़रूरत नहीं; एक हैंडलर में दस `set` कॉल भी एक ही कमिट बनाते हैं, Rust और TSX दोनों में। जब आप चाहें कि effects और computed values सभी राइट्स को एक साथ देखें, हर राइट के बाद न चलें, तो `batch` का उपयोग करें।

<a id="3-fine-grained-updates"></a>

### 3. सूक्ष्म-स्तरीय अपडेट

कॉम्पोनेंट **एक बार** चलते हैं, Rust और TSX दोनों में। इसके बाद केवल वही बाइंडिंग दोबारा चलती हैं जो किसी signal को पढ़ती हैं, जब वह बदलता है: एक टेक्स्ट, एक स्टाइल प्रॉपर्टी, `when` (`<If>`) की एक शाखा, `each` (`<Each>`) की पंक्तियाँ। यह जानने के लिए कि क्या बदला, कुछ भी पूरे सबट्री को दोबारा रेंडर नहीं करता।

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**आपके कोड के लिए:**

- Signals को वहीं पढ़ें जहाँ उनका उपयोग होता है (बाइंडिंग के अंदर, Rust में `move ||` क्लोज़र और TSX में JSX एक्सप्रेशन, तथा `computed` और `effect` में), कॉम्पोनेंट के शीर्ष पर नहीं, ताकि सबसे संकरी बाइंडिंग अपडेट हो।
- संग्रहों के लिए `each` / `<Each>` (key द्वारा रखी गई पंक्तियाँ) या [virtual list](./lists.md) का उपयोग करें; पूरे संग्रह से दोबारा बनाई गई पंक्तियाँ (Rust में `dynamic`, JSX में सादा `.map()`) हर बदलाव पर सब की सब फिर से बनाई जाती हैं।
- जब कई बाइंडिंग किसी मान का उपयोग करती हैं तो उसे `computed` से व्युत्पन्न करें, ताकि वह प्रति बदलाव एक बार गणना हो।

तीन आइटम की सूची में चौथा आइटम जोड़ना, जैसा `nsh test --trace` दिखाता है:

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

देखें [Reactivity](./reactivity.md)।

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. जो ज़रूरी नहीं है, उसे न भेजें

कोर केवल वही भेजता है जो बदला है: नए व्यू को कोई डिफ़ॉल्ट स्टाइल या खाली इवेंट मास्क नहीं मिलता, अपरिवर्तित स्टाइल और फ़्रेम नहीं भेजे जाते, और टेक्स्ट का रंग बदलने पर टेक्स्ट का लेआउट दोबारा नहीं होता। एक संख्या बदलने वाला टैप एक टेक्स्ट आइटम भेजता है। आप इसे `nsh test --trace` आउटपुट में देख सकते हैं (नीचे)।

<a id="5-animate-natively"></a>

### 5. नेटिव रूप से एनिमेट करें

इंजन थ्रेड से चलाया गया एनिमेशन (हर फ़्रेम पर लिखा गया signal) प्रति फ़्रेम एक कमिट का खर्च लेता है, TSX में एक JS कॉल भी, और इंजन थ्रेड व्यस्त होने पर अटकता है। एनिमेटेड मान ([Animation](./animation.md): Rust में `animated_value`, TSX में [`nsh` का एनिमेशन API](../modules/nsh.md#animation)) इसके बजाय एनिमेशन को नेटिव रूप से चलाते हैं:

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring` और `decay` प्लेटफ़ॉर्म के UI थ्रेड पर, फ़्रेम दर फ़्रेम चलते हैं, और प्रति फ़्रेम इंजन थ्रेड पर कोई काम नहीं होता।
- `scroll_value` (`scrollValue`) उसी फ़्रेम में स्क्रॉल ऑफ़सेट को एनिमेटेड मान में लिखता है; एक पैन (`pan={{ x, y }}`) ड्रैग को व्यू को सीधे हिलाने देता है। आपका कोड अंत के बारे में सुनता है (एनिमेशन पूरा होता है, पैन के अंत पर वेग मिलता है)।
- `Animated.sequence` / `parallel` / `stagger` / `loop` एक नेटिव ट्री के रूप में चलते हैं: हर चरण पिछले के समाप्त होते ही शुरू होता है, JS की प्रतीक्षा में कोई अंतराल नहीं होता।
- `LayoutAnimation.configureNext` अगले कमिट के फ़्रेम, इन्सर्शन और रिमूवल को नेटिव रूप से एनिमेट करता है।

<a id="6-virtualize-long-lists"></a>

### 6. लंबी सूचियों को वर्चुअलाइज़ करें

[`List`](./lists.md) केवल व्यूपोर्ट के पास की पंक्तियाँ रखता है, उनके सेल रीसायकल करता है, और पोज़िशन, कॉलम, स्टिकी हेडर और व्यूएबिलिटी की गणना नेटिव रूप से करता है। जिन स्क्रॉलिंग फ़्रेम में कोई नई पंक्ति नहीं दिखती, वे आपका कोई कोड नहीं चलाते और कोई बैच नहीं बनाते; गैलरी की फ़ोटो लिस्ट की एक नई पंक्ति बाइंड करने वाला फ़्रेम 4 ऑपरेशन और 4 माउंट आइटम का होता है।

**आपके कोड के लिए:**

- `estimated_item_size` (`estimatedItemSize`) को असली पंक्ति ऊँचाई के क़रीब रखें।
- प्रति-आइटम स्टेट को अपने डेटा में रखें (id द्वारा key किया हुआ), पंक्ति के अंदर बनाए गए signals में नहीं: सेल अन्य आइटम के लिए दोबारा उपयोग होते हैं, और जब ऐसा होता है तो पंक्ति की पोज़िशन (`at.index()`; TSX में `item()` / `index()`) बदल जाती है।
- पंक्तियों को सस्ता रखें: एक पंक्ति प्रति रीसायकल एक बार बाइंड होती है, इसलिए उसका कोड तब चलता है जब उपयोगकर्ता स्क्रॉल कर रहा होता है।
- स्क्रॉल पोज़िशन का अनुसरण करने वाले effects के लिए `on_scroll` (`onScroll`) के बजाय `scroll_value` (`scrollValue`) का उपयोग करें। एक स्क्रॉल लिसनर को प्रति इंजन टर्न अधिकतम एक इवेंट मिलता है, लेकिन हर एक फिर भी आपके कोड में (TSX में JS में) एक कॉल है।

<a id="measuring"></a>

## मापना

<a id="headless-50"></a>

### हेडलेस: `--trace`

Rust टेस्ट में, `EngineConfig::trace` वही `perf` लाइनें लॉग करता है और `Headless::observe` हर बैच देखता है ([Testing](./testing-and-trace.md#tracing-with-trace))। `nsh test --trace` उन्हें TSX के लिए प्रिंट करता है:

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

किस पर ध्यान दें:

- **ops** (आपके JS द्वारा कतार में डाले गए ऑपरेशन) और **mount items** (नेटिव व्यू ऑपरेशन): ये नियतात्मक हैं। यदि एक लेबल बदलने वाला टैप 40 आइटम बनाता है, तो कुछ ऐसे व्यू दोबारा बना रहा है जिन्हें उसे अपडेट करना चाहिए।
- **event js**: एक हैंडलर की JS लागत और जो उसने ट्रिगर किया।
- **commit**: कॉम्पोनेंट रेंडर करने, लेआउट और डिफ़िंग की कोर की लागत।
- **list js**: उस कमिट के दौरान लिस्ट पंक्तियाँ बाइंड करने में खर्च हुआ JS।

पूरी गाइड: [Testing](./testing-and-trace.md)।

<a id="on-a-device-55"></a>

### डिवाइस पर: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

TSX ऐप के असली होस्ट से, प्लेटफ़ॉर्म के अपने टेक्स्ट इंजन के साथ, वही कमिट लाइनें लॉग करता है। `NshAppView(trace: true)` और `new NshView(context, true)` एम्बेडिंग ऐप में यही करते हैं।

<a id="on-screen-58"></a>

### स्क्रीन पर: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(Rust ऐप के `run_app` में `AppOptions { fps: true, .. }`) चल रहे ऐप के ऊपर फ़्रेम दर और फ़्रेम व कमिट की लागत दिखाता है, साथ में CPU, GPU और मेमोरी ([macOS: performance monitor](./macos.md#performance-monitor))। Linux और Windows पर, `--target linux --fps` और `--target windows --fps` वही रीडिंग हर सेकंड लॉग करते हैं, साथ में फ़्रेम के हर चरण का समय; `nsh test --target linux --fps -v` (या `windows`) उन्हें तब लेता है जब कोई टेस्ट ऐप को चला रहा हो।

> [!TIP]
> एकल माप CPU की क्लॉक स्थिति से प्रभावित होते हैं: जो थ्रेड अभी सोकर उठा है, वह कुछ समय तक धीमा चलता है। कई रन में से न्यूनतम की तुलना करें, उसी मशीन पर, और समय मापने के लिए रिलीज़ बिल्ड को प्राथमिकता दें।

<a id="reference-numbers"></a>

## संदर्भ आँकड़े

मापे गए आँकड़े, NSH की बेसलाइन और Linux पर गैलरी पृष्ठ-दर-पृष्ठ, [performance report](./performance-report.md) में हैं।

<a id="checklist"></a>

## चेकलिस्ट

- भाषा: ऐप को, या उसके सबसे अधिक उपयोग होने वाले हिस्सों को, Rust में लिखें ([Building with Rust](./rust.md)); TSX को उसके लिए रखें जो अक्सर बदलता है या रन टाइम पर डिलीवर होता है।
- इंटरैक्शन: एक टैप मुट्ठी भर माउंट आइटम बदलता है, दर्जनों नहीं।
- सूचियाँ: किसी भी लंबी चीज़ के लिए वर्चुअल लिस्ट (`virtual_list`, `List`), अनुमानित आइटम आकार के साथ; प्रति-आइटम स्टेट डेटा में।
- एनिमेशन: एनिमेटेड मान, हर फ़्रेम पर लिखे गए signals नहीं।
- स्क्रॉल effects: `scroll_value` (`scrollValue`), स्क्रॉल लिसनर नहीं।
- हैंडलर: प्रति कीस्ट्रोक या प्रति स्क्रॉल इवेंट कोई भारी काम नहीं; `computed` में कैश करें।

<a id="see-also"></a>

## यह भी देखें

- [Performance report](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md), [Animation](./animation.md), [Reactivity](./reactivity.md)
