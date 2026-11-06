---
title: "Architettura"
description: "Come viene eseguita un'app NSH: la pipeline di build, i thread del motore e principale, il percorso da una modifica di un signal alle view native, il grafo reattivo nativo, il layout del testo e i crate."
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---

# Architettura

Questa pagina è pensata per gli sviluppatori di app che vogliono sapere cosa succede tra `count.set(1)` e il cambiamento di un'etichetta sullo schermo,
in un'app scritta in Rust o in TSX.
Non serve per scrivere app, ma spiega perché NSH si comporta come si comporta: perché i componenti vengono eseguiti una sola volta, perché
le animazioni restano fluide mentre JS è occupato, perché il main thread non aspetta mai il tuo codice.

<a id="the-big-picture"></a>

## Il quadro generale

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## Build: solo il tuo codice diventa JS

`nsh build`, `nsh dev` e gli altri comandi creano il bundle della tua app con una toolchain scritta in Rust (senza Node.js):

1. **Oxc** rimuove i tipi TypeScript.
2. **Il compilatore JSX di NSH** trasforma il JSX in chiamate dirette al renderer nativo, nello stesso passaggio. Le prop e i
   children statici vengono impostati una sola volta; le espressioni che possono cambiare (chiamano una funzione o leggono una proprietà) diventano binding che il
   renderer segue. I componenti diventano semplici chiamate di funzione con un oggetto props le cui prop variabili sono getter.
3. **rolldown** raggruppa i tuoi moduli in un unico modulo ES. Gli import dei moduli di NSH (`nsh`, `nsh/mobile`,
   `nsh/base`, ...) restano import: quei moduli sono nativi, forniti dal runtime. **Il bundle contiene solo il codice
   della tua app**; l'esempio del contatore pesa meno di 1 KB di JS.
4. Il bundle viene compilato in **bytecode** (`bundle.nshc`), che si carica più velocemente del sorgente, e una **source map**
   viene composta attraverso tutti i passaggi, così gli stack trace puntano alle righe del tuo `.tsx`.

Le immagini e i font che importi vengono raccolti come asset, e le dichiarazioni dei tipi per il tuo editor vengono scritte in
`.nsh/types`.

Un'app scritta in Rust non ha un bundle: Cargo compila il runner di ogni target con il tuo crate collegato, e il componente
radice indicato da `nsh.json` viene eseguito nativamente dall'engine. Tutto ciò che segue vale anche per questo caso, con il codice dei tuoi componenti
eseguito in Rust dove in un'app TSX verrebbe eseguito in QuickJS.

<a id="running-two-threads-per-app"></a>

## Esecuzione: due thread per app

