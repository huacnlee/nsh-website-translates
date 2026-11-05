---
title: "Web view et vidéo"
description: "Affichage de pages web avec WebView et lecture de vidéos avec Video : sources, échange de messages entre la page et l'application, navigation, contrôle de la lecture, refs et capacités."
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# Web view et vidéo

La web view et le lecteur vidéo intègrent le moteur web et le lecteur multimédia propres à la plateforme sous forme de vues ordinaires : `web_view` et `video` en Rust (`nsh_core::prelude`), `WebView` et `Video` de `nsh` en TSX. Comme NSH effectue son rendu avec des vues natives, elles s'insèrent dans votre mise en page comme n'importe quel autre élément : elles défilent avec leur parent, acceptent les coins arrondis et le rognage, et d'autres vues peuvent les recouvrir sans problème de superposition.

| Composant | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` de WebKitGTK 6.0 | WebView2, dans une fenêtre enfant |
| `Video` | AVPlayerLayer ; AVPlayerViewController avec `controls` | MediaPlayer sur une TextureView ; MediaController avec `controls` | AVPlayerLayer ; AVPlayerView d'AVKit avec `controls` | Flux média de GTK (GStreamer) dans un `GtkPicture` ; `GtkVideo` avec `controls` | Moteur média de Media Foundation, images dessinées avec Direct2D ; barre de contrôle propre à NSH avec `controls` |

Les frameworks sous-jacents (WebKit, AVFoundation) sont chargés la première fois qu'une app en utilise un : les apps qui n'affichent jamais de page web ni de vidéo ne les paient donc pas au lancement.

Sur [macOS](./macos.md), la web view n'a pas de scroll view propre : avec `scrollable={false}`, la molette de la souris et le
trackpad font défiler les scroll views de l'app qui l'entourent plutôt que la page, laquelle continue de défiler avec le clavier et
ses propres scripts.

Sur [Linux](./linux.md), une web view est une page WebKitGTK dessinée à l'intérieur de sa vue : le contenu NSH placé au-dessus (une boîte de dialogue, une sheet)
la recouvre, et ses parents la rognent. La capacité `webview` s'applique aussi aux navigations des frames (un
`iframe` vers un hôte non autorisé reste vide), et `scrollable: false` empêche la page elle-même de défiler
(les éléments qu'elle contient défilent toujours). Les apps nécessitent l'installation de WebKitGTK 6.0 ; un runtime compilé sans lui affiche un
espace réservé neutre. Les vidéos lisent les formats que les plugins GStreamer installés savent décoder ; `rate` n'est pas pris en charge (elles
sont lues à 1×), et `onEnd` n'est disponible que pour les vidéos qui ne bouclent pas.

Sur [Windows](./windows.md), une web view est un contrôle WebView2 dans une fenêtre enfant qui suit sa vue : elle est rognée par
ses parents et par les coins arrondis, mais le contenu NSH dessiné au-dessus (une boîte de dialogue, une sheet) reste en dessous. Elle nécessite le
WebView2 Runtime (inclus dans Windows 11 ; installé avec Edge sur Windows 10), sinon elle affiche un espace réservé ;
`baseUrl` pour le HTML, `scrollable` et `allowsBackForwardNavigationGestures` ne sont pas pris en charge. Les vidéos sont
du contenu ordinaire (rogné, transformé et recouvert comme n'importe quelle vue) et lisent les formats que les codecs
Media Foundation installés savent décoder ; `rate` fonctionne, il n'y a pas de poster, et la barre de contrôle s'affiche toujours lorsque `controls` est activé.

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

### Sources

Une web view affiche l'un de `src` ou `html` :

| Props | Affiche |
|---|---|
| `src="https://…"` | Une page web. |
| `html="<!doctype html>…"` | Du HTML issu d'une chaîne, affiché à la place de `src`. |
| `html` avec `baseUrl="https://example.com/"` | Du HTML dont les URL relatives sont résolues par rapport à `baseUrl`. |

En Rust, `web_view(url)` affiche une page et `web_view_html(html, base_url)` affiche du HTML (`base_url` un `Option<&str>`) ; l'URL et le HTML peuvent être un signal ou une closure, ce qui recharge la page lorsque ce qu'elle lit change. Modifier `src` ou `html` charge la nouvelle page.

### Props

En Rust, chaque prop est une méthode de builder en snake case (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent` ; `injected_java_script_before_content` pour `injectedJavaScriptBeforeContentLoaded`, `back_forward_gestures` pour `allowsBackForwardNavigationGestures` d'iOS) et chaque événement une méthode `on_…` (`on_navigation_state_change`) dont l'écouteur reçoit un `WebNavigation` (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) ou, pour `on_error` et `on_message`, un `&str`.

