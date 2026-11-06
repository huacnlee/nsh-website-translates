---
title: "開始使用"
description: "使用 nsh init 以 Rust 或 TSX 建立應用程式,並在 iOS、Android、macOS、Windows、Linux 或網頁上執行;也可以在應用程式中託管 TSX 模組並以簽署套件的形式發布,或將應用程式獨立打包。"
order: 4
group: start
demo: guide-getting-started
---

# 快速開始

本指南會建立一個 NSH 應用程式、在你的目標平台上執行,並將它發布。NSH 應用程式以 Rust 或 TSX 撰寫,使用同一個引擎:Rust 會將你的應用程式編譯為原生程式碼,不含 JavaScript VM;TSX 則在 QuickJS 上執行並支援熱更新,以原生應用程式可在執行階段載入的模組形式存在。本指南先介紹 Rust 應用程式,再介紹以 TSX 撰寫的同一個應用程式。內容假設 `nsh` 已安裝並位於你的 `PATH` 中([安裝](./installation.md));在 checkout 中,請改用 `./target/debug/nsh`。

> [!TIP]
> 手邊沒有應用程式專案嗎?前兩個章節不需要專案:`nsh run` 會在你電腦上的視窗、iOS 模擬器、Android 裝置或瀏覽器中顯示應用程式。你可以到此為止,也可以[將它打包為獨立應用程式](#or-ship-it-as-a-standalone-app)。

<a id="create-an-app"></a>

## 建立應用程式

在終端機中,`nsh init` 會詢問應用程式使用什麼撰寫:`rust`、`ts` 或 `mixed`(TSX 搭配專屬的 Rust crate)。`--template` 可不經詢問直接選定。

<a id="in-rust"></a>

### 使用 Rust

```sh
nsh init my-app --template rust
```

`nsh init` 會建立目錄並寫入一個 Cargo 專案:

| 檔案 | 說明 |
|---|---|
| `src/lib.rs` | 應用程式本體:根元件、狀態與處理函式 |
| `src/main.rs` | 為 `cargo run` 在 macOS、Windows 或 Linux 上掛載同一個根元件 |
| `Cargo.toml` | 此 crate,依賴與 CLI 同版本的 `nsh-core` 和 `nsh-base` |
| `nsh.json` | 應用程式的名稱、id、版本與建置編號,以及它的 crate(`"rust": "."`)和根元件(`"root": "App"`)([專案結構](./project-structure.md#nshjson)) |
| `App.test.tsx` | 根元件的測試,以 TypeScript(`nsh test`)撰寫,並附有供編輯器使用的 `tsconfig.json` 和 `.nsh/types` |
| `README.md` | 如何執行、測試與打包應用程式,以及日後如何新增 TSX 入口 |
| `.gitignore` | 忽略 `.nsh/` 和 `target/` |

Rust 開發需要 Rust 工具鏈([rustup](https://rustup.rs));`nsh` 指令會以 CLI 的版本,從 crates.io 上的 NSH crate 建置應用程式的 runner。

<a id="in-tsx"></a>

### 使用 TSX

```sh
nsh init my-app --template ts
```

TSX 應用程式由一個或多個 `.tsx` 檔案與一個入口組成:`nsh run` 執行的是入口,宿主應用程式也將它當作模組載入。

| 檔案 | 說明 |
|---|---|
| `App.tsx` | 入口模組:以 `mount` 渲染應用程式 |
| `App.test.tsx` | 它的測試(`nsh test`) |
| `nsh.json` | 應用程式的名稱、id、版本與建置編號([專案結構](./project-structure.md#nshjson)) |
| `tsconfig.json` | 擴充 `.nsh/tsconfig.json`(NSH 的 TypeScript 設定),它會將 `nsh` 解析為 `.nsh/types` 中的宣告 |
| `.gitignore` | 忽略 `.nsh/` 和 `target/` |
| `.nsh/types/` | 為編輯器產生的所有 NSH 模組宣告 |

已存在的檔案會被保留,因此你可以在已有其中部分檔案的目錄中執行;Rust 應用程式則會建立在新目錄中。

兩者的顯示名稱預設為目錄名稱;可傳入 `--name "My App"` 指定其他名稱。id 會成為 `com.example.<name>`:發布前請在 `nsh.json` 中修改。`nsh init my-app --template mixed` 會建立同時也是 Rust crate 的 TSX 應用程式(在 `App.tsx` 旁附帶 `Cargo.toml` 和 `src/lib.rs`),其元件、模組與類別 `App.tsx` 會匯入([使用 Rust 建置](./rust.md))。

<a id="the-root-component"></a>

### 根元件

兩個範本建立的是同一個應用程式,一個計數器:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

在 Rust 中:

- **`use nsh_core::prelude::*`** 提供基本元件(`view()`、`text()`、`scroll()`、`input()`、`image()` 等)、[signal](./reactivity.md)與具型別的樣式方法(`.p_safe_area()` 會依[安全區域](../elements/safe-area.md)為 view 加上內距);**`nsh_base`** 則包含無樣式的基底元件(`button()`、鍵盤、對話框)以及 `theme()`,也就是應用程式元件繪製時使用的顏色與圓角([主題](./rust.md#theme))。
- **`#[component] pub fn App()`** 是一個元件:一個**只執行一次**並回傳其元素的函式。`nsh.json` 的 `"root": "App"` 為它命名,`nsh run` 負責掛載它。`signal(0_u32)` 會建立一個隨時間變化的值。
- **`text(move || format!(…, count.get()))`** 將文字繫結到 signal:當 `count` 改變時,NSH 會再次執行這個 closure,並只更新這一段文字,其他部分不受影響。樣式也以相同方式接受 closure:`.bg(move || theme().primary)` 會隨主題切換到深色模式。
- **`.on_press(..)`** 讓 view 能回應按壓;`.active(|s| s.opacity(0.6))` 是它被按下時的樣式,以原生方式套用。這個按鈕是應用程式自己的:NSH 提供基本元件與各項功能,應用程式再用它們繪製自己的 UI。
- **`.px_5()`、`.rounded(px(10.0))`、`.gap_4()`** 是具型別的樣式方法,命名方式與 Tailwind 的 utility 相同,單位為點(`px`)。版面配置採用 flexbox,子元素預設以直欄堆疊([版面配置](./layout.md))。
- **`#[native_module("my-app/native")]`** 指定 TSX 入口可以從該 crate 匯入哪些內容,供你日後在其上新增 TSX 畫面時使用([使用 Rust 建置](./rust.md#extending-a-rust-app-with-tsx))。

在 TSX 中:

- **`import { mount, signal, Text, View } from "nsh"`**:`nsh` 是核心模組:signal、`mount`、其他響應式基本元件,以及宿主元素。它由原生執行階段提供,不會被打包。**`nsh/base`** 提供基底元件,作用如同 Rust 中的 `nsh_base`。
- **`function App()`** 是一個**只執行一次**的元件。**`{count()}`** 在 JSX 中讀取 signal:編譯器會辨識出這是一個呼叫,並讓這段文字跟隨 signal 更新。
- **`<View onPress>`** 是會回應按壓的原生 view;`active:` class 是它被按下時的樣式。`View`、`Text`、`Image`、`Scroll` 與其他[宿主元素](../elements/index.md)從 `nsh` 匯入(`Input` 則從 `nsh/base` 匯入);只有 `If` 和 `Each` 不需要匯入。
- **`class`** 接受 [Tailwind](./tailwind.md) class;`style={{ … }}` 接受由 camelCase 樣式屬性組成的物件,數值單位為點。`bg-background`、`bg-primary`、`text-primary-foreground` 和 `rounded-(--radius)` 代表應用程式主題的 token([主題 token](./tailwind.md#theme-tokens)):它們會自動跟隨深色模式,而 `nsh.json` 中的 `"theme"` 可重新調整它們的樣式。
- **`mount(App)`** 將元件渲染到應用程式的 surface 中。

> [!IMPORTANT]
> 文字要顯示在文字元素中:Rust 使用 `text(..)`,TSX 使用 `<Text>`。在 TSX 中,直接寫在 `<View>` 內的文字(`<View>Hello</View>`)會造成建置錯誤並指出位置;而由運算式放進去的字串(`<View>{name}</View>`)則會記錄在日誌中。

<a id="develop-it"></a>

## 開發

<a id="run-it"></a>

### 執行

`nsh run` 會建置應用程式、啟動它,並在你編輯時重新建置;應用程式的日誌會顯示在終端機中。請給它應用程式的目錄:它會執行 Rust 應用程式的根元件,或 TSX 應用程式的 `App.tsx`(`nsh run my-app/App.tsx` 可指定其他入口)。

對 Rust 應用程式而言,`nsh run` 會為目標平台建置應用程式專屬的 runner,內含你的 crate 與掛載好的根元件,不含 QuickJS,並啟動它;Rust 程式碼有變更時會重新建置並重新啟動應用程式。在應用程式目錄中執行 `cargo run`,則會直接在桌面後端啟動同一個根元件。對 TSX 應用程式而言,`nsh run` 會啟動開發伺服器與一個從中載入應用程式的開發宿主,並在每次儲存時修補執行中的應用程式。

未指定 `--target` 時,`nsh run` 會使用你目前所在的機器:macOS 上是 AppKit 視窗,Windows 上是 Win32 視窗,Linux 上是 GTK 視窗。可用 `--target` 選擇其他平台:

| 目標 | 指令 | 可從何處執行 |
|---|---|---|
| iOS 模擬器 | `nsh run my-app --target ios` | 安裝 Xcode 的 macOS |
| Android | `nsh run my-app --target android` | macOS、Windows、Linux |
| macOS (AppKit) | `nsh run my-app` | macOS(預設) |
| Windows | `nsh run my-app` | Windows(預設) |
| Linux (GTK 4) | `nsh run my-app` | Linux(預設) |
| Web | `nsh run my-app --target web` | macOS、Windows、Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### iOS 模擬器

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` 會使用已開機的模擬器;若沒有執行中的模擬器,則啟動最新的 iPhone,並將應用程式(Rust 應用程式的 runner,或開發宿主)安裝到其中。`--device` 可依名稱或 UDID 指定模擬器。

#### Android

```sh
nsh run my-app --target android
```

請先啟動模擬器或連接裝置(`adb devices` 會列出它們;NSH 使用第一個)。`nsh` 會將應用程式安裝到該裝置上:可能是 Rust 應用程式專屬的 `libnsh.so`,或是開發宿主 APK(僅在執行階段變更時才重新建置),其開發伺服器連接埠會透過 `adb reverse` 轉送到裝置,因此透過 USB 即可運作,無需共用網路。

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

應用程式會以桌面 Mac 應用程式的形式開啟(AppKit,可調整大小的視窗),輸入方式為滑鼠、觸控板與鍵盤,而非觸控。需要 macOS 14 或更新版本;請參閱 [macOS](./macos.md)。

<a id="windows-default-on-windows"></a>

#### Windows(Windows 上的預設)

```sh
nsh run my-app
```

應用程式會在桌面視窗中開啟(1200×800 點),支援滑鼠、觸控板、觸控與鍵盤輸入。需要 Windows 10 1809 或更新版本;請參閱 [Windows](./windows.md)。

<a id="linux-default-on-linux"></a>

#### Linux(Linux 上的預設)

```sh
nsh run my-app
```

應用程式會在 GTK 視窗中開啟(390×844 點)。需要 GTK 4.14 或更新版本;請參閱 [Linux](./linux.md)。

#### Web

```sh
nsh run my-app --target web
```

`nsh` 會印出頁面的網址;請在瀏覽器中開啟。Rust 應用程式會連同你的 crate 以 WebAssembly 執行,變更後已開啟的頁面會自動載入新的建置;請參閱 [Web](./web.md)。

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

應用程式會在你 Mac 上的 iPhone 尺寸視窗(390×844 點)中開啟。這是查看應用程式在手機上樣貌的最快方式:無需啟動模擬器。它與 iOS 一樣使用 UIKit,因此除了滑鼠滾輪捲動等 Mac 專屬行為之外,你看到的就是 iPhone 上顯示的樣子。若要查看 Mac 應用程式本身,請使用 `--target macos`。

<a id="edit-it"></a>

### 編輯

讓 `nsh run` 持續執行,並修改按鈕的標籤:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

儲存。Rust 應用程式會重新建置,並以新的標籤重新啟動;計數會從頭開始。TSX 應用程式則會收到熱更新:CLI 會重新建置並送出修補,宿主會重新執行有變更的模組,並只重新渲染程式碼有變更的元件。此處即是 `App`,它擁有 `count` signal,因此計數同樣會從頭開始。

你可以將 UI 的片段移到各自的元件,或是回傳元素的一般函式中:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

在 TSX 中,當你編輯的元件並不擁有該狀態時,狀態會保留下來:點按幾次,再修改 `TapButton` 的顏色,按鈕會更新,而計數維持不變。熱替換以頂層元件為單位:即名稱首字母大寫且函式主體包含 JSX 的函式。當元件自身的程式碼改變,或模組中元件以外的程式碼改變(例如它使用的常數或輔助函式)時,該元件會重新渲染。如果某次編輯無法就地套用(例如它匯入了執行中的應用程式尚未匯入的 NSH 模組,或變更了 `nsh.json` 的功能),宿主會重新載入整個應用程式。

<a id="errors"></a>

#### 錯誤

Rust 編譯錯誤會連同 cargo 的輸出一起顯示在終端機中,`nsh run` 會在下次儲存時再次建置。TSX 建置錯誤會顯示在終端機中,並在裝置上以紅色覆蓋層顯示,包含檔案、行與列;應用程式會繼續執行上一個成功的建置。下一次建置成功後,覆蓋層就會消失(也可以點按它提前關閉)。執行階段擲出的例外會以相同方式顯示,其堆疊會對應回你的 `.tsx` 原始碼。

<a id="host-it-in-your-app"></a>

## 嵌入你的應用程式

原生應用程式會在它自己的 view 中顯示 NSH:iOS 上是 `NshAppView`(一個 `UIView`),Android 上是 `NshView`(一個 Android `View`),macOS、Windows、Linux 與 GPUI 應用程式中則是 `AppView`。你可以像放置其他 view 一樣,將它放在任何畫面上,需要幾個就放幾個。

Rust 根元件是應用程式建置的一部分:應用程式會連結你的 crate,並在 macOS、Windows、Linux、GPUI 與 iOS 的 `AppView` 上以 `AppSource::Rust` 掛載根元件([使用 Rust 建置](./rust.md#an-app-written-in-rust))。TSX 應用程式則是由 view 載入的模組:開發期間從開發伺服器載入,正式版本則從建置好的 bundle 或下載的已簽署套件載入。以下章節載入的是 TSX 模組。

### iOS

Debug 時連結 `NativeShellDev.xcframework`,Release 時連結 `NativeShell.xcframework`([嵌入 iOS 應用程式](./ios.md)),然後:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` 會將模組提供給應用程式,並在每次儲存時推送更新,與 `nsh run` 對它自己的宿主所做的相同。對於正式建置,`nsh build my-app --release --out MyApp/nsh` 會將 bundle 寫入一個資料夾,你再將該資料夾加入應用程式的資源。

### Android

除錯建置時加入 `nsh-dev.aar`,正式建置時加入 `nsh.aar`([嵌入 Android 應用程式](./android.md)),然後:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS、Windows 與 Linux

以 Rust 撰寫的桌面應用程式使用 `AppView` 嵌入 NSH,它來自 `nsh-platform-macos`、`nsh-platform-windows`、`nsh-platform-linux` 和 `nsh-platform-gpui` crate:包括 `NSView`、子視窗、GTK widget 或 GPUI view,可掛載 Rust 根元件或載入建置好的 bundle。請參閱 [macOS](./macos.md#embedding-in-a-mac-app)、[Windows](./windows.md#embedding-in-a-win32-app)、[Linux](./linux.md#embedding-in-a-gtk-app) 與 [GPUI](./gpui.md),以及並列比較所有宿主的[平台](./platforms.md#embed-in-a-native-app)。

<a id="what-the-module-may-do"></a>

### 模組可以做什麼

在 iOS 與 Android 上,宿主會在載入前決定模組可以做什麼:`grantCapabilities` 設定模組可存取的網路主機與其他功能,而限制則會約束它的記憶體、呼叫時間與節點數量([沙箱與功能](./sandbox-and-capabilities.md))。若要為模組提供你自己的原生 view(地圖、圖表、設計系統元件),請將它們註冊為[原生元件](./native-components.md)。

<a id="ship-updates-as-signed-packages"></a>

## 以已簽署套件發布更新

應用程式在發布後下載的 TSX 模組,會以已簽署套件的形式提供。請先建立一次根金鑰並離線保存,用它為發布金鑰簽發憑證,然後發布:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

應用程式信任根金鑰的公開金鑰,並載入它下載的內容;在執行任何內容之前,NSH 會先驗證簽章、憑證與撤銷清單:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android 的流程相同,使用 `NshTrust` 和 `NshPackage`。關於託管、派送與撤銷的詳細說明:[已簽署套件](./signed-packages.md)。
<a id="or-ship-it-as-a-standalone-app"></a>

## 以獨立應用程式發佈

`nsh package` 會建置可安裝的應用程式（Rust 或 TSX 皆可），無需自行維護 Xcode 專案或 Gradle 建置：

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Rust 應用程式會連同專屬的 runner 一併打包，該 runner 由你的 crate 與 NSH 的 crates 建置而成，並掛載其根元件；TSX 應用程式則使用預先建置好的 runtime。選項、簽署與圖示請參閱 [打包](./packaging.md)。

<a id="try-it-in-the-terminal"></a>

## 在終端機中試用

`nsh test` 以無頭模式（headless）執行應用程式，不需要裝置或視窗。給定 Rust 應用程式的 `nsh.json` 或 TSX 應用程式的進入點後，它會開啟應用程式、讓其執行，並印出所掛載的內容；搭配 `--trace` 時，還會印出原生檢視操作，以及每次 commit 的耗時（[測試](./testing-and-trace.md)）：

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

若給定的是目錄，則會執行該應用程式的測試：每個範本的 `App.test.tsx` 會開啟應用程式、按下其按鈕，並檢查所顯示的內容（`nsh test my-app`）。Rust 應用程式的測試會開啟其根元件（`open(".")`）；也可以使用 `nsh_testing::Headless` 在 `cargo test` 中進行測試（[使用 Rust 建置](./rust.md#testing)）。

<a id="next-steps"></a>

## 後續步驟

- [使用 Rust 建置](./rust.md)：Rust 應用程式、其主題，以及建構於 Rust crate 之上的 TSX。
- [JSX 與元件](./jsx-and-components.md)和 [響應式](./reactivity.md)：元件與 signal，涵蓋 Rust 與 TSX。
- [平台](./platforms.md)：各平台支援的功能，以及各自的專頁（[iOS](./ios.md)、[Android](./android.md)、[macOS](./macos.md)、[Windows](./windows.md)、[Linux](./linux.md)）。
- [簽署套件](./signed-packages.md)與[沙箱與權限](./sandbox-and-capabilities.md)：交付方式，以及模組可執行的操作。
- [專案結構](./project-structure.md)：`nsh.json` 中應放置的內容、資源與檔案。
