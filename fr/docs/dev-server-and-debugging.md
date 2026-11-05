---
title: "Serveur de développement et débogage"
description: "Exécutez des applications Rust et TSX avec nsh run et nsh dev, connectez des simulateurs, émulateurs et appareils, et utilisez les recompilations, le remplacement à chaud de modules (hot module replacement), les journaux, la superposition d'erreurs et les piles d'appels avec source maps."
order: 60
group: tools
source_hash: bce9f1fee0870b27
---

# Serveur de développement et débogage

Pendant le développement, NSH compile votre app à chaque enregistrement. Une app Rust (`nsh.json` nomme son `"root"`) est compilée dans son propre runner, que `nsh run` démarre ; une modification de son crate la recompile et redémarre l'app. Une app TSX est envoyée à tous les hôtes connectés, qui se mettent à jour sur place. Deux commandes s'en chargent :

- `nsh run` compile l'app **et** la lance : une fenêtre Mac Catalyst ou AppKit, une fenêtre GTK sous Linux, une fenêtre Win32 sous Windows, un simulateur iOS, un appareil ou un émulateur Android, ou une page de navigateur. Pour TSX, elle démarre aussi le serveur de développement auquel se connecte l'hôte de développement.
- `nsh dev --server-only` démarre le serveur de développement pour TSX, pour les hôtes que vous lancez vous-même : votre propre app avec le SDK de développement, un appareil sur le réseau, ou plusieurs hôtes à la fois.

```sh
# A Rust app, from its directory
nsh run                             # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run --target ios                # iOS simulator
nsh run --target android            # Android device or emulator

# A TSX app
nsh run App.tsx                     # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run App.tsx --target macos      # AppKit window (macOS)
nsh run App.tsx --target ios        # iOS simulator
nsh run App.tsx --target android    # Android device or emulator
nsh dev App.tsx --server-only       # server only
```

`nsh dev` ouvre aussi l'hôte natif par défaut ; les hôtes mobiles utilisent `--target ios` ou `--target android`.

## `nsh run`

| Option | Description |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | Où exécuter l'app. Par défaut `macos` sous macOS (AppKit), `linux` sous Linux, `windows` sous Windows. Une app Rust fonctionne sur toutes les cibles sauf `gpui`, qui intègre sa racine dans une app GPUI ([GPUI](./gpui.md)). |
| `--device <name or UDID>` | Le simulateur iOS à utiliser. Par défaut : un simulateur déjà démarré, sinon l'iPhone le plus récent (démarré pour vous). |
| `--port <port>` | Port du serveur de développement. Par défaut 8790 ; le port libre suivant est utilisé si celui-ci est pris. |
| `--release` | Sert des builds de release pour TSX (minifiés, sans informations de débogage, sans mises à jour à chaud). |
| `--trace` | Journalise la durée de chaque commit sur l'hôte (apps TSX). |

Ce que fait chaque cible :

- **`catalyst`** (macOS) exécute l'hôte de développement comme une app Mac. L'arrêt de `nsh run` (Ctrl-C, ou `kill`) la ferme, et la fermeture de la fenêtre met fin à `nsh run`.
- **`macos`** (macOS) exécute l'hôte de développement AppKit, une app de bureau dans une fenêtre de 1200×800, de la même manière ; Cmd+R recharge le dernier build. Nécessite macOS 14 ou ultérieur ([macOS](./macos.md)).
- **`linux`** (Linux) exécute l'hôte de développement GTK dans une fenêtre de 390×844, de la même manière : l'arrêt de `nsh run` la ferme, et la fermeture de la fenêtre met fin à `nsh run`. Nécessite GTK 4.14 ou ultérieur ([Linux](./linux.md)).
- **`windows`** (Windows) exécute l'hôte de développement Win32 dans une fenêtre de 1200×800, de la même manière ; l'hôte ne survit jamais à `nsh run`, même si la console est fermée. Nécessite Windows 10 1809 ou ultérieur ([Windows](./windows.md)).
- **`ios`** installe l'hôte de développement dans le simulateur, le lance en le pointant vers le serveur de développement et continue de surveiller. Le simulateur partage le réseau du Mac, l'hôte atteint donc le serveur sur `127.0.0.1`. L'arrêt de `nsh run` (Ctrl-C) ferme l'hôte, qui sinon rejoindrait la session suivante. Nécessite Xcode.
- **`android`** installe l'APK de l'hôte de développement (de nouveau seulement si le runtime a changé), exécute `adb reverse tcp:<port> tcp:<port>` pour que le `127.0.0.1` propre à l'appareil atteigne le serveur, puis le démarre. Fonctionne avec un émulateur ou un appareil USB. Nécessite le SDK Android (`ANDROID_HOME`). Quand `nsh run` se termine (Ctrl-C aussi), il arrête l'hôte et supprime cette redirection de port, pour que l'hôte ne rejoigne pas la session suivante.

