---
title: "Web"
description: "Créez des applications web en Rust ou en TSX avec des composants Native Shell rendus en HTML et CSS, développez dans le navigateur et publiez sur n'importe quel hébergeur statique ou CDN."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# Web

Créez des applications web avec Native Shell en utilisant les mêmes composants, les mêmes styles et la même logique applicative que sur les plateformes natives. NSH rend l'interface sous forme d'éléments HTML et de CSS : le texte, les images, les champs de saisie, le défilement, les styles visuels et les interactions reposent sur le DOM et les API web du navigateur.

`nsh package --target web` publie l'application sous forme de site statique pour n'importe quel serveur web ou CDN ([Publier une application](#publish-an-app)), et `nsh run --target web` l'exécute dans le navigateur pendant que vous la modifiez ([Développer dans le navigateur](#develop-in-the-browser)). Toutes les démos interactives de ce site utilisent ce backend web.

Les applications TSX publiées utilisent le moteur JavaScript du navigateur. Le packaging lie à chaque application son propre runtime, qui ne contient que les composants `nsh/base` et les modules standard que l'application importe : une application construite avec les composants de base télécharge environ 1,1 Mo. Les données de coloration syntaxique se chargent lors de la première coloration de code.

<a id="what-runs-where"></a>

## Ce qui s'exécute où

La page est construite à partir d'éléments HTML stylés en CSS. NSH transforme les mises à jour des composants en lots de modifications du DOM, tandis que le navigateur affiche l'interface et gère le défilement, la sélection de texte et la saisie. WebAssembly héberge le moteur Rust partagé pour l'état des composants, la mise en page et les mises à jour : avec la crate d'une application Rust compilée dedans, ou aux côtés du moteur JavaScript du navigateur, qui exécute le code d'une application TSX sous forme de modules ES : applications publiées, page du serveur de développement, démos de ce site et playground, sans distinction.

Sur chaque plateforme native, le moteur a son propre thread et transmet un `MountBatch` par commit au thread principal. Une page de navigateur n'a qu'un seul thread : le build web pilote donc le même moteur pas à pas depuis la boucle d'événements de la page (`nsh_engine::LocalEngine`) :

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **La mise en page est celle du cœur.** Chaque vue est un élément positionné de façon absolue au cadre calculé par Taffy, de sorte que flexbox, grid, `aspectRatio` et les pourcentages se comportent exactement comme sur les appareils. La mise en page propre au navigateur n'intervient pas.
- **Les styles sont convertis en CSS dans Rust.** Arrière-plan, bordures, rayons, ombres (`boxShadow`, `textShadow`), dégradés, filtres, `backdropFilter`, transformations, `transformOrigin`, `outline`, `mixBlendMode`, transitions et animations par keyframes intégrées deviennent des propriétés CSS. Les classes Tailwind, les états `active:`, `hover:` et `focus:` ainsi que `dark:` sont tous résolus nativement, comme sur les appareils.
- **Le texte est mis en page dans Rust** avec les mesures de police du navigateur (`CanvasRenderingContext2D.measureText`) et dessiné segment par segment aux positions choisies par la mise en page : ce qui a été mesuré est ce qui est dessiné. Les lignes se coupent après les espaces, autour des caractères CJK et aux `\n` ; `numberOfLines` tronque avec des points de suspension.
- **Les animations natives s'exécutent dans Rust** sur `requestAnimationFrame` : timing `Animated`, ressort (spring) et decay, `interpolate`, valeurs animées liées à `opacity`, `translate`, `rotate`, `scale`, les étapes de `transform` et `backgroundColor`, glissements liés avec `pan`, valeurs liées au défilement et arguments de canvas. JS n'intervient pas à chaque frame, comme sur les appareils. `LayoutAnimation`, les transitions de style, les keyframes `animate-*` et les transitions d'écran se déplacent comme sur les backends de bureau, et `prefers-reduced-motion` les désactive (les écrans s'estompent en fondu).
- **Entrées :** appuis avec retour `activeStyle` / `active:` et appuis longs, système de responder (`onTouch*`, `PanResponder`), glissements natifs et pincement et rotation à deux doigts, vues défilantes (le défilement du navigateur), pull to refresh, vues défilantes avec zoom (pincement, ctrl+molette et pincements du pavé tactile, `zoomTo`), `<Input>` avec valeurs contrôlées, focus et soumission, `Canvas`, `NavStack` et `NavPage` avec `header` et `Dialog` de la page.
- **L'interface système est dessinée dans la page :** `AlertDialog` ressemble aux boîtes de dialogue des backends de bureau sur les navigateurs de bureau, et à celles d'iOS sur les téléphones (avec l'idiome `desktop`, voir ci-dessous). Les polices personnalisées sont mesurées de nouveau une fois chargées par le navigateur, et une application attend les polices qu'elle importe avant d'afficher sa première frame.
- **Les dialogues** sont une couche au-dessus de toute l'application qui affiche la popup et l'arrière-plan de l'application, comme sur les backends de bureau. Échap, le bouton retour du navigateur et un appui sur l'arrière-plan les ferment (`closeOnEscape`, `closeOnBackdropPress`), et `animation`, `onOpen`, `onClose`, `onCancel` et `onOpenChange` fonctionnent comme sur les appareils. Une page qui [intègre l'application](#embed-it-in-a-page) dans une partie de sa mise en page peut afficher les dialogues et les alertes au-dessus de toute la fenêtre du navigateur à la place (`dialogs: "viewport"`), comme iOS et Android les affichent sur tout l'écran.

<a id="keyboard-mouse-and-touch"></a>

## Clavier, souris et tactile

Les applications publiées se comportent comme des applications de bureau dans les navigateurs de bureau et comme des applications mobiles dans les navigateurs de téléphone :

- **Molettes et pavés tactiles** font défiler la vue défilante la plus interne, selon leur axe, qui peut encore bouger (une molette verticale fait défiler une liste horizontale quand rien ne peut défiler verticalement), et y restent jusqu'à la fin du défilement ; les crans de molette glissent, et les vues paginées ou à accrochage avancent d'une page par défilement. Ctrl + molette et les pincements du pavé tactile pincent les vues avec des valeurs de pincement natives au lieu de zoomer la page. Le glissement à la souris ne fait pas défiler, comme sur les plateformes de bureau : les glissements de souris vont aux pans, au système de responder et à la sélection de texte. Les vues défilantes signalent `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End` et `onScrollEnd` comme sur les plateformes de bureau.
- **Clavier** : Tab et Maj+Tab déplacent le focus entre les éléments pressables et les champs de saisie (les styles `focus:` de l'application montrent le focus clavier) ; Entrée appuie sur l'élément pressable ayant le focus, Espace y appuie au relâchement ; les flèches, Page précédente / Page suivante, Espace, Début et Fin font défiler la vue défilante autour du focus ou sous la souris ; Échap quitte un champ, ferme le dialogue, puis revient en arrière. Les raccourcis `keymap` fonctionnent dans le navigateur, résolus sur place (`mod` est Commande dans Safari et Chrome sur Mac, Contrôle ailleurs).
- **Retour en arrière** : Échap, Alt+Gauche (Cmd+[ sur Mac) et le bouton retour de la souris ferment le dialogue le plus récent ou dépilent la pile la plus interne, comme le fait le bouton retour d'Android ; `popOnBack` et `onBackPress` fonctionnent comme sur Android. Lorsque l'application occupe toute la page, chaque page empilée et chaque dialogue ouvert est une entrée de l'historique du navigateur : le bouton retour du navigateur revient donc en arrière dans l'application.
- **Tactile** : seules les vues défilantes se déplacent ; la page elle-même ne défile, ne zoome et ne se rafraîchit jamais par traction sous l'application, et les appuis n'ont aucun délai. Dans une iframe, les balayages que l'application ne prend pas font défiler la page qui l'intègre. Les glissements sur les vues avec pans natifs, pincements et système de responder appartiennent à l'application.
- **Accessibilité** : `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion` et `accessibilityElementsHidden` deviennent de l'ARIA ; `announce` parle via une région live et `setAccessibilityFocus` déplace le focus. Les vues situées sous un dialogue ou une alerte sont inertes.
- **Sélection et menus** : dans les navigateurs de bureau, le texte est sélectionnable par défaut, comme sur une page web, sauf à l'intérieur des éléments interactifs (vues avec gestionnaires d'appui ou tactiles : boutons, lignes pressables, onglets) et le texte avec `userSelect: "none"` ou `select-none` ; glisser la souris dessus le sélectionne, Ctrl/Cmd+C le copie ligne par ligne et Ctrl/Cmd+A sélectionne tout le texte dans lequel se trouve la sélection. Dans les navigateurs de téléphone et de tablette, seul le texte avec `userSelect: "text"` est sélectionnable, comme dans les applications natives. Le menu contextuel du navigateur n'apparaît que dans le texte sélectionnable et les champs de saisie.


<a id="apps-with-rust-components"></a>

## Applications avec des composants Rust

Une application écrite en Rust ([Construire avec Rust](./rust.md)) se publie et s'exécute dans le navigateur depuis son répertoire :

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

Lorsque `nsh.json` nomme le composant racine de l'application (`"root"`), la page se compose du Rust de l'application et du script de page de NSH, et de rien d'autre : `nsh.wasm` contient le moteur, les composants et la crate de l'application, le site n'a pas de `app.js`, et la page monte la racine dès que le runtime et les polices sont chargés. La galerie Rust complète pèse 3,3 Mo (1,06 Mo en gzip, 0,75 Mo avec brotli), moins que le runtime des applications TSX. Sous son entrée TSX (`nsh package App.tsx --target web`), la même application s'exécute comme les applications TSX, sur le moteur JavaScript du navigateur, et importe les composants et modules de la crate.

Dans les deux cas, les assets de la crate (`assets!()`) sont publiés avec ceux de l'application, et ses polices se chargent avant la première frame. Pendant `nsh run --target web`, une modification du code Rust de la crate reconstruit le runtime et la page ouverte le charge d'elle-même ; les modifications TSX restent des mises à jour à chaud. Le runtime de développement se construit de façon incrémentale : une modification de la crate est donc prête en environ une seconde ; `nsh package` construit le runtime publié, optimisé pour la taille.

Le code Rust qui s'exécute sur toutes les plateformes, web compris, utilise les services du moteur : `fetch(url).await` effectue des requêtes HTTP via la même pile réseau que le `fetch` de JS (celle du navigateur ici, avec ses règles CORS) ; `timer`, `set_timeout` et `set_interval` attendent ; et `nsh_core::time::Instant` et `nsh_core::time::unix_ms()` lisent l'horloge. `background` et `blocking` exécutent du travail sur les threads des cibles natives.

Le build nécessite la cible Rust et un clang qui compile vers WebAssembly, comme le build du runtime lui-même : `rustup target add wasm32-unknown-unknown`, ainsi que `clang` et `llvm-ar` (sur macOS, une chaîne d'outils LLVM telle que `llvm` de Homebrew, via `CC_wasm32_unknown_unknown` et `AR_wasm32_unknown_unknown`).

<a id="browser-apis-from-rust"></a>

### API du navigateur depuis Rust

Une crate peut appeler les API propres au navigateur via [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) et ses crates `web-sys` et `js-sys`, derrière `#[cfg(target_arch = "wasm32")]` : une WebSocket, `IndexedDB`, le presse-papiers, n'importe quelle API Web, et du JS propre à la crate (`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`). Lorsque le runtime web de l'application appelle du JS de cette manière (y compris les conversions `JsValue`), `nsh` exécute la CLI `wasm-bindgen` dessus et livre son code de liaison (glue) et le JS de la crate à côté du runtime, en développement comme dans les sites publiés. La version de la CLI est celle de la crate `wasm-bindgen` que le runtime lie, que `nsh` nomme : `cargo install wasm-bindgen-cli --version <version> --locked` l'installe (`NSH_WASM_BINDGEN` désigne une CLI située ailleurs que sur `PATH`). Un runtime qui lie wasm-bindgen sans appeler de JS par son intermédiaire (via les features par défaut d'une dépendance) se construit comme tous les autres runtimes.

La crate nomme les API qu'elle utilise sous forme de features `web-sys`, et épingler `wasm-bindgen` garde sa version, et donc celle de la CLI, identique d'un build à l'autre :

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

Les callbacks du navigateur (un message qui arrive, un minuteur de la page) réveillent les tâches de l'application, qui s'exécutent immédiatement :

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

Les appels d'une crate aux API du navigateur s'exécutent avec les permissions propres de la page, comme le code natif d'une crate s'exécute avec celles de l'application sur les autres plateformes : les capacités de `nsh.json` régissent ce qui passe par le moteur (`fetch`, le JS de l'application), et les règles du navigateur (CORS, Content-Security-Policy de la page) régissent chaque requête effectuée par la page.

<a id="publish-an-app"></a>

## Publier une application

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` écrit `.nsh/out/<Name>/` (`--out` pour un autre répertoire), organisé comme un build frontend : une seule page et des fichiers nommés d'après leur contenu.

| Fichier | Ce que c'est |
|---|---|
| `index.html` | La page de l'application : son nom comme titre, les icônes, les couleurs de son `appearance`, un indicateur de chargement, et un message lorsque l'application ne peut pas se charger ou démarrer |
| `manifest.webmanifest` | Le nom, l'identifiant, les icônes et les couleurs avec lesquels les navigateurs installent l'application |
| `nsh.<digest>.js` | Le runtime DOM, minifié (79 Ko, 22,5 Ko avec brotli) |
| `nsh.<digest>.wasm` | Le moteur Rust, la mise en page et les composants, plus la propre crate d'une application Rust. TSX s'exécute dans le JavaScript du navigateur ; le packaging le lie avec uniquement les composants et modules standard qu'importe le premier écran de l'application. |
| `nsh-<name>.<digest>.wasm` | Composants, modules standard et shaders que l'application utilise au-delà de son premier écran : téléchargés en arrière-plan après son affichage |
| `<file>.br`, `<file>.gz` | Chaque fichier compressé à l'avance, pour les hébergeurs qui envoient des fichiers précompressés |
| `nsh-syntaxes.<digest>.bin` | Les syntaxes avec lesquelles le code est coloré (jeu de bat : 0,92 Mo, 0,8 Mo avec brotli), téléchargées la première fois qu'un bloc de code, un `Editor` ou un `DiffView` affiche du code dans un langage |
| `nsh-bindgen.<digest>.js` | Le code de liaison (glue) wasm-bindgen d'une application dont les crates appellent des [API du navigateur depuis Rust](#browser-apis-from-rust), minifié |
| `snippets.<digest>/<crate>-<hash>/…` | Le JS de ces crates que le glue importe (`inline_js`, `module = "/js/…"`), sous les chemins que lui donne wasm-bindgen |
| `app.<digest>.js` | L'entrée TSX compilée sous forme de module ES, chargée par le navigateur. |
| `host.<digest>.js` | L'hôte de la page, `nsh.json` `web.host` ([les fonctions de l'hôte](#the-hosts-functions)) |
| `<name>.<digest>.js` | Modules ES chargés à la demande par `import()`. |
| `assets/<path>.<digest>.<ext>` | Chaque asset que l'application importe, chargé depuis son URL lorsqu'il est utilisé (les polices avant l'exécution du code qui les enregistre, car le texte est mesuré avec elles : avant le démarrage de l'application, ou avec le chunk qui les importe) |
| `icons/<size>.<digest>.png` | L'icône de `nsh.json` en 32 (favicon), 180 (`apple-touch-icon`), 192 et 512 pixels |

`<digest>` est le début du SHA-256 du contenu du fichier : le nom d'un fichier change exactement quand son contenu change, de sorte qu'une nouvelle version ne modifie que `index.html` et les fichiers qui ont réellement changé. Tout utilise des URL relatives, si bien que le site fonctionne depuis n'importe quel répertoire de n'importe quel hébergeur (`https://example.com/apps/counter/`).
<a id="runtime-size"></a>

### Taille du runtime

Le packaging lie à chaque application son propre `nsh.<digest>.wasm`, qui contient le moteur ainsi que les composants `nsh/base`, les modules standard et les shaders importés par le premier écran de l'application. Ce que les autres écrans de l'application importent est téléchargé en arrière-plan une fois le premier écran affiché. Une application dont les crates appellent des [API du navigateur depuis Rust](#browser-apis-from-rust) obtient le runtime complet, crates comprises, dans son `nsh.<digest>.wasm`. Mesuré avec `nsh package --target web` (Mo = 10^6 octets) :

| Application | Utilise | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | Les composants de base | 3,96 Mo | 1,32 Mo | 0,97 Mo |
| `examples/gallery` | Tous les composants, `zlib` et shaders | 4,13 Mo | 1,36 Mo | 1,01 Mo |

<a id="deploy-it"></a>

### Déployer

Déposez le répertoire sur n'importe quel hébergeur statique : un object store derrière un CDN, Cloudflare Pages, Netlify, GitHub Pages, nginx. Deux règles garantissent un chargement rapide et des mises à jour fiables :

| Fichiers | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (revalidés à chaque chargement, de sorte qu'une nouvelle version apparaît immédiatement) |
| tout le reste | `public, max-age=31536000, immutable` |

Servez `.wasm` avec le type `application/wasm` (les navigateurs le compilent alors pendant son téléchargement) et envoyez les copies précompressées aux navigateurs qui les acceptent : `brotli_static on; gzip_static on;` de nginx, `file_server {
precompressed br gzip }` de Caddy, ou un CDN qui compresse en Brotli. Avec Brotli, le runtime est environ un quart plus léger qu'avec gzip. `nsh package --target web --run` sert le site de cette manière sur `http://127.0.0.1:4173/`.

Une application publiée pour le web fonctionne comme une application native packagée : en release, avec les capacités que déclare son `nsh.json` ([Sandbox et capacités](./sandbox-and-capabilities.md)), une application TSX s'exécutant sur le moteur JavaScript du navigateur. Lorsqu'elles restreignent `network`, la page porte aussi une Content-Security-Policy `connect-src` avec les hôtes déclarés (et l'origine de la page elle-même), de sorte que le navigateur refuse lui-même les requêtes et les redirections vers tout autre hôte. Une erreur qui empêche le démarrage s'affiche sur la page ; les erreurs ultérieures vont dans la console du navigateur.

<a id="embed-it-with-an-iframe"></a>

### Intégrer avec une iframe

Il n'existe pas d'API d'intégration sur le web : intégrez l'application publiée avec une `<iframe>`. Sa taille est celle de la fenêtre de l'application :

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## Développer dans le navigateur

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

démarre le serveur de développement et affiche l'adresse de sa page, `http://127.0.0.1:8790/` : ouvrez-la dans n'importe quel navigateur. La page est un hôte de développement comme les autres : elle exécute chaque build de l'application, affiche les erreurs de build et d'exécution par-dessus l'application, et envoie les logs de l'application vers le terminal. Une modification dans un crate d'une application Rust reconstruit son runtime et la page ouverte le charge d'elle-même ; les modifications TSX sont appliquées sur place (mises à jour à chaud). Les téléphones du même réseau ouvrent l'adresse que `nsh run` affiche en dessous (`on this network: http://192.168.…:8790/`). `nsh dev` sert la même page dès que le runtime web est présent (dans la distribution, toujours).

<a id="build-the-websites-player"></a>

## Construire le player du site web

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

Le répertoire de sortie contient :

| Fichier | Description |
|---|---|
| `gallery/nsh.<digest>.wasm` | Le runtime de la galerie, lié pour elle par `nsh package` (il utilise tous les composants et `zlib` : environ 11,8 Mo, 3,6 Mo en gzip) |
| `gallery/nsh-syntaxes.<digest>.bin` | Les syntaxes avec lesquelles le runtime colore le code, récupérées la première fois qu'une démo affiche du code dans un langage |
| `nsh-playground.wasm` | Le même, plus le compilateur TSX de NSH, pour le [playground](#the-playground) (environ 8 Mo, 2,4 Mo en gzip) |
| `gallery/nsh.<digest>.js` | Le runtime DOM (minifié) : charge le wasm, applique les lots et transforme les entrées en événements |
| `index.html` | Une page de player : exécute `demos/<name>.js` pour `#<name>` |
| `nsh.wasm`, `nsh.js`, `browser/` | Le runtime que charge le player : le moteur, le runtime DOM et les modules de l'hôte navigateur |
| `demos/<name>.js` | Chaque démo compilée par `nsh build --release` : un module ES |
| `gallery/` | L'application galerie publiée avec `nsh package --target web`, affichée sur la page [Gallery](/gallery) |

Servez le répertoire avec n'importe quel serveur statique (il a besoin du type MIME `application/wasm` pour la compilation en streaming) et ouvrez `index.html#counter`.

<a id="the-playground"></a>

## Le playground

Le [Playground](/playground) modifie et exécute une application dans le navigateur : la page compile le TSX avec le compilateur JSX propre à NSH (intégré à `nsh-playground.wasm`, sans rolldown) et l'exécute sur le moteur JavaScript du navigateur à chaque pause dans la frappe. Chaque démo de ce site comporte un lien **Modifier dans le Playground**, et **Partager** place le code dans le lien lui-même, de sorte que rien n'est stocké sur un serveur.

Une application du playground est un seul module : elle importe les modules de NSH (`nsh` et `nsh/*`) mais aucun autre fichier ni paquet. La sortie et les erreurs de `console.log` apparaissent sous le téléphone.

Le compilateur est aussi une fonction Rust, `nsh_bundler::compile_module(name, source, ui_sets)`, disponible sans la feature `bundle` du crate.

<a id="embed-it-in-a-page"></a>

## Intégrer dans une page

Une application Rust est intégrée sous la forme de son site publié, dans une [iframe](#embed-it-with-an-iframe). Pour le TSX, `nsh.js` est un module ES. `createPlayer` charge le runtime dans un conteneur ; `runModule(url)` démarre un bundle écrit par `nsh build` (`bundle.js`, un module ES) sur le moteur JavaScript du navigateur, dans un realm propre à l'application, en remplaçant ce qui s'exécutait. Elle renvoie une promesse qui se résout une fois le module chargé et qui est rejetée avec l'erreur qui l'a arrêté, que le player signale aussi (`onError`) :

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets` (une table associant des chemins `asset:/` à des URL) remplace `assetBase`, `readAsset(uri)` renvoie les octets d'une ressource dont le moteur a besoin immédiatement (une police) ou `null`, `data` associe à leurs URL les fichiers que le runtime récupère lorsqu'il en a besoin pour la première fois (`syntaxes` : `nsh-syntaxes.<digest>.bin` ; par défaut `nsh-<name>.bin` à côté de `nsh.js`), et `glue` est l'URL du glue wasm-bindgen d'un runtime dont les crates appellent des [API du navigateur depuis Rust](#browser-apis-from-rust) (`nsh-bindgen.<digest>.js`), que le player charge avec le runtime ; `player.runModule(url, { capabilities, appId })` exécute l'application avec les capacités qu'elle déclare (son `capabilities.json`) et conserve son stockage sous son identifiant `nsh.json` (sans identifiant, sous le chemin de la page). La page qu'écrit `nsh package --target web` les utilise toutes.

`runModule(url, { chunks })` accepte aussi l'emplacement des chunks d'un [bundle fractionné](#split-bundles).

`player.runSource(code, { name, sourceMap, capabilities, appId })` exécute un module ES fourni sous forme de texte source, avec les mêmes options. Avec `nsh-playground.wasm`, `player.compileAndRun(tsx, name, options)` compile d'abord le TSX, l'exécute avec les options de `runSource` et se résout avec l'erreur de compilation, ou `null` ; `player.compile(tsx)` renvoie `{ code }` ou `{ error }`.

La taille du conteneur est la fenêtre de l'application (`windowSize()`) ; redimensionner le conteneur redimensionne l'application. `player.setDark(true)` change l'apparence à l'exécution, que les applications observent via les classes `colorScheme()` et `dark:`.

Les boîtes de dialogue et les alertes recouvrent le conteneur. Avec `dialogs: "viewport"`, elles recouvrent toute la fenêtre du navigateur, comme les boîtes de dialogue modales d'une page, tandis que l'application conserve le conteneur comme fenêtre : un `Dialog` se met en page selon la taille et la safe area de la fenêtre et glisse depuis son bord inférieur, son fond recouvre toute la page, et la molette de la souris au-dessus de lui laisse la page en place. La boîte de dialogue s'affiche dans la top layer du navigateur (Chrome 114, Safari 17, Firefox 125 et versions ultérieures), elle se trouve donc au-dessus du reste de la page où que soit le conteneur ; dans les navigateurs plus anciens, elle recouvre le conteneur.


`Sheet` suit le même réglage de présentation que `Dialog` et `AlertDialog`. Dans une iframe de même origine, la présentation dans le viewport recouvre automatiquement la page externe, tandis que l'application conserve sa taille de mise en page d'origine.
L'iframe retrouve sa position et sa taille d'origine à la fermeture de la dernière popup ; son moteur et son état restent actifs.
Les démos de la documentation activent cette présentation.

Pour une iframe cross-origin ou sandboxée, la page d'intégration enregistre l'hôte avant de charger le player :

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

L'hôte accepte les requêtes provenant de la fenêtre de cette iframe, maintient la page environnante inerte et verrouille son défilement tant qu'une popup est visible, puis rétablit les deux à la fermeture. Chaque frontière d'intégration cross-origin exige la coopération de son hôte ; sans elle, la présentation reste limitée à ce document et le player signale un avertissement.

<a id="the-hosts-functions"></a>

## Les fonctions de l'hôte

Sur le web, la page est l'hôte de l'application : elle répond aux `host.call(name, args)` de [`host`](../modules/nsh.md#host) et envoie les événements que `host.on` écoute. `host` de `createPlayer` est un objet dont `call(name, args)` renvoie le résultat, ou une promesse de celui-ci ; une exception ou un rejet rejette l'appel de l'application avec le message de l'erreur. `player.hostEvent(event, payload)` envoie un événement avec une charge utile JSON (une charge utile qui n'est pas du JSON lève une exception). Avec un `host`, `host.available()` vaut `true`.

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

Une application publiée obtient son hôte depuis `nsh.json` : `web.host` désigne un module JS du répertoire de l'application, relatif à `nsh.json`, qui exporte `createHost(player)`. `nsh package --target web` le copie dans le site sous le nom `host.<digest>.js`, et la page exécute `createHost` avec le player avant le démarrage de l'application ; ce qu'elle renvoie (ou résout) doit avoir une fonction `call`, sinon la page indique que l'application n'a pas pu être chargée. Le player `createHost` envoie désormais les événements qu'il reçoit :

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

L'hôte recherche chaque nom tel quel dans une table de ses fonctions, comme ci-dessus, et garde ses URL et ses chemins pour lui : `capabilities.host` accorde les noms selon leur début (`user.*`), si bien qu'un nom que l'hôte transformerait en chemin pourrait atteindre ce que l'autorisation exclut. Le runtime transmet les noms de 1 à 128 caractères parmi `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` et `-`, sans `..`, et rejette l'appel de tout autre nom. Une autorisation par préfixe se termine par un séparateur (`bridge.*`) : `bridge*` correspond aussi à `bridgeAdmin`.

Les événements envoyés avant l'exécution de l'application, par exemple depuis `createHost` lui-même, sont délivrés dans l'ordre dès son démarrage, de sorte que les écouteurs `host.on` de niveau supérieur de l'application les reçoivent. Un événement envoyé avant l'enregistrement d'un écouteur ne lui est pas rejoué : une application lit l'état avec lequel elle démarre par un appel (`host.call("user.info")`) et suit ses changements par des événements.

Le module hôte s'exécute dans la page de l'application et partage sa Content-Security-Policy : lorsque les capacités de l'application restreignent `network`, le `connect-src` de la page contient l'origine de la page, les hôtes que liste `capabilities.network` et les hôtes que liste `web.connect`. `web.connect` désigne les hôtes que les requêtes propres au module hôte (`fetch`, `XMLHttpRequest`, `WebSocket`) atteignent, sous forme de motifs comme ceux de `capabilities.network.hosts` (`api.example.com`, `*.example.com`, `"*"`), comme `api.example.com` ci-dessus ; les requêtes propres à l'application restent vérifiées par rapport à son `capabilities`.

Le module est copié tel quel, il importe donc d'autres codes par URL absolue. L'application a toujours besoin de sa [capacité](./sandbox-and-capabilities.md) `host` pour chaque fonction qu'elle appelle. `nsh run --target web` l'exécute sur la page de développement, et `nsh test` exécute le même module pour chaque application que ses tests ouvrent, en headless ou dans un navigateur (`--target web`), de sorte que l'application et son hôte sont testés ensemble ([Tests](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## Le navigateur comme plateforme

`platform.os` vaut `"web"`. Le type d'appareil sur lequel se trouve le navigateur détermine le comportement de l'application, comme `platform.idiom` :

- `"desktop"` : une souris (un pointeur précis qui survole) et un conteneur d'au moins 600 points de large. `platform.desktop` vaut `true`, `platform.select` choisit `desktop` et les props `desktop={{…}}` s'appliquent.
- `"pad"` : un écran tactile dont le petit côté mesure au moins 600 points ; `"phone"` sinon. Ce sont des plateformes mobiles : `platform.select` choisit `mobile`.

L'idiome est décidé au démarrage de l'application et reste le même pendant son exécution, comme sur toutes les plateformes ; une fenêtre de bureau étroite reste un bureau, mise en page pour son `windowSize()`. Les props `web={{…}}`, ainsi que les classes `platform.select({ web })` et `web:`, ne s'appliquent que dans les navigateurs ; `ios={{…}}`, `native` et `ios:` ne s'y appliquent pas.

La page signale le reste de l'environnement et le maintient à jour :

| Valeur | Provenance dans le navigateur |
|---|---|
| Locale (valeur par défaut de `Intl`) | `navigator.languages[0]` |
| Fuseau horaire (heure locale de `Date`, `timeZone` par défaut de `Intl`) | celui du navigateur (`Intl.DateTimeFormat().resolvedOptions().timeZone`), heure d'été comprise |
| Le sens de mise en page (`rtl:` / `ltr:`) | `<html dir>` lorsqu'il est défini, sinon le script de la locale |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | la taille de police de l'élément racine / 16 px (le réglage de taille du texte du navigateur) |
| `pixelRatio()` | `devicePixelRatio` (change avec le zoom et les écrans) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` là où elle recouvre le conteneur (pages `viewport-fit=cover` sur les téléphones) |
| `keyboardFrame()` | la part du conteneur que recouvre le clavier à l'écran (`visualViewport`) |

`platform.version` vaut `"0.0"`, et `screenReaderEnabled()` reste `false` (les navigateurs ne l'indiquent pas). Les barres du navigateur autour de la page appartiennent au navigateur ; le [`statusBar`](../modules/nsh-base.md#status-bar) d'une page est destiné aux téléphones.
<a id="networking"></a>

## Réseau

`fetch` (avec les flux, `AbortController` et `FormData`) et les URL `<Image>` passent par la pile réseau propre au navigateur, une fois que NSH a vérifié les [capacités](./sandbox-and-capabilities.md) de l'application. Comme les requêtes sont celles du navigateur, ses règles s'appliquent :

- **Les URL relatives** se résolvent par rapport à l'URL de la page, comme dans le navigateur : une application publiée atteint sa propre API avec `fetch("/api/items")`, et `<Image src="/photos/a.jpg" />` se charge depuis son propre serveur. (Les plateformes natives n'ont pas de page, elles ont donc besoin d'URL absolues.)
- **CORS.** Une requête vers une origine autre que celle de la page n'aboutit que si ce serveur autorise l'origine de la page (`Access-Control-Allow-Origin`) ; sinon `fetch` est rejeté avec une erreur réseau. Seuls les en-têtes de réponse que le serveur expose sont visibles.
- **Les cookies** (et l'authentification HTTP) ne sont envoyés qu'à l'origine de la page elle-même (`credentials: "same-origin"`), et les en-têtes que les navigateurs interdisent (`Cookie`, `User-Agent`, `Host`, ...) sont supprimés.
- **Les redirections** sont suivies par le navigateur. Une requête redirigée qui ne doit pas la suivre échoue : `redirect: "manual"` et `"error"`, ainsi que les requêtes d'une application dont les capacités restreignent `network` (NSH vérifie chaque saut, et les navigateurs ne révèlent pas une redirection avant de la suivre).
- **Les corps de requête** qui sont un `ReadableStream` sont d'abord collectés puis envoyés d'un seul bloc ; les corps de réponse sont diffusés en flux au fur et à mesure de leur arrivée.

<a id="split-bundles"></a>

## Bundles fractionnés

Une application web TSX n'a pas besoin de télécharger tout son code avant l'affichage du premier écran (une application Rust est un seul `nsh.wasm`,
que le navigateur compile pendant le téléchargement). `nsh package --target web` publie les applications TSX fractionnées, chaque chunk étant `<name>.<digest>.js` et la page associant les chunks à ces fichiers. Pour fractionner un bundle vous-même, `nsh build --split` place les modules que `import()` charge dans des chunks distincts, à côté de `bundle.js` :

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

Le premier `import("./Screen")` télécharge `Screen.js` et les chunks qu'il importe, tous en même temps, puis les évalue ; les imports ultérieurs se résolvent immédiatement. La page indique où se trouvent les chunks : par défaut à côté du bundle, ou une URL par chunk, pour des fichiers renommés avec un condensat de contenu afin qu'un CDN puisse les mettre en cache indéfiniment :

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

Un chunk qui ne peut pas être téléchargé fait rejeter `import()` avec une `TypeError` qui le nomme ; le `import()` suivant réessaie. Les noms de chunks sont des noms de fichiers fixes issus du bundle : l'application ne peut pas faire télécharger autre chose à la page.

La [galerie](/gallery) charge chaque démo de cette façon : `lazy` (dans `examples/gallery/ui.tsx`) crée un composant qui lance l'import au premier rendu, affiche un espace réservé jusqu'à sa résolution, puis rend ce qu'il a chargé. Son premier chargement est l'index et la démo affichée en premier ; une police qu'une démo importe vient avec le chunk de cette démo. Les builds natifs contiennent tous les modules, l'import s'y résout donc immédiatement :

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## Limites

Ces points relèvent du navigateur, et le backend web s'y conforme :

- **Vues web d'autres sites** : `WebView` est un `<iframe>`. Le HTML en ligne (`html`) a droit à tout : `onMessage`, `postMessage`, `injectJavaScript`, les scripts injectés et les événements de chargement (il s'exécute avec sa propre origine, distincte de la page). Une page d'un autre site n'obtient que `postMessage` et les événements de chargement avec l'URL qui lui a été donnée : les navigateurs masquent ses navigations, son titre, son historique et ses erreurs à la page qui l'entoure, et `userAgent` ne peut pas être défini.
- **Vidéos avec son qui démarrent seules** : `Video` est un `<video>` avec toutes ses props et tous ses événements, mais les navigateurs ne démarrent une vidéo avec son qu'après un geste de l'utilisateur (les vidéos muettes se lisent).
- **Composants natifs** : les composants natifs enregistrés appartiennent aux applications natives qui embarquent NSH ; sur le web, leur vue reste vide, avec un avertissement dans la console.
- **Services de la plateforme** : la lecture du presse-papiers (`Clipboard.readText`, ainsi que `hasText`) nécessite un contexte sécurisé (HTTPS) et peut demander l'accord de l'utilisateur. Les images ne signalent pas `onProgress`.
- **Détails de mise en forme du texte** : le saut de ligne est un sous-ensemble de UAX #14 (espaces, CJK, traits d'union, et les règles de début et de fin de ligne de la ponctuation CJK : les signes fermants tels que `。`, `，` et `」` ne se placent pas en début de ligne, les signes ouvrants tels que `（` et `「` pas en fin de ligne), sans césure ni réordonnancement bidirectionnel au-delà de la direction du paragraphe.

Le lecteur et le serveur de développement exécutent les applications avec des paramètres de développement ; les applications publiées s'exécutent en version release. Les deux exécutent le code d'une application TSX sur le moteur JavaScript du navigateur, dans un realm propre à l'application.

<a id="see-also"></a>

## Voir aussi

- [Packaging](./packaging.md) : les autres cibles de `nsh package`.
- [Architecture](./architecture.md) : le moteur, le cœur et les lots de montage que reprend le build web.
- [Testing](./testing-and-trace.md) : `nsh test` exécute le même moteur sans interface graphique, avec un moteur de texte approximatif.
