---
title: "Développer avec Rust"
description: "Écrivez une application Native Shell entièrement en Rust, sans QuickJS sur aucune plateforme, ou en Rust avec des écrans TSX par-dessus : quand choisir l'une ou l'autre approche, et comment les deux partagent composants et modules."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# Créer une application avec Rust

Les applications Native Shell s'écrivent en Rust, en TSX, ou avec les deux. Les trois approches reposent sur le même moteur : le graphe réactif, le moteur de rendu, la mise en page Taffy et les modules natifs (navigation, boîtes de dialogue, clavier, barre d'état) sont en Rust dans tous les cas, et chaque plateforme affiche son interface native. Ce qui change, c'est le langage de votre propre code, et donc la présence ou non d'une machine virtuelle JavaScript dans l'application.

| | Rust | TSX | Rust avec TSX |
|---|---|---|---|
| Votre interface, votre état et vos gestionnaires | Rust | TSX sur QuickJS | Composants et modules en Rust, écrans en TSX qui les utilisent |
| L'application exécute | uniquement le moteur et votre crate, sur toutes les plateformes et dans le navigateur | QuickJS et le moteur (dans le navigateur, son moteur JavaScript) | QuickJS et le moteur, avec votre crate (dans le navigateur, son moteur JavaScript) |
| Convient à | Applications moyennes et grandes avec une logique métier exigeante | Applications et modules livrés à l'exécution, itération rapide | Un cœur en Rust dont certaines parties changent souvent |
| Modifications | Recompiler et redémarrer | Mises à jour à chaud | Mises à jour à chaud pour le TSX, recompilation et redémarrage pour le Rust |
| Démarrer | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## Choisir

**Rust** convient aux applications dont la logique métier est vaste et exigeante : trading, éditeurs, outils centrés sur les données. Vous bénéficiez du système de types de Rust et des vérifications à la compilation sur toute l'application, de l'écosystème crates.io, de performances natives pour votre propre code (et pas seulement pour celui de NSH), et de tests headless de l'interface réelle avec `cargo test`. L'application est du Rust et du code natif de bout en bout : aucune machine virtuelle JavaScript n'est livrée avec elle ni ne s'y exécute, sur iOS, Android, macOS, Windows, Linux, GPUI et le web. Les composants sont des fonctions qui s'exécutent une seule fois et lient des signaux à ce qu'elles affichent, comme en TSX ([Réactivité](./reactivity.md)), écrites avec des styles typés plutôt que des chaînes de classes.

**TSX** convient à l'interface qui arrive après la livraison de l'application : des modules qu'une application native charge à l'exécution, générés par un modèle ou écrits par une autre équipe, livrés sous forme de [paquets signés](./signed-packages.md) et exécutés dans un bac à sable configuré par l'hôte, avec des mises à jour à chaud pendant le développement.

**Rust avec TSX** conserve le cœur en Rust et ajoute du TSX là où cela rapporte : écrans, réglages, onboarding, expériences, tout ce que vous itérez avec des mises à jour à chaud ou livrez à l'exécution sous forme de [paquet signé](./signed-packages.md). Le TSX importe vos composants et modules Rust comme n'importe quel module NSH, de sorte que les deux moitiés se rejoignent via des interfaces typées. Le TSX s'exécute sur QuickJS, que l'application embarque alors.

<a id="an-app-written-in-rust"></a>

## Une application écrite en Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` contient l'application : composants, état, gestionnaires, tâches.

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

