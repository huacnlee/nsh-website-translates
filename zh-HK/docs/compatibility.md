---
title: "向後相容性"
description: "Native Shell 如何確保應用程式在各版本之間持續運作:相容版本所做的承諾、nsh-compat 中記錄每項相容性變更的紀錄、發行流程,以及如何新增、重新命名或變更 API。"
order: 22
group: delivery
---

# 向後相容性

宿主應用程式以[簽章套件](./signed-packages.md)的形式下載 NSH 應用程式，並將其作為外掛執行。已發佈的應用程式可能再也不會被重新建置：團隊已經轉往他處，原始碼留在某個業務流程中，宿主應用程式again依自己的時程更新 NSH。因此 Native Shell 對每個應用程式作出承諾：**為相容版本建置的應用程式，可在之後的每個版本上原封不動地執行。** 應用程式在 NSH 更新後無法運作，就是 NSH 的 bug。

本頁說明這項承諾的內容、如何落實，以及如何在承諾範圍內變更 NSH。

<a id="what-an-app-can-rely-on"></a>

## 應用程式可以依賴什麼

這項承諾涵蓋已建置的應用程式所接觸的一切：

| 項目 | 重要原因 |
| --- | --- |
| 每個模組（`nsh`、`nsh/*`、`nsh/base`、標準模組）的匯出及其成員 | Bundle 依名稱匯入它們：名稱消失，應用程式就無法啟動。 |
| `nsh:rt`，即編譯後的 JSX 所呼叫的函式 | 每個 bundle 都帶有建置它的編譯器的輸出。 |
| 全域物件（計時器、`fetch`、`console` 等）及其成員 | 應用程式依名稱呼叫它們。 |
| 元素的 props、事件及其 payload、樣式鍵及其值 | 應用程式依名稱傳入；被更名的 prop 會被忽略，使應用程式行為錯誤。 |
| Tailwind 工具類別與變體 | 類別是在執行時依 bundle 中的字串解析的。 |
| 行為：預設值、單位、payload、callback 的順序 | 應用程式依賴撰寫當時所見的行為。 |
| TypeScript 宣告（`.nsh/types`） | 舊應用程式的團隊修復 bug 時，其原始碼仍能通過型別檢查。 |
| 套件格式及其簽章 | 為較早版本簽署的套件仍可通過驗證。 |

維持承諾的規則：

1. **已發佈的內容會保留。** 任何模組、匯出、成員、prop、事件、payload 鍵、樣式鍵或值、Tailwind 工具類別、全域物件或 `nsh:rt` 函式都不會被移除。
2. **更名時保留舊名稱**，作為同一實作的別名，並標記 `@deprecated` 與新名稱，且永久保留。將匯出移到另一個模組時，也會在舊模組中保留它。
3. **型別只能放寬。** 聯集型別可增加選項，函式可增加多載或結尾的選用參數，參數可變為選用；應用程式傳入的內容（props、樣式、選項）只能增加選用成員。應用程式讀取的值也以同樣方式擴充：`platform.os` 增加一個平台，狀態或原因增加一個 case。應用程式已見過的 case 保留其值，而應用程式以 `switch` 的 `default` 處理它不認得的值：

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
5. **`nsh:rt` 只會增加**，每個函式都保持其簽章與語意。
6. **格式永遠可讀取。** 較早版本的套件、憑證、撤銷清單與 `app.json` 都能被之後的版本讀取；套件會指明它所需的最低執行環境（`nsh publish --min-runtime`）。
7. **安全性是唯一的例外。** 無法確保安全的功能會被關閉，並列出原因，且在版本說明中註明。

這項承諾自第一個被記錄為相容的版本起生效，並永久有效，不論版本號碼為何。在版本之間，僅 `main` 擁有的 API 仍可能變更。

<a id="how-it-is-enforced"></a>

## 如何落實

