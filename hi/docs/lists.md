---
title: "सूचियाँ"
description: "Rust और TSX में लंबी और अंतहीन सूचियाँ - रीसाइक्लिंग, पंक्ति पहचान, कॉलम, स्टिकी हेडर, उलटी चैट सूचियाँ, क्षैतिज सूचियाँ, पेज में सूचियाँ, और अधिक लोड करना, दृश्यता और किसी आइटम तक स्क्रॉल करना।"
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# लिस्ट (Lists)

लिस्ट (Rust में `virtual_list(..)`, TSX में `nsh` से `List`) लंबे डेटा को नेटिव स्क्रॉल व्यू पर रेंडर करती है और केवल स्क्रीन के पास की पंक्तियाँ (rows) बनाती है। कौन सी पंक्तियाँ मौजूद हैं, वे कहाँ जाएँगी, कॉलम, स्टिकी हेडर और कौन से आइटम दिख रहे हैं, यह सब नेटिव साइड पर गणना होता है। आपका कोड तभी सेल में कंटेंट भरता है जब नेटिव साइड उसे माँगती है। दस लाख आइटम की लिस्ट की लागत लगभग तीस आइटम की लिस्ट जितनी ही होती है।

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

Rust में `virtual_list(count, row)` पंक्तियों की संख्या (एक वैल्यू, सिग्नल या क्लोज़र) और एक फ़ंक्शन लेता है जो पंक्ति की स्थिति (`at.index()`) से पंक्ति बनाता है। पंक्तियाँ उसी इंडेक्स से आपका डेटा पढ़ती हैं। TSX में `each` आइटम लेता है और row फ़ंक्शन को आइटम मिलता है। [scroll view](./scrolling.md) की तरह, लिस्ट ही व्यूपोर्ट है और उसे अपने पैरेंट से साइज़ चाहिए (`.flex_1()`, `flex: 1` या height)।

<a id="how-recycling-works"></a>

## रीसाइक्लिंग कैसे काम करती है

row फ़ंक्शन हर आइटम के लिए एक बार नहीं बुलाया जाता। वह **हर सेल के लिए एक बार** बुलाया जाता है, और सेल दोबारा इस्तेमाल होते हैं: जब कोई पंक्ति स्क्रीन से बहुत दूर स्क्रॉल हो जाती है, तो उसका सेल किसी दूसरी पंक्ति को दे दिया जाता है और उसकी स्थिति (Rust में `at.index()`, TSX में `item()` और `index()`) बदल जाती है। पंक्ति में जो कुछ भी उसे पढ़ता है, वह किसी भी अन्य [signal](./reactivity.md) की तरह अपनी जगह पर अपडेट हो जाता है।

इससे दो नियम निकलते हैं:

**स्थिति को वहीं पढ़ें जहाँ आप उसका उपयोग करते हैं।** row फ़ंक्शन की शुरुआत में कॉपी की गई वैल्यू उस पंक्ति की रहती है जो सेल ने सबसे पहले दिखाई थी।

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**हर आइटम की स्टेट अपने डेटा में रखें, पंक्ति में नहीं।** पंक्ति के अंदर बनाया गया सिग्नल सेल का होता है और सेल के साथ अगले आइटम तक चला जाता है। "यह पंक्ति expanded / selected / liked है" को आइटम में या id से की गई सेट में रखें:

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

पंक्तियों की ऊँचाई अलग-अलग हो सकती है। जब तक किसी पंक्ति को मापा नहीं गया है, लिस्ट अनुमानित आइटम साइज़ (डिफ़ॉल्ट 50 पॉइंट) मानती है। अपनी सामान्य पंक्ति के करीब की वैल्यू दें, ताकि स्क्रॉल इंडिकेटर और दूर के आइटम तक की छलाँगें शुरू से सटीक रहें।

<a id="changing-the-data"></a>

## डेटा बदलना

