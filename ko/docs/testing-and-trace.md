---
title: "테스트"
description: "앱을 헤드리스로 테스트하세요. Rust에서는 cargo test와 nsh_testing을, TypeScript에서는 nsh test를 사용합니다. 앱을 열고, 누르고, 입력하고, 스크롤하고, 사용자처럼 대기할 수 있으며, 네트워크와 스토리지를 스텁 처리하고, --trace가 출력하는 네이티브 뷰 작업과 타이밍을 확인할 수 있습니다. UI 테스트에는 testID를 사용합니다."
order: 61
group: tools
source_hash: c0e7414002b92551
---

# 테스트

NSH는 앱을 **헤드리스**로 실행합니다. 실제 엔진(기기에서와 동일한 리액티브 그래프, 렌더러, 컴포넌트, 레이아웃, 리스트 가상화와 TSX용 QuickJS)이 60Hz 디스플레이 프레임으로 동작하지만 시뮬레이터, 기기, 창은 없습니다. Cargo나 CLI가 실행되는 곳이라면 Linux CI 머신을 포함해 어디서든 실행되며, 두 가지 일을 합니다.

- 테스트를 실행합니다. 각 테스트는 앱을 열고, 사용자가 하는 동작(누르기, 입력하기, 스크롤하기)을 수행한 뒤 화면에 무엇이 있는지 확인합니다. Rust 앱의 테스트는 Rust로 작성하며 `cargo test`가 `nsh-testing` crate로 실행합니다. TypeScript로 작성한 테스트는 `nsh test`로 실행하며, TSX 앱과 Rust 앱 모두에 사용할 수 있습니다.
- `--trace`를 사용하면 런타임이 네이티브 뷰에 보내는 모든 작업을 타이밍과 함께 출력합니다. 첫 프레임, 탭, 스크롤 한 프레임의 비용을 알 수 있습니다.

<a id="writing-tests"></a>

## 테스트 작성

Rust와 TypeScript로 작성한 동일한 테스트입니다. 스토리지에 빈 할 일 목록이 있는 상태로 앱을 열고, 입력하고, 누른 뒤, 화면에 표시되는 내용을 확인합니다.

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

## cargo test로 Rust 테스트하기

