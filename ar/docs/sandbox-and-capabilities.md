---
title: "البيئة المعزولة (Sandbox) والقدرات (Capabilities)"
description: "الحدود التي يعمل ضمنها كل تطبيق NSH (الذاكرة والوقت والعقد)، وتحصين اللغة في إصدارات الإنتاج (release builds)، والقدرات (capabilities) التي يتم تعريفها في ⁠nsh.json وتمنحها التطبيقات المضيفة."
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---

# الحماية المعزولة (Sandbox) والصلاحيات (Capabilities)

التطبيق المكتوب بلغة Rust هو شيفرة أصلية (native) تُصرَّف داخل التطبيق الذي يشحنها، شأنه شأن بقية التطبيق، ويعمل بثقته. وتمرّ استدعاءاته إلى خدمات NSH (`fetch`، والصور، وعروض الويب، وشريط الحالة) عبر الفحوص الأصلية نفسها التي تمرّ بها استدعاءات TSX، وفق ما يمنحه المضيف. أما TSX وJavaScript اللذان يشغّلهما التطبيق، سواء كانا من كتابته أو من [حزمة موقّعة](./signed-packages.md) ينزّلها، فيعملان في QuickJS VM لكل عرض، وكل ما يستطيعان فعله خارج تلك VM يمرّ عبر وقت تشغيل NSH الأصلي. وهذا يتيح تشغيل شيفرة لم تكتبها، مثل التطبيقات المصغّرة من جهات خارجية أو التحديثات المنزّلة، وفق قواعد يتحكم بها التطبيق المضيف:

- **الحدود (Limits)** تقيّد الذاكرة والوقت والموارد الأصلية التي يستطيع تطبيق واحد استخدامها.
- **التقوية (Hardening)** تزيل في إصدارات الإنتاج (release) كل الطرق التي تحوّل السلاسل النصية إلى شيفرة.
- **الصلاحيات (Capabilities)** تحدد ما يستطيع التطبيق الوصول إليه: المضيفات التي يجوز له الجلب منها، والصفحات التي يجوز لعرض الويب إظهارها، وهل يجوز له تغيير شريط الحالة. يعلنها التطبيق، ويجوز للتطبيق المضيف أن يمنح أقل منها.

تحتوي الحزمة (bundle) على شيفرة التطبيق فقط: الرسم البياني التفاعلي (reactive graph) والمُصيِّر (renderer) وكل وحدة يستوردها التطبيق كلها أصلية. لذلك لا شيء في JS موثوق، وكل حد وكل فحص يُفرض في Rust؛ فلا توجد شيفرة JS يستطيع التطبيق تعديلها للالتفاف عليها.

<a id="limits"></a>

## الحدود

تقيّد الحدود الـ VM: فهي تنطبق على TSX وJavaScript. التطبيق المضمَّن في تطبيق آخر يعمل ضمن حدود يقررها تطبيقه المضيف. أما التطبيق المستقل (المُحزَّم بواسطة
`nsh package`، بما في ذلك الويب، أو المشغَّل بواسطة `nsh run`) فهو شيفرتك أنت، كالتطبيق الأصلي: يستخدم الذاكرة والوقت اللذين يمنحهما الجهاز، وتحوّل مكدّس المفسّر (interpreter stack) البالغ 4096 KB التكرارَ العميق إلى `RangeError` يستطيع التطبيق التقاطه.

للتطبيق المضمَّن الحدود التالية:

| الحد | القيمة الافتراضية | عند بلوغه |
|---|---|---|
| JS heap | 256 MB | تتوقف الـ VM. |
| مكدّس المفسّر | 4096 KB (وهو أيضًا الحد الأقصى) | يطلق التكرار العميق `RangeError` يستطيع التطبيق التقاطه. |
| وقت تقييم الحزمة | 10 s | يُقطع التقييم. |
| وقت أي استدعاء آخر إلى JS | 2 s | يُقطع الاستدعاء ويستمر التطبيق. |
| العُقد المحتفَظ بها | 200 000 | تتوقف الـ VM. |
| التغييرات دفعة واحدة (العمليات المصطفّة) | 8 000 000 قيمة | تتوقف الـ VM. |
| العمليات في رسم canvas واحد | 1 000 000 | تتوقف الـ VM. |

