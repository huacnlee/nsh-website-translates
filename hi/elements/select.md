---
title: "Select"
description: "Select कॉम्पोनेंट: आइटमों की सूची में से एक मान चुनने के लिए, जो डेस्कटॉप पर अपने ट्रिगर पर पॉपअप के रूप में और फ़ोन पर शीट के रूप में दिखता है, कीबोर्ड, टाइपअहेड, खोज और सेक्शन के समर्थन के साथ, और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Select सूची में से एक मान चुनता है: कोई सेटिंग, फ़िल्टर, देश, टाइम ज़ोन। ऐप का ट्रिगर सूची खोलता है, जिसे हर डिवाइस की अपेक्षा के अनुसार दिखाया जाता है:

- डेस्कटॉप और डेस्कटॉप ब्राउज़र पर, ट्रिगर के ऊपर एक पॉपअप खुलता है, जिसमें चुनी हुई पंक्ति ट्रिगर के ऊपर ही रखी जाती है, ताकि चुना हुआ शीर्षक अपनी जगह पर बना रहे (shadcn/ui की `item-aligned` स्थिति)। पॉपअप ट्रिगर जितना चौड़ा होता है (ऐप की `popupStyle` / `popupClass` चौड़ाई कोई और चौड़ाई तय कर सकती है, जैसे `gpui-component` की `menu_width`) और अपनी पंक्तियों जितना ऊँचा होता है, स्क्रीन पर उपलब्ध जगह तक। कुछ भी चुना न हो तो यह ट्रिगर के नीचे खुलता है। कीबोर्ड आइटमों के बीच चलता है और किसी एक को चुनता है।
- फ़ोन और टैबलेट पर, स्क्रीन के नीचे बैकड्रॉप के ऊपर एक शीट खुलती है।

