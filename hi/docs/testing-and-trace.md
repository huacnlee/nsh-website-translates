---
title: "टेस्टिंग"
description: "ऐप्स को headless मोड में टेस्ट करें, Rust में cargo test और nsh_testing के साथ या TypeScript में nsh test के साथ - ऐप खोलें, प्रेस करें, टाइप करें, स्क्रॉल करें और उपयोगकर्ता की तरह प्रतीक्षा करें, नेटवर्क और स्टोरेज को stub करें - और --trace द्वारा प्रिंट किए गए नेटिव व्यू ऑपरेशन और टाइमिंग पढ़ें; UI टेस्ट के लिए testID।"
order: 61
group: tools
source_hash: c0e7414002b92551
---

# टेस्टिंग

NSH ऐप्स को **headless** चलाता है: असली इंजन (वही reactive graph, renderer, कंपोनेंट, layout और list virtualization जो डिवाइस पर होते हैं, और TSX के लिए QuickJS), 60 Hz पर display frames के साथ, लेकिन न कोई सिमुलेटर, न कोई डिवाइस और न कोई विंडो। यह हर उस जगह चलता है जहाँ Cargo या CLI चलता है, Linux CI मशीनों सहित, और दो काम करता है:

- यह टेस्ट चलाता है: हर टेस्ट ऐप खोलता है, वही स्टेप लेता है जो एक उपयोगकर्ता लेता (press, type, scroll), और जाँचता है कि स्क्रीन पर क्या है। Rust ऐप के टेस्ट Rust में होते हैं, जिन्हें `cargo test` `nsh-testing` crate के साथ चलाता है; TypeScript में लिखे टेस्ट `nsh test` से चलते हैं, TSX ऐप्स और Rust ऐप्स दोनों के लिए;
- `--trace` के साथ, यह रनटाइम द्वारा नेटिव views को भेजा गया हर ऑपरेशन टाइमिंग के साथ प्रिंट करता है: पहला फ्रेम, एक tap या स्क्रॉलिंग का एक फ्रेम कितना खर्च करता है।

<a id="writing-tests"></a>

## टेस्ट लिखना

वही टेस्ट, Rust और TypeScript में: यह ऐप को उसके storage में खाली todo सूची के साथ खोलता है, टाइप करता है, press करता है और जाँचता है कि स्क्रीन क्या दिखाती है।

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

## cargo test के साथ Rust में टेस्ट

