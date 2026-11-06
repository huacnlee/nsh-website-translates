---
title: "Standardmodule"
description: "Elf Node-artige Standardmodule: fest eingebundene LLRT-Hilfsprogramme sowie Dateien, Prozesse und Netzwerkfunktionen mit Capability-Prüfung."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell stellt elf Standardmodule für TSX bereit, die mit ihrem einfachen Namen importiert werden (Rust-Code verwendet die eigenen Bibliotheken von Rust: [Aus Rust](#from-rust)): Node-förmige APIs, kompatibel mit denen von gpui-shell, die in der VM der App auf der nativen Runtime von NSH laufen, wobei ihre Capabilities in Rust geprüft werden. Ihre TypeScript-Deklarationen in `.nsh/types` werden aus denselben Spezifikationen wie die Module generiert, sodass die Typen genau das zeigen, was die Runtime exportiert.

| Modul | Exporte |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT); `Buffer` ist auch ein Global |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT); `crypto` ist auch ein Global |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default; `URL` und `URLSearchParams` sind globale Klassen von NSH |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, jeweils mit ihrer `Sync`-Form, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: das `console` der VM (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default; das default-Objekt hat auch `env` und `dataDir` und ist das globale `process` |
| `net` | `connect`, `Socket`, default |
| `websocket` | `connect(url, options?)` liefert ein `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`), `WebSocketConnection`, default; der globale Konstruktor `WebSocket` auf nativen Hosts |

<a id="from-rust"></a>

## Aus Rust

Rust-Code erledigt dieselbe Arbeit mit der Standardbibliothek von Rust und crates.io, im eigenen nativen Code der App: Blockierende Aufrufe laufen mit `blocking(…)` auf den Threads der Runtime und asynchrone mit `background(…)` (`nsh_core::prelude`), und ihre Ergebnisse kehren in einem Task zur Komponente zurück. Die `capabilities` von `nsh.json` regeln das TSX der App und die Dienste von NSH (`fetch`, die Zwischenablage); der eigene Rust-Code der App läuft mit den Berechtigungen des App-Prozesses. In Browser-Apps greift Rust-Code mit `fetch` auf das Netzwerk zu und speichert Daten mit `nsh_core::storage::Storage`.

| Modul | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, das Crate `base64` |
| `crypto` | Crates wie `sha2`, `hmac`, `rand` und `uuid` |
| `path` | `std::path` |
| `url` | das Crate `url` |
| `zlib` | Crates wie `flate2`, `brotli` und `zstd` |
| `os` | `std::env::consts`, `os()` |
| `console` | das Crate `log` |
| `fs/promises` | `std::fs` in `blocking(…)`; `Storage` für Key-Value-Daten |
| `process` | `std::process::Command` in `blocking(…)` |
| `net` | `std::net::TcpStream` in `blocking(…)` oder `tokio::net` in `background(…)` |
| `websocket` | ein Crate wie `tokio-tungstenite` in `background(…)` |

<a id="imports-and-generated-types"></a>

## Imports und generierte Typen

Jedes Modul wird genau mit dem Namen aus der Tabelle importiert: `import { join } from "path"`, `import fs from "fs/promises"`. Der Bundler behält diese Imports bei, und die Runtime stellt sie nativ bereit; der Katalog besteht aus diesen elf Namen. `buffer`, `crypto`, `path`, `url` und `zlib` sind Implementierungen von LLRT, festgelegt auf `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`, mit Deklarationen, die aus dieser Revision auf die Exporte projiziert werden, die die Runtime hat. Die übrigen stammen von NSH selbst. NSH behält die Identität seiner URL-, Blob-, Stream- und Event-Klassen bei.

Alle elf Module laufen auf nativen Hosts und in Browser-Apps. `Buffer`, Hashing, Crypto und Komprimierung verwenden in WebAssembly dieselbe portable Rust-Implementierung, einschließlich synchroner APIs; Zufallswerte nutzen die kryptografische Entropie des Browsers. Browser-Operationen von `path` verwenden POSIX-Pfade und ein virtuelles Arbeitsverzeichnis `/`. Browser-Dateien nutzen persistenten, app-privaten Speicher, und WebSockets nutzen den Transport des Browsers. Das Ausführen von Prozessen und rohe TCP-Aufrufe schlagen im Browser mit `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` fehl.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Vergleich mit Node.js und gpui-shell

