---
title: "Web view と動画"
description: "WebView による Web ページの表示と Video による動画の再生 - ソース、ページとアプリ間のメッセージング、ナビゲーション、再生制御、refs と機能について。"
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# Web ビューとビデオ

Web ビューとビデオプレーヤーは、プラットフォーム標準の Web エンジンとメディアプレーヤーを通常のビューとして埋め込みます。Rust では `web_view` と `video`（`nsh_core::prelude`）、TSX では `WebView` と `Video`（`nsh` から）を使います。NSH はネイティブビューでレンダリングするため、これらは他の要素と同じようにレイアウトに配置できます。親と一緒にスクロールし、角丸やクリッピングが適用され、他のビューが重なっても重なり順の問題は起きません。

| コンポーネント | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | WebKitGTK 6.0 の `WebKitWebView` | WebView2（子ウィンドウ内） |
| `Video` | AVPlayerLayer。`controls` 指定時は AVPlayerViewController | TextureView 上の MediaPlayer。`controls` 指定時は MediaController | AVPlayerLayer。`controls` 指定時は AVKit の AVPlayerView | `GtkPicture` 内の GTK のメディアストリーム（GStreamer）。`controls` 指定時は `GtkVideo` | Media Foundation のメディアエンジン（フレームは Direct2D で描画）。`controls` 指定時は NSH 独自のコントロールバー |

これらの背後にあるフレームワーク（WebKit、AVFoundation）は、アプリが初めて使うときに読み込まれます。そのため、Web ページやビデオを一切表示しないアプリは、起動時にそのコストを負担しません。

[macOS](./macos.md) では、Web ビューは独自のスクロールビューを持ちません。`scrollable={false}` を指定すると、マウスホイールとトラックパッドはページではなく、その周囲にあるアプリのスクロールビューをスクロールします。ページ自体はキーボードと自身のスクリプトでスクロールできます。

[Linux](./linux.md) では、Web ビューはそのビューの内側に描画される WebKitGTK のページです。その上に重なる NSH のコンテンツ（ダイアログ、シート）が Web ビューを覆い、親が Web ビューをクリップします。`webview` ケイパビリティは、ここではフレームのナビゲーションにも適用されます（許可されていないホストの `iframe` は空のままになります）。また、`scrollable: false` はページ自体のスクロールを止めます（ページ内の要素は引き続きスクロールします）。アプリには WebKitGTK 6.0 のインストールが必要です。これがない状態でビルドされたランタイムは、中立的なプレースホルダーを表示します。ビデオは、インストール済みの GStreamer プラグインがデコードできる形式を再生します。`rate` はサポートされず（1× で再生されます）、`onEnd` はループしないビデオでのみ届きます。

[Windows](./windows.md) では、Web ビューはそのビューに追従する子ウィンドウ内の WebView2 コントロールです。親と角丸でクリップされますが、その上に描画される NSH のコンテンツ（ダイアログ、シート）は Web ビューの下に残ります。WebView2 Runtime が必要です（Windows 11 に含まれ、Windows 10 では Edge とともにインストールされます）。ない場合はプレースホルダーを表示します。HTML 用の `baseUrl`、`scrollable`、`allowsBackForwardNavigationGestures` はサポートされません。ビデオは通常のコンテンツとして扱われ（他のビューと同様にクリップ、変形、被覆されます）、インストール済みの Media Foundation コーデックがデコードできる形式を再生します。`rate` は動作し、ポスターはなく、`controls` がオンの間はコントロールバーが常に表示されます。

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

### ソース

Web ビューは `src` と `html` のいずれかを表示します。

| Props | 表示内容 |
|---|---|
| `src="https://…"` | Web ページ。 |
| `html="<!doctype html>…"` | 文字列からの HTML。`src` の代わりに表示されます。 |
| `html` と `baseUrl="https://example.com/"` | 相対 URL が `baseUrl` を基準に解決される HTML。 |

Rust では、`web_view(url)` がページを、`web_view_html(html, base_url)` が HTML を表示します（`base_url` は `Option<&str>` を受け取ります）。URL と HTML にはシグナルまたはクロージャを渡せます。その場合、読み取っている値が変わるとページを再読み込みします。`src` または `html` を変更すると、新しいページを読み込みます。

### Props

