---
title: "Android"
description: "Rust 및 TSX 기반 NSH 앱을 Android 뷰로 에뮬레이터나 기기에서 실행하고, .apk로 패키징하며, nsh.aar와 NshView를 사용해 기존 Android 앱에 임베드하는 방법을 설명합니다."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

NSH 앱은 일반 Android 뷰와 `StaticLayout` 텍스트로 Android 9(API 28) 이상에서 `arm64-v8a`, `armeabi-v7a`, `x86_64` 위에서 실행됩니다. Rust와 TSX로 작성한 앱 전체는 다른 플랫폼과 동일하게 실행되고 패키징되며, 기존 앱은 `NshView`에 모듈을 임베드하고 다운로드한 서명된 패키지를 앱이 설정한 제한과 capability 범위 내에서 로드할 수 있습니다. Android에서 `os()`는 `Os::Android`입니다(TSX에서 `platform.os`는 `"android"`). 또한 TSX의 `android={{…}}` props가 적용됩니다.

<a id="requirements"></a>

## 요구 사항

- macOS, Windows 또는 Linux의 **Android SDK**(`platforms;android-35`, 빌드 도구, `platform-tools` 포함)와 **JDK**. [설치](./installation.md#android)를 참고하세요.
- 에뮬레이터 또는 `adb`로 연결된 기기.

<a id="running-an-app"></a>

## 앱 실행

Rust 앱은 해당 디렉터리에서 실행하고, TSX 앱은 진입점을 지정합니다.

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

먼저 에뮬레이터를 시작하거나 기기를 연결하세요(`adb devices`로 목록을 볼 수 있으며, NSH는 첫 번째 기기를 사용합니다). Rust 앱의 경우 `nsh`는 앱의 `libnsh.so`를 사용자의 crate와 함께 빌드하고, APK를 설치한 뒤 시작합니다. crate의 Rust 코드를 변경하면 다시 빌드하고 설치합니다. TSX 앱의 경우 개발 호스트 APK를 설치하고(런타임이 변경될 때만 다시 빌드), 개발 서버의 포트를 `adb reverse`로 포워딩하므로 공유 네트워크 없이 USB만으로 동작합니다. 앱은 저장할 때마다 업데이트되며 로그는 터미널에 출력됩니다.

<a id="packaging"></a>

## 패키징

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

Rust 앱의 APK에는 사용자의 crate와 함께 빌드된 자체 `libnsh.so`가 포함되며, 이 액티비티가 루트를 마운트합니다.

APK는 Gradle 없이 SDK의 빌드 도구로 빌드되며, 릴리스 키스토어를 지정하지 않으면 디버그 키로 서명됩니다. 릴리스 서명과 아이콘은 [패키징](./packaging.md#android)을 참고하세요.

NSH는 `libnsh.so`를 16 KB ELF 정렬로 빌드하고, 압축하지 않은 네이티브 라이브러리를 16 KB ZIP 경계에 맞춰 패키징합니다. 릴리스 APK에는 심볼 테이블과 디버그 정보를 제거한 `libnsh.so`가 들어 있습니다. 전체 라이브러리는 런타임 옆의 `symbols/<abi>/libnsh.so`에 있습니다(Rust 앱의 경우 `.nsh/rust/android-rust-release/symbols/<abi>/`). 네이티브 크래시 스택을 읽으려면 이를 `ndk-stack`에 전달하거나 네이티브 디버그 심볼로 Play Console에 업로드하세요.

<a id="embedding-in-an-android-app"></a>

## Android 앱에 임베드

기존 Android 앱은 자체 UI 안에 NSH 앱을 표시할 수 있습니다. 런타임은 Android 라이브러리 `nsh.aar`로 제공됩니다. `com.longbridge.nsh.NshView`(`FrameLayout`)를 생성해 아무 레이아웃에 추가하고 TSX 앱이나 서명된 패키지를 로드합니다. Rust로 작성한 앱은 Android에서 `nsh package --target android`가 빌드하는 APK로 배포됩니다. NSH 앱은 사용자의 뷰 옆에서 일반 Android 뷰로 렌더링됩니다.

각 `NshView`는 자체 JS VM을 가진 독립된 엔진 하나이며, 전역 싱글턴이 없으므로 여러 개를 동시에 실행할 수 있습니다.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## 라이브러리 가져오기

배포본에는 두 가지 변형이 모두 들어 있습니다.

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

AAR에는 Java 런타임과 `arm64-v8a`, `armeabi-v7a`, `x86_64`용 `libnsh.so`가 심볼과 함께 들어 있습니다. 앱의 Gradle 빌드는 앱을 패키징할 때 이를 제거하고, 크래시 리포트를 위해 심볼은 별도로 보관합니다. `INTERNET` 권한을 선언하며 **API 28**(Android 9) 이상이 필요합니다. R8 규칙(`proguard.txt`)도 포함하고 있어 minify 빌드에서 자동으로 적용됩니다. 네이티브 라이브러리가 런타임의 클래스를 이름으로 찾으므로 `com.longbridge.nsh`는 그대로 유지됩니다.

예를 들어 `libs` 폴더에서 앱 모듈에 추가합니다.

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## 앱과 함께 번들 배포

TSX 앱을 앱의 assets로 빌드합니다.

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

이 명령은 `bundle.nshc`(바이트코드), `bundle.js`(소스), `bundle.js.map`, `capabilities.json`(`nsh.json`에서 [capability](./sandbox-and-capabilities.md)를 선언한 경우), `assets/`(앱이 import하는 이미지와 폰트)를 생성합니다.

<a id="show-the-app"></a>

## 앱 표시

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

Kotlin에서는 다음과 같이 사용합니다.

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

`NshView`는 예를 들어 사용자의 툴바 아래처럼 어떤 레이아웃 안에도 둘 수 있습니다.

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

뷰의 크기가 곧 앱의 창 크기입니다. NSH는 뷰의 크기에 맞춰 앱을 레이아웃하고, 크기가 바뀔 때마다 다시 레이아웃합니다. 다시 로드하면 실행 중인 앱이 교체됩니다. 전체 샘플은 `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`에 있습니다.

## `NshView`

| 메서드 | 설명 |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | 빈 뷰를 생성합니다. `trace`는 모든 커밋의 소요 시간을 로그로 남깁니다. |
| `setErrorListener(ErrorListener listener)` | 치명적인 앱 오류(로드 실패, 처리되지 않은 JS 예외, 제한으로 중지된 VM)를 UI 스레드에서 받습니다. 이 오류는 항상 로그에도 기록됩니다. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | 다음에 로드되는 앱의 VM 제한입니다. 0은 기본값을 유지합니다. |
| `setGrantedCapabilities(String json)` | 다음에 로드되는 앱이 수행할 수 있는 최대 범위로, `nsh.json`의 `capabilities` 형식의 JSON입니다. `null`는 각 앱이 선언한 것을 허용합니다. 유효하지 않은 grant이면 `false`를 반환하며 무시됩니다. |
| `setLocale(Locale locale)` | 사용자의 설정 대신 앱의 언어와 지역을 지정합니다. `Intl`, `locale()`와 컴포넌트가 즉시 이를 따르며, 이후에 로드되는 앱도 이 설정으로 시작합니다. `null`는 시스템 설정을 따릅니다. |
| `setFontScale(float scale)` | 시스템 글꼴 크기 대신 사용할 텍스트 크기입니다(1이 기본값). 텍스트와 입력란이 이 크기로 다시 레이아웃되고 `fontScale()`가 이를 읽으며, 즉시 그리고 이후에 로드되는 앱에도 적용됩니다. 길이 값은 크기가 유지됩니다. `0`는 시스템 설정을 따릅니다. |
| `setThemeOverrides(String json)` | 앱의 [테마](./tailwind.md#theme-tokens) 위에 적용할 호스트의 브랜드로, `nsh.json`의 `"theme"` 형식의 테마 파일입니다. 이 토큰은 이름이 같은 앱의 토큰보다 우선하며(라이트·다크 모드 모두), 앱의 나머지 토큰은 그대로 유지됩니다. 즉시 그리고 이후에 로드되는 앱에도 적용됩니다. `null`는 앱에 고유 테마를 되돌려 줍니다. 파싱할 수 없는 파일이면 `IllegalArgumentException`를 던집니다. |
| `setStorageDirectory(File dir)` | 다음에 로드되는 앱이 [저장소](../modules/nsh.md#storage)를 보관할 위치입니다. `null`: 앱의 비공개 디렉터리에 있는 `files/nsh/<app id>`이며, 앱 자체의 id별로 구분됩니다. |
| `setCacheOptions(NshCacheOptions options)` | 다음에 로드되는 앱이 캐시와 [다운로드한 이미지](./images-and-assets.md#kept-on-disk)를 보관할 위치와, 각 앱이 보관할 용량입니다. `NshCacheOptions.builder()`로 생성합니다: `location(File)`, `systemLocation()`(기본값: 캐시 디렉터리의 `nsh`, 각 앱은 `<app id>`) 또는 `noDiskCache()`; `imagesMaxMegabytes(int)`(기본값 256) 또는 `imagesOff()`. |
| `loadAssetBundle(String dir)` | APK의 assets에서 `dir/bundle.nshc`를 실행합니다. 앱 assets는 `dir/assets/`에서 가져옵니다. 읽을 수 없으면 `false`를 반환합니다(오류 리스너에도 보고됩니다). |
| `loadBundleFile(File file)` | `bundle.js` 파일을 실행합니다. assets는 그 옆의 `assets/`에서 가져옵니다. `.nshc` 파일은 거부합니다. |
| `runPackage(NshPackage pkg)` | 검증된 서명된 패키지를 실행하고, 실행 중인 앱을 교체합니다. 패키지는 한 번만 실행됩니다. |
| `registerComponent(String name, NshComponent.Factory factory)` | [네이티브 컴포넌트](./native-components.md)를 등록합니다. |
| `setParams(Object params)` | 다음에 로드되는 앱의 실행 파라미터(`Map` 또는 `JSONObject`)입니다. 앱은 시작할 때 이를 `host.params`([`host`](../modules/nsh.md#host))로 읽습니다. JSON 객체가 아니면 `false`를 반환합니다. |
| `send(String name, Object data)` | 앱에 이벤트를 보냅니다(`host.on(name, …)`). 앱이 수신을 시작할 때까지, 또는 실행 중인 앱이 없으면 다음 앱을 위해 보관됩니다. 어느 스레드에서든 호출할 수 있으며, `destroy()` 이후에는 `false`를 반환합니다. |
| `handle(String name, HostHandler handler)` | UI 스레드에서 앱의 `name`에 대한 호출(`host.call`)과 post(`host.post`)를 처리합니다. `null`는 핸들러를 제거합니다. 핸들러는 `NshHostReply`를 통해 어느 스레드에서든 한 번만 응답합니다. |
| `connectDevServer(String url)` | 개발용: `nsh dev` 서버에서 로드하고 변경될 때마다 다시 로드합니다. 릴리스 AAR에서는 `false`를 반환합니다. |
| `handleBack()` | 앱이 뒤로 가기 입력을 처리하게 합니다(대화상자 닫기, 페이지 pop, `BackHandler` 리스너 실행). 처리했는지 여부를 반환합니다. |
| `destroy()` | 앱을 중지하고 각 네이티브 컴포넌트에서 `destroy()`를 호출합니다. 이후에는 뷰를 사용할 수 없습니다. |

> [!IMPORTANT]
> 컴파일된 바이트코드(`.nshc`)는 APK 자체의 assets나 서명된 패키지에서만 로드됩니다. 저장소의 파일은 교체될 수 있고
> QuickJS는 바이트코드를 검증하지 않으므로, `loadBundleFile`는 JS 소스만 받습니다. 앱이 다운로드하는 코드는
> [서명된 패키지](./signed-packages.md)로 받아야 합니다.

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory`, `setCacheOptions`는 다음 로드부터 적용되므로, `loadAssetBundle` 등을 호출하기 전에 먼저 호출하세요.

각 앱은 별도 설정 없이 자체 id 아래에 저장소를 보관합니다. 서명된 패키지는 릴리스 키의 인증서가 보증하는 id를, 번들은 `nsh.json`의 `id`(APK의 assets에 있는 `nsh/app.json`이며 `nsh package`가 작성)를 사용합니다. 앱의 데이터를 호스트가 정한 위치에 보관하려면 `setStorageDirectory`를 호출하세요.

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## 앱과 통신

뷰와 그 안에서 실행되는 앱은 전용 채널([`host`](../modules/nsh.md#host))로 통신합니다. 앱이 시작할 때 읽는 실행 파라미터, 호스트 앱의 이벤트, 앱이 보내는 호출과 post가 있으며, 데이터는 JSON입니다(이 쪽에서는 map, list, 문자열, 숫자, boolean). 앱에 뷰나 네이티브 컴포넌트가 없어도 사용할 수 있습니다.

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

Kotlin에서는 다음과 같이 사용합니다.

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

핸들러는 UI 스레드에서 실행됩니다. 호출은 어느 쪽도 막지 않고 앱의 응답을 기다립니다. 응답이 주어지지 않으면 수집되는 시점에 호출이 실패하며, 핸들러가 없는 이름의 호출은 즉시 실패합니다. 앱이 아직 수신하지 않는 이름의 이벤트는 수신을 시작할 때까지 보관되고, 실행 중인 앱이 없을 때(`loadAssetBundle` 이전, 다시 로드하는 동안) 보낸 이벤트는 다음 앱에 전달됩니다.

<a id="theme-overrides"></a>

## 테마 재정의

여러 브랜드의 호스트 앱에 임베드된 하나의 앱은 각 호스트의 브랜드를 따릅니다. 호스트는 자신의 브랜드가 바꾸는 토큰을 `nsh.json`의 `"theme"` 형식(shadcn/ui의 `cssVars`, 값은 CSS에서 쓰는 그대로)의 테마 파일로 제공합니다. 이 토큰은 이름이 같은 앱의 토큰보다 우선하며, 앱의 나머지 토큰은 그대로 유지됩니다. 토큰의 다크 모드 값은 `dark` 아래에 지정합니다(`light` 또는 `theme` 아래에만 지정한 값은 두 모드 모두에서 그 색상입니다).

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

로드하기 전이나 후에 호출할 수 있습니다. `bg-primary`, `rounded-(--radius)` 같은 클래스는 즉시 스타일이 바뀌고, 이후에 로드되는 모든 앱은 첫 프레임부터 재정의가 적용된 상태로 시작합니다. `setThemeOverrides(null)`는 앱에 고유 테마를 되돌려 줍니다.

<a id="links-the-app-opens"></a>

## 앱이 여는 링크

앱이 여는 URL([`openUrl`](../modules/nsh.md#openurl), `TextView`의 링크에 `links="open"`를 사용한 경우)은 먼저 UI 스레드에서 뷰의 `OpenUrlHandler`에 전달됩니다. 호스트 앱이 URL을 처리했으면(예: 자체 라우터로 전달) `true`를, 시스템이 `ACTION_VIEW` 인텐트로 열도록 하려면 `false`를 반환하세요. 핸들러가 없으면 시스템이 모든 URL을 엽니다. URL은 앱의 `openUrl` capability가 허용한 뒤에 핸들러에 전달됩니다.

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

## 제한

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

기본값은 힙 256 MB, 스택 4096 KB, 로드 10초, 호출당 2초, 노드 200 000개입니다. 각 제한에 도달했을 때의 동작은 [샌드박스와 capability](./sandbox-and-capabilities.md)를 참고하세요.

<a id="capabilities"></a>

## Capability

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

요청은 앱이 `nsh.json`에 선언한 내용과 grant 모두에서 허용되어야 합니다. [샌드박스와 capability](./sandbox-and-capabilities.md)를 참고하세요.

<a id="signed-packages"></a>

## 서명된 패키지

다운로드한 패키지는 UI 스레드 밖에서 검증한 다음, UI 스레드에서 실행하세요.

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

| API | 설명 |
|---|---|
| `new NshTrust(File stateDir)` | 신뢰 저장소를 열거나 생성합니다. 저장소의 상태(최신 폐기 목록, 앱별로 허용된 가장 높은 빌드)가 여기에 유지되며 패키지의 assets도 이 아래에 추출됩니다. `addRoot`를 호출하기 전까지는 어떤 키도 신뢰하지 않습니다. 어느 스레드에서든 사용할 수 있으며, 완료되면 `close()`. |
| `boolean addRoot(String publicKey)` | 루트 공개 키(base64, `.pub` 파일의 내용)를 신뢰합니다. 유효하지 않은 키이면 `false`. |
| `boolean updateRevocations(String json)` | `nsh revoke`의 폐기 목록을 적용합니다. 신뢰하는 루트가 서명했고 저장소의 것보다 최신이어야 합니다. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | 검증하고, assets를 추출하고, 패키지를 수락합니다(이후 해당 앱의 이전 빌드는 거부됩니다). 큰 패키지에서는 느리므로 UI 스레드 밖에서 호출하세요. |
| `NshPackage` | `appId`, `appName`, `version`, `build`. 실행되지 않으면 `close()`. |

키, 인증서, 폐기의 동작 방식은 [서명된 패키지](./signed-packages.md)를 참고하세요.

<a id="development"></a>

## 개발

`nsh-dev.aar`를 사용하면 다음과 같습니다.

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

컴퓨터에서 `nsh dev App.tsx`를 실행하세요. 에뮬레이터나 USB 기기에서는 기기 자체의 `127.0.0.1`가 서버에 도달하도록 포트를 포워딩합니다.

```sh
adb reverse tcp:8790 tcp:8790
```

그렇지 않으면 `nsh dev`가 출력하는 LAN 주소를 사용하세요. assets는 일반 HTTP로 개발 서버에서 가져오므로 `nsh-dev.aar`가 `android:usesCleartextTraffic="true"`를 선언하며, 매니페스트 병합기가 이를 앱에 적용합니다(앱의 네트워크 보안 구성이 이를 재정의할 수 있습니다). 릴리스 `nsh.aar`는 선언하지 않습니다.

<a id="activity-setup"></a>

## 액티비티 설정

- **뒤로 가기 버튼.** `NshView`는 앱이 뒤로 가기 입력을 필요로 하는 동안(열린 대화상자, push된 페이지, `BackHandler` 리스너) 이를 자동으로 받고, 그렇지 않으면 액티비티에 맡깁니다. Android 13 이상에서 `android:enableOnBackInvokedCallback="true"`를 설정하면 `OnBackInvokedCallback`를 등록하고, 그 외(Android 12 이하 또는 속성이 꺼진 경우)에는 액티비티의 `onBackPressed`보다 먼저, 즉 AndroidX의 `OnBackPressedDispatcher`와 프래그먼트의 콜백보다 먼저 뒤로 가기 키를 가져갑니다. 액티비티나 프래그먼트 모두 별도로 전달할 필요가 없습니다. 이미 `handleBack()`로 입력을 전달하는 호스트도 그대로 동작하며, 입력은 앱에 한 번만 전달됩니다.

  Android 13 이상에서 예측 뒤로 가기를 사용하려면 패키징된 NSH 앱처럼 `<application>`에 `android:enableOnBackInvokedCallback="true"`를 설정하세요.
- **키보드.** `NshView`는 포커스된 입력란이 키보드에 가리지 않도록 직접 스크롤합니다. `android:windowSoftInputMode`는 설정하지 않거나 `adjustResize`를 사용하세요. `adjustPan`를 사용하면 시스템이 대신 창 전체를 이동합니다.
- **Safe area.** 뷰는 시스템 바와 키보드 중 뷰와 겹치는 부분만 inset으로 보고하므로, 툴바 아래의 `NshView`는 상단 inset을 받지 않습니다. edge-to-edge 콘텐츠를 만들려면 시스템 바 뒤에 그리고, 앱이 `env(safe-area-inset-*)` 패딩 / `safeAreaInsets()`(Rust에서는 `safe_area()`)를 사용하게 하세요.
- **구성 변경.** 회전이나 테마 변경으로 액티비티가 다시 생성되면 뷰가 소멸되고 앱은 처음부터 다시 시작합니다. 앱을 계속 실행하려면 액티비티가 직접 처리하는 변경을 선언하세요. 패키징된 NSH 앱은 다음을 사용합니다.

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView`는 새로운 크기, 색상 구성표, 글꼴 배율, 디스플레이 밀도, 레이아웃 방향을 직접 따르며, 앱은 상태를 유지합니다. 스크롤 위치는 새 콘텐츠 경계 안에서 논리 좌표로 복원됩니다. sticky 뷰와 열린 모달 창도 새 밀도를 따릅니다.
- **수명 주기.** 호스팅하는 액티비티나 프래그먼트가 사라질 때 `destroy()`를 호출하세요.
<a id="see-also"></a>

## 함께 보기

- [Building with Rust](./rust.md)
- [Embedding in iOS apps](./ios.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Packaging](./packaging.md): Java를 작성하지 않고 독립 실행형 APK 만들기