Select व्यवहार को संभालता है: मान (ऐप का अपना, या Select का अपना), खुली/बंद स्थिति, कीबोर्ड, टाइपअहेड, खोज, सेक्शन, हाइलाइट की गई पंक्ति और स्क्रीन रीडर क्या बोलते हैं। रूप-रंग ऐप का होता है: ऐप ट्रिगर, पॉपअप, सूची, पंक्तियों, सेक्शन के हेडर और खोज फ़ील्ड को स्टाइल करता है, या पंक्तियाँ खुद बनाता है।

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` Rust के `nsh-base` क्रेट [`nsh/base`](../modules/nsh-base.md) से आता है। Rust में `select()` हर प्रॉप के लिए एक सेटर (`.items(..)`, `.value(..)`, `.item_style(..)`) और हर इवेंट के लिए एक लिसनर (`.on_change(..)`) के साथ एक Select बनाता है; `SelectItem::new(value, title)` `.disabled(..)` और `.group(..)` के साथ एक आइटम बनाता है।

<a id="items"></a>

## आइटम

`items` डेटा के रूप में सूची है: हर आइटम में एक `value` होता है (आइटमों में अद्वितीय: उसे चुनने पर यही सेट होता है), एक `title` (उसकी पंक्ति में जो दिखता है, जिससे खोज और टाइपअहेड मिलान करते हैं और जो स्क्रीन रीडर बोलते हैं), और वैकल्पिक रूप से `disabled` और `group`। एक ही `group` वाले आसन्न आइटम उस शीर्षक वाले हेडर के नीचे एक सेक्शन बनाते हैं:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

पंक्तियाँ पॉपअप के स्क्रॉल व्यू में एक वर्चुअलाइज़्ड सूची होती हैं: हज़ारों आइटमों की सूची में भी केवल दिख रही पंक्तियाँ बनती हैं, और जब पंक्तियाँ उपलब्ध जगह से ऊँची हों तो पॉपअप स्क्रॉल होता है।

<a id="value"></a>

## मान

`value` के साथ, चुना हुआ आइटम ऐप के पास रहता है: Select उस मान का आइटम दिखाता है और चुनाव की सूचना `onChange({ value })` से देता है; ऐप उसका अनुसरण करने के लिए `value` सेट करता है, या अपना मान रखता है। `value={null}` का अर्थ है कुछ भी नहीं चुना गया। इसे न दिया जाए तो Select अपना मान खुद रखता है, शुरुआत में `defaultValue` से। `onChange` बदलावों की सूचना देता है: चुने हुए आइटम को दोबारा चुनने पर सूची बंद हो जाती है।

`cleanable` आइटम चुने होने पर एक क्लियर बटन जोड़ता है: दबाने पर मान साफ़ हो जाता है, जिसकी सूचना `onChange({ value: null })` से मिलती है, और सूची बंद रहती है। बटन Select के व्यू में ट्रिगर के बाद आता है, उसके अंदर नहीं, इसलिए उसे दबाने से सूची कभी नहीं खुलती; उसे ऐप रखता है (`absolute` के साथ ट्रिगर के सिरे पर, जहाँ शेवरॉन होता) और भरता है:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

ट्रिगर ऐप का एलिमेंट है, इसलिए चुने हुए आइटम के लिए वह जो चाहे दिखा सकता है: उसका शीर्षक, एक आइकन, या कुछ न चुना हो तब प्लेसहोल्डर। TSX में यह वही एलिमेंट है जो आप पास करते हैं: वही कॉम्बोबॉक्स है और प्रेस, कीबोर्ड फ़ोकस, विस्तारित स्थिति और `disabled` खुद लेता है, इसलिए उसके अपने `active:`, `focus:` और `disabled:` क्लासेस Select का अनुसरण करते हैं, उसका अपना `onPress` भी चलता है, और सूची उसी के सापेक्ष रखी जाती है और उसी जितनी चौड़ी होती है।

<a id="open-state"></a>

## खुली स्थिति

`open` के बिना, Select अपनी खुली स्थिति खुद रखता है (`defaultOpen` से)। `open` के साथ, ऐप उसे रखता है और `onOpenChange({ open, reason })` में बदलता है: `"triggerPress"` (ट्रिगर का प्रेस, या उसकी कोई कुंजी), `"select"` (एक चुनाव), `"pressOutside"`, `"backdropPress"` या `"cancel"` (Escape या बैक)। `onOpen` और `onClose` बताते हैं कि सूची कब दिखाई गई और कब हटी (शीट के लिए: आ जाने के बाद और चली जाने के बाद), `onCancel` बताता है कि उपयोगकर्ता ने बिना चुने सूची बंद कर दी।

<a id="search"></a>

## खोज

`searchable` आइटमों के ऊपर एक खोज फ़ील्ड लगाता है: टाइप करने पर आइटम शीर्षक के आधार पर, अक्षरों के केस की अनदेखी करते हुए, फ़िल्टर होते हैं, और जिस सेक्शन में कोई मिलान न हो वह अपने हेडर के साथ हट जाता है। हाइलाइट पहले मिलान पर चला जाता है, फ़ील्ड के पास कीबोर्ड रहते हुए भी कुंजियाँ उसे चलाती रहती हैं, और Return उसे चुनता है। `empty` वह है जो सूची तब दिखाती है जब कुछ भी मेल नहीं खाता:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

डेस्कटॉप पर सूची खुलते ही खोज फ़ील्ड कीबोर्ड ले लेता है; टच स्क्रीन पर फ़ील्ड दबाने पर कीबोर्ड ऊपर आता है। हर बार खुलने पर खोज खाली से शुरू होती है।

<a id="rows-the-app-draws"></a>

## ऐप द्वारा बनाई गई पंक्तियाँ

`itemClass` हर आइटम की पंक्ति को स्टाइल करता है, जो आइटम का शीर्षक तब तक दिखाती है जब तक `renderItem` उसे न बनाए: `focus:` हाइलाइट की गई पंक्ति पर लागू होता है (जहाँ कुंजियाँ या पॉइंटर हैं), `selected:` चुनी हुई पर, और `disabled:` अक्षम पर। पंक्ति बनाने के लिए `renderItem` दें: उसे मिलता है कि आइटम क्या है ([`SelectEntry`](#types)) और वह पंक्ति की सामग्री लौटाता है, दिख रही पंक्तियों के लिए। उसे पंक्ति की स्थिति कभी नहीं मिलती: `itemClass` में `group` के साथ, सामग्री पंक्ति की स्थितियों का अनुसरण `group-focus:`, `group-selected:` और `group-disabled:` क्लासेस से करती है, इसलिए ड्रॉइंग हर आइटम के लिए एक बार होती है और हाइलाइट का हिलना या कोई चुनाव दोबारा कुछ नहीं बनाता। `renderGroup` सेक्शन का हेडर उसी तरह बनाता है:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

## Props

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | आइटम, क्रम में। |
| `value` | `.value(..)` | `string \| null` | कोई नहीं | चुने हुए आइटम का `value`, जो ऐप के पास रहता है; कोई न हो तो `null`। न दिया जाए तो Select अपना रखता है। |
| `defaultValue` | `.default_value(..)` | `string` | कोई नहीं | शुरुआत में मान, `value` के बिना। |
| `open` | `.open(..)` | `boolean` | कोई नहीं | खुली स्थिति, ऐप के पास। |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | शुरुआत में खुला, `open` के बिना। |
| `searchable` | `.searchable(..)` | `boolean` | `false` | आइटमों के ऊपर एक खोज फ़ील्ड उन्हें शीर्षक के आधार पर फ़िल्टर करता है। |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | कोई नहीं | खोज फ़ील्ड का प्लेसहोल्डर। |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर खोज फ़ील्ड को क्या कहते हैं: वह क्या खोजता है। |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | आइटम चुने होने पर एक क्लियर बटन; दबाने से मान साफ़ हो जाता है (`onChange({ value: null })`)। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | यह बंद रहता है: ट्रिगर न प्रेस लेता है और न कीबोर्ड फ़ोकस, और उस पर `disabled:` स्टाइल लागू होते हैं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर इसे क्या कहते हैं: चुनाव किस बारे में है। |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | डेस्कटॉप: ट्रिगर का वह किनारा जिस ओर सूची जाती है; यदि केवल दूसरी ओर जगह हो तो दूसरी ओर। |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | डेस्कटॉप: यह ट्रिगर के साथ कैसे संरेखित होती है। |
| `offset` | `.offset(..)` | `number` | `0` | डेस्कटॉप: ट्रिगर और सूची के बीच का अंतर। |
| `margin` | `.margin(..)` | `number` | `0` | डेस्कटॉप: सेफ़ एरिया के किनारों से यह कितनी दूरी रखती है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | वह पॉपअप (डेस्कटॉप) या शीट (टच स्क्रीन) जिसमें सूची होती है। |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | टच स्क्रीन: शीट के पीछे का बैकड्रॉप। |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | सूची, यानी पंक्तियों का स्क्रॉल व्यू। |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर आइटम की पंक्ति, जिसके टेक्स्ट स्टाइल उसका शीर्षक विरासत में लेता है: `focus:` हाइलाइट होने पर, `selected:` चुने होने पर, `disabled:` जब वह चुना न जा सके। |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर सेक्शन का हेडर। |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | कोई नहीं | खोज फ़ील्ड: उसका बॉक्स और उसका टेक्स्ट (`color`, `fontSize`, `placeholderColor`)। |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | क्लियर बटन (`cleanable`); Select के साथ `disabled:`। |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | कोई नहीं | क्लियर बटन की सामग्री: एक क्रॉस, एक आइकन। |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्लियर बटन को क्या कहते हैं। |
| `trigger` | `.trigger(..)` | `JSX.Element` | कोई नहीं | जो दबाने पर सूची खोलता है; सूची उसी के सापेक्ष रखी जाती है। |
| `empty` | `.empty(..)` | `JSX.Element` | कोई नहीं | जब कोई आइटम नहीं दिखता (मिलान रहित खोज) तब सूची क्या दिखाती है। |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | कोई नहीं | किसी आइटम की पंक्ति, जिसे ऐप इस आधार पर बनाता है कि आइटम क्या है (उसकी स्थितियाँ पंक्ति के क्लासेस हैं); अन्यथा आइटम का शीर्षक। |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | कोई नहीं | किसी सेक्शन का हेडर, जिसे ऐप बनाता है; अन्यथा उसका शीर्षक। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ट्रिगर के चारों ओर का व्यू। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | उपयोगकर्ता ने कोई दूसरा आइटम चुना (प्रेस, Return या Space, ट्रिगर पर टाइपअहेड): उसका `value`; क्लियर बटन से साफ़ होने पर `null`। उसका अनुसरण करने के लिए `value` सेट करें। |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | सूची खुली या बंद हुई, कारण के साथ। उसका अनुसरण करने के लिए `open` सेट करें। |
| `onOpen` | `.on_open(\|\| ..)` | सूची दिखाई गई; शीट के लिए, उसके आ जाने के बाद। |
| `onClose` | `.on_close(\|\| ..)` | सूची हट गई; शीट के लिए, उसके चले जाने के बाद। ऐप द्वारा बंद करने पर भी। |
| `onCancel` | `.on_cancel(\|\| ..)` | उपयोगकर्ता ने बिना चुने सूची बंद की (Escape या बैक, बाहर या बैकड्रॉप पर प्रेस)। |

ये इस क्रम में आते हैं: चुनाव के लिए `onChange`, या बिना चुनाव के बंद करने के लिए `onCancel`, फिर `onOpenChange`, फिर सूची के दिखाए जाने या हटने पर `onOpen` या `onClose`।

<a id="types"></a>

<a id="types"></a>

## प्रकार

| प्रकार | सदस्य | विवरण |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | `items` का एक आइटम। |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (आइटम का), `index: number` | `renderItem` को क्या मिलता है: आइटम और `items` में उसका इंडेक्स, उसकी स्थिति कभी नहीं (पंक्ति के `focus:`, `selected:` और `disabled:`)। |
| `SelectGroup` | `title: string` | `renderGroup` को क्या मिलता है: सेक्शन का `group`। |

Rust में ये `nsh_base::SelectItem`, `SelectEntry` और `SelectGroup` हैं; `value` एक `SelectValue` है (मान के लिए `Controlled(Some(..))`, `null` के लिए `Controlled(None)`), जिसे `.value(..)` किसी `Option<SharedString>` या स्ट्रिंग से बनाता है।

<a id="parts"></a>

## पार्ट्स

| पार्ट | कहाँ | स्टाइल कैसे करें |
|---|---|---|
| ट्रिगर | Select का व्यू | ऐप का अपना एलिमेंट (`trigger`) |
| क्लियर बटन | Select का व्यू, ट्रिगर के बाद (`cleanable`, आइटम चुने होने पर) | `clearButtonClass`, `clearButtonStyle`; उसकी सामग्री `clearButton` |
| पॉपअप या शीट | सबके ऊपर, ट्रिगर पर (डेस्कटॉप) या नीचे (टच स्क्रीन) | `popupClass`, `popupStyle` |
| बैकड्रॉप | शीट के पीछे (टच स्क्रीन) | `backdropClass`, `backdropStyle` |
| खोज फ़ील्ड | पॉपअप, सबसे पहले (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| सूची | पॉपअप, खोज फ़ील्ड के बाद | `listClass`, `listStyle` |
| सेक्शन का हेडर | सूची, अपने आइटमों से पहले | `groupClass`, `groupStyle`, `renderGroup` |
| आइटम की पंक्ति | सूची | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` अंदर, `itemClass` में `group` के अंतर्गत) |
| खाली स्थिति | पॉपअप, जब कोई आइटम न दिखे | उसका अपना एलिमेंट (`empty`) |