Die Module folgen für die Teilmenge, die sie exportieren, den Namen und Formen von Node und dem Verhalten von gpui-shell, wo dieses eines definiert. Eigene Entscheidungen von NSH:

- `fs/promises`: `exists` ist `true` für einen Symlink, dessen Ziel fehlt, und `unlink`, `rename`, `rmdir`, `lstat` und `readlink` wirken auf den Symlink selbst.
- `Stats` und `Dirent` haben ihre Felder (`size`, `mtimeMs`, `name`, ...) wie die von Node als eigene Properties, und `isFile()`, `isDirectory()` und `isSymbolicLink()` auf ihrem Prototype.
- Ein `ChildProcess`-Listener erhält die Payload des Events: den Ausgabetext oder den `{ code, signal }` des Exits (mit `error` und `errorCode`, wenn die Runtime den Kindprozess beendet hat). `on` gibt den Kindprozess zurück. `run` löst mit `{ code, signal, stdout, stderr }` auf: der Ausgabe von gpui-shell samt dem Signal, das den Kindprozess beendet hat.
- Die Umgebung eines Kindprozesses besteht aus einer kleinen Menge vom Host plus den Namen, die der App gewährt sind, und er läuft im Datenverzeichnis der App oder in einem `cwd` innerhalb eines `fs.write`-Roots ([Prozesse](#processes)).
- `process.platform`, `process.arch`, `os.platform()` und `os.arch()` liefern wie die von gpui-shell die Namen von Rusts `std::env::consts`: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"` ([OS-Metadaten](#os-metadata-and-logging)).
- `process.dataDir` ist `null`, wenn der Host kein Datenverzeichnis hat; `process.exit` bittet den Host, die App-Oberfläche zu schließen.
- Limits sind Teil jeder API: Größen, Anzahlen und Timeouts sind unten bei jedem Modul aufgeführt.

<a id="failures"></a>

## Fehler

Eine Funktion, die ein Promise zurückgibt, meldet jeden Fehler, indem sie es ablehnt, wie Node's `fs/promises`: ein falsches Argument, ein Pfad oder Host, der der App nicht gewährt ist, ein ausgeschöpftes Limit und ein I/O-Fehler gleichermaßen, sodass ein einziges `catch` (oder `.catch`) alle behandelt. Eine synchrone Funktion (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, der Konstruktor des globalen `WebSocket` und `send`) wirft eine Exception. Eine falsche Verwendung (ein Argument des falschen Typs, eine Option außerhalb ihres Bereichs) ist ein `TypeError` oder `RangeError`. Jeder Fehler, den eine App behandeln kann, trägt einen `code`, der von Release zu Release gleich bleibt; die Meldung ist für Menschen geschrieben und kann sich ändern, deshalb verzweigen Apps anhand von `code`:

| `code` | Bedeutung |
|---|---|
| `ERR_ACCESS_DENIED` | Die `capabilities` der App gewähren den Aufruf nicht. Der Fehler hat `permission`, den Schlüssel der Capability in `nsh.json` (`"fs"`, `"process"`, `"network"`), und `resource`, also das, was angefragt wurde: den Pfad, den Befehl (`"exit"` für `process.exit`), den `"host:port"` eines Sockets oder die URL des WebSockets |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | Der Aufruf gehört zu anderen Plattformen: Dateien laufen auf Desktops und in Browsern, Prozesse auf Desktops, TCP-Sockets auf nativen Hosts, `os.homedir()` auf Hosts, die ein Home-Verzeichnis konfigurieren |
| `ERR_NSH_QUOTA_EXCEEDED` | Ein Limit der Runtime ist ausgeschöpft: laufende Operationen oder Daten, Kindprozesse, Sockets, WebSockets, wartende Bytes zum Senden, Listener |
| `ETIMEDOUT` | Dem Aufruf ging die Zeit aus: `run` mit `timeoutMs`, eine Verbindung, ein WebSocket-Handshake, Schreiben oder Schließen |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | Die Antwort des Betriebssystems, mit den Codes von Node; `EACCES` und `EPERM` bedeuten, dass das OS eine Datei verweigert, unabhängig von den Capabilities der App |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | Die Codes von Node für eine Größe über einem Limit, eine geschlossene Verbindung und Ausgabe über die Erfassung von `run` hinaus |

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

Ein Host-App darf weniger gewähren, als die App deklariert ([Sandbox und Capabilities](../docs/sandbox-and-capabilities.md)), daher behandelt eine App `ERR_ACCESS_DENIED` wie eine fehlgeschlagene Anfrage.

<a id="os-metadata-and-logging"></a>

## OS-Metadaten und Logging

`os.platform(): string` und `os.arch(): string` melden das tatsächliche native Host-OS und die Architektur, und `process.platform` und `process.arch` enthalten dieselben Werte. Es sind die Namen von Rusts `std::env::consts::OS` und `ARCH`, wie bei gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` für das OS, `"aarch64"`, `"x86_64"` für die Architektur, sodass Apps direkt gegen sie vergleichen (`process.platform === "macos"`). `os.EOL: string` ist das Zeilentrennzeichen des Hosts. `os.homedir(): string` gibt einen konfigurierten absoluten Home-Pfad des Hosts zurück; ist keiner konfiguriert, wirft es einen Fehler mit `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Verzeichnispfade sind Metadaten: Dateioperationen erfordern weiterhin die Grants `fs.read` / `fs.write`.

Browser-Apps lesen ein leeres `process.env`-Objekt, und `os.homedir()` wirft dort `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, da Home-Pfade und Umgebungsvariablen zu nativen Hosts gehören.

`import console from "console"` teilt sich das globale `console`-Objekt der VM. Das Modul hat nur einen Default-Export und unterstützt `log`, `info`, `debug`, `warn`, `error`, jeweils mit der Signatur `(...values: unknown[]): void`. Es verwendet die Logger-Formatierung von NSH.

<a id="compression"></a>

## Komprimierung

`zlib` stammt von LLRT, mit einer Grenze, die NSH hinzufügt: Jede Dekomprimierung (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` und ihre `Sync`-Formen) erzeugt höchstens 64 MiB oder das Heap-Limit der VM, wenn dieses kleiner ist. Längere Ausgabe wirft einen `RangeError`, wie es Node.js bei `maxOutputLength` tut; ein eigenes `maxOutputLength` der App setzt für einen Aufruf eine niedrigere Grenze. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` und `crypto.randomBytes` werfen einen `RangeError` (`code` `ERR_OUT_OF_RANGE`) für eine Größe über dem Heap-Limit der VM oder 1 GiB ohne ein solches; `allocUnsafe` gibt mit Nullen gefüllten Speicher zurück.

<a id="files"></a>

## Dateien

`fs/promises` liest und schreibt native Dateien auf Desktop-Hosts (macOS, Windows und Linux) sowie app-private Browser-Dateien über das Origin Private File System (OPFS). Jeder Pfad wird gegen `capabilities.fs` geprüft, bevor die Operation beginnt: `read`-Roots für `readFile`, `readdir`, `stat`, `lstat`, `readlink` und `exists`, `write`-Roots für `writeFile`, `mkdir`, `rename`, `unlink` und `rmdir`. Jeder Fehler lehnt das Promise ab: ein Pfad außerhalb der Grants mit `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` der Pfad, wie die App ihn geschrieben hat), noch bevor Plattenzugriffe stattfinden.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

Roots sind absolute Pfade, `${dataDir}` (das Datenverzeichnis dieser App, vom Host gewählt), `${pluginDir}` (das Verzeichnis der App), `${homeDir}` oder Pfade relativ zum Verzeichnis der App. Ein relativer Pfad in einem Aufruf wird nacheinander in jedem gewährten Root aufgelöst. Ein einbettender Host darf die Grants weiter einschränken. Jede Operation bleibt innerhalb ihres gewährten Roots, Symlinks eingeschlossen; ein absoluter Pfad wird so geprüft, wie er geschrieben ist, ein Root wird also über seinen eigenen Pfad (oder seinen aufgelösten) erreicht, nicht über einen Link von außerhalb. `lstat`, `readlink`, `exists`, `unlink`, `rename` und `rmdir` wirken auf einen Symlink selbst: `exists` ist `true` für einen Symlink, dessen Ziel fehlt, und `unlink` entfernt den Link und behält sein Ziel.

Fehler tragen die Error-Properties von Node: `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; `EILSEQ` für Text, der nicht UTF-8 ist, `ERR_FS_FILE_TOO_LARGE` bei Überschreiten des Leselimits), `syscall` und `path`, sodass `error.code === "ENOENT"` eine fehlende Datei unterscheidet. Ein Pfad außerhalb der Grants wird mit `ERR_ACCESS_DENIED` abgelehnt, ein Aufruf unter iOS oder Android (deren Apps Daten mit [`Storage`](./nsh.md#storage) speichern) mit `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` und ein falsches Argument (eine unbekannte Kodierung oder Option) mit einem `TypeError`.

`readFile` gibt einen `Uint8Array` oder einen String mit `"utf8"` zurück und liest Dateien bis 64 MiB. `writeFile` schreibt einen String oder `Uint8Array` von bis zu 8 MiB und erstellt oder ersetzt dabei eine reguläre Datei. `readdir` listet bis zu 10 000 Namen auf (davon 1 MiB; ein größeres Verzeichnis wird mit einem `RangeError`, `code` `ERR_OUT_OF_RANGE` abgelehnt), sortiert, oder `Dirent`s (`name`, `isDirectory()`) mit `{ withFileTypes: true }`. `stat` und `lstat` liefern ein `Stats` mit `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` als `Date`s sowie `isFile()`, `isDirectory()` und `isSymbolicLink()`. `rmdir` entfernt ein leeres Verzeichnis. Eine VM führt bis zu 1024 Operationen gleichzeitig aus und hält bis zu 64 MiB Dateidaten in Bearbeitung (an `writeFile` übergebene Daten, bis sie geschrieben sind, und gelesene Daten, bis ihr Promise abgeschlossen ist); ein Aufruf über diesen Limits wird mit `ERR_NSH_QUOTA_EXCEEDED` abgelehnt, ein `writeFile` über 8 MiB mit einem `RangeError` (`code` `ERR_OUT_OF_RANGE`).

Der Browser-Speicher ist auf den Origin der Seite und den eigenen Namespace der App begrenzt, mit denselben Datei-Grants und Größenlimits, die in Rust geprüft werden. OPFS erfordert einen sicheren Kontext, etwa HTTPS oder localhost. Änderungszeiten von Dateien stammen aus den Metadaten des Browsers; unbekannte Zugriffs- und Erstellungszeiten sowie Modi sind null. `rename` verwendet ein atomares Verschieben über Browser-Handles und meldet `ENOTSUP`, wenn der Browser es nicht bereitstellt. Browser-Einträge sind reguläre Dateien oder Verzeichnisse, und `readlink` meldet `EINVAL`.
<a id="processes"></a>

## Prozesse

`process.spawn` und `process.run` starten Befehle auf Desktop-Hosts (macOS, Windows und Linux). Die Runtime führt das Programm direkt mit einem Argument-Array aus, ohne Shell, und besitzt dessen Pipes; stdout und stderr treffen als inkrementelles UTF-8 ein.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

Befehle müssen `process.execute` exakt entsprechen: `git` und `/usr/bin/git` sind getrennte Berechtigungen. Einfache Befehle werden über die absoluten Verzeichnisse des `PATH` des Hosts aufgelöst; unter Windows findet ein einfacher Befehl dort auch `<name>.com` und `<name>.exe`. Eine Batch-Datei (`.cmd`, `.bat`) läuft über `cmd.exe`: Erteilen Sie ihren absoluten Pfad (`C:\Windows\System32\cmd.exe`) und übergeben Sie `/d`, `/c` und das Skript als Argumente. Die Umgebung eines Kindprozesses besteht aus `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` und `LC_*` vom Host, plus den Namen, die `process.env` freigibt (exakter Abgleich, Groß-/Kleinschreibung wird nur unter Windows ignoriert, dessen Umgebung das ebenfalls tut). Ein Kindprozess läuft im Datenverzeichnis der App (wird angelegt, falls es fehlt) oder in `cwd`, einem existierenden Verzeichnis innerhalb eines `fs.write`-Roots, da der Kindprozess dort schreiben darf, wo er läuft. Ein einbettender Host kann die Berechtigungen einschränken.

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

`run` löst `{ code, signal, stdout, stderr }` für jeden Exit-Status auf: `code` ist der Exit-Status und `signal` `null`, oder, wenn ein Signal den Kindprozess beendet hat, ist `code` gleich `null` und `signal` dessen Name (`"SIGTERM"`). Es wird bei jedem Fehler abgelehnt. `spawn` gibt sofort einen Kindprozess zurück; `stdin: "pipe"` aktiviert `write` und `end`, und `lines: true` liefert vollständige Zeilen. `on(event, handler)` gibt den Kindprozess zurück, und ein Handler erhält die Payload des Events: den Text oder `{ code, signal }` einmalig nach der letzten Ausgabe (mit `error`, wenn die Runtime den Kindprozess beendet hat: ein Timeout, eine überlange Zeile) (sofort bei einem später hinzugefügten Listener). `pid` ist die Prozess-ID des Kindprozesses. `spawn` wirft vor dem Start des Kindprozesses das, womit `run` abgelehnt wird: Ein Befehl, den `process.execute` nicht erlaubt, schlägt mit `ERR_ACCESS_DENIED` fehl (`permission` `"process"`, `resource` der Befehl), ein `cwd` außerhalb der `fs.write`-Berechtigungen mit `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` das `cwd`), ein Aufruf außerhalb der Desktops mit `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` und ein Aufruf über dem Limit für Kindprozesse mit `ERR_NSH_QUOTA_EXCEEDED`; ein Startfehler trägt `code` (`ENOENT` für eine fehlende ausführbare Datei, `EACCES` für eine, die das OS nicht ausführen kann), `syscall` (`spawn <command>`) und `path`. `run` wird zu seiner Frist mit `ETIMEDOUT` abgelehnt und bei Ausgabe über dem Capture-Limit mit einem `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`); der Exit eines gestarteten Kindprozesses trägt dieselbe Nachricht in `error` und seinen Code in `errorCode`. `process.dataDir` ist `null`, wenn der Host kein Datenverzeichnis hat. `kill`, ein Timeout, das Cleanup des reaktiven Owners und der Teardown der VM beenden den gesamten Prozessbaum: Unter Unix erhält seine Prozessgruppe SIGTERM und nach 250 ms SIGKILL (beim Teardown sofort SIGKILL).

