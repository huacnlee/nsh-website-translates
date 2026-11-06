---
title: "Web view y vídeo"
description: "Mostrar páginas web con WebView y reproducir vídeo con Video: orígenes, mensajería entre la página y la app, navegación, control de la reproducción, refs y capacidades."
order: 45
group: ui
source_hash: f15d6d5032c41887
---


# Web view y vídeo

La web view y el reproductor de vídeo incrustan el motor web y el reproductor multimedia propios de la plataforma como vistas normales: `web_view` y `video` en Rust (`nsh_core::prelude`), `WebView` y `Video` de `nsh` en TSX. Como NSH renderiza con vistas nativas, se colocan en tu layout como cualquier otro elemento: se desplazan con su vista padre, admiten esquinas redondeadas y recorte, y otras vistas pueden superponerse a ellas sin problemas de capas.

| Componente | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` de WebKitGTK 6.0 | WebView2, en una ventana hija |
| `Video` | AVPlayerLayer; AVPlayerViewController con `controls` | MediaPlayer sobre un TextureView; MediaController con `controls` | AVPlayerLayer; AVPlayerView de AVKit con `controls` | El media stream de GTK (GStreamer) en un `GtkPicture`; `GtkVideo` con `controls` | El media engine de Media Foundation, con los fotogramas dibujados con Direct2D; la barra de controles propia de NSH con `controls` |

Los frameworks que hay detrás (WebKit, AVFoundation) se cargan la primera vez que una app usa uno de ellos, de modo que las apps que nunca muestran una página web o un vídeo no pagan ese coste al arrancar.

En [macOS](./macos.md) la web view no tiene una scroll view propia: con `scrollable={false}`, la rueda del ratón y el trackpad desplazan las scroll views de la app que la rodean en lugar de la página, que sigue desplazándose con el teclado y con sus propios scripts.

En [Linux](./linux.md) una web view es una página de WebKitGTK dibujada dentro de su vista: el contenido de NSH que se coloque encima (un diálogo, una sheet) la cubre, y sus vistas padre la recortan. La capability `webview` también se aplica allí a las navegaciones de los frames (un `iframe` de un host no autorizado se queda vacío), y `scrollable: false` impide que la propia página se desplace (los elementos dentro de ella sí se siguen desplazando). Las apps necesitan tener instalado WebKitGTK 6.0; un runtime compilado sin él muestra un placeholder neutro. Los vídeos reproducen los formatos que decodifican los plugins de GStreamer instalados; `rate` no está soportado (se reproducen a 1×), y `onEnd` solo llega en los vídeos que no se repiten en bucle.

En [Windows](./windows.md) una web view es un control WebView2 en una ventana hija que sigue a su vista: se recorta según sus vistas padre y sus esquinas redondeadas, pero el contenido de NSH dibujado encima (un diálogo, una sheet) queda por debajo de ella. Necesita el WebView2 Runtime (incluido en Windows 11; se instala con Edge en Windows 10); si no está, muestra un placeholder; `baseUrl` para HTML, `scrollable` y `allowsBackForwardNavigationGestures` no están soportados. Los vídeos son contenido normal (se recortan, se transforman y se cubren como cualquier vista) y reproducen los formatos que decodifican los códecs de Media Foundation instalados; `rate` funciona, no hay póster, y la barra de controles se muestra siempre mientras `controls` está activado.

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

### Fuentes

Una web view muestra una de estas fuentes, `src` y `html`:

| Props | Muestra |
|---|---|
| `src="https://…"` | Una página web. |
| `html="<!doctype html>…"` | HTML a partir de una cadena, que se muestra en lugar de `src`. |
| `html` con `baseUrl="https://example.com/"` | HTML cuyas URL relativas se resuelven respecto a `baseUrl`. |

En Rust, `web_view(url)` muestra una página y `web_view_html(html, base_url)` muestra HTML (`base_url` un `Option<&str>`); la URL y el HTML pueden ser una signal o un closure, que vuelve a cargar la página cuando cambia lo que lee. Al cambiar `src` o `html` se carga la nueva página.

### Props

En Rust cada prop es un método builder en snake case (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injected_java_script_before_content` para `injectedJavaScriptBeforeContentLoaded`, `back_forward_gestures` para `allowsBackForwardNavigationGestures` de iOS) y cada evento es un método `on_…` (`on_navigation_state_change`) cuyo listener recibe un `WebNavigation` (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) o, para `on_error` y `on_message`, un `&str`.

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `src` | `string` | | La URL de la página que se muestra. |
| `html` | `string` | | HTML en línea, que se muestra en lugar de `src`. |
| `baseUrl` | `string` | | Respecto a qué se resuelven las URL relativas de `html`. |
| `injectedJavaScript` | `string` | | Se ejecuta después de cargar cada página. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Se ejecuta antes de los scripts de cada página. |
| `javaScriptEnabled` | `boolean` | `true` | Las páginas ejecutan scripts. |
| `scrollable` | `boolean` | `true` | El usuario puede desplazar la página. |
| `userAgent` | `string` | | La cadena de user agent del navegador. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: deslizar para retroceder y avanzar por el historial de la página. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: deslizar con dos dedos en el trackpad para retroceder y avanzar; Windows: deslizar en una pantalla táctil; Linux: deslizar en el touchpad. |