Quand `nsh run` se termine, quelle que soit la façon, il arrête l'hôte qu'il a démarré : il quitte l'app Catalyst ou ferme l'hôte macOS, Linux ou Windows, termine l'hôte de développement dans le simulateur, ou le force à s'arrêter sur l'appareil.

Pour une app Rust, chaque cible exécute le runner propre à l'app, compilé avec son crate : les bureaux exécutent un build de débogage sur place, avec sa sortie dans le terminal ; iOS et Android en installent un paquet. Pour TSX, les hôtes sont génériques : ils exécutent n'importe quelle app NSH envoyée par le serveur, il n'y a donc rien à compiler par app (une app qui possède son propre crate obtient des hôtes compilés avec lui).

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| Option | Description |
|---|---|
| `--port <port>` | Port du serveur de développement. Par défaut 8790 (le suivant libre s'il est pris). |
| `--release` | Sert des builds de release. |

Connectez les hôtes à l'URL affichée :

- **Votre propre app iOS**, liée avec `NativeShellDev.xcframework` :
  `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`. Voir [Intégration dans les apps iOS](./ios.md#development).
- **Votre propre app Android**, avec `nsh-dev.aar` : `nsh.connectDevServer("ws://192.168.1.20:8790/ws")`, ou
  `adb reverse tcp:8790 tcp:8790` et `ws://127.0.0.1:8790/ws`. Voir [Intégration dans les apps Android](./android.md#development).

Un nombre quelconque d'hôtes peut être connecté en même temps ; chaque build est envoyé à tous. Un hôte qui se connecte plus tard reçoit immédiatement le build courant. Un hôte qui ne peut pas exécuter l'app, parce qu'il lui manque un jeu d'UI que l'app importe (un hôte de développement compilé pour une autre app), ne reçoit aucun build : il en indique la raison, et le terminal affiche une ligne `warn` avec la commande qui installe l'hôte de l'app.

> [!NOTE]
> Un appareil sur le réseau local doit pouvoir joindre votre ordinateur sur le port du serveur de développement : même réseau, aucun pare-feu entre les deux.
> Les ressources (images, polices) sont servies en HTTP simple depuis le même port.

<a id="rust-edits"></a>

## Modifications Rust

Rust est compilé : une modification du crate d'une app, ou d'un crate dont elle dépend par chemin, recompile l'app, et `nsh run` la redémarre avec le nouveau code. L'état de l'app repart de zéro ; conservez ce qui doit survivre à un redémarrage dans le [stockage](../modules/nsh.md#storage). Une erreur de compilation s'affiche dans le terminal, et le prochain enregistrement qui compile relance l'app. Dans une app mêlant Rust et TSX, les modifications TSX restent des mises à jour à chaud (voir ci-dessous) et les modifications Rust redémarrent l'app.

<a id="hot-module-replacement"></a>

## Remplacement de modules à chaud

Les builds de développement TSX conservent un module par fichier source. À l'enregistrement, NSH recompile, compare les modules avec le dernier bon build et envoie un **patch** contenant uniquement les modules modifiés. L'hôte l'applique sur place en bien moins d'une milliseconde ; entre l'enregistrement d'un fichier et l'affichage du changement, il s'écoule environ 120 ms.

Ce qui arrive à votre app :

- **Seuls les composants que vous avez modifiés sont rendus de nouveau.** Chaque composant de premier niveau (une fonction commençant par une majuscule qui retourne du JSX) est enveloppé dans un proxy stable. Quand son code change (ou le reste du code de son module, qu'il peut utiliser), ses instances sont rendues de nouveau avec le nouveau code ; les composants dont le code n'a pas changé conservent leurs instances, et avec elles leurs signaux et leur état. Modifiez le style d'un bouton et l'écran reste où il était, avec le même texte saisi et la même position de défilement.
- **Les modules modifiés sont réexécutés**, ainsi que les modules qui importent un module modifié incapable d'absorber la mise à jour seul, jusqu'à l'entrée. Le code de niveau module est donc réexécuté, sauf ce qui conserve son état :
- **Les signaux et piles de navigation de premier niveau conservent leur état** : un `const` créé par `signal(…)` ou `createNavStack(…)` au sommet d'un module conserve sa valeur (une pile conserve ses pages) d'une modification à l'autre, tant que son propre initialiseur est le même ; changez l'initialiseur (`signal(0)` en `signal(10)`) pour repartir de zéro.
- **Les objets `context()` de premier niveau conservent leur identité**, en prenant la nouvelle valeur par défaut, de sorte que fournisseurs et consommateurs de modules différents continuent de correspondre.
- **Modifier l'entrée garde l'app montée.** `mount(App)` (ou `mount(() => <App />)`) réexécuté avec le même composant conserve ce qu'il avait monté : seuls les composants que vous avez modifiés sont rendus de nouveau. Modifiez `App` lui-même et il est rendu de nouveau, avec ce qu'il rend (l'état de ces derniers repart de zéro), mais un navigateur créé au sommet du module conserve ses routes, de sorte qu'un écran empilé reste empilé. Un appel `mount` modifié (autre composant, autres props) monte de nouveau l'app.
- **Un composant qui lève une exception** signale l'erreur et ne rend rien jusqu'à ce que vous la corrigiez ; le reste de l'app continue de fonctionner. Le prochain bon enregistrement le rétablit.

L'hôte **recharge toute l'app** au lieu d'appliquer un patch quand :

- la modification importe un module NSH que l'app en cours n'avait pas encore importé (par exemple le premier `import … from "nsh"`) ;
- le `capabilities` de l'app dans `nsh.json` a changé ;
- l'hôte n'exécute pas le build sur lequel le patch est basé (il vient de se connecter, ou un chargement précédent a échoué) ;
- un patch ne peut pas être appliqué.

> [!TIP]
> L'état qu'un composant conserve dans ses propres signaux est réinitialisé quand ce composant, ou un composant qui le rend, est modifié. Conservez l'état qui doit survivre aux modifications dans des signaux de premier niveau (ou un module de store), et créez les navigateurs au sommet d'un module.

`--release` sert des builds de release, sans mises à jour à chaud : chaque enregistrement recharge l'app. Utilisez-le pour vérifier le build minifié. Tout ce qui est chargé depuis un serveur de développement, avec `--release` ou non, échappe au durcissement du runtime (`eval` reste disponible) ; voir [Sandbox et capacités](./sandbox-and-capabilities.md#hardening).

<a id="logs"></a>

## Journaux

Une app Rust journalise avec le crate `log` (`log::info!`, `log::warn!`, `log::error!`) : `nsh run` affiche les lignes dans son terminal, avec la sortie de l'app, sur les bureaux et dans le simulateur iOS.

En TSX, `console.log`, `console.info`, `console.debug`, `console.warn` et `console.error` vont vers le journal natif avec la cible `js`. Tant qu'un hôte est connecté, ses lignes de journal sont transmises au terminal qui exécute `nsh run` / `nsh dev` : vos lignes `console.log` telles quelles (préfixées par le nom de l'appareil quand plusieurs appareils sont connectés), les avertissements et les erreurs après le nom de l'appareil :

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` met en forme les valeurs comme une console de navigateur : les chaînes telles quelles, les erreurs avec leur pile, les fonctions par leur nom, les objets et les tableaux en JSON. Quand l'hôte n'est pas connecté, les journaux vont vers le journal de la plateforme (la console Xcode / le journal unifié sous iOS, `adb logcat` sous Android).

Une promesse rejetée qui n'a toujours aucun gestionnaire une fois terminé le travail qui l'a rejetée (ses microtâches se sont exécutées) est elle aussi journalisée comme une erreur, comme le signale un navigateur : une fonction `async` qui lève une exception alors que personne ne l'attend, un `Promise.reject(…)` que personne n'intercepte, un appel vers Rust qui échoue sans que rien ne l'attende. La ligne va là où va `console.error` (le terminal, le journal de la plateforme, la console du navigateur sur le web), avec une pile qui pointe vers vos sources :

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

Un gestionnaire attaché plus tard dans le même tour (`const p = load(); …; p.catch(…)`) compte comme une prise en charge. Attendez la promesse avec await, ou donnez-lui un `.catch` là où l'échec importe.

Le reste du terminal tient en une ligne par étape (`✓` terminé, `→` où se connecter, `•` ce qu'un appareil a fait) ; la sortie des outils que NSH exécute (cargo, les hôtes eux-mêmes) n'est affichée que lorsqu'un d'eux échoue. `nsh run -v` (ou `NSH_VERBOSE=1`) affiche tout : chaque ligne de journal avec son niveau et sa source, la sortie de cargo et celle des hôtes.

`--trace` ajoute le coût de chaque commit :

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Voir [Tests](./testing-and-trace.md) pour la signification de ces chiffres.

<a id="the-error-overlay"></a>

## La surcouche d'erreur

Ces erreurs affichent une surcouche rouge par-dessus l'app sur l'hôte, avec le message et la pile :

- un échec de build (une erreur de syntaxe, un élément inconnu, un import manquant), avec un extrait de code pointant vers la ligne ;
- une erreur pendant l'évaluation du bundle ;
- une exception non interceptée dans un gestionnaire d'événement, un minuteur ou un effet.

Touchez la surcouche pour la fermer. Elle disparaît aussi au prochain rechargement réussi. Les échecs de build sont aussi affichés dans le terminal :

```text
error building App.tsx failed
App.tsx

  x <Buton> names nothing in scope
   ,-[3:11]
 2 | function App() {
 3 |   return <Buton />;
   :           ^^^^^
 4 | }
```

Le bundler supprime les types TypeScript sans les vérifier ; exécutez [`nsh check`](./cli.md#nsh-check) (le compilateur natif de TypeScript avec les écritures `tsconfig.json` `nsh init` ; Node n'est pas nécessaire) ou fiez-vous à votre éditeur pour les erreurs de type.

Dans les builds de release (une app d'intégration avec le SDK de release, une app empaquetée), les erreurs sont journalisées et transmises au gestionnaire d'erreurs de l'app hôte (`NshAppView.onError`, `NshView.setErrorListener`) mais ne sont pas affichées par-dessus l'app.

<a id="source-maps-and-stack-traces"></a>

## Source maps et piles d'appels

Le bundling produit une source map qui compose toutes les étapes (TypeScript → JSX → le bundle), et elle est envoyée avec chaque build. Avant qu'une pile d'appels soit affichée, le runtime réécrit les positions du bundle vers vos sources, de sorte que les piles pointent vers `App.tsx:2:28`, et non vers le bundle :

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` écrit la map sous la forme `bundle.js.map` ; une app d'intégration qui charge un bundle depuis un dossier la lit à côté du bundle, et les [paquets signés](./signed-packages.md) la contiennent aussi, sauf si elle est conservée à côté du paquet et appliquée avec `nsh symbolicate` ([Erreurs des paquets publiés](./signed-packages.md#errors-from-published-packages)).

<a id="debugging-tips"></a>

## Conseils de débogage

- **Rien ne se met à jour après une modification** : vérifiez le terminal pour une erreur de build ; la surcouche l'affiche aussi sur l'hôte.
- **L'app conserve un ancien état que vous pensiez voir réinitialisé** : le remplacement à chaud conserve volontairement l'état des composants inchangés, les signaux de premier niveau et les navigateurs. Redémarrez avec Ctrl-C et `nsh run`, ou changez l'initialiseur de l'état.
- **Une requête échoue uniquement dans un build empaqueté ou intégré** : vérifiez les [capacités](./sandbox-and-capabilities.md) de l'app ; les refus sont journalisés avec la clé à ajouter.
- **Quelque chose est lent** : reproduisez-le en mode headless avec [`nsh test --trace`](./testing-and-trace.md), qui affiche chaque opération de vue native, ou exécutez une app TSX avec `--trace`.
- **Erreurs de type dans l'éditeur** : `nsh run` et `nsh dev` maintiennent `.nsh/types` à jour ; voir [Structure du projet](./project-structure.md).

<a id="see-also"></a>

## Voir aussi

- [CLI](./cli.md)
- [Tests](./testing-and-trace.md)
- [Intégration dans les apps iOS](./ios.md), [Intégration dans les apps Android](./android.md)
