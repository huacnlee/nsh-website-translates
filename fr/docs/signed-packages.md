---
title: "Paquets signés"
description: "Distribuez du code d'application que les applications hôtes téléchargent et vérifient : clés, certificats, nsh publish, nouvelle signature, vérification, révocation et protection contre le retour en arrière."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# Packages signés

Un package signé (`.nshpkg`) permet à une application hôte d'exécuter du code NSH qu'elle n'embarque pas : une mise à jour de ses propres écrans NSH, ou une mini-app tierce. `nsh publish` compile l'application et la signe ; l'application hôte vérifie la signature, la chaîne de certificats, les révocations et le numéro de build avant que quoi que ce soit ne s'exécute.

Un package contient du TSX. Le code Rust de l'application hôte (une application écrite en Rust, les composants, modules et classes de ses crates) fait partie de l'application hôte elle-même et est livré avec elle ; le TSX d'un package l'importe par ses spécificateurs, comme tout TSX ([Développer avec Rust](./rust.md#extending-a-rust-app-with-tsx)). Une application Rust garde donc son cœur en Rust et livre sous forme de packages signés les écrans qui changent souvent.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH vérifie et exécute les packages ; il ne les distribue pas. L'origine des packages (votre serveur de mises à jour, un CDN, un catalogue de mini-apps) et le moment où l'application les télécharge relèvent de l'application hôte.

<a id="why-packages-are-signed"></a>

## Pourquoi les packages sont signés

Le JS qu'exécute une application hôte peut accéder à tout ce que l'application [autorise](./sandbox-and-capabilities.md) ; il doit donc provenir d'une source en laquelle l'application a confiance. Il y a une seconde raison : NSH livre les applications sous forme de bytecode QuickJS, qui se charge plus vite que le code source, mais QuickJS ne valide pas le bytecode, et un bytecode forgé peut corrompre la mémoire. NSH ne charge donc du bytecode que depuis les ressources propres de l'application (signées par le système), depuis le serveur de développement auquel le développeur s'est connecté, et depuis des packages vérifiés. Tout le reste doit être du code source JS.

<a id="keys-two-levels"></a>

## Les clés : deux niveaux

- Une **clé racine** reste hors ligne. Les applications hôtes font confiance à sa clé publique ; elles peuvent faire confiance à plusieurs racines, ce qui permet de renouveler une racine.
- Une racine **certifie des clés de publication** : un certificat nomme la clé de publication, les identifiants d'application pour lesquels elle peut signer et une fenêtre de validité.
- **Les packages sont signés par une clé de publication** et embarquent son certificat. Les clés de publication peuvent donc être renouvelées (ou révoquées) sans mettre à jour les applications hôtes, qui ne connaissent que la racine.

Chaque clé possède un identifiant dérivé de sa clé publique (les 8 premiers octets de son SHA-256, en hexadécimal), affiché par chaque commande.

<a id="create-the-keys"></a>

### Créer les clés

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

Chaque clé tient en deux fichiers : `<name>.secret` (lisible uniquement par son propriétaire) et `<name>.pub`, chacun d'une ligne en base64. `nsh
keygen` n'écrase jamais une clé existante.

> [!CAUTION]
> Gardez `root.secret` hors ligne, par exemple sur un disque chiffré dans un coffre. Quiconque la possède peut certifier des clés que toutes les applications hôtes faisant confiance à la racine acceptent. Les clés de publication se trouvent sur la machine de build ou dans les secrets de la CI.

<a id="certify-a-release-key"></a>

### Certifier une clé de publication

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Option | Description |
|---|---|
| `--root <file>` | La clé secrète de la racine. |
| `--key <file>` | La clé publique de la clé de publication. |
| `--apps <pattern>` | Identifiants d'application pour lesquels elle peut signer : `*` (tous), `com.example.*` (les identifiants sous `com.example.`) ou un identifiant exact. Répétable. |
| `--days <n>` | Durée pendant laquelle elle peut signer, à partir de maintenant. 365 par défaut. |
| `-o, --out <file>` | Le certificat à écrire. |

Le certificat est un petit fichier JSON ; il n'est pas secret.

<a id="publish-a-package"></a>

## Publier un package

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` compile l'application en mode release et la signe. L'identifiant, le nom, la version et le build de l'application proviennent de `nsh.json` situé à côté du point d'entrée, et peuvent être remplacés par les options :

| Option | Description |
|---|---|
| `--key <file>` | La clé secrète de la clé de publication. |
| `--cert <file>` | Son certificat. |
| `-o, --out <file>` | Le package à écrire. `.nsh/out/<id>-<build>.nshpkg` par défaut. |
| `--id <id>` | Identifiant d'application, tel que `com.example.app`. |
| `--app-version <version>` | Version, telle que `1.2.0`. |
| `--build <n>` | Numéro de build. Obligatoire (ici ou dans `nsh.json`) ; il doit augmenter à chaque publication. |
| `--source-map <where>` | `package` (par défaut) : dans le package. `file` : dans `<package>.map` à côté, hors du package. `none` : omise. Voir [Erreurs des packages publiés](#errors-from-published-packages). |
| `--strip-debug` | Omet les tables de lignes et de colonnes du bytecode : un package plus petit dont les piles d'erreurs n'ont pas de positions. |
| `--min-runtime <version>` | Le runtime le plus ancien qui exécute le package, tel que `0.2.0` (`nsh.json` `minRuntime`). Par défaut : la version de cette CLI. Voir [Quels runtimes exécutent un package](#which-runtimes-run-a-package). |

`nsh publish` refuse de signer ce qu'un appareil refuserait : le certificat doit couvrir l'identifiant de l'application et l'heure actuelle.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### Quels runtimes exécutent un package

Un package nomme le runtime NSH le plus ancien qui l'exécute, et les applications hôtes dotées d'un runtime plus ancien le refusent avant que quoi que ce soit ne s'exécute :

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

Par défaut, il s'agit de la version de la CLI qui a construit le package : le bundle est compilé avec les modules de cette CLI, ce runtime est donc celui dont on sait qu'il l'exécute. Lorsque des applications hôtes déployées ont un runtime plus ancien et que l'application n'utilise que ce que ce runtime propose, publiez pour lui avec `--min-runtime` (ou `minRuntime` dans `nsh.json`) :

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

La version est `MAJOR.MINOR.PATCH` ; un suffixe de pré-version (`0.2.0-beta.1`) compte comme la version sans ce suffixe. Elle ne peut pas être plus récente que la CLI. Essayez le package sur une application hôte dotée de ce runtime avant de le téléverser : un import ou une fonction que le runtime plus ancien ne possède pas échoue au chargement du module.

<a id="what-a-package-holds"></a>

### Ce que contient un package

Un package est un fichier unique : un en-tête JSON (identifiant d'application, nom, version, build, capacités déclarées, version du bytecode, runtime minimal, heure de signature, certificat de la clé de publication et table des fichiers avec leur SHA-256), puis les fichiers, puis la signature Ed25519 de la clé de publication portant sur tout ce qui précède. Les fichiers sont :

- le code source JS de l'application (toujours),
- son bytecode, utilisé uniquement lorsque le runtime de l'appareil a la même version de bytecode (sinon c'est le code source qui s'exécute, de sorte qu'un package continue de fonctionner sur les runtimes plus récents),
- sa source map (sauf si le package a été publié avec `--source-map file` ou `none`),
- les ressources qu'il importe (images, polices).

L'identité du package, utilisée pour la révocation, est le SHA-256 du fichier entier.

<a id="packages-from-newer-versions-of-nsh"></a>

### Packages issus de versions plus récentes de NSH

Une application hôte exécute les packages signés par un `nsh publish` plus récent, tant que son runtime est au moins égal au [runtime minimal](#which-runtimes-run-a-package) du package. Ce qu'une version plus récente ajoute et que le runtime de l'hôte ne connaît pas est ignoré, et n'élargit jamais ce que le package peut faire :

- les champs d'en-tête et les fichiers qu'il ne connaît pas sont ignorés (ils restent couverts par la signature et leurs hachages), sauf si le package marque un champ comme devant être compris par son runtime : les runtimes plus anciens le refusent alors ;
- les [capacités](./sandbox-and-capabilities.md) qu'il ne connaît pas ne sont pas accordées, et une capacité ou une autorisation `http` comportant une clé qu'il ne connaît pas est entièrement abandonnée, car cette clé peut la restreindre.

Ce qui a été ignoré est consigné dans les journaux au chargement du package.

<a id="sign-a-package-again"></a>

## Re-signer un package

Une plateforme qui distribue les packages de plusieurs applications peut tous les signer avec une clé qui lui est propre : la CI construit chaque package et le signe avec une clé à laquelle ses applications de test font confiance, puis la plateforme le re-signe avec la clé à laquelle les applications de production font confiance.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Option | Description |
|---|---|
| `--key <file>` | La clé secrète de la clé de publication. |
| `--cert <file>` | Son certificat. |
| `-o, --out <file>` | Le package à écrire. Il peut s'agir du package lu. Par défaut : `.nsh/out/<id>-<build>.nshpkg`. |

Le package conserve tout ce que la CI y a mis : les fichiers, l'identifiant d'application, la version et le build, les capacités déclarées, le [runtime minimal](#which-runtimes-run-a-package) et ce qu'une [version plus récente de NSH](#packages-from-newer-versions-of-nsh) y a écrit. Le certificat, l'heure de signature et la signature deviennent ceux de la nouvelle clé ; le package a donc son propre SHA-256, celui par lequel le [révoquer](#revoke-keys-and-packages).

Avant de signer, `nsh publish` vérifie que le package est intact (signé par la clé que nomme son certificat, table des fichiers couvrant les données, chaque fichier correspondant à son hachage) et que le nouveau certificat couvre l'identifiant de l'application et l'heure actuelle. À partir de là, la nouvelle signature garantit le package, son bytecode compris ; une plateforme re-signe donc les packages issus de ses propres builds. Les outils Rust re-signent avec `nsh_package::resign(&bytes, &key, &certificate)`.

<a id="verify-a-package"></a>

## Vérifier un package

`nsh verify` contrôle un package exactement comme le ferait une application hôte faisant confiance aux racines indiquées :

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Option | Description |
|---|---|
| `--root <file>` | La clé publique d'une racine de confiance. Répétable. Sans aucune, seule la signature propre du package est vérifiée. |
| `--revocations <file>` | Une liste de révocation à appliquer d'abord. |

Un appareil vérifie, dans l'ordre :

1. la signature du certificat par une racine de confiance ;
2. que la clé de publication n'est pas révoquée ;
3. la signature du package par la clé de publication ;
4. que le certificat couvre l'identifiant de l'application et l'heure de signature ;
5. le runtime minimal dont le package a besoin ;
6. que la table des fichiers couvre exactement les données et que chaque fichier correspond à son hachage ;
7. que le package lui-même n'est pas révoqué ;
8. que son build n'est pas plus ancien que le plus haut build de cette application accepté auparavant (protection contre le retour en arrière).

Un package refusé lève une erreur qui indique quelle vérification a échoué ; l'application qui s'exécutait continue de s'exécuter.

<a id="revoke-keys-and-packages"></a>

## Révoquer des clés et des packages

Une racine signe des **listes de révocation** : des clés de publication et des packages qui ne doivent plus se charger.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Option | Description |
|---|---|
| `--root <file>` | La clé secrète de la racine. |
| `--extend <file>` | Conserve les entrées de cette liste (la dernière publiée). |
| `--sequence <n>` | Le numéro de la liste, supérieur à celui de toute liste publiée auparavant. Avec `--extend`, vaut par défaut celui de cette liste plus un. |
| `--key <id>` | Un identifiant de clé de publication à révoquer. Répétable. |
| `--package <sha256>` | Le SHA-256 d'un package (tel que `nsh verify` l'affiche) à révoquer. Répétable. |
| `-o, --out <file>` | La liste à écrire. |

Un magasin de confiance n'accepte qu'une liste dont le numéro de séquence est supérieur à celui qu'il possède ; une ancienne liste ne peut donc pas être rejouée pour annuler une révocation. Publiez la liste la plus récente là où vos applications la récupèrent, et appliquez-la avec `updateRevocations` avant d'ouvrir des packages.

<a id="rollback-protection"></a>

## Protection contre le retour en arrière

Lorsqu'une application hôte accepte un package, son magasin de confiance enregistre le numéro de build pour cet identifiant d'application et refuse dès lors les builds plus anciens. Un attaquant qui aurait obtenu un ancien package signé comportant une vulnérabilité connue ne peut pas faire exécuter ce package à l'application. L'enregistrement est conservé dans le répertoire d'état du magasin (`nsh-trust.json`), et survit donc aux redémarrages. Sur GPUI, une application hôte peut l'enregistrer plus tard, une fois que le nouveau package a prouvé son bon fonctionnement (`verify_package`, puis `accept_package` ; voir ci-dessous).

<a id="loading-packages-in-a-host-app"></a>

## Charger des packages dans une application hôte

La vérification calcule le hachage du package entier et extrait ses ressources (une fois par package, dans le répertoire du magasin de confiance) ; elle s'exécute donc hors du thread d'interface, tandis que l'exécution du résultat a lieu sur celui-ci.

**GPUI (Rust)**, où l'application hôte peut aussi n'accepter un package qu'une fois qu'il a prouvé son bon fonctionnement :

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)** :

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)** :

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

Tant qu'un package n'est pas accepté, le build accepté précédemment reste vérifiable ; une application hôte dont le nouveau package échoue peut donc revenir à celui qu'elle exécutait (les erreurs fatales de `AppView::on_error`, ou un crash avant l'acceptation, en sont les signaux). Les builds plus anciens que celui accepté restent refusés, et un package révoqué entre-temps n'est pas accepté. `load_package` vérifie et accepte en une seule fois, comme le fait `openPackage` sur iOS et Android.

Les [capacités](./sandbox-and-capabilities.md) déclarées par le package l'accompagnent : un package ne peut faire que ce qu'il déclare, et uniquement ce que l'application hôte accorde en plus.

API complète : [GPUI](./gpui.md#embedding-in-a-gpui-app), [Intégration dans les applications iOS](./ios.md#signed-packages), [Intégration dans les applications Android](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## Erreurs des packages publiés

Le bytecode d'un package conserve ses tables de lignes et de colonnes ; ses erreurs ont donc des positions, et le runtime les associe à vos sources grâce à la source map du package avant de les transmettre au gestionnaire d'erreurs de l'application hôte :

```text
Error: boom
    at n (App.tsx:5:3)
```

La source map contient les sources d'origine de votre application et est souvent le plus gros fichier d'un package : environ la moitié des 2,6 Mo de l'exemple gallery. Pour la garder pour vous, publiez-la à côté du package :

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

Les appareils signalent alors les positions du bundle (`at n (bundle.js:1:80)`). Conservez la map avec le package auquel elle appartient, et associez ce que l'application hôte a signalé avec `nsh symbolicate` :

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` lit le texte de l'erreur depuis un fichier ou l'entrée standard et accepte un fichier map ou un package qui en contient une. Les tables de lignes ajoutent environ un cinquième au bytecode (3 à 5 % d'un package avec sa map) ; `--strip-debug` les omet, et les piles affichent alors `at n (<null>:0:1)`, sans rien à associer.

<a id="trying-a-package-in-development"></a>

## Essayer un package en développement

Les hôtes de développement qu'installe `nsh run` peuvent exécuter un package comme le ferait une application d'intégration.

Sur iOS, l'exécutable hôte accepte `--package <file>` et un ou plusieurs `--root <root.pub>`. Une fois que `nsh run` a installé l'hôte dans le simulateur (`--target ios`) :

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

Sur Android, l'hôte de développement (`DevActivity`, installé par `nsh run --target android`) accepte les extras `package` (un chemin sur l'appareil) et `root` (clés publiques en base64, séparées par des virgules) :

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

Leur état de confiance se trouve dans le répertoire temporaire (iOS) ou de cache (Android) ; les builds plus anciens que l'un de ceux qu'ils ont acceptés y sont donc aussi refusés.
<a id="a-release-checklist"></a>

## Liste de contrôle de publication

1. Gardez la clé racine hors ligne ; certifiez une clé de publication par équipe ou par famille d'applications, pour une durée d'un an maximum.
2. Incrémentez `build` dans `nsh.json` à chaque publication ; `nsh publish` refuse tout paquet qui n'en comporte pas.
3. Exécutez `nsh verify --root root.pub` sur le paquet avant de le téléverser.
4. Intégrez `root.pub` dans l'application hôte ; distribuez les listes de révocation séparément, afin de pouvoir révoquer sans mise à jour de l'application.
5. Si une clé de publication fuite, révoquez-la (`nsh revoke --extend … --key <id>`), certifiez-en une nouvelle et publiez à nouveau.
6. Avec une plateforme qui signe pour ses applications, donnez à la CI une racine qui lui est propre, à laquelle seules les applications de test font confiance, et intégrez la racine de la plateforme dans les applications de production ; la plateforme signe de nouveau les paquets de la CI (`nsh publish <package>`).

<a id="see-also"></a>

## Voir aussi

- [Sandbox et capabilities](./sandbox-and-capabilities.md)
- [Intégration dans les applications iOS](./ios.md), [Intégration dans les applications Android](./android.md)
- [CLI](./cli.md)
