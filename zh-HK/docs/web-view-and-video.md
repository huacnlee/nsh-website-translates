---
title: "網頁檢視與影片"
description: "使用 WebView 顯示網頁,以及使用 Video 播放影片:來源、網頁與應用程式之間的訊息傳遞、導覽、播放控制、refs 與功能支援。"
order: 45
group: ui
source_hash: f15d6d5032c41887
---


# 網頁檢視與影片

The web view and the video player embed the platform's own web engine and media player as ordinary views: Rust 中的 `web_view` 與 `video`(`nsh_core::prelude`),以及 TSX 中來自 `nsh` 的 `WebView` 與 `Video`。由於 NSH 以原生 view 進行渲染,它們可以像其他元素一樣放進你的 layout:會隨父 view 捲動、支援圓角與裁剪,其他 view 也可以覆蓋在它們上面,不會有圖層問題。

| Component | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | WebKitGTK 6.0 的 `WebKitWebView` | WebView2,位於子視窗中 |
| `Video` | AVPlayerLayer;AVPlayerViewController 搭配 `controls` | TextureView 上的 MediaPlayer;MediaController 搭配 `controls` | AVPlayerLayer;AVKit 的 AVPlayerView 搭配 `controls` | `GtkPicture` 中的 GTK media stream(GStreamer);`GtkVideo` 搭配 `controls` | Media Foundation 的 media engine,畫面以 Direct2D 繪製;NSH 自有的控制列搭配 `controls` |

它們背後的框架(WebKit、AVFoundation)會在應用程式首次使用時才載入,因此從不顯示網頁或影片的應用程式,啟動時不會付出這部分的成本。

在 [macOS](./macos.md) 上,web view 本身沒有 scroll view:使用 `scrollable={false}` 時,滑鼠滾輪與觸控板會捲動它周圍應用程式的 scroll view,而不是網頁;網頁仍可透過鍵盤和自身的腳本捲動。

在 [Linux](./linux.md) 上,web view 是繪製在其 view 內的 WebKitGTK 頁面:覆蓋在它上面的 NSH 內容(例如對話框、sheet)會遮住它,其父 view 也會裁剪它。`webview` capability 同樣適用於當地 frame 的導覽(未獲授權主機的 `iframe` 會保持空白),而 `scrollable: false` 會阻止頁面本身捲動(頁面內的元素仍可捲動)。應用程式需要安裝 WebKitGTK 6.0;沒有它的 runtime 會顯示中性的佔位畫面。影片可播放已安裝的 GStreamer plugin 能解碼的格式;不支援 `rate`(一律以 1× 播放),而 `onEnd` 只適用於不循環播放的影片。

在 [Windows](./windows.md) 上,web view 是跟隨其 view 的子視窗中的 WebView2 控件:它會被其父 view 與圓角裁剪,但繪製在它上面的 NSH 內容(例如對話框、sheet)仍會處於它下方。它需要 WebView2 Runtime(Windows 11 內建;Windows 10 隨 Edge 安裝),否則會顯示佔位畫面;HTML 的 `baseUrl`、`scrollable` 與 `allowsBackForwardNavigationGestures` 不受支援。影片屬於一般內容(可像任何 view 一樣被裁剪、變換和覆蓋),可播放已安裝的 Media Foundation codec 能解碼的格式;`rate` 可用,沒有 poster,而在 `controls` 開啟時控制列會一直顯示。

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

### 來源

web view 顯示 `src` 與 `html` 其中之一:

| Props | 顯示內容 |
|---|---|
| `src="https://…"` | 網頁。 |
| `html="<!doctype html>…"` | 來自字串的 HTML,會取代 `src` 顯示。 |
| `html` 搭配 `baseUrl="https://example.com/"` | HTML 中的相對 URL 會依據 `baseUrl` 解析。 |

在 Rust 中,`web_view(url)` 顯示網頁,`web_view_html(html, base_url)` 顯示 HTML(`base_url` 為 `Option<&str>`);URL 與 HTML 可以是 signal 或 closure,當其讀取的內容改變時會重新載入頁面。更改 `src` 或 `html` 會載入新頁面。

### Props

在 Rust 中,每個 prop 都是 snake case 的 builder 方法(`injected_java_script`、`java_script_enabled`、`scrollable`、`user_agent`;`injected_java_script_before_content` 對應 `injectedJavaScriptBeforeContentLoaded`,`back_forward_gestures` 對應 iOS 的 `allowsBackForwardNavigationGestures`),每個事件則是 `on_…` 方法(`on_navigation_state_change`),其 listener 會收到 `WebNavigation`(`url`、`title`、`loading`、`can_go_back`、`can_go_forward`);至於 `on_error` 與 `on_message`,則會收到 `&str`。