Rust में गिनती को सिग्नल या क्लोज़र (`move || posts.with(Vec::len)`) के रूप में दें: लिस्ट अपनी जगह पर बढ़ती और घटती है। अंत में जोड़ी या हटाई गई पंक्तियों के लिए और कुछ नहीं चाहिए। जब पंक्तियाँ कहीं और आती-जाती हैं, तो उनकी पहचान `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))` से दें। लिस्ट साझा शुरुआत और अंत को रखती है और बीच की चीज़ों को हटाया और जोड़ा गया मानती है।

TSX में आइटम बदलने के लिए नई array दें: `posts.set([...posts(), ...more])`। लिस्ट पुरानी और नई array की तुलना **आइटम की identity से** (`===`) करती है, साझा शुरुआत और अंत को रखती है और बीच की चीज़ों को हटाया और जोड़ा गया मानती है।

दोनों में मापे गए साइज़ अपनी पंक्तियों के साथ रहते हैं, और जब स्क्रीन पर दिख रही पंक्तियों के ऊपर पंक्तियाँ जोड़ी जाती हैं, तो दिखती पंक्तियाँ कूदने के बजाय अपनी जगह पर बनी रहती हैं।

- TSX में अपडेट immutable तरीके से करें: नई array, और अपरिवर्तित आइटम ऑब्जेक्ट दोबारा इस्तेमाल करें। array को अपनी जगह बदलना (`push`) दिखाई नहीं देता।
- बदला हुआ आइटम नया ऑब्जेक्ट होना चाहिए (`{ ...post, title }`), ताकि उसकी पंक्ति बदलाव दिखाए।
- शुरुआत में जोड़ना (नए संदेश, रिफ्रेश हुई फ़ीड) उपयोगकर्ता की जगह बनाए रखता है।

`keyExtractor` आइटम को viewability टोकन (नीचे) में नाम देता है। डिफ़ॉल्ट रूप से key `item.key` होती है, फिर `item.id`, फिर इंडेक्स। यह TSX में बदलावों के मिलान को प्रभावित नहीं करता, जो हमेशा identity से होता है।

## Props

