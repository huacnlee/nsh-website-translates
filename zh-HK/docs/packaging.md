---
title: "打包"
description: "使用 nsh package 為 iOS 裝置、iOS 模擬器、Android、macOS、Windows、Linux 與網頁建置可安裝的 Rust 和 TSX 應用程式,並支援應用程式中繼資料、圖示與簽署。"
order: 19
group: platforms
---

# 打包

`nsh package` 可以把 app 變成可安裝的成品:iOS 模擬器用的 `.app`、iOS 裝置用的已簽署 `.ipa`、Android 用的已簽署 `.apk`、macOS 用的 ad hoc 簽署 `.app`、Linux 用的目錄與 `.tar.gz`、Windows 用的目錄與 `.zip`,或是 Web 用的靜態網站。它不需要 Xcode 專案,也不需要 Gradle。

- **Rust app**(由 `nsh.json` 指定其 `"root"`)會從它所在的目錄進行打包。`nsh` 會以 release 模式建置目標平台的 runner,並編入你的 crate、掛載根元件,不含 QuickJS。所需工具:Cargo、該平台的 Rust target(`rustup target add …`),Android 還需要 NDK。
- **TSX app** 需指定其入口。它的 release 建置(經過壓縮、編譯成 QuickJS 位元組碼,與 `nsh build --release` 的建置方式完全相同)會與 NSH 隨附的**預先建置執行階段**放在一起,因此不需要 Rust 工具鏈。擁有自己 crate 的 app(有 `"rust"` 但沒有 `"root"`)會使用其 crate 建置 runner。

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

除非傳入 `--out`,否則輸出會放到 `.nsh/out/`。以下各節列出 Rust app 在各目標平台的指令;TSX app 則需加上其入口(`nsh package App.tsx --target …`)。