Les éléments et les composants se construisent de la même manière : une fonction en crée un (`view()`, `text(..)`, le `button()` de `nsh_base`, le `chart()` de votre `#[component] fn Chart`), et ses méthodes définissent ses props, un setter par prop (une valeur, un signal ou une closure), ainsi que ses écouteurs, une méthode par événement. Les écouteurs sont des closures de leur événement (`move |text: &str| ..`), et `move || ..` pour un événement sans données ; `.child(..)` accepte un élément, ou un `Option`, un `Vec`, un tableau ou un itérateur d'éléments (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` désigne la racine, et `nsh` la monte :

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` est le chemin du composant dans la crate (`App`, `shell::Gallery` ; dans la première avec [plusieurs crates](#several-crates)) ; `"theme"` est le [thème](#theme) avec lequel ses composants s'affichent, et `"appearance"` s'y applique comme dans une application TSX. Avec cela, `nsh run` et `nsh package` dans le répertoire de l'application construisent le runner propre à l'application pour la cible, avec la racine montée et sans QuickJS lié :

| Cible | Ce qui s'exécute |
|---|---|
| macOS, Windows, Linux | Le runner release avec votre crate, dans une fenêtre ; `nsh run` exécute une build debug et affiche les journaux de l'application dans le terminal |
| iOS, simulateur iOS, Mac Catalyst | Le runner iOS avec votre crate, dans une application |
| Android | Le `libnsh.so` de l'application avec votre crate, démarré par l'activité du runtime |
| Web | `nsh.wasm` avec le moteur et votre crate (3,3 Mo pour toute la galerie Rust, 0,75 Mo avec brotli) ; la page monte la racine |

`nsh` construit ce dont votre crate a besoin et rien de plus : un petit programme composé de votre crate et du cœur de NSH qui décrit ses composants et ses modules à la CLI, laquelle fait ensuite tout le reste elle-même, ainsi que le runner de chaque cible que vous exécutez ou empaquetez. La première build d'une nouvelle application Rust compile votre crate et le cœur de NSH, soit environ 60 crates. `nsh test` exécute les tests de l'application en mode headless dans un runner de votre crate construit de la même façon.

Sous Linux, votre crate sélectionne des fonctionnalités optionnelles de la plateforme. Activez `webview` sur votre dépendance `nsh-platform-linux` pour utiliser les web views ; cela lie WebKitGTK 6.0, qui doit être installé pour compiler et exécuter l'application. Le runner généré hérite de ce choix grâce à l'unification des fonctionnalités de Cargo.

Pendant `nsh run`, une modification du code Rust de la crate reconstruit le runner et redémarre l'application ; dans le navigateur, la page ouverte charge d'elle-même le nouveau runtime. `cargo run` démarre la même racine directement sur le backend desktop (`src/main.rs`), et les applications natives qui embarquent NSH montent une racine Rust avec `AppSource::Rust` sur le `AppView` de macOS, Windows, Linux, GPUI et iOS.

Le code destiné à toutes les plateformes, web comprise, utilise les services de NSH : `fetch` pour HTTP ([Réseau](./networking.md#from-rust-components)), `timer`, `set_timeout` et `set_interval` pour attendre, `nsh_core::time::Instant` et `nsh_core::time::unix_ms()` pour l'horloge. `background` et `blocking` exécutent du travail sur les threads des cibles natives.

<a id="desktop-title-bars"></a>

## Barres de titre desktop

Les applications Rust dessinent leurs propres barres de titre avec `nsh_core::element::desktop`. Appelez `set_title_bar(TitleBarStyle::Hidden, Some(height))`, marquez l'arrière-plan de la barre avec `.window_drag(true)`, et réservez l'espace des contrôles de fenêtre natifs avec `title_bar()`. Son `top` est la hauteur de la barre, et `left` et `right` sont les largeurs occupées par les contrôles du système. Sa lecture s'abonne aux changements, y compris le plein écran. La plateforme gère le déplacement de la fenêtre et le comportement du double-clic sur la barre de titre configuré par l'utilisateur ; `.window_drag(false)` garde un enfant en dehors de la zone de déplacement de son parent.

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

`set_title_bar(TitleBarStyle::Default, None)` rétablit la barre de titre du système. `close_window()` suit le comportement normal de fermeture de fenêtre de l'hôte qui embarque l'application. Le module contient aussi les autres fonctions de fenêtre (`set_title`, `minimize`, `toggle_full_screen`, ...) et les menus (`set_application_menu`, `popup_menu`) : [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## Fichiers et dossiers

Sur les desktops, le code Rust affiche les boîtes de dialogue de fichiers du système et transmet des chemins locaux au système, chaque réponse étant attendue dans une tâche : `pick_paths` avec un `OpenDialog` (`OpenDialog::files()`, `::folders()` ou `::files_and_folders()`), `pick_save_path` avec un `SaveDialog`, `open_path` (l'application par défaut du fichier), `reveal_path` (l'élément sélectionné dans le Finder, l'Explorateur de fichiers ou le gestionnaire de fichiers) et `move_to_trash` (où l'élément est allé, quand macOS l'indique). Les boîtes de dialogue répondent `Ok(None)` lorsque l'utilisateur annule, et une erreur lorsqu'elles ne peuvent pas s'afficher (sous Linux sans portail de sélection de fichiers, ainsi que sur iOS, Android et le web, où `open_path`, `reveal_path` et `move_to_trash` répondent aussi une erreur). Toute requête qui échoue répond son erreur, jamais `false`.

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

## Étendre une application Rust avec TSX

La fonction `#[native_module("app/native")]` de la crate désigne ce que le TSX peut importer : des composants (`registry.register::<Chart>()`), des modules de fonctions (`registry.module::<Portfolio>()`, `#[module]` sur une struct unitaire et son `impl`), des classes (`registry.class::<Ledger>()`, `#[class]` sur une struct et son `impl`) et des assets ; l'attribut génère aussi `pub fn registry()` à la racine de la crate, le même ensemble pour vos tests et le reste du code Rust (`my_app_native::registry()`, à côté de `nsh_base::registry()`). Dans un `#[module]` ou un `#[class]` `impl`, les `pub fn` sont exportées (`pub(crate)` aussi) ; les fonctions sans visibilité sont des helpers qui restent en Rust. Leurs déclarations TypeScript, commentaires de documentation compris, sont générées à partir des types Rust dans `.nsh/types`, de sorte que le TSX est vérifié par rapport à elles par `nsh check` et votre éditeur :

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

