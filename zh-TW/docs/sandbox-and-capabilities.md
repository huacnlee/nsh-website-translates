---
title: "沙盒與權限能力"
description: "每個 NSH 應用程式執行時所受的限制（記憶體、時間、節點數）、發行版本的語言強化機制，以及在 nsh.json 中宣告並由宿主應用程式授予的權限能力。"
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---

# 沙箱與權限（Capabilities）

以 Rust 撰寫的 app 是原生程式碼，與 app 的其餘部分一樣編譯進出貨的 app 中，並以該 app 的信任層級執行；它對 NSH 服務（`fetch`、圖片、web view、狀態列）的呼叫，會在宿主所授予的範圍內，經過與 TSX 相同的原生檢查。app 執行的 TSX 與 JavaScript（無論是自己的，或是下載的[已簽署套件](./signed-packages.md)）會在每個 view 各自的 QuickJS VM 中執行，而它們在該 VM 之外能做的一切，都要經過 NSH 的原生 runtime。這使得你可以在由宿主 app 控制的規則下，執行不是你所撰寫的程式碼，例如第三方 mini app 或下載的更新：

- **限制（Limits）** 約束單一 app 可使用的記憶體、時間與原生資源。
- **強化（Hardening）** 在 release 建置中移除所有把字串轉成程式碼的途徑。
- **權限（Capabilities）** 列出 app 可以觸及的範圍：可以對哪些主機發出 fetch、web view 可以顯示哪些頁面、是否可以變更狀態列。權限由 app 宣告，宿主 app 可以授予較少的權限。

bundle 只包含 app 的程式碼：reactive graph、renderer 以及 app 匯入的每個模組都是原生的。因此 JS 中沒有任何東西是受信任的，所有限制與檢查都在 Rust 中執行；app 沒有任何可以修補來繞過它們的 JS 程式碼。

<a id="limits"></a>

## 限制（Limits）

限制約束的是 VM：它們適用於 TSX 與 JavaScript。嵌入在另一個 app 中的 app，會在其宿主 app 決定的限制內執行。獨立執行的 app（以 `nsh package` 打包，包含 web，或以 `nsh run` 執行）是你自己的程式碼，就像原生 app 一樣：它使用裝置提供給它的記憶體與時間，而其 4096 KB 的直譯器堆疊會把過深的遞迴轉為 app 可以捕捉的 `RangeError`。

嵌入式 app 有以下限制：

| 限制 | 預設值 | 達到限制時 |
|---|---|---|
| JS heap | 256 MB | VM 停止。 |
| 直譯器堆疊 | 4096 KB（同時也是上限） | 過深的遞迴會擲出 `RangeError`，app 可以捕捉。 |
| 評估 bundle 的時間 | 10 秒 | 評估被中斷。 |
| 其他任何進入 JS 的呼叫時間 | 2 秒 | 該呼叫被中斷；app 繼續執行。 |
| 保留的節點數 | 200 000 | VM 停止。 |
| 一次的變更數（佇列中的操作） | 8 000 000 個值 | VM 停止。 |
| 單次 canvas 繪圖的操作數 | 1 000 000 | VM 停止。 |

**時間是依每次呼叫計算預算，而非依每個 app。** 一次「呼叫」是 runtime 要求 JS 做的一件事：處理一個事件（包含其引發的渲染）、綁定一個列表列、執行一個計時器、執行一個影格的 `requestAnimationFrame` 回呼、清空 microtask 佇列。長時間執行的 app 不會累積時間而觸及限制；只有單一一次未能及時返回的呼叫會被中斷。巢狀在另一個呼叫內的呼叫，共用外層呼叫的預算。

被中斷的呼叫會以一個任何 `catch` 都無法吞掉的例外結束，並且回報時會附上所超出的預算：

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

VM 會繼續執行：下一個事件、計時器或影格會正常執行。

**記憶體耗盡或超過配額會使 VM 停止。** 錯誤只會回報一次（回報給宿主 app 的錯誤處理器，在開發建置中則會顯示在 app 上方），此後不再執行任何 JS，而 view 會維持原狀。節點與操作的配額之所以存在，是因為原生 view 與佇列中的變更存放於原生記憶體，而 JS heap 限制並不涵蓋這部分：沒有這些配額的話，app 可以透過 UI 耗盡裝置的記憶體。

> [!TIP]
> 對一般的 app 而言，這些限制相當寬裕。如果你觸及 2 秒的呼叫預算，那麼這項工作對單一事件來說本來就太長了：它會讓 app 的更新凍結那麼久。請用 `setTimeout` 將它拆分，或將它移出事件處理器。

