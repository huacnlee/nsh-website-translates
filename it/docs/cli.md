---
title: "CLI"
description: "Tutti i sottocomandi e i flag di NSH - init, build, test, check, dev, run, package e i comandi di firma keygen, certify, publish, verify, symbolicate e revoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---

# CLI

`nsh` è lo strumento con cui si crea un'app NSH, in Rust o in TSX. Ogni sottocomando che compila un'app accetta `[ENTRY]`: la directory dell'app (predefinita: quella corrente, quindi `cd my-app && nsh run` funziona), che esegue il componente root di un'app Rust (`nsh.json` `"root"`) o il `App.tsx` di un'app TSX, oppure un modulo di ingresso TSX. Legge `nsh.json` nella root dell'app e aggiorna le dichiarazioni dei tipi in `.nsh/types`.

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

`nsh <command> --help` stampa i flag di un comando; `nsh -V` (`--version`) stampa la versione e la revisione Git da cui è stato compilato.

## Output

Ogni comando stampa una riga per passaggio e i dettagli solo quando qualcosa fallisce:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` è un passaggio completato, `→` indica dove connettersi, `•` ciò che ha fatto un dispositivo; le righe `warn` e `error` sono problemi, e le righe semplici sono l'output dell'app stessa (`console.log`). In un terminale uno spinner mostra il passaggio in corso e le righe sono colorate (a meno che `NO_COLOR` sia impostato); se l'output è rediretto su file, vengono scritte solo le righe di risultato, senza colori. L'output degli strumenti eseguiti da NSH (cargo per il crate Rust di un'app, gli host di sviluppo) viene stampato sotto una riga `error` quando uno di essi fallisce.

`-v, --verbose` (qualsiasi comando; anche `NSH_VERBOSE=1`) stampa tutto man mano che arriva: ogni riga di log con il suo livello e la sua origine, l'output di cargo e quello degli host.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

Crea un'app in `DIR` (predefinita: la directory corrente, creata se mancante) a partire da un template. Senza `--template`, `nsh init` chiede quale usare in un terminale (Invio sceglie `ts`) e usa `ts` altrove (script, CI).

| Template | Cosa crea |
|---|---|
| `rust` | Un'app scritta in Rust: un progetto Cargo (`Cargo.toml`, `src/lib.rs` con il componente root, `src/main.rs` per `cargo run`), `nsh.json` con `"rust": "."` e `"root": "App"`, il test del root `App.test.tsx` con `tsconfig.json` e `.nsh/types`, `.gitignore` e un README, che spiega anche come aggiungere in seguito un ingresso TSX. `nsh run` e `nsh package` montano il root senza QuickJS su ogni target (`nsh test` lo apre per i test TypeScript), browser incluso ([Sviluppare con Rust](./rust.md)); `cargo run` lo avvia direttamente su macOS, Windows o Linux. |
| `ts` | Un'app TSX: `App.tsx`, il suo test `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` e `.nsh/types`. I file esistenti vengono mantenuti; fallisce solo se esistono già tutti. |
| `mixed` | Un'app TSX con un crate Rust proprio nella root: `App.tsx`, il suo test `App.test.tsx`, `tsconfig.json`, `nsh.json` con `"rust": "."`, `.gitignore`, `.nsh/types`, un README e il crate accanto a `App.tsx` (`Cargo.toml`, `src/lib.rs`), il cui `#[native_module("<name>/native")]` esporta un componente, un modulo e una classe usati da `App.tsx`. Senza `"root"`, l'ingresso è `App.tsx`. |

| Flag | Descrizione |
|---|---|
| `--name <NAME>` | Nome visualizzato scritto in `nsh.json`. Predefinito: il nome della directory. L'id diventa `com.example.<name>` (solo lettere e cifre, minuscolo) e lo specificatore di import dei crate `<name>/native` (minuscolo, parole unite da `-`). |
| `--template <TEMPLATE>` | `rust`, `ts` o `mixed` (vedi sopra). `rust` e `mixed` richiedono Rust; `cargo run` richiede anche le librerie di sviluppo del backend desktop nativo. |
| `--nsh-source <DIR>` | Con `rust` o `mixed`: i crate dipendono, tramite percorso, dai crate NSH del checkout in `DIR`, per compilare l'app con i sorgenti di NSH. |

