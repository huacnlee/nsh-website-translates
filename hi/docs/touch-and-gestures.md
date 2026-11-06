---
title: "टच और जेस्चर"
description: "प्रेस और प्रेस फीडबैक, हिट एरिया, पॉइंटर इवेंट, रॉ टच, रिस्पॉन्डर सिस्टम, PanResponder, और नेटिव पैन, पिंच और रोटेशन जेस्चर।"
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# टच और जेस्चर

NSH में टच हैंडलिंग के तीन स्तर हैं। **प्रेस** (Rust में `.on_press`, TSX में `onPress` और उनके सहयोगी) बटन, रो और लिंक के लिए हैं, और प्रेस फीडबैक नेटिव रूप से ड्रॉ होता है। **नेटिव जेस्चर** (pan, pinch और rotation) UI थ्रेड पर [animated values](./animation.md#animated-values) को चलाते हैं, इसलिए आपका कोड व्यस्त होने पर भी खींचा गया कार्ड उंगली का पीछा करता है। **रॉ टच और रिस्पॉन्डर सिस्टम** (Rust में `.on_touch` और `.claim_touches` के साथ `.on_responder_*` हैंडलर; TSX में `onTouchStart`, `onResponderMove` और `PanResponder`) आपके कोड को हर उंगली की स्थिति देते हैं, उन सभी कामों के लिए जिन्हें बाकी दो स्तर व्यक्त नहीं कर सकते, जैसे ड्रॉइंग।

वह उच्चतम स्तर चुनें जो काम कर दे: स्तर जितना ऊँचा होगा, UI थ्रेड से आपके कोड तक उतना ही कम काम पहुँचेगा।

<a id="presses"></a>

## प्रेस

हर एलिमेंट प्रेस हैंडलर स्वीकार करता है; कोई अलग "touchable" कॉम्पोनेंट नहीं है। `.on_press` / `onPress` को view, text, image या किसी भी अन्य एलिमेंट पर लगाएँ।

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | उंगली view के अंदर उठी (प्रेस के बाद, लॉन्ग प्रेस के बाद नहीं)। |
| `.on_long_press(..)` | `onLongPress` | | उंगली लॉन्ग प्रेस की देरी तक नीचे रही। इसके बाद प्रेस हैंडलर नहीं चलता। |
| `.on_press_down(..)` | `onPressDown` | | प्रेस शुरू हुआ। |
| `.on_press_up(..)` | `onPressUp` | | प्रेस समाप्त हुआ: उंगली उठी, फिसलकर बाहर गई, या स्क्रॉल view ने इसे ले लिया। |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | प्रेस के लॉन्ग प्रेस बनने से पहले के मिलीसेकंड। |
| `.disabled(..)` | `disabled` | `false` | कोई प्रेस नहीं लेता और कोई फीडबैक नहीं दिखाता; disabled स्टाइल लागू करता है; स्क्रीन रीडर इसे disabled बताते हैं। |

प्रेस कैसे व्यवहार करते हैं:

- **केवल सबसे भीतरी pressable view प्रतिक्रिया देता है।** pressable बटन वाली pressable रो को, बटन दबाने पर, कोई प्रेस नहीं मिलता।
- **स्क्रॉल view के अंदर, प्रेस शुरू होने (और फीडबैक दिखाने) से पहले लगभग 130 ms प्रतीक्षा करता है**, ताकि बटन पर शुरू होने वाला ड्रैग उसे दबाने के बजाय स्क्रॉल करे।
- **फिसलने पर प्रेस रद्द हो जाता है।** उंगली को view से बाहर ले जाने पर प्रेस, press-up हैंडलर के साथ और बिना प्रेस के, समाप्त हो जाता है।
- **Disable करने पर प्रेस लिसनर हट जाते हैं**, यानी जो माउंट है उससे। इसलिए view कोई फीडबैक नहीं दिखाता, और disabled स्टाइल लागू होती है (`.disabled_style(..)`, `class="disabled:opacity-40"`)।
- **प्रेस हैंडलर वाले नेस्टेड text span लिंक होते हैं।** पैराग्राफ एक नेटिव view है; प्रेस उस span को जाता है जो उंगली के नीचे है। देखें [Text](./text.md)।

<a id="press-feedback"></a>

## प्रेस फीडबैक

प्रेस फीडबैक ऐप का अपना होता है: वे स्टाइल जो view दबे होने, hover, focus या disabled होने पर लेता है। ये स्थिति बदलते ही नेटिव रूप से लागू हो जाते हैं, आपके कोड तक किसी राउंड ट्रिप के बिना। हर स्थिति के लिए एक Rust मेथड, एक TSX स्टाइल प्रॉप और एक [Tailwind variant](./tailwind.md) है:

| Rust | TSX प्रॉप | क्लास | विवरण |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | दबे होने पर। |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | जब पॉइंटर उसके ऊपर हो (डेस्कटॉप, iPad पॉइंटर, ब्राउज़र)। |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | जब उस पर focus हो। |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | जब उस पर या उसके अंदर के किसी view पर focus हो: फ़ील्ड का फ्रेम, उस input के चारों ओर जो एडिट करता है। |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | disabled होने पर। |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | Android का material ripple (`color`, `borderless`, `radius`, `foreground`), स्टाइलों के अतिरिक्त। |

स्थिति स्टाइल view की अपनी स्टाइलों के ऊपर लागू होती हैं। बाद की स्थितियाँ जीतती हैं (hover, focus, active), disabled स्टाइल सब पर भारी पड़ती है, और view के disabled होने पर बाकी लागू नहीं होतीं।

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

बिना बॉर्डर वाली ripple view के बाहर तक फैलती है, जो आइकन बटनों के लिए उपयुक्त है: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`। देखें [Platform-specific code](./platform-specific.md)।

ट्रांज़िशन के साथ (`.transition()`, `transition` क्लास) स्थिति का बदलाव एनिमेट होता है। `.group()` (`group` क्लास) view को ग्रुप बना देता है, और `.group_active(..)` (`group-active:`) उसके दबे होने पर उसके चाइल्ड को स्टाइल करता है:

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## हिट एरिया: hitSlop

hit slop (`.hit_slop(..)`, `hitSlop`) टच लेने वाले क्षेत्र को view की सीमाओं से आगे बढ़ाता है, उसके लेआउट को बदले बिना। इसे छोटे टार्गेट, जैसे क्लोज़ बटन और टॉगल, के लिए इस्तेमाल करें।

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | विवरण |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | सीमाओं के चारों ओर जोड़े गए पॉइंट। `EdgeInsets::all(..)` और TSX की संख्या चारों ओर लागू होती है। |

बढ़ाए गए क्षेत्र को पैरेंट की सीमाओं के भीतर रखें (छोटे view के चारों ओर कुछ margin या padding दें): hit testing पैरेंट के रास्ते से चाइल्ड तक पहुँचती है, इसलिए पैरेंट के बाहर का टच चाइल्ड के slop तक कभी नहीं पहुँचता।

<a id="children-outside-their-parent"></a>

## पैरेंट के बाहर के चाइल्ड

पैरेंट की सीमाओं के बाहर रखा गया चाइल्ड (`overflow` से absolutely positioned और दिखता हुआ, जैसे फ़ील्ड के नीचे का ड्रॉपडाउन) किसी भी अन्य view की तरह वहीं टच लेता है जहाँ वह ड्रॉ होता है: NSH नेटिव रूप से उन डिसेंडेंट्स की hit-testing करता है जो view के बाहर तक पहुँचते हैं। जो पैरेंट अपना overflow क्लिप करता है वह उन्हें भी क्लिप कर देता है, और तब वे न दिखते हैं और न वहाँ टच लेते हैं। क्षेत्र की गणना लेआउट से होती है, इसलिए transform से पैरेंट से बाहर ले जाया गया चाइल्ड केवल पैरेंट की सीमाओं के अंदर ही टच लेता है।

ड्रॉइंग क्रम का ध्यान रखें: ड्रॉपडाउन अपने फ़ील्ड के सिबलिंग के ऊपर तभी ड्रॉ होता है जब फ़ील्ड उनके बाद आए या उसका `z-index` अधिक हो, और टच उसे मिलते हैं जो ऊपर ड्रॉ हुआ हो।

## pointerEvents

स्टाइल कुंजी `pointerEvents` (Rust में `.pointer_events(..)`) तय करती है कि सबट्री के कौन से view टच का टार्गेट हो सकते हैं। इसका मूल्यांकन hit testing के दौरान नेटिव रूप से होता है, इसलिए प्रति टच इसकी कोई लागत नहीं है।

| Rust | TSX | view | उसके चाइल्ड |
|---|---|---|---|
| `PointerEvents::Auto` (डिफ़ॉल्ट) | `"auto"` | टच लेता है | टच लेते हैं |
| `PointerEvents::None` | `"none"` | कभी टार्गेट नहीं | कभी टार्गेट नहीं, जब तक कोई `"auto"` सेट न करे: टच पीछे वाले तक पहुँच जाते हैं |
| `PointerEvents::BoxNone` | `"box-none"` | कभी टार्गेट नहीं | टच लेते हैं |
| `PointerEvents::BoxOnly` | `"box-only"` | टच लेता है | कभी टार्गेट नहीं |

सामान्य उपयोग: ऐसा ओवरले जो अपने नीचे की चीज़ को ब्लॉक न करे (none), ऐसा फ़ुल-स्क्रीन कंटेनर जिसकी खाली जगह टच को पीछे के कंटेंट तक जाने दे जबकि उसके बटन फिर भी काम करें (box-none), और ऐसी रो जो उंगली के चाइल्ड पर पड़ने पर भी प्रेस ले (box-only)।

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` CSS के `pointer-events` की तरह इनहेरिट होता है: उसके अंदर का जो view `"auto"` सेट करता है वह फिर से टच लेता है। `"box-none"` और `"box-only"` उस view पर लागू होते हैं जो उन्हें सेट करता है। Tailwind क्लास `pointer-events-none` और `pointer-events-auto` `"none"` और `"auto"` सेट करती हैं, और स्टाइल कुंजी के रूप में `pointerEvents` स्थिति स्टाइल (`activeStyle`, ...) और variant भी लेता है।

<a id="native-gestures-pan-pinch-and-rotation"></a>

## नेटिव जेस्चर: pan, pinch और rotation

स्क्रीन पर कुछ हिलाने वाले ड्रैग, पिंच और रोटेशन के लिए, [animated values](./animation.md#animated-values) को जेस्चर से बाइंड करें। प्लेटफ़ॉर्म का जेस्चर रिकॉग्नाइज़र UI थ्रेड पर वैल्यू लिखता है और उनसे बंधे view उसी फ्रेम में हिलते हैं; आपके कोड को जेस्चर के शुरू और खत्म होने की सूचना मिलती है।

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | विवरण |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | एक उंगली के ड्रैग इन वैल्यू को हिलाते हैं, पॉइंट में। |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | दो उंगलियों की पिंच `scale` (एक गुणक) को चलाती है। |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | दो उंगलियों के रोटेशन `angle` को चलाते हैं, डिग्री में। |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | ड्रैग शुरू / खत्म हुआ, एक `PanEvent` के साथ। |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | पिंच शुरू / खत्म हुई: उसका स्केल और वेग (`GestureEvent`)। |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | रोटेशन शुरू / खत्म हुआ: उसका कोण (Rust: `GestureEvent<Radians>`) और वेग। |

pan इवेंट में translation (`translation`, एक `Point`: शुरुआत से अब तक के पॉइंट), वेग (`velocity_x` / `velocity_y`; TSX: `velocity`, एक `Point`: पॉइंट प्रति **सेकंड**) और उस क्षण की बाइंड की गई वैल्यू (`value_x` / `value_y`; TSX: `value`, `{ x?, y? }` उन axes के साथ जिन्हें `pan` बाइंड करता है) होती हैं।

नेटिव पक्ष आपके लिए क्या करता है:

- **ड्रैग वहीं से जारी रहता है जहाँ वैल्यू है।** शुरुआत में वैल्यू पढ़ी जाती हैं, और translation उनमें जोड़ा जाता है; अभी भी एनिमेट हो रही वैल्यू को पकड़ने पर (घर लौटता हुआ spring), एनिमेशन वहीं रुक जाता है जहाँ वह है।
- **केवल एक axis होने पर दूसरा स्क्रॉल हो पाता है।** केवल क्षैतिज वैल्यू बाइंड होने पर ड्रैग तभी शुरू होता है जब उंगली ऊर्ध्वाधर से अधिक क्षैतिज दिशा में हिले, इसलिए ऊर्ध्वाधर स्क्रॉल view के अंदर की क्षैतिज स्वाइप रो फिर भी ऊर्ध्वाधर स्क्रॉल होती है। यह निर्णय नेटिव रूप से तब लिया जाता है जब सिस्टम पूछता है कि जेस्चर शुरू हो सकता है या नहीं।
- **Pan, pinch और rotation एक ही view पर साथ चलते हैं**: एक कार्ड को एक साथ खींचा, पिंच और रोटेट किया जा सकता है।
- **फ़िज़िक्स के लिए रिलीज़ वेग।** pan end का वेग सीधे spring या decay के वेग में जाता है; वैल्यू आपको स्नैप पॉइंट चुनने देती हैं।

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> जब ड्रैग केवल चीज़ों को हिलाता हो, तो रिस्पॉन्डर के ज़रिए उसका पीछा करने के बजाय animated values को जेस्चर से बाइंड करें। बाइंड की गई वैल्यू के साथ, व्यस्त ऐप कोड ड्रैग को अटकने नहीं दे सकता; रिस्पॉन्डर के साथ, हर मूव आपके कोड के लिए एक इवेंट है और view जो दिखाता है उसका एक अपडेट।

<a id="raw-touches"></a>

## रॉ टच

टच हैंडलर हर उंगली की रिपोर्ट देते हैं, जब वह नीचे जाती है, हिलती है और उठती है। ये लॉगिंग, कस्टम hit testing और मल्टी-टच पर प्रतिक्रिया देने के लिए उपयोगी हैं; ये टच पर दावा नहीं करते (प्रेस और स्क्रॉल view काम करते रहते हैं)।

Rust में, `.on_touch(..)` हर फ़ेज़ को `TouchEvent` के रूप में सुनता है: उसका `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), उसका `timestamp` और उसका `points`, यानी नीचे की हर उंगली, हर एक अपने `id` के साथ, उस view में अपने `location` के साथ जिस पर वह नीचे गई थी, सतह में अपनी `page` स्थिति के साथ, और उन उंगलियों के लिए `changed` जिनके बारे में इवेंट है। TSX में, हर फ़ेज़ का अपना हैंडलर है:

| TSX | विवरण |
|---|---|
| `onTouchStart` | एक उंगली view पर या उसके अंदर नीचे गई। |
| `onTouchMove` | एक उंगली हिली। मूव प्रति इंजन टर्न मर्ज किए जाते हैं। |
| `onTouchEnd` | एक उंगली उठी। |
| `onTouchCancel` | सिस्टम ने टच ले लिया (स्क्रॉल view स्क्रॉल होने लगा, कॉल आ गई)। |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | वही, बाहर से भीतर की ओर कॉल होने वाले, bubbling हैंडलर से पहले। |

हर TSX हैंडलर को एक `GestureResponderEvent` मिलता है:

| फ़ील्ड | विवरण |
|---|---|
| `identifier` | उंगली के नीचे रहने तक उसकी पहचान करता है। |
| `locationX`, `locationY` | उस view में स्थिति जिस पर उंगली नीचे गई (`target`)। |
| `pageX`, `pageY` | सतह में स्थिति। |
| `target` | उस view की id जिस पर उंगली नीचे गई। |
| `timestamp` | मिलीसेकंड। |
| `touches` | नीचे की हर उंगली। |
| `changedTouches` | वे उंगलियाँ जिनके बारे में यह इवेंट है। |
| `nativeEvent` | स्वयं इवेंट, इसलिए `e.nativeEvent.locationX` भी काम करता है। |
| `stopPropagation()` | और बाहर के view इस टच इवेंट को नहीं देखते। |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### view कहाँ है: measure

टच की लोकेशन उस view के सापेक्ष होती है जिस पर उंगली नीचे गई, जो आपके काम के view का चाइल्ड हो सकता है (स्लाइडर का नॉब)। view को मापने से पता चलता है कि वह कहाँ है, ताकि आप उसकी जगह पेज की स्थिति इस्तेमाल कर सकें। Rust में, view पर `element_ref()` लगाएँ और उसके `measure()` को await करें; TSX में, उसके ref पर `measure()` कॉल करें:

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

यह तब resolve होता है जब अब तक किए गए बदलावों का लेआउट हो चुका हो: Rust में `Measurement` पर (`frame`, पैरेंट में फ्रेम जैसा लेआउट हैंडलर रिपोर्ट करता है, और `page`, ऊपरी बायाँ कोना), TSX में `{ bounds, pagePosition }` पर। कोना सतह में होता है, या उस डायलॉग में जिसमें view है, यानी टच की पेज स्थितियों जैसे ही निर्देशांक में। उसके आसपास के स्क्रॉल view और सूचियों के ऑफ़सेट ध्यान में रखे जाते हैं; transform (एनिमेशन सहित) नहीं। जो view स्क्रीन पर नहीं है उसके लिए यह `None` / `null` पर resolve होता है।
<a id="the-responder-system"></a>

## Responder सिस्टम

जब आपके कोड को किसी touch sequence का स्वामित्व लेना हो (उँगली से drawing, कस्टम slider, या ऐसा gesture जो native recognizers नहीं देते), तो gesture responder सिस्टम का उपयोग करें। एक समय में एक ही view **responder** होता है और moves प्राप्त करता है; कौन responder बने, यह views आपस में तय करते हैं।

Responder बनना:

| Rust | TSX | विवरण |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` जो `true` लौटाता है | उँगली नीचे रखे जाने पर, target से बाहर की ओर पूछा जाता है। |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` जो `true` लौटाता है | हर move पर पूछा जाता है जब कोई responder न हो (या उसे अपने हाथ में लेना हो)। |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | ऊपर की तरह, लेकिन बाहर से अंदर की ओर, bubbling वाले handlers से पहले पूछा जाता है। Parent इसका उपयोग अपने children से touch लेने के लिए करता है। |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | Move वाला संस्करण। |

कोई claim केवल view के आधार पर तय होता है और आपका कोई कोड नहीं चलता, जब तक वह पूछे नहीं: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` तब claim करता है जब listener `r.claim()` को कॉल करता है, और अब तक के gesture (`r.event.gesture`) के आधार पर निर्णय लेता है। TSX handlers को gesture दूसरे argument `gestureState` के रूप में मिलता है, जिसमें [PanResponder के](#panresponder) जैसे ही fields होते हैं (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`)। केवल क्षैतिज moves को claim करने वाला swipe: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`। यह निर्णय फिर भी एक move देर से आता है, इसलिए आसपास का scroll view पहले scroll करना शुरू कर सकता है; scroll views के अंदर drags के लिए [pan activation](#pans-inside-scroll-views-panactivation) का उपयोग करें।

Responding के दौरान:

| Rust | TSX | विवरण |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | यह view अब responder है। Rust में native scroll views को डिफ़ॉल्ट रूप से touches लेने से रोका जाता है (`TouchClaim::block_native(false)` उन्हें अनुमति देता है); TSX में इसके लिए `true` लौटाएँ। |
| `.on_responder_reject(..)` | `onResponderReject` | कोई दूसरा view responder है और उसने छोड़ने से मना कर दिया। |
| `.on_responder_start(..)` | `onResponderStart` | एक और उँगली नीचे आई। |
| `.on_responder_move(..)` | `onResponderMove` | कोई उँगली हिली। |
| `.on_responder_end(..)` | `onResponderEnd` | कोई उँगली उठी। |
| `.on_responder_release(..)` | `onResponderRelease` | आख़िरी उँगली उठी: gesture समाप्त हुआ। |
| `.keep_touches(true)` | `onResponderTerminationRequest` जो `false` लौटाता है | कोई दूसरा view touches चाहता है: उन्हें अपने पास रखें (डिफ़ॉल्ट रूप से वे सौंप दिए जाते हैं)। |
| `.on_responder_terminate(..)` | `onResponderTerminate` | किसी दूसरे view या native gesture ने touches ले लिए। |

Rust component का responder, grant से लेकर उसके touches समाप्त होने तक, दबा हुआ (pressed) रहता है, चाहे उँगली या pointer कहीं भी जाए, जैसे CSS का `:active` बटन छोड़े जाने तक बना रहता है: इसके `.active(..)` styles और इसके अंदर के `group-active:` classes पूरे drag के दौरान अपना रूप बनाए रखते हैं (जैसे resize handle को उसकी पट्टी से बाहर खींचना)।

Rust handlers को `ResponderEvent` मिलता है: जिस view पर उँगली नीचे गई उसमें उँगली का `location`, उसकी `page` स्थिति, और grant के बाद से `timestamp` और `gesture`।

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

यह कैसे चलता है: कोई भी touch या responder handler वाला view native रूप से touches सुनता है; प्लेटफ़ॉर्म उस पर (और उसके अंदर) हुए touches की रिपोर्ट सुनने वाले views के path के साथ देता है, और negotiation NSH के Rust core में चलता है, जो claims पूछता है और आपके handlers को क्रम से कॉल करता है: पहले captures सबसे बाहरी view से अंदर की ओर, फिर बाक़ी target से बाहर की ओर। इसके दो परिणाम हैं:

- **Native scroll views और responders में प्रतिस्पर्धा होती है।** जब तक कोई responder उन्हें रोके रखता है, उसके आसपास के scroll views उसके समाप्त होने तक touches नहीं लेते। यदि कोई native scroll view पहले drag करना शुरू कर दे, तो वही जीतता है: responder को terminate handler मिलता है और touch handlers को cancel।
- **हर move आपके कोड के लिए एक event है।** Responder-संचालित drags उतने ही smooth होते हैं जितना आपका कोड तेज़ है; जो drags केवल views को हिलाते हैं उनके लिए [bound values](#native-gestures-pan-pinch-and-rotation) को प्राथमिकता दें।

## PanResponder

Rust में responder events पहले से gesture साथ लाते हैं: `ResponderEvent::gesture` एक `PanGesture` है, जिसमें शुरुआत से दूरी, velocity और उँगलियों की संख्या होती है। TSX में `nsh` का `PanResponder` responder सिस्टम को wrap करता है और वही gesture state जोड़ता है; इसके `panHandlers` को किसी view पर spread करें।

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

Gesture state:

| Rust (`PanGesture`) | TSX (`gestureState`) | विवरण |
|---|---|---|
| | `stateID` | Gesture की पहचान करता है। |
| `position` | `moveX`, `moveY` | Touches के centroid की ताज़ा स्थिति, surface points में। |
| `origin` | `x0`, `y0` | Responder grant होते समय centroid कहाँ था। |
| `delta` | `dx`, `dy` | Grant के बाद से तय की गई दूरी। |
| `vx`, `vy` | `vx`, `vy` | Velocity, points प्रति सेकंड में। |
| `active_touches` | `numberActiveTouches` | नीचे रखी उँगलियाँ। |

`PanGesture::begin` और `PanGesture::update` Rust में raw touches (`.on_touch`) से gesture को ट्रैक करते हैं। TSX callbacks को `(event, gestureState)` मिलता है: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` और `onShouldBlockNativeResponder`। आख़िरी का डिफ़ॉल्ट `true` है: grant हो चुका PanResponder native scroll views को अपने touches लेने से रोकता है।

<a id="pans-inside-scroll-views-panactivation"></a>

## Scroll views के अंदर pans: panActivation

ऊर्ध्वाधर scroll view के अंदर बग़ल में scrub होने वाले chart को क्षैतिज drags लेने होते हैं और ऊर्ध्वाधर drags scroll view के लिए छोड़ने होते हैं। शुरू होते ही touch को claim करने से पहले पिक्सेल से ही scrolling रुक जाती है, और moves पर अपने कोड में निर्णय लेना बहुत देर से होता है: जब तक वह जवाब देता है, scroll view touch ले चुका हो सकता है। Pan activation (`TouchClaim::on_pan(..)`, `panActivation`) प्लेटफ़ॉर्म को main thread पर, उँगली के हिलने के साथ ही, निर्णय लेने देता है:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | विवरण |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | Pan तब सक्रिय होता है जब उँगली जहाँ नीचे गई थी वहाँ से उस axis पर इससे अधिक दूर चली जाए (किसी भी दिशा में, points में)। |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | यदि उँगली पहले इससे अधिक दूर चली जाए तो pan विफल हो जाता है: scroll views touches अपने पास रखते हैं। |

`PanActivation::horizontal(active, fail)` और `PanActivation::vertical(active, fail)` सामान्य जोड़ियाँ सेट करते हैं। Active offsets के बिना pan किसी भी दिशा में 10 points के बाद सक्रिय हो जाता है। सक्रिय होने तक आसपास के scroll views उसका इंतज़ार करते हैं (iOS) और view के अन्य claims नहीं पूछे जाते। सक्रिय होने पर scroll views इन touches को नहीं ले सकते और view responder बन जाता है (पहले grant, फिर moves); विफल होने पर scroll view सामान्य रूप से scroll करता है। TSX में `PanResponder` के `panHandlers` भी इसके साथ काम करते हैं: उन्हें prop के बगल में spread करें, और `onPanResponderGrant` सक्रियण पर चलता है।

> [!NOTE]
> हर velocity points प्रति सेकंड में होती है: responder gesture के `vx` / `vy`, pan की velocity, और spring या decay की velocity, इसलिए `vx` को जैसा है वैसा ही spring या decay को दिया जा सकता है।

<a id="why-some-answers-are-props"></a>

## कुछ उत्तर props क्यों हैं

Main thread कभी आपके कोड का इंतज़ार नहीं करता। जब सिस्टम को तुरंत उत्तर चाहिए (क्या यह pan gesture शुरू हो सकता है, क्या यह बिंदु view पर hit करता है, क्या यह tap keyboard को बंद करे), तो NSH पहले से mount की गई चीज़ों के आधार पर native रूप से उत्तर देता है: bound pan values (उनके axes), pinch value, hit slop, pointer events, scroll views की keyboard taps सेटिंग, और pan activation। आपके handlers बाद में बताते हैं कि क्या हुआ। इसीलिए ये callbacks के बजाय declarative सेटिंग्स हैं, और इसीलिए responder negotiation, जो आपका कोड चलाता है, केवल responders के बीच निर्णय करता है और कभी किसी native gesture को block नहीं करता।

<a id="related"></a>

## संबंधित

- [`View`](../elements/view.md): बुनियादी element पर हर touch prop।
- [Animation](./animation.md): gesture-संचालित गति के लिए animated values, springs और decay।
- [Scrolling](./scrolling.md): keyboard taps सेटिंग, scroll views और nested gestures।
- [`PanResponder`](../modules/nsh.md#panresponder): `PanResponder` संदर्भ।
- [Accessibility](./accessibility.md): pressable views accessibility elements हैं; उन्हें role और label दें।
