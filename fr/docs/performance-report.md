---
title: "Rapport de performance"
description: "Mesures des applications NSH : coûts de commit et de frame issus des baselines de NSH, ainsi que la fréquence d'images, l'utilisation du CPU et de la mémoire de la galerie, page par page, sous Linux, macOS, Windows et iOS, avec la méthode pour les reproduire."
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---

# Rapport de performance

Ce que coûtent les apps NSH, mesuré. Pour savoir comment NSH les garde rapides et comment mesurer votre propre app, consultez [Performance](./performance.md).

<a id="baselines"></a>

## Valeurs de référence

Issues des mesures de référence de NSH (Apple silicon, sauf mention contraire) :

| Scénario | Mesures |
|---|---|
| App compteur, headless (debug) | Première frame ~0,5–0,65 ms (58 ops / 49 mount items) ; un tap ~0,15 ms |
| App compteur, Mac Catalyst (release) | Première frame ~1,05–1,15 ms (dont environ 0,7 ms pour mettre en page 10 textes avec CoreText pour la première fois) ; un tap ~0,12 ms |
| Liste de photos de la galerie, headless (debug) | Première frame 653 ops / 224 nodes, ~2,7 ms |
| Défilement de la liste de photos, Catalyst (release) | Re-liaison d'une ligne pendant un défilement lent ~0,4 ms ; un écran entier d'environ 32 lignes lors d'un fling rapide 0,9–1,6 ms |
| Défilement de la liste de photos, émulateur Android (arm64, release) | Re-liaison d'une ligne ~0,3–0,4 ms (JS ~60 µs) |
| Démarrage du moteur (release) | ~75–155 µs ; les API globales (`fetch`, `URL`, ...) ne coûtent rien jusqu'à leur première utilisation, puis ~90 µs |
| Hot reload | ~120 ms entre l'enregistrement d'un fichier et l'exécution de la nouvelle version ; application de la mise à jour 0,2–0,5 ms |

## Linux (GTK 4)

