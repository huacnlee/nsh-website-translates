---
title: "測試"
description: "以無介面模式測試應用程式,可在 Rust 中使用 cargo test 和 nsh_testing,或在 TypeScript 中使用 nsh test:像使用者一樣開啟應用程式、按下、輸入、捲動和等待,模擬網絡與儲存功能,並讀取 --trace 輸出的原生視圖操作和耗時資料;UI 測試請使用 testID。"
order: 61
group: tools
source_hash: c0e7414002b92551
---


# 測試

NSH 以 **headless** 方式執行應用：使用真正的引擎（與裝置上相同的響應式圖、渲染器、元件、版面配置和列表虛擬化，並以 QuickJS 執行 TSX），以 60 Hz 產生顯示幀，但不需要模擬器、裝置或視窗。它可在 Cargo 或 CLI 能執行的任何地方運行，包括 Linux CI 機器，並承擔兩項工作：

- 執行測試：每個測試開啟應用，執行使用者會做的操作（按下、輸入、捲動），並檢查畫面上的內容。Rust 應用的測試以 Rust 編寫，由 `cargo test` 配合 `nsh-testing` crate 執行；以 TypeScript 編寫的測試由 `nsh test` 執行，TSX 應用和 Rust 應用均適用；
- 配合 `--trace`，列印 runtime 發送給原生視圖的每項操作及其耗時：即首幀、一次點按或一幀捲動的成本。

<a id="writing-tests"></a>

## 編寫測試

以下是同一個測試的 Rust 和 TypeScript 版本：它以空白的待辦事項清單作為儲存內容開啟應用，輸入文字、按下按鈕，並檢查畫面顯示的內容。

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

## 以 cargo test 進行 Rust 測試

