---
title: "Présentation des plateformes"
description: "Où NSH s'exécute : iOS, Android, macOS, Windows, Linux, GPUI et le web, chacun avec son propre backend ; comment exécuter, empaqueter et intégrer une application Rust ou TSX sur chacun, et ce dont chacun a besoin."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---

# Vue d'ensemble des plateformes

NSH fonctionne sur les téléphones, les ordinateurs de bureau et le web : iOS, Android, macOS, Windows, Linux, GPUI et les pages web. Chaque plateforme a son propre backend, qui dessine avec l'interface native de la plateforme : une application est donc faite de vues UIKit sur un iPhone, de vues AppKit sur un Mac, de widgets GTK 4 sous Linux, d'éléments GPUI dans une application GPUI et de HTML dans un navigateur, avec le texte, la saisie, l'accessibilité et le mode sombre de la plateforme. Tout ce qui se trouve au-dessus du backend est partagé : le graphe réactif, le moteur de rendu, la mise en page Taffy, les composants et les modules natifs sont le même code Rust partout, de sorte qu'une même application s'exécute sur toutes les plateformes. Une application écrite en Rust, c'est ce code et votre crate, sans machine virtuelle JavaScript ; une application TSX exécute ses modules sur QuickJS par-dessus ([Building with Rust](./rust.md)).

Sur chaque plateforme, une application s'utilise de deux façons : empaquetée comme une application installable de cette plateforme (`nsh package`), ou intégrée dans votre propre application native, que l'hôte lie une racine Rust ou charge du TSX à l'exécution. Vous la développez avec `nsh run` (les modifications Rust reconstruisent et relancent l'application, les modifications TSX sont des mises à jour à chaud).

<a id="at-a-glance"></a>

## En un coup d'œil

