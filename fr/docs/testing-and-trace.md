---
title: "Tests"
description: "Testez les applications en mode headless, en Rust avec cargo test et nsh_testing ou en TypeScript avec nsh test : ouvrez l'application, appuyez, saisissez du texte, faites défiler et attendez comme un utilisateur, simulez le réseau et le stockage, puis lisez les opérations de vues natives et les durées qu'affiche --trace ; testID pour les tests d'interface."
order: 61
group: tools
source_hash: c0e7414002b92551
---

# Tests

NSH exécute les apps en **headless** : le vrai moteur (le même graphe réactif, le même moteur de rendu, les mêmes composants, la même mise en page et la même virtualisation des listes que sur un appareil, et QuickJS pour TSX), avec des frames d'affichage à 60 Hz, mais sans simulateur, sans appareil et sans fenêtre. Il s'exécute partout où Cargo ou la CLI s'exécute, y compris sur des machines de CI Linux, et remplit deux fonctions :

- il exécute des tests : chacun ouvre l'app, effectue les étapes d'un utilisateur (appuyer, saisir, faire défiler) et vérifie ce qui est à l'écran. Les tests d'une app Rust sont écrits en Rust, exécutés par `cargo test` avec la crate `nsh-testing` ; les tests écrits en TypeScript s'exécutent avec `nsh test`, pour les apps TSX comme pour les apps Rust ;
- avec `--trace`, il affiche chaque opération que le runtime envoie aux vues natives, avec les durées : ce que coûtent la première frame, un tap ou une frame de défilement.

<a id="writing-tests"></a>

## Écrire des tests

Le même test, en Rust et en TypeScript : il ouvre l'app avec une liste de tâches vide dans son stockage, saisit du texte, appuie et vérifie ce que l'écran affiche.

```rust tabs
// tests/app/main.rs
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, MemoryStorage};

#[test]
fn adds_a_todo() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.storage = Some(MemoryStorage::new([("todos".to_owned(), "[]".to_owned())]));
    let mut app = Headless::start(config).unwrap();
    app.type_text("id:new-todo", "Buy milk").unwrap();
    app.press("text:Add").unwrap();
    app.wait_for("text:Buy milk").unwrap();
    assert!(app.screen().texts().contains(&"1 item left"));
}
```

```tsx tabs
// App.test.tsx
import { expect, open, test } from "nsh/test";

test("adds a todo", async () => {
  const app = await open("./App.tsx", { storage: { todos: "[]" } });
  await app.type("id:new-todo", "Buy milk");
  await app.press("text:Add");
  await app.waitFor("text:Buy milk");
  expect(app.texts()).toContain("1 item left");
});
```

<a id="tests-in-rust-with-cargo-test"></a>

## Tests en Rust avec cargo test

Les tests d'une app Rust sont des tests d'intégration de sa crate, avec `nsh-engine` et `nsh-testing` (ses fonctionnalités par défaut, sans QuickJS) comme dev-dependencies :

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` est un moteur de la taille d'un téléphone (390×844 points) sans rien d'autre de défini ; ses champs définissent ce que définissent plus bas les options de `open` : `storage` (`MemoryStorage::new(entries)`), `network` (`StubNetwork`, voir plus bas), `viewport`, `environment` (l'apparence, la locale, la réduction des animations), `clock` (`Clock::manual(time)`, voir plus bas). `nsh_testing::Headless::start(config)` démarre l'app et conserve un modèle des vues qu'elle affiche. Ses étapes sont celles de `nsh test` ci-dessous, avec les mêmes sélecteurs, en Rust : `press`, `long_press`, `clear`, `type_text`, `submit`, `scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`, `set_system_time`, `set_viewport`, `set_clipboard` et `on_dialog` ; `app.shows(text)` et `app.screen()` (`texts()`, `count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`) lisent ce qui est à l'écran. Une étape renvoie une erreur avec les textes à l'écran lorsqu'elle ne peut pas être effectuée.

`nsh_testing::tsx(entry, sets)` (feature `bundle`) ouvre de la même façon le point d'entrée TSX d'une app, compilé avec les jeux d'UI de NSH et de la crate ([Construire avec Rust](./rust.md#testing)). `examples/gallery-rs` teste sa racine Rust de cette façon, un module par démo ; `examples/rust-exports` teste son point d'entrée TSX depuis Rust.

`nsh test` exécute aussi ces tests : à partir du répertoire d'une app avec des crates Rust (`nsh.json` `"rust"`), il exécute `cargo test` pour chaque crate avant les fichiers de test, et affiche et compte les tests Rust avec ceux en TypeScript (`✓ src/lib.rs › tests::adds`), dans son résumé et dans son rapport `--junit`. `nsh test` est donc la commande unique pour une app Rust, une app TSX avec une crate et une app TSX seule, et `nsh check` exécute de même `cargo check --all-targets` sur les crates avant de vérifier les types du TypeScript.

<a id="tests-with-nsh-test"></a>

## Tests avec nsh test

Un fichier de test est un fichier `*.test.tsx` ou `*.test.ts` placé à côté de votre code. Il importe `nsh/test`, comme le fait `App.test.tsx` ci-dessus :

```sh
nsh test                      # every test file of the app in the current directory
nsh test App.test.tsx         # one file
nsh test --filter "adds"      # the tests whose name contains "adds"
```

```text
✓ App.test.tsx › adds a todo (84ms)
✗ App.test.tsx › keeps todos after a restart (312ms)
    expected ["Todos","0 items left"] to contain "1 item left"
    at <anonymous> (App.test.tsx:21:22)
    on screen: "Todos", "0 items left"