| Prop | Type | Par défaut | Description |
|---|---|---|---|
| `src` | `string` | | L'URL de la page à afficher. |
| `html` | `string` | | HTML en ligne, affiché à la place de `src`. |
| `baseUrl` | `string` | | La base par rapport à laquelle les URL relatives de `html` sont résolues. |
| `injectedJavaScript` | `string` | | S'exécute après le chargement de chaque page. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | S'exécute avant les scripts propres à chaque page. |
| `javaScriptEnabled` | `boolean` | `true` | Les pages exécutent des scripts. |
| `scrollable` | `boolean` | `true` | L'utilisateur peut faire défiler la page. |
| `userAgent` | `string` | | La chaîne user agent du navigateur. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS : balayer pour reculer et avancer dans l'historique de la page. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS : balayer à deux doigts sur le trackpad pour reculer et avancer ; Windows : balayer sur un écran tactile ; Linux : balayer sur le pavé tactile. |

Événements :

| Événement | Payload | Quand |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Une page a commencé à se charger. |
| `onLoad` | `WebViewNavigation` | Une page a fini de se charger. |
| `onError` | `{ message }` | Le chargement a échoué. |
| `onNavigationStateChange` | `WebViewNavigation` | L'URL, le titre, l'état de chargement ou l'historique a changé. |
| `onMessage` | `{ data: string }` | La page a posté un message (voir ci-dessous). |

`WebViewNavigation` est `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### Un navigateur avec précédent et suivant

La ref de la web view (un `element_ref()` placé dessus avec `.element_ref(&web)` en Rust, `ref` en TSX) dispose de `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` et `send_input` / `sendInput(input)` ([ci-dessous](#input-as-the-users-own)) :

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

### Messagerie entre la page et l'app

Les pages communiquent avec l'app via `window.nsh.postMessage(string)`, qui arrive sous la forme `on_message` (`onMessage`). L'app communique avec la page via `post_message` de la ref (`postMessage(string)`), qui arrive dans la page sous la forme d'un événement `message` sur `window`. Les messages sont des chaînes ; envoyez du JSON pour des données structurées.

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

`inject_java_script` de la ref (`injectJavaScript(script)`) exécute du code dans la page courante à tout moment ; `injected_java_script` et `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) s'exécutent à chaque chargement de page, avant ou après les scripts propres à la page, ce qui est l'endroit où installer des hooks :

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

### Une saisie comme celle de l'utilisateur

`injectJavaScript` ne peut produire que des événements synthétiques, qu'une page considère comme non fiables (`event.isTrusted` vaut `false`) et que certains widgets ignorent. `send_input` de la ref (`sendInput(input)`) fournit à la page une saisie telle que la produiraient les mains de l'utilisateur, de sorte que ses événements sont fiables :

- `{ type: "click", x, y }` clique en un point du viewport, en pixels CSS (ce que rapporte `getBoundingClientRect()`).
- `{ type: "text", text }` saisit le texte dans l'élément qui a le focus de la page, une touche à la fois : chaque caractère sur la touche correspondante de la disposition US, un saut de ligne comme Entrée, et ce qu'aucune touche US ne produit (`é`, CJK, emoji) sur aucune touche (`code` vaut `"Unidentified"`).
- `{ type: "key", key }` appuie sur `Enter`, `Tab`, `Escape` ou `Backspace`.

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

En Rust, il s'agit de `WebInput::Click { x, y }`, `WebInput::Text(text)` et `WebInput::Key(WebKey::Enter)`.

