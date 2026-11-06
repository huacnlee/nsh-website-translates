---
title: "打包"
description: "使用 nsh package 為 iOS 裝置、iOS 模擬器、Android、macOS、Windows、Linux 及網頁建立可安裝的 Rust 和 TSX 應用程式，並設定應用程式中繼資料、圖示及簽署。"
order: 19
group: platforms
source_hash: 74c2991490481926
---


# 打包

`nsh package` 可將應用程式變成可安裝的成品:供 iOS 模擬器使用的 `.app`、供 iOS 裝置使用的已簽署 `.ipa`、供 Android 使用的已簽署 `.apk`、供 macOS 使用的 ad hoc 簽署 `.app`、供 Linux 使用的目錄和 `.tar.gz`、供 Windows 使用的目錄和 `.zip`,或供網頁使用的靜態網站。無需 Xcode 專案,也無需 Gradle。

- **Rust 應用程式**(`nsh.json` 指定其 `"root"`)會從其目錄打包。`nsh` 以 release 模式建置目標平台的 runner,並編入你的 crate、掛載根元件,不含 QuickJS:需要 Cargo、該平台的 Rust target(`rustup target add …`),Android 還需要 NDK。
- **TSX 應用程式**需指定其入口。其 release 建置(經壓縮、編譯為 QuickJS bytecode,與 `nsh build --release` 的建置方式完全相同)會與 NSH 隨附的**預建 runtime** 放在一起,因此無需 Rust 工具鏈。擁有自己 crate 的應用程式(有 `"rust"` 而無 `"root"`)則會連同其 crate 建置 runner。

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

輸出會寫入 `.nsh/out/`,除非你傳入 `--out`。以下各節列出 Rust 應用程式在各目標平台的指令;TSX 應用程式則需加上其入口(`nsh package App.tsx --target …`)。

