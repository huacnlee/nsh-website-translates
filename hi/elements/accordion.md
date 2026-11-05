---
title: "Accordion"
description: "Accordion और इसके हिस्से: ऐसे स्टैक किए गए सेक्शन जो अपने शीर्षकों के नीचे विस्तृत और संक्षिप्त होते हैं, एक बार में एक या एक साथ कई, ऐप की value से खोले जाते हैं, अनुरोध पर स्प्रिंग जैसी ऊँचाई के साथ प्रकट होते हैं, और हर रूप-रंग ऐप का अपना होता है।"
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

Accordion ऐसे सेक्शन को एक के नीचे एक रखता है जो अपने शीर्षकों के नीचे खुलते और बंद होते हैं: FAQ के प्रश्न, सेटिंग पेज के समूह, चेकआउट के चरण। इसके पाँच भाग हैं, जिनमें से हर भाग व्यवहार का एक हिस्सा संभालता है और रूप-रंग का कोई नहीं:

- `Accordion`, स्टैक: यह ऐप के `value` को, यानी खुले आइटमों के मानों को, रखता है और अगला मान `onChange` से रिपोर्ट करता है। एक समय में एक आइटम खुलता है, या `multiple` के साथ कई।
- `AccordionItem`, एक सेक्शन, जिसकी पहचान उसका `value` है। जब तक accordion का `value` उसे रखता है, वह खुला रहता है।
- `AccordionHeader`, आइटम का शीर्षक, जो एक `level` है और जिसे स्क्रीन रीडर बोलकर बताते हैं।
- `AccordionTrigger`, शीर्षक का वह बटन जो अपने आइटम को खोलता और बंद करता है, और बताता है कि वह खुला है या नहीं।
- `AccordionPanel`, आइटम की सामग्री, जो आइटम के खुले रहने तक दिखती है; `reveal` के साथ इसकी ऊँचाई स्प्रिंग की तरह खुलती और बंद होती है।

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