La saisie fiable porte l'activation utilisateur (elle peut ouvrir des fenêtres, écrire dans le presse-papiers, ouvrir le panneau de fichiers du système ou appuyer sur le bouton de confirmation d'une page) ; c'est donc une capacité à part entière : l'app a besoin de `"webview": { "input": true }` dans `capabilities` de `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview)), même lorsqu'elle n'en déclare aucune, et le cœur ignore l'appel dans le cas contraire.

Comme un clic, `sendInput` donne le focus clavier à la web view, au détriment de `Input` propre à l'app. La page traite la saisie à son propre rythme : les événements d'un clic peuvent encore être en route quand l'appel suivant démarre, laissez donc un clic se stabiliser (une image environ) avant de saisir du texte après lui. macOS délivre la saisie ; les autres plateformes l'ignorent pour l'instant.

Avant de proposer quoi que ce soit qui en dépende, demandez si cela fonctionne ici : `web_input_available()` (`WebView.inputAvailable()`) renvoie `true` uniquement lorsque la plateforme délivre la saisie et que l'app détient `webview.input` ; la valeur est donc `false` sur les plateformes qui ignorent l'appel et dans les apps sans cette autorisation.

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

### Quels sites une web view peut afficher

Si votre `nsh.json` déclare `"capabilities"`, une web view ne peut afficher et parcourir que les hôtes listés sous `webview` :

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

La vérification couvre `src` de la web view et chaque navigation de premier niveau effectuée par la page (liens, redirections, changements de `location`) ; elle est décidée côté natif lorsque la plateforme demande si une navigation peut se poursuivre. Les sous-ressources propres à une page (scripts, images, frames) relèvent du contenu web et ne sont pas vérifiées. `*.example.com` ne correspond qu'aux sous-domaines ; listez aussi `example.com` pour le domaine nu. Une app sans clé `"capabilities"` peut afficher n'importe quelle page. Voir [Sandbox et capacités](./sandbox-and-capabilities.md).

<a id="video"></a>

## Vidéo

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

La lecture se pilote par des props : définissez `paused`, `muted`, `volume` et `rate` à partir de signaux et le lecteur suit. La ref dispose de `seek(seconds)`.

En Rust, `video(url)` crée le lecteur (l'URL étant une valeur, un signal ou une closure) et chaque prop est une méthode de builder en snake case (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (le style `objectFit`), `progress_interval` pour `progressUpdateInterval`) ; `on_load` reçoit un `VideoInfo` (`duration`, `size`), `on_progress` un `VideoProgress` (`current_time`, `duration`) et `on_buffer` un `bool`.

| Prop | Type | Par défaut | Description |
|---|---|---|---|
| `src` | `string` | | L'URL de la vidéo. |
| `paused` | `boolean` | `false` | La lecture est en pause. |
| `muted` | `boolean` | `false` | Sans son. |
| `volume` | `number` | `1` | De 0 à 1. |
| `rate` | `number` | `1` | La vitesse de lecture. |
| `repeat` | `boolean` | `false` | Relit depuis le début à la fin. |
| `objectFit` (style), classes `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | La façon dont l'image s'adapte à la vue, comme `object-fit` en CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | Les commandes de lecture de la plateforme. |
| `progressUpdateInterval` | `number` | `250` | Millisecondes entre les événements `onProgress`. |

| Événement | Payload | Quand |
|---|---|---|
| `onLoadStart` | | Le chargement a commencé. |
| `onLoad` | `{ duration, size }` | La vidéo est prête : sa durée en secondes et sa taille. |
| `onProgress` | `{ currentTime, duration }` | Pendant la lecture, toutes les `progressUpdateInterval` ms. |
| `onBuffer` | `{ isBuffering }` | La lecture a calé en attendant des données, ou a repris. |
| `onEnd` | | La lecture a atteint la fin. |
| `onError` | `{ message }` | Le chargement ou la lecture a échoué. |

Avec `controls`, la plateforme dessine son propre bouton de lecture, sa barre de progression et son bouton plein écran. Sans, dessinez les vôtres avec des vues placées au-dessus ou en dessous de la vidéo ; comme la vidéo est une vue native de votre mise en page, les superpositions fonctionnent naturellement :

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

Les sources vidéo sont des requêtes réseau : avec des capacités déclarées, l'hôte de la vidéo doit être autorisé sous `network` dans `nsh.json`, comme pour `fetch` et les images distantes. Une source refusée n'affiche rien, et le refus est consigné une fois dans les logs avec la clé à ajouter.

<a id="related"></a>

## Voir aussi

- [`WebView`](../elements/web-view.md) et [`Video`](../elements/video.md) : les références des éléments.
- [Sandbox et capacités](./sandbox-and-capabilities.md) : autorisations `webview` et `network`.
- [Composants natifs](./native-components.md) : intégrer d'autres vues natives fournies par votre app hôte.
