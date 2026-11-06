---
title: "Windows"
description: "شغّل تطبيقات NSH المكتوبة بـ Rust وTSX على Windows داخل نوافذ Win32 مرسومة باستخدام Direct2D، وقم بتغليفها، وضمّنها في تطبيق Win32 باستخدام AppView، وتعرّف على ما يختلف في Windows."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

تعمل تطبيقات NSH على Windows أيضًا. تعرضها الواجهة الخلفية لـ Windows داخل نوافذ Win32 باستخدام Direct2D، وتنسّق النصوص باستخدام DirectWrite. أما النواة والرسم البياني التفاعلي (reactive graph) والمُصيِّر (renderer) وتخطيط Taffy والوحدات الأصلية فهي نفسها كما في iOS وAndroid، لذا يعمل تطبيق واحد على كل المنصات. على Windows، `os()` هو `Os::Windows` (و`platform.os` هو `"windows"` في TSX) وتسري خصائص `desktop={{…}}` في TSX. يأتي عنوان النافذة وشريط العنوان الخاص بالتطبيق وشريط القوائم والقوائم السياقية من `nsh_core::element::desktop` في Rust ([أشرطة العنوان في سطح المكتب](./rust.md#desktop-title-bars)) ومن [`nsh/desktop`](../modules/nsh-desktop.md) في TSX.

<a id="requirements"></a>

## المتطلبات

- **Windows 10 الإصدار 1809** أو أحدث، أو Windows 11.
- **WebView2 Runtime** لعروض الويب. يأتي مع Windows 11 ومع Microsoft Edge على Windows 10؛ وبدونه يعرض `WebView` عنصرًا نائبًا.
- **ترميزات Media Foundation** لصيغ الفيديو التي يشغّلها تطبيقك (يُشغَّل الفيديو عبر حزمة الوسائط الخاصة بـ Windows).
- لبناء مُشغِّل (runner) تطبيق Rust: Visual Studio Build Tools مع حِمل C++ وWindows SDK. ولبناء بيئة تشغيل NSH على Windows (من نسخة مستنسخة، أو `cargo xtask dist` على Windows) يلزم أيضًا LLVM (لربط QuickJS).

<a id="running-an-app"></a>

## تشغيل تطبيق

على Windows، يفتح `nsh run` التطبيق في نافذة. يعمل تطبيق Rust من مجلده:

```sh
nsh run                        # --target windows is the default on Windows
```

يبني `nsh` مُشغِّلًا للتصحيح (debug) مع الـ crate الخاص بك ويفتح التطبيق، مع سجلاته (`log::info!` وغيره) في الطرفية؛ وأي تغيير في شيفرة Rust الخاصة بالـ crate يعيد بناء المُشغِّل ويعيد تشغيل التطبيق. يبدأ `cargo run` الجذر نفسه من `src/main.rs` الخاص بالـ crate، والذي يكتبه `nsh init --template rust`: [`run_app`](#embedding-in-a-win32-app) مع `AppSource::Rust`.

يحدد تطبيق TSX نقطة دخوله، ويُفتح افتراضيًا في نافذة بحجم 1200×800، مع إعادة التحميل الفوري (hot reload) والسجلات في الطرفية وطبقة الأخطاء كما في المنصات الأخرى:

```sh
nsh run App.tsx
```

في النسخة المستنسخة، يبني `nsh run` أولًا مضيف التطوير (`nsh-windows-host.exe`)؛ أما التوزيعة المُنشأة على Windows فتشحنه في `runtime\windows\`. يغلق Ctrl-C النافذة، وإغلاق النافذة ينهي `nsh run`؛ ولا يبقى المضيف حيًّا بعد `nsh` مهما كانت طريقة انتهائه. يشغّل المضيف أيضًا حزمة مبنية بمفرده:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` هو حجم النافذة بالنقاط (`<width>x<height>`؛ لتطبيقات TSX).

<a id="performance-monitor"></a>

### مراقب الأداء

يسجّل `--fps` (`nsh run App.tsx --target windows --fps`، `nsh test --target windows --fps`، أو `--fps` الخاص بالمضيف، أو `AppOptions { fps: true, .. }` في `run_app` الخاص بتطبيق Rust) قراءات مراقب الأداء مرة كل ثانية (الهدف `nsh::perf`): الإطارات المعروضة نسبةً إلى معدل تحديث الشاشة، وزمن الخيط الرئيسي لكل إطار ومراحله (`tick`، `drain`، `paint`، `present`، `canvas`)، وعمليات الإيداع (commits) في المحرك، والمعالج والذاكرة، بالصيغة نفسها التي تسجّلها أنظمة سطح المكتب الأخرى (الميلي ثانية بصيغة mean/p50/p95/max). يعرضها `nsh test --fps -v` ويقرؤها `examples/gallery/tools/perf.py` ([تقرير الأداء](./performance-report.md#windows-win32-direct2d)). قِس الأداء على إصدارات release؛ فالمراقب لا يكلّف شيئًا حين يكون متوقفًا.

<a id="packaging"></a>

## التغليف

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

يكتب مجلدًا ونسخة منه كأرشيف:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

يجد الملف التنفيذي `nsh\` بجانبه؛ انسخ المجلد كاملًا (أو فُكَّ ضغط `.zip`) إلى أي مكان يجب أن يعيش فيه التطبيق: لا يُثبَّت شيء. تُضمَّن الأيقونة من `nsh.json` في الملف التنفيذي (يعرضها Explorer وشريط المهام) دون أي أدوات إضافية؛ أما التغليف على نظام آخر فيُبقي الأيقونة الافتراضية. يجمع معرّف التطبيق (app id) نوافذ التطبيق معًا في شريط المهام. يشغّل `--run` التطبيق بعد تغليفه. الملف التنفيذي غير موقَّع: وقّعه بشهادتك الخاصة (`signtool`) لتوزيعه.

<a id="embedding-in-a-win32-app"></a>

## التضمين في تطبيق Win32

توفّر الحزمة `nsh-platform-windows` (من مستودع NSH) لتطبيق Win32 مكتوب بـ Rust الكائن `AppView`: محرك NSH واحد داخل نافذة فرعية لإحدى نوافذك. كل `AppView` مستقل؛ ويمكن تشغيل عدة منها معًا. يشغّل جذر Rust، أي المكوّن الجذر في الـ crate الخاص بك:

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

تُحمَّل حزمة TSX التي كتبها `nsh build` في العرض نفسه، مع ضبط `asset_base` على مجلد `assets` الخاص بها:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

العرض نافذة فرعية: تديره حلقة الرسائل لديك، وتضعه باستخدام `MoveWindow` على `hwnd()` الخاص به عند تغيير حجم النافذة الأم. أنشئه على خيط النافذة التي يوجد فيها: تتبع دورة حياته النافذةَ العليا لتلك النافذة، أي التي أُنشئ تحتها. يستبدل `AppView::load` كل ما كان يعمل؛ وينهي `stop` (أو تدمير النافذة) التطبيق. يخبره `asset_base` أين تُحلّ عناوين `asset:/` (`AssetBase::Directory` أو `AssetBase::Http`). تُحمَّل حزم الشيفرة البايتية (`bundle.nshc`) باستخدام `unsafe { Bundle::bytecode(bytes) }` (أو `Bundle::read_trusted(path)`، وهي unsafe أيضًا): شيفرة QuickJS البايتية مُدخَل موثوق، لذا لا تحمّلها إلا من ملفات تطبيقك أنت. النافذة المستقلة هي `nsh_platform_windows::run_app(source, options)`، مع `AppSource::Rust(root)` أو `AppSource::Bundle(bundle)`. يمنح `Root::tokens` الجذرَ [سمته](./rust.md#theme) ويمنح `Root::app_id` المعرّفَ الذي تُحفظ بياناته تحته.

يحدد `AppOptions::cache` (أو `AppView::set_cache`، للتطبيقات التي تُحمَّل بعده) المكان الذي تحفظ فيه التطبيقات مخزناتها المؤقتة، و[الصور التي تنزّلها](./images-and-assets.md#kept-on-disk)، وكم يحتفظ به كل منها (`CacheOptions`: افتراضيًا مجلد المخزن المؤقت للنظام و256 MiB من الصور).

يمنح `AppView::set_locale(Some(locale))` و`AppView::set_font_scale(Some(scale))` التطبيقَ لغةَ تطبيقك وحجمَ نصه بدلًا من إعدادات النظام (يعيده `None` إلى اتباع النظام): تتبع `locale()` و`Intl` و`fontScale()` والنص التغيير فورًا ([الجهاز والبيئة](./device-and-environment.md#in-an-embedding-app)).

يضع `AppView::set_theme_overrides(Some(json))` علامة تطبيقك التجارية فوق [سمة](./tailwind.md#theme-tokens) التطبيق: ملف سمة بصيغة `"theme"` الخاص بـ `nsh.json`، تتغلب رموزه (tokens) على رموز التطبيق التي تحمل الأسماء نفسها في الوضعين الفاتح والداكن بينما تبقى رموز التطبيق الأخرى؛ وتُعاد تهيئة أنماط الفئات مثل `bg-primary` فورًا، وتبدأ التطبيقات التي تُحمَّل لاحقًا به (يعيد `None` إلى التطبيق سمته الخاصة؛ وأي ملف لا يمكن تحليله يُعدّ خطأ ولا يغيّر شيئًا).

تُسجَّل المكونات الأصلية باستخدام `AppView::register_component`؛ راجع [المكونات الأصلية](./native-components.md#registering-on-windows-rust). يحدد `set_ui_sets(sets)` مجموعات واجهة المستخدم التي يخدمها كل محرك: مجموعات NSH (`nsh_base::registry()`) ومجموعات الـ crates الخاصة بك (`my_app::registry()`، والتي ينشئها `#[native_module]`)، فتستورد شيفرة TSX التي يحمّلها العرض مكوّنات Rust ووحداتها أيضًا.

<a id="what-differs-on-windows"></a>

## ما يختلف على Windows

البيئة هي بيئة سطح مكتب: المنطقة الآمنة وارتفاع لوحة المفاتيح يساويان 0، و`idiom()` هو سطح المكتب (`platform.idiom` هو `"desktop"`) و`os_version()` (`platform.version`) هو `"10.0"` (وعلى Windows 11 أيضًا: فقد أبقى Windows رقم الإصدار). يتبع الوضع الداكن الإعدادات > التخصيص > الألوان مباشرةً، ويتبع `fontScale()` إعداد حجم النص، ويتبع تقليل الحركة إعداد تأثيرات الرسوم المتحركة، وتتبع اللغة (locale) التنسيق الإقليمي للمستخدم. راجع [الجهاز والبيئة](./device-and-environment.md).

يتبع نمط `cursor` التحديثات بينما يستقر الماوس فوق عرض. وعندما تغيّر دفعة من التحديثات المؤشر، يطبّق Windows الشكل الجديد أو `"none"` بعد انتهاء الدفعة كاملة، باستخدام العرض الموجود تحت المؤشر. أما شريط العنوان وحدود تغيير الحجم فتحتفظ بمؤشرات النظام الخاصة بها.

<a id="keyboard"></a>

### لوحة المفاتيح

| المفاتيح | الإجراء |
|---|---|
| Return | في `Input`، ما يقوله `submitBehavior`: إرسال (`onSubmit`)، أو إرسال ومغادرة الحقل، أو سطر جديد (للحقول متعددة الأسطر) |
| Shift+Return، Alt+Return | سطر جديد في حقل متعدد الأسطر يرسل بمفتاح Return (يرسل Ctrl+Return) |
| Tab، Shift+Tab | حقل النص التالي / السابق، ضمن أحدث مربع حوار؛ ويُحدَّد نص الحقل، كما في مربعات حوار Windows |
| Escape | يغادر الحقل الذي عليه التركيز؛ وإلا يمسح تحديد النص، ثم يغلق أحدث مربع حوار أو يرجع للخلف |
| Alt+Left، مفتاح الرجوع في المتصفح، زر الرجوع في الماوس | الرجوع للخلف (من الحقل أيضًا) |
| Ctrl+الأسهم، Home / End، Ctrl+Home / End، مع Shift؛ Ctrl+Backspace / Delete | التحريك والتحديد والحذف بالكلمة وبالسطر في الحقل، كما في كل تطبيق Windows |
| Ctrl+Z، Ctrl+Y، Ctrl+X / C / V / A؛ Shift+Delete، Ctrl+Insert، Shift+Insert | تراجع، إعادة، قص، نسخ، لصق، تحديد الكل (يرفض حقل `masked` القص والنسخ)؛ ويحدد Ctrl+A / Ctrl+C النص القابل للتحديد وينسخانه |
| الأسهم؛ Page Up / Down، Space، Shift+Space؛ Home / End، Ctrl+Home / End | تمرير عرض التمرير المحيط بالعرض الذي عليه التركيز أو الموجود تحت الماوس بمقدار سطر، أو صفحة، أو إلى البداية / النهاية (لا يعمل أثناء تركيز حقل) |
| F11، Alt+F4 | ملء الشاشة، إغلاق النافذة (لتطبيقات `nsh package` و`nsh run`) |
| Ctrl+R، F5 | إعادة تحميل أحدث بناء (`nsh run`) |

تعمل الاختصارات مع أي تخطيط لوحة مفاتيح (في التخطيط السيريلي أو اليوناني، يكون Ctrl+C هو المفتاح الذي يكتب C في التخطيط الأمريكي). ولا يرسل مفتاح Return الذي يثبّت تركيب طريقة إدخال (الصينية، اليابانية، ...) أي إرسال أبدًا. يبلّغ `onKeyPress` بما يبلّغ عنه React Native: النص المكتوب، و`"Enter"`، و`"Backspace"`، و`"Escape"`؛ أما النص الملصوق فلا يُبلَّغ عنه.

تأتي اختصارات التطبيق نفسه ([`keymap`](../modules/nsh.md#keymap)) قبل مفاتيح الحقل الذي عليه التركيز والتنقل والتمرير؛ ولا يمكن ربط Alt+F4 وF11 وCtrl+Q.

مختلف، أو غير مدعوم:

- **`WebView`**: لا تُعرض الصفحة داخل عرض ذي تحويل ثلاثي الأبعاد (منظور)، ولا يُضبِّب `backdropFilter` فوق صفحة محتواها. يقبل `baseUrl` عناوين `http(s)`. يبقى المكوّن الأصلي الذي يأتي بنافذة خاصة به فوق كل ما ترسمه NSH.
- **الفيديو**: الصيغ التي تفكّ ترميزها الترميزات المثبتة؛ بلا صورة غلاف؛ ويظهر شريط التحكم دائمًا مع `controls`.
- **عروض التمرير القابلة للتكبير** (`zoomTo`، وخصائص التكبير)؛ ولا يمكن سحب مؤشر التمرير.
- **`mixBlendMode` و`backdropFilter`** تُرسمان، ولكن ليس داخل عرض له `filter` أو تحويل ثلاثي الأبعاد؛ ويرسم `borderCurve: "continuous"` زوايا دائرية.
- **النص**: الحذف بالنقاط (ellipsis) في الرأس والوسط على سطر واحد فقط (وما زاد على سطر يحصل على حذف في الذيل)؛ إيموجي ملوّن من خطوط COLR فقط؛ والأحرف الاستهلالية الصغيرة (small caps) فقط حيث يدعمها الخط.
- **حقول إدخال النص**: لا تنطبق أنواع لوحة المفاتيح والملء التلقائي (إذ لا توجد لوحة مفاتيح برمجية)؛ ويتنقل Tab بين حقول النص. يفتح النقر بالزر الأيمن قائمة التحرير (تراجع، قص، نسخ، لصق، حذف، تحديد الكل)، كما في النص القابل للتحديد (نسخ، تحديد الكل).
- **إمكانية الوصول** (UI Automation): لا تُكشف مربعات حوار التنبيه والتنبيهات المنبثقة (toasts)؛ وتُبلَّغ العناوين بالمستوى 1.
- **عروض ملحقات الإدخال** و**شريط الحالة** (لا مكافئ لهما في سطح المكتب).

<a id="see-also"></a>

## انظر أيضًا

- [CLI](./cli.md): `nsh run --target windows`، `nsh package --target windows`
- [التغليف](./packaging.md)
- [الشيفرة الخاصة بكل منصة](./platform-specific.md)