| Plateforme | Backend ; texte | Fonctionne sur | Développement | Empaquetage |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit ; CoreText | iOS 15.0+, appareils et simulateur | `nsh run --target ios` | `.app` (simulateur), `.ipa` signé |
| [Android](./android.md) | Vues Android ; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` et `x86_64` | `nsh run --target android` | `.apk` signé |
| [macOS](./macos.md) | AppKit et Core Animation ; CoreText | macOS 14+ | `nsh run --target macos` | `.app` signé ad hoc |
| [Windows](./windows.md) | Fenêtres Win32 dessinées avec Direct2D ; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (par défaut sous Windows) | un répertoire et un `.zip` |
| [Linux](./linux.md) | Widgets GTK 4 ; Pango | GTK 4.14+ | `nsh run` (par défaut sous Linux) | un répertoire et un `.tar.gz` |
| [GPUI](./gpui.md) | GPUI ; système de texte de GPUI | macOS, Windows, Linux (Vulkan) | dans votre application GPUI ; TSX aussi avec `nsh run --target gpui` | dans l'application GPUI qui l'intègre |
| [Web](./web.md) | HTML et CSS ; polices du navigateur | navigateurs modernes, ordinateurs et téléphones | `nsh run --target web` | un site statique |

- **[GPUI](./gpui.md)** dessine les applications avec [GPUI](https://gpui-kit.com), le framework du projet frère GPUI Kit, sur macOS, Windows et Linux : c'est le backend pour l'intégration dans les applications GPUI et GPUI Kit, qui placent leur `AppView` dans leur propre arbre d'éléments. Les applications de bureau autonomes s'exécutent et s'empaquettent avec le backend propre à chaque OS (AppKit, Win32, GTK 4).
- **[Web](./web.md)** affiche les applications en HTML dans une page de navigateur : `nsh package --target web` publie un site statique pour n'importe quel serveur web ou CDN, avec le moteur et la crate d'une application Rust compilés en WebAssembly, et une page de votre choix intègre une application avec `createPlayer` ou une iframe. C'est aussi lui qui fait fonctionner les démos en direct et le [playground](/playground) de ce site.
- **Mac Catalyst** exécute le backend iOS dans une fenêtre de la taille d'un iPhone (390×844) sur un Mac, pour le développement. Sélectionnez-le avec `--target catalyst` pour voir l'aspect d'une application sur un téléphone.

<a id="develop-and-package"></a>

## Développer et empaqueter

`nsh run` choisit la plateforme de la machine elle-même lorsque vous ne donnez aucun `--target` : AppKit sur macOS, la fenêtre GTK sous Linux et la fenêtre Win32 sous Windows. Les téléphones se pilotent depuis un ordinateur : iOS depuis un Mac avec Xcode, Android depuis macOS, Linux ou Windows avec le SDK Android ([Installation](./installation.md#what-works-where)).

Une application Rust (son `nsh.json` nomme le composant `"root"`) s'exécute et s'empaquette depuis son répertoire : `nsh` construit le runner propre à l'application pour la cible, avec votre crate et sans QuickJS. Une application TSX nomme son point d'entrée :

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

Chaque OS de bureau empaquette les applications avec son propre backend, construit pour la machine sur laquelle il s'exécute : empaquetez une application Mac sur un Mac, une application Windows sur Windows et une application Linux sur Linux. [Packaging](./packaging.md) décrit la sortie, la signature et les icônes de chaque cible.

<a id="embed-in-a-native-app"></a>

## Intégrer dans une application native

| Plateforme | Vue hôte | Exécute | Livré sous forme de | Langage de l'hôte |
|---|---|---|---|---|
| macOS | `AppView` (un `NSView`) | une racine Rust, des bundles TSX | la crate `nsh-platform-macos` | Rust |
| Windows | `AppView` (une fenêtre enfant) | une racine Rust, des bundles TSX | la crate `nsh-platform-windows` | Rust |
| Linux | `AppView` (un widget GTK) | une racine Rust, des bundles TSX | la crate `nsh-platform-linux` | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (une vue GPUI) | une racine Rust, des bundles TSX, des paquets signés | la crate `nsh-platform-gpui` | Rust |
| iOS | `AppView` (un `UIView`) | une racine Rust, des bundles TSX | la crate `nsh-platform-ios` | Rust |
| iOS | `NshAppView` (un `UIView`) | des bundles TSX, des paquets signés | `NativeShell.xcframework` | Swift |
| Android | `NshView` (un `FrameLayout`) | des bundles TSX, des paquets signés | `nsh.aar` | Java ou Kotlin |
| Web | `createPlayer` (un élément de page) ou une iframe | des bundles TSX ; une application Rust sous forme de site publié | les fichiers d'exécution issus de `nsh package --target web` | JavaScript ou HTML |

Un hôte Rust monte une racine Rust (`Root::of::<App>()`) avec `AppSource::Rust` ou `App::Rust`, et donne à ses moteurs les ensembles d'interface de l'application avec `set_ui_sets`, de sorte que le TSX qu'il charge importe les composants et modules propres à l'application. Chaque vue est un moteur, et une application peut en afficher plusieurs. L'hôte enregistre ses propres vues natives que les applications peuvent utiliser sur toutes les plateformes ([Native components](./native-components.md)).

> [!NOTE]
> Les hôtes Rust intègrent NSH avec les crates de plateforme du dépôt NSH ; le `AppView` de macOS, Windows et Linux charge les bundles depuis les fichiers de l'application elle-même (ou depuis le code source), avec les limites par défaut. La crate GPUI et les SDK iOS et Android chargent aussi des [paquets signés](./signed-packages.md) et définissent des limites et des capacités par vue ([Sandbox and capabilities](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## Écrire pour toutes les plateformes

La plus grande partie d'une application n'a besoin d'aucun test de plateforme : les éléments, les styles, la mise en page et les modules se comportent partout de la même manière. Là où les plateformes diffèrent, NSH donne à la différence un emplacement unique ([Platform-specific code](./platform-specific.md)) :

- **L'environnement indique où l'application s'exécute** : en Rust `os()`, `idiom()` et `is_desktop()` (`nsh_core::prelude`), en TSX `platform.os`, `platform.idiom`, `platform.desktop` et `platform.select` depuis `nsh`. L'OS est iOS, Android, macOS, Windows, Linux ou le web.
- **Les props propres à une plateforme** vont dans `ios={{…}}`, `android={{…}}`, `web={{…}}` ou `desktop={{…}}` en TSX (`desktop` : macOS, Windows, Linux et navigateurs de bureau).
- **La saisie suit la plateforme.** Les téléphones ont le toucher et le clavier logiciel ; les ordinateurs de bureau ont la souris, le pavé tactile et le clavier.

Les composants d'une application sont dessinés avec les primitives de NSH : ils fonctionnent donc aussi bien sur ordinateur que sur téléphone, avec le même aspect. Une mise en page de bureau se construit à partir des primitives (`view`, `text`, `scroll`, `virtual_list`, … ; `View`, `Text`, `Scroll`, `List`, … en TSX) et d'un test pour le bureau, comme le fait la mise en page de bureau de la galerie :

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

Chaque backend énumère ce qu'il fait à sa manière : [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences).

<a id="see-also"></a>

## Voir aussi

- [Getting started](./getting-started.md) : une première application, exécutée sur chaque plateforme.
- [Building with Rust](./rust.md) : les applications écrites en Rust, et Rust avec TSX.
- [Installation](./installation.md) : les outils dont chaque plateforme a besoin.
- [Architecture](./architecture.md) : ce qui est partagé et ce que fait chaque backend.
