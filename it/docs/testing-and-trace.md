---
title: "Test"
description: "Testa le app in modalità headless, in Rust con cargo test e nsh_testing oppure in TypeScript con nsh test: apri l'app, premi, digita, scorri e attendi come farebbe un utente, simula (stub) la rete e lo storage, e leggi le operazioni sulle view native e i tempi che --trace stampa; testID per i test della UI."
order: 61
group: tools
source_hash: c0e7414002b92551
---

# Test

NSH esegue le app in modalità **headless**: il motore reale (lo stesso grafo reattivo, renderer, componenti, layout e virtualizzazione delle liste di un dispositivo, e QuickJS per TSX), con frame di visualizzazione a 60 Hz, ma senza simulatore, dispositivo né finestra. Funziona ovunque funzionino Cargo o la CLI, comprese le macchine CI Linux, e svolge due compiti:

- esegue test: ciascuno apre l'app, compie i passi che farebbe un utente (premere, digitare, scorrere) e verifica che cosa c'è sullo schermo. I test di un'app Rust sono scritti in Rust, eseguiti da `cargo test` con il crate `nsh-testing`; i test scritti in TypeScript si eseguono con `nsh test`, sia per le app TSX sia per le app Rust;
- con `--trace`, stampa ogni operazione che il runtime invia alle view native, con i tempi: quanto costano il primo frame, un tap o un frame di scorrimento.

<a id="writing-tests"></a>

## Scrivere i test

Lo stesso test, in Rust e in TypeScript: apre l'app con una lista di todo vuota nel suo storage, digita, preme e verifica che cosa mostra lo schermo.

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

## Test in Rust con cargo test

I test di un'app Rust sono test di integrazione del suo crate, con `nsh-engine` e `nsh-testing` (le sue feature predefinite, senza QuickJS) come dev-dependencies:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` è un motore delle dimensioni di un telefono (390×844 punti) senza altre impostazioni; i suoi campi impostano ciò che impostano le opzioni di `open` descritte più avanti: `storage` (`MemoryStorage::new(entries)`), `network` (`StubNetwork`, vedi sotto), `viewport`, `environment` (l'aspetto, la lingua, la riduzione del movimento), `clock` (`Clock::manual(time)`, vedi sotto). `nsh_testing::Headless::start(config)` avvia l'app e mantiene un modello delle view che mostra. I suoi passi sono quelli di `nsh test` descritti sotto, con gli stessi selettori, in Rust: `press`, `long_press`, `clear`, `type_text`, `submit`, `scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`, `set_system_time`, `set_viewport`, `set_clipboard` e `on_dialog`; `app.shows(text)` e `app.screen()` (`texts()`, `count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`) leggono ciò che è sullo schermo. Un passo restituisce un errore con i testi presenti sullo schermo quando non può essere eseguito.