I crate di `rust` e `mixed` dipendono dai crate di NSH su crates.io alla versione della CLI (con `--nsh-source`, da quelli di un checkout), e i comandi `nsh` compilano i runner e gli host dell'app a partire dagli stessi crate. Prima di ogni comando su un'app di questo tipo, `nsh` compila un piccolo programma con i crate dell'app e il core di NSH che ne descrive componenti, moduli e classi, e lo esegue quando i crate cambiano; con questa descrizione la CLI stessa esegue il bundle, compila, controlla i tipi, serve e impacchetta l'app. Le build di un'app Rust compilano solo i suoi crate e il core di NSH. Creali in una nuova directory dell'app: l'esistenza di uno qualsiasi dei loro file viene segnalata come conflitto prima che venga scritto qualcosa.

Le app i cui crate Rust dipendono da NSH tramite Git usano il checkout che Cargo risolve nel lockfile dell'app. Gli host generati condividono quel checkout, comprese le dipendenze di NSH reindirizzate dalle patch Cargo dell'app.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

Per un ingresso TSX, `nsh run` avvia il dev server (come `nsh dev`), lancia un host di sviluppo che carica l'app da esso e ricompila a ogni salvataggio. L'Hot Module Replacement aggiorna l'app in esecuzione sul posto; i log e gli errori dell'app vengono stampati nel terminale. Si ferma con Ctrl-C (o chiudendo la finestra di Catalyst, macOS, Linux, Windows o GPUI). In qualunque modo termini (Ctrl-C, `kill` / `pkill`, un errore), arresta l'host che ha avviato: l'app Catalyst, l'host macOS, Linux, Windows o GPUI, l'host di sviluppo nel simulatore o sul dispositivo Android.

