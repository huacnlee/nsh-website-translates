---
title: "List"
description: "List, नेटिव स्क्रॉल व्यू पर बना एक वर्चुअलाइज़्ड और रीसाइकलिंग लिस्ट कॉम्पोनेंट, इसके सभी props, events और ref मेथड के साथ।"
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`nsh` `List` export करता है: नेटिव स्क्रॉल व्यू पर बनी एक virtualized list। केवल viewport के पास की rows मौजूद रहती हैं, और स्क्रॉल करते समय उनके cells दोबारा उपयोग किए जाते हैं। कौन-सी rows मौजूद हैं, वे कहाँ हैं, columns, sticky headers और viewability, यह सब नेटिव रूप से कैलकुलेट होता है। इसलिए दस हज़ार items की list स्क्रॉल करने पर कोई JS नहीं चलता, सिर्फ़ वे row bindings चलती हैं जो cell के दोबारा उपयोग होने पर बदलती हैं।

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

गाइड के लिए [Lists](../docs/lists.md) और इस element के props के लिए [`<List>`](../elements/list.md) देखें।

<a id="list-1"></a>

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### Rows का पुनः उपयोग

`children` एक function है जो **एक cell** को render करता है। यह प्रति item नहीं, बल्कि प्रति cell एक बार चलता है: जब कोई cell दृश्य से बाहर स्क्रॉल हो जाता है तो उसे किसी दूसरे item के लिए दोबारा उपयोग किया जाता है, और `item()` तथा `index()` (दोनों accessors) बदल जाते हैं। इन्हें JSX expressions (`{item().name}`) के अंदर पढ़ें, ताकि cell के दोबारा उपयोग होने पर वह अपडेट हो।

> [!WARNING]
> Row function के अंदर बनाए गए signals में प्रति-item state न रखें: cell को दूसरे items के लिए दोबारा उपयोग किया जाता है, इसलिए signal item के साथ नहीं, cell के साथ चलेगा। इसे अपने data में id के आधार पर रखें (उदाहरण के लिए, चुने गए ids के `Set` को रखने वाला एक signal)।

## Props

`ListProps<T>` list के अपने props को `<Scroll>` के साथ साझा किए जाने वाले scrolling props और हर element द्वारा लिए जाने वाले props के साथ जोड़ता है, जो list के scroll view को जाते हैं।

<a id="data-and-rendering"></a>

### Data और rendering