ये भाग [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` crate है। मान ऐप का होता है: ट्रिगर का प्रेस `onChange` के साथ अगला `value` रिपोर्ट करता है, और accordion उन आइटमों को खोलता है जिनके मान ऐप वापस देता है। हर भाग अपने आसपास के भाग को खुद ढूँढ लेता है, इसलिए ऐप उन्हें खुलकर व्यवस्थित कर सकता है: आइटमों के बीच डिवाइडर, शीर्षक में बैज, या टाइटल से पहले आइकन। Rust में `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()` और `accordion_panel()` इन्हें बनाते हैं; हर prop के लिए एक सेटर होता है और भीतर की सामग्री के लिए `.child(..)` होता है।

## Props

<a id="accordion-1"></a>

### Accordion

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | खुले आइटमों के `value`। ये ऐप के होते हैं: ट्रिगर का प्रेस अगले मान `onChange` से रिपोर्ट करता है, और accordion वही आइटम दिखाता है जो ऐप वापस देता है। |
| `multiple` | `.multiple(..)` | `boolean` | `false` | कई आइटम एक साथ खुले रह सकते हैं: एक को खोलने पर बाकी खुले रहते हैं। इसके बिना, किसी आइटम को खोलने पर जो खुला था वह बंद हो जाता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | हर आइटम disabled हो जाता है: कोई ट्रिगर प्रेस नहीं लेता, और स्क्रीन रीडर हर एक को dimmed बताते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | आइटम, और वह सब जो ऐप उनके बीच रखता है (डिवाइडर)। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्टैक का लेआउट और रूप: आइटमों के चारों ओर कार्ड, उनके बीच की दूरी। |

### AccordionItem

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | आवश्यक | जो accordion के `value` में आइटम की पहचान कराता है: ऐप की अपनी id, कभी उसका टाइटल नहीं, क्योंकि टाइटल भाषा के साथ बदलता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | इसका ट्रिगर प्रेस नहीं लेता, और स्क्रीन रीडर इसे dimmed बताते हैं। यह वैसे ही खुला या बंद रहता है जैसा accordion का `value` कहता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | आइटम का हेडर और पैनल, और वह सब जो ऐप इसमें रखता है। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | सेक्शन: उसके नीचे डिवाइडर, उसके चारों ओर कार्ड। |

### AccordionHeader

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | पेज के शीर्षकों में इस शीर्षक का स्तर, स्क्रीन रीडर के लिए (1 सबसे ऊपर)। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | आइटम का ट्रिगर, और वह सब जो हेडर में और हो (बैज, अपना कोई एक्शन)। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | शीर्षक का लेआउट। |

### AccordionTrigger

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | आइटम के खुले रहने पर ट्रिगर की स्टाइल, `aria-expanded:` क्लासों के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | जो स्क्रीन रीडर बोलते हैं, जब children में ऐसा कोई टेक्स्ट न हो जो यह बताए। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | टाइटल और शेवरॉन; भीतर की `group-aria-expanded:` क्लासें ट्रिगर का अनुसरण करती हैं, इसके लिए ट्रिगर के `class` पर `group` लगाएँ। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | खुद ट्रिगर: वह पंक्ति जिसे उपयोगकर्ता दबाता है। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | दबे होने, hover, फ़ोकस या disabled होने पर ट्रिगर की स्टाइल, `<state>:` क्लासों के रूप में। |

### AccordionPanel

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | `Collapsible` की तरह रिवील के साथ खुलता और बंद होता है: पैनल अपनी सामग्री को क्लिप करता है और उसकी ऊँचाई शून्य से सामग्री की अपनी ऊँचाई तक और वापस स्प्रिंग होती है, क्रिटिकली डैम्प्ड (लगभग 265 ms, बिना ओवरशूट), और उसके बाद के आइटम साथ खिसकते हैं। reduced motion में यह तुरंत खुलता और बंद होता है। |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | आइटम बंद होने पर सामग्री ट्री में बनी रहती है, नज़र से, कीबोर्ड फ़ोकस से और स्क्रीन रीडर से दूर: वीडियो अपनी जगह रखता है, वेब व्यू अपना पेज। इसके बिना, पैनल बंद होते समय (रिवील के उसे बंद कर देने के बाद) सामग्री ट्री से हट जाती है और जैसी थी वैसी ही लौट आती है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर इस region को क्या कहते हैं: आम तौर पर आइटम का टाइटल, जैसा उसका हेडर बताता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | सामग्री। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | region का लेआउट और रूप। `reveal` के साथ पैनल बंद होने पर भी लेआउट में रहता है, शून्य ऊँचाई का, इसलिए उसकी padding और borders उसकी सामग्री के view पर लगाएँ। |

## Events

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | किसी ट्रिगर को दबाया गया: टैप, क्लिक, कीबोर्ड फ़ोकस होने पर Space या Return, या स्क्रीन रीडर का एक्टिवेशन। `value` खुले आइटमों के वे मान हैं जैसे वे होते: खुले आइटम का मान उसमें से हट जाता है, बंद आइटम का मान अंत में जुड़ जाता है, या `multiple` के बिना, उसकी जगह ले लेता है। यह कुछ भी बदलने से पहले चलता है: इसका अनुसरण करने के लिए `value` सेट करें। |

## Parts

| भाग | भीतर | स्टाइल | स्टेट |
|---|---|---|---|
| स्टैक | | `Accordion` के `class`, `style` | |
| एक आइटम | स्टैक | `AccordionItem` के `class`, `style` | ऐप का मान |
| शीर्षक | आइटम | `AccordionHeader` के `class`, `style` | |
| ट्रिगर | शीर्षक | `AccordionTrigger` के `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (या `expandedStyle`, `disabledStyle`, ...) |
| टाइटल और शेवरॉन | ट्रिगर | उनके अपने एलिमेंट (`children`) | `group-aria-expanded:`, `group-disabled:` ट्रिगर के `class` पर `group` के साथ |
| पैनल | आइटम, शीर्षक के बाद | `AccordionPanel` के `class`, `style` | |
| सामग्री | पैनल | इसके अपने एलिमेंट (`children`) | |

`reveal` के बिना, बंद पैनल लेआउट से बाहर रहता है और उसकी सामग्री ट्री से बाहर। `reveal` के साथ, यह बदलाव उस commit का लेआउट एनिमेशन होता है जो `value` को बदलता है (`LayoutAnimation.configureNext` की तरह, नेटिव रूप से चलता है, इसलिए इसके चलते समय कोई JavaScript नहीं चलता): खुलता पैनल शून्य से अपनी सामग्री की ऊँचाई तक बढ़ता है, बंद होता पैनल वापस सिकुड़ता है, दोनों एक ही स्प्रिंग में, और उनके बाद के आइटम साथ खिसकते हैं। ऐप का एक ट्रांज़िशन भी इसके साथ चलता है: शेवरॉन घूमता है (`transition-transform group-aria-expanded:rotate-180`)।

## Disabled

disabled आइटम का ट्रिगर प्रेस नहीं लेता, और स्क्रीन रीडर उसे dimmed बताते हैं; ट्रिगर पर `disabled:` क्लासें और उसके भीतर `group-disabled:` उसका अनुसरण करती हैं। accordion का `disabled` हर आइटम को disabled कर देता है। disabled आइटम फिर भी वही दिखाता है जो ऐप का `value` कहता है: ऐप उसे खोल सकता है।

## Accessibility

- स्टैक एक group है, हर हेडर अपने `level` का शीर्षक है, और हर ट्रिगर उसके भीतर एक बटन है जो बताता है कि उसका आइटम expanded है या नहीं। स्क्रीन रीडर एक शीर्षक से दूसरे शीर्षक पर जा सकते हैं।
- खुला पैनल एक region है, जिसका नाम `accessibilityLabel` से तय होता है; बंद पैनल स्क्रीन रीडर से छिपा रहता है, रखी गई सामग्री समेत।
- खुले आइटम का रूप ऐप तय करता है, और उसे केवल रंग पर निर्भर नहीं होना चाहिए: शेवरॉन को घुमाएँ, जैसा उदाहरण करते हैं।

लेबल, रोल और घोषणाओं के सामान्य नियमों के लिए [Accessibility](../docs/accessibility.md) देखें।

## Keyboard

जहाँ प्रेस लेने वाले views कीबोर्ड फ़ोकस के पड़ाव होते हैं (macOS और वेब), वहाँ हर ट्रिगर एक पड़ाव है, पेज के क्रम में, और Space तथा Return उसे दबाते हैं। disabled ट्रिगर छोड़ दिए जाते हैं, और बंद पैनल की सामग्री भी। Tab ट्रिगर से उसके खुले पैनल के कंट्रोल पर और फिर अगले ट्रिगर पर ले जाता है।

## Platform notes

- हर प्लेटफ़ॉर्म खुले आइटम का पैनल उसके शीर्षक के नीचे दिखाता है और बंद पैनल को लेआउट से बाहर रखता है (`reveal` के साथ शून्य ऊँचाई का)।
- `reveal` के साथ, हर प्लेटफ़ॉर्म पैनलों की ऊँचाई अपने एनिमेटर पर स्प्रिंग करता है (iOS, Android, macOS, Windows, Linux, GPUI और वेब), और जब सिस्टम reduced motion माँगता है तब उन्हें तुरंत खोलता और बंद करता है।
- हर प्लेटफ़ॉर्म का स्क्रीन रीडर शीर्षकों को पढ़ते समय शीर्षक और उसका स्तर सुनाता है, और उसके भीतर के ट्रिगर को expanded स्टेट वाले बटन के रूप में; iOS पर VoiceOver ट्रिगर को खुद पढ़ता है।
- iOS, Android और Mac Catalyst: ट्रिगर का प्रेस एक टैप है। डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: एक क्लिक, और macOS तथा वेब पर फ़ोकस किए गए ट्रिगर पर Space या Return।
