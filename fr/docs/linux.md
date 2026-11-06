---
title: "Linux"
description: "Exécutez des applications NSH en Rust et TSX sous Linux dans des fenêtres GTK 4, empaquetez-les, intégrez-les dans une application GTK avec AppView, et découvrez ce qui diffère sous Linux."
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

Les apps NSH fonctionnent aussi sous Linux. Le backend Linux les affiche avec des widgets GTK 4 et met en forme le texte avec Pango ; le noyau, le graphe réactif, le moteur de rendu, la mise en page Taffy et les modules natifs sont les mêmes que sur iOS et Android, de sorte qu'une seule app fonctionne partout. Sous Linux, `os()` vaut `Os::Linux` (`platform.os` vaut `"linux"` en TSX) et les props `desktop={{…}}` de TSX s'appliquent. Le titre de la fenêtre, une barre de titre propre à l'app, la barre de menus et les menus contextuels proviennent de `nsh_core::element::desktop` en Rust ([Barres de titre de bureau](./rust.md#desktop-title-bars)) et de [`nsh/desktop`](../modules/nsh-desktop.md) en TSX.

<a id="requirements"></a>

## Prérequis

- **GTK 4.14** ou plus récent. Pour compiler le runner d'une app Rust ou le runtime Linux de NSH (depuis un checkout, ou avec `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` sur Debian et Ubuntu (24.04 ou plus récent), `gtk4 clang` sur Arch, `gtk4-devel clang` sur Fedora.
- **WebKitGTK 6.0** (2.40 ou plus récent) pour les web views : `libwebkitgtk-6.0-dev` sur Debian et Ubuntu, `webkitgtk-6.0` sur Arch, `webkitgtk6.0-devel` sur Fedora pour compiler le runtime. L'hôte de développement et le runner de release l'utilisent par défaut, donc les apps empaquetées ont besoin de WebKitGTK 6.0 là où elles s'exécutent (`libwebkitgtk-6.0-4` sur Debian et Ubuntu ; les bureaux GNOME l'incluent). `cargo xtask dist` sur une machine sans ses fichiers de développement produit un runtime dont les web views sont des espaces réservés, et dont les apps n'ont besoin que de GTK.
- Les plugins **GStreamer** pour les formats vidéo que lit votre app (GTK lit la vidéo via GStreamer).

<a id="running-an-app"></a>

## Lancer une app

Sous Linux, `nsh run` ouvre l'app dans une fenêtre GTK. Une app Rust se lance depuis son répertoire :

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` compile un runner de débogage avec votre crate et ouvre l'app, avec ses logs (`log::info!` et les autres) dans le terminal ; une modification du code Rust de la crate recompile le runner et redémarre l'app. `cargo run` démarre la même racine depuis le `src/main.rs` de la crate, que `nsh init --template rust` écrit : [`run_app`](#embedding-in-a-gtk-app) avec `AppSource::Rust`.

Une app TSX nomme son point d'entrée et s'ouvre par défaut dans une fenêtre de 390×844, avec rechargement à chaud, logs dans le terminal et superposition d'erreurs comme sur les autres cibles :

```sh
nsh run App.tsx
```

Dans un checkout, `nsh run` compile d'abord l'hôte de développement (`nsh-linux-host`) ; la distribution produite sous Linux l'inclut dans `runtime/linux/`. Ctrl-C ferme la fenêtre, et fermer la fenêtre met fin à `nsh run`. L'hôte exécute aussi un bundle compilé de façon autonome :

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` est la taille par défaut de la fenêtre (apps TSX) ; les gestionnaires de fenêtres en mosaïque peuvent donner une autre taille à la fenêtre.

## Packaging

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

Écrit un répertoire, ainsi que le même contenu sous forme d'archive :

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

