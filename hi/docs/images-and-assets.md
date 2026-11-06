---
title: "इमेज और असेट्स"
description: "Rust और TSX में इमेज दिखाना - ऐप के असेट्स और @2x फ़ाइलें, SVG इमेज, रिमोट URL, रीसाइज़ मोड, प्लेसहोल्डर, ब्लर, टिंट, लोड इवेंट, और इमेज का साइज़ पढ़ना या उसे प्रीफ़ेच करना।"
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---

# इमेज और एसेट

image एलिमेंट (Rust में `image(..)`, TSX में `<Image>`) एक bitmap या SVG ड्रॉइंग दिखाता है। यह ऐप के साथ शिप की गई फ़ाइल हो सकती है या किसी URL से डाउनलोड की गई इमेज। इमेज main thread के बाहर पढ़ी और डीकोड की जाती हैं, व्यू में दिखाए जाने वाले आकार तक डाउनसैंपल की जाती हैं और कैश की जाती हैं। main thread केवल डीकोड किया हुआ नतीजा दिखाता है।

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

image(LOGO)
image("https://picsum.photos/seed/nsh/600/400").w_full().h(px(200.0)).rounded(px(12.0))
```

```tsx tabs
import { Image } from "nsh";
import logo from "./assets/logo@2x.png";

<Image src={logo} />
<Image src="https://picsum.photos/seed/nsh/600/400" style={{ width: "100%", height: 200, borderRadius: 12 }} />
```

एलिमेंट के props [image](../elements/image.md) पर सूचीबद्ध हैं।

<a id="images-in-the-app"></a>

## ऐप में इमेज

Rust क्रेट अपनी फ़ाइलें अपनी `assets/` डायरेक्टरी में रखता है। `asset!("logo@2x.png")` (`assets/` के सापेक्ष पाथ) एक `ImageAsset`, `{ url, size, scales }` है, जो क्रेट के कंपाइल होते समय पढ़ी जाती है। क्रेट के `#[native_module]` फ़ंक्शन में `registry.assets(assets!())` डायरेक्टरी की हर फ़ाइल को ऐप के साथ शिप करता है। TSX में इमेज फ़ाइल को मॉड्यूल की तरह import करें। इस import से `ImageAsset`, `{ url, size, scales? }` मिलता है, और bundler फ़ाइल को ऐप के साथ शिप करता है:

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

// LOGO.url: "asset:/@my-app/logo@2x.png", LOGO.size: 64 × 64 points

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}
```

```tsx tabs
import logo from "./assets/logo@2x.png";

