---
title: "Android"
description: "Android ビューを使って、Rust と TSX で書かれた NSH アプリをエミュレーターまたはデバイス上で実行し、.apk としてパッケージ化し、nsh.aar と NshView を使って既存の Android アプリに組み込みます。"
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

NSH アプリは、Android 9(API 28)以降の `arm64-v8a`、`armeabi-v7a`、`x86_64` 上で、通常の Android ビューと `StaticLayout` テキストを使って動作します。Rust と TSX で書かれたアプリ全体は、他のプラットフォームと同様に実行・パッケージ化できます。また、既存のアプリは `NshView` にモジュールを埋め込み、ダウンロードした署名付きパッケージを、アプリ側で設定した制限と capabilities の下で読み込めます。Android では、`os()` は `Os::Android` です(TSX では `platform.os` が `"android"` になります)。また、TSX の `android={{…}}` props が適用されます。

<a id="requirements"></a>

## 要件

- **Android SDK**(`platforms;android-35`、ビルドツール、`platform-tools` を含む)と **JDK**。macOS、Windows、Linux のいずれかで使用します。[Installation](./installation.md#android) を参照してください。
- エミュレーター、または `adb` 経由で接続したデバイス。

<a id="running-an-app"></a>

## アプリの実行

Rust アプリはそのディレクトリから実行し、TSX アプリはエントリを指定して実行します。

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

先にエミュレーターを起動するか、デバイスを接続してください(`adb devices` で一覧を表示できます。NSH は最初の 1 台を使用します)。Rust アプリの場合、`nsh` はアプリの `libnsh.so` をクレートとともにビルドし、APK をインストールして起動します。クレートの Rust コードを変更すると、再度ビルドしてインストールします。TSX アプリの場合は、開発用ホスト APK(ランタイムが変わったときのみ再ビルドされます)をインストールし、開発サーバーのポートを `adb reverse` で転送します。そのため、共有ネットワークがなくても USB 経由で動作します。保存するたびにアプリが更新され、ログはターミナルに表示されます。

<a id="packaging"></a>

## パッケージ化

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

Rust アプリの APK には、クレートとともにビルドされた独自の `libnsh.so` が含まれ、その activity がルートをマウントします。

APK は Gradle を使わず、SDK のビルドツールでビルドされます。リリース用キーストアを指定しない限り、デバッグキーで署名されます。リリース用の署名とアイコンについては [Packaging](./packaging.md#android) を参照してください。

NSH は `libnsh.so` を 16 KB の ELF アライメントでビルドし、非圧縮のネイティブライブラリを 16 KB の ZIP 境界にパッケージ化します。リリース APK の `libnsh.so` には、シンボルテーブルとデバッグ情報が含まれません。完全なライブラリはランタイムの隣の `symbols/<abi>/libnsh.so` にあります(Rust アプリの場合は `.nsh/rust/android-rust-release/symbols/<abi>/`)。ネイティブのクラッシュスタックを読むには、これを `ndk-stack` に渡すか、ネイティブデバッグシンボルとして Play Console にアップロードしてください。

<a id="embedding-in-an-android-app"></a>

## Android アプリへの埋め込み

既存の Android アプリは、自身の UI の中に NSH アプリを表示できます。ランタイムは Android ライブラリ `nsh.aar` として提供されます。`com.longbridge.nsh.NshView`(`FrameLayout`)を作成して任意のレイアウトに追加し、TSX アプリまたは署名付きパッケージを読み込みます。Rust で書かれたアプリは、`nsh package --target android` がビルドする APK として Android に配布されます。NSH アプリは、自身のビューと並んで通常の Android ビューで描画されます。

各 `NshView` は、独自の JS VM を持つ独立したエンジンです。グローバルなシングルトンはないため、複数を同時に実行できます。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## ライブラリの入手

ディストリビューションには両方のバリアントが含まれています。

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

AAR には、Java ランタイムと、`arm64-v8a`、`armeabi-v7a`、`x86_64` 向けの `libnsh.so` がシンボル付きで含まれています。アプリの Gradle ビルドはパッケージ化の際にそれらを strip し、クラッシュレポート用にシンボルを保持します。AAR は `INTERNET` パーミッションを宣言し、**API 28**(Android 9)以降を必要とします。R8 ルール(`proguard.txt`)も含まれており、minify されたビルドでは自動的に適用されます。ネイティブライブラリはランタイムのクラスを名前で検索するため、`com.longbridge.nsh` はそのまま維持されます。

アプリモジュールに追加します。たとえば `libs` フォルダーから追加します。

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## アプリにバンドルを同梱する

TSX アプリをアプリの assets にビルドします。

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

これにより、`bundle.nshc`(バイトコード)、`bundle.js`(ソース)、`bundle.js.map`、`capabilities.json`(`nsh.json` が [capabilities](./sandbox-and-capabilities.md) を宣言している場合)、`assets/`(アプリがインポートする画像とフォント)が書き出されます。

<a id="show-the-app"></a>

## アプリの表示

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

Kotlin の場合:

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

`NshView` は、独自のツールバーの下など、任意のレイアウト内にも配置できます。

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

ビューのサイズがアプリのウィンドウになります。NSH はビューのサイズでアプリをレイアウトし、サイズが変わるたびに再度レイアウトします。再度読み込むと、実行中のアプリが置き換えられます。完全なサンプルは `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java` にあります。

## `NshView`

| メソッド | 説明 |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | 空のビューを作成します。`trace` は、すべてのコミットの時間をログに記録します。 |
| `setErrorListener(ErrorListener listener)` | アプリの致命的なエラー(読み込みの失敗、未捕捉の JS 例外、制限によって停止された VM)を UI スレッドで受け取ります。これらは常にログに記録されます。 |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | 次に読み込まれるアプリの VM 制限です。0 は既定値を維持します。 |
| `setGrantedCapabilities(String json)` | 次に読み込まれるアプリに許可する最大の範囲を、`nsh.json` の `capabilities` の形式の JSON で指定します。`null` は、各アプリが宣言したものを許可します。無効な許可に対しては `false` を返します(その場合は無視されます)。 |
| `setLocale(Locale locale)` | ユーザーの設定の代わりに、アプリの言語と地域を指定します。`Intl`、`locale()`、各コンポーネントが即座にそれに従い、以降に読み込まれるアプリもその設定で起動します。`null` はシステムの設定に従います。 |
| `setFontScale(float scale)` | システムのフォントサイズの代わりに使うテキストサイズです(1 が既定値)。テキストと入力欄はそのサイズで再レイアウトされ、`fontScale()` がそれを読み取ります。即座に反映され、以降に読み込まれるアプリにも適用されます。長さのサイズは変わりません。`0` はシステムの設定に従います。 |
| `setThemeOverrides(String json)` | アプリの[テーマ](./tailwind.md#theme-tokens)の上に重ねるホストのブランドです。`nsh.json` の `"theme"` の形式のテーマファイルを指定します。同名のトークンはアプリのものより優先され(ライトモードとダークモードの両方)、それ以外のアプリのトークンはそのまま残ります。即座に適用され、以降に読み込まれるアプリにも適用されます。`null` を指定すると、アプリ自身のテーマに戻ります。解析できないファイルに対しては `IllegalArgumentException` をスローします。 |
| `setStorageDirectory(File dir)` | 次に読み込まれるアプリが[ストレージ](../modules/nsh.md#storage)を保持する場所です。`null`: アプリのプライベートディレクトリ内の `files/nsh/<app id>` に、アプリ自身の ID ごとに保存されます。 |
| `setCacheOptions(NshCacheOptions options)` | 次に読み込まれるアプリがキャッシュと[ダウンロードした画像](./images-and-assets.md#kept-on-disk)を保持する場所と、それぞれが保持する量です。`NshCacheOptions.builder()` で作成します。`location(File)`、`systemLocation()`(既定値。キャッシュディレクトリ内の `nsh` で、各アプリは `<app id>` 内)、または `noDiskCache()`。`imagesMaxMegabytes(int)`(既定は 256)または `imagesOff()`。 |
| `loadAssetBundle(String dir)` | APK の assets から `dir/bundle.nshc` を実行します。アプリの assets は `dir/assets/` から取得されます。読み取れない場合は `false` を返します(エラーリスナーにも報告されます)。 |
| `loadBundleFile(File file)` | `bundle.js` ファイルを実行します。assets はその隣の `assets/` から取得されます。`.nshc` ファイルは拒否されます。 |
| `runPackage(NshPackage pkg)` | 検証済みの署名付きパッケージを実行し、実行中のアプリを置き換えます。パッケージは一度だけ実行されます。 |
| `registerComponent(String name, NshComponent.Factory factory)` | [ネイティブコンポーネント](./native-components.md)を登録します。 |
| `setParams(Object params)` | 次に読み込まれるアプリの起動パラメーター(`Map` または `JSONObject`)です。アプリは起動時に `host.params`([`host`](../modules/nsh.md#host))としてそれらを読み取ります。JSON オブジェクトでない場合は `false` を返します。 |
| `send(String name, Object data)` | アプリにイベントを送信します(`host.on(name, …)`)。アプリがリッスンするまで、またはアプリが実行されていない間は次のアプリのために保持されます。任意のスレッドから呼び出せます。`destroy()` の後は `false` を返します。 |
| `handle(String name, HostHandler handler)` | アプリの `name` の呼び出し(`host.call`)と post(`host.post`)を UI スレッドで処理します。`null` はハンドラーを削除します。ハンドラーは、その `NshHostReply` を通じて、任意のスレッドから一度だけ応答します。 |
| `connectDevServer(String url)` | 開発用: `nsh dev` サーバーから読み込み、変更のたびにリロードします。リリース AAR では `false` を返します。 |
| `handleBack()` | アプリに戻る操作を処理させます(ダイアログを閉じ、ページを pop し、`BackHandler` リスナーを実行します)。処理したかどうかを返します。 |
| `destroy()` | アプリを停止し、各ネイティブコンポーネントの `destroy()` を呼び出します。以降、このビューは使用できません。 |

> [!IMPORTANT]
> コンパイル済みバイトコード(`.nshc`)は、APK 自身の assets または署名付きパッケージからのみ読み込まれます。ストレージ上のファイルは置き換えられる可能性があり、QuickJS はバイトコードを検証しないため、`loadBundleFile` は JS ソースのみを受け付けます。アプリがダウンロードするコードは、[署名付きパッケージ](./signed-packages.md)として提供してください。

`setLimits`、`setGrantedCapabilities`、`setStorageDirectory`、`setCacheOptions` は次回の読み込みから適用されます。`loadAssetBundle` などより前に呼び出してください。

各アプリは、設定なしで自身の ID の下にストレージを保持します。署名付きパッケージはリリースキーの証明書が保証する ID の下、バンドルは `nsh.json` の `id`(APK の assets 内の `nsh/app.json`、`nsh package` によって書き込まれます)の下に保持されます。アプリのデータをホストが選んだ場所に保持するには、`setStorageDirectory` を呼び出します。

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## アプリとの通信

ビューと、そこで実行されるアプリは、専用のチャネル([`host`](../modules/nsh.md#host))を通じて通信します。アプリが起動時に読み取る起動パラメーター、ホストアプリからのイベント、アプリからの call と post があり、データは JSON です(こちら側では map、list、文字列、数値、真偽値)。アプリ内にビューやネイティブコンポーネントは必要ありません。

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

Kotlin の場合:

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

ハンドラーは UI スレッドで実行されます。call は、どちらの側もブロックせずに、アプリ内での応答を待ちます。一度も返されない応答は、回収された時点で call を失敗させ、ハンドラーのない名前の call は即座に失敗します。アプリがまだリッスンしていない名前のイベントは、リッスンされるまで保持されます。アプリが実行されていない間(`loadAssetBundle` の前、リロード中)に送信されたイベントは、次のアプリに渡されます。

<a id="theme-overrides"></a>

## テーマのオーバーライド

ブランドの異なる複数のホストアプリに埋め込まれた 1 つのアプリは、各ホストのブランドを取り込みます。ホストは、自身のブランドが変更するトークンを、`nsh.json` の `"theme"`(shadcn/ui の `cssVars`、値は CSS の書き方のまま)の形式のテーマファイルとして渡します。これらは、アプリの同名のトークンより優先され、アプリのその他のトークンはそのまま残ります。トークンのダークモード値は `dark` の下に指定します(`light` または `theme` の下にだけ指定した 1 組は、両方のモードでその色になります)。

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

読み込みの前後どちらでも呼び出せます。`bg-primary` や `rounded-(--radius)` などのクラスは即座にスタイルが更新され、以降に読み込まれるすべてのアプリは、最初のフレームからオーバーライドが適用された状態で起動します。`setThemeOverrides(null)` を指定すると、アプリ自身のテーマに戻ります。

<a id="links-the-app-opens"></a>

## アプリが開くリンク

アプリが開く URL([`openUrl`](../modules/nsh.md#openurl)、`links="open"` を持つ `TextView` のリンク)は、まずビューの `OpenUrlHandler` に UI スレッドで渡されます。ホストアプリが URL を処理した場合(たとえば独自のルーターに渡した場合)は `true` を返し、システムに `ACTION_VIEW` インテントで開かせる場合は `false` を返します。ハンドラーがない場合、システムがすべての URL を開きます。URL は、アプリの `openUrl` capability が許可した後にハンドラーに渡されます。

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

## 制限

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

既定値は、ヒープ 256 MB、スタック 4096 KB、読み込み 10 秒、呼び出しあたり 2 秒、ノード 200 000 個です。各制限に達したときの動作については [Sandbox and capabilities](./sandbox-and-capabilities.md) を参照してください。

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

リクエストは、アプリが `nsh.json` で宣言した内容と、許可の両方で許可されている必要があります。[Sandbox and capabilities](./sandbox-and-capabilities.md) を参照してください。

<a id="signed-packages"></a>

## 署名付きパッケージ

ダウンロードしたパッケージは UI スレッド以外で検証し、その後 UI スレッドで実行します。

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

| API | 説明 |
|---|---|
| `new NshTrust(File stateDir)` | トラストストアを開くか、作成します。その状態(最新の失効リスト、アプリごとに受け入れた最大のビルド)はそこに保存され、パッケージの assets もその下に展開されます。`addRoot` まではどの鍵も信頼しません。任意のスレッドから使用できます。完了すると `close()`。 |
| `boolean addRoot(String publicKey)` | ルート公開鍵(base64、`.pub` ファイルの内容)を信頼します。無効な鍵の場合は `false`。 |
| `boolean updateRevocations(String json)` | `nsh revoke` からの失効リストを適用します。信頼されたルートによって署名され、ストアのものより新しい必要があります。 |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | 検証し、assets を展開して、パッケージを受け入れます(その時点以降、アプリの古いビルドは拒否されます)。大きなパッケージでは時間がかかります。UI スレッド以外で呼び出してください。 |
| `NshPackage` | `appId`、`appName`、`version`、`build`。実行できない場合は `close()`。 |

鍵、証明書、失効の仕組みについては [Signed packages](./signed-packages.md) を参照してください。

<a id="development"></a>

## 開発

`nsh-dev.aar` を使用する場合:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

コンピューターで `nsh dev App.tsx` を実行します。エミュレーターまたは USB デバイスの場合は、デバイス自身の `127.0.0.1` がサーバーに届くようにポートを転送します。

```sh
adb reverse tcp:8790 tcp:8790
```

それ以外の場合は、`nsh dev` が表示する LAN アドレスを使用します。assets は開発サーバーからプレーン HTTP で取得されるため、`nsh-dev.aar` は `android:usesCleartextTraffic="true"` を宣言しており、マニフェストのマージによってアプリに適用されます(アプリの network security config がこれをオーバーライドする場合があります)。リリース用の `nsh.aar` には含まれません。

<a id="activity-setup"></a>

## Activity のセットアップ

- **戻るボタン。** `NshView` は、アプリが戻る操作を必要としている間(開いているダイアログ、push されたページ、`BackHandler` リスナー)は自動的に受け取り、それ以外は activity に任せます。Android 13 以降で `android:enableOnBackInvokedCallback="true"` を指定している場合は `OnBackInvokedCallback` を登録します。それ以外(Android 12 以前、または属性がオフの場合)は、activity の `onBackPressed` より前、つまり AndroidX の `OnBackPressedDispatcher` やフラグメントのコールバックより前に戻るキーを受け取ります。activity でもフラグメントでも、転送は不要です。すでに `handleBack()` に戻る操作を転送しているホストもそのまま動作します。1 回の操作はアプリに 1 度だけ渡されます。

  Android 13 以降の predictive back には、パッケージ化された NSH アプリと同様に、`<application>` に `android:enableOnBackInvokedCallback="true"` を設定してください。
- **キーボード。** `NshView` は、フォーカスされた入力欄がキーボードに隠れないよう自身でスクロールします。`android:windowSoftInputMode` は未設定のままにするか、`adjustResize` を使用してください。`adjustPan` を使うと、代わりにシステムがウィンドウ全体を移動します。
- **セーフエリア。** ビューは、システムバーとキーボードのうちビューと重なる部分だけをインセットとして報告します。そのため、ツールバーの下にある `NshView` には上部のインセットが渡されません。エッジ・ツー・エッジのコンテンツでは、システムバーの背後に描画し、アプリに `env(safe-area-inset-*)` padding / `safeAreaInsets()`(Rust では `safe_area()`)を使わせてください。
- **構成の変更。** 回転やテーマの変更で activity が再作成されると、ビューは破棄され、アプリは最初からやり直しになります。アプリを実行し続けるには、activity 自身が処理する変更を宣言します。パッケージ化された NSH アプリは次を使用します。

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` は、新しいサイズ、カラースキーム、フォントスケール、ディスプレイ密度、レイアウト方向に自身で追従し、アプリは状態を保持します。スクロール位置は、新しいコンテンツ範囲内の論理座標で復元されます。sticky ビューと開いているモーダルウィンドウも、新しい密度に追従します。
- **ライフサイクル。** ホストとなる activity またはフラグメントが破棄されるときに、`destroy()` を呼び出してください。
<a id="see-also"></a>

## 関連項目

- [Building with Rust](./rust.md)
- [Embedding in iOS apps](./ios.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Packaging](./packaging.md): Java を一切書かずにスタンドアロン APK を作成します
