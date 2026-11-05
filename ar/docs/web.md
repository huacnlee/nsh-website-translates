---
title: "Web"
description: "أنشئ تطبيقات الويب باستخدام Rust أو TSX مع مكونات Native Shell المعروضة بصيغة HTML وCSS، وطوّرها داخل المتصفح، ثم انشرها على أي خادم استضافة ثابتة أو شبكة CDN."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# الويب

أنشئ تطبيقات الويب باستخدام Native Shell بنفس المكوّنات والأنماط ومنطق التطبيق المستخدمة على المنصات الأصلية. يعرض NSH الواجهة على شكل عناصر HTML وCSS: يعتمد النص والصور وحقول الإدخال والتمرير والأنماط المرئية والتفاعلات على DOM المتصفح وواجهات الويب البرمجية (web APIs).

`nsh package --target web` ينشر التطبيق كموقع ثابت يعمل على أي خادم ويب أو CDN ([نشر تطبيق](#publish-an-app))، و`nsh run --target web` يشغّله في المتصفح أثناء تحريره ([التطوير في المتصفح](#develop-in-the-browser)). تستخدم كل العروض التجريبية الحية في هذا الموقع واجهة الويب الخلفية هذه.

تستخدم تطبيقات TSX المنشورة محرك JavaScript الخاص بالمتصفح. يربط التغليف لكل تطبيق بيئة تشغيل خاصة به، تضم فقط مكوّنات `nsh/base` والوحدات القياسية التي يستوردها التطبيق: فالتطبيق المبني من المكوّنات الأساسية يُنزّل نحو 1.1 ميغابايت. تُحمَّل بيانات تلوين الصياغة عند أول مرة يُلوَّن فيها الكود.

<a id="what-runs-where"></a>

## ما الذي يعمل وأين

تُبنى الصفحة من عناصر HTML منسّقة بـ CSS. يحوّل NSH تحديثات المكوّنات إلى دفعات من تغييرات DOM، بينما يعرض المتصفح الواجهة ويتولى التمرير وتحديد النص والإدخال. تستضيف WebAssembly محرك Rust المشترك الخاص بحالة المكوّنات والتخطيط والتحديثات: مع crate التطبيق المكتوب بـ Rust مُجمَّعًا داخله، أو إلى جانب محرك JavaScript في المتصفح الذي يشغّل كود تطبيق TSX على هيئة وحدات ES: وهذا ينطبق على التطبيقات المنشورة وصفحة خادم التطوير وعروض هذا الموقع التجريبية وساحة التجربة (playground) على حد سواء.

على كل منصة أصلية يملك المحرك خيط تنفيذ (thread) خاصًا به ويسلّم `MountBatch` واحدًا عن كل commit إلى الخيط الرئيسي. أما صفحة المتصفح فلها خيط واحد، لذلك يشغّل إصدار الويب المحرك نفسه خطوة بخطوة من حلقة أحداث الصفحة (`nsh_engine::LocalEngine`):

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **التخطيط من مسؤولية النواة.** كل عنصر عرض هو عنصر بموضع مطلق عند الإطار الذي حسبه Taffy، لذا تتصرف flexbox وgrid و`aspectRatio` والنسب المئوية تمامًا كما على الأجهزة. أما تخطيط المتصفح نفسه فلا دخل له.
- **تُحوَّل الأنماط إلى CSS داخل Rust.** الخلفية والحدود وانحناءات الزوايا والظلال (`boxShadow`، `textShadow`) والتدرجات والمرشحات و`backdropFilter` والتحويلات و`transformOrigin` و`outline` و`mixBlendMode` والانتقالات والرسوم المتحركة المضمنة بإطاراتها المفتاحية تصبح كلها خصائص CSS. وتُحَل فئات Tailwind و`active:` وحالات `hover:` و`focus:` و`dark:` كلها محليًا، كما تُحَل على الأجهزة.
- **يُنسَّق النص داخل Rust** بقياسات الخطوط القادمة من المتصفح (`CanvasRenderingContext2D.measureText`) ويُرسَم مقطعًا مقطعًا عند المواضع التي اختارها التخطيط، فما قيس هو ما يُرسَم. تنكسر الأسطر بعد المسافات وحول محارف CJK وعند `\n`؛ و`numberOfLines` يقتطع النص بعلامة حذف.
- **تعمل الرسوم المتحركة الأصلية داخل Rust** على `requestAnimationFrame`: التوقيت بـ `Animated` والنابض (spring) والتباطؤ (decay) و`interpolate` والقيم المتحركة المربوطة بـ `opacity` و`translate` و`rotate` و`scale` وخطوات `transform` و`backgroundColor` والسحبات المربوطة بـ `pan` والقيم المرتبطة بالتمرير ووسائط canvas. لا تتدخل JS في كل إطار، كما هي الحال على الأجهزة. أما `LayoutAnimation` وانتقالات الأنماط وإطارات `animate-*` المفتاحية وانتقالات الشاشات فتتحرك كما في واجهات سطح المكتب الخلفية، و`prefers-reduced-motion` يوقفها (فتتلاشى الشاشات).
- **الإدخال:** الضغطات مع ردود الفعل `activeStyle` / `active:` والضغطات المطوّلة، ونظام المستجيب (responder) (`onTouch*`، `PanResponder`)، والسحبات الأصلية والقرص والتدوير بإصبعين، وعروض التمرير (تمرير المتصفح)، والسحب للتحديث، وعروض التمرير القابلة للتكبير (القرص وctrl+العجلة وقرصات لوحة اللمس، `zoomTo`)، و`<Input>` بقيم متحكَّم بها، والتركيز والإرسال، و`Canvas` و`NavStack` و`NavPage` مع `header` و`Dialog` الخاصين بالصفحة.
- **تُرسَم واجهة النظام داخل الصفحة:** يبدو `AlertDialog` مثل مربعات حوار واجهات سطح المكتب الخلفية في متصفحات سطح المكتب، ومثل iOS في الهواتف (بأسلوب `desktop`، انظر أدناه). تُقاس الخطوط المخصصة مرة أخرى بعد أن يحمّلها المتصفح، وينتظر التطبيق الخطوط التي يستوردها قبل أن يظهر إطاره الأول.
- **مربعات الحوار** هي طبقة فوق التطبيق كله تعرض النافذة المنبثقة والخلفية الخاصتين بالتطبيق، كما في واجهات سطح المكتب الخلفية. يغلقها Escape وزر الرجوع في المتصفح والضغط على الخلفية (`closeOnEscape`، `closeOnBackdropPress`)، وتعمل `animation` و`onOpen` و`onClose` و`onCancel` و`onOpenChange` كما على الأجهزة. ويمكن لصفحة [تضمّن التطبيق](#embed-it-in-a-page) في جزء من تخطيطها أن تعرض مربعات الحوار والتنبيهات فوق نافذة المتصفح كلها (`dialogs: "viewport"`)، كما تعرضها iOS وAndroid فوق الشاشة كلها.

<a id="keyboard-mouse-and-touch"></a>

## لوحة المفاتيح والفأرة واللمس

تتصرف التطبيقات المنشورة كتطبيقات سطح مكتب في متصفحات سطح المكتب وكتطبيقات هاتف في متصفحات الهواتف:

- **العجلات ولوحات اللمس** تمرّر أعمق عرض تمرير على محورها لا يزال قادرًا على الحركة (فالعجلة العمودية تمرّر قائمة أفقية حين لا يتحرك شيء عموديًا)، وتبقى عليه حتى ينتهي التمرير؛ وتنزلق نقرات العجلة بسلاسة، أما العروض ذات الترقيم أو الالتقاط (snapping) فتتحرك صفحة واحدة لكل تمريرة. تقرص Ctrl + العجلة وقرصات لوحة اللمس العروض بقيم القرص الأصلية بدل تكبير الصفحة. السحب بالفأرة لا يمرّر، كما في منصات سطح المكتب: تذهب سحبات الفأرة إلى الإيماءات (pans) ونظام المستجيب وتحديد النص. تُبلغ عروض التمرير عن `onScrollDragStart` / `onScrollDragEnd` و`onMomentumStart` / `End` و`onScrollEnd` كما في منصات سطح المكتب.
- **لوحة المفاتيح**: ينقل Tab وShift+Tab التركيز بين العناصر القابلة للضغط وحقول الإدخال (تُظهر أنماط `focus:` في التطبيق تركيز لوحة المفاتيح)؛ ويضغط Return العنصر القابل للضغط الذي عليه التركيز، ويضغطه Space عند تحريره؛ وتمرّر الأسهم وPage Up / Page Down وSpace وHome وEnd عرض التمرير المحيط بالتركيز أو الذي تحت الفأرة؛ ويغادر Escape الحقل، ثم يغلق مربع الحوار، ثم يرجع إلى الخلف. تعمل اختصارات `keymap` في المتصفح، وتُطابَق في الحال (`mod` هو Command في Safari وChrome على Mac، وControl في غيرهما).
- **الرجوع**: يغلق Escape وAlt+Left (وCmd+[ على Mac) وزر الرجوع في الفأرة أحدث مربع حوار أو يُخرج أعمق stack، كما يفعل زر الرجوع في Android؛ ويعمل `popOnBack` و`onBackPress` كما هناك. وحين يكون التطبيق هو الصفحة كلها، تصبح كل صفحة مدفوعة وكل مربع حوار مفتوح مدخلًا في سجل المتصفح، فيرجع زر الرجوع في المتصفح إلى الخلف داخل التطبيق.
- **اللمس**: عروض التمرير وحدها تتحرك بالسحب؛ أما الصفحة نفسها فلا تتمرر ولا تُكبَّر ولا تُسحب للتحديث تحت التطبيق، ولا تأخير في النقرات. وفي iframe، تمرّر السحبات التي لا يأخذها التطبيق الصفحة المضمِّنة. والسحبات على العروض ذات الإيماءات الأصلية والقرص ونظام المستجيب هي من شأن التطبيق.
- **إمكانية الوصول**: تتحول `role` و`accessibilityLabel` و`accessibilityHint` و`accessibilityState` و`accessibilityValue` و`accessibilityLiveRegion` و`accessibilityElementsHidden` إلى ARIA؛ و`announce` ينطق عبر منطقة حية (live region) و`setAccessibilityFocus` ينقل التركيز. العروض الواقعة تحت مربع حوار أو تنبيه تكون خاملة (inert).
- **التحديد والقوائم**: في متصفحات سطح المكتب يكون النص قابلًا للتحديد افتراضيًا، كما في صفحة الويب، باستثناء داخل العناصر التفاعلية (العروض ذات معالجات الضغط أو اللمس: الأزرار والصفوف القابلة للضغط والتبويبات) والنص الذي له `userSelect: "none"` أو `select-none`؛ ويحدده سحب الفأرة فوقه، وينسخه Ctrl/Cmd+C سطرًا سطرًا، ويحدد Ctrl/Cmd+A كل النص الذي يقع فيه التحديد. وفي متصفحات الهواتف واللوحيات لا يكون قابلًا للتحديد إلا النص الذي له `userSelect: "text"`، كما في التطبيقات الأصلية. ولا تظهر قائمة السياق الخاصة بالمتصفح إلا في النص القابل للتحديد وحقول الإدخال.

<a id="apps-with-rust-components"></a>

## تطبيقات بمكوّنات Rust

التطبيق المكتوب بـ Rust ([البناء باستخدام Rust](./rust.md)) يُنشر ويعمل في المتصفح من مجلده:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

حين يسمّي `nsh.json` المكوّن الجذر للتطبيق (`"root"`)، تكون الصفحة هي كود Rust الخاص بالتطبيق وسكربت صفحة NSH، ولا شيء غير ذلك: يضم `nsh.wasm` المحرك والمكوّنات وcrate التطبيق، وليس في الموقع `app.js`، وتركّب الصفحة المكوّن الجذر فور وصول بيئة التشغيل والخطوط. ومعرض Rust كله 3.3 ميغابايت (1.06 ميغابايت بعد gzip، و0.75 ميغابايت مع brotli)، أي أقل من بيئة تشغيل تطبيقات TSX. وتحت مدخل TSX الخاص به (`nsh package App.tsx --target web`)، يعمل التطبيق نفسه كما تعمل تطبيقات TSX، على محرك JavaScript في المتصفح، ويستورد مكوّنات crate ووحداته.

وفي الحالتين تُنشر أصول crate (`assets!()`) مع أصول التطبيق، وتُحمَّل خطوطه قبل الإطار الأول. أثناء `nsh run --target web`، يؤدي أي تغيير في كود Rust الخاص بـ crate إلى بناء بيئة التشغيل مجددًا وتحمّلها الصفحة المفتوحة من تلقاء نفسها؛ أما تعديلات TSX فتبقى تحديثات فورية (hot updates). تُبنى بيئة تشغيل التطوير تزايديًا، فيصبح تغيير crate جاهزًا في نحو ثانية؛ و`nsh package` يبني النسخة المنشورة محسّنة للحجم.

الكود المكتوب بـ Rust الذي يعمل على كل المنصات، بما فيها الويب، يستخدم خدمات المحرك: `fetch(url).await` ينفذ طلبات HTTP عبر حزمة الشبكة نفسها التي يستخدمها `fetch` في JS (حزمة المتصفح هنا، بقواعد CORS الخاصة بها)؛ و`timer` و`set_timeout` و`set_interval` تنتظر؛ و`nsh_core::time::Instant` و`nsh_core::time::unix_ms()` تقرآن الساعة. أما `background` و`blocking` فتشغّلان العمل على خيوط المنصات الأصلية.

يحتاج البناء إلى هدف Rust (target) وإلى clang يُجمّع إلى WebAssembly، كما يحتاج بناء بيئة التشغيل نفسها: `rustup target add wasm32-unknown-unknown`، إضافة إلى `clang` و`llvm-ar` (وعلى macOS، سلسلة أدوات LLVM مثل `llvm` من Homebrew، عبر `CC_wasm32_unknown_unknown` و`AR_wasm32_unknown_unknown`).

<a id="browser-apis-from-rust"></a>

### واجهات المتصفح البرمجية من Rust

يمكن لـ crate أن يستدعي واجهات المتصفح البرمجية نفسها عبر [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) وcrates `web-sys` و`js-sys` التابعتين له، خلف `#[cfg(target_arch = "wasm32")]`: WebSocket و`IndexedDB` والحافظة (clipboard) وأي واجهة Web API، وكود JS خاص بـ crate (`#[wasm_bindgen(inline_js = …)]`، `module = "/js/…"`). وحين تستدعي بيئة تشغيل الويب للتطبيق JS بهذه الطريقة (بما في ذلك تحويلات `JsValue`)، يشغّل `nsh` أداة `wasm-bindgen` CLI عليها ويشحن كود الربط (glue) الخاص بها وكود JS الخاص بـ crate بجانب بيئة التشغيل، في التطوير وفي المواقع المنشورة على حد سواء. وإصدار أداة CLI هو إصدار crate ‏`wasm-bindgen` الذي تربطه بيئة التشغيل، والذي يسميه `nsh`: `cargo install wasm-bindgen-cli --version <version> --locked` يثبّتها (و`NSH_WASM_BINDGEN` يسمّي أداة CLI في مكان آخر غير `PATH`). أما بيئة التشغيل التي تربط wasm-bindgen ولا تستدعي أي JS عبرها (من خلال الميزات الافتراضية لاعتماد ما) فتُبنى كما تُبنى كل بيئات التشغيل الأخرى.

يسمّي crate الواجهات التي يستخدمها على هيئة ميزات `web-sys`، وتثبيت `wasm-bindgen` يُبقي إصداره، وبالتالي إصدار CLI، ثابتًا من بناء إلى آخر:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

تُوقظ استدعاءات المتصفح الراجعة (callbacks) (وصول رسالة، أو مؤقّت للصفحة) مهام التطبيق، التي تعمل فورًا:

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

تعمل استدعاءات crate لواجهات المتصفح البرمجية بصلاحيات الصفحة نفسها، كما يعمل كود crate الأصلي بصلاحيات التطبيق على المنصات الأخرى: فقدرات `nsh.json` تحكم ما يمر عبر المحرك (`fetch`، وJS الخاصة بالتطبيق)، وقواعد المتصفح (CORS وسياسة Content-Security-Policy للصفحة) تحكم كل طلب تجريه الصفحة.

<a id="publish-an-app"></a>

## نشر تطبيق

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` يكتب `.nsh/out/<Name>/` (و`--out` لمجلد آخر)، بتنظيم يشبه ناتج بناء الواجهة الأمامية: صفحة واحدة وملفات تحمل أسماء مشتقة من محتواها.

| الملف | ما هو |
|---|---|
| `index.html` | صفحة التطبيق: اسمه عنوانًا لها، والأيقونات، وألوان `appearance` الخاصة به، ومؤشر تحميل، ورسالة حين يتعذر تحميل التطبيق أو تشغيله |
| `manifest.webmanifest` | الاسم والمعرّف والأيقونات والألوان التي تثبّت بها المتصفحات التطبيق |
| `nsh.<digest>.js` | بيئة تشغيل DOM مصغّرة (79 كيلوبايت، و22.5 كيلوبايت مع brotli) |
| `nsh.<digest>.wasm` | محرك Rust والتخطيط والمكوّنات، إضافة إلى crate التطبيق المكتوب بـ Rust نفسه. يعمل TSX في JavaScript المتصفح؛ ويربطه التغليف بالمكوّنات والوحدات القياسية التي تستوردها شاشة التطبيق الأولى فقط. |
| `nsh-<name>.<digest>.wasm` | المكوّنات والوحدات القياسية والمظلّلات (shaders) التي يستخدمها التطبيق بعد شاشته الأولى: تُنزَّل في الخلفية بعد ظهورها |
| `<file>.br`، `<file>.gz` | كل ملف مضغوط مسبقًا، للخوادم التي ترسل ملفات مضغوطة مسبقًا |
| `nsh-syntaxes.<digest>.bin` | قواعد الصياغة التي يُلوَّن بها الكود (مجموعة bat: ‏0.92 ميغابايت، و0.8 ميغابايت مع brotli)، تُنزَّل أول مرة تعرض فيها كتلة كود أو `Editor` أو `DiffView` كودًا بلغة ما |
| `nsh-bindgen.<digest>.js` | كود الربط (glue) في wasm-bindgen لتطبيق تستدعي crates فيه [واجهات المتصفح البرمجية من Rust](#browser-apis-from-rust)، مصغّر |
| `snippets.<digest>/<crate>-<hash>/…` | كود JS الخاص بتلك crates الذي يستورده كود الربط (`inline_js`، `module = "/js/…"`)، تحت المسارات التي يعطيها wasm-bindgen |
| `app.<digest>.js` | مدخل TSX المترجم على هيئة وحدة ES، يحمّله المتصفح. |
| `host.<digest>.js` | مضيف الصفحة، `nsh.json` `web.host` ([دوال المضيف](#the-hosts-functions)) |
| `<name>.<digest>.js` | وحدات ES تُحمَّل عند الطلب بواسطة `import()`. |
| `assets/<path>.<digest>.<ext>` | كل أصل يستورده التطبيق، يُحمَّل من عنوانه عند استخدامه (الخطوط قبل تشغيل الكود الذي يسجّلها، لأن النص يُقاس بها: قبل بدء التطبيق، أو مع الجزء (chunk) الذي يستوردها) |
| `icons/<size>.<digest>.png` | أيقونة `nsh.json` بقياس 32 (favicon) و180 (`apple-touch-icon`) و192 و512 بكسل |

`<digest>` هو بداية SHA-256 لمحتوى الملف: يتغير اسم الملف حين يتغير محتواه تمامًا، لذا لا يغيّر إصدار جديد إلا `index.html` والملفات التي تغيّرت فعلًا. تستخدم كل الروابط عناوين نسبية، فيعمل الموقع من أي مجلد على أي مضيف (`https://example.com/apps/counter/`).
<a id="runtime-size"></a>

### حجم بيئة التشغيل

يربط التحزيم لكل تطبيق `nsh.<digest>.wasm` خاصًا به، يضم المحرك ومكوّنات `nsh/base` والوحدات القياسية والمظلِّلات (shaders) التي تستوردها شاشة التطبيق الأولى. أما ما تستورده بقية شاشات التطبيق فيُنزَّل في الخلفية بعد ظهور الشاشة الأولى. التطبيق الذي تستدعي crates الخاصة به [واجهات المتصفح البرمجية من Rust](#browser-apis-from-rust) يحصل على بيئة التشغيل كاملةً، بما فيها crates الخاصة به، في `nsh.<digest>.wasm`. القياس بواسطة `nsh package --target web` (MB = 10^6 بايت):

| التطبيق | يستخدم | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | المكوّنات الأساسية | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | كل المكوّنات و`zlib` والمظلِّلات | 4.13 MB | 1.36 MB | 1.01 MB |

<a id="deploy-it"></a>

### النشر

ارفع المجلد إلى أي مضيف ثابت: مخزن كائنات خلف CDN، أو Cloudflare Pages، أو Netlify، أو GitHub Pages، أو nginx. قاعدتان تجعلان التحميل سريعًا والتحديث موثوقًا:

| الملفات | `Cache-Control` |
|---|---|
| `index.html`، `manifest.webmanifest` | `no-cache` (يُعاد التحقق منها عند كل تحميل، فيظهر الإصدار الجديد فورًا) |
| كل ما سواها | `public, max-age=31536000, immutable` |

قدِّم `.wasm` بنوع `application/wasm` (فتُجري المتصفحات ترجمته أثناء تنزيله)، وأرسل النسخ المضغوطة مسبقًا إلى المتصفحات التي تقبلها: `brotli_static on; gzip_static on;` في nginx، أو `file_server {
precompressed br gzip }` في Caddy، أو CDN يضغط بـ Brotli. مع Brotli يصغر حجم بيئة التشغيل بنحو الربع مقارنةً بـ gzip. `nsh package --target web --run` يقدّم الموقع بهذه الطريقة على `http://127.0.0.1:4173/`.

يعمل التطبيق المنشور للويب كما يعمل التطبيق الأصلي المحزَّم: كإصدار (release)، بالقدرات (capabilities) التي يعلنها `nsh.json` ([Sandbox and capabilities](./sandbox-and-capabilities.md))، وتطبيق TSX يعمل على محرك JavaScript في المتصفح. وعندما تقيّد هذه القدرات `network`، تحمل الصفحة أيضًا `connect-src` من نوع Content-Security-Policy يتضمن المضيفين المعلنين (وأصل الصفحة نفسها)، فيرفض المتصفح نفسه الطلبات وقفزات إعادة التوجيه إلى أي مضيف آخر. الخطأ الذي يمنع التطبيق من البدء يُعرض في الصفحة؛ أما الأخطاء اللاحقة فتذهب إلى console المتصفح.

<a id="embed-it-with-an-iframe"></a>

### التضمين باستخدام iframe

لا توجد واجهة تضمين على الويب: ضمِّن التطبيق المنشور باستخدام `<iframe>`. حجمه هو نافذة التطبيق:

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## التطوير في المتصفح

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

يبدأ خادم التطوير ويطبع عنوان صفحته، `http://127.0.0.1:8790/`: افتحه في أي متصفح. الصفحة مضيف تطوير مثل غيرها: تشغّل كل بناء للتطبيق، وتعرض أخطاء البناء وأخطاء وقت التشغيل فوق التطبيق، وترسل سجلات التطبيق إلى الطرفية. أي تغيير في crate تطبيق Rust يعيد بناء بيئة التشغيل الخاصة به وتحمّلها الصفحة المفتوحة تلقائيًا؛ وتُطبَّق تعديلات TSX في مكانها (التحديثات الفورية). تفتح الهواتف على الشبكة نفسها العنوان الذي يطبعه `nsh run` تحته (`on this network: http://192.168.…:8790/`). `nsh dev` يقدّم الصفحة نفسها متى توفرت بيئة تشغيل الويب (وهي دائمًا موجودة في التوزيعة).

<a id="build-the-websites-player"></a>

## بناء مشغّل الموقع

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

يحتوي مجلد المخرجات على:

| الملف | ما هو |
|---|---|
| `gallery/nsh.<digest>.wasm` | بيئة تشغيل المعرض، رُبطت له بواسطة `nsh package` (تستخدم كل المكوّنات و`zlib`: نحو 11.8 MB، و3.6 MB بعد gzip) |
| `gallery/nsh-syntaxes.<digest>.bin` | قواعد الصياغة التي تلوّن بها بيئة التشغيل الشيفرة، وتُجلب أول مرة يعرض فيها عرض توضيحي شيفرة بلغة ما |
| `nsh-playground.wasm` | المحتوى نفسه مع مترجم TSX الخاص بـ NSH، من أجل [playground](#the-playground) (نحو 8 MB، و2.4 MB بعد gzip) |
| `gallery/nsh.<digest>.js` | بيئة تشغيل DOM (مصغَّرة): تحمّل wasm، وتطبّق الدفعات، وتحوّل المدخلات إلى أحداث |
| `index.html` | صفحة مشغّل: تشغّل `demos/<name>.js` من أجل `#<name>` |
| `nsh.wasm`، `nsh.js`، `browser/` | بيئة التشغيل التي يحمّلها المشغّل: المحرك، وبيئة تشغيل DOM، ووحدات مضيف المتصفح |
| `demos/<name>.js` | كل عرض توضيحي مترجَم بواسطة `nsh build --release`: وحدة ES |
| `gallery/` | تطبيق المعرض المنشور بواسطة `nsh package --target web`، ويظهر في صفحة [Gallery](/gallery) |

قدِّم المجلد بأي خادم ثابت (يحتاج إلى نوع MIME ‏`application/wasm` للترجمة المتدفقة) ثم افتح `index.html#counter`.

<a id="the-playground"></a>

## الـ Playground

يحرّر [Playground](/playground) تطبيقًا ويشغّله في المتصفح: تترجم الصفحة TSX بمترجم JSX الخاص بـ NSH (المضمَّن في `nsh-playground.wasm`، من دون rolldown) وتشغّله على محرك JavaScript في المتصفح عند كل توقف عن الكتابة. لكل عرض توضيحي في هذا الموقع رابط **التحرير في Playground**، وتضع **مشاركة** الشيفرة في الرابط نفسه، فلا يُخزَّن شيء على خادم.

تطبيق Playground وحدة واحدة: يستورد وحدات NSH (`nsh` و`nsh/*`) لكن لا يستورد ملفات أو حزمًا أخرى. مخرجات `console.log` وأخطاؤه تظهر أسفل الهاتف.

المترجم أيضًا دالة Rust هي `nsh_bundler::compile_module(name, source, ui_sets)`، متاحة دون ميزة `bundle` الخاصة بالـ crate.

<a id="embed-it-in-a-page"></a>

## التضمين في صفحة

يُضمَّن تطبيق Rust بوصفه موقعه المنشور، في [iframe](#embed-it-with-an-iframe). أما لتطبيقات TSX فإن `nsh.js` وحدة ES. `createPlayer` تحمّل بيئة التشغيل في حاوية؛ و`runModule(url)` تبدأ حزمة (bundle) تكتبها `nsh build` (`bundle.js`، وحدة ES) على محرك JavaScript في المتصفح، في realm خاص بالتطبيق، وتحلّ محل ما كان يعمل. وتعيد promise يُحَلّ عند اكتمال تحميل الوحدة ويُرفَض بالخطأ الذي أوقفها، وهو ما يبلّغ عنه المشغّل أيضًا (`onError`):

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

`assets` (خريطة من مسارات `asset:/` إلى عناوين URL) تحلّ محل `assetBase`، و`readAsset(uri)` تعيد بايتات أصل (asset) يحتاجه المحرك فورًا (خط) أو `null`، و`data` تربط الملفات التي تجلبها بيئة التشغيل عند أول حاجة إليها بعناوينها (`syntaxes`: `nsh-syntaxes.<digest>.bin`؛ وافتراضيًا `nsh-<name>.bin` بجانب `nsh.js`)، و`glue` هو عنوان wasm-bindgen glue لبيئة تشغيل تستدعي crates الخاصة بها [واجهات المتصفح البرمجية من Rust](#browser-apis-from-rust) (`nsh-bindgen.<digest>.js`)، ويحمّله المشغّل مع بيئة التشغيل؛ و`player.runModule(url, { capabilities, appId })` يشغّل التطبيق بالقدرات التي يعلنها (`capabilities.json`) ويحفظ تخزينه تحت معرّف `nsh.json` الخاص به (وبدونه، تحت مسار الصفحة). الصفحة التي يكتبها `nsh package --target web` تستخدمها جميعًا.

`runModule(url, { chunks })` يقبل أيضًا موضع أجزاء (chunks) [الحزمة المقسَّمة](#split-bundles).

`player.runSource(code, { name, sourceMap, capabilities, appId })` يشغّل وحدة ES معطاة كنص مصدري، بالخيارات نفسها. مع `nsh-playground.wasm`، يترجم `player.compileAndRun(tsx, name, options)` شيفرة TSX أولًا، ويشغّلها بخيارات `runSource` ويُحَلّ بخطأ الترجمة، أو `null`؛ و`player.compile(tsx)` تعيد `{ code }` أو `{ error }`.

حجم الحاوية هو نافذة التطبيق (`windowSize()`)؛ وتغيير حجم الحاوية يغيّر حجم التطبيق. `player.setDark(true)` يبدّل المظهر أثناء التشغيل، وتلاحظه التطبيقات عبر الفئتين `colorScheme()` و`dark:`.

تغطي مربعات الحوار والتنبيهات الحاوية. ومع `dialogs: "viewport"` تغطي نافذة المتصفح كاملةً، كما تفعل مربعات الحوار الشرطية في الصفحات، بينما يحتفظ التطبيق بالحاوية نافذةً له: يُحسب تخطيط `Dialog` بحجم النافذة ومنطقتها الآمنة وينزلق من حافتها السفلية، وتغطي خلفيته الصفحة كلها، ولا تحرّك عجلة الفأرة فوقه الصفحة. يظهر مربع الحوار في الطبقة العليا للمتصفح (Chrome 114 وSafari 17 وFirefox 125 وما بعدها)، فيعلو بقية الصفحة أينما كانت الحاوية؛ وفي المتصفحات الأقدم يغطي الحاوية فقط.


`Sheet` يتبع إعداد العرض نفسه الذي يتبعه `Dialog` و`AlertDialog`. في iframe من الأصل نفسه، يغطي العرض عبر نافذة العرض (viewport) الصفحة الخارجية تلقائيًا، بينما يحتفظ التطبيق بحجم تخطيطه الأصلي.
يعود iframe إلى موضعه وحجمه الأصليين عند إغلاق آخر نافذة منبثقة؛ ويبقى محركه وحالته حيَّين.
تفعّل العروض التوضيحية في التوثيق هذا النمط من العرض.

أما في iframe من أصل مختلف أو داخل sandbox، فتسجّل الصفحة المضمِّنة المضيف قبل تحميل المشغّل:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

يقبل المضيف الطلبات الصادرة من نافذة iframe هذا، ويُبقي الصفحة المحيطة خاملة ويقفل تمريرها
أثناء ظهور نافذة منبثقة، ويستعيد الأمرين عند الإغلاق. كل حدّ تضمين بين أصلين مختلفين يتطلب
تعاون مضيفه؛ ودونه يبقى العرض ضمن ذلك المستند ويصدر المشغّل تحذيرًا.

<a id="the-hosts-functions"></a>

## دوال المضيف

على الويب تكون الصفحة هي مضيف التطبيق: تجيب عن `host.call(name, args)` الخاص بـ [`host`](../modules/nsh.md#host) وترسل الأحداث التي يستمع إليها `host.on`. `host` الخاص بـ `createPlayer` كائن تعيد `call(name, args)` فيه النتيجة، أو promise بها؛ وأي throw أو رفض يرفض استدعاء التطبيق برسالة الخطأ. `player.hostEvent(event, payload)` ترسل حدثًا بحمولة JSON (والحمولة التي ليست JSON تُطلق استثناءً). ومع `host` تكون `host.available()` هي `true`.

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

يحصل التطبيق المنشور على مضيفه من `nsh.json`: `web.host` يسمّي وحدة JS في مجلد التطبيق، نسبةً إلى `nsh.json`، تصدّر `createHost(player)`. `nsh package --target web` ينسخها إلى الموقع باسم `host.<digest>.js`، وتشغّل الصفحة `createHost` مع المشغّل قبل أن يبدأ التطبيق؛ وما تعيده (أو تُحَلّ به) يجب أن تكون له دالة `call`، وإلا أظهرت الصفحة أنه تعذّر تحميل التطبيق. المشغّل `createHost` يستلمه يرسل الأحداث من ذلك الحين:

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

يبحث المضيف عن كل اسم كما هو في جدول دوالّه، كما سبق، ويُبقي عناوين URL والمسارات من شأنه وحده: `capabilities.host` يمنح الأسماء بحسب بدايتها (`user.*`)، فالاسم الذي حوّله المضيف إلى مسار قد يصل إلى ما لا يشمله المنح. تمرّر بيئة التشغيل الأسماء التي طولها من 1 إلى 128 حرفًا من `A`–`Z`، و`a`–`z`، و`0`–`9`، و`_`، و`.`، و`:` و`-`، من دون `..`، وترفض استدعاء أي اسم آخر. ينتهي منح البادئة (prefix) بفاصل (`bridge.*`): `bridge*` يطابق `bridgeAdmin` أيضًا.

الأحداث المرسلة قبل أن يعمل التطبيق، مثل أحداث `createHost` نفسه، تُسلَّم بالترتيب فور بدء التطبيق، فتستقبلها مستمعات `host.on` في المستوى الأعلى من التطبيق. أما الحدث المرسل قبل تسجيل مستمع فلا يُعاد إرساله إليه: يقرأ التطبيق الحالة التي يبدأ بها عبر استدعاء (`host.call("user.info")`) ويتابع تغيّراتها عبر الأحداث.

تعمل وحدة المضيف في صفحة التطبيق وتشاركه Content-Security-Policy: فعندما تقيّد قدرات التطبيق `network`، يضم `connect-src` الخاص بالصفحة أصل الصفحة والمضيفين الذين يسردهم `capabilities.network` والمضيفين الذين يسردهم `web.connect`. `web.connect` يسمّي المضيفين الذين تصل إليهم طلبات وحدة المضيف نفسها (`fetch`، `XMLHttpRequest`، `WebSocket`)، بأنماط مثل أنماط `capabilities.network.hosts` (`api.example.com`، `*.example.com`، `"*"`)، كما في `api.example.com` أعلاه؛ أما طلبات التطبيق نفسه فتبقى مفحوصة مقابل `capabilities` الخاص به.

تُنسخ الوحدة كما هي، فهي تستورد الشيفرة الأخرى بعنوان URL مطلق. ويظل التطبيق يحتاج إلى [قدرة](./sandbox-and-capabilities.md) `host` لكل دالة يستدعيها. `nsh run --target web` يشغّلها في صفحة التطوير، و`nsh test` يشغّل الوحدة نفسها لكل تطبيق تفتحه اختباراته، سواء دون واجهة أو في متصفح (`--target web`)، فيُختبر التطبيق ومضيفه معًا ([Testing](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## المتصفح كمنصة

`platform.os` هي `"web"`. نوع الجهاز الذي يعمل عليه المتصفح يحدد سلوك التطبيق، كما يحدده `platform.idiom`:

- `"desktop"`: فأرة (مؤشر دقيق يدعم التمرير فوق العناصر) وحاوية عرضها 600 نقطة على الأقل. `platform.desktop` هي `true`، و`platform.select` يختار `desktop`، وتنطبق الخصائص `desktop={{…}}`.
- `"pad"`: شاشة لمس يبلغ ضلعها القصير 600 نقطة على الأقل؛ وغير ذلك `"phone"`. هذه أجهزة محمولة: `platform.select` يختار `mobile`.

يُحدَّد النمط (idiom) عند بدء التطبيق ويبقى ثابتًا طوال تشغيله، كما في كل منصة؛ فنافذة سطح المكتب الضيقة تظل سطح مكتب، ويُحسب تخطيطها بحسب `windowSize()`. خصائص `web={{…}}` والفئتان `platform.select({ web })` و`web:` تنطبق في المتصفحات فقط؛ أما `ios={{…}}` و`native` و`ios:` فلا تنطبق هناك.

تبلّغ الصفحة عن بقية البيئة وتُبقيها محدَّثة:

| القيمة | من المتصفح |
|---|---|
| اللغة المحلية (الافتراضية لـ `Intl`) | `navigator.languages[0]` |
| المنطقة الزمنية (الوقت المحلي لـ `Date`، والقيمة الافتراضية `timeZone` لـ `Intl`) | منطقة المتصفح (`Intl.DateTimeFormat().resolvedOptions().timeZone`)، بما فيها التوقيت الصيفي |
| اتجاه التخطيط (`rtl:` / `ltr:`) | `<html dir>` إن كان محدَّدًا، وإلا كتابة اللغة المحلية |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | حجم خط العنصر الجذر / 16 px (إعداد حجم النص في المتصفح) |
| `pixelRatio()` | `devicePixelRatio` (يتغير مع التكبير والشاشات) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` حيث تتداخل مع الحاوية (صفحات `viewport-fit=cover` على الهواتف) |
| `keyboardFrame()` | مقدار ما تغطيه لوحة المفاتيح التي على الشاشة من الحاوية (`visualViewport`) |

`platform.version` هي `"0.0"`، و`screenReaderEnabled()` تبقى `false` (فالمتصفحات لا تخبر بذلك). أشرطة المتصفح حول الصفحة تخص المتصفح؛ أما [`statusBar`](../modules/nsh-base.md#status-bar) الخاص بالصفحة فمخصص للهواتف.
<a id="networking"></a>

## الشبكات

`fetch` (مع التدفقات، `AbortController` و`FormData`) وعناوين URL الخاصة بـ `<Image>` تمر عبر حزمة الشبكة الخاصة بالمتصفح، بعد أن يتحقق NSH من [الصلاحيات](./sandbox-and-capabilities.md) الخاصة بالتطبيق. وبما أن الطلبات هي طلبات المتصفح، فإن قواعد المتصفح هي التي تنطبق:

- **عناوين URL النسبية** تُحلّ بالنسبة إلى عنوان الصفحة، كما في المتصفح: يصل التطبيق المنشور إلى واجهته البرمجية الخاصة عبر `fetch("/api/items")`، ويُحمَّل `<Image src="/photos/a.jpg" />` من خادمه الخاص. (المنصات الأصلية ليس لها صفحة، لذا تحتاج إلى عناوين URL مطلقة.)
- **CORS.** لا ينجح الطلب إلى أصل غير أصل الصفحة إلا إذا سمح ذلك الخادم بأصل الصفحة (`Access-Control-Allow-Origin`)؛ وإلا فإن `fetch` يُرفض بخطأ شبكة. ولا تظهر إلا ترويسات الاستجابة التي يكشفها الخادم.
- **ملفات تعريف الارتباط** (ومصادقة HTTP) تُرسل إلى أصل الصفحة نفسها فقط (`credentials: "same-origin"`)، وتُسقَط الترويسات التي يمنعها المتصفحات (`Cookie` و`User-Agent` و`Host` وغيرها).
- **عمليات إعادة التوجيه** يتبعها المتصفح. أما الطلب المُعاد توجيهه والذي يجب ألا يتبع إعادة التوجيه فيفشل: `redirect: "manual"` و`"error"`، وكذلك طلبات تطبيق تقيّد صلاحياته `network` (يتحقق NSH من كل قفزة، ولا تكشف المتصفحات إعادة التوجيه قبل أن تتبعها).
- **أجسام الطلبات** التي هي `ReadableStream` تُجمع أولاً وتُرسل دفعة واحدة؛ أما أجسام الاستجابات فتُبثّ تدفقياً فور وصولها.

<a id="split-bundles"></a>

## الحزم المقسّمة

لا يحتاج تطبيق ويب بـ TSX إلى تنزيل كل شيفرته قبل ظهور الشاشة الأولى (أما تطبيق Rust فهو `nsh.wasm` واحد،
يجمّعه المتصفح أثناء تنزيله). `nsh package --target web` ينشر تطبيقات TSX مقسّمة، مع كل جزء بصيغة `<name>.<digest>.js` وتربط الصفحة الأجزاء بتلك الملفات. ولتقسيم حزمة بنفسك، يضع `nsh build --split` الوحدات التي يحمّلها `import()` في أجزاء خاصة بها، بجانب `bundle.js`:

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

أول `import("./Screen")` ينزّل `Screen.js` والأجزاء التي يستوردها، كلها دفعة واحدة، ثم يقيّمها؛ وتُحلّ عمليات الاستيراد اللاحقة له فوراً. وتحدد الصفحة مكان الأجزاء: افتراضياً بجانب الحزمة، أو عنوان URL لكل جزء، للملفات التي أُعيدت تسميتها بملخّص المحتوى ليتمكن CDN من تخزينها مؤقتاً إلى الأبد:

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

الجزء الذي يتعذر تنزيله يرفض `import()` بـ `TypeError` يسمّيه؛ و`import()` التالي يعيد المحاولة. أسماء الأجزاء هي أسماء ملفات ثابتة من الحزمة: لا يستطيع التطبيق أن يجعل الصفحة تنزّل أي شيء آخر.

يحمّل [المعرض](/gallery) كل عرض توضيحي بهذه الطريقة: `lazy` (في `examples/gallery/ui.tsx`) ينشئ مكوّناً يبدأ الاستيراد عند أول عرض له، ويُظهر عنصراً نائباً إلى أن يكتمل، ثم يعرض ما حمّله. وأول تحميل له هو الفهرس والعرض التوضيحي الذي يظهر أولاً؛ أما الخط الذي يستورده عرض توضيحي فيأتي مع جزء ذلك العرض. وتحتوي البنى الأصلية على كل الوحدات، لذا يُحلّ الاستيراد فيها فوراً:

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## القيود

المتصفح هو من يقرر هذه القيود، والواجهة الخلفية للويب تتبعه:

- **عروض الويب لمواقع أخرى**: `WebView` هو `<iframe>`. أما HTML المضمَّن (`html`) فيحصل على كل شيء: `onMessage` و`postMessage` و`injectJavaScript` والسكربتات المحقونة وأحداث التحميل (ويعمل بأصل خاص به، منفصل عن الصفحة). أما صفحة من موقع آخر فلا تحصل إلا على `postMessage` وأحداث التحميل مع عنوان URL الذي أُعطيته: تخفي المتصفحات تنقلاتها وعنوانها وسجلها وأخطاءها عن الصفحة المحيطة بها، ولا يمكن تعيين `userAgent`.
- **مقاطع الفيديو ذات الصوت التي تبدأ من تلقاء نفسها**: `Video` هو `<video>` بكل الخصائص والأحداث، لكن المتصفحات لا تشغّل فيديو بصوت إلا بعد إيماءة من المستخدم (أما المقاطع المكتومة فتعمل).
- **المكوّنات الأصلية**: المكوّنات الأصلية المسجَّلة تخص التطبيقات الأصلية التي تضمّن NSH؛ وعلى الويب يبقى عرضها فارغاً، مع تحذير في وحدة التحكم.
- **خدمات المنصة**: قراءة الحافظة (`Clipboard.readText`، وكذلك `hasText`) تتطلب سياقاً آمناً (HTTPS) وقد تطلب إذن المستخدم. والصور لا تُبلغ عن `onProgress`.
- **تفاصيل تشكيل النص**: كسر الأسطر مجموعة جزئية من UAX #14 (المسافات وCJK والواصلات وقواعد بداية الأسطر ونهايتها لعلامات ترقيم CJK: علامات الإغلاق مثل `。` و`，` و`」` لا تأتي في بداية السطر، وعلامات الفتح مثل `（` و`「` لا تأتي في نهايته)، دون تقطيع مقطعي ودون إعادة ترتيب ثنائية الاتجاه تتجاوز اتجاه الفقرة.

يشغّل المشغّل (player) وخادم التطوير التطبيقات بإعدادات التطوير؛ أما التطبيقات المنشورة فتعمل بوصفها إصدارات نهائية. وكلاهما يشغّل شيفرة تطبيق TSX على محرك JavaScript الخاص بالمتصفح، في نطاق (realm) خاص بالتطبيق.

<a id="see-also"></a>

## انظر أيضاً

- [التغليف](./packaging.md): الأهداف الأخرى لـ `nsh package`.
- [البنية](./architecture.md): المحرك والنواة ودفعات التركيب التي يعيد بناء الويب استخدامها.
- [الاختبار](./testing-and-trace.md): `nsh test` يشغّل المحرك نفسه دون واجهة رسومية، بمحرك نصوص تقريبي.
