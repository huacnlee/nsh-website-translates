---
title: "Confronto degli approcci"
description: "Come Native Shell si confronta con React Native, Flutter, Qt, GPUI e Slint, con Electron e Tauri, e con le web view e la server-driven UI per le interfacce distribuite dopo il rilascio."
order: 2
group: start
source_hash: 80f11e255cf3463f
---

# Confronto tra approcci

NSH è un framework per app complete su iOS, Android, macOS, Windows, Linux e web, e un runtime per UI consegnata alle app dopo il rilascio. Questa pagina lo confronta prima con i framework cross-platform in cui si scrivono le app, poi con i modi in cui le app ricevono UI che non avevano all'interno del pacchetto distribuito. Il verde indica che la funzionalità è disponibile, il giallo che richiede più lavoro da parte dell'app o un progetto separato, il rosso che non è fornita; i simboli descrivono la disponibilità, non le prestazioni. Le versioni sono i minimi documentati di ciascun framework al momento della scrittura: verificali per la release che usi.

Legenda: <span class="status status--yes" role="img" aria-label="Sì"></span> Sì · <span class="status status--partial" role="img" aria-label="Parziale"></span> Parziale · <span class="status status--no" role="img" aria-label="No"></span> No.

<a id="cross-platform-frameworks"></a>

## Framework cross-platform

| Funzionalità | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| Disegnato da | UI della piattaforma | View della piattaforma | Motore proprio | Scene graph | Proprio, GPU | Proprio, GPU | Renderer proprio |
| Modello di UI | Retained | Retained | Retained | Retained | Immediate | Immediate + Retained | Reattivo, retained |
| Linguaggio | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="Sì"></span> 15+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 15+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 17+ | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="Sì"></span> 9+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 7+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 7+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 9+ | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="Sì"></span> 14+ | <span class="status status--partial" role="img" aria-label="Parziale"></span> Separato | <span class="status status--yes" role="img" aria-label="Sì"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 13+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="Sì"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="Parziale"></span> Separato | <span class="status status--yes" role="img" aria-label="Sì"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sì"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="Sì"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="Sì"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="Sì"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Sì"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Sì"></span> |
| Web | <span class="status status--yes" role="img" aria-label="Sì"></span> HTML | <span class="status status--partial" role="img" aria-label="Parziale"></span> Libreria | <span class="status status--yes" role="img" aria-label="Sì"></span> Canvas | <span class="status status--yes" role="img" aria-label="Sì"></span> Canvas | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> Canvas |
| Testo di sistema | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> |
| UX per dispositivo | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> |
| Nessun runtime JS | <span class="status status--yes" role="img" aria-label="Sì"></span> App Rust | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> C++ | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--yes" role="img" aria-label="Sì"></span> |
| Distribuzione firmata | <span class="status status--yes" role="img" aria-label="Sì"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> OTA | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parziale"></span> QML | <span class="status status--partial" role="img" aria-label="Parziale"></span> Shell | <span class="status status--partial" role="img" aria-label="Parziale"></span> Shell | <span class="status status--no" role="img" aria-label="No"></span> |
| Licenza | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, commerciale | Apache-2.0 | Apache-2.0 | GPL, commerciale |

