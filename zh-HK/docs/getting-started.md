---
title: "開始使用"
description: "使用 nsh init 以 Rust 或 TSX 建立應用程式,並在 iOS、Android、macOS、Windows、Linux 或網頁上執行;你亦可以在應用程式中載入 TSX 模組,並將其作為已簽署的套件發佈,或者將應用程式獨立打包。"
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---


# 開始使用

本指南會建立一個 NSH 應用程式，在你鎖定的平台上運行，並將它發佈。NSH 應用程式以 Rust 或 TSX 編寫，建基於同一個引擎：Rust 將你的應用程式編譯成原生程式碼，不需要 JavaScript VM；TSX 則在 QuickJS 上運行並支援熱更新，以原生應用程式可於運行時載入的模組形式存在。本指南先講 Rust 應用程式，再講以 TSX 編寫的同一個應用程式。指南假設 `nsh` 已安裝並在你的 `PATH` 之中（[安裝](./installation.md)）；在 checkout 中，請改用 `./target/debug/nsh`。

> [!TIP]
> 手上沒有應用程式專案？頭兩節都不需要：`nsh run` 會在你電腦的視窗、iOS 模擬器、Android 裝置或瀏覽器中顯示應用程式。你可以到此為止，或[將它封裝為獨立應用程式](#or-ship-it-as-a-standalone-app)。

<a id="create-an-app"></a>

## 建立應用程式

在終端機中，`nsh init` 會詢問應用程式以甚麼編寫：`rust`、`ts` 或 `mixed`（附帶自己 Rust crate 的 TSX）。`--template` 則不經詢問直接選擇。

<a id="in-rust"></a>

### 使用 Rust

```sh
nsh init my-app --template rust
```

`nsh init` 會建立該目錄並寫入一個 Cargo 專案：

| 檔案 | 說明 |
|---|---|
| `src/lib.rs` | 應用程式本體：根元件、狀態和處理函式 |
| `src/main.rs` | 在 macOS、Windows 或 Linux 上掛載同一個根元件，供 `cargo run` 使用 |
| `Cargo.toml` | 這個 crate，依賴 `nsh-core` 和 `nsh-base`，版本與 CLI 一致 |
| `nsh.json` | 應用程式的名稱、id、版本和建置編號，以及它的 crate（`"rust": "."`）和根元件（`"root": "App"`）（[專案結構](./project-structure.md#nshjson)） |
| `App.test.tsx` | 根元件的測試，以 TypeScript（`nsh test`）編寫，並附有供編輯器使用的 `tsconfig.json` 和 `.nsh/types` |
| `README.md` | 如何運行、測試和封裝應用程式，以及日後如何加入 TSX 入口 |
| `.gitignore` | 忽略 `.nsh/` 和 `target/` |

Rust 開發需要 Rust 工具鏈（[rustup](https://rustup.rs)）；`nsh` 指令會以 CLI 的版本，從 crates.io 上 NSH 的 crate 建置應用程式的 runner。

<a id="in-tsx"></a>

### 使用 TSX

```sh
nsh init my-app --template ts
```

TSX 應用程式由一個或多個 `.tsx` 檔案加上一個入口組成：入口就是 `nsh run` 運行的內容，也是宿主應用程式作為模組載入的內容。

| 檔案 | 說明 |
|---|---|
| `App.tsx` | 入口模組：以 `mount` 渲染應用程式 |
| `App.test.tsx` | 它的測試（`nsh test`） |
| `nsh.json` | 應用程式的名稱、id、版本和建置編號（[專案結構](./project-structure.md#nshjson)） |
| `tsconfig.json` | 擴展 `.nsh/tsconfig.json`，即 NSH 的 TypeScript 設定，會將 `nsh` 解析至 `.nsh/types` 中的宣告 |
| `.gitignore` | 忽略 `.nsh/` 和 `target/` |
| `.nsh/types/` | 為編輯器而生成的所有 NSH 模組宣告 |

已存在的檔案會被保留，因此你可以在已有部分這些檔案的目錄中運行；Rust 應用程式則會建立在新的目錄中。

兩者的顯示名稱預設為目錄名稱；傳入 `--name "My App"` 可選用其他名稱。id 會變成 `com.example.<name>`：發佈前請在 `nsh.json` 中修改。`nsh init my-app --template mixed` 會建立同時也是 Rust crate 的 TSX 應用程式（在 `App.tsx` 旁邊有 `Cargo.toml` 和 `src/lib.rs`），其元件、模組和類別會由 `App.tsx` 匯入（[使用 Rust 建置](./rust.md)）。

<a id="the-root-component"></a>

### 根元件

兩個範本產生的是同一個應用程式，一個計數器：

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

在 Rust 中：

- **`use nsh_core::prelude::*`** 提供基本元素（`view()`、`text()`、`scroll()`、`input()`、`image()` 等）、[signals](./reactivity.md) 和具型別的樣式方法（`.p_safe_area()` 會按[安全區域](../elements/safe-area.md)為檢視加上內距）；**`nsh_base`** 則提供無樣式的基礎元件（`button()`、鍵盤、對話框）和 `theme()`，即應用程式元件繪製時所用的顏色和圓角（[主題](./rust.md#theme)）。
- **`#[component] pub fn App()`** 是一個元件：一個只會運行**一次**並回傳其元素的函式。`nsh.json` 的 `"root": "App"` 為它命名，`nsh run` 則掛載它。`signal(0_u32)` 會建立一個隨時間變化的值。
- **`text(move || format!(…, count.get()))`** 將文字繫結到 signal：當 `count` 改變時，NSH 會再次運行這個閉包，只更新這一段文字，其他一概不動。樣式同樣接受閉包：`.bg(move || theme().primary)` 會跟隨主題切換至深色模式。
- **`.on_press(..)`** 讓檢視回應按壓；`.active(|s| s.opacity(0.6))` 是它被按下時的樣式，以原生方式套用。這個按鈕是應用程式自己的：NSH 提供基本元素和功能，應用程式以它們繪製自己的 UI。
- **`.px_5()`、`.rounded(px(10.0))`、`.gap_4()`** 是具型別的樣式方法，命名方式與 Tailwind 的工具類別相同，單位為點（`px`）。版面配置採用 flexbox，子元素預設以直行堆疊（[版面配置](./layout.md)）。
- **`#[native_module("my-app/native")]`** 指明 TSX 入口可從 crate 匯入甚麼，供你在其上加入 TSX 畫面時使用（[使用 Rust 建置](./rust.md#extending-a-rust-app-with-tsx)）。

在 TSX 中：

- **`import { mount, signal, Text, View } from "nsh"`**：`nsh` 是核心模組：signals、`mount`、其他響應式基本元素，以及宿主元素。它由原生運行環境提供，不會被打包。**`nsh/base`** 提供基礎元件，作用等同 Rust 中的 `nsh_base`。
- **`function App()`** 是一個只會運行**一次**的元件。**`{count()}`** 在 JSX 內讀取 signal：編譯器看見這是一個呼叫，便讓這段文字跟隨 signal。
- **`<View onPress>`** 是會回應按壓的原生檢視；`active:` 類別是它被按下時的樣式。`View`、`Text`、`Image`、`Scroll` 和其他[宿主元素](../elements/index.md)從 `nsh` 匯入（`Input` 則從 `nsh/base` 匯入）；只有 `If` 和 `Each` 不需要匯入。
- **`class`** 接受 [Tailwind](./tailwind.md) 類別；`style={{ … }}` 接受由 camelCase 樣式屬性組成的物件，數值單位為點。`bg-background`、`bg-primary`、`text-primary-foreground` 和 `rounded-(--radius)` 指向應用程式主題的 token（[主題 token](./tailwind.md#theme-tokens)）：它們會自動跟隨深色模式，而 `nsh.json` 中的 `"theme"` 可為它們重新設定樣式。
- **`mount(App)`** 將元件渲染到應用程式的 surface 中。

> [!IMPORTANT]
> 文字要放在文字元素中顯示：Rust 中是 `text(..)`，TSX 中是 `<Text>`。在 TSX 中，直接寫在 `<View>` 內的文字（`<View>Hello</View>`）會引致建置錯誤並指出位置，而由表達式放入的字串（`<View>{name}</View>`）則會記錄在日誌中。

<a id="develop-it"></a>

## 開發

<a id="run-it"></a>

### 運行

`nsh run` 會建置應用程式、啟動它，並在你編輯時重新建置；應用程式的日誌會顯示在終端機中。請提供應用程式的目錄：它會運行 Rust 應用程式的根元件，或 TSX 應用程式的 `App.tsx`（`nsh run my-app/App.tsx` 可指定另一個入口）。

對於 Rust 應用程式，`nsh run` 會為目標平台建置應用程式自己的 runner，內含你的 crate 和已掛載的根元件，不含 QuickJS，然後啟動它；Rust 程式碼一有改動就會重新建置並重啟應用程式。在應用程式目錄中運行 `cargo run`，會直接以桌面後端啟動同一個根元件。對於 TSX 應用程式，`nsh run` 會啟動一個開發伺服器和一個從中載入應用程式的開發宿主，並在每次儲存時為運行中的應用程式打上修補。

如果沒有 `--target`，`nsh run` 會使用你正在使用的機器：macOS 上是 AppKit 視窗，Windows 上是 Win32 視窗，Linux 上是 GTK 視窗。使用 `--target` 可選擇其他平台：

| 目標 | 指令 | 可從以下環境運行 |
|---|---|---|
| iOS 模擬器 | `nsh run my-app --target ios` | 已安裝 Xcode 的 macOS |
| Android | `nsh run my-app --target android` | macOS、Windows、Linux |
| macOS (AppKit) | `nsh run my-app` | macOS（預設） |
| Windows | `nsh run my-app` | Windows（預設） |
| Linux (GTK 4) | `nsh run my-app` | Linux（預設） |
| Web | `nsh run my-app --target web` | macOS、Windows、Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### iOS 模擬器

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` 會使用已啟動的模擬器；若沒有任何模擬器在運行，則會啟動最新的 iPhone，並將應用程式（Rust 應用程式的 runner 或開發宿主）安裝到其中。`--device` 可按名稱或 UDID 選擇模擬器。

#### Android

```sh
nsh run my-app --target android
```

請先啟動模擬器或連接裝置（`adb devices` 會列出它們；NSH 使用第一個）。`nsh` 會將應用程式安裝到該裝置：可以是 Rust 應用程式自己的 `libnsh.so`，或開發宿主 APK（只在運行環境改變時才重新建置），其開發伺服器連接埠會以 `adb reverse` 轉發到裝置，因此無需共用網絡，經 USB 也能運作。

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

應用程式會以桌面 Mac 應用程式的形式開啟（AppKit，在可調整大小的視窗中），使用滑鼠、觸控板和鍵盤輸入，而非觸控。它需要 macOS 14 或更新版本；請參閱 [macOS](./macos.md)。

<a id="windows-default-on-windows"></a>

#### Windows（在 Windows 上為預設）

```sh
nsh run my-app
```

應用程式會在桌面視窗（1200×800 點）中開啟，支援滑鼠、觸控板、觸控和鍵盤輸入。它需要 Windows 10 1809 或更新版本；請參閱 [Windows](./windows.md)。

<a id="linux-default-on-linux"></a>

#### Linux（在 Linux 上為預設）

```sh
nsh run my-app
```

應用程式會在 GTK 視窗（390×844 點）中開啟。它需要 GTK 4.14 或更新版本；請參閱 [Linux](./linux.md)。

#### Web

```sh
nsh run my-app --target web
```

`nsh` 會印出頁面的位址；請在瀏覽器中開啟。Rust 應用程式會連同你的 crate 以 WebAssembly 運行，改動後已開啟的頁面會自行載入新的建置；請參閱 [Web](./web.md)。

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

應用程式會在你的 Mac 上以 iPhone 大小的視窗（390×844 點）開啟。這是最快看到應用程式在手機上呈現效果的方法：無需啟動模擬器。它與 iOS 一樣使用 UIKit，因此除了以滑鼠滾輪捲動等 Mac 專有行為外，你所見的就是 iPhone 所顯示的。如要看 Mac 應用程式本身，請使用 `--target macos`。

<a id="edit-it"></a>

### 編輯

讓 `nsh run` 保持運行，然後修改按鈕的標籤：

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

儲存。Rust 應用程式會重新建置並以新標籤重啟；計數會重新開始。TSX 應用程式則會獲得熱更新：CLI 會重新建置並傳送修補，宿主會再次運行有改動的模組，並只重新渲染程式碼有改動的元件。在這裏就是擁有 `count` signal 的 `App`，所以計數同樣會重新開始。

UI 的部分可以拆成自己的元件，或回傳元素的普通函式：

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

在 TSX 中，當你編輯一個並不擁有狀態的元件時，狀態會保留：點按幾下，然後修改 `TapButton` 的顏色，按鈕會更新而計數維持不變。熱替換以頂層元件為單位：即名稱以大寫開頭、函式主體含有 JSX 的函式。當元件自己的程式碼改動，或模組中元件以外的程式碼改動（它所用的常數、輔助函式）時，該元件會重新渲染。如果某個改動無法就地套用（例如它匯入了運行中的應用程式尚未匯入的 NSH 模組，或改變了 `nsh.json` 的功能），宿主會重新載入整個應用程式。

<a id="errors"></a>

#### 錯誤

Rust 編譯錯誤會連同 cargo 的輸出一併印在終端機中，下次儲存時 `nsh run` 會再次建置。TSX 建置錯誤會印在終端機中，並在裝置上以紅色覆蓋層顯示檔案、行和列；應用程式會繼續運行上一次成功的建置。下一次建置成功後覆蓋層便會消失（也可點按它提早關閉）。運行時拋出的例外會以同樣方式顯示，其堆疊會對應回你的 `.tsx` 原始碼。

<a id="host-it-in-your-app"></a>

## 在你的應用程式中託管

原生應用程式會在自己的檢視中顯示 NSH：iOS 上是 `NshAppView`（一個 `UIView`），Android 上是 `NshView`（一個 Android `View`），macOS、Windows、Linux 和 GPUI 應用程式中則是 `AppView`。你可以像放置其他檢視一樣，把它放在任何畫面上，數量不限。

Rust 根元件屬於應用程式建置的一部分：應用程式會連結你的 crate，並以 `AppSource::Rust` 將根元件掛載到 macOS、Windows、Linux、GPUI 和 iOS 的 `AppView` 上（[使用 Rust 建置](./rust.md#an-app-written-in-rust)）。TSX 應用程式則是檢視載入的模組：開發期間從開發伺服器載入，正式版本則從已建置的 bundle 或下載的已簽署套件載入。以下各節載入的是 TSX 模組。

### iOS

在 Debug 中連結 `NativeShellDev.xcframework`，在 Release 中連結 `NativeShell.xcframework`（[嵌入 iOS 應用程式](./ios.md)），然後：

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

`nsh dev my-app` 會將模組提供給應用程式，並在每次儲存時推送，與 `nsh run` 對自己的宿主所做的一樣。對於正式版本，`nsh build my-app --release --out MyApp/nsh` 會將 bundle 寫入一個資料夾，你再把它加入應用程式的資源中。

### Android

除錯建置請加入 `nsh-dev.aar`，正式建置請加入 `nsh.aar`（[嵌入 Android 應用程式](./android.md)），然後：

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

### macOS、Windows 和 Linux

以 Rust 編寫的桌面應用程式使用 `AppView` 嵌入 NSH，來自 `nsh-platform-macos`、`nsh-platform-windows`、`nsh-platform-linux` 和 `nsh-platform-gpui` 這些 crate：可以是 `NSView`、子視窗、GTK widget 或 GPUI 檢視，用來掛載 Rust 根元件或載入已建置的 bundle。請參閱 [macOS](./macos.md#embedding-in-a-mac-app)、[Windows](./windows.md#embedding-in-a-win32-app)、[Linux](./linux.md#embedding-in-a-gtk-app) 和 [GPUI](./gpui.md)，以及並列比較所有宿主的[平台](./platforms.md#embed-in-a-native-app)。

<a id="what-the-module-may-do"></a>

### 模組可以做甚麼

在 iOS 和 Android 上，宿主會在載入前決定模組可以做甚麼：`grantCapabilities` 設定它可存取的網絡主機和其他功能，而限制則會為其記憶體、呼叫時間和節點數目設定上限（[沙盒與功能](./sandbox-and-capabilities.md)）。如要為模組提供你自己的原生檢視（地圖、圖表、設計系統元件），請將它們註冊為[原生元件](./native-components.md)。

<a id="ship-updates-as-signed-packages"></a>

## 以已簽署套件發佈更新

應用程式在發佈後下載的 TSX 模組會以已簽署套件的形式提供。先建立一次根金鑰並離線保管，用它認證一把發佈金鑰，然後發佈：

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

應用程式信任根金鑰的公開金鑰並載入所下載的內容；在運行任何東西之前，NSH 會驗證簽署、憑證和撤銷清單：

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android 的流程相同，使用 `NshTrust` 和 `NshPackage`。託管、派發和撤銷的詳情：[已簽署套件](./signed-packages.md)。
<a id="or-ship-it-as-a-standalone-app"></a>

## 或者作為獨立應用程式發佈

`nsh package` 可建置可安裝的應用程式（Rust 或 TSX 皆可），無需自行維護 Xcode 專案或 Gradle 建置：

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Rust 應用程式會連同專屬的 runner 一併打包，該 runner 由你的 crate 與 NSH 的 crates 建置而成，並掛載其根元件；TSX 應用程式則使用預先建置好的 runtime。選項、簽署與圖示請參閱 [Packaging](./packaging.md)。

<a id="try-it-in-the-terminal"></a>

## 在終端機中試用

`nsh test` 以 headless 模式執行應用程式，無需裝置或視窗。只要提供 Rust 應用程式的 `nsh.json` 或 TSX 應用程式的入口，它就會開啟該應用程式、讓其執行，並輸出其掛載的內容；加上 `--trace` 後，還會輸出原生檢視操作，以及每次 commit 所花的時間（[Testing](./testing-and-trace.md)）：

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

如果提供的是目錄，則會執行該應用程式的測試：每個範本的 `App.test.tsx` 會開啟應用程式、按下其按鈕，並檢查所顯示的內容（`nsh test my-app`）。Rust 應用程式的測試會開啟其根元件（`open(".")`）；亦可使用 `nsh_testing::Headless` 在 `cargo test` 中進行測試（[Building with Rust](./rust.md#testing)）。

<a id="next-steps"></a>

## 後續步驟

- [Building with Rust](./rust.md)：Rust 應用程式、其主題，以及建基於 Rust crate 之上的 TSX。
- [JSX and components](./jsx-and-components.md) 與 [Reactivity](./reactivity.md)：元件與 signals，涵蓋 Rust 與 TSX。
- [Platforms](./platforms.md)：各平台支援的功能，以及各自的專頁（[iOS](./ios.md)、[Android](./android.md)、[macOS](./macos.md)、[Windows](./windows.md)、[Linux](./linux.md)）。
- [Signed packages](./signed-packages.md) 與 [Sandbox and capabilities](./sandbox-and-capabilities.md)：交付方式，以及模組可執行的操作。
- [Project structure](./project-structure.md)：`nsh.json` 中應放置的內容、資產與檔案。
