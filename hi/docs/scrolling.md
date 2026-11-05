---
title: "स्क्रॉलिंग"
description: "Rust और TSX में स्क्रॉल व्यू - पेजिंग और स्नैपिंग, ज़ूमिंग, पुल टू रिफ़्रेश, स्क्रॉल इवेंट, scrollValue के साथ स्क्रॉल से जुड़े इफ़ेक्ट, स्क्रॉल व्यू में कीबोर्ड, और कोड से स्क्रॉल करना।"
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# स्क्रॉलिंग

स्क्रॉल व्यू (Rust में `scroll()`, TSX में `<Scroll>`) प्लेटफ़ॉर्म का अपना स्क्रॉल व्यू है (iOS पर UIScrollView, Android पर ScrollView)। फ़्लिंग, बाउंस, स्क्रॉल इंडिकेटर और पुल टू रिफ़्रेश नेटिव हैं, और स्नैपिंग भी नेटिव है। आपका कोड स्क्रॉलिंग के बारे में इवेंट के ज़रिए जानता है, और ऑफ़सेट को [animated value](./animation.md#animated-values) से बाइंड कर सकता है, ताकि ऐसे इफ़ेक्ट बन सकें जो उँगली के साथ फ़्रेम दर फ़्रेम चलते हैं।

स्क्रॉल व्यू का उपयोग ज्ञात और मध्यम आकार की सामग्री के लिए करें: सेटिंग्स पेज, फ़ॉर्म, लेख, या चिप्स की एक पंक्ति। लंबे या असीमित डेटा के लिए [list](./lists.md) का उपयोग करें, जो पंक्तियों को रीसायकल करती है और वही स्क्रॉलिंग props स्वीकार करती है।

<a id="a-scroll-view"></a>

## स्क्रॉल व्यू

स्क्रॉल व्यू व्यूपोर्ट है, और उसके चिल्ड्रन सामग्री हैं। व्यूपोर्ट को अपने पैरेंट से आकार मिलना चाहिए (आमतौर पर `flex: 1`, `.flex_1()`)। सामग्री व्यूपोर्ट की चौड़ाई (वर्टिकल) या ऊँचाई (हॉरिज़ॉन्टल) पर लेआउट होती है, और उतनी लंबी होती है जितनी उसे ज़रूरत हो।

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

ऊपर का चाइल्ड व्यू स्क्रॉल व्यू का कंटेंट कंटेनर है। TSX में `contentStyle` (या `contentClass`) आपके लिए एक कंटेंट कंटेनर बना देता है, जो चिल्ड्रन को उस स्टाइल वाले व्यू में लपेट देता है और उनके साथ स्क्रॉल होता है। `flexGrow: 1` (`.flex_grow(1.0)`) सामग्री को कम से कम व्यूपोर्ट जितना ऊँचा बना देता है, ताकि छोटी सामग्री केंद्र में रखी जा सके और लंबी सामग्री फिर भी स्क्रॉल हो:

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

हॉरिज़ॉन्टल स्क्रॉल व्यू में `horizontal` (`.horizontal()`) दिया जाता है और चाइल्ड के रूप में एक रो होती है:

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

राइट-टू-लेफ़्ट में (देखें [Device and environment](./device-and-environment.md#right-to-left)), हॉरिज़ॉन्टल स्क्रॉल व्यू अपने दाएँ सिरे से शुरू होता है और उस सिरे से अपनी दूरी बनाए रखता है।

उँगलियाँ स्क्रॉल व्यू को ड्रैग करती हैं। डेस्कटॉप (macOS, Windows, Linux) और ब्राउज़र में माउस डेस्कटॉप ऐप्स की तरह स्क्रॉल करता है: अपने व्हील से (Shift + व्हील हॉरिज़ॉन्टली स्क्रॉल करता है), टचपैड, कीबोर्ड और स्क्रॉल इंडिकेटर से, जो माउस के व्यू के ऊपर चलने पर दिखता है और स्क्रॉल बार की तरह ड्रैग होता है। माउस ड्रैग ऐप के pans, responders और टेक्स्ट सेलेक्शन को जाते हैं। डेस्कटॉप पर टचस्क्रीन स्क्रॉल व्यू को उँगलियों की तरह ही ड्रैग करती हैं। हॉरिज़ॉन्टल व्यू वहाँ `scrollbar={false}` होने पर भी अपना इंडिकेटर रखते हैं, क्योंकि हॉरिज़ॉन्टल व्हील के बिना माउस उन्हें इसी से चलाता है।

<a id="behavior-props"></a>

### व्यवहार संबंधी props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | बगल की ओर स्क्रॉल करता है। |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | उपयोगकर्ता इसे स्क्रॉल कर सकता है। कोड से स्क्रॉल करना फिर भी काम करता है। |
| `bounces` | `.bounces(..)` | `boolean` | `true` | किनारों से आगे ओवरस्क्रॉल। |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | स्क्रॉल इंडिकेटर दिखता है। डेस्कटॉप और डेस्कटॉप ब्राउज़र में हॉरिज़ॉन्टल व्यू इसे बनाए रखता है: यह माउस का स्क्रॉल बार है। |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | सामग्री के चारों ओर जगह, जिसमें स्क्रॉल किया जा सकता है। |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | यह कहाँ से शुरू होता है। |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | प्लेटफ़ॉर्म का डिफ़ॉल्ट | फ़्लिंग कितनी तेज़ी से धीमी होती है: `"normal"`, `"fast"`, या प्रति मिलीसेकंड बनी रहने वाली वेलोसिटी (`0.998` सामान्य है, `0.99` तेज़; `0` प्लेटफ़ॉर्म का डिफ़ॉल्ट है)। |

<a id="paging-and-snapping"></a>

## पेजिंग और स्नैपिंग

स्नैपिंग का फ़ैसला उँगली उठते ही नेटिव रूप से होता है, रिलीज़ ऑफ़सेट, अनुमानित ग्लाइड और वेलोसिटी के आधार पर। इसके बाद स्क्रॉल व्यू चुने गए स्टॉप तक ग्लाइड करता है, और आपके कोड की कोई भूमिका नहीं होती।

| Prop | Rust | टाइप | विवरण |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | व्यूपोर्ट के आकार के गुणजों पर रुकता है। |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | इस लंबाई के गुणजों पर रुकता है (0: बंद)। |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | इन ऑफ़सेट पर रुकता है। |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `snapToInterval` के साथ: आइटम का कौन-सा बिंदु व्यूपोर्ट के साथ अलाइन होता है। |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | एक फ़्लिंग अधिकतम एक स्टॉप आगे बढ़ती है। |

एक पेजर: स्क्रॉल व्यू जितने चौड़े पेज, और ग्लाइड खत्म होने पर अपडेट होने वाला इंडिकेटर।

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

कार्ड्स का एक कैरोसेल जो केंद्र पर स्नैप होता है, हर फ़्लिंग पर एक कार्ड:

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

Lists वही स्नैपिंग props लेती हैं, इसलिए लंबे कैरोसेल के लिए वे बेहतर विकल्प हैं।

<a id="scroll-events"></a>

## स्क्रॉल इवेंट

| Prop | Rust | Payload | कब |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | ऑफ़सेट बदला। प्रति फ़्रेम अधिकतम एक बार; `scrollEventThrottle` उन्हें और दूर-दूर करता है। |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | `onScroll` इवेंट के बीच न्यूनतम मिलीसेकंड। |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | उपयोगकर्ता ने ड्रैग करना शुरू किया। |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | उपयोगकर्ता ने उँगली उठाई। |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | फ़्लिंग के बाद का ग्लाइड शुरू हुआ। |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | ग्लाइड खत्म हुआ (नया ड्रैग उसे पकड़ ले तब भी)। |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | उपयोगकर्ता का स्क्रॉल रुक गया: ग्लाइड के बाद, या ग्लाइड के बिना ड्रैग के अंत पर। |

`ScrollEvent` में ये होते हैं: ऑफ़सेट (`offset`, एक `Point`; Rust में भी वही), सामग्री का आकार, ज़ूम सहित (`contentSize`, एक `Size`; `content_size`), व्यूपोर्ट (`size`) और `zoomScale` (`zoom_scale`)। बाकी इवेंट में ऑफ़सेट होता है: TSX में `{ offset }` के साथ `Point`, Rust में `Point<Points>`।

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` स्क्रॉल के हर फ़्रेम पर आपका कोड चलाता है (थ्रॉटल के अधीन)। ऐसी चीज़ के लिए जिसे केवल स्क्रॉल से जुड़ी *दिखना* है, जैसे फ़ेड होने वाला हेडर या पैरालैक्स इमेज, इसके बजाय [`scrollValue`](#scroll-linked-effects-scrollvalue) का उपयोग करें: यह पूरी तरह नेटिव रूप से चलता है।

<a id="scroll-linked-effects-scrollvalue"></a>

## स्क्रॉल से जुड़े इफ़ेक्ट: scrollValue

`scrollValue` (`.scroll_value(&value)`) एक [animated value](./animation.md#animated-values) लेता है और स्क्रॉल ऑफ़सेट (मुख्य अक्ष के अनुसार) को नेटिव रूप से उसमें लिखता है, उसी फ़्रेम में जिसमें सामग्री हिलती है। उस वैल्यू को, या उससे `interpolate`, `diffClamp` (`diff_clamp`) या अंकगणित के ज़रिए बने नोड्स को, स्टाइल से बाइंड करें।

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

एक हेडर जो सामग्री के ऊपर स्क्रॉल होने पर खिसककर हट जाता है और नीचे स्क्रॉल करते ही वापस आ जाता है, ऑफ़सेट का `diffClamp` है:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

Interpolations डिफ़ॉल्ट रूप से अपनी इनपुट रेंज के बाहर क्लैंप हो जाते हैं, इसलिए ऊपर से आगे खींचने पर (नकारात्मक ऑफ़सेट) इफ़ेक्ट अपने अंत पर बना रहता है। ऐसे स्ट्रेची हेडर के लिए जो खींचने पर बढ़ता है, `extrapolate: "extend"` दें (Rust में `interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))`)।

<a id="pull-to-refresh"></a>

## पुल टू रिफ़्रेश

`refreshing` और `onRefresh` (`.refreshing(..)` और `.on_refresh(..)`) प्लेटफ़ॉर्म का पुल-टू-रिफ़्रेश कंट्रोल जोड़ते हैं। कंट्रोल तब तक दिखता है जब तक `refreshing` true है। इसे `onRefresh` में सेट करें और काम पूरा होने पर क्लियर करें।

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

iOS पर कंट्रोल UIRefreshControl है। Mac Catalyst के Mac idiom में NSH उसी व्यवहार के साथ अपना स्पिनर दिखाता है। Lists वही props लेती हैं। डेस्कटॉप और ब्राउज़र में पुल टचस्क्रीन का (या macOS ट्रैकपैड का, जो ऊपर से आगे खींचता है) जेस्चर है, क्योंकि माउस ड्रैग किए बिना स्क्रॉल करता है। वहाँ रिफ़्रेश करने का कोई और तरीका दें, जैसे बटन या कीबोर्ड शॉर्टकट।

<a id="an-indicator-of-your-own"></a>

### आपका अपना इंडिकेटर

पुल कैसा दिखे, यह चुनना ऐप का काम है। `refreshIndicator={{ height }}` बताता है कि ऐप अपना इंडिकेटर खुद बनाता है, और `height` उसकी ऊँचाई पॉइंट में देता है: प्लेटफ़ॉर्म का स्पिनर छिपा रहता है, पुल `height` तक पहुँचने पर रिफ़्रेश होता है, और रिफ़्रेश के दौरान इंडिकेटर के लिए सामग्री के ऊपर `height` जगह रखी जाती है। `pullValue` एक animated value को इस जानकारी से भरता है कि सामग्री ऊपर से कितनी आगे खिंची है: आराम की स्थिति में 0, पुल के साथ बढ़ती हुई, और रिफ़्रेश के दौरान `height`। इंडिकेटर को स्क्रॉल व्यू के ऊपरी हिस्से पर बनाएँ और उसकी स्टाइल को वैल्यू से interpolate करें: वे UI थ्रेड पर उँगली का अनुसरण करती हैं, प्रति फ़्रेम JS के बिना।

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

`height` को व्यूपोर्ट के आधे के भीतर रखें: ऊपर से आगे सामग्री उँगली का जितना आगे जाती है उतना ही अधिक प्रतिरोध करती है, और बहुत अधिक ऊँचाई कभी नहीं पहुँची जाती। iOS पर, ऐप का अपना इंडिकेटर UIRefreshControl की जगह उस पुल के साथ लेता है जिसे NSH खुद पहचानता है, जैसा Mac idiom में होता है।

<a id="zooming"></a>

## ज़ूमिंग

स्क्रॉल व्यू (lists का स्केल 1 ही रहता है) तब ज़ूम होता है जब उसका अधिकतम ज़ूम स्केल उसके न्यूनतम से ऊपर हो: पिंच करने से सामग्री स्केल होती है, और ज़ूम इन होने पर वह दोनों दिशाओं में स्क्रॉल होती है।

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | सबसे छोटा ज़ूम। |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | सबसे बड़ा ज़ूम; न्यूनतम से ऊपर होने पर पिंच से ज़ूम होता है। |
| `zoomScale` | `.zoom(scale)` | `number` | | prop बदलने पर इस स्केल तक ज़ूम करता है; अन्यथा उपयोगकर्ता का ज़ूम बना रहता है। |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | पिंच सीमाओं से आगे जा सकता है और वापस स्प्रिंग करता है। |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | उपयोगकर्ता पिंच करके ज़ूम कर सकता है। |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | व्यूपोर्ट से छोटी सामग्री (ज़ूम आउट होने पर) केंद्र में रहती है। |

स्क्रॉल इवेंट ज़ूम स्केल और ज़ूम की गई सामग्री का आकार बताता है। कोड से, `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` इस तरह ज़ूम करता है कि सामग्री का बिंदु (बिना ज़ूम वाले पॉइंट में) व्यूपोर्ट के बीच में आ जाए। डबल टैप से ज़ूम इसे कॉल करने वाला एक प्रेस हैंडलर है:

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

ज़ूम किए गए स्क्रॉल व्यू के अंदर का टेक्स्ट और कैनवस ज़ूम खत्म होने पर नए रेज़ोल्यूशन पर दोबारा बनाए जाते हैं, इसलिए iOS पर वे तीखे बने रहते हैं। Android पर NSH अपने स्क्रॉल व्यू से ज़ूम करता है, जो पिंच के फ़ोकल पॉइंट के आसपास स्केल करता है, किसी भी संख्या की उँगलियों से पैन करता है, फ़्लिंग करता है और किनारों तथा ज़ूम सीमाओं पर रबर-बैंड होता है। Android पिंच तब शुरू करता है जब उँगलियाँ लगभग 27 mm दूर हों, जैसा सिस्टम का जेस्चर डिटेक्टर करता है।

<a id="scrolling-from-code"></a>

## कोड से स्क्रॉल करना

स्क्रॉल व्यू को एक ref दें (Rust में `element_ref()` और `.element_ref(&scroller)`, TSX में [`ref`](./jsx-and-components.md)) और उसके मेथड कॉल करें। कमांड उसी अपडेट के बाकी बदलावों के बाद चलते हैं, इसलिए अभी जोड़ी गई सामग्री तक स्क्रॉल करना काम करता है।

| Rust | TSX | विवरण |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | किसी ऑफ़सेट तक स्क्रॉल करता है। TSX में डिफ़ॉल्ट रूप से animated। |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | ज़ूम करने योग्य स्क्रॉल व्यू: `scale` तक ज़ूम करता है (सीमाओं में क्लैंप होकर), सामग्री के बिंदु या बीच के आसपास। |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

Lists में `scrollToIndex`, `scrollToOffset` और `scrollToEnd` भी जुड़ते हैं; देखें [Lists](./lists.md#scrolling-from-code)।

<a id="scroll-views-and-the-keyboard"></a>

## स्क्रॉल व्यू और कीबोर्ड

NSH फ़ोकस किए गए इनपुट को अपने आप दिखाई देता रखता है: कीबोर्ड दिखने पर इनपुट के आसपास के स्क्रॉल व्यू को कीबोर्ड जितना ऊँचा बॉटम इनसेट मिलता है और वह इनपुट को व्यू में स्क्रॉल कर देता है। यह नेटिव रूप से होता है, आपके ऐप में किसी कोड के बिना। स्क्रॉल व्यू के बाहर की सामग्री के लिए, जैसे नीचे पिन किया गया मैसेज बार, `env(keyboard-inset-height)` को बॉटम पैडिंग के रूप में उपयोग करें ([Content outside scroll views](./forms-and-keyboard.md#content-outside-scroll-views))।

दो props तय करते हैं कि स्क्रॉलिंग और टैप कीबोर्ड के साथ कैसे इंटरैक्ट करते हैं:

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | क्या सामग्री को ड्रैग करने से कीबोर्ड छिपता है। `"interactive"` iOS पर कीबोर्ड को उँगली के साथ नीचे जाने देता है; Android पर यह `"on-drag"` की तरह व्यवहार करता है। |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | कीबोर्ड खुला होने पर टैप क्या करता है। |

`keyboardShouldPersistTaps`:

- `"never"`: फ़ोकस किए गए इनपुट के बाहर टैप केवल कीबोर्ड छिपाता है, और बटन को अगला टैप मिलता है। उपयोगकर्ता एक बार हटाने के लिए टैप करता है, फिर दबाने के लिए।
- `"handled"`: जो चीज़ टैप को हैंडल करती है (जैसे बटन) उस पर टैप आर-पार चला जाता है और कीबोर्ड बना रहता है; खाली जगह पर टैप उसे छिपा देता है। आमतौर पर फ़ॉर्म के लिए सही विकल्प।
- `"always"`: हर टैप के बाद भी कीबोर्ड खुला रहता है।

दोनों का फ़ैसला टैप या ड्रैग होते ही नेटिव रूप से होता है, आपके कोड की प्रतीक्षा किए बिना। कोड से कीबोर्ड छिपाने के लिए Rust में `dismiss_keyboard()` कॉल करें या TSX में [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) से `Keyboard.dismiss()` कॉल करें।

<a id="nested-scroll-views"></a>

## नेस्टेड स्क्रॉल व्यू

वर्टिकल स्क्रॉल व्यू के अंदर हॉरिज़ॉन्टल स्क्रॉल व्यू अपेक्षा के अनुसार काम करता है: हर एक अपनी ही अक्ष के ड्रैग लेता है। एक ही अक्ष के दो स्क्रॉल व्यू भी नेस्ट हो सकते हैं (अंदर वाला पहले स्क्रॉल होता है)। जिन responders को उँगली चाहिए, जैसे स्क्रॉल व्यू के अंदर ड्राइंग कैनवस, वे उसे अपने आसपास के स्क्रॉल व्यू से बचाए रखते हैं: Rust में `.keep_touches(true)`, TSX में `onResponderGrant` से लौटाया गया `true`; देखें [Touch and gestures](./touch-and-gestures.md#the-responder-system)।

<a id="related"></a>

## संबंधित

- [Scroll](../elements/scroll.md): एलिमेंट रेफ़रेंस, हर prop और इवेंट।
- [Lists](./lists.md): वही स्क्रॉलिंग props वाली वर्चुअलाइज़्ड lists।
- [Animation](./animation.md): animated values, स्क्रॉल से जुड़े इफ़ेक्ट के लिए `interpolate` और `diffClamp`।
- [Forms and the keyboard](./forms-and-keyboard.md): इनपुट, फ़ोकस और कीबोर्ड।
