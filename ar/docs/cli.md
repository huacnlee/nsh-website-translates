---
title: "واجهة سطر الأوامر (CLI)"
description: "جميع الأوامر الفرعية والخيارات في NSH - init وbuild وtest وcheck وdev وrun وpackage، وأوامر التوقيع keygen وcertify وpublish وverify وsymbolicate وrevoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---

# CLI

`nsh` هي الأداة التي يُبنى بها تطبيق NSH، بلغة Rust أو TSX. يقبل كل أمر فرعي يبني تطبيقًا `[ENTRY]`: دليل التطبيق (الافتراضي: الدليل الحالي، ولذلك يعمل `cd my-app && nsh run`)، وهو يشغّل المكوّن الجذري لتطبيق Rust (`nsh.json` `"root"`) أو `App.tsx` لتطبيق TSX، أو وحدة مدخل TSX. يقرأ `nsh.json` في جذر التطبيق ويحدّث تعريفات الأنواع في `.nsh/types`.

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

يطبع `nsh <command> --help` خيارات الأمر؛ ويطبع `nsh -V` (`--version`) الإصدار ونسخة Git التي بُني منها.

<a id="output"></a>

## المخرجات

يطبع كل أمر سطرًا واحدًا لكل خطوة، ولا يطبع التفاصيل إلا عند الفشل:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` خطوة منتهية، و`→` مكان الاتصال، و`•` ما فعله الجهاز؛ وأسطر `warn` و`error` هي المشكلات، والأسطر العادية هي مخرجات تطبيقك نفسه (`console.log`). في الطرفية يعرض مؤشر دوّار الخطوة الجارية، وتُلوَّن الأسطر (ما لم يُضبط `NO_COLOR`)؛ وعند إعادة التوجيه إلى ملف تُكتب أسطر النتائج فقط، دون ألوان.
تُطبع مخرجات الأدوات التي يشغّلها NSH (cargo لحزمة Rust الخاصة بالتطبيق، ومضيفات التطوير) أسفل سطر `error` عند فشل إحداها.

يطبع `-v, --verbose` (في أي أمر؛ وكذلك `NSH_VERBOSE=1`) كل شيء فور حدوثه: كل سطر سجل مع مستواه ومصدره، ومخرجات cargo والمضيفات نفسها.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

ينشئ تطبيقًا في `DIR` (الافتراضي: الدليل الحالي، ويُنشأ إن لم يكن موجودًا) من قالب. بدون `--template` يسأل `nsh init` عن القالب في الطرفية (يختار Enter القالب `ts`)، ويستخدم `ts` في غيرها (نص برمجي، CI).

| القالب | ما ينشئه |
|---|---|
| `rust` | تطبيق مكتوب بلغة Rust: مشروع Cargo (`Cargo.toml`، و`src/lib.rs` مع المكوّن الجذري، و`src/main.rs` لـ `cargo run`)، و`nsh.json` مع `"rust": "."` و`"root": "App"`، واختبار الجذر `App.test.tsx` مع `tsconfig.json` و`.nsh/types`، و`.gitignore` وملف README يشرح أيضًا كيفية إضافة مدخل TSX لاحقًا. يركّب `nsh run` و`nsh package` الجذر دون QuickJS على كل منصة مستهدفة (ويفتحه `nsh test` لاختبارات TypeScript)، بما في ذلك المتصفح ([البناء باستخدام Rust](./rust.md))؛ ويشغّله `cargo run` مباشرة على macOS أو Windows أو Linux. |
| `ts` | تطبيق TSX: `App.tsx`، واختباره `App.test.tsx` (`nsh test`)، و`nsh.json` و`tsconfig.json` و`.gitignore` و`.nsh/types`. تُحفظ الملفات الموجودة؛ ويفشل الأمر فقط إذا كانت جميعها موجودة مسبقًا. |
| `mixed` | تطبيق TSX مع حزمة Rust خاصة به في جذره: `App.tsx`، واختباره `App.test.tsx`، و`tsconfig.json`، و`nsh.json` مع `"rust": "."`، و`.gitignore`، و`.nsh/types`، وملف README، والحزمة بجوار `App.tsx` (`Cargo.toml`، `src/lib.rs`)، التي يصدّر `#[native_module("<name>/native")]` فيها مكوّنًا ووحدة وصنفًا يستخدمها `App.tsx`. وعند عدم وجود `"root"` يكون `App.tsx` هو المدخل. |

