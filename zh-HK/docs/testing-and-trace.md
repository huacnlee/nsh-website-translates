---
title: "測試"
description: "以無介面（headless）方式測試應用程式，可使用 Rust 搭配 cargo test 與 nsh_testing，或使用 TypeScript 搭配 nsh test——像使用者一樣開啟應用程式、點按、輸入、捲動與等待，並模擬（stub）網路與儲存空間——還能讀取 --trace 輸出的原生檢視操作與耗時資訊；UI 測試可使用 testID。"
order: 61
group: tools
---

# 測試

NSH 以**無頭（headless）**方式執行應用程式：使用真正的引擎（與裝置上相同的響應式圖、渲染器、元件、版面配置與清單虛擬化，TSX 則使用 QuickJS），以 60 Hz 產生顯示幀，但不需要模擬器、裝置或視窗。它可在任何能執行 Cargo 或 CLI 的地方執行，包括 Linux CI 機器，並承擔兩項工作：

- 執行測試：每個測試會開啟應用程式，執行使用者會做的操作（按下、輸入、捲動），並檢查畫面上的內容。Rust 應用程式的測試以 Rust 撰寫，由 `cargo test` 搭配 `nsh-testing` crate 執行；以 TypeScript 撰寫的測試則由 `nsh test` 執行，TSX 應用程式與 Rust 應用程式皆適用；
- 搭配 `--trace`，它會印出執行階段送往原生視圖的每一項操作及其耗時：首幀、一次點按或一幀捲動所需的成本。

<a id="writing-tests"></a>

## 撰寫測試

同一個測試，分別以 Rust 與 TypeScript 撰寫：它在儲存空間中以空的待辦清單開啟應用程式，輸入文字、按下按鈕，並檢查畫面顯示的內容。

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

## 以 cargo test 撰寫 Rust 測試