La modalità immediate ricostruisce la descrizione della UI a ogni frame; la modalità retained la conserva e aggiorna solo ciò che è cambiato. GPUI Fast combina le due modalità su GPUI e gira dove gira GPUI. "Shell" è [GPUI Shell](https://gpui-kit.com/shell).

NSH è l'unico framework tra questi che riunisce tutto: la UI e l'input di testo nativi di ogni piattaforma, telefoni, desktop e web da un'unica app (il web come HTML), app Rust senza runtime JavaScript e UI firmata e in sandbox consegnata dopo il rilascio.

<a id="what-the-rows-mean"></a>

### Significato delle righe

- **Disegnato da, Modello di UI.** NSH monta le view native di ogni piattaforma e le mantiene (modalità retained): una modifica aggiorna solo le view toccate. Anche React Native monta view della piattaforma, su iOS e Android. Flutter, Qt Quick, GPUI e Slint disegnano con renderer propri; GPUI costruisce l'albero degli elementi a ogni frame (modalità immediate), e [GPUI Fast](https://github.com/longbridge/gpui-fast) riutilizza ciò che non è cambiato.
- **Piattaforme.** I minimi di NSH sono i suoi ([Piattaforme](./platforms.md)). Gli altri provengono da [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24; macOS e Windows tramite i progetti separati react-native-macos e react-native-windows, il web tramite la libreria react-native-web), [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), [i requisiti di Zed](https://zed.dev/docs/installation) per GPUI e [le guide alle piattaforme di Slint](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS da Rust). "Canvas" significa che il framework disegna in un canvas nella pagina; le app web di NSH sono elementi HTML con stili CSS, di cui il browser gestisce scorrimento, selezione e modifica ([Web](./web.md)).
- **Testo di sistema.** I campi di testo di NSH sono gli editor della piattaforma — `UITextView`, `EditText`, `NSTextView`, il `TextView` di GTK, quello del browser — con i metodi di input, le maniglie di selezione e i menu di modifica del sistema; su Windows, l'editor proprio di NSH funziona con DirectWrite e con i metodi di input del sistema (IMM32). Anche React Native usa gli input di testo della piattaforma. I framework che disegnano da sé implementano da soli la modifica del testo e la collegano ai metodi di input del sistema.
- **UX per dispositivo.** I componenti di base di NSH seguono il dispositivo: lo stesso `Menu` è un popup accanto al suo elemento di attivazione con un puntatore e un foglio dal basso su un telefono, e un `ContextMenu` si apre con il clic destro o con un dito tenuto premuto. Negli altri, adattare l'interazione al dispositivo è per lo più lavoro dell'app.
- **Nessun runtime JS.** I runner di un'app Rust non collegano alcun motore JavaScript su nessuna piattaforma; TSX è il secondo percorso, sullo stesso motore. Il QML di Qt Quick gira sul motore JavaScript di Qt; Qt Widgets in C++ no.
- **Distribuzione firmata.** NSH verifica i pacchetti `.nshpkg` firmati rispetto alle chiavi di cui si fida e a una lista di revoca, ed esegue ciascuno in una VM con i limiti e le capability concessi dall'host ([Pacchetti firmati](./signed-packages.md), [Sandbox e capability](./sandbox-and-capabilities.md)). Gli aggiornamenti over-the-air di React Native distribuiscono codice dell'app considerato attendibile; Qt può caricare file QML; le app GPUI ricevono moduli JavaScript tramite [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### Cosa distingue NSH

- **Nativo su ogni piattaforma, in entrambi i sensi.** Ogni backend si basa sulle view, sul testo e sui metodi di input propri della piattaforma — UIKit, view Android, AppKit, Win32 con Direct2D, GTK 4, HTML — e l'interazione di ciascuna piattaforma ne è parte. Selezione del testo, metodi di input e accessibilità sono quelli del sistema, e ciò che una nuova release del sistema operativo porta in questi ambiti arriva all'app ([Introduzione](./index.md#what-native-means)).
- **Telefoni, desktop e web da un'unica app.** Sei piattaforme sono backend di un unico framework, con layout che si adattano e input che segue il dispositivo; sul web, l'app è HTML, pubblicata come sito statico.
- **Prima Rust, senza runtime JavaScript.** Un'intera app può essere Rust dall'inizio alla fine, compilata in codice nativo con i tipi, i thread e i crate di Rust. TSX è il secondo percorso, sullo stesso motore, per schermate da scrivere rapidamente ([Sviluppare con Rust](./rust.md)).
- **View retained per le app di tutti i giorni.** Chat, form, liste e documenti restano quasi inattivi a riposo, perché una modifica invia solo le view toccate ([Introduzione](./index.md#retained-views)).
- **UI consegnata dopo il rilascio, firmata e in sandbox.** Le app create con NSH — e le app native scritte con gli strumenti propri di ciascuna piattaforma — ricevono moduli TSX a runtime, scritti da un team o generati dall'AI ([UI dinamica](./index.md#dynamic-ui-and-ai-generated-ui)).
- **Una sola toolchain, per persone e agenti.** Un unico eseguibile `nsh` crea, esegue, testa su piattaforme reali, impacchetta e firma le app per ogni target.

### React Native

React Native è il più vicino negli intenti: entrambi riducono il lavoro duplicato sui client e usano le view della piattaforma. Il centro di React Native è JavaScript o TypeScript con React e il suo ecosistema di pacchetti, su iOS e Android, con il supporto desktop in progetti separati. Il centro di NSH è Rust: il suo runtime, il renderer e i moduli sono in Rust, Rust è un linguaggio per le app a pieno titolo e TSX è uno dei due percorsi; le sue sei piattaforme, desktop e web inclusi, sono backend dello stesso framework.

### Flutter

Flutter disegna ogni pixel con un proprio motore, così un'app ha lo stesso aspetto su ogni piattaforma. NSH prende la strada opposta: le view, il testo e l'input di testo di ciascuna piattaforma e, sul web, gli elementi HTML con lo scorrimento, la selezione e l'input propri del browser. Modifica del testo, metodi di input e selezione sono quelli della piattaforma, anziché essere reimplementati per ciascuna.
### Qt

Qt è un toolkit maturo con due tecnologie UI, Qt Widgets e Qt Quick, e strumenti e supporto di piattaforma consolidati nel tempo. NSH si distingue per la base e per il modello: Rust come linguaggio principale con un percorso TSX, una toolchain progettata per lo sviluppo automatizzato (e guidato dall'AI), il web renderizzato come HTML, e l'interazione mobile, desktop e web adattata all'interno di un unico modello di componenti.

<a id="gpui-and-gpui-fast"></a>

### GPUI e GPUI Fast

[GPUI](https://gpui-kit.com) è un framework UI Rust che disegna con la GPU, pensato per app desktop esigenti; [GPUI Fast](https://github.com/longbridge/gpui-fast) è il fork di Longbridge con rendering retained: riutilizza view, layout e misurazioni del testo non modificati, oltre a layer di scorrimento e composizione nativa delle finestre. NSH invece si appoggia alle view di ciascuna piattaforma, quindi input di testo, selezione, metodi di input e interazione con il sistema sono quelli nativi della piattaforma, e copre anche telefoni e web; il backend GPUI di NSH incorpora le app NSH nelle app GPUI e GPUI Kit ([GPUI](./gpui.md)).

I due approcci si adattano a carichi diversi. Nel [benchmark di prestazioni di NSH](https://github.com/longbridge/nsh-perf-bench) (Linux, una tabella di quotazioni da 500 righe, NSH sul backend GTK 4), i carichi quotidiani costano lo stesso: a 1.000 quotazioni al secondo, NSH Rust usa il 18% di un core e GPUI Fast il 20%. Con aggiornamenti densi e sostenuti GPUI Fast è in vantaggio: a 20.000 quotazioni al secondo usa il 25% di un core contro il 73–78% di NSH, e l'animazione fotogramma per fotogramma di 1.000 box costa circa un terzo della CPU di NSH.

### Slint

Slint è un toolkit UI dichiarativo con un proprio linguaggio e renderer leggeri, per desktop e dispositivi embedded, utilizzabile da Rust, C++, JavaScript o Python. Entrambi puntano alle prestazioni native; la strada di NSH è la UI e l'interazione propria di ciascuna piattaforma, HTML sul web, Rust e TSX come linguaggi per le app, e sviluppo guidato dall'AI su sei piattaforme.

<a id="electron-and-tauri"></a>

### Electron e Tauri

Electron include Chromium e Tauri usa la web view di sistema: entrambi costruiscono app desktop (e, con Tauri, app mobile) a partire da contenuti web, con il testo e l'input del browser. NSH invece costruisce le view native di ciascuna piattaforma e renderizza HTML solo sul web stesso.

<a id="ui-delivered-after-release"></a>

## UI distribuita dopo il rilascio

Un'app che vuole una UI che non era inclusa al momento del rilascio — risposte generate da un modello, funzionalità di partner o di altri team, schermate che cambiano senza un nuovo rilascio — ha a disposizione alcune opzioni consolidate, sia su telefoni sia su desktop. Si differenziano per ciò che disegna la UI, per ciò che il codice distribuito può fare e per quanto l'app deve cambiare per ospitarle.

| Funzionalità | NSH | Web view | Server-driven UI | Mini-program | Aggiornamenti OTA |
|---|---|---|---|---|---|
| Disegnata da | UI della piattaforma | Motore del browser | Le view dell'app | Motore web + livello | Renderer del framework |
| Aspetto e comportamento nativi | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Stato, logica e layout propri | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Componenti nativi dell'host | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Sandbox configurata dall'host | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Yes"></span> Schema | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Pacchetti firmati e revocabili | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| Adatta a UI generata dall'AI | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Pagine web | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Costo per l'app host | Una view e una libreria | Un motore browser per view | Un renderer per componente | Un SDK container | L'intera app nel framework |

- **Web view (H5).** Una pagina in un motore browser: tutto ciò che HTML può esprimere, con l'aspetto del browser e un bridge scritto a mano verso il codice nativo.
- **Server-driven UI.** JSON che ricombina i componenti e le azioni che l'app già include: facile da generare, senza stato locale né logica oltre a quanto fornisce lo schema.
- **Container di mini-program.** Un framework e un'API specifici della piattaforma su un motore web, all'interno di un grande SDK container.
- **Aggiornamenti over-the-air** (per esempio React Native con un servizio di code-push). L'intero framework, ma gli aggiornamenti sono codice dell'app considerato affidabile, e l'app deve essere scritta in quel framework.
- **NSH.** Un modulo TSX con stato, logica, animazione e layout propri, renderizzato con la UI nativa della piattaforma, che può usare le view native registrate dall'host. Arriva come pacchetto firmato che l'app verifica, viene eseguito in una VM dedicata con limiti di memoria, di tempo di chiamata e di nodi, e raggiunge solo gli host di rete, le pagine web e le impostazioni di sistema che l'host concede ([Sandbox e capability](./sandbox-and-capabilities.md)). L'host aggiunge una view nel punto in cui compare il modulo ([Piattaforme](./platforms.md#embed-in-a-native-app)), e lo stesso bundle gira su ogni piattaforma. È il motivo per cui NSH esiste accanto a [GPUI Shell](./index.md#native-shell-and-gpui-shell).

<a id="when-another-option-fits-better"></a>

## Quando un'altra opzione è più adatta

- La schermata è dominata da aggiornamenti densi e sostenuti di migliaia di view — un terminale di dati di mercato che riceve decine di migliaia di quotazioni al secondo, una visualizzazione personalizzata ridisegnata a ogni frame: il rendering GPU retained di GPUI Fast usa una frazione della CPU (vedi [GPUI e GPUI Fast](#gpui-and-gpui-fast)).
- L'app deve avere un aspetto identico al pixel su ogni piattaforma: un framework che disegna tutto da sé, come Flutter o Slint, lo garantisce per progettazione.
- Serve oggi un grande ecosistema di pacchetti di terze parti: React Native, Flutter e Qt ne hanno accumulati per anni.
- La UI è un documento o una pagina web esistente: una web view la mostra così com'è.
- L'insieme di schermate è fisso e ridotto, e cambiano solo contenuti e ordine: la server-driven UI non richiede alcun runtime.

<a id="see-also"></a>

## Vedi anche

- [Introduzione](./index.md): cos'è NSH e cosa significa nativo al suo interno.
- [Architettura](./architecture.md): cosa viene eseguito dove all'interno di NSH.
- [Prestazioni](./performance.md): le regole che NSH segue e come misurare un'app.
