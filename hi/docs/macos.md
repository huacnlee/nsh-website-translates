---
title: "macOS"
description: "macOS पर AppKit विंडो में Rust और TSX NSH ऐप्स चलाएँ, उन्हें .app बंडल के रूप में पैकेज करें, AppView की मदद से उन्हें किसी Mac ऐप में एम्बेड करें, और जानें कि macOS पर क्या अलग है।"
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

NSH ऐप्स नेटिव Mac ऐप्स के रूप में भी चलते हैं। macOS बैकएंड उन्हें AppKit views और Core Animation से रेंडर करता है और टेक्स्ट को CoreText से लेआउट करता है। कोर, रिएक्टिव ग्राफ़, रेंडरर, Taffy लेआउट और नेटिव मॉड्यूल iOS और Android जैसे ही हैं, इसलिए एक ही ऐप हर जगह चलता है। macOS पर `os()` `Os::MacOs` है (TSX में `platform.os` `"macos"` है) और TSX के `desktop={{…}}` props लागू होते हैं। विंडो का शीर्षक, ऐप का अपना title bar, मेनू बार और context menus Rust में `nsh_core::element::desktop` ([Desktop title bars](./rust.md#desktop-title-bars)) और TSX में [`nsh/desktop`](../modules/nsh-desktop.md) से आते हैं।

macOS बैकएंड एक डेस्कटॉप ऐप की तरह व्यवहार करता है: माउस, ट्रैकपैड और कीबोर्ड इनपुट, आकार बदलने योग्य विंडो, विंडो के ऊपर डायलॉग और एक मेनू बार।

<a id="requirements"></a>

## आवश्यकताएँ

- **macOS 14** या बाद का संस्करण, जिस पर ऐप चलता है।
- Xcode के command line tools (`xcode-select --install`), ताकि चेकआउट से Rust ऐप्स के runners और NSH का macOS runtime बनाया जा सके, और ऐप्स को पैकेज किया जा सके (`codesign`, `sips`)। Mac पर `cargo xtask dist` से बनी distribution TSX ऐप्स का runtime `runtime/macos/` में शिप करती है।

<a id="running-an-app"></a>

## ऐप चलाना

Rust ऐप अपनी डायरेक्टरी से चलता है:

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` आपके crate के साथ एक debug runner बनाता है और ऐप को एक विंडो में खोलता है, जबकि उसके logs (`log::info!` और बाकी) टर्मिनल में दिखते हैं। crate के Rust कोड में बदलाव होने पर runner फिर से बनता है और ऐप रीस्टार्ट होता है। `cargo run` वही root crate के `src/main.rs` से शुरू करता है, जिसे `nsh init --template rust` लिखता है: `AppSource::Rust` के साथ [`run_app`](#embedding-in-a-mac-app)।

TSX ऐप अपनी entry का नाम देता है:

```sh
nsh run App.tsx --target macos
```

ऐप एक AppKit विंडो में खुलता है (डिफ़ॉल्ट रूप से 1200×800), जिसमें hot reload, टर्मिनल में logs और error overlay अन्य टारगेट की तरह ही होते हैं। Cmd+R नवीनतम build को फिर से लोड करता है। मेनू बार और विंडो ऐप का नाम दिखाते हैं (nsh.json का `"name"`, नहीं तो उसकी डायरेक्टरी का नाम)। चेकआउट में `nsh run` पहले development host (`nsh-macos-host`) बनाता है। `nsh run` को रोकने से विंडो बंद हो जाती है, और विंडो बंद करने से `nsh run` समाप्त हो जाता है। host एक बने हुए bundle को अकेले भी चला सकता है:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` विंडो का शुरुआती आकार है (TSX ऐप्स के लिए); विंडो का आकार बदला जा सकता है। `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` प्राथमिक डिस्प्ले है, यानी वह जिसमें मेनू बार होता है।

`nsh test --target macos` TSX ऐप के tests को macOS विंडो में चलाता है, और यदि दूसरा डिस्प्ले हो तो उस पर चलाता है (मुख्य स्क्रीन आपके पास रहती है; `--display <n>` दूसरा चुनता है)। test जो भी ऐप खोलता है, उसे अपनी अलग विंडो मिलती है, उस आकार की जो test माँगता है, चाहे डिस्प्ले उससे छोटा हो। steps सिस्टम के इनपुट से उन views पर click, type और scroll करते हैं जिनके नाम उनके selectors में होते हैं ([Testing](./testing-and-trace.md#on-a-real-platform))।

### Performance monitor

`--fps` (Rust ऐप के `run_app` में `AppOptions { fps: true, .. }`, embedding के समय `AppView::set_fps_monitor(true)`, `nsh run App.tsx --target macos --fps`, host का `--fps`, या पैकेज किए गए TSX ऐप का `open -a MyApp --args --fps`) ऐप के ऊपर दाईं ओर एक पैनल दिखाता है जो प्रति सेकंड दो बार अपडेट होता है:

| पंक्ति | क्या मापती है |
|---|---|
| `FPS` | पिछले एक सेकंड में दिखाए गए frames: वे डिस्प्ले रिफ्रेश जिनमें ऐप बदला (निष्क्रिय ऐप कम दिखाता है; यह धीमापन नहीं है)। `max` वह है जिसके साथ main thread तालमेल रख सका, फिर डिस्प्ले की दर (ProMotion स्क्रीन पर 120 Hz)। |
| `TICK` | डिस्प्ले रिफ्रेश के बीच के अंतराल जैसे वे आए (mean, p95) और `gap`, दिखाए गए frames के बीच का p95 अंतराल: जब कुछ भी देर से न हो तो एक रिफ्रेश (120 Hz पर 8.3 ms)। |
| `MAIN` | प्रति frame main-thread समय (engine के बदलाव लागू करना, टेक्स्ट और canvases ड्रॉ करना, animations, इनपुट), उसका 95वाँ पर्सेंटाइल, और `drop`: उन frames का हिस्सा जिन्हें एक रिफ्रेश से ज़्यादा समय लगा। |
| `JS` / `CORE` | प्रति commit: आपका कोड (handlers, timers, list rows) और NSH का core (layout, text, diffing); प्रति सेकंड commits, प्रति commit नेटिव view बदलाव। |
| `HOP` | बदलाव engine thread और main thread के बीच कितनी देर इंतज़ार करते हैं; engine thread कितना व्यस्त है। |
| `CPU` / `GPU` / `MEM` | प्रोसेस: CPU (100% का मतलब एक core), उसका GPU हिस्सा, उसका memory footprint (Activity Monitor का आँकड़ा)। |

नीचे की बार पिछले 120 frames का main-thread समय दिखाती हैं, एक रिफ्रेश (रेखा) के मुकाबले: उसके आधे के भीतर हरा, उसके भीतर एम्बर, उससे ऊपर लाल। पैनल दिखते समय रीडिंग हर सेकंड एक बार लॉग भी होती हैं (target `nsh::perf`, Linux बैकएंड के रूप में, macOS के frame phases `tick`, `drain` और `canvas` के साथ; मिलीसेकंड mean/p50/p95/max के रूप में), जिन्हें `nsh test --fps -v` दिखाता है और `examples/gallery/tools/perf.py` पढ़ता है। release builds को मापें; बंद होने पर monitor की कोई लागत नहीं होती।

## Packaging

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

यह एक app bundle लिखता है:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

`.app` ad hoc साइन किया जाता है, इसलिए यह उसी Mac पर चलता है जिस पर बना था। इसे वितरित करने के लिए Developer ID से साइन करें और notarize करें। `--run` पैकेज करने के बाद ऐप खोल देता है।

<a id="embedding-in-a-mac-app"></a>

## Mac ऐप में embedding

`nsh-platform-macos` crate (NSH repository से) Rust Mac ऐप को `AppView` देता है: एक NSH engine `NSView` के रूप में। हर `AppView` स्वतंत्र है; कई एक साथ चल सकते हैं। यह एक Rust root चलाता है, यानी आपके crate का root component:

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` root को उसका [theme](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) देता है और `Root::app_id` वह id देता है जिसके अंतर्गत उसका डेटा रखा जाता है। `nsh build` का लिखा TSX bundle उसी view में लोड होता है:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` जो चल रहा था उसे बदल देता है; `stop` ऐप को समाप्त करता है। `asset_base` बताता है कि `asset:/` URIs कहाँ resolve होते हैं (`AssetBase::Directory` या `AssetBase::Http`)। Bytecode bundles (`bundle.nshc`) `unsafe { Bundle::bytecode(bytes) }` से लोड होते हैं: bytecode भरोसेमंद इनपुट है, इसलिए उसे केवल अपने ऐप की फ़ाइलों से लोड करें।
जो ऐप केवल एक NSH ऐप है, उसके लिए `run_app(source, options)` (`AppSource::Rust(root)` या `AppSource::Bundle(bundle)`) एक `AppView` को एक विंडो में एक standard मेनू (About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close) के साथ खोलता है, जिसे ऐप `Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md)) से बदल सकता है, और विंडो बंद होने तक चलता रहता है।
डिफ़ॉल्ट रूप से, विंडो बंद करने या Quit चुनने पर engine रुक जाता है और `run_app` से वापसी होती है; इसके बाद caller बाकी सफ़ाई पूरी कर सकता है या अपना executable फिर से लॉन्च कर सकता है।

विंडो बंद होने पर standalone session को जीवित रखने के लिए `AppOptions { keep_alive_on_close: true, ..Default::default() }` सेट करें। बंद करने पर विंडो छिप जाती है; Dock से फिर खोलने पर वही विंडो और engine दिखता है। स्पष्ट Exit या update relaunch के लिए किसी भी thread से `nsh_platform_macos::quit_app()` कॉल करें। यह रखी गई विंडो को बंद करता है, engine को रोकता है और `run_app` से वापस लौटता है।
`nsh_core::element::desktop::close_window()` चुनी गई window-close policy का पालन करता है।


`AppOptions::cache` (या `AppView::set_cache`, आगे लोड होने वाले ऐप्स के लिए) तय करता है कि ऐप्स अपने caches, [डाउनलोड की गई images](./images-and-assets.md#kept-on-disk) कहाँ रखें और हर ऐप कितना रखे (`CacheOptions`: डिफ़ॉल्ट रूप से सिस्टम की cache डायरेक्टरी और 256 MiB images)।

`AppView::set_locale(Some(locale))` और `AppView::set_font_scale(Some(scale))` ऐप को सिस्टम की जगह आपके ऐप की भाषा और टेक्स्ट आकार देते हैं (`None` फिर से सिस्टम का अनुसरण करता है): `locale()`, `Intl`, `fontScale()` और टेक्स्ट तुरंत उसका अनुसरण करते हैं ([Device and environment](./device-and-environment.md#in-an-embedding-app))।

`AppView::set_theme_overrides(Some(json))` ऐप के [theme](./tailwind.md#theme-tokens) के ऊपर आपके ऐप का brand लगाता है: `nsh.json` के `"theme"` के format में एक theme फ़ाइल, जिसके tokens light और dark mode में ऐप के उसी नाम वाले tokens पर भारी पड़ते हैं, जबकि ऐप के बाकी tokens बने रहते हैं; `bg-primary` जैसी classes तुरंत नई शैली लेती हैं, और बाद में लोड होने वाले ऐप्स उसी के साथ शुरू होते हैं (`None` ऐप को उसका अपना theme लौटा देता है; जो फ़ाइल parse न हो वह error है और कुछ नहीं बदलती)।

Native components `AppView::register_component` से रजिस्टर होते हैं; देखें [Native components](./native-components.md#registering-on-macos-rust)। `set_ui_sets(sets)` वे UI sets तय करता है जो हर engine परोसता है: NSH के (`nsh_base::registry()`) और आपके crates के (`my_app::registry()`, जिन्हें `#[native_module]` बनाता है), इसलिए view जो TSX लोड करता है वह आपके Rust components और modules को भी import करता है।

<a id="what-differs-on-macos"></a>

## macOS पर क्या अलग है

परिवेश डेस्कटॉप का है: safe area और कीबोर्ड की ऊँचाई 0 है, `idiom()` डेस्कटॉप है (`platform.idiom` `"desktop"` है), `os_version()` (`platform.version`) macOS का संस्करण है, और dark mode सिस्टम की appearance के साथ live चलता है। देखें [Device and environment](./device-and-environment.md)।

इनपुट डेस्कटॉप का है: माउस, ट्रैकपैड (momentum के साथ scrolling, pinch और rotation) और कीबोर्ड। चुनने योग्य टेक्स्ट को खींचकर, double-click और triple-click से चुना जाता है और Cmd+C से कॉपी किया जाता है। Escape, Option+Left, Cmd+[ और माउस का back बटन सबसे नए dialog को बंद करते हैं या stack में पीछे जाते हैं (focused field या web page में Escape केवल उसे छोड़ता है; पेज को ये keys पहले मिलती हैं, और जो वह इस्तेमाल करता है उन्हें रखता है); `Dialog` पूरी विंडो के ऊपर एक layer है जो ऐप का popup और backdrop दिखाती है। Pages अपना `header` ऊपर दिखाते हैं। `Input` में कहीं भी click, उसकी padding में भी, caret को सबसे नज़दीकी बिंदु पर रखता है। `AlertDialog` विंडो पर एक `NSAlert` sheet दिखाता है: एक पंक्ति में अधिकतम दो alert actions (cancel action सबसे बाईं ओर, आख़िरी सामान्य action Return के लिए default), और अधिक actions तथा action sheet के actions अपने क्रम में ऊपर-नीचे रखे जाते हैं, cancel action आख़िर में और कोई default नहीं; Escape cancel action चुनता है।

### Keyboard

| Keys | क्या करती हैं |
|---|---|
| Return | `Input` में, वह जो `submitBehavior` कहता है: submit (`onSubmit`), submit करके field छोड़ना, या नई पंक्ति (multiline inputs) |
| Return, keypad Enter, Space | focused view को `onPress` से सक्रिय करना, key-down पर एक बार; auto-repeat को छोड़ दिया जाता है |
| Shift+Return, Option+Return, Ctrl+Return | उस multiline input में नई पंक्ति जिसका return submit करता है |
| Tab, Shift+Tab (Ctrl भी) | सबसे नए dialog के भीतर, स्क्रीन क्रम में अगला / पिछला field या pressable view; Option+Tab multiline input में tab टाइप करता है |
| Escape | focused field को छोड़ता है; नहीं तो text selection साफ़ करता है, फिर सबसे नया dialog बंद करता है या पीछे जाता है |
| Option+Left, Cmd+[, माउस का back बटन | पीछे जाना (तब नहीं जब किसी field में focus हो: वहाँ Option+Left caret को हिलाता है) |
| Option / Cmd + तीर, Shift के साथ; Option+Delete, Cmd+Delete; Ctrl+A / E / K | field में शब्द और पंक्ति के अनुसार हिलाना, चुनना और मिटाना, जैसा हर Mac ऐप में होता है |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Undo, redo, cut, copy, paste, select all (`masked` field cut और copy को मना करता है); Cmd+A / Cmd+C चुनने योग्य टेक्स्ट को चुनते और कॉपी करते हैं |
| तीर; Page Up / Down, Space, Shift+Space, Option+Up / Down; Home / End, Cmd+Up / Down | focused view के आसपास या माउस के नीचे के scroll view को एक पंक्ति, एक पेज, शुरुआत / अंत तक scroll करना (तब नहीं जब किसी field में focus हो) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | बंद करना, minimize, full screen, छिपाना, बाकी छिपाना, quit (`nsh package` और `nsh run` ऐप्स के मेनू) |
| Cmd+R | नवीनतम build फिर से लोड करता है (`nsh run`) |

ऐप के अपने shortcuts ([`keymap`](../modules/nsh.md#keymap)) इनसे पहले आते हैं, सिवाय focused pressable view को भेजी गई activation keys, Quit, Hide, Minimize और Full Screen के, जिन्हें bind नहीं किया जा सकता।

Shortcuts किसी भी कीबोर्ड layout के साथ काम करते हैं (Cyrillic या Greek layout पर Cmd+C वही key है जो US layout पर C टाइप करती है)। input method की composition को commit करने वाला return (चीनी, जापानी, ...) कभी submit नहीं करता। `onKeyPress` वही रिपोर्ट करता है जो React Native करता है: टाइप किया गया टेक्स्ट, `"Enter"`, `"Backspace"` और `"Escape"`।

समर्थित नहीं, या अलग:

- **Zooming scroll views** (`zoomTo`, zoom props)।
- **`mixBlendMode`**, और 1 से ऊपर `brightness()`।
- **Inputs**: content types और autofill, keyboard types, autocapitalization, letter spacing; input accessory views कभी नहीं दिखाए जाते (कोई software keyboard नहीं है) और `keyboardShouldPersistTaps` को अनदेखा किया जाता है।
- **`WebView` का `scrollable={false}`** माउस wheel और ट्रैकपैड को पेज scroll करने से रोकता है: वे उसके आसपास के ऐप के scroll views को scroll करते हैं, जैसे iOS पर। पेज फिर भी अपने कीबोर्ड (Space, तीर) और अपनी scripts से scroll होता है, और उसके pages के बीच ट्रैकपैड swipes (`allowsBackForwardNavigationGestures`) भी रुक जाते हैं।
- **Accessibility**: custom `accessibilityActions`।
- **Status bar** और **haptics** (डेस्कटॉप पर कोई समकक्ष नहीं)।

<a id="see-also"></a>

## यह भी देखें

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
