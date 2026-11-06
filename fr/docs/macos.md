---
title: "macOS"
description: "Exécutez des applications NSH Rust et TSX sur macOS dans des fenêtres AppKit, empaquetez-les sous forme de bundles .app, intégrez-les dans une application Mac avec AppView, et découvrez ce qui diffère sur macOS."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

Les applications NSH s'exécutent aussi comme des applications Mac natives. Le backend macOS les affiche avec des vues AppKit et Core Animation et calcule la mise en page du texte avec CoreText ; le cœur, le graphe réactif, le moteur de rendu, la mise en page Taffy et les modules natifs sont les mêmes que sur iOS et Android, si bien qu'une même application fonctionne partout. Sur macOS, `os()` vaut `Os::MacOs` (`platform.os` vaut `"macos"` en TSX) et les props `desktop={{…}}` de TSX s'appliquent. Le titre de la fenêtre, une barre de titre propre à l'application, la barre de menus et les menus contextuels proviennent de `nsh_core::element::desktop` en Rust ([Barres de titre sur desktop](./rust.md#desktop-title-bars)) et de [`nsh/desktop`](../modules/nsh-desktop.md) en TSX.

Le backend macOS se comporte comme une application de bureau : souris, trackpad et clavier, fenêtres redimensionnables, boîtes de dialogue au-dessus de la fenêtre et barre de menus.

<a id="requirements"></a>

## Prérequis

- **macOS 14** ou version ultérieure, sur lequel l'application s'exécute.
- Les outils en ligne de commande de Xcode (`xcode-select --install`), pour compiler les runners des applications Rust et le runtime macOS de NSH à partir d'un checkout, et pour empaqueter les applications (`codesign`, `sips`). La distribution créée avec `cargo xtask dist` sur un Mac embarque le runtime des applications TSX dans `runtime/macos/`.

<a id="running-an-app"></a>

## Lancer une application

Une application Rust se lance depuis son répertoire :

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` compile un runner de débogage avec votre crate et ouvre l'application dans une fenêtre, avec ses journaux (`log::info!` et les autres) dans le terminal ; une modification du code Rust de la crate recompile le runner et redémarre l'application. `cargo run` démarre la même racine à partir du `src/main.rs` de la crate, que `nsh init --template rust` écrit : [`run_app`](#embedding-in-a-mac-app) avec `AppSource::Rust`.

Une application TSX désigne son point d'entrée :

```sh
nsh run App.tsx --target macos
```

L'application s'ouvre dans une fenêtre AppKit (1200×800 par défaut), avec rechargement à chaud, journaux dans le terminal et surcouche d'erreur comme sur les autres cibles ; Cmd+R recharge le dernier build. La barre de menus et la fenêtre affichent le nom de l'application (`"name"` de nsh.json, sinon celui de son répertoire). Dans un checkout, `nsh run` compile d'abord l'hôte de développement (`nsh-macos-host`). Arrêter `nsh run` ferme la fenêtre, et fermer la fenêtre met fin à `nsh run`. L'hôte peut aussi exécuter seul un bundle compilé :

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` est la taille initiale de la fenêtre (applications TSX) ; la fenêtre peut être redimensionnée. `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` est l'écran principal, celui qui porte la barre de menus.

`nsh test --target macos` exécute les tests d'une application TSX dans des fenêtres macOS, sur un écran secondaire s'il y en a un (l'écran principal reste à vous ; `--display <n>` en choisit un autre) : chaque application qu'un test ouvre obtient sa propre fenêtre, à la taille que demande le test, même sur un écran plus petit, et les étapes cliquent, saisissent du texte et font défiler avec l'entrée du système sur les vues que désignent leurs sélecteurs ([Testing](./testing-and-trace.md#on-a-real-platform)).

<a id="performance-monitor"></a>

### Moniteur de performances

`--fps` (`AppOptions { fps: true, .. }` dans le `run_app` d'une application Rust, `AppView::set_fps_monitor(true)` en cas d'intégration, `nsh run App.tsx --target macos --fps`, le `--fps` de l'hôte, ou le `open -a MyApp --args --fps` d'une application TSX empaquetée) affiche un panneau en haut à droite de l'application, mis à jour deux fois par seconde :

| Ligne | Mesure |
|---|---|
| `FPS` | Images affichées durant la dernière seconde : rafraîchissements de l'écran où l'application a changé (une application inactive affiche une valeur basse ; ce n'est pas de la lenteur). `max` est ce que le thread principal pouvait suivre, puis la fréquence de l'écran (120 Hz sur les écrans ProMotion). |
| `TICK` | Les intervalles entre les rafraîchissements de l'écran tels qu'ils sont arrivés (moyenne, p95) et `gap`, l'intervalle p95 entre les images affichées : un rafraîchissement (8,3 ms à 120 Hz) quand rien n'est en retard. |
| `MAIN` | Temps du thread principal par image (application des changements du moteur, dessin du texte et des canvas, animations, entrées), son 95e percentile, et `drop` : la part des images qui ont duré plus longtemps qu'un rafraîchissement. |
| `JS` / `CORE` | Par commit : votre code (gestionnaires, minuteries, lignes de liste) et le cœur de NSH (mise en page, texte, comparaison) ; commits par seconde, changements de vues natives par commit. |
| `HOP` | Combien de temps les changements attendent entre le thread du moteur et le thread principal ; à quel point le thread du moteur est occupé. |
| `CPU` / `GPU` / `MEM` | Le processus : CPU (100 % correspond à un cœur), sa part de GPU, son empreinte mémoire (la valeur du Moniteur d'activité). |

Les barres en dessous représentent le temps du thread principal des 120 dernières images par rapport à un rafraîchissement (la ligne) : vert en dessous de la moitié, orange en dessous de la ligne, rouge au-delà. Tant que le panneau est affiché, les mesures sont aussi consignées une fois par seconde (cible `nsh::perf`, sous la forme du backend Linux avec les phases d'image de macOS `tick`, `drain` et `canvas` ; millisecondes sous la forme moyenne/p50/p95/max), ce que `nsh test --fps -v` affiche et `examples/gallery/tools/perf.py` lit. Mesurez des builds de release ; le moniteur ne coûte rien lorsqu'il est désactivé.

## Packaging

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

Écrit un bundle d'application :

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

Le `.app` est signé ad hoc : il s'exécute donc sur le Mac qui l'a compilé. Pour le distribuer, signez-le avec un Developer ID et faites-le notariser. `--run` ouvre l'application après l'avoir empaquetée.

<a id="embedding-in-a-mac-app"></a>

## Intégration dans une application Mac

La crate `nsh-platform-macos` (du dépôt NSH) offre à une application Mac en Rust `AppView` : un moteur NSH sous la forme d'une `NSView`. Chaque `AppView` est indépendante ; plusieurs peuvent s'exécuter en même temps. Elle exécute une racine Rust, le composant racine de votre crate :

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` donne à la racine son [thème](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) et `Root::app_id` l'identifiant sous lequel ses données sont conservées. Un bundle TSX écrit par `nsh build` se charge dans la même vue :

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` remplace ce qui s'exécutait ; `stop` met fin à l'application. `asset_base` indique où les URI `asset:/` se résolvent (`AssetBase::Directory` ou `AssetBase::Http`). Les bundles de bytecode (`bundle.nshc`) se chargent avec `unsafe { Bundle::bytecode(bytes) }` : le bytecode est une entrée de confiance, ne le chargez donc qu'à partir des fichiers de votre propre application.
Pour une application qui n'est qu'une application NSH, `run_app(source, options)` (`AppSource::Rust(root)` ou `AppSource::Bundle(bundle)`) ouvre une `AppView` dans une fenêtre avec un menu standard (About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close), que l'application peut remplacer par `Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md)), et s'exécute jusqu'à la fermeture de la fenêtre.
Par défaut, fermer la fenêtre ou choisir Quit arrête le moteur et retourne de `run_app` ; l'appelant peut alors terminer le nettoyage ou relancer son exécutable.

Définissez `AppOptions { keep_alive_on_close: true, ..Default::default() }` pour garder la session autonome active quand sa fenêtre se ferme. La fermeture masque la fenêtre ; la rouvrir depuis le Dock affiche cette même fenêtre et ce même moteur. Pour une sortie explicite ou un redémarrage de mise à jour, appelez `nsh_platform_macos::quit_app()` depuis n'importe quel thread. Elle ferme la fenêtre conservée, arrête le moteur et retourne de `run_app`. `nsh_core::element::desktop::close_window()` suit la politique de fermeture de fenêtre choisie.

`AppOptions::cache` (ou `AppView::set_cache`, pour les applications chargées ensuite) définit où les applications conservent leurs caches, les [images qu'elles téléchargent](./images-and-assets.md#kept-on-disk), et la quantité que chacune en garde (`CacheOptions` : le répertoire de cache du système et 256 Mio d'images par défaut).

`AppView::set_locale(Some(locale))` et `AppView::set_font_scale(Some(scale))` donnent à l'application la langue et la taille de texte de votre application à la place de celles du système (`None` suit de nouveau celles du système) : `locale()`, `Intl`, `fontScale()` et le texte suivent immédiatement ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` superpose l'identité visuelle de votre application au [thème](./tailwind.md#theme-tokens) de l'application : un fichier de thème au format du `"theme"` de `nsh.json`, dont les tokens l'emportent sur ceux de l'application portant les mêmes noms en mode clair et sombre, tandis que les autres tokens de l'application restent ; les classes telles que `bg-primary` sont restylées immédiatement, et les applications chargées plus tard démarrent avec lui (`None` rend à l'application son propre thème ; un fichier qui ne s'analyse pas est une erreur et ne change rien).

Les composants natifs s'enregistrent avec `AppView::register_component` ; voir [Native components](./native-components.md#registering-on-macos-rust). `set_ui_sets(sets)` définit les ensembles d'UI que sert chaque moteur : ceux de NSH (`nsh_base::registry()`) et ceux de vos crates (`my_app::registry()`, que `#[native_module]` produit), de sorte que le TSX chargé par une vue importe aussi vos composants et modules Rust.

<a id="what-differs-on-macos"></a>

## Ce qui diffère sur macOS

L'environnement est celui d'un poste de bureau : la zone de sécurité et la hauteur du clavier valent 0, `idiom()` est le desktop (`platform.idiom` vaut `"desktop"`), `os_version()` (`platform.version`) est la version de macOS, et le mode sombre suit en direct l'apparence du système. Voir [Device and environment](./device-and-environment.md).

Les entrées sont celles d'un poste de bureau : la souris, le trackpad (défilement avec inertie, pincement et rotation) et le clavier. Le texte sélectionnable se sélectionne en le faisant glisser, par double et triple clic, et se copie avec Cmd+C. Escape, Option+Gauche, Cmd+[ et le bouton Précédent de la souris ferment la boîte de dialogue la plus récente ou reviennent en arrière dans une pile (Escape dans un champ ou une page web ne fait que le quitter ; une page reçoit ces touches en premier et garde celles qu'elle utilise) ; un `Dialog` est une couche au-dessus de toute la fenêtre qui affiche la fenêtre contextuelle et l'arrière-plan de l'application. Les pages affichent leur `header` en haut. Un clic n'importe où dans un `Input`, y compris dans son padding, place le curseur au point le plus proche. `AlertDialog` affiche une feuille `NSAlert` sur la fenêtre : jusqu'à deux actions d'alerte sur une ligne (l'action d'annulation tout à gauche, la dernière action ordinaire étant celle par défaut pour Return), davantage d'actions ainsi que celles d'une feuille d'actions empilées dans leur ordre avec l'action d'annulation en dernier et sans action par défaut ; Escape choisit l'action d'annulation.

<a id="keyboard"></a>

### Clavier

| Touches | Action |
|---|---|
| Return | Dans un `Input`, ce que dit `submitBehavior` : soumettre (`onSubmit`), soumettre et quitter le champ, ou insérer un saut de ligne (champs multilignes) |
| Return, Entrée du pavé numérique, Espace | Active une vue ayant le focus avec `onPress` une seule fois à l'appui ; la répétition automatique est ignorée |
| Shift+Return, Option+Return, Ctrl+Return | Un saut de ligne dans un champ multiligne dont Return soumet |
| Tab, Shift+Tab (Ctrl aussi) | Le champ ou la vue pressable suivant / précédent dans l'ordre de l'écran, au sein de la boîte de dialogue la plus récente ; Option+Tab insère une tabulation dans un champ multiligne |
| Escape | Quitte le champ ayant le focus ; sinon efface une sélection de texte, puis ferme la boîte de dialogue la plus récente ou revient en arrière |
| Option+Gauche, Cmd+[, bouton Précédent de la souris | Revenir en arrière (pas quand un champ a le focus : Option+Gauche y déplace le curseur) |
| Option / Cmd + flèches, avec Shift ; Option+Suppr, Cmd+Suppr ; Ctrl+A / E / K | Déplacer, sélectionner et supprimer par mot et par ligne dans un champ, comme dans toute application Mac |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Annuler, rétablir, couper, copier, coller, tout sélectionner (un champ `masked` refuse couper et copier) ; Cmd+A / Cmd+C sélectionnent et copient le texte sélectionnable |
| Flèches ; Page Up / Down, Espace, Shift+Espace, Option+Haut / Bas ; Home / End, Cmd+Haut / Bas | Font défiler la vue à défilement autour de la vue ayant le focus ou sous la souris d'une ligne, d'une page, jusqu'au début / à la fin (pas quand un champ a le focus) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | Fermer, réduire, plein écran, masquer, masquer les autres, quitter (menus des applications `nsh package` et `nsh run`) |
| Cmd+R | Recharge le dernier build (`nsh run`) |

Les raccourcis propres à l'application ([`keymap`](../modules/nsh.md#keymap)) passent avant ceux-ci, sauf les touches d'activation adressées à une vue pressable ayant le focus, Quit, Hide, Minimize et Full Screen, qui ne peuvent pas être réassignés.

Les raccourcis fonctionnent avec n'importe quelle disposition de clavier (sur une disposition cyrillique ou grecque, Cmd+C est la touche qui tape C sur une disposition US). Un retour qui valide la composition d'une méthode de saisie (chinois, japonais, ...) ne soumet jamais. `onKeyPress` rapporte ce que rapporte React Native : le texte saisi, `"Enter"`, `"Backspace"` et `"Escape"`.

Non pris en charge, ou différent :

- **Vues à défilement avec zoom** (`zoomTo`, les props de zoom).
- **`mixBlendMode`**, et `brightness()` au-delà de 1.
- **Champs de saisie** : types de contenu et saisie automatique, types de clavier, capitalisation automatique, espacement des lettres ; les vues accessoires de saisie ne sont jamais affichées (il n'y a pas de clavier logiciel) et `keyboardShouldPersistTaps` est ignoré.
- **`scrollable={false}` de `WebView`** empêche la molette de la souris et le trackpad de faire défiler la page : ils font défiler les vues à défilement de l'application qui l'entourent, comme sur iOS. La page défile toujours avec son clavier (Espace, les flèches) et ses propres scripts, et les balayages du trackpad entre ses pages (`allowsBackForwardNavigationGestures`) sont eux aussi désactivés.
- **Accessibilité** : `accessibilityActions` personnalisées.
- **La barre d'état** et **le retour haptique** (pas d'équivalent sur desktop).

<a id="see-also"></a>

## Voir aussi

- [CLI](./cli.md) : `nsh run --target macos`, `nsh package --target macos`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
