---
title: "macOS"
description: "Esegui app NSH in Rust e TSX su macOS all'interno di finestre AppKit, impacchettale come bundle .app, incorporale in un'app Mac con AppView e scopri cosa cambia su macOS."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

Le app NSH funzionano anche come app Mac native. Il backend macOS le renderizza con view AppKit e Core Animation e dispone
il testo con CoreText; il core, il grafo reattivo, il renderer, il layout Taffy e i moduli nativi sono gli
stessi di iOS e Android, quindi un'unica app gira ovunque. Su macOS, `os()` è `Os::MacOs` (`platform.os` è `"macos"`
in TSX) e valgono le prop `desktop={{…}}` di TSX. Il titolo della finestra, una barra del titolo propria dell'app, la barra dei menu e
i menu contestuali provengono da `nsh_core::element::desktop` in Rust ([Desktop title bars](./rust.md#desktop-title-bars)) e
da [`nsh/desktop`](../modules/nsh-desktop.md) in TSX.

Il backend macOS si comporta come un'app desktop: input da mouse, trackpad e tastiera, finestre ridimensionabili, dialog
sopra la finestra e una barra dei menu.

<a id="requirements"></a>

## Requisiti

- **macOS 14** o successivo, dove l'app viene eseguita.
- Gli strumenti da riga di comando di Xcode (`xcode-select --install`), per compilare i runner delle app Rust e il runtime macOS di NSH da un
  checkout, e per creare il pacchetto delle app (`codesign`, `sips`). La distribuzione creata con `cargo xtask dist` su un Mac include il
  runtime delle app TSX in `runtime/macos/`.

<a id="running-an-app"></a>

## Eseguire un'app

Un'app Rust si esegue dalla propria directory:

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` compila un runner di debug con il tuo crate e apre l'app in una finestra, con i suoi log (`log::info!` e il resto)
nel terminale; una modifica al codice Rust del crate ricompila il runner e riavvia l'app. `cargo run` avvia
la stessa root dal `src/main.rs` del crate, che `nsh init --template rust` scrive: [`run_app`](#embedding-in-a-mac-app)
con `AppSource::Rust`.

Un'app TSX indica il proprio entry:

```sh
nsh run App.tsx --target macos
```

L'app si apre in una finestra AppKit (1200×800 per impostazione predefinita), con hot reload, log nel terminale e overlay degli errori come
sulle altre piattaforme; Cmd+R ricarica l'ultima build. La barra dei menu e la finestra mostrano il nome dell'app (`"name"` di nsh.json,
altrimenti quello della sua directory). In un checkout, `nsh run` compila prima l'host di sviluppo
(`nsh-macos-host`). Interrompere `nsh run` chiude la finestra, e chiudere la finestra termina `nsh run`. L'host esegue anche
da solo un bundle già compilato:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` è la dimensione iniziale della finestra (app TSX); la finestra può essere ridimensionata. `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` è il display principale, quello con la barra dei menu.

`nsh test --target macos` esegue i test di un'app TSX in finestre macOS, su un display secondario quando ce n'è uno (lo schermo
principale resta tuo; `--display <n>` ne sceglie un altro): ogni app aperta da un test ottiene una finestra propria, della dimensione che il
test richiede anche su un display più basso, e
i passi fanno clic, digitano e scorrono con l'input di sistema sulle view indicate dai loro selettori
([Testing](./testing-and-trace.md#on-a-real-platform)).

### Performance monitor

`--fps` (`AppOptions { fps: true, .. }` nel `run_app` di un'app Rust, `AppView::set_fps_monitor(true)` in caso di embedding,
`nsh run App.tsx --target macos --fps`, il `--fps` dell'host, o il `open -a MyApp --args --fps` di un'app TSX di cui è stato creato il pacchetto) mostra un pannello in alto a destra
nell'app che si aggiorna due volte al secondo:

| Riga | Misura |
|---|---|
| `FPS` | Frame mostrati nell'ultimo secondo: aggiornamenti del display in cui l'app è cambiata (un'app inattiva ha valori bassi; non è lentezza). `max` è ciò a cui il main thread riusciva a stare dietro, poi la frequenza del display (120 Hz sugli schermi ProMotion). |
| `TICK` | Gli intervalli tra gli aggiornamenti del display così come sono arrivati (media, p95) e `gap`, l'intervallo p95 tra i frame mostrati: un aggiornamento (8,3 ms a 120 Hz) quando nulla è in ritardo. |
| `MAIN` | Tempo del main thread per frame (applicazione delle modifiche del motore, disegno di testo e canvas, animazioni, input), il suo 95º percentile, e `drop`: la quota di frame che hanno richiesto più di un aggiornamento. |
| `JS` / `CORE` | Per commit: il tuo codice (handler, timer, righe di lista) e il core di NSH (layout, testo, diffing); commit al secondo, modifiche alle view native per commit. |
| `HOP` | Quanto attendono le modifiche tra l'engine thread e il main thread; quanto è occupato l'engine thread. |
| `CPU` / `GPU` / `MEM` | Il processo: CPU (100% è un core), la sua quota di GPU, la sua impronta di memoria (il valore di Activity Monitor). |

Le barre sotto sono il tempo del main thread degli ultimi 120 frame rispetto a un aggiornamento (la linea): verde entro la metà,
ambra entro la linea, rosso oltre. Mentre il pannello è visibile, le misure vengono anche registrate nel log una volta al secondo (target `nsh::perf`, nella
forma del backend Linux con le fasi di frame di macOS `tick`, `drain` e `canvas`; millisecondi come media/p50/p95/max), che
`nsh test --fps -v` mostra e `examples/gallery/tools/perf.py` legge. Misura le build release; il monitor non ha alcun costo
quando è disattivato.

## Packaging

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

Scrive un bundle dell'app:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

Il `.app` è firmato ad hoc, quindi gira sul Mac che lo ha compilato. Per distribuirlo, firmalo con un Developer ID e
notarizzalo. `--run` apre l'app dopo averne creato il pacchetto.

<a id="embedding-in-a-mac-app"></a>

## Embedding in un'app Mac

Il crate `nsh-platform-macos` (dal repository di NSH) offre a un'app Mac Rust `AppView`: un motore NSH come `NSView`.
Ogni `AppView` è indipendente; più istanze possono girare contemporaneamente. Esegue una root Rust, il componente root del tuo crate:

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` dà alla root il suo [tema](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) e
`Root::app_id` l'id con cui vengono conservati i suoi dati. Un bundle TSX scritto da `nsh build` si carica nella stessa view:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` sostituisce ciò che era in esecuzione; `stop` termina l'app. `asset_base` indica dove vengono risolti gli URI `asset:/`
(`AssetBase::Directory` o `AssetBase::Http`). I bundle bytecode (`bundle.nshc`) si caricano con
`unsafe { Bundle::bytecode(bytes) }`: il bytecode è un input fidato, quindi caricalo solo dai file della tua app.
Per un'app che è solo un'app NSH, `run_app(source, options)` (`AppSource::Rust(root)` o `AppSource::Bundle(bundle)`) apre un `AppView` in una finestra con un menu standard
(About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close), che l'app può sostituire con
`Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md)), e resta in esecuzione finché la finestra non si chiude.
Per impostazione predefinita, chiudere la finestra o scegliere Quit ferma il motore e ritorna da `run_app`;
il chiamante può quindi completare la pulizia o rilanciare il proprio eseguibile.

Imposta `AppOptions { keep_alive_on_close: true, ..Default::default() }` per mantenere attiva la
sessione standalone quando la sua finestra si chiude. La chiusura nasconde la finestra;
riaprendola dal Dock si mostra la stessa finestra con lo stesso motore. Per un'uscita esplicita
o un riavvio per aggiornamento, chiama `nsh_platform_macos::quit_app()` da qualsiasi thread. Chiude
la finestra mantenuta, ferma il motore e ritorna da `run_app`.
`nsh_core::element::desktop::close_window()` segue la policy scelta per la chiusura della finestra.


`AppOptions::cache` (o `AppView::set_cache`, per le app caricate successivamente) imposta dove le app conservano le proprie cache, le
[immagini che scaricano](./images-and-assets.md#kept-on-disk), e quanto ne conserva ciascuna (`CacheOptions`: la
directory di cache del sistema e 256 MiB di immagini per impostazione predefinita).

`AppView::set_locale(Some(locale))` e `AppView::set_font_scale(Some(scale))` danno all'app la lingua e la
dimensione del testo della tua app al posto di quelle del sistema (`None` torna a seguire il sistema): `locale()`, `Intl`, `fontScale()` e il testo
si aggiornano subito ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` applica il marchio della tua app sopra il [tema](./tailwind.md#theme-tokens) dell'app: un file di tema
nel formato di `nsh.json` di `"theme"`, i cui token prevalgono su quelli dell'app con gli stessi nomi in modalità chiara e scura
mentre gli altri dell'app restano; classi come `bg-primary` cambiano stile subito, e le app caricate dopo partono con esso
(`None` restituisce all'app il suo tema; un file che non viene analizzato è un errore e non cambia nulla).

I componenti nativi si registrano con `AppView::register_component`; vedi
[Native components](./native-components.md#registering-on-macos-rust). `set_ui_sets(sets)` imposta gli insiemi di UI che ogni
motore serve: quelli di NSH (`nsh_base::registry()`) e quelli dei tuoi crate (`my_app::registry()`, che `#[native_module]`
crea), così il TSX caricato da una view importa anche i tuoi componenti e moduli Rust.

<a id="what-differs-on-macos"></a>

## Cosa cambia su macOS

L'ambiente è quello di un desktop: la safe area e l'altezza della tastiera sono 0, `idiom()` è il desktop
(`platform.idiom` è `"desktop"`), `os_version()` (`platform.version`) è la versione di macOS, e la modalità scura segue in tempo reale l'aspetto del sistema. Vedi
[Device and environment](./device-and-environment.md).

L'input è quello di un desktop: il mouse, il trackpad (scorrimento con inerzia, pinch e rotazione) e la tastiera.
Il testo selezionabile si seleziona trascinando, con doppio e triplo clic, e si copia con Cmd+C. Escape, Option+Sinistra,
Cmd+[ e il pulsante indietro del mouse chiudono il dialog più recente o tornano indietro in uno stack (Escape in un campo o in una pagina web con il focus
lo abbandona soltanto; una pagina riceve prima questi tasti e mantiene quelli che usa); un `Dialog` è un livello sopra l'intera finestra
che mostra il popup e lo sfondo dell'app. Le pagine mostrano il loro `header` in alto. Un clic in qualsiasi punto di un `Input`, padding compreso, posiziona il cursore nel punto
più vicino. `AlertDialog` mostra uno sheet `NSAlert` sulla finestra: fino a due azioni di alert in riga (l'azione di annullamento
più a sinistra, l'ultima azione regolare è quella predefinita per Invio), più azioni e le azioni di un action sheet incolonnate
nel loro ordine con l'azione di annullamento per ultima e nessuna predefinita; Escape sceglie l'azione di annullamento.

<a id="keyboard"></a>

### Tastiera

| Tasti | Azione |
|---|---|
| Return | In un `Input`, ciò che dice `submitBehavior`: invia (`onSubmit`), invia e lascia il campo, oppure va a capo (input multilinea) |
| Return, Invio del tastierino numerico, Spazio | Attiva una view con il focus tramite `onPress` una sola volta alla pressione del tasto; l'auto-repeat viene consumato |
| Shift+Return, Option+Return, Ctrl+Return | Va a capo in un input multilinea il cui return invia |
| Tab, Shift+Tab (anche Ctrl) | Il campo o la view premibile successivo / precedente nell'ordine dello schermo, all'interno del dialog più recente; Option+Tab digita una tabulazione in un input multilinea |
| Escape | Abbandona il campo con il focus; altrimenti cancella una selezione di testo, poi chiude il dialog più recente o torna indietro |
| Option+Sinistra, Cmd+[, pulsante indietro del mouse | Tornano indietro (non mentre un campo ha il focus: lì Option+Sinistra sposta il cursore) |
| Option / Cmd + frecce, con Shift; Option+Delete, Cmd+Delete; Ctrl+A / E / K | Spostano, selezionano ed eliminano per parola e per riga in un campo, come in ogni app Mac |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Annulla, ripristina, taglia, copia, incolla, seleziona tutto (un campo `masked` rifiuta taglia e copia); Cmd+A / Cmd+C selezionano e copiano il testo selezionabile |
| Frecce; Page Up / Down, Spazio, Shift+Spazio, Option+Su / Giù; Home / End, Cmd+Su / Giù | Scorrono lo scroll view attorno alla view con il focus o sotto il mouse di una riga, di una pagina, all'inizio / alla fine (non mentre un campo ha il focus) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | Chiudi, riduci a icona, schermo intero, nascondi, nascondi altre, esci (menu delle app `nsh package` e `nsh run`) |
| Cmd+R | Ricarica l'ultima build (`nsh run`) |

Le scorciatoie proprie dell'app ([`keymap`](../modules/nsh.md#keymap)) hanno la precedenza su queste, tranne i tasti di attivazione rivolti a una view premibile con il focus, Quit, Hide,
Minimize e Full Screen, che non possono essere associati.

Le scorciatoie funzionano con qualsiasi layout di tastiera (su un layout cirillico o greco, Cmd+C è il tasto che digita C su un layout US).
Un return che conferma la composizione di un metodo di input (cinese, giapponese, ...) non invia mai. `onKeyPress` riporta
ciò che riporta React Native: il testo digitato, `"Enter"`, `"Backspace"` e `"Escape"`.

Non supportato, o diverso:

- **Scroll view con zoom** (`zoomTo`, le prop di zoom).
- **`mixBlendMode`**, e `brightness()` superiore a 1.
- **Input**: tipi di contenuto e autofill, tipi di tastiera, maiuscole automatiche, spaziatura tra le lettere; le input accessory view
  non vengono mai mostrate (non c'è una tastiera software) e `keyboardShouldPersistTaps` viene ignorato.
- **`scrollable={false}` di `WebView`** impedisce alla rotellina del mouse e al trackpad di scorrere la pagina: scorrono
  gli scroll view dell'app attorno ad essa, come su iOS. La pagina scorre comunque con la tastiera (Spazio, frecce) e con i propri
  script, e anche gli swipe del trackpad tra le sue pagine (`allowsBackForwardNavigationGestures`) si interrompono.
- **Accessibilità**: `accessibilityActions` personalizzati.
- **La status bar** e **l'haptics** (nessun equivalente desktop).

<a id="see-also"></a>

## Vedi anche

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