| Prop | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `src` | `string` | | 要顯示的頁面 URL。 |
| `html` | `string` | | 內嵌 HTML,會取代 `src` 顯示。 |
| `baseUrl` | `string` | | `html` 的相對 URL 所依據的基準。 |
| `injectedJavaScript` | `string` | | 每個頁面載入後執行。 |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | 在每個頁面自身的腳本之前執行。 |
| `javaScriptEnabled` | `boolean` | `true` | 頁面會執行腳本。 |
| `scrollable` | `boolean` | `true` | 使用者可以捲動頁面。 |
| `userAgent` | `string` | | 瀏覽器的 user agent 字串。 |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS:滑動以在頁面歷史中後退和前進。 |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS:在觸控板上用兩指滑動以後退和前進;Windows:在觸控螢幕上滑動;Linux:在觸控板上滑動。 |

事件:

| 事件 | Payload | 觸發時機 |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | 頁面開始載入。 |
| `onLoad` | `WebViewNavigation` | 頁面載入完成。 |
| `onError` | `{ message }` | 載入失敗。 |
| `onNavigationStateChange` | `WebViewNavigation` | URL、標題、載入狀態或歷史記錄改變。 |
| `onMessage` | `{ data: string }` | 頁面發出了訊息(見下文)。 |

`WebViewNavigation` 為 `{ url, title, loading, canGoBack, canGoForward }`。

<a id="a-browser-with-back-and-forward"></a>

### 具備後退與前進的瀏覽器

