---
title: "iOS"
description: "Rust와 TSX로 작성한 NSH 앱을 UIKit 뷰로 iOS 시뮬레이터나 실기기에서 실행하고, .app 및 .ipa로 패키징하며, AppView 또는 NativeShell.xcframework의 NshAppView를 사용해 기존 iOS 앱에 임베드하세요."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---

# iOS

NSH 앱은 iOS 15.0부터 기기와 시뮬레이터에서 UIKit 뷰와 CoreText 텍스트로 실행됩니다. 앱 전체는 다른 플랫폼과 동일하게 실행되고 패키징됩니다. 기존 앱은 자체 뷰 안에 NSH 앱을 표시할 수 있으며, 링크한 Rust 루트, 로드하는 TSX, 다운로드한 서명된 패키지가 모두 가능합니다. 이때 앱이 설정한 제한과 capability가 적용됩니다. iOS에서 `os()`은(는) `Os::Ios`이며(TSX에서 `platform.os`은(는) `"ios"`), TSX의 `ios={{…}}` props가 적용됩니다.

<a id="requirements"></a>

## 요구 사항

- Mac의 **Xcode**와 iOS 시뮬레이터 런타임(`xcodebuild -downloadPlatform iOS`이(가) 하나를 설치합니다). [설치](./installation.md#ios-and-mac-catalyst)를 참고하세요.
- 앱은 iPhone과 iPad에서 **iOS 15.0** 이상이 필요합니다.

<a id="running-an-app"></a>

## 앱 실행

Rust 앱은 해당 디렉터리에서 실행하고, TSX 앱은 진입점을 지정합니다.

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh`은(는) 부팅된 시뮬레이터를 사용하거나, 없으면 가장 최신 iPhone을 부팅합니다. Rust 앱의 경우 사용자의 crate로 앱 자체 러너를 빌드하고 설치한 뒤 터미널에 로그를 표시합니다. crate의 Rust 코드를 변경하면 다시 빌드하고 앱을 재시작합니다. TSX 앱의 경우 개발 호스트를 설치하고, 저장할 때마다 앱을 최신 상태로 유지하며 터미널에 로그를 표시합니다. `--device`은(는) 이름이나 UDID로 시뮬레이터를 선택합니다. 시뮬레이터 없이 더 빠르게 반복하려면 Mac에서 `nsh run --target catalyst`을(를) 사용하세요. 동일한 UIKit 백엔드가 iPhone 크기의 [Mac Catalyst](./getting-started.md#mac-catalyst) 창에서 열립니다.

<a id="packaging"></a>

## 패키징

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Rust 앱의 디렉터리에서 실행하면 앱은 사용자의 crate로 빌드한 iOS 러너입니다. TSX 앱은 진입점을 지정합니다(`nsh package App.tsx --target ios-simulator --run`).

`--target ios`은(는) 기기, TestFlight 또는 App Store용으로 서명된 `.ipa`을(를) 생성합니다. 서명 ID, 프로비저닝 프로파일, 아이콘은 [패키징](./packaging.md#ios-devices)을 참고하세요.

<a id="embedding-in-an-ios-app"></a>

## iOS 앱에 임베딩

기존 iOS 앱은 자체 UI 안에 NSH 앱을 표시할 수 있습니다. Rust 코드가 있는 iOS 앱은 사용자의 crate와 `nsh-platform-ios` crate를 링크하고 `AppView`에 루트를 표시합니다([Rust 앱 임베딩](#embedding-a-rust-app)). Swift 앱은 Swift 모듈이 있는 프레임워크인 `NativeShell.xcframework`을(를) 링크합니다. `NshAppView`(`UIView`)을(를) 만들어 뷰 계층의 원하는 위치에 추가하고, TSX 앱이나 서명된 패키지를 로드합니다. 네이티브 화면, 내비게이션, NSH 앱이 하나의 UIKit 계층에서 함께 존재합니다.

각 뷰는 독립된 엔진 하나입니다. 전역 싱글턴이 없으므로 한 앱에서 여러 NSH 앱을 동시에 표시할 수 있습니다. 예를 들어 탭마다 하나씩 표시할 수 있습니다.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Rust 앱 임베딩

`nsh_platform_ios::AppView`은(는) Rust로 빌드한 iOS 앱을 위한 `UIView` 형태의 엔진 하나입니다. JavaScript VM 없이 crate의 루트 컴포넌트를 마운트합니다.

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

뷰는 상위 뷰와 함께 크기가 조정됩니다. `AppView::run`은(는) 실행 중이던 것을 대체하고, `AppView::load`은(는) 대신 TSX 번들을 실행합니다(`Bundle::source`, 또는 앱 번들 안의 `bundle.nshc`에 대해서는 `unsafe { Bundle::bytecode(bytes) }`). `SurfaceOptions`은(는) 아래 `NshAppView`의 멤버와 마찬가지로 제한, 부여된 capability, 데이터 디렉터리, 네이티브 컴포넌트를 가집니다. `AppView::set_locale`, `set_font_scale`, `set_error_handler`은(는) 각각 `locale`, `fontScale`, `onError`과(와) 대응합니다. `nsh package --target ios`은(는) 사용자의 루트를 마운트한 이러한 종류의 앱을 대신 빌드해 줍니다.

<a id="get-the-framework"></a>

## 프레임워크 가져오기

배포판에는 두 가지 변형이 모두 들어 있습니다.

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

NSH 체크아웃에서 프레임워크만 빌드할 수도 있습니다.

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

기본 빌드는 정적 프레임워크를 생성합니다. 동적 프레임워크를 빌드하려면 다음을 사용하세요.

```sh
cargo xtask ios-embed --dynamic
```

동적 프레임워크는 런타임에 고유한 라이브러리 이미지와 언와인드 테이블을 제공하므로, 이미 다른 Rust 런타임을 링크하는 호스트 앱을 지원합니다. 빌드한 프레임워크에 맞게 아래의 Xcode 임베딩 설정을 선택하세요.

기본적으로 각 XCFramework에는 arm64 슬라이스가 세 개 있습니다. iOS 기기, iOS 시뮬레이터(Apple silicon), Mac Catalyst용입니다. 최소 배포 대상은 iOS 15.0입니다. Swift 모듈은 라이브러리 에볼루션으로 컴파일되므로 다른 Swift 컴파일러 버전으로 빌드한 앱도 import할 수 있고, 프레임워크가 필요한 모든 것을 링크하므로 추가로 넣을 것은 없습니다.

<a id="add-it-to-an-xcode-project"></a>

## Xcode 프로젝트에 추가

1. `NativeShell.xcframework`(개발 빌드의 경우 `NativeShellDev.xcframework`)을(를) 앱 타겟의 **Frameworks, Libraries, and Embedded Content**로 드래그합니다. 기본 정적 프레임워크에는 **Do Not Embed**를, `--dynamic`(으)로 빌드한 동적 프레임워크에는 **Embed & Sign**을 선택합니다.
2. Swift에서 `import NativeShell`.
3. 앱의 `Info.plist`에서 `CADisableMinimumFrameDurationOnPhone`을(를) `YES`(으)로 설정합니다. 그러면 ProMotion iPhone에서 스크롤과 마찬가지로 앱의 애니메이션도 120 Hz로 움직입니다(`nsh package`(으)로 빌드한 앱에는 이미 설정되어 있습니다).

> [!TIP]
> Debug 구성에서는 `NativeShellDev.xcframework`을(를), Release에서는 `NativeShell.xcframework`을(를) 링크하세요. 그러면 개발 빌드만 개발 서버에 연결할 수 있습니다.

<a id="ship-a-bundle-with-the-app"></a>

## 앱과 함께 번들 배포

Swift 앱은 TSX 앱을 번들로 배포합니다. NSH 앱을 폴더로 빌드하고, 그 폴더를 `nsh`(이)라는 이름의 폴더 참조로 앱 리소스에 추가합니다.

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build`은(는) 다음을 생성합니다.

| 파일 | 내용 |
|---|---|
| `bundle.nshc` | 바이트코드로 컴파일된 앱입니다. 로드가 가장 빠릅니다. |
| `bundle.js` | JS 소스로 된 동일한 앱입니다. |
| `bundle.js.map` | 소스 맵입니다(스택 트레이스가 사용자의 `.tsx` 파일을 가리킵니다). |
| `capabilities.json` | `nsh.json`에 선언이 있을 때 앱이 선언한 [capability](./sandbox-and-capabilities.md)입니다. |
| `assets/` | 앱이 import하는 이미지와 폰트이며, 진입점 기준 상대 경로에 위치합니다. |

<a id="show-the-app"></a>

## 앱 표시

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

뷰의 크기가 앱의 창입니다. NSH는 뷰의 bounds에 맞춰 앱을 레이아웃하고, bounds가 바뀔 때마다 다시 레이아웃합니다. 다시 로드하면 실행 중인 앱이 교체되며, 뷰가 해제되면 앱이 중지됩니다.

자체 네이티브 헤더 아래에 NSH 앱을 표시하는 UIKit 앱의 전체 샘플은 `examples/embed-ios/main.swift`입니다.

## `NshAppView`

`NshAppView`은(는) 메인 액터로 격리된 `UIView` 서브클래스입니다.

| 멤버 | 설명 |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | 뷰를 생성합니다. `trace`은(는) 모든 커밋의 시간을 로그로 남깁니다. `init?(coder:)`은(는) 스토리보드와 nib를 지원합니다. |
| `onError: ((String) -> Void)?` | 치명적인 앱 오류(로드에 실패한 번들, 처리되지 않은 JS 예외, 제한으로 중지된 VM)를 메인 스레드에서 받습니다. 오류는 항상 로그로 남으며, 개발 빌드에서는 앱 위에도 표시됩니다. |
| `limits: NshLimits` | 지금부터 로드되는 앱의 VM 제한입니다. |
| `grantCapabilities(_ json: String?) throws` | 지금부터 로드되는 앱이 할 수 있는 최대 범위이며, `nsh.json`의 `capabilities` 형식의 JSON입니다. `nil`은(는) 각 앱이 선언한 것을 부여합니다. 잘못된 JSON이면 `NshError`을(를) throw합니다. |
| `locale: Locale?` | 사용자의 언어와 지역 대신 사용할 앱의 언어와 지역입니다. `Intl`, `locale()` 및 컴포넌트가 즉시 이를 따르며, 이후에 로드되는 앱은 이 설정으로 시작합니다. `nil`은(는) 시스템 설정을 따릅니다. |
| `fontScale: CGFloat?` | Dynamic Type 대신 사용할 텍스트 크기입니다(1이 기본값). 텍스트와 입력 필드가 이 크기로 다시 레이아웃되고 `fontScale()`이(가) 이를 읽습니다. 즉시 적용되며 이후에 로드되는 앱에도 적용됩니다. 길이는 크기가 유지됩니다. `nil`은(는) 시스템 설정을 따릅니다. |
| `setThemeOverrides(_ json: String?) throws` | 앱의 [테마](./tailwind.md#theme-tokens) 위에 적용되는 호스트의 브랜드입니다. `nsh.json`의 `"theme"` 형식의 테마 파일입니다. 같은 이름의 토큰은 라이트 모드와 다크 모드 모두에서 앱의 토큰보다 우선하며, 앱의 나머지 토큰은 그대로 유지됩니다. 즉시 적용되고 이후에 로드되는 앱에도 적용됩니다. `nil`은(는) 앱에 고유 테마를 되돌려 줍니다. 파싱되지 않는 파일이면 `NshError`을(를) throw합니다. |
| `storageDirectory: URL?` | 지금부터 로드되는 앱이 [스토리지](../modules/nsh.md#storage)를 보관하는 위치입니다. `nil`: `Library/Application Support/nsh/<app id>`, 앱 자체 id별로 구분됩니다. |
| `cacheOptions: NshCacheOptions` | 지금부터 로드되는 앱이 캐시와 [다운로드한 이미지](./images-and-assets.md#kept-on-disk)를 보관하는 위치, 그리고 각 앱이 보관하는 용량입니다. `location` `.system`(`Library/Caches/nsh`, 각 앱은 `<app id>`), `.directory(URL)` 또는 `.off`. `images` `.default`(256 MB), `.maxSize(megabytes:)` 또는 `.off`. |
| `loadBundle(at url: URL) throws` | `nsh build`이(가) 생성한 번들을 실행합니다. 에셋은 번들 옆의 `assets/`에서 가져오며, 그 옆의 `bundle.js.map`과(와) `capabilities.json`도 읽습니다. |
| `run(_ package: NshPackage)` | 검증된 서명 패키지를 실행합니다(아래 참고). 패키지는 한 번만 실행됩니다. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | URL의 패키지를 메인 스레드 밖에서 검증한 뒤 실행합니다. 거부된 이유와 함께 throw하며, 실행 중인 앱은 유지됩니다. |
| `connectDevServer(_ url: URL) throws` | 개발용: `nsh dev` 서버에서 로드하고 변경될 때마다 다시 로드합니다. 개발 지원이 없는 `NativeShell.xcframework`과(와) 함께 사용하면 throw합니다. |
| `register(component:_:)` | [네이티브 컴포넌트](./native-components.md)를 등록합니다. |
| `params: [String: Any]` | 지금부터 로드되는 앱의 실행 파라미터입니다. 앱은 시작할 때 이를 `host.params`(으)로 읽습니다([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | 앱에 이벤트를 보냅니다(`host.on(name, …)`). 앱이 수신하기 시작할 때까지, 또는 실행 중인 앱이 없으면 다음 앱을 위해 보관됩니다. |
| `handle(_ name: String, _ handler:)` | 앱이 `name`에 대해 보낸 호출(`host.call`)과 post(`host.post`)를 메인 스레드에서 처리합니다. `{ data, reply in … }`, 또는 결과가 호출에 대한 응답이 되는 `async throws` 함수 `{ data in … }`. |
| `removeHandler(_ name: String)` | `name`의 핸들러를 제거합니다. 앱의 해당 호출은 즉시 실패합니다. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | 실행 중인 앱이 요청한 것(해당 페이지와 대화상자의 `statusBar`, `nsh.json`의 기본값)입니다. 호스팅 뷰 컨트롤러의 override에서 반환하세요. |

> [!IMPORTANT]
> `bundle.nshc`(바이트코드)은 앱 번들 내부에서만 로드됩니다. QuickJS는 바이트코드를 검증하지 않으므로 다른 위치의 바이트코드는 메모리를 손상시킬 수 있습니다. 앱 번들 밖의 파일은 `bundle.js`(JS 소스)을(를) 로드하거나, 더 좋게는 [서명된 패키지](./signed-packages.md)를 사용하세요.

`limits`, `grantCapabilities`, `storageDirectory`, `cacheOptions`은(는) 다음 로드부터 적용됩니다. `loadBundle` / `run` 전에 설정하세요.

각 앱은 별도 설정 없이 자신의 id 아래에 스토리지를 보관합니다. 서명된 패키지는 릴리스 키의 인증서가 보증하는 id 아래에, 번들은 `nsh.json`의 `id` 아래에 보관합니다(`app.json`은(는) 번들 옆에 있으며 `nsh build`이(가) 생성합니다). 앱의 데이터를 호스트가 선택한 위치에 보관하려면 `storageDirectory`을(를) 설정하세요.

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## 앱과 통신

뷰와 그 안에서 실행되는 앱은 전용 채널([`host`](../modules/nsh.md#host))을 통해 통신합니다. 앱이 시작할 때 읽는 실행 파라미터, 호스트 앱에서 보내는 이벤트, 앱에서 보내는 호출과 post가 있으며, 데이터는 JSON입니다(이쪽에서는 Foundation 객체). 앱에 뷰나 네이티브 컴포넌트가 필요하지 않습니다.

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

핸들러는 메인 스레드에서 실행됩니다. 호출은 어느 쪽도 차단하지 않고 앱에서 응답을 기다립니다. 응답 없이 해제된 reply는 호출을 실패시키며, 핸들러가 없는 이름의 호출은 즉시 실패합니다. 앱이 아직 수신하지 않는 이름의 이벤트는 수신하기 시작할 때까지 보관됩니다. 실행 중인 앱이 없는 동안(`loadBundle` 전, 다시 로드하는 동안) 보낸 이벤트는 다음 앱으로 전달되므로, 앱이 시작되는 동안 탭한 알림도 여전히 앱에 도달합니다.

<a id="theme-overrides"></a>

## 테마 오버라이드

브랜드가 다른 여러 호스트 앱에 임베딩된 하나의 앱은 각 호스트의 브랜드를 따릅니다. 호스트는 자신의 브랜드가 바꾸는 토큰을 `nsh.json`의 `"theme"` 형식(shadcn/ui의 `cssVars`, 값은 CSS에서 쓰는 형태)의 테마 파일로 전달합니다. 이 토큰은 이름이 같은 앱의 토큰보다 우선하며, 앱의 나머지 토큰은 그대로 유지됩니다. 토큰의 다크 모드 값은 `dark` 아래에 지정하세요(`light` 또는 `theme` 아래에만 설정한 값은 두 모드 모두에서 그 색상이 됩니다).

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

로드 전이나 후에 호출할 수 있습니다. `bg-primary`, `rounded-(--radius)` 같은 클래스는 즉시 스타일이 다시 적용되며, 이후에 로드되는 모든 앱은 첫 프레임부터 오버라이드가 적용된 상태로 시작합니다. `setThemeOverrides(nil)`은(는) 앱에 고유 테마를 되돌려 줍니다.

<a id="links-the-app-opens"></a>

## 앱이 여는 링크

앱이 여는 URL([`openUrl`](../modules/nsh.md#openurl), `links="open"`이(가) 있는 `TextView`의 링크)은 먼저 메인 스레드에서 `onOpenURL`에 전달됩니다. 호스트 앱이 URL을 처리했으면(예: 자체 라우터로 라우팅) `true`을(를) 반환하고, 시스템이 `UIApplication.open`(으)로 열도록 하려면 `false`을(를) 반환하세요. `onOpenURL`이(가) 없으면 시스템이 모든 URL을 엽니다. URL은 앱의 `openUrl` capability가 허용한 뒤에 여기에 도달합니다.

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

## 제한

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| `NshLimits` 필드 | 기본값 | 의미 |
|---|---|---|
| `memoryMB: UInt32?` | 256 | JS 힙(MB). 소진되면 앱이 중지됩니다. |
| `stackKB: UInt32?` | 4096(최댓값이기도 함) | 인터프리터 스택(KB). 더 깊은 재귀는 `RangeError`을(를) throw합니다. |
| `loadBudget: TimeInterval?` | 10 s | 번들을 평가하는 시간입니다. |
| `callBudget: TimeInterval?` | 2 s | JS로의 그 외 모든 호출(이벤트 하나, 타이머 하나, 프레임 하나)의 시간입니다. 초과한 호출은 중단됩니다. |
| `maxNodes: UInt32?` | 200 000 | 앱이 유지할 수 있는 노드 수입니다. |

`nil`은(는) 기본값을 유지합니다. 각 제한에 도달했을 때의 동작은 [샌드박스와 capability](./sandbox-and-capabilities.md)를 참고하세요.

<a id="capabilities"></a>

## Capability

앱은 접근할 수 있는 대상을 `nsh.json`에 선언하며, 임베딩하는 앱은 그보다 적게 부여할 수 있습니다. 요청은 양쪽 모두 허용해야 합니다.

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

여기서 앱은 `nsh.json`이(가) 요청하더라도 상태 표시줄을 설정할 수 없습니다(`statusBar` 없음). 자세한 내용은 [샌드박스와 capability](./sandbox-and-capabilities.md)를 참고하세요.

<a id="signed-packages"></a>

## 서명된 패키지

앱이 다운로드하는 코드(업데이트, 서드파티 미니 앱)를 실행하려면 [서명된 패키지](./signed-packages.md)를 사용하세요. `nsh publish`은(는) 루트 키가 인증한 릴리스 키로 서명된 `.nshpkg`을(를) 생성하며, 앱은 이를 실행하기 전에 검증합니다.

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

먼저 검증하고 나중에 실행하려면 두 단계를 분리하세요.

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | 설명 |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | 신뢰 저장소를 열거나 생성합니다. 저장소의 상태(최신 폐기 목록, 앱별로 수락한 최고 빌드)가 여기에 유지되며, 패키지의 에셋이 그 아래에 추출됩니다. `addRoot` 전까지는 어떤 키도 신뢰하지 않습니다. 스레드 안전합니다. |
| `addRoot(_ publicKey: String) throws` | 루트 공개 키를 신뢰합니다(base64, `.pub` 파일의 내용). 여러 루트를 신뢰할 수 있습니다. |
| `updateRevocations(_ json: String) throws` | `nsh revoke`이(가) 생성하고, 신뢰하는 루트가 서명했으며, 저장소가 가진 것보다 최신인 폐기 목록을 적용합니다. |
| `openPackage(at: URL) async throws -> NshPackage` | 검증하고, 에셋을 추출하고, 패키지를 수락합니다(이후 해당 앱의 이전 빌드는 거부됩니다). |
| `NshPackage.info` | 내부 앱의 `id`, `name`, `version`, `build`입니다. |
| `NshError` | throw하는 모든 호출이 던지는 오류이며, `message`이(가) 이유를 알려 줍니다. |
<a id="development"></a>

## 개발

`NativeShellDev.xcframework`을(를) 사용하면 뷰가 번들 대신 개발 서버를 가리키도록 설정할 수 있습니다:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Mac에서 `nsh dev App.tsx`을(를) 실행하세요. 시뮬레이터는 Mac의 네트워크를 공유하므로 `127.0.0.1`으로 서버에 접근할 수 있습니다. 실제 기기에서는 `nsh dev`이(가) 출력하는 LAN 주소(`devices on this network: ws://192.168.1.20:8790/ws`)를 사용합니다. 저장할 때마다 앱이 즉시 업데이트되고, 로그는 `nsh dev` 터미널에 표시되며, 오류는 앱 위에 표시됩니다. [개발 서버와 디버깅](./dev-server-and-debugging.md)을 참고하세요.

> [!NOTE]
> 실제 기기에서 Mac과의 연결은 일반 로컬 네트워크 트래픽이며, 일반 `ws://` 및 `http://`(에셋)을 통해 이루어집니다.
> iOS에서 사용자에게 로컬 네트워크 접근 권한을 요청할 수 있으며, 앱의 App Transport Security 설정에서 이를 허용해야 합니다.

<a id="notes"></a>

## 참고 사항

- **스레드.** `NshAppView`은(는) 메인 액터에 격리되어 있습니다. `NshTrust`, `NshPackage`, `NshComponentContext`은(는) 스레드 안전(thread-safe)합니다.
  JS 엔진은 별도의 스레드에서 실행되며, 메인 스레드는 JS 엔진을 기다리지 않습니다.
- **상태 표시줄.** 임베드된 앱의 페이지와 대화상자(`statusBar`)는 `NshAppView.preferredStatusBarStyle` 및 관련 메서드가 반환하는 값을 변경합니다.
  호스팅하는 뷰 컨트롤러는 위 예제처럼 이를 전달해야 합니다.
- **Safe area.** 앱에서는 Rust에서 `safe_area()`을(를) 사용하고, TSX에서는 패딩에 `env(safe-area-inset-*)`을(를) 사용하거나 [`nsh`](../modules/nsh.md#safe-area-and-keyboard)의 `safeAreaInsets()`을(를) 평소처럼 사용합니다. 자체 헤더 아래에 배치된 `NshAppView`은(는) 창 전체의 인셋이 아니라 해당 위치에 적용되는 인셋을 받습니다.
- **Mac Catalyst.** 동일한 프레임워크가 Catalyst 앱에서도 동작합니다.

<a id="see-also"></a>

## 관련 문서

- [Rust로 빌드하기](./rust.md)
- [Android 앱에 임베드하기](./android.md)
- [네이티브 컴포넌트](./native-components.md)
- [서명된 패키지](./signed-packages.md)
- [샌드박스와 권한](./sandbox-and-capabilities.md)