Rust 앱의 테스트는 해당 crate의 통합 테스트이며, `nsh-engine`와 `nsh-testing`(기본 기능, QuickJS 제외)를 dev-dependency로 사용합니다.

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)`는 아무것도 설정하지 않은 휴대폰 크기(390×844 포인트)의 엔진입니다. 이 필드들은 아래에서 설명하는 `open`의 옵션이 설정하는 것과 같습니다. `storage`(`MemoryStorage::new(entries)`), `network`(`StubNetwork`, 아래 참조), `viewport`, `environment`(외관, 로캘, 모션 줄이기), `clock`(`Clock::manual(time)`, 아래 참조)가 있습니다. `nsh_testing::Headless::start(config)`는 앱을 시작하고 앱이 표시하는 뷰의 모델을 유지합니다. 이 단계들은 아래 `nsh test`의 단계와 같고 셀렉터도 같으며, Rust로 작성합니다: `press`, `long_press`, `clear`, `type_text`, `submit`, `scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`, `set_system_time`, `set_viewport`, `set_clipboard`, `on_dialog`. `app.shows(text)`와 `app.screen()`(`texts()`, `count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`)는 화면에 있는 내용을 읽습니다. 단계를 수행할 수 없으면 화면에 있는 텍스트와 함께 오류를 반환합니다.

`nsh_testing::tsx(entry, sets)`(기능 `bundle`)는 같은 방식으로 앱의 TSX 진입점을 열며, NSH와 crate의 UI 세트([Rust로 빌드하기](./rust.md#testing))에 맞춰 빌드됩니다. `examples/gallery-rs`는 이 방식으로 Rust 루트를 테스트하며 데모마다 모듈 하나를 둡니다. `examples/rust-exports`는 Rust에서 TSX 진입점을 테스트합니다.

`nsh test`도 이러한 테스트를 실행합니다. Rust crate가 있는 앱의 디렉터리(`nsh.json` `"rust"`)가 주어지면 테스트 파일보다 먼저 그 안의 각 crate에 대해 `cargo test`를 실행하고, Rust 테스트를 TypeScript 테스트(`✓ src/lib.rs › tests::adds`)와 함께 요약과 `--junit` 리포트에 표시하고 집계합니다. 따라서 `nsh test`는 Rust 앱, crate가 있는 TSX 앱, 일반 TSX 앱 모두에 대한 단일 명령이며, `nsh check`도 마찬가지로 TypeScript를 타입 검사하기 전에 crate에 대해 `cargo check --all-targets`를 실행합니다.

<a id="tests-with-nsh-test"></a>

## nsh test로 테스트하기

테스트 파일은 코드 옆에 있는 `*.test.tsx` 또는 `*.test.ts` 파일입니다. 위의 `App.test.tsx`처럼 `nsh/test`를 import합니다.

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

테스트가 실패하면 던져진 내용, 테스트 파일에서의 위치, 그리고 테스트가 연 앱의 화면 텍스트를 보여 줍니다. 실패가 하나라도 있으면 `nsh test`는 0이 아닌 코드로 종료합니다. `nsh init`는 앱과 함께 `App.test.tsx`를 생성하며, `nsh check`는 나머지 코드와 함께 테스트 파일도 타입 검사합니다(`.nsh/types`가 `nsh/test`를 선언합니다).

각 테스트 파일은 자체 엔진에서 실행되며, 파일 안의 테스트는 순서대로 하나씩 실행됩니다. `open`는 매번 새로운 다른 엔진에서 앱을 시작하므로 테스트끼리 상태를 공유하지 않으며, 테스트가 연 앱은 테스트가 끝나면 닫힙니다. 테스트는 예외를 던질 때, 반환한 프로미스가 reject될 때, 그리고 타임아웃 이후에 실패합니다. 타임아웃은 30초이거나 `test`의 세 번째 인자로 지정한 밀리초입니다(`test("syncs", body, 60_000)`). 자체 Rust crate가 있는 앱(`nsh.json` `"rust"`)은 NSH가 crate와 함께 빌드하는 헤드리스 러너에서 같은 방식으로 테스트를 실행합니다. Rust 앱(`nsh.json` `"root"`, [Rust로 빌드하기](./rust.md))에서는 `open(".")`가 루트 컴포넌트를 시작합니다.

<a id="grouping-tests-and-setting-them-up"></a>

### 테스트 그룹화와 설정

`describe`, 훅, `test`의 변형은 Jest와 동일하게 동작합니다.

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

| 함수 | 설명 |
|---|---|
| `describe(name, body)` | 테스트와 `body`가 선언하는 블록을 그룹화합니다(파일이 로드되는 시점에 한꺼번에). 이름은 `name`(`the cart › starts empty`)로 시작하며, 블록 안에서 선언한 훅은 그 블록의 테스트에만 적용됩니다. 블록은 중첩할 수 있습니다. |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | 선언된 블록(파일, `describe`)의 각 테스트 전/후에 `fn`를 실행합니다. 바깥 블록의 `beforeEach`이 먼저, 안쪽 블록의 `afterEach`이 먼저 실행됩니다. 실패한 `beforeEach`는 테스트를 실패시키며, `afterEach`는 어느 경우에나 실행됩니다. |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | 블록의 테스트 중 하나가 실행될 때, 블록의 첫 테스트 전과 마지막 테스트 후에 `fn`를 한 번 실행합니다. 실패한 `beforeAll`는 블록의 테스트를 실패시키고, 실패한 `afterAll`는 실패한 `<block> › afterAll`로 보고됩니다. `beforeAll`가 연 앱은 블록의 테스트 동안 열려 있으며, `afterAll` 이후에 닫힙니다. |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | 실행되지 않는 테스트 또는 블록을 선언합니다. 건너뜀으로 보고됩니다. |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | 테스트 파일에 하나라도 있으면 해당 테스트와 블록만 실행되고, 파일의 나머지는 건너뜀으로 보고됩니다. |
| `test.todo(name)` | 아직 작성하지 않은 테스트이며, 그렇게 보고됩니다. |

훅은 `async`일 수 있으며, 지정하지 않으면 `timeout`는 30초입니다. 테스트와 훅은 파일이 로드될 때 선언되므로, 테스트나 훅 안에서 테스트를 선언하면 예외가 발생합니다.

<a id="opening-the-app"></a>

### 앱 열기

`open(entry, options?)`는 `entry`(테스트 파일 기준 상대 경로이며, 각 진입점은 실행당 한 번 빌드됨)의 앱을 빌드하고 390×844 뷰포트에서 시작하며, 렌더링이 끝나고 조용해지면 resolve됩니다. `--target`를 사용하면 앱은 테스트가 지정한 옵션 그대로 실행됩니다. 대상 플랫폼이 지원할 수 없는 옵션이 있으면 `open`는 그 옵션을 명시한 `ERR_NSH_TEST_UNSUPPORTED`와 함께 reject됩니다([실제 플랫폼에서](#on-a-real-platform) 참조).

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `storage` | 비어 있음 | 시작 시 `Storage`가 가지고 있는 내용: `{ todos: "[]" }`. |
| `network` | 없음 | 앱의 요청이 경로별로 받는 응답: [네트워크 스텁 처리](#stubbing-the-network)를 참조하세요. `"live"`: 요청, 소켓, WebSocket에 대해 실제 네트워크를 사용합니다. |
| `width`, `height` | 390, 844 | 포인트 단위 뷰포트: 헤드리스에서는 이 값, 데스크톱에서는 창, 웹에서는 페이지입니다. iOS와 Android에서는 앱이 기기 화면을 채웁니다. |
| `safeArea` | 0 | 포인트 단위 세이프 에어리어 인셋: `{ top: 47, bottom: 34 }`. |
| `clipboard` | 비어 있음 | 시작 시 클립보드에 있는 텍스트. |
| `colorScheme` | `"light"` | 시스템 외관: `"light"` 또는 `"dark"`(`colorScheme()`, `dark:` 클래스). |
| `locale` | `"en-US"` | 기기의 로캘이며 BCP 47 태그입니다(`locale()`, `Intl`의 기본값). |
| `reducedMotion` | `false` | 사용자가 모션 줄이기를 요청했는지 여부(`reduceMotion()`). |
| `platform` | `"ios"` | 헤드리스에서 앱이 실행되는 플랫폼: `"ios"`, `"android"`, 또는 데스크톱의 `"macos"`, `"windows"`, `"linux"`, 혹은 데스크톱 관례(`platform.os`, `ios={{…}}` / `android={{…}}` / `desktop={{…}}` props, 키보드 단축키)를 따르는 `"web"`. `--target`를 사용하면 앱은 대상의 플랫폼으로 실행됩니다. 모든 데스크톱에서는 데스크톱의 `platform`로, 웹에서는 항상 데스크톱으로(브라우저에서는 어떤 너비에서도 데스크톱 관례로, `platform.os`는 `"web"` 유지), `"ios"`과 `"android"`은 각자의 플랫폼으로 실행됩니다. |
| `clock` | 시스템 시계 | 테스트가 움직일 때만 시간이 움직이는 수동 시계: `{}`, 또는 `Date`(또는 Unix epoch 이후 밀리초)에서 시작하려면 `{ time }`. [시간 제어](#controlling-time)를 참조하세요. |
| `host` | 없음 | 테스트가 대신 수행하는, 임베딩 앱의 역할: `{ params, handlers }`. [호스트 앱 역할 수행](#playing-the-host-app)을 참조하세요. |

<a id="playing-the-host-app"></a>

### 호스트 앱 역할 수행

네이티브 앱에 임베드된 앱은 [`host`](../modules/nsh.md#host)를 통해 네이티브 앱과 통신합니다. 테스트에서는 테스트가 호스트 앱 역할을 합니다. `host.params`는 앱이 시작 시 읽는 실행 매개변수를 제공하고, `host.handlers`는 이름별로 앱의 `host.call`에 응답하고 `host.post`를 수신합니다. 핸들러는 모든 호출에 응답하는 값이거나, 호출 데이터를 받아 응답(또는 응답의 프로미스)을 반환하는 함수입니다. 함수가 던진 예외는 호스트 앱의 오류와 마찬가지로 호출을 reject합니다. `handlers`가 나열하지 않은 이름의 호출은, 아무것도 처리하지 않는 호스트 앱에서처럼 실패합니다.

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

`app.host.send(name, data)`는 이벤트를 보낸 뒤 앱이 조용해질 때까지 기다립니다. `app.host.calls()`와 `app.host.posts()`는 핸들러가 받은 내용을 순서대로 나열합니다: `name`와 `data`.

앱이 여는 URL([`openUrl`](../modules/nsh.md#openurl), `links="open"`가 있는 `TextView`의 링크)은 기록되어 앱에 열린 것으로 보고되며, 이 머신에서는 아무것도 열리지 않습니다. `app.openedUrls()`가 이를 나열합니다.

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### 네트워크 스텁 처리

`network`는 `"<METHOD> <URL>"`별로 경로를 나열합니다(URL만 쓰면 `GET`이며, `*`는 모든 텍스트와 일치합니다). 어떤 경로와도 일치하지 않는 요청은 실패하므로, 테스트가 요청하지 않은 네트워크에는 접근하지 않습니다. 경로는 응답이거나, 요청을 받아 응답(또는 응답의 프로미스)을 반환하는 함수입니다. Rust에서는 `StubNetwork::new(routes)`가 같은 경로를 받으며, 각각 `StubResponse` 또는 `StubRoute::Handler`입니다.

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

| 응답 멤버 | 기본값 | 설명 |
|---|---|---|
| `status` | 200 | 상태 코드. |
| `headers` | 없음 | 헤더 이름과 값. |
| `body` | 비어 있음 | 문자열, 또는 JSON으로 전송되는 값(`headers`이 지정하지 않는 한 `content-type: application/json` 포함). |
| `error` | 없음 | 기기가 오프라인일 때처럼, 요청이 이 메시지와 함께 대신 실패합니다. |
| `delay` | 0 | 응답에 걸리는 시간(밀리초). 단계는 이를 기다리지 않으며 `waitFor`는 기다립니다. 수동 시계에서는 시계가 그 시간을 지나면 응답이 도착합니다. |

경로의 함수는 요청(`method`, `url`, `headers`, 텍스트로서의 `body`)을 받으며 테스트 파일에서 실행되므로, 요청 수를 세거나 테스트가 설정한 내용으로 응답할 수 있습니다. 예외를 던지는 함수는 요청과 그 요청을 만든 단계를 실패시킵니다. `app.requests()`는 앱이 보낸 요청을 같은 방식으로 순서대로 나열합니다.

연결도 테스트 안에 머뭅니다. `network`가 `"live"`가 아니면 앱의 소켓(`net`)과 WebSocket(전역 `WebSocket`과 `websocket` 모듈)은 어떤 연결도 열지 않습니다. 앱 자체가 실행하는 기능 검사를 통과한 뒤, `net.connect`과 `websocket` 모듈의 `connect`는 `code` `ERR_NSH_TEST_NETWORK`와 함께 reject되고, 전역 `WebSocket`은 네트워크가 거부한 연결에서처럼 `error`를 발생시킨 다음 `close`(1006, 정상 종료 아님)를 발생시킵니다. `"live"`를 사용하면 앱의 요청과 함께 실제 네트워크에 연결됩니다. Rust에서는 `EngineConfig::refuse_connections`가 `Headless` 앱에 대해 같은 일을 합니다. 앱이 연결하는 대상(WebSocket의 URL, 소켓의 `host:port`)을 받아, 호출이 실패할 때 사용할 오류를 반환하는 함수입니다.

<a id="controlling-time"></a>

### 시간 제어

시스템 시계에서는 앱의 타이머와 네이티브 애니메이션이 기기에서와 같은 시간이 걸리며, 이를 기다리는 테스트도 마찬가지입니다. 수동 시계(Rust에서는 `EngineConfig::clock`, TypeScript에서는 `open`의 `clock`)를 사용하면, Jest의 가짜 타이머나 Playwright의 `page.clock`처럼 앱이 테스트가 움직일 때만 시간이 움직이는 시계에서 즉시 실행됩니다. `app.clock`는 그 시계이며, 앱이 시스템 시계에서 실행되면 `null`입니다.

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

응답에 `delay`이 있는 `StubNetwork`는 `.with_clock(clock.clone())`로 수동 시계를 따릅니다. 아래 단계는 `nsh test`의 것이며, `Headless`에도 모두 있습니다(`run_for`, `fast_forward`, `set_system_time`).

| 단계 | 설명 |
|---|---|
| `await app.clock.runFor(ms)` | 시계를 `ms` 밀리초만큼 한 디스플레이 프레임씩 움직입니다. 타이머, `requestAnimationFrame`, 네이티브 애니메이션, 지연된 응답이 만료되는 순서대로 각자의 시각에 실행됩니다. 앱이 조용해지면 resolve됩니다. |
| `await app.clock.fastForward(ms)` | 절전에서 깨어나는 기기처럼 시계를 `ms` 밀리초만큼 한 번에 움직입니다. 그동안 만료된 타이머는 각각 한 번씩 실행됩니다. |
| `app.clock.setSystemTime(time)` | 타이머를 움직이지 않고 벽시계 시간(`Date.now()`, `new Date()`)을 `Date` 또는 밀리초로 설정합니다. |

`Date`, `performance.now()`, `Intl`의 기본 날짜는 시계를 따릅니다. 단계는 실행 중인 작업을 기다리지 않고 마무리합니다. 앱이 프레임을 요청하거나 네이티브 애니메이션이 실행되는 동안 프레임이 연이어 오며, 각 프레임은 시계에서 한 프레임의 시간(1/60초)만큼 뒤에 옵니다. 300ms 전환은 몇 밀리초 만에 끝나며, 그 동안 만료된 타이머는 실행됩니다. 무한히 반복되는 애니메이션(스피너)은 시계와 함께 실행되며, 테스트가 시계를 움직이는 만큼 돕니다. `app.wait(ms)`과 길게 누르기는 시계를 그 시간만큼 움직입니다. 나중에 만료되는 타이머는 테스트가 시계를 그 시점까지 움직일 때만 실행됩니다. `waitFor`와 `waitUntil`는 기다리는 동안 한 디스플레이 프레임씩 시계를 움직이며 매 프레임 뒤에 확인하므로, 타이머가 보여 주는 내용이 기다리는 동안 곧 나타납니다. `waitFor("Saved", { timeout: 15_000 })`는 시계를 최대 15초까지 움직입니다. 이들의 타임아웃은 두 시계 모두에서 계산됩니다. 대기는 앱의 시계를 최대 그만큼 움직이며, 실제 시간도 그만큼 지나면 reject됩니다. 따라서 앱 바깥에서 오는 것(경로의 함수, 네트워크)에도 시스템 시계에서와 같은 시간이 주어집니다. 갤러리의 테스트는 이 방식으로 실행됩니다(`examples/gallery/tests`). 애니메이션을 기다리는 12개 테스트가 28초 대신 6초가 걸립니다.
<a id="steps"></a>

### 단계

단계는 Playwright와 같은 방식으로 작성하는 **셀렉터**로 뷰를 지정합니다:

| 셀렉터 | 일치 대상 |
|---|---|
| `id:<testID>` | 해당 `testID` 값을 가진 뷰. |
| `label:<label>` | 해당 `accessibilityLabel` 값을 가진 뷰. |
| `text:<text>` | 그 내용과 같은 텍스트(앞뒤 공백 제외), 누름을 받는 텍스트의 일부 구간(중첩된 `<Text onPress>`, `TextView`의 링크), 또는 그 내용을 담고 있는 입력, 비어 있을 때는 해당 플레이스홀더를 가진 입력. |
| `role:<role>`, `role:<role>[<name>]` | 해당 `role` (`role:button`) 및 이름을 가진 뷰. 이름은 레이블이며, 없으면 그 안의 텍스트입니다 (`role:button[Save]`). |
| `view:<id>` | `--trace` 출력에서 해당 id를 가진 뷰. |
| 그 외 모든 것 | 작성된 그대로의 `testID`, 없으면 레이블, 그것도 없으면 텍스트. |

소문자 단어와 콜론으로 시작하는 부분은 접두사(`id`, `label`, `role`, `text`, `view`)를 뜻하므로, `tapped: solo` 사용 시 접두사를 나열하는 단계 오류가 납니다. 이렇게 시작하는 텍스트, 레이블 또는 테스트 id는 접두사를 붙여 쓰며, 접두사는 나머지를 작성된 그대로 읽습니다: `text:tapped: solo`, `label:note: draft`, `id:row:2`. 새 접두사가 추가되어도 셀렉터의 의미는 유지됩니다.

`label:`, `text:` 및 역할의 이름은 정규식도 받을 수 있습니다: `text:/^Buy/i`. Rust의 `regex` crate 문법으로 작성합니다 (JavaScript의 클래스, 그룹, 앵커, 수량자를 지원하며 선형 시간에 매칭되고, 플래그는 `i`, `m`, `s`입니다). ` >> ` 부분은 앞 부분이 일치한 결과 안을 살펴보고 (`id:cart >> role:button[Remove]`), `nth=<n>` 부분은 일치 항목 중 하나를 0부터 세어 선택합니다 (`text:Delete >> nth=1`). 셀렉터는 사용자가 가장 먼저 볼 뷰를 찾습니다. 최상단 모달 안에서, 그다음 화면에서, 내비게이션 스택은 최상단 화면만 대상으로 합니다. 셀렉터는 사용자에게 보이는 것과 일치합니다. 영역을 가지고, `visibility: hidden` 바깥이며, 창과 이를 잘라내는 뷰의 안쪽에 있는 뷰 (`overflow: hidden`), 또는 사용자가 스크롤할 수 있는 스크롤 뷰의 콘텐츠 어디에나 있는 뷰로, 스크롤하면 화면에 들어옵니다 (Playwright와 마찬가지로 `opacity` 및 transform은 제외). 뷰에 동작하는 단계 (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`)는 정확히 하나의 뷰가 필요합니다. 여러 개와 일치하는 셀렉터는 단계를 실패시키며, 오류 메시지가 범위를 좁히는 방법을 알려 줍니다.

