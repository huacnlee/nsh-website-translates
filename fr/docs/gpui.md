---
title: "GPUI"
description: "Intégrez des applications NSH en Rust et TSX dans une application GPUI ou GPUI Kit avec AppView, dessinées par GPUI sur macOS, Windows et Linux, essayez des applications TSX dans l'hôte de développement GPUI, et découvrez ce que le backend GPUI fait différemment."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---

# GPUI

Le backend GPUI dessine les applications NSH avec [GPUI](https://gpui-kit.com) (GPUI Fast), le framework d'interface accéléré par GPU sur lequel repose GPUI Kit, sous macOS, Windows et Linux indifféremment. C'est le backend destiné à l'intégration dans les applications GPUI et GPUI Kit : un
`AppView` est une vue GPUI, si bien qu'une application GPUI ou GPUI Kit affiche des applications NSH, qu'il s'agisse d'une racine Rust qui lui est propre ou de TSX qu'elle charge, n'importe où
dans son propre arbre d'éléments. Les applications autonomes
sont exécutées et packagées avec le backend propre à chaque bureau : [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32)
et [Linux](./linux.md) (GTK). Le cœur, le graphe réactif, le moteur de rendu,
la mise en page Taffy et les modules natifs sont les mêmes que sur toutes les autres plateformes : une application s'exécute donc
partout. `os()` (`platform.os` en TSX) est l'OS sur lequel elle s'exécute (macOS, Windows ou Linux) et les props `desktop={{…}}`
de TSX s'appliquent.

Tous les éléments et modules des backends [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) et
[Linux](./linux.md) (GTK) sont disponibles ; là où GPUI dessine quelque chose à sa manière, [Différences](#differences)
explique comment.

<a id="how-it-works"></a>

## Fonctionnement

- **Un élément par surface.** Une surface est un élément GPUI qui occupe l'espace que lui donne son parent et peint
  tout l'arbre de vues avec les primitives de GPUI : quads, ombres, tracés, glyphes et images. NSH conserve une vue persistante par
  nœud, comme sous Windows, et ne redessine que lorsqu'un commit a modifié quelque chose.
- **Le texte est mis en forme sur le thread du moteur** avec le système de texte de GPUI (les polices propres à l'application), découpé en lignes par NSH ;
  le thread principal ne fait que peindre les glyphes.
- **Un seul saut par commit.** Le moteur s'exécute sur son propre thread ; chaque commit est une closure envoyée au thread principal de GPUI,
  qui notifie la vue.
- **Les entrées** proviennent des événements de souris, de défilement, de clavier et de méthode de saisie de GPUI ; le hit testing, les appuis, le système de responders,
  le défilement et l'édition de texte reposent sur la même logique que celle du backend Windows.

<a id="requirements"></a>

## Prérequis

- macOS, Windows ou Linux, avec un GPU sur lequel GPUI peut dessiner (Metal sous macOS, DirectX sous Windows, Vulkan sous Linux).
- Sous macOS, compiler votre application GPUI ou le runtime depuis un checkout nécessite la Metal Toolchain de Xcode (`xcodebuild -downloadComponent MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` compile
  le runtime avec la fonctionnalité `runtime-shaders` de GPUI et l'indique : les shaders sont compilés au démarrage de l'application (une fraction
  de seconde la première fois, puis mis en cache par macOS).
- Sous Linux : un pilote Vulkan, Wayland ou X11 avec `libxkbcommon`, GTK 3 et WebKitGTK 4.1 (vues web) et GStreamer
  1.20 ou ultérieur avec ses plug-ins base et good (vidéos). Les vues web nécessitent X11 : sur un bureau Wayland, exécutez l'application sous
  Xwayland (`WAYLAND_DISPLAY=` vide), sinon elles affichent un espace réservé. Compiler le runtime depuis un checkout nécessite aussi
  les paquets de développement ; sous Debian et Ubuntu :

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## Exécuter une application

Une application Rust s'exécute à l'intérieur de votre application GPUI : intégrez sa racine avec `AppView` ([Intégration dans une application GPUI](#embedding-in-a-gpui-app))
et `cargo run` l'application GPUI ; votre crate et l'application forment un seul build Cargo. Seule, une application Rust s'exécute avec le backend
propre à cet OS (`nsh run --target macos`, `windows` ou `linux`).

Une application TSX s'exécute dans l'hôte de développement GPUI :

```sh
nsh run App.tsx --target gpui
```

Il ouvre l'application dans une fenêtre GPUI (1200×800 par défaut), comme l'affiche une application GPUI qui l'intègre, avec rechargement à chaud, journaux dans
le terminal et superposition d'erreurs comme sur les autres cibles. L'hôte de développement (`nsh-gpui-host`) s'exécute sur place sur
tous les OS, sans bundle d'application autour. Depuis un checkout, `nsh run` le compile d'abord ; la distribution le fournit dans `runtime/gpui/`. L'hôte exécute aussi un bundle
compilé de manière autonome :

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` est la taille de la fenêtre en points (`<width>x<height>`).

## Packaging

Une application GPUI embarque NSH dans son propre exécutable : elle intègre la racine Rust ou le bundle TSX de l'application avec `AppView` ([Intégration dans une application
GPUI](#embedding-in-a-gpui-app)) et est compilée et distribuée comme l'application GPUI qu'elle est. Une application NSH autonome est packagée
avec la cible propre à cet OS : [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) ou
[`--target linux`](./linux.md#packaging) ([Packaging](./packaging.md)).

Sous Linux, une application GPUI avec des vues web et des vidéos lie WebKitGTK 4.1 et GStreamer dynamiquement ; les machines sur lesquelles elle s'exécute
doivent donc les avoir installés, avec GTK 3 et les plug-ins base et good de GStreamer (Debian / Ubuntu : `libwebkit2gtk-4.1-0`,
`libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), en plus d'un pilote Vulkan et de
`libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## Intégration dans une application GPUI

La crate `nsh-platform-gpui` (du dépôt NSH) fournit à une application GPUI en Rust `AppView` : un moteur NSH sous forme de vue
GPUI (`Entity<AppView>`), qui occupe l'espace que lui donne son élément parent. Chaque `AppView` est indépendant ; plusieurs
peuvent s'exécuter en même temps. Il exécute une racine Rust, le composant racine de votre crate :

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` donne à la racine son [thème](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`,
`Theme` est réexporté ici) et `Root::app_id` l'identifiant sous lequel ses données sont conservées. Un bundle TSX que `nsh build` a écrit
se charge dans la même vue :

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

Placez l'entité dans votre arbre d'éléments comme n'importe quelle autre vue (un `Root` GPUI Kit, un panneau, un dock). `AppView::load`
remplace ce qui s'exécutait ; `stop` (ou la destruction de la vue) met fin à l'application. `AppOptions::asset_base` indique où les URI `asset:/`
sont résolues (`AssetBase::Directory` ou `AssetBase::Http`). Les bundles de bytecode (`bundle.nshc`) se chargent avec
`unsafe { Bundle::bytecode(bytes) }` (ou `Bundle::read_trusted(path)`, également unsafe) : le bytecode QuickJS est une entrée de confiance,
ne le chargez donc qu'à partir des fichiers de votre propre application.

- `open_app_window(source, options, cx)` ouvre une fenêtre avec un `AppView` dans une application GPUI en cours d'exécution.
- `run_app(source, options)` démarre GPUI et exécute une application dans une fenêtre jusqu'à sa fermeture (ce que fait l'hôte de développement).
- `AppView::register_component(name, factory)` enregistre un composant natif de votre cru avant le chargement
  ([Composants natifs](./native-components.md)).
- `AppOptions::cache` (ou `AppView::set_cache`, pour les applications chargées ensuite) définit où les applications conservent leurs caches, les
  [images qu'elles téléchargent](./images-and-assets.md#kept-on-disk), et la taille que chacune conserve : `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB),
  `MaxSize(ByteSize::mib(n))` ou `Off`.
- `AppView::host()` est le canal de la vue avec les applications qu'elle exécute ([`host`](../modules/nsh.md#host)), un
  `HostChannel` que n'importe quel thread peut utiliser : `set_params(map)` avant le chargement donne à l'application ses paramètres de lancement
  (`host.params`), `send(name, data)` un événement (`host.on`), et `handle(name, |call| …)` répond à ses
  `host.call(name, data)` et écoute ses `host.post` (`call.resolve(json)`, `call.reject(message)`, immédiatement ou plus tard
  depuis n'importe quel thread). Les gestionnaires s'exécutent sur le thread du moteur : transmettez l'appel à vos entités GPUI (un canal lu par une
  tâche `cx.spawn`) et répondez à partir de là. Les `AppView` de macOS, Windows et Linux ont le même `host()`.
  Son `handle_open_url(|request| …)` voit les URL que l'application ouvre ([`openUrl`](../modules/nsh.md#openurl))
  avant le système : `request.handled()` lorsque votre application a routé elle-même l'URL, `request.decline()` (ou l'abandon
  de la requête) pour que le système l'ouvre avec le `open_url` de GPUI.
- `AppOptions::limits` (ou `AppView::set_limits`, pour les applications chargées ensuite) définit les limites de la VM : le tas JS, la
  pile, les budgets de temps et le quota de nœuds ([Sandbox et capacités](./sandbox-and-capabilities.md)). Les applications intégrées reçoivent `Limits::default()` (un
  tas de 256 Mo) ; l'hôte de développement exécute les applications de son côté, avec `Limits::standalone()`.
- `AppOptions::transparent` rend la vue transparente : elle ne dessine aucun arrière-plan de fenêtre, et `open_app_window` /
  `run_app` ouvrent une fenêtre transparente, de sorte que ce que l'application laisse non peint laisse voir ce qui se trouve derrière la fenêtre (widgets de
  bureau, superpositions). Faux par défaut.
- `AppView::connect_dev_server(url, cx)` (fonctionnalité `dev`) charge l'application depuis `nsh dev` et la recharge au fil de vos modifications,
  avec la superposition d'erreurs au-dessus de la vue ; `AppView::on_error` continue d'écouter les erreurs de l'application.
- `AppView::on_app_error(|error| …)` écoute les erreurs de l'application : `error.kind` (l'application n'a pas pu se charger, une
  exception non interceptée, la VM s'est arrêtée), `error.is_fatal()` lorsque plus aucun JS de l'application ne s'exécute, `error.message`, `error.stack`
  et `error.package` (l'identifiant et le build du package signé dont elle provient). `AppView::on_error` reçoit les mêmes
  erreurs sous forme de texte.
- `AppView::set_locale(locale, cx)` et `AppView::set_font_scale(scale, cx)` donnent à l'application la langue et la
  taille de texte de votre application à la place de celles du système (`None` suit de nouveau celles du système) : `locale()`, `Intl`, `fontScale()` et le texte
  suivent immédiatement ([Appareil et environnement](./device-and-environment.md#in-an-embedding-app)).
- `AppView::run_package(&package)` exécute un [package signé](./signed-packages.md#loading-packages-in-a-host-app)
  depuis `verify_package` ou `load_package` ; `accept_package` l'enregistre une fois que votre application a décidé qu'il est sain.
- `set_ui_sets(sets)` définit les ensembles d'UI que chaque moteur sert : ceux de NSH (`nsh_base::registry()`) et ceux de vos crates
  (`my_app::registry()`, que `#[native_module]` produit ; [Développer avec Rust](./rust.md)), et fournit les ensembles propres à votre application : une application accède par leur nom aux fonctions et classes de l'un d'eux avec
  [`nativeModule`](../modules/nsh.md#nativemodule) et est compilée avec le `nsh build` standard. Le
  `examples/embed-gpui` du dépôt héberge ainsi une salle de marché dans l'hôte, que deux tickets d'ordre intégrés et les widgets
  propres à l'hôte partagent.

<a id="differences"></a>

## Différences

Ce qui se dessine ou se comporte différemment par rapport aux backends de bureau natifs :

- **Transformations** : les vues pivotées, inclinées et projetées transforment leurs arrière-plans, bordures et ombres, mais le texte reste
  droit, et les images, vidéos et canvas se dessinent à leurs limites.
- **L'opacité** s'applique à chaque couleur plutôt qu'à un groupe : les enfants qui se chevauchent dans une vue translucide se voient
  donc à travers l'un l'autre ; l'opacité d'une image (un fondu d'entrée, une vue translucide) varie par seizièmes.
- **Les découpes arrondies** (`overflow: "hidden"` avec un rayon) arrondissent les arrière-plans et les images des enfants, mais le texte,
  les bordures, les vidéos et les composants natifs sont coupés par le rectangle.
- **Non dessinés** : `filter: blur()`, `backdropFilter` et `mixBlendMode` ; les ombres transparaissent à travers les remplissages translucides ;
  `borderCurve: "continuous"` dessine des coins circulaires.
- **Le texte de canvas** est approximé : droit sous les rotations, rendu plus petit plutôt que plus étroit pour `maxWidth`,
  les dégradés le peignent d'une seule couleur, `strokeText` remplit, ses ombres ne sont pas floutées, et les opérations de composition et
  `clearRect` ne s'y appliquent pas.
- **Les vues à défilement** ne gèrent pas le zoom (`zoomTo` et les props de zoom sont ignorées).
- **La vidéo** est lue sous Linux (GStreamer) ; sous macOS et Windows, une vidéo affiche un espace réservé et signale `onError`.
- **Les vues web** sont des vues natives au-dessus de tout ce que NSH dessine à leur emplacement. Sous Linux, elles nécessitent X11 (voir
  [Prérequis](#requirements)) ; si les pages restent noires sous Xwayland (« Failed to create GBM buffer » dans le journal),
  exécutez l'application avec `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Sous macOS et Windows, les ancêtres qui découpent ne les coupent pas et
  les chargements échoués ne signalent aucun `onError`. `baseUrl`, `scrollable` et `allowsBackForwardNavigationGestures` ne sont
  pas pris en charge.
- **L'accessibilité** passe par AccessKit : les lecteurs d'écran peuvent activer des éléments, leur donner le focus, définir des valeurs et les faire défiler
  jusqu'à les rendre visibles, partout ; les actions personnalisées et l'action de menu contextuel ne sont pas encore transmises.

À titre de comparaison, la liste propre à chaque backend natif : [macOS](./macos.md#what-differs-on-macos),
[Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## Voir aussi

- [Développer avec Rust](./rust.md) : la crate dont une application GPUI intègre la racine
- [CLI](./cli.md) : `nsh run --target gpui`
- [Packaging](./packaging.md) : applications autonomes, avec la cible propre à chaque OS
- [Vue d'ensemble des plateformes](./platforms.md)