> [!NOTE]
> 若想把 NSH 放進*既有的*原生 app 內,請見[平台](./platforms.md#embed-in-a-native-app);若是 GPUI 或 GPUI Kit app,請見 [GPUI](./gpui.md#embedding-in-a-gpui-app)。若要發佈讓 app 下載並驗證的更新,請見[已簽署的套件](./signed-packages.md)。

<a id="app-metadata-30"></a>

## App 中繼資料:`nsh.json`

`nsh package` 會讀取 app 所在目錄中的 `nsh.json`(TSX app 則位於入口檔案旁)。`nsh init` 會寫出一個:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| 鍵 | 型別 | 預設值 | 用途 |
|---|---|---|---|
| `name` | string | 入口所在的目錄名稱 | 圖示下方顯示的名稱(`CFBundleDisplayName`、Android 的 `android:label`)以及輸出檔名。 |
| `id` | string | 必填 | Bundle identifier / Android 套件名稱,採用反向 DNS 格式,並使用你擁有的網域。它也決定 app 的[儲存空間](../modules/nsh.md#storage)位置,讓每個 app 各有自己的儲存空間。`nsh package` 與 `nsh publish` 會針對 `com.example.` 這個預留位置發出警告。 |
| `version` | string | `"1.0.0"` | 使用者看得到的版本(`CFBundleShortVersionString`、`versionName`)。 |
| `build` | number | `1` | 建置編號(`CFBundleVersion`、`versionCode`)。每次上傳的發行版本都要調高。 |
| `icon` | string | 無 | 正方形 PNG,建議為 1024×1024,路徑相對於 `nsh.json`。 |

`nsh.json` 還包含 `rust` 與 `root`(app 的 crate 及其根元件,見[使用 Rust 建置](./rust.md))、`theme` 與 `appearance`、`tailwind`(見 [Tailwind](./tailwind.md))以及 `capabilities`(見[沙箱與權限](./sandbox-and-capabilities.md));所有的鍵都列在[專案結構](./project-structure.md#nshjson)中。未知的鍵會視為錯誤。

上述每個鍵都可以在命令列覆寫,這在 CI 中很方便:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## 選項

| 旗標 | 說明 |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | 要為哪個目標建置(必填)。 |
| `-o, --out <dir>` | 輸出目錄。預設為 `.nsh/out`。 |
| `--name <name>` | 顯示名稱。 |
| `--id <id>` | Bundle identifier,例如 `com.example.app`。 |
| `--app-version <version>` | 版本,例如 `1.2.0`。 |
| `--build <n>` | 建置編號。 |
| `--icon <png>` | App 圖示:正方形 PNG,建議為 1024×1024。 |
| `--sign <identity>` | iOS:裝置用的程式碼簽署身分。 |
| `--profile <file>` | iOS:裝置用的佈建描述檔(`.mobileprovision`)。 |
| `--keystore <file>` | Android:release keystore(預設:debug 金鑰)。 |
| `--key-alias <alias>` | Android:keystore 中的金鑰別名。 |
| `--keystore-password <password>` | Android:keystore 密碼;也可從 `NSH_KEYSTORE_PASSWORD` 讀取。 |
| `--abi <abi>` | Android:APK 的 ABI,可重複指定或以逗號分隔(預設:`arm64-v8a` 與 `armeabi-v7a`)。 |
| `--run` | 打包完成後安裝並啟動:在 iOS 模擬器中,或在 `adb` 偵測到的 Android 裝置或模擬器上;macOS、Linux 與 Windows app 會在本機啟動;Web 網站會在本機提供服務並在瀏覽器中開啟。不適用於 `--target ios`。 |

<a id="ios-simulator"></a>

## iOS 模擬器

```sh
nsh package --target ios-simulator --run
```

會寫出 `.nsh/out/<Name>.app`,並以 ad hoc 方式簽署(模擬器需要簽章,但不需要身分)。搭配 `--run` 時,若沒有正在執行的模擬器,它會啟動一個,然後安裝並啟動 app。需要 Xcode。

<a id="ios-devices"></a>

## iOS 裝置

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

會寫出 `.nsh/out/<Name>.ipa`,可用於 TestFlight、App Store 上傳工具或直接安裝(視描述檔而定)。過程如下:

- 佈建描述檔會以 `embedded.mobileprovision` 的名稱複製到 app 中。
- Entitlements 來自描述檔。NSH 會檢查描述檔的 application identifier 是否涵蓋 app 的 `id`(萬用字元描述檔,例如 `TEAMID.*` 或 `TEAMID.com.example.*`,皆可使用),否則會以錯誤停止。
- App 會使用該身分以 `codesign` 簽署,然後壓縮成 `.ipa`(`Payload/<Name>.app`)。

你可以用以下指令找出自己的身分:

```sh
security find-identity -v -p codesigning
```

若沒有 `--sign` 與 `--profile`,NSH 會寫出未簽署的 `.nsh/out/<Name>.app` 並告知你;這樣的 app 無法直接安裝到裝置上。

此 app 支援 iPhone 與 iPad、直向與橫向(僅 iPad 支援直向倒置),並需要 iOS 15.0 或更新版本。

## Android

```sh
nsh package --target android --run
```

會寫出 `.nsh/out/<Name>.apk`。APK 是直接使用 SDK 的建置工具(`aapt2`、`zipalign`、`apksigner`)組裝而成,不需要 Gradle。需求如下:

- Android SDK,透過 `ANDROID_HOME`(或 `ANDROID_SDK_ROOT`、`~/Library/Android/sdk`)尋找,並需包含建置工具與 `platforms;android-35` 套件。缺少任一項時,NSH 會告訴你要執行的 `sdkmanager` 指令。
- JDK,用於第一次建立 debug keystore。
- Rust app 還需要 Android NDK(`sdkmanager "ndk;<version>"` 或 `ANDROID_NDK_HOME`),用來建置其 `libnsh.so`。

此 app 的目標為 API 35,並需要 API 28(Android 9)或更新版本。它包含手機 ABI 的原生程式碼,即 `arm64-v8a` 與 `armeabi-v7a`;搭配 `--run` 時,還會包含該裝置的 ABI,例如模擬器的 `x86_64`。你也可以用 `--abi` 自行挑選,例如 `--abi arm64-v8a` 只支援 64 位元手機,可得到最小的 APK:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Release 簽署

若沒有 `--keystore`,APK 會以標準的 debug 金鑰(`~/.android/debug.keystore`,若不存在則建立)簽署,NSH 也會警告這不適用於商店發行。要建立 release 版本時,先建立一次 keystore,再傳入:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

建議使用環境變數,而不要用 `--keystore-password`,這樣密碼就不會留在 shell 歷史記錄中。

## macOS

```sh
nsh package --target macos --run
```

會寫出 `.nsh/out/<Name>.app`:可執行檔位於 `Contents/MacOS/`,而 `nsh/assets/…`、`nsh/app.json`(視窗標題與 app 的外觀)以及 TSX app 的 `nsh/bundle.nshc` 位於 `Contents/Resources/`。App 以 ad hoc 方式簽署,並需要 macOS 14 或更新版本;若要散布,請以 Developer ID 簽署並進行公證(notarize)。請見 [macOS](./macos.md#packaging)。

## Linux

```sh
nsh package --target linux --run
```

會寫出 `.nsh/out/<Name>/`(包含可執行檔 `<Name>`、`nsh/assets/…`、含有視窗標題與 application id 的 `nsh/app.json`、TSX app 的 `nsh/bundle.nshc`、`<id>.desktop`,以及圖示 `<id>.png`),以及與 `.nsh/out/<Name>.tar.gz` 相同的內容。請在 Linux 上打包:runner 是為建置它的機器而建置的。執行 app 的機器上必須安裝 GTK 4(4.14 或更新版本)、Pango 與 WebKitGTK 6.0(供 web view 使用)。安裝方式與桌面項目請見 [Linux](./linux.md#packaging)。

## Windows

```sh
nsh package --target windows --run
```

會寫出 `.nsh\out\<Name>\`(包含帶有 app 圖示的可執行檔 `<Name>.exe`、`nsh\assets\…`、含有視窗標題、app id、版本與外觀的 `nsh\app.json`,以及 TSX app 的 `nsh\bundle.nshc`),以及與 `.nsh\out\<Name>.zip` 相同的內容。TSX app 不需要任何工具;Rust app 的 runner 則使用 Visual Studio Build Tools 建置。請在 Windows 上打包:runner 是為建置它的機器而建置的,而且只有 Windows 能嵌入圖示。App 可從其目錄被複製到的任何位置執行,不需要安裝。請見 [Windows](./windows.md#packaging)。

## Web

```sh
nsh package --target web --run
```

會寫出 `.nsh/out/<Name>/`,這是一個靜態網站:`index.html`、`manifest.webmanifest`、頁面指令碼(`nsh.<digest>.js`)以及 `nsh.<digest>.wasm`(Rust app 的引擎與 crate;TSX app 則是執行階段,與 app 的 ES module `app.<digest>.js` 放在一起)、其資產與圖示,每個檔案都以其內容命名,讓主機可以永久快取。將此目錄部署到任何網頁伺服器或 CDN 即可;`--run` 會在 `http://127.0.0.1:4173/` 提供服務,供你開啟。快取標頭與嵌入方式請見 [Web](./web.md#publish-an-app)。

<a id="icons"></a>

## 圖示

請提供一張正方形 PNG,建議為 1024×1024,可寫在 `nsh.json`(`"icon": "icon.png"`)中,或搭配 `--icon` 使用:

- **iOS:** 由 Xcode 的 `actool` 編譯進 app 的資產目錄(`Assets.car`),並由它衍生出 iOS 所需的所有尺寸。
- **Android:** 縮放為 192×192,作為啟動器圖示(`mipmap-xxxhdpi`)。
- **macOS:** 由 `sips` 轉換為 `AppIcon.icns`。
- **Linux:** 複製為 `<id>.png`,並由 `.desktop` 檔案將其指定為 `Icon`。
- **Windows:** 縮放為 16 至 64 像素以及 256 像素,並以圖示形式嵌入可執行檔,視窗、檔案總管與工作列都會顯示它。
- **Web:** 縮放為 32 像素(favicon)、180(`apple-touch-icon`)、192 與 512(web app manifest)。

若沒有圖示,系統會顯示其預設圖示。

<a id="what-is-inside"></a>

## 內容物

Rust app 的套件包含其 runner(以你的 crate 建置並掛載其根元件),以及其 crate 所註冊的資產(`assets!()`)。TSX app 的套件則包含其位元組碼、其 `capabilities.json`(在宣告了權限時),以及它所匯入的資產,並與預先建置的執行階段放在一起:

| 目標 | 執行階段 | TSX app |
|---|---|---|
| iOS | `nsh-ios-app` 可執行檔 | `<Name>.app/nsh/bundle.nshc`、`nsh/assets/…` |
| Android | `classes.dex`、`lib/<abi>/libnsh.so`(無符號、未壓縮儲存、16 KB 對齊) | `assets/nsh/bundle.nshc`、`assets/nsh/assets/…` |
| macOS | `nsh-macos-app` 可執行檔,更名為 `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`、`nsh/assets/…` |
| Linux | `nsh-linux-app` 可執行檔,更名為 `<Name>` | `<Name>/nsh/bundle.nshc`、`nsh/assets/…` |
| Windows | `nsh-windows-app.exe` 可執行檔,更名為 `<Name>.exe` | `<Name>\nsh\bundle.nshc`、`nsh\assets\…` |
| Web | `nsh.<digest>.wasm`、`nsh.<digest>.js` | `<Name>/app.<digest>.js`、`assets/…`、`index.html` |

打包後的 app 不會註冊[原生元件](./native-components.md);若需要原生元件,請將 NSH 嵌入你自己的 app。

<a id="finding-the-runtime"></a>

## 尋找執行階段

Rust app 會建置自己的 runner。對於 TSX app,`nsh package` 會在 CLI 旁尋找預先建置的執行階段(發行版中的 `bin/../runtime`)。在 NSH 的 checkout 中,則使用 `target/<triple>/<profile>` 與 `target/android/<profile>`,並採用 CLI 本身的 profile(debug CLI 使用 debug 執行階段):請用 `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim`(裝置則用 `aarch64-apple-ios`)與 `cargo xtask android`(release CLI 需加上 `--release`)建置;`nsh-macos-app`(macOS 上)、`nsh-linux-app`(Linux 上)與 `nsh-windows-app`(Windows 上)是為這台機器建置在 `target/<profile>`(`cargo build -p nsh-macos-app`、`cargo build -p nsh-linux-app`、`cargo build -p nsh-windows-app`)中;Web 執行階段則無論 CLI 的 profile 為何,一律以 `web` profile 建置到 `target/wasm32-unknown-unknown/web/`。環境變數 `NSH_RUNTIME` 可讓 CLI 指向另一個目錄,其結構需與發行版的 `runtime/` 相同(`ios/iphoneos`、`ios/iphonesimulator`、`android/release`、`macos`、`linux`、`windows`、`gpui`、`web` 等)。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md):所有指令
- [已簽署的套件](./signed-packages.md):app 下載的更新
- [專案結構](./project-structure.md):`nsh.json` 與 app 的檔案
