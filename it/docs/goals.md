---
title: "Obiettivi e principi di progettazione"
description: "Gli obiettivi di Native Shell: viste e interazioni native, design di proprietà dell'app, componenti condivisi, e Rust e TSX su un unico motore."
order: 1.5
group: start
source_hash: bad49295450504d6
---

Native Shell fornisce view e interazione nativi su iOS, Android, macOS, Windows, Linux e web. Il design visivo appartiene all'app. Un unico modello di componenti serve app complete, funzionalità incorporate e UI distribuita dinamicamente.

<a id="native-foundations-app-owned-design"></a>

## Fondamenta native, design di proprietà dell'app

NSH si basa sulle view, sul testo e sull'infrastruttura di input di ciascuna piattaforma, e adatta l'interazione al dispositivo: navigazione da tastiera, input con puntatore e touch, modifica del testo, scorrimento e accessibilità ([Introduzione](./index.md#what-native-means)).

L'app definisce colori, tipografia, spaziatura, forme, feedback di stato e animazioni. Una schermata delle impostazioni può seguire il brand dell'app su iOS e Android, mentre input e navigazione seguono le convenzioni di ciascun dispositivo. I designer perfezionano quel linguaggio visivo attraverso stili e parti dei componenti.

Una view nativa è la base di rendering. Un controllo con stile di sistema è una particolare scelta visiva e comportamentale. I controlli comuni di NSH espongono comportamento condiviso e parti personalizzabili, in modo che le applicazioni possano costruire i propri design system.

<a id="native-integration-in-practice"></a>

## L'integrazione nativa in pratica

Le fondamenta native comprendono rendering, animazioni guidate dai frame, input e semantica di accessibilità. Su iOS e Android, [Input](../elements/input.md) usa i campi di testo della piattaforma: la piattaforma gestisce modifica, menu di selezione, metodi di input e i servizi di compilazione automatica supportati. L'app descrive il campo tramite `autoComplete`, ad esempio `current-password` o `postal-code`, e il sistema fornisce i suggerimenti disponibili in base alle proprie impostazioni e ai propri servizi ([Moduli e tastiera](./forms-and-keyboard.md)). Applicare uno stile al campo è compatibile con il mantenimento di questa integrazione di sistema.

Questa è una distinzione architetturale rispetto al disegnare un campo di testo interamente all'interno di un renderer personalizzato: un renderer personalizzato deve fornire una propria integrazione con i servizi di sistema per la modifica del testo e per l'accessibilità, mentre NSH usa i controlli di testo della piattaforma dove il suo backend li mette a disposizione. La documentazione di ciascun backend definisce la rispettiva integrazione, incluso l'editor di NSH su Windows e il backend di embedding GPUI ([Piattaforme](./platforms.md)).

La separazione tra comportamento dei componenti e design visivo in [GPUI Kit](https://gpui-kit.com) ispira i livelli di NSH. NSH sviluppa quel principio sull'infrastruttura di view e input della piattaforma. Integrazione nativa e design di proprietà dell'app lavorano insieme in tutto questo modello.

<a id="one-component-model-across-platforms"></a>

## Un unico modello di componenti su tutte le piattaforme

Uno switch ha lo stesso significato su un telefono, su un desktop e sul web. [`nsh/base`](../modules/nsh-base.md) fornisce stato, gestione dell'input, focus e accessibilità; l'app applica lo stile a traccia, indicatore e stati dello [Switch](../elements/switch.md). Pulsanti, checkbox e radio seguono lo stesso principio.

| Responsabilità | Dove risiede | Esempio |
|---|---|---|
| Rendering, layout, reattività e ambiente | `nsh-core`, `nsh` e moduli di runtime | View, testo, signal, stili |
| Comportamento condiviso e struttura accessibile | `nsh-base`, importato come `nsh/base` in TSX | `Button`, `Checkbox`, `Switch`, `Tabs` |
| Design visivo e componenti con stile | L'app o una libreria della community | Controlli brandizzati, card, righe di form |
| Funzionalità specifiche della piattaforma | `nsh/mobile`, `nsh/desktop` | Barra di navigazione mobile, controlli della finestra desktop |

I controlli comuni hanno un'unica sede multipiattaforma in `nsh/base`. I moduli di piattaforma sono delimitati in base allo scopo e alla semantica della piattaforma. [`TabBar`](../modules/nsh-mobile.md#tabbar) serve la navigazione di primo livello su mobile; [`Tabs`](../elements/tabs.md) alterna contenuti a schede su tutte le piattaforme. I loro ruoli sono distinti. `nsh/mobile` accoglie funzionalità con semantica di interazione specifica del mobile; le differenze nell'aspetto, nelle dimensioni, nella tinta o nell'animazione di un controllo comune rientrano nel suo componente condiviso e nello stile dell'app. Una notifica o un toast con un ruolo condiviso va progettato prima di tutto attorno a un unico contratto multipiattaforma, con la presentazione adattata internamente.

Un componente condiviso può adattare internamente la propria interazione: un menu si apre come popup su desktop e come sheet su telefono, mentre l'app usa un'unica API e fornisce il proprio aspetto. Le presentazioni gestite dal sistema, come le intestazioni di navigazione e gli alert, seguono le regole di presentazione documentate della piattaforma. Le app possono esporre i propri componenti e servizi nativi tramite le [interfacce di embedding](./native-components.md).

<a id="the-unstyled-foundation-and-the-component-library-layer"></a>

## Le fondamenta senza stile e il livello della libreria di componenti

NSH possiede le primitive e le fondamenta senza stile (`nsh-core` e `nsh-base`). Le applicazioni e le librerie di terze parti possiedono il livello della libreria di componenti con stile, il ruolo che `gpui-component` svolge in [GPUI Kit](https://gpui-kit.com). Questa suddivisione dà a ciascun prodotto il controllo sul proprio linguaggio visivo, riutilizzando le parti più difficili dell'implementazione dei componenti.

L'esperienza alla base di questa scelta deriva da [GPUI Kit](https://gpui-kit.com). I suoi componenti con stile sono nati dal lavoro su Longbridge Pro. Man mano che le applicazioni richiedevano design sempre più diversi, la pressione verso la personalizzazione ha spinto gli utenti a fare il fork dei componenti. Estrarre le fondamenta condivise in `gpui-base` ha reso il comportamento riutilizzabile tra quei design. I componenti con stile restano utili come riferimento di design e per le applicazioni le cui esigenze rientrano nella loro superficie di personalizzazione; le fondamenta offrono alle altre applicazioni il controllo diretto sulla presentazione.

NSH applica questa lezione fin dall'inizio. `nsh/base` possiede comportamento complesso, interazione, stato reattivo, focus, accessibilità e presentazione adattiva, con test al livello che possiede ciascun comportamento. Ciò include strutture più ampie come [Dock](../elements/dock.md). Le applicazioni costruiscono design diversi su quelle fondamenta attraverso stili, stati, slot e parti. I contributi ai componenti seguono lo stesso confine: i valori visivi predefiniti e le varianti brandizzate appartengono ai componenti dell'applicazione o di terze parti. Le presentazioni gestite dal sistema documentate e i valori predefiniti di lettura di `TextView` mantengono i propri contratti specifici ([Architettura](./architecture.md#three-layers)).

<a id="what-the-gallery-demonstrates"></a>

### Cosa dimostra la Gallery

Le demo del sito web e la Gallery sono applicazioni di esempio con stile. I loro gradienti, ombre, angoli arrotondati, transizioni e animazioni mettono alla prova le capacità di personalizzazione di NSH e forniscono esempi di codice sorgente. Quelle scelte appartengono alle demo e alla Gallery; i componenti di base riutilizzabili espongono il comportamento e le parti sottostanti. Le applicazioni possono riprendere gli esempi o costruire un linguaggio visivo diverso.

Una libreria con stile distribuita in modo indipendente apparterrebbe al livello applicazione/community descritto sopra. Lo stile della Gallery illustra una direzione di design; l'idoneità per un prodotto specifico è una decisione di design di quel prodotto.

<a id="rust-and-tsx-on-one-engine"></a>

## Rust e TSX su un unico motore

Le app Rust, le schermate TSX e i progetti misti condividono primitive, componenti di base, signal e layout. Rust offre logica applicativa compilata e componenti nativi riutilizzabili. TSX supporta l'iterazione rapida e i moduli distribuiti a runtime ([Sviluppare con Rust](./rust.md)).

Il motore aggiorna i binding che dipendono da signal modificati e raggruppa le operazioni sulle view. Layout del testo, animazioni native e input appartengono al motore e ai suoi backend di piattaforma ([Architettura](./architecture.md)). Le prestazioni vengono valutate con carichi di lavoro applicativi riproducibili ([Performance](./performance.md)).

<a id="embedding-dynamic-delivery-and-ai"></a>

## Embedding, distribuzione dinamica e AI

Un'app nativa esistente colloca una view NSH nel punto in cui serve una funzionalità ed espone i propri componenti nativi e servizi host. Le app standalone usano lo stesso runtime e lo stesso modello di componenti ([Piattaforme](./platforms.md)).

I moduli TSX distribuiti dinamicamente possiedono il proprio stato, la propria logica e il proprio layout. I pacchetti firmati stabiliscono di quali publisher l'host si fida; i limiti della sandbox e le capability definiscono ciò che i moduli possono fare. L'host sceglie sia la fiducia sia i permessi ([Pacchetti firmati](./signed-packages.md), [Sandbox e capability](./sandbox-and-capabilities.md)).

La UI generata dall'AI segue quel contratto: si genera TSX rispetto alle API dichiarate, lo si controlla e lo si testa, si compila e si firma il modulo, quindi lo si verifica e lo si esegue secondo la policy dell'host. Le dichiarazioni generate, la documentazione leggibile dai modelli e i test da CLI rendono il flusso di lavoro ispezionabile e ripetibile ([Test e tracciamento](./testing-and-trace.md)).

<a id="how-these-goals-guide-additions"></a>

## Come questi obiettivi guidano le aggiunte

1. Stabilire il comportamento per l'utente e se è condiviso tra le piattaforme.
2. Collocare il comportamento condiviso nella primitiva o nel componente di base esistente, esponendo stato e parti per la personalizzazione da parte dell'app.
3. Collocare le funzionalità con semantica specifica della piattaforma nel rispettivo modulo di piattaforma, documentandone l'applicabilità e la composizione con la UI condivisa.
4. Costruire i componenti con stile nell'app o nella libreria della community.
5. Verificare comportamento, accessibilità, layout e input sulle piattaforme interessate, e documentare il contratto pubblico in entrambe le lingue.

Questi principi mantengono flessibile il design visivo, coerenti le API dei componenti condivisi ed esplicita l'integrazione con la piattaforma man mano che NSH cresce.
