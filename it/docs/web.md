---
title: "Web"
description: "Crea app web in Rust o TSX con componenti Native Shell renderizzati come HTML e CSS, sviluppa nel browser e pubblica su qualsiasi host statico o CDN."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# Web

Crea app web con Native Shell usando gli stessi componenti, stili e logica applicativa delle piattaforme native. NSH renderizza l'interfaccia come elementi HTML e CSS: testo, immagini, input, scorrimento, stili visivi e interazioni usano il DOM e le API web del browser.

`nsh package --target web` pubblica l'app come sito statico per qualsiasi web server o CDN ([Pubblicare un'app](#publish-an-app)), e `nsh run --target web` la esegue nel browser mentre la modifichi ([Sviluppare nel browser](#develop-in-the-browser)). Ogni demo dal vivo di questo sito usa questo backend web.

Le app TSX pubblicate usano il motore JavaScript del browser. Il packaging collega a ogni app il proprio runtime, che contiene solo i componenti `nsh/base` e i moduli standard che l'app importa: un'app costruita con i componenti core scarica circa 1,1 MB. I dati per l'evidenziazione della sintassi vengono caricati la prima volta che il codice viene evidenziato.

<a id="what-runs-where"></a>

## Cosa viene eseguito e dove

La pagina è costruita con elementi HTML stilizzati con CSS. NSH trasforma gli aggiornamenti dei componenti in batch di modifiche al DOM, mentre il browser mostra l'interfaccia e gestisce scorrimento, selezione del testo e input. WebAssembly ospita il motore Rust condiviso per stato dei componenti, layout e aggiornamenti: con il crate di un'app Rust compilato al suo interno, oppure accanto al motore JavaScript del browser, che esegue il codice di un'app TSX come moduli ES: app pubblicate, pagina del dev server, demo di questo sito e playground allo stesso modo.

Su ogni piattaforma nativa il motore ha un proprio thread e passa un `MountBatch` per ogni commit al thread principale. Una pagina del browser ha un solo thread, quindi la build web pilota lo stesso motore passo dopo passo dal ciclo di eventi della pagina (`nsh_engine::LocalEngine`):

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **Il layout è del core.** Ogni vista è un elemento posizionato in modo assoluto nel frame calcolato da Taffy, quindi flexbox, grid, `aspectRatio` e percentuali si comportano esattamente come sui dispositivi. Il layout del browser non è coinvolto.
- **Gli stili vengono trasformati in CSS in Rust.** Sfondo, bordi, raggi, ombre (`boxShadow`, `textShadow`), gradienti, filtri, `backdropFilter`, trasformazioni, `transformOrigin`, `outline`, `mixBlendMode`, transizioni e animazioni keyframe integrate diventano proprietà CSS. Le classi Tailwind, gli stati `active:`, `hover:` e `focus:` e `dark:` vengono tutti risolti in modo nativo, come sui dispositivi.
- **Il testo viene impaginato in Rust** con le misure dei font fornite dal browser (`CanvasRenderingContext2D.measureText`) e disegnato run per run nelle posizioni scelte dal layout, quindi ciò che è stato misurato è ciò che viene disegnato. Le righe vanno a capo dopo gli spazi, attorno ai caratteri CJK e in corrispondenza di `\n`; `numberOfLines` tronca con i puntini di sospensione.
- **Le animazioni native vengono eseguite in Rust** su `requestAnimationFrame`: temporizzazione `Animated`, spring e decay, `interpolate`, valori animati collegati a `opacity`, `translate`, `rotate`, `scale`, i passi di `transform` e `backgroundColor`, trascinamenti collegati con `pan`, valori legati allo scorrimento e argomenti del canvas. JS non interviene a ogni frame, come sui dispositivi. `LayoutAnimation`, le transizioni di stile, i keyframe `animate-*` e le transizioni di schermata si muovono come nei backend desktop, e `prefers-reduced-motion` le disattiva (le schermate sfumano).
- **Input:** pressioni con feedback `activeStyle` / `active:` e pressioni lunghe, il sistema responder (`onTouch*`, `PanResponder`), trascinamenti nativi e pinch e rotazione a due dita, scroll view (lo scorrimento del browser), pull to refresh, scroll view con zoom (pinch, ctrl+rotellina e pinch del touchpad, `zoomTo`), `<Input>` con valori controllati, focus e submit, `Canvas`, `NavStack` e `NavPage` con `header` della pagina, `Dialog`.
- **L'interfaccia di sistema è disegnata nella pagina:** `AlertDialog` ha l'aspetto delle finestre di dialogo dei backend desktop nei browser desktop e quello di iOS sui telefoni (con l'idioma `desktop`, vedi sotto). I font personalizzati vengono misurati di nuovo non appena il browser li ha caricati, e un'app attende i font che importa prima di mostrare il primo frame.
- **I dialoghi** sono un livello sopra l'intera app che mostra il popup e lo sfondo dell'app, come nei backend desktop. Escape, il pulsante indietro del browser e una pressione sullo sfondo li chiudono (`closeOnEscape`, `closeOnBackdropPress`), e `animation`, `onOpen`, `onClose`, `onCancel` e `onOpenChange` funzionano come sui dispositivi. Una pagina che [incorpora l'app](#embed-it-in-a-page) in una parte del proprio layout può invece mostrare dialoghi e alert sopra l'intera finestra del browser (`dialogs: "viewport"`), come iOS e Android li mostrano sopra l'intero schermo.

<a id="keyboard-mouse-and-touch"></a>

## Tastiera, mouse e touch

Le app pubblicate si comportano come app desktop nei browser desktop e come app per telefono nei browser dei telefoni:

- **Rotelline e touchpad** fanno scorrere la scroll view più interna lungo il loro asse che può ancora muoversi (una rotellina verticale fa scorrere una lista orizzontale quando nulla può scorrere in verticale) e restano su di essa fino al termine dello scorrimento; i passi della rotellina scivolano, le viste con paginazione e snapping si spostano di una pagina per scorrimento. Ctrl + rotellina e i pinch del touchpad eseguono il pinch sulle viste con valori di pinch nativi invece di ingrandire la pagina. Trascinare con il mouse non fa scorrere, come sulle piattaforme desktop: i trascinamenti del mouse vanno ai pan, al sistema responder e alla selezione del testo. Le scroll view riportano `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End` e `onScrollEnd` come sulle piattaforme desktop.
- **Tastiera**: Tab e Shift+Tab spostano il focus tra pressable e input (gli stili `focus:` dell'app mostrano il focus da tastiera); Invio preme il pressable con il focus, Spazio lo preme al rilascio; le frecce, Page Up / Page Down, Spazio, Home e End fanno scorrere la scroll view attorno al focus o sotto il mouse; Escape esce da un campo, chiude il dialogo, poi torna indietro. Le scorciatoie `keymap` funzionano nel browser, associate sul momento (`mod` è Command in Safari e Chrome su Mac, Control altrove).
- **Tornare indietro**: Escape, Alt+Sinistra (Cmd+[ su Mac) e il pulsante indietro del mouse chiudono il dialogo più recente o rimuovono lo stack più interno, come fa il pulsante indietro di Android; `popOnBack` e `onBackPress` funzionano come lì. Quando l'app occupa l'intera pagina, ogni pagina inserita e ogni dialogo aperto è una voce della cronologia del browser, quindi il pulsante indietro del browser torna indietro nell'app.
- **Touch**: solo le scroll view eseguono il pan; la pagina stessa non scorre, non si ingrandisce e non esegue il pull to refresh sotto l'app, e i tap non hanno ritardo. In un iframe, gli swipe che l'app non gestisce fanno scorrere la pagina che la incorpora. I trascinamenti sulle viste con pan nativi, pinch e sistema responder appartengono all'app.
- **Accessibilità**: `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion` e `accessibilityElementsHidden` diventano ARIA; `announce` parla tramite una live region e `setAccessibilityFocus` sposta il focus. Le viste sotto un dialogo o un alert sono inerti.
- **Selezione e menu**: nei browser desktop il testo è selezionabile per impostazione predefinita, come in una pagina web, tranne all'interno di elementi interattivi (viste con gestori di pressione o touch: pulsanti, righe pressable, tab) e nel testo con `userSelect: "none"` o `select-none`; trascinando il mouse sul testo lo si seleziona, Ctrl/Cmd+C lo copia riga per riga e Ctrl/Cmd+A seleziona tutto il testo in cui si trova la selezione. Nei browser di telefoni e tablet è selezionabile solo il testo con `userSelect: "text"`, come nelle app native. Il menu contestuale del browser compare solo nel testo selezionabile e negli input.

<a id="apps-with-rust-components"></a>

## App con componenti Rust

Un'app scritta in Rust ([Sviluppare con Rust](./rust.md)) viene pubblicata ed eseguita nel browser dalla propria directory:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

Quando `nsh.json` indica il componente radice dell'app (`"root"`), la pagina è costituita dal Rust dell'app e dallo script di pagina di NSH, e nient'altro: `nsh.wasm` contiene il motore, i componenti e il crate dell'app, il sito non ha `app.js`, e la pagina monta la radice non appena il runtime e i font sono pronti. L'intera galleria Rust pesa 3,3 MB (1,06 MB con gzip, 0,75 MB con brotli), meno del runtime delle app TSX. Con la sua entry TSX (`nsh package App.tsx --target web`), la stessa app viene eseguita come le app TSX, nel motore JavaScript del browser, e importa i componenti e i moduli del crate.

In entrambi i casi gli asset del crate (`assets!()`) vengono pubblicati insieme a quelli dell'app, e i suoi font vengono caricati prima del primo frame. Durante `nsh run --target web`, una modifica al codice Rust del crate ricompila il runtime e la pagina aperta lo carica da sola; le modifiche TSX restano hot update. Il runtime di sviluppo viene compilato in modo incrementale, quindi una modifica al crate è pronta in circa un secondo; `nsh package` compila quello pubblicato ottimizzato per le dimensioni.

Il codice Rust che gira su ogni piattaforma, web inclusa, usa i servizi del motore: `fetch(url).await` effettua richieste HTTP attraverso lo stesso stack di rete del `fetch` di JS (qui quello del browser, con le sue regole CORS); `timer`, `set_timeout` e `set_interval` attendono; e `nsh_core::time::Instant` e `nsh_core::time::unix_ms()` leggono l'orologio. `background` e `blocking` eseguono il lavoro sui thread dei target nativi.

La build richiede il target Rust e un clang che compili in WebAssembly, come la build del runtime stesso: `rustup target add wasm32-unknown-unknown`, più `clang` e `llvm-ar` (su macOS, una toolchain LLVM come `llvm` di Homebrew, tramite `CC_wasm32_unknown_unknown` e `AR_wasm32_unknown_unknown`).

<a id="browser-apis-from-rust"></a>

### API del browser da Rust

Un crate può chiamare le API proprie del browser tramite [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) e i suoi crate `web-sys` e `js-sys`, dietro `#[cfg(target_arch = "wasm32")]`: un WebSocket, `IndexedDB`, gli appunti, qualsiasi API Web, e JS proprio del crate (`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`). Quando il runtime web dell'app chiama JS in questo modo (comprese le conversioni `JsValue`), `nsh` esegue su di esso la CLI `wasm-bindgen` e distribuisce il suo glue e il JS del crate accanto al runtime, sia in sviluppo sia nei siti pubblicati. La versione della CLI è quella del crate `wasm-bindgen` a cui il runtime si collega, che `nsh` indica: `cargo install wasm-bindgen-cli --version <version> --locked` la installa (`NSH_WASM_BINDGEN` indica una CLI in una posizione diversa da `PATH`). Un runtime che si collega a wasm-bindgen ma non chiama alcun JS tramite esso (attraverso le feature predefinite di una dipendenza) viene compilato come ogni altro runtime.

Il crate indica le API che usa come feature di `web-sys`, e fissare `wasm-bindgen` mantiene invariata la sua versione, e quindi quella della CLI, da una build all'altra:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

I callback del browser (l'arrivo di un messaggio, un timer della pagina) svegliano i task dell'app, che vengono eseguiti subito:

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

Le chiamate di un crate alle API del browser vengono eseguite con i permessi propri della pagina, come il codice nativo di un crate viene eseguito con quelli dell'app sulle altre piattaforme: le capability di `nsh.json` regolano ciò che passa attraverso il motore (`fetch`, il JS dell'app), e le regole del browser (CORS, la Content-Security-Policy della pagina) regolano ogni richiesta effettuata dalla pagina.

<a id="publish-an-app"></a>

## Pubblicare un'app

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` scrive `.nsh/out/<Name>/` (`--out` per un'altra directory), organizzato come una build frontend: una pagina e file con nomi derivati dal loro contenuto.

| File | Cos'è |
|---|---|
| `index.html` | La pagina dell'app: il suo nome come titolo, le icone, i colori del suo `appearance`, un indicatore di caricamento e un messaggio quando l'app non riesce a caricarsi o ad avviarsi |
| `manifest.webmanifest` | Il nome, l'id, le icone e i colori con cui i browser installano l'app |
| `nsh.<digest>.js` | Il runtime DOM, minificato (79 KB, 22,5 KB con brotli) |
| `nsh.<digest>.wasm` | Il motore Rust, il layout e i componenti, più il crate di un'app Rust. TSX viene eseguito nel JavaScript del browser; il packaging lo collega solo con i componenti e i moduli standard importati dalla prima schermata dell'app. |
| `nsh-<name>.<digest>.wasm` | Componenti, moduli standard e shader che l'app usa oltre la prima schermata: scaricati in background dopo che questa è comparsa |
| `<file>.br`, `<file>.gz` | Ogni file compresso in anticipo, per gli host che inviano file precompressi |
| `nsh-syntaxes.<digest>.bin` | Le sintassi con cui viene evidenziato il codice (il set di bat: 0,92 MB, 0,8 MB con brotli), scaricate la prima volta che un blocco di codice, un `Editor` o un `DiffView` mostra codice in un linguaggio |
| `nsh-bindgen.<digest>.js` | Il glue wasm-bindgen di un'app i cui crate chiamano le [API del browser da Rust](#browser-apis-from-rust), minificato |
| `snippets.<digest>/<crate>-<hash>/…` | Il JS di quei crate che il glue importa (`inline_js`, `module = "/js/…"`), sotto i percorsi assegnati da wasm-bindgen |
| `app.<digest>.js` | L'entry TSX compilata come modulo ES, caricata dal browser. |
| `host.<digest>.js` | L'host della pagina, `nsh.json` `web.host` ([le funzioni dell'host](#the-hosts-functions)) |
| `<name>.<digest>.js` | Moduli ES caricati su richiesta da `import()`. |
| `assets/<path>.<digest>.<ext>` | Ogni asset che l'app importa, caricato dal suo URL quando viene usato (i font prima del codice che li registra, poiché il testo viene misurato con essi: prima che l'app si avvii, o insieme al chunk che li importa) |
| `icons/<size>.<digest>.png` | L'icona di `nsh.json` a 32 (favicon), 180 (`apple-touch-icon`), 192 e 512 pixel |

`<digest>` è l'inizio dello SHA-256 del contenuto del file: il nome di un file cambia esattamente quando cambia il suo contenuto, quindi una nuova release cambia solo `index.html` e i file che sono realmente cambiati. Tutto usa URL relativi, quindi il sito funziona da qualsiasi directory di qualsiasi host (`https://example.com/apps/counter/`).
<a id="runtime-size"></a>

### Dimensione del runtime

Il packaging collega a ogni app il proprio `nsh.<digest>.wasm`, che contiene il motore e i componenti `nsh/base`, i moduli standard e gli shader che la prima schermata dell'app importa. Ciò che le altre schermate dell'app importano viene scaricato in background non appena la prima schermata è visibile. Un'app i cui crate chiamano le [API del browser da Rust](#browser-apis-from-rust) ottiene l'intero runtime, compresi i suoi crate, nel proprio `nsh.<digest>.wasm`. Misurato con `nsh package --target web` (MB = 10^6 byte):

| App | Usa | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | I componenti di base | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | Ogni componente, `zlib` e shader | 4.13 MB | 1.36 MB | 1.01 MB |

<a id="deploy-it"></a>

### Distribuirlo

Carica la directory su qualsiasi host statico: un object store dietro una CDN, Cloudflare Pages, Netlify, GitHub Pages, nginx. Due regole lo rendono veloce da caricare e affidabile negli aggiornamenti:

| File | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (rivalidato a ogni caricamento, così una release compare subito) |
| tutto il resto | `public, max-age=31536000, immutable` |

Servi `.wasm` come `application/wasm` (i browser lo compilano mentre viene scaricato) e invia le copie precompresse ai browser che le accettano: `brotli_static on; gzip_static on;` di nginx, `file_server { precompressed br gzip }` di Caddy, oppure una CDN che comprime con Brotli. Con Brotli il runtime è circa un quarto più piccolo rispetto a gzip. `nsh package --target web --run` serve il sito in questo modo su `http://127.0.0.1:4173/`.

Un'app pubblicata per il web gira come un'app nativa pacchettizzata: come release, con le capability dichiarate dal suo `nsh.json` ([Sandbox e capability](./sandbox-and-capabilities.md)), cioè un'app TSX sul motore JavaScript del browser. Quando queste limitano `network`, la pagina include anche una Content-Security-Policy `connect-src` con gli host dichiarati (e l'origine della pagina stessa), così il browser stesso rifiuta richieste e salti di redirect verso qualsiasi altro host. Un errore che ne impedisce l'avvio viene mostrato nella pagina; gli errori successivi vanno nella console del browser.

<a id="embed-it-with-an-iframe"></a>

### Incorporarlo con un iframe

Sul web non esiste un'API di incorporamento: incorpora l'app pubblicata con un `<iframe>`. La sua dimensione è la finestra dell'app:

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## Sviluppare nel browser

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

avvia il server di sviluppo e stampa l'indirizzo della sua pagina, `http://127.0.0.1:8790/`: aprilo in qualsiasi browser. La pagina è un host di sviluppo come gli altri: esegue ogni build dell'app, mostra gli errori di build e di runtime sopra l'app e invia i log dell'app al terminale. Una modifica al crate di un'app Rust ricostruisce il suo runtime e la pagina aperta lo carica da sola; le modifiche TSX vengono applicate sul posto (hot update). I telefoni sulla stessa rete aprono l'indirizzo che `nsh run` stampa sotto (`on this network: http://192.168.…:8790/`). `nsh dev` serve la stessa pagina quando il runtime web è presente (nella distribuzione, sempre).

<a id="build-the-websites-player"></a>

## Compilare il player del sito web

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

La directory di output contiene:

| File | Cos'è |
|---|---|
| `gallery/nsh.<digest>.wasm` | Il runtime della gallery, collegato per essa da `nsh package` (usa ogni componente e `zlib`: circa 11.8 MB, 3.6 MB con gzip) |
| `gallery/nsh-syntaxes.<digest>.bin` | Le sintassi con cui il runtime evidenzia il codice, scaricate la prima volta che una demo mostra codice in un linguaggio |
| `nsh-playground.wasm` | Lo stesso più il compilatore TSX di NSH, per il [playground](#the-playground) (circa 8 MB, 2.4 MB con gzip) |
| `gallery/nsh.<digest>.js` | Il runtime DOM (minificato): carica il wasm, applica i batch, trasforma l'input in eventi |
| `index.html` | Una pagina player: esegue `demos/<name>.js` per `#<name>` |
| `nsh.wasm`, `nsh.js`, `browser/` | Il runtime che il player carica: il motore, il runtime DOM e i moduli dell'host del browser |
| `demos/<name>.js` | Ogni demo compilata da `nsh build --release`: un modulo ES |
| `gallery/` | L'app della gallery pubblicata con `nsh package --target web`, mostrata nella pagina [Gallery](/gallery) |

Servi la directory con qualsiasi server statico (serve il tipo MIME `application/wasm` per la compilazione in streaming) e apri `index.html#counter`.

<a id="the-playground"></a>

## Il playground

Il [Playground](/playground) modifica ed esegue un'app nel browser: la pagina compila il TSX con il compilatore JSX di NSH (integrato in `nsh-playground.wasm`, senza rolldown) e lo esegue sul motore JavaScript del browser a ogni pausa nella digitazione. Ogni demo di questo sito ha un link **Edit in Playground**, e **Share** inserisce il codice nel link stesso, così nulla viene memorizzato su un server.

Un'app del playground è un singolo modulo: importa i moduli di NSH (`nsh` e `nsh/*`) ma nessun altro file o pacchetto. L'output e gli errori di `console.log` compaiono sotto il telefono.

Il compilatore è anche una funzione Rust, `nsh_bundler::compile_module(name, source, ui_sets)`, disponibile senza la feature `bundle` del crate.

<a id="embed-it-in-a-page"></a>

## Incorporarlo in una pagina

Un'app Rust viene incorporata come sito pubblicato, in un [iframe](#embed-it-with-an-iframe). Per TSX, `nsh.js` è un modulo ES. `createPlayer` carica il runtime in un container; `runModule(url)` avvia un bundle che `nsh build` scrive (`bundle.js`, un modulo ES) sul motore JavaScript del browser, in un realm proprio dell'app, sostituendo ciò che era in esecuzione. Restituisce una promise che si risolve quando il modulo è stato caricato e viene rifiutata con l'errore che lo ha fermato, errore che anche il player segnala (`onError`):

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets` (una mappa da percorsi `asset:/` a URL) sostituisce `assetBase`, `readAsset(uri)` restituisce i byte di un asset di cui il motore ha bisogno subito (un font) oppure `null`, `data` associa i file che il runtime scarica quando ne ha bisogno la prima volta ai loro URL (`syntaxes`: `nsh-syntaxes.<digest>.bin`; per impostazione predefinita `nsh-<name>.bin` accanto a `nsh.js`), e `glue` è l'URL del glue wasm-bindgen di un runtime i cui crate chiamano le [API del browser da Rust](#browser-apis-from-rust) (`nsh-bindgen.<digest>.js`), che il player carica insieme al runtime; `player.runModule(url, { capabilities, appId })` esegue l'app con le capability che dichiara (il suo `capabilities.json`) e conserva il suo storage sotto il suo id `nsh.json` (senza id, sotto il percorso della pagina). La pagina che `nsh package --target web` scrive le usa tutte.

`runModule(url, { chunks })` accetta anche la posizione dei chunk di un [bundle suddiviso](#split-bundles).

`player.runSource(code, { name, sourceMap, capabilities, appId })` esegue un modulo ES fornito come testo sorgente, con le stesse opzioni. Con `nsh-playground.wasm`, `player.compileAndRun(tsx, name, options)` compila prima il TSX, lo esegue con le opzioni di `runSource` e restituisce l'errore di compilazione, oppure `null`; `player.compile(tsx)` restituisce `{ code }` oppure `{ error }`.

La dimensione del container è la finestra dell'app (`windowSize()`); ridimensionando il container si ridimensiona l'app. `player.setDark(true)` cambia l'aspetto a runtime, che le app osservano tramite `colorScheme()` e le classi `dark:`.

Dialog e alert coprono il container. Con `dialogs: "viewport"` coprono l'intera finestra del browser, come fanno i dialog modali di una pagina, mentre l'app mantiene il container come finestra: un `Dialog` viene disposto secondo la dimensione e la safe area della finestra e scorre dal suo bordo inferiore, il suo sfondo copre l'intera pagina e la rotellina del mouse sopra di esso lascia ferma la pagina. Il dialog appare nel top layer del browser (Chrome 114, Safari 17, Firefox 125 e successivi), quindi sta sopra il resto della pagina ovunque si trovi il container; nei browser precedenti copre il container.

`Sheet` segue la stessa impostazione di presentazione di `Dialog` e `AlertDialog`. In un iframe same-origin, la presentazione nel viewport copre automaticamente la pagina esterna, mentre l'app mantiene la sua dimensione di layout originale. L'iframe torna alla posizione e alla dimensione originali quando l'ultimo popup si chiude; il suo motore e il suo stato restano attivi. Le demo della documentazione abilitano questa presentazione.

Per un iframe cross-origin o in sandbox, la pagina che incorpora registra l'host prima di caricare il player:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

L'host accetta richieste dalla finestra di questo iframe, mantiene inerte la pagina circostante e blocca il suo scorrimento mentre un popup è visibile, e ripristina entrambi alla chiusura. Ogni confine di incorporamento cross-origin richiede la cooperazione del relativo host; senza di essa, la presentazione resta all'interno di quel documento e il player segnala un avviso.

<a id="the-hosts-functions"></a>

## Le funzioni dell'host

Sul web la pagina è l'host dell'app: risponde a `host.call(name, args)` di [`host`](../modules/nsh.md#host) e invia gli eventi che `host.on` ascolta. `host` di `createPlayer` è un oggetto il cui `call(name, args)` restituisce il risultato, o una promise di esso; un throw o un rifiuto rifiuta la chiamata dell'app con il messaggio dell'errore. `player.hostEvent(event, payload)` invia un evento con un payload JSON (un payload che non è JSON genera un'eccezione). Con un `host`, `host.available()` è `true`.

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

Un'app pubblicata ottiene il proprio host da `nsh.json`: `web.host` indica un modulo JS nella directory dell'app, relativo a `nsh.json`, che esporta `createHost(player)`. `nsh package --target web` lo copia nel sito come `host.<digest>.js`, e la pagina esegue `createHost` con il player prima che l'app parta; ciò che restituisce (o con cui si risolve) deve avere una funzione `call`, altrimenti la pagina mostra che l'app non ha potuto essere caricata. Il player `createHost` da quel momento in poi riceve gli eventi inviati:

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

L'host cerca ogni nome così com'è in una tabella delle proprie funzioni, come sopra, e tiene i propri URL e percorsi per sé: `capabilities.host` concede i nomi in base al loro inizio (`user.*`), quindi un nome che l'host trasformasse in un percorso potrebbe raggiungere ciò che la concessione esclude. Il runtime inoltra nomi da 1 a 128 caratteri tra `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` e `-`, senza `..`, e rifiuta la chiamata di qualsiasi altro nome. Una concessione per prefisso termina con un separatore (`bridge.*`): `bridge*` corrisponde anche a `bridgeAdmin`.

Gli eventi inviati prima che l'app giri, ad esempio da `createHost` stesso, vengono consegnati in ordine non appena parte, così i listener `host.on` di primo livello dell'app li ricevono. Un evento inviato prima che un listener si registri non gli viene riproposto: un'app legge lo stato con cui parte tramite una chiamata (`host.call("user.info")`) e ne segue le modifiche tramite eventi.

Il modulo host gira nella pagina dell'app e ne condivide la Content-Security-Policy: quando le capability dell'app limitano `network`, `connect-src` della pagina contiene l'origine della pagina, gli host elencati da `capabilities.network` e gli host elencati da `web.connect`. `web.connect` indica gli host che le richieste del modulo host stesso (`fetch`, `XMLHttpRequest`, `WebSocket`) raggiungono, come pattern simili a quelli di `capabilities.network.hosts` (`api.example.com`, `*.example.com`, `"*"`), come `api.example.com` sopra; le richieste dell'app stessa restano verificate rispetto al suo `capabilities`.

Il modulo viene copiato così com'è, quindi importa altro codice tramite URL assoluto. L'app ha comunque bisogno della sua [capability](./sandbox-and-capabilities.md) `host` per ogni funzione che chiama. `nsh run --target web` lo esegue nella pagina di sviluppo, e `nsh test` esegue lo stesso modulo per ogni app che i suoi test aprono, headless o in un browser (`--target web`), così l'app e il suo host vengono testati insieme ([Testing](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## Il browser come piattaforma

`platform.os` è `"web"`. Il tipo di dispositivo su cui si trova il browser decide come si comporta l'app, come `platform.idiom`:

- `"desktop"`: un mouse (un puntatore preciso che supporta l'hover) e un container largo almeno 600 punti. `platform.desktop` è `true`, `platform.select` sceglie `desktop` e le prop `desktop={{…}}` si applicano.
- `"pad"`: un touch screen il cui lato corto è di almeno 600 punti; altrimenti `"phone"`. Questi sono mobile: `platform.select` sceglie `mobile`.

L'idioma viene deciso all'avvio dell'app e resta lo stesso mentre gira, come su ogni piattaforma; una finestra desktop stretta è comunque un desktop, disposta secondo il suo `windowSize()`. Le prop `web={{…}}` e le classi `platform.select({ web })` e `web:` si applicano solo nei browser; `ios={{…}}`, `native` e `ios:` non vi si applicano.

La pagina riporta il resto dell'ambiente e lo mantiene aggiornato:

| Valore | Dal browser |
|---|---|
| Locale (predefinito di `Intl`) | `navigator.languages[0]` |
| Fuso orario (ora locale di `Date`, `timeZone` predefinito di `Intl`) | quello del browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`), ora legale inclusa |
| La direzione del layout (`rtl:` / `ltr:`) | `<html dir>` se impostato, altrimenti la scrittura del locale |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | la dimensione del font dell'elemento radice / 16 px (l'impostazione della dimensione del testo del browser) |
| `pixelRatio()` | `devicePixelRatio` (cambia con lo zoom e gli schermi) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` dove si sovrappone al container (pagine `viewport-fit=cover` sui telefoni) |
| `keyboardFrame()` | quanta parte del container è coperta dalla tastiera su schermo (`visualViewport`) |

`platform.version` è `"0.0"`, e `screenReaderEnabled()` resta `false` (i browser non lo comunicano). Le barre del browser intorno alla pagina appartengono al browser; il [`statusBar`](../modules/nsh-base.md#status-bar) di una pagina serve per i telefoni.
## Networking

`fetch` (con stream, `AbortController` e `FormData`) e gli URL di `<Image>` passano attraverso lo stack di rete del browser, dopo che NSH ha verificato le [capabilities](./sandbox-and-capabilities.md) dell'app. Poiché le richieste sono quelle del browser, valgono le regole del browser:

- **Gli URL relativi** si risolvono rispetto all'URL della pagina, come nel browser: un'app pubblicata raggiunge la propria API con `fetch("/api/items")`, e `<Image src="/photos/a.jpg" />` viene caricato dal proprio server. (Le piattaforme native non hanno una pagina, quindi richiedono URL assoluti.)
- **CORS.** Una richiesta verso un'origine diversa da quella della pagina riesce solo se quel server consente l'origine della pagina (`Access-Control-Allow-Origin`); in caso contrario `fetch` viene rifiutata con un errore di rete. Sono visibili solo gli header di risposta che il server espone.
- **I cookie** (e l'autenticazione HTTP) vengono inviati solo all'origine della pagina (`credentials: "same-origin"`), e gli header vietati dai browser (`Cookie`, `User-Agent`, `Host`, ...) vengono scartati.
- **I redirect** vengono seguiti dal browser. Una richiesta reindirizzata che non deve seguire il redirect fallisce: `redirect: "manual"` e `"error"`, e le richieste di un'app le cui capabilities limitano `network` (NSH controlla ogni passaggio, e i browser non rivelano un redirect prima di seguirlo).
- **I corpi delle richieste** che sono un `ReadableStream` vengono raccolti prima e inviati in un unico blocco; i corpi delle risposte arrivano in streaming man mano che giungono.

## Split bundles

Un'app web TSX non ha bisogno di scaricare tutto il suo codice prima che appaia la prima schermata (un'app Rust è un unico `nsh.wasm`, che il browser compila mentre lo scarica). `nsh package --target web` pubblica le app TSX suddivise, con ogni chunk come `<name>.<digest>.js` e la pagina che associa i chunk a quei file. Per suddividere un bundle manualmente, `nsh build --split` inserisce i moduli che `import()` carica in chunk separati, accanto a `bundle.js`:

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

Il primo `import("./Screen")` scarica `Screen.js` e i chunk che esso importa, tutti insieme, poi li valuta; gli import successivi dello stesso modulo si risolvono immediatamente. La pagina indica dove si trovano i chunk: per impostazione predefinita accanto al bundle, oppure un URL per ogni chunk, per i file rinominati con un digest del contenuto in modo che una CDN possa memorizzarli nella cache per sempre:

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

Un chunk che non può essere scaricato fa rifiutare il `import()` con un `TypeError` che lo indica; il `import()` successivo riprova. I nomi dei chunk sono nomi di file fissi del bundle: l'app non può far scaricare alla pagina nient'altro.

La [gallery](/gallery) carica ogni demo in questo modo: `lazy` (in `examples/gallery/ui.tsx`) crea un componente che avvia l'import la prima volta che viene renderizzato, mostra un segnaposto finché non si risolve, poi renderizza ciò che ha caricato. Il suo primo caricamento è l'indice e la demo mostrata per prima; un font importato da una demo arriva con il chunk di quella demo. Le build native contengono tutti i moduli, quindi lì l'import si risolve immediatamente:

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

## Limits

Queste cose le decide il browser, e il backend web le segue:

- **Web view di altri siti**: `WebView` è un `<iframe>`. L'HTML inline (`html`) ottiene tutto: `onMessage`, `postMessage`, `injectJavaScript`, gli script iniettati e gli eventi di caricamento (viene eseguito con un'origine propria, separata dalla pagina). Una pagina di un altro sito ottiene solo `postMessage` e gli eventi di caricamento con l'URL che gli è stato assegnato: i browser nascondono alla pagina circostante le sue navigazioni, il titolo, la cronologia e gli errori, e `userAgent` non può essere impostato.
- **Video con audio che si avviano da soli**: `Video` è un `<video>` con tutte le prop e gli eventi, ma i browser avviano un video con audio solo dopo un gesto dell'utente (i video senza audio vengono riprodotti).
- **Componenti nativi**: i componenti nativi registrati appartengono alle app native che incorporano NSH; sul web la loro vista resta vuota, con un avviso nella console.
- **Servizi della piattaforma**: la lettura degli appunti (`Clipboard.readText`, anche `hasText`) richiede un contesto sicuro (HTTPS) e può chiedere il permesso all'utente. Le immagini non segnalano `onProgress`.
- **Dettagli sullo shaping del testo**: l'a capo automatico è un sottoinsieme di UAX #14 (spazi, CJK, trattini e le regole di inizio e fine riga della punteggiatura CJK: i segni di chiusura come `。`, `，` e `」` non compaiono a inizio riga, i segni di apertura come `（` e `「` non compaiono a fine riga), senza sillabazione e senza riordino bidirezionale oltre la direzione del paragrafo.

Il player e il dev server eseguono le app con impostazioni di sviluppo; le app pubblicate vengono eseguite come release. Entrambi eseguono il codice di un'app TSX sul motore JavaScript del browser, in un realm proprio dell'app.

## See also

- [Packaging](./packaging.md): gli altri target di `nsh package`.
- [Architecture](./architecture.md): il motore, il core e i mount batch che la build web riutilizza.
- [Testing](./testing-and-trace.md): `nsh test` esegue lo stesso motore in modalità headless, con un motore di testo approssimativo.
