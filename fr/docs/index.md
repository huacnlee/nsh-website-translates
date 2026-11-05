---
title: "Introduction"
description: "Ce qu'est Native Shell : un framework d'interface native centré sur Rust pour iOS, Android, macOS, Windows, Linux et le web, avec l'interface et les interactions propres à chaque plateforme."
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---

# Introduction

Native Shell (NSH en abrégé) est un framework d'interface native pour toutes les plateformes. Vous construisez une application une seule fois, avec un seul modèle d'application (composants, signaux, styles et la même API partout), et NSH l'exécute sur **iOS, Android, macOS, Windows, Linux et le web**, chaque fois comme une application de cette plateforme : composée de ses propres vues, éditée avec son propre système de texte, utilisée comme ses utilisateurs l'attendent. Écrivez toute l'application en **Rust**, écrivez les écrans en **TSX**, ou combinez les deux sur un même moteur. Sur ce même moteur, les applications que vous avez déjà publiées peuvent recevoir de nouvelles interfaces à l'exécution, écrites par votre équipe ou générées par un modèle, sous forme de modules signés, dans un bac à sable configuré par l'hôte.

> [!IMPORTANT]
> NSH fournit les vues et l'interaction natives ; l'application possède son design visuel. Les composants, l'état et les API sont partagés entre les plateformes, tandis que les couleurs, la typographie, les espacements et les formes viennent de l'application. La saisie de texte, le focus et les menus suivent les conventions d'interaction de chaque appareil. Voir [Objectifs et principes de conception](./goals.md).

<a id="what-native-means"></a>

## Ce que « natif » signifie

Dans NSH, « natif » a deux niveaux : les fondations de la plateforme et l'interaction de la plateforme.

**Les fondations de la plateforme.** Chaque plateforme a son propre backend, construit sur l'interface utilisateur que cette plateforme possède déjà :

| Plateforme | Vues | Texte | Saisie de texte |
|---|---|---|---|
| iOS | UIKit | CoreText | Les champs et vues de texte du système |
| Android | Vues Android | `StaticLayout` | `EditText` |
| macOS | AppKit, Core Animation | CoreText | `NSTextField`, `NSTextView` |
| Windows | Fenêtres Win32 dessinées avec Direct2D | DirectWrite | L'éditeur de NSH, avec les méthodes de saisie du système (IMM32) |
| Linux | GTK 4 | Pango | `Text` et `TextView` de GTK |
| Web | Éléments HTML stylés avec CSS | Les polices du navigateur | Les champs de saisie du navigateur |

