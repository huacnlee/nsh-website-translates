---
title: "Testen"
description: "Testen Sie Apps headless, in Rust mit cargo test und nsh_testing oder in TypeScript mit nsh test: Öffnen Sie die App, drücken, tippen, scrollen und warten Sie wie ein Benutzer, simulieren Sie Netzwerk und Speicher per Stub und lesen Sie die nativen View-Operationen und Zeitmessungen, die --trace ausgibt; testID für UI-Tests."
order: 61
group: tools
source_hash: c0e7414002b92551
---


# Testen

NSH führt Apps **headless** aus: mit der echten Engine (derselbe reaktive Graph, derselbe Renderer, dieselben Komponenten, dasselbe Layout und dieselbe Listenvirtualisierung wie auf einem Gerät, und QuickJS für TSX), mit Display-Frames bei 60 Hz, aber ohne Simulator, Gerät und Fenster. Es läuft überall dort, wo Cargo oder die CLI läuft, auch auf Linux-CI-Maschinen, und erfüllt zwei Aufgaben:

- Es führt Tests aus: Jeder Test öffnet die App, führt die Schritte eines Nutzers aus (drücken, tippen, scrollen) und prüft, was auf dem Bildschirm steht. Die Tests einer Rust-App sind in Rust geschrieben und werden mit `cargo test` und dem Crate `nsh-testing` ausgeführt; in TypeScript geschriebene Tests laufen mit `nsh test`, für TSX-Apps und Rust-Apps gleichermaßen;
- mit `--trace` gibt es jede Operation aus, die die Runtime an die nativen Views sendet, samt Zeitangaben: was der erste Frame, ein Tap oder ein Frame beim Scrollen kostet.

<a id="writing-tests"></a>

## Tests schreiben

Derselbe Test in Rust und in TypeScript: Er öffnet die App mit einer leeren Todo-Liste im Storage, tippt, drückt und prüft, was der Bildschirm zeigt.

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

## Tests in Rust mit cargo test

