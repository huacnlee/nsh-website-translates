---
title: "Signierte Pakete"
description: "Liefern Sie App-Code aus, den Host-Apps herunterladen und verifizieren: Schlüssel, Zertifikate, nsh publish, erneutes Signieren, Verifizierung, Widerruf und Rollback-Schutz."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---


# Signierte Pakete

Ein signiertes Paket (`.nshpkg`) ist der Weg, auf dem eine Host-App NSH-Code ausführt, der nicht mit ihr ausgeliefert wurde: ein Update der eigenen NSH-Screens oder eine Mini-App eines Drittanbieters. `nsh publish` baut die App und signiert sie; die Host-App prüft Signatur, Zertifikatskette, Sperrungen und Build-Nummer, bevor etwas ausgeführt wird.

Ein Paket enthält TSX. Der Rust-Code der Host-App (eine in Rust geschriebene App, die Komponenten, Module und Klassen ihrer Crates) ist Teil der Host-App selbst und wird mit ihr ausgeliefert. Das TSX eines Pakets importiert ihn über seine Specifier, wie jedes andere TSX auch ([Mit Rust entwickeln](./rust.md#extending-a-rust-app-with-tsx)). So behält eine Rust-App ihren Kern in Rust und liefert die Screens, die sich oft ändern, als signierte Pakete aus.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH prüft und führt Pakete aus, liefert sie aber nicht aus. Woher die Pakete kommen (Ihr Update-Server, ein CDN, ein Store für Mini-Apps) und wann die App sie herunterlädt, liegt bei der Host-App.

<a id="why-packages-are-signed"></a>

## Warum Pakete signiert werden

Das JS, das eine Host-App ausführt, kann alles erreichen, was die App [gewährt](./sandbox-and-capabilities.md). Es muss daher von jemandem stammen, dem die App vertraut. Es gibt einen zweiten Grund: NSH liefert Apps als QuickJS-Bytecode aus, der schneller lädt als Quellcode. QuickJS validiert Bytecode jedoch nicht, und manipulierter Bytecode kann den Speicher beschädigen. Deshalb lädt NSH Bytecode nur aus den eigenen (vom System signierten) Ressourcen der App, vom Dev-Server, mit dem der Entwickler verbunden ist, und aus verifizierten Paketen. Alles andere muss JS-Quellcode sein.

<a id="keys-two-levels"></a>

## Schlüssel: zwei Ebenen

- Ein **Root-Schlüssel** bleibt offline. Host-Apps vertrauen seinem öffentlichen Schlüssel; sie können mehreren Roots vertrauen, so wird ein Root rotiert.
- Ein Root **zertifiziert Release-Schlüssel**: Ein Zertifikat nennt den Release-Schlüssel, die App-IDs, für die er signieren darf, und ein Zeitfenster.
- **Pakete werden von einem Release-Schlüssel signiert** und enthalten dessen Zertifikat. Release-Schlüssel lassen sich daher rotieren (oder sperren), ohne die Host-Apps zu aktualisieren, die nur den Root kennen.

Jeder Schlüssel hat eine ID, die aus seinem öffentlichen Schlüssel abgeleitet wird (die ersten 8 Bytes seines SHA-256, in Hex) und von jedem Befehl ausgegeben wird.

<a id="create-the-keys"></a>

### Schlüssel erstellen

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

Jeder Schlüssel besteht aus zwei Dateien: `<name>.secret` (nur für den Eigentümer lesbar) und `<name>.pub`, beide jeweils eine Zeile Base64. `nsh keygen` überschreibt nie einen vorhandenen Schlüssel.

> [!CAUTION]
> Bewahren Sie `root.secret` offline auf, zum Beispiel auf einem verschlüsselten Laufwerk in einem Tresor. Wer ihn besitzt, kann Schlüssel zertifizieren, die jede Host-App akzeptiert, die dem Root vertraut. Release-Schlüssel gehören auf den Build-Rechner oder in die CI-Secrets.

<a id="certify-a-release-key"></a>

### Release-Schlüssel zertifizieren

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Flag | Beschreibung |
|---|---|
| `--root <file>` | Der geheime Schlüssel des Roots. |
| `--key <file>` | Der öffentliche Schlüssel des Release-Schlüssels. |
| `--apps <pattern>` | App-IDs, für die er signieren darf: `*` (beliebige), `com.example.*` (IDs unter `com.example.`) oder eine exakte ID. Wiederholbar. |
| `--days <n>` | Wie lange er signieren darf, ab jetzt. Standard: 365. |
| `-o, --out <file>` | Das zu schreibende Zertifikat. |

Das Zertifikat ist eine kleine JSON-Datei; es ist nicht geheim.

<a id="publish-a-package"></a>

## Ein Paket veröffentlichen

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` baut die App im Release-Modus und signiert sie. App-ID, Name, Version und Build stammen aus `nsh.json` neben dem Entry und können durch die Flags überschrieben werden:

| Flag | Beschreibung |
|---|---|
| `--key <file>` | Der geheime Schlüssel des Release-Schlüssels. |
| `--cert <file>` | Sein Zertifikat. |
| `-o, --out <file>` | Das zu schreibende Paket. Standard: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <id>` | App-ID, zum Beispiel `com.example.app`. |
| `--app-version <version>` | Version, zum Beispiel `1.2.0`. |
| `--build <n>` | Build-Nummer. Erforderlich (hier oder in `nsh.json`); sie muss mit jedem Release steigen. |
| `--source-map <where>` | `package` (Standard): im Paket. `file`: in `<package>.map` daneben, nicht im Paket. `none`: weggelassen. Siehe [Fehler aus veröffentlichten Paketen](#errors-from-published-packages). |
| `--strip-debug` | Lässt die Zeilen- und Spaltentabellen aus dem Bytecode weg: ein kleineres Paket, dessen Fehler-Stacks keine Positionen enthalten. |
| `--min-runtime <version>` | Die niedrigste Runtime, die das Paket ausführt, zum Beispiel `0.2.0` (`nsh.json` `minRuntime`). Standard: die Version dieser CLI. Siehe [Welche Runtimes ein Paket ausführen](#which-runtimes-run-a-package). |

`nsh publish` weigert sich, etwas zu signieren, das ein Gerät ablehnen würde: Das Zertifikat muss die App-ID und die aktuelle Zeit abdecken.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### Welche Runtimes ein Paket ausführen

Ein Paket nennt die niedrigste NSH-Runtime, die es ausführt. Host-Apps mit einer älteren Runtime lehnen es ab, bevor etwas ausgeführt wird:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

Standardmäßig ist das die Version der CLI, die das Paket gebaut hat: Das Bundle wird gegen die Module dieser CLI kompiliert, sodass diese Runtime die ist, von der bekannt ist, dass sie es ausführt. Wenn Host-Apps im Feld eine ältere Runtime haben und die App nur verwendet, was diese Runtime bietet, veröffentlichen Sie dafür mit `--min-runtime` (oder `minRuntime` in `nsh.json`):

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

Die Version lautet `MAJOR.MINOR.PATCH`; ein Pre-Release-Suffix (`0.2.0-beta.1`) zählt als die Version ohne dieses Suffix. Sie darf nicht neuer sein als die CLI. Testen Sie das Paket auf einer Host-App mit dieser Runtime, bevor Sie es hochladen: Ein Import oder eine Funktion, die der älteren Runtime fehlt, schlägt beim Laden des Moduls fehl.

<a id="what-a-package-holds"></a>

### Was ein Paket enthält

Ein Paket ist eine einzelne Datei: ein JSON-Header (App-ID, Name, Version, Build, die deklarierten Capabilities, die Bytecode-Version, die minimale Runtime, der Signierzeitpunkt, das Zertifikat des Release-Schlüssels und eine Tabelle der Dateien mit ihrem SHA-256), dann die Dateien, dann die Ed25519-Signatur des Release-Schlüssels über alles davor. Die Dateien sind:

- der JS-Quellcode der App (immer),
- ihr Bytecode, der nur verwendet wird, wenn die Runtime des Geräts dieselbe Bytecode-Version hat (andernfalls läuft der Quellcode, sodass ein Paket auch auf neueren Runtimes weiter funktioniert),
- ihre Source Map (außer das Paket wurde mit `--source-map file` oder `none` veröffentlicht),
- die Assets, die sie importiert (Bilder, Schriften).

Die Identität des Pakets, die für Sperrungen verwendet wird, ist der SHA-256 der gesamten Datei.

<a id="packages-from-newer-versions-of-nsh"></a>

### Pakete aus neueren Versionen von NSH

Eine Host-App führt Pakete aus, die ein neueres `nsh publish` signiert hat, solange ihre Runtime mindestens der [minimalen Runtime](#which-runtimes-run-a-package) des Pakets entspricht. Was eine neuere Version hinzufügt und die Runtime des Hosts nicht kennt, wird weggelassen und erweitert nie, was das Paket darf:

- Header-Felder und Dateien, die sie nicht kennt, werden ignoriert (sie sind weiterhin von der Signatur und ihren Hashes abgedeckt), es sei denn, das Paket markiert ein Feld als eines, das ihre Runtime verstehen muss: Dann lehnen ältere Runtimes es ab;
- [Capabilities](./sandbox-and-capabilities.md), die sie nicht kennt, werden nicht gewährt, und eine Capability oder ein `http`-Grant mit einem Schlüssel, den sie nicht kennt, wird als Ganzes verworfen, da dieser Schlüssel ihn einschränken könnte.

Was weggelassen wurde, wird beim Laden des Pakets protokolliert.

<a id="sign-a-package-again"></a>

## Ein Paket erneut signieren

Eine Plattform, die die Pakete mehrerer Apps verteilt, kann sie alle mit einem eigenen Schlüssel signieren: Die CI baut jedes Paket und signiert es mit einem Schlüssel, dem ihre Test-Apps vertrauen, und die Plattform signiert es erneut mit dem Schlüssel, dem die Produktions-Apps vertrauen.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Flag | Beschreibung |
|---|---|
| `--key <file>` | Der geheime Schlüssel des Release-Schlüssels. |
| `--cert <file>` | Sein Zertifikat. |
| `-o, --out <file>` | Das zu schreibende Paket. Es kann das gelesene Paket sein. Standard: `.nsh/out/<id>-<build>.nshpkg`. |

Das Paket behält alles, was die CI hineingelegt hat: die Dateien, App-ID, Version und Build, die deklarierten Capabilities, die [minimale Runtime](#which-runtimes-run-a-package) und das, was eine [neuere Version von NSH](#packages-from-newer-versions-of-nsh) geschrieben hat. Das Zertifikat, der Signierzeitpunkt und die Signatur werden die des neuen Schlüssels, sodass das Paket einen eigenen SHA-256 hat, über den es [gesperrt](#revoke-keys-and-packages) wird.

Bevor es signiert, prüft `nsh publish`, dass das Paket intakt ist (signiert von dem Schlüssel, den sein Zertifikat nennt, seine Dateitabelle deckt die Daten ab, jede Datei entspricht ihrem Hash) und dass das neue Zertifikat die App-ID und die aktuelle Zeit abdeckt. Ab dann bürgt die neue Signatur für das Paket, einschließlich seines Bytecodes. Deshalb signiert eine Plattform nur die Pakete erneut, die ihre eigenen Builds erzeugt haben. Rust-Tools signieren mit `nsh_package::resign(&bytes, &key, &certificate)` erneut.

<a id="verify-a-package"></a>

## Ein Paket verifizieren

`nsh verify` prüft ein Paket genau so, wie es eine Host-App täte, die den angegebenen Roots vertraut:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Flag | Beschreibung |
|---|---|
| `--root <file>` | Der öffentliche Schlüssel eines vertrauenswürdigen Roots. Wiederholbar. Ohne Angabe wird nur die eigene Signatur des Pakets geprüft. |
| `--revocations <file>` | Eine Sperrliste, die zuerst angewendet wird. |

Ein Gerät prüft der Reihe nach:

1. die Signatur des Zertifikats durch einen vertrauenswürdigen Root;
2. dass der Release-Schlüssel nicht gesperrt ist;
3. die Signatur des Pakets durch den Release-Schlüssel;
4. dass das Zertifikat die App-ID und den Signierzeitpunkt abdeckt;
5. die minimale Runtime, die das Paket benötigt;
6. dass die Dateitabelle die Daten exakt abdeckt und jede Datei ihrem Hash entspricht;
7. dass das Paket selbst nicht gesperrt ist;
8. dass sein Build nicht älter ist als der höchste zuvor akzeptierte Build dieser App (Rollback-Schutz).

Ein abgelehntes Paket löst einen Fehler aus, der angibt, welche Prüfung fehlgeschlagen ist; die App, die lief, läuft weiter.

<a id="revoke-keys-and-packages"></a>

## Schlüssel und Pakete sperren

Ein Root signiert **Sperrlisten**: Release-Schlüssel und Pakete, die nicht mehr geladen werden dürfen.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Flag | Beschreibung |
|---|---|
| `--root <file>` | Der geheime Schlüssel des Roots. |
| `--extend <file>` | Die Einträge dieser Liste (der zuletzt veröffentlichten) beibehalten. |
| `--sequence <n>` | Die Nummer der Liste, höher als jede zuvor veröffentlichte. Mit `--extend` standardmäßig die Nummer jener Liste plus eins. |
| `--key <id>` | Eine ID eines zu sperrenden Release-Schlüssels. Wiederholbar. |
| `--package <sha256>` | Der SHA-256 eines zu sperrenden Pakets (wie ihn `nsh verify` ausgibt). Wiederholbar. |
| `-o, --out <file>` | Die zu schreibende Liste. |

Ein Trust Store akzeptiert nur eine Liste mit einer höheren Sequenznummer als die, die er hat. Eine alte Liste lässt sich also nicht erneut einspielen, um eine Sperrung aufzuheben. Veröffentlichen Sie die neueste Liste dort, wo Ihre Apps sie abrufen, und wenden Sie sie mit `updateRevocations` an, bevor Sie Pakete öffnen.

<a id="rollback-protection"></a>

## Rollback-Schutz

Wenn eine Host-App ein Paket akzeptiert, speichert ihr Trust Store die Build-Nummer für diese App-ID und lehnt ab dann ältere Builds ab. Ein Angreifer, der ein älteres, signiertes Paket mit einer bekannten Schwachstelle erlangt hat, kann die App nicht dazu bringen, es auszuführen. Der Eintrag wird im State-Verzeichnis des Stores (`nsh-trust.json`) gespeichert und übersteht daher Neustarts. Unter GPUI kann eine Host-App ihn später speichern, sobald sich das neue Paket als fehlerfrei erwiesen hat (`verify_package`, dann `accept_package`; siehe unten).

<a id="loading-packages-in-a-host-app"></a>

## Pakete in einer Host-App laden

Die Verifizierung berechnet den Hash des gesamten Pakets und extrahiert seine Assets (einmal pro Paket, im Verzeichnis des Trust Stores) und läuft daher außerhalb des UI-Threads; die Ausführung des Ergebnisses geschieht auf ihm.

**GPUI (Rust)**, wo die Host-App ein Paket auch erst akzeptieren kann, wenn es sich als fehlerfrei erwiesen hat:

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

**iOS (Swift)**:

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

Solange ein Paket nicht akzeptiert ist, wird der zuvor akzeptierte Build weiterhin verifiziert. Eine Host-App, deren neues Paket fehlschlägt, kann also zu dem zurückkehren, das sie ausgeführt hat (die fatalen Fehler von `AppView::on_error` oder ein Absturz vor dem Akzeptieren sind die Signale). Builds, die älter sind als der akzeptierte, bleiben abgelehnt, und ein zwischenzeitlich gesperrtes Paket wird nicht akzeptiert. `load_package` verifiziert und akzeptiert in einem Schritt, so wie es `openPackage` unter iOS und Android tut.

Die deklarierten [Capabilities](./sandbox-and-capabilities.md) des Pakets reisen mit ihm: Ein Paket kann nur tun, was es deklariert, und nur das, was die Host-App zusätzlich gewährt.

Vollständige API: [GPUI](./gpui.md#embedding-in-a-gpui-app), [Einbettung in iOS-Apps](./ios.md#signed-packages), [Einbettung in Android-Apps](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## Fehler aus veröffentlichten Paketen

Der Bytecode eines Pakets behält seine Zeilen- und Spaltentabellen, sodass seine Fehler Positionen haben. Die Runtime bildet sie mit der Source Map des Pakets auf Ihre Quellen ab, bevor sie sie an den Fehler-Handler der Host-App übergibt:

```text
Error: boom
    at n (App.tsx:5:3)
```

Die Source Map enthält die Originalquellen Ihrer App und ist oft die größte Datei in einem Paket: etwa die Hälfte der 2,6 MB des Gallery-Beispiels. Um sie für sich zu behalten, veröffentlichen Sie sie stattdessen neben dem Paket:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

Geräte melden dann die Positionen des Bundles (`at n (bundle.js:1:80)`). Bewahren Sie die Map zusammen mit dem Paket auf, zu dem sie gehört, und bilden Sie damit ab, was die Host-App gemeldet hat, mit `nsh symbolicate`:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` liest den Fehlertext aus einer Datei oder von der Standardeingabe und akzeptiert eine Map-Datei oder ein Paket, das eine enthält. Die Zeilentabellen machen etwa ein Fünftel des Bytecodes aus (3–5 % eines Pakets mit seiner Map); `--strip-debug` lässt sie weg, und Stacks lauten dann `at n (<null>:0:1)`, ohne etwas abzubilden.

<a id="trying-a-package-in-development"></a>

## Ein Paket in der Entwicklung ausprobieren

Die Entwicklungs-Hosts, die `nsh run` installiert, können ein Paket so ausführen, wie es eine einbettende App täte.

Unter iOS akzeptiert die Host-Executable `--package <file>` und eine oder mehrere `--root <root.pub>`. Nachdem `nsh run` den Host im Simulator installiert hat (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

Unter Android akzeptiert der Entwicklungs-Host (`DevActivity`, installiert von `nsh run --target android`) die Extras `package` (ein Pfad auf dem Gerät) und `root` (Base64-kodierte öffentliche Schlüssel, durch Kommas getrennt):

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

Ihr Trust-Zustand liegt im temporären Verzeichnis (iOS) bzw. im Cache-Verzeichnis (Android), sodass auch dort Builds abgelehnt werden, die älter sind als ein bereits akzeptierter.
<a id="a-release-checklist"></a>

## Eine Release-Checkliste

1. Halte den Root-Schlüssel offline; zertifiziere pro Team oder pro App-Familie einen Release-Schlüssel mit einer Gültigkeit von höchstens einem Jahr.
2. Erhöhe `build` in `nsh.json` bei jedem Release; `nsh publish` weist ein Paket ohne diese Angabe zurück.
3. Führe `nsh verify --root root.pub` auf dem Paket aus, bevor du es hochlädst.
4. Liefere `root.pub` innerhalb der Host-App aus; liefere Sperrlisten separat aus, damit du Schlüssel sperren kannst, ohne die App zu aktualisieren.
5. Wenn ein Release-Schlüssel kompromittiert wird, sperre ihn (`nsh revoke --extend … --key <id>`), zertifiziere einen neuen und veröffentliche erneut.
6. Bei einer Plattform, die für ihre Apps signiert, gib der CI einen eigenen Root, dem nur die Test-Apps vertrauen, und liefere den Root der Plattform in den Produktions-Apps aus; die Plattform signiert die Pakete der CI anschließend neu (`nsh publish <package>`).

<a id="see-also"></a>

## Siehe auch

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
