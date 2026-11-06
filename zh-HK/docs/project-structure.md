---
title: "專案結構"
description: "以 Rust 或 TSX 開發的 NSH 應用程式的檔案結構、nsh.json 的所有鍵、.nsh/types 中的 TypeScript 設定、資源檔案,以及模組與套件的匯入方式。"
order: 5
group: start
source_hash: 67da39e1182fc05c
---


# 專案結構

NSH 應用程式是一個包含 `nsh.json` 及其程式碼的目錄:程式碼可以是一個以 `nsh.json` 指定根元件的 Rust crate、一個 TSX 入口模組,或兩者並用。其餘所有內容(更多模組、圖片、字型、JSON 檔案)都會從這裡找出來:即 crate 的模組及其 `assets/` 目錄,或 TSX 入口所匯入的檔案,因此無需維護檔案清單。

以 Rust 編寫的應用程式是一個 Cargo 專案:

```text
my-app/
├── nsh.json           name, id, version, icon, the crate ("rust") and its root component ("root"), theme
├── Cargo.toml         the crate: nsh-core, nsh-base and your dependencies
├── src/
│   ├── lib.rs         the root component and the crate's UI set (#[native_module])
│   ├── main.rs        cargo run: the root on this machine's desktop backend
│   └── screens/       your own modules (any layout you like)
├── assets/            files the crate ships: asset!("logo@2x.png"), fonts
├── .gitignore         .nsh/ and target/
├── .nsh/              generated: the runners' sources, test entries, build output (.nsh/out)
└── target/            Cargo's build directory
```

TSX 應用程式由一個入口及其所匯入的模組組成:

```text
my-app/
├── App.tsx            the entry module: calls mount()
├── App.test.tsx       its tests (nsh test)
├── nsh.json           name, id, version, icon, Tailwind theme, capabilities
├── tsconfig.json      TypeScript settings for editors
├── .gitignore         .nsh/ and target/
├── components/        your own modules (any layout you like)
│   └── Header.tsx
├── assets/
│   ├── logo@2x.png    imported images
│   └── Inter.ttf      imported fonts
└── .nsh/              generated: type declarations, development host builds, test entries, build output (.nsh/out)
```

