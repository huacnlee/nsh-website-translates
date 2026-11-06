---
title: "Tree"
description: "Tree: ऐसे आइटम जिनमें अन्य आइटम होते हैं, जिन्हें विस्तृत (expand) और संक्षिप्त (collapse) किया जा सकता है, और जिनमें से एक चुना जा सकता है: किसी प्रोजेक्ट की फ़ाइलें, सेटिंग्स साइडबार, आउटलाइन। Virtualized, कीबोर्ड फ़ोकस का एक ही पड़ाव (stop), और स्क्रीन रीडर के लिए ट्री। हर पंक्ति (row) का रूप-रंग ऐप तय करता है।"
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# ट्री

ट्री उन आइटम को दिखाता है जिनमें अन्य आइटम होते हैं: किसी प्रोजेक्ट की फ़ाइलें और फ़ोल्डर, सेटिंग्स साइडबार के सेक्शन, किसी दस्तावेज़ की रूपरेखा। `Tree` ऐसे ट्री के व्यवहार को संभालता है: कौन-से आइटम एक्सपैंड हैं, कौन-सा चुना गया है, कीबोर्ड कैसे काम करता है और स्क्रीन रीडर क्या बोलते हैं। इसकी पंक्तियाँ वर्चुअलाइज़्ड हैं: केवल दिखाई देने वाली पंक्तियाँ बनाई जाती हैं, और कोलैप्स किए गए आइटम के चाइल्ड कभी बनाए ही नहीं जाते, इसलिए हज़ारों आइटम वाला ट्री भी तुरंत खुलता और स्क्रॉल होता है। रूप-रंग ऐप का अपना होता है: ट्री खुद कुछ नहीं बनाता, ऐप हर पंक्ति की स्टाइल (`itemClass`) तय करता है और उसकी सामग्री (`renderItem`: एक आइकन, आइटम की गहराई के अनुसार इंडेंट किया गया लेबल, एक शेवरॉन, एक बैज) बनाता है।

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` क्रेट है। जब ऐप `expanded` और `selected` सेट करता है, तब एक्सपैंड किए गए आइटम और चुना गया आइटम ऐप के होते हैं, जिन्हें वह `onExpandedChange` और `onSelectedChange` में अपडेट करता है; इनके बिना ट्री अपनी स्थिति खुद रखता है, जो `defaultExpanded` और `defaultSelected` से शुरू होती है। आइटम उनके `id` से पहचाने जाते हैं, जो ऐप के अपने होते हैं (एक पाथ, किसी रिकॉर्ड की कुंजी), कभी उनके लेबल से नहीं। Rust में `tree()` इसे बनाता है, जिसमें हर प्रॉप के लिए एक सेटर (`.items(..)`, `.expanded(..)`, `.render_item(..)`), हर इवेंट के लिए एक लिसनर मेथड और टाइप्ड स्टाइल मेथड होते हैं।

<a id="items"></a>

## आइटम

`items` सबसे ऊपर के आइटम हैं, जिनमें से हर एक `TreeItem` है:

| फ़ील्ड | टाइप | विवरण |
|---|---|---|
| `id` | `string` | `expanded`, `selected` और इवेंट में जो इसे पहचानता है: ट्री में अद्वितीय होना चाहिए (एक ही id दो बार देने पर लॉग किया जाता है, और केवल उसका पहला आइटम एक्सपैंड या चुना जाता है)। |
| `label` | `string` | इसकी पंक्ति जो दिखाती है, जब तक `renderItem` उसे न बनाए, स्क्रीन रीडर जो बोलते हैं और टाइपअहेड जिससे मिलान करता है। |
| `children` | `TreeItem[]` | इसके नीचे के आइटम, क्रम में। यदि कोई हो, तो यह एक फ़ोल्डर है: यह एक्सपैंड और कोलैप्स होता है। |
| `disabled` | `boolean` | उपयोगकर्ता इसे चुन, एक्सपैंड या कोलैप्स नहीं कर सकता: प्रेस और कीज़ इसे छोड़कर आगे बढ़ जाती हैं, `disabled:` स्टाइल लागू होती हैं। इसके चाइल्ड वैसे ही रहते हैं जैसा `expanded` कहता है। |

`renderItem` को दिखाई देने वाली हर पंक्ति के लिए एक `TreeEntry` मिलता है: आइटम का `id`, `label` और `disabled`, उसकी `depth` (सबसे ऊपर 0, ऊपरी आइटम के नीचे 1, …) और यह कि वह `folder` है या नहीं। यह वह है जो आइटम है, और पंक्ति की स्थितियाँ उसकी क्लास हैं: ड्रॉइंग हर आइटम के लिए एक बार बनती है और पंक्ति के चुने जाने, एक्सपैंड या कोलैप्स होने के दौरान अपने व्यू बनाए रखती है, इसलिए शेवरॉन ट्रांज़िशन के साथ घूम सकता है।

<a id="props"></a>

## प्रॉप्स

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | सबसे ऊपर के आइटम, हर एक के नीचे के आइटम के साथ। |
| `expanded` | `.expanded(..)` | `string[]` | कोई नहीं | एक्सपैंड किए गए आइटम की id (नियंत्रित)। कोई आइटम तब दिखता है जब उसके ऊपर का हर आइटम एक्सपैंड हो। |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | शुरुआत में एक्सपैंड किए गए आइटम, जब तक `expanded` सेट न हो। |
| `selected` | `.selected(..)` | `string \| null` | कोई नहीं | चुने गए आइटम की id (नियंत्रित), किसी को न चुनने के लिए `null`। |
| `defaultSelected` | `.default_selected(..)` | `string` | कोई नहीं | शुरुआत में चुना गया आइटम, जब तक `selected` सेट न हो। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | केवल-पढ़ने योग्य ट्री: कोई प्रेस या कीज़ नहीं, कीबोर्ड फ़ोकस का कोई पड़ाव नहीं, हर पंक्ति पर `disabled:`; यह वही दिखाता है जो `expanded` और `selected` कहते हैं। |
| `reveal` | `.reveal(..)` | `boolean` | `false` | एक्सपैंड और कोलैप्स करने पर आइटम के बाद की पंक्तियाँ स्प्रिंग के साथ अपनी नई जगह पर जाती हैं, जो नेटिव रूप से चलता है। रिड्यूस्ड मोशन में बंद रहता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर ट्री को क्या कहते हैं ("Files")। |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | कोई नहीं | दिखाई देने वाली पंक्तियों की सामग्री; इसके बिना पंक्ति आइटम का लेबल दिखाती है। |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर पंक्ति: उसकी ऊँचाई, पैडिंग, सतह और स्थितियाँ (नीचे); उसकी टेक्स्ट स्टाइल लेबल तक पहुँचती हैं। |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ट्री के अंदर पंक्तियों का स्क्रॉल व्यू: उसकी पैडिंग और गैप। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | खुद ट्री। इसे ऊँचाई दें (या ऐसे पैरेंट में `flex-1` जिसकी ऊँचाई हो): पंक्तियाँ इसके अंदर स्क्रॉल होती हैं, और केवल दिखाई देने वाली पंक्तियाँ ही बनाई जाती हैं। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | पेलोड | कब |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | उपयोगकर्ता ने किसी आइटम को एक्सपैंड या कोलैप्स किया (प्रेस, Return, Space, Right या Left, `revealItem`): एक्सपैंड की गई id जैसी वे होतीं। |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | उपयोगकर्ता ने दूसरा आइटम चुना (प्रेस, ऐरो कीज़, Home, End, टाइपअहेड)। |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | उपयोगकर्ता ने `id` वाले आइटम को एक्सपैंड किया, `onExpandedChange` के बाद। |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | उपयोगकर्ता ने `id` वाले आइटम को कोलैप्स किया, `onExpandedChange` के बाद। |
| `onAction` | `.on_action(..)` | `{ id: string }` | उपयोगकर्ता ने `id` वाले आइटम पर कार्रवाई की: चुने गए आइटम पर Return जब उसके कोई चाइल्ड न हों, या किसी भी आइटम पर डबल क्लिक या डबल टैप, प्रेस के अपने इवेंट के बाद। डिसेबल्ड आइटम और डिसेबल्ड ट्री इसे कभी रिपोर्ट नहीं करते। |

चयन ऐरो कीज़ के साथ चलता है, इसलिए फ़ाइल एक्सप्लोरर फ़ाइल को `onAction` में खोलता है, `onSelectedChange` में नहीं: फ़ाइलों के बीच जाने पर वे एक-एक करके प्रीव्यू होती हैं, और Return या डबल क्लिक उसे खोलता है जिसे उपयोगकर्ता चाहता है।

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## हिस्से

| हिस्सा | अंदर | स्टाइल किया जाता है | स्थितियाँ |
|---|---|---|---|
| ट्री | | `class`, `style` | |
| सूची | ट्री | `listClass`, `listStyle` | |
| एक पंक्ति | सूची | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (खुला हुआ फ़ोल्डर), `focus:` (जब ट्री के पास कीबोर्ड फ़ोकस हो, वह पंक्ति जिस पर कीज़ काम करती हैं: चुनी गई पंक्ति, वह कोलैप्स किया गया आइटम जिसके नीचे छिपा हुआ चयन है, या पहली पंक्ति जब कुछ भी चुना न गया हो), `disabled:`, `hover:`, `active:` |
| पंक्ति की सामग्री | एक पंक्ति | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:`, `itemClass` में `group` के अंतर्गत |

