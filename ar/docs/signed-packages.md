---
title: "الحزم الموقّعة"
description: "وزّع شيفرة التطبيق التي تنزّلها التطبيقات المضيفة وتتحقق منها: المفاتيح والشهادات وnsh publish وإعادة التوقيع والتحقق والإلغاء والحماية من الرجوع إلى إصدارات أقدم."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# الحزم الموقّعة

الحزمة الموقّعة (`.nshpkg`) هي الطريقة التي يشغّل بها التطبيق المضيف شيفرة NSH لم تُشحن معه: تحديث لشاشات NSH الخاصة به، أو تطبيق مصغّر من جهة خارجية. يبني `nsh publish` التطبيق ويوقّعه، ويتحقق التطبيق المضيف من التوقيع وسلسلة الشهادات وقوائم الإبطال ورقم البناء قبل تشغيل أي شيء.

تحتوي الحزمة على TSX. أما شيفرة Rust الخاصة بالتطبيق المضيف (تطبيق مكتوب بـ Rust، ومكوّنات الحزم التي يستخدمها ووحداته وفئاته) فهي جزء من التطبيق المضيف نفسه وتُسلَّم معه، ويستوردها TSX الموجود في الحزمة بمعرّفاتها (specifiers) كما يفعل أي TSX ([البناء باستخدام Rust](./rust.md#extending-a-rust-app-with-tsx)). وهكذا يُبقي تطبيق Rust نواته بلغة Rust، ويسلّم الشاشات التي تتغير كثيرًا في حزم موقّعة.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> يتحقق NSH من الحزم ويشغّلها، لكنه لا يوزّعها. مصدر الحزم (خادم التحديثات لديك، أو شبكة CDN، أو متجر للتطبيقات المصغّرة) ووقت تنزيل التطبيق لها يعودان إلى التطبيق المضيف.

<a id="why-packages-are-signed"></a>

## لماذا تُوقَّع الحزم

يمكن لشيفرة JS التي يشغّلها التطبيق المضيف أن تصل إلى كل ما [يمنحه](./sandbox-and-capabilities.md) التطبيق، لذلك يجب أن تأتي من جهة يثق بها التطبيق. وهناك سبب ثانٍ: يشحن NSH التطبيقات على هيئة bytecode لـ QuickJS، وهو يُحمَّل أسرع من الشيفرة المصدرية، لكن QuickJS لا يتحقق من صحة bytecode، ويمكن لـ bytecode مصنوع بعناية أن يُفسد الذاكرة. لذلك لا يحمّل NSH الـ bytecode إلا من موارد التطبيق نفسه (الموقّعة من النظام)، ومن خادم التطوير الذي اتصل به المطوّر، ومن الحزم التي جرى التحقق منها. وأي مصدر آخر يجب أن يكون شيفرة JS مصدرية.

<a id="keys-two-levels"></a>

## المفاتيح: مستويان

- **المفتاح الجذري (root key)** يبقى دون اتصال بالإنترنت. تثق التطبيقات المضيفة بمفتاحه العام، ويمكنها الوثوق بعدة جذور، وبهذا يُدوَّر الجذر.
- يقوم الجذر **باعتماد مفاتيح الإصدار**: تسمّي الشهادة مفتاح الإصدار، ومعرّفات التطبيقات التي يجوز له التوقيع لها، ونافذة زمنية.
- **توقّع مفاتيحُ الإصدار الحزمَ** وتحمل الحزمة شهادة المفتاح. ولذلك يمكن تدوير مفاتيح الإصدار (أو إبطالها) دون تحديث التطبيقات المضيفة، التي لا تعرف سوى الجذر.

لكل مفتاح معرّف مشتق من مفتاحه العام (أول 8 بايتات من SHA-256 له، بالنظام السداسي عشري)، وتطبعه كل الأوامر.

<a id="create-the-keys"></a>

### إنشاء المفاتيح

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

كل مفتاح عبارة عن ملفين: `<name>.secret` (يقرؤه مالكه فقط) و`<name>.pub`، وكلاهما سطر واحد بصيغة base64. لا يستبدل `nsh keygen` مفتاحًا موجودًا أبدًا.

> [!CAUTION]
> أبقِ `root.secret` دون اتصال بالإنترنت، مثلًا على قرص مشفّر داخل خزنة. من يملكه يستطيع اعتماد مفاتيح تقبلها كل التطبيقات المضيفة التي تثق بالجذر. أما مفاتيح الإصدار فمكانها جهاز البناء أو أسرار CI.

<a id="certify-a-release-key"></a>

### اعتماد مفتاح إصدار

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| العلامة | الوصف |
|---|---|
| `--root <file>` | المفتاح السري للجذر. |
| `--key <file>` | المفتاح العام لمفتاح الإصدار. |
| `--apps <pattern>` | معرّفات التطبيقات التي يجوز له التوقيع لها: `*` (أي تطبيق)، أو `com.example.*` (المعرّفات الواقعة تحت `com.example.`)، أو معرّف محدد بالضبط. يمكن تكرارها. |
| `--days <n>` | المدة التي يجوز له التوقيع خلالها، ابتداءً من الآن. القيمة الافتراضية 365. |
| `-o, --out <file>` | الشهادة المراد كتابتها. |

الشهادة ملف JSON صغير وليست سرّية.

<a id="publish-a-package"></a>

## نشر حزمة

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

يبني `nsh publish` التطبيق في وضع الإصدار (release) ويوقّعه. تُؤخذ معرّفات التطبيق واسمه وإصداره ورقم بنائه من `nsh.json` الموجود بجوار نقطة الدخول، وتتغلب عليها العلامات:

| العلامة | الوصف |
|---|---|
| `--key <file>` | المفتاح السري لمفتاح الإصدار. |
| `--cert <file>` | شهادته. |
| `-o, --out <file>` | الحزمة المراد كتابتها. القيمة الافتراضية `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <id>` | معرّف التطبيق، مثل `com.example.app`. |
| `--app-version <version>` | الإصدار، مثل `1.2.0`. |
| `--build <n>` | رقم البناء. مطلوب (هنا أو في `nsh.json`)، ويجب أن يزداد مع كل إصدار. |
| `--source-map <where>` | `package` (الافتراضي): داخل الحزمة. `file`: في `<package>.map` بجوارها، لا داخل الحزمة. `none`: يُحذف. انظر [أخطاء الحزم المنشورة](#errors-from-published-packages). |
| `--strip-debug` | يحذف جدولَي الأسطر والأعمدة من bytecode: حزمة أصغر، لكن مكدسات الأخطاء فيها بلا مواضع. |
| `--min-runtime <version>` | أدنى runtime يشغّل الحزمة، مثل `0.2.0` (`nsh.json` `minRuntime`). الافتراضي: إصدار أداة CLI هذه. انظر [أي إصدارات runtime تشغّل الحزمة](#which-runtimes-run-a-package). |

يرفض `nsh publish` توقيع ما سيرفضه الجهاز: يجب أن تغطي الشهادة معرّف التطبيق والوقت الحالي.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### أي إصدارات runtime تشغّل الحزمة

تذكر الحزمة أدنى إصدار من runtime الخاص بـ NSH يشغّلها، وترفضها التطبيقات المضيفة ذات runtime الأقدم قبل تشغيل أي شيء:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

افتراضيًا يكون هذا إصدار أداة CLI التي بنت الحزمة: فالحزمة مُصرَّفة مقابل وحدات تلك الأداة، وبالتالي فهذا الـ runtime هو المعروف بأنه يشغّلها. وعندما تكون التطبيقات المضيفة الموجودة لدى المستخدمين ذات runtime أقدم، ولا يستخدم تطبيقك إلا ما يملكه ذلك الـ runtime، انشر لأجله باستخدام `--min-runtime` (أو `minRuntime` في `nsh.json`):

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

الإصدار هو `MAJOR.MINOR.PATCH`؛ ولاحقة ما قبل الإصدار (`0.2.0-beta.1`) تُحتسب كأنها الإصدار نفسه بدونها. ولا يمكن أن يكون أحدث من إصدار CLI. جرّب الحزمة على تطبيق مضيف بذلك الـ runtime قبل رفعها: فأي استيراد أو دالة لا يملكها الـ runtime الأقدم يفشل عند تحميل الوحدة.

<a id="what-a-package-holds"></a>

### ما تحتويه الحزمة

الحزمة ملف واحد: ترويسة JSON (معرّف التطبيق، والاسم، والإصدار، والبناء، والقدرات المعلنة، وإصدار bytecode، وأدنى runtime، ووقت التوقيع، وشهادة مفتاح الإصدار، وجدول بالملفات مع SHA-256 لكل منها)، ثم الملفات، ثم توقيع Ed25519 لمفتاح الإصدار على كل ما سبقه. والملفات هي:

- شيفرة JS المصدرية للتطبيق (دائمًا)،
- الـ bytecode الخاص به، ولا يُستخدم إلا إذا كان لـ runtime الجهاز إصدار bytecode نفسه (وإلا تعمل الشيفرة المصدرية، وهكذا تبقى الحزمة صالحة على إصدارات runtime الأحدث)،
- خريطة المصدر (source map) الخاصة به (إلا إذا نُشرت باستخدام `--source-map file` أو `none`)،
- الموارد التي يستوردها (الصور والخطوط).

هوية الحزمة، المستخدمة في الإبطال، هي SHA-256 للملف كاملًا.

<a id="packages-from-newer-versions-of-nsh"></a>

### حزم من إصدارات أحدث من NSH

يشغّل التطبيق المضيف الحزم التي وقّعها `nsh publish` أحدث، ما دام الـ runtime لديه بمستوى [أدنى runtime](#which-runtimes-run-a-package) للحزمة على الأقل. وما تضيفه النسخة الأحدث ولا يعرفه runtime المضيف يُترك جانبًا، ولا يوسّع أبدًا ما يجوز للحزمة فعله:

- تُتجاهل حقول الترويسة والملفات التي لا يعرفها (وتبقى مشمولة بالتوقيع وبقيم التجزئة الخاصة بها)، إلا إذا علّمت الحزمة حقلًا على أنه يجب أن يفهمه runtime: عندها ترفضها إصدارات runtime الأقدم؛
- لا تُمنح [القدرات](./sandbox-and-capabilities.md) التي لا يعرفها، ويُسقَط بالكامل أي منح لقدرة أو لـ `http` بمفتاح لا يعرفه، إذ قد يكون ذلك المفتاح قيدًا عليه.

يُسجَّل ما تُرك جانبًا عند تحميل الحزمة.

<a id="sign-a-package-again"></a>

## إعادة توقيع حزمة

يمكن لمنصة توزّع حزم عدة تطبيقات أن توقّعها جميعًا بمفتاح واحد خاص بها: يبني CI كل حزمة ويوقّعها بمفتاح تثق به تطبيقات الاختبار، وتوقّعها المنصة مرة أخرى بالمفتاح الذي تثق به تطبيقات الإنتاج.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| العلامة | الوصف |
|---|---|
| `--key <file>` | المفتاح السري لمفتاح الإصدار. |
| `--cert <file>` | شهادته. |
| `-o, --out <file>` | الحزمة المراد كتابتها. يجوز أن تكون هي الحزمة المقروءة. الافتراضي: `.nsh/out/<id>-<build>.nshpkg`. |

تحتفظ الحزمة بكل ما وضعه CI فيها: الملفات، ومعرّف التطبيق والإصدار والبناء، والقدرات المعلنة، و[أدنى runtime](#which-runtimes-run-a-package)، وما كتبته [نسخة أحدث من NSH](#packages-from-newer-versions-of-nsh). أما الشهادة ووقت التوقيع والتوقيع فتصبح للمفتاح الجديد، فيكون للحزمة SHA-256 خاص بها، وهو الذي [يُبطَل](#revoke-keys-and-packages) بواسطته.

قبل أن يوقّع، يتحقق `nsh publish` من سلامة الحزمة (موقّعة بالمفتاح الذي تسمّيه شهادتها، وجدول ملفاتها يغطي البيانات، وكل ملف يطابق تجزئته)، ومن أن الشهادة الجديدة تغطي معرّف التطبيق والوقت الحالي. ومن ذلك الحين يضمن التوقيع الجديد الحزمة، بما فيها bytecode، ولهذا تعيد المنصة توقيع الحزم التي أنتجتها عمليات البناء الخاصة بها. وتعيد أدوات Rust التوقيع باستخدام `nsh_package::resign(&bytes, &key, &certificate)`.

<a id="verify-a-package"></a>

## التحقق من حزمة

يفحص `nsh verify` الحزمة تمامًا كما يفعل تطبيق مضيف يثق بالجذور المعطاة:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| العلامة | الوصف |
|---|---|
| `--root <file>` | المفتاح العام لجذر موثوق. يمكن تكرارها. وبدونها لا يُفحص سوى توقيع الحزمة نفسه. |
| `--revocations <file>` | قائمة إبطال تُطبَّق أولًا. |

يفحص الجهاز بالترتيب:

1. توقيع الشهادة من جذر موثوق؛
2. أن مفتاح الإصدار غير مُبطَل؛
3. توقيع الحزمة بمفتاح الإصدار؛
4. أن الشهادة تغطي معرّف التطبيق ووقت التوقيع؛
5. أدنى runtime تحتاجه الحزمة؛
6. أن جدول الملفات يغطي البيانات تمامًا وأن كل ملف يطابق تجزئته؛
7. أن الحزمة نفسها غير مُبطَلة؛
8. أن بناءها ليس أقدم من أعلى بناء قُبل سابقًا لذلك التطبيق (الحماية من التراجع).

تثير الحزمة المرفوضة خطأً يبيّن أي فحص فشل؛ ويستمر التطبيق الذي كان يعمل في العمل.

<a id="revoke-keys-and-packages"></a>

## إبطال المفاتيح والحزم

يوقّع الجذر **قوائم إبطال**: مفاتيح إصدار وحزم يجب ألا تُحمَّل بعد الآن.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| العلامة | الوصف |
|---|---|
| `--root <file>` | المفتاح السري للجذر. |
| `--extend <file>` | يُبقي على إدخالات هذه القائمة (آخر قائمة نُشرت). |
| `--sequence <n>` | رقم القائمة، أعلى من أي قائمة نُشرت قبلها. مع `--extend` يكون الافتراضي رقم تلك القائمة زائد واحد. |
| `--key <id>` | معرّف مفتاح إصدار يُراد إبطاله. يمكن تكرارها. |
| `--package <sha256>` | SHA-256 لحزمة (كما يطبعه `nsh verify`) يُراد إبطالها. يمكن تكرارها. |
| `-o, --out <file>` | القائمة المراد كتابتها. |

لا يقبل مخزن الثقة إلا قائمة برقم تسلسلي أعلى من القائمة التي لديه، فلا يمكن إعادة تشغيل قائمة قديمة لإلغاء إبطال شيء ما. انشر أحدث قائمة في المكان الذي تجلبها منه تطبيقاتك، وطبّقها باستخدام `updateRevocations` قبل فتح الحزم.

<a id="rollback-protection"></a>

## الحماية من التراجع

عندما يقبل التطبيق المضيف حزمة، يسجّل مخزن الثقة لديه رقم البناء لمعرّف ذلك التطبيق، ثم يرفض البناءات الأقدم. فلا يستطيع مهاجم حصل على حزمة موقّعة أقدم تحتوي على ثغرة معروفة أن يجعل التطبيق يشغّلها. ويُحفظ السجل في دليل حالة المخزن (`nsh-trust.json`)، فيبقى بعد إعادة التشغيل. وفي GPUI يمكن للتطبيق المضيف أن يسجّله لاحقًا، بعد أن تثبت سلامة الحزمة الجديدة (`verify_package` ثم `accept_package`؛ انظر أدناه).

<a id="loading-packages-in-a-host-app"></a>

## تحميل الحزم في تطبيق مضيف

يحسب التحقق تجزئة الحزمة كاملة ويستخرج مواردها (مرة واحدة لكل حزمة، تحت دليل مخزن الثقة)، ولذلك يعمل خارج خيط واجهة المستخدم، أما تشغيل النتيجة فيتم على ذلك الخيط.

**GPUI (Rust)**، حيث يمكن للتطبيق المضيف أيضًا ألا يقبل الحزمة إلا بعد أن تثبت سلامتها:

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)**:

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

وإلى أن تُقبل الحزمة، يظل البناء المقبول قبلها يجتاز التحقق، فيمكن لتطبيق مضيف فشلت حزمته الجديدة أن يعود إلى الحزمة التي كان يشغّلها (والإشارات على ذلك هي الأخطاء القاتلة في `AppView::on_error`، أو انهيار قبل القبول). تبقى البناءات الأقدم من المقبول مرفوضة، ولا تُقبل حزمة أُبطلت في هذه الأثناء. يتحقق `load_package` ويقبل دفعة واحدة، كما يفعل `openPackage` على iOS وAndroid.

تنتقل [القدرات](./sandbox-and-capabilities.md) التي تعلنها الحزمة معها: لا تستطيع الحزمة فعل إلا ما تعلنه، وإلا ما يمنحه التطبيق المضيف فوق ذلك.

واجهة API الكاملة: [GPUI](./gpui.md#embedding-in-a-gpui-app)، [التضمين في تطبيقات iOS](./ios.md#signed-packages)، [التضمين في تطبيقات Android](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## أخطاء الحزم المنشورة

يحتفظ bytecode الخاص بالحزمة بجدولَي الأسطر والأعمدة، فتكون لأخطائها مواضع، ويربطها runtime بمصادرك باستخدام خريطة المصدر الخاصة بالحزمة قبل أن يسلّمها إلى معالج الأخطاء في التطبيق المضيف:

```text
Error: boom
    at n (App.tsx:5:3)
```

تحتوي خريطة المصدر على المصادر الأصلية لتطبيقك، وهي في الغالب أكبر ملف في الحزمة: نحو نصف حجم المثال gallery البالغ 2.6 MB. وللاحتفاظ بها لنفسك، انشرها بجوار الحزمة بدلًا من ذلك:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

عندها تُبلّغ الأجهزة عن مواضع الحزمة المجمّعة (`at n (bundle.js:1:80)`). احتفظ بالخريطة مع الحزمة التي تخصها، واربط ما أبلغ عنه التطبيق المضيف باستخدام `nsh symbolicate`:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

يقرأ `nsh symbolicate` نص الخطأ من ملف أو من الدخل القياسي، ويقبل ملف خريطة أو حزمة تحتوي على واحدة. تضيف جداول الأسطر نحو الخُمس إلى bytecode (3–5% من حزمة مع خريطتها)؛ ويحذفها `--strip-debug`، فتظهر المكدسات عندها هكذا `at n (<null>:0:1)`، دون شيء لربطه.

<a id="trying-a-package-in-development"></a>

## تجربة حزمة أثناء التطوير

تستطيع المضيفات التطويرية التي يثبّتها `nsh run` تشغيل حزمة بالطريقة التي يفعلها بها تطبيق مضمِّن.

على iOS، يقبل الملف التنفيذي للمضيف `--package <file>` وواحدًا أو أكثر من `--root <root.pub>`. بعد أن يثبّت `nsh run` المضيف في المحاكي (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

على Android، يقبل المضيف التطويري (`DevActivity`، الذي يثبّته `nsh run --target android`) الإضافات `package` (مسار على الجهاز) و`root` (مفاتيح عامة بصيغة base64، مفصولة بفواصل):

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

توجد حالة الثقة لديها في الدليل المؤقت (iOS) أو دليل التخزين المؤقت (Android)، فتُرفض هناك أيضًا البناءات الأقدم من بناء قبلته.
<a id="a-release-checklist"></a>

## قائمة التحقق للإصدار

1. احتفظ بالمفتاح الجذري (root key) غير متصل بالإنترنت؛ وأصدر شهادة لمفتاح إصدار لكل فريق أو لكل مجموعة تطبيقات، بصلاحية سنة أو أقل.
2. ارفع `build` في `nsh.json` مع كل إصدار؛ إذ يرفض `nsh publish` أي حزمة لا تحتوي على ذلك.
3. شغّل `nsh verify --root root.pub` على الحزمة قبل رفعها.
4. ضمّن `root.pub` داخل التطبيق المضيف؛ ووزّع قوائم الإلغاء بشكل منفصل، حتى تتمكن من الإلغاء دون تحديث التطبيق.
5. إذا تسرّب مفتاح الإصدار، فألغِه (`nsh revoke --extend … --key <id>`)، ثم أصدر شهادة لمفتاح جديد وانشر الإصدار مرة أخرى.
6. مع منصة توقّع نيابةً عن تطبيقاتها، امنح CI جذرًا خاصًا به لا تثق به سوى تطبيقات الاختبار، وضمّن جذر المنصة في تطبيقات الإنتاج؛ ثم تعيد المنصة توقيع حزم CI (`nsh publish <package>`).

<a id="see-also"></a>

## انظر أيضًا

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md)، [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
