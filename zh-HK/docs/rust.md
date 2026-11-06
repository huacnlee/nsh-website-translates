---
title: "使用 Rust 開發"
description: "以純 Rust 編寫 Native Shell 應用程式，在任何平台上都不使用 QuickJS，或以 Rust 配合 TSX 畫面開發：何時選擇哪一種方式，以及兩者如何共用元件與模組。"
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---


# 使用 Rust 開發

Native Shell 應用程式可以用 Rust、TSX 或兩者混合編寫。三種方式都運行在同一個引擎上:響應式圖(reactive graph)、渲染器、Taffy 佈局和原生模組(導航、對話框、鍵盤、狀態列)在每種情況下都是 Rust,而且每個平台都用自己的 UI 渲染。分別在於你自己程式碼所用的語言,以及應用程式是否帶有 JavaScript VM。

| | Rust | TSX | Rust 加 TSX |
|---|---|---|---|
| 你的 UI、狀態和處理函數 | Rust | 運行於 QuickJS 的 TSX | Rust 組件和模組,以及使用它們的 TSX 畫面 |
| 應用程式運行時包含 | 只有引擎和你的 crate,適用於所有平台及瀏覽器 | QuickJS 和引擎(在瀏覽器中則為其 JavaScript 引擎) | QuickJS 和引擎,連同你的 crate(在瀏覽器中則為其 JavaScript 引擎) |
| 適合 | 業務邏輯複雜的中大型應用程式 | 於運行時交付的應用程式和模組、快速迭代 | 以 Rust 為核心,但部分內容經常變動 |
| 修改 | 重新建置並重新啟動 | 熱更新 | TSX 為熱更新,Rust 需重新建置並重新啟動 |
| 開始 | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## 如何選擇

**Rust** 適合業務邏輯龐大而複雜的應用程式:交易、編輯器、數據密集型工具。你可以在整個應用程式中享有 Rust 的型別系統和編譯期檢查、crates.io 生態系統,以及自己程式碼的原生效能(而不只是 NSH 本身的效能),還可以用 `cargo test` 對真實 UI 進行無頭測試。應用程式由頭到尾都是 Rust 和原生程式碼:在 iOS、Android、macOS、Windows、Linux、GPUI 和網頁上,都不會附帶或運行 JavaScript VM。組件是只運行一次的函數,並把 signal 綁定到所顯示的內容,與 TSX 相同([響應式](./reactivity.md)),只是以型別化樣式取代 class 字串。

**TSX** 適合在應用程式發佈後才出現的 UI:原生應用程式於運行時載入的模組、由模型生成或由其他團隊編寫的模組,以[簽署套件](./signed-packages.md)交付,並在宿主配置的沙盒中運行,開發期間可使用熱更新。

**Rust 加 TSX** 保留 Rust 核心,並在合適的地方加入 TSX:畫面、設定、新手引導、實驗,以及任何你想透過熱更新迭代,或以[簽署套件](./signed-packages.md)在運行時交付的內容。TSX 像匯入任何 NSH 模組一樣匯入你的 Rust 組件和模組,所以兩部分在型別化介面上交匯。TSX 運行於 QuickJS,因此應用程式會附帶它。

<a id="an-app-written-in-rust"></a>

## 以 Rust 編寫的應用程式

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` 存放應用程式的內容:組件、狀態、處理函數、任務。

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

元素和組件的建立方式相同:由一個函數建立(`view()`、`text(..)`、`nsh_base` 的 `button()`、你的 `#[component] fn Chart` 的 `chart()`),其方法設定它的 props,每個 prop 一個 setter(值、signal 或閉包),以及它的監聽器,每個事件一個方法。監聽器是以其事件為參數的閉包(`move |text: &str| ..`),沒有資料的事件則用 `move || ..`;`.child(..)` 接受一個元素,或 `Option`、`Vec`、陣列或元素的迭代器(`.child(rows.iter().map(|r| row(r)))`)。

