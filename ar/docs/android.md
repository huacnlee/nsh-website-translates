---
title: "Android"
description: "شغّل تطبيقات NSH المكتوبة بلغتي Rust وTSX على Android باستخدام عناصر عرض Android، سواء على محاكي أو على جهاز فعلي، وقم بتغليفها في ملف .apk، وضمّنها في تطبيق Android موجود باستخدام nsh.aar وNshView."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

تعمل تطبيقات NSH على Android باستخدام عروض Android العادية ونص `StaticLayout`، بدءًا من Android 9 (API 28)، على `arm64-v8a` و`armeabi-v7a`
و`x86_64`. تعمل التطبيقات الكاملة المكتوبة بـ Rust وبـ TSX وتُحزَّم كما هو الحال على المنصات الأخرى، ويمكن لتطبيق قائم
تضمين وحدات في `NshView` وتحميل حزم موقّعة ينزّلها، ضمن حدود وقدرات يحددها هو. على Android، `os()` هي `Os::Android` (و`platform.os` هي `"android"` في TSX) وتسري خصائص
`android={{…}}` في TSX.

<a id="requirements"></a>

## المتطلبات

- **Android SDK** (مع `platforms;android-35` وأدوات البناء و`platform-tools`) و**JDK**، على macOS أو Windows
  أو Linux. راجع [التثبيت](./installation.md#android).
- محاكٍ، أو جهاز متصل عبر `adb`.

<a id="running-an-app"></a>

## تشغيل تطبيق

يُشغَّل تطبيق Rust من مجلده، أما تطبيق TSX فتُسمّي نقطة دخوله:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

شغّل المحاكي أو وصّل جهازًا أولًا (`adb devices` يعرضها؛ ويستخدم NSH أول جهاز). في تطبيق Rust، يبني `nsh`
`libnsh.so` الخاص بالتطبيق مع الـ crate الخاص بك، ويثبّت ملف APK ويشغّله؛ وأي تغيير في شيفرة Rust الخاصة بالـ crate يعيد البناء
والتثبيت. في تطبيق TSX، يثبّت APK مضيفًا للتطوير (يُعاد بناؤه فقط عند تغيّر بيئة التشغيل) ويعيد
توجيه منفذ خادم التطوير باستخدام `adb reverse`، فيعمل عبر USB دون شبكة مشتركة؛ ويتحدّث التطبيق
عند الحفظ، مع عرض السجلات في الطرفية.

<a id="packaging"></a>

## التحزيم

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

يحتوي APK الخاص بتطبيق Rust على `libnsh.so` الخاص به، المبني مع الـ crate الخاص بك، والذي يركّب نشاطه (activity) الجذر.

يُبنى APK بأدوات البناء الخاصة بـ SDK، دون Gradle، ويُوقَّع بمفتاح التنقيح (debug) ما لم تمرّر مخزن مفاتيح
للإصدار. التوقيع للإصدار والأيقونات: [التحزيم](./packaging.md#android).

يبني NSH `libnsh.so` بمحاذاة ELF بحجم 16 KB ويحزّم المكتبات الأصلية غير المضغوطة على حدود ZIP بحجم 16 KB.
يحمل APK الخاص بالإصدار `libnsh.so` دون جداول الرموز ومعلومات التنقيح. توجد المكتبة الكاملة بجوار
بيئة التشغيل في `symbols/<abi>/libnsh.so` (ومكتبة تطبيق Rust في `.nsh/rust/android-rust-release/symbols/<abi>/`): سلّمها إلى
`ndk-stack` أو ارفعها إلى Play Console كرموز تنقيح أصلية لقراءة تتبّعات الأعطال الأصلية.

<a id="embedding-in-an-android-app"></a>

## التضمين في تطبيق Android

يمكن لتطبيق Android قائم عرض تطبيقات NSH داخل واجهته. تأتي بيئة التشغيل كمكتبة Android، `nsh.aar`: تنشئ
`com.longbridge.nsh.NshView` (وهو `FrameLayout`)، وتضيفه إلى أي تخطيط، وتحمّل فيه تطبيق TSX أو حزمة
موقّعة. أما التطبيق المكتوب بـ Rust فيُسلَّم على Android على هيئة APK الذي يبنيه `nsh package --target android`. يُرسم
تطبيق NSH بعروض Android العادية بجانب عروضك.

كل `NshView` هو محرّك مستقل واحد بآلة JS افتراضية خاصة به؛ ولا توجد كائنات مفردة (singletons) عامة، لذا يمكن تشغيل عدة محركات في
الوقت نفسه.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## الحصول على المكتبة

تحتوي الحزمة الموزَّعة على النسختين:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

يحتوي AAR على بيئة تشغيل Java و`libnsh.so` لـ `arm64-v8a` و`armeabi-v7a` و`x86_64`، مع رموزها: يزيلها بناء Gradle الخاص
بالتطبيق عند تحزيمه ويحتفظ بالرموز لتقارير الأعطال. ويعلن
إذن `INTERNET` ويتطلب **API 28** (Android 9) أو أحدث. ويحمل قواعد R8 الخاصة به (`proguard.txt`)، والتي يطبّقها البناء
المصغَّر تلقائيًا: إذ تجد المكتبة الأصلية فئات بيئة التشغيل بالاسم، لذا يبقى `com.longbridge.nsh`
كما هو.

أضفه إلى وحدة التطبيق، مثلًا من مجلد `libs`:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## شحن حزمة مع التطبيق

ابنِ تطبيق TSX داخل أصول (assets) التطبيق:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

يكتب هذا `bundle.nshc` (البايتكود) و`bundle.js` (المصدر) و`bundle.js.map` و`capabilities.json` (عندما يعلن `nsh.json`
[قدرات](./sandbox-and-capabilities.md)) و`assets/` (الصور والخطوط التي يستوردها التطبيق).

<a id="show-the-app"></a>

## عرض التطبيق

```java
import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import com.longbridge.nsh.NshView;

public final class MainActivity extends Activity {
    private NshView nsh;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        nsh = new NshView(this);
        nsh.setErrorListener(message -> Log.e("nsh", message));
        setContentView(nsh);
        nsh.loadAssetBundle("nsh");   // runs assets/nsh/bundle.nshc
    }

    @Override
    protected void onDestroy() {
        nsh.destroy();
        super.onDestroy();
    }
}
```

في Kotlin:

```kotlin
class MainActivity : Activity() {
    private lateinit var nsh: NshView

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        nsh = NshView(this)
        nsh.setErrorListener { message -> Log.e("nsh", message) }
        setContentView(nsh)
        nsh.loadAssetBundle("nsh")
    }

    override fun onDestroy() {
        nsh.destroy()
        super.onDestroy()
    }
}
```

يمكن أيضًا وضع `NshView` داخل أي تخطيط، تحت شريط الأدوات الخاص بك مثلًا:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

حجم العرض هو نافذة التطبيق: يوزّع NSH التطبيق بحجم العرض ويعيد ذلك كلما تغيّر. يؤدي التحميل
مجددًا إلى استبدال التطبيق العامل. العينة الكاملة في
`examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| الطريقة | الوصف |
|---|---|
| `NshView(Context context)`، `NshView(Context context, boolean trace)` | تنشئ عرضًا فارغًا. `trace` يسجّل وقت كل commit. |
| `setErrorListener(ErrorListener listener)` | تستقبل أخطاء التطبيق القاتلة (إخفاقات التحميل، استثناءات JS غير الملتقطة، آلة افتراضية أوقفها حد) على خيط الواجهة. وتُسجَّل دائمًا. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | حدود الآلة الافتراضية للتطبيقات التي تُحمَّل لاحقًا؛ القيمة 0 تُبقي الافتراضي. |
| `setGrantedCapabilities(String json)` | أقصى ما يمكن أن تفعله التطبيقات التي تُحمَّل لاحقًا، بصيغة JSON على هيئة `capabilities` في `nsh.json`؛ `null` يمنح ما يعلنه كل تطبيق. تعيد `false` (وتُتجاهل) عند منح غير صالح. |
| `setLocale(Locale locale)` | لغة التطبيق ومنطقته بدلًا من لغة المستخدم: `Intl` و`locale()` والمكونات تتبعها فورًا، والتطبيقات التي تُحمَّل لاحقًا تبدأ بها. `null` يتبع لغة النظام. |
| `setFontScale(float scale)` | حجم النص بدلًا من حجم خط النظام (1 هو الافتراضي): يُعاد تخطيط النصوص والمدخلات بهذا الحجم ويقرؤه `fontScale()`، فورًا وللتطبيقات التي تُحمَّل لاحقًا؛ وتحتفظ الأطوال بحجمها. `0` يتبع حجم النظام. |
| `setThemeOverrides(String json)` | هوية المضيف البصرية فوق [سمة](./tailwind.md#theme-tokens) التطبيق: ملف سمة بصيغة `"theme"` في `nsh.json`. تتغلب رموزها (tokens) على رموز التطبيق التي تحمل الأسماء نفسها، في الوضعين الفاتح والداكن، وتبقى رموز التطبيق الأخرى. تُطبَّق فورًا وعلى التطبيقات التي تُحمَّل لاحقًا؛ `null` يعيد للتطبيق سمته الخاصة. تُطلق `IllegalArgumentException` عند ملف لا يمكن تحليله. |
| `setStorageDirectory(File dir)` | المكان الذي تحفظ فيه التطبيقات التي تُحمَّل لاحقًا [تخزينها](../modules/nsh.md#storage)؛ `null`: `files/nsh/<app id>` في الدليل الخاص بالتطبيق، بحسب معرّف التطبيق نفسه. |
| `setCacheOptions(NshCacheOptions options)` | المكان الذي تحفظ فيه التطبيقات التي تُحمَّل لاحقًا ذاكراتها المؤقتة و[الصور التي تنزّلها](./images-and-assets.md#kept-on-disk)، وكم يحفظ كل منها. أنشئ واحدًا بـ `NshCacheOptions.builder()`: `location(File)`، `systemLocation()` (الافتراضي: `nsh` في دليل الذاكرة المؤقتة، وكل تطبيق في `<app id>`) أو `noDiskCache()`؛ `imagesMaxMegabytes(int)` (256 افتراضيًا) أو `imagesOff()`. |
| `loadAssetBundle(String dir)` | تشغّل `dir/bundle.nshc` من أصول APK؛ وتأتي أصول التطبيق من `dir/assets/`. تعيد `false` إذا تعذّرت قراءته (ويُبلَّغ ذلك أيضًا إلى مستمع الأخطاء). |
| `loadBundleFile(File file)` | تشغّل ملف `bundle.js`؛ وتأتي الأصول من `assets/` بجواره. ترفض ملفات `.nshc`. |
| `runPackage(NshPackage pkg)` | تشغّل حزمة موقّعة تم التحقق منها، وتستبدل التطبيق العامل. تعمل الحزمة مرة واحدة. |
| `registerComponent(String name, NshComponent.Factory factory)` | تسجّل [مكونًا أصليًا](./native-components.md). |
| `setParams(Object params)` | معاملات إطلاق التطبيقات التي تُحمَّل لاحقًا (`Map` أو `JSONObject`): يقرؤها التطبيق عند البدء بصيغة `host.params` ([`host`](../modules/nsh.md#host)). تعيد `false` عندما لا تكون كائن JSON. |
| `send(String name, Object data)` | ترسل حدثًا إلى التطبيق (`host.on(name, …)`)؛ يُحفظ إلى أن يستمع إليه، أو للتطبيق التالي ما دام لا يعمل تطبيق. من أي خيط؛ تعيد `false` بعد `destroy()`. |
| `handle(String name, HostHandler handler)` | تعالج استدعاءات التطبيق (`host.call`) ورسائله (`host.post`) الخاصة بـ `name` على خيط الواجهة؛ `null` يزيل المعالج. يجيب المعالج عبر `NshHostReply` مرة واحدة، ومن أي خيط. |
| `connectDevServer(String url)` | للتطوير: يحمّل من خادم `nsh dev` ويعيد التحميل عند كل تغيير. يعيد `false` مع AAR الخاص بالإصدار. |
| `handleBack()` | يتيح للتطبيق معالجة ضغطة الرجوع (يغلق مربعات الحوار، ويزيل الصفحات، ويشغّل مستمعي `BackHandler`)؛ ويعيد ما إذا فعل ذلك. |
| `destroy()` | يوقف التطبيق ويستدعي `destroy()` على كل من مكوناته الأصلية. لا يمكن استخدام العرض بعد ذلك. |

> [!IMPORTANT]
> لا يُحمَّل البايتكود المترجم (`.nshc`) إلا من أصول APK نفسه أو من حزمة موقّعة. يمكن استبدال الملفات على وحدة التخزين،
> ولا يتحقق QuickJS من صحة البايتكود، لذا يقبل `loadBundleFile` مصدر JS فقط. ينبغي أن تصل الشيفرة التي ينزّلها التطبيق
> على هيئة [حزمة موقّعة](./signed-packages.md).

تسري `setLimits` و`setGrantedCapabilities` و`setStorageDirectory` و`setCacheOptions` من التحميل التالي: استدعها قبل `loadAssetBundle` وما شابهها.

يحتفظ كل تطبيق بتخزينه تحت معرّفه الخاص دون أي إعداد: الحزمة الموقّعة تحت المعرّف الذي تضمنه شهادة مفتاح إصدارها، والحزمة (bundle) تحت `id` الخاص بـ `nsh.json` (`nsh/app.json` ضمن أصول APK، وتكتبه `nsh package`). استدعِ `setStorageDirectory` للاحتفاظ ببيانات التطبيق في مكان يختاره المضيف:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## التخاطب مع التطبيق

يتخاطب العرض والتطبيق الذي يشغّله عبر قناة خاصة بهما ([`host`](../modules/nsh.md#host)): معاملات الإطلاق
التي يقرؤها التطبيق عند البدء، والأحداث من التطبيق المضيف، والاستدعاءات والرسائل من التطبيق، بيانات JSON (خرائط
وقوائم ونصوص وأرقام وقيم منطقية في هذا الجانب). لا تحتاج إلى عرض داخل التطبيق ولا إلى مكوّن أصلي.

```java
// Before loading: what the app opens first (`host.params` in TSX).
nsh.setParams(Map.of("conversation", intent.getStringExtra("conversation")));
nsh.loadAssetBundle("nsh");

// The app's `await host.call("user.profile", { id })`, on the UI thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    api.profile(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});

// The app's `host.post("analytics", …)`: no answer.
nsh.handle("analytics", (data, reply) -> analytics.log(data));

// Later: the app hears `host.on("conversation.open", …)`.
nsh.send("conversation.open", Map.of("id", tappedConversation));
```

في Kotlin:

```kotlin
nsh.handle("user.profile") { data, reply ->
    val id = (data as Map<*, *>)["id"]
    lifecycleScope.launch {
        runCatching { api.profile(id) }
            .onSuccess { reply.resolve(mapOf("id" to id, "name" to it.name)) }
            .onFailure { reply.reject(it.message ?: "failed") }
    }
}
```

تعمل المعالجات على خيط الواجهة؛ وينتظر الاستدعاء إجابته في التطبيق دون حجب أي من الطرفين. الرد الذي
لا يُعطى يُفشل الاستدعاء بعد تجميعه، والاستدعاء باسم لا معالج له يفشل فورًا. تُحفظ الأحداث ذات الأسماء
التي لا يستمع إليها التطبيق بعد إلى أن يستمع إليها، وتذهب الأحداث المرسلة بينما لا يعمل تطبيق (قبل `loadAssetBundle`،
أو أثناء إعادة التحميل) إلى التطبيق التالي.

<a id="theme-overrides"></a>

## تجاوزات السمة

التطبيق الواحد المضمَّن في عدة تطبيقات مضيفة ذات هويات بصرية مختلفة يتبنى هوية كل مضيف: يقدّم المضيف الرموز (tokens) التي تغيّرها هويته،
على هيئة ملف سمة بصيغة `"theme"` في `nsh.json` (`cssVars` في shadcn/ui، بقيم كما تكتبها CSS). تتغلب
على رموز التطبيق التي تحمل الأسماء نفسها؛ وتبقى رموز التطبيق الأخرى. أعطِ الرمز قيمته للوضع الداكن تحت `dark`
(ومجموعة واحدة تحت `light` أو `theme` فقط تعني أن اللون نفسه في الوضعين):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

استدعِها قبل التحميل أو بعده: تُعاد تهيئة أنماط فئات مثل `bg-primary` و`rounded-(--radius)` فورًا، ويبدأ كل تطبيق
يُحمَّل لاحقًا بالتجاوزات في إطاره الأول. `setThemeOverrides(null)` يعيد للتطبيق سمته الخاصة.

<a id="links-the-app-opens"></a>

## الروابط التي يفتحها التطبيق

تصل الروابط التي يفتحها التطبيق ([`openUrl`](../modules/nsh.md#openurl)، وروابط `TextView` مع `links="open"`)
أولًا إلى `OpenUrlHandler` الخاص بالعرض، على خيط الواجهة: أعد `true` عندما يعالج التطبيق المضيف الرابط، كأن
يمرّره عبر موجّهه الخاص، و`false` ليفتحه النظام بنيّة (intent) من نوع `ACTION_VIEW`. ودون
معالج يفتح النظام كل رابط. تصل الروابط إليه بعد أن تسمح بها قدرة `openUrl` الخاصة بالتطبيق.

```java
nsh.setOpenUrlHandler(url -> {
    Uri uri = Uri.parse(url);
    // The host app's own links open in the host app.
    if ("lb".equals(uri.getScheme()) || "longbridge.com".equals(uri.getHost())) {
        router.open(uri);
        return true;
    }
    return false;
});
```

<a id="limits"></a>

## الحدود

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

الإعدادات الافتراضية هي كومة (heap) بحجم 256 MB، ومكدس (stack) بحجم 4096 KB، و10 ثوانٍ للتحميل، وثانيتان لكل استدعاء، و200 000 عقدة. ما يفعله كل حد
عند بلوغه: [العزل والقدرات](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## القدرات

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

يجب أن يكون الطلب مسموحًا به بما يعلنه التطبيق في `nsh.json` وبالمنحة معًا. راجع
[العزل والقدرات](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## الحزم الموقّعة

تحقق من الحزم المنزَّلة خارج خيط الواجهة، ثم شغّلها عليه:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);   // the contents of root.pub from `nsh keygen`

executor.execute(() -> {
    try {
        NshPackage pkg = trust.openPackage(downloadedFile);
        runOnUiThread(() -> nsh.runPackage(pkg));
    } catch (NshPackage.RefusedException e) {
        Log.w("nsh", "refused: " + e.getMessage());   // the running app stays
    }
});
```

| API | الوصف |
|---|---|
| `new NshTrust(File stateDir)` | يفتح مخزن الثقة أو ينشئه. تبقى حالته (أحدث قائمة إلغاء، وأعلى إصدار مقبول لكل تطبيق) فيه، وتُستخرج أصول الحزم تحته. لا يثق بأي مفتاح إلى أن يُستدعى `addRoot`. يمكن استخدامه من أي خيط؛ `close()` عند الانتهاء. |
| `boolean addRoot(String publicKey)` | يثق بمفتاح عام جذري (base64، محتوى ملف `.pub`). `false` عند مفتاح غير صالح. |
| `boolean updateRevocations(String json)` | يطبّق قائمة إلغاء من `nsh revoke`، موقّعة من جذر موثوق وأحدث من قائمة المخزن. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | يتحقق، ويستخرج الأصول، ويقبل الحزمة (تُرفض بعد ذلك الإصدارات الأقدم من التطبيق). بطيء للحزم الكبيرة: استدعه خارج خيط الواجهة. |
| `NshPackage` | `appId`، `appName`، `version`، `build`؛ `close()` إذا لم تعمل. |

كيف تعمل المفاتيح والشهادات والإلغاء: [الحزم الموقّعة](./signed-packages.md).

<a id="development"></a>

## التطوير

مع `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

شغّل `nsh dev App.tsx` على حاسوبك. للمحاكي أو لجهاز USB، أعد توجيه المنفذ ليصل `127.0.0.1` الخاص
بالجهاز نفسه إلى الخادم:

```sh
adb reverse tcp:8790 tcp:8790
```

وإلا فاستخدم عنوان الشبكة المحلية الذي يطبعه `nsh dev`. تأتي الأصول من خادم التطوير عبر HTTP العادي، لذا يعلن `nsh-dev.aar`
`android:usesCleartextTraffic="true"`، ويطبّقه دمج ملف manifest على التطبيق (وقد يتجاوزه إعداد أمان الشبكة
الخاص بالتطبيق). أما `nsh.aar` الخاص بالإصدار فلا يفعل ذلك.

<a id="activity-setup"></a>

## إعداد النشاط (Activity)

- **زر الرجوع.** يتلقى `NshView` ضغطات الرجوع بنفسه ما دام التطبيق يريدها (مربع حوار مفتوح، أو صفحة مدفوعة، أو
  مستمع `BackHandler`)، ويتركها للنشاط فيما عدا ذلك. مع `android:enableOnBackInvokedCallback="true"`
  على Android 13 وما بعده يسجّل `OnBackInvokedCallback`؛ وفي غير ذلك (Android 12 وما قبله، أو عند إيقاف
  السمة) يأخذ مفتاح الرجوع قبل `onBackPressed` الخاص بالنشاط، أي قبل `OnBackPressedDispatcher` الخاص بـ AndroidX
  واستدعاءات الـ fragments. لا حاجة إلى أي تمرير، لا في نشاط ولا في fragment. المضيف الذي يمرّر
  الضغطات أصلًا إلى `handleBack()` يستمر في العمل: تذهب الضغطة إلى التطبيق مرة واحدة.

  للرجوع التنبؤي على Android 13+، اضبط `android:enableOnBackInvokedCallback="true"` على `<application>`، كما
  تفعل تطبيقات NSH المحزَّمة.
- **لوحة المفاتيح.** يمرّر `NshView` حقول الإدخال المركّز عليها بعيدًا عن لوحة المفاتيح بنفسه. اترك `android:windowSoftInputMode` دون ضبط
  أو استخدم `adjustResize`؛ فمع `adjustPan` يحرّك النظام النافذة كلها بدلًا من ذلك.
- **المنطقة الآمنة.** يبلّغ العرض كهوامش (insets) فقط عن أجزاء أشرطة النظام ولوحة المفاتيح التي تتداخل معه، لذا
  لا يحصل `NshView` الموجود تحت شريط أدوات على هامش علوي. للمحتوى الممتد إلى الحواف، ارسم خلف أشرطة النظام ودع التطبيق يستخدم
  حشوة `env(safe-area-inset-*)` / `safeAreaInsets()` (`safe_area()` في Rust).
- **تغييرات الإعدادات.** النشاط الذي يُعاد إنشاؤه عند التدوير أو تغيير السمة يدمّر العرض، ويبدأ التطبيق
  من الصفر. للإبقاء عليه عاملًا، أعلن التغييرات التي يعالجها النشاط بنفسه؛ وتستخدم تطبيقات NSH المحزَّمة:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  يتبع `NshView` الحجم الجديد ونظام الألوان ومقياس الخط وكثافة العرض واتجاه التخطيط بنفسه؛ ويحتفظ التطبيق
  بحالته. تُستعاد مواضع التمرير بإحداثيات منطقية ضمن حدود المحتوى الجديدة. تتبع العروض اللاصقة
  والنوافذ المنبثقة المفتوحة الكثافة الجديدة أيضًا.
- **دورة الحياة.** استدعِ `destroy()` عندما ينتهي النشاط المضيف أو الـ fragment.
<a id="see-also"></a>

## انظر أيضًا

- [البناء باستخدام Rust](./rust.md)
- [التضمين في تطبيقات iOS](./ios.md)
- [المكونات الأصلية](./native-components.md)
- [الحزم الموقّعة](./signed-packages.md)
- [التغليف](./packaging.md): ملف APK مستقل دون كتابة أي كود Java
