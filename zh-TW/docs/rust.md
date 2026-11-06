---
title: "使用 Rust 進行開發"
description: "完全以 Rust 撰寫 Native Shell 應用程式,在任何平台上都不需要 QuickJS,或是以 Rust 搭配上層的 TSX 畫面:何時該選擇哪一種,以及兩者如何共用元件與模組。"
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# 使用 Rust 建構

Native Shell 應用程式可以用 Rust、TSX 或兩者混合撰寫。三者都執行在同一個引擎上：響應式圖、渲染器、Taffy 版面配置與原生模組（導覽、對話框、鍵盤、狀態列）在每種情況下都是 Rust，每個平台也都以自己的原生 UI 進行渲染。差別在於你自己程式碼所使用的語言，以及應用程式是否攜帶 JavaScript VM。

| | Rust | TSX | Rust 搭配 TSX |
|---|---|---|---|
| 你的 UI、狀態與處理常式 | Rust | 執行於 QuickJS 的 TSX | Rust 元件與模組，以及使用它們的 TSX 畫面 |
| 應用程式執行的內容 | 僅有引擎與你的 crate，所有平台與瀏覽器皆然 | QuickJS 與引擎（在瀏覽器中則為其 JavaScript 引擎） | QuickJS 與引擎，加上你的 crate（在瀏覽器中則為其 JavaScript 引擎） |
| 適用情境 | 具備複雜業務邏輯的中大型應用程式 | 於執行階段交付的應用程式與模組、快速迭代 | 以 Rust 為核心，其中部分內容經常變動 |
| 編輯方式 | 重新建構並重新啟動 | 熱更新 | TSX 為熱更新，Rust 需重新建構並重新啟動 |
| 開始 | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## 如何選擇

**Rust** 適合業務邏輯龐大且要求嚴苛的應用程式：交易、編輯器、資料密集的工具。你可以在整個應用程式中享有 Rust 的型別系統與編譯期檢查、crates.io 生態系，以及你自己程式碼（而不僅是 NSH）的原生效能，並能以 `cargo test` 對真實 UI 進行無頭測試。應用程式從頭到尾都是 Rust 與原生程式碼：在 iOS、Android、macOS、Windows、Linux、GPUI 與網頁上，都不會隨附或執行 JavaScript VM。元件是只執行一次的函式，並將 signal 綁定到所顯示的內容，與 TSX 相同（[Reactivity](./reactivity.md)），只是使用具型別的樣式，而非 class 字串。

**TSX** 適合在應用程式發佈之後才出現的 UI：原生應用程式在執行階段載入的模組、由模型產生或由其他團隊撰寫的模組，以[簽章套件](./signed-packages.md)交付，並在主機所設定的沙箱中執行，開發期間還能使用熱更新。

**Rust 搭配 TSX** 保留 Rust 核心，並在值得的地方加入 TSX：畫面、設定、新手引導、實驗，以及任何你想以熱更新反覆調整，或在執行階段以[簽章套件](./signed-packages.md)交付的內容。TSX 會像匯入任何 NSH 模組一樣匯入你的 Rust 元件與模組，因此兩半部分在具型別的介面上交會。TSX 執行於 QuickJS，因此應用程式會隨附它。

<a id="an-app-written-in-rust"></a>

## 以 Rust 撰寫的應用程式

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` 存放應用程式的內容：元件、狀態、處理常式、任務。

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

元素與元件的建立方式相同：由一個函式建立（`view()`、`text(..)`、`nsh_base` 的 `button()`、你的 `#[component] fn Chart` 的 `chart()`），其方法用來設定 props（每個 prop 一個 setter，可接受值、signal 或閉包）與監聽器（每個事件一個方法）。監聽器是以其事件為參數的閉包（`move |text: &str| ..`），而不帶資料的事件使用 `move || ..`；`.child(..)` 接受一個元素，或 `Option`、`Vec`、陣列或元素的迭代器（`.child(rows.iter().map(|r| row(r)))`）。

