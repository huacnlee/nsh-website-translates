---
title: "Entwickeln mit Rust"
description: "Schreiben Sie eine Native Shell App vollständig in Rust, ohne QuickJS auf irgendeiner Plattform, oder in Rust mit TSX-Screens darüber: wann Sie welchen Weg wählen und wie sich beide Komponenten und Module teilen."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---


# Entwickeln mit Rust

Native Shell Apps werden in Rust, in TSX oder in beidem geschrieben. Alle drei laufen auf derselben Engine: Der reaktive Graph, der Renderer, das Taffy-Layout und die nativen Module (Navigation, Dialoge, die Tastatur, die Statusleiste) sind in jedem Fall Rust, und jede Plattform rendert mit ihrer eigenen UI. Der Unterschied liegt in der Sprache deines eigenen Codes und damit darin, ob die App eine JavaScript-VM mitbringt.

| | Rust | TSX | Rust mit TSX |
|---|---|---|---|
| Deine UI, dein State und deine Handler | Rust | TSX auf QuickJS | Rust-Komponenten und -Module, TSX-Screens, die sie verwenden |
| Zur Laufzeit läuft | nur die Engine und dein Crate, auf jeder Plattform und im Browser | QuickJS und die Engine (im Browser deren JavaScript-Engine) | QuickJS und die Engine, mit deinem Crate (im Browser deren JavaScript-Engine) |
| Geeignet für | Mittlere und große Apps mit anspruchsvoller Geschäftslogik | Apps und Module, die zur Laufzeit ausgeliefert werden, schnelle Iteration | Ein Rust-Kern mit Teilen, die sich oft ändern |
| Änderungen | Neu bauen und neu starten | Hot Updates | Hot Updates für TSX, Neu bauen und Neustart für Rust |
| Einstieg | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## Die Wahl

**Rust** eignet sich für Apps mit umfangreicher, anspruchsvoller Geschäftslogik: Trading, Editoren, datenintensive Tools. Du bekommst das Typsystem und die Compile-Time-Prüfungen von Rust für die gesamte App, das crates.io-Ökosystem, native Performance für deinen eigenen Code (nicht nur für den von NSH) und headless Tests der echten UI mit `cargo test`. Die App ist von Anfang bis Ende Rust und nativer Code: Es wird keine JavaScript-VM mitgeliefert oder ausgeführt, weder auf iOS, Android, macOS, Windows, Linux, GPUI noch im Web. Komponenten sind Funktionen, die einmal laufen und Signals an das binden, was sie anzeigen, wie in TSX ([Reaktivität](./reactivity.md)), geschrieben mit typisierten Styles statt Klassen-Strings.

**TSX** eignet sich für UI, die erst nach der Auslieferung der App ankommt: Module, die eine native App zur Laufzeit lädt, die von einem Modell generiert oder von einem anderen Team geschrieben werden, als [signierte Pakete](./signed-packages.md) ausgeliefert und in einer vom Host konfigurierten Sandbox ausgeführt werden, mit Hot Updates während der Entwicklung.

**Rust mit TSX** behält den Rust-Kern und ergänzt TSX dort, wo es sich lohnt: Screens, Einstellungen, Onboarding, Experimente, alles, was du mit Hot Updates iterierst oder zur Laufzeit als [signiertes Paket](./signed-packages.md) auslieferst. TSX importiert deine Rust-Komponenten und -Module wie jedes andere NSH-Modul, sodass sich beide Hälften an typisierten Schnittstellen treffen. Das TSX läuft auf QuickJS, das die App dann mitbringt.

<a id="an-app-written-in-rust"></a>

## Eine App in Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` enthält die App: Komponenten, State, Handler, Tasks.

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

