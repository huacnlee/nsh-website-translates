---
title: "Android"
description: "使用 Android views 在模擬器或裝置上執行 Rust 和 TSX 的 NSH 應用程式,將它們封裝為 .apk,並透過 nsh.aar 和 NshView 嵌入到現有的 Android 應用程式中。"
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---


# Android

NSH 應用程式以一般 Android view 及 `StaticLayout` 文字在 Android 上運行，支援 Android 9（API 28）或以上，可在 `arm64-v8a`、`armeabi-v7a` 及 `x86_64` 上執行。以 Rust 及 TSX 編寫的完整應用程式，其運行及打包方式與其他平台相同；現有的應用程式亦可在 `NshView` 中嵌入模組，並載入自行下載的已簽署套件，所受的限制及權限由該應用程式設定。在 Android 上，`os()` 是 `Os::Android`（在 TSX 中，`platform.os` 是 `"android"`），TSX 的 `android={{…}}` props 亦適用。

<a id="requirements"></a>

## 要求

- **Android SDK**（包括 `platforms;android-35`、build tools 及 `platform-tools`）及 **JDK**，可在 macOS、Windows 或 Linux 上使用。請參閱[安裝](./installation.md#android)。
- 模擬器，或透過 `adb` 連接的裝置。

<a id="running-an-app"></a>

## 執行應用程式

Rust 應用程式在其目錄中執行，TSX 應用程式則需指定其入口：

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

請先啟動模擬器或連接裝置（`adb devices` 會列出它們；NSH 使用第一個）。對於 Rust 應用程式，`nsh` 會連同你的 crate 建置應用程式的 `libnsh.so`，安裝 APK 並啟動；crate 的 Rust 程式碼一有變更，就會重新建置及安裝。對於 TSX 應用程式，它會安裝開發用的 host APK（僅在 runtime 變更時重新建置），並以 `adb reverse` 轉發 dev server 的連接埠，因此透過 USB 即可運作，毋須共用網絡；應用程式會在你儲存時更新，日誌則顯示在終端機中。

<a id="packaging"></a>

## 打包

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

Rust 應用程式的 APK 載有自己的 `libnsh.so`，它連同你的 crate 一併建置，其 activity 會掛載根元件。

APK 以 SDK 的 build tools 建置，不使用 Gradle，除非你提供 release keystore，否則以 debug 金鑰簽署。Release 簽署及圖示：[打包](./packaging.md#android)。

NSH 以 16 KB ELF 對齊建置 `libnsh.so`，並將未壓縮的原生程式庫打包於 16 KB ZIP 邊界上。Release APK 內的 `libnsh.so` 不含符號表及除錯資訊。完整的程式庫與 runtime 一同放在 `symbols/<abi>/libnsh.so`（Rust 應用程式的則在 `.nsh/rust/android-rust-release/symbols/<abi>/`）：將它提供給 `ndk-stack`，或作為原生除錯符號上載至 Play Console，即可閱讀原生崩潰堆疊。

<a id="embedding-in-an-android-app"></a>

## 嵌入 Android 應用程式

現有的 Android 應用程式可在自己的 UI 中顯示 NSH 應用程式。Runtime 以 Android 程式庫 `nsh.aar` 提供：你建立一個 `com.longbridge.nsh.NshView`（一個 `FrameLayout`），將它加入任何 layout，並載入 TSX 應用程式或已簽署套件。以 Rust 編寫的應用程式在 Android 上則以 `nsh package --target android` 建置的 APK 發佈。NSH 應用程式以一般 Android view 渲染，與你自己的 view 並列。

每個 `NshView` 都是一個獨立的引擎，擁有自己的 JS VM；沒有全域 singleton，因此可同時運行多個。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## 取得程式庫

發佈內容包含兩個版本：

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

AAR 載有 Java runtime 及適用於 `arm64-v8a`、`armeabi-v7a` 和 `x86_64` 的 `libnsh.so`，並附有符號：應用程式的 Gradle 建置在打包時會將之移除，並保留符號以供崩潰報告使用。它宣告了 `INTERNET` 權限，並需要 **API 28**（Android 9）或更新版本。它附帶自己的 R8 規則（`proguard.txt`），經縮減（minified）的建置會自動套用：原生程式庫按名稱尋找 runtime 的類別，因此 `com.longbridge.nsh` 保持不變。

將它加入應用程式模組，例如從 `libs` 資料夾：

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## 隨應用程式附上 bundle

將 TSX 應用程式建置到應用程式的 assets：

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

這會寫入 `bundle.nshc`（bytecode）、`bundle.js`（原始碼）、`bundle.js.map`、`capabilities.json`（當 `nsh.json` 宣告了 [capabilities](./sandbox-and-capabilities.md) 時）及 `assets/`（應用程式匯入的圖片及字型）。

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

在 Kotlin 中：

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

`NshView` 亦可放在任何 layout 內，例如你自己的工具列下方：

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

View 的大小就是應用程式的視窗：NSH 會按 view 的大小排版應用程式，並在大小改變時再次排版。再次載入會取代正在運行的應用程式。完整範例位於 `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`。

## `NshView`

| 方法 | 說明 |
|---|---|
| `NshView(Context context)`、`NshView(Context context, boolean trace)` | 建立空白的 view。`trace` 會記錄每次 commit 的時間。 |
| `setErrorListener(ErrorListener listener)` | 在 UI 執行緒上接收應用程式的致命錯誤（載入失敗、未捕獲的 JS 例外、因限制而停止的 VM）。這些錯誤一律會記錄。 |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | 其後載入的應用程式的 VM 限制；0 表示使用預設值。 |
| `setGrantedCapabilities(String json)` | 其後載入的應用程式最多可執行的操作，以 JSON 表示，格式同 `nsh.json` 的 `capabilities`；`null` 會授予各應用程式所宣告的權限。授權無效時返回 `false`（並會被忽略）。 |
| `setLocale(Locale locale)` | 以應用程式的語言及地區取代使用者的設定：`Intl`、`locale()` 及各元件會立即跟隨，其後載入的應用程式亦以此啟動。`null` 則跟隨系統設定。 |
| `setFontScale(float scale)` | 以文字大小取代系統的字型大小（1 為預設值）：文字及輸入欄位會按此重新排版，`fontScale()` 會讀取此值，並立即生效，亦適用於其後載入的應用程式；長度則保持原有大小。`0` 則跟隨系統設定。 |
| `setThemeOverrides(String json)` | 以 host 的品牌覆蓋應用程式的[主題](./tailwind.md#theme-tokens)：格式同 `nsh.json` 的 `"theme"` 的主題檔案。其 token 會優先於應用程式中同名的 token，淺色及深色模式皆然，應用程式的其他 token 則保留。立即生效，亦適用於其後載入的應用程式；`null` 會還原應用程式自己的主題。若檔案無法解析，則拋出 `IllegalArgumentException`。 |
| `setStorageDirectory(File dir)` | 其後載入的應用程式存放其[儲存空間](../modules/nsh.md#storage)的位置；`null`：位於應用程式私有目錄中的 `files/nsh/<app id>`，按應用程式自己的 id 區分。 |
| `setCacheOptions(NshCacheOptions options)` | 其後載入的應用程式存放快取及其[下載的圖片](./images-and-assets.md#kept-on-disk)的位置，以及每個應用程式可保留的量。以 `NshCacheOptions.builder()` 建立：`location(File)`、`systemLocation()`（預設：快取目錄中的 `nsh`，每個應用程式位於 `<app id>`）或 `noDiskCache()`；`imagesMaxMegabytes(int)`（預設為 256）或 `imagesOff()`。 |
| `loadAssetBundle(String dir)` | 從 APK 的 assets 執行 `dir/bundle.nshc`；應用程式的 assets 來自 `dir/assets/`。若無法讀取則返回 `false`（同時會報告給錯誤監聽器）。 |
| `loadBundleFile(File file)` | 執行 `bundle.js` 檔案；assets 來自其旁邊的 `assets/`。拒絕 `.nshc` 檔案。 |
| `runPackage(NshPackage pkg)` | 執行已驗證的已簽署套件，取代正在運行的應用程式。套件只會執行一次。 |
| `registerComponent(String name, NshComponent.Factory factory)` | 註冊[原生元件](./native-components.md)。 |
| `setParams(Object params)` | 其後載入的應用程式的啟動參數（`Map` 或 `JSONObject`）：應用程式在啟動時以 `host.params`（[`host`](../modules/nsh.md#host)）讀取。若參數不是 JSON 物件，則返回 `false`。 |
| `send(String name, Object data)` | 向應用程式發送事件（`host.on(name, …)`）；事件會保留至應用程式開始監聽為止，若當時沒有應用程式運行，則保留給下一個應用程式。可在任何執行緒呼叫；在 `destroy()` 之後返回 `false`。 |
| `handle(String name, HostHandler handler)` | 在 UI 執行緒上處理應用程式對 `name` 的呼叫（`host.call`）及發佈（`host.post`）；`null` 會移除處理器。處理器透過其 `NshHostReply` 回應，只可回應一次，可在任何執行緒進行。 |
| `connectDevServer(String url)` | 開發用：從 `nsh dev` 伺服器載入，並在每次變更時重新載入。使用 release AAR 時返回 `false`。 |
| `handleBack()` | 讓應用程式處理返回鍵（關閉對話框、彈出頁面、執行 `BackHandler` 監聽器）；返回應用程式是否已處理。 |
| `destroy()` | 停止應用程式，並對其每個原生元件呼叫 `destroy()`。該 view 其後不可再使用。 |

> [!IMPORTANT]
> 已編譯的 bytecode（`.nshc`）只會從 APK 自己的 assets 或已簽署套件載入。儲存空間上的檔案可被替換，而 QuickJS 不會驗證 bytecode，因此 `loadBundleFile` 只接受 JS 原始碼。應用程式下載的程式碼應以[已簽署套件](./signed-packages.md)形式提供。

`setLimits`、`setGrantedCapabilities`、`setStorageDirectory` 及 `setCacheOptions` 由下次載入起生效：請在 `loadAssetBundle` 等方法之前呼叫它們。

每個應用程式無需任何設定，即在自己的 id 下保存儲存空間：已簽署套件使用其 release 金鑰的證書所擔保的 id，bundle 則使用其 `nsh.json` 的 `id`（`nsh/app.json` 位於 APK 的 assets 中，由 `nsh package` 寫入）。呼叫 `setStorageDirectory` 可將應用程式的資料保存在 host 指定的位置：

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## 與應用程式通訊

View 與其運行的應用程式透過專屬的通道通訊（[`host`](../modules/nsh.md#host)）：包括應用程式在啟動時讀取的啟動參數、來自 host 應用程式的事件，以及來自應用程式的呼叫與發佈，資料為 JSON（在這一端為 map、list、字串、數字及布林值）。它不需要應用程式中有任何 view，也不需要原生元件。

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

在 Kotlin 中：

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

處理器在 UI 執行緒上執行；呼叫會等待應用程式的回應，而不會阻塞任何一方。若一直沒有給出回覆，該呼叫會在被回收時失敗；呼叫沒有處理器的名稱則會立即失敗。應用程式尚未監聽的事件名稱，其事件會保留至應用程式開始監聽為止；在沒有應用程式運行期間（`loadAssetBundle` 之前、重新載入期間）發送的事件，會交給下一個應用程式。

<a id="theme-overrides"></a>

## 主題覆蓋

同一個應用程式嵌入多個不同品牌的 host 應用程式時，會採用各 host 的品牌：host 提供其品牌所更改的 token，格式為 `nsh.json` 的 `"theme"` 的主題檔案（shadcn/ui 的 `cssVars`，值以 CSS 的寫法表示）。它們會優先於應用程式中同名的 token；應用程式的其他 token 則保留。深色模式的值放在 `dark` 之下（只在 `light` 或 `theme` 下設定的值，在兩種模式下都是該顏色）：

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

可在載入之前或之後呼叫：`bg-primary` 及 `rounded-(--radius)` 等 class 會立即重新套用樣式，其後載入的每個應用程式，其第一個畫面已套用這些覆蓋。`setThemeOverrides(null)` 會還原應用程式自己的主題。

<a id="links-the-app-opens"></a>

## 應用程式開啟的連結

應用程式開啟的 URL（[`openUrl`](../modules/nsh.md#openurl)、`TextView` 帶有 `links="open"` 的連結）會先交給 view 的 `OpenUrlHandler`，在 UI 執行緒上處理：若 host 應用程式已處理該 URL（例如透過自己的路由器處理），則返回 `true`；返回 `false` 則交由系統以 `ACTION_VIEW` intent 開啟。沒有處理器時，系統會開啟每個 URL。URL 須先通過應用程式的 `openUrl` 權限許可，才會到達處理器。

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

預設值為 256 MB heap、4096 KB stack、載入 10 秒、每次呼叫 2 秒及 200 000 個節點。各項限制被觸及時的行為：[沙箱與權限](./sandbox-and-capabilities.md)。

<a id="capabilities"></a>

## 權限

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

請求必須同時獲得應用程式在其 `nsh.json` 中的宣告及授權的許可。請參閱[沙箱與權限](./sandbox-and-capabilities.md)。

<a id="signed-packages"></a>

## 已簽署套件

在 UI 執行緒以外驗證下載的套件，然後在 UI 執行緒上執行：

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
| `new NshTrust(File stateDir)` | 開啟或建立信任儲存庫。其狀態（最新的撤銷清單、每個應用程式已接受的最高 build）會保存於其中，套件的 assets 亦會解壓至其下。在 `addRoot` 之前不信任任何金鑰。可在任何執行緒使用；完成時 `close()`。 |
| `boolean addRoot(String publicKey)` | 信任根公開金鑰（base64，即 `.pub` 檔案的內容）。金鑰無效時 `false`。 |
| `boolean updateRevocations(String json)` | 套用來自 `nsh revoke` 的撤銷清單，該清單須由受信任的根金鑰簽署，並且比儲存庫現有的更新。 |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | 驗證、解壓 assets 並接受該套件（此後會拒絕該應用程式較舊的 build）。大型套件會較慢：請在 UI 執行緒以外呼叫。 |
| `NshPackage` | `appId`、`appName`、`version`、`build`；若無法執行則 `close()`。 |

金鑰、證書及撤銷的運作方式：[已簽署套件](./signed-packages.md)。

<a id="development"></a>

## 開發

使用 `nsh-dev.aar`：

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

在你的電腦上執行 `nsh dev App.tsx`。對於模擬器或 USB 裝置，請轉發連接埠，使裝置本身的 `127.0.0.1` 可連到伺服器：

```sh
adb reverse tcp:8790 tcp:8790
```

否則請使用 `nsh dev` 列印出的區域網絡位址。Assets 透過純 HTTP 從 dev server 取得，因此 `nsh-dev.aar` 宣告了 `android:usesCleartextTraffic="true"`，由 manifest merger 套用到應用程式（應用程式自己的 network security config 可覆蓋它）。Release 的 `nsh.aar` 則沒有此宣告。

<a id="activity-setup"></a>

## Activity 設定

- **返回鍵。** 當應用程式需要返回鍵時（開啟了對話框、推入了頁面、有 `BackHandler` 監聽器），`NshView` 會自行接收返回操作，否則交由 activity 處理。在 Android 13 及更新版本上，若設定了 `android:enableOnBackInvokedCallback="true"`，它會註冊 `OnBackInvokedCallback`；在其他情況下（Android 12 及更舊版本，或該屬性關閉），它會在 activity 的 `onBackPressed` 之前接收返回鍵，因此早於 AndroidX 的 `OnBackPressedDispatcher` 及 fragment 的回呼。無論在 activity 或 fragment 中，都無需轉發。已將返回操作轉發到 `handleBack()` 的 host 仍可正常運作：每次返回操作只會交給應用程式一次。

  若要在 Android 13+ 使用預測式返回，請在 `<application>` 上設定 `android:enableOnBackInvokedCallback="true"`，與已打包的 NSH 應用程式相同。
- **鍵盤。** `NshView` 會自行捲動獲得焦點的輸入欄位，使其不被鍵盤遮擋。請保持 `android:windowSoftInputMode` 不設定，或使用 `adjustResize`；使用 `adjustPan` 時，系統會改為移動整個視窗。
- **安全區域。** View 只會將與它重疊的系統列及鍵盤部分以 inset 形式回報，因此位於工具列下方的 `NshView` 不會有頂部 inset。若要使用邊至邊（edge-to-edge）內容，請繪製於系統列後方，並讓應用程式使用 `env(safe-area-inset-*)` padding／`safeAreaInsets()`（Rust 中為 `safe_area()`）。
- **設定變更。** 因旋轉或主題變更而重新建立的 activity 會銷毀 view，應用程式會從頭開始。若要讓它保持運行，請宣告 activity 自行處理的變更；已打包的 NSH 應用程式使用：

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` 會自行跟隨新的大小、配色方案、字型縮放、顯示密度及版面方向；應用程式保持其狀態。捲動位置會在新內容範圍內以邏輯座標還原。Sticky view 及已開啟的 modal 視窗同樣會跟隨新的密度。
- **生命週期。** 當承載的 activity 或 fragment 離開時，請呼叫 `destroy()`。
<a id="see-also"></a>

## 另見

- [Building with Rust](./rust.md)
- [Embedding in iOS apps](./ios.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Packaging](./packaging.md)：無需撰寫任何 Java 即可建立獨立的 APK
