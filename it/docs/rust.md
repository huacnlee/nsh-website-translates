---
title: "Sviluppare con Rust"
description: "Scrivi un'app Native Shell interamente in Rust, senza QuickJS su nessuna piattaforma, oppure in Rust con schermate TSX al di sopra: quando scegliere l'una o l'altra e come le due modalità condividono componenti e moduli."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# Sviluppare con Rust

Le app Native Shell si scrivono in Rust, in TSX o in entrambi. Tutti e tre i modi usano lo stesso motore: il grafo reattivo, il renderer, il layout Taffy e i moduli nativi (navigazione, finestre di dialogo, tastiera, barra di stato) sono sempre Rust, e ogni piattaforma esegue il rendering con la propria UI. Cambia il linguaggio del tuo codice e, con esso, se l'app include o meno una VM JavaScript.

| | Rust | TSX | Rust con TSX |
|---|---|---|---|
| UI, stato e gestori | Rust | TSX su QuickJS | Componenti e moduli Rust, schermate TSX che li usano |
| L'app esegue | solo il motore e il tuo crate, su ogni piattaforma e nel browser | QuickJS e il motore (nel browser, il suo motore JavaScript) | QuickJS e il motore, con il tuo crate (nel browser, il suo motore JavaScript) |
| Adatto a | App medie e grandi con logica di business impegnativa | App e moduli distribuiti a runtime, iterazione rapida | Un nucleo Rust con parti che cambiano spesso |
| Modifiche | Ricompilazione e riavvio | Aggiornamenti a caldo | Aggiornamenti a caldo per TSX, ricompilazione e riavvio per Rust |
| Avvio | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## Come scegliere

**Rust** è adatto alle app con logica di business ampia e impegnativa: trading, editor, strumenti ad alta intensità di dati. Ottieni il sistema di tipi e i controlli a tempo di compilazione di Rust su tutta l'app, l'ecosistema di crates.io, prestazioni native per il tuo codice (non solo per quello di NSH) e test headless della UI reale con `cargo test`. L'app è Rust e codice nativo dall'inizio alla fine: nessuna VM JavaScript viene distribuita con essa né vi viene eseguita, su iOS, Android, macOS, Windows, Linux, GPUI e web. I componenti sono funzioni che vengono eseguite una sola volta e collegano i signal a ciò che mostrano, come in TSX ([Reattività](./reactivity.md)), scritti con stili tipizzati invece che con stringhe di classi.

**TSX** è adatto alla UI che arriva dopo la distribuzione dell'app: moduli che un'app nativa carica a runtime, generati da un modello o scritti da un altro team, distribuiti come [pacchetti firmati](./signed-packages.md) ed eseguiti in una sandbox configurata dall'host, con aggiornamenti a caldo durante lo sviluppo.

**Rust con TSX** mantiene il nucleo Rust e aggiunge TSX dove conviene: schermate, impostazioni, onboarding, esperimenti, tutto ciò su cui itererai con aggiornamenti a caldo o che distribuisci a runtime come [pacchetto firmato](./signed-packages.md). TSX importa i tuoi componenti e moduli Rust come qualsiasi modulo NSH, così le due metà si incontrano tramite interfacce tipizzate. Il TSX viene eseguito su QuickJS, che l'app a quel punto include.

<a id="an-app-written-in-rust"></a>

## Un'app scritta in Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` contiene l'app: componenti, stato, gestori, task.

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

