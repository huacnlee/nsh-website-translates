---
title: "दृष्टिकोणों की तुलना"
description: "Native Shell की तुलना React Native, Flutter, Qt, GPUI और Slint से, Electron और Tauri से, तथा रिलीज़ के बाद डिलीवर किए जाने वाले UI के लिए वेब व्यू और सर्वर-ड्रिवन UI से कैसे की जाती है।"
order: 2
group: start
source_hash: 80f11e255cf3463f
---

# दृष्टिकोणों की तुलना

NSH iOS, Android, macOS, Windows, Linux और वेब पर पूरे ऐप्स बनाने का फ़्रेमवर्क है, और रिलीज़ के बाद ऐप्स तक पहुँचाए जाने वाले UI के लिए एक रनटाइम भी। यह पृष्ठ NSH की तुलना पहले उन क्रॉस-प्लेटफ़ॉर्म फ़्रेमवर्क से करता है जिनमें लोग ऐप्स लिखते हैं, और फिर उन तरीक़ों से जिनसे ऐप्स ऐसा UI लेते हैं जो उनके साथ शिप नहीं हुआ था। हरे का अर्थ है कि क्षमता उपलब्ध है, पीले का अर्थ है कि इसके लिए ऐप के अपने अधिक काम या किसी अलग प्रोजेक्ट की ज़रूरत है, और लाल का अर्थ है कि यह उपलब्ध नहीं कराई गई है; ये चिह्न उपलब्धता बताते हैं, प्रदर्शन नहीं। संस्करण हर फ़्रेमवर्क के लिखे जाने के समय के प्रलेखित न्यूनतम संस्करण हैं: जिस रिलीज़ का आप उपयोग करते हैं, उसके लिए उन्हें जाँच लें।

संकेत-सूची: <span class="status status--yes" role="img" aria-label="हाँ"></span> हाँ · <span class="status status--partial" role="img" aria-label="आंशिक"></span> आंशिक · <span class="status status--no" role="img" aria-label="नहीं"></span> नहीं।

<a id="cross-platform-frameworks"></a>

## क्रॉस-प्लेटफ़ॉर्म फ़्रेमवर्क

| क्षमता | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| रेंडरिंग | प्लेटफ़ॉर्म UI | प्लेटफ़ॉर्म व्यू | अपना इंजन | सीन ग्राफ़ | अपना, GPU | अपना, GPU | अपना रेंडरर |
| UI मॉडल | रिटेंड | रिटेंड | रिटेंड | रिटेंड | इमीडिएट | इमीडिएट + रिटेंड | रिएक्टिव, रिटेंड |
| भाषा | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="हाँ"></span> 15+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 15+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 17+ | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="हाँ"></span> 9+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 7+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 7+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 9+ | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="हाँ"></span> 14+ | <span class="status status--partial" role="img" aria-label="आंशिक"></span> अलग | <span class="status status--yes" role="img" aria-label="हाँ"></span> 12+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 13+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 12+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 12+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="हाँ"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="आंशिक"></span> अलग | <span class="status status--yes" role="img" aria-label="हाँ"></span> 10+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 10+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 10+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="हाँ"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="हाँ"></span> Vulkan | <span class="status status--yes" role="img" aria-label="हाँ"></span> Vulkan | <span class="status status--yes" role="img" aria-label="हाँ"></span> |
| वेब | <span class="status status--yes" role="img" aria-label="हाँ"></span> HTML | <span class="status status--partial" role="img" aria-label="आंशिक"></span> लाइब्रेरी | <span class="status status--yes" role="img" aria-label="हाँ"></span> Canvas | <span class="status status--yes" role="img" aria-label="हाँ"></span> Canvas | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> Canvas |
| सिस्टम टेक्स्ट | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> |
| डिवाइस-अनुसार UX | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> |
| JS रनटाइम नहीं | <span class="status status--yes" role="img" aria-label="हाँ"></span> Rust ऐप्स | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> C++ | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--yes" role="img" aria-label="हाँ"></span> |
| हस्ताक्षरित डिलीवरी | <span class="status status--yes" role="img" aria-label="हाँ"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> OTA | <span class="status status--no" role="img" aria-label="नहीं"></span> | <span class="status status--partial" role="img" aria-label="आंशिक"></span> QML | <span class="status status--partial" role="img" aria-label="आंशिक"></span> Shell | <span class="status status--partial" role="img" aria-label="आंशिक"></span> Shell | <span class="status status--no" role="img" aria-label="नहीं"></span> |
| लाइसेंस | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, व्यावसायिक | Apache-2.0 | Apache-2.0 | GPL, व्यावसायिक |

