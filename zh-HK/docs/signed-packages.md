---
title: "簽署套件"
description: "發佈可供宿主應用程式下載及驗證的應用程式碼:金鑰、憑證、nsh publish、重新簽署、驗證、撤銷及回滾保護。"
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---


# 簽署套件

簽署套件（`.nshpkg`）是宿主應用程式執行並非隨應用程式一同發佈的 NSH 程式碼的方式：可以是其自身 NSH 畫面的更新，或第三方小程式。`nsh publish` 會構建應用程式並為其簽署；宿主應用程式在執行任何內容之前，會先驗證簽署、憑證鏈、撤銷記錄和構建編號。

套件內含的是 TSX。宿主應用程式的 Rust 程式碼（以 Rust 編寫的應用程式，以及其 crate 的元件、模組和類別）屬於宿主應用程式本身，隨應用程式一併交付，而套件中的 TSX 會如任何 TSX 一樣，透過其 specifier 匯入這些內容（[使用 Rust 構建](./rust.md#extending-a-rust-app-with-tsx)）。因此，Rust 應用程式可以把核心保留在 Rust 中，並把經常變動的畫面以簽署套件的方式交付。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH 負責驗證和執行套件，但不負責派發套件。套件從何而來（你的更新伺服器、CDN、小程式商店），以及應用程式何時下載，均由宿主應用程式決定。

<a id="why-packages-are-signed"></a>

## 為何要為套件簽署

宿主應用程式所執行的 JS 可以存取應用程式所[授予](./sandbox-and-capabilities.md)的一切，因此必須來自應用程式信任的一方。還有第二個原因：NSH 以 QuickJS 位元組碼的形式發佈應用程式，其載入速度比原始碼快，但 QuickJS 不會驗證位元組碼，精心構造的位元組碼可能破壞記憶體。因此，NSH 只會從應用程式自身（經系統簽署）的資源、開發者所連接的開發伺服器，以及已驗證的套件載入位元組碼。其他來源一律必須是 JS 原始碼。

<a id="keys-two-levels"></a>

## 金鑰：兩個層級

- **根金鑰**保持離線。宿主應用程式信任其公開金鑰；可以同時信任多個根金鑰，根金鑰便是以此方式輪換。
- 根金鑰會**認證發佈金鑰**：憑證會指明發佈金鑰、其可為哪些應用程式 id 簽署，以及有效時段。
- **套件由發佈金鑰簽署**，並附帶該金鑰的憑證。因此，發佈金鑰可以在無需更新宿主應用程式的情況下輪換（或撤銷），因為宿主應用程式只認識根金鑰。

每條金鑰都有一個由其公開金鑰推導出來的 id（其 SHA-256 的前 8 個位元組，以十六進位表示），每個指令都會把它列印出來。

<a id="create-the-keys"></a>

### 建立金鑰

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

每條金鑰由兩個檔案組成：`<name>.secret`（只有擁有者可讀取）和 `<name>.pub`，內容均為單行 base64。`nsh keygen` 絕不會覆寫已存在的金鑰。

> [!CAUTION]
> 請將 `root.secret` 離線保管，例如存放在保險箱內的加密磁碟上。任何持有它的人，都可以認證所有信任該根金鑰的宿主應用程式皆會接受的金鑰。發佈金鑰則應放在構建機器上或 CI 的機密設定中。

<a id="certify-a-release-key"></a>

### 認證發佈金鑰

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| 旗標 | 說明 |
|---|---|
| `--root <file>` | 根金鑰的私密金鑰。 |
| `--key <file>` | 發佈金鑰的公開金鑰。 |
| `--apps <pattern>` | 其可為哪些應用程式 id 簽署：`*`（任何 id）、`com.example.*`（`com.example.` 之下的 id）或某個確切的 id。可重複使用。 |
| `--days <n>` | 從現在起計，其可簽署多久。預設為 365。 |
| `-o, --out <file>` | 要寫入的憑證。 |

憑證是一個小型 JSON 檔案，並非機密。

<a id="publish-a-package"></a>

## 發佈套件

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` 會以 release 模式構建應用程式並為其簽署。應用程式 id、名稱、版本和構建編號取自入口檔案旁邊的 `nsh.json`，並可由旗標覆寫：

| 旗標 | 說明 |
|---|---|
| `--key <file>` | 發佈金鑰的私密金鑰。 |
| `--cert <file>` | 其憑證。 |
| `-o, --out <file>` | 要寫入的套件。預設為 `.nsh/out/<id>-<build>.nshpkg`。 |
| `--id <id>` | 應用程式 id，例如 `com.example.app`。 |
| `--app-version <version>` | 版本，例如 `1.2.0`。 |
| `--build <n>` | 構建編號。必須提供（在此或在 `nsh.json` 中）；每次發佈都必須遞增。 |
| `--source-map <where>` | `package`（預設）：包含在套件內。`file`：放在套件旁邊的 `<package>.map` 中，不包含在套件內。`none`：不輸出。參閱[已發佈套件的錯誤](#errors-from-published-packages)。 |
| `--strip-debug` | 在位元組碼中省略行號和列號表：套件更小，但錯誤堆疊不含位置。 |
| `--min-runtime <version>` | 可執行該套件的最低運行時，例如 `0.2.0`（`nsh.json` `minRuntime`）。預設為此 CLI 的版本。參閱[哪些運行時可執行套件](#which-runtimes-run-a-package)。 |

`nsh publish` 會拒絕簽署裝置會拒絕的內容：憑證必須涵蓋該應用程式 id 和當前時間。

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### 哪些運行時可執行套件

套件會註明可執行它的最低 NSH 運行時，運行時較舊的宿主應用程式會在執行任何內容之前拒絕該套件：

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

預設情況下，這是構建該套件的 CLI 的版本：bundle 是針對該 CLI 的模組編譯的，因此該運行時是已知可執行它的版本。如果現場的宿主應用程式使用較舊的運行時，而你的應用程式只用到該運行時具備的功能，可使用 `--min-runtime`（或在 `nsh.json` 中設定 `minRuntime`）為其發佈：

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

版本格式為 `MAJOR.MINOR.PATCH`；預發佈後綴（`0.2.0-beta.1`）會視為不含後綴的版本。版本不可比 CLI 新。上傳套件之前，請先在使用該運行時的宿主應用程式上試用：較舊的運行時所缺少的 import 或函式，會在模組載入時失敗。

<a id="what-a-package-holds"></a>

### 套件的內容

套件是單一檔案：一個 JSON 標頭（應用程式 id、名稱、版本、構建編號、已宣告的 capability、位元組碼版本、最低運行時、簽署時間、發佈金鑰的憑證，以及附有 SHA-256 的檔案表），接著是各個檔案，最後是發佈金鑰對前面所有內容的 Ed25519 簽署。檔案包括：

- 應用程式的 JS 原始碼（必定包含），
- 其位元組碼，僅在裝置的運行時具有相同位元組碼版本時使用（否則會執行原始碼，因此套件在較新的運行時上仍可運作），
- 其 source map（除非發佈時使用了 `--source-map file` 或 `none`），
- 其所匯入的資產（圖片、字型）。

套件的識別碼（用於撤銷）是整個檔案的 SHA-256。

<a id="packages-from-newer-versions-of-nsh"></a>

### 來自較新版本 NSH 的套件

只要宿主應用程式的運行時不低於套件的[最低運行時](#which-runtimes-run-a-package)，便可執行由較新的 `nsh publish` 簽署的套件。較新版本新增、而宿主運行時不認識的內容會被略去，且絕不會擴大套件可執行的操作：

- 不認識的標頭欄位和檔案會被忽略（它們仍受簽署及其雜湊值涵蓋），除非套件將某個欄位標示為其運行時必須理解的欄位：此時較舊的運行時會拒絕該套件；
- 不認識的 [capability](./sandbox-and-capabilities.md) 不會被授予；而帶有不認識的鍵的 capability 或 `http` 授權會整個被丟棄，因為該鍵可能是用來加以限制的。

被略去的內容會在套件載入時記錄下來。

<a id="sign-a-package-again"></a>

## 重新簽署套件

分發多個應用程式套件的平台，可以用自己的一條金鑰為它們全部簽署：CI 構建每個套件，並以其測試應用程式所信任的金鑰簽署，然後平台再以正式應用程式所信任的金鑰重新簽署。

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| 旗標 | 說明 |
|---|---|
| `--key <file>` | 發佈金鑰的私密金鑰。 |
| `--cert <file>` | 其憑證。 |
| `-o, --out <file>` | 要寫入的套件。可以與讀取的套件相同。預設為：`.nsh/out/<id>-<build>.nshpkg`。 |

套件會保留 CI 放入的所有內容：檔案、應用程式 id、版本和構建編號、已宣告的 capability、[最低運行時](#which-runtimes-run-a-package)，以及[較新版本的 NSH](#packages-from-newer-versions-of-nsh) 所寫入的內容。憑證、簽署時間和簽署則改為新金鑰的，因此該套件擁有自己的 SHA-256，也就是用來[撤銷](#revoke-keys-and-packages)它的那一個。

簽署之前，`nsh publish` 會檢查套件是否完整（由其憑證所指明的金鑰簽署、其檔案表涵蓋所有資料、每個檔案都與其雜湊值相符），以及新憑證是否涵蓋該應用程式 id 和當前時間。此後，新的簽署會為該套件（包括其位元組碼）擔保，因此平台所重新簽署的，應是其自身構建所產生的套件。Rust 工具則使用 `nsh_package::resign(&bytes, &key, &certificate)` 重新簽署。

<a id="verify-a-package"></a>

## 驗證套件

`nsh verify` 會以與信任指定根金鑰的宿主應用程式完全相同的方式檢查套件：

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| 旗標 | 說明 |
|---|---|
| `--root <file>` | 受信任根金鑰的公開金鑰。可重複使用。若不提供，則只檢查套件自身的簽署。 |
| `--revocations <file>` | 要先套用的撤銷清單。 |

裝置會依次檢查：

1. 憑證是否由受信任的根金鑰簽署；
2. 發佈金鑰是否未被撤銷；
3. 套件是否由發佈金鑰簽署；
4. 憑證是否涵蓋應用程式 id 和簽署時間；
5. 套件所需的最低運行時；
6. 檔案表是否準確涵蓋所有資料，且每個檔案都與其雜湊值相符；
7. 套件本身是否未被撤銷；
8. 其構建編號是否不低於該應用程式先前所接受的最高構建編號（回滾保護）。

被拒絕的套件會引發錯誤，並說明哪一項檢查失敗；原本運行中的應用程式會繼續運行。

<a id="revoke-keys-and-packages"></a>

## 撤銷金鑰和套件

根金鑰會簽署**撤銷清單**：列出不得再載入的發佈金鑰和套件。

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| 旗標 | 說明 |
|---|---|
| `--root <file>` | 根金鑰的私密金鑰。 |
| `--extend <file>` | 保留此清單（最近一次發佈的清單）的條目。 |
| `--sequence <n>` | 清單的編號，必須高於以往發佈的任何清單。與 `--extend` 一併使用時，預設為該清單的編號加一。 |
| `--key <id>` | 要撤銷的發佈金鑰 id。可重複使用。 |
| `--package <sha256>` | 要撤銷的套件 SHA-256（即 `nsh verify` 所列印的值）。可重複使用。 |
| `-o, --out <file>` | 要寫入的清單。 |

信任儲存庫只會接受序號高於其現有清單的清單，因此無法透過重放舊清單來取消撤銷。請把最新的清單發佈到你的應用程式擷取清單的位置，並在開啟套件之前使用 `updateRevocations` 套用。

<a id="rollback-protection"></a>

## 回滾保護

宿主應用程式接受套件時，其信任儲存庫會記錄該應用程式 id 的構建編號，此後會拒絕較舊的構建。取得了含已知漏洞的舊版已簽署套件的攻擊者，無法令應用程式執行它。該記錄會保存在儲存庫的狀態目錄（`nsh-trust.json`）中，因此重新啟動後依然有效。在 GPUI 上，宿主應用程式可以在新套件證明運作正常後才記錄（`verify_package`，然後 `accept_package`；見下文）。

<a id="loading-packages-in-a-host-app"></a>

## 在宿主應用程式中載入套件

驗證時會對整個套件計算雜湊，並提取其資產（每個套件一次，位於信任儲存庫的目錄下），因此會在 UI 執行緒以外運行；執行結果則在 UI 執行緒上進行。

**GPUI (Rust)**，宿主應用程式還可以在套件證明運作正常後才接受它：

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)**：

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**：

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

在套件被接受之前，先前接受的構建仍然能通過驗證，因此新套件失敗的宿主應用程式可以退回至原本運行的版本（`AppView::on_error` 的致命錯誤，或在接受之前發生崩潰，都是相關的訊號）。比已接受構建更舊的構建仍會被拒絕，期間被撤銷的套件也不會被接受。`load_package` 會一次完成驗證和接受，就如 iOS 和 Android 上的 `openPackage` 一樣。

套件所宣告的 [capability](./sandbox-and-capabilities.md) 會隨套件一同帶備：套件只能執行其所宣告的操作，且僅限於宿主應用程式額外授予的部分。

完整 API：[GPUI](./gpui.md#embedding-in-a-gpui-app)、[嵌入 iOS 應用程式](./ios.md#signed-packages)、[嵌入 Android 應用程式](./android.md#signed-packages)。

<a id="errors-from-published-packages"></a>

## 已發佈套件的錯誤

套件的位元組碼保留了行號和列號表，因此其錯誤帶有位置，運行時會先利用套件的 source map 將位置對應到你的原始碼，再交給宿主應用程式的錯誤處理器：

```text
Error: boom
    at n (App.tsx:5:3)
```

source map 包含你應用程式的原始碼，通常是套件中最大的檔案：約佔 gallery 範例 2.6 MB 的一半。若要自行保管，可改為把它發佈在套件旁邊：

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

此後裝置會回報 bundle 的位置（`at n (bundle.js:1:80)`）。請把 map 與其所屬的套件一併保存，並使用 `nsh symbolicate` 對應宿主應用程式所回報的內容：

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` 會從檔案或標準輸入讀取錯誤文字，並接受 map 檔案或內含 map 的套件。行號表會令位元組碼增加約五分之一（對於附有 map 的套件則佔 3–5%）；`--strip-debug` 會將它們省略，之後堆疊會顯示為 `at n (<null>:0:1)`，沒有可對應的內容。

<a id="trying-a-package-in-development"></a>

## 在開發中試用套件

`nsh run` 所安裝的開發宿主，可以像嵌入式應用程式一樣執行套件。

在 iOS 上，宿主可執行檔接受 `--package <file>` 和一個或多個 `--root <root.pub>`。在 `nsh run` 已將宿主安裝到模擬器（`--target ios`）之後：

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

在 Android 上，開發宿主（`DevActivity`，由 `nsh run --target android` 安裝）接受 extra `package`（裝置上的路徑）和 `root`（base64 公開金鑰，以逗號分隔）：

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

它們的信任狀態存放在暫存（iOS）或快取（Android）目錄中，因此比其已接受的構建更舊的構建在那裡同樣會被拒絕。
<a id="a-release-checklist"></a>

## 發佈檢查清單

1. 將 root key 保持離線；為每個團隊或每個 app 系列認證一個 release key，有效期不超過一年。
2. 每次發佈都要在 `nsh.json` 中提升 `build`；沒有它的話，`nsh publish` 會拒絕接受該 package。
3. 在上傳 package 之前，先對它執行 `nsh verify --root root.pub`。
4. 將 `root.pub` 附帶在宿主 app 內；撤銷清單則另行發佈，這樣無需更新 app 也能撤銷。
5. 如果 release key 洩漏，請撤銷它（`nsh revoke --extend … --key <id>`），認證一個新的 key，然後重新發佈。
6. 如果使用會為其 app 簽署的平台，請為 CI 提供專屬的 root，只讓測試 app 信任它，並在正式版 app 中附帶該平台的 root；平台會再次為 CI 的 package 簽署（`nsh publish <package>`）。

<a id="see-also"></a>

## 另請參閱

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md)、[Embedding in Android apps](./android.md)
- [CLI](./cli.md)
