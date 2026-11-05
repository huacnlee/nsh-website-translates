---
title: "Windows"
description: "Rust 및 TSX 기반 NSH 앱을 Direct2D로 그려지는 Win32 창에서 실행하고, 패키징하고, AppView를 사용해 Win32 앱에 임베드하는 방법과 Windows에서 달라지는 점을 설명합니다."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

NSH 앱은 Windows에서도 실행됩니다. Windows 백엔드는 Direct2D로 Win32 창에 앱을 그리고 DirectWrite로 텍스트를 배치합니다. 코어, 반응형 그래프, 렌더러, Taffy 레이아웃, 네이티브 모듈은 iOS 및 Android와 동일하므로 하나의 앱이 어디서나 실행됩니다. Windows에서 `os()`은(는) `Os::Windows`입니다(`platform.os`은(는) TSX에서 `"windows"`). 또한 TSX의 `desktop={{…}}` props가 적용됩니다. 창의 제목, 앱 자체의 제목 표시줄, 메뉴 바, 컨텍스트 메뉴는 Rust의 `nsh_core::element::desktop`([Desktop title bars](./rust.md#desktop-title-bars))와 TSX의 [`nsh/desktop`](../modules/nsh-desktop.md)에서 제공됩니다.

<a id="requirements"></a>

## 요구 사항

- **Windows 10 1809** 이상 또는 Windows 11.
- 웹 뷰를 위한 **WebView2 Runtime**. Windows 11에는 기본 포함되어 있고 Windows 10에서는 Microsoft Edge와 함께 제공됩니다. 없으면 `WebView`에 플레이스홀더가 표시됩니다.
- 앱에서 재생하는 비디오 형식을 위한 **Media Foundation 코덱**(비디오는 Windows의 자체 미디어 스택으로 재생됩니다).
- Rust 앱의 러너를 빌드하려면: C++ 워크로드와 Windows SDK가 포함된 Visual Studio Build Tools. NSH의 Windows 런타임을 빌드하려면(체크아웃에서, 또는 Windows에서 `cargo xtask dist`) QuickJS 바인딩을 위한 LLVM도 필요합니다.

<a id="running-an-app"></a>

## 앱 실행

Windows에서 `nsh run`은(는) 앱을 창에서 엽니다. Rust 앱은 해당 디렉터리에서 실행합니다:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh`은(는) 크레이트와 함께 디버그 러너를 빌드하고 앱을 열며, 로그(`log::info!` 등)는 터미널에 출력됩니다. 크레이트의 Rust 코드가 변경되면 러너를 다시 빌드하고 앱을 재시작합니다. `cargo run`은(는) `nsh init --template rust`이(가) 작성하는 크레이트의 `src/main.rs`에서 동일한 루트를 시작합니다: [`run_app`](#embedding-in-a-win32-app)와 `AppSource::Rust`.

TSX 앱은 진입점을 지정하며, 기본적으로 1200×800 창에서 열리고 핫 리로드, 터미널 로그, 오류 오버레이는 다른 타깃과 동일하게 동작합니다:

```sh
nsh run App.tsx
```

체크아웃에서는 `nsh run`이(가) 먼저 개발 호스트(`nsh-windows-host.exe`)를 빌드하며, Windows에서 만든 배포본에는 `runtime\windows\`에 포함되어 있습니다. Ctrl-C는 창을 닫고, 창을 닫으면 `nsh run`이(가) 종료됩니다. 호스트는 어떤 경우에도 `nsh`보다 오래 남아 있지 않습니다. 호스트는 빌드된 번들을 단독으로 실행할 수도 있습니다:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size`은(는) 창의 크기이며 단위는 포인트입니다(`<width>x<height>`, TSX 앱).

<a id="performance-monitor"></a>

### 성능 모니터

`--fps`(`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, 호스트의 `--fps`, 또는 Rust 앱의 `run_app`에 있는 `AppOptions { fps: true, .. }`)은(는) 성능 모니터의 측정값을 초당 한 번 기록합니다(타깃 `nsh::perf`). 측정값에는 디스플레이 주사율 대비 표시된 프레임 수, 프레임당 메인 스레드 시간과 그 단계(`tick`, `drain`, `paint`, `present`, `canvas`), 엔진의 커밋, CPU와 메모리가 포함되며, 다른 데스크톱 플랫폼에서 기록하는 형식과 같습니다(밀리초는 mean/p50/p95/max). `nsh test --fps -v`은(는) 이를 표시하고 `examples/gallery/tools/perf.py`은(는) 이를 읽습니다([Performance report](./performance-report.md#windows-win32-direct2d)). 릴리스 빌드에서 측정하세요. 모니터는 꺼져 있는 동안 비용이 전혀 들지 않습니다.

<a id="packaging"></a>

## 패키징

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

디렉터리와 동일한 내용의 아카이브를 생성합니다:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

실행 파일은 자신 옆에 있는 `nsh\`을(를) 찾습니다. 앱이 위치할 곳에 디렉터리 전체를 복사하거나(또는 `.zip`의 압축을 풀어) 두세요. 설치되는 것은 없습니다. `nsh.json`의 아이콘은 추가 도구 없이 실행 파일에 포함되며(탐색기와 작업 표시줄에 표시됨), 다른 시스템에서 패키징하면 기본 아이콘이 유지됩니다. 앱 id는 작업 표시줄에서 앱의 창들을 그룹화합니다. `--run`은(는) 패키징한 후 앱을 실행합니다. 실행 파일은 서명되지 않습니다. 배포하려면 자체 인증서(`signtool`)로 서명하세요.

<a id="embedding-in-a-win32-app"></a>

## Win32 앱에 임베드하기

NSH 저장소의 `nsh-platform-windows` 크레이트는 Rust Win32 앱에 `AppView`을(를) 제공합니다. 이는 사용자 창의 자식 창 안에서 동작하는 하나의 NSH 엔진입니다. 각 `AppView`은(는) 독립적이며 여러 개를 동시에 실행할 수 있습니다. 이 뷰는 Rust 루트, 즉 크레이트의 루트 컴포넌트를 실행합니다:

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

`nsh build`이(가) 작성한 TSX 번들은 `asset_base`을(를) 해당 `assets` 디렉터리로 설정하여 같은 뷰에 로드됩니다:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

뷰는 자식 창입니다. 메시지 루프가 이를 실행하며, 부모 창의 크기가 바뀔 때 `hwnd()`의 `MoveWindow`(으)로 위치를 지정합니다. 뷰는 그것이 속한 창의 스레드에서 만드세요. 뷰의 수명 주기는 그 창의 최상위 창, 즉 뷰가 만들어진 아래의 창을 따릅니다. `AppView::load`은(는) 실행 중이던 것을 교체하고, `stop`(또는 창 파괴)은 앱을 종료합니다. `asset_base`은(는) `asset:/` URI가 해석되는 위치(`AssetBase::Directory` 또는 `AssetBase::Http`)를 지정합니다. 바이트코드 번들(`bundle.nshc`)은 `unsafe { Bundle::bytecode(bytes) }`(또는 unsafe인 `Bundle::read_trusted(path)`)로 로드합니다. QuickJS 바이트코드는 신뢰된 입력이므로 자신의 앱 파일에서만 로드하세요. 독립 실행형 창은 `nsh_platform_windows::run_app(source, options)`이며, `AppSource::Rust(root)` 또는 `AppSource::Bundle(bundle)`을(를) 사용합니다. `Root::tokens`은(는) 루트에 [theme](./rust.md#theme)을 지정하고 `Root::app_id`은(는) 해당 데이터가 보관되는 id를 지정합니다.

`AppOptions::cache`(또는 이후에 로드되는 앱을 위한 `AppView::set_cache`)은(는) 앱이 캐시, [다운로드하는 이미지](./images-and-assets.md#kept-on-disk), 각각 보관할 용량을 저장할 위치를 설정합니다(`CacheOptions`: 기본값은 시스템의 캐시 디렉터리와 이미지 256 MiB).

`AppView::set_locale(Some(locale))`와(과) `AppView::set_font_scale(Some(scale))`은(는) 시스템 설정 대신 사용자 앱의 언어와 텍스트 크기를 앱에 적용합니다(`None`은(는) 다시 시스템 설정을 따릅니다). `locale()`, `Intl`, `fontScale()` 및 텍스트가 즉시 따라갑니다([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))`은(는) 앱의 [theme](./tailwind.md#theme-tokens) 위에 사용자 앱의 브랜드를 덧씌웁니다. `nsh.json`의 `"theme"` 형식으로 된 테마 파일이며, 이 파일의 토큰은 라이트 모드와 다크 모드 모두에서 같은 이름의 앱 토큰보다 우선하고 나머지 앱 토큰은 그대로 유지됩니다. `bg-primary` 같은 클래스는 즉시 스타일이 다시 적용되며, 이후에 로드되는 앱은 이를 적용한 상태로 시작합니다(`None`은(는) 앱에 자체 테마를 되돌려 줍니다. 파싱되지 않는 파일은 오류이며 아무것도 변경하지 않습니다).

네이티브 컴포넌트는 `AppView::register_component`로 등록합니다. [Native components](./native-components.md#registering-on-windows-rust)를 참조하세요. `set_ui_sets(sets)`은(는) 모든 엔진이 제공하는 UI 집합을 설정합니다. NSH의 집합(`nsh_base::registry()`)과 사용자 크레이트의 집합(`my_app::registry()`, `#[native_module]`이(가) 만듭니다)이 포함되므로, 뷰가 로드하는 TSX는 Rust 컴포넌트와 모듈도 import할 수 있습니다.

<a id="what-differs-on-windows"></a>

## Windows에서 다른 점

환경은 데스크톱의 것입니다. 안전 영역과 키보드 높이는 0이고, `idiom()`은(는) 데스크톱(`platform.idiom`은(는) `"desktop"`)이며 `os_version()`(`platform.version`)은(는) `"10.0"`입니다(Windows 11에서도 마찬가지입니다. Windows는 버전 번호를 유지했습니다). 다크 모드는 설정 > 개인 설정 > 색을 실시간으로 따르고, `fontScale()`은(는) 텍스트 크기 설정을, 동작 줄이기는 애니메이션 효과 설정을, 로캘은 사용자의 지역 형식을 따릅니다. [Device and environment](./device-and-environment.md)를 참조하세요.

`cursor` 스타일은 마우스가 뷰 위에 머무르는 동안의 업데이트를 따릅니다. 한 배치에서 커서가 바뀌면 Windows는 배치 전체가 끝난 후 포인터 아래의 뷰를 기준으로 새 모양 또는 `"none"`을(를) 적용합니다. 제목 표시줄과 크기 조절 테두리는 시스템 커서를 유지합니다.

<a id="keyboard"></a>

### 키보드

| 키 | 동작 |
|---|---|
| Return | `Input`에서 `submitBehavior`이(가) 지정한 동작: 제출(`onSubmit`), 제출 후 필드 떠나기, 또는 줄 바꿈(여러 줄 입력) |
| Shift+Return, Alt+Return | Return이 제출하는 여러 줄 입력에서의 줄 바꿈(Ctrl+Return은 제출) |
| Tab, Shift+Tab | 가장 최근 다이얼로그 안에서 다음 / 이전 텍스트 필드. Windows 다이얼로그처럼 필드의 텍스트가 선택됨 |
| Escape | 포커스된 필드를 떠남. 그렇지 않으면 텍스트 선택을 해제하고, 그다음 가장 최근 다이얼로그를 닫거나 뒤로 이동 |
| Alt+Left, 브라우저 뒤로 키, 마우스 뒤로 버튼 | 뒤로 이동(필드에서도 동작) |
| Ctrl+화살표, Home / End, Ctrl+Home / End 및 Shift 조합; Ctrl+Backspace / Delete | 모든 Windows 앱처럼 필드에서 단어와 줄 단위로 이동, 선택, 삭제 |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | 실행 취소, 다시 실행, 잘라내기, 복사, 붙여넣기, 모두 선택(`masked` 필드는 잘라내기와 복사를 거부함). Ctrl+A / Ctrl+C는 선택 가능한 텍스트를 선택하고 복사 |
| 화살표; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | 포커스된 뷰 주변 또는 마우스 아래의 스크롤 뷰를 한 줄, 한 페이지, 시작 / 끝으로 스크롤(필드에 포커스가 있을 때는 제외) |
| F11, Alt+F4 | 전체 화면, 창 닫기(`nsh package` 및 `nsh run` 앱) |
| Ctrl+R, F5 | 최신 빌드 다시 로드(`nsh run`) |

단축키는 어떤 키보드 레이아웃에서도 동작합니다(키릴 문자나 그리스 문자 레이아웃에서는 US 레이아웃에서 C를 입력하는 키가 Ctrl+C입니다). 입력기(중국어, 일본어 등)의 조합을 확정하는 Return은 절대 제출하지 않습니다. `onKeyPress`은(는) React Native가 보고하는 것과 같은 내용을 보고합니다: 입력된 텍스트, `"Enter"`, `"Backspace"`, `"Escape"`. 붙여넣은 텍스트는 보고되지 않습니다.

앱 자체의 단축키([`keymap`](../modules/nsh.md#keymap))는 포커스된 필드의 키, 탐색, 스크롤보다 우선합니다. Alt+F4, F11, Ctrl+Q는 바인딩할 수 없습니다.

다르거나 지원되지 않는 항목:

- **`WebView`**: 3D 변환(원근)이 적용된 뷰 안의 페이지는 표시되지 않으며, 페이지 위의 `backdropFilter`은(는) 페이지를 흐리게 하지 않습니다. `baseUrl`은(는) `http(s)` URL을 받습니다. 자체 창을 가져오는 네이티브 컴포넌트는 NSH가 그리는 모든 것 위에 유지됩니다.
- **비디오**: 설치된 코덱이 디코딩하는 형식만 지원하며, 포스터는 없고, 컨트롤 바는 `controls`와(과) 함께 항상 표시됩니다.
- **확대/축소 스크롤 뷰**(`zoomTo`, 줌 props)는 지원되지 않으며, 스크롤 인디케이터는 드래그할 수 없습니다.
- **`mixBlendMode` 및 `backdropFilter`**은(는) 그려지지만 `filter` 또는 3D 변환이 있는 뷰 안에서는 그려지지 않으며, `borderCurve: "continuous"`은(는) 원형 모서리를 그립니다.
- **텍스트**: 머리 및 중간 생략 부호는 한 줄에서만 지원됩니다(여러 줄은 끝 생략 부호가 적용됨). 컬러 이모지는 COLR 폰트만 지원하며, 스몰 캡스는 폰트가 지원하는 경우에만 동작합니다.
- **텍스트 입력**: 키보드 유형과 자동 완성은 적용되지 않습니다(소프트웨어 키보드가 없음). Tab으로 텍스트 필드 사이를 이동합니다. 마우스 오른쪽 클릭은 선택 가능한 텍스트(복사, 모두 선택)와 마찬가지로 편집 메뉴(실행 취소, 잘라내기, 복사, 붙여넣기, 삭제, 모두 선택)를 엽니다.
- **접근성**(UI Automation): 알림 다이얼로그와 토스트는 노출되지 않으며, 제목은 레벨 1로 보고됩니다.
- **입력 액세서리 뷰**와 **상태 표시줄**(데스크톱에 대응하는 것이 없음).

<a id="see-also"></a>

## 참고

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