Rust ऐप के टेस्ट उसके crate के integration tests होते हैं, जिनमें `nsh-engine` और `nsh-testing` (इसकी default features, QuickJS के बिना) dev-dependencies के रूप में होते हैं:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` फ़ोन-आकार का इंजन (390×844 points) है जिसमें और कुछ सेट नहीं होता; इसके फ़ील्ड वही सेट करते हैं जो नीचे `open` के विकल्प सेट करते हैं: `storage` (`MemoryStorage::new(entries)`), `network` (`StubNetwork`, नीचे), `viewport`, `environment` (appearance, locale, reduced motion), `clock` (`Clock::manual(time)`, नीचे)। `nsh_testing::Headless::start(config)` ऐप शुरू करता है और उसके दिखाए views का एक मॉडल रखता है। इसके स्टेप वही हैं जो नीचे `nsh test` के हैं, उन्हीं selectors के साथ, Rust में: `press`, `long_press`, `clear`, `type_text`, `submit`, `scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`, `set_system_time`, `set_viewport`, `set_clipboard` और `on_dialog`; `app.shows(text)` और `app.screen()` (`texts()`, `count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`) स्क्रीन पर मौजूद चीज़ें पढ़ते हैं। जब कोई स्टेप नहीं लिया जा सकता, तो वह स्क्रीन के टेक्स्ट के साथ एक error लौटाता है।

`nsh_testing::tsx(entry, sets)` (feature `bundle`) किसी ऐप की TSX entry को उसी तरह खोलता है, जिसे NSH और crate के UI sets के विरुद्ध बनाया गया हो ([Building with Rust](./rust.md#testing))। `examples/gallery-rs` अपने Rust root को इसी तरह टेस्ट करता है, हर डेमो के लिए एक मॉड्यूल; `examples/rust-exports` अपनी TSX entry को Rust से टेस्ट करता है।

`nsh test` ये टेस्ट भी चलाता है: Rust crates वाले ऐप की डायरेक्टरी (`nsh.json` `"rust"`) दिए जाने पर, यह टेस्ट फ़ाइलों से पहले उसके हर crate के लिए `cargo test` चलाता है, और Rust टेस्ट को TypeScript टेस्ट के साथ दिखाता और गिनता है (`✓ src/lib.rs › tests::adds`), अपने सारांश और अपनी `--junit` रिपोर्ट में। इसलिए `nsh test` Rust ऐप, crate वाले TSX ऐप और सामान्य TSX ऐप, सभी के लिए एक ही कमांड है, और `nsh check` भी इसी तरह TypeScript को type check करने से पहले crates पर `cargo check --all-targets` चलाता है।

<a id="tests-with-nsh-test"></a>

## nsh test के साथ टेस्ट

टेस्ट फ़ाइल आपके कोड के बगल में एक `*.test.tsx` या `*.test.ts` फ़ाइल होती है। यह `nsh/test` import करती है, जैसा ऊपर `App.test.tsx` करता है:

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

विफल टेस्ट दिखाता है कि क्या throw हुआ, टेस्ट फ़ाइल में कहाँ, और जो ऐप उसने खोला उसकी स्क्रीन के टेक्स्ट। कोई भी विफलता `nsh test` को non-zero कोड के साथ बंद करती है। `nsh init` ऐप के साथ एक `App.test.tsx` बनाता है, और `nsh check` टेस्ट फ़ाइलों को बाकी कोड के साथ type check करता है (`.nsh/types` `nsh/test` घोषित करता है)।

हर टेस्ट फ़ाइल अपने अलग इंजन पर चलती है, और उसके टेस्ट क्रम से एक के बाद एक चलते हैं। `open` ऐप को दूसरे इंजन पर शुरू करता है, हर बार नया, इसलिए टेस्ट कभी state साझा नहीं करते; टेस्ट के खत्म होने पर उसके खोले ऐप्स बंद हो जाते हैं। टेस्ट तब विफल होता है जब वह throw करे, जब उसका लौटाया promise reject हो, और अपने timeout के बाद: 30 सेकंड, या वे मिलीसेकंड जो `test` का तीसरा आर्गुमेंट देता है (`test("syncs", body, 60_000)`)। जिस ऐप के अपने Rust crates हैं (`nsh.json` `"rust"`) वह अपने टेस्ट एक headless runner में चलाता है जिसे NSH उनके साथ बनाता है, उसी तरह; Rust ऐप में (`nsh.json` `"root"`, [Building with Rust](./rust.md)), `open(".")` उसका root कंपोनेंट शुरू करता है।

<a id="grouping-tests-and-setting-them-up"></a>

### टेस्ट को समूहबद्ध करना और सेट अप करना

`describe`, hooks और `test` के variants Jest की तरह काम करते हैं:

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

| फ़ंक्शन | विवरण |
|---|---|
| `describe(name, body)` | टेस्ट और उन blocks को समूहबद्ध करता है जिन्हें `body` घोषित करता है (तुरंत, फ़ाइल लोड होते समय): उनके नाम `name` (`the cart › starts empty`) से शुरू होते हैं, और जो hooks यह घोषित करता है वे केवल उन्हीं के आसपास चलते हैं। Blocks नेस्ट हो सकते हैं। |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | `fn` को उस block के हर टेस्ट से पहले / बाद में चलाते हैं जिसमें वे घोषित हैं (फ़ाइल, एक `describe`): बाहरी blocks के `beforeEach` पहले, भीतरी blocks के `afterEach` पहले। जो `beforeEach` विफल हो वह टेस्ट को विफल करता है; `afterEach` हर हाल में चलता है। |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | `fn` को अपने block के पहले टेस्ट से पहले और आख़िरी के बाद एक बार चलाते हैं, जब उसका कोई टेस्ट चलता है। जो `beforeAll` विफल हो वह block के टेस्ट को विफल करता है; जो `afterAll` विफल हो उसे विफल `<block> › afterAll` के रूप में रिपोर्ट किया जाता है। जो ऐप कोई `beforeAll` खोलता है वह block के टेस्ट के लिए खुला रहता है, और उसके `afterAll` के बाद बंद होता है। |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | किसी टेस्ट, या किसी ऐसे block को घोषित करता है जिसके टेस्ट नहीं चलते: उन्हें skipped के रूप में रिपोर्ट किया जाता है। |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | जब तक टेस्ट फ़ाइल में कोई एक है, केवल वही टेस्ट और blocks चलते हैं; फ़ाइल के बाकी skipped के रूप में रिपोर्ट होते हैं। |
| `test.todo(name)` | एक ऐसा टेस्ट जो अभी लिखना बाकी है, और उसी रूप में रिपोर्ट होता है। |

कोई hook `async` हो सकता है; उसका `timeout` 30 सेकंड है जब तक दिया न जाए। टेस्ट और hooks फ़ाइल लोड होते समय घोषित होते हैं: किसी टेस्ट या hook के भीतर घोषित टेस्ट throw करता है।

<a id="opening-the-app"></a>

### ऐप खोलना

`open(entry, options?)` `entry` पर मौजूद ऐप को बनाता है (टेस्ट फ़ाइल के सापेक्ष; हर entry प्रति run एक बार बनती है), उसे 390×844 viewport पर शुरू करता है और तब resolve होता है जब वह render हो चुका हो और शांत हो। `--target` के साथ, ऐप विकल्पों के साथ वैसे ही चलता है जैसे टेस्ट उन्हें देता है: जिस विकल्प को target का प्लेटफ़ॉर्म पूरा नहीं कर सकता, वह `open` को `ERR_NSH_TEST_UNSUPPORTED` के साथ reject करवाता है, और उसका नाम बताता है (देखें [On a real platform](#on-a-real-platform))।

| विकल्प | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `storage` | खाली | शुरुआत में `Storage` में क्या है: `{ todos: "[]" }`। |
| `network` | कोई नहीं | ऐप के अनुरोधों को route के अनुसार क्या मिलता है: देखें [Stubbing the network](#stubbing-the-network)। `"live"`: असली नेटवर्क, इसके अनुरोधों, sockets और WebSockets के लिए। |
| `width`, `height` | 390, 844 | points में viewport: headless में, डेस्कटॉप की विंडो, वेब का पेज। iOS और Android पर ऐप डिवाइस की स्क्रीन भरता है। |
| `safeArea` | 0 | points में safe area insets: `{ top: 47, bottom: 34 }`। |
| `clipboard` | खाली | शुरुआत में clipboard पर मौजूद टेक्स्ट। |
| `colorScheme` | `"light"` | सिस्टम की appearance: `"light"` या `"dark"` (`colorScheme()`, `dark:` क्लासेज़)। |
| `locale` | `"en-US"` | डिवाइस की locale, एक BCP 47 टैग (`locale()`, `Intl` का डिफ़ॉल्ट)। |
| `reducedMotion` | `false` | उपयोगकर्ता ने कम motion माँगा है (`reduceMotion()`)। |
| `platform` | `"ios"` | वह प्लेटफ़ॉर्म जिसके रूप में ऐप headless चलता है: `"ios"`, `"android"`, या किसी डेस्कटॉप का, `"macos"`, `"windows"`, `"linux"`, या डेस्कटॉप idiom में `"web"` (`platform.os`, `ios={{…}}` / `android={{…}}` / `desktop={{…}}` props, कीबोर्ड शॉर्टकट)। `--target` के साथ, ऐप target के प्लेटफ़ॉर्म के रूप में चलता है: किसी भी डेस्कटॉप पर डेस्कटॉप का `platform` और वेब हमेशा डेस्कटॉप के रूप में (ब्राउज़र में किसी भी चौड़ाई पर डेस्कटॉप idiom में, `platform.os` `"web"` ही रहता है), `"ios"` और `"android"` अपने रूप में। |
| `clock` | सिस्टम की | एक manual clock, जिसका समय केवल तब बढ़ता है जब टेस्ट उसे बढ़ाता है: `{}`, या `{ time }` किसी `Date` (या Unix epoch से मिलीसेकंड) पर शुरू करने के लिए। देखें [Controlling time](#controlling-time)। |
| `host` | कोई नहीं | embedding ऐप का हिस्सा, जिसे टेस्ट निभाता है: `{ params, handlers }`। देखें [Playing the host app](#playing-the-host-app)। |

<a id="playing-the-host-app"></a>

### host ऐप की भूमिका निभाना

किसी नेटिव ऐप में embed किया गया ऐप उससे [`host`](../modules/nsh.md#host) के ज़रिए बात करता है। टेस्ट में, टेस्ट host ऐप की भूमिका निभाता है: `host.params` वे launch parameters देता है जिन्हें ऐप शुरू में पढ़ता है, और `host.handlers` ऐप के `host.call` का जवाब देता है और उसके `host.post` सुनता है, नाम के अनुसार। Handler एक value होता है, जो हर call का जवाब देता है, या call के data का एक फ़ंक्शन जो जवाब लौटाता है (या उसका promise)। फ़ंक्शन जो throw करता है वह call को reject करता है, जैसा host ऐप की error करती है। जिस नाम को `handlers` सूचीबद्ध नहीं करता उसकी call विफल होती है, जैसा उस host ऐप में होता है जो कुछ handle नहीं करता।

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

`app.host.send(name, data)` एक event भेजता है, फिर तब तक इंतज़ार करता है जब तक ऐप शांत न हो जाए। `app.host.calls()` और `app.host.posts()` वह सूचीबद्ध करते हैं जो handlers को मिला, क्रम से: `name` और `data`।

ऐप जो URLs खोलता है ([`openUrl`](../modules/nsh.md#openurl), किसी `TextView` के links `links="open"` के साथ) वे रिकॉर्ड किए जाते हैं और ऐप को खुले हुए के रूप में बताए जाते हैं, और इस मशीन पर कुछ नहीं खुलता। `app.openedUrls()` उन्हें सूचीबद्ध करता है:

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### नेटवर्क को stub करना

`network` routes को `"<METHOD> <URL>"` के अनुसार सूचीबद्ध करता है (सादा URL एक `GET` है; `*` किसी भी टेक्स्ट से मेल खाता है)। जिस अनुरोध से कोई route मेल नहीं खाता वह विफल होता है, इसलिए टेस्ट बिना कहे कभी नेटवर्क तक नहीं पहुँचते। Route एक response होता है, या अनुरोध का एक फ़ंक्शन जो एक लौटाता है (या उसका promise); Rust में, `StubNetwork::new(routes)` वही routes लेता है, हर एक `StubResponse` या `StubRoute::Handler` होता है:

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

| Response सदस्य | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `status` | 200 | स्टेटस कोड। |
| `headers` | कोई नहीं | Header के नाम और values। |
| `body` | खाली | एक string, या JSON के रूप में भेजी गई value (`content-type: application/json` के साथ, जब तक `headers` कोई नाम न दें)। |
| `error` | कोई नहीं | अनुरोध इसके बजाय इस संदेश के साथ विफल होता है, जैसे डिवाइस के offline होने पर। |
| `delay` | 0 | response में कितना समय लगता है, मिलीसेकंड में; स्टेप उसका इंतज़ार नहीं करता, `waitFor` करता है। Manual clock पर, यह तब आता है जब clock उसे पार कर ले। |

Route का फ़ंक्शन अनुरोध पाता है (`method`, `url`, `headers`, `body` टेक्स्ट के रूप में) और टेस्ट फ़ाइल में चलता है, इसलिए यह अनुरोध गिन सकता है या उस चीज़ से जवाब दे सकता है जो टेस्ट ने सेट की। जो फ़ंक्शन throw करता है वह अनुरोध को और उस स्टेप को विफल करता है जिसने उसे किया। `app.requests()` ऐप द्वारा किए गए अनुरोध क्रम से सूचीबद्ध करता है, उसी तरह।

Connections भी टेस्ट में ही रहते हैं: ऐप के sockets (`net`) और WebSockets (global `WebSocket` और `websocket` मॉड्यूल) कोई connection नहीं खोलते जब तक `network` `"live"` न हो। ऐप की अपनी capability जाँचें पास होने के बाद, `net.connect` और `websocket` मॉड्यूल का `connect` `code` `ERR_NSH_TEST_NETWORK` के साथ reject होते हैं, और global `WebSocket` `error` फ़ायर करता है, फिर `close` (1006, clean नहीं), जैसे उस connection के लिए जिसे नेटवर्क ने ठुकरा दिया। `"live"` के साथ, वे ऐप के अनुरोधों के साथ असली नेटवर्क से जुड़ते हैं। Rust में, `EngineConfig::refuse_connections` `Headless` ऐप के लिए यही करता है: ऐप जिससे जुड़ता है उसका एक फ़ंक्शन (WebSocket का URL, socket का `host:port`) जो वह error लौटाता है जिससे उसकी call विफल होती है।

<a id="controlling-time"></a>

### समय को नियंत्रित करना

सिस्टम की clock पर, ऐप के timers और नेटिव animations उतना ही समय लेते हैं जितना डिवाइस पर, और उनका इंतज़ार करने वाले टेस्ट भी। Manual clock के साथ (Rust में `EngineConfig::clock`, TypeScript में `open` का `clock`), ऐप एक ऐसी clock पर चलता है जिसका समय केवल तब बढ़ता है जब टेस्ट उसे बढ़ाता है, और तुरंत, जैसे Jest के fake timers या Playwright के `page.clock` के साथ। `app.clock` वही clock है, और `null` जब ऐप सिस्टम की clock पर चलता है:

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

जिस `StubNetwork` के responses में `delay` है वह `.with_clock(clock.clone())` के साथ manual clock का अनुसरण करता है। नीचे के स्टेप `nsh test` के हैं; `Headless` में इनमें से हर एक है (`run_for`, `fast_forward`, `set_system_time`)।

| स्टेप | विवरण |
|---|---|
| `await app.clock.runFor(ms)` | Clock को `ms` मिलीसेकंड आगे बढ़ाता है, एक बार में एक display frame। Timers, `requestAnimationFrame`, नेटिव animations और विलंबित responses अपने देय होने पर चलते हैं, क्रम से, हर एक अपने समय पर। ऐप के शांत होने पर resolve होता है। |
| `await app.clock.fastForward(ms)` | Clock को `ms` मिलीसेकंड एक साथ आगे बढ़ाता है, जैसे sleep से जागता डिवाइस करता है: इस बीच देय हुए timers एक-एक बार चलते हैं। |
| `app.clock.setSystemTime(time)` | Wall time (`Date.now()`, `new Date()`) को `Date` या मिलीसेकंड पर सेट करता है, कोई timer नहीं हिलाता। |

`Date`, `performance.now()` और `Intl` की डिफ़ॉल्ट तारीख clock का अनुसरण करती हैं। स्टेप जो चल रहा है उसे इंतज़ार किए बिना पूरा करते हैं: जब तक ऐप frames माँगता है या कोई नेटिव animation चलती है, frames एक के बाद एक आते हैं, हर एक clock पर एक frame के समय (1/60 s) बाद। 300 ms का transition कुछ मिलीसेकंड लेता है, और उस दौरान देय timer चलता है। जो animation हमेशा loop करती है (एक spinner) वह clock के साथ चलती है: वह तब घूमती है जब टेस्ट clock को बढ़ाता है। `app.wait(ms)` और long press अपने समय के बराबर clock बढ़ाते हैं। जो timer बाद में देय होता है वह तभी चलता है जब टेस्ट clock को वहाँ तक ले जाए। `waitFor` और `waitUntil` इंतज़ार करते समय clock को बढ़ाते हैं, एक बार में एक display frame, हर frame के बाद देखते हुए, इसलिए timer जो दिखाता है वह इंतज़ार करते ही, एक पल में आ जाता है: `waitFor("Saved", { timeout: 15_000 })` clock को अधिकतम पंद्रह सेकंड बढ़ाता है। उनका timeout दोनों clocks पर गिना जाता है: इंतज़ार ऐप की clock को अधिकतम उतना ही बढ़ाता है, और तब reject होता है जब उतना असली समय भी बीत चुका हो, इसलिए जो ऐप के बाहर से आता है (route का फ़ंक्शन, नेटवर्क) उसके पास उतना ही समय होता है जितना सिस्टम की clock पर। Gallery के टेस्ट इसी तरह चलते हैं (`examples/gallery/tests`): animations का इंतज़ार करने वाले इसके बारह टेस्ट 28 s की जगह 6 s लेते हैं।
<a id="steps"></a>

### चरण

चरण व्यूज़ को **सेलेक्टर** से नाम देते हैं, जो Playwright की तरह लिखे जाते हैं:

| सेलेक्टर | मैच करता है |
|---|---|
| `id:<testID>` | उस `testID` वाला व्यू। |
| `label:<label>` | उस `accessibilityLabel` वाला व्यू। |
| `text:<text>` | वह टेक्स्ट जो यही पढ़ता है (उसके आसपास के स्पेस छोड़कर), प्रेस लेने वाले टेक्स्ट का एक स्पैन (नेस्टेड `<Text onPress>`, `TextView` का लिंक), या वह इनपुट जिसमें यह हो या, खाली होने पर, जिसका यह प्लेसहोल्डर हो। |
| `role:<role>`, `role:<role>[<name>]` | उस `role` (`role:button`) वाला और उस नाम वाला व्यू: उसका लेबल, नहीं तो उसमें मौजूद टेक्स्ट (`role:button[Save]`)। |
| `view:<id>` | `--trace` आउटपुट में उस id वाला व्यू। |
| इसके अलावा कुछ भी | एक `testID`, नहीं तो एक लेबल, नहीं तो एक टेक्स्ट, जैसा लिखा गया हो। |

जो हिस्सा छोटे अक्षरों के शब्द और कोलन से शुरू होता है, वह एक प्रीफ़िक्स का नाम होता है (`id`, `label`, `role`, `text`, `view`), इसलिए `tapped: solo` एक स्टेप एरर है जो उन्हें सूचीबद्ध करता है। जो टेक्स्ट, लेबल या टेस्ट id इस तरह शुरू होता है, वह अपना प्रीफ़िक्स लेता है, जो बाकी हिस्से को जैसा लिखा है वैसा पढ़ता है: `text:tapped: solo`, `label:note: draft`, `id:row:2`। नए प्रीफ़िक्स आने पर भी सेलेक्टरों का अर्थ वही रहता है।

`label:`, `text:` और किसी role का नाम रेगुलर एक्सप्रेशन भी ले सकते हैं: `text:/^Buy/i`, जो Rust के `regex` क्रेट के सिंटैक्स में लिखा जाता है (JavaScript के क्लास, ग्रुप, एंकर और क्वांटिफ़ायर, लीनियर टाइम में मैच होते हैं; फ़्लैग `i`, `m` और `s`)। ` >> ` उसके अंदर देखता है जो पिछले हिस्से ने मैच किया था (`id:cart >> role:button[Remove]`), और `nth=<n>` मैचों में से एक रखता है, 0 से शुरू करके (`text:Delete >> nth=1`)। सेलेक्टर वे व्यूज़ ढूँढता है जिन्हें उपयोगकर्ता सबसे पहले देखेगा: सबसे ऊपर के मोडल में, फिर स्क्रीन पर, और नेविगेशन स्टैक में केवल सबसे ऊपर की स्क्रीन। यह वही मैच करता है जो उपयोगकर्ता को दिखता है: वे व्यूज़ जिनका क्षेत्रफल हो, `visibility: hidden` के बाहर हों, विंडो के अंदर हों और उन व्यूज़ के अंदर हों जो उन्हें क्लिप करते हैं (`overflow: hidden`), या किसी ऐसे स्क्रॉल व्यू की सामग्री में कहीं भी, जिसे उपयोगकर्ता स्क्रॉल कर सकता है और जिसे स्क्रॉल करने पर वे सामने आ जाते हैं (`opacity` और transforms को छोड़कर, जैसा Playwright में होता है)। जो चरण किसी व्यू पर कार्य करता है (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`) उसे ठीक एक व्यू चाहिए: कई व्यूज़ से मैच करने वाला सेलेक्टर चरण को विफल कर देता है, और एरर बताता है कि उसे कैसे सीमित करें।