इमीडिएट मोड हर फ़्रेम में UI का विवरण दोबारा बनाता है; रिटेंड मोड उसे सहेजे रखता है और केवल वही अपडेट करता है जो बदला हो। GPUI Fast इन दोनों को GPUI पर जोड़ता है और वहीं चलता है जहाँ GPUI चलता है। "Shell" का अर्थ [GPUI Shell](https://gpui-kit.com/shell) है।

NSH यहाँ अकेला ऐसा फ़्रेमवर्क है जो ये सब एक साथ लाता है: हर प्लेटफ़ॉर्म का अपना UI और टेक्स्ट इनपुट, एक ही ऐप से फ़ोन, डेस्कटॉप और वेब (वेब HTML के रूप में), बिना JavaScript रनटाइम के Rust ऐप्स, और रिलीज़ के बाद पहुँचाया जाने वाला हस्ताक्षरित, सैंडबॉक्स्ड UI।

<a id="what-the-rows-mean"></a>

### पंक्तियों का अर्थ

- **रेंडरिंग, UI मॉडल।** NSH हर प्लेटफ़ॉर्म के अपने व्यू माउंट करता है और उन्हें बनाए रखता है (रिटेंड मोड): किसी बदलाव से केवल वही व्यू अपडेट होते हैं जिन्हें उसने छुआ। React Native भी iOS और Android पर प्लेटफ़ॉर्म व्यू माउंट करता है। Flutter, Qt Quick, GPUI और Slint अपने रेंडरर से ड्रॉ करते हैं; GPUI हर फ़्रेम में एलिमेंट ट्री बनाता है (इमीडिएट मोड), और [GPUI Fast](https://github.com/longbridge/gpui-fast) उसका वह हिस्सा दोबारा इस्तेमाल करता है जो बदला नहीं।
- **प्लेटफ़ॉर्म।** NSH के न्यूनतम संस्करण उसके अपने हैं ([प्लेटफ़ॉर्म](./platforms.md))। बाक़ी [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24; macOS और Windows अलग react-native-macos और react-native-windows प्रोजेक्ट के ज़रिए, वेब react-native-web लाइब्रेरी के ज़रिए), [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), GPUI के लिए [Zed की आवश्यकताओं](https://zed.dev/docs/installation) और [Slint की प्लेटफ़ॉर्म गाइड](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS Rust से) से लिए गए हैं। "Canvas" का अर्थ है कि फ़्रेमवर्क पृष्ठ पर एक canvas में ड्रॉ करता है; NSH के वेब ऐप्स CSS से स्टाइल किए गए HTML एलिमेंट हैं, जिन्हें ब्राउज़र स्क्रोल करता है, चुनता है और संपादित करता है ([Web](./web.md))।
- **सिस्टम टेक्स्ट।** NSH के टेक्स्ट फ़ील्ड प्लेटफ़ॉर्म के अपने एडिटर हैं — `UITextView`, `EditText`, `NSTextView`, GTK का `TextView`, ब्राउज़र का — जिनके साथ सिस्टम के इनपुट मेथड, सिलेक्शन हैंडल और एडिटिंग मेनू मिलते हैं; Windows पर NSH का अपना एडिटर DirectWrite और सिस्टम के इनपुट मेथड (IMM32) के साथ काम करता है। React Native भी प्लेटफ़ॉर्म के टेक्स्ट इनपुट इस्तेमाल करता है। स्वयं ड्रॉ करने वाले फ़्रेमवर्क टेक्स्ट एडिटिंग खुद लागू करते हैं और उसे सिस्टम के इनपुट मेथड से जोड़ते हैं।
- **डिवाइस-अनुसार UX।** NSH के बेस कंपोनेंट डिवाइस के अनुसार ढलते हैं: एक ही `Menu` पॉइंटर के साथ अपने ट्रिगर पर पॉपअप बनता है और फ़ोन पर नीचे से शीट, और `ContextMenu` राइट-क्लिक या उँगली टिकाए रखने पर खुलता है। दूसरे फ़्रेमवर्क में डिवाइस के अनुसार इंटरैक्शन ढालना ज़्यादातर ऐप का अपना काम है।
- **JS रनटाइम नहीं।** किसी भी प्लेटफ़ॉर्म पर Rust ऐप के रनर कोई JavaScript इंजन लिंक नहीं करते; TSX उसी इंजन पर दूसरा रास्ता है। Qt Quick का QML Qt के JavaScript इंजन पर चलता है; C++ में Qt Widgets नहीं चलते।
- **हस्ताक्षरित डिलीवरी।** NSH हस्ताक्षरित `.nshpkg` पैकेजों को अपनी भरोसेमंद कुंजियों और रद्दीकरण सूची के विरुद्ध सत्यापित करता है, और हर एक को एक VM में चलाता है, उन सीमाओं और क्षमताओं के साथ जो होस्ट देता है ([हस्ताक्षरित पैकेज](./signed-packages.md), [सैंडबॉक्स और क्षमताएँ](./sandbox-and-capabilities.md))। React Native के ओवर-द-एयर अपडेट भरोसेमंद ऐप कोड शिप करते हैं; Qt QML फ़ाइलें लोड कर सकता है; GPUI ऐप्स [GPUI Shell](https://gpui-kit.com/shell) के ज़रिए JavaScript मॉड्यूल लेते हैं।

<a id="what-sets-nsh-apart"></a>

### NSH को क्या अलग बनाता है

- **हर प्लेटफ़ॉर्म पर नेटिव, दोनों अर्थों में।** हर बैकएंड अपने प्लेटफ़ॉर्म के अपने व्यू, टेक्स्ट और इनपुट मेथड पर बना है — UIKit, Android views, AppKit, Direct2D के साथ Win32, GTK 4, HTML — और हर प्लेटफ़ॉर्म का इंटरैक्शन उनके साथ आता है। टेक्स्ट सिलेक्शन, इनपुट मेथड और एक्सेसिबिलिटी सिस्टम के अपने हैं, और नया OS रिलीज़ इनमें जो कुछ लाता है वह ऐप तक पहुँचता है ([परिचय](./index.md#what-native-means))।
- **एक ही ऐप से फ़ोन, डेस्कटॉप और वेब।** छह प्लेटफ़ॉर्म एक ही फ़्रेमवर्क के बैकएंड हैं, ऐसे लेआउट के साथ जो अपना आकार बदलते हैं और ऐसे इनपुट के साथ जो डिवाइस के अनुसार चलता है; वेब पर ऐप HTML है, जो स्टैटिक साइट के रूप में प्रकाशित होता है।
- **Rust पहले, बिना JavaScript रनटाइम के।** पूरा ऐप शुरू से अंत तक Rust में हो सकता है, जो Rust के टाइप, थ्रेड और क्रेट के साथ नेटिव कोड में कंपाइल होता है। TSX उसी इंजन पर दूसरा रास्ता है, जल्दी लिखी जाने वाली स्क्रीन के लिए ([Rust के साथ निर्माण](./rust.md))।
- **रोज़मर्रा के ऐप्स के लिए रिटेंड व्यू।** चैट, फ़ॉर्म, सूचियाँ और दस्तावेज़ ठहराव में लगभग निष्क्रिय रहते हैं, क्योंकि किसी बदलाव से केवल वही व्यू अपडेट होते हैं जिन्हें उसने छुआ ([परिचय](./index.md#retained-views))।
- **रिलीज़ के बाद पहुँचाया गया UI, हस्ताक्षरित और सैंडबॉक्स्ड।** NSH से बने ऐप्स — और हर प्लेटफ़ॉर्म के अपने टूल से लिखे नेटिव ऐप्स — रन टाइम पर TSX मॉड्यूल लेते हैं, जिन्हें कोई टीम लिखती है या AI जनरेट करता है ([डायनामिक UI](./index.md#dynamic-ui-and-ai-generated-ui))।
- **लोगों और एजेंटों के लिए एक टूलचेन।** एक `nsh` एक्ज़ीक्यूटेबल हर टारगेट के लिए ऐप्स बनाता है, चलाता है, असली प्लेटफ़ॉर्म पर टेस्ट करता है, पैकेज करता है और साइन करता है।

### React Native

React Native उद्देश्य में सबसे क़रीबी है: दोनों क्लाइंट के दोहराए जाने वाले काम को घटाते हैं और प्लेटफ़ॉर्म के व्यू इस्तेमाल करते हैं। React Native का केंद्र React और उसके पैकेज इकोसिस्टम के साथ JavaScript या TypeScript है, iOS और Android पर, और डेस्कटॉप समर्थन अलग प्रोजेक्ट में है। NSH का केंद्र Rust है: उसका रनटाइम, रेंडरर और मॉड्यूल Rust हैं, Rust अपने आप में एक ऐप भाषा है, और TSX दो रास्तों में से एक है; उसके छह प्लेटफ़ॉर्म, डेस्कटॉप और वेब सहित, एक ही फ़्रेमवर्क के बैकएंड हैं।

### Flutter

Flutter हर पिक्सेल अपने इंजन से ड्रॉ करता है, इसलिए ऐप हर प्लेटफ़ॉर्म पर एक जैसा दिखता है। NSH दूसरा रास्ता लेता है: हर प्लेटफ़ॉर्म के अपने व्यू, टेक्स्ट और टेक्स्ट इनपुट, और वेब पर HTML एलिमेंट तथा ब्राउज़र की अपनी स्क्रोलिंग, सिलेक्शन और इनपुट। टेक्स्ट एडिटिंग, इनपुट मेथड और सिलेक्शन प्लेटफ़ॉर्म के अपने हैं, हर प्लेटफ़ॉर्म के लिए दोबारा लागू नहीं किए जाते।
### Qt

Qt एक परिपक्व टूलकिट है जिसमें दो UI तकनीकें हैं, Qt Widgets और Qt Quick, साथ ही लंबे समय से उपलब्ध टूल और प्लेटफ़ॉर्म सपोर्ट भी है। NSH अपने आधार और अपने मॉडल में अलग है: कोर भाषा के रूप में Rust और साथ में TSX का रास्ता, स्वचालित (और AI-संचालित) डेवलपमेंट के लिए बनाई गई टूलचेन, वेब पर HTML के रूप में रेंडरिंग, और एक ही कॉम्पोनेंट मॉडल के भीतर मोबाइल, डेस्कटॉप और वेब के इंटरैक्शन का अनुकूलन।

<a id="gpui-and-gpui-fast"></a>

### GPUI और GPUI Fast

[GPUI](https://gpui-kit.com) एक Rust UI फ़्रेमवर्क है जो GPU से ड्रॉ करता है और मांग वाले डेस्कटॉप ऐप्स के लिए बना है; [GPUI Fast](https://github.com/longbridge/gpui-fast) Longbridge का फ़ोर्क है, जिसमें रिटेन्ड रेंडरिंग है — यह अपरिवर्तित व्यू, लेआउट और टेक्स्ट मापों को दोबारा इस्तेमाल करता है — साथ में स्क्रॉल लेयर और नेटिव विंडो कम्पोज़िशन भी है। NSH इसके बजाय हर प्लेटफ़ॉर्म के अपने व्यू पर बनता है, इसलिए टेक्स्ट इनपुट, सिलेक्शन, इनपुट मेथड और सिस्टम इंटरैक्शन प्लेटफ़ॉर्म के अपने ही होते हैं, और यह फ़ोन व वेब को भी कवर करता है; NSH का GPUI बैकएंड NSH ऐप्स को GPUI और GPUI Kit ऐप्स में एम्बेड करता है ([GPUI](./gpui.md))।

दोनों अलग-अलग लोड के लिए उपयुक्त हैं। [NSH परफ़ॉर्मेंस बेंचमार्क](https://github.com/longbridge/nsh-perf-bench) में (Linux, 500 पंक्तियों वाली कोट टेबल, NSH अपने GTK 4 बैकएंड पर), रोज़मर्रा के लोड पर लागत समान है: 1,000 कोट प्रति सेकंड पर NSH Rust एक कोर का 18% और GPUI Fast 20% इस्तेमाल करता है। लगातार और सघन अपडेट में GPUI Fast आगे है: 20,000 कोट प्रति सेकंड पर यह एक कोर का 25% इस्तेमाल करता है जबकि NSH 73–78% करता है, और 1,000 बॉक्स के फ़्रेम-दर-फ़्रेम एनिमेशन में इसकी CPU लागत NSH की लगभग एक-तिहाई होती है।

### Slint

Slint एक डिक्लेरेटिव UI टूलकिट है जिसकी अपनी भाषा और हल्के रेंडरर हैं, जो डेस्कटॉप और एम्बेडेड डिवाइस के लिए है और Rust, C++, JavaScript या Python से इस्तेमाल होता है। दोनों नेटिव परफ़ॉर्मेंस को महत्व देते हैं; NSH का रास्ता है हर प्लेटफ़ॉर्म का अपना UI और इंटरैक्शन, वेब पर HTML, ऐप भाषाओं के रूप में Rust और TSX, और छह प्लेटफ़ॉर्म पर AI-संचालित डेवलपमेंट।

<a id="electron-and-tauri"></a>

### Electron और Tauri

Electron Chromium को बंडल करता है और Tauri सिस्टम के वेब व्यू का उपयोग करता है: दोनों वेब कंटेंट से डेस्कटॉप ऐप्स (और Tauri के साथ मोबाइल ऐप्स) बनाते हैं, जिनमें टेक्स्ट और इनपुट ब्राउज़र का होता है। NSH इसके बजाय हर प्लेटफ़ॉर्म के अपने व्यू बनाता है, और HTML को केवल खुद वेब पर रेंडर करता है।

<a id="ui-delivered-after-release"></a>

## रिलीज़ के बाद डिलीवर किया जाने वाला UI

जो ऐप ऐसा UI चाहता है जो उसके साथ शिप नहीं हुआ था — मॉडल द्वारा जनरेट किए गए उत्तर, पार्टनर्स या अन्य टीमों की फ़ीचर्स, बिना रिलीज़ के बदलने वाली स्क्रीन — उसके लिए फ़ोन और डेस्कटॉप दोनों पर कुछ स्थापित विकल्प हैं। वे इस बात में अलग हैं कि UI कौन ड्रॉ करता है, डिलीवर किया गया कोड क्या कर सकता है, और उन्हें होस्ट करने के लिए ऐप में कितना बदलाव करना पड़ता है।

| क्षमता | NSH | Web view | Server-driven UI | Mini-programs | OTA updates |
|---|---|---|---|---|---|
| ड्रॉ करने वाला | प्लेटफ़ॉर्म UI | ब्राउज़र इंजन | ऐप के अपने व्यू | वेब इंजन + लेयर | फ़्रेमवर्क रेंडरर |
| नेटिव लुक और व्यवहार | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| अपना स्टेट, लॉजिक और लेआउट | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| होस्ट के नेटिव कॉम्पोनेंट | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| होस्ट द्वारा कॉन्फ़िगर किया गया सैंडबॉक्स | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Yes"></span> Schema | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| साइन किए गए, रद्द किए जा सकने वाले पैकेज | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| AI-जनरेटेड UI के लिए उपयुक्त | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> वेब पेज | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| होस्ट ऐप पर लागत | एक व्यू और एक लाइब्रेरी | हर व्यू के लिए एक ब्राउज़र इंजन | हर कॉम्पोनेंट के लिए एक रेंडरर | एक कंटेनर SDK | पूरा ऐप फ़्रेमवर्क में |

- **Web view (H5).** ब्राउज़र इंजन में एक पेज: वह सब कुछ जो HTML व्यक्त कर सकता है, ब्राउज़र के लुक के साथ और नेटिव कोड तक हाथ से लिखे गए ब्रिज के साथ।
- **Server-driven UI.** JSON जो ऐप में पहले से शिप किए गए कॉम्पोनेंट और एक्शन को फिर से जोड़ता है: जनरेट करना आसान, लेकिन स्कीमा जो देता है उससे आगे कोई लोकल स्टेट या लॉजिक नहीं।
- **Mini-program containers.** वेब इंजन पर प्लेटफ़ॉर्म-विशिष्ट फ़्रेमवर्क और API, एक बड़े कंटेनर SDK के भीतर।
- **Over-the-air updates** (उदाहरण के लिए code-push सेवा के साथ React Native)। पूरा फ़्रेमवर्क, लेकिन अपडेट भरोसेमंद ऐप कोड होते हैं, और ऐप उसी फ़्रेमवर्क में लिखा होना चाहिए।
- **NSH.** अपने स्टेट, लॉजिक, एनिमेशन और लेआउट वाला एक TSX मॉड्यूल, जो प्लेटफ़ॉर्म के अपने UI से रेंडर होता है और होस्ट के रजिस्टर किए गए नेटिव व्यू इस्तेमाल कर सकता है। यह एक साइन किए गए पैकेज के रूप में आता है जिसे ऐप सत्यापित करता है, अपने VM में मेमोरी, कॉल-टाइम और नोड सीमाओं के साथ चलता है, और केवल उन्हीं नेटवर्क होस्ट, वेब पेज और सिस्टम सेटिंग तक पहुँचता है जो होस्ट देता है ([Sandbox and capabilities](./sandbox-and-capabilities.md))। होस्ट एक व्यू जोड़ता है जहाँ मॉड्यूल दिखता है ([Platforms](./platforms.md#embed-in-a-native-app)), और वही बंडल हर प्लेटफ़ॉर्म पर चलता है। यही कारण है कि [GPUI Shell](./index.md#native-shell-and-gpui-shell) के साथ-साथ NSH मौजूद है।

<a id="when-another-option-fits-better"></a>

## जब कोई दूसरा विकल्प बेहतर बैठता है

- स्क्रीन पर हज़ारों व्यू के लगातार, सघन अपडेट हावी हैं — जैसे प्रति सेकंड दसियों हज़ार कोट स्ट्रीम करने वाला मार्केट-डेटा टर्मिनल, या हर फ़्रेम पर दोबारा बनाई जाने वाली कस्टम विज़ुअलाइज़ेशन: GPUI Fast की रिटेन्ड GPU रेंडरिंग CPU का एक छोटा हिस्सा ही इस्तेमाल करती है (देखें [GPUI और GPUI Fast](#gpui-and-gpui-fast))।
- ऐप हर प्लेटफ़ॉर्म पर पिक्सेल-समान दिखना चाहिए: Flutter या Slint जैसा फ़्रेमवर्क, जो सब कुछ खुद ड्रॉ करता है, डिज़ाइन से ही यह देता है।
- आपको आज तीसरे पक्ष के पैकेजों का बड़ा इकोसिस्टम चाहिए: React Native, Flutter और Qt के पास वर्षों के बने पैकेज हैं।
- UI एक दस्तावेज़ या मौजूदा वेब पेज है: web view उसे जैसा है वैसा दिखा देता है।
- स्क्रीन का सेट तय और छोटा है, और केवल कंटेंट और क्रम बदलते हैं: server-driven UI को किसी रनटाइम की ज़रूरत ही नहीं है।

<a id="see-also"></a>

## यह भी देखें

- [Introduction](./index.md): NSH क्या है, और इसमें नेटिव का क्या अर्थ है।
- [Architecture](./architecture.md): NSH के भीतर क्या कहाँ चलता है।
- [Performance](./performance.md): NSH जिन नियमों का पालन करता है, और ऐप को कैसे मापें।
