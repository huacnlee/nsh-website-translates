---
title: "GPUI"
description: "تضمين تطبيقات NSH المبنية بـ Rust وTSX داخل تطبيق GPUI أو GPUI Kit باستخدام AppView، حيث يتولى GPUI رسمها على macOS وWindows وLinux، مع تجربة تطبيقات TSX في مضيف التطوير الخاص بـ GPUI، وشرح ما يختلف في خلفية GPUI."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---

# GPUI

ترسم الواجهة الخلفية GPUI تطبيقات NSH باستخدام [GPUI](https://gpui-kit.com) (GPUI Fast)، إطار عمل واجهات المستخدم المسرَّع بوحدة معالجة الرسوميات الذي يقوم عليه GPUI Kit، على macOS وWindows وLinux على حد سواء. وهي الواجهة الخلفية المخصصة للتضمين في تطبيقات GPUI وGPUI Kit: فالعنصر `AppView` هو عرض (view) في GPUI، ولذلك يعرض تطبيق GPUI أو GPUI Kit تطبيقات NSH، سواء كان جذرها بلغة Rust خاصة به أو TSX يحمّله، في أي موضع من شجرة العناصر الخاصة به. أما التطبيقات المستقلة فتُشغَّل وتُحزَّم بالواجهة الخلفية الخاصة بكل سطح مكتب: [macOS](./macos.md) (AppKit)، و[Windows](./windows.md) (Win32)، و[Linux](./linux.md) (GTK). النواة، والرسم البياني التفاعلي، والمُصيِّر، وتخطيط Taffy، والوحدات الأصلية هي نفسها على كل منصة أخرى، لذا يعمل التطبيق الواحد في كل مكان. `os()` (`platform.os` في TSX) هو نظام التشغيل الذي يعمل عليه التطبيق (macOS أو Windows أو Linux)، وتنطبق خصائص `desktop={{…}}` في TSX.

كل عنصر ووحدة في الواجهات الخلفية [macOS](./macos.md) (AppKit) و[Windows](./windows.md) (Win32) و[Linux](./linux.md) (GTK) متوفر هنا؛ وحيثما يرسم GPUI شيئًا بطريقته الخاصة، يوضح قسم [الاختلافات](#differences) كيف يتم ذلك.

<a id="how-it-works"></a>

## كيف يعمل

- **عنصر واحد لكل سطح.** السطح هو عنصر GPUI واحد يملأ المساحة التي يمنحه إياها العنصر الأب، ويرسم شجرة العرض بالكامل باستخدام أوليات GPUI: المستطيلات والظلال والمسارات والحروف والصور. يحتفظ NSH بعرض واحد محتفَظ به لكل عقدة، كما في Windows، ولا يعيد الرسم إلا عندما يغيّر commit شيئًا.
- **يُشكَّل النص على خيط المحرك** بواسطة نظام النصوص في GPUI (خطوط التطبيق نفسه)، ويقسّمه NSH إلى أسطر؛ ولا يتولى الخيط الرئيسي سوى رسم الحروف.
- **قفزة واحدة لكل commit.** يعمل المحرك على خيطه الخاص؛ وكل commit هو إغلاق (closure) واحد يُرسل إلى الخيط الرئيسي في GPUI، الذي يُخطر العرض.
- **الإدخال** يأتي من أحداث الفأرة والتمرير والمفاتيح وطريقة الإدخال في GPUI؛ أما اختبار الإصابة (hit testing) والضغطات ونظام المستجيبات والتمرير وتحرير النص فمنطقها هو نفسه في الواجهة الخلفية لـ Windows.

<a id="requirements"></a>

## المتطلبات

- macOS أو Windows أو Linux، مع وحدة معالجة رسوميات يستطيع GPUI الرسم بها (Metal على macOS، وDirectX على Windows، وVulkan على Linux).
- على macOS، يتطلب بناء تطبيق GPUI أو بيئة التشغيل من نسخة مستنسخة (checkout) استخدام Metal Toolchain من Xcode (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` يبني
  بيئة التشغيل بميزة `runtime-shaders` في GPUI ويذكر ذلك: تُجمَّع المظلِّلات (shaders) عند بدء التطبيق (جزء من الثانية في المرة الأولى، ثم يخزّنها macOS مؤقتًا بعد ذلك).
- على Linux: تعريف Vulkan، وWayland أو X11 مع `libxkbcommon`، وGTK 3 وWebKitGTK 4.1 (لعروض الويب)، وGStreamer 1.20 أو أحدث مع الإضافات الأساسية والجيدة (base وgood) (للفيديو). تحتاج عروض الويب إلى X11: على سطح مكتب Wayland شغّل التطبيق تحت Xwayland (`WAYLAND_DISPLAY=` فارغ)، وإلا فسيعرض مكانها عنصرًا نائبًا. كما يتطلب بناء بيئة التشغيل من نسخة مستنسخة حزم التطوير؛ على Debian وUbuntu:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## تشغيل تطبيق

يعمل تطبيق Rust داخل تطبيق GPUI الخاص بك: ضمّن جذره باستخدام `AppView` ([التضمين في تطبيق GPUI](#embedding-in-a-gpui-app)) و`cargo run` تطبيق GPUI؛ فتكون الحزمة (crate) الخاصة بك والتطبيق عملية بناء Cargo واحدة. أما بمفرده، فيعمل تطبيق Rust على الواجهة الخلفية الخاصة بنظام التشغيل هذا (`nsh run --target macos` أو `windows` أو `linux`).

يعمل تطبيق TSX في مضيف التطوير (development host) الخاص بـ GPUI:

```sh
nsh run App.tsx --target gpui
```

يفتح التطبيق في نافذة GPUI (بحجم 1200×800 افتراضيًا)، كما يعرضه تطبيق GPUI يضمّنه، مع إعادة التحميل الفوري (hot reload) والسجلات في الطرفية وطبقة الأخطاء كما في الأهداف الأخرى. يعمل مضيف التطوير (`nsh-gpui-host`) في مكانه على كل نظام تشغيل، دون حزمة تطبيق حوله. في النسخة المستنسخة، يبنيه `nsh run` أولًا؛ وتشحنه التوزيعة في `runtime/gpui/`. كما يشغّل المضيف حزمة مبنية (bundle) بمفرده:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` هو حجم النافذة بالنقاط (`<width>x<height>`).

<a id="packaging"></a>

## التحزيم

يشحن تطبيق GPUI نظام NSH داخل ملفه التنفيذي الخاص: فهو يضمّن جذر التطبيق بلغة Rust أو حزمة TSX باستخدام `AppView` ([التضمين في تطبيق GPUI](#embedding-in-a-gpui-app)) ويُبنى ويُوزَّع بوصفه تطبيق GPUI. أما تطبيق NSH المستقل فيُحزَّم بالهدف الخاص بنظام التشغيل هذا: [`--target macos`](./macos.md#packaging) أو [`--target windows`](./windows.md#packaging) أو [`--target linux`](./linux.md#packaging) ([التحزيم](./packaging.md)).

على Linux، يربط تطبيق GPUI الذي يحتوي على عروض ويب وفيديو مكتبتي WebKitGTK 4.1 وGStreamer ديناميكيًا، لذا يجب تثبيتهما على الأجهزة التي يعمل عليها، مع GTK 3 والإضافات الأساسية والجيدة في GStreamer (Debian / Ubuntu: `libwebkit2gtk-4.1-0`، `libgstreamer1.0-0`، `libgstreamer-plugins-base1.0-0`، `gstreamer1.0-plugins-good`)، إضافة إلى تعريف Vulkan و`libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## التضمين في تطبيق GPUI

تمنح الحزمة `nsh-platform-gpui` (من مستودع NSH) تطبيق GPUI بلغة Rust العنصر `AppView`: محرك NSH واحد بوصفه عرضًا في GPUI (`Entity<AppView>`)، يملأ المساحة التي يمنحه إياها العنصر الأب. كل `AppView` مستقل؛ ويمكن تشغيل عدة عروض في وقت واحد. وهو يشغّل جذر Rust، أي المكوّن الجذر في الحزمة الخاصة بك:

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

يمنح `Root::tokens` الجذر [السمة](./rust.md#theme) الخاصة به (`nsh_base::Theme::from_json(json)?.into_tokens()`، ويُعاد تصدير `Theme` هنا) ويحدد `Root::app_id` المعرّف الذي تُحفظ بياناته تحته. وتُحمَّل حزمة TSX التي كتبها `nsh build` في العرض نفسه:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

ضع الكيان (entity) في شجرة العناصر لديك مثل أي عرض آخر (`Root` في GPUI Kit، أو لوحة، أو dock). يستبدل `AppView::load` ما كان قيد التشغيل؛ ويُنهي `stop` (أو إسقاط العرض) التطبيق. ويخبره `AppOptions::asset_base` أين تُحلّ معرّفات `asset:/` (`AssetBase::Directory` أو `AssetBase::Http`). وتُحمَّل حزم الشيفرة البايتية (`bundle.nshc`) باستخدام `unsafe { Bundle::bytecode(bytes) }` (أو `Bundle::read_trusted(path)`، وهي unsafe أيضًا): شيفرة QuickJS البايتية مُدخل موثوق، لذا لا تحمّلها إلا من ملفات تطبيقك أنت.

- يفتح `open_app_window(source, options, cx)` نافذة تحتوي على `AppView` واحد في تطبيق GPUI قيد التشغيل.
- يبدأ `run_app(source, options)` تشغيل GPUI ويشغّل تطبيقًا واحدًا في نافذة حتى تُغلق (وهو ما يفعله مضيف التطوير).
- يسجّل `AppView::register_component(name, factory)` مكوّنًا أصليًا من مكوّناتك قبل التحميل ([المكوّنات الأصلية](./native-components.md)).
- يحدد `AppOptions::cache` (أو `AppView::set_cache`، للتطبيقات التي تُحمَّل بعده) المكان الذي تحتفظ فيه التطبيقات بذاكرتها المؤقتة، و[الصور التي تنزّلها](./images-and-assets.md#kept-on-disk)، ومقدار ما يحتفظ به كل منها: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB)، `MaxSize(ByteSize::mib(n))` أو `Off`.
- `AppView::host()` هو قناة العرض مع التطبيقات التي يشغّلها ([`host`](../modules/nsh.md#host))، وهو `HostChannel` يمكن لأي خيط استخدامه: يمنح `set_params(map)` قبل التحميل التطبيق معاملات إطلاقه (`host.params`)، ويرسل `send(name, data)` حدثًا (`host.on`)، ويجيب `handle(name, |call| …)` عن `host.call(name, data)` الخاص به ويستمع إلى `host.post` (`call.resolve(json)`، `call.reject(message)`، فورًا أو لاحقًا من أي خيط). تعمل المعالجات (handlers) على خيط المحرك: سلّم الاستدعاء إلى كيانات GPUI لديك (قناة تقرؤها مهمة `cx.spawn`) وأجب من هناك. لـ `AppView` في macOS وWindows وLinux `host()` نفسه. ويرى `handle_open_url(|request| …)` الخاص به عناوين URL التي يفتحها التطبيق ([`openUrl`](../modules/nsh.md#openurl)) قبل النظام: `request.handled()` عندما يوجّه تطبيقك عنوان URL بنفسه، و`request.decline()` (أو إسقاط الطلب) لكي يفتحه النظام باستخدام `open_url` في GPUI.
- يحدد `AppOptions::limits` (أو `AppView::set_limits`، للتطبيقات التي تُحمَّل بعده) حدود الآلة الافتراضية: كومة JS (heap)، والمكدس (stack)، وميزانيات الوقت، وحصة العقد ([العزل والصلاحيات](./sandbox-and-capabilities.md)). تحصل التطبيقات المضمَّنة على `Limits::default()` (كومة بحجم 256 MB)؛ ويشغّل مضيف التطوير التطبيقات بنفسه، مع `Limits::standalone()`.
- يجعل `AppOptions::transparent` العرض شفافًا: فلا يرسم خلفية للنافذة، ويفتح `open_app_window` / `run_app` نافذة شفافة، فيظهر ما خلف النافذة في المناطق التي لا يرسمها التطبيق (عناصر سطح المكتب، والتراكبات). القيمة الافتراضية false.
- يحمّل `AppView::connect_dev_server(url, cx)` (الميزة `dev`) التطبيق من `nsh dev` ويعيد تحميله أثناء التحرير، مع طبقة الأخطاء فوق العرض؛ ويظل `AppView::on_error` يستمع إلى أخطاء التطبيق.
- يستمع `AppView::on_app_error(|error| …)` إلى أخطاء التطبيق: `error.kind` (فشل تحميل التطبيق، أو استثناء غير ملتقَط، أو توقفت الآلة الافتراضية)، و`error.is_fatal()` عندما لا تعمل أي شيفرة JS من التطبيق مجددًا، و`error.message`، و`error.stack` و`error.package` (معرّف الحزمة الموقّعة التي جاء منها وبناؤها). ويتلقى `AppView::on_error` الأخطاء نفسها كنص.
- يمنح `AppView::set_locale(locale, cx)` و`AppView::set_font_scale(scale, cx)` التطبيقَ لغة تطبيقك وحجم نصه بدلًا من لغة النظام وحجمه (ويعيد `None` اتباع النظام): تتبع `locale()` و`Intl` و`fontScale()` والنص ذلك فورًا ([الجهاز والبيئة](./device-and-environment.md#in-an-embedding-app)).
- يشغّل `AppView::run_package(&package)` [حزمة موقّعة](./signed-packages.md#loading-packages-in-a-host-app) من `verify_package` أو `load_package`؛ ويسجّل `accept_package` ذلك مرة واحدة بعد أن يقرر تطبيقك أنه سليم.
- يحدد `set_ui_sets(sets)` مجموعات واجهة المستخدم التي يخدمها كل محرك: مجموعة NSH (`nsh_base::registry()`) ومجموعات حزمك (`my_app::registry()`، التي ينشئها `#[native_module]`؛ [البناء باستخدام Rust](./rust.md))، ويمنح تطبيقك مجموعاته الخاصة: يصل التطبيق إلى دوال وفئات إحداها بالاسم باستخدام [`nativeModule`](../modules/nsh.md#nativemodule) ويُبنى باستخدام `nsh build` القياسي. ويُبقي `examples/embed-gpui` في المستودع منصة تداول في المضيف بهذه الطريقة، تتشاركها تذكرتا أوامر مضمَّنتان وعناصر المضيف الخاصة.

<a id="differences"></a>

## الاختلافات

ما يُرسم أو يتصرف بشكل مختلف عن الواجهات الخلفية الأصلية لسطح المكتب:

- **التحويلات (Transforms)**: تدور خلفيات العروض المدارة والمائلة والمُسقَطة وحدودها وظلالها، لكن النص يبقى منتصبًا، وتُرسم الصور والفيديوهات واللوحات (canvas) ضمن حدودها.
- **الشفافية (Opacity)** تُطبَّق على كل لون بدل المجموعة، لذا تظهر الأبناء المتداخلة في عرض شبه شفاف من خلال بعضها؛ وتتغير شفافية الصورة (التلاشي التدريجي، أو العرض شبه الشفاف) بمقدار أجزاء من ستة عشر.
- **القصّ المستدير** (`overflow: "hidden"` مع نصف قطر) يقوّس خلفيات الأبناء وصورهم، لكن النص والحدود والفيديوهات والمكوّنات الأصلية تُقصّ بالمستطيل.
- **غير مرسوم**: `filter: blur()` و`backdropFilter` و`mixBlendMode`؛ وتظهر الظلال من خلال التعبئات شبه الشفافة؛ ويرسم `borderCurve: "continuous"` زوايا دائرية.
- **نص اللوحة (Canvas)** تقريبي: منتصب عند التدوير، ويُصغَّر بدل أن يُضيَّق عند `maxWidth`، وتطلي التدرجات اللونية النص بلون واحد، و`strokeText` التعبئات، وظلاله غير مموّهة، ولا تنطبق عليه العمليات المركّبة و`clearRect`.
- **عروض التمرير** لا تدعم التكبير (يتم تجاهل `zoomTo` وخصائص التكبير).
- **الفيديو** يعمل على Linux (GStreamer)؛ أما على macOS وWindows فيعرض الفيديو عنصرًا نائبًا ويبلّغ عن `onError`.
- **عروض الويب** هي عروض أصلية فوق كل ما يرسمه NSH في موضعها. وعلى Linux تحتاج إلى X11 (انظر [المتطلبات](#requirements))؛ وحيثما تبقى الصفحات سوداء تحت Xwayland (الرسالة "Failed to create GBM buffer" في السجل)، شغّل التطبيق باستخدام `WEBKIT_DISABLE_DMABUF_RENDERER=1`. وعلى macOS وWindows لا تقصّها العناصر الأسلاف القاصّة، ولا تبلّغ عمليات التحميل الفاشلة عن `onError`. و`baseUrl` و`scrollable` و`allowsBackForwardNavigationGestures` غير مدعومة.
- **إمكانية الوصول (Accessibility)** تمر عبر AccessKit: يمكن لقارئات الشاشة تفعيل العناصر وتركيز التحديد وتعيين القيم وتمرير العناصر إلى مجال الرؤية في كل مكان؛ أما الإجراءات المخصصة وإجراء قائمة السياق فلا تُمرَّر بعد.

للمقارنة، هذه قائمة كل واجهة خلفية أصلية: [macOS](./macos.md#what-differs-on-macos)، [Windows](./windows.md#what-differs-on-windows)، [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## انظر أيضًا

- [البناء باستخدام Rust](./rust.md): الحزمة التي يضمّن تطبيق GPUI جذرها
- [CLI](./cli.md): `nsh run --target gpui`
- [التحزيم](./packaging.md): التطبيقات المستقلة، مع الهدف الخاص بكل نظام تشغيل
- [نظرة عامة على المنصات](./platforms.md)
