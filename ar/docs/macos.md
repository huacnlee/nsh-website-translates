---
title: "macOS"
description: "شغّل تطبيقات NSH المكتوبة بـ Rust وTSX على macOS داخل نوافذ AppKit، وقم بتغليفها كحزم .app، وضمّنها في تطبيق Mac باستخدام AppView، وتعرّف على ما يختلف على macOS."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

تعمل تطبيقات NSH أيضًا كتطبيقات Mac أصلية. تعرضها واجهة macOS الخلفية باستخدام عروض AppKit وCore Animation، وتضبط تخطيط النص باستخدام CoreText؛ أما النواة والرسم البياني التفاعلي والمُصيِّر وتخطيط Taffy والوحدات الأصلية فهي نفسها على iOS وAndroid، ولذلك يعمل التطبيق الواحد في كل مكان. على macOS، `os()` هو `Os::MacOs` (و`platform.os` هو `"macos"` في TSX) وتنطبق خصائص `desktop={{…}}` في TSX. يأتي عنوان النافذة وشريط عنوان خاص بالتطبيق وشريط القوائم والقوائم السياقية من `nsh_core::element::desktop` في Rust ([Desktop title bars](./rust.md#desktop-title-bars)) ومن [`nsh/desktop`](../modules/nsh-desktop.md) في TSX.

تتصرف واجهة macOS الخلفية كتطبيق سطح مكتب: إدخال بالماوس ولوحة التتبع ولوحة المفاتيح، ونوافذ قابلة لتغيير الحجم، وحوارات فوق النافذة، وشريط قوائم.

<a id="requirements"></a>

## المتطلبات

- **macOS 14** أو أحدث، حيث يعمل التطبيق.
- أدوات سطر الأوامر في Xcode (`xcode-select --install`)، لبناء مشغِّلات تطبيقات Rust ووقت تشغيل NSH لنظام macOS من نسخة مستنسخة من المستودع، ولحزم التطبيقات (`codesign`، `sips`). تتضمن النسخة الموزَّعة التي تُنشأ باستخدام `cargo xtask dist` على جهاز Mac وقت تشغيل تطبيقات TSX في `runtime/macos/`.

<a id="running-an-app"></a>

## تشغيل تطبيق

يُشغَّل تطبيق Rust من مجلده:

```sh
nsh run --target macos         # the default on a Mac
```

يبني `nsh` مشغِّلًا لأغراض التنقيح مع الـ crate الخاص بك ويفتح التطبيق في نافذة، مع سجلاته (`log::info!` وغيره) في الطرفية؛ وأي تغيير في شيفرة Rust الخاصة بالـ crate يعيد بناء المشغِّل ويعيد تشغيل التطبيق. يبدأ `cargo run` الجذر نفسه من `src/main.rs` الخاص بالـ crate، والذي يكتبه `nsh init --template rust`: [`run_app`](#embedding-in-a-mac-app) مع `AppSource::Rust`.

يحدد تطبيق TSX نقطة دخوله:

```sh
nsh run App.tsx --target macos
```

يُفتح التطبيق في نافذة AppKit (بحجم 1200×800 افتراضيًا)، مع إعادة تحميل فورية، وسجلات في الطرفية، وطبقة الأخطاء كما في الأهداف الأخرى؛ ويعيد Cmd+R تحميل أحدث بناء. يعرض شريط القوائم والنافذة اسم التطبيق (`"name"` في nsh.json، وإلا اسم مجلده). في النسخة المستنسخة من المستودع، يبني `nsh run` مضيف التطوير (`nsh-macos-host`) أولًا. يؤدي إيقاف `nsh run` إلى إغلاق النافذة، ويؤدي إغلاق النافذة إلى إنهاء `nsh run`. يشغِّل المضيف أيضًا حزمة مبنية بمفرده:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` هو الحجم الأولي للنافذة (لتطبيقات TSX)؛ ويمكن تغيير حجم النافذة. `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` هي الشاشة الرئيسية، أي التي عليها شريط القوائم.

يشغِّل `nsh test --target macos` اختبارات تطبيق TSX في نوافذ macOS، على شاشة ثانوية إن وجدت (تبقى الشاشة الرئيسية لك؛ ويختار `--display <n>` شاشة أخرى): يحصل كل تطبيق يفتحه الاختبار على نافذة خاصة به، بالحجم الذي يطلبه الاختبار حتى على شاشة أقصر منه، وتنقر الخطوات وتكتب وتمرر بإدخال النظام على العروض التي تسميها محدداتها ([Testing](./testing-and-trace.md#on-a-real-platform)).

<a id="performance-monitor"></a>

### مراقب الأداء

يعرض `--fps` (`AppOptions { fps: true, .. }` في `run_app` الخاص بتطبيق Rust، أو `AppView::set_fps_monitor(true)` عند التضمين، أو `nsh run App.tsx --target macos --fps`، أو `--fps` الخاص بالمضيف، أو `open -a MyApp --args --fps` الخاص بتطبيق TSX مُحزَّم) لوحة في أعلى يمين التطبيق تتحدث مرتين في الثانية:

| الصف | ما يقيسه |
|---|---|
| `FPS` | الإطارات المعروضة خلال الثانية الأخيرة: دورات تحديث الشاشة التي تغيّر فيها التطبيق (التطبيق الخامل يعطي قراءة منخفضة؛ وهذا لا يعني بطئًا). `max` هو ما استطاع الخيط الرئيسي مواكبته، ثم معدل الشاشة (120 Hz على شاشات ProMotion). |
| `TICK` | الفجوات بين دورات تحديث الشاشة كما وصلت (المتوسط، p95) و`gap`، أي فجوة p95 بين الإطارات المعروضة: دورة تحديث واحدة (8.3 ms عند 120 Hz) حين لا يتأخر شيء. |
| `MAIN` | زمن الخيط الرئيسي لكل إطار (تطبيق تغييرات المحرك، ورسم النصوص واللوحات، والحركات، والإدخال)، ونسبته المئوية 95، و`drop`: حصة الإطارات التي استغرقت أكثر من دورة تحديث واحدة. |
| `JS` / `CORE` | لكل commit: شيفرتك (المعالجات والمؤقتات وصفوف القوائم) ونواة NSH (التخطيط والنص ومقارنة الفروق)؛ وعدد commits في الثانية، وعدد تغييرات العروض الأصلية لكل commit. |
| `HOP` | المدة التي تنتظرها التغييرات بين خيط المحرك والخيط الرئيسي؛ ومدى انشغال خيط المحرك. |
| `CPU` / `GPU` / `MEM` | العملية: المعالج (100% يعني نواة واحدة)، وحصتها من GPU، وبصمتها في الذاكرة (الرقم الذي يعرضه Activity Monitor). |

الأعمدة في الأسفل تمثل زمن الخيط الرئيسي لآخر 120 إطارًا مقابل دورة تحديث واحدة (الخط): أخضر ضمن نصفها، وكهرماني ضمنها، وأحمر فوقها. وما دامت اللوحة معروضة، تُسجَّل القراءات أيضًا مرة كل ثانية (الهدف `nsh::perf`، بشكل واجهة Linux الخلفية مع مراحل إطارات macOS `tick` و`drain` و`canvas`؛ المللي ثانية بصيغة المتوسط/p50/p95/الأقصى)، ويعرضها `nsh test --fps -v` ويقرؤها `examples/gallery/tools/perf.py`. قِس باستخدام نسخ release؛ فالمراقب لا يكلّف شيئًا حين يكون متوقفًا.

<a id="packaging"></a>

## الحزم

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

يكتب حزمة تطبيق:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

يُوقَّع `.app` توقيعًا مؤقتًا (ad hoc)، فيعمل على جهاز Mac الذي بناه. لتوزيعه، وقّعه بهوية Developer ID ثم وثّقه (notarize). يفتح `--run` التطبيق بعد حزمه.

<a id="embedding-in-a-mac-app"></a>

## التضمين في تطبيق Mac

يوفّر الـ crate `nsh-platform-macos` (من مستودع NSH) لتطبيق Mac المكتوب بـ Rust الأداة `AppView`: محرك NSH واحد كـ `NSView`. كل `AppView` مستقل؛ ويمكن تشغيل عدة منها في وقت واحد. يشغّل جذر Rust، أي المكوّن الجذر في الـ crate الخاص بك:

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

يمنح `Root::tokens` الجذر [سمته](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) ويمنح `Root::app_id` المعرّف الذي تُحفظ تحته بياناته. وتُحمَّل حزمة TSX التي كتبها `nsh build` في العرض نفسه:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

يستبدل `AppView::load` ما كان يعمل، وينهي `stop` التطبيق. يحدد `asset_base` المكان الذي تُحلّ فيه معرّفات URI من نوع `asset:/` (`AssetBase::Directory` أو `AssetBase::Http`). تُحمَّل حزم الـ bytecode (`bundle.nshc`) باستخدام `unsafe { Bundle::bytecode(bytes) }`: الـ bytecode مُدخل موثوق، لذا لا تحمّله إلا من ملفات تطبيقك أنت.
أما التطبيق الذي ليس سوى تطبيق NSH، فيفتح `run_app(source, options)` (`AppSource::Rust(root)` أو `AppSource::Bundle(bundle)`) `AppView` واحدًا في نافذة مع قائمة قياسية (About وHide وQuit وEdit وMinimize وZoom وEnter Full Screen وClose)، يمكن للتطبيق استبدالها بـ `Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md))، ويستمر في العمل حتى تُغلق النافذة.
افتراضيًا، يؤدي إغلاق النافذة أو اختيار Quit إلى إيقاف المحرك والعودة من `run_app`؛
ويمكن للمستدعي بعد ذلك إنهاء التنظيف أو إعادة تشغيل ملفه التنفيذي.

اضبط `AppOptions { keep_alive_on_close: true, ..Default::default() }` لإبقاء الجلسة المستقلة حيّة عند إغلاق نافذتها. يؤدي الإغلاق إلى إخفاء النافذة؛
وإعادة الفتح من Dock تُظهر النافذة والمحرك أنفسهما. لإنهاء صريح (Exit)
أو لإعادة التشغيل عند التحديث، استدعِ `nsh_platform_macos::quit_app()` من أي خيط. فهو
يغلق النافذة المحتفَظ بها، ويوقف المحرك، ويعود من `run_app`.
ويتبع `nsh_core::element::desktop::close_window()` سياسة إغلاق النافذة المختارة.


يحدد `AppOptions::cache` (أو `AppView::set_cache`، للتطبيقات المحمَّلة لاحقًا) مكان حفظ التطبيقات لذاكرتها المؤقتة و[الصور التي تنزّلها](./images-and-assets.md#kept-on-disk)، ومقدار ما يحتفظ به كل منها (`CacheOptions`: دليل الذاكرة المؤقتة للنظام و256 MiB من الصور افتراضيًا).

يمنح `AppView::set_locale(Some(locale))` و`AppView::set_font_scale(Some(scale))` التطبيقَ لغةَ تطبيقك وحجمَ نصه بدل ما للنظام (ويعيد `None` اتباع النظام): تتبع `locale()` و`Intl` و`fontScale()` والنص ذلك فورًا ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

يضع `AppView::set_theme_overrides(Some(json))` علامة تطبيقك التجارية فوق [سمة](./tailwind.md#theme-tokens) التطبيق: ملف سمة بصيغة `"theme"` الخاص بـ `nsh.json`، تتغلب رموزه (tokens) على رموز التطبيق التي تحمل الأسماء نفسها في الوضعين الفاتح والداكن بينما تبقى رموز التطبيق الأخرى؛ وتُعاد تهيئة أنماط الفئات مثل `bg-primary` فورًا، وتبدأ التطبيقات المحمَّلة لاحقًا به (يعيد `None` للتطبيق سمته الخاصة؛ والملف الذي لا يُحلَّل يُعدّ خطأ ولا يغيّر شيئًا).

تُسجَّل المكوّنات الأصلية باستخدام `AppView::register_component`؛ انظر
[Native components](./native-components.md#registering-on-macos-rust). يحدد `set_ui_sets(sets)` مجموعات واجهة المستخدم التي يخدمها كل
محرك: مجموعات NSH (`nsh_base::registry()`) ومجموعات الـ crates الخاصة بك (`my_app::registry()`، التي يُنشئها `#[native_module]`)، بحيث تستورد شيفرة TSX التي يحمّلها العرض مكوّنات Rust ووحداتها الخاصة بك أيضًا.

<a id="what-differs-on-macos"></a>

## ما يختلف على macOS

البيئة هي بيئة سطح المكتب: المنطقة الآمنة وارتفاع لوحة المفاتيح يساويان 0، و`idiom()` هو سطح المكتب (`platform.idiom` هو `"desktop"`)، و`os_version()` (`platform.version`) هو إصدار macOS، ويتبع الوضع الداكن مظهر النظام مباشرة. انظر
[Device and environment](./device-and-environment.md).

الإدخال هو إدخال سطح المكتب: الماوس، ولوحة التتبع (التمرير بالزخم، والقرص والتدوير)، ولوحة المفاتيح.
يُحدَّد النص القابل للتحديد بالسحب والنقر المزدوج والثلاثي، ويُنسخ بـ Cmd+C. تغلق Escape وOption+Left
وCmd+[ وزر الرجوع في الماوس أحدثَ حوار أو ترجع خطوة في المكدس (تؤدي Escape في حقل أو صفحة ويب لها التركيز إلى الخروج منها فقط؛ فالصفحة تحصل على هذه المفاتيح أولًا، وتحتفظ بما تستخدمه منها)؛ و`Dialog` هو طبقة فوق النافذة كلها تعرض النافذة المنبثقة للتطبيق وخلفيتها. تعرض الصفحات `header` في أعلاها. النقر في أي مكان داخل `Input`، بما في ذلك الحشوة (padding)، يضع المؤشر عند أقرب
نقطة. يعرض `AlertDialog` ورقة `NSAlert` على النافذة: حتى إجراءي تنبيه في صف واحد (إجراء الإلغاء في أقصى اليسار، وآخر إجراء عادي هو الافتراضي لمفتاح Return)، أما الإجراءات الأكثر وإجراءات ورقة الإجراءات فتُكدَّس
بترتيبها مع إجراء الإلغاء أخيرًا ودون إجراء افتراضي؛ وتختار Escape إجراء الإلغاء.

<a id="keyboard"></a>

### لوحة المفاتيح

| المفاتيح | الفعل |
|---|---|
| Return | في `Input`، ما يقوله `submitBehavior`: إرسال (`onSubmit`)، أو إرسال ومغادرة الحقل، أو سطر جديد (حقول الإدخال متعددة الأسطر) |
| Return، Enter في لوحة الأرقام، Space | تفعيل عرض له التركيز عبر `onPress` مرة واحدة عند الضغط؛ ويُستهلك التكرار التلقائي |
| Shift+Return، Option+Return، Ctrl+Return | سطر جديد في حقل متعدد الأسطر يرسل عند Return |
| Tab، Shift+Tab (وCtrl أيضًا) | الحقل أو العرض القابل للضغط التالي / السابق بترتيب الشاشة، ضمن أحدث حوار؛ ويكتب Option+Tab محرف tab في حقل متعدد الأسطر |
| Escape | تغادر الحقل الذي له التركيز؛ وإلا تلغي تحديد النص، ثم تغلق أحدث حوار أو ترجع خطوة |
| Option+Left، Cmd+[، زر الرجوع في الماوس | الرجوع (ليس أثناء تركيز حقل: هناك يحرّك Option+Left المؤشر) |
| Option / Cmd + الأسهم، مع Shift؛ Option+Delete، Cmd+Delete؛ Ctrl+A / E / K | التحريك والتحديد والحذف بالكلمة والسطر في الحقل، كما في كل تطبيقات Mac |
| Cmd+Z، Shift+Cmd+Z، Cmd+X / C / V / A | تراجع، إعادة، قص، نسخ، لصق، تحديد الكل (يرفض حقل `masked` القص والنسخ)؛ ويحدد Cmd+A / Cmd+C النص القابل للتحديد وينسخانه |
| الأسهم؛ Page Up / Down، Space، Shift+Space، Option+Up / Down؛ Home / End، Cmd+Up / Down | تمرير عرض التمرير المحيط بالعرض الذي له التركيز أو الذي تحت الماوس بمقدار سطر أو صفحة أو إلى البداية / النهاية (ليس أثناء تركيز حقل) |
| Cmd+W، Cmd+M، Ctrl+Cmd+F، Cmd+H، Option+Cmd+H، Cmd+Q | إغلاق، تصغير، ملء الشاشة، إخفاء، إخفاء الآخرين، إنهاء (قوائم تطبيقات `nsh package` و`nsh run`) |
| Cmd+R | يعيد تحميل أحدث بناء (`nsh run`) |

تأتي اختصارات التطبيق نفسه ([`keymap`](../modules/nsh.md#keymap)) قبل هذه، باستثناء مفاتيح التفعيل الموجهة إلى عرض قابل للضغط له التركيز، وQuit وHide وMinimize وFull Screen، التي لا يمكن ربطها.

تعمل الاختصارات مع أي تخطيط لوحة مفاتيح (في التخطيط السيريلي أو اليوناني، يكون Cmd+C هو المفتاح الذي يكتب C في التخطيط الأمريكي).
والـ return الذي يثبّت تأليف طريقة إدخال (الصينية، اليابانية، ...) لا يرسل أبدًا. يبلّغ `onKeyPress` بما يبلّغ به React Native: النص المكتوب، و`"Enter"`، و`"Backspace"`، و`"Escape"`.

غير مدعوم، أو مختلف:

- **عروض التمرير القابلة للتكبير** (`zoomTo`، وخصائص التكبير).
- **`mixBlendMode`**، و`brightness()` الأكبر من 1.
- **حقول الإدخال**: أنواع المحتوى والملء التلقائي، وأنواع لوحة المفاتيح، والكتابة بالأحرف الكبيرة تلقائيًا، وتباعد الأحرف؛ ولا تُعرض عروض ملحقات الإدخال أبدًا (لا توجد لوحة مفاتيح برمجية) ويُتجاهل `keyboardShouldPersistTaps`.
- **`scrollable={false}` الخاص بـ `WebView`** يمنع عجلة الماوس ولوحة التتبع من تمرير الصفحة: بل تمرران
  عروض التمرير في التطبيق المحيطة بها، كما في iOS. وما زالت الصفحة تتمرر بلوحة مفاتيحها (Space والأسهم) وبسكربتاتها الخاصة، وتتوقف أيضًا سحبات لوحة التتبع بين صفحاتها (`allowsBackForwardNavigationGestures`).
- **إمكانية الوصول**: `accessibilityActions` المخصصة.
- **شريط الحالة** و**الاهتزاز اللمسي** (لا مكافئ لهما على سطح المكتب).

<a id="see-also"></a>

## انظر أيضًا

- [CLI](./cli.md): `nsh run --target macos`، `nsh package --target macos`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