**يُحسب الوقت لكل استدعاء، لا لكل تطبيق.** "الاستدعاء" هو شيء واحد يطلب وقت التشغيل من JS فعله: معالجة حدث واحد (بما في ذلك التصيير الذي يسببه)، أو ربط صف قائمة واحد، أو تشغيل مؤقّت واحد، أو تشغيل دوال `requestAnimationFrame` الخاصة بإطار واحد، أو تفريغ طابور المهام الدقيقة (microtasks). لا يتراكم وقت التطبيق طويل التشغيل نحو أي حد؛ ولا يُقاطَع إلا الاستدعاء الواحد الذي لا يعود في الوقت المحدد. والاستدعاءات المتداخلة داخل استدعاء آخر تتشارك ميزانية الاستدعاء الخارجي.

ينتهي الاستدعاء المقاطَع باستثناء لا يستطيع أي `catch` ابتلاعه، ويُبلَّغ عن الخطأ مع الميزانية التي تجاوزها:

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

تبقى الـ VM تعمل: فيعمل الحدث التالي أو المؤقّت أو الإطار بشكل طبيعي.

**نفاد الذاكرة أو تجاوز حصة يوقف الـ VM.** يُبلَّغ عن الخطأ مرة واحدة (إلى معالج الأخطاء في التطبيق المضيف، وفي إصدارات التطوير فوق التطبيق)، ولا تعمل أي شيفرة JS بعد ذلك، وتبقى العروض كما كانت. توجد حصص العُقد والعمليات لأن العروض الأصلية والتغييرات المصطفّة تعيش في الذاكرة الأصلية التي لا يغطيها حد JS heap: ولولاها لاستطاع التطبيق استنفاد ذاكرة الجهاز عبر واجهة المستخدم.

> [!TIP]
> هذه الحدود سخية للتطبيقات العادية. إذا بلغت ميزانية الاستدعاء البالغة 2 s فالعمل أطول من أن يتم في حدث واحد على أي حال: إذ سيجمّد تحديثات التطبيق طوال تلك المدة. قسّمه باستخدام `setTimeout`، أو انقله خارج معالج الحدث.

