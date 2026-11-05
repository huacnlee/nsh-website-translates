---
title: "패키징"
description: "nsh package를 사용하여 iOS 기기, iOS 시뮬레이터, Android, macOS, Windows, Linux 및 웹용으로 설치 가능한 Rust 및 TSX 앱을 빌드하고, 앱 메타데이터, 아이콘, 서명을 설정하세요."
order: 19
group: platforms
source_hash: 74c2991490481926
---

# 패키징

`nsh package` 명령은 앱을 설치 가능한 형태로 만듭니다. iOS 시뮬레이터용 `.app`, iOS 기기용 서명된 `.ipa`, Android용 서명된 `.apk`, macOS용 ad hoc 서명된 `.app`, Linux용 디렉터리와 `.tar.gz`, Windows용 디렉터리와 `.zip`, 또는 웹용 정적 사이트를 만들 수 있습니다. Xcode 프로젝트도 Gradle도 필요하지 않습니다.

- **Rust 앱**(`nsh.json` 파일에 `"root"` 지정)은 해당 디렉터리에서 패키징합니다. `nsh` 명령은 대상 플랫폼의 러너를 릴리스 모드로 빌드하며, 여기에 사용자의 crate를 컴파일해 포함하고 루트를 마운트합니다. QuickJS는 포함되지 않습니다. Cargo, 해당 플랫폼의 Rust 타깃(`rustup target add …`), 그리고 Android의 경우 NDK가 필요합니다.
- **TSX 앱**은 진입점을 지정합니다. 릴리스 빌드(최소화되고 QuickJS 바이트코드로 컴파일되며, `nsh build --release` 명령이 빌드하는 것과 동일함)는 NSH와 함께 제공되는 **사전 빌드된 런타임** 옆에 놓이므로 Rust 툴체인이 필요하지 않습니다. 자체 crate가 있는 앱(`"rust"` 이고 `"root"` 없음)은 해당 crate로 러너를 빌드합니다.

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

`--out`을 지정하지 않으면 출력은 `.nsh/out/`에 저장됩니다. 아래 섹션에서는 Rust 앱 기준으로 각 타깃의 명령을 보여 주며, TSX 앱은 진입점(`nsh package App.tsx --target …`)을 추가합니다.