| الخيار | الوصف |
|---|---|
| `--name <NAME>` | اسم العرض المكتوب في `nsh.json`. الافتراضي: اسم الدليل. يصبح المعرّف `com.example.<name>` (أحرف وأرقام فقط، بأحرف صغيرة)، ومحدّد الاستيراد للحزم `<name>/native` (بأحرف صغيرة، والكلمات موصولة بـ `-`). |
| `--template <TEMPLATE>` | `rust` أو `ts` أو `mixed` (أعلاه). يحتاج `rust` و`mixed` إلى Rust؛ ويحتاج `cargo run` أيضًا إلى مكتبات التطوير الخاصة بالواجهة الخلفية لسطح المكتب الأصلية. |
| `--nsh-source <DIR>` | مع `rust` أو `mixed`: تعتمد الحزم على حزم NSH الموجودة في النسخة المسحوبة في `DIR`، عبر المسار، لبناء التطبيق على مصادر NSH. |

تعتمد حزم `rust` و`mixed` على حزم NSH من crates.io بإصدار CLI (ومع `--nsh-source` على حزم نسخة مسحوبة)، وتبني أوامر `nsh` مشغّلات التطبيق ومضيفاته من الحزم نفسها. قبل كل أمر على تطبيق كهذا يبني `nsh` برنامجًا صغيرًا من حزم التطبيق ونواة NSH يصف مكوّناتها ووحداتها وأصنافها، ويشغّله عند تغيّر الحزم؛ وبهذا الوصف يقوم CLI نفسه بتجميع التطبيق وترجمته وفحص أنواعه وتقديمه وتغليفه. وتترجم عمليات بناء تطبيق Rust حزمه ونواة NSH وحدها. أنشئها في دليل تطبيق جديد: يُبلَّغ عن وجود أي من ملفاتها كتعارض قبل كتابة أي شيء.

تستخدم التطبيقات التي تعتمد حزم Rust الخاصة بها على NSH عبر Git النسخة المسحوبة التي يحلّها Cargo في ملف القفل الخاص بالتطبيق. وتشترك المضيفات المولّدة في هذه النسخة، بما في ذلك تبعيات NSH التي تُعاد توجيهها بواسطة رقعات Cargo الخاصة بالتطبيق.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

بالنسبة إلى مدخل TSX، يبدأ `nsh run` خادم التطوير (كما يفعل `nsh dev`)، ويشغّل مضيف تطوير يحمّل التطبيق منه، ويعيد البناء عند كل حفظ. يرقّع استبدال الوحدات الفوري (Hot module replacement) التطبيق الجاري في مكانه؛ وتُطبع سجلات التطبيق وأخطاؤه في الطرفية. أوقفه بـ Ctrl-C (أو بإغلاق نافذة Catalyst أو macOS أو Linux أو Windows أو GPUI). وأيًا كانت طريقة انتهائه (Ctrl-C، أو `kill` / `pkill`، أو خطأ)، فإنه يوقف المضيف الذي بدأه: تطبيق Catalyst، أو مضيف macOS أو Linux أو Windows أو GPUI، أو مضيف التطوير في المحاكي، أو على جهاز Android.

يعمل تطبيق Rust (`nsh.json` `"root"`، [البناء باستخدام Rust](./rust.md)) دون خادم تطوير ودون QuickJS: يبني `nsh run` مشغّل التطبيق للمنصة المستهدفة مع تركيب جذره، ويشغّله (على أجهزة سطح المكتب بناء تصحيح وسجلاته في الطرفية؛ وفي المحاكي وعلى Android يُثبَّت التطبيق)، وعند تغيّر شيفرة Rust في الحزمة يبنيها مجددًا ويعيد تشغيله. ومع `--target web` يطبع عنوان الصفحة، وتحمّل الصفحة المفتوحة بيئة التشغيل الجديدة من تلقاء نفسها. سمِّ مدخل TSX (`nsh run App.tsx`) لتشغيله بدلًا من ذلك.

