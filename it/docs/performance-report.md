---
title: "Report sulle prestazioni"
description: "Numeri misurati delle app NSH - costi di commit e di frame dalle baseline di NSH, e frame rate, CPU e memoria della gallery pagina per pagina su Linux, macOS, Windows e iOS - con le istruzioni per riprodurli."
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---

# Report sulle prestazioni

Quanto costano le app NSH, misurato. Come NSH le mantiene veloci e come misurare la tua app è spiegato in [Prestazioni](./performance.md).

<a id="baselines"></a>

## Baseline

Dalle baseline di NSH (Apple silicon, salvo diversa indicazione):

| Scenario | Numeri |
|---|---|
| App Counter, headless (debug) | Primo frame ~0,5–0,65 ms (58 operazioni / 49 elementi di mount); un tap ~0,15 ms |
| App Counter, Mac Catalyst (release) | Primo frame ~1,05–1,15 ms (circa 0,7 ms servono a calcolare per la prima volta il layout di 10 testi con CoreText); un tap ~0,12 ms |
| Lista di foto della Gallery, headless (debug) | Primo frame 653 operazioni / 224 nodi, ~2,7 ms |
| Scorrimento della lista di foto, Catalyst (release) | Rebind di una riga durante uno scorrimento lento ~0,4 ms; una schermata intera di ~32 righe in un fling veloce 0,9–1,6 ms |
| Scorrimento della lista di foto, emulatore Android (arm64, release) | Rebind di una riga ~0,3–0,4 ms (JS ~60 µs) |
| Avvio del motore (release) | ~75–155 µs; le API globali (`fetch`, `URL`, ...) non costano nulla finché non vengono usate, poi ~90 µs |
| Hot reload | ~120 ms dal salvataggio di un file all'esecuzione della nuova versione; l'applicazione dell'aggiornamento richiede 0,2–0,5 ms |

## Linux (GTK 4)

