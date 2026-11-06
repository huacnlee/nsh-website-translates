---
title: "WebView"
description: "WebView 요소: 앱 내부에서 웹 페이지와 인라인 HTML을 표시하고, 양방향 메시징을 지원합니다."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

웹 뷰는 웹 페이지 또는 전달한 HTML을 앱 안에 표시합니다. iOS와 Mac Catalyst에서는 WKWebView를, Android에서는 `android.webkit.WebView`를 사용합니다. NSH는 네이티브 뷰로 렌더링하므로, 웹 뷰는 다른 뷰와 마찬가지로 주변 뷰와 순서대로 레이아웃에 배치됩니다. Rust에서는 `web_view(url)` 또는 `web_view_html(html, base_url)`로, TSX에서는 `nsh`의 `<WebView>`로 만듭니다.

```rust tabs
use nsh_core::prelude::*;

fn browser() -> impl IntoElement {
    let title = signal(SharedString::from("Loading…"));
    view()
        .flex_1()
        .child(text(title).number_of_lines(1))
        .child(
            web_view("https://example.com")
                .flex_1()
                .on_navigation_state_change(move |e: &WebNavigation| title.set(e.title.clone().into())),
        )
}
```

```tsx tabs
import { signal, Text, View, WebView, type WebViewNavigation } from "nsh";

function Browser() {
  const nav = signal<WebViewNavigation | null>(null);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ numberOfLines: 1 }}>{nav()?.title ?? "Loading…"}</Text>
      <WebView
        src="https://example.com"
        style={{ flex: 1 }}
        onNavigationStateChange={(e) => nav.set(e)}
      />
    </View>
  );
}
```

TSX에서 웹 뷰는 `src`와 `html` 중 하나를 받습니다([WebView API](../modules/nsh-webview.md) 참고). 메시징 패턴과 capabilities는 [웹 뷰와 비디오 가이드](../docs/web-view-and-video.md)에서 다룹니다.

## Props

웹 뷰는 [뷰](./view.md)의 props를 받으며(자식은 없음), 추가로 다음 props를 받습니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | 표시할 페이지의 URL입니다. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | 인라인 HTML이며, `src` 대신 표시됩니다. |
| `baseUrl` | `web_view_html` / `.html`의 `base_url` | `string` | | `html`의 상대 링크가 기준으로 삼는 주소입니다. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | 각 페이지가 로드된 후 실행됩니다. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | 각 페이지 자체의 스크립트보다 먼저 실행됩니다. |
| `userAgent` | `.user_agent(..)` | `string` | | 브라우저의 user agent 문자열입니다. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | 페이지가 스크립트를 실행합니다. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 사용자가 페이지를 스크롤할 수 있습니다. |

| `ios` 키 | Rust | 타입 | 설명 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | 가장자리에서 스와이프하여 뒤로 또는 앞으로 이동합니다. |

| `desktop` 키 | Rust | 타입 | 설명 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: 트랙패드에서 두 손가락으로 스와이프하여 뒤로 또는 앞으로 이동합니다. Windows: 터치스크린에서 스와이프합니다. Linux: 터치패드에서 스와이프합니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 발생 시점 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | 페이지 로드가 시작되었을 때. |
| `onLoad` | `.on_load` | `WebViewNavigation` | 페이지 로드가 끝났을 때. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, 메시지) | 로드에 실패했을 때. `code`은 페이지의 경우 `"ERR_ACCESS_DENIED"`이고, 앱의 capabilities가 허용하지 않는 경우 `html`입니다. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | URL, 제목, 로드 상태 또는 히스토리가 변경되었을 때. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | 페이지가 `window.nsh.postMessage(data)`를 호출했을 때. |
| `onDownload` | | `WebViewDownload` | 다운로드가 시작되었거나, 완료되었거나, 실패했을 때(macOS). |

`WebViewNavigation`는 `{ url, title, loading, canGoBack, canGoForward }`입니다. Rust에서는 `WebNavigation`이며 `url`, `title`, `loading`, `can_go_back`, `can_go_forward`을 가집니다.

`WebViewDownload`는 `{ state, id, url, filename, path, bytes?, message? }`입니다. `state`는 `"started"`, `"finished"`(파일의 `bytes` 포함) 또는 `"failed"`(`message` 포함) 중 하나입니다. `onDownload` 리스너가 있으면 페이지가 다운로드하는 항목(첨부 파일, 웹 뷰가 표시하지 않는 타입, `download` 링크)이 앱의 데이터 디렉터리에 `downloads/<id>/<filename>`로 저장되고, `path`가 그 위치를 가리키며, 앱은 `fs/promises`로 이를 읽습니다.

