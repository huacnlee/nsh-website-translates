---
title: "Comparaison des approches"
description: "Comment Native Shell se compare à React Native, Flutter, Qt, GPUI et Slint, à Electron et Tauri, ainsi qu'aux vues web et à l'UI pilotée par le serveur pour une interface livrée après la publication."
order: 2
group: start
source_hash: 80f11e255cf3463f
---

# Comparaison des approches

NSH est un framework pour des apps complètes sur iOS, Android, macOS, Windows, Linux et le web, et un runtime pour une UI livrée aux apps après leur publication. Cette page le compare d'abord aux frameworks multiplateformes dans lesquels on écrit des apps, puis aux moyens dont les apps reçoivent une UI qu'elles n'ont pas embarquée. Le vert signifie que la capacité est disponible, le jaune qu'elle demande davantage de travail propre à l'app ou un projet séparé, et le rouge qu'elle n'est pas fournie ; les marques décrivent la disponibilité, pas les performances. Les versions sont les minimums documentés de chaque framework au moment de la rédaction : vérifiez-les pour la version que vous utilisez.

Légende : <span class="status status--yes" role="img" aria-label="Oui"></span> Oui · <span class="status status--partial" role="img" aria-label="Partiel"></span> Partiel · <span class="status status--no" role="img" aria-label="Non"></span> Non.

<a id="cross-platform-frameworks"></a>

## Frameworks multiplateformes

| Capacité | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| Rendu par | UI de la plateforme | Vues de la plateforme | Moteur propre | Graphe de scène | Propre, GPU | Propre, GPU | Moteur de rendu propre |
| Modèle d'UI | Conservé | Conservé | Conservé | Conservé | Immédiat | Immédiat + conservé | Réactif, conservé |
| Langage | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="Oui"></span> 15+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 15+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 17+ | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="Oui"></span> 9+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 7+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 7+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 9+ | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="Oui"></span> 14+ | <span class="status status--partial" role="img" aria-label="Partiel"></span> Séparé | <span class="status status--yes" role="img" aria-label="Oui"></span> 12+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 13+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 12+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 12+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="Oui"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="Partiel"></span> Séparé | <span class="status status--yes" role="img" aria-label="Oui"></span> 10+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 10+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 10+ | <span class="status status--yes" role="img" aria-label="Oui"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="Oui"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="Oui"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="Oui"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Oui"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Oui"></span> |
| Web | <span class="status status--yes" role="img" aria-label="Oui"></span> HTML | <span class="status status--partial" role="img" aria-label="Partiel"></span> Bibliothèque | <span class="status status--yes" role="img" aria-label="Oui"></span> Canvas | <span class="status status--yes" role="img" aria-label="Oui"></span> Canvas | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> Canvas |
| Texte système | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> |
| UX par appareil | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> |
| Sans runtime JS | <span class="status status--yes" role="img" aria-label="Oui"></span> Apps Rust | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> C++ | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--yes" role="img" aria-label="Oui"></span> |
| Livraison signée | <span class="status status--yes" role="img" aria-label="Oui"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> OTA | <span class="status status--no" role="img" aria-label="Non"></span> | <span class="status status--partial" role="img" aria-label="Partiel"></span> QML | <span class="status status--partial" role="img" aria-label="Partiel"></span> Shell | <span class="status status--partial" role="img" aria-label="Partiel"></span> Shell | <span class="status status--no" role="img" aria-label="Non"></span> |
| Licence | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, commerciale | Apache-2.0 | Apache-2.0 | GPL, commerciale |

Le mode immédiat reconstruit la description de l'UI à chaque frame ; le mode conservé la garde et ne met à jour que ce qui a changé. GPUI Fast combine les deux sur GPUI et s'exécute partout où GPUI s'exécute. « Shell » désigne [GPUI Shell](https://gpui-kit.com/shell).

NSH est le seul framework de ce tableau à réunir tout cela : l'UI et la saisie de texte propres à chaque plateforme, les téléphones, les ordinateurs de bureau et le web à partir d'une seule app — le web en HTML —, des apps Rust sans runtime JavaScript, et une UI signée et isolée dans un sandbox, livrée après la publication.

<a id="what-the-rows-mean"></a>

### Ce que signifient les lignes