`nsh.json` 指定根元件，`nsh` 則掛載它：

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` 是元件在 crate 中的路徑（`App`、`shell::Gallery`；在第一個中使用[多個 crate](#several-crates)）；`"theme"` 是其元件所使用的[主題](#theme)，而 `"appearance"` 對它的作用與對 TSX 應用程式相同。有了這些，在應用程式目錄中執行 `nsh run` 與 `nsh package`，就會為目標平台建構應用程式專屬的執行器，掛載根元件，且不連結 QuickJS：

| 目標 | 執行的內容 |
|---|---|
| macOS、Windows、Linux | 含你的 crate 的發行版執行器，在視窗中執行；`nsh run` 會執行除錯版本，並在終端機中顯示應用程式的日誌 |
| iOS、iOS 模擬器、Mac Catalyst | 含你的 crate 的 iOS 執行器，以應用程式形式執行 |
| Android | 含你的 crate 的應用程式 `libnsh.so`，由執行階段的 activity 啟動 |
| Web | 含引擎與你的 crate 的 `nsh.wasm`（整個 Rust gallery 為 3.3 MB，使用 brotli 為 0.75 MB）；由頁面掛載根元件 |

`nsh` 只建構你的 crate 所需要的內容，不多做其他事：一個由你的 crate 與 NSH 核心組成的小程式，用來向 CLI 描述其元件與模組，其餘工作則由 CLI 自行完成；以及你所執行或封裝的每個目標平台的執行器。新的 Rust 應用程式首次建構時，會編譯你的 crate 與 NSH 核心，約 60 個 crate。`nsh test` 會在以相同方式建構、含你的 crate 的執行器中，以無頭模式執行應用程式的測試。

在 Linux 上，你的 crate 可選擇啟用選用的平台功能。若要使用 web view，請在你的 `nsh-platform-linux` 相依項上啟用 `webview`；這會連結 WebKitGTK 6.0，建構與執行應用程式時都必須已安裝它。產生的執行器會透過 Cargo 的 feature 統一機制繼承此選擇。

在 `nsh run` 期間，變更 crate 的 Rust 程式碼會重新建構執行器並重新啟動應用程式；在瀏覽器中，已開啟的頁面會自行載入新的執行階段。`cargo run` 會直接在桌面後端上啟動相同的根元件（`src/main.rs`），而嵌入 NSH 的原生應用程式則在 macOS、Windows、Linux、GPUI 與 iOS 的 `AppView` 上使用 `AppSource::Rust` 掛載 Rust 根元件。

適用於所有平台（包括網頁）的程式碼，都使用 NSH 的服務：`fetch` 用於 HTTP（[Networking](./networking.md#from-rust-components)），`timer`、`set_timeout` 與 `set_interval` 用於等待，`nsh_core::time::Instant` 與 `nsh_core::time::unix_ms()` 用於時鐘。`background` 與 `blocking` 則在原生目標平台的執行緒上執行工作。

<a id="desktop-title-bars"></a>

## 桌面標題列

Rust 應用程式以 `nsh_core::element::desktop` 繪製自己的標題列。呼叫 `set_title_bar(TitleBarStyle::Hidden, Some(height))`，以 `.window_drag(true)` 標記標題列的背景，並以 `title_bar()` 預留原生視窗控制項的空間。其 `top` 是標題列的高度，`left` 與 `right` 則是系統控制項所佔用的寬度。讀取它會訂閱其變更，包括全螢幕。視窗拖曳與使用者對標題列的連按兩下行為由平台處理；`.window_drag(false)` 可讓子元素不屬於其父元素的拖曳區域。

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

`set_title_bar(TitleBarStyle::Default, None)` 會還原系統標題列。`close_window()` 會遵循嵌入主機的一般視窗關閉行為。該模組還包含視窗的其他函式（`set_title`、`minimize`、`toggle_full_screen` 等）以及選單（`set_application_menu`、`popup_menu`）：[nsh/desktop](../modules/nsh-desktop.md)。

<a id="files-and-folders"></a>

## 檔案與資料夾

在桌面平台上，Rust 程式碼可顯示系統的檔案對話框，並將本機路徑交給系統處理，每個回應都在任務中等待：`pick_paths` 搭配 `OpenDialog`（`OpenDialog::files()`、`::folders()` 或 `::files_and_folders()`）、`pick_save_path` 搭配 `SaveDialog`、`open_path`（檔案的預設應用程式）、`reveal_path`（在 Finder、檔案總管或檔案管理員中選取該項目）以及 `move_to_trash`（在 macOS 提供資訊時，回報項目的去向）。使用者取消時，對話框回應 `Ok(None)`；無法顯示時則回應錯誤（在沒有檔案選擇器 portal 的 Linux 上，以及在 iOS、Android 與網頁上，`open_path`、`reveal_path` 與 `move_to_trash` 同樣回應錯誤）。每個失敗的請求都會回應其錯誤，而絕不會回應 `false`。

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

crate 的 `#[native_module("app/native")]` 函式指定 TSX 可匯入的內容：元件（`registry.register::<Chart>()`）、函式模組（`registry.module::<Portfolio>()`、單元結構體上的 `#[module]` 及其 `impl`）、類別（`registry.class::<Ledger>()`、結構體上的 `#[class]` 及其 `impl`）與資產；該屬性也會在 crate 的根部產生 `pub fn registry()`，供你的測試與其他 Rust 程式碼使用相同的集合（`my_app_native::registry()`，位於 `nsh_base::registry()` 旁）。在 `#[module]` 或 `#[class]` `impl` 中，會匯出 `pub fn`（`pub(crate)` 亦同）；沒有可見性修飾的函式則是留在 Rust 中的輔助函式。它們的 TypeScript 宣告（包含文件註解）由 Rust 型別產生到 `.nsh/types` 中，因此 TSX 會由 `nsh check` 與你的編輯器據此檢查：

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