macOS에서는 리스너를 추가하면 `webview` capability가 허용한 모든 로드된 페이지가 다운로드를 자동으로 저장할 수 있습니다. 저장 공간 예산을 관리하고, 사용이 끝난 완료 파일을 `downloads/`에서 제거하는 것은 앱의 책임입니다. 웹 뷰를 제거하면 진행 중인 다운로드가 취소되고 해당 임시 디렉터리도 삭제됩니다. 다운로드는 `onDownload`를 통해 보고되며, 내비게이션을 다운로드로 전환한 경우 `onError`는 실제 내비게이션 실패에만 사용됩니다. 파일 이름에서는 제어 문자와 양방향 서식 제어 문자가 제거되며, 긴 이름은 맞는 경우 확장자를 유지한 채 200바이트로 줄어듭니다.

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | Rust | 설명 |
|---|---|---|
| `reload()` | `reload()` | 페이지를 다시 로드합니다. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | 페이지의 히스토리에서 이동합니다. |
| `stopLoading()` | `stop_loading()` | 로드를 중지합니다. |
| `injectJavaScript(script)` | `inject_java_script(script)` | 페이지에서 JavaScript를 실행합니다. |
| `postMessage(data)` | `post_message(data)` | 페이지로 문자열을 보내며, 페이지는 `window`에서 `message` 이벤트로 이를 받습니다. |

<a id="messaging"></a>

## 메시징

앱과 페이지는 문자열을 주고받습니다. 페이지는 `window.nsh.postMessage(data)`로 보내고, 앱은 ref의 `postMessage(data)`(Rust에서는 `post_message(..)`)로 보냅니다. 구조화된 데이터는 JSON으로 보내세요.

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<meta name="viewport" content="width=device-width">
<button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
<p id="got"></p>
<script>
  window.addEventListener("message", (e) => { document.getElementById("got").textContent = e.data; });
</script>"#;

fn bridge() -> impl IntoElement {
    let message = signal(String::new());
    let web = element_ref();
    view()
        .gap_3()
        .child(
            web_view_html(PAGE.to_string(), None)
                .element_ref(&web)
                .h(px(200.0))
                .on_message(move |data: &str| message.set(data.to_string())),
        )
        .child(
            text(move || format!("Post to the page · got: {}", message.get()))
                .on_press(move || web.post_message("hi from the app")),
        )
}
```

```tsx tabs
import { signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<meta name="viewport" content="width=device-width">
<button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
<p id="got"></p>
<script>
  window.addEventListener("message", (e) => { document.getElementById("got").textContent = e.data; });
</script>`;

function Bridge() {
  const message = signal("");
  let web!: WebViewRef;
  return (
    <View style={{ gap: 12 }}>
      <WebView ref={web} html={page} style={{ height: 200 }} onMessage={(e) => message.set(e.data)} />
      <Text onPress={() => web.postMessage("hi from the app")}>Post to the page · got: {message()}</Text>
    </View>
  );
}
```

## Capabilities

앱이 `nsh.json`에 [capabilities](../docs/sandbox-and-capabilities.md)를 선언하면, 웹 뷰는 `webview` 아래에 나열된 호스트만 표시하고 해당 호스트로만 이동합니다. 다른 호스트의 `src`이나 `webview` 없는 앱의 `html`은 빈 뷰를 표시하며, 다른 호스트로의 최상위 내비게이션(사용자가 탭한 링크)은 네이티브 수준에서 취소됩니다. 각각 `code` `"ERR_ACCESS_DENIED"`과 함께 `onError`을 보고합니다.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- iOS는 웹 뷰가 처음 생성될 때 WebKit을 로드하므로, 앱이 웹 뷰를 표시할 때 한 번만 비용이 발생합니다.
- macOS에서 `onDownload`는 WebKit의 `WKDownload`로 다운로드를 저장합니다.
- Android에서는 페이지의 `postMessage` 호출이 백그라운드 스레드에서 도착하며 순서대로 앱에 전달됩니다.
- 웹 뷰의 모서리를 둥글게 하려면 corner radius와 `overflow: "hidden"`(`.overflow_hidden()`)을 지정하세요.