लिस्ट स्क्रॉल व्यू के वे सभी स्क्रॉलिंग props लेती है जो लिस्ट के लिए मायने रखते हैं (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`; Rust में वही मेथड जो स्क्रॉल व्यू के हैं), जिनका वर्णन [Scrolling](./scrolling.md) में है। लिस्ट का स्केल 1 रहता है। इसके अपने props:

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | आइटम; Rust में पंक्तियों की संख्या। |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | एक सेल रेंडर करता है; हर सेल के लिए एक बार बुलाया जाता है, देखें [रीसाइक्लिंग](#how-recycling-works)। |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | अभी तक न मापी गई पंक्तियों का साइज़, पॉइंट में। |
| `horizontal` | `.horizontal()` | `boolean` | `false` | बगल की ओर स्क्रॉल करती है। |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: लिस्ट अपने ही स्क्रॉल व्यू में स्क्रॉल होती है। `"parent"`: वह अपने आसपास के स्क्रॉल व्यू में पूरी लंबाई में रहती है, जो उसे पेज के बाकी हिस्से के साथ स्क्रॉल करता है (देखें [पेज में लिस्ट](#lists-in-a-page-viewportparent))। लिस्ट बनाते समय चुना जाता है। |
| `numColumns` | `.columns(n)` | `number` | `1` | प्रति पंक्ति आइटम (वर्टिकल लिस्ट)। |
| `inverted` | `.inverted()` | `boolean` | `false` | आइटम 0 नीचे (चैट); अंत से शुरू होती है और अंत से अपनी दूरी बनाए रखती है। |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | जो लिस्ट inverted नहीं है, वह कंटेंट बढ़ने पर अंत में बनी रहती है जब तक वह अंत से उतने पॉइंट के भीतर है (नीचे देखें)। |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | वे आइटम जो ऊपर से स्क्रॉल होकर निकलने पर ऊपर चिपके रहते हैं (एक कॉलम, inverted नहीं)। |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | स्टिकी आइटम ऊपर से कितना नीचे चिपकते हैं, CSS `position: sticky` के `top` की तरह; कंटेंट उनके ऊपर की जगह के नीचे स्क्रॉल होता रहता है। animated value उन्हें हर फ़्रेम में हिलाती है। |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | कंटेंट की padding और gaps, केवल संख्याएँ। |
| `contentClass` | | `string` | | classes (`p-*`, `gap-*`) जैसा ही; `contentStyle` उन पर प्राथमिकता पाता है। |
| `header` | `.header(..)` | component या element | | आइटम से पहले। |
| `footer` | `.footer(..)` | component या element | | आइटम के बाद। |
| `empty` | `.empty(..)` | component या element | | जब कोई आइटम न हो तब आइटम की जगह दिखाया जाता है। |
| `separator` | `.separator(\|\| ..)` | component या element | | आइटम के बीच (एक कॉलम)। |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | पहले फ़्रेम से पहले इस आइटम तक स्क्रॉल करता है। |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | अंत पास है (नीचे देखें)। |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | अंत से कितना पास, व्यूपोर्ट में, `onLoadMore` चलता है। |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | स्क्रॉल के बाद शुरुआत पास है (नीचे देखें)। |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | शुरुआत से कितना पास, व्यूपोर्ट में, `onLoadMoreAtStart` चलता है। |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | आइटम viewable हुए या viewable नहीं रहे। |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | आइटम कब viewable माने जाते हैं। |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | viewability टोकन में key; Rust में पंक्तियों की पहचान। |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Pull to refresh। |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | ऐप का अपना pull-to-refresh इंडिकेटर, प्लेटफ़ॉर्म के स्पिनर की जगह (देखें [Scrolling](./scrolling.md#an-indicator-of-your-own))। |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | स्क्रॉल इंडिकेटर दिखता है: प्लेटफ़ॉर्म का, या ऐप का [built-in bar](../elements/scrollbar.md#built-in-bars) जब उसने थीम सेट की हो; ऑब्जेक्ट व्यू की अपनी थीम होती है। डेस्कटॉप और डेस्कटॉप ब्राउज़र में हॉरिज़ॉन्टल व्यू इसे बनाए रखता है: यह माउस की स्क्रॉल बार है। |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`। |

header, footer और empty स्लॉट एक element लेते हैं (TSX में component भी: `header={Header}`)। वे अपने आप में अलग सेल हैं, कभी रीसायकल नहीं होते, और किसी भी अन्य element की तरह reactive हैं।

<a id="columns-and-grids"></a>

## कॉलम और ग्रिड

`numColumns` (`.columns(n)`) आइटम को उतने कॉलम वाली पंक्तियों में सजाता है। कंटेंट padding कंटेंट के चारों ओर जाती है, और पंक्तियों और कॉलमों के बीच gaps होते हैं। ग्रिड की पंक्तियों की ऊँचाई अलग-अलग हो सकती है: हर पंक्ति अपने सबसे ऊँचे आइटम जितनी ऊँची होती है।

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## स्टिकी हेडर

`stickyHeaderIndices` उन आइटम की सूची देता है जो कंटेंट के उनके पार स्क्रॉल होने पर व्यूपोर्ट के ऊपर चिपके रहते हैं, जब तक अगला स्टिकी आइटम उन्हें बाहर न धकेल दे। सेक्शन हेडर और पंक्ति आइटम की एक ही लिस्ट होते हैं; हेडर के इंडेक्स चिपकते हैं। पिनिंग हर स्क्रॉल फ़्रेम पर नेटिव तरीके से होती है।

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

क्योंकि एक सेल अभी हेडर और बाद में नाम दिखा सकता है, पंक्ति तय करती है कि क्या रेंडर करना है, [`when` / `<If>`](../elements/control-flow.md) से, जो पंक्ति बदलने पर स्विच होता है। स्टिकी हेडर के लिए एक कॉलम और inverted न होने वाली लिस्ट चाहिए।

`stickyHeaderOffset` (Rust में `.sticky_header_offset(..)`) हेडर को ऊपर से उतने पॉइंट नीचे चिपकाता है, जैसा CSS `position: sticky` का `top` करता है: 56 पॉइंट ऊँची पारदर्शी बार के नीचे, `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) हर हेडर को बार के नीचे रखता है जबकि पंक्तियाँ उसके नीचे स्क्रॉल होती रहती हैं, और अगला हेडर उसे वहीं से बाहर धकेलता है। नकारात्मक ऑफ़सेट हेडर के एक हिस्से को दृश्य से बाहर छोड़ देता है।

ऑफ़सेट एक [animated value](./animation.md#animated-values) हो सकता है (Rust में `.bind_sticky_header_offset(&node)`): हेडर UI थ्रेड पर हर फ़्रेम में उसका अनुसरण करते हैं, इसलिए वे हिलती हुई बार के नीचे बने रहते हैं। ऐसी बार के साथ जो कंटेंट नीचे स्क्रॉल होने पर छिप जाती है और ऊपर स्क्रॉल होने पर लौट आती है ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), हेडर उसके निचले किनारे पर चिपकते हैं, वह जहाँ भी हो:

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## चैट: inverted लिस्ट

`inverted` लिस्ट को अंत से सजाता है: आइटम 0 नीचे होता है, लिस्ट अंत तक स्क्रॉल होकर शुरू होती है, और आइटम बदलने पर वह अंत से अपनी दूरी बनाए रखती है। सबसे नया संदेश पहले रखें; एक जोड़ने के लिए शुरुआत में जोड़ें, पुराने लोड करने के लिए `onLoadMore` से अंत में जोड़ें (inverted लिस्ट का "अंत" ऊपर होता है)। किसी पुराने संदेश पर खुली चैट नए संदेशों को [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart) से लोड करती है; इसके साथ, लिस्ट नीचे रहने पर नीचे से अपनी दूरी बनाए रखती है और ऊपर स्क्रॉल होने पर स्क्रीन पर दिख रहे संदेशों को अपनी जगह पर रखती है।

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <List
        each={messages()}
        inverted
        estimatedItemSize={44}
        style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 6 }}
        keyboardDismissMode="interactive"
        onLoadMore={loadOlder}
        loadMoreThreshold={0.5}
      >
        {(m) => (
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

inverted लिस्ट पर `scroll_to_end(..)` / `scrollToEnd()` उसकी शुरुआत तक स्क्रॉल करता है: सबसे नया संदेश।

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### inverted न होने वाली लिस्ट के अंत का अनुसरण करना

पढ़ने के क्रम वाली लिस्ट (सबसे पुराना पहले) भी अपने अंत का अनुसरण कर सकती है: Rust में `.follow_end(px(40.0))` या TSX में `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` के साथ, जब तक उपयोगकर्ता अंत पर है (या उससे 40 पॉइंट के भीतर), कंटेंट बढ़ने पर लिस्ट अंत पर बनी रहती है: आखिरी आइटम में स्ट्रीम होता जवाब, जोड़ा गया नया संदेश, लिस्ट को छोटा करता कीबोर्ड। और ऊपर स्क्रॉल होने पर, दिखता कंटेंट अपनी जगह पर रहता है और नया कंटेंट उसके नीचे बढ़ता है। दिखते आइटम के ऊपर जोड़े गए आइटम उन्हें कभी नहीं हिलाते, इस विकल्प के साथ या उसके बिना।

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## हॉरिज़ॉन्टल लिस्ट

`horizontal` लिस्ट को बगल की ओर घुमा देता है; सेल लिस्ट की ऊँचाई पर सजाए जाते हैं। स्नैपिंग के साथ मिलकर यह किसी भी लंबाई का कैरोसेल बनाता है:

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

दाएँ से बाएँ (right to left) में, हॉरिज़ॉन्टल लिस्ट दाईं ओर से शुरू होती हैं और बाईं ओर चलती हैं।

<a id="lists-in-a-page-viewportparent"></a>

## पेज में लिस्ट: viewport="parent"

अक्सर एक पेज एक इकाई के रूप में स्क्रॉल होता है: एक हेडर, कुछ कार्ड, फिर एक लंबी लिस्ट, और शायद उसके नीचे एक और लिस्ट। लिस्ट को `viewport="parent"` (Rust में `.viewport(ListViewport::Parent)`) दें और उसे पेज के बाकी हिस्से के साथ `Scroll` में रखें: लिस्ट पेज में अपनी पूरी लंबाई में रहती है, और पेज का स्क्रॉल व्यू उसे बाकी सब के साथ स्क्रॉल करता है। वह फिर भी केवल पेज के व्यूपोर्ट के पास की पंक्तियाँ बनाती है और उनके सेल रीसायकल करती है, इसलिए एक पेज में कई लंबी लिस्ट हो सकती हैं।

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- लिस्ट उतनी ही लंबी होती है जितनी उसकी पंक्तियाँ: उसकी ऊँचाई (बगल की ओर हो तो चौड़ाई) उसके कंटेंट से आती है, जैसे किसी व्यू की, और उसकी padding, border और margins व्यू की तरह काम करते हैं।
- उसकी पंक्तियाँ अपनी धुरी के साथ अपने आसपास के निकटतम स्क्रॉल व्यू का, या जिस स्क्रीन पर वह है उसका, अनुसरण करती हैं।
- पेज वह जगह बनाए रखता है जो आप पढ़ रहे हैं, जैसा ब्राउज़र करता है: जो पंक्तियाँ पूरी तरह व्यूपोर्ट के ऊपर रहकर साइज़ बदलती हैं वे पेज को उतना ही हिलाती हैं; जब तक लिस्ट की शुरुआत दृश्य में है, बढ़ने वाली पंक्तियाँ अपने नीचे की चीज़ों को नीचे धकेलती हैं।
- `scrollToIndex`, `scrollToEnd` और `initialScrollIndex` पेज को लिस्ट की पंक्तियों तक स्क्रॉल करते हैं, पेज के कंटेंट के भीतर; `onLoadMore` तब चलता है जब लिस्ट का अंत व्यूपोर्ट के पास आता है, और `onViewableItemsChange` पेज के व्यूपोर्ट की पंक्तियों की रिपोर्ट देता है।
- `stickyHeaderIndices` और `stickyHeaderOffset` पंक्तियों को पेज के ऊपर चिपकाते हैं: सेक्शन हेडर ऊपर रहता है जबकि उसकी पंक्तियाँ उसके नीचे स्क्रॉल होती हैं, जब तक अगला उसे बाहर न धकेल दे, और आखिरी हेडर अपनी लिस्ट के अंत के साथ चला जाता है।
- पेज कैसे स्क्रॉल होता है, यह उसके स्क्रॉल व्यू पर निर्भर है: `Scroll` पर `onScroll` और अन्य स्क्रॉल इवेंट, `scrollValue`, `refreshing` / `onRefresh`, paging और snapping, `contentInset`, `scrollbar`, `scrollable` और `keyboardDismissMode` सेट करें। Inverted लिस्ट और `maintainVisibleContentPosition` अपने व्यूपोर्ट वाली लिस्ट (`viewport="own"`, डिफ़ॉल्ट) की सुविधाएँ हैं।
- व्यूपोर्ट लिस्ट बनाते समय चुना जाता है: बदलने के लिए नई लिस्ट रेंडर करें।

<a id="loading-more-onloadmore"></a>

## और लोड करना: onLoadMore

`onLoadMore` (`.on_load_more(..)`) तब चलता है जब व्यूपोर्ट अंत के `loadMoreThreshold` व्यूपोर्ट के भीतर आता है (डिफ़ॉल्ट 1: एक स्क्रीन आगे)। अगला पेज जोड़ें; जब नया अंत पास आता है तो लिस्ट फिर चलती है।

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

ऊपर की तरह overlapping लोड से बचाव करें: पेज आने के दौरान अंत की रिपोर्ट दोबारा हो सकती है।
<a id="loading-at-the-start-onloadmoreatstart"></a>

## शुरुआत में लोड करना: onLoadMoreAtStart

एक सूची अपने डेटा के बीच से भी खुल सकती है: किसी पुराने मैसेज पर खुली चैट (खोज का परिणाम, किसी रिप्लाई का कोट) उसके आसपास का एक पेज दिखाती है, जबकि नए मैसेज अभी लोड होने बाकी होते हैं। `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) तब चलता है जब व्यूपोर्ट शुरुआत के `loadMoreAtStartThreshold` व्यूपोर्ट के भीतर आ जाता है (डिफ़ॉल्ट रूप से 1), यानी आइटम 0 वाली तरफ़: सामान्य सूची में ऊपर, उलटी (inverted) सूची में नीचे। पेज को शुरुआत में जोड़ें (prepend): पेज के अपने सामने आने पर भी स्क्रीन पर दिख रही पंक्तियाँ अपनी जगह पर बनी रहती हैं (उलटी सूची में भी, जब वह अपने निचले सिरे से दूर स्क्रॉल हो चुकी हो), और सूची अगली बार शुरुआत के पास पहुँचने पर फिर से चलती है, या तुरंत चलती है यदि पेज आने के बाद भी वह शुरुआत के पास ही हो।

