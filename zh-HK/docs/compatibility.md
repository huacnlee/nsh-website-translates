---
title: "向後相容性"
description: "Native Shell 如何確保應用程式在各個版本之間持續運作:相容版本所作出的承諾、nsh-compat 中記錄每項相關變更的紀錄、發佈流程,以及如何新增、重新命名或變更 API。"
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---


# 向後相容性

主機應用程式以[已簽署的套件](./signed-packages.md)下載 NSH 應用程式,並以外掛形式運行。已發佈的應用程式可能永遠不會再重新建構:團隊已經轉往其他工作、原始碼留在某個業務流程中、主機應用程式又按自己的時間表更新 NSH。因此 Native Shell 向每個應用程式作出一項承諾:**為相容版本建構的應用程式,在其後每個版本上都能原封不動地運行。** 應用程式在 NSH 更新後無法運作,即屬 NSH 的 bug。

本頁說明這項承諾的內容、如何落實,以及如何在承諾範圍內改動 NSH。

<a id="what-an-app-can-rely-on"></a>

## 應用程式可以依賴什麼

這項承諾涵蓋已建構的應用程式所接觸的一切:

| 部分 | 重要原因 |
| --- | --- |
| 每個模組(`nsh`、`nsh/*`、`nsh/base`、標準模組)的匯出項目及其成員 | 打包檔按名稱匯入它們:名稱一旦缺失,應用程式便無法啟動。 |
| `nsh:rt`,即編譯後的 JSX 所呼叫的函式 | 每個打包檔都帶有建構它的編譯器的輸出。 |
| 全域物件(計時器、`fetch`、`console` 等)及其成員 | 應用程式按名稱呼叫它們。 |
| 元素的 props、事件及其 payload、樣式鍵及其值 | 應用程式按名稱傳入;改了名的 prop 會被忽略,應用程式便會運行出錯。 |
| Tailwind 工具類別與變體 | 類別在執行時由打包檔中的字串解析。 |
| 行為:預設值、單位、payload、callback 的順序 | 應用程式依賴its開發時所見的行為。 |
| TypeScript 宣告(`.nsh/types`) | 舊應用程式的團隊修復 bug 時,其原始碼仍能通過型別檢查。 |
| 套件格式及其簽章 | 為早期版本簽署的套件仍能通過驗證。 |

維持承諾的規則:

1. **已發佈的內容一律保留。** 任何模組、匯出項目、成員、prop、事件、payload 鍵、樣式鍵或值、Tailwind 工具類別、全域物件或 `nsh:rt` 函式都不會移除。
2. **改名時保留舊名稱**,作為同一實作的別名,並標記 `@deprecated` 及指向新名稱,永久有效。將匯出項目移到另一個模組時,舊模組中也要保留。
3. **型別只會擴闊。** 聯集型別增加選項,函式增加多載或尾部的選用參數,參數變為選用;應用程式傳入的內容(props、樣式、選項)只會增加選用成員。應用程式讀取的值也以同樣方式增長:`platform.os` 增加一個平台,狀態或原因增加一個個案。應用程式已見過的個案保持其值,而應用程式要處理它不認識的值,例如以 `switch` 的 `default` 處理:

   ```tsx
   switch (platform.os) {
     case "ios":
     case "android":
       return <MobileLayout />;
     default:
       // The desktops, the web, and platforms NSH adds later.
       return <WideLayout />;
   }
   ```
4. **行為保持不變。** 新行為需透過新的 prop、選項或值選擇啟用。
5. **`nsh:rt` 只會增加**,每個函式的簽章與涵義保持不變。
6. **格式永遠可讀。** 早期版本的套件、證書、撤銷清單及 `app.json` 都由後續版本讀取;套件會指明其所需的最低執行環境(`nsh publish --min-runtime`)。
7. **安全是唯一的例外。** 無法保證安全的功能會被關閉,並連同原因列出,且在發佈說明中註明。

這項承諾由第一個被記錄為相容的版本開始,並永久有效,不論版本號碼如何。在兩個版本之間,只有 `main` 才有的 API 仍可能改動。

<a id="how-it-is-enforced"></a>

## 如何落實

