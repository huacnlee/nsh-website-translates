---
title: "Architecture"
description: "Comment fonctionne une application NSH : le pipeline de build, le moteur et les threads principaux, le chemin d'un changement de signal jusqu'aux vues natives, le graphe réactif natif, la mise en page du texte et les crates."
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---

# Architecture

Cette page s'adresse aux développeurs d'applications qui veulent savoir ce qui se passe entre `count.set(1)` et le changement d'un label à l'écran,
dans une application écrite en Rust ou en TSX.
Vous n'en avez pas besoin pour écrire des applications, mais elle explique pourquoi NSH se comporte ainsi : pourquoi les composants ne s'exécutent qu'une fois, pourquoi
les animations restent fluides pendant que JS est occupé, pourquoi le thread principal n'attend jamais votre code.

<a id="the-big-picture"></a>

## Vue d'ensemble

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## Build : seul votre code devient du JS

`nsh build`, `nsh dev` et les autres commandes empaquettent votre application avec une chaîne d'outils écrite en Rust (sans Node.js) :

1. **Oxc** supprime les types TypeScript.
2. **Le compilateur JSX de NSH** transforme le JSX en appels directs au moteur de rendu natif, dans la même passe. Les props et
   enfants statiques sont définis une seule fois ; les expressions susceptibles de changer (elles appellent une fonction ou lisent une propriété) deviennent des bindings que le
   moteur de rendu suit. Les composants deviennent de simples appels de fonction avec un objet de props dont les props changeantes sont des getters.
3. **rolldown** regroupe vos modules en un seul module ES. Les imports des modules de NSH (`nsh`, `nsh/mobile`,
   `nsh/base`, ...) restent des imports : ces modules sont natifs, fournis par le runtime. **Le bundle ne contient que le code de votre
   application** ; l'exemple du compteur pèse moins de 1 Ko de JS.
4. Le bundle est compilé en **bytecode** (`bundle.nshc`), qui se charge plus vite que le code source, et une **source map**
   est composée à travers toutes les étapes afin que les stack traces pointent vers les lignes de votre `.tsx`.

Les images et les polices que vous importez sont collectées comme assets, et les déclarations de types pour votre éditeur sont écrites dans
`.nsh/types`.

Une application écrite en Rust n'a pas de bundle : Cargo construit le runner de chaque cible avec votre crate liée, et le composant
racine que nomme `nsh.json` s'exécute nativement sur le moteur. Tout ce qui suit s'applique aussi à ce cas, le code de vos composants
s'exécutant en Rust là où celui d'une application TSX s'exécute dans QuickJS.

<a id="running-two-threads-per-app"></a>

## Exécution : deux threads par application

Chaque application en cours d'exécution (un `NshAppView` sur iOS, un `NshView` sur Android, la fenêtre d'une application empaquetée) est un **moteur** avec
son propre **thread moteur** et, pour TSX, sa propre VM QuickJS. Il n'y a aucun singleton global, donc plusieurs applications peuvent tourner côte à côte
dans une même application hôte.

<a id="the-engine-thread"></a>

### Le thread moteur

Toute la logique de votre application s'exécute ici :

- **Votre code** s'exécute ici : composants, gestionnaires d'événements, timers, effets. Les composants Rust s'exécutent nativement ; TSX s'exécute dans
  **QuickJS**.
