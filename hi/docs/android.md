---
title: "Android"
description: "Rust और TSX NSH ऐप्स को Android views के साथ Android पर चलाएँ, चाहे एमुलेटर पर हों या डिवाइस पर, उन्हें .apk के रूप में पैकेज करें, और nsh.aar व NshView की मदद से उन्हें किसी मौजूदा Android ऐप में एम्बेड करें।"
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

NSH ऐप्स Android पर सामान्य Android views और `StaticLayout` टेक्स्ट के साथ चलते हैं, Android 9 (API 28) से, `arm64-v8a`, `armeabi-v7a` और `x86_64` पर। Rust और TSX में लिखे पूरे ऐप्स अन्य प्लेटफ़ॉर्म की तरह ही चलते और पैकेज होते हैं। कोई मौजूदा ऐप `NshView` में मॉड्यूल एम्बेड कर सकता है और डाउनलोड किए गए signed packages लोड कर सकता है, उन limits और capabilities के तहत जो वह स्वयं तय करता है। Android पर `os()` `Os::Android` है (TSX में `platform.os` `"android"` है) और TSX के `android={{…}}` props लागू होते हैं।

<a id="requirements"></a>

## आवश्यकताएँ

- **Android SDK** (`platforms;android-35`, build tools और `platform-tools` के साथ) और **एक JDK**, macOS, Windows या Linux पर। देखें [Installation](./installation.md#android)।
- एक emulator, या `adb` के ज़रिए जुड़ा हुआ डिवाइस।

<a id="running-an-app"></a>

## ऐप चलाना

Rust ऐप अपनी डायरेक्टरी से चलता है, TSX ऐप अपना entry बताता है:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

पहले एक emulator शुरू करें या डिवाइस कनेक्ट करें (`adb devices` उन्हें सूचीबद्ध करता है; NSH पहले वाले का उपयोग करता है)। Rust ऐप के लिए `nsh` आपके crate के साथ ऐप का `libnsh.so` बनाता है, APK इंस्टॉल करता है और उसे शुरू करता है; crate के Rust कोड में बदलाव होने पर वह दोबारा बनता और इंस्टॉल होता है। TSX ऐप के लिए यह एक development host APK इंस्टॉल करता है (केवल runtime बदलने पर दोबारा बनता है) और dev server का पोर्ट `adb reverse` से फ़ॉरवर्ड करता है, इसलिए यह साझा नेटवर्क के बिना USB पर काम करता है; आपके सेव करते ही ऐप अपडेट हो जाता है, और logs टर्मिनल में दिखते हैं।

<a id="packaging"></a>

## पैकेजिंग

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

Rust ऐप के APK में उसका अपना `libnsh.so` होता है, जो आपके crate के साथ बना होता है और जिसकी activity root को mount करती है।

APK को SDK के build tools से, Gradle के बिना, बनाया जाता है और debug key से साइन किया जाता है, जब तक आप release keystore न दें। release के लिए साइनिंग और आइकन: [Packaging](./packaging.md#android)।

NSH `libnsh.so` को 16 KB ELF alignment के साथ बनाता है और uncompressed native libraries को 16 KB ZIP सीमाओं पर पैकेज करता है। release APK में `libnsh.so` उसकी symbol tables और debug info के बिना होता है। पूरी library runtime के बगल में `symbols/<abi>/libnsh.so` में रहती है (Rust ऐप की `.nsh/rust/android-rust-release/symbols/<abi>/` में): native crash stacks पढ़ने के लिए इसे `ndk-stack` को दें या Play Console में native debug symbols के रूप में अपलोड करें।

<a id="embedding-in-an-android-app"></a>

## Android ऐप में एम्बेड करना

कोई मौजूदा Android ऐप NSH ऐप्स को अपने UI के भीतर दिखा सकता है। runtime एक Android library के रूप में आता है, `nsh.aar`: आप एक `com.longbridge.nsh.NshView` (एक `FrameLayout`) बनाते हैं, उसे किसी भी layout में जोड़ते हैं और उसमें TSX ऐप या signed package लोड करते हैं। Rust में लिखा ऐप Android पर उस APK के रूप में शिप होता है जिसे `nsh package --target android` बनाता है। NSH ऐप आपके अपने views के बगल में सामान्य Android views से रेंडर होता है।

प्रत्येक `NshView` अपने JS VM के साथ एक स्वतंत्र engine है; कोई global singleton नहीं हैं, इसलिए कई एक साथ चल सकते हैं।

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Library प्राप्त करना

distribution में दोनों variants शामिल हैं:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

AAR में Java runtime और `arm64-v8a`, `armeabi-v7a` और `x86_64` के लिए `libnsh.so` उनके symbols सहित होते हैं: ऐप की Gradle build ऐप पैकेज करते समय उन्हें strip कर देती है और crash reports के लिए symbols रख लेती है। यह `INTERNET` permission घोषित करता है और इसे **API 28** (Android 9) या नया चाहिए। इसमें इसके R8 नियम (`proguard.txt`) होते हैं, जिन्हें minified build अपने आप लागू करती है: native library runtime की classes को नाम से खोजती है, इसलिए `com.longbridge.nsh` जैसा है वैसा ही रहता है।

इसे ऐप module में जोड़ें, उदाहरण के लिए `libs` फ़ोल्डर से:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## ऐप के साथ bundle शिप करना

TSX ऐप को ऐप के assets में build करें:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

यह `bundle.nshc` (bytecode), `bundle.js` (source), `bundle.js.map`, `capabilities.json` (जब `nsh.json` [capabilities](./sandbox-and-capabilities.md) घोषित करता है) और `assets/` (ऐप द्वारा import की गई images और fonts) लिखता है।

<a id="show-the-app"></a>

## ऐप दिखाना

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

Kotlin में:

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

`NshView` किसी भी layout के अंदर भी रखा जा सकता है, उदाहरण के लिए आपके अपने toolbar के नीचे:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

view का आकार ही ऐप की window है: NSH ऐप को view के आकार पर layout करता है और आकार बदलने पर फिर से करता है। दोबारा लोड करने पर चल रहा ऐप बदल जाता है। पूरा नमूना `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java` है।

## `NshView`

| मेथड | विवरण |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | एक खाली view बनाता है। `trace` हर commit का समय लॉग करता है। |
| `setErrorListener(ErrorListener listener)` | घातक ऐप त्रुटियाँ (लोड विफलताएँ, अनकैच्ड JS exceptions, किसी limit से रोका गया VM) UI thread पर प्राप्त करता है। वे हमेशा लॉग होती हैं। |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | आगे लोड होने वाले ऐप्स की VM limits; 0 डिफ़ॉल्ट रखता है। |
| `setGrantedCapabilities(String json)` | आगे लोड होने वाले ऐप्स अधिकतम क्या कर सकते हैं, JSON के रूप में, `nsh.json` के `capabilities` के रूप में; `null` वह देता है जो हर ऐप घोषित करता है। अमान्य grant के लिए `false` लौटाता है (और उसे अनदेखा किया जाता है)। |
| `setLocale(Locale locale)` | उपयोगकर्ता की भाषा और क्षेत्र की जगह ऐप की भाषा और क्षेत्र: `Intl`, `locale()` और components तुरंत उसका पालन करते हैं, और बाद में लोड होने वाले ऐप्स उसी में शुरू होते हैं। `null` सिस्टम का पालन करता है। |
| `setFontScale(float scale)` | सिस्टम के font size की जगह टेक्स्ट का आकार (1 डिफ़ॉल्ट है): texts और inputs उसी पर दोबारा layout होते हैं और `fontScale()` उसे पढ़ता है, तुरंत और बाद में लोड होने वाले ऐप्स के लिए; लंबाइयाँ अपना आकार रखती हैं। `0` सिस्टम का पालन करता है। |
| `setThemeOverrides(String json)` | ऐप के [theme](./tailwind.md#theme-tokens) पर host का brand: `nsh.json` के `"theme"` के format में एक theme फ़ाइल। इसके tokens समान नामों वाले ऐप के tokens पर, light और dark mode में, भारी पड़ते हैं, और ऐप के अन्य tokens बने रहते हैं। यह तुरंत और बाद में लोड होने वाले ऐप्स पर लागू होता है; `null` ऐप को उसका अपना theme लौटा देता है। जो फ़ाइल parse नहीं होती उसके लिए `IllegalArgumentException` फेंकता है। |
| `setStorageDirectory(File dir)` | आगे लोड होने वाले ऐप्स अपना [storage](../modules/nsh.md#storage) कहाँ रखें; `null`: ऐप की निजी डायरेक्टरी में `files/nsh/<app id>`, ऐप के अपने id से। |
| `setCacheOptions(NshCacheOptions options)` | आगे लोड होने वाले ऐप्स अपने caches, [डाउनलोड की गई images](./images-and-assets.md#kept-on-disk) कहाँ रखें, और प्रत्येक कितना रखे। इसे `NshCacheOptions.builder()` से बनाएँ: `location(File)`, `systemLocation()` (डिफ़ॉल्ट: cache डायरेक्टरी में `nsh`, प्रत्येक ऐप `<app id>` में) या `noDiskCache()`; `imagesMaxMegabytes(int)` (डिफ़ॉल्ट 256) या `imagesOff()`। |
| `loadAssetBundle(String dir)` | APK के assets से `dir/bundle.nshc` चलाता है; ऐप assets `dir/assets/` से आते हैं। न पढ़ा जा सके तो `false` लौटाता है (error listener को भी रिपोर्ट होता है)। |
| `loadBundleFile(File file)` | `bundle.js` फ़ाइल चलाता है; assets उसके बगल में `assets/` से आते हैं। `.nshc` फ़ाइलों को अस्वीकार करता है। |
| `runPackage(NshPackage pkg)` | एक सत्यापित signed package चलाता है, चल रहे ऐप को बदलते हुए। एक package एक बार चलता है। |
| `registerComponent(String name, NshComponent.Factory factory)` | एक [native component](./native-components.md) रजिस्टर करता है। |
| `setParams(Object params)` | आगे लोड होने वाले ऐप्स के launch parameters (एक `Map` या `JSONObject`): ऐप उन्हें शुरू में `host.params` ([`host`](../modules/nsh.md#host)) के रूप में पढ़ता है। जब वे JSON object न हों तो `false` लौटाता है। |
| `send(String name, Object data)` | ऐप को एक event भेजता है (`host.on(name, …)`); तब तक रखा जाता है जब तक वह सुन न ले, या कोई ऐप न चल रहा हो तो अगले ऐप के लिए। किसी भी thread से; `destroy()` के बाद `false` लौटाता है। |
| `handle(String name, HostHandler handler)` | `name` के ऐप के calls (`host.call`) और posts (`host.post`) को UI thread पर संभालता है; `null` handler हटा देता है। handler अपने `NshHostReply` के ज़रिए, एक बार, किसी भी thread से उत्तर देता है। |
| `connectDevServer(String url)` | Development: `nsh dev` server से लोड करता है और हर बदलाव पर रीलोड करता है। release AAR के साथ `false` लौटाता है। |
| `handleBack()` | ऐप को back press संभालने देता है (dialogs बंद करता है, pages pop करता है, `BackHandler` listeners चलाता है); लौटाता है कि उसने संभाला या नहीं। |
| `destroy()` | ऐप को रोकता है और उसके हर native component पर `destroy()` कॉल करता है। view का फिर उपयोग नहीं किया जा सकता। |

> [!IMPORTANT]
> Compiled bytecode (`.nshc`) केवल APK के अपने assets से या signed package से लोड होता है। storage की फ़ाइलें बदली जा सकती हैं, और QuickJS bytecode को validate नहीं करता, इसलिए `loadBundleFile` केवल JS source लेता है। ऐप जो कोड डाउनलोड करता है उसे [signed package](./signed-packages.md) के रूप में आना चाहिए।

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` और `setCacheOptions` अगले लोड से लागू होते हैं: इन्हें `loadAssetBundle` और उसके साथियों से पहले कॉल करें।

प्रत्येक ऐप अपना storage बिना किसी सेटिंग के अपने id के तहत रखता है: signed package उस id के तहत जिसकी गारंटी उसकी release key का certificate देता है, bundle अपने `nsh.json` के `id` के तहत (`nsh/app.json` APK के assets में, `nsh package` द्वारा लिखा हुआ)। ऐप का डेटा host की चुनी किसी जगह रखने के लिए `setStorageDirectory` कॉल करें:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## ऐप से बात करना

view और उसमें चल रहा ऐप अपने एक अलग channel ([`host`](../modules/nsh.md#host)) से बात करते हैं: launch parameters जिन्हें ऐप शुरू में पढ़ता है, host ऐप से events, और ऐप से calls और posts, JSON डेटा के साथ (इस तरफ़ maps, lists, strings, numbers और booleans)। इसके लिए ऐप में किसी view या native component की ज़रूरत नहीं है।

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

Kotlin में:

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

Handlers UI thread पर चलते हैं; call ऐप में अपने उत्तर की प्रतीक्षा करता है, किसी भी तरफ़ को block किए बिना। जो उत्तर कभी नहीं दिया जाता, वह collect होने पर call को विफल कर देता है, और जिस नाम का कोई handler नहीं है उसका call तुरंत विफल हो जाता है। जिन नामों को ऐप अभी नहीं सुनता उनके events तब तक रखे जाते हैं जब तक वह सुनना शुरू न करे, और जो events तब भेजे जाते हैं जब कोई ऐप नहीं चल रहा (`loadAssetBundle` से पहले, रीलोड के दौरान) वे अगले ऐप को मिलते हैं।

## Theme overrides

कई brand वाले host ऐप्स में एम्बेड किया गया एक ऐप हर host का brand अपनाता है: host वे tokens देता है जिन्हें उसका brand बदलता है, `nsh.json` के `"theme"` (shadcn/ui का `cssVars`, मान वैसे ही जैसे CSS लिखता है) के format में एक theme फ़ाइल के रूप में। वे समान नामों वाले ऐप के tokens पर भारी पड़ते हैं; ऐप के अन्य tokens बने रहते हैं। किसी token का dark-mode मान `dark` के तहत दें (केवल `light` या `theme` के तहत रखा एक सेट दोनों modes में वही रंग है):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

इसे लोड करने से पहले या बाद में कॉल करें: `bg-primary` और `rounded-(--radius)` जैसी classes तुरंत नई style लेती हैं, और बाद में लोड होने वाला हर ऐप अपने पहले frame में overrides के साथ शुरू होता है। `setThemeOverrides(null)` ऐप को उसका अपना theme लौटा देता है।

<a id="links-the-app-opens"></a>

## ऐप द्वारा खोले जाने वाले links

ऐप जो URLs खोलता है ([`openUrl`](../modules/nsh.md#openurl), `links="open"` वाले `TextView` के links) वे पहले view के `OpenUrlHandler` तक UI thread पर पहुँचते हैं: जब host ऐप ने URL संभाल लिया हो, जैसे उसे अपने router से भेजकर, तो `true` लौटाएँ, और सिस्टम को उसे `ACTION_VIEW` intent से खोलने देने के लिए `false` लौटाएँ। handler के बिना सिस्टम हर URL खोलता है। URLs उस तक तब पहुँचते हैं जब ऐप की `openUrl` capability उन्हें अनुमति दे चुकी हो।

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

## Limits

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

डिफ़ॉल्ट हैं 256 MB heap, 4096 KB stack, लोड के लिए 10 s, प्रति call 2 s और 200 000 nodes। किसी limit के पहुँचने पर हर limit क्या करती है: [Sandbox and capabilities](./sandbox-and-capabilities.md)।

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

अनुरोध को ऐप के `nsh.json` में घोषित बातों और grant, दोनों से अनुमति मिलनी चाहिए। देखें [Sandbox and capabilities](./sandbox-and-capabilities.md)।

## Signed packages

डाउनलोड किए गए packages को UI thread से बाहर सत्यापित करें, फिर उन्हें उसी पर चलाएँ:

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

| API | विवरण |
|---|---|
| `new NshTrust(File stateDir)` | trust store खोलता या बनाता है। इसकी स्थिति (सबसे नई revocation list, प्रति ऐप स्वीकार किया गया सबसे ऊँचा build) वहीं बनी रहती है और packages के assets इसके नीचे extract होते हैं। `addRoot` तक किसी key पर भरोसा नहीं करता। किसी भी thread से उपयोग योग्य; पूरा होने पर `close()`। |
| `boolean addRoot(String publicKey)` | एक root public key पर भरोसा करता है (base64, `.pub` फ़ाइल की सामग्री)। अमान्य key के लिए `false`। |
| `boolean updateRevocations(String json)` | `nsh revoke` से एक revocation list लागू करता है, जो किसी भरोसेमंद root से signed हो और store की सूची से नई हो। |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | सत्यापित करता है, assets extract करता है और package स्वीकार करता है (उसके बाद से ऐप के पुराने builds अस्वीकार कर दिए जाते हैं)। बड़े packages के लिए धीमा: इसे UI thread से बाहर कॉल करें। |
| `NshPackage` | `appId`, `appName`, `version`, `build`; यदि वह नहीं चलेगा तो `close()`। |

keys, certificates और revocation कैसे काम करते हैं: [Signed packages](./signed-packages.md)।

## Development

`nsh-dev.aar` के साथ:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

अपने कंप्यूटर पर `nsh dev App.tsx` चलाएँ। emulator या USB डिवाइस के लिए पोर्ट फ़ॉरवर्ड करें ताकि डिवाइस का अपना `127.0.0.1` server तक पहुँचे:

```sh
adb reverse tcp:8790 tcp:8790
```

अन्यथा `nsh dev` द्वारा छापा गया LAN पता उपयोग करें। Assets dev server से सादे HTTP पर आते हैं, इसलिए `nsh-dev.aar` `android:usesCleartextTraffic="true"` घोषित करता है, जिसे manifest merger ऐप पर लागू करता है (ऐप का network security config इसे override कर सकता है)। release `nsh.aar` ऐसा नहीं करता।

## Activity setup

- **Back button।** `NshView` को back presses अपने आप मिलते हैं जब तक ऐप उन्हें चाहता है (खुला dialog, push किया गया page, एक `BackHandler` listener), और अन्यथा उन्हें activity पर छोड़ देता है। Android 13 और नए पर `android:enableOnBackInvokedCallback="true"` के साथ यह एक `OnBackInvokedCallback` रजिस्टर करता है; अन्यत्र (Android 12 और पुराने पर, या attribute बंद होने पर) यह back key को activity के `onBackPressed` से पहले ले लेता है, यानी AndroidX के `OnBackPressedDispatcher` और fragments के callbacks से पहले। activity या fragment में, किसी forwarding की ज़रूरत नहीं है। जो host पहले से presses को `handleBack()` पर फ़ॉरवर्ड करता है वह काम करता रहता है: एक press ऐप तक एक बार जाता है।

  Android 13+ पर predictive back के लिए `<application>` पर `android:enableOnBackInvokedCallback="true"` सेट करें, जैसा पैकेज किए गए NSH ऐप्स करते हैं।
- **Keyboard।** `NshView` focused inputs को keyboard से बाहर खुद scroll कर देता है। `android:windowSoftInputMode` को unset छोड़ें या `adjustResize` उपयोग करें; `adjustPan` के साथ सिस्टम इसके बजाय पूरी window को हिला देता है।
- **Safe area।** view insets के रूप में केवल system bars और keyboard के वे हिस्से बताता है जो उसके साथ overlap करते हैं, इसलिए toolbar के नीचे के `NshView` को कोई top inset नहीं मिलता। edge-to-edge content के लिए system bars के पीछे draw करें और ऐप को `env(safe-area-inset-*)` padding / `safeAreaInsets()` (Rust में `safe_area()`) उपयोग करने दें।
- **Configuration changes।** रोटेशन या theme बदलने पर दोबारा बनाई गई activity view को नष्ट कर देती है, और ऐप शुरू से फिर शुरू होता है। इसे चलता रखने के लिए वे बदलाव घोषित करें जिन्हें activity खुद संभालती है; पैकेज किए गए NSH ऐप्स यह उपयोग करते हैं:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` नए आकार, color scheme, font scale, display density और layout direction का खुद पालन करता है; ऐप अपनी स्थिति रखता है। Scroll positions नई content सीमाओं के भीतर logical coordinates में बहाल की जाती हैं। Sticky views और खुली modal windows भी नई density का पालन करती हैं।
- **Lifecycle।** जब होस्ट करने वाली activity या fragment चली जाए तब `destroy()` कॉल करें।
<a id="see-also"></a>

## यह भी देखें

- [Rust के साथ बिल्डिंग](./rust.md)
- [iOS ऐप्स में एम्बेड करना](./ios.md)
- [नेटिव कंपोनेंट्स](./native-components.md)
- [साइन किए गए पैकेज](./signed-packages.md)
- [पैकेजिंग](./packaging.md): बिना कोई Java लिखे एक स्टैंडअलोन APK