Ogni app in esecuzione (un `NshAppView` su iOS, un `NshView` su Android, la finestra di un'app pacchettizzata) è un **engine** con
il proprio **engine thread** e, per TSX, la propria VM QuickJS. Non ci sono singleton globali, quindi più app possono funzionare fianco a fianco
in una stessa app host.

<a id="the-engine-thread"></a>

### L'engine thread

Qui avviene tutto ciò che riguarda la logica della tua app:

- **Il tuo codice** viene eseguito qui: componenti, gestori di eventi, timer, effect. I componenti Rust vengono eseguiti nativamente; TSX viene eseguito in
  **QuickJS**.
- **Il grafo reattivo** (signal, valori computed, effect, owner, context) è nativo. I suoi nodi sono oggetti QuickJS
  di classi native, quindi il garbage collector vede i riferimenti attraverso di essi, ma il tracciamento delle dipendenze e
  la pianificazione degli aggiornamenti sono in Rust (segue l'algoritmo di Solid 1.9).
- **Il renderer** che il tuo JSX compilato chiama è nativo. Crea i nodi e trasforma ogni cambiamento in una **op** inserita
  direttamente in una coda nativa: niente JSON, nessun messaggio per ogni prop.
- **Il core** mantiene uno shadow tree di tutti i nodi. Quando un turno JS termina, prende tutte le op in coda in una volta e fa il **commit**:
  esegue il rendering dei componenti Rust (quelli di `nsh/base` e quelli propri dell'app), risolve gli inset `env()` in padding e margin, ricostruisce i testi modificati, calcola il layout con **Taffy** (flexbox e grid, con
  colonna come impostazione predefinita e senza shrinking), confronta frame e stili e produce un **MountBatch**: l'elenco delle operazioni di cui le view
  native hanno bisogno.

<a id="the-main-thread"></a>

### Il main thread

Il main thread (UI) della piattaforma applica ogni MountBatch in un solo passaggio: crea le view, le inserisce, imposta stili e frame,
consegna il testo già impaginato. Oltre a questo fa solo ciò che deve avvenire su di esso:

- **disegnare il testo** già impaginato sull'engine thread;
- **animazioni native**: i valori animati da `nsh` sono pilotati frame per frame (un `CADisplayLink` su iOS, un animator
  del thread UI su Android) e scritti direttamente nelle view;
- **gesture e scorrimento**: i tocchi diventano eventi inviati all'engine thread; `scrollValue` e `pan` alimentano i valori
  animati nello stesso frame.

**Il main thread non aspetta mai JS.** Quando il sistema ha bisogno di una risposta immediata (questo testo può cambiare, il pulsante
indietro può rimuovere questa schermata, questo sheet può chiudersi), la risposta è stata montata in anticipo come prop, e JS la
viene a sapere dopo tramite un evento. Un engine thread occupato può ritardare gli aggiornamenti, ma non può bloccare lo scorrimento, le animazioni o
le gesture del sistema.

<a id="from-a-tap-to-the-screen"></a>

## Da un tap allo schermo

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

Nell'esempio del contatore, un tap costa circa 0,12 ms in una build release su un Mac, tra JS e commit insieme, e produce una
manciata di mount item (vedi [Test](./testing-and-trace.md)).

In un'app Rust il gestore è una closure Rust (`count.set(count.get() + 1)`), e seguono lo stesso grafo, lo stesso commit e lo stesso batch,
senza alcun interprete di mezzo.

Da questo design derivano tre proprietà:

- **Un turno è un commit.** Per quanti signal imposti un gestore, le view cambiano una sola volta, tutte insieme.
- **I componenti vengono eseguiti una sola volta.** Vengono rieseguiti solo i binding; non c'è nessun re-render di un componente e nessun diff del DOM virtuale. L'
  unico diff rimasto è quello del core, su frame e stili, in Rust.
- **Viaggiano solo i cambiamenti.** Gli stili e i frame invariati non vengono inviati; le nuove view non ricevono valori predefiniti.

<a id="text-laid-out-once-off-the-main-thread"></a>

## Testo: impaginato una volta, fuori dal main thread

Il testo è spesso la parte più costosa di una UI. NSH lo impagina sull'engine thread con il motore di testo della piattaforma, quindi appare esattamente come il testo nativo:

1. **prepare**: un `<Text>` e i suoi span annidati diventano un'unica stringa attribuita (CoreText sulle piattaforme Apple,
   `PrecomputedText` / `StaticLayout` su Android);
2. **measure** alle larghezze richieste dal layout; le misure sono in cache per contenuto e larghezza, quindi un cambiamento del solo colore
   non causa una nuova misurazione;
3. **layout** alla dimensione finale.

Il main thread riceve il risultato immutabile e si limita a disegnarlo. Un testo annidato in un `<Text>` è uno span, non una view;
le stringhe fuori da `<Text>` non vengono renderizzate.

<a id="lists"></a>

## Liste

`List` è virtualizzato in modo nativo. Il core decide quali righe sono vicine al viewport, calcola posizioni, colonne e
header sticky, e ricicla le celle. Quando una cella ha bisogno di un elemento diverso, il runtime lo associa (gli accessor `item()` e `index()`
della tua funzione di riga cambiano); i frame che non rivelano nessuna nuova riga non chiamano affatto JS. Vedi [Liste](./lists.md).

<a id="everything-else-the-runtime-does"></a>

## Tutto il resto che fa il runtime

- **Rete**: `fetch` e le altre API globali sono classi native. Le richieste passano allo stack HTTP della piattaforma
  (`NSURLSession`, `HttpURLConnection`), in streaming in entrambe le direzioni.
- **Le immagini** vengono scaricate e decodificate fuori dal main thread, alla dimensione della view, con una cache in memoria.
- **Limiti e capability** sono imposti dal runtime, in Rust: vedi [Sandbox e capability](./sandbox-and-capabilities.md).
- **Anche l'hot module replacement** è nativo: le patch vengono applicate dal runtime in ben meno di un millisecondo (vedi
  [Dev server e debug](./dev-server-and-debugging.md)).

