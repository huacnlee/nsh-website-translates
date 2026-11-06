---
title: "Server di sviluppo e debug"
description: "Esegui app Rust e TSX con nsh run e nsh dev, collega simulatori, emulatori e dispositivi, e usa ricompilazioni, hot module replacement, log, l'overlay degli errori e stack trace con source map."
order: 60
group: tools
source_hash: bce9f1fee0870b27
---

# Dev server e debug

Durante lo sviluppo, NSH compila la tua app a ogni salvataggio. Un'app Rust (`nsh.json` ne indica il `"root"`) viene compilata nel proprio runner, che `nsh run` avvia; una modifica al suo crate la compila di nuovo e riavvia l'app. Un'app TSX viene inviata a ogni host connesso, che si aggiorna sul posto. Due comandi si occupano di questo:

- `nsh run` compila l'app **e** la avvia: una finestra Mac Catalyst o AppKit, una finestra GTK su Linux, una finestra Win32
  su Windows, un simulatore iOS, un dispositivo o emulatore Android, oppure una pagina del browser. Per TSX avvia anche il dev
  server, a cui si connette l'host di sviluppo.
- `nsh dev --server-only` avvia il dev server per TSX, per gli host che avvii tu stesso: la tua app con
  l'SDK di sviluppo, un dispositivo in rete o più host contemporaneamente.

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

`nsh dev` apre per impostazione predefinita anche l'host nativo; gli host mobile usano `--target ios` o `--target android`.

## `nsh run`

| Flag | Descrizione |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | Dove eseguire. Predefinito: `macos` su macOS (AppKit), `linux` su Linux, `windows` su Windows. Un'app Rust funziona su tutti, tranne `gpui`, che incorpora la propria radice in un'app GPUI ([GPUI](./gpui.md)). |
| `--device <name or UDID>` | Il simulatore iOS da usare. Predefinito: uno già avviato, altrimenti l'iPhone più recente (avviato per te). |
| `--port <port>` | Porta del dev server. Predefinita 8790; se è occupata viene usata la prima porta libera successiva. |
| `--release` | Serve build di release di TSX (minificate, senza informazioni di debug, senza aggiornamenti a caldo). |
| `--trace` | Registra il tempo di ogni commit sull'host (app TSX). |

Cosa fa ciascun target:

- **`catalyst`** (macOS) esegue l'host di sviluppo come app Mac. Interrompere `nsh run` (Ctrl-C, o `kill`) lo chiude, e
  chiudere la finestra termina `nsh run`.
- **`macos`** (macOS) esegue allo stesso modo l'host di sviluppo AppKit, un'app desktop in una finestra 1200×800; Cmd+R
  ricarica l'ultima build. Richiede macOS 14 o successivo ([macOS](./macos.md)).
- **`linux`** (Linux) esegue allo stesso modo l'host di sviluppo GTK in una finestra 390×844: interrompere `nsh run` lo
  chiude, chiudere la finestra termina `nsh run`. Richiede GTK 4.14 o successivo ([Linux](./linux.md)).
- **`windows`** (Windows) esegue allo stesso modo l'host di sviluppo Win32 in una finestra 1200×800; l'host non sopravvive mai a
  `nsh run`, nemmeno se la console viene chiusa. Richiede Windows 10 1809 o successivo ([Windows](./windows.md)).
- **`ios`** installa l'host di sviluppo nel simulatore, lo avvia puntandolo al dev server e resta in osservazione.
  Il simulatore condivide la rete del Mac, quindi l'host raggiunge il server su `127.0.0.1`. Interrompere `nsh run` (Ctrl-C)
  chiude l'host, che altrimenti si unirebbe alla sessione successiva. Richiede Xcode.
- **`android`** installa l'APK dell'host di sviluppo (di nuovo solo se il runtime è cambiato), esegue
  `adb reverse tcp:<port> tcp:<port>` in modo che il `127.0.0.1` del dispositivo raggiunga il server, e lo avvia. Funziona con un
  emulatore o con un dispositivo USB. Richiede l'Android SDK (`ANDROID_HOME`). Quando `nsh run` termina (anche con Ctrl-C), arresta
  l'host e rimuove l'inoltro di quella porta, così l'host non si unisce alla sessione successiva.

