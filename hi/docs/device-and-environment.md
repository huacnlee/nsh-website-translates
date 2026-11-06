---
title: "डिवाइस और एनवायरनमेंट"
description: "विंडो का आकार, कलर स्कीम, फ़ॉन्ट स्केल, सेफ़ एरिया, प्लेटफ़ॉर्म, पिक्सल डेंसिटी और लेआउट डायरेक्शन को पढ़ना, और इनके बदलने पर प्रतिक्रिया देना।"
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# डिवाइस और परिवेश

ऐप जिस परिवेश में चलता है, वह ऐप के चलते समय बदलता रहता है: विंडो का आकार बदलता है (रोटेशन, स्प्लिट व्यू, Mac विंडो), उपयोगकर्ता डार्क मोड या बड़े टेक्स्ट साइज़ पर स्विच करता है, कीबोर्ड आता-जाता है। NSH इनमें से हर एक को **reactive accessor** के रूप में उपलब्ध कराता है: इसे सिग्नल की तरह कॉल करें, और जिसने भी इसे पढ़ा है (स्टाइल, टेक्स्ट, computed value) वह बदलाव होने पर अपडेट हो जाता है। न कोई listener जोड़ना पड़ता है, न हटाना।

Rust में accessors `nsh_core::prelude` के फ़ंक्शन हैं; TSX में वे सूचीबद्ध modules से आते हैं।

