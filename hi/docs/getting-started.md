---
title: "शुरू करें"
description: "nsh init के साथ Rust या TSX में ऐप बनाएँ, उसे iOS, Android, macOS, Windows, Linux या वेब पर चलाएँ, अपने ऐप में TSX मॉड्यूल होस्ट करें और उन्हें हस्ताक्षरित पैकेज के रूप में शिप करें, या ऐप को अलग से पैकेज करें।"
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---

# शुरू करें

यह गाइड एक NSH ऐप बनाती है, उसे आपके लक्षित प्लेटफ़ॉर्म पर चलाती है और शिप करती है। NSH ऐप Rust या TSX में लिखे जाते हैं, और दोनों एक ही इंजन पर चलते हैं: Rust आपके ऐप को JavaScript VM के बिना नेटिव कोड में कंपाइल करता है, और TSX हॉट अपडेट के साथ QuickJS पर चलता है, ऐसे मॉड्यूल के रूप में जिन्हें नेटिव ऐप रन टाइम पर लोड कर सकता है। गाइड पहले Rust ऐप को और फिर उसी ऐप को TSX में दिखाती है। यह मानकर चलती है कि `nsh` इंस्टॉल है और आपके `PATH` में है ([इंस्टॉलेशन](./installation.md)); चेकआउट में इसके बजाय `./target/debug/nsh` का उपयोग करें।

