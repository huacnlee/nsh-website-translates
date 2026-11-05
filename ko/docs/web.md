---
title: "웹"
description: "Rust 또는 TSX로 웹 앱을 빌드하세요. Native Shell 컴포넌트가 HTML과 CSS로 렌더링되며, 브라우저에서 개발하고 모든 정적 호스트나 CDN에 배포할 수 있습니다."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# Web

Native Shell로 네이티브 플랫폼과 동일한 컴포넌트, 스타일, 애플리케이션 로직을 사용해 웹 앱을 빌드합니다. NSH는 인터페이스를 HTML 요소와 CSS로 렌더링하며, 텍스트, 이미지, 입력, 스크롤, 시각 스타일, 상호작용은 브라우저의 DOM과 웹 API를 사용합니다.

`nsh package --target web` 명령은 앱을 모든 웹 서버나 CDN에 올릴 수 있는 정적 사이트로 게시하고([앱 게시](#publish-an-app)), `nsh run --target web` 명령은 앱을 편집하는 동안 브라우저에서 실행합니다([브라우저에서 개발하기](#develop-in-the-browser)). 이 사이트의 모든 라이브 데모는 이 웹 백엔드를 사용합니다.

게시된 TSX 앱은 브라우저의 JavaScript 엔진을 사용합니다. 패키징 시 각 앱에 전용 런타임을 링크하며, 이 런타임에는 앱이 import하는 `nsh/base` 컴포넌트와 표준 모듈만 포함됩니다. 코어 컴포넌트로 만든 앱은 약 1.1 MB를 다운로드합니다. 구문 강조 데이터는 코드가 처음 강조될 때 로드됩니다.

<a id="what-runs-where"></a>

## 어디서 무엇이 실행되는가

페이지는 CSS로 스타일링된 HTML 요소로 구성됩니다. NSH는 컴포넌트 업데이트를 DOM 변경 묶음으로 변환하고, 브라우저는 인터페이스를 표시하며 스크롤, 텍스트 선택, 입력을 처리합니다. WebAssembly는 컴포넌트 상태, 레이아웃, 업데이트를 담당하는 공유 Rust 엔진을 호스팅합니다. Rust 앱의 크레이트가 함께 컴파일되어 들어가거나, TSX 앱의 코드를 ES module로 실행하는 브라우저의 JavaScript 엔진과 함께 동작하며, 게시된 앱, dev 서버의 페이지, 이 사이트의 데모, 플레이그라운드 모두 마찬가지입니다.

모든 네이티브 플랫폼에서 엔진은 자체 스레드를 가지며 커밋마다 `MountBatch` 하나를 메인 스레드에 전달합니다. 브라우저 페이지에는 스레드가 하나뿐이므로, 웹 빌드는 페이지의 이벤트 루프에서 같은 엔진을 단계별로 구동합니다(`nsh_engine::LocalEngine`):

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **레이아웃은 코어가 담당합니다.** 모든 뷰는 Taffy가 계산한 프레임에 절대 위치로 배치된 요소이므로 flexbox, grid, `aspectRatio`, 퍼센트 값이 기기에서와 똑같이 동작합니다. 브라우저 자체 레이아웃은 관여하지 않습니다.
- **스타일은 Rust에서 CSS로 변환됩니다.** 배경, 테두리, 반경, 그림자(`boxShadow`, `textShadow`), 그라디언트, 필터, `backdropFilter`, 변형, `transformOrigin`, `outline`, `mixBlendMode`, 트랜지션, 내장 키프레임 애니메이션이 CSS 속성이 됩니다. Tailwind 클래스, `active:`, `hover:`, `focus:` 상태, `dark:` 모두 기기에서처럼 네이티브로 해석됩니다.
- **텍스트는 Rust에서 레이아웃됩니다.** 브라우저의 글꼴 측정값(`CanvasRenderingContext2D.measureText`)을 사용하며, 레이아웃이 정한 위치에 run 단위로 그려지므로 측정한 그대로 그려집니다. 줄바꿈은 공백 뒤, CJK 문자 주변, `\n`에서 일어나며, `numberOfLines` 사용 시 말줄임표로 잘립니다.
- **네이티브 애니메이션은 Rust에서 실행됩니다.** `requestAnimationFrame` 기준으로 동작하며, 대상은 `Animated` timing, spring, decay, `interpolate`, `opacity`, `translate`, `rotate`, `scale`에 바인딩된 애니메이션 값, `transform` 및 `backgroundColor` 단계, `pan`로 바인딩된 드래그, 스크롤 연동 값, 캔버스 인수입니다. 기기에서와 마찬가지로 프레임마다 JS가 관여하지 않습니다. `LayoutAnimation`, 스타일 트랜지션, `animate-*` 키프레임, 화면 전환은 데스크톱 백엔드에서와 같이 움직이며, `prefers-reduced-motion` 설정 시 모두 꺼집니다(화면은 페이드).
- **입력:** `activeStyle` / `active:` 피드백이 있는 프레스와 롱 프레스, responder 시스템(`onTouch*`, `PanResponder`), 네이티브 드래그, 두 손가락 핀치와 회전, 스크롤 뷰(브라우저의 스크롤), 당겨서 새로고침, 확대 가능한 스크롤 뷰(핀치, Ctrl+휠, 터치패드 핀치, `zoomTo`), `<Input>`(제어 값, 포커스, 제출), `Canvas`, `NavStack`, `NavPage`이 페이지의 `header`, `Dialog`과 연동됩니다.
- **시스템 UI는 페이지 안에 그려집니다.** `AlertDialog`의 모습은 데스크톱 브라우저에서는 데스크톱 백엔드의 대화상자와, 휴대폰에서는 iOS의 대화상자와 같습니다(`desktop` 방식, 아래 참조). 커스텀 글꼴은 브라우저가 로드한 뒤 다시 측정되며, 앱은 첫 프레임을 표시하기 전에 import한 글꼴을 기다립니다.
- **대화상자**는 데스크톱 백엔드에서처럼 앱의 팝업과 배경막(backdrop)을 표시하는, 앱 전체 위의 레이어입니다. Escape, 브라우저의 뒤로 가기 버튼, 배경막 클릭으로 닫을 수 있으며(`closeOnEscape`, `closeOnBackdropPress`), `animation`, `onOpen`, `onClose`, `onCancel`, `onOpenChange` 모두 기기에서와 같이 동작합니다. [앱을 임베드하는](#embed-it-in-a-page) 페이지가 레이아웃 일부에 앱을 넣는 경우, 대신 대화상자와 알림을 브라우저 창 전체 위에 표시할 수도 있으며(`dialogs: "viewport"`), 이는 iOS와 Android가 화면 전체 위에 표시하는 방식과 같습니다.

<a id="keyboard-mouse-and-touch"></a>

## 키보드, 마우스, 터치

게시된 앱은 데스크톱 브라우저에서는 데스크톱 앱처럼, 휴대폰 브라우저에서는 휴대폰 앱처럼 동작합니다.

- **휠과 터치패드**는 해당 축으로 아직 움직일 수 있는 가장 안쪽 스크롤 뷰를 스크롤하며(세로로 움직일 수 있는 뷰가 없으면 세로 휠이 가로 목록을 스크롤합니다), 스크롤이 끝날 때까지 그 뷰에 머뭅니다. 휠 눈금은 부드럽게 이동하고, 페이징 및 스냅 뷰는 스크롤 한 번에 한 페이지씩 이동합니다. Ctrl + 휠과 터치패드 핀치는 페이지를 확대하는 대신 네이티브 핀치 값으로 뷰를 핀치합니다. 데스크톱 플랫폼과 마찬가지로 마우스 드래그로는 스크롤되지 않으며, 마우스 드래그는 pan, responder 시스템, 텍스트 선택으로 전달됩니다. 스크롤 뷰는 데스크톱 플랫폼에서와 같이 다음을 보고합니다: `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End`, `onScrollEnd`.
- **키보드**: Tab과 Shift+Tab은 pressable과 입력 사이에서 포커스를 이동합니다(앱의 `focus:` 스타일이 키보드 포커스를 표시합니다). Return은 포커스된 pressable을 누르고, Space는 뗄 때 누릅니다. 방향키, Page Up / Page Down, Space, Home, End는 포커스 주변 또는 마우스 아래의 스크롤 뷰를 스크롤합니다. Escape는 필드를 벗어나고, 대화상자를 닫고, 그다음 뒤로 갑니다. `keymap` 단축키는 브라우저에서 동작하며 그 자리에서 매칭됩니다(`mod` 키는 Mac의 Safari와 Chrome에서는 Command, 그 외에는 Control입니다).
- **뒤로 가기**: Escape, Alt+Left(Mac에서는 Cmd+[), 마우스의 뒤로 가기 버튼은 Android의 뒤로 가기 버튼처럼 가장 최근 대화상자를 닫거나 가장 안쪽 스택을 pop합니다. `popOnBack` 및 `onBackPress`도 그곳과 같이 동작합니다. 앱이 페이지 전체일 때는 push된 모든 페이지와 열린 모든 대화상자가 브라우저 히스토리 항목이 되므로, 브라우저의 뒤로 가기 버튼이 앱 안에서 뒤로 이동합니다.
- **터치**: 스크롤 뷰만 pan되며, 페이지 자체는 앱 아래에서 스크롤, 확대, 당겨서 새로고침되지 않고 탭에는 지연이 없습니다. iframe에서는 앱이 처리하지 않는 스와이프가 임베드한 페이지를 스크롤합니다. 네이티브 pan, 핀치, responder 시스템이 있는 뷰의 드래그는 앱이 처리합니다.
- **접근성**: `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion`, `accessibilityElementsHidden` 모두 ARIA로 변환됩니다. `announce` 호출은 live region으로 읽히고, `setAccessibilityFocus` 호출은 포커스를 이동합니다. 대화상자나 알림 아래의 뷰는 inert 상태입니다.
- **선택과 메뉴**: 데스크톱 브라우저에서 텍스트는 웹 페이지에서처럼 기본적으로 선택할 수 있지만, 상호작용 요소(press 또는 touch 핸들러가 있는 뷰: 버튼, pressable 행, 탭)와 `userSelect: "none"` 또는 `select-none` 속성이 있는 텍스트는 예외입니다. 마우스를 드래그하면 선택되고, Ctrl/Cmd+C는 줄 단위로 복사하며, Ctrl/Cmd+A는 선택이 속한 텍스트 전체를 선택합니다. 휴대폰과 태블릿 브라우저에서는 네이티브 앱처럼 `userSelect: "text"` 속성이 있는 텍스트만 선택할 수 있습니다. 브라우저의 컨텍스트 메뉴는 선택 가능한 텍스트와 입력에서만 나타납니다.


<a id="apps-with-rust-components"></a>

## Rust 컴포넌트를 사용하는 앱

Rust로 작성한 앱([Rust로 빌드하기](./rust.md))은 해당 디렉터리에서 게시하고 브라우저에서 실행할 수 있습니다:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

`nsh.json`에 앱의 루트 컴포넌트(`"root"`)가 지정되면, 페이지는 앱의 Rust 코드와 NSH의 페이지 스크립트로만 이루어집니다. `nsh.wasm`에 엔진, 컴포넌트, 앱의 크레이트가 들어 있고, 사이트에 `app.js` 자체가 없으며, 페이지는 런타임과 글꼴이 로드되는 즉시 루트를 마운트합니다. Rust 갤러리 전체는 3.3 MB(gzip 1.06 MB, brotli 0.75 MB)로 TSX 앱의 런타임보다 작습니다. TSX 엔트리(`nsh package App.tsx --target web`) 아래에서는 같은 앱이 TSX 앱처럼 브라우저의 JavaScript 엔진에서 실행되며 크레이트의 컴포넌트와 모듈을 import합니다.

어느 쪽이든 크레이트의 에셋(`assets!()`)은 앱의 에셋과 함께 게시되며, 크레이트의 글꼴은 첫 프레임 전에 로드됩니다. `nsh run --target web` 중에 크레이트의 Rust 코드를 변경하면 런타임이 다시 빌드되고 열려 있는 페이지가 이를 스스로 로드하며, TSX 편집은 계속 핫 업데이트로 반영됩니다. 개발용 런타임은 증분 빌드되므로 크레이트 변경은 약 1초 안에 준비되고, `nsh package` 명령은 게시용 런타임을 크기에 맞게 최적화하여 빌드합니다.

웹을 포함해 모든 플랫폼에서 실행되는 Rust 코드는 엔진의 서비스를 사용합니다. `fetch(url).await` 호출은 JS의 `fetch` 호출과 같은 네트워크 스택(여기서는 브라우저의 스택이며 CORS 규칙을 따름)을 통해 HTTP 요청을 보내고, `timer`, `set_timeout`, `set_interval` 호출은 대기하며, `nsh_core::time::Instant`, `nsh_core::time::unix_ms()` 호출은 시계를 읽습니다. `background`, `blocking` 호출은 네이티브 타깃의 스레드에서 작업을 실행합니다.

빌드에는 런타임 자체 빌드와 마찬가지로 Rust 타깃과 WebAssembly로 컴파일하는 clang이 필요합니다. 필요한 것: `rustup target add wasm32-unknown-unknown`, 그리고 `clang`, `llvm-ar`(macOS에서는 Homebrew의 `llvm` 같은 LLVM 툴체인을 `CC_wasm32_unknown_unknown`, `AR_wasm32_unknown_unknown` 설정으로 지정).

<a id="browser-apis-from-rust"></a>

### Rust에서 브라우저 API 사용

크레이트는 [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/)과 그 `web-sys`, `js-sys` 크레이트를 통해 브라우저 자체 API를 `#[cfg(target_arch = "wasm32")]` 뒤에서 호출할 수 있습니다. WebSocket, `IndexedDB`, 클립보드, 모든 Web API, 그리고 크레이트 자체의 JS(`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`)가 그 대상입니다. 앱의 웹 런타임이 이런 방식으로 JS를 호출하면(`JsValue` 변환 포함), `nsh` 명령은 런타임에 `wasm-bindgen` CLI를 실행하고, 그 glue와 크레이트의 JS를 런타임 옆에 함께 배포합니다. 개발 중이든 게시된 사이트든 마찬가지입니다. CLI의 버전은 런타임이 링크하는 `wasm-bindgen` 크레이트의 버전이며, 이는 `nsh`에 명시됩니다. `cargo install wasm-bindgen-cli --version <version> --locked` 명령이 이를 설치합니다(`NSH_WASM_BINDGEN` 설정은 `PATH` 외의 위치에 있는 CLI를 지정합니다). wasm-bindgen을 링크하지만 그것을 통해 JS를 호출하지 않는 런타임(의존성의 기본 기능을 통해 링크되는 경우)은 다른 모든 런타임과 똑같이 빌드됩니다.

크레이트는 사용하는 API를 `web-sys` 기능으로 지정하며, `wasm-bindgen` 고정은 해당 버전, 즉 CLI의 버전을 빌드마다 동일하게 유지합니다:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

브라우저의 콜백(메시지 도착, 페이지의 타이머)은 앱의 태스크를 깨우며, 태스크는 즉시 실행됩니다:

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

크레이트의 브라우저 API 호출은 다른 플랫폼에서 크레이트의 네이티브 코드가 앱의 권한으로 실행되는 것처럼 페이지 자체의 권한으로 실행됩니다. `nsh.json`의 capability는 엔진을 거치는 것(`fetch`, 앱의 JS)을 제어하고, 브라우저의 규칙(CORS, 페이지의 Content-Security-Policy)은 페이지가 보내는 모든 요청을 제어합니다.

<a id="publish-an-app"></a>

## 앱 게시

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` 명령은 `.nsh/out/<Name>/` 디렉터리를 생성하며(다른 디렉터리에는 `--out`), 프런트엔드 빌드와 같은 구조로 페이지 하나와 내용에 따라 이름이 붙은 파일들로 구성됩니다.

| 파일 | 설명 |
|---|---|
| `index.html` | 앱의 페이지: 제목으로 쓰이는 앱 이름, 아이콘, `appearance` 색상, 로딩 표시기, 앱을 로드하거나 시작할 수 없을 때의 메시지 |
| `manifest.webmanifest` | 브라우저가 앱을 설치할 때 사용하는 이름, id, 아이콘, 색상 |
| `nsh.<digest>.js` | DOM 런타임(minified, 79 KB, brotli 시 22.5 KB) |
| `nsh.<digest>.wasm` | Rust 엔진, 레이아웃, 컴포넌트와 Rust 앱 자체 크레이트. TSX는 브라우저 JavaScript에서 실행되며, 패키징 시 앱의 첫 화면이 import하는 컴포넌트와 표준 모듈만 링크됩니다. |
| `nsh-<name>.<digest>.wasm` | 첫 화면 이후에 앱이 사용하는 컴포넌트, 표준 모듈, 셰이더: 첫 화면이 표시된 뒤 백그라운드에서 다운로드됩니다 |
| `<file>.br`, `<file>.gz` | 미리 압축된 각 파일(미리 압축된 파일을 전송하는 호스트용) |
| `nsh-syntaxes.<digest>.bin` | 코드 강조에 사용하는 구문 정의(bat 세트: 0.92 MB, brotli 시 0.8 MB). 코드 블록, `Editor` 또는 `DiffView`에서 어떤 언어의 코드를 처음 표시할 때 다운로드됩니다 |
| `nsh-bindgen.<digest>.js` | [Rust에서 브라우저 API](#browser-apis-from-rust)를 호출하는 크레이트가 있는 앱의 wasm-bindgen glue(minified) |
| `snippets.<digest>/<crate>-<hash>/…` | glue가 import하는 해당 크레이트들의 JS(`inline_js`, `module = "/js/…"`). wasm-bindgen이 부여한 경로 아래에 위치합니다 |
| `app.<digest>.js` | ES module로 컴파일된 TSX 엔트리, 브라우저가 로드합니다. |
| `host.<digest>.js` | 페이지의 호스트, `nsh.json` `web.host`([호스트의 함수](#the-hosts-functions)) |
| `<name>.<digest>.js` | `import()`에 의해 필요할 때 로드되는 ES module. |
| `assets/<path>.<digest>.<ext>` | 앱이 import하는 모든 에셋, 사용될 때 해당 URL에서 로드됩니다(글꼴은 이를 등록하는 코드가 실행되기 전에 로드됩니다. 텍스트를 해당 글꼴로 측정하기 때문이며, 앱 시작 전 또는 글꼴을 import하는 청크와 함께 로드됩니다) |
| `icons/<size>.<digest>.png` | `nsh.json`의 아이콘, 32(favicon), 180(`apple-touch-icon`), 192, 512 픽셀 |

`<digest>` 부분은 파일 내용의 SHA-256 앞부분입니다. 파일 이름은 내용이 바뀔 때에만 바뀌므로, 새 릴리스에서는 `index.html` 및 실제로 변경된 파일만 바뀝니다. 모든 URL은 상대 경로이므로 사이트는 어떤 호스트의 어떤 디렉터리에서도 동작합니다(`https://example.com/apps/counter/`).
<a id="runtime-size"></a>

### 런타임 크기

패키징은 앱마다 고유한 `nsh.<digest>.wasm` 파일을 링크합니다. 이 파일에는 엔진과, 앱의 첫 화면이 import하는 `nsh/base` 컴포넌트, 표준 모듈, 셰이더가 들어 있습니다. 앱의 다른 화면이 import하는 항목은 첫 화면이 표시된 뒤 백그라운드에서 다운로드됩니다. 크레이트가 [Rust에서 브라우저 API](#browser-apis-from-rust)를 호출하는 앱은 크레이트를 포함한 전체 런타임을 `nsh.<digest>.wasm`에 담아 받습니다. 측정 도구: `nsh package --target web` (MB = 10^6 바이트)

| 앱 | 사용하는 것 | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | 핵심 컴포넌트 | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | 모든 컴포넌트, `zlib`, 셰이더 | 4.13 MB | 1.36 MB | 1.01 MB |

<a id="deploy-it"></a>

### 배포하기

디렉터리를 정적 호스트 어디에든 업로드하면 됩니다. CDN 뒤의 오브젝트 스토어, Cloudflare Pages, Netlify, GitHub Pages, nginx 등이 해당합니다. 두 가지 규칙을 지키면 빠르게 로드되고 안정적으로 업데이트됩니다.

| 파일 | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (로드할 때마다 재검증하므로 릴리스가 즉시 반영됩니다) |
| 그 외 모든 파일 | `public, max-age=31536000, immutable` |

`.wasm` 파일은 `application/wasm` 타입으로 제공하고(그러면 브라우저가 다운로드하는 동안 컴파일합니다), 사전 압축된 사본은 이를 지원하는 브라우저에 전송하세요. nginx의 `brotli_static on; gzip_static on;`, Caddy의 `file_server { precompressed br gzip }`, 또는 Brotli로 압축하는 CDN을 사용할 수 있습니다. Brotli를 사용하면 런타임이 gzip보다 약 4분의 1 작아집니다. `nsh package --target web --run` 사이트는 `http://127.0.0.1:4173/`에서 이 방식으로 제공됩니다.

웹용으로 게시한 앱은 패키징된 네이티브 앱처럼 실행됩니다. 릴리스로 실행되며, `nsh.json`에 선언된 capability를 따르고([샌드박스와 capability](./sandbox-and-capabilities.md)), TSX 앱은 브라우저의 JavaScript 엔진에서 실행됩니다. `network`을 제한하는 경우 페이지에는 선언된 호스트(와 페이지 자체의 origin)를 담은 Content-Security-Policy `connect-src`도 포함되므로, 브라우저가 다른 모든 호스트로의 요청과 리디렉션 홉을 직접 차단합니다. 앱 시작을 막는 오류는 페이지에 표시되고, 이후의 오류는 브라우저 콘솔로 보내집니다.

<a id="embed-it-with-an-iframe"></a>

### iframe으로 임베드하기

웹에는 임베딩 API가 없습니다. 게시한 앱은 `<iframe>`로 임베드하세요. 앱의 창 크기는 iframe의 크기입니다.

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## 브라우저에서 개발하기

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

이 명령은 개발 서버를 시작하고 해당 페이지의 주소 `http://127.0.0.1:8790/`를 출력합니다. 아무 브라우저에서나 열면 됩니다. 이 페이지는 다른 개발 호스트와 마찬가지로 앱의 각 빌드를 실행하고, 빌드 오류와 런타임 오류를 앱 위에 표시하며, 앱의 로그를 터미널로 보냅니다. Rust 앱의 크레이트를 변경하면 런타임이 다시 빌드되고 열려 있는 페이지가 이를 자동으로 로드합니다. TSX 수정 사항은 그 자리에서 적용됩니다(핫 업데이트). 같은 네트워크의 휴대폰에서는 `nsh run`이 그 아래에 출력하는 주소(`on this network: http://192.168.…:8790/`)를 열면 됩니다. 웹 런타임이 있으면 `nsh dev`도 같은 페이지를 제공합니다(배포판에는 항상 포함되어 있습니다).

<a id="build-the-websites-player"></a>

## 웹사이트 플레이어 빌드하기

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

출력 디렉터리에는 다음 파일이 들어 있습니다.

| 파일 | 설명 |
|---|---|
| `gallery/nsh.<digest>.wasm` | 갤러리의 런타임으로, `nsh package`이 갤러리용으로 링크합니다 (모든 컴포넌트와 `zlib` 사용: 약 11.8 MB, gzip 압축 시 3.6 MB) |
| `gallery/nsh-syntaxes.<digest>.bin` | 런타임이 코드를 하이라이트하는 데 쓰는 구문 정의로, 데모가 특정 언어의 코드를 처음 표시할 때 가져옵니다 |
| `nsh-playground.wasm` | 위와 동일하며 NSH의 TSX 컴파일러가 추가됩니다. [플레이그라운드](#the-playground)용입니다 (약 8 MB, gzip 압축 시 2.4 MB) |
| `gallery/nsh.<digest>.js` | DOM 런타임(minified): wasm을 로드하고, 배치를 적용하며, 입력을 이벤트로 변환합니다 |
| `index.html` | 플레이어 페이지: `#<name>`용으로 `demos/<name>.js`을 실행합니다 |
| `nsh.wasm`, `nsh.js`, `browser/` | 플레이어가 로드하는 런타임: 엔진, DOM 런타임, 브라우저 호스트의 모듈 |
| `demos/<name>.js` | `nsh build --release`가 컴파일한 각 데모: ES 모듈 |
| `gallery/` | `nsh package --target web`로 게시한 갤러리 앱으로, [Gallery](/gallery) 페이지에 표시됩니다 |

디렉터리는 아무 정적 서버로나 제공할 수 있습니다(스트리밍 컴파일을 위해 `application/wasm` MIME 타입이 필요합니다). 그런 다음 `index.html#counter`를 여세요.

<a id="the-playground"></a>

## 플레이그라운드

[Playground](/playground)에서는 브라우저에서 앱을 편집하고 실행할 수 있습니다. 페이지는 NSH 자체의 JSX 컴파일러(rolldown 없이 `nsh-playground.wasm`에 내장)로 TSX를 컴파일하고, 타이핑이 멈출 때마다 브라우저의 JavaScript 엔진에서 실행합니다. 이 사이트의 모든 데모에는 **Edit in Playground** 링크가 있으며, **Share**는 코드를 링크 자체에 담으므로 서버에는 아무것도 저장되지 않습니다.

플레이그라운드 앱은 하나의 모듈입니다. NSH의 모듈(`nsh`과 `nsh/*`)은 import할 수 있지만, 다른 파일이나 패키지는 import할 수 없습니다. `console.log` 출력과 오류는 휴대폰 화면 아래에 표시됩니다.

이 컴파일러는 Rust 함수 `nsh_bundler::compile_module(name, source, ui_sets)`로도 제공되며, 크레이트의 `bundle` 기능 없이 사용할 수 있습니다.

<a id="embed-it-in-a-page"></a>

## 페이지에 임베드하기

Rust 앱은 게시된 사이트를 [iframe](#embed-it-with-an-iframe)으로 임베드합니다. TSX의 경우 `nsh.js`은 ES 모듈입니다. `createPlayer`는 런타임을 컨테이너에 로드하고, `runModule(url)`는 `nsh build`가 작성하는 번들(`bundle.js`, ES 모듈)을 브라우저의 JavaScript 엔진에서 앱 고유의 realm으로 시작하며, 이전에 실행 중이던 앱을 대체합니다. 이 함수는 모듈이 로드되면 resolve되고 모듈을 중단시킨 오류와 함께 reject되는 promise를 반환하며, 플레이어도 이 오류를 보고합니다(`onError`).

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets`(`asset:/` 경로에서 URL로의 맵)는 `assetBase`을 대체하고, `readAsset(uri)`는 엔진이 즉시 필요로 하는 에셋(글꼴)의 바이트를 반환하거나 `null`, `data`는 런타임이 처음 필요할 때 가져오는 파일을 해당 URL에 매핑하며(`syntaxes`: `nsh-syntaxes.<digest>.bin`, 기본값은 `nsh.js` 옆의 `nsh-<name>.bin`), `glue`는 크레이트가 [Rust에서 브라우저 API](#browser-apis-from-rust)를 호출하는 런타임(`nsh-bindgen.<digest>.js`)의 wasm-bindgen glue URL로, 플레이어가 런타임과 함께 로드합니다. `player.runModule(url, { capabilities, appId })`는 앱이 선언한 capability(`capabilities.json`)에 따라 앱을 실행하고, 앱의 저장소를 `nsh.json` id 아래에 보관합니다(id가 없으면 페이지의 경로 아래에 보관합니다). `nsh package --target web`가 작성하는 페이지는 이 모든 옵션을 사용합니다.

`runModule(url, { chunks })`는 [분할 번들](#split-bundles)의 청크 위치도 받습니다.

`player.runSource(code, { name, sourceMap, capabilities, appId })`는 소스 텍스트로 주어진 ES 모듈을 같은 옵션으로 실행합니다. `nsh-playground.wasm`를 사용하면 `player.compileAndRun(tsx, name, options)`가 먼저 TSX를 컴파일하고, `runSource`의 옵션으로 실행한 뒤 컴파일 오류 또는 `null`로 resolve됩니다. `player.compile(tsx)`는 `{ code }` 또는 `{ error }`를 반환합니다.

컨테이너의 크기가 앱의 창 크기이며(`windowSize()`), 컨테이너 크기를 바꾸면 앱 크기도 바뀝니다. `player.setDark(true)`는 실행 중에 외관을 전환하며, 앱은 `colorScheme()`과 `dark:` 클래스를 통해 이를 감지합니다.

다이얼로그와 알림은 컨테이너를 덮습니다. `dialogs: "viewport"`를 사용하면 페이지 자체의 모달 다이얼로그처럼 브라우저 창 전체를 덮지만, 앱은 컨테이너를 창으로 유지합니다. `Dialog`는 창의 크기와 안전 영역에 맞춰 레이아웃되고 하단 가장자리에서 슬라이드하여 나타나며, 백드롭이 페이지 전체를 덮고, 그 위에서 마우스 휠을 움직여도 페이지는 스크롤되지 않습니다. 다이얼로그는 브라우저의 top layer(Chrome 114, Safari 17, Firefox 125 이상)에 표시되므로 컨테이너가 어디에 있든 페이지의 다른 요소 위에 나타납니다. 이전 브라우저에서는 컨테이너를 덮습니다.


`Sheet`는 `Dialog` 및 `AlertDialog`와 같은 프레젠테이션 설정을 따릅니다. 동일 origin의 iframe에서는 뷰포트 프레젠테이션이 자동으로 바깥 페이지를 덮으며, 앱은 원래의 레이아웃 크기를 유지합니다. 마지막 팝업이 닫히면 iframe은 원래 위치와 크기로 돌아가며, 엔진과 상태는 그대로 유지됩니다. 문서의 데모는 이 프레젠테이션을 사용합니다.

cross-origin이거나 sandbox가 적용된 iframe의 경우, 임베딩하는 페이지가 플레이어를 로드하기 전에 호스트를 등록합니다.

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

호스트는 이 iframe의 창에서 오는 요청을 받아들이고, 팝업이 표시되는 동안 주변 페이지를 비활성 상태로 유지하며 스크롤을 잠그고, 팝업이 닫히면 둘 다 복원합니다. cross-origin 임베딩 경계마다 해당 호스트의 협조가 필요하며, 협조가 없으면 프레젠테이션은 해당 문서 안에 머물고 플레이어는 경고를 보고합니다.

<a id="the-hosts-functions"></a>

## 호스트의 함수

웹에서는 페이지가 앱의 호스트입니다. 페이지는 [`host`](../modules/nsh.md#host)의 `host.call(name, args)`에 응답하고, `host.on`가 수신하는 이벤트를 보냅니다. `createPlayer`의 `host`는 객체이며, 그 `call(name, args)`는 결과 또는 결과의 promise를 반환합니다. throw 또는 reject가 발생하면 오류 메시지와 함께 앱의 호출이 reject됩니다. `player.hostEvent(event, payload)`는 JSON 페이로드를 담은 이벤트를 보냅니다(JSON이 아닌 페이로드는 예외를 던집니다). `host`가 있으면 `host.available()`는 `true`입니다.

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

게시된 앱은 `nsh.json`에서 호스트를 가져옵니다. `web.host`는 `createHost(player)`를 export하는, 앱 디렉터리 안의 JS 모듈을 `nsh.json` 기준 상대 경로로 지정합니다. `nsh package --target web`는 이 모듈을 `host.<digest>.js`로 사이트에 복사하고, 페이지는 앱이 시작되기 전에 플레이어와 함께 `createHost`를 실행합니다. 이 함수가 반환하거나 resolve하는 값에는 `call` 함수가 있어야 하며, 그렇지 않으면 페이지에 앱을 로드할 수 없다고 표시됩니다. 이후 플레이어 `createHost`가 받은 함수로 이벤트를 보냅니다.

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

호스트는 위와 같이 자신의 함수 테이블에서 각 이름을 있는 그대로 조회하며, URL과 경로는 호스트가 직접 관리합니다. `capabilities.host`는 이름의 앞부분으로 권한을 부여하므로(`user.*`), 호스트가 경로로 변환한 이름은 권한이 포함하지 않는 대상에 접근할 수 있습니다. 런타임은 `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`로 이루어진 1~128자의 이름(`..` 제외)만 전달하며, 그 밖의 이름으로 하는 호출은 reject합니다. 접두사 권한은 구분자(`bridge.*`)로 끝납니다. `bridge*`은 `bridgeAdmin`도 매치합니다.

`createHost` 자체에서 보내는 이벤트처럼 앱이 실행되기 전에 보낸 이벤트는 앱이 시작되는 즉시 순서대로 전달되므로, 앱의 최상위 `host.on` 리스너가 이를 받습니다. 리스너가 등록되기 전에 보낸 이벤트는 해당 리스너에 다시 전달되지 않습니다. 앱은 시작 시점의 상태를 호출(`host.call("user.info")`)로 읽고, 이후의 변경은 이벤트로 따라갑니다.

호스트 모듈은 앱의 페이지에서 실행되며 페이지의 Content-Security-Policy를 공유합니다. 앱의 capability가 `network`를 제한하면 페이지의 `connect-src`에는 페이지의 origin, `capabilities.network`가 나열한 호스트, `web.connect`가 나열한 호스트가 들어갑니다. `web.connect`는 호스트 모듈 자체의 요청(`fetch`, `XMLHttpRequest`, `WebSocket`)이 도달하는 호스트를 `capabilities.network.hosts`의 패턴(`api.example.com`, `*.example.com`, `"*"`)과 같은 형식으로 지정하며, 위의 `api.example.com`과 같습니다. 앱 자체의 요청은 계속 `capabilities`에 대해 검사됩니다.

모듈은 그대로 복사되므로 다른 코드는 절대 URL로 import합니다. 앱이 호출하는 각 함수에는 여전히 `host` [capability](./sandbox-and-capabilities.md)가 필요합니다. `nsh run --target web`는 개발 페이지에서 이 모듈을 실행하고, `nsh test`는 테스트가 여는 모든 앱에 대해 같은 모듈을 헤드리스 또는 브라우저(`--target web`)에서 실행하므로 앱과 호스트를 함께 테스트할 수 있습니다([테스트](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## 플랫폼으로서의 브라우저

`platform.os`은 `"web"`입니다. 브라우저가 어떤 종류의 기기에서 실행되는지에 따라 `platform.idiom`처럼 앱의 동작이 결정됩니다.

- `"desktop"`: 마우스(hover 가능한 fine 포인터)가 있고 컨테이너 너비가 600 포인트 이상인 경우. `platform.desktop`은 `true`이고, `platform.select`은 `desktop`을 선택하며, `desktop={{…}}` props가 적용됩니다.
- `"pad"`: 짧은 변이 600 포인트 이상인 터치 스크린. 그렇지 않으면 `"phone"`. 이들은 모바일이며, `platform.select`은 `mobile`을 선택합니다.

idiom은 앱이 시작될 때 결정되며 다른 모든 플랫폼과 마찬가지로 실행되는 동안 바뀌지 않습니다. 폭이 좁은 데스크톱 창도 여전히 데스크톱이며, `windowSize()`에 맞게 레이아웃됩니다. `web={{…}}` props, `platform.select({ web })` 및 `web:` 클래스는 브라우저에서만 적용되며, `ios={{…}}`, `native`, `ios:`은 브라우저에서 적용되지 않습니다.

페이지는 나머지 환경 정보를 보고하고 최신 상태로 유지합니다.

| 값 | 브라우저에서 가져오는 출처 |
|---|---|
| 로케일 (`Intl`의 기본값) | `navigator.languages[0]` |
| 시간대 (`Date`의 로컬 시간, `Intl`의 기본 `timeZone`) | 브라우저의 시간대(`Intl.DateTimeFormat().resolvedOptions().timeZone`), 일광 절약 시간 포함 |
| 레이아웃 방향 (`rtl:` / `ltr:`) | 설정된 경우 `<html dir>`, 아니면 로케일의 문자 체계 |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | 루트 요소의 글꼴 크기 / 16px (브라우저의 텍스트 크기 설정) |
| `pixelRatio()` | `devicePixelRatio` (확대/축소와 화면에 따라 바뀝니다) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | 컨테이너와 겹치는 영역의 `env(safe-area-inset-*)` (휴대폰의 `viewport-fit=cover` 페이지) |
| `keyboardFrame()` | 화상 키보드가 컨테이너를 가리는 정도 (`visualViewport`) |

`platform.version` 값은 `"0.0"`이고, `screenReaderEnabled()` 값은 `false`로 유지됩니다(브라우저는 알려 주지 않습니다). 페이지 주변의 브라우저 바는 브라우저의 영역이며, 페이지의 [`statusBar`](../modules/nsh-base.md#status-bar)는 휴대폰용입니다.
<a id="networking"></a>

## 네트워킹

`fetch`(스트림, `AbortController` 및 `FormData` 포함)와 `<Image>` URL은 NSH가 앱의 [capabilities](./sandbox-and-capabilities.md)를 확인한 후 브라우저 자체의 네트워크 스택을 거칩니다. 요청은 브라우저의 요청이므로 브라우저의 규칙이 적용됩니다.

- **상대 URL**은 브라우저와 마찬가지로 페이지의 URL을 기준으로 해석됩니다. 게시된 앱은 `fetch("/api/items")`로 자체 API에 접근하고, `<Image src="/photos/a.jpg" />`은 자체 서버에서 로드됩니다. (네이티브 플랫폼에는 페이지가 없으므로 절대 URL이 필요합니다.)
- **CORS.** 페이지와 다른 출처로 보내는 요청은 해당 서버가 페이지의 출처를 허용(`Access-Control-Allow-Origin`)하는 경우에만 성공하며, 그렇지 않으면 `fetch`가 네트워크 오류와 함께 거부됩니다. 서버가 노출한 응답 헤더만 볼 수 있습니다.
- **쿠키**(및 HTTP 인증)는 페이지 자체의 출처로만 전송되며(`credentials: "same-origin"`), 브라우저가 금지하는 헤더(`Cookie`, `User-Agent`, `Host` 등)는 제거됩니다.
- **리디렉션**은 브라우저가 따라갑니다. 리디렉션을 따라가서는 안 되는 요청은 실패합니다. 여기에는 `redirect: "manual"`와 `"error"`, 그리고 capabilities가 `network`를 제한하는 앱의 요청이 해당합니다(NSH는 모든 홉을 검사하며, 브라우저는 리디렉션을 따라가기 전에는 이를 알려 주지 않습니다).
- `ReadableStream`인 **요청 본문**은 먼저 모두 수집한 뒤 한 번에 전송되며, 응답 본문은 도착하는 대로 스트리밍됩니다.

<a id="split-bundles"></a>

## 분할 번들

TSX 웹 앱은 첫 화면을 표시하기 전에 모든 코드를 다운로드할 필요가 없습니다(Rust 앱은 하나의 `nsh.wasm`이며, 브라우저가 다운로드하는 동안 컴파일합니다). `nsh package --target web`는 TSX 앱을 분할하여 게시하며, 각 청크는 `<name>.<digest>.js`로 만들어지고 페이지가 청크와 해당 파일을 매핑합니다. 번들을 직접 분할하려면 `nsh build --split`가 `import()`가 로드하는 모듈을 `bundle.js` 옆에 별도의 청크로 분리합니다.

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

첫 번째 `import("./Screen")`는 `Screen.js`과 그것이 import하는 청크를 한꺼번에 다운로드한 뒤 평가하며, 이후의 import는 즉시 해석됩니다. 페이지는 청크의 위치를 지정합니다. 기본적으로는 번들 옆에 있으며, 콘텐츠 다이제스트로 이름이 바뀐 파일을 CDN이 영구적으로 캐시할 수 있도록 청크마다 URL을 하나씩 지정할 수도 있습니다.

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

다운로드할 수 없는 청크는 해당 청크를 명시한 `TypeError`와 함께 `import()`를 거부하며, 다음 `import()`가 다시 시도합니다. 청크 이름은 번들에서 정해진 고정 파일 이름이므로 앱이 페이지에서 다른 것을 다운로드하게 만들 수 없습니다.

[gallery](/gallery)는 각 데모를 이런 방식으로 로드합니다. `lazy`(`examples/gallery/ui.tsx` 내)는 처음 렌더링될 때 import를 시작하는 컴포넌트를 만들고, import가 완료될 때까지 플레이스홀더를 표시한 다음 로드된 내용을 렌더링합니다. 첫 로드에는 인덱스와 처음 표시되는 데모가 포함되며, 데모가 import하는 폰트는 해당 데모의 청크에 함께 들어 있습니다. 네이티브 빌드는 모든 모듈을 포함하므로 import가 즉시 해석됩니다.

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## 제한 사항

다음 사항은 브라우저가 결정하며, 웹 백엔드는 이를 따릅니다.

- **다른 사이트의 웹 뷰**: `WebView`는 `<iframe>`입니다. 인라인 HTML(`html`)은 `onMessage`, `postMessage`, `injectJavaScript`, 주입된 스크립트와 로드 이벤트를 모두 사용할 수 있습니다(페이지와는 별개의 자체 출처로 실행됩니다). 다른 사이트의 페이지는 `postMessage`와, 지정된 URL이 담긴 로드 이벤트만 사용할 수 있습니다. 브라우저는 해당 페이지의 탐색, 제목, 기록, 오류를 이를 둘러싼 페이지에 숨기며 `userAgent`는 설정할 수 없습니다.
- **소리가 있고 자동으로 시작되는 비디오**: `Video`는 모든 prop과 이벤트를 갖춘 `<video>`이지만, 브라우저는 사용자 제스처가 있은 후에만 소리가 있는 비디오를 시작합니다(음소거된 비디오는 재생됩니다).
- **네이티브 컴포넌트**: 등록된 네이티브 컴포넌트는 NSH를 임베드하는 네이티브 앱에 속하며, 웹에서는 해당 뷰가 비어 있고 콘솔에 경고가 표시됩니다.
- **플랫폼 서비스**: 클립보드 읽기(`Clipboard.readText`, `hasText` 포함)에는 보안 컨텍스트(HTTPS)가 필요하며 사용자에게 권한을 요청할 수 있습니다. 이미지는 `onProgress`를 보고하지 않습니다.
- **텍스트 셰이핑 세부 사항**: 줄 바꿈은 UAX #14의 부분 집합(공백, CJK, 하이픈, 그리고 CJK 문장 부호의 행두·행말 규칙: `。`, `，`, `」` 같은 닫는 부호는 줄의 시작에 오지 않고, `（`, `「` 같은 여는 부호는 줄의 끝에 오지 않음)을 따르며, 하이픈 처리(hyphenation)와 문단 방향 이외의 양방향 재배열은 지원하지 않습니다.

플레이어와 개발 서버는 개발 설정으로 앱을 실행하며, 게시된 앱은 릴리스로 실행됩니다. 두 경우 모두 TSX 앱의 코드는 브라우저의 JavaScript 엔진에서 앱 고유의 realm 안에서 실행됩니다.

<a id="see-also"></a>

## 참고 항목

- [Packaging](./packaging.md): `nsh package`의 다른 타깃.
- [Architecture](./architecture.md): 웹 빌드가 재사용하는 엔진, 코어, 마운트 배치.
- [Testing](./testing-and-trace.md): `nsh test`는 근사 텍스트 엔진을 사용해 동일한 엔진을 헤드리스로 실행합니다.
