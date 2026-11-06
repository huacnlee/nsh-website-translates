---
title: "Linux"
description: "شغّل تطبيقات NSH المكتوبة بلغة Rust وTSX على Linux داخل نوافذ GTK 4، وقم بتغليفها، وضمّنها في تطبيق GTK باستخدام AppView، واطّلع على ما يختلف في Linux."
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

تعمل تطبيقات NSH على Linux أيضًا. تعرضها الواجهة الخلفية لـ Linux باستخدام عناصر GTK 4 وتُنسّق النصوص باستخدام Pango؛ والنواة والرسم البياني التفاعلي والمُصيِّر وتخطيط Taffy والوحدات الأصلية هي نفسها في iOS وAndroid، لذا يعمل تطبيق واحد على كل المنصات. على Linux، `os()` هو `Os::Linux` (و`platform.os` هو `"linux"` في TSX) وتسري خصائص `desktop={{…}}` في TSX. يأتي عنوان النافذة وشريط العنوان الخاص بالتطبيق وشريط القوائم وقوائم السياق من `nsh_core::element::desktop` في Rust ([أشرطة عنوان سطح المكتب](./rust.md#desktop-title-bars)) ومن [`nsh/desktop`](../modules/nsh-desktop.md) في TSX.

<a id="requirements"></a>

## المتطلبات

- **GTK 4.14** أو أحدث. لبناء مشغّل تطبيق Rust أو بيئة تشغيل NSH على Linux (من نسخة مستنسخة من المستودع، أو `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` على Debian وUbuntu (الإصدار 24.04 أو أحدث)، `gtk4 clang` على Arch، `gtk4-devel clang` على Fedora.
- **WebKitGTK 6.0** (الإصدار 2.40 أو أحدث) لعروض الويب: `libwebkitgtk-6.0-dev` على Debian وUbuntu، `webkitgtk-6.0` على Arch، `webkitgtk6.0-devel` على Fedora لبناء بيئة التشغيل. يستخدمها مضيف التطوير ومشغّل الإصدار افتراضيًا، لذا تحتاج التطبيقات المحزّمة إلى WebKitGTK 6.0 في المكان الذي تعمل فيه (`libwebkitgtk-6.0-4` على Debian وUbuntu؛ وهي متوفرة في سطح مكتب GNOME). يؤدي `cargo xtask dist` على جهاز لا تتوفر عليه ملفات التطوير الخاصة بها إلى بناء بيئة تشغيل تكون عروض الويب فيها عناصر نائبة، ولا تحتاج تطبيقاتها إلا إلى GTK.
- إضافات **GStreamer** لصيغ الفيديو التي يشغّلها تطبيقك (يشغّل GTK الفيديو عبر GStreamer).

<a id="running-an-app"></a>

## تشغيل تطبيق

على Linux، يفتح `nsh run` التطبيق في نافذة GTK. يُشغَّل تطبيق Rust من مجلده:

```sh
nsh run                        # --target linux is the default on Linux
```

يبني `nsh` مشغّلًا لأغراض التصحيح مع الحزمة (crate) الخاصة بك ويفتح التطبيق، وتظهر سجلاته (`log::info!` وغيرها) في الطرفية؛ وأي تغيير في شيفرة Rust الخاصة بالحزمة يعيد بناء المشغّل ويعيد تشغيل التطبيق. يبدأ `cargo run` الجذر نفسه من `src/main.rs` الخاص بالحزمة، الذي يكتبه `nsh init --template rust`: [`run_app`](#embedding-in-a-gtk-app) مع `AppSource::Rust`.

يحدد تطبيق TSX نقطة دخوله، ويُفتح افتراضيًا في نافذة بحجم 390×844، مع إعادة التحميل السريع (hot reload) والسجلات في الطرفية وطبقة الأخطاء كما في المنصات الأخرى:

```sh
nsh run App.tsx
```

في النسخة المستنسخة من المستودع، يبني `nsh run` مضيف التطوير (`nsh-linux-host`) أولًا؛ أما الحزمة التوزيعية المصنوعة على Linux فتتضمنه في `runtime/linux/`. يغلق Ctrl-C النافذة، وإغلاق النافذة ينهي `nsh run`. يشغّل المضيف أيضًا حزمة مبنية بمفرده:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` هو الحجم الافتراضي للنافذة (لتطبيقات TSX)؛ وقد تمنح مديرات النوافذ المُبلِّطة (tiling) النافذةَ حجمًا آخر.

<a id="packaging"></a>

## التحزيم

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

يكتب مجلدًا ونسخة منه كأرشيف:

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

يجد الملف التنفيذي `nsh/` بجواره (ويعمل أيضًا رابط رمزي إليه، في `~/.local/bin` مثلًا). يجب تثبيت GTK 4 وPango وWebKitGTK 6.0 في المكان الذي يعمل فيه التطبيق. لإظهار التطبيق في مشغّل سطح المكتب، ضع الملف التنفيذي (أو رابطًا إليه) في `PATH`، وملف `.desktop` في `~/.local/share/applications`، والأيقونة في مجلد سمة الأيقونات. يشغّل `--run` التطبيق بعد تحزيمه.

<a id="embedding-in-a-gtk-app"></a>

## التضمين في تطبيق GTK

تمنح الحزمة `nsh-platform-linux` (من مستودع NSH) تطبيق GTK المكتوب بـ Rust الكائن `AppView`: محرك NSH واحد كعنصر GTK. كل `AppView` مستقل؛ ويمكن تشغيل عدة منها في وقت واحد. يشغّل جذر Rust، أي المكوّن الجذر في حزمتك:

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

يمنح `Root::tokens` الجذرَ [سمته](./rust.md#theme) ويمنح `Root::app_id` المعرّف الذي تُحفظ بياناته تحته. تُحمَّل حزمة TSX التي كتبها `nsh build` في العرض نفسه، مع ضبط `asset_base` على مجلد `assets` الخاص بها:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

يستبدل `AppView::load` كل ما كان يعمل؛ وينهي `stop` التطبيق. يحدد `asset_base` المكان الذي تُحلّ فيه معرّفات URI من النوع `asset:/` (`AssetBase::Directory` أو `AssetBase::Http`). تُحمَّل حزم البايت كود (`bundle.nshc`) باستخدام `unsafe { Bundle::bytecode(bytes) }`: بايت كود QuickJS مُدخَل موثوق، لذا لا تحمّله إلا من ملفات تطبيقك. النافذة المستقلة هي `nsh_platform_linux::run_app(source, options)`، مع `AppSource::Rust(root)` أو `AppSource::Bundle(bundle)`.

يحدد `AppOptions::cache` (أو `AppView::set_cache`، للتطبيقات التي تُحمَّل بعده) المكان الذي تحفظ فيه التطبيقات ذاكرتها المؤقتة و[الصور التي تنزّلها](./images-and-assets.md#kept-on-disk)، وكم يحفظ كل منها (`CacheOptions`: مجلد الذاكرة المؤقتة للنظام و256 ميبيبايت من الصور افتراضيًا).

يمنح `AppView::set_locale(Some(locale))` و`AppView::set_font_scale(Some(scale))` التطبيقَ لغةَ تطبيقك وحجم نصه بدلًا من تلك الخاصة بالنظام (ويجعله `None` يتبع النظام من جديد): `locale()` و`Intl` و`fontScale()` والنص تتبع ذلك فورًا ([الجهاز والبيئة](./device-and-environment.md#in-an-embedding-app)).

يضع `AppView::set_theme_overrides(Some(json))` هوية تطبيقك البصرية فوق [سمة](./tailwind.md#theme-tokens) التطبيق: ملف سمة بتنسيق `nsh.json` الخاص بـ `"theme"`، تتغلب رموزه (tokens) على رموز التطبيق التي تحمل الأسماء نفسها في الوضعين الفاتح والداكن بينما تبقى رموز التطبيق الأخرى؛ وتُعاد تهيئة الأنماط مثل `bg-primary` فورًا، وتبدأ التطبيقات المحمَّلة لاحقًا بها (يعيد `None` إلى التطبيق سمته الخاصة؛ أما الملف الذي لا يمكن تحليله فهو خطأ ولا يغيّر شيئًا).

تُسجَّل المكوّنات الأصلية باستخدام `AppView::register_component`؛ انظر [المكوّنات الأصلية](./native-components.md#registering-on-linux-rust). يحدد `set_ui_sets(sets)` مجموعات واجهة المستخدم التي يخدمها كل محرك: مجموعات NSH (`nsh_base::registry()`) ومجموعات حزمك (`my_app::registry()`، التي ينشئها `#[native_module]`)، ولذلك فإن شيفرة TSX التي يحمّلها العرض تستورد مكوّنات Rust ووحداتها أيضًا.

<a id="what-differs-on-linux"></a>

## ما يختلف على Linux

البيئة هي بيئة سطح المكتب: المنطقة الآمنة وارتفاع لوحة المفاتيح قيمتهما 0، و`idiom()` هو سطح المكتب (`platform.idiom` هو `"desktop"`)، و`os_version()` (`platform.version`) هو رقم الإصدار الرئيسي والفرعي للنواة، ويتبع الوضع الداكن إعداد سطح المكتب مباشرةً (عبر بوابة إعدادات XDG). انظر [الجهاز والبيئة](./device-and-environment.md).

<a id="keyboard"></a>

### لوحة المفاتيح

| المفاتيح | الإجراء |
|---|---|
| Return | في `Input`، ما يحدده `submitBehavior`: الإرسال (`onSubmit`)، أو الإرسال ومغادرة الحقل، أو سطر جديد (حقول الإدخال متعددة الأسطر) |
| Shift+Return، Alt+Return | سطر جديد في حقل إدخال متعدد الأسطر يُرسل عند Return (يرسل Ctrl+Return) |
| Tab، Shift+Tab | الحقل التالي / السابق بترتيب الشاشة، ضمن أحدث مربع حوار |
| Escape | يغادر الحقل المُركَّز عليه؛ وإلا يلغي تحديد النص، ثم يغلق أحدث مربع حوار أو يرجع للخلف |
| Alt+Left، مفتاح الرجوع، زر الرجوع في الفأرة | الرجوع (حتى من داخل حقل) |
| Ctrl+الأسهم، Home / End، مع Shift؛ Ctrl+Backspace / Delete | التنقل والتحديد والحذف بالكلمة وبالسطر في الحقل، كما في كل تطبيقات GTK |
| Ctrl+Z، Ctrl+Shift+Z، Ctrl+X / C / V / A | تراجع، إعادة، قص، نسخ، لصق، تحديد الكل (يرفض حقل `masked` القص والنسخ)؛ يحدد Ctrl+A / Ctrl+C النص القابل للتحديد وينسخانه |
| الأسهم؛ Page Up / Down، Space، Shift+Space؛ Home / End | تمرير عرض التمرير حول العرض المُركَّز عليه أو تحت الفأرة بمقدار سطر، أو صفحة، أو إلى البداية / النهاية (ليس أثناء وجود التركيز على حقل) |
| Ctrl+W، F11، Ctrl+Q | إغلاق النافذة، ملء الشاشة، الخروج (تطبيقات `nsh package` و`nsh run`) |
| Ctrl+R | يعيد تحميل أحدث بناء (`nsh run`) |

اختصارات التطبيق نفسه ([`keymap`](../modules/nsh.md#keymap)) هي متحكّم اختصارات على مستوى النافذة؛ ولا يمكن ربط Ctrl+Q وF11.

تعمل الاختصارات مع أي تخطيط للوحة المفاتيح (في التخطيط السيريلي أو اليوناني، يكون Ctrl+C هو المفتاح الذي يكتب C في التخطيط الأمريكي). لا يؤدي Return الذي يثبّت تركيب طريقة إدخال (الصينية، اليابانية، ...) إلى الإرسال أبدًا. يبلّغ `onKeyPress` بما يبلّغ عنه React Native: النص المكتوب، و`"Enter"`، و`"Backspace"`، و`"Escape"`؛ أما النص الملصوق فلا يُبلَّغ عنه.

عروض الويب هي صفحات WebKitGTK مرسومة داخل عروض NSH: تُرسم الأوراق السفلية (sheets) ومربعات الحوار والإشعارات المؤقتة (toasts) والعروض التي تليها فوق الصفحة، وتقصّها العناصر الأب وتخفّف ظهورها. تُحفظ بيانات مواقعها (ملفات تعريف الارتباط والتخزين والذاكرة المؤقتة) لكل تطبيق على حدة، ضمن `~/.local/share/<app id>/webkit` و`~/.cache/<app id>/webkit`. تنطبق صلاحية `webview` أيضًا على صفحات الإطارات: يبقى `iframe` لمضيف لم يُمنح تطبيقك صلاحيته فارغًا. يغادر Escape في الصفحة الصفحةَ، كما في حقل النص (ما لم تستخدمه الصفحة)؛ ويرجع Alt+Left وزر الرجوع في الفأرة إلى الخلف داخل الصفحة ما دام لها سجل.

غير مدعوم:

- **`rate` للفيديو**: يشغّل GTK بالسرعة العادية فقط. ولا يصل `onEnd` إلا للفيديوهات التي لا تتكرر.
- **عروض التمرير القابلة للتكبير** (`zoomTo`، وخصائص التكبير).
- **`mixBlendMode` و`backdropFilter`** (يبقى لون الخلفية مرسومًا)؛ ويرسم `borderCurve: "continuous"` زوايا دائرية.
- **عروض ملحقات الإدخال (Input accessory views)** و**شريط الحالة** (لا مكافئ له على سطح المكتب).
- **إمكانية الوصول**: تجميع `accessible`، و`accessibilityActions` المخصصة؛ وتُعلَن المناطق الحية (live regions) بدلًا من ذلك.

<a id="see-also"></a>

## انظر أيضًا

- [CLI](./cli.md): `nsh run --target linux`، `nsh package --target linux`
- [التحزيم](./packaging.md)
- [الشيفرة الخاصة بكل منصة](./platform-specific.md)
