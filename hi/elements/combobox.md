---
title: "Combobox"
description: "Combobox कंपोनेंट: आइटमों की एक सूची में से एक या कई मान चुनने की सुविधा, जिसमें इनपुट में टाइप करके आइटम फ़िल्टर किए जाते हैं। डेस्कटॉप पर फ़ील्ड के नीचे पॉपअप खुलता है और फ़ोन पर शीट, और इसकी स्टाइलिंग ऐप द्वारा तय की जाती है।"
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Combobox सूची के आइटमों में से एक मान चुनता है, या `multiple` के साथ कई: किसी पोस्ट के टैग, किसी चैनल के सदस्य, किसी दस्तावेज़ की भाषाएँ। इसका ट्रिगर एक इनपुट है: टाइप करने से सूची खुलती है और फ़िल्टर होती है, जैसा shadcn/ui का combobox करता है। यह [Select](./select.md) का सहोदर है और उसकी सूची साझा करता है, जिसे हर डिवाइस की अपेक्षा के अनुसार प्रस्तुत किया जाता है:

- डेस्कटॉप पर और डेस्कटॉप ब्राउज़रों में, फ़ील्ड के नीचे एक पॉपअप, जो फ़ील्ड जितना चौड़ा होता है (ऐप का `popupStyle` / `popupClass` चौड़ाई कुछ और तय कर सकती है) और अपनी पंक्तियों जितना ऊँचा होता है, बशर्ते बगल में जगह हो।
- फ़ोन और टैबलेट पर, बैकड्रॉप के ऊपर स्क्रीन के निचले हिस्से में एक शीट।