<a id="three-layers"></a>

## Tre livelli

La UI di NSH è costruita su tre livelli, come quella di GPUI Kit:

| Livello | NSH | GPUI Kit | Cos'è |
|---|---|---|---|
| Primitive | `nsh-core` e il runtime (`nsh`, `nsh/mobile`, `nsh/desktop`) | `gpui` | Gli elementi host, gli stili, il layout, il rendering, la reattività, l'ambiente |
| Componenti base | `nsh-base` (`nsh/base`) | `gpui-base` | Componenti senza stile che gestiscono comportamento, stato, focus, tastiera e accessibilità, e prendono il proprio aspetto dall'app |
| Libreria di componenti | quella della tua app, o della community | `gpui-component` | Componenti con stile: pulsanti, card, righe con un aspetto |

I primi due livelli sono Native Shell. Il terzo è tuo: un'app costruisce la propria libreria di componenti su `nsh/base` e
sulle primitive, in TSX o come componenti Rust nel [proprio crate](./rust.md), usa una libreria pubblicata dalla community, oppure
applica lo stile alla propria UI direttamente nell'app.

<a id="the-crates"></a>

## I crate

NSH è un workspace Rust. Non devi mai compilarlo per scrivere app (la distribuzione include la CLI e i runtime precompilati), ma
i nomi compaiono nei log e nella documentazione:

| Crate | Cos'è |
|---|---|
| `nsh-core` | Il core indipendente dalla piattaforma: shadow tree, stili, layout Taffy, unione del testo, virtualizzazione delle liste, mount item; valori CSS e Tailwind; il grafo di animazione nativo (valori, interpolazione, timing / spring / decay); il framework e il tema dei componenti Rust; i moduli Rust del runtime (`BackHandler` di `nsh/mobile`, ...). |
| `nsh-base` | `nsh/base`, i componenti base senza stile (`gpui-base` di NSH): navigazione, dialog, controlli e la status bar; le app Rust lo usano come `nsh_base`. |
| `nsh-js` | L'host QuickJS e il runtime di NSH: il grafo reattivo, il renderer, ogni modulo nativo, le API globali, l'hot module replacement, i limiti; e le dichiarazioni TypeScript di tutto questo. |
| `nsh-engine` | L'engine thread: pilota `nsh-js` e `nsh-core` e consegna un batch per frame alla piattaforma. |
| `nsh-package` | Pacchetti firmati: chiavi, certificati, revoca, il trust store. |
| `nsh-bundler` | Il bundler: rolldown, Oxc, il compilatore JSX di NSH, source map, verifica delle classi Tailwind. |
| `nsh-dev` | Il dev server e il suo client. |
| `nsh-platform-ios` | Il backend UIKit (iOS, simulatore, Mac Catalyst): montaggio delle view, il motore di testo CoreText, input; l'SDK di embedding. |
| `nsh-platform-android` | Il backend Android: `libnsh.so` e il runtime Java (`NshView`, le view, le immagini, la rete). |
| `nsh-cli` | Il comando `nsh`. |

La direzione delle dipendenze è `nsh-core` ← `nsh-js` ← `nsh-engine` ← piattaforme; `nsh-base` si basa su `nsh-core`. Il core non dipende da nessuna piattaforma né da alcun engine JS,
ed è ciò che permette a `nsh test` di eseguire il vero runtime in modalità headless su qualsiasi macchina.

<a id="see-also"></a>

## Vedi anche

- [Prestazioni](./performance.md)
- [Reattività](./reactivity.md)
