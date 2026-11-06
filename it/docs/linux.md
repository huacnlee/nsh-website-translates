---
title: "Linux"
description: "Esegui app NSH in Rust e TSX su Linux in finestre GTK 4, creane il pacchetto, incorporale in un'app GTK con AppView e scopri cosa cambia su Linux."
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

Le app NSH girano anche su Linux. Il backend Linux le renderizza con i widget GTK 4 e dispone il testo con Pango; il core, il grafo reattivo, il renderer, il layout Taffy e i moduli nativi sono gli stessi di iOS e Android, quindi un'app gira ovunque. Su Linux, `os()` è `Os::Linux` (`platform.os` è `"linux"` in TSX) e valgono le prop `desktop={{…}}` di TSX. Il titolo della finestra, una barra del titolo propria dell'app, la barra dei menu e i menu contestuali provengono da `nsh_core::element::desktop` in Rust ([Barre del titolo desktop](./rust.md#desktop-title-bars)) e da [`nsh/desktop`](../modules/nsh-desktop.md) in TSX.

<a id="requirements"></a>

## Requisiti

- **GTK 4.14** o successivo. Per compilare il runner di un'app Rust o il runtime Linux di NSH (da un checkout, o `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` su Debian e Ubuntu (24.04 o successivo), `gtk4 clang` su Arch, `gtk4-devel clang` su Fedora.
- **WebKitGTK 6.0** (2.40 o successivo) per le web view: `libwebkitgtk-6.0-dev` su Debian e Ubuntu, `webkitgtk-6.0` su Arch, `webkitgtk6.0-devel` su Fedora per compilare il runtime. L'host di sviluppo e il runner di release lo usano per impostazione predefinita, quindi le app distribuite richiedono WebKitGTK 6.0 dove vengono eseguite (`libwebkitgtk-6.0-4` su Debian e Ubuntu; i desktop GNOME lo includono). `cargo xtask dist` su una macchina senza i relativi file di sviluppo compila un runtime in cui le web view sono segnaposto e le cui app richiedono solo GTK.
- I plugin **GStreamer** per i formati video che la tua app riproduce (GTK riproduce i video tramite GStreamer).

<a id="running-an-app"></a>

## Eseguire un'app

Su Linux, `nsh run` apre l'app in una finestra GTK. Un'app Rust si esegue dalla propria directory:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` compila un runner di debug con il tuo crate e apre l'app, con i suoi log (`log::info!` e gli altri) nel terminale; una modifica al codice Rust del crate ricompila il runner e riavvia l'app. `cargo run` avvia la stessa radice dal `src/main.rs` del crate, che `nsh init --template rust` scrive: [`run_app`](#embedding-in-a-gtk-app) con `AppSource::Rust`.

Un'app TSX indica il proprio entry e si apre per impostazione predefinita in una finestra di 390×844, con hot reload, log nel terminale e overlay degli errori come sulle altre piattaforme:

```sh
nsh run App.tsx
```

In un checkout, `nsh run` compila prima l'host di sviluppo (`nsh-linux-host`); la distribuzione creata su Linux lo include in `runtime/linux/`. Ctrl-C chiude la finestra e la chiusura della finestra termina `nsh run`. L'host esegue anche da solo un bundle già compilato:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` è la dimensione predefinita della finestra (app TSX); i window manager a tile possono assegnare alla finestra una dimensione diversa.

## Packaging

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

Scrive una directory e la stessa cosa come archivio:

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

L'eseguibile trova `nsh/` accanto a sé (funziona anche un collegamento simbolico verso di esso, ad esempio in `~/.local/bin`). GTK 4, Pango e WebKitGTK 6.0 devono essere installati dove l'app viene eseguita. Per mostrare l'app nel launcher di un desktop, metti l'eseguibile (o un collegamento) nel `PATH`, il file `.desktop` in `~/.local/share/applications` e l'icona in una directory del tema di icone. `--run` avvia l'app dopo averla pacchettizzata.

<a id="embedding-in-a-gtk-app"></a>

## Incorporare in un'app GTK

Il crate `nsh-platform-linux` (dal repository di NSH) offre a un'app Rust GTK `AppView`: un motore NSH come widget GTK. Ogni `AppView` è indipendente; più istanze possono essere in esecuzione contemporaneamente. Esegue una radice Rust, il componente radice del tuo crate:

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` assegna alla radice il suo [tema](./rust.md#theme) e `Root::app_id` l'id con cui vengono conservati i suoi dati. Un bundle TSX scritto da `nsh build` si carica nella stessa view, con `asset_base` impostato sulla sua directory `assets`:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` sostituisce ciò che era in esecuzione; `stop` termina l'app. `asset_base` indica dove vengono risolti gli URI `asset:/` (`AssetBase::Directory` o `AssetBase::Http`). I bundle bytecode (`bundle.nshc`) si caricano con `unsafe { Bundle::bytecode(bytes) }`: il bytecode QuickJS è un input attendibile, quindi caricalo solo dai file della tua app. Una finestra autonoma è `nsh_platform_linux::run_app(source, options)`, con `AppSource::Rust(root)` o `AppSource::Bundle(bundle)`.

`AppOptions::cache` (o `AppView::set_cache`, per le app caricate successivamente) imposta dove le app conservano le proprie cache, le [immagini che scaricano](./images-and-assets.md#kept-on-disk) e quanto spazio ciascuna può occupare (`CacheOptions`: per impostazione predefinita la directory di cache del sistema e 256 MiB di immagini).

`AppView::set_locale(Some(locale))` e `AppView::set_font_scale(Some(scale))` forniscono all'app la lingua e la dimensione del testo della tua app al posto di quelle del sistema (`None` torna a seguire il sistema): `locale()`, `Intl`, `fontScale()` e il testo li seguono immediatamente ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` applica il marchio della tua app sopra il [tema](./tailwind.md#theme-tokens) dell'app: un file di tema nel formato di `nsh.json` di `"theme"`, i cui token hanno la precedenza su quelli omonimi dell'app in modalità chiara e scura, mentre gli altri token dell'app restano; classi come `bg-primary` cambiano stile subito, e le app caricate in seguito partono già con esso (`None` restituisce all'app il suo tema; un file che non viene analizzato correttamente è un errore e non cambia nulla).

I componenti nativi si registrano con `AppView::register_component`; vedi [Componenti nativi](./native-components.md#registering-on-linux-rust). `set_ui_sets(sets)` imposta gli insiemi di UI serviti da ogni motore: quelli di NSH (`nsh_base::registry()`) e quelli dei tuoi crate (`my_app::registry()`, generato da `#[native_module]`), così il TSX caricato da una view importa anche i tuoi componenti e moduli Rust.

<a id="what-differs-on-linux"></a>

## Cosa cambia su Linux

L'ambiente è quello di un desktop: la safe area e l'altezza della tastiera sono 0, `idiom()` è il desktop (`platform.idiom` è `"desktop"`), `os_version()` (`platform.version`) è la versione major e minor del kernel, e la modalità scura segue in tempo reale l'impostazione del desktop (tramite l'XDG settings portal). Vedi [Dispositivo e ambiente](./device-and-environment.md).

<a id="keyboard"></a>

### Tastiera

| Tasti | Azione |
|---|---|
| Return | In un `Input`, ciò che indica `submitBehavior`: invia (`onSubmit`), invia e lascia il campo, oppure va a capo (input multilinea) |
| Shift+Return, Alt+Return | Va a capo in un input multilinea il cui return invia (Ctrl+Return invia) |
| Tab, Shift+Tab | Il campo successivo / precedente in ordine di schermo, all'interno del dialog più recente |
| Escape | Lascia il campo con il focus; altrimenti cancella la selezione di testo, poi chiude il dialog più recente o torna indietro |
| Alt+Sinistra, tasto Indietro, pulsante indietro del mouse | Tornano indietro (anche da un campo) |
| Ctrl+frecce, Home / End, con Shift; Ctrl+Backspace / Canc | Spostano, selezionano ed eliminano per parola e per riga in un campo, come in ogni app GTK |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | Annulla, ripeti, taglia, copia, incolla, seleziona tutto (un campo `masked` rifiuta taglia e copia); Ctrl+A / Ctrl+C selezionano e copiano il testo selezionabile |
| Frecce; Pag su / Pag giù, Spazio, Shift+Spazio; Home / End | Scorrono la scroll view attorno alla view con il focus o sotto il mouse di una riga, di una pagina, all'inizio / alla fine (non mentre un campo ha il focus) |
| Ctrl+W, F11, Ctrl+Q | Chiudono la finestra, schermo intero, esci (app `nsh package` e `nsh run`) |
| Ctrl+R | Ricarica l'ultima build (`nsh run`) |

Le scorciatoie proprie dell'app ([`keymap`](../modules/nsh.md#keymap)) sono un controller di scorciatoie valido per l'intera finestra; Ctrl+Q e F11 non possono essere associati.

Le scorciatoie funzionano con qualsiasi layout di tastiera (su un layout cirillico o greco, Ctrl+C è il tasto che digita C su un layout US). Un return che conferma la composizione di un input method (cinese, giapponese, ...) non invia mai. `onKeyPress` riporta ciò che riporta React Native: il testo digitato, `"Enter"`, `"Backspace"` e `"Escape"`; il testo incollato non viene riportato.

Le web view sono pagine WebKitGTK, disegnate all'interno delle view di NSH: sheet, dialog, toast e le view successive si disegnano sopra una pagina, e i genitori la ritagliano e la sfumano. I loro dati di sito web (cookie, storage, cache) sono conservati per app, in `~/.local/share/<app id>/webkit` e `~/.cache/<app id>/webkit`. La capability `webview` si applica anche alle pagine dei frame: un `iframe` di un host per cui la tua app non ha ricevuto il permesso resta vuoto. Escape in una pagina la lascia, come in un campo di testo (a meno che la pagina non lo usi); Alt+Sinistra e il pulsante indietro del mouse tornano indietro nella pagina finché ha una cronologia.

Non supportato:

- **Video `rate`**: GTK riproduce solo a velocità normale. `onEnd` arriva solo per i video che non vanno in loop.
- **Scroll view con zoom** (`zoomTo`, le prop di zoom).
- **`mixBlendMode` e `backdropFilter`** (il colore di sfondo viene comunque disegnato); `borderCurve: "continuous"` disegna angoli circolari.
- **Input accessory view** e **barra di stato** (nessun equivalente desktop).
- **Accessibilità**: raggruppamento `accessible`, `accessibilityActions` personalizzati; le live region vengono invece annunciate.

<a id="see-also"></a>

## Vedi anche

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [Packaging](./packaging.md)
- [Codice specifico per piattaforma](./platform-specific.md)
