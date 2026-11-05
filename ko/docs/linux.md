---
title: "Linux"
description: "Linux의 GTK 4 창에서 Rust 및 TSX NSH 앱을 실행하고, 패키징하고, AppView로 GTK 앱에 임베드하는 방법과 Linux에서 달라지는 점을 설명합니다."
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

NSH 앱은 Linux에서도 실행됩니다. Linux 백엔드는 GTK 4 위젯으로 앱을 렌더링하고 Pango로 텍스트를 레이아웃합니다. 코어, 리액티브 그래프, 렌더러, Taffy 레이아웃, 네이티브 모듈은 iOS, Android와 동일하므로 앱 하나로 모든 플랫폼에서 실행됩니다. Linux에서 `os()`은(는) `Os::Linux`이며(TSX에서 `platform.os`은(는) `"linux"`) TSX의 `desktop={{…}}` props가 적용됩니다. 창 제목, 앱 고유의 타이틀 바, 메뉴 바, 컨텍스트 메뉴는 Rust에서는 `nsh_core::element::desktop`([데스크톱 타이틀 바](./rust.md#desktop-title-bars)), TSX에서는 [`nsh/desktop`](../modules/nsh-desktop.md)에서 가져옵니다.

<a id="requirements"></a>

## 요구 사항

- **GTK 4.14** 이상. Rust 앱의 러너나 NSH의 Linux 런타임을 빌드하려면(체크아웃에서, 또는 `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang`, Debian 및 Ubuntu(24.04 이상) 기준), Arch에서는 `gtk4 clang`, Fedora에서는 `gtk4-devel clang`이 필요합니다.
- 웹 뷰용 **WebKitGTK 6.0**(2.40 이상): 런타임을 빌드하려면 Debian과 Ubuntu에서는 `libwebkitgtk-6.0-dev`, Arch에서는 `webkitgtk-6.0`, Fedora에서는 `webkitgtk6.0-devel`이 필요합니다. 개발 호스트와 릴리스 러너는 기본적으로 WebKitGTK를 사용하므로, 패키징된 앱이 실행되는 환경에도 WebKitGTK 6.0이 있어야 합니다(Debian과 Ubuntu에서는 `libwebkitgtk-6.0-4`, GNOME 데스크톱에는 포함되어 있습니다). 개발 파일이 없는 머신에서 `cargo xtask dist`을 실행하면 웹 뷰가 플레이스홀더인 런타임이 빌드되며, 이 런타임의 앱은 GTK만 있으면 됩니다.
- 앱이 재생하는 비디오 형식에 필요한 **GStreamer** 플러그인(GTK는 GStreamer로 비디오를 재생합니다).

<a id="running-an-app"></a>

## 앱 실행

Linux에서 `nsh run`은(는) 앱을 GTK 창으로 엽니다. Rust 앱은 해당 디렉터리에서 실행합니다.

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh`은(는) 크레이트와 함께 디버그 러너를 빌드하고 앱을 열며, 로그(`log::info!` 등)는 터미널에 출력됩니다. 크레이트의 Rust 코드가 바뀌면 러너를 다시 빌드하고 앱을 재시작합니다. `cargo run`은(는) `nsh init --template rust`이(가) 작성하는 크레이트의 `src/main.rs`에서 같은 루트를 시작합니다. [`run_app`](#embedding-in-a-gtk-app)과(와) `AppSource::Rust`을(를) 참고하세요.

TSX 앱은 엔트리를 지정하며 기본적으로 390×844 창으로 열리고, 다른 타깃과 마찬가지로 핫 리로드, 터미널 로그, 에러 오버레이를 지원합니다.

```sh
nsh run App.tsx
```

체크아웃에서는 `nsh run`이(가) 먼저 개발 호스트(`nsh-linux-host`)를 빌드하며, Linux에서 만든 배포본에는 `runtime/linux/`에 포함되어 있습니다. Ctrl-C는 창을 닫고, 창을 닫으면 `nsh run`이(가) 종료됩니다. 호스트는 빌드된 번들을 단독으로 실행할 수도 있습니다.

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size`은(는) 창의 기본 크기입니다(TSX 앱). 타일링 창 관리자는 창에 다른 크기를 줄 수 있습니다.

<a id="packaging"></a>

## 패키징

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

디렉터리를 만들고, 같은 내용을 아카이브로도 만듭니다.

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

실행 파일은 자신과 같은 위치에 있는 `nsh/`을(를) 찾습니다(예를 들어 `~/.local/bin`에 둔 심볼릭 링크로도 동작합니다). GTK 4, Pango, WebKitGTK 6.0이 앱이 실행되는 환경에 설치되어 있어야 합니다. 데스크톱의 런처에 앱을 표시하려면 실행 파일(또는 링크)을 `PATH`에, `.desktop` 파일을 `~/.local/share/applications`에, 아이콘을 아이콘 테마 디렉터리에 두세요. `--run`은(는) 패키징한 뒤 앱을 실행합니다.

<a id="embedding-in-a-gtk-app"></a>

## GTK 앱에 임베드하기

NSH 저장소의 `nsh-platform-linux` 크레이트는 Rust GTK 앱에 `AppView`을(를) 제공합니다. NSH 엔진 하나를 GTK 위젯으로 사용하는 것입니다. 각 `AppView`은(는) 독립적이며 여러 개를 동시에 실행할 수 있습니다. 이 위젯은 Rust 루트, 즉 크레이트의 루트 컴포넌트를 실행합니다.

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens`은(는) 루트에 [테마](./rust.md#theme)를 지정하고, `Root::app_id`은(는) 데이터가 저장되는 id를 지정합니다. `nsh build`이(가) 작성한 TSX 번들은 `asset_base`을(를) 해당 `assets` 디렉터리로 설정하여 같은 뷰에 로드할 수 있습니다.

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load`은(는) 실행 중이던 것을 대체하고, `stop`은(는) 앱을 종료합니다. `asset_base`은(는) `asset:/` URI를 어디서 해석할지 알려 줍니다(`AssetBase::Directory` 또는 `AssetBase::Http`). 바이트코드 번들(`bundle.nshc`)은 `unsafe { Bundle::bytecode(bytes) }`로 로드합니다. QuickJS 바이트코드는 신뢰된 입력이므로 앱 자체의 파일에서만 로드하세요. 독립 실행형 창은 `nsh_platform_linux::run_app(source, options)`이며, `AppSource::Rust(root)` 또는 `AppSource::Bundle(bundle)`을(를) 사용합니다.

`AppOptions::cache`(또는 이후에 로드되는 앱을 위한 `AppView::set_cache`)은(는) 앱이 캐시, [다운로드한 이미지](./images-and-assets.md#kept-on-disk)를 보관할 위치와 각 앱이 보관할 용량을 설정합니다(`CacheOptions`: 기본값은 시스템 캐시 디렉터리와 이미지 256 MiB).

`AppView::set_locale(Some(locale))`과(와) `AppView::set_font_scale(Some(scale))`은(는) 시스템 설정 대신 앱의 언어와 텍스트 크기를 앱에 지정합니다(`None`은(는) 다시 시스템 설정을 따릅니다). `locale()`, `Intl`, `fontScale()` 및 텍스트가 즉시 따라 바뀝니다([기기 및 환경](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))`은(는) 앱의 [테마](./tailwind.md#theme-tokens) 위에 앱의 브랜드를 적용합니다. `nsh.json`의 `"theme"` 형식으로 된 테마 파일이며, 같은 이름의 토큰은 라이트 모드와 다크 모드 모두에서 앱의 토큰보다 우선하고 나머지 앱 토큰은 그대로 유지됩니다. `bg-primary` 같은 클래스는 즉시 다시 스타일링되며, 이후에 로드되는 앱은 이 테마로 시작합니다(`None`은(는) 앱에 고유한 테마를 되돌려 줍니다. 파싱되지 않는 파일은 오류이며 아무것도 바꾸지 않습니다).

네이티브 컴포넌트는 `AppView::register_component`로 등록합니다. [네이티브 컴포넌트](./native-components.md#registering-on-linux-rust)를 참고하세요. `set_ui_sets(sets)`은(는) 모든 엔진이 제공하는 UI 세트를 설정합니다. NSH의 세트(`nsh_base::registry()`)와 사용자 크레이트의 세트(`#[native_module]`이(가) 만드는 `my_app::registry()`)이며, 따라서 뷰가 로드하는 TSX에서 Rust 컴포넌트와 모듈도 import할 수 있습니다.

<a id="what-differs-on-linux"></a>

## Linux에서 다른 점

환경은 데스크톱의 환경입니다. 안전 영역과 키보드 높이는 0이고, `idiom()`은(는) 데스크톱입니다(`platform.idiom`은(는) `"desktop"`). `os_version()`(`platform.version`)은(는) 커널의 메이저 및 마이너 버전이며, 다크 모드는 데스크톱의 설정(XDG settings portal을 통해)을 실시간으로 따릅니다. [기기 및 환경](./device-and-environment.md)을 참고하세요.

<a id="keyboard"></a>

### 키보드

| 키 | 동작 |
|---|---|
| Return | `Input`에서 `submitBehavior`이(가) 지정한 동작: 제출(`onSubmit`), 제출 후 필드 떠나기, 또는 줄 바꿈(멀티라인 입력) |
| Shift+Return, Alt+Return | return이 제출인 멀티라인 입력에서 줄 바꿈(Ctrl+Return은 제출) |
| Tab, Shift+Tab | 가장 최근 다이얼로그 안에서 화면 순서상 다음 / 이전 필드 |
| Escape | 포커스된 필드를 떠납니다. 그렇지 않으면 텍스트 선택을 해제하고, 그다음에는 가장 최근 다이얼로그를 닫거나 뒤로 이동합니다 |
| Alt+Left, Back 키, 마우스 뒤로 가기 버튼 | 뒤로 이동(필드에서도 동작) |
| Ctrl+방향키, Home / End, Shift 조합; Ctrl+Backspace / Delete | 모든 GTK 앱처럼 필드에서 단어와 줄 단위로 이동, 선택, 삭제 |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | 실행 취소, 다시 실행, 잘라내기, 복사, 붙여넣기, 모두 선택(`masked` 필드는 잘라내기와 복사를 거부함). Ctrl+A / Ctrl+C는 선택 가능한 텍스트를 선택하고 복사 |
| 방향키; Page Up / Down, Space, Shift+Space; Home / End | 포커스된 뷰 주변 또는 마우스 아래의 스크롤 뷰를 한 줄, 한 페이지, 처음 / 끝으로 스크롤(필드에 포커스가 있을 때는 제외) |
| Ctrl+W, F11, Ctrl+Q | 창 닫기, 전체 화면, 종료(`nsh package` 및 `nsh run` 앱) |
| Ctrl+R | 최신 빌드를 다시 로드(`nsh run`) |

앱 자체의 단축키([`keymap`](../modules/nsh.md#keymap))는 창 전체에 적용되는 단축키 컨트롤러입니다. Ctrl+Q와 F11은 바인딩할 수 없습니다.

단축키는 어떤 키보드 레이아웃에서도 동작합니다(키릴 또는 그리스 문자 레이아웃에서는 US 레이아웃에서 C를 입력하는 키가 Ctrl+C입니다). 입력기(중국어, 일본어 등)의 조합을 확정하는 return은 절대 제출하지 않습니다. `onKeyPress`은(는) React Native가 보고하는 것과 같은 값을 보고합니다. 입력된 텍스트, `"Enter"`, `"Backspace"`, `"Escape"`이며, 붙여넣은 텍스트는 보고되지 않습니다.

웹 뷰는 NSH의 뷰 안에 그려지는 WebKitGTK 페이지입니다. 시트, 다이얼로그, 토스트와 그 뒤의 뷰는 페이지 위에 그려지고, 부모는 페이지를 클리핑하고 페이드시킵니다. 웹사이트 데이터(쿠키, 스토리지, 캐시)는 앱별로 `~/.local/share/<app id>/webkit`과(와) `~/.cache/<app id>/webkit` 아래에 보관됩니다. `webview` 기능은 프레임의 페이지에도 적용됩니다. 앱에 권한이 부여되지 않은 호스트의 `iframe`은(는) 비어 있게 됩니다. 페이지에서 Escape는 텍스트 필드처럼 페이지를 떠납니다(페이지가 Escape를 사용하는 경우 제외). Alt+Left와 마우스 뒤로 가기 버튼은 페이지에 히스토리가 있는 동안 페이지 안에서 뒤로 이동합니다.

지원되지 않는 항목:

- **비디오 `rate`**: GTK는 일반 속도로만 재생합니다. `onEnd`은(는) 반복하지 않는 비디오에서만 발생합니다.
- **스크롤 뷰 확대/축소**(`zoomTo`, zoom props).
- **`mixBlendMode` 및 `backdropFilter`**(배경색은 여전히 그려짐). `borderCurve: "continuous"`은(는) 원형 모서리를 그립니다.
- **입력 액세서리 뷰** 및 **상태 표시줄**(데스크톱에 대응하는 개념 없음).
- **접근성**: `accessible` 그룹화, 커스텀 `accessibilityActions`. 대신 라이브 리전이 안내됩니다.

<a id="see-also"></a>

## 참고

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [패키징](./packaging.md)
- [플랫폼별 코드](./platform-specific.md)
