---
title: "WebView"
description: "WebView 要素:アプリ内でWebページやインラインHTMLを表示し、双方向のメッセージングにも対応します。"
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

Web ビューは、Web ページまたは渡した HTML をアプリ内に表示します。iOS と Mac Catalyst では WKWebView、Android では `android.webkit.WebView` を使います。NSH はネイティブビューでレンダリングするため、Web ビューは他のビューと同様にレイアウトに配置され、周囲のビューと順序どおりに並びます。Rust では `web_view(url)` または `web_view_html(html, base_url)` で、TSX では `nsh` の `<WebView>` で作成します。

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

TSX では、Web ビューは `src` と `html` のいずれか一方を受け取ります([WebView API](../modules/nsh-webview.md) を参照)。[Web ビューと動画のガイド](../docs/web-view-and-video.md)では、メッセージングのパターンと capabilities を扱っています。

## Props

Web ビューは [view](./view.md) の Props(子要素は持ちません)に加えて、次の Props を受け取ります。

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | 表示するページの URL。 |
| `html` | `web_view_html(html, base_url)`、`.html(html, base_url)` | `string` | | インライン HTML。`src` の代わりに表示されます。 |
| `baseUrl` | `web_view_html` / `.html` の `base_url` | `string` | | `html` 内の相対リンクの解決基準。 |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | 各ページの読み込み後に実行されます。 |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | 各ページ自身のスクリプトより前に実行されます。 |
| `userAgent` | `.user_agent(..)` | `string` | | ブラウザーのユーザーエージェント文字列。 |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | ページでスクリプトを実行します。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | ユーザーがページをスクロールできます。 |

| `ios` キー | Rust | 型 | 説明 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | 画面の端からスワイプして、戻る・進むを行います。 |

| `desktop` キー | Rust | 型 | 説明 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: トラックパッドで2本指でスワイプして、戻る・進むを行います。Windows: タッチスクリーンでスワイプします。Linux: タッチパッドでスワイプします。 |

## Events

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | ページの読み込みが開始されたとき。 |
| `onLoad` | `.on_load` | `WebViewNavigation` | ページの読み込みが完了したとき。 |
| `onError` | `.on_error` | `{ message, code? }`(`&str`、メッセージ) | 読み込みに失敗したとき。`code` は、ページの場合は `"ERR_ACCESS_DENIED"`、アプリの capabilities が許可していないものの場合は `html` になります。 |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | URL、タイトル、読み込み状態、または履歴が変化したとき。 |
| `onMessage` | `.on_message` | `{ data: string }`(`&str`) | ページが `window.nsh.postMessage(data)` を呼び出したとき。 |
| `onDownload` | | `WebViewDownload` | ダウンロードが開始、完了、または失敗したとき(macOS)。 |

`WebViewNavigation` は `{ url, title, loading, canGoBack, canGoForward }` です。Rust では `WebNavigation` で、`url`、`title`、`loading`、`can_go_back`、`can_go_forward` を持ちます。

`WebViewDownload` は `{ state, id, url, filename, path, bytes?, message? }` です。`state` は `"started"`、`"finished"`(ファイルの `bytes` を伴う)、または `"failed"`(その `message` を伴う)のいずれかです。`onDownload` リスナーがある場合、ページがダウンロードするもの(添付ファイル、Web ビューが表示しない種類のもの、`download` リンク)は、アプリのデータディレクトリに `downloads/<id>/<filename>` として保存されます。`path` はその保存先を指し、アプリは `fs/promises` で読み取ります。

macOS では、リスナーを追加すると、`webview` capability で許可されている読み込み済みのどのページでも、ダウンロードが自動的に保存されるようになります。ストレージの使用量の管理と、使い終えた完了済みファイルの `downloads/` からの削除は、アプリの責任です。Web ビューを削除すると、進行中のダウンロードはキャンセルされ、その一時ディレクトリも削除されます。ダウンロードは `onDownload` を通じて報告されます。ナビゲーションをダウンロードに変換した場合、`onError` は実際のナビゲーション失敗のために残されます。ファイル名からは制御文字と双方向書式制御文字が取り除かれ、長い名前は、収まる拡張子を保持したまま 200 バイトに短縮されます。

## Ref methods

| メソッド | Rust | 説明 |
|---|---|---|
| `reload()` | `reload()` | ページを再読み込みします。 |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | ページの履歴内を移動します。 |
| `stopLoading()` | `stop_loading()` | 読み込みを停止します。 |
| `injectJavaScript(script)` | `inject_java_script(script)` | ページ内で JavaScript を実行します。 |
| `postMessage(data)` | `post_message(data)` | ページに文字列を送信します。ページは `window` で `message` イベントを受け取ります。 |

## Messaging

アプリとページは文字列をやり取りします。ページは `window.nsh.postMessage(data)` で送信し、アプリは ref の `postMessage(data)`(Rust では `post_message(..)`)で送信します。構造化データを送るには JSON を使用してください。

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

アプリが `nsh.json` で [capabilities](../docs/sandbox-and-capabilities.md) を宣言している場合、Web ビューは `webview` に列挙されたホストを表示し、そこへナビゲートします。他のホストの `src`、または `webview` のないアプリでの `html` は、空のビューを表示します。他のホストへのトップレベルのナビゲーション(ユーザーがタップしたリンクなど)は、ネイティブ側でキャンセルされます。いずれの場合も、`code` `"ERR_ACCESS_DENIED"` とともに `onError` が報告されます。

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

## Platform notes

- iOS では、Web ビューが最初に作成されるときに WebKit が読み込まれるため、アプリにコストが生じるのは Web ビューを表示したときだけです。
- macOS では、`onDownload` は WebKit の `WKDownload` でダウンロードを保存します。
- Android では、ページからの `postMessage` 呼び出しはバックグラウンドスレッドで届き、順序どおりにアプリへ転送されます。
- Web ビューの角を丸めるには、角丸の半径と `overflow: "hidden"`(`.overflow_hidden()`)を指定します。