Eventos:

| Evento | Payload | Cuándo |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Una página empezó a cargarse. |
| `onLoad` | `WebViewNavigation` | Una página terminó de cargarse. |
| `onError` | `{ message }` | La carga falló. |
| `onNavigationStateChange` | `WebViewNavigation` | Cambió la URL, el título, el estado de carga o el historial. |
| `onMessage` | `{ data: string }` | La página envió un mensaje (más abajo). |

`WebViewNavigation` es `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### Un navegador con retroceso y avance

El ref de la web view (un `element_ref()` asignado con `.element_ref(&web)` en Rust, `ref` en TSX) tiene `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` y `send_input` / `sendInput(input)` ([más abajo](#input-as-the-users-own)):

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

### Mensajería entre la página y la app

Las páginas se comunican con la app mediante `window.nsh.postMessage(string)`, que llega como `on_message` (`onMessage`). La app se comunica con la página mediante el `post_message` del ref (`postMessage(string)`), que llega a la página como un evento `message` en `window`. Los mensajes son cadenas; envía JSON para datos estructurados.

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

El `inject_java_script` del ref (`injectJavaScript(script)`) ejecuta código en la página actual en cualquier momento; `injected_java_script` y `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) se ejecutan en cada carga de página, antes o después de los scripts de la propia página, que es el lugar para instalar hooks:

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

### Entrada como si fuera del propio usuario

`injectJavaScript` solo puede crear eventos sintéticos, que una página considera no confiables (`event.isTrusted` es `false`) y que algunos widgets ignoran. El `send_input` del ref (`sendInput(input)`) da a la página una entrada como la que producirían las manos del propio usuario, de modo que sus eventos son confiables:

- `{ type: "click", x, y }` hace clic en un punto del viewport, en píxeles CSS (lo que informa `getBoundingClientRect()`).
- `{ type: "text", text }` escribe el texto en el elemento que tiene el foco de la página, una tecla cada vez: cada carácter en la tecla que le corresponde en la distribución US, un salto de línea como Enter, y lo que ninguna tecla US escribe (`é`, CJK, emoji) en ninguna tecla (`code` es `"Unidentified"`).
- `{ type: "key", key }` pulsa `Enter`, `Tab`, `Escape` o `Backspace`.

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

En Rust son `WebInput::Click { x, y }`, `WebInput::Text(text)` y `WebInput::Key(WebKey::Enter)`.

