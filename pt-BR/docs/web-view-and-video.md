---
title: "Web view e vídeo"
description: "Exibindo páginas da web com WebView e reproduzindo vídeo com Video - fontes, troca de mensagens entre a página e o app, navegação, controle de reprodução, refs e capacidades."
order: 45
group: ui
source_hash: f15d6d5032c41887
---


# Web view e vídeo

A web view e o video player incorporam o mecanismo web e o player de mídia da própria plataforma como views comuns: `web_view` e `video` em Rust (`nsh_core::prelude`), `WebView` e `Video` de `nsh` em TSX. Como o NSH renderiza com views nativas, elas ficam no seu layout como qualquer outro elemento: rolam junto com o pai, aceitam cantos arredondados e recorte, e outras views podem sobrepô-las sem problemas de camadas.

| Componente | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` do WebKitGTK 6.0 | WebView2, em uma janela filha |
| `Video` | AVPlayerLayer; AVPlayerViewController com `controls` | MediaPlayer em uma TextureView; MediaController com `controls` | AVPlayerLayer; AVPlayerView do AVKit com `controls` | media stream do GTK (GStreamer) em um `GtkPicture`; `GtkVideo` com `controls` | media engine do Media Foundation, com quadros desenhados via Direct2D; barra de controles própria do NSH com `controls` |

Os frameworks por trás deles (WebKit, AVFoundation) são carregados na primeira vez que um app usa algum deles, então apps que nunca exibem uma página web ou um vídeo não pagam esse custo na inicialização.

No [macOS](./macos.md), a web view não tem uma scroll view própria: com `scrollable={false}`, a roda do mouse e o trackpad rolam as scroll views do app ao redor, em vez da página, que continua rolando pelo teclado e pelos próprios scripts.

No [Linux](./linux.md), uma web view é uma página WebKitGTK desenhada dentro da sua view: conteúdo do NSH sobre ela (um diálogo, uma sheet) a cobre, e seus pais a recortam. A capacidade `webview` também se aplica às navegações de frames nessa plataforma (um `iframe` de um host não autorizado fica vazio), e `scrollable: false` impede que a própria página role (os elementos dentro dela continuam rolando). Os apps precisam do WebKitGTK 6.0 instalado; um runtime compilado sem ele mostra um placeholder neutro. Os vídeos reproduzem os formatos que os plugins GStreamer instalados decodificam; `rate` não é suportado (eles tocam a 1×), e `onEnd` só vem para vídeos que não estão em loop.

No [Windows](./windows.md), uma web view é um controle WebView2 em uma janela filha que acompanha a sua view: ela é recortada pelos pais e pelos cantos arredondados, mas o conteúdo do NSH desenhado sobre ela (um diálogo, uma sheet) fica por baixo dela. Ela precisa do WebView2 Runtime (parte do Windows 11; instalado com o Edge no Windows 10); caso contrário, mostra um placeholder; `baseUrl` para HTML, `scrollable` e `allowsBackForwardNavigationGestures` não são suportados. Os vídeos são conteúdo comum (recortados, transformados e cobertos como qualquer view) e reproduzem os formatos que os codecs instalados do Media Foundation decodificam; `rate` funciona, não há poster, e a barra de controles sempre aparece enquanto `controls` está ativado.

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

### Fontes

Uma web view mostra uma entre `src` e `html`:

| Props | Mostra |
|---|---|
| `src="https://…"` | Uma página web. |
| `html="<!doctype html>…"` | HTML a partir de uma string, mostrado no lugar de `src`. |
| `html` com `baseUrl="https://example.com/"` | HTML cujas URLs relativas são resolvidas a partir de `baseUrl`. |

Em Rust, `web_view(url)` mostra uma página e `web_view_html(html, base_url)` mostra HTML (`base_url` um `Option<&str>`); a URL e o HTML podem ser um signal ou uma closure, que recarrega a página quando o que ela lê muda. Alterar `src` ou `html` carrega a nova página.

### Props

Em Rust, cada prop é um método builder em snake case (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injected_java_script_before_content` para `injectedJavaScriptBeforeContentLoaded`, `back_forward_gestures` para o `allowsBackForwardNavigationGestures` do iOS) e cada evento é um método `on_…` (`on_navigation_state_change`) cujo listener recebe um `WebNavigation` (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) ou, para `on_error` e `on_message`, um `&str`.

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `src` | `string` | | A URL da página a mostrar. |
| `html` | `string` | | HTML inline, mostrado no lugar de `src`. |
| `baseUrl` | `string` | | A base contra a qual as URLs relativas de `html` são resolvidas. |
| `injectedJavaScript` | `string` | | Executa depois que cada página é carregada. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Executa antes dos scripts de cada página. |
| `javaScriptEnabled` | `boolean` | `true` | As páginas executam scripts. |
| `scrollable` | `boolean` | `true` | O usuário pode rolar a página. |
| `userAgent` | `string` | | A string de user agent do navegador. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: deslizar para voltar e avançar no histórico da página. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: deslizar com dois dedos no trackpad para voltar e avançar; Windows: deslizar em uma tela sensível ao toque; Linux: deslizar no touchpad. |

