---
title: "沙盒與權限能力"
description: "每個 NSH 應用程式運行時所受的限制(記憶體、時間、節點)、發行版本的語言強化機制,以及在 nsh.json 中宣告並由宿主應用程式授予的權限能力。"
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---


# 沙盒與權限能力

用 Rust 編寫的應用程式是編譯進其發佈應用程式內的原生程式碼，與該應用程式的其餘部分一樣，並以其信任級別運行；它對 NSH 服務（`fetch`、圖片、web view、狀態列）的呼叫，與 TSX 的呼叫一樣，會在宿主應用程式授予的範圍內經過相同的原生檢查。應用程式運行的 TSX 和 JavaScript，無論是自己編寫的，還是下載的[已簽署套件](./signed-packages.md)，都在每個 view 各自的 QuickJS VM 中運行，而它們在該 VM 以外能做的一切都要經過 NSH 的原生 runtime。這使你可以在宿主應用程式控制的規則下運行並非由你編寫的程式碼，例如第三方 mini app 或下載的更新：

- **限制（Limits）**約束單一應用程式可使用的記憶體、時間和原生資源。
- **加固（Hardening）**在 release build 中移除所有將字串轉換為程式碼的途徑。
- **能力（Capabilities）**列明應用程式可存取的範圍：可從哪些主機 fetch、web view 可顯示哪些頁面、能否更改狀態列。能力由應用程式宣告；宿主應用程式可以授予較少的能力。

bundle 只包含應用程式自己的程式碼：reactive graph、renderer 以及應用程式 import 的每個模組都是原生的。因此 JS 中沒有任何東西是受信任的，每項限制和檢查都在 Rust 中執行；應用程式沒有任何可以修補來繞過這些限制和檢查的 JS 程式碼。

<a id="limits"></a>

## 限制

限制約束的是 VM：它們適用於 TSX 和 JavaScript。嵌入另一個應用程式的應用程式，在其宿主應用程式決定的限制內運行。獨立的應用程式（以 `nsh package` 打包，包括 web，或以 `nsh run` 運行）是你自己的程式碼，與原生應用程式一樣：它使用裝置提供的記憶體和時間，而其 4096 KB 的 interpreter stack 會把過深的遞迴變成應用程式可以捕捉的 `RangeError`。

嵌入式應用程式有以下限制：

| 限制 | 預設值 | 達到限制時 |
|---|---|---|
| JS heap | 256 MB | VM 停止。 |
| Interpreter stack | 4096 KB（亦是上限） | 過深的遞迴會拋出 `RangeError`，應用程式可以捕捉。 |
| 評估 bundle 的時間 | 10 秒 | 評估被中斷。 |
| 任何其他 JS 呼叫的時間 | 2 秒 | 該呼叫被中斷；應用程式繼續運行。 |
| 保留的節點數 | 200 000 | VM 停止。 |
| 同時發生的變更（已排入佇列的操作） | 8 000 000 個值 | VM 停止。 |
| 單次 canvas 繪製的操作數 | 1 000 000 | VM 停止。 |

**時間以每次呼叫計算，而非每個應用程式。**「呼叫」是指 runtime 要求 JS 做的一件事：處理一個事件（包括它引起的渲染）、綁定一個列表行、運行一個計時器、運行一個影格的 `requestAnimationFrame` callback、清空 microtask 佇列。長時間運行的應用程式不會把時間累計到限制上；只有單一個沒有及時返回的呼叫才會被中斷。巢狀在另一個呼叫內的呼叫，共用外層呼叫的預算。

被中斷的呼叫會以一個任何 `catch` 都無法吞沒的例外結束，並且錯誤報告會說明所超出的預算：

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

VM 會繼續運行：下一個事件、計時器或影格會正常運行。

**記憶體耗盡或超出配額會令 VM 停止。**錯誤只會報告一次（報告給宿主應用程式的錯誤處理器，在開發 build 中則顯示在應用程式上方），此後不再運行任何 JS，而各 view 保持原狀。節點配額和操作配額之所以存在，是因為原生 view 和已排入佇列的變更存放在原生記憶體中，而 JS heap 限制並不涵蓋這部分：沒有這些配額，應用程式就可能透過 UI 耗盡裝置的記憶體。