| Limit | Wert |
|---|---|
| `timeoutMs` | Bis zu 4.294.967.295 ms; `run` ist standardmäßig 30 Sekunden, `spawn` läuft bis zum Exit |
| Capture von `run` | 8 MiB pro Stream |
| Eine Zeile mit `lines: true` | 8 MiB |
| Kindprozesse pro VM | 32 |
| Ausgabe in Übertragung pro VM | 8 MiB; Leser warten, bis JS sie abgenommen hat |
| Ausstehendes stdin pro Kindprozess | 1 MiB; `write` wirft `ERR_NSH_QUOTA_EXCEEDED`, wenn es überschritten wird |
| Listener | 64 pro Event pro Kindprozess |

`process.exit(code?)` fordert den Host auf, diese App-Oberfläche zu schließen. Erteilen Sie die Berechtigung mit `"exit": true` in `capabilities.process`; die Engine leitet die Anfrage über den App-Exit-Befehl der Plattform weiter. Ein Aufruf, den die Berechtigung nicht abdeckt, wirft `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`). Hosts nehmen Exit-Anfragen über einen von ihnen installierten Exit-Handler entgegen; andernfalls wirft der Aufruf `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Unter macOS schließt dies das Fenster der Oberfläche. In einem Browser stoppt es die App und leert deren Oberfläche, während die Host-Seite geöffnet bleibt. Ein einbettender Host steuert, wie seine Oberfläche die Anfrage behandelt. Gallery verweigert diese Capability, damit die Aktion **Request host exit** den Umgang mit Berechtigungen demonstriert und die Demo geöffnet bleibt.

<a id="network-permissions-and-boundaries"></a>

## Netzwerkberechtigungen und -grenzen

Das globale `fetch` behält die Streaming-HTTP-Implementierung von NSH bei und prüft `network.hosts` oder `network.http` für Anfragen und Redirect-Hops. WebSocket unterstützt `ws:` / `wss:`, Text- und Binärnachrichten, Event-Listener und Closing-Handshakes. Ein WebSocket-Handshake ist ein HTTP-GET, daher verwenden sowohl das globale `WebSocket` als auch das Modul `websocket` mit seinem `connect` die HTTP-Berechtigungen: `ws` wird als `http` geprüft und `wss` als `https`, jeweils mit GET (eine Regel darf in `schemes` auch `ws` / `wss` auflisten). NSH prüft die anfängliche normalisierte URL, bevor die Verbindung gestartet wird. Der native Handshake verbindet sich mit dieser URL und lehnt Redirects ab; Redirects und Verbindungsrichtlinien von Browser-WebSockets steuert der Browser. Beide APIs lehnen eine URL mit Zugangsdaten oder Fragment ab. Jede VM hält höchstens 32 WebSockets über beide APIs hinweg, und Nachrichten sind in beiden auf höchstens 8 MiB begrenzt.

Eine URL, die der App nicht erlaubt ist, wird abgelehnt, bevor eine Verbindung startet. Das globale `WebSocket` meldet dies so, wie ein Browser eine fehlgeschlagene Verbindung meldet: Der Konstruktor gibt den Socket zurück, der dann `error` und `close` auslöst (Code 1006, `wasClean` `false`), sodass die Handler, die die App direkt nach dem Konstruktor setzt, beides empfangen. Das `connect` des Moduls wird mit `ERR_ACCESS_DENIED` abgelehnt (`permission` `"network"`, `resource` die URL). Der 33. WebSocket wirft (der Konstruktor) oder wird abgelehnt (`connect`) mit `ERR_NSH_QUOTA_EXCEEDED`, und eine fehlerhafte URL ist ein `SyntaxError` (der Konstruktor) oder ein `TypeError` (`connect`).

Das globale `WebSocket` reiht höchstens acht Nachrichten zum Senden ein, mit höchstens 8 MiB gepuffert (`bufferedAmount`); `send()` über eines der beiden Limits hinaus wirft `ERR_NSH_QUOTA_EXCEEDED`, und sobald der Socket schließt, verwirft `send()` seine Daten, wie es auch bei einem Browser geschieht. Sein Handshake und jeder Schreibvorgang laufen nach 30 Sekunden in ein Timeout, und das Schließen wartet bis zu 5 Sekunden auf den Close-Frame der Gegenstelle. Nachrichten werden bei Eintreffen als `message`-Events zugestellt.

Das Modul `websocket` mit seinem `WebSocketConnection` hält höchstens acht ausstehende Operationen (Lesen, Schreiben, Schließen) und höchstens 8 MiB an noch nicht gesendeten Schreibdaten; ein `write()` über eines der beiden Limits hinaus wird mit `ERR_NSH_QUOTA_EXCEEDED` abgelehnt, eine Nachricht über 8 MiB mit einem `RangeError` (`code` `ERR_OUT_OF_RANGE`). Ein `read()` darf jeweils warten; ein zweites wird mit einem `TypeError` abgelehnt. Nachrichten, die eintreffen, bevor sie gelesen werden, warten auf die App, und ihr Fluss folgt deren Lesevorgängen: Solange acht Nachrichten oder 8 MiB ungelesen warten, liest die Verbindung nicht mehr aus dem Netzwerk, sodass auch das Senden der Gegenstelle wartet, und das Lesen wird fortgesetzt, sobald die App liest. Auflösen, Verbinden und der Handshake zusammen, jeder Schreibvorgang und das Schließen laufen nach 30 Sekunden in ein Timeout.

`read()` löst die Nachrichten in Ankunftsreihenfolge auf. Sobald die Verbindung sauber geschlossen wurde (die Gegenstelle hat sie geschlossen, oder die App hat `close()` aufgerufen) und jede vorherige Nachricht gelesen ist, löst `read()` mit `null` auf, wie es bei einem `net`-Socket bei EOF der Fall ist; `closeCode` und `closeReason` enthalten dann Code und Reason des Close-Frames (`null`, solange die Verbindung offen ist; 1005 bei einem Close-Frame ohne Code, 1006 bei einer Verbindung, die ohne Closing-Handshake endete). `read()` wird nur bei einem Fehler abgelehnt, nach den Nachrichten, die davor kamen, mit seinem `code`: `ERR_SOCKET_CLOSED` für eine Verbindung, die ohne Closing-Handshake endete, `ETIMEDOUT`, der Code des OS bei einem Socket-Fehler, oder `EPROTO` bei einem Protokollfehler (mit dem HTTP-`status` eines abgelehnten Handshakes). `close(code?, reason?)` sendet seinen Code (1000, der Standard, oder 3000 bis 4999) und seinen Reason (höchstens 123 UTF-8-Bytes) im Close-Frame, wie beim globalen `WebSocket` mit seinem `close()`; ein Code oder Reason außerhalb dieser Vorgaben wird mit einem `RangeError` abgelehnt (`code` `ERR_OUT_OF_RANGE`). Es verwirft die noch nicht gelesenen Nachrichten und löst auf, sobald die Gegenstelle den Closing-Handshake beantwortet.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` verwendet nur `network.sockets`, eine Liste exakter `"host:port"`-Ziele (`"[::1]:9000"` für IPv6), die vor dem DNS-Lookup geprüft werden. Jeder Eintrag erlaubt einen Port auf einem Host; Host-Muster, `network.hosts` und HTTP-Berechtigungen decken nur HTTP-Verkehr ab, und eine App ohne `"capabilities"` listet ihre Sockets ebenfalls auf. Das zurückgegebene `Socket` stellt `read(size?)`, `write(text)` und `close()` bereit; Lesevorgänge liefern `Uint8Array` oder bei EOF `null`. Jeder Fehler wird abgelehnt: ein nicht erlaubtes Ziel mit `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`), der 33. Socket und Schreibvorgänge über die 4 MiB hinaus, die warten dürfen, mit `ERR_NSH_QUOTA_EXCEEDED`, ein Lese- oder Schreibvorgang über 1 MiB mit einem `RangeError` (`code` `ERR_OUT_OF_RANGE`); Verbindungs- und I/O-Fehler werden mit dem `code` von Node (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) und `syscall` abgelehnt, bei einer Verbindung auch mit `address` und `port`, und ein Schreibvorgang auf einem geschlossenen Socket mit `ERR_SOCKET_CLOSED` (ein Lesevorgang dort gibt `null` zurück). Verbindungen und I/O haben Timeouts von 30 Sekunden, jeder Lese-/Schreibvorgang ist auf 1 MiB begrenzt, höchstens 4 MiB an Schreibdaten dürfen auf das Senden warten, und `close()` beendet ausstehende Lese- und Schreibvorgänge sofort. Jede VM hält höchstens 32 Sockets offen oder im Verbindungsaufbau. Dies ist eine Promise-basierte Client-Socket-Schnittstelle.

