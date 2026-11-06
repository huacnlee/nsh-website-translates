---
title: "Command"
description: "Command: एक कमांड पैलेट, यानी ऐप के कमांड्स पर बना सर्च फ़ील्ड, जो उपयोगकर्ता के टाइप करते ही परिणामों को फ़िल्टर करता है: डायलॉग में Cmd+K पैलेट, इनलाइन कमांड मेन्यू, या ऐसा सर्च जिसका उत्तर ऐप देता है। वर्चुअलाइज़्ड, कीबोर्ड-प्रथम, और स्क्रीन रीडर के लिए list box के रूप में उपलब्ध। हर हिस्से का रूप-रंग ऐप तय करता है।"
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

कमांड पैलेट कमांड की सूची के ऊपर एक सर्च फ़ील्ड होता है: उपयोगकर्ता कुछ अक्षर टाइप करता है, सूची सिर्फ़ मेल खाने वाली कमांड तक सिमट जाती है, ऐरो कीज़ हाइलाइट को आगे-पीछे ले जाती हैं और Return हाइलाइट की गई कमांड चलाता है। `Command` ऐसे पैलेट का व्यवहार संभालता है: फ़िल्टरिंग, सेक्शन, हाइलाइट, कीबोर्ड और स्क्रीन रीडर क्या सुनाते हैं। फ़िल्टरिंग नेटिव रूप से चलती है और पंक्तियाँ वर्चुअलाइज़्ड होती हैं: केवल दिखाई दे रही पंक्तियाँ बनाई जाती हैं, इसलिए हज़ारों कमांड, फ़ाइलों या इमोजी वाला पैलेट भी हर कीस्ट्रोक पर फ़िल्टर होता है। रूप-रंग ऐप का अपना होता है: कमांड अपनी ओर से कुछ नहीं बनाता, ऐप हर पार्ट (`itemClass`, `groupClass`, `searchClass`, ...) को स्टाइल करता है और पंक्तियों की सामग्री (`renderItem`: एक आइकन, लेबल, शॉर्टकट की कीज़) बनाता है।

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` क्रेट है। क्वेरी ऐप की अपनी होती है जब वह `query` सेट करता है, जिसे वह `onQueryChange` में अपडेट करता है; इसके बिना सर्च फ़ील्ड अपनी क्वेरी खुद रखता है, जो `defaultQuery` से शुरू होती है। आइटम अपने `id` से पहचाने जाते हैं, जो ऐप का अपना होता है, कभी उनके लेबल से नहीं: `onSelect({ id })` बताता है कि उपयोगकर्ता ने कौन सा चुना। Rust में `command()` इसे बनाता है, जिसमें हर prop के लिए एक सेटर (`.items(..)`, `.query(..)`, `.render_item(..)`), हर इवेंट के लिए एक लिसनर मेथड और टाइप्ड स्टाइल मेथड होते हैं।

<a id="items"></a>

## आइटम

`items` कमांड हैं, क्रम में, हर एक `CommandItem`:

| फ़ील्ड | टाइप | विवरण |
|---|---|---|
| `id` | `string` | `onSelect` और `onHighlightChange` में इसकी पहचान: आइटमों में अद्वितीय। |
| `label` | `string` | इसकी पंक्ति क्या दिखाती है (जब तक `renderItem` उसे न बनाए), स्क्रीन रीडर क्या बोलते हैं और क्वेरी किससे मेल खाती है। |
| `keywords` | `string[]` | क्वेरी जिन और शब्दों से मेल खाती है: पर्यायवाची, अनूदित लेबल के साथ अंग्रेज़ी नाम। |
| `group` | `string` | इसका सेक्शन: एक ही समूह के आसन्न आइटम इस शीर्षक वाले हेडर के नीचे दिखते हैं। |
| `shortcut` | `string` | उसी कमांड का कीस्ट्रोक, जैसा [`keymap`](../modules/nsh.md#keymap) उसे नाम देता है (`"mod+shift+p"`), ताकि उसकी पंक्ति उसे दिखाए। ऐप इसे `keymap.bind` से बाइंड करता है। |
| `disabled` | `boolean` | इसे चुना नहीं जा सकता: कीज़ इसे छोड़कर आगे बढ़ जाती हैं, प्रेस का कोई असर नहीं होता, `disabled:` स्टाइल लागू होते हैं। |
| `checked` | `boolean` | यही प्रभाव में है (एक थीम, एक भाषा): `checked:` स्टाइल लागू होते हैं और स्क्रीन रीडर बताते हैं कि यह चेक किया हुआ है। |

क्वेरी किसी आइटम से तब मेल खाती है जब उसके लेबल या किसी कीवर्ड में वह मौजूद हो, अक्षरों की केस और उसके आसपास के स्पेस को अनदेखा करके। आइटम अपना क्रम बनाए रखते हैं, और जिस सेक्शन में कोई मेल न हो वह अपने हेडर समेत हट जाता है। `renderItem` को दिखाई दे रही हर पंक्ति के लिए एक `CommandEntry` मिलता है: आइटम के फ़ील्ड, और `shortcutLabel`, यानी इसका `shortcut` वैसे जैसे हिंट यहाँ दिखाते हैं (Apple के प्लैटफ़ॉर्म पर `⇧⌘P`, अन्यत्र `Ctrl+Shift+P`)। यह वही है जो आइटम है, और हाइलाइट पंक्ति का `focus:` है: ड्रॉइंग हर आइटम के लिए एक बार बनती है और हाइलाइट के हिलने पर भी अपने व्यू बनाए रखती है।

## Props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | कमांड, क्रम में। |
| `query` | `.query(..)` | `string` | कोई नहीं | क्वेरी (नियंत्रित), जिसे ऐप `onQueryChange` में सेट करता है। |
| `defaultQuery` | `.default_query(..)` | `string` | कोई नहीं | शुरुआत में क्वेरी, जब तक `query` सेट न हो। |
| `searchable` | `.searchable(..)` | `boolean` | `true` | पंक्तियों के ऊपर एक सर्च फ़ील्ड। इसके बिना हर आइटम दिखता है, और कमांड टाइपअहेड के साथ कीबोर्ड फ़ोकस का एक पड़ाव होता है। |
| `filterable` | `.filterable(..)` | `boolean` | `true` | क्वेरी आइटमों को फ़िल्टर करती है। बंद करने पर हर आइटम दिखता है: उस सर्च के लिए जिसका उत्तर ऐप खुद देता है (सर्वर के नतीजे `items` के रूप में सेट किए जाते हैं)। नई क्वेरी फिर भी पहले आइटम को हाइलाइट करती है। |
| `loading` | `.loading(..)` | `boolean` | `false` | एक सर्च चल रही है: `empty` प्रतीक्षा करता है, और स्क्रीन रीडर के लिए सूची व्यस्त है। अपना इंडिकेटर `searchSuffix` में दिखाएँ। |
| `placeholder` | `.placeholder(..)` | `string` | कोई नहीं | सर्च फ़ील्ड का प्लेसहोल्डर। |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | दिखाए जाने पर सर्च फ़ील्ड को कीबोर्ड फ़ोकस मिलता है: ऐसा पैलेट जो टाइप करने के लिए खुलता है। |
| `separator` | `.separator(..)` | `boolean` | `true` | दिखाए गए दो सेक्शनों के बीच एक सेपरेटर पंक्ति, जिसे `separatorClass` स्टाइल करता है; कभी पहली, आखिरी या दोहरी नहीं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर सूची को क्या कहते हैं ("Commands"), और सर्च फ़ील्ड को भी, जब तक `searchAccessibilityLabel` सेट न हो। |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | स्क्रीन रीडर सर्च फ़ील्ड को क्या कहते हैं: वह क्या खोजता है ("Search commands")। |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | कोई नहीं | सर्च फ़ील्ड के ऊपर (एक शीर्षक) और पंक्तियों के नीचे (कीज़ के हिंट, एक गिनती) क्या दिखता है। |
| `empty` | `.empty(..)` | `JSX.Element` | कोई नहीं | जब कोई आइटम न दिखे तब क्या दिखता है: ऐसी क्वेरी जिससे कुछ मेल न खाए, या कोई आइटम न हो। |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | कोई नहीं | सर्च फ़ील्ड के पहले और बाद में, उसके बार में, क्या दिखता है: एक सर्च आइकन, `loading` के दौरान एक स्पिनर। |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | कोई नहीं | दिखाई दे रही पंक्तियों के लिए पंक्ति की सामग्री; इसके बिना पंक्ति आइटम का लेबल दिखाती है। |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | कोई नहीं | सेक्शन का हेडर (`{ heading }`); इसके बिना हेडर अपना शीर्षक दिखाता है। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्वयं कमांड: इसका आकार, फ़्रेम और सतह। |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | `searchPrefix`, सर्च फ़ील्ड और `searchSuffix` की पंक्ति। |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | सर्च फ़ील्ड। |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पंक्तियों का स्क्रोल व्यू। इसे ऊँचाई दें (`max-h-80`, या निर्धारित आकार वाला कमांड): पंक्तियाँ इसके भीतर स्क्रोल होती हैं, और केवल दिखाई दे रही पंक्तियाँ बनाई जाती हैं। |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर आइटम की पंक्ति और उसकी स्टेट (नीचे); इसके टेक्स्ट स्टाइल लेबल तक पहुँचते हैं। |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर सेक्शन का हेडर। |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर सेपरेटर: एक रेखा की ऊँचाई और रंग। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | Payload | कब |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | उपयोगकर्ता ने एक आइटम चुना: Return, या उसकी पंक्ति पर प्रेस। |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | हाइलाइट हिला (कीज़, पॉइंटर, नई क्वेरी या नए आइटम, `highlight`): ताकि पूर्वावलोकन हो सके कि Return क्या चलाएगा। |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | उपयोगकर्ता ने सर्च फ़ील्ड में टाइप किया, या Escape ने उसे साफ़ किया। |
| `onCancel` | `.on_cancel(..)` | कोई नहीं | खाली क्वेरी के साथ Escape: जो कमांड को थामे है उसे बंद करें (किसी डायलॉग का `open`)। |

<a id="parts"></a>

## पार्ट्स

| पार्ट | भीतर | स्टाइल करने का तरीका | स्टेट |
|---|---|---|---|
| कमांड | | `class`, `style` | |
| `header` | कमांड | ऐप का अपना एलिमेंट | |
| सर्च बार | कमांड | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, सर्च फ़ील्ड, `searchSuffix` | सर्च बार | ऐप के अपने एलिमेंट; `searchClass`, `searchStyle` | फ़ील्ड का `focus:` |
| सूची | कमांड | `listClass`, `listStyle` | |
| सेक्शन का हेडर | सूची | `groupClass`, `groupStyle`, `renderGroup` | |
| सेपरेटर | सूची | `separatorClass`, `separatorStyle` | |
| पंक्ति | सूची | `itemClass`, `itemStyle` | `focus:` (हाइलाइट की गई), `checked:`, `disabled:`, `hover:`, `active:` |
| पंक्ति की सामग्री | पंक्ति | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:`, `itemClass` में `group` के अंतर्गत |
| `empty` | कमांड | ऐप का अपना एलिमेंट | |
| `footer` | कमांड | ऐप का अपना एलिमेंट | |