Elementi e componenti si creano allo stesso modo: una funzione ne crea uno (`view()`, `text(..)`, `button()` di `nsh_base`, `chart()` del tuo `#[component] fn Chart`), e i suoi metodi impostano le sue prop, un setter per prop (un valore, un signal o una closure), e i suoi listener, un metodo per evento. I listener sono closure del proprio evento (`move |text: &str| ..`), e `move || ..` per un evento senza dati; `.child(..)` accetta un elemento, oppure un `Option`, un `Vec`, un array o un iteratore di elementi (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` indica la radice e `nsh` la monta:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` è il percorso del componente nel crate (`App`, `shell::Gallery`; nel primo caso con [più crate](#several-crates)); `"theme"` è il [tema](#theme) con cui si disegnano i suoi componenti, e `"appearance"` vi si applica come in un'app TSX. Con esso, `nsh run` e `nsh package` nella directory dell'app compilano il runner dell'app per la piattaforma di destinazione, con la radice montata e senza QuickJS collegato:

| Destinazione | Cosa viene eseguito |
|---|---|
| macOS, Windows, Linux | Il runner release con il tuo crate, in una finestra; `nsh run` esegue una build di debug e mostra i log dell'app nel terminale |
| iOS, simulatore iOS, Mac Catalyst | Il runner iOS con il tuo crate, in un'app |
| Android | Il `libnsh.so` dell'app con il tuo crate, avviato dall'activity del runtime |
| Web | `nsh.wasm` con il motore e il tuo crate (3,3 MB per l'intera gallery Rust, 0,75 MB con brotli); la pagina monta la radice |

`nsh` compila ciò di cui il tuo crate ha bisogno e nient'altro: un piccolo programma composto dal tuo crate e dal core di NSH che descrive i suoi componenti e moduli alla CLI, la quale poi fa tutto il resto da sola, e il runner di ogni piattaforma che esegui o impacchetti. La prima build di una nuova app Rust compila il tuo crate e il core di NSH, circa 60 crate. `nsh test` esegue i test dell'app in modalità headless in un runner del tuo crate compilato allo stesso modo.

Su Linux, il tuo crate seleziona le funzionalità opzionali della piattaforma. Abilita `webview` sulla dipendenza `nsh-platform-linux` per usare le web view; questo collega WebKitGTK 6.0, che deve essere installato per compilare ed eseguire l'app. Il runner generato eredita questa scelta tramite l'unificazione delle feature di Cargo.

Durante `nsh run`, una modifica al codice Rust del crate ricompila il runner e riavvia l'app; nel browser, la pagina aperta carica da sola il nuovo runtime. `cargo run` avvia la stessa radice direttamente sul backend desktop (`src/main.rs`), e le app native che incorporano NSH montano una radice Rust con `AppSource::Rust` sul `AppView` di macOS, Windows, Linux, GPUI e iOS.

Il codice per ogni piattaforma, web inclusa, usa i servizi di NSH: `fetch` per HTTP ([Rete](./networking.md#from-rust-components)), `timer`, `set_timeout` e `set_interval` per l'attesa, `nsh_core::time::Instant` e `nsh_core::time::unix_ms()` per l'orologio. `background` e `blocking` eseguono il lavoro sui thread delle piattaforme native.

<a id="desktop-title-bars"></a>

## Barre del titolo desktop

Le app Rust disegnano le proprie barre del titolo con `nsh_core::element::desktop`. Chiama `set_title_bar(TitleBarStyle::Hidden, Some(height))`, contrassegna lo sfondo della barra con `.window_drag(true)` e riserva lo spazio dei controlli nativi della finestra con `title_bar()`. Il suo `top` è l'altezza della barra, e `left` e `right` sono le larghezze occupate dai controlli di sistema. La lettura sottoscrive le modifiche, incluso lo schermo intero. La piattaforma gestisce il trascinamento della finestra e il comportamento del doppio clic sulla barra del titolo impostato dall'utente; `.window_drag(false)` tiene un figlio fuori dall'area di trascinamento del suo genitore.

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` ripristina la barra del titolo di sistema. `close_window()` segue il normale comportamento di chiusura della finestra dell'host che incorpora l'app. Il modulo include anche le altre funzioni della finestra (`set_title`, `minimize`, `toggle_full_screen`, ...) e i menu (`set_application_menu`, `popup_menu`): [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## File e cartelle

Sui desktop, il codice Rust mostra le finestre di dialogo dei file di sistema e passa i percorsi locali al sistema, con ogni risposta attesa in un task: `pick_paths` con un `OpenDialog` (`OpenDialog::files()`, `::folders()` o `::files_and_folders()`), `pick_save_path` con un `SaveDialog`, `open_path` (l'app predefinita del file), `reveal_path` (l'elemento selezionato in Finder, Esplora file o nel file manager) e `move_to_trash` (dove è finito l'elemento, quando macOS lo comunica). Le finestre di dialogo rispondono `Ok(None)` quando l'utente annulla e con un errore quando non possono essere mostrate (su Linux senza un file chooser portal, e su iOS, Android e web, dove anche `open_path`, `reveal_path` e `move_to_trash` rispondono con un errore). Ogni richiesta che fallisce risponde con il proprio errore, mai `false`.

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## Estendere un'app Rust con TSX

La funzione `#[native_module("app/native")]` del crate indica cosa TSX può importare: componenti (`registry.register::<Chart>()`), moduli di funzioni (`registry.module::<Portfolio>()`, `#[module]` su una unit struct e il suo `impl`), classi (`registry.class::<Ledger>()`, `#[class]` su una struct e il suo `impl`) e asset; l'attributo crea anche `pub fn registry()` nella radice del crate, lo stesso insieme per i tuoi test e per altro codice Rust (`my_app_native::registry()`, accanto a `nsh_base::registry()`). In un `impl` `#[module]` o `#[class]`, i `pub fn` vengono esportati (anche `pub(crate)`); le funzioni senza visibilità sono helper che restano in Rust. Le loro dichiarazioni TypeScript, commenti di documentazione inclusi, vengono generate dai tipi Rust in `.nsh/types`, così TSX viene controllato rispetto a esse da `nsh check` e dal tuo editor:

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

Ogni export è documentato in TypeScript dal commento di documentazione dell'elemento Rust che lo nomina: un componente dal suo `#[component] fn` (`Chart`), un modulo e una classe dalla loro struct (`Portfolio`, `Ledger`), e prop, eventi, funzioni e membri dai propri (un setter non ne ha bisogno accanto al suo getter). I commenti di documentazione della struct `Props` e dell'enum degli eventi, e quelli dei blocchi `impl`, restano in Rust; un commento di documentazione su un blocco `#[module]` o `#[class]` `impl` è un errore di compilazione, perché TypeScript non lo mostrerebbe. Ogni comando che scrive `.nsh/types` segnala un export che TSX vede senza commento di documentazione, indicandone il nome (`Ledger.add`, `Chart.range`).

TypeScript mostra un commento di documentazione fino alla sua prima intestazione. Le note per i chiamanti Rust, ad esempio cosa prende in prestito `&self` o perché una funzione accetta `cx`, vanno sotto un'intestazione, `# Rust` (o `# Panics`, `# Examples` di rustdoc), e restano nella documentazione Rust:

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

Le prop sono i campi della struct `Props` del componente e gli eventi le varianti del suo enum `Event` (`onSelect`), entrambi in camel case. Il codice Rust posiziona lo stesso componente con il suo costruttore, un setter per prop e un metodo listener per evento: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. Il contenuto, gli eventi e lo stato propri di un componente Rust restano in Rust; TSX passa le prop e ascolta gli eventi. Una prop del tipo sbagliato (`level={1.5}` per una prop `u32`) genera un avviso, come su un elemento predefinito: la prop mantiene il proprio valore e il resto del componente viene renderizzato.

Una funzione o un membro viene eseguito come indica la sua firma Rust. Uno che non è `async` viene eseguito all'interno della chiamata TSX e restituisce il suo valore (`Portfolio.total()` è un numero, `ledger.balance` una proprietà): calcola e mantiene lo stato. Un `async fn` restituisce una Promise e viene eseguito come task con i servizi di NSH (`fetch`, `timer`, finestre di dialogo). Una funzione di modulo che accetta `cx: &mut ModuleCx` raggiunge la piattaforma in ordine con la UI (un toast, la barra di stato), e lo stesso vale per un metodo ref di un componente; il loro tipo di ritorno decide cosa ottiene TSX: uno che restituisce `()` dà `void`, senza risposta (TSX lo chiama e prosegue); uno che restituisce `Result<(), E>` dà `Promise<void>`, che viene rifiutata con il messaggio del `Err` (la chiamata viene eseguita insieme alle modifiche della UI, dopo il ritorno della chiamata TSX, quindi la Promise trasporta il suo errore; una che nessuno attende o intercetta viene registrata come [unhandled rejection](./dev-server-and-debugging.md#logs)); uno che restituisce un valore dà `Promise<T>`. Argomenti e risultati sono tipizzati in base alla firma: numeri, stringhe, `Option`, `Vec`, le tue struct `#[derive(JsObject)]` e i tuoi enum `#[derive(PropEnum)]`, istanze delle tue classi e funzioni TSX (`Callback<A, R>`, che Rust chiama subito all'interno di una chiamata, oppure più tardi con `post` e `call_async`; TS vede `(value: number) => void` per un `Callback<f64>`, e `#[args(balance)] listener: Callback<f64>` nomina l'argomento, `(balance: number) => void`). Una funzione che inizia ad ascoltare si chiama `on(event, listener)` e restituisce `Stop` (`Stop::new(|| …)`), che TSX riceve come funzione che la interrompe (`() => void`); viene eseguita una sola volta, quando TSX la chiama o quando termina ciò che ha chiamato `on` (un componente, o l'esecuzione del modulo durante l'hot reload). Il gestore di un evento riceve un solo oggetto: il valore di una variante è il suo campo `value`, che `#[args(price)]` sulla variante nomina (`onSelect({ price })`), e `#[args(open, reason)]` nomina i campi di una variante con più campi. Un argomento del tipo sbagliato lancia un `TypeError` nella chiamata, oppure rifiuta la Promise di una funzione che restituisce una Promise; un `Err` lancia (o rifiuta) con il proprio messaggio. L'oggetto di una classe possiede il proprio valore Rust: viene liberato quando l'oggetto viene raccolto, oppure subito con `ledger.dispose()` (anche `using ledger = new Ledger()`). Indica l'entry TSX per eseguirla, `nsh run App.tsx` o `nsh package App.tsx --target …`: le modifiche TSX sono aggiornamenti a caldo, quelle Rust ricompilano e riavviano l'app. La CLI impacchetta e compila da sola il TSX, conoscendo gli export del tuo crate dalla sua descrizione; gli host di sviluppo e il runner headless di `nsh test` sono compilati con il tuo crate e QuickJS.

`examples/rust-exports` nel repository è il riferimento per l'esportazione: una piccola app TSX il cui crate esporta un componente (prop obbligatorie, con valore predefinito e opzionali, un evento, figli), un modulo (una funzione di ogni tipo) e una classe (un costruttore, metodi, un getter e un setter, uno static, un membro `async`, un'altra istanza come argomento, una callback a cui Rust invia messaggi, `dispose()` e `using`), ciascuno con un breve commento di documentazione, e test, in Rust e in TypeScript (`App.test.tsx`), che interagiscono con l'app e verificano cosa mostra ciascuno.

`examples/gallery-rs` nel repository è un'app Rust completa: ogni demo è in Rust, `nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` esegue i suoi test in modalità headless, e `cargo run -p gallery-native` la avvia sul backend desktop.
<a id="render-functions-and-the-apps-classes"></a>

### Funzioni di render e classi dell'app

Un componente disegna il contenuto dell'app per i valori che possiede (una riga dei suoi dati, un blocco di codice di un documento) con una funzione di render: una prop `Option<Renderer<T>>`, in TypeScript `(value: T) => JSX.Element`. Il componente chiama
`render(key, value)` dove va il contenuto e ottiene una vista che stila e posiziona come qualsiasi altra (dentro un `text(..)`, una
vista inline). Il contenuto viene conservato per chiave finché il valore resta uguale, e renderizzato di nuovo quando cambia. Un
parent Rust passa una closure al setter della prop (`quote().render_badge(|symbol| ..)`), che ne crea il
`Renderer`.

Gli stili in un componente sono tipizzati; le classi Tailwind dell'app raggiungono una sua parte tramite una prop di classi e
`.app_class(..)` sull'elemento di quella parte. Si applicano dopo gli stili propri dell'elemento, con il tema dell'app, `dark:` e
gli stati, come fa `class` su un elemento.

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`TextView` in `nsh/base` è costruito così: i suoi `renderCodeBlock`, `renderMath`, ... sono funzioni di render, e i suoi
`classes` sono le classi dell'app per parte ([TextView](../elements/text-view.md)).

<a id="testing"></a>

## Test

I test di un'app Rust la eseguono in modalità headless, in `cargo test` o in `nsh test`, con lo stesso driver: sul motore reale,
senza finestra, con frame di visualizzazione a 60 Hz, così timer, task e animazioni girano come a schermo. Il driver avvia
l'app, mantiene un modello delle viste che mostra ed esegue azioni (`press`, `type_text`, `submit`, `scroll`, `wait_for`)
su viste indicate da selettori (un testo, un'etichetta di accessibilità o un test id; `text:`, `label:`, `id:`); un'azione che
non può essere eseguita fallisce mostrando i testi presenti a schermo.

In `cargo test`, `nsh_testing::Headless` (le feature predefinite di nsh-testing, senza QuickJS) esegue la root
(`app.screen()`: i testi a schermo, i comandi inviati); `EngineConfig::new` è un motore delle dimensioni di un telefono senza nient'altro
di impostato. `nsh test` esegue test TypeScript ([Testing](./testing-and-trace.md)) in un runner headless costruito con i tuoi
crate, dove `open(".")` avvia la root di un'app Rust:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

Un entry TSX viene compilato con la feature `bundle` di `nsh-testing` come lo compila `nsh run`, rispetto ai set di UI che i suoi host
servono: quello di NSH e, per ogni crate, il suo `registry()`, che `#[native_module]` genera:

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

`nsh_testing::compile_tsx` compila l'entry una sola volta per più test, e `nsh_testing::start` consegna i
batch a un test che mantiene un proprio modello dello schermo. `examples/rust-exports` testa il proprio entry TSX in questo modo;
`examples/gallery-rs` testa la propria root Rust in TypeScript, con un file di test per circa ogni demo.

<a id="theme"></a>

## Tema

L'aspetto di un'app è proprio dell'app: NSH fornisce le primitive e i componenti base senza stile di `nsh_base`, e
il tuo crate è lo strato con gli stili sopra di essi, la libreria di componenti propria dell'app ([Three layers](./architecture.md#three-layers)). I componenti Rust prendono colori, raggio degli angoli e font da un tema, `theme()` da
`nsh_base`, così un solo file ristila ogni componente dell'app. Ogni colore ha un valore chiaro e uno scuro;
quando il sistema cambia aspetto, un binding come `.bg(move || theme().primary)` cambia colore in modo nativo, senza
render.

Il tema contiene i design token di [shadcn/ui](https://ui.shadcn.com/docs/theming), e il suo valore predefinito è il tema
`neutral` di shadcn, una palette in bianco e nero con un raggio degli angoli di 10 pt. Per usare il tuo, imposta `"theme"` in `nsh.json`
sul percorso di un file di tema, relativo a `nsh.json`, oppure sul contenuto del tema inline:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Un file di tema è il `cssVars` di shadcn, il formato dei temi e degli elementi di registry di shadcn, quindi un tema esportato da
[shadcn's themes](https://ui.shadcn.com/themes) o da [tweakcn](https://tweakcn.com) funziona così com'è. `light` imposta i
valori dell'aspetto chiaro, `dark` quelli dell'aspetto scuro e `theme` quelli di entrambi:

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- Il tuo tema viene applicato sopra il tema predefinito, quindi elenchi solo ciò che cambi. Un valore che `light` imposta e che `dark`
  omette viene usato in entrambi gli aspetti.
- I valori si scrivono come in CSS. I colori sono qualsiasi colore CSS (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`),
  `color-mix(in oklab, var(--primary) 80%, white)`, oppure un altro token dello stesso aspetto, `var(--primary)` (con un
  fallback: `var(--brand, #7c3aed)`). Le lunghezze sono `rem` (16 punti) o `px` (punti). I font sono elenchi di famiglie di font:
  viene usata la prima famiglia che non sia generica, e una prima famiglia generica (`system-ui`, `sans-serif`) indica il
  font di sistema.
- **I tuoi token.** Qualsiasi altro nome è un token dell'app, come lo è una variabile in `@theme` di Tailwind: `"up"` sopra è
  `theme().color("up")` in Rust, `bg-up` / `text-up/70` nelle classi e `token("up")` in TSX
  ([Theme tokens](./tailwind.md#theme-tokens)). Un numero come `"radius-card": "14px"` è `theme().number("radius-card")`
  e `rounded-(--radius-card)`.
- Il bundler controlla il tema durante la build: un file mancante, un JSON non valido o un tema diverso da `cssVars` fa fallire la
  build con un errore `nsh.json: theme: …`.

I token, con i rispettivi valori predefiniti chiaro e scuro (`neutral` di shadcn):

| Token | `theme()` | Chiaro | Scuro | Ruolo |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | Lo sfondo dell'app e il testo su di esso |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Card e superfici raggruppate, e il testo su di esse |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popover, menu e tooltip, e il testo su di essi |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | L'azione principale (un pulsante primario) e il testo su di essa |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Azioni secondarie e il testo su di esse |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | Superfici discrete; testo secondario: didascalie, etichette, placeholder |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Un elemento in hover o evidenziato, come una voce di menu o una riga di lista, e il suo testo |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Azioni distruttive ed errori |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Divisori e bordi |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Il bordo degli input |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Anelli di focus |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | uguali | Le serie di un grafico |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | La superficie di una sidebar, la sua azione principale, il suo elemento evidenziato, i bordi e l'anello di focus |
| `radius` | `radius` | `0.625rem` (10 pt) | | Il raggio degli angoli |
| `font-sans` | `font_sans` | il font di sistema | | Il font dell'app: ogni testo che non imposta una famiglia propria |
| `font-mono` | `font_mono` | il font monospazio di sistema | | Il font monospazio: `font-mono`, il codice in `TextView` |

<a id="several-crates"></a>

## Più crate

Il codice Rust di un'app può essere suddiviso in più crate, ciascuno importato con un proprio specifier: `"rust"` accetta un elenco di percorsi
di crate, e ogni crate al suo interno ha una propria funzione `#[native_module]`.

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

Ogni runner e host li collega tutti, e `.nsh/types` dichiara ogni specifier. I crate condividono codice tramite dipendenze
path di Cargo (`shared = { path = "../shared" }`): un crate di componenti aziendali può essere usato da più crate
ed elencato da più app, e solo i crate elencati in `"rust"` vengono esportati in TSX. Ogni crate elencato ha un proprio nome di
package e un proprio specifier; `nsh` segnala quelli ripetuti indicando i due percorsi che lo condividono. Il
`"root"` di un'app Rust è un componente del primo crate elencato. Durante `nsh run` e `nsh dev`, una modifica a uno qualsiasi di essi, o a un
crate da cui dipendono tramite path, ricompila l'app e la riavvia.

<a id="browser-apis-on-the-web"></a>

## API del browser sul web

Sul web, un crate può chiamare le API del browser (un WebSocket, `IndexedDB`, …) tramite wasm-bindgen e `web-sys`;
`nsh` costruisce con il runtime il codice di collegamento di cui hanno bisogno. Vedi [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## Vedi anche

- [Project structure](./project-structure.md): ogni chiave di `nsh.json`.
- [Web](./web.md#apps-with-rust-components): app Rust nel browser.
- [Networking](./networking.md#from-rust-components): `fetch` da Rust.
- [CLI](./cli.md#nsh-init): `nsh init --template rust` e `--template mixed`.