Chaque export est documenté en TypeScript par le commentaire de documentation de l'élément Rust qui le désigne : un composant par son `#[component] fn` (`Chart`), un module et une classe par leur struct (`Portfolio`, `Ledger`), et les props, événements, fonctions et membres par les leurs (un setter n'en a pas besoin à côté de son getter). Les commentaires de documentation de la struct `Props` et de l'enum des événements, ainsi que ceux des blocs `impl`, restent en Rust ; un commentaire de documentation sur un bloc `#[module]` ou `#[class]` `impl` est une erreur de compilation, puisque TypeScript ne l'afficherait pas. Chaque commande qui écrit `.nsh/types` avertit d'un export que le TSX voit sans commentaire de documentation, en le nommant (`Ledger.add`, `Chart.range`).

TypeScript affiche un commentaire de documentation jusqu'à son premier titre. Les notes destinées aux appelants Rust, par exemple ce que `&self` emprunte ou pourquoi une fonction prend `cx`, vont sous un titre, `# Rust` (ou `# Panics` de rustdoc, `# Examples`), et restent dans la documentation Rust :

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

Les props sont les champs de la struct `Props` du composant et les événements les variantes de son enum `Event` (`onSelect`), tous en camel case. Le code Rust place le même composant avec son constructeur, un setter par prop et une méthode d'écouteur par événement : `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. Le contenu, les événements et l'état propres à un composant Rust restent en Rust ; le TSX transmet des props et entend les événements. Une prop d'un mauvais type (`level={1.5}` pour une prop `u32`) produit un avertissement, comme sur un élément intégré : la prop conserve sa valeur et le reste du composant s'affiche.