每個匯出項目在 TypeScript 中的文件，來自指定它的 Rust 項目的文件註解：元件由其 `#[component] fn`（`Chart`）、模組與類別由其結構體（`Portfolio`、`Ledger`），而 props、事件、函式與成員則由各自的文件註解（setter 無需另寫，沿用其 getter 的即可）。`Props` 結構體與事件列舉本身的文件註解，以及 `impl` 區塊的文件註解，都保留在 Rust 中；在 `#[module]` 或 `#[class]` `impl` 區塊上寫文件註解會造成編譯錯誤，因為 TypeScript 不會顯示它。每個寫入 `.nsh/types` 的指令，都會對 TSX 可見但沒有文件註解的匯出項目發出警告，並指出其名稱（`Ledger.add`、`Chart.range`）。

TypeScript 只顯示文件註解到第一個標題為止。給 Rust 呼叫者的說明，例如 `&self` 借用了什麼，或某個函式為何接受 `cx`，請放在標題之下，即 `# Rust`（或 rustdoc 的 `# Panics`、`# Examples`），並保留在 Rust 文件中：

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

Props 是元件 `Props` 結構體的欄位，事件則是其 `Event` 列舉的變體（`onSelect`），兩者都使用駝峰式命名。Rust 程式碼以其建構函式、每個 prop 一個 setter，以及每個事件一個監聽器方法來放置同一個元件：`chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`。Rust 元件自身的內容、事件與狀態都留在 Rust 中；TSX 傳入 props 並接收事件。prop 型別錯誤（例如對 `u32` prop 傳入 `level={1.5}`）會產生警告，與內建元素相同：該 prop 保留其值，元件其餘部分照常渲染。