Rust では、各 prop はスネークケースのビルダーメソッド（`injected_java_script`、`java_script_enabled`、`scrollable`、`user_agent`。`injectedJavaScriptBeforeContentLoaded` には `injected_java_script_before_content`、iOS の `allowsBackForwardNavigationGestures` には `back_forward_gestures`）で、各イベントは `on_…` メソッド（`on_navigation_state_change`）です。リスナーは `WebNavigation`（`url`、`title`、`loading`、`can_go_back`、`can_go_forward`）を受け取ります。`on_error` と `on_message` の場合は `&str` を受け取ります。

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `src` | `string` | | 表示するページの URL。 |
| `html` | `string` | | インライン HTML。`src` の代わりに表示されます。 |
| `baseUrl` | `string` | | `html` の相対 URL の解決基準。 |
| `injectedJavaScript` | `string` | | ページの読み込みごとに、読み込み後に実行されます。 |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | ページ自身のスクリプトより前に実行されます。 |
| `javaScriptEnabled` | `boolean` | `true` | ページがスクリプトを実行します。 |
| `scrollable` | `boolean` | `true` | ユーザーがページをスクロールできます。 |
| `userAgent` | `string` | | ブラウザーのユーザーエージェント文字列。 |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: スワイプでページ履歴を戻る・進む。 |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: トラックパッドで 2 本指スワイプして戻る・進む。Windows: タッチスクリーンでスワイプ。Linux: タッチパッドでスワイプ。 |

イベント:

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | ページの読み込みが始まったとき。 |
| `onLoad` | `WebViewNavigation` | ページの読み込みが完了したとき。 |
| `onError` | `{ message }` | 読み込みに失敗したとき。 |
| `onNavigationStateChange` | `WebViewNavigation` | URL、タイトル、読み込み状態、または履歴が変わったとき。 |
| `onMessage` | `{ data: string }` | ページがメッセージを送信したとき（後述）。 |

`WebViewNavigation` は `{ url, title, loading, canGoBack, canGoForward }` です。

<a id="a-browser-with-back-and-forward"></a>

### 戻る・進むを備えたブラウザー

