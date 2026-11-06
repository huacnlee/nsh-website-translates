---
title: "웹 뷰와 비디오"
description: "WebView로 웹 페이지를 표시하고 Video로 비디오를 재생하는 방법 - 소스, 페이지와 앱 간 메시징, 내비게이션, 재생 제어, ref 및 기능(capabilities)."
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# 웹 뷰와 비디오

웹 뷰와 비디오 플레이어는 플랫폼 자체의 웹 엔진과 미디어 플레이어를 일반 뷰로 임베드합니다. Rust에서는 `web_view` 및 `video`(`nsh_core::prelude`), TSX에서는 `nsh`의 `WebView` 및 `Video`을 사용합니다. NSH는 네이티브 뷰로 렌더링하므로 이들은 다른 요소와 똑같이 레이아웃에 놓입니다. 부모와 함께 스크롤되고, 둥근 모서리와 클리핑이 적용되며, 다른 뷰가 그 위에 겹쳐도 레이어링 문제가 없습니다.

| 컴포넌트 | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | WebKitGTK 6.0의 `WebKitWebView` | WebView2, 자식 윈도우 안 |
| `Video` | AVPlayerLayer; `controls` 사용 시 AVPlayerViewController | TextureView 위의 MediaPlayer; `controls` 사용 시 MediaController | AVPlayerLayer; `controls` 사용 시 AVKit의 AVPlayerView | `GtkPicture` 안의 GTK 미디어 스트림(GStreamer); `controls` 사용 시 `GtkVideo` | Media Foundation의 미디어 엔진, 프레임은 Direct2D로 그림; `controls` 사용 시 NSH 자체 컨트롤 바 |

이들 뒤에 있는 프레임워크(WebKit, AVFoundation)는 앱이 처음 사용할 때 로드되므로, 웹 페이지나 비디오를 전혀 표시하지 않는 앱은 실행 시 그 비용을 부담하지 않습니다.

[macOS](./macos.md)에서 웹 뷰는 자체 스크롤 뷰가 없습니다. `scrollable={false}`를 사용하면 마우스 휠과 트랙패드는 페이지 대신 주변의 앱 스크롤 뷰를 스크롤하며, 페이지는 여전히 키보드와 자체 스크립트로 스크롤됩니다.

[Linux](./linux.md)에서 웹 뷰는 해당 뷰 안에 그려지는 WebKitGTK 페이지입니다. 그 위에 놓인 NSH 콘텐츠(다이얼로그, 시트)가 웹 뷰를 가리며, 부모가 웹 뷰를 클리핑합니다. `webview` capability는 이곳의 프레임 내비게이션에도 적용되며(허용되지 않은 호스트의 `iframe`는 빈 상태로 남음), `scrollable: false`는 페이지 자체의 스크롤을 막습니다(페이지 안의 요소는 계속 스크롤됨). 앱에는 WebKitGTK 6.0이 설치되어 있어야 하며, 이것 없이 빌드된 런타임은 중립적인 플레이스홀더를 표시합니다. 비디오는 설치된 GStreamer 플러그인이 디코딩할 수 있는 포맷을 재생합니다. `rate`는 지원되지 않으며(1배속으로 재생됨), `onEnd`는 반복 재생하지 않는 비디오에서만 제공됩니다.

[Windows](./windows.md)에서 웹 뷰는 해당 뷰를 따라다니는 자식 윈도우 안의 WebView2 컨트롤입니다. 부모와 둥근 모서리에 맞춰 클리핑되지만, 그 위에 그려진 NSH 콘텐츠(다이얼로그, 시트)는 웹 뷰 아래에 머뭅니다. WebView2 Runtime이 필요하며(Windows 11에 포함되어 있고, Windows 10에서는 Edge와 함께 설치됨), 없으면 플레이스홀더를 표시합니다. HTML용 `baseUrl`, `scrollable`, `allowsBackForwardNavigationGestures`는 지원되지 않습니다. 비디오는 일반 콘텐츠로 취급되어(다른 뷰처럼 클리핑, 변형, 가려짐 적용) 설치된 Media Foundation 코덱이 디코딩할 수 있는 포맷을 재생합니다. `rate`는 동작하고, 포스터는 없으며, `controls`가 켜져 있는 동안에는 컨트롤 바가 항상 표시됩니다.