error 2 tests: 1 passed, 1 failed (0.9s)
```

Un test en échec affiche ce qui a été levé, l'endroit dans le fichier de test, et les textes à l'écran de l'app qu'il a ouverte. Tout échec fait quitter `nsh test` avec un code non nul. `nsh init` crée un `App.test.tsx` avec l'app, et `nsh check` vérifie les types des fichiers de test avec le reste (`.nsh/types` déclare `nsh/test`).

Chaque fichier de test s'exécute sur son propre moteur, et ses tests s'exécutent l'un après l'autre, dans l'ordre. `open` démarre l'app sur un autre moteur, neuf à chaque fois, de sorte que les tests ne partagent jamais d'état ; les apps qu'un test a ouvertes sont fermées à sa fin. Un test échoue lorsqu'il lève une exception, lorsque la promesse qu'il renvoie est rejetée, et après son délai d'expiration : 30 secondes, ou le nombre de millisecondes donné par le troisième argument de `test` (`test("syncs", body, 60_000)`). Une app avec ses propres crates Rust (`nsh.json` `"rust"`) exécute ses tests dans un runner headless que NSH construit avec elles, de la même façon ; dans une app Rust (`nsh.json` `"root"`, [Construire avec Rust](./rust.md)), `open(".")` démarre son composant racine.

<a id="grouping-tests-and-setting-them-up"></a>

### Regrouper les tests et les préparer

`describe`, les hooks et les variantes de `test` fonctionnent comme ceux de Jest :

```tsx
import { beforeEach, describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";

describe("the cart", () => {
  let app: App;
  beforeEach(async () => {
    app = await open("./App.tsx", { storage: { cart: "[]" } });
    await app.press("Cart");
  });

  test("starts empty", () => {
    expect(app.texts()).toContain("No items");
  });

  test.todo("applies a coupon");
});
```

| Fonction | Description |
|---|---|
| `describe(name, body)` | Regroupe les tests et les blocs que `body` déclare (immédiatement, au chargement du fichier) : leurs noms commencent par `name` (`the cart › starts empty`), et les hooks qu'il déclare ne s'exécutent qu'autour d'eux. Les blocs peuvent être imbriqués. |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | Exécutent `fn` avant / après chaque test du bloc où ils sont déclarés (le fichier, un `describe`) : les `beforeEach` des blocs externes d'abord, les `afterEach` des blocs internes d'abord. Un `beforeEach` qui échoue fait échouer le test ; `afterEach` s'exécute dans tous les cas. |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | Exécutent `fn` une fois avant le premier test et après le dernier test de leur bloc, lorsqu'un de ses tests s'exécute. Un `beforeAll` qui échoue fait échouer les tests du bloc ; un `afterAll` qui échoue est signalé comme un `<block> › afterAll` en échec. Une app qu'un `beforeAll` ouvre reste ouverte pour les tests du bloc, et est fermée après son `afterAll`. |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | Déclarent un test, ou un bloc dont les tests ne s'exécutent pas : ils sont signalés comme ignorés. |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | Tant qu'un fichier de test en contient un, seuls ces tests et blocs s'exécutent ; les autres du fichier sont signalés comme ignorés. |
| `test.todo(name)` | Un test restant à écrire, signalé comme tel. |

Un hook peut être `async` ; son `timeout` est de 30 secondes sauf indication contraire. Les tests et les hooks sont déclarés au chargement du fichier : un test déclaré dans un test ou dans un hook lève une exception.

<a id="opening-the-app"></a>

### Ouvrir l'app

`open(entry, options?)` compile l'app à `entry` (relatif au fichier de test ; chaque point d'entrée est compilé une fois par exécution), la démarre sur un viewport de 390×844 et se résout une fois qu'elle a été rendue et qu'elle est au repos. Avec `--target`, l'app s'exécute avec les options telles que le test les donne : une option que la plateforme cible ne peut pas honorer fait rejeter `open` avec `ERR_NSH_TEST_UNSUPPORTED`, en la nommant (voir [Sur une vraie plateforme](#on-a-real-platform)).

| Option | Défaut | Description |
|---|---|---|
| `storage` | vide | Ce que `Storage` contient au démarrage : `{ todos: "[]" }`. |
| `network` | aucun | Ce que reçoivent les requêtes de l'app, par route : voir [Simuler le réseau](#stubbing-the-network). `"live"` : le vrai réseau, pour ses requêtes, ses sockets et ses WebSockets. |
| `width`, `height` | 390, 844 | Le viewport en points : en headless, la fenêtre des desktops, la page du web. Sur iOS et Android, l'app remplit l'écran de l'appareil. |
| `safeArea` | 0 | Les marges de la safe area en points : `{ top: 47, bottom: 34 }`. |
| `clipboard` | vide | Le texte dans le presse-papiers au démarrage. |
| `colorScheme` | `"light"` | L'apparence du système : `"light"` ou `"dark"` (classes `colorScheme()`, `dark:`). |
| `locale` | `"en-US"` | La locale de l'appareil, un tag BCP 47 (`locale()`, valeur par défaut de `Intl`). |
| `reducedMotion` | `false` | L'utilisateur a demandé moins de mouvement (`reduceMotion()`). |
| `platform` | `"ios"` | La plateforme que l'app simule en headless : `"ios"`, `"android"`, ou celle d'un desktop, `"macos"`, `"windows"`, `"linux"`, ou `"web"` dans l'idiome desktop (`platform.os`, props `ios={{…}}` / `android={{…}}` / `desktop={{…}}`, raccourcis clavier). Avec `--target`, l'app s'exécute comme la plateforme cible : `platform` d'un desktop sur n'importe quel desktop, et le web toujours comme un desktop (dans le navigateur, dans l'idiome desktop à toute largeur, `platform.os` restant `"web"`), `"ios"` et `"android"` pour eux-mêmes. |
| `clock` | celle du système | Une horloge manuelle, dont le temps n'avance que lorsque le test le fait avancer : `{}`, ou `{ time }` pour démarrer à un `Date` (ou en millisecondes depuis l'epoch Unix). Voir [Contrôler le temps](#controlling-time). |
| `host` | aucun | La part de l'app hôte qui l'embarque, que le test joue : `{ params, handlers }`. Voir [Jouer le rôle de l'app hôte](#playing-the-host-app). |

<a id="playing-the-host-app"></a>

### Jouer le rôle de l'app hôte

Une app intégrée dans une app native lui parle via [`host`](../modules/nsh.md#host). Dans un test, le test joue le rôle de l'app hôte : `host.params` fournit les paramètres de lancement que l'app lit au démarrage, et `host.handlers` répond aux `host.call` de l'app et reçoit ses `host.post`, par nom. Un handler est une valeur, qui répond à chaque appel, ou une fonction des données de l'appel qui renvoie la réponse (ou une promesse de celle-ci). Ce que la fonction lève rejette l'appel, comme le fait l'erreur d'une app hôte. Un appel d'un nom que `handlers` ne liste pas échoue, comme dans une app hôte qui n'en gère aucun.

```tsx
const app = await open("./App.tsx", {
  host: {
    params: { conversation: "c-42" },
    handlers: {
      "user.profile": async ({ id }) => ({ id, name: "Ada" }),
      "feature.flags": { search: true },
      analytics: null,
    },
  },
});
await app.press("Profile");
expect(app.host.calls()).toEqual([{ name: "user.profile", data: { id: 7 } }]);
expect(app.host.posts()).toEqual([{ name: "analytics", data: { screen: "profile" } }]);
// The app's `host.on("conversation.open", …)` hears it.
await app.host.send("conversation.open", { id: "c-43" });
expect(app.shows("Conversation c-43")).toBe(true);
```

`app.host.send(name, data)` envoie un événement, puis attend que l'app soit au repos. `app.host.calls()` et `app.host.posts()` listent ce que les handlers ont reçu, dans l'ordre : `name` et `data`.

Les URL que l'app ouvre ([`openUrl`](../modules/nsh.md#openurl), les liens d'un `TextView` avec `links="open"`) sont enregistrées et signalées à l'app comme ouvertes, et rien ne s'ouvre sur cette machine. `app.openedUrls()` les liste :

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### Simuler le réseau

`network` liste des routes par `"<METHOD> <URL>"` (une URL seule est un `GET` ; `*` correspond à n'importe quel texte). Une requête qu'aucune route ne couvre échoue, de sorte que les tests n'atteignent jamais le réseau sans qu'on le demande. Une route est une réponse, ou une fonction de la requête qui en renvoie une (ou une promesse d'une réponse) ; en Rust, `StubNetwork::new(routes)` accepte les mêmes routes, chacune étant un `StubResponse` ou un `StubRoute::Handler` :

```rust tabs
use std::sync::Arc;
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, StubNetwork, StubResponse};