La entrada confiable lleva activación del usuario (puede abrir ventanas, escribir en el portapapeles, abrir el panel de archivos del sistema o pulsar el botón de confirmación de una página), por lo que es una capability propia: la app necesita `"webview": { "input": true }` en el `capabilities` de `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview)), también cuando no declara ninguna, y de lo contrario el core descarta la llamada.

Como un clic, `sendInput` quita el foco del teclado a `Input` propio de la app y se lo da a la web view. La página gestiona la entrada a su propio ritmo: los eventos de un clic pueden seguir en camino cuando empieza la siguiente llamada, así que deja que un clic se asiente (un fotograma o así) antes de escribir tras él. macOS entrega la entrada; las demás plataformas la ignoran por ahora.

Antes de ofrecer nada que dependa de ella, comprueba si funciona aquí: `web_input_available()` (`WebView.inputAvailable()`) resuelve `true` solo donde la plataforma entrega la entrada y la app tiene `webview.input`, de modo que es `false` en las plataformas que ignoran la llamada y en las apps sin la autorización.

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

### Qué sitios puede mostrar una web view

Si tu `nsh.json` declara `"capabilities"`, una web view solo puede mostrar y navegar a los hosts enumerados en `webview`:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

La comprobación abarca el `src` de la web view y toda navegación de nivel superior que haga la página (enlaces, redirecciones, cambios de `location`); se decide de forma nativa cuando la plataforma pregunta si una navegación puede continuar. Los subrecursos de una página (scripts, imágenes, frames) son asunto del contenido web y no se comprueban. `*.example.com` solo coincide con subdominios; incluye también `example.com` para el dominio sin subdominio. Una app sin clave `"capabilities"` puede mostrar cualquier página. Consulta [Sandbox y capabilities](./sandbox-and-capabilities.md).

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

La reproducción se controla mediante props: define `paused`, `muted`, `volume` y `rate` desde signals y el reproductor las sigue. El ref tiene `seek(seconds)`.

En Rust, `video(url)` crea el reproductor (la URL puede ser un valor, una signal o un closure) y cada prop es un método builder en snake case (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (el estilo `objectFit`), `progress_interval` para `progressUpdateInterval`); `on_load` recibe un `VideoInfo` (`duration`, `size`), `on_progress` un `VideoProgress` (`current_time`, `duration`) y `on_buffer` un `bool`.

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `src` | `string` | | La URL del vídeo. |
| `paused` | `boolean` | `false` | La reproducción está en pausa. |
| `muted` | `boolean` | `false` | Sin sonido. |
| `volume` | `number` | `1` | De 0 a 1. |
| `rate` | `number` | `1` | La velocidad de reproducción. |
| `repeat` | `boolean` | `false` | Al llegar al final, vuelve a reproducirse desde el principio. |
| `objectFit` (estilo), clases `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Cómo se ajusta la imagen a la vista, como `object-fit` de CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | Los controles de reproducción de la plataforma. |
| `progressUpdateInterval` | `number` | `250` | Milisegundos entre eventos `onProgress`. |

| Evento | Payload | Cuándo |
|---|---|---|
| `onLoadStart` | | Empezó la carga. |
| `onLoad` | `{ duration, size }` | El vídeo está listo: su duración en segundos y su tamaño. |
| `onProgress` | `{ currentTime, duration }` | Durante la reproducción, cada `progressUpdateInterval` ms. |
| `onBuffer` | `{ isBuffering }` | La reproducción se detuvo esperando datos, o se reanudó. |
| `onEnd` | | La reproducción llegó al final. |
| `onError` | `{ message }` | Falló la carga o la reproducción. |

Con `controls`, la plataforma dibuja su propio botón de reproducción, su barra de progreso y su botón de pantalla completa. Sin él, dibuja los tuyos con vistas sobre el vídeo o debajo de él; como el vídeo es una vista nativa en tu layout, las superposiciones funcionan con naturalidad:

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

Las fuentes de vídeo son peticiones de red: con capabilities declaradas, el host del vídeo debe estar permitido en `network` dentro de `nsh.json`, igual que para `fetch` y las imágenes remotas. Una fuente rechazada no muestra nada, y el rechazo se registra una vez con la clave que hay que añadir.

<a id="related"></a>

## Relacionado

- [`WebView`](../elements/web-view.md) y [`Video`](../elements/video.md): las referencias de los elementos.
- [Sandbox y capabilities](./sandbox-and-capabilities.md): las autorizaciones de `webview` y `network`.
- [Componentes nativos](./native-components.md): cómo incrustar otras vistas nativas que proporciona tu app host.