> [!TIP]
> 這些限制對一般應用程式來說已相當寬鬆。如果你觸及 2 秒的呼叫預算，這表示該工作對單一事件而言本來就太長：它會在這段時間內凍結應用程式的更新。請用 `setTimeout` 將它拆分，或把它移出事件處理器。

宿主應用程式按每個 view 設定限制：[iOS](./ios.md#limits) 上用 `NshAppView.limits`，[Android](./android.md#limits) 上用 `NshView.setLimits`，[GPUI 應用程式](./gpui.md#embedding-in-a-gpui-app)中用 `AppOptions::limits` / `AppView::set_limits`。它們會從下一次載入起生效。

要在開發時查看 TSX 應用程式在宿主應用程式的限制內如何運作，可用 [`--limits`](./cli.md#nsh-run) 運行它：`nsh run App.tsx --limits` 使用上述預設值，而 `nsh run --limits memory=128MB,call=500ms` 會像宿主應用程式一樣設定這兩項，其餘保持預設值。

<a id="hardening"></a>

## 加固

Release build（所有不是從 dev server 載入的內容）在載入時會被加固：

- `eval` 被移除，而 `Function`、`AsyncFunction`、`GeneratorFunction` 和 `AsyncGeneratorFunction` 建構函式會拋出錯誤。NSH 不運行由字串產生的程式碼：

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- 所有模組共用的 prototype（`Object`、`Array`、`Function`、`String`、`Number`、`Promise`、`Map`、typed array 及其他）都被凍結，因此一個模組（或一個程式庫）無法為所有其他人更改 `Array.prototype`。`Error.prototype` 保持可寫入，讓錯誤子類別可以設定 `this.name`。

凍結 prototype 通常會破壞一種常見模式，即「override mistake」：當繼承而來的屬性被凍結時，對 `Sub.prototype.constructor = Sub` 或 `obj.toString = …` 賦值會拋出錯誤。NSH 把常被覆寫的成員（`constructor`、`toString`、`valueOf`、`toJSON` 等）轉為 accessor，其 setter 會在被賦值的物件上定義該屬性，因此這類程式碼（以及使用它的程式庫，例如 axios）可以繼續運作。

由 `nsh dev` / `nsh run` 提供的 bundle（無論有沒有 `--release`）不會被加固，因此你可以用 `eval` 除錯。在發佈依賴動態程式碼的程式碼之前，請用 `nsh test`（會加固）或打包的 build 測試 release 的行為。

<a id="capabilities"></a>

## 能力

應用程式在 `nsh.json` 中宣告它可以存取 VM 以外的哪些資源：

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

**沒有 `"capabilities"` 的應用程式可以做任何事**：獨立應用程式是其開發者自己的程式碼，不受任何限制。原始 TCP socket 在每個應用程式中都須透過 `network.sockets` 按名稱授予，宿主的函式則透過 `host` 授予。**有 `"capabilities"` 的應用程式只能做它列出的事**：其餘一律拒絕。未知的鍵會導致 build 錯誤，因此打錯字會在 build 時被發現，而不會在運行時變成缺少權限。來自較新版本 NSH 的[已簽署套件](./signed-packages.md#packages-from-newer-versions-of-nsh)可能宣告較舊 runtime 不認識的能力：這些能力在該 runtime 中不會被授予。

### `network`

涵蓋 `fetch`（包括每次重新導向）、WebSocket、遠端圖片（`<Image>`、`placeholder`、canvas 圖片、`Image.getSize` / `Image.prefetch`）、影片來源和原始 TCP socket（`net.connect`）。

| 鍵 | 類型 | 說明 |
|---|---|---|
| `hosts` | `string[]` | 應用程式可用任何方法和 scheme 存取的主機（`http`、`https`、`ws`、`wss`）。 |
| `http` | `object[]` | 更細緻的授權：一個主機，再由下列任何鍵收窄範圍。 |
| `http[].host` | `string` | 主機或主機模式（必填）。 |
| `http[].methods` | `string[]` | 允許的方法，例如 `["GET", "HEAD"]`。缺省：任何方法。 |
| `http[].schemes` | `string[]` | 允許的 scheme（`scheme`：單一個，以字串表示）。缺省：`http`、`https`、`ws`、`wss` 中的任何一個。 |
| `http[].port` | `number` | 連接埠；沒有連接埠的 URL 使用其 scheme 的預設值（`https` 為 443）。缺省：任何連接埠。 |
| `http[].paths` | `string[]` | 精確的路徑，例如 `["/v1/quote"]`（query 不屬於路徑的一部分）。 |
| `http[].pathPrefixes` | `string[]` | 涵蓋整個區段的路徑前綴：`/v1` 涵蓋 `/v1` 和 `/v1/quote`，`/v1/` 涵蓋其後的內容。`pathPrefix`（單一個，以字串表示）和 `path_prefixes` 的作用相同。 |
| `sockets` | `string[]` | [`net.connect`](../modules/standard-modules.md) 的原始 TCP 目的地，每項都是精確的 `"host:port"`（IPv6 用 `"[::1]:9000"`）。 |

`http` 規則在沒有列出 `paths` 或 `pathPrefixes` 時涵蓋所有路徑；兩者都有時，符合其中任何一個的路徑均涵蓋在內。

主機模式可以是 `*`（任何主機）、`*.example.com`（`example.com` 的任何子網域，不包括 `example.com` 本身）或精確的主機名稱。比對時會忽略大小寫和連接埠。主機取自最後一個 `@` 之後的部分，因此 `https://api.example.com@evil.io/` 會被當作 `evil.io` 來檢查。

WebSocket 握手是一個 HTTP GET：`ws://` 會被當作 `http://` 來檢查，`wss://` 則當作 `https://`，因此凡是允許 GET 該 URL 的 hosts 和 `http` 授權，都會允許該 WebSocket。原始 socket 會越過所有 HTTP 規則，因此 `sockets` 會精確列出每個主機和連接埠，而且只有 `sockets` 才會授予它們。

`asset:` URI（應用程式自己的檔案）一律允許；圖片和影片亦可使用 `data:` URI 和相對路徑。

### `webview`

| 鍵 | 類型 | 說明 |
|---|---|---|
| `hosts` | `string[]` | [web view](./web-view-and-video.md) 可顯示和導覽到的主機（`http` 和 `https`）。沒有 `webview` 時，應用程式完全不能顯示網頁。 |
| `input` | `boolean` | web view 的 ref 可向其頁面提供受信任的輸入（[`sendInput`](./web-view-and-video.md#input-as-the-users-own)）。除非宣告，否則永遠不會授予，沒有 `"capabilities"` 的應用程式亦然。 |

web view 內的頂層導覽也會在載入前由平台的 navigation delegate 檢查。頁面自己的子資源（其腳本、圖片、XHR）屬於網頁內容自己的事務，不會被檢查。`about:blank` 和內嵌 HTML（`html`）只需要 web view 已被授予即可：`"webview": { "hosts": [] }` 會允許它們，而不會允許任何遠端頁面。

`input` 與 `hosts` 分開，是因為受信任的輸入帶有使用者啟動狀態（user activation），而 `injectJavaScript` 永遠不會有：頁面因此可以開啟視窗、寫入剪貼簿、開啟系統的檔案面板、啟動 WebAuthn 或權限提示，並按下任何檢查 `isTrusted` 的按鈕。沒有它時，core 會丟棄 `sendInput`，並記錄應該加入哪個鍵。

### `statusBar`

`"statusBar": true` 讓應用程式可以更改狀態列（[`nsh/base`](../modules/nsh-base.md#status-bar) 中頁面和對話框的 `statusBar`，以及 `nsh.json` 的 `"statusBar"` 預設值）。

### `clipboard`

`"clipboard": true` 讓應用程式可以讀取和寫入系統剪貼簿（[`Clipboard`](../modules/nsh.md#clipboard)）。從可選取文字的編輯選單複製屬於使用者自己的操作，不需要任何能力。

### `picker`

`"picker": true` 讓應用程式可以顯示系統的相片選擇器（[`Picker`](../modules/nsh.md#picker)）：由使用者選擇哪些內容傳給應用程式。

### `speech`

`"speech": true` 讓應用程式可以辨識使用者所說的話（[`Speech`](../modules/nsh.md#speech)）：包括麥克風和系統的語音辨識器，其轉錄文字會傳給應用程式。系統仍會向使用者詢問一次。

### `openUrl`

讓應用程式可以在自身以外開啟 URL（[`openUrl`](../modules/nsh.md#openurl)，以及 `TextView` 中帶有 `links="open"` 的連結）：`"openUrl": true` 表示所有 scheme，`"openUrl": { "schemes": ["https", "mailto"] }` 表示列出的 scheme。scheme 未獲授予的 URL 會以 `ERR_ACCESS_DENIED` reject（`permission` `"openUrl"`，`resource` 為該 URL）。會運行程式碼或存取應用程式自身資料的 URL（`javascript:`、`data:`、`file:` 等）無論有何能力，都永遠不會被開啟。

<a id="storage"></a>

### 儲存空間

每個應用程式都可以透過 [`Storage`](../modules/nsh.md#storage) 在裝置上保存自己的資料，不需要任何能力：儲存空間只存放該應用程式的資料，而資料存放在哪裏由嵌入它的應用程式決定。

### `host`

`host` 列出嵌入 NSH 的應用程式中，`nsh` 的 `host.call(name, args)` 可以呼叫的函式：精確名稱（`"getUserInfo"`）或以 `*` 結尾的前綴（`"bridge.*"` 符合 `bridge.call` 和 `bridge.share`）。`"host": true` 允許所有函式。未列出的函式會被拒絕，沒有 `"capabilities"` 的應用程式亦然：宿主的函式預設永遠不會被授予；而 build 一個從 `nsh` import `host` 但沒有 `host` 的應用程式時，會警告每次呼叫都會被拒絕。名稱長 1 至 128 個字元，由 `A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:` 及 `-` 組成，不得含 `..`；任何其他名稱的呼叫會在讀取授權之前被拒絕。前綴應以分隔符（`"bridge.*"`）結尾：`"bridge*"` 亦會符合 `bridgeAdmin`。宿主的事件（`host.on(event, listener)`）會照宿主發送的內容傳給應用程式的 listener。

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` 在嵌入宿主的平台上為 true；在其他平台上，`host.call` 會以 `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` reject。
<a id="what-a-refusal-looks-like"></a>

### 拒絕時的表現

| 請求 | 結果 |
|---|---|
| `fetch` | Promise 會以 `TypeError` reject，與所有失敗的請求一樣，其 `code` 為 `ERR_ACCESS_DENIED`，`permission` `"network"`，而 `resource` 指出該 URL（請求的 URL 或重新導向的 URL）；請求不會到達網絡。 |
| `Image.getSize`、`Image.prefetch` | Promise 會以 `ERR_ACCESS_DENIED` reject，`permission` `"network"`，而 `resource` 指出該 URL；圖片不會被請求。 |
| 遠端圖片、影片來源、web view 來源或 `html` | 不會顯示任何內容，而該元素的 `onError` 會以 `code` `"ERR_ACCESS_DENIED"` 回報。web view 導航至未獲授權的主機時會被取消，並以同樣方式回報。 |
| 狀態列變更、canvas 圖片 | 不會有任何變更或繪製；拒絕會被記錄。 |
| 剪貼簿 | `Clipboard` 的每個函式都會以 `ERR_ACCESS_DENIED` reject，`permission` `"clipboard"`，並 `resource` `""`；系統剪貼簿不會被觸及。 |
| 選擇器 | `pickImages` 不會顯示任何內容，並以 `ERR_ACCESS_DENIED` reject，`permission` `"picker"`，並 `resource` `""`。 |
| 語音 | `Speech.start` 會拋出 `ERR_ACCESS_DENIED`，`permission` `"speech"`，並 `resource` `""`；麥克風保持關閉。 |
| `openUrl` | Promise 會以 `ERR_ACCESS_DENIED` reject，`permission` `"openUrl"`，而 `resource` 指出該 URL；不會開啟任何內容。 |
| 主機呼叫 | `host.call` 會以 `ERR_ACCESS_DENIED` reject，`permission` `"host"`，而 `resource` 指出該函式的名稱（`host.post` 則會拋出該錯誤）；呼叫不會到達主機。 |
| 檔案（`fs/promises`） | Promise 會以 `ERR_ACCESS_DENIED` reject，`permission` `"fs"`，而 `resource` 指出該路徑；磁碟不會被觸及。 |
| 處理程序（`process`） | `run` 會 reject，`spawn` 和 `exit` 會拋出錯誤，錯誤為 `ERR_ACCESS_DENIED`，`permission` `"process"`，而 `resource` 指出該指令（對 `exit` 則為 `"exit"`）；不會啟動任何子處理程序。 |
| TCP socket（`net.connect`） | Promise 會以 `ERR_ACCESS_DENIED` reject，`permission` `"network"`，而 `resource` 指出該 `"host:port"`，且發生在任何 DNS 查詢之前。 |
| WebSocket | `websocket` 模組的 `connect` 會以 `ERR_ACCESS_DENIED` reject，`permission` `"network"`，而 `resource` 指出該 URL；全域 `WebSocket` 會觸發 `error`，然後觸發 `close`（code 1006），與連線失敗時的情況相同。 |

[標準模組](../modules/standard-modules.md#failures)的錯誤帶有 `code` `"ERR_ACCESS_DENIED"`，讓應用程式能分辨拒絕與操作失敗，而它們的 `permission` 和 `resource` 會指出相關的 capability 及所請求的內容。[`nsh`](../modules/nsh.md)的模組以同樣方式拒絕：它們的 Promise 會以 `ERR_ACCESS_DENIED`、`permission` 和 `resource` reject（`fetch` 搭配 `TypeError`，即所有失敗請求所屬的類別）。

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Rust 元件會以 Rust 的方式得到相同的拒絕結果：被拒絕的剪貼簿讀取會回傳與空剪貼簿相同的結果，被拒絕的選取會回傳沒有檔案，被拒絕的 `open_url` 會回傳 `false`，而被拒絕的 `fetch` 會回傳帶有訊息的 `Err`。

每次拒絕都會記錄一次，並說明應新增哪個 key：

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

重新導向由 NSH 處理，而不是由平台的 HTTP 堆疊處理，因此每一次跳轉都會根據 capabilities 檢查。（串流的請求主體不會被重複發送，因此串流上傳的 `307` / `308` 重新導向會失敗。）

<a id="where-capabilities-travel"></a>

### Capabilities 的傳遞方式

此宣告會隨應用程式一併傳遞：

- `nsh build` 和 `nsh package` 會將它寫成 `capabilities.json`，放在 bundle 旁邊；
- `nsh publish` 會將它放入[已簽署套件](./signed-packages.md)的標頭中，並受簽章涵蓋；
- `nsh dev` 會在每次建置時一併發送，因此開發時也會執行相同的規則。更改 `capabilities` 時，應用程式會重新載入，而不是進行熱修補。

<a id="grants-what-a-host-app-allows"></a>

## Grants：宿主應用程式所允許的內容

嵌入 NSH 的宿主應用程式可以用相同的 JSON 格式授予**至多**某些 capabilities：

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

請求必須同時獲得應用程式的宣告**和**宿主的 grant 允許。在上述 grant 下，宣告了 `"hosts": ["*"]` 的應用程式仍然只能存取 `api.example.com`，並且不能顯示網頁或更改狀態列。如果沒有 grant（`nil` / `null`，即預設值），則以各應用程式自行宣告的內容為準。

Grants 會在下次載入時生效。對於第三方小程式，典型的設定是：只授予每個小程式其自身的 API 主機，從[已簽署套件](./signed-packages.md)執行（其宣告須經你審閱），並保留預設限制或將其調低。

> [!WARNING]
> 宿主應用程式註冊的[原生元件](./native-components.md)屬於宿主自己的程式碼：capabilities 不適用於它們。只應註冊對該 view 可能執行的每個應用程式都安全的元件。

<a id="summary"></a>

## 摘要

| 層級 | 由誰執行 | 由誰設定 |
|---|---|---|
| 限制（heap、stack、時間、節點） | runtime，按每個 VM | 宿主應用程式按每個 view 設定（嵌入式應用程式） |
| 強化 | runtime，於載入時 | 在開發環境以外一律啟用 |
| Capabilities | runtime（fetch、圖片、影片、web view、狀態列、檔案、處理程序、socket） | 應用程式（`nsh.json`）和宿主應用程式（grant） |
| 程式碼完整性 | 簽章驗證 | `nsh publish`；宿主應用程式的受信任根 |

<a id="see-also"></a>

## 另見

- [已簽署套件](./signed-packages.md)
- [網絡](./networking.md)
- [嵌入 iOS 應用程式](./ios.md)、[嵌入 Android 應用程式](./android.md)