Eventos:

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Uma página começou a carregar. |
| `onLoad` | `WebViewNavigation` | Uma página terminou de carregar. |
| `onError` | `{ message }` | O carregamento falhou. |
| `onNavigationStateChange` | `WebViewNavigation` | A URL, o título, o estado de carregamento ou o histórico mudou. |
| `onMessage` | `{ data: string }` | A página enviou uma mensagem (abaixo). |

`WebViewNavigation` é `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### Um navegador com voltar e avançar

A ref da web view (um `element_ref()` colocado nela com `.element_ref(&web)` em Rust, `ref` em TSX) tem `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` e `send_input` / `sendInput(input)` ([abaixo](#input-as-the-users-own)):

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

### Mensagens entre a página e o app

As páginas se comunicam com o app usando `window.nsh.postMessage(string)`, que chega como `on_message` (`onMessage`). O app se comunica com a página usando o `post_message` da ref (`postMessage(string)`), que chega à página como um evento `message` em `window`. As mensagens são strings; envie JSON para dados estruturados.

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

O `inject_java_script` da ref (`injectJavaScript(script)`) executa código na página atual a qualquer momento; `injected_java_script` e `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) executam a cada carregamento de página, antes ou depois dos scripts da própria página, que é o lugar para instalar hooks:

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

### Entrada como se fosse do próprio usuário

`injectJavaScript` só consegue criar eventos sintéticos, que uma página vê como não confiáveis (`event.isTrusted` é `false`) e que alguns widgets ignoram. O `send_input` da ref (`sendInput(input)`) entrega à página uma entrada como se viesse das mãos do próprio usuário, de modo que seus eventos são confiáveis:

- `{ type: "click", x, y }` clica em um ponto da viewport, em pixels CSS (o que `getBoundingClientRect()` informa).
- `{ type: "text", text }` digita o texto no elemento que tem o foco da página, uma tecla por vez: cada caractere na tecla correspondente do layout US, uma quebra de linha como Enter, e o que nenhuma tecla US digita (`é`, CJK, emoji) em nenhuma tecla (`code` é `"Unidentified"`).
- `{ type: "key", key }` pressiona `Enter`, `Tab`, `Escape` ou `Backspace`.

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

Em Rust, estes são `WebInput::Click { x, y }`, `WebInput::Text(text)` e `WebInput::Key(WebKey::Enter)`.