Combobox व्यवहार का स्वामी है: मान (ऐप का या उसका अपना), खुली होने की स्थिति, कीबोर्ड, खोज, सेक्शन, हाइलाइट की गई पंक्ति और स्क्रीन रीडर जो सुनाते हैं। `multiple` के साथ, एक चुनाव आइटम को मान में टॉगल करता है और सूची खुली रहती है, ताकि कई आइटम एक बार में चुने जा सकें। रूप-रंग ऐप का है: वह फ़ील्ड, पॉपअप, सूची, पंक्तियों, सेक्शनों के हेडर, इनपुट और फ़ुटर को स्टाइल करता है, या पंक्तियाँ खुद बनाता है।

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। Rust में, `combobox()` एक ऐसा combobox बनाता है जिसमें हर prop के लिए एक setter (`.items(..)`, `.value(..)`, `.multiple(..)`) और हर event के लिए एक listener (`.on_change(..)`) होता है। इसके आइटम `Select` के आइटम हैं: `SelectItem::new(value, title)`, `.disabled(..)` और `.group(..)` के साथ, सेक्शनों में, जैसे select के होते हैं ([Items](./select.md#items) देखें)।

## Value

मान चुने गए आइटमों के मानों का एक array है। `value` के साथ, मान ऐप का होता है: combobox उन आइटमों को चुना हुआ दिखाता है और हर बदलाव की सूचना `onChange({ value })` से देता है; ऐप उसका अनुसरण करने के लिए `value` सेट करता है, या अपना मान रखता है। छोड़ देने पर, combobox अपना मान रखता है, जो शुरू में `defaultValue` से आता है।

- `multiple` के साथ, प्रेस, Return या Space हाइलाइट किए गए आइटम को टॉगल करता है: मान में नहीं था तो जोड़ता है, था तो हटाता है। सूची खुली रहती है।
- इसके बिना, एक चुनाव मान को उस आइटम के मान से बदल देता है और सूची बंद कर देता है; चुने हुए आइटम को फिर से चुनने पर सूची केवल बंद होती है।

`onConfirm({ value })` सूची बंद होते समय मान बताता है: हर बार खुलने पर एक बार, चाहे वह जैसे भी बंद हो (चुनाव, Escape, बाहर प्रेस, ट्रिगर बटन), और मान वैसा ही होता है जैसा उपयोगकर्ता ने छोड़ा। Mac पर Cmd+Return (अन्यत्र Ctrl+Return) सूची को बंद करता है और पुष्टि करता है।

`cleanable` किसी आइटम के चुने रहने तक एक क्लियर बटन जोड़ता है: प्रेस करने पर मान खाली हो जाता है (`onChange({ value: [] })`)। बटन इनपुट के बाद और ट्रिगर बटन से पहले आता है; उस पर प्रेस कभी सूची नहीं खोलता। इसे ऐप भरता है, जैसे [select का क्लियर बटन](./select.md#value)।

## Input

ट्रिगर combobox की पंक्ति में एक टेक्स्ट इनपुट है (इसके `class` और `style`: फ़ील्ड का बॉर्डर और फ़िल्. ), जिसके पहले ऐप का `prefix` होता है (चुने गए आइटम चिप्स के रूप में, एक आइकन) और उसके बाद क्लियर बटन, ऐप का `triggerButton` (एक शेवरॉन) और `suffix` होते हैं।

- टाइप करने से सूची खुलती है और आइटम शीर्षक के आधार पर फ़िल्टर होते हैं, अक्षरों के केस की अनदेखी करते हुए; कुछ भी मेल न खाने पर `empty` दिखता है। Down और Up भी इसे खोलते हैं, ट्रिगर बटन पर प्रेस इसे खोलता और बंद करता है, और टच स्क्रीन पर इनपुट पर टैप इसे खोलता है।
- एक मान के साथ, इनपुट चुने गए आइटम का शीर्षक दिखाता है (कोई न होने पर `placeholder`)। इनपुट को फ़ोकस मिलने पर वह चयनित हो जाता है, इसलिए जो टाइप किया जाए वह उसकी जगह ले लेता है।
- `multiple` के साथ, इनपुट क्वेरी दिखाता है; चुने गए आइटम ऐप दिखाता है, `prefix` में या combobox के बगल में।

क्वेरी combobox की अपनी होती है, जो हर बार खुलने पर `defaultQuery` से शुरू होती है (नहीं तो खाली), या `query` के साथ ऐप की: `onQueryChange({ query })` बताता है कि क्या टाइप किया गया, और ऐप उसका अनुसरण करने के लिए `query` सेट करता है, ताकि अपने ढंग से फ़िल्टर करे या शुरुआती बिंदु सुझाए।

## Footer

`footer` पंक्तियों के नीचे की सामग्री है, जो अपने अलग हिस्से में होती है (`footerClass`, `footerStyle`): एक कार्रवाई ("Manage tags"), एक गिनती, एक संकेत। पंक्तियाँ स्क्रॉल होने पर भी यह अपनी जगह पर रहता है।

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | आइटम, क्रम से। |
| `multiple` | `.multiple(..)` | `boolean` | `false` | एक चुनाव आइटम को मान में टॉगल करता है और सूची खुली रहती है। |
| `value` | `.value(..)` | `string[]` | कोई नहीं | चुने गए आइटमों के मान, जिनका स्वामी ऐप है। |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | शुरुआती मान, `value` के बिना। |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | खुली होने की स्थिति, ऐप की या combobox की अपनी। |
| `placeholder` | `.placeholder(..)` | `string` | कोई नहीं | इनपुट का प्लेसहोल्डर, जब तक वह खाली है। |
| `query` | `.query(..)` | `string` | कोई नहीं | क्वेरी, जिसका स्वामी ऐप है। |
| `defaultQuery` | `.default_query(..)` | `string` | कोई नहीं | वह क्वेरी जिससे हर बार खुलना शुरू होता है, `query` के बिना। |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | किसी आइटम के चुने रहने तक एक क्लियर बटन; प्रेस करने पर मान खाली हो जाता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | यह बंद रहता है और न प्रेस लेता है, न कीबोर्ड फ़ोकस। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | चुनाव किस बारे में है, स्क्रीन रीडर के लिए। |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | `Select` के अनुसार | `"bottom"`, `"start"`, 0, 0 | डेस्कटॉप: पॉपअप फ़ील्ड के सापेक्ष कहाँ जाता है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पॉपअप (डेस्कटॉप) या शीट (टच स्क्रीन)। |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | शीट के पीछे का बैकड्रॉप। |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | सूची, यानी पंक्तियों का स्क्रॉल व्यू। |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर आइटम की पंक्ति: हाइलाइट होने पर `focus:`, चुने होने पर `selected:`, न चुने जा सकने पर `disabled:`। |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर सेक्शन का हेडर। |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | कोई नहीं | इनपुट: संपादन के दौरान `focus:`, combobox के साथ `disabled:`। |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | फ़ुटर, पंक्तियों के नीचे। |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | क्लियर बटन (`cleanable`)। |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | कोई नहीं | क्लियर बटन की सामग्री। |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्लियर बटन को क्या कहते हैं। |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | कोई नहीं | इनपुट के बाद एक बटन (एक शेवरॉन): प्रेस करने पर सूची खुलती और बंद होती है। |
| `prefix` | `.prefix(..)` | `JSX.Element` | कोई नहीं | इनपुट से पहले की सामग्री: चिप्स, एक आइकन। |
| `suffix` | `.suffix(..)` | `JSX.Element` | कोई नहीं | ट्रिगर बटन के बाद की सामग्री। |
| `empty` | `.empty(..)` | `JSX.Element` | कोई नहीं | जब कोई आइटम न दिखे तब सूची क्या दिखाती है। |
| `footer` | `.footer(..)` | `JSX.Element` | कोई नहीं | पंक्तियों के नीचे क्या दिखता है। |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | कोई नहीं | किसी आइटम की पंक्ति, जिसे ऐप इस आधार पर बनाता है कि आइटम क्या है, उसकी स्थिति के आधार पर कभी नहीं: सामग्री पंक्ति के `group-focus:`, `group-selected:` और `group-disabled:` (`itemClass` में `group`) का अनुसरण करती है, इसलिए हाइलाइट का हटना या टॉगल होना कुछ दोबारा नहीं बनाता; अन्यथा आइटम का शीर्षक। |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | कोई नहीं | किसी सेक्शन का हेडर, जिसे ऐप बनाता है; अन्यथा उसका शीर्षक। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | फ़ील्ड: प्रीफ़िक्स, इनपुट, बटनों और सफ़िक्स की पंक्ति; सूची उतनी ही चौड़ी होती है। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | मान बदला (एक चुनाव, एक टॉगल, क्लियर बटन): `{ value }`, चुने गए आइटमों के मान। इसका अनुसरण करने के लिए `value` सेट करें। |
| `onConfirm` | `.on_confirm(\|value\| ..)` | सूची बंद हुई: `{ value }` जैसा वह तब है, हर बार खुलने पर एक बार। |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | उपयोगकर्ता ने इनपुट में टाइप किया: `{ query }`। इसका अनुसरण करने के लिए `query` सेट करें। |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | सूची खुली या बंद हुई, कारण (`{ open, reason }`) के साथ। इसका अनुसरण करने के लिए `open` सेट करें। |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | सूची दिखाई गई है, या हट गई है। |
| `onCancel` | `.on_cancel(..)` | उपयोगकर्ता ने सूची को ऐसे चुनाव के बिना बंद किया जो उसे बंद करता है (Escape या back, बाहर या बैकड्रॉप पर प्रेस)। |

ये इस क्रम में आते हैं: चुनाव के लिए `onChange`, या चुनाव के बिना बंद होने के लिए `onCancel`, फिर `onOpenChange`, फिर सूची बंद होते समय `onConfirm`, फिर सूची के दिखने या हटने पर `onOpen` या `onClose`।

## Parts

| Part | कहाँ | स्टाइल किया जाता है |
|---|---|---|
| फ़ील्ड | combobox का व्यू, एक पंक्ति | `class`, `style` |
| प्रीफ़िक्स | फ़ील्ड, पहले | ऐप का अपना एलिमेंट (`prefix`) |
| इनपुट | फ़ील्ड, प्रीफ़िक्स के बाद | `inputClass`, `inputStyle`, `placeholder` |
| क्लियर बटन | फ़ील्ड, इनपुट के बाद (`cleanable`, किसी आइटम के चुने रहने तक) | `clearButtonClass`, `clearButtonStyle`; इसकी सामग्री `clearButton` |
| ट्रिगर बटन | फ़ील्ड, क्लियर बटन के बाद | ऐप का अपना एलिमेंट (`triggerButton`) |
| सफ़िक्स | फ़ील्ड, अंत में | ऐप का अपना एलिमेंट (`suffix`) |
| पॉपअप या शीट | सबके ऊपर, फ़ील्ड के नीचे (डेस्कटॉप) या निचले हिस्से में (टच स्क्रीन) | `popupClass`, `popupStyle` |
| बैकड्रॉप | शीट के पीछे (टच स्क्रीन) | `backdropClass`, `backdropStyle` |
| सूची | पॉपअप | `listClass`, `listStyle` |
| सेक्शन का हेडर | सूची, अपने आइटमों से पहले | `groupClass`, `groupStyle`, `renderGroup` |
| आइटम की पंक्ति | सूची | `itemClass`, `itemStyle`, `renderItem` (भीतर `group-focus:`, `group-selected:`, `group-disabled:`, `itemClass` में `group` के अंतर्गत) |
| खाली स्थिति | पॉपअप, जब कोई आइटम न दिखे | इसका अपना एलिमेंट (`empty`) |
| फ़ुटर | पॉपअप, सबसे अंत में | `footerClass`, `footerStyle`; इसकी सामग्री `footer` |

## Keyboard

जब तक इनपुट के पास फ़ोकस रहता है, कुंजियाँ select की होती हैं ([Keyboard](./select.md#keyboard) देखें), इन अंतरों के साथ: अक्षर और अंक टाइपअहेड की जगह इनपुट में टाइप होते हैं, जो सूची को फ़िल्टर करते हैं; Down और Up बंद सूची को खोलते हैं; `multiple` के साथ Return हाइलाइट किए गए आइटम को टॉगल करता है और सूची खुली रखता है; Mac पर Cmd+Return (अन्यत्र Ctrl+Return) उसे बंद करता है और पुष्टि करता है। डेस्कटॉप पर सूची बंद होने पर, इनपुट के पास फ़ोकस बना रहता है।

## Accessibility

- स्क्रीन रीडर के लिए इनपुट एक combobox है: उसका लेबल `accessibilityLabel` है, उसका मान चुने गए आइटमों के शीर्षक हैं, जो कॉमा से जुड़े होते हैं, और वह बताता है कि सूची फैली हुई है या नहीं। `disabled` उसे धुंधला कर देता है।
- सूची एक listbox है और हर पंक्ति एक option, जिसका नाम उसका शीर्षक है; चुने गए options चयनित होते हैं और अक्षम option धुंधला। सेक्शनों के हेडर हेडर होते हैं।
- क्लियर बटन एक बटन है जिसका नाम `clearButtonAccessibilityLabel` से तय होता है; वह Tab का पड़ाव नहीं है। ट्रिगर बटन स्क्रीन रीडर से छिपा होता है, क्योंकि इनपुट बताता है कि सूची खुली है या नहीं, और वह भी Tab का पड़ाव नहीं है।

सामान्य रूप से लेबल, भूमिकाओं और घोषणाओं के लिए [Accessibility](../docs/accessibility.md) देखें।