| Prop | Type | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `each` | `readonly T[]` | (आवश्यक) | Items। बदलावों को फ़ॉलो करने के लिए signal की value (`each={items()}`) पास करें; दिखाई दे रही rows के ऊपर items जोड़ने पर वे rows अपनी जगह पर बनी रहती हैं। |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (आवश्यक) | एक row को render करता है (ऊपर देखें)। |
| `estimatedItemSize` | `number` | `50` | उन rows का आकार जिन्हें अभी मापा नहीं गया है, points में, list की axis के अनुदिश। सटीक अनुमान scroll indicator और `scrollToIndex` को अधिक सटीक बनाते हैं। |
| `numColumns` | `number` | `1` | प्रति row items की संख्या (vertical lists): एक grid। |
| `horizontal` | `boolean` | `false` | बगल की ओर (horizontally) स्क्रॉल करती है। |
| `inverted` | `boolean` | `false` | अंत से layout करती है, item 0 सबसे आख़िर में (chat style); अंत तक स्क्रॉल हुई स्थिति से शुरू होती है और content बदलने पर अंत से अपनी दूरी बनाए रखती है। |
| `stickyHeaderIndices` | `number[]` | | वे items जो स्क्रॉल होकर आगे निकल जाने पर शुरुआत पर चिपके रहते हैं (एक column, inverted नहीं)। |
| `header` | `ListSlot` | | Items से पहले render होता है। |
| `footer` | `ListSlot` | | Items के बाद render होता है। |
| `empty` | `ListSlot` | | जब `each` खाली हो तब items के बदले दिखाया जाता है। |
| `separator` | `ListSlot` | | Items के बीच render होता है (एक column)। |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id`, या index | Viewability tokens में किसी item की key। |
| `initialScrollIndex` | `number` | | पहले frame से पहले इस item तक स्क्रॉल करती है। |
| `contentStyle` | `ListContentStyle` | | Content की padding और gaps: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (numbers)। |
| `contentClass` | `string` | | Content की padding और gaps classes के रूप में (`p-*`, `gap-*`); `contentStyle` इन पर प्राथमिकता पाता है। |
| `style` | `StyleProp<ViewStyle>` | | List की अपनी style (इसे एक आकार दें: `flex: 1` या height)। |
| `testID` | `string` | | वह id जिससे UI tests list का scroll view खोजते हैं (`nsh test` का `id:`, XCUITest, UI Automator)। |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | [ref methods](#ref-methods) देखें। |

`ListSlot` एक component (`Header`) या एक element (`<Header />`) होता है।

<a id="loading-refreshing-and-viewability"></a>

### Loading, refreshing और viewability

| Prop | Type | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `onLoadMore` | `() => void` | | तब call होता है जब अंत `loadMoreThreshold` viewports के भीतर आ जाता है: और load करें। |
| `loadMoreThreshold` | `number` | `1` | `onLoadMore` अंत के कितना पास (viewport लंबाइयों में) fire होता है। |
| `onLoadMoreAtStart` | `() => void` | | तब call होता है जब user या किसी scroll command द्वारा list को हिलाए जाने के बाद शुरुआत `loadMoreAtStartThreshold` viewports के भीतर आ जाती है: पहले item से पहले का data load करें। |
| `loadMoreAtStartThreshold` | `number` | `1` | `onLoadMoreAtStart` शुरुआत के कितना पास (viewport लंबाइयों में) fire होता है। |
| `refreshing` | `boolean` | | Pull-to-refresh spinner दिखता है। |
| `onRefresh` | `() => void` | | Pull to refresh चालू करता है; load करते समय `refreshing` सेट करें। |
| `refreshIndicator` | `{ height: number }` | | ऐप spinner की जगह अपना खुद का pull-to-refresh indicator बनाता है, जिसकी ऊँचाई `height` होती है। |
| `pullValue` | `AnimatedValue` | | उस indicator के लिए, list को उसके top से कितना नीचे खींचा गया है, यह मान इसमें भेजा जाता है। |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | वे items जो viewable हुए या viewable नहीं रहे। |
| `viewabilityConfig` | `ViewabilityConfig` | | कोई item कब viewable माना जाता है। |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

### Scrolling

| Prop | Type | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | Scroll indicator दिखता है: platform का, या ऐप का [built-in bar](../elements/scrollbar.md#built-in-bars); object व्यू के अपने indicator का theme होता है। |
| `scrollable` | `boolean` | `true` | User इसे स्क्रॉल कर सकता है। |
| `bounces` | `boolean` | `true` | किनारों से आगे Overscroll। |
| `pagingEnabled` | `boolean` | `false` | Viewport के गुणकों पर रुकती है। |
| `snapToInterval` | `number` | `0` | इस लंबाई के गुणकों पर रुकती है (0: बंद)। |
| `snapToOffsets` | `number[]` | | इन offsets पर रुकती है। |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | `snapToInterval` के साथ item का कौन-सा बिंदु viewport से align होता है। |
| `disableIntervalMomentum` | `boolean` | `false` | एक fling अधिकतम एक snap point तक ही जाती है। |
| `decelerationRate` | `"normal" \| "fast" \| number` | platform | Fling कितनी तेज़ी से धीमी होती है (`0.998` / `0.99`, या प्रति millisecond बची रहने वाली velocity)। |
| `contentInset` | `Partial<Edges>` | | Content के चारों ओर जगह। |
| `contentOffset` | `{ x?, y? }` | | यह कहाँ से शुरू होती है। |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | क्या tap करने से keyboard बंद होता है (`"never"`: tap केवल keyboard को बंद करता है)। |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | क्या drag करने से keyboard बंद होता है। |
| `scrollEventThrottle` | `number` | | `onScroll` events के बीच न्यूनतम milliseconds (वैसे भी प्रति frame अधिकतम एक)। |
| `scrollValue` | `AnimatedValue` | | एक [animated value](./nsh.md#animation) जिसमें UI thread पर scroll offset (मुख्य axis) भेजा जाता है, scroll-linked effects के लिए। |

### Scroll events

| Event | Payload | कब |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | स्क्रॉल करते समय। |
| `onScrollDragStart` | `{ offset }` | Drag शुरू होता है। |
| `onScrollDragEnd` | `{ offset }` | उँगली उठती है। |
| `onMomentumStart` | `{ offset }` | Drag के बाद glide शुरू होती है। |
| `onMomentumEnd` | `{ offset }` | Glide समाप्त होती है (नया drag उसे पकड़ ले तब भी)। |
| `onScrollEnd` | `{ offset }` | Scrolling थमकर रुक गई। |

Lists हर element द्वारा लिए जाने वाले props ([common props](../elements/index.md)) भी लेती हैं।

## Ref methods

List का `ref` एक `ListRef` प्राप्त करता है, जिसमें `ViewRef` के methods के अलावा ये methods होते हैं:

| Method | विवरण |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Item `index` को दृश्य में स्क्रॉल करता है। `viewPosition` उसकी स्थिति तय करता है: `0` viewport की शुरुआत में (डिफ़ॉल्ट), `0.5` बीच में, `1` अंत में; `viewOffset` उसे और आगे खिसकाता है। मापे गए (या अनुमानित) row आकारों के साथ नेटिव रूप से हल किया जाता है। |
| `scrollToOffset({ offset, animated? })` | List की axis के अनुदिश किसी content offset तक स्क्रॉल करता है। |
| `scrollToEnd({ animated? })` | Content के अंत तक स्क्रॉल करता है (inverted list में शुरुआत तक)। |
| `scrollTo({ x?, y?, animated? })` | किसी offset तक स्क्रॉल करता है। |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

## Examples

एक chat: सबसे नया संदेश सबसे नीचे, ऊपर स्क्रॉल करने पर पुराने संदेश load होते हैं।

```tsx
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
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

Pull to refresh:

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

`ListProps` का data-और-rows वाला आधा हिस्सा: यह वह है जो आप अपने खुद के component को पास करते हैं जो list का layout स्वयं करता है, जैसे कोई settings list जो `List` को अपनी padding और dividers के साथ wrap करती है।
