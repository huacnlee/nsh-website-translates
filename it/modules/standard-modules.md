---
title: "Moduli standard"
description: "Undici moduli standard in stile Node: utilità LLRT con versione fissata e file, processi e networking con controllo delle capacità."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell fornisce undici moduli standard per TSX, importati con il loro nome semplice (il codice Rust usa le librerie di Rust: [Da Rust](#from-rust)): API in stile Node compatibili con quelle di gpui-shell, eseguite nella VM dell'app sul runtime nativo di NSH, con le capability verificate in Rust. Le loro dichiarazioni TypeScript in `.nsh/types` sono generate dalle stesse specifiche dei moduli, quindi ciò che mostrano i tipi è ciò che il runtime esporta.

| Modulo | Esportazioni |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT); `Buffer` è anche globale |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT); `crypto` è anche globale |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default; `URL` e `URLSearchParams` sono classi globali di NSH |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, ciascuna con la propria forma `Sync`, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: il `console` della VM (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default; l'oggetto default ha anche `env` e `dataDir` ed è il globale `process` |
| `net` | `connect`, `Socket`, default |
| `websocket` | `connect(url, options?)` che risolve un `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`), `WebSocketConnection`, default; il costruttore globale `WebSocket` sugli host nativi |

<a id="from-rust"></a>

## Da Rust

Il codice Rust svolge lo stesso lavoro con la libreria standard di Rust e crates.io, nel codice nativo dell'app: le chiamate bloccanti vengono eseguite sui thread del runtime con `blocking(…)` e quelle asincrone con `background(…)` (`nsh_core::prelude`), e i risultati tornano al componente in un task. Le `capabilities` di `nsh.json` regolano il TSX dell'app e i servizi di NSH (`fetch`, gli appunti); il codice Rust dell'app viene eseguito con i permessi del processo dell'app. Nelle app browser, il codice Rust raggiunge la rete con `fetch` e conserva i dati con `nsh_core::storage::Storage`.

| Modulo | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, il crate `base64` |
| `crypto` | crate come `sha2`, `hmac`, `rand` e `uuid` |
| `path` | `std::path` |
| `url` | il crate `url` |
| `zlib` | crate come `flate2`, `brotli` e `zstd` |
| `os` | `std::env::consts`, `os()` |
| `console` | il crate `log` |
| `fs/promises` | `std::fs` in `blocking(…)`; `Storage` per i dati chiave-valore |
| `process` | `std::process::Command` in `blocking(…)` |
| `net` | `std::net::TcpStream` in `blocking(…)`, oppure `tokio::net` in `background(…)` |
| `websocket` | un crate come `tokio-tungstenite` in `background(…)` |

<a id="imports-and-generated-types"></a>

## Import e tipi generati

Ogni modulo si importa esattamente con il nome indicato nella tabella: `import { join } from "path"`, `import fs from "fs/promises"`. Il bundler mantiene questi import e il runtime li serve in modo nativo; il catalogo è costituito da questi undici nomi. `buffer`, `crypto`, `path`, `url` e `zlib` sono implementazioni di LLRT, fissate a `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`, con dichiarazioni proiettate da quella revisione sulle esportazioni che il runtime possiede. Gli altri sono propri di NSH. NSH mantiene l'identità delle proprie classi URL, Blob, stream ed event.

Tutti e undici i moduli si caricano sugli host nativi e nelle app browser. `Buffer`, hashing, crypto e compressione usano la stessa implementazione Rust portabile in WebAssembly, comprese le API sincrone; i valori casuali usano l'entropia crittografica del browser. Le operazioni `path` nel browser usano percorsi POSIX e una directory di lavoro virtuale `/`. I file nel browser usano uno storage persistente privato dell'app, e i WebSocket usano il trasporto del browser. L'esecuzione di processi e le chiamate TCP raw falliscono nei browser con `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Confronto con Node.js e gpui-shell

I moduli seguono i nomi e le forme di Node per il sottoinsieme che esportano, e il comportamento di gpui-shell dove ne definisce uno. Le scelte proprie di NSH:

- L'`exists` di `fs/promises` è `true` per un symlink il cui target manca, e `unlink`, `rename`, `rmdir`, `lstat` e `readlink` agiscono sul symlink stesso.
- `Stats` e `Dirent` hanno i propri campi (`size`, `mtimeMs`, `name`, ...) come proprietà proprie, come quelli di Node, e `isFile()`, `isDirectory()` e `isSymbolicLink()` sul prototipo.
- Un listener `ChildProcess` riceve il payload dell'evento: il testo di output, oppure il `{ code, signal }` dell'uscita (con `error` e `errorCode` quando il runtime ha terminato il processo figlio). `on` restituisce il processo figlio. `run` risolve `{ code, signal, stdout, stderr }`: l'output di gpui-shell con il segnale che ha terminato il processo figlio.
- L'ambiente di un processo figlio è un piccolo insieme proveniente dall'host più i nomi concessi all'app, e viene eseguito nella directory dati dell'app o in una `cwd` all'interno di una radice `fs.write` ([Processi](#processes)).
- `process.platform`, `process.arch`, `os.platform()` e `os.arch()` forniscono i nomi di `std::env::consts` di Rust, come quelli di gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"` ([Metadati del SO](#os-metadata-and-logging)).
- `process.dataDir` è `null` quando l'host non ha una directory dati; `process.exit` chiede all'host di chiudere la superficie dell'app.
- I limiti fanno parte di ogni API: dimensioni, conteggi e timeout sono elencati con ciascun modulo più avanti.

<a id="failures"></a>

## Errori

