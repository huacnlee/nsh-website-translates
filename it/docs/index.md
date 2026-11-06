---
title: "Introduzione"
description: "Che cos'è Native Shell: un framework UI nativo Rust-first per iOS, Android, macOS, Windows, Linux e il web, con l'interfaccia utente e le interazioni proprie di ciascuna piattaforma."
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---

# Introduzione

Native Shell (in breve NSH) è un framework UI nativo per ogni piattaforma. Crei un'app una sola volta, con un unico modello di app (componenti, signal, stili e la stessa API ovunque), e NSH la esegue su **iOS, Android, macOS, Windows, Linux e web**, ogni volta come app di quella piattaforma: composta dalle sue viste, con il testo modificato dal suo sistema di testo, utilizzata come si aspettano i suoi utenti. Scrivi l'intera app in **Rust**, scrivi le schermate in **TSX**, oppure combina entrambi su un unico motore. Sullo stesso motore, le app già distribuite possono ricevere nuova UI a runtime, scritta dal tuo team o generata da un modello, sotto forma di moduli firmati, in una sandbox configurata dall'host.

> [!IMPORTANT]
> NSH fornisce viste e interazione native; il design visivo appartiene all'app. Componenti, stato e API sono condivisi tra le piattaforme, mentre colori, tipografia, spaziature e forme provengono dall'app. L'input di testo, il focus e i menu seguono le convenzioni di interazione di ciascun dispositivo. Vedi [Obiettivi e principi di progettazione](./goals.md).

<a id="what-native-means"></a>

## Cosa significa nativo

In NSH, nativo ha due livelli: le fondamenta della piattaforma e l'interazione della piattaforma.

**Le fondamenta della piattaforma.** Ogni piattaforma ha un backend proprio, costruito sulla UI che quella piattaforma già possiede:

| Piattaforma | Viste | Testo | Input di testo |
|---|---|---|---|
| iOS | UIKit | CoreText | I campi di testo e le viste di testo del sistema |
| Android | Viste Android | `StaticLayout` | `EditText` |
| macOS | AppKit, Core Animation | CoreText | `NSTextField`, `NSTextView` |
| Windows | Finestre Win32 disegnate con Direct2D | DirectWrite | L'editor di NSH, con i metodi di input del sistema (IMM32) |
| Linux | GTK 4 | Pango | `Text` e `TextView` di GTK |
| Web | Elementi HTML stilizzati con CSS | I font del browser | Gli input del browser |