## WebView

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    web_view("https://en.m.wikipedia.org/wiki/Swift_(programming_language)").flex_1()
}
```

```tsx tabs
import { mount, WebView } from "nsh";

function App() {
  return <WebView src="https://en.m.wikipedia.org/wiki/Swift_(programming_language)" style={{ flex: 1 }} />;
}

mount(App);
```

<a id="sources"></a>

### 소스

웹 뷰는 `src`와 `html` 중 하나를 표시합니다.

| Props | 표시 내용 |
|---|---|
| `src="https://…"` | 웹 페이지. |
| `html="<!doctype html>…"` | 문자열의 HTML. `src` 대신 표시됩니다. |
| `html`와 `baseUrl="https://example.com/"` | 상대 URL이 `baseUrl`을 기준으로 해석되는 HTML. |

Rust에서는 `web_view(url)`가 페이지를, `web_view_html(html, base_url)`가 HTML을 표시합니다(`base_url`는 `Option<&str>`). URL과 HTML은 시그널이나 클로저일 수 있으며, 이 경우 읽고 있는 값이 바뀔 때 페이지를 다시 로드합니다. `src` 또는 `html`를 변경하면 새 페이지가 로드됩니다.

### Props

Rust에서 각 prop은 스네이크 케이스의 빌더 메서드입니다(`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injectedJavaScriptBeforeContentLoaded`에는 `injected_java_script_before_content`, iOS의 `allowsBackForwardNavigationGestures`에는 `back_forward_gestures`). 각 이벤트는 `on_…` 메서드(`on_navigation_state_change`)이며, 리스너는 `WebNavigation`(`url`, `title`, `loading`, `can_go_back`, `can_go_forward`)를 받고, `on_error`와 `on_message`의 경우에는 `&str`를 받습니다.

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `src` | `string` | | 표시할 페이지의 URL. |
| `html` | `string` | | 인라인 HTML. `src` 대신 표시됩니다. |
| `baseUrl` | `string` | | `html`의 상대 URL이 해석되는 기준. |
| `injectedJavaScript` | `string` | | 페이지가 로드될 때마다 실행됩니다. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | 각 페이지 자체의 스크립트보다 먼저 실행됩니다. |
| `javaScriptEnabled` | `boolean` | `true` | 페이지가 스크립트를 실행합니다. |
| `scrollable` | `boolean` | `true` | 사용자가 페이지를 스크롤할 수 있습니다. |
| `userAgent` | `string` | | 브라우저의 user agent 문자열. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: 스와이프로 페이지 기록을 뒤로/앞으로 이동합니다. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: 트랙패드에서 두 손가락으로 스와이프하여 뒤로/앞으로 이동; Windows: 터치스크린에서 스와이프; Linux: 터치패드에서 스와이프. |

이벤트:

| 이벤트 | 페이로드 | 시점 |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | 페이지 로딩이 시작되었습니다. |
| `onLoad` | `WebViewNavigation` | 페이지 로딩이 끝났습니다. |
| `onError` | `{ message }` | 로딩에 실패했습니다. |
| `onNavigationStateChange` | `WebViewNavigation` | URL, 제목, 로딩 상태 또는 기록이 변경되었습니다. |
| `onMessage` | `{ data: string }` | 페이지가 메시지를 보냈습니다(아래 참조). |

`WebViewNavigation`는 `{ url, title, loading, canGoBack, canGoForward }`입니다.

<a id="a-browser-with-back-and-forward"></a>

### 뒤로/앞으로 이동이 있는 브라우저

웹 뷰의 ref(Rust에서는 `.element_ref(&web)`로, TSX에서는 `ref`로 웹 뷰에 지정하는 `element_ref()`)에는 `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)`, `send_input` / `sendInput(input)`가 있습니다([아래](#input-as-the-users-own)).

```rust tabs
use nsh_core::prelude::*;