Web ビューの ref（Rust では `.element_ref(&web)` で、TSX では `ref` で付ける `element_ref()`）には、`reload`、`go_back` / `goBack`、`go_forward` / `goForward`、`stop_loading` / `stopLoading`、`inject_java_script` / `injectJavaScript(script)`、`post_message` / `postMessage(data)`、`send_input` / `sendInput(input)` があります（[後述](#input-as-the-users-own)）。

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

### ページとアプリ間のメッセージング

ページは `window.nsh.postMessage(string)` でアプリと通信し、メッセージは `on_message`（`onMessage`）として届きます。アプリは ref の `post_message`（`postMessage(string)`）でページと通信し、メッセージはページ内で `window` 上の `message` イベントとして届きます。メッセージは文字列です。構造化データには JSON を送ってください。

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

ref の `inject_java_script`（`injectJavaScript(script)`）は、現在のページでいつでもコードを実行します。`injected_java_script` と `injected_java_script_before_content`（`injectedJavaScript`、`injectedJavaScriptBeforeContentLoaded`）は、ページ自身のスクリプトの前または後に、ページの読み込みごとに実行されます。フックのインストールにはここを使います。

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

### ユーザー自身の操作としての入力

`injectJavaScript` では合成イベントしか作れず、ページはそれを信頼できないもの（`event.isTrusted` は `false`）として扱い、一部のウィジェットは無視します。ref の `send_input`（`sendInput(input)`）は、ユーザー自身の手による操作と同じようにページへ入力を与えるため、そのイベントは信頼されます。

- `{ type: "click", x, y }` は、ビューポート上の点を CSS ピクセル（`getBoundingClientRect()` が報告する単位）でクリックします。
- `{ type: "text", text }` は、ページがフォーカスしている要素へ、1 キーずつテキストを入力します。各文字は US 配列の対応するキーで、改行は Enter で入力され、US キーで入力できないもの（`é`、CJK、絵文字）はどのキーも使わずに入力されます（`code` は `"Unidentified"`）。
- `{ type: "key", key }` は、`Enter`、`Tab`、`Escape`、`Backspace` を押します。

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

Rust では、これらは `WebInput::Click { x, y }`、`WebInput::Text(text)`、`WebInput::Key(WebKey::Enter)` です。

信頼された入力にはユーザーアクティベーションが伴います（ウィンドウを開く、クリップボードに書き込む、システムのファイルパネルを開く、ページの確認ボタンを押す、といったことができます）。そのため、これは独立したケイパビリティです。アプリには `nsh.json` の `capabilities`（[`webview`](./sandbox-and-capabilities.md#webview)）に `"webview": { "input": true }` が必要で、何も宣言していない場合も同様です。ない場合、コアは呼び出しを破棄します。

クリックと同様に、`sendInput` は Web ビューのためにキーボードフォーカスを取得し、アプリ自身の `Input` からフォーカスを奪います。ページは自身のタイミングで入力を処理します。クリックのイベントは、次の呼び出しが始まっても処理中のことがあるため、クリックの後に入力する前には、クリックが落ち着くのを（1 フレーム程度）待ってください。macOS は入力を配信しますが、他のプラットフォームは今のところ無視します。

これに依存する機能を提供する前に、ここで動作するかを確認してください。`web_input_available()`（`WebView.inputAvailable()`）は、プラットフォームが入力を配信し、かつアプリが `webview.input` を持っている場合にのみ `true` で解決されます。そのため、呼び出しを無視するプラットフォームや、許可のないアプリでは `false` になります。

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

### Web ビューが表示できるサイト

`nsh.json` が `"capabilities"` を宣言している場合、Web ビューは `webview` に列挙されたホストのみを表示し、そこへのみナビゲートできます。

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

このチェックは、Web ビューの `src` と、ページが行うすべてのトップレベルナビゲーション（リンク、リダイレクト、`location` の変更）を対象とします。判定は、プラットフォームがナビゲーションを進めてよいか問い合わせた時点でネイティブに行われます。ページ自身のサブリソース（スクリプト、画像、フレーム）は Web コンテンツ側の責任であり、チェックされません。`*.example.com` はサブドメインのみに一致するため、ベアドメインには `example.com` も列挙してください。`"capabilities"` キーのないアプリは、任意のページを表示できます。[サンドボックスとケイパビリティ](./sandbox-and-capabilities.md)を参照してください。

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

再生は props で制御します。`paused`、`muted`、`volume`、`rate` をシグナルから設定すると、プレーヤーがそれに追従します。ref には `seek(seconds)` があります。

Rust では、`video(url)` がプレーヤーを作成し（URL には値、シグナル、またはクロージャを渡せます）、各 prop はスネークケースのビルダーメソッド（`paused`、`repeat(true)`、`object_fit(ResizeMode::Contain)`（`objectFit` スタイル）、`progressUpdateInterval` には `progress_interval`）です。`on_load` は `VideoInfo`（`duration`、`size`）を、`on_progress` は `VideoProgress`（`current_time`、`duration`）を、`on_buffer` は `bool` を受け取ります。

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `src` | `string` | | ビデオの URL。 |
| `paused` | `boolean` | `false` | 再生を一時停止します。 |
| `muted` | `boolean` | `false` | 無音にします。 |
| `volume` | `number` | `1` | 0〜1。 |
| `rate` | `number` | `1` | 再生速度。 |
| `repeat` | `boolean` | `false` | 終了時に最初から再び再生します。 |
| `objectFit`（スタイル）、`object-*` クラス | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | 映像をビューに合わせる方法。CSS の `object-fit`（`class="object-cover"`）と同じです。 |
| `controls` | `boolean` | `false` | プラットフォームの再生コントロール。 |
| `progressUpdateInterval` | `number` | `250` | `onProgress` イベントの間隔（ミリ秒）。 |

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| `onLoadStart` | | 読み込みが始まったとき。 |
| `onLoad` | `{ duration, size }` | ビデオの準備ができたとき（長さ（秒）とサイズ）。 |
| `onProgress` | `{ currentTime, duration }` | 再生中、`progressUpdateInterval` ミリ秒ごと。 |
| `onBuffer` | `{ isBuffering }` | データ待ちで再生が停止したとき、または再開したとき。 |
| `onEnd` | | 再生が終端に達したとき。 |
| `onError` | `{ message }` | 読み込みまたは再生に失敗したとき。 |

`controls` を指定すると、プラットフォームが独自の再生ボタン、シークバー、全画面ボタンを描画します。指定しない場合は、ビデオの上または下にビューを置いて独自に描画します。ビデオはレイアウト内のネイティブビューなので、オーバーレイは自然に機能します。

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

ビデオのソースはネットワークリクエストです。ケイパビリティを宣言している場合、`fetch` やリモート画像と同様に、ビデオのホストは `nsh.json` の `network` で許可されている必要があります。拒否されたソースは何も表示されず、拒否は追加すべきキーとともに一度だけログに記録されます。

<a id="related"></a>

## 関連項目

- [`WebView`](../elements/web-view.md) と [`Video`](../elements/video.md): 要素リファレンス。
- [サンドボックスとケイパビリティ](./sandbox-and-capabilities.md): `webview` と `network` の許可。
- [ネイティブコンポーネント](./native-components.md): ホストアプリが提供する他のネイティブビューの埋め込み。
