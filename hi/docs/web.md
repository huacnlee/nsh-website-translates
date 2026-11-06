---
title: "वेब"
description: "Native Shell कॉम्पोनेंट्स को HTML और CSS के रूप में रेंडर करते हुए Rust या TSX में वेब ऐप्स बनाएं, ब्राउज़र में डेवलप करें, और किसी भी स्टैटिक होस्ट या CDN पर पब्लिश करें।"
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# वेब

Native Shell के साथ वही कंपोनेंट, स्टाइल और ऐप लॉजिक इस्तेमाल करके वेब ऐप बनाएँ जो नेटिव प्लेटफ़ॉर्म पर इस्तेमाल होते हैं। NSH इंटरफ़ेस को HTML एलिमेंट और CSS के रूप में रेंडर करता है: टेक्स्ट, इमेज, इनपुट, स्क्रॉलिंग, विज़ुअल स्टाइल और इंटरैक्शन ब्राउज़र के DOM और वेब APIs का उपयोग करते हैं।

`nsh package --target web` ऐप को किसी भी वेब सर्वर या CDN के लिए स्टैटिक साइट के रूप में प्रकाशित करता है ([ऐप प्रकाशित करें](#publish-an-app)), और `nsh run --target web` आपके एडिट करते समय उसे ब्राउज़र में चलाता है ([ब्राउज़र में डेवलप करें](#develop-in-the-browser))। इस साइट के सभी लाइव डेमो इसी वेब बैकएंड का उपयोग करते हैं।

प्रकाशित TSX ऐप ब्राउज़र के JavaScript इंजन का उपयोग करते हैं। पैकेजिंग हर ऐप को उसका अपना रनटाइम लिंक करती है, जिसमें केवल वही `nsh/base` कंपोनेंट और स्टैंडर्ड मॉड्यूल होते हैं जिन्हें ऐप इम्पोर्ट करता है: कोर कंपोनेंट से बना ऐप लगभग 1.1 MB डाउनलोड करता है। सिंटैक्स हाइलाइटिंग का डेटा तब लोड होता है जब कोड पहली बार हाइलाइट किया जाता है।

<a id="what-runs-where"></a>

## क्या कहाँ चलता है

पेज HTML एलिमेंट से बना है, जिन्हें CSS से स्टाइल किया गया है। NSH कंपोनेंट अपडेट को DOM बदलावों के बैच में बदलता है, जबकि ब्राउज़र इंटरफ़ेस दिखाता है और स्क्रॉलिंग, टेक्स्ट सेलेक्शन और इनपुट संभालता है। WebAssembly कंपोनेंट स्टेट, लेआउट और अपडेट के लिए साझा Rust इंजन को होस्ट करता है: Rust ऐप के क्रेट के साथ कंपाइल होकर, या ब्राउज़र के JavaScript इंजन के साथ, जो TSX ऐप का कोड ES मॉड्यूल के रूप में चलाता है: प्रकाशित ऐप, डेव सर्वर का पेज, इस साइट के डेमो और प्लेग्राउंड, सभी इसी तरह चलते हैं।

हर नेटिव प्लेटफ़ॉर्म पर इंजन का अपना थ्रेड होता है और वह हर कमिट पर एक `MountBatch` मुख्य थ्रेड को सौंपता है। ब्राउज़र पेज में एक ही थ्रेड होता है, इसलिए वेब बिल्ड उसी इंजन को पेज के इवेंट लूप (`nsh_engine::LocalEngine`) से चरण-दर-चरण चलाता है:

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **लेआउट कोर का है।** हर व्यू Taffy द्वारा गणना किए गए फ़्रेम पर एब्सोल्यूट पोज़िशन वाला एलिमेंट है, इसलिए flexbox, grid, `aspectRatio` और प्रतिशत ठीक वैसे ही व्यवहार करते हैं जैसे डिवाइस पर। ब्राउज़र का अपना लेआउट इसमें शामिल नहीं है।
- **स्टाइल Rust में CSS में बदली जाती हैं।** बैकग्राउंड, बॉर्डर, रेडियस, शैडो (`boxShadow`, `textShadow`), ग्रेडिएंट, फ़िल्टर, `backdropFilter`, ट्रांसफ़ॉर्म, `transformOrigin`, `outline`, `mixBlendMode`, ट्रांज़िशन और बिल्ट-इन कीफ़्रेम एनिमेशन CSS प्रॉपर्टी बन जाते हैं। Tailwind क्लास, `active:`, `hover:` और `focus:` स्टेट और `dark:` सभी नेटिव रूप से रिज़ॉल्व होते हैं, जैसे डिवाइस पर होते हैं।
- **टेक्स्ट का लेआउट Rust में होता है,** ब्राउज़र से मिले फ़ॉन्ट माप (`CanvasRenderingContext2D.measureText`) के साथ, और लेआउट द्वारा चुनी गई जगहों पर रन-दर-रन ड्रा किया जाता है, इसलिए जो नापा गया वही ड्रा होता है। लाइनें स्पेस के बाद, CJK अक्षरों के आसपास और `\n` पर टूटती हैं; `numberOfLines` एलिप्सिस के साथ काट देता है।
- **नेटिव एनिमेशन Rust में चलते हैं** `requestAnimationFrame` पर: `Animated` टाइमिंग, स्प्रिंग और डिके, `interpolate`, `opacity`, `translate`, `rotate`, `scale` से बंधे एनिमेटेड मान, `transform` और `backgroundColor` के चरण, `pan` से बंधे ड्रैग, स्क्रॉल-लिंक्ड मान और कैनवास आर्ग्युमेंट। डिवाइस की तरह ही, हर फ़्रेम में JS शामिल नहीं होता। `LayoutAnimation`, स्टाइल ट्रांज़िशन, `animate-*` कीफ़्रेम और स्क्रीन ट्रांज़िशन डेस्कटॉप बैकएंड की तरह चलते हैं, और `prefers-reduced-motion` उन्हें बंद कर देता है (स्क्रीन फ़ेड होती हैं)।
- **इनपुट:** `activeStyle` / `active:` फ़ीडबैक वाले प्रेस और लॉन्ग प्रेस, रिस्पॉन्डर सिस्टम (`onTouch*`, `PanResponder`), नेटिव ड्रैग और दो-उँगली पिंच व रोटेशन, स्क्रॉल व्यू (ब्राउज़र की स्क्रॉलिंग), पुल टू रिफ़्रेश, ज़ूम करने वाले स्क्रॉल व्यू (पिंच, ctrl+व्हील और टचपैड पिंच, `zoomTo`), नियंत्रित मानों वाले `<Input>`, फ़ोकस और सबमिट, `Canvas`, `NavStack` और `NavPage` पेज के `header`, `Dialog` के साथ।
- **सिस्टम UI पेज में ड्रा होता है:** `AlertDialog` डेस्कटॉप ब्राउज़र पर डेस्कटॉप बैकएंड के डायलॉग जैसा दिखता है और फ़ोन पर iOS जैसा (`desktop` idiom के साथ, नीचे देखें)। कस्टम फ़ॉन्ट ब्राउज़र द्वारा लोड किए जाने के बाद दोबारा नापे जाते हैं, और ऐप अपना पहला फ़्रेम दिखाने से पहले उन फ़ॉन्ट का इंतज़ार करता है जिन्हें वह इम्पोर्ट करता है।
- **डायलॉग** पूरे ऐप के ऊपर एक लेयर होते हैं जो ऐप का पॉपअप और बैकड्रॉप दिखाती है, जैसा डेस्कटॉप बैकएंड पर होता है। Escape, ब्राउज़र का बैक बटन और बैकड्रॉप पर प्रेस उन्हें बंद करते हैं (`closeOnEscape`, `closeOnBackdropPress`), और `animation`, `onOpen`, `onClose`, `onCancel` और `onOpenChange` डिवाइस की तरह काम करते हैं। जो पेज [ऐप को एम्बेड करता है](#embed-it-in-a-page) अपने लेआउट के एक हिस्से में, वह डायलॉग और अलर्ट को इसके बजाय पूरी ब्राउज़र विंडो के ऊपर दिखा सकता है (`dialogs: "viewport"`), जैसे iOS और Android उन्हें पूरी स्क्रीन के ऊपर दिखाते हैं।

<a id="keyboard-mouse-and-touch"></a>

## कीबोर्ड, माउस और टच

प्रकाशित ऐप डेस्कटॉप ब्राउज़र में डेस्कटॉप ऐप की तरह और फ़ोन ब्राउज़र में फ़ोन ऐप की तरह व्यवहार करते हैं:

- **व्हील और टचपैड** अपनी धुरी के साथ सबसे भीतरी उस स्क्रॉल व्यू को स्क्रॉल करते हैं जो अब भी खिसक सकता है (जब कुछ भी वर्टिकल न खिसक सके तो वर्टिकल व्हील हॉरिज़ॉन्टल सूची को स्क्रॉल करता है), और स्क्रॉल ख़त्म होने तक उसी पर बने रहते हैं; व्हील की क्लिक सहजता से सरकती हैं, पेजिंग और स्नैपिंग वाले व्यू हर स्क्रॉल पर एक पेज खिसकते हैं। Ctrl + व्हील और टचपैड पिंच पेज को ज़ूम करने के बजाय व्यू को नेटिव पिंच मानों के साथ पिंच करते हैं। माउस से ड्रैग करना स्क्रॉल नहीं करता, जैसा डेस्कटॉप प्लेटफ़ॉर्म पर होता है: माउस ड्रैग पैन, रिस्पॉन्डर सिस्टम और टेक्स्ट सेलेक्शन को जाते हैं। स्क्रॉल व्यू `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End` और `onScrollEnd` को डेस्कटॉप प्लेटफ़ॉर्म की तरह रिपोर्ट करते हैं।
- **कीबोर्ड**: Tab और Shift+Tab प्रेसेबल और इनपुट के बीच चलते हैं (ऐप की `focus:` स्टाइल कीबोर्ड फ़ोकस दिखाती हैं); Return फ़ोकस वाले प्रेसेबल को दबाता है, Space उसे छोड़े जाने पर दबाता है; एरो, Page Up / Page Down, Space, Home और End फ़ोकस के आसपास या माउस के नीचे वाले स्क्रॉल व्यू को स्क्रॉल करते हैं; Escape फ़ील्ड छोड़ता है, डायलॉग बंद करता है, फिर पीछे जाता है। `keymap` शॉर्टकट ब्राउज़र में काम करते हैं, और तुरंत मैच किए जाते हैं (`mod` Mac पर Safari और Chrome में Command है, बाकी जगह Control)।
- **पीछे जाना**: Escape, Alt+Left (Mac पर Cmd+[) और माउस का बैक बटन सबसे नए डायलॉग को बंद करते हैं या सबसे भीतरी स्टैक को पॉप करते हैं, जैसा Android का बैक बटन करता है; `popOnBack` और `onBackPress` वहीं की तरह काम करते हैं। जब ऐप ही पूरा पेज हो, तो हर पुश किया गया पेज और खुला डायलॉग एक ब्राउज़र हिस्ट्री एंट्री होता है, इसलिए ब्राउज़र का बैक बटन ऐप में पीछे जाता है।
- **टच**: केवल स्क्रॉल व्यू पैन करते हैं; पेज स्वयं ऐप के नीचे कभी स्क्रॉल, ज़ूम या पुल टू रिफ़्रेश नहीं करता, और टैप में कोई देरी नहीं होती। iframe में, जो स्वाइप ऐप नहीं लेता वे एम्बेड करने वाले पेज को स्क्रॉल करते हैं। नेटिव पैन, पिंच और रिस्पॉन्डर सिस्टम वाले व्यू पर ड्रैग ऐप के होते हैं।
- **एक्सेसिबिलिटी**: `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion` और `accessibilityElementsHidden` ARIA बन जाते हैं; `announce` लाइव रीजन के ज़रिए बोलता है और `setAccessibilityFocus` फ़ोकस को ले जाता है। डायलॉग या अलर्ट के नीचे के व्यू इनर्ट होते हैं।
- **सेलेक्शन और मेन्यू**: डेस्कटॉप ब्राउज़र में टेक्स्ट डिफ़ॉल्ट रूप से सेलेक्ट किया जा सकता है, जैसा वेब पेज पर होता है, सिवाय इंटरैक्टिव एलिमेंट (प्रेस या टच हैंडलर वाले व्यू: बटन, प्रेसेबल रो, टैब) के भीतर और `userSelect: "none"` या `select-none` वाले टेक्स्ट के; उस पर माउस ड्रैग करने से वह सेलेक्ट होता है, Ctrl/Cmd+C उसे लाइन-दर-लाइन कॉपी करता है और Ctrl/Cmd+A उस पूरे टेक्स्ट को सेलेक्ट करता है जिसमें सेलेक्शन है। फ़ोन और टैबलेट ब्राउज़र में केवल `userSelect: "text"` वाला टेक्स्ट सेलेक्ट किया जा सकता है, जैसा नेटिव ऐप में होता है। ब्राउज़र का कॉन्टेक्स्ट मेन्यू केवल सेलेक्ट किए जा सकने वाले टेक्स्ट और इनपुट में दिखता है।


<a id="apps-with-rust-components"></a>

## Rust कंपोनेंट वाले ऐप

Rust में लिखा ऐप ([Rust के साथ बिल्ड करना](./rust.md)) अपनी डायरेक्टरी से ब्राउज़र में प्रकाशित होता और चलता है:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

जब `nsh.json` ऐप के रूट कंपोनेंट (`"root"`) का नाम देता है, तो पेज में ऐप का Rust और NSH की पेज स्क्रिप्ट ही होती है, और कुछ नहीं: `nsh.wasm` में इंजन, कंपोनेंट और ऐप का क्रेट होता है, साइट में कोई `app.js` नहीं होता, और रनटाइम और फ़ॉन्ट आते ही पेज रूट को माउंट कर देता है। पूरी Rust गैलरी 3.3 MB (gzip के साथ 1.06 MB, brotli के साथ 0.75 MB) है, जो TSX ऐप के रनटाइम से कम है। अपनी TSX एंट्री (`nsh package App.tsx --target web`) के तहत वही ऐप TSX ऐप की तरह ब्राउज़र के JavaScript इंजन पर चलता है, और क्रेट के कंपोनेंट और मॉड्यूल इम्पोर्ट करता है।

दोनों तरह से, क्रेट के एसेट (`assets!()`) ऐप के एसेट के साथ प्रकाशित होते हैं, और उसके फ़ॉन्ट पहले फ़्रेम से पहले लोड होते हैं। `nsh run --target web` के दौरान, क्रेट के Rust कोड में बदलाव रनटाइम को फिर से बिल्ड करता है और खुला पेज उसे अपने-आप लोड कर लेता है; TSX एडिट हॉट अपडेट ही रहते हैं। डेवलपमेंट रनटाइम इंक्रीमेंटल रूप से बिल्ड होता है, इसलिए क्रेट में बदलाव लगभग एक सेकंड में तैयार हो जाता है; `nsh package` प्रकाशित वाले को साइज़ के लिए ऑप्टिमाइज़ करके बिल्ड करता है।

जो Rust कोड हर प्लेटफ़ॉर्म पर चलता है, वेब समेत, वह इंजन की सेवाओं का उपयोग करता है: `fetch(url).await` HTTP रिक्वेस्ट उसी नेटवर्क स्टैक से करता है जिससे JS का `fetch` (यहाँ ब्राउज़र का, उसके CORS नियमों के साथ); `timer`, `set_timeout` और `set_interval` प्रतीक्षा करते हैं; और `nsh_core::time::Instant` और `nsh_core::time::unix_ms()` घड़ी पढ़ते हैं। `background` और `blocking` नेटिव टारगेट के थ्रेड पर काम चलाते हैं।

बिल्ड के लिए Rust टारगेट और एक clang चाहिए जो WebAssembly में कंपाइल करता हो, जैसा रनटाइम का अपना बिल्ड करता है: `rustup target add wasm32-unknown-unknown`, साथ में `clang` और `llvm-ar` (macOS पर, Homebrew के `llvm` जैसा LLVM टूलचेन, `CC_wasm32_unknown_unknown` और `AR_wasm32_unknown_unknown` के ज़रिए)।

<a id="browser-apis-from-rust"></a>

### Rust से ब्राउज़र APIs

क्रेट [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) और उसके `web-sys` और `js-sys` क्रेट के ज़रिए ब्राउज़र के अपने APIs को कॉल कर सकता है, `#[cfg(target_arch = "wasm32")]` के पीछे: WebSocket, `IndexedDB`, क्लिपबोर्ड, कोई भी Web API, और क्रेट का अपना JS (`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`)। जब ऐप का वेब रनटाइम इस तरह JS को कॉल करता है (`JsValue` कन्वर्ज़न समेत), तो `nsh` उस पर `wasm-bindgen` CLI चलाता है और उसका ग्लू तथा क्रेट का JS रनटाइम के बगल में शिप करता है, डेवलपमेंट और प्रकाशित साइट दोनों में। CLI का संस्करण वही है जो उस `wasm-bindgen` क्रेट का है जिसे रनटाइम लिंक करता है, जिसका नाम `nsh` देता है: `cargo install wasm-bindgen-cli --version <version> --locked` उसे इंस्टॉल करता है (`NSH_WASM_BINDGEN` `PATH` के अलावा कहीं और के CLI का नाम देता है)। जो रनटाइम wasm-bindgen को लिंक करता है पर उसके ज़रिए कोई JS कॉल नहीं करता (किसी डिपेंडेंसी के डिफ़ॉल्ट फ़ीचर के कारण) वह हर दूसरे रनटाइम की तरह बिल्ड होता है।

क्रेट जिन APIs का उपयोग करता है उनके नाम `web-sys` फ़ीचर के रूप में देता है, और `wasm-bindgen` को पिन करने से उसका संस्करण, और इसलिए CLI का भी, हर बिल्ड में एक-सा रहता है:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

ब्राउज़र के कॉलबैक (आता हुआ संदेश, पेज का कोई टाइमर) ऐप के टास्क को जगाते हैं, जो तुरंत चलते हैं:

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

क्रेट के ब्राउज़र APIs के कॉल पेज की अपनी अनुमतियों के साथ चलते हैं, जैसे क्रेट का नेटिव कोड अन्य प्लेटफ़ॉर्म पर ऐप की अनुमतियों के साथ चलता है: `nsh.json` की क्षमताएँ तय करती हैं कि इंजन से क्या गुज़रता है (`fetch`, ऐप का JS), और ब्राउज़र के नियम (CORS, पेज की Content-Security-Policy) पेज की हर रिक्वेस्ट पर लागू होते हैं।

<a id="publish-an-app"></a>

## ऐप प्रकाशित करें

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` `.nsh/out/<Name>/` लिखता है (दूसरी डायरेक्टरी के लिए `--out`), जिसका लेआउट फ़्रंटएंड बिल्ड जैसा है: एक पेज और अपनी सामग्री के नाम पर रखी गई फ़ाइलें।

| फ़ाइल | यह क्या है |
|---|---|
| `index.html` | ऐप का पेज: शीर्षक के रूप में उसका नाम, आइकन, उसके `appearance` के रंग, एक लोडिंग इंडिकेटर, और ऐप के लोड या शुरू न हो पाने पर एक संदेश |
| `manifest.webmanifest` | वह नाम, id, आइकन और रंग जिनके साथ ब्राउज़र ऐप को इंस्टॉल करते हैं |
| `nsh.<digest>.js` | DOM रनटाइम, मिनिफ़ाइड (79 KB, brotli के साथ 22.5 KB) |
| `nsh.<digest>.wasm` | Rust इंजन, लेआउट और कंपोनेंट, साथ में Rust ऐप का अपना क्रेट। TSX ब्राउज़र JavaScript में चलता है; पैकेजिंग इसे केवल उन कंपोनेंट और स्टैंडर्ड मॉड्यूल के साथ लिंक करती है जिन्हें ऐप की पहली स्क्रीन इम्पोर्ट करती है। |
| `nsh-<name>.<digest>.wasm` | कंपोनेंट, स्टैंडर्ड मॉड्यूल और शेडर जिन्हें ऐप पहली स्क्रीन के अलावा इस्तेमाल करता है: स्क्रीन दिखने के बाद बैकग्राउंड में डाउनलोड होते हैं |
| `<file>.br`, `<file>.gz` | हर फ़ाइल पहले से कंप्रेस की हुई, उन होस्ट के लिए जो पहले से कंप्रेस की गई फ़ाइलें भेजते हैं |
| `nsh-syntaxes.<digest>.bin` | वे सिंटैक्स जिनसे कोड हाइलाइट होता है (bat का सेट: 0.92 MB, brotli के साथ 0.8 MB), जो तब पहली बार डाउनलोड होते हैं जब कोई कोड ब्लॉक, `Editor` या `DiffView` किसी भाषा में कोड दिखाता है |
| `nsh-bindgen.<digest>.js` | उस ऐप का wasm-bindgen ग्लू जिसके क्रेट [Rust से ब्राउज़र APIs](#browser-apis-from-rust) को कॉल करते हैं, मिनिफ़ाइड |
| `snippets.<digest>/<crate>-<hash>/…` | उन क्रेट का JS जिसे ग्लू इम्पोर्ट करता है (`inline_js`, `module = "/js/…"`), उन पथों के तहत जो wasm-bindgen देता है |
| `app.<digest>.js` | कंपाइल की गई TSX एंट्री ES मॉड्यूल के रूप में, जिसे ब्राउज़र लोड करता है। |
| `host.<digest>.js` | पेज का होस्ट, `nsh.json` `web.host` ([होस्ट के फ़ंक्शन](#the-hosts-functions)) |
| `<name>.<digest>.js` | ES मॉड्यूल जो `import()` द्वारा ऑन डिमांड लोड होते हैं। |
| `assets/<path>.<digest>.<ext>` | ऐप द्वारा इम्पोर्ट किया गया हर एसेट, जो इस्तेमाल होने पर उसके URL से लोड होता है (फ़ॉन्ट उस कोड से पहले जो उन्हें रजिस्टर करता है, क्योंकि टेक्स्ट उन्हीं से नापा जाता है: ऐप शुरू होने से पहले, या उस चंक के साथ जो उन्हें इम्पोर्ट करता है) |
| `icons/<size>.<digest>.png` | `nsh.json` का आइकन 32 (favicon), 180 (`apple-touch-icon`), 192 और 512 पिक्सेल पर |

`<digest>` फ़ाइल की सामग्री के SHA-256 की शुरुआत है: फ़ाइल का नाम ठीक तभी बदलता है जब उसकी सामग्री बदलती है, इसलिए नई रिलीज़ में केवल `index.html` और वे फ़ाइलें बदलती हैं जो वाकई बदली हैं। सब कुछ रिलेटिव URL का उपयोग करता है, इसलिए साइट किसी भी होस्ट की किसी भी डायरेक्टरी से काम करती है (`https://example.com/apps/counter/`)।
<a id="runtime-size"></a>

### Runtime का आकार

Packaging हर app को उसका अपना `nsh.<digest>.wasm` देकर link करता है, जिसमें engine और वे `nsh/base` components, standard modules और shaders होते हैं जिन्हें app की पहली screen import करती है। app की बाकी screens जो कुछ import करती हैं, वह पहली screen दिखने के बाद background में download होता है। जिस app के crates [Rust से browser APIs](#browser-apis-from-rust) call करते हैं, उसे अपने `nsh.<digest>.wasm` में पूरा runtime मिलता है, उसके crates समेत। `nsh package --target web` से मापा गया (MB = 10^6 bytes):

| App | उपयोग | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | Core components | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | हर component, `zlib` और shaders | 4.13 MB | 1.36 MB | 1.01 MB |

<a id="deploy-it"></a>

### इसे deploy करें

Directory को किसी भी static host पर upload करें: CDN के पीछे object store, Cloudflare Pages, Netlify, GitHub Pages, nginx। दो नियम इसे तेज़ी से load होने वाला और भरोसेमंद ढंग से update होने वाला बनाते हैं:

| फ़ाइलें | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (हर load पर revalidate होती हैं, इसलिए नया release तुरंत दिखता है) |
| बाकी सब कुछ | `public, max-age=31536000, immutable` |

`.wasm` को `application/wasm` के रूप में serve करें (तब browsers उसे download होते समय ही compile कर लेते हैं), और जो browsers precompressed copies स्वीकार करते हैं उन्हें वही भेजें: nginx का `brotli_static on; gzip_static on;`, Caddy का `file_server { precompressed br gzip }`, या Brotli से compress करने वाला CDN। Brotli के साथ runtime gzip की तुलना में लगभग एक चौथाई छोटा होता है। `nsh package --target web --run` `http://127.0.0.1:4173/` पर साइट को इसी तरह serve करता है।

वेब के लिए publish किया गया app एक packaged native app की तरह चलता है: release के रूप में, उन capabilities के साथ जो उसका `nsh.json` declare करता है ([Sandbox और capabilities](./sandbox-and-capabilities.md)), यानी browser के JavaScript engine पर चलता TSX app। जब वे `network` को सीमित करती हैं, तो page declare किए गए hosts (और page के अपने origin) के साथ एक Content-Security-Policy `connect-src` भी रखता है, ताकि browser खुद किसी भी दूसरे host के requests और redirect hops को अस्वीकार कर दे। जो error app को शुरू होने से रोकता है, वह page पर दिखाया जाता है; बाद के errors browser के console में जाते हैं।

<a id="embed-it-with-an-iframe"></a>

### iframe के साथ embed करें

वेब पर कोई embedding API नहीं है: publish किए गए app को `<iframe>` के साथ embed करें। उसका आकार app की window का आकार होता है:

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## Browser में develop करें

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

dev server शुरू करता है और उसके page का address प्रिंट करता है, `http://127.0.0.1:8790/`: इसे किसी भी browser में खोलें। यह page दूसरों की तरह एक development host है: यह app का हर build चलाता है, build errors और runtime errors को app के ऊपर दिखाता है, और app के logs को terminal में भेजता है। Rust app के crate में बदलाव उसका runtime फिर से build करता है और खुला page उसे अपने आप load कर लेता है; TSX edits वहीं की वहीं लागू हो जाते हैं (hot updates)। उसी network पर मौजूद phones उस address को खोलते हैं जो `nsh run` उसके नीचे प्रिंट करता है (`on this network: http://192.168.…:8790/`)। web runtime मौजूद होने पर `nsh dev` वही page serve करता है (distribution में हमेशा)।

<a id="build-the-websites-player"></a>

## वेबसाइट का player build करें

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

Output directory में ये होता है:

| फ़ाइल | यह क्या है |
|---|---|
| `gallery/nsh.<digest>.wasm` | Gallery का runtime, जिसे `nsh package` ने उसके लिए link किया है (यह हर component और `zlib` इस्तेमाल करता है: लगभग 11.8 MB, gzip के बाद 3.6 MB) |
| `gallery/nsh-syntaxes.<digest>.bin` | वे syntaxes जिनसे runtime code को highlight करता है, जो किसी demo के पहली बार किसी भाषा में code दिखाने पर fetch होती हैं |
| `nsh-playground.wasm` | वही, साथ में NSH का TSX compiler, [playground](#the-playground) के लिए (लगभग 8 MB, gzip के बाद 2.4 MB) |
| `gallery/nsh.<digest>.js` | DOM runtime (minified): wasm load करता है, batches लागू करता है, input को events में बदलता है |
| `index.html` | एक player page: `#<name>` के लिए `demos/<name>.js` चलाता है |
| `nsh.wasm`, `nsh.js`, `browser/` | वह runtime जिसे player load करता है: engine, DOM runtime और browser host के modules |
| `demos/<name>.js` | `nsh build --release` द्वारा compile किया गया हर demo: एक ES module |
| `gallery/` | `nsh package --target web` से publish किया गया gallery app, जो [Gallery](/gallery) page पर दिखाया जाता है |

Directory को किसी भी static server से serve करें (streaming compilation के लिए उसे `application/wasm` MIME type चाहिए) और `index.html#counter` खोलें।

<a id="the-playground"></a>

## Playground

[Playground](/playground) browser में app को edit और run करता है: page TSX को NSH के अपने JSX compiler से compile करता है (`nsh-playground.wasm` में built-in, rolldown के बिना) और typing में हर विराम पर उसे browser के JavaScript engine पर चलाता है। इस साइट के हर demo में **Edit in Playground** link है, और **Share** code को link में ही रख देता है, इसलिए server पर कुछ भी store नहीं होता।

Playground app एक module होता है: यह NSH के modules (`nsh` और `nsh/*`) import करता है, लेकिन कोई दूसरी files या packages नहीं। `console.log` का output और errors phone के नीचे दिखते हैं।

Compiler एक Rust function भी है, `nsh_bundler::compile_module(name, source, ui_sets)`, जो crate के `bundle` feature के बिना उपलब्ध है।

<a id="embed-it-in-a-page"></a>

## इसे page में embed करें

Rust app को उसकी publish की गई साइट के रूप में [iframe](#embed-it-with-an-iframe) में embed किया जाता है। TSX के लिए `nsh.js` एक ES module है। `createPlayer` runtime को एक container में load करता है; `runModule(url)` वह bundle शुरू करता है जिसे `nsh build` लिखता है (`bundle.js`, एक ES module), browser के JavaScript engine पर, app के अपने realm में, और जो पहले चल रहा था उसकी जगह लेता है। यह एक promise लौटाता है जो module के load होने पर resolve होता है और उसे रोकने वाले error के साथ reject होता है, जिसे player भी report करता है (`onError`):

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets` (`asset:/` paths से URLs का map) `assetBase` की जगह लेता है, `readAsset(uri)` उस asset के bytes लौटाता है जो engine को तुरंत चाहिए (जैसे font) या `null`, `data` उन files को उनके URLs से map करता है जिन्हें runtime पहली बार ज़रूरत पड़ने पर fetch करता है (`syntaxes`: `nsh-syntaxes.<digest>.bin`; default रूप से `nsh.js` के बगल में `nsh-<name>.bin`), और `glue` उस runtime के wasm-bindgen glue का URL है जिसके crates [Rust से browser APIs](#browser-apis-from-rust) call करते हैं (`nsh-bindgen.<digest>.js`), जिसे player runtime के साथ load करता है; `player.runModule(url, { capabilities, appId })` app को उन capabilities के अंतर्गत चलाता है जो वह declare करता है (उसका `capabilities.json`) और उसका storage उसके `nsh.json` id के अंतर्गत रखता है (id न हो तो page के path के अंतर्गत)। `nsh package --target web` जो page लिखता है, वह इन सबका उपयोग करता है।

`runModule(url, { chunks })` यह भी लेता है कि [split bundle](#split-bundles) के chunks कहाँ हैं।

`player.runSource(code, { name, sourceMap, capabilities, appId })` source text के रूप में दिया गया ES module उन्हीं options के साथ चलाता है। `nsh-playground.wasm` के साथ, `player.compileAndRun(tsx, name, options)` पहले TSX को compile करता है, उसे `runSource` के options के साथ चलाता है और compile error पर resolve होता है, या `null`; `player.compile(tsx)` `{ code }` या `{ error }` लौटाता है।

Container का आकार app की window का आकार होता है (`windowSize()`); container का आकार बदलने से app का आकार बदलता है। `player.setDark(true)` run time पर appearance बदलता है, जिसे apps `colorScheme()` और `dark:` classes के ज़रिए देखते हैं।

Dialogs और alerts container को ढकते हैं। `dialogs: "viewport"` के साथ वे पूरी browser window को ढकते हैं, जैसे किसी page के अपने modal dialogs ढकते हैं, जबकि app container को ही अपनी window बनाए रखता है: `Dialog` window के आकार और safe area में layout होता है और उसके निचले किनारे से अंदर सरकता है, उसका backdrop पूरे page को ढकता है, और उस पर mouse wheel चलाने से page अपनी जगह रहता है। Dialog browser की top layer में दिखता है (Chrome 114, Safari 17, Firefox 125 और बाद के), इसलिए container जहाँ भी हो, वह page के बाकी हिस्से के ऊपर रहता है; पुराने browsers में वह container को ढकता है।

`Sheet` वही presentation setting अपनाता है जो `Dialog` और `AlertDialog` अपनाते हैं। same-origin iframe में, viewport presentation अपने आप बाहरी page को ढक लेती है, जबकि app अपना मूल layout आकार बनाए रखता है। आखिरी popup बंद होने पर iframe अपनी मूल स्थिति और आकार पर लौट आता है; उसका engine और state जीवित रहते हैं। दस्तावेज़ों के demos इस presentation को चालू रखते हैं।

cross-origin या sandboxed iframe के लिए, embed करने वाला page player को load करने से पहले host को register करता है:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

Host इस iframe की window से आने वाले requests स्वीकार करता है, popup दिखने के दौरान आसपास के page को निष्क्रिय रखता है और उसकी scrolling को lock करता है, और बंद होने पर दोनों को बहाल करता है। हर cross-origin embedding सीमा के लिए उसके host का सहयोग ज़रूरी है; इसके बिना presentation उसी document तक सीमित रहती है और player एक warning report करता है।

<a id="the-hosts-functions"></a>

## Host के functions

वेब पर page ही app का host है: यह [`host`](../modules/nsh.md#host) के `host.call(name, args)` का जवाब देता है और वे events भेजता है जिन्हें `host.on` सुनता है। `createPlayer` का `host` एक object है जिसका `call(name, args)` result लौटाता है, या उसका promise; throw या rejection app के call को error के message के साथ reject कर देता है। `player.hostEvent(event, payload)` JSON payload के साथ event भेजता है (JSON न होने वाला payload throw करता है)। `host` के साथ, `host.available()` `true` होता है।

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

Publish किए गए app को उसका host `nsh.json` से मिलता है: `web.host` app की directory में एक JS module का नाम देता है, `nsh.json` के सापेक्ष, जो `createHost(player)` export करता है। `nsh package --target web` उसे साइट में `host.<digest>.js` के रूप में copy करता है, और app शुरू होने से पहले page `createHost` को player के साथ चलाता है; जो वह लौटाता है (या जिसके साथ resolve होता है) उसमें `call` function होना चाहिए, वरना page दिखाता है कि app load नहीं हो सका। इसके बाद player `createHost` जो events भेजता है:

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

Host हर नाम को वैसा ही, जैसा वह है, अपने functions की table में खोजता है, जैसा ऊपर दिखाया गया है, और अपने URLs और paths अपने पास रखता है: `capabilities.host` नामों को उनकी शुरुआत से grant करता है (`user.*`), इसलिए host द्वारा path में बदला गया नाम उस तक पहुँच सकता है जिसे grant छोड़ देता है। Runtime 1 से 128 characters के उन नामों को आगे भेजता है जो `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` और `-` से बने हों, `..` के बिना, और किसी दूसरे नाम के call को reject कर देता है। Prefix grant एक separator (`bridge.*`) पर खत्म होता है: `bridge*` `bridgeAdmin` से भी मेल खाता है।

App के चलने से पहले भेजे गए events, जैसे `createHost` से, उसके शुरू होते ही क्रम से deliver होते हैं, इसलिए app के top-level `host.on` listeners उन्हें पाते हैं। Listener के register होने से पहले भेजा गया event उसे दोबारा नहीं भेजा जाता: app जिस state से शुरू होता है उसे call (`host.call("user.info")`) के ज़रिए पढ़ता है और उसके बदलावों को events के ज़रिए follow करता है।

Host module app के page में चलता है और उसकी Content-Security-Policy साझा करता है: जब app की capabilities `network` को सीमित करती हैं, तो page के `connect-src` में page का origin, वे hosts जो `capabilities.network` सूचीबद्ध करता है और वे hosts जो `web.connect` सूचीबद्ध करता है, होते हैं। `web.connect` उन hosts के नाम देता है जिन तक host module के अपने requests (`fetch`, `XMLHttpRequest`, `WebSocket`) पहुँचते हैं, `capabilities.network.hosts` (`api.example.com`, `*.example.com`, `"*"`) जैसे patterns के रूप में, जैसे ऊपर `api.example.com`; app के अपने requests उसके `capabilities` के विरुद्ध ही जाँचे जाते रहते हैं।

Module जैसा है वैसा ही copy होता है, इसलिए वह दूसरा code absolute URL से import करता है। App को हर उस function के लिए अब भी अपनी `host` [capability](./sandbox-and-capabilities.md) चाहिए जिसे वह call करता है। `nsh run --target web` इसे development page पर चलाता है, और `nsh test` वही module हर उस app के लिए चलाता है जिसके tests वह खोलता है, headless या browser में (`--target web`), ताकि app और उसके host का परीक्षण साथ में हो ([Testing](./testing-and-trace.md#the-pages-host))।

<a id="the-browser-as-a-platform"></a>

## Platform के रूप में browser

`platform.os` है `"web"`। Browser किस तरह के device पर है, यह तय करता है कि app कैसे व्यवहार करे, जैसा `platform.idiom`:

- `"desktop"`: एक mouse (hover करने वाला fine pointer) और कम से कम 600 points चौड़ा container। `platform.desktop` है `true`, `platform.select` `desktop` चुनता है और `desktop={{…}}` props लागू होते हैं।
- `"pad"`: एक touch screen जिसकी छोटी भुजा कम से कम 600 points हो; अन्यथा `"phone"`। ये mobile हैं: `platform.select` `mobile` चुनता है।

Idiom app के शुरू होने पर तय होता है और उसके चलने के दौरान वही रहता है, जैसा हर platform पर होता है; एक संकरी desktop window फिर भी desktop ही है, जो अपने `windowSize()` के लिए layout की गई है। `web={{…}}` props, `platform.select({ web })` और `web:` classes केवल browsers में लागू होती हैं; `ios={{…}}`, `native` और `ios:` वहाँ लागू नहीं होते।

Page बाकी environment की जानकारी देता है, और उसे अद्यतन रखता है:

| मान | Browser से |
|---|---|
| Locale (`Intl` का default) | `navigator.languages[0]` |
| Time zone (`Date` का local time, `Intl` का default `timeZone`) | browser की (`Intl.DateTimeFormat().resolvedOptions().timeZone`), daylight saving time समेत |
| Layout direction (`rtl:` / `ltr:`) | `<html dir>` यदि सेट हो, वरना locale की script |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | root element का font size / 16 px (browser की text size setting) |
| `pixelRatio()` | `devicePixelRatio` (यह zoom और screens के साथ बदलता है) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` जहाँ वह container से overlap करता है (phones पर `viewport-fit=cover` pages) |
| `keyboardFrame()` | on-screen keyboard container का कितना हिस्सा ढकता है (`visualViewport`) |

`platform.version` है `"0.0"`, और `screenReaderEnabled()` `false` ही रहता है (browsers यह नहीं बताते)। Page के आसपास के browser के bars browser के अपने हैं; page का [`statusBar`](../modules/nsh-base.md#status-bar) phones के लिए है।
<a id="networking"></a>

## नेटवर्किंग

`fetch` (स्ट्रीम, `AbortController` और `FormData` के साथ) और `<Image>` URL ब्राउज़र के अपने नेटवर्क स्टैक से होकर जाते हैं, NSH द्वारा ऐप की [capabilities](./sandbox-and-capabilities.md) जाँच लेने के बाद। चूँकि ये अनुरोध ब्राउज़र के हैं, इसलिए ब्राउज़र के नियम लागू होते हैं:

- **Relative URL** ब्राउज़र की तरह ही पेज के URL के सापेक्ष resolve होते हैं: प्रकाशित (published) ऐप `fetch("/api/items")` से अपनी ही API तक पहुँचता है, और `<Image src="/photos/a.jpg" />` अपने ही सर्वर से लोड होता है। (Native प्लेटफ़ॉर्म पर कोई पेज नहीं होता, इसलिए वहाँ absolute URL चाहिए।)
- **CORS.** पेज के origin से अलग किसी origin पर किया गया अनुरोध तभी सफल होता है जब वह सर्वर पेज के origin को अनुमति दे (`Access-Control-Allow-Origin`); अन्यथा `fetch` नेटवर्क त्रुटि के साथ reject हो जाता है। केवल वही response headers दिखाई देते हैं जिन्हें सर्वर expose करता है।
- **Cookies** (और HTTP authentication) केवल पेज के अपने origin को भेजी जाती हैं (`credentials: "same-origin"`), और जिन headers को ब्राउज़र प्रतिबंधित करते हैं (`Cookie`, `User-Agent`, `Host`, ...) उन्हें हटा दिया जाता है।
- **Redirects** ब्राउज़र स्वयं follow करता है। जिस अनुरोध को redirect follow नहीं करना है, वह विफल हो जाता है: `redirect: "manual"` और `"error"`, तथा ऐसे ऐप के अनुरोध जिसकी capabilities `network` को सीमित करती हैं (NSH हर hop की जाँच करता है, और ब्राउज़र redirect को follow करने से पहले उसे प्रकट नहीं करते)।
- **Request bodies** जो `ReadableStream` हैं, पहले पूरी इकट्ठा की जाती हैं और एक साथ भेजी जाती हैं; response bodies आने के साथ-साथ stream होती हैं।

## Split bundles

TSX वेब ऐप को पहली स्क्रीन दिखाने से पहले अपना पूरा कोड डाउनलोड करने की आवश्यकता नहीं होती (Rust ऐप एक ही `nsh.wasm` होता है, जिसे ब्राउज़र डाउनलोड के दौरान ही compile करता है)। `nsh package --target web` TSX ऐप्स को split करके प्रकाशित करता है, जिसमें हर chunk `<name>.<digest>.js` के रूप में होता है और पेज chunks को उन फ़ाइलों से map करता है। बंडल को स्वयं split करने के लिए, `nsh build --split` उन modules को, जिन्हें `import()` लोड करता है, उनके अपने chunks में रखता है, `bundle.js` के बगल में:

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

पहला `import("./Screen")` `Screen.js` और उसके द्वारा import किए गए chunks को एक साथ डाउनलोड करता है, फिर उन्हें evaluate करता है; इसके बाद के imports तुरंत resolve हो जाते हैं। पेज बताता है कि chunks कहाँ हैं: डिफ़ॉल्ट रूप से बंडल के बगल में, या प्रति chunk एक URL, उन फ़ाइलों के लिए जिनका नाम content digest के साथ बदला गया हो ताकि CDN उन्हें हमेशा के लिए cache कर सके:

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

जो chunk डाउनलोड नहीं हो पाता, वह `import()` को उस `TypeError` के साथ reject कर देता है जिसमें उसका नाम होता है; अगला `import()` फिर से प्रयास करता है। Chunk के नाम बंडल से लिए गए निश्चित फ़ाइल नाम होते हैं: ऐप पेज से कुछ और डाउनलोड नहीं करवा सकता।

[gallery](/gallery) हर demo को इसी तरह लोड करती है: `lazy` (`examples/gallery/ui.tsx` में) एक ऐसा component बनाता है जो पहली बार render होने पर import शुरू करता है, resolve होने तक placeholder दिखाता है, फिर जो लोड हुआ उसे render करता है। इसका पहला लोड index और सबसे पहले दिखाया जाने वाला demo होता है; demo जो फ़ॉन्ट import करता है वह उस demo के chunk के साथ आता है। Native builds में सभी modules मौजूद होते हैं, इसलिए वहाँ import तुरंत resolve हो जाता है:

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## सीमाएँ

ये बातें ब्राउज़र तय करता है, और web backend उसी का पालन करता है:

- **अन्य साइटों के Web views**: `WebView` एक `<iframe>` है। Inline HTML (`html`) को सब कुछ मिलता है: `onMessage`, `postMessage`, `injectJavaScript`, injected scripts और load events (यह अपने स्वतंत्र origin के साथ चलता है, पेज से अलग)। किसी अन्य साइट के पेज को केवल `postMessage` और दिए गए URL के साथ load events मिलते हैं: ब्राउज़र उसके navigations, title, history और errors को आसपास के पेज से छिपा देते हैं, और `userAgent` सेट नहीं किया जा सकता।
- **अपने आप शुरू होने वाले आवाज़ वाले वीडियो**: `Video` सभी props और events के साथ एक `<video>` है, लेकिन ब्राउज़र आवाज़ वाला वीडियो केवल user gesture के बाद ही शुरू करते हैं (muted वीडियो चलते हैं)।
- **Native components**: पंजीकृत native components उन native ऐप्स के होते हैं जो NSH को embed करते हैं; वेब पर उनका view खाली रहता है, और console में एक चेतावनी दिखती है।
- **Platform services**: क्लिपबोर्ड पढ़ने (`Clipboard.readText`, साथ ही `hasText`) के लिए secure context (HTTPS) चाहिए और यह उपयोगकर्ता से अनुमति माँग सकता है। Images `onProgress` रिपोर्ट नहीं करतीं।
- **Text shaping के विवरण**: line breaking UAX #14 का एक उपसमुच्चय है (spaces, CJK, hyphens, और CJK विराम-चिह्नों के लाइन की शुरुआत और अंत के नियम: `。`, `，` और `」` जैसे बंद करने वाले चिह्न लाइन की शुरुआत में नहीं आते, `（` और `「` जैसे खोलने वाले चिह्न उसके अंत में नहीं आते), इसमें hyphenation नहीं है और paragraph direction से आगे कोई bidirectional reordering नहीं है।

Player और dev server ऐप्स को development settings के साथ चलाते हैं; प्रकाशित ऐप्स releases के रूप में चलते हैं। दोनों TSX ऐप का कोड ब्राउज़र के JavaScript engine पर, ऐप के अपने realm में चलाते हैं।

<a id="see-also"></a>

## यह भी देखें

- [Packaging](./packaging.md): `nsh package` के अन्य targets।
- [Architecture](./architecture.md): engine, core और mount batches जिन्हें web build फिर से उपयोग करता है।
- [Testing](./testing-and-trace.md): `nsh test` वही engine headless चलाता है, अनुमानित text engine के साथ।