Mesuré sur un poste Linux (x86_64, 24 threads, GPU NVIDIA), en builds release, avec la galerie dans une fenêtre de 1896 × 1030 sur un écran 120 Hz, chaque relevé étant pris automatiquement par `examples/gallery/tools/perf.py` (`nsh test --target linux --fps`,
une ligne par seconde ; le CPU est celui du processus entier, en pourcentage d'un cœur). *Frame p95* est le temps du thread principal par frame dessinée au 95e centile : sous 8,3 ms, une frame tient dans un rafraîchissement à 120 Hz.

<a id="animated-demos"></a>

### Démos animées

<div class="data-table">

| Démo | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks : 22 sparklines en direct, un graphique intrajournalier, un carnet d'ordres, un ticker | 117–120 | 5–6 ms | 25–29 % (1200 × 800), 28–32 % (1896 × 1030) |
| Stocks, la fenêtre remplissant un écran 4K 144 Hz à 1,6× | 143–145 | 4,1–4,4 ms | 26–29 % |
| Canvas : une jauge, une horloge, une matrice de points | 120 | 2,6–4,4 ms | 5–10 % |
| Animations : trois boucles natives, des springs, des séquences | 120 | 2,0 ms | 12–13 % |

</div>

<a id="every-page"></a>

### Chaque page

Chaque page de la galerie, à son ouverture et pendant que le test la fait défiler, dans une fenêtre de 1200 × 800 sur un écran 144 Hz (la
même machine). NSH ne dessine une frame que lorsque quelque chose change à l'écran ; *FPS* désigne donc ici la cadence pendant qu'un élément bouge :
une frame par écart médian entre les frames dessinées (`perf.py`, `moving`) ; à 144 Hz, chaque frame d'une
animation ou d'un défilement arrive un rafraîchissement après la précédente. *Au-delà d'un rafraîchissement* est la part des frames qui ont pris plus
longtemps qu'un rafraîchissement (6,9 ms). Les GIF et WebP d'Images sont lus à leur propre cadence (environ 50 FPS ici), de même que la vidéo. Physics, Overlays et Menus sont courtes : dans une fenêtre de 1200 × 800, un défilement atteint leur fin en quelques frames ; elles sont donc mesurées dans une fenêtre de 900 × 500, où elles ont de la place pour défiler.

<div class="data-table">

| Page | Origine des frames | FPS | Frame p95 | Au-delà d'un rafraîchissement | CPU |
|---|---|---|---|---|---|
| Stocks | Données en direct, boucles natives | 144 | 4,1 ms | 0 % | 26 % |
| Stocks, défilement | Données en direct, défilement | 144 | 4,1 ms | 0 % | 25 % |
| Photos, défilement | Défilement | 144 | 2,8 ms | 2 % | 9 % |
| Lists, défilement | Défilement | 143 | 1,7 ms | 0 % | 7 % |
| Scrolling, défilement | Défilement | 144 | 1,6 ms | 1 % | 4 % |
| Navigation, défilement | Défilement | 143 | 1,7 ms | 0 % | 2 % |
| Form, défilement | Défilement | 144 | 1,3 ms | 0 % | 4 % |
| Resizable, défilement | Défilement | 143 | 0,6 ms | 0 % | 1 % |
| Dock, défilement | Défilement | 142 | 0,5 ms | 1 % | 1 % |
| Gestures | Springs, un anneau pulsant | 144 | 1,6 ms | 0 % | 1–5 % |
| Physics, défilement | Défilement (fenêtre de 900 × 500) | 144 | 1,6 ms | 1 % | 1 % |
| Animations | Boucles natives | 144 | 2,6 ms | 0–1 % | 5 % |
| Canvas, défilement | Défilement, boucles natives | 144 | 4,2 ms | 0 % | 1–4 % |
| Styles, défilement | Défilement | 144 | 2,3 ms | 2 % | 3 % |
| Tailwind | Utilitaires `animate-*` | 144 | 1,7 ms | 0 % | 3–8 % |
| Text, défilement | Défilement | 144 | 1,9 ms | 0 % | 4 % |
| Text View, défilement | Défilement | 141 | 1,8 ms | 2 % | 7 % |
| Images, défilement | Défilement, frames GIF et WebP | 143 | 2,9 ms | 2 % | 8 % |
| Components, défilement | Défilement | 144 | 1,4 ms | 0 % | 3 % |
| Overlays, défilement | Défilement (fenêtre de 900 × 500) | 144 | 1,7 ms | 0 % | 2 % |
| Menus, défilement | Défilement (fenêtre de 900 × 500) | 144 | 1,9 ms | 0 % | 2 % |
| Controls | Transitions | 144 | 0,9 ms | 0 % | 1–4 % |
| Web et vidéo | Frames vidéo, la page | 135–142 | 1,0 ms | 0 % | 7–8 % |

</div>

<a id="memory"></a>

### Mémoire

Au repos, 3 s après le démarrage (runners release, fenêtre de 480 × 640). *Private* est la mémoire que le processus possède à lui seul (USS) ;
*resident* y ajoute les pages des bibliothèques partagées (GTK, le pilote GPU), que toutes les apps GTK de la machine partagent :

<div class="data-table">

| App | Moteur de rendu | Private (USS) | Resident (RSS) |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | GL (`ngl`) | ~49 Mo | ~142 Mo |
| App Rust | Cairo (`GSK_RENDERER=cairo`) | ~28 Mo | ~95 Mo |
| Compteur TSX (`examples/counter`) | GL | ~79 Mo | ~166 Mo |
| Fenêtre GTK 4 avec un seul label, à titre de référence | Vulkan / Cairo | ~62 / ~40 Mo | ~132 / ~109 Mo |

</div>

Revisiter une page n'ajoute aucune mémoire ; la première visite d'une page fait croître le processus de ce qu'il met volontairement en cache (images décodées,
plafonnées à 128 Mo) et des bibliothèques qu'il charge à la première utilisation (WebKitGTK pour les web views).

<a id="app-size"></a>

### Taille des apps