Die Tests einer Rust-App sind Integrationstests ihres Crates, mit `nsh-engine` und `nsh-testing` (dessen Default-Features, ohne QuickJS) als dev-dependencies:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` ist eine Engine in Smartphone-Größe (390×844 Punkte), bei der sonst nichts gesetzt ist; ihre Felder setzen, was die Optionen von `open` weiter unten setzen: `storage` (`MemoryStorage::new(entries)`), `network` (`StubNetwork`, siehe unten), `viewport`, `environment` (das Erscheinungsbild, die Locale, reduzierte Bewegung), `clock` (`Clock::manual(time)`, siehe unten). `nsh_testing::Headless::start(config)` startet die App und hält ein Modell der Views, die sie anzeigt. Seine Schritte sind die von `nsh test` weiter unten, mit denselben Selektoren, in Rust: `press`, `long_press`, `clear`, `type_text`, `submit`, `scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`, `set_system_time`, `set_viewport`, `set_clipboard` und `on_dialog`; `app.shows(text)` und `app.screen()` (`texts()`, `count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`) lesen, was auf dem Bildschirm steht. Ein Schritt gibt einen Fehler mit den Texten auf dem Bildschirm zurück, wenn er nicht ausgeführt werden kann.

`nsh_testing::tsx(entry, sets)` (Feature `bundle`) öffnet den TSX-Einstiegspunkt einer App auf dieselbe Weise, gebaut gegen die UI-Sets von NSH und des Crates ([Mit Rust bauen](./rust.md#testing)). `examples/gallery-rs` testet sein Rust-Root auf diese Weise, ein Modul pro Demo; `examples/rust-exports` testet seinen TSX-Einstiegspunkt aus Rust.

`nsh test` führt diese Tests ebenfalls aus: Erhält es das Verzeichnis einer App mit Rust-Crates (`nsh.json` `"rust"`), führt es vor den Testdateien `cargo test` für jedes darin enthaltene Crate aus und zeigt und zählt die Rust-Tests zusammen mit den TypeScript-Tests (`✓ src/lib.rs › tests::adds`), in seiner Zusammenfassung und in seinem `--junit`-Bericht. `nsh test` ist also der eine Befehl für eine Rust-App, eine TSX-App mit Crate und eine TSX-App gleichermaßen, und `nsh check` führt ebenso `cargo check --all-targets` auf den Crates aus, bevor es das TypeScript typprüft.

<a id="tests-with-nsh-test"></a>

## Tests mit nsh test

Eine Testdatei ist eine `*.test.tsx`- oder `*.test.ts`-Datei neben Ihrem Code. Sie importiert `nsh/test`, wie `App.test.tsx` oben:

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

Ein fehlgeschlagener Test zeigt, was geworfen wurde, die Stelle in der Testdatei und die Texte auf dem Bildschirm der App, die er geöffnet hat. Jeder Fehlschlag lässt `nsh test` mit einem Exit-Code ungleich null enden. `nsh init` legt ein `App.test.tsx` mit der App an, und `nsh check` typprüft Testdateien zusammen mit dem Rest (`.nsh/types` deklariert `nsh/test`).

Jede Testdatei läuft auf einer eigenen Engine, und ihre Tests laufen nacheinander in der angegebenen Reihenfolge. `open` startet die App auf einer weiteren, jedes Mal neuen Engine, sodass Tests nie Zustand teilen; die Apps, die ein Test geöffnet hat, werden geschlossen, wenn er endet. Ein Test schlägt fehl, wenn er wirft, wenn das zurückgegebene Promise abgelehnt wird und nach Ablauf seines Timeouts: 30 Sekunden oder die Millisekunden, die das dritte Argument von `test` angibt (`test("syncs", body, 60_000)`). Eine App mit eigenen Rust-Crates (`nsh.json` `"rust"`) führt ihre Tests auf dieselbe Weise in einem Headless-Runner aus, den NSH mit ihnen baut; in einer Rust-App (`nsh.json` `"root"`, [Mit Rust bauen](./rust.md)) startet `open(".")` ihre Root-Komponente.

<a id="grouping-tests-and-setting-them-up"></a>

### Tests gruppieren und einrichten

`describe`, die Hooks und die Varianten von `test` funktionieren wie bei Jest:

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

| Funktion | Beschreibung |
|---|---|
| `describe(name, body)` | Gruppiert die Tests und Blöcke, die `body` deklariert (sofort, beim Laden der Datei): Ihre Namen beginnen mit `name` (`the cart › starts empty`), und die Hooks, die es deklariert, laufen nur um sie herum. Blöcke lassen sich verschachteln. |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | Führen `fn` vor / nach jedem Test des Blocks aus, in dem sie deklariert sind (die Datei, ein `describe`): `beforeEach` der äußeren Blöcke zuerst, `afterEach` der inneren zuerst. Ein `beforeEach`, das fehlschlägt, lässt den Test fehlschlagen; `afterEach` läuft in jedem Fall. |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | Führen `fn` einmal vor dem ersten und nach dem letzten Test ihres Blocks aus, wenn einer seiner Tests läuft. Ein `beforeAll`, das fehlschlägt, lässt die Tests des Blocks fehlschlagen; ein `afterAll`, das fehlschlägt, wird als fehlgeschlagenes `<block> › afterAll` gemeldet. Eine App, die ein `beforeAll` öffnet, bleibt für die Tests des Blocks geöffnet und wird nach seinem `afterAll` geschlossen. |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | Deklariert einen Test oder einen Block, dessen Tests nicht laufen: Sie werden als übersprungen gemeldet. |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | Solange eine Testdatei einen solchen enthält, laufen nur diese Tests und Blöcke; die übrigen der Datei werden als übersprungen gemeldet. |
| `test.todo(name)` | Ein noch zu schreibender Test, der als solcher gemeldet wird. |

Ein Hook darf `async` sein; sein `timeout` beträgt 30 Sekunden, sofern nicht anders angegeben. Tests und Hooks werden beim Laden der Datei deklariert: Ein Test, der innerhalb eines Tests oder eines Hooks deklariert wird, wirft einen Fehler.

<a id="opening-the-app"></a>

### Die App öffnen

`open(entry, options?)` baut die App unter `entry` (relativ zur Testdatei; jeder Einstiegspunkt wird pro Lauf einmal gebaut), startet sie in einem 390×844-Viewport und wird aufgelöst, sobald sie gerendert hat und ruhig ist. Mit `--target` läuft die App mit den Optionen, wie der Test sie angibt: Eine Option, die die Plattform des Ziels nicht erfüllen kann, lässt `open` mit `ERR_NSH_TEST_UNSUPPORTED` ablehnen und nennt sie dabei (siehe [Auf einer echten Plattform](#on-a-real-platform)).

| Option | Standard | Beschreibung |
|---|---|---|
| `storage` | leer | Was `Storage` zu Beginn enthält: `{ todos: "[]" }`. |
| `network` | keine | Was die Requests der App erhalten, nach Route: siehe [Das Netzwerk stubben](#stubbing-the-network). `"live"`: das echte Netzwerk, für ihre Requests, Sockets und WebSockets. |
| `width`, `height` | 390, 844 | Der Viewport in Punkten: headless, das Fenster der Desktops, die Seite im Web. Unter iOS und Android füllt die App den Bildschirm des Geräts. |
| `safeArea` | 0 | Die Safe-Area-Insets in Punkten: `{ top: 47, bottom: 34 }`. |
| `clipboard` | leer | Der Text in der Zwischenablage zu Beginn. |
| `colorScheme` | `"light"` | Das Erscheinungsbild des Systems: `"light"` oder `"dark"` (`colorScheme()`-, `dark:`-Klassen). |
| `locale` | `"en-US"` | Die Locale des Geräts, ein BCP-47-Tag (`locale()`, der Standard von `Intl`). |
| `reducedMotion` | `false` | Der Nutzer hat um weniger Bewegung gebeten (`reduceMotion()`). |
| `platform` | `"ios"` | Die Plattform, als die die App headless läuft: `"ios"`, `"android"` oder die eines Desktops, `"macos"`, `"windows"`, `"linux"`, oder `"web"` im Desktop-Idiom (`platform.os`, `ios={{…}}`- / `android={{…}}`- / `desktop={{…}}`-Props, Tastaturkürzel). Mit `--target` läuft die App als die Plattform des Ziels: ein Desktop-`platform` auf jedem Desktop und im Web immer als Desktop (im Browser im Desktop-Idiom bei jeder Breite, wobei `platform.os` auf `"web"` bleibt), `"ios"` und `"android"` jeweils als sie selbst. |
| `clock` | die des Systems | Eine manuelle Uhr, deren Zeit sich nur so weit bewegt, wie der Test sie bewegt: `{}`, oder `{ time }`, um bei einem `Date` zu starten (oder bei Millisekunden seit der Unix-Epoche). Siehe [Die Zeit steuern](#controlling-time). |
| `host` | keine | Die Rolle der einbettenden App, die der Test spielt: `{ params, handlers }`. Siehe [Die Host-App simulieren](#playing-the-host-app). |

<a id="playing-the-host-app"></a>

### Die Host-App simulieren

Eine in eine native App eingebettete App spricht mit dieser über [`host`](../modules/nsh.md#host). In einem Test spielt der Test die Host-App: `host.params` liefert die Startparameter, die die App beim Start liest, und `host.handlers` beantwortet die `host.call` der App und hört ihre `host.post`, jeweils nach Namen. Ein Handler ist ein Wert, der jeden Aufruf beantwortet, oder eine Funktion der Daten des Aufrufs, die die Antwort zurückgibt (oder ein Promise darauf). Was die Funktion wirft, lehnt den Aufruf ab, so wie der Fehler einer Host-App es tut. Ein Aufruf eines Namens, den `handlers` nicht auflistet, schlägt fehl, wie in einer Host-App, die keinen behandelt.

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

`app.host.send(name, data)` sendet ein Event und wartet dann, bis die App ruhig ist. `app.host.calls()` und `app.host.posts()` listen der Reihe nach auf, was die Handler erhalten haben: `name` und `data`.

Die URLs, die die App öffnet ([`openUrl`](../modules/nsh.md#openurl), die Links eines `TextView` mit `links="open"`), werden aufgezeichnet und der App als geöffnet gemeldet; auf diesem Rechner öffnet sich nichts. `app.openedUrls()` listet sie auf:

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### Das Netzwerk stubben

`network` listet Routen nach `"<METHOD> <URL>"` auf (eine bloße URL ist ein `GET`; `*` passt auf jeden Text). Ein Request, auf den keine Route passt, schlägt fehl, sodass Tests das Netzwerk nie ungefragt erreichen. Eine Route ist eine Antwort oder eine Funktion des Requests, die eine zurückgibt (oder ein Promise darauf); in Rust akzeptiert `StubNetwork::new(routes)` dieselben Routen, jeweils ein `StubResponse` oder ein `StubRoute::Handler`:

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

| Antwortfeld | Standard | Beschreibung |
|---|---|---|
| `status` | 200 | Der Statuscode. |
| `headers` | keine | Header-Namen und -Werte. |
| `body` | leer | Ein String oder ein als JSON gesendeter Wert (mit `content-type: application/json`, sofern `headers` keinen angibt). |
| `error` | keine | Der Request schlägt stattdessen mit dieser Meldung fehl, wie wenn das Gerät offline ist. |
| `delay` | 0 | Wie lange die Antwort braucht, in Millisekunden; ein Schritt wartet nicht darauf, `waitFor` schon. Auf einer manuellen Uhr kommt sie, sobald die Uhr sie überschreitet. |

Die Funktion einer Route erhält den Request (`method`, `url`, `headers`, `body` als Text) und läuft in der Testdatei, sodass sie Requests zählen oder aus dem antworten kann, was der Test eingerichtet hat. Eine Funktion, die wirft, lässt den Request und den Schritt, der ihn ausgelöst hat, fehlschlagen. `app.requests()` listet die Requests auf, die die App gemacht hat, der Reihe nach, auf dieselbe Weise.

Auch Verbindungen bleiben im Test: Die Sockets der App (`net`) und WebSockets (das globale `WebSocket` und das Modul `websocket`) öffnen keine, es sei denn, `network` ist `"live"`. Nach den Capability-Prüfungen, die der eigene Lauf der App besteht, lehnen `net.connect` und `connect` des Moduls `websocket` mit `code` `ERR_NSH_TEST_NETWORK` ab, und ein globales `WebSocket` löst `error` aus, dann `close` (1006, nicht sauber), wie bei einer vom Netzwerk verweigerten Verbindung. Mit `"live"` verbinden sie sich zusammen mit den Requests der App mit dem echten Netzwerk. In Rust leistet `EngineConfig::refuse_connections` dasselbe für eine `Headless`-App: eine Funktion dessen, womit sich die App verbindet (die URL eines WebSockets, der `host:port` eines Sockets), die den Fehler zurückgibt, mit dem ihr Aufruf fehlschlägt.

<a id="controlling-time"></a>

### Die Zeit steuern

Auf der Systemuhr brauchen die Timer und nativen Animationen einer App so lange wie auf einem Gerät, und ebenso die Tests, die auf sie warten. Mit einer manuellen Uhr (`EngineConfig::clock` in Rust, `clock` von `open` in TypeScript) läuft die App auf einer Uhr, deren Zeit sich nur so weit bewegt, wie der Test sie bewegt, und zwar sofort, wie bei den Fake-Timern von Jest oder `page.clock` von Playwright. `app.clock` ist diese Uhr, und `null`, wenn die App auf der Systemuhr läuft:

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

Ein `StubNetwork`, dessen Antworten ein `delay` haben, folgt einer manuellen Uhr mit `.with_clock(clock.clone())`. Die folgenden Schritte sind die von `nsh test`; `Headless` hat jeden davon (`run_for`, `fast_forward`, `set_system_time`).

| Schritt | Beschreibung |
|---|---|
| `await app.clock.runFor(ms)` | Bewegt die Uhr um `ms` Millisekunden, jeweils einen Display-Frame auf einmal. Timer, `requestAnimationFrame`, native Animationen und verzögerte Antworten laufen, sobald sie fällig werden, der Reihe nach, jeweils zu ihrem Zeitpunkt. Wird aufgelöst, sobald die App ruhig ist. |
| `await app.clock.fastForward(ms)` | Bewegt die Uhr auf einmal um `ms` Millisekunden, wie ein Gerät, das aus dem Ruhezustand aufwacht: Die in der Zwischenzeit fälligen Timer laufen je einmal. |
| `app.clock.setSystemTime(time)` | Setzt die Wanduhrzeit (`Date.now()`, `new Date()`) auf ein `Date` oder Millisekunden, ohne einen Timer zu bewegen. |

`Date`, `performance.now()` und das Standarddatum von `Intl` folgen der Uhr. Schritte beenden, was gerade läuft, ohne darauf zu warten: Solange die App Frames anfordert oder eine native Animation läuft, kommen Frames nacheinander, jeder um die Zeit eines Frames (1/60 s) später auf der Uhr. Ein 300-ms-Übergang dauert einige Millisekunden, und ein währenddessen fälliger Timer läuft. Eine Animation, die endlos wiederholt wird (ein Spinner), läuft mit der Uhr mit: Sie dreht sich, wie der Test die Uhr bewegt. `app.wait(ms)` und ein langer Druck bewegen die Uhr um ihre Dauer. Ein Timer, der später fällig wird, läuft erst, wenn der Test die Uhr dorthin bewegt. `waitFor` und `waitUntil` bewegen die Uhr, während sie warten, jeweils einen Display-Frame auf einmal und schauen nach jedem Frame nach, sodass das, was ein Timer anzeigt, in einem Moment erscheint, während sie darauf warten: `waitFor("Saved", { timeout: 15_000 })` bewegt die Uhr um bis zu fünfzehn Sekunden. Ihr Timeout zählt auf beiden Uhren: Ein Warten bewegt die Uhr der App höchstens um diesen Wert und lehnt ab, sobald ebenso viel echte Zeit vergangen ist, sodass das, was von außerhalb der App kommt (die Funktion einer Route, das Netzwerk), so lange Zeit hat wie auf der Systemuhr. Die Tests der Galerie laufen auf diese Weise (`examples/gallery/tests`): Ihre zwölf Tests, die auf Animationen warten, dauern 6 s statt 28 s.
<a id="steps"></a>

### Schritte

Schritte benennen Views mit **Selektoren**, geschrieben wie bei Playwright:

| Selektor | Findet |
|---|---|
| `id:<testID>` | Die View mit dieser `testID`. |
| `label:<label>` | Die View mit diesem `accessibilityLabel`. |
| `text:<text>` | Einen Text, der es liest (Leerzeichen drumherum nicht gerechnet), einen Abschnitt eines Textes, der Presses annimmt (ein verschachteltes `<Text onPress>`, der Link eines `TextView`), oder einen Input, der es enthält oder, solange er leer ist, diesen Platzhalter hat. |
| `role:<role>`, `role:<role>[<name>]` | Eine View mit dieser `role` (`role:button`) und diesem Namen: ihr Label, sonst die Texte darin (`role:button[Save]`). |
| `view:<id>` | Die View mit dieser ID in der Ausgabe von `--trace`. |
| alles andere | Ein `testID`, sonst ein Label, sonst ein Text, wie geschrieben. |

Ein Teil, der mit einem kleingeschriebenen Wort und einem Doppelpunkt beginnt, benennt ein Präfix (`id`, `label`, `role`, `text`, `view`), daher ist
`tapped: solo` ein Schrittfehler, der sie auflistet. Ein Text, Label oder eine Test-ID, die so beginnt, bekommt ihr Präfix, das
den Rest wie geschrieben liest: `text:tapped: solo`, `label:note: draft`, `id:row:2`. Selektoren behalten ihre Bedeutung, wenn neue
Präfixe hinzukommen.

`label:`, `text:` und der Name einer Rolle nehmen auch einen regulären Ausdruck: `text:/^Buy/i`, geschrieben in der Syntax des Rust-Crates `regex`
(die Klassen, Gruppen, Anker und Quantifizierer von JavaScript, in linearer Zeit abgeglichen; die Flags `i`, `m` und `s`). ` >> ` schaut
in das hinein, was der vorherige Teil gefunden hat (`id:cart >> role:button[Remove]`), und `nth=<n>` behält einen der Treffer, ab 0
(`text:Delete >> nth=1`). Ein Selektor findet die Views, die ein Benutzer zuerst ansehen würde: im obersten Modal, dann auf dem Bildschirm,
und von einem Navigation-Stack nur den obersten Screen. Er trifft zu auf das, was der Benutzer sieht: Views mit einer Fläche, außerhalb von `visibility: hidden`, innerhalb des Fensters und
der Views, die sie beschneiden (`overflow: hidden`), oder irgendwo im Inhalt einer Scroll-View, die der Benutzer scrollen kann und die
durch Scrollen hereingeholt wird (`opacity` und Transformationen ausgenommen, wie bei Playwright). Ein Schritt, der auf eine View wirkt (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`), braucht genau
eine: Ein Selektor, der mehrere findet, lässt den Schritt fehlschlagen, und der Fehler nennt, wie man ihn eingrenzt.