La sélection de texte et son menu, les méthodes de saisie, l'accessibilité et le défilement viennent de la plateforme, et ce qu'apporte une nouvelle version de l'OS à ces éléments parvient à l'application avec elle. Les composants natifs (une carte, une web view, un lecteur vidéo, toute vue enregistrée par l'hôte) sont une vue de plus dans la même hiérarchie, disposée, découpée et défilée avec le reste ([Composants natifs](./native-components.md)).

**L'interaction de la plateforme.** Les composants que NSH fournit dans [`nsh/base`](../modules/nsh-base.md) se comportent comme les utilisateurs de chaque appareil s'y attendent, de sorte que l'application les écrit une seule fois :

| | Ordinateurs de bureau (et navigateurs de bureau) | Téléphones et tablettes |
|---|---|---|
| `Menu` | Une fenêtre contextuelle au niveau de son déclencheur ; les sous-menus s'ouvrent en cascade à côté de leur élément | Une feuille depuis le bas ; un sous-menu remplace les éléments de son menu |
| `ContextMenu` | Un clic droit l'ouvre à l'emplacement du pointeur | Un doigt maintenu sur le déclencheur l'ouvre sous forme de feuille |
| `Tooltip` | Affiché lorsque le pointeur reste sur le déclencheur | Affiché lorsque l'application l'ouvre |
| `Popover` | Un appui à l'extérieur le ferme et atteint ce qui se trouve sous le pointeur | Un appui à l'extérieur le ferme |

Les pages, les boîtes de dialogue, le clavier et la barre d'état suivent la même idée : les piles de navigation empilent et dépilent avec le mouvement propre à chaque plateforme, et le bouton retour, Échap et le balayage de retour font ce qu'ils font sur chacune ([Navigation](./navigation.md)).

<a id="from-phone-to-desktop-to-web"></a>

## Du téléphone au bureau et au web

Dans NSH, le multiplateforme signifie que chaque appareil reçoit l'application qu'il attend, et non le même écran agrandi ou réduit :

- **Un seul modèle d'application.** Les composants, l'état, la logique métier et les écrans de l'application sont partagés ; chaque backend les fait correspondre à sa plateforme.
- **Des mises en page qui se remodèlent.** Flexbox et CSS grid sont mis en page par [Taffy](https://github.com/DioxusLabs/taffy) sur toutes les plateformes, et les points de rupture de Tailwind (`md:`, `lg:`) ainsi que la taille de la fenêtre (`window()` en Rust) modifient la structure, pas seulement la taille : une application de messagerie affiche côte à côte sa barre latérale, ses conversations et ses messages dans une fenêtre large, et un seul écran à la fois sur un téléphone ([Mise en page](./layout.md), [Tailwind](./tailwind.md)).
- **La saisie que chaque appareil attend.** Pointeur, survol, clics droits, raccourcis et focus sur le bureau ; touchers, gestes, clavier logiciel et navigation entre pages sur les téléphones. Lorsqu'une application veut quelque chose de propre à chaque plateforme, les props `desktop={{…}}` et `platform.select` le permettent ([Code spécifique à la plateforme](./platform-specific.md)).
- **Vérifié sur chaque cible.** `nsh test` exécute les tests de l'application sans interface, ainsi que les mêmes tests dans des fenêtres macOS, Windows, Linux et GPUI, un simulateur iOS, un appareil Android ou un navigateur, avec la saisie propre à la plateforme ([Tests et traçage](./testing-and-trace.md)).

Prenons une application comme un client de messagerie. Son développeur la construit sur le bureau avec `nsh run`, l'ouvre dans un simulateur iOS avec `nsh run --target ios` pour vérifier la mise en page sur téléphone, puis dans un navigateur avec `nsh run --target web`, avec chaque fois le même projet, et `nsh package` produit les applications installables et le site web. Un seul ingénieur peut assumer ce qui demandait auparavant une équipe par plateforme, pendant que le backend est développé en parallèle.

<a id="rust-first"></a>

## Rust d'abord

NSH est construit en Rust, et Rust est un langage de premier rang pour écrire des applications avec lui :

- **Des applications entières en Rust.** L'interface, la logique et les composants sont en Rust, compilés en code natif sur chaque plateforme, avec l'ownership, les types et les threads de Rust et l'écosystème crates.io. Les calculs s'exécutent à vitesse native, et les gros volumes de données, l'analyse syntaxique et le travail système restent dans le langage le mieux adapté ([Développer avec Rust](./rust.md)).
- **TSX comme seconde voie.** TSX convient aux écrans écrits rapidement, aux plugins, aux petites applications et aux interfaces livrées à l'exécution. Il s'exécute sur le même moteur que Rust, avec les mêmes primitives, composants de base et signaux.
- **Les deux ensemble.** Une application Rust peut accueillir des écrans TSX, et les écrans TSX importent les composants, modules et classes Rust de l'application.
- **Une seule chaîne d'outils.** Un seul exécutable `nsh` crée, construit, vérifie les types, exécute avec rechargement à chaud, teste, empaquette et signe les applications pour chaque cible. Il embarque son propre bundler TSX et son vérificateur TypeScript, de sorte qu'un développeur venant de Rust, Swift, Kotlin ou C++ installe Rust et `nsh`, puis se met au travail ([Installation](./installation.md), [CLI](./cli.md)).

<a id="an-app"></a>

## Une application

Le même compteur, en Rust et en TSX :

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

Une vue (`view()`, `<View>`) devient un `UIView` sur iOS, un `ViewGroup` sur Android, un `NSView` sur macOS, un widget GTK sur Linux, une vue retenue dessinée avec Direct2D sur Windows et un élément HTML sur le web ; un texte devient une vue de texte native, et le retour visuel d'appui du bouton (`.active(..)`, `activeStyle`) s'exécute sur le thread principal. Lorsque vous touchez l'écran, `count.update` modifie un signal, et seul le texte qui le lit est mis à jour : la fonction du composant ne s'exécute pas à nouveau. L'application Rust est du code natif de bout en bout ; dans l'application TSX, seul le code propre au module est du JavaScript.

<a id="retained-views"></a>

## Vues en mode retenu

NSH fonctionne en mode retenu : chaque élément est une vue que la plateforme conserve, et une mise à jour ne modifie que ce qui a changé.

- **Mises à jour fines.** Des [signaux](./reactivity.md) comme ceux de Solid, implémentés nativement : les composants s'exécutent une seule fois, et un changement ne réexécute que les expressions qui lisent le signal modifié.
- **Seul ce qui a changé traverse les threads.** Les changements d'un tour sont mis en page ensemble et transmis au thread principal sous la forme d'un unique lot d'opérations de vue par frame ; les styles et les cadres inchangés ne sont pas envoyés, et les vues que rien n'a touchées restent telles quelles.
- **Les animations s'exécutent nativement.** Les animations de type timing, spring et decay, les gestes et les valeurs liées au défilement sont évalués sur l'horloge de frames de la plateforme, sans appel vers JS à chaque frame ([Animation](./animation.md)).

Cela convient aux écrans dont sont faites la plupart des applications (messageries, courriels, formulaires, listes, documents, réglages, une réponse d'IA qui arrive en flux), où quelques vues changent à la fois et le reste attend. Ces écrans restent presque inactifs entre deux mises à jour, et le défilement et les animations tiennent 120 FPS sur les écrans ProMotion. Dans le [benchmark de performance de NSH](https://github.com/longbridge/nsh-perf-bench), un tableau de cotations de 500 lignes mis à jour 1 000 fois par seconde utilise 18 % d'un cœur sous Linux avec NSH Rust, contre 20 % pour le même écran écrit directement sur [GPUI Fast](https://github.com/longbridge/gpui-fast). Les calculs lourds relèvent de Rust : TSX s'exécute dans QuickJS, un interpréteur, tandis qu'un module Rust s'exécute à vitesse native même lorsque TSX l'appelle ; trier 100 000 lignes prend ainsi environ 3 ms, comme en Rust pur ([Performance](./performance.md)).

<a id="how-it-runs"></a>

## Comment ça s'exécute

La chaîne d'outils est un unique binaire `nsh`. Une application est écrite en Rust, en TSX, ou les deux, et chacun emprunte son propre chemin vers le même moteur Rust.

<a id="rust-apps"></a>

### Applications Rust

Une application Rust est un crate, entièrement construit avec Rust et Native, sans runtime JavaScript :

1. **Construction.** `nsh` construit le runner de chaque cible (l'application iOS, Android, macOS, Windows, Linux ou web) avec votre crate lié. Les composants, l'état, les gestionnaires et le moteur sont compilés ensemble en code natif.
2. **Exécution.** Le composant racine de l'application s'exécute en Rust sur le thread du moteur. Le runner n'a pas de moteur JavaScript : QuickJS ne fait partie d'une application Rust sur aucune plateforme.

<a id="tsx-apps"></a>

### Applications TSX

Une application TSX (un module) est un ensemble de fichiers `.tsx` / `.ts` avec un point d'entrée, généralement `App.tsx` :

1. **Construction.** `nsh` regroupe les fichiers du module (avec rolldown et Oxc) et compile le JSX avec son propre compilateur. Les imports de `nsh` et `nsh/*` restent des imports : le runtime les sert nativement, de sorte que le bundle ne contient que votre code. Le bundle est compilé en bytecode QuickJS.
2. **Exécution.** Le thread du moteur exécute le bytecode dans [QuickJS](https://github.com/quickjs-ng/quickjs), une VM par vue. Le JSX compilé appelle directement le moteur de rendu natif, et JavaScript ne fait que décrire l'interface et gérer les événements ; l'analyse des styles, la résolution des classes Tailwind, le diffing, la mise en page et le texte se font tous en Rust.

<a id="the-difference"></a>

### La différence

| | Application Rust | Application TSX |
|---|---|---|
| Écrite en | Rust | TSX (TypeScript et JSX) |
| Compilée en | Code natif, lié au runner de chaque cible | Bytecode QuickJS, chargé par le runtime |
| Moteur JavaScript | Aucun | QuickJS, une VM par vue |
| Pendant le développement (`nsh run`) | Reconstruite et relancée à chaque enregistrement | Mises à jour à chaud à chaque enregistrement |
| Après la publication | Livrée avec l'application | Également livrée à l'exécution sous forme de paquets signés, dans un bac à sable |
| Convient à | Applications entières, calculs lourds, travail système | Écrans écrits rapidement, plugins, interfaces générées par IA |

Les deux se combinent : une application Rust peut accueillir des écrans TSX, et les écrans TSX importent ses composants, modules et classes Rust ; une telle application lie QuickJS pour les exécuter ([Développer avec Rust](./rust.md)).

<a id="the-shared-engine"></a>

### Le moteur partagé

À partir du moteur, les deux chemins sont identiques. Les changements sont collectés par tour, mis en page avec Taffy (flexbox et CSS grid), puis transmis au thread principal sous la forme d'un unique lot d'opérations de vue par frame ; le thread principal applique le lot aux vues natives. Le texte est mesuré et mis en page une seule fois sur le thread du moteur (CoreText sur les plateformes Apple, `StaticLayout` sur Android, DirectWrite sur Windows, Pango sur Linux, les métriques de police du navigateur sur le web) et seulement dessiné sur le thread principal.

Sur le web, le même moteur s'exécute dans la page : le navigateur affiche des éléments HTML stylés avec CSS, les fait défiler, sélectionne leur texte et gère la saisie, et `nsh package --target web` publie l'application sous forme de site statique dont les fichiers sont nommés d'après leur contenu, prêt pour n'importe quel CDN ([Web](./web.md)).

> [!NOTE]
> Le thread principal n'attend jamais le code de l'application. Les questions que le système pose de façon synchrone (ce champ peut-il accepter un caractère de plus, l'utilisateur peut-il balayer pour revenir, cette feuille peut-elle se fermer) reçoivent une réponse native à partir de props définies au préalable, telles que `maxLength`, `popOnBack` ou `closeOnSwipe`. Les événements parviennent ensuite aux gestionnaires de l'application.
<a id="dynamic-ui-and-ai-generated-ui"></a>

## UI dynamique et UI générée par l'IA

NSH est né comme un moyen pour les applications natives de recevoir de l'UI après leur publication, et cela reste l'un de ses principaux usages. Une application intègre un `NshAppView` (iOS), `NshView` (Android), `AppView` (applications macOS, Windows, Linux et GPUI) ou `createPlayer` (page web) là où un module doit apparaître, et NSH exécute des modules TSX à l'intérieur :

- **Livré après la publication.** Un module est un paquet signé (`.nshpkg`) que l'application télécharge à l'exécution. Elle vérifie sa signature auprès des clés auxquelles elle fait confiance et d'une liste de révocation avant de l'exécuter ([Paquets signés](./signed-packages.md)). L'application hôte embarque le runtime ; les équipes développent les modules selon son API et les livrent à leur propre rythme.
- **L'hôte garde le contrôle.** Chaque module s'exécute dans sa propre VM QuickJS, avec des limites de mémoire, de durée d'appel et de nombre de nœuds, et n'accède qu'à ce que l'hôte autorise : hôtes réseau, pages web, barre d'état ([Sandbox et capabilities](./sandbox-and-capabilities.md)). Plusieurs modules s'exécutent côte à côte.
- **Il ressemble au reste de l'application.** Les modules s'affichent avec l'UI propre à la plateforme, et l'hôte peut enregistrer ses propres vues natives (une carte, un lecteur, un composant de design system) que les modules peuvent utiliser ([Composants natifs](./native-components.md)).

Le même mécanisme permet à une application de **répondre par une interface**. Un modèle écrit un petit module TSX (un formulaire, un graphique, une carte de réservation), votre serveur le vérifie, le construit et le signe, puis l'application l'affiche nativement :

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

Sur iOS, la part de l'hôte tient en quelques lignes :

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## Adapté à l'IA

NSH est conçu pour les logiciels écrits avec l'IA, aussi bien des applications entières que des écrans générés :

- **Un seul modèle d'application pour toutes les plateformes.** Un modèle apprend une seule manière d'écrire l'UI, et le résultat s'exécute sur téléphones, ordinateurs de bureau et web ; NSH adapte l'interaction à chaque plateforme, donc rien n'est généré six fois.
- **Rust ou TSX, selon la tâche.** Rust pour les applications entières et les modules critiques en performance, TSX pour les écrans, les plugins et l'UI générée à chaque requête, sur un seul moteur.
- **Un contrat précis et généré.** Chaque élément, prop, clé de style et module dispose de déclarations TypeScript générées à partir des sources Rust (`.nsh/types`), et les API Rust sont typées, de sorte que le code généré est vérifié par un compilateur. Cette documentation est servie en texte brut pour les modèles ([`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt)).
- **Une seule ligne de commande pour toute la boucle.** Un agent crée l'application, la construit, l'exécute sur une cible, lance ses tests, lit le résultat, corrige et empaquette, le tout via `nsh`. `nsh test` s'exécute en mode headless, sans appareil, et signale les erreurs et les vues produites ; le compilateur s'exécute aussi in-process (`nsh_bundler::compile_module`) et dans le navigateur ([Playground](/playground)).
- **Sûr à exécuter même sans confiance.** Le code généré livré à l'exécution est un code non fiable : il arrive signé, s'exécute dans une VM avec des limites et n'accède qu'aux capabilities que l'hôte accorde.

<a id="where-it-runs"></a>

## Où il s'exécute

| Plateforme | Prérequis | Backend | Intégré avec |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Vues Android | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | Navigateurs modernes | HTML | `createPlayer`, iframe |
| [GPUI](./gpui.md) | Ordinateurs de bureau | GPUI | `AppView` (applications GPUI, GPUI Kit) |
| Mac Catalyst | macOS | UIKit | Pour le développement (`--target catalyst`) |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell et GPUI Shell

[Longbridge](https://longbridge.com) développe NSH pour ses propres clients. Le besoin initial était une couche de plugins pour le client mobile, et [GPUI Shell](https://gpui-kit.com/shell), qui rend les applications de bureau [GPUI](https://gpui-kit.com) extensibles en JavaScript, a été le point de départ. Sur téléphone, une UI dessinée par GPUI lui-même aurait dû reconstruire ce que la plateforme fait déjà (la sélection de texte et son menu (Copier, Partager, Traduire, Rechercher), les méthodes de saisie, l'accessibilité, les matériaux visuels qu'apporte chaque version d'iOS), et chaque équipe mobile aurait dû adopter une nouvelle pile UI. NSH s'affiche donc avec l'UI propre à chaque plateforme, et il est passé de cette couche de plugins à un framework pour des applications entières sur toutes les plateformes.

Les deux sont positionnés différemment. GPUI Shell étend les applications de bureau GPUI ; Native Shell est un framework pour des applications natives sur téléphones, ordinateurs de bureau et web, et son backend GPUI intègre les applications NSH dans les applications GPUI et GPUI Kit ([GPUI](./gpui.md)).

<a id="how-it-compares"></a>

## Comparaison avec d'autres approches

Pour les applications entières, NSH se situe parmi les frameworks multiplateformes tels que React Native, Flutter, Qt, GPUI, Slint, Electron et Tauri ; pour l'UI livrée après la publication, parmi les web views, l'UI pilotée par le serveur et les conteneurs de mini-programmes. Son choix : l'UI et l'interaction propres à chaque plateforme sous un seul modèle d'application, avec Rust comme langage d'application et TSX à ses côtés. [Comparaison des approches](./comparison.md) les passe toutes en revue.

<a id="next-steps"></a>

## Étapes suivantes

- [Installation](./installation.md) et [Premiers pas](./getting-started.md) : installer `nsh`, écrire une première application en Rust ou en TSX et l'exécuter sur chaque plateforme.
- [Développer avec Rust](./rust.md) : les applications écrites en Rust, et TSX par-dessus.
- [Plateformes](./platforms.md) : ce qui s'exécute où, et comment exécuter, empaqueter et intégrer sur chaque plateforme.
- [JSX et composants](./jsx-and-components.md) et [Réactivité](./reactivity.md) : les deux idées sur lesquelles tout le reste repose, en Rust et en TSX.
- [Paquets signés](./signed-packages.md) et [Sandbox et capabilities](./sandbox-and-capabilities.md) : livrer des modules et décider de ce qu'ils peuvent faire.