Quando `nsh run` termina, in qualsiasi modo, arresta l'host che ha avviato: chiude l'app Catalyst o l'host macOS, Linux o Windows, termina l'host di
sviluppo nel simulatore, oppure lo arresta forzatamente sul dispositivo.

Per un'app Rust ogni target esegue il runner dell'app stessa, compilato con il suo crate: i desktop una build di debug sul posto, con
l'output nel terminale; iOS e Android un pacchetto di esso, installato. Per TSX gli host sono generici: eseguono qualsiasi app
NSH inviata dal server, quindi non c'è nulla da compilare per ogni app (un'app con un proprio crate ottiene host compilati
con esso).

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| Flag | Descrizione |
|---|---|
| `--port <port>` | Porta del dev server. Predefinita 8790 (la prima libera successiva se occupata). |
| `--release` | Serve build di release. |

Connetti gli host all'URL stampato:

- **La tua app iOS**, collegata con `NativeShellDev.xcframework`:
  `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`. Vedi [Integrazione nelle app iOS](./ios.md#development).
- **La tua app Android**, con `nsh-dev.aar`: `nsh.connectDevServer("ws://192.168.1.20:8790/ws")`, oppure
  `adb reverse tcp:8790 tcp:8790` e `ws://127.0.0.1:8790/ws`. Vedi [Integrazione nelle app Android](./android.md#development).

Si può connettere un numero qualsiasi di host contemporaneamente; ogni build va a tutti. Un host che si connette in seguito riceve
subito la build corrente. Un host che non può eseguire l'app, perché gli manca un set di UI che l'app importa (un host di
sviluppo compilato per un'altra app), non riceve alcuna build: mostra il motivo, e il terminale stampa una riga `warn` con il comando che
installa l'host dell'app.

> [!NOTE]
> Un dispositivo sulla LAN deve poter raggiungere il tuo computer sulla porta del dev server: stessa rete, nessun firewall in mezzo.
> Gli asset (immagini, font) sono serviti in HTTP semplice dalla stessa porta.

<a id="rust-edits"></a>

## Modifiche in Rust

Rust è compilato: una modifica al crate di un'app, o a un crate da cui dipende tramite percorso, ricompila l'app, e `nsh run`
la riavvia con il nuovo codice. Lo stato dell'app riparte da zero; conserva ciò che deve sopravvivere a un riavvio nello
[storage](../modules/nsh.md#storage). Un errore di build viene stampato nel terminale, e il salvataggio successivo che compila esegue
di nuovo l'app. In un'app con Rust e TSX, le modifiche TSX restano aggiornamenti a caldo (vedi sotto) e le modifiche Rust riavviano l'app.

## Hot module replacement

Le build di sviluppo TSX mantengono un modulo per ogni file sorgente. Quando salvi, NSH ricompila, confronta i moduli con l'ultima
build valida e invia una **patch** con i soli moduli cambiati. L'host la applica sul posto in ben meno di un
millisecondo; dal salvataggio di un file alla comparsa della modifica passano circa 120 ms.

Cosa succede alla tua app:

- **Vengono renderizzati di nuovo solo i componenti che hai modificato.** Ogni componente di primo livello (una funzione con l'iniziale maiuscola che restituisce JSX)
  è avvolto in un proxy stabile. Quando il suo codice cambia (o cambia il resto del codice del suo modulo, che può usare), le sue
  istanze vengono renderizzate di nuovo con il nuovo codice; i componenti il cui codice non è cambiato mantengono le loro istanze, e con esse
  i loro signal e il loro stato. Modifica lo stile di un pulsante e la
  schermata resta dov'era, con lo stesso testo inserito e la stessa posizione di scorrimento.
- **I moduli modificati vengono eseguiti di nuovo**, così come i moduli che importano un modulo modificato che non può assorbire l'aggiornamento
  da solo, fino all'entry. Il codice a livello di modulo viene quindi eseguito di nuovo, tranne ciò che conserva il proprio stato:
- **I signal di primo livello e gli stack di navigazione conservano il loro stato**: un `const` creato da `signal(…)` o `createNavStack(…)` in
  cima a un modulo mantiene il proprio valore (uno stack le sue pagine) tra le modifiche, finché il suo inizializzatore resta lo stesso;
  cambia l'inizializzatore (da `signal(0)` a `signal(10)`) per ripartire da zero.
- **Gli oggetti `context()` di primo livello mantengono la loro identità**, assumendo il nuovo valore predefinito, così provider e consumer in
  moduli diversi continuano a corrispondere.
- **Modificare l'entry mantiene l'app montata.** `mount(App)` (o `mount(() => <App />)`) eseguito di nuovo con lo stesso
  componente conserva ciò che ha montato: vengono renderizzati di nuovo solo i componenti che hai modificato. Se modifichi `App` stesso, viene renderizzato
  di nuovo, insieme a ciò che renderizza (il loro stato riparte da zero), ma un navigator creato in cima al modulo mantiene le sue
  route, quindi una schermata già inserita nello stack resta inserita. Una chiamata a `mount` che è cambiata (un altro componente, altre props) monta di nuovo
  l'app.
- **Un componente che genera un'eccezione** segnala l'errore e non renderizza nulla finché non lo correggi; il resto dell'app continua
  a funzionare. Il successivo salvataggio corretto ripristina la situazione.

L'host **ricarica l'intera app** invece di applicare la patch quando:

- la modifica importa un modulo NSH che l'app in esecuzione non aveva ancora importato (per esempio il primo `import … from "nsh"`);
- è cambiato `capabilities` dell'app in `nsh.json`;
- l'host non sta eseguendo la build su cui si basa la patch (si è appena connesso, o un caricamento precedente è fallito);
- una patch non può essere applicata.

> [!TIP]
> Lo stato che un componente conserva nei propri signal viene reimpostato quando quel componente, o uno che lo renderizza, viene modificato. Conserva
> lo stato che deve sopravvivere alle modifiche in signal di primo livello (o in un modulo store), e crea i navigator in cima a un modulo.

`--release` serve build di release, senza aggiornamenti a caldo: ogni salvataggio ricarica l'app. Usalo per verificare la build minificata.
Tutto ciò che viene caricato da un dev server, `--release` o meno, salta l'hardening del runtime (`eval` resta disponibile); vedi
[Sandbox e capability](./sandbox-and-capabilities.md#hardening).

<a id="logs"></a>

## Log

Un'app Rust registra i log con il crate `log` (`log::info!`, `log::warn!`, `log::error!`): `nsh run` mostra le righe nel proprio
terminale, insieme all'output dell'app, sui desktop e nel simulatore iOS.

In TSX, `console.log`, `console.info`, `console.debug`, `console.warn` e `console.error` vanno al log nativo con
target `js`. Mentre un host è connesso, le sue righe di log vengono inoltrate al terminale che esegue `nsh run` / `nsh dev`: le tue
righe `console.log` così come sono (precedute dal nome del dispositivo quando ne sono connessi più di uno), gli avvisi e gli
errori dopo il nome del dispositivo:

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` formatta i valori come una console del browser: le stringhe così come sono, gli errori con il loro stack, le funzioni per nome,
gli oggetti e gli array come JSON. Quando l'host non è connesso, i log vanno al log della piattaforma (la console di Xcode / il
unified log su iOS, `adb logcat` su Android).

Una promise rifiutata e ancora priva di handler quando il lavoro che l'ha rifiutata è terminato (i suoi microtask sono stati eseguiti) viene
registrata anch'essa come errore, come la segnala un browser: una funzione `async` che genera un'eccezione mentre nessuno la attende con await, una
`Promise.reject(…)` che nessuno intercetta, una chiamata a Rust che fallisce senza che nessuno la attenda. La riga va dovunque vada
`console.error` (il terminale, il log della piattaforma, la console del browser sul web), con lo stack che punta ai
tuoi sorgenti:

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

Un handler collegato più tardi nello stesso turno (`const p = load(); …; p.catch(…)`) conta come gestione. Usa await sulla
promise o assegnale un `.catch` dove il fallimento è rilevante.

Il resto del terminale è una riga per passaggio (`✓` completato, `→` dove connettersi, `•` cosa ha fatto un dispositivo); l'output degli
strumenti che NSH esegue (cargo, gli host stessi) viene stampato solo quando uno fallisce. `nsh run -v` (o `NSH_VERBOSE=1`)
stampa tutto: ogni riga di log con il suo livello e la sua origine, l'output di cargo e quello degli host.

`--trace` aggiunge il costo di ogni commit:

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Vedi [Testing](./testing-and-trace.md) per il significato di questi numeri.

<a id="the-error-overlay"></a>

## L'overlay degli errori

Questi errori mostrano sull'host un overlay rosso sopra l'app, con il messaggio e lo stack:

- un errore di build (un errore di sintassi, un elemento sconosciuto, un import mancante), con un frammento di codice che indica la riga;
- un errore durante la valutazione del bundle;
- un'eccezione non gestita in un event handler, in un timer o in un effect.

Tocca l'overlay per chiuderlo. Scompare anche al successivo ricaricamento riuscito. Gli errori di build vengono stampati anche nel
terminale:

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

Il bundler rimuove i tipi TypeScript senza verificarli; esegui [`nsh check`](./cli.md#nsh-check) (il compilatore
nativo di TypeScript con le scritture `tsconfig.json` `nsh init`; non serve Node) oppure affidati al tuo editor per gli errori di tipo.

Nelle build di release (un'app che incorpora l'SDK di release, un'app pacchettizzata), gli errori vengono registrati e passati all'error handler
dell'app host (`NshAppView.onError`, `NshView.setErrorListener`) ma non mostrati sopra l'app.

<a id="source-maps-and-stack-traces"></a>

## Source map e stack trace

Il bundling produce una source map che compone ogni passaggio (TypeScript → JSX → il bundle), e viene inviata insieme a ogni
build. Prima che uno stack trace venga stampato o mostrato, il runtime riscrive le posizioni del bundle sui tuoi sorgenti, così gli stack
puntano a `App.tsx:2:28`, non al bundle:

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` scrive la map come `bundle.js.map`; un'app che incorpora e carica un bundle da una cartella la legge accanto
al bundle, e anche i [pacchetti firmati](./signed-packages.md) la contengono, a meno che non sia tenuta accanto al pacchetto e applicata
con `nsh symbolicate` ([Errori dei pacchetti pubblicati](./signed-packages.md#errors-from-published-packages)).

<a id="debugging-tips"></a>

## Suggerimenti per il debug

- **Nulla si aggiorna dopo una modifica**: controlla il terminale per un errore di build; l'overlay lo mostra anche sull'host.
- **L'app conserva uno stato che ti aspettavi venisse reimpostato**: l'hot replacement mantiene di proposito lo stato dei componenti non modificati, i
  signal di primo livello e i navigator. Riavvia con Ctrl-C e `nsh run`, oppure cambia l'inizializzatore dello stato.
- **Una richiesta fallisce solo in una build pacchettizzata o incorporata**: controlla le [capability](./sandbox-and-capabilities.md) dell'app;
  i rifiuti vengono registrati con la chiave da aggiungere.
- **Qualcosa è lento**: riproducilo in modalità headless con [`nsh test --trace`](./testing-and-trace.md), che stampa ogni
  operazione sulle view native, oppure esegui un'app TSX con `--trace`.
- **Errori di tipo nell'editor**: `nsh run` e `nsh dev` mantengono aggiornato `.nsh/types`; vedi
  [Struttura del progetto](./project-structure.md).

<a id="see-also"></a>

## Vedi anche

- [CLI](./cli.md)
- [Testing](./testing-and-trace.md)
- [Integrazione nelle app iOS](./ios.md), [Integrazione nelle app Android](./android.md)