चुनी गई पंक्ति को `selected:` से और कीबोर्ड की जगह को `focus:` से दिखाएँ (देखें [डिज़ाइन गाइड](../docs/design-guides.md#interaction-states))। फ़ोकस को पंक्ति के अंदर बनाएँ (`focus:outline-2 focus:-outline-offset-2`): सूची उन चीज़ों को काट देती है जो उसके किनारों से बाहर जाती हैं।

## Ref

| मेथड | विवरण |
|---|---|
| `focus()` | कीबोर्ड फ़ोकस लेता है, जैसे Tab से ट्री तक पहुँचने पर होता है। |
| `revealItem(id)` | `id` वाले आइटम के ऊपर के आइटम को एक्सपैंड करता है (`onExpandedChange` और `onExpand` के साथ रिपोर्ट किया जाता है, सबसे बाहरी पहले) और उसकी पंक्ति दिखने पर उसे व्यू में स्क्रॉल करता है: जब ऐप बदलाव का पालन करता है, तुरंत; जब नहीं करता, तो अनुरोध वहीं समाप्त हो जाता है। |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## डिसेबल्ड

डिसेबल्ड आइटम कोई प्रेस नहीं लेता, ऐरो कीज़ उसे छोड़कर आगे बढ़ जाती हैं, और स्क्रीन रीडर उसे धुँधले (dimmed) के रूप में बताते हैं। ट्री पर `disabled` उसे केवल-पढ़ने योग्य बना देता है: वह वही दिखाता है जो ऐप की स्थिति कहती है और कोई इनपुट नहीं लेता।

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- ट्री की भूमिका `"tree"` है, जिसका नाम `accessibilityLabel` से तय होता है; हर पंक्ति एक `"treeitem"` है, जिसका नाम उसके आइटम के लेबल से तय होता है, साथ में उसका स्तर (उसकी गहराई + 1), यह कि वह एक्सपैंड है या नहीं (फ़ोल्डर), चुनी गई है और डिसेबल्ड है।
- जैसे ही ट्री को कीबोर्ड फ़ोकस मिलता है और कीज़ चयन को आगे बढ़ाती हैं, वह पंक्ति जिस पर कीज़ काम करती हैं स्क्रीन रीडर का फ़ोकस ले लेती है।

लेबल, रोल और घोषणाओं के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="keyboard"></a>

## कीबोर्ड

डेस्कटॉप और वेब पर, जहाँ Tab उन व्यू तक पहुँचता है जो प्रेस लेते हैं, `Tree` [WAI-ARIA ट्री व्यू पैटर्न](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) का पालन करता है:

| कुंजी | क्या करती है |
|---|---|
| Tab, Shift+Tab | ट्री में एक ही चरण में प्रवेश कराती है, और एक ही चरण में बाहर निकालती है; वापस आने पर कीज़ चुनी गई पंक्ति से आगे चलती हैं। कुछ भी चुना न होने पर फ़ोकस पहली पंक्ति पर दिखता है, जिसे Down चुनती है। |
| Down, Up | अगली या पिछली पंक्ति चुनती हैं, डिसेबल्ड आइटम को छोड़कर, आख़िरी से पहली और वापस। |
| Right | कोलैप्स किए गए फ़ोल्डर को एक्सपैंड करती है; एक्सपैंड किए गए फ़ोल्डर पर उसका पहला सक्षम चाइल्ड चुनती है। |
| Left | एक्सपैंड किए गए फ़ोल्डर को कोलैप्स करती है; किसी और चीज़ पर उसका पैरेंट चुनती है। |
| Home, End | पहली या आख़िरी पंक्ति चुनती हैं। |
| Return | चुने गए फ़ोल्डर को एक्सपैंड या कोलैप्स करती है; बिना चाइल्ड वाले आइटम पर उस पर कार्रवाई करती है (`onAction`)। |
| Space | चुने गए फ़ोल्डर को एक्सपैंड या कोलैप्स करती है। |
| अक्षर, अंक | अगली वह पंक्ति चुनती हैं जिसका लेबल टाइप किए गए से शुरू होता है। |

जब चयन किसी कोलैप्स किए गए आइटम के नीचे छिपा हो (ऐप ने उसे कोलैप्स किया), तो कीज़ उस आइटम की पंक्ति पर काम करती हैं: Right या Return उसे एक्सपैंड करती है, Down उसके बाद की पंक्ति चुनती है।

राइट-टू-लेफ़्ट लेआउट में पंक्तियाँ दाईं ओर से चलती हैं, इसलिए Left और Right की भूमिकाएँ बदल जाती हैं, जैसा पैटर्न कहता है: Left फ़ोल्डर को एक्सपैंड करती है और उसमें प्रवेश कराती है, Right उसे कोलैप्स करती है और पैरेंट चुनती है। Up, Down, Home और End अपना काम वैसे ही रखती हैं।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: टैप पंक्ति को चुनता है और फ़ोल्डर को एक्सपैंड या कोलैप्स करता है; डबल टैप आइटम पर कार्रवाई करता है (`onAction`)।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: क्लिक वही करता है और ट्री को कीबोर्ड फ़ोकस देता है, और ऊपर दी गई कीज़ उसमें चलती हैं; डबल क्लिक आइटम पर कार्रवाई करता है।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है: ट्री, उसकी पंक्तियाँ और उनकी सामग्री।
