---
title: "Windows"
description: "Windows पर Rust और TSX NSH ऐप्स को Direct2D से बनाई गई Win32 विंडो में चलाएँ, उन्हें पैकेज करें, AppView की मदद से उन्हें किसी Win32 ऐप में एम्बेड करें, और जानें कि Windows पर क्या अलग है।"
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

NSH ऐप्स Windows पर भी चलते हैं। Windows बैकएंड उन्हें Direct2D से Win32 विंडो में ड्रा करता है और DirectWrite से टेक्स्ट लेआउट करता है। कोर, रिएक्टिव ग्राफ़, रेंडरer, Taffy लेआउट और नेटिव मॉड्यूल iOS और Android जैसे ही हैं, इसलिए एक ऐप हर जगह चलता है। Windows पर `os()` का मान `Os::Windows` है (TSX में `platform.os` का मान `"windows"` है) और TSX के `desktop={{…}}` props लागू होते हैं। विंडो का शीर्षक, ऐप का अपना टाइटल बार, मेन्यू बार और संदर्भ मेन्यू Rust में `nsh_core::element::desktop` ([डेस्कटॉप टाइटल बार](./rust.md#desktop-title-bars)) और TSX में [`nsh/desktop`](../modules/nsh-desktop.md) से आते हैं।

<a id="requirements"></a>

## आवश्यकताएँ

- **Windows 10 1809** या उसके बाद का संस्करण, या Windows 11।
- वेब व्यू के लिए **WebView2 Runtime**। यह Windows 11 के साथ और Windows 10 पर Microsoft Edge के साथ आता है। इसके बिना `WebView` एक प्लेसहोल्डर दिखाता है।
- आपका ऐप जिन वीडियो फ़ॉर्मैट को चलाता है, उनके लिए **Media Foundation codecs** (वीडियो Windows के अपने मीडिया स्टैक से चलते हैं)।
- Rust ऐप का runner बनाने के लिए: C++ वर्कलोड और Windows SDK के साथ Visual Studio Build Tools। NSH का Windows रनटाइम बनाने के लिए (चेकआउट से, या Windows पर `cargo xtask dist`) QuickJS की बाइंडिंग के लिए LLVM भी चाहिए।

<a id="running-an-app"></a>

## ऐप चलाना

Windows पर `nsh run` ऐप को एक विंडो में खोलता है। Rust ऐप अपनी डायरेक्टरी से चलता है:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` आपके crate के साथ एक डीबग runner बनाता है और ऐप खोलता है। ऐप के लॉग (`log::info!` आदि) टर्मिनल में दिखते हैं। crate के Rust कोड में बदलाव होने पर runner दोबारा बनता है और ऐप फिर से शुरू होता है। `cargo run` उसी root को crate के `src/main.rs` से शुरू करता है, जिसे `nsh init --template rust` लिखता है: `AppSource::Rust` के साथ [`run_app`](#embedding-in-a-win32-app)।

TSX ऐप अपनी एंट्री का नाम देता है और डिफ़ॉल्ट रूप से 1200×800 की विंडो में खुलता है। हॉट रीलोड, टर्मिनल में लॉग और एरर ओवरले दूसरे टारगेट की तरह ही मिलते हैं:

```sh
nsh run App.tsx
```

चेकआउट में `nsh run` पहले डेवलपमेंट होस्ट (`nsh-windows-host.exe`) बनाता है। Windows पर बनी डिस्ट्रीब्यूशन उसे `runtime\windows\` में शामिल करती है। Ctrl-C विंडो बंद कर देता है, और विंडो बंद करने पर `nsh run` समाप्त हो जाता है। होस्ट `nsh` से ज़्यादा देर तक कभी नहीं चलता, चाहे वह किसी भी तरह समाप्त हो। होस्ट एक बिल्ट बंडल को अकेले भी चला सकता है:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` विंडो का साइज़ पॉइंट्स में है (`<width>x<height>`; TSX ऐप्स)।

<a id="performance-monitor"></a>

### परफ़ॉर्मेंस मॉनिटर

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, होस्ट का `--fps`, या Rust ऐप के `run_app` में `AppOptions { fps: true, .. }`) परफ़ॉर्मेंस मॉनिटर की रीडिंग हर सेकंड लॉग करता है (टारगेट `nsh::perf`)। इनमें डिस्प्ले की दर के मुकाबले दिखाए गए फ़्रेम, मुख्य थ्रेड का प्रति फ़्रेम समय और उसके चरण (`tick`, `drain`, `paint`, `present`, `canvas`), इंजन के commits, CPU और मेमोरी शामिल हैं। फ़ॉर्मैट वही है जो दूसरे डेस्कटॉप लॉग करते हैं (मिलीसेकंड में mean/p50/p95/max)। `nsh test --fps -v` उन्हें दिखाता है और `examples/gallery/tools/perf.py` उन्हें पढ़ता है ([Performance report](./performance-report.md#windows-win32-direct2d))। रिलीज़ बिल्ड पर माप लें। मॉनिटर बंद होने पर उसकी कोई लागत नहीं होती।

<a id="packaging"></a>

## पैकेजिंग

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

यह एक डायरेक्टरी लिखता है और वही एक आर्काइव के रूप में भी:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

एक्ज़ीक्यूटेबल `nsh\` को अपने बगल में ढूँढता है। पूरी डायरेक्टरी कॉपी करें (या `.zip` को अनपैक करें) जहाँ भी ऐप को रहना हो: कुछ भी इंस्टॉल नहीं होता। `nsh.json` का आइकन एक्ज़ीक्यूटेबल में एम्बेड हो जाता है (Explorer और टास्कबार उसे दिखाते हैं) और इसके लिए किसी अतिरिक्त टूल की ज़रूरत नहीं होती। किसी दूसरे सिस्टम पर पैकेजिंग करने पर डिफ़ॉल्ट आइकन रहता है। ऐप id टास्कबार में ऐप की विंडो को एक साथ समूहित करता है। `--run` पैकेजिंग के बाद ऐप को लॉन्च करता है। एक्ज़ीक्यूटेबल साइन किया हुआ नहीं होता: उसे वितरित करने के लिए अपने प्रमाणपत्र (`signtool`) से साइन करें।

<a id="embedding-in-a-win32-app"></a>

## Win32 ऐप में एम्बेड करना

`nsh-platform-windows` crate (NSH रिपॉज़िटरी से) Rust Win32 ऐप को `AppView` देता है: आपकी किसी विंडो की चाइल्ड विंडो में एक NSH इंजन। हर `AppView` स्वतंत्र है और एक साथ कई चल सकते हैं। यह एक Rust root चलाता है, यानी आपके crate का root कंपोनेंट:

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

`nsh build` का लिखा TSX बंडल उसी व्यू में लोड होता है, जिसमें `asset_base` को उसकी `assets` डायरेक्टरी पर सेट किया जाता है:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

व्यू एक चाइल्ड विंडो है: आपका मैसेज लूप उसे चलाता है, और पैरेंट का आकार बदलने पर आप उसे उसके `hwnd()` पर `MoveWindow` से स्थित करते हैं। इसे उस विंडो के थ्रेड पर बनाएँ जिसमें वह रहेगा: उसका लाइफ़साइकल उस विंडो की टॉप-लेवल विंडो का अनुसरण करता है, यानी वह जिसके अंतर्गत वह बना था। `AppView::load` पहले जो चल रहा था उसे बदल देता है, और `stop` (या विंडो को नष्ट करना) ऐप को समाप्त कर देता है। `asset_base` बताता है कि `asset:/` URIs कहाँ resolve होंगे (`AssetBase::Directory` या `AssetBase::Http`)। बाइटकोड बंडल (`bundle.nshc`) `unsafe { Bundle::bytecode(bytes) }` से लोड होते हैं (या `Bundle::read_trusted(path)` से, जो unsafe भी है): QuickJS बाइटकोड भरोसेमंद इनपुट माना जाता है, इसलिए उसे केवल अपने ऐप की फ़ाइलों से लोड करें। स्टैंडअलोन विंडो `nsh_platform_windows::run_app(source, options)` है, जिसके साथ `AppSource::Rust(root)` या `AppSource::Bundle(bundle)` होता है। `Root::tokens` किसी root को उसकी [थीम](./rust.md#theme) देता है और `Root::app_id` वह id देता है जिसके अंतर्गत उसका डेटा रखा जाता है।

`AppOptions::cache` (या अगले लोड होने वाले ऐप्स के लिए `AppView::set_cache`) तय करता है कि ऐप्स अपने कैश कहाँ रखें, [वे जो इमेज डाउनलोड करते हैं](./images-and-assets.md#kept-on-disk) वे कहाँ रहें, और हर ऐप कितना रखे (`CacheOptions`: डिफ़ॉल्ट रूप से सिस्टम की कैश डायरेक्टरी और 256 MiB इमेज)।

`AppView::set_locale(Some(locale))` और `AppView::set_font_scale(Some(scale))` सिस्टम की भाषा और टेक्स्ट साइज़ की जगह ऐप को आपके ऐप की भाषा और टेक्स्ट साइज़ देते हैं (`None` फिर से सिस्टम का अनुसरण करवाता है): `locale()`, `Intl`, `fontScale()` और टेक्स्ट तुरंत उसके अनुसार बदल जाते हैं ([Device and environment](./device-and-environment.md#in-an-embedding-app))।

`AppView::set_theme_overrides(Some(json))` आपके ऐप का ब्रांड ऐप की [थीम](./tailwind.md#theme-tokens) के ऊपर लगाता है: `nsh.json` के `"theme"` के फ़ॉर्मैट में एक थीम फ़ाइल, जिसके टोकन लाइट और डार्क मोड में ऐप के समान नाम वाले टोकनों पर प्रभावी होते हैं जबकि ऐप के बाकी टोकन बने रहते हैं। `bg-primary` जैसी क्लासें तुरंत नई स्टाइल पाती हैं, और बाद में लोड होने वाले ऐप्स उसी के साथ शुरू होते हैं (`None` ऐप को उसकी अपनी थीम वापस दे देता है; जो फ़ाइल पार्स नहीं होती वह एरर है और कुछ नहीं बदलती)।

नेटिव कंपोनेंट `AppView::register_component` से रजिस्टर किए जाते हैं; [Native components](./native-components.md#registering-on-windows-rust) देखें। `set_ui_sets(sets)` वे UI सेट तय करता है जो हर इंजन उपलब्ध कराता है: NSH के (`nsh_base::registry()`) और आपके crates के (`my_app::registry()`, जिसे `#[native_module]` बनाता है), इसलिए व्यू जो TSX लोड करता है वह आपके Rust कंपोनेंट और मॉड्यूल भी इम्पोर्ट कर सकता है।

<a id="what-differs-on-windows"></a>

## Windows पर क्या अलग है

एनवायरनमेंट डेस्कटॉप जैसा है: सेफ़ एरिया और कीबोर्ड की ऊँचाई 0 है, `idiom()` डेस्कटॉप है (`platform.idiom` का मान `"desktop"` है) और `os_version()` (`platform.version`) का मान `"10.0"` है (Windows 11 पर भी: Windows ने संस्करण संख्या वही रखी)। डार्क मोड Settings > Personalization > Colors का लाइव अनुसरण करता है, `fontScale()` Text size सेटिंग का, reduce motion एनिमेशन इफ़ेक्ट सेटिंग का, और locale उपयोगकर्ता के क्षेत्रीय फ़ॉर्मैट का। [Device and environment](./device-and-environment.md) देखें।

`cursor` स्टाइल तब अपडेट होती है जब माउस किसी व्यू पर टिका रहता है। जब कोई बैच कर्सर बदलता है, तो Windows पूरे बैच के बाद पॉइंटर के नीचे के व्यू का उपयोग करके नया आकार या `"none"` लागू करता है। टाइटल बार और रीसाइज़ बॉर्डर अपने सिस्टम कर्सर रखते हैं।

<a id="keyboard"></a>

### कीबोर्ड

| कुंजियाँ | क्या होता है |
|---|---|
| Return | `Input` में, जो `submitBehavior` कहता है वही: सबमिट (`onSubmit`), सबमिट करके फ़ील्ड छोड़ना, या नई लाइन (मल्टीलाइन इनपुट) |
| Shift+Return, Alt+Return | ऐसे मल्टीलाइन इनपुट में नई लाइन जिसका return सबमिट करता है (Ctrl+Return सबमिट करता है) |
| Tab, Shift+Tab | सबसे नए डायलॉग के भीतर अगला / पिछला टेक्स्ट फ़ील्ड; फ़ील्ड का टेक्स्ट चुन लिया जाता है, जैसा Windows के डायलॉग में होता है |
| Escape | फ़ोकस वाले फ़ील्ड को छोड़ता है; नहीं तो टेक्स्ट चयन हटाता है, फिर सबसे नया डायलॉग बंद करता है या पीछे जाता है |
| Alt+Left, Browser Back कुंजी, माउस का back बटन | पीछे जाएँ (फ़ील्ड से भी) |
| Ctrl+arrows, Home / End, Ctrl+Home / End, Shift के साथ; Ctrl+Backspace / Delete | फ़ील्ड में शब्द और लाइन के अनुसार खिसकाना, चुनना और मिटाना, जैसा हर Windows ऐप में होता है |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | पूर्ववत करें, फिर से करें, कट, कॉपी, पेस्ट, सब चुनें (`masked` फ़ील्ड कट और कॉपी नहीं करने देता); Ctrl+A / Ctrl+C चुने जा सकने वाले टेक्स्ट को चुनते और कॉपी करते हैं |
| Arrows; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | फ़ोकस वाले व्यू के आसपास या माउस के नीचे के स्क्रॉल व्यू को एक लाइन, एक पेज, या शुरुआत / अंत तक स्क्रॉल करें (जब किसी फ़ील्ड पर फ़ोकस हो तब नहीं) |
| F11, Alt+F4 | फ़ुल स्क्रीन, विंडो बंद करें (`nsh package` और `nsh run` ऐप्स) |
| Ctrl+R, F5 | नवीनतम बिल्ड रीलोड करें (`nsh run`) |

शॉर्टकट किसी भी कीबोर्ड लेआउट के साथ काम करते हैं (सिरिलिक या ग्रीक लेआउट पर Ctrl+C वही कुंजी है जो US लेआउट पर C टाइप करती है)। जो return किसी इनपुट मेथड की कंपोज़िशन (चीनी, जापानी, ...) को कमिट करता है, वह कभी सबमिट नहीं करता। `onKeyPress` वही रिपोर्ट करता है जो React Native करता है: टाइप किया गया टेक्स्ट, `"Enter"`, `"Backspace"` और `"Escape"`; पेस्ट किया गया टेक्स्ट रिपोर्ट नहीं होता।

ऐप के अपने शॉर्टकट ([`keymap`](../modules/nsh.md#keymap)) फ़ोकस वाले फ़ील्ड की कुंजियों, नेविगेशन और स्क्रॉलिंग से पहले आते हैं; Alt+F4, F11 और Ctrl+Q को बाइंड नहीं किया जा सकता।

अलग, या असमर्थित:

- **`WebView`**: 3D ट्रांसफ़ॉर्म (perspective) वाले व्यू के भीतर का पेज नहीं दिखता, और पेज के ऊपर का `backdropFilter` उसे ब्लर नहीं करता। `baseUrl` `http(s)` URLs लेता है। जो नेटिव कंपोनेंट अपनी अलग विंडो लाता है वह NSH की ड्रा की हर चीज़ के ऊपर रहता है।
- **वीडियो**: वही फ़ॉर्मैट जिन्हें इंस्टॉल किए गए codecs डिकोड करते हैं; कोई पोस्टर नहीं; `controls` के साथ कंट्रोल बार हमेशा दिखता है।
- **ज़ूम होने वाले स्क्रॉल व्यू** (`zoomTo`, zoom props); स्क्रॉल इंडिकेटर को खींचा नहीं जा सकता।
- **`mixBlendMode` और `backdropFilter`** ड्रा होते हैं, लेकिन ऐसे व्यू के भीतर नहीं जिसमें `filter` या 3D ट्रांसफ़ॉर्म हो; `borderCurve: "continuous"` गोलाकार कोने बनाता है।
- **टेक्स्ट**: हेड और मिडिल एलिप्सिस केवल एक लाइन पर (ज़्यादा लाइनों में टेल एलिप्सिस लगता है); रंगीन इमोजी केवल COLR फ़ॉन्ट से; स्मॉल कैप्स केवल वहाँ जहाँ फ़ॉन्ट में वे हों।
- **टेक्स्ट इनपुट**: कीबोर्ड टाइप और autofill लागू नहीं होते (सॉफ़्टवेयर कीबोर्ड नहीं है); Tab टेक्स्ट फ़ील्ड के बीच जाता है। राइट क्लिक एडिट मेन्यू खोलता है (Undo, Cut, Copy, Paste, Delete, Select All), जैसे चुने जा सकने वाले टेक्स्ट पर (Copy, Select All)।
- **Accessibility** (UI Automation): अलर्ट डायलॉग और टोस्ट उपलब्ध नहीं कराए जाते; हेडिंग level 1 रिपोर्ट करती हैं।
- **Input accessory views** और **status bar** (डेस्कटॉप पर कोई समतुल्य नहीं)।

<a id="see-also"></a>

## यह भी देखें

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
