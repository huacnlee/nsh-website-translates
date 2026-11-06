---
title: "GPUI"
description: "GPUI या GPUI Kit ऐप में AppView की मदद से Rust और TSX NSH ऐप्स एम्बेड करें, जिन्हें macOS, Windows और Linux पर GPUI ड्रॉ करता है। GPUI डेवलपमेंट होस्ट में TSX ऐप्स आज़माएँ, और जानें कि GPUI बैकएंड किन बातों में अलग तरह से काम करता है।"
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---

# GPUI

GPUI बैकएंड NSH ऐप्स को [GPUI](https://gpui-kit.com) (GPUI Fast) से ड्रा करता है। यह GPU-एक्सेलरेटेड UI फ्रेमवर्क है जिस पर GPUI Kit बना है, और यह macOS, Windows और Linux तीनों पर चलता है। यह GPUI और GPUI Kit ऐप्स में एम्बेड करने के लिए बैकएंड है: `AppView` एक GPUI व्यू है, इसलिए GPUI या GPUI Kit ऐप अपने एलिमेंट ट्री में कहीं भी NSH ऐप्स दिखा सकता है, चाहे वह अपना Rust रूट हो या उसके द्वारा लोड किया गया TSX। स्टैंडअलोन ऐप्स हर डेस्कटॉप के अपने बैकएंड से चलाए और पैकेज किए जाते हैं: [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) और [Linux](./linux.md) (GTK)। कोर, रिएक्टिव ग्राफ़, रेंडरर, Taffy लेआउट और नेटिव मॉड्यूल हर दूसरे प्लेटफ़ॉर्म जैसे ही हैं, इसलिए एक ऐप हर जगह चलता है। `os()` (TSX में `platform.os`) वह OS है जिस पर ऐप चल रहा है (macOS, Windows या Linux), और TSX के `desktop={{…}}` props लागू होते हैं।

[macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) और [Linux](./linux.md) (GTK) बैकएंड के हर एलिमेंट और मॉड्यूल यहाँ उपलब्ध हैं; जहाँ GPUI कुछ अपने तरीके से ड्रा करता है, वहाँ [Differences](#differences) बताता है कि कैसे।

<a id="how-it-works"></a>

## यह कैसे काम करता है

- **हर सरफ़ेस के लिए एक एलिमेंट।** सरफ़ेस एक GPUI एलिमेंट है जो अपने पैरेंट द्वारा दी गई पूरी जगह भरता है और GPUI के प्रिमिटिव्स (क्वाड, शैडो, पाथ, ग्लिफ़ और इमेज) से पूरा व्यू ट्री पेंट करता है। NSH, Windows की तरह, हर नोड के लिए एक रिटेंड व्यू रखता है और केवल तब दोबारा ड्रा करता है जब किसी कमिट ने कुछ बदला हो।
- **टेक्स्ट इंजन थ्रेड पर शेप होता है**, GPUI के टेक्स्ट सिस्टम (ऐप के अपने फ़ॉन्ट) से, और NSH उसे लाइनों में तोड़ता है; मुख्य थ्रेड केवल ग्लिफ़ पेंट करता है।
- **हर कमिट पर एक हॉप।** इंजन अपने थ्रेड पर चलता है; हर कमिट एक क्लोज़र है जो GPUI के मुख्य थ्रेड को भेजा जाता है, और वह व्यू को सूचित करता है।
- **इनपुट** GPUI के माउस, स्क्रोल, कीबोर्ड और इनपुट मेथड इवेंट्स से आता है; हिट टेस्टिंग, प्रेस, रिस्पॉन्डर सिस्टम, स्क्रोलिंग और टेक्स्ट एडिटिंग का लॉजिक Windows बैकएंड जैसा ही है।

<a id="requirements"></a>

## आवश्यकताएँ

- macOS, Windows या Linux, ऐसे GPU के साथ जिससे GPUI ड्रा कर सके (macOS पर Metal, Windows पर DirectX, Linux पर Vulkan)।
- macOS पर, चेकआउट से अपना GPUI ऐप या रनटाइम बनाने के लिए Xcode के Metal Toolchain की ज़रूरत होती है (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` रनटाइम को GPUI के `runtime-shaders` फ़ीचर के साथ बनाता है और यह बताता है: शेडर ऐप शुरू होने पर कंपाइल होते हैं (पहली बार सेकंड का एक अंश, उसके बाद macOS उन्हें कैश कर लेता है)।
- Linux पर: Vulkan ड्राइवर, `libxkbcommon` के साथ Wayland या X11, GTK 3 और WebKitGTK 4.1 (वेब व्यू के लिए), और GStreamer 1.20 या बाद का संस्करण उसके base और good प्लग-इन्स के साथ (वीडियो के लिए)। वेब व्यू को X11 चाहिए: Wayland डेस्कटॉप पर ऐप को Xwayland के अंतर्गत चलाएँ (`WAYLAND_DISPLAY=` खाली), नहीं तो वे प्लेसहोल्डर दिखाते हैं। चेकआउट से रनटाइम बनाने के लिए डेवलपमेंट पैकेज भी चाहिए; Debian और Ubuntu पर:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## ऐप चलाना

Rust ऐप आपके GPUI ऐप के भीतर चलता है: उसका रूट `AppView` से एम्बेड करें ([Embedding in a GPUI app](#embedding-in-a-gpui-app)) और GPUI ऐप को `cargo run` करें; आपका क्रेट और ऐप एक ही Cargo बिल्ड हैं। अकेले चलाने पर, Rust ऐप इस OS के अपने बैकएंड (`nsh run --target macos`, `windows` या `linux`) पर चलता है।

TSX ऐप GPUI डेवलपमेंट होस्ट में चलता है:

```sh
nsh run App.tsx --target gpui
```

यह ऐप को GPUI विंडो (डिफ़ॉल्ट रूप से 1200×800) में खोलता है, ठीक वैसे ही जैसे उसे एम्बेड करने वाला GPUI ऐप दिखाता है, और हॉट रीलोड, टर्मिनल में लॉग तथा एरर ओवरले अन्य टार्गेट्स की तरह ही मिलते हैं। डेवलपमेंट होस्ट (`nsh-gpui-host`) हर OS पर बिना ऐप बंडल के सीधे चलता है। चेकआउट में `nsh run` इसे पहले बनाता है; डिस्ट्रीब्यूशन इसे `runtime/gpui/` में भेजता है। होस्ट बिल्ट बंडल को भी अपने आप चला सकता है:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` विंडो का आकार पॉइंट्स में है (`<width>x<height>`)।

<a id="packaging"></a>

## पैकेजिंग

GPUI ऐप NSH को अपने ही एक्ज़ीक्यूटेबल के भीतर भेजता है: वह ऐप का Rust रूट या TSX बंडल `AppView` से एम्बेड करता है ([Embedding in a GPUI app](#embedding-in-a-gpui-app)) और उसी तरह बनाया व वितरित किया जाता है जैसे कोई GPUI ऐप। स्टैंडअलोन NSH ऐप इस OS के अपने टार्गेट से पैकेज होता है: [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) या [`--target linux`](./linux.md#packaging) ([Packaging](./packaging.md))।

Linux पर, वेब व्यू और वीडियो वाला GPUI ऐप WebKitGTK 4.1 और GStreamer को डायनामिक रूप से लिंक करता है, इसलिए जिन मशीनों पर वह चलेगा उन पर ये इंस्टॉल होने चाहिए, साथ में GTK 3 और GStreamer के base और good प्लग-इन्स (Debian / Ubuntu: `libwebkit2gtk-4.1-0`, `libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), और इनके अलावा Vulkan ड्राइवर तथा `libxkbcommon`।

<a id="embedding-in-a-gpui-app"></a>

## GPUI ऐप में एम्बेड करना

`nsh-platform-gpui` क्रेट (NSH रिपॉज़िटरी से) Rust GPUI ऐप को `AppView` देता है: एक NSH इंजन, GPUI व्यू (`Entity<AppView>`) के रूप में, जो अपने पैरेंट एलिमेंट द्वारा दी गई जगह भरता है। हर `AppView` स्वतंत्र है; कई एक साथ चल सकते हैं। यह Rust रूट चलाता है, यानी आपके क्रेट का रूट कंपोनेंट:

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` रूट को उसकी [theme](./rust.md#theme) देता है (`nsh_base::Theme::from_json(json)?.into_tokens()`, `Theme` यहाँ री-एक्सपोर्ट किया गया है) और `Root::app_id` वह id देता है जिसके अंतर्गत उसका डेटा रखा जाता है। `nsh build` द्वारा लिखा गया TSX बंडल उसी व्यू में लोड होता है:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

एंटिटी को अपने एलिमेंट ट्री में किसी भी दूसरे व्यू की तरह रखें (GPUI Kit का `Root`, पैनल, डॉक)। `AppView::load` जो कुछ चल रहा था उसे बदल देता है; `stop` (या व्यू को ड्रॉप करना) ऐप को समाप्त कर देता है। `AppOptions::asset_base` बताता है कि `asset:/` URI कहाँ रिज़ॉल्व होते हैं (`AssetBase::Directory` या `AssetBase::Http`)। बायटकोड बंडल (`bundle.nshc`) `unsafe { Bundle::bytecode(bytes) }` (या `Bundle::read_trusted(path)`, यह भी unsafe) से लोड होते हैं: QuickJS बायटकोड भरोसेमंद इनपुट है, इसलिए उसे केवल अपने ऐप की फ़ाइलों से ही लोड करें।

- `open_app_window(source, options, cx)` चल रहे GPUI ऐप में एक `AppView` के साथ विंडो खोलता है।
- `run_app(source, options)` GPUI शुरू करता है और एक ऐप को विंडो में तब तक चलाता है जब तक वह बंद न हो (डेवलपमेंट होस्ट यही करता है)।
- `AppView::register_component(name, factory)` लोड करने से पहले आपका नेटिव कंपोनेंट रजिस्टर करता है ([Native components](./native-components.md))।
- `AppOptions::cache` (या `AppView::set_cache`, अगले लोड होने वाले ऐप्स के लिए) तय करता है कि ऐप्स अपने कैश, [डाउनलोड की गई इमेज](./images-and-assets.md#kept-on-disk) कहाँ रखें और हर एक कितना रखे: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB), `MaxSize(ByteSize::mib(n))` या `Off`।
- `AppView::host()` व्यू का अपने चलाए जा रहे ऐप्स के साथ चैनल है ([`host`](../modules/nsh.md#host)), एक `HostChannel` जिसे कोई भी थ्रेड इस्तेमाल कर सकता है: लोड करने से पहले `set_params(map)` ऐप को उसके लॉन्च पैरामीटर (`host.params`) देता है, `send(name, data)` एक इवेंट (`host.on`) भेजता है, और `handle(name, |call| …)` उसके `host.call(name, data)` का जवाब देता है और उसके `host.post` को सुनता है (`call.resolve(json)`, `call.reject(message)`, तुरंत या बाद में किसी भी थ्रेड से)। हैंडलर इंजन थ्रेड पर चलते हैं: कॉल को अपनी GPUI एंटिटीज़ को सौंपें (ऐसा चैनल जिसे कोई `cx.spawn` टास्क पढ़ता है) और वहीं से जवाब दें। macOS, Windows और Linux के `AppView` में वही `host()` है। इसका `handle_open_url(|request| …)` ऐप द्वारा खोले गए URL ([`openUrl`](../modules/nsh.md#openurl)) सिस्टम से पहले देखता है: `request.handled()` जब आपके ऐप ने URL खुद रूट किया हो, `request.decline()` (या रिक्वेस्ट को ड्रॉप करना) ताकि सिस्टम उसे GPUI के `open_url` से खोले।
- `AppOptions::limits` (या `AppView::set_limits`, अगले लोड होने वाले ऐप्स के लिए) VM की सीमाएँ तय करता है: JS हीप, स्टैक, टाइम बजट और नोड कोटा ([Sandbox and capabilities](./sandbox-and-capabilities.md))। एम्बेडेड ऐप्स को `Limits::default()` मिलता है (256 MB हीप); डेवलपमेंट होस्ट ऐप्स को अपने आप चलाता है, `Limits::standalone()` के साथ।
- `AppOptions::transparent` व्यू को पारदर्शी बनाता है: यह कोई विंडो बैकग्राउंड नहीं बनाता, और `open_app_window` / `run_app` पारदर्शी विंडो खोलते हैं, ताकि ऐप जो हिस्सा बिना पेंट छोड़े, उसमें विंडो के पीछे का दृश्य दिखे (डेस्कटॉप विजेट, ओवरले)। डिफ़ॉल्ट रूप से false।
- `AppView::connect_dev_server(url, cx)` (फ़ीचर `dev`) ऐप को `nsh dev` से लोड करता है और आपके एडिट करते ही उसे रीलोड करता है, व्यू के ऊपर एरर ओवरले के साथ; `AppView::on_error` ऐप की त्रुटियाँ सुनता रहता है।
- `AppView::on_app_error(|error| …)` ऐप की त्रुटियाँ सुनता है: `error.kind` (ऐप लोड नहीं हो सका, कोई uncaught exception, VM रुक गया), `error.is_fatal()` जब ऐप का कोई JS दोबारा नहीं चलता, `error.message`, `error.stack` और `error.package` (उस साइन्ड पैकेज का id और बिल्ड जिससे वह आया)। `AppView::on_error` वही त्रुटियाँ टेक्स्ट के रूप में पाता है।
- `AppView::set_locale(locale, cx)` और `AppView::set_font_scale(scale, cx)` ऐप को सिस्टम की जगह आपके ऐप की भाषा और टेक्स्ट साइज़ देते हैं (`None` फिर से सिस्टम का अनुसरण करता है): `locale()`, `Intl`, `fontScale()` और टेक्स्ट तुरंत बदल जाते हैं ([Device and environment](./device-and-environment.md#in-an-embedding-app))।
- `AppView::run_package(&package)` `verify_package` या `load_package` से [signed package](./signed-packages.md#loading-packages-in-a-host-app) चलाता है; `accept_package` तब उसे दर्ज करता है जब आपके ऐप ने तय कर लिया हो कि वह स्वस्थ है।
- `set_ui_sets(sets)` वे UI सेट तय करता है जो हर इंजन सर्व करता है: NSH के (`nsh_base::registry()`) और आपके क्रेट्स के (`my_app::registry()`, जिन्हें `#[native_module]` बनाता है; [Building with Rust](./rust.md)), और आपके ऐप के अपने सेट देता है: ऐप किसी सेट के फ़ंक्शन और क्लास नाम से [`nativeModule`](../modules/nsh.md#nativemodule) के ज़रिए पाता है और स्टॉक `nsh build` से बनता है। रिपॉज़िटरी का `examples/embed-gpui` इसी तरह होस्ट में एक ट्रेडिंग डेस्क रखता है, जिसे दो एम्बेडेड ऑर्डर टिकट और होस्ट के अपने विजेट साझा करते हैं।

## Differences

नेटिव डेस्कटॉप बैकएंड्स की तुलना में जो अलग ड्रा होता है या अलग व्यवहार करता है:

- **Transforms**: रोटेट, स्क्यू और प्रोजेक्ट किए गए व्यू अपने बैकग्राउंड, बॉर्डर और शैडो घुमाते हैं, लेकिन टेक्स्ट सीधा रहता है, और इमेज, वीडियो और कैनवास अपनी सीमाओं (bounds) में ड्रा होते हैं।
- **Opacity** हर रंग पर लागू होती है, ग्रुप पर नहीं, इसलिए किसी पारभासी व्यू के ओवरलैप करते चाइल्ड एक-दूसरे के आर-पार दिखते हैं; इमेज की opacity (फ़ेड-इन, पारभासी व्यू) सोलहवें हिस्सों में बदलती है।
- **Rounded clips** (`overflow: "hidden"` रेडियस के साथ) चाइल्ड के बैकग्राउंड और इमेज को गोल करते हैं, लेकिन टेक्स्ट, बॉर्डर, वीडियो और नेटिव कंपोनेंट आयत से कटते हैं।
- **ड्रा नहीं होते**: `filter: blur()`, `backdropFilter` और `mixBlendMode`; शैडो पारभासी फ़िल के आर-पार दिखते हैं; `borderCurve: "continuous"` गोलाकार कोने बनाता है।
- **Canvas text** अनुमानित है: रोटेशन में सीधा रहता है, `maxWidth` के लिए पतला करने के बजाय छोटा किया जाता है, ग्रेडिएंट उसे एक ही रंग में पेंट करते हैं, `strokeText` फ़िल, उसके शैडो ब्लर नहीं होते, और कंपोज़िट ऑपरेशन तथा `clearRect` उस पर लागू नहीं होते।
- **Scroll views** ज़ूम नहीं करते (`zoomTo` और ज़ूम props अनदेखे किए जाते हैं)।
- **Video** Linux पर चलता है (GStreamer); macOS और Windows पर वीडियो प्लेसहोल्डर दिखाता है और `onError` रिपोर्ट करता है।
- **Web views** नेटिव व्यू हैं जो अपनी जगह पर NSH द्वारा ड्रा की गई हर चीज़ के ऊपर रहते हैं। Linux पर उन्हें X11 चाहिए ([Requirements](#requirements) देखें); जहाँ Xwayland के अंतर्गत पेज काले रहते हैं (लॉग में "Failed to create GBM buffer"), ऐप को `WEBKIT_DISABLE_DMABUF_RENDERER=1` के साथ चलाएँ। macOS और Windows पर क्लिपिंग करने वाले ancestor उन्हें नहीं काटते और विफल लोड कोई `onError` रिपोर्ट नहीं करते। `baseUrl`, `scrollable` और `allowsBackForwardNavigationGestures` समर्थित नहीं हैं।
- **Accessibility** AccessKit से होकर जाती है: स्क्रीन रीडर हर जगह एलिमेंट को सक्रिय कर सकते हैं, फ़ोकस कर सकते हैं, मान सेट कर सकते हैं और व्यू में स्क्रोल कर सकते हैं; कस्टम एक्शन और कॉन्टेक्स्ट-मेन्यू एक्शन अभी आगे नहीं भेजे जाते।

तुलना के लिए, हर नेटिव बैकएंड की अपनी सूची: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux)।

<a id="see-also"></a>

## यह भी देखें

- [Building with Rust](./rust.md): वह क्रेट जिसका रूट GPUI ऐप एम्बेड करता है
- [CLI](./cli.md): `nsh run --target gpui`
- [Packaging](./packaging.md): स्टैंडअलोन ऐप्स, हर OS के अपने टार्गेट के साथ
- [Platform overview](./platforms.md)