> [!NOTE]
> 如要改為把 NSH 放進*現有的*原生應用程式,請參閱[平台](./platforms.md#embed-in-a-native-app);GPUI 或 GPUI Kit 應用程式請參閱 [GPUI](./gpui.md#embedding-in-a-gpui-app)。如要發佈讓應用程式下載並驗證的更新,請參閱[已簽署套件](./signed-packages.md)。

<a id="app-metadata-30"></a>

## 應用程式元數據:`nsh.json`

`nsh package` 會讀取應用程式目錄中的 `nsh.json`(TSX 應用程式則在入口檔案旁)。`nsh init` 會寫入一個:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| 鍵 | 類型 | 預設值 | 用途 |
|---|---|---|---|
| `name` | string | 入口所在目錄的名稱 | 圖示下方顯示的名稱(`CFBundleDisplayName`、Android 的 `android:label`)及輸出檔案名稱。 |
| `id` | string | 必填 | 套件識別碼 / Android 套件名稱,採用你擁有的網域的反向 DNS 格式。它同時決定應用程式[儲存空間](../modules/nsh.md#storage)的位置,令每個應用程式各有自己的儲存空間。`nsh package` 和 `nsh publish` 會對 `com.example.` 佔位值發出警告。 |
| `version` | string | `"1.0.0"` | 使用者可見的版本(`CFBundleShortVersionString`、`versionName`)。 |
| `build` | number | `1` | 建置編號(`CFBundleVersion`、`versionCode`)。每次上傳新版本都要調高。 |
| `icon` | string | 無 | 正方形 PNG,建議 1024×1024,路徑相對於 `nsh.json`。 |

`nsh.json` 亦包含 `rust` 和 `root`(應用程式的 crate 及其根元件,參閱[使用 Rust 建置](./rust.md))、`theme` 和 `appearance`、`tailwind`(參閱 [Tailwind](./tailwind.md))以及 `capabilities`(參閱[沙盒與權限](./sandbox-and-capabilities.md));所有鍵的完整列表請見[專案結構](./project-structure.md#nshjson)。未知的鍵會導致錯誤。

上述每個鍵都可以在命令列覆寫,這在 CI 中很方便:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## 選項

| 旗標 | 說明 |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | 要為哪個平台建置(必填)。 |
| `-o, --out <dir>` | 輸出目錄。預設為 `.nsh/out`。 |
| `--name <name>` | 顯示名稱。 |
| `--id <id>` | 套件識別碼,例如 `com.example.app`。 |
| `--app-version <version>` | 版本,例如 `1.2.0`。 |
| `--build <n>` | 建置編號。 |
| `--icon <png>` | 應用程式圖示:正方形 PNG,建議 1024×1024。 |
| `--sign <identity>` | iOS:裝置用的程式碼簽署身分。 |
| `--profile <file>` | iOS:裝置用的佈建描述檔(`.mobileprovision`)。 |
| `--keystore <file>` | Android:release keystore(預設:debug 金鑰)。 |
| `--key-alias <alias>` | Android:keystore 中的金鑰別名。 |
| `--keystore-password <password>` | Android:keystore 密碼;亦可從 `NSH_KEYSTORE_PASSWORD` 讀取。 |
| `--abi <abi>` | Android:APK 的 ABI,可重複指定或以逗號分隔(預設:`arm64-v8a` 和 `armeabi-v7a`)。 |
| `--run` | 建置後安裝並啟動:在 iOS 模擬器中,或在 `adb` 偵測到的 Android 裝置或模擬器上;macOS、Linux 和 Windows 應用程式會在本機啟動;網站則會在本機提供服務並在瀏覽器中開啟。不適用於 `--target ios`。 |

<a id="ios-simulator"></a>

## iOS 模擬器

```sh
nsh package --target ios-simulator --run
```

會寫入 `.nsh/out/<Name>.app`,以 ad hoc 方式簽署(模擬器需要簽署,但不需要身分)。使用 `--run` 時,若沒有正在運行的模擬器,它會啟動一個,安裝應用程式並啟動。需要 Xcode。

<a id="ios-devices"></a>

## iOS 裝置

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

會寫入 `.nsh/out/<Name>.ipa`,可用於 TestFlight、App Store 上傳工具或直接安裝(視乎描述檔而定)。過程如下:

- 佈建描述檔會以 `embedded.mobileprovision` 的名稱複製到應用程式中。
- 權利(entitlements)來自描述檔。NSH 會檢查描述檔的應用程式識別碼是否涵蓋應用程式的 `id`(`TEAMID.*` 或 `TEAMID.com.example.*` 等萬用字元描述檔亦可),否則會報錯並停止。
- 應用程式會以 `codesign` 使用該身分簽署,然後壓縮成 `.ipa`(`Payload/<Name>.app`)。

可用以下指令找出你的身分:

```sh
security find-identity -v -p codesigning
```

若沒有 `--sign` 和 `--profile`,NSH 會寫入未簽署的 `.nsh/out/<Name>.app` 並告知你;它無法直接安裝到裝置上。

應用程式支援 iPhone 和 iPad、直向和橫向(上下顛倒的直向僅限 iPad),並需要 iOS 15.0 或更新版本。

## Android

```sh
nsh package --target android --run
```

會寫入 `.nsh/out/<Name>.apk`。APK 直接以 SDK 的建置工具(`aapt2`、`zipalign`、`apksigner`)組裝,無需 Gradle。需求如下:

- Android SDK,透過 `ANDROID_HOME`(或 `ANDROID_SDK_ROOT`,或 `~/Library/Android/sdk`)尋找,並包含建置工具和 `platforms;android-35` 套件。如有缺少,NSH 會告訴你應執行的 `sdkmanager` 指令。
- JDK,用於首次建立 debug keystore。
- 對於 Rust 應用程式,還需要 Android NDK(`sdkmanager "ndk;<version>"`,或 `ANDROID_NDK_HOME`),用來建置其 `libnsh.so`。

應用程式的目標為 API 35,並需要 API 28(Android 9)或更新版本。它包含手機 ABI 的原生程式碼,即 `arm64-v8a` 和 `armeabi-v7a`;使用 `--run` 時,還會包含裝置本身的 ABI,例如模擬器的 `x86_64`。`--abi` 可自行選擇,例如 `--abi arm64-v8a` 只包含 64 位元手機,APK 最小:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### 為 release 簽署

沒有 `--keystore` 時,APK 會以標準 debug 金鑰(`~/.android/debug.keystore`,如不存在則會建立)簽署,NSH 會警告它不適用於商店發佈。發佈 release 時,請先建立一次 keystore,然後傳入:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

建議使用環境變數而非 `--keystore-password`,以免密碼留在你的 shell 歷史記錄中。

## macOS

```sh
nsh package --target macos --run
```

會寫入 `.nsh/out/<Name>.app`:可執行檔位於 `Contents/MacOS/`,而 `nsh/assets/…`、`nsh/app.json`(視窗標題及應用程式外觀)以及 TSX 應用程式的 `nsh/bundle.nshc` 則位於 `Contents/Resources/`。應用程式以 ad hoc 方式簽署,需要 macOS 14 或更新版本;如要發佈,請以 Developer ID 簽署並進行公證(notarize)。參閱 [macOS](./macos.md#packaging)。

## Linux

```sh
nsh package --target linux --run
```

會寫入 `.nsh/out/<Name>/`(可執行檔 `<Name>`、`nsh/assets/…`、載有視窗標題和應用程式 id 的 `nsh/app.json`、TSX 應用程式的 `nsh/bundle.nshc`、`<id>.desktop` 和圖示 `<id>.png`),以及與 `.nsh/out/<Name>.tar.gz` 相同的內容。須在 Linux 上打包:runner 是為建置它的機器而建置的。應用程式運行的地方必須安裝 GTK 4(4.14 或更新版本)、Pango 和 WebKitGTK 6.0(用於網頁檢視)。安裝及桌面項目的說明:[Linux](./linux.md#packaging)。

## Windows

```sh
nsh package --target windows --run
```

會寫入 `.nsh\out\<Name>\`(帶有應用程式圖示的可執行檔 `<Name>.exe`、`nsh\assets\…`、載有視窗標題、應用程式 id、版本和外觀的 `nsh\app.json`,以及 TSX 應用程式的 `nsh\bundle.nshc`),以及與 `.nsh\out\<Name>.zip` 相同的內容。TSX 應用程式不需要任何工具;Rust 應用程式的 runner 則以 Visual Studio Build Tools 建置。須在 Windows 上打包:runner 是為建置它的機器而建置的,而且只有 Windows 能嵌入圖示。應用程式可從其目錄被複製到的任何位置運行,無需安裝。參閱 [Windows](./windows.md#packaging)。

<a id="web"></a>

## 網頁

```sh
nsh package --target web --run
```

會寫入 `.nsh/out/<Name>/`,這是一個靜態網站:`index.html`、`manifest.webmanifest`、頁面腳本(`nsh.<digest>.js`)和 `nsh.<digest>.wasm`(Rust 應用程式的引擎和 crate;TSX 應用程式則是 runtime,與應用程式的 ES module `app.<digest>.js` 放在一起),以及其資產和圖示,每個檔案都以其內容命名,方便主機長期快取。將該目錄部署到任何網頁伺服器或 CDN 即可;`--run` 會在 `http://127.0.0.1:4173/` 上提供服務供你開啟。快取標頭和嵌入方式:[Web](./web.md#publish-an-app)。

<a id="icons"></a>

## 圖示

在 `nsh.json`(`"icon": "icon.png"`)中或以 `--icon` 提供一個正方形 PNG,建議 1024×1024:

- **iOS:**由 Xcode 的 `actool` 編譯進應用程式的資產目錄(`Assets.car`),由它衍生 iOS 所需的所有尺寸。
- **Android:**縮放為 192×192 並用作啟動器圖示(`mipmap-xxxhdpi`)。
- **macOS:**由 `sips` 轉換為 `AppIcon.icns`。
- **Linux:**複製為 `<id>.png`,由 `.desktop` 檔案將其指定為 `Icon`。
- **Windows:**縮放為 16 至 64 像素及 256 像素,並嵌入可執行檔作為其圖示,視窗、檔案總管和工作列都會顯示它。
- **網頁:**縮放為 32 像素(favicon)、180(`apple-touch-icon`)、192 和 512(web app manifest)。

沒有圖示時,系統會顯示其預設圖示。

<a id="what-is-inside"></a>

## 內含內容

Rust 應用程式的套件包含其 runner(連同你的 crate 建置並掛載其根元件),以及其 crate 登記的資產(`assets!()`)。TSX 應用程式的套件包含其 bytecode、其 `capabilities.json`(當它宣告權限時)以及它匯入的資產,並與預建 runtime 放在一起:

| 目標平台 | Runtime | TSX 應用程式 |
|---|---|---|
| iOS | `nsh-ios-app` 可執行檔 | `<Name>.app/nsh/bundle.nshc`、`nsh/assets/…` |
| Android | `classes.dex`、`lib/<abi>/libnsh.so`(不含符號、以未壓縮方式儲存、16 KB 對齊) | `assets/nsh/bundle.nshc`、`assets/nsh/assets/…` |
| macOS | `nsh-macos-app` 可執行檔,重新命名為 `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`、`nsh/assets/…` |
| Linux | `nsh-linux-app` 可執行檔,重新命名為 `<Name>` | `<Name>/nsh/bundle.nshc`、`nsh/assets/…` |
| Windows | `nsh-windows-app.exe` 可執行檔,重新命名為 `<Name>.exe` | `<Name>\nsh\bundle.nshc`、`nsh\assets\…` |
| Web | `nsh.<digest>.wasm`、`nsh.<digest>.js` | `<Name>/app.<digest>.js`、`assets/…`、`index.html` |

已打包的應用程式不會登記[原生元件](./native-components.md);如需使用,請將 NSH 嵌入你自己的應用程式。

<a id="finding-the-runtime"></a>

## 尋找 runtime

Rust 應用程式會自行建置 runner。對於 TSX 應用程式,`nsh package` 會在 CLI 旁尋找預建 runtime(發行版中的 `bin/../runtime`)。在 NSH 的 checkout 中,它會使用 `target/<triple>/<profile>` 和 `target/android/<profile>`,並採用 CLI 本身的 profile(debug CLI 使用 debug runtime):請以 `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim`(裝置則用 `aarch64-apple-ios`)和 `cargo xtask android`(release CLI 需加上 `--release`)建置它們;`nsh-macos-app`(在 macOS 上)、`nsh-linux-app`(在 Linux 上)和 `nsh-windows-app`(在 Windows 上)是為本機而建置,位於 `target/<profile>`(`cargo build -p nsh-macos-app`、`cargo build -p nsh-linux-app`、`cargo build -p nsh-windows-app`);網頁 runtime 不論 CLI 使用哪個 profile,都以 `web` profile 建置,輸出到 `target/wasm32-unknown-unknown/web/`。環境變數 `NSH_RUNTIME` 可讓 CLI 指向另一個目錄,其結構須與發行版的 `runtime/` 相同(`ios/iphoneos`、`ios/iphonesimulator`、`android/release`、`macos`、`linux`、`windows`、`gpui`、`web` 等)。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md):所有指令
- [已簽署套件](./signed-packages.md):應用程式下載的更新
- [專案結構](./project-structure.md):`nsh.json` 及應用程式的檔案