Una funzione che restituisce una promise segnala ogni errore rifiutandola, come fa `fs/promises` di Node: un argomento errato, un percorso o un host non concesso all'app, un limite esaurito e un errore di I/O allo stesso modo, così un solo `catch` (o `.catch`) li gestisce tutti. Una funzione sincrona (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, il costruttore del globale `WebSocket` e `send`) genera un'eccezione. Un uso errato (un argomento del tipo sbagliato, un'opzione fuori intervallo) è un `TypeError` o `RangeError`. Ogni errore che un'app può gestire porta un `code`, che resta invariato da una release all'altra; il messaggio è scritto per le persone e può cambiare, quindi le app si basano su `code`:

| `code` | Cosa significa |
|---|---|
| `ERR_ACCESS_DENIED` | Le `capabilities` dell'app non consentono la chiamata. L'errore ha `permission`, la chiave della capability in `nsh.json` (`"fs"`, `"process"`, `"network"`), e `resource`, ciò che è stato richiesto: il percorso, il comando (`"exit"` per `process.exit`), il `"host:port"` di un socket o l'URL del WebSocket |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | La chiamata appartiene ad altre piattaforme: i file funzionano su desktop e nei browser, i processi su desktop, i socket TCP sugli host nativi, `os.homedir()` sugli host che configurano una home directory |
| `ERR_NSH_QUOTA_EXCEEDED` | Un limite del runtime è esaurito: operazioni o dati in corso, processi figli, socket, WebSocket, byte in attesa di invio, listener |
| `ETIMEDOUT` | La chiamata è andata in timeout: il `timeoutMs` di `run`, una connessione, un handshake, una scrittura o una chiusura di WebSocket |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | La risposta del sistema operativo, con i codici di Node; `EACCES` e `EPERM` sono il rifiuto di un file da parte del SO, a prescindere dalle capability dell'app |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | I codici di Node per una dimensione oltre un limite, una connessione chiusa e un output oltre la cattura di `run` |

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

Un'app host può concedere meno di quanto l'app dichiara ([Sandbox e capability](../docs/sandbox-and-capabilities.md)), quindi un'app gestisce `ERR_ACCESS_DENIED` come gestisce una richiesta fallita.

<a id="os-metadata-and-logging"></a>

## Metadati del SO e logging

`os.platform(): string` e `os.arch(): string` riportano il sistema operativo e l'architettura effettivi dell'host nativo, e `process.platform` e `process.arch` contengono gli stessi valori. Sono i nomi di `std::env::consts::OS` e `ARCH` di Rust, come quelli di gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` per il sistema operativo, `"aarch64"`, `"x86_64"` per l'architettura, così le app li confrontano direttamente (`process.platform === "macos"`). `os.EOL: string` è il separatore di riga dell'host. `os.homedir(): string` restituisce un percorso home assoluto dell'host configurato; dove non ne è configurato nessuno genera un errore con `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. I percorsi delle directory sono metadati: le operazioni sui file richiedono comunque le concessioni `fs.read` / `fs.write`.

Le app browser leggono un oggetto `process.env` vuoto, e `os.homedir()` genera lì `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, poiché i percorsi home e le variabili d'ambiente appartengono agli host nativi.

`import console from "console"` condivide l'oggetto globale `console` della VM. Il modulo ha solo un'esportazione default, che supporta `log`, `info`, `debug`, `warn`, `error`, ciascuno con la firma `(...values: unknown[]): void`. Usa la formattazione del logger di NSH.

<a id="compression"></a>

## Compressione

`zlib` è quello di LLRT, con un limite che NSH aggiunge: ogni decompressione (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` e le relative forme `Sync`) produce al massimo 64 MiB, o il limite dell'heap della VM se inferiore. Un output più lungo genera un `RangeError`, come fa Node.js per `maxOutputLength`; un `maxOutputLength` proprio dell'app imposta un limite inferiore per una singola chiamata. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` e `crypto.randomBytes` generano un `RangeError` (`code` `ERR_OUT_OF_RANGE`) per una dimensione oltre il limite dell'heap della VM, o 1 GiB se non ce n'è uno; `allocUnsafe` restituisce memoria azzerata.

<a id="files"></a>

## File

`fs/promises` legge e scrive file nativi sugli host desktop (macOS, Windows e Linux), e file privati dell'app nel browser tramite l'Origin Private File System (OPFS). Ogni percorso viene verificato rispetto a `capabilities.fs` prima dell'avvio dell'operazione: radici `read` per `readFile`, `readdir`, `stat`, `lstat`, `readlink` e `exists`, radici `write` per `writeFile`, `mkdir`, `rename`, `unlink` e `rmdir`. Ogni errore rifiuta la promise: un percorso fuori dalle concessioni con `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` il percorso come l'app lo ha scritto), prima di qualsiasi lavoro su disco.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

Le radici sono percorsi assoluti, `${dataDir}` (la directory dati di questa app, scelta dall'host), `${pluginDir}` (la directory dell'app), `${homeDir}`, oppure percorsi relativi alla directory dell'app. Un percorso relativo in una chiamata viene risolto a turno in ogni radice concessa. Un host che incorpora l'app può restringere ulteriormente le concessioni. Ogni operazione resta all'interno della radice concessa, symlink inclusi; un percorso assoluto viene verificato così com'è scritto, quindi una radice si raggiunge con il proprio percorso (o con quello risolto), non tramite un link esterno ad essa. `lstat`, `readlink`, `exists`, `unlink`, `rename` e `rmdir` agiscono sul symlink stesso: `exists` è `true` per un symlink il cui target manca, e `unlink` rimuove il link e mantiene il suo target.

Gli errori portano le proprietà di errore di Node: `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; `EILSEQ` per testo che non è UTF-8, `ERR_FS_FILE_TOO_LARGE` oltre il limite di lettura), `syscall` e `path`, così `error.code === "ENOENT"` distingue un file mancante. Un percorso fuori dalle concessioni rifiuta con `ERR_ACCESS_DENIED`, una chiamata su iOS o Android (le cui app conservano i dati con [`Storage`](./nsh.md#storage)) con `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, e un argomento errato (una codifica o un'opzione sconosciuta) con un `TypeError`.

`readFile` restituisce un `Uint8Array`, o una stringa con `"utf8"`, e legge file fino a 64 MiB. `writeFile` scrive una stringa o `Uint8Array` fino a 8 MiB, creando o sostituendo un file regolare. `readdir` elenca fino a 10 000 nomi (1 MiB di essi; una directory più grande rifiuta con un `RangeError`, `code` `ERR_OUT_OF_RANGE`), ordinati, oppure oggetti `Dirent` (`name`, `isDirectory()`) con `{ withFileTypes: true }`. `stat` e `lstat` risolvono un `Stats` con `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` come valori `Date`, e `isFile()`, `isDirectory()` e `isSymbolicLink()`. `rmdir` rimuove una directory vuota. Una VM esegue fino a 1024 operazioni alla volta e mantiene fino a 64 MiB di dati di file in corso (dati passati a `writeFile` finché non sono scritti, dati letti finché la relativa promise non si risolve); una chiamata oltre questi limiti rifiuta con `ERR_NSH_QUOTA_EXCEEDED`, e un `writeFile` oltre 8 MiB con un `RangeError` (`code` `ERR_OUT_OF_RANGE`).

Lo storage del browser è limitato all'origine della pagina e al namespace proprio dell'app, con le stesse concessioni sui file e gli stessi limiti di dimensione verificati in Rust. OPFS richiede un contesto sicuro, come HTTPS o localhost. I tempi di modifica dei file provengono dai metadati del browser; i tempi di accesso/creazione e le modalità sconosciuti sono zero. `rename` usa uno spostamento atomico di handle del browser e segnala `ENOTSUP` quando il browser non lo fornisce. Le voci nel browser sono file regolari o directory, e `readlink` segnala `EINVAL`.
<a id="processes"></a>

## Processi

`process.spawn` e `process.run` avviano comandi su host desktop (macOS, Windows e Linux). Il runtime esegue il programma direttamente con un array di argomenti, senza shell, e possiede le proprie pipe; stdout e stderr arrivano come UTF-8 incrementale.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

I comandi corrispondono a `process.execute` esattamente: `git` e `/usr/bin/git` sono concessioni separate. I comandi senza percorso vengono risolti tramite le directory assolute di `PATH` dell'host; su Windows un comando senza percorso trova lì anche `<name>.com` e `<name>.exe`. Un file batch (`.cmd`, `.bat`) viene eseguito tramite `cmd.exe`: concedi il suo percorso assoluto (`C:\Windows\System32\cmd.exe`) e passa `/d`, `/c` e lo script come argomenti. L'ambiente di un processo figlio è composto da `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` e `LC_*` dell'host, più i nomi concessi da `process.env` (confrontati esattamente, ignorando le maiuscole solo su Windows, il cui ambiente fa lo stesso). Un processo figlio viene eseguito nella directory dei dati dell'app (creata se mancante), oppure in `cwd`, una directory esistente all'interno di una radice `fs.write`, poiché il figlio può scrivere dove viene eseguito. Un host di embedding può restringere le concessioni.

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

`run` risolve `{ code, signal, stdout, stderr }` per qualsiasi stato di uscita: `code` è lo stato di uscita e `signal` `null`, oppure, quando un segnale ha terminato il figlio, `code` è `null` e `signal` il suo nome (`"SIGTERM"`). Viene rifiutata (reject) in ogni caso di errore. `spawn` restituisce subito un processo figlio; `stdin: "pipe"` abilita `write` e `end`, e `lines: true` consegna righe complete. `on(event, handler)` restituisce il processo figlio, e un handler riceve il payload dell'evento: il testo, oppure `{ code, signal }` una sola volta, dopo l'ultimo output (con `error` quando il runtime ha terminato il figlio: un timeout, una riga troppo lunga) (subito per un listener aggiunto in seguito). `pid` è l'id di processo del figlio. `spawn` lancia ciò con cui `run` viene rifiutata, prima che il figlio parta: un comando che `process.execute` non concede fallisce con `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` il comando), un `cwd` al di fuori delle concessioni `fs.write` fallisce con `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` il `cwd`), una chiamata fuori dai desktop fallisce con `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, e una chiamata oltre il limite di processi figlio fallisce con `ERR_NSH_QUOTA_EXCEEDED`; un errore di avvio riporta `code` (`ENOENT` per un eseguibile mancante, `EACCES` per uno che il sistema operativo non può eseguire), `syscall` (`spawn <command>`) e `path`. `run` viene rifiutata con `ETIMEDOUT` alla scadenza e con un `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) per l'output oltre la sua capacità di cattura; l'uscita di un figlio avviato con spawn riporta lo stesso messaggio in `error` e il suo codice in `errorCode`. `process.dataDir` è `null` quando l'host non ha una directory dei dati. `kill`, un timeout, la pulizia del reactive owner e lo smantellamento della VM terminano l'intero albero di processi: su Unix il suo process group riceve SIGTERM e poi SIGKILL dopo 250 ms (allo smantellamento, SIGKILL immediato).

| Limite | Valore |
|---|---|
| `timeoutMs` | Fino a 4.294.967.295 ms; `run` ha come valore predefinito 30 secondi, `spawn` viene eseguito fino all'uscita |
| Cattura di `run` | 8 MiB per stream |
| Una riga con `lines: true` | 8 MiB |
| Processi figlio per VM | 32 |
| Output in sospeso per VM | 8 MiB; i lettori attendono che JS lo consumi |
| stdin in sospeso per figlio | 1 MiB; `write` lancia `ERR_NSH_QUOTA_EXCEEDED` oltre questo limite |
| Listener | 64 per evento per figlio |

`process.exit(code?)` richiede all'host di chiudere questa superficie dell'app. Concedilo con `"exit": true` in `capabilities.process`; il motore inoltra la richiesta tramite il comando di uscita dell'app della piattaforma. Una chiamata non coperta dalla concessione lancia `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`). Gli host accettano le richieste di uscita tramite un exit handler che installano; altrove la chiamata lancia `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Su macOS, chiude la finestra della superficie. In un browser, ferma l'app e ripulisce la sua superficie mantenendo aperta la pagina host. Un host di embedding controlla come la sua superficie gestisce la richiesta. Gallery nega questa capability, così la sua azione **Request host exit** dimostra la gestione dei permessi e mantiene aperta la demo.

<a id="network-permissions-and-boundaries"></a>

## Permessi e limiti di rete

Il globale `fetch` mantiene l'implementazione HTTP in streaming di NSH, verificando `network.hosts` o `network.http` per le richieste e per i passaggi di redirect. WebSocket supporta `ws:` / `wss:`, messaggi di testo e binari, listener di eventi e handshake di chiusura. Un handshake WebSocket è una GET HTTP, quindi sia il globale `WebSocket` sia `connect` del modulo `websocket` usano le concessioni HTTP: `ws` viene verificato come `http` e `wss` come `https`, usando GET (una regola può anche elencare `ws` / `wss` in `schemes`). NSH verifica l'URL normalizzato iniziale prima di avviare la connessione. L'handshake nativo si connette a quell'URL e rifiuta i redirect; i redirect e la policy di connessione dei WebSocket del browser sono controllati dal browser. Entrambe le API rifiutano un URL con credenziali o un frammento. Ogni VM mantiene al massimo 32 WebSocket tra le due API, e i messaggi sono al massimo di 8 MiB in entrambe.

Un URL non concesso all'app viene rifiutato prima che parta qualsiasi connessione. Il globale `WebSocket` lo segnala come un browser segnala una connessione fallita: il costruttore restituisce il socket, che poi emette `error` e `close` (codice 1006, `wasClean` `false`), in modo che gli handler impostati dall'app subito dopo il costruttore li ricevano. `connect` del modulo viene rifiutata con `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` l'URL). Il 33° WebSocket lancia (il costruttore) o viene rifiutato (`connect`) con `ERR_NSH_QUOTA_EXCEEDED`, e un URL malformato produce un `SyntaxError` (il costruttore) o un `TypeError` (`connect`).

Il globale `WebSocket` accoda al massimo otto messaggi da inviare, con al massimo 8 MiB in buffer (`bufferedAmount`); `send()` oltre uno dei due limiti lancia `ERR_NSH_QUOTA_EXCEEDED`, e una volta che il socket è in chiusura, `send()` scarta i suoi dati, come fa quello di un browser. Il suo handshake e ogni scrittura scadono dopo 30 secondi, e la chiusura attende fino a 5 secondi il frame di chiusura del peer. I messaggi vengono consegnati come eventi `message` man mano che arrivano.

`websocket` del modulo `WebSocketConnection` contiene al massimo otto operazioni in sospeso (letture, scritture, chiusura) e al massimo 8 MiB di scritture non ancora inviate; `write()` oltre uno dei due limiti viene rifiutata con `ERR_NSH_QUOTA_EXCEEDED`, e un messaggio oltre 8 MiB con un `RangeError` (`code` `ERR_OUT_OF_RANGE`). Può essere in attesa un solo `read()` alla volta; un secondo viene rifiutato con un `TypeError`. I messaggi che arrivano prima di essere letti attendono l'app, e il loro flusso segue le sue letture: finché otto messaggi o 8 MiB restano non letti, la connessione smette di leggere dalla rete, quindi anche l'invio del peer attende, e la lettura riprende man mano che l'app legge. Risoluzione, connessione e handshake insieme, ogni scrittura e la chiusura scadono dopo 30 secondi.

`read()` risolve i messaggi in ordine di arrivo. Una volta che la connessione si è chiusa correttamente (il peer l'ha chiusa, oppure l'app ha chiamato `close()`) e ogni messaggio precedente è stato letto, `read()` risolve `null`, come fa quella di un socket `net` a EOF; `closeCode` e `closeReason` contengono poi il codice e il motivo del frame di chiusura (`null` mentre la connessione è aperta; 1005 per un frame di chiusura senza codice, 1006 per una connessione terminata senza un handshake di chiusura). `read()` viene rifiutata solo per un errore, dopo i messaggi che lo precedono, con il suo `code`: `ERR_SOCKET_CLOSED` per una connessione terminata senza un handshake di chiusura, `ETIMEDOUT`, il codice del sistema operativo per un errore di socket, o `EPROTO` per un errore di protocollo (con l'HTTP `status` di un handshake rifiutato). `close(code?, reason?)` invia il suo codice (1000, il valore predefinito, oppure da 3000 a 4999) e il motivo (al massimo 123 byte UTF-8) nel frame di chiusura, come fa `close()` del globale `WebSocket`; un codice o un motivo al di fuori di questi limiti viene rifiutato con un `RangeError` (`code` `ERR_OUT_OF_RANGE`). Scarta i messaggi non ancora letti e risolve non appena il peer risponde all'handshake di chiusura.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` usa solo `network.sockets`, un elenco di destinazioni `"host:port"` esatte (`"[::1]:9000"` per IPv6), verificate prima della risoluzione DNS. Ogni voce concede una porta su un host; i pattern di host, `network.hosts` e le concessioni HTTP coprono solo il traffico HTTP, e un'app senza `"capabilities"` elenca anche i propri socket. `Socket` restituito fornisce `read(size?)`, `write(text)` e `close()`; le letture restituiscono `Uint8Array`, oppure `null` a EOF. Ogni errore viene rifiutato: una destinazione non concessa con `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`), il 33° socket e le scritture oltre i 4 MiB che possono restare in attesa con `ERR_NSH_QUOTA_EXCEEDED`, una lettura o scrittura oltre 1 MiB con un `RangeError` (`code` `ERR_OUT_OF_RANGE`); gli errori di connessione e di I/O vengono rifiutati con `code` di Node (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) e `syscall`, quelli di una connessione anche con `address` e `port`, e una scrittura su un socket chiuso con `ERR_SOCKET_CLOSED` (una lettura in quel caso restituisce `null`). Connessioni e I/O hanno timeout di 30 secondi, ogni lettura/scrittura è limitata a 1 MiB, al massimo 4 MiB di scritture possono attendere di essere inviate, e `close()` termina subito le letture e le scritture in sospeso. Ogni VM mantiene al massimo 32 socket aperti o in connessione. Questa è un'interfaccia socket client basata su promise.

Il TCP raw usa host nativi. Entrambe le interfacce WebSocket usano il trasporto del browser nelle app web, mantenendo i controlli delle capability in Rust e i limiti sopra indicati. Gli header di handshake personalizzati del browser segnalano un errore esplicito di opzione non supportata. Si applicano anche le policy di connessione del browser. Le concessioni dell'embedding si intersecano con la dichiarazione di capability dell'app.

<a id="websocket-grant-example"></a>

## Esempio di concessione WebSocket

Questo frammento di `nsh.json` consente l'handshake GET per questo URL `wss`, mantenendo il suo percorso e l'ambito HTTPS:

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

## Esempio di concessione TCP

Il TCP usa una concessione di socket: l'host e la porta esatti a cui l'app si connette.

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

Apri **Standard APIs** in `examples/gallery` per eseguire operazioni su file, processi figlio, TCP ed entrambe le interfacce WebSocket, e per ispezionare i metadati dell'host e i job in coda. L'azione delle utility dimostra buffer, hashing, compressione e URL di file. Ogni azione mostra il proprio risultato o errore. I file restano in una directory temporanea sotto la directory dei dati propria di Gallery e vengono rimossi dopo l'azione. Le azioni TCP e WebSocket si connettono a server echo locali sulle porte 9876 e 9877. Sul web, le azioni sui file usano OPFS, le utility vengono eseguite in WebAssembly ed entrambe le azioni WebSocket usano connessioni del browser; le azioni su processi e TCP mostrano gli errori di piattaforma tipizzati dell'host.

**AI Chat** di Gallery usa `process.spawn` per chattare, su desktop, tramite una CLI di Claude o Codex installata localmente. Accedi tramite la CLI in un terminale, poi scegli il provider nel composer. Le risposte usano la conversazione come contesto; Stop e l'uscita dalla schermata terminano il processo figlio. Web e mobile eseguono conversazioni in streaming predefinite, inclusi ragionamento, card degli strumenti e recupero dagli errori.