A entrada confiável carrega ativação do usuário (ela pode abrir janelas, escrever na área de transferência, abrir o painel de arquivos do sistema ou pressionar o botão de confirmação de uma página), então é uma capacidade à parte: o app precisa de `"webview": { "input": true }` em `capabilities` de `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview)), mesmo quando não declara nenhuma, e o core descarta a chamada caso contrário.

Como um clique, `sendInput` tira o foco do teclado do `Input` do próprio app e o dá à web view. A página trata a entrada no seu próprio ritmo: os eventos de um clique ainda podem estar a caminho quando a próxima chamada começa, então deixe o clique se assentar (um quadro, mais ou menos) antes de digitar depois dele. O macOS entrega a entrada; as outras plataformas a ignoram por enquanto.

Antes de oferecer qualquer coisa que dependa disso, pergunte se funciona aqui: `web_input_available()` (`WebView.inputAvailable()`) resolve `true` apenas onde a plataforma entrega a entrada e o app possui `webview.input`, portanto é `false` em plataformas que ignoram a chamada e em apps sem a concessão.

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

### Quais sites uma web view pode mostrar

Se o seu `nsh.json` declara `"capabilities"`, uma web view só pode mostrar e navegar para os hosts listados em `webview`:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

A verificação cobre o `src` da web view e toda navegação de nível superior feita pela página (links, redirecionamentos, alterações de `location`); ela é decidida nativamente quando a plataforma pergunta se uma navegação pode prosseguir. Os subrecursos da própria página (scripts, imagens, frames) são responsabilidade do conteúdo web e não são verificados. `*.example.com` corresponde apenas a subdomínios; liste também `example.com` para o domínio sem prefixo. Um app sem uma chave `"capabilities"` pode mostrar qualquer página. Veja [Sandbox e capacidades](./sandbox-and-capabilities.md).

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

A reprodução é controlada por props: defina `paused`, `muted`, `volume` e `rate` a partir de signals e o player acompanha. A ref tem `seek(seconds)`.

Em Rust, `video(url)` cria o player (a URL sendo um valor, um signal ou uma closure) e cada prop é um método builder em snake case (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (o estilo `objectFit`), `progress_interval` para `progressUpdateInterval`); `on_load` recebe um `VideoInfo` (`duration`, `size`), `on_progress` um `VideoProgress` (`current_time`, `duration`) e `on_buffer` um `bool`.

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `src` | `string` | | A URL do vídeo. |
| `paused` | `boolean` | `false` | A reprodução está pausada. |
| `muted` | `boolean` | `false` | Sem som. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | A velocidade de reprodução. |
| `repeat` | `boolean` | `false` | Reproduz de novo desde o início ao chegar ao fim. |
| `objectFit` (estilo), classes `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Como a imagem se ajusta à view, como o `object-fit` do CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | Os controles de reprodução da plataforma. |
| `progressUpdateInterval` | `number` | `250` | Milissegundos entre eventos `onProgress`. |

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | | O carregamento começou. |
| `onLoad` | `{ duration, size }` | O vídeo está pronto: sua duração em segundos e seu tamanho. |
| `onProgress` | `{ currentTime, duration }` | Durante a reprodução, a cada `progressUpdateInterval` ms. |
| `onBuffer` | `{ isBuffering }` | A reprodução parou à espera de dados, ou foi retomada. |
| `onEnd` | | A reprodução chegou ao fim. |
| `onError` | `{ message }` | O carregamento ou a reprodução falhou. |

Com `controls`, a plataforma desenha seu próprio botão de reproduzir, barra de progresso e botão de tela cheia. Sem ele, desenhe os seus com views sobre ou sob o vídeo; como o vídeo é uma view nativa no seu layout, as sobreposições funcionam naturalmente:

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

As fontes de vídeo são requisições de rede: com capacidades declaradas, o host do vídeo deve ser permitido em `network` de `nsh.json`, assim como para `fetch` e imagens remotas. Uma fonte recusada não mostra nada, e a recusa é registrada no log uma única vez com a chave a adicionar.

<a id="related"></a>

## Relacionados

- [`WebView`](../elements/web-view.md) e [`Video`](../elements/video.md): as referências dos elementos.
- [Sandbox e capacidades](./sandbox-and-capabilities.md): concessões de `webview` e `network`.
- [Componentes nativos](./native-components.md): incorporação de outras views nativas fornecidas pelo seu app host.