| चरण | विवरण |
|---|---|
| `await app.press(selector)` | व्यू को प्रेस करता है, या उसके आसपास के उस निकटतम व्यू को जो प्रेस सुनता है (टेक्स्ट के आसपास का बटन): `onPressDown`, `onPressUp`, `onPress`, इनके भीतर एक उँगली नीचे जाती और उठती है, जिसे उसके आसपास के वे व्यूज़ सुनते हैं जो टच सुनते हैं (किसी ओवरले का `onPressOutside`)। टेक्स्ट के किसी स्पैन को उसके अक्षरों पर प्रेस किया जाता है (`await app.press("Privacy policy")`), headless में और iOS, Android व डेस्कटॉप पर। उसी व्यू का 500 ms के भीतर दूसरा प्रेस उसका दूसरा क्लिक होता है (`clicks: 2`, यानी डबल प्रेस), जैसा प्लेटफ़ॉर्म उन्हें गिनते हैं। व्यू के disabled होने पर रिजेक्ट होता है। |
| `await app.longPress(selector)` | उस पर (या उसके आसपास के उस निकटतम व्यू पर जो प्रेस या टच सुनता है) उसके `delayLongPress` (500 ms) तक उँगली टिकाए रखता है: `onPressDown`, `onLongPress`, `onPressUp`; इसके बाद कोई `onPress` नहीं आता। टच के हैंडलर उँगली को सुनते हैं (`ContextMenu` या `Tooltip` खुलता है)। |
| `await app.clear(selector)` | इनपुट को खाली करता है, जैसे सब चुनकर डिलीट करने से होता है। |
| `await app.type(selector, text)` | इनपुट में (या व्यू के अंदर पहले इनपुट में; `text:` किसी इनपुट के टेक्स्ट या प्लेसहोल्डर से भी मैच करता है) जो पहले से भरा है उसके अंत में, कुंजी दर कुंजी टाइप करता है: वह फ़ोकस लेता है, फिर हर अक्षर एक `onKeyPress` और एक `onChange` होता है, `maxLength` के भीतर। सिंगल-लाइन इनपुट में `\n` रिटर्न कुंजी है। |
| `await app.submit(selector)` | इनपुट में रिटर्न कुंजी, जैसा उसका `submitBehavior` कहता है: `onSubmit` (और सिंगल-लाइन इनपुट से फ़ोकस हट जाता है), या मल्टीलाइन इनपुट में एक लाइन ब्रेक। |
| `await app.scroll(selector, distance)` | स्क्रॉल व्यू या लिस्ट को (व्यू को, उसके आसपास वाले को, या उसके अंदर पहले वाले को) उसकी धुरी के साथ `distance` पॉइंट तक ड्रैग करता है, प्रति फ़्रेम 10 पॉइंट, उसकी सामग्री की सीमा के भीतर, जैसा उपयोगकर्ता कर सकता है (`scrollable`)। ऋणात्मक मान पीछे स्क्रॉल करता है। |
| `await app.hover(selector)` | माउस को व्यू के बीच में ले जाता है: उसके नीचे के जिन व्यूज़ को वह छोड़ता है वे `onMouseLeave` सुनते हैं, जिन पर वह आता है वे `onMouseEnter` सुनते हैं और अपनी `hover:` स्टाइलें लेते हैं, और सुनने वाले `onMouseMove` सुनते हैं, जिसमें माउस की स्थिति होती है और कोई बटन दबा नहीं होता। यह डेस्कटॉप और किसी भी चौड़ाई के वेब पर काम करता है, फ़ोन आइडियम वाला ब्राउज़र भी शामिल है (headless: एक डेस्कटॉप या `"web"` `platform`); iOS या Android फ़ोन में माउस नहीं होता: वहाँ यह रिजेक्ट होता है। |
| `await app.rightClick(selector)` | व्यू के बीच में माउस का सेकेंडरी बटन: वह, या उसके आसपास का सुनने वाला निकटतम व्यू, `onContextMenu` सुनता है। डेस्कटॉप और वेब पर (headless: एक डेस्कटॉप `platform`); फ़ोन में माउस नहीं होता: वहाँ यह रिजेक्ट होता है। |
| `await app.paste(selector, { text?, html?, files?, uris? })` | इनपुट में पेस्ट करता है, जैसा उपयोगकर्ता क्लिपबोर्ड की उस सामग्री के साथ करता है: वह फ़ोकस लेता है और `onPaste` सुनता है (`html` वही सामग्री उसकी फ़ॉर्मैटिंग के साथ, `files` ऐसे पाथ हैं जिनके बाइट्स उसे `File` के रूप में मिलते हैं, `uris` `file:` URL), फिर उसका टेक्स्ट वैसे अंदर जाता है जैसा `pasteBehavior` कहता है। headless में, macOS पर, iOS पर और वेब पर; मशीन का क्लिपबोर्ड जैसा था वैसा ही रहता है। |
| `app.menu()` | ऐप जो कॉन्टेक्स्ट मेन्यू दिखाता है उसके एक्शन (`Menu.popup`): `label` (सबमेन्यू के एक्शन उसके अपने नाम के बाद, `"Share > Mail"`), `disabled`, और चेक किए जा सकने वाले आइटम के लिए `checked`; कोई मेन्यू खुला न होने पर `null`। |
| `await app.chooseMenuItem(label)` | खुले कॉन्टेक्स्ट मेन्यू का एक्शन चुनता है, जैसे उस पर क्लिक करने से होता है: ऐप `onMenu` सुनता है (उसका `onSelect` चलता है), फिर मेन्यू बंद हो जाता है। आइटम के disabled या अनुपस्थित होने पर रिजेक्ट होता है। |
| `await app.closeMenu()` | खुले कॉन्टेक्स्ट मेन्यू को कुछ चुने बिना बंद करता है, जैसे Escape करता है। |
| `await app.keyboard.press(keys)` | मॉडिफ़ायर के साथ एक कुंजी दबाता है, जैसा `keymap` उसे नाम देता है (`"mod+k"`, `"shift+/"`, `"escape"`; `mod` प्लेटफ़ॉर्म की कमांड कुंजी है), हार्डवेयर कीबोर्ड पर, हर प्लेटफ़ॉर्म पर (फ़ोन और टैबलेट में भी एक होता है): ऐप का उसका शॉर्टकट उसे सुनता है (`keymap.bind`, `onKeyCommand`), नहीं तो macOS और वेब पर Tab और Shift+Tab कीबोर्ड फ़ोकस को इनपुट और प्रेस लेने वाले व्यूज़ के बीच ले जाते हैं (`onFocus`, `onBlur`, `focus:` स्टाइलें) और Return या Space उस व्यू को प्रेस करता है जिस पर फ़ोकस है, नहीं तो फ़ोकस वाला इनपुट एक अक्षर, Backspace या रिटर्न कुंजी लेता है, नहीं तो Escape पीछे जाता है। |
| `await app.keyboard.down(keys)` / `up(keys)` | मॉडिफ़ायर कुंजियों (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, `+` से जुड़ी) को `up` तक दबाए रखता है: इस बीच के प्रेस, ड्रैग और होवर उन्हें साथ रखते हैं, जैसे Mod-क्लिक या Shift-ड्रैग में होता है। अभी केवल headless और Linux पर। |
| `await app.dragAndHold(selector, by)` / `app.drop()` | वैसे ही ड्रैग करता है जैसे `drag` करता है और उँगली को `drop()` तक नीचे रखता है, जो उसे जहाँ है वहीं उठा देता है: बीच के चरण ड्रैग के दौरान स्क्रीन को देखते हैं (ड्रैग प्रीव्यू, ड्रॉप लाइन)। अभी केवल headless और Linux पर। |
| `await app.dropFiles(selector, uris)` | स्थानीय फ़ाइलें (`file:` URL, जैसे फ़ाइल मैनेजर उन्हें ड्रैग करता है) व्यू के बीच में ड्रॉप करता है: वह, या उसके आसपास का सुनने वाला निकटतम व्यू, `onFileDrop` सुनता है। अभी केवल डेस्कटॉप, headless और Linux पर। |
| `await app.drag(selector, { x, y })` | एक उँगली व्यू के बीच में उतरती है, 100 ms ठहरती है, `x`, `y` पॉइंट तक खिसकती है, प्रति फ़्रेम 10, और उठ जाती है, जैसा प्लेटफ़ॉर्म का इनपुट उसे लेता है: एक पैन उसका अनुसरण करता है (`pan={{ x, y }}`, `onPanStart`, `onPanEnd` रिलीज़ वेलोसिटी के साथ), टच सुनने वाले व्यूज़ उसे सुनते हैं (`onTouchStart`, `PanResponder`), स्क्रॉल व्यू उसके साथ स्क्रॉल होता है और, अपने शीर्ष से पर्याप्त दूर तक खींचे जाने पर, रिफ़्रेश होता है (`onRefresh`), और उसके नीचे का प्रेस हटते ही रद्द हो जाता है। डेस्कटॉप और वेब पर यह माउस है। |
| `await app.wait(ms)` | ऐप को `ms` मिलीसेकंड चलने देता है: टाइमर, एनिमेशन, रिक्वेस्ट। मैनुअल क्लॉक पर, उसे `ms` आगे बढ़ाता है (`app.clock.runFor`)। |
| `await app.waitFor(selector, options?)` | तब रिज़ॉल्व होता है जब कोई व्यू मैच करे, या `{ state: "gone" }` के साथ तब जब कोई न करे; `timeout` ms (5000) के बाद रिजेक्ट होता है। मैनुअल क्लॉक पर, प्रतीक्षा करते समय उसे एक बार में एक डिस्प्ले फ़्रेम आगे बढ़ाता है, अधिकतम `timeout` तक। |
| `await app.waitUntil(condition, options?)` | तब रिज़ॉल्व होता है जब `condition()` true लौटाए, ऐप में हर बदलाव के बाद फिर देखता है: उसके लिए जो कोई सेलेक्टर नहीं कहता (`() => app.storage().note === "Milk"`)। मैनुअल क्लॉक पर, दो जाँचों के बीच उसे एक डिस्प्ले फ़्रेम आगे बढ़ाता है, अधिकतम `timeout` तक। |
| `app.shows(selector)` | कोई व्यू अभी मैच करता है या नहीं। |
| `app.count(selector)` | अभी कितने व्यूज़ मैच करते हैं। |
| `app.enabled(selector)` | व्यू इनपुट लेता है या नहीं: न वह और न उसके आसपास का कोई व्यू disabled है, और इनपुट `readonly` नहीं है। |
| `app.texts()` | अभी स्क्रीन पर मौजूद टेक्स्ट, क्रम से। |
| `app.value(selector)` | इनपुट का टेक्स्ट, कोई मैच न होने पर `null`। |
| `app.spanStyle(selector)` | पहले मैच हुए अक्षर की रिज़ॉल्व की गई स्टाइल, headless में और हर `--target` पर: `color`, वैकल्पिक `backgroundColor`, `fontSize`, `fontWeight`, `italic`, `underline`, और `lineThrough`। रंग `#rrggbbaa` हैं; आकार पॉइंट में हैं। |
| `app.storage()` | ऐप के स्टोरेज में अभी क्या है। |
| `await app.back()` | वैसे पीछे जाता है जैसे उपयोगकर्ता जाता है (हेडर का बैक बटन, शीट को नीचे स्वाइप करना): सबसे नए मोडल का सबसे भीतरी स्टैक, नहीं तो स्क्रीन का, अपनी सबसे ऊपर की स्क्रीन को पॉप करता है (`onDismiss`), या जब उसके पास `preventBack` हो तब उससे पूछता है (`onBackRequest`); इसके बिना, सबसे नया मोडल बंद होने के लिए पूछता है (`onRequestClose`)। जब पीछे जाने के लिए कुछ न हो तो रिजेक्ट होता है। |
| `app.onDialog(handler)` | अब से ऐप जो डायलॉग दिखाता है उनका उत्तर देता है (`Alert.alert`, एक्शन शीट): `handler` को डायलॉग मिलता है (`title`, `message`, `buttons`, `cancelable`, `sheet`) और वह दबाए जाने वाले बटन का टेक्स्ट लौटाता है, या बिना किसी बटन के उसे बंद करने के लिए `null`। |
| `app.dialogs()` | ऐप ने जो डायलॉग दिखाए, क्रम से। |
| `app.onPick(handler)` | अब से ऐप जो पिक माँगता है उनका उत्तर देता है (`Picker.pickImages`): `handler` को मिलता है कि पिक क्या माँगता है (`multiple`, `limit`, `maxDimension`, `quality`, `format`) और वह उपयोगकर्ता की चुनी फ़ाइलें लौटाता है (`{ name, type?, data: Uint8Array }`, ऐप को जैसी हैं वैसी दी जाती हैं), या रद्द करने के लिए `null`। हैंडलर के बिना, पिक रद्द हो जाते हैं। headless रन में। |
| `app.picks()` | ऐप ने जो पिक माँगे, क्रम से। |
| `app.hear(text)` | उपयोगकर्ता चल रहे स्पीच सेशन में `text` बोलता है (`Speech.start`): उसका `result` अब तक के पूरे ट्रांसक्रिप्ट के रूप में `text` रिपोर्ट करता है। headless रन में। |
| `app.endSpeech(error?)` | चल रहे स्पीच सेशन को समाप्त करता है: `error` (`"no-speech"`, `"network"`, ...) के साथ वह विफल होता है, नहीं तो एक अंतिम फ़ाइनल रिज़ल्ट और `end` आते हैं, और कुछ न सुना गया हो तो `no-speech`। headless रन में। |
| `app.speechRequests()` | ऐप ने जो स्पीच सेशन शुरू किए, क्रम से: `lang` (उपयोगकर्ता के लिए `null`) और `interim`। |
| `app.clipboard()` | क्लिपबोर्ड पर अभी का टेक्स्ट, कुछ न होने पर `null`। |
| `app.requests()` | ऐप ने जो रिक्वेस्ट कीं, क्रम से: `method`, `url`, `headers`, `body`। |
| `await app.host.send(name, data?)` | होस्ट ऐप का एक इवेंट ऐप को भेजता है (`host.on`), फिर शांत होने तक प्रतीक्षा करता है। देखें [Playing the host app](#playing-the-host-app)। |
| `app.host.calls()`, `app.host.posts()` | ऐप के वे कॉल और पोस्ट जो `open` के `host.handlers` को मिले, क्रम से: `name`, `data`। |
| `app.openedUrls()` | ऐप ने जो URL खोले (`openUrl`), क्रम से: रिकॉर्ड किए जाते हैं, कभी खोले नहीं जाते। |
| `await app.setViewport(width, height)` | व्यूपोर्ट का आकार बदलता है, जैसे डिवाइस घुमाने या विंडो का आकार बदलने से होता है (`windowSize()`)। |
| `await app.setColorScheme(scheme)` | सिस्टम की अपीयरेंस को `"light"` या `"dark"` पर बदलता है, जैसा उपयोगकर्ता करता है। |
| `await app.setLifecycle(state)` | ऐप को `"background"`, `"inactive"` या `"active"` में ले जाता है, जैसा सिस्टम तब करता है जब उपयोगकर्ता उसे छोड़ता है, किसी दूसरे ऐप या विंडो पर जाता है और वापस आता है (`lifecycle()`)। केवल headless रन में। |
| `await app.screenshot(path?)` | ऐप की विंडो की PNG तस्वीर (एक `Uint8Array`), जो दिए जाने पर इस मशीन में `path` पर भी सहेजी जाती है (वर्तमान डायरेक्टरी के सापेक्ष)। ऐप को केवल असली प्लेटफ़ॉर्म ड्रॉ करता है: देखें [On a real platform](#on-a-real-platform)। |

एक चरण तब रिज़ॉल्व होता है जब ऐप ने 100 ms तक कुछ रेंडर नहीं किया हो और कोई नेटिव एनिमेशन न चल रहा हो जो अपने आप खत्म होता है (अधिकतम 2 s, उन ऐप्स के लिए जो हर समय रेंडर करते हैं; मैनुअल क्लॉक पर, ऐप के समय के भी 2 s), ताकि अगली लाइन चलने तक उसने जो बदला वह स्क्रीन पर हो; जो बाद में आता है (रिस्पॉन्स, टाइमर) उसके लिए `waitFor` का उपयोग करें। मैनुअल क्लॉक पर चरण उन 100 ms की प्रतीक्षा नहीं करता: वह तब रिज़ॉल्व होता है जब ऐप वह सब चला चुका हो जो चरण और क्लॉक के समय ने देय बनाया था (अभी देय टाइमर, प्रॉमिस, तुरंत उत्तर दिया गया स्टब्ड रिस्पॉन्स) और कोई फ़्रेम नहीं चाहता, जब तक कोई रिक्वेस्ट अब भी जारी न हो, इसलिए मैनुअल क्लॉक पर टेस्ट अपने चरणों के बीच बिना ठहराव के चलते हैं। जिसका उत्तर कोई दूसरा थ्रेड देता है (`nsh/host` कॉल, फ़ाइल रीड, थ्रेड पर Rust टास्क का काम) वह चरण के रिज़ॉल्व होने के बाद पहुँचता है: जो वह दिखाता है उसके लिए `waitFor` करें। जो एनिमेशन हमेशा लूप में चलता है, जैसे लोडिंग स्पिनर, वह पृष्ठभूमि में चलता रहता है जबकि चरण और `waitFor` आगे बढ़ते हैं, जैसे ब्राउज़र के टेस्ट में अनंत CSS एनिमेशन चलता है। चरण तब रिजेक्ट होता है, और टेस्ट विफल हो जाता है, जब उसके सेलेक्टर से कुछ मैच न हो (एरर स्क्रीन पर मौजूद टेक्स्ट सूचीबद्ध करता है), जब इस बीच ऐप ने कोई exception फेंका हो, और जब ऐप ने वह माँगा हो जिसका उत्तर केवल असली प्लेटफ़ॉर्म देता है।

जिन विफलताओं की टेस्ट अपेक्षा कर सकता है उनमें एक `code` होता है, जो जैसा है वैसा रहता है; उनके संदेश लोगों के लिए हैं और बदल सकते हैं, इसलिए टेस्ट कोड से मैच करता है:

| `code` | चरण या क्वेरी |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | स्क्रीन पर कुछ भी सेलेक्टर से मैच नहीं करता, या खुले मेन्यू में ऐसा कोई आइटम नहीं है। |
| `ERR_NSH_TEST_DISABLED` | सेलेक्टर जिस व्यू का नाम लेता है वह disabled है (ऐसा स्क्रॉल व्यू जिसे उपयोगकर्ता स्क्रॉल नहीं कर सकता, एक disabled मेन्यू आइटम)। |
| `ETIMEDOUT` | `waitFor` या `waitUntil` का समय समाप्त हो गया, या `open` के बाद ऐप ने कुछ रेंडर नहीं किया। |
| `ERR_NSH_TEST_NO_BACK` | `back()` को पीछे जाने के लिए कुछ नहीं मिला। |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` को `--target` के साथ ऐसा विकल्प दिया गया जिसे लक्ष्य का प्लेटफ़ॉर्म निभा नहीं सकता: iOS और Android पर `width` या `height`, डेस्कटॉप या वेब पर फ़ोन का `platform`, iOS या Android पर डेस्कटॉप का या दूसरे फ़ोन का, `host.handlers`। संदेश उसका नाम बताता है। |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` एक नेस्टेड `<Text testID="guide">` पढ़ता है; `text:word` उस मैच का पहला अक्षर पढ़ता है। क्वेरी को `id:note >> text:word` से सीमित करें और दोहराए गए मैचों में से `>> nth=0` से चुनें। क्वेरी किसी अनुपस्थित, अस्पष्ट या खाली स्पैन के लिए एरर रिपोर्ट करती है। किसी स्पैन का `testID` अपडेट करने पर उसका टेक्स्ट लेआउट दोबारा इस्तेमाल होता है और `onTextLayout` कॉलबैक की गिनती बनी रहती है।
<a id="what-headless-runs-play-of-the-platform"></a>

### Headless रन platform की कौन-सी भूमिका निभाते हैं

Headless रन में असली runtime होता है, पर platform नहीं। यह platform की वही भूमिका निभाता है जो NSH का protocol परिभाषित करता है, और वह कुछ नहीं करता जो केवल असली platform कर सकता है:

- **Native animations चलती हैं** frame दर frame, अपने अंत तक: `start(callback)` callbacks चलते हैं, और जो उनकी प्रतीक्षा करता है वह भी चलता है। बिना अंत वाले loops तब तक चलते हैं जब तक app उन्हें रोक नहीं देता।
- **पीछे जाना** screens को pop करता है और modals को बंद करता है, जैसा platform करता है (`app.back()`)।
- **Dialogs का उत्तर दिया जाता है**: test के `onDialog` से, नहीं तो उनके cancel बटन से, नहीं तो वे बंद कर दिए जाते हैं जब बंद किए जा सकें; जिस dialog का उत्तर केवल उसके अन्य बटन देते हैं, वह उस step को fail कर देता है जिसने उसे दिखाया, जब तक test यह न बता दे कि कौन-सा दबाना है।
- **Clipboard में text रहता है**: app जो copy करता है, वही paste करते समय वापस पढ़ा जाता है (`clipboard` से कुछ text के साथ शुरू किया जा सकता है)।
- **पेज का host `host` का उत्तर देता है** जब app का `nsh.json` `web.host` में किसी को नाम देता है ([पेज का host](#the-pages-host))।
- **App अपनी capabilities के अंतर्गत चलता है**: उसका `nsh.json` `capabilities` में जो घोषित करता है, वह device की तरह लागू किया जाता है, इसलिए जो घोषित नहीं है वह अस्वीकार हो जाता है।
- **URLs दर्ज किए जाते हैं**: app जो खोलता है उसे खुला हुआ बताया जाता है, और `app.openedUrls()` उसे सूचीबद्ध करता है।
- **Picks का उत्तर दिया जाता है**: test की files से (`onPick`), नहीं तो रद्द कर दिया जाता है, इसलिए `Picker.pickImages` `[]` के साथ resolve होता है।
- **Speech test की होती है**: `Speech.available()` `true` के साथ resolve होता है, session तुरंत शुरू होता है और वही सुनता है जो `hear` कहता है।
- **Modals तुरंत दिखते हैं**: जब कोई modal प्रस्तुत होता है तब `onShow` आता है।
- **Images load नहीं होतीं**: कोई `onLoad` या `onError` नहीं आता, और `Image.getSize` तथा `Image.prefetch` reject हो जाते हैं।
- **जिसका उत्तर केवल असली platform देता है, वह step को fail कर देता है**: clipboard पर कोई image या files।

<a id="the-pages-host"></a>

### पेज का host

वेब पर प्रकाशित app को अपना host अपने पेज से मिलता है: `nsh.json` `web.host`, एक module जो `createHost(player)` export करता है ([Web](./web.md#the-hosts-functions))। Headless रन उस module को test द्वारा खोले गए हर app के लिए, app शुरू होने से पहले, अपने अलग JavaScript context में load करते हैं (timers और `console`, browser का कुछ नहीं, कोई imports नहीं): उसका `call` app के [`host.call`](../modules/nsh.md#host) का उत्तर देता है, उसका `player.hostEvent` `host.on` तक पहुँचता है, और `host.available()` `true` है। जो `call` throw करता है, reject करता है या JSON न होने वाला मान लौटाता है, वह app की call को अपने संदेश के साथ reject कर देता है, जैसा पेज पर होता है, और app शुरू होने से पहले भेजे गए events उसके शुरू होते ही उसके top-level listeners तक पहुँचते हैं। `--web-host <module>` किसी दूसरे module को नाम देता है। App के `capabilities.host` में वह सब सूचीबद्ध होना चाहिए जिसे वह call करता है, जैसा पेज पर। किसी call का timeout और host के अपने timers app के समय पर चलते हैं, इसलिए manual clock उन्हें आगे बढ़ाती है (`app.clock.runFor`)। Browser में (`--target web`) development पेज हर app के लिए `nsh.json` का `web.host` चलाता है, जैसा प्रकाशित पेज करता है; अन्य platforms पर (`--target`) apps का कोई host नहीं होता: `host.available()` `false` है।

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` में एक app, उसका host और उनके tests हैं।

### Expectations

`expect(value)` मानों की जाँच Jest की तरह करता है, जैसा JS ने उन्हें बनाया: `toBe` `Object.is` है, `toEqual` सदस्य दर सदस्य तुलना करता है, और `Date`, `Map` या `Uint8Array` की तुलना वैसी ही की जाती है जैसा वह है। जब कोई जाँच सही नहीं होती तो वह throw करती है। `.not` उन्हें उलट देता है: `expect(app.texts()).not.toContain("Error")`। किसी function को देने पर `toThrow` जाँचता है कि उसे call करने पर क्या throw होता है; किसी promise को, या ऐसे function को जो promise लौटाता है, देने पर `rejects` और `resolves` जाँचते हैं कि वह किस पर settle होता है, जैसा Jest में: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`।

| जाँच | कब सही होती है |
|---|---|
| `toBe(expected)` | मान `expected` है, जैसा `Object.is` कहता है: वही primitive (`NaN` `NaN` है, `0` `-0` नहीं है) या वही object। |
| `toEqual(expected)` | मान `expected` के बराबर है, सदस्य दर सदस्य, जैसा Jest का `toEqual`: objects अपनी own enumerable properties से (जो property `undefined` है वह अनुपस्थित गिनी जाती है), arrays item दर item, dates अपने समय से, regular expressions source और flags से, maps और sets अपनी entries से किसी भी क्रम में, `ArrayBuffer`s और typed arrays अपने bytes से, errors name और message से; `NaN` `NaN` के बराबर है। किसी class का instance अपनी properties वाले plain object के बराबर होता है। |
| `toMatchObject(subset)` | मान में `subset` की हर property है, हर एक वैसी बराबर जैसा `toEqual` कहता है, और उसके भीतर के objects बदले में मेल खाते हैं; अन्य properties नहीं देखी जातीं, और arrays item दर item मेल खाते हैं, सभी items। |
| `toContain(item)` | कोई array, `Set`, typed array या अन्य iterable `item` रखता है (`===`), या कोई string उसे समाहित करती है। |
| `toContainEqual(item)` | कोई array, `Set` या अन्य iterable `item` के बराबर एक item रखता है, जैसा `toEqual` कहता है। |
| `toBeTruthy()`, `toBeFalsy()` | मान truthy / falsy है, जैसा JS देखता है। |
| `toMatch(pattern)` | कोई string `pattern` (एक string) को समाहित करती है, या उससे मेल खाती है (एक `RegExp`, JS engine द्वारा चलाया गया: look-behind, backreferences और named groups JavaScript की तरह काम करते हैं)। |
| `toHaveLength(n)` | मान का `length` `n` है: string की UTF-16 units, array या typed array के items। |
| `toBeNull()` | मान `null` है। |
| `toBeUndefined()`, `toBeDefined()` | मान `undefined` / उसके अलावा कुछ भी है। |
| `toBeNaN()` | मान `NaN` है। |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | कोई number `n` से इस प्रकार तुलना करता है। |
| `toThrow(expected?)` | `expect(fn)`: `fn` को call करने पर throw होता है। `expected` दिए जाने पर, error उससे मेल खाता है: उसके message में कोई string है या वह किसी `RegExp` से मेल खाता है; error class (`TypeError`, app की कोई class) error का `name` है, और `Error` हर error से मेल खाता है; किसी error का वही message है। |
| `rejects.toThrow(expected?)` | `expect(promise)`: promise reject होता है, ऐसी error के साथ जो `expected` से मेल खाती है, जैसा `toThrow` कहता है। |
| `rejects.toMatchObject(subset)` | `expect(promise)`: promise ऐसे मान के साथ reject होता है जो `subset` से मेल खाता है, जैसा `toMatchObject` कहता है: error की own properties (`code`, `permission`, ...) उसके `name` और `message` के साथ। |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)`: promise ऐसे मान पर resolve होता है जो जाँच को पूरा करता है। |

विफल होने वाली जाँच बताती है कि उसे क्या मिला और क्या अपेक्षित था, जैसा JS उन्हें लिखता:
`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`।

`rejects` और `resolves` का भी अपना `.not` है: `await expect(load()).resolves.not.toBe(null)`।

<a id="on-a-real-platform"></a>

### असली platform पर

`nsh test --target macos` (या `linux`, `windows`, `gpui`, `web`, `ios`, `android`) वही tests headless के बजाय platform के development host पर चलाता है: हर `open` app को अपनी अलग window में, नई data directory के साथ शुरू करता है, और steps platform के अपने input से उन views पर काम करते हैं जिन्हें उनके selectors नाम देते हैं, जैसा Playwright browser में करता है:

- press view के बीच में एक click है, long press एक रोका हुआ click है, `type` input पर click करता है और उसकी keys टाइप करता है, `scroll` scroll view पर एक trackpad gesture है, `back` वह है जो एक उपयोगकर्ता करता है (macOS और Linux पर Escape, Windows और GPUI में mouse का back बटन, web पर browser का back बटन, नीचे swipe की गई sheet, जब कोई menu, popover या `Sheet` खुला हो तब VoiceOver का escape gesture, अन्यथा iOS पर header का back बटन, Android पर back बटन);
- screen से बाहर का view पहले scroll करके दिखाया जाता है, एक बार में एक gesture; touch screen पर उँगली वहाँ पड़ती है जहाँ पेज खुद उसे ले जाता है, उन views के बगल में जो drag का अनुसरण करते हैं (slider, drawing area), जैसे उपयोगकर्ता scroll करता है;
- selectors, waits और queries app का वही model देखते हैं जो headless रन देखते हैं, जो host जो बनाता है उसी से तैयार होता है, इसलिए वे वही views ढूँढ लेते हैं;
- dialogs platform के अपने होते हैं: `app.dialogs()` उन्हें पढ़ता है, और किसी का उत्तर देना (`onDialog`, या जब test कुछ न कहे तो उसका cancel बटन) उसका बटन दबाता है;
- `app.screenshot(path)` window की तस्वीर लेता है।

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

Window viewport के आकार में खुलती है (390 × 844 जब तक `open` कुछ और न कहे), screen के भीतर; iOS और Android पर app device की screen भर देता है, device के आकार में। App target के platform के रूप में चलता है (`platform.os`)। Manual `clock` वैसे ही काम करता है जैसे headless में: `app.clock.runFor`, `fastForward` और `setSystemTime` app का समय तुरंत आगे बढ़ाते हैं (timers, `requestAnimationFrame` एक frame के अंतर पर, `Date`), `app.wait(ms)`, `waitFor` और `waitUntil` भी उसे आगे बढ़ाते हैं, और platform जो हर frame दिखाता है वह उसे एक frame (1/60 s) आगे बढ़ाता है, इसलिए app का समय तब भी बीतता है जब वह animate हो रहा हो। Platform की अपनी animations, और route का `delay`, असली समय लेते हैं। App के requests test तक वैसे ही आते हैं जैसे headless में: `network` routes उनका उत्तर देते हैं, जिस request से कोई route मेल नहीं खाता वह fail होती है, और `"live"` उन्हें host के network तक जाने देता है; `app.requests()` उन सबको सूचीबद्ध करता है। Sockets और WebSockets host के network पर `"live"` के साथ connect होते हैं, अन्यथा headless की तरह अस्वीकार कर दिए जाते हैं। `storage` app के शुरू होने पर उसके storage में होता है, और `app.storage()` उसे app से पढ़ता है। `locale`, `reducedMotion` और `safeArea`, जब `open` उन्हें देता है (default मान सहित), वही रखते हैं जो platform बताता है, और `colorScheme` जो वह देता है वह system की appearance बदल देता है (`"light"` भी); जो वह छोड़ देता है वह platform का अपना रहता है, और app की clipboard calls test की अपनी clipboard से पूरी की जाती हैं (`clipboard` शुरू में उसका text है, `app.clipboard()` उसे पढ़ता है), इसलिए machine की clipboard जैसी थी वैसी रहती है; text input का अपना copy और paste system की clipboard का उपयोग करता है। `host.params` app तक पहुँचता है, `app.host.send` events भेजता है, और app जो URLs खोलता है वे खोले जाने के बजाय `app.openedUrls()` के लिए दर्ज किए जाते हैं। `host.handlers` headless चलता है, जहाँ test app की calls का उत्तर देता है। `open` अपने options को target के विरुद्ध जाँचता है: iOS और Android पर `width` और `height`, किसी दूसरी तरह के device का `platform` (desktop या web पर फ़ोन का, iOS या Android पर desktop का या दूसरे फ़ोन का) और `host.handlers` `ERR_NSH_TEST_UNSUPPORTED` के साथ reject होते हैं, इसलिए test वैसे ही चलता है जैसा लिखा है या बताता है कि उसे क्या चाहिए। Desktop का `platform` (desktop के mouse और keys के लिए `"macos"`) हर desktop target और web पर चलता है, उस target के platform के रूप में और हमेशा desktop के रूप में: browser में पेज चौड़ाई जो भी हो desktop idiom में शुरू होता है, जहाँ `platform` के बिना (या `"web"` के साथ) वह अपना idiom वैसे नापता है जैसे browser करता है (600 points चौड़ाई से desktop)। जिस app के अपने Rust crates हैं वह ऐसे development host में चलता है जो उसके crates के साथ बना है, जिसे NSH platform के लिए बनाता है; Rust app का host अपना root चलाता है, इसलिए `open(".")` उसे वहाँ वैसे ही शुरू करता है जैसे headless में।

Web पर, apps development host के पेज में headless Chrome, Edge या Chromium में चलते हैं: इस machine पर स्थापित वाला, या वह executable जिसे `--browser <PATH>` नाम देता है (browser चाहिए: कोई न मिलने पर `nsh test` बताता है कि उसने कहाँ देखा)। एक browser पूरे रन की सेवा करता है, और हर `open` को अपने storage वाला एक पेज मिलता है। Input browser का trusted input है, जैसा उपयोगकर्ता का: mouse clicks, wheel scrolling और keys।

iOS पर, apps development host में iOS simulator में चलते हैं: जो booted हो, नहीं तो सबसे नया iPhone, जिसे `nsh test` boot करता है। Steps एक उँगली के touches और software keyboard की typing हैं, जैसा UIKit को device से मिलता है। `setColorScheme` simulator की appearance बदलता है, जिसे `nsh test` app के बाद वापस सेट करता है, और screen का आकार simulated device का होता है।

Android पर, apps development host में पहले device या emulator पर चलते हैं जिसे `adb devices` सूचीबद्ध करता है, अपने storage के साथ। Steps एक उँगली के touches और keyboard की keys हैं, जैसा app के views को device से मिलता है; `back` system का back है। `setColorScheme` device की dark theme बदलता है, जिसे `nsh test` app के बाद वापस सेट करता है।

<a id="steps-from-standard-input"></a>

### Standard input से steps

Tests की जगह app की entry दी जाए, तो `nsh test` app को असली network पर खोलता है, उसे 1.2 s चलने देता है, फिर वे steps लेता है जो standard input देता है, `app` app के साथ:

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

1.2 s engine की idle garbage collection को पहले step से पहले चलने देते हैं, ताकि जो app उसे छोड़ देता है जिसका वह अब भी उपयोग करता है, वह दिख जाए: उसके handlers काम करना बंद कर देते हैं।

Examples में शुरू करने के लिए tests हैं: Rust app के लिए `examples/gallery-rs` (`cargo test`, हर demo के लिए एक module, और `App.test.tsx`), Rust crate वाले app के लिए `examples/rust-exports`, `examples/counter` और `examples/gallery/tests` (storage, inputs, लंबी list, stubbed requests, dark mode, manual clock) TSX apps के लिए।

<a id="tracing-with---trace"></a>

## --trace के साथ Tracing

`--trace` उन apps का हर mount batch प्रिंट करता है जिन्हें tests खोलते हैं, उस step के नीचे जिसमें वह आया, और हर commit का समय। Rust में, test वही प्रिंट करता है: `observe` उसे हर batch उसके step के साथ देता है, और `EngineConfig::trace` `perf` पंक्तियाँ `log` crate के माध्यम से log करता है (target `nsh::perf`; test में `env_logger` जैसा कोई logger install करें):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` test file पर `--trace` लेता है, या app की entry पर standard input के steps के साथ:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

`--target` के साथ, trace platform का होता है: host ने जो batches लागू किए, उन steps के नीचे जो उन्हें लाए, और हर commit और event के host के अपने timings, device के hardware पर।

इसका उपयोग इनके लिए करें:

- जाँचने के लिए कि कोई app (या demo) बिना errors के build, evaluate और render होता है;
- ठीक-ठीक देखने के लिए कि कोई बदलाव कौन-से native views बनाता, हटाता या update करता है, और कितने;
- पहले frame, किसी tap और हर scrolling frame की लागत नापने के लिए;
- CI में regressions पकड़ने के लिए।
<a id="reading-the-output"></a>

### आउटपुट पढ़ना

यहाँ एक प्रेस के साथ counter का उदाहरण है (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), संक्षिप्त रूप में:

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

#### Batches और mount items

हर `── step: N items` ब्लॉक एक **mount batch** है, जो उस step के अंतर्गत दिखता है जिसमें वह आया: यानी एक फ़्रेम के लिए प्लेटफ़ॉर्म जो कुछ भी नेटिव views पर लागू करता है,
मुख्य थ्रेड तक एक ही hop में। इसकी पंक्तियाँ **mount items** हैं:

| आइटम | अर्थ |
|---|---|
| `Create { id, kind }` | एक नेटिव view बनाना (`View`, `Text`, `Image`, `Scroll`, ...)। |
| `Insert { parent, child, before }` | किसी view को उसके parent में, किसी sibling से पहले रखना (`None`: अंत में)। |
| `Remove` / `Delete` | किसी view को उसके parent से अलग करना / उसे मुक्त करना। |
| `ViewStyle { id, style }` | view की सज्जा: background, borders, radius, shadow, opacity, transform, ... |
| `ViewProps { id, props }` | टच और accessibility सेटिंग्स, `testID`। |
| `Events { id, events }` | view कौन-से events रिपोर्ट करता है (`EventMask(1)` का अर्थ press है)। |
| `Frame { id, x, y, w, h }` | उसके parent में उसकी स्थिति और आकार, points में। |
| `Text { id, text, content }` | text view के लिए लेआउट किया गया टेक्स्ट। |
| `Image { id, source, ... }` | लोड की जाने वाली एक इमेज। |

केवल वही भेजा जाता है जो बदला है: जो टैप एक संख्या बदलता है वह एक `Text` आइटम भेजता है; views को कोई डिफ़ॉल्ट style नहीं मिलता और न ही कोई खाली
event mask; अपरिवर्तित फ़्रेम नहीं भेजे जाते। स्क्रॉलिंग का जो फ़्रेम कोई नई row नहीं दिखाता, वह **कोई batch ही नहीं** बनाता।

<a id="the-762-lines"></a>

#### `perf` पंक्तियाँ

| पंक्ति | अर्थ |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | बंडलिंग का समय और बंडल का आकार (डेवलपमेंट सेटिंग्स)। |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | एक commit: JS ने जो operations कतार में लगाए, core ने जितना समय लिया (components रेंडर करना, लेआउट करना, diffing), list rows को bind करने में JS का समय, बने mount items, और जीवित nodes। |
| `turn: 2640µs (timers and tasks 1964µs)` | एक turn जिसने commit किया: उसका पूरा समय, और commit से पहले उसके JS timers और Rust component tasks ने कितना समय लिया (Rust component commit के दौरान रेंडर होता है)। |
| `first frame: eval 271µs, total 1235µs` | बंडल को evaluate करने में लगा समय, और शुरुआत से पहले batch तक का समय। |
| `event Press on view 20` / `event js: 196µs` | भेजा गया एक event, और उसके handler (और उससे जो कुछ हुआ) ने JS में कितना समय लिया। |

> [!NOTE]
> Headless मोड में टेक्स्ट को एक अनुमानित text engine से मापा जाता है, इसलिए टेक्स्ट के आकार डिवाइस से थोड़े अलग होते हैं, जो
> CoreText या Android के text layout का उपयोग करता है। लेआउट लॉजिक, views की संख्या और operations की संख्या समान रहती हैं।

एक बार के रन के समय CPU की clock स्थिति पर बहुत निर्भर करते हैं (जो मशीन अभी-अभी idle से जागी हो वह धीमी होती है)। रन की तुलना
एक ही मशीन पर करें, कई रन का न्यूनतम मान देखें, और माइक्रोसेकंड से ज़्यादा op और item की संख्या पर भरोसा करें।

<a id="scrolling"></a>

### स्क्रॉलिंग

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` सूची को प्रति फ़्रेम 10 points खिसकाता है, प्रति सेकंड 60 फ़्रेम पर, और हर फ़्रेम का batch प्रिंट होता है:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

[list](./lists.md) के लिए यह virtualization को काम करते हुए दिखाता है: कौन-से फ़्रेम नई rows को bind करते हैं, एक row में कितने operations लगते हैं, और जो फ़्रेम कोई नई row नहीं दिखाते वे कुछ नहीं बनाते। सार्थक
समय के लिए इसे release build के साथ उपयोग करें (`cargo test --release`, या checkout में `./target/release/nsh`)।

<a id="in-ci"></a>

### CI में

Headless टेस्ट को किसी डिवाइस या डिस्प्ले की ज़रूरत नहीं होती, इसलिए वे Linux runners पर चलते हैं: Rust ऐप के टेस्ट के लिए `cargo test`, और
`nsh test`, जिसे CLI के अलावा कुछ नहीं चाहिए। कोई भी विफल टेस्ट दोनों को non-zero कोड के साथ बाहर निकालता है: जो टेस्ट
विफल हो, जो ऐप बिल्ड न हो या कुछ रेंडर न करे, या कोई exception जो ऐप किसी step के दौरान फेंके।

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

(runner पर `nsh` CLI को उसी तरह इंस्टॉल करें जैसे आप उसे लोकली करते हैं; देखें [Installation](./installation.md)।)

`--junit <FILE>` परिणामों को JUnit XML रिपोर्ट के रूप में भी लिखता है, जिसे CI सेवाएँ (GitHub Actions test reporters,
GitLab, Jenkins, Azure Pipelines) प्रति टेस्ट दिखाती हैं: प्रति टेस्ट फ़ाइल एक `testsuite`, प्रति टेस्ट एक `testcase`, साथ में यह कि क्या विफल हुआ,
कहाँ, और स्क्रीन पर मौजूद टेक्स्ट।

परफ़ॉर्मेंस की सुरक्षा के लिए, कुछ interactions के item counts दर्ज करें (`── … : N items` पंक्तियाँ और `--trace` की `ops` /
`mount items` संख्याएँ) और जब वे बढ़ें तो विफल करें। गिनतियाँ निश्चित होती हैं; साझा CI मशीनों पर समय निश्चित नहीं होते।

> [!NOTE]
> टेस्ट उस `capabilities` के अंतर्गत चलते हैं जिसे ऐप का `nsh.json` घोषित करता है, ठीक डिवाइस की तरह: जो ऐप घोषित नहीं करता उसे टेस्ट में भी
> अस्वीकार कर दिया जाता है।

<a id="784-for-ui-tests"></a>

## UI टेस्ट के लिए `testID`

Headless टेस्ट जाँचते हैं कि runtime क्या रेंडर करता है, और उनके `id:` selectors views को test id से खोजते हैं। प्लेटफ़ॉर्म के टेस्ट टूल (XCUITest, Espresso / UI Automator, Appium, Maestro) से असली
नेटिव UI को चलाने के लिए, views को एक test id दें:
Rust में `.test_id(…)`, TSX में `testID`:

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

| प्लेटफ़ॉर्म | `testID` कहाँ जाता है |
|---|---|
| iOS | view का `accessibilityIdentifier` (XCUITest में `app.otherElements["add-to-cart"]`)। |
| Android | accessibility node का view id resource name (UI Automator में `By.res("add-to-cart")`)। |

Test id Rust में हर element का एक method है, components के elements सहित (`button().test_id("save")`, जो
component की root को नाम देता है), और `testID` हर element और हर Rust component का एक prop है (`Button`, `Dialog`, ...)। यह स्क्रीन रीडर के बोलने की सामग्री को नहीं बदलता;
उसके लिए `accessibilityLabel` का उपयोग करें (देखें [Accessibility](./accessibility.md))। `--trace` आउटपुट में यह
view के `ViewProps` आइटम में `test_id: Some("add-to-cart")` के रूप में दिखता है।

<a id="see-also"></a>

## यह भी देखें

- [Performance](./performance.md): इन संख्याओं में क्या देखना चाहिए
- [Dev server and debugging](./dev-server-and-debugging.md)
- [Architecture](./architecture.md): ops, commits और mount batches
