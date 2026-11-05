---
title: "iOS"
description: "شغّل تطبيقات NSH المبنية بـ Rust وTSX على iOS باستخدام عناصر UIKit views، سواء في المحاكي أو على الأجهزة، وقم بتغليفها بصيغتي .app و.ipa، وضمّنها في تطبيق iOS موجود باستخدام AppView أو NshAppView من NativeShell.xcframework."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---

# iOS

تعمل تطبيقات NSH على iOS باستخدام عروض UIKit ونصوص CoreText، على الأجهزة وفي المحاكي، بدءًا من iOS 15.0. تعمل التطبيقات الكاملة وتُحزَّم كما هو الحال على المنصات الأخرى، ويمكن لتطبيق موجود عرض تطبيقات NSH داخل عروضه الخاصة، سواء كان جذر Rust يربطه أو TSX يحمّله، بما في ذلك الحزم الموقّعة التي ينزّلها، ضمن حدود وصلاحيات يحددها. على iOS، `os()` هو `Os::Ios` (و`platform.os` هو `"ios"` في TSX) وتسري خصائص `ios={{…}}` في TSX.

<a id="requirements"></a>

## المتطلبات

- **Xcode** على جهاز Mac، مع بيئة تشغيل لمحاكي iOS (يثبّت `xcodebuild -downloadPlatform iOS` واحدة). راجع
  [التثبيت](./installation.md#ios-and-mac-catalyst).
- تحتاج التطبيقات إلى **iOS 15.0** أو أحدث، على iPhone وiPad.

<a id="running-an-app"></a>

## تشغيل تطبيق

يعمل تطبيق Rust من مجلده، أما تطبيق TSX فتحدد له ملف الدخول:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

يستخدم `nsh` محاكيًا قيد التشغيل، أو يشغّل أحدث iPhone. بالنسبة إلى تطبيق Rust، يبني المشغّل الخاص بالتطبيق مع الـ crate الخاصة بك، ويثبّته ويعرض سجلاته في الطرفية؛ وأي تغيير في كود Rust الخاص بالـ crate يعيد البناء ويعيد تشغيل التطبيق. بالنسبة إلى تطبيق TSX، يثبّت مضيف التطوير ويُبقي التطبيق محدّثًا أثناء الحفظ، مع عرض السجلات في الطرفية. يختار `--device` محاكيًا بالاسم أو UDID. للحصول على حلقة تطوير أسرع
دون محاكٍ، يفتح `nsh run --target catalyst` على جهاز Mac واجهة UIKit الخلفية نفسها في نافذة
[Mac Catalyst](./getting-started.md#mac-catalyst) بحجم iPhone.

<a id="packaging"></a>

## التحزيم

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

من مجلد تطبيق Rust، يكون التطبيق هو مشغّل iOS المبني مع الـ crate الخاصة بك؛ أما تطبيق TSX فتحدد له ملف الدخول
(`nsh package App.tsx --target ios-simulator --run`).

يكتب `--target ios` ملف `.ipa` موقّعًا للأجهزة أو TestFlight أو App Store. لمعرفة هويات التوقيع وملفات التزويد
والأيقونات: [التحزيم](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## التضمين في تطبيق iOS

يمكن لتطبيق iOS موجود عرض تطبيقات NSH داخل واجهته الخاصة. يربط تطبيق iOS الذي يحتوي على كود Rust الـ crate الخاصة بك
والـ crate `nsh-platform-ios` ويعرض الجذر الخاص بك في `AppView` ([تضمين تطبيق Rust](#embedding-a-rust-app)). أما تطبيق Swift
فيربط `NativeShell.xcframework`، وهو framework يتضمن وحدة Swift: تنشئ `NshAppView` (وهو `UIView`)،
وتضيفه في أي مكان ضمن تسلسل العروض الهرمي، ثم تحمّل فيه تطبيق TSX أو حزمة موقّعة. تتعايش شاشاتك الأصلية
والتنقل وتطبيق NSH جنبًا إلى جنب في تسلسل UIKit هرمي واحد.

كل عرض هو محرك مستقل واحد؛ ولا توجد كائنات singleton عامة، لذا يمكن لتطبيق ما عرض عدة تطبيقات NSH في آن واحد، على
سبيل المثال تطبيق واحد لكل تبويب.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## تضمين تطبيق Rust

`nsh_platform_ios::AppView` هو محرك واحد على هيئة `UIView` لتطبيق iOS مبني بـ Rust: يركّب مكوّن الجذر الخاص بالـ crate،
دون أي JavaScript VM.

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

يتغير حجم العرض مع العرض الأعلى منه. `AppView::run` يستبدل ما كان يعمل؛ ويشغّل `AppView::load` حزمة TSX بدلًا منه
(`Bundle::source`، أو `unsafe { Bundle::bytecode(bytes) }` لـ `bundle.nshc` داخل حزمة التطبيق). يحتوي `SurfaceOptions`
على الحدود والصلاحيات الممنوحة ومجلد البيانات والمكوّنات الأصلية، كما تفعل أعضاء `NshAppView`
أدناه؛ وتطابق `AppView::set_locale` و`set_font_scale` و`set_error_handler` كلًّا من `locale` و`fontScale` و`onError`.
يبني `nsh package --target ios` هذا النوع من التطبيقات لك، مع تركيب الجذر الخاص بك.

<a id="get-the-framework"></a>

## الحصول على الـ framework

تحتوي حزمة التوزيع على النسختين كلتيهما:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

ومن نسخة NSH المسحوبة (checkout) يمكنك بناء الـ frameworks فقط:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

ينتج البناء الافتراضي frameworks ثابتة. لبناء frameworks ديناميكية، استخدم:

```sh
cargo xtask ios-embed --dynamic
```

تمنح الـ frameworks الديناميكية وقت التشغيل صورة مكتبة وجدول فك مكدس (unwind table) خاصين به، مما يدعم التطبيقات المضيفة التي تربط
بالفعل أوقات تشغيل Rust أخرى. اختر إعداد التضمين في Xcode أدناه بما يطابق الـ framework الذي تبنيه.

افتراضيًا، يحتوي كل XCFramework على ثلاث شرائح arm64: أجهزة iOS ومحاكي iOS (Apple silicon) وMac Catalyst. الحد الأدنى
لهدف النشر هو iOS 15.0. تُترجَم وحدة Swift مع library evolution، ولذلك يمكن للتطبيقات المبنية بإصدارات أخرى من مترجم Swift
استيرادها، ويربط الـ framework كل ما يحتاج إليه: فلا تضيف شيئًا آخر.

<a id="add-it-to-an-xcode-project"></a>

## إضافته إلى مشروع Xcode

1. اسحب `NativeShell.xcframework` (أو `NativeShellDev.xcframework` لبنيات التطوير) إلى
   **Frameworks, Libraries, and Embedded Content** الخاص بهدف التطبيق. اختر **Do Not Embed** للـ frameworks الثابتة الافتراضية،
   أو **Embed & Sign** للـ frameworks الديناميكية المبنية بـ `--dynamic`.
2. في Swift، `import NativeShell`.
3. في `Info.plist` الخاص بالتطبيق، عيّن `CADisableMinimumFrameDurationOnPhone` إلى `YES`: على أجهزة iPhone التي تدعم ProMotion ستتحرك
   الرسوم المتحركة للتطبيق عندئذٍ بمعدل 120 Hz، كما يحدث في التمرير (التطبيقات التي يبنيها `nsh package` تتضمن ذلك).

> [!TIP]
> اربط `NativeShellDev.xcframework` في إعداد Debug و`NativeShell.xcframework` في Release، بحيث لا تتمكن
> سوى بنيات التطوير من الاتصال بخادم التطوير.

<a id="ship-a-bundle-with-the-app"></a>

## شحن حزمة مع التطبيق

يشحن تطبيق Swift تطبيقات TSX على هيئة حزم (bundles). ابنِ تطبيق NSH في مجلد وأضف هذا المجلد إلى موارد التطبيق كمرجع مجلد (folder reference) باسم `nsh`:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

يكتب `nsh build` ما يلي:

| الملف | المحتويات |
|---|---|
| `bundle.nshc` | التطبيق مترجمًا إلى bytecode: الأسرع تحميلًا. |
| `bundle.js` | التطبيق نفسه على هيئة مصدر JS. |
| `bundle.js.map` | خريطة المصدر الخاصة به (تشير تتبّعات المكدس إلى ملفات `.tsx` الخاصة بك). |
| `capabilities.json` | ال[صلاحيات](./sandbox-and-capabilities.md) التي يصرّح بها التطبيق، عندما يحتوي `nsh.json` على أي منها. |
| `assets/` | الصور والخطوط التي يستوردها التطبيق، في مساراتها النسبية إلى ملف الدخول. |

<a id="show-the-app"></a>

## عرض التطبيق

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

حجم العرض هو نافذة التطبيق: يرتّب NSH التطبيق وفق حدود العرض ويعيد ذلك كلما تغيرت. يؤدي التحميل
مرة أخرى إلى استبدال التطبيق الجاري؛ ويتوقف التطبيق عند تحرير العرض من الذاكرة.

العيّنة الكاملة، وهي تطبيق UIKit يعرض تطبيق NSH أسفل ترويسته الأصلية، هي `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` هو صنف فرعي من `UIView` معزول على الـ main actor.

| العضو | الوصف |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | ينشئ العرض. `trace` يسجّل زمن كل commit. `init?(coder:)` يدعم storyboards وnibs. |
| `onError: ((String) -> Void)?` | يتلقى أخطاء التطبيق القاتلة (حزمة يفشل تحميلها، واستثناءات JS غير المعالجة، وVM أوقفها حد معيّن) على الخيط الرئيسي. تُسجَّل الأخطاء دائمًا؛ وتعرضها بنيات التطوير أيضًا فوق التطبيق. |
| `limits: NshLimits` | حدود VM للتطبيقات المحمّلة من الآن فصاعدًا. |
| `grantCapabilities(_ json: String?) throws` | أقصى ما يُسمح للتطبيقات المحمّلة من الآن فصاعدًا بفعله، بصيغة JSON على شكل `capabilities` الخاص بـ `nsh.json`؛ ويمنح `nil` ما يصرّح به كل تطبيق. يرمي `NshError` عند JSON غير صالح. |
| `locale: Locale?` | لغة التطبيق ومنطقته بدلًا من لغة المستخدم ومنطقته: تتبعها `Intl` و`locale()` والمكوّنات فورًا، وتبدأ بها التطبيقات المحمّلة لاحقًا. `nil` يتبع إعدادات النظام. |
| `fontScale: CGFloat?` | حجم النص بدلًا من حجم Dynamic Type (القيمة 1 هي الافتراضية): يُعاد ترتيب النصوص والمدخلات وفقه ويقرؤه `fontScale()`، فورًا وللتطبيقات المحمّلة لاحقًا؛ أما الأطوال فتحتفظ بحجمها. `nil` يتبع إعدادات النظام. |
| `setThemeOverrides(_ json: String?) throws` | هوية المضيف التجارية فوق [سمة](./tailwind.md#theme-tokens) التطبيق: ملف سمة بصيغة `"theme"` الخاص بـ `nsh.json`. تتغلب رموزها (tokens) على رموز التطبيق ذات الأسماء نفسها، في الوضعين الفاتح والداكن، وتبقى رموز التطبيق الأخرى. يُطبَّق فورًا وعلى التطبيقات المحمّلة لاحقًا؛ ويعيد `nil` للتطبيق سمته الخاصة. يرمي `NshError` عند ملف لا يمكن تحليله. |
| `storageDirectory: URL?` | المكان الذي تحفظ فيه التطبيقات المحمّلة من الآن فصاعدًا [تخزينها](../modules/nsh.md#storage)؛ `nil`: `Library/Application Support/nsh/<app id>`، بحسب معرّف التطبيق نفسه. |
| `cacheOptions: NshCacheOptions` | المكان الذي تحفظ فيه التطبيقات المحمّلة من الآن فصاعدًا ذاكرتها المؤقتة، و[الصور التي تنزّلها](./images-and-assets.md#kept-on-disk)، وكم يحتفظ به كل منها: `location` `.system` (`Library/Caches/nsh`، كل تطبيق في `<app id>`)، أو `.directory(URL)` أو `.off`؛ `images` `.default` (256 MB)، أو `.maxSize(megabytes:)` أو `.off`. |
| `loadBundle(at url: URL) throws` | يشغّل حزمة كتبها `nsh build`. تأتي الأصول من `assets/` المجاور لها؛ كما يُقرأ `bundle.js.map` و`capabilities.json` المجاوران لها. |
| `run(_ package: NshPackage)` | يشغّل حزمة موقّعة تم التحقق منها (انظر أدناه). تعمل الحزمة مرة واحدة. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | يتحقق من الحزمة الموجودة في عنوان URL خارج الخيط الرئيسي، ثم يشغّلها. يرمي سبب الرفض؛ ويبقى التطبيق الجاري. |
| `connectDevServer(_ url: URL) throws` | للتطوير: يحمّل من خادم `nsh dev` ويعيد التحميل عند كل تغيير. يرمي خطأً مع `NativeShell.xcframework`، الذي لا يدعم التطوير. |
| `register(component:_:)` | يسجّل [مكوّنًا أصليًا](./native-components.md). |
| `params: [String: Any]` | معاملات الإطلاق للتطبيقات المحمّلة من الآن فصاعدًا: يقرؤها التطبيق عند البدء بصيغة `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | يرسل حدثًا إلى التطبيق (`host.on(name, …)`)؛ ويُحتفظ به إلى أن يستمع إليه، أو للتطبيق التالي ما دام لا يوجد تطبيق يعمل. |
| `handle(_ name: String, _ handler:)` | يعالج استدعاءات التطبيق (`host.call`) ورسائله المرسلة (`host.post`) الخاصة بـ `name` على الخيط الرئيسي: `{ data, reply in … }`، أو دالة `async throws` `{ data in … }` تجيب نتيجتها عن الاستدعاء. |
| `removeHandler(_ name: String)` | يزيل معالج `name`: تفشل استدعاءات التطبيق له فورًا. |
| `static preferredStatusBarStyle`، `prefersStatusBarHidden`، `preferredStatusBarUpdateAnimation` | ما طلبته التطبيقات العاملة (`statusBar` الخاص بصفحاتها وحواراتها، والقيمة الافتراضية لـ `nsh.json`): أعدها من overrides الخاصة بـ view controller المستضيف. |

> [!IMPORTANT]
> لا يُحمَّل `bundle.nshc` (bytecode) إلا من داخل حزمة التطبيق. لا يتحقق QuickJS من صحة bytecode، لذا فإن bytecode
> من أي مكان آخر قد يتلف الذاكرة: لملف خارج حزمة التطبيق، حمّل `bundle.js` (مصدر JS)، أو الأفضل
> [حزمة موقّعة](./signed-packages.md).

تسري `limits` و`grantCapabilities` و`storageDirectory` و`cacheOptions` ابتداءً من التحميل التالي: عيّنها قبل `loadBundle` / `run`.

يحتفظ كل تطبيق بتخزينه تحت معرّفه الخاص دون أي إعداد: الحزمة الموقّعة تحت المعرّف الذي تضمنه شهادة مفتاح إصدارها، والحزمة العادية تحت `id` الخاص بـ `nsh.json` (`app.json` المجاور لها، ويكتبه `nsh build`). عيّن `storageDirectory` لحفظ بيانات تطبيق في مكان يختاره المضيف:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## التخاطب مع التطبيق

يتخاطب العرض والتطبيق الذي يشغّله عبر قناة خاصة بهما ([`host`](../modules/nsh.md#host)): معاملات إطلاق
يقرؤها التطبيق عند البدء، وأحداث من التطبيق المضيف، واستدعاءات ورسائل من التطبيق، ببيانات JSON
(كائنات Foundation في هذا الجانب). لا تحتاج إلى أي عرض في التطبيق ولا إلى مكوّن أصلي.

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

تعمل المعالجات على الخيط الرئيسي؛ وينتظر الاستدعاء إجابته داخل التطبيق دون حجب أي من الطرفين. الرد
الذي يُحرَّر دون إجابة يُفشل الاستدعاء، والاستدعاء باسم لا معالج له يفشل فورًا. تُحفظ الأحداث ذات الأسماء التي لا
يستمع إليها التطبيق بعد إلى أن يستمع إليها، وتذهب الأحداث المرسلة بينما لا يعمل أي تطبيق (قبل `loadBundle`، وأثناء إعادة التحميل) إلى
التطبيق التالي، بحيث يصل إليه الإشعار الذي نُقر عليه أثناء بدء التطبيق.

<a id="theme-overrides"></a>

## تجاوزات السمة

عندما يُضمَّن تطبيق واحد في عدة تطبيقات مضيفة ذات هويات تجارية مختلفة، يتبنى هوية كل مضيف: يعطي المضيف الرموز التي تغيّرها هويته،
على هيئة ملف سمة بصيغة `"theme"` الخاص بـ `nsh.json` (`cssVars` الخاص بـ shadcn/ui، وقيمه كما تكتبها CSS). وهي تتغلب
على رموز التطبيق ذات الأسماء نفسها؛ وتبقى رموز التطبيق الأخرى. أعطِ الرمز قيمته للوضع الداكن تحت `dark`
(المجموعة الواحدة فقط تحت `light` أو `theme` هي ذلك اللون في الوضعين):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

استدعِه قبل التحميل أو بعده: تعيد أصناف مثل `bg-primary` و`rounded-(--radius)` تنسيقها فورًا، ويبدأ كل تطبيق
يُحمَّل لاحقًا بالتجاوزات في إطاره الأول. يعيد `setThemeOverrides(nil)` للتطبيق سمته الخاصة.

<a id="links-the-app-opens"></a>

## الروابط التي يفتحها التطبيق

تصل عناوين URL التي يفتحها التطبيق ([`openUrl`](../modules/nsh.md#openurl)، وروابط `TextView` مع `links="open"`)
إلى `onOpenURL` أولًا، على الخيط الرئيسي: أعد `true` عندما يعالج التطبيق المضيف عنوان URL، كأن يمرره
عبر الموجّه (router) الخاص به، وأعد `false` ليفتحه النظام باستخدام `UIApplication.open`. ودون `onOpenURL` يفتح
النظام كل عناوين URL. وتصل عناوين URL إليه بعد أن تسمح بها صلاحية `openUrl` الخاصة بالتطبيق.

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

<a id="limits"></a>

## الحدود

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| حقل `NshLimits` | الافتراضي | المعنى |
|---|---|---|
| `memoryMB: UInt32?` | 256 | كومة JS بوحدة MB. نفاد الذاكرة يوقف التطبيق. |
| `stackKB: UInt32?` | 4096 (وهو الحد الأقصى أيضًا) | مكدس المفسّر بوحدة KB. التكرار الأعمق يرمي `RangeError`. |
| `loadBudget: TimeInterval?` | 10 s | زمن تقييم الحزمة. |
| `callBudget: TimeInterval?` | 2 s | زمن أي استدعاء آخر إلى JS (حدث واحد، أو مؤقت واحد، أو إطار واحد). يُقطع الاستدعاء المتجاوز. |
| `maxNodes: UInt32?` | 200 000 | عدد العُقد التي يجوز للتطبيق الاحتفاظ بها. |

يحتفظ `nil` بالقيمة الافتراضية. وما يفعله كل حد عند بلوغه: [العزل والصلاحيات](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## الصلاحيات

يصرّح التطبيق بما يمكنه الوصول إليه في `nsh.json`؛ ويمكن للتطبيق المضمِّن منح أقل من ذلك. يجب أن يسمح بالطلب
كلاهما:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

هنا لا يجوز للتطبيق ضبط شريط الحالة (لا يوجد `statusBar`)، حتى لو طلب `nsh.json` الخاص به ذلك. التفاصيل:
[العزل والصلاحيات](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## الحزم الموقّعة

لتشغيل كود ينزّله التطبيق (تحديثات، أو تطبيقات مصغّرة من جهات خارجية)، استخدم [الحزم الموقّعة](./signed-packages.md):
يكتب `nsh publish` ملف `.nshpkg` موقّعًا بمفتاح إصدار صدّق عليه مفتاح الجذر الخاص بك، ويتحقق منه التطبيق قبل
تشغيله.

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

للتحقق أولًا والتشغيل لاحقًا، افصل الخطوتين:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | الوصف |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | يفتح مخزن الثقة أو ينشئه. تبقى حالته (أحدث قائمة إبطال، وأعلى بناء مقبول لكل تطبيق) فيه، وتُستخرج أصول الحزم تحته. لا يثق بأي مفتاح إلى أن يُستدعى `addRoot`. آمن للاستخدام عبر الخيوط. |
| `addRoot(_ publicKey: String) throws` | يثق بمفتاح جذر عام (base64، محتويات ملف `.pub`). يمكن الوثوق بعدة جذور. |
| `updateRevocations(_ json: String) throws` | يطبّق قائمة إبطال كتبها `nsh revoke`، وموقّعة من جذر موثوق، وأحدث من القائمة التي يحتفظ بها المخزن. |
| `openPackage(at: URL) async throws -> NshPackage` | يتحقق، ويستخرج الأصول ويقبل الحزمة (تُرفض البنيات الأقدم من ذلك التطبيق منذ ذلك الحين). |
| `NshPackage.info` | `id` و`name` و`version` و`build` للتطبيق الموجود داخلها. |
| `NshError` | الخطأ الذي ترميه كل استدعاءات الرمي؛ ويوضح `message` السبب. |
<a id="development"></a>

## التطوير

مع `NativeShellDev.xcframework`، وجّه العرض (view) إلى خادم التطوير بدلًا من الحزمة (bundle):

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

شغّل `nsh dev App.tsx` على جهاز Mac الخاص بك. يشارك المحاكي شبكة جهاز Mac، لذلك يصل `127.0.0.1` إلى الخادم؛ أما الجهاز الفعلي فيستخدم عنوان الشبكة المحلية الذي يطبعه `nsh dev` (`devices on this network: ws://192.168.1.20:8790/ws`). يؤدي كل حفظ إلى تحديث التطبيق في مكانه، وتظهر السجلات في الطرفية `nsh dev`، وتظهر الأخطاء فوق التطبيق. راجع [خادم التطوير وتصحيح الأخطاء](./dev-server-and-debugging.md).

> [!NOTE]
> على الجهاز الفعلي، يكون الاتصال بجهاز Mac الخاص بك حركة مرور عادية على الشبكة المحلية عبر `ws://` العادي و`http://` (للأصول).
> قد يطلب iOS من المستخدم السماح بالوصول إلى الشبكة المحلية، ويجب أن تسمح بذلك إعدادات App Transport Security الخاصة بالتطبيق.

<a id="notes"></a>

## ملاحظات

- **الخيوط (Threads).** `NshAppView` معزول على الخيط الرئيسي (main-actor). أما `NshTrust` و`NshPackage` و`NshComponentContext` فهي آمنة للاستخدام عبر الخيوط (thread-safe).
  يعمل محرك JS على خيط خاص به؛ ولا ينتظره الخيط الرئيسي أبدًا.
- **شريط الحالة (Status bar).** تغيّر صفحات التطبيق المضمَّن وحواراته (`statusBar`) ما تعيده `NshAppView.preferredStatusBarStyle` وما شابهها؛
  ويجب أن يمرّرها view controller المستضيف، كما في المثال أعلاه.
- **المنطقة الآمنة (Safe area).** تستخدم التطبيقات `safe_area()` في Rust، و`env(safe-area-inset-*)` في الحشو (padding) أو
  `safeAreaInsets()` من [`nsh`](../modules/nsh.md#safe-area-and-keyboard) في TSX، كالمعتاد. أما `NshAppView` الموضوع أسفل الترويسة الخاصة بك فيحصل على الهوامش التي تنطبق عليه، لا على هوامش النافذة.
- **Mac Catalyst.** يعمل الإطار نفسه في تطبيقات Catalyst.

<a id="see-also"></a>

## انظر أيضًا

- [البناء باستخدام Rust](./rust.md)
- [التضمين في تطبيقات Android](./android.md)
- [المكونات الأصلية](./native-components.md)
- [الحزم الموقّعة](./signed-packages.md)
- [الصندوق الرملي والصلاحيات](./sandbox-and-capabilities.md)
