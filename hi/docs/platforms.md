---
title: "प्लेटफ़ॉर्म का अवलोकन"
description: "NSH कहाँ चलता है: iOS, Android, macOS, Windows, Linux, GPUI और वेब, हर एक का अपना बैकएंड; हर प्लेटफ़ॉर्म पर Rust या TSX ऐप को कैसे चलाएँ, पैकेज करें और एम्बेड करें, और हर एक के लिए क्या आवश्यक है।"
order: 10
group: platforms
source_hash: 122188df65c9a97c
---

# प्लेटफ़ॉर्म अवलोकन

NSH फ़ोन, डेस्कटॉप और वेब पर चलता है: iOS, Android, macOS, Windows, Linux, GPUI और वेब पेज। हर प्लेटफ़ॉर्म का अपना एक बैकएंड है जो उस प्लेटफ़ॉर्म के अपने UI से ड्रॉ करता है, इसलिए ऐप iPhone पर UIKit व्यू, Mac पर AppKit व्यू, Linux पर GTK 4 विजेट, GPUI ऐप में GPUI एलिमेंट और ब्राउज़र में HTML होता है, और उसे प्लेटफ़ॉर्म का अपना टेक्स्ट, इनपुट, एक्सेसिबिलिटी और डार्क मोड मिलता है। बैकएंड के ऊपर सब कुछ साझा है: रिएक्टिव ग्राफ़, रेंडरर, Taffy लेआउट, कंपोनेंट और नेटिव मॉड्यूल हर जगह वही Rust कोड हैं, इसलिए एक ही ऐप इन सभी पर चलता है। Rust में लिखा ऐप वही कोड और आपका क्रेट होता है, जिसमें कोई JavaScript VM नहीं होता; TSX ऐप अपने मॉड्यूल इसके ऊपर QuickJS पर चलाता है ([Building with Rust](./rust.md))।

हर प्लेटफ़ॉर्म पर ऐप दो तरह से इस्तेमाल होता है: उस प्लेटफ़ॉर्म के इंस्टॉल होने योग्य ऐप के रूप में पैकेज किया हुआ (`nsh package`), या आपके अपने नेटिव ऐप में एम्बेड किया हुआ, चाहे होस्ट Rust रूट लिंक करे या रन टाइम पर TSX लोड करे। आप इसे `nsh run` के साथ डेवलप करते हैं (Rust में बदलाव करने पर ऐप दोबारा बिल्ड होकर रीस्टार्ट होता है, TSX में बदलाव हॉट अपडेट होते हैं)।

<a id="at-a-glance"></a>

## एक नज़र में