web view 的 ref(Rust 中以 `.element_ref(&web)` 放到它上面的 `element_ref()`,TSX 中則是 `ref`)具有 `reload`、`go_back` / `goBack`、`go_forward` / `goForward`、`stop_loading` / `stopLoading`、`inject_java_script` / `injectJavaScript(script)`、`post_message` / `postMessage(data)` 以及 `send_input` / `sendInput(input)`([下文](#input-as-the-users-own)):

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

### 頁面與應用程式之間的訊息傳遞

頁面透過 `window.nsh.postMessage(string)` 與應用程式溝通,訊息會以 `on_message`(`onMessage`)的形式送達。應用程式則透過 ref 的 `post_message`(`postMessage(string)`)與頁面溝通,訊息會在頁面中以 `window` 上的 `message` 事件送達。訊息為字串;如需傳送結構化資料,請傳送 JSON。

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

ref 的 `inject_java_script`(`injectJavaScript(script)`)可隨時在當前頁面中執行程式碼;`injected_java_script` 與 `injected_java_script_before_content`(`injectedJavaScript`、`injectedJavaScriptBeforeContentLoaded`)則在每次頁面載入時執行,分別在頁面自身的腳本之前或之後,適合用來安裝 hook:

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

### 以使用者本人身分輸入

`injectJavaScript` 只能產生合成事件,頁面會視這些事件為不受信任(`event.isTrusted` 為 `false`),部分 widget 也會忽略它們。ref 的 `send_input`(`sendInput(input)`)會像使用者親手操作一樣向頁面提供輸入,因此其事件是受信任的:

- `{ type: "click", x, y }` 點擊 viewport 中的某一點,以 CSS 像素計(即 `getBoundingClientRect()` 所回報的)。
- `{ type: "text", text }` 把文字逐個按鍵輸入到頁面當前焦點所在之處:每個字元使用美式鍵盤配置中對應的按鍵,換行視為 Enter,而美式鍵盤上無法輸入的字元(`é`、CJK、emoji)則不使用任何按鍵(`code` 為 `"Unidentified"`)。
- `{ type: "key", key }` 按下 `Enter`、`Tab`、`Escape` 或 `Backspace`。

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

在 Rust 中,對應的是 `WebInput::Click { x, y }`、`WebInput::Text(text)` 與 `WebInput::Key(WebKey::Enter)`。

受信任的輸入帶有使用者啟動狀態(user activation),可以開啟視窗、寫入剪貼簿、開啟系統的檔案面板,或按下頁面的確認按鈕,因此它是一項獨立的 capability:應用程式需要在 `nsh.json` 的 `capabilities`([`webview`](./sandbox-and-capabilities.md#webview))中加入 `"webview": { "input": true }`,即使它沒有宣告任何 capability 也一樣,否則 core 會丟棄該呼叫。

與點擊一樣,`sendInput` 會把鍵盤焦點從應用程式自身的 `Input` 移到 web view。頁面按自己的節奏處理輸入:點擊所產生的事件在下一次呼叫開始時可能仍在傳遞途中,因此在點擊之後輸入文字前,請先讓點擊穩定下來(約一個 frame)。macOS 會傳遞該輸入;其他平台目前會忽略它。

在提供任何依賴它的功能之前,請先確認它在當前環境是否可用:`web_input_available()`(`WebView.inputAvailable()`)只有在平台會傳遞該輸入、且應用程式持有 `webview.input` 時才會解析為 `true`,因此在忽略該呼叫的平台以及沒有此授權的應用程式中,結果為 `false`。

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

### web view 可以顯示哪些網站

如果你的 `nsh.json` 宣告了 `"capabilities"`,web view 就只能顯示並導覽至 `webview` 下列出的主機:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

檢查範圍涵蓋 web view 的 `src` 以及頁面進行的每一次頂層導覽(連結、重新導向、`location` 變更);這是在平台詢問某次導覽是否可繼續時由原生層判定的。頁面自身的子資源(腳本、圖片、frame)屬於網頁內容的範疇,不會被檢查。`*.example.com` 只匹配子網域;如要包含主網域,請同時列出 `example.com`。沒有 `"capabilities"` 鍵的應用程式可以顯示任何頁面。請參閱[沙盒與 capabilities](./sandbox-and-capabilities.md)。

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

播放由 props 控制:透過 signal 設定 `paused`、`muted`、`volume` 與 `rate`,播放器便會跟隨。ref 具有 `seek(seconds)`。

在 Rust 中,`video(url)` 負責建立播放器(URL 可以是值、signal 或 closure),每個 prop 都是 snake case 的 builder 方法(`paused`、`repeat(true)`、`object_fit(ResizeMode::Contain)`(`objectFit` 樣式)、`progress_interval` 對應 `progressUpdateInterval`);`on_load` 會收到 `VideoInfo`(`duration`、`size`),`on_progress` 會收到 `VideoProgress`(`current_time`、`duration`),`on_buffer` 則會收到 `bool`。

| Prop | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `src` | `string` | | 影片的 URL。 |
| `paused` | `boolean` | `false` | 播放已暫停。 |
| `muted` | `boolean` | `false` | 靜音。 |
| `volume` | `number` | `1` | 0..1。 |
| `rate` | `number` | `1` | 播放速度。 |
| `repeat` | `boolean` | `false` | 播放至結尾時從頭重新播放。 |
| `objectFit`(style)、`object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | 畫面如何配合 view,與 CSS 的 `object-fit` 相同(`class="object-cover"`)。 |
| `controls` | `boolean` | `false` | 平台的播放控制項。 |
| `progressUpdateInterval` | `number` | `250` | `onProgress` 事件之間相隔的毫秒數。 |

| 事件 | Payload | 觸發時機 |
|---|---|---|
| `onLoadStart` | | 開始載入。 |
| `onLoad` | `{ duration, size }` | 影片已就緒:提供其長度(秒)與尺寸。 |
| `onProgress` | `{ currentTime, duration }` | 播放期間,每隔 `progressUpdateInterval` 毫秒觸發。 |
| `onBuffer` | `{ isBuffering }` | 播放因等待資料而停頓,或已恢復。 |
| `onEnd` | | 播放已到達結尾。 |
| `onError` | `{ message }` | 載入或播放失敗。 |

使用 `controls` 時,平台會繪製自己的播放按鈕、進度條和全螢幕按鈕。不使用時,可以用疊在影片上方或放在其下方的 view 自行繪製;由於影片是 layout 中的原生 view,疊加內容可以自然運作:

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

影片來源屬於網絡請求:在宣告了 capabilities 的情況下,影片的主機必須在 `nsh.json` 的 `network` 下獲得允許,與 `fetch` 和遠端圖片相同。被拒絕的來源不會顯示任何內容,並且會記錄一次拒絕,同時附上需要加入的鍵。

<a id="related"></a>

## 相關內容

- [`WebView`](../elements/web-view.md) 與 [`Video`](../elements/video.md):元素參考。
- [沙盒與 capabilities](./sandbox-and-capabilities.md):`webview` 與 `network` 授權。
- [原生組件](./native-components.md):嵌入你的宿主應用程式所提供的其他原生 view。