| الخيار | الافتراضي | الوصف |
|---|---|---|
| `--target <TARGET>` | `macos` على macOS، و`linux` على Linux، و`windows` على Windows | `catalyst`: مضيف Mac Catalyst، نافذة بحجم iPhone (390×844). `ios`: المضيف في محاكي iOS. `android`: المضيف على جهاز Android أو محاكيه. `macos`: مضيف AppKit، نافذة 1200×800 ([macOS](./macos.md)). `linux`: مضيف GTK، نافذة 390×844 ([Linux](./linux.md)). `windows`: مضيف Win32، نافذة 1200×800 ([Windows](./windows.md)). `gpui`: مضيف GPUI، نافذة 1200×800، على macOS أو Windows أو Linux، يعرض تطبيق TSX كما تعرضه تطبيقات GPUI التي تضمّنه ([GPUI](./gpui.md)). `web`: صفحة خادم التطوير، على العنوان الذي يطبعه ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | محاكي iOS المراد استخدامه، بالاسم (`"iPhone 16 Pro"`) أو UDID. الافتراضي: محاكٍ قيد التشغيل، وإلا أحدث iPhone، ويُشغَّل. |
| `--port <PORT>` | `8790` | منفذ خادم التطوير. يستبدل جلسة تطوير NSH السابقة على هذا المنفذ بعد اكتمال تنظيفها. |
| `--release` | | يصغّر الشيفرة ويزيل معلومات التصحيح. لا تتضمن حزم الإصدار استبدال الوحدات الفوري: كل حفظ يعيد تحميل التطبيق. |
| `--limits [<LIMITS>]` | | يشغّل التطبيق كتطبيق مضمَّن في تطبيق آخر، ضمن الحدود التي يضعها تطبيقه المضيف: `memory` و`stack` (في `KB` أو `MB` أو `GB`)، و`load` و`call` (في `ms` أو `s`) و`nodes`، مثل `--limits memory=128MB,call=500ms`. أما ما لم يُذكر فيحتفظ بالقيم الافتراضية للتضمين، وهي التي يعمل بها `--limits` وحده ([البيئة المعزولة والقدرات](./sandbox-and-capabilities.md#limits)). وبدونه يعمل التطبيق مستقلًا، كما يعمل التطبيق المغلَّف. مداخل TSX. |
| `--trace` | | يسجّل المضيف في الطرفية توقيت كل عملية commit (JS، التخطيط، عناصر التركيب). |
| `--fps` | | مراقب الأداء: معدل الإطارات، وكلفة الإطارات وعمليات commit، ووحدة المعالجة المركزية، ووحدة معالجة الرسومات، والذاكرة، ويُعرض فوق التطبيق على macOS ([macOS](./macos.md#performance-monitor)) ويُسجَّل مرة كل ثانية على macOS وLinux وWindows وiOS. |
| `--name <NAME>` | اسم `nsh.json` | اسم عرض التطبيق في شريط القوائم وعنوان النافذة الأولي (`--target macos`، مداخل TSX). |
| `--window-size <WIDTHxHEIGHT>` | افتراضي المضيف | حجم النافذة الأولي بالنقاط، مثل `800x600` (`--target macos` و`linux` و`windows` و`gpui`، مداخل TSX). |
| `--display <N>` | الشاشة الرئيسية | الشاشة التي تُفتح عليها النافذة في المنتصف: `1` هي الشاشة الأساسية (التي عليها شريط القوائم)، و`2` التي تليها، وهكذا؛ وإذا لم توجد شاشة بالرقم المحدد تُفتح على الشاشة الرئيسية (`--target macos`، مداخل TSX). |

مع `--target android` يُستخدم أول جهاز يعرضه `adb devices`؛ ويُمرَّر إليه منفذ خادم التطوير بواسطة `adb reverse`. راجع [البدء](./getting-started.md#run-it) و[خادم التطوير وتصحيح الأخطاء](./dev-server-and-debugging.md).

ينتظر الاستبدال حتى عشر ثوانٍ لتنتهي الجلسة السابقة من التنظيف. وإذا كان المنفذ مشغولًا ببرنامج آخر، أو بإصدار أقدم من NSH CLI، يظهر خطأ يسمّي المنفذ. استخدم قيم `--port` مختلفة لتشغيل عدة تطبيقات معًا؛ ويطلب `--port 0` من نظام التشغيل منفذًا حرًا.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

يبدأ خادم التطوير ويفتح المضيف الأصلي لهذا النظام: AppKit على macOS، وGTK على Linux، وWin32 على Windows. اختر `--target ios` أو `--target android` صراحةً للتطوير على الأجهزة المحمولة. يخدم `--server-only` المضيفات التي تشغّلها بنفسك. يبني الخادم التطبيق، ويراقب دليل المدخل، ويدفع كل إعادة بناء إلى المضيفات المتصلة. ومع `--server-only` يطبع عنوان URL للمضيفات على هذا الجهاز وعنوانًا واحدًا لكل عنوان LAN للأجهزة، وعند توفر بيئة تشغيل الويب يطبع الصفحة التي تفتحها المتصفحات لتشغيل التطبيق ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

استخدم `nsh dev --server-only` مع تطبيق يضمّن حزمة تطوير البرمجيات الخاصة بالتطوير (`NativeShellDev.xcframework`، `nsh-dev.aar`). تعمل `--target` و`--device` و`--port` و`--release` و`--limits` كما في `nsh run`؛ ويحدد `--server-only` خادمًا دون مضيف مشغَّل.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

يشغّل اختبارات التطبيق دون واجهة ([الاختبار](./testing-and-trace.md)): ملفات الاختبار (`*.test.tsx`، `*.test.ts`، التي تستورد `nsh/test`) في `PATH`، وهو دليل (الافتراضي: الدليل الحالي؛ وتُتجاوز الأدلة المخفية و`node_modules` و`target`)، أو ملف الاختبار `PATH`. وعند إعطائه دليل تطبيق له حزم Rust خاصة به (`nsh.json` `"rust"`: تطبيق Rust أو تطبيق TSX له حزمة)، يشغّل أولًا `cargo test` لكل حزمة في الدليل، داخل دليل الحزمة نفسها، ويعرض كل اختبار Rust ويحسبه مع اختبارات TypeScript، تحت ملف هدف اختباره (`src/lib.rs › tests::adds`)؛ ويُختبر بهذه الطريقة أيضًا تطبيق Rust الذي له اختبارات Rust فقط. يعمل كل ملف اختبار على محرك خاص به، وكل تطبيق تفتحه اختباراته على محرك آخر جديد. يطبع سطرًا لكل اختبار، وعند الفشل يطبع ما رُمي، ومكانه في ملف الاختبار، والنصوص الظاهرة على الشاشة؛ وأي فشل يجعله ينتهي برمز غير صفري. وعند إعطائه مدخل التطبيق (`nsh test App.tsx`؛ ومدخل تطبيق Rust: `nsh test nsh.json`)، يفتح التطبيق على الشبكة، ويتركه يعمل 1.2 ث، وينفّذ الخطوات التي يعطيها الإدخال القياسي (`await app.press("Add")`، حيث `app` هو التطبيق). يعمل تطبيق TSX في عملية CLI نفسها؛ ويعمل التطبيق ذو حزم Rust الخاصة في مشغّل بلا واجهة مبني معها، يبني CLI المداخل له. تتصرف التشغيلات بلا واجهة كما يتصرف iOS ما لم يفتح اختبار التطبيق على أنه Android (`open` في `platform`): `platform.os` هي `"ios"`، وتنطبق أصناف `ios:` وخصائص `ios={{…}}`.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| الخيار | الوصف |
|---|---|
| `--filter <NAME>` | يشغّل فقط الاختبارات التي يحتوي اسمها (بعد أسماء كتل `describe` التي هو داخلها) على `NAME`؛ وبالنسبة إلى الحزم، `cargo test <NAME>`. |
| `--trace` | يطبع كل دفعة تركيب للتطبيقات التي تفتحها الاختبارات، تحت الخطوة التي جاءت فيها (`── press(Add): 7 items`)، ووقت كل عملية commit: كلفة أول إطار، أو خطوة، أو إطار تمرير. ومع `--target` يطبع دفعات المضيف وتوقيتاته. |
| `--fps` | مع `--target linux` أو `macos` أو `windows` أو `ios`: يسجّل المضيف قراءات مراقب أدائه مرة كل ثانية (معدل الإطارات، ومراحل الإطار، وعمليات commit، ووحدة المعالجة المركزية، والذاكرة)، وتُعرض بواسطة `-v`. |
| `--junit <FILE>` | يكتب النتائج أيضًا إلى `FILE` كتقرير JUnit XML، وهي الصيغة التي تعرض منها خدمات CI نتائج الاختبار: `testsuite` لكل ملف اختبار، و`testcase` لكل اختبار. |
| `--target <TARGET>` | يشغّل التطبيقات التي تفتحها الاختبارات على مضيف التطوير لهذه المنصة بدلًا من تشغيلها بلا واجهة (`macos` و`linux` و`windows` و`gpui` و`web` و`ios` و`android`؛ ويشغّلها `web` في Chrome أو Edge أو Chromium بلا واجهة): تتصرف الخطوات بإدخال المنصة نفسها ([الاختبار](./testing-and-trace.md#on-a-real-platform))، ويفحص `open` خياراته مقابل المنصة ويرفض الخيار الذي لا يستطيع تلبيته (`ERR_NSH_TEST_UNSUPPORTED`: `width` و`height` على iOS وAndroid، أو `platform` لنوع آخر من الأجهزة). تعمل اختبارات Rust للحزم على هذا الجهاز، في التشغيلات التي لا تتضمن `--target`. |
| `--browser <PATH>` | ملف Chrome أو Edge أو Chromium التنفيذي الذي يشغّل `--target web` التطبيقات فيه (الافتراضي: المثبّت على هذا الجهاز). |
| `--display <N>` | مع `--target macos`: الشاشة التي تُفتح عليها نوافذ التطبيقات في المنتصف: `1` هي الشاشة الأساسية (التي عليها شريط القوائم)، و`2` التي تليها، وهكذا؛ وإذا لم توجد شاشة بالرقم المحدد تُفتح على الشاشة الرئيسية. افتراضيًا تُفتح على شاشة ثانوية (أول شاشة غير الأساسية، وليست نسخة مطابقة لها)، فيبقى تشغيل الاختبارات على شاشة خاصة به، وعلى الشاشة الأساسية إذا كانت الوحيدة. تعمل الاختبارات بالطريقة نفسها على كل شاشة. |
| `--web-host <JS>` | وحدة مضيف صفحة الويب التي تحصل عليها التطبيقات المفتوحة بلا واجهة (الافتراضي: `nsh.json` `web.host`؛ وهي تصدّر `createHost(player)`): تجيب عن استدعاءات [`host`](../modules/nsh.md#host) الخاصة بها، ويصل `player.hostEvent` الخاص بها إلى `host.on` ([الاختبار](./testing-and-trace.md#the-pages-host)). التشغيلات بلا واجهة فقط؛ ويشغّل `--target web` `web.host` الخاص بـ `nsh.json`. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

يفحص أنواع التطبيق. إذا كان للتطبيق حزم Rust خاصة به (`nsh.json` `"rust"`) فتُفحص كل حزمة أولًا بالأمر `cargo check --all-targets` داخل مجلد الحزمة، بما في ذلك اختباراتها؛ وتجعل أخطاء Cargo الأمر ينتهي برمز خروج غير صفري. ثم يُفحص تطبيق Rust (`"root"`) بقدر ما فيه من TypeScript: فإذا وُجد `tsconfig.json` (الذي يكتبه `nsh init --template rust` من أجل `App.test.tsx`) فُحصت أنواع ملفات الاختبار فيه أيضًا. يحدّث فحص TypeScript الملفين `.nsh/types` و`.nsh/tsconfig.json`، ثم يشغّل `tsc -p <app directory> --noEmit` مع `tsconfig.json` الخاص بالتطبيق. ويستخدم TypeScript 7، وهو المترجم الأصلي الذي لا يحتاج إلى Node: ينزّله التشغيل الأول من سجل npm (نحو 9 ميغابايت)، ويتحقق منه بالمجموع الاختباري الذي يسجّله NSH، ثم يحفظه في ذاكرة NSH المؤقتة (`~/Library/Caches/nsh` على macOS، و`~/.cache/nsh` على Linux، و`%LOCALAPPDATA%\nsh` على Windows، أو `NSH_CACHE`). وتجعل أخطاء الأنواع الأمر ينتهي برمز خروج غير صفري. ويحذّر إذا كان `tsconfig.json` لا يمتد من `./.nsh/tsconfig.json`، وهو الملف الذي يحتفظ فيه NSH بإعدادات TypeScript ([بنية المشروع](./project-structure.md#tsconfigjson-and-nshtypes)).

| العلامة | الوصف |
|---|---|
| `--tsc <TSC>` | شغّل هذا `tsc` بدلًا من الافتراضي (وأيضًا `NSH_TSC`)، مثل ملف من `node_modules` أو نسخة للأجهزة التي لا تتصل بالشبكة. |
| `-- <TSC ARGS>` | يُمرَّر إلى `tsc`، مثل `nsh check -- --pretty false`. |

تبقى الملفات التي يولّدها NSH ضمن `.nsh/`: التصريحات، ومصادر المشغّلات، ومخرجات البناء والتغليف الافتراضية في
`.nsh/out/`. ويحتفظ Cargo بذاكرته المؤقتة المعتادة `target/` وبسلوكه الحالي `CARGO_TARGET_DIR`؛ ولا يضيف NSH
أي إعداد لـ Cargo لنقلها. ويظل `--out` يتجاوز موقع المخرجات.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

يبني التطبيق. بالنسبة إلى تطبيق Rust (`nsh.json` `"root"`)، يبني حزم التطبيق ويصفها ويكتب `app.json` والملفات التي تُشحن معها (`assets/`): وتركّب مشغّلاته الجذر. أما تطبيق TSX فيجمّع التطبيق في حزمة واحدة ويترجمها إلى bytecode خاص بـ QuickJS، وذلك للتطبيقات التي تضمّن NSH وتشحن الحزمة بنفسها.

| العلامة | الافتراضي | الوصف |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | مجلد المخرجات. |
| `--release` | | يصغّر الحجم ويزيل معلومات التنقيح. |
| `--split` | | يضع ما يحمّله `import()` في ملفات أجزاء مستقلة، تُنزَّل عند أول استيراد (لتطبيقات الويب، راجع [الحزم المقسّمة](./web.md#split-bundles)). وبدونه تحتوي الحزمة على التطبيق كله. |

ويكتب:

| الملف | المحتوى |
|---|---|
| `bundle.js` | الحزمة بصيغة JavaScript |
| `bundle.js.map` | خريطة المصدر الخاصة بها (تُعاد مسارات الأخطاء إلى مصادرك) |
| `bundle.nshc` | الحزمة بصيغة bytecode مترجم: وهو ما تحمّله التطبيقات |
| `<Chunk>.js`، `<Chunk>.js.map`، `<Chunk>.nshc` | مع `--split`: كل جزء وخريطة مصدره وbytecode الخاص به (`Screen.js` لـ `import("./Screen")`) |
| `capabilities.json` | `capabilities` الخاص بـ `nsh.json` إن كان مصرَّحًا به (ويُحذف إن لم يكن) |
| `assets/` | كل صورة وخط مستوردَين، في مسارهما النسبي إلى جذر التطبيق |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

يبني تطبيقًا قابلًا للتثبيت في وضع الإصدار. يُغلَّف تطبيق Rust (`nsh.json` `"root"`) بمشغّله الخاص، المبني بواسطة Cargo من حزمك وحزم NSH، مع تركيب جذره دون QuickJS ([البناء باستخدام Rust](./rust.md))؛ أما تطبيق TSX فيُغلَّف بالمشغّل الجاهز. ولا يدخل في ذلك مشروع Xcode ولا بناء Gradle: يجمّع NSH حزمة التطبيق بنفسه ويستخدم `actool` و`codesign` من Xcode (على iOS) أو `aapt2` و`zipalign` و`apksigner` من SDK (على Android)؛ وعلى macOS يجمّع `.app` موقّعًا توقيعًا مؤقتًا (ad hoc) باستخدام `codesign` (و`sips` للأيقونة)؛ وعلى Linux ينسخ المشغّل ويكتب `.tar.gz` باستخدام `tar`؛ وعلى Windows ينسخ المشغّل ويضمّن الأيقونة ويكتب `.zip` دون أي أدوات؛ وللويب يكتب موقعًا ثابتًا دون أي أدوات. وتأتي البيانات الوصفية من `nsh.json` وتتجاوزها العلامات.

| العلامة | الوصف |
|---|---|
| `--target <TARGET>` | مطلوب. `ios`: أجهزة iOS، `.ipa` موقّع (أو `.app` غير موقّع بدون `--sign`). `ios-simulator`: `.app` موقّع توقيعًا مؤقتًا (ad hoc). `android`: `.apk` موقّع. `macos`: `.app` موقّع توقيعًا مؤقتًا (ad hoc) ([macOS](./macos.md#packaging)). `linux`: مجلد `<Name>/` (الملف التنفيذي، و`nsh/`، وملف `.desktop`) و`<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows`: مجلد `<Name>\` (`<Name>.exe`، `nsh\`) و`<Name>.zip` ([Windows](./windows.md#packaging)). `web`: مجلد `<Name>/`، وهو موقع ثابت (`index.html` وملفات تُسمّى بمحتواها) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | مجلد المخرجات (الافتراضي `.nsh/out`). |
| `--name <NAME>` | الاسم المعروض. |
| `--id <ID>` | معرّف الحزمة، مثل `com.example.app`. |
| `--app-version <VERSION>` | الإصدار، مثل `1.2.0`. |
| `--build <BUILD>` | رقم البناء. |
| `--icon <ICON>` | أيقونة التطبيق: صورة PNG مربعة، ويفضّل أن تكون 1024×1024. |
| `--sign <IDENTITY>` | أجهزة iOS: هوية توقيع الشيفرة، مثل `"Apple Development: …"`. |
| `--profile <FILE>` | أجهزة iOS: ملف التزويد (`.mobileprovision`). وتأتي الصلاحيات (entitlements) منه. |
| `--keystore <FILE>` | Android: مخزن مفاتيح الإصدار. الافتراضي: مفتاح التنقيح في `~/.android/debug.keystore` (ويُنشأ إن لم يوجد). |
| `--key-alias <ALIAS>` | Android: اسم المفتاح المستعار في مخزن المفاتيح. |
| `--keystore-password <PASSWORD>` | Android: كلمة مرور مخزن المفاتيح. وتُقرأ أيضًا من `NSH_KEYSTORE_PASSWORD`. |
| `--abi <ABI>` | Android: واجهات ABI الخاصة بملف APK (`arm64-v8a`، `armeabi-v7a`، `x86_64`)، مكررة أو مفصولة بفواصل. الافتراضي: `arm64-v8a` و`armeabi-v7a`، مع واجهة الجهاز عند استخدام `--run`. |
| `--run` | يثبّت التطبيق ويشغّله بعد ذلك: في المحاكي (`ios-simulator`) أو على جهاز Android المتصل؛ ويشغّله كل من `macos` و`linux` و`windows`؛ ويخدم `web` الموقع على هذا الجهاز في العنوان الذي يطبعه. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

راجع [التغليف](./packaging.md).

<a id="signing-commands"></a>

## أوامر التوقيع

تُنشئ هذه الأوامر حزمًا موقّعة (`.nshpkg`) وتتحقق منها: وهي حزم تطبيقات تنزّلها التطبيقات التي تضمّن NSH وتتحقق منها قبل تشغيلها. يشرح [الحزم الموقّعة](./signed-packages.md) النموذج المتّبع (مفتاح جذر يُحفظ دون اتصال يصدّق على مفاتيح إصدار لبعض معرّفات التطبيقات).

### nsh keygen

```sh
nsh keygen <NAME>
```

يُنشئ زوج مفاتيح Ed25519: `<NAME>.secret` و`<NAME>.pub` (مثل `nsh keygen keys/root`). احتفظ بـ `.secret` الخاص بالجذر دون اتصال؛ فالتطبيقات تثق بـ `.pub` الخاص به.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

يصدّق على مفتاح إصدار بمفتاح جذر لبعض معرّفات التطبيقات ولفترة زمنية محددة؛ وتحمل الحزم الشهادة.

| العلامة | الوصف |
|---|---|
| `--root <ROOT>` | المفتاح السري للجذر. |
| `--key <KEY>` | المفتاح العام لمفتاح الإصدار. |
| `--apps <APPS>` | معرّفات التطبيقات التي يجوز له التوقيع لها: `*` أو `com.example.*` أو معرّف. قابلة للتكرار. |
| `--days <DAYS>` | المدة التي يجوز له التوقيع خلالها، اعتبارًا من الآن (الافتراضي 365). |
| `-o, --out <OUT>` | الشهادة التي ستُكتب. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

يبني التطبيق في وضع الإصدار ويوقّعه في حزمة. وتأتي البيانات الوصفية من `nsh.json` وتتجاوزها العلامات.

وعند إعطائه حزمة (`ENTRY` ملف `.nshpkg`)، فإنه يوقّع تلك الحزمة مرة أخرى بهذا المفتاح، كما تفعل منصة توقّع
حزم تطبيقاتها بمفتاح واحد خاص بها. تبقى ملفات الحزمة وترويستها كما هي؛ أما شهادتها
ووقت توقيعها وتوقيعها فتصبح للمفتاح الجديد ([الحزم الموقّعة](./signed-packages.md#sign-a-package-again)). ويجوز أن يسمّي `-o`
الحزمة المقروءة، ولا يسري سوى `--key` و`--cert` و`-o`.

| العلامة | الوصف |
|---|---|
| `--key <KEY>` | المفتاح السري لمفتاح الإصدار. |
| `--cert <CERT>` | شهادته (`nsh certify`). |
| `-o, --out <OUT>` | الحزمة التي ستُكتب. الافتراضي: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | معرّف التطبيق. |
| `--app-version <VERSION>` | الإصدار. |
| `--build <BUILD>` | رقم البناء: يجب أن يزداد مع كل إصدار. |
| `--source-map <WHERE>` | موضع خريطة المصدر: `package` (الافتراضي)، أو `file` (`<package>.map` بجوار الحزمة)، أو `none` ([الحزم الموقّعة](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | يستبعد جداول الأسطر والأعمدة من bytecode: حجم أصغر، لكن مسارات الأخطاء تفقد المواضع. |
| `--min-runtime <VERSION>` | أدنى بيئة تشغيل تشغّل الحزمة، مثل `0.2.0`؛ وترفضها البيئات الأقدم. الافتراضي: إصدار أداة CLI هذه ([الحزم الموقّعة](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

يتحقق من حزمة كما يفعل تطبيق يثق بالجذور المعطاة. وبدون `--root` لا يُفحص سوى توقيع الحزمة نفسها. ويطبع SHA-256 للحزمة، وهو ما يقبله `nsh revoke --package`.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

يعيد كتابة مواضع الحزمة (`bundle.js:LINE:COL`) في خطأ أبلغت عنه حزمة إلى مواضع مصادرك ويطبع
النتيجة. `MAP` هو خريطة مصدر (`<package>.map` من `nsh publish --source-map file`، `bundle.js.map`) أو حزمة
تحتوي على واحدة؛ و`INPUT` هو نص الخطأ (الافتراضي: الإدخال القياسي).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

يوقّع قائمة إبطال: مفاتيح إصدار وحزم يجب ألا تُحمَّل بعد الآن.

| العلامة | الوصف |
|---|---|
| `--root <ROOT>` | المفتاح السري للجذر. |
| `--extend <EXTEND>` | يُبقي على مدخلات هذه القائمة (آخر قائمة نُشرت). |
| `--sequence <N>` | رقم القائمة، أعلى من أي قائمة نُشرت سابقًا. الافتراضي مع `--extend`: رقم تلك القائمة زائد واحد. |
| `--key <ID>` | معرّف مفتاح إصدار يُراد إبطاله. قابل للتكرار. |
| `--package <SHA256>` | SHA-256 لحزمة يُراد إبطالها. قابل للتكرار. |
| `-o, --out <OUT>` | القائمة التي ستُكتب. |

<a id="environment-variables"></a>

## متغيرات البيئة

| المتغير | يستخدمه | الوصف |
|---|---|---|
| `ANDROID_HOME`، `ANDROID_SDK_ROOT` | أهداف Android | Android SDK. البديل: `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | التطبيقات ذات حزم Rust | موضع بناء مشغّلات التطبيق. الافتراضي: `target/` الخاص بالتطبيق. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | كلمة مرور مخزن المفاتيح. |
| `NSH_RUNTIME` | `run`، `package` | مجلد بيئة تشغيل يُستخدم بدلًا من المجلد الموجود بجوار CLI. |
| `NSH_VERBOSE` | كل الأوامر | `1`: مثل `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`، `package` (`--target web`) | أداة `wasm-bindgen` CLI لتطبيق [تستدعي حزمه واجهات المتصفح](./web.md#browser-apis-from-rust). الافتراضي: الموجودة في `PATH`. |
| `NO_COLOR` | كل الأوامر | عند ضبطه: لا ألوان في الطرفيات. |