各版本所凍結的內容存放在獨立的儲存庫 [longbridge/nsh-compat](https://github.com/longbridge/nsh-compat)，與 NSH 的程式碼分開。對 NSH 的變更會針對它執行檢查，但無法編輯它：重新命名某個 API 的 pull request，無法同時改寫該 API 的紀錄。

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

每個對 NSH 的 pull request 都會針對其 checkout 執行 `nsh-compat` 的檢查（即 **Compat** workflow，或在本機執行 `cargo xtask compat`）：

| 檢查 | 通過條件 |
| --- | --- |
| `checkout_apps_run` | `tests/compat/` 的應用程式由此 checkout 建置後，行為符合其腳本所述，且腳本聲稱要檢查的每個 API 部分都確實被檢查。 |
| `nothing_released_is_removed` | 每個已記錄版本所提供的一切（匯出、成員及其種類、宣告、Tailwind 類別及其所設定的內容）仍然提供，且保持不變或有所放寬。 |
| `released_apps_run` | 每個已記錄版本所建置的應用程式，以其編譯器建置的原樣，可在此執行環境上啟動，且行為符合其腳本所述。 |

第一項檢查測試正在撰寫的 API；另外兩項則約束每個已記錄的版本。對已發佈 API 的更名會如下失敗：

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` 由 NSH 的維護者審查，其自身的 CI 會針對 NSH 的 `main` 執行它。

<a id="the-release-flow"></a>

## 發佈流程

1. **開發。** API 在 `main` 上落地，並在 `tests/compat/` 中附帶一個 case，由其腳本檢查該 API。在某個版本記錄它之前，它可以被更名或重塑；case 也隨之變更。
2. **記錄。** 發佈時，`cargo xtask compat record <version>` 會將 `releases/v<version>/` 寫入 `nsh-compat` 的 checkout：包含該版本所提供的介面，以及 `tests/compat/` 中每個由其編譯器建置的應用程式與其腳本。它只會記錄每個部分都有腳本檢查的 API。
3. **凍結。** 該記錄透過 `nsh-compat` 的 pull request 合併。從此之後，每個 NSH 變更都須符合它，以及所有更早的記錄。

<a id="developing-within-the-promise"></a>

## 在承諾範圍內開發

<a id="adding-an-api"></a>

### 新增 API

每個新的匯出、全域物件、prop、事件或樣式鍵都需附帶一個 case：

1. 撰寫模組 `tests/compat/cases/<domain>/<case>.tsx`，其預設匯出為一個使用該 API 並顯示其結果的元件。領域包括 `base`、`core`、`events`、`layout`、`paint`、`props`、`modules` 與 `web`，另有 `android`、`macos` 與 `browser`，用於由單一平台或單一 `nsh.json` 設定所決定的內容。
2. 將它加入該領域的 `App.tsx`，它一次顯示一個 case。
3. 將步驟附加到該領域的 `script.txt`：先是 `tap id:case-<case>`，接著是檢查該 API 行為的步驟，以及針對它新增的每個部分的 `covers <item>` 步驟。
4. 執行 `cargo xtask compat`（`NSH_COMPAT_APP=<domain>` 執行單一領域）。

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

`covers` 步驟會被驗證：應用程式必須使用該項目，而對於 prop、事件或樣式鍵，從已建置的應用程式中移除它，必須使腳本的某個步驟失敗。項目的命名方式為 `[<module>] <export>`、`[globals] <name>`、`[props] <name>`、`[events] <name>`、`[styles] <name>`，元件自身的項目為 `[props] <Component>.<name>`，而平台的 props 為 `ios.<name>`、`android.<name>`、`desktop.<name>`、`web.<name>`。

<a id="renaming-or-moving-an-api"></a>

### 更名或移動 API

新增新名稱，並將舊名稱保留為同一實作的別名，宣告為 `@deprecated` 並附上新名稱。將 case 及其腳本更新為新名稱。尚未被任何版本記錄的 API 則直接更名即可。

<a id="changing-a-type"></a>

### 變更型別

放寬它：聯集中增加選項、增加多載、結尾的選用參數、應用程式傳入內容的選用新成員。應用程式讀取的聯集型別以同樣方式增加成員，每個新成員對應一個新 case。參數名稱可以自由變更；其數量、是否選用與型別則保持不變。

<a id="changing-behavior"></a>

### 變更行為

保留舊行為，並將新行為放在新的 prop、選項或值之後。修改可正常運作之應用程式所見結果的 bug 修復，同樣屬於行為變更：請將它放在選擇啟用機制之後，或確保沒有應用程式能依賴舊的結果。為該行為在某個 case 中加入一個步驟，使它維持原樣。

<a id="changing-the-compiler"></a>

### 變更編譯器

無需額外處理：每個版本的應用程式維持為該版本編譯器所建置的樣子，而 case 則由你的編譯器重新建置。它輸出到 bundle 中的函式（`nsh:rt`）只會增加。

<a id="closing-an-api-for-security"></a>

### 為安全而關閉 API

`nsh-compat` 的 pull request 會將條目連同原因加入其 `closed.txt`（`<entry> -- <reason>`，即檢查所回報的條目），並率先合併；之後移除該 API 的 NSH 變更便可通過。版本說明會註明原因。

<a id="scripts"></a>

## 腳本

`script.txt` 每行一個步驟。執行動作的步驟：`tap <selector>`、`type <selector> <text>`、`key <selector> <key>`、`scroll <selector> <x> <y>`、`touch start|move|end|cancel`、`event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`。檢查的步驟：`expect <text>`、`absent <text>`、`frame <selector> <x> <y> <width> <height>`、`origin`、`prop` / `noprop`、`style` / `nostyle`、`listens`、`state`、`statusbar`、`log <text>`。開頭幾行可設定螢幕：`viewport <w> <h>`、`platform <os> [desktop]`、`fontscale <scale>`。選擇器可為 `id:<testID>`、`label:<label>`、`text:<text>` 或 `span:<text>`；props 與樣式的寫法與應用程式中相同（`style id:card backgroundColor #3366ffff`）。`NSH_COMPAT_DUMP=1` 會印出每個步驟對螢幕新增與移除的內容，供撰寫腳本時使用。

<a id="commands"></a>

## 指令

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` 會在 `target/nsh-compat/` 中保留一份 `nsh-compat` 的 checkout，並在每次執行時將其更新；若其中有自己的變更，則會直接使用，因此可在送出 pull request 之前，針對 NSH 試用對檢查所做的變更。