يضبط التطبيقات المضيفة الحدود لكل عرض: `NshAppView.limits` على [iOS](./ios.md#limits)،
و`NshView.setLimits` على [Android](./android.md#limits)، و`AppOptions::limits` / `AppView::set_limits` في
[تطبيق GPUI](./gpui.md#embedding-in-a-gpui-app). وتسري اعتبارًا من التحميل التالي.

لمعرفة ما يفعله تطبيق TSX ضمن حدود تطبيق مضيف أثناء التطوير، شغّله باستخدام
[`--limits`](./cli.md#nsh-run): يستخدم `nsh run App.tsx --limits` القيم الافتراضية أعلاه، بينما
يضبط `nsh run --limits memory=128MB,call=500ms` هذين الحدّين كما يفعل التطبيق المضيف، وتبقى البقية على قيمها الافتراضية.

<a id="hardening"></a>

## التقوية (Hardening)

تُقوّى إصدارات الإنتاج (كل ما لا يُحمَّل من خادم تطوير) عند تحميلها:

- يُزال `eval`، وتطلق الدوال البانية `Function` و`AsyncFunction` و`GeneratorFunction` و`AsyncGeneratorFunction` استثناءً. لا يشغّل NSH أي شيفرة مصنوعة من سلاسل نصية:

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- تُجمَّد النماذج الأولية (prototypes) التي تتشاركها كل الوحدات (`Object` و`Array` و`Function` و`String` و`Number` و`Promise` و`Map` والمصفوفات المنمّطة وغيرها)، فلا تستطيع وحدة واحدة (أو مكتبة واحدة) تغيير `Array.prototype` لبقية الوحدات. ويبقى `Error.prototype` قابلًا للكتابة، ليتمكن ما يشتق من الأخطاء من ضبط `this.name`.

كان تجميد النماذج الأولية سيكسر عادةً نمطًا شائعًا هو "خطأ التجاوز" (override mistake): فإسناد
`Sub.prototype.constructor = Sub` أو `obj.toString = …` يطلق استثناءً حين تكون الخاصية الموروثة مجمّدة. يحوّل NSH الأعضاء الأكثر تجاوزًا (`constructor` و`toString` و`valueOf` و`toJSON` ...) إلى accessors يعرّف setter الخاص بها الخاصيةَ على الكائن المُسنَد إليه، فتستمر هذه الشيفرة بالعمل (وكذلك المكتبات التي تستخدمها مثل axios).

الحزم التي يقدّمها `nsh dev` / `nsh run` (مع `--release` أو بدونه) لا تُقوّى، فيمكنك التنقيح باستخدام `eval`. اختبر سلوك الإنتاج باستخدام `nsh test` (الذي يقوّي) أو بحزمة مُجمَّعة قبل شحن شيفرة تعتمد على الشيفرة الديناميكية.

<a id="capabilities"></a>

## الصلاحيات (Capabilities)

يعلن التطبيق ما يستطيع الوصول إليه خارج الـ VM في `nsh.json`:

```json
{
  "name": "Quotes",
  "id": "com.example.quotes",
  "version": "1.0.0",
  "build": 3,
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }],
      "sockets": ["feed.example.com:7000"]
    },
    "webview": { "hosts": ["*.example.com"], "input": true },
    "statusBar": true,
    "clipboard": true,
    "picker": true,
    "speech": true,
    "host": ["getUserInfo", "bridge.*"],
    "openUrl": { "schemes": ["https", "mailto"] }
  }
}
```

**التطبيق بلا `"capabilities"` يستطيع فعل كل شيء**: فالتطبيق المستقل ملك مطوّره، ولا شيء فيه مقيَّد. وتُمنح مقابس TCP الخام بالاسم في كل تطبيق عبر `network.sockets`، ودوال المضيف عبر `host`. **التطبيق الذي فيه `"capabilities"` لا يستطيع إلا ما يسرده**: وكل شيء آخر مرفوض. والمفاتيح غير المعروفة أخطاء بناء، فيُكتشف الخطأ المطبعي عند البناء بدلًا من أن يصير صلاحية مفقودة وقت التشغيل. وقد تعلن [الحزمة الموقّعة](./signed-packages.md#packages-from-newer-versions-of-nsh) من NSH أحدث صلاحيات لا يعرفها وقت تشغيل أقدم: فلا تُمنح هناك.

### `network`

تغطي `fetch` (بما في ذلك كل عمليات إعادة التوجيه)، وWebSockets، والصور البعيدة (`<Image>` و`placeholder` وصور canvas و`Image.getSize` / `Image.prefetch`)، ومصادر الفيديو، ومقابس TCP الخام (`net.connect`).

| المفتاح | النوع | الوصف |
|---|---|---|
| `hosts` | `string[]` | المضيفات التي يجوز للتطبيق الوصول إليها بأي method وأي scheme (`http` و`https` و`ws` و`wss`). |
| `http` | `object[]` | منح أدق: مضيف تضيّقه أي من المفاتيح أدناه. |
| `http[].host` | `string` | المضيف أو نمط المضيف (مطلوب). |
| `http[].methods` | `string[]` | الـ methods المسموحة، مثل `["GET", "HEAD"]`. إن غاب: أي method. |
| `http[].schemes` | `string[]` | الـ schemes المسموحة (`scheme`: واحد، كسلسلة نصية). إن غاب: أي من `http` و`https` و`ws` و`wss`. |
| `http[].port` | `number` | المنفذ؛ وعنوان URL بلا منفذ يأخذ المنفذ الافتراضي لـ scheme الخاص به (443 لـ `https`). إن غاب: أي منفذ. |
| `http[].paths` | `string[]` | مسارات مطابقة تمامًا، مثل `["/v1/quote"]` (الاستعلام ليس جزءًا من المسار). |
| `http[].pathPrefixes` | `string[]` | بادئات مسارات تغطي مقاطع كاملة: يغطي `/v1` كلًا من `/v1` و`/v1/quote`، ويغطي `/v1/` ما يليه. ويُقرأ `pathPrefix` (واحد، كسلسلة نصية) و`path_prefixes` بالمعنى نفسه. |
| `sockets` | `string[]` | وجهات TCP الخام لـ [`net.connect`](../modules/standard-modules.md)، كل منها `"host:port"` مطابق تمامًا (`"[::1]:9000"` لـ IPv6). |

تغطي قاعدة `http` كل المسارات إذا لم تسرد `paths` ولا `pathPrefixes`، ومع وجودهما معًا يُقبل المسار المطابق لأي منهما.

أنماط المضيف هي `*` (أي مضيف)، أو `*.example.com` (أي نطاق فرعي لـ `example.com`، وليس `example.com` نفسه)، أو اسم مضيف مطابق تمامًا. تتجاهل المطابقةُ حالةَ الأحرف والمنفذ. ويؤخذ المضيف بعد آخر `@`، فيُفحص
`https://api.example.com@evil.io/` على أنه `evil.io`.

مصافحة WebSocket هي طلب HTTP GET: فيُفحص `ws://` على أنه `http://` و`wss://` على أنه `https://`، فتسمح منحُ hosts و`http` التي تجيز GET لعنوان URL بالـ WebSocket أيضًا. أما المقبس الخام فيتجاوز كل قواعد HTTP، لذلك يسرد `sockets` كل مضيف ومنفذ بالتحديد، ولا يمنحها إلا `sockets`.

عناوين `asset:` URI (ملفات التطبيق نفسه) مسموحة دائمًا؛ ويجوز للصور والفيديو أيضًا استخدام عناوين `data:` URI والمسارات النسبية.

### `webview`

| المفتاح | النوع | الوصف |
|---|---|---|
| `hosts` | `string[]` | المضيفات التي يجوز لـ[عرض ويب](./web-view-and-video.md) إظهارها والتنقل إليها (`http` و`https`). وبدون `webview` لا يجوز للتطبيق إظهار صفحات ويب إطلاقًا. |
| `input` | `boolean` | يجوز لـ ref عرض الويب أن يعطي صفحته مدخلات موثوقة ([`sendInput`](./web-view-and-video.md#input-as-the-users-own)). لا تُمنح أبدًا ما لم تُعلَن، حتى في تطبيق بلا `"capabilities"`. |

تُفحص أيضًا التنقلات العليا (top-level) داخل عرض الويب بواسطة navigation delegate الخاص بالمنصة قبل أن تُحمَّل. أما الموارد الفرعية للصفحة نفسها (سكربتاتها وصورها وطلبات XHR) فهي شأن محتوى الويب ولا تُفحص.
`about:blank` وHTML المضمَّن (`html`) لا يحتاجان إلا إلى منح عروض الويب أصلًا: إذ يسمح `"webview": { "hosts": [] }` بهما دون السماح بأي صفحة بعيدة.

`input` منفصل عن `hosts` لأن المدخلات الموثوقة تحمل تفعيل المستخدم (user activation) الذي لا يناله `injectJavaScript` أبدًا: فيجوز عندها للصفحة فتح نوافذ، والكتابة إلى الحافظة، وفتح لوحة الملفات في النظام، وبدء WebAuthn أو مطالبات الأذونات، والضغط على أي زر يفحص `isTrusted`. وبدونه تُسقط النواة `sendInput` وتسجّل المفتاح الذي ينبغي إضافته.

### `statusBar`

يتيح `"statusBar": true` للتطبيق تغيير شريط الحالة (`statusBar` للصفحات والحوارات في
[`nsh/base`](../modules/nsh-base.md#status-bar)، والقيمة الافتراضية `"statusBar"` في `nsh.json`).

### `clipboard`

يتيح `"clipboard": true` للتطبيق قراءة حافظة النظام والكتابة إليها ([`Clipboard`](../modules/nsh.md#clipboard)). النسخ من قائمة التحرير لنص قابل للتحديد فعلٌ من المستخدم نفسه ولا يحتاج إلى صلاحية.

### `picker`

يتيح `"picker": true` للتطبيق إظهار أداة اختيار الصور في النظام ([`Picker`](../modules/nsh.md#picker)): فالمستخدم
هو من يختار ما يصل إلى التطبيق.

### `speech`

يتيح `"speech": true` للتطبيق التعرف على ما يقوله المستخدم ([`Speech`](../modules/nsh.md#speech)): الميكروفون
ومُتعرِّف الكلام في النظام الذي يصل نصّه المفرَّغ إلى التطبيق. ويظل النظام يسأل المستخدم مرة واحدة.

### `openUrl`

يتيح للتطبيق فتح عناوين URL خارجه ([`openUrl`](../modules/nsh.md#openurl)، وروابط `TextView` مع
`links="open"`): `"openUrl": true` لكل scheme، و`"openUrl": { "schemes": ["https", "mailto"] }` للـ schemes
المسرودة. وعنوان URL لا يُمنح scheme الخاص به يُرفض بـ `ERR_ACCESS_DENIED` (`permission` `"openUrl"`، و`resource`
هو عنوان URL). أما عناوين URL التي من شأنها تشغيل شيفرة أو الوصول إلى بيانات التطبيق نفسه
(`javascript:` و`data:` و`file:` ...) فلا تُفتح أبدًا، أيًّا كانت الصلاحية.

### Storage

يجوز لكل تطبيق حفظ بياناته على الجهاز باستخدام [`Storage`](../modules/nsh.md#storage) دون أي صلاحية: فالتخزين لا يحتوي إلا بيانات ذلك التطبيق، والتطبيق المضمِّن هو من يقرر مكان حفظها.

### `host`

يسرد `host` دوال التطبيق المضمِّن لـ NSH التي يجوز لـ `host.call(name, args)` الخاص بـ `nsh` استدعاؤها: أسماء مطابقة تمامًا
(`"getUserInfo"`) أو بادئات تنتهي بـ `*` (يطابق `"bridge.*"` كلًا من `bridge.call` و`bridge.share`). ويسمح `"host": true`
بكل الدوال. والدالة غير المسرودة تُرفض، حتى في تطبيق بلا `"capabilities"`: فدوال المضيف
لا تُمنح افتراضيًا أبدًا، وبناء تطبيق يستورد `host` من `nsh` بدون `host` يحذّر من أن كل
استدعاء سيُرفض. الأسماء من 1 إلى 128 حرفًا من `A`–`Z` و`a`–`z` و`0`–`9` و`_` و`.` و`:` و`-`، بدون `..`؛
ويُرفض استدعاء أي اسم آخر قبل قراءة المنح. أنهِ البادئة بفاصل (`"bridge.*"`):
فـ `"bridge*"` يطابق `bridgeAdmin` أيضًا. وتصل أحداث المضيف (`host.on(event, listener)`) إلى مستمعي التطبيق كما يرسلها المضيف.

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` تساوي true على المنصات التي تضمّن مضيفًا؛ وفي غيرها يُرفض `host.call` بـ `code`
`"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.
<a id="what-a-refusal-looks-like"></a>

### كيف يبدو الرفض

| الطلب | النتيجة |
|---|---|
| `fetch` | يُرفض الـ promise بالخطأ `TypeError`، كما في كل طلب فاشل، وقيمة `code` فيه هي `ERR_ACCESS_DENIED`، و`permission` `"network"` و`resource` عنوان URL (عنوان الطلب أو عنوان إعادة التوجيه)؛ ولا يصل الطلب إلى الشبكة أبدًا. |
| `Image.getSize`، `Image.prefetch` | يُرفض الـ promise بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"network"` و`resource` عنوان URL؛ ولا يُطلب الصورة أبدًا. |
| صورة بعيدة، أو مصدر فيديو، أو مصدر web view، أو `html` | لا يُعرض شيء، ويُبلغ عنه `onError` الخاص بالعنصر مع `code` `"ERR_ACCESS_DENIED"`. أما انتقال web view إلى مضيف غير ممنوح فيُلغى ويُبلغ عنه بالطريقة نفسها. |
| تغيير شريط الحالة، وصورة canvas | لا يتغير شيء ولا يُرسم شيء؛ ويُسجَّل الرفض. |
| الحافظة (Clipboard) | تُرفض كل دالة في `Clipboard` بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"clipboard"` و`resource` `""`؛ ولا تُمَسّ حافظة النظام أبدًا. |
| أداة الاختيار (Picker) | لا يعرض `pickImages` شيئًا ويُرفض بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"picker"` و`resource` `""`. |
| الكلام (Speech) | يطلق `Speech.start` الخطأ `ERR_ACCESS_DENIED`، و`permission` `"speech"` و`resource` `""`؛ ويبقى الميكروفون مغلقًا. |
| `openUrl` | يُرفض الـ promise بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"openUrl"` و`resource` عنوان URL؛ ولا يُفتح شيء. |
| استدعاء المضيف (Host call) | يُرفض `host.call` بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"host"` و`resource` اسم الدالة (ويطلقه `host.post`)؛ ولا يصل الاستدعاء إلى المضيف أبدًا. |
| الملفات (`fs/promises`) | يُرفض الـ promise بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"fs"` و`resource` المسار؛ ولا يُمَسّ القرص أبدًا. |
| العمليات (`process`) | يُرفض `run`، ويطلق `spawn` و`exit` الخطأ، مع `ERR_ACCESS_DENIED`، و`permission` `"process"` و`resource` الأمر (`"exit"` بالنسبة إلى `exit`)؛ ولا تبدأ أي عملية فرعية. |
| مقبس TCP (`net.connect`) | يُرفض الـ promise بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"network"` و`resource` الـ `"host:port"`، قبل أي استعلام DNS. |
| WebSocket | يُرفض `connect` في وحدة `websocket` بالخطأ `ERR_ACCESS_DENIED`، و`permission` `"network"` و`resource` عنوان URL؛ أما `WebSocket` العام فيُطلق `error` ثم `close` (الرمز 1006)، كما يحدث عند فشل أي اتصال. |

تحمل أخطاء [الوحدات القياسية](../modules/standard-modules.md#failures) `code` `"ERR_ACCESS_DENIED"`، فيستطيع التطبيق التمييز بين الرفض وفشل العملية، ويحدد `permission` و`resource` فيها القدرة (capability) وما طُلب. وترفض وحدات [`nsh`](../modules/nsh.md) بالطريقة نفسها: تُرفض الـ promises فيها بالخطأ `ERR_ACCESS_DENIED`، و`permission` و`resource` (`fetch` مع `TypeError`، وهو الصنف الذي تستخدمه كل الطلبات الفاشلة).

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

تحصل مكوّنات Rust على الرفض نفسه بمصطلحات Rust: فقراءة الحافظة المرفوضة تعيد ما تعيده الحافظة الفارغة، واختيار الملفات المرفوض يعيد قائمة بلا ملفات، و`open_url` `false` المرفوض، و`fetch` المرفوض يعيد `Err` مع الرسالة.

يُسجَّل كل رفض مرة واحدة، مع بيان المفتاح الذي ينبغي إضافته:

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

يتولى NSH متابعة عمليات إعادة التوجيه بنفسه، لا حزمة HTTP الخاصة بالمنصة، ولذلك يُفحص كل انتقال وفق القدرات. (لا يُرسل جسم الطلب المتدفق مرتين، لذا تفشل إعادة التوجيه `307` / `308` لعملية رفع متدفقة.)

<a id="where-capabilities-travel"></a>

### أين تنتقل القدرات

يرافق التصريح التطبيق أينما ذهب:

- يكتبه `nsh build` و`nsh package` بجوار الحزمة بالاسم `capabilities.json`؛
- ويضعه `nsh publish` في ترويسة [الحزمة الموقَّعة](./signed-packages.md)، فيشمله التوقيع؛
- ويرسله `nsh dev` مع كل بناء، فتُطبَّق أثناء التطوير القواعد نفسها. ويؤدي تغيير `capabilities` إلى إعادة تحميل التطبيق بدلًا من ترقيعه مباشرة (hot-patching).

<a id="grants-what-a-host-app-allows"></a>

## المنح (Grants): ما يسمح به التطبيق المضيف

يستطيع التطبيق المضيف الذي يدمج NSH أن يمنح **على الأكثر** بعض القدرات، بصيغة JSON نفسها:

```rust
// iOS, in Rust (nsh_platform_ios::AppView)
let grant = nsh_engine::Capabilities::from_json(&serde_json::json!({
    "network": { "hosts": ["api.example.com"] }
}))?;
app.set_granted_capabilities(Some(grant));
```

```swift
// iOS
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
```

```java
// Android
nsh.setGrantedCapabilities("{ \"network\": { \"hosts\": [\"api.example.com\"] } }");
```

يجب أن يسمح بالطلب كلٌّ من تصريح التطبيق ومنحة المضيف **معًا**. ومع المنحة أعلاه، يبقى التطبيق الذي يصرّح بـ `"hosts": ["*"]` قادرًا على الوصول إلى `api.example.com` فقط، ولا يستطيع عرض صفحات الويب ولا تغيير شريط الحالة. وعند غياب المنحة (`nil` / `null`، وهو الوضع الافتراضي) يسري ما يصرّح به كل تطبيق.

تسري المنح بدءًا من التحميل التالي. ومن الإعدادات النموذجية للتطبيقات المصغّرة التابعة لجهات خارجية: امنح كل تطبيق مضيف API الخاص به فقط، وشغّله من [حزمة موقَّعة](./signed-packages.md) راجعتَ تصريحها، وأبقِ الحدود الافتراضية أو خفّضها.

> [!WARNING]
> [المكوّنات الأصلية](./native-components.md) التي يسجّلها التطبيق المضيف هي شيفرته الخاصة: فلا تنطبق عليها القدرات. سجّل فقط المكوّنات الآمنة لكل تطبيق قد يشغّله العرض (view).

<a id="summary"></a>

## ملخص

| الطبقة | تفرضها | يحددها |
|---|---|---|
| الحدود (heap، stack، الوقت، العُقد) | بيئة التشغيل، لكل VM | التطبيق المضيف لكل view (للتطبيقات المدمجة) |
| التحصين (Hardening) | بيئة التشغيل، عند التحميل | مفعّلة دائمًا خارج التطوير |
| القدرات (Capabilities) | بيئة التشغيل (fetch، الصور، الفيديو، web views، شريط الحالة، الملفات، العمليات، المقابس) | التطبيق (`nsh.json`) والتطبيق المضيف (المنحة) |
| سلامة الشيفرة | التحقق من التوقيع | `nsh publish`؛ والجذور الموثوقة للتطبيق المضيف |

<a id="see-also"></a>

## انظر أيضًا

- [الحزم الموقَّعة](./signed-packages.md)
- [الشبكات](./networking.md)
- [التضمين في تطبيقات iOS](./ios.md)، [التضمين في تطبيقات Android](./android.md)