函式或成員依其 Rust 簽章所述的方式執行。不是 `async` 的函式在 TSX 呼叫內執行並回傳其值（`Portfolio.total()` 是數字，`ledger.balance` 是屬性）：它進行運算並保存狀態。`async fn` 會回傳 Promise，並以 NSH 的服務（`fetch`、`timer`、對話框）作為任務執行。接受 `cx: &mut ModuleCx` 的模組函式會與 UI 依序存取平台（例如 toast、狀態列），元件的 ref 方法亦然；它們的回傳型別決定 TSX 得到什麼：回傳 `()` 的得到 `void`，沒有回覆（TSX 呼叫後即繼續執行）；回傳 `Result<(), E>` 的得到 `Promise<void>`，並以 `Err` 的訊息 reject（該呼叫會在 UI 的變更中、TSX 呼叫返回之後執行，因此由 Promise 攜帶其錯誤；無人 await 或捕捉的錯誤會被記錄為[未處理的 rejection](./dev-server-and-debugging.md#logs)）；回傳一個值的則得到 `Promise<T>`。引數與結果依簽章而有型別：數字、字串、`Option`、`Vec`、你的 `#[derive(JsObject)]` 結構體與 `#[derive(PropEnum)]` 列舉、你的類別的實例，以及 TSX 函式（`Callback<A, R>`，Rust 可在呼叫內立即呼叫，或之後以 `post` 與 `call_async` 呼叫；TS 對 `Callback<f64>` 看到 `(value: number) => void`，而 `#[args(balance)] listener: Callback<f64>` 為引數命名，`(balance: number) => void`）。開始監聽的函式命名為 `on(event, listener)` 並回傳 `Stop`（`Stop::new(|| …)`），TSX 會將它取得為用來停止監聽的函式（`() => void`）；它只執行一次，於 TSX 呼叫它時，或於呼叫 `on` 的對象結束時（元件，或熱重載下模組的執行）。事件的處理常式會得到一個物件：變體的值是它的欄位 `value`，此名稱由變體上的 `#[args(price)]` 指定（`onSelect({ price })`），而 `#[args(open, reason)]` 則為含多個欄位的變體命名其欄位。引數型別錯誤時，會在呼叫中拋出 `TypeError`，或使回傳 Promise 的函式的 Promise 被 reject；`Err` 會以其訊息拋出（或 reject）。類別的物件擁有其 Rust 值：它會在物件被回收時釋放，或以 `ledger.dispose()`（亦可用 `using ledger = new Ledger()`）立即釋放。指定 TSX 進入點即可執行它，`nsh run App.tsx` 或 `nsh package App.tsx --target …`：TSX 的編輯為熱更新，Rust 的編輯則會重新建構並重新啟動應用程式。CLI 會自行打包並編譯 TSX，並從 crate 的描述得知其匯出項目；開發主機與 `nsh test` 的無頭執行器都與你的 crate 及 QuickJS 一同建構。

儲存庫中的 `examples/rust-exports` 是匯出功能的參考範例：一個小型 TSX 應用程式，其 crate 匯出一個元件（必要、有預設值與選用的 props、一個事件、children）、一個模組（每種類型各一個函式）與一個類別（建構函式、方法、getter 與 setter、static、`async` 成員、作為引數的另一個實例、Rust 向其 post 的回呼、`dispose()` 與 `using`），各自附有簡短的文件註解，以及以 Rust 與 TypeScript 撰寫的測試（`App.test.tsx`），這些測試會操作整個應用程式並檢查每一項所顯示的內容。

儲存庫中的 `examples/gallery-rs` 是一個完整的 Rust 應用程式：每個示範都是 Rust，`nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` 會以無頭模式執行其測試，而 `cargo run -p gallery-native` 則在桌面後端上啟動它。
<a id="render-functions-and-the-apps-classes"></a>

### Render function 與 app 的 class

當元件要為 app 所擁有的值繪製內容（例如一列資料、文件中的一個程式碼區塊）時，會使用 render function：這是一個 prop `Option<Renderer<T>>`，在 TypeScript 中為 `(value: T) => JSX.Element`。元件在內容所在之處呼叫 `render(key, value)`，並取得一個 view，可以像其他 view 一樣設定樣式與位置（在 `text(..)` 內，或作為 inline view）。只要值保持相等，內容就會依 key 保留；值改變時則重新渲染。Rust 的父元件會將 closure 傳給該 prop 的 setter（`quote().render_badge(|symbol| ..)`），由它產生對應的 `Renderer`。

元件中的樣式是有型別的；app 的 Tailwind class 會透過一個 class prop 以及該部位元素上的 `.app_class(..)` 作用於元件的某個部位。它們會在元素自身的樣式之後套用，並帶有 app 的主題、`dark:` 與各種狀態，就像元素上的 `class` 一樣。

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

`TextView` 在 `nsh/base` 中就是這樣建構的：它的 `renderCodeBlock`、`renderMath` 等都是 render function，而它的 `classes` 則是依部位區分的 app class（[TextView](../elements/text-view.md)）。

<a id="testing"></a>

## 測試

Rust app 的測試會以 headless 方式執行，在 `cargo test` 或 `nsh test` 中使用相同的 driver：在真實的引擎上、不需視窗、以 60 Hz 的顯示幀運作，因此計時器、task 與動畫的行為與在螢幕上相同。driver 會啟動 app、維護它所顯示 view 的模型，並對由 selector 指定的 view 執行操作（`press`、`type_text`、`submit`、`scroll`、`wait_for`）；selector 可以是文字、無障礙標籤或 test id（`text:`、`label:`、`id:`）；無法執行的操作會失敗，並附上螢幕上的文字。

在 `cargo test` 中，`nsh_testing::Headless`（nsh-testing 的預設 feature，不含 QuickJS）會執行 root（`app.screen()`：螢幕上的文字、它送出的 command）；`EngineConfig::new` 是手機尺寸的引擎，不做其他設定。`nsh test` 會在以你的 crate 建構的 headless runner 中執行 TypeScript 測試（[測試](./testing-and-trace.md)），其中 `open(".")` 會啟動 Rust app 的 root：

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

TSX entry 會以 `nsh-testing` 的 feature `bundle` 建構，如同 `nsh run` 的建構方式，並針對其 host 所提供的 UI set：NSH 的 UI set，以及每個 crate 的 `registry()`，由 `#[native_module]` 產生：

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

`nsh_testing::compile_tsx` 會為多個測試只建構一次 entry，而 `nsh_testing::start` 會將批次交給自行維護螢幕模型的測試。`examples/rust-exports` 以這種方式測試其 TSX entry；`examples/gallery-rs` 則以 TypeScript 測試其 Rust root，大約每個 demo 各有一個測試檔。

<a id="theme"></a>

## 主題

app 的外觀由 app 自己決定：NSH 提供 `nsh_base` 的 primitive 與未設定樣式的基礎元件，而你的 crate 則是其上的樣式層，也就是 app 自己的元件庫（[三層](./architecture.md#three-layers)）。Rust 元件的顏色、圓角半徑與字型取自主題，該主題由 `nsh_base` 產生 `theme()`，因此一個檔案就能為 app 的所有元件重新設定樣式。每個顏色都有淺色與深色兩個值；當系統切換外觀時，像 `.bg(move || theme().primary)` 這樣的 binding 會以原生方式變更顏色，無需重新渲染。

主題包含 [shadcn/ui](https://ui.shadcn.com/docs/theming) 的 design token，其預設值為 shadcn 的 `neutral` 主題，是一組黑白配色，圓角半徑為 10 pt。若要使用自己的主題，請將 `nsh.json` 中的 `"theme"` 設為主題檔案的路徑（相對於 `nsh.json`），或直接內嵌主題內容：

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

主題檔案為 shadcn 的 `cssVars`，也就是 shadcn 主題與 registry item 的格式，因此從 [shadcn 的主題](https://ui.shadcn.com/themes)或 [tweakcn](https://tweakcn.com) 匯出的主題可直接使用。`light` 設定淺色外觀的值，`dark` 設定深色外觀的值，`theme` 則設定兩者共用的值：

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

- 你的主題會套用在預設主題之上，因此只需列出你要變更的項目。在 `light` 中設定而 `dark` 中省略的值，會同時用於兩種外觀。
- 值的寫法與 CSS 相同。顏色可以是任何 CSS 顏色（`#7c3aed`、`rgb(…)`、`hsl(…)`、`oklch(…)`、`white`）、`color-mix(in oklab, var(--primary) 80%, white)`，或同一外觀下的另一個 token `var(--primary)`（可附帶 fallback：`var(--brand, #7c3aed)`）。長度為 `rem`（16 points）或 `px`（points）。字型為字型家族清單：會使用第一個非 generic 的家族，而若第一個家族是 generic（`system-ui`、`sans-serif`），則使用系統字型。
- **你自己的 token。** 任何其他名稱都是 app 的 token，就像 Tailwind 的 `@theme` 中的變數一樣：上面的 `"up"` 在 Rust 中是 `theme().color("up")`，在 class 中是 `bg-up` / `text-up/70`，在 TSX 中是 `token("up")`（[主題 token](./tailwind.md#theme-tokens)）。像 `"radius-card": "14px"` 這樣的數字是 `theme().number("radius-card")` 與 `rounded-(--radius-card)`。
- bundler 會在建構時檢查主題：檔案遺失、JSON 無效，或主題不是 `cssVars`，都會使建構失敗並出現 `nsh.json: theme: …` 錯誤。

各 token 及其預設的淺色與深色值（shadcn 的 `neutral`）：

| Token | `theme()` | 淺色 | 深色 | 用途 |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | app 的背景，以及其上的文字 |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | 卡片與分組的表面，以及其上的文字 |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popover、選單與 tooltip，以及其上的文字 |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | 主要動作（primary button），以及其上的文字 |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | 次要動作，以及其上的文字 |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | 低調的表面；次要文字：說明文字、標籤、placeholder |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | 被 hover 或醒目標示的項目（如選單項目或清單列），以及其文字 |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | 破壞性動作與錯誤 |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | 分隔線與邊框 |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | 輸入元件的邊框 |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | 焦點環 |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | 相同 | 圖表的各個數列 |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | 側邊欄的表面、主要動作、醒目標示的項目、邊框與焦點環 |
| `radius` | `radius` | `0.625rem`（10 pt） | | 圓角半徑 |
| `font-sans` | `font_sans` | 系統字型 | | app 的字型：每個未自行設定字型家族的文字 |
| `font-mono` | `font_mono` | 系統等寬字型 | | 等寬字型：`font-mono`、`TextView` 中的程式碼 |

<a id="several-crates"></a>

## 多個 crate

app 的 Rust 程式碼可以拆分為多個 crate，每個 crate 以各自的 specifier 匯入：`"rust"` 接受一份 crate 路徑清單，其中每個 crate 都有各自的 `#[native_module]` 函式。

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

每個 runner 與 host 都會連結所有 crate，並由 `.nsh/types` 宣告每個 specifier。crate 之間透過 Cargo path dependency（`shared = { path = "../shared" }`）共用程式碼：公司元件的 crate 可供多個 crate 使用，也可列於多個 app 中，而只有列於 `"rust"` 的 crate 會匯出到 TSX。每個列出的 crate 都有各自的 package name 與 specifier；`nsh` 會回報重複的項目，並附上共用它的兩個路徑。Rust app 的 `"root"` 是所列第一個 crate 的元件。在 `nsh run` 與 `nsh dev` 期間，其中任何一個 crate 或它們以 path 依賴的 crate 發生變更，都會重新建構 app 並重新啟動。

<a id="browser-apis-on-the-web"></a>

## 網頁上的 Browser API

在網頁上，crate 可以透過 wasm-bindgen 與 `web-sys` 呼叫瀏覽器的 API（WebSocket、`IndexedDB` 等）；`nsh` 會連同 runtime 一併建構所需的 glue。請參閱 [Web](./web.md#browser-apis-from-rust)。

<a id="see-also"></a>

## 另請參閱

- [專案結構](./project-structure.md)：`nsh.json` 的每個 key。
- [Web](./web.md#apps-with-rust-components)：瀏覽器中的 Rust app。
- [網路](./networking.md#from-rust-components)：從 Rust 使用 `fetch`。
- [CLI](./cli.md#nsh-init)：`nsh init --template rust` 與 `--template mixed`。
