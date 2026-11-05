---
title: "List"
description: "वर्चुअलाइज़्ड, रीसाइक्लिंग करने वाली लिस्ट: पंक्तियाँ, कॉलम, स्टिकी हेडर, उलटी (inverted) चैट लिस्ट, व्यूएबिलिटी और आइटम तक स्क्रॉल करना।"
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# List

`List` लंबा या असीमित डेटा दिखाता है। केवल व्यूपोर्ट के पास की पंक्तियाँ (rows) मौजूद रहती हैं: जैसे-जैसे उपयोगकर्ता स्क्रॉल करता है, बाहर जाने वाली पंक्तियाँ रीसाइकल होकर अंदर आने वाली पंक्तियों के काम आती हैं। कौन-सी पंक्तियाँ मौजूद हैं, उनकी स्थिति, कॉलम, sticky हेडर और viewability, यह सब नेटिव रूप से कंप्यूट होता है, इसलिए हज़ारों आइटम वाली सूची को स्क्रॉल करने की लागत बीस आइटम वाली सूची जितनी ही होती है। Rust में इसे `virtual_list(count, |at| row)` से बनाया जाता है, और TSX में `nsh` से `<List>` द्वारा।

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

TSX में `List` जेनेरिक है: `List<T>` जाँचता है कि `each` और row function आइटम के type पर एकमत हैं, जिसे TypeScript `each` से अनुमानित करता है ([List API](../modules/nsh-list.md) देखें)। Rust में `virtual_list` पंक्तियों की संख्या लेता है (एक value, एक signal या एक closure: सूची अपनी जगह पर बढ़ती और घटती है) और वह function लेता है जो `Position` पर पंक्ति बनाता है; पंक्तियाँ component का डेटा `at.index()` से पढ़ती हैं।

