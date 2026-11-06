---
title: "テスト"
description: "アプリをヘッドレスでテストします。Rust では cargo test と nsh_testing、TypeScript では nsh test を使い、ユーザーと同じようにアプリを開き、タップし、入力し、スクロールし、待機できます。ネットワークとストレージはスタブ化でき、--trace が出力するネイティブビュー操作とタイミングも確認できます。UI テストでは testID を使用します。"
order: 61
group: tools
source_hash: c0e7414002b92551
---

# テスト

NSH はアプリを**ヘッドレス**で実行します。実際のエンジン(デバイス上と同じリアクティブグラフ、レンダラー、コンポーネント、レイアウト、リスト仮想化と、TSX 用の QuickJS)を使い、60 Hz でディスプレイフレームを生成しますが、シミュレーターもデバイスもウィンドウも使いません。Cargo または CLI が動く環境ならどこでも(Linux の CI マシンを含む)動作し、次の 2 つの役割を果たします。

- テストの実行: 各テストはアプリを開き、ユーザーが行う操作(押す、入力する、スクロールする)を行い、画面に表示されている内容を検証します。Rust アプリのテストは Rust で書き、`nsh-testing` クレートを使って `cargo test` で実行します。TypeScript で書いたテストは `nsh test` で実行し、TSX アプリにも Rust アプリにも使えます。
- `--trace` を使うと、ランタイムがネイティブビューに送るすべての操作をタイミング付きで出力します。最初のフレーム、タップ、スクロール 1 フレームにかかるコストがわかります。

<a id="writing-tests"></a>

## テストを書く

Rust と TypeScript で書いた同じテストです。ストレージに空の todo リストがある状態でアプリを開き、入力と押下を行い、画面に表示される内容を検証します。

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

## cargo test による Rust のテスト

