---
title: "Pacchetti firmati"
description: "Distribuisci codice dell'app che le app host scaricano e verificano: chiavi, certificati, nsh publish, nuova firma, verifica, revoca e protezione dal rollback."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# Pacchetti firmati

Un pacchetto firmato (`.nshpkg`) è il modo in cui un'app host esegue codice NSH che non è stato distribuito con essa: un aggiornamento delle proprie schermate NSH, oppure una mini app di terze parti. `nsh publish` compila l'app e la firma; l'app host verifica la firma, la catena di certificati, le revoche e il numero di build prima che venga eseguito qualsiasi codice.

Un pacchetto contiene TSX. Il codice Rust dell'app host (un'app scritta in Rust, i componenti, i moduli e le classi dei suoi crate) fa parte dell'app host stessa e viene distribuito con essa, e il TSX di un pacchetto lo importa tramite i suoi specifier, come qualsiasi altro TSX ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). Così un'app Rust mantiene il proprio nucleo in Rust e distribuisce come pacchetti firmati le schermate che cambiano più spesso.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH verifica ed esegue i pacchetti; non li distribuisce. La provenienza dei pacchetti (il tuo server di aggiornamento, una CDN, uno store di mini app) e il momento in cui l'app li scarica dipendono dall'app host.

<a id="why-packages-are-signed"></a>

## Perché i pacchetti sono firmati

Il JS che un'app host esegue può raggiungere tutto ciò che l'app [concede](./sandbox-and-capabilities.md), quindi deve provenire da qualcuno di cui l'app si fida. C'è un secondo motivo: NSH distribuisce le app come bytecode QuickJS, che si carica più velocemente del sorgente, ma QuickJS non convalida il bytecode, e un bytecode costruito ad arte può corrompere la memoria. Per questo NSH carica il bytecode solo dalle risorse dell'app stessa (firmate dal sistema), dal dev server a cui lo sviluppatore si è connesso e dai pacchetti verificati. Tutto il resto deve essere sorgente JS.

<a id="keys-two-levels"></a>

## Chiavi: due livelli

- Una **chiave root** resta offline. Le app host si fidano della sua chiave pubblica; possono fidarsi di più root, ed è così che si effettua la rotazione di una root.
- Una root **certifica le chiavi di release**: un certificato indica la chiave di release, gli id app per cui può firmare e una finestra temporale.
- **I pacchetti sono firmati da una chiave di release** e ne portano il certificato. Le chiavi di release possono quindi essere ruotate (o revocate) senza aggiornare le app host, che conoscono solo la root.

Ogni chiave ha un id derivato dalla sua chiave pubblica (i primi 8 byte del suo SHA-256, in esadecimale), stampato da ogni comando.

<a id="create-the-keys"></a>

### Creare le chiavi

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

Ogni chiave è composta da due file: `<name>.secret` (leggibile solo dal proprietario) e `<name>.pub`, entrambi su una riga di base64. `nsh
keygen` non sovrascrive mai una chiave esistente.

> [!CAUTION]
> Tieni `root.secret` offline, ad esempio su un disco cifrato in una cassaforte. Chi la possiede può certificare chiavi che ogni app host che si fida della root accetterà. Le chiavi di release appartengono alla macchina di build o ai secret della CI.

<a id="certify-a-release-key"></a>

### Certificare una chiave di release

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Flag | Descrizione |
|---|---|
| `--root <file>` | La chiave segreta della root. |
| `--key <file>` | La chiave pubblica della chiave di release. |
| `--apps <pattern>` | Gli id app per cui può firmare: `*` (qualsiasi), `com.example.*` (gli id sotto `com.example.`) oppure un id esatto. Ripetibile. |
| `--days <n>` | Per quanto tempo può firmare, a partire da adesso. Predefinito: 365. |
| `-o, --out <file>` | Il certificato da scrivere. |

Il certificato è un piccolo file JSON; non è segreto.

<a id="publish-a-package"></a>

