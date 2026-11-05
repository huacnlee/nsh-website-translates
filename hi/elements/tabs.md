---
title: "Tabs"
description: "Tab और Tabs: टैब सूची के टैब और स्वयं सूची। हर Tab प्रेस, कीबोर्ड सक्रियण, disabled स्थिति, और स्क्रीन रीडर के लिए अपनी role और selected स्थिति का स्वामित्व रखता है; सूची उनका समूह है, जिसमें एक indicator होता है जो चयनित टैब का नेटिव रूप से अनुसरण करता है; रूप-रंग, value और हर टैब जो सामग्री दिखाता है, वे ऐप के अधीन हैं।"
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# Tabs

Tabs एक ही जगह के सेक्शन के बीच स्विच करते हैं: किसी प्रोजेक्ट का ओवरव्यू और एक्टिविटी, या किसी दस्तावेज़ के व्यू।
हर `Tab` एक टैब का व्यवहार संभालता है: प्रेस, कीबोर्ड एक्टिवेशन, disabled स्थिति, और स्क्रीन रीडर के लिए टैब रोल और उसकी selected स्थिति। इनके चारों ओर का `Tabs` टैब लिस्ट है, जिसे स्क्रीन रीडर एक सेट के रूप में बोलते हैं। लुक ऐप का है: टैब के अपने कोई रंग, साइज़ या लेबल नहीं होते। उसके चिल्ड्रन ऐप का लेबल हैं, और टैब पर `selected:` क्लासेस, या उसके अंदर की चीज़ों पर `group-selected:` क्लासेस, उसकी स्थिति के अनुसार लागू होती हैं। हर सेक्शन का कंटेंट भी ऐप का है: लिस्ट के बगल में वही सेक्शन दिखता है जिसे उसकी value नाम देती है। लिस्ट का इंडिकेटर, यानी ऐप द्वारा स्टाइल की गई अंडरलाइन या पिल, selected टैब पर बैठता है और अगले टैब तक नेटिव रूप से सरकता है ([Indicator](#indicator))।

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` और `Tabs` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` crate है। value ऐप की है: लिस्ट में कोई value नहीं होती। हर टैब को बताया जाता है कि वह selected है या नहीं; प्रेस `onPress` रिपोर्ट करता है, ऐप उसकी value सेट करती है और वह सेक्शन दिखाती है, और हर टैब वही `selected` दिखाता है जो ऐप वापस देती है। लिस्ट और टैब के कोने कॉन्सेंट्रिक हैं: लिस्ट की पैडिंग (`p-1`) `radius.lg` और `radius` का अंतर है। selected टैब का फ़िल लिस्ट का इंडिकेटर है (`indicatorClass`, उस पैडिंग के अंदर: `inset-y-1`), जो ऐप द्वारा चुने गए टैब तक स्प्रिंग की तरह जाता है। Rust में `tab()` और `tabs()` इन्हें बनाते हैं, जिनमें हर prop के लिए एक सेटर (`.selected(..)`), हर इवेंट के लिए एक लिसनर (`.on_press(..)`), टाइप्ड स्टाइल मेथड और उनके कंटेंट के लिए `.child(..)` होता है।

## Props

### Tab

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | अपनी लिस्ट का मौजूदा टैब: स्क्रीन रीडर इसे selected बोलते हैं, और `selected:` स्टाइल लागू होती हैं। प्रेस `onPress` रिपोर्ट करता है; टैब वही value दिखाता है जो ऐप वापस देती है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस और प्रेस फ़ीडबैक नहीं; `disabled:` स्टाइल लागू होती हैं, और स्क्रीन रीडर इसे dimmed बोलते हैं। |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | selected और not disabled होने पर टैब की स्टाइल, `selected:` क्लासेस के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलते हैं: टैब का नाम, जब उसके चिल्ड्रन में ऐसा कोई टेक्स्ट न हो जो यह बताए (जैसे आइकन)। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ऐप का लेबल, आइकन या बैज, जिसे स्क्रीन रीडर बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | टैब खुद: उसके लेबल के चारों ओर की सतह। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | pressed, hovered, focused या disabled होने पर टैब की स्टाइल, `<state>:` क्लासेस के रूप में। |

<a id="tabs-1"></a>

### Tabs

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | कोई नहीं | selected टैब पर इंडिकेटर की Tailwind क्लासेस: उसका लुक और लिस्ट के आर-पार उसकी जगह (रो में अंडरलाइन के लिए `bottom-0 h-0.5`, पिल के लिए `inset-y-1`)। लिस्ट के अनुदिश यह selected टैब को कवर करता है, उस अक्ष पर अपने मार्जिन के अंदर। `indicatorClass` या `indicatorStyle` होने पर लिस्ट में एक इंडिकेटर होता है। |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | इंडिकेटर की स्टाइल, `indicatorClass` के ऊपर। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | लिस्ट के टैब, और उनके बीच ऐप जो कुछ भी रखे। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | लिस्ट का लेआउट और लुक: डिफ़ॉल्ट रूप से कॉलम, रो के लिए `flex-row`। |

## Events

| इवेंट | Rust | विवरण |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | टैब प्रेस किया गया: टैप, क्लिक, कीबोर्ड फ़ोकस होने पर Space या Return, या स्क्रीन रीडर का एक्टिवेशन; या उसकी लिस्ट की एक एरो की, Home या End ने कीबोर्ड फ़ोकस को उस पर पहुँचाया। यह कुछ भी बदलने से पहले चलता है: टैब वही `selected` दिखाता है जो ऐप वापस देती है। |

selected टैब भी अपने प्रेस रिपोर्ट करता है, ताकि ऐप दूसरे प्रेस पर कोई कार्रवाई कर सके (जैसे अपने सेक्शन को ऊपर तक स्क्रॉल करना)।
disabled टैब कुछ रिपोर्ट नहीं करता।

## Parts

| पार्ट | अंदर | स्टाइल का तरीका | स्थितियाँ |
|---|---|---|---|
| लिस्ट | | `Tabs` के `class`, `style` | |
| इंडिकेटर | लिस्ट, टैब के पीछे | `indicatorClass`, `indicatorStyle` | selected टैब पर |
| टैब | लिस्ट | `Tab` के `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (या `selectedStyle`, `disabledStyle`, ...) |
| लेबल | टैब | उसके अपने एलिमेंट (`children`) | `group-selected:`, `group-disabled:` और अन्य `group-*:` वैरिएंट, टैब के `class` पर `group` के साथ |
| सेक्शन का कंटेंट | लिस्ट के बगल में | ऐप के एलिमेंट | ऐप की value |

selected टैब को उसकी अपनी सतह से दिखाएँ: फ़िल, गहरा लेबल, भारी वेट ([Design guides](../docs/design-guides.md#interaction-states) देखें)।

## Indicator

selected टैब के नीचे की अंडरलाइन, उसके पीछे की पिल या सेगमेंटेड कंट्रोल का उभरा हुआ सेगमेंट लिस्ट का इंडिकेटर है: एक व्यू जिसे ऐप `indicatorClass` और `indicatorStyle` से स्टाइल करती है, जो टैब के पीछे बनता है और लिस्ट में absolutely positioned होता है। Native Shell हर लेआउट के बाद इसे selected टैब पर रखता है। लिस्ट के अनुदिश (रो की चौड़ाई, कॉलम की ऊँचाई) यह उस टैब को कवर करता है, उस अक्ष पर इंडिकेटर के अपने मार्जिन के अंदर (टैब से छोटी अंडरलाइन के लिए `mx-3`); लिस्ट के आर-पार उसकी क्लासेस उसकी जगह तय करती हैं:

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

जब ऐप कोई दूसरा टैब चुनती है, इंडिकेटर नेटिव रूप से वहाँ स्प्रिंग की तरह जाता है, जैसे GPUI Kit का tab bar indicator; reduced motion में वह तुरंत चला जाता है। जब कोई टैब selected नहीं होता तो यह छिपा रहता है; जब कई होते हैं तो यह पहले पर रहता है। रीसाइज़ या किसी टैब की चौड़ाई में बदलाव इसे उसी फ़्रेम में टैब के साथ सरका देता है। इंडिकेटर को किसी लेआउट इवेंट या ऐप के किसी कोड की ज़रूरत नहीं: selected टैब वही है जिसका `selected` true है। स्क्रॉल होने वाली लिस्ट में स्क्रॉल व्यू `Tabs` के चारों ओर जाता है, और इंडिकेटर टैब के साथ स्क्रॉल होता है।

## Disabled

disabled टैब कोई प्रेस नहीं लेता, और स्क्रीन रीडर उसे dimmed बोलते हैं। उसकी `disabled:` क्लासेस उसकी `selected:` क्लासेस के ऊपर लागू होती हैं, और उसके अंदर की `group-disabled:` क्लासेस उसका अनुसरण करती हैं:

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

## Accessibility

- स्क्रीन रीडर के लिए टैब एक एलिमेंट है, जिसका रोल `"tab"` है और साथ में उसकी selected स्थिति। उसका लेबल उसके चिल्ड्रन का टेक्स्ट है, या `accessibilityLabel`।
- `Tabs` का रोल `"tablist"` है: स्क्रीन रीडर उसके अंदर के टैब को एक सेट के रूप में सुनाते हैं, हर टैब फिर भी अपना एक अलग एलिमेंट रहता है।
- `disabled` को वैसे ही बोला जाता है जैसे प्लेटफ़ॉर्म बोलता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।
- macOS और वेब पर लिस्ट कीबोर्ड फ़ोकस का एक स्टॉप है, और एरो की उसके टैब के बीच चलती हैं (नीचे देखें)।
- इंडिकेटर स्क्रीन रीडर से छिपा है और फ़ोकस नहीं लेता: लिस्ट के एलिमेंट केवल टैब हैं।

सामान्य रूप से लेबल, रोल और एनाउंसमेंट के लिए [Accessibility](../docs/accessibility.md) देखें।

## Keyboard

macOS और वेब पर, जहाँ Tab उन व्यू तक पहुँचता है जो प्रेस लेते हैं, `Tabs` लिस्ट [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) का पालन करती है:

| की | क्या करती है |
|---|---|
| Tab, Shift+Tab | लिस्ट में selected टैब पर प्रवेश कराती है (कोई selected न हो तो पहला टैब जो disabled नहीं है), और एक ही चरण में उससे बाहर ले जाती है। |
| Right, Down | फ़ोकस को अगले टैब पर ले जाती है, आख़िरी से पहले पर। |
| Left, Up | फ़ोकस को पिछले टैब पर ले जाती है, पहले से आख़िरी पर। |
| Home, End | फ़ोकस को पहले या आख़िरी टैब पर ले जाती है। |
| Space, Return | फ़ोकस वाले टैब को प्रेस करती है। |

एरो की disabled टैब को छोड़ देती हैं, और जिस टैब पर वे पहुँचती हैं वह `onPress` रिपोर्ट करता है, इसलिए फ़ोकस के चलते ही ऐप उसे select कर लेती है: सेक्शन फ़ोकस के पीछे चलता है। लिस्ट का लेआउट कुछ भी हो, एरो के दोनों जोड़े चलते हैं; लेआउट ऐप की क्लास तय करती है। right-to-left लेआउट में रो दाईं ओर से चलती है, इसलिए Left और Right की भूमिकाएँ बदल जाती हैं: Left अगले टैब पर और Right पिछले पर ले जाती है; Up, Down, Home और End अपना काम वैसे ही करते हैं। `focus:` स्टाइल दिखाती हैं कि फ़ोकस कहाँ है। `Tabs` के बाहर का `Tab` अपना एक अलग स्टॉप है।

## Platform notes

- iOS, Android और Mac Catalyst: प्रेस एक टैप है जो टैब पर ख़त्म होता है, उसके लेबल समेत।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: प्रेस एक क्लिक है। macOS और वेब पर Space और Return भी कीबोर्ड फ़ोकस वाले टैब को प्रेस करते हैं, और एरो की, Home और End उसे चलाते हैं ([Keyboard](#keyboard))।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करती है: टैब, selected टैब की सतह, इंडिकेटर और सेक्शन का कंटेंट। इंडिकेटर की गति हर प्लेटफ़ॉर्म पर एक नेटिव लेआउट एनिमेशन है।
