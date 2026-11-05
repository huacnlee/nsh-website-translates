---
title: "Scroll"
description: "नेटिव स्क्रॉल व्यू: वर्टिकल और हॉरिज़ॉन्टल स्क्रॉलिंग, पेजिंग और स्नैपिंग, पुल टू रिफ्रेश, ज़ूमिंग और स्क्रॉल इवेंट।"
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# Scroll

`Scroll` एक नेटिव स्क्रोल व्यू है (iOS और Mac Catalyst पर UIScrollView, Android पर ScrollView)। यह अपने सभी चाइल्ड को अपने कंटेंट के रूप में लेआउट करता है और उन्हें नेटिव रूप से स्क्रोल करता है: स्क्रॉलिंग, फ्लिंगिंग, बाउंसिंग और स्नैपिंग प्लेटफ़ॉर्म पर, डिस्प्ले की रेट से चलती हैं। Rust में इसे `scroll()` से बनाया जाता है, TSX में `nsh` से `<Scroll>` के द्वारा।

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

स्क्रोल व्यू हर चाइल्ड को बनाता है, जो मध्यम आकार के पेजों के लिए उपयुक्त है। लंबे या असीमित डेटा के लिए [list](./list.md) का उपयोग करें: यह व्यूपोर्ट के पास की रो बनाती है और उन्हें रीसायकल करती है।

स्क्रोल व्यू को अपनी अक्ष के अनुदिश एक सीमित आकार चाहिए: उसे `flex: 1` (`.flex_1()`) दें, या ऐसे कंटेनर के अंदर ऊँचाई दें जिसकी ऊँचाई तय हो। इसका कंटेंट स्क्रोल व्यू की चौड़ाई पर (क्षैतिज होने पर ऊँचाई पर) और जितनी ऊँचाई (चौड़ाई) की उसे ज़रूरत हो उतनी पर लेआउट होता है।

## Props