| Schritt | Beschreibung |
|---|---|
| `await app.press(selector)` | Drückt die View oder die nächste umgebende View, die Presses hört (der Button um einen Text): `onPressDown`, `onPressUp`, `onPress`, innerhalb eines Fingers, der aufsetzt und abhebt, was die umgebenden Views, die auf Touches lauschen, hören (`onPressOutside` eines Overlays). Ein Abschnitt eines Textes wird auf seinen Zeichen gedrückt (`await app.press("Privacy policy")`), headless sowie unter iOS, Android und auf den Desktops. Ein zweiter Press derselben View innerhalb von 500 ms ist ihr zweiter Klick (`clicks: 2`, ein Doppeldruck), so wie die Plattformen ihn zählen. Schlägt fehl, wenn sie deaktiviert ist. |
| `await app.longPress(selector)` | Hält einen Finger darauf (oder auf die nächste umgebende View, die Presses oder Touches hört) für ihre `delayLongPress` (500 ms): `onPressDown`, `onLongPress`, `onPressUp`; es folgt kein `onPress`. Die Handler der Touches hören den Finger (ein `ContextMenu` oder `Tooltip` öffnet sich). |
| `await app.clear(selector)` | Leert den Input, so als würde man alles markieren und löschen. |
| `await app.type(selector, text)` | Tippt in den Input (oder den ersten Input innerhalb der View; `text:` findet auch den Text oder Platzhalter eines Inputs) ans Ende dessen, was er enthält, Taste für Taste: Er erhält den Fokus, dann ist jedes Zeichen ein `onKeyPress` und ein `onChange`, innerhalb von `maxLength`. Ein `\n` in einem einzeiligen Input ist die Return-Taste. |
| `await app.submit(selector)` | Die Return-Taste im Input, wie sein `submitBehavior` es vorgibt: `onSubmit` (und der Fokus verlässt einen einzeiligen Input) oder ein Zeilenumbruch in einem mehrzeiligen. |
| `await app.scroll(selector, distance)` | Zieht die Scroll-View oder Liste (die View, die umgebende oder die erste darin) um `distance` Punkte entlang ihrer Achse, 10 Punkte pro Frame, innerhalb ihres Inhalts, wie es der Benutzer kann (`scrollable`). Negative Werte scrollen zurück. |
| `await app.hover(selector)` | Bewegt die Maus über die Mitte der View: Die Views darunter, die sie verlassen hat, hören `onMouseLeave`, die, über die sie gekommen ist, hören `onMouseEnter` und übernehmen ihre `hover:`-Styles, und die lauschenden hören `onMouseMove` mit ihrer Position und ohne gedrückte Taste. Die Desktops und das Web in jeder Breite, auch ein Browser im Phone-Idiom (headless: ein Desktop oder `"web"` `platform`); ein iOS- oder Android-Phone hat keine Maus: Dort schlägt der Schritt fehl. |
| `await app.rightClick(selector)` | Die sekundäre Maustaste über der Mitte der View: Sie oder die nächste umgebende lauschende View hört `onContextMenu`. Die Desktops und das Web (headless: ein Desktop `platform`); ein Phone hat keine Maus: Dort schlägt der Schritt fehl. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | Fügt in den Input ein, wie es der Benutzer mit diesem Inhalt in der Zwischenablage tut: Er erhält den Fokus und hört `onPaste` (`html` denselben Inhalt mit seiner Formatierung, `files` sind Pfade, deren Bytes er als `File`s erhält, `uris` `file:` URLs), dann geht sein Text so hinein, wie `pasteBehavior` es vorgibt. Headless, unter macOS, unter iOS und im Web; die Zwischenablage des Rechners bleibt unverändert. |
| `app.menu()` | Die Aktionen des Kontextmenüs, das die App zeigt (`Menu.popup`): `label` (die eines Untermenüs nach seiner eigenen, `"Share > Mail"`), `disabled` und `checked` für einen auswählbaren Eintrag; `null`, wenn keines geöffnet ist. |
| `await app.chooseMenuItem(label)` | Wählt die Aktion des geöffneten Kontextmenüs, so wie ein Klick darauf es tut: Die App hört `onMenu` (ihr `onSelect` läuft), dann schließt sich das Menü. Schlägt fehl, wenn der Eintrag deaktiviert ist oder fehlt. |
| `await app.closeMenu()` | Schließt das geöffnete Kontextmenü ohne Auswahl, so wie Escape es tut. |
| `await app.keyboard.press(keys)` | Drückt eine Taste mit ihren Modifikatoren, wie `keymap` sie benennt (`"mod+k"`, `"shift+/"`, `"escape"`; `mod` ist die Befehlstaste der Plattform), auf einer Hardware-Tastatur, auf jeder Plattform (auch Phones und Tablets haben eine): Der Shortcut der App dafür hört sie (`keymap.bind`, `onKeyCommand`), sonst bewegen unter macOS und im Web Tab und Shift+Tab den Tastaturfokus zwischen den Inputs und den Views, die Presses annehmen (`onFocus`, `onBlur`, `focus:`-Styles), und Return oder Space drückt die View, auf der er liegt, sonst nimmt der fokussierte Input ein Zeichen, Backspace oder die Return-Taste, sonst geht Escape zurück. |
| `await app.keyboard.down(keys)` / `up(keys)` | Hält Modifikatortasten (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, verbunden durch `+`) gedrückt bis `up`: Die Presses, Drags und Hovers in der Zwischenzeit tragen sie, wie ein Mod-Klick oder ein Shift-Drag. Vorerst headless und unter Linux. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | Zieht wie `drag` und hält den Finger unten bis `drop()`, der ihn dort abhebt, wo er ist: Die Schritte dazwischen betrachten den Bildschirm mitten im Drag (eine Drag-Vorschau, eine Drop-Linie). Vorerst headless und unter Linux. |
| `await app.dropFiles(selector, uris)` | Legt lokale Dateien (`file:`-URLs, wie ein Dateimanager sie zieht) auf der Mitte der View ab: Sie oder die nächste umgebende lauschende View hört `onFileDrop`. Desktops, headless und vorerst Linux. |
| `await app.drag(selector, { x, y })` | Ein Finger landet auf der Mitte der View, ruht 100 ms, bewegt sich um `x`, `y` Punkte, 10 pro Frame, und hebt ab, so wie die Eingabe der Plattform es aufnimmt: Ein Pan folgt ihm (`pan={{ x, y }}`, `onPanStart`, `onPanEnd` mit der Geschwindigkeit beim Loslassen), die Views, die auf Touches lauschen, hören ihn (`onTouchStart`, `PanResponder`), eine Scroll-View scrollt damit und aktualisiert sich, wenn sie weit genug über ihren Anfang hinausgezogen wird (`onRefresh`), und ein Press darunter wird abgebrochen, sobald er sich wegbewegt. Auf den Desktops und im Web ist es die Maus. |
| `await app.wait(ms)` | Lässt die App `ms` Millisekunden laufen: Timer, Animationen, Requests. Bei einer manuellen Uhr wird diese um `ms` weitergestellt (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | Wird aufgelöst, sobald eine View passt, oder mit `{ state: "gone" }`, sobald keine mehr passt; schlägt nach `timeout` ms fehl (5000). Bei einer manuellen Uhr wird diese, solange der Schritt wartet, jeweils um einen Display-Frame weitergestellt, höchstens um `timeout`. |
| `await app.waitUntil(condition, options?)` | Wird aufgelöst, sobald `condition()` true zurückgibt, und schaut nach jeder Änderung der App erneut: für das, was kein Selektor ausdrückt (`() => app.storage().note === "Milk"`). Bei einer manuellen Uhr wird diese zwischen zwei Prüfungen um einen Display-Frame weitergestellt, höchstens um `timeout`. |
| `app.shows(selector)` | Ob jetzt eine View passt. |
| `app.count(selector)` | Wie viele Views jetzt passen. |
| `app.enabled(selector)` | Ob die View Eingaben annimmt: Weder sie noch eine umgebende View ist deaktiviert, und ein Input ist nicht `readonly`. |
| `app.texts()` | Die Texte, die jetzt auf dem Bildschirm stehen, der Reihe nach. |
| `app.value(selector)` | Der Text eines Inputs, `null`, wenn keiner passt. |
| `app.spanStyle(selector)` | Der aufgelöste Style des ersten gefundenen Zeichens, headless und auf jeder `--target`: `color`, optional `backgroundColor`, `fontSize`, `fontWeight`, `italic`, `underline` und `lineThrough`. Farben sind `#rrggbbaa`; Größen sind in Punkten angegeben. |
| `app.storage()` | Was der Speicher der App jetzt enthält. |
| `await app.back()` | Geht zurück wie der Benutzer (der Zurück-Button eines Headers, ein Sheet nach unten wischen): Der innerste Stack des neuesten Modals, sonst der des Screens, entfernt seinen obersten Screen (`onDismiss`) oder fragt ihn (`onBackRequest`), wenn er `preventBack` hat; ohne einen fragt das neueste Modal, ob es schließen soll (`onRequestClose`). Schlägt fehl, wenn es nichts gibt, wovon aus man zurückgehen könnte. |
| `app.onDialog(handler)` | Beantwortet die Dialoge, die die App ab jetzt zeigt (`Alert.alert`, Action Sheets): `handler` erhält den Dialog (`title`, `message`, `buttons`, `cancelable`, `sheet`) und gibt den Text des zu drückenden Buttons zurück oder `null`, um ihn ohne einen zu schließen. |
| `app.dialogs()` | Die Dialoge, die die App gezeigt hat, der Reihe nach. |
| `app.onPick(handler)` | Beantwortet die Auswahlen, die die App ab jetzt anfordert (`Picker.pickImages`): `handler` erhält, was die Auswahl verlangt (`multiple`, `limit`, `maxDimension`, `quality`, `format`), und gibt die Dateien zurück, die der Benutzer auswählt (`{ name, type?, data: Uint8Array }`, der App unverändert übergeben), oder `null` zum Abbrechen. Ohne Handler werden Auswahlen abgebrochen. Headless-Läufe. |
| `app.picks()` | Die Auswahlen, die die App angefordert hat, der Reihe nach. |
| `app.hear(text)` | Der Benutzer sagt `text` in die laufende Speech-Session (`Speech.start`): Ihr `result` meldet `text` als das gesamte bisherige Transkript. Headless-Läufe. |
| `app.endSpeech(error?)` | Beendet die laufende Speech-Session: Mit `error` (`"no-speech"`, `"network"`, ...) schlägt sie fehl, sonst kommen ein letztes finales Ergebnis und `end`, `no-speech`, wenn nichts gehört wurde. Headless-Läufe. |
| `app.speechRequests()` | Die Speech-Sessions, die die App gestartet hat, der Reihe nach: `lang` (`null` für die des Benutzers) und `interim`. |
| `app.clipboard()` | Der Text in der Zwischenablage jetzt, `null`, wenn sie keinen enthält. |
| `app.requests()` | Die Requests, die die App gemacht hat, der Reihe nach: `method`, `url`, `headers`, `body`. |
| `await app.host.send(name, data?)` | Sendet ein Event der Host-App an die App (`host.on`) und wartet dann, bis Ruhe einkehrt. Siehe [Die Host-App simulieren](#playing-the-host-app). |
| `app.host.calls()`, `app.host.posts()` | Die Aufrufe und Posts der App, die das `host.handlers` von `open` erhielt, der Reihe nach: `name`, `data`. |
| `app.openedUrls()` | Die URLs, die die App geöffnet hat (`openUrl`), der Reihe nach: aufgezeichnet, nie geöffnet. |
| `await app.setViewport(width, height)` | Ändert die Größe des Viewports, so wie das Drehen des Geräts oder das Ändern der Fenstergröße es tut (`windowSize()`). |
| `await app.setColorScheme(scheme)` | Stellt das Erscheinungsbild des Systems auf `"light"` oder `"dark"`, wie es der Benutzer tut. |
| `await app.setLifecycle(state)` | Versetzt die App in `"background"`, `"inactive"` oder `"active"`, so wie das System es tut, wenn der Benutzer sie verlässt, zu einer anderen App oder einem anderen Fenster wechselt und zurückkommt (`lifecycle()`). Nur Headless-Läufe. |
| `await app.screenshot(path?)` | Ein Bild des Fensters der App als PNG (ein `Uint8Array`), auf diesem Rechner auch unter `path` gespeichert, wenn angegeben (relativ zum aktuellen Verzeichnis). Nur eine echte Plattform zeichnet die App: siehe [Auf einer echten Plattform](#on-a-real-platform). |

Ein Schritt wird aufgelöst, sobald die App 100 ms lang nichts gerendert hat und keine native Animation läuft, die von selbst endet (höchstens 2 s,
für Apps, die ständig rendern; bei einer manuellen Uhr zusätzlich 2 s der App-Zeit), sodass das, was er geändert hat, auf dem Bildschirm steht, wenn die nächste Zeile läuft; nutze `waitFor` für das, was später kommt (eine Antwort, ein Timer). Bei einer manuellen Uhr wartet ein Schritt
nicht auf diese 100 ms: Er wird aufgelöst, sobald die App alles ausgeführt hat, was der Schritt und die Zeit der Uhr
fällig gemacht haben (jetzt fällige Timer, Promises, eine sofort beantwortete gestubbte Antwort) und keinen Frame verlangt, es sei denn, ein Request ist noch
unterwegs; so laufen Tests mit einer manuellen Uhr ohne Pausen zwischen ihren Schritten. Was ein anderer Thread beantwortet (ein
`nsh/host`-Aufruf, ein Dateilesevorgang, die Arbeit eines Rust-Tasks auf einem Thread), trifft nach dem Auflösen des Schritts ein: Warte mit `waitFor` auf das, was
es zeigt. Eine Animation, die endlos läuft,
etwa ein Lade-Spinner, läuft im Hintergrund weiter, während Schritte und `waitFor` fortfahren, so wie eine endlose
CSS-Animation in den Tests eines Browsers. Ein Schritt schlägt fehl und lässt damit den Test fehlschlagen, wenn nichts zu seinem Selektor passt (der Fehler listet die Texte auf dem
Bildschirm auf), wenn die App währenddessen eine Exception geworfen hat und wenn die App etwas angefordert hat, das nur eine echte Plattform beantwortet.

Die Fehler, die ein Test erwarten darf, tragen einen `code`, der unverändert bleibt; ihre Meldungen sind für Menschen gedacht und können sich ändern, daher
prüft ein Test den Code:

| `code` | Der Schritt oder die Abfrage |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | Nichts auf dem Bildschirm passt zum Selektor, oder das geöffnete Menü hat keinen solchen Eintrag. |
| `ERR_NSH_TEST_DISABLED` | Die View, die der Selektor benennt, ist deaktiviert (eine Scroll-View, die der Benutzer nicht scrollen kann, ein deaktivierter Menüeintrag). |
| `ETIMEDOUT` | `waitFor` oder `waitUntil` hat das Zeitlimit überschritten, oder die App hat nach `open` nichts gerendert. |
| `ERR_NSH_TEST_NO_BACK` | `back()` fand nichts, wovon aus man zurückgehen könnte. |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` mit `--target` erhielt eine Option, die die Plattform des Ziels nicht erfüllen kann: `width` oder `height` unter iOS und Android, das `platform` eines Phones auf einem Desktop oder im Web, das eines Desktops oder des jeweils anderen Phones unter iOS oder Android, `host.handlers`. Die Meldung nennt sie. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` liest ein verschachteltes `<Text testID="guide">`; `text:word` liest das erste Zeichen
dieses Treffers. Grenze Abfragen mit `id:note >> text:word` ein und wähle wiederholte Treffer mit `>> nth=0` aus.
Die Abfrage meldet einen Fehler für einen fehlenden, mehrdeutigen oder leeren Abschnitt. Das Aktualisieren des `testID` eines Abschnitts verwendet sein Text-Layout
wieder und behält die Anzahl der `onTextLayout`-Callbacks bei.
<a id="what-headless-runs-play-of-the-platform"></a>

### Was Headless-Läufe von der Plattform übernehmen

Ein Headless-Lauf hat die echte Runtime und keine Plattform. Er übernimmt die Rolle der Plattform, die das Protokoll von NSH festlegt, und nichts von dem, was nur eine echte Plattform kann:

- **Native Animationen laufen** Frame für Frame bis zum Ende: `start(callback)`-Callbacks werden ausgeführt, ebenso alles, was auf sie wartet. Endlose Schleifen laufen, bis die App sie stoppt.
- **Zurückgehen** entfernt Screens und schließt Modals wie eine Plattform (`app.back()`).
- **Dialoge werden beantwortet**: durch das `onDialog` des Tests, sonst durch ihren Abbrechen-Button, sonst werden sie geschlossen, sofern das möglich ist. Ein Dialog, den nur seine anderen Buttons beantworten, lässt den Schritt fehlschlagen, der ihn angezeigt hat, bis der Test angibt, welcher Button gedrückt werden soll.
- **Die Zwischenablage enthält Text**: was die App kopiert, wird beim Einfügen zurückgelesen (`clipboard`, um mit etwas Text zu starten).
- **Der Host der Seite beantwortet `host`**, wenn die `nsh.json` der App in `web.host` einen benennt ([Der Host der Seite](#the-pages-host)).
- **Die App läuft mit ihren Capabilities**: was ihr `nsh.json` in `capabilities` deklariert, wird wie auf einem Gerät durchgesetzt, sodass abgelehnt wird, was sie nicht deklariert.
- **URLs werden aufgezeichnet**: was die App öffnet, wird als geöffnet gemeldet, und `app.openedUrls()` listet es auf.
- **Auswahlen werden beantwortet**: mit den Dateien des Tests (`onPick`), sonst abgebrochen, sodass `Picker.pickImages` mit `[]` aufgelöst wird.
- **Sprache kommt vom Test**: `Speech.available()` wird mit `true` aufgelöst, eine Session startet sofort und hört, was `hear` sagt.
- **Modals erscheinen sofort**: `onShow` kommt, sobald eines präsentiert wird.
- **Bilder werden nicht geladen**: weder `onLoad` noch `onError` kommt, und `Image.getSize` und `Image.prefetch` werden abgelehnt.
- **Was nur eine echte Plattform beantwortet, lässt den Schritt fehlschlagen**: ein Bild oder Dateien in der Zwischenablage.

<a id="the-pages-host"></a>

### Der Host der Seite

Eine für das Web veröffentlichte App erhält ihren Host von ihrer Seite: `nsh.json` `web.host`, ein Modul, das `createHost(player)` exportiert ([Web](./web.md#the-hosts-functions)). Headless-Läufe laden dieses Modul für jede App, die ein Test öffnet, vor dem Start der App, in einem eigenen JavaScript-Kontext (Timer und `console`, nichts vom Browser, keine Imports): Sein `call` beantwortet das [`host.call`](../modules/nsh.md#host) der App, sein `player.hostEvent` erreicht `host.on`, und `host.available()` ist `true`. Ein `call`, das einen Fehler wirft, abgelehnt wird oder etwas zurückgibt, das kein JSON ist, lässt den Aufruf der App mit seiner Meldung fehlschlagen, wie auf der Seite, und Events, die vor dem Start der App gesendet werden, erreichen ihre Top-Level-Listener, sobald sie läuft. `--web-host <module>` benennt ein anderes Modul. Das `capabilities.host` der App muss auflisten, was sie aufruft, wie auf der Seite. Das Timeout eines Aufrufs und die eigenen Timer des Hosts laufen auf der Zeit der App, sodass eine manuelle Uhr sie weiterbewegt (`app.clock.runFor`). In einem Browser (`--target web`) führt die Entwicklungsseite für jede App das `web.host` von `nsh.json` aus, wie eine veröffentlichte Seite; auf den anderen Plattformen (`--target`) haben die Apps keinen Host: `host.available()` ist `false`.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` enthält eine App, ihren Host und ihre Tests.

<a id="expectations"></a>

### Erwartungen

`expect(value)` prüft Werte wie Jest, so wie JS sie erzeugt hat: `toBe` ist `Object.is`, `toEqual` vergleicht Member für Member, und ein `Date`, ein `Map` oder ein `Uint8Array` wird als das verglichen, was es ist. Jede Prüfung wirft einen Fehler, wenn sie nicht erfüllt ist. `.not` kehrt sie um: `expect(app.texts()).not.toContain("Error")`. Bei einer Funktion prüft `toThrow`, was ihr Aufruf wirft; bei einem Promise oder einer Funktion, die eines zurückgibt, prüfen `rejects` und `resolves`, was es liefert, wie in Jest: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| Prüfung | Gilt, wenn |
|---|---|
| `toBe(expected)` | Der Wert ist `expected`, wie `Object.is` es definiert: derselbe Primitivwert (`NaN` ist `NaN`, `0` ist nicht `-0`) oder dasselbe Objekt. |
| `toEqual(expected)` | Der Wert ist gleich `expected`, Member für Member, wie bei `toEqual` von Jest: Objekte anhand ihrer eigenen aufzählbaren Properties (eine Property, die `undefined` ist, zählt als fehlend), Arrays Element für Element, Datumswerte anhand ihrer Zeit, reguläre Ausdrücke anhand von Source und Flags, Maps und Sets anhand ihrer Einträge in beliebiger Reihenfolge, `ArrayBuffer`s und Typed Arrays anhand ihrer Bytes, Fehler anhand von Name und Meldung; `NaN` ist gleich `NaN`. Eine Instanz einer Klasse ist gleich einem einfachen Objekt mit denselben Properties. |
| `toMatchObject(subset)` | Der Wert hat jede Property von `subset`, jeweils gleich, wie `toEqual` es definiert, und Objekte darin werden ihrerseits abgeglichen; andere Properties werden nicht betrachtet, und Arrays werden Element für Element abgeglichen, und zwar alle. |
| `toContain(item)` | Ein Array, ein `Set`, ein Typed Array oder ein anderes Iterable enthält `item` (`===`), oder ein String enthält es. |
| `toContainEqual(item)` | Ein Array, ein `Set` oder ein anderes Iterable enthält ein Element, das gleich `item` ist, wie `toEqual` es definiert. |
| `toBeTruthy()`, `toBeFalsy()` | Der Wert ist truthy / falsy, wie JS es sieht. |
| `toMatch(pattern)` | Ein String enthält `pattern` (einen String) oder passt darauf (ein `RegExp`, ausgeführt von der JS-Engine: Look-behind, Backreferences und benannte Gruppen funktionieren wie in JavaScript). |
| `toHaveLength(n)` | Das `length` des Werts ist `n`: bei einem String seine UTF-16-Einheiten, bei einem Array oder Typed Array seine Elemente. |
| `toBeNull()` | Der Wert ist `null`. |
| `toBeUndefined()`, `toBeDefined()` | Der Wert ist `undefined` / alles andere. |
| `toBeNaN()` | Der Wert ist `NaN`. |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | Eine Zahl vergleicht sich so mit `n`. |
| `toThrow(expected?)` | `expect(fn)`: Der Aufruf von `fn` wirft einen Fehler. Mit `expected` passt der Fehler darauf: Seine Meldung enthält einen String oder passt auf einen `RegExp`; eine Fehlerklasse (`TypeError`, eine Klasse der App) ist die `name` des Fehlers, und `Error` passt auf jeden Fehler; ein Fehler hat dieselbe Meldung. |
| `rejects.toThrow(expected?)` | `expect(promise)`: Das Promise wird abgelehnt, mit einem Fehler, der auf `expected` passt, wie `toThrow` es definiert. |
| `rejects.toMatchObject(subset)` | `expect(promise)`: Das Promise wird mit einem Wert abgelehnt, der auf `subset` passt, wie `toMatchObject` es definiert: die eigenen Properties eines Fehlers (`code`, `permission`, ...) mit seinem `name` und `message`. |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)`: Das Promise wird mit einem Wert aufgelöst, der die Prüfung erfüllt. |

Eine fehlgeschlagene Prüfung nennt, was sie erhalten hat und was sie erwartet hat, so geschrieben, wie JS es schreiben würde: `expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

`rejects` und `resolves` haben außerdem ein eigenes `.not`: `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### Auf einer echten Plattform

`nsh test --target macos` (oder `linux`, `windows`, `gpui`, `web`, `ios`, `android`) führt dieselben Tests auf dem Entwicklungshost der Plattform statt headless aus: Jeder `open` startet die App in einem eigenen Fenster mit einem frischen Datenverzeichnis, und die Schritte agieren mit der eigenen Eingabe der Plattform an den Views, die ihre Selektoren benennen, wie Playwright in einem Browser:

- Ein Press ist ein Klick in der Mitte der View, ein Long Press ein gehaltener Klick, `type` klickt das Input an und tippt seine Tasten, `scroll` ist eine Trackpad-Geste über der Scroll-View, `back` ist das, was ein Benutzer tut (Escape unter macOS und Linux, die Zurück-Taste der Maus unter Windows und in GPUI, die Zurück-Schaltfläche des Browsers im Web, ein nach unten gewischtes Sheet, die Escape-Geste von VoiceOver, solange ein Menü, ein Popover oder `Sheet` geöffnet ist, sonst die Zurück-Schaltfläche der Kopfzeile unter iOS, die Zurück-Taste unter Android);
- eine View außerhalb des Bildschirms wird zuerst in den sichtbaren Bereich gescrollt, Geste für Geste; auf einem Touchscreen setzt der Finger dort an, wo die Seite selbst ihn annimmt, abseits der Views, die einem Drag folgen (ein Slider, eine Zeichenfläche), wie ein Benutzer scrollt;
- Selektoren, Waits und Queries sehen dasselbe Modell der App wie Headless-Läufe, aufgebaut aus dem, was der Host zeichnet, sodass sie dieselben Views finden;
- Dialoge sind die der Plattform: `app.dialogs()` liest sie aus, und ihre Beantwortung (`onDialog`, oder ihr Abbrechen-Button, wenn der Test nichts angibt) drückt ihren Button;
- `app.screenshot(path)` erstellt ein Bild des Fensters.

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

Das Fenster öffnet sich in der Größe des Viewports (390 × 844, sofern `open` nichts anderes angibt), innerhalb des Bildschirms; unter iOS und Android füllt die App den Bildschirm des Geräts aus, in der Größe des Geräts. Die App läuft als die Plattform des Targets (`platform.os`). Eine manuelle `clock` funktioniert wie headless: `app.clock.runFor`, `fastForward` und `setSystemTime` bewegen die Zeit der App sofort (Timer, `requestAnimationFrame` einen Frame auseinander, `Date`), `app.wait(ms)`, `waitFor` und `waitUntil` bewegen sie ebenfalls, und jeder Frame, den die Plattform zeigt, bewegt sie um einen Frame (1/60 s), sodass die Zeit der App vergeht, während sie animiert. Die eigenen Animationen der Plattform und das `delay` einer Route brauchen echte Zeit. Die Requests der App erreichen den Test wie headless: `network`-Routen beantworten sie, ein Request, auf den keine Route passt, schlägt fehl, und `"live"` lässt sie ins Netzwerk des Hosts durch; `app.requests()` listet sie alle auf. Sockets und WebSockets verbinden sich mit `"live"` im Netzwerk des Hosts und werden sonst wie headless abgelehnt. `storage` liegt im Storage der App, wenn sie startet, und `app.storage()` liest es aus der App. `locale`, `reducedMotion` und `safeArea` enthalten, wenn `open` sie vorgibt (einschließlich eines Standardwerts), was immer die Plattform meldet, und ein von ihm vorgegebenes `colorScheme` schaltet das Erscheinungsbild des Systems um (`"light"` ebenfalls); was es weglässt, bestimmt die Plattform, und die Clipboard-Aufrufe der App werden aus der eigenen Zwischenablage des Tests bedient (`clipboard` ist zunächst ihr Text, `app.clipboard()` liest sie aus), sodass die Zwischenablage des Rechners unverändert bleibt; Kopieren und Einfügen eines Text-Inputs verwenden die des Systems. `host.params` erreicht die App, `app.host.send` sendet Events, und die URLs, die die App öffnet, werden für `app.openedUrls()` aufgezeichnet, statt geöffnet zu werden. `host.handlers` läuft headless, wo der Test die Aufrufe der App beantwortet. `open` prüft seine Optionen gegen das Target: `width` und `height` unter iOS und Android, ein `platform` einer anderen Geräteart (das eines Telefons auf einem Desktop oder im Web, das eines Desktops oder des anderen Telefons unter iOS oder Android) und `host.handlers` werden mit `ERR_NSH_TEST_UNSUPPORTED` abgelehnt, sodass ein Test so läuft, wie er geschrieben ist, oder sagt, was er braucht. Der `platform` eines Desktops (`"macos"` für Maus und Tasten eines Desktops) läuft auf jedem Desktop-Target und im Web, als die Plattform dieses Targets und immer als Desktop: Im Browser startet die Seite unabhängig von ihrer Breite im Desktop-Idiom, wo sie ohne `platform` (oder mit `"web"`) ihr Idiom wie ein Browser bestimmt (ein Desktop ab 600 Punkten Breite). Eine App mit eigenen Rust-Crates läuft in einem Entwicklungshost, der mit ihren Crates gebaut wurde, den NSH für die Plattform baut; der Host einer Rust-App führt ihre Root aus, sodass `open(".")` sie dort startet wie headless.

Im Web laufen die Apps auf der Seite des Entwicklungshosts in einem Headless-Chrome, -Edge oder -Chromium: dem auf diesem Rechner installierten oder der ausführbaren Datei, die `--browser <PATH>` benennt (ein Browser ist erforderlich: `nsh test` gibt an, wo gesucht wurde, wenn keiner gefunden wird). Ein Browser bedient den Lauf, und jeder `open` erhält eine Seite mit eigenem Storage. Die Eingabe ist die vertrauenswürdige Eingabe des Browsers, wie die eines Benutzers: Mausklicks, Scrollen mit dem Mausrad und Tasten.

Unter iOS laufen die Apps im Entwicklungshost in einem iOS-Simulator: dem gestarteten, sonst dem neuesten iPhone, das `nsh test` bootet. Die Schritte sind Berührungen eines Fingers und die Eingabe der Software-Tastatur, wie UIKit sie vom Gerät erhält. `setColorScheme` schaltet das Erscheinungsbild des Simulators um, das `nsh test` nach der App zurücksetzt, und der Bildschirm hat die Größe des simulierten Geräts.

Unter Android laufen die Apps im Entwicklungshost auf dem ersten Gerät oder Emulator, das `adb devices` auflistet, mit eigenem Storage. Die Schritte sind Berührungen eines Fingers und Tasten einer Tastatur, wie die Views der App sie vom Gerät erhalten; `back` ist das Zurück des Systems. `setColorScheme` schaltet das Dark Theme des Geräts um, das `nsh test` nach der App zurücksetzt.

<a id="steps-from-standard-input"></a>

### Schritte von der Standardeingabe

Wenn statt Tests der Einstiegspunkt der App angegeben wird, öffnet `nsh test` die App im echten Netzwerk, lässt sie 1,2 s laufen und führt dann die Schritte aus, die die Standardeingabe liefert, mit `app` der App:

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

Die 1,2 s lassen die Idle-Garbage-Collection der Engine vor dem ersten Schritt laufen, sodass eine App, die loslässt, was sie noch verwendet, dies zeigt: Ihre Handler funktionieren nicht mehr.

Für die Beispiele gibt es Tests als Ausgangspunkt: `examples/gallery-rs` für eine Rust-App (`cargo test`, ein Modul pro Demo, und `App.test.tsx`), `examples/rust-exports` für eine App mit einem Rust-Crate, `examples/counter` und `examples/gallery/tests` (Storage, Inputs, eine lange Liste, gestubbte Requests, Dark Mode, eine manuelle Uhr) für TSX-Apps.

<a id="tracing-with---trace"></a>

## Tracing mit --trace

`--trace` gibt jeden Mount-Batch der Apps aus, die die Tests öffnen, unter dem Schritt, in dem er kam, sowie die Zeit jedes Commits. In Rust gibt ein Test dasselbe aus: `observe` übergibt ihm jeden Batch mit seinem Schritt, und `EngineConfig::trace` protokolliert die `perf`-Zeilen über das Crate `log` (Target `nsh::perf`; installiere im Test einen Logger wie `env_logger`):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` akzeptiert `--trace` für eine Testdatei oder für den Einstiegspunkt der App mit den Schritten auf der Standardeingabe:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

Mit `--target` ist der Trace der der Plattform: die Batches, die der Host angewendet hat, unter den Schritten, die sie ausgelöst haben, und die eigenen Zeitmessungen des Hosts für jeden Commit und jedes Event, auf der Hardware des Geräts.

Verwende ihn, um:

- zu prüfen, dass eine App (oder eine Demo) ohne Fehler gebaut, ausgewertet und gerendert wird;
- genau zu sehen, welche nativen Views eine Änderung erzeugt, verschiebt oder aktualisiert und wie viele;
- die Kosten des ersten Frames, eines Taps und jedes Scroll-Frames zu messen;
- Regressionen in der CI zu erkennen.
<a id="reading-the-output"></a>

### Die Ausgabe lesen

Hier ist das Counter-Beispiel mit einem Tastendruck (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), gekürzt:

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

#### Batches und Mount-Items

Jeder `── step: N items`-Block ist ein **Mount-Batch** unter dem Schritt, in dem er angekommen ist: alles, was die Plattform für einen Frame
in einem Sprung zum Main-Thread auf native Views anwendet. Die Zeilen darin sind **Mount-Items**:

| Item | Bedeutung |
|---|---|
| `Create { id, kind }` | Eine native View erstellen (`View`, `Text`, `Image`, `Scroll`, ...). |
| `Insert { parent, child, before }` | Eine View vor einem Geschwister-Element in ihre Eltern-View einfügen (`None`: am Ende). |
| `Remove` / `Delete` | Eine View von ihrer Eltern-View lösen / freigeben. |
| `ViewStyle { id, style }` | Die Dekoration der View: Hintergrund, Rahmen, Radius, Schatten, Deckkraft, Transformation, ... |
| `ViewProps { id, props }` | Einstellungen für Touch und Barrierefreiheit, `testID`. |
| `Events { id, events }` | Welche Events die View meldet (`EventMask(1)` ist Press). |
| `Frame { id, x, y, w, h }` | Ihre Position und Größe in der Eltern-View, in Punkten. |
| `Text { id, text, content }` | Gesetzter Text für eine Text-View. |
| `Image { id, source, ... }` | Ein Bild, das geladen werden soll. |

Es wird nur gesendet, was sich geändert hat: Ein Tap, der eine Zahl ändert, sendet ein einziges `Text`-Item; Views erhalten keinen Standardstil und keine leere
Event-Maske; unveränderte Frames werden nicht gesendet. Ein Scroll-Frame, der keine neue Zeile sichtbar macht, erzeugt **gar keinen Batch**.

<a id="the-762-lines"></a>

#### Die `perf`-Zeilen

| Zeile | Bedeutung |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | Bundling-Zeit und Bundle-Größe (Entwicklungseinstellungen). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | Ein Commit: die von JS in die Warteschlange gestellten Operationen, die vom Core verbrauchte Zeit (Rendern von Komponenten, Layout, Diffing), die JS-Zeit für das Binden von Listenzeilen, die erzeugten Mount-Items und die lebenden Nodes. |
| `turn: 2640µs (timers and tasks 1964µs)` | Ein Turn, der committet hat: seine Gesamtzeit und die Zeit, die seine JS-Timer und Rust-Komponenten-Tasks vor dem Commit gebraucht haben (eine Rust-Komponente wird im Commit gerendert). |
| `first frame: eval 271µs, total 1235µs` | Zeit zum Auswerten des Bundles und vom Start bis zum ersten Batch. |
| `event Press on view 20` / `event js: 196µs` | Ein dispatchtes Event und die Zeit, die sein Handler (und alles, was er ausgelöst hat) in JS gebraucht hat. |

> [!NOTE]
> Text wird headless mit einer approximativen Text-Engine gemessen, daher weichen die Textgrößen etwas von einem Gerät ab, das
> CoreText oder das Text-Layout von Android verwendet. Layout-Logik, View-Anzahl und Operationsanzahl sind identisch.

Einzelmessungen hängen stark vom Taktzustand der CPU ab (ein Rechner, der gerade aus dem Leerlauf aufgewacht ist, ist langsam). Vergleiche Läufe auf
demselben Rechner, schau auf das Minimum mehrerer Läufe und vertraue den Op- und Item-Anzahlen mehr als den Mikrosekunden.

<a id="scrolling"></a>

### Scrollen

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` bewegt die Liste 10 Punkte pro Frame, mit 60 Frames pro Sekunde, und der Batch jedes Frames wird ausgegeben:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

Bei einer [Liste](./lists.md) zeigt dies die Virtualisierung in Aktion: welche Frames neue Zeilen binden, wie viele Operationen eine Zeile
kostet und dass Frames, die keine neue Zeile sichtbar machen, nichts erzeugen. Verwende es mit einem Release-Build (`cargo test --release` oder `./target/release/nsh` in einem Checkout), um aussagekräftige
Zeiten zu erhalten.

<a id="in-ci"></a>

### In der CI

Headless-Tests brauchen weder Gerät noch Display und laufen daher auf Linux-Runnern: `cargo test` für die Tests einer Rust-App und
`nsh test`, das nichts außer der CLI benötigt. Jeder fehlschlagende Test lässt beide mit einem Exit-Code ungleich null enden: ein Test, der
fehlschlägt, eine App, die sich nicht bauen lässt oder nichts rendert, eine Exception, die die App während eines Schritts wirft.

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

(Installiere die `nsh`-CLI auf dem Runner so, wie du sie lokal installierst; siehe [Installation](./installation.md).)

`--junit <FILE>` schreibt die Ergebnisse außerdem als JUnit-XML-Bericht, den CI-Dienste (GitHub-Actions-Test-Reporter,
GitLab, Jenkins, Azure Pipelines) pro Test anzeigen: ein `testsuite` pro Testdatei, ein `testcase` pro Test, mit dem, was fehlgeschlagen ist,
wo, und den Texten auf dem Bildschirm.

Um die Performance abzusichern, zeichne die Item-Anzahlen einiger Interaktionen auf (die `── … : N items`-Zeilen und die `ops`- /
`mount items`-Zahlen von `--trace`) und lass den Test fehlschlagen, wenn sie wachsen. Anzahlen sind deterministisch; Zeiten auf geteilten CI-Rechnern
sind es nicht.

> [!NOTE]
> Tests laufen unter den `capabilities`, die die `nsh.json` der App deklariert, wie auf einem Gerät: Was die App nicht deklariert, wird
> auch im Test verweigert.

<a id="784-for-ui-tests"></a>

## `testID` für UI-Tests

Headless-Tests prüfen, was die Runtime rendert, und ihre `id:`-Selektoren finden Views anhand der Test-ID. Um die echte
native UI mit den Test-Tools der Plattform (XCUITest, Espresso / UI Automator, Appium, Maestro) zu steuern, gib Views eine Test-ID:
`.test_id(…)` in Rust, `testID` in TSX:

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

| Plattform | Wohin `testID` gelangt |
|---|---|
| iOS | Der `accessibilityIdentifier` der View (`app.otherElements["add-to-cart"]` in XCUITest). |
| Android | Der Ressourcenname der View-ID des Accessibility-Nodes (`By.res("add-to-cart")` in UI Automator). |

Die Test-ID ist eine Methode jedes Elements in Rust, einschließlich der Elemente von Komponenten (`button().test_id("save")`, das
die Wurzel der Komponente benennt), und `testID` eine Prop jedes Elements und jeder Rust-Komponente (`Button`, `Dialog`, ...). Sie ändert nicht, was Screenreader
vorlesen; verwende dafür `accessibilityLabel` (siehe [Barrierefreiheit](./accessibility.md)). In der Ausgabe von `--trace` erscheint sie im
`ViewProps`-Item der View als `test_id: Some("add-to-cart")`.

<a id="see-also"></a>

## Siehe auch

- [Performance](./performance.md): worauf man bei diesen Zahlen achten sollte
- [Dev-Server und Debugging](./dev-server-and-debugging.md)
- [Architektur](./architecture.md): Ops, Commits und Mount-Batches