| 단계 | 설명 |
|---|---|
| `await app.press(selector)` | 뷰, 또는 그 주변에서 누름을 받는 가장 가까운 뷰(텍스트를 감싼 버튼)를 누릅니다: `onPressDown`, `onPressUp`, `onPress` 순서로 발생하며, 손가락이 내려갔다 올라가는 동작 안에서 이루어지므로 주변에서 터치를 수신하는 뷰가 이를 받습니다 (오버레이의 `onPressOutside`). 텍스트의 일부 구간은 그 글자 위에서 눌립니다 (`await app.press("Privacy policy")`). headless와 iOS, Android, 데스크톱에서 동작합니다. 같은 뷰를 500 ms 안에 한 번 더 누르면 플랫폼의 집계 방식에 따라 두 번째 클릭 (`clicks: 2`, 더블 프레스)이 됩니다. 비활성화되어 있으면 거부합니다. |
| `await app.longPress(selector)` | 뷰(또는 그 주변에서 누름이나 터치를 받는 가장 가까운 뷰) 위에 `delayLongPress` (500 ms) 동안 손가락을 올려 둡니다: `onPressDown`, `onLongPress`, `onPressUp` 순서로 발생하며, 이후 `onPress` 이벤트는 발생하지 않습니다. 터치 핸들러가 손가락을 감지합니다 (`ContextMenu` 또는 `Tooltip` 열림). |
| `await app.clear(selector)` | 입력을 비웁니다. 전체 선택 후 삭제하는 것과 같습니다. |
| `await app.type(selector, text)` | 입력(또는 뷰 안의 첫 번째 입력. 입력의 텍스트나 플레이스홀더에 일치하는 `text:` 도 가능)의 기존 내용 끝에 한 키씩 입력합니다. 먼저 포커스를 받고, 각 문자는 `onKeyPress` 및 `onChange` 로 전달되며, `maxLength` 이내에 끝납니다. 한 줄 입력에서 리턴 키는 `\n` 입니다. |
| `await app.submit(selector)` | 입력에서 리턴 키를 누릅니다. 동작은 입력의 `submitBehavior` 설정에 따릅니다: `onSubmit` (한 줄 입력에서는 포커스가 벗어남), 또는 여러 줄 입력에서는 줄바꿈. |
| `await app.scroll(selector, distance)` | 스크롤 뷰나 리스트(해당 뷰, 그 주변의 것, 또는 그 안의 첫 번째 것)를 축을 따라 `distance` 포인트만큼, 프레임당 10포인트씩 드래그합니다. 콘텐츠 범위 안에서, 사용자가 할 수 있는 방식으로 이루어집니다 (`scrollable`). 음수면 반대로 스크롤합니다. |
| `await app.hover(selector)` | 마우스를 뷰의 중앙 위로 이동합니다. 그 아래에 있던 뷰 중 마우스가 벗어난 뷰는 `onMouseLeave` 이벤트를 받고, 새로 올라온 뷰는 `onMouseEnter` 이벤트를 받으며 `hover:` 스타일이 적용되고, 이를 수신하는 뷰는 마우스 위치와 눌린 버튼이 없다는 정보가 담긴 `onMouseMove` 이벤트를 받습니다. 데스크톱과 모든 너비의 웹(폰 방식의 브라우저 포함)에서 동작합니다 (headless: 데스크톱 또는 `"web"` `platform`). iOS나 Android 폰에는 마우스가 없으므로 거부합니다. |
| `await app.rightClick(selector)` | 마우스의 보조 버튼을 뷰의 중앙 위에서 누릅니다: 해당 뷰, 또는 이를 수신하는 가장 가까운 주변 뷰가 `onContextMenu` 이벤트를 받습니다. 데스크톱과 웹에서 동작합니다 (headless: 데스크톱 `platform`). 폰에는 마우스가 없으므로 거부합니다. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | 클립보드에 해당 내용이 있을 때 사용자가 붙여넣는 것처럼 입력에 붙여넣습니다. 입력이 포커스를 받고 `onPaste` 이벤트를 받으며 (`html`: 서식을 포함한 같은 내용, `files`: 바이트를 `File` 형태로 받게 되는 경로, `uris` `file:`: URL), 이후 텍스트가 `pasteBehavior` 설정에 따라 입력됩니다. headless, macOS, iOS, 웹에서 동작하며, 머신의 클립보드는 그대로 유지됩니다. |
| `app.menu()` | 앱이 표시하는 컨텍스트 메뉴의 액션 (`Menu.popup`): `label` (서브메뉴 항목은 서브메뉴 자신의 항목 뒤에 옴, `"Share > Mail"`), `disabled`, 체크 가능한 항목은 `checked`. 열린 메뉴가 없으면 `null`. |
| `await app.chooseMenuItem(label)` | 열려 있는 컨텍스트 메뉴의 액션을 클릭한 것처럼 선택합니다. 앱이 `onMenu` 이벤트를 받고 (해당 항목의 `onSelect` 실행), 이후 메뉴가 닫힙니다. 항목이 비활성화되어 있거나 없으면 거부합니다. |
| `await app.closeMenu()` | 아무것도 선택하지 않고 열린 컨텍스트 메뉴를 닫습니다. Escape를 누르는 것과 같습니다. |
| `await app.keyboard.press(keys)` | 하드웨어 키보드에서 수정 키와 함께 키를 누릅니다. 키 이름은 `keymap` 이 정한 표기를 따르며 (`"mod+k"`, `"shift+/"`, `"escape"`. 플랫폼의 command 키는 `mod`), 모든 플랫폼에서 동작합니다 (폰과 태블릿도 하드웨어 키보드를 쓸 수 있음). 처리 순서는 다음과 같습니다. 앱의 해당 단축키가 있으면 그것이 받고 (`keymap.bind`, `onKeyCommand`), 없으면 macOS와 웹에서 Tab과 Shift+Tab이 입력과 누름을 받는 뷰 (`onFocus`, `onBlur`, `focus:` 스타일) 사이에서 키보드 포커스를 옮기고 Return이나 Space는 포커스가 있는 뷰를 누르며, 그것도 아니면 포커스된 입력이 문자, Backspace 또는 리턴 키를 받고, 그것도 아니면 Escape는 뒤로 갑니다. |
| `await app.keyboard.down(keys)` / `up(keys)` | 수정 키 (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, `+` 로 연결)를 `up` 까지 누른 채로 유지합니다. 그동안의 누름, 드래그, 호버에 수정 키가 함께 적용되며, Mod-클릭이나 Shift-드래그와 같습니다. 현재는 headless와 Linux에서만 동작합니다. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | `drag` 처럼 드래그하고 `drop()` 까지 손가락을 누른 채로 유지하다가, 그 시점의 위치에서 뗍니다. 그 사이의 단계에서 드래그 도중의 화면(드래그 미리보기, 드롭 라인)을 확인할 수 있습니다. 현재는 headless와 Linux에서만 동작합니다. |
| `await app.dropFiles(selector, uris)` | 로컬 파일(파일 관리자가 드래그할 때처럼 `file:` URL)을 뷰의 중앙에 드롭합니다. 해당 뷰, 또는 이를 수신하는 가장 가까운 주변 뷰가 `onFileDrop` 이벤트를 받습니다. 현재는 데스크톱, headless, Linux에서 동작합니다. |
| `await app.drag(selector, { x, y })` | 손가락이 뷰의 중앙에 닿아 100 ms 동안 머문 뒤 (`x`, `y`) 포인트만큼 프레임당 10포인트씩 이동하고 떨어지며, 플랫폼의 입력이 받아들이는 방식 그대로입니다. 팬이 뒤따르고 (`pan={{ x, y }}`, `onPanStart`, 손을 뗄 때의 속도가 담긴 `onPanEnd`), 터치를 수신하는 뷰가 이를 받으며 (`onTouchStart`, `PanResponder`), 스크롤 뷰는 따라 스크롤되고 위쪽 끝을 충분히 넘겨 당기면 새로고침되며 (`onRefresh`), 그 아래의 누름은 손가락이 멀어지면 취소됩니다. 데스크톱과 웹에서는 마우스로 동작합니다. |
| `await app.wait(ms)` | 앱을 `ms` 밀리초 동안 실행합니다: 타이머, 애니메이션, 요청. 수동 클록에서는 클록을 `ms` 만큼 움직입니다 (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | 뷰가 일치하면 resolve되며, 일치하는 뷰가 없어지면 `{ state: "gone" }` 값으로 resolve됩니다. `timeout` ms (5000) 뒤에는 거부합니다. 수동 클록에서는 기다리는 동안 디스플레이 프레임 단위로 클록을 움직이며, 최대 `timeout` 까지 움직입니다. |
| `await app.waitUntil(condition, options?)` | `condition()` 의 반환값이 true가 되면 resolve되며, 앱이 바뀔 때마다 다시 확인합니다. 셀렉터로 표현할 수 없는 조건에 사용합니다 (`() => app.storage().note === "Milk"`). 수동 클록에서는 두 번 확인하는 사이에 클록을 디스플레이 프레임 하나씩 움직이며, 최대 `timeout` 까지 움직입니다. |
| `app.shows(selector)` | 뷰가 지금 일치하는지 여부. |
| `app.count(selector)` | 지금 일치하는 뷰의 개수. |
| `app.enabled(selector)` | 뷰가 입력을 받을 수 있는지 여부: 해당 뷰도 주변 뷰도 비활성화되지 않았고, 입력이 `readonly` 상태가 아님. |
| `app.texts()` | 지금 화면에 있는 텍스트를 순서대로. |
| `app.value(selector)` | 입력의 텍스트이며, 일치하는 입력이 없으면 `null`. |
| `app.spanStyle(selector)` | 일치한 첫 번째 문자의 확정된 스타일. headless와 모든 `--target` 에서 동작합니다: `color`, 선택 항목 `backgroundColor`, `fontSize`, `fontWeight`, `italic`, `underline`, `lineThrough`. 색상은 `#rrggbbaa` 형식이며, 크기는 포인트 단위입니다. |
| `app.storage()` | 앱의 저장소가 지금 담고 있는 내용. |
| `await app.back()` | 사용자처럼 뒤로 갑니다 (헤더의 뒤로 버튼, 시트를 아래로 스와이프). 가장 최근 모달의 가장 안쪽 스택, 모달이 없으면 화면의 가장 안쪽 스택이 최상단 화면을 pop하거나 (`onDismiss`), 그 화면에 `preventBack` 설정이 있으면 화면에 물어봅니다 (`onBackRequest`). 스택이 없으면 가장 최근 모달이 닫기를 요청합니다 (`onRequestClose`). 뒤로 갈 곳이 없으면 거부합니다. |
| `app.onDialog(handler)` | 지금부터 앱이 표시하는 대화상자 (`Alert.alert`, 액션 시트)에 응답합니다: `handler` 에 대화상자 (`title`, `message`, `buttons`, `cancelable`, `sheet`)가 전달되고, 누를 버튼의 텍스트를 반환하거나 버튼 없이 닫으려면 `null` 를 반환합니다. |
| `app.dialogs()` | 앱이 표시한 대화상자를 순서대로. |
| `app.onPick(handler)` | 지금부터 앱이 요청하는 선택(pick)에 응답합니다 (`Picker.pickImages`): `handler` 에 선택 요청의 내용 (`multiple`, `limit`, `maxDimension`, `quality`, `format`)이 전달되고, 사용자가 고른 파일 (`{ name, type?, data: Uint8Array }`, 앱에 그대로 전달됨)을 반환하거나 취소하려면 `null` 를 반환합니다. 핸들러가 없으면 선택은 취소됩니다. headless 실행에서 동작합니다. |
| `app.picks()` | 앱이 요청한 선택을 순서대로. |
| `app.hear(text)` | 실행 중인 음성 세션에 사용자가 `text` 을 말합니다 (`Speech.start`). 세션의 `result` 은 지금까지의 전체 전사본으로 `text` 을 보고합니다. headless 실행에서 동작합니다. |
| `app.endSpeech(error?)` | 실행 중인 음성 세션을 종료합니다. `error` (`"no-speech"`, `"network"`, ...)을 지정하면 세션이 실패하고, 그렇지 않으면 마지막 최종 결과와 `end` 이 오며, 아무것도 들리지 않았을 때는 `no-speech` 입니다. headless 실행에서 동작합니다. |
| `app.speechRequests()` | 앱이 시작한 음성 세션을 순서대로: `lang` (사용자 것은 `null`) 및 `interim`. |
| `app.clipboard()` | 지금 클립보드에 있는 텍스트이며, 텍스트가 없으면 `null`. |
| `app.requests()` | 앱이 보낸 요청을 순서대로: `method`, `url`, `headers`, `body`. |
| `await app.host.send(name, data?)` | 호스트 앱의 이벤트를 앱에 보내고 (`host.on`), 조용해질 때까지 기다립니다. [호스트 앱 시뮬레이션하기](#playing-the-host-app)를 참고하세요. |
| `app.host.calls()`, `app.host.posts()` | 앱이 보낸 호출과 포스트 중 `open` 의 `host.handlers` 에 도달한 것을 순서대로: `name`, `data`. |
| `app.openedUrls()` | 앱이 연 URL (`openUrl`)을 순서대로. 기록만 하고 실제로 열지는 않습니다. |
| `await app.setViewport(width, height)` | 뷰포트 크기를 조정합니다. 기기를 회전하거나 창 크기를 조절하는 것과 같습니다 (`windowSize()`). |
| `await app.setColorScheme(scheme)` | 사용자가 하듯 시스템의 외관을 `"light"` 또는 `"dark"` 로 전환합니다. |
| `await app.setLifecycle(state)` | 앱을 `"background"`, `"inactive"` 또는 `"active"` 상태로 전환합니다. 사용자가 앱을 떠나거나 다른 앱이나 창으로 전환했다가 돌아올 때 시스템이 하는 것과 같습니다 (`lifecycle()`). headless 실행에서만 동작합니다. |
| `await app.screenshot(path?)` | 앱 창을 PNG 이미지 (`Uint8Array`)로 캡처합니다. `path` 이 주어지면 이 머신의 해당 경로(현재 디렉터리 기준)에도 저장합니다. 앱을 실제로 그리는 것은 실제 플랫폼뿐입니다. [실제 플랫폼에서](#on-a-real-platform)를 참고하세요. |

단계는 앱이 100 ms 동안 아무것도 렌더링하지 않고 스스로 끝나는 네이티브 애니메이션이 실행 중이지 않을 때 resolve됩니다 (계속 렌더링하는 앱은 최대 2초, 수동 클록에서는 앱 시간으로도 2초). 따라서 다음 줄이 실행될 때 단계가 바꾼 내용이 화면에 반영되어 있습니다. 나중에 일어나는 일(응답, 타이머)에는 `waitFor` 를 사용하세요. 수동 클록에서는 단계가 그 100 ms를 기다리지 않습니다. 단계와 클록의 시간으로 실행 시점이 도래한 모든 작업(지금 만료된 타이머, 프로미스, 즉시 응답하는 스텁 응답)을 앱이 실행하고 프레임을 요청하지 않으면, 요청이 아직 진행 중인 경우를 제외하고 즉시 resolve됩니다. 따라서 수동 클록의 테스트는 단계 사이에 멈춤 없이 실행됩니다. 다른 스레드가 응답하는 것 (`nsh/host` 호출, 파일 읽기, 스레드에서 실행되는 Rust 작업)은 단계가 resolve된 뒤에 도착하므로, `waitFor` 로 그것이 보여 주는 내용을 기다리세요. 로딩 스피너처럼 무한히 반복되는 애니메이션은 브라우저 테스트의 무한 CSS 애니메이션처럼, 단계와 `waitFor` 가 진행되는 동안 백그라운드에서 계속 실행됩니다. 단계는 셀렉터와 일치하는 것이 없거나 (오류에 화면의 텍스트 목록이 표시됨), 그동안 앱이 예외를 던졌거나, 앱이 실제 플랫폼만 답할 수 있는 것을 요청한 경우 거부되며 테스트가 실패합니다.

테스트가 예상할 수 있는 실패에는 `code` 가 붙으며 이 값은 그대로 유지됩니다. 메시지는 사람을 위한 것이며 바뀔 수 있으므로, 테스트는 코드를 기준으로 일치시켜야 합니다:

| `code` | 단계 또는 쿼리 |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | 화면에 셀렉터와 일치하는 것이 없거나, 열린 메뉴에 그런 항목이 없습니다. |
| `ERR_NSH_TEST_DISABLED` | 셀렉터가 가리키는 뷰가 비활성화되어 있습니다 (사용자가 스크롤할 수 없는 스크롤 뷰, 비활성화된 메뉴 항목). |
| `ETIMEDOUT` | `waitFor` 또는 `waitUntil` 실행 시간이 초과되었거나, `open` 이후 앱이 아무것도 렌더링하지 않았습니다. |
| `ERR_NSH_TEST_NO_BACK` | `back()` 실행 시 뒤로 갈 곳이 없습니다. |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` 에 `--target` 옵션과 함께 대상 플랫폼이 지원할 수 없는 옵션이 전달되었습니다: iOS와 Android에서의 `width` 또는 `height`, 데스크톱이나 웹에서의 폰용 `platform`, iOS나 Android에서의 데스크톱용 또는 다른 폰용 옵션, `host.handlers`. 메시지에 해당 옵션이 명시됩니다. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` 은 중첩된 `<Text testID="guide">` 를 읽고, `text:word` 는 그 일치 항목의 첫 번째 문자를 읽습니다. 쿼리의 범위는 `id:note >> text:word` 로 한정하고, 반복되는 일치 항목은 `>> nth=0` 로 선택하세요. 쿼리는 구간이 없거나, 모호하거나, 비어 있으면 오류를 보고합니다. 구간의 `testID` 를 갱신하면 텍스트 레이아웃을 재사용하고 `onTextLayout` 콜백 횟수를 유지합니다.
<a id="what-headless-runs-play-of-the-platform"></a>

### 헤드리스 실행이 플랫폼 대신 수행하는 것

헤드리스 실행에는 실제 런타임은 있지만 플랫폼은 없습니다. NSH의 프로토콜이 정의하는 플랫폼의 역할은 수행하지만, 실제 플랫폼만 할 수 있는 일은 하지 않습니다.

- **네이티브 애니메이션은 끝까지 프레임 단위로 실행됩니다**: `start(callback)` 콜백이 실행되고, 그것을 기다리는 작업도 실행됩니다. 끝없이 반복되는 루프는 앱이 멈출 때까지 실행됩니다.
- **뒤로 가기**는 플랫폼처럼 화면을 pop하고 모달을 닫습니다(`app.back()`).
- **다이얼로그에는 응답이 주어집니다**: 테스트의 `onDialog`가 응답하고, 없으면 취소 버튼이 응답하며, 그것도 없으면 닫을 수 있는 경우 닫힙니다. 다른 버튼으로만 응답할 수 있는 다이얼로그는 테스트가 어느 버튼을 누를지 지정할 때까지, 그 다이얼로그를 띄운 단계를 실패시킵니다.
- **클립보드는 텍스트를 보관합니다**: 앱이 복사한 내용을 붙여넣을 때 다시 읽습니다(`clipboard`로 초기 텍스트를 지정할 수 있습니다).
- **페이지의 호스트가 `host`에 응답합니다**: 앱의 `nsh.json`가 `web.host`에 호스트를 지정한 경우입니다([페이지의 호스트](#the-pages-host)).
- **앱은 자신의 capabilities 아래에서 실행됩니다**: `nsh.json`가 `capabilities`에 선언한 것은 실제 기기에서처럼 강제되므로, 선언하지 않은 것은 거부됩니다.
- **URL은 기록됩니다**: 앱이 연 URL은 열린 것으로 보고되며 `app.openedUrls()`가 이를 나열합니다.
- **선택(pick)에는 응답이 주어집니다**: 테스트의 파일(`onPick`)로 응답하고, 없으면 취소되므로 `Picker.pickImages`는 `[]`로 resolve됩니다.
- **음성은 테스트가 제어합니다**: `Speech.available()`는 `true`로 resolve되고, 세션은 즉시 시작되어 `hear`가 지정한 내용을 듣습니다.
- **모달은 즉시 표시됩니다**: 모달이 표시되면 `onShow`가 발생합니다.
- **이미지는 로드되지 않습니다**: `onLoad`나 `onError`가 오지 않으며, `Image.getSize`와 `Image.prefetch`는 reject됩니다.
- **실제 플랫폼만 응답할 수 있는 것은 단계를 실패시킵니다**: 클립보드의 이미지나 파일이 그렇습니다.

<a id="the-pages-host"></a>

### 페이지의 호스트

웹에 게시된 앱은 페이지로부터 호스트를 얻습니다: `nsh.json` `web.host`, 즉 `createHost(player)`를 export하는 모듈입니다([Web](./web.md#the-hosts-functions)). 헤드리스 실행은 테스트가 여는 각 앱에 대해, 앱이 시작되기 전에 그 모듈을 자체 JavaScript 컨텍스트에서 로드합니다(타이머와 `console`만 있고 브라우저의 것은 없으며 import도 없습니다). 그 `call`는 앱의 [`host.call`](../modules/nsh.md#host)에 응답하고, `player.hostEvent`는 `host.on`에 도달하며, `host.available()`는 `true`입니다. throw하거나 reject하거나 JSON이 아닌 값을 반환하는 `call`는 페이지에서처럼 그 메시지와 함께 앱의 호출을 reject하고, 앱이 시작되기 전에 보낸 이벤트는 앱이 시작된 뒤 최상위 리스너에 도달합니다. `--web-host <module>`는 다른 모듈을 지정합니다. 앱의 `capabilities.host`는 페이지에서처럼 앱이 호출하는 것을 나열해야 합니다. 호출의 타임아웃과 호스트 자체의 타이머는 앱의 시간 위에서 실행되므로 수동 시계가 이를 움직입니다(`app.clock.runFor`). 브라우저(`--target web`)에서는 개발 페이지가 게시된 페이지처럼 각 앱에 대해 `nsh.json`의 `web.host`를 실행하며, 다른 플랫폼(`--target`)에서는 앱에 호스트가 없습니다: `host.available()`는 `false`입니다.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo`에는 앱, 그 호스트, 그리고 그 테스트가 있습니다.

### Expectations

`expect(value)`는 Jest처럼 값을 검사하되 JS가 만든 그대로 검사합니다: `toBe`는 `Object.is`이고, `toEqual`는 멤버별로 비교하며, `Date`, `Map`, `Uint8Array`는 그 자체로 비교됩니다. 각 검사는 성립하지 않으면 throw합니다. `.not`는 검사를 뒤집습니다: `expect(app.texts()).not.toContain("Error")`. 함수가 주어지면 `toThrow`는 그 함수를 호출할 때 throw되는 것을 검사하고, promise나 promise를 반환하는 함수가 주어지면 `rejects`와 `resolves`는 Jest처럼 그것이 settle되는 값을 검사합니다: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| 검사 | 성립하는 경우 |
|---|---|
| `toBe(expected)` | 값이 `expected`입니다. `Object.is`가 말하는 대로, 같은 primitive(`NaN`는 `NaN`, `0`는 `-0`가 아님)이거나 같은 객체입니다. |
| `toEqual(expected)` | 값이 `expected`와 멤버별로 같습니다. Jest의 `toEqual`처럼, 객체는 자신의 enumerable 프로퍼티로 비교하고(`undefined`인 프로퍼티는 없는 것으로 칩니다), 배열은 항목별로, 날짜는 시간으로, 정규식은 source와 flags로, map과 set은 순서와 관계없이 엔트리로, `ArrayBuffer`와 typed array는 바이트로, 에러는 이름과 메시지로 비교합니다. `NaN`는 `NaN`와 같습니다. 클래스의 인스턴스는 같은 프로퍼티를 가진 일반 객체와 같습니다. |
| `toMatchObject(subset)` | 값이 `subset`의 모든 프로퍼티를 가지며 각각 `toEqual`가 말하는 대로 같고, 그 안의 객체도 차례로 일치합니다. 다른 프로퍼티는 보지 않으며, 배열은 항목별로 전부 일치해야 합니다. |
| `toContain(item)` | 배열, `Set`, typed array 또는 다른 iterable이 `item`(`===`)를 포함하거나, 문자열이 그것을 포함합니다. |
| `toContainEqual(item)` | 배열, `Set` 또는 다른 iterable이 `item`와 같은 항목을 가집니다. `toEqual`가 말하는 대로입니다. |
| `toBeTruthy()`, `toBeFalsy()` | 값이 JS 기준으로 truthy / falsy입니다. |
| `toMatch(pattern)` | 문자열이 `pattern`(문자열)를 포함하거나, 그것(`RegExp`, JS 엔진이 실행하므로 look-behind, backreference, named group이 JavaScript에서처럼 동작합니다)과 일치합니다. |
| `toHaveLength(n)` | 값의 `length`이 `n`입니다. 문자열은 UTF-16 단위, 배열이나 typed array는 항목 수입니다. |
| `toBeNull()` | 값이 `null`입니다. |
| `toBeUndefined()`, `toBeDefined()` | 값이 `undefined` / 그 외의 것입니다. |
| `toBeNaN()` | 값이 `NaN`입니다. |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | 숫자가 `n`와 그렇게 비교됩니다. |
| `toThrow(expected?)` | `expect(fn)`: `fn`를 호출하면 throw됩니다. `expected`가 주어지면 에러가 그것과 일치합니다. 메시지가 문자열을 포함하거나 `RegExp`와 일치하고, 에러 클래스(`TypeError`, 앱의 클래스)는 에러의 `name`이며 `Error`는 모든 에러와 일치하고, 에러는 같은 메시지를 가집니다. |
| `rejects.toThrow(expected?)` | `expect(promise)`: promise가 reject되며, 에러가 `toThrow`가 말하는 대로 `expected`와 일치합니다. |
| `rejects.toMatchObject(subset)` | `expect(promise)`: promise가 `toMatchObject`가 말하는 대로 `subset`와 일치하는 값으로 reject됩니다. 에러 자신의 프로퍼티(`code`, `permission`, ...)와 그 `name` 및 `message`가 대상입니다. |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)`: promise가 검사를 만족하는 값으로 resolve됩니다. |

실패한 검사는 받은 값과 기대한 값을 JS가 쓰는 방식 그대로 알려 줍니다:
`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

`rejects`와 `resolves`에도 고유의 `.not`가 있습니다: `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### 실제 플랫폼에서

`nsh test --target macos`(또는 `linux`, `windows`, `gpui`, `web`, `ios`, `android`)는 같은 테스트를 헤드리스 대신 플랫폼의 개발 호스트에서 실행합니다. 각 `open`는 새 데이터 디렉터리와 함께 앱을 자체 창에서 시작하며, 단계는 브라우저에서 Playwright가 하듯 선택자가 지정하는 뷰에 플랫폼 고유의 입력으로 동작합니다.

- 누르기는 뷰의 가운데를 클릭하는 것이고, 길게 누르기는 클릭을 유지하는 것이며, `type`는 입력을 클릭하고 그 키를 입력하고, `scroll`는 스크롤 뷰 위의 트랙패드 제스처이며, `back`는 사용자가 하는 동작입니다(macOS와 Linux에서는 Escape, Windows와 GPUI에서는 마우스의 뒤로 버튼, 웹에서는 브라우저의 뒤로 버튼, 시트는 아래로 스와이프, iOS에서는 메뉴, 팝오버 또는 `Sheet`가 열려 있는 동안 VoiceOver의 escape 제스처, 그 외에는 헤더의 뒤로 버튼, Android에서는 뒤로 버튼);
- 화면 밖의 뷰는 먼저 한 번에 한 제스처씩 스크롤하여 화면 안으로 가져옵니다. 터치 스크린에서는 사용자가 스크롤할 때처럼, 드래그를 따르는 뷰(슬라이더, 그리기 영역) 옆의, 페이지 자체가 손가락을 받아 주는 위치에 손가락이 닿습니다.
- 선택자, 대기, 쿼리는 호스트가 그린 것으로 만들어진 헤드리스 실행과 같은 앱 모델을 보므로, 같은 뷰를 찾습니다.
- 다이얼로그는 플랫폼 고유의 것입니다: `app.dialogs()`가 이를 읽고, 응답(`onDialog`, 또는 테스트가 아무 말도 하지 않으면 취소 버튼)은 그 버튼을 누릅니다.
- `app.screenshot(path)`는 창의 사진을 찍습니다.

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

창은 화면 안에서 뷰포트 크기(`open`가 달리 지정하지 않으면 390 × 844)로 열리며, iOS와 Android에서는 앱이 기기 화면을 기기의 크기로 채웁니다. 앱은 대상의 플랫폼으로 실행됩니다(`platform.os`). 수동 `clock`는 헤드리스에서처럼 동작합니다. `app.clock.runFor`, `fastForward`, `setSystemTime`는 앱의 시간을 즉시 움직이고(타이머, 한 프레임 간격의 `requestAnimationFrame`, `Date`), `app.wait(ms)`, `waitFor`, `waitUntil`도 시간을 움직이며, 플랫폼이 보여 주는 각 프레임은 시간을 한 프레임(1/60초) 움직이므로 앱이 애니메이션하는 동안 앱의 시간이 흐릅니다. 플랫폼 자체의 애니메이션과 라우트의 `delay`는 실제 시간이 걸립니다. 앱의 요청은 헤드리스에서처럼 테스트에 도달합니다. `network` 라우트가 응답하고, 어떤 라우트와도 일치하지 않는 요청은 실패하며, `"live"`는 요청을 호스트의 네트워크로 통과시키고, `app.requests()`는 모든 요청을 나열합니다. 소켓과 WebSocket은 `"live"`가 있으면 호스트의 네트워크에 연결되고, 없으면 헤드리스에서처럼 거부됩니다. `storage`는 앱이 시작될 때 앱의 스토리지에 들어 있고, `app.storage()`는 앱에서 이를 읽습니다. `locale`, `reducedMotion`, `safeArea`는 `open`가 값을 줄 때(기본값 포함) 플랫폼이 보고하는 값을 담고, 그것이 주는 `colorScheme`는 시스템의 외관(`"light"`도)을 전환합니다. 생략된 것은 플랫폼의 값이 되며, 앱의 클립보드 호출은 테스트 자체의 클립보드에서 처리되므로(`clipboard`는 처음에는 그 텍스트이고 `app.clipboard()`가 이를 읽습니다) 머신의 클립보드는 그대로 유지됩니다. 텍스트 입력 자체의 복사와 붙여넣기는 시스템의 것을 사용합니다. `host.params`는 앱에 도달하고, `app.host.send`는 이벤트를 보내며, 앱이 여는 URL은 열리는 대신 `app.openedUrls()`를 위해 기록됩니다. `host.handlers`는 헤드리스로 실행되며, 여기서는 테스트가 앱의 호출에 응답합니다. `open`는 대상에 맞춰 옵션을 검사합니다. iOS와 Android에서 `width`와 `height`, 다른 종류의 기기의 `platform`(데스크톱이나 웹에서의 휴대폰 것, iOS나 Android에서의 데스크톱 것 또는 다른 휴대폰 것), `host.handlers`는 `ERR_NSH_TEST_UNSUPPORTED`와 함께 reject되므로, 테스트는 작성된 그대로 실행되거나 필요한 것을 알려 줍니다. 데스크톱의 `platform`(데스크톱의 마우스와 키는 `"macos"`)는 모든 데스크톱 대상과 웹에서 실행되며, 그 대상의 플랫폼으로, 그리고 항상 데스크톱으로 실행됩니다. 브라우저에서는 너비와 관계없이 페이지가 데스크톱 방식(idiom)으로 시작하며, `platform` 없이(또는 `"web"`와 함께) 실행하면 브라우저가 하듯 방식을 측정합니다(너비 600 포인트부터 데스크톱). 자체 Rust crate가 있는 앱은 그 crate와 함께 빌드된 개발 호스트에서 실행되며, 이는 NSH가 플랫폼용으로 빌드합니다. Rust 앱의 호스트는 자신의 루트를 실행하므로 `open(".")`는 헤드리스에서처럼 거기서 앱을 시작합니다.

웹에서 앱은 개발 호스트의 페이지에서 헤드리스 Chrome, Edge 또는 Chromium으로 실행됩니다. 이 머신에 설치된 것이거나 `--browser <PATH>`가 지정하는 실행 파일입니다(브라우저가 필요하며, 찾지 못하면 `nsh test`가 찾아본 위치를 알려 줍니다). 하나의 브라우저가 실행 전체를 담당하며, 각 `open`는 자체 스토리지를 가진 페이지를 얻습니다. 입력은 사용자의 입력처럼 브라우저의 신뢰된 입력으로, 마우스 클릭, 휠 스크롤, 키입니다.

iOS에서 앱은 iOS 시뮬레이터의 개발 호스트에서 실행됩니다. 이미 부팅된 시뮬레이터를 쓰고, 없으면 가장 새로운 iPhone을 `nsh test`가 부팅합니다. 단계는 UIKit이 기기에서 받는 그대로의 손가락 터치와 소프트웨어 키보드 입력입니다. `setColorScheme`는 시뮬레이터의 외관을 전환하며 `nsh test`가 앱 실행 후 되돌려 놓고, 화면은 시뮬레이션된 기기의 크기를 가집니다.

Android에서 앱은 `adb devices`가 나열하는 첫 번째 기기 또는 에뮬레이터의 개발 호스트에서 자체 스토리지와 함께 실행됩니다. 단계는 앱의 뷰가 기기에서 받는 그대로의 손가락 터치와 키보드 키입니다. `back`는 시스템의 뒤로 가기입니다. `setColorScheme`는 기기의 다크 테마를 전환하며 `nsh test`가 앱 실행 후 되돌려 놓습니다.

<a id="steps-from-standard-input"></a>

### 표준 입력으로 단계 주기

테스트 대신 앱의 진입점이 주어지면 `nsh test`는 앱을 실제 네트워크에서 열고 1.2초 동안 실행한 뒤, 표준 입력이 주는 단계를 `app` 앱에 대해 수행합니다.

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

1.2초는 첫 단계 전에 엔진의 유휴 가비지 컬렉션이 실행되게 하므로, 아직 사용 중인 것을 놓아 버리는 앱은 이를 드러냅니다. 그 앱의 핸들러가 동작하지 않게 됩니다.

예제에는 시작점이 될 테스트가 있습니다. Rust 앱용 `examples/gallery-rs`(`cargo test`, 데모당 모듈 하나, 그리고 `App.test.tsx`), Rust crate가 있는 앱용 `examples/rust-exports`, 그리고 TSX 앱용 `examples/counter`와 `examples/gallery/tests`(스토리지, 입력, 긴 목록, 스텁 요청, 다크 모드, 수동 시계)입니다.

<a id="tracing-with---trace"></a>

## --trace로 추적하기

`--trace`는 테스트가 여는 앱의 모든 마운트 배치를 그것이 들어온 단계 아래에 출력하고, 모든 커밋의 시간도 출력합니다. Rust에서는 테스트가 같은 것을 출력합니다. `observe`가 각 배치를 단계와 함께 넘겨주고, `EngineConfig::trace`는 `perf` 줄을 `log` crate를 통해 로그로 남깁니다(타깃 `nsh::perf`, 테스트에서 `env_logger` 같은 로거를 설치하세요).

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test`는 테스트 파일에 `--trace`를 받거나, 표준 입력의 단계와 함께 앱의 진입점에 받습니다.

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

`--target`를 사용하면 추적은 플랫폼의 것이 됩니다. 호스트가 적용한 배치를 그것을 가져온 단계 아래에 보여 주고, 각 커밋과 이벤트에 대한 호스트 자체의 측정 시간을 기기의 하드웨어에서 보여 줍니다.

다음 용도로 사용하세요.

- 앱(또는 데모)이 오류 없이 빌드, 평가, 렌더링되는지 확인
- 변경이 어떤 네이티브 뷰를 생성, 이동, 업데이트하는지, 그리고 몇 개인지 정확히 확인
- 첫 프레임, 탭, 각 스크롤 프레임의 비용 측정
- CI에서 회귀 포착
<a id="reading-the-output"></a>

### 출력 읽기

다음은 카운터 예제에서 버튼을 한 번 누른 결과이며(`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), 일부를 생략했습니다:

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

#### 배치와 마운트 아이템

각 `── step: N items` 블록은 하나의 **마운트 배치(mount batch)**이며, 그 배치가 들어온 단계 아래에 표시됩니다. 한 프레임 동안 플랫폼이 네이티브 뷰에 적용하는 모든 작업을 메인 스레드로 한 번에 전달한 것입니다. 블록 안의 각 줄은 **마운트 아이템(mount item)**입니다:

| 아이템 | 의미 |
|---|---|
| `Create { id, kind }` | 네이티브 뷰를 생성합니다 (`View`, `Text`, `Image`, `Scroll`, ...). |
| `Insert { parent, child, before }` | 뷰를 부모에 넣습니다. 형제 뷰의 앞에 삽입합니다 (`None`: 맨 끝). |
| `Remove` / `Delete` | 뷰를 부모에서 분리합니다 / 해제합니다. |
| `ViewStyle { id, style }` | 뷰의 장식: 배경, 테두리, 둥근 모서리, 그림자, 불투명도, 변형(transform) 등. |
| `ViewProps { id, props }` | 터치 및 접근성 설정, `testID`. |
| `Events { id, events }` | 뷰가 보고하는 이벤트 (`EventMask(1)`는 press). |
| `Frame { id, x, y, w, h }` | 부모 안에서의 위치와 크기(포인트 단위). |
| `Text { id, text, content }` | 텍스트 뷰에 대해 레이아웃이 끝난 텍스트. |
| `Image { id, source, ... }` | 로드할 이미지. |

변경된 부분만 전송됩니다. 숫자 하나를 바꾸는 탭은 `Text` 아이템 하나만 보내고, 뷰에는 기본 스타일이나 빈 이벤트 마스크가 없으며, 변경되지 않은 프레임은 전송되지 않습니다. 새로운 행이 나타나지 않는 스크롤 프레임은 **배치를 전혀 만들지 않습니다**.

<a id="the-762-lines"></a>

#### `perf` 줄

| 줄 | 의미 |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | 번들링 시간과 번들 크기 (개발 설정). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | 커밋 한 번: JS가 큐에 넣은 작업 수, 코어가 사용한 시간(컴포넌트 렌더링, 레이아웃, diff), 리스트 행을 바인딩하는 데 쓴 JS 시간, 생성된 마운트 아이템, 살아 있는 노드 수. |
| `turn: 2640µs (timers and tasks 1964µs)` | 커밋이 일어난 턴: 전체 소요 시간과, 커밋 전에 JS 타이머와 Rust 컴포넌트 태스크가 사용한 시간 (Rust 컴포넌트는 커밋 중에 렌더링됩니다). |
| `first frame: eval 271µs, total 1235µs` | 번들을 평가하는 데 걸린 시간, 그리고 시작부터 첫 번째 배치까지 걸린 시간. |
| `event Press on view 20` / `event js: 196µs` | 디스패치된 이벤트, 그리고 JS에서 해당 핸들러(와 그로 인해 발생한 작업)가 소요한 시간. |

> [!NOTE]
> 헤드리스 환경에서는 텍스트를 근사 텍스트 엔진으로 측정하므로, CoreText 또는 Android의 텍스트 레이아웃을 사용하는 실제 기기와 텍스트 크기가 조금 다릅니다. 레이아웃 로직, 뷰 개수, 오퍼레이션 개수는 동일합니다.

단일 실행의 시간은 CPU 클럭 상태에 크게 좌우됩니다(유휴 상태에서 막 깨어난 머신은 느립니다). 같은 머신에서 실행한 결과끼리 비교하고, 여러 번 실행한 값 중 최솟값을 보며, 마이크로초보다는 오퍼레이션 및 아이템 개수를 더 신뢰하세요.

<a id="scrolling"></a>

### 스크롤

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll`는 초당 60프레임으로 프레임마다 리스트를 10포인트씩 움직이며, 각 프레임의 배치가 출력됩니다:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

[list](./lists.md)에서는 가상화(virtualization)가 동작하는 모습을 볼 수 있습니다. 어떤 프레임에서 새 행이 바인딩되는지, 행 하나에 오퍼레이션이 몇 개 드는지, 새 행이 나타나지 않는 프레임은 아무것도 만들지 않는다는 점을 확인할 수 있습니다. 의미 있는 시간 측정을 위해 릴리스 빌드(`cargo test --release`, 또는 체크아웃한 저장소에서는 `./target/release/nsh`)와 함께 사용하세요.

<a id="in-ci"></a>

### CI에서

헤드리스 테스트는 기기나 디스플레이가 필요 없으므로 Linux 러너에서 실행할 수 있습니다. Rust 앱의 테스트에는 `cargo test`를, CLI 외에는 아무것도 필요 없는 방식으로는 `nsh test`를 사용합니다. 테스트가 하나라도 실패하면 두 방식 모두 0이 아닌 종료 코드로 끝납니다. 실패한 테스트, 빌드되지 않거나 아무것도 렌더링하지 않는 앱, 단계 도중 앱이 던진 예외가 여기에 해당합니다.

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

(러너에 `nsh` CLI를 설치하는 방법은 로컬에 설치하는 방법과 같습니다. [설치](./installation.md)를 참고하세요.)

`--junit <FILE>`는 결과를 JUnit XML 리포트로도 기록하며, CI 서비스(GitHub Actions 테스트 리포터, GitLab, Jenkins, Azure Pipelines)가 이를 테스트별로 보여 줍니다. 테스트 파일마다 `testsuite`, 테스트마다 `testcase`가 있으며, 무엇이 어디서 실패했는지와 화면에 있던 텍스트가 담깁니다.

성능을 지키려면 몇 가지 인터랙션의 아이템 개수(`── … : N items` 줄과 `--trace`의 `ops` / `mount items` 숫자)를 기록해 두고, 그 값이 늘어나면 실패하도록 하세요. 개수는 결정적(deterministic)이지만, 공유 CI 머신에서의 시간은 그렇지 않습니다.

> [!NOTE]
> 테스트는 기기에서와 마찬가지로 앱의 `nsh.json`가 선언한 `capabilities` 아래에서 실행됩니다. 앱이 선언하지 않은 것은 테스트에서도 거부됩니다.

<a id="784-for-ui-tests"></a>

## UI 테스트를 위한 `testID`

헤드리스 테스트는 런타임이 렌더링하는 내용을 검사하며, `id:` 셀렉터는 test id로 뷰를 찾습니다. 플랫폼의 테스트 도구(XCUITest, Espresso / UI Automator, Appium, Maestro)로 실제 네이티브 UI를 구동하려면 뷰에 test id를 지정하세요. Rust에서는 `.test_id(…)`, TSX에서는 `testID`를 사용합니다:

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

| 플랫폼 | `testID`가 들어가는 위치 |
|---|---|
| iOS | 뷰의 `accessibilityIdentifier` (XCUITest에서는 `app.otherElements["add-to-cart"]`). |
| Android | 접근성 노드의 뷰 id 리소스 이름 (UI Automator에서는 `By.res("add-to-cart")`). |

test id는 Rust에서 모든 엘리먼트의 메서드이며 컴포넌트의 엘리먼트도 포함합니다(`button().test_id("save")`는 컴포넌트의 루트에 이름을 붙입니다). `testID` 모든 엘리먼트와 모든 Rust 컴포넌트의 prop입니다(`Button`, `Dialog`, ...). test id는 스크린 리더가 읽는 내용을 바꾸지 않습니다. 그 용도로는 `accessibilityLabel`를 사용하세요([접근성](./accessibility.md) 참고). `--trace` 출력에서는 뷰의 `ViewProps` 아이템에 `test_id: Some("add-to-cart")`로 나타납니다.

<a id="see-also"></a>

## 함께 보기

- [성능](./performance.md): 이 수치에서 무엇을 살펴봐야 하는지
- [개발 서버와 디버깅](./dev-server-and-debugging.md)
- [아키텍처](./architecture.md): 오퍼레이션, 커밋, 마운트 배치