Rust アプリのテストはそのクレートの統合テストで、`nsh-engine` と `nsh-testing`(デフォルト機能、QuickJS なし)を dev-dependencies に加えます。

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` はスマートフォンサイズ(390×844 ポイント)のエンジンで、ほかには何も設定されていません。そのフィールドは、後述の `open` のオプションが設定する内容に対応します。`storage`(`MemoryStorage::new(entries)`)、`network`(`StubNetwork`、後述)、`viewport`、`environment`(外観、ロケール、モーション低減)、`clock`(`Clock::manual(time)`、後述)です。`nsh_testing::Headless::start(config)` はアプリを起動し、表示中のビューのモデルを保持します。そのステップは後述の `nsh test` のものと同じで、セレクターも同じです。Rust では `press`、`long_press`、`clear`、`type_text`、`submit`、`scroll(selector, px(3000.0))`、`back`、`wait`、`wait_for`、`wait_for_gone`、`wait_until`、`run_for`、`fast_forward`、`set_system_time`、`set_viewport`、`set_clipboard`、`on_dialog` があり、`app.shows(text)` と `app.screen()`(`texts()`、`count(selector)`、`enabled(selector)`、`dialogs()`、`clipboard()`、`commands()`)で画面の内容を読み取ります。ステップを実行できない場合は、画面上のテキストを含むエラーが返されます。

`nsh_testing::tsx(entry, sets)`(機能 `bundle`)は、アプリの TSX エントリを同じ方法で開きます。NSH とクレートの UI セットに対してビルドされます([Rust でのビルド](./rust.md#testing))。`examples/gallery-rs` はこの方法で Rust のルートをテストしており、デモごとに 1 つのモジュールがあります。`examples/rust-exports` は TSX エントリを Rust からテストします。

`nsh test` はこれらのテストも実行します。Rust クレートを持つアプリのディレクトリ(`nsh.json` `"rust"`)を指定すると、テストファイルの前に各クレートに対して `cargo test` を実行し、Rust のテストを TypeScript のテストとともに(`✓ src/lib.rs › tests::adds`)、サマリーと `--junit` レポートに表示してカウントします。したがって `nsh test` は、Rust アプリ、クレートを持つ TSX アプリ、TSX アプリのいずれにも使える 1 つのコマンドです。同様に `nsh check` も、TypeScript の型チェックの前にクレートに対して `cargo check --all-targets` を実行します。

<a id="tests-with-nsh-test"></a>

## nsh test によるテスト

テストファイルは、コードの隣に置く `*.test.tsx` または `*.test.ts` ファイルです。上の `App.test.tsx` と同じように `nsh/test` をインポートします。

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

テストが失敗すると、スローされた内容、テストファイル内の位置、開いたアプリの画面上のテキストが表示されます。失敗が 1 つでもあると、`nsh test` はゼロ以外のコードで終了します。`nsh init` はアプリ入りの `App.test.tsx` を作成し、`nsh check` はテストファイルを他のファイルとともに型チェックします(`.nsh/types` が `nsh/test` を宣言します)。

各テストファイルは専用のエンジンで実行され、そのテストは順番に 1 つずつ実行されます。`open` は毎回新しい別のエンジンでアプリを起動するため、テスト間で状態が共有されることはありません。テストが開いたアプリは、テストの終了時に閉じられます。テストは、例外をスローしたとき、返した Promise が reject されたとき、タイムアウトしたときに失敗します。タイムアウトは 30 秒で、`test` の第 3 引数でミリ秒単位で指定することもできます(`test("syncs", body, 60_000)`)。独自の Rust クレートを持つアプリ(`nsh.json` `"rust"`)は、NSH がそれらとともにビルドするヘッドレスランナーで同じようにテストを実行します。Rust アプリ(`nsh.json` `"root"`、[Rust でのビルド](./rust.md))では、`open(".")` がそのルートコンポーネントを起動します。

<a id="grouping-tests-and-setting-them-up"></a>

### テストのグループ化とセットアップ

`describe`、フック、`test` のバリアントは Jest と同じように動作します。

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

| 関数 | 説明 |
|---|---|
| `describe(name, body)` | テストと、`body` が宣言するブロックをグループ化します(ファイルの読み込み時にただちに宣言されます)。名前は `name`(`the cart › starts empty`)で始まり、ブロック内で宣言されたフックはそのブロックの内側でのみ実行されます。ブロックはネストできます。 |
| `beforeEach(fn, timeout?)`、`afterEach(fn, timeout?)` | 宣言されたブロック(ファイル、`describe`)の各テストの前後に `fn` を実行します。外側のブロックの `beforeEach` が最初に、内側のブロックの `afterEach` が最初に実行されます。失敗した `beforeEach` はそのテストを失敗させ、`afterEach` はどちらの場合も実行されます。 |
| `beforeAll(fn, timeout?)`、`afterAll(fn, timeout?)` | ブロック内のテストのいずれかが実行されるとき、最初のテストの前と最後のテストの後に一度だけ `fn` を実行します。失敗した `beforeAll` はそのブロックのテストを失敗させ、失敗した `afterAll` は失敗した `<block> › afterAll` として報告されます。`beforeAll` が開いたアプリはブロックのテストの間は開いたままで、`afterAll` の後に閉じられます。 |
| `test.skip(name, body, timeout?)`、`describe.skip(name, body)` | テスト、またはそのテストを実行しないブロックを宣言します。これらはスキップとして報告されます。 |
| `test.only(name, body, timeout?)`、`describe.only(name, body)` | テストファイルにこれがある間は、そのテストとブロックのみが実行され、ファイル内のそれ以外はスキップとして報告されます。 |
| `test.todo(name)` | これから書くテストで、その旨が報告されます。 |

フックは `async` にできます。`timeout` は指定しない限り 30 秒です。テストとフックはファイルの読み込み時に宣言されます。テストやフックの内側でテストを宣言すると例外がスローされます。

<a id="opening-the-app"></a>

### アプリを開く

`open(entry, options?)` は `entry` にあるアプリをビルドし(テストファイルからの相対パス。各エントリーは実行ごとに 1 回ビルドされます)、390×844 のビューポートで起動し、レンダリングが完了して静止した時点で resolve されます。`--target` を指定すると、アプリはテストが指定したとおりのオプションで実行されます。ターゲットのプラットフォームが対応できないオプションがあると、`open` はそれを示す `ERR_NSH_TEST_UNSUPPORTED` で reject されます([実機プラットフォームでの実行](#on-a-real-platform)を参照)。

| オプション | デフォルト | 説明 |
|---|---|---|
| `storage` | 空 | 開始時に `Storage` が保持する内容: `{ todos: "[]" }`。 |
| `network` | なし | アプリのリクエストに対する、ルートごとの応答: [ネットワークのスタブ化](#stubbing-the-network)を参照。`"live"`: リクエスト、ソケット、WebSocket に対して実際のネットワークを使用します。 |
| `width`、`height` | 390、844 | ポイント単位のビューポート。ヘッドレスではデスクトップのウィンドウ、Web ではページのサイズです。iOS と Android では、アプリはデバイスの画面全体を占めます。 |
| `safeArea` | 0 | ポイント単位のセーフエリアのインセット: `{ top: 47, bottom: 34 }`。 |
| `clipboard` | 空 | 開始時のクリップボードのテキスト。 |
| `colorScheme` | `"light"` | システムの外観: `"light"` または `"dark"`(`colorScheme()`、`dark:` クラス)。 |
| `locale` | `"en-US"` | デバイスのロケール。BCP 47 タグです(`locale()`、`Intl` のデフォルト)。 |
| `reducedMotion` | `false` | ユーザーがモーションの低減を求めている状態(`reduceMotion()`)。 |
| `platform` | `"ios"` | ヘッドレスでアプリが動作するプラットフォーム: `"ios"`、`"android"`、またはデスクトップの `"macos"`、`"windows"`、`"linux"`、あるいはデスクトップ流儀(`platform.os`、`ios={{…}}` / `android={{…}}` / `desktop={{…}}` プロパティ、キーボードショートカット)の `"web"`。`--target` を指定すると、アプリはターゲットのプラットフォームとして動作します。デスクトップの `platform` はどのデスクトップや Web でも常にデスクトップとして動作し(ブラウザーではどの幅でもデスクトップ流儀で、`platform.os` は `"web"` のままです)、`"ios"` と `"android"` はそれぞれ自身として動作します。 |
| `clock` | システムのもの | テストが進めたときにだけ時刻が進む手動クロック: `{}`、または `{ time }` で `Date`(または Unix エポックからのミリ秒)から開始します。[時間の制御](#controlling-time)を参照。 |
| `host` | なし | 組み込み先アプリの役割で、テストがそれを演じます: `{ params, handlers }`。[ホストアプリを演じる](#playing-the-host-app)を参照。 |

<a id="playing-the-host-app"></a>

### ホストアプリを演じる

ネイティブアプリに組み込まれたアプリは、[`host`](../modules/nsh.md#host)を通じてそのアプリと通信します。テストでは、テストがホストアプリの役を演じます。`host.params` は起動時にアプリが読み取る起動パラメーターを与え、`host.handlers` はアプリの `host.call` に応答し、`host.post` を名前で受け取ります。ハンドラーは、すべての呼び出しに応答する値か、呼び出しのデータを受け取って応答(またはその Promise)を返す関数です。関数がスローしたものは、ホストアプリのエラーと同様に、その呼び出しを reject します。`handlers` に列挙されていない名前の呼び出しは、ハンドラーを持たないホストアプリと同様に失敗します。

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

`app.host.send(name, data)` はイベントを送り、アプリが静止するまで待ちます。`app.host.calls()` と `app.host.posts()` は、ハンドラーが受け取った内容を順番に列挙します: `name` と `data`。

アプリが開く URL([`openUrl`](../modules/nsh.md#openurl)、`links="open"` を持つ `TextView` のリンク)は記録され、開かれたものとしてアプリに通知されますが、このマシンでは何も開かれません。`app.openedUrls()` はそれらを列挙します。

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### ネットワークのスタブ化

`network` は `"<METHOD> <URL>"` をキーとしてルートを列挙します(URL のみの場合は `GET` になり、`*` は任意のテキストに一致します)。どのルートにも一致しないリクエストは失敗するため、テストが意図せずネットワークに到達することはありません。ルートはレスポンスか、リクエストを受け取ってレスポンス(またはその Promise)を返す関数です。Rust では `StubNetwork::new(routes)` が同じルートを受け取り、それぞれ `StubResponse` または `StubRoute::Handler` です。

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

| レスポンスのメンバー | デフォルト | 説明 |
|---|---|---|
| `status` | 200 | ステータスコード。 |
| `headers` | なし | ヘッダー名と値。 |
| `body` | 空 | 文字列、または JSON として送られる値(`headers` が指定していない限り `content-type: application/json` が付きます)。 |
| `error` | なし | デバイスがオフラインのときのように、リクエストはこのメッセージで失敗します。 |
| `delay` | 0 | レスポンスにかかる時間(ミリ秒)。ステップはこれを待ちませんが、`waitFor` は待ちます。手動クロックでは、クロックがその時間を過ぎたときにレスポンスが返ります。 |

ルートの関数はリクエスト(`method`、`url`、`headers`、テキストとしての `body`)を受け取り、テストファイル内で実行されるため、リクエストを数えたり、テストが用意した内容から応答したりできます。スローした関数は、そのリクエストと、それを発行したステップを失敗させます。`app.requests()` は、アプリが行ったリクエストを同じ方法で順番に列挙します。

接続もテスト内に閉じられます。アプリのソケット(`net`)と WebSocket(グローバルの `WebSocket` と `websocket` モジュール)は、`network` が `"live"` でない限り何も開きません。アプリ自身の実行が通過するケイパビリティチェックの後、`net.connect` と `websocket` モジュールの `connect` は `code` `ERR_NSH_TEST_NETWORK` で reject され、グローバルの `WebSocket` は `error` に続いて `close`(1006、クリーンではない)を発火します。これは、ネットワークが拒否した接続の場合と同じです。`"live"` を指定すると、アプリのリクエストとともに実際のネットワークに接続します。Rust では、`EngineConfig::refuse_connections` が `Headless` アプリに対して同じことを行います。アプリの接続先(WebSocket の URL、ソケットの `host:port`)を受け取る関数が、その呼び出しを失敗させるエラーを返します。

<a id="controlling-time"></a>

### 時間の制御

システムのクロックでは、アプリのタイマーとネイティブアニメーションはデバイス上と同じだけ時間がかかり、それらを待つテストも同様です。手動クロック(Rust では `EngineConfig::clock`、TypeScript では `open` の `clock`)を使うと、アプリはテストが進めたときにだけ時刻が進むクロックで、Jest のフェイクタイマーや Playwright の `page.clock` のように、即座に実行されます。`app.clock` がそのクロックであり、アプリがシステムのクロックで動いているときは `null` です。

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

レスポンスに `delay` を持つ `StubNetwork` は、`.with_clock(clock.clone())` で手動クロックに従います。以下のステップは `nsh test` のものであり、`Headless` にもそれぞれ備わっています(`run_for`、`fast_forward`、`set_system_time`)。

| ステップ | 説明 |
|---|---|
| `await app.clock.runFor(ms)` | クロックを `ms` ミリ秒、1 ディスプレイフレームずつ進めます。タイマー、`requestAnimationFrame`、ネイティブアニメーション、遅延レスポンスは、期限が来た順に、それぞれの時刻で実行されます。アプリが静止した時点で resolve されます。 |
| `await app.clock.fastForward(ms)` | スリープから復帰するデバイスのように、クロックを `ms` ミリ秒一度に進めます。その間に期限が来たタイマーは 1 回ずつ実行されます。 |
| `app.clock.setSystemTime(time)` | タイマーを動かさずに、壁時計時刻(`Date.now()`、`new Date()`)を `Date` またはミリ秒に設定します。 |

`Date`、`performance.now()`、`Intl` のデフォルトの日付はクロックに従います。ステップは、実行中のものを待たずに完了させます。アプリがフレームを要求している間、またはネイティブアニメーションが実行されている間は、フレームが次々に進み、各フレームはクロック上で 1 フレーム分の時間(1/60 秒)ずつ後になります。300 ms のトランジションは数ミリ秒で終わり、その間に期限が来たタイマーは実行されます。永久にループするアニメーション(スピナー)はクロックとともに動き、テストがクロックを進めるにつれて回ります。`app.wait(ms)` と長押しは、その時間だけクロックを進めます。それより後に期限が来るタイマーは、テストがそこまでクロックを進めたときにのみ実行されます。`waitFor` と `waitUntil` は、待っている間、1 ディスプレイフレームずつクロックを進め、フレームごとに確認するため、タイマーが表示する内容は待っている間にすぐ現れます。`waitFor("Saved", { timeout: 15_000 })` はクロックを最大 15 秒進めます。タイムアウトは両方のクロックで数えられます。待機はアプリのクロックを最大でその分だけ進め、同じだけの実時間が経過した時点でも reject されるため、アプリの外から来るもの(ルートの関数、ネットワーク)には、システムのクロックの場合と同じだけの時間が与えられます。ギャラリーのテストはこの方法で実行されます(`examples/gallery/tests`)。アニメーションを待つ 12 個のテストは、28 秒ではなく 6 秒で終わります。
<a id="steps"></a>

### ステップ

ステップは、Playwright と同じ書き方の**セレクター**でビューを指定します。

| セレクター | 一致するもの |
|---|---|
| `id:<testID>` | その `testID` を持つビュー。 |
| `label:<label>` | その `accessibilityLabel` を持つビュー。 |
| `text:<text>` | その文字列どおりに読めるテキスト(前後の空白は除く)、押下を受け取るテキストの一部(ネストした `<Text onPress>`、`TextView` のリンク)、またはその値を持つ入力。入力が空の間はそのプレースホルダーを持つもの。 |
| `role:<role>`, `role:<role>[<name>]` | その `role`(`role:button`)を持ち、その名前を持つビュー。名前はラベル、なければその中のテキスト(`role:button[Save]`)。 |
| `view:<id>` | `--trace` の出力で、その id を持つビュー。 |
| それ以外 | `testID`、なければラベル、なければテキストを、書かれたとおりに照合します。 |

小文字の単語とコロンで始まる部分はプレフィックスを表します(`id`、`label`、`role`、`text`、`view`)。そのため `tapped: solo` は、プレフィックスの一覧を示すステップエラーになります。このように始まるテキスト、ラベル、テスト id は、そのプレフィックスを付けて指定します。残りの部分は書かれたとおりに読まれます: `text:tapped: solo`、`label:note: draft`、`id:row:2`。新しいプレフィックスが追加されても、セレクターの意味は変わりません。

`label:`、`text:`、およびロールの名前では正規表現も使えます: `text:/^Buy/i`。構文は Rust の `regex` クレートのもので、JavaScript のクラス、グループ、アンカー、量指定子に対応し、線形時間で照合されます(フラグは `i`、`m`、`s`)。` >> ` は、その前の部分が一致したものの内側を探し(`id:cart >> role:button[Remove]`)、`nth=<n>` は一致したもののうち 0 から数えて 1 つを残します(`text:Delete >> nth=1`)。セレクターは、ユーザーがまず目にするビューを探します。最前面のモーダルの中、次に画面上、ナビゲーションスタックでは最上位の画面だけが対象です。一致するのはユーザーに見えるものです。つまり、領域を持ち、`visibility: hidden` の外にあり、ウィンドウとそれをクリップするビュー(`overflow: hidden`)の内側にあるビュー、またはユーザーがスクロールできるスクロールビューのコンテンツ内のどこかにあるビューで、スクロールすれば表示されます(Playwright と同様、`opacity` と変形は除きます)。ビューに対して操作するステップ(`press`、`type`、`clear`、`submit`、`scroll`、`longPress`)には、ちょうど 1 つのビューが必要です。複数に一致するセレクターはステップを失敗させ、エラーには絞り込み方が示されます。

| ステップ | 説明 |
|---|---|
| `await app.press(selector)` | ビュー、または押下を受け取る最も近い外側のビュー(テキストを囲むボタンなど)を押します: `onPressDown`、`onPressUp`、`onPress`。その中で指が下りて上がり、それを待ち受ける周囲のビューがタッチを受け取ります(オーバーレイの `onPressOutside`)。テキストの一部はその文字の上で押されます(`await app.press("Privacy policy")`)。ヘッドレス、iOS、Android、デスクトップで動作します。同じビューへの 500 ms 以内の 2 回目の押下は、プラットフォームの数え方に従い 2 回目のクリックになります(`clicks: 2`、ダブルプレス)。無効なときは reject されます。 |
| `await app.longPress(selector)` | そのビュー(または押下やタッチを受け取る最も近い外側のビュー)に指を置いたまま、`delayLongPress`(500 ms)の間保持します: `onPressDown`、`onLongPress`、`onPressUp`。`onPress` は続きません。タッチのハンドラーが指を受け取ります(`ContextMenu` や `Tooltip` が開きます)。 |
| `await app.clear(selector)` | 全選択して削除したときと同じように、入力を空にします。 |
| `await app.type(selector, text)` | 入力(またはビュー内の最初の入力。`text:` は入力のテキストやプレースホルダーにも一致します)の既存内容の末尾に、キーごとに入力します。まずフォーカスを取り、続いて各文字が `onKeyPress` と `onChange` になります(`maxLength` の範囲内)。単一行の入力での `\n` はリターンキーです。 |
| `await app.submit(selector)` | 入力でのリターンキーです。その `submitBehavior` の指定に従い、`onSubmit`(単一行の入力ではフォーカスが外れます)、または複数行の入力では改行になります。 |
| `await app.scroll(selector, distance)` | スクロールビューまたはリスト(そのビュー、それを囲むもの、またはその内側の最初のもの)を、軸に沿って `distance` ポイント、1 フレームあたり 10 ポイントでドラッグします。コンテンツの範囲内で、ユーザーが操作できるとおりに動きます(`scrollable`)。負の値では戻る方向にスクロールします。 |
| `await app.hover(selector)` | ビューの中央の上にマウスを移動します。マウスが離れた下のビューは `onMouseLeave` を、新しく乗ったビューは `onMouseEnter` を受け取って `hover:` スタイルが適用され、待ち受けているビューは、マウスの位置とボタンが押されていない状態を伴う `onMouseMove` を受け取ります。デスクトップと、任意の幅のウェブ(フォンのイディオムのブラウザーを含む)で動作します(ヘッドレス: デスクトップまたは `"web"` `platform`)。iOS と Android のフォンにはマウスがないため、そこでは reject されます。 |
| `await app.rightClick(selector)` | ビューの中央の上でマウスのセカンダリボタンを押します。そのビュー、またはそれを囲む最も近い待ち受けビューが `onContextMenu` を受け取ります。デスクトップとウェブで動作します(ヘッドレス: デスクトップの `platform`)。フォンにはマウスがないため、そこでは reject されます。 |
| `await app.paste(selector, { text?, html?, files?, uris? })` | ユーザーがクリップボードの内容を貼り付けるときと同じように、入力に貼り付けます。フォーカスを取り、`onPaste` を受け取り(`html` は書式付きの同じ内容、`files` はパスで、そのバイト列が `File` として渡され、`uris` `file:` は URL)、その後テキストが `pasteBehavior` の指定どおりに入ります。ヘッドレス、macOS、iOS、ウェブで動作します。マシンのクリップボードは元のままです。 |
| `app.menu()` | アプリが表示するコンテキストメニューのアクション(`Menu.popup`): `label`(サブメニューのものは自身の項目の後、`"Share > Mail"`)、`disabled`、チェック可能な項目では `checked`。開いているメニューがなければ `null`。 |
| `await app.chooseMenuItem(label)` | クリックしたときと同じように、開いているコンテキストメニューのアクションを選択します。アプリが `onMenu` を受け取り(その `onSelect` が実行されます)、その後メニューが閉じます。項目が無効または存在しない場合は reject されます。 |
| `await app.closeMenu()` | Escape を押したときと同じように、何も選択せずに開いているコンテキストメニューを閉じます。 |
| `await app.keyboard.press(keys)` | `keymap` が示すとおり、修飾キー付きでキーを押します(`"mod+k"`、`"shift+/"`、`"escape"`。`mod` はプラットフォームのコマンドキー)。すべてのプラットフォームでハードウェアキーボードからの入力として扱われます(フォンやタブレットにもあります)。まずそのキーに対するアプリのショートカットが受け取ります(`keymap.bind`、`onKeyCommand`)。なければ、macOS とウェブでは Tab と Shift+Tab が、入力と押下を受け取るビューの間でキーボードフォーカスを移動し(`onFocus`、`onBlur`、`focus:` スタイル)、Return または Space がフォーカスされているビューを押します。それもなければ、フォーカスされた入力が文字、Backspace、リターンキーを受け取り、それでもなければ Escape で戻ります。 |
| `await app.keyboard.down(keys)` / `up(keys)` | 修飾キー(`"mod"`、`"shift"`、`"alt"`、`"ctrl"`、`"meta"`。`+` で連結)を `up` まで押し続けます。その間の押下、ドラッグ、ホバーには修飾キーが付き、Mod+クリックや Shift+ドラッグと同じになります。現時点ではヘッドレスと Linux で動作します。 |
| `await app.dragAndHold(selector, by)` / `app.drop()` | `drag` と同じようにドラッグし、`drop()` が指をその位置で離すまで、指を下ろしたままにします。その間のステップはドラッグ中の画面(ドラッグプレビュー、ドロップラインなど)を確認できます。現時点ではヘッドレスと Linux で動作します。 |
| `await app.dropFiles(selector, uris)` | ローカルファイル(`file:` URL。ファイルマネージャーからドラッグしたときと同じ)をビューの中央にドロップします。そのビュー、またはそれを囲む最も近い待ち受けビューが `onFileDrop` を受け取ります。現時点ではデスクトップ、ヘッドレス、Linux で動作します。 |
| `await app.drag(selector, { x, y })` | 指がビューの中央に置かれ、100 ms 静止し、`x`、`y` ポイントを 1 フレームあたり 10 ポイントで移動して離れます。プラットフォームの入力として扱われます。パンがそれに続き(`pan={{ x, y }}`、`onPanStart`、離したときの速度を伴う `onPanEnd`)、タッチを待ち受けるビューがそれを受け取り(`onTouchStart`、`PanResponder`)、スクロールビューはそれに合わせてスクロールし、上端を十分に引き下げると更新します(`onRefresh`)。その下の押下は、指が離れていくとキャンセルされます。デスクトップとウェブではマウスになります。 |
| `await app.wait(ms)` | アプリを `ms` ミリ秒の間動かします: タイマー、アニメーション、リクエスト。手動クロックでは、クロックを `ms` だけ進めます(`app.clock.runFor`)。 |
| `await app.waitFor(selector, options?)` | ビューが一致した時点で、または一致するものがなくなった時点で `{ state: "gone" }` として解決されます。`timeout` ms(5000)後に reject されます。手動クロックでは、待機中にディスプレイの 1 フレームずつ、最大で `timeout` までクロックを進めます。 |
| `await app.waitUntil(condition, options?)` | `condition()` が true を返した時点で解決されます。アプリが変化するたびに再確認します。セレクターでは表せないものに使います(`() => app.storage().note === "Milk"`)。手動クロックでは、2 回の確認の間にディスプレイの 1 フレームずつ、最大で `timeout` までクロックを進めます。 |
| `app.shows(selector)` | 今、ビューが一致するかどうか。 |
| `app.count(selector)` | 今、一致するビューの数。 |
| `app.enabled(selector)` | ビューが入力を受け付けるかどうか。そのビューも外側のビューも無効ではなく、入力が `readonly` でないこと。 |
| `app.texts()` | 今、画面上にあるテキストを順に返します。 |
| `app.value(selector)` | 入力のテキスト。一致するものがなければ `null`。 |
| `app.spanStyle(selector)` | 最初に一致した文字の解決済みスタイル。ヘッドレスとすべての `--target` で利用できます: `color`、省略可能な `backgroundColor`、`fontSize`、`fontWeight`、`italic`、`underline`、`lineThrough`。色は `#rrggbbaa`、サイズはポイント単位です。 |
| `app.storage()` | 今、アプリのストレージが保持している内容。 |
| `await app.back()` | ユーザーと同じように戻ります(ヘッダーの戻るボタン、シートを下にスワイプするなど)。最も新しいモーダルの最も内側のスタック、なければ画面のスタックが、最上位の画面を pop します(`onDismiss`)。`preventBack` がある場合は、その画面に尋ねます(`onBackRequest`)。それがなければ、最も新しいモーダルが閉じるかどうかを尋ねます(`onRequestClose`)。戻る元がなければ reject されます。 |
| `app.onDialog(handler)` | 以後アプリが表示するダイアログ(`Alert.alert`、アクションシート)に応答します。`handler` はダイアログ(`title`、`message`、`buttons`、`cancelable`、`sheet`)を受け取り、押すボタンのテキストを返します。ボタンを押さずに閉じる場合は `null` を返します。 |
| `app.dialogs()` | アプリが表示したダイアログを順に返します。 |
| `app.onPick(handler)` | 以後アプリが求めるピック(`Picker.pickImages`)に応答します。`handler` はピックが求める内容(`multiple`、`limit`、`maxDimension`、`quality`、`format`)を受け取り、ユーザーが選ぶファイルを返します(`{ name, type?, data: Uint8Array }`。そのままアプリに渡されます)。キャンセルする場合は `null` を返します。ハンドラーがない場合、ピックはキャンセルされます。ヘッドレス実行で動作します。 |
| `app.picks()` | アプリが求めたピックを順に返します。 |
| `app.hear(text)` | ユーザーが実行中の音声セッションに `text` と話します(`Speech.start`)。その `result` は、ここまでの全文として `text` を報告します。ヘッドレス実行で動作します。 |
| `app.endSpeech(error?)` | 実行中の音声セッションを終了します。`error`(`"no-speech"`、`"network"`、...)を指定すると失敗し、そうでなければ最後の確定結果と `end` が届きます。何も聞き取れなかった場合は `no-speech` です。ヘッドレス実行で動作します。 |
| `app.speechRequests()` | アプリが開始した音声セッションを順に返します: `lang`(ユーザーのものは `null`)と `interim`。 |
| `app.clipboard()` | 今、クリップボードにあるテキスト。テキストがなければ `null`。 |
| `app.requests()` | アプリが行ったリクエストを順に返します: `method`、`url`、`headers`、`body`。 |
| `await app.host.send(name, data?)` | ホストアプリのイベントをアプリに送り(`host.on`)、静かになるまで待ちます。[ホストアプリを動かす](#playing-the-host-app)を参照してください。 |
| `app.host.calls()`, `app.host.posts()` | `open` の `host.handlers` が受け取った、アプリの呼び出しと送信を順に返します: `name`、`data`。 |
| `app.openedUrls()` | アプリが開いた URL(`openUrl`)を順に返します。記録されるだけで、実際には開かれません。 |
| `await app.setViewport(width, height)` | デバイスの回転やウィンドウのリサイズと同じように、ビューポートのサイズを変更します(`windowSize()`)。 |
| `await app.setColorScheme(scheme)` | ユーザーが行うように、システムの外観を `"light"` または `"dark"` に切り替えます。 |
| `await app.setLifecycle(state)` | ユーザーがアプリを離れたり、別のアプリやウィンドウに切り替えて戻ってきたりしたときにシステムが行うように、アプリを `"background"`、`"inactive"`、`"active"` のいずれかの状態に移します(`lifecycle()`)。ヘッドレス実行のみで動作します。 |
| `await app.screenshot(path?)` | アプリのウィンドウを PNG(`Uint8Array`)として返します。指定した場合は、このマシン上の `path`(カレントディレクトリからの相対パス)にも保存します。アプリを描画するのは実プラットフォームだけです。[実プラットフォームでの実行](#on-a-real-platform)を参照してください。 |

ステップは、アプリが 100 ms の間何も描画せず、自然に終わらないネイティブアニメーションも動いていない時点で解決されます(常に描画し続けるアプリでは最大 2 秒。手動クロックでは、アプリの時間でも 2 秒)。そのため、次の行が実行されるときには、ステップが変更した内容が画面に反映されています。それより後に起こること(レスポンス、タイマー)には `waitFor` を使います。手動クロックでは、ステップは 100 ms を待ちません。ステップとクロックの時間によって実行されるべきものをアプリがすべて実行し終え(今期限が来たタイマー、promise、即座に応答するスタブのレスポンス)、フレームを必要としなくなった時点で解決されます。ただし、リクエストがまだ処理中の場合は除きます。そのため、手動クロックを使うテストはステップ間に待ち時間なしで実行されます。別のスレッドが応答するもの(`nsh/host` の呼び出し、ファイルの読み込み、スレッド上の Rust タスクの処理)は、ステップが解決された後に届きます。それが表示する内容は `waitFor` で待ってください。ローディングスピナーのように永久に繰り返すアニメーションは、ブラウザーのテストで無限の CSS アニメーションが動き続けるのと同様に、ステップや `waitFor` が進む間もバックグラウンドで動き続けます。ステップは、セレクターに何も一致しないとき(エラーには画面上のテキストが一覧されます)、その間にアプリが例外を投げたとき、実プラットフォームだけが答えられるものをアプリが求めたときに、reject されてテストが失敗します。

テストが期待してよい失敗には `code` が付き、これは変更されません。メッセージは人間向けで変更される場合があるため、テストではコードで照合してください。

| `code` | ステップまたはクエリ |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | 画面上にセレクターに一致するものがない、または開いているメニューにそのような項目がない。 |
| `ERR_NSH_TEST_DISABLED` | セレクターが指すビューが無効である(ユーザーがスクロールできないスクロールビュー、無効なメニュー項目)。 |
| `ETIMEDOUT` | `waitFor` または `waitUntil` が時間切れになった、または `open` の後にアプリが何も描画しなかった。 |
| `ERR_NSH_TEST_NO_BACK` | `back()` が戻る元を見つけられなかった。 |
| `ERR_NSH_TEST_UNSUPPORTED` | `--target` を指定した `open` に、対象プラットフォームが対応できないオプションが渡された: iOS と Android での `width` または `height`、デスクトップまたはウェブでのフォンの `platform`、iOS または Android でのデスクトップのもの、またはもう一方のフォンのもの、`host.handlers`。メッセージにその名前が示されます。 |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` はネストした `<Text testID="guide">` を読み取り、`text:word` はその一致の最初の文字を読み取ります。クエリの範囲は `id:note >> text:word` で絞り込み、繰り返し一致するものは `>> nth=0` で選択します。スパンが存在しない、曖昧、または空の場合、クエリはエラーを報告します。スパンの `testID` を更新しても、そのテキストレイアウトは再利用され、`onTextLayout` コールバックの回数は保持されます。
<a id="what-headless-runs-play-of-the-platform"></a>

### ヘッドレス実行がプラットフォームの代わりに行うこと

ヘッドレス実行には本物のランタイムはありますが、プラットフォームはありません。NSH のプロトコルが定めるプラットフォームの役割は果たしますが、本物のプラットフォームにしかできないことは行いません。

- **ネイティブアニメーションは実行されます**: フレームごとに最後まで進み、`start(callback)` コールバックが実行され、それらを待っていた処理も実行されます。終わりのないループは、アプリが止めるまで実行され続けます。
- **戻る操作**は、プラットフォームと同様に画面を pop し、モーダルを閉じます(`app.back()`)。
- **ダイアログには応答があります**: テストの `onDialog` が応答し、なければキャンセルボタンが応答し、それもなければ閉じられる場合に閉じられます。他のボタンでしか応答できないダイアログは、テストがどのボタンを押すかを指定するまで、それを表示したステップが失敗します。
- **クリップボードはテキストを保持します**: アプリがコピーしたものを、ペースト時に読み戻します(`clipboard` で最初のテキストを設定できます)。
- **ページのホストが `host` に応答します**: アプリの `nsh.json` が `web.host` でホストを指定している場合です([ページのホスト](#the-pages-host))。
- **アプリは宣言した capabilities の下で実行されます**: `nsh.json` が `capabilities` で宣言したものは実機と同様に強制され、宣言していないものは拒否されます。
- **URL は記録されます**: アプリが開いたものは開かれたものとして報告され、`app.openedUrls()` が一覧します。
- **選択には応答があります**: テストのファイル(`onPick`)で応答し、なければキャンセルされるため、`Picker.pickImages` は `[]` で解決されます。
- **音声はテストのものです**: `Speech.available()` は `true` で解決され、セッションは即座に始まり、`hear` が指定した内容を聞き取ります。
- **モーダルは即座に表示されます**: モーダルが提示されると `onShow` が来ます。
- **画像は読み込まれません**: `onLoad` も `onError` も来ず、`Image.getSize` と `Image.prefetch` は reject されます。
- **本物のプラットフォームにしか応答できないものはステップを失敗させます**: クリップボード上の画像やファイルがこれにあたります。

<a id="the-pages-host"></a>

### ページのホスト

Web に公開されたアプリは、ページからホストを得ます: `nsh.json` `web.host`、つまり `createHost(player)` をエクスポートするモジュールです([Web](./web.md#the-hosts-functions))。ヘッドレス実行は、テストが開くアプリごとに、アプリの開始前にそのモジュールを、専用の JavaScript コンテキスト(タイマーと `console` のみで、ブラウザの機能はなく、import もできません)で読み込みます。その `call` はアプリの [`host.call`](../modules/nsh.md#host) に応答し、その `player.hostEvent` は `host.on` に届き、`host.available()` は `true` です。throw する、reject する、または JSON ではない値を返す `call` は、ページと同様にそのメッセージでアプリの呼び出しを reject します。アプリの開始前に送られたイベントは、開始後にトップレベルのリスナーに届きます。`--web-host <module>` は別のモジュールを指定します。アプリの `capabilities.host` には、ページと同様に、呼び出すものを列挙する必要があります。呼び出しのタイムアウトとホスト自身のタイマーはアプリの時間で動くため、手動クロックがそれらを進めます(`app.clock.runFor`)。ブラウザ(`--target web`)では、公開ページと同様に、開発用ページがアプリごとに `nsh.json` の `web.host` を実行します。それ以外のプラットフォーム(`--target`)ではアプリにホストがなく、`host.available()` は `false` です。

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` には、アプリ、そのホスト、およびそれらのテストがあります。

### Expectations

`expect(value)` は Jest と同様に、JS が作ったとおりに値を検査します: `toBe` は `Object.is` であり、`toEqual` はメンバーごとに比較し、`Date`、`Map`、`Uint8Array` はそれ自体の種類として比較されます。各検査は、成立しないと throw します。`.not` は検査を反転させます: `expect(app.texts()).not.toContain("Error")`。関数を渡すと `toThrow` はその呼び出しが throw するものを検査し、promise、または promise を返す関数を渡すと、`rejects` と `resolves` は Jest と同様にそれが解決する値を検査します: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`。

| 検査 | 成立する条件 |
|---|---|
| `toBe(expected)` | 値が `expected` である(`Object.is` の定義どおり): 同じプリミティブ(`NaN` は `NaN` であり、`0` は `-0` ではない)、または同じオブジェクト。 |
| `toEqual(expected)` | 値が `expected` とメンバーごとに等しい(Jest の `toEqual` と同様): オブジェクトは自身の列挙可能なプロパティで比較(`undefined` であるプロパティは存在しないものとして扱う)、配列は要素ごと、日付は時刻、正規表現は source と flags、Map と Set はエントリを順不同で、`ArrayBuffer` と型付き配列はバイト列、エラーは name と message で比較。`NaN` は `NaN` と等しい。クラスのインスタンスは、同じプロパティを持つプレーンオブジェクトと等しい。 |
| `toMatchObject(subset)` | 値が `subset` のすべてのプロパティを持ち、それぞれが `toEqual` の定義どおり等しく、その中のオブジェクトも順に一致する。他のプロパティは見ない。配列は、すべての要素が要素ごとに一致する。 |
| `toContain(item)` | 配列、`Set`、型付き配列、その他のイテラブルが `item` を保持する(`===`)、または文字列がそれを含む。 |
| `toContainEqual(item)` | 配列、`Set`、その他のイテラブルが、`item` と(`toEqual` の定義どおり)等しい要素を保持する。 |
| `toBeTruthy()`、`toBeFalsy()` | 値が truthy / falsy である(JS の見方による)。 |
| `toMatch(pattern)` | 文字列が `pattern`(文字列)を含む、または一致する(`RegExp`。JS エンジンで実行されるため、後読み、後方参照、名前付きグループは JavaScript と同様に動作する)。 |
| `toHaveLength(n)` | 値の `length` が `n` である: 文字列なら UTF-16 コードユニット、配列や型付き配列なら要素。 |
| `toBeNull()` | 値が `null` である。 |
| `toBeUndefined()`、`toBeDefined()` | 値が `undefined` である / それ以外のものである。 |
| `toBeNaN()` | 値が `NaN` である。 |
| `toBeGreaterThan(n)`、`toBeGreaterThanOrEqual(n)`、`toBeLessThan(n)`、`toBeLessThanOrEqual(n)` | 数値が `n` とそのように比較される。 |
| `toThrow(expected?)` | `expect(fn)`: `fn` の呼び出しが throw する。`expected` を渡すと、エラーがそれに一致する: メッセージが文字列を含む、または `RegExp` に一致する。エラークラス(`TypeError`、アプリのクラス)はエラーの `name` であり、`Error` はすべてのエラーに一致する。エラーは同じメッセージを持つ。 |
| `rejects.toThrow(expected?)` | `expect(promise)`: promise が reject され、そのエラーが `expected` に(`toThrow` の定義どおり)一致する。 |
| `rejects.toMatchObject(subset)` | `expect(promise)`: promise が `subset` に(`toMatchObject` の定義どおり)一致する値で reject される: エラー自身のプロパティ(`code`、`permission`、...)と、その `name` および `message`。 |
| `resolves.toBe(expected)`、`resolves.toEqual(expected)`、`resolves.toMatchObject(subset)` | `expect(promise)`: promise が、その検査を満たす値に解決される。 |

失敗した検査は、受け取った値と期待した値を、JS が書くとおりの形式で示します: `expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`。

`rejects` と `resolves` にも専用の `.not` があります: `await expect(load()).resolves.not.toBe(null)`。

<a id="on-a-real-platform"></a>

### 実プラットフォームでは

`nsh test --target macos`(または `linux`、`windows`、`gpui`、`web`、`ios`、`android`)は、同じテストをヘッドレスではなくプラットフォームの開発用ホストで実行します。各 `open` は、新しいデータディレクトリを持つ専用ウィンドウでアプリを起動し、ステップは、ブラウザ上の Playwright と同様に、セレクターが指すビューに対してプラットフォーム自身の入力で操作します。

- プレスはビューの中央でのクリック、ロングプレスは押し続けるクリックです。`type` は入力欄をクリックしてそのキーを入力し、`scroll` はスクロールビュー上でのトラックパッドジェスチャー、`back` はユーザーが行う操作です(macOS と Linux では Escape、Windows と GPUI ではマウスの戻るボタン、Web ではブラウザの戻るボタン、シートは下へのスワイプ、メニュー、ポップオーバー、`Sheet` が開いている間は VoiceOver のエスケープジェスチャー、それ以外の iOS ではヘッダーの戻るボタン、Android では戻るボタン)。
- 画面外のビューは、まず一度に一つのジェスチャーずつスクロールして表示されます。タッチスクリーンでは、ユーザーがスクロールするときのように、ドラッグに追従するビュー(スライダー、描画領域)の脇の、ページ自体が動く位置に指を置きます。
- セレクター、待機、クエリは、ホストが描画するものから構築された、ヘッドレス実行と同じアプリのモデルを見るため、同じビューを見つけます。
- ダイアログはプラットフォーム自身のものです: `app.dialogs()` がそれを読み取り、応答(`onDialog`、またはテストが何も指定しない場合はキャンセルボタン)はそのボタンを押します。
- `app.screenshot(path)` はウィンドウの画像を撮ります。

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

ウィンドウは、画面の範囲内で、ビューポートのサイズ(`open` が指定しない限り 390 × 844)で開きます。iOS と Android では、アプリはデバイスの画面いっぱいに、デバイスのサイズで表示されます。アプリは対象のプラットフォームとして実行されます(`platform.os`)。手動 `clock` はヘッドレスと同様に動作します: `app.clock.runFor`、`fastForward`、`setSystemTime` はアプリの時間を即座に進め(タイマー、1 フレームずつ離れた `requestAnimationFrame`、`Date`)、`app.wait(ms)`、`waitFor`、`waitUntil` も同様に進めます。また、プラットフォームが表示する各フレームが 1 フレーム(1/60 秒)ぶん進めるため、アプリがアニメーションする間もアプリの時間は経過します。プラットフォーム自身のアニメーションと、ルートの `delay` は、実時間で進みます。アプリのリクエストはヘッドレスと同様にテストに届きます: `network` ルートがそれらに応答し、どのルートにも一致しないリクエストは失敗し、`"live"` はそれらをホストのネットワークに通します。`app.requests()` はそれらをすべて一覧します。ソケットと WebSocket は `"live"` を指定するとホストのネットワークで接続し、それ以外ではヘッドレスと同様に拒否されます。`storage` はアプリの開始時にアプリのストレージに入っており、`app.storage()` はアプリからそれを読み取ります。`locale`、`reducedMotion`、`safeArea` は、`open` が値を与える場合(デフォルト値を含む)、プラットフォームが報告するものをそのまま保持し、それが与える `colorScheme` はシステムの外観を切り替えます(`"light"` も同様)。省略したものはプラットフォームのものになります。アプリのクリップボード呼び出しはテスト自身のクリップボードから処理されるため(`clipboard` は最初はそのテキストで、`app.clipboard()` がそれを読み取ります)、マシンのクリップボードは元のままです。テキスト入力自身のコピーとペーストはシステムのものを使います。`host.params` はアプリに届き、`app.host.send` はイベントを送り、アプリが開く URL は実際には開かれず、`app.openedUrls()` のために記録されます。`host.handlers` はヘッドレスで実行され、そこではテストがアプリの呼び出しに応答します。`open` はそのオプションを対象に照らして検査します: iOS と Android での `width` と `height`、別の種類のデバイスの `platform`(デスクトップや Web でのスマートフォン用のもの、iOS や Android でのデスクトップ用や別のスマートフォン用のもの)、そして `host.handlers` は `ERR_NSH_TEST_UNSUPPORTED` で reject されるため、テストは書かれたとおりに実行されるか、必要なものを伝えます。デスクトップの `platform`(デスクトップのマウスとキー用の `"macos"`)はすべてのデスクトップ対象と Web で実行され、その対象のプラットフォームとして、常にデスクトップとして動作します。ブラウザでは、幅にかかわらずページがデスクトップのイディオムで開始します。`platform` がない場合(または `"web"` の場合)は、ブラウザと同様にイディオムを測定します(幅 600 ポイントからデスクトップ)。独自の Rust クレートを持つアプリは、そのクレートを含めてビルドされた開発用ホストで実行されます。このホストは NSH がプラットフォーム向けにビルドします。Rust アプリのホストはそのルートを実行するため、`open(".")` はヘッドレスと同様にそこでアプリを開始します。

Web では、アプリは開発用ホストのページ内で、ヘッドレスの Chrome、Edge、または Chromium 上で実行されます。使われるのは、このマシンにインストールされているもの、または `--browser <PATH>` が指す実行ファイルです(ブラウザが必要です: 見つからない場合、`nsh test` が探した場所を示します)。実行全体で一つのブラウザを使い、各 `open` は専用のストレージを持つページを得ます。入力は、ユーザーの操作と同じ、ブラウザの信頼された入力です: マウスクリック、ホイールスクロール、キーです。

iOS では、アプリは iOS シミュレーター内の開発用ホストで実行されます。使われるのは、起動済みのシミュレーター、なければ最新の iPhone で、`nsh test` がそれを起動します。ステップは、UIKit がデバイスから受け取るのと同じ、指のタッチとソフトウェアキーボードの入力です。`setColorScheme` はシミュレーターの外観を切り替え、`nsh test` はアプリの終了後にそれを元に戻します。画面はシミュレートされたデバイスのサイズになります。

Android では、アプリは `adb devices` が一覧する最初のデバイスまたはエミュレーター上の開発用ホストで、専用のストレージとともに実行されます。ステップは、アプリのビューがデバイスから受け取るのと同じ、指のタッチとキーボードのキーです。`back` はシステムの戻る操作です。`setColorScheme` はデバイスのダークテーマを切り替え、`nsh test` はアプリの終了後にそれを元に戻します。

<a id="steps-from-standard-input"></a>

### 標準入力からのステップ

テストの代わりにアプリのエントリを渡すと、`nsh test` は実際のネットワークでアプリを開き、1.2 秒間実行させてから、標準入力が与えるステップを、`app` アプリに対して実行します。

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

1.2 秒は、最初のステップの前にエンジンのアイドル時ガベージコレクションを実行させるための時間です。まだ使っているものを手放してしまうアプリは、これによって問題が表面化します: ハンドラーが動作しなくなります。

サンプルには、出発点となるテストがあります: Rust アプリ用の `examples/gallery-rs`(`cargo test`、デモごとに一つのモジュール、そして `App.test.tsx`)、Rust クレートを持つアプリ用の `examples/rust-exports`、TSX アプリ用の `examples/counter` と `examples/gallery/tests`(ストレージ、入力、長いリスト、スタブされたリクエスト、ダークモード、手動クロック)です。

<a id="tracing-with---trace"></a>

## --trace によるトレース

`--trace` は、テストが開くアプリのすべてのマウントバッチを、それが届いたステップの下に出力し、あわせてすべてのコミットの時間も出力します。Rust では、テストが同じものを出力します: `observe` が各バッチをそのステップとともに渡し、`EngineConfig::trace` は `perf` 行を `log` クレート経由でログ出力します(ターゲットは `nsh::perf`。テスト内で `env_logger` のようなロガーをインストールしてください):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` は、テストファイルに対して、または標準入力のステップを伴うアプリのエントリに対して `--trace` を受け付けます:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

`--target` を指定すると、トレースはプラットフォームのものになります: ホストが適用したバッチをそれをもたらしたステップの下に示し、各コミットとイベントについてのホスト自身のタイミングを、デバイスのハードウェア上で示します。

次の用途に使えます。

- アプリ(またはデモ)がエラーなくビルド、評価、レンダリングされることを確認する。
- 変更がどのネイティブビューを、いくつ作成、移動、更新するかを正確に確認する。
- 最初のフレーム、タップ、スクロールの各フレームのコストを測定する。
- CI でリグレッションを検出する。
<a id="reading-the-output"></a>

### 出力の読み方

次は、カウンターの例を1回押したときの出力を短くしたものです(`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`)。

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

#### バッチとマウントアイテム

各 `── step: N items` ブロックは1つの**マウントバッチ**で、それが届いたステップの下に表示されます。これは、プラットフォームが1フレーム分としてネイティブビューに適用するすべての変更を、メインスレッドへの1回の受け渡しにまとめたものです。バッチ内の各行が**マウントアイテム**です。

| 項目 | 意味 |
|---|---|
| `Create { id, kind }` | ネイティブビューを作成します(`View`、`Text`、`Image`、`Scroll` など)。 |
| `Insert { parent, child, before }` | ビューを親に挿入します。兄弟ビューの前に挿入します(`None`: 末尾に挿入)。 |
| `Remove` / `Delete` | ビューを親から取り外します / 解放します。 |
| `ViewStyle { id, style }` | ビューの装飾です。背景、枠線、角丸、影、不透明度、変形などが含まれます。 |
| `ViewProps { id, props }` | タッチとアクセシビリティの設定です。`testID`。 |
| `Events { id, events }` | ビューが通知するイベントです(`EventMask(1)` は押下)。 |
| `Frame { id, x, y, w, h }` | 親の中での位置とサイズです(単位はポイント)。 |
| `Text { id, text, content }` | テキストビュー用にレイアウト済みのテキストです。 |
| `Image { id, source, ... }` | 読み込む画像です。 |

送られるのは変更があった部分だけです。数値が1つ変わるタップでは、`Text` アイテムが1つだけ送られます。ビューにデフォルトのスタイルや空のイベントマスクは付かず、変更のないフレームは送られません。新しい行が現れないスクロールのフレームでは、**バッチがまったく生成されません**。

<a id="the-762-lines"></a>

#### `perf` 行

| 行 | 意味 |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | バンドルにかかった時間とバンドルサイズです(開発用設定)。 |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | 1回のコミットです。JS がキューに入れた操作、コアが費やした時間(コンポーネントのレンダリング、レイアウト、差分計算)、リスト行のバインドに JS が費やした時間、生成されたマウントアイテム、生存しているノード数を示します。 |
| `turn: 2640µs (timers and tasks 1964µs)` | コミットを行ったターンです。ターン全体の時間と、コミット前に JS タイマーと Rust コンポーネントのタスクが要した時間を示します(Rust コンポーネントはコミット内でレンダリングされます)。 |
| `first frame: eval 271µs, total 1235µs` | バンドルの評価にかかった時間と、開始から最初のバッチまでの時間です。 |
| `event Press on view 20` / `event js: 196µs` | ディスパッチされたイベントと、そのハンドラ(およびそれが引き起こした処理)が JS で要した時間です。 |

> [!NOTE]
> ヘッドレスでは近似的なテキストエンジンでテキストを計測するため、CoreText や Android のテキストレイアウトを使う実機とは、テキストサイズがわずかに異なります。レイアウトロジック、ビュー数、操作数は同じです。

1回だけの計測値は CPU のクロック状態に大きく左右されます(アイドルから復帰した直後のマシンは遅くなります)。同じマシンで実行を比較し、複数回の実行の最小値を見て、マイクロ秒よりも操作数とアイテム数を信頼してください。

<a id="scrolling"></a>

### スクロール

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` は、リストを1フレームあたり10ポイント、毎秒60フレームで動かし、各フレームのバッチを出力します。

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

[リスト](./lists.md)では、仮想化が働く様子を確認できます。どのフレームで新しい行がバインドされるか、1行あたり何回の操作が必要か、新しい行が現れないフレームでは何も生成されないことがわかります。意味のある計測値を得るには、リリースビルドで使用してください(`cargo test --release`、チェックアウトした環境では `./target/release/nsh`)。

<a id="in-ci"></a>

### CI での利用

ヘッドレステストにはデバイスもディスプレイも不要なため、Linux ランナーで実行できます。Rust アプリのテストには `cargo test`、TSX アプリには CLI だけで動作する `nsh test` を使います。どちらも、失敗したテストがあれば非ゼロのコードで終了します。対象は、失敗したテスト、ビルドできないアプリ、何も描画しないアプリ、ステップ中にアプリがスローした例外です。

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

(ランナーには、ローカルと同じ方法で `nsh` CLI をインストールしてください。[インストール](./installation.md)を参照してください。)

`--junit <FILE>` は結果を JUnit XML レポートとしても出力します。CI サービス(GitHub Actions のテストレポーター、GitLab、Jenkins、Azure Pipelines)はこれをテストごとに表示します。テストファイルごとに `testsuite`、テストごとに `testcase` が出力され、何が、どこで失敗したか、そして画面上のテキストが含まれます。

パフォーマンスを監視するには、いくつかの操作のアイテム数(`── … : N items` 行と、`--trace` の `ops` / `mount items` の数値)を記録し、それが増えたら失敗させます。カウントは決定的ですが、共有 CI マシン上の計測時間はそうではありません。

> [!NOTE]
> テストは、実機と同様に、アプリの `nsh.json` が宣言する `capabilities` のもとで実行されます。アプリが宣言していないものは、テストでも拒否されます。

<a id="784-for-ui-tests"></a>

## UI テスト用の `testID`

ヘッドレステストが検証するのはランタイムが描画する内容であり、`id:` セレクターはテスト ID でビューを見つけます。プラットフォームのテストツール(XCUITest、Espresso / UI Automator、Appium、Maestro)で実際のネイティブ UI を操作するには、ビューにテスト ID を付けます。Rust では `.test_id(…)`、TSX では `testID` を使います。

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

| プラットフォーム | `testID` の設定先 |
|---|---|
| iOS | ビューの `accessibilityIdentifier` です(XCUITest では `app.otherElements["add-to-cart"]`)。 |
| Android | アクセシビリティノードのビュー ID リソース名です(UI Automator では `By.res("add-to-cart")`)。 |

Rust では、テスト ID はすべての要素のメソッドであり、コンポーネントの要素も含まれます(`button().test_id("save")` はコンポーネントのルートに名前を付けます)。また `testID` は、すべての要素とすべての Rust コンポーネントのプロパティです(`Button`、`Dialog` など)。テスト ID は、スクリーンリーダーが読み上げる内容を変更しません。そのためには `accessibilityLabel` を使ってください([アクセシビリティ](./accessibility.md)を参照)。`--trace` の出力では、ビューの `ViewProps` アイテムに `test_id: Some("add-to-cart")` として表示されます。

<a id="see-also"></a>

## 関連項目

- [パフォーマンス](./performance.md): これらの数値で何に注目すべきか
- [開発サーバーとデバッグ](./dev-server-and-debugging.md)
- [アーキテクチャ](./architecture.md): 操作、コミット、マウントバッチ