यह तब चलता है जब उपयोगकर्ता वहाँ तक स्क्रॉल करता है या कोई स्क्रॉल कमांड सूची को वहाँ ले जाती है (`initialScrollIndex` सहित), इसलिए जो सूची अपने सबसे नए आइटम पर खुलती है वह कुछ नहीं माँगती, और जो `initialScrollIndex` से अपनी शुरुआत के पास खुलती है वह उससे पहले का पेज तुरंत माँग लेती है।

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

सबसे नया मैसेज आ जाने के बाद लोड करना बंद कर दें: नए मैसेज फिर किसी भी चैट की तरह शुरुआत में आते हैं।

## Viewability

`onViewableItemsChange` (`.on_viewable_items_change(..)`) बताता है कि कौन-से आइटम स्क्रीन पर हैं, जिसका उपयोग एनालिटिक्स, दिख रहे वीडियो को अपने-आप चलाने, या मैसेज को पढ़ा हुआ चिह्नित करने के लिए होता है। TSX में इसे `{ viewableItems, changed }` मिलता है, यानी टोकन `{ item, key, index, isViewable }` के ऐरे; Rust में `ViewableItems` मिलता है, जिसमें पहली और आख़िरी viewable पंक्ति (`viewable`) और वे पंक्तियाँ होती हैं जिनकी स्थिति बदली (`changed()`)। Viewability की गणना नेटिव स्तर पर होती है; आपके कोड को केवल बदलावों की सूचना मिलती है।