logo; // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
```

समर्थित फ़ाइलें: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` और `.svg` ([SVG इमेज](#svg-images))।

**साइज़ points में होते हैं।** फ़ाइल के नाम में `@2x` या `@3x` प्रत्यय बताता है कि फ़ाइल में प्रति point 2 या 3 पिक्सेल हैं। इसलिए 128×128 पिक्सेल की `logo@2x.png` एक 64×64 point का एसेट है। प्रत्यय के बिना एक पिक्सेल एक point के बराबर है। प्रत्यय वाले नाम की फ़ाइल वही दिखती है जो नामित है। बिना प्रत्यय वाले नाम की फ़ाइल, यदि उसके [पिक्सेल-घनत्व वेरिएंट](#pixel-densities) हों, तो वे दिखाती है।

**प्राकृतिक आकार।** जब स्टाइल में चौड़ाई या ऊँचाई खुली छोड़ी जाती है, तो एसेट की इमेज अपने प्राकृतिक आकार में लेआउट होती है, इसलिए `image(LOGO)` और `<Image src={logo} />` को स्टाइल की ज़रूरत नहीं। इसे अलग आकार देने के लिए एक आयाम और aspect ratio सेट करें, या दोनों आयाम सेट करें।

Rust में गायब या टूटी हुई फ़ाइल बिल्ड को विफल कर देती है, और बदली हुई फ़ाइल पर क्रेट दोबारा बिल्ड होता है। TSX में एसेट import करने वाले मॉड्यूल के सापेक्ष resolve होते हैं, और उनका `url` ऐप के रूट (एंट्री की डायरेक्टरी) के सापेक्ष होता है। `nsh build` उन्हें `out/assets/` में कॉपी करता है, `nsh package` उन्हें ऐप में रखता है, और डेवलपमेंट के दौरान dev server उन्हें serve करता है।

> [!TIP]
> TSX में `src` `asset:/path` स्ट्रिंग भी स्वीकार करता है, लेकिन शिप होने की गारंटी केवल import की गई फ़ाइलों की है। जो पाथ कभी import नहीं किया गया, वह dev server के साथ काम करता है, क्योंकि वह पूरी ऐप डायरेक्टरी serve करता है, लेकिन पैकेज किए गए ऐप में गायब रहता है। जो भी इमेज आप इस्तेमाल करें, उसे import करें। Rust क्रेट अपनी पूरी `assets/` डायरेक्टरी `assets!()` के ज़रिए शिप करता है।

<a id="pixel-densities"></a>

### पिक्सेल घनत्व

फ़ाइल को बिना प्रत्यय के नाम दें और उसके अधिक घनत्व वाले संस्करण उसके बगल में रखें। ऐप स्क्रीन के अनुकूल संस्करण लोड करता है:

```text
assets/
├── logo.png       64×64 pixels
├── logo@2x.png    128×128
└── logo@3x.png    192×192
```

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

// LOGO.size: 64 × 64 points, LOGO.scales: [1.0, 2.0, 3.0]
```

```tsx tabs
import logo from "./assets/logo.png";

logo; // { url: "asset:/assets/logo.png", size: { width: 64, height: 64 }, scales: [1, 2, 3] }
```

- `asset!` और bundler बिना प्रत्यय वाले नाम की इमेज के `@1.5x`, `@2x`, `@3x` और `@4x` सहोदर खोजते हैं। `scales` उन्हें सूचीबद्ध करता है, और नामित फ़ाइल के लिए 1 होता है। जिस इमेज के सहोदर नहीं हैं, उसके कोई scale नहीं होते (TSX में वह `{ url, size }` के रूप में import होती है)। bundler को मिले सहोदरों को शिप करता है, और `assets!()` पूरी डायरेक्टरी शिप करता है।
- इमेज वह सबसे छोटा scale लोड करती है जो स्क्रीन के पिक्सेल अनुपात के बराबर या उससे बड़ा हो, और ऐसा न हो तो सबसे बड़ा, जैसा React Native चुनता है: 1× स्क्रीन पर `logo.png`, 2× स्क्रीन पर `logo@2x.png`, और 3× फ़ोन पर (और 2.625 पर) `logo@3x.png`। वेब पर केवल वही फ़ाइल डाउनलोड होती है।
- जब पिक्सेल अनुपात बदलता है (विंडो दूसरी स्क्रीन पर ले जाने या ब्राउज़र ज़ूम पर), तो जिन इमेज का चुनाव बदलता है वे अपने [लोड इवेंट](#load-events) के साथ दोबारा लोड होती हैं। उनका आकार points में नामित फ़ाइल के आकार के बराबर ही रहता है।
- जिस वेरिएंट के पिक्सेल नामित फ़ाइल के आकार गुणा उसके scale के बराबर नहीं होते, उस पर TSX में बिल्ड चेतावनी आती है और Rust में बिल्ड विफल हो जाता है।
- घनत्व प्रत्यय वाले नाम की फ़ाइल (`./logo@3x.png`, `asset!("logo@3x.png")`) केवल वही फ़ाइल होती है।
- [SVG इमेज](#svg-images) किसी भी अनुपात पर स्क्रीन के लिए ड्रॉ की जाती है, इसलिए उसके कोई वेरिएंट शिप नहीं होते।

एक फ़ाइल भी काफ़ी है। उसे ज़रूरी सबसे अधिक घनत्व पर एक्सपोर्ट करें (हर फ़ोन पर सबसे तीखे नतीजे के लिए `@3x`) और उसे उसके प्रत्यय के साथ नाम दें। डीकोड करते समय इमेज स्क्रीन के अनुसार डाउनसैंपल की जाती हैं। वेरिएंट से हर स्क्रीन वही फ़ाइल डाउनलोड, डीकोड और रखती है जो उसके अनुकूल है।

<a id="svg-images"></a>

## SVG इमेज

`.svg` फ़ाइल को किसी भी इमेज की तरह import करें। points में इसका आकार इसकी `width` और `height` से तय होता है (या इनमें से किसी एक से, और दूसरा `viewBox` के aspect ratio से), वरना इसके `viewBox` से: SVG का एक CSS पिक्सेल एक point है, और `@2x` प्रत्यय SVG फ़ाइलों को जैसा है वैसा ही रहने देते हैं।

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

SVG उस आकार पर तीखा होता है जिस पर वह दिखाया जाता है। ब्राउज़र इसे वेक्टर के रूप में ड्रॉ करता है। iOS, macOS और Android इसे उस आकार पर, पिक्सेल में, ड्रॉ करते हैं जिस पर व्यू इसे दिखाता है, जब इमेज लोड होती है (जैसे वे bitmap को डाउनसैंपल करते हैं; बाद में बड़ा होने वाला व्यू इस ड्रॉइंग को scale करता है, जब तक इमेज दोबारा लोड न हो)। Windows, Linux और GPUI इसे एक बार प्रति point चार पिक्सेल पर ड्रॉ करते हैं (प्रति ओर 2048 पिक्सेल तक) और हर व्यू के लिए scale करते हैं। बाकी सब कुछ bitmap की तरह ही काम करता है: `objectFit`, `tintColor` (SVG के अपारदर्शी आकारों के ज़रिए, इसलिए एक-रंग के आइकन थीम का अनुसरण करते हैं), फ़िल्टर, `blurRadius`, प्लेसहोल्डर, लोड इवेंट, `Image.getSize` और `Image.prefetch`। `onLoad` और `Image.getSize` SVG का आकार पूरे points में रिपोर्ट करते हैं, जबकि इमेज अपने सटीक आकार में लेआउट होती है। रिमोट SVG फ़ाइलें उन्हीं डाउनलोड और [capability](./sandbox-and-capabilities.md) जाँचों के ज़रिए उसी तरह लोड होती हैं। NSH SVG को उसकी सामग्री से पहचानता है (gzip-संपीड़ित भी, `.svgz`), चाहे उसका URL किसी भी चीज़ पर खत्म हो।

**नेटिव प्लेटफ़ॉर्म क्या ड्रॉ करते हैं।** iOS, macOS, Android, Windows, Linux और GPUI SVG को एक ही renderer (resvg) से ड्रॉ करते हैं, इसलिए ड्रॉइंग हर जगह एक जैसी दिखती है: आकार और पाथ, fill और stroke, ग्रेडिएंट और पैटर्न, क्लिप पाथ और मास्क, opacity, फ़िल्टर और ट्रांसफ़ॉर्म। टेक्स्ट (`<text>`), एनिमेशन (SMIL और CSS), एम्बेड की गई इमेज (`<image>`) और HTML (`<foreignObject>`) ब्राउज़र में दिखते हैं। नेटिव प्लेटफ़ॉर्म SVG का बाकी हिस्सा स्थिर रूप में ड्रॉ करते हैं, और `nsh build` उन फ़ाइलों के नाम बताता है जो इनका उपयोग करती हैं। हर जगह एक जैसे नतीजे के लिए टेक्स्ट को आउटलाइन (पाथ) के रूप में एक्सपोर्ट करें।

**एक आत्मनिर्भर चित्र।** नेटिव प्लेटफ़ॉर्म पर SVG केवल वही ड्रॉ करता है जो उसके भीतर है: जिन फ़ाइलों, URL, `data:` इमेज और अन्य दस्तावेज़ों का वह संदर्भ देता है, वे छोड़ दिए जाते हैं। नेटिव प्लेटफ़ॉर्म SVG को, रिमोट SVG समेत, ऐसी सीमाओं के भीतर ड्रॉ करते हैं जो मेमोरी को नियंत्रण में रखती हैं: 16 MiB तक का दस्तावेज़ (संपीड़ित हो तो फैलाए जाने के बाद), प्रति ओर 8192 पिक्सेल तक और कुल मिलाकर 4096 × 4096 पिक्सेल तक की ड्रॉइंग (64 MiB; इससे बड़ी ड्रॉइंग छोटी बनाई जाती है), और एक समय में 256 MiB तक की लेयर (opacity, मास्क, क्लिप पाथ और फ़िल्टर वाले ग्रुप, जिन्हें renderer अलग से ड्रॉ करता है)। दस्तावेज़ या लेयर की सीमा से बड़ा SVG `onError` के साथ लोड होने में विफल रहता है।

**वेब पर रिपोर्ट किए गए साइज़।** ब्राउज़र SVG को खुद मापता है, चाहे वे import किए गए हों या रिमोट। `onLoad` और `Image.getSize` SVG की `width` और `height` रिपोर्ट करते हैं जब वे मौजूद हों, वरना वह आकार जो ब्राउज़र उसे देता है, जो ब्राउज़र आमतौर पर 300 × 150 के डिफ़ॉल्ट और `viewBox` के aspect ratio से निकालते हैं। import किए गए SVG हर प्लेटफ़ॉर्म पर bundler के आकार पर लेआउट होते हैं। हर जगह एक जैसा रिपोर्ट किया गया आकार पाने के लिए SVG को `width` और `height` दें।

<a id="remote-images"></a>

## रिमोट इमेज

एलिमेंट को एक URL दें: Rust में स्ट्रिंग (बदलने वाले URL के लिए क्लोज़र), TSX में URL स्ट्रिंग:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **रिमोट इमेज को साइज़ दें।** लोड होने तक उनका आकार अज्ञात रहता है, इसलिए चौड़ाई और ऊँचाई (या उनमें से एक और aspect ratio) के बिना वे बिना ऊँचाई के सिकुड़ जाती हैं।
- इमेज लोड होते समय **बैकग्राउंड रंग** दिखता है, या प्लेसहोल्डर इस्तेमाल करें (नीचे)।
- डाउनलोड साझा होते हैं: एक ही URL दिखाने वाले कई व्यू उसे एक बार डाउनलोड करते हैं, तब भी जब वे उसे अलग-अलग आकारों पर डीकोड करें। जिस डाउनलोड का इंतज़ार अब कोई नहीं कर रहा, वह रद्द कर दिया जाता है।
- डीकोड की गई इमेज मेमोरी में कैश होती हैं (मेमोरी पर दबाव पड़ने पर कैश साफ़ किया जाता है), और उनकी key URL, डीकोड साइज़ और blur radius होती है।
- जब ऐप [capabilities](./sandbox-and-capabilities.md) घोषित करता है, तो इमेज का होस्ट `network` के अंतर्गत अनुमत होना चाहिए। अस्वीकृत इमेज अपने error इवेंट के साथ विफल होती है।

<a id="kept-on-disk"></a>

### डिस्क पर सहेजी गई इमेज

डाउनलोड की गई इमेज डिस्क पर भी, जैसी सर्वर ने भेजी थी वैसी ही, सहेजी जाती हैं। इसलिए दोबारा खोला गया ऐप (अवतारों और फ़ोटो से भरी बातचीत, एक फ़ीड) पहले दिखाई गई इमेज बिना डाउनलोड किए दिखाता है, ऑफ़लाइन भी। ऐप को किसी सेटिंग की ज़रूरत नहीं: `http://` या `https://` URL वाली हर इमेज iOS, Android, macOS, Windows, Linux और GPUI पर कैश से होकर जाती है, और ब्राउज़र में ब्राउज़र का अपना HTTP कैश यही काम करता है।

कैश सर्वर के HTTP कैशिंग हेडर का पालन करता है:

- इमेज तब तक सहेजी जाती है जब तक रिस्पॉन्स `Cache-Control: no-store` न कहे।
- जब तक वह fresh है, वह बिना अनुरोध के इस्तेमाल होती है: `max-age` तक, नहीं तो `Expires` तक, नहीं तो `Last-Modified` के बाद बीते समय के दसवें हिस्से तक (अधिकतम एक सप्ताह)।
- उसके बाद सर्वर से जाँच की जाती है (`If-None-Match` अपने `ETag` के साथ, `If-Modified-Since` अपने `Last-Modified` के साथ)। अपरिवर्तित इमेज (`304`) बिना डाउनलोड किए दोबारा इस्तेमाल होती है, और बदली हुई इमेज पुरानी को बदल देती है।
- जब अनुरोध विफल होता है (नेटवर्क नहीं) या सर्वर में त्रुटि होती है (`5xx`), तो सहेजी हुई प्रति दिखाई जाती है, जब तक रिस्पॉन्स ने `must-revalidate` या `no-cache` न कहा हो।

हर ऐप का अपना 256 MiB का कैश होता है। उससे आगे, सबसे कम हाल में इस्तेमाल की गई इमेज पहले हटाई जाती हैं। एक ऐप के कई व्यू, सरफ़ेस और प्रोसेस इसे सुरक्षित रूप से साझा करते हैं। एम्बेड करने वाले ऐप तय करते हैं कि यह कहाँ हो और कितना बड़ा हो, या इसे बंद कर देते हैं:

```rust tabs
// macOS, Windows, Linux and GPUI: the AppView's options (or AppView::set_cache).
let mut cache = CacheOptions::at(CacheLocation::Dir(caches.join("nsh")));  // each app in <dir>/<app id>
cache.images = CachePolicy::MaxSize(ByteSize::mib(64));                     // CachePolicy::Off: none
let view = AppView::new(mtm, AppOptions { cache, ..AppOptions::default() });
```

```swift tabs
// iOS: NshAppView, before loading.
app.cacheOptions = NshCacheOptions(location: .directory(caches.appendingPathComponent("nsh")),
                                   images: .maxSize(megabytes: 64))   // .off: none
```

```java tabs
// Android: NshView, before loading.
nsh.setCacheOptions(NshCacheOptions.builder()
        .location(new File(getCacheDir(), "nsh"))
        .imagesMaxMegabytes(64)          // imagesOff(): none
        .build());
```

`CacheLocation::Off` (`.off`, `noDiskCache()`) डिस्क पर कुछ नहीं रखता।

डिफ़ॉल्ट रूप से कैश सिस्टम की कैश डायरेक्टरी में होता है: iOS पर `Library/Caches/nsh`, Android पर कैश डायरेक्टरी में `nsh`, macOS पर `~/Library/Caches`, Windows पर `%LOCALAPPDATA%` और Linux पर `$XDG_CACHE_HOME` (`~/.cache`), जहाँ हर ऐप वहाँ `<app id>/images` में होता है। जगह की ज़रूरत पड़ने पर सिस्टम इन डायरेक्टरी को साफ़ कर सकता है।

<a id="resize-modes"></a>

## Resize मोड

`objectFit` स्टाइल, CSS का `object-fit` (Rust में `.object_fit(..)`), तय करता है कि इमेज किसी अलग आकार के बॉक्स को कैसे भरती है:

| मान | नतीजा |
|---|---|
| `"cover"` (`ResizeMode::Cover`, डिफ़ॉल्ट) | aspect ratio बनाए रखते हुए बॉक्स को भरती है, जो बाहर निकले उसे क्रॉप करती है |
| `"contain"` (`ResizeMode::Contain`) | aspect ratio बनाए रखते हुए बॉक्स के भीतर समाती है, खाली पट्टियाँ छोड़ती है |
| `"fill"` (`ResizeMode::Stretch`) | बॉक्स को ठीक-ठीक भरती है, इमेज को विकृत करते हुए |
| `"none"` (`ResizeMode::Center`) | प्राकृतिक आकार, `objectPosition` पर रखी जाती है (डिफ़ॉल्ट रूप से केंद्र में) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | प्राकृतिक आकार, जहाँ बड़ी हो वहाँ समाने के लिए सिकोड़ी जाती है |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Tailwind क्लास `object-cover`, `object-contain`, `object-fill`, `object-none` और `object-scale-down` वही स्टाइल सेट करती हैं।

<a id="image-position"></a>

### इमेज की स्थिति

आकार दी गई इमेज अपने बॉक्स में कहाँ बैठती है, यह `objectPosition` स्टाइल तय करती है (Rust में `.object_position(..)` और `.object_top()`, ...), यानी CSS का `object-position`। डिफ़ॉल्ट केंद्र है। कवर करने वाली इमेज इसके आसपास से क्रॉप होती है, और समाने वाली इमेज अपनी पट्टियों के भीतर खिसकती है। यह कीवर्ड (`"top"`, `"left bottom"`), प्रतिशत और लंबाइयाँ (`"25% 75%"`, `"10px 0"`) और ऑफ़सेट वाले किनारे (`"right 10px bottom 20%"`) लेती है। चैट बबल में एक लंबी फ़ोटो इस तरह अपना ऊपरी हिस्सा दिखाती है:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Tailwind क्लास वही हैं जो Tailwind की हैं: `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` और arbitrary मान (`object-[25%_75%]`)।

<a id="styling-images"></a>

## इमेज की स्टाइलिंग

इमेज व्यू हैं: वे कोनों की त्रिज्या (प्रति कोना भी), बॉर्डर, शैडो, opacity और ट्रांसफ़ॉर्म लेती हैं। कोने इमेज को क्लिप करते हैं।

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **Tint** (Rust में `.tint_color(..)`, TSX में `tintColor` स्टाइल) इमेज के अपारदर्शी पिक्सेल का रंग बदलता है: इसे उन एक-रंग के आइकन के लिए इस्तेमाल करें जो थीम का अनुसरण करते हैं।
- **फ़िल्टर** (`.grayscale(..)`, `.sepia(..)`, `.blur(..)`; TSX में `filter`) दोनों प्लेटफ़ॉर्म पर इमेज पर लागू होते हैं ([फ़िल्टर](./styling.md#filters-and-blending))।

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## प्लेसहोल्डर, फ़ेडिंग और blur

| Prop | Rust | विवरण |
|---|---|---|
| `placeholder` | `.placeholder(..)` | `src` के लोड होने तक दिखाई जाने वाली इमेज, एक URL या एसेट; लोकल एसेट सबसे अच्छा |
| `fadeDuration` | `.fade_duration(ms)` | लोड हुई इमेज कितने मिलीसेकंड में फ़ेड-इन होती है। डिफ़ॉल्ट iOS पर 0, Android पर 300 |
| `blurRadius` | `.blur_radius(px(..))` | इमेज को points में इस त्रिज्या से blur करता है, डीकोड करते समय एक बार लागू होता है |

```rust tabs
image(move || format!("https://picsum.photos/seed/{}/300/300", id.get()))
    .placeholder(PLACEHOLDER)
    .fade_duration(250.0)
    .size(px(100.0))
    .rounded(px(12.0))
image(cover).blur_radius(px(16.0)).absolute().inset_0()
```

```tsx tabs
<Image
  src={`https://picsum.photos/seed/${id()}/300/300`}
  placeholder={placeholder}
  fadeDuration={250}
  style={{ width: 100, height: 100, borderRadius: 12 }}
/>
<Image src={cover} blurRadius={16} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
```

<a id="animated-images"></a>

## एनिमेटेड इमेज

एनिमेटेड GIF, WebP और APNG फ़ाइलें अपने आप चलती हैं, एसेट के रूप में या URL से। वे वही स्टाइल लेती हैं, `objectFit` समेत। iOS पर tint की गई एनिमेटेड इमेज अपना पहला फ़्रेम दिखाती है।

<a id="load-events"></a>

## लोड इवेंट

| इवेंट | Rust | Payload | कब |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | लोडिंग शुरू होती है |
| `onProgress` | `.on_progress(..)` | बाइट में `{ loaded, total }` (अज्ञात होने पर `total` 0) | डाउनलोड के दौरान, हर 100 ms में अधिकतम एक बार |
| `onLoad` | `.on_load(..)` | `{ size }` | इमेज तैयार है; स्रोत का आकार पिक्सेल में (SVG का points में, [वेब पर वैसा जैसा ब्राउज़र मापता है](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (Rust में `&str`) | लोडिंग या डीकोडिंग विफल हुई |
| `onLoadEnd` | `.on_load_end(..)` | | `onLoad` या `onError` के बाद |

```rust tabs
let status = signal(SharedString::from("loading…"));

image(url)
    .on_load(move |size: &Size<DevicePixels>| status.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| status.set(message.to_owned().into()))
    .w(px(90.0))
    .h(px(60.0))
```

```tsx tabs
const status = signal("loading…");

<Image
  src={url}
  onLoad={({ size }) => status.set(`${size.width}×${size.height}`)}
  onError={(e) => status.set(e.message)}
  style={{ width: 90, height: 60 }}
/>
```

लोड इवेंट स्रोत इमेज का आकार रिपोर्ट करता है, उस आकार को नहीं जिस पर वह डीकोड की गई थी।

[पिक्सेल-घनत्व वेरिएंट](#pixel-densities) वाली इमेज अपनी फ़ाइलों में से एक लोड करती है, और लोड इवेंट उसी फ़ाइल के पिक्सेल रिपोर्ट करता है: 3× स्क्रीन पर `logo@3x.png` के लिए 192×192, जबकि `Image.getSize(logo)` import की गई फ़ाइल के 64×64 पर resolve होता है। जब पिक्सेल अनुपात बदलता है और इमेज दूसरा वेरिएंट लोड करती है, तो वह लोड भी अपने इवेंट रिपोर्ट करता है: `onLoadStart`, फिर नई फ़ाइल के आकार के साथ `onLoad` (या `onError`), फिर `onLoadEnd`।
<a id="an-images-size-and-prefetching"></a>

## इमेज का साइज़ और प्रीफ़ेचिंग

जो इमेज स्क्रीन पर नहीं हैं, उन्हें पहले से मापा और लोड किया जा सकता है: Rust में `image_size(..)` और `prefetch_image(..)`, TSX में `Image.getSize` और `Image.prefetch` (उसी `Image` पर जो एलिमेंट को रेंडर करता है):

```rust tabs
spawn(async move {
    // Ok(ImageSize { width, height }), in pixels.
    let size = image_size("https://example.com/photo.jpg").await;
    // Ok(()) once the bytes are in memory.
    let loaded = prefetch_image("https://example.com/next.jpg").await;
});
```

```tsx tabs
import { Image } from "nsh";

const size = await Image.getSize("https://example.com/photo.jpg");   // { width, height } in pixels
await Image.prefetch("https://example.com/next.jpg");                // once the bytes are in memory
```

| Rust | TSX | रिटर्न करता है |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | इमेज का साइज़ पिक्सल में (SVG का पॉइंट्स में, [वेब पर वैसा जैसा ब्राउज़र उसे मापता है](#svg-images)); लोड न हो पाने पर एक एरर |
| `prefetch_image(src)` | `Image.prefetch(src)` | कुछ नहीं, इमेज के बाइट्स लोड हो जाने के बाद; लोड न हो पाने पर एक एरर |

TSX में `src` एक URL स्ट्रिंग या इंपोर्ट की गई इमेज होती है। [वेरिएंट](#pixel-densities) वाली इंपोर्टेड इमेज के लिए, दोनों वही वेरिएंट लोड करते हैं जो व्यू इस स्क्रीन पर लोड करते हैं, और `getSize` इंपोर्ट की गई फ़ाइल का साइज़ देता है। दोनों डाउनलोड किए गए बाइट्स को उन व्यूज़ के लिए रखते हैं जो आगे इस इमेज को दिखाएँगे, इसलिए दिखाए जाने से पहले प्रीफ़ेच की गई इमेज बिना डाउनलोड के दिख जाती है।

एक आम उपयोग रिमोट इमेज का साइज़ उसके aspect ratio से तय करना है:

```rust tabs
fn remote_image(url: &'static str) -> impl IntoElement {
    let ratio = signal(1.0_f32);
    spawn(async move {
        if let Ok(size) = image_size(url).await {
            ratio.set(size.width.0 as f32 / size.height.0 as f32);
        }
    });
    image(url).w_full().aspect_ratio(ratio)
}
```

```tsx tabs
function RemoteImage(props: { url: string }) {
  const ratio = signal(1);
  Image.getSize(props.url).then((s) => ratio.set(s.width / s.height));
  return <Image src={props.url} style={{ width: "100%", aspectRatio: ratio() }} />;
}
```

<a id="other-assets"></a>

## अन्य एसेट्स

| फ़ाइल | Rust (`asset!`) | TSX इंपोर्ट | पेज |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | फ़ॉन्ट के family name के साथ एक `FontAsset` | फ़ॉन्ट का family name | [फ़ॉन्ट](./fonts.md) |
| `.json` और अन्य फ़ाइलें | उसके URI के साथ एक `FileAsset` | `.json`: पार्स की गई वैल्यू, स्क्रिप्ट में बंडल की हुई | [प्रोजेक्ट स्ट्रक्चर](./project-structure.md#modules) |

दोनों में फ़ॉन्ट पहले फ़्रेम से पहले रजिस्टर हो जाते हैं।

<a id="reading-a-file-at-run-time"></a>

### रन टाइम पर फ़ाइल पढ़ना

`fetch` किसी ऐसी फ़ाइल को पढ़ता है जिसे ऐप अपने साथ शिप करता है, उसके `asset:/` URL के ज़रिए, TSX और Rust दोनों में, हर प्लेटफ़ॉर्म पर। इंपोर्ट की गई इमेज अपना URL साथ रखती है (`url`), किसी Rust crate की फ़ाइलों के URL `asset!` (`FileAsset::uri`) और `assets!()` से मिलते हैं:

```rust tabs
const GREETING: FileAsset = asset!("locales/en.txt");

#[component]
fn Greeting() -> impl IntoElement {
    let greeting = signal(String::new());
    spawn(async move {
        match fetch(GREETING.uri).await {
            Ok(response) => greeting.set(response.text()),
            Err(error) => greeting.set(error),
        }
    });
    text(move || greeting.get())
}
```

```tsx tabs
import flag from "./images/flag.png";

const bytes = await (await fetch(flag.url)).bytes();
```

इंजन फ़ाइल को ऐप की फ़ाइलों से अपने थ्रेड के बाहर पढ़ता है (`nsh run` के दौरान dev server से), और इसके लिए किसी कैपेबिलिटी की ज़रूरत नहीं होती: वे ऐप की अपनी फ़ाइलें हैं। वेब ऐप वह सब कुछ डाउनलोड करता है जिसे पेज ने प्रीलोड नहीं किया था, उसी जगह से जहाँ से वह अपने एसेट्स सर्व करता है। रिस्पॉन्स `200` होता है जिसमें फ़ाइल के बाइट्स, उसका `Content-Length` और उसके एक्सटेंशन से मिला `Content-Type` (`image/png`, `application/json`, ...) होता है, और उसका `url` वही `asset:/` URL होता है चाहे फ़ाइल किसी भी तरीके से पहुँची हो; जो फ़ाइल ऐप शिप नहीं करता, वह उसका नाम बताने वाली नेटवर्क एरर के साथ reject हो जाती है। URL फ़ाइल को ऐप की फ़ाइलों के भीतर उसके पाथ से नाम देता है, और रिक्वेस्ट उसे `GET` (या `HEAD`) से पढ़ती है: ऐसा URL जिसका पाथ उनसे बाहर जाता है (`..`, एब्सोल्यूट पाथ) और दूसरे मेथड वाली रिक्वेस्ट, कुछ भी पढ़े या डाउनलोड किए जाने से पहले, उसी तरह reject हो जाते हैं।

<a id="a-modules-own-url"></a>

### मॉड्यूल का अपना URL

TSX में `import.meta.url` उस मॉड्यूल का URL है जिसमें वह लिखा गया है, इसलिए `new URL("./data.json", import.meta.url)` उसके बगल की किसी फ़ाइल को नाम देता है। लोकल या पैकेज्ड डेस्कटॉप ऐप के मॉड्यूल्स के ऐप की डायरेक्टरी में `file:` URL होते हैं, जिन्हें `fs/promises` `${pluginDir}` grant के तहत पढ़ता है; वेब ऐप के मॉड्यूल्स पेज के होते हैं; पैकेज्ड मोबाइल ऐप के मॉड्यूल्स `asset:/` URL होते हैं, जैसे इंपोर्ट की गई इमेज के। इमेज को शिप करने के लिए उसे इंपोर्ट करें: इस तरह बना URL फ़ाइल को नाम देता है, उसे पैकेज नहीं करता।

बिटमैप इमेज को `draw_image` / `drawImage` ([Canvas](./canvas.md)) से कैनवास पर भी ड्रॉ किया जाता है, और ग्रेडिएंट कई सजावटी इमेज की जगह ले लेते हैं ([स्टाइलिंग](./styling.md#gradients))।

<a id="related"></a>

## संबंधित

- [image एलिमेंट](../elements/image.md): हर prop, `getSize` और `prefetch` के साथ।
- [लिस्ट](./lists.md): इमेज की लंबी लिस्ट अपने व्यूज़ को रीसायकल करती हैं।
