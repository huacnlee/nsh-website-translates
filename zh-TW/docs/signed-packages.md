---
title: "已簽署的套件"
description: "發佈可供主應用程式下載並驗證的應用程式程式碼:金鑰、憑證、nsh publish、重新簽署、驗證、撤銷與回滾保護。"
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# 簽署套件

簽署套件（`.nshpkg`）是宿主應用程式執行未隨應用程式一同發行的 NSH 程式碼的方式：可以是對自身 NSH 畫面的更新，也可以是第三方小程式。`nsh publish` 會建置應用程式並簽署；宿主應用程式在執行任何內容之前，會先驗證簽章、憑證鏈、撤銷狀態與建置編號。

套件內含 TSX。宿主應用程式的 Rust 程式碼（以 Rust 撰寫的應用程式，及其 crate 的元件、模組與類別）屬於宿主應用程式本身，並隨之交付；套件中的 TSX 如同任何 TSX，透過 specifier 匯入這些內容（[使用 Rust 建置](./rust.md#extending-a-rust-app-with-tsx)）。因此 Rust 應用程式可以將核心保留在 Rust 中，並將經常變動的畫面以簽署套件的方式交付。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH 負責驗證並執行套件，但不負責派送套件。套件的來源（你的更新伺服器、CDN、小程式商店）以及應用程式何時下載套件，皆由宿主應用程式決定。

<a id="why-packages-are-signed"></a>

## 為什麼要簽署套件

宿主應用程式執行的 JS 可以存取應用程式所[授予](./sandbox-and-capabilities.md)的一切，因此它必須來自應用程式信任的對象。還有第二個原因：NSH 以 QuickJS 位元組碼的形式發行應用程式，載入速度比原始碼更快，但 QuickJS 不會驗證位元組碼，而精心構造的位元組碼可能破壞記憶體。因此 NSH 只會從應用程式自己的（經系統簽署的）資源、開發者連線的開發伺服器，以及已驗證的套件載入位元組碼。其他來源一律必須是 JS 原始碼。

<a id="keys-two-levels"></a>

## 金鑰：兩個層級

- **根金鑰**保持離線。宿主應用程式信任其公開金鑰；可以同時信任多把根金鑰，這就是輪替根金鑰的方式。
- 根金鑰會**認證發行金鑰**：憑證中載明發行金鑰、其可簽署的應用程式 id，以及有效期間。
- **套件由發行金鑰簽署**，並附帶其憑證。因此發行金鑰可以在不更新宿主應用程式的情況下輪替（或撤銷），因為宿主應用程式只認得根金鑰。

每把金鑰都有一個由其公開金鑰衍生的 id（其 SHA-256 的前 8 個位元組，以十六進位表示），每個指令都會印出。

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

每把金鑰由兩個檔案組成：`<name>.secret`（僅擁有者可讀取）與 `<name>.pub`，內容皆為單行 base64。`nsh keygen` 絕不會覆寫既有的金鑰。

> [!CAUTION]
> 請將 `root.secret` 離線保存，例如放在保險箱中的加密磁碟上。任何持有它的人都能認證金鑰，而所有信任該根金鑰的宿主應用程式都會接受這些金鑰。發行金鑰則應放在建置機器或 CI 的機密資料中。

<a id="certify-a-release-key"></a>

### 認證發行金鑰

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| 旗標 | 說明 |
|---|---|
| `--root <file>` | 根金鑰的私密金鑰。 |
| `--key <file>` | 發行金鑰的公開金鑰。 |
| `--apps <pattern>` | 可簽署的應用程式 id：`*`（任意）、`com.example.*`（`com.example.` 底下的 id）或確切的 id。可重複指定。 |
| `--days <n>` | 從現在起可簽署的時間長度。預設為 365。 |
| `-o, --out <file>` | 要寫出的憑證。 |

憑證是一個小型 JSON 檔案，並非機密。

<a id="publish-a-package"></a>

## 發佈套件

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` 會以 release 模式建置應用程式並簽署。應用程式 id、名稱、版本與建置編號取自進入點旁的 `nsh.json`，並可由旗標覆寫：

| 旗標 | 說明 |
|---|---|
| `--key <file>` | 發行金鑰的私密金鑰。 |
| `--cert <file>` | 其憑證。 |
| `-o, --out <file>` | 要寫出的套件。預設為 `.nsh/out/<id>-<build>.nshpkg`。 |
| `--id <id>` | 應用程式 id，例如 `com.example.app`。 |
| `--app-version <version>` | 版本，例如 `1.2.0`。 |
| `--build <n>` | 建置編號。必填（在此或 `nsh.json` 中指定）；每次發行都必須遞增。 |
| `--source-map <where>` | `package`（預設）：包含在套件中。`file`：放在套件旁的 `<package>.map`，不包含在套件中。`none`：省略。請參閱[已發佈套件的錯誤](#errors-from-published-packages)。 |
| `--strip-debug` | 不在位元組碼中包含行與欄對照表：套件更小，但錯誤堆疊不含位置資訊。 |
| `--min-runtime <version>` | 可執行該套件的最低執行階段版本，例如 `0.2.0`（`nsh.json` `minRuntime`）。預設為此 CLI 的版本。請參閱[哪些執行階段可以執行套件](#which-runtimes-run-a-package)。 |

`nsh publish` 會拒絕簽署裝置本來就會拒絕的內容：憑證必須涵蓋該應用程式 id 與目前時間。

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### 哪些執行階段可以執行套件

套件會載明可執行它的最低 NSH 執行階段版本，執行階段較舊的宿主應用程式會在執行任何內容之前就拒絕該套件：

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

預設值為建置該套件的 CLI 版本：封裝檔是針對該 CLI 的模組編譯的，因此該版本的執行階段是已知可以執行它的。如果現場的宿主應用程式使用較舊的執行階段，而應用程式只用到該執行階段所具備的功能，可以使用 `--min-runtime`（或在 `nsh.json` 中使用 `minRuntime`）針對它發佈：

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

版本格式為 `MAJOR.MINOR.PATCH`；預先發行後綴（`0.2.0-beta.1`）視同去掉後綴的版本。此版本不能比 CLI 更新。上傳前請在使用該執行階段的宿主應用程式上試用套件：較舊的執行階段所缺少的匯入或函式，會在模組載入時失敗。

<a id="what-a-package-holds"></a>

### 套件的內容

套件是單一檔案：一個 JSON 標頭（應用程式 id、名稱、版本、建置編號、宣告的 capabilities、位元組碼版本、最低執行階段、簽署時間、發行金鑰的憑證，以及一張含各檔案 SHA-256 的檔案表），接著是各個檔案，最後是發行金鑰對前述所有內容的 Ed25519 簽章。檔案包括：

- 應用程式的 JS 原始碼（一律包含），
- 其位元組碼，僅在裝置的執行階段具有相同的位元組碼版本時使用（否則會執行原始碼，因此套件在較新的執行階段上仍可運作），
- 其 source map（除非發佈時指定了 `--source-map file` 或 `none`），
- 它所匯入的資產（圖片、字型）。

套件的身分識別（用於撤銷）是整個檔案的 SHA-256。

<a id="packages-from-newer-versions-of-nsh"></a>

### 來自較新版 NSH 的套件

只要宿主應用程式的執行階段不低於套件的[最低執行階段](#which-runtimes-run-a-package)，就能執行由較新的 `nsh publish` 所簽署的套件。較新版本新增、但宿主執行階段不認得的內容會被忽略，而且絕不會擴大套件可執行的範圍：

- 不認得的標頭欄位與檔案會被忽略（它們仍受簽章與雜湊涵蓋），除非套件將某個欄位標示為其執行階段必須理解的欄位：此時較舊的執行階段會拒絕該套件；
- 不認得的 [capabilities](./sandbox-and-capabilities.md) 不會被授予，而含有不認得的鍵的 capability 或 `http` 授權會整個被捨棄，因為該鍵可能是用來限制它的。

被忽略的內容會在套件載入時記錄下來。

<a id="sign-a-package-again"></a>

## 重新簽署套件

散佈多個應用程式套件的平台，可以用自己的一把金鑰簽署所有套件：CI 建置每個套件，並以其測試應用程式信任的金鑰簽署，平台再以正式應用程式信任的金鑰重新簽署。

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| 旗標 | 說明 |
|---|---|
| `--key <file>` | 發行金鑰的私密金鑰。 |
| `--cert <file>` | 其憑證。 |
| `-o, --out <file>` | 要寫出的套件。可以與讀入的套件相同。預設為 `.nsh/out/<id>-<build>.nshpkg`。 |

套件會保留 CI 放入的一切內容：檔案、應用程式 id、版本與建置編號、宣告的 capabilities、[最低執行階段](#which-runtimes-run-a-package)，以及[較新版本的 NSH](#packages-from-newer-versions-of-nsh) 所寫入的內容。憑證、簽署時間與簽章則換成新金鑰的，因此套件會有自己的 SHA-256，也就是用來[撤銷](#revoke-keys-and-packages)它的那個值。

簽署之前，`nsh publish` 會檢查套件是否完整（由其憑證所載明的金鑰簽署、檔案表涵蓋全部資料、每個檔案都符合其雜湊），以及新憑證是否涵蓋該應用程式 id 與目前時間。此後由新的簽章為套件（包括其位元組碼）背書，因此平台重新簽署的是其自己的建置所產生的套件。Rust 工具使用 `nsh_package::resign(&bytes, &key, &certificate)` 重新簽署。

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
| `--root <file>` | 受信任的根金鑰的公開金鑰。可重複指定。若未指定，則只檢查套件本身的簽章。 |
| `--revocations <file>` | 要先套用的撤銷清單。 |

裝置會依序檢查：

1. 憑證是否由受信任的根金鑰簽署；
2. 發行金鑰是否未被撤銷；
3. 套件是否由發行金鑰簽署；
4. 憑證是否涵蓋該應用程式 id 與簽署時間；
5. 套件所需的最低執行階段；
6. 檔案表是否精確涵蓋全部資料，且每個檔案都符合其雜湊；
7. 套件本身是否未被撤銷；
8. 其建置編號是否不低於先前已接受的該應用程式最高建置編號（回滾保護）。

被拒絕的套件會拋出錯誤，指出是哪一項檢查失敗；原本正在執行的應用程式會繼續執行。

<a id="revoke-keys-and-packages"></a>

## 撤銷金鑰與套件

根金鑰會簽署**撤銷清單**：列出不得再載入的發行金鑰與套件。

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
| `--extend <file>` | 保留此清單（最後發佈的一份）中的項目。 |
| `--sequence <n>` | 清單的編號，必須高於先前發佈過的任何編號。搭配 `--extend` 時，預設為該清單的編號加一。 |
| `--key <id>` | 要撤銷的發行金鑰 id。可重複指定。 |
| `--package <sha256>` | 要撤銷的套件 SHA-256（如 `nsh verify` 所印出的值）。可重複指定。 |
| `-o, --out <file>` | 要寫出的清單。 |

信任儲存區只接受序號高於目前所持有的清單，因此無法重放舊清單來取消撤銷。請將最新的清單發佈在你的應用程式擷取的位置，並在開啟套件之前以 `updateRevocations` 套用。

<a id="rollback-protection"></a>

## 回滾保護

當宿主應用程式接受一個套件時，其信任儲存區會記錄該應用程式 id 的建置編號，此後會拒絕較舊的建置。若攻擊者取得了含有已知漏洞的較舊簽署套件，也無法讓應用程式執行它。此記錄會保存在儲存區的狀態目錄（`nsh-trust.json`）中，因此重新啟動後依然有效。在 GPUI 上，宿主應用程式可以等新套件證實運作正常後再記錄（`verify_package`，然後 `accept_package`；見下文）。

<a id="loading-packages-in-a-host-app"></a>

## 在宿主應用程式中載入套件

驗證會對整個套件計算雜湊並解出其資產（每個套件一次，位於信任儲存區的目錄下），因此在 UI 執行緒之外進行；執行結果則發生在 UI 執行緒上。

**GPUI (Rust)**，宿主應用程式也可以在套件證實運作正常之後才接受它：

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

在套件被接受之前，先前已接受的建置仍可通過驗證，因此新套件失敗的宿主應用程式可以退回它原本執行的版本（`AppView::on_error` 的嚴重錯誤，或在接受之前當機，都是判斷依據）。比已接受版本更舊的建置仍會被拒絕，而期間被撤銷的套件則不會被接受。`load_package` 會一次完成驗證與接受，如同 iOS 與 Android 上的 `openPackage`。

套件所宣告的 [capabilities](./sandbox-and-capabilities.md) 會隨套件一併傳遞：套件只能執行它所宣告的內容，且只限於宿主應用程式額外授予的部分。

完整 API：[GPUI](./gpui.md#embedding-in-a-gpui-app)、[嵌入 iOS 應用程式](./ios.md#signed-packages)、[嵌入 Android 應用程式](./android.md#signed-packages)。

<a id="errors-from-published-packages"></a>

## 已發佈套件的錯誤

套件的位元組碼保留了其行與欄對照表，因此錯誤具有位置資訊，而執行階段會先以套件的 source map 將位置對應回你的原始碼，再交給宿主應用程式的錯誤處理常式：

```text
Error: boom
    at n (App.tsx:5:3)
```

source map 包含應用程式的原始碼，通常是套件中最大的檔案：約占 gallery 範例 2.6 MB 的一半。若想自行保管它，可以改為將它發佈在套件旁邊：

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

此時裝置會回報封裝檔的位置（`at n (bundle.js:1:80)`）。請將 map 與其所屬的套件一併保管，並以 `nsh symbolicate` 對應宿主應用程式所回報的內容：

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` 會從檔案或標準輸入讀取錯誤文字，並接受 map 檔案或內含 map 的套件。行對照表會使位元組碼增加約五分之一（含 map 的套件則增加 3–5%）；`--strip-debug` 會將它們省略，此時堆疊會顯示為 `at n (<null>:0:1)`，沒有可對應的內容。

<a id="trying-a-package-in-development"></a>

## 在開發中試用套件

`nsh run` 所安裝的開發宿主可以用嵌入式應用程式的方式執行套件。

在 iOS 上，宿主可執行檔接受 `--package <file>` 與一個或多個 `--root <root.pub>`。在 `nsh run` 將宿主安裝到模擬器（`--target ios`）之後：

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

在 Android 上，開發宿主（`DevActivity`，由 `nsh run --target android` 安裝）接受額外參數 `package`（裝置上的路徑）與 `root`（base64 公開金鑰，以逗號分隔）：

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

它們的信任狀態位於暫存（iOS）或快取（Android）目錄中，因此在那裡，比它們已接受的版本更舊的建置同樣會被拒絕。
<a id="a-release-checklist"></a>

## 發佈檢查清單

1. 將根金鑰保持離線；為每個團隊或每個應用程式系列認證一把發佈金鑰，有效期限不超過一年。
2. 每次發佈都要在 `nsh.json` 中提高 `build`；沒有提高的套件會被 `nsh publish` 拒絕。
3. 上傳套件之前，先對套件執行 `nsh verify --root root.pub`。
4. 將 `root.pub` 隨附於宿主應用程式內；撤銷清單則另外發佈，這樣不需要更新應用程式就能撤銷金鑰。
5. 如果發佈金鑰外洩，請撤銷它（`nsh revoke --extend … --key <id>`），認證一把新的金鑰，然後重新發佈。
6. 若使用會為其應用程式簽署的平台，請為 CI 準備專屬的根金鑰，且只有測試用應用程式信任它，並在正式環境的應用程式中隨附平台的根金鑰；平台會對 CI 的套件重新簽署（`nsh publish <package>`）。

<a id="see-also"></a>

## 另請參閱

- [沙箱與權限](./sandbox-and-capabilities.md)
- [嵌入 iOS 應用程式](./ios.md)、[嵌入 Android 應用程式](./android.md)
- [CLI](./cli.md)