| `viewabilityConfig` | Rust | विवरण |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | किसी आइटम का कितना हिस्सा दिखना चाहिए, 0 से 1 तक। |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | किसी आइटम को व्यूपोर्ट का कितना हिस्सा कवर करना चाहिए, 0 से 1 तक। |
| `minimumViewTime` | `.minimum_view_time(Duration)` | रिपोर्ट किए जाने से पहले आइटम को कितने मिलीसेकंड तक viewable रहना चाहिए। |

थ्रेशोल्ड न देने पर, दिखने वाला कोई भी पिक्सेल गिना जाता है।

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## कोड से स्क्रॉल करना

सूची को एक ref दें (Rust में `element_ref()` और `.element_ref(&list)`, TSX में `ref`):

| Rust | TSX | विवरण |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | आइटम `index` को दृश्य में स्क्रॉल करता है। View position उसकी जगह तय करती है: 0 व्यूपोर्ट की शुरुआत में (डिफ़ॉल्ट), 0.5 बीच में, 1 अंत में; view offset उसे और खिसकाता है। |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | सूची की अक्ष के अनुदिश किसी कंटेंट ऑफ़सेट तक स्क्रॉल करता है। |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | कंटेंट के अंत तक स्क्रॉल करता है (उलटी सूची में शुरुआत तक)। |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | किसी ऑफ़सेट तक स्क्रॉल करता है, जैसे स्क्रॉल व्यू पर। |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