同時使用兩者的應用程式會在 `"rust"` 中列出其 crate,並以 TSX 入口匯入這些 crate([使用 Rust 建置](./rust.md#extending-a-rust-app-with-tsx))。

每個指令都以應用程式的目錄或其入口作為參數(`nsh run my-app`、`nsh run my-app/App.tsx`)。`nsh.json` 及入口所在的目錄就是應用程式的根目錄:`nsh.json` 從該處讀取,資源路徑相對於該目錄,`.nsh/` 也寫入該處。在 Rust 應用程式(`nsh.json` `"root"`)中,指定目錄會執行根元件;若指定 TSX 入口,則改為執行該入口。

<a id="the-root-component"></a>

## 根元件

Rust 應用程式的根是其 crate 中的一個元件,由 `nsh.json` 的 `"root"` 以其在 crate 中的路徑指定(`App`、`shell::Gallery`)。TSX 入口是一個普通模組,結尾時會渲染根元件:

```rust tabs
// src/lib.rs; nsh.json: { "rust": ".", "root": "App" }
mod screens;

use nsh_core::prelude::*;

/// What a TSX entry may import from the crate.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>().assets(assets!());
}

#[component]
pub fn App() -> impl IntoElement {
    screens::home()
}
```

```tsx tabs
// App.tsx
import { mount } from "nsh";
import { Home } from "./components/Home";

function App() {
  return <Home />;
}

mount(App);
```

`nsh run` 和 `nsh package` 在所有平台上掛載 Rust 根元件,無需 QuickJS。在 TSX 中,`mount(component, props?)` 會把元件渲染到應用程式的畫面,並返回一個可將其移除的函式;應用程式只會呼叫一次。入口最上層的程式碼會在 bundle 載入時執行,早於第一個畫面幀。

## nsh.json

`nsh.json` 位於應用程式的根目錄。`nsh init` 會寫入 `name`、`id`、`version` 和 `build`;若是 Rust 應用程式,還會寫入 crate 及其根元件:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "rust": ".",
  "root": "App",
  "theme": "theme.json"
}
```

其餘所有鍵均為選填;TSX 應用程式也可以省略這四個鍵。TSX 應用程式的 `nsh.json` 可能如下:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png",
  "tailwind": {
    "colors": { "brand": { "500": "#7c3aed", "600": "#6d28d9" } },
    "radius": { "card": 14 }
  },
  "capabilities": {
    "network": { "hosts": ["api.example.com", "*.cdn.example.com"] }
  }
}
```

| 鍵 | 類型 | 使用者 | 說明 |
|---|---|---|---|
| `name` | string | `package` | 顯示在應用程式圖示下方的名稱。預設值:入口所在目錄的名稱。 |
| `id` | string | `package`、`publish`、`Storage` | 反向 DNS 格式的 bundle identifier / application id,例如 `com.yourcompany.app`;`package` 和 `publish` 必須提供。沒有此值時,`nsh run` 會使用 `com.example.<name>`。 |
| `version` | string | `package`、`publish` | 用戶可見的版本,例如 `1.2.0`(`CFBundleShortVersionString`,Android 為 `versionName`)。 |
| `build` | number | `package`、`publish` | 建置編號(`CFBundleVersion`,Android 為 `versionCode`)。已簽署的套件要求此值每次發布都遞增。 |
| `minRuntime` | string | `publish` | 可執行已簽署套件的最低 NSH runtime 版本,例如 `0.2.0`。預設值:CLI 的版本([已簽署的套件](./signed-packages.md#which-runtimes-run-a-package))。 |
| `icon` | string | `package` | 正方形 PNG,建議為 1024×1024,路徑相對於 `nsh.json`。 |
| `tailwind` | object | 每次建置 | 擴充 Tailwind 主題,供你的 `class` 字串解析([Tailwind](./tailwind.md#theme))。 |
| `appearance` | string | 每次建置、`package` | `"light"`、`"dark"` 或 `"system"`(預設值):始終為淺色或深色的應用程式可在此指明。`colorScheme()`、`dark:` class、元件的主題以及平台的控制項,從一開始就會跟隨此設定([裝置與環境](./device-and-environment.md#dark-mode))。 |
| `theme` | string 或 object | 每次建置 | 應用程式的設計 token(shadcn/ui 的 `cssVars`,疊加於預設的 `neutral` 主題之上),供 token class、`token()` 和 Rust 元件繪製使用:可以是相對於 `nsh.json` 的主題檔案路徑,或直接內嵌的主題([使用 Rust 建置](./rust.md#theme)、[主題 token](./tailwind.md#theme-tokens))。 |
| `statusBar` | object | 每次建置、`package` | 每個頁面和對話框底下的狀態列預設值(iOS 和 Android):`{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`,兩者均為選填。已打包的 iOS 應用程式從啟動畫面起就會顯示([狀態列](../modules/nsh-base.md#status-bar))。 |
| `capabilities` | object | 每次建置 | 應用程式可在其 VM 以外存取的內容:網絡主機、web view 主機、狀態列([沙盒與 capabilities](./sandbox-and-capabilities.md))。 |
| `resolve` | object | 每次建置 | 裸匯入(bare import)的解析方式:npm 套件的 export conditions 及別名([npm 套件](#npm-packages))。 |
| `rust` | string 或 string[] | 所有指令 | 應用程式的 Rust crate,或 crate 清單,路徑相對於 `nsh.json`:其元件和模組,TSX 以各 crate 的 `#[native_module]` specifier 匯入([使用 Rust 建置](./rust.md#several-crates))。 |
| `web` | object | `package` | web 套件加入其頁面的內容。`web.host`:相對於 `nsh.json` 的 JS 模組,匯出 `createHost(player)`,用於回應應用程式對 [`host`](../modules/nsh.md#host) 的呼叫;`web.connect`:該模組自身請求所存取的主機,以 `capabilities.network.hosts` 的模式表示,並獲頁面的 Content-Security-Policy 允許([Web](./web.md#the-hosts-functions))。 |
| `root` | string | `run`、`package` | Rust 應用程式的根元件,即其在 `rust` crate 中的路徑,若為清單則取第一個(`App`、`shell::Gallery`):應用程式目錄的 `nsh run` 和 `nsh package` 會在所有平台上掛載它,無需 QuickJS;`nsh run App.tsx` 仍會執行 TSX 入口([使用 Rust 建置](./rust.md))。 |

`nsh package` 和 `nsh publish` 的旗標(`--name`、`--id`、`--app-version`、`--build`、`--icon`、`--min-runtime`)會覆蓋檔案中的值([CLI](./cli.md))。

`tailwind`、`theme`、`appearance`、`statusBar`、`capabilities` 和 `resolve` 會在建置應用程式時檢查。拼寫錯誤會成為建置錯誤,而不是一個悄悄失效的設定:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

沒有 `capabilities` 鍵時,應用程式可自由使用網絡、web view 和狀態列:獨立應用程式屬於其開發者自己。有此鍵時,所有未列出的項目一律拒絕,開發期間和已打包的應用程式皆然:

```json
"capabilities": {
  "network": {
    "hosts": ["api.example.com", "*.cdn.example.com"],
    "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }]
  },
  "webview": { "hosts": ["*.example.com"] },
  "statusBar": true
}
```

`network` 涵蓋 `fetch`、遠端圖片和影片來源;本機資源一律允許。嵌入 NSH 的應用程式授予的權限可以少於應用程式所宣告的。詳情請參閱[沙盒與 capabilities](./sandbox-and-capabilities.md)。

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json 和 .nsh/types

NSH 不需要 `node_modules`。取而代之,每個建置應用程式的指令(`init`、`build`、`test`、`dev`、`run`、`package`、`publish`、`check`)都會把 NSH 提供的一切內容的 TypeScript 宣告寫入 `.nsh/types`,並把 NSH 的 TypeScript 設定寫入 `.nsh/tsconfig.json`。應用程式的 `tsconfig.json` 會擴充它們:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` 把 `nsh` 匯入和應用程式的 crate 指向 `.nsh/types`,包含全域、資源和 token 的宣告,並設定 NSH 應用程式所用的編譯器選項(`lib`、`jsx`、`strict` 等)。NSH 會保持其為最新:當新版本加入程式庫或路徑時,你的應用程式在下次建置時就會獲得,而你的 `tsconfig.json` 則保持你所寫的內容。你加入 `tsconfig.json` 的選項會覆蓋 NSH 的設定。

| `.nsh/types/nsh/` 中的檔案 | 宣告內容 |
|---|---|
| `index.d.ts` | `nsh`:`signal`、`computed`、`effect`、`mount`、`View`、`Text` 等,並重新匯出下列型別 |
| `types.d.ts` | 樣式(`ViewStyle`、`TextStyle` 等)、每個元素的 props 和事件、refs(`ViewRef`、`InputRef` 等:`ref` 所接收的內容) |
| `jsx-runtime.d.ts` | TypeScript 透過 `jsxImportSource` 解析的 JSX runtime(`JSX` 命名空間) |
| `globals.d.ts` | `If` 和 `Each`;`console`、計時器、`requestAnimationFrame`、`fetch` 及其他[全域 API](../modules/globals.md) |
| `assets.d.ts` | 匯入圖片或字型所得的內容 |
| `tokens.d.ts` | `Tokens`:應用程式的設計 token,來自其 `"theme"`,用於為 [`token()`](../modules/nsh.md#token) 提供型別 |
| `mobile.d.ts`、`desktop.d.ts` | 每個模組一個檔案(`nsh/mobile`、`nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` 就是沒有 `DOM` 的 `ES2023`:沒有 `document` 或 `window`。`.nsh` 中的檔案會重新生成(僅在內容有變時),因此請勿編輯,也不要提交;`.gitignore` 已排除 `.nsh/`。如果複製專案後,編輯器顯示 `nsh` 缺失,只需執行任何一個建置指令一次,例如 `nsh check`。

`.nsh/tsconfig.json` 會加入 `"ESNext.Disposable"`,它宣告 `using` 宣告以及 runtime 所具備的 `Symbol.dispose`:`using account = new Account()` 會在區塊結束時釋放 [Rust class](./rust.md) 的值。它的 `jsxImportSource: "nsh"` 和 `jsx: "preserve"` 只對編輯器有意義:NSH 以自己的編譯器編譯 JSX,不論 `tsconfig.json` 如何設定。TypeScript 由你的編輯器或 `nsh check` 檢查;其他指令只會移除型別而不作檢查。

由較早版本的 `nsh init` 建立的應用程式,如果其自身的檔案就是 NSH 的範本且未經修改,下次建置時會獲得新的 `tsconfig.json`;NSH 會印出一行訊息說明。你修改過的 `tsconfig.json` 屬於你自己:當它沒有擴充 `./.nsh/tsconfig.json` 時,`nsh check` 會指出,而你需要加入 `extends` 那一行,並移除它所設定的選項。

<a id="modules"></a>

## 模組

Rust 應用程式的程式碼就是其 crate 的模組(`mod screens;`),其依賴項與任何 crate 一樣來自 crates.io;NSH 自己的 crate 是 `nsh-core`(基本元件、signals 和有型別的樣式,`use nsh_core::prelude::*`)和 `nsh-base`(基礎元件和主題)。

在 TSX 中,可以把應用程式拆分為任意數量的 `.ts` 和 `.tsx` 模組,並以相對路徑匯入;副檔名可以省略:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

所有模組都會打包成一個腳本。JSON 檔案會以解析後的值匯入。

<a id="loading-code-on-demand"></a>

### 按需載入程式碼

對應用程式其中一個模組使用 `import()`,會返回其匯出內容的 promise,與瀏覽器中一樣:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

裝置上的應用程式只附帶一個 bundle,因此模組已經存在,promise 會立即完成。以分拆方式發布的 web 應用程式(`nsh build --split`)會把該模組及僅供其使用的內容作為獨立檔案,在 `import()` 首次請求時才下載([Web](./web.md#split-bundles))。specifier 必須是字面的相對路徑:bundler 必須能看出指的是哪個模組。

<a id="nshs-modules"></a>

### NSH 的模組

對 `nsh` 和 `nsh/...` 的匯入不會被打包:runtime 以原生方式提供它們。

| 模組 | 內容 |
|---|---|
| `nsh` | 響應式(`signal`、`computed`、`effect` 等)、`mount`、`split`、`context`;基本元件 `View`、`Text`、`Scroll`、`Image`、`List`、`Canvas`、`WebView`、`Video`(`View` 的 `selectable`,用於文字選取);安全區域 inset(`safeArea`、`safeAreaInsets`)和軟鍵盤(`Keyboard`、`keyboardFrame`);原生動畫;`PanResponder`;環境(`platform`、`windowSize`、`colorScheme`、`fontScale`、`pixelRatio`、`locale`);螢幕閱讀器和減少動態效果的狀態、播報;剪貼簿、相片選擇器、儲存空間、host channel、鍵盤快速鍵;嵌入應用程式註冊的元件和函式([參考](../modules/nsh.md)) |
| `nsh/base` | 應用程式 UI 的無樣式基礎:導航堆疊及其頁面(`NavStack`、`NavPage`、`createNavStack`)、對話框(`Dialog`)、按壓目標(`Button`)、文字輸入(`Input`)和系統的警示對話框(`AlertDialog`);頁面和對話框可設定狀態列(`statusBar`)([參考](../modules/nsh-base.md)) |
| `nsh/mobile` | iOS 和 Android 所具備的內容:`TabBar`、`InputAccessoryView`(iOS)、`BackHandler`(Android)([參考](../modules/nsh-mobile.md)) |
| `nsh/desktop` | macOS、Windows 和 Linux 所具備的內容:`Window`、`titleBar`、`Menu`([參考](../modules/nsh-desktop.md)) |

[模組參考](../modules/index.md)記載了每一個模組。匯入 NSH 沒有的模組(`nsh/foo`)會導致建置錯誤;程式碼使用了模組沒有匯出的名稱(`import { Buton } from "nsh/base"`)同樣如此:錯誤會指向該匯入,並列出最接近的匯出名稱(``did you mean `Button`?``)。僅作為型別使用的名稱由 `nsh check` 檢查。

<a id="npm-packages"></a>

### npm 套件

NSH 不需要 npm 的任何內容,但如果你用套件管理器安裝套件,bundler 會從 `node_modules` 目錄解析裸匯入。套件會解析其瀏覽器版本,因為 runtime 提供的是 web API(`fetch`、streams、`URL`、`TextEncoder` 等),而不是 Node 的 API(`fs`、`Buffer`、`process`)。接觸 DOM 的套件無法使用:這裡並沒有 DOM。

瀏覽器版本使用 DOM 的套件,通常另有供 worker 或 React Native 使用的版本。`resolve.conditions` 會選定套件解析時使用的 export conditions,以取代預設的 `["browser"]`:`import`、`require`、`module` 和 `default` 一律適用,而沒有 `browser` 時,套件會透過其 `module` 和 `main` 欄位解析。`resolve.alias` 會取代某個匯入:可用相對於 `nsh.json` 的路徑(`./` 或 `../`)、另一個套件,或以 `false` 表示空模組。TypeScript(`nsh check`、編輯器)按所寫的匯入內容標註型別:不是已安裝套件的名稱,其型別取自應用程式的 `.d.ts` 檔案。

```json
"resolve": {
  "conditions": ["worker"],
  "alias": { "dom-only-helper": "./shims/helper.ts", "node-polyfill": false }
}
```

```ts
// shims/aliases.d.ts
declare module "node-polyfill";
```

`solid-js` 無法匯入:bundler 會拒絕,並指向 `nsh` 自己的 `signal`、`computed` 和 `effect`,它們可取代該匯入。

<a id="assets"></a>

## 資源

圖片和字型隨應用程式一同發布。Rust crate 會在編譯時以 `asset!` 讀取其 `assets/` 目錄中的每個檔案,並在其 `#[native_module]` 函式中以 `registry.assets(assets!())` 全部一併發布;TSX 則像模組一樣匯入它們,bundler 會記錄每個被匯入的檔案(以及圖片的像素密度變體)。`nsh build` 會把它們複製到 `.nsh/out/assets/`,`nsh package` 會把它們放進應用程式,而在開發期間它們會提供給應用程式使用。

```rust tabs
use nsh_core::element::{FontAsset, ImageAsset, asset};

const LOGO: ImageAsset = asset!("logo@2x.png");      // its url, and its size: 64×64 points
const INTER: FontAsset = asset!("Inter.ttf");        // its uri, and its family: "Inter"

image(LOGO)
text("Hello").font_family(INTER.family)
```

```tsx tabs
import { Image, Text } from "nsh";
import logo from "./assets/logo@2x.png";   // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
import Inter from "./assets/Inter.ttf";     // "Inter"

<Image src={logo} />
<Text style={{ fontFamily: Inter }}>Hello</Text>
```

| 副檔名 | 匯入所得 |
|---|---|
| `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.heic` | `ImageAsset`:`{ url, size, scales? }`,以點(point)為單位。`@2x` / `@3x` 後綴會把像素尺寸除以 2 / 3。沒有後綴的檔案也會一併發布其 `@1.5x`–`@4x` 同名檔案,列於 `scales`,並載入符合螢幕的變體([像素密度](./images-and-assets.md#pixel-densities))。 |
| `.svg` | `ImageAsset`,以點為單位,尺寸由 SVG 的 `width` 和 `height`(或 `viewBox`)決定。 |
| `.ttf`、`.otf`、`.woff`、`.woff2` | 字型的 family 名稱,為字串。字型會在第一個畫面幀之前註冊。 |
| `.json` | 解析後的 JSON |

請參閱[圖片與資源](./images-and-assets.md)和[字型](./fonts.md)。
<a id="generated-directories"></a>

## 生成的目錄

- **`.nsh/`**：NSH 生成的所有內容：型別宣告（`.nsh/types`）、Rust 應用程式 runner 的原始碼（`.nsh/rust`）、`nsh run` 安裝到模擬器和裝置上的內容（Catalyst 宿主應用程式、Android 開發用 APK），以及 `.nsh/out`，即 `nsh build` 的預設輸出（`bundle.js`、`bundle.js.map`、`bundle.nshc`、`capabilities.json`、`assets/`；Rust 應用程式則為 `app.json` 和 `assets/`）和 `nsh package` 的預設輸出（`.app`、`.ipa`、`.apk`、一個網站）；`-o` 則寫入其他位置。可以安全刪除，之後會重新生成。
- **`target/`**：Cargo 用於應用程式 crate 和 runner 的建置目錄（或 `CARGO_TARGET_DIR`）。
