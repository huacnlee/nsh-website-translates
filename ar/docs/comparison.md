---
title: "مقارنة الأساليب"
description: "كيف تقارن Native Shell بين React Native وFlutter وQt وGPUI وSlint، ومع Electron وTauri، ومع web views وواجهة المستخدم المدفوعة من الخادم (server-driven UI) فيما يخص واجهة المستخدم التي تُسلَّم بعد الإصدار."
order: 2
group: start
source_hash: 80f11e255cf3463f
---

# مقارنة بين الأساليب

NSH هو إطار عمل لبناء تطبيقات كاملة على iOS وAndroid وmacOS وWindows وLinux والويب، وهو أيضًا بيئة تشغيل لواجهات المستخدم التي تصل إلى التطبيقات بعد إصدارها. تقارنه هذه الصفحة أولًا بأطر العمل متعددة المنصات التي يكتب الناس تطبيقاتهم بها، ثم بالطرق التي تحصل بها التطبيقات على واجهات لم تُشحن معها. يعني اللون الأخضر أن القدرة متاحة، والأصفر أنها تتطلب مزيدًا من عمل التطبيق نفسه أو مشروعًا منفصلًا، والأحمر أنها غير متوفرة. تصف العلامات مدى التوفر وليس الأداء. الإصدارات هي الحدود الدنيا الموثّقة لكل إطار عمل وقت الكتابة، فتحقق منها للإصدار الذي تستخدمه.

دليل الرموز: <span class="status status--yes" role="img" aria-label="نعم"></span> نعم · <span class="status status--partial" role="img" aria-label="جزئي"></span> جزئي · <span class="status status--no" role="img" aria-label="لا"></span> لا.

<a id="cross-platform-frameworks"></a>

## أطر العمل متعددة المنصات

| القدرة | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| طريقة الرسم | واجهة المنصة | عروض المنصة | محرك خاص | Scene graph | خاصة، GPU | خاصة، GPU | مُصيِّر خاص |
| نموذج الواجهة | محتفَظ به | محتفَظ به | محتفَظ به | محتفَظ به | فوري | فوري + محتفَظ به | تفاعلي، محتفَظ به |
| اللغة | Rust، TSX | JS، TS | Dart | C++، QML | Rust | Rust | Slint مع Rust وC++ |
| iOS | <span class="status status--yes" role="img" aria-label="نعم"></span> 15+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 15+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 17+ | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="نعم"></span> 9+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 7+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 7+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 9+ | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="نعم"></span> 14+ | <span class="status status--partial" role="img" aria-label="جزئي"></span> منفصل | <span class="status status--yes" role="img" aria-label="نعم"></span> 12+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 13+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 12+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 12+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="نعم"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="جزئي"></span> منفصل | <span class="status status--yes" role="img" aria-label="نعم"></span> 10+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 10+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 10+ | <span class="status status--yes" role="img" aria-label="نعم"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="نعم"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="نعم"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="نعم"></span> Vulkan | <span class="status status--yes" role="img" aria-label="نعم"></span> Vulkan | <span class="status status--yes" role="img" aria-label="نعم"></span> |
| الويب | <span class="status status--yes" role="img" aria-label="نعم"></span> HTML | <span class="status status--partial" role="img" aria-label="جزئي"></span> مكتبة | <span class="status status--yes" role="img" aria-label="نعم"></span> Canvas | <span class="status status--yes" role="img" aria-label="نعم"></span> Canvas | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> Canvas |
| نص النظام | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> |
| تجربة مخصصة لكل جهاز | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> |
| بلا بيئة تشغيل JS | <span class="status status--yes" role="img" aria-label="نعم"></span> تطبيقات Rust | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> C++ | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--yes" role="img" aria-label="نعم"></span> |
| تسليم موقّع | <span class="status status--yes" role="img" aria-label="نعم"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> OTA | <span class="status status--no" role="img" aria-label="لا"></span> | <span class="status status--partial" role="img" aria-label="جزئي"></span> QML | <span class="status status--partial" role="img" aria-label="جزئي"></span> Shell | <span class="status status--partial" role="img" aria-label="جزئي"></span> Shell | <span class="status status--no" role="img" aria-label="لا"></span> |
| الترخيص | Apache-2.0 | MIT | BSD-3-Clause | LGPL وGPL وتجاري | Apache-2.0 | Apache-2.0 | GPL وتجاري |