किसी इंडेक्स तक (और अंत तक) स्क्रॉल करना नेटिव स्तर पर उसी क्षण ज्ञात आकारों से तय होता है: जहाँ पंक्तियाँ मापी जा चुकी हैं वहाँ मापे गए आकार, और बाकी जगह अनुमानित आकार। इसके बाद सूची अपने लक्ष्य का पीछा करती है जब तक आसपास की पंक्तियाँ मापी जाती हैं, इसलिए वह ठीक जगह पर पहुँचती है, जब तक कि उपयोगकर्ता स्क्रॉल न करे या आइटम न बदलें। किसी आइटम पर सूची खोलने के लिए, पहले फ़्रेम के बाद स्क्रॉल करने के बजाय `initialScrollIndex` (`.initial_scroll_index(..)`) का उपयोग करें।

<a id="a-settings-style-list"></a>

## सेटिंग्स-शैली की सूची

सूची का रूप-रंग ऐप का अपना होता है: सूची पंक्तियों को रखती और रीसायकल करती है, और पंक्तियाँ, डिवाइडर और सतहें आपके अपने व्यू हैं। ग्रुप की हुई, सेटिंग्स-शैली की सूची वह सूची है जिसमें पैडिंग, एक सेपरेटर, और गोल कोनों वाली पहली व अंतिम पंक्तियाँ हों। इसे अपना एक कंपोनेंट बनाएँ और ऐप में जहाँ भी सेटिंग्स की सूची दिखानी हो, उसका उपयोग करें:

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## प्रदर्शन संबंधी नोट्स