Un'app Rust (`nsh.json` `"root"`, [Sviluppare con Rust](./rust.md)) viene eseguita senza dev server e senza QuickJS: `nsh run` compila il runner dell'app per il target con il suo root montato e lo avvia (sui desktop una build di debug, con i log nel terminale; nel simulatore e su Android, l'app installata); a ogni modifica del codice Rust del crate la ricompila e la riavvia. Con `--target web` stampa l'indirizzo della pagina, e la pagina aperta carica da sola il nuovo runtime. Indica l'ingresso TSX (`nsh run App.tsx`) per eseguire quello.

| Flag | Predefinito | Descrizione |
|---|---|---|
| `--target <TARGET>` | `macos` su macOS, `linux` su Linux, `windows` su Windows | `catalyst`: l'host Mac Catalyst, una finestra di dimensioni iPhone (390×844). `ios`: l'host in un simulatore iOS. `android`: l'host su un dispositivo o emulatore Android. `macos`: l'host AppKit, una finestra 1200×800 ([macOS](./macos.md)). `linux`: l'host GTK, una finestra 390×844 ([Linux](./linux.md)). `windows`: l'host Win32, una finestra 1200×800 ([Windows](./windows.md)). `gpui`: l'host GPUI, una finestra 1200×800, su macOS, Windows o Linux, che mostra un'app TSX come la mostrano le app GPUI che la incorporano ([GPUI](./gpui.md)). `web`: la pagina del dev server, all'indirizzo che stampa ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | Simulatore iOS da usare, per nome (`"iPhone 16 Pro"`) o UDID. Predefinito: uno già avviato, altrimenti l'iPhone più recente, che viene avviato. |
| `--port <PORT>` | `8790` | Porta del dev server. Sostituisce la precedente sessione di sviluppo NSH su questa porta dopo il completamento della sua pulizia. |
| `--release` | | Minifica e rimuove le informazioni di debug. I bundle di release non hanno Hot Module Replacement: ogni salvataggio ricarica l'app. |
| `--limits [<LIMITS>]` | | Esegue l'app come app incorporata in un'altra, entro i limiti impostati dalla sua app host: `memory` e `stack` (in `KB`, `MB` o `GB`), `load` e `call` (in `ms` o `s`) e `nodes`, come `--limits memory=128MB,call=500ms`. Quelli omessi mantengono i valori predefiniti dell'incorporamento, con cui `--limits` da solo viene eseguito ([Sandbox e capability](./sandbox-and-capabilities.md#limits)). Senza di esso l'app viene eseguita per conto proprio, come un'app impacchettata. Ingressi TSX. |
| `--trace` | | L'host registra nel terminale i tempi di ogni commit (JS, layout, mount item). |
| `--fps` | | Il performance monitor: frame rate, costo di frame e commit, CPU, GPU e memoria, mostrato sopra l'app su macOS ([macOS](./macos.md#performance-monitor)) e registrato una volta al secondo su macOS, Linux, Windows e iOS. |
| `--name <NAME>` | nome di `nsh.json` | Nome visualizzato dell'applicazione nella barra dei menu e titolo iniziale della finestra (`--target macos`, ingressi TSX). |
| `--window-size <WIDTHxHEIGHT>` | Predefinito dell'host | Dimensione iniziale della finestra in punti, ad esempio `800x600` (`--target macos`, `linux`, `windows` e `gpui`, ingressi TSX). |
| `--display <N>` | Il display principale | Il display su cui si apre la finestra, centrata: `1` è il display primario (quello con la barra dei menu), `2` il successivo, e così via; un numero senza display corrispondente la apre sul principale (`--target macos`, ingressi TSX). |

Con `--target android` viene usato il primo dispositivo elencato da `adb devices`; la porta del dev server gli viene inoltrata con `adb reverse`. Vedi [Per iniziare](./getting-started.md#run-it) e [Dev server e debug](./dev-server-and-debugging.md).

Una sostituzione attende fino a dieci secondi che la sessione precedente termini la pulizia. Una porta occupata da un altro programma, o da una CLI NSH più vecchia, produce un errore che indica la porta. Usa valori `--port` distinti per eseguire più app insieme; `--port 0` chiede al sistema operativo una porta libera.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Avvia il dev server e apre l'host nativo di questo sistema: AppKit su macOS, GTK su Linux, Win32 su Windows. Scegli esplicitamente `--target ios` o `--target android` per lo sviluppo mobile. `--server-only` serve gli host che avvii tu stesso. Il server compila l'app, osserva la directory dell'ingresso e invia ogni ricompilazione agli host connessi. Con `--server-only` stampa l'URL per gli host su questa macchina e uno per ogni indirizzo LAN per i dispositivi e, quando il runtime web è presente, la pagina che i browser aprono per eseguire l'app ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

Usa `nsh dev --server-only` con un'app che incorpora l'SDK di sviluppo (`NativeShellDev.xcframework`, `nsh-dev.aar`). `--target`, `--device`, `--port`, `--release` e `--limits` funzionano come per `nsh run`; `--server-only` seleziona un server senza un host avviato.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

Esegue i test dell'app in modalità headless ([Testing](./testing-and-trace.md)): i file di test (`*.test.tsx`, `*.test.ts`, che importano `nsh/test`) in `PATH`, una directory (predefinita: quella corrente; le directory nascoste, `node_modules` e `target` vengono ignorate), oppure il file di test `PATH`. Data la directory di un'app con crate Rust propri (`nsh.json` `"rust"`: un'app Rust o un'app TSX con un crate), esegue prima `cargo test` per ogni crate nella directory, nella directory del crate stesso, e mostra e conta ogni test Rust insieme ai test TypeScript, sotto il file del suo target di test (`src/lib.rs › tests::adds`); anche un'app Rust con soli test Rust viene testata così. Ogni file di test viene eseguito su un proprio engine e ogni app che i suoi test aprono su un altro engine, nuovo. Stampa una riga per test e, per un fallimento, ciò che è stato lanciato, dove nel file di test e i testi presenti a schermo; qualsiasi fallimento fa terminare il comando con un codice diverso da zero. Dato l'ingresso dell'app (`nsh test App.tsx`; per un'app Rust: `nsh test nsh.json`), apre l'app sulla rete, la lascia girare per 1,2 s ed esegue i passaggi forniti dallo standard input (`await app.press("Add")`, con `app` l'app). Un'app TSX viene eseguita nel processo stesso della CLI; un'app con crate Rust propri viene eseguita in un runner headless compilato con essi, per il quale la CLI compila gli ingressi. Le esecuzioni headless si comportano come iOS, a meno che un test apra l'app come Android (`open`, `platform`): `platform.os` è `"ios"`, e valgono le classi `ios:` e le prop `ios={{…}}`.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Flag | Descrizione |
|---|---|
| `--filter <NAME>` | Esegue solo i test il cui nome (dopo i nomi dei blocchi `describe` che lo contengono) contiene `NAME`; per i crate, `cargo test <NAME>`. |
| `--trace` | Stampa ogni batch di mount delle app aperte dai test, sotto il passaggio in cui è arrivato (`── press(Add): 7 items`), e il tempo di ogni commit: quanto costano il primo frame, un passaggio o un frame di scorrimento. Con `--target`, i batch e i tempi dell'host. |
| `--fps` | Con `--target linux`, `macos`, `windows` o `ios`: l'host registra le letture del suo performance monitor una volta al secondo (frame rate, fasi del frame, commit, CPU, memoria), mostrate con `-v`. |
| `--junit <FILE>` | Scrive anche i risultati in `FILE` come report XML JUnit, il formato da cui i servizi di CI mostrano i risultati dei test: un `testsuite` per file di test, un `testcase` per test. |
| `--target <TARGET>` | Esegue le app aperte dai test sull'host di sviluppo di questa piattaforma invece che in headless (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` e `android`; `web` le esegue in un Chrome, Edge o Chromium headless): i passaggi agiscono con l'input nativo della piattaforma ([Testing](./testing-and-trace.md#on-a-real-platform)), e `open` verifica le sue opzioni rispetto alla piattaforma, rifiutando quelle che non può rispettare (`ERR_NSH_TEST_UNSUPPORTED`: `width` e `height` su iOS e Android, un `platform` di un altro tipo di dispositivo). I test Rust dei crate vengono eseguiti su questa macchina, nelle esecuzioni senza `--target`. |
| `--browser <PATH>` | L'eseguibile Chrome, Edge o Chromium in cui `--target web` esegue le app (predefinito: quello installato su questa macchina). |
| `--display <N>` | Con `--target macos`: il display su cui si aprono le finestre delle app, centrate: `1` è il display primario (quello con la barra dei menu), `2` il successivo, e così via; un numero senza display corrispondente le apre sul principale. Per impostazione predefinita si aprono su un display secondario (il primo oltre quello primario, non uno specchio di esso), così l'esecuzione dei test resta su uno schermo a sé, e sul primario quando è l'unico. I test si comportano allo stesso modo su ogni display. |
| `--web-host <JS>` | Il modulo host della pagina web che ricevono le app aperte in headless (predefinito: `nsh.json` `web.host`; esporta `createHost(player)`): risponde alle loro chiamate [`host`](../modules/nsh.md#host) e il suo `player.hostEvent` raggiunge `host.on` ([Testing](./testing-and-trace.md#the-pages-host)). Solo per le esecuzioni headless; `--target web` esegue `nsh.json` di `web.host`. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

Esegue il type check dell'app. In un'app con crate Rust propri (`nsh.json` `"rust"`) ogni crate viene controllato per primo con `cargo check --all-targets` nella directory del crate, test inclusi; gli errori di Cargo fanno terminare il comando con un codice diverso da zero. Un'app Rust (`"root"`) viene poi controllata per quanto contiene TypeScript: con un `tsconfig.json` (quello che `nsh init --template rust` scrive per `App.test.tsx`) vengono sottoposti a type check anche i suoi file di test. Il controllo TypeScript aggiorna `.nsh/types` e `.nsh/tsconfig.json`, poi esegue `tsc -p <app directory> --noEmit` con il `tsconfig.json` dell'app. Usa TypeScript 7, il compilatore nativo, che non richiede Node: la prima esecuzione lo scarica dal registry npm (circa 9 MB), lo verifica con il checksum registrato da NSH e lo conserva nella cache di NSH (`~/Library/Caches/nsh` su macOS, `~/.cache/nsh` su Linux, `%LOCALAPPDATA%\nsh` su Windows, oppure `NSH_CACHE`). Gli errori di tipo fanno terminare il comando con un codice diverso da zero. Segnala un avviso quando `tsconfig.json` non estende `./.nsh/tsconfig.json`, dove NSH conserva le proprie impostazioni TypeScript ([Struttura del progetto](./project-structure.md#tsconfigjson-and-nshtypes)).

| Flag | Descrizione |
|---|---|
| `--tsc <TSC>` | Esegue questo `tsc` al posto di quello predefinito (anche `NSH_TSC`), per esempio uno da `node_modules` o una copia per macchine senza rete. |
| `-- <TSC ARGS>` | Passato a `tsc`, ad es. `nsh check -- --pretty false`. |

I file generati da NSH restano sotto `.nsh/`: dichiarazioni, sorgenti dei runner e output predefiniti di build/package in
`.nsh/out/`. Cargo mantiene la sua normale cache `target/` e il comportamento esistente di `CARGO_TARGET_DIR`; NSH non
aggiunge configurazione di Cargo per spostarla. `--out` continua a sovrascrivere la posizione dell'output.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

Compila l'app. Per un'app Rust (`nsh.json` `"root"`) compila e descrive i crate dell'app e scrive `app.json` e i file che questi distribuiscono (`assets/`): i suoi runner montano la radice. Per un'app TSX crea il bundle dell'app e lo compila in bytecode QuickJS, per le app che incorporano NSH e distribuiscono il bundle autonomamente.

| Flag | Predefinito | Descrizione |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | Directory di output. |
| `--release` | | Minifica e rimuove le informazioni di debug. |
| `--split` | | Mette ciò che `import()` carica in file chunk separati, scaricati al primo import (app web, vedi [Bundle suddivisi](./web.md#split-bundles)). Senza questo flag, il bundle contiene l'intera app. |

Scrive:

| File | Contenuto |
|---|---|
| `bundle.js` | Il bundle come JavaScript |
| `bundle.js.map` | La sua source map (gli stack trace vengono riportati ai tuoi sorgenti) |
| `bundle.nshc` | Il bundle come bytecode compilato: ciò che le app caricano |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | Con `--split`: ogni chunk, la sua source map e il suo bytecode (`Screen.js` per `import("./Screen")`) |
| `capabilities.json` | Il `capabilities` di `nsh.json`, se dichiarato (altrimenti rimosso) |
| `assets/` | Ogni immagine e font importati, nel loro percorso relativo alla radice dell'app |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

Compila un'app installabile in modalità release. Un'app Rust (`nsh.json` `"root"`) viene impacchettata con il proprio runner, compilato con Cargo a partire dai tuoi crate e da quelli di NSH, con la radice montata e senza QuickJS ([Compilare con Rust](./rust.md)); un'app TSX con il runtime precompilato. Non è coinvolto alcun progetto Xcode né build Gradle: NSH assembla da sé il bundle dell'app e usa `actool` e `codesign` di Xcode (iOS) oppure `aapt2`, `zipalign` e `apksigner` dell'SDK (Android); per macOS assembla un `.app` con firma ad hoc tramite `codesign` (e `sips` per l'icona); per Linux copia il runner e scrive un `.tar.gz` con `tar`; per Windows copia il runner, incorpora l'icona e scrive un `.zip`, senza strumenti; per il web scrive un sito statico, senza strumenti. I metadati provengono da `nsh.json`, sovrascritti dai flag.

| Flag | Descrizione |
|---|---|
| `--target <TARGET>` | Obbligatorio. `ios`: dispositivi iOS, un `.ipa` firmato (o un `.app` non firmato senza `--sign`). `ios-simulator`: un `.app` con firma ad hoc. `android`: un `.apk` firmato. `macos`: un `.app` con firma ad hoc ([macOS](./macos.md#packaging)). `linux`: una directory `<Name>/` (l'eseguibile, `nsh/`, un file `.desktop`) e `<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows`: una directory `<Name>\` (`<Name>.exe`, `nsh\`) e `<Name>.zip` ([Windows](./windows.md#packaging)). `web`: una directory `<Name>/`, un sito statico (`index.html` e file con nomi derivati dal loro contenuto) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | Directory di output (predefinita `.nsh/out`). |
| `--name <NAME>` | Nome visualizzato. |
| `--id <ID>` | Identificatore del bundle, ad es. `com.example.app`. |
| `--app-version <VERSION>` | Versione, ad es. `1.2.0`. |
| `--build <BUILD>` | Numero di build. |
| `--icon <ICON>` | Icona dell'app: un PNG quadrato, idealmente 1024×1024. |
| `--sign <IDENTITY>` | Dispositivi iOS: identità di firma del codice, ad es. `"Apple Development: …"`. |
| `--profile <FILE>` | Dispositivi iOS: provisioning profile (`.mobileprovision`). Gli entitlement provengono da esso. |
| `--keystore <FILE>` | Android: keystore di release. Predefinito: la chiave di debug in `~/.android/debug.keystore` (creata se mancante). |
| `--key-alias <ALIAS>` | Android: alias della chiave nel keystore. |
| `--keystore-password <PASSWORD>` | Android: password del keystore. Letta anche da `NSH_KEYSTORE_PASSWORD`. |
| `--abi <ABI>` | Android: le ABI dell'APK (`arm64-v8a`, `armeabi-v7a`, `x86_64`), ripetute o separate da virgole. Predefinito: `arm64-v8a` e `armeabi-v7a`, più quella del dispositivo con `--run`. |
| `--run` | Installa e avvia l'app al termine: nel simulatore (`ios-simulator`) o sul dispositivo Android connesso; `macos`, `linux` e `windows` la avviano; `web` serve il sito su questa macchina all'indirizzo che stampa. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Vedi [Packaging](./packaging.md).

<a id="signing-commands"></a>

## Comandi di firma

Questi comandi creano e verificano pacchetti firmati (`.nshpkg`): bundle di app che le app che incorporano NSH scaricano e verificano prima di eseguirli. [Pacchetti firmati](./signed-packages.md) spiega il modello (una chiave root offline certifica chiavi di release per alcuni id di app).

### nsh keygen

```sh
nsh keygen <NAME>
```

Crea una coppia di chiavi Ed25519: `<NAME>.secret` e `<NAME>.pub` (ad es. `nsh keygen keys/root`). Conserva il `.secret` di una root offline; le app si fidano del suo `.pub`.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

Certifica una chiave di release con una chiave root per alcuni id di app e un intervallo di tempo; i pacchetti portano con sé il certificato.

| Flag | Descrizione |
|---|---|
| `--root <ROOT>` | La chiave segreta della root. |
| `--key <KEY>` | La chiave pubblica della chiave di release. |
| `--apps <APPS>` | Gli id di app per cui può firmare: `*`, `com.example.*` oppure un id. Ripetibile. |
| `--days <DAYS>` | Per quanto tempo può firmare, a partire da adesso (predefinito 365). |
| `-o, --out <OUT>` | Il certificato da scrivere. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

Compila l'app in modalità release e la firma in un pacchetto. I metadati provengono da `nsh.json`, sovrascritti dai flag.

Dato un pacchetto (`ENTRY` è un file `.nshpkg`), lo firma di nuovo con questa chiave, come fa una piattaforma che firma
i pacchetti delle proprie app con una chiave propria. I file e l'intestazione del pacchetto restano invariati; il suo certificato,
l'ora di firma e la firma diventano quelli della nuova chiave ([Pacchetti firmati](./signed-packages.md#sign-a-package-again)). `-o`
può indicare il pacchetto da leggere, e si applicano solo `--key`, `--cert` e `-o`.

| Flag | Descrizione |
|---|---|
| `--key <KEY>` | La chiave segreta della chiave di release. |
| `--cert <CERT>` | Il suo certificato (`nsh certify`). |
| `-o, --out <OUT>` | Il pacchetto da scrivere. Predefinito: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | Id dell'app. |
| `--app-version <VERSION>` | Versione. |
| `--build <BUILD>` | Numero di build: deve crescere a ogni release. |
| `--source-map <WHERE>` | Dove va la source map: `package` (predefinito), `file` (`<package>.map` accanto al pacchetto) oppure `none` ([Pacchetti firmati](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | Omette dal bytecode le tabelle di righe e colonne: più piccolo, ma gli stack degli errori non hanno posizioni. |
| `--min-runtime <VERSION>` | Il runtime più vecchio che esegue il pacchetto, ad es. `0.2.0`; i runtime precedenti lo rifiutano. Predefinito: la versione di questa CLI ([Pacchetti firmati](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

Verifica un pacchetto come farebbe un'app che si fida delle root indicate. Senza `--root`, viene controllata solo la firma del pacchetto stesso. Stampa lo SHA-256 del pacchetto, che `nsh revoke --package` accetta.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

Riscrive le posizioni del bundle (`bundle.js:LINE:COL`) di un errore segnalato da un pacchetto in posizioni dei tuoi sorgenti e stampa il
risultato. `MAP` è una source map (`<package>.map` da `nsh publish --source-map file`, `bundle.js.map`) o un pacchetto che
ne contiene una; `INPUT` è il testo dell'errore (predefinito: standard input).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

Firma una lista di revoca: chiavi di release e pacchetti che non devono più essere caricati.

| Flag | Descrizione |
|---|---|
| `--root <ROOT>` | La chiave segreta della root. |
| `--extend <EXTEND>` | Mantiene le voci di questa lista (l'ultima pubblicata). |
| `--sequence <N>` | Il numero della lista, superiore a quello di ogni lista pubblicata prima. Predefinito con `--extend`: quello di quella lista più uno. |
| `--key <ID>` | L'id di una chiave di release da revocare. Ripetibile. |
| `--package <SHA256>` | Lo SHA-256 di un pacchetto da revocare. Ripetibile. |
| `-o, --out <OUT>` | La lista da scrivere. |

<a id="environment-variables"></a>

## Variabili d'ambiente

| Variabile | Usata da | Descrizione |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Target Android | L'SDK Android. Ripiego: `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | app con crate Rust | Dove vengono compilati i runner dell'app. Predefinito: `target/` dell'app. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | La password del keystore. |
| `NSH_RUNTIME` | `run`, `package` | Una directory di runtime da usare al posto di quella accanto alla CLI. |
| `NSH_VERBOSE` | ogni comando | `1`: come `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | La CLI `wasm-bindgen` per un'app i cui crate [chiamano API del browser](./web.md#browser-apis-from-rust). Predefinito: quella in `PATH`. |
| `NO_COLOR` | ogni comando | Se impostata: nessun colore sui terminali. |
