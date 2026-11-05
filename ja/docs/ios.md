---
title: "iOS"
description: "Rust と TSX で書かれた NSH アプリを、UIKit ビューを使って iOS 上で実行します。シミュレータでも実機でも動作し、.app や .ipa としてパッケージ化できるほか、AppView または NativeShell.xcframework の NshAppView を使って既存の iOS アプリに組み込むこともできます。"
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---

# iOS

NSH アプリは iOS 上で、UIKit のビューと CoreText のテキストを使い、iOS 15.0 以降の実機とシミュレータで動作します。アプリ全体は他のプラットフォームと同じように実行・パッケージ化できます。既存のアプリは、リンクした Rust のルートや読み込んだ TSX(ダウンロードした署名付きパッケージを含む)を、自身が設定する制限と capabilities のもとで、独自のビューに NSH アプリとして表示できます。iOS では `os()` は `Os::Ios` です(TSX では `platform.os` は `"ios"`)。また、TSX の `ios={{…}}` props が適用されます。

<a id="requirements"></a>

## 要件

- Mac 上の **Xcode**。iOS シミュレータランタイムが必要です(`xcodebuild -downloadPlatform iOS` がインストールします)。[インストール](./installation.md#ios-and-mac-catalyst)を参照してください。
- アプリには **iOS 15.0** 以降が必要です(iPhone と iPad)。

<a id="running-an-app"></a>

## アプリの実行

Rust アプリはそのディレクトリから実行し、TSX アプリはエントリを指定します。

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` は、起動済みのシミュレータを使うか、最新の iPhone を起動します。Rust アプリの場合は、アプリ専用のランナーをあなたのクレートでビルドし、インストールして、ログをターミナルに表示します。クレートの Rust コードを変更すると、再ビルドしてアプリを再起動します。TSX アプリの場合は、開発用ホストをインストールし、保存するたびにアプリを最新の状態に保ち、ログをターミナルに表示します。`--device` は、名前または UDID でシミュレータを選びます。シミュレータを使わずに素早く開発したい場合は、Mac 上で `nsh run --target catalyst` を使うと、同じ UIKit バックエンドが iPhone サイズの [Mac Catalyst](./getting-started.md#mac-catalyst) ウィンドウで開きます。

<a id="packaging"></a>

## パッケージ化

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Rust アプリのディレクトリから実行すると、アプリはあなたのクレートでビルドされた iOS ランナーになります。TSX アプリではエントリを指定します(`nsh package App.tsx --target ios-simulator --run`)。

`--target ios` は、実機、TestFlight、App Store 向けに署名された `.ipa` を書き出します。署名 ID、プロビジョニングプロファイル、アイコンについては [パッケージ化](./packaging.md#ios-devices) を参照してください。

<a id="embedding-in-an-ios-app"></a>

## iOS アプリへの組み込み

既存の iOS アプリは、自身の UI の中に NSH アプリを表示できます。Rust コードを持つ iOS アプリは、あなたのクレートと `nsh-platform-ios` クレートをリンクし、ルートを `AppView` に表示します([Rust アプリの組み込み](#embedding-a-rust-app))。Swift アプリは、Swift モジュールを持つフレームワーク `NativeShell.xcframework` をリンクします。`NshAppView`(`UIView`)を作成してビュー階層の任意の場所に追加し、TSX アプリや署名付きパッケージを読み込みます。ネイティブの画面、ナビゲーション、NSH アプリは、1 つの UIKit 階層の中に共存します。

各ビューは独立した 1 つのエンジンです。グローバルなシングルトンはないため、たとえばタブごとに 1 つずつなど、複数の NSH アプリを同時に表示できます。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Rust アプリの組み込み

`nsh_platform_ios::AppView` は、Rust で作られた iOS アプリ向けの `UIView` としての 1 つのエンジンです。JavaScript VM を使わずに、クレートのルートコンポーネントをマウントします。

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

ビューはスーパービューに合わせてリサイズされます。`AppView::run` は、それまで動いていたものを置き換えます。`AppView::load` は代わりに TSX バンドルを実行します(`Bundle::source`、またはアプリバンドル内の `bundle.nshc` には `unsafe { Bundle::bytecode(bytes) }`)。`SurfaceOptions` は、以下の `NshAppView` のメンバーと同様に、制限、付与された capabilities、データディレクトリ、ネイティブコンポーネントを保持します。`AppView::set_locale`、`set_font_scale`、`set_error_handler` は、`locale`、`fontScale`、`onError` に対応します。`nsh package --target ios` は、ルートをマウントした状態で、この種のアプリをビルドします。

<a id="get-the-framework"></a>

## フレームワークの入手

配布物には両方のバリアントが含まれています。

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

NSH のチェックアウトからは、フレームワークだけをビルドできます。

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

デフォルトのビルドでは静的フレームワークが生成されます。動的フレームワークをビルドするには、次のようにします。

```sh
cargo xtask ios-embed --dynamic
```

動的フレームワークは、ランタイムに独自のライブラリイメージとアンワインドテーブルを与えるため、他の Rust ランタイムをすでにリンクしているホストアプリで利用できます。ビルドしたフレームワークに合わせて、後述の Xcode の埋め込み設定を選んでください。

デフォルトでは、各 XCFramework には 3 つの arm64 スライス(iOS 実機、iOS シミュレータ(Apple silicon)、Mac Catalyst)が含まれます。最小デプロイメントターゲットは iOS 15.0 です。Swift モジュールはライブラリ進化(library evolution)を有効にしてコンパイルされているため、他のバージョンの Swift コンパイラでビルドしたアプリからもインポートできます。また、フレームワークは必要なものをすべてリンクするため、追加で何かを加える必要はありません。

<a id="add-it-to-an-xcode-project"></a>

## Xcode プロジェクトへの追加

1. `NativeShell.xcframework`(開発ビルドの場合は `NativeShellDev.xcframework`)を、アプリターゲットの **Frameworks, Libraries, and Embedded Content** にドラッグします。デフォルトの静的フレームワークでは **Do Not Embed** を、`--dynamic` でビルドした動的フレームワークでは **Embed & Sign** を選びます。
2. Swift では、`import NativeShell`。
3. アプリの `Info.plist` で、`CADisableMinimumFrameDurationOnPhone` を `YES` に設定します。ProMotion 対応の iPhone では、スクロールと同様に、アプリのアニメーションも 120 Hz で動作するようになります(`nsh package` がビルドするアプリでは設定済みです)。

> [!TIP]
> Debug 構成では `NativeShellDev.xcframework` を、Release 構成では `NativeShell.xcframework` をリンクしてください。これにより、開発ビルドだけが開発サーバーに接続できます。

<a id="ship-a-bundle-with-the-app"></a>

## アプリにバンドルを同梱する

Swift アプリは、TSX アプリをバンドルとして同梱します。NSH アプリをフォルダにビルドし、そのフォルダを `nsh` という名前のフォルダ参照としてアプリのリソースに追加します。

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` は次のファイルを書き出します。

| ファイル | 内容 |
|---|---|
| `bundle.nshc` | バイトコードにコンパイルされたアプリ。最も高速に読み込めます。 |
| `bundle.js` | JS ソースとしての同じアプリ。 |
| `bundle.js.map` | ソースマップ(スタックトレースは `.tsx` ファイルを指します)。 |
| `capabilities.json` | `nsh.json` に宣言がある場合に、アプリが宣言する [capabilities](./sandbox-and-capabilities.md)。 |
| `assets/` | アプリがインポートする画像とフォント。エントリからの相対パスに置かれます。 |

<a id="show-the-app"></a>

## アプリの表示

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

ビューのサイズがアプリのウィンドウになります。NSH はアプリをビューの bounds でレイアウトし、bounds が変わるたびに再度レイアウトします。再度読み込むと、実行中のアプリが置き換えられます。アプリはビューが解放されると停止します。

完全なサンプルである、独自のネイティブヘッダーの下に NSH アプリを表示する UIKit アプリは `examples/embed-ios/main.swift` にあります。

## `NshAppView`

`NshAppView` は、メインアクターに隔離された `UIView` のサブクラスです。

| メンバー | 説明 |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | ビューを作成します。`trace` は、すべてのコミットの時間をログに出力します。`init?(coder:)` は storyboard と nib をサポートします。 |
| `onError: ((String) -> Void)?` | アプリの致命的なエラー(読み込みに失敗したバンドル、捕捉されなかった JS 例外、制限により停止した VM)をメインスレッドで受け取ります。エラーは常にログに出力され、開発ビルドではアプリの上にも表示されます。 |
| `limits: NshLimits` | これ以降に読み込まれるアプリの VM の制限。 |
| `grantCapabilities(_ json: String?) throws` | これ以降に読み込まれるアプリが行える最大限の範囲。`nsh.json` の `capabilities` の形式の JSON で指定します。`nil` は各アプリが宣言したものを付与します。無効な JSON に対して `NshError` をスローします。 |
| `locale: Locale?` | ユーザーの設定の代わりに使う、アプリの言語と地域。`Intl`、`locale()` とコンポーネントは直ちにこれに従い、後から読み込まれるアプリもこれで開始します。`nil` はシステムの設定に従います。 |
| `fontScale: CGFloat?` | Dynamic Type の代わりに使うテキストサイズ(1 がデフォルト)。テキストと入力欄はこのサイズで再レイアウトされ、`fontScale()` もこれを読み取ります。直ちに反映され、後から読み込まれるアプリにも適用されます。長さのサイズは変わりません。`nil` はシステムの設定に従います。 |
| `setThemeOverrides(_ json: String?) throws` | アプリの[テーマ](./tailwind.md#theme-tokens)に重ねるホストのブランド。`nsh.json` の `"theme"` の形式のテーマファイルです。そのトークンは、ライトモードとダークモードの両方で、同じ名前のアプリのトークンより優先され、アプリのその他のトークンはそのまま残ります。直ちに、また後から読み込まれるアプリにも適用されます。`nil` はアプリ自身のテーマに戻します。解析できないファイルに対して `NshError` をスローします。 |
| `storageDirectory: URL?` | これ以降に読み込まれるアプリが[ストレージ](../modules/nsh.md#storage)を保持する場所。`nil`: `Library/Application Support/nsh/<app id>`、アプリ自身の id ごと。 |
| `cacheOptions: NshCacheOptions` | これ以降に読み込まれるアプリがキャッシュと[ダウンロードした画像](./images-and-assets.md#kept-on-disk)を保持する場所と、それぞれが保持する量。`location` `.system`(`Library/Caches/nsh`、各アプリは `<app id>`)、`.directory(URL)` または `.off`。`images` `.default`(256 MB)、`.maxSize(megabytes:)` または `.off`。 |
| `loadBundle(at url: URL) throws` | `nsh build` が書き出したバンドルを実行します。アセットはその隣の `assets/` から取得され、隣にある `bundle.js.map` と `capabilities.json` も読み込まれます。 |
| `run(_ package: NshPackage)` | 検証済みの署名付きパッケージを実行します(後述)。パッケージは一度だけ実行されます。 |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | URL のパッケージをメインスレッド外で検証してから実行します。拒否された理由とともにスローします。実行中のアプリはそのまま残ります。 |
| `connectDevServer(_ url: URL) throws` | 開発用: `nsh dev` サーバーから読み込み、変更のたびにリロードします。開発サポートのない `NativeShell.xcframework` では、スローします。 |
| `register(component:_:)` | [ネイティブコンポーネント](./native-components.md)を登録します。 |
| `params: [String: Any]` | これ以降に読み込まれるアプリの起動パラメータ。アプリは開始時に `host.params` として読み取ります([`host`](../modules/nsh.md#host))。 |
| `send(_ name: String, _ data: Any? = nil)` | アプリにイベントを送ります(`host.on(name, …)`)。アプリがリッスンするまで、また実行中のアプリがない間は次のアプリのために保持されます。 |
| `handle(_ name: String, _ handler:)` | アプリの呼び出し(`host.call`)と、`name` のポスト(`host.post`)をメインスレッドで処理します。`{ data, reply in … }`、または結果が呼び出しへの応答となる `async throws` 関数 `{ data in … }` です。 |
| `removeHandler(_ name: String)` | `name` のハンドラーを削除します。アプリからのその呼び出しは直ちに失敗します。 |
| `static preferredStatusBarStyle`、`prefersStatusBarHidden`、`preferredStatusBarUpdateAnimation` | 実行中のアプリが要求したもの(ページとダイアログの `statusBar`、`nsh.json` のデフォルト)。ホスティングするビューコントローラーのオーバーライドから返してください。 |

> [!IMPORTANT]
> `bundle.nshc`(バイトコード)は、アプリバンドルの内側からのみ読み込まれます。QuickJS はバイトコードを検証しないため、それ以外の場所のバイトコードはメモリを破壊する可能性があります。アプリバンドル外のファイルには `bundle.js`(JS ソース)を読み込むか、より望ましくは[署名付きパッケージ](./signed-packages.md)を使ってください。

`limits`、`grantCapabilities`、`storageDirectory`、`cacheOptions` は次回の読み込みから適用されます。`loadBundle` / `run` の前に設定してください。

各アプリは、設定なしで自身の id のもとにストレージを保持します。署名付きパッケージは、そのリリースキーの証明書が保証する id のもとに、バンドルは `nsh.json` の `id`(隣にある `app.json`、`nsh build` が書き出します)のもとに保持されます。ホストが選んだ場所にアプリのデータを保持するには、`storageDirectory` を設定します。

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## アプリとの通信

ビューとそこで動くアプリは、専用のチャネル([`host`](../modules/nsh.md#host))を通じて通信します。アプリが開始時に読み取る起動パラメータ、ホストアプリからのイベント、アプリからの呼び出しとポストを、JSON データ(こちら側では Foundation オブジェクト)でやり取りします。アプリ内にビューもネイティブコンポーネントも必要ありません。

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

ハンドラーはメインスレッドで実行されます。呼び出しは、どちら側もブロックせずに、アプリ内で応答を待ちます。応答されないまま解放された reply は、呼び出しを失敗させます。ハンドラーのない名前の呼び出しは直ちに失敗します。アプリがまだリッスンしていない名前のイベントは、リッスンするまで保持されます。アプリが実行されていない間(`loadBundle` の前、リロード中)に送られたイベントは次のアプリに渡されるため、アプリの起動中にタップされた通知もアプリに届きます。

<a id="theme-overrides"></a>

## テーマのオーバーライド

複数のブランド付きホストアプリに組み込まれた 1 つのアプリは、各ホストのブランドを取り込みます。ホストは、ブランドが変更するトークンを、`nsh.json` の `"theme"`(shadcn/ui の `cssVars`、値は CSS の書き方)の形式のテーマファイルとして渡します。これらは、同じ名前のアプリのトークンより優先され、アプリのその他のトークンはそのまま残ります。トークンのダークモード用の値は `dark` の下に指定します(`light` または `theme` の下にだけ設定した場合は、その色がライトモードとダークモードの両方で使われます)。

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

読み込みの前でも後でも呼び出せます。`bg-primary` や `rounded-(--radius)` などのクラスは直ちにスタイルが更新され、後から読み込まれるすべてのアプリは、最初のフレームからオーバーライドが適用された状態で開始します。`setThemeOverrides(nil)` はアプリ自身のテーマに戻します。

<a id="links-the-app-opens"></a>

## アプリが開くリンク

アプリが開く URL([`openUrl`](../modules/nsh.md#openurl)、`TextView` の `links="open"` 付きリンク)は、まずメインスレッドで `onOpenURL` に渡されます。ホストアプリが URL を処理した場合(たとえば独自のルーターに渡した場合)は `true` を返し、システムに `UIApplication.open` で開かせる場合は `false` を返します。`onOpenURL` がなければ、システムがすべての URL を開きます。URL は、アプリの `openUrl` capability が許可した後に、ここへ渡されます。

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

<a id="limits"></a>

## 制限

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| `NshLimits` のフィールド | デフォルト | 意味 |
|---|---|---|
| `memoryMB: UInt32?` | 256 | JS ヒープ(MB)。使い切るとアプリが停止します。 |
| `stackKB: UInt32?` | 4096(最大値でもあります) | インタープリターのスタック(KB)。これより深い再帰は `RangeError` をスローします。 |
| `loadBudget: TimeInterval?` | 10 秒 | バンドルの評価にかかる時間。 |
| `callBudget: TimeInterval?` | 2 秒 | JS へのその他の呼び出し(1 つのイベント、1 つのタイマー、1 フレーム)にかかる時間。超過した呼び出しは打ち切られます。 |
| `maxNodes: UInt32?` | 200 000 | アプリが保持できるノード数。 |

`nil` はデフォルトのままにします。各制限に達したときの動作については、[サンドボックスと capabilities](./sandbox-and-capabilities.md) を参照してください。

## Capabilities

アプリは、アクセスできるものを `nsh.json` で宣言し、組み込み側のアプリはそれより少なく付与できます。リクエストは両方に許可されている必要があります。

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

この例では、アプリの `nsh.json` が要求していても、アプリはステータスバーを設定できません(`statusBar` がないため)。詳細は [サンドボックスと capabilities](./sandbox-and-capabilities.md) を参照してください。

<a id="signed-packages"></a>

## 署名付きパッケージ

アプリがダウンロードするコード(アップデート、サードパーティのミニアプリ)を実行するには、[署名付きパッケージ](./signed-packages.md)を使います。`nsh publish` は、ルートキーが証明したリリースキーで署名された `.nshpkg` を書き出し、アプリは実行する前にそれを検証します。

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

先に検証して後で実行するには、2 つのステップに分けます。

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | 説明 |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | トラストストアを開くか作成します。その状態(最新の失効リスト、アプリごとに受け入れた最高のビルド)はここに保存され、パッケージのアセットもその下に展開されます。`addRoot` するまで、どのキーも信頼しません。スレッドセーフです。 |
| `addRoot(_ publicKey: String) throws` | ルート公開鍵(base64、`.pub` ファイルの内容)を信頼します。複数のルートを信頼できます。 |
| `updateRevocations(_ json: String) throws` | `nsh revoke` が書き出した失効リストを適用します。信頼されたルートによる署名があり、ストアが持つものより新しいものが対象です。 |
| `openPackage(at: URL) async throws -> NshPackage` | 検証し、アセットを展開して、パッケージを受け入れます(そのアプリの古いビルドは、以降拒否されます)。 |
| `NshPackage.info` | 内部のアプリの `id`、`name`、`version`、`build`。 |
| `NshError` | スローするすべての呼び出しがスローするエラー。`message` が理由を示します。 |
<a id="development"></a>

## 開発

`NativeShellDev.xcframework` を使って、ビューをバンドルではなく開発サーバーに向けます。

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Mac 上で `nsh dev App.tsx` を実行します。シミュレータは Mac のネットワークを共有するため、`127.0.0.1` からサーバーにアクセスできます。実機の場合は、`nsh dev` が表示する LAN アドレス（`devices on this network: ws://192.168.1.20:8790/ws`）を使用します。保存するたびにアプリがその場で更新され、ログは `nsh dev` のターミナルに表示され、エラーはアプリ上に表示されます。[開発サーバーとデバッグ](./dev-server-and-debugging.md)を参照してください。

> [!NOTE]
> 実機では、Mac への接続は、プレーンな `ws://` と `http://`（アセット）による通常のローカルネットワーク通信です。
> iOS がユーザーにローカルネットワークへのアクセス許可を求める場合があり、アプリの App Transport Security の設定でこれを許可する必要があります。

<a id="notes"></a>

## 注意事項

- **スレッド。** `NshAppView` はメインアクターに隔離されています。`NshTrust`、`NshPackage`、`NshComponentContext` はスレッドセーフです。JS エンジンは専用のスレッドで動作し、メインスレッドがその完了を待つことはありません。
- **ステータスバー。** 埋め込まれたアプリのページやダイアログ（`statusBar`）によって、`NshAppView.preferredStatusBarStyle` などが返す値が変わります。上記の例のように、ホスティングする view controller がそれらを転送する必要があります。
- **セーフエリア。** アプリでは、Rust では `safe_area()` を、TSX では padding に `env(safe-area-inset-*)` を、または [`nsh`](../modules/nsh.md#safe-area-and-keyboard) の `safeAreaInsets()` を、通常どおり使用します。独自のヘッダーの下に配置した `NshAppView` には、ウィンドウのインセットではなく、その位置に適用されるインセットが渡されます。
- **Mac Catalyst。** 同じフレームワークが Catalyst アプリでも動作します。

<a id="see-also"></a>

## 関連項目

- [Rust でのビルド](./rust.md)
- [Android アプリへの組み込み](./android.md)
- [ネイティブコンポーネント](./native-components.md)
- [署名付きパッケージ](./signed-packages.md)
- [サンドボックスと capability](./sandbox-and-capabilities.md)
