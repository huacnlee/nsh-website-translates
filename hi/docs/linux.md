---
title: "Linux"
description: "Linux पर Rust और TSX NSH ऐप्स को GTK 4 विंडो में चलाएँ, उन्हें पैकेज करें, AppView के साथ उन्हें GTK ऐप में एम्बेड करें, और जानें कि Linux पर क्या अलग है।"
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

NSH ऐप Linux पर भी चलते हैं। Linux backend उन्हें GTK 4 widgets से रेंडर करता है और Pango से टेक्स्ट का लेआउट बनाता है। core, reactive graph, renderer, Taffy layout और native modules iOS और Android जैसे ही हैं, इसलिए एक ऐप हर जगह चलता है। Linux पर `os()` का अर्थ `Os::Linux` है (TSX में `platform.os` का अर्थ `"linux"` है) और TSX के `desktop={{…}}` props लागू होते हैं। विंडो का शीर्षक, ऐप का अपना टाइटल बार, मेन्यू बार और संदर्भ मेन्यू Rust में `nsh_core::element::desktop` ([Desktop टाइटल बार](./rust.md#desktop-title-bars)) और TSX में [`nsh/desktop`](../modules/nsh-desktop.md) से आते हैं।

<a id="requirements"></a>

## आवश्यकताएँ

- **GTK 4.14** या उसके बाद का संस्करण। Rust ऐप का runner या NSH का Linux runtime बनाने के लिए (checkout से, या `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` Debian और Ubuntu (24.04 या उसके बाद) पर, Arch पर `gtk4 clang`, Fedora पर `gtk4-devel clang`)।
- वेब व्यू के लिए **WebKitGTK 6.0** (2.40 या उसके बाद): Debian और Ubuntu पर `libwebkitgtk-6.0-dev`, Arch पर `webkitgtk-6.0`, और runtime बनाने के लिए Fedora पर `webkitgtk6.0-devel`। डेवलपमेंट host और release runner इसे डिफ़ॉल्ट रूप से उपयोग करते हैं, इसलिए पैकेज किए गए ऐप जहाँ चलें वहाँ WebKitGTK 6.0 होना चाहिए (Debian और Ubuntu पर `libwebkitgtk-6.0-4`; GNOME डेस्कटॉप में यह मौजूद होता है)। जिस मशीन पर इसकी development files नहीं हैं, वहाँ `cargo xtask dist` चलाने पर ऐसा runtime बनता है जिसके वेब व्यू placeholder होते हैं और जिसके ऐप को केवल GTK चाहिए।
- आपके ऐप द्वारा चलाए जाने वाले वीडियो फ़ॉर्मैट के लिए **GStreamer** plugins (GTK वीडियो GStreamer के माध्यम से चलाता है)।

<a id="running-an-app"></a>

## ऐप चलाना

Linux पर `nsh run` ऐप को GTK विंडो में खोलता है। Rust ऐप अपनी डायरेक्टरी से चलता है:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` आपके crate के साथ एक debug runner बनाता है और ऐप खोलता है, और उसके logs (`log::info!` व अन्य) terminal में दिखते हैं; crate के Rust कोड में बदलाव होने पर runner फिर से बनता है और ऐप रीस्टार्ट होता है। `cargo run` वही root crate के `src/main.rs` से शुरू करता है, जिसे `nsh init --template rust` लिखता है: `AppSource::Rust` के साथ [`run_app`](#embedding-in-a-gtk-app)।

TSX ऐप अपना entry बताता है, और डिफ़ॉल्ट रूप से 390×844 की विंडो में खुलता है, अन्य targets की तरह hot reload, terminal में logs और error overlay के साथ:

```sh
nsh run App.tsx
```

checkout में `nsh run` पहले डेवलपमेंट host (`nsh-linux-host`) बनाता है; Linux पर बनी distribution इसे `runtime/linux/` में शामिल करती है। Ctrl-C विंडो बंद करता है, और विंडो बंद करने से `nsh run` समाप्त हो जाता है। host एक बने हुए bundle को अकेले भी चला सकता है:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` विंडो का डिफ़ॉल्ट आकार है (TSX ऐप); tiling window managers विंडो को कोई और आकार दे सकते हैं।

<a id="packaging"></a>

## पैकेजिंग

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

यह एक डायरेक्टरी और उसी की एक archive लिखता है:

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

executable `nsh/` को अपने बगल में ढूँढता है (उसका symbolic link, जैसे `~/.local/bin` में, भी काम करता है)। जहाँ ऐप चले वहाँ GTK 4, Pango और WebKitGTK 6.0 इंस्टॉल होने चाहिए। ऐप को डेस्कटॉप के launcher में दिखाने के लिए executable (या उसका link) `PATH` पर, `.desktop` फ़ाइल `~/.local/share/applications` में और आइकन किसी icon theme डायरेक्टरी में रखें। `--run` पैकेज करने के बाद ऐप को लॉन्च करता है।

<a id="embedding-in-a-gtk-app"></a>

## GTK ऐप में एम्बेड करना

NSH repository का `nsh-platform-linux` crate Rust GTK ऐप को `AppView` देता है: एक NSH engine, GTK widget के रूप में। हर `AppView` स्वतंत्र है; कई एक साथ चल सकते हैं। यह एक Rust root चलाता है, यानी आपके crate का root component:

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` root को उसका [theme](./rust.md#theme) देता है और `Root::app_id` वह id देता है जिसके अंतर्गत उसका डेटा रखा जाता है। `nsh build` द्वारा लिखा गया TSX bundle उसी व्यू में लोड होता है, जहाँ `asset_base` उसकी `assets` डायरेक्टरी पर सेट होता है:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` जो चल रहा था उसे बदल देता है; `stop` ऐप को समाप्त करता है। `asset_base` उसे बताता है कि `asset:/` URIs कहाँ resolve होते हैं (`AssetBase::Directory` या `AssetBase::Http`)। Bytecode bundles (`bundle.nshc`) `unsafe { Bundle::bytecode(bytes) }` से लोड होते हैं: QuickJS bytecode एक भरोसेमंद input है, इसलिए इसे केवल अपने ऐप की फ़ाइलों से लोड करें। स्टैंडअलोन विंडो `nsh_platform_linux::run_app(source, options)` है, `AppSource::Rust(root)` या `AppSource::Bundle(bundle)` के साथ।

`AppOptions::cache` (या `AppView::set_cache`, आगे लोड होने वाले ऐप के लिए) तय करता है कि ऐप अपने caches, [डाउनलोड की गई इमेज](./images-and-assets.md#kept-on-disk) कहाँ रखते हैं, और हर ऐप कितना रखता है (`CacheOptions`: डिफ़ॉल्ट रूप से सिस्टम की cache डायरेक्टरी और 256 MiB की इमेज)।

`AppView::set_locale(Some(locale))` और `AppView::set_font_scale(Some(scale))` ऐप को सिस्टम की भाषा और टेक्स्ट आकार की जगह आपके ऐप की भाषा और टेक्स्ट आकार देते हैं (`None` फिर से सिस्टम का अनुसरण करवाता है): `locale()`, `Intl`, `fontScale()` और टेक्स्ट तुरंत उनके अनुसार बदल जाते हैं ([Device और environment](./device-and-environment.md#in-an-embedding-app))।

`AppView::set_theme_overrides(Some(json))` आपके ऐप का brand ऐप के [theme](./tailwind.md#theme-tokens) के ऊपर लगाता है: `nsh.json` के `"theme"` के फ़ॉर्मैट में एक theme फ़ाइल, जिसके tokens light और dark मोड में ऐप के समान नाम वाले tokens पर भारी पड़ते हैं जबकि ऐप के बाकी tokens बने रहते हैं; `bg-primary` जैसी classes तुरंत नई शैली ले लेती हैं, और बाद में लोड होने वाले ऐप इसी के साथ शुरू होते हैं (`None` ऐप को उसका अपना theme वापस दे देता है; जो फ़ाइल parse नहीं होती वह error है और कुछ नहीं बदलती)।

Native components `AppView::register_component` से रजिस्टर होते हैं; [Native components](./native-components.md#registering-on-linux-rust) देखें। `set_ui_sets(sets)` वे UI sets तय करता है जो हर engine परोसता है: NSH के (`nsh_base::registry()`) और आपके crates के (`my_app::registry()`, जिसे `#[native_module]` बनाता है), इसलिए व्यू जो TSX लोड करता है वह आपके Rust components और modules भी import कर सकता है।

<a id="what-differs-on-linux"></a>

## Linux पर क्या अलग है

environment डेस्कटॉप का है: safe area और कीबोर्ड की ऊँचाई 0 हैं, `idiom()` डेस्कटॉप है (`platform.idiom` का मान `"desktop"` है), `os_version()` (`platform.version`) kernel का major और minor संस्करण है, और dark मोड डेस्कटॉप की सेटिंग का (XDG settings portal के माध्यम से) लाइव अनुसरण करता है। [Device और environment](./device-and-environment.md) देखें।

<a id="keyboard"></a>

### कीबोर्ड

| कुंजियाँ | क्रिया |
|---|---|
| Return | `Input` में वही जो `submitBehavior` कहता है: submit (`onSubmit`), submit करके फ़ील्ड छोड़ना, या नई पंक्ति (multiline inputs) |
| Shift+Return, Alt+Return | ऐसे multiline input में नई पंक्ति जिसका return submit करता है (Ctrl+Return submit करता है) |
| Tab, Shift+Tab | नवीनतम dialog के भीतर, स्क्रीन के क्रम में अगला / पिछला फ़ील्ड |
| Escape | फ़ोकस वाला फ़ील्ड छोड़ता है; नहीं तो टेक्स्ट selection हटाता है, फिर नवीनतम dialog बंद करता है या वापस जाता है |
| Alt+Left, Back key, माउस का back बटन | वापस जाना (फ़ील्ड से भी) |
| Ctrl+arrows, Home / End, Shift के साथ; Ctrl+Backspace / Delete | फ़ील्ड में शब्द और पंक्ति के हिसाब से move, select और delete करना, जैसा हर GTK ऐप में होता है |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | Undo, redo, cut, copy, paste, select all (`masked` फ़ील्ड cut और copy से मना करता है); Ctrl+A / Ctrl+C selectable टेक्स्ट को select और copy करते हैं |
| Arrows; Page Up / Down, Space, Shift+Space; Home / End | फ़ोकस वाले व्यू के आसपास या माउस के नीचे के scroll view को एक पंक्ति, एक पृष्ठ, शुरुआत / अंत तक scroll करना (जब फ़ील्ड पर फ़ोकस हो तब नहीं) |
| Ctrl+W, F11, Ctrl+Q | विंडो बंद करना, फ़ुल स्क्रीन, बाहर निकलना (`nsh package` और `nsh run` ऐप) |
| Ctrl+R | नवीनतम build फिर से लोड करता है (`nsh run`) |

ऐप के अपने shortcuts ([`keymap`](../modules/nsh.md#keymap)) विंडो-व्यापी shortcut controller हैं; Ctrl+Q और F11 को bind नहीं किया जा सकता।

Shortcuts किसी भी कीबोर्ड लेआउट के साथ काम करते हैं (Cyrillic या Greek लेआउट पर Ctrl+C वही key है जो US लेआउट पर C टाइप करती है)। input method की composition को commit करने वाला return (चीनी, जापानी, ...) कभी submit नहीं करता। `onKeyPress` वही रिपोर्ट करता है जो React Native करता है: टाइप किया गया टेक्स्ट, `"Enter"`, `"Backspace"` और `"Escape"`; paste किया गया टेक्स्ट रिपोर्ट नहीं होता।

वेब व्यू WebKitGTK पेज हैं, जो NSH के व्यू के भीतर बनाए जाते हैं: sheets, dialogs, toasts और उनके बाद के व्यू पेज के ऊपर बनते हैं, और parents उसे clip करते हैं और fade करते हैं। उनका वेबसाइट डेटा (cookies, storage, cache) हर ऐप के लिए अलग, `~/.local/share/<app id>/webkit` और `~/.cache/<app id>/webkit` के अंतर्गत रखा जाता है। `webview` capability frames के पेजों पर भी लागू होती है: जिस host की अनुमति आपके ऐप को नहीं दी गई, उसका `iframe` खाली रहता है। पेज में Escape उसे छोड़ देता है, जैसे टेक्स्ट फ़ील्ड में (जब तक पेज उसका उपयोग न करे); Alt+Left और माउस का back बटन, पेज में history होने पर, पेज में पीछे जाते हैं।

समर्थित नहीं:

- **Video `rate`**: GTK केवल सामान्य गति से चलाता है। `onEnd` केवल उन वीडियो के लिए आता है जो loop नहीं होते।
- **Zooming scroll views** (`zoomTo`, zoom props)।
- **`mixBlendMode` और `backdropFilter`** (background color फिर भी बनता है); `borderCurve: "continuous"` गोल कोने बनाता है।
- **Input accessory views** और **status bar** (डेस्कटॉप पर इनका कोई समकक्ष नहीं)।
- **Accessibility**: `accessible` grouping, custom `accessibilityActions`; इनकी जगह live regions की घोषणा की जाती है।

<a id="see-also"></a>

## यह भी देखें

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