> [!TIP]
> आपके पास ऐप प्रोजेक्ट नहीं है? पहले दो सेक्शन में उसकी ज़रूरत नहीं है: `nsh run` ऐप को आपके कंप्यूटर की विंडो में, iOS सिमुलेटर में, Android डिवाइस पर या ब्राउज़र में दिखाता है। आप यहीं रुक सकते हैं, या [इसे स्टैंडअलोन ऐप के रूप में पैकेज कर सकते हैं](#or-ship-it-as-a-standalone-app)।

<a id="create-an-app"></a>

## ऐप बनाएं

टर्मिनल पर `nsh init` पूछता है कि ऐप किसमें लिखा है: `rust`, `ts` या `mixed` (TSX, अपने Rust क्रेट के साथ)। `--template` बिना पूछे चुन लेता है।

<a id="in-rust"></a>

### Rust में

```sh
nsh init my-app --template rust
```

`nsh init` डायरेक्टरी बनाता है और एक Cargo प्रोजेक्ट लिखता है:

| फ़ाइल | यह क्या है |
|---|---|
| `src/lib.rs` | ऐप: उसका रूट कंपोनेंट, स्टेट और हैंडलर |
| `src/main.rs` | `cargo run` के लिए उसी रूट को macOS, Windows या Linux पर माउंट करता है |
| `Cargo.toml` | क्रेट, जो CLI के संस्करण पर `nsh-core` और `nsh-base` पर निर्भर है |
| `nsh.json` | ऐप का नाम, id, संस्करण और बिल्ड नंबर, उसका क्रेट (`"rust": "."`) और रूट कंपोनेंट (`"root": "App"`) ([प्रोजेक्ट संरचना](./project-structure.md#nshjson)) |
| `App.test.tsx` | रूट का टेस्ट, TypeScript (`nsh test`) में, आपके एडिटर के लिए `tsconfig.json` और `.nsh/types` के साथ |
| `README.md` | ऐप को कैसे चलाएं, टेस्ट करें और पैकेज करें, और बाद में TSX एंट्री कैसे जोड़ें |
| `.gitignore` | `.nsh/` और `target/` को अनदेखा करता है |

Rust डेवलपमेंट के लिए Rust टूलचेन ([rustup](https://rustup.rs)) चाहिए; `nsh` कमांड ऐप के रनर को crates.io पर मौजूद NSH के क्रेट से, CLI के संस्करण पर बनाते हैं।

<a id="in-tsx"></a>

### TSX में

```sh
nsh init my-app --template ts
```

TSX ऐप एक या अधिक `.tsx` फ़ाइलें और एक एंट्री होता है: वह जिसे `nsh run` चलाता है, और जिसे होस्ट ऐप मॉड्यूल के रूप में लोड करता है।

| फ़ाइल | यह क्या है |
|---|---|
| `App.tsx` | एंट्री मॉड्यूल: ऐप को `mount` से रेंडर करता है |
| `App.test.tsx` | उसका टेस्ट (`nsh test`) |
| `nsh.json` | ऐप का नाम, id, संस्करण और बिल्ड नंबर ([प्रोजेक्ट संरचना](./project-structure.md#nshjson)) |
| `tsconfig.json` | `.nsh/tsconfig.json` को एक्सटेंड करता है, जो NSH की TypeScript सेटिंग्स हैं और `nsh` को `.nsh/types` की डिक्लेरेशन से रिज़ॉल्व करती हैं |
| `.gitignore` | `.nsh/` और `target/` को अनदेखा करता है |
| `.nsh/types/` | आपके एडिटर के लिए हर NSH मॉड्यूल की जनरेट की गई डिक्लेरेशन |

जो फ़ाइलें पहले से मौजूद हैं वे जस की तस रहती हैं, इसलिए आप इसे ऐसी डायरेक्टरी में भी चला सकते हैं जिसमें इनमें से कुछ फ़ाइलें हों; Rust ऐप नई डायरेक्टरी में बनता है।

दोनों के लिए, डिस्प्ले नाम डिफ़ॉल्ट रूप से डायरेक्टरी का नाम होता है; कोई और नाम चुनने के लिए `--name "My App"` दें। id `com.example.<name>` बन जाता है: शिप करने से पहले इसे `nsh.json` में बदल लें। `nsh init my-app --template mixed` ऐसा TSX ऐप बनाता है जो Rust क्रेट भी है (`App.tsx` के बगल में `Cargo.toml` और `src/lib.rs`), जिसके कंपोनेंट, मॉड्यूल और क्लास को `App.tsx` इम्पोर्ट करता है ([Rust के साथ बिल्ड करना](./rust.md))।

<a id="the-root-component"></a>

### रूट कंपोनेंट

दोनों टेम्पलेट एक ही ऐप बनाते हैं, एक काउंटर:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

Rust में:

- **`use nsh_core::prelude::*`** प्रिमिटिव (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...), [सिग्नल](./reactivity.md) और टाइप्ड स्टाइल मेथड लाता है (`.p_safe_area()` व्यू में [सेफ़ एरिया](../elements/safe-area.md) के अनुसार पैडिंग देता है); **`nsh_base`** में बिना स्टाइल वाले बेस कंपोनेंट (`button()`, कीबोर्ड, डायलॉग) और `theme()` हैं, यानी वे रंग और रेडियस जिनसे ऐप के कंपोनेंट ड्रॉ होते हैं ([थीम](./rust.md#theme))।
- **`#[component] pub fn App()`** एक कंपोनेंट है: ऐसा फ़ंक्शन जो **एक बार** चलता है और अपने एलिमेंट लौटाता है। `nsh.json` का `"root": "App"` उसे नाम देता है, और `nsh run` उसे माउंट करता है। `signal(0_u32)` ऐसा मान बनाता है जो समय के साथ बदलता है।
- **`text(move || format!(…, count.get()))`** टेक्स्ट को सिग्नल से बाँधता है: जब `count` बदलता है, NSH यह क्लोज़र फिर से चलाता है और केवल इसी एक टेक्स्ट को अपडेट करता है, और कुछ नहीं। स्टाइल भी इसी तरह क्लोज़र लेते हैं: `.bg(move || theme().primary)` थीम के साथ डार्क मोड में बदल जाता है।
- **`.on_press(..)`** व्यू को प्रेस का जवाब देने लायक बनाता है; `.active(|s| s.opacity(0.6))` दबे होने पर उसकी स्टाइल है, जो नेटिव रूप से लागू होती है। बटन ऐप का अपना है: NSH प्रिमिटिव और क्षमताएँ देता है, और ऐप अपना UI उन्हीं से बनाता है।
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** टाइप्ड स्टाइल मेथड हैं, जिनके नाम Tailwind की यूटिलिटी की तरह रखे गए हैं, पॉइंट (`px`) में। लेआउट flexbox है, और चाइल्ड डिफ़ॉल्ट रूप से कॉलम में स्टैक होते हैं ([लेआउट](./layout.md))।
- **`#[native_module("my-app/native")]`** बताता है कि TSX एंट्री क्रेट से क्या इम्पोर्ट कर सकती है, उस समय के लिए जब आप ऊपर से TSX स्क्रीन जोड़ें ([Rust के साथ बिल्ड करना](./rust.md#extending-a-rust-app-with-tsx))।

TSX में:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` कोर मॉड्यूल है: सिग्नल, `mount`, अन्य रिएक्टिव प्रिमिटिव, और होस्ट एलिमेंट। इसे नेटिव रनटाइम परोसता है, यह बंडल नहीं होता। **`nsh/base`** में बेस कंपोनेंट हैं, जैसे Rust में `nsh_base` में हैं।
- **`function App()`** एक कंपोनेंट है जो **एक बार** चलता है। **`{count()}`** JSX के अंदर सिग्नल पढ़ता है: कंपाइलर कॉल देखता है और इस टेक्स्ट को सिग्नल के पीछे चलने वाला बना देता है।
- **`<View onPress>`** एक नेटिव व्यू है जो प्रेस पर प्रतिक्रिया देता है; `active:` क्लास दबे होने पर उसकी स्टाइल हैं। `View`, `Text`, `Image`, `Scroll` और अन्य [होस्ट एलिमेंट](../elements/index.md) `nsh` से इम्पोर्ट होते हैं (`Input` `nsh/base` से); केवल `If` और `Each` को इम्पोर्ट की ज़रूरत नहीं।
- **`class`** [Tailwind](./tailwind.md) क्लास लेता है; `style={{ … }}` camelCase स्टाइल प्रॉपर्टी का ऑब्जेक्ट लेता है, जिसमें संख्याएँ पॉइंट में होती हैं। `bg-background`, `bg-primary`, `text-primary-foreground` और `rounded-(--radius)` ऐप की थीम के टोकन के नाम हैं ([थीम टोकन](./tailwind.md#theme-tokens)): वे अपने आप डार्क मोड के साथ बदलते हैं, और `nsh.json` में `"theme"` उन्हें नई स्टाइल देता है।
- **`mount(App)`** कंपोनेंट को ऐप की सरफ़ेस में रेंडर करता है।

> [!IMPORTANT]
> टेक्स्ट टेक्स्ट एलिमेंट में दिखता है: Rust में `text(..)`, TSX में `<Text>`। TSX में `<View>` (`<View>Hello</View>`) में सीधे लिखा टेक्स्ट बिल्ड एरर है जो उसी की ओर इशारा करता है, और किसी एक्सप्रेशन द्वारा वहाँ रखी गई स्ट्रिंग (`<View>{name}</View>`) लॉग में रिपोर्ट की जाती है।

<a id="develop-it"></a>

## इसे विकसित करें

<a id="run-it"></a>

### इसे चलाएं

`nsh run` ऐप बनाता है, उसे लॉन्च करता है और आपके एडिट करते समय दोबारा बिल्ड करता है; ऐप के लॉग टर्मिनल में दिखते हैं। इसे ऐप की डायरेक्टरी दें: यह Rust ऐप का रूट चलाता है, या TSX ऐप का `App.tsx` (`nsh run my-app/App.tsx` किसी और एंट्री का नाम देता है)।

Rust ऐप के लिए, `nsh run` टारगेट के लिए ऐप का अपना रनर बनाता है, जिसमें आपका क्रेट और रूट माउंट होते हैं और QuickJS नहीं होता, और उसे शुरू करता है; Rust कोड में बदलाव होने पर वह फिर से बिल्ड होता है और ऐप रीस्टार्ट होता है। ऐप की डायरेक्टरी में `cargo run` उसी रूट को सीधे डेस्कटॉप बैकएंड पर शुरू करता है। TSX ऐप के लिए, `nsh run` एक डेव सर्वर और एक डेवलपमेंट होस्ट शुरू करता है जो ऐप को उसी से लोड करता है, और हर सेव पर चल रहे ऐप को पैच करता है।

`--target` के बिना, `nsh run` उसी मशीन का उपयोग करता है जिस पर आप हैं: macOS पर AppKit विंडो, Windows पर Win32 विंडो और Linux पर GTK विंडो। `--target` से कोई दूसरा प्लेटफ़ॉर्म चुनें:

| टारगेट | कमांड | कहाँ से चलता है |
|---|---|---|
| iOS सिमुलेटर | `nsh run my-app --target ios` | Xcode वाला macOS |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (डिफ़ॉल्ट) |
| Windows | `nsh run my-app` | Windows (डिफ़ॉल्ट) |
| Linux (GTK 4) | `nsh run my-app` | Linux (डिफ़ॉल्ट) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### iOS सिमुलेटर

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` पहले से बूट हुए सिमुलेटर का उपयोग करता है, या कोई न चल रहा हो तो सबसे नए iPhone को बूट करता है, और ऐप (Rust ऐप का रनर, या डेवलपमेंट होस्ट) उसमें इंस्टॉल करता है। `--device` नाम या UDID से सिमुलेटर चुनता है।

#### Android

```sh
nsh run my-app --target android
```

पहले कोई एमुलेटर शुरू करें या डिवाइस कनेक्ट करें (`adb devices` उनकी सूची देता है; NSH पहले वाले का उपयोग करता है)। `nsh` ऐप को उस पर इंस्टॉल करता है: Rust ऐप का अपना `libnsh.so`, या डेवलपमेंट होस्ट APK (केवल रनटाइम बदलने पर दोबारा बनता है) जिसके डेव सर्वर पोर्ट को `adb reverse` से डिवाइस पर फ़ॉरवर्ड किया जाता है, इसलिए यह साझा नेटवर्क के बिना USB पर काम करता है।

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

ऐप डेस्कटॉप Mac ऐप के रूप में खुलता है (AppKit, आकार बदलने योग्य विंडो में), जिसमें टच की जगह माउस, ट्रैकपैड और कीबोर्ड इनपुट होते हैं। इसके लिए macOS 14 या बाद का संस्करण चाहिए; [macOS](./macos.md) देखें।

<a id="windows-default-on-windows"></a>

#### Windows (Windows पर डिफ़ॉल्ट)

```sh
nsh run my-app
```

ऐप डेस्कटॉप विंडो (1200×800 पॉइंट) में खुलता है, जिसमें माउस, टचपैड, टच और कीबोर्ड इनपुट होते हैं। इसके लिए Windows 10 1809 या बाद का संस्करण चाहिए; [Windows](./windows.md) देखें।

<a id="linux-default-on-linux"></a>

#### Linux (Linux पर डिफ़ॉल्ट)

```sh
nsh run my-app
```

ऐप GTK विंडो (390×844 पॉइंट) में खुलता है। इसके लिए GTK 4.14 या बाद का संस्करण चाहिए; [Linux](./linux.md) देखें।

#### Web

```sh
nsh run my-app --target web
```

`nsh` पेज का पता प्रिंट करता है; उसे ब्राउज़र में खोलें। Rust ऐप आपके क्रेट के साथ WebAssembly के रूप में चलता है, और बदलाव के बाद खुला पेज नया बिल्ड अपने आप लोड कर लेता है; [Web](./web.md) देखें।

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

ऐप आपके Mac पर iPhone के आकार की विंडो (390×844 पॉइंट) में खुलता है। फ़ोन पर ऐप कैसा दिखता है, यह देखने का यह सबसे तेज़ तरीका है: बूट करने के लिए कोई सिमुलेटर नहीं। यह iOS की तरह UIKit का उपयोग करता है, इसलिए माउस व्हील से स्क्रोल जैसे Mac-विशिष्ट व्यवहार को छोड़कर, जो आप देखते हैं वही iPhone दिखाता है। Mac ऐप के लिए `--target macos` का उपयोग करें।

<a id="edit-it"></a>

### इसे संपादित करें

`nsh run` को चलता रहने दें और बटन का लेबल बदलें:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

सेव करें। Rust ऐप दोबारा बिल्ड होता है और नए लेबल के साथ रीस्टार्ट होता है; गिनती फिर से शुरू होती है। TSX ऐप को हॉट अपडेट मिलता है: CLI दोबारा बिल्ड करके पैच भेजता है, और होस्ट बदले हुए मॉड्यूल को फिर से चलाता है और केवल उन्हीं कंपोनेंट को दोबारा रेंडर करता है जिनका कोड बदला है। यहाँ वह `App` है, जो `count` सिग्नल का मालिक है, इसलिए गिनती यहाँ भी फिर से शुरू होती है।

UI के हिस्सों को अपने कंपोनेंट में, या ऐसे सामान्य फ़ंक्शन में ले जाएँ जो एलिमेंट लौटाते हैं:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

TSX में, जब आप ऐसा कंपोनेंट एडिट करते हैं जो स्टेट का मालिक नहीं है तब भी स्टेट बनी रहती है: कुछ बार टैप करें, फिर `TapButton` का रंग बदलें, और बटन अपडेट हो जाता है जबकि गिनती वही रहती है। हॉट रिप्लेसमेंट हर टॉप-लेवल कंपोनेंट के लिए अलग-अलग काम करता है: बड़े अक्षर से शुरू होने वाले नाम वाला ऐसा फ़ंक्शन जिसकी बॉडी में JSX हो। कंपोनेंट तब दोबारा रेंडर होता है जब उसका अपना कोड बदलता है, या जब मॉड्यूल में कंपोनेंट के बाहर का कोड बदलता है (उसका उपयोग किया गया कोई कॉन्स्टैंट, कोई हेल्पर)। यदि कोई एडिट अपनी जगह पर लागू नहीं हो सकता (उदाहरण के लिए, वह ऐसा NSH मॉड्यूल इम्पोर्ट करता है जो चल रहे ऐप ने अभी इम्पोर्ट नहीं किया, या `nsh.json` की क्षमताएँ बदलता है), तो होस्ट पूरा ऐप फिर से लोड करता है।

<a id="errors"></a>

#### त्रुटियाँ

Rust कंपाइल एरर cargo के आउटपुट के साथ टर्मिनल में प्रिंट होता है, और अगले सेव पर `nsh run` फिर से बिल्ड करता है। TSX बिल्ड एरर टर्मिनल में प्रिंट होता है और डिवाइस पर फ़ाइल, लाइन और कॉलम के साथ लाल ओवरले के रूप में दिखता है; ऐप आखिरी अच्छे बिल्ड को चलाता रहता है। अगला बिल्ड सफल होने पर ओवरले गायब हो जाता है (पहले हटाने के लिए उस पर टैप करें)। रन टाइम पर फेंका गया एक्सेप्शन भी इसी तरह दिखता है, जिसका स्टैक आपके `.tsx` सोर्स से मैप होकर दिखता है।

<a id="host-it-in-your-app"></a>

## इसे अपने ऐप में होस्ट करें

नेटिव ऐप NSH को अपने ही व्यू में दिखाता है: iOS पर `NshAppView` (एक `UIView`), Android पर `NshView` (एक Android `View`), और macOS, Windows, Linux और GPUI ऐप में `AppView`। इसे किसी भी अन्य व्यू की तरह, किसी भी स्क्रीन पर, जितनी बार चाहें रखें।

Rust रूट ऐप के बिल्ड का हिस्सा है: ऐप आपके क्रेट को लिंक करता है और रूट को macOS, Windows, Linux, GPUI और iOS के `AppView` पर `AppSource::Rust` से माउंट करता है ([Rust के साथ बिल्ड करना](./rust.md#an-app-written-in-rust))। TSX ऐप एक मॉड्यूल है जिसे व्यू लोड करता है: डेवलपमेंट के दौरान डेव सर्वर से, रिलीज़ में बिल्ट बंडल से या डाउनलोड किए गए, साइन किए गए पैकेज से। नीचे के सेक्शन TSX मॉड्यूल लोड करते हैं।

### iOS

Debug में `NativeShellDev.xcframework` और Release में `NativeShell.xcframework` लिंक करें ([iOS ऐप में एम्बेड करना](./ios.md)), फिर:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` मॉड्यूल को ऐप तक परोसता है और हर सेव को पुश करता है, जैसे `nsh run` अपने होस्ट के साथ करता है। रिलीज़ बिल्ड के लिए, `nsh build my-app --release --out MyApp/nsh` बंडल को ऐसे फ़ोल्डर में लिखता है जिसे आप ऐप के रिसोर्स में जोड़ते हैं।

### Android

डीबग बिल्ड के लिए `nsh-dev.aar` और रिलीज़ बिल्ड के लिए `nsh.aar` जोड़ें ([Android ऐप में एम्बेड करना](./android.md)), फिर:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows और Linux

Rust में लिखे डेस्कटॉप ऐप NSH को `AppView` से एम्बेड करते हैं, `nsh-platform-macos`, `nsh-platform-windows`, `nsh-platform-linux` और `nsh-platform-gpui` क्रेट से: `NSView`, चाइल्ड विंडो, GTK विजेट या GPUI व्यू जो Rust रूट को माउंट करता है या बिल्ट बंडल लोड करता है। [macOS](./macos.md#embedding-in-a-mac-app), [Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) और [GPUI](./gpui.md) देखें, और सभी होस्ट की साथ-साथ तुलना के लिए [प्लेटफ़ॉर्म](./platforms.md#embed-in-a-native-app) देखें।

<a id="what-the-module-may-do"></a>

### मॉड्यूल क्या कर सकता है

iOS और Android पर, मॉड्यूल लोड करने से पहले होस्ट तय करता है कि वह क्या कर सकता है: `grantCapabilities` नेटवर्क होस्ट और अन्य क्षमताएँ तय करता है जिन तक वह पहुँच सकता है, और सीमाएँ उसकी मेमोरी, कॉल टाइम और नोड संख्या को सीमित करती हैं ([सैंडबॉक्स और क्षमताएँ](./sandbox-and-capabilities.md))। मॉड्यूल को अपने नेटिव व्यू (मैप, चार्ट, डिज़ाइन-सिस्टम कंपोनेंट) देने के लिए, उन्हें [नेटिव कंपोनेंट](./native-components.md) के रूप में रजिस्टर करें।

<a id="ship-updates-as-signed-packages"></a>

## साइन किए गए पैकेज के रूप में अपडेट शिप करें

रिलीज़ के बाद ऐप जो TSX मॉड्यूल डाउनलोड करता है, वह साइन किए गए पैकेज के रूप में आता है। एक बार रूट की बनाएँ और उसे ऑफ़लाइन रखें, उससे रिलीज़ की को प्रमाणित करें, और प्रकाशित करें:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

ऐप रूट की पब्लिक की पर भरोसा करता है और जो डाउनलोड करता है उसे लोड करता है; कुछ भी चलाने से पहले NSH सिग्नेचर, सर्टिफ़िकेट और रिवोकेशन लिस्ट सत्यापित करता है:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android में यही प्रवाह `NshTrust` और `NshPackage` के साथ है। होस्टिंग, डिलीवरी और रिवोकेशन का विस्तृत विवरण: [साइन किए गए पैकेज](./signed-packages.md)।
<a id="or-ship-it-as-a-standalone-app"></a>

## या इसे स्टैंडअलोन ऐप के रूप में शिप करें

`nsh package` एक इंस्टॉल करने योग्य ऐप बनाता है, Rust या TSX, बिना किसी अपने Xcode प्रोजेक्ट या Gradle बिल्ड के:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Rust ऐप को उसके अपने रनर के साथ पैकेज किया जाता है, जो आपके crate और NSH के crates से बनता है और जिसका रूट माउंट किया जाता है; TSX ऐप को पहले से बने रनटाइम के साथ पैकेज किया जाता है। विकल्प, साइनिंग और आइकन: [Packaging](./packaging.md)।

<a id="try-it-in-the-terminal"></a>

## टर्मिनल में आज़माएँ

`nsh test` ऐप को headless चलाता है, बिना किसी डिवाइस या विंडो के। Rust ऐप के `nsh.json` या TSX ऐप के एंट्री को देने पर, यह ऐप खोलता है, उसे चलने देता है और जो कुछ वह माउंट करता है उसे प्रिंट करता है; `--trace` के साथ, नेटिव व्यू ऑपरेशन और हर कमिट का समय भी प्रिंट करता है ([Testing](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

डायरेक्टरी देने पर, यह ऐप के टेस्ट चलाता है: हर टेम्पलेट का `App.test.tsx` ऐप खोलता है, उसका बटन दबाता है और जो दिखता है उसे जाँचता है (`nsh test my-app`)। Rust ऐप का टेस्ट उसका रूट खोलता है (`open(".")`); उसे `cargo test` में `nsh_testing::Headless` के साथ भी टेस्ट किया जा सकता है ([Building with Rust](./rust.md#testing))।

<a id="next-steps"></a>

## अगले चरण

- [Building with Rust](./rust.md): Rust ऐप, उनका थीम, और Rust crate के ऊपर TSX।
- [JSX and components](./jsx-and-components.md) और [Reactivity](./reactivity.md): कंपोनेंट और सिग्नल, Rust और TSX दोनों में।
- [Platforms](./platforms.md): हर प्लैटफ़ॉर्म क्या सपोर्ट करता है, और उसका अपना पेज ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md))।
- [Signed packages](./signed-packages.md) और [Sandbox and capabilities](./sandbox-and-capabilities.md): डिलीवरी और मॉड्यूल क्या कर सकते हैं।
- [Project structure](./project-structure.md): `nsh.json` में क्या जाता है, असेट, फ़ाइलें।
