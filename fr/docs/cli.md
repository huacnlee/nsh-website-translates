---
title: "CLI"
description: "Toutes les sous-commandes et tous les indicateurs de NSH : init, build, test, check, dev, run, package, ainsi que les commandes de signature keygen, certify, publish, verify, symbolicate et revoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---

# CLI

`nsh` est l'outil avec lequel on construit une app NSH, en Rust ou en TSX. Chaque sous-commande qui construit une app accepte `[ENTRY]` : le répertoire de l'app (par défaut : le répertoire courant, donc `cd my-app && nsh run` fonctionne), qui exécute le composant racine d'une app Rust (`nsh.json` `"root"`) ou le `App.tsx` d'une app TSX, ou un module d'entrée TSX. Elle lit `nsh.json` à la racine de l'app et actualise les déclarations de types dans `.nsh/types`.

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

`nsh <command> --help` affiche les options d'une commande ; `nsh -V` (`--version`) affiche la version et la révision Git à partir de laquelle elle a été construite.

<a id="output"></a>

## Sortie

Chaque commande affiche une ligne par étape, et les détails uniquement en cas d'échec :

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` est une étape terminée, `→` indique où se connecter, `•` ce qu'un appareil a fait ; les lignes `warn` et `error` sont des problèmes, et les lignes simples sont la sortie propre à votre app (`console.log`). Dans un terminal, un indicateur de progression montre l'étape en cours et les lignes sont colorées (sauf si `NO_COLOR` est défini) ; lorsque la sortie est redirigée vers un fichier, seules les lignes de résultat sont écrites, sans couleurs. La sortie des outils que NSH exécute (cargo pour la crate Rust d'une app, les hôtes de développement) est affichée sous une ligne `error` lorsque l'un d'eux échoue.

`-v, --verbose` (toute commande ; également `NSH_VERBOSE=1`) affiche tout au fil de l'eau : chaque ligne de log avec son niveau et sa source, la sortie de cargo et celle des hôtes.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

Crée une app dans `DIR` (par défaut : le répertoire courant, créé s'il n'existe pas) à partir d'un modèle. Sans `--template`, `nsh init` demande lequel utiliser dans un terminal (Entrée choisit `ts`) et prend `ts` ailleurs (script, CI).

| Modèle | Ce qu'il crée |
|---|---|
| `rust` | Une app écrite en Rust : un projet Cargo (`Cargo.toml`, `src/lib.rs` avec le composant racine, `src/main.rs` pour `cargo run`), `nsh.json` avec `"rust": "."` et `"root": "App"`, le test de la racine `App.test.tsx` avec `tsconfig.json` et `.nsh/types`, `.gitignore` et un README, qui explique aussi comment ajouter plus tard une entrée TSX. `nsh run` et `nsh package` montent la racine sans QuickJS sur toutes les cibles (`nsh test` l'ouvre pour les tests TypeScript), y compris le navigateur ([Développer avec Rust](./rust.md)) ; `cargo run` la démarre directement sur macOS, Windows ou Linux. |
| `ts` | Une app TSX : `App.tsx`, son test `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` et `.nsh/types`. Les fichiers existants sont conservés ; la commande échoue uniquement si tous existent déjà. |
| `mixed` | Une app TSX avec une crate Rust propre à sa racine : `App.tsx`, son test `App.test.tsx`, `tsconfig.json`, `nsh.json` avec `"rust": "."`, `.gitignore`, `.nsh/types`, un README, et la crate à côté de `App.tsx` (`Cargo.toml`, `src/lib.rs`), dont `#[native_module("<name>/native")]` exporte un composant, un module et une classe que `App.tsx` utilise. Sans `"root"`, `App.tsx` est l'entrée. |