| Rust | TSX | मान |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | सरफ़ेस की चौड़ाई और ऊँचाई, पॉइंट में। |
| `dark()` | `colorScheme()` (`nsh`) | डार्क या लाइट: सिस्टम का, या ऐप का अपना (`set_color_scheme`, `setColorScheme`)। |
| `font_scale()` | `fontScale()` (`nsh`) | उपयोगकर्ता का पसंदीदा टेक्स्ट साइज़, डिफ़ॉल्ट के सापेक्ष (1 डिफ़ॉल्ट है)। |
| `safe_area()` | `safeArea()` (`nsh`) | सरफ़ेस के वे insets जो सिस्टम UI से ढके नहीं हैं: top, right, bottom, left। |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | जहाँ कॉल करने वाला component रेंडर होता है वहाँ के insets (पेज, डायलॉग)। |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | सॉफ़्टवेयर कीबोर्ड की ऊँचाई और एनिमेशन की अवधि। |
| `locale()` | `locale()` (`nsh`) | उपयोगकर्ता का locale, BCP 47 टैग के रूप में (`"en-US"`, `"zh-Hans-CN"`): `Intl` डिफ़ॉल्ट रूप से इसी के अनुसार फ़ॉर्मैट करता है। |
| `lifecycle()` | `lifecycle()` (`nsh`) | ऐप उपयोग में है या नहीं: `active`, `inactive` (दिखाई दे रहा है पर फ़ोकस नहीं है) या `background` ([बैकग्राउंड में](#in-the-background))। |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | [एक्सेसिबिलिटी](./accessibility.md) देखें। |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## विंडो का आकार और रिस्पॉन्सिव लेआउट

`window()` (TSX: `windowSize()`) उस सरफ़ेस का आकार है जिसमें NSH रेंडर करता है: फ़ोन पर स्क्रीन, स्प्लिट व्यू में iPad या Mac पर विंडो, और NSH के embed होने पर host view। इसका उपयोग केवल आकार नहीं, बल्कि लेआउट बदलने के लिए करें:

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

अक्सर flexbox, प्रतिशत और `aspect_ratio` (`aspectRatio`) आकार पढ़े बिना ही काम कर देते हैं; [Layout](./layout.md) देखें। Rust का `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` चौड़ाई के साथ स्टाइल बदलता है; TSX में Tailwind के साथ, breakpoint variants (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) और `portrait:` / `landscape:` भी विंडो के अनुसार चलते हैं: `class="grid grid-cols-2 md:grid-cols-4"`।

<a id="dark-mode"></a>

## डार्क मोड

जब तक ऐप अपना appearance सेट नहीं करता, appearance सिस्टम के अनुसार चलता है। Rust में डार्क मोड सपोर्ट करने का सबसे आसान तरीका लाइट और डार्क दोनों मान वाला रंग है, `AdaptiveColor::rgb(light, dark)`: appearance बदलने पर यह नेटिव रूप से स्विच हो जाता है, कुछ चलाना नहीं पड़ता। TSX में यह `dark:` Tailwind variant है, जो `colorScheme()` के `"dark"` होने पर लागू होता है:

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

बाकी सब कुछ के लिए, क्लोज़र या computed value में `dark()` (TSX: `colorScheme()`) पढ़ें; TSX में, कुछ रंगों से ज़्यादा के लिए, पैलेट एक बार बना लें:

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Rust components भी अपने रंग theme से लेते हैं, जिसमें लाइट और डार्क मान हैं (`nsh.json` `"theme"`, [Building with Rust](./rust.md) देखें), इसलिए वे भी सिस्टम के साथ स्विच होते हैं। स्टेटस बार को अपने बैकग्राउंड से मिलाने के लिए, अपने पेजों और डायलॉग को [`statusBar`](../modules/nsh-base.md#status-bar) दें, या ऐप को `nsh.json` में एक दें।

<a id="an-app-with-its-own-appearance"></a>

### अपने खुद के appearance वाला ऐप

जो ऐप हमेशा डार्क (या हमेशा लाइट) रहता है, वह यह `nsh.json` में बताता है, और `dark()` और `colorScheme()`, adaptive रंग, `dark:` क्लासेस, theme, स्टेटस बार की डिफ़ॉल्ट स्टाइल और alerts पहले फ़्रेम से उसी का अनुसरण करते हैं (पैकेज्ड ऐप भी उसी में लॉन्च होते हैं):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX: `nsh` से `setColorScheme`) इसे रन टाइम पर बदलता है, ऐप के भीतर appearance सेटिंग के लिए; `Appearance::System` (`"system"`) फिर से सिस्टम का अनुसरण करता है:

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> विकास के दौरान दोनों appearances टेस्ट करें: `xcrun simctl ui booted appearance dark` iOS सिमुलेटर को स्विच करता है, और Android की Quick Settings में डार्क थीम टॉगल है। बदलाव रीलोड के बिना, तुरंत आपके ऐप तक पहुँच जाता है।

<a id="text-size"></a>

## टेक्स्ट साइज़

`font_scale()` (TSX: `fontScale()`) उपयोगकर्ता की टेक्स्ट साइज़ सेटिंग (iOS पर Dynamic Type, Android पर font size) है, डिफ़ॉल्ट के सापेक्ष। टेक्स्ट और इनपुट अपने आप इसका अनुसरण करते हैं: उपयोगकर्ता के बड़ा टेक्स्ट माँगने पर `fontSize: 16` बड़ा रेंडर होता है। हर एलिमेंट के लिए आप इससे बाहर निकल सकते हैं या इसकी सीमा तय कर सकते हैं:

| Rust (`text` और `input` पर) | TSX (`<Text>` और `<Input>` पर) | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | सिस्टम के टेक्स्ट साइज़ का अनुसरण करें। |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (कोई नहीं) | इस टेक्स्ट पर लागू होने वाला सबसे बड़ा स्केल। |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

जो लेआउट टेक्स्ट का अपने आप अनुसरण नहीं करता, उसे ढालने के लिए `font_scale()` पढ़ें, जैसे टेक्स्ट बड़ा होने पर row को column में बदलना: Rust में `.style_when(|| font_scale() > 1.3, |s| s.flex_col())`, TSX में `flexDirection: fontScale() > 1.3 ? "column" : "row"`।

टेक्स्ट साइज़ टेक्स्ट को स्केल करता है: फ़ॉन्ट स्केलिंग की अनुमति देने वाला हर टेक्स्ट और इनपुट, और प्लेटफ़ॉर्म के alerts और toasts। लंबाइयाँ अपना आकार बनाए रखती हैं: स्पेसिंग, चौड़ाई और ऊँचाई, कोनों की त्रिज्या, बॉर्डर और इमेज, चाहे पॉइंट में हों या क्लासेस में (`p-4`, `rounded-lg`, `w-[2rem]`)। जिन बॉक्स का आकार उनकी सामग्री तय करती है, वे अपने टेक्स्ट के साथ बढ़ते हैं।

<a id="language-and-region"></a>

## भाषा और क्षेत्र

`locale()` उपयोगकर्ता का locale है, BCP 47 टैग के रूप में (Rust में `locale().as_str()`)। TSX में, `Intl` डिफ़ॉल्ट रूप से संख्याओं और तारीख़ों को उसी के अनुसार फ़ॉर्मैट करता है, इसलिए `new Intl.NumberFormat().format(1234.5)` `en-US` में `1,234.5` और `de-DE` में `1.234,5` देता है। अपने अनुवादों की स्ट्रिंग चुनने के लिए `locale()` पढ़ें: इसे पढ़ने वाले टेक्स्ट इसके बदलने पर अपडेट हो जाते हैं।

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## embedding ऐप में

किसी नेटिव ऐप के अंदर दिखाया गया ऐप, उस ऐप की अपनी सेटिंग्स का अनुसरण करता है, अगर वह उन्हें सेट करता है: embedding APIs का locale और टेक्स्ट साइज़ (Rust में [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) और [Windows](./windows.md) पर `AppView::set_locale` और `set_font_scale`, Swift में [iOS](./ios.md) पर `locale` और `fontScale`, Java में [Android](./android.md) पर `setLocale` और `setFontScale`) सिस्टम की भाषा और टेक्स्ट साइज़ की जगह लेते हैं। `locale()`, `Intl`, `fontScale()` और टेक्स्ट उनका तुरंत अनुसरण करते हैं, जैसे वे सिस्टम के बदलाव का करते हैं, और embedding ऐप के उन्हें हटाने पर सिस्टम के मान लौट आते हैं। इनका उपयोग तब करें जब नेटिव ऐप अपने उपयोगकर्ताओं को भाषा या टेक्स्ट साइज़ चुनने देता है।

<a id="in-the-background"></a>

## बैकग्राउंड में

`lifecycle()` (TSX में भी वही) बताता है कि उपयोगकर्ता ऐप का उपयोग कर रहा है या नहीं। फ़ोरग्राउंड में यह `active` होता है, जब ऐप अब भी दिखाई दे रहा हो पर फ़ोकस किसी और ऐप या विंडो के पास हो (या सिस्टम उसके ऊपर कुछ दिखा रहा हो: ऐप स्विचर, आती हुई कॉल) तब `inactive`, और जब वह दिखाई न दे तब `background`: फ़ोन पर बैकग्राउंड में, डेस्कटॉप पर minimize, वेब पर छिपा हुआ टैब। हर accessor की तरह यह इसे पढ़ने वालों को अपडेट करता है, इसलिए एक effect बैकग्राउंड में लाइव फ़ीड, polling या वीडियो को रोक सकता है और उपयोगकर्ता के लौटने पर फिर चालू कर सकता है:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

काम रोकने के लिए `background` का उपयोग करें, और उपयोगकर्ता जो बदलता है उसे बदलते ही सहेज लें: सिस्टम ऐप के बैकग्राउंड में जाने के कुछ सेकंड बाद उसे suspend कर सकता है, उससे पहले कि बदलाव पढ़ने वाला effect चल पाए। किसी नेटिव ऐप के अंदर दिखाया गया ऐप उस ऐप की स्थिति का अनुसरण करता है, और जहाँ ऐप की कई विंडो होती हैं (iPad, डेस्कटॉप) वहाँ व्यू उस विंडो का अनुसरण करता है जिसमें वह है। टेस्ट में, `nsh/test` का `app.setLifecycle("background")` ऐप को वहाँ ले जाता है ([Testing](./testing-and-trace.md#steps))।

## Safe areas

नॉच, होम इंडिकेटर, स्टेटस बार, Android का नेविगेशन बार और Mac Catalyst का टाइटल बार सरफ़ेस के कुछ हिस्सों को ढक लेते हैं। NSH ऐप हर प्लेटफ़ॉर्म पर किनारे से किनारे तक ड्रॉ करते हैं, और ढके हुए हिस्सों को insets के रूप में पाते हैं।

- `safe_area()` (TSX: `safeArea()`) सरफ़ेस के insets देता है।
- component का `cx.insets()` (TSX: `safeAreaInsets()`) **जहाँ component रेंडर होता है** वहाँ के insets देता है: नेविगेशन [पेज](./navigation.md#safe-areas-under-the-header) के अंदर वे उसके हेडर के नीचे से मापे जाते हैं, [डायलॉग](../elements/dialog.md) के अंदर वे डायलॉग के होते हैं। जो components कई जगह दिखाए जा सकते हैं उनमें इसे प्राथमिकता दें।
- CSS के `env(safe-area-inset-top)`, `-right`, `-bottom` और `-left` किसी भी व्यू को, जहाँ वह रेंडर होता है वहाँ के insets के अनुसार, `padding*` और `margin*` में pad करते हैं या स्पेस देते हैं (`calc(env(safe-area-inset-bottom) + 8px)` एक लंबाई जोड़ता है; Tailwind `pt-[env(safe-area-inset-top)]`; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...)। insets बदलने पर padding नेटिव रूप से अपडेट होती है ([Safe area](../elements/safe-area.md))।

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

Android पर, टूलबार के नीचे embed किया गया व्यू केवल सिस्टम बार के वही हिस्से पाता है जो उससे overlap करते हैं, UIKit की safe area की तरह: अगर वह स्टेटस बार तक नहीं पहुँचता तो कोई top inset नहीं।

<a id="the-platform"></a>

## प्लेटफ़ॉर्म

Rust में `os()`, `os_version()`, `idiom()`, `is_desktop()` और `is_catalyst()`, और TSX में `nsh` से `platform` constant, बताते हैं कि ऐप कहाँ चल रहा है। ऐप के चलते समय ये वही रहते हैं।

| Rust | TSX | विवरण |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` या `Os::Web` (`os().name()` TSX की स्ट्रिंग है)। Mac Catalyst iOS है। |
| `os_version()` | `platform.version` | major और minor; Android पर API level और 0। |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` या `Desktop`; `Desktop` ठीक वहीं जहाँ `is_desktop()` सही हो। |
| `is_desktop()` | `platform.desktop` | macOS, Windows या Linux, या डेस्कटॉप ब्राउज़र ([Desktop and mobile](./platform-specific.md#desktop-and-mobile))। |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, अपने दोनों idioms में से किसी में भी। |

TSX का `platform` पूरा:

| सदस्य | विवरण |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` या `"web"`। Mac Catalyst `"ios"` रिपोर्ट करता है। |
| `platform.version` | एक स्ट्रिंग: iOS और डेस्कटॉप पर: OS वर्शन (`"17.5"`); Android पर: API level (`"35"`); वेब पर: `"0.0"`। |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` या `"desktop"`। `"desktop"` ठीक वहीं जहाँ `platform.desktop` `true` है। `"mac"` Mac Catalyst के अंतर्गत UIKit का Mac idiom है, जो एक मोबाइल idiom है। |
| `platform.desktop` | डेस्कटॉप व्यवहार लागू होता है: macOS, Windows, Linux और डेस्कटॉप ब्राउज़र। `desktop={{…}}` props और `platform.select({ desktop })` इसका अनुसरण करते हैं। |
| `platform.catalyst` | ऐप Mac Catalyst (`os` `"ios"`) के अंतर्गत चलता है, Mac या iPad idiom में। |
| `platform.select(spec)` | इस प्लेटफ़ॉर्म के लिए मान; [Platform-specific code](./platform-specific.md#platformselect) देखें। |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` headless रूप में iOS की तरह चलता है।

[Linux](./linux.md) पर, `platform.os` `"linux"` है, idiom `"desktop"` है और `platform.version` कर्नेल का major और minor वर्शन है (`"6.12"`): डिस्ट्रीब्यूशन अपने रिलीज़ को ऐसे नंबर देते हैं जिनकी तुलना नहीं की जा सकती। वहाँ safe area और कीबोर्ड की ऊँचाई 0 होती है, `colorScheme()` डेस्कटॉप की सेटिंग (XDG settings portal) का लाइव अनुसरण करता है, `fontScale()` डेस्कटॉप की टेक्स्ट स्केलिंग का और `pixelRatio()` डिस्प्ले के स्केल का, fractional स्केल सहित।

[macOS](./macos.md) पर (AppKit backend), `platform.os` `"macos"` है, idiom `"desktop"` है और `platform.version` macOS वर्शन है। safe area और कीबोर्ड की ऊँचाई 0 होती है, `colorScheme()` सिस्टम के appearance का लाइव अनुसरण करता है, `fontScale()` 1 होता है और `pixelRatio()` डिस्प्ले का backing scale।

[Windows](./windows.md) पर, `platform.os` `"windows"` है, idiom `"desktop"` है और `platform.version` `"10.0"` है, Windows 11 पर भी (Windows ने वर्शन नंबर बनाए रखा)। safe area और कीबोर्ड की ऊँचाई 0 होती है, `colorScheme()` Settings > Personalization > Colors का लाइव अनुसरण करता है, `fontScale()` Text size सेटिंग का (1 से 2.25), `reduceMotion()` animation effects सेटिंग का, `pixelRatio()` मॉनिटर के स्केल का, और `Intl` उपयोगकर्ता के regional format में फ़ॉर्मैट करता है।

ब्राउज़र में ([वेब रनटाइम](./web.md)), `platform.os` `"web"` है और `platform.version` `"0.0"` है। idiom माउस और कम से कम 600 पॉइंट चौड़ी विंडो के साथ `"desktop"` होता है, टैबलेट पर `"pad"` और फ़ोन पर `"phone"`, जो ऐप शुरू होते समय तय होता है। locale, `reduceMotion()`, `fontScale()` (ब्राउज़र का टेक्स्ट साइज़), `pixelRatio()`, safe area और कीबोर्ड की ऊँचाई ब्राउज़र से आते हैं और उसका लाइव अनुसरण करते हैं।

<a id="pixel-density"></a>

## पिक्सेल घनत्व

Rust में `pixel_ratio()` और `round_to_nearest_pixel(points)`, और TSX में `nsh` से `pixelRatio()`, पॉइंट और डिवाइस पिक्सेल के बीच रूपांतरण करते हैं।

| Rust | TSX | विवरण |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | प्रति पॉइंट डिवाइस पिक्सेल (ज़्यादातर फ़ोन पर 2 या 3), reactive। |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | पॉइंट, निकटतम डिवाइस पिक्सेल तक राउंड किए हुए। |

एक hairline, एक डिवाइस पिक्सेल ऊँची:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` और `pixelRatio()` reactive हैं, इसलिए hairline उस विंडो का अनुसरण करती है जिसे दूसरी density वाली स्क्रीन पर ले जाया गया हो।

<a id="right-to-left"></a>

## दाएँ से बाएँ (RTL)

जब डिवाइस की भाषा दाएँ से बाएँ लिखी जाती है (अरबी, हिब्रू, फ़ारसी, ...), NSH ऐप का लेआउट दाएँ से बाएँ करता है: rows दाईं ओर से चलती हैं, logical स्टाइल प्रॉपर्टीज़ अपनी दाएँ-से-बाएँ दिशाएँ लेती हैं, टेक्स्ट दाईं ओर align होता है, और नेटिव विजेट mirror होते हैं। लेआउट की दिशा उपयोगकर्ता की भाषा का अपने आप अनुसरण करती है। व्यू की `direction` स्टाइल (`"ltr"`, `"rtl"` या `"inherit"`; Rust में `.direction(LayoutDirection::..)`) उसके subtree की दिशा तय करती है; root व्यू पर यह ऐप की दिशा तय करती है।

बदलाव ऐप को रीस्टार्ट किए बिना तुरंत लागू होते हैं; इस पेज का डेमो `direction` स्टाइल को टॉगल करता है।

दोनों दिशाओं में काम करने वाले लेआउट logical प्रॉपर्टीज़ से लिखें: Rust में `ms` / `me` और `ps` / `pe` (Tailwind के नाम), TSX में `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` आदि, जिनका अर्थ बाएँ-से-दाएँ लेआउट में बाएँ और दाएँ है और दाएँ-से-बाएँ में उल्टा। `left` और `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) CSS की तरह दोनों में अपनी दिशाएँ बनाए रखते हैं। `direction` स्टाइल (`"inherit"`, `"ltr"`, `"rtl"`) किसी subtree के लिए दिशा override करती है, उदाहरण के लिए फ़ोन नंबर या मीडिया प्लेयर के कंट्रोल को बाएँ से दाएँ रखने के लिए। `rtl:` और `ltr:` Tailwind variants हर दिशा के लिए अलग लागू होते हैं।

क्षैतिज स्क्रॉल व्यू और लिस्ट दाएँ-से-बाएँ लेआउट में दाएँ सिरे से शुरू होती हैं। Android पर, नेटिव विजेट के mirror होने के लिए host ऐप को अपने manifest में `android:supportsRtl="true"` घोषित करना होगा।

<a id="related"></a>

## संबंधित

- [`nsh` का device API](../modules/nsh.md#device): संदर्भ।
- [Platform-specific code](./platform-specific.md): `platform.select`, platform props और modules।
- [एक्सेसिबिलिटी](./accessibility.md): स्क्रीन रीडर और reduced motion।
- [Safe area](../elements/safe-area.md), [Keyboard](../elements/keyboard.md) और [स्टेटस बार](../modules/nsh-base.md#status-bar)।
- [Tailwind](./tailwind.md): `dark:`, breakpoint और orientation variants।