`nsh_testing::tsx(entry, sets)` (feature `bundle`) apre allo stesso modo l'entry TSX di un'app, compilata con i set di UI di NSH e del crate ([Building with Rust](./rust.md#testing)). `examples/gallery-rs` testa in questo modo la sua root Rust, un modulo per ogni demo; `examples/rust-exports` testa da Rust la sua entry TSX.

Anche `nsh test` esegue questi test: data la directory di un'app con crate Rust (`nsh.json` `"rust"`), esegue `cargo test` per ciascun crate al suo interno prima dei file di test, e mostra e conta i test Rust insieme a quelli TypeScript (`✓ src/lib.rs › tests::adds`), nel riepilogo e nel report `--junit`. Quindi `nsh test` è l'unico comando per un'app Rust, per un'app TSX con un crate e per un'app TSX semplice, e `nsh check` allo stesso modo esegue `cargo check --all-targets` sui crate prima di controllare i tipi del TypeScript.

<a id="tests-with-nsh-test"></a>

## Test con nsh test

Un file di test è un file `*.test.tsx` o `*.test.ts` accanto al tuo codice. Importa `nsh/test`, come fa `App.test.tsx` qui sopra:

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

Un test che fallisce mostra ciò che è stato lanciato, dove nel file di test, e i testi sullo schermo dell'app che ha aperto. Qualsiasi fallimento fa terminare `nsh test` con un codice diverso da zero. `nsh init` crea un `App.test.tsx` con l'app, e `nsh check` controlla i tipi dei file di test insieme al resto (`.nsh/types` dichiara `nsh/test`).

Ogni file di test viene eseguito su un proprio motore, e i suoi test vengono eseguiti uno dopo l'altro, in ordine. `open` avvia l'app su un altro motore, ogni volta nuovo, così i test non condividono mai lo stato; le app aperte da un test vengono chiuse quando questo termina. Un test fallisce quando lancia un'eccezione, quando la promise che restituisce viene rifiutata, e allo scadere del suo timeout: 30 secondi, oppure i millisecondi indicati dal terzo argomento di `test` (`test("syncs", body, 60_000)`). Un'app con crate Rust propri (`nsh.json` `"rust"`) esegue i suoi test in un runner headless che NSH compila insieme a essi, allo stesso modo; in un'app Rust (`nsh.json` `"root"`, [Building with Rust](./rust.md)), `open(".")` avvia il suo componente root.

<a id="grouping-tests-and-setting-them-up"></a>

### Raggruppare i test e prepararli

`describe`, gli hook e le varianti di `test` funzionano come in Jest:

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

| Funzione | Descrizione |
|---|---|
| `describe(name, body)` | Raggruppa i test e i blocchi che `body` dichiara (subito, mentre il file viene caricato): i loro nomi iniziano con `name` (`the cart › starts empty`), e gli hook che dichiara vengono eseguiti solo attorno a essi. I blocchi si annidano. |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | Eseguono `fn` prima / dopo ogni test del blocco in cui sono dichiarati (il file, un `describe`): prima `beforeEach` dei blocchi esterni, prima `afterEach` di quelli interni. Un `beforeEach` che fallisce fa fallire il test; `afterEach` viene eseguito in ogni caso. |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | Eseguono `fn` una volta prima del primo e dopo l'ultimo test del loro blocco, quando uno dei suoi test viene eseguito. Un `beforeAll` che fallisce fa fallire i test del blocco; un `afterAll` che fallisce viene segnalato come un `<block> › afterAll` fallito. Un'app aperta da un `beforeAll` resta aperta per i test del blocco, e viene chiusa dopo il suo `afterAll`. |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | Dichiara un test, o un blocco i cui test, non vengono eseguiti: vengono segnalati come saltati. |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | Finché un file di test ne contiene uno, vengono eseguiti solo quei test e blocchi; gli altri del file vengono segnalati come saltati. |
| `test.todo(name)` | Un test ancora da scrivere, segnalato come tale. |

Un hook può essere `async`; il suo `timeout` è di 30 secondi se non indicato. I test e gli hook vengono dichiarati mentre il file viene caricato: un test dichiarato dentro un test o un hook lancia un'eccezione.

<a id="opening-the-app"></a>

### Aprire l'app

`open(entry, options?)` compila l'app in `entry` (relativo al file di test; ogni entry viene compilata una volta per esecuzione), la avvia su un viewport di 390×844 e si risolve quando ha eseguito il rendering ed è quieta. Con `--target`, l'app viene eseguita con le opzioni così come le fornisce il test: se la piattaforma del target non può rispettarne una, `open` viene rifiutata con `ERR_NSH_TEST_UNSUPPORTED`, indicandola (vedi [On a real platform](#on-a-real-platform)).

| Opzione | Predefinito | Descrizione |
|---|---|---|
| `storage` | vuoto | Ciò che `Storage` contiene all'avvio: `{ todos: "[]" }`. |
| `network` | nessuno | Ciò che ricevono le richieste dell'app, per route: vedi [Stubbing the network](#stubbing-the-network). `"live"`: la rete reale, per le sue richieste, socket e WebSocket. |
| `width`, `height` | 390, 844 | Il viewport in punti: in headless, la finestra dei desktop, la pagina del web. Su iOS e Android l'app riempie lo schermo del dispositivo. |
| `safeArea` | 0 | Gli inset dell'area sicura in punti: `{ top: 47, bottom: 34 }`. |
| `clipboard` | vuoto | Il testo negli appunti all'avvio. |
| `colorScheme` | `"light"` | L'aspetto del sistema: `"light"` o `"dark"` (classi `colorScheme()`, `dark:`). |
| `locale` | `"en-US"` | La lingua del dispositivo, un tag BCP 47 (`locale()`, il valore predefinito di `Intl`). |
| `reducedMotion` | `false` | L'utente ha chiesto meno movimento (`reduceMotion()`). |
| `platform` | `"ios"` | La piattaforma con cui l'app viene eseguita in headless: `"ios"`, `"android"`, oppure quella di un desktop, `"macos"`, `"windows"`, `"linux"`, o `"web"` nell'idioma desktop (`platform.os`, props `ios={{…}}` / `android={{…}}` / `desktop={{…}}`, scorciatoie da tastiera). Con `--target`, l'app viene eseguita come la piattaforma del target: `platform` di un desktop su qualsiasi desktop e sul web, sempre come desktop (nel browser nell'idioma desktop a qualsiasi larghezza, con `platform.os` che resta `"web"`), `"ios"` e `"android"` ciascuno per conto proprio. |
| `clock` | quello del sistema | Un clock manuale, il cui tempo avanza solo quando lo fa avanzare il test: `{}`, oppure `{ time }` per partire da un `Date` (o da millisecondi dall'epoca Unix). Vedi [Controlling time](#controlling-time). |
| `host` | nessuno | La parte dell'app che incorpora, interpretata dal test: `{ params, handlers }`. Vedi [Playing the host app](#playing-the-host-app). |

<a id="playing-the-host-app"></a>

### Impersonare l'app host

Un'app incorporata in un'app nativa dialoga con essa tramite [`host`](../modules/nsh.md#host). In un test, è il test a impersonare l'app host: `host.params` fornisce i parametri di avvio che l'app legge all'inizio, e `host.handlers` risponde a `host.call` dell'app e ascolta i suoi `host.post`, per nome. Un handler è un valore, che risponde a ogni chiamata, oppure una funzione dei dati della chiamata che restituisce la risposta (o una promise di essa). Ciò che la funzione lancia rifiuta la chiamata, come fa l'errore di un'app host. Una chiamata a un nome che `handlers` non elenca fallisce, come in un'app host che non gestisce nulla.

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

`app.host.send(name, data)` invia un evento, poi attende che l'app sia quieta. `app.host.calls()` e `app.host.posts()` elencano ciò che gli handler hanno ricevuto, in ordine: `name` e `data`.

Gli URL che l'app apre ([`openUrl`](../modules/nsh.md#openurl), i link di un `TextView` con `links="open"`) vengono registrati e segnalati all'app come aperti, e su questa macchina non si apre nulla. `app.openedUrls()` li elenca:

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### Simulare la rete

`network` elenca le route per `"<METHOD> <URL>"` (un URL semplice è un `GET`; `*` corrisponde a qualsiasi testo). Una richiesta che nessuna route soddisfa fallisce, così i test non raggiungono mai la rete senza che lo si chieda. Una route è una risposta, oppure una funzione della richiesta che ne restituisce una (o una promise di essa); in Rust, `StubNetwork::new(routes)` accetta le stesse route, ciascuna un `StubResponse` o un `StubRoute::Handler`:

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

| Membro della risposta | Predefinito | Descrizione |
|---|---|---|
| `status` | 200 | Il codice di stato. |
| `headers` | nessuno | Nomi e valori degli header. |
| `body` | vuoto | Una stringa, o un valore inviato come JSON (con `content-type: application/json` a meno che `headers` ne indichi uno). |
| `error` | nessuno | La richiesta fallisce invece con questo messaggio, come quando il dispositivo è offline. |
| `delay` | 0 | Quanto impiega la risposta, in millisecondi; un passo non la attende, `waitFor` sì. Su un clock manuale, arriva quando il clock la supera. |

La funzione di una route riceve la richiesta (`method`, `url`, `headers`, `body` come testo) ed è eseguita nel file di test, quindi può contare le richieste o rispondere in base a ciò che il test ha preparato. Una funzione che lancia un'eccezione fa fallire la richiesta e il passo che l'ha generata. `app.requests()` elenca le richieste effettuate dall'app, in ordine, allo stesso modo.

Anche le connessioni restano nel test: i socket dell'app (`net`) e i WebSocket (il globale `WebSocket` e il modulo `websocket`) non ne aprono nessuna a meno che `network` sia `"live"`. Dopo i controlli di capability che le esecuzioni dell'app stessa superano, `net.connect` e `connect` del modulo `websocket` vengono rifiutati con `code` `ERR_NSH_TEST_NETWORK`, e un `WebSocket` globale emette `error`, poi `close` (1006, non pulita), come per una connessione rifiutata dalla rete. Con `"live"`, si connettono alla rete reale insieme alle richieste dell'app. In Rust, `EngineConfig::refuse_connections` fa lo stesso per un'app `Headless`: una funzione di ciò a cui l'app si connette (l'URL di un WebSocket, il `host:port` di un socket) che restituisce l'errore con cui la sua chiamata fallisce.

<a id="controlling-time"></a>

### Controllare il tempo

Sul clock del sistema, i timer e le animazioni native di un'app impiegano lo stesso tempo che su un dispositivo, e lo stesso vale per i test che li attendono. Con un clock manuale (`EngineConfig::clock` in Rust, `clock` di `open` in TypeScript), l'app viene eseguita su un clock il cui tempo avanza solo quando lo fa avanzare il test, e in un istante, come con i fake timer di Jest o con `page.clock` di Playwright. `app.clock` è quel clock, e `null` quando l'app viene eseguita su quello del sistema:

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

Un `StubNetwork` le cui risposte hanno un `delay` segue un clock manuale con `.with_clock(clock.clone())`. I passi seguenti sono di `nsh test`; `Headless` li ha tutti (`run_for`, `fast_forward`, `set_system_time`).

| Passo | Descrizione |
|---|---|
| `await app.clock.runFor(ms)` | Fa avanzare il clock di `ms` millisecondi, un frame di visualizzazione alla volta. Timer, `requestAnimationFrame`, animazioni native e risposte ritardate vengono eseguiti man mano che scadono, in ordine, ciascuno al proprio istante. Si risolve quando l'app è quieta. |
| `await app.clock.fastForward(ms)` | Fa avanzare il clock di `ms` millisecondi in una volta, come fa un dispositivo che si risveglia dalla sospensione: i timer scaduti nel frattempo vengono eseguiti una volta ciascuno. |
| `app.clock.setSystemTime(time)` | Imposta l'ora di sistema (`Date.now()`, `new Date()`) su un `Date` o su dei millisecondi, senza spostare alcun timer. |

`Date`, `performance.now()` e la data predefinita di `Intl` seguono il clock. I passi portano a termine ciò che è in esecuzione senza attenderlo: finché l'app chiede frame o un'animazione nativa è in corso, i frame arrivano uno dopo l'altro, ciascuno con un ritardo di un frame (1/60 s) sul clock. Una transizione di 300 ms richiede pochi millisecondi, e un timer in scadenza durante di essa viene eseguito. Un'animazione che si ripete all'infinito (uno spinner) procede insieme al clock: gira man mano che il test fa avanzare il clock. `app.wait(ms)` e una pressione prolungata fanno avanzare il clock del loro tempo. Un timer che scade più tardi viene eseguito solo quando il test fa avanzare il clock fino a quel punto. `waitFor` e `waitUntil` fanno avanzare il clock mentre attendono, un frame di visualizzazione alla volta, controllando dopo ogni frame, così ciò che mostra un timer arriva mentre lo attendono, in un attimo: `waitFor("Saved", { timeout: 15_000 })` fa avanzare il clock fino a quindici secondi. Il loro timeout conta su entrambi i clock: un'attesa fa avanzare il clock dell'app al massimo di quel valore, e viene rifiutata solo quando è trascorso altrettanto tempo reale, così ciò che arriva dall'esterno dell'app (la funzione di una route, la rete) ha lo stesso tempo che avrebbe sul clock del sistema. I test della galleria vengono eseguiti così (`examples/gallery/tests`): i suoi dodici test che attendono animazioni richiedono 6 s invece di 28 s.
<a id="steps"></a>

### Step

Gli step indicano le view tramite **selettori**, scritti come quelli di Playwright:

| Selettore | Corrisponde a |
|---|---|
| `id:<testID>` | La view con quel `testID`. |
| `label:<label>` | La view con quel `accessibilityLabel`. |
| `text:<text>` | Un testo che lo riporta (spazi attorno esclusi), uno span di un testo che riceve le pressioni (un `<Text onPress>` annidato, il link di un `TextView`), oppure un input che lo contiene o, finché è vuoto, con quel placeholder. |
| `role:<role>`, `role:<role>[<name>]` | Una view con quel `role` (`role:button`) e quel nome: la sua label, altrimenti i testi al suo interno (`role:button[Save]`). |
| `view:<id>` | La view con quell'id nell'output di `--trace`. |
| qualsiasi altra cosa | Un `testID`, altrimenti una label, altrimenti un testo, così come è scritto. |

Una parte che inizia con una parola minuscola seguita da due punti indica un prefisso (`id`, `label`, `role`, `text`, `view`), quindi
`tapped: solo` è un errore di step che li elenca. Un testo, una label o un test id che inizia in questo modo assume il suo prefisso, che
legge il resto così come è scritto: `text:tapped: solo`, `label:note: draft`, `id:row:2`. I selettori mantengono il loro significato quando
arrivano nuovi prefissi.

`label:`, `text:` e il nome di un ruolo accettano anche una regex: `text:/^Buy/i`, scritta nella sintassi del crate `regex` di Rust
(classi, gruppi, ancore e quantificatori di JavaScript, con corrispondenza in tempo lineare; flag `i`, `m` e `s`). ` >> ` cerca
all'interno di ciò che la parte precedente ha trovato (`id:cart >> role:button[Remove]`), e `nth=<n>` ne conserva una delle corrispondenze, a partire da 0
(`text:Delete >> nth=1`). Un selettore trova le view che un utente guarderebbe per prime: nel modal in cima, poi sullo schermo,
e di uno stack di navigazione solo la schermata in cima. Corrisponde a ciò che l'utente vede: view con un'area, fuori da `visibility: hidden`, dentro la finestra e
le view che le ritagliano (`overflow: hidden`), oppure in qualsiasi punto del contenuto di una scroll view che l'utente può scorrere e che
lo scorrimento porta in vista (`opacity` e trasformazioni escluse, come in Playwright). Uno step che agisce su una view (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`) ne richiede esattamente
una: un selettore che ne trova più di una fa fallire lo step, e l'errore indica come restringere la ricerca.

| Step | Descrizione |
|---|---|
| `await app.press(selector)` | Preme la view, o la view più vicina che la circonda e che riceve le pressioni (il pulsante attorno a un testo): `onPressDown`, `onPressUp`, `onPress`, all'interno di un dito che si appoggia e si solleva, che le view attorno in ascolto dei tocchi sentono (il `onPressOutside` di un overlay). Uno span di un testo viene premuto sui suoi caratteri (`await app.press("Privacy policy")`), in headless e su iOS, Android e desktop. Una seconda pressione sulla stessa view entro 500 ms è il suo secondo clic (`clicks: 2`, una doppia pressione), come le piattaforme li contano. Viene rifiutato quando è disabilitata. |
| `await app.longPress(selector)` | Tiene un dito premuto su di essa (o sulla view più vicina attorno che riceve pressioni o tocchi) per il suo `delayLongPress` (500 ms): `onPressDown`, `onLongPress`, `onPressUp`; non segue alcun `onPress`. Gli handler dei tocchi sentono il dito (si apre un `ContextMenu` o `Tooltip`). |
| `await app.clear(selector)` | Svuota l'input, come fanno seleziona tutto ed elimina. |
| `await app.type(selector, text)` | Scrive nell'input (o nel primo input all'interno della view; `text:` corrisponde anche al testo o al placeholder di un input) alla fine di ciò che contiene, tasto per tasto: prende il focus, poi ogni carattere è un `onKeyPress` e un `onChange`, entro `maxLength`. Un `\n` in un input a riga singola è il tasto invio. |
| `await app.submit(selector)` | Il tasto invio nell'input, come indica il suo `submitBehavior`: `onSubmit` (e il focus lascia un input a riga singola), oppure un'interruzione di riga in uno multiriga. |
| `await app.scroll(selector, distance)` | Trascina la scroll view o la lista (la view, quella che la circonda o la prima al suo interno) di `distance` punti lungo il suo asse, 10 punti per frame, entro il suo contenuto, come può fare l'utente (`scrollable`). Un valore negativo scorre all'indietro. |
| `await app.hover(selector)` | Sposta il mouse sul centro della view: le view sotto di esso che ha lasciato sentono `onMouseLeave`, quelle su cui è arrivato sentono `onMouseEnter` e assumono i loro stili `hover:`, e quelle in ascolto sentono `onMouseMove` con la posizione e nessun pulsante premuto. Desktop e web a qualsiasi larghezza, compreso un browser nell'idioma phone (headless: un desktop o `"web"` `platform`); un telefono iOS o Android non ha il mouse: lì viene rifiutato. |
| `await app.rightClick(selector)` | Il pulsante secondario del mouse sul centro della view: essa, o la view più vicina attorno in ascolto, sente `onContextMenu`. Desktop e web (headless: un desktop `platform`); un telefono non ha il mouse: lì viene rifiutato. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | Incolla nell'input come fa l'utente con quel contenuto negli appunti: prende il focus e sente `onPaste` (`html` lo stesso contenuto con la sua formattazione, `files` sono percorsi di cui riceve i byte come `File`, `uris` `file:` URL), poi il suo testo entra come indica `pasteBehavior`. In headless, su macOS, su iOS e sul web; gli appunti della macchina restano com'erano. |
| `app.menu()` | Le azioni del menu contestuale mostrato dall'app (`Menu.popup`): `label` (quelle di un sottomenu dopo la sua voce, `"Share > Mail"`), `disabled` e `checked` per una voce selezionabile; `null` quando nessuno è aperto. |
| `await app.chooseMenuItem(label)` | Sceglie l'azione del menu contestuale aperto, come fa un clic su di essa: l'app sente `onMenu` (il suo `onSelect` viene eseguito), poi il menu si chiude. Viene rifiutato quando la voce è disabilitata o mancante. |
| `await app.closeMenu()` | Chiude il menu contestuale aperto senza scegliere nulla, come fa Escape. |
| `await app.keyboard.press(keys)` | Preme un tasto con i suoi modificatori, come lo indica `keymap` (`"mod+k"`, `"shift+/"`, `"escape"`; `mod` è il tasto comando della piattaforma), su una tastiera hardware, su ogni piattaforma (anche telefoni e tablet ne hanno una): lo ascolta la scorciatoia dell'app corrispondente (`keymap.bind`, `onKeyCommand`), altrimenti su macOS e sul web Tab e Shift+Tab spostano il focus della tastiera tra gli input e le view che ricevono pressioni (stili `onFocus`, `onBlur`, `focus:`) e Invio o Spazio premono la view su cui si trova, altrimenti l'input con il focus riceve un carattere, Backspace o il tasto invio, altrimenti Escape torna indietro. |
| `await app.keyboard.down(keys)` / `up(keys)` | Tiene premuti i tasti modificatori (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, uniti da `+`) fino a `up`: le pressioni, i trascinamenti e gli hover nel frattempo li portano con sé, come un clic con Mod o un trascinamento con Shift. Per ora solo in headless e su Linux. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | Trascina come fa `drag` e tiene il dito premuto fino a `drop()`, che lo solleva dove si trova: gli step intermedi osservano lo schermo a metà trascinamento (un'anteprima del trascinamento, una linea di rilascio). Per ora solo in headless e su Linux. |
| `await app.dropFiles(selector, uris)` | Rilascia file locali (`file:` URL, come li trascina un file manager) sul centro della view: essa, o la view più vicina attorno in ascolto, sente `onFileDrop`. Desktop, headless e per ora Linux. |
| `await app.drag(selector, { x, y })` | Un dito si appoggia sul centro della view, resta fermo per 100 ms, si sposta di `x`, `y` punti, 10 per frame, e si solleva, come lo interpreta l'input della piattaforma: segue un pan (`pan={{ x, y }}`, `onPanStart`, `onPanEnd` con la velocità di rilascio), le view in ascolto dei tocchi lo sentono (`onTouchStart`, `PanResponder`), una scroll view scorre con esso e, se tirata abbastanza oltre la cima, si aggiorna (`onRefresh`), e una pressione sotto di esso viene annullata non appena si allontana. Su desktop e web è il mouse. |
| `await app.wait(ms)` | Lascia girare l'app per `ms` millisecondi: timer, animazioni, richieste. Su un clock manuale, lo fa avanzare di `ms` (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | Si risolve quando una view corrisponde, oppure con `{ state: "gone" }` quando nessuna corrisponde; viene rifiutato dopo `timeout` ms (5000). Su un clock manuale, lo fa avanzare di un frame di visualizzazione alla volta mentre attende, al massimo di `timeout`. |
| `await app.waitUntil(condition, options?)` | Si risolve quando `condition()` restituisce true, ricontrollando dopo ogni cambiamento dell'app: per ciò che nessun selettore esprime (`() => app.storage().note === "Milk"`). Su un clock manuale, lo fa avanzare di un frame di visualizzazione tra due controlli, al massimo di `timeout`. |
| `app.shows(selector)` | Indica se una view corrisponde ora. |
| `app.count(selector)` | Indica quante view corrispondono ora. |
| `app.enabled(selector)` | Indica se la view accetta input: né essa né una view attorno è disabilitata, e un input non è `readonly`. |
| `app.texts()` | I testi attualmente sullo schermo, in ordine. |
| `app.value(selector)` | Il testo di un input, `null` quando nessuno corrisponde. |
| `app.spanStyle(selector)` | Lo stile risolto del primo carattere trovato, in headless e su ogni `--target`: `color`, `backgroundColor` opzionale, `fontSize`, `fontWeight`, `italic`, `underline` e `lineThrough`. I colori sono `#rrggbbaa`; le dimensioni sono in punti. |
| `app.storage()` | Ciò che lo storage dell'app contiene ora. |
| `await app.back()` | Torna indietro come fa l'utente (il pulsante indietro di un header, trascinare un sheet verso il basso): lo stack più interno del modal più recente, altrimenti della schermata, rimuove la schermata in cima (`onDismiss`), oppure gliene fa richiesta (`onBackRequest`) quando ha `preventBack`; in assenza di uno stack, il modal più recente chiede di chiudersi (`onRequestClose`). Viene rifiutato quando non c'è nulla da cui tornare indietro. |
| `app.onDialog(handler)` | Risponde ai dialog che l'app mostra da questo momento in poi (`Alert.alert`, action sheet): `handler` riceve il dialog (`title`, `message`, `buttons`, `cancelable`, `sheet`) e restituisce il testo del pulsante da premere, oppure `null` per chiuderlo senza premerne alcuno. |
| `app.dialogs()` | I dialog mostrati dall'app, in ordine. |
| `app.onPick(handler)` | Risponde alle selezioni che l'app richiede da questo momento in poi (`Picker.pickImages`): `handler` riceve ciò che la selezione richiede (`multiple`, `limit`, `maxDimension`, `quality`, `format`) e restituisce i file scelti dall'utente (`{ name, type?, data: Uint8Array }`, passati all'app così come sono), oppure `null` per annullare. Senza un handler, le selezioni vengono annullate. Esecuzioni headless. |
| `app.picks()` | Le selezioni richieste dall'app, in ordine. |
| `app.hear(text)` | L'utente dice `text` nella sessione di riconoscimento vocale in corso (`Speech.start`): il suo `result` riporta `text` come trascrizione completa fino a quel momento. Esecuzioni headless. |
| `app.endSpeech(error?)` | Termina la sessione di riconoscimento vocale in corso: con `error` (`"no-speech"`, `"network"`, ...) fallisce, altrimenti arrivano un ultimo risultato finale e `end`, `no-speech` quando non è stato sentito nulla. Esecuzioni headless. |
| `app.speechRequests()` | Le sessioni di riconoscimento vocale avviate dall'app, in ordine: `lang` (`null` per quella dell'utente) e `interim`. |
| `app.clipboard()` | Il testo attualmente negli appunti, `null` quando non ne contengono. |
| `app.requests()` | Le richieste fatte dall'app, in ordine: `method`, `url`, `headers`, `body`. |
| `await app.host.send(name, data?)` | Invia all'app un evento dell'app host (`host.on`), poi attende che tutto sia tornato quieto. Vedi [Playing the host app](#playing-the-host-app). |
| `app.host.calls()`, `app.host.posts()` | Le chiamate e i post dell'app ricevuti dal `host.handlers` di `open`, in ordine: `name`, `data`. |
| `app.openedUrls()` | Gli URL aperti dall'app (`openUrl`), in ordine: registrati, mai aperti. |
| `await app.setViewport(width, height)` | Ridimensiona il viewport, come fa la rotazione del dispositivo o il ridimensionamento di una finestra (`windowSize()`). |
| `await app.setColorScheme(scheme)` | Imposta l'aspetto del sistema su `"light"` o `"dark"`, come fa l'utente. |
| `await app.setLifecycle(state)` | Porta l'app in `"background"`, `"inactive"` o `"active"`, come fa il sistema quando l'utente la lascia, passa a un'altra app o finestra e ritorna (`lifecycle()`). Solo esecuzioni headless. |
| `await app.screenshot(path?)` | Un'immagine della finestra dell'app come PNG (un `Uint8Array`), salvata anche in `path` su questa macchina quando indicato (relativo alla directory corrente). Solo una piattaforma reale disegna l'app: vedi [On a real platform](#on-a-real-platform). |

Uno step si risolve quando l'app non ha disegnato nulla per 100 ms e non è in corso alcuna animazione nativa che termina da sola (al massimo 2 s,
per le app che disegnano di continuo; su un clock manuale, anche 2 s del tempo dell'app), così ciò che ha cambiato è sullo schermo
quando viene eseguita la riga successiva; usa `waitFor` per ciò che arriva più tardi (una risposta, un timer). Su un clock manuale uno step
non attende quei 100 ms: si risolve non appena l'app ha eseguito tutto ciò che lo step e il tempo del clock hanno reso
dovuto (timer scaduti, promise, una risposta simulata data subito) e non richiede alcun frame, a meno che una richiesta sia ancora
in corso, così i test su un clock manuale girano senza pause tra i loro step. Ciò a cui risponde un altro thread (una chiamata
`nsh/host`, la lettura di un file, il lavoro di un task Rust su un thread) arriva dopo che lo step si è risolto: `waitFor` ciò che
mostra. Un'animazione che si ripete
all'infinito, come uno spinner di caricamento, continua a girare in background mentre gli step e `waitFor` proseguono, come fa un'animazione
CSS infinita nei test di un browser. Uno step viene rifiutato, facendo fallire il test, quando nulla corrisponde al suo selettore (l'errore elenca i testi sullo
schermo), quando l'app ha generato un'eccezione nel frattempo e quando l'app ha richiesto ciò a cui risponde solo una piattaforma reale.

I fallimenti che un test può attendersi portano un `code`, che resta invariato; i loro messaggi sono pensati per le persone e possono cambiare, quindi
un test confronta il codice:

| `code` | Lo step o la query |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | Nulla sullo schermo corrisponde al selettore, oppure il menu aperto non ha tale voce. |
| `ERR_NSH_TEST_DISABLED` | La view indicata dal selettore è disabilitata (una scroll view che l'utente non può scorrere, una voce di menu disabilitata). |
| `ETIMEDOUT` | `waitFor` o `waitUntil` ha esaurito il tempo, oppure l'app non ha disegnato nulla dopo `open`. |
| `ERR_NSH_TEST_NO_BACK` | `back()` non ha trovato nulla da cui tornare indietro. |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` con `--target` ha ricevuto un'opzione che la piattaforma di destinazione non può soddisfare: `width` o `height` su iOS e Android, un `platform` da telefono su desktop o web, quello di un desktop o dell'altro telefono su iOS o Android, `host.handlers`. Il messaggio la indica. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` legge un `<Text testID="guide">` annidato; `text:word` legge il primo carattere
di quella corrispondenza. Limita l'ambito delle query con `id:note >> text:word` e seleziona le corrispondenze ripetute con `>> nth=0`.
La query segnala un errore per uno span mancante, ambiguo o vuoto. Aggiornare il `testID` di uno span riutilizza il layout del suo testo
e mantiene il conteggio delle chiamate del callback `onTextLayout`.
<a id="what-headless-runs-play-of-the-platform"></a>

### Cosa simulano le esecuzioni headless della piattaforma

Un'esecuzione headless ha il vero runtime e nessuna piattaforma. Recita la parte della piattaforma che il protocollo di NSH definisce, e nulla di ciò che solo una vera piattaforma può fare:

- **Le animazioni native vengono eseguite** fotogramma per fotogramma, fino alla fine: i callback `start(callback)` vengono eseguiti, e lo stesso vale per ciò che li attende. I cicli senza fine girano finché l'app non li ferma.
- **Il ritorno indietro** rimuove le schermate e chiude i modali come fa una piattaforma (`app.back()`).
- **Ai dialog si risponde**: con il `onDialog` del test, altrimenti con il loro pulsante di annullamento, altrimenti vengono chiusi quando possibile; un dialog a cui rispondono solo gli altri pulsanti fa fallire lo step che l'ha mostrato, finché il test non dice quale premere.
- **Gli appunti contengono testo**: ciò che l'app copia, restituito quando incolla (`clipboard` per partire con del testo).
- **L'host della pagina risponde a `host`** quando `nsh.json` dell'app ne indica uno in `web.host` ([L'host della pagina](#the-pages-host)).
- **L'app viene eseguita con le sue capability**: ciò che il suo `nsh.json` dichiara in `capabilities` viene applicato come su un dispositivo, quindi ciò che non dichiara viene rifiutato.
- **Gli URL vengono registrati**: ciò che l'app apre viene segnalato come aperto, e `app.openedUrls()` lo elenca.
- **Alle selezioni si risponde**: con i file del test (`onPick`), altrimenti vengono annullate, quindi `Picker.pickImages` si risolve in `[]`.
- **Il parlato è del test**: `Speech.available()` si risolve in `true`, una sessione parte subito e sente ciò che dice `hear`.
- **I modali compaiono subito**: `onShow` arriva quando ne viene presentato uno.
- **Le immagini non vengono caricate**: non arriva alcun `onLoad` o `onError`, e `Image.getSize` e `Image.prefetch` vengono rifiutati.
- **Ciò a cui risponde solo una vera piattaforma fa fallire lo step**: un'immagine o dei file negli appunti.

<a id="the-pages-host"></a>

### L'host della pagina

Un'app pubblicata sul web ottiene il suo host dalla propria pagina: `nsh.json` `web.host`, un modulo che esporta `createHost(player)` ([Web](./web.md#the-hosts-functions)). Le esecuzioni headless caricano quel modulo per ogni app che un test apre, prima che l'app parta, in un contesto JavaScript a sé (timer e `console`, nulla del browser, nessun import): il suo `call` risponde a [`host.call`](../modules/nsh.md#host) dell'app, il suo `player.hostEvent` raggiunge `host.on`, e `host.available()` è `true`. Un `call` che lancia un'eccezione, viene rifiutato o restituisce ciò che non è JSON rifiuta la chiamata dell'app con il suo messaggio, come nella pagina, e gli eventi inviati prima che l'app parta raggiungono i suoi listener di primo livello una volta avviata. `--web-host <module>` indica un altro modulo. Il `capabilities.host` dell'app deve elencare ciò che chiama, come nella pagina. Il timeout di una chiamata e i timer propri dell'host scorrono sul tempo dell'app, quindi un clock manuale li fa avanzare (`app.clock.runFor`). In un browser (`--target web`) la pagina di sviluppo esegue il `web.host` di `nsh.json` per ogni app, come fa una pagina pubblicata; sulle altre piattaforme (`--target`) le app non hanno host: `host.available()` è `false`.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` ha un'app, il suo host e i loro test.

<a id="expectations"></a>

### Aspettative

`expect(value)` verifica i valori come fa Jest, così come li ha creati JS: `toBe` è `Object.is`, `toEqual` confronta membro per membro, e un `Date`, un `Map` o un `Uint8Array` viene confrontato per ciò che è. Ogni verifica lancia un'eccezione quando non vale. `.not` le capovolge: `expect(app.texts()).not.toContain("Error")`. Data una funzione, `toThrow` verifica ciò che lancia la sua chiamata; data una promise, o una funzione che ne restituisce una, `rejects` e `resolves` verificano a cosa si risolve, come in Jest: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| Verifica | Vale quando |
|---|---|
| `toBe(expected)` | Il valore è `expected`, come dice `Object.is`: la stessa primitiva (`NaN` è `NaN`, `0` non è `-0`) o lo stesso oggetto. |
| `toEqual(expected)` | Il valore è uguale a `expected` membro per membro, come `toEqual` di Jest: gli oggetti per le proprie proprietà enumerabili (una proprietà che è `undefined` conta come mancante), gli array elemento per elemento, le date per il loro tempo, le espressioni regolari per sorgente e flag, map e set per le loro voci in qualsiasi ordine, i `ArrayBuffer` e gli array tipizzati per i loro byte, gli errori per nome e messaggio; `NaN` è uguale a `NaN`. Un'istanza di una classe è uguale a un oggetto semplice con le sue proprietà. |
| `toMatchObject(subset)` | Il valore ha ogni proprietà di `subset`, ciascuna uguale come dice `toEqual`, e gli oggetti al suo interno corrispondono a loro volta; le altre proprietà non vengono esaminate, e gli array corrispondono elemento per elemento, tutti. |
| `toContain(item)` | Un array, un `Set`, un array tipizzato o un altro iterabile contiene `item` (`===`), oppure una stringa lo contiene. |
| `toContainEqual(item)` | Un array, un `Set` o un altro iterabile contiene un elemento uguale a `item`, come dice `toEqual`. |
| `toBeTruthy()`, `toBeFalsy()` | Il valore è truthy / falsy, come lo vede JS. |
| `toMatch(pattern)` | Una stringa contiene `pattern` (una stringa), o corrisponde a esso (un `RegExp`, eseguito dal motore JS: look-behind, backreference e gruppi con nome funzionano come in JavaScript). |
| `toHaveLength(n)` | Il `length` del valore è `n`: le unità UTF-16 di una stringa, gli elementi di un array o di un array tipizzato. |
| `toBeNull()` | Il valore è `null`. |
| `toBeUndefined()`, `toBeDefined()` | Il valore è `undefined` / qualsiasi altra cosa. |
| `toBeNaN()` | Il valore è `NaN`. |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | Un numero si confronta così con `n`. |
| `toThrow(expected?)` | `expect(fn)`: la chiamata a `fn` lancia un'eccezione. Dato `expected`, l'errore vi corrisponde: il suo messaggio contiene una stringa o corrisponde a un `RegExp`; una classe di errore (`TypeError`, una classe dell'app) è il `name` dell'errore, e `Error` corrisponde a ogni errore; un errore ha lo stesso messaggio. |
| `rejects.toThrow(expected?)` | `expect(promise)`: la promise viene rifiutata, con un errore che corrisponde a `expected` come dice `toThrow`. |
| `rejects.toMatchObject(subset)` | `expect(promise)`: la promise viene rifiutata con un valore che corrisponde a `subset` come dice `toMatchObject`: le proprietà proprie di un errore (`code`, `permission`, ...) con il suo `name` e `message`. |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)`: la promise si risolve in un valore che soddisfa la verifica. |

Una verifica che fallisce dice cosa ha ricevuto e cosa si aspettava, scritti come li scriverebbe JS:
`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

Anche `rejects` e `resolves` hanno un `.not` proprio: `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### Su una piattaforma reale

`nsh test --target macos` (o `linux`, `windows`, `gpui`, `web`, `ios`, `android`) esegue gli stessi test sull'host di sviluppo della piattaforma invece che in headless: ogni `open` avvia l'app in una finestra propria, con una directory dati nuova, e gli step agiscono con l'input nativo della piattaforma sulle view indicate dai loro selettori, come fa Playwright in un browser:

- un press è un clic al centro della view, un long press un clic tenuto premuto, `type` fa clic sull'input e digita i suoi tasti, `scroll` è un gesto da trackpad sulla scroll view, `back` è ciò che fa un utente (Esc su macOS e Linux, il pulsante indietro del mouse su Windows e in GPUI, il pulsante indietro del browser sul web, un foglio trascinato verso il basso, il gesto di escape di VoiceOver mentre è aperto un menu, un popover o `Sheet`, altrimenti il pulsante indietro dell'header su iOS, il pulsante indietro su Android);
- una view fuori schermo viene prima portata in vista scorrendo, un gesto alla volta; su un touch screen il dito si posa dove la pagina stessa lo accoglie, accanto alle view che seguono un trascinamento (uno slider, un'area di disegno), come quando un utente scorre;
- selettori, attese e query vedono lo stesso modello dell'app delle esecuzioni headless, costruito da ciò che l'host disegna, quindi trovano le stesse view;
- i dialog sono quelli nativi della piattaforma: `app.dialogs()` li legge, e rispondere a uno (`onDialog`, o il suo pulsante di annullamento quando il test non dice nulla) preme il suo pulsante;
- `app.screenshot(path)` scatta una foto della finestra.

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

La finestra si apre alla dimensione del viewport (390 × 844 salvo diversa indicazione di `open`), entro lo schermo; su iOS e Android l'app riempie lo schermo del dispositivo, alla dimensione del dispositivo. L'app viene eseguita come la piattaforma di destinazione (`platform.os`). Un `clock` manuale funziona come in headless: `app.clock.runFor`, `fastForward` e `setSystemTime` spostano subito il tempo dell'app (timer, `requestAnimationFrame` distanziati di un fotogramma, `Date`), anche `app.wait(ms)`, `waitFor` e `waitUntil` lo spostano, e ogni fotogramma mostrato dalla piattaforma lo fa avanzare di un fotogramma (1/60 s), quindi il tempo dell'app passa mentre anima. Le animazioni proprie della piattaforma, e `delay` di una route, richiedono tempo reale. Le richieste dell'app arrivano al test come in headless: le route `network` rispondono, una richiesta che nessuna route soddisfa fallisce, e `"live"` le lascia passare verso la rete dell'host; `app.requests()` le elenca tutte. Socket e WebSocket si connettono alla rete dell'host con `"live"`, e altrimenti vengono rifiutati come in headless. `storage` è nello storage dell'app all'avvio, e `app.storage()` lo legge dall'app. `locale`, `reducedMotion` e `safeArea`, quando `open` li fornisce (compreso un valore predefinito), contengono ciò che la piattaforma riporta, e un `colorScheme` che fornisce cambia l'aspetto del sistema (anche `"light"`); ciò che omette è quello della piattaforma, e le chiamate dell'app agli appunti sono servite dagli appunti propri del test (`clipboard` è inizialmente il suo testo, `app.clipboard()` lo legge), quindi gli appunti della macchina restano com'erano; il copia e incolla propri di un input di testo usano quelli del sistema. `host.params` raggiunge l'app, `app.host.send` invia eventi, e gli URL che l'app apre vengono registrati per `app.openedUrls()` invece di essere aperti. `host.handlers` viene eseguito in headless, dove il test risponde alle chiamate dell'app. `open` verifica le sue opzioni rispetto alla destinazione: `width` e `height` su iOS e Android, un `platform` di un altro tipo di dispositivo (quello di un telefono su desktop o sul web, quello di un desktop o dell'altro telefono su iOS o Android) e `host.handlers` vengono rifiutati con `ERR_NSH_TEST_UNSUPPORTED`, così un test viene eseguito come è scritto oppure dice ciò di cui ha bisogno. Un `platform` desktop (`"macos"` per mouse e tasti di un desktop) viene eseguito su ogni destinazione desktop e sul web, come piattaforma di quella destinazione e sempre come desktop: nel browser la pagina parte nell'idioma desktop qualunque sia la sua larghezza, mentre senza un `platform` (o con `"web"`) ne misura l'idioma come fa un browser (desktop a partire da 600 punti di larghezza). Un'app con crate Rust propri viene eseguita in un host di sviluppo compilato con i suoi crate, che NSH compila per la piattaforma; l'host di un'app Rust esegue la sua root, quindi `open(".")` la avvia lì come in headless.

Sul web, le app girano nella pagina dell'host di sviluppo in un Chrome, Edge o Chromium headless: quello installato su questa macchina, o l'eseguibile indicato da `--browser <PATH>` (serve un browser: `nsh test` dice dove ha cercato quando non ne trova alcuno). Un solo browser serve l'esecuzione, e ogni `open` ottiene una pagina con storage proprio. L'input è l'input attendibile del browser, come quello di un utente: clic del mouse, scorrimento con la rotella e tasti.

Su iOS, le app girano nell'host di sviluppo in un simulatore iOS: quello già avviato, altrimenti l'iPhone più recente, che `nsh test` avvia. Gli step sono tocchi di un dito e la digitazione della tastiera software, come li riceve UIKit dal dispositivo. `setColorScheme` cambia l'aspetto del simulatore, che `nsh test` ripristina dopo l'app, e lo schermo ha la dimensione del dispositivo simulato.

Su Android, le app girano nell'host di sviluppo sul primo dispositivo o emulatore che `adb devices` elenca, con storage proprio. Gli step sono tocchi di un dito e tasti di una tastiera, come le view dell'app li ricevono dal dispositivo; `back` è l'indietro del sistema. `setColorScheme` attiva il tema scuro del dispositivo, che `nsh test` ripristina dopo l'app.

<a id="steps-from-standard-input"></a>

### Step da standard input

Dato il punto d'ingresso dell'app invece dei test, `nsh test` apre l'app sulla rete reale, la lascia girare per 1,2 s, poi esegue gli step forniti dallo standard input, con `app` l'app:

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

Gli 1,2 s lasciano che la garbage collection in idle del motore giri prima del primo step, così un'app che abbandona ciò che usa ancora lo mostra: i suoi handler smettono di funzionare.

Gli esempi hanno test da cui partire: `examples/gallery-rs` per un'app Rust (`cargo test`, un modulo per demo, e `App.test.tsx`), `examples/rust-exports` per un'app con un crate Rust, `examples/counter` e `examples/gallery/tests` (storage, input, una lista lunga, richieste stubbed, dark mode, un clock manuale) per le app TSX.

<a id="tracing-with---trace"></a>

## Tracing con --trace

`--trace` stampa ogni batch di mount delle app che i test aprono, sotto lo step in cui è arrivato, e il tempo di ogni commit. In Rust, un test stampa lo stesso: `observe` gli consegna ogni batch con il suo step, e `EngineConfig::trace` registra le righe `perf` tramite il crate `log` (target `nsh::perf`; installa nel test un logger come `env_logger`):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` accetta `--trace` su un file di test, o sul punto d'ingresso dell'app con gli step sullo standard input:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

Con `--target`, la traccia è quella della piattaforma: i batch applicati dall'host, sotto gli step che li hanno prodotti, e i tempi propri dell'host per ogni commit ed evento, sull'hardware del dispositivo.

Usala per:

- verificare che un'app (o una demo) compili, venga valutata e renderizzi senza errori;
- vedere esattamente quali view native crea, sposta o aggiorna una modifica, e quante;
- misurare il costo del primo fotogramma, di un tap e di ogni fotogramma di scorrimento;
- intercettare le regressioni in CI.
<a id="reading-the-output"></a>

### Leggere l'output

Ecco l'esempio del contatore con una pressione (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), abbreviato:

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

#### Batch e mount item

Ogni blocco `── step: N items` è un **mount batch**, sotto lo step in cui è arrivato: tutto ciò che la piattaforma applica alle view native per un frame,
in un solo passaggio al main thread. Le righe al suo interno sono i **mount item**:

| Item | Significato |
|---|---|
| `Create { id, kind }` | Crea una view nativa (`View`, `Text`, `Image`, `Scroll`, ...). |
| `Insert { parent, child, before }` | Inserisce una view nel suo parent, prima di un sibling (`None`: in fondo). |
| `Remove` / `Delete` | Stacca una view dal suo parent / la libera. |
| `ViewStyle { id, style }` | La decorazione della view: sfondo, bordi, raggio, ombra, opacità, trasformazione, ... |
| `ViewProps { id, props }` | Impostazioni di tocco e accessibilità, `testID`. |
| `Events { id, events }` | Quali eventi la view segnala (`EventMask(1)` è la pressione). |
| `Frame { id, x, y, w, h }` | La sua posizione e dimensione nel parent, in punti. |
| `Text { id, text, content }` | Il testo impaginato per una view di testo. |
| `Image { id, source, ... }` | Un'immagine da caricare. |

Viene inviato solo ciò che è cambiato: un tap che cambia un numero invia un solo item `Text`; le view non ricevono stili predefiniti né maschere di eventi vuote; i frame invariati non vengono inviati. Un frame di scorrimento che non rivela nessuna nuova riga non produce **alcun batch**.

<a id="the-762-lines"></a>

#### Le righe `perf`

| Riga | Significato |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | Tempo di bundling e dimensione del bundle (impostazioni di sviluppo). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | Un commit: le operazioni accodate da JS, il tempo impiegato dal core (rendering dei componenti, layout, diffing), il tempo JS speso nel binding delle righe della lista, i mount item prodotti e i nodi vivi. |
| `turn: 2640µs (timers and tasks 1964µs)` | Un turno che ha eseguito il commit: il suo tempo totale e quello impiegato dai timer JS e dai task dei componenti Rust prima del commit (un componente Rust viene renderizzato nel commit). |
| `first frame: eval 271µs, total 1235µs` | Tempo di valutazione del bundle e tempo dall'avvio al primo batch. |
| `event Press on view 20` / `event js: 196µs` | Un evento inviato e il tempo impiegato in JS dal suo handler (e da ciò che ha causato). |

> [!NOTE]
> In modalità headless il testo viene misurato con un motore di testo approssimato, quindi le dimensioni del testo differiscono un po' da quelle di un dispositivo, che usa
> CoreText o il text layout di Android. La logica di layout, il numero di view e il numero di operazioni sono gli stessi.

I tempi di una singola esecuzione dipendono molto dallo stato del clock della CPU (una macchina appena uscita dallo stato di inattività è lenta). Confronta le esecuzioni sulla
stessa macchina, guarda il minimo di più esecuzioni e fidati più dei conteggi di op e item che dei microsecondi.

<a id="scrolling"></a>

### Scorrimento

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` sposta la lista di 10 punti per frame, a 60 frame al secondo, e viene stampato il batch di ogni frame:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

Per una [lista](./lists.md), questo mostra la virtualizzazione al lavoro: quali frame eseguono il binding di nuove righe, quante operazioni costa una riga e il fatto che i frame che non rivelano nuove righe non producono nulla. Usalo con una build release (`cargo test --release`, oppure `./target/release/nsh` in un checkout) per ottenere tempi significativi.

### In CI

I test headless non richiedono né dispositivo né display, quindi girano sui runner Linux: `cargo test` per i test di un'app Rust e
`nsh test`, che non richiede altro che la CLI. Qualsiasi test fallito fa terminare entrambi con un codice diverso da zero: un test che
fallisce, un'app che non compila o non renderizza nulla, un'eccezione lanciata dall'app durante uno step.

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

(Installa la CLI `nsh` sul runner nello stesso modo in cui la installi in locale; vedi [Installazione](./installation.md).)

`--junit <FILE>` scrive anche i risultati come report JUnit XML, che i servizi di CI (reporter di test di GitHub Actions,
GitLab, Jenkins, Azure Pipelines) mostrano per singolo test: un `testsuite` per ogni file di test, un `testcase` per ogni test, con ciò che è fallito,
dove, e i testi presenti sullo schermo.

Per tenere sotto controllo le prestazioni, registra i conteggi degli item di alcune interazioni (le righe `── … : N items` e i numeri `ops` /
`mount items` di `--trace`) e fai fallire il test quando crescono. I conteggi sono deterministici; i tempi sulle macchine CI condivise
non lo sono.

> [!NOTE]
> I test girano con `capabilities` dichiarati da `nsh.json` dell'app, come su un dispositivo: ciò che l'app non dichiara viene rifiutato anche nel test.

<a id="784-for-ui-tests"></a>

## `testID` per i test UI

I test headless verificano ciò che il runtime renderizza e i loro selettori `id:` trovano le view tramite test id. Per pilotare la vera
UI nativa con gli strumenti di test della piattaforma (XCUITest, Espresso / UI Automator, Appium, Maestro), assegna un test id alle view:
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

| Piattaforma | Dove va `testID` |
|---|---|
| iOS | Il `accessibilityIdentifier` della view (`app.otherElements["add-to-cart"]` in XCUITest). |
| Android | Il nome della risorsa dell'id della view del nodo di accessibilità (`By.res("add-to-cart")` in UI Automator). |

Il test id è un metodo di ogni elemento in Rust, compresi gli elementi dei componenti (`button().test_id("save")`, che
dà un nome alla root del componente), e `testID` una prop di ogni elemento e di ogni componente Rust (`Button`, `Dialog`, ...). Non cambia ciò che gli screen reader
dicono; usa `accessibilityLabel` per quello (vedi [Accessibilità](./accessibility.md)). Nell'output di `--trace` compare
nell'item `ViewProps` della view come `test_id: Some("add-to-cart")`.

<a id="see-also"></a>

## Vedi anche

- [Prestazioni](./performance.md): cosa cercare in questi numeri
- [Dev server e debugging](./dev-server-and-debugging.md)
- [Architettura](./architecture.md): op, commit e mount batch