Rust 應用程式的測試是其 crate 的整合測試，以 `nsh-engine` 與 `nsh-testing`（其預設功能，不含 QuickJS）作為 dev-dependencies：

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` 是手機大小（390×844 點）的引擎，未設定其他項目；其欄位所設定的內容，即下方 `open` 的選項所設定的：`storage`（`MemoryStorage::new(entries)`）、`network`（`StubNetwork`，見下文）、`viewport`、`environment`（外觀、語系、減少動態效果）、`clock`（`Clock::manual(time)`，見下文）。`nsh_testing::Headless::start(config)` 會啟動應用程式，並維護其所顯示視圖的模型。它的步驟即下方 `nsh test` 的步驟，使用相同的選取器，只是以 Rust 撰寫：`press`、`long_press`、`clear`、`type_text`、`submit`、`scroll(selector, px(3000.0))`、`back`、`wait`、`wait_for`、`wait_for_gone`、`wait_until`、`run_for`、`fast_forward`、`set_system_time`、`set_viewport`、`set_clipboard` 與 `on_dialog`；`app.shows(text)` 與 `app.screen()`（`texts()`、`count(selector)`、`enabled(selector)`、`dialogs()`、`clipboard()`、`commands()`）用來讀取畫面上的內容。當某個步驟無法執行時，會回傳錯誤，並附上畫面上的文字。

`nsh_testing::tsx(entry, sets)`（功能 `bundle`）以相同方式開啟應用程式的 TSX 入口，並依 NSH 與該 crate 的 UI 集合建置（[以 Rust 建置](./rust.md#testing)）。`examples/gallery-rs` 以這種方式測試其 Rust 根元件，每個示範一個模組；`examples/rust-exports` 則從 Rust 測試其 TSX 入口。

`nsh test` 也會執行這些測試：給定含有 Rust crate 的應用程式目錄（`nsh.json` `"rust"`），它會在執行測試檔之前，為其中每個 crate 執行 `cargo test`，並將 Rust 測試與 TypeScript 測試一起顯示與計數（`✓ src/lib.rs › tests::adds`），呈現在摘要與 `--junit` 報告中。因此對 Rust 應用程式、含 crate 的 TSX 應用程式以及純 TSX 應用程式而言，`nsh test` 都是唯一需要的指令；`nsh check` 同樣會在對 TypeScript 進行型別檢查之前，先對這些 crate 執行 `cargo check --all-targets`。

<a id="tests-with-nsh-test"></a>

## 以 nsh test 撰寫測試

測試檔是位於程式碼旁的 `*.test.tsx` 或 `*.test.ts` 檔案。它會匯入 `nsh/test`，如上方的 `App.test.tsx` 所示：

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

測試失敗時，會顯示拋出的內容、在測試檔中的位置，以及它所開啟之應用程式畫面上的文字。任何失敗都會使 `nsh test` 以非零代碼結束。`nsh init` 會建立內含應用程式的 `App.test.tsx`，而 `nsh check` 會將測試檔與其餘檔案一併進行型別檢查（`.nsh/types` 宣告 `nsh/test`）。

每個測試檔都在各自的引擎上執行，其中的測試依序逐一執行。`open` 會在另一個引擎上啟動應用程式，每次都是全新的引擎，因此測試之間絕不共用狀態；測試所開啟的應用程式會在測試結束時關閉。測試在拋出錯誤、其回傳的 promise 被拒絕，或逾時後即視為失敗：逾時為 30 秒，或由 `test` 的第三個引數所指定的毫秒數（`test("syncs", body, 60_000)`）。擁有自己 Rust crate 的應用程式（`nsh.json` `"rust"`）會在 NSH 隨它們一起建置的無頭執行器中，以相同方式執行測試；在 Rust 應用程式中（`nsh.json` `"root"`，[以 Rust 建置](./rust.md)），`open(".")` 會啟動其根元件。

<a id="grouping-tests-and-setting-them-up"></a>

### 將測試分組與設定

`describe`、各種掛鉤（hook）以及 `test` 的變體，其運作方式與 Jest 相同：

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

| 函式 | 說明 |
|---|---|
| `describe(name, body)` | 將測試與 `body` 所宣告的區塊分組（立即執行，即檔案載入時）：它們的名稱以 `name`（`the cart › starts empty`）開頭，且其中宣告的掛鉤只會在這些測試前後執行。區塊可以巢狀。 |
| `beforeEach(fn, timeout?)`、`afterEach(fn, timeout?)` | 在其所宣告之區塊（檔案、`describe`）的每個測試之前／之後執行 `fn`：外層區塊的 `beforeEach` 先執行，內層區塊的 `afterEach` 先執行。失敗的 `beforeEach` 會使測試失敗；`afterEach` 無論如何都會執行。 |
| `beforeAll(fn, timeout?)`、`afterAll(fn, timeout?)` | 當區塊中有測試要執行時，在其第一個測試之前與最後一個測試之後各執行一次 `fn`。失敗的 `beforeAll` 會使該區塊的測試失敗；失敗的 `afterAll` 會被回報為失敗的 `<block> › afterAll`。由 `beforeAll` 開啟的應用程式會在該區塊的測試期間保持開啟，並在其 `afterAll` 之後關閉。 |
| `test.skip(name, body, timeout?)`、`describe.skip(name, body)` | 宣告不執行的測試或區塊：它們會被回報為已跳過。 |
| `test.only(name, body, timeout?)`、`describe.only(name, body)` | 只要測試檔中有這類宣告，就只會執行這些測試與區塊；檔案中的其他測試會被回報為已跳過。 |
| `test.todo(name)` | 尚待撰寫的測試，會被回報為待辦。 |

掛鉤可以是 `async`；除非另行指定，其 `timeout` 為 30 秒。測試與掛鉤在檔案載入時宣告：在測試或掛鉤內宣告測試會拋出錯誤。

<a id="opening-the-app"></a>

### 開啟應用程式

`open(entry, options?)` 會建置位於 `entry` 的應用程式（相對於測試檔；每個入口在每次執行中只建置一次），在 390×844 的視埠上啟動它，並在渲染完成且進入靜止狀態後 resolve。使用 `--target` 時，應用程式會依測試所給的選項執行：若目標平台無法支援其中某個選項，`open` 會以 `ERR_NSH_TEST_UNSUPPORTED` 拒絕，並指出該選項（見[在真實平台上](#on-a-real-platform)）。

| 選項 | 預設值 | 說明 |
|---|---|---|
| `storage` | 空 | `Storage` 在開始時所保存的內容：`{ todos: "[]" }`。 |
| `network` | 無 | 依路由決定應用程式的請求會得到什麼：見[模擬網路](#stubbing-the-network)。`"live"`：真實網路，用於其請求、socket 與 WebSocket。 |
| `width`、`height` | 390、844 | 以點為單位的視埠：無頭模式下為桌面視窗，網頁則為頁面。在 iOS 與 Android 上，應用程式會填滿裝置的螢幕。 |
| `safeArea` | 0 | 以點為單位的安全區域邊距：`{ top: 47, bottom: 34 }`。 |
| `clipboard` | 空 | 開始時剪貼簿中的文字。 |
| `colorScheme` | `"light"` | 系統的外觀：`"light"` 或 `"dark"`（`colorScheme()`、`dark:` 類別）。 |
| `locale` | `"en-US"` | 裝置的語系，為 BCP 47 標籤（`locale()`，`Intl` 的預設值）。 |
| `reducedMotion` | `false` | 使用者要求減少動態效果（`reduceMotion()`）。 |
| `platform` | `"ios"` | 無頭模式下應用程式所扮演的平台：`"ios"`、`"android"`，或桌面平台 `"macos"`、`"windows"`、`"linux"`，或以桌面慣用形式呈現的 `"web"`（`platform.os`、`ios={{…}}` / `android={{…}}` / `desktop={{…}}` 屬性、鍵盤快速鍵）。使用 `--target` 時，應用程式會以目標平台的身分執行：桌面的 `platform` 在任何桌面與網頁上一律以桌面身分執行（在瀏覽器中不論寬度皆採桌面慣用形式，`platform.os` 維持 `"web"`），`"ios"` 與 `"android"` 則各自以其本身身分執行。 |
| `clock` | 系統時鐘 | 手動時鐘，其時間只會隨測試推進而移動：`{}`，或使用 `{ time }` 從某個 `Date`（或自 Unix epoch 起算的毫秒數）開始。見[控制時間](#controlling-time)。 |
| `host` | 無 | 內嵌此應用程式之宿主應用程式的角色，由測試扮演：`{ params, handlers }`。見[扮演宿主應用程式](#playing-the-host-app)。 |

<a id="playing-the-host-app"></a>

### 扮演宿主應用程式

內嵌於原生應用程式中的應用程式，會透過 [`host`](../modules/nsh.md#host) 與其通訊。在測試中，由測試扮演宿主應用程式：`host.params` 提供應用程式在啟動時讀取的啟動參數，而 `host.handlers` 則依名稱回應應用程式的 `host.call`，並接收其 `host.post`。處理常式（handler）可以是一個值，用來回應每次呼叫，也可以是以呼叫資料為參數、回傳答案（或答案之 promise）的函式。函式所拋出的內容會使該呼叫被拒絕，如同宿主應用程式的錯誤一般。呼叫 `handlers` 未列出的名稱會失敗，就像在未處理任何呼叫的宿主應用程式中一樣。

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

`app.host.send(name, data)` 會送出事件，然後等待應用程式進入靜止狀態。`app.host.calls()` 與 `app.host.posts()` 會依序列出處理常式所收到的內容：`name` 與 `data`。

應用程式所開啟的 URL（[`openUrl`](../modules/nsh.md#openurl)、帶有 `links="open"` 的 `TextView` 連結）會被記錄下來，並回報給應用程式為已開啟，但本機上不會開啟任何內容。`app.openedUrls()` 會列出這些 URL：

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### 模擬網路

`network` 依 `"<METHOD> <URL>"` 列出路由（單純的 URL 視為 `GET`；`*` 可匹配任何文字）。沒有任何路由匹配的請求會失敗，因此測試絕不會在未經許可下連上網路。路由可以是一個回應，也可以是以請求為參數、回傳回應（或回應之 promise）的函式；在 Rust 中，`StubNetwork::new(routes)` 接受相同的路由，每個路由為 `StubResponse` 或 `StubRoute::Handler`：

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

| 回應成員 | 預設值 | 說明 |
|---|---|---|
| `status` | 200 | 狀態碼。 |
| `headers` | 無 | 標頭名稱與值。 |
| `body` | 空 | 字串，或以 JSON 送出的值（除非 `headers` 指定了其他類型，否則會加上 `content-type: application/json`）。 |
| `error` | 無 | 請求改以此訊息失敗，如同裝置離線時一樣。 |
| `delay` | 0 | 回應所需的時間，單位為毫秒；步驟不會等待它，`waitFor` 則會。在手動時鐘上，當時鐘越過該時間時回應才會到來。 |

路由的函式會取得請求（`method`、`url`、`headers`，以及文字形式的 `body`），並在測試檔中執行，因此它可以計算請求數量，或依據測試所設定的內容作答。拋出錯誤的函式會使該請求以及發出該請求的步驟失敗。`app.requests()` 會以相同方式依序列出應用程式發出的請求。

連線同樣保持在測試之內：除非 `network` 為 `"live"`，否則應用程式的 socket（`net`）與 WebSocket（全域的 `WebSocket` 與 `websocket` 模組）都不會開啟任何連線。在通過應用程式本身執行時的能力檢查之後，`net.connect` 與 `websocket` 模組的 `connect` 會以 `code` `ERR_NSH_TEST_NETWORK` 拒絕，而全域的 `WebSocket` 會觸發 `error`，接著是 `close`（1006，非正常關閉），就像網路拒絕了該連線一樣。使用 `"live"` 時，它們會連同應用程式的請求一起連上真實網路。在 Rust 中，`EngineConfig::refuse_connections` 對 `Headless` 應用程式也有相同作用：它是以應用程式所連線的對象（WebSocket 的 URL、socket 的 `host:port`）為參數的函式，回傳該呼叫失敗時所用的錯誤。

<a id="controlling-time"></a>

### 控制時間

在系統時鐘上，應用程式的計時器與原生動畫所需的時間與在裝置上相同，等待它們的測試也是如此。使用手動時鐘（Rust 中的 `EngineConfig::clock`，TypeScript 中 `open` 的 `clock`）時，應用程式會在一個時間只隨測試推進而移動的時鐘上執行，且會立即完成，就像 Jest 的假計時器或 Playwright 的 `page.clock` 一樣。`app.clock` 即該時鐘，而當應用程式在系統時鐘上執行時則為 `null`：

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

回應帶有 `delay` 的 `StubNetwork` 會隨手動時鐘而動，前提是使用 `.with_clock(clock.clone())`。以下步驟屬於 `nsh test`；`Headless` 也具備其中每一個（`run_for`、`fast_forward`、`set_system_time`）。

| 步驟 | 說明 |
|---|---|
| `await app.clock.runFor(ms)` | 將時鐘推進 `ms` 毫秒，一次一個顯示幀。計時器、`requestAnimationFrame`、原生動畫與延遲的回應會在到期時依序執行，各自在其時間點執行。在應用程式進入靜止狀態後 resolve。 |
| `await app.clock.fastForward(ms)` | 一次將時鐘推進 `ms` 毫秒，如同裝置從睡眠中喚醒：期間到期的計時器各執行一次。 |
| `app.clock.setSystemTime(time)` | 將牆上時間（`Date.now()`、`new Date()`）設為某個 `Date` 或毫秒數，不會移動任何計時器。 |

`Date`、`performance.now()` 與 `Intl` 的預設日期會隨時鐘而動。步驟會完成正在執行的工作，但不等待它：當應用程式要求顯示幀或有原生動畫正在執行時，顯示幀會一幀接著一幀到來，在時鐘上每幀相隔一個幀的時間（1/60 秒）。300 毫秒的轉場只需幾毫秒，而在其期間到期的計時器也會執行。永遠循環的動畫（例如載入動畫）會隨時鐘執行：它隨著測試推進時鐘而轉動。`app.wait(ms)` 與長按會依其所需時間推進時鐘。較晚才到期的計時器，只有在測試將時鐘推進到該時間時才會執行。`waitFor` 與 `waitUntil` 在等待期間會推進時鐘，一次一個顯示幀，並在每幀之後檢查，因此計時器所顯示的內容會在它們等待時很快出現：`waitFor("Saved", { timeout: 15_000 })` 最多會將時鐘推進十五秒。它們的逾時在兩個時鐘上同時計算：等待最多會將應用程式的時鐘推進該時間，並在經過同樣多的真實時間後拒絕，因此來自應用程式外部的內容（路由的函式、網路）所擁有的時間與在系統時鐘上相同。展示庫（gallery）的測試即以此方式執行（`examples/gallery/tests`）：其中等待動畫的十二個測試只需 6 秒，而非 28 秒。
### Steps

步驟以**選擇器**來指定檢視，寫法與 Playwright 相同：

| Selector | Matches |
|---|---|
| `id:<testID>` | 具有該 `testID` 的檢視。 |
| `label:<label>` | 具有該 `accessibilityLabel` 的檢視。 |
| `text:<text>` | 內容為該文字的文字（忽略前後空白）、可接受按壓的文字中的一段範圍（巢狀的 `<Text onPress>`、`TextView` 的連結），或內容為該文字的輸入框；輸入框為空時，則是 placeholder 為該文字者。 |
| `role:<role>`, `role:<role>[<name>]` | 具有該 `role`（`role:button`）且名稱相符的檢視：名稱取其標籤，否則取其內的文字（`role:button[Save]`）。 |
| `view:<id>` | 在 `--trace` 輸出中具有該 id 的檢視。 |
| 其他任何內容 | 依原樣先視為 `testID`，否則視為標籤，再否則視為文字。 |

以小寫單字加冒號開頭的部分會被視為前綴（`id`、`label`、`role`、`text`、`view`），因此 `tapped: solo` 是會列出這些前綴的步驟錯誤。若文字、標籤或 test id 本身以這種形式開頭，則需加上前綴，該前綴會將其餘部分依原樣讀取：`text:tapped: solo`、`label:note: draft`、`id:row:2`。新增前綴時，選擇器的既有意義不變。

`label:`、`text:` 與 role 的名稱也可使用正規表示式：`text:/^Buy/i`，語法採用 Rust 的 `regex` crate（JavaScript 的字元類別、群組、錨點與量詞，以線性時間比對；旗標 `i`、`m` 與 `s`）。` >> ` 會在前一個部分所比對到的範圍內查找（`id:cart >> role:button[Remove]`），而 `nth=<n>` 會保留其中一個比對結果，從 0 起算（`text:Delete >> nth=1`）。選擇器會找出使用者最先會看到的檢視：先在最上層的 modal 中，其次是螢幕上，而導覽堆疊則只看最上層的畫面。它比對的是使用者看得到的內容：具有面積、位於 `visibility: hidden` 之外、在視窗以及裁切它們的檢視範圍之內的檢視（`overflow: hidden`），或位於使用者可捲動的捲動檢視內容中任何位置的檢視，捲動時便會將其帶入（`opacity` 與 transform 除外，與 Playwright 相同）。對檢視執行操作的步驟（`press`、`type`、`clear`、`submit`、`scroll`、`longPress`）必須恰好對應一個檢視：選擇器比對到多個時該步驟會失敗，錯誤訊息會說明如何縮小範圍。

| Step | Description |
|---|---|
| `await app.press(selector)` | 按壓該檢視，或其周圍最近、會接收按壓的檢視（例如文字外圍的按鈕）：`onPressDown`、`onPressUp`、`onPress`，其中包含手指落下與抬起，周圍監聽觸控的檢視會收到這些事件（例如覆蓋層的 `onPressOutside`）。文字中的一段範圍會在其字元上被按壓（`await app.press("Privacy policy")`），於 headless 模式以及 iOS、Android 與桌面平台皆然。同一檢視在 500 ms 內第二次按壓即為第二次點擊（`clicks: 2`，雙擊），計算方式依各平台而定。若檢視已停用則 reject。 |
| `await app.longPress(selector)` | 將手指按住該檢視（或其周圍最近、會接收按壓或觸控的檢視），時間為其 `delayLongPress`（500 ms）：`onPressDown`、`onLongPress`、`onPressUp`；之後不會接著觸發 `onPress`。觸控的處理常式會收到該手指（`ContextMenu` 或 `Tooltip` 會開啟）。 |
| `await app.clear(selector)` | 清空輸入框，效果等同全選後刪除。 |
| `await app.type(selector, text)` | 在輸入框（或檢視內的第一個輸入框；`text:` 也會比對輸入框的文字或 placeholder）目前內容的結尾逐鍵輸入：先取得焦點，然後每個字元各觸發一次 `onKeyPress` 與 `onChange`，於 `maxLength` 之內。單行輸入框中的 `\n` 即為 return 鍵。 |
| `await app.submit(selector)` | 在輸入框中按下 return 鍵，行為依其 `submitBehavior` 而定：`onSubmit`（且單行輸入框會失去焦點），多行輸入框則插入換行。 |
| `await app.scroll(selector, distance)` | 沿其軸向將捲動檢視或清單（該檢視、其外圍的檢視，或其內第一個）拖曳 `distance` 點，每個影格 10 點，範圍限於其內容之內，與使用者的操作相同（`scrollable`）。負值則往回捲動。 |
| `await app.hover(selector)` | 將滑鼠移到檢視中央上方：其下方、滑鼠剛離開的檢視會收到 `onMouseLeave`，滑鼠剛移入的檢視會收到 `onMouseEnter` 並套用其 `hover:` 樣式，監聽的檢視會收到 `onMouseMove`，內含滑鼠位置且沒有按下任何按鈕。適用於桌面平台與任何寬度的 web，包含手機版面配置的瀏覽器（headless：桌面或 `"web"` `platform`）；iOS 或 Android 手機沒有滑鼠：在其上會 reject。 |
| `await app.rightClick(selector)` | 在檢視中央使用滑鼠的次要按鈕：該檢視或其周圍最近、正在監聽的檢視會收到 `onContextMenu`。適用於桌面平台與 web（headless：桌面 `platform`）；手機沒有滑鼠：在其上會 reject。 |
| `await app.paste(selector, { text?, html?, files?, uris? })` | 如同使用者在剪貼簿有該內容時貼上到輸入框：它會取得焦點並收到 `onPaste`（`html` 為保留格式的相同內容，`files` 為路徑，其位元組會以 `File` 取得，`uris` `file:` 為 URL），之後其文字依 `pasteBehavior` 所述放入。適用於 headless、macOS、iOS 與 web；機器的剪貼簿保持原狀。 |
| `app.menu()` | 應用程式所顯示內容選單（`Menu.popup`）的動作：`label`（子選單的項目接在其本身之後，`"Share > Mail"`）、`disabled`，以及可勾選項目的 `checked`；沒有開啟的選單時為 `null`。 |
| `await app.chooseMenuItem(label)` | 選擇已開啟內容選單中的動作，如同點擊該項目：應用程式會收到 `onMenu`（其 `onSelect` 會執行），然後選單關閉。項目已停用或不存在時 reject。 |
| `await app.closeMenu()` | 不選任何項目就關閉已開啟的內容選單，如同按下 Escape。 |
| `await app.keyboard.press(keys)` | 透過實體鍵盤按下一個按鍵及其修飾鍵，按鍵名稱依 `keymap`（`"mod+k"`、`"shift+/"`、`"escape"`；`mod` 為該平台的 command 鍵），所有平台皆可（手機與平板也有實體鍵盤）：首先由應用程式對應的快速鍵接收（`keymap.bind`、`onKeyCommand`）；否則在 macOS 與 web 上，Tab 與 Shift+Tab 會在輸入框與可接收按壓的檢視（`onFocus`、`onBlur`、`focus:` 樣式）之間移動鍵盤焦點，Return 或 Space 會按壓目前焦點所在的檢視；否則由取得焦點的輸入框接收字元、Backspace 或 return 鍵；再否則 Escape 會返回上一頁。 |
| `await app.keyboard.down(keys)` / `up(keys)` | 按住修飾鍵（`"mod"`、`"shift"`、`"alt"`、`"ctrl"`、`"meta"`，以 `+` 連接）直到 `up`：期間的按壓、拖曳與懸停都會帶有這些修飾鍵，如同 Mod-click 或 Shift-drag。目前僅支援 headless 與 Linux。 |
| `await app.dragAndHold(selector, by)` / `app.drop()` | 如同 `drag` 般拖曳，並讓手指保持按下，直到 `drop()` 在當下位置將其抬起：兩者之間的步驟可檢視拖曳中途的畫面（拖曳預覽、放置指示線）。目前僅支援 headless 與 Linux。 |
| `await app.dropFiles(selector, uris)` | 將本機檔案（`file:` URL，如同檔案管理員拖曳）放到檢視中央：該檢視或其周圍最近、正在監聽的檢視會收到 `onFileDrop`。目前支援桌面平台、headless 與 Linux。 |
| `await app.drag(selector, { x, y })` | 手指落在檢視中央，停留 100 ms，移動 `x`、`y` 點，每個影格 10 點，然後抬起，如同平台輸入的處理方式：平移手勢隨之觸發（`pan={{ x, y }}`、`onPanStart`、`onPanEnd` 帶有放開時的速度），監聽觸控的檢視會收到它（`onTouchStart`、`PanResponder`），捲動檢視會隨之捲動，若從頂端下拉得夠遠則會重新整理（`onRefresh`），其下方的按壓一旦移開便會取消。在桌面平台與 web 上則是滑鼠。 |
| `await app.wait(ms)` | 讓應用程式執行 `ms` 毫秒：計時器、動畫、請求。使用手動時鐘時，則將時鐘前進 `ms`（`app.clock.runFor`）。 |
| `await app.waitFor(selector, options?)` | 當有檢視相符時 resolve，或在沒有任何檢視相符時以 `{ state: "gone" }` resolve；`timeout` ms（5000）後 reject。使用手動時鐘時，等待期間每次前進一個顯示影格，最多前進 `timeout`。 |
| `await app.waitUntil(condition, options?)` | 當 `condition()` 回傳 true 時 resolve，並在應用程式每次變更後重新檢查：用於選擇器無法表達的情況（`() => app.storage().note === "Milk"`）。使用手動時鐘時，兩次檢查之間前進一個顯示影格，最多前進 `timeout`。 |
| `app.shows(selector)` | 目前是否有檢視相符。 |
| `app.count(selector)` | 目前有多少檢視相符。 |
| `app.enabled(selector)` | 檢視是否接受輸入：它與其周圍的檢視皆未停用，且輸入框不是 `readonly`。 |
| `app.texts()` | 目前螢幕上的文字，依序排列。 |
| `app.value(selector)` | 輸入框的文字，沒有相符者時為 `null`。 |
| `app.spanStyle(selector)` | 第一個相符字元的解析後樣式，適用於 headless 與每個 `--target`：`color`、選用的 `backgroundColor`、`fontSize`、`fontWeight`、`italic`、`underline` 以及 `lineThrough`。顏色為 `#rrggbbaa`；大小單位為點。 |
| `app.storage()` | 應用程式儲存空間目前的內容。 |
| `await app.back()` | 如同使用者操作般返回（標頭的返回按鈕、將 sheet 向下滑動）：最新 modal 中最內層的堆疊，否則為畫面的堆疊，會彈出其最上層畫面（`onDismiss`），若其具有 `preventBack` 則詢問它（`onBackRequest`）；若沒有，最新的 modal 會請求關閉（`onRequestClose`）。無處可返回時 reject。 |
| `app.onDialog(handler)` | 回應應用程式此後顯示的對話框（`Alert.alert`、action sheet）：`handler` 會收到該對話框（`title`、`message`、`buttons`、`cancelable`、`sheet`），並回傳要按下的按鈕文字，或回傳 `null` 以不按任何按鈕直接關閉。 |
| `app.dialogs()` | 應用程式曾顯示的對話框，依序排列。 |
| `app.onPick(handler)` | 回應應用程式此後要求的選取（`Picker.pickImages`）：`handler` 會收到選取的要求內容（`multiple`、`limit`、`maxDimension`、`quality`、`format`），並回傳使用者選取的檔案（`{ name, type?, data: Uint8Array }`，原樣交給應用程式），或回傳 `null` 以取消。沒有處理常式時，選取一律取消。僅限 headless 執行。 |
| `app.picks()` | 應用程式曾要求的選取，依序排列。 |
| `app.hear(text)` | 使用者對執行中的語音工作階段說出 `text`（`Speech.start`）：其 `result` 會將 `text` 回報為目前為止的完整逐字稿。僅限 headless 執行。 |
| `app.endSpeech(error?)` | 結束執行中的語音工作階段：帶有 `error`（`"no-speech"`、`"network"`、...）時會失敗，否則會送出最後一個最終結果與 `end`，若什麼都沒聽到則為 `no-speech`。僅限 headless 執行。 |
| `app.speechRequests()` | 應用程式啟動過的語音工作階段，依序排列：`lang`（`null` 表示使用者的）與 `interim`。 |
| `app.clipboard()` | 剪貼簿目前的文字，沒有文字時為 `null`。 |
| `app.requests()` | 應用程式發出的請求，依序排列：`method`、`url`、`headers`、`body`。 |
| `await app.host.send(name, data?)` | 向應用程式送出宿主應用程式的事件（`host.on`），然後等到畫面靜止為止。請參閱[扮演宿主應用程式](#playing-the-host-app)。 |
| `app.host.calls()`, `app.host.posts()` | 應用程式對 `open` 的 `host.handlers` 所發出的呼叫與 post，依序排列：`name`、`data`。 |
| `app.openedUrls()` | 應用程式開啟的 URL（`openUrl`），依序排列：僅記錄，不會真的開啟。 |
| `await app.setViewport(width, height)` | 調整 viewport 大小，如同旋轉裝置或調整視窗大小（`windowSize()`）。 |
| `await app.setColorScheme(scheme)` | 如同使用者操作般，將系統外觀切換為 `"light"` 或 `"dark"`。 |
| `await app.setLifecycle(state)` | 將應用程式切換至 `"background"`、`"inactive"` 或 `"active"`，如同使用者離開應用程式、切換到其他應用程式或視窗再回來時系統所做的（`lifecycle()`）。僅限 headless 執行。 |
| `await app.screenshot(path?)` | 應用程式視窗的 PNG 圖片（`Uint8Array`），若有指定，也會儲存在本機的 `path`（相對於目前目錄）。只有真實平台會繪製應用程式：請參閱[在真實平台上](#on-a-real-platform)。 |

當應用程式連續 100 ms 沒有渲染任何內容，且沒有會自行結束的原生動畫在執行時，步驟便會 resolve（對於持續渲染的應用程式最多 2 秒；使用手動時鐘時，則為應用程式時間的 2 秒），因此下一行執行時，它所造成的變更已顯示在螢幕上；對於之後才會發生的事（回應、計時器），請使用 `waitFor`。使用手動時鐘時，步驟不會等待那 100 ms：只要應用程式已執行完該步驟與時鐘時間所觸發的一切（到期的計時器、promise、立即回應的 stub 回應），且不再需要影格，就會立即 resolve，除非仍有請求在進行中，因此使用手動時鐘的測試在步驟之間不會有停頓。由其他執行緒回應的內容（`nsh/host` 呼叫、檔案讀取、Rust 工作在執行緒上的結果）會在步驟 resolve 之後才到達：請使用 `waitFor` 等待其所顯示的內容。永遠循環的動畫，例如載入中的旋轉圖示，會在步驟與 `waitFor` 持續進行時於背景一直執行，如同瀏覽器測試中的無限 CSS 動畫。當沒有任何檢視符合步驟的選擇器（錯誤訊息會列出螢幕上的文字）、應用程式在期間擲出例外，或應用程式要求了只有真實平台才能回答的內容時，步驟會 reject 並使測試失敗。

測試可預期的失敗都帶有 `code`，其值保持不變；訊息是給人看的，可能會變動，因此測試應比對代碼：

| `code` | 步驟或查詢 |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | 螢幕上沒有任何檢視符合該選擇器，或開啟的選單沒有這個項目。 |
| `ERR_NSH_TEST_DISABLED` | 選擇器所指的檢視已停用（使用者無法捲動的捲動檢視、已停用的選單項目）。 |
| `ETIMEDOUT` | `waitFor` 或 `waitUntil` 逾時，或應用程式在 `open` 之後沒有渲染任何內容。 |
| `ERR_NSH_TEST_NO_BACK` | `back()` 找不到可返回的來源。 |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` 搭配 `--target` 時，收到目標平台無法支援的選項：iOS 與 Android 上的 `width` 或 `height`，桌面或 web 上手機的 `platform`，iOS 或 Android 上桌面或另一種手機的選項，`host.handlers`。訊息會指出該選項。 |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` 會讀取巢狀的 `<Text testID="guide">`；`text:word` 會讀取該比對結果的第一個字元。請以 `id:note >> text:word` 限定查詢範圍，並以 `>> nth=0` 選取重複的比對結果。當範圍不存在、有歧義或為空時，查詢會回報錯誤。更新範圍的 `testID` 時會重用其文字排版，並保留 `onTextLayout` 回呼的次數。
<a id="what-headless-runs-play-of-the-platform"></a>

### 無頭執行扮演平台的哪些部分

無頭執行擁有真正的 runtime，但沒有平台。它扮演 NSH 協定所定義的平台角色，而不做只有真正平台才能做的事：

- **原生動畫會逐幀執行**直到結束：`start(callback)` 回呼會執行，等待這些回呼的內容也會執行。沒有終點的循環動畫會一直執行，直到 app 停止它們。
- **返回**會如同平台一般彈出畫面並關閉 modal（`app.back()`）。
- **對話框會被回應**：先由測試的 `onDialog` 回應，否則按其取消按鈕，否則在可關閉時直接關閉；若對話框只能由其他按鈕回應，則顯示該對話框的步驟會失敗，直到測試指明要按哪一個。
- **剪貼簿存放文字**：app 複製的內容，會在貼上時讀回（`clipboard` 可先放入一些內容）。
- **頁面的 host 會回應 `host`**，前提是 app 的 `nsh.json` 在 `web.host` 中指名了一個（[頁面的 host](#the-pages-host)）。
- **app 在其 capabilities 之下執行**：其 `nsh.json` 在 `capabilities` 中宣告的內容會如同在裝置上一樣被強制執行，因此未宣告的內容會被拒絕。
- **URL 會被記錄**：app 開啟的內容會被回報為已開啟，並由 `app.openedUrls()` 列出。
- **選取會被回應**：以測試提供的檔案（`onPick`）回應，否則視為取消，因此 `Picker.pickImages` 會 resolve 為 `[]`。
- **語音由測試提供**：`Speech.available()` 會 resolve 為 `true`，session 會立即開始，並聽到 `hear` 所說的內容。
- **Modal 立即顯示**：modal 被呈現時會觸發 `onShow`。
- **不載入圖片**：不會觸發 `onLoad` 或 `onError`，`Image.getSize` 與 `Image.prefetch` 會 reject。
- **只有真正平台才能回應的操作會使步驟失敗**：例如剪貼簿上的圖片或檔案。

<a id="the-pages-host"></a>

### 頁面的 host

發佈到網頁上的 app 會從其頁面取得 host：`nsh.json` `web.host`，這是一個匯出 `createHost(player)` 的模組（[Web](./web.md#the-hosts-functions)）。無頭執行會在 app 啟動之前，為測試開啟的每個 app 載入該模組，並放在它自己的 JavaScript context 中（有計時器與 `console`，沒有任何瀏覽器的功能，也沒有 import）：其 `call` 會回應 app 的 [`host.call`](../modules/nsh.md#host)，其 `player.hostEvent` 會傳到 `host.on`，而 `host.available()` 是 `true`。若 `call` 拋出例外、reject，或回傳不是 JSON 的內容，app 的呼叫就會以其訊息 reject，與在頁面上相同；在 app 啟動之前送出的事件，會在 app 啟動後傳到其最上層的監聽器。`--web-host <module>` 可指定另一個模組。app 的 `capabilities.host` 必須列出其所呼叫的內容，與在頁面上相同。呼叫的逾時與 host 自己的計時器依 app 的時間執行，因此手動時鐘可以推動它們（`app.clock.runFor`）。在瀏覽器中（`--target web`），開發頁面會如同已發佈的頁面一樣，為每個 app 執行 `nsh.json` 的 `web.host`；在其他平台上（`--target`），app 沒有 host：`host.available()` 是 `false`。

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` 包含一個 app、它的 host 以及它們的測試。

### Expectations

`expect(value)` 如同 Jest 一般檢查值，並依 JS 的方式處理：`toBe` 是 `Object.is`，`toEqual` 逐一比較成員，而 `Date`、`Map` 或 `Uint8Array` 則依其本身的型別比較。每個檢查在不成立時都會拋出例外。`.not` 會將它們反轉：`expect(app.texts()).not.toContain("Error")`。若傳入的是函式，`toThrow` 會檢查呼叫它時所拋出的內容；若傳入的是 promise，或回傳 promise 的函式，`rejects` 與 `resolves` 會如同在 Jest 中一樣檢查它最終的結果：`await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`。

| 檢查 | 成立條件 |
|---|---|
| `toBe(expected)` | 值為 `expected`，依 `Object.is` 的定義：相同的原始值（`NaN` 是 `NaN`，`0` 不是 `-0`）或相同的物件。 |
| `toEqual(expected)` | 值逐一成員地等於 `expected`，如同 Jest 的 `toEqual`：物件以其自身可列舉的屬性比較（值為 `undefined` 的屬性視為不存在），陣列逐項比較，日期以其時間比較，正規表示式以 source 與 flags 比較，map 與 set 以其項目比較（不計順序），`ArrayBuffer` 與 typed array 以其位元組比較，錯誤以名稱與訊息比較；`NaN` 等於 `NaN`。類別的實例等於具有相同屬性的一般物件。 |
| `toMatchObject(subset)` | 值具有 `subset` 的每一個屬性，且各自依 `toEqual` 的定義相等，其中的物件則依序同樣進行比對；其他屬性不會被檢視，而陣列則逐項比對，且需全部符合。 |
| `toContain(item)` | 陣列、`Set`、typed array 或其他 iterable 包含 `item`（`===`），或字串包含它。 |
| `toContainEqual(item)` | 陣列、`Set` 或其他 iterable 包含一個依 `toEqual` 的定義等於 `item` 的項目。 |
| `toBeTruthy()`、`toBeFalsy()` | 值依 JS 的判斷為 truthy / falsy。 |
| `toMatch(pattern)` | 字串包含 `pattern`（一個字串），或符合它（一個 `RegExp`，由 JS 引擎執行：look-behind、反向參照與具名群組的行為與 JavaScript 相同）。 |
| `toHaveLength(n)` | 值的 `length` 為 `n`：字串為其 UTF-16 單元，陣列或 typed array 為其項目。 |
| `toBeNull()` | 值為 `null`。 |
| `toBeUndefined()`、`toBeDefined()` | 值為 `undefined` / 其他任何值。 |
| `toBeNaN()` | 值為 `NaN`。 |
| `toBeGreaterThan(n)`、`toBeGreaterThanOrEqual(n)`、`toBeLessThan(n)`、`toBeLessThanOrEqual(n)` | 數字與 `n` 有如此的比較關係。 |
| `toThrow(expected?)` | `expect(fn)`：呼叫 `fn` 會拋出例外。若給定 `expected`，則錯誤須符合它：其訊息包含某個字串或符合某個 `RegExp`；錯誤類別（`TypeError`，或 app 自己的類別）為該錯誤的 `name`，而 `Error` 符合每一種錯誤；錯誤具有相同的訊息。 |
| `rejects.toThrow(expected?)` | `expect(promise)`：promise reject，且其錯誤依 `toThrow` 的定義符合 `expected`。 |
| `rejects.toMatchObject(subset)` | `expect(promise)`：promise 以一個值 reject，該值依 `toMatchObject` 的定義符合 `subset`：錯誤自身的屬性（`code`、`permission`……）連同其 `name` 與 `message`。 |
| `resolves.toBe(expected)`、`resolves.toEqual(expected)`、`resolves.toMatchObject(subset)` | `expect(promise)`：promise resolve 為一個符合該檢查的值。 |

檢查失敗時，會以 JS 的寫法顯示它得到的值與預期的值：`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`。

`rejects` 與 `resolves` 也有各自的 `.not`：`await expect(load()).resolves.not.toBe(null)`。

<a id="on-a-real-platform"></a>

### 在真實平台上

`nsh test --target macos`（或 `linux`、`windows`、`gpui`、`web`、`ios`、`android`）會在該平台的開發 host 上執行相同的測試，而不是無頭執行：每個 `open` 都會在各自的視窗中啟動 app，並使用全新的資料目錄，各步驟則如同 Playwright 在瀏覽器中一般，以平台自己的輸入操作其 selector 所指名的 view：

- 點按是在 view 中央的一次點擊，長按是按住的點擊，`type` 會點擊輸入框並輸入其按鍵，`scroll` 是在 scroll view 上的觸控板手勢，`back` 則是使用者會做的操作（macOS 與 Linux 上是 Escape，Windows 與 GPUI 中是滑鼠的返回鍵，網頁上是瀏覽器的返回鈕，sheet 則是向下滑動；在 iOS 上，當選單、popover 或 `Sheet` 開啟時是 VoiceOver 的 escape 手勢，否則是標頭的返回鈕；在 Android 上是返回鍵）；
- 螢幕外的 view 會先被捲動到可見範圍，一次一個手勢；在觸控螢幕上，手指會落在頁面本身承接它的位置，避開會跟隨拖曳的 view（滑桿、繪圖區域），如同使用者捲動時一樣；
- selector、等待與查詢所看到的 app 模型與無頭執行相同，由 host 所繪製的內容建立，因此會找到相同的 view；
- 對話框是平台自己的：`app.dialogs()` 會讀取它們，而回應其中一個（`onDialog`，或在測試未指定時按其取消按鈕）會按下它的按鈕；
- `app.screenshot(path)` 會為視窗拍照。

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

視窗會以 viewport 的大小開啟（390 × 844，除非 `open` 另有指定），並限制在螢幕範圍內；在 iOS 與 Android 上，app 會填滿裝置的螢幕，大小即為裝置的大小。app 會以目標的平台身分執行（`platform.os`）。手動 `clock` 的運作與無頭執行相同：`app.clock.runFor`、`fastForward` 與 `setSystemTime` 會立即推動 app 的時間（計時器、相隔一幀的 `requestAnimationFrame`、`Date`），`app.wait(ms)`、`waitFor` 與 `waitUntil` 也會推動它，而平台顯示的每一幀都會讓它前進一幀（1/60 秒），因此 app 的時間會在它播放動畫時流逝。平台自己的動畫與路由的 `delay` 則耗費真實時間。app 的請求會如同無頭執行一般來到測試：`network` 路由會回應它們，沒有任何路由符合的請求會失敗，而 `"live"` 會讓它們通過並連到 host 的網路；`app.requests()` 會列出全部請求。Socket 與 WebSocket 在有 `"live"` 時會連到 host 的網路，否則與無頭執行相同而被拒絕。`storage` 在 app 啟動時就位於 app 的 storage 中，而 `app.storage()` 會從 app 讀取它。`locale`、`reducedMotion` 與 `safeArea`，在 `open` 提供它們時（包含預設值），會保存平台所回報的任何值，而它提供的 `colorScheme` 會切換系統的外觀（`"light"` 也一樣）；它省略的部分則由平台決定；app 對剪貼簿的呼叫由測試自己的剪貼簿提供服務（`clipboard` 起初是其文字，`app.clipboard()` 會讀取它），因此機器的剪貼簿會維持原樣；文字輸入框自己的複製與貼上則使用系統的剪貼簿。`host.params` 會傳到 app，`app.host.send` 會傳送事件，而 app 開啟的 URL 會被記錄給 `app.openedUrls()`，而不會真的被開啟。`host.handlers` 以無頭方式執行，由測試回應 app 的呼叫。`open` 會依目標檢查其選項：在 iOS 與 Android 上，`width` 與 `height`，另一種裝置類型的 `platform`（在桌面或網頁上使用手機的，在 iOS 或 Android 上使用桌面的或另一種手機的）以及 `host.handlers` 會以 `ERR_NSH_TEST_UNSUPPORTED` reject，因此測試會依其寫法執行，或明確表示它需要什麼。桌面的 `platform`（`"macos"` 用於桌面的滑鼠與按鍵）會在每個桌面目標與網頁上執行，以該目標的平台身分，且一律作為桌面：在瀏覽器中，頁面無論寬度多少都會以桌面慣用形式啟動，而在沒有 `platform` 時（或使用 `"web"` 時），它會如同瀏覽器一般衡量其慣用形式（寬度 600 點起為桌面）。具有自己 Rust crate 的 app，會在以其 crate 建置的開發 host 中執行，這些 crate 由 NSH 為該平台建置；Rust app 的 host 會執行其 root，因此 `open(".")` 在那裡啟動它的方式與無頭執行相同。

在網頁上，app 會在開發 host 的頁面中，於無頭的 Chrome、Edge 或 Chromium 中執行：使用這台機器上安裝的瀏覽器，或 `--browser <PATH>` 所指名的可執行檔（需要有瀏覽器：找不到時，`nsh test` 會說明它找過哪些位置）。一次執行共用一個瀏覽器，而每個 `open` 會取得一個擁有自己 storage 的頁面。輸入是瀏覽器受信任的輸入，如同使用者所為：滑鼠點擊、滾輪捲動與按鍵。

在 iOS 上，app 會在 iOS 模擬器中的開發 host 內執行：使用已啟動的那一個，否則使用最新的 iPhone，由 `nsh test` 啟動。各步驟是手指的觸控與軟體鍵盤的輸入，如同 UIKit 從裝置取得它們一樣。`setColorScheme` 會切換模擬器的外觀，並由 `nsh test` 在 app 結束後還原，而螢幕的大小與模擬裝置相同。

在 Android 上，app 會在開發 host 中，於 `adb devices` 所列出的第一個裝置或模擬器上執行，並擁有自己的 storage。各步驟是手指的觸控與鍵盤的按鍵，如同 app 的 view 從裝置取得它們一樣；`back` 是系統的返回。`setColorScheme` 會切換裝置的深色主題，並由 `nsh test` 在 app 結束後還原。

<a id="steps-from-standard-input"></a>

### 來自標準輸入的步驟

若給定的是 app 的進入點而不是測試，`nsh test` 會在真實網路上開啟 app，讓它執行 1.2 秒，然後接受標準輸入所給的步驟，並以 `app` 結束 app：

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

這 1.2 秒會讓引擎的閒置垃圾回收在第一個步驟之前執行，因此若 app 放掉了仍在使用的東西，就會顯現出來：它的處理常式會停止運作。

這些範例附有可作為起點的測試：Rust app 有 `examples/gallery-rs`（`cargo test`，每個 demo 一個模組，以及 `App.test.tsx`），具有 Rust crate 的 app 有 `examples/rust-exports`，TSX app 有 `examples/counter` 與 `examples/gallery/tests`（storage、輸入、長列表、stub 的請求、深色模式、手動時鐘）。

<a id="tracing-with---trace"></a>

## 使用 --trace 追蹤

`--trace` 會在測試開啟的 app 中，於每個 mount batch 所來自的步驟之下印出該 batch，並印出每次 commit 的時間。在 Rust 中，測試會印出相同的內容：`observe` 會把每個 batch 連同其步驟交給它，而 `EngineConfig::trace` 會透過 `log` crate 記錄 `perf` 行（target 為 `nsh::perf`；請在測試中安裝如 `env_logger` 之類的 logger）：

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` 可用於測試檔案的 `--trace`，或用於 app 的進入點並以標準輸入提供步驟：

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

使用 `--target` 時，追蹤的內容來自平台：包含 host 套用的 batch 及帶來它們的步驟，以及 host 自己在裝置硬體上對每次 commit 與事件所量得的時間。

用它可以：

- 檢查 app（或 demo）是否能無誤地建置、評估與繪製；
- 精確看出某項變更會建立、移動或更新哪些原生 view，以及數量多少；
- 衡量第一幀、一次點按以及每個捲動幀的成本；
- 在 CI 中抓出迴歸問題。
<a id="reading-the-output"></a>

### 讀取輸出

以下是搭配一次按下操作的計數器範例（`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`），已精簡：

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

#### 批次與掛載項目

每個 `── step: N items` 區塊都是一個**掛載批次（mount batch）**，列在觸發它的步驟之下：平台在一個影格內套用到原生 view 的所有內容，
只需一次跳轉到主執行緒。其中的各行是**掛載項目（mount items）**：

| 項目 | 意義 |
|---|---|
| `Create { id, kind }` | 建立原生 view（`View`、`Text`、`Image`、`Scroll` 等）。 |
| `Insert { parent, child, before }` | 將 view 放入其父層，位於某個同層節點之前（`None`：放在最後）。 |
| `Remove` / `Delete` | 將 view 從其父層分離／釋放。 |
| `ViewStyle { id, style }` | view 的裝飾：背景、邊框、圓角、陰影、不透明度、transform 等。 |
| `ViewProps { id, props }` | 觸控與無障礙設定，`testID`。 |
| `Events { id, events }` | view 回報哪些事件（`EventMask(1)` 表示按下）。 |
| `Frame { id, x, y, w, h }` | 其在父層中的位置與大小，單位為 point。 |
| `Text { id, text, content }` | 文字 view 已完成排版的文字。 |
| `Image { id, source, ... }` | 要載入的圖片。 |

只會傳送有變動的部分：一次只改變一個數字的點按，只會送出一個 `Text` 項目；view 不會有預設樣式，也不會有空的
事件遮罩；沒有變動的影格不會被送出。一個沒有顯示任何新列的捲動影格**完全不會產生批次**。

<a id="the-762-lines"></a>

#### `perf` 行

| 行 | 意義 |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | 打包時間與 bundle 大小（開發設定）。 |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | 一次提交（commit）：JS 排入佇列的操作、核心花費的時間（渲染元件、版面配置、diff）、JS 綁定列表資料列所花的時間、產生的掛載項目，以及仍存活的節點數。 |
| `turn: 2640µs (timers and tasks 1964µs)` | 一個完成提交的 turn：其總時間，以及在提交之前其 JS 計時器與 Rust 元件任務所花的時間（Rust 元件在提交時渲染）。 |
| `first frame: eval 271µs, total 1235µs` | 評估 bundle 的時間，以及從啟動到第一個批次的時間。 |
| `event Press on view 20` / `event js: 196µs` | 一個被分派的事件，以及其處理函式（及其引發的後續動作）在 JS 中所花的時間。 |

> [!NOTE]
> Headless 模式下，文字是以近似的文字引擎測量，因此文字尺寸與裝置上略有差異，裝置使用的是
> CoreText 或 Android 的文字排版。版面配置邏輯、view 數量與操作數量則完全相同。

單次執行的計時在很大程度上取決於 CPU 的時脈狀態（剛從閒置喚醒的機器會比較慢）。請在同一台機器上比較多次執行的結果，
查看多次執行中的最小值，並且相較於微秒數，更應信任操作與項目的計數。

<a id="scrolling"></a>

### 捲動

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` 以每秒 60 個影格、每個影格 10 point 的速度移動列表，並印出每個影格的批次：

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

對於[列表](./lists.md)，這能呈現虛擬化的實際運作：哪些影格綁定了新的資料列、每一列需要多少操作，
以及沒有顯示新列的影格不會產生任何內容。請搭配 release 建置使用（`cargo test --release`，或在 checkout 中使用 `./target/release/nsh`），才能得到有意義的
計時。

<a id="in-ci"></a>

### 在 CI 中

Headless 測試不需要裝置或顯示器，因此可在 Linux runner 上執行：Rust 應用程式的測試使用 `cargo test`，
而 `nsh test` 除了 CLI 之外不需要任何其他東西。任何失敗的測試都會讓兩者以非零代碼結束：包括
失敗的測試、無法建置或沒有渲染任何內容的應用程式，以及應用程式在某個步驟中擲出的例外。

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

（在 runner 上安裝 `nsh` CLI 的方式與在本機安裝相同；請參閱[安裝](./installation.md)。）

`--junit <FILE>` 也會將結果寫成 JUnit XML 報告，CI 服務（GitHub Actions 測試回報工具、
GitLab、Jenkins、Azure Pipelines）會依每個測試顯示：每個測試檔案一個 `testsuite`，每個測試一個 `testcase`，其中包含失敗的內容、
位置，以及畫面上的文字。

若要把關效能，請記錄幾個互動的項目數量（`── … : N items` 行，以及 `--trace` 的 `ops` /
`mount items` 數值），並在數量增加時讓測試失敗。計數是確定性的；而在共用的 CI 機器上，計時則不是。

> [!NOTE]
> 測試是在應用程式的 `nsh.json` 所宣告的 `capabilities` 之下執行，與在裝置上相同：應用程式未宣告的內容，
> 在測試中同樣會被拒絕。

<a id="784-for-ui-tests"></a>

## 用於 UI 測試的 `testID`

Headless 測試檢查的是執行階段所渲染的內容，其 `id:` 選擇器是依 test id 尋找 view。若要使用平台的測試工具（XCUITest、Espresso / UI Automator、Appium、Maestro）來驅動真正的
原生 UI，請為 view 設定 test id：
Rust 中使用 `.test_id(…)`，TSX 中使用 `testID`：

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

| 平台 | `testID` 對應的位置 |
|---|---|
| iOS | view 的 `accessibilityIdentifier`（XCUITest 中為 `app.otherElements["add-to-cart"]`）。 |
| Android | 無障礙節點的 view id 資源名稱（UI Automator 中為 `By.res("add-to-cart")`）。 |

在 Rust 中，test id 是每個元素的方法，包含元件的元素（`button().test_id("save")`，它
用來命名元件的根節點），並且 `testID` 是每個元素以及每個 Rust 元件的 prop（`Button`、`Dialog` 等）。它不會改變螢幕閱讀器
所朗讀的內容；請使用 `accessibilityLabel` 來達成該目的（請參閱[無障礙](./accessibility.md)）。在 `--trace` 輸出中，它會出現在
view 的 `ViewProps` 項目裡，形式為 `test_id: Some("add-to-cart")`。

<a id="see-also"></a>

## 另請參閱

- [效能](./performance.md)：在這些數字中該注意什麼
- [開發伺服器與除錯](./dev-server-and-debugging.md)
- [架構](./architecture.md)：操作、提交與掛載批次