पॉपअप एक कॉलम है: उसकी ऊँचाई खोज फ़ील्ड और पंक्तियों के अनुसार चलती है, इसलिए `popupClass` पर `max-h-*` उसे सीमित कर देता है और सूची उसके भीतर स्क्रॉल होती है।

<a id="keyboard"></a>

## कीबोर्ड

डेस्कटॉप पर, Tab ऐसे Select के ट्रिगर तक पहुँचता है जो `disabled` नहीं है। सूची बंद होने पर, Down, Up, Return और Space उसे चुने हुए आइटम पर खोलते हैं (कुछ भी चुना न हो तो Up आख़िरी सक्षम आइटम पर और बाकी पहले पर), और अक्षर व अंक उस आइटम को चुनते हैं जिसका शीर्षक टाइप किए गए से शुरू होता है, जैसा नेटिव select करता है। सूची खुली होने पर:

| कुंजी | क्रिया |
|---|---|
| Down, Up | अगला या पिछला सक्षम आइटम, सिरों के आर-पार घूमते हुए। |
| Home, End | पहला या आख़िरी सक्षम आइटम (जब कीबोर्ड खोज फ़ील्ड के पास हो तब फ़ील्ड का अपना)। |
| Page Down, Page Up | एक पेज जितनी पंक्तियाँ आगे या पीछे। |
| Return | हाइलाइट किया हुआ आइटम चुनता है और सूची बंद करता है। |
| Space | हाइलाइट किया हुआ आइटम चुनता है (खोज फ़ील्ड के बिना)। |
| अक्षर, अंक | अगला आइटम जिसका शीर्षक पिछले एक सेकंड में टाइप किए गए से शुरू होता है (खोज फ़ील्ड के बिना)। |
| Escape | बिना चुने सूची बंद करता है। |

