---
title: "WebView"
description: "L'élément WebView : des pages web et du HTML en ligne dans une application, avec une messagerie dans les deux sens."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

Une vue web affiche une page web, ou du HTML que vous lui transmettez, dans l'application : WKWebView sur iOS et Mac Catalyst,
`android.webkit.WebView` sur Android. Comme NSH effectue son rendu avec des vues natives, une vue web s'insère dans la mise en page comme n'importe quelle autre
vue, dans l'ordre par rapport aux vues voisines. En Rust, on en crée une avec `web_view(url)` ou `web_view_html(html, base_url)`, en TSX
avec `<WebView>` depuis `nsh`.

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

En TSX, une vue web accepte soit `src`, soit `html` (voir l'[API WebView](../modules/nsh-webview.md)). Le
[guide des vues web et vidéo](../docs/web-view-and-video.md) présente les modèles de messagerie et les capacités.

## Props

Une vue web accepte les props d'une [vue](./view.md) (elle n'a pas d'enfants), plus :

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | L'URL de la page à afficher. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | HTML en ligne, affiché à la place de `src`. |
| `baseUrl` | `base_url` de `web_view_html` / `.html` | `string` | | Base de résolution des liens relatifs de `html`. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | S'exécute après le chargement de chaque page. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | S'exécute avant les scripts propres à chaque page. |
| `userAgent` | `.user_agent(..)` | `string` | | La chaîne user agent du navigateur. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | Les pages exécutent des scripts. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | L'utilisateur peut faire défiler la page. |

| Clé `ios` | Rust | Type | Description |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | Balayer depuis les bords pour revenir en arrière et avancer. |

| Clé `desktop` | Rust | Type | Description |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS : balayer avec deux doigts sur le trackpad pour revenir en arrière et avancer ; Windows : balayer sur un écran tactile ; Linux : balayer sur le pavé tactile. |

<a id="events"></a>

## Événements

| Événement | Rust | Payload | Quand |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | Une page a commencé à se charger. |
| `onLoad` | `.on_load` | `WebViewNavigation` | Une page a fini de se charger. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, le message) | Échec du chargement ; `code` vaut `"ERR_ACCESS_DENIED"` pour une page ou `html` que les capacités de l'application n'accordent pas. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | L'URL, le titre, l'état de chargement ou l'historique a changé. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | La page a appelé `window.nsh.postMessage(data)`. |
| `onDownload` | | `WebViewDownload` | Un téléchargement a démarré, s'est terminé ou a échoué (macOS). |

`WebViewNavigation` est `{ url, title, loading, canGoBack, canGoForward }` ; en Rust, `WebNavigation` avec `url`, `title`,
`loading`, `can_go_back` et `can_go_forward`.

`WebViewDownload` est `{ state, id, url, filename, path, bytes?, message? }` : `state` vaut `"started"`, `"finished"`
(avec le `bytes` du fichier) ou `"failed"` (avec son `message`). Avec un écouteur `onDownload`, ce que la page télécharge
(une pièce jointe, un type que la vue web n'affiche pas, un lien `download`) est enregistré dans le répertoire de données de l'application sous
`downloads/<id>/<filename>`, là où pointe `path`, et l'application le lit avec `fs/promises`.

Sur macOS, l'ajout de l'écouteur permet à toute page chargée autorisée par la capacité `webview` d'enregistrer automatiquement des téléchargements.
L'application est responsable de son budget de stockage et de la suppression des fichiers terminés de `downloads/`
lorsqu'elle a fini de les utiliser. La suppression de la vue web annule les téléchargements en cours et supprime leurs répertoires
partiels. Les téléchargements sont signalés via `onDownload` ; la conversion d'une navigation en téléchargement réserve `onError`
aux véritables échecs de navigation. Les caractères de contrôle et les contrôles de mise en forme bidirectionnelle sont retirés des noms de fichiers,
et les noms longs sont raccourcis à 200 octets tout en conservant une extension qui tient dans cette limite.

<a id="ref-methods"></a>

## Méthodes de ref

| Méthode | Rust | Description |
|---|---|---|
| `reload()` | `reload()` | Recharge la page. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | Se déplace dans l'historique de la page. |
| `stopLoading()` | `stop_loading()` | Arrête le chargement. |
| `injectJavaScript(script)` | `inject_java_script(script)` | Exécute du JavaScript dans la page. |
| `postMessage(data)` | `post_message(data)` | Envoie une chaîne à la page, qui reçoit un événement `message` sur `window`. |

<a id="messaging"></a>

## Messagerie

L'application et la page échangent des chaînes. La page envoie avec `window.nsh.postMessage(data)` ; l'application envoie
avec `postMessage(data)` de la ref (`post_message(..)` en Rust). Envoyez du JSON pour des données structurées.

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

## Capacités

Lorsque l'application déclare des [capacités](../docs/sandbox-and-capabilities.md) dans `nsh.json`, une vue web affiche les hôtes listés sous `webview` et y
navigue. Un `src` sur un autre hôte, ou `html` dans une application sans `webview`, affiche une
vue vide ; une navigation de premier niveau vers un autre hôte (un lien sur lequel l'utilisateur appuie) est annulée de façon native. Chacun signale
`onError` avec `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## Notes par plateforme

- iOS charge WebKit la première fois qu'une vue web est créée ; cela ne coûte donc quelque chose à une application que lorsqu'elle en affiche une.
- Sur macOS, `onDownload` enregistre les téléchargements avec `WKDownload` de WebKit.
- Sur Android, les appels `postMessage` de la page arrivent sur un thread d'arrière-plan et sont transmis à l'application dans l'ordre.
- Pour arrondir les coins d'une vue web, donnez-lui un rayon de coin et `overflow: "hidden"` (`.overflow_hidden()`).