Raw TCP nutzt native Hosts. Beide WebSocket-Schnittstellen verwenden in Web-Apps den Browser-Transport und behalten die Rust-Capability-Prüfungen und die oben genannten Limits bei. Benutzerdefinierte Browser-Handshake-Header melden einen expliziten Fehler wegen nicht unterstützter Option. Auch die Verbindungsrichtlinien des Browsers gelten. Berechtigungen des einbettenden Hosts bilden die Schnittmenge mit der Capability-Deklaration der App.

<a id="websocket-grant-example"></a>

## Beispiel für eine WebSocket-Berechtigung

Dieses `nsh.json`-Fragment erlaubt den GET-Handshake für diese `wss`-URL und behält deren Pfad und HTTPS-Geltungsbereich bei:

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

## Beispiel für eine TCP-Berechtigung

TCP verwendet eine Socket-Berechtigung: den exakten Host und Port, mit dem sich die App verbindet.

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

Öffnen Sie **Standard APIs** in `examples/gallery`, um Dateioperationen, Kindprozesse, TCP und beide WebSocket-Schnittstellen auszuführen sowie Host-Metadaten und eingereihte Jobs zu untersuchen. Die Utilities-Aktion demonstriert Buffer, Hashing, Kompression und File-URLs. Jede Aktion zeigt ihr Ergebnis oder ihren Fehler an. Dateien bleiben in einem temporären Verzeichnis unter dem eigenen Datenverzeichnis von Gallery und werden nach der Aktion entfernt. Die TCP- und WebSocket-Aktionen verbinden sich mit lokalen Echo-Servern auf den Ports 9876 und 9877. Im Web verwenden Dateiaktionen OPFS, Utilities laufen in WebAssembly, und beide WebSocket-Aktionen nutzen Browser-Verbindungen; Prozess- und TCP-Aktionen zeigen die typisierten Plattformfehler des Hosts an.

**AI Chat** in Gallery nutzt `process.spawn`, um auf dem Desktop über eine lokal installierte Claude- oder Codex-CLI zu chatten. Melden Sie sich über die CLI in einem Terminal an und wählen Sie dann den Provider im Composer. Antworten verwenden die Unterhaltung als Kontext; Stop und das Verlassen des Bildschirms beenden den Kindprozess. Web und Mobile führen geskriptete Streaming-Unterhaltungen aus, einschließlich Reasoning, Tool-Cards und Fehlerbehebung.
