---
title: "Android"
description: "使用 Android views 在 Android 上執行以 Rust 與 TSX 撰寫的 NSH 應用程式,可在模擬器或實體裝置上運行,將其封裝為 .apk,並透過 nsh.aar 與 NshView 嵌入現有的 Android 應用程式中。"
order: 12
group: platforms
---

# Android

NSH 應用程式在 Android 上以一般的 Android view 與 `StaticLayout` 文字執行,支援 Android 9(API 28)以上,可在 `arm64-v8a`、`armeabi-v7a` 與 `x86_64` 上執行。以 Rust 與 TSX 撰寫的完整應用程式,其執行與封裝方式和其他平台相同;既有的應用程式也可以將模組嵌入 `NshView`,並在其設定的限制與 capabilities 之下載入所下載的已簽署套件。在 Android 上,`os()` 為 `Os::Android`(TSX 中 `platform.os` 為 `"android"`),並適用 TSX 的 `android={{…}}` props。

<a id="requirements"></a>

## 需求

- **Android SDK**(含 `platforms;android-35`、build tools 與 `platform-tools`)以及 **JDK**,可在 macOS、Windows 或 Linux 上使用。請參閱[安裝](./installation.md#android)。
- 模擬器,或透過 `adb` 連接的裝置。

<a id="running-an-app"></a>

## 執行應用程式

Rust 應用程式從其目錄執行,TSX 應用程式則需指定其進入點:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

請先啟動模擬器或連接裝置(`adb devices` 會列出它們;NSH 使用第一個)。對於 Rust 應用程式,`nsh` 會將應用程式的 `libnsh.so` 與你的 crate 一起建置、安裝 APK 並啟動;crate 的 Rust 程式碼有變更時,會重新建置並安裝。對於 TSX 應用程式,它會安裝開發用的 host APK(僅在 runtime 變更時才重新建置),並以 `adb reverse` 轉送開發伺服器的連接埠,因此透過 USB 即可運作,無需共用網路;應用程式會在你儲存時更新,記錄則顯示於終端機。

<a id="packaging"></a>

## 封裝

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

Rust 應用程式的 APK 內含以你的 crate 建置的專屬 `libnsh.so`,其 activity 會掛載根元件。

APK 使用 SDK 的 build tools 建置,不使用 Gradle,並以 debug 金鑰簽署,除非你傳入 release keystore。release 簽署與圖示請參閱[封裝](./packaging.md#android)。

NSH 以 16 KB ELF 對齊方式建置 `libnsh.so`,並將未壓縮的原生函式庫封裝在 16 KB ZIP 邊界上。release APK 中的 `libnsh.so` 不含符號表與除錯資訊。完整的函式庫與 runtime 一起放在 `symbols/<abi>/libnsh.so`(Rust 應用程式的則放在 `.nsh/rust/android-rust-release/symbols/<abi>/`):將它交給 `ndk-stack`,或作為原生除錯符號上傳到 Play Console,以便讀取原生當機堆疊。

<a id="embedding-in-an-android-app"></a>

## 嵌入 Android 應用程式

既有的 Android 應用程式可以在自己的 UI 中顯示 NSH 應用程式。runtime 以 Android 函式庫 `nsh.aar` 的形式提供:你建立一個 `com.longbridge.nsh.NshView`(一種 `FrameLayout`),將它加入任何 layout,並在其中載入 TSX 應用程式或已簽署套件。以 Rust 撰寫的應用程式在 Android 上以 `nsh package --target android` 建置的 APK 形式發佈。NSH 應用程式以一般的 Android view 繪製,與你自己的 view 並排顯示。

每個 `NshView` 都是一個獨立的引擎,擁有自己的 JS VM;沒有全域 singleton,因此可以同時執行多個。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## 取得函式庫

發行版本包含兩種變體:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

AAR 包含 Java runtime 以及適用於 `arm64-v8a`、`armeabi-v7a` 與 `x86_64` 的 `libnsh.so`,並附有其符號:應用程式的 Gradle 建置會在封裝時將它們移除,並保留符號供當機報告使用。它宣告了 `INTERNET` 權限,且需要 **API 28**(Android 9)或更新版本。它附帶自己的 R8 規則(`proguard.txt`),經過縮減(minified)的建置會自動套用這些規則:原生函式庫是依名稱尋找 runtime 的類別,因此 `com.longbridge.nsh` 會維持原樣。

將它加入應用程式模組,例如從 `libs` 資料夾:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## 隨應用程式發佈 bundle

將 TSX 應用程式建置到應用程式的 assets 中:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

這會寫入 `bundle.nshc`(位元組碼)、`bundle.js`(原始碼)、`bundle.js.map`、`capabilities.json`(當 `nsh.json` 宣告了 [capabilities](./sandbox-and-capabilities.md) 時)以及 `assets/`(應用程式匯入的圖片與字型)。

<a id="show-the-app"></a>

## 顯示應用程式

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

在 Kotlin 中:

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

`NshView` 也可以放在任何 layout 內,例如你自己的工具列下方:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

view 的大小就是應用程式的視窗:NSH 會依 view 的大小排版應用程式,並在大小變更時重新排版。再次載入會取代正在執行的應用程式。完整範例位於 `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`。

## `NshView`

| 方法 | 說明 |
|---|---|
| `NshView(Context context)`、`NshView(Context context, boolean trace)` | 建立空的 view。`trace` 會記錄每次 commit 的時間。 |
| `setErrorListener(ErrorListener listener)` | 在 UI 執行緒上接收應用程式的嚴重錯誤(載入失敗、未捕捉的 JS 例外、因限制而停止的 VM)。這些錯誤一律會被記錄。 |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | 接下來載入的應用程式的 VM 限制;0 表示沿用預設值。 |
| `setGrantedCapabilities(String json)` | 接下來載入的應用程式最多可執行的操作,以 JSON 表示,格式同 `nsh.json` 的 `capabilities`;`null` 會授予各應用程式所宣告的內容。若授權無效則回傳 `false`(並被忽略)。 |
| `setLocale(Locale locale)` | 以應用程式的語言與地區取代使用者的設定:`Intl`、`locale()` 與各元件會立即跟隨,之後載入的應用程式也會以此啟動。`null` 則跟隨系統設定。 |
| `setFontScale(float scale)` | 以此文字大小取代系統的字型大小(1 為預設值):文字與輸入框會依此重新排版,`fontScale()` 也會讀取它,立即生效並套用於之後載入的應用程式;長度則維持原大小。`0` 則跟隨系統設定。 |
| `setThemeOverrides(String json)` | host 的品牌樣式,覆蓋於應用程式的 [theme](./tailwind.md#theme-tokens) 之上:一個格式同 `nsh.json` 的 `"theme"` 的 theme 檔案。同名的 token 會優先於應用程式的 token,淺色與深色模式皆然,應用程式的其他 token 則保持不變。立即生效並套用於之後載入的應用程式;`null` 會還原應用程式自己的 theme。若檔案無法解析則擲出 `IllegalArgumentException`。 |
| `setStorageDirectory(File dir)` | 接下來載入的應用程式保存其[儲存空間](../modules/nsh.md#storage)的位置;`null`:`files/nsh/<app id>` 位於應用程式的私有目錄,依應用程式自己的 id 區分。 |
| `setCacheOptions(NshCacheOptions options)` | 接下來載入的應用程式保存快取與[其下載的圖片](./images-and-assets.md#kept-on-disk)的位置,以及每個應用程式保留的量。以 `NshCacheOptions.builder()` 建立:`location(File)`、`systemLocation()`(預設:快取目錄中的 `nsh`,每個應用程式位於 `<app id>`)或 `noDiskCache()`;`imagesMaxMegabytes(int)`(預設為 256)或 `imagesOff()`。 |
| `loadAssetBundle(String dir)` | 從 APK 的 assets 執行 `dir/bundle.nshc`;應用程式 assets 來自 `dir/assets/`。若無法讀取則回傳 `false`(同時回報給錯誤監聽器)。 |
| `loadBundleFile(File file)` | 執行 `bundle.js` 檔案;assets 來自其旁的 `assets/`。拒絕 `.nshc` 檔案。 |
| `runPackage(NshPackage pkg)` | 執行已驗證的已簽署套件,取代正在執行的應用程式。套件只會執行一次。 |
| `registerComponent(String name, NshComponent.Factory factory)` | 註冊[原生元件](./native-components.md)。 |
| `setParams(Object params)` | 接下來載入的應用程式的啟動參數(`Map` 或 `JSONObject`):應用程式在啟動時以 `host.params`([`host`](../modules/nsh.md#host))讀取。若參數不是 JSON 物件則回傳 `false`。 |
| `send(String name, Object data)` | 傳送事件給應用程式(`host.on(name, …)`);在應用程式開始監聽前會被保留,若尚無應用程式執行則保留給下一個應用程式。可從任何執行緒呼叫;在 `destroy()` 之後回傳 `false`。 |
| `handle(String name, HostHandler handler)` | 在 UI 執行緒上處理應用程式對 `name` 的呼叫(`host.call`)與傳送(`host.post`);`null` 會移除處理器。處理器透過其 `NshHostReply` 回應,僅一次,可從任何執行緒進行。 |
| `connectDevServer(String url)` | 開發用:從 `nsh dev` 伺服器載入,並在每次變更時重新載入。搭配 release AAR 時回傳 `false`。 |
| `handleBack()` | 讓應用程式處理返回操作(關閉對話框、彈出頁面、執行 `BackHandler` 監聽器);回傳應用程式是否已處理。 |
| `destroy()` | 停止應用程式,並對其每個原生元件呼叫 `destroy()`。此後該 view 無法再使用。 |

> [!IMPORTANT]
> 編譯後的位元組碼(`.nshc`)只會從 APK 自己的 assets 或已簽署套件載入。儲存空間上的檔案可能被替換,而 QuickJS 不會驗證位元組碼,因此 `loadBundleFile` 只接受 JS 原始碼。應用程式下載的程式碼應以[已簽署套件](./signed-packages.md)的形式提供。

`setLimits`、`setGrantedCapabilities`、`setStorageDirectory` 與 `setCacheOptions` 從下一次載入起生效:請在 `loadAssetBundle` 等方法之前呼叫它們。

每個應用程式無需任何設定,即以自己的 id 保存其儲存空間:已簽署套件使用其 release 金鑰的憑證所保證的 id,bundle 則使用其 `nsh.json` 的 `id`(`nsh/app.json` 位於 APK 的 assets 中,由 `nsh package` 寫入)。呼叫 `setStorageDirectory` 可將應用程式的資料保存在 host 所選擇的位置:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## 與應用程式溝通

view 與其執行的應用程式透過專屬的通道([`host`](../modules/nsh.md#host))溝通:包含應用程式在啟動時讀取的啟動參數、來自 host 應用程式的事件,以及來自應用程式的呼叫與傳送,資料為 JSON(在此端為 map、list、字串、數字與布林值)。它不需要應用程式中有任何 view,也不需要原生元件。

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

在 Kotlin 中:

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

處理器在 UI 執行緒上執行;呼叫會等待應用程式中的回應,而不會阻塞任何一端。若一直沒有給出回覆,該呼叫會在被回收後失敗;呼叫沒有處理器的名稱則會立即失敗。應用程式尚未監聽的事件名稱,其事件會被保留到應用程式開始監聽為止;在沒有應用程式執行時(`loadAssetBundle` 之前、重新載入期間)傳送的事件,會交給下一個應用程式。

<a id="theme-overrides"></a>

## Theme 覆寫

同一個應用程式嵌入多個不同品牌的 host 應用程式時,可採用各 host 的品牌:host 以 theme 檔案提供其品牌所變更的 token,格式同 `nsh.json` 的 `"theme"`(shadcn/ui 的 `cssVars`,值採用 CSS 的寫法)。它們會優先於應用程式中同名的 token;應用程式的其他 token 則保持不變。將 token 的深色模式值放在 `dark` 之下(僅放在 `light` 或 `theme` 之下的一組值,代表兩種模式下皆為該顏色):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

可在載入之前或之後呼叫:`bg-primary` 與 `rounded-(--radius)` 等 class 會立即重新套用樣式,之後載入的每個應用程式在第一個畫面就會帶有這些覆寫。`setThemeOverrides(null)` 會還原應用程式自己的 theme。

<a id="links-the-app-opens"></a>

## 應用程式開啟的連結

應用程式開啟的 URL([`openUrl`](../modules/nsh.md#openurl)、`TextView` 中帶有 `links="open"` 的連結)會先在 UI 執行緒上傳到 view 的 `OpenUrlHandler`:當 host 應用程式已處理該 URL 時(例如交由自己的 router 處理)回傳 `true`,若要交由系統以 `ACTION_VIEW` intent 開啟則回傳 `false`。若沒有處理器,系統會開啟所有 URL。URL 是在應用程式的 `openUrl` capability 允許之後才會傳到處理器。

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

## 限制

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

預設值為 256 MB 的 heap、4096 KB 的 stack、10 秒的載入時間、每次呼叫 2 秒,以及 200 000 個節點。各項限制被觸及時的行為,請參閱[沙箱與 capabilities](./sandbox-and-capabilities.md)。

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

請求必須同時被應用程式在其 `nsh.json` 中的宣告與授權所允許。請參閱[沙箱與 capabilities](./sandbox-and-capabilities.md)。

<a id="signed-packages"></a>

## 已簽署套件

請在 UI 執行緒之外驗證下載的套件,然後在 UI 執行緒上執行:

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

| API | 說明 |
|---|---|
| `new NshTrust(File stateDir)` | 開啟或建立信任儲存區。其狀態(最新的撤銷清單、每個應用程式已接受的最高 build)會保存在其中,套件的 assets 也會解壓縮到其下。在呼叫 `addRoot` 之前不信任任何金鑰。可從任何執行緒使用;完成時 `close()`。 |
| `boolean addRoot(String publicKey)` | 信任一個根公開金鑰(base64,即 `.pub` 檔案的內容)。金鑰無效時 `false`。 |
| `boolean updateRevocations(String json)` | 套用來自 `nsh revoke` 的撤銷清單,該清單須由受信任的根金鑰簽署,且比儲存區中的更新。 |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | 驗證、解壓縮 assets 並接受該套件(此後會拒絕該應用程式較舊的 build)。大型套件會較慢:請在 UI 執行緒之外呼叫。 |
| `NshPackage` | `appId`、`appName`、`version`、`build`;若無法執行則 `close()`。 |

金鑰、憑證與撤銷的運作方式:[已簽署套件](./signed-packages.md)。

<a id="development"></a>

## 開發

搭配 `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

在你的電腦上執行 `nsh dev App.tsx`。對於模擬器或 USB 裝置,請轉送連接埠,讓裝置自己的 `127.0.0.1` 能連到伺服器:

```sh
adb reverse tcp:8790 tcp:8790
```

否則請使用 `nsh dev` 所印出的區域網路位址。assets 是透過純 HTTP 從開發伺服器取得,因此 `nsh-dev.aar` 宣告了 `android:usesCleartextTraffic="true"`,manifest merger 會將其套用到應用程式(應用程式的 network security config 可以覆寫它)。release 的 `nsh.aar` 則不會。

<a id="activity-setup"></a>

## Activity 設定

- **返回鍵。** 當應用程式需要返回操作時(開啟的對話框、已推入的頁面、`BackHandler` 監聽器),`NshView` 會自行接收返回操作,否則交由 activity 處理。在 Android 13 以上搭配 `android:enableOnBackInvokedCallback="true"` 時,它會註冊一個 `OnBackInvokedCallback`;在其他情況(Android 12 及更舊版本,或該屬性關閉時),它會在 activity 的 `onBackPressed` 之前接收返回鍵,因此早於 AndroidX 的 `OnBackPressedDispatcher` 與 fragment 的回呼。無論在 activity 或 fragment 中都不需要轉送。已經將返回操作轉送到 `handleBack()` 的 host 仍可正常運作:一次返回操作只會傳給應用程式一次。

  若要在 Android 13+ 使用預測式返回,請在 `<application>` 上設定 `android:enableOnBackInvokedCallback="true"`,如同已封裝的 NSH 應用程式所做的。
- **鍵盤。** `NshView` 會自行捲動取得焦點的輸入框,使其不被鍵盤遮住。請不要設定 `android:windowSoftInputMode`,或使用 `adjustResize`;若使用 `adjustPan`,則會改由系統移動整個視窗。
- **安全區域。** view 只會將與它重疊的系統列與鍵盤部分回報為 inset,因此位於工具列下方的 `NshView` 不會得到上方 inset。對於延伸至邊緣(edge-to-edge)的內容,請繪製在系統列之後,並讓應用程式使用 `env(safe-area-inset-*)` padding / `safeAreaInsets()`(Rust 中為 `safe_area()`)。
- **組態變更。** 因旋轉或 theme 變更而重新建立的 activity 會銷毀 view,應用程式也會從頭開始。若要讓它持續執行,請宣告 activity 自行處理的變更;已封裝的 NSH 應用程式使用:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` 會自行跟隨新的尺寸、色彩配置、字型縮放、顯示密度與版面方向;應用程式會保留其狀態。捲動位置會在新的內容範圍內以邏輯座標還原。Sticky view 與開啟中的 modal 視窗也會跟隨新的密度。
- **生命週期。** 當宿主 activity 或 fragment 結束時,請呼叫 `destroy()`。
<a id="see-also"></a>

## 另請參閱

- [使用 Rust 建置](./rust.md)
- [嵌入至 iOS 應用程式](./ios.md)
- [原生元件](./native-components.md)
- [已簽署的套件](./signed-packages.md)
- [封裝](./packaging.md)：無需撰寫任何 Java 即可產生獨立的 APK
