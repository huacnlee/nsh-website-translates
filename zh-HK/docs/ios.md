---
title: "iOS"
description: "在 iOS 上以 UIKit 視圖執行 Rust 與 TSX 的 NSH 應用程式,可在模擬器或實機上運行,將其封裝為 .app 與 .ipa,並透過 AppView 或 NativeShell.xcframework 的 NshAppView 嵌入現有的 iOS 應用程式。"
order: 11
group: platforms
---

# iOS

NSH 應用程式可在 iOS 上執行,使用 UIKit 視圖與 CoreText 文字,支援實機與模擬器,最低需 iOS 15.0。完整的應用程式在執行與封裝上與其他平台相同;既有的應用程式也可以在自己的視圖中顯示 NSH 應用程式,可以是它所連結的 Rust 根元件,或是它所載入的 TSX,包括它所下載的已簽署套件,並受其所設定的限制與權限約束。在 iOS 上,`os()` 為 `Os::Ios`(TSX 中 `platform.os` 為 `"ios"`),且適用 TSX 的 `ios={{…}}` props。

## Requirements

- Mac 上的 **Xcode**,並包含 iOS 模擬器執行環境(`xcodebuild -downloadPlatform iOS` 會安裝一個)。請參閱
  [Installation](./installation.md#ios-and-mac-catalyst)。
- 應用程式需要 **iOS 15.0** 或更新版本,支援 iPhone 與 iPad。

## Running an app

Rust 應用程式在其目錄中執行,TSX 應用程式則指定其進入點:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` 會使用已啟動的模擬器,或啟動最新的 iPhone。對於 Rust 應用程式,它會以你的 crate 建置應用程式專屬的 runner、安裝並在終端機中顯示其日誌;crate 的 Rust 程式碼一有變更,就會重新建置並重新啟動應用程式。對於 TSX 應用程式,它會安裝開發用 host,並在你儲存時讓應用程式保持最新,日誌同樣顯示在終端機中。`--device` 可依名稱或 UDID 選擇模擬器。若想在不使用模擬器的情況下獲得更快的開發循環,可在 Mac 上使用 `nsh run --target catalyst`,它會在 iPhone 大小的 [Mac Catalyst](./getting-started.md#mac-catalyst) 視窗中開啟相同的 UIKit 後端。

## Packaging

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

在 Rust 應用程式的目錄中,應用程式就是以你的 crate 建置的 iOS runner;TSX 應用程式則指定其進入點(`nsh package App.tsx --target ios-simulator --run`)。

`--target ios` 會寫出已簽署的 `.ipa`,可用於實機、TestFlight 或 App Store。簽署身分、佈建描述檔與圖示請參閱:[Packaging](./packaging.md#ios-devices)。

## Embedding in an iOS app

既有的 iOS 應用程式可以在自己的 UI 中顯示 NSH 應用程式。含有 Rust 程式碼的 iOS 應用程式會連結你的 crate 與 `nsh-platform-ios` crate,並在 `AppView` 中顯示你的根元件([Embedding a Rust app](#embedding-a-rust-app))。Swift 應用程式則連結 `NativeShell.xcframework`,這是一個含有 Swift 模組的 framework:你建立一個 `NshAppView`(即 `UIView`),將它加到視圖階層中的任何位置,並將 TSX 應用程式或已簽署的套件載入其中。你的原生畫面、導覽與 NSH 應用程式並存於同一個 UIKit 階層中。

每個視圖都是一個獨立的引擎;沒有任何全域單例,因此一個應用程式可以同時顯示多個 NSH 應用程式,例如每個分頁各一個。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

## Embedding a Rust app

`nsh_platform_ios::AppView` 是一個引擎,作為 `UIView` 提供給以 Rust 建置的 iOS 應用程式:它會掛載你的 crate 的根元件,不涉及任何 JavaScript VM。

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

此視圖會隨其 superview 調整大小。`AppView::run` 會取代原先執行的內容;`AppView::load` 則改為執行 TSX bundle(`Bundle::source`,或以 `unsafe { Bundle::bytecode(bytes) }` 載入應用程式 bundle 中的 `bundle.nshc`)。`SurfaceOptions` 包含限制、已授予的權限、資料目錄與原生元件,如同下方 `NshAppView` 的成員;`AppView::set_locale`、`set_font_scale` 與 `set_error_handler` 分別對應 `locale`、`fontScale` 與 `onError`。`nsh package --target ios` 會為你建置這類應用程式,並掛載你的根元件。

## Get the framework

發行套件同時包含兩種變體:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

在 NSH 的 checkout 中,你可以只建置 frameworks:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

預設的建置會產生靜態 frameworks。若要建置動態 frameworks,請使用:

```sh
cargo xtask ios-embed --dynamic
```

動態 frameworks 讓 runtime 擁有自己的函式庫映像與 unwind table,以支援已連結其他 Rust runtime 的 host 應用程式。請依你所建置的 framework,選擇下方對應的 Xcode 內嵌設定。

預設情況下,每個 XCFramework 有三個 arm64 slice:iOS 裝置、iOS 模擬器(Apple silicon)與 Mac Catalyst。最低部署目標為 iOS 15.0。Swift 模組以 library evolution 編譯,因此以其他版本 Swift 編譯器建置的應用程式也能匯入它,且 framework 已連結其所需的一切:你不需要再加入其他東西。

## Add it to an Xcode project

1. 將 `NativeShell.xcframework`(開發建置則為 `NativeShellDev.xcframework`)拖曳到 app target 的 **Frameworks, Libraries, and Embedded Content**。預設的靜態 frameworks 請選擇 **Do Not Embed**,以 `--dynamic` 建置的動態 frameworks 則選擇 **Embed & Sign**。
2. 在 Swift 中,`import NativeShell`。
3. 在應用程式的 `Info.plist` 中,將 `CADisableMinimumFrameDurationOnPhone` 設為 `YES`:在支援 ProMotion 的 iPhone 上,應用程式的動畫便會以 120 Hz 播放,如同捲動一樣(由 `nsh package` 建置的應用程式已具備此設定)。

> [!TIP]
> 在 Debug 組態中連結 `NativeShellDev.xcframework`,在 Release 中連結 `NativeShell.xcframework`,如此只有開發建置才能連線到 dev server。

## Ship a bundle with the app

Swift 應用程式以 bundle 的形式發佈 TSX 應用程式。將 NSH 應用程式建置到一個資料夾,並將該資料夾以名為 `nsh` 的資料夾參照(folder reference)加入應用程式的資源:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` 會寫出:

| File | Contents |
|---|---|
| `bundle.nshc` | 編譯為 bytecode 的應用程式:載入速度最快。 |
| `bundle.js` | 同一個應用程式的 JS 原始碼。 |
| `bundle.js.map` | 其 source map(堆疊追蹤會指向你的 `.tsx` 檔案)。 |
| `capabilities.json` | 當 `nsh.json` 有宣告時,應用程式所宣告的[權限](./sandbox-and-capabilities.md)。 |
| `assets/` | 應用程式匯入的圖片與字型,以相對於進入點的路徑存放。 |

## Show the app

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

視圖的大小就是應用程式的視窗:NSH 會依視圖的 bounds 對應用程式進行版面配置,並在 bounds 變動時重新配置。再次載入會取代正在執行的應用程式;當視圖被釋放(deallocated)時,應用程式便會停止。

完整範例是一個在自己的原生標頭下方顯示 NSH 應用程式的 UIKit 應用程式,位於 `examples/embed-ios/main.swift`。

## `NshAppView`

`NshAppView` 是隔離在 main actor 上的 `UIView` 子類別。

| Member | Description |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | 建立視圖。`trace` 會記錄每次 commit 的時間。`init?(coder:)` 支援 storyboard 與 nib。 |
| `onError: ((String) -> Void)?` | 在主執行緒上接收應用程式的致命錯誤(bundle 載入失敗、未捕捉的 JS 例外、因限制而停止的 VM)。錯誤一律會記錄到日誌;開發建置還會將錯誤顯示在應用程式上方。 |
| `limits: NshLimits` | 從現在起載入的應用程式所適用的 VM 限制。 |
| `grantCapabilities(_ json: String?) throws` | 從現在起載入的應用程式最多可執行的操作,以 JSON 表示,格式同 `nsh.json` 的 `capabilities`;`nil` 會授予各應用程式所宣告的權限。JSON 無效時會拋出 `NshError`。 |
| `locale: Locale?` | 以應用程式的語言與地區取代使用者的設定:`Intl`、`locale()` 與各元件會立即跟隨,之後載入的應用程式也會以此啟動。`nil` 則跟隨系統設定。 |
| `fontScale: CGFloat?` | 以此文字大小取代 Dynamic Type 的設定(1 為預設值):文字與輸入框會依此重新配置,`fontScale()` 也會讀取它,立即生效,之後載入的應用程式亦同;長度維持原尺寸。`nil` 則跟隨系統設定。 |
| `setThemeOverrides(_ json: String?) throws` | host 的品牌樣式,覆蓋在應用程式的[主題](./tailwind.md#theme-tokens)之上:一個格式同 `nsh.json` 的 `"theme"` 的主題檔案。其中的 token 會優先於應用程式中同名的 token,淺色與深色模式皆然,應用程式其餘的 token 則保持不變。立即生效,之後載入的應用程式亦同;`nil` 會讓應用程式恢復使用自己的主題。若檔案無法解析則拋出 `NshError`。 |
| `storageDirectory: URL?` | 從現在起載入的應用程式存放其[儲存空間](../modules/nsh.md#storage)的位置;`nil`:`Library/Application Support/nsh/<app id>`,依應用程式自己的 id 區分。 |
| `cacheOptions: NshCacheOptions` | 從現在起載入的應用程式存放其快取與[其下載的圖片](./images-and-assets.md#kept-on-disk)的位置,以及每個應用程式保留的容量:`location` `.system`(`Library/Caches/nsh`,每個應用程式位於 `<app id>`)、`.directory(URL)` 或 `.off`;`images` `.default`(256 MB)、`.maxSize(megabytes:)` 或 `.off`。 |
| `loadBundle(at url: URL) throws` | 執行由 `nsh build` 寫出的 bundle。資源來自其旁的 `assets/`;其旁的 `bundle.js.map` 與 `capabilities.json` 也會被讀取。 |
| `run(_ package: NshPackage)` | 執行已驗證的已簽署套件(見下文)。套件只能執行一次。 |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | 在主執行緒之外驗證位於某個 URL 的套件,然後執行它。若被拒絕則拋出原因;正在執行的應用程式會保留。 |
| `connectDevServer(_ url: URL) throws` | 開發用:從 `nsh dev` 伺服器載入,並在每次變更時重新載入。對沒有開發支援的 `NativeShell.xcframework` 會拋出錯誤。 |
| `register(component:_:)` | 註冊一個[原生元件](./native-components.md)。 |
| `params: [String: Any]` | 從現在起載入的應用程式的啟動參數:應用程式在啟動時以 `host.params` 讀取([`host`](../modules/nsh.md#host))。 |
| `send(_ name: String, _ data: Any? = nil)` | 傳送一個事件給應用程式(`host.on(name, …)`);在應用程式開始監聽之前會先保留,若目前沒有任何應用程式在執行,則保留給下一個應用程式。 |
| `handle(_ name: String, _ handler:)` | 在主執行緒上處理應用程式對 `name` 的呼叫(`host.call`)與 post(`host.post`):`{ data, reply in … }`,或是一個 `async throws` 函式 `{ data in … }`,其結果會作為該呼叫的回應。 |
| `removeHandler(_ name: String)` | 移除 `name` 的處理常式:應用程式對它的呼叫會立即失敗。 |
| `static preferredStatusBarStyle`、`prefersStatusBarHidden`、`preferredStatusBarUpdateAnimation` | 正在執行的應用程式所要求的內容(其頁面與對話框的 `statusBar`,以及 `nsh.json` 的預設值):請從承載視圖的 view controller 的 override 中回傳它們。 |

> [!IMPORTANT]
> `bundle.nshc`(bytecode)只能從應用程式 bundle 內部載入。QuickJS 不會驗證 bytecode,因此來自其他位置的 bytecode 可能會破壞記憶體:對於應用程式 bundle 之外的檔案,請載入 `bundle.js`(JS 原始碼),或者更好的做法是使用[已簽署套件](./signed-packages.md)。

`limits`、`grantCapabilities`、`storageDirectory` 與 `cacheOptions` 從下一次載入起生效:請在 `loadBundle` / `run` 之前設定它們。

每個應用程式都會以自己的 id 保存其儲存空間,無需任何設定:已簽署套件使用其 release key 的憑證所擔保的 id,bundle 則使用其 `nsh.json` 的 `id`(其旁的 `app.json`,由 `nsh build` 寫出)。設定 `storageDirectory` 可將應用程式的資料保存在 host 所選擇的位置:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

## Talking to the app

視圖與其所執行的應用程式透過專屬的通道([`host`](../modules/nsh.md#host))溝通:包括應用程式在啟動時讀取的啟動參數、來自 host 應用程式的事件,以及來自應用程式的呼叫與 post,資料為 JSON(在這一端則是 Foundation 物件)。它不需要應用程式中的任何視圖,也不需要原生元件。

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

處理常式在主執行緒上執行;呼叫會在應用程式中等待其回應,而不會阻塞任何一方。若 reply 在未回應的情況下被釋放,該呼叫便會失敗,而對沒有處理常式的名稱發出的呼叫會立即失敗。應用程式尚未監聽的事件名稱,其事件會被保留到應用程式開始監聽為止;在沒有應用程式執行時(`loadBundle` 之前、重新載入期間)傳送的事件,會交給下一個應用程式,因此在應用程式啟動期間被點擊的通知仍然能送達它。

## Theme overrides

同一個應用程式嵌入多個不同品牌的 host 應用程式時,會採用各 host 的品牌樣式:host 以 `nsh.json` 的 `"theme"`(shadcn/ui 的 `cssVars`,值的寫法同 CSS)格式的主題檔案,提供其品牌所變更的 token。它們會優先於應用程式中同名的 token;應用程式其餘的 token 則保持不變。要為 token 指定深色模式的值,請放在 `dark` 之下(只放在 `light` 或 `theme` 之下的設定組,其顏色在兩種模式中皆相同):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

可在載入之前或之後呼叫:`bg-primary` 與 `rounded-(--radius)` 等類別會立即重新套用樣式,之後載入的每個應用程式,其第一個畫面就會帶有這些覆蓋設定。`setThemeOverrides(nil)` 會讓應用程式恢復使用自己的主題。

## Links the app opens

應用程式開啟的 URL([`openUrl`](../modules/nsh.md#openurl)、`TextView` 搭配 `links="open"` 的連結)會先在主執行緒上交給 `onOpenURL`:若 host 應用程式已處理該 URL(例如透過自己的 router 路由),請回傳 `true`;若要讓系統以 `UIApplication.open` 開啟,請回傳 `false`。沒有 `onOpenURL` 時,系統會開啟所有 URL。URL 會在應用程式的 `openUrl` 權限允許之後才會交給它。

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

## Limits

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| `NshLimits` field | Default | Meaning |
|---|---|---|
| `memoryMB: UInt32?` | 256 | JS heap,單位為 MB。用盡時應用程式會停止。 |
| `stackKB: UInt32?` | 4096(同時也是最大值) | 直譯器堆疊,單位為 KB。遞迴過深時會拋出 `RangeError`。 |
| `loadBudget: TimeInterval?` | 10 s | 評估 bundle 的時間。 |
| `callBudget: TimeInterval?` | 2 s | 其他任何進入 JS 的呼叫所用的時間(一次事件、一次計時器、一個影格)。逾時的呼叫會被中止。 |
| `maxNodes: UInt32?` | 200 000 | 應用程式可保留的節點數。 |

`nil` 會保留預設值。各項限制被觸及時的行為請參閱:[Sandbox and capabilities](./sandbox-and-capabilities.md)。

## Capabilities

應用程式在其 `nsh.json` 中宣告它可存取的內容;嵌入它的應用程式可以授予更少的權限。請求必須同時被雙方允許:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

此處應用程式不可設定狀態列(沒有 `statusBar`),即使其 `nsh.json` 要求這麼做。詳情請參閱:[Sandbox and capabilities](./sandbox-and-capabilities.md)。

## Signed packages

若要執行應用程式所下載的程式碼(更新、第三方 mini app),請使用[已簽署套件](./signed-packages.md):`nsh publish` 會寫出一個 `.nshpkg`,由你的 root key 所認證的 release key 簽署,應用程式會在執行前驗證它。

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

若要先驗證、稍後再執行,可將兩個步驟分開:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Description |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | 開啟或建立信任儲存區(trust store)。其狀態(最新的撤銷清單、每個應用程式已接受的最高 build)會保存在其中,套件的資源也會解壓縮到其下。在 `addRoot` 之前不信任任何 key。執行緒安全。 |
| `addRoot(_ publicKey: String) throws` | 信任一個 root 公開金鑰(base64,即 `.pub` 檔案的內容)。可以信任多個 root。 |
| `updateRevocations(_ json: String) throws` | 套用由 `nsh revoke` 寫出的撤銷清單,該清單須由受信任的 root 簽署,且比儲存區現有的清單更新。 |
| `openPackage(at: URL) async throws -> NshPackage` | 驗證、解壓縮資源並接受該套件(此後該應用程式較舊的 build 會被拒絕)。 |
| `NshPackage.info` | 其中應用程式的 `id`、`name`、`version`、`build`。 |
| `NshError` | 每個會拋出錯誤的呼叫所拋出的錯誤;`message` 會說明原因。 |
<a id="development"></a>

## 開發

使用 `NativeShellDev.xcframework` 時,請將檢視指向開發伺服器,而非套件:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

請在您的 Mac 上執行 `nsh dev App.tsx`。模擬器與 Mac 共用網路,因此 `127.0.0.1` 可連線至伺服器;實體裝置則使用 `nsh dev` 印出的區域網路位址(`devices on this network: ws://192.168.1.20:8790/ws`)。每次儲存都會就地更新應用程式,記錄會顯示在 `nsh dev` 終端機中,錯誤則會顯示在應用程式上方。請參閱[開發伺服器與除錯](./dev-server-and-debugging.md)。

> [!NOTE]
> 在實體裝置上,與 Mac 之間的連線屬於一般的區域網路流量,使用純 `ws://` 與 `http://`(資產)。
> iOS 可能會詢問使用者是否允許存取區域網路,且應用程式的 App Transport Security 設定必須允許此連線。

<a id="notes"></a>

## 注意事項

- **執行緒。** `NshAppView` 隔離於主 actor。`NshTrust`、`NshPackage` 與 `NshComponentContext` 為執行緒安全。
  JS 引擎在自己的執行緒上執行;主執行緒絕不會等待它。
- **狀態列。** 內嵌應用程式的頁面與對話框(`statusBar`)會改變 `NshAppView.preferredStatusBarStyle` 等方法的回傳值;
  代管的 view controller 必須轉發這些變更,如上方範例所示。
- **安全區域。** 應用程式在 Rust 中使用 `safe_area()`,在 TSX 中則照常於 padding 使用 `env(safe-area-inset-*)`,或使用來自 [`nsh`](../modules/nsh.md#safe-area-and-keyboard) 的 `safeAreaInsets()`。放置在您自己的標頭下方的 `NshAppView`,會取得適用於它自身的內縮距離,而非視窗的內縮距離。
- **Mac Catalyst。** 同一個框架也適用於 Catalyst 應用程式。

<a id="see-also"></a>

## 另請參閱

- [使用 Rust 建置](./rust.md)
- [內嵌於 Android 應用程式](./android.md)
- [原生元件](./native-components.md)
- [已簽署的套件](./signed-packages.md)
- [沙箱與權限](./sandbox-and-capabilities.md)
