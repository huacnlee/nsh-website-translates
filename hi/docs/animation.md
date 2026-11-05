---
title: "Animation"
description: "Motions (तैयार एंट्रेंस, एग्ज़िट, ध्यान आकर्षित करने वाले एनिमेशन और लूप, या आपके अपने कीफ़्रेम), स्टाइल ट्रांज़िशन और कीफ़्रेम एनिमेशन, timing, spring, decay और keyframes वाले एनिमेटेड वैल्यू, इंटरपोलेशन, कंपोज़िट एनिमेशन, ईज़िंग, लेआउट एनिमेशन, और UI थ्रेड पर क्या चलता है, Rust और TSX में।"
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# एनिमेशन

NSH में हर एनिमेशन UI thread पर चलता है। आप उसे Rust या TSX से एक बार बयान करते हैं, और प्लेटफ़ॉर्म उसे फ़्रेम-दर-फ़्रेम चलाता है (iOS पर Core Animation और display link, Android पर UI-thread animator), आपके कोड को वापस बुलाए बिना। व्यस्त engine thread किसी एनिमेशन को अटकने नहीं दे सकता, और एनिमेशन के चलने के दौरान आपके कोड की कोई लागत नहीं आती।

छह टूल हैं, सबसे तैयार से लेकर सबसे लचीले तक:

| टूल | किसके लिए |
|---|---|
| [Motion](#motion) | ऐसा view जो आता है, जाता है, ध्यान खींचता है या लूप में चलता है: तैयार motions (`fadeInUp`, `shake`, `pulse`, ...) या आपके अपने keyframes, उसकी opacity और transform पर। |
| [Transitions](#transitions) | ऐसा style बदलाव जो झटके से बदलने के बजाय एनिमेट होना चाहिए: कोई रंग, opacity, transform। |
| [Keyframe animations](#keyframe-animations) | स्पिनर, धड़कता हुआ प्लेसहोल्डर, उछलता हुआ संकेत। |
| [Keyframes](#keyframes) | कोई भी एनिमेटेड मान keyframes के ज़रिए, जैसे CSS उन्हें चलाता है: offsets, हर खंड के लिए easing, iterations और direction। |
| [Animated values](#animated-values) | समय के साथ किसी मान से चलने वाली कोई भी चीज़: springs, gestures, scroll position, sequences। |
| [Layout animations](#layoutanimation) | अपडेट के बाद आकार और स्थिति के बदलाव: items का जुड़ना, हटना, क्रम बदलना, पैनल का फैलना। |

## Motion

Motion किसी view की opacity और transform को keyframes के ज़रिए, native रूप से चलाता है। उसे उस component में बनाएँ जो view का मालिक है (Rust में `motion()`, TSX में `nsh` से `createMotion()`), उसे view से bind करें, और उस पर कोई तैयार motion या अपना motion चलाएँ। `enter` view को वहाँ से शुरू करता है जहाँ motion शुरू होता है और उसे तुरंत चला देता है, ताकि view अपने पहले फ़्रेम से ही आए।

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

Motion में हर channel के लिए एक animated value होता है: `opacity` (0..1), `translateX` और `translateY` (points), `rotate`, `rotateX` और `rotateY` (डिग्री), `scale`, `scaleX` और `scaleY`। ये विश्राम अवस्था से शुरू होते हैं (opacity और scales 1, बाकी 0) और इसी क्रम में लागू होते हैं: पहले translations, फिर rotations, फिर scales, view के transform origin के सापेक्ष। Motion का अपना कोई रूप नहीं होता: वह उसी को चलाता है जिसे आपने style किया है।

Motion केवल opacity और transform को चलाता है। `m.style` को spread करने से view की `opacity` और `transform` सेट हो जाती हैं; अपनी opacity रखने के लिए केवल steps को bind करें (`transform: m.transform`)। रंग किसी animated value और [`interpolate`](#interpolation) से चलते हैं।

| TSX | Rust | विवरण |
|---|---|---|
| `createMotion(options?)` | `motion()` | ऐसा motion जिसका हर channel विश्राम अवस्था में है। |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | जहाँ से channels शुरू होते हैं; बाकी विश्राम अवस्था से शुरू होते हैं। |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | वहीं से शुरू होता है जहाँ `enter` शुरू होता है और उसे तुरंत चलाता है; अन्य विकल्प उसकी timing बदलते हैं। `enter` उन channels को सेट करता है जिन्हें वह चलाता है, `initial` के ऊपर। |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | channels को bind करता है: `m.style` है `{ opacity, transform }`, उसका `transform` सात steps की एक सूची है (`scale` को `scaleX` और `scaleY` में मिला दिया जाता है)। ये view के `translate`, `rotate` और `scale` के बाद लागू होते हैं; इनसे पहले का perspective 3D flip को गहराई देता है: `transform: [{ perspective: 800 }, ...m.transform]`। Rust में motion का transform view के अपने transform के बाद लागू होता है। |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | किसी एक channel का animated value, जिसे interpolate किया जा सकता है या हाथ से चलाया जा सकता है। |
| `m.play(motion, options?)` | `m.play(spec)` | कोई preset या अपना motion चलाता है; नया motion चल रहे motion को बीच में रोक देता है। पूरा होने पर `{ finished }`, `true` के साथ resolve होता है (Rust में `AnimationEnd`)। |
| `m.animation(motion, options?)` | `m.animation(spec)` | वही motion एक [composite animation](#composite-animations) के रूप में, बिना शुरू किए, ताकि दूसरों के साथ क्रम में, stagger करके या लूप में चलाया जा सके। |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | इसे तब भी चलाता है जब उपयोगकर्ता कम motion माँगता है। |
| `m.stop()` | `m.stop()` | उसे जहाँ है वहीं रोक देता है। |
| `m.reset()` | `m.reset()` | उसे रोकता है और हर channel को विश्राम अवस्था में लौटा देता है। |

### Presets

तैयार motions डेटा हैं: `nsh` से `motions` (`motions.fadeInUp` वही है जो `play("fadeInUp")` चलाता है) और Rust में `MotionPreset` (`MotionPreset::FadeInUp.spec()`)। दूरियाँ points में हैं, controls और cards के हिसाब से; बड़े views के लिए motion के मानों को scale करें या अपने keyframes लिखें। `swing` और अन्य rotations view के transform origin के सापेक्ष घूमते हैं: झूलते साइन को `transformOrigin: "top"` दें (`.origin_top()`)।

**Enter**: ये छिपे हुए या दूर से शुरू होते हैं और विश्राम अवस्था में खत्म होते हैं।

| TSX | Rust | अवधि | विवरण |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | धीरे-धीरे दिखाई देता है। |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | धीरे-धीरे दिखाई देता है, ऊपर उठकर अपनी जगह आता है। |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | धीरे-धीरे दिखाई देता है, नीचे उतरकर अपनी जगह आता है। |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | धीरे-धीरे दिखाई देता है, बाईं ओर से आता है। |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | धीरे-धीरे दिखाई देता है, दाईं ओर से आता है। |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | धीरे-धीरे दिखाई देता है, 90 % से बढ़ता है। |
| `popIn` | `MotionPreset::PopIn` | 450 ms | उभरकर आता है: आधे आकार से अपने आकार के पार तक बढ़ता है और फिर टिक जाता है। |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | उछलकर आता है, दो बार आगे निकल जाता है। |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | नीचे से ऊपर सरकता है, बिना fade के (sheets, toasts)। |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | ऊपर से नीचे सरकता है, बिना fade के। |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | अपनी क्षैतिज धुरी पर पलटकर आता है। |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | अपनी ऊर्ध्वाधर धुरी पर पलटकर आता है। |

**Exit**: ये विश्राम अवस्था से शुरू होते हैं और छिपे हुए या दूर जाकर खत्म होते हैं।

| TSX | Rust | अवधि | विवरण |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | धीरे-धीरे गायब होता है। |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | धीरे-धीरे गायब होता है, ऊपर उठकर दूर जाता है। |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | धीरे-धीरे गायब होता है, नीचे उतरकर दूर जाता है। |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | धीरे-धीरे गायब होता है, बाईं ओर जाता है। |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | धीरे-धीरे गायब होता है, दाईं ओर जाता है। |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | धीरे-धीरे गायब होता है, सिकुड़कर 90 % हो जाता है। |
| `popOut` | `MotionPreset::PopOut` | 300 ms | उभरकर जाता है: थोड़ा फूलता है, फिर सिकुड़कर गायब हो जाता है। |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | नीचे सरककर दृश्य से बाहर जाता है, बिना fade के। |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | ऊपर सरककर दृश्य से बाहर जाता है, बिना fade के। |

**Attention**: ये विश्राम अवस्था में शुरू और खत्म होते हैं।

| TSX | Rust | अवधि | विवरण |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | बगल में हिलता है: गलत पासवर्ड, अमान्य फ़ील्ड। |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | सिर हिलाता है: एक नरम "नहीं"। |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | अपने केंद्र के सापेक्ष डोलता है: कुछ ध्यान देने लायक। |
| `swing` | `MotionPreset::Swing` | 900 ms | अपने ऊपरी किनारे से साइन की तरह झूलता है। |
| `pulse` | `MotionPreset::Pulse` | 500 ms | थोड़ा बढ़कर वापस आता है: हल्का ज़ोर। |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | दिल की तरह दो बार धड़कता है: लाइक, पसंदीदा। |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | रबर की तरह दबता और खिंचता है। |
| `jello` | `MotionPreset::Jello` | 800 ms | जेली की तरह थरथराता है। |
| `tada` | `MotionPreset::Tada` | 900 ms | सिकुड़ता है, फिर डोलते हुए बढ़ता है: एक इनाम। |
| `jump` | `MotionPreset::Jump` | 700 ms | कूदता है और दबकर उतरता है। |
| `flash` | `MotionPreset::Flash` | 800 ms | दो बार बुझता और जलता है। |

**Loop**: ये रोके जाने तक दोहराते रहते हैं।

| TSX | Rust | अवधि | विवरण |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | एक बार घूमता है, हमेशा। |
| `float` | `MotionPreset::Float` | 1500 ms | ऊपर-नीचे तैरता है, हमेशा। |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | साँस लेता है: थोड़ा बढ़ता और फीका पड़ता है, हमेशा। |
| `sway` | `MotionPreset::Sway` | 1600 ms | अपने केंद्र के सापेक्ष झूमता है, हमेशा। |
| `bob` | `MotionPreset::Bob` | 1000 ms | उछलती गेंद की तरह ऊपर-नीचे होता है, हमेशा। |
| `glow` | `MotionPreset::Glow` | 2000 ms | चमकता और मंद होता है, हमेशा। |

`play` किसी preset के ऊपर उसके timing विकल्प लेता है (`m.play("shake", { duration: 300 })`), और preset को अपने motion में spread किया जा सकता है (`m.play({ ...motions.fadeInUp, duration: 600 })`)। Rust में preset का spec बदलें: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`।

<a id="motions-of-your-own"></a>

### अपने खुद के motions

अपना motion हर channel के लिए keyframes और एक timing से बनता है ([keyframes](#keyframes) के विकल्प)। TSX में हर channel के keyframes लिखें (`{ opacity: [0, 1] }`), या frames की एक सूची जैसी Web Animations API में लिखी जाती है (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), जिसमें हर frame के पास अपना `offset` और `easing` हो। frames की सूची में, बिना offset वाला frame वहीं बैठता है जहाँ सूची में उसकी स्थिति उसे रखती है, और कोई channel उन्हीं frames का अनुसरण करता है जो उसका नाम लेते हैं। कोण strings हो सकते हैं (`"45deg"`, `"0.5turn"`)। Rust में `MotionSpec` बनाएँ।

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### Entrances और staggered सूचियाँ

हर पंक्ति को एक ऐसा motion दें जो अंदर आता है, और ऐसी delay के साथ जो उसके index के साथ बढ़ती है: जो पंक्तियाँ एक साथ दिखती हैं वे एक के बाद एक आती हैं। delay की एक सीमा रखें, ताकि सूची में बहुत नीचे जोड़ी गई पंक्ति को इंतज़ार न करना पड़े।

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

Motions आपस में जुड़ भी सकते हैं: `m.animation(..)` एक motion है [composite animation](#composite-animations) के रूप में, बिना शुरू किया हुआ, इसलिए `Animated.stagger` उनके एक समूह को native रूप से चलाता है, गिनती पहले item से, आख़िरी से, केंद्र से या किसी भी index से। उन्हें एक छिपा हुआ `initial` दें (या उन्हें वहीं से शुरू करें जहाँ motion शुरू होता है) ताकि अपनी बारी से पहले कुछ न दिखे।

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

### Exits

exit चलाएँ, उसके खत्म होने की प्रतीक्षा करें, फिर view को हटाएँ। [layout animation](#layoutanimation) आसपास के views को खाली जगह भरने देता है।

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

Motions उपयोगकर्ता की [reduced motion](#reduced-motion) सेटिंग का अपने आप पालन करते हैं: जब उपयोगकर्ता कम motion माँगता है, तो motion बिना हिले तुरंत अपने अंतिम स्थान पर पहुँच जाता है।

## Transitions

बताएँ कि क्या एनिमेट करना है और कितनी देर के लिए (Rust में `.transition_all().duration(400.0)`, TSX में `transitionProperty` और `transitionDuration`), और उन properties में बाद के बदलाव native रूप से स्क्रीन पर मौजूद मान से नए मान तक एनिमेट होंगे।

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| Style | Rust | प्रकार | विवरण |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | क्या एनिमेट होता है, अल्पविराम से अलग: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | मिलीसेकंड में संख्या के रूप में, या CSS time। |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | शुरू होने से पहले। |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | वक्र। |

जो properties transition करती हैं, समूह के अनुसार: **रंग** (background, border, outline, shadow और text के रंग, gradient stops), **opacity**, **transform**, **shadows** (`box-shadow`) और **आकृति** (border radius और width)। CSS नाम और उनके camel-case रूप दोनों काम करते हैं (`background-color`, `backgroundColor`, `transform`, `scale`, ...)। Layout बदलाव [layout animations](#layoutanimation) से एनिमेट होते हैं।

Tailwind के साथ वही चीज़ है `transition` (रंग, opacity, shadows और transforms), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, साथ में `duration-*`, `delay-*` और `ease-*`। pressed state (`.active(..)`, `active:`) के साथ मिलाने पर यह ऐसे pressed states देता है जो एनिमेट होते हैं:

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

Transition उस मान से शुरू होता है जो इस समय स्क्रीन पर है, इसलिए बीच में लक्ष्य फिर बदलने पर वह सहजता से मुड़ जाता है।

## Keyframe animations

चार अंतर्निहित keyframe animations native रूप से चलते हैं, डिफ़ॉल्ट रूप से हमेशा: `spin` (दक्षिणावर्त एक चक्कर), `ping` (2× तक बढ़ता है और फीका पड़ जाता है), `pulse` (आधी opacity तक फीका होकर वापस आता है) और `bounce` (अपनी ऊँचाई के चौथाई हिस्से जितना उछलता है और उतरता है)।

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| Style | Rust | प्रकार | विवरण |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()`, या `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | एनिमेशन। |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | एक iteration। |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | शुरू होने से पहले। |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | `transitionTimingFunction` की तरह | वक्र। |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | डिफ़ॉल्ट `"infinite"`। |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`।

## Animated values

Animated value एक संख्या है जो UI thread पर रहती है। उसे बनाएँ (Rust में `animated_value(..)`, TSX में `nsh` से `createAnimatedValue`), उसे styles से bind करें, और उसे एनिमेट करें; bind किए गए views हर फ़्रेम में बिना अपडेट के उसका अनुसरण करते हैं।

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**क्या bind किया जा सकता है:** `opacity` (`.bind_opacity(..)`); `backgroundColor`, `borderColor` (हर तरफ़) और text का `color` (पूरा text), रंगों तक interpolation के ज़रिए (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate` (`[x, y]`, हर axis के लिए एक मान), `rotate` (डिग्री) और `scale` (हर axis के लिए `[x, y]`, या दोनों के लिए एक मान); और `transform` सूची के steps: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` और `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` डिग्री में, Rust में `.bind_transform(kind, ..)`)। Shadows [transitions](#transitions) से बदलते हैं। focus ring या हरे रंग में चमकने वाली कीमत, border या text के रंग से bind किया गया color interpolation है:

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

Animated values [canvas drawings](./canvas.md#driving-drawings-with-animated-values) को भी चलाते हैं, scroll offsets ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) और gestures ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)) प्राप्त करते हैं।

मान को उससे bind किए गए views और उसे बनाने वाला component जीवित रखते हैं, इसलिए आपके variables कैसे भी आएँ-जाएँ, binding जुड़ी रहती है। Animated values को उसी component में बनाएँ जो उनका मालिक है (module स्तर पर नहीं, जब हर instance को अपना चाहिए)।
<a id="animatedvalue-methods"></a>

### AnimatedValue मेथड

| TSX | Rust | विवरण |
|---|---|---|
| `set(value)` | `set(value)` | `value` पर सीधे पहुँच जाता है और चल रहे किसी भी animation को रोक देता है। |
| `stop()` | `stop()` | चल रहे animation को जहाँ है वहीं रोक देता है; TSX में यह `{ value }` के साथ resolve होता है, यानी वहाँ के मान के साथ। |
| `getValue()` | `value()` | वर्तमान मान, जो UI thread पर पढ़ा जाता है जहाँ वह बदलता है (यह एक फ़्रेम के भीतर स्थिर हो जाता है): TSX में promise, Rust में await किया जा सकने वाला उत्तर। |
| `setOffset(offset)` | `set_offset(offset)` | मान जो दिखाता है उसमें `offset` जोड़ता है: bindings को value + offset दिखता है, जबकि `set`, animations और drags मान को ही बदलते हैं। |
| `flattenOffset()` | `flatten_offset()` | offset को मान में जोड़ देता है और offset को 0 कर देता है। |
| `extractOffset()` | `extract_offset()` | मान को offset में ले जाता है और मान को 0 कर देता है: इसके बाद drag 0 से शुरू होता है, पिछले drag ने जहाँ छोड़ा था उसके ऊपर। |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | `duration` ms में `to` तक animate करता है (डिफ़ॉल्ट 300, easing `"easeInOut"`)। |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | spring की तरह `to` तक पहुँचता है (डिफ़ॉल्ट: stiffness 170, damping 26, mass 1)। |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | `velocity` (इकाई प्रति सेकंड) की गति से चलना शुरू करता है और धीमा होता जाता है (डिफ़ॉल्ट deceleration 0.998 प्रति ms)। `[min, max]` के clamp के साथ यह किसी सीमा पर रुक जाता है, या अपनी गति का `bounce` (0..1) हिस्सा बनाए रखते हुए उससे वापस लौट आता है। |

हर animation एक उत्तर देता है जिसे आप await कर सकते हैं, कि वह पूरा हुआ या नहीं: `true` जब वह अंत तक चला, `false` जब किसी ने उसे रोक दिया (`stop()`, `set()`, या उसी मान पर नया animation)। यह TSX में `Promise<{ finished: boolean }>` है और Rust में `AnimationEnd`, जिसे कोई task `bool` के लिए await करता है। चलते हुए मान पर नया animation शुरू करने से पुराना animation सहजता से बाधित होता है: velocity के बिना दिया गया spring या decay मान की मौजूदा velocity से जारी रहता है।

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

### Keyframes

`keyframes` किसी मान को keyframes के ज़रिए वैसे ही चलाता है जैसे CSS keyframes चलते हैं: TSX में `value.keyframes(frames, options)`, Rust में `value.keyframes(frames, KeyframeTiming)` ([composite](#composite-animations) के एक step के रूप में `Animated.keyframes(value, { keyframes, ... })` और `Animation::keyframes(..)`)। keyframe एक संख्या है (या `"90deg"` जैसी angle string), जो बाकी के साथ समान दूरी पर फैलती है, या `{ offset, value, easing }` (Rust में `Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)`)।

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| विकल्प | Rust (`KeyframeTiming`) | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | एक iteration, मिलीसेकंड में। |
| `delay` | `.delay(ms)` | 0 | पहले iteration से पहले। |
| `easing` | `.easing(easing)` | CSS `ease` | हर उस segment का curve जिसका अपना easing नहीं है। |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | कितने iterations, या `"infinite"`। |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` या `"alternate-reverse"`। |

ये CSS और Web Animations API की तरह चलते हैं:

- easing हर segment को आकार देता है, पूरे को नहीं: keyframe का `easing` उस segment को आकार देता है जो उससे शुरू होता है, और timing का `easing` बाकी हर segment को।
- बिना offset वाले keyframes अपने पड़ोसियों के बीच समान दूरी पर फैलते हैं; पहले का डिफ़ॉल्ट 0 और आख़िरी का 1 है।
- हर iteration अपने पहले keyframe पर छलांग के साथ शुरू होता है। offset 0 पर keyframe न हो तो मान वहीं से चलता है जहाँ वह है।
- `delay` के दौरान मान पहले से पहला keyframe धारण किए रहता है (CSS `animation-fill-mode: backwards`), इसलिए देर से शुरू होने वाली entrance विश्राम अवस्था वाले view के बजाय अपना पहला फ़्रेम दिखाती है। यह motions पर भी लागू होता है।
- `reverse` और `alternate` के पीछे की ओर वाले iterations segments को उलटे क्रम में चलाते हैं, हर एक का curve उलटकर।
- मान वहीं रहता है जहाँ आख़िरी iteration उसे छोड़ता है। उत्तर बताता है कि वे पूरे हुए या नहीं: पूरे होने पर `true`, किसी के रोकने पर `false`।

### Interpolation

`interpolate` किसी मान को piecewise linear segments के ज़रिए संख्याओं, रंगों या कोणों में map करता है, और एक नया node लौटाता है जिसे आप bind कर सकते हैं। एक मान कई properties चला सकता है। Rust में `interpolate(&input, &output)` संख्याओं में, `interpolate_colors(&input, &colors)` रंगों में map करता है, और `interpolate_with(&input, output, Interpolation { .. })` extrapolation और easing लेता है; TSX में `value.interpolate({ inputRange, outputRange })` ये सब लेता है।

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| विकल्प | Rust | विवरण |
|---|---|---|
| `inputRange` | input slice | बढ़ते क्रम में input stops। |
| `outputRange` | output slice, या `AnimationOutput` | हर stop के लिए एक output: संख्याएँ, रंग (`"#rrggbb"`, `"rgba(…)"`, नामित) या कोण (`"45deg"`, `"1rad"`)। |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | input सीमा के बाहर: `"clamp"` (डिफ़ॉल्ट), `"extend"` (अंतिम segments को जारी रखता है) या `"identity"` (input को ज्यों का त्यों पास करता है)। |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | वही, एक तरफ़ के लिए। |
| `easing` | `easing` | हर segment को आकार देता है। |

> [!IMPORTANT]
> Interpolations डिफ़ॉल्ट रूप से **clamp** करते हैं: input सीमा के बाहर output निकटतम सिरे पर बना रहता है। इसलिए scroll view को उसके शीर्ष से आगे खींचने पर scroll से जुड़ा header अपनी अंतिम अवस्था में रहता है। जब आप चाहें कि रेखा आगे बढ़ती रहे तो `extrapolate: "extend"` (`Extrapolate::Extend`) दें।

<a id="arithmetic-and-diffclamp"></a>

### अंकगणित और diffClamp

Nodes अंकगणित से भी जुड़ सकते हैं, और यह भी natively चलता है: `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (Rust में `a.modulo(b)`; धनात्मक `b` के लिए कभी ऋणात्मक नहीं, जैसे 0..360 में कोण), जहाँ `b` एक node या संख्या है। TSX में `Animated.add`, `subtract`, `multiply`, `divide` और `modulo` functions के रूप में यही काम करते हैं।

`diffClamp(min, max)` (`diff_clamp`) node के *बदलावों* का अनुसरण करता है और `min..max` के भीतर रहता है। scroll offset पर लगाने पर यह ऐसा header बनाता है जो content के ऊपर scroll होते ही छिप जाता है और नीचे scroll होते ही वापस आ जाता है:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

`{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`) के साथ, scroll रुकने पर आंशिक रूप से दिखता छूटा हुआ header उस गति को पूरा कर देता है: वह UI thread पर 200 ms में पूरी तरह दिखाई देने या पूरी तरह छिपने की स्थिति में आ जाता है, जो भी निकट हो। वह तभी छिपता है जब page कम से कम उसकी ऊँचाई जितना scroll हो चुका हो, इसलिए उससे कम scroll हुए page में पूरा header दिखता है। गति के दौरान फिर से scroll करने पर नियंत्रण वहीं से लिया जाता है जहाँ header है।

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## संयुक्त (composite) animations

Animations steps से बनते हैं (Rust में `Animation`, TSX में `nsh` से `Animated`) और पूरा tree natively चलता है: हर step UI thread पर उसी क्षण शुरू होता है जब पिछला खत्म होता है, बिना किसी अंतराल के और बीच में आपके किसी code के बिना।

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | विवरण |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | timing step। |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | spring step। |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | decay step। |
| `Animated.sequence(list)` | `Animation::sequence(list)` | एक के बाद एक। |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | सब एक साथ। |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | सब एक साथ, हर एक पिछले के `ms` बाद शुरू होता है, `from` से गिनकर: `"first"` (डिफ़ॉल्ट), `"last"`, `"center"` (बीच से बाहर की ओर लहर) या एक index (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`)। |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [keyframes](#keyframes) का एक step। |
| `Animated.delay(ms)` | `Animation::delay(ms)` | प्रतीक्षा करता है। |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | दोहराता है (डिफ़ॉल्ट रूप से हमेशा; Rust में `None`)। |

composite animation में `start()` होता है (TSX में callback और promise के साथ भी, दोनों को `{ finished }` मिलता है; Rust में await किया जा सकने वाला `bool`; इसे फिर से कॉल करने पर यह फिर से चलता है), `stop()` (जहाँ है वहीं रुक जाता है) और `reset()` (रुक जाता है और अपने मानों को वहाँ लौटा देता है जहाँ वे शुरू होते समय थे)। callback पूरे tree के लिए एक बार चलता है।

चलता हुआ animation अपने मानों को जीवित नहीं रखता: जब उन्हें रखने वाला component हट जाता है (उसके views और variables), तो अनंत loop भी उनके साथ रुक जाता है, और उसका उत्तर होता है कि वह पूरा नहीं हुआ (`false`)।

<a id="easing"></a>

## Easing वक्र

Easing curves डेटा हैं, जिनका मूल्यांकन natively होता है: TSX में `nsh` से `Easing`, Rust में `Easing` enum।

| TSX | Rust | विवरण |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | स्थिर गति; CSS का `ease`। |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`। |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Sinusoidal, वृत्ताकार, घातांकीय। |
| `Easing.back(s?)` | `Curve::Back(s)` | आगे बढ़ने से पहले पीछे खिंचता है (overshoot `s`, डिफ़ॉल्ट 1.70158)। |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | स्प्रिंग जैसा overshoot। |
| `Easing.bounce` | `Curve::Bounce` | अंत में उछलता है। |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | CSS की तरह cubic Bézier। |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | सरकने के बजाय `count` स्तरों के बीच छलांग लगाता है, जैसे CSS `steps()`: फ़्रेम-दर-फ़्रेम sprite, टिक-टिक करती सुई। `position` है `"jump-end"` (डिफ़ॉल्ट, साथ ही `"end"`), `"jump-start"` (`"start"`), `"jump-none"` या `"jump-both"`। |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | ये curves "in" curves हैं; `out` और `inOut` उन्हें पलट देते हैं। |

TSX में जहाँ भी easing स्वीकार किया जाता है, वहाँ आप नाम (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) या Bézier array `[x1, y1, x2, y2]` भी दे सकते हैं; Rust में `Easing::EaseIn`, `Easing::EaseOut` और `Easing::EaseInOut` CSS के curves हैं।

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

`Easing.sample(easing, count)` (Rust में `sample_easing`) 0 से 1 तक `count` समान दूरी वाले बिंदुओं पर curve लौटाता है, और `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) वे मान लौटाते हैं जिनसे होकर spring या decay गुज़रता है, हर फ़्रेम पर एक (डिफ़ॉल्ट 60 प्रति सेकंड), `config.from` (0) से उसके खत्म होने तक। इनकी गणना उसी native code से होती है जिससे animations चलते हैं, इसलिए curve का chart ठीक वही दिखाता है जो animation करता है:

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

layout animation **अगले** update के फ़्रेम बदलावों को natively animate करता है: जो views हिलते या आकार बदलते हैं वे अपने नए फ़्रेम तक सरकते हैं, नए views fade (या scale) होकर आते हैं, हटाए गए views fade होकर चले जाते हैं। इसे state बदलने से ठीक पहले कॉल करें: Rust में `animate_layout(..)`, TSX में `LayoutAnimation.configureNext(config)`।

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | विवरण |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | अगले commit के बदलावों को animate करता है; TSX में पूरा होने पर `onEnd` चलता है। |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | तीनों चरणों के लिए एक ही curve वाला config। |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | तैयार configs। |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | preset के साथ `animate_layout` | preset के साथ `configureNext`। |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | नाम, configs बनाने के लिए। |

config है `{ duration, create?, update?, delete? }` (Rust में `LayoutAnimation { create, update, delete }`): जोड़े गए views के लिए `create`, हिलाए या आकार बदले गए views के लिए `update`, हटाए गए views के लिए `delete`। हर चरण `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`) है, जहाँ `type` है `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` या `"keyboard"` (software keyboard का अपना curve, जो keyboard के हिलना शुरू करने के समय से गिना जाता है, ताकि जो उसके लिए जगह बनाता है वह उसके साथ चले; `LayoutCurve::Keyboard`), `property` वह है जिसे प्रकट और गायब होते views animate करते हैं (`"opacity"`, `"scaleXY"`, `"scale"`), और `springDamping` (0..1, डिफ़ॉल्ट 0.7; `LayoutCurve::Spring { damping }`) spring का overshoot तय करता है।

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

layout animation स्क्रीन पर कहीं भी, update द्वारा बदले गए हर फ़्रेम को कवर करता है: जो list refresh होती है या जो live data उसी update में आता है, वह भी साथ में चलता है। Rust component में, केवल उसे animate करें जो किसी एक element के बदलाव से हिलता है, `ElementRef::animate_layout(transition)` के साथ: element का अपना फ़्रेम और उसके content का, और उन views के फ़्रेम जिन्हें उसका आकार आगे धकेलता है (उसके siblings और उनके, स्क्रीन तक)। update के बाकी फ़्रेम तुरंत बदल जाते हैं। `nsh/base` के `Collapsible` और `AccordionPanel` इसी तरह अपना content प्रकट करते हैं।

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## क्या कहाँ चलता है

| | कहाँ चलता है | प्रति फ़्रेम आपका code |
|---|---|---|
| Transitions, keyframe animations | UI thread | कोई नहीं |
| Motions, keyframes, `timing` / `spring` / `decay`, composites | UI thread | कोई नहीं; आपके code को उनके खत्म होने की सूचना मिलती है |
| `interpolate`, अंकगणित, `diffClamp` | UI thread | कोई नहीं |
| `scrollValue`, `pan` / `pinch` / `rotation` | UI thread | कोई नहीं; आपके code को शुरू और अंत की सूचना मिलती है |
| Layout animations | UI thread | कोई नहीं |
| `requestAnimationFrame` loops (Rust में `request_animation_frame`), `onScroll` handlers, `PanResponder` | आपका code, फिर एक update | हर फ़्रेम |

`requestAnimationFrame` (TSX में एक global, जो display का अनुसरण करता है) का सहारा केवल उसी के लिए लें जिसे पहले से वर्णित नहीं किया जा सकता, जैसे आपके code में physics simulation। जो कुछ भी animated value हो सकता है, उसे animated value ही होना चाहिए।

<a id="reduced-motion"></a>

## कम गति (Reduced motion)

जब user कम गति माँगता है (iOS में "Reduce Motion", Android में "Remove animations"), तो Rust में `reduce_motion()` और TSX में `nsh` से `reduceMotion()` `true` होते हैं, और `motion-reduce:` / `motion-safe:` Tailwind variants लागू होते हैं।

[Motions](#motion) इस सेटिंग का अपने आप पालन करते हैं: `play` और `enter` बिना हिले तुरंत वहीं पहुँच जाते हैं जहाँ motion खत्म होता, और उत्तर यह होता है कि वह पूरा हुआ (`true`), ठीक वैसे ही जैसे चले हुए motion के लिए। exit फिर भी छिपे हुए पर खत्म होता है, entrance फिर भी विश्राम अवस्था में खत्म होता है। ऐसे motion के लिए जिसमें user के लिए ज़रूरी अर्थ है, जैसे progress spinner, `ignoreReduceMotion: true` (Rust में `play_ignoring_reduce_motion`) दें।

Transitions, keyframe animations, animated values, keyframes और composites जैसा लिखा है वैसा ही चलते हैं; इनका उपयोग करके कोई शांत विकल्प चुनें:

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

देखें [Accessibility](./accessibility.md#reduced-motion)।

<a id="related"></a>

## संबंधित

- [`nsh` का animation API](../modules/nsh.md#animation): TSX संदर्भ।
- [Touch और gestures](./touch-and-gestures.md): उँगली से animated values को चलाना।
- [Scrolling](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`।
- [Canvas](./canvas.md#driving-drawings-with-animated-values): ड्रॉइंग में animated values।
- [Style reference](../modules/style-reference.md): `transition*` और `animation*` keys।