`nsh.json` 指定根組件,`nsh` 則掛載它:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` 是組件在 crate 中的路徑(`App`、`shell::Gallery`;第一個適用於[多個 crate](#several-crates));`"theme"` 是其組件所使用的[主題](#theme),`"appearance"` 對它的作用與對 TSX 應用程式相同。有了它,在應用程式目錄中執行 `nsh run` 和 `nsh package`,就會為目標平台建置應用程式專屬的 runner,掛載好根組件,而且不連結 QuickJS:

| 目標 | 運行內容 |
|---|---|
| macOS、Windows、Linux | 含你的 crate 的 release runner,在視窗中運行;`nsh run` 運行 debug 建置,並在終端機顯示應用程式的日誌 |
| iOS、iOS 模擬器、Mac Catalyst | 含你的 crate 的 iOS runner,以應用程式形式運行 |
| Android | 應用程式的 `libnsh.so` 連同你的 crate,由運行時的 activity 啟動 |
| Web | `nsh.wasm` 連同引擎和你的 crate(整個 Rust gallery 為 3.3 MB,使用 brotli 壓縮後為 0.75 MB);頁面負責掛載根組件 |

`nsh` 只建置你的 crate 所需的內容,不多不少:一個由你的 crate 和 NSH 核心組成的小程式,用來向 CLI 描述其組件和模組,其餘工作由 CLI 自行完成;以及你運行或打包的每個目標平台的 runner。新建 Rust 應用程式的首次建置會編譯你的 crate 和 NSH 核心,約 60 個 crate。`nsh test` 會在以相同方式建置、含你的 crate 的 runner 中,以無頭方式運行應用程式的測試。

在 Linux 上,你的 crate 可選擇可選的平台功能。在你的 `webview` 的 `nsh-platform-linux` 依賴項上啟用它即可使用 web view;這會連結 WebKitGTK 6.0,建置和運行應用程式都必須先安裝它。產生的 runner 會透過 Cargo 的 feature unification 沿用此選擇。

在 `nsh run` 期間,crate 的 Rust 程式碼一有改動,就會重新建置 runner 並重新啟動應用程式;在瀏覽器中,已開啟的頁面會自行載入新的運行時。`cargo run` 會直接在桌面後端(`src/main.rs`)上啟動同一個根組件,而嵌入 NSH 的原生應用程式則在 macOS、Windows、Linux、GPUI 和 iOS 的 `AppView` 上,以 `AppSource::Rust` 掛載 Rust 根組件。

所有平台(包括網頁)的程式碼都使用 NSH 的服務:`fetch` 用於 HTTP([網絡](./networking.md#from-rust-components))、`timer`、`set_timeout` 和 `set_interval` 用於等待、`nsh_core::time::Instant` 和 `nsh_core::time::unix_ms()` 用於時鐘。`background` 和 `blocking` 則在原生目標的執行緒上運行工作。

<a id="desktop-title-bars"></a>

## 桌面標題列

Rust 應用程式以 `nsh_core::element::desktop` 繪製自己的標題列。呼叫 `set_title_bar(TitleBarStyle::Hidden, Some(height))`,以 `.window_drag(true)` 標記標題列的背景,並以 `title_bar()` 預留原生視窗控制項的空間。其 `top` 是標題列的高度,`left` 和 `right` 是系統控制項所佔的寬度。讀取它會訂閱其變化,包括全螢幕。視窗拖曳及使用者對標題列的雙擊行為由平台處理;`.window_drag(false)` 可讓子元素不屬於其父元素的拖曳區域。

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` 會還原系統標題列。`close_window()` 沿用嵌入宿主的一般視窗關閉行為。該模組還包含視窗的其他函數(`set_title`、`minimize`、`toggle_full_screen` 等)以及選單(`set_application_menu`、`popup_menu`):見 [nsh/desktop](../modules/nsh-desktop.md)。

<a id="files-and-folders"></a>

## 檔案和資料夾