- **Rendu par, modèle d'UI.** NSH monte les vues propres à chaque plateforme et les conserve (mode conservé) : un changement ne met à jour que les vues qu'il touche. React Native monte lui aussi des vues de la plateforme, sur iOS et Android. Flutter, Qt Quick, GPUI et Slint dessinent avec leurs propres moteurs de rendu ; GPUI construit l'arbre d'éléments à chaque frame (mode immédiat), et [GPUI Fast](https://github.com/longbridge/gpui-fast) réutilise ce qui n'a pas changé.
- **Plateformes.** Les minimums de NSH lui sont propres ([Platforms](./platforms.md)). Les autres proviennent de [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24 ; macOS et Windows via les projets séparés react-native-macos et react-native-windows, le web via la bibliothèque react-native-web), de [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), de [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), des [prérequis de Zed](https://zed.dev/docs/installation) pour GPUI, et des [guides de plateforme de Slint](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS depuis Rust). « Canvas » signifie que le framework dessine dans un canvas sur la page ; les apps web de NSH sont des éléments HTML mis en forme avec CSS, que le navigateur fait défiler, sélectionne et édite ([Web](./web.md)).
- **Texte système.** Les champs de texte de NSH sont les éditeurs de la plateforme — `UITextView`, `EditText`, `NSTextView`, le `TextView` de GTK, celui du navigateur — avec les méthodes de saisie du système, les poignées de sélection et les menus d'édition ; sur Windows, l'éditeur propre à NSH fonctionne avec DirectWrite et les méthodes de saisie du système (IMM32). React Native utilise lui aussi les champs de saisie de la plateforme. Les frameworks qui dessinent eux-mêmes leur UI implémentent l'édition de texte par leurs propres moyens et la relient aux méthodes de saisie du système.
- **UX par appareil.** Les composants de base de NSH suivent l'appareil : le même `Menu` est une popup au niveau de son déclencheur avec un pointeur, et une feuille remontant du bas sur téléphone, et un `ContextMenu` s'ouvre sur un clic droit ou un doigt maintenu. Dans les autres frameworks, l'adaptation de l'interaction à chaque appareil relève surtout du travail de l'app.
- **Sans runtime JS.** Les runners d'une app Rust ne lient aucun moteur JavaScript, sur aucune plateforme ; TSX est la seconde voie, sur le même moteur. Le QML de Qt Quick s'exécute sur le moteur JavaScript de Qt ; Qt Widgets en C++ non.
- **Livraison signée.** NSH vérifie les paquets `.nshpkg` signés à l'aide des clés auxquelles il fait confiance et d'une liste de révocation, et exécute chacun dans une VM avec les limites et les capacités accordées par l'hôte ([Signed packages](./signed-packages.md), [Sandbox and capabilities](./sandbox-and-capabilities.md)). Les mises à jour over-the-air de React Native livrent du code d'app de confiance ; Qt peut charger des fichiers QML ; les apps GPUI reçoivent des modules JavaScript via [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### Ce qui distingue NSH

- **Natif sur chaque plateforme, dans les deux sens du terme.** Chaque backend s'appuie sur les vues, le texte et les méthodes de saisie propres à sa plateforme — UIKit, vues Android, AppKit, Win32 avec Direct2D, GTK 4, HTML — et l'interaction de chaque plateforme vient avec elles. La sélection de texte, les méthodes de saisie et l'accessibilité sont celles du système, et ce qu'une nouvelle version de l'OS leur apporte parvient à l'app ([Introduction](./index.md#what-native-means)).
- **Téléphones, ordinateurs de bureau et web à partir d'une seule app.** Six plateformes sont des backends d'un même framework, avec des mises en page qui s'adaptent et une saisie qui suit l'appareil ; sur le web, l'app est du HTML, publié comme site statique.
- **Rust d'abord, sans runtime JavaScript.** Une app entière peut être en Rust de bout en bout, compilée en code natif avec les types, les threads et les crates de Rust. TSX est la seconde voie, sur le même moteur, pour des écrans écrits rapidement ([Building with Rust](./rust.md)).
- **Des vues conservées pour les apps courantes.** Messageries, formulaires, listes et documents restent quasiment inactifs au repos, car un changement n'envoie que les vues qu'il a touchées ([Introduction](./index.md#retained-views)).
- **Une UI livrée après la publication, signée et isolée dans un sandbox.** Les apps construites avec NSH — et les apps natives écrites avec les outils propres à chaque plateforme — reçoivent des modules TSX à l'exécution, écrits par une équipe ou générés par IA ([Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui)).
- **Une seule chaîne d'outils, pour les personnes et les agents.** Un seul exécutable `nsh` crée, lance, teste sur de vraies plateformes, empaquette et signe les apps pour chaque cible.

### React Native

React Native est le plus proche dans l'intention : tous deux réduisent le travail client dupliqué et utilisent les vues de la plateforme. Le centre de React Native est JavaScript ou TypeScript avec React et son écosystème de paquets, sur iOS et Android, avec un support des ordinateurs de bureau dans des projets séparés. Le centre de NSH est Rust : son runtime, son moteur de rendu et ses modules sont en Rust, Rust est un langage d'app à part entière, et TSX n'est qu'une voie parmi deux ; ses six plateformes, ordinateurs de bureau et web compris, sont des backends du même framework.

### Flutter

Flutter dessine chaque pixel avec son propre moteur, si bien qu'une app a le même aspect sur toutes les plateformes. NSH prend l'autre voie : les vues, le texte et la saisie de texte de chaque plateforme, et sur le web des éléments HTML avec le défilement, la sélection et la saisie propres au navigateur. L'édition de texte, les méthodes de saisie et la sélection sont celles de la plateforme, plutôt que réimplémentées pour chacune.
### Qt

Qt est une boîte à outils mature qui propose deux technologies d'UI, Qt Widgets et Qt Quick, avec des outils et une prise en charge des plateformes éprouvés de longue date. NSH se distingue par sa base et son modèle : Rust comme langage principal avec une voie TSX, une chaîne d'outils conçue pour le développement automatisé (et piloté par l'IA), le web rendu en HTML, et une interaction mobile, desktop et web adaptée au sein d'un seul modèle de composants.

<a id="gpui-and-gpui-fast"></a>

### GPUI et GPUI Fast

[GPUI](https://gpui-kit.com) est un framework d'UI en Rust qui dessine avec le GPU, conçu pour les applications desktop exigeantes ; [GPUI Fast](https://github.com/longbridge/gpui-fast) est le fork de Longbridge avec rendu retenu (il réutilise les vues, les mises en page et les mesures de texte inchangées), des couches de défilement et une composition de fenêtres native. NSH s'appuie à la place sur les vues de chaque plateforme : la saisie de texte, la sélection, les méthodes de saisie et l'interaction avec le système sont donc ceux de la plateforme, et NSH couvre aussi les téléphones et le web ; le backend GPUI de NSH intègre les applications NSH dans les applications GPUI et GPUI Kit ([GPUI](./gpui.md)).

Les deux conviennent à des charges différentes. Dans le [benchmark de performance de NSH](https://github.com/longbridge/nsh-perf-bench) (Linux, un tableau de 500 lignes de cotations, NSH sur son backend GTK 4), les charges courantes coûtent autant : à 1 000 cotations par seconde, NSH Rust utilise 18 % d'un cœur et GPUI Fast 20 %. Sous des mises à jour denses et soutenues, GPUI Fast prend l'avantage : à 20 000 cotations par seconde, il utilise 25 % d'un cœur contre 73–78 % pour NSH, et l'animation image par image de 1 000 boîtes lui coûte environ un tiers du CPU de NSH.

### Slint

Slint est une boîte à outils d'UI déclarative avec son propre langage et des moteurs de rendu légers, destinée aux ordinateurs de bureau et aux appareils embarqués, utilisable depuis Rust, C++, JavaScript ou Python. Les deux accordent de l'importance à la performance native ; la voie de NSH passe par l'UI et l'interaction propres à chaque plateforme, le HTML sur le web, Rust et TSX comme langages d'application, et un développement piloté par l'IA sur six plateformes.

<a id="electron-and-tauri"></a>

### Electron et Tauri

Electron embarque Chromium et Tauri utilise la WebView du système : tous deux construisent des applications desktop (et, avec Tauri, mobiles) à partir de contenu web, avec le texte et la saisie du navigateur. NSH construit à la place les vues propres à chaque plateforme, et ne rend du HTML que sur le web lui-même.

<a id="ui-delivered-after-release"></a>

## UI livrée après la publication

Une application qui veut une UI qu'elle n'a pas embarquée (réponses générées par un modèle, fonctionnalités de partenaires ou d'autres équipes, écrans qui changent sans nouvelle version) dispose de quelques options établies, sur téléphone comme sur desktop. Elles diffèrent par ce qui dessine l'UI, ce que le code livré a le droit de faire, et l'ampleur des changements à apporter à l'application pour les héberger.

| Capacité | NSH | WebView | UI pilotée par le serveur | Mini-programmes | Mises à jour OTA |
|---|---|---|---|---|---|
| Dessiné par | UI de la plateforme | Moteur de navigateur | Les vues de l'application | Moteur web + couche | Moteur de rendu du framework |
| Apparence et comportement natifs | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| État, logique et mise en page propres | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Composants natifs de l'hôte | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Sandbox configurée par l'hôte | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Même origine | <span class="status status--yes" role="img" aria-label="Yes"></span> Schéma | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Paquets signés et révocables | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| Adapté à l'UI générée par IA | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Pages web | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Coût pour l'application hôte | Une vue et une bibliothèque | Un moteur de navigateur par vue | Un moteur de rendu par composant | Un SDK de conteneur | Toute l'application dans le framework |

- **WebView (H5).** Une page dans un moteur de navigateur : tout ce que le HTML peut exprimer, avec l'apparence du navigateur et un bridge écrit à la main vers le code natif.
- **UI pilotée par le serveur.** Du JSON qui recombine les composants et les actions que l'application embarque déjà : facile à générer, sans état ni logique locaux au-delà de ce que fournit le schéma.
- **Conteneurs de mini-programmes.** Un framework et une API spécifiques à une plateforme sur un moteur web, à l'intérieur d'un gros SDK de conteneur.
- **Mises à jour over-the-air** (React Native avec un service de code-push, par exemple). Tout le framework, mais les mises à jour sont du code d'application de confiance, et l'application doit être écrite dans ce framework.
- **NSH.** Un module TSX avec son propre état, sa logique, ses animations et sa mise en page, rendu avec l'UI propre à la plateforme, et pouvant utiliser les vues natives enregistrées par l'hôte. Il arrive sous forme de paquet signé que l'application vérifie, s'exécute dans sa propre VM avec des limites de mémoire, de durée d'appel et de nœuds, et n'accède qu'aux hôtes réseau, pages web et réglages système que l'hôte accorde ([Sandbox et capacités](./sandbox-and-capabilities.md)). L'hôte ajoute une seule vue là où le module apparaît ([Plateformes](./platforms.md#embed-in-a-native-app)), et le même bundle s'exécute sur toutes les plateformes. C'est la raison d'être de NSH à côté de [GPUI Shell](./index.md#native-shell-and-gpui-shell).

<a id="when-another-option-fits-better"></a>

## Quand une autre option convient mieux

- L'écran est dominé par des mises à jour denses et soutenues de milliers de vues (un terminal de données de marché qui diffuse des dizaines de milliers de cotations par seconde, une visualisation personnalisée redessinée à chaque image) : le rendu GPU retenu de GPUI Fast n'utilise qu'une fraction du CPU (voir [GPUI et GPUI Fast](#gpui-and-gpui-fast)).
- L'application doit être identique au pixel près sur chaque plateforme : un framework qui dessine tout lui-même, comme Flutter ou Slint, l'offre par conception.
- Vous avez besoin dès aujourd'hui d'un large écosystème de paquets tiers : React Native, Flutter et Qt en comptent depuis des années.
- L'UI est un document ou une page web existante : une WebView l'affiche telle quelle.
- L'ensemble des écrans est fixe et réduit, et seuls le contenu et l'ordre changent : l'UI pilotée par le serveur n'a besoin d'aucun runtime.

<a id="see-also"></a>

## Voir aussi

- [Introduction](./index.md) : ce qu'est NSH, et ce que signifie « natif » en son sein.
- [Architecture](./architecture.md) : ce qui s'exécute où dans NSH.
- [Performance](./performance.md) : les règles que suit NSH, et comment mesurer une application.
