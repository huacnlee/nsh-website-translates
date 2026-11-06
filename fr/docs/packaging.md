---
title: "Empaquetage"
description: "Créez des applications Rust et TSX installables avec nsh package pour les appareils iOS, le simulateur iOS, Android, macOS, Windows, Linux et le web, avec les métadonnées de l'application, les icônes et la signature."
order: 19
group: platforms
source_hash: 74c2991490481926
---

# Empaquetage

`nsh package` transforme une app en quelque chose que l'on peut installer : un `.app` pour le simulateur iOS, un `.ipa` signé pour les appareils iOS, un `.apk` signé pour Android, un `.app` signé ad hoc pour macOS, un répertoire et `.tar.gz` pour Linux, un répertoire et `.zip` pour Windows, ou un site statique pour le web. Il n'a besoin ni d'un projet Xcode ni de Gradle.

- **Une app Rust** (`nsh.json` nomme son `"root"`) est empaquetée depuis son répertoire. `nsh` compile le runner de la cible en mode release avec votre crate intégrée et la racine montée, sans QuickJS : Cargo, la cible Rust de la plateforme (`rustup target add …`) et, pour Android, le NDK.
- **Une app TSX** nomme son point d'entrée. Son build de release (minifié, compilé en bytecode QuickJS, exactement comme `nsh build --release` le construit) est placé à côté du **runtime précompilé** livré avec NSH, sans qu'aucune chaîne d'outils Rust soit nécessaire. Une app avec sa propre crate (`"rust"` sans `"root"`) obtient des runners compilés avec sa crate.

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

La sortie est écrite dans `.nsh/out/`, sauf si vous passez `--out`. Les sections ci-dessous donnent la commande de chaque cible pour une app Rust ; une app TSX ajoute son point d'entrée (`nsh package App.tsx --target …`).

> [!NOTE]
> Pour intégrer NSH *à l'intérieur* d'une app native existante, voir [Platforms](./platforms.md#embed-in-a-native-app), et pour une app GPUI ou GPUI Kit, [GPUI](./gpui.md#embedding-in-a-gpui-app). Pour distribuer des mises à jour que les apps téléchargent et vérifient, voir [Paquets signés](./signed-packages.md).

<a id="app-metadata-30"></a>

## Métadonnées de l'app : `nsh.json`

`nsh package` lit `nsh.json` dans le répertoire de l'app (à côté du fichier d'entrée pour une app TSX). `nsh init` en écrit un :

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| Clé | Type | Par défaut | Utilisation |
|---|---|---|---|
| `name` | chaîne | le nom du répertoire de l'entrée | Le nom affiché sous l'icône (`CFBundleDisplayName`, Android `android:label`) et le nom du fichier de sortie. |
| `id` | chaîne | obligatoire | L'identifiant de bundle / le nom de package Android, au format DNS inversé sous un domaine qui vous appartient. Il nomme aussi l'emplacement où l'app conserve son [stockage](../modules/nsh.md#storage), de sorte que chaque app a le sien. `nsh package` et `nsh publish` avertissent à propos du placeholder `com.example.`. |
| `version` | chaîne | `"1.0.0"` | La version visible par l'utilisateur (`CFBundleShortVersionString`, `versionName`). |
| `build` | nombre | `1` | Le numéro de build (`CFBundleVersion`, `versionCode`). Incrémentez-le à chaque version que vous envoyez. |
| `icon` | chaîne | aucune | Un PNG carré, idéalement de 1024×1024, relatif à `nsh.json`. |