在桌面平台上,Rust 程式碼可顯示系統的檔案對話框,並把本機路徑交給系統處理,每個回應都在任務中等待:`pick_paths` 配合 `OpenDialog`(`OpenDialog::files()`、`::folders()` 或 `::files_and_folders()`)、`pick_save_path` 配合 `SaveDialog`、`open_path`(檔案的預設應用程式)、`reveal_path`(在 Finder、檔案總管或檔案管理員中選取該項目)以及 `move_to_trash`(項目的去向,當 macOS 有提供時)。使用者取消時,對話框回應 `Ok(None)`;無法顯示時則回應錯誤(在沒有檔案選擇器 portal 的 Linux 上,以及在 iOS、Android 和網頁上,`open_path`、`reveal_path` 和 `move_to_trash` 同樣回應錯誤)。每個失敗的請求都會回應其錯誤,絕不會回應 `false`。

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## 以 TSX 擴充 Rust 應用程式

crate 的 `#[native_module("app/native")]` 函數指明 TSX 可以匯入的內容:組件(`registry.register::<Chart>()`)、函數模組(`registry.module::<Portfolio>()`,以及作用於單元結構體及其 `impl` 的 `#[module]`)、類別(`registry.class::<Ledger>()`,以及作用於結構體及其 `impl` 的 `#[class]`)和資產;該屬性也會在 crate 根部產生 `pub fn registry()`,供你的測試和其他 Rust 程式碼使用同一組內容(`my_app_native::registry()`,位於 `nsh_base::registry()` 旁邊)。在 `#[module]` 或 `#[class]` `impl` 中,帶有 `pub fn` 的函數會被匯出(`pub(crate)` 亦然);沒有可見性修飾的函數是留在 Rust 內的輔助函數。它們的 TypeScript 宣告(包括文件註解)由 Rust 型別生成到 `.nsh/types` 中,因此 TSX 會由 `nsh check` 和你的編輯器對照檢查:

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

每個匯出項在 TypeScript 中的文件,來自命名它的 Rust 項目的文件註解:組件由其 `#[component] fn`(`Chart`)、模組和類別由其結構體(`Portfolio`、`Ledger`),而 props、事件、函數和成員則由各自的註解(setter 無需另寫,有 getter 的註解即可)。`Props` 結構體和事件列舉本身的文件註解,以及 `impl` 區塊的文件註解,都留在 Rust 內;在 `#[module]` 或 `#[class]` `impl` 區塊上寫文件註解是編譯錯誤,因為 TypeScript 不會顯示它。每個寫入 `.nsh/types` 的指令,都會對 TSX 可見但沒有文件註解的匯出項發出警告,並指出其名稱(`Ledger.add`、`Chart.range`)。

TypeScript 只顯示文件註解中第一個標題之前的部分。給 Rust 呼叫者的備註,例如 `&self` 借用什麼,或函數為何接受 `cx`,應放在標題之下,即 `# Rust`(或 rustdoc 的 `# Panics`、`# Examples`),並只保留在 Rust 文件中:

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

props 是組件 `Props` 結構體的欄位,事件是其 `Event` 列舉的變體(`onSelect`),兩者都使用 camel case。Rust 程式碼則以建構函數、每個 prop 一個 setter、每個事件一個監聽方法來放置同一個組件:`chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`。Rust 組件自身的內容、事件和狀態留在 Rust 內;TSX 傳入 props 並接收事件。prop 型別錯誤(例如對 `u32` prop 傳入 `level={1.5}`)只會產生警告,與內建元素相同:該 prop 保持原值,組件其餘部分照常渲染。