छोटी सूची के लिए, जिसकी सभी पंक्तियाँ मौजूद रहनी चाहिए (settings पेज, फ़ॉर्म), [scroll view](./scroll.md) के भीतर [`Each`](./control-flow.md) अधिक सरल है। grouped table की तरह सजाई गई सूची के लिए [settings-style list](../docs/lists.md#a-settings-style-list) देखें। [lists guide](../docs/lists.md) में patterns दिए गए हैं: infinite loading, chat, sections।

<a id="rows-are-recycled"></a>

## पंक्तियाँ रीसाइकल होती हैं

Row function हर आइटम के लिए नहीं, बल्कि हर cell के लिए एक बार चलता है। जब किसी cell को दूसरे आइटम के लिए दोबारा इस्तेमाल किया जाता है, तो उसकी स्थिति बदल जाती है (TSX: `item()` और `index()` accessors; Rust: `at.index()`) और उसे पढ़ने वाली हर चीज़ अपडेट हो जाती है:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

इसलिए हर आइटम की state को अपने डेटा में रखें (id के अनुसार), न कि row function के अंदर बनाए गए signals में: ऐसा signal cell के साथ रहता है और किसी दूसरे आइटम पर दिखने लगता है।

अपने अगले आइटम की प्रतीक्षा कर रहे cells तब छिपा दिए जाते हैं जब उनकी पंक्ति जा चुकी हो या कोई दूसरा cell उसे दिखा रहा हो, ताकि screen readers, touches और UI tests को हर पंक्ति एक ही बार मिले।

## Props

| Prop | Rust | Type | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | आइटम। |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | एक पंक्ति रेंडर करता है। |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | अभी तक न नापे गए आइटमों का आकार, points में। सटीक अनुमान स्क्रॉल बार को स्थिर रखते हैं। |
| `horizontal` | `.horizontal()` | `boolean` | `false` | बगल की ओर स्क्रॉल करता है। |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: सूची अपने ही scroll view में स्क्रॉल होती है। `"parent"`: वह अपने parent के लेआउट में अपनी पूरी लंबाई में रहती है और अपने आस-पास के scroll view के व्यूपोर्ट के पास की पंक्तियाँ रेंडर करती है; वही scroll view उसे बाकी पेज के साथ स्क्रॉल करता है ([पेज में lists](../docs/lists.md#lists-in-a-page-viewportparent) देखें)। सूची बनाते समय चुना जाता है। |
| `numColumns` | `.columns(n)` | `number` | `1` | प्रति पंक्ति आइटम (vertical lists)। |
| `inverted` | `.inverted()` | `boolean` | `false` | अंत से लेआउट होती है, आइटम 0 सबसे अंत में (chat style): अंत तक स्क्रॉल होकर शुरू होती है और सामग्री बदलने पर अंत से अपनी दूरी बनाए रखती है। |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | inverted न होने वाली सूचियों के लिए: सामग्री के अंत पर, या उससे इतने points के भीतर, सामग्री बढ़ने या व्यूपोर्ट घटने पर सूची अंत पर ही रहती है; और ऊपर स्क्रॉल होने पर दिखती हुई सामग्री अपनी जगह रहती है। |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | वे आइटम जो स्क्रॉल होकर आगे निकल जाने पर शुरुआत से चिपके रहते हैं (एक कॉलम, inverted नहीं)। |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | सामग्री की padding और gaps, points में: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`। |
| `contentClass` | | `string` | | सामग्री की padding और gaps classes के रूप में (`p-*`, `gap-*`); `contentStyle` इन पर भारी पड़ता है। |
| `header` | `.header(el)` | `ListSlot` | | आइटमों से पहले: एक component (`Header`) या एक element (`<Header />`)। |
| `footer` | `.footer(el)` | `ListSlot` | | आइटमों के बाद। |
| `empty` | `.empty(el)` | `ListSlot` | | `each` के खाली होने पर आइटमों की जगह दिखता है। |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | आइटमों के बीच (एक कॉलम)। |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | पहले फ़्रेम से पहले इस आइटम तक स्क्रॉल करता है। |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` या index | viewability tokens में आइटम की key। Rust में, पंक्तियों की पहचान, ताकि उनसे पहले की पंक्तियाँ आने-जाने पर भी पंक्तियाँ अपने cells और sizes बनाए रखें। |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | अंत पास है: और लोड करें। |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | अंत से कितना पास (viewports में) होने पर `onLoadMore` चलता है। |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | शुरुआत पास है, उपयोगकर्ता या किसी scroll command द्वारा सूची हिलाए जाने के बाद: पहले आइटम से पहले का डेटा लोड करें। |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | शुरुआत से कितना पास (viewports में) होने पर `onLoadMoreAtStart` चलता है। |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | आइटम viewable हुए या viewable नहीं रहे। |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | आइटम कब viewable माने जाते हैं (नीचे)। |
| `refreshing` | `.refreshing(..)` | `boolean` | | pull-to-refresh spinner दिखता है। |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | उपयोगकर्ता ने refresh करने के लिए नीचे खींचा। |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | ऐप अपना indicator खुद बनाता है, `height` points ऊँचा: platform का spinner छिपा रहता है, खींचने पर `height` तक पहुँचते ही refresh होता है, और refresh के दौरान सामग्री के ऊपर `height` जगह बनी रहती है। 0 या उससे कम ऊँचाई का मतलब है कि कोई indicator नहीं। |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | एक animated value, जिसमें यह मान भरा जाता है कि सूची को उसके शीर्ष से आगे कितना खींचा गया है (विश्राम में 0, खिंचाव के साथ बढ़ता है; refresh के दौरान सामग्री के ऊपर रखी जगह: `height` के साथ `refreshIndicator`), ऐप के indicator के लिए। |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | scroll indicator दिखता है: platform का, या ऐप द्वारा theme सेट करने पर ऐप का [built-in bar](./scrollbar.md#built-in-bars); object का मतलब है view की अपनी theme। डेस्कटॉप और desktop browsers में horizontal view इसे बनाए रखता है: यही माउस का scroll bar है। |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | scroll offset से भरा जाने वाला animated value, scroll-linked animations के लिए। |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | क्या खींचने (drag) से keyboard बंद होता है। |
| `style` | `Styled` methods | `StyleProp<ViewStyle>` | | सूची की अपनी style (इसे सीमित आकार चाहिए: `flex: 1` या height)। |
| `testID` | `.test_id(id)` | `string` | | वह id जिससे UI tests सूची का scroll view ढूँढते हैं (`nsh test` का `id:`, XCUITest, UI Automator)। |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | सूची का ref ([ref methods](#ref-methods) देखें)। |

Lists [`Scroll`](./scroll.md#scrolling) के scrolling props भी लेती हैं (Rust में `Scrollable` methods):
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` और `scrollable`।
Lists अपना scale बनाए रखती हैं।

हर element जो props लेता है ([common props](./index.md#common-props)) वे जस के तस सूची के scroll view तक पहुँचते हैं:
`testID`, `accessibilityLabel` और अन्य accessibility props, styles, `onLayout`, touch और responder props।
UI tests सूची को उसके `testID` से वैसे ही ढूँढते हैं जैसे किसी भी view को।

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` और `.minimum_view_time(..)`):

| Field | Type | विवरण |
|---|---|---|
| `itemVisibleThreshold` | `number` | आइटम का कितना हिस्सा दिखना चाहिए, 0 से 1 तक। |
| `viewAreaCoverageThreshold` | `number` | आइटम को व्यूपोर्ट का कितना हिस्सा घेरना चाहिए, 0 से 1 तक। दोनों में से कोई भी threshold न होने पर कोई भी दिखता हुआ pixel गिना जाता है। |
| `minimumViewTime` | `number` | रिपोर्ट होने से पहले आइटमों को कितने मिलीसेकंड viewable बने रहना चाहिए। |

`ViewToken<T>` है `{ item, key, index, isViewable }`। Rust के listener को `ViewableItems` मिलता है: `indices()` viewable पंक्तियों की range है, `changed()` वे पंक्तियाँ हैं जो आईं या गईं।

## Events

| Event | Rust | Payload | कब |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | offset बदला। |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | खींचना (drag) शुरू हुआ / रुका। |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | glide शुरू हुआ / रुका। |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | स्क्रॉल रुक गया। |
| `onLoadMore` | `.on_load_more` | कोई नहीं | अंत से `loadMoreThreshold` viewports के भीतर। |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | कोई नहीं | शुरुआत से `loadMoreAtStartThreshold` viewports के भीतर, स्क्रॉल के बाद हर बार पास आने पर एक बार। |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | viewability बदली। |
| `onRefresh` | `.on_refresh` | कोई नहीं | refresh के लिए खींचा गया। |

## Ref methods

| Method | Rust | विवरण |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | आइटम `index` को दृश्य में स्क्रॉल करता है। `viewPosition` उसकी जगह तय करता है: 0 व्यूपोर्ट की शुरुआत में (डिफ़ॉल्ट), 0.5 बीच में, 1 अंत में; `viewOffset` उसे और खिसकाता है। मौजूदा (नापे गए या अनुमानित) आइटम आकारों के साथ नेटिव रूप से हल होता है। |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | सूची के axis के अनुदिश किसी offset तक स्क्रॉल करता है। |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | सामग्री के अंत तक स्क्रॉल करता है (inverted सूची में शुरुआत तक)। |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | किसी offset तक स्क्रॉल करता है। |

<a id="examples"></a>

## उदाहरण

हेडर और viewability वाला एक grid:

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

एक chat:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

आइटम 0 सबसे नया संदेश है, जो नीचे दिखता है; items के आगे जोड़े गए नए संदेश बिना उस चीज़ को हिलाए दिखते हैं जिसे उपयोगकर्ता पढ़ रहा है।

<a id="platform-notes"></a>

## Platform नोट्स

- दिखती हुई पंक्तियों के ऊपर आइटम जोड़ने पर दोनों platforms पर दिखती हुई पंक्तियाँ अपनी जगह रहती हैं।
- right-to-left लेआउट में horizontal lists नेटिव रूप से mirror होती हैं।
- Sticky हेडर हर scroll frame पर नेटिव रूप से pin किए जाते हैं।