pub fn browser() -> impl IntoElement {
    let web = element_ref();
    let nav = signal(None::<WebNavigation>);
    let button = move |label: &'static str, enabled: fn(&WebNavigation) -> bool, action: fn(&ElementRef)| {
        let enabled = move || nav.with(|n| n.as_ref().is_some_and(enabled));
        text(label)
            .p(px(12.0))
            .text_color(move || if enabled() { rgb(0x0969da) } else { rgb(0x8c959f) })
            .disabled(move || !enabled())
            .on_press(move || action(&web))
    };
    view()
        .flex_1()
        .pt(px(50.0))
        .child(
            text(move || {
                nav.with(|n| match n {
                    Some(n) if n.loading => "Loading…".to_owned(),
                    Some(n) => n.title.clone(),
                    None => String::new(),
                })
            })
            .number_of_lines(1)
            .px(px(12.0))
            .text_color(rgb(0x57606a)),
        )
        .child(
            web_view("https://developer.mozilla.org/")
                .element_ref(&web)
                .flex_1()
                .on_navigation_state_change(move |n: &WebNavigation| nav.set(Some(n.clone())))
                .back_forward_gestures(true),
        )
        .child(
            view()
                .flex_row()
                .justify_around()
                .child(button("Back", |n| n.can_go_back, |web| web.go_back()))
                .child(button("Forward", |n| n.can_go_forward, |web| web.go_forward()))
                .child(button("Reload", |_| true, |web| web.reload())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewNavigation, type WebViewRef } from "nsh";

function Browser() {
  let web!: WebViewRef;
  const nav = signal<WebViewNavigation | null>(null);
  const button = (label: string, enabled: boolean, action: () => void) => (
    <Text onPress={enabled ? action : undefined} style={{ padding: 12, color: enabled ? "#0969da" : "#8c959f" }}>
      {label}
    </Text>
  );
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text style={{ numberOfLines: 1, paddingHorizontal: 12, color: "#57606a" }}>
        {nav()?.loading ? "Loading…" : nav()?.title ?? ""}
      </Text>
      <WebView
        ref={web}
        src="https://developer.mozilla.org/"
        style={{ flex: 1 }}
        onNavigationStateChange={(n) => nav.set(n)}
        ios={{ allowsBackForwardNavigationGestures: true }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {button("Back", !!nav()?.canGoBack, () => web.goBack())}
        {button("Forward", !!nav()?.canGoForward, () => web.goForward())}
        {button("Reload", true, () => web.reload())}
      </View>
    </View>
  );
}

mount(Browser);
```

<a id="messaging-between-the-page-and-the-app"></a>

### 페이지와 앱 간 메시징

페이지는 `window.nsh.postMessage(string)`로 앱과 통신하며, 이는 `on_message`(`onMessage`)로 전달됩니다. 앱은 ref의 `post_message`(`postMessage(string)`)로 페이지와 통신하며, 이는 페이지에서 `window`의 `message` 이벤트로 도착합니다. 메시지는 문자열이며, 구조화된 데이터에는 JSON을 보내세요.

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>"#;

#[component]
pub fn App() -> impl IntoElement {
    let web = element_ref();
    let last = signal(String::new());
    view()
        .flex_1()
        .pt(px(50.0))
        .gap(px(12.0))
        .child(
            web_view_html(PAGE, None)
                .element_ref(&web)
                .h(px(240.0))
                .on_message(move |data: &str| {
                    let message: serde_json::Value = serde_json::from_str(data).unwrap_or_default();
                    last.set(message["type"].as_str().unwrap_or_default().to_owned());
                }),
        )
        .child(
            text("Post to the page")
                .p(px(16.0))
                .text_color(rgb(0x0969da))
                .on_press(move || web.post_message("hi from nsh")),
        )
        .child(text(move || format!("Last message: {}", last.get())).px(px(16.0)))
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>`;

function App() {
  let web!: WebViewRef;
  const last = signal("");
  return (
    <View style={{ flex: 1, paddingTop: 50, gap: 12 }}>
      <WebView
        ref={web}
        html={page}
        style={{ height: 240 }}
        onMessage={(e) => last.set(JSON.parse(e.data).type)}
      />
      <Text onPress={() => web.postMessage("hi from nsh")} style={{ padding: 16, color: "#0969da" }}>
        Post to the page
      </Text>
      <Text style={{ paddingHorizontal: 16 }}>Last message: {last()}</Text>
    </View>
  );
}

mount(App);
```

ref의 `inject_java_script`(`injectJavaScript(script)`)는 언제든지 현재 페이지에서 코드를 실행합니다. `injected_java_script`와 `injected_java_script_before_content`(`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`)는 페이지 자체의 스크립트 전 또는 후에 매 페이지 로드마다 실행되며, 훅을 설치하기에 적합한 위치입니다.

```rust tabs
web_view("https://example.com")
    .injected_java_script_before_content("window.isNativeApp = true;")
    .injected_java_script("window.nsh.postMessage(document.title);")
    .on_message(|title: &str| log::info!("title {title}"))
```

```tsx tabs
<WebView
  src="https://example.com"
  injectedJavaScriptBeforeContentLoaded={`window.isNativeApp = true;`}
  injectedJavaScript={`window.nsh.postMessage(document.title);`}
  onMessage={(e) => console.log("title", e.data)}
/>
```

<a id="input-as-the-users-own"></a>

### 사용자 본인의 입력으로서의 입력

`injectJavaScript`는 합성 이벤트만 만들 수 있으며, 페이지는 이를 신뢰할 수 없는 이벤트로 보고(`event.isTrusted`는 `false`) 일부 위젯은 무시합니다. ref의 `send_input`(`sendInput(input)`)는 사용자가 직접 손으로 입력하는 것처럼 페이지에 입력을 전달하므로, 그 이벤트는 신뢰됩니다.

- `{ type: "click", x, y }`은 뷰포트의 한 지점을 CSS 픽셀 단위로 클릭합니다(`getBoundingClientRect()`가 보고하는 값).
- `{ type: "text", text }`는 페이지의 포커스를 가진 대상에 텍스트를 한 키씩 입력합니다. 각 문자는 US 레이아웃에서 해당하는 키로, 줄바꿈은 Enter로 입력하고, US 키로 입력할 수 없는 문자(`é`, CJK, 이모지)는 어떤 키도 거치지 않고 입력합니다(`code`는 `"Unidentified"`).
- `{ type: "key", key }`는 `Enter`, `Tab`, `Escape` 또는 `Backspace`을 누릅니다.

```rust tabs
use nsh_core::{WebInput, WebKey, prelude::*};
use std::time::Duration;

fn search(web: &ElementRef) {
    web.send_input(WebInput::Click { x: px(120.0), y: px(40.0) });
    let web = *web;
    set_timeout(Duration::from_millis(50), move || {
        web.send_input(WebInput::Text("espresso".into()));
        web.send_input(WebInput::Key(WebKey::Enter));
    });
}
```

```tsx tabs
web.sendInput({ type: "click", x: 120, y: 40 });
setTimeout(() => {
  web.sendInput({ type: "text", text: "espresso" });
  web.sendInput({ type: "key", key: "Enter" });
}, 50);
```

Rust에서는 `WebInput::Click { x, y }`, `WebInput::Text(text)`, `WebInput::Key(WebKey::Enter)`입니다.

신뢰된 입력은 사용자 활성화(user activation)를 동반하므로(윈도우 열기, 클립보드 쓰기, 시스템 파일 패널 열기, 페이지의 확인 버튼 누르기가 가능), 별도의 capability입니다. 앱은 `nsh.json`의 `capabilities`에 `"webview": { "input": true }`가 필요하며([`webview`](./sandbox-and-capabilities.md#webview)), capability를 하나도 선언하지 않은 경우에도 마찬가지입니다. 그렇지 않으면 코어가 호출을 버립니다.

클릭과 마찬가지로 `sendInput`는 앱 자체의 `Input`에서 키보드 포커스를 가져와 웹 뷰에 줍니다. 페이지는 자체 일정에 따라 입력을 처리합니다. 클릭의 이벤트가 다음 호출이 시작될 때까지 아직 처리 중일 수 있으므로, 클릭 후 입력하기 전에 클릭이 안정되도록(한 프레임 정도) 기다리세요. macOS는 입력을 전달하며, 다른 플랫폼은 현재 이를 무시합니다.

이에 의존하는 기능을 제공하기 전에, 여기서 동작하는지 확인하세요. `web_input_available()`(`WebView.inputAvailable()`)는 플랫폼이 입력을 전달하고 앱이 `webview.input`를 보유한 경우에만 `true`로 resolve되므로, 호출을 무시하는 플랫폼과 권한이 없는 앱에서는 `false`입니다.

```rust tabs
use nsh_core::prelude::*;

let input = signal(false);
spawn(async move { input.set(web_input_available().await) });
```

```tsx tabs
import { signal, WebView } from "nsh";

const input = signal(false);
WebView.inputAvailable().then((available) => input.set(available));
```

<a id="which-sites-a-web-view-may-show"></a>

### 웹 뷰가 표시할 수 있는 사이트

`nsh.json`가 `"capabilities"`를 선언하면, 웹 뷰는 `webview`에 나열된 호스트만 표시하고 이동할 수 있습니다.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

이 검사는 웹 뷰의 `src`와 페이지가 수행하는 모든 최상위 내비게이션(링크, 리다이렉트, `location` 변경)에 적용되며, 플랫폼이 내비게이션을 진행해도 되는지 물을 때 네이티브에서 결정됩니다. 페이지 자체의 서브리소스(스크립트, 이미지, 프레임)는 웹 콘텐츠의 영역이므로 검사하지 않습니다. `*.example.com`는 서브도메인만 일치시키므로, 루트 도메인을 위해 `example.com`도 함께 나열하세요. `"capabilities"` 키가 없는 앱은 모든 페이지를 표시할 수 있습니다. [샌드박스와 capability](./sandbox-and-capabilities.md)를 참고하세요.

## Video

```rust tabs
use nsh_core::prelude::*;

pub fn player() -> impl IntoElement {
    let player = element_ref();
    let paused = signal(true);
    let time = signal(String::new());
    let link = |label: &'static str| text(label).text_color(rgb(0x0969da));
    view()
        .flex_1()
        .justify_center()
        .p(px(16.0))
        .gap(px(12.0))
        .child(
            video("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
                .element_ref(&player)
                .paused(paused)
                .repeat(true)
                .object_fit(ResizeMode::Contain)
                .h(px(220.0))
                .rounded(px(12.0))
                .overflow_hidden()
                .bg(rgb(0x000000))
                .on_progress(move |e: &VideoProgress| {
                    time.set(format!("{:.1} / {:.1} s", e.current_time, e.duration))
                })
                .on_end(move || paused.set(true)),
        )
        .child(
            view()
                .flex_row()
                .gap(px(16.0))
                .items_center()
                .child(
                    text(move || if paused.get() { "Play" } else { "Pause" })
                        .text_color(rgb(0x0969da))
                        .font_weight(FontWeight::SEMIBOLD)
                        .on_press(move || paused.update(|p| *p = !*p)),
                )
                .child(link("Restart").on_press(move || player.seek(0.0)))
                .child(text(move || time.get()).text_color(rgb(0x57606a))),
        )
}
```

```tsx tabs
import { mount, signal, Text, Video, type VideoRef, View } from "nsh";

function Player() {
  let video!: VideoRef;
  const paused = signal(true);
  const time = signal("");
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 12 }}>
      <Video
        ref={video}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        paused={paused()}
        repeat
        style={{ height: 220, borderRadius: 12, overflow: "hidden", backgroundColor: "#000000" }}
        onProgress={(e) => time.set(`${e.currentTime.toFixed(1)} / ${e.duration.toFixed(1)} s`)}
        onEnd={() => paused.set(true)}
      />
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Text onPress={() => paused.set(!paused())} style={{ color: "#0969da", fontWeight: "600" }}>
          {paused() ? "Play" : "Pause"}
        </Text>
        <Text onPress={() => video.seek(0)} style={{ color: "#0969da" }}>
          Restart
        </Text>
        <Text style={{ color: "#57606a" }}>{time()}</Text>
      </View>
    </View>
  );
}