函數或成員按其 Rust 簽名所示的方式運行。不是 `async` 的函數在 TSX 呼叫內運行並返回其值(`Portfolio.total()` 是數字,`ledger.balance` 是屬性):它負責計算並保存狀態。`async fn` 返回 Promise,並以 NSH 的服務(`fetch`、`timer`、對話框)作為任務運行。接受 `cx: &mut ModuleCx` 的模組函數會與 UI 按順序存取平台(例如 toast、狀態列),組件的 ref 方法亦然;其返回型別決定 TSX 得到什麼:返回 `()` 的得到 `void`,沒有回覆(TSX 呼叫後即繼續);返回 `Result<(), E>` 的得到 `Promise<void>`,並以 `Err` 的訊息拒絕(該呼叫在 TSX 呼叫返回後,隨 UI 的變更一同運行,所以由 Promise 攜帶其錯誤;無人 await 或捕捉的會記錄為[未處理的 rejection](./dev-server-and-debugging.md#logs));返回一個值的得到 `Promise<T>`。參數和結果按簽名定型:數字、字串、`Option`、`Vec`、你的 `#[derive(JsObject)]` 結構體和 `#[derive(PropEnum)]` 列舉、你的類別的實例,以及 TSX 函數(`Callback<A, R>`,Rust 可在呼叫內立即呼叫它,或稍後以 `post` 和 `call_async` 呼叫;TS 對 `Callback<f64>` 看到 `(value: number) => void`,`#[args(balance)] listener: Callback<f64>` 則指明參數 `(balance: number) => void`)。開始監聽的函數命名為 `on(event, listener)` 並返回 `Stop`(`Stop::new(|| …)`),TSX 得到的是一個用來停止它的函數(`() => void`);它只運行一次,在 TSX 呼叫它時,或在呼叫 `on` 者消失時(組件,或熱重載下模組的運行)。事件的處理函數只接收一個物件:變體的值是其欄位 `value`(由變體上的 `#[args(price)]` 命名,`onSelect({ price })`),而 `#[args(open, reason)]` 則命名多欄位變體的各個欄位。型別錯誤的參數會在呼叫中拋出 `TypeError`,若是返回 Promise 的函數則使其 Promise 被拒絕;`Err` 會以其訊息拋出(或拒絕)。類別的物件擁有其 Rust 值:物件被回收時釋放,或以 `ledger.dispose()`(亦可用 `using ledger = new Ledger()`)立即釋放。指定 TSX 入口來運行它,`nsh run App.tsx` 或 `nsh package App.tsx --target …`:TSX 的修改是熱更新,Rust 的修改則會重新建置並重新啟動應用程式。CLI 會自行打包和編譯 TSX,並從描述中得知你的 crate 的匯出項;開發宿主和 `nsh test` 的無頭 runner 都連同你的 crate 和 QuickJS 一起建置。

儲存庫中的 `examples/rust-exports` 是匯出功能的參考:這是一個小型 TSX 應用程式,其 crate 匯出一個組件(必填、有預設值和可選的 props、一個事件、children)、一個模組(每種函數各一個)和一個類別(建構函數、方法、一個 getter 和 setter、一個 static、一個 `async` 成員、以另一個實例作為參數、一個 Rust 向其發送的回呼、`dispose()` 和 `using`),每項都有簡短的文件註解,並附有 Rust 和 TypeScript(`App.test.tsx`)的測試,這些測試會操作整個應用程式並檢查每項所顯示的內容。

儲存庫中的 `examples/gallery-rs` 是完整的 Rust 應用程式:每個示範都是 Rust,`nsh run examples/gallery-rs --target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` 會以無頭方式運行其測試,而 `cargo run -p gallery-native` 則在桌面後端啟動它。

<a id="render-functions-and-the-apps-classes"></a>

### 渲染函數與應用程式的類別

組件為其擁有的值(一列資料、文件的程式碼區塊)繪製應用程式的內容時,會使用渲染函數:一個 prop `Option<Renderer<T>>`,在 TypeScript 中為 `(value: T) => JSX.Element`。組件在內容所在之處呼叫 `render(key, value)`,得到一個視圖,可像其他視圖一樣為它設定樣式和位置(在 `text(..)` 內則為行內視圖)。只要值保持相等,內容就按 key 保留,值改變時則重新渲染。Rust 父組件把閉包傳給該 prop 的 setter(`quote().render_badge(|symbol| ..)`),由它產生對應的 `Renderer`。

組件內的樣式是型別化的;應用程式的 Tailwind class 透過一個 classes prop,以及該部分元素上的 `.app_class(..)`,作用到組件的某個部分。它們在元素自身樣式之後套用,並配合應用程式的主題、`dark:` 和各種狀態,與元素上的 `class` 一樣。

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`nsh/base` 中的 `TextView` 就是這樣建構的:它的 `renderCodeBlock`、`renderMath` 等是渲染函數,而它的 `classes` 是按部分劃分的應用程式 class([TextView](../elements/text-view.md))。
<a id="testing"></a>

## 測試

Rust app 的測試以無介面（headless）方式運行，無論是在 `cargo test` 還是 `nsh test`，都使用同一個 driver：在真實的引擎上運行，不開視窗，以 60 Hz 產生顯示幀，因此計時器、任務和動畫的運行方式與在螢幕上一樣。driver 會啟動 app，維護它所顯示的視圖的模型，並對由 selector 指定的視圖執行步驟（`press`、`type_text`、`submit`、`scroll`、`wait_for`）。selector 可以是文字、無障礙標籤或測試 id（`text:`、`label:`、`id:`）；無法執行的步驟會失敗，並附上螢幕上的文字。

在 `cargo test` 中，`nsh_testing::Headless`（nsh-testing 的預設 features，不含 QuickJS）會運行根組件（`app.screen()`：螢幕上的文字，以及它發出的 commands）；`EngineConfig::new` 是手機尺寸的引擎，沒有其他設定。`nsh test` 在以你的 crates 建成的 headless runner 中運行 TypeScript 測試（[測試](./testing-and-trace.md)），其中 `open(".")` 會啟動 Rust app 的根組件：

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

TSX 入口會使用 `nsh-testing` 的 feature `bundle` 來建置，方式與 `nsh run` 建置時相同，並針對其 host 所提供的 UI 集合：NSH 的 UI 集合，以及 `#[native_module]` 生成的各 crate 的 `registry()`：

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

`nsh_testing::compile_tsx` 會為多個測試只建置一次入口，而 `nsh_testing::start` 會把批次交給一個自行維護螢幕模型的測試。`examples/rust-exports` 以這種方式測試它的 TSX 入口；`examples/gallery-rs` 則用 TypeScript 測試它的 Rust 根組件，大約每個 demo 有一個測試檔案。

<a id="theme"></a>

## 主題

app 的外觀由 app 自己決定：NSH 提供 primitives 和 `nsh_base` 的無樣式基礎組件，而你的 crate 是其上的樣式層，也就是 app 自己的組件庫（[三個層次](./architecture.md#three-layers)）。Rust 組件從主題取得顏色、圓角半徑和字體，主題由 `nsh_base` 生成為 `theme()`，因此只需一個檔案就能改變 app 中所有組件的樣式。每種顏色都有淺色和深色兩個值；當系統切換外觀時，如 `.bg(move || theme().primary)` 這樣的綁定會以原生方式改變顏色，無需 render。

主題採用 [shadcn/ui](https://ui.shadcn.com/docs/theming) 的設計 token，預設為 shadcn 的 `neutral` 主題，即黑白配色，圓角半徑為 10 pt。若要使用自己的主題，請把 `nsh.json` 中的 `"theme"` 設為主題檔案的路徑（相對於 `nsh.json`），或直接內嵌主題內容：

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

主題檔案是 shadcn 的 `cssVars`，即 shadcn 主題和 registry items 的格式，因此從 [shadcn 的主題](https://ui.shadcn.com/themes)或 [tweakcn](https://tweakcn.com) 匯出的主題可直接使用。`light` 設定淺色外觀的值，`dark` 設定深色外觀的值，`theme` 則設定兩者共用的值：

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- 你的主題會套用在預設主題之上，因此只需列出你要更改的部分。在 `light` 中設定而在 `dark` 中省略的值，會同時用於兩種外觀。
- 值的寫法與 CSS 相同。顏色可以是任何 CSS 顏色（`#7c3aed`、`rgb(…)`、`hsl(…)`、`oklch(…)`、`white`）、`color-mix(in oklab, var(--primary) 80%, white)`，或同一外觀中的另一個 token `var(--primary)`（可附帶後備值：`var(--brand, #7c3aed)`）。長度寫作 `rem`（16 points）或 `px`（points）。字體是字體族列表：使用第一個非通用字體族，而若第一個是通用字體族（`system-ui`、`sans-serif`），則使用系統字體。
- **你自己的 token。** 任何其他名稱都是 app 的 token，就像 Tailwind 的 `@theme` 中的變數一樣：上面的 `"up"` 在 Rust 中是 `theme().color("up")`，在 class 中是 `bg-up` / `text-up/70`，在 TSX 中是 `token("up")`（[主題 token](./tailwind.md#theme-tokens)）。像 `"radius-card": "14px"` 這樣的數字是 `theme().number("radius-card")` 和 `rounded-(--radius-card)`。
- bundler 在建置時會檢查主題：檔案不存在、JSON 無效，或主題不是 `cssVars`，都會令建置失敗並報出 `nsh.json: theme: …` 錯誤。

各 token 及其預設的淺色和深色值（shadcn 的 `neutral`）：

| Token | `theme()` | 淺色 | 深色 | 用途 |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | app 的背景，以及其上的文字 |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | 卡片和分組表面，以及其上的文字 |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | 彈出視窗、選單和工具提示，以及其上的文字 |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | 主要操作（主按鈕），以及其上的文字 |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | 次要操作，以及其上的文字 |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | 低調的表面；次要文字：說明、標籤、佔位文字 |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | 被懸停或高亮的項目（例如選單項目或列表行），以及其文字 |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | 破壞性操作和錯誤 |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | 分隔線和邊框 |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | 輸入框的邊框 |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | 焦點環 |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | 同上 | 圖表的數據系列 |
| `sidebar`、`sidebar-foreground`、`sidebar-primary`、`sidebar-primary-foreground`、`sidebar-accent`、`sidebar-accent-foreground`、`sidebar-border`、`sidebar-ring` | `sidebar`、`sidebar_foreground`、... | `sidebar` `oklch(0.985 0 0)`、`sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`、`sidebar-primary` `oklch(0.488 0.243 264.376)` | 側邊欄的表面、主要操作、高亮項目、邊框和焦點環 |
| `radius` | `radius` | `0.625rem`（10 pt） | | 圓角半徑 |
| `font-sans` | `font_sans` | 系統字體 | | app 的字體：所有未自行設定字體族的文字 |
| `font-mono` | `font_mono` | 系統等寬字體 | | 等寬字體：`font-mono`、`TextView` 中的程式碼 |

<a id="several-crates"></a>

## 多個 crate

app 的 Rust 程式碼可以拆分為多個 crate，每個 crate 以自己的 specifier 匯入：`"rust"` 接受一個 crate 路徑列表，列表中的每個 crate 都有自己的 `#[native_module]` 函數。

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

每個 runner 和 host 都會連結全部 crate，而 `.nsh/types` 會宣告每個 specifier。各 crate 透過 Cargo path dependencies（`shared = { path = "../shared" }`）共用程式碼：公司組件的 crate 可被多個 crate 使用，也可被多個 app 列出，而只有列於 `"rust"` 的 crate 會匯出到 TSX。每個列出的 crate 都有自己的套件名稱和 specifier；`nsh` 會報告重複的名稱，並指出共用該名稱的兩個路徑。Rust app 的 `"root"` 是列表中第一個 crate 的組件。在 `nsh run` 和 `nsh dev` 期間，其中任何一個 crate 或它們以 path 依賴的 crate 有變更，都會重新建置 app 並重新啟動。

<a id="browser-apis-on-the-web"></a>

## 網頁上的瀏覽器 API

在網頁上，crate 可以透過 wasm-bindgen 和 `web-sys` 呼叫瀏覽器的 API（WebSocket、`IndexedDB` 等）；`nsh` 會連同 runtime 一起建置它們所需的 glue。請參閱 [Web](./web.md#browser-apis-from-rust)。

<a id="see-also"></a>

## 另請參閱

- [專案結構](./project-structure.md)：`nsh.json` 的每個 key。
- [Web](./web.md#apps-with-rust-components)：瀏覽器中的 Rust app。
- [網絡](./networking.md#from-rust-components)：Rust 中的 `fetch`。
- [CLI](./cli.md#nsh-init)：`nsh init --template rust` 和 `--template mixed`。