- **Le graphe réactif** (signals, valeurs calculées, effets, owners, contexte) est natif. Ses nœuds sont des objets QuickJS
  de classes natives, si bien que le ramasse-miettes voit les références à travers eux, mais le suivi des dépendances et
  la planification des mises à jour sont écrits en Rust (il suit l'algorithme de Solid 1.9).
- **Le moteur de rendu** que votre JSX compilé appelle est natif. Il crée des nœuds et transforme chaque changement en une **op** poussée
  directement dans une file native : pas de JSON, pas de messages par prop.
- **Le cœur** conserve un shadow tree de tous les nœuds. Lorsqu'un tour de JS se termine, il récupère d'un coup toutes les ops en file et **commit** :
  il rend les composants Rust (ceux de `nsh/base` et ceux de l'application), résout les insets `env()` dans les padding et margin, reconstruit les textes modifiés, calcule la mise en page avec **Taffy** (flexbox et grid, avec une
  colonne par défaut et sans rétrécissement), compare les frames et les styles, et produit un **MountBatch** : la liste des opérations dont les vues
  natives ont besoin.

<a id="the-main-thread"></a>

### Le thread principal

Le thread principal (UI) de la plateforme applique chaque MountBatch en un seul saut : création des vues, insertion, application des styles et des frames,
transmission du texte déjà mis en page. En dehors de cela, il ne fait que ce qui doit s'exécuter sur lui :

- **le dessin du texte** déjà mis en page sur le thread moteur ;
- **les animations natives** : les valeurs animées de `nsh` sont pilotées image par image (un `CADisplayLink` sur iOS, un animateur
  du thread UI sur Android) et écrites directement dans les vues ;
- **les gestes et le défilement** : les touchers deviennent des événements envoyés au thread moteur ; `scrollValue` et `pan` alimentent les valeurs animées
  dans la même frame.

**Le thread principal n'attend jamais JS.** Lorsque le système a besoin d'une réponse immédiate (ce texte peut-il changer, le bouton
retour peut-il fermer cet écran, cette sheet peut-elle se fermer), la réponse a été montée au préalable sous forme de prop, et JS en est informé
ensuite par un événement. Un thread moteur occupé peut retarder les mises à jour, mais il ne peut pas bloquer le défilement, les animations ni
les gestes du système.

<a id="from-a-tap-to-the-screen"></a>

## Du toucher à l'écran

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

Dans l'exemple du compteur, un toucher coûte environ 0,12 ms dans un build release sur un Mac, JS et commit confondus, et produit une
poignée de mount items (voir [Testing](./testing-and-trace.md)).

Dans une application Rust, le gestionnaire est une closure Rust (`count.set(count.get() + 1)`), et le même graphe, le même commit et le même batch
suivent, sans interpréteur entre les deux.

Trois propriétés découlent de cette conception :

- **Un tour correspond à un commit.** Quel que soit le nombre de signals modifiés par un gestionnaire, les vues changent une seule fois, ensemble.
- **Les composants ne s'exécutent qu'une fois.** Seuls les bindings se ré-exécutent ; il n'y a ni nouveau rendu d'un composant ni diff de DOM virtuel. Le
  diff qui subsiste est celui du cœur, sur les frames et les styles, en Rust.
- **Seuls les changements circulent.** Les styles et frames inchangés ne sont pas envoyés ; les nouvelles vues ne reçoivent aucune valeur par défaut.

<a id="text-laid-out-once-off-the-main-thread"></a>

## Texte : mis en page une fois, hors du thread principal

Le texte est souvent la partie la plus coûteuse d'une UI. NSH le met en page sur le thread moteur avec le moteur de texte propre à la plateforme,
de sorte qu'il ressemble exactement à du texte natif :

1. **préparation** : un `<Text>` et ses spans imbriqués deviennent une seule chaîne attribuée (CoreText sur les plateformes Apple,
   `PrecomputedText` / `StaticLayout` sur Android) ;
2. **mesure** aux largeurs demandées par la mise en page ; les mesures sont mises en cache selon le contenu et la largeur, donc un changement de couleur seul
   ne déclenche pas de nouvelle mesure ;
3. **mise en page** à la taille finale.

Le thread principal reçoit le résultat immuable et se contente de le dessiner. Un texte imbriqué dans un `<Text>` est un span, pas une vue ;
les chaînes en dehors de `<Text>` ne rendent rien.

<a id="lists"></a>

## Listes

`List` est virtualisée nativement. Le cœur décide quelles lignes sont proches de la zone visible, calcule les positions, les colonnes et
les en-têtes collants, et recycle les cellules. Lorsqu'une cellule a besoin d'un autre élément, le runtime la lie (les accesseurs
`item()` et `index()` de votre fonction de ligne changent) ; les frames qui ne révèlent aucune nouvelle ligne n'appellent aucun JS. Voir [Lists](./lists.md).

<a id="everything-else-the-runtime-does"></a>

## Tout ce que fait d'autre le runtime

- **Réseau** : `fetch` et les autres API globales sont des classes natives. Les requêtes passent par la pile HTTP de la plateforme
  (`NSURLSession`, `HttpURLConnection`), en streaming dans les deux sens.
- **Les images** sont téléchargées et décodées hors du thread principal, à la taille de la vue, avec un cache mémoire.
- **Les limites et les capacités** sont appliquées par le runtime, en Rust : voir [Sandbox and capabilities](./sandbox-and-capabilities.md).
- **Le remplacement de modules à chaud (HMR)** est également natif : les patchs sont appliqués par le runtime en bien moins d'une milliseconde (voir
  [Dev server and debugging](./dev-server-and-debugging.md)).