[सामान्य props](./index.md#common-props) के अलावा (`style` को `ViewStyle` टाइप के साथ)। Rust में, स्क्रोलिंग props `Scrollable` trait के मेथड हैं, जिन्हें lists भी साझा करती हैं।

### Scrolling

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | बगल की ओर (क्षैतिज) स्क्रोल करता है। |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | उपयोगकर्ता इसे स्क्रोल कर सकता है। |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | स्क्रोल इंडिकेटर दिखता है: प्लेटफ़ॉर्म का, या थीम सेट होने के बाद ऐप का [बिल्ट-इन बार](./scrollbar.md#built-in-bars); ऑब्जेक्ट देने पर वह व्यू की अपनी थीम होती है। डेस्कटॉप और डेस्कटॉप ब्राउज़रों में क्षैतिज व्यू इसे बनाए रखता है: यह माउस का स्क्रोल बार है। |
| `bounces` | `.bounces(..)` | `boolean` | `true` | किनारों से आगे ओवरस्क्रोल। |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | व्यूपोर्ट के गुणजों पर रुकता है। |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | इस लंबाई के गुणजों पर रुकता है (0: बंद)। |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | इन ऑफ़सेट पर रुकता है। |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | `snapToInterval` के साथ आइटम का कौन-सा बिंदु व्यूपोर्ट से संरेखित होता है। |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | फ्लिंग अधिकतम एक स्नैप पॉइंट तक ही जाती है। |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | प्लेटफ़ॉर्म | फ्लिंग कितनी तेज़ी से धीमी होती है: प्रति मिलीसेकंड बची हुई वेलोसिटी (`normal` 0.998, `fast` 0.99)। |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | कंटेंट के चारों ओर जगह। |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | यह कहाँ से शुरू होता है। |
| `contentStyle` | कंटेंट व्यू की अपनी स्टाइल | `ViewStyle` | | चाइल्ड के चारों ओर एक व्यू की स्टाइल, जो उनके साथ स्क्रोल होता है; `flexGrow: 1` इसे कम से कम व्यूपोर्ट जितना ऊँचा बनाता है (केंद्र में खाली स्थिति)। |
| `contentClass` | कंटेंट व्यू की अपनी स्टाइल | `string` | | classes जैसा ही, जैसे `"grow justify-center p-4"`। |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | ड्रैग करने पर कीबोर्ड बंद होता है या नहीं। |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | टैप करने पर कीबोर्ड बंद होता है या नहीं: `never` (टैप केवल कीबोर्ड बंद करता है), `always` (कीबोर्ड बना रहता है), `handled` (जब कोई चीज़ टैप को संभालती है तो कीबोर्ड बना रहता है)। |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | स्क्रोल ऑफ़सेट (मुख्य अक्ष) से भरा जाने वाला एनिमेटेड मान, स्क्रोल-लिंक्ड एनिमेशन के लिए। |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | `onScroll` इवेंट्स के बीच न्यूनतम मिलीसेकंड (वैसे भी प्रति फ़्रेम अधिकतम एक)। |

### Pull to refresh

| Prop | Rust | प्रकार | विवरण |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | रिफ़्रेश स्पिनर दिखता है। |
| `onRefresh` | `.on_refresh(..)` | `() => void` | उपयोगकर्ता ने रिफ़्रेश के लिए खींचा: लोडिंग शुरू करें और खत्म होने तक `refreshing` सेट रखें। |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | ऐप अपना खुद का इंडिकेटर बनाता है, जो `height` पॉइंट ऊँचा है: प्लेटफ़ॉर्म का स्पिनर छिपा दिया जाता है, `height` तक पहुँचने पर पुल रिफ़्रेश करता है, और रिफ़्रेश होते समय कंटेंट के ऊपर `height` बना रहता है। 0 या उससे कम ऊँचाई का मतलब कोई इंडिकेटर नहीं। |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | एक एनिमेटेड मान जिसमें यह भरा जाता है कि व्यू को उसके शीर्ष से कितना आगे खींचा गया है (विश्राम पर 0, खिंचाव के साथ बढ़ता है; रिफ़्रेश के दौरान कंटेंट के ऊपर रखी गई जगह: `height` के साथ `refreshIndicator`), ऐप के इंडिकेटर के लिए। |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

### Zooming

`maximumZoomScale` को `minimumZoomScale` से ऊपर सेट करने पर (Rust में `.zoom_range(min, max)`) कंटेंट पिंच से ज़ूम करने योग्य हो जाता है; ज़ूम इन होने पर वह दोनों दिशाओं में स्क्रोल होता है। Lists अपना स्केल बनाए रखती हैं।

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | सबसे छोटा ज़ूम। |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | सबसे बड़ा ज़ूम। |
| `zoomScale` | `.zoom(..)` | `number` | | बदलने पर इस स्केल पर ज़ूम करता है; अन्यथा उपयोगकर्ता का ज़ूम बना रहता है। |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | पिंच सीमाओं से आगे जा सकता है और वापस स्प्रिंग होता है। |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | उपयोगकर्ता ज़ूम करने के लिए पिंच कर सकता है। |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | व्यूपोर्ट से छोटा कंटेंट (ज़ूम आउट होने पर) केंद्र में रहता है। |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

## Events

| Event | Rust | Payload | कब |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | ऑफ़सेट बदला (प्रति फ़्रेम अधिकतम एक बार, और `scrollEventThrottle` से अधिक बार नहीं)। |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | उपयोगकर्ता ने ड्रैग करना शुरू / बंद किया। |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | ड्रैग के बाद की ग्लाइड शुरू / बंद हुई। नए ड्रैग से रोकी गई ग्लाइड भी `onMomentumEnd` के साथ खत्म होती है। |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | स्क्रोलिंग रुक गई। |
| `onRefresh` | `.on_refresh` | कोई नहीं | रिफ़्रेश के लिए खींचा गया। |

`ScrollEvent` है `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (Rust में `offset`, `content_size`, `size`, `zoom_scale`): ऑफ़सेट, (ज़ूम किया हुआ) कंटेंट आकार, व्यूपोर्ट आकार और ज़ूम स्केल (जब तक व्यू ज़ूम न हो, 1)।

> [!TIP]
> किसी चीज़ को स्क्रोल पोज़िशन के साथ हिलाने के लिए (सिकुड़ता हेडर, पैरालैक्स इमेज), `scrollValue` को एक नेटिव मान से बाइंड करें और उसे स्टाइल में इंटरपोलेट करें। यह UI थ्रेड पर डिस्प्ले की रेट से चलता है, जबकि `onScroll` ऐप के कोड में प्रति फ़्रेम एक इवेंट है। देखें [animation](../docs/animation.md)।

## Ref methods

| मेथड | Rust | विवरण |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | किसी ऑफ़सेट तक स्क्रोल करता है। |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | `scale` तक ज़ूम करता है (सीमाओं के भीतर रखते हुए), कंटेंट पॉइंट (`x`, `y`, बिना ज़ूम वाले पॉइंट) को व्यूपोर्ट के बीच में रखते हुए, या बीच के आसपास। जैसे डबल टैप से टैप किए गए बिंदु पर ज़ूम इन करना। |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

## Keyboard

स्क्रोल व्यू के अंदर के इनपुट नेटिव रूप से कीबोर्ड से दूर रखे जाते हैं: स्क्रोल व्यू को नीचे का इनसेट मिलता है और वह फ़ोकस किए गए इनपुट तक अपने आप स्क्रोल करता है। स्क्रोल व्यू के बाहर के कंटेंट के लिए नीचे की पैडिंग या मार्जिन में [`env(keyboard-inset-height)`](./keyboard.md) का उपयोग करें। देखें [forms and the keyboard](../docs/forms-and-keyboard.md)।

## Right to left

राइट-टू-लेफ़्ट लेआउट में क्षैतिज स्क्रोल व्यू दाएँ सिरे से शुरू होते हैं और कंटेंट बदलने पर उससे अपनी दूरी बनाए रखते हैं; उनके चाइल्ड मिरर किए जाते हैं।

## Platform notes

- Android: पुल टू रिफ़्रेश NSH द्वारा बनाया जाता है (ओवरस्क्रोल नेटिव रहता है), `contentInset` पैडिंग के रूप में लागू होता है, और `decelerationRate` स्नैपिंग ग्लाइड को आकार देता है।
- Android पर ज़ूम NSH के अपने स्क्रोल व्यू से होता है, जो कंटेंट को उसके ऊपरी बाएँ कोने के आसपास स्केल करता है और दोनों दिशाओं में स्क्रोल करता है। पिंच Android की उँगलियों के बीच की न्यूनतम दूरी (लगभग 27 मिमी) के बाद शुरू होते हैं।
- Mac Catalyst (Mac idiom) पर, NSH पुल का पता लगाता है और अपना स्पिनर दिखाता है।
- iOS ज़ूम खत्म होने पर टेक्स्ट और कैनवास को ज़ूम किए हुए रेज़ोल्यूशन पर फिर से बनाता है।