Une app hello world créée par `nsh init` avec chaque template, et deux apps utilisées au quotidien, telles que `nsh package --target linux`
les construit pour x86_64. Le runner est l'unique exécutable de l'app ; l'archive est le `.tar.gz` sous lequel elle est distribuée. Les hello
worlds sont construits avec l'optimisation à l'édition de liens (link-time optimization) et strippés (`CARGO_PROFILE_RELEASE_LTO=fat`,
`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`) :

<div class="data-table">

| App | Écrit en | Runner | Archive |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 16,5 Mo | 7,5 Mo |
| Hello world (`--template ts`) | TSX, sur QuickJS | 25,7 Mo | 11,6 Mo |
| Hello world (`--template mixed`) | TSX et un crate Rust | 25,8 Mo | 11,7 Mo |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20,9 Mo strippé | 9,7 Mo |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22,3 Mo | 9,8 Mo |

</div>

Les runners TSX contiennent le runtime QuickJS, les modules natifs et le moteur de rendu ; le code propre à une app est son bundle, placé à côté
du runner, de moins de 1 Ko pour un hello world.

Ce qui produit ces chiffres :

- **Le moteur de rendu** : avec le pilote de NVIDIA, NSH dessine avec le moteur de rendu GL de GSK, dont les frames coûtent une fraction de celles du moteur de rendu
  Vulkan dans ce cas (la démo Animations : ~1 ms de dessin par frame au lieu de ~9,5 ms). `GSK_RENDERER` garde toutefois la main sur le choix.
- **Rasterisation des canvas** : chaque canvas est rasterisé une seule fois en tuiles de 256 px conservées sur le GPU. Une valeur animée ne redessine que
  la zone couverte par les opérations qui la lisent, par-dessus les pixels conservés de la partie statique du dessin ; un canvas hors de vue
  attend d'entrer dans la zone visible par défilement.
- **Chemins mis de côté une seule fois** : `fillRect` et `fillText` après un long chemin le laissent en place jusqu'à sa prochaine utilisation (une
  ligne de 400 points puis 240 barres : 0,63 ms).

## macOS (AppKit)