<a id="three-layers"></a>

## Trois couches

L'UI de NSH est construite en trois couches, comme celle de GPUI Kit :

| Couche | NSH | GPUI Kit | Ce que c'est |
|---|---|---|---|
| Primitives | `nsh-core` et le runtime (`nsh`, `nsh/mobile`, `nsh/desktop`) | `gpui` | Les éléments hôtes, les styles, la mise en page, le rendu, la réactivité, l'environnement |
| Composants de base | `nsh-base` (`nsh/base`) | `gpui-base` | Des composants sans style qui gèrent le comportement, l'état, le focus, le clavier et l'accessibilité, et tirent leur apparence de l'application |
| Bibliothèque de composants | celle de votre application, ou de la communauté | `gpui-component` | Des composants stylés : boutons, cartes, lignes avec une apparence |

Les deux premières couches font partie de Native Shell. La troisième est la vôtre : une application construit sa propre bibliothèque de composants sur `nsh/base` et
les primitives, en TSX ou sous forme de composants Rust dans [sa propre crate](./rust.md), utilise une bibliothèque publiée par la communauté, ou
style directement son UI dans l'application.

<a id="the-crates"></a>

## Les crates

NSH est un workspace Rust. Vous n'avez jamais besoin de le compiler pour écrire des applications (la distribution fournit la CLI et des runtimes précompilés), mais
ces noms apparaissent dans les logs et la documentation :

| Crate | Ce que c'est |
|---|---|
| `nsh-core` | Le cœur indépendant de la plateforme : shadow tree, styles, mise en page Taffy, fusion du texte, virtualisation des listes, mount items ; valeurs CSS et Tailwind ; le graphe d'animation natif (valeurs, interpolation, timing / spring / decay) ; le framework et le thème des composants Rust ; les modules Rust du runtime (`BackHandler` de `nsh/mobile`, ...). |
| `nsh-base` | `nsh/base`, les composants de base sans style (`gpui-base` de NSH) : navigation, dialogues, contrôles et barre d'état ; les applications Rust l'utilisent sous le nom `nsh_base`. |
| `nsh-js` | L'hôte QuickJS et le runtime de NSH : le graphe réactif, le moteur de rendu, tous les modules natifs, les API globales, le remplacement de modules à chaud, les limites ; et les déclarations TypeScript de tout cela. |
| `nsh-engine` | Le thread moteur : pilote `nsh-js` et `nsh-core` et transmet un batch par frame à la plateforme. |
| `nsh-package` | Paquets signés : clés, certificats, révocation, magasin de confiance. |
| `nsh-bundler` | Le bundler : rolldown, Oxc, le compilateur JSX de NSH, source maps, vérifications des classes Tailwind. |
| `nsh-dev` | Le serveur de développement et son client. |
| `nsh-platform-ios` | Le backend UIKit (iOS, simulateur, Mac Catalyst) : montage des vues, moteur de texte CoreText, saisie ; le SDK d'intégration. |
| `nsh-platform-android` | Le backend Android : `libnsh.so` et le runtime Java (`NshView`, les vues, les images, le réseau). |
| `nsh-cli` | La commande `nsh`. |

Le sens des dépendances est `nsh-core` ← `nsh-js` ← `nsh-engine` ← plateformes ; `nsh-base` s'appuie sur `nsh-core`. Le cœur ne dépend d'aucune plateforme ni d'aucun moteur JS,
ce qui permet à `nsh test` d'exécuter le vrai runtime sans interface sur n'importe quelle machine.

<a id="see-also"></a>

## Voir aussi

- [Performance](./performance.md)
- [Reactivity](./reactivity.md)