Elemente und Komponenten entstehen auf dieselbe Weise: Eine Funktion erzeugt sie (`view()`, `text(..)`, `button()` von `nsh_base`, `chart()` deines `#[component] fn Chart`). Ihre Methoden setzen die Props, ein Setter pro Prop (ein Wert, ein Signal oder eine Closure), sowie die Listener, eine Methode pro Event. Listener sind Closures über ihr Event (`move |text: &str| ..`), und `move || ..` gilt für ein Event ohne Daten; `.child(..)` nimmt ein Element oder `Option`, `Vec`, ein Array oder einen Iterator von Elementen (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` benennt die Wurzel, und `nsh` mountet sie:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` ist der Pfad der Komponente im Crate (`App`, `shell::Gallery`; beim ersten mit [mehreren Crates](#several-crates)); `"theme"` ist das [Theme](#theme), mit dem ihre Komponenten zeichnen, und `"appearance"` wirkt darauf wie bei einer TSX-App. Damit bauen `nsh run` und `nsh package` im Verzeichnis der App den eigenen Runner der App für das Ziel, mit gemounteter Wurzel und ohne gelinktes QuickJS:

| Ziel | Was läuft |
|---|---|
| macOS, Windows, Linux | Der Release-Runner mit deinem Crate, in einem Fenster; `nsh run` startet einen Debug-Build und zeigt die Logs der App im Terminal |
| iOS, iOS-Simulator, Mac Catalyst | Der iOS-Runner mit deinem Crate, in einer App |
| Android | Die `libnsh.so` der App mit deinem Crate, gestartet von der Activity der Runtime |
| Web | `nsh.wasm` mit der Engine und deinem Crate (3,3 MB für die gesamte Rust-Gallery, 0,75 MB mit Brotli); die Seite mountet die Wurzel |

`nsh` baut, was dein Crate braucht, und nicht mehr: ein kleines Programm aus deinem Crate und dem Kern von NSH, das der CLI seine Komponenten und Module beschreibt und den Rest dann selbst erledigt, sowie den Runner jedes Ziels, das du ausführst oder paketierst. Der erste Build einer neuen Rust-App kompiliert dein Crate und den Kern von NSH, etwa 60 Crates. `nsh test` führt die Tests der App headless in einem auf dieselbe Weise gebauten Runner deines Crates aus.

Unter Linux wählt dein Crate optionale Plattform-Features aus. Aktiviere `webview` in deiner `nsh-platform-linux`-Abhängigkeit, um Web Views zu verwenden; dadurch wird WebKitGTK 6.0 gelinkt, das zum Bauen und Ausführen der App installiert sein muss. Der generierte Runner übernimmt diese Auswahl über die Cargo-Feature-Unifikation.

Während `nsh run` baut eine Änderung am Rust-Code des Crates den Runner neu und startet die App neu; im Browser lädt die geöffnete Seite die neue Runtime selbstständig. `cargo run` startet dieselbe Wurzel direkt auf dem Desktop-Backend (`src/main.rs`), und native Apps, die NSH einbetten, mounten eine Rust-Wurzel mit `AppSource::Rust` auf dem `AppView` von macOS, Windows, Linux, GPUI und iOS.

Code für jede Plattform, einschließlich des Webs, nutzt die Services von NSH: `fetch` für HTTP ([Networking](./networking.md#from-rust-components)), `timer`, `set_timeout` und `set_interval` zum Warten, `nsh_core::time::Instant` und `nsh_core::time::unix_ms()` für die Uhr. `background` und `blocking` führen Arbeit auf den Threads der nativen Ziele aus.

<a id="desktop-title-bars"></a>

## Desktop-Titelleisten

Rust-Apps zeichnen ihre eigenen Titelleisten mit `nsh_core::element::desktop`. Rufe `set_title_bar(TitleBarStyle::Hidden, Some(height))` auf, markiere den Hintergrund der Leiste mit `.window_drag(true)` und reserviere den Platz der nativen Fenstersteuerung mit `title_bar()`. Dessen `top` ist die Höhe der Leiste, und `left` und `right` sind die Breiten, die von den Systemsteuerelementen belegt werden. Das Lesen abonniert Änderungen, einschließlich des Vollbilds. Die Plattform übernimmt das Ziehen des Fensters und das vom Benutzer eingestellte Doppelklickverhalten der Titelleiste; `.window_drag(false)` hält ein Kind aus dem Drag-Bereich seines Elternelements heraus.

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

`set_title_bar(TitleBarStyle::Default, None)` stellt die System-Titelleiste wieder her. `close_window()` folgt dem normalen Fensterschließverhalten des einbettenden Hosts. Das Modul enthält auch die übrigen Funktionen für das Fenster (`set_title`, `minimize`, `toggle_full_screen`, ...) und die Menüs (`set_application_menu`, `popup_menu`): [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## Dateien und Ordner

Auf den Desktops zeigt Rust-Code die Dateidialoge des Systems an und übergibt lokale Pfade an das System, wobei jede Antwort in einem Task erwartet wird: `pick_paths` mit einem `OpenDialog` (`OpenDialog::files()`, `::folders()` oder `::files_and_folders()`), `pick_save_path` mit einem `SaveDialog`, `open_path` (die Standard-App der Datei), `reveal_path` (das im Finder, im Datei-Explorer oder im Dateimanager ausgewählte Element) und `move_to_trash` (wohin das Element gelangt ist, sofern macOS es mitteilt). Die Dialoge antworten mit `Ok(None)`, wenn der Benutzer abbricht, und mit einem Fehler, wenn sie nicht angezeigt werden können (unter Linux ohne File-Chooser-Portal sowie auf iOS, Android und im Web, wo auch `open_path`, `reveal_path` und `move_to_trash` mit einem Fehler antworten). Jede fehlgeschlagene Anfrage antwortet mit ihrem Fehler, nie mit `false`.

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

## Eine Rust-App mit TSX erweitern

Die Funktion `#[native_module("app/native")]` des Crates benennt, was TSX importieren darf: Komponenten (`registry.register::<Chart>()`), Module aus Funktionen (`registry.module::<Portfolio>()`, `#[module]` auf einem Unit-Struct und seinem `impl`), Klassen (`registry.class::<Ledger>()`, `#[class]` auf einem Struct und seinem `impl`) und Assets; das Attribut erzeugt außerdem `pub fn registry()` an der Wurzel des Crates, dieselbe Menge für deine Tests und anderen Rust-Code (`my_app_native::registry()`, neben `nsh_base::registry()`). In einem `#[module]`- oder `#[class]`-`impl` werden die `pub fn`s exportiert (`pub(crate)` ebenfalls); Funktionen ohne Sichtbarkeit sind Helfer, die in Rust bleiben. Ihre TypeScript-Deklarationen, einschließlich der Doc-Kommentare, werden aus den Rust-Typen in `.nsh/types` generiert, sodass TSX von `nsh check` und deinem Editor dagegen geprüft wird:

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

Jeder Export wird in TypeScript durch den Doc-Kommentar des Rust-Elements dokumentiert, das ihn benennt: eine Komponente durch ihr `#[component] fn` (`Chart`), ein Modul und eine Klasse durch ihr Struct (`Portfolio`, `Ledger`) sowie Props, Events, Funktionen und Member durch ihre eigenen (ein Setter braucht keinen neben seinem Getter). Die eigenen Doc-Kommentare des `Props`-Structs und des Event-Enums sowie die der `impl`-Blöcke bleiben in Rust; ein Doc-Kommentar auf einem `#[module]`- oder `#[class]`-`impl`-Block ist ein Compilerfehler, da TypeScript ihn nicht anzeigen würde. Jeder Befehl, der `.nsh/types` schreibt, warnt vor einem Export, den TSX ohne Doc-Kommentar sieht, und nennt ihn (`Ledger.add`, `Chart.range`).

TypeScript zeigt einen Doc-Kommentar bis zu seiner ersten Überschrift an. Hinweise für Rust-Aufrufer, etwa was `&self` ausleiht oder warum eine Funktion `cx` nimmt, stehen unter einer Überschrift, `# Rust` (oder `# Panics`, `# Examples` von rustdoc), und bleiben in den Rust-Docs:

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

Props sind die Felder des `Props`-Structs der Komponente und Events die Varianten ihres `Event`-Enums (`onSelect`), beide in camelCase. Rust-Code platziert dieselbe Komponente mit ihrem Konstruktor, einem Setter pro Prop und einer Listener-Methode pro Event: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. Inhalt, Events und State einer Rust-Komponente bleiben in Rust; TSX reicht Props hinein und hört Events. Ein Prop vom falschen Typ (`level={1.5}` für ein `u32`-Prop) ist eine Warnung, wie bei einem eingebauten Element: Das Prop behält seinen Wert, und der Rest der Komponente wird gerendert.

Eine Funktion oder ein Member läuft so, wie es ihre Rust-Signatur vorgibt. Eine, die nicht `async` ist, läuft innerhalb des TSX-Aufrufs und gibt ihren Wert zurück (`Portfolio.total()` ist eine Zahl, `ledger.balance` eine Property): Sie berechnet und hält State. Eine `async fn` gibt ein Promise zurück und läuft als Task mit den Services von NSH (`fetch`, `timer`, Dialoge). Eine Modulfunktion mit `cx: &mut ModuleCx` erreicht die Plattform in der Reihenfolge der UI (ein Toast, die Statusleiste), ebenso die Ref-Methode einer Komponente; ihr Rückgabetyp entscheidet, was TSX erhält: Eine, die `()` zurückgibt, liefert `void`, ohne Antwort (TSX ruft sie auf und macht weiter); eine, die `Result<(), E>` zurückgibt, liefert `Promise<void>`, das mit der Nachricht des `Err` abgelehnt wird (der Aufruf läuft mit den Änderungen der UI, nachdem der TSX-Aufruf zurückgekehrt ist, daher trägt das Promise seinen Fehler; eines, das niemand awaitet oder abfängt, wird als [unhandled rejection](./dev-server-and-debugging.md#logs) geloggt); eine, die einen Wert zurückgibt, liefert `Promise<T>`. Argumente und Ergebnisse werden anhand der Signatur typisiert: Zahlen, Strings, `Option`, `Vec`, deine `#[derive(JsObject)]`-Structs und `#[derive(PropEnum)]`-Enums, Instanzen deiner Klassen und TSX-Funktionen (`Callback<A, R>`, die Rust sofort innerhalb eines Aufrufs oder später mit `post` und `call_async` aufruft; TS sieht `(value: number) => void` für ein `Callback<f64>`, und `#[args(balance)] listener: Callback<f64>` benennt das Argument, `(balance: number) => void`). Eine Funktion, die mit dem Lauschen beginnt, heißt `on(event, listener)` und gibt `Stop` zurück (`Stop::new(|| …)`), das TSX als Funktion erhält, die es beendet (`() => void`); sie läuft einmal, wenn TSX sie aufruft oder wenn das, was `on` aufgerufen hat, endet (eine Komponente oder der Lauf des Moduls unter Hot Reload). Der Handler eines Events erhält ein Objekt: Der Wert einer Variante ist ihr Feld `value`, das `#[args(price)]` an der Variante benennt (`onSelect({ price })`), und `#[args(open, reason)]` benennt die Felder einer Variante mit mehreren. Ein Argument vom falschen Typ wirft im Aufruf einen `TypeError` oder lehnt das Promise einer Funktion ab, die ein Promise zurückgibt; ein `Err` wirft (oder lehnt ab) mit seiner Nachricht. Das Objekt einer Klasse besitzt seinen Rust-Wert: Er wird freigegeben, wenn das Objekt eingesammelt wird, oder sofort mit `ledger.dispose()` (auch `using ledger = new Ledger()`). Nenne den TSX-Einstiegspunkt, um ihn auszuführen, `nsh run App.tsx` oder `nsh package App.tsx --target …`: TSX-Änderungen sind Hot Updates, Rust-Änderungen bauen die App neu und starten sie neu. Die CLI bündelt und kompiliert das TSX selbst und kennt die Exporte deines Crates aus dessen Beschreibung; die Entwicklungs-Hosts und der headless Runner von `nsh test` werden mit deinem Crate und QuickJS gebaut.

`examples/rust-exports` im Repository ist die Referenz für das Exportieren: eine kleine TSX-App, deren Crate eine Komponente (Props erforderlich, mit Standardwert und optional, ein Event, Children), ein Modul (je eine Funktion jeder Art) und eine Klasse (ein Konstruktor, Methoden, ein Getter und ein Setter, ein Static, ein `async`-Member, eine andere Instanz als Argument, ein Callback, an den Rust postet, `dispose()` und `using`) exportiert, jeweils mit einem kurzen Doc-Kommentar, sowie Tests in Rust und in TypeScript (`App.test.tsx`), die durch die App klicken und prüfen, was jeder Export anzeigt.

`examples/gallery-rs` im Repository ist eine vollständige Rust-App: Jede Demo ist Rust, `nsh run examples/gallery-rs --target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` führt ihre Tests headless aus, und `cargo run -p gallery-native` startet sie auf dem Desktop-Backend.

<a id="render-functions-and-the-apps-classes"></a>

### Render-Funktionen und die Klassen der App

Eine Komponente zeichnet Inhalt der App für Werte, die sie hat (eine Zeile ihrer Daten, einen Codeblock eines Dokuments), mit einer Render-Funktion: einem Prop `Option<Renderer<T>>`, in TypeScript `(value: T) => JSX.Element`. Die Komponente ruft `render(key, value)` dort auf, wo der Inhalt hingehört, und erhält eine View, die sie wie jede andere stylt und platziert (innerhalb eines `text(..)` eine Inline-View). Der Inhalt wird pro Key vorgehalten, solange der Wert gleich bleibt, und neu gerendert, wenn er sich ändert. Ein Rust-Parent übergibt dem Setter des Props eine Closure (`quote().render_badge(|symbol| ..)`), die daraus das `Renderer` macht.

Styles in einer Komponente sind typisiert; die Tailwind-Klassen der App erreichen einen ihrer Teile über ein Prop für Klassen und `.app_class(..)` am Element dieses Teils. Sie werden nach den eigenen Styles des Elements angewendet, mit dem Theme der App, `dark:` und den States, wie `class` an einem Element.

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

`TextView` in `nsh/base` ist auf diese Weise gebaut: Seine `renderCodeBlock`, `renderMath`, ... sind Render-Funktionen, und seine `classes` sind die Klassen der App je Teil ([TextView](../elements/text-view.md)).
<a id="testing"></a>

## Testen

Die Tests einer Rust-App führen sie headless aus, in `cargo test` oder in `nsh test`, mit demselben Treiber: auf der echten Engine, ohne Fenster, mit Display-Frames bei 60 Hz, sodass Timer, Tasks und Animationen wie auf dem Bildschirm laufen. Der Treiber startet die App, führt ein Modell der angezeigten Views und führt Schritte aus (`press`, `type_text`, `submit`, `scroll`, `wait_for`) auf Views, die über Selektoren benannt werden (ein Text, ein Accessibility-Label oder eine Test-ID; `text:`, `label:`, `id:`). Ein Schritt, der sich nicht ausführen lässt, schlägt mit den auf dem Bildschirm sichtbaren Texten fehl.

In `cargo test` führt `nsh_testing::Headless` (die Default-Features von nsh-testing, ohne QuickJS) das Root aus (`app.screen()`: die Texte auf dem Bildschirm, die gesendeten Befehle). `EngineConfig::new` ist eine Engine in Smartphone-Größe, bei der sonst nichts gesetzt ist. `nsh test` führt TypeScript-Tests ([Testen](./testing-and-trace.md)) in einem headless Runner aus, der mit Ihren Crates gebaut wird, wobei `open(".")` das Root einer Rust-App startet:

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

Ein TSX-Entry wird mit dem Feature `bundle` von `nsh-testing` gebaut, so wie `nsh run` ihn baut, und zwar gegen die UI-Sets, die seine Hosts bereitstellen: die von NSH und das `registry()` jedes Crates, das `#[native_module]` erzeugt:

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

`nsh_testing::compile_tsx` baut den Entry einmal für mehrere Tests, und `nsh_testing::start` reicht die Batches an einen Test weiter, der sein eigenes Modell des Bildschirms führt. `examples/rust-exports` testet seinen TSX-Entry auf diese Weise; `examples/gallery-rs` testet sein Rust-Root in TypeScript, mit etwa einer Testdatei pro Demo.

## Theme

Das Erscheinungsbild einer App gehört der App selbst: NSH liefert die Primitives und die ungestylten Basiskomponenten von `nsh_base`, und Ihr Crate ist die gestylte Schicht darüber, die App-eigene Komponentenbibliothek ([Drei Schichten](./architecture.md#three-layers)). Rust-Komponenten beziehen ihre Farben, den Eckenradius und die Schriften aus einem Theme, `theme()` aus `nsh_base`, sodass eine einzige Datei jede Komponente der App neu gestaltet. Jede Farbe hat einen hellen und einen dunklen Wert; wenn das System das Erscheinungsbild wechselt, ändert ein Binding wie `.bg(move || theme().primary)` die Farbe nativ, ohne Render.

Das Theme enthält die Design-Tokens von [shadcn/ui](https://ui.shadcn.com/docs/theming), und sein Standard ist das `neutral`-Theme von shadcn, eine Schwarz-Weiß-Palette mit einem Eckenradius von 10 pt. Um ein eigenes Theme zu verwenden, setzen Sie `"theme"` in `nsh.json` auf den Pfad einer Theme-Datei, relativ zu `nsh.json`, oder auf den Inhalt des Themes inline:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Eine Theme-Datei ist ein `cssVars` von shadcn, das Format der Themes und Registry-Items von shadcn, sodass ein von [shadcn's themes](https://ui.shadcn.com/themes) oder [tweakcn](https://tweakcn.com) exportiertes Theme unverändert funktioniert. `light` legt die Werte des hellen Erscheinungsbilds fest, `dark` die des dunklen und `theme` die für beide:

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

- Ihr Theme wird über das Standard-Theme gelegt, Sie listen also nur auf, was Sie ändern. Ein Wert, den `light` setzt und `dark` weglässt, wird in beiden Erscheinungsbildern verwendet.
- Werte werden wie in CSS geschrieben. Farben sind beliebige CSS-Farben (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`), `color-mix(in oklab, var(--primary) 80%, white)` oder ein anderer Token desselben Erscheinungsbilds, `var(--primary)` (mit einem Fallback: `var(--brand, #7c3aed)`). Längen sind `rem` (16 Punkte) oder `px` (Punkte). Schriften sind Listen von Schriftfamilien: Verwendet wird die erste Familie, die keine generische ist, und eine generische erste Familie (`system-ui`, `sans-serif`) bedeutet die Systemschrift.
- **Eigene Tokens.** Jeder andere Name ist ein Token der App, so wie eine Variable in Tailwinds `@theme`: `"up"` oben ist `theme().color("up")` in Rust, `bg-up` / `text-up/70` in Klassen und `token("up")` in TSX ([Theme-Tokens](./tailwind.md#theme-tokens)). Eine Zahl wie `"radius-card": "14px"` ist `theme().number("radius-card")` und `rounded-(--radius-card)`.
- Der Bundler prüft das Theme beim Build: Eine fehlende Datei, ungültiges JSON oder ein anderes Theme als `cssVars` lässt den Build mit einem `nsh.json: theme: …`-Fehler fehlschlagen.

Die Tokens mit ihren hellen und dunklen Standardwerten (`neutral` von shadcn):

| Token | `theme()` | Hell | Dunkel | Rolle |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | Der Hintergrund der App und der Text darauf |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Cards und gruppierte Flächen und der Text darauf |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popovers, Menüs und Tooltips und der Text darauf |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | Die Hauptaktion (ein primärer Button) und der Text darauf |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Sekundäre Aktionen und der Text darauf |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | Zurückhaltende Flächen; sekundärer Text: Beschriftungen, Labels, Platzhalter |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Ein überfahrenes oder hervorgehobenes Element, etwa ein Menüeintrag oder eine Listenzeile, und sein Text |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Destruktive Aktionen und Fehler |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Trennlinien und Rahmen |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Der Rahmen von Eingabefeldern |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Fokusringe |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | dieselben | Die Datenreihen eines Diagramms |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | Die Fläche einer Sidebar, ihre Hauptaktion, ihr hervorgehobenes Element, Rahmen und Fokusring |
| `radius` | `radius` | `0.625rem` (10 pt) | | Der Eckenradius |
| `font-sans` | `font_sans` | die Systemschrift | | Die Schrift der App: jeder Text, der keine eigene Familie festlegt |
| `font-mono` | `font_mono` | die Monospace-Systemschrift | | Die Festbreitenschrift: `font-mono`, Code in `TextView` |

<a id="several-crates"></a>

## Mehrere Crates

Der Rust-Code einer App kann auf mehrere Crates aufgeteilt werden, die jeweils über einen eigenen Specifier importiert werden: `"rust"` nimmt eine Liste von Crate-Pfaden entgegen, und jedes Crate darin hat seine eigene `#[native_module]`-Funktion.

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

Jeder Runner und jeder Host linkt alle Crates, und `.nsh/types` deklariert jeden Specifier. Crates teilen Code über Cargo-Path-Dependencies (`shared = { path = "../shared" }`): Ein Crate mit Unternehmenskomponenten kann von mehreren Crates verwendet und von mehreren Apps aufgelistet werden, und nur die in `"rust"` aufgeführten Crates werden nach TSX exportiert. Jedes aufgeführte Crate hat einen eigenen Paketnamen und einen eigenen Specifier; `nsh` meldet einen doppelt vergebenen zusammen mit den beiden Pfaden, die ihn teilen. Das `"root"` einer Rust-App ist eine Komponente des ersten aufgeführten Crates. Während `nsh run` und `nsh dev` baut eine Änderung an einem von ihnen oder an einem Crate, von dem sie per Pfad abhängen, die App neu und startet sie neu.

<a id="browser-apis-on-the-web"></a>

## Browser-APIs im Web

Im Web kann ein Crate die APIs des Browsers (einen WebSocket, `IndexedDB`, …) über wasm-bindgen und `web-sys` aufrufen; `nsh` baut den dafür nötigen Glue zusammen mit der Runtime. Siehe [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## Siehe auch

- [Projektstruktur](./project-structure.md): jeder Schlüssel von `nsh.json`.
- [Web](./web.md#apps-with-rust-components): Rust-Apps im Browser.
- [Netzwerk](./networking.md#from-rust-components): `fetch` aus Rust.
- [CLI](./cli.md#nsh-init): `nsh init --template rust` und `--template mixed`.