| प्लेटफ़ॉर्म | बैकएंड; टेक्स्ट | कहाँ चलता है | डेवलप | पैकेज |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit; CoreText | iOS 15.0+, डिवाइस और सिमुलेटर | `nsh run --target ios` | `.app` (सिमुलेटर), साइन किया हुआ `.ipa` |
| [Android](./android.md) | Android व्यू; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` और `x86_64` | `nsh run --target android` | साइन किया हुआ `.apk` |
| [macOS](./macos.md) | AppKit और Core Animation; CoreText | macOS 14+ | `nsh run --target macos` | ad hoc साइन किया हुआ `.app` |
| [Windows](./windows.md) | Direct2D से ड्रॉ की गई Win32 विंडो; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (Windows पर डिफ़ॉल्ट) | एक डायरेक्टरी और एक `.zip` |
| [Linux](./linux.md) | GTK 4 विजेट; Pango | GTK 4.14+ | `nsh run` (Linux पर डिफ़ॉल्ट) | एक डायरेक्टरी और एक `.tar.gz` |
| [GPUI](./gpui.md) | GPUI; GPUI का टेक्स्ट सिस्टम | macOS, Windows, Linux (Vulkan) | आपके GPUI ऐप में; TSX भी `nsh run --target gpui` के साथ | उस GPUI ऐप के अंदर जो इसे एम्बेड करता है |
| [Web](./web.md) | HTML और CSS; ब्राउज़र के फ़ॉन्ट | आधुनिक ब्राउज़र, डेस्कटॉप और फ़ोन | `nsh run --target web` | एक स्टैटिक साइट |

- **[GPUI](./gpui.md)** ऐप को [GPUI](https://gpui-kit.com) से ड्रॉ करता है, जो सहयोगी प्रोजेक्ट GPUI Kit का फ़्रेमवर्क है, और यह macOS, Windows और Linux तीनों पर एक जैसा काम करता है: यह GPUI और GPUI Kit ऐप में एम्बेड करने का बैकएंड है, जो अपने `AppView` को अपने एलिमेंट ट्री में रखते हैं। स्टैंडअलोन डेस्कटॉप ऐप हर OS के अपने बैकएंड (AppKit, Win32, GTK 4) से चलते और पैकेज होते हैं।
- **[Web](./web.md)** ऐप को ब्राउज़र पेज में HTML के रूप में रेंडर करता है: `nsh package --target web` किसी भी वेब सर्वर या CDN के लिए एक स्टैटिक साइट प्रकाशित करता है, जिसमें Rust ऐप का इंजन और क्रेट WebAssembly में कंपाइल होता है, और आपका अपना पेज ऐप को `createPlayer` या iframe से एम्बेड करता है। यही इस साइट के लाइव डेमो और [playground](/playground) भी चलाता है।
- **Mac Catalyst** iOS बैकएंड को Mac पर iPhone के आकार की विंडो (390×844) में चलाता है, डेवलपमेंट के लिए। ऐप फ़ोन पर कैसा दिखता है यह देखने के लिए इसे `--target catalyst` से चुनें।

<a id="develop-and-package"></a>

## डेवलप और पैकेज करें

जब आप कोई `--target` नहीं देते, तो `nsh run` मशीन का अपना प्लेटफ़ॉर्म चुनता है: macOS पर AppKit, Linux पर GTK विंडो और Windows पर Win32 विंडो। फ़ोन तक कंप्यूटर से पहुँचा जाता है: iOS तक Xcode वाले Mac से, Android तक macOS, Linux या Windows से Android SDK के साथ ([Installation](./installation.md#what-works-where))।

Rust ऐप (इसका `nsh.json` `"root"` कंपोनेंट का नाम देता है) अपनी डायरेक्टरी से चलता और पैकेज होता है: `nsh` टारगेट के लिए ऐप का अपना रनर बनाता है, आपके क्रेट के साथ और QuickJS के बिना। TSX ऐप अपनी एंट्री का नाम देता है:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

हर डेस्कटॉप OS ऐप को अपने बैकएंड से पैकेज करता है, जो उसी मशीन के लिए बनता है जिस पर वह चलता है: Mac ऐप Mac पर, Windows ऐप Windows पर और Linux ऐप Linux पर पैकेज करें। [Packaging](./packaging.md) में हर टारगेट का आउटपुट, साइनिंग और आइकन बताए गए हैं।

<a id="embed-in-a-native-app"></a>

## नेटिव ऐप में एम्बेड करें

| प्लेटफ़ॉर्म | होस्ट व्यू | क्या चलाता है | कैसे शिप होता है | होस्ट भाषा |
|---|---|---|---|---|
| macOS | `AppView` (एक `NSView`) | एक Rust रूट, TSX बंडल | `nsh-platform-macos` क्रेट | Rust |
| Windows | `AppView` (एक चाइल्ड विंडो) | एक Rust रूट, TSX बंडल | `nsh-platform-windows` क्रेट | Rust |
| Linux | `AppView` (एक GTK विजेट) | एक Rust रूट, TSX बंडल | `nsh-platform-linux` क्रेट | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (एक GPUI व्यू) | एक Rust रूट, TSX बंडल, साइन किए हुए पैकेज | `nsh-platform-gpui` क्रेट | Rust |
| iOS | `AppView` (एक `UIView`) | एक Rust रूट, TSX बंडल | `nsh-platform-ios` क्रेट | Rust |
| iOS | `NshAppView` (एक `UIView`) | TSX बंडल, साइन किए हुए पैकेज | `NativeShell.xcframework` | Swift |
| Android | `NshView` (एक `FrameLayout`) | TSX बंडल, साइन किए हुए पैकेज | `nsh.aar` | Java या Kotlin |
| Web | `createPlayer` (एक पेज एलिमेंट) या एक iframe | TSX बंडल; Rust ऐप अपनी प्रकाशित साइट के रूप में | `nsh package --target web` से मिली रनटाइम फ़ाइलें | JavaScript या HTML |

Rust होस्ट Rust रूट (`Root::of::<App>()`) को `AppSource::Rust` या `App::Rust` के रूप में माउंट करता है, और `set_ui_sets` से अपने इंजनों को ऐप के UI सेट देता है, ताकि जो TSX वह लोड करे वह ऐप के अपने कंपोनेंट और मॉड्यूल इम्पोर्ट कर सके। हर व्यू एक इंजन होता है, और एक ऐप कई व्यू दिखा सकता है। होस्ट हर प्लेटफ़ॉर्म पर ऐप के इस्तेमाल के लिए अपने नेटिव व्यू रजिस्टर करता है ([Native components](./native-components.md))।

> [!NOTE]
> Rust होस्ट NSH रिपॉज़िटरी के प्लेटफ़ॉर्म क्रेट से NSH एम्बेड करते हैं; macOS, Windows और Linux का `AppView` डिफ़ॉल्ट सीमाओं के साथ बंडल ऐप की अपनी फ़ाइलों (या सोर्स कोड) से लोड करता है। GPUI क्रेट और iOS व Android SDK [signed packages](./signed-packages.md) भी लोड करते हैं और हर व्यू के लिए सीमाएँ और कैपेबिलिटी सेट करते हैं ([Sandbox and capabilities](./sandbox-and-capabilities.md))।

<a id="writing-for-every-platform"></a>

## हर प्लेटफ़ॉर्म के लिए लिखना

ऐप के अधिकांश हिस्से में प्लेटफ़ॉर्म चेक की ज़रूरत नहीं होती: एलिमेंट, स्टाइल, लेआउट और मॉड्यूल हर जगह एक जैसा व्यवहार करते हैं। जहाँ प्लेटफ़ॉर्म अलग होते हैं, वहाँ NSH अंतर के लिए एक ही जगह देता है ([Platform-specific code](./platform-specific.md)):

- **एनवायरनमेंट बताता है कि ऐप कहाँ चल रहा है**: Rust में `os()`, `idiom()` और `is_desktop()` (`nsh_core::prelude`), TSX में `nsh` से `platform.os`, `platform.idiom`, `platform.desktop` और `platform.select`। OS iOS, Android, macOS, Windows, Linux या वेब होता है।
- **केवल-प्लेटफ़ॉर्म props** TSX में `ios={{…}}`, `android={{…}}`, `web={{…}}` या `desktop={{…}}` में जाते हैं (`desktop`: macOS, Windows, Linux और डेस्कटॉप ब्राउज़र)।
- **इनपुट प्लेटफ़ॉर्म के अनुसार चलता है।** फ़ोन पर टच और सॉफ़्टवेयर कीबोर्ड मिलता है; डेस्कटॉप पर माउस, ट्रैकपैड और कीबोर्ड।

ऐप के कंपोनेंट NSH के प्रिमिटिव से ड्रॉ होते हैं, इसलिए वे फ़ोन के साथ-साथ डेस्कटॉप पर भी चलते हैं, और दोनों पर एक जैसे दिखते हैं। डेस्कटॉप लेआउट प्रिमिटिव (`view`, `text`, `scroll`, `virtual_list`, …; TSX में `View`, `Text`, `Scroll`, `List`, …) और डेस्कटॉप के लिए एक चेक से बनता है, जैसा गैलरी का डेस्कटॉप लेआउट बना है:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

हर बैकएंड उन चीज़ों की सूची देता है जो वह अपने तरीके से करता है: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences)।

<a id="see-also"></a>

## यह भी देखें

- [Getting started](./getting-started.md): पहला ऐप, हर प्लेटफ़ॉर्म पर चलाया हुआ।
- [Building with Rust](./rust.md): Rust में लिखे ऐप, और TSX के साथ Rust।
- [Installation](./installation.md): हर प्लेटफ़ॉर्म के लिए ज़रूरी टूल।
- [Architecture](./architecture.md): क्या साझा है और हर बैकएंड क्या करता है।