Une fonction ou un membre s'exécute comme l'indique sa signature Rust. Celui qui n'est pas `async` s'exécute dans l'appel TSX et renvoie sa valeur (`Portfolio.total()` est un nombre, `ledger.balance` une propriété) : il calcule et conserve un état. Un `async fn` renvoie une Promise et s'exécute comme une tâche avec les services de NSH (`fetch`, `timer`, boîtes de dialogue). Une fonction de module qui prend `cx: &mut ModuleCx` atteint la plateforme dans l'ordre avec l'interface (un toast, la barre d'état), tout comme la méthode de ref d'un composant ; leur type de retour décide de ce que le TSX reçoit : celle qui renvoie `()` donne `void`, sans réponse (le TSX l'appelle et poursuit) ; celle qui renvoie `Result<(), E>` donne `Promise<void>`, qui rejette avec le message de `Err` (l'appel s'exécute avec les changements de l'interface, après le retour de l'appel TSX, si bien que la Promise porte son erreur ; une Promise que personne n'attend ni ne rattrape est journalisée comme un [rejet non géré](./dev-server-and-debugging.md#logs)) ; celle qui renvoie une valeur donne `Promise<T>`. Les arguments et les résultats sont typés d'après la signature : nombres, chaînes, `Option`, `Vec`, vos structs `#[derive(JsObject)]` et enums `#[derive(PropEnum)]`, instances de vos classes, et fonctions TSX (`Callback<A, R>`, que Rust appelle immédiatement dans un appel, ou plus tard avec `post` et `call_async` ; TS voit `(value: number) => void` pour un `Callback<f64>`, et `#[args(balance)] listener: Callback<f64>` nomme l'argument, `(balance: number) => void`). Une fonction qui commence à écouter se nomme `on(event, listener)` et renvoie `Stop` (`Stop::new(|| …)`), que le TSX reçoit sous la forme d'une fonction qui l'arrête (`() => void`) ; elle s'exécute une fois, quand le TSX l'appelle ou quand ce qui a appelé `on` disparaît (un composant, ou l'exécution du module sous le rechargement à chaud). Le gestionnaire d'un événement reçoit un seul objet : la valeur d'une variante est son champ `value`, que `#[args(price)]` sur la variante nomme (`onSelect({ price })`), et `#[args(open, reason)]` nomme les champs d'une variante à plusieurs champs. Un argument d'un mauvais type lève une `TypeError` dans l'appel, ou rejette la Promise de celui qui renvoie une Promise ; un `Err` lève (ou rejette) avec son message. L'objet d'une classe possède sa valeur Rust : elle est libérée lorsque l'objet est collecté, ou immédiatement avec `ledger.dispose()` (aussi `using ledger = new Ledger()`). Nommez l'entrée TSX pour l'exécuter, `nsh run App.tsx` ou `nsh package App.tsx --target …` : les modifications du TSX sont des mises à jour à chaud, celles du Rust reconstruisent et redémarrent l'application. La CLI regroupe et compile elle-même le TSX, en connaissant les exports de votre crate grâce à sa description ; les hôtes de développement et le runner headless de `nsh test` sont construits avec votre crate et QuickJS.

`examples/rust-exports` dans le dépôt est la référence pour l'export : une petite application TSX dont la crate exporte un composant (props requises, avec valeur par défaut et optionnelles, un événement, des enfants), un module (une fonction de chaque type) et une classe (un constructeur, des méthodes, un getter et un setter, un membre statique, un membre `async`, une autre instance en argument, un callback vers lequel Rust poste, `dispose()` et `using`), chacun avec un court commentaire de documentation, et des tests, en Rust et en TypeScript (`App.test.tsx`), qui parcourent l'application et vérifient ce que chacun affiche.

`examples/gallery-rs` dans le dépôt est une application Rust complète : chaque démo est en Rust, `nsh run examples/gallery-rs --target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` exécute ses tests en mode headless, et `cargo run -p gallery-native` la démarre sur le backend desktop.
<a id="render-functions-and-the-apps-classes"></a>

### Fonctions de rendu et classes de l'app

Un composant dessine le contenu propre à l'app pour les valeurs qu'il possède (une ligne de ses données, un bloc de code d'un document) avec une fonction de rendu : une prop `Option<Renderer<T>>`, en TypeScript `(value: T) => JSX.Element`. Le composant appelle `render(key, value)` là où le contenu doit apparaître et obtient une vue qu'il stylise et place comme n'importe quelle autre (dans un `text(..)`, une vue en ligne). Le contenu est conservé par clé tant que la valeur reste égale, et rendu à nouveau lorsqu'elle change. Un parent Rust passe une closure au setter de la prop (`quote().render_badge(|symbol| ..)`), qui en fait le `Renderer`.

Les styles d'un composant sont typés ; les classes Tailwind de l'app atteignent l'une de ses parties via une prop de classes et `.app_class(..)` sur l'élément de cette partie. Elles s'appliquent après les styles propres de l'élément, avec le thème de l'app, `dark:` et les états, comme le fait `class` sur un élément.

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

`TextView` dans `nsh/base` est construit ainsi : ses `renderCodeBlock`, `renderMath`, ... sont des fonctions de rendu, et ses `classes` sont les classes de l'app par partie ([TextView](../elements/text-view.md)).

<a id="testing"></a>

## Tests

Les tests d'une app Rust l'exécutent sans interface (headless), dans `cargo test` ou dans `nsh test`, avec le même driver : sur le vrai moteur, sans fenêtre, avec des frames d'affichage à 60 Hz, de sorte que les timers, les tâches et les animations s'exécutent comme à l'écran. Le driver démarre l'app, tient un modèle des vues qu'elle affiche et effectue des actions (`press`, `type_text`, `submit`, `scroll`, `wait_for`) sur des vues désignées par des sélecteurs (un texte, un libellé d'accessibilité ou un test id ; `text:`, `label:`, `id:`) ; une action impossible à effectuer échoue en indiquant les textes à l'écran.

Dans `cargo test`, `nsh_testing::Headless` (les features par défaut de nsh-testing, sans QuickJS) exécute la racine (`app.screen()` : les textes à l'écran, les commandes qu'elle a envoyées) ; `EngineConfig::new` est un moteur de la taille d'un téléphone sans rien d'autre de configuré. `nsh test` exécute des tests TypeScript ([Testing](./testing-and-trace.md)) dans un runner headless construit avec vos crates, où `open(".")` démarre la racine d'une app Rust :

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

Une entrée TSX est construite avec la feature `bundle` de `nsh-testing` comme le fait `nsh run`, face aux ensembles d'UI que ses hôtes fournissent : ceux de NSH, et le `registry()` de chaque crate, que `#[native_module]` génère :

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

`nsh_testing::compile_tsx` construit l'entrée une seule fois pour plusieurs tests, et `nsh_testing::start` transmet les lots à un test qui tient son propre modèle de l'écran. `examples/rust-exports` teste son entrée TSX de cette manière ; `examples/gallery-rs` teste sa racine Rust en TypeScript, avec un fichier de test pour presque chaque démo.

<a id="theme"></a>

## Thème

L'apparence d'une app lui appartient : NSH fournit les primitives et les composants de base non stylisés de `nsh_base`, et votre crate est la couche stylisée par-dessus, la bibliothèque de composants propre à l'app ([Three layers](./architecture.md#three-layers)). Les composants Rust tirent leurs couleurs, leur rayon de coin et leurs polices d'un thème, `theme()` depuis `nsh_base`, de sorte qu'un seul fichier restylise tous les composants de l'app. Chaque couleur a une valeur claire et une valeur sombre ; lorsque le système change d'apparence, un binding tel que `.bg(move || theme().primary)` change de couleur nativement, sans nouveau rendu.

Le thème reprend les design tokens de [shadcn/ui](https://ui.shadcn.com/docs/theming), et son thème par défaut est le thème `neutral` de shadcn, une palette noir et blanc avec un rayon de coin de 10 pt. Pour utiliser le vôtre, définissez `"theme"` dans `nsh.json` avec le chemin d'un fichier de thème, relatif à `nsh.json`, ou avec le contenu du thème en ligne :

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Un fichier de thème est le `cssVars` de shadcn, le format des thèmes et des registry items de shadcn, de sorte qu'un thème exporté depuis [shadcn's themes](https://ui.shadcn.com/themes) ou [tweakcn](https://tweakcn.com) fonctionne tel quel. `light` définit les valeurs de l'apparence claire, `dark` celles de l'apparence sombre, et `theme` celles des deux :

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

- Votre thème est appliqué par-dessus le thème par défaut : vous ne listez donc que ce que vous modifiez. Une valeur que `light` définit et que `dark` omet est utilisée dans les deux apparences.
- Les valeurs s'écrivent comme en CSS. Les couleurs sont n'importe quelle couleur CSS (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`), `color-mix(in oklab, var(--primary) 80%, white)`, ou un autre token de la même apparence, `var(--primary)` (avec une valeur de repli : `var(--brand, #7c3aed)`). Les longueurs sont `rem` (16 points) ou `px` (points). Les polices sont des listes de familles de polices : la première famille qui n'est pas générique est utilisée, et une première famille générique (`system-ui`, `sans-serif`) désigne la police système.
- **Vos propres tokens.** Tout autre nom est un token de l'app, comme une variable dans le `@theme` de Tailwind : `"up"` ci-dessus devient `theme().color("up")` en Rust, `bg-up` / `text-up/70` dans les classes et `token("up")` en TSX ([Theme tokens](./tailwind.md#theme-tokens)). Un nombre tel que `"radius-card": "14px"` devient `theme().number("radius-card")` et `rounded-(--radius-card)`.
- Le bundler vérifie le thème lors du build : un fichier manquant, un JSON invalide ou un thème autre que `cssVars` fait échouer le build avec une erreur `nsh.json: theme: …`.

Les tokens, avec leurs valeurs claires et sombres par défaut (`neutral` de shadcn) :

| Token | `theme()` | Clair | Sombre | Rôle |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | L'arrière-plan de l'app, et le texte qui s'y affiche |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Les cartes et surfaces groupées, et le texte qui s'y affiche |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Les popovers, menus et infobulles, et le texte qui s'y affiche |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | L'action principale (un bouton principal), et le texte qui s'y affiche |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Les actions secondaires, et le texte qui s'y affiche |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | Les surfaces discrètes ; le texte secondaire : légendes, libellés, placeholders |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Un élément survolé ou mis en évidence, comme un élément de menu ou une ligne de liste, et son texte |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Les actions destructrices et les erreurs |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Les séparateurs et les bordures |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | La bordure des champs de saisie |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Les anneaux de focus |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | identique | Les séries d'un graphique |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | La surface d'une barre latérale, son action principale, son élément mis en évidence, ses bordures et son anneau de focus |
| `radius` | `radius` | `0.625rem` (10 pt) | | Le rayon de coin |
| `font-sans` | `font_sans` | la police système | | La police de l'app : tout texte qui ne définit pas sa propre famille |
| `font-mono` | `font_mono` | la police monospace du système | | La police à chasse fixe : `font-mono`, le code dans `TextView` |

<a id="several-crates"></a>

## Plusieurs crates

Le code Rust d'une app peut être réparti en plusieurs crates, chacune importée par son propre spécificateur : `"rust"` prend une liste de chemins de crates, et chaque crate de cette liste a sa propre fonction `#[native_module]`.

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

Chaque runner et chaque hôte les lie toutes, et `.nsh/types` déclare chaque spécificateur. Les crates partagent du code via des dépendances par chemin de Cargo (`shared = { path = "../shared" }`) : une crate de composants d'entreprise peut être utilisée par plusieurs crates et listée par plusieurs apps, et seules les crates listées dans `"rust"` sont exportées vers TSX. Chaque crate listée a son propre nom de package et son propre spécificateur ; `nsh` signale un doublon avec les deux chemins qui le partagent. Le `"root"` d'une app Rust est un composant de la première crate listée. Pendant `nsh run` et `nsh dev`, une modification de l'une d'elles, ou d'une crate dont elles dépendent par chemin, reconstruit l'app et la redémarre.

<a id="browser-apis-on-the-web"></a>

## API du navigateur sur le web

Sur le web, une crate peut appeler les API du navigateur (un WebSocket, `IndexedDB`, …) via wasm-bindgen et `web-sys` ; `nsh` construit le code de liaison dont elles ont besoin avec le runtime. Voir [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## Voir aussi

- [Project structure](./project-structure.md) : chaque clé de `nsh.json`.
- [Web](./web.md#apps-with-rust-components) : les apps Rust dans le navigateur.
- [Networking](./networking.md#from-rust-components) : `fetch` depuis Rust.
- [CLI](./cli.md#nsh-init) : `nsh init --template rust` et `--template mixed`.
