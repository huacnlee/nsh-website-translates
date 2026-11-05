---
title: "Windows"
description: "Esegui app NSH in Rust e TSX su Windows all'interno di finestre Win32 disegnate con Direct2D, crea i pacchetti, incorporale in un'app Win32 con AppView e scopri cosa cambia su Windows."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

Le app NSH girano anche su Windows. Il backend Windows le disegna in finestre Win32 con Direct2D e imposta il testo con DirectWrite; il core, il grafo reattivo, il renderer, il layout Taffy e i moduli nativi sono gli stessi di iOS e Android, quindi un'app gira ovunque. Su Windows, `os()` è `Os::Windows` (`platform.os` è `"windows"`
in TSX) e valgono le prop `desktop={{…}}` di TSX. Il titolo della finestra, una barra del titolo propria dell'app, la barra dei menu e
i menu contestuali provengono da `nsh_core::element::desktop` in Rust ([Barre del titolo desktop](./rust.md#desktop-title-bars)) e da
[`nsh/desktop`](../modules/nsh-desktop.md) in TSX.

<a id="requirements"></a>

## Requisiti

- **Windows 10 1809** o successivo, oppure Windows 11.
- Il **WebView2 Runtime** per le web view. È incluso in Windows 11 e con Microsoft Edge su Windows 10; senza di esso un
  `WebView` mostra un segnaposto.
- I **codec Media Foundation** per i formati video che la tua app riproduce (i video vengono riprodotti tramite lo stack multimediale di Windows).
- Per compilare il runner di un'app Rust: Visual Studio Build Tools con il carico di lavoro C++ e il Windows SDK. Per compilare il
  runtime Windows di NSH (da un checkout, o `cargo xtask dist` su Windows) serve anche LLVM (per i binding di QuickJS).

<a id="running-an-app"></a>

## Eseguire un'app

Su Windows, `nsh run` apre l'app in una finestra. Un'app Rust si esegue dalla propria directory:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` compila un runner di debug con il tuo crate e apre l'app, con i suoi log (`log::info!` e gli altri) nel
terminale; una modifica al codice Rust del crate ricompila il runner e riavvia l'app. `cargo run` avvia la stessa
radice dal `src/main.rs` del crate, che `nsh init --template rust` scrive: [`run_app`](#embedding-in-a-win32-app)
con `AppSource::Rust`.

Un'app TSX indica il proprio entry e si apre per impostazione predefinita in una finestra di 1200×800, con hot reload, log nel terminale e
overlay degli errori come sugli altri target:

```sh
nsh run App.tsx
```

In un checkout, `nsh run` compila prima l'host di sviluppo (`nsh-windows-host.exe`); la distribuzione creata su Windows
lo include in `runtime\windows\`. Ctrl-C chiude la finestra, e chiudere la finestra termina `nsh run`; l'host non
sopravvive mai a `nsh`, comunque questo termini. L'host esegue anche da solo un bundle già compilato:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` è la dimensione della finestra in punti (`<width>x<height>`; app TSX).

### Performance monitor

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, il `--fps` dell'host, oppure
`AppOptions { fps: true, .. }` nel `run_app` di un'app Rust) registra nel log le letture del performance monitor una volta al secondo
(target `nsh::perf`): i frame mostrati rispetto alla frequenza del display, il tempo del thread principale per frame e le sue fasi (`tick`,
`drain`, `paint`, `present`, `canvas`), i commit del motore, CPU e memoria, nel formato in cui li registrano gli altri desktop
(millisecondi come media/p50/p95/max). `nsh test --fps -v` li mostra e `examples/gallery/tools/perf.py` li legge
([Report delle prestazioni](./performance-report.md#windows-win32-direct2d)). Misura le build release; il monitor non ha alcun costo
quando è disattivato.

## Packaging

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

Scrive una directory e la stessa cosa come archivio:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

L'eseguibile trova `nsh\` accanto a sé; copia l'intera directory (o decomprimi lo `.zip`) dove l'app deve
risiedere: non viene installato nulla. L'icona di `nsh.json` viene incorporata nell'eseguibile (Esplora file e la barra delle applicazioni la mostrano)
senza bisogno di strumenti aggiuntivi; il packaging su un altro sistema mantiene l'icona predefinita. L'app id raggruppa le finestre dell'app nella
barra delle applicazioni. `--run` avvia l'app dopo averla impacchettata. L'eseguibile non è firmato: firmalo con il tuo
certificato (`signtool`) per distribuirlo.

<a id="embedding-in-a-win32-app"></a>

## Incorporare in un'app Win32

Il crate `nsh-platform-windows` (dal repository NSH) offre a un'app Win32 in Rust `AppView`: un motore NSH in una finestra figlia
di una tua finestra. Ogni `AppView` è indipendente; ne possono girare diversi contemporaneamente. Esegue una radice Rust, il componente radice
del tuo crate:

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

Un bundle TSX scritto da `nsh build` si carica nella stessa view, con `asset_base` impostato sulla sua directory `assets`:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

La view è una finestra figlia: il tuo message loop la fa funzionare e la posizioni con `MoveWindow` sul suo `hwnd()` quando la
finestra padre viene ridimensionata. Creala sul thread della finestra in cui si trova: il suo ciclo di vita segue la finestra di primo livello
di quella finestra, quella sotto cui è stata creata. `AppView::load` sostituisce ciò che era in esecuzione; `stop` (o la distruzione della finestra) termina l'app. `asset_base`
indica dove vengono risolti gli URI `asset:/` (`AssetBase::Directory` o `AssetBase::Http`). I bundle bytecode (`bundle.nshc`)
si caricano con `unsafe { Bundle::bytecode(bytes) }` (o `Bundle::read_trusted(path)`, anch'esso unsafe): il bytecode QuickJS è un input attendibile, quindi
caricalo solo dai file della tua app. Una finestra standalone è `nsh_platform_windows::run_app(source, options)`, con
`AppSource::Rust(root)` o `AppSource::Bundle(bundle)`. `Root::tokens` assegna a una radice il suo [tema](./rust.md#theme) e
`Root::app_id` l'id con cui vengono conservati i suoi dati.

`AppOptions::cache` (o `AppView::set_cache`, per le app caricate successivamente) imposta dove le app conservano le proprie cache, le
[immagini che scaricano](./images-and-assets.md#kept-on-disk) e quanto ne conserva ciascuna (`CacheOptions`: la
directory della cache di sistema e 256 MiB di immagini per impostazione predefinita).

`AppView::set_locale(Some(locale))` e `AppView::set_font_scale(Some(scale))` assegnano all'app la lingua e la
dimensione del testo della tua app al posto di quelle del sistema (`None` torna a seguire il sistema): `locale()`, `Intl`, `fontScale()` e il testo
si adeguano subito ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` applica il marchio della tua app sopra il [tema](./tailwind.md#theme-tokens) dell'app: un file di tema
nel formato di `nsh.json` di `"theme"`, i cui token prevalgono su quelli dell'app con lo stesso nome in modalità chiara e scura,
mentre gli altri token dell'app restano; classi come `bg-primary` cambiano stile subito, e le app caricate successivamente partono con esso
(`None` restituisce all'app il suo tema; un file che non può essere analizzato è un errore e non cambia nulla).

I componenti nativi si registrano con `AppView::register_component`; vedi
[Componenti nativi](./native-components.md#registering-on-windows-rust). `set_ui_sets(sets)` imposta i set di UI che ogni
motore serve: quelli di NSH (`nsh_base::registry()`) e quelli dei tuoi crate (`my_app::registry()`, che `#[native_module]`
crea), così il TSX che una view carica importa anche i tuoi componenti e moduli Rust.

<a id="what-differs-on-windows"></a>

## Cosa cambia su Windows

L'ambiente è quello di un desktop: la safe area e l'altezza della tastiera sono 0, `idiom()` è il desktop
(`platform.idiom` è `"desktop"`) e `os_version()` (`platform.version`) è `"10.0"` (anche su Windows 11: Windows ha mantenuto il numero di versione). La modalità scura
segue in tempo reale Impostazioni > Personalizzazione > Colori, `fontScale()` l'impostazione Dimensioni del testo, reduce motion l'impostazione
degli effetti di animazione e la locale il formato regionale dell'utente. Vedi [Dispositivo e ambiente](./device-and-environment.md).

Lo stile `cursor` segue gli aggiornamenti mentre il mouse resta fermo su una view. Quando un batch cambia il cursore,
Windows applica la nuova forma o `"none"` dopo l'intero batch, usando la view sotto il puntatore.
La barra del titolo e i bordi di ridimensionamento mantengono i cursori di sistema.

<a id="keyboard"></a>

### Tastiera

| Tasti | Azione |
|---|---|
| Return | In un `Input`, ciò che dice `submitBehavior`: invia (`onSubmit`), invia e lascia il campo, oppure va a capo (input multiriga) |
| Shift+Return, Alt+Return | Va a capo in un input multiriga il cui return invia (Ctrl+Return invia) |
| Tab, Shift+Tab | Il campo di testo successivo / precedente, all'interno del dialogo più recente; il testo del campo viene selezionato, come nei dialoghi di Windows |
| Escape | Esce dal campo attivo; altrimenti annulla una selezione di testo, poi chiude il dialogo più recente o torna indietro |
| Alt+Left, tasto Indietro del browser, pulsante indietro del mouse | Tornano indietro (anche da un campo) |
| Ctrl+frecce, Home / End, Ctrl+Home / End, con Shift; Ctrl+Backspace / Delete | Spostano, selezionano ed eliminano per parola e per riga in un campo, come in ogni app Windows |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | Annulla, ripeti, taglia, copia, incolla, seleziona tutto (un campo `masked` rifiuta taglia e copia); Ctrl+A / Ctrl+C selezionano e copiano il testo selezionabile |
| Frecce; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | Scorrono la scroll view attorno alla view attiva o sotto il mouse di una riga, di una pagina, all'inizio / alla fine (non mentre un campo ha il focus) |
| F11, Alt+F4 | Schermo intero, chiude la finestra (app `nsh package` e `nsh run`) |
| Ctrl+R, F5 | Ricaricano l'ultima build (`nsh run`) |

Le scorciatoie funzionano con qualsiasi layout di tastiera (su uno cirillico o greco, Ctrl+C è il tasto che digita C su un layout US).
Un return che conferma la composizione di un metodo di input (cinese, giapponese, ...) non invia mai. `onKeyPress` riporta
ciò che riporta React Native: il testo digitato, `"Enter"`, `"Backspace"` e `"Escape"`; il testo incollato non viene riportato.

Le scorciatoie dell'app ([`keymap`](../modules/nsh.md#keymap)) hanno la precedenza sui tasti di un campo attivo, sulla navigazione
e sullo scorrimento; Alt+F4, F11 e Ctrl+Q non possono essere associati.

Diverso, o non supportato:

- **`WebView`**: una pagina all'interno di una view con trasformazione 3D (prospettiva) non viene mostrata, e un `backdropFilter` sopra una
  pagina non la sfoca. `baseUrl` accetta URL `http(s)`. Un componente nativo che porta con sé una finestra propria
  resta sopra tutto ciò che disegna NSH.
- **Video**: i formati decodificati dai codec installati; nessun poster; la barra dei controlli è sempre visibile con `controls`.
- **Scroll view con zoom** (`zoomTo`, le prop di zoom); l'indicatore di scorrimento non può essere trascinato.
- **`mixBlendMode` e `backdropFilter`** vengono disegnati, ma non all'interno di una view che ha un `filter` o una trasformazione 3D;
  `borderCurve: "continuous"` disegna angoli circolari.
- **Testo**: ellissi iniziali e centrali solo su una singola riga (con più righe si ottiene un'ellissi finale); emoji a colori solo da font
  COLR; small caps solo dove il font le prevede.
- **Input di testo**: i tipi di tastiera e l'autofill non si applicano (non c'è una tastiera software); Tab si sposta tra i campi
  di testo. Un clic destro apre il menu di modifica (Undo, Cut, Copy, Paste, Delete, Select All), come sul testo selezionabile (Copy,
  Select All).
- **Accessibilità** (UI Automation): i dialoghi di avviso e i toast non sono esposti; le intestazioni riportano
  il livello 1.
- **Input accessory view** e la **status bar** (nessun equivalente desktop).

<a id="see-also"></a>

## Vedi anche

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Packaging](./packaging.md)
- [Codice specifico per piattaforma](./platform-specific.md)
