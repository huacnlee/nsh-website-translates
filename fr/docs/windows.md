---
title: "Windows"
description: "Exécutez des applications NSH en Rust et TSX sur Windows dans des fenêtres Win32 dessinées avec Direct2D, empaquetez-les, intégrez-les dans une application Win32 avec AppView, et découvrez ce qui diffère sous Windows."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

Les apps NSH s'exécutent aussi sous Windows. Le backend Windows les dessine dans des fenêtres Win32 avec Direct2D et met en page le texte avec DirectWrite ; le cœur, le graphe réactif, le moteur de rendu, la mise en page Taffy et les modules natifs sont les mêmes que sur iOS et Android, de sorte qu'une même app s'exécute partout. Sous Windows, `os()` vaut `Os::Windows` (`platform.os` vaut `"windows"`
en TSX) et les props `desktop={{…}}` de TSX s'appliquent. Le titre de la fenêtre, une barre de titre propre à l'app, la barre de menus et les
menus contextuels proviennent de `nsh_core::element::desktop` en Rust ([Barres de titre desktop](./rust.md#desktop-title-bars)) et de
[`nsh/desktop`](../modules/nsh-desktop.md) en TSX.

<a id="requirements"></a>

## Prérequis

- **Windows 10 1809** ou ultérieur, ou Windows 11.
- Le **WebView2 Runtime** pour les web views. Il est fourni avec Windows 11 et avec Microsoft Edge sous Windows 10 ; sans lui, un
  `WebView` affiche un espace réservé.
- Les **codecs Media Foundation** pour les formats vidéo que lit votre app (les vidéos sont lues par la pile multimédia propre à Windows).
- Pour compiler le runner d'une app Rust : Visual Studio Build Tools avec la charge de travail C++ et le Windows SDK. Pour compiler le runtime
  Windows de NSH (depuis un checkout, ou `cargo xtask dist` sous Windows), il faut aussi LLVM (pour les bindings de QuickJS).

<a id="running-an-app"></a>

## Lancer une app

Sous Windows, `nsh run` ouvre l'app dans une fenêtre. Une app Rust se lance depuis son répertoire :

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` compile un runner de debug avec votre crate et ouvre l'app, avec ses logs (`log::info!` et les autres) dans le
terminal ; une modification du code Rust de la crate recompile le runner et redémarre l'app. `cargo run` démarre la même
racine à partir du `src/main.rs` de la crate, que `nsh init --template rust` écrit : [`run_app`](#embedding-in-a-win32-app)
avec `AppSource::Rust`.

Une app TSX indique son point d'entrée et s'ouvre par défaut dans une fenêtre de 1200×800, avec rechargement à chaud, logs dans le terminal et
overlay d'erreur, comme sur les autres cibles :

```sh
nsh run App.tsx
```

Dans un checkout, `nsh run` compile d'abord l'hôte de développement (`nsh-windows-host.exe`) ; la distribution produite sous Windows
l'embarque dans `runtime\windows\`. Ctrl-C ferme la fenêtre, et la fermeture de la fenêtre met fin à `nsh run` ; l'hôte ne survit jamais
à `nsh`, quelle que soit la manière dont celui-ci se termine. L'hôte exécute aussi un bundle compilé de façon autonome :

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` est la taille de la fenêtre en points (`<width>x<height>` ; apps TSX).

<a id="performance-monitor"></a>

### Moniteur de performance

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, le `--fps` de l'hôte, ou
`AppOptions { fps: true, .. }` dans le `run_app` d'une app Rust) consigne une fois par seconde les mesures du moniteur de performance
(cible `nsh::perf`) : images affichées par rapport à la fréquence de l'écran, temps du thread principal par image et ses phases (`tick`,
`drain`, `paint`, `present`, `canvas`), commits du moteur, CPU et mémoire, dans le format qu'utilisent les autres desktops
(millisecondes sous la forme moyenne/p50/p95/max). `nsh test --fps -v` les affiche et `examples/gallery/tools/perf.py` les lit
([Rapport de performance](./performance-report.md#windows-win32-direct2d)). Mesurez avec des builds de release ; le moniteur ne coûte
rien lorsqu'il est désactivé.

<a id="packaging"></a>

## Empaquetage

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

Écrit un répertoire, ainsi que le même contenu sous forme d'archive :

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

L'exécutable trouve `nsh\` à côté de lui ; copiez le répertoire entier (ou décompressez le `.zip`) là où l'app doit
résider : rien n'est installé. L'icône de `nsh.json` est intégrée à l'exécutable (l'Explorer et la barre des tâches l'affichent)
sans outil supplémentaire ; l'empaquetage depuis un autre système conserve l'icône par défaut. L'identifiant de l'app regroupe les fenêtres de l'app dans
la barre des tâches. `--run` lance l'app après l'avoir empaquetée. L'exécutable n'est pas signé : signez-le avec votre propre
certificat (`signtool`) pour le distribuer.

<a id="embedding-in-a-win32-app"></a>

## Intégration dans une app Win32

La crate `nsh-platform-windows` (du dépôt NSH) fournit à une app Win32 en Rust `AppView` : un moteur NSH dans une fenêtre enfant
d'une de vos fenêtres. Chaque `AppView` est indépendant ; plusieurs peuvent s'exécuter en même temps. Il exécute une racine Rust, le composant
racine de votre crate :

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

Un bundle TSX écrit par `nsh build` se charge dans la même vue, avec `asset_base` pointant vers son répertoire `assets` :

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

La vue est une fenêtre enfant : c'est votre boucle de messages qui la fait fonctionner, et vous la positionnez avec `MoveWindow` sur son `hwnd()` lorsque
le parent est redimensionné. Créez-la sur le thread de la fenêtre qui la contient : son cycle de vie suit la fenêtre de premier niveau de cette fenêtre,
celle sous laquelle elle a été créée. `AppView::load` remplace ce qui s'exécutait ; `stop` (ou la destruction de la fenêtre) met fin à l'app. `asset_base`
indique où les URI `asset:/` se résolvent (`AssetBase::Directory` ou `AssetBase::Http`). Les bundles de bytecode (`bundle.nshc`)
se chargent avec `unsafe { Bundle::bytecode(bytes) }` (ou `Bundle::read_trusted(path)`, également unsafe) : le bytecode QuickJS est une entrée de confiance, donc
ne le chargez qu'à partir des fichiers de votre propre app. Une fenêtre autonome est `nsh_platform_windows::run_app(source, options)`, avec
`AppSource::Rust(root)` ou `AppSource::Bundle(bundle)`. `Root::tokens` donne à une racine son [thème](./rust.md#theme) et
`Root::app_id` l'identifiant sous lequel ses données sont conservées.

`AppOptions::cache` (ou `AppView::set_cache`, pour les apps chargées ensuite) définit l'emplacement où les apps conservent leurs caches, les
[images qu'elles téléchargent](./images-and-assets.md#kept-on-disk), et la taille maximale que chacune conserve (`CacheOptions` : par défaut, le
répertoire de cache du système et 256 Mio d'images).

`AppView::set_locale(Some(locale))` et `AppView::set_font_scale(Some(scale))` donnent à l'app la langue et la
taille de texte de votre app à la place de celles du système (`None` suit à nouveau celles du système) : `locale()`, `Intl`, `fontScale()` et le texte
suivent immédiatement ([Appareil et environnement](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` superpose l'identité visuelle de votre app au [thème](./tailwind.md#theme-tokens) de l'app : un fichier de thème
au format du `"theme"` de `nsh.json`, dont les tokens l'emportent sur ceux de l'app portant les mêmes noms en mode clair et sombre,
tandis que les autres tokens de l'app sont conservés ; les classes telles que `bg-primary` se restylent immédiatement, et les apps chargées plus tard démarrent avec lui
(`None` rend à l'app son propre thème ; un fichier qui ne peut pas être analysé est une erreur et ne change rien).

Les composants natifs sont enregistrés avec `AppView::register_component` ; voir
[Composants natifs](./native-components.md#registering-on-windows-rust). `set_ui_sets(sets)` définit les ensembles d'UI que
chaque moteur sert : ceux de NSH (`nsh_base::registry()`) et ceux de vos crates (`my_app::registry()`, que `#[native_module]`
produit), de sorte que le TSX chargé par une vue importe aussi vos composants et modules Rust.

<a id="what-differs-on-windows"></a>

## Ce qui diffère sous Windows

L'environnement est celui d'un desktop : la safe area et la hauteur du clavier valent 0, `idiom()` est le desktop
(`platform.idiom` vaut `"desktop"`) et `os_version()` (`platform.version`) vaut `"10.0"` (y compris sous Windows 11 : Windows a conservé le numéro de version). Le mode sombre
suit en direct Paramètres > Personnalisation > Couleurs, `fontScale()` le paramètre Taille du texte, la réduction des animations le paramètre
des effets d'animation et la locale le format régional de l'utilisateur. Voir [Appareil et environnement](./device-and-environment.md).

Le style `cursor` est mis à jour tant que la souris reste au-dessus d'une vue. Lorsqu'un lot de modifications change le curseur,
Windows applique la nouvelle forme ou `"none"` après la fin du lot, en utilisant la vue située sous le pointeur.
La barre de titre et les bordures de redimensionnement conservent leurs curseurs système.

<a id="keyboard"></a>

### Clavier

| Touches | Action |
|---|---|
| Return | Dans un `Input`, ce que dit `submitBehavior` : valider (`onSubmit`), valider et quitter le champ, ou insérer un saut de ligne (champs multilignes) |
| Shift+Return, Alt+Return | Un saut de ligne dans un champ multiligne dont Return valide (Ctrl+Return valide) |
| Tab, Shift+Tab | Le champ de texte suivant / précédent, au sein de la boîte de dialogue la plus récente ; le texte du champ est sélectionné, comme dans les boîtes de dialogue de Windows |
| Escape | Quitte le champ ayant le focus ; sinon efface une sélection de texte, puis ferme la boîte de dialogue la plus récente ou revient en arrière |
| Alt+Left, touche Précédent du navigateur, bouton Précédent de la souris | Revenir en arrière (y compris depuis un champ) |
| Ctrl+flèches, Home / End, Ctrl+Home / End, avec Shift ; Ctrl+Backspace / Delete | Se déplacer, sélectionner et supprimer par mot et par ligne dans un champ, comme dans toutes les apps Windows |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A ; Shift+Delete, Ctrl+Insert, Shift+Insert | Annuler, rétablir, couper, copier, coller, tout sélectionner (un champ `masked` refuse de couper et de copier) ; Ctrl+A / Ctrl+C sélectionnent et copient le texte sélectionnable |
| Flèches ; Page Up / Down, Space, Shift+Space ; Home / End, Ctrl+Home / End | Font défiler la scroll view autour de la vue ayant le focus ou sous la souris d'une ligne, d'une page, jusqu'au début / à la fin (pas lorsqu'un champ a le focus) |
| F11, Alt+F4 | Plein écran, fermer la fenêtre (apps `nsh package` et `nsh run`) |
| Ctrl+R, F5 | Recharger le dernier build (`nsh run`) |

Les raccourcis fonctionnent avec n'importe quelle disposition de clavier (sur une disposition cyrillique ou grecque, Ctrl+C correspond à la touche qui tape C sur une disposition US).
Un retour qui valide la composition d'une méthode de saisie (chinois, japonais, ...) ne valide jamais le champ. `onKeyPress` rapporte
ce que rapporte React Native : le texte saisi, `"Enter"`, `"Backspace"` et `"Escape"` ; le texte collé n'est pas rapporté.

Les raccourcis propres à l'app ([`keymap`](../modules/nsh.md#keymap)) sont prioritaires sur les touches d'un champ ayant le focus, la navigation
et le défilement ; Alt+F4, F11 et Ctrl+Q ne peuvent pas être liés.

Différent, ou non pris en charge :

- **`WebView`** : une page dans une vue avec une transformation 3D (perspective) n'est pas affichée, et un `backdropFilter` au-dessus d'une
  page ne la floute pas. `baseUrl` accepte les URL `http(s)`. Un composant natif qui apporte sa propre fenêtre
  reste au-dessus de tout ce que dessine NSH.
- **Vidéo** : les formats que décodent les codecs installés ; pas de poster ; la barre de contrôle s'affiche toujours avec `controls`.
- **Scroll views avec zoom** (`zoomTo`, les props de zoom) ; l'indicateur de défilement ne peut pas être glissé.
- **`mixBlendMode` et `backdropFilter`** sont dessinés, mais pas à l'intérieur d'une vue qui a un `filter` ou une transformation 3D ;
  `borderCurve: "continuous"` dessine des coins circulaires.
- **Texte** : les points de suspension en tête et au milieu uniquement sur une seule ligne (avec plus de lignes, ils sont placés à la fin) ; emoji en couleur provenant uniquement
  de polices COLR ; petites capitales uniquement lorsque la police les possède.
- **Champs de texte** : les types de clavier et l'autofill ne s'appliquent pas (il n'y a pas de clavier logiciel) ; Tab passe d'un champ
  de texte à l'autre. Un clic droit ouvre le menu d'édition (Annuler, Couper, Copier, Coller, Supprimer, Tout sélectionner), comme sur le texte sélectionnable (Copier,
  Tout sélectionner).
- **Accessibilité** (UI Automation) : les boîtes de dialogue d'alerte et les toasts ne sont pas exposés ; les titres signalent
  le niveau 1.
- **Input accessory views** et **status bar** (pas d'équivalent sur desktop).

<a id="see-also"></a>

## Voir aussi

- [CLI](./cli.md) : `nsh run --target windows`, `nsh package --target windows`
- [Empaquetage](./packaging.md)
- [Code spécifique à la plateforme](./platform-specific.md)