> [!NOTE]
> NSH를 기존 네이티브 앱 *안에* 넣으려면 [Platforms](./platforms.md#embed-in-a-native-app)를, GPUI 또는 GPUI Kit 앱이라면 [GPUI](./gpui.md#embedding-in-a-gpui-app)를 참고하세요. 앱이 다운로드하고 검증하는 업데이트를 배포하려면 [Signed packages](./signed-packages.md)를 참고하세요.

<a id="app-metadata-30"></a>

## 앱 메타데이터: `nsh.json`

`nsh package`은 앱 디렉터리(TSX 앱은 진입 파일 옆)의 `nsh.json`을 읽습니다. `nsh init` 명령이 이 파일을 생성합니다.

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| 키 | 타입 | 기본값 | 용도 |
|---|---|---|---|
| `name` | string | 진입점의 디렉터리 이름 | 아이콘 아래에 표시되는 이름(`CFBundleDisplayName`, Android `android:label`)과 출력 파일 이름. |
| `id` | string | 필수 | 번들 식별자 / Android 패키지 이름. 소유한 도메인 아래의 reverse-DNS 형식이어야 합니다. 앱이 [storage](../modules/nsh.md#storage)를 보관하는 위치의 이름이기도 하므로 앱마다 고유한 저장소를 갖습니다. `nsh package`과 `nsh publish`은 `com.example.` 플레이스홀더에 대해 경고합니다. |
| `version` | string | `"1.0.0"` | 사용자에게 보이는 버전(`CFBundleShortVersionString`, `versionName`). |
| `build` | number | `1` | 빌드 번호(`CFBundleVersion`, `versionCode`). 업로드하는 릴리스마다 올리세요. |
| `icon` | string | 없음 | 정사각형 PNG, 1024×1024 권장. `nsh.json` 기준 상대 경로. |

`nsh.json`에는 `rust`와 `root`(앱의 crate와 루트 컴포넌트, [Building with Rust](./rust.md)), `theme`와 `appearance`, `tailwind`([Tailwind](./tailwind.md) 참고), `capabilities`([Sandbox and capabilities](./sandbox-and-capabilities.md) 참고)도 들어갑니다. 모든 키는 [Project structure](./project-structure.md#nshjson)에 정리되어 있습니다. 알 수 없는 키는 오류입니다.

위의 모든 키는 명령줄에서 재정의할 수 있어 CI에서 유용합니다.

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## 옵션

| 플래그 | 설명 |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | 빌드 대상(필수). |
| `-o, --out <dir>` | 출력 디렉터리. 기본값은 `.nsh/out`. |
| `--name <name>` | 표시 이름. |
| `--id <id>` | 번들 식별자(예: `com.example.app`). |
| `--app-version <version>` | 버전(예: `1.2.0`). |
| `--build <n>` | 빌드 번호. |
| `--icon <png>` | 앱 아이콘: 정사각형 PNG, 1024×1024 권장. |
| `--sign <identity>` | iOS: 기기용 코드 서명 ID. |
| `--profile <file>` | iOS: 기기용 프로비저닝 프로파일(`.mobileprovision`). |
| `--keystore <file>` | Android: 릴리스 키스토어(기본값: 디버그 키). |
| `--key-alias <alias>` | Android: 키스토어의 키 별칭. |
| `--keystore-password <password>` | Android: 키스토어 비밀번호. `NSH_KEYSTORE_PASSWORD`에서도 읽습니다. |
| `--abi <abi>` | Android: APK의 ABI. 반복해서 지정하거나 쉼표로 구분합니다(기본값: `arm64-v8a`와 `armeabi-v7a`). |
| `--run` | 빌드 후 설치하고 실행합니다. iOS 시뮬레이터, 또는 `adb`이 인식하는 Android 기기나 에뮬레이터에서 실행하며, macOS, Linux, Windows 앱은 이 머신에서 실행하고, 웹 사이트는 이 머신에서 서빙하여 브라우저로 엽니다. `--target ios`에는 사용할 수 없습니다. |

<a id="ios-simulator"></a>

## iOS 시뮬레이터

```sh
nsh package --target ios-simulator --run
```

ad hoc으로 서명된 `.nsh/out/<Name>.app`을 생성합니다(시뮬레이터는 서명이 필요하지만 ID는 필요하지 않습니다). `--run`를 지정하면 실행 중인 시뮬레이터가 없을 때 하나를 부팅하고, 앱을 설치한 뒤 실행합니다. Xcode가 필요합니다.

<a id="ios-devices"></a>

## iOS 기기

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

TestFlight, App Store 업로드 도구 또는 직접 설치(프로파일에 따라 다름)에 사용할 수 있는 `.nsh/out/<Name>.ipa`을 생성합니다. 처리 과정은 다음과 같습니다.

- 프로비저닝 프로파일이 `embedded.mobileprovision`로 앱에 복사됩니다.
- entitlements는 프로파일에서 가져옵니다. NSH는 프로파일의 application identifier가 앱의 `id`를 포함하는지 확인하며(`TEAMID.*`나 `TEAMID.com.example.*` 같은 와일드카드 프로파일도 동작합니다), 그렇지 않으면 오류와 함께 중단합니다.
- 앱은 해당 ID를 사용해 `codesign`로 서명된 후 `.ipa`(`Payload/<Name>.app`)로 압축됩니다.

사용 가능한 ID는 다음 명령으로 확인합니다.

```sh
security find-identity -v -p codesigning
```

`--sign`와 `--profile`가 없으면 NSH는 서명되지 않은 `.nsh/out/<Name>.app`를 생성하고 그 사실을 알려 줍니다. 이 파일은 그대로는 기기에 설치할 수 없습니다.

앱은 iPhone과 iPad, 세로 및 가로 방향(거꾸로 된 세로 방향은 iPad에서만)을 지원하며 iOS 15.0 이상이 필요합니다.

## Android

```sh
nsh package --target android --run
```

`.nsh/out/<Name>.apk`를 생성합니다. APK는 Gradle 없이 SDK의 빌드 도구(`aapt2`, `zipalign`, `apksigner`)로 직접 조립됩니다. 요구 사항은 다음과 같습니다.

- `ANDROID_HOME`(또는 `ANDROID_SDK_ROOT`, `~/Library/Android/sdk`)을 통해 찾을 수 있는 Android SDK. 빌드 도구와 `platforms;android-35` 패키지가 있어야 합니다. 없는 항목이 있으면 NSH가 `sdkmanager` 명령을 알려 줍니다.
- 처음에 디버그 키스토어를 만들기 위한 JDK.
- Rust 앱의 경우, `libnsh.so`를 빌드하는 Android NDK(`sdkmanager "ndk;<version>"` 또는 `ANDROID_NDK_HOME`).

앱은 API 35를 대상으로 하며 API 28(Android 9) 이상이 필요합니다. 휴대폰 ABI인 `arm64-v8a`와 `armeabi-v7a`용 네이티브 코드를 포함하며, `--run`를 지정하면 에뮬레이터의 `x86_64` 같은 기기의 ABI도 포함합니다. `--abi`로 직접 선택할 수도 있습니다. 예를 들어 `--abi arm64-v8a`은 64비트 휴대폰만 대상으로 하여 가장 작은 APK를 만듭니다.

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### 릴리스용 서명

`--keystore`가 없으면 APK는 표준 디버그 키(`~/.android/debug.keystore`, 없으면 생성됨)로 서명되며, NSH는 스토어 릴리스용이 아니라고 경고합니다. 릴리스를 위해서는 키스토어를 한 번 만들고 전달하세요.

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

비밀번호가 셸 기록에 남지 않도록 `--keystore-password`보다 환경 변수를 사용하는 것이 좋습니다.

## macOS

```sh
nsh package --target macos --run
```

`.nsh/out/<Name>.app`를 생성합니다. `Contents/MacOS/`에는 실행 파일이, `Contents/Resources/`에는 `nsh/assets/…`, `nsh/app.json`(창 제목과 앱의 외관), 그리고 TSX 앱의 `nsh/bundle.nshc`가 들어갑니다. 앱은 ad hoc으로 서명되며 macOS 14 이상이 필요합니다. 배포하려면 Developer ID로 서명하고 공증(notarize)하세요. [macOS](./macos.md#packaging)를 참고하세요.

## Linux

```sh
nsh package --target linux --run
```

`.nsh/out/<Name>/`을 생성합니다(실행 파일 `<Name>`, `nsh/assets/…`, 창 제목과 application id가 담긴 `nsh/app.json`, TSX 앱의 `nsh/bundle.nshc`, `<id>.desktop`, 아이콘 `<id>.png`). 또한 `.nsh/out/<Name>.tar.gz`과 동일한 결과물도 생성합니다. Linux에서 패키징하세요. 러너는 빌드하는 머신에 맞춰 빌드됩니다. 앱이 실행되는 곳에는 GTK 4(4.14 이상), Pango, WebKitGTK 6.0(웹 뷰용)이 설치되어 있어야 합니다. 설치와 데스크톱 엔트리는 [Linux](./linux.md#packaging)를 참고하세요.

## Windows

```sh
nsh package --target windows --run
```

`.nsh\out\<Name>\`를 생성합니다(앱 아이콘이 적용된 실행 파일 `<Name>.exe`, `nsh\assets\…`, 창 제목, 앱 id, 버전, 외관이 담긴 `nsh\app.json`, 그리고 TSX 앱의 `nsh\bundle.nshc`). 또한 `.nsh\out\<Name>.zip`과 동일한 결과물도 생성합니다. TSX 앱은 별도 도구가 필요하지 않으며, Rust 앱의 러너는 Visual Studio Build Tools로 빌드됩니다. Windows에서 패키징하세요. 러너는 빌드하는 머신에 맞춰 빌드되며, 아이콘은 Windows에서만 임베드할 수 있습니다. 앱은 디렉터리를 복사한 어느 위치에서든 실행되며 설치되는 것은 없습니다. [Windows](./windows.md#packaging)를 참고하세요.

<a id="web"></a>

## 웹

```sh
nsh package --target web --run
```

정적 사이트 `.nsh/out/<Name>/`를 생성합니다. 구성은 `index.html`, `manifest.webmanifest`, 페이지 스크립트(`nsh.<digest>.js`), `nsh.<digest>.wasm`(Rust 앱의 엔진과 crate. TSX 앱의 경우 런타임이며 앱의 ES 모듈 `app.<digest>.js` 옆에 놓임), 그리고 에셋과 아이콘이며, 호스트가 영구적으로 캐시할 수 있도록 각각 내용에 따라 이름이 지정됩니다. 디렉터리를 아무 웹 서버나 CDN에 배포하세요. `--run`는 이를 `http://127.0.0.1:4173/`에서 서빙하여 바로 열어 볼 수 있게 해 줍니다. 캐시 헤더와 임베딩은 [Web](./web.md#publish-an-app)을 참고하세요.

<a id="icons"></a>

## 아이콘

`nsh.json`(`"icon": "icon.png"`) 또는 `--icon`로 정사각형 PNG 하나(1024×1024 권장)를 지정하세요.

- **iOS:** Xcode의 `actool`가 앱의 에셋 카탈로그(`Assets.car`)로 컴파일하며, iOS에 필요한 모든 크기가 여기서 파생됩니다.
- **Android:** 192×192로 크기를 조정해 런처 아이콘(`mipmap-xxxhdpi`)으로 사용합니다.
- **macOS:** `sips`가 `AppIcon.icns`로 변환합니다.
- **Linux:** `<id>.png`로 복사되며, `.desktop` 파일이 이를 `Icon`로 지정합니다.
- **Windows:** 16~64픽셀과 256픽셀로 크기를 조정해 실행 파일의 아이콘으로 임베드하며, 창, 탐색기, 작업 표시줄에 이 아이콘이 표시됩니다.
- **Web:** 32픽셀(favicon), 180(`apple-touch-icon`), 192와 512(웹 앱 매니페스트)로 크기를 조정합니다.

아이콘이 없으면 시스템 기본 아이콘이 표시됩니다.

<a id="what-is-inside"></a>

## 패키지 내용

Rust 앱의 패키지는 사용자의 crate와 마운트된 루트로 빌드된 러너, 그리고 앱의 crate가 등록한 에셋(`assets!()`)으로 구성됩니다. TSX 앱의 패키지는 바이트코드, `capabilities.json`(capability를 선언한 경우), 가져온 에셋을 사전 빌드된 런타임 옆에 담습니다.

| 타깃 | 런타임 | TSX 앱 |
|---|---|---|
| iOS | `nsh-ios-app` 실행 파일 | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (심볼 제외, 압축 없이 저장, 16 KB 정렬) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | `nsh-macos-app` 실행 파일, 이름은 `<Name>`로 변경 | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | `nsh-linux-app` 실행 파일, 이름은 `<Name>`로 변경 | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | `nsh-windows-app.exe` 실행 파일, 이름은 `<Name>.exe`로 변경 | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

패키징된 앱은 [native components](./native-components.md)를 등록하지 않습니다. 네이티브 컴포넌트가 필요하면 NSH를 자체 앱에 임베드하세요.

<a id="finding-the-runtime"></a>

## 런타임 찾기

Rust 앱은 자체 러너를 빌드합니다. TSX 앱의 경우 `nsh package`는 CLI 옆(배포본에서는 `bin/../runtime`)에서 사전 빌드된 런타임을 찾습니다. NSH 체크아웃에서는 CLI 자체의 프로파일에 맞춰 `target/<triple>/<profile>`와 `target/android/<profile>`를 사용합니다(디버그 CLI는 디버그 런타임을 사용). 이 런타임은 `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim`(기기용은 `aarch64-apple-ios`)와 `cargo xtask android`(릴리스 CLI는 `--release` 추가)로 빌드하세요. `nsh-macos-app`(macOS), `nsh-linux-app`(Linux), `nsh-windows-app`(Windows)는 이 머신용으로 `target/<profile>`(`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`)에 빌드됩니다. 웹 런타임은 CLI의 프로파일과 관계없이 `web` 프로파일로 `target/wasm32-unknown-unknown/web/`에 빌드됩니다. 환경 변수 `NSH_RUNTIME`는 배포본의 `runtime/`(`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web` 등)와 같은 구조로 구성된 다른 디렉터리를 CLI가 사용하도록 지정합니다.

<a id="see-also"></a>

## 참고

- [CLI](./cli.md): 모든 명령
- [Signed packages](./signed-packages.md): 앱이 다운로드하는 업데이트
- [Project structure](./project-structure.md): `nsh.json`와 앱의 파일들
