---
title: "Carousel"
description: "Carousel और उसके हिस्से: ऐसी स्लाइड जो एक समय में एक ही जगह दिखाई जाती हैं, और जिन्हें स्वाइप, व्हील और टचपैड से (प्लेटफ़ॉर्म की अपनी स्क्रॉलिंग पर), पिछले और अगले कंट्रोल से, पेजिनेशन से और कीबोर्ड से बदला जा सकता है, और सिरों पर भी बिना रुकावट घूमती रहती हैं। Carousel तय करता है कि कौन सी स्लाइड दिखे, साथ ही स्नैपिंग, लूपिंग, कीज़ और एक्सेसिबिलिटी भी संभालता है; दिखावट और हर लेबल ऐप का होता है।"
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

Carousel एक समय में एक ही जगह पर स्लाइड दिखाता है: किसी प्रोडक्ट की फ़ोटो, ऑनबोर्डिंग के चरण, अपने आप आगे बढ़ने वाला बैनर, या कार्ड की एक पंक्ति। `Carousel` व्यवहार को संभालता है: कौन सी स्लाइड दिखे, उनके बीच स्वाइप, पिछला और अगला कंट्रोल, पेजिनेशन, ऐरो कीज़, सिरों पर घूमकर दूसरी ओर पहुँचना, और स्क्रीन रीडर क्या बोलें। इसके हिस्से इसे कॉन्टेक्स्ट के ज़रिए ढूँढ लेते हैं, इसलिए ऐप उन्हें अपने लेआउट में जैसे चाहे सजा सकता है। रूप-रंग ऐप का अपना होता है: इसके पास अपने कोई रंग, आकार, ऐरो, डॉट या लेबल नहीं होते।

कंटेंट एक नेटिव स्क्रॉल व्यू है। उंगली, व्हील और टचपैड स्लाइडों को प्लेटफ़ॉर्म के मुख्य थ्रेड पर उसी फ़्रेम में खिसकाते हैं जिसमें पॉइंटर चलता है, और छोड़ने पर कंटेंट निकटतम स्लाइड पर स्नैप हो जाता है, हर फ़्लिंग पर एक स्लाइड। जब कंटेंट रुक जाता है, तो कैरोसेल उस स्लाइड की सूचना `onChange` से देता है। कंट्रोल, पेजिनेशन, कीज़ और ऐप का `index` कंटेंट को नेटिव रूप से उस स्लाइड तक एनिमेशन के साथ स्क्रॉल करते हैं।

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` और इसके हिस्से [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` क्रेट है। दिखाई जा रही स्लाइड ऐप की `index` है: स्वाइप, कंट्रोल या की `onChange` से अगली स्लाइड की सूचना देते हैं, और कैरोसेल उस `index` तक स्क्रॉल करता है जो ऐप वापस देता है। स्वाइप जिस स्लाइड पर रुकता है, वह तब तक दिखती रहती है जब तक ऐप अपना `onChange` नहीं दे देता: ऐप उसे `index` के रूप में वापस दे तो वह बनी रहती है, और ऐप अपना पहले वाला `index` रखे तो कंटेंट एनिमेशन के साथ ऐप की स्लाइड पर लौट आता है। `index` के बिना कैरोसेल अपनी स्लाइड ख़ुद रखता है, `defaultIndex` से। Rust में `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()` और `carousel_pagination_item()` हिस्से बनाते हैं, जिनमें हर प्रॉप के लिए एक सेटर (`.index(..)`), हर इवेंट के लिए एक लिसनर (`.on_change(..)`), टाइप्ड स्टाइल मेथड और उनके कंटेंट के लिए `.child(..)` होता है।

<a id="props"></a>

## प्रॉप्स

<a id="carousel-1"></a>

