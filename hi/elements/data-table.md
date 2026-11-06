---
title: "DataTable"
description: "DataTable कंपोनेंट: पंक्तियों और स्तंभों की एक तालिका, जो किसी भी संख्या की पंक्तियों और स्तंभों पर दोनों दिशाओं में स्क्रॉल होती है। इसमें fixed, resizable, movable और sortable स्तंभ, पंक्ति, स्तंभ और सेल का चयन, ऐसी पंक्तियाँ जिन्हें ऐप एक बार में एक पेज के रूप में उपलब्ध कराता है, समूह लेबल, कीबोर्ड नेविगेशन और ऐसे सेल शामिल हैं जिन्हें ऐप स्वयं ड्रा करता है।"
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` स्प्रेडशीट की तरह पंक्तियाँ और कॉलम दिखाता है और किसी भी संख्या की पंक्तियों और कॉलमों पर दोनों दिशाओं में स्क्रॉल होता है। केवल दिखाई देने वाले सेल बनाए जाते हैं, इसलिए दस लाख पंक्तियों और दस हज़ार कॉलमों वाली टेबल भी छोटी टेबल की तरह ही स्क्रॉल होती है। पंक्तियाँ, कॉलम या सेल पॉइंटर और कीबोर्ड से चुने जा सकते हैं। कॉलमों की चौड़ाई तय होती है, वे अपने किनारे को खींचने पर आकार बदलते हैं, अपने शीर्षक को खींचने पर खिसकते हैं, बाकी कॉलमों के स्क्रॉल होने पर भी बाईं ओर टिके रहते हैं, और सॉर्ट होते हैं। शीर्षक समूह लेबलों के नीचे रखे जा सकते हैं, और किसी सेल या शीर्षक को ऐप खुद ड्रॉ कर सकता है।

`DataTable` लेआउट, अलाइनमेंट, वर्चुअलाइज़ेशन और इंटरैक्शन उपलब्ध कराता है। ऐप अपने हिस्सों की पैडिंग, रंग, बॉर्डर और चयन का फ़ीडबैक `classes` और `styles` के ज़रिए तय करता है। Rust में इसे `nsh_base::data_table()` से बनाया जाता है, TSX में `nsh/base` से `<DataTable>` के साथ।

```rust tabs
use nsh_base::{DataTableColumn, data_table};
use nsh_core::prelude::*;

fn column(key: &str, title: &str) -> DataTableColumn {
    let mut column = DataTableColumn::default();
    column.key = key.into();
    column.title = Some(title.into());
    column
}

fn table() -> impl IntoElement {
    data_table()
        .columns(vec![column("name", "Name"), column("city", "City")])
        .flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DataTable, type DataTableColumn } from "nsh/base";

const columns: DataTableColumn[] = [
  { key: "name", title: "Name", width: 160, sortable: true },
  { key: "city", title: "City", width: 120 },
  { key: "score", title: "Score", width: 90, align: "end" },
];

const rows = [
  { name: "Ada", city: "Oslo", score: 91 },
  { name: "Grace", city: "Lima", score: 87 },
  { name: "Linus", city: "Kyoto", score: 78 },
];

function App() {
  return <DataTable columns={columns} data={rows} class="flex-1" />;
}

mount(App);
```

टेबल उस बॉक्स को भर देती है जो ऐप उसे देता है (`flex-1`, एक ऊँचाई) और उसके भीतर स्क्रॉल होती है: पंक्तियों के बीच ऊपर-नीचे और कॉलमों के बीच बगल में, स्क्रॉल बार के साथ (`scrollbar={false}` उन्हें छिपाता है, `bounces={false}` वहाँ सिरों पर उछाल रोकता है जहाँ प्लैटफ़ॉर्म में ऐसा होता है)।

<a id="rows-and-columns"></a>

## पंक्तियाँ और कॉलम

`data` पंक्तियाँ हैं: ऐसे ऑब्जेक्ट जिनके फ़ील्ड कॉलमों के `key` नाम बताते हैं, या ऐसे ऐरे जिन्हें कॉलम स्थिति से इंडेक्स करते हैं। संख्याएँ, बूलियन और स्ट्रिंग टेक्स्ट के रूप में दिखते हैं। Rust में पंक्तियाँ एक बार में एक फ़ील्ड के रूप में दी जाती हैं, हर फ़ील्ड एक ही प्रकार का: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`। कॉलम एक `DataTableColumn` है:

| फ़ील्ड | विवरण |
|---|---|
| `key` | वह क्या है, कॉलमों में अद्वितीय: पंक्तियों का वह फ़ील्ड जो उसके सेल दिखाते हैं, और वह नाम जो इवेंट और ref इस्तेमाल करते हैं। |
| `title` | उसके शीर्षक का टेक्स्ट। डिफ़ॉल्ट उसका `key`। |
| `width` | उसकी चौड़ाई, पॉइंट में। डिफ़ॉल्ट `120`। |
| `minWidth`, `maxWidth` | ड्रैग या फ़िट उसे जितना सबसे संकरा और जितना सबसे चौड़ा बना सकता है। डिफ़ॉल्ट `20` और `1200`। |
| `fitPadding` | ऐप की पैडिंग, आइकन या बैज के लिए अतिरिक्त जगह, जो कॉलम को फ़िट करते समय सबसे चौड़े शीर्षक या सेल टेक्स्ट में जोड़ी जाती है। |
| `align` | `"start"` (डिफ़ॉल्ट), `"center"` या `"end"`, संख्याओं के लिए। सेल और शीर्षक दोनों पर लागू। |
| `sortable` | उसके शीर्षक में एक सॉर्ट बटन होता है जो सॉर्ट का अनुरोध करता है (देखें [सॉर्टिंग](#sorting))। |
| `fixed` | अन्य कॉलमों के उसके नीचे से स्क्रॉल होने पर भी वह बाईं ओर टिका रहता है। फ़िक्स्ड कॉलम बाकी कॉलमों से पहले आते हैं, अपने क्रम में। |
| `resizable`, `movable` | क्या उसके किनारे को खींचने से आकार बदलता है और उसके शीर्षक को खींचने से वह खिसकता है। डिफ़ॉल्ट टेबल के `resizableColumns` और `movableColumns`। |
| `selectable` | क्या वह चयन में भाग लेता है। बटनों या चेकबॉक्स वाला कॉलम `false` सेट करता है। डिफ़ॉल्ट `true`। |
| `cellClass` | कॉलम के सेल की क्लास, `cell` पार्ट की क्लास के बाद: एक कॉलम की पैडिंग या अलाइनमेंट। |
| `headerClass` | कॉलम के शीर्षक की क्लास, `headerCell` पार्ट की क्लास के बाद। |
| `positiveClass` | उन सेल की क्लास जिनमें बढ़त है: शून्य से बड़ी संख्या, या `+` से शुरू होने वाला टेक्स्ट। |
| `negativeClass` | उन सेल की क्लास जिनमें गिरावट है: शून्य से छोटी संख्या, या `-` से शुरू होने वाला टेक्स्ट। |

`rowHeight` बॉडी पंक्ति की ऊँचाई है (डिफ़ॉल्ट `32`) और `headerHeight` शीर्षक पंक्ति की ऊँचाई (डिफ़ॉल्ट पंक्ति की ऊँचाई)। `rowHeader` बाईं ओर पंक्ति संख्याओं का एक कॉलम जोड़ता है, जो पंक्तियों को चुनता है। `stripe` विषम पंक्तियों को `rowOdd` पार्ट देता है।

<a id="group-labels"></a>

### ग्रुप लेबल

`groups` कॉलमों के ऊपर लेबल रखता है, सबसे निचला स्तर पहले। हर स्तर `{ label, span }` की एक सूची है जिनके स्पैन का योग कॉलमों की संख्या, या उसके नीचे वाले स्तर की संख्या के बराबर होता है।

```tsx
<DataTable
  columns={columns}
  data={rows}
  groups={[
    [{ label: "Person", span: 2 }, { label: "Result", span: 1 }],
  ]}
  class="flex-1"
/>
```

<a id="any-number-of-rows"></a>

## कितनी भी पंक्तियाँ

टेबल पंक्तियाँ स्थिति के आधार पर माँगती है, और ऐप उन्हें उपलब्ध कराता है। `rowCount` पंक्तियों की कुल संख्या है, `data` वे पंक्तियाँ जो ऐप के पास हैं, और `dataStart` उनमें से पहली की स्थिति। `data` के बाहर की पंक्तियाँ तब तक खाली रहती हैं जब तक ऐप उन्हें न दे। `onVisibleRowsChange` हर स्क्रॉल कदम पर दिखाई दे रही पंक्तियाँ, `{ range: { start, end } }`, बताता है, और उनके आसपास का पेज फ़ेच करने की यही जगह है।

```tsx
const ROWS = 1_000_000;
const page = signal({ start: 0, rows: load(0) });

<DataTable
  columns={columns}
  data={page().rows}
  dataStart={page().start}
  rowCount={ROWS}
  onVisibleRowsChange={({ range: { start, end } }) => {
    // Keep the rows in view inside the page held.
    const held = page();
    if (start < held.start || end > held.start + held.rows.length) {
      const first = Math.max(0, start - 200);
      page.set({ start: first, rows: load(first) });
    }
  }}
  class="flex-1"
/>
```

जो सूची अपने अंत की ओर बढ़ती है, उसके लिए `hasMore` सेट करें: जब दिखाई दे रही पंक्तियाँ आख़िरी पंक्ति के `loadMoreThreshold` (डिफ़ॉल्ट `20`) के भीतर आती हैं, तो `onLoadMore` पंक्तियों की हर संख्या के लिए एक बार चलता है। जब तक `loading` true है, वह प्रतीक्षा करता है, और `loadingView` स्लॉट पंक्तियों के ऊपर दिखता है। जब कोई पंक्ति न हो, तो `empty` स्लॉट दिखता है।

कुछ दस लाख पॉइंट से ज़्यादा की सामग्री पर स्क्रॉल बार एक स्केल की हुई रेंज पर फैलते हैं, इसलिए दस लाख पंक्तियाँ भी हर पंक्ति तक स्क्रॉल होती हैं।

<a id="selection"></a>

## चयन

gpui-component की तरह, तीन स्विच तय करते हैं कि प्रेस क्या चुनता है:

| प्रॉप | प्रेस क्या चुनता है | `selection` |
|---|---|---|
| `rowSelectable` (डिफ़ॉल्ट `true`) | एक पंक्ति: उसका कोई भी सेल, या उसका रो हेडर | `{ row }` |
| `columnSelectable` (डिफ़ॉल्ट `true`) | एक कॉलम: उसका शीर्षक | `{ column }` |
| `cellSelectable` (डिफ़ॉल्ट `false`) | एक सेल; रो हेडर (इसके साथ डिफ़ॉल्ट रूप से दिखता है) पंक्तियाँ चुनता है | `{ row, column }` |

`cellSelectable` के साथ और रो हेडर छिपा होने पर (`rowHeader={false}`), चुने हुए सेल को फिर से दबाने पर उसकी पंक्ति चुनी जाती है। Shift या प्लैटफ़ॉर्म की कमांड कुंजी के साथ प्रेस केवल तब पंक्ति चुनता है जब `selectOnModifierPress` (डिफ़ॉल्ट `true`) हो, इसलिए जो ऐप अपना बहु-पंक्ति चयन रखता है वह ऐसे प्रेस खुद संभालता है: `onRowPress` बॉडी के हर प्रेस की जानकारी देता है, उसकी पंक्ति, पॉइंटर के नीचे का कॉलम, पंक्ति में क्लिक की संख्या और दबी हुई मॉडिफ़ायर कुंजियों के साथ। जिस कॉलम का `selectable` `false` है, वह न खुद को चुनता है और न अपने सेल को।

डेटा में पंक्तियाँ 0 से गिनी जाती हैं, और कॉलम `columns` में उसका इंडेक्स है, चाहे उपयोगकर्ता ने उन्हें किसी भी क्रम में खिसकाया हो। `onSelectionChange` बताता है कि उपयोगकर्ता ने क्या चुना (कुछ नहीं के लिए `null`)। `selection` प्रॉप ऐप की ओर से चयन सेट करता है; इसे अनसेट छोड़ें तो टेबल चयन खुद रखती है। `onDoublePress` ऐसी पंक्ति, सेल या शीर्षक की जानकारी देता है जिसे दो बार दबाया गया, और `onContextMenu` सेकेंडरी या लंबे प्रेस की, उस बिंदु के साथ जहाँ ऐप का [`Menu`](./menu.md) खोलना है। दोनों पॉइंटर के नीचे के सेल का नाम बताते हैं (उसका `row` और `column`), या पंक्ति की संख्या (केवल `row`), या शीर्षक (केवल `column`)। अगले प्रेस तक, जिस सेल के लिए मेन्यू माँगा गया उसे `cellActive` पार्ट मिलता है, या जहाँ सेल नहीं चुने जाते वहाँ उसकी पंक्ति को `rowActive` पार्ट।

स्क्रीन रीडर को कॉलम हेडर और सेल का एक ग्रिड मिलता है (जिसका नाम `accessibilityLabel` से तय होता है), और चुने हुए सेल को चुना हुआ बताया जाता है।

<a id="keyboard"></a>

## कीबोर्ड

टेबल को दबाने, या Tab से उस तक पहुँचने (macOS, वेब) पर कीबोर्ड उसे मिल जाता है, जब तक कोई और प्रेस न हो, फ़ोकस कहीं और न चला जाए या `blur()` न हो; `focus()` ऐप की ओर से कीबोर्ड उसे देता है। टेबल Tab का एक ही पड़ाव है: उसके भीतर Tab चयन को आगे बढ़ाता है, और Escape कीबोर्ड वापस दे देता है।

| कुंजियाँ | क्या करती हैं |
|---|---|
| तीर कुंजियाँ | चयन को एक पंक्ति, एक कॉलम या एक सेल खिसकाती हैं, और उसे दृश्य में स्क्रॉल करती हैं। |
| Tab, Shift+Tab | अगले या पिछले कॉलम पर जाती हैं। |
| Page Up, Page Down | पंक्तियों के एक पेज के बराबर जाती हैं। |
| Home, End | पहले या आख़िरी पर जाती हैं। |
| Escape | चयन साफ़ करती है, फिर कीबोर्ड वापस दे देती है। |
| कॉपी शॉर्टकट | चयन का टेक्स्ट क्लिपबोर्ड पर रखता है (`copy()`)। |

`loopSelection` (डिफ़ॉल्ट `true`) तीर कुंजियों को सिरों के आर-पार घुमाता है।

<a id="sorting"></a>

## सॉर्टिंग

`sortable` कॉलम के शीर्षक के अंत में एक सॉर्ट बटन होता है, एक छोटा घोस्ट बटन जो कॉलम के सॉर्ट न होने पर धुंधला रहता है। उसे दबाने पर बिना सॉर्ट, आरोही, अवरोही और फिर बिना सॉर्ट के चक्र में अगला सॉर्ट (`{ key, direction }`) रिपोर्ट होता है, `onSortChange({ sort })` के साथ (हटाने के लिए `null`)। टेबल पंक्तियों को दोबारा क्रमबद्ध नहीं करती: ऐप अपने डेटा को सॉर्ट करता है, या अपने सर्वर से नए क्रम में पंक्तियाँ माँगता है, और `sort` सेट करता है ताकि शीर्षक उसे दिखाए। क्योंकि क्रम ऐप के पास है, सॉर्टिंग उन दस लाख पंक्तियों पर भी उसी तरह काम करती है जो ऐप के पास कभी होती ही नहीं।

```tsx
<DataTable
  columns={columns}
  data={rows()}
  sort={sort()}
  onSortChange={({ sort: next }) => {
    sort.set(next ?? undefined);
    rows.set(sorted(people, next));
  }}
  class="flex-1"
/>
```

<a id="resizing-and-moving-columns"></a>

## कॉलमों का आकार बदलना और खिसकाना

कॉलम के पिछले किनारे को खींचने पर उसका आकार उसके `minWidth` और `maxWidth` के भीतर बदलता है, और `onColumnResize({ key, width })` हर कदम की जानकारी देता है। किनारे को लगातार दो बार दबाने पर कॉलम अपने सबसे चौड़े टेक्स्ट और शीर्षक के अनुसार फ़िट हो जाता है। शीर्षक को खींचने पर कॉलम खिसकता है, और एक रेखा दिखाती है कि वह कहाँ गिरेगा; `onColumnMove` `{ key, from, to, order }` की जानकारी देता है, जहाँ `order` सभी कॉलमों के `key` हैं, दिखाए गए क्रम में। फ़िक्स्ड कॉलम फ़िक्स्ड कॉलमों के बीच ही रहते हैं। `resizableColumns` और `movableColumns` टेबल के लिए दोनों को बंद करते हैं, और कॉलम के `resizable` और `movable` उन पर भारी पड़ते हैं।

<a id="live-data"></a>

## लाइव डेटा

कोट टेबल एक सेकंड में कई बार बदलती है। ऐप दिखाई दे रही पंक्तियों और उनके आसपास के एक दायरे को फ़ॉर्मैट करता है (वह उन्हें `onVisibleRowsChange` से जानता है) और उन्हें `dataStart` से `data` के रूप में सौंपता है, इसलिए अपडेट की लागत उतनी ही होती है जितना स्क्रीन पर है, पंक्तियों की संख्या चाहे जो हो। बढ़त और गिरावट अपने रंग कॉलम के `positiveClass` और `negativeClass` से लेती हैं, जो नेटिव रूप से उन सेल पर लागू होते हैं जिनका मान शून्य से ऊपर या नीचे है (या जिनका टेक्स्ट `+` या `-` से शुरू होता है)।

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

पंक्तियाँ और कॉलम ऐसे स्लॉट हैं जिन्हें टेबल एक बार बनाती है और रखे रहती है: स्क्रॉल करने से उन्हें दिखाने के लिए दूसरी पंक्तियाँ और कॉलम मिलते हैं, इसलिए कितना भी लंबा स्क्रॉल केवल टेक्स्ट और स्थान बदलता है।

<a id="drawing-cells-and-titles"></a>

## सेल और शीर्षक ड्रॉ करना

`renderCell` वहाँ ऐप के अपने सेल ड्रॉ करता है जहाँ कॉलम केवल टेक्स्ट नहीं है (एक बैज, एक बटन)। इसे केवल दिखाई दे रहे सेल के लिए बुलाया जाता है, एक `DataTableCell` के साथ: `row`, `column`, `key`, `text` (जो टेबल दिखाती) और `selected`। ऐप अपना डेटा `row` से खोजता है। `renderHeaderCell` एक शीर्षक को उसके सेल में ड्रॉ करता है, जिसे एक `DataTableHeaderCell` बताया जाता है: `column`, `key`, `title`, `sort` (दिशा, या कोई नहीं) और `selected`।

```tsx
<DataTable
  columns={columns}
  data={rows()}
  renderCell={(cell) =>
    cell.key === "status" ? (
      <View class={cell.text === "open" ? "rounded bg-green-500/20 px-2" : "rounded bg-muted px-2"}>
        <Text class="text-xs">{cell.text}</Text>
      </View>
    ) : (
      <Text class="px-2 text-sm">{cell.text}</Text>
    )
  }
  class="flex-1"
/>
```

`fontFamily` और `fontSize` (डिफ़ॉल्ट `14`) सेल का फ़ॉन्ट सेट करते हैं, जिसमें टेबल कॉलमों को फ़िट करने के लिए टेक्स्ट भी नापती है।

<a id="the-ref"></a>

## ref

`ref` एक `DataTableRef` देता है। जो मेथड ऐसी पंक्ति, कॉलम या कॉलम कुंजी लेता है जो टेबल में नहीं है, वह कुछ नहीं बदलता और मेथड और मान का नाम बताते हुए एक चेतावनी लॉग करता है; `fitColumn` अज्ञात कुंजी के लिए `TypeError` के साथ रिजेक्ट होता है।

| मेथड | विवरण |
|---|---|
| `scrollToRow(row, animated?)` | एक पंक्ति को दृश्य में स्क्रॉल करता है। |
| `scrollToColumn(key, animated?)` | एक कॉलम को दृश्य में स्क्रॉल करता है। |
| `selection()` | क्या चुना हुआ है, कुछ नहीं के लिए `null`। |
| `select(selection)` | चुनता है (`null`: कुछ नहीं) और उसे दृश्य में लाता है, `onSelectionChange` के बिना। |
| `visibleRows()`, `visibleColumns()` | दिखाई दे रही पंक्तियाँ और स्क्रॉल होने वाले कॉलम, `{ start, end }` के रूप में (`end` को छोड़कर)। |
| `columnWidths()` | अभी की चौड़ाइयाँ, `columns` के क्रम में। |
| `setColumnWidth(key, width)` | किसी कॉलम की चौड़ाई उसकी सीमाओं के भीतर सेट करता है। |
| `fitColumn(key)` | किसी कॉलम को उतना चौड़ा करता है जितना दिखाई दे रही पंक्तियों और उनके आसपास की एक हज़ार तक और पंक्तियों में उसके सबसे चौड़े टेक्स्ट और शीर्षक को चाहिए। वह चौड़ाई लौटाता है। |
| `dump(start?, end?)` | दी गई पंक्तियों (डिफ़ॉल्ट: जितनी रखी हैं सभी) और शीर्षकों के टेक्स्ट, जैसे दिखाए गए हैं: `{ headers, rows }`, एक्सपोर्ट के लिए। |
| `copy()` | चयन का टेक्स्ट क्लिपबोर्ड पर रखता है: पंक्ति के सेल बीच में टैब के साथ, कॉलम के सेल लाइन ब्रेक के साथ, सेल का टेक्स्ट। |
| `focus()`, `blur()` | कीबोर्ड टेबल को देता है या ले लेता है। |
| `menuTarget()`, `clearMenuTarget()` | आख़िरी संदर्भ मेन्यू किसके लिए माँगा गया था (`{ row?, column? }`, जिसे `cellActive` / `rowActive` चिह्नित करते हैं), और ऐप का मेन्यू बंद होने पर उस चिह्न को हटाना। |

<a id="styling-the-parts"></a>

## पार्ट्स की स्टाइलिंग

`class` और `style` टेबल के बॉक्स को स्टाइल करते हैं। `classes` पार्ट के अनुसार Tailwind क्लास लेता है और `styles` पार्ट के अनुसार इनलाइन स्टाइल; पार्ट टेबल की संरचना और अलाइनमेंट देते हैं; उनकी क्लास रूप-रंग देती हैं, और `styles` क्लास पर भारी पड़ते हैं।

```tsx
<DataTable
  columns={columns}
  data={rows()}
  stripe
  class="flex-1 rounded-lg border border-border"
  classes={{
    header: "bg-secondary",
    headerCell: "pl-2 pr-1",
    headerContent: "gap-1",
    cell: "px-2",
    resizeHandle: "bg-border group-hover:bg-primary",
    sortAscending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    sortDescending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    rowSelected: "bg-primary/10",
    rowHover: "bg-muted/50",
    fixedEdge: "bg-border",
  }}
/>
```

| पार्ट | यह क्या है |
|---|---|
| `root` | टेबल का बॉक्स: उसका बॉर्डर, रेडियस और बैकग्राउंड |
| `header` | टेबल के आर-पार हेडर, उसकी ग्रुप लेबल और शीर्षकों की पंक्तियाँ |
| `groupCell` | उन कॉलमों के ऊपर एक ग्रुप लेबल जिन पर वह फैला है |
| `headerCell` | हर कॉलम का शीर्षक सेल |
| `headerContent` | लेबल और सॉर्ट बटन की लेआउट पंक्ति; उनके बीच का गैप यहीं सेट करें |
| `headerCellDragging` | खींचा जा रहा शीर्षक, `headerCell` के बाद |
| `headerCellSorted` | उस कॉलम का शीर्षक जिससे टेबल सॉर्ट है, `headerCell` के बाद |
| `headerCellSelected` | चुने हुए कॉलम का शीर्षक, `headerCell` के बाद |
| `sortIndicator` | सॉर्ट हो सकने वाले कॉलम का सॉर्ट बटन |
| `sortAscending`, `sortDescending` | उसके दो शेवरॉन; `selected:` सॉर्ट की गई दिशा पर लागू होता है |
| `resizeHandle` | कॉलम के पिछले किनारे की रेखा जिसे खींचकर आकार बदला जाता है |
| `moveIndicator` | वह रेखा जहाँ खींचा जा रहा कॉलम गिरेगा |
| `row` | हर बॉडी पंक्ति |
| `rowOdd` | विषम पंक्तियाँ, `row` (`stripe`) के बाद |
| `rowHover` | वह पंक्ति जिस पर पॉइंटर है, `row` के बाद |
| `rowSelected` | चुनी हुई पंक्ति, `row` के बाद |
| `rowActive` | वह पंक्ति जिसके लिए संदर्भ मेन्यू माँगा गया जहाँ सेल नहीं चुने जाते, अगले प्रेस तक, `row` के बाद |
| `cell` | हर बॉडी सेल |
| `cellSelected` | चुना हुआ सेल, `cell` के बाद |
| `cellActive` | वह सेल जिसके लिए संदर्भ मेन्यू माँगा गया, अगले प्रेस तक, `cell` के बाद |
| `cellColumnSelected` | चुने हुए कॉलम के सेल, `cell` के बाद |
| `rowHeader` | रो हेडर सेल, यानी पंक्ति संख्याएँ |
| `rowHeaderCorner` | रो हेडर के ऊपर का कोना |
| `fixedEdge` | फ़िक्स्ड कॉलमों के पिछले किनारे की रेखा, उन कॉलमों के ऊपर जो उनके नीचे से स्क्रॉल होते हैं |
| `empty` | `empty` स्लॉट का बॉक्स |
## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | कॉलम, बाएँ से दाएँ। फ़िक्स्ड कॉलम सबसे पहले आते हैं। |
| `data` | `.data(..)` | `Row[]` | `[]` | पंक्तियाँ: कॉलम `key` के अनुसार ऑब्जेक्ट, या स्थिति के अनुसार ऐरे। |
| `rowCount` | `.row_count(..)` | `number` | मौजूद पंक्तियाँ | कुल कितनी पंक्तियाँ हैं। |
| `dataStart` | `.data_start(..)` | `number` | `0` | `data` की पहली पंक्ति का रो इंडेक्स। |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | दी गई पंक्तियों की क्लास, `data` में उनकी जगह के अनुसार: पंक्ति का अपना रूप, बिना हर पंक्ति के लिए JS में कॉल किए। |
| `rowHeight` | `.row_height(..)` | `number` | `32` | बॉडी पंक्ति की ऊँचाई, पॉइंट में। |
| `headerHeight` | `.header_height(..)` | `number` | पंक्ति की ऊँचाई | टाइटल पंक्ति की ऊँचाई। |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | कॉलम के ऊपर के लेबल, सबसे निचले स्तर से शुरू करके। |
| `sort` | `.sort(..)` | `DataTableSort` | | डेटा किस आधार पर सॉर्ट किया गया है, जो टाइटल पर दिखता है। |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | प्रेस और कीज़ से पंक्तियाँ चुनी जाती हैं। |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | टाइटल पर प्रेस करने से उसका कॉलम चुना जाता है, और क्षैतिज कीज़ कॉलमों के बीच जाती हैं। |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | प्रेस और कीज़ से सेल चुने जाते हैं। |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Shift या command कुंजी दबाकर प्रेस करने से एक पंक्ति चुनी जाती है। |
| `selection` | `.selection(..)` | `DataTableSelection` | | क्या चुना गया है, जब ऐप उसे सेट करता है। |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | ऐरो कीज़ सिरों से घूमकर दूसरी ओर पहुँचती हैं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | none | स्क्रीन रीडर टेबल को क्या नाम देते हैं। |
| `rowHeader` | `.row_header(..)` | `boolean` | `cellSelectable` के साथ दिखता है | बाईं ओर पंक्ति संख्याओं का एक कॉलम। |
| `stripe` | `.stripe(..)` | `boolean` | `false` | विषम पंक्तियों को `rowOdd` वाला हिस्सा मिलता है। |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | कॉलम के किनारे को ड्रैग करने से उसका आकार बदलता है। |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | टाइटल को ड्रैग करने से उसका कॉलम हटता है। |
| `loading` | `.loading(..)` | `boolean` | `false` | टेबल लोड हो रही है: `onLoadMore` प्रतीक्षा करता है और `loadingView` दिखता है। |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | लोड करने के लिए और पंक्तियाँ हैं। |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | आख़िरी पंक्ति से कितनी पंक्तियाँ पहले `onLoadMore` फ़ायर होता है। |
| `fontFamily` | `.font_family(..)` | `string` | inherited | सेल का फ़ॉन्ट। |
| `fontSize` | `.font_size(..)` | `number` | `14` | सेल का फ़ॉन्ट साइज़, पॉइंट में। |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | स्क्रॉल बार। |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | एक अक्ष का स्क्रॉल बार (क्षैतिज वाला डेस्कटॉप पर टेबल के नीचे का बार है)। |
| `bounces` | `.bounces(..)` | `boolean` | `true` | क्या स्क्रॉल सिरों पर बाउंस करता है, जहाँ प्लेटफ़ॉर्म ऐसा करता है। |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | दिखाई दे रहे सेल बनाता है। |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | टाइटल बनाता है। |
| `empty` | `.empty(..)` | `JSX.Element` | | कोई पंक्ति न होने पर क्या दिखता है। |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | `loading` के दौरान पंक्तियों के ऊपर क्या दिखता है। |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | हिस्से के अनुसार Tailwind क्लास। |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | हिस्से के अनुसार इनलाइन स्टाइल, क्लास के ऊपर लागू। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | | टेबल का बॉक्स। |

## Events

| Event | Rust | Description |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | उपयोगकर्ता ने चयन बदला: `{ selection }`, एक `{ row?, column? }` या `null`। |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | किसी पंक्ति या सेल पर प्रेस हुआ: `{ row, column?, clicks, shift, control, alt, platform }`। |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | किसी पंक्ति, सेल या टाइटल पर दो बार प्रेस हुआ: `{ target }`, एक `{ row?, column? }`। |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | कॉन्टेक्स्ट मेनू माँगा गया: `{ row?, column?, x, y }`, रूट व्यू में वह बिंदु। |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | सॉर्ट बटन दबाया गया: `{ sort }`, अगला सॉर्ट `{ key, direction }` या `null`। |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | किसी कॉलम का आकार बदला गया (`{ key, width }`), ड्रैग के हर चरण पर और फ़िट द्वारा सेट होने पर एक बार और। |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | कोई कॉलम हटाया गया: `{ key, from, to, order }`। |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | दिखाई दे रही पंक्तियाँ बदलीं: `{ range }`, एक `{ start, end }`। पंक्तियाँ यहीं से फ़ेच करें। |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | दिखाई दे रहे स्क्रॉल होने वाले कॉलम बदले: `{ range }`। |
| `onLoadMore` | `.on_load_more(\|\| ..)` | दिखाई दे रही पंक्तियाँ आख़िरी पंक्ति के `loadMoreThreshold` के भीतर आ गईं, जबकि `hasMore` है और `loading` नहीं। |

## Related

- [Editor](./editor.md) और [DiffView](./diff-view.md): डेटा-प्रधान अन्य बेस कॉम्पोनेंट।
- [Menu](./menu.md): `onContextMenu` से खोला जाने वाला मेनू।
- [`nsh/base`](../modules/nsh-base.md): अन्य बेस कॉम्पोनेंट।