- हर सेल का लेआउट अलग से होता है, इसलिए स्क्रॉल करते समय केवल बदले हुए सेल का लेआउट होता है। पंक्तियों को उथला (shallow) रखें और उन पंक्तियों में सिग्नल पढ़ने से बचें जो हर फ़्रेम में बदलती हैं।
- नेटिव पक्ष सेल बैचों में माँगता है, प्रति फ़्रेम कई राउंड तक, जिन्हें एक ही अपडेट में मिला दिया जाता है; तेज़ फ़्लिंग एक फ़्रेम में कई सेल बाइंड कर देती है, बिना प्रत्येक सेल के लिए आपके कोड में कॉल किए। Rust की पंक्तियाँ कोर में ही, उसी कमिट के भीतर बाइंड होती हैं जिसे उनकी ज़रूरत होती है।
- अपनी पंक्तियों की प्रति-फ़्रेम लागत मापने के लिए [`nsh test --trace` को `scroll` स्टेप के साथ](./testing-and-trace.md#scrolling) उपयोग करें।

<a id="related"></a>

## संबंधित

- [`List` एलिमेंट](../elements/list.md): संदर्भ।
- [Scrolling](./scrolling.md): वे स्क्रॉलिंग props जो सूचियाँ स्क्रॉल व्यू के साथ साझा करती हैं।
- [Reactivity](./reactivity.md): पंक्तियाँ अपनी स्थिति बाइंडिंग में क्यों पढ़ती हैं।
- [Performance](./performance.md): सूचियों को मापना।