يعيد الوضع الفوري (immediate mode) بناء وصف الواجهة في كل إطار، بينما يحتفظ الوضع المحتفَظ به (retained mode) بالوصف ويحدّث ما تغيّر فقط. يجمع GPUI Fast بين الاثنين فوق GPUI، ويعمل حيثما يعمل GPUI. "Shell" هو [GPUI Shell](https://gpui-kit.com/shell).

NSH هو إطار العمل الوحيد هنا الذي يجمع كل ما يلي: واجهة كل منصة ومدخلات النص الأصلية فيها، والهواتف وأجهزة سطح المكتب والويب من تطبيق واحد (والويب بصيغة HTML)، وتطبيقات Rust بلا بيئة تشغيل JavaScript، وواجهات موقّعة ومعزولة (sandboxed) تُسلَّم بعد الإصدار.

<a id="what-the-rows-mean"></a>

### ماذا تعني الصفوف

- **طريقة الرسم ونموذج الواجهة.** يركّب NSH عروض (views) كل منصة الأصلية ويحتفظ بها (الوضع المحتفَظ به)، فيحدّث التغيير العروض التي مسّها فقط. يركّب React Native أيضًا عروض المنصة على iOS وAndroid. أما Flutter وQt Quick وGPUI وSlint فترسم بمُصيِّراتها الخاصة. يبني GPUI شجرة العناصر في كل إطار (الوضع الفوري)، ويعيد [GPUI Fast](https://github.com/longbridge/gpui-fast) استخدام ما لم يتغير.
- **المنصات.** الحدود الدنيا لـ NSH خاصة به ([Platforms](./platforms.md)). أما البقية فمصدرها [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (‏iOS 15.1، وAndroid 7 / API 24؛ وmacOS وWindows عبر مشروعي react-native-macos وreact-native-windows المنفصلين، والويب عبر مكتبة react-native-web)، و[Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms)، و[Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html)، و[متطلبات Zed](https://zed.dev/docs/installation) لـ GPUI، و[أدلة منصات Slint](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (‏iOS من Rust). تعني "Canvas" أن إطار العمل يرسم داخل canvas في الصفحة، أما تطبيقات الويب في NSH فهي عناصر HTML منسّقة بـ CSS، يتولى المتصفح تمريرها وتحديدها وتحريرها ([Web](./web.md)).
- **نص النظام.** حقول النص في NSH هي محررات المنصة نفسها: `UITextView` و`EditText` و`NSTextView` و`TextView` في GTK، ومحرر المتصفح، مع طرق إدخال النظام ومقابض التحديد وقوائم التحرير. وعلى Windows يعمل محرر NSH الخاص مع DirectWrite وطرق إدخال النظام (IMM32). يستخدم React Native أيضًا حقول إدخال النص الخاصة بالمنصة. أما الأطر التي ترسم بنفسها فتنفّذ تحرير النص بنفسها وتربطه بطرق إدخال النظام.
- **تجربة مخصصة لكل جهاز.** تتبع المكوّنات الأساسية في NSH الجهاز: فالمكوّن `Menu` نفسه نافذة منبثقة عند عنصر التشغيل مع المؤشر، وورقة (sheet) من الأسفل على الهاتف، ويُفتح `ContextMenu` بالنقر الأيمن أو بإبقاء الإصبع مضغوطًا. وفي الأطر الأخرى يبقى تكييف التفاعل لكل جهاز في الغالب من عمل التطبيق نفسه.
- **بلا بيئة تشغيل JS.** لا تربط مشغّلات تطبيق Rust أي محرك JavaScript على أي منصة، وTSX هو المسار الثاني على المحرك نفسه. تعمل QML في Qt Quick على محرك JavaScript الخاص بـ Qt، بينما لا تفعل ذلك Qt Widgets في C++.
- **تسليم موقّع.** يتحقق NSH من حزم `.nshpkg` الموقّعة مقابل المفاتيح التي يثق بها وقائمة إبطال، ويشغّل كل حزمة في VM بالحدود والقدرات التي يمنحها المضيف ([Signed packages](./signed-packages.md)، [Sandbox and capabilities](./sandbox-and-capabilities.md)). أما تحديثات React Native عبر الهواء (over-the-air) فتشحن شيفرة تطبيق موثوقة، ويمكن لـ Qt تحميل ملفات QML، وتتلقى تطبيقات GPUI وحدات JavaScript عبر [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### ما يميّز NSH

- **أصلي على كل منصة، بالمعنيين.** يُبنى كل backend على عروض منصته ونصها وطرق إدخالها: UIKit وعروض Android وAppKit وWin32 مع Direct2D وGTK 4 وHTML، ويأتي تفاعل كل منصة معها. تحديد النص وطرق الإدخال وإمكانية الوصول هي ما يوفره النظام، وما يضيفه إصدار جديد من نظام التشغيل إليها يصل إلى التطبيق ([Introduction](./index.md#what-native-means)).
- **الهواتف وأجهزة سطح المكتب والويب من تطبيق واحد.** ست منصات هي backends لإطار عمل واحد، بتخطيطات تعيد تشكيل نفسها ومدخلات تتبع الجهاز. وعلى الويب يكون التطبيق HTML منشورًا كموقع ثابت.
- **Rust أولًا، بلا بيئة تشغيل JavaScript.** يمكن أن يكون التطبيق كله Rust من البداية إلى النهاية، مُصرَّفًا إلى شيفرة أصلية مع أنواع Rust وخيوطه وحزمه (crates). أما TSX فهو المسار الثاني على المحرك نفسه، للشاشات التي تُكتب بسرعة ([Building with Rust](./rust.md)).
- **عروض محتفَظ بها للتطبيقات اليومية.** تبقى المحادثات والنماذج والقوائم والمستندات شبه خاملة في حالة السكون، لأن التغيير لا يرسل إلا العروض التي مسّها ([Introduction](./index.md#retained-views)).
- **واجهات تُسلَّم بعد الإصدار، موقّعة ومعزولة.** تستقبل التطبيقات المبنية بـ NSH، والتطبيقات الأصلية المكتوبة بأدوات كل منصة، وحدات TSX وقت التشغيل، سواء كتبها فريق أو ولّدها الذكاء الاصطناعي ([Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui)).
- **سلسلة أدوات واحدة، للبشر والوكلاء.** ملف تنفيذي واحد هو `nsh` ينشئ التطبيقات ويشغّلها ويختبرها على منصات حقيقية ويحزمها ويوقّعها لكل هدف.

### React Native

React Native هو الأقرب في القصد: كلاهما يقلّل العمل المكرر في العميل ويستخدم عروض المنصة. يتمحور React Native حول JavaScript أو TypeScript مع React ونظام حزمه البيئي، على iOS وAndroid، مع دعم لسطح المكتب في مشاريع منفصلة. أما NSH فيتمحور حول Rust: بيئة تشغيله ومُصيِّره ووحداته كلها Rust، وRust لغة تطبيقات قائمة بذاتها، وTSX مسار واحد من اثنين. ومنصاته الست، بما فيها أجهزة سطح المكتب والويب، هي backends لإطار العمل نفسه.

### Flutter

يرسم Flutter كل بكسل بمحركه الخاص، فيبدو التطبيق متطابقًا على كل المنصات. أما NSH فيسلك الطريق الآخر: عروض كل منصة ونصها ومدخلات النص فيها، وعلى الويب عناصر HTML مع تمرير المتصفح وتحديده وإدخاله. فتحرير النص وطرق الإدخال والتحديد هي ما توفره المنصة، بدل إعادة تنفيذها لكل منصة.
### Qt

Qt هي مجموعة أدوات ناضجة تقدم تقنيتين لواجهات المستخدم، هما Qt Widgets وQt Quick، مع أدوات ودعم للمنصات يمتدان لسنوات طويلة. يختلف NSH عنها في الأساس وفي النموذج: لغة Rust لغةً أساسية مع مسار TSX، وسلسلة أدوات مصممة للتطوير الآلي (والمدفوع بالذكاء الاصطناعي)، وعرض الويب بصيغة HTML، وتكييف التفاعل على الجوال وسطح المكتب والويب داخل نموذج مكوّنات واحد.

### GPUI and GPUI Fast

[GPUI](https://gpui-kit.com) هو إطار عمل لواجهات المستخدم بلغة Rust يرسم باستخدام وحدة معالجة الرسوميات (GPU)، وقد بُني لتطبيقات سطح المكتب كثيفة المتطلبات؛ أما [GPUI Fast](https://github.com/longbridge/gpui-fast) فهو نسخة مشتقة (fork) من Longbridge مع عرض محتفَظ به (retained rendering) يعيد استخدام العروض والتخطيط وقياسات النصوص التي لم تتغير، إضافةً إلى طبقات التمرير والتركيب الأصلي للنوافذ. أما NSH فيبني على العروض الأصلية لكل منصة، ولذلك فإن إدخال النص والتحديد وطرق الإدخال والتفاعل مع النظام كلها من المنصة نفسها، كما يغطي الهواتف والويب أيضًا؛ ويقوم الواجهة الخلفية GPUI في NSH بتضمين تطبيقات NSH داخل تطبيقات GPUI وGPUI Kit ([GPUI](./gpui.md)).

يناسب كل منهما حمولات مختلفة. في [اختبار أداء NSH](https://github.com/longbridge/nsh-perf-bench) (على Linux، مع جدول أسعار من 500 صف، وNSH على الواجهة الخلفية GTK 4)، تكلّف الحمولات اليومية الشيء نفسه: عند 1,000 تحديث سعر في الثانية يستخدم NSH Rust نسبة 18% من نواة واحدة بينما يستخدم GPUI Fast نسبة 20%. أما تحت التحديثات الكثيفة المتواصلة فيتقدم GPUI Fast: عند 20,000 تحديث سعر في الثانية يستخدم 25% من نواة واحدة مقابل 73–78% لدى NSH، كما أن الرسوم المتحركة إطارًا بإطار لـ1,000 مربع تكلّفه نحو ثلث استهلاك المعالج لدى NSH.

### Slint

Slint هي مجموعة أدوات تصريحية لواجهات المستخدم بلغتها الخاصة ومحركات رسم خفيفة، لأجهزة سطح المكتب والأجهزة المدمجة، وتُستخدم من Rust أو C++ أو JavaScript أو Python. كلاهما يعتني بالأداء الأصلي؛ أما طريق NSH فهو واجهة كل منصة وتفاعلها الخاص، وHTML على الويب، وRust وTSX لغتين للتطبيقات، والتطوير المدفوع بالذكاء الاصطناعي عبر ست منصات.

### Electron and Tauri

يضمّ Electron محرك Chromium، ويستخدم Tauri عارض الويب الخاص بالنظام: كلاهما يبني تطبيقات سطح المكتب (ومعه Tauri تطبيقات الجوال أيضًا) من محتوى الويب، مع نص المتصفح وإدخاله. أما NSH فيبني العروض الأصلية لكل منصة، ولا يعرض HTML إلا على الويب نفسه.

## UI delivered after release

أمام التطبيق الذي يريد واجهة لم تُشحن معه — كإجابات يولّدها نموذج، أو ميزات من شركاء أو فرق أخرى، أو شاشات تتغير دون إصدار جديد — عدد من الخيارات المعروفة، على الهواتف وأجهزة سطح المكتب على حد سواء. وهي تختلف في ما يرسم الواجهة، وفي ما يُسمح للشيفرة المسلَّمة بفعله، وفي مقدار ما يجب تغييره في التطبيق ليستضيفها.

| Capability | NSH | Web view | Server-driven UI | Mini-programs | OTA updates |
|---|---|---|---|---|---|
| Drawn by | Platform UI | Browser engine | The app's views | Web engine + layer | Framework renderer |
| Native look and behavior | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Own state, logic and layout | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Host's native components | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Sandbox the host configures | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Yes"></span> Schema | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Signed, revocable packages | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| Fit for AI-generated UI | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Web pages | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Cost to the host app | One view and a library | A browser engine per view | A renderer per component | A container SDK | The whole app in the framework |

- **عرض الويب (H5).** صفحة داخل محرك متصفح: كل ما يستطيع HTML التعبير عنه، بمظهر المتصفح، وجسر مكتوب يدويًا إلى الشيفرة الأصلية.
- **الواجهة المدفوعة من الخادم (Server-driven UI).** JSON يعيد تركيب المكوّنات والإجراءات التي يشحنها التطبيق أصلًا: سهل التوليد، بلا حالة محلية أو منطق يتجاوز ما يوفره المخطط (schema).
- **حاويات البرامج المصغّرة (Mini-programs).** إطار عمل وواجهات برمجية خاصة بكل منصة فوق محرك ويب، داخل حزمة SDK كبيرة للحاوية.
- **التحديثات عبر الهواء (OTA)** (مثل React Native مع خدمة code-push). إطار العمل كاملًا، لكن التحديثات تُعامَل كشيفرة تطبيق موثوقة، ويجب كتابة التطبيق بذلك الإطار.
- **NSH.** وحدة TSX بحالتها ومنطقها وحركتها وتخطيطها الخاص، تُعرض بواجهة المنصة الأصلية، ويمكنها استخدام العروض الأصلية التي يسجلها المضيف. تصل في حزمة موقَّعة يتحقق منها التطبيق، وتعمل في آلة افتراضية (VM) خاصة بها مع حدود للذاكرة ووقت الاستدعاء وعدد العُقد، ولا تصل إلا إلى مضيفات الشبكة وصفحات الويب وإعدادات النظام التي يمنحها المضيف ([Sandbox and capabilities](./sandbox-and-capabilities.md)). ويضيف المضيف عرضًا واحدًا تظهر فيه الوحدة ([Platforms](./platforms.md#embed-in-a-native-app))، وتعمل الحزمة نفسها على كل منصة. وهذا هو سبب وجود NSH إلى جانب [GPUI Shell](./index.md#native-shell-and-gpui-shell).

## When another option fits better

- الشاشة يغلب عليها تحديث كثيف ومتواصل لآلاف العروض — كمحطة بيانات سوق تبثّ عشرات الآلاف من الأسعار في الثانية، أو تصور مخصص يُعاد رسمه في كل إطار: يستخدم العرض المحتفَظ به على GPU في GPUI Fast جزءًا صغيرًا من المعالج (انظر [GPUI and GPUI Fast](#gpui-and-gpui-fast)).
- يجب أن يبدو التطبيق متطابقًا بالبكسل على كل منصة: إطار عمل يرسم كل شيء بنفسه، مثل Flutter أو Slint، يوفر ذلك بحكم تصميمه.
- تحتاج إلى منظومة كبيرة من الحزم الخارجية اليوم: لدى React Native وFlutter وQt سنوات منها.
- الواجهة مستند أو صفحة ويب موجودة: عرض الويب يعرضها كما هي.
- مجموعة الشاشات ثابتة وصغيرة، ولا يتغير سوى المحتوى والترتيب: الواجهة المدفوعة من الخادم لا تحتاج إلى أي بيئة تشغيل.

## See also

- [Introduction](./index.md): ما هو NSH، وماذا يعني «الأصلي» فيه.
- [Architecture](./architecture.md): ما الذي يعمل وأين داخل NSH.
- [Performance](./performance.md): القواعد التي يتبعها NSH، وكيفية قياس أداء تطبيق.