#[test]
fn adds_a_todo_on_the_server() {
    let mut todos = StubResponse::default();
    todos.status = 200;
    todos.headers = vec![("content-type".to_owned(), "application/json".to_owned())];
    todos.body = br#"[{ "id": 1, "title": "Walk" }]"#.to_vec();
    let mut created = StubResponse::default();
    created.status = 201;
    let mut offline = StubResponse::default();
    offline.error = Some("offline".to_owned());
    let network = Arc::new(StubNetwork::new([
        ("GET https://api.example.com/todos".to_owned(), todos),
        ("POST https://api.example.com/todos".to_owned(), created),
        ("GET https://api.example.com/sync".to_owned(), offline),
    ]));
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.network = Some(network.clone());
    let mut app = Headless::start(config).unwrap();
    app.press("Add").unwrap();
    let methods: Vec<String> = network.requests().iter().map(|r| r.method.clone()).collect();
    assert_eq!(methods, ["GET", "POST"]);
}
```

```tsx tabs
const app = await open("./App.tsx", {
  network: {
    "GET https://api.example.com/todos": { body: [{ id: 1, title: "Walk" }] },
    "POST https://api.example.com/todos": (request) => ({ status: 201, body: JSON.parse(request.body!) }),
    "GET https://api.example.com/todos/*": { status: 404 },
    "GET https://api.example.com/sync": { error: "offline" },
    "GET https://api.example.com/slow": { body: "done", delay: 2000 },
  },
});
await app.press("Add");
expect(app.requests().map((r) => r.method)).toEqual(["GET", "POST"]);
```

| Membre de la réponse | Défaut | Description |
|---|---|---|
| `status` | 200 | Le code de statut. |
| `headers` | aucun | Les noms et valeurs des en-têtes. |
| `body` | vide | Une chaîne, ou une valeur envoyée en JSON (avec `content-type: application/json` sauf si `headers` en nomment un). |
| `error` | aucun | La requête échoue à la place avec ce message, comme lorsque l'appareil est hors ligne. |
| `delay` | 0 | La durée de la réponse, en millisecondes ; une étape ne l'attend pas, `waitFor` si. Sur une horloge manuelle, elle arrive une fois que l'horloge l'a dépassée. |

La fonction d'une route reçoit la requête (`method`, `url`, `headers`, `body` en texte) et s'exécute dans le fichier de test, ce qui lui permet de compter les requêtes ou de répondre à partir de ce que le test a préparé. Une fonction qui lève une exception fait échouer la requête et l'étape qui l'a émise. `app.requests()` liste de la même façon les requêtes faites par l'app, dans l'ordre.

Les connexions restent aussi dans le test : les sockets de l'app (`net`) et ses WebSockets (le global `WebSocket` et le module `websocket`) n'en ouvrent aucune sauf si `network` vaut `"live"`. Après les vérifications de capacités que passent les exécutions de l'app, `net.connect` et `connect` du module `websocket` sont rejetés avec `code` `ERR_NSH_TEST_NETWORK`, et un `WebSocket` global déclenche `error`, puis `close` (1006, non propre), comme pour une connexion refusée par le réseau. Avec `"live"`, ils se connectent au vrai réseau, comme les requêtes de l'app. En Rust, `EngineConfig::refuse_connections` fait de même pour une app `Headless` : une fonction de ce à quoi l'app se connecte (l'URL d'un WebSocket, le `host:port` d'un socket) qui renvoie l'erreur avec laquelle son appel échoue.

<a id="controlling-time"></a>

### Contrôler le temps

Sur l'horloge du système, les timers et les animations natives d'une app prennent autant de temps que sur un appareil, tout comme les tests qui les attendent. Avec une horloge manuelle (`EngineConfig::clock` en Rust, `clock` de `open` en TypeScript), l'app s'exécute sur une horloge dont le temps n'avance que lorsque le test le fait avancer, et instantanément, comme avec les fake timers de Jest ou `page.clock` de Playwright. `app.clock` est cette horloge, et `null` lorsque l'app s'exécute sur celle du système :

```rust tabs
use std::time::{Duration, SystemTime};
use nsh_engine::{Clock, EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn autosaves() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    // 2026-01-01T09:00:00Z
    config.clock = Clock::manual(SystemTime::UNIX_EPOCH + Duration::from_secs(1_767_258_000));
    let mut app = Headless::start(config).unwrap();
    app.type_text("label:Note", "Milk").unwrap();
    app.run_for(Duration::from_secs(10)).unwrap(); // the autosave, ten seconds later
    assert!(app.shows("Saved at 09:00:10"));
}
```

```tsx tabs
const app = await open("./App.tsx", { clock: { time: new Date("2026-01-01T09:00:00Z") } });
await app.type("label:Note", "Milk");
await app.clock!.runFor(10_000);           // the autosave, ten seconds later
expect(app.texts()).toContain("Saved at 09:00:10");
```

Un `StubNetwork` dont les réponses ont un `delay` suit une horloge manuelle avec `.with_clock(clock.clone())`. Les étapes ci-dessous sont celles de `nsh test` ; `Headless` les a toutes (`run_for`, `fast_forward`, `set_system_time`).

| Étape | Description |
|---|---|
| `await app.clock.runFor(ms)` | Fait avancer l'horloge de `ms` millisecondes, une frame d'affichage à la fois. Les timers, `requestAnimationFrame`, les animations natives et les réponses différées s'exécutent à leur échéance, dans l'ordre, chacun à son heure. Se résout une fois que l'app est au repos. |
| `await app.clock.fastForward(ms)` | Fait avancer l'horloge de `ms` millisecondes d'un coup, comme un appareil qui sort de veille : les timers échus entre-temps s'exécutent une fois chacun. |
| `app.clock.setSystemTime(time)` | Fixe l'heure murale (`Date.now()`, `new Date()`) à un `Date` ou à un nombre de millisecondes, sans déplacer aucun timer. |

`Date`, `performance.now()` et la date par défaut de `Intl` suivent l'horloge. Les étapes terminent ce qui est en cours sans l'attendre : tant que l'app demande des frames ou qu'une animation native s'exécute, les frames se succèdent, chacune un temps de frame (1/60 s) plus tard sur l'horloge. Une transition de 300 ms prend quelques millisecondes, et un timer échu pendant celle-ci s'exécute. Une animation qui boucle indéfiniment (un spinner) s'exécute avec l'horloge : elle tourne à mesure que le test fait avancer l'horloge. `app.wait(ms)` et un appui long font avancer l'horloge de leur durée. Un timer qui arrive à échéance plus tard ne s'exécute que lorsque le test fait avancer l'horloge jusque-là. `waitFor` et `waitUntil` font avancer l'horloge pendant qu'ils attendent, une frame d'affichage à la fois, en regardant après chaque frame, de sorte que ce qu'affiche un timer apparaît pendant qu'ils l'attendent, en un instant : `waitFor("Saved", { timeout: 15_000 })` fait avancer l'horloge de quinze secondes au plus. Leur délai d'expiration compte sur les deux horloges : une attente fait avancer l'horloge de l'app d'au plus cette durée, et est rejetée une fois qu'autant de temps réel s'est écoulé aussi, de sorte que ce qui vient de l'extérieur de l'app (la fonction d'une route, le réseau) dispose d'autant de temps que sur l'horloge du système. Les tests de la galerie s'exécutent ainsi (`examples/gallery/tests`) : ses douze tests qui attendent des animations prennent 6 s au lieu de 28 s.
<a id="steps"></a>

### Étapes

Les étapes désignent les vues avec des **sélecteurs**, écrits comme ceux de Playwright :

| Sélecteur | Correspond à |
|---|---|
| `id:<testID>` | La vue portant ce `testID`. |
| `label:<label>` | La vue portant ce `accessibilityLabel`. |
| `text:<text>` | Un texte qui le contient tel quel (espaces autour exceptés), un fragment d'un texte qui reçoit les appuis (un `<Text onPress>` imbriqué, le lien d'un `TextView`), ou un champ de saisie qui le contient ou, tant qu'il est vide, ayant ce placeholder. |
| `role:<role>`, `role:<role>[<name>]` | Une vue avec ce `role` (`role:button`), et ce nom : son label, sinon les textes qu'elle contient (`role:button[Save]`). |
| `view:<id>` | La vue avec cet id dans la sortie `--trace`. |
| tout le reste | Un `testID`, sinon un label, sinon un texte, tel qu'écrit. |

Une partie qui commence par un mot en minuscules suivi de deux-points désigne un préfixe (`id`, `label`, `role`, `text`, `view`), de sorte que
`tapped: solo` est une erreur d'étape qui les énumère. Un texte, un label ou un test id qui commence ainsi prend son préfixe, qui
lit le reste tel quel : `text:tapped: solo`, `label:note: draft`, `id:row:2`. Les sélecteurs conservent leur sens à mesure que de nouveaux
préfixes arrivent.

`label:`, `text:` et le nom d'un rôle acceptent aussi une regex : `text:/^Buy/i`, écrite dans la syntaxe de la crate `regex` de Rust
(classes, groupes, ancres et quantificateurs de JavaScript, évalués en temps linéaire ; drapeaux `i`, `m` et `s`). ` >> ` cherche
à l'intérieur de ce qu'a trouvé la partie précédente (`id:cart >> role:button[Remove]`), et `nth=<n>` conserve l'une des correspondances, à partir de 0
(`text:Delete >> nth=1`). Un sélecteur trouve les vues qu'un utilisateur regarderait en premier : dans le modal du dessus, puis à l'écran,
et, pour une pile de navigation, seulement l'écran du dessus. Il correspond à ce que voit l'utilisateur : les vues ayant une surface, hors de `visibility: hidden`, dans la fenêtre et
dans les vues qui les découpent (`overflow: hidden`), ou n'importe où dans le contenu d'une scroll view que l'utilisateur peut faire défiler, ce que
le défilement fait apparaître (`opacity` et transformations exceptés, comme dans Playwright). Une étape qui agit sur une vue (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`) en exige exactement
une : un sélecteur qui en désigne plusieurs fait échouer l'étape, et l'erreur indique comment le restreindre.