各版本所凍結的內容存放在獨立的儲存庫
[longbridge/nsh-compat](https://github.com/longbridge/nsh-compat) 中,與 NSH 的程式碼分開。NSH 的改動會對照它運行,但無法編輯它:重新命名某個 API 的 pull request,不可能同時改寫該 API 的記錄。

```
nsh                                       nsh-compat
├─ crates/          the code              ├─ releases/v<version>/   one per compatible release, never changed
└─ tests/compat/    apps that test the    │  ├─ runtime.txt         every export, global and nsh:rt function
   ├─ cases/        API being written     │  ├─ types/              the declarations apps build against
   └─ examples/                           │  ├─ tailwind.txt        every Tailwind class and what it sets
                                          │  └─ apps/               the test apps as that release built them
                                          ├─ closed.txt             security closures, each with its reason
                                          └─ src/                   the checks
```

每個提交給 NSH 的 pull request 都會針對其 checkout 運行 `nsh-compat` 的檢查(即 **Compat** 工作流程,或在本機運行 `cargo xtask compat`):

| 檢查 | 通過條件 |
| --- | --- |
| `checkout_apps_run` | `tests/compat/` 的應用程式經此 checkout 建構後,能做到其腳本所述的行為,而且腳本聲稱要檢查的 API 每個部分都確實被檢查。 |
| `nothing_released_is_removed` | 每個已記錄版本所提供的一切(匯出項目、成員及其種類、宣告、Tailwind 類別及其所設定的內容)仍然提供,內容相同或更闊。 |
| `released_apps_run` | 每個已記錄版本所建構的應用程式,依照其編譯器當時的建構結果,能在此執行環境上啟動,並做到其腳本所述的行為。 |

第一項檢查測試正在編寫的 API;其餘兩項則守住每個已記錄的版本。重新命名已發佈 API 的失敗情況如下:

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` 由 NSH 的維護者審閱,其本身的 CI 會針對 NSH 的 `main` 運行。

<a id="the-release-flow"></a>

## 發佈流程

1. **開發。** API 先在 `main` 上落地,並在 `tests/compat/` 中附帶一個個案,由其腳本檢查該 API。在某個版本記錄它之前,它仍可重新命名或改變形態;個案也隨之更改。
2. **記錄。** 發佈時,`cargo xtask compat record <version>` 會將 `releases/v<version>/` 寫入 `nsh-compat` 的 checkout:包括該版本所提供的介面,以及 `tests/compat/` 中經其編譯器建構的每個應用程式及其腳本。它只會記錄每個部分都經腳本檢查的 API。
3. **凍結。** 記錄透過 `nsh-compat` 的 pull request 合併。從此每項 NSH 改動都要符合該記錄,以及所有更早的記錄。

<a id="developing-within-the-promise"></a>

## 在承諾範圍內開發

<a id="adding-an-api"></a>

### 新增 API

每個新的匯出項目、全域物件、prop、事件或樣式鍵都要附帶一個個案:

1. 編寫模組 `tests/compat/cases/<domain>/<case>.tsx`,其預設匯出是一個使用該 API 並顯示結果的元件。領域包括 `base`、`core`、`events`、`layout`、`paint`、`props`、`modules` 和 `web`,另有 `android`、`macos` 和 `browser`,用於由某一平台或某項 `nsh.json` 設定決定的內容。
2. 將它加入該領域的 `App.tsx`,該檔案一次顯示一個個案。
3. 將步驟附加到該領域的 `script.txt`:先是 `tap id:case-<case>`,然後是檢查該 API 行為的步驟,以及為它新增的每個部分加入一個 `covers <item>` 步驟。
4. 運行 `cargo xtask compat`(`NSH_COMPAT_APP=<domain>` 則運行單一領域)。

```txt
# props-media-video
tap id:case-props-media-video
prop id:clip src https://example.com/clip.mp4
prop id:clip paused true
tap id:play
prop id:clip paused false
covers [props] src
covers [props] paused
```

`covers` 步驟會被驗證:應用程式必須使用該項目;對於 prop、事件或樣式鍵,從已建構的應用程式中移除它,必須令腳本的某個步驟失敗。項目的命名方式為 `[<module>] <export>`、`[globals] <name>`、`[props] <name>`、`[events] <name>`、`[styles] <name>`,元件自身的項目為 `[props] <Component>.<name>`,而某個平台的 props 則為 `ios.<name>`、`android.<name>`、`desktop.<name>`、`web.<name>`。

<a id="renaming-or-moving-an-api"></a>

### 重新命名或移動 API

加入新名稱,並將舊名稱保留為同一實作的別名,以 `@deprecated` 宣告並指向新名稱。將個案及其腳本更新為新名稱。尚未被任何版本記錄的 API,直接重新命名即可。

<a id="changing-a-type"></a>

### 更改型別

只可擴闊:聯集型別增加選項、增加多載、尾部加入選用參數、為應用程式傳入的內容加入選用的新成員。應用程式讀取的聯集型別同樣可增加成員,每個新成員對應一個新個案。參數名稱可自由更改;其數量、是否選用及型別則保持不變。

<a id="changing-behavior"></a>

### 更改行為

保留舊行為,並將新行為放在新的 prop、選項或值之後。若某個 bug 修復會改變正常運作的應用程式所見的結果,同樣屬於行為改動:須將它放在選擇啟用的機制之後,或確保沒有應用程式可能依賴舊結果。為該行為在個案中加入一個步驟,令它保持原樣。

<a id="changing-the-compiler"></a>

### 更改編譯器

無需額外處理:每個版本的應用程式維持由該版本的編譯器所建構的樣子,而個案則由你的編譯器重新建構。它在打包檔中產生的函式(`nsh:rt`)只會增加。

<a id="closing-an-api-for-security"></a>

### 為安全而關閉 API

`nsh-compat` 的 pull request 會將條目連同原因加入其 `closed.txt`(`<entry> -- <reason>`,即檢查所報告的條目),並先行合併;之後移除該 API 的 NSH 改動便能通過。發佈說明會交代原因。

<a id="scripts"></a>

## 腳本

`script.txt` 每行一個步驟。執行動作的步驟:`tap <selector>`、`type <selector> <text>`、`key <selector> <key>`、`scroll <selector> <x> <y>`、`touch start|move|end|cancel`、`event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`。執行檢查的步驟:`expect <text>`、`absent <text>`、`frame <selector> <x> <y> <width> <height>`、`origin`、`prop` / `noprop`、`style` / `nostyle`、`listens`、`state`、`statusbar`、`log <text>`。開首幾行可設定螢幕:`viewport <w> <h>`、`platform <os> [desktop]`、`fontscale <scale>`。選擇器可以是 `id:<testID>`、`label:<label>`、`text:<text>` 或 `span:<text>`;props 和樣式的寫法與應用程式中的寫法相同(`style id:card backgroundColor #3366ffff`)。`NSH_COMPAT_DUMP=1` 會列出每個步驟為螢幕新增和移除的內容,方便編寫腳本。

<a id="commands"></a>

## 指令

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` 會在 `target/nsh-compat/` 中保留一份 `nsh-compat` 的 checkout,並在每次運行時將它更新;若其中有自身的改動,則按原樣使用,因此可以在提交 pull request 之前,先針對 NSH 試用對檢查所作的改動。