La selezione del testo e il suo menu, i metodi di input, l'accessibilità e lo scorrimento provengono dalla piattaforma, e ciò che una nuova versione del sistema operativo porta in questi ambiti arriva all'app insieme ad essa. I componenti nativi (una mappa, una web view, un video player, qualsiasi vista registrata dall'host) sono una vista in più nella stessa gerarchia, disposta, ritagliata e fatta scorrere insieme alle altre ([Componenti nativi](./native-components.md)).

**L'interazione della piattaforma.** I componenti che NSH fornisce in [`nsh/base`](../modules/nsh-base.md) si comportano come si aspettano gli utenti di ciascun dispositivo, quindi l'app li scrive una sola volta:

| | Desktop (e browser desktop) | Telefoni e tablet |
|---|---|---|
| `Menu` | Un popup sul suo trigger; i sottomenu si aprono a cascata accanto alla loro voce | Un foglio dal basso; un sottomenu sostituisce le voci del suo menu |
| `ContextMenu` | Un clic destro lo apre sul puntatore | Un dito premuto a lungo sul trigger lo apre come foglio |
| `Tooltip` | Mostrato quando il puntatore si ferma sul trigger | Mostrato quando l'app lo apre |
| `Popover` | Una pressione all'esterno lo chiude e raggiunge ciò che si trova sotto il puntatore | Una pressione all'esterno lo chiude |

Pagine, dialoghi, tastiera e barra di stato seguono la stessa idea: gli stack di navigazione eseguono push e pop con il movimento proprio di ciascuna piattaforma, e il pulsante indietro, Escape e lo swipe indietro fanno ciò che fanno lì ([Navigazione](./navigation.md)).

<a id="from-phone-to-desktop-to-web"></a>

## Dal telefono al desktop al web

Cross-platform in NSH significa che ogni dispositivo ottiene l'app che si aspetta, non la stessa schermata ingrandita o ridotta:

- **Un solo modello di app.** I componenti, lo stato, la logica di business e le schermate dell'app sono condivisi; ogni backend li mappa sulla propria piattaforma.
- **Layout che si trasformano.** Flexbox e CSS grid sono disposti da [Taffy](https://github.com/DioxusLabs/taffy) su ogni piattaforma, e i breakpoint di Tailwind (`md:`, `lg:`) e la dimensione della finestra (`window()` in Rust) cambiano la struttura, non solo la dimensione: un'app di chat mostra barra laterale, conversazioni e messaggi affiancati in una finestra ampia, e una schermata alla volta su un telefono ([Layout](./layout.md), [Tailwind](./tailwind.md)).
- **L'input che ogni dispositivo si aspetta.** Puntatore, hover, clic destro, scorciatoie e focus sul desktop; tocchi, gesti, tastiera software e navigazione tra pagine sui telefoni. Quando un'app vuole qualcosa di specifico per piattaforma, le prop `desktop={{…}}` e `platform.select` lo permettono ([Codice specifico per piattaforma](./platform-specific.md)).
- **Verificata su ogni target.** `nsh test` esegue i test dell'app in modalità headless, e gli stessi test in finestre macOS, Windows, Linux e GPUI, in un simulatore iOS, su un dispositivo Android o in un browser, con l'input nativo della piattaforma ([Test e tracing](./testing-and-trace.md)).

Prendiamo un'app come un client di chat. Chi la sviluppa la costruisce sul desktop con `nsh run`, la apre in un simulatore iOS con `nsh run --target ios` per verificare il layout da telefono, poi in un browser con `nsh run --target web` (ogni volta lo stesso progetto), e `nsh package` produce le app installabili e il sito web. Un singolo ingegnere può portare avanti ciò che prima richiedeva un team per piattaforma, mentre il backend viene sviluppato in parallelo.

<a id="rust-first"></a>

## Rust al primo posto

NSH è costruito in Rust, e Rust è un linguaggio di prima classe per scrivere app con esso:

- **App intere in Rust.** UI, logica e componenti sono in Rust, compilati in codice nativo su ogni piattaforma, con l'ownership, i tipi, i thread di Rust e l'ecosistema di crates.io. Il calcolo gira a velocità nativa, e i grandi volumi di dati, il parsing e il lavoro di sistema restano nel linguaggio più adatto a svolgerli ([Sviluppare con Rust](./rust.md)).
- **TSX come seconda via.** TSX è adatto a schermate scritte rapidamente, plugin, piccole app e UI distribuita a runtime. Gira sullo stesso motore di Rust, con le stesse primitive, gli stessi componenti di base e gli stessi signal.
- **Entrambi insieme.** Un'app Rust può includere schermate TSX, e le schermate TSX importano i componenti, i moduli e le classi Rust dell'app.
- **Una sola toolchain.** Un unico eseguibile `nsh` crea, compila, esegue il type-check, esegue con hot reload, testa, impacchetta e firma le app per ogni target. Include il proprio bundler TSX e il proprio checker TypeScript, quindi chi proviene da Rust, Swift, Kotlin o C++ installa Rust e `nsh`, e inizia a lavorare ([Installazione](./installation.md), [CLI](./cli.md)).

<a id="an-app"></a>

## Un'app

Lo stesso contatore, in Rust e in TSX:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

Una vista (`view()`, `<View>`) diventa un `UIView` su iOS, un `ViewGroup` su Android, un `NSView` su macOS, un widget GTK su Linux, una vista retained disegnata con Direct2D su Windows e un elemento HTML sul web; un testo diventa una vista di testo nativa, e il feedback di pressione del pulsante (`.active(..)`, `activeStyle`) gira sul main thread. Quando tocchi, `count.update` modifica un solo signal, e viene aggiornato solo il testo che lo legge: la funzione del componente non viene rieseguita. L'app Rust è codice nativo dall'inizio alla fine; nell'app TSX, solo il codice del modulo stesso è JavaScript.

<a id="retained-views"></a>

## Viste retained

NSH è retained: ogni elemento è una vista che la piattaforma mantiene, e un aggiornamento modifica solo ciò che è cambiato.

- **Aggiornamenti a grana fine.** [Signal](./reactivity.md) come quelli di Solid, implementati in modo nativo: i componenti vengono eseguiti una sola volta, e un cambiamento rieseguirà solo le espressioni che leggono il signal modificato.
- **Solo ciò che è cambiato attraversa i thread.** Le modifiche di un turno vengono disposte insieme e consegnate al main thread come un unico batch di operazioni sulle viste per frame; stili e frame invariati non vengono inviati, e le viste che nulla ha toccato restano come sono.
- **Le animazioni girano in modo nativo.** Le animazioni timing, spring e decay, i gesti e i valori collegati allo scroll sono valutati sul frame clock della piattaforma, senza chiamare JS a ogni frame ([Animazione](./animation.md)).

Questo si adatta alle schermate di cui è fatta la maggior parte delle app (chat, posta, form, liste, documenti, impostazioni, una risposta di un'IA che arriva in streaming), dove cambiano poche viste alla volta e le altre restano ferme. Tali schermate sono quasi inattive tra un aggiornamento e l'altro, e scorrimento e animazioni mantengono 120 FPS sui display ProMotion. Nel [benchmark di prestazioni di NSH](https://github.com/longbridge/nsh-perf-bench), una tabella di quotazioni da 500 righe aggiornata 1.000 volte al secondo usa il 18% di un core su Linux in NSH Rust, contro il 20% della stessa schermata scritta direttamente su [GPUI Fast](https://github.com/longbridge/gpui-fast). Il calcolo pesante appartiene a Rust: TSX gira in QuickJS, un interprete, mentre un modulo Rust gira a velocità nativa anche quando viene chiamato da TSX; ordinare 100.000 righe richiede circa 3 ms in questo modo, come in Rust puro ([Prestazioni](./performance.md)).

<a id="how-it-runs"></a>

## Come viene eseguita

La toolchain è un unico binario `nsh`. Un'app è scritta in Rust, in TSX o in entrambi, e ciascuno segue il proprio percorso verso lo stesso motore Rust.

<a id="rust-apps"></a>

### App Rust

Un'app Rust è un crate, costruito interamente con Rust e Native, senza alcun runtime JavaScript:

1. **Build.** `nsh` compila il runner di ciascun target (l'app iOS, Android, macOS, Windows, Linux o web) con il tuo crate collegato. Componenti, stato, handler e motore vengono compilati insieme in codice nativo.
2. **Esecuzione.** Il componente radice dell'app gira sull'engine thread come Rust. Il runner non ha un motore JavaScript: QuickJS non fa parte di un'app Rust su nessuna piattaforma.

<a id="tsx-apps"></a>

### App TSX

Un'app TSX (un modulo) è un insieme di file `.tsx` / `.ts` con un entry, di solito `App.tsx`:

1. **Build.** `nsh` esegue il bundle dei file del modulo (con rolldown e Oxc) e compila il JSX con un compilatore proprio. Gli import di `nsh` e `nsh/*` restano import: il runtime li fornisce in modo nativo, quindi il bundle contiene solo il tuo codice. Il bundle viene compilato in bytecode QuickJS.
2. **Esecuzione.** L'engine thread esegue il bytecode in [QuickJS](https://github.com/quickjs-ng/quickjs), una VM per vista. Il JSX compilato chiama direttamente il renderer nativo, e JavaScript si limita a descrivere la UI e a gestire gli eventi; il parsing degli stili, la risoluzione delle classi Tailwind, il diffing, il layout e il testo avvengono tutti in Rust.

<a id="the-difference"></a>

### La differenza

| | App Rust | App TSX |
|---|---|---|
| Scritta in | Rust | TSX (TypeScript e JSX) |
| Compilata in | Codice nativo, collegato al runner di ogni target | Bytecode QuickJS, caricato dal runtime |
| Motore JavaScript | Nessuno | QuickJS, una VM per vista |
| Durante lo sviluppo (`nsh run`) | Ricompilata e riavviata a ogni salvataggio | Aggiornamenti a caldo a ogni salvataggio |
| Dopo il rilascio | Distribuita con l'app | Distribuita anche a runtime come pacchetti firmati, in una sandbox |
| Adatta a | App intere, calcolo pesante, lavoro di sistema | Schermate scritte rapidamente, plugin, UI generata da IA |

I due approcci si combinano: un'app Rust può includere schermate TSX, e le schermate TSX importano i suoi componenti, moduli e classi Rust; un'app di questo tipo collega QuickJS per eseguirle ([Sviluppare con Rust](./rust.md)).

<a id="the-shared-engine"></a>

### Il motore condiviso

Dal motore in poi, i due percorsi sono identici. Le modifiche vengono raccolte per turno, disposte con Taffy (flexbox e CSS grid) e consegnate al main thread come un unico batch di operazioni sulle viste per frame; il main thread applica il batch alle viste native. Il testo viene misurato e disposto una sola volta sull'engine thread (CoreText sulle piattaforme Apple, `StaticLayout` su Android, DirectWrite su Windows, Pango su Linux, le metriche dei font del browser sul web) e solo disegnato sul main thread.

Sul web, lo stesso motore gira nella pagina: il browser mostra elementi HTML stilizzati con CSS, li fa scorrere, ne seleziona il testo e gestisce l'input, e `nsh package --target web` pubblica l'app come sito statico i cui file hanno nomi basati sul contenuto, pronto per qualsiasi CDN ([Web](./web.md)).

> [!NOTE]
> Il main thread non aspetta mai il codice dell'app. Le domande che il sistema pone in modo sincrono (questo input può accettare un altro carattere, l'utente può fare swipe indietro, questo foglio può essere chiuso) ricevono risposta in modo nativo da prop impostate in precedenza, come `maxLength`, `popOnBack` o `closeOnSwipe`. Gli eventi raggiungono gli handler dell'app in un secondo momento.
<a id="dynamic-ui-and-ai-generated-ui"></a>

## UI dinamica e UI generata dall'AI

NSH è nato come un modo per consentire alle app native di ricevere UI dopo il rilascio, e questo resta uno dei suoi usi principali. Un'app incorpora un `NshAppView` (iOS), `NshView` (Android), `AppView` (app macOS, Windows, Linux e GPUI) o `createPlayer` (una pagina web) nel punto in cui deve comparire un modulo, e NSH esegue al suo interno moduli TSX:

- **Consegnati dopo il rilascio.** Un modulo è un pacchetto firmato (`.nshpkg`) che l'app scarica a run time. L'app verifica la firma rispetto alle chiavi di cui si fida e rispetto a una lista di revoca prima di eseguirlo ([Pacchetti firmati](./signed-packages.md)). L'app host include il runtime; i team sviluppano i moduli sulla sua API e li consegnano secondo i propri tempi.
- **L'host mantiene il controllo.** Ogni modulo viene eseguito nella propria VM QuickJS, con limiti di memoria, di tempo di chiamata e di nodi, e accede solo a ciò che l'host concede: host di rete, pagine web, la barra di stato ([Sandbox e capability](./sandbox-and-capabilities.md)). Più moduli vengono eseguiti fianco a fianco.
- **Ha l'aspetto del resto dell'app.** I moduli vengono renderizzati con la UI nativa della piattaforma, e l'host può registrare le proprie viste native — una mappa, un player, un componente del design system — che i moduli possono usare ([Componenti nativi](./native-components.md)).

Lo stesso meccanismo permette a un'app di **rispondere con un'interfaccia**. Un modello scrive un piccolo modulo TSX (un modulo di input, un grafico, una scheda di prenotazione), il tuo server lo controlla, lo compila e lo firma, e l'app lo mostra in modo nativo:

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

Su iOS, la parte a carico dell'host è di poche righe:

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## Adatto all'AI

NSH è progettato per il software scritto con l'AI, sia per app intere sia per schermate generate:

- **Un unico modello di app per ogni piattaforma.** Un modello impara un solo modo di scrivere la UI, e il risultato funziona su telefoni, desktop e web; NSH adatta l'interazione a ciascuna piattaforma, quindi nulla viene generato sei volte.
- **Rust o TSX, a seconda del compito.** Rust per app intere e moduli critici per le prestazioni, TSX per schermate, plugin e UI generata a ogni richiesta — su un unico motore.
- **Un contratto preciso e generato.** Ogni elemento, prop, chiave di stile e modulo ha dichiarazioni TypeScript generate dai sorgenti Rust (`.nsh/types`), e le API Rust sono tipizzate, quindi il codice generato viene verificato da un compilatore. Questa documentazione è servita come testo semplice per i modelli ([`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt)).
- **Una sola riga di comando per l'intero ciclo.** Un agente crea l'app, la compila, la esegue su una destinazione, esegue i test, legge il risultato, corregge e la impacchetta, tutto tramite `nsh`. `nsh test` viene eseguito in modalità headless, senza dispositivo, e riporta gli errori e le viste prodotte; il compilatore funziona anche in-process (`nsh_bundler::compile_module`) e nel browser ([Playground](/playground)).
- **Sicuro da eseguire anche quando non è attendibile.** Il codice generato e consegnato a run time è codice non attendibile: arriva firmato, viene eseguito in una VM con limiti e accede solo alle capability concesse dall'host.

<a id="where-it-runs"></a>

## Dove funziona

| Piattaforma | Requisiti | Backend | Incorporato con |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Android views | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | Browser moderni | HTML | `createPlayer`, iframe |
| [GPUI](./gpui.md) | Desktop | GPUI | `AppView` (app GPUI, GPUI Kit) |
| Mac Catalyst | macOS | UIKit | Per lo sviluppo (`--target catalyst`) |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell e GPUI Shell

[Longbridge](https://longbridge.com) sviluppa NSH per i propri client. La prima esigenza era un livello di plugin per il client mobile, e il punto di partenza è stato [GPUI Shell](https://gpui-kit.com/shell), che rende estensibili in JavaScript le app desktop [GPUI](https://gpui-kit.com). Sui telefoni, una UI disegnata da GPUI stesso avrebbe dovuto ricostruire ciò che la piattaforma già offre — la selezione del testo e il relativo menu (Copia, Condividi, Traduci, Cerca), i metodi di input, l'accessibilità, i materiali visivi che ogni release di iOS porta con sé — e ogni team mobile avrebbe dovuto adottare un nuovo stack UI. NSH quindi esegue il rendering con la UI nativa di ciascuna piattaforma, ed è cresciuto da quel livello di plugin fino a diventare un framework per app complete su ogni piattaforma.

I due progetti hanno posizionamenti diversi. GPUI Shell estende le applicazioni desktop GPUI; Native Shell è un framework per app native su telefoni, desktop e web, e il suo backend GPUI incorpora le app NSH nelle app GPUI e GPUI Kit ([GPUI](./gpui.md)).

<a id="how-it-compares"></a>

## Confronto con altri approcci

Per le app complete, NSH si colloca tra i framework multipiattaforma come React Native, Flutter, Qt, GPUI, Slint, Electron e Tauri; per la UI consegnata dopo il rilascio, tra web view, server-driven UI e contenitori di mini-program. La sua scelta è la UI e l'interazione native di ciascuna piattaforma sotto un unico modello di app, con Rust come linguaggio dell'app e TSX accanto. [Confronto tra approcci](./comparison.md) li analizza uno per uno.

<a id="next-steps"></a>

## Passi successivi

- [Installazione](./installation.md) e [Per iniziare](./getting-started.md): installa `nsh`, scrivi una prima app in Rust o TSX ed eseguila su ogni piattaforma.
- [Sviluppo con Rust](./rust.md): app scritte in Rust, e TSX sopra di esse.
- [Piattaforme](./platforms.md): cosa funziona dove, e come eseguire, impacchettare e incorporare su ciascuna piattaforma.
- [JSX e componenti](./jsx-and-components.md) e [Reattività](./reactivity.md): le due idee su cui poggia tutto il resto, in Rust e TSX.
- [Pacchetti firmati](./signed-packages.md) e [Sandbox e capability](./sandbox-and-capabilities.md): consegna i moduli e decidi cosa possono fare.