L'exécutable trouve `nsh/` à côté de lui (un lien symbolique vers lui, dans `~/.local/bin` par exemple, fonctionne aussi). GTK 4, Pango et WebKitGTK 6.0 doivent être installés là où l'app s'exécute. Pour afficher l'app dans le lanceur d'un bureau, placez l'exécutable (ou un lien) dans le `PATH`, le fichier `.desktop` dans `~/.local/share/applications` et l'icône dans un répertoire de thème d'icônes. `--run` lance l'app après l'avoir empaquetée.

<a id="embedding-in-a-gtk-app"></a>

## Intégrer dans une app GTK

La crate `nsh-platform-linux` (du dépôt NSH) donne à une app GTK en Rust `AppView` : un moteur NSH sous forme de widget GTK. Chaque `AppView` est indépendant ; plusieurs peuvent s'exécuter en même temps. Il exécute une racine Rust, le composant racine de votre crate :

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` donne à la racine son [thème](./rust.md#theme) et `Root::app_id` l'identifiant sous lequel ses données sont conservées. Un bundle TSX écrit par `nsh build` se charge dans la même vue, avec `asset_base` défini sur son répertoire `assets` :

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` remplace ce qui s'exécutait ; `stop` met fin à l'app. `asset_base` lui indique où les URI `asset:/` sont résolues (`AssetBase::Directory` ou `AssetBase::Http`). Les bundles de bytecode (`bundle.nshc`) se chargent avec `unsafe { Bundle::bytecode(bytes) }` : le bytecode QuickJS est une entrée de confiance, ne le chargez donc qu'à partir des fichiers de votre propre app. Une fenêtre autonome s'obtient avec `nsh_platform_linux::run_app(source, options)`, avec `AppSource::Rust(root)` ou `AppSource::Bundle(bundle)`.

`AppOptions::cache` (ou `AppView::set_cache`, pour les apps chargées ensuite) définit où les apps conservent leurs caches, les [images qu'elles téléchargent](./images-and-assets.md#kept-on-disk), et la taille que chacune conserve (`CacheOptions` : par défaut, le répertoire de cache du système et 256 MiB d'images).

`AppView::set_locale(Some(locale))` et `AppView::set_font_scale(Some(scale))` donnent à l'app la langue et la taille de texte de votre app à la place de celles du système (`None` suit de nouveau celles du système) : `locale()`, `Intl`, `fontScale()` et le texte suivent immédiatement ([Appareil et environnement](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` applique l'identité visuelle de votre app par-dessus le [thème](./tailwind.md#theme-tokens) de l'app : un fichier de thème au format du `"theme"` de `nsh.json`, dont les tokens l'emportent sur ceux de l'app portant les mêmes noms en mode clair et sombre, tandis que les autres tokens de l'app restent ; les classes comme `bg-primary` sont restylées immédiatement, et les apps chargées plus tard démarrent avec ce thème (`None` rend à l'app son propre thème ; un fichier qui ne s'analyse pas est une erreur et ne change rien).

Les composants natifs s'enregistrent avec `AppView::register_component` ; voir [Composants natifs](./native-components.md#registering-on-linux-rust). `set_ui_sets(sets)` définit les ensembles d'UI que sert chaque moteur : ceux de NSH (`nsh_base::registry()`) et ceux de vos crates (`my_app::registry()`, que `#[native_module]` produit), de sorte que le TSX chargé par une vue importe aussi vos composants et modules Rust.

<a id="what-differs-on-linux"></a>

## Ce qui diffère sous Linux

L'environnement est celui d'un bureau : la zone de sécurité et la hauteur du clavier valent 0, `idiom()` est le bureau (`platform.idiom` vaut `"desktop"`), `os_version()` (`platform.version`) est la version majeure et mineure du noyau, et le mode sombre suit en direct le réglage du bureau (via le portail de paramètres XDG). Voir [Appareil et environnement](./device-and-environment.md).

<a id="keyboard"></a>

### Clavier

| Touches | Action |
|---|---|
| Return | Dans un `Input`, ce que dit `submitBehavior` : envoyer (`onSubmit`), envoyer et quitter le champ, ou un retour à la ligne (champs multilignes) |
| Shift+Return, Alt+Return | Un retour à la ligne dans un champ multiligne dont Return envoie (Ctrl+Return envoie) |
| Tab, Shift+Tab | Le champ suivant / précédent dans l'ordre de l'écran, au sein du dialogue le plus récent |
| Escape | Quitte le champ ayant le focus ; sinon efface une sélection de texte, puis ferme le dialogue le plus récent ou revient en arrière |
| Alt+Left, touche Retour, bouton retour de la souris | Reviennent en arrière (y compris depuis un champ) |
| Ctrl+flèches, Home / End, avec Shift ; Ctrl+Backspace / Delete | Déplacent, sélectionnent et suppriment par mot et par ligne dans un champ, comme dans toute app GTK |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | Annuler, rétablir, couper, copier, coller, tout sélectionner (un champ `masked` refuse de couper et de copier) ; Ctrl+A / Ctrl+C sélectionnent et copient le texte sélectionnable |
| Flèches ; Page Up / Down, Space, Shift+Space ; Home / End | Font défiler la scroll view autour de la vue ayant le focus ou sous la souris d'une ligne, d'une page, jusqu'au début / à la fin (pas lorsqu'un champ a le focus) |
| Ctrl+W, F11, Ctrl+Q | Fermer la fenêtre, plein écran, quitter (apps `nsh package` et `nsh run`) |
| Ctrl+R | Recharge le dernier build (`nsh run`) |