सूची बंद होने पर कीबोर्ड फ़ोकस ट्रिगर पर लौट आता है, जब तक कि बाहर का कोई प्रेस उसे कहीं और न ले गया हो। पॉइंटर जिस पंक्ति पर चलता है उसे हाइलाइट करता है; कुंजियों के उस तक पहुँचने पर हाइलाइट की गई पंक्ति दिखाई दे जाती है।

<a id="on-each-device"></a>

## हर डिवाइस पर

| | डेस्कटॉप और डेस्कटॉप ब्राउज़र | फ़ोन और टैबलेट |
| --- | --- | --- |
| सूची | ट्रिगर के ऊपर एक पॉपअप, जिसमें चुनी हुई पंक्ति उसी पर होती है (कोई न चुनी हो तो उसके नीचे), ट्रिगर जितना चौड़ा जब तक `popupStyle` कोई चौड़ाई तय न करे, अपनी पंक्तियों जितना ऊँचा, स्क्रीन पर उपलब्ध जगह तक | नीचे बैकड्रॉप के ऊपर एक शीट, अपनी पंक्तियों जितनी ऊँची, स्टेटस बार तक |
| बंद करना | एक चुनाव, Escape, बाहर का प्रेस (जो पॉइंटर के नीचे जो है उस तक जाता है) | एक चुनाव, बैकड्रॉप, Android का बैक बटन |
| खोज | सूची खुलते ही फ़ील्ड कीबोर्ड ले लेता है | फ़ील्ड दबाने पर कीबोर्ड ऊपर आता है |
| चुनाव | नीचे जाता प्रेस ही चुन लेता है, इसलिए खोज फ़ील्ड के पास कीबोर्ड बना रहता है | एक टैप |

