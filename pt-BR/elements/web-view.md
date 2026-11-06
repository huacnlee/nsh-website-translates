---
title: "WebView"
description: "O elemento WebView: páginas da web e HTML embutido dentro de um app, com troca de mensagens nos dois sentidos."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---


# WebView

Uma web view mostra uma página da web, ou HTML que você fornece, dentro do app: WKWebView no iOS e no Mac Catalyst,
`android.webkit.WebView` no Android. Como o NSH renderiza com views nativas, uma web view se encaixa no layout como qualquer outra
view, na ordem das views ao redor. Em Rust, você cria uma com `web_view(url)` ou `web_view_html(html, base_url)`; em TSX,
com `<WebView>` de `nsh`.

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

Em TSX, uma web view recebe `src` ou `html` (veja a [WebView API](../modules/nsh-webview.md)). O
[guia de web view e vídeo](../docs/web-view-and-video.md) aborda padrões de mensagens e capacidades.

## Props

Uma web view recebe as props de uma [view](./view.md) (ela não tem filhos) e mais:

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | A URL da página a ser exibida. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | HTML inline, exibido no lugar de `src`. |
| `baseUrl` | `base_url` de `web_view_html` / `.html` | `string` | | Em relação a que os links relativos de `html` são resolvidos. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | Executa depois que cada página é carregada. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | Executa antes dos scripts da própria página. |
| `userAgent` | `.user_agent(..)` | `string` | | A string de user agent do navegador. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | As páginas executam scripts. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | O usuário pode rolar a página. |

| Chave `ios` | Rust | Tipo | Descrição |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | Deslizar a partir das bordas para voltar e avançar. |

| Chave `desktop` | Rust | Tipo | Descrição |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: deslizar com dois dedos no trackpad para voltar e avançar; Windows: deslizar em uma tela sensível ao toque; Linux: deslizar no touchpad. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | Uma página começou a carregar. |
| `onLoad` | `.on_load` | `WebViewNavigation` | Uma página terminou de carregar. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, a mensagem) | O carregamento falhou; `code` é `"ERR_ACCESS_DENIED"` para uma página ou `html` que as capacidades do app não concedem. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | A URL, o título, o estado de carregamento ou o histórico mudou. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | A página chamou `window.nsh.postMessage(data)`. |
| `onDownload` | | `WebViewDownload` | Um download começou, terminou ou falhou (macOS). |

`WebViewNavigation` é `{ url, title, loading, canGoBack, canGoForward }`; em Rust, `WebNavigation` com `url`, `title`,
`loading`, `can_go_back` e `can_go_forward`.

`WebViewDownload` é `{ state, id, url, filename, path, bytes?, message? }`: `state` é `"started"`, `"finished"`
(com o `bytes` do arquivo) ou `"failed"` (com seu `message`). Com um listener `onDownload`, o que a página baixa
(um anexo, um tipo que a web view não exibe, um link `download`) é salvo no diretório de dados do app como
`downloads/<id>/<filename>`, para onde `path` aponta, e o app o lê com `fs/promises`.

No macOS, adicionar o listener permite que qualquer página carregada e permitida pela capacidade `webview` salve downloads
automaticamente. O app é responsável pelo seu orçamento de armazenamento e por remover os arquivos concluídos de `downloads/`
quando terminar de usá-los. Remover a web view cancela os downloads em andamento e remove seus diretórios
parciais. Os downloads são reportados por `onDownload`; converter uma navegação em download mantém `onError`
para falhas reais de navegação. Nos nomes de arquivo, caracteres de controle e controles de formatação bidirecional são removidos,
e nomes longos são encurtados para 200 bytes, preservando uma extensão que caiba.

<a id="ref-methods"></a>

## Métodos do ref

| Método | Rust | Descrição |
|---|---|---|
| `reload()` | `reload()` | Recarrega a página. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | Navega pelo histórico da página. |
| `stopLoading()` | `stop_loading()` | Interrompe o carregamento. |
| `injectJavaScript(script)` | `inject_java_script(script)` | Executa JavaScript na página. |
| `postMessage(data)` | `post_message(data)` | Envia uma string para a página, que recebe um evento `message` em `window`. |

<a id="messaging"></a>

## Mensagens

O app e a página trocam strings. A página envia com `window.nsh.postMessage(data)`; o app envia
com o `postMessage(data)` do ref (`post_message(..)` em Rust). Envie JSON para dados estruturados.

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

<a id="capabilities"></a>

## Capacidades

Quando o app declara [capacidades](../docs/sandbox-and-capabilities.md) em `nsh.json`, uma web view exibe e
navega para os hosts listados em `webview`. Um `src` em outro host, ou `html` em um app sem `webview`, exibe uma
view vazia; uma navegação de nível superior para outro host (um link em que o usuário toca) é cancelada nativamente. Cada caso reporta
`onError` com `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## Notas de plataforma

- O iOS carrega o WebKit na primeira vez que uma web view é criada, então isso só tem custo para o app quando ele exibe uma.
- No macOS, `onDownload` salva downloads com o `WKDownload` do WebKit.
- No Android, as chamadas `postMessage` da página chegam em uma thread em segundo plano e são encaminhadas ao app em ordem.
- Para arredondar os cantos de uma web view, dê a ela um raio de canto e `overflow: "hidden"` (`.overflow_hidden()`).