Les raccourcis propres à l'app ([`keymap`](../modules/nsh.md#keymap)) forment un contrôleur de raccourcis valable pour toute la fenêtre ; Ctrl+Q et F11 ne peuvent pas être réassignés.

Les raccourcis fonctionnent avec n'importe quelle disposition de clavier (sur une disposition cyrillique ou grecque, Ctrl+C correspond à la touche qui tape C sur une disposition US). Un retour qui valide la composition d'une méthode de saisie (chinois, japonais, ...) n'envoie jamais. `onKeyPress` rapporte ce que rapporte React Native : le texte saisi, `"Enter"`, `"Backspace"` et `"Escape"` ; le texte collé n'est pas rapporté.

Les web views sont des pages WebKitGTK, dessinées à l'intérieur des vues de NSH : les sheets, dialogues, toasts et les vues qui les suivent se dessinent par-dessus une page, et les parents la découpent et l'estompent. Leurs données de site web (cookies, stockage, cache) sont conservées par app, sous `~/.local/share/<app id>/webkit` et `~/.cache/<app id>/webkit`. La capacité `webview` s'applique aussi aux pages des frames : un `iframe` d'un hôte que votre app n'a pas reçu l'autorisation d'utiliser reste vide. Escape dans une page la quitte, comme dans un champ de texte (sauf si la page l'utilise) ; Alt+Left et le bouton retour de la souris reviennent en arrière dans la page tant qu'elle a un historique.

Non pris en charge :

- **Vidéo `rate`** : GTK ne lit qu'à vitesse normale. `onEnd` n'arrive que pour les vidéos qui ne bouclent pas.
- **Scroll views avec zoom** (`zoomTo`, les props de zoom).
- **`mixBlendMode` et `backdropFilter`** (la couleur d'arrière-plan est toujours dessinée) ; `borderCurve: "continuous"` dessine des coins circulaires.
- **Input accessory views** et **barre d'état** (pas d'équivalent sur bureau).
- **Accessibilité** : regroupement `accessible`, `accessibilityActions` personnalisé ; les live regions sont annoncées à la place.

<a id="see-also"></a>

## Voir aussi

- [CLI](./cli.md) : `nsh run --target linux`, `nsh package --target linux`
- [Packaging](./packaging.md)
- [Code spécifique à la plateforme](./platform-specific.md)