宿主 app 依每個 view 設定限制：[iOS](./ios.md#limits) 上使用 `NshAppView.limits`，[Android](./android.md#limits) 上使用 `NshView.setLimits`，[GPUI app](./gpui.md#embedding-in-a-gpui-app) 中使用 `AppOptions::limits` / `AppView::set_limits`。這些設定會從下一次載入起生效。

若要在開發時查看 TSX app 在宿主 app 的限制下會有什麼行為，請以 [`--limits`](./cli.md#nsh-run) 執行：`nsh run App.tsx --limits` 使用上述預設值，而 `nsh run --limits memory=128MB,call=500ms` 會像宿主 app 那樣設定這兩項，其餘維持預設值。

<a id="hardening"></a>

## 強化（Hardening）

Release 建置（所有不是從 dev server 載入的建置）在載入時會被強化：

- `eval` 被移除，而 `Function`、`AsyncFunction`、`GeneratorFunction` 與 `AsyncGeneratorFunction` 建構函式會擲出錯誤。NSH 不執行由字串產生的程式碼：

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- 所有模組共用的 prototype（`Object`、`Array`、`Function`、`String`、`Number`、`Promise`、`Map`、typed array 以及其餘）都被凍結，因此單一模組（或單一函式庫）無法為其他所有人變更 `Array.prototype`。`Error.prototype` 仍可寫入，所以 error 的子類別可以設定 `this.name`。

凍結 prototype 通常會破壞一種常見的寫法，也就是「override mistake」：當被繼承的屬性已被凍結時，指派 `Sub.prototype.constructor = Sub` 或 `obj.toString = …` 會擲出錯誤。NSH 把常被覆寫的成員（`constructor`、`toString`、`valueOf`、`toJSON` 等）改為 accessor，其 setter 會在被指派的物件上定義該屬性，因此這類程式碼（以及使用它的函式庫，如 axios）仍能正常運作。

由 `nsh dev` / `nsh run` 提供的 bundle（無論有無 `--release`）不會被強化，因此你可以用 `eval` 進行除錯。在出貨依賴動態程式碼的程式碼之前，請以 `nsh test`（會進行強化）或打包後的建置測試 release 的行為。

<a id="capabilities"></a>

## 權限（Capabilities）

app 在 `nsh.json` 中宣告它可以觸及 VM 之外的哪些資源：

```json
{
  "name": "Quotes",
  "id": "com.example.quotes",
  "version": "1.0.0",
  "build": 3,
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }],
      "sockets": ["feed.example.com:7000"]
    },
    "webview": { "hosts": ["*.example.com"], "input": true },
    "statusBar": true,
    "clipboard": true,
    "picker": true,
    "speech": true,
    "host": ["getUserInfo", "bridge.*"],
    "openUrl": { "schemes": ["https", "mailto"] }
  }
}
```

**沒有 `"capabilities"` 的 app 可以做任何事**：獨立執行的 app 是其開發者自己的，沒有任何限制。原始 TCP socket 在每個 app 中都是透過 `network.sockets` 依名稱授予，而宿主的函式則透過 `host` 授予。**有 `"capabilities"` 的 app 只能做它所列出的事**：其餘一律拒絕。未知的鍵會造成建置錯誤，因此打字錯誤會在建置時被發現，而不是在執行時變成缺少的權限。來自較新 NSH 的[已簽署套件](./signed-packages.md#packages-from-newer-versions-of-nsh)可能宣告較舊 runtime 不認識的權限：在該 runtime 上不會授予這些權限。

### `network`

涵蓋 `fetch`（包含每一次重新導向）、WebSocket、遠端圖片（`<Image>`、`placeholder`、canvas 圖片、`Image.getSize` / `Image.prefetch`）、影片來源，以及原始 TCP socket（`net.connect`）。

| 鍵 | 型別 | 說明 |
|---|---|---|
| `hosts` | `string[]` | app 可以使用任何方法與 scheme 觸及的主機（`http`、`https`、`ws`、`wss`）。 |
| `http` | `object[]` | 更細緻的授權：一個主機，再以下列任一鍵加以縮小範圍。 |
| `http[].host` | `string` | 主機或主機樣式（必填）。 |
| `http[].methods` | `string[]` | 允許的方法，例如 `["GET", "HEAD"]`。省略時：任何方法。 |
| `http[].schemes` | `string[]` | 允許的 scheme（`scheme`：單一個，以字串表示）。省略時：`http`、`https`、`ws`、`wss` 皆可。 |
| `http[].port` | `number` | 連接埠；沒有連接埠的 URL 會使用其 scheme 的預設值（`https` 為 443）。省略時：任何連接埠。 |
| `http[].paths` | `string[]` | 精確路徑，例如 `["/v1/quote"]`（query 不屬於路徑的一部分）。 |
| `http[].pathPrefixes` | `string[]` | 涵蓋完整區段的路徑前綴：`/v1` 涵蓋 `/v1` 與 `/v1/quote`，`/v1/` 則涵蓋其後的內容。`pathPrefix`（單一個，以字串表示）與 `path_prefixes` 的作用相同。 |
| `sockets` | `string[]` | [`net.connect`](../modules/standard-modules.md) 的原始 TCP 目的地，每一個都是精確的 `"host:port"`（IPv6 則為 `"[::1]:9000"`）。 |

`http` 規則在沒有列出 `paths` 或 `pathPrefixes` 時涵蓋所有路徑；兩者都列出時，符合其中任一者的路徑即可。

主機樣式可以是 `*`（任何主機）、`*.example.com`（`example.com` 的任何子網域，不包含 `example.com` 本身），或精確的主機名稱。比對時忽略大小寫與連接埠。主機取自最後一個 `@` 之後的部分，因此 `https://api.example.com@evil.io/` 會被當作 `evil.io` 來檢查。

WebSocket 握手是一個 HTTP GET：`ws://` 會被當作 `http://` 來檢查，`wss://` 則當作 `https://`，因此允許對該 URL 發出 GET 的 hosts 與 `http` 授權，也允許該 WebSocket。原始 socket 可以越過所有 HTTP 規則，所以 `sockets` 要精確列出每個主機與連接埠，而且只有 `sockets` 會授予它們。

`asset:` URI（app 自己的檔案）一律允許；圖片與影片也可以使用 `data:` URI 與相對路徑。

### `webview`

| 鍵 | 型別 | 說明 |
|---|---|---|
| `hosts` | `string[]` | [web view](./web-view-and-video.md) 可以顯示並導覽到的主機（`http` 與 `https`）。沒有 `webview` 時，app 完全不能顯示網頁。 |
| `input` | `boolean` | web view 的 ref 可以向其頁面提供受信任的輸入（[`sendInput`](./web-view-and-video.md#input-as-the-users-own)）。除非有宣告，否則絕不授予，沒有 `"capabilities"` 的 app 也一樣。 |

web view 內的頂層導覽也會在載入之前，由平台的 navigation delegate 檢查。頁面自己的子資源（其腳本、圖片、XHR）屬於網頁內容自己的事務，不會被檢查。`about:blank` 與內嵌 HTML（`html`）只需要授予 web view 即可：`"webview": { "hosts": [] }` 允許它們，而不會允許任何遠端頁面。

`input` 與 `hosts` 分開，是因為受信任的輸入帶有使用者啟用（user activation），而 `injectJavaScript` 永遠不會有：頁面因此可以開啟視窗、寫入剪貼簿、開啟系統的檔案面板、啟動 WebAuthn 或權限提示，並按下任何檢查 `isTrusted` 的按鈕。沒有它時，核心會捨棄 `sendInput`，並記錄應該加入哪個鍵。

### `statusBar`

`"statusBar": true` 讓 app 可以變更狀態列（[`nsh/base`](../modules/nsh-base.md#status-bar) 中頁面與對話框的 `statusBar`，以及 `nsh.json` 的 `"statusBar"` 預設值）。

### `clipboard`

`"clipboard": true` 讓 app 可以讀取與寫入系統剪貼簿（[`Clipboard`](../modules/nsh.md#clipboard)）。從可選取文字的編輯選單複製是使用者自己的操作，不需要權限。

### `picker`

`"picker": true` 讓 app 可以顯示系統的照片選擇器（[`Picker`](../modules/nsh.md#picker)）：由使用者挑選要交給 app 的內容。

### `speech`

`"speech": true` 讓 app 可以辨識使用者所說的話（[`Speech`](../modules/nsh.md#speech)）：包含麥克風與系統的語音辨識器，其逐字稿會交給 app。系統仍會向使用者詢問一次。

### `openUrl`

讓 app 可以開啟 app 之外的 URL（[`openUrl`](../modules/nsh.md#openurl)、`TextView` 中帶有 `links="open"` 的連結）：`"openUrl": true` 代表所有 scheme，`"openUrl": { "schemes": ["https", "mailto"] }` 代表所列出的 scheme。scheme 未被授予的 URL 會以 `ERR_ACCESS_DENIED` 拒絕（`permission` `"openUrl"`，`resource` 為該 URL）。會執行程式碼或觸及 app 自身資料的 URL（`javascript:`、`data:`、`file:` 等）無論權限為何，一律不會被開啟。

### Storage

每個 app 都可以使用 [`Storage`](../modules/nsh.md#storage) 在裝置上保存自己的資料，不需要任何權限：儲存空間只存放該 app 的資料，而保存在何處由嵌入的 app 決定。

### `host`

`host` 列出嵌入 NSH 的 app 中，`nsh` 的 `host.call(name, args)` 可以呼叫的函式：精確名稱（`"getUserInfo"`）或以 `*` 結尾的前綴（`"bridge.*"` 符合 `bridge.call` 與 `bridge.share`）。`"host": true` 允許所有函式。未列出的函式會被拒絕，沒有 `"capabilities"` 的 app 也一樣：宿主的函式絕不會預設授予，而且在建置一個從 `nsh` 匯入 `host` 卻沒有 `host` 的 app 時，會警告每一次呼叫都將被拒絕。名稱長度為 1 到 128 個字元，字元可為 `A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:` 與 `-`，且不含 `..`；任何其他名稱的呼叫會在讀取授權之前就被拒絕。請以分隔符號（`"bridge.*"`）結束前綴：`"bridge*"` 也會符合 `bridgeAdmin`。宿主的事件（`host.on(event, listener)`）會依宿主送出的樣子傳到 app 的監聽器。

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` 在嵌入宿主的平台上為 true；在其他平台上，`host.call` 會以 `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` 拒絕。
<a id="what-a-refusal-looks-like"></a>

### 拒絕時的樣子

| 請求 | 結果 |
|---|---|
| `fetch` | Promise 會以 `TypeError` 被拒絕（與所有失敗的請求相同），其 `code` 為 `ERR_ACCESS_DENIED`，`permission` `"network"` 並 `resource` URL（請求的 URL 或重新導向的 URL）；請求絕不會送到網路。 |
| `Image.getSize`、`Image.prefetch` | Promise 會以 `ERR_ACCESS_DENIED` 被拒絕，`permission` `"network"` 並 `resource` URL；圖片絕不會被請求。 |
| 遠端圖片、影片來源、web view 來源或 `html` | 不會顯示任何內容，並由該元素的 `onError` 以 `code` `"ERR_ACCESS_DENIED"` 回報。web view 導覽至未獲授權的主機時會被取消，並以相同方式回報。 |
| 狀態列變更、canvas 圖片 | 不會有任何變更或繪製；拒絕會被記錄下來。 |
| 剪貼簿 | `Clipboard` 的每個函式都會以 `ERR_ACCESS_DENIED` 拒絕，`permission` `"clipboard"` 並 `resource` `""`；系統剪貼簿絕不會被存取。 |
| 選擇器 | `pickImages` 不會顯示任何內容，並以 `ERR_ACCESS_DENIED` 拒絕，`permission` `"picker"` 並 `resource` `""`。 |
| 語音 | `Speech.start` 會擲出 `ERR_ACCESS_DENIED`，`permission` `"speech"` 並 `resource` `""`；麥克風保持關閉。 |
| `openUrl` | Promise 會以 `ERR_ACCESS_DENIED` 被拒絕，`permission` `"openUrl"` 並 `resource` URL；不會開啟任何內容。 |
| 呼叫宿主 | `host.call` 會以 `ERR_ACCESS_DENIED` 拒絕，`permission` `"host"` 並 `resource` 該函式的名稱（`host.post` 則是擲出它）；呼叫絕不會傳到宿主。 |
| 檔案（`fs/promises`） | Promise 會以 `ERR_ACCESS_DENIED` 被拒絕，`permission` `"fs"` 並 `resource` 路徑；磁碟絕不會被存取。 |
| 處理程序（`process`） | `run` 會拒絕，而 `spawn` 與 `exit` 會擲出 `ERR_ACCESS_DENIED`，`permission` `"process"` 並 `resource` 該指令（`exit` 時為 `"exit"`）；不會啟動任何子處理程序。 |
| TCP socket（`net.connect`） | Promise 會以 `ERR_ACCESS_DENIED` 被拒絕，`permission` `"network"` 並 `resource` `"host:port"`，且發生在任何 DNS 查詢之前。 |
| WebSocket | `websocket` 模組的 `connect` 會以 `ERR_ACCESS_DENIED` 拒絕，`permission` `"network"` 並 `resource` URL；全域的 `WebSocket` 會觸發 `error`，接著觸發 `close`（code 1006），與連線失敗時的行為相同。 |

[標準模組](../modules/standard-modules.md#failures)的錯誤帶有 `code` `"ERR_ACCESS_DENIED"`，因此應用程式可以分辨是遭到拒絕，還是操作本身失敗；其 `permission` 與 `resource` 會指出相關的能力以及所請求的內容。[`nsh`](../modules/nsh.md)的模組也以相同方式拒絕：它們的 Promise 會以 `ERR_ACCESS_DENIED`、`permission` 與 `resource` 被拒絕（`fetch` 搭配 `TypeError`，即所有失敗請求所屬的類別）。

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Rust 元件會得到以 Rust 的方式表達的相同拒絕結果：被拒絕的剪貼簿讀取會回傳與空剪貼簿相同的結果，被拒絕的選擇會回傳沒有檔案，被拒絕的 `open_url` 會 `false`，而被拒絕的 `fetch` 會回傳帶有訊息的 `Err`。

每次拒絕都會記錄一次，並說明該新增哪個 key：

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

重新導向是由 NSH 處理，而不是由平台的 HTTP 堆疊處理，因此每一次跳轉都會對照能力進行檢查。（串流的請求主體不會被傳送兩次，因此串流上傳的 `307` / `308` 重新導向會失敗。）

<a id="where-capabilities-travel"></a>

### 能力宣告的傳遞位置

宣告會隨著應用程式一起傳遞到任何地方：

- `nsh build` 與 `nsh package` 會將它以 `capabilities.json` 的形式寫在 bundle 旁邊；
- `nsh publish` 會將它放入[簽署套件](./signed-packages.md)的標頭中，並由簽章涵蓋；
- `nsh dev` 會在每次建置時一併傳送，因此開發時也會套用相同的規則。變更 `capabilities` 會重新載入應用程式，而不是進行熱修補。

<a id="grants-what-a-host-app-allows"></a>

## 授權：宿主應用程式允許的內容

嵌入 NSH 的宿主應用程式，可以用相同的 JSON 格式授予**至多**某些能力：

```rust
// iOS, in Rust (nsh_platform_ios::AppView)
let grant = nsh_engine::Capabilities::from_json(&serde_json::json!({
    "network": { "hosts": ["api.example.com"] }
}))?;
app.set_granted_capabilities(Some(grant));
```

```swift
// iOS
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
```

```java
// Android
nsh.setGrantedCapabilities("{ \"network\": { \"hosts\": [\"api.example.com\"] } }");
```

請求必須同時被應用程式的宣告**與**宿主的授權所允許。在上述授權下，宣告了 `"hosts": ["*"]` 的應用程式仍然只能存取 `api.example.com`，且無法顯示網頁或變更狀態列。若沒有授權（`nil` / `null`，即預設值），則以各應用程式自身的宣告為準。

授權會從下一次載入起生效。對於第三方小型應用程式，典型的設定是：只授予每個應用程式它自己的 API 主機，從您已審查過宣告的[簽署套件](./signed-packages.md)執行它，並保留預設限制或調得更低。

> [!WARNING]
> 宿主應用程式註冊的[原生元件](./native-components.md)屬於宿主自己的程式碼：能力不適用於它們。請只註冊對該 view 可能執行的每個應用程式都安全的元件。

<a id="summary"></a>

## 摘要

| 層級 | 由誰強制執行 | 由誰設定 |
|---|---|---|
| 限制（堆積、堆疊、時間、節點） | 執行階段，依每個 VM | 宿主應用程式，依每個 view（嵌入式應用程式） |
| 強化 | 執行階段，於載入時 | 開發環境以外一律啟用 |
| 能力 | 執行階段（fetch、圖片、影片、web view、狀態列、檔案、處理程序、socket） | 應用程式（`nsh.json`）與宿主應用程式（授權） |
| 程式碼完整性 | 簽章驗證 | `nsh publish`；宿主應用程式的受信任根 |

<a id="see-also"></a>

## 另請參閱

- [簽署套件](./signed-packages.md)
- [網路](./networking.md)
- [嵌入 iOS 應用程式](./ios.md)、[嵌入 Android 應用程式](./android.md)