### Carousel

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | कोई नहीं | दिखाई जा रही स्लाइड, 0 से शुरू, मौजूद स्लाइडों की संख्या तक सीमित। यह ऐप की होती है: बदलावों की सूचना `onChange` से मिलती है, और नया `index` एनिमेशन के साथ वहाँ स्क्रॉल करता है। |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | शुरू में दिखाई जाने वाली स्लाइड, जब तक `index` सेट नहीं है। |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | स्लाइडें जिस दिशा में एक-दूसरे के बाद आती हैं; कैरोसेल बनते समय पढ़ा जाता है। वर्टिकल कैरोसेल की ऐरो कीज़ Up और Down होती हैं। |
| `looping` | `.looping(..)` | `boolean` | `false` | स्लाइडें घूमकर चलती हैं: आख़िरी के बाद पहली आती है और पहली से पहले आख़िरी, बिना किसी झटके के, स्वाइप, पिछला, अगला, कीज़ और ऐप के `index` सभी के लिए ([लूपिंग](#looping))। कैरोसेल बनते समय पढ़ा जाता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर कैरोसेल को क्या नाम देते हैं, एक रीजन: इसकी स्लाइडें क्या हैं (`"Featured products"`)। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | `CarouselContent`, कंट्रोल और वह सब जो ऐप उनके आसपास सजाता है। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | कैरोसेल का लेआउट: कंटेंट और कंट्रोल कहाँ जाएँ। |

### CarouselContent

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | `CarouselItem`, हर एक कंटेंट का चाइल्ड। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | व्यूपोर्ट का आकार, और स्लाइडें उसमें जो ट्रैक बनाती हैं: उनके बीच एक `gap`, और पैडिंग जो दिखाई जा रही स्लाइड के पास की स्लाइडों की झलक दिखाती है। |

### CarouselItem

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर स्लाइड को क्या नाम देते हैं, एक ग्रुप: दूसरी स्लाइडों के बीच इसकी जगह और यह क्या दिखाती है (`"2 of 5: Ocean view"`)। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | स्लाइड का कंटेंट। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | अक्ष के साथ इसका आकार (हर व्यू में एक स्लाइड के लिए `w-full`, तीन के लिए `basis-1/3`) और इसका रूप। लूप करने वाले कैरोसेल में इसका ट्रांसलेशन कैरोसेल का होता है: इसके भीतर के किसी व्यू पर `transform` लगाएँ। |

### CarouselPrevious, CarouselNext

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | कंट्रोल का नाम, जब इसके चाइल्ड में ऐसा कोई टेक्स्ट न हो जो इसे बताए (ऐरो आइकन)। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ऐप का आइकन या लेबल। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इसका रूप और स्थान: कंटेंट के बगल में, या उसके किनारे पर `absolute` करके। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | दबे होने, होवर, फ़ोकस, या किसी सिरे पर डिसेबल होने पर इसकी स्टाइल, `<state>:` क्लासेस के रूप में। |

### CarouselPagination

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर पेजिनेशन आइटमों के समूह को क्या नाम देते हैं (`"Choose a slide"`)। |
| `indicatorClass` | `.indicator_class(..)` | `string` | कोई नहीं | इंडिकेटर की Tailwind क्लासेस; यह दिखाई जा रही स्लाइड के आइटम पर एक व्यू है (डॉट के पीछे एक पिल, एक अंडरलाइन): इसका रूप और पंक्ति के आर-पार इसका स्थान (`inset-y-0`, `bottom-0 h-0.5`)। पंक्ति के साथ यह उस आइटम को घेरता है और नेटिव रूप से अगले आइटम पर स्प्रिंग करता है। |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | इंडिकेटर की स्टाइल, `indicatorClass` के ऊपर। दोनों के बिना पेजिनेशन में कोई इंडिकेटर नहीं होता। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | `CarouselPaginationItem`, और वह सब जो ऐप उनके बीच सजाता है। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पंक्ति का लेआउट (`flex-row gap-2`)। |

### CarouselPaginationItem

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | आवश्यक | यह जो स्लाइड दिखाता है, 0 से शुरू। आख़िरी स्लाइड से आगे का इंडेक्स डिसेबल होता है। |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | इसकी स्लाइड दिखने पर इसकी स्टाइल, `selected:` क्लासेस के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | यह कौन सी स्लाइड दिखाता है (`"Slide 3"`), जब इसके चाइल्ड में ऐसा कोई टेक्स्ट न हो जो यह बताए (एक डॉट)। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ऐप का डॉट, थंबनेल या नंबर। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इसका रूप; इसके भीतर की `group-selected:` क्लासेस `group` के तहत इसका अनुसरण करती हैं। |

<a id="events"></a>

## इवेंट्स

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | यूज़र दूसरी स्लाइड पर गया: स्वाइप, व्हील या टचपैड उस पर आकर रुका, या किसी कंट्रोल, पेजिनेशन आइटम या की ने उसे माँगा। `{ index }` वही स्लाइड है। ऐप से आया नया `index` कुछ रिपोर्ट नहीं करता। |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | यूज़र ने कंटेंट को ड्रैग करना शुरू किया (उंगली, टचपैड)। |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | यूज़र ने जिस कंटेंट को ड्रैग किया था वह रुक गया। |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | कीबोर्ड फ़ोकस कैरोसेल में आया: इसके अपने व्यू पर, इसके पिछले या अगले कंट्रोल पर, किसी पेजिनेशन आइटम पर, या स्लाइड के किसी फ़ोकस होने योग्य व्यू पर। इनके बीच जाने पर कुछ रिपोर्ट नहीं होता। |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | कीबोर्ड फ़ोकस कैरोसेल से बाहर गया: इसके अपने व्यू, इसके कंट्रोल, इसके पेजिनेशन आइटम और स्लाइडों के कंटेंट से। |

<a id="parts"></a>

## हिस्से

| हिस्सा | किसके भीतर | स्टाइल किससे | स्टेट्स |
|---|---|---|---|
| कैरोसेल | | `Carousel` का `class`, `style` | `focus:` |
| कंटेंट | कैरोसेल | `CarouselContent` का `class`, `style` | |
| एक स्लाइड | कंटेंट | `CarouselItem` का `class`, `style` | |
| पिछला, अगला | कैरोसेल | उनके `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| पेजिनेशन | कैरोसेल | `CarouselPagination` का `class`, `style` | |
| इंडिकेटर | पेजिनेशन | `indicatorClass`, `indicatorStyle` | |
| एक पेजिनेशन आइटम | पेजिनेशन | इसके `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## प्रति व्यू कई स्लाइडें

स्लाइड की चौड़ाई उसकी अपनी क्लास से तय होती है, इसलिए कार्डों की एक पंक्ति का मतलब है व्यूपोर्ट में कई स्लाइडें। हर स्लाइड वहीं एक स्नैप पॉइंट है जहाँ वह शुरू होती है: कंटेंट इस तरह रुकता है कि वह स्लाइड वहीं रहे जहाँ पहली स्लाइड रुकती है, इसलिए पहली से पहले की पैडिंग हर स्लाइड से पहले बनी रहती है। रेंज के अंत में जो स्लाइडें उस जगह तक नहीं पहुँच सकतीं, वे आख़िरी स्लाइड के साथ रुकती हैं, और अगला वहीं रुक जाता है। `index` पहली जगह की स्लाइड का नाम देता है; जो स्लाइडें आख़िरी के साथ रुकती हैं वे वही जगह दिखाती हैं, और वहाँ स्वाइप उनमें से पहली की सूचना देता है:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

फ़ोन की चौड़ाई पर `basis-1/2`, या `basis-[85%]`, अगले कार्ड की झलक दिखाता है। वर्टिकल कैरोसेल (`axis="vertical"`) अपनी स्लाइडों का आकार उनकी ऊँचाई से तय करता है।

<a id="looping"></a>

## लूपिंग

`looping` के साथ स्लाइडें बिना झटके के घूमती हैं: आख़िरी के बाद पहली आती है, चाहे स्वाइप किया जाए, अगला या कीज़ से आगे बढ़ा जाए, या ऐप का `index` सेट करे, बीच की स्लाइडों पर वापस रिवाइंड किए बिना। कंटेंट स्लाइडों के पहले और बाद में स्लाइडों के पूरे एक चक्कर जितनी जगह रखता है, और हर स्लाइड को वहाँ बनाता है जहाँ वह व्यू के बीच के सबसे पास हो; एनिमेशन यह काम प्लेटफ़ॉर्म के अपने फ़्रेमों पर, स्क्रॉल के साथ चलाता है। हर स्लाइड वहाँ एक ही बार होती है: स्क्रीन रीडर और पेजिनेशन उसे एक ही बार देखते हैं।

लूप तब बिना झटके का रहता है जब स्लाइडें व्यूपोर्ट और उससे एक स्लाइड और ज़्यादा को भर दें (तीन पूरी चौड़ाई की स्लाइडें, या पाँच तिहाई चौड़ाई की)। इससे कम हों तो पिछला, अगला और कीज़ फिर भी घूमकर जाते हैं, बीच की स्लाइडों के आर-पार वापस स्क्रॉल करते हुए।

<a id="slides-that-move-on-by-themselves"></a>

## अपने आप आगे बढ़ने वाली स्लाइडें

आगे बढ़ता बैनर ऐप का काम है: एक टाइमर जो `index` सेट करता है। कैरोसेल बताता है कि यूज़र कब उसके साथ है, ताकि टाइमर तब रुक जाए, जैसा [WAI-ARIA कैरोसेल पैटर्न](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) माँगता है:
ड्रैग के आसपास `onDragStart` / `onDragEnd`, कीबोर्ड फ़ोकस के कैरोसेल में रहते समय `onFocus` / `onBlur` (उस पर, उसके कंट्रोल, उसके पेजिनेशन या स्लाइडों के कंटेंट पर), और उसके आसपास के किसी व्यू पर पॉइंटर। रिड्यूस्ड मोशन में इसे बंद रखें, और यूज़र को इसे रोकने वाला एक बटन दें (रोटेशन कंट्रोल):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

इफ़ेक्ट में `index()` को पढ़ने से हर बदलाव के बाद, यूज़र के बदलाव के बाद भी, पूरा अंतराल फिर से शुरू हो जाता है। `looping` के साथ, आख़िरी स्लाइड से पहली पर जाना सीम के आर-पार आगे की ओर बढ़ता है।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- कैरोसेल एक रीजन है जिसे `accessibilityLabel` नाम देता है; हर स्लाइड एक ग्रुप है जिसे उसका अपना नाम मिलता है (दूसरी स्लाइडों के बीच उसकी जगह और वह क्या दिखाती है)।
- पिछला और अगला बटन हैं, जो सिरों पर डिसेबल रहते हैं जब तक कैरोसेल लूप न करे; हर पेजिनेशन आइटम एक बटन है, जो उसकी स्लाइड दिखने पर सेलेक्टेड रहता है।
- हर लेबल ऐप का होता है, ऐप की भाषा में।
- लूप करने वाले कैरोसेल की स्लाइडें हर एक वहाँ एक ही बार होती हैं, चाहे वे कहीं भी बनाई गई हों।

सामान्य रूप से लेबल, रोल और अनाउंसमेंट के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="keyboard"></a>

## कीबोर्ड

macOS और वेब पर, जहाँ Tab प्रेस लेने वाले व्यूज़ तक पहुँचता है, कैरोसेल कीबोर्ड फ़ोकस का एक पड़ाव है, और उसके कंट्रोल और पेजिनेशन आइटम भी। जब इनमें से किसी पर फ़ोकस हो:

| की | क्या करती है |
|---|---|
| Left, Right (वर्टिकल होने पर Up, Down) | पिछली या अगली स्लाइड पर जाती है, लूपिंग में सिरों के पार घूमकर। |
| Home, End | पहली या आख़िरी स्लाइड पर जाती है। |
| Space, Return | फ़ोकस वाले कंट्रोल या पेजिनेशन आइटम को दबाती है। |

राइट-टू-लेफ़्ट लेआउट में हॉरिज़ॉन्टल कैरोसेल की स्लाइडें दाईं ओर से चलती हैं, इसलिए Left अगली स्लाइड पर और Right पिछली पर ले जाता है; वर्टिकल कैरोसेल में Up और Down वैसे ही रहते हैं। जो कंट्रोल फ़ोकस रहते हुए डिसेबल हो जाए (आख़िरी स्लाइड पर अगला), वह फ़ोकस कैरोसेल को सौंप देता है, ताकि कीज़ वहाँ काम करती रहें। स्लाइडों में ऐप के फ़ोकस होने योग्य व्यूज़ अपनी कीज़ रखते हैं: इनपुट के ऐरो उसके कर्सर को चलाते हैं।

<a id="motion"></a>

## मोशन

- स्वाइप, व्हील और टचपैड स्लाइडों को पॉइंटर के साथ, उसी फ़्रेम में चलाते हैं: प्लेटफ़ॉर्म उन्हें स्क्रॉल करता है।
- छोड़ने पर कंटेंट निकटतम स्लाइड तक सरकता है, हर फ़्लिंग पर एक स्लाइड, जैसा प्लेटफ़ॉर्म स्नैप करता है।
- पिछला, अगला, पेजिनेशन आइटम, कोई की और ऐप का `index` कंटेंट को स्लाइड तक एनिमेशन के साथ स्क्रॉल करते हैं; रिड्यूस्ड मोशन में तुरंत।
- पेजिनेशन का इंडिकेटर दिखाई जा रही स्लाइड के आइटम तक स्प्रिंग करता है; रिड्यूस्ड मोशन में वह तुरंत चलता है।
- `looping` आख़िरी स्लाइड से पहली तक सीम के आर-पार एक कदम आगे जाता है; कंटेंट के रुकने के बाद वह बिना एनिमेशन के पूरे एक चक्कर पीछे चला जाता है, जिससे स्क्रीन पर कुछ नहीं बदलता।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: उंगली स्लाइडों को स्वाइप करती है; टैप कंट्रोल को दबाता है।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: व्हील और टचपैड स्लाइडों को स्क्रॉल करते हैं, और क्लिक कंट्रोल को दबाता है। कंटेंट पर माउस ड्रैग ऐप का होता है, जैसा वहाँ हर स्क्रॉल व्यू पर होता है।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है: स्लाइडें, कंट्रोल, पेजिनेशन और उसका इंडिकेटर।