| Option | Description |
|---|---|
| `--name <NAME>` | Nom d'affichage écrit dans `nsh.json`. Par défaut : le nom du répertoire. L'identifiant devient `com.example.<name>` (lettres et chiffres uniquement, en minuscules), et le spécificateur d'import des crates `<name>/native` (en minuscules, mots joints par `-`). |
| `--template <TEMPLATE>` | `rust`, `ts` ou `mixed` (ci-dessus). `rust` et `mixed` nécessitent Rust ; `cargo run` nécessite aussi les bibliothèques de développement du backend de bureau natif. |
| `--nsh-source <DIR>` | Avec `rust` ou `mixed` : les crates dépendent, par chemin, des crates NSH du dépôt cloné dans `DIR`, afin de construire l'app avec les sources de NSH. |

Les crates de `rust` et `mixed` dépendent des crates NSH publiées sur crates.io à la version du CLI (avec `--nsh-source`, de celles d'un dépôt cloné), et les commandes `nsh` construisent les runners et les hôtes de l'app à partir des mêmes crates. Avant chaque commande sur une telle app, `nsh` construit un petit programme à partir des crates de l'app et du cœur de NSH qui décrit leurs composants, modules et classes, et l'exécute lorsque les crates ont changé ; grâce à cette description, le CLI lui-même assemble, compile, vérifie les types, sert et empaquette l'app. Les builds d'une app Rust compilent uniquement ses crates et le cœur de NSH. Créez-les dans un nouveau répertoire d'app : si l'un de leurs fichiers existe déjà, un conflit est signalé avant toute écriture.

Les apps dont les crates Rust dépendent de NSH via Git utilisent le dépôt que Cargo résout dans le fichier de verrouillage de l'app. Les hôtes générés partagent ce dépôt, y compris les dépendances NSH redirigées par les patches Cargo de l'app.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

Pour une entrée TSX, `nsh run` démarre le serveur de développement (comme `nsh dev`), lance un hôte de développement qui charge l'app depuis celui-ci, et reconstruit à chaque enregistrement. Le remplacement de modules à chaud (hot module replacement) met à jour l'app en cours d'exécution sur place ; les logs et les erreurs de l'app s'affichent dans le terminal. Arrêtez-le avec Ctrl-C (ou en fermant la fenêtre Catalyst, macOS, Linux, Windows ou GPUI). Quelle que soit la manière dont il se termine (Ctrl-C, `kill` / `pkill`, une erreur), il arrête l'hôte qu'il a démarré : l'app Catalyst, l'hôte macOS, Linux, Windows ou GPUI, l'hôte de développement dans le simulateur, ou sur l'appareil Android.

Une app Rust (`nsh.json` `"root"`, [Développer avec Rust](./rust.md)) s'exécute sans serveur de développement et sans QuickJS : `nsh run` construit le runner de l'app pour la cible avec sa racine montée, le démarre (sur les plateformes de bureau, un build de débogage dont les logs s'affichent dans le terminal ; dans le simulateur et sur Android, l'app installée), puis, à chaque modification du code Rust de la crate, la reconstruit et la redémarre. Avec `--target web`, il affiche l'adresse de la page, et la page ouverte charge d'elle-même le nouveau runtime. Indiquez l'entrée TSX (`nsh run App.tsx`) pour exécuter celle-ci à la place.

| Option | Par défaut | Description |
|---|---|---|
| `--target <TARGET>` | `macos` sur macOS, `linux` sur Linux, `windows` sur Windows | `catalyst` : l'hôte Mac Catalyst, une fenêtre de la taille d'un iPhone (390×844). `ios` : l'hôte dans un simulateur iOS. `android` : l'hôte sur un appareil ou un émulateur Android. `macos` : l'hôte AppKit, une fenêtre de 1200×800 ([macOS](./macos.md)). `linux` : l'hôte GTK, une fenêtre de 390×844 ([Linux](./linux.md)). `windows` : l'hôte Win32, une fenêtre de 1200×800 ([Windows](./windows.md)). `gpui` : l'hôte GPUI, une fenêtre de 1200×800, sur macOS, Windows ou Linux, qui affiche une app TSX comme les apps GPUI qui l'intègrent l'affichent ([GPUI](./gpui.md)). `web` : la page du serveur de développement, à l'adresse qu'il affiche ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | Simulateur iOS à utiliser, par nom (`"iPhone 16 Pro"`) ou UDID. Par défaut : un simulateur déjà démarré, sinon l'iPhone le plus récent, qui est démarré. |
| `--port <PORT>` | `8790` | Port du serveur de développement. Remplace la session de développement NSH précédente sur ce port une fois son nettoyage terminé. |
| `--release` | | Minifie et supprime les informations de débogage. Les bundles de release n'ont pas de remplacement de modules à chaud : chaque enregistrement recharge l'app. |
| `--limits [<LIMITS>]` | | Exécute l'app comme une app intégrée dans une autre, dans les limites fixées par son app hôte : `memory` et `stack` (dans `KB`, `MB` ou `GB`), `load` et `call` (dans `ms` ou `s`) et `nodes`, tel que `--limits memory=128MB,call=500ms`. Ceux qui sont omis conservent les valeurs par défaut de l'intégration, avec lesquelles `--limits` seul s'exécute ([Bac à sable et capacités](./sandbox-and-capabilities.md#limits)). Sans cette option, l'app s'exécute seule, comme le fait une app empaquetée. Entrées TSX. |
| `--trace` | | L'hôte journalise dans le terminal la durée de chaque commit (JS, layout, éléments de montage). |
| `--fps` | | Le moniteur de performance : fréquence d'images, coût des images et des commits, CPU, GPU et mémoire, affiché par-dessus l'app sur macOS ([macOS](./macos.md#performance-monitor)) et journalisé une fois par seconde sur macOS, Linux, Windows et iOS. |
| `--name <NAME>` | nom de `nsh.json` | Nom d'affichage de l'application dans la barre de menus et titre initial de la fenêtre (`--target macos`, entrées TSX). |
| `--window-size <WIDTHxHEIGHT>` | Valeur par défaut de l'hôte | Taille initiale de la fenêtre en points, comme `800x600` (`--target macos`, `linux`, `windows` et `gpui`, entrées TSX). |
| `--display <N>` | L'écran principal | L'écran sur lequel la fenêtre s'ouvre, centrée : `1` est l'écran principal (celui qui a la barre de menus), `2` le suivant, et ainsi de suite ; un numéro sans écran correspondant l'ouvre sur l'écran principal (`--target macos`, entrées TSX). |

Avec `--target android`, le premier appareil listé par `adb devices` est utilisé ; le port du serveur de développement lui est redirigé avec `adb reverse`. Voir [Prise en main](./getting-started.md#run-it) et [Serveur de développement et débogage](./dev-server-and-debugging.md).

Un remplacement attend jusqu'à dix secondes que la session précédente termine son nettoyage. Un port occupé par un autre programme, ou par un CLI NSH plus ancien, produit une erreur qui nomme le port. Utilisez des valeurs `--port` distinctes pour exécuter plusieurs apps ensemble ; `--port 0` demande un port libre au système d'exploitation.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Démarre le serveur de développement et ouvre l'hôte natif de ce système : AppKit sur macOS, GTK sur Linux, Win32 sur Windows. Choisissez explicitement `--target ios` ou `--target android` pour le développement mobile. `--server-only` sert les hôtes que vous démarrez vous-même. Le serveur construit l'app, surveille le répertoire de l'entrée et envoie chaque reconstruction aux hôtes connectés. Avec `--server-only`, il affiche l'URL pour les hôtes de cette machine et une par adresse LAN pour les appareils, et, lorsque le runtime web est présent, la page que les navigateurs ouvrent pour exécuter l'app ([Web](./web.md#develop-in-the-browser)) :

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

Utilisez `nsh dev --server-only` avec une app qui intègre le SDK de développement (`NativeShellDev.xcframework`, `nsh-dev.aar`). `--target`, `--device`, `--port`, `--release` et `--limits` fonctionnent comme pour `nsh run` ; `--server-only` sélectionne un serveur sans hôte lancé.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

Exécute les tests de l'app en mode headless ([Tests](./testing-and-trace.md)) : les fichiers de test (`*.test.tsx`, `*.test.ts`, important `nsh/test`) dans `PATH`, un répertoire (par défaut : le répertoire courant ; les répertoires cachés, `node_modules` et `target` sont ignorés), ou le fichier de test `PATH`. Lorsqu'on lui donne le répertoire d'une app avec des crates Rust propres (`nsh.json` `"rust"` : une app Rust ou une app TSX avec une crate), il exécute d'abord `cargo test` pour chaque crate du répertoire, dans le répertoire propre de la crate, puis affiche et compte chaque test Rust avec les tests TypeScript, sous le fichier de sa cible de test (`src/lib.rs › tests::adds`) ; une app Rust n'ayant que des tests Rust est également testée ainsi. Chaque fichier de test s'exécute sur un moteur qui lui est propre, et chaque app qu'il ouvre sur un autre moteur, neuf. Il affiche une ligne par test et, en cas d'échec, ce qui a été levé, l'emplacement dans le fichier de test et les textes à l'écran ; tout échec fait sortir la commande avec un code non nul. Lorsqu'on lui donne l'entrée de l'app (`nsh test App.tsx` ; pour une app Rust : `nsh test nsh.json`), il ouvre l'app sur le réseau, la laisse tourner 1,2 s et exécute les étapes fournies par l'entrée standard (`await app.press("Add")`, avec `app` l'app). Une app TSX s'exécute dans le processus propre du CLI ; une app avec des crates Rust propres s'exécute dans un runner headless construit avec elles, pour lequel le CLI construit les entrées. Les exécutions headless se comportent comme iOS, sauf si un test ouvre l'app comme Android (`open`, `platform`) : `platform.os` vaut `"ios"`, et les classes `ios:` et les props `ios={{…}}` s'appliquent.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Option | Description |
|---|---|
| `--filter <NAME>` | N'exécute que les tests dont le nom (après les noms des blocs `describe` dans lesquels il se trouve) contient `NAME` ; pour les crates, `cargo test <NAME>`. |
| `--trace` | Affiche chaque lot de montage des apps ouvertes par les tests, sous l'étape dans laquelle il est arrivé (`── press(Add): 7 items`), ainsi que la durée de chaque commit : ce que coûtent la première image, une étape ou une image de défilement. Avec `--target`, les lots et les durées de l'hôte. |
| `--fps` | Avec `--target linux`, `macos`, `windows` ou `ios` : l'hôte journalise une fois par seconde les mesures de son moniteur de performance (fréquence d'images, phases d'image, commits, CPU, mémoire), affichées avec `-v`. |
| `--junit <FILE>` | Écrit aussi les résultats dans `FILE` sous forme de rapport JUnit XML, le format à partir duquel les services de CI affichent les résultats de tests : un `testsuite` par fichier de test, un `testcase` par test. |
| `--target <TARGET>` | Exécute les apps ouvertes par les tests sur l'hôte de développement de cette plateforme au lieu du mode headless (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` et `android` ; `web` les exécute dans un Chrome, Edge ou Chromium headless) : les étapes agissent avec l'entrée propre à la plateforme ([Tests](./testing-and-trace.md#on-a-real-platform)), et `open` vérifie ses options par rapport à la plateforme, en rejetant celle qu'elle ne peut pas honorer (`ERR_NSH_TEST_UNSUPPORTED` : `width` et `height` sur iOS et Android, un `platform` d'un autre type d'appareil). Les tests Rust des crates s'exécutent sur cette machine, lors des exécutions sans `--target`. |
| `--browser <PATH>` | L'exécutable Chrome, Edge ou Chromium dans lequel `--target web` exécute les apps (par défaut : celui installé sur cette machine). |
| `--display <N>` | Avec `--target macos` : l'écran sur lequel les fenêtres des apps s'ouvrent, centrées : `1` est l'écran principal (celui qui a la barre de menus), `2` le suivant, et ainsi de suite ; un numéro sans écran correspondant les ouvre sur l'écran principal. Par défaut, elles s'ouvrent sur un écran secondaire (le premier en dehors de l'écran principal, qui n'en est pas un miroir), de sorte qu'une exécution de tests reste sur un écran à part, et sur l'écran principal lorsqu'il est le seul. Les tests s'exécutent de la même façon sur tous les écrans. |
| `--web-host <JS>` | Le module hôte de la page web que reçoivent les apps ouvertes en headless (par défaut : `nsh.json` `web.host` ; il exporte `createHost(player)`) : il répond à leurs appels [`host`](../modules/nsh.md#host) et son `player.hostEvent` atteint `host.on` ([Tests](./testing-and-trace.md#the-pages-host)). Exécutions headless uniquement ; `--target web` exécute le `web.host` de `nsh.json`. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

Vérifie les types de l'app. Pour une app avec ses propres crates Rust (`nsh.json` `"rust"`), chaque crate est d'abord vérifiée avec `cargo check --all-targets` dans le répertoire de la crate, tests compris ; les erreurs de Cargo font quitter la commande avec un code non nul. Une app Rust (`"root"`) est ensuite vérifiée dans la mesure où elle contient du TypeScript : avec un `tsconfig.json` (celui que `nsh init --template rust` écrit pour `App.test.tsx`), ses fichiers de test sont eux aussi vérifiés. La vérification TypeScript actualise `.nsh/types` et `.nsh/tsconfig.json`, puis exécute `tsc -p <app directory> --noEmit` avec le `tsconfig.json` de l'app. Elle utilise TypeScript 7, le compilateur natif, qui n'a pas besoin de Node : la première exécution le télécharge depuis le registre npm (environ 9 Mo), le compare à la somme de contrôle que NSH enregistre, et le conserve dans le cache de NSH (`~/Library/Caches/nsh` sur macOS, `~/.cache/nsh` sur Linux, `%LOCALAPPDATA%\nsh` sur Windows, ou `NSH_CACHE`). Les erreurs de type font quitter la commande avec un code non nul. Elle avertit lorsque `tsconfig.json` n'étend pas `./.nsh/tsconfig.json`, où NSH conserve ses réglages TypeScript ([Structure du projet](./project-structure.md#tsconfigjson-and-nshtypes)).

| Option | Description |
|---|---|
| `--tsc <TSC>` | Exécute ce `tsc` à la place (aussi `NSH_TSC`), par exemple celui de `node_modules` ou une copie pour les machines sans réseau. |
| `-- <TSC ARGS>` | Transmis à `tsc`, par exemple `nsh check -- --pretty false`. |

Les fichiers générés par NSH restent sous `.nsh/` : déclarations, sources des runners, et sorties par défaut de build/package dans
`.nsh/out/`. Cargo conserve son cache `target/` habituel et le comportement existant de `CARGO_TARGET_DIR` ; NSH n'ajoute
aucune configuration Cargo pour le déplacer. `--out` continue de remplacer l'emplacement de sortie.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

Compile l'app. Pour une app Rust (`nsh.json` `"root"`), elle compile et décrit les crates de l'app, puis écrit `app.json` et les fichiers qu'elles embarquent (`assets/`) : ses runners montent la racine. Pour une app TSX, elle regroupe l'app dans un bundle et le compile en bytecode QuickJS, pour les apps qui embarquent NSH et livrent elles-mêmes le bundle.

| Option | Défaut | Description |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | Répertoire de sortie. |
| `--release` | | Minifie et supprime les informations de débogage. |
| `--split` | | Place ce que `import()` charge dans des fichiers de chunk distincts, téléchargés au premier import (apps web, voir [Split bundles](./web.md#split-bundles)). Sans cette option, le bundle contient toute l'app. |

Elle écrit :

| Fichier | Contenu |
|---|---|
| `bundle.js` | Le bundle en JavaScript |
| `bundle.js.map` | Sa source map (les traces de pile sont reliées à vos sources) |
| `bundle.nshc` | Le bundle en bytecode compilé : ce que les apps chargent |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | Avec `--split` : chaque chunk, sa source map et son bytecode (`Screen.js` pour `import("./Screen")`) |
| `capabilities.json` | Le `capabilities` de `nsh.json`, s'il est déclaré (supprimé sinon) |
| `assets/` | Chaque image et chaque police importée, à son chemin relatif à la racine de l'app |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

Construit une app installable en mode release. Une app Rust (`nsh.json` `"root"`) est empaquetée avec son propre runner, compilé avec Cargo à partir de vos crates et de celles de NSH, sa racine étant montée sans QuickJS ([Building with Rust](./rust.md)) ; une app TSX l'est avec le runtime précompilé. Aucun projet Xcode ni build Gradle n'intervient : NSH assemble lui-même le bundle de l'app et utilise `actool` et `codesign` d'Xcode (iOS) ou `aapt2`, `zipalign` et `apksigner` du SDK (Android) ; pour macOS, il assemble un `.app` signé ad hoc avec `codesign` (et `sips` pour l'icône) ; pour Linux, il copie le runner et écrit un `.tar.gz` avec `tar` ; pour Windows, il copie le runner, intègre l'icône et écrit un `.zip`, sans outils ; pour le web, il écrit un site statique, sans outils. Les métadonnées viennent de `nsh.json`, remplacées par les options.

| Option | Description |
|---|---|
| `--target <TARGET>` | Obligatoire. `ios` : appareils iOS, un `.ipa` signé (ou un `.app` non signé sans `--sign`). `ios-simulator` : un `.app` signé ad hoc. `android` : un `.apk` signé. `macos` : un `.app` signé ad hoc ([macOS](./macos.md#packaging)). `linux` : un répertoire `<Name>/` (l'exécutable, `nsh/`, un fichier `.desktop`) et `<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows` : un répertoire `<Name>\` (`<Name>.exe`, `nsh\`) et `<Name>.zip` ([Windows](./windows.md#packaging)). `web` : un répertoire `<Name>/`, un site statique (`index.html` et des fichiers nommés d'après leur contenu) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | Répertoire de sortie (par défaut `.nsh/out`). |
| `--name <NAME>` | Nom affiché. |
| `--id <ID>` | Identifiant du bundle, par exemple `com.example.app`. |
| `--app-version <VERSION>` | Version, par exemple `1.2.0`. |
| `--build <BUILD>` | Numéro de build. |
| `--icon <ICON>` | Icône de l'app : un PNG carré, idéalement de 1024×1024. |
| `--sign <IDENTITY>` | Appareils iOS : identité de signature du code, par exemple `"Apple Development: …"`. |
| `--profile <FILE>` | Appareils iOS : profil de provisionnement (`.mobileprovision`). Les entitlements en proviennent. |
| `--keystore <FILE>` | Android : keystore de release. Par défaut : la clé de débogage dans `~/.android/debug.keystore` (créée si absente). |
| `--key-alias <ALIAS>` | Android : alias de la clé dans le keystore. |
| `--keystore-password <PASSWORD>` | Android : mot de passe du keystore. Également lu depuis `NSH_KEYSTORE_PASSWORD`. |
| `--abi <ABI>` | Android : les ABI de l'APK (`arm64-v8a`, `armeabi-v7a`, `x86_64`), répétées ou séparées par des virgules. Par défaut : `arm64-v8a` et `armeabi-v7a`, plus celle de l'appareil avec `--run`. |
| `--run` | Installe puis lance l'app ensuite : dans le simulateur (`ios-simulator`) ou sur l'appareil Android connecté ; `macos`, `linux` et `windows` la lancent ; `web` sert le site sur cette machine à l'adresse qu'elle affiche. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Voir [Packaging](./packaging.md).

<a id="signing-commands"></a>

## Commandes de signature

Ces commandes créent et vérifient des paquets signés (`.nshpkg`) : des bundles d'apps que les apps embarquant NSH téléchargent et vérifient avant de les exécuter. [Signed packages](./signed-packages.md) explique le modèle (une clé racine hors ligne certifie des clés de release pour certains identifiants d'app).

### nsh keygen

```sh
nsh keygen <NAME>
```

Crée une paire de clés Ed25519 : `<NAME>.secret` et `<NAME>.pub` (par exemple `nsh keygen keys/root`). Conservez le `.secret` d'une racine hors ligne ; les apps font confiance à son `.pub`.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

Certifie une clé de release avec une clé racine pour certains identifiants d'app et une fenêtre de temps ; les paquets portent le certificat.

| Option | Description |
|---|---|
| `--root <ROOT>` | La clé secrète de la racine. |
| `--key <KEY>` | La clé publique de la clé de release. |
| `--apps <APPS>` | Identifiants d'app pour lesquels elle peut signer : `*`, `com.example.*` ou un identifiant. Répétable. |
| `--days <DAYS>` | Durée pendant laquelle elle peut signer, à partir de maintenant (365 par défaut). |
| `-o, --out <OUT>` | Le certificat à écrire. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

Compile l'app en mode release et la signe dans un paquet. Les métadonnées viennent de `nsh.json`, remplacées par les options.

Si on lui donne un paquet (`ENTRY` est un fichier `.nshpkg`), elle signe à nouveau ce paquet avec cette clé, comme le fait une plateforme qui signe les paquets de ses apps avec une clé qui lui est propre. Les fichiers et l'en-tête du paquet restent inchangés ; son certificat,
son horodatage de signature et sa signature deviennent ceux de la nouvelle clé ([Signed packages](./signed-packages.md#sign-a-package-again)). `-o`
peut désigner le paquet à lire, et seuls `--key`, `--cert` et `-o` s'appliquent.

| Option | Description |
|---|---|
| `--key <KEY>` | La clé secrète de la clé de release. |
| `--cert <CERT>` | Son certificat (`nsh certify`). |
| `-o, --out <OUT>` | Le paquet à écrire. Par défaut : `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | Identifiant de l'app. |
| `--app-version <VERSION>` | Version. |
| `--build <BUILD>` | Numéro de build : doit augmenter à chaque release. |
| `--source-map <WHERE>` | Où va la source map : `package` (par défaut), `file` (`<package>.map` à côté du paquet) ou `none` ([Signed packages](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | Omet les tables de lignes et de colonnes du bytecode : plus petit, mais les piles d'erreurs n'ont plus de positions. |
| `--min-runtime <VERSION>` | Le runtime le plus ancien capable d'exécuter le paquet, par exemple `0.2.0` ; les runtimes plus anciens le refusent. Par défaut : la version de cette CLI ([Signed packages](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

Vérifie un paquet comme le ferait une app qui fait confiance aux racines indiquées. Sans `--root`, seule la signature propre du paquet est vérifiée. Elle affiche le SHA-256 du paquet, que `nsh revoke --package` accepte.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

Réécrit les positions du bundle (`bundle.js:LINE:COL`) d'une erreur signalée par un paquet vers vos sources et affiche le
résultat. `MAP` est une source map (`<package>.map` issu de `nsh publish --source-map file`, `bundle.js.map`) ou un paquet qui
en contient une ; `INPUT` est le texte de l'erreur (par défaut : l'entrée standard).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

Signe une liste de révocation : clés de release et paquets qui ne doivent plus se charger.

| Option | Description |
|---|---|
| `--root <ROOT>` | La clé secrète de la racine. |
| `--extend <EXTEND>` | Conserve les entrées de cette liste (la dernière publiée). |
| `--sequence <N>` | Le numéro de la liste, supérieur à tout numéro publié auparavant. Par défaut avec `--extend` : celui de cette liste plus un. |
| `--key <ID>` | Un identifiant de clé de release à révoquer. Répétable. |
| `--package <SHA256>` | Un SHA-256 de paquet à révoquer. Répétable. |
| `-o, --out <OUT>` | La liste à écrire. |

<a id="environment-variables"></a>

## Variables d'environnement

| Variable | Utilisée par | Description |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | cibles Android | Le SDK Android. Repli : `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | apps avec des crates Rust | Où les runners de l'app sont compilés. Par défaut : le `target/` de l'app. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | Le mot de passe du keystore. |
| `NSH_RUNTIME` | `run`, `package` | Un répertoire de runtime à utiliser à la place de celui situé à côté de la CLI. |
| `NSH_VERBOSE` | toutes les commandes | `1` : comme `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | La CLI `wasm-bindgen` pour une app dont les crates [appellent des API du navigateur](./web.md#browser-apis-from-rust). Par défaut : celle présente dans `PATH`. |
| `NO_COLOR` | toutes les commandes | Si défini : pas de couleurs dans les terminaux. |