Rust 應用的測試是其 crate 的整合測試，以 `nsh-engine` 和 `nsh-testing`（使用其預設 feature，不含 QuickJS）作為 dev-dependencies：

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` 是手機尺寸的引擎（390×844 點），不設定其他項目；它的欄位對應下文 `open` 的選項：`storage`（`MemoryStorage::new(entries)`）、`network`（`StubNetwork`，見下文）、`viewport`、`environment`（外觀、地區設定、減少動態效果）、`clock`（`Clock::manual(time)`，見下文）。`nsh_testing::Headless::start(config)` 會啟動應用，並維護其所顯示視圖的模型。它的步驟與下文 `nsh test` 的步驟相同，選擇器也相同，只是以 Rust 編寫：`press`、`long_press`、`clear`、`type_text`、`submit`、`scroll(selector, px(3000.0))`、`back`、`wait`、`wait_for`、`wait_for_gone`、`wait_until`、`run_for`、`fast_forward`、`set_system_time`、`set_viewport`、`set_clipboard` 和 `on_dialog`；`app.shows(text)` 和 `app.screen()`（`texts()`、`count(selector)`、`enabled(selector)`、`dialogs()`、`clipboard()`、`commands()`）用於讀取畫面上的內容。當步驟無法執行時，會傳回錯誤，並附上畫面上的文字。

`nsh_testing::tsx(entry, sets)`（feature `bundle`）以同樣方式開啟應用的 TSX 入口，並針對 NSH 和該 crate 的 UI 集合建置（[以 Rust 建置](./rust.md#testing)）。`examples/gallery-rs` 以這種方式測試其 Rust 根元件，每個示範一個模組；`examples/rust-exports` 則從 Rust 測試其 TSX 入口。

`nsh test` 也會執行這些測試：給定含有 Rust crate 的應用目錄（`nsh.json` `"rust"`），它會在執行測試檔案之前，為其中每個 crate 執行 `cargo test`，並把 Rust 測試與 TypeScript 測試（`✓ src/lib.rs › tests::adds`）一併顯示和計算在摘要及 `--junit` 報告中。因此，`nsh test` 是 Rust 應用、帶有 crate 的 TSX 應用和純 TSX 應用共用的單一指令，而 `nsh check` 同樣會在檢查 TypeScript 型別之前，先對各 crate 執行 `cargo check --all-targets`。

<a id="tests-with-nsh-test"></a>

## 以 nsh test 進行測試

測試檔案是放在程式碼旁邊的 `*.test.tsx` 或 `*.test.ts` 檔案。它會匯入 `nsh/test`，就像上文的 `App.test.tsx` 一樣：

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

測試失敗時，會顯示拋出的內容、在測試檔案中的位置，以及該測試所開啟應用的畫面文字。任何失敗都會令 `nsh test` 以非零代碼結束。`nsh init` 會建立含有該應用的 `App.test.tsx`，而 `nsh check` 會連同其餘檔案一併對測試檔案進行型別檢查（`.nsh/types` 宣告 `nsh/test`）。

每個測試檔案在各自的引擎上執行，其中的測試按順序逐一執行。`open` 會在另一個引擎上啟動應用，每次都是全新的引擎，因此測試之間不會共用狀態；測試開啟的應用會在測試結束時關閉。測試在拋出錯誤、所傳回的 promise 被 reject，或超出逾時時間後即告失敗：逾時時間為 30 秒，或由 `test` 的第三個參數指定的毫秒數（`test("syncs", body, 60_000)`）。自帶 Rust crate 的應用（`nsh.json` `"rust"`）會在 NSH 隨 crate 一併建置的 headless runner 中以相同方式執行測試；在 Rust 應用（`nsh.json` `"root"`，[以 Rust 建置](./rust.md)）中，`open(".")` 會啟動其根元件。

<a id="grouping-tests-and-setting-them-up"></a>

### 為測試分組及設定

`describe`、hooks 以及 `test` 的各種變體，運作方式與 Jest 相同：

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
| `describe(name, body)` | 為測試和 `body` 所宣告的區塊分組（宣告即時發生，即檔案載入時）：它們的名稱以 `name` 開頭（`the cart › starts empty`），其宣告的 hooks 只會在這些測試前後執行。區塊可以巢狀。 |
| `beforeEach(fn, timeout?)`、`afterEach(fn, timeout?)` | 在其所屬區塊（檔案或 `describe`）的每個測試之前／之後執行 `fn`：外層區塊的 `beforeEach` 先執行，內層區塊的 `afterEach` 先執行。失敗的 `beforeEach` 會令測試失敗；`afterEach` 無論如何都會執行。 |
| `beforeAll(fn, timeout?)`、`afterAll(fn, timeout?)` | 當區塊中有測試執行時，在其第一個測試之前和最後一個測試之後各執行一次 `fn`。失敗的 `beforeAll` 會令該區塊的測試失敗；失敗的 `afterAll` 會被報告為失敗的 `<block> › afterAll`。由 `beforeAll` 開啟的應用會在該區塊的測試期間保持開啟，並在其 `afterAll` 之後關閉。 |
| `test.skip(name, body, timeout?)`、`describe.skip(name, body)` | 宣告不會執行的測試或區塊：它們會被報告為已跳過。 |
| `test.only(name, body, timeout?)`、`describe.only(name, body)` | 當測試檔案中有這類宣告時，只會執行這些測試和區塊；檔案中的其他測試會被報告為已跳過。 |
| `test.todo(name)` | 尚待編寫的測試，會被報告為待辦。 |

hook 可以是 `async`；除非另行指定，其 `timeout` 為 30 秒。測試和 hooks 在檔案載入時宣告：在測試或 hook 內宣告測試會拋出錯誤。

<a id="opening-the-app"></a>

### 開啟應用

`open(entry, options?)` 會建置位於 `entry` 的應用（相對於測試檔案；每個入口在每次執行中只建置一次），以 390×844 的視窗啟動，並在渲染完成且靜止後 resolve。使用 `--target` 時，應用會按測試給定的選項執行：若目標平台無法支援其中某個選項，`open` 會以 `ERR_NSH_TEST_UNSUPPORTED` reject，並指出該選項（見[在真實平台上](#on-a-real-platform)）。

| 選項 | 預設值 | 說明 |
|---|---|---|
| `storage` | 空 | 開始時 `Storage` 所持有的內容：`{ todos: "[]" }`。 |
| `network` | 無 | 應用的請求按路由得到的回應：見[模擬網路](#stubbing-the-network)。`"live"`：其請求、socket 和 WebSocket 使用真實網路。 |
| `width`、`height` | 390、844 | 視窗大小（以點為單位）：headless 時為桌面視窗，網頁時為頁面。在 iOS 和 Android 上，應用會填滿裝置的螢幕。 |
| `safeArea` | 0 | 安全區域邊距（以點為單位）：`{ top: 47, bottom: 34 }`。 |
| `clipboard` | 空 | 開始時剪貼簿中的文字。 |
| `colorScheme` | `"light"` | 系統的外觀：`"light"` 或 `"dark"`（`colorScheme()`、`dark:` class）。 |
| `locale` | `"en-US"` | 裝置的地區設定，為 BCP 47 標籤（`locale()`，`Intl` 的預設值）。 |
| `reducedMotion` | `false` | 使用者要求減少動態效果（`reduceMotion()`）。 |
| `platform` | `"ios"` | 應用以 headless 方式執行時所扮演的平台：`"ios"`、`"android"`，或桌面平台 `"macos"`、`"windows"`、`"linux"`，又或採用桌面慣例的 `"web"`（`platform.os`、`ios={{…}}` / `android={{…}}` / `desktop={{…}}` props、鍵盤快速鍵）。使用 `--target` 時，應用會以目標平台運行：任何桌面平台上的桌面 `platform` 和網頁，一律以桌面方式運行（在瀏覽器中不論寬度均採用桌面慣例，`platform.os` 保持為 `"web"`），`"ios"` 和 `"android"` 則各自以其本身的平台運行。 |
| `clock` | 系統時鐘 | 手動時鐘，其時間只會隨測試推進而移動：`{}`，或以 `{ time }` 由某個 `Date`（或自 Unix epoch 起計的毫秒數）開始。見[控制時間](#controlling-time)。 |
| `host` | 無 | 由測試扮演的嵌入式應用部分：`{ params, handlers }`。見[扮演宿主應用](#playing-the-host-app)。 |

<a id="playing-the-host-app"></a>

### 扮演宿主應用

嵌入在原生應用中的應用，會透過 [`host`](../modules/nsh.md#host) 與原生應用溝通。在測試中，由測試扮演宿主應用：`host.params` 提供應用在啟動時讀取的啟動參數，而 `host.handlers` 按名稱回應應用的 `host.call` 並接收其 `host.post`。handler 可以是一個值，用來回應每次呼叫；也可以是一個以呼叫資料為參數、傳回回應（或回應的 promise）的函式。函式所拋出的內容會令該呼叫被 reject，就如宿主應用的錯誤一樣。呼叫 `handlers` 未列出的名稱會失敗，就如在不處理任何呼叫的宿主應用中一樣。

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

`app.host.send(name, data)` 會發送事件，然後等待應用靜止。`app.host.calls()` 和 `app.host.posts()` 按順序列出 handlers 收到的內容：`name` 和 `data`。

應用開啟的 URL（[`openUrl`](../modules/nsh.md#openurl)，以及帶有 `links="open"` 的 `TextView` 連結）會被記錄下來，並以已開啟的狀態回報給應用，但本機上不會開啟任何東西。`app.openedUrls()` 會列出這些 URL：

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### 模擬網路

`network` 按 `"<METHOD> <URL>"` 列出路由（單純的 URL 即 `GET`；`*` 匹配任何文字）。沒有路由匹配的請求會失敗，因此測試不會在未經允許下連上網路。路由可以是一個回應，也可以是一個以請求為參數、傳回回應（或回應的 promise）的函式；在 Rust 中，`StubNetwork::new(routes)` 接受相同的路由，每個都是 `StubResponse` 或 `StubRoute::Handler`：

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
| `headers` | 無 | 標頭名稱和值。 |
| `body` | 空 | 字串，或以 JSON 發送的值（除非 `headers` 指定了其他類型，否則會附帶 `content-type: application/json`）。 |
| `error` | 無 | 請求會以此訊息失敗，就如裝置離線一樣。 |
| `delay` | 0 | 回應所需的時間（毫秒）；步驟不會等待它，`waitFor` 才會。在手動時鐘上，時鐘越過該時間後回應才會到達。 |

路由的函式會取得請求（`method`、`url`、`headers`，以及以文字表示的 `body`），並在測試檔案中執行，因此可以統計請求數目，或按測試所設定的內容作出回應。拋出錯誤的函式會令該請求及發出該請求的步驟失敗。`app.requests()` 會以同樣方式按順序列出應用發出的請求。

連線同樣留在測試之內：除非 `network` 為 `"live"`，否則應用的 socket（`net`）和 WebSocket（全域 `WebSocket` 和 `websocket` 模組）都不會開啟任何連線。在通過應用自身執行時的能力檢查之後，`net.connect` 和 `websocket` 模組的 `connect` 會以 `code` `ERR_NSH_TEST_NETWORK` reject，而全域 `WebSocket` 會觸發 `error`，然後觸發 `close`（1006，非正常關閉），就如網路拒絕連線一樣。使用 `"live"` 時，它們會與應用的請求一同連接真實網路。在 Rust 中，`EngineConfig::refuse_connections` 對 `Headless` 應用有同樣作用：它是一個以應用所連接的對象（WebSocket 的 URL、socket 的 `host:port`）為參數的函式，傳回該呼叫失敗時使用的錯誤。

<a id="controlling-time"></a>

### 控制時間

在系統時鐘上，應用的計時器和原生動畫所需時間與在裝置上相同，等待它們的測試也一樣。使用手動時鐘（Rust 中的 `EngineConfig::clock`，TypeScript 中 `open` 的 `clock`）時，應用會在一個時間只隨測試推進而移動的時鐘上運行，而且是即時完成，就如 Jest 的 fake timers 或 Playwright 的 `page.clock` 一樣。`app.clock` 就是該時鐘；當應用使用系統時鐘時，則為 `null`：

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

回應帶有 `delay` 的 `StubNetwork`，會在 `.with_clock(clock.clone())` 時跟隨手動時鐘。以下的步驟屬於 `nsh test`；`Headless` 也有這些步驟（`run_for`、`fast_forward`、`set_system_time`）。

| 步驟 | 說明 |
|---|---|
| `await app.clock.runFor(ms)` | 將時鐘推進 `ms` 毫秒，每次一個顯示幀。計時器、`requestAnimationFrame`、原生動畫和延遲的回應會在到期時按順序執行，各自在其時間點運行。應用靜止後 resolve。 |
| `await app.clock.fastForward(ms)` | 將時鐘一次過推進 `ms` 毫秒，就如裝置從休眠中喚醒一樣：期間到期的計時器各自執行一次。 |
| `app.clock.setSystemTime(time)` | 將牆上時間（`Date.now()`、`new Date()`）設定為某個 `Date` 或毫秒數，不移動任何計時器。 |

`Date`、`performance.now()` 和 `Intl` 的預設日期會跟隨時鐘。步驟會完成正在執行的工作，但不會等待它：當應用請求顯示幀或有原生動畫在運行時，顯示幀會逐個接續出現，每個在時鐘上相隔一幀的時間（1/60 秒）。300 毫秒的轉場只需數毫秒，期間到期的計時器也會執行。永不停止循環的動畫（例如 spinner）會隨時鐘運行：它隨測試推進時鐘而轉動。`app.wait(ms)` 和長按會按其所需時間推進時鐘。較後才到期的計時器，只會在測試把時鐘推進到該時間時才執行。`waitFor` 和 `waitUntil` 在等待期間會推進時鐘，每次一個顯示幀，並在每幀之後檢查，因此計時器所顯示的內容會在等待時片刻即現：`waitFor("Saved", { timeout: 15_000 })` 最多會推進時鐘十五秒。它們的逾時同時按兩個時鐘計算：等待最多會把應用的時鐘推進該時長，並在真實時間也經過同樣長度後才 reject，因此來自應用外部的內容（路由的函式、網路）所得的時間與在系統時鐘上相同。gallery 的測試就是這樣運行的（`examples/gallery/tests`）：其中十二個等待動畫的測試只需 6 秒，而不是 28 秒。
<a id="steps"></a>

### 步驟

步驟以**選擇器**指定視圖，寫法與 Playwright 相同：

| 選擇器 | 匹配 |
|---|---|
| `id:<testID>` | 具有該 `testID` 的視圖。 |
| `label:<label>` | 具有該 `accessibilityLabel` 的視圖。 |
| `text:<text>` | 內容與其相符的文字（忽略前後空白）、可接收按壓的文字中的一段（巢狀的 `<Text onPress>`、`TextView` 的連結），或內容與其相符、或在為空時以其作為佔位文字的輸入框。 |
| `role:<role>`、`role:<role>[<name>]` | 具有該 `role`（`role:button`）及該名稱的視圖：名稱為其標籤，否則為其中的文字（`role:button[Save]`）。 |
| `view:<id>` | `--trace` 輸出中具有該 id 的視圖。 |
| 其他任何寫法 | 先視為 `testID`，否則視為標籤，再否則視為文字，按原樣比對。 |

以小寫單字加冒號開頭的部分會被視為前綴（`id`、`label`、`role`、`text`、`view`），因此 `tapped: solo` 是會列出這些前綴的步驟錯誤。以此方式開頭的文字、標籤或 test id 須加上前綴，該前綴會將其餘部分按原樣讀取：`text:tapped: solo`、`label:note: draft`、`id:row:2`。新增前綴時，選擇器的含義保持不變。

`label:`、`text:` 及角色的名稱也可使用正則表達式：`text:/^Buy/i`，語法依 Rust 的 `regex` crate（JavaScript 的字元類別、群組、錨點和量詞，以線性時間比對；旗標為 `i`、`m` 和 `s`）。` >> ` 會在前一部分所匹配的內容之內查找（`id:cart >> role:button[Remove]`），而 `nth=<n>` 會保留其中一個匹配結果，序號從 0 開始（`text:Delete >> nth=1`）。選擇器會找出用戶最先看到的視圖：在最上層的 modal 中，然後是畫面上，而導覽堆疊則只看最上層的畫面。它匹配的是用戶所見的內容：有面積、位於 `visibility: hidden` 之外、在視窗及裁切它們的視圖之內（`overflow: hidden`）的視圖，或是用戶可捲動的捲動視圖內容中的任何位置（捲動時便會帶入畫面；`opacity` 與 transform 除外，與 Playwright 相同）。對視圖執行動作的步驟（`press`、`type`、`clear`、`submit`、`scroll`、`longPress`）須剛好匹配一個視圖：選擇器匹配多個時步驟會失敗，錯誤訊息會說明如何縮窄範圍。

| 步驟 | 說明 |
|---|---|
| `await app.press(selector)` | 按壓該視圖，或其外層最近一個能接收按壓的視圖（文字外層的按鈕）：`onPressDown`、`onPressUp`、`onPress`，其間包含手指按下與抬起，而其外層監聽觸控的視圖會收到這些事件（覆蓋層的 `onPressOutside`）。文字中的一段會在其字元上被按壓（`await app.press("Privacy policy")`），適用於 headless 以及 iOS、Android 和桌面平台。在 500 ms 內對同一視圖的第二次按壓，會依各平台的計算方式視為第二次點擊（`clicks: 2`，即雙擊）。視圖已停用時會拒絕。 |
| `await app.longPress(selector)` | 將手指按住該視圖（或其外層最近一個能接收按壓或觸控的視圖）達其 `delayLongPress`（500 ms）：`onPressDown`、`onLongPress`、`onPressUp`；之後不會再有 `onPress`。觸控的處理器會收到該手指的事件（`ContextMenu` 或 `Tooltip` 會開啟）。 |
| `await app.clear(selector)` | 清空輸入框，效果等同全選後刪除。 |
| `await app.type(selector, text)` | 逐鍵在輸入框（或視圖內的第一個輸入框；`text:` 也會匹配輸入框的文字或佔位文字）現有內容的末端輸入：先取得焦點，然後每個字元都是一次 `onKeyPress` 和一次 `onChange`，在 `maxLength` 之內。單行輸入框中的 `\n` 即為 return 鍵。 |
| `await app.submit(selector)` | 在輸入框中按 return 鍵，依其 `submitBehavior` 所指定：`onSubmit`（單行輸入框會失去焦點），或在多行輸入框中換行。 |
| `await app.scroll(selector, distance)` | 沿捲動視圖或列表（該視圖、其外層的一個，或其內的第一個）的軸向拖曳 `distance` 點，每個影格 10 點，限於其內容之內，如同用戶可做到的操作（`scrollable`）。負值則向回捲動。 |
| `await app.hover(selector)` | 將滑鼠移到視圖中央之上：滑鼠移離的下方視圖會收到 `onMouseLeave`，移入的視圖會收到 `onMouseEnter` 並套用其 `hover:` 樣式，而正在監聽的視圖會收到 `onMouseMove`，內含滑鼠位置且沒有按鍵按下。適用於桌面平台及任何寬度的網頁，包括手機模式的瀏覽器（headless：桌面或 `"web"` `platform`）；iOS 或 Android 手機沒有滑鼠，在那裡會拒絕。 |
| `await app.rightClick(selector)` | 在視圖中央之上按滑鼠的次要按鍵：該視圖，或其外層最近一個正在監聽的視圖，會收到 `onContextMenu`。適用於桌面平台及網頁（headless：桌面 `platform`）；手機沒有滑鼠，在那裡會拒絕。 |
| `await app.paste(selector, { text?, html?, files?, uris? })` | 如同用戶在剪貼簿載有該內容時貼上到輸入框：它取得焦點並收到 `onPaste`（`html` 為帶有格式的相同內容，`files` 為路徑，其位元組會以 `File` 形式取得，`uris` `file:` 為 URL），然後其文字依 `pasteBehavior` 所指定的方式放入。適用於 headless、macOS、iOS 及網頁；機器的剪貼簿保持原狀。 |
| `app.menu()` | 應用程式所顯示的情境選單（`Menu.popup`）的動作：`label`（子選單的項目排在其自身之後，`"Share > Mail"`）、`disabled`，以及可勾選項目的 `checked`；沒有選單開啟時為 `null`。 |
| `await app.chooseMenuItem(label)` | 選擇已開啟的情境選單的動作，如同點擊該項目：應用程式會收到 `onMenu`（其 `onSelect` 會執行），然後選單關閉。項目已停用或不存在時會拒絕。 |
| `await app.closeMenu()` | 不選擇任何項目而關閉已開啟的情境選單，如同按 Escape。 |
| `await app.keyboard.press(keys)` | 在硬體鍵盤上按下一個按鍵及其修飾鍵，按 `keymap` 所命名的方式（`"mod+k"`、`"shift+/"`、`"escape"`；`mod` 是平台的 command 鍵），適用於所有平台（手機和平板電腦也有硬體鍵盤）：應用程式中對應的快速鍵會收到它（`keymap.bind`、`onKeyCommand`）；否則在 macOS 和網頁上，Tab 和 Shift+Tab 會在輸入框與可接收按壓的視圖（`onFocus`、`onBlur`、`focus:` 樣式）之間移動鍵盤焦點，而 Return 或 Space 會按壓焦點所在的視圖；否則獲得焦點的輸入框會接收字元、Backspace 或 return 鍵；否則 Escape 會返回上一頁。 |
| `await app.keyboard.down(keys)` / `up(keys)` | 按住修飾鍵（`"mod"`、`"shift"`、`"alt"`、`"ctrl"`、`"meta"`，以 `+` 連接），直至 `up`：其間的按壓、拖曳和懸停都會帶有這些修飾鍵，如同 Mod 加點擊或 Shift 加拖曳。目前只支援 headless 和 Linux。 |
| `await app.dragAndHold(selector, by)` / `app.drop()` | 如同 `drag` 般拖曳，並保持手指按下，直至 `drop()` 在當前位置將其抬起：兩者之間的步驟可查看拖曳進行中的畫面（拖曳預覽、放置指示線）。目前只支援 headless 和 Linux。 |
| `await app.dropFiles(selector, uris)` | 將本機檔案（`file:` URL，如同檔案管理員拖曳而來）放到視圖中央：該視圖，或其外層最近一個正在監聽的視圖，會收到 `onFileDrop`。目前只支援桌面平台、headless 和 Linux。 |
| `await app.drag(selector, { x, y })` | 手指落在視圖中央，停留 100 ms，移動 `x`、`y` 點，每個影格 10 點，然後抬起，按平台輸入系統的處理方式：隨後會有平移手勢（`pan={{ x, y }}`、`onPanStart`、帶有放開速度的 `onPanEnd`），監聽觸控的視圖會收到它（`onTouchStart`、`PanResponder`），捲動視圖會隨之捲動，而在被拉過頂端足夠距離時會重新整理（`onRefresh`），而其下方的按壓一旦移開便會取消。在桌面平台和網頁上則以滑鼠進行。 |
| `await app.wait(ms)` | 讓應用程式運行 `ms` 毫秒：計時器、動畫、請求。在手動時鐘下，將時鐘推進 `ms`（`app.clock.runFor`）。 |
| `await app.waitFor(selector, options?)` | 在有視圖匹配時完成，或在沒有視圖匹配時以 `{ state: "gone" }` 完成；超過 `timeout` ms（5000）後會拒絕。在手動時鐘下，等待期間每次推進一個顯示影格，最多推進 `timeout`。 |
| `await app.waitUntil(condition, options?)` | 在 `condition()` 返回 true 時完成，應用程式每次變動後都會再檢查：用於選擇器無法表達的情況（`() => app.storage().note === "Milk"`）。在手動時鐘下，兩次檢查之間推進一個顯示影格，最多推進 `timeout`。 |
| `app.shows(selector)` | 現時是否有視圖匹配。 |
| `app.count(selector)` | 現時有多少個視圖匹配。 |
| `app.enabled(selector)` | 該視圖是否接受輸入：它本身及其外層視圖均未停用，而且輸入框並非 `readonly`。 |
| `app.texts()` | 現時畫面上的文字，按順序排列。 |
| `app.value(selector)` | 輸入框的文字，沒有匹配時為 `null`。 |
| `app.spanStyle(selector)` | 第一個匹配字元的解析後樣式，適用於 headless 及每個 `--target`：`color`、可選的 `backgroundColor`、`fontSize`、`fontWeight`、`italic`、`underline` 和 `lineThrough`。顏色為 `#rrggbbaa`；尺寸以點為單位。 |
| `app.storage()` | 應用程式的儲存空間現時所存的內容。 |
| `await app.back()` | 如同用戶般返回（標題列的返回按鈕、將 sheet 向下滑動）：最新 modal 中最內層的堆疊，否則是畫面中最內層的堆疊，會彈出其最上層的畫面（`onDismiss`），若其設有 `preventBack` 則改為詢問它（`onBackRequest`）；若沒有，則最新的 modal 會被要求關閉（`onRequestClose`）。沒有可返回的位置時會拒絕。 |
| `app.onDialog(handler)` | 回應應用程式由此刻起顯示的對話框（`Alert.alert`、操作表）：`handler` 會取得該對話框（`title`、`message`、`buttons`、`cancelable`、`sheet`），並返回要按下的按鈕文字，或返回 `null` 以在不按任何按鈕的情況下關閉它。 |
| `app.dialogs()` | 應用程式已顯示的對話框，按順序排列。 |
| `app.onPick(handler)` | 回應應用程式由此刻起所要求的選取（`Picker.pickImages`）：`handler` 會取得該選取所要求的條件（`multiple`、`limit`、`maxDimension`、`quality`、`format`），並返回用戶選取的檔案（`{ name, type?, data: Uint8Array }`，原樣交給應用程式），或返回 `null` 以取消。沒有處理器時，選取會被取消。僅限 headless 運行。 |
| `app.picks()` | 應用程式所要求的選取，按順序排列。 |
| `app.hear(text)` | 用戶向運行中的語音工作階段說出 `text`（`Speech.start`）：其 `result` 會將 `text` 報告為至此為止的完整逐字稿。僅限 headless 運行。 |
| `app.endSpeech(error?)` | 結束運行中的語音工作階段：帶有 `error`（`"no-speech"`、`"network"`……）時會失敗，否則會送出最後一個最終結果及 `end`，沒有聽到任何內容時則為 `no-speech`。僅限 headless 運行。 |
| `app.speechRequests()` | 應用程式所啟動的語音工作階段，按順序排列：`lang`（用戶的為 `null`）及 `interim`。 |
| `app.clipboard()` | 剪貼簿現時的文字，沒有文字時為 `null`。 |
| `app.requests()` | 應用程式所發出的請求，按順序排列：`method`、`url`、`headers`、`body`。 |
| `await app.host.send(name, data?)` | 向應用程式發送宿主應用程式的一個事件（`host.on`），然後等待至靜止。參見[操作宿主應用程式](#playing-the-host-app)。 |
| `app.host.calls()`、`app.host.posts()` | 應用程式向 `open` 的 `host.handlers` 所發出的呼叫和 post，按順序排列：`name`、`data`。 |
| `app.openedUrls()` | 應用程式所開啟的 URL（`openUrl`），按順序排列：只作記錄，不會真正開啟。 |
| `await app.setViewport(width, height)` | 調整視口大小，如同旋轉裝置或調整視窗大小（`windowSize()`）。 |
| `await app.setColorScheme(scheme)` | 如同用戶般將系統外觀切換為 `"light"` 或 `"dark"`。 |
| `await app.setLifecycle(state)` | 如同系統在用戶離開應用程式、切換到其他應用程式或視窗再返回時般，將應用程式移至 `"background"`、`"inactive"` 或 `"active"`（`lifecycle()`）。僅限 headless 運行。 |
| `await app.screenshot(path?)` | 應用程式視窗的 PNG 圖片（`Uint8Array`），若有指定，也會儲存在本機的 `path`（相對於當前目錄）。只有真實平台才會繪製應用程式：參見[在真實平台上](#on-a-real-platform)。 |

步驟會在應用程式連續 100 ms 沒有渲染任何內容，且沒有會自行結束的原生動畫在運行時完成（對於持續渲染的應用程式最多 2 秒；在手動時鐘下，同樣是應用程式時間的 2 秒），因此下一行執行時，步驟所造成的改變已呈現在畫面上；對於之後才出現的內容（回應、計時器），請使用 `waitFor`。在手動時鐘下，步驟不會等待那 100 ms：只要應用程式已執行完該步驟及時鐘時間所觸發的所有工作（到期的計時器、promise、即時回應的模擬回應），且不需要任何影格，步驟便會完成，除非仍有請求在進行中，因此使用手動時鐘的測試在步驟之間不會有停頓。由其他執行緒回應的內容（`nsh/host` 呼叫、檔案讀取、Rust 任務在執行緒上的工作）會在步驟完成之後才到達：請用 `waitFor` 其顯示的內容。永不停止的動畫（例如載入中的轉圈圖示）會在步驟和 `waitFor` 繼續進行時於背景持續運行，如同瀏覽器測試中無限循環的 CSS 動畫。當沒有任何視圖匹配其選擇器（錯誤訊息會列出畫面上的文字）、應用程式在此期間拋出例外，或應用程式要求只有真實平台才能回應的內容時，步驟會拒絕並令測試失敗。

測試可預期的失敗帶有 `code`，此值保持不變；其訊息是給人閱讀的，可能會更改，因此測試應比對該代碼：

| `code` | 步驟或查詢 |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | 畫面上沒有任何視圖匹配該選擇器，或已開啟的選單沒有該項目。 |
| `ERR_NSH_TEST_DISABLED` | 選擇器所指的視圖已停用（用戶無法捲動的捲動視圖、已停用的選單項目）。 |
| `ETIMEDOUT` | `waitFor` 或 `waitUntil` 逾時，或應用程式在 `open` 之後沒有渲染任何內容。 |
| `ERR_NSH_TEST_NO_BACK` | `back()` 找不到可返回的位置。 |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` 配合 `--target` 時，傳入了目標平台無法支援的選項：iOS 和 Android 上的 `width` 或 `height`、桌面或網頁上手機的 `platform`、iOS 或 Android 上桌面或另一種手機的選項、`host.handlers`。訊息會指明該選項。 |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` 讀取巢狀的 `<Text testID="guide">`；`text:word` 讀取該匹配結果的第一個字元。使用 `id:note >> text:word` 限定查詢範圍，並以 `>> nth=0` 選取重複的匹配結果。對於不存在、有歧義或為空的區段，查詢會報告錯誤。更新區段的 `testID` 時會重用其文字排版，並保留 `onTextLayout` 回呼的次數。
<a id="what-headless-runs-play-of-the-platform"></a>

### 無頭運行扮演平台的哪些部分

無頭運行擁有真正的運行時，但沒有平台。它只扮演 NSH 協議所定義的平台角色，凡是只有真正平台才能做到的事，它一概不做：

- **原生動畫逐幀運行**，直至結束：`start(callback)` 回呼會執行，等待這些回呼的內容也會執行。沒有終點的循環動畫會一直運行，直至應用程式將其停止。
- **返回**會如平台一樣彈出畫面並關閉模態視窗（`app.back()`）。
- **對話框會得到回應**：先由測試的 `onDialog` 回應，否則按其取消按鈕，否則在可以關閉時關閉；只有其他按鈕才能回應的對話框，會令顯示它的步驟失敗，直至測試指明要按哪一個。
- **剪貼簿存放文字**：應用程式複製的內容，會在貼上時讀回（可用 `clipboard` 預先放入一些內容）。
- **頁面的宿主會回應 `host`**，前提是應用程式的 `nsh.json` 在 `web.host` 中指明了一個（[頁面的宿主](#the-pages-host)）。
- **應用程式按其所宣告的能力運行**：其 `nsh.json` 在 `capabilities` 中宣告的內容會如在裝置上一樣強制執行，因此未宣告的一律被拒絕。
- **URL 會被記錄**：應用程式開啟的 URL 會被報告為已開啟，並由 `app.openedUrls()` 列出。
- **選取會得到回應**：以測試提供的檔案回應（`onPick`），否則視為取消，因此 `Picker.pickImages` 會以 `[]` 完成。
- **語音由測試提供**：`Speech.available()` 以 `true` 完成，工作階段會立即開始，並聽到 `hear` 所說的內容。
- **模態視窗即時顯示**：模態視窗呈現時會觸發 `onShow`。
- **圖片不會載入**：不會觸發 `onLoad` 或 `onError`，而 `Image.getSize` 和 `Image.prefetch` 會被拒絕。
- **只有真正平台才能回應的事會令步驟失敗**：例如剪貼簿中的圖片或檔案。

<a id="the-pages-host"></a>

### 頁面的宿主

發佈到網頁的應用程式會從其頁面取得宿主：`nsh.json` `web.host`，即一個匯出 `createHost(player)` 的模組（[Web](./web.md#the-hosts-functions)）。無頭運行會在測試開啟每個應用程式時、應用程式啟動之前載入該模組，並在其專屬的 JavaScript 環境中運行（有計時器和 `console`，沒有任何瀏覽器的功能，也沒有 import）：其 `call` 回應應用程式的 [`host.call`](../modules/nsh.md#host)，其 `player.hostEvent` 可傳送至 `host.on`，而 `host.available()` 是 `true`。如果 `call` 拋出錯誤、被拒絕或返回的不是 JSON，應用程式的呼叫會如在頁面上一樣，以其訊息被拒絕；在應用程式啟動前發送的事件，會在應用程式啟動後送達其頂層監聽器。`--web-host <module>` 可指定另一個模組。應用程式的 `capabilities.host` 必須列出它所呼叫的內容，與在頁面上一樣。呼叫的逾時和宿主自己的計時器按應用程式的時間運行，因此手動時鐘可以推動它們（`app.clock.runFor`）。在瀏覽器（`--target web`）中，開發頁面會如已發佈的頁面一樣，為每個應用程式運行 `nsh.json` 的 `web.host`；在其他平台（`--target`）上，應用程式沒有宿主：`host.available()` 是 `false`。

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` 包含一個應用程式、其宿主及它們的測試。

<a id="expectations"></a>

### 期望值

`expect(value)` 會如 Jest 一樣檢查值，並以 JS 所建立的方式處理：`toBe` 是 `Object.is`，`toEqual` 逐個成員比較，而 `Date`、`Map` 或 `Uint8Array` 則按其本身的類型比較。每項檢查在不成立時都會拋出錯誤。`.not` 會將檢查反過來：`expect(app.texts()).not.toContain("Error")`。對於函式，`toThrow` 會檢查呼叫它時拋出的內容；對於 promise，或返回 promise 的函式，`rejects` 和 `resolves` 會如 Jest 一樣檢查它最終的結果：`await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`。

| 檢查 | 成立條件 |
|---|---|
| `toBe(expected)` | 值是 `expected`，一如 `Object.is` 所言：同一個原始值（`NaN` 是 `NaN`，`0` 不是 `-0`）或同一個物件。 |
| `toEqual(expected)` | 值逐個成員等於 `expected`，一如 Jest 的 `toEqual`：物件按其自身可列舉的屬性比較（值為 `undefined` 的屬性視為不存在），陣列逐項比較，日期按其時間比較，正規表達式按來源和旗標比較，map 和 set 按其條目比較（順序不拘），`ArrayBuffer` 和 typed array 按其位元組比較，錯誤按名稱和訊息比較；`NaN` 等於 `NaN`。類別的實例等於具有相同屬性的純物件。 |
| `toMatchObject(subset)` | 值具有 `subset` 的每個屬性，且各自按 `toEqual` 所言相等，其中的物件會依次比對；其他屬性不會被檢查，而陣列則逐項比對，且每一項都要比對。 |
| `toContain(item)` | 陣列、`Set`、typed array 或其他可迭代物件包含 `item`（`===`），或字串包含它。 |
| `toContainEqual(item)` | 陣列、`Set` 或其他可迭代物件包含一個等於 `item` 的項目，一如 `toEqual` 所言。 |
| `toBeTruthy()`、`toBeFalsy()` | 值在 JS 看來是 truthy / falsy。 |
| `toMatch(pattern)` | 字串包含 `pattern`（一個字串），或符合它（一個 `RegExp`，由 JS 引擎執行：look-behind、反向參照和具名群組的行為與 JavaScript 相同）。 |
| `toHaveLength(n)` | 值的 `length` 是 `n`：字串為其 UTF-16 單元，陣列或 typed array 為其項目。 |
| `toBeNull()` | 值是 `null`。 |
| `toBeUndefined()`、`toBeDefined()` | 值是 `undefined` / 其他任何值。 |
| `toBeNaN()` | 值是 `NaN`。 |
| `toBeGreaterThan(n)`、`toBeGreaterThanOrEqual(n)`、`toBeLessThan(n)`、`toBeLessThanOrEqual(n)` | 數字與 `n` 有此比較關係。 |
| `toThrow(expected?)` | `expect(fn)`：呼叫 `fn` 會拋出錯誤。如給定 `expected`，則錯誤要符合它：其訊息包含某個字串或符合某個 `RegExp`；錯誤類別（`TypeError`、應用程式自己的類別）是錯誤的 `name`，而 `Error` 符合每個錯誤；錯誤具有相同的訊息。 |
| `rejects.toThrow(expected?)` | `expect(promise)`：promise 被拒絕，且錯誤如 `toThrow` 所言符合 `expected`。 |
| `rejects.toMatchObject(subset)` | `expect(promise)`：promise 被拒絕，其值如 `toMatchObject` 所言符合 `subset`：錯誤自身的屬性（`code`、`permission` 等）連同其 `name` 和 `message`。 |
| `resolves.toBe(expected)`、`resolves.toEqual(expected)`、`resolves.toMatchObject(subset)` | `expect(promise)`：promise 完成並得出一個符合該檢查的值。 |

檢查失敗時，會以 JS 的寫法列出它得到的值和期望的值：`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`。

`rejects` 和 `resolves` 也有各自的 `.not`：`await expect(load()).resolves.not.toBe(null)`。

<a id="on-a-real-platform"></a>

### 在真正的平台上

`nsh test --target macos`（或 `linux`、`windows`、`gpui`、`web`、`ios`、`android`）會在平台的開發宿主而非無頭模式中運行相同的測試：每個 `open` 都在各自的視窗中啟動應用程式，並使用全新的資料目錄，而各步驟會以平台自身的輸入，作用於其選擇器所指的視圖，一如 Playwright 在瀏覽器中的做法：

- 按下是在視圖中央點擊，長按是按住點擊，`type` 點擊輸入框並輸入其按鍵，`scroll` 是在捲動視圖上的觸控板手勢，`back` 則是使用者的實際操作（macOS 和 Linux 上是 Escape，Windows 和 GPUI 上是滑鼠的返回鍵，網頁上是瀏覽器的返回按鈕，iOS 上是向下滑動收起的面板；當選單、彈出視窗或 `Sheet` 開啟時是 VoiceOver 的 escape 手勢，否則是標題列的返回按鈕；Android 上是返回按鈕）；
- 螢幕外的視圖會先被捲動至可見位置，每次一個手勢；在觸控螢幕上，手指會落在頁面本身可接受的位置，避開那些跟隨拖曳的視圖（滑桿、繪圖區），一如使用者捲動時的做法；
- 選擇器、等待和查詢所見的應用程式模型與無頭運行相同，由宿主所繪製的內容建立，因此能找到相同的視圖；
- 對話框是平台自己的：`app.dialogs()` 會讀取它們，而回應其中一個（`onDialog`，或在測試沒有指明時按其取消按鈕）就是按下它的按鈕；
- `app.screenshot(path)` 會為視窗拍攝畫面。

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

視窗以視口的大小開啟（390 × 844，除非 `open` 另有指定），並限於螢幕之內；在 iOS 和 Android 上，應用程式會以裝置的大小填滿裝置的螢幕。應用程式以目標的平台身分運行（`platform.os`）。手動 `clock` 的運作與無頭模式相同：`app.clock.runFor`、`fastForward` 和 `setSystemTime` 會即時推動應用程式的時間（計時器、相隔一幀的 `requestAnimationFrame`、`Date`），`app.wait(ms)`、`waitFor` 和 `waitUntil` 也會推動它，而平台顯示的每一幀會將它推進一幀（1/60 秒），因此應用程式的時間會在其動畫期間流逝。平台自己的動畫以及路由的 `delay` 則佔用真實時間。應用程式的請求會如無頭模式一樣送達測試：`network` 路由負責回應，沒有路由符合的請求會失敗，而 `"live"` 讓請求通過並到達宿主的網絡；`app.requests()` 會列出所有請求。Socket 和 WebSocket 在有 `"live"` 時連接宿主的網絡，否則會如無頭模式一樣被拒絕。應用程式啟動時，`storage` 已在其儲存空間中，而 `app.storage()` 會從應用程式讀取它。`locale`、`reducedMotion` 和 `safeArea`，在 `open` 提供它們時（包括預設值），會保存平台所報告的任何值，而它提供的 `colorScheme` 會切換系統的外觀（`"light"` 亦然）；沒有指定的部分則由平台決定；應用程式的剪貼簿呼叫由測試自己的剪貼簿處理（`clipboard` 起初是其文字，`app.clipboard()` 會讀取它），因此機器的剪貼簿保持原狀；文字輸入框自身的複製和貼上則使用系統的剪貼簿。`host.params` 會送達應用程式，`app.host.send` 會發送事件，而應用程式開啟的 URL 會被記錄下來供 `app.openedUrls()` 使用，而不會真正開啟。`host.handlers` 以無頭模式運行，由測試回應應用程式的呼叫。`open` 會對照目標檢查其選項：`width` 和 `height` 在 iOS 和 Android 上、另一種裝置類型的 `platform`（在桌面或網頁上使用手機的，在 iOS 或 Android 上使用桌面的或另一種手機的）以及 `host.handlers` 會以 `ERR_NSH_TEST_UNSUPPORTED` 被拒絕，因此測試要麼照寫法運行，要麼說明它需要甚麼。桌面的 `platform`（`"macos"` 用於桌面的滑鼠和按鍵）可在每個桌面目標和網頁上運行，以該目標的平台身分運行，並且始終作為桌面：在瀏覽器中，頁面不論寬度都以桌面慣例啟動；若沒有 `platform`（或使用 `"web"`），它會如瀏覽器一樣量度其慣例（寬度由 600 點起為桌面）。帶有自己 Rust crate 的應用程式，會在連同其 crate 一併建置的開發宿主中運行，而 NSH 會為該平台建置這些 crate；Rust 應用程式的宿主會運行其根組件，因此 `open(".")` 在那裏啟動它，與無頭模式一樣。

在網頁上，應用程式在開發宿主的頁面中，於無頭的 Chrome、Edge 或 Chromium 內運行：使用本機已安裝的那一個，或 `--browser <PATH>` 所指定的可執行檔（需要瀏覽器：找不到時，`nsh test` 會說明它找過哪些位置）。整個運行只使用一個瀏覽器，而每個 `open` 都會得到一個擁有獨立儲存空間的頁面。輸入是瀏覽器的受信任輸入，與使用者的一樣：滑鼠點擊、滾輪捲動和按鍵。

在 iOS 上，應用程式在 iOS 模擬器的開發宿主中運行：使用已啟動的那一個，否則使用最新的 iPhone，並由 `nsh test` 啟動。各步驟是手指的觸控和軟鍵盤的輸入，與 UIKit 從裝置取得的一致。`setColorScheme` 會切換模擬器的外觀，並由 `nsh test` 在應用程式結束後還原，而螢幕具有模擬裝置的大小。

在 Android 上，應用程式在開發宿主中，於 `adb devices` 列出的第一部裝置或模擬器上運行，並擁有各自的儲存空間。各步驟是手指的觸控和鍵盤的按鍵，與應用程式的視圖從裝置取得的一致；`back` 是系統的返回。`setColorScheme` 會切換裝置的深色主題，並由 `nsh test` 在應用程式結束後還原。

<a id="steps-from-standard-input"></a>

### 來自標準輸入的步驟

如果給定的是應用程式的入口而不是測試，`nsh test` 會在真實網絡上開啟應用程式，讓它運行 1.2 秒，然後執行標準輸入提供的步驟，並以 `app` 結束應用程式：

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

這 1.2 秒讓引擎的閒置垃圾回收在第一個步驟之前運行，因此若應用程式放棄了仍在使用的內容，就會顯現出來：它的處理器會停止運作。

範例附有可作起點的測試：Rust 應用程式有 `examples/gallery-rs`（`cargo test`，每個示範一個模組，以及 `App.test.tsx`），帶有 Rust crate 的應用程式有 `examples/rust-exports`，TSX 應用程式有 `examples/counter` 和 `examples/gallery/tests`（儲存空間、輸入、長列表、模擬請求、深色模式、手動時鐘）。

<a id="tracing-with---trace"></a>

## 使用 --trace 追蹤

`--trace` 會在測試所開啟的應用程式中，於每個步驟之下印出其帶來的每個掛載批次，以及每次提交的時間。在 Rust 中，測試會印出相同的內容：`observe` 會將每個批次連同其步驟交給它，而 `EngineConfig::trace` 會透過 `log` crate 記錄 `perf` 行（目標為 `nsh::perf`；請在測試中安裝如 `env_logger` 的記錄器）：

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` 可用於測試檔案的 `--trace`，或用於應用程式的入口並由標準輸入提供步驟：

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

使用 `--target` 時，追蹤的是平台的資料：宿主所套用的批次及帶來這些批次的步驟，還有宿主自己對每次提交和事件的計時，並以裝置的硬件量度。

可用它來：

- 檢查應用程式（或示範）能否建置、求值和渲染而沒有錯誤；
- 準確看到一項變更建立、移動或更新了哪些原生視圖，以及數量多少；
- 量度第一幀、一次點按和每個捲動幀的成本；
- 在 CI 中捕捉迴歸問題。
<a id="reading-the-output"></a>

### 閱讀輸出

以下是計數器範例按一下後的輸出（`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`），已經過精簡：

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

每個 `── step: N items` 區塊就是一個**掛載批次**（mount batch），歸屬於引發它的步驟：它包含平台為一個影格套用到原生視圖的所有變更，並且只需一次切換到主執行緒。批次中的每一行是一個**掛載項目**（mount item）：

| 項目 | 含義 |
|---|---|
| `Create { id, kind }` | 建立原生視圖（`View`、`Text`、`Image`、`Scroll` 等）。 |
| `Insert { parent, child, before }` | 將視圖放入其父視圖，位於某個同級視圖之前（`None`：放在最後）。 |
| `Remove` / `Delete` | 將視圖從其父視圖分離 / 釋放視圖。 |
| `ViewStyle { id, style }` | 視圖的裝飾：背景、邊框、圓角、陰影、不透明度、變形等。 |
| `ViewProps { id, props }` | 觸控與無障礙設定，`testID`。 |
| `Events { id, events }` | 視圖會回報哪些事件（`EventMask(1)` 即按下）。 |
| `Frame { id, x, y, w, h }` | 視圖在其父視圖中的位置與大小，單位為點（point）。 |
| `Text { id, text, content }` | 文字視圖已完成排版的文字。 |
| `Image { id, source, ... }` | 要載入的圖片。 |

只會傳送有變動的內容：點按一下只改變一個數字時，只會傳送一個 `Text` 項目；視圖不會有預設樣式，也不會有空的事件遮罩；沒有變動的影格不會傳送。捲動時若某個影格沒有顯示任何新的列，則**完全不會產生批次**。

<a id="the-762-lines"></a>

#### `perf` 行

| 行 | 含義 |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | 打包時間與 bundle 大小（開發設定）。 |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | 一次提交（commit）：JS 排入佇列的操作、核心所花的時間（渲染元件、版面配置、比對差異）、JS 綁定列表行所花的時間、產生的掛載項目，以及仍存活的節點。 |
| `turn: 2640µs (timers and tasks 1964µs)` | 一個已提交的回合（turn）：整體時間，以及提交前其 JS 計時器和 Rust 元件任務所花的時間（Rust 元件在提交時渲染）。 |
| `first frame: eval 271µs, total 1235µs` | 評估 bundle 所需的時間，以及由啟動到第一個批次的時間。 |
| `event Press on view 20` / `event js: 196µs` | 分派了一個事件，以及其處理函式（及其引發的後續操作）在 JS 中所花的時間。 |

> [!NOTE]
> 無介面（headless）模式下，文字以近似的文字引擎量度，因此文字尺寸與裝置上（使用 CoreText 或 Android 的文字版面配置）會有少許差異。版面配置邏輯、視圖數量和操作數量則完全相同。

單次執行的計時很大程度取決於 CPU 的時脈狀態（剛從閒置中喚醒的機器會較慢）。請在同一部機器上比較各次執行，參考多次執行的最小值，並且相比微秒數，更應信賴操作數和項目數。

<a id="scrolling"></a>

### 捲動

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` 以每秒 60 個影格、每個影格 10 點的速度移動列表，並印出每個影格的批次：

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

對於[列表](./lists.md)，這可以展示虛擬化的運作情況：哪些影格會綁定新的列、每一列需要多少個操作，以及沒有顯示新列的影格不會產生任何輸出。請配合發行版本（release build）使用（`cargo test --release`，或在原始碼目錄中使用 `./target/release/nsh`），計時才有參考價值。

<a id="in-ci"></a>

### 在 CI 中

無介面測試不需要裝置或顯示器，因此可以在 Linux runner 上執行：Rust 應用程式的測試使用 `cargo test`，而 `nsh test` 則只需要 CLI。只要有任何測試失敗，兩者都會以非零代碼結束：包括測試失敗、應用程式無法建置或沒有渲染任何內容，以及應用程式在某個步驟中拋出例外。

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

`--junit <FILE>` 亦會將結果寫成 JUnit XML 報告，CI 服務（GitHub Actions 測試報告工具、GitLab、Jenkins、Azure Pipelines）會按測試逐項顯示：每個測試檔案一個 `testsuite`，每個測試一個 `testcase`，並附有失敗的內容、位置，以及畫面上的文字。

若要把關效能，可記錄幾項互動的項目數量（`── … : N items` 行，以及 `--trace` 的 `ops` / `mount items` 數字），並在數量增加時令測試失敗。數量是確定性的；在共用的 CI 機器上，計時則不是。

> [!NOTE]
> 測試在應用程式的 `nsh.json` 所宣告的 `capabilities` 下執行，與在裝置上一樣：應用程式沒有宣告的項目，在測試中同樣會被拒絕。

<a id="784-for-ui-tests"></a>

## 用於 UI 測試的 `testID`

無介面測試檢查的是執行階段所渲染的內容，其 `id:` 選擇器透過測試 id 尋找視圖。若要使用平台的測試工具（XCUITest、Espresso / UI Automator、Appium、Maestro）操作真正的原生 UI，請為視圖設定測試 id：在 Rust 中使用 `.test_id(…)`，在 TSX 中使用 `testID`：

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

| 平台 | `testID` 的位置 |
|---|---|
| iOS | 視圖的 `accessibilityIdentifier`（XCUITest 中為 `app.otherElements["add-to-cart"]`）。 |
| Android | 無障礙節點的視圖 id 資源名稱（UI Automator 中為 `By.res("add-to-cart")`）。 |

在 Rust 中，測試 id 是每個元素的方法，包括元件的元素（`button().test_id("save")`，它會為元件的根節點命名）；而 `testID` 是每個元素和每個 Rust 元件的 prop（`Button`、`Dialog` 等）。它不會改變螢幕閱讀器所朗讀的內容；如需設定，請使用 `accessibilityLabel`（參閱[無障礙功能](./accessibility.md)）。在 `--trace` 輸出中，它會以 `test_id: Some("add-to-cart")` 的形式出現在視圖的 `ViewProps` 項目中。

<a id="see-also"></a>

## 另見

- [效能](./performance.md)：留意這些數字中的哪些內容
- [開發伺服器與除錯](./dev-server-and-debugging.md)
- [架構](./architecture.md)：操作、提交與掛載批次
