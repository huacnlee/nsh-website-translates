---
title: "एक्सेसिबिलिटी"
description: "ऐप्स को VoiceOver और TalkBack के साथ काम करने योग्य बनाना - लेबल, रोल, स्टेट, वैल्यू, कस्टम एक्शन, ग्रुपिंग और छिपाना, घोषणाएँ और फ़ोकस, टेक्स्ट का आकार, और कम किया गया मोशन।"
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# एक्सेसिबिलिटी

NSH नेटिव व्यू से रेंडर करता है, इसलिए प्लेटफ़ॉर्म की सहायक तकनीकें (iOS और Mac Catalyst पर VoiceOver, Android पर TalkBack, Switch Control, Voice Control, ...) आपके ऐप का असली व्यू हाइरार्की देखती हैं। आप वे विवरण जोड़ते हैं जो ये तकनीकें खुद नहीं समझ सकतीं: कोई एलिमेंट क्या है, क्या कहता है, किस स्थिति में है और क्या कर सकता है। हर एलिमेंट नीचे दिए गए मेथड (Rust) और props (TSX) स्वीकार करता है।

<a id="what-you-get-without-doing-anything"></a>

## बिना कुछ किए आपको क्या मिलता है

- **टेक्स्ट पढ़ा जाता है।** टेक्स्ट एलिमेंट एक एक्सेसिबिलिटी एलिमेंट होता है जिसका लेबल उसका टेक्स्ट होता है। बिना लेबल वाला व्यू अपने अंदर के टेक्स्ट के रूप में पढ़ा जाता है।
- **प्रेस करने योग्य व्यू एलिमेंट होते हैं।** प्रेस या लॉन्ग प्रेस हैंडलर (`.on_press`, `onPress`) वाला व्यू डिफ़ॉल्ट रूप से एक एक्सेसिबिलिटी एलिमेंट होता है, और उसे सक्रिय करने (VoiceOver या TalkBack में डबल टैप) पर वह प्रेस हो जाता है।
- **इनपुट टेक्स्ट फ़ील्ड होते हैं**, अपने प्लेसहोल्डर, वैल्यू और कीबोर्ड के साथ।
- **टेक्स्ट उपयोगकर्ता की साइज़ सेटिंग का पालन करता है।** देखें [टेक्स्ट साइज़](#text-size)।

<a id="labels-hints-and-roles"></a>

## लेबल, हिंट और रोल

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | प्रकार | विवरण |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | सहायक तकनीकों के लिए व्यू एक ही एलिमेंट होता है; उसके चाइल्ड अलग से उजागर नहीं किए जाते। |
| `.label(..)` | `accessibilityLabel` | `string` | अंदर के टेक्स्ट के बजाय स्क्रीन रीडर जो पढ़ते हैं। |
| `.hint(..)` | `accessibilityHint` | `string` | एलिमेंट को सक्रिय करने पर क्या होता है, जिसे थोड़े विराम के बाद पढ़ा जाता है। |
| `.role(..)` | `role` | `AccessibilityRole` | एलिमेंट क्या है। |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | उसकी स्थिति: disabled, selected, checked, busy, expanded, pressed, current। `selected` selected स्टाइल भी लागू करता है, `checked` true होने पर checked स्टाइल और `"mixed"` होने पर indeterminate स्टाइल, `pressed` true होने पर pressed स्टाइल। |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | हेडिंग का स्तर (1 सबसे ऊपर), ट्री आइटम की गहराई (1 सबसे ऊपर)। |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | रेंज या टेक्स्ट वाले एलिमेंट की वैल्यू। |
| | `accessibilityActions` | `{ name, label? }[]` | सहायक तकनीकों को दिए जाने वाले एक्शन। |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | कोई एक्शन किया गया (Rust: उसका नाम)। |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | व्यू और उसके सबट्री को सहायक तकनीकों से छिपाता है। |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | व्यू (और उसका सबट्री) उजागर है या नहीं। |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: व्यू के बदलावों की TalkBack को घोषणा कैसे की जाए। |
| `.test_id(..)` | `testID` | `string` | UI टेस्ट के लिए एक आइडेंटिफ़ायर (iOS पर accessibility identifier, Android पर resource id); इसे बोलकर नहीं पढ़ा जाता। |

हर सिर्फ़-आइकन वाले कंट्रोल को लेबल दें: स्क्रीन रीडर किसी ग्लिफ़ या इमेज को नहीं पढ़ सकता। लेबल छोटे रखें और उनमें रोल शामिल न करें ("Play", "Play button" नहीं): रोल की घोषणा अलग से होती है।

<a id="roles"></a>

### रोल

रोल (`.role(AccessibilityRole::Header)`, `role="header"`) उपयोगकर्ता को बताता है कि यह किस तरह का एलिमेंट है और इसे कैसे चलाना है। Rust में यह `AccessibilityRole` का एक वेरिएंट है (`Button`, `Header`, `Switch`, ...); TSX के मान हैं `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` और `"cell"` ([`Table`](../elements/table.md) के हिस्सों की भूमिकाएँ), `"listbox"` और `"option"` (चुनने के लिए विकल्पों की सूची, जैसे [`Select`](../elements/select.md) की सूची, और उसके विकल्प, जिनमें चुने गए विकल्प को `accessibilityState.selected` से चिह्नित किया जाता है), `"group"` (संबंधित एलिमेंट जो साथ रहते हैं), `"region"` (ऐसा सेक्शन जिस तक अलग से पहुँचना उपयोगी हो, जैसे accordion का पैनल), `"navigation"` (ऐसे लिंक जो ऐप में नेविगेट कराते हैं, जैसे pagination), `"tree"` और `"treeitem"` (खुलने और बंद होने वाले आइटम, हर एक अपने `accessibilityLevel` पर), `"menuitemcheckbox"` और `"menuitemradio"` (चेक किए गए मेनू आइटम, अकेले या किसी समूह के एक विकल्प के रूप में)।

सबसे उपयोगी रोल:

- `"button"` हर उस प्रेस योग्य चीज़ के लिए जो लिंक नहीं है; `"link"` कंटेंट तक नेविगेशन के लिए।
- `"header"` सेक्शन के शीर्षकों के लिए: स्क्रीन रीडर उपयोगकर्ता स्क्रीन को स्किम करने के लिए हेडरों के बीच कूदते हैं। `accessibilityLevel` उसका स्तर बताता है (1 सबसे ऊपर), जहाँ प्लेटफ़ॉर्म उसे पढ़ता है।
- `"button"` के साथ `accessibilityState.pressed` टॉगल बटन के लिए, यानी ऐसा बटन जो ऑन या ऑफ रहता है (टूलबार में bold)।
- `"navigation"` उन लिंकों के चारों ओर जो पेजों के बीच ले जाते हैं, और दिखाए गए पेज का लिंक `accessibilityState.current: "page"` के साथ।
- `"switch"`, `"checkbox"`, `"radio"` के साथ `accessibilityState.checked`।
- `"adjustable"` स्लाइडर और स्टेपर के लिए, `accessibilityValue` और `increment` / `decrement` एक्शन के साथ (हर [`Slider`](../elements/slider.md) का थंब एक ऐसा ही एलिमेंट है)।
- `"spinbutton"` ऐसे फ़ील्ड के लिए जिसमें उपयोगकर्ता की दी हुई संख्या हो और जिसे वह स्टेप भी कर सके, उसी वैल्यू और एक्शन के साथ ([`NumberInput`](../elements/number-input.md) का फ़ील्ड)।
- `"image"` अर्थपूर्ण इमेज के लिए, लेबल के साथ; सजावटी इमेज को इसके बजाय छिपाना चाहिए।

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### स्थितियाँ और वैल्यू

ऐप में ऑन / ऑफ कंट्रोल के लिए `nsh/base` का [`Switch`](../elements/switch.md) इस्तेमाल करें, जो रोल और स्थिति खुद सेट करता है। यह उदाहरण दिखाता है कि किसी व्यू पर रोल और स्थिति क्या करते हैं।

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

स्थिति Rust में `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` और TSX में `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` है। `pressed` बटन को टॉगल बटन बनाता है (ARIA का `aria-pressed`); `current` किसी समूह के वर्तमान आइटम को चिह्नित करता है (ARIA का `aria-current`): pagination का पेज, wizard का चरण। व्यू को disable करने (`.disabled(..)`, `disabled`) से भी `disabled` निहित हो जाता है। `min`, `max` और `now` के साथ `accessibilityValue` को प्रतिशत के रूप में पढ़ा जाता है; `text` के साथ इसे जैसा दिया गया है वैसा ही पढ़ा जाता है ("3 of 10", "Medium")।

<a id="actions"></a>

## एक्शन

प्रेस योग्य व्यू पहले से ही सक्रियण का समर्थन करता है। बाकी सब कुछ के लिए `accessibilityActions` से एक्शन घोषित करें और `onAccessibilityAction` से उन्हें हैंडल करें; Rust कंपोनेंट किए गए एक्शन का नाम `.on_accessibility_action(|name: &str| ..)` से सुनता है:

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

कुछ एक्शन नाम मानक हैं और प्लेटफ़ॉर्म के अपने जेस्चर से जुड़े हैं:

| नाम | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | डबल टैप | डबल टैप (click) |
| `increment`, `decrement` | ऊपर / नीचे स्वाइप, फिर VoiceOver नई वैल्यू पढ़ता है | आगे / पीछे स्क्रॉल |
| `longpress` | | डबल टैप और होल्ड |
| `expand`, `collapse` | | Expand / collapse |
| `magicTap` | दो उंगलियों से डबल टैप | |
| `escape` | दो उंगलियों से Z स्क्रब | |

`increment` या `decrement` वाला एलिमेंट अपने रोल की परवाह किए बिना adjustable होता है: चार्ट अपना `"image"` रोल बनाए रखता है और VoiceOver के स्वाइप और TalkBack के स्क्रॉल से अपने पॉइंट्स पर स्टेप करता है, और हर स्टेप के बाद उसका `accessibilityValue` पढ़ा जाता है।

कोई भी अन्य नाम कस्टम एक्शन बन जाता है, जो VoiceOver के actions rotor और TalkBack के actions menu में उसके `label` (या उसके नाम) के साथ सूचीबद्ध होता है। कस्टम एक्शन swipe-to-delete और ऐसे ही जेस्चर का एक्सेसिबल रूप हैं:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## समूहबद्ध करना और छिपाना

व्यू को एक्सेसिबल बनाना (`.accessible(true)`, `accessible`) उसे एक एलिमेंट बना देता है: शीर्षक, उपशीर्षक और कीमत वाला कार्ड एक ही बार में पढ़ा जाता है, बजाय इसके कि उपयोगकर्ता तीन टेक्स्ट पर स्वाइप करता जाए।

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

जो कुछ नहीं जोड़ता उसे छिपाएँ: सजावटी इमेज, डिवाइडर, और ऐसे टेक्स्ट के बगल का आइकन जो वही बात पहले से कहता है।

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (iOS का नाम) और `importantForAccessibility="no-hide-descendants"` (Android का) दोनों प्लेटफ़ॉर्म पर सबट्री को छिपाते हैं; दोनों सेट करने में कोई हानि नहीं।

<a id="the-screen-reader-and-the-users-settings"></a>

## स्क्रीन रीडर और उपयोगकर्ता की सेटिंग

Rust में, प्रेल्यूड उपयोगकर्ता की सेटिंग बताता है और स्क्रीन रीडर से बात करता है: `screen_reader()` और `reduce_motion()` रिएक्टिव हैं, `announce_for_accessibility(message)` स्क्रीन रीडर से संदेश पढ़वाता है, और एलिमेंट का `element_ref()` `set_accessibility_focus()` से स्क्रीन रीडर का फ़ोकस उस पर ले जाता है। TSX में, `nsh` का accessibility API उपयोगकर्ता की सेटिंग बताता है और आपको स्क्रीन रीडर से बात करने देता है।

| सदस्य | विवरण |
|---|---|
| `screenReaderEnabled()` | VoiceOver या TalkBack चल रहा है या नहीं (रिएक्टिव)। |
| `reduceMotion()` | उपयोगकर्ता ने कम मोशन माँगा है या नहीं (रिएक्टिव)। |
| `announce(message)` | स्क्रीन रीडर `message` पढ़ता है। |
| `setAccessibilityFocus(ref)` | स्क्रीन रीडर का फ़ोकस किसी व्यू पर ले जाता है। |

सेटिंग accessor हैं: उन्हें बाइंडिंग या इफ़ेक्ट में पढ़ें, और जो उन्हें पढ़ता है वह उपयोगकर्ता के सेटिंग बदलने पर अपने आप अपडेट हो जाता है, किसी क्लीनअप के बिना।

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

ऐसे बदलावों की घोषणा करें जो उपयोगकर्ता से अन्यथा छूट जाएँगे: बैकग्राउंड सेव पूरा होना, फ़ोकस से दूर कोई एरर दिखना, टाइमर समाप्त होना। Android पर, व्यू पर `android={{ accessibilityLiveRegion: "polite" }}` TalkBack से उसके बदलावों की घोषणा अपने आप करवा देता है।

<a id="text-size"></a>

## टेक्स्ट साइज़

टेक्स्ट और इनपुट सिस्टम के टेक्स्ट साइज़ (iOS पर Dynamic Type, Android पर font size) का पालन करते हैं, जब तक आप इसे बंद न करें (`.allow_font_scaling(false)`, `allowFontScaling={false}`)। इसे बंद करने के बजाय, इसके अनुसार डिज़ाइन करें:

- टेक्स्ट को wrap होने दें: टेक्स्ट वाले व्यू पर निश्चित ऊँचाई से बचें।
- स्केलिंग बंद करने के बजाय बहुत बड़ी हेडिंग को `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` से सीमित करें।
- टेक्स्ट बड़ा होने पर लेआउट बदलें: `font_scale()` (Rust) या `nsh` से `fontScale()` (TSX) पढ़ें (उदाहरण के लिए, 1.3 से ऊपर लेबल और उसकी वैल्यू को ऊर्ध्वाधर रूप से स्टैक करें)।

देखें [डिवाइस और एनवायरनमेंट](./device-and-environment.md#text-size)।

<a id="reduced-motion"></a>

## कम मोशन

`reduce_motion()` (Rust) और `reduceMotion()` (TSX) तब `true` होते हैं जब उपयोगकर्ता ने iOS का Reduce Motion या Android की animations हटाने वाली सेटिंग चालू की हो। आपके एनिमेशन वैसे ही चलते हैं जैसे आपने लिखे हैं, इसलिए बड़ी गति को फ़ेड या तुरंत बदलाव से बदलने के लिए इसका, या `motion-reduce:` और `motion-safe:` Tailwind वेरिएंट का, उपयोग करें:

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## टच टारगेट

प्रेस योग्य एलिमेंट कम से कम 44 × 44 पॉइंट के रखें। जब कोई कंट्रोल छोटा दिखना ज़रूरी हो, तो उसका आकार बढ़ाने के बजाय हिट स्लॉप (`.hit_slop(..)`, `hitSlop`) से उसका टच क्षेत्र बढ़ाएँ; देखें [टच और जेस्चर](./touch-and-gestures.md#hit-areas-hitslop)।

<a id="checking-your-app"></a>

## अपने ऐप की जाँच

- VoiceOver (iOS Settings, Accessibility, या साइड बटन को तीन बार क्लिक करें, यदि सेट किया गया हो) या TalkBack चालू करें, और बिना देखे ऐप इस्तेमाल करें: हर कंट्रोल को बताना चाहिए कि वह क्या है और क्या करता है।
- iOS सिमुलेटर पर, Xcode का Accessibility Inspector हर एलिमेंट का लेबल, ट्रेट और वैल्यू दिखाता है।
- सबसे बड़ा टेक्स्ट साइज़ और डार्क मोड आज़माएँ।
- टेस्ट आईडी (`.test_id(..)`, `testID`) UI टेस्ट को एक स्थिर हैंडल देती है जो लेबल की भाषा के साथ नहीं बदलता।

<a id="related"></a>

## संबंधित

- [`nsh` का accessibility API](../modules/nsh.md#accessibility): रेफ़रेंस।
- [`View`](../elements/view.md): हर एक्सेसिबिलिटी prop।
- [एनिमेशन](./animation.md#reduced-motion) और [डिवाइस और एनवायरनमेंट](./device-and-environment.md)।