mount(Player);
```

재생은 props로 제어합니다. `paused`, `muted`, `volume`, `rate`를 시그널로 설정하면 플레이어가 따라갑니다. ref에는 `seek(seconds)`가 있습니다.

Rust에서는 `video(url)`가 플레이어를 만들고(URL은 값, 시그널 또는 클로저), 각 prop은 스네이크 케이스의 빌더 메서드입니다(`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)`(`objectFit` 스타일), `progressUpdateInterval`에는 `progress_interval`). `on_load`는 `VideoInfo`(`duration`, `size`)를, `on_progress`는 `VideoProgress`(`current_time`, `duration`)를, `on_buffer`는 `bool`를 받습니다.

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `src` | `string` | | 비디오의 URL. |
| `paused` | `boolean` | `false` | 재생이 일시정지됩니다. |
| `muted` | `boolean` | `false` | 소리가 나지 않습니다. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | 재생 속도. |
| `repeat` | `boolean` | `false` | 끝에 도달하면 처음부터 다시 재생합니다. |
| `objectFit`(스타일), `object-*` 클래스 | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | CSS의 `object-fit`처럼 화면이 뷰에 맞춰지는 방식(`class="object-cover"`). |
| `controls` | `boolean` | `false` | 플랫폼의 재생 컨트롤. |
| `progressUpdateInterval` | `number` | `250` | `onProgress` 이벤트 사이의 간격(밀리초). |

| 이벤트 | 페이로드 | 시점 |
|---|---|---|
| `onLoadStart` | | 로딩이 시작되었습니다. |
| `onLoad` | `{ duration, size }` | 비디오가 준비되었습니다: 길이(초)와 크기. |
| `onProgress` | `{ currentTime, duration }` | 재생 중 `progressUpdateInterval` ms마다. |
| `onBuffer` | `{ isBuffering }` | 데이터를 기다리느라 재생이 멈췄거나 재개되었습니다. |
| `onEnd` | | 재생이 끝에 도달했습니다. |
| `onError` | `{ message }` | 로딩 또는 재생에 실패했습니다. |

`controls`를 사용하면 플랫폼이 자체 재생 버튼, 스크러버, 전체 화면 버튼을 그립니다. 사용하지 않으면 비디오 위나 아래에 뷰로 직접 그리세요. 비디오는 레이아웃 안의 네이티브 뷰이므로 오버레이가 자연스럽게 동작합니다.

```rust tabs
view()
    .h(px(220.0))
    .child(video(url).paused(paused).flex_1())
    .child(
        view()
            .absolute()
            .inset_0()
            .items_center()
            .justify_center()
            .on_press(move || paused.update(|p| *p = !*p))
            .child(when(move || paused.get(), || {
                text("▶").text_size(px(48.0)).text_color(rgb(0xffffff))
            })),
    )
```

```tsx tabs
<View style={{ height: 220 }}>
  <Video src={url} paused={paused()} style={{ flex: 1 }} />
  <View
    onPress={() => paused.set(!paused())}
    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
  >
    <If when={paused()}>
      <Text style={{ fontSize: 48, color: "#ffffff" }}>▶</Text>
    </If>
  </View>
</View>
```

비디오 소스는 네트워크 요청입니다. capability를 선언한 경우 비디오의 호스트는 `nsh.json`의 `network` 아래에 허용되어 있어야 하며, 이는 `fetch` 및 원격 이미지와 같습니다. 거부된 소스는 아무것도 표시하지 않으며, 거부는 추가해야 할 키와 함께 한 번 로그에 기록됩니다.

<a id="related"></a>

## 관련 문서

- [`WebView`](../elements/web-view.md) 및 [`Video`](../elements/video.md): 엘리먼트 레퍼런스.
- [샌드박스와 capability](./sandbox-and-capabilities.md): `webview` 및 `network` 권한.
- [네이티브 컴포넌트](./native-components.md): 호스트 앱이 제공하는 다른 네이티브 뷰 임베딩.