| Étape | Description |
|---|---|
| `await app.press(selector)` | Appuie sur la vue, ou sur la vue la plus proche qui l'entoure et reçoit les appuis (le bouton autour d'un texte) : `onPressDown`, `onPressUp`, `onPress`, à l'intérieur d'un doigt qui se pose puis se lève, que perçoivent les vues environnantes à l'écoute des touches (le `onPressOutside` d'un overlay). Un fragment de texte reçoit l'appui sur ses caractères (`await app.press("Privacy policy")`), en headless et sur iOS, Android et les plateformes de bureau. Un second appui sur la même vue en moins de 500 ms est son second clic (`clicks: 2`, un double appui), comme les plateformes les comptent. Rejette lorsqu'elle est désactivée. |
| `await app.longPress(selector)` | Maintient un doigt dessus (ou sur la vue la plus proche qui l'entoure et reçoit les appuis ou les touches) pendant son `delayLongPress` (500 ms) : `onPressDown`, `onLongPress`, `onPressUp` ; aucun `onPress` ne suit. Les gestionnaires de touches perçoivent le doigt (un `ContextMenu` ou `Tooltip` s'ouvre). |
| `await app.clear(selector)` | Vide le champ de saisie, comme le font « tout sélectionner » puis la suppression. |
| `await app.type(selector, text)` | Saisit dans le champ (ou le premier champ à l'intérieur de la vue ; `text:` correspond aussi au texte ou au placeholder d'un champ) à la fin de son contenu, touche par touche : il prend le focus, puis chaque caractère est un `onKeyPress` et un `onChange`, dans `maxLength`. Un `\n` dans un champ monoligne est la touche Retour. |
| `await app.submit(selector)` | La touche Retour dans le champ, comme l'indique son `submitBehavior` : `onSubmit` (et le focus quitte un champ monoligne), ou un saut de ligne dans un champ multiligne. |
| `await app.scroll(selector, distance)` | Fait glisser la scroll view ou la liste (la vue, celle qui l'entoure, ou la première à l'intérieur) de `distance` points le long de son axe, 10 points par frame, dans les limites de son contenu, comme le peut l'utilisateur (`scrollable`). Une valeur négative revient en arrière. |
| `await app.hover(selector)` | Déplace la souris au milieu de la vue : les vues situées dessous qu'elle a quittées reçoivent `onMouseLeave`, celles qu'elle survole reçoivent `onMouseEnter` et prennent leurs styles `hover:`, et celles à l'écoute reçoivent `onMouseMove` avec sa position et aucun bouton enfoncé. Sur les plateformes de bureau et le web, à toute largeur, y compris un navigateur dans l'idiome téléphone (headless : un desktop ou `"web"` `platform`) ; un téléphone iOS ou Android n'a pas de souris : l'étape y est rejetée. |
| `await app.rightClick(selector)` | Le bouton secondaire de la souris au milieu de la vue : elle, ou la vue la plus proche qui l'entoure et écoute, reçoit `onContextMenu`. Sur les plateformes de bureau et le web (headless : un desktop `platform`) ; un téléphone n'a pas de souris : l'étape y est rejetée. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | Colle dans le champ comme le fait l'utilisateur avec cela dans le presse-papiers : il prend le focus et reçoit `onPaste` (`html` le même contenu avec sa mise en forme, `files` sont des chemins dont il reçoit les octets sous forme de `File`s, `uris` `file:` des URL), puis son texte est inséré comme l'indique `pasteBehavior`. En headless, sur macOS, sur iOS et sur le web ; le presse-papiers de la machine reste inchangé. |
| `app.menu()` | Les actions du menu contextuel affiché par l'app (`Menu.popup`) : `label` (celles d'un sous-menu viennent après son propre élément, `"Share > Mail"`), `disabled`, et `checked` pour un élément cochable ; `null` quand aucun n'est ouvert. |
| `await app.chooseMenuItem(label)` | Choisit l'action du menu contextuel ouvert, comme le fait un clic dessus : l'app reçoit `onMenu` (son `onSelect` s'exécute), puis le menu se ferme. Rejette lorsque l'élément est désactivé ou absent. |
| `await app.closeMenu()` | Ferme le menu contextuel ouvert sans rien choisir, comme le fait Escape. |
| `await app.keyboard.press(keys)` | Appuie sur une touche avec ses modificateurs, comme `keymap` la désigne (`"mod+k"`, `"shift+/"`, `"escape"` ; `mod` est la touche de commande de la plateforme), sur un clavier physique, sur chaque plateforme (téléphones et tablettes en ont un aussi) : le raccourci de l'app correspondant la reçoit (`keymap.bind`, `onKeyCommand`) ; sinon, sur macOS et le web, Tab et Shift+Tab déplacent le focus clavier entre les champs de saisie et les vues qui reçoivent les appuis (styles `onFocus`, `onBlur`, `focus:`) et Return ou Space appuie sur la vue qui a le focus ; sinon le champ ayant le focus reçoit un caractère, Backspace ou la touche Retour ; sinon Escape revient en arrière. |
| `await app.keyboard.down(keys)` / `up(keys)` | Maintient des touches de modification (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, jointes par `+`) enfoncées jusqu'à `up` : les appuis, glissements et survols entre-temps les portent, comme le font un Mod-clic ou un Shift-glissement. Pour l'instant en headless et sur Linux. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | Glisse comme le fait `drag` et garde le doigt posé jusqu'à `drop()`, qui le lève là où il se trouve : les étapes intermédiaires observent l'écran en plein glissement (un aperçu de glissement, une ligne de dépôt). Pour l'instant en headless et sur Linux. |
| `await app.dropFiles(selector, uris)` | Dépose des fichiers locaux (URL `file:`, comme un gestionnaire de fichiers les glisse) au milieu de la vue : elle, ou la vue la plus proche qui l'entoure et écoute, reçoit `onFileDrop`. Pour l'instant sur les plateformes de bureau, en headless et sur Linux. |
| `await app.drag(selector, { x, y })` | Un doigt se pose au milieu de la vue, y reste 100 ms, se déplace de `x`, `y` points, 10 par frame, puis se lève, tel que la saisie de la plateforme le prend en compte : un pan s'ensuit (`pan={{ x, y }}`, `onPanStart`, `onPanEnd` avec la vitesse de relâchement), les vues à l'écoute des touches le perçoivent (`onTouchStart`, `PanResponder`), une scroll view défile avec lui et, tirée assez loin au-delà de son sommet, s'actualise (`onRefresh`), et un appui en dessous est annulé dès qu'il s'éloigne. Sur les plateformes de bureau et le web, c'est la souris. |
| `await app.wait(ms)` | Laisse l'app tourner pendant `ms` millisecondes : minuteries, animations, requêtes. Sur une horloge manuelle, la fait avancer de `ms` (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | Se résout dès qu'une vue correspond, ou avec `{ state: "gone" }` dès qu'aucune ne correspond ; rejette après `timeout` ms (5000). Sur une horloge manuelle, la fait avancer d'une frame d'affichage à la fois pendant l'attente, de `timeout` au plus. |
| `await app.waitUntil(condition, options?)` | Se résout dès que `condition()` renvoie true, en regardant à nouveau après chaque changement de l'app : pour ce qu'aucun sélecteur n'exprime (`() => app.storage().note === "Milk"`). Sur une horloge manuelle, la fait avancer d'une frame d'affichage entre deux vérifications, de `timeout` au plus. |
| `app.shows(selector)` | Indique si une vue correspond maintenant. |
| `app.count(selector)` | Le nombre de vues qui correspondent maintenant. |
| `app.enabled(selector)` | Indique si la vue accepte la saisie : ni elle ni une vue qui l'entoure n'est désactivée, et un champ n'est pas `readonly`. |
| `app.texts()` | Les textes actuellement à l'écran, dans l'ordre. |
| `app.value(selector)` | Le texte d'un champ, `null` si aucun ne correspond. |
| `app.spanStyle(selector)` | Le style résolu du premier caractère correspondant, en headless et sur chaque `--target` : `color`, `backgroundColor` facultatif, `fontSize`, `fontWeight`, `italic`, `underline` et `lineThrough`. Les couleurs sont `#rrggbbaa` ; les tailles sont en points. |
| `app.storage()` | Ce que contient actuellement le stockage de l'app. |
| `await app.back()` | Revient en arrière comme le fait l'utilisateur (le bouton retour d'un en-tête, glisser une sheet vers le bas) : la pile la plus interne du modal le plus récent, sinon celle de l'écran, retire son écran du dessus (`onDismiss`), ou le lui demande (`onBackRequest`) quand il a `preventBack` ; sans pile, le modal le plus récent demande à se fermer (`onRequestClose`). Rejette lorsqu'il n'y a rien dont revenir. |
| `app.onDialog(handler)` | Répond aux dialogues que l'app affiche à partir de maintenant (`Alert.alert`, action sheets) : `handler` reçoit le dialogue (`title`, `message`, `buttons`, `cancelable`, `sheet`) et renvoie le texte du bouton sur lequel appuyer, ou `null` pour le fermer sans en choisir. |
| `app.dialogs()` | Les dialogues affichés par l'app, dans l'ordre. |
| `app.onPick(handler)` | Répond aux sélections que l'app demande à partir de maintenant (`Picker.pickImages`) : `handler` reçoit ce que demande la sélection (`multiple`, `limit`, `maxDimension`, `quality`, `format`) et renvoie les fichiers choisis par l'utilisateur (`{ name, type?, data: Uint8Array }`, transmis à l'app tels quels), ou `null` pour annuler. Sans gestionnaire, les sélections sont annulées. Exécutions headless. |
| `app.picks()` | Les sélections demandées par l'app, dans l'ordre. |
| `app.hear(text)` | L'utilisateur dit `text` dans la session de reconnaissance vocale en cours (`Speech.start`) : son `result` rapporte `text` comme la transcription entière jusqu'ici. Exécutions headless. |
| `app.endSpeech(error?)` | Termine la session de reconnaissance vocale en cours : avec `error` (`"no-speech"`, `"network"`, ...) elle échoue, sinon un dernier résultat final et `end` arrivent, `no-speech` quand rien n'a été entendu. Exécutions headless. |
| `app.speechRequests()` | Les sessions de reconnaissance vocale démarrées par l'app, dans l'ordre : `lang` (`null` pour celle de l'utilisateur) et `interim`. |
| `app.clipboard()` | Le texte actuellement dans le presse-papiers, `null` s'il n'en contient aucun. |
| `app.requests()` | Les requêtes faites par l'app, dans l'ordre : `method`, `url`, `headers`, `body`. |
| `await app.host.send(name, data?)` | Envoie un événement de l'app hôte à l'app (`host.on`), puis attend le retour au calme. Voir [Simuler l'app hôte](#playing-the-host-app). |
| `app.host.calls()`, `app.host.posts()` | Les appels et envois de l'app que le `host.handlers` de `open` a reçus, dans l'ordre : `name`, `data`. |
| `app.openedUrls()` | Les URL ouvertes par l'app (`openUrl`), dans l'ordre : enregistrées, jamais ouvertes. |
| `await app.setViewport(width, height)` | Redimensionne le viewport, comme le font la rotation de l'appareil ou le redimensionnement d'une fenêtre (`windowSize()`). |
| `await app.setColorScheme(scheme)` | Bascule l'apparence du système sur `"light"` ou `"dark"`, comme le fait l'utilisateur. |
| `await app.setLifecycle(state)` | Fait passer l'app à `"background"`, `"inactive"` ou `"active"`, comme le fait le système quand l'utilisateur la quitte, passe à une autre app ou fenêtre puis revient (`lifecycle()`). Exécutions headless uniquement. |
| `await app.screenshot(path?)` | Une image de la fenêtre de l'app au format PNG (un `Uint8Array`), également enregistrée à `path` sur cette machine lorsqu'il est fourni (relatif au répertoire courant). Seule une vraie plateforme dessine l'app : voir [Sur une vraie plateforme](#on-a-real-platform). |

Une étape se résout lorsque l'app n'a rien rendu pendant 100 ms et qu'aucune animation native qui se termine d'elle-même n'est en cours (2 s au
plus, pour les apps qui rendent en permanence ; sur une horloge manuelle, également 2 s du temps de l'app), de sorte que ce qu'elle a modifié est à l'écran lorsque la ligne suivante s'exécute ; utilisez `waitFor` pour ce qui vient plus tard (une réponse, une minuterie). Sur une horloge manuelle, une étape
n'attend pas ces 100 ms : elle se résout dès que l'app a exécuté tout ce que l'étape et le temps de l'horloge ont rendu
exigible (minuteries échues, promesses, réponse simulée renvoyée immédiatement) et ne demande plus de frame, sauf si une requête est encore
en cours, si bien que les tests sur horloge manuelle s'exécutent sans pause entre leurs étapes. Ce qu'un autre thread renvoie (un appel
`nsh/host`, une lecture de fichier, le travail d'une tâche Rust sur un thread) arrive après la résolution de l'étape : `waitFor` ce qu'elle
affiche. Une animation qui boucle
indéfiniment, comme un indicateur de chargement, continue de tourner en arrière-plan pendant que les étapes et `waitFor` se poursuivent, comme le fait une
animation CSS infinie dans les tests d'un navigateur. Une étape est rejetée, et le test échoue, lorsque rien ne correspond à son sélecteur (l'erreur liste les textes à
l'écran), lorsque l'app a levé une exception entre-temps, et lorsque l'app a demandé ce que seule une vraie plateforme peut fournir.

Les échecs qu'un test peut attendre portent un `code`, qui reste tel quel ; leurs messages sont destinés aux humains et peuvent changer, un
test doit donc comparer le code :

| `code` | L'étape ou la requête |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | Rien à l'écran ne correspond au sélecteur, ou le menu ouvert n'a pas un tel élément. |
| `ERR_NSH_TEST_DISABLED` | La vue que désigne le sélecteur est désactivée (une scroll view que l'utilisateur ne peut pas faire défiler, un élément de menu désactivé). |
| `ETIMEDOUT` | `waitFor` ou `waitUntil` a expiré, ou l'app n'a rien rendu après `open`. |
| `ERR_NSH_TEST_NO_BACK` | `back()` n'a rien trouvé dont revenir. |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` avec `--target` a reçu une option que la plateforme cible ne peut pas honorer : `width` ou `height` sur iOS et Android, le `platform` d'un téléphone sur un desktop ou le web, celui d'un desktop ou de l'autre téléphone sur iOS ou Android, `host.handlers`. Le message la nomme. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` lit un `<Text testID="guide">` imbriqué ; `text:word` lit le premier caractère
de cette correspondance. Restreignez la portée des requêtes avec `id:note >> text:word` et sélectionnez parmi des correspondances répétées avec `>> nth=0`.
La requête signale une erreur pour un fragment manquant, ambigu ou vide. La mise à jour du `testID` d'un fragment réutilise la mise en page de son texte
et préserve le compteur d'appels du callback `onTextLayout`.
<a id="what-headless-runs-play-of-the-platform"></a>

### Ce que les exécutions headless jouent de la plateforme

Une exécution headless dispose du vrai runtime et d'aucune plateforme. Elle joue le rôle que le protocole de NSH attribue à la plateforme, et rien de ce que seule une vraie plateforme peut faire :

- **Les animations natives s'exécutent** image par image, jusqu'à leur fin : les callbacks `start(callback)` s'exécutent, et ce qui les attend aussi. Les boucles sans fin tournent jusqu'à ce que l'app les arrête.
- **Le retour en arrière** dépile les écrans et ferme les modales comme le fait une plateforme (`app.back()`).
- **Les dialogues reçoivent une réponse** : celle de `onDialog` du test, sinon leur bouton d'annulation, sinon ils sont fermés quand ils peuvent l'être ; un dialogue auquel seuls ses autres boutons répondent fait échouer l'étape qui l'a affiché, jusqu'à ce que le test dise lequel presser.
- **Le presse-papiers contient du texte** : ce que l'app copie, relu quand elle colle (`clipboard` pour en avoir au départ).
- **L'hôte de la page répond à `host`** quand `nsh.json` de l'app en nomme un dans `web.host` ([L'hôte de la page](#the-pages-host)).
- **L'app s'exécute avec ses capacités** : ce que son `nsh.json` déclare dans `capabilities` est appliqué comme sur un appareil, donc ce qu'elle ne déclare pas est refusé.
- **Les URL sont enregistrées** : ce que l'app ouvre est signalé comme ouvert, et `app.openedUrls()` le liste.
- **Les sélections reçoivent une réponse** : avec les fichiers du test (`onPick`), sinon elles sont annulées, de sorte que `Picker.pickImages` se résout `[]`.
- **La parole est celle du test** : `Speech.available()` se résout `true`, une session démarre aussitôt et entend ce que dit `hear`.
- **Les modales s'affichent aussitôt** : `onShow` arrive quand l'une est présentée.
- **Les images ne sont pas chargées** : aucun `onLoad` ni `onError` n'arrive, et `Image.getSize` et `Image.prefetch` sont rejetés.
- **Ce que seule une vraie plateforme sait traiter fait échouer l'étape** : une image ou des fichiers dans le presse-papiers.

<a id="the-pages-host"></a>

### L'hôte de la page

Une app publiée sur le web reçoit son hôte de sa page : `nsh.json` `web.host`, un module qui exporte `createHost(player)` ([Web](./web.md#the-hosts-functions)). Les exécutions headless chargent ce module pour chaque app qu'un test ouvre, avant le démarrage de l'app, dans un contexte JavaScript à part (minuteries et `console`, rien du navigateur, pas d'imports) : son `call` répond à [`host.call`](../modules/nsh.md#host) de l'app, son `player.hostEvent` atteint `host.on`, et `host.available()` vaut `true`. Un `call` qui lève une exception, est rejeté ou renvoie autre chose que du JSON fait rejeter l'appel de l'app avec son message, comme sur la page, et les événements envoyés avant le démarrage de l'app atteignent ses écouteurs de premier niveau une fois qu'elle a démarré. `--web-host <module>` nomme un autre module. `capabilities.host` de l'app doit lister ce qu'elle appelle, comme sur la page. Le délai d'expiration d'un appel et les minuteries propres à l'hôte s'écoulent selon le temps de l'app, donc une horloge manuelle les fait avancer (`app.clock.runFor`). Dans un navigateur (`--target web`), la page de développement exécute le `web.host` de `nsh.json` pour chaque app comme le fait une page publiée ; sur les autres plateformes (`--target`), les apps n'ont pas d'hôte : `host.available()` vaut `false`.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` contient une app, son hôte et leurs tests.

<a id="expectations"></a>

### Assertions

`expect(value)` vérifie les valeurs comme le fait Jest, telles que JS les a faites : `toBe` est `Object.is`, `toEqual` compare membre par membre, et un `Date`, un `Map` ou un `Uint8Array` est comparé pour ce qu'il est. Chaque assertion lève une exception quand elle n'est pas vérifiée. `.not` les inverse : `expect(app.texts()).not.toContain("Error")`. Avec une fonction, `toThrow` vérifie ce que son appel lève ; avec une promesse, ou une fonction qui en renvoie une, `rejects` et `resolves` vérifient ce à quoi elle se résout, comme dans Jest : `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| Assertion | Vérifiée quand |
|---|---|
| `toBe(expected)` | La valeur est `expected`, comme le dit `Object.is` : la même primitive (`NaN` est `NaN`, `0` n'est pas `-0`) ou le même objet. |
| `toEqual(expected)` | La valeur est égale à `expected` membre par membre, comme le `toEqual` de Jest : les objets par leurs propriétés énumérables propres (une propriété qui vaut `undefined` compte comme absente), les tableaux élément par élément, les dates par leur temps, les expressions régulières par source et drapeaux, les maps et sets par leurs entrées dans n'importe quel ordre, les `ArrayBuffer` et tableaux typés par leurs octets, les erreurs par nom et message ; `NaN` est égal à `NaN`. Une instance de classe est égale à un objet simple ayant ses propriétés. |
| `toMatchObject(subset)` | La valeur a chaque propriété de `subset`, chacune égale comme le dit `toEqual`, et les objets qu'elle contient sont comparés à leur tour ; les autres propriétés ne sont pas examinées, et les tableaux sont comparés élément par élément, tous. |
| `toContain(item)` | Un tableau, un `Set`, un tableau typé ou un autre itérable contient `item` (`===`), ou une chaîne le contient. |
| `toContainEqual(item)` | Un tableau, un `Set` ou un autre itérable contient un élément égal à `item`, comme le dit `toEqual`. |
| `toBeTruthy()`, `toBeFalsy()` | La valeur est « truthy » / « falsy », selon JS. |
| `toMatch(pattern)` | Une chaîne contient `pattern` (une chaîne), ou y correspond (un `RegExp`, exécuté par le moteur JS : lookbehind, rétroréférences et groupes nommés fonctionnent comme en JavaScript). |
| `toHaveLength(n)` | Le `length` de la valeur est `n` : les unités UTF-16 d'une chaîne, les éléments d'un tableau ou d'un tableau typé. |
| `toBeNull()` | La valeur est `null`. |
| `toBeUndefined()`, `toBeDefined()` | La valeur est `undefined` / toute autre chose. |
| `toBeNaN()` | La valeur est `NaN`. |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | Un nombre se compare ainsi à `n`. |
| `toThrow(expected?)` | `expect(fn)` : l'appel de `fn` lève une exception. Avec `expected`, l'erreur y correspond : son message contient une chaîne ou correspond à un `RegExp` ; une classe d'erreur (`TypeError`, une classe de l'app) est le `name` de l'erreur, et `Error` correspond à toute erreur ; une erreur a le même message. |
| `rejects.toThrow(expected?)` | `expect(promise)` : la promesse est rejetée, avec une erreur correspondant à `expected` comme le dit `toThrow`. |
| `rejects.toMatchObject(subset)` | `expect(promise)` : la promesse est rejetée avec une valeur correspondant à `subset` comme le dit `toMatchObject` : les propriétés propres d'une erreur (`code`, `permission`, ...) ainsi que `name` et `message`. |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)` : la promesse se résout en une valeur qui satisfait l'assertion. |

Une assertion qui échoue indique ce qu'elle a reçu et ce qu'elle attendait, écrits comme JS les écrirait :
`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

`rejects` et `resolves` ont aussi leur propre `.not` : `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### Sur une vraie plateforme

`nsh test --target macos` (ou `linux`, `windows`, `gpui`, `web`, `ios`, `android`) exécute les mêmes tests sur l'hôte de développement de la plateforme au lieu du mode headless : chaque `open` démarre l'app dans sa propre fenêtre, avec un répertoire de données vierge, et les étapes agissent avec l'entrée propre à la plateforme sur les vues que nomment leurs sélecteurs, comme Playwright dans un navigateur :

- un appui est un clic au milieu de la vue, un appui long un clic maintenu, `type` clique sur le champ de saisie et tape ses touches, `scroll` est un geste de trackpad sur la vue de défilement, `back` est ce que fait un utilisateur (Échap sur macOS et Linux, le bouton retour de la souris sur Windows et dans GPUI, le bouton retour du navigateur sur le web, une feuille balayée vers le bas, le geste d'échappement de VoiceOver tant qu'un menu, un popover ou `Sheet` est ouvert, sinon le bouton retour de l'en-tête sur iOS, le bouton retour sur Android) ;
- une vue hors écran est d'abord amenée dans la zone visible par défilement, un geste à la fois ; sur un écran tactile, le doigt se pose là où la page elle-même l'accepte, à côté des vues qui suivent un glissement (un curseur, une zone de dessin), comme le fait un utilisateur qui fait défiler ;
- les sélecteurs, attentes et requêtes voient le même modèle de l'app que les exécutions headless, construit à partir de ce que l'hôte dessine, de sorte qu'ils trouvent les mêmes vues ;
- les dialogues sont ceux de la plateforme : `app.dialogs()` les lit, et y répondre (`onDialog`, ou son bouton d'annulation quand le test ne dit rien) appuie sur son bouton ;
- `app.screenshot(path)` prend une capture de la fenêtre.

```sh
nsh test --target macos                       # the app's tests in macOS windows
nsh test --target linux                       # in GTK windows (xvfb-run -a … on a machine without a display)
nsh test --target windows                     # in Win32 windows
nsh test --target ios                         # in an iOS simulator
nsh test --target android                     # on the Android device or emulator adb lists first
nsh test --target gpui                        # in GPUI windows (macOS, Windows, Linux)
nsh test --target web                         # in a headless Chrome, Edge or Chromium
nsh test tests/form.test.tsx --target macos   # one file
```

La fenêtre s'ouvre à la taille du viewport (390 × 844 sauf indication de `open`), dans les limites de l'écran ; sur iOS et Android, l'app remplit l'écran de l'appareil, à la taille de l'appareil. L'app s'exécute comme la plateforme de la cible (`platform.os`). Un `clock` manuel fonctionne comme en headless : `app.clock.runFor`, `fastForward` et `setSystemTime` font avancer aussitôt le temps de l'app (minuteries, `requestAnimationFrame` à une image d'écart, `Date`), `app.wait(ms)`, `waitFor` et `waitUntil` le font avancer aussi, et chaque image que la plateforme affiche le fait avancer d'une image (1/60 s), de sorte que le temps de l'app s'écoule pendant qu'elle s'anime. Les animations propres à la plateforme, et le `delay` d'une route, prennent du temps réel. Les requêtes de l'app arrivent au test comme en headless : les routes `network` y répondent, une requête qu'aucune route ne couvre échoue, et `"live"` les laisse passer vers le réseau de l'hôte ; `app.requests()` les liste toutes. Les sockets et WebSockets se connectent au réseau de l'hôte avec `"live"`, et sont sinon refusés comme en headless. `storage` est dans le stockage de l'app à son démarrage, et `app.storage()` le lit depuis l'app. `locale`, `reducedMotion` et `safeArea`, quand `open` les fournit (valeur par défaut comprise), contiennent ce que la plateforme rapporte, et un `colorScheme` qu'il fournit change l'apparence du système (`"light"` aussi) ; ce qu'il omet est celui de la plateforme, et les appels de presse-papiers de l'app sont servis depuis le presse-papiers propre au test (`clipboard` est d'abord son texte, `app.clipboard()` le lit), de sorte que le presse-papiers de la machine reste tel qu'il était ; la copie et le collage d'un champ de texte utilisent ceux du système. `host.params` atteint l'app, `app.host.send` envoie des événements, et les URL que l'app ouvre sont enregistrées pour `app.openedUrls()` au lieu d'être ouvertes. `host.handlers` s'exécute en headless, où le test répond aux appels de l'app. `open` vérifie ses options par rapport à la cible : `width` et `height` sur iOS et Android, un `platform` d'un autre type d'appareil (celui d'un téléphone sur un ordinateur ou le web, celui d'un ordinateur ou de l'autre téléphone sur iOS ou Android) et `host.handlers` sont rejetés avec `ERR_NSH_TEST_UNSUPPORTED`, de sorte qu'un test s'exécute tel qu'il est écrit ou dit ce dont il a besoin. Un `platform` de bureau (`"macos"` pour la souris et le clavier d'un ordinateur) s'exécute sur toutes les cibles de bureau et sur le web, comme plateforme de cette cible et toujours comme un bureau : dans le navigateur, la page démarre dans l'idiome bureau quelle que soit sa largeur, alors que sans `platform` (ou avec `"web"`) elle mesure son idiome comme le fait un navigateur (un bureau à partir de 600 points de large). Une app avec ses propres crates Rust s'exécute dans un hôte de développement construit avec ses crates, que NSH construit pour la plateforme ; l'hôte d'une app Rust exécute sa racine, de sorte que `open(".")` l'y démarre comme en headless.

Sur le web, les apps s'exécutent dans la page de l'hôte de développement, dans un Chrome, Edge ou Chromium headless : celui installé sur cette machine, ou l'exécutable que nomme `--browser <PATH>` (un navigateur est nécessaire : `nsh test` dit où il a cherché quand il n'en trouve aucun). Un seul navigateur sert l'exécution, et chaque `open` obtient une page avec son propre stockage. L'entrée est l'entrée de confiance du navigateur, comme celle d'un utilisateur : clics de souris, défilement à la molette et touches.

Sur iOS, les apps s'exécutent dans l'hôte de développement, dans un simulateur iOS : celui qui est démarré, sinon l'iPhone le plus récent, que `nsh test` démarre. Les étapes sont des touchers du doigt et la saisie du clavier logiciel, tels qu'UIKit les reçoit de l'appareil. `setColorScheme` change l'apparence du simulateur, que `nsh test` rétablit après l'app, et l'écran a la taille de l'appareil simulé.

Sur Android, les apps s'exécutent dans l'hôte de développement sur le premier appareil ou émulateur que `adb devices` liste, avec leur propre stockage. Les étapes sont des touchers du doigt et des touches de clavier, tels que les vues de l'app les reçoivent de l'appareil ; `back` est le retour du système. `setColorScheme` change le thème sombre de l'appareil, que `nsh test` rétablit après l'app.

<a id="steps-from-standard-input"></a>

### Étapes depuis l'entrée standard

Avec l'entrée de l'app au lieu de tests, `nsh test` ouvre l'app sur le vrai réseau, la laisse tourner 1,2 s, puis exécute les étapes que fournit l'entrée standard, `app` étant l'app :

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

Les 1,2 s laissent la collecte de déchets au repos du moteur s'exécuter avant la première étape, de sorte qu'une app qui lâche ce qu'elle utilise encore le montre : ses gestionnaires cessent de fonctionner.

Les exemples fournissent des tests de départ : `examples/gallery-rs` pour une app Rust (`cargo test`, un module par démo, et `App.test.tsx`), `examples/rust-exports` pour une app avec un crate Rust, `examples/counter` et `examples/gallery/tests` (stockage, champs de saisie, longue liste, requêtes simulées, mode sombre, horloge manuelle) pour les apps TSX.

<a id="tracing-with---trace"></a>

## Tracer avec --trace

`--trace` affiche chaque lot de montage des apps que les tests ouvrent, sous l'étape dans laquelle il est arrivé, ainsi que le temps de chaque commit. En Rust, un test affiche la même chose : `observe` lui remet chaque lot avec son étape, et `EngineConfig::trace` journalise les lignes `perf` via le crate `log` (cible `nsh::perf` ; installez un logger tel que `env_logger` dans le test) :

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` accepte `--trace` sur un fichier de test, ou sur l'entrée de l'app avec les étapes sur l'entrée standard :

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

Avec `--target`, la trace est celle de la plateforme : les lots que l'hôte a appliqués, sous les étapes qui les ont amenés, et les mesures de temps propres à l'hôte pour chaque commit et chaque événement, sur le matériel de l'appareil.

Utilisez-la pour :

- vérifier qu'une app (ou une démo) se construit, s'évalue et s'affiche sans erreur ;
- voir exactement quelles vues natives un changement crée, déplace ou met à jour, et combien ;
- mesurer le coût de la première image, d'un tap et de chaque image de défilement ;
- détecter les régressions en CI.
<a id="reading-the-output"></a>

### Lecture de la sortie

Voici l'exemple du compteur avec un appui (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), abrégé :

```text
✓ bundled App.tsx (3255 B in 6.2 ms)
perf commit: 56 ops, 271µs (list js 5µs), 49 mount items, 21 nodes
perf first frame: eval 187µs, total 820µs
── open(App.tsx): 49 items
   LayoutDirection { rtl: false }
   Create { id: 2, kind: View }
   Create { id: 4, kind: Text }
   Insert { parent: 2, child: 4, before: None }
   ...
   Frame { id: 2, x: 0, y: 0, w: 390, h: 844 }
   Frame { id: 4, x: 24, y: 64, w: 342, h: 34 }
   ...
   Text { id: 4, text: "nsh counter", content: 342x34 @ 0,0 }
   Text { id: 14, text: "0", content: 36x77 @ 0,0 }
perf event Press on view 26
perf event js: 413µs
perf commit: 10 ops, 672µs (list js 7µs), 7 mount items, 24 nodes
── press(+1): 7 items
   Create { id: 42, kind: Text }
   Insert { parent: 32, child: 42, before: None }
   Frame { id: 32, x: 24, y: 366, w: 342, h: 43 }
   Frame { id: 42, x: 0, y: 23, w: 342, h: 20 }
   Text { id: 14, text: "1", content: 36x77 @ 0,0 }
   Text { id: 42, text: "• 1", content: 342x20 @ 0,0 }
   Text { id: 34, text: "Recent values: 1", content: 342x17 @ 0,0 }
✓ App.tsx › steps (1.4s)
```

<a id="batches-and-mount-items"></a>

#### Lots et éléments de montage

Chaque bloc `── step: N items` est un **lot de montage** (mount batch), placé sous l'étape qui l'a produit : tout ce que la plateforme applique aux vues natives pour une frame,
en un seul passage vers le thread principal. Les lignes qu'il contient sont des **éléments de montage** (mount items) :

| Élément | Signification |
|---|---|
| `Create { id, kind }` | Crée une vue native (`View`, `Text`, `Image`, `Scroll`, ...). |
| `Insert { parent, child, before }` | Place une vue dans son parent, avant un frère (`None` : à la fin). |
| `Remove` / `Delete` | Détache une vue de son parent / la libère. |
| `ViewStyle { id, style }` | La décoration de la vue : arrière-plan, bordures, rayon, ombre, opacité, transformation, ... |
| `ViewProps { id, props }` | Réglages du toucher et de l'accessibilité, `testID`. |
| `Events { id, events }` | Les événements que la vue signale (`EventMask(1)` correspond à l'appui). |
| `Frame { id, x, y, w, h }` | Sa position et sa taille dans son parent, en points. |
| `Text { id, text, content }` | Le texte mis en page pour une vue de texte. |
| `Image { id, source, ... }` | Une image à charger. |

Seul ce qui a changé est envoyé : un appui qui modifie un seul nombre envoie un seul élément `Text` ; les vues n'ont pas de style par défaut ni de masque d'événements vide ; les frames inchangées ne sont pas envoyées. Une frame de défilement qui ne révèle aucune nouvelle ligne ne produit **aucun lot**.

<a id="the-762-lines"></a>

#### Les lignes `perf`

| Ligne | Signification |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | Durée du bundling et taille du bundle (paramètres de développement). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | Un commit : les opérations mises en file par JS, le temps passé par le cœur (rendu des composants, mise en page, diff), le temps JS passé à lier les lignes de liste, les éléments de montage produits et les nœuds vivants. |
| `turn: 2640µs (timers and tasks 1964µs)` | Un tour qui a produit un commit : sa durée totale, et le temps pris avant le commit par ses minuteurs JS et ses tâches de composants Rust (un composant Rust est rendu pendant le commit). |
| `first frame: eval 271µs, total 1235µs` | Durée d'évaluation du bundle, et durée entre le démarrage et le premier lot. |
| `event Press on view 20` / `event js: 196µs` | Un événement dispatché, et le temps pris en JS par son gestionnaire (et ce qu'il a déclenché). |

> [!NOTE]
> Le texte est mesuré en mode headless avec un moteur de texte approximatif ; les tailles de texte diffèrent donc légèrement de celles d'un appareil, qui utilise
> CoreText ou la mise en page de texte d'Android. La logique de mise en page, le nombre de vues et le nombre d'opérations sont identiques.

Les durées d'une seule exécution dépendent fortement de l'état de fréquence du CPU (une machine qui vient de sortir de veille est lente). Comparez les exécutions sur
la même machine, regardez le minimum de plusieurs exécutions, et faites davantage confiance au nombre d'opérations et d'éléments qu'aux microsecondes.

<a id="scrolling"></a>

### Défilement

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` déplace la liste de 10 points par frame, à 60 frames par seconde, et le lot de chaque frame est affiché :

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

Pour une [liste](./lists.md), cela montre la virtualisation à l'œuvre : quelles frames lient de nouvelles lignes, combien d'opérations coûte une ligne, et que les frames qui ne révèlent aucune nouvelle ligne ne produisent rien. Utilisez-le avec un build release (`cargo test --release`, ou `./target/release/nsh` dans un checkout) pour obtenir des durées significatives.

<a id="in-ci"></a>

### En CI

Les tests headless n'ont besoin ni d'appareil ni d'écran ; ils s'exécutent donc sur des runners Linux : `cargo test` pour les tests d'une application Rust, et
`nsh test`, qui ne nécessite rien d'autre que la CLI. Tout test en échec fait quitter l'une ou l'autre commande avec un code non nul : un test qui
échoue, une application qui ne compile pas ou n'affiche rien, une exception levée par l'application pendant une étape.

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test                            # a Rust app's tests
      - run: nsh test --junit test-results.xml     # its TypeScript tests, or a TSX app's
```

(Installez la CLI `nsh` sur le runner comme vous l'installez en local ; voir [Installation](./installation.md).)

`--junit <FILE>` écrit aussi les résultats dans un rapport XML JUnit, que les services de CI (rapporteurs de tests GitHub Actions,
GitLab, Jenkins, Azure Pipelines) affichent test par test : un `testsuite` par fichier de test, un `testcase` par test, avec ce qui a échoué,
où, et les textes à l'écran.

Pour surveiller les performances, enregistrez le nombre d'éléments de quelques interactions (les lignes `── … : N items` et les nombres `ops` /
`mount items` de `--trace`) et faites échouer le test s'ils augmentent. Les nombres sont déterministes ; les durées sur des machines de CI partagées
ne le sont pas.

> [!NOTE]
> Les tests s'exécutent sous les `capabilities` que `nsh.json` de l'application déclare, comme sur un appareil : ce que l'application ne déclare pas est
> aussi refusé dans le test.

<a id="784-for-ui-tests"></a>

## `testID` pour les tests d'UI

Les tests headless vérifient ce que le runtime affiche, et leurs sélecteurs `id:` trouvent les vues par identifiant de test. Pour piloter l'interface
native réelle avec les outils de test de la plateforme (XCUITest, Espresso / UI Automator, Appium, Maestro), donnez un identifiant de test aux vues :
`.test_id(…)` en Rust, `testID` en TSX :

```rust tabs
view()
    .test_id("add-to-cart")
    .p_3()
    .on_press(add)
    .child(text(move || format!("{} items", count.get())).test_id("cart-count"))
```

```tsx tabs
<View testID="add-to-cart" onPress={add} style={{ padding: 12 }}>
  <Text testID="cart-count">{`${count()} items`}</Text>
</View>
```

| Plateforme | Où va `testID` |
|---|---|
| iOS | Le `accessibilityIdentifier` de la vue (`app.otherElements["add-to-cart"]` dans XCUITest). |
| Android | Le nom de ressource de l'identifiant de vue du nœud d'accessibilité (`By.res("add-to-cart")` dans UI Automator). |

L'identifiant de test est une méthode de chaque élément en Rust, y compris les éléments des composants (`button().test_id("save")`, qui
nomme la racine du composant), et `testID` une prop de chaque élément et de chaque composant Rust (`Button`, `Dialog`, ...). Il ne change pas ce que disent les lecteurs d'écran ;
utilisez `accessibilityLabel` pour cela (voir [Accessibilité](./accessibility.md)). Dans la sortie de `--trace`, il apparaît dans
l'élément `ViewProps` de la vue sous la forme `test_id: Some("add-to-cart")`.

<a id="see-also"></a>

## Voir aussi

- [Performance](./performance.md) : ce qu'il faut observer dans ces chiffres
- [Serveur de développement et débogage](./dev-server-and-debugging.md)
- [Architecture](./architecture.md) : opérations, commits et lots de montage
