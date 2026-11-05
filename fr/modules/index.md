---
title: "Modules"
description: "Les modules qu'une application NSH importe, ce que chacun exporte, et la façon dont ils sont organisés."
order: 1
source_hash: c212e0667eddb588
---

# Modules

Une app NSH importe tout ce qu'elle utilise depuis un petit ensemble de modules. Ils sont tous natifs : le graphe réactif, le moteur de rendu et chaque module sont implémentés en Rust dans le runtime, et le bundler conserve `import ... from "nsh/..."` sous forme d'imports au lieu de copier du code dans votre bundle. Votre bundle ne contient que votre propre code.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## Trois couches

L'interface de NSH est construite en trois couches, comme celle de GPUI Kit (`gpui`, `gpui-base`, `gpui-component`) :

| Couche | Modules | Ce qu'elle apporte à une app |
|---|---|---|
| Primitives | `nsh`, `nsh/mobile`, `nsh/desktop` | Réactivité, éléments hôtes, mise en page, listes, canvas, animation, gestes, informations sur l'appareil et API propres aux plateformes |
| Composants de base | [`nsh/base`](./nsh-base.md) | Composants sans style qui gèrent le comportement, l'état, le focus et l'accessibilité : un bouton, des documents Markdown et HTML, des piles de navigation et des boîtes de dialogue, ainsi que les dialogues du système, sur chaque plateforme |
| Bibliothèque de composants | celle de votre app, ou une de la communauté | Boutons, cartes, lignes et écrans avec une apparence |

L'apparence d'une app lui appartient. Sa bibliothèque de composants est la troisième couche : des composants qu'elle écrit à partir des [éléments hôtes](../elements/index.md) et de `nsh/base`, stylés avec `style`, des classes [Tailwind](../docs/tailwind.md) et son thème, des composants Rust qu'elle livre dans [son propre crate](../docs/rust.md), ou une bibliothèque publiée par la communauté sur les mêmes fondations.

Il n'existe pas de module fourre-tout : chaque API se trouve à un seul endroit. Les API des plateformes mobiles se trouvent dans `nsh/mobile` (iOS et Android) et celles des postes de bureau dans `nsh/desktop` (macOS, Windows, Linux) ; les deux peuvent être importés sur toutes les plateformes, de sorte qu'un seul bundle fonctionne partout (sur les autres plateformes, leurs appels retournent immédiatement, et `platform.os` vous indique sur quelle plateforme vous êtes).

Les types sont générés à partir du runtime : `nsh init`, `nsh build`, `nsh dev` et `nsh test` écrivent `.nsh/types` à côté de votre app, de sorte que les déclarations TypeScript correspondent toujours au runtime avec lequel vous compilez (voir [Structure du projet](../docs/project-structure.md)).

<a id="all-modules"></a>

## Tous les modules

| Module | Exports | Page |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary` ; les primitives `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (avec `Image.getSize`, `Image.prefetch`), [`Canvas`](./nsh-canvas.md) (avec `Path2D`, `CanvasRenderingContext2D`, `CanvasGradient`), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md) ; `safeArea`, `safeAreaInsets` ; `Keyboard`, `keyboardFrame` ; [animation](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`) ; [l'environnement](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`) ; [`PanResponder`](./nsh.md#panresponder) ; [`Clipboard`](./nsh.md#clipboard) ; [`Picker`](./nsh.md#picker) ; [`Storage`](./nsh.md#storage) ; [`host`](./nsh.md#host) (`available`, `call`, `on`, plus les SDK natifs `params` et `post`) ; [`keymap`](./nsh.md#keymap) (raccourcis clavier : `mod+k`, `ctrl+shift+p`, ...) ; [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (composants et fonctions que l'app hôte enregistre) ; [accessibilité](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`) ; les types des éléments, des styles, des événements et de JSX (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input` ; `TextView` ; `createNavStack`, `NavStack`, `NavPage`, `Dialog` ; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (la barre d'onglets du système, iOS et Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (titre, barre de titre, agrandissement, plein écran), `titleBar`, `Menu` (menu de l'application, menus contextuels) | [nsh/desktop](./nsh-desktop.md) |
| Modules standard | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [Modules standard](./standard-modules.md) |
| Globaux | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, minuteries, `console`, `requestAnimationFrame`, ... (sans import) | [API globales](./globals.md) |

Pages de référence qui ne sont pas des modules :

| Page | Contenu |
|---|---|
| [Référence des styles](./style-reference.md) | Chaque clé de style, son type et sa signification |
| [Référence Tailwind](./tailwind-reference.md) | Les utilitaires et variantes Tailwind acceptés par `class` |

<a id="host-elements"></a>

## Éléments hôtes

Les éléments hôtes sont des composants importés comme tout le reste : `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` et `Overlay` depuis `nsh`, les composants de base (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) depuis `nsh/base`, `InputAccessoryView` depuis `nsh/mobile`. Seuls `If` et `Each` sont des globaux. Le compilateur crée les éléments sur place, si bien que les imports ne coûtent rien à l'exécution. Leurs props sont documentées sous [Éléments](../elements/index.md).