Mesuré sur un MacBook Pro (Apple M3, 24 Go) avec son écran ProMotion 120 Hz intégré, en builds release, avec la galerie dans
une fenêtre de 1200 × 800, chaque relevé étant pris automatiquement par `examples/gallery/tools/perf.py` (`nsh test --target macos
--fps`, une ligne par seconde ; le CPU est celui du processus entier, en pourcentage d'un cœur, et le GPU sa part du GPU). Les phases sont
celles du thread principal par frame : *tick* (les animations natives du display link) et *canvas* (la relecture des dessins).

<a id="animated-demos-1"></a>

### Démos animées

<div class="data-table">

| Démo | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks : 22 sparklines en direct, un graphique intrajournalier, un carnet d'ordres, un ticker | 120 | 2,7–3,7 ms | 33–36 % | 18–22 % |
| Canvas : une jauge, une horloge, une matrice de points | 119–120 | 0,6–0,7 ms | 4–7 % | 0 % |
| Animations : trois boucles natives, des springs, des séquences | 119–120 | 0,3–1,6 ms | 5–8 % | 0 % |

</div>

Sur Stocks, le temps du thread principal par frame est d'environ 1,6 ms de ticks, dont ~0,45 ms pour rejouer les parties animées des canvas ;
Core Animation dessine le reste de chaque canvas sur ses propres threads.

<a id="every-page-1"></a>

### Chaque page

Chaque page de la galerie, à son ouverture et pendant que le test la fait défiler, dans la même fenêtre de 1200 × 800. Comme sur Linux, *FPS*
désigne la cadence pendant qu'un élément bouge (une frame par écart médian entre les frames dessinées) ; à 120 Hz, chaque frame
d'une animation ou d'un défilement arrive un rafraîchissement après la précédente. *Au-delà d'un rafraîchissement* est la part des frames qui ont pris
plus longtemps qu'un rafraîchissement (8,3 ms). Une page au repos ne dessine aucune frame et utilise 2–5 % de CPU. Les GIF et WebP d'Images sont lus dans Core
Animation et la vidéo dans AVFoundation, à leur propre cadence.

<div class="data-table">

| Page | Origine des frames | FPS | Frame p95 | Au-delà d'un rafraîchissement | CPU |
|---|---|---|---|---|---|
| Stocks | Données en direct, boucles natives | 120 | 3,2 ms | 0 % | 35 % |
| Stocks, défilement | Données en direct, défilement | 120 | 3,5 ms | 0 % | 36 % |
| AI Chat, défilement | Défilement | 120 | 2,4 ms | 1 % | 5 % |
| Photos, défilement | Défilement | 120 | 1,4 ms | 0 % | 10 % |
| Lists, défilement | Défilement | 120 | 1,6 ms | 0 % | 8 % |
| Scrolling, défilement | Défilement | 120 | 2,7 ms | 0 % | 6 % |
| Navigation, défilement | Défilement | 120 | 0,2 ms | 0 % | 4 % |
| Form, défilement | Défilement | 120 | 0,6 ms | 0 % | 5 % |
| Resizable, défilement | Défilement | 120 | 0,3 ms | 0 % | 4 % |
| Dock, défilement | Défilement | 120 | 0,3 ms | 1 % | 5 % |
| Gestures | Springs, un anneau pulsant | 120 | 0,4 ms | 0 % | 4 % |
| Physics, défilement | Défilement | 120 | 0,3 ms | 0 % | 4 % |
| Animations | Boucles natives | 120 | 0,3 ms | 0 % | 5 % |
| Canvas, défilement | Défilement, boucles natives | 120 | 1,2 ms | 0 % | 7 % |
| Styles, défilement | Défilement, une transformation oscillante | 120 | 1,0 ms | 0 % | 6 % |
| Tailwind | Utilitaires `animate-*` | 120 | 0,5 ms | 0 % | 4 % |
| Text, défilement | Défilement | 120 | 0,3 ms | 0 % | 5 % |
| Text View, défilement | Défilement | 120 | 0,7 ms | 0 % | 5 % |
| Images, défilement | Défilement | 120 | 0,4 ms | 0 % | 5 % |
| Components, défilement | Défilement | 120 | 0,3 ms | 0 % | 5 % |
| Overlays, défilement | Défilement | 120 | 0,3 ms | 0 % | 4 % |
| Menus, défilement | Défilement | 120 | 0,3 ms | 0 % | 5 % |
| Controls | Transitions | 120 | 0,3 ms | 0 % | 4 % |
| Web et vidéo, défilement | Défilement | 120 | 0,2 ms | 0 % | 6 % |
| System | `requestAnimationFrame`, timers | 120 | 0,2 ms | 0 % | 3 % |
| Standard APIs, défilement | Défilement | 120 | 0,3 ms | 0 % | 5 % |
| Storage, défilement | Défilement | 120 | 0,3 ms | 0 % | 5 % |

</div>

<a id="memory-1"></a>

### Mémoire

Au repos, 3 s après le démarrage (runners release). *Footprint* est la mémoire que macOS impute au processus (ce qu'affiche Activity
Monitor) ; *resident* y ajoute les pages des bibliothèques partagées du système :

<div class="data-table">

| App | Fenêtre | Footprint | Resident (RSS) |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | 1200 × 800 | ~19 Mo | ~86 Mo |
| Compteur TSX (`examples/counter`) | 1200 × 800 | ~20 Mo | ~89 Mo |
| Fenêtre AppKit avec un seul label, à titre de référence | 480 × 640 | ~17 Mo | ~80 Mo |

</div>

Au fil de la visite de la galerie, le processus occupe 84–230 Mo jusqu'à la page Canvas, puis ~350–360 Mo à partir de la page Text View,
avec ce qu'il met volontairement en cache (images décodées, plafonnées à 128 Mo ; les documents de la page Text View) et les
frameworks qu'il charge à la première utilisation (WebKit pour les web views) ; les rasters de la page Canvas, jusqu'à ~310 Mo avec les trois
canvas à l'écran, sont libérés à la fermeture de la page.
<a id="app-size-1"></a>

### Taille des applications

Les applications hello world créées par `nsh init` avec chaque modèle, telles que `nsh package --target macos` les construit pour Apple
silicon (arm64), avec l'optimisation à l'édition de liens (LTO) et sans symboles comme sous Linux, ainsi que les deux applications ci-dessus telles qu'elles sont livrées pour Apple
silicon. L'exécutable est le runner à l'intérieur de `.app` ; le zip est `.app` compressé (`ditto -c -k`) :

<div class="data-table">

| Application | Écrite en | Exécutable | Zippé `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12,4 Mo | 6,0 Mo |
| Hello world (`--template ts`) | TSX, sur QuickJS | 19,8 Mo | 9,5 Mo |
| Hello world (`--template mixed`) | TSX et une crate Rust | 19,8 Mo | 9,5 Mo |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21,6 Mo | 8,4 Mo (`.tar.gz` de sa release) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18,4 Mo | 9,7 Mo (`.tar.gz` de sa release) |

</div>

Ce qui explique ces chiffres :

- **Des frames uniquement pour les changements** : le display link se déclenche tant qu'une animation native s'exécute et s'arrête avec elle ; une animation
  s'arrête avec sa page (la suppression de sa vue met fin à ses keyframes, une boucle s'arrête dans le `cleanup` de son composant).
- **Des canvas dessinés là où ils coûtent le moins** : un canvas qui se repeint souvent (une animation, des données en direct) dessine sur les threads de Core
  Animation (`drawsAsynchronously`), ce qui laisse le thread principal libre ; un canvas redessiné de temps en temps dessine
  immédiatement, sans la mémoire graphique que retient le dessin asynchrone. Une valeur animée ne redessine que la zone que couvrent les
  opérations qui la lisent.
- **Parties statiques du canvas conservées** : dès qu'un dessin reste inchangé, une longue partie située avant sa première opération animée est
  conservée sous forme de calque ; chaque frame dessine ce calque et ne rejoue que le reste animé, immédiatement sur le thread principal (la
  jauge, l'horloge et la matrice de points de la page Canvas : aucun travail GPU et moitié moins de mémoire).
- **Contenu dessiné quand il change** : les textes et les canvas se dessinent dans des calques qui leur sont propres, de nouveau quand leur contenu ou leur
  taille change, et non quand ils se déplacent ou défilent.

## Windows (Win32, Direct2D)

Mesures effectuées sur un ordinateur de bureau Windows 11 (Intel Core i7-13700KF, 32 Go, NVIDIA GeForce RTX 3060 Ti) avec un écran 4K 144 Hz à
150 %, en builds release, la galerie dans une fenêtre de 1200 × 800 (1800 × 1200 pixels), chaque relevé étant pris automatiquement par
`examples/gallery/tools/perf.py` (`nsh test --target windows --fps`, une ligne par seconde ; le CPU est celui du processus entier, en
pourcentage d'un cœur). Les phases sont celles du thread principal par frame : *paint* (Direct2D dessinant la fenêtre) et, à
l'intérieur, *canvas* (enregistrement et rejeu des dessins).

<a id="animated-demos-2"></a>

### Démos animées

<div class="data-table">

| Démo | FPS | Frame p95 | Paint / canvas par frame | CPU |
|---|---|---|---|---|
| Stocks : 22 sparklines en direct, un graphique intraday, un carnet d'ordres, un ticker | 144 | 3,7–4,3 ms | 1,4 / 0,13 ms | 36–43 % |
| Canvas : une jauge, une horloge, une matrice de points | 144 | 1,0–2,0 ms | 0,8–1,4 / 0,05 ms | 21–35 % |
| Animations : trois boucles natives, ressorts, séquences | 144 | 1,0–3,6 ms | 0,9–1,9 ms | 20–41 % |

</div>

Stocks effectue 16 à 17 commits par seconde, chacun en 2,1 ms de JS au plus et 1,7 ms du cœur sur le thread du moteur (p95).

> [!NOTE]
> Les pages dont les animations déplacent des vues sur de grandes zones consomment plus de CPU ici que sous Linux et macOS (Animations 20–41 %
> contre 5–13 %, Gestures 36 % contre 1–5 %). Une frame Windows redessine, avec Direct2D sur le thread principal, chaque vue
> sur les zones qui ont changé : un anneau qui grandit redessine la carte située dessous à chaque frame. Sous macOS, Core Animation
> déplace, redimensionne et fait apparaître en fondu sur le GPU les calques qu'il conserve, sans les redessiner, et sous Linux GSK conserve les
> render nodes de ce qui n'a pas changé. Les chiffres comptent aussi 144 frames par seconde à 1800 × 1200 pixels.

<a id="every-page-2"></a>

### Chaque page

Chaque page de la galerie, à son ouverture et pendant que le test la fait défiler, dans la même fenêtre de 1200 × 800. Comme sous Linux et
macOS, *FPS* est la cadence pendant qu'un élément bouge (une frame par écart médian entre les frames dessinées) ; à 144 Hz, celle de l'écran,
chaque frame d'une animation ou d'un défilement arrive un rafraîchissement après la précédente. *Au-delà d'un rafraîchissement* est la part des frames
qui ont pris plus longtemps qu'un rafraîchissement (6,9 ms). Une page au repos ne dessine aucune frame et utilise 0 à 2 % de CPU. Les GIF et WebP de la page Images sont lus
à leur propre cadence (environ 40 FPS ici). Physics, Overlays, Menus et Storage sont mesurées dans une fenêtre de 900 × 500,
où elles ont de la place pour défiler.

<div class="data-table">

| Page | Origine des frames | FPS | Frame p95 | Au-delà d'un rafraîchissement | CPU |
|---|---|---|---|---|---|
| Stocks | Données en direct, boucles natives | 144 | 3,9 ms | 0 % | 36 % |
| Stocks, défilement | Données en direct, défilement | 144 | 4,3 ms | 0 % | 43 % |
| Photos, défilement | Défilement | 143 | 2,1 ms | 0 % | 9 % |
| Lists, défilement | Défilement | 144 | 2,0 ms | 1 % | 19 % |
| Scrolling, défilement | Défilement | 143 | 2,1 ms | 0 % | 7 % |
| Navigation, défilement | Défilement | 144 | 0,8 ms | 0 % | 9 % |
| Form, défilement | Défilement | 144 | 0,8 ms | 0 % | 12 % |
| Resizable, défilement | Défilement | 143 | 0,4 ms | 0 % | 4 % |
| Dock, défilement | Défilement | 144 | 0,5 ms | 1 % | 5 % |
| Gestures | Ressorts, un anneau pulsant | 144 | 1,8 ms | 0 % | 36 % |
| Physics, défilement | Défilement (fenêtre de 900 × 500) | 144 | 0,8 ms | 0 % | 4 % |
| Animations | Boucles natives | 144 | 1,0 ms | 0 % | 28 % |
| Canvas, défilement | Défilement, boucles natives | 144 | 2,0 ms | 0 % | 35 % |
| Styles, défilement | Défilement, une transformation oscillante | 144 | 2,1 ms | 0 % | 39 % |
| Tailwind | Utilitaires `animate-*` | 144 | 0,6 ms | 0 % | 19 % |
| Text, défilement | Défilement | 144 | 1,6 ms | 0 % | 8 % |
| Text View, défilement | Défilement | 144 | 1,1 ms | 0 % | 10 % |
| Images, défilement | Défilement, frames GIF et WebP | 143 | 4,8 ms | 2 % | 23 % |
| Components, défilement | Défilement | 144 | 1,0 ms | 1 % | 11 % |
| Overlays, défilement | Défilement (fenêtre de 900 × 500) | 144 | 0,6 ms | 0 % | 1 % |
| Menus, défilement | Défilement (fenêtre de 900 × 500) | 144 | 0,6 ms | 0 % | 2 % |
| Controls | Transitions | 117–144 | 1,5 ms | 0 % | 22 % |
| Web and video, défilement | Défilement | 144 | 1,6 ms | 0 % | 15 % |
| System | `requestAnimationFrame`, minuteurs | 144 | < 0,1 ms | 0 % | 1 % |
| Storage, défilement | Défilement (fenêtre de 900 × 500) | 144 | 0,5 ms | 0 % | 1 % |

</div>

<a id="memory-2"></a>

### Mémoire

Au repos, 3 s après le démarrage (runners release, fenêtre de 1200 × 800). Le *working set privé* est la mémoire que le processus
utilise à lui seul (colonne Mémoire du Gestionnaire des tâches) ; les *octets privés* ce qu'il a validé (committed) ; le *working set* ajoute les pages des
bibliothèques système qu'il partage avec d'autres processus (Direct3D, Direct2D, DirectWrite, le pilote GPU) :

<div class="data-table">

| Application | Working set privé | Octets privés | Working set |
|---|---|---|---|
| Application Rust (`nsh init --template rust`) | ~14 Mo | ~60 Mo | ~53–71 Mo |
| Compteur TSX (`examples/counter`) | ~15 Mo | ~61 Mo | ~56–71 Mo |

</div>

Au fil du parcours de la galerie, le working set atteint ~108–115 Mo sur Stocks, ~230 Mo à partir de la page Canvas, ~320–340 Mo à partir de la
page Text View et ~390–405 Mo une fois que Web and video a ouvert WebView2 (dont les pages s'exécutent dans les processus propres à WebView2),
avec ce qu'elle met en cache volontairement (images décodées, plafonnées à 128 Mo ; les documents de la page Text View).

<a id="app-size-2"></a>

### Taille des applications

Les applications hello world créées par `nsh init` avec chaque modèle, telles que `nsh package --target windows` les construit pour x86_64
(les runners Rust avec optimisation à l'édition de liens et sans symboles, comme sous Linux). L'exécutable est `<Name>.exe` de l'application ;
le zip est `.zip` écrit à côté de son répertoire :

<div class="data-table">

| Application | Écrite en | Exécutable | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15,0 Mo | 6,7 Mo |
| Hello world (`--template ts`) | TSX, sur QuickJS | 28,6 Mo | 12,4 Mo |
| Hello world (`--template mixed`) | TSX et une crate Rust | 26,3 Mo | 11,5 Mo |

</div>

Ce qui explique ces chiffres :

- **Des frames uniquement pour les changements, dessinées uniquement là où ils ont eu lieu** : le ticker cadencé par le compositeur tourne tant qu'une animation
  native, une transition ou un callback de frame s'exécute. Une frame dessine les zones des vues qui ont changé (là où elles
  étaient et là où elles sont), sur les pixels que la fenêtre conserve, et ne présente qu'elles au compositeur (Stocks :
  ~34 vues par frame).
- **Les canvas enregistrent leur partie animée** : un dessin est enregistré sous forme de listes de commandes Direct2D, vectorielles et nettes à toute
  échelle. Quand une valeur animée change, seules les opérations à partir de la première qui lit une valeur animée sont
  enregistrées de nouveau ; ce qui précède est conservé (Stocks : ~26 ms d'enregistrement par seconde pour 22 sparklines pulsantes et le
  graphique).
- **Seul ce qui est visible est dessiné** : les enfants d'une vue à défilement ou d'une vue avec découpage (clipping) qui se trouvent hors de vue sont exclus de
  la frame, et les vues sans contenu propre ne dessinent pas plus que leur arrière-plan et leur bordure.

## iOS (UIKit)

Mesures effectuées dans le simulateur iOS (un iPhone 18 Pro Max, sur le MacBook Pro ci-dessus), en builds release, avec le même parcours
(`perf.py --target ios` : `nsh test --target ios --fps`, les touches d'un doigt telles que UIKit les reçoit). Le simulateur présente
à 60 Hz ; sur un iPhone avec un écran ProMotion, les display links de NSH tournent à 120 Hz, la fréquence de l'écran (les applications que `nsh package`
construit et l'hôte de développement la demandent avec `CADisableMinimumFrameDurationOnPhone`). Les phases sont *tick* (animations
natives), *drain* (application des lots du moteur) et *scroll* (ce qui suit une vue à défilement : listes, cellules sticky,
valeurs liées).

<div class="data-table">

| Page | Origine des frames | FPS | Frame p95 | CPU |
|---|---|---|---|---|
| Home, défilement | Défilement | 60 | 0,1 ms | 6 % |
| Stocks | Données en direct, boucles natives | 60 | 0,3 ms | 22 % |
| Stocks, défilement | Données en direct, défilement | 60 | 0,3 ms | 25 % |
| Photos, défilement | Défilement | 60 | 1,2 ms | 6 % |
| Lists, défilement | Défilement | 60 | 1,1 ms | 8 % |
| Scrolling, défilement | Défilement | 60 | 0,1 ms | 7 % |
| Navigation, défilement | Défilement | 60 | 0,2 ms | 7 % |
| Form, défilement | Défilement | 60 | 0,3 ms | 7 % |
| Gestures | Ressorts, un anneau pulsant | 60 | 0,3 ms | 3 % |
| Animations | Boucles natives | 60 | 0,7 ms | 6 % |
| Canvas | Boucles natives | 60 | 0,4 ms | 16 % |
| Styles | Une transformation oscillante | 60 | 0,4 ms | 4 % |
| Tailwind, défilement | Défilement | 60 | 0,2 ms | 7 % |
| Text, défilement | Défilement | 60 | 0,1 ms | 7 % |
| Text View, défilement | Défilement | 60 | 0,1 ms | 6 % |
| Images, défilement | Défilement | 60 | 0,1 ms | 5 % |
| Components, défilement | Défilement | 60 | 0,2 ms | 6 % |
| Overlays, défilement | Défilement | 60 | 0,1 ms | 6 % |
| Menus, défilement | Défilement | 60 | 0,2 ms | 7 % |
| Controls, défilement | Défilement, transitions | 60 | 0,2 ms | 5 % |
| Web and video, défilement | Défilement | 60 | 0,1 ms | 8 % |
| System | `requestAnimationFrame`, minuteurs | 60 | 0,3 ms | 4 % |
| Standard APIs, défilement | Défilement | 60 | 0,1 ms | 7 % |
| Storage, défilement | Défilement | 60 | 0,1 ms | 8 % |

</div>

*FPS* est la cadence pendant qu'un élément bouge, comme ci-dessus : à 60 Hz, celle du simulateur, chaque frame arrive un rafraîchissement après la
précédente. Toute page où rien ne bouge ne dessine aucune frame et utilise 1 à 2 % de CPU au repos. Le processus occupe 40 Mo sur la
page d'accueil de la galerie et ~180 Mo après l'ensemble du parcours (images mises en cache volontairement, documents de la page Text View).

Sur un iPhone 17 Pro (ProMotion, 120 Hz), avec l'hôte de développement et une démo à l'écran, les pages animées
dessinent à chaque rafraîchissement :

<div class="data-table">

| Page | Origine des frames | FPS | Frame p95 | Au-delà d'un rafraîchissement | CPU | Mémoire |
|---|---|---|---|---|---|---|
| Stocks | Données en direct, boucles natives | 120 | 0,2–0,3 ms | 0 % | 46–70 % | 41–43 Mo |
| Canvas | Boucles natives | 120 | 0,1 ms | 0 % | 25–36 % | 37–38 Mo |
| Animations | Boucles natives | 120 | 0,2 ms | 0 % | 3–11 % | 37 Mo |

</div>

Stocks effectue 20 commits par seconde (un tick toutes les 50 ms), chacun en 1,5 ms de JS et 1,4 ms du cœur sur le thread
du moteur (p95 : 2,2 et 2,0 ms), lequel est occupé 4 à 6 % du temps.

<a id="measuring-an-app"></a>

## Mesurer une application

Pour mesurer une application de la même façon, exécutez ses tests ou ses étapes avec `--fps` et `-v` sur `--target linux`, `macos`, `windows` ou `ios` :

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