Misurato su un desktop Linux (x86_64, 24 thread, GPU NVIDIA), build release, la gallery in una finestra da 1896 × 1030 su un display a 120 Hz, con ogni rilevazione eseguita automaticamente da `examples/gallery/tools/perf.py` (`nsh test --target linux --fps`, una riga al secondo; la CPU è quella dell'intero processo, in percentuale di un core). *Frame p95* è il tempo del main thread per frame disegnato al 95° percentile: sotto gli 8,3 ms, un frame rientra in un refresh a 120 Hz.

<a id="animated-demos"></a>

### Demo animate

<div class="data-table">

| Demo | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 22 sparkline live, un grafico intraday, order book, tape | 117–120 | 5–6 ms | 25–29% (1200 × 800), 28–32% (1896 × 1030) |
| Stocks, finestra a tutto schermo su un display 4K a 144 Hz con scala 1,6× | 143–145 | 4,1–4,4 ms | 26–29% |
| Canvas: un indicatore, un orologio, una matrice di punti | 120 | 2,6–4,4 ms | 5–10% |
| Animations: tre loop nativi, spring, sequenze | 120 | 2,0 ms | 12–13% |

</div>

<a id="every-page"></a>

### Ogni pagina

Ogni pagina della gallery, all'apertura e mentre il test la fa scorrere, in una finestra da 1200 × 800 su un display a 144 Hz (la stessa macchina). NSH disegna un frame solo quando cambia qualcosa sullo schermo, quindi qui *FPS* è la frequenza mentre qualcosa si muove: un frame per ogni intervallo mediano tra i frame disegnati (`perf.py`, `moving`); a 144 del display, ogni frame di un'animazione o di uno scorrimento arriva un refresh dopo il precedente. *Oltre un refresh* è la quota di frame che hanno impiegato più di un refresh (6,9 ms). GIF e WebP di Images vengono riprodotti al proprio frame rate (qui circa 50 FPS), così come il video. Physics, Overlays e Menus sono brevi: in 1200 × 800 uno scorrimento ne raggiunge la fine in pochi frame, quindi vengono misurati in una finestra da 900 × 500, dove hanno spazio per scorrere.

<div class="data-table">

| Pagina | Origine dei frame | FPS | Frame p95 | Oltre un refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Dati live, loop nativi | 144 | 4,1 ms | 0% | 26% |
| Stocks, scorrimento | Dati live, scorrimento | 144 | 4,1 ms | 0% | 25% |
| Photos, scorrimento | Scorrimento | 144 | 2,8 ms | 2% | 9% |
| Lists, scorrimento | Scorrimento | 143 | 1,7 ms | 0% | 7% |
| Scrolling, scorrimento | Scorrimento | 144 | 1,6 ms | 1% | 4% |
| Navigation, scorrimento | Scorrimento | 143 | 1,7 ms | 0% | 2% |
| Form, scorrimento | Scorrimento | 144 | 1,3 ms | 0% | 4% |
| Resizable, scorrimento | Scorrimento | 143 | 0,6 ms | 0% | 1% |
| Dock, scorrimento | Scorrimento | 142 | 0,5 ms | 1% | 1% |
| Gestures | Spring, un anello pulsante | 144 | 1,6 ms | 0% | 1–5% |
| Physics, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 1,6 ms | 1% | 1% |
| Animations | Loop nativi | 144 | 2,6 ms | 0–1% | 5% |
| Canvas, scorrimento | Scorrimento, loop nativi | 144 | 4,2 ms | 0% | 1–4% |
| Styles, scorrimento | Scorrimento | 144 | 2,3 ms | 2% | 3% |
| Tailwind | Utility `animate-*` | 144 | 1,7 ms | 0% | 3–8% |
| Text, scorrimento | Scorrimento | 144 | 1,9 ms | 0% | 4% |
| Text View, scorrimento | Scorrimento | 141 | 1,8 ms | 2% | 7% |
| Images, scorrimento | Scorrimento, frame GIF e WebP | 143 | 2,9 ms | 2% | 8% |
| Components, scorrimento | Scorrimento | 144 | 1,4 ms | 0% | 3% |
| Overlays, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 1,7 ms | 0% | 2% |
| Menus, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 1,9 ms | 0% | 2% |
| Controls | Transizioni | 144 | 0,9 ms | 0% | 1–4% |
| Web and video | Frame video, la pagina | 135–142 | 1,0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### Memoria

A riposo, 3 s dopo l'avvio (runner release, finestra da 480 × 640). *Private* è la memoria posseduta dal solo processo (USS); *resident* aggiunge le pagine delle librerie condivise (GTK, driver GPU), che ogni app GTK sulla macchina condivide:

<div class="data-table">

| App | Renderer | Private (USS) | Resident (RSS) |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | GL (`ngl`) | ~49 MB | ~142 MB |
| App Rust | Cairo (`GSK_RENDERER=cairo`) | ~28 MB | ~95 MB |
| Counter TSX (`examples/counter`) | GL | ~79 MB | ~166 MB |
| Finestra GTK 4 con una sola label, come riferimento | Vulkan / Cairo | ~62 / ~40 MB | ~132 / ~109 MB |

</div>

Rivisitare una pagina non aggiunge memoria; la prima visita a una pagina fa crescere il processo di quanto mette in cache di proposito (immagini decodificate, limitate a 128 MB) e delle librerie che carica al primo utilizzo (WebKitGTK per le web view).

<a id="app-size"></a>

### Dimensione dell'app

Un'app hello world creata da `nsh init` con ciascun template, e due app usate da persone reali, così come `nsh package --target linux` le compila per x86_64. Il runner è l'unico eseguibile dell'app; l'archivio è il `.tar.gz` con cui viene distribuita. Gli hello world sono compilati con link-time optimization e strippati (`CARGO_PROFILE_RELEASE_LTO=fat`, `CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`):

<div class="data-table">

| App | Scritta in | Runner | Archivio |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 16,5 MB | 7,5 MB |
| Hello world (`--template ts`) | TSX, su QuickJS | 25,7 MB | 11,6 MB |
| Hello world (`--template mixed`) | TSX e un crate Rust | 25,8 MB | 11,7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20,9 MB strippato | 9,7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22,3 MB | 9,8 MB |

</div>

I runner TSX contengono il runtime QuickJS, i moduli nativi e il renderer; il codice dell'app è il suo bundle accanto al runner, sotto 1 KB per un hello world.

Cosa determina questi numeri:

- **Il renderer**: con il driver NVIDIA, NSH disegna con il renderer GL di GSK, i cui frame costano una frazione di quelli del renderer Vulkan (demo Animations: ~1 ms di disegno per frame invece di ~9,5 ms). `GSK_RENDERER` ha comunque l'ultima parola.
- **Raster dei canvas**: ogni canvas viene rasterizzato una sola volta in tile da 256 px mantenuti sulla GPU. Un valore animato ridisegna solo l'area coperta dalle operazioni che lo leggono, sopra i pixel conservati della parte statica del disegno; un canvas fuori vista attende di essere scorso in vista.
- **Path messi da parte una sola volta**: `fillRect` e `fillText` dopo un path lungo lo lasciano al suo posto finché non viene usato di nuovo (una linea di 400 punti e poi 240 barre: 0,63 ms).

## macOS (AppKit)

Misurato su un MacBook Pro (Apple M3, 24 GB) con il suo display ProMotion integrato a 120 Hz, build release, la gallery in una finestra da 1200 × 800, con ogni rilevazione eseguita automaticamente da `examples/gallery/tools/perf.py` (`nsh test --target macos --fps`, una riga al secondo; la CPU è quella dell'intero processo, in percentuale di un core, la GPU la sua quota della GPU). Le fasi sono quelle del main thread per frame: *tick* (le animazioni native del display link) e *canvas* (la riproduzione dei disegni).

<a id="animated-demos-1"></a>

### Demo animate

<div class="data-table">

| Demo | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 22 sparkline live, un grafico intraday, order book, tape | 120 | 2,7–3,7 ms | 33–36% | 18–22% |
| Canvas: un indicatore, un orologio, una matrice di punti | 119–120 | 0,6–0,7 ms | 4–7% | 0% |
| Animations: tre loop nativi, spring, sequenze | 119–120 | 0,3–1,6 ms | 5–8% | 0% |

</div>

In Stocks il tempo del main thread per frame è di ~1,6 ms di tick, dei quali ~0,45 ms servono a riprodurre le parti animate dei canvas; Core Animation disegna il resto di ciascun canvas sui propri thread.

<a id="every-page-1"></a>

### Ogni pagina

Ogni pagina della gallery, all'apertura e mentre il test la fa scorrere, nella stessa finestra da 1200 × 800. Come su Linux, *FPS* è la frequenza mentre qualcosa si muove (un frame per ogni intervallo mediano tra i frame disegnati); a 120 del display, ogni frame di un'animazione o di uno scorrimento arriva un refresh dopo il precedente. *Oltre un refresh* è la quota di frame che hanno impiegato più di un refresh (8,3 ms). Una pagina a riposo non disegna alcun frame e usa il 2–5% di CPU. GIF e WebP di Images vengono riprodotti in Core Animation e il video in AVFoundation, ai rispettivi frame rate.

<div class="data-table">

| Pagina | Origine dei frame | FPS | Frame p95 | Oltre un refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Dati live, loop nativi | 120 | 3,2 ms | 0% | 35% |
| Stocks, scorrimento | Dati live, scorrimento | 120 | 3,5 ms | 0% | 36% |
| AI Chat, scorrimento | Scorrimento | 120 | 2,4 ms | 1% | 5% |
| Photos, scorrimento | Scorrimento | 120 | 1,4 ms | 0% | 10% |
| Lists, scorrimento | Scorrimento | 120 | 1,6 ms | 0% | 8% |
| Scrolling, scorrimento | Scorrimento | 120 | 2,7 ms | 0% | 6% |
| Navigation, scorrimento | Scorrimento | 120 | 0,2 ms | 0% | 4% |
| Form, scorrimento | Scorrimento | 120 | 0,6 ms | 0% | 5% |
| Resizable, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 4% |
| Dock, scorrimento | Scorrimento | 120 | 0,3 ms | 1% | 5% |
| Gestures | Spring, un anello pulsante | 120 | 0,4 ms | 0% | 4% |
| Physics, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 4% |
| Animations | Loop nativi | 120 | 0,3 ms | 0% | 5% |
| Canvas, scorrimento | Scorrimento, loop nativi | 120 | 1,2 ms | 0% | 7% |
| Styles, scorrimento | Scorrimento, una trasformazione oscillante | 120 | 1,0 ms | 0% | 6% |
| Tailwind | Utility `animate-*` | 120 | 0,5 ms | 0% | 4% |
| Text, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 5% |
| Text View, scorrimento | Scorrimento | 120 | 0,7 ms | 0% | 5% |
| Images, scorrimento | Scorrimento | 120 | 0,4 ms | 0% | 5% |
| Components, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 5% |
| Overlays, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 4% |
| Menus, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 5% |
| Controls | Transizioni | 120 | 0,3 ms | 0% | 4% |
| Web and video, scorrimento | Scorrimento | 120 | 0,2 ms | 0% | 6% |
| System | `requestAnimationFrame`, timer | 120 | 0,2 ms | 0% | 3% |
| Standard APIs, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 5% |
| Storage, scorrimento | Scorrimento | 120 | 0,3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### Memoria

A riposo, 3 s dopo l'avvio (runner release). *Footprint* è la memoria che macOS addebita al processo (quella mostrata da Activity Monitor); *resident* aggiunge le pagine delle librerie condivise di sistema:

<div class="data-table">

| App | Finestra | Footprint | Resident (RSS) |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | 1200 × 800 | ~19 MB | ~86 MB |
| Counter TSX (`examples/counter`) | 1200 × 800 | ~20 MB | ~89 MB |
| Finestra AppKit con una sola label, come riferimento | 480 × 640 | ~17 MB | ~80 MB |

</div>

Durante il tour della gallery il processo occupa 84–230 MB fino alla pagina Canvas e ~350–360 MB dalla pagina Text View in poi, con ciò che mette in cache di proposito (immagini decodificate, limitate a 128 MB; i documenti della pagina Text View) e i framework che carica al primo utilizzo (WebKit per le web view); i raster della pagina Canvas, fino a ~310 MB con tutti e tre i canvas a schermo, vengono rilasciati alla chiusura della pagina.
<a id="app-size-1"></a>

### Dimensione dell'app

Le app hello world create da `nsh init` con ciascun template, così come le compila `nsh package --target macos` per Apple
silicon (arm64), con link-time optimization e strip come su Linux, e le due app sopra così come vengono distribuite per Apple
silicon. L'eseguibile è il runner all'interno di `.app`; lo zip è `.app` compresso (`ditto -c -k`):

<div class="data-table">

| App | Scritta in | Eseguibile | Zip `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12,4 MB | 6,0 MB |
| Hello world (`--template ts`) | TSX, su QuickJS | 19,8 MB | 9,5 MB |
| Hello world (`--template mixed`) | TSX e un crate Rust | 19,8 MB | 9,5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21,6 MB | 8,4 MB (`.tar.gz` della sua release) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18,4 MB | 9,7 MB (`.tar.gz` della sua release) |

</div>

Cosa determina questi numeri:

- **Frame solo per le modifiche**: il display link scatta mentre è in corso un'animazione nativa e si ferma insieme a essa; un'animazione
  si ferma con la sua pagina (l'eliminazione della sua vista termina i suoi keyframe, un loop si ferma nel `cleanup` del suo componente).
- **Canvas disegnati dove costano meno**: un canvas che si ridisegna spesso (un'animazione, dati live) disegna sui thread di Core
  Animation (`drawsAsynchronously`), il che lascia libero il thread principale; uno ridisegnato solo ogni tanto disegna
  subito, senza la memoria grafica che trattiene il disegno asincrono. Un valore animato ridisegna solo l'area coperta dalle
  operazioni che lo leggono.
- **Parti statiche del canvas conservate**: quando un disegno rimane invariato, una lunga parte che precede la prima operazione animata viene
  conservata come layer; a ogni frame si disegna quel layer e si riesegue solo il resto animato, subito sul thread principale (il
  gauge, l'orologio e la matrice di punti della pagina Canvas: nessun lavoro per la GPU e metà della memoria).
- **Contenuto disegnato quando cambia**: testi e canvas disegnano in layer propri, di nuovo quando cambiano il contenuto o la
  dimensione, non quando si spostano o scorrono.

## Windows (Win32, Direct2D)

Misurato su un desktop Windows 11 (Intel Core i7-13700KF, 32 GB, NVIDIA GeForce RTX 3060 Ti) con display 4K a 144 Hz al
150%, build release, la gallery in una finestra 1200 × 800 (1800 × 1200 pixel), ogni lettura acquisita automaticamente da
`examples/gallery/tools/perf.py` (`nsh test --target windows --fps`, una riga al secondo; la CPU è quella dell'intero processo, in
percentuale di un core). Le fasi sono quelle del thread principale per frame: *paint* (Direct2D che disegna la finestra) e, al suo
interno, *canvas* (registrazione e riesecuzione dei disegni).

<a id="animated-demos-2"></a>

### Demo animate

<div class="data-table">

| Demo | FPS | Frame p95 | Paint / canvas per frame | CPU |
|---|---|---|---|---|
| Stocks: 22 sparkline live, un grafico intraday, order book, tape | 144 | 3,7–4,3 ms | 1,4 / 0,13 ms | 36–43% |
| Canvas: un gauge, un orologio, una matrice di punti | 144 | 1,0–2,0 ms | 0,8–1,4 / 0,05 ms | 21–35% |
| Animations: tre loop nativi, spring, sequenze | 144 | 1,0–3,6 ms | 0,9–1,9 ms | 20–41% |

</div>

Stocks esegue 16–17 commit al secondo, ciascuno in al massimo 2,1 ms di JS e 1,7 ms del core sul thread del motore (p95).

> [!NOTE]
> Le pagine le cui animazioni spostano viste su aree ampie consumano qui più CPU che su Linux e macOS (Animations 20–41%
> contro 5–13%, Gestures 36% contro 1–5%). Un frame su Windows ridisegna, con Direct2D sul thread principale, ogni vista
> sulle aree che sono cambiate: un anello che si ingrandisce ridisegna la card sottostante a ogni frame. Su macOS Core Animation
> sposta, scala e dissolve sulla GPU i layer che conserva senza ridisegnarli, e su Linux GSK conserva i
> render node di ciò che non è cambiato. I numeri inoltre includono 144 frame al secondo a 1800 × 1200 pixel.

<a id="every-page-2"></a>

### Ogni pagina

Ogni pagina della gallery, all'apertura e mentre il test la scorre, nella stessa finestra 1200 × 800. Come su Linux e
macOS, *FPS* è la frequenza mentre qualcosa si muove (un frame per ogni intervallo mediano tra frame disegnati); ai 144 del display,
ogni frame di un'animazione o di uno scorrimento arriva un refresh dopo il precedente. *Oltre un refresh* è la quota di frame
che hanno impiegato più di un refresh (6,9 ms). Una pagina a riposo non disegna alcun frame e usa 0–2% di CPU. Le GIF e le WebP di Images vengono riprodotte
al proprio frame rate (circa 40 FPS qui). Physics, Overlays, Menus e Storage sono misurate in una finestra 900 × 500,
dove hanno spazio per scorrere.

<div class="data-table">

| Pagina | Origine dei frame | FPS | Frame p95 | Oltre un refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Dati live, loop nativi | 144 | 3,9 ms | 0% | 36% |
| Stocks, scorrimento | Dati live, scorrimento | 144 | 4,3 ms | 0% | 43% |
| Photos, scorrimento | Scorrimento | 143 | 2,1 ms | 0% | 9% |
| Lists, scorrimento | Scorrimento | 144 | 2,0 ms | 1% | 19% |
| Scrolling, scorrimento | Scorrimento | 143 | 2,1 ms | 0% | 7% |
| Navigation, scorrimento | Scorrimento | 144 | 0,8 ms | 0% | 9% |
| Form, scorrimento | Scorrimento | 144 | 0,8 ms | 0% | 12% |
| Resizable, scorrimento | Scorrimento | 143 | 0,4 ms | 0% | 4% |
| Dock, scorrimento | Scorrimento | 144 | 0,5 ms | 1% | 5% |
| Gestures | Spring, un anello pulsante | 144 | 1,8 ms | 0% | 36% |
| Physics, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 0,8 ms | 0% | 4% |
| Animations | Loop nativi | 144 | 1,0 ms | 0% | 28% |
| Canvas, scorrimento | Scorrimento, loop nativi | 144 | 2,0 ms | 0% | 35% |
| Styles, scorrimento | Scorrimento, una trasformazione oscillante | 144 | 2,1 ms | 0% | 39% |
| Tailwind | Utility `animate-*` | 144 | 0,6 ms | 0% | 19% |
| Text, scorrimento | Scorrimento | 144 | 1,6 ms | 0% | 8% |
| Text View, scorrimento | Scorrimento | 144 | 1,1 ms | 0% | 10% |
| Images, scorrimento | Scorrimento, frame GIF e WebP | 143 | 4,8 ms | 2% | 23% |
| Components, scorrimento | Scorrimento | 144 | 1,0 ms | 1% | 11% |
| Overlays, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 0,6 ms | 0% | 1% |
| Menus, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 0,6 ms | 0% | 2% |
| Controls | Transizioni | 117–144 | 1,5 ms | 0% | 22% |
| Web and video, scorrimento | Scorrimento | 144 | 1,6 ms | 0% | 15% |
| System | `requestAnimationFrame`, timer | 144 | < 0,1 ms | 0% | 1% |
| Storage, scorrimento | Scorrimento (finestra 900 × 500) | 144 | 0,5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### Memoria

A riposo, 3 s dopo l'avvio (runner release, finestra 1200 × 800). *Private working set* è la memoria che il processo
usa da solo (la colonna Memoria di Task Manager); *private bytes* quella che ha riservato (committed); *working set* aggiunge le pagine delle
librerie di sistema che condivide con altri processi (Direct3D, Direct2D, DirectWrite, il driver della GPU):

<div class="data-table">

| App | Private working set | Private bytes | Working set |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| Contatore TSX (`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

Durante il tour della gallery il working set è di ~108–115 MB su Stocks, ~230 MB dalla pagina Canvas, ~320–340 MB dalla
pagina Text View e ~390–405 MB una volta che Web and video ha aperto WebView2 (le cui pagine girano nei processi propri di WebView2),
compresa la memoria che mantiene in cache di proposito (immagini decodificate, limitate a 128 MB; i documenti della pagina Text View).

<a id="app-size-2"></a>

### Dimensione dell'app

Le app hello world create da `nsh init` con ciascun template, così come le compila `nsh package --target windows` per x86_64
(i runner Rust con link-time optimization e strip, come su Linux). L'eseguibile è `<Name>.exe` dell'app;
lo zip è `.zip` scritto accanto alla sua directory:

<div class="data-table">

| App | Scritta in | Eseguibile | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15,0 MB | 6,7 MB |
| Hello world (`--template ts`) | TSX, su QuickJS | 28,6 MB | 12,4 MB |
| Hello world (`--template mixed`) | TSX e un crate Rust | 26,3 MB | 11,5 MB |

</div>

Cosa determina questi numeri:

- **Frame solo per le modifiche, disegnati solo dove sono cambiate**: il ticker sincronizzato con il compositor resta attivo finché è in corso un'animazione
  nativa, una transizione o una callback di frame. Un frame disegna le aree delle viste che sono cambiate (dove
  erano e dove sono), sopra i pixel che la finestra conserva, e presenta al compositor solo quelle (Stocks:
  ~34 viste a frame).
- **I canvas registrano la loro parte animata**: un disegno viene registrato come command list di Direct2D, vettoriale e nitido a qualsiasi
  scala. Quando un valore animato cambia, vengono registrate di nuovo solo le operazioni a partire dalla prima che legge un valore animato;
  ciò che la precede viene conservato (Stocks: ~26 ms di registrazione al secondo per 22 sparkline pulsanti e il
  grafico).
- **Si disegna solo ciò che si vede**: i figli di una scroll view o di una vista con clipping che si trovano fuori dalla vista vengono esclusi dal
  frame, e le viste senza contenuto proprio disegnano solo lo sfondo e il bordo.

## iOS (UIKit)

Misurato nel simulatore iOS (un iPhone 18 Pro Max, sul MacBook Pro sopra), build release, con lo stesso tour
(`perf.py --target ios`: `nsh test --target ios --fps`, i tocchi di un dito così come li riceve UIKit). Il simulatore presenta
a 60 Hz; su un iPhone con schermo ProMotion i display link di NSH girano a 120 Hz, la frequenza dello schermo (le app che `nsh package`
compila e l'host di sviluppo la richiedono con `CADisableMinimumFrameDurationOnPhone`). Le fasi sono *tick* (animazioni
native), *drain* (applicazione dei batch del motore) e *scroll* (ciò che segue una scroll view: liste, celle sticky,
valori associati).

<div class="data-table">

| Pagina | Origine dei frame | FPS | Frame p95 | CPU |
|---|---|---|---|---|
| Home, scorrimento | Scorrimento | 60 | 0,1 ms | 6% |
| Stocks | Dati live, loop nativi | 60 | 0,3 ms | 22% |
| Stocks, scorrimento | Dati live, scorrimento | 60 | 0,3 ms | 25% |
| Photos, scorrimento | Scorrimento | 60 | 1,2 ms | 6% |
| Lists, scorrimento | Scorrimento | 60 | 1,1 ms | 8% |
| Scrolling, scorrimento | Scorrimento | 60 | 0,1 ms | 7% |
| Navigation, scorrimento | Scorrimento | 60 | 0,2 ms | 7% |
| Form, scorrimento | Scorrimento | 60 | 0,3 ms | 7% |
| Gestures | Spring, un anello pulsante | 60 | 0,3 ms | 3% |
| Animations | Loop nativi | 60 | 0,7 ms | 6% |
| Canvas | Loop nativi | 60 | 0,4 ms | 16% |
| Styles | Una trasformazione oscillante | 60 | 0,4 ms | 4% |
| Tailwind, scorrimento | Scorrimento | 60 | 0,2 ms | 7% |
| Text, scorrimento | Scorrimento | 60 | 0,1 ms | 7% |
| Text View, scorrimento | Scorrimento | 60 | 0,1 ms | 6% |
| Images, scorrimento | Scorrimento | 60 | 0,1 ms | 5% |
| Components, scorrimento | Scorrimento | 60 | 0,2 ms | 6% |
| Overlays, scorrimento | Scorrimento | 60 | 0,1 ms | 6% |
| Menus, scorrimento | Scorrimento | 60 | 0,2 ms | 7% |
| Controls, scorrimento | Scorrimento, transizioni | 60 | 0,2 ms | 5% |
| Web and video, scorrimento | Scorrimento | 60 | 0,1 ms | 8% |
| System | `requestAnimationFrame`, timer | 60 | 0,3 ms | 4% |
| Standard APIs, scorrimento | Scorrimento | 60 | 0,1 ms | 7% |
| Storage, scorrimento | Scorrimento | 60 | 0,1 ms | 8% |

</div>

*FPS* è la frequenza mentre qualcosa si muove, come sopra: ai 60 del simulatore, ogni frame arriva un refresh dopo il
precedente. Ogni pagina in cui nulla si muove non disegna alcun frame e usa 1–2% di CPU a riposo. Il processo occupa 40 MB sulla
home page della gallery e ~180 MB dopo l'intero tour (immagini in cache di proposito, i documenti della pagina Text View).

Su un iPhone 17 Pro (ProMotion, 120 Hz), con l'host di sviluppo e una demo sullo schermo, le pagine animate
disegnano a ogni refresh:

<div class="data-table">

| Pagina | Origine dei frame | FPS | Frame p95 | Oltre un refresh | CPU | Memoria |
|---|---|---|---|---|---|---|
| Stocks | Dati live, loop nativi | 120 | 0,2–0,3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | Loop nativi | 120 | 0,1 ms | 0% | 25–36% | 37–38 MB |
| Animations | Loop nativi | 120 | 0,2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks esegue 20 commit al secondo (un tick ogni 50 ms), ciascuno in 1,5 ms di JS e 1,4 ms del core sul thread
del motore (p95 2,2 e 2,0 ms), che risulta occupato per il 4–6% del tempo.

<a id="measuring-an-app"></a>

## Misurare un'app

Per misurare un'app allo stesso modo, esegui i suoi test o i suoi step con `--fps` e `-v` su `--target linux`, `macos`, `windows` o `ios`:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