## Pubblicare un pacchetto

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` compila l'app in modalità release e la firma. L'id app, il nome, la versione e la build provengono da `nsh.json` accanto all'entry, e possono essere sovrascritti dai flag:

| Flag | Descrizione |
|---|---|
| `--key <file>` | La chiave segreta della chiave di release. |
| `--cert <file>` | Il suo certificato. |
| `-o, --out <file>` | Il pacchetto da scrivere. Predefinito: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <id>` | Id app, ad esempio `com.example.app`. |
| `--app-version <version>` | Versione, ad esempio `1.2.0`. |
| `--build <n>` | Numero di build. Obbligatorio (qui o in `nsh.json`); deve crescere a ogni release. |
| `--source-map <where>` | `package` (predefinito): nel pacchetto. `file`: in `<package>.map` accanto ad esso, non nel pacchetto. `none`: omessa. Vedi [Errori dai pacchetti pubblicati](#errors-from-published-packages). |
| `--strip-debug` | Omette dal bytecode le tabelle di righe e colonne: un pacchetto più piccolo i cui stack di errore non hanno posizioni. |
| `--min-runtime <version>` | Il runtime più vecchio che esegue il pacchetto, ad esempio `0.2.0` (`nsh.json` `minRuntime`). Predefinito: la versione di questa CLI. Vedi [Quali runtime eseguono un pacchetto](#which-runtimes-run-a-package). |

`nsh publish` si rifiuta di firmare ciò che un dispositivo rifiuterebbe: il certificato deve coprire l'id app e l'ora corrente.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### Quali runtime eseguono un pacchetto

Un pacchetto indica il runtime NSH più vecchio che lo esegue, e le app host con un runtime più vecchio lo rifiutano prima che venga eseguito qualsiasi cosa:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

Per impostazione predefinita è la versione della CLI che ha compilato il pacchetto: il bundle è compilato rispetto ai moduli di quella CLI, quindi quel runtime è quello noto per eseguirlo. Quando le app host sul campo hanno un runtime più vecchio e l'app usa solo ciò che quel runtime offre, pubblica per esso con `--min-runtime` (oppure `minRuntime` in `nsh.json`):

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

La versione è `MAJOR.MINOR.PATCH`; un suffisso di pre-release (`0.2.0-beta.1`) conta come la versione senza di esso. Non può essere più recente della CLI. Prova il pacchetto su un'app host con quel runtime prima di caricarlo: un import o una funzione che il runtime più vecchio non ha fallisce quando il modulo viene caricato.

<a id="what-a-package-holds"></a>

### Cosa contiene un pacchetto

Un pacchetto è un unico file: un header JSON (id app, nome, versione, build, le capability dichiarate, la versione del bytecode, il runtime minimo, l'ora di firma, il certificato della chiave di release e una tabella dei file con il loro SHA-256), poi i file, poi la firma Ed25519 della chiave di release su tutto ciò che precede. I file sono:

- il sorgente JS dell'app (sempre),
- il suo bytecode, usato solo quando il runtime del dispositivo ha la stessa versione di bytecode (altrimenti viene eseguito il sorgente, così un pacchetto continua a funzionare sui runtime più recenti),
- la sua source map (a meno che non sia stato pubblicato con `--source-map file` o `none`),
- gli asset che importa (immagini, font).

L'identità del pacchetto, usata per la revoca, è lo SHA-256 dell'intero file.

<a id="packages-from-newer-versions-of-nsh"></a>

### Pacchetti da versioni più recenti di NSH

Un'app host esegue i pacchetti firmati da un `nsh publish` più recente, purché il suo runtime sia almeno il [runtime minimo](#which-runtimes-run-a-package) del pacchetto. Ciò che una versione più recente aggiunge e che il runtime dell'host non conosce viene escluso, e non amplia mai ciò che il pacchetto può fare:

- i campi dell'header e i file che non conosce vengono ignorati (sono comunque coperti dalla firma e dai loro hash), a meno che il pacchetto non segni un campo come uno che il suo runtime deve comprendere: in tal caso i runtime più vecchi lo rifiutano;
- le [capability](./sandbox-and-capabilities.md) che non conosce non vengono concesse, e una capability o una concessione `http` con una chiave che non conosce viene scartata per intero, dato che quella chiave potrebbe limitarla.

Ciò che è stato escluso viene registrato nel log quando il pacchetto viene caricato.

<a id="sign-a-package-again"></a>

## Firmare di nuovo un pacchetto

Una piattaforma che distribuisce i pacchetti di più app può firmarli tutti con una propria chiave: la CI compila ogni pacchetto e lo firma con una chiave di cui si fidano le sue app di test, e la piattaforma lo firma di nuovo con la chiave di cui si fidano le app di produzione.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Flag | Descrizione |
|---|---|
| `--key <file>` | La chiave segreta della chiave di release. |
| `--cert <file>` | Il suo certificato. |
| `-o, --out <file>` | Il pacchetto da scrivere. Può essere il pacchetto letto. Predefinito: `.nsh/out/<id>-<build>.nshpkg`. |

Il pacchetto conserva tutto ciò che la CI ha inserito: i file, l'id app, la versione e la build, le capability dichiarate, il [runtime minimo](#which-runtimes-run-a-package) e ciò che una [versione più recente di NSH](#packages-from-newer-versions-of-nsh) vi ha scritto. Il certificato, l'ora di firma e la firma diventano quelli della nuova chiave, quindi il pacchetto ha un proprio SHA-256, quello con cui [revocarlo](#revoke-keys-and-packages).

Prima di firmare, `nsh publish` controlla che il pacchetto sia integro (firmato dalla chiave indicata dal suo certificato, con la tabella dei file che copre i dati e ogni file corrispondente al proprio hash) e che il nuovo certificato copra l'id app e l'ora corrente. Da quel momento la nuova firma garantisce per il pacchetto, bytecode incluso, quindi una piattaforma firma di nuovo i pacchetti prodotti dalle proprie build. Gli strumenti Rust firmano di nuovo con `nsh_package::resign(&bytes, &key, &certificate)`.

<a id="verify-a-package"></a>

## Verificare un pacchetto

`nsh verify` controlla un pacchetto esattamente come farebbe un'app host che si fida delle root indicate:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Flag | Descrizione |
|---|---|
| `--root <file>` | La chiave pubblica di una root fidata. Ripetibile. Se assente, viene controllata solo la firma del pacchetto stesso. |
| `--revocations <file>` | Una lista di revoche da applicare per prima. |

Un dispositivo controlla, in ordine:

1. la firma del certificato da parte di una root fidata;
2. che la chiave di release non sia revocata;
3. la firma del pacchetto da parte della chiave di release;
4. che il certificato copra l'id app e l'ora di firma;
5. il runtime minimo di cui il pacchetto ha bisogno;
6. che la tabella dei file copra esattamente i dati e che ogni file corrisponda al proprio hash;
7. che il pacchetto stesso non sia revocato;
8. che la sua build non sia più vecchia della build più alta di quell'app accettata in precedenza (protezione dal rollback).

Un pacchetto rifiutato genera un errore che indica quale controllo è fallito; l'app che era in esecuzione continua a funzionare.

<a id="revoke-keys-and-packages"></a>

## Revocare chiavi e pacchetti

Una root firma **liste di revoche**: chiavi di release e pacchetti che non devono più essere caricati.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Flag | Descrizione |
|---|---|
| `--root <file>` | La chiave segreta della root. |
| `--extend <file>` | Mantiene le voci di questa lista (l'ultima pubblicata). |
| `--sequence <n>` | Il numero della lista, più alto di qualsiasi numero pubblicato prima. Con `--extend`, il valore predefinito è quello di quella lista più uno. |
| `--key <id>` | L'id di una chiave di release da revocare. Ripetibile. |
| `--package <sha256>` | Lo SHA-256 di un pacchetto (come lo stampa `nsh verify`) da revocare. Ripetibile. |
| `-o, --out <file>` | La lista da scrivere. |

Un trust store accetta solo una lista con un numero di sequenza più alto di quello che ha, quindi una vecchia lista non può essere riproposta per annullare una revoca. Pubblica la lista più recente dove le tue app la recuperano, e applicala con `updateRevocations` prima di aprire i pacchetti.

<a id="rollback-protection"></a>

## Protezione dal rollback

Quando un'app host accetta un pacchetto, il suo trust store registra il numero di build per quell'id app e da quel momento rifiuta le build più vecchie. Un attaccante che si sia procurato un pacchetto firmato più vecchio con una vulnerabilità nota non può far eseguire quel pacchetto all'app. Il record persiste nella directory di stato dello store (`nsh-trust.json`), quindi sopravvive ai riavvii. Su GPUI un'app host può registrarlo più tardi, una volta che il nuovo pacchetto si è dimostrato sano (`verify_package`, poi `accept_package`; vedi sotto).

<a id="loading-packages-in-a-host-app"></a>

## Caricare i pacchetti in un'app host

La verifica calcola l'hash dell'intero pacchetto ed estrae i suoi asset (una volta per pacchetto, nella directory del trust store), quindi viene eseguita fuori dal thread della UI; l'esecuzione del risultato avviene invece su di esso.

**GPUI (Rust)**, dove l'app host può anche accettare un pacchetto solo dopo che si è dimostrato sano:

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

Finché un pacchetto non è accettato, la build accettata prima continua a superare la verifica, quindi un'app host il cui nuovo pacchetto fallisce può tornare a quello che eseguiva (i segnali sono gli errori fatali di `AppView::on_error`, oppure un crash prima dell'accettazione). Le build più vecchie di quella accettata restano rifiutate, e un pacchetto revocato nel frattempo non viene accettato. `load_package` verifica e accetta subito, come fa `openPackage` su iOS e Android.

Le [capability](./sandbox-and-capabilities.md) dichiarate dal pacchetto viaggiano con esso: un pacchetto può fare solo ciò che dichiara, e solo ciò che l'app host concede in aggiunta.

API complete: [GPUI](./gpui.md#embedding-in-a-gpui-app), [Embedding in iOS apps](./ios.md#signed-packages), [Embedding in Android apps](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## Errori dai pacchetti pubblicati

Il bytecode di un pacchetto conserva le sue tabelle di righe e colonne, quindi i suoi errori hanno posizioni, e il runtime le mappa sui tuoi sorgenti con la source map del pacchetto prima di passarle al gestore degli errori dell'app host:

```text
Error: boom
    at n (App.tsx:5:3)
```

La source map contiene i sorgenti originali della tua app ed è spesso il file più grande di un pacchetto: circa metà dei 2,6 MB dell'esempio gallery. Per tenerla per te, pubblicala accanto al pacchetto invece che al suo interno:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

I dispositivi riportano allora le posizioni del bundle (`at n (bundle.js:1:80)`). Conserva la map insieme al pacchetto a cui appartiene, e mappa ciò che l'app host ha riportato con `nsh symbolicate`:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` legge il testo dell'errore da un file o dallo standard input e accetta un file map o un pacchetto che ne contiene una. Le tabelle delle righe aggiungono circa un quinto al bytecode (3–5% di un pacchetto con la sua map); `--strip-debug` le omette, e gli stack riportano allora `at n (<null>:0:1)`, senza nulla da mappare.

<a id="trying-a-package-in-development"></a>

## Provare un pacchetto in sviluppo

Gli host di sviluppo che `nsh run` installa possono eseguire un pacchetto come farebbe un'app che lo incorpora.

Su iOS, l'eseguibile host accetta `--package <file>` e una o più `--root <root.pub>`. Dopo che `nsh run` ha installato l'host nel simulatore (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

Su Android, l'host di sviluppo (`DevActivity`, installato da `nsh run --target android`) accetta gli extra `package` (un percorso sul dispositivo) e `root` (chiavi pubbliche in base64, separate da virgole):

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

Il loro stato di fiducia risiede nella directory temporanea (iOS) o di cache (Android), quindi anche lì le build più vecchie di una che hanno accettato vengono rifiutate.
<a id="a-release-checklist"></a>

## Una checklist di rilascio

1. Tieni la root key offline; certifica una release key per team o per famiglia di app, con validità di un anno o meno.
2. Incrementa `build` in `nsh.json` a ogni rilascio; `nsh publish` rifiuta un pacchetto che ne sia privo.
3. Esegui `nsh verify --root root.pub` sul pacchetto prima di caricarlo.
4. Distribuisci `root.pub` all'interno della host app; distribuisci le liste di revoca separatamente, in modo da poter revocare senza un aggiornamento dell'app.
5. Se una release key viene compromessa, revocala (`nsh revoke --extend … --key <id>`), certifica una nuova chiave e pubblica di nuovo.
6. Con una piattaforma che firma per le sue app, dai alla CI una root dedicata di cui si fidano solo le app di test, e distribuisci la root della piattaforma nelle app di produzione; la piattaforma firma di nuovo i pacchetti della CI (`nsh publish <package>`).

<a id="see-also"></a>

## Vedi anche

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
