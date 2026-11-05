---
title: "macOS"
description: "Rust 및 TSX 기반 NSH 앱을 macOS의 AppKit 창에서 실행하고, .app 번들로 패키징하고, AppView로 Mac 앱에 임베드하는 방법과 macOS에서 달라지는 점을 설명합니다."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

NSH 앱은 네이티브 Mac 앱으로도 실행됩니다. macOS 백엔드는 AppKit 뷰와 Core Animation으로 앱을 렌더링하고 CoreText로 텍스트를 레이아웃합니다. 코어, 리액티브 그래프, 렌더러, Taffy 레이아웃, 네이티브 모듈은 iOS 및 Android와 같으므로 하나의 앱이 모든 곳에서 실행됩니다. macOS에서 `os()`은(는) `Os::MacOs`이며(TSX에서 `platform.os`은(는) `"macos"`), TSX의 `desktop={{…}}` props가 적용됩니다. 창의 제목, 앱 자체의 제목 표시줄, 메뉴 막대, 컨텍스트 메뉴는 Rust의 `nsh_core::element::desktop`([데스크톱 제목 표시줄](./rust.md#desktop-title-bars))와 TSX의 [`nsh/desktop`](../modules/nsh-desktop.md)에서 제공됩니다.

macOS 백엔드는 데스크톱 앱처럼 동작합니다. 마우스, 트랙패드, 키보드 입력, 크기 조절이 가능한 창, 창 위에 표시되는 다이얼로그, 메뉴 막대를 지원합니다.

<a id="requirements"></a>

## 요구 사항

- 앱이 실행되는 **macOS 14** 이상.
- 체크아웃한 소스에서 Rust 앱의 러너와 NSH의 macOS 런타임을 빌드하고 앱을 패키징(`codesign`, `sips`)하기 위한 Xcode의 명령줄 도구(`xcode-select --install`). Mac에서 `cargo xtask dist`으로 만든 배포본에는 TSX 앱의 런타임이 `runtime/macos/`에 포함됩니다.

<a id="running-an-app"></a>

## 앱 실행

Rust 앱은 해당 디렉터리에서 실행합니다.

```sh
nsh run --target macos         # the default on a Mac
```

`nsh`은(는) 사용자의 크레이트로 디버그 러너를 빌드하고 앱을 창에 엽니다. 로그(`log::info!` 등)는 터미널에 출력되며, 크레이트의 Rust 코드가 변경되면 러너를 다시 빌드하고 앱을 재시작합니다. `cargo run`은(는) `nsh init --template rust`이(가) 작성하는 크레이트의 `src/main.rs`에서 동일한 루트를 시작합니다. 자세한 내용은 [`run_app`](#embedding-in-a-mac-app)의 `AppSource::Rust`을(를) 참고하세요.

TSX 앱은 진입점을 지정합니다.

```sh
nsh run App.tsx --target macos
```

앱은 AppKit 창(기본 1200×800)에서 열리며, 다른 타깃과 마찬가지로 핫 리로드, 터미널 로그, 오류 오버레이를 지원합니다. Cmd+R은 최신 빌드를 다시 불러옵니다. 메뉴 막대와 창에는 앱 이름(nsh.json의 `"name"`, 없으면 디렉터리 이름)이 표시됩니다. 체크아웃한 소스에서는 `nsh run`이(가) 먼저 개발 호스트(`nsh-macos-host`)를 빌드합니다. `nsh run`을(를) 중지하면 창이 닫히고, 창을 닫으면 `nsh run`이(가) 종료됩니다. 호스트는 빌드된 번들을 단독으로 실행할 수도 있습니다.

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size`은(는) 창의 초기 크기입니다(TSX 앱). 창 크기는 조절할 수 있습니다. `--display <n>`(`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1`은(는) 기본 디스플레이, 즉 메뉴 막대가 있는 디스플레이입니다.

`nsh test --target macos`은(는) TSX 앱의 테스트를 macOS 창에서 실행하며, 보조 디스플레이가 있으면 그곳을 사용합니다(메인 화면은 사용자가 계속 쓸 수 있으며, `--display <n>`으로 다른 디스플레이를 선택할 수 있습니다). 테스트가 여는 각 앱은 자체 창을 가지며, 디스플레이가 더 작더라도 테스트가 요청한 크기로 열립니다. 각 단계는 셀렉터가 지정한 뷰에서 시스템 입력으로 클릭, 입력, 스크롤을 수행합니다([테스트](./testing-and-trace.md#on-a-real-platform)).

<a id="performance-monitor"></a>

### 성능 모니터

`--fps`(Rust 앱의 `run_app`에서는 `AppOptions { fps: true, .. }`, 임베딩 시에는 `AppView::set_fps_monitor(true)`, `nsh run App.tsx --target macos --fps`, 호스트의 `--fps`, 또는 패키징된 TSX 앱의 `open -a MyApp --args --fps`)은(는) 앱 오른쪽 위에 초당 두 번 갱신되는 패널을 표시합니다.

| 행 | 측정 항목 |
|---|---|
| `FPS` | 지난 1초 동안 표시된 프레임, 즉 앱이 변경된 디스플레이 새로 고침 횟수입니다(유휴 상태의 앱은 낮게 표시되며 이는 느린 것이 아닙니다). `max`은(는) 메인 스레드가 따라갈 수 있었던 값이고, 그다음은 디스플레이의 주사율입니다(ProMotion 화면에서는 120 Hz). |
| `TICK` | 디스플레이 새로 고침 사이에 실제로 도착한 간격(평균, p95)과 `gap`, 즉 표시된 프레임 사이 간격의 p95입니다. 지연이 없으면 한 번의 새로 고침 간격(120 Hz에서 8.3 ms)입니다. |
| `MAIN` | 프레임당 메인 스레드 시간(엔진의 변경 사항 적용, 텍스트와 캔버스 그리기, 애니메이션, 입력), 그 95번째 백분위수, 그리고 `drop`: 한 번의 새로 고침보다 오래 걸린 프레임의 비율입니다. |
| `JS` / `CORE` | 커밋당 사용자 코드(핸들러, 타이머, 리스트 행)와 NSH의 코어(레이아웃, 텍스트, diff) 소요 시간, 초당 커밋 수, 커밋당 네이티브 뷰 변경 수입니다. |
| `HOP` | 엔진 스레드와 메인 스레드 사이에서 변경 사항이 대기하는 시간과 엔진 스레드의 사용률입니다. |
| `CPU` / `GPU` / `MEM` | 프로세스의 CPU(100%가 코어 하나), GPU 점유율, 메모리 사용량(Activity Monitor와 같은 수치)입니다. |

아래 막대는 최근 120개 프레임의 메인 스레드 시간을 한 번의 새로 고침(선)과 비교해 보여 줍니다. 절반 이내면 초록색, 한 번의 새로 고침 이내면 주황색, 초과하면 빨간색입니다. 패널이 표시되는 동안에는 측정값이 초당 한 번 로그에도 기록됩니다(타깃 `nsh::perf`, macOS의 프레임 단계 `tick`, `drain`, `canvas`을 포함한 Linux 백엔드 형식이며, 밀리초 단위의 평균/p50/p95/최댓값). 이 로그는 `nsh test --fps -v`이(가) 보여 주고 `examples/gallery/tools/perf.py`이(가) 읽습니다. 릴리스 빌드에서 측정하세요. 모니터는 꺼져 있는 동안 비용이 들지 않습니다.

<a id="packaging"></a>

## 패키징

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

앱 번들을 생성합니다.

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

`.app`은(는) ad hoc으로 서명되므로 빌드한 Mac에서 실행됩니다. 배포하려면 Developer ID로 서명하고 공증해야 합니다. `--run`은(는) 패키징한 뒤 앱을 엽니다.

<a id="embedding-in-a-mac-app"></a>

## Mac 앱에 임베딩

`nsh-platform-macos` 크레이트(NSH 저장소 제공)는 Rust Mac 앱에 `AppView`을(를) 제공합니다. 하나의 NSH 엔진을 `NSView`(으)로 사용하는 것입니다. 각 `AppView`은(는) 독립적이며 여러 개를 동시에 실행할 수 있습니다. Rust 루트, 즉 크레이트의 루트 컴포넌트를 실행합니다.

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens`은(는) 루트에 [테마](./rust.md#theme)(`nsh_base::Theme::from_json(json)?.into_tokens()`)를 제공하고, `Root::app_id`은(는) 데이터가 저장되는 id를 지정합니다. `nsh build`이(가) 작성한 TSX 번들은 같은 뷰에 로드됩니다.

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load`은(는) 실행 중이던 것을 대체하고, `stop`은(는) 앱을 종료합니다. `asset_base`은(는) `asset:/` URI가 해석되는 위치(`AssetBase::Directory` 또는 `AssetBase::Http`)를 지정합니다. 바이트코드 번들(`bundle.nshc`)은 `unsafe { Bundle::bytecode(bytes) }`(으)로 로드합니다. 바이트코드는 신뢰된 입력이므로 앱 자체의 파일에서만 로드하세요.
NSH 앱만으로 구성된 앱의 경우, `run_app(source, options)`(`AppSource::Rust(root)` 또는 `AppSource::Bundle(bundle)`)은(는) 표준 메뉴(About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close)가 있는 창에 `AppView` 하나를 열고 창이 닫힐 때까지 실행됩니다. 이 메뉴는 앱이 `Menu.setApplicationMenu`([`nsh/desktop`](../modules/nsh-desktop.md))로 교체할 수 있습니다.
기본적으로 창을 닫거나 Quit를 선택하면 엔진이 중지되고 `run_app`에서 반환됩니다. 호출자는 이후 정리 작업을 마치거나 실행 파일을 다시 실행할 수 있습니다.

`AppOptions { keep_alive_on_close: true, ..Default::default() }`을(를) 설정하면 창이 닫혀도 독립 실행 세션이 유지됩니다. 창을 닫으면 숨겨지고, Dock에서 다시 열면 같은 창과 엔진이 표시됩니다. 명시적인 종료나 업데이트 후 재실행이 필요하면 아무 스레드에서나 `nsh_platform_macos::quit_app()`을(를) 호출하세요. 유지 중인 창을 닫고 엔진을 중지한 뒤 `run_app`에서 반환됩니다. `nsh_core::element::desktop::close_window()`은(는) 선택한 창 닫기 정책을 따릅니다.

`AppOptions::cache`(또는 다음에 로드될 앱을 위한 `AppView::set_cache`)은(는) 앱이 캐시, [다운로드한 이미지](./images-and-assets.md#kept-on-disk)를 보관하는 위치와 각 앱이 보관하는 용량(`CacheOptions`: 기본값은 시스템 캐시 디렉터리와 이미지 256 MiB)을 설정합니다.

`AppView::set_locale(Some(locale))`과(와) `AppView::set_font_scale(Some(scale))`은(는) 시스템 설정 대신 사용자 앱의 언어와 텍스트 크기를 앱에 적용합니다(`None`은(는) 다시 시스템 설정을 따릅니다). `locale()`, `Intl`, `fontScale()`과 텍스트가 즉시 따라갑니다([기기 및 환경](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))`은(는) 앱의 [테마](./tailwind.md#theme-tokens) 위에 사용자 앱의 브랜드를 적용합니다. `nsh.json`의 `"theme"` 형식으로 된 테마 파일이며, 이 파일의 토큰이 라이트 모드와 다크 모드 모두에서 이름이 같은 앱의 토큰보다 우선하고 나머지 앱의 토큰은 그대로 유지됩니다. `bg-primary` 같은 클래스는 즉시 다시 스타일링되며, 이후 로드되는 앱은 이 테마로 시작합니다(`None`은(는) 앱에 고유 테마를 되돌려 줍니다. 파싱되지 않는 파일은 오류이며 아무것도 변경하지 않습니다).

네이티브 컴포넌트는 `AppView::register_component`(으)로 등록합니다. [네이티브 컴포넌트](./native-components.md#registering-on-macos-rust)를 참고하세요. `set_ui_sets(sets)`은(는) 모든 엔진이 제공하는 UI 집합을 설정합니다. NSH의 것(`nsh_base::registry()`)과 사용자 크레이트의 것(`#[native_module]`이(가) 만드는 `my_app::registry()`)이 포함되므로, 뷰가 로드하는 TSX는 사용자의 Rust 컴포넌트와 모듈도 import할 수 있습니다.

<a id="what-differs-on-macos"></a>

## macOS에서 다른 점

환경은 데스크톱의 것입니다. 안전 영역과 키보드 높이는 0이고, `idiom()`은(는) 데스크톱(`platform.idiom`은(는) `"desktop"`)이며, `os_version()`(`platform.version`)은(는) macOS 버전이고, 다크 모드는 시스템 모양을 실시간으로 따릅니다. [기기 및 환경](./device-and-environment.md)을 참고하세요.

입력은 데스크톱의 것입니다. 마우스, 트랙패드(관성 스크롤, 핀치, 회전), 키보드를 지원합니다. 선택 가능한 텍스트는 드래그, 더블 클릭, 트리플 클릭으로 선택하고 Cmd+C로 복사합니다. Escape, Option+Left, Cmd+[, 마우스의 뒤로 가기 버튼은 가장 최근 다이얼로그를 닫거나 스택에서 뒤로 이동합니다(포커스된 필드나 웹 페이지에서 Escape는 해당 포커스만 벗어납니다. 페이지가 이 키들을 먼저 받으며 페이지가 사용하는 키는 그대로 유지됩니다). `Dialog`은(는) 앱의 팝업과 배경막을 표시하는 창 전체 위의 레이어입니다. 페이지는 상단에 `header`을(를) 표시합니다. `Input` 안에서는 패딩을 포함해 어디를 클릭해도 가장 가까운 지점에 캐럿이 놓입니다. `AlertDialog`은(는) 창에 `NSAlert` 시트를 표시합니다. 알림 액션은 한 줄에 최대 두 개까지 표시되며(취소 액션이 가장 왼쪽, 마지막 일반 액션이 Return의 기본값), 그보다 많은 액션과 액션 시트의 액션은 순서대로 세로로 쌓이고 취소 액션이 마지막에 오며 기본값은 없습니다. Escape는 취소 액션을 선택합니다.

<a id="keyboard"></a>

### 키보드

| 키 | 동작 |
|---|---|
| Return | `Input`에서 `submitBehavior`이(가) 지정한 동작: 제출(`onSubmit`), 제출 후 필드 벗어나기, 또는 줄 바꿈(여러 줄 입력) |
| Return, 키패드 Enter, Space | 포커스된 뷰를 `onPress`(으)로 활성화하며 키를 누를 때 한 번만 동작합니다. 자동 반복은 무시됩니다 |
| Shift+Return, Option+Return, Ctrl+Return | Return이 제출 동작인 여러 줄 입력에서 줄 바꿈 |
| Tab, Shift+Tab (Ctrl 포함) | 가장 최근 다이얼로그 안에서 화면 순서상 다음 / 이전 필드 또는 누를 수 있는 뷰로 이동합니다. Option+Tab은 여러 줄 입력에 탭 문자를 입력합니다 |
| Escape | 포커스된 필드에서 벗어납니다. 그렇지 않으면 텍스트 선택을 해제하고, 이어서 가장 최근 다이얼로그를 닫거나 뒤로 이동합니다 |
| Option+Left, Cmd+[, 마우스 뒤로 가기 버튼 | 뒤로 이동(필드에 포커스가 있을 때는 제외: 이때 Option+Left는 캐럿을 이동합니다) |
| Option / Cmd + 화살표, Shift 병용; Option+Delete, Cmd+Delete; Ctrl+A / E / K | 모든 Mac 앱과 같이 필드에서 단어 및 줄 단위로 이동, 선택, 삭제 |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | 실행 취소, 다시 실행, 잘라내기, 복사, 붙여넣기, 모두 선택(`masked` 필드는 잘라내기와 복사를 거부합니다). Cmd+A / Cmd+C는 선택 가능한 텍스트를 선택하고 복사합니다 |
| 화살표; Page Up / Down, Space, Shift+Space, Option+Up / Down; Home / End, Cmd+Up / Down | 포커스된 뷰 주변 또는 마우스 아래의 스크롤 뷰를 한 줄, 한 페이지, 시작 / 끝으로 스크롤합니다(필드에 포커스가 있을 때는 제외) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | 닫기, 최소화, 전체 화면, 숨기기, 다른 앱 숨기기, 종료(`nsh package` 및 `nsh run` 앱의 메뉴) |
| Cmd+R | 최신 빌드를 다시 불러옵니다(`nsh run`) |

앱 자체의 단축키([`keymap`](../modules/nsh.md#keymap))가 이 키들보다 먼저 처리됩니다. 단, 포커스된 누를 수 있는 뷰를 대상으로 하는 활성화 키와 Quit, Hide, Minimize, Full Screen은 예외이며 바인딩할 수 없습니다.

단축키는 어떤 키보드 레이아웃에서도 동작합니다(키릴 문자나 그리스 문자 레이아웃에서는 US 레이아웃에서 C를 입력하는 키가 Cmd+C입니다). 입력기(중국어, 일본어 등)의 조합을 확정하는 Return은 제출하지 않습니다. `onKeyPress`은(는) React Native가 보고하는 것과 같은 값, 즉 입력된 텍스트, `"Enter"`, `"Backspace"`, `"Escape"`을(를) 보고합니다.

지원되지 않거나 다른 점:

- **확대/축소 스크롤 뷰**(`zoomTo`, zoom props).
- **`mixBlendMode`**, 그리고 1을 초과하는 `brightness()`.
- **입력**: 콘텐츠 유형과 자동 완성, 키보드 유형, 자동 대문자화, 자간. 입력 액세서리 뷰는 표시되지 않으며(소프트웨어 키보드가 없음) `keyboardShouldPersistTaps`은(는) 무시됩니다.
- **`WebView`의 `scrollable={false}`**은(는) 마우스 휠과 트랙패드로 페이지가 스크롤되지 않게 합니다. iOS와 마찬가지로 페이지 주변의 앱 스크롤 뷰가 대신 스크롤됩니다. 페이지는 키보드(Space, 화살표)와 자체 스크립트로는 여전히 스크롤되며, 페이지 간 트랙패드 스와이프(`allowsBackForwardNavigationGestures`)도 동작하지 않습니다.
- **접근성**: 사용자 정의 `accessibilityActions`.
- **상태 표시줄**과 **햅틱**(데스크톱에 대응하는 기능이 없음).

<a id="see-also"></a>

## 참고

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [패키징](./packaging.md)
- [플랫폼별 코드](./platform-specific.md)
