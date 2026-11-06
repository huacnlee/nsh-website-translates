---
title: "Modules standard"
description: "Onze modules standard à la Node : utilitaires LLRT épinglés, ainsi que fichiers, processus et réseau soumis à une vérification des capacités."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell fournit onze modules standard pour TSX, importés par leur nom simple (le code Rust utilise les bibliothèques propres à Rust : [Depuis Rust](#from-rust)) : des API de forme Node compatibles avec celles de gpui-shell, exécutées dans la VM de l'application sur le runtime natif de NSH, avec leurs capacités vérifiées en Rust. Leurs déclarations TypeScript dans `.nsh/types` sont générées à partir des mêmes spécifications que les modules, de sorte que ce que montrent les types est ce que le runtime exporte.

| Module | Exports |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, export par défaut (LLRT) ; `Buffer` est aussi un global |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, export par défaut (LLRT) ; `crypto` est aussi un global |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, export par défaut (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, export par défaut ; `URL` et `URLSearchParams` sont des classes globales de NSH |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, chacun avec sa forme `Sync`, export par défaut (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, export par défaut |
| `console` | export par défaut : le `console` de la VM (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, export par défaut |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, export par défaut ; l'objet par défaut possède aussi `env` et `dataDir` et constitue le global `process` |
| `net` | `connect`, `Socket`, export par défaut |
| `websocket` | `connect(url, options?)` résolvant un `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`), `WebSocketConnection`, export par défaut ; le constructeur global `WebSocket` sur les hôtes natifs |

<a id="from-rust"></a>

## Depuis Rust

Le code Rust accomplit le même travail avec la bibliothèque standard de Rust et crates.io, dans le code natif propre à l'application : les appels bloquants s'exécutent sur les threads du runtime avec `blocking(…)` et les appels asynchrones avec `background(…)` (`nsh_core::prelude`), et leurs résultats reviennent au composant dans une tâche. Les `capabilities` de `nsh.json` régissent le TSX de l'application et les services de NSH (`fetch`, le presse-papiers) ; le code Rust de l'application s'exécute avec les permissions du processus de l'application. Dans les applications navigateur, le code Rust accède au réseau avec `fetch` et conserve les données avec `nsh_core::storage::Storage`.

| Module | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, la crate `base64` |
| `crypto` | des crates telles que `sha2`, `hmac`, `rand` et `uuid` |
| `path` | `std::path` |
| `url` | la crate `url` |
| `zlib` | des crates telles que `flate2`, `brotli` et `zstd` |
| `os` | `std::env::consts`, `os()` |
| `console` | la crate `log` |
| `fs/promises` | `std::fs` dans `blocking(…)` ; `Storage` pour les données clé-valeur |
| `process` | `std::process::Command` dans `blocking(…)` |
| `net` | `std::net::TcpStream` dans `blocking(…)`, ou `tokio::net` dans `background(…)` |
| `websocket` | une crate telle que `tokio-tungstenite` dans `background(…)` |

<a id="imports-and-generated-types"></a>

## Imports et types générés

Chaque module s'importe exactement sous le nom indiqué dans le tableau : `import { join } from "path"`, `import fs from "fs/promises"`. Le bundler conserve ces imports et le runtime les sert nativement ; le catalogue se limite à ces onze noms. `buffer`, `crypto`, `path`, `url` et `zlib` sont les implémentations de LLRT, figées sur `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`, avec des déclarations projetées depuis cette révision sur les exports dont dispose le runtime. Les autres sont propres à NSH. NSH conserve l'identité de ses classes URL, Blob, stream et event.

Les onze modules se chargent sur les hôtes natifs et dans les applications navigateur. `Buffer`, le hachage, la cryptographie et la compression utilisent la même implémentation Rust portable en WebAssembly, y compris pour les API synchrones ; les valeurs aléatoires utilisent l'entropie cryptographique du navigateur. Les opérations `path` du navigateur utilisent des chemins POSIX et un répertoire de travail virtuel `/`. Les fichiers du navigateur utilisent un stockage persistant privé à l'application, et les WebSockets utilisent le transport du navigateur. L'exécution de processus et les appels TCP bruts échouent avec `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` dans les navigateurs.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Comparaison avec Node.js et gpui-shell

Les modules suivent les noms et les formes de Node pour le sous-ensemble qu'ils exportent, et le comportement de gpui-shell là où celui-ci en définit un. Les choix propres à NSH :

- `exists` de `fs/promises` vaut `true` pour un lien symbolique dont la cible est absente, et `unlink`, `rename`, `rmdir`, `lstat` et `readlink` agissent sur le lien symbolique lui-même.
- `Stats` et `Dirent` ont leurs champs (`size`, `mtimeMs`, `name`, ...) comme propriétés propres, comme ceux de Node, et `isFile()`, `isDirectory()` et `isSymbolicLink()` sur leur prototype.
- Un écouteur `ChildProcess` reçoit la charge utile de l'événement : le texte de sortie, ou le `{ code, signal }` de la sortie (avec `error` et `errorCode` lorsque le runtime a mis fin à l'enfant). `on` renvoie l'enfant. `run` résout `{ code, signal, stdout, stderr }` : la sortie de gpui-shell avec le signal qui a mis fin à l'enfant.
- L'environnement d'un enfant est un petit ensemble fourni par l'hôte, plus les noms accordés à l'application, et il s'exécute dans le répertoire de données de l'application ou dans un `cwd` au sein d'une racine `fs.write` ([Processus](#processes)).
- `process.platform`, `process.arch`, `os.platform()` et `os.arch()` donnent les noms `std::env::consts` de Rust, comme ceux de gpui-shell : `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` ; `"aarch64"`, `"x86_64"` ([Métadonnées de l'OS](#os-metadata-and-logging)).
- `process.dataDir` vaut `null` lorsque l'hôte n'a pas de répertoire de données ; `process.exit` demande à l'hôte de fermer la surface de l'application.
- Les limites font partie de chaque API : les tailles, les nombres et les délais sont indiqués avec chaque module ci-dessous.

<a id="failures"></a>

## Échecs

Une fonction qui renvoie une promesse signale chaque échec en la rejetant, comme le fait `fs/promises` de Node : un argument incorrect, un chemin ou un hôte non accordé à l'application, une limite épuisée et une erreur d'E/S, de la même façon, de sorte qu'un seul `catch` (ou `.catch`) les traite tous. Une fonction synchrone (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, le constructeur du global `WebSocket` et `send`) lève une exception. Un mauvais usage (un argument du mauvais type, une option hors de sa plage) est une `TypeError` ou une `RangeError`. Tout échec qu'une application peut gérer porte un `code`, qui reste identique d'une version à l'autre ; le message est rédigé pour les humains et peut changer, donc les applications se branchent sur `code` :

| `code` | Signification |
|---|---|
| `ERR_ACCESS_DENIED` | Les `capabilities` de l'application n'autorisent pas l'appel. L'erreur contient `permission`, la clé de la capacité dans `nsh.json` (`"fs"`, `"process"`, `"network"`), et `resource`, ce qui a été demandé : le chemin, la commande (`"exit"` pour `process.exit`), le `"host:port"` d'un socket ou l'URL du WebSocket |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | L'appel relève d'autres plateformes : les fichiers fonctionnent sur les ordinateurs de bureau et dans les navigateurs, les processus sur les ordinateurs de bureau, les sockets TCP sur les hôtes natifs, `os.homedir()` sur les hôtes qui configurent un répertoire personnel |
| `ERR_NSH_QUOTA_EXCEEDED` | Une limite du runtime est épuisée : opérations ou données en cours, enfants, sockets, WebSockets, octets en attente d'envoi, écouteurs |
| `ETIMEDOUT` | L'appel a dépassé le délai : le `timeoutMs` de `run`, une connexion, une poignée de main WebSocket, une écriture ou une fermeture |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | La réponse du système d'exploitation, avec les codes de Node ; `EACCES` et `EPERM` correspondent au refus d'un fichier par l'OS, indépendamment des capacités de l'application |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | Les codes de Node pour une taille dépassant une limite, une connexion fermée et une sortie dépassant la capture de `run` |

```tsx
import fs from "fs/promises";

async function loadSettings(): Promise<string> {
  try {
    return await fs.readFile("${dataDir}/settings.json", "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "{}";
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.permission} ${error.resource}`);
    throw error;
  }
}
```

Une application hôte peut accorder moins que ce que l'application déclare ([Sandbox et capacités](../docs/sandbox-and-capabilities.md)) ; une application traite donc `ERR_ACCESS_DENIED` comme elle traite une requête échouée.

<a id="os-metadata-and-logging"></a>

## Métadonnées de l'OS et journalisation

`os.platform(): string` et `os.arch(): string` indiquent l'OS et l'architecture réels de l'hôte natif, et `process.platform` et `process.arch` contiennent les mêmes valeurs. Ce sont les noms de `std::env::consts::OS` et `ARCH` de Rust, comme ceux de gpui-shell : `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` pour l'OS, `"aarch64"`, `"x86_64"` pour l'architecture, de sorte que les applications les comparent directement (`process.platform === "macos"`). `os.EOL: string` est le séparateur de ligne de l'hôte. `os.homedir(): string` renvoie un chemin absolu configuré du répertoire personnel de l'hôte ; si aucun n'est configuré, elle lève une erreur avec `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Les chemins de répertoires sont des métadonnées : les opérations sur les fichiers exigent toujours les autorisations `fs.read` / `fs.write`.

Les applications navigateur lisent un objet `process.env` vide, et `os.homedir()` y lève `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, puisque les chemins personnels et les variables d'environnement relèvent des hôtes natifs.

`import console from "console"` partage l'objet global `console` de la VM. Le module n'a qu'un export par défaut, qui prend en charge `log`, `info`, `debug`, `warn`, `error`, chacun avec la signature `(...values: unknown[]): void`. Il utilise le formatage du logger de NSH.

## Compression

`zlib` est celui de LLRT, avec une borne ajoutée par NSH : chaque décompression (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` et leurs formes `Sync`) produit au plus 64 MiB, ou la limite de tas de la VM lorsqu'elle est plus petite. Une sortie plus longue lève une `RangeError`, comme le fait Node.js pour `maxOutputLength` ; le `maxOutputLength` propre à une application définit une borne plus basse pour un appel. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` et `crypto.randomBytes` lèvent une `RangeError` (`code` `ERR_OUT_OF_RANGE`) pour une taille supérieure à la limite de tas de la VM, ou à 1 GiB en l'absence de limite ; `allocUnsafe` renvoie de la mémoire mise à zéro.

<a id="files"></a>

## Fichiers

`fs/promises` lit et écrit des fichiers natifs sur les hôtes de bureau (macOS, Windows et Linux), et des fichiers de navigateur privés à l'application via l'Origin Private File System (OPFS). Chaque chemin est vérifié par rapport à `capabilities.fs` avant le début de l'opération : racines `read` pour `readFile`, `readdir`, `stat`, `lstat`, `readlink` et `exists`, racines `write` pour `writeFile`, `mkdir`, `rename`, `unlink` et `rmdir`. Chaque échec rejette la promesse : un chemin hors des autorisations est rejeté avec `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` le chemin tel que l'application l'a écrit), avant tout travail sur le disque.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

Les racines sont des chemins absolus, `${dataDir}` (le répertoire de données de cette application, choisi par l'hôte), `${pluginDir}` (le répertoire de l'application), `${homeDir}`, ou des chemins relatifs au répertoire de l'application. Un chemin relatif dans un appel est résolu tour à tour dans chaque racine accordée. Un hôte embarquant peut restreindre davantage les autorisations. Chaque opération reste à l'intérieur de sa racine accordée, liens symboliques compris ; un chemin absolu est vérifié tel qu'il est écrit, de sorte qu'une racine s'atteint par son propre chemin (ou son chemin résolu), et non par un lien situé en dehors d'elle. `lstat`, `readlink`, `exists`, `unlink`, `rename` et `rmdir` agissent sur le lien symbolique lui-même : `exists` vaut `true` pour un lien symbolique dont la cible est absente, et `unlink` supprime le lien et conserve sa cible.

Les échecs portent les propriétés d'erreur de Node : `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ... ; `EILSEQ` pour un texte qui n'est pas en UTF-8, `ERR_FS_FILE_TOO_LARGE` au-delà de la limite de lecture), `syscall` et `path`, de sorte que `error.code === "ENOENT"` permet de distinguer un fichier manquant. Un chemin hors des autorisations est rejeté avec `ERR_ACCESS_DENIED`, un appel sur iOS ou Android (dont les applications conservent leurs données avec [`Storage`](./nsh.md#storage)) avec `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, et un argument incorrect (un encodage ou une option inconnus) avec une `TypeError`.

`readFile` renvoie un `Uint8Array`, ou une chaîne avec `"utf8"`, et lit des fichiers jusqu'à 64 MiB. `writeFile` écrit une chaîne ou un `Uint8Array` d'au plus 8 MiB, en créant ou en remplaçant un fichier ordinaire. `readdir` liste jusqu'à 10 000 noms (dont 1 MiB au plus ; un répertoire plus grand est rejeté avec une `RangeError`, `code` `ERR_OUT_OF_RANGE`), triés, ou des `Dirent` (`name`, `isDirectory()`) avec `{ withFileTypes: true }`. `stat` et `lstat` résolvent un `Stats` avec `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` sous forme de `Date`, et `isFile()`, `isDirectory()` et `isSymbolicLink()`. `rmdir` supprime un répertoire vide. Une VM exécute jusqu'à 1024 opérations à la fois et conserve jusqu'à 64 MiB de données de fichiers en cours (les données confiées à `writeFile` jusqu'à leur écriture, les données lues jusqu'à ce que leur promesse soit réglée) ; un appel au-delà de ces limites est rejeté avec `ERR_NSH_QUOTA_EXCEEDED`, et un `writeFile` de plus de 8 MiB avec une `RangeError` (`code` `ERR_OUT_OF_RANGE`).

Le stockage du navigateur est limité à l'origine de la page et à l'espace de noms propre à l'application, avec les mêmes autorisations de fichiers et les mêmes limites de taille vérifiées en Rust. OPFS exige un contexte sécurisé, tel que HTTPS ou localhost. Les dates de modification des fichiers proviennent des métadonnées du navigateur ; les dates d'accès/de création et les modes inconnus valent zéro. `rename` utilise un déplacement atomique de handle du navigateur et signale `ENOTSUP` lorsque le navigateur ne le fournit pas. Les entrées du navigateur sont des fichiers ordinaires ou des répertoires, et `readlink` signale `EINVAL`.
<a id="processes"></a>

## Processus

`process.spawn` et `process.run` lancent des commandes sur les hôtes de bureau (macOS, Windows et Linux). Le runtime exécute directement le programme avec un tableau d'arguments, sans shell, et possède ses tubes ; stdout et stderr arrivent en UTF-8 incrémental.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

Les commandes correspondent exactement à `process.execute` : `git` et `/usr/bin/git` sont des autorisations distinctes. Les commandes sans chemin se résolvent via les répertoires absolus du `PATH` de l'hôte ; sous Windows, une commande sans chemin y trouve aussi `<name>.com` et `<name>.exe`. Un fichier batch (`.cmd`, `.bat`) s'exécute via `cmd.exe` : accordez son chemin absolu (`C:\Windows\System32\cmd.exe`) et passez `/d`, `/c` et le script comme arguments. L'environnement d'un enfant se compose de `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` et `LC_*` de l'hôte, plus les noms qu'accorde `process.env` (comparés exactement, sans tenir compte de la casse uniquement sous Windows, dont l'environnement l'ignore). Un enfant s'exécute dans le répertoire de données de l'app (créé s'il manque), ou dans `cwd`, un répertoire existant au sein d'une racine `fs.write`, puisque l'enfant peut écrire là où il s'exécute. Un hôte d'intégration peut restreindre les autorisations.

```rust tabs
use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
};

spawn(async move {
    // `run`: the whole output once the command exits.
    if let Ok(Ok(output)) = blocking(|| Command::new("git").args(["status", "--short"]).output()).await {
        log::info!("{} {}", output.status, String::from_utf8_lossy(&output.stdout));
    }
    // `spawn` with `lines: true`: each line as it comes.
    let _ = blocking(|| -> std::io::Result<()> {
        let mut child = Command::new("git").args(["log", "--oneline"]).stdout(Stdio::piped()).spawn()?;
        if let Some(stdout) = child.stdout.take() {
            for line in BufReader::new(stdout).lines() {
                log::info!("{}", line?);
            }
        }
        log::info!("done {}", child.wait()?);
        Ok(())
    })
    .await;
});
```

```tsx tabs
import process from "process";

const { code, stdout } = await process.run("git", ["status", "--short"]);
const child = process.spawn("git", ["log", "--oneline"], { lines: true });
child.on("stdout", (line) => console.log(line));
child.on("exit", ({ code, signal }) => console.log("done", code, signal));
```

`run` se résout avec `{ code, signal, stdout, stderr }` pour tout statut de sortie : `code` est le statut de sortie et `signal` `null` ou, lorsqu'un signal a terminé l'enfant, `code` vaut `null` et `signal` est son nom (`"SIGTERM"`). Il rejette à chaque échec. `spawn` renvoie un enfant immédiatement ; `stdin: "pipe"` active `write` et `end`, et `lines: true` délivre des lignes complètes. `on(event, handler)` renvoie l'enfant, et un gestionnaire reçoit la charge utile de l'événement : le texte, ou `{ code, signal }` une seule fois, après la sortie finale (avec `error` lorsque le runtime a terminé l'enfant : délai dépassé, ligne trop longue) (immédiatement pour un écouteur ajouté plus tard). `pid` est l'identifiant de processus de l'enfant. `spawn` lève ce avec quoi `run` rejette, avant le démarrage de l'enfant : une commande que `process.execute` n'accorde pas échoue avec `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` la commande), un `cwd` en dehors des autorisations `fs.write` échoue avec `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` le `cwd`), un appel hors des plateformes de bureau échoue avec `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, et un appel au-delà de la limite d'enfants échoue avec `ERR_NSH_QUOTA_EXCEEDED` ; un échec de lancement porte `code` (`ENOENT` pour un exécutable manquant, `EACCES` pour un exécutable que l'OS ne peut pas lancer), `syscall` (`spawn <command>`) et `path`. `run` rejette avec `ETIMEDOUT` à son échéance et avec une `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) pour une sortie dépassant sa capture ; la sortie d'un enfant lancé porte le même message dans `error` et son code dans `errorCode`. `process.dataDir` vaut `null` lorsque l'hôte n'a pas de répertoire de données. `kill`, un délai dépassé, le nettoyage du propriétaire réactif et l'arrêt de la VM terminent l'arbre de processus entier : sous Unix, son groupe de processus reçoit SIGTERM puis SIGKILL après 250 ms (à l'arrêt, SIGKILL immédiatement).

| Limite | Valeur |
|---|---|
| `timeoutMs` | Jusqu'à 4 294 967 295 ms ; `run` vaut 30 secondes par défaut, `spawn` s'exécute jusqu'à la sortie |
| Capture de `run` | 8 MiB par flux |
| Une ligne avec `lines: true` | 8 MiB |
| Enfants par VM | 32 |
| Sortie en transit par VM | 8 MiB ; les lecteurs attendent que JS la récupère |
| stdin en attente par enfant | 1 MiB ; `write` lève `ERR_NSH_QUOTA_EXCEEDED` au-delà |
| Écouteurs | 64 par événement et par enfant |

`process.exit(code?)` demande à l'hôte de fermer cette surface d'app. Accordez-le avec `"exit": true` dans `capabilities.process` ; le moteur transmet la demande via la commande de sortie d'app de la plateforme. Un appel que l'autorisation ne couvre pas lève `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`). Les hôtes prennent en charge les demandes de sortie via un gestionnaire de sortie qu'ils installent ; ailleurs, l'appel lève `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Sur macOS, cela ferme la fenêtre de la surface. Dans un navigateur, cela arrête l'app et efface sa surface tout en gardant la page hôte ouverte. Un hôte d'intégration contrôle la manière dont sa surface traite la demande. Gallery refuse cette capacité afin que son action **Request host exit** illustre la gestion des permissions et laisse la démo ouverte.

<a id="network-permissions-and-boundaries"></a>

## Autorisations et limites réseau

Le `fetch` global conserve l'implémentation HTTP en streaming de NSH, en vérifiant `network.hosts` ou `network.http` pour les requêtes et les sauts de redirection. WebSocket prend en charge `ws:` / `wss:`, les messages texte et binaires, les écouteurs d'événements et les handshakes de fermeture. Un handshake WebSocket est un GET HTTP : le `WebSocket` global comme le `connect` du module `websocket` utilisent donc les autorisations HTTP : `ws` est vérifié comme `http` et `wss` comme `https`, avec GET (une règle peut aussi lister `ws` / `wss` dans `schemes`). NSH vérifie l'URL normalisée initiale avant de démarrer la connexion. Le handshake natif se connecte à cette URL et rejette les redirections ; les redirections WebSocket du navigateur et sa politique de connexion sont contrôlées par le navigateur. Les deux API refusent une URL contenant des identifiants ou un fragment. Chaque VM détient au plus 32 WebSockets sur les deux API, et les messages font au plus 8 MiB dans les deux cas.

Une URL non accordée à l'app est refusée avant le début de toute connexion. Le `WebSocket` global la signale comme un navigateur signale une connexion qui échoue : le constructeur renvoie le socket, qui déclenche ensuite `error` et `close` (code 1006, `wasClean` `false`), de sorte que les gestionnaires que l'app définit juste après le constructeur les reçoivent. Le `connect` du module rejette avec `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` l'URL). Le 33e WebSocket lève (le constructeur) ou rejette (`connect`) avec `ERR_NSH_QUOTA_EXCEEDED`, et une URL malformée donne une `SyntaxError` (le constructeur) ou une `TypeError` (`connect`).

Le `WebSocket` global met en file au plus huit messages à envoyer, avec au plus 8 MiB en tampon (`bufferedAmount`) ; `send()` au-delà de l'une ou l'autre limite lève `ERR_NSH_QUOTA_EXCEEDED`, et une fois le socket en cours de fermeture, `send()` ignore ses données, comme celui d'un navigateur. Son handshake et chaque écriture expirent après 30 secondes, et la fermeture attend jusqu'à 5 secondes la trame de fermeture du pair. Les messages sont délivrés sous forme d'événements `message` à mesure qu'ils arrivent.

Le `WebSocketConnection` du module `websocket` détient au plus huit opérations en attente (lectures, écritures, fermeture) et au plus 8 MiB d'écritures non encore envoyées ; un `write()` au-delà de l'une ou l'autre limite rejette avec `ERR_NSH_QUOTA_EXCEEDED`, et un message de plus de 8 MiB avec une `RangeError` (`code` `ERR_OUT_OF_RANGE`). Un seul `read()` peut attendre à la fois ; un second rejette avec une `TypeError`. Les messages qui arrivent avant d'être lus attendent l'app, et leur flux suit ses lectures : tant que huit messages ou 8 MiB attendent sans être lus, la connexion cesse de lire depuis le réseau, de sorte que l'envoi du pair attend aussi, et la lecture reprend lorsque l'app lit. La résolution, la connexion et le handshake ensemble, chaque écriture et la fermeture expirent après 30 secondes.

`read()` résout les messages dans l'ordre d'arrivée. Une fois la connexion fermée proprement (le pair l'a fermée, ou l'app a appelé `close()`) et tous les messages antérieurs lus, `read()` résout `null`, comme celui d'un socket `net` à EOF ; `closeCode` et `closeReason` contiennent alors le code et la raison de la trame de fermeture (`null` tant que la connexion est ouverte ; 1005 pour une trame de fermeture sans code, 1006 pour une connexion terminée sans handshake de fermeture). `read()` ne rejette que pour un échec, après les messages qui l'ont précédé, avec son `code` : `ERR_SOCKET_CLOSED` pour une connexion terminée sans handshake de fermeture, `ETIMEDOUT`, le code de l'OS pour une erreur de socket, ou `EPROTO` pour une erreur de protocole (avec le `status` HTTP d'un handshake refusé). `close(code?, reason?)` envoie son code (1000, par défaut, ou de 3000 à 4999) et sa raison (au plus 123 octets UTF-8) dans la trame de fermeture, comme le `close()` du `WebSocket` global ; un code ou une raison hors de ces limites rejette avec une `RangeError` (`code` `ERR_OUT_OF_RANGE`). Il ignore les messages non encore lus et se résout une fois que le pair a répondu au handshake de fermeture.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` n'utilise que `network.sockets`, une liste de destinations `"host:port"` exactes (`"[::1]:9000"` pour IPv6), vérifiées avant la résolution DNS. Chaque entrée accorde un port sur un hôte ; les motifs d'hôte, `network.hosts` et les autorisations HTTP ne couvrent que le trafic HTTP, et une app sans `"capabilities"` liste aussi ses sockets. Le `Socket` renvoyé fournit `read(size?)`, `write(text)` et `close()` ; les lectures renvoient `Uint8Array`, ou `null` à EOF. Chaque échec rejette : une destination non accordée avec `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`), le 33e socket et les écritures au-delà des 4 MiB pouvant attendre avec `ERR_NSH_QUOTA_EXCEEDED`, une lecture ou une écriture au-delà de 1 MiB avec une `RangeError` (`code` `ERR_OUT_OF_RANGE`) ; les échecs de connexion et d'E/S rejettent avec le `code` de Node (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) et `syscall`, celui d'une connexion aussi avec `address` et `port`, et une écriture sur un socket fermé avec `ERR_SOCKET_CLOSED` (une lecture y renvoie `null`). Les connexions et les E/S ont des délais de 30 secondes, chaque lecture/écriture est limitée à 1 MiB, au plus 4 MiB d'écritures peuvent attendre d'être envoyées, et `close()` met fin immédiatement aux lectures et écritures en attente. Chaque VM garde au plus 32 sockets ouverts ou en cours de connexion. Il s'agit d'une interface de socket client basée sur les promesses.

Le TCP brut utilise les hôtes natifs. Les deux interfaces WebSocket utilisent le transport du navigateur dans les apps web, en conservant les vérifications de capacités Rust et les limites ci-dessus. Les en-têtes de handshake personnalisés du navigateur signalent une erreur explicite d'option non prise en charge. Les politiques de connexion du navigateur s'appliquent également. Les autorisations d'intégration s'intersectent avec la déclaration de capacités de l'app.

<a id="websocket-grant-example"></a>

## Exemple d'autorisation WebSocket

Ce fragment `nsh.json` autorise le handshake GET pour cette URL `wss`, en conservant son chemin et sa portée HTTPS :

```json
{
  "capabilities": {
    "network": {
      "http": [{
        "host": "chat.example.com",
        "methods": ["GET"],
        "schemes": ["https"],
        "pathPrefix": "/socket"
      }]
    }
  }
}
```

```rust tabs
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::Message};

spawn(async move {
    let _ = background(async {
        let (mut socket, _) = connect_async("wss://chat.example.com/socket").await?;
        socket.send(Message::text("hello")).await?;
        while let Some(message) = socket.next().await {
            log::info!("{}", message?);
        }
        Ok::<_, tokio_tungstenite::tungstenite::Error>(())
    })
    .await;
});
```

```tsx tabs
const socket = new WebSocket("wss://chat.example.com/socket");
socket.addEventListener("open", () => socket.send("hello"));
socket.addEventListener("message", (event) => console.log(event.data));
```

<a id="tcp-grant-example"></a>

## Exemple d'autorisation TCP

TCP utilise une autorisation de socket : l'hôte et le port exacts auxquels l'app se connecte.

```json
{
  "capabilities": {
    "network": { "sockets": ["tcp.example.com:9000"] }
  }
}
```

```rust tabs
use std::{
    io::{Read, Write},
    net::TcpStream,
};

spawn(async move {
    let reply = blocking(|| -> std::io::Result<String> {
        let mut socket = TcpStream::connect(("tcp.example.com", 9000))?;
        socket.write_all(b"hello\n")?;
        let mut bytes = [0; 1024];
        let n = socket.read(&mut bytes)?;
        Ok(String::from_utf8_lossy(&bytes[..n]).into_owned())
    })
    .await;
    if let Ok(Ok(reply)) = reply {
        log::info!("{reply}");
    }
});
```

```tsx tabs
import { connect } from "net";

const socket = await connect({ host: "tcp.example.com", port: 9000 });
try {
  await socket.write("hello\n");
  const bytes = await socket.read(1024);
  if (bytes) console.log(new TextDecoder().decode(bytes));
} finally {
  socket.close();
}
```

## Gallery

Ouvrez **Standard APIs** dans `examples/gallery` pour exécuter des opérations sur les fichiers, des processus enfants, TCP et les deux interfaces WebSocket, et inspecter les métadonnées de l'hôte et les tâches en file. L'action des utilitaires illustre les buffers, le hachage, la compression et les URL de fichier. Chaque action affiche son résultat ou son erreur. Les fichiers restent dans un répertoire temporaire sous le répertoire de données propre à Gallery et sont supprimés après l'action. Les actions TCP et WebSocket se connectent à des serveurs d'écho locaux sur les ports 9876 et 9877. Sur le web, les actions de fichiers exercent OPFS, les utilitaires s'exécutent en WebAssembly et les deux actions WebSocket utilisent des connexions de navigateur ; les actions de processus et TCP affichent les erreurs de plateforme typées de l'hôte.

**AI Chat** de Gallery utilise `process.spawn` pour discuter via un CLI Claude ou Codex installé localement sur desktop. Connectez-vous via le CLI dans un terminal, puis choisissez le fournisseur dans le composeur. Les réponses utilisent la conversation comme contexte ; Stop et quitter l'écran terminent le processus enfant. Le web et le mobile exécutent des conversations en streaming scénarisées, avec raisonnement, cartes d'outils et reprise sur erreur.