`nsh.json` contient aussi `rust` et `root` (les crates de l'app et son composant racine, [Développer avec Rust](./rust.md)), `theme` et `appearance`, `tailwind` (voir [Tailwind](./tailwind.md)) et `capabilities` (voir [Sandbox et capacités](./sandbox-and-capabilities.md)) ; [Structure du projet](./project-structure.md#nshjson) liste toutes les clés. Une clé inconnue provoque une erreur.

Chaque clé ci-dessus peut être remplacée en ligne de commande, ce qui est pratique en CI :

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

## Options

| Option | Description |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | La cible de build (obligatoire). |
| `-o, --out <dir>` | Répertoire de sortie. Par défaut `.nsh/out`. |
| `--name <name>` | Nom affiché. |
| `--id <id>` | Identifiant de bundle, tel que `com.example.app`. |
| `--app-version <version>` | Version, telle que `1.2.0`. |
| `--build <n>` | Numéro de build. |
| `--icon <png>` | Icône de l'app : un PNG carré, idéalement de 1024×1024. |
| `--sign <identity>` | iOS : l'identité de signature de code pour les appareils. |
| `--profile <file>` | iOS : le profil de provisionnement pour les appareils (`.mobileprovision`). |
| `--keystore <file>` | Android : un keystore de release (par défaut : la clé de debug). |
| `--key-alias <alias>` | Android : l'alias de la clé dans le keystore. |
| `--keystore-password <password>` | Android : le mot de passe du keystore ; également lu depuis `NSH_KEYSTORE_PASSWORD`. |
| `--abi <abi>` | Android : les ABI de l'APK, répétées ou séparées par des virgules (par défaut : `arm64-v8a` et `armeabi-v7a`). |
| `--run` | Installe et lance ensuite : dans le simulateur iOS, ou sur l'appareil ou l'émulateur Android que `adb` voit ; les apps macOS, Linux et Windows sont lancées sur cette machine ; un site web est servi sur cette machine et ouvert dans le navigateur. Non disponible pour `--target ios`. |

<a id="ios-simulator"></a>

## Simulateur iOS

```sh
nsh package --target ios-simulator --run
```

Écrit `.nsh/out/<Name>.app`, signé ad hoc (le simulateur exige une signature mais pas d'identité). Avec `--run`, la commande démarre un simulateur si aucun n'est en cours d'exécution, installe l'app et la lance. Nécessite Xcode.

<a id="ios-devices"></a>

## Appareils iOS

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

Écrit `.nsh/out/<Name>.ipa`, prêt pour TestFlight, les outils d'envoi vers l'App Store ou l'installation directe (selon le profil). Voici ce qui se passe :

- Le profil de provisionnement est copié dans l'app sous le nom `embedded.mobileprovision`.
- Les entitlements proviennent du profil. NSH vérifie que l'identifiant d'application du profil couvre le `id` de l'app (les profils génériques tels que `TEAMID.*` ou `TEAMID.com.example.*` fonctionnent) et s'arrête avec une erreur dans le cas contraire.
- L'app est signée avec `codesign` à l'aide de l'identité, puis compressée en `.ipa` (`Payload/<Name>.app`).

Trouvez vos identités avec :

```sh
security find-identity -v -p codesigning
```

Sans `--sign` ni `--profile`, NSH écrit un `.nsh/out/<Name>.app` non signé et vous le signale ; il ne peut pas être installé tel quel sur un appareil.

L'app prend en charge iPhone et iPad, en portrait et en paysage (portrait à l'envers uniquement sur iPad), et nécessite iOS 15.0 ou plus récent.

## Android

```sh
nsh package --target android --run
```

Écrit `.nsh/out/<Name>.apk`. L'APK est assemblé directement avec les outils de build du SDK (`aapt2`, `zipalign`, `apksigner`), sans Gradle. Prérequis :

- Le SDK Android, trouvé via `ANDROID_HOME` (ou `ANDROID_SDK_ROOT`, ou `~/Library/Android/sdk`), avec les build tools et le package `platforms;android-35`. NSH vous indique la commande `sdkmanager` lorsqu'un élément manque.
- Un JDK, pour créer le keystore de debug la première fois.
- Pour une app Rust, le NDK Android (`sdkmanager "ndk;<version>"`, ou `ANDROID_NDK_HOME`), qui compile son `libnsh.so`.

L'app cible l'API 35 et nécessite l'API 28 (Android 9) ou plus récente. Elle contient du code natif pour les ABI des téléphones, `arm64-v8a` et `armeabi-v7a` ; avec `--run`, également celle de l'appareil, telle que le `x86_64` d'un émulateur. `--abi` les choisit vous-même, par exemple `--abi arm64-v8a` pour les téléphones 64 bits uniquement, l'APK le plus petit :

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Signature pour la release

Sans `--keystore`, l'APK est signé avec la clé de debug standard (`~/.android/debug.keystore`, créée si elle est absente), et NSH avertit qu'il ne convient pas aux releases destinées aux stores. Pour une release, créez un keystore une seule fois et passez-le :

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

Préférez la variable d'environnement à `--keystore-password` afin que le mot de passe ne se retrouve pas dans l'historique de votre shell.

## macOS

```sh
nsh package --target macos --run
```

Écrit `.nsh/out/<Name>.app` : l'exécutable dans `Contents/MacOS/`, ainsi que `nsh/assets/…`, `nsh/app.json` (le titre de la fenêtre et l'apparence de l'app) et le `nsh/bundle.nshc` d'une app TSX dans `Contents/Resources/`. L'app est signée ad hoc et nécessite macOS 14 ou plus récent ; pour la distribuer, signez-la avec un Developer ID et notarisez-la. Voir [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

Écrit `.nsh/out/<Name>/` (l'exécutable `<Name>`, `nsh/assets/…`, `nsh/app.json` avec le titre de la fenêtre et l'identifiant de l'application, le `nsh/bundle.nshc` d'une app TSX, `<id>.desktop` et l'icône `<id>.png`) et la même chose que `.nsh/out/<Name>.tar.gz`. Empaquetez sous Linux : le runner est compilé pour la machine sur laquelle il est construit. GTK 4 (4.14 ou plus récent), Pango et WebKitGTK 6.0 (pour les vues web) doivent être installés là où l'app s'exécute. Pour l'installer ainsi que l'entrée de bureau : [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

Écrit `.nsh\out\<Name>\` (l'exécutable `<Name>.exe` avec l'icône de l'app, `nsh\assets\…`, `nsh\app.json` avec le titre de la fenêtre, l'identifiant de l'app, la version et l'apparence, et le `nsh\bundle.nshc` d'une app TSX) et la même chose que `.nsh\out\<Name>.zip`. Une app TSX n'a besoin d'aucun outil ; le runner d'une app Rust est compilé avec les Visual Studio Build Tools. Empaquetez sous Windows : le runner est compilé pour la machine sur laquelle il est construit, et seul Windows peut intégrer l'icône. L'app s'exécute depuis l'endroit où son répertoire est copié ; rien n'est installé. Voir [Windows](./windows.md#packaging).

## Web

```sh
nsh package --target web --run
```

Écrit `.nsh/out/<Name>/`, un site statique : `index.html`, `manifest.webmanifest`, le script de la page (`nsh.<digest>.js`) et `nsh.<digest>.wasm` (le moteur et la crate d'une app Rust ; pour une app TSX, le runtime, à côté du module ES de l'app `app.<digest>.js`), ses assets et ses icônes, chacun nommé d'après son contenu afin que les hébergeurs puissent les mettre en cache indéfiniment. Déployez le répertoire sur n'importe quel serveur web ou CDN ; `--run` le sert sur `http://127.0.0.1:4173/` pour que vous l'ouvriez. En-têtes de cache et intégration : [Web](./web.md#publish-an-app).

<a id="icons"></a>

## Icônes

Fournissez un PNG carré, idéalement de 1024×1024, dans `nsh.json` (`"icon": "icon.png"`) ou avec `--icon` :

- **iOS :** compilé par `actool` de Xcode dans le catalogue d'assets de l'app (`Assets.car`), qui en dérive toutes les tailles dont iOS a besoin.
- **Android :** redimensionné en 192×192 et utilisé comme icône du lanceur (`mipmap-xxxhdpi`).
- **macOS :** converti par `sips` en `AppIcon.icns`.
- **Linux :** copié sous le nom `<id>.png`, que le fichier `.desktop` désigne comme son `Icon`.
- **Windows :** redimensionné de 16 à 64 pixels et à 256 pixels, puis intégré à l'exécutable comme son icône, que la fenêtre, l'Explorateur et la barre des tâches affichent.
- **Web :** redimensionné à 32 pixels (le favicon), 180 (`apple-touch-icon`), 192 et 512 (le manifeste d'app web).

Sans icône, le système affiche la sienne par défaut.

<a id="what-is-inside"></a>

## Contenu du paquet

Le paquet d'une app Rust est son runner, compilé avec votre crate et sa racine montée, ainsi que les assets que ses crates enregistrent (`assets!()`). Le paquet d'une app TSX contient son bytecode, son `capabilities.json` (lorsqu'elle déclare des capacités) et les assets qu'elle importe, à côté du runtime précompilé :

| Cible | Runtime | Une app TSX |
|---|---|---|
| iOS | l'exécutable `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (sans symboles, stocké non compressé, aligné sur 16 Ko) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | l'exécutable `nsh-macos-app`, renommé `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | l'exécutable `nsh-linux-app`, renommé `<Name>` | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | l'exécutable `nsh-windows-app.exe`, renommé `<Name>.exe` | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

Une app empaquetée n'enregistre aucun [composant natif](./native-components.md) ; pour cela, intégrez NSH dans votre propre app.

<a id="finding-the-runtime"></a>

## Localisation du runtime

Une app Rust compile ses propres runners. Pour les apps TSX, `nsh package` cherche le runtime précompilé à côté du CLI (`bin/../runtime` dans la distribution). Dans un checkout de NSH, il utilise `target/<triple>/<profile>` et `target/android/<profile>`, avec le profil du CLI lui-même (un CLI en debug utilise des runtimes en debug) : compilez-les avec `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (ou `aarch64-apple-ios` pour les appareils) et `cargo xtask android` (ajoutez `--release` pour un CLI en release) ; `nsh-macos-app` (sous macOS), `nsh-linux-app` (sous Linux) et `nsh-windows-app` (sous Windows) sont compilés pour cette machine dans `target/<profile>` (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`) ; le runtime web est compilé avec le profil `web` quel que soit celui du CLI, dans `target/wasm32-unknown-unknown/web/`. La variable d'environnement `NSH_RUNTIME` pointe le CLI vers un autre répertoire organisé comme le `runtime/` de la distribution (`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...).

<a id="see-also"></a>

## Voir aussi

- [CLI](./cli.md) : toutes les commandes
- [Paquets signés](./signed-packages.md) : mises à jour téléchargées par les apps
- [Structure du projet](./project-structure.md) : `nsh.json` et les fichiers d'une app
