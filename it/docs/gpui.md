---
title: "GPUI"
description: "Incorpora app NSH in Rust e TSX in un'app GPUI o GPUI Kit tramite AppView, disegnate da GPUI su macOS, Windows e Linux, prova le app TSX nell'host di sviluppo GPUI e scopri cosa fa in modo diverso il backend GPUI."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---

# GPUI

Il backend GPUI disegna le app NSH con [GPUI](https://gpui-kit.com) (GPUI Fast), il framework UI accelerato dalla GPU su cui si basa
GPUI Kit, su macOS, Windows e Linux allo stesso modo. È il backend per l'integrazione nelle app GPUI e GPUI Kit: un
`AppView` è una view GPUI, quindi un'app GPUI o GPUI Kit mostra le app NSH, con una propria radice Rust o con il TSX che carica, in qualsiasi punto
del proprio albero di elementi. Le app standalone
vengono eseguite e pacchettizzate con il backend proprio di ciascun desktop: [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32)
e [Linux](./linux.md) (GTK). Il core, il grafo reattivo, il renderer,
il layout Taffy e i moduli nativi sono gli stessi di ogni altra piattaforma, quindi un'unica app funziona
ovunque. `os()` (`platform.os` in TSX) è il sistema operativo su cui gira (macOS, Windows o Linux) e valgono le prop `desktop={{…}}` di TSX.

Ogni elemento e modulo dei backend [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) e
[Linux](./linux.md) (GTK) è presente; dove GPUI disegna qualcosa a modo suo, [Differenze](#differences)
spiega come.

<a id="how-it-works"></a>

## Come funziona

- **Un elemento per superficie.** Una superficie è un singolo elemento GPUI che riempie lo spazio assegnato dal suo genitore e disegna
  l'intero albero delle view con le primitive di GPUI: quad, ombre, percorsi, glifi e immagini. NSH mantiene una view persistente per ogni
  nodo, come su Windows, e ridisegna solo quando un commit ha cambiato qualcosa.
- **Il testo viene modellato sul thread del motore** con il sistema di testo di GPUI (i font propri dell'app) e suddiviso in righe da NSH;
  il thread principale si limita a disegnare i glifi.
- **Un solo passaggio per commit.** Il motore gira su un proprio thread; ogni commit è una closure inviata al thread principale di GPUI,
  che notifica la view.
- **L'input** proviene dagli eventi di mouse, scorrimento, tastiera e input method di GPUI; hit testing, pressioni, sistema dei responder,
  scorrimento e modifica del testo usano la stessa logica del backend Windows.

<a id="requirements"></a>

## Requisiti

- macOS, Windows o Linux, con una GPU con cui GPUI possa disegnare (Metal su macOS, DirectX su Windows, Vulkan su Linux).
- Su macOS, compilare la tua app GPUI o il runtime da un checkout richiede la Metal Toolchain di Xcode (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` compila
  il runtime con la feature `runtime-shaders` di GPUI e lo segnala: gli shader vengono compilati all'avvio dell'app (una frazione
  di secondo la prima volta, poi in cache da macOS).
- Su Linux: un driver Vulkan, Wayland o X11 con `libxkbcommon`, GTK 3 e WebKitGTK 4.1 (web view) e GStreamer
  1.20 o successivo con i plug-in base e good (video). Le web view richiedono X11: su un desktop Wayland esegui l'app con
  Xwayland (`WAYLAND_DISPLAY=` vuota), altrimenti mostrano un segnaposto. Compilare il runtime da un checkout richiede inoltre
  i pacchetti di sviluppo; su Debian e Ubuntu:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## Esecuzione di un'app

Un'app Rust viene eseguita all'interno della tua app GPUI: integra la sua radice con `AppView` ([Integrazione in un'app GPUI](#embedding-in-a-gpui-app))
e `cargo run` l'app GPUI; il tuo crate e l'app sono un'unica build Cargo. Da sola, un'app Rust viene eseguita con il backend proprio di questo sistema operativo
(`nsh run --target macos`, `windows` o `linux`).

Un'app TSX viene eseguita nell'host di sviluppo GPUI:

```sh
nsh run App.tsx --target gpui
```

Apre l'app in una finestra GPUI (1200×800 per impostazione predefinita), come la mostrerebbe un'app GPUI che la integra, con hot reload, log
nel terminale e overlay degli errori come sugli altri target. L'host di sviluppo (`nsh-gpui-host`) viene eseguito direttamente su
ogni sistema operativo, senza alcun bundle di app attorno. In un checkout, `nsh run` lo compila per primo; la distribuzione lo include in `runtime/gpui/`. L'host esegue anche
un bundle già compilato in modo autonomo:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` è la dimensione della finestra in punti (`<width>x<height>`).

<a id="packaging"></a>

## Pacchettizzazione

Un'app GPUI distribuisce NSH all'interno del proprio eseguibile: integra la radice Rust o il bundle TSX dell'app con `AppView` ([Integrazione in un'app
GPUI](#embedding-in-a-gpui-app)) e viene compilata e distribuita come l'app GPUI che è. Un'app NSH standalone viene pacchettizzata
con il target proprio di questo sistema operativo: [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) o
[`--target linux`](./linux.md#packaging) ([Pacchettizzazione](./packaging.md)).

Su Linux, un'app GPUI con web view e video collega WebKitGTK 4.1 e GStreamer dinamicamente, quindi le macchine su cui viene eseguita
devono averli installati, insieme a GTK 3 e ai plug-in base e good di GStreamer (Debian / Ubuntu: `libwebkit2gtk-4.1-0`,
`libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), oltre a un driver Vulkan e
`libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## Integrazione in un'app GPUI

Il crate `nsh-platform-gpui` (dal repository di NSH) offre a un'app GPUI in Rust `AppView`: un motore NSH come view GPUI
(`Entity<AppView>`), che riempie lo spazio assegnato dal suo elemento genitore. Ogni `AppView` è indipendente; più istanze
possono essere in esecuzione contemporaneamente. Esegue una radice Rust, il componente radice del tuo crate:

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` fornisce alla radice il suo [tema](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`,
`Theme` viene riesportato qui) e `Root::app_id` l'id con cui vengono conservati i suoi dati. Un bundle TSX che `nsh build` ha scritto
viene caricato nella stessa view:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

Inserisci l'entity nel tuo albero di elementi come qualsiasi altra view (un `Root` di GPUI Kit, un pannello, un dock). `AppView::load`
sostituisce ciò che era in esecuzione; `stop` (o l'eliminazione della view) termina l'app. `AppOptions::asset_base` indica dove vengono risolti gli URI `asset:/`
(`AssetBase::Directory` o `AssetBase::Http`). I bundle bytecode (`bundle.nshc`) si caricano con
`unsafe { Bundle::bytecode(bytes) }` (o `Bundle::read_trusted(path)`, anch'esso unsafe): il bytecode QuickJS è un input attendibile,
quindi caricalo solo da file della tua stessa app.

- `open_app_window(source, options, cx)` apre una finestra con un `AppView` in un'app GPUI in esecuzione.
- `run_app(source, options)` avvia GPUI ed esegue un'app in una finestra finché non viene chiusa (ciò che fa l'host di sviluppo).
- `AppView::register_component(name, factory)` registra un tuo componente nativo prima del caricamento
  ([Componenti nativi](./native-components.md)).
- `AppOptions::cache` (o `AppView::set_cache`, per le app caricate successivamente) imposta dove le app conservano le proprie cache, le
  [immagini che scaricano](./images-and-assets.md#kept-on-disk) e quanto ne conserva ciascuna: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB),
  `MaxSize(ByteSize::mib(n))` o `Off`.
- `AppView::host()` è il canale della view con le app che esegue ([`host`](../modules/nsh.md#host)), un
  `HostChannel` utilizzabile da qualsiasi thread: `set_params(map)` prima del caricamento fornisce all'app i parametri di avvio
  (`host.params`), `send(name, data)` un evento (`host.on`), e `handle(name, |call| …)` risponde ai suoi
  `host.call(name, data)` e ascolta i suoi `host.post` (`call.resolve(json)`, `call.reject(message)`, subito o in seguito
  da qualsiasi thread). Gli handler vengono eseguiti sul thread del motore: passa la chiamata alle tue entity GPUI (un canale letto da un
  task `cx.spawn`) e rispondi da lì. I `AppView` di macOS, Windows e Linux hanno lo stesso `host()`.
  Il suo `handle_open_url(|request| …)` vede gli URL che l'app apre ([`openUrl`](../modules/nsh.md#openurl))
  prima del sistema: `request.handled()` quando la tua app ha instradato l'URL da sé, `request.decline()` (o l'eliminazione
  della richiesta) perché il sistema lo apra con `open_url` di GPUI.
- `AppOptions::limits` (o `AppView::set_limits`, per le app caricate successivamente) imposta i limiti della VM: l'heap JS, lo
  stack, i budget di tempo e la quota di nodi ([Sandbox e capacità](./sandbox-and-capabilities.md)). Le app integrate ricevono `Limits::default()` (un
  heap di 256 MB); l'host di sviluppo esegue le app per conto proprio, con `Limits::standalone()`.
- `AppOptions::transparent` rende la view trasparente: non disegna alcuno sfondo della finestra, e `open_app_window` /
  `run_app` aprono una finestra trasparente, così ciò che l'app lascia non dipinto mostra ciò che sta dietro la finestra (widget
  del desktop, overlay). False per impostazione predefinita.
- `AppView::connect_dev_server(url, cx)` (feature `dev`) carica l'app da `nsh dev` e la ricarica mentre la modifichi,
  con l'overlay degli errori sopra la view; `AppView::on_error` continua a ricevere gli errori dell'app.
- `AppView::on_app_error(|error| …)` riceve gli errori dell'app: `error.kind` (l'app non è riuscita a caricarsi, un'eccezione
  non gestita, la VM si è fermata), `error.is_fatal()` quando nessun JS dell'app viene più eseguito, `error.message`, `error.stack`
  e `error.package` (l'id e la build del pacchetto firmato da cui proviene). `AppView::on_error` riceve gli stessi
  errori come testo.
- `AppView::set_locale(locale, cx)` e `AppView::set_font_scale(scale, cx)` forniscono all'app la lingua e la
  dimensione del testo della tua app al posto di quelle del sistema (`None` torna a seguire quelle del sistema): `locale()`, `Intl`, `fontScale()` e il testo
  si adeguano subito ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).
- `AppView::run_package(&package)` esegue un [pacchetto firmato](./signed-packages.md#loading-packages-in-a-host-app)
  da `verify_package` o `load_package`; `accept_package` lo registra una volta che la tua app ha deciso che è integro.
- `set_ui_sets(sets)` imposta i set di UI serviti da ogni motore: quelli di NSH (`nsh_base::registry()`) e quelli dei tuoi crate
  (`my_app::registry()`, che `#[native_module]` produce; [Sviluppo con Rust](./rust.md)), e fornisce i set propri della tua app: un'app raggiunge per nome le funzioni e le classi di un set con
  [`nativeModule`](../modules/nsh.md#nativemodule) e viene compilata con lo `nsh build` standard. Il `examples/embed-gpui`
  del repository mantiene in questo modo un trading desk nell'host, che due ticket d'ordine integrati e i widget
  propri dell'host condividono.

<a id="differences"></a>

## Differenze

Ciò che viene disegnato o si comporta in modo diverso rispetto ai backend desktop nativi:

- **Trasformazioni**: le view ruotate, inclinate e proiettate trasformano sfondi, bordi e ombre, ma il testo resta
  dritto, e immagini, video e canvas vengono disegnati entro i propri limiti.
- **L'opacità** si applica a ciascun colore anziché a un gruppo, quindi i figli sovrapposti di una view traslucida si vedono
  l'uno attraverso l'altro; l'opacità di un'immagine (una dissolvenza in entrata, una view traslucida) cambia per sedicesimi.
- **I ritagli arrotondati** (`overflow: "hidden"` con un raggio) arrotondano gli sfondi e le immagini dei figli, ma testo,
  bordi, video e componenti nativi vengono tagliati dal rettangolo.
- **Non disegnati**: `filter: blur()`, `backdropFilter` e `mixBlendMode`; le ombre traspaiono attraverso i riempimenti traslucidi;
  `borderCurve: "continuous"` disegna angoli circolari.
- **Il testo del canvas** è approssimato: dritto sotto le rotazioni, rimpicciolito anziché ristretto per `maxWidth`,
  i gradienti lo dipingono in un solo colore, i riempimenti `strokeText`, le sue ombre non sono sfocate, e le operazioni composite e
  `clearRect` non si applicano.
- **Le scroll view** non eseguono lo zoom (`zoomTo` e le prop di zoom vengono ignorate).
- **Il video** viene riprodotto su Linux (GStreamer); su macOS e Windows un video mostra un segnaposto e segnala `onError`.
- **Le web view** sono view native sopra tutto ciò che NSH disegna nella loro posizione. Su Linux richiedono X11 (vedi
  [Requisiti](#requirements)); dove le pagine restano nere sotto Xwayland ("Failed to create GBM buffer" nel log),
  esegui l'app con `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Su macOS e Windows gli antenati che ritagliano non le tagliano e
  i caricamenti falliti non segnalano alcun `onError`. `baseUrl`, `scrollable` e `allowsBackForwardNavigationGestures` non
  sono supportati.
- **L'accessibilità** passa attraverso AccessKit: gli screen reader possono attivare, mettere a fuoco, impostare valori e portare in vista gli elementi
  ovunque; le azioni personalizzate e l'azione del menu contestuale non vengono ancora inoltrate.

Per confronto, l'elenco di ciascun backend nativo: [macOS](./macos.md#what-differs-on-macos),
[Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## Vedi anche

- [Sviluppo con Rust](./rust.md): il crate la cui radice viene integrata da un'app GPUI
- [CLI](./cli.md): `nsh run --target gpui`
- [Pacchettizzazione](./packaging.md): app standalone, con il target proprio di ciascun sistema operativo
- [Panoramica delle piattaforme](./platforms.md)