`popupClass` डेस्कटॉप पर पॉपअप को और फ़ोन पर शीट को स्टाइल करता है; जो स्टाइल दोनों में अलग हो, वह `platform.idiom` (`nsh/device`) की तुलना `"desktop"` से कर सकता है।
## Accessibility

- स्क्रीन रीडर के लिए ट्रिगर एक combobox है: इसका लेबल `accessibilityLabel` है, इसका मान चुने गए आइटम का शीर्षक है, और यह बताता है कि सूची विस्तारित (expanded) है या नहीं। `disabled` इसे धुंधला कर देता है।
- क्लियर बटन एक button है जिसका नाम `clearButtonAccessibilityLabel` से तय होता है; यह Tab का पड़ाव नहीं है।
- सर्च फ़ील्ड एक text field है जिसका नाम `searchAccessibilityLabel` से तय होता है; इसका प्लेसहोल्डर एक संकेत है जो फ़ील्ड के खाली होने पर दिखता है।
- सूची एक listbox है और हर पंक्ति एक option है, जिसका नाम उसका शीर्षक है; चुना गया option selected होता है और अक्षम (disabled) option धुंधला दिखता है। सेक्शनों के हेडर headers होते हैं।
- जैसे-जैसे कुंजियाँ हाइलाइट को आगे बढ़ाती हैं, स्क्रीन रीडर का फ़ोकस हाइलाइट की गई पंक्ति पर चला जाता है; जब सर्च फ़ील्ड के पास कीबोर्ड होता है, तब इसके बजाय हाइलाइट किए गए आइटम का शीर्षक बोलकर बताया जाता है, ताकि टाइपिंग जारी रहे।

सामान्य रूप से लेबल, भूमिकाओं (roles) और घोषणाओं के लिए [Accessibility](../docs/accessibility.md) देखें।