हाइलाइट की गई पंक्ति को `focus:` से दिखाएँ ([डिज़ाइन गाइड](../docs/design-guides.md#interaction-states) देखें)।

## Ref

| मेथड | विवरण |
|---|---|
| `focus()` | सर्च फ़ील्ड को कीबोर्ड फ़ोकस देता है (इसके बिना, कमांड को)। |
| `highlight(id)` | `id` वाले आइटम को हाइलाइट करता है और उसकी पंक्ति को व्यू में स्क्रोल करता है; जो आइटम दिखाया नहीं गया या डिसेबल है वह जैसा है वैसा ही रहता है। |
| `matchedCount()` | `Promise<number>`: क्वेरी कितने आइटम दिखाती है, डिसेबल आइटम समेत। |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## डायलॉग में एक पैलेट

कमांड को [`Dialog`](./dialog.md) में रखें और ऐप के शॉर्टकट से उसे खोलें। Escape पहले क्वेरी साफ़ करता है; खाली क्वेरी के साथ यह `onCancel` है, जहाँ ऐप डायलॉग बंद करता है।

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## ऐसी सर्च जिसका उत्तर ऐप देता है

`filterable={false}` के साथ ऐप जो भी आइटम देता है वे सब दिखते हैं: ऐप `onQueryChange` में सर्च करता है (सर्वर, डेटाबेस) और नतीजों के साथ `items` सेट करता है, प्रतीक्षा के दौरान `loading`।

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- सूची की भूमिका `"listbox"` है, जिसे `accessibilityLabel` नाम देता है; हर पंक्ति एक `"option"` है जिसका नाम उसके आइटम का लेबल है, और वह चेक्ड व डिसेबल वैसी ही है जैसा उसका आइटम; सेक्शन का हेडर एक `"header"` है, सेपरेटर छिपा रहता है।
- सर्च फ़ील्ड एक टेक्स्ट फ़ील्ड है जिसे `searchAccessibilityLabel` नाम देता है (अन्यथा `accessibilityLabel`); इसका प्लेसहोल्डर एक हिंट है जो फ़ील्ड के खाली रहने तक दिखता है।
- ऐरो कीज़ जब हाइलाइट को हिलाती हैं तब सर्च फ़ील्ड कीबोर्ड फ़ोकस बनाए रखता है, और स्क्रीन रीडर हाइलाइट किया गया लेबल सुनाते हैं। सर्च फ़ील्ड के बिना, हाइलाइट की गई पंक्ति को स्क्रीन रीडर का फ़ोकस मिलता है।
- `loading` के दौरान सूची व्यस्त रहती है।

लेबल, रोल और घोषणाओं के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="keyboard"></a>

## कीबोर्ड

| कुंजी | क्या करती है |
|---|---|
| टाइप करना | आइटमों को फ़िल्टर करता है; पहला enabled मेल हाइलाइट होता है। |
| Down, Up | अगले या पिछले आइटम को हाइलाइट करता है, डिसेबल आइटमों को छोड़कर, आखिरी से पहले तक और वापस। |
| Page Down, Page Up | हाइलाइट को दिखाई दे रही पंक्तियों जितना हिलाता है। |
| Return | हाइलाइट किया गया आइटम चुनता है (`onSelect`)। |
| Escape | क्वेरी साफ़ करता है; खाली क्वेरी के साथ `onCancel` रिपोर्ट करता है। |
| Home, End | सर्च फ़ील्ड के बिना: पहला या आखिरी आइटम (फ़ील्ड में ये उसका कैरेट हिलाते हैं)। |
| Space, अक्षर, अंक | सर्च फ़ील्ड के बिना: Space चुनता है, अक्षर और अंक टाइपअहेड से हाइलाइट करते हैं। |

<a id="platform-notes"></a>

## प्लैटफ़ॉर्म नोट्स

- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: पॉइंटर जिस पंक्ति पर जाता है उसे हाइलाइट करता है, और क्लिक बटन के नीचे जाते ही चुन लेता है, ताकि सर्च फ़ील्ड कीबोर्ड फ़ोकस बनाए रखे।
- iOS, Android और Mac Catalyst: टैप एक पंक्ति चुनता है, और कीबोर्ड की return कुंजी हाइलाइट किया गया आइटम चुनती है और अगली क्वेरी के लिए फ़ील्ड को बनाए रखती है।
- हर प्लैटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है: कमांड, उसका सर्च बार, उसकी पंक्तियाँ और उनकी सामग्री।
