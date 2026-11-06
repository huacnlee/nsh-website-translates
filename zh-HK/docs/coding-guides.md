---
title: "編碼指南"
description: "適用於可維護的 Native Shell 應用程式與元件庫的架構及編碼慣例,涵蓋 Rust 和 TSX。"
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---


# 編碼指南

本指南介紹在 Native Shell 應用程式中經實踐證明持久耐用的應用程式架構與程式碼模式。內容同時為工程師和編碼代理而寫：NSH 應用程式的開發者（TSX 模組、Rust 元件、嵌入 NSH 的原生應用程式），以及基於 `nsh/base` 建構元件庫的作者。請先閱讀設計指南：程式碼結構應保留產品意圖，而不是取代它。

本指南屬規範性文件。**必須**用於標示生命週期、正確性或生態系統方面的限制；**應該**是預設架構，若要偏離，需要有具體理由。確切的簽名仍以現行原始碼、參考頁面及 `.nsh/types` 中的宣告為準。

<a id="make-the-common-path-inexpensive"></a>

## 讓常見路徑成本低廉

**設計原則：選擇框架型別與擁有權時，應令一般的元件使用預設已經成本低廉。** 開發者應能建構及重用 UI，而無需在每個呼叫處加上快取。只執行一次的元件，以及在使用處讀取的[訊號](./reactivity.md)，就是這方面的例子：元件只建構一次它負責的那部分樹，之後只有讀取了已變更訊號的綁定會再次執行，因此常見路徑可避免重複工作。響應式圖、渲染器、版面配置和列表都是原生的，應用程式程式碼的一個回合會變成一批原生操作。然而，細微的成本仍會隨元素和更新數量而倍增，在 TSX 中尤其如此，因為其程式碼在直譯器中執行；在加入快取之前，請先量度特殊的熱點路徑（[效能](./performance.md)）。這兩種做法都不保證零成本。[狀態擁有權規則](#state-ownership)和後續的渲染章節會說明背後的機制。

<a id="architecture-at-a-glance"></a>

## 架構概覽

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

依賴關係向下指。較高層擁有領域意義和協調工作；較低層擁有可重用的呈現或行為。不要令可重用元件依賴應用程式頁面，也不要令元件庫依賴某個應用程式的主題（[三個層次](./architecture.md#three-layers)）。

請使用以下邊界：

- **應用程式外殼：** 入口（`App.tsx`，或 `nsh.json` `"root"`）組合根元件和導航堆疊，同時不包含頁面邏輯；
- **頁面：** 一個 `NavPage`，連同其內容、對話框，以及它啟動的工作；
- **應用程式元件：** 重複出現、具領域意識的模式；
- **元件庫：** 有樣式的通用 UI，可以是應用程式自己的或社群的，建基於 `nsh/base`；
- **`nsh/base`：** 不含產品呈現的可重用行為：導航、對話框、彈出框、選單、面板、按壓目標；
- **`nsh`：** 基礎元件、樣式、版面配置、響應式和環境。

<a id="lay-out-an-apps-files"></a>

### 規劃應用程式的檔案

應用程式的檔案遵循 NSH 的慣例，因此無需任何設定：`App.tsx` 是入口，`nsh.json` 與它並排，兩者都按慣例被找到。

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` 為每個 `NavPage` 存放一個檔案。頁面只有在需要時才會拆分成更多檔案。
- `components/` 存放應用程式的可重用元件，即數個頁面共用的元件。
- `store.ts` 存放應用程式的狀態：其訊號，以及更改這些訊號的函式。頁面讀取訊號並呼叫這些函式。
- 測試是放在被測對象旁邊的 `*.test.tsx` 檔案（`App.test.tsx`、`pages/Inbox.test.tsx`）。
- `Cargo.toml` 和 `src/lib.rs` 是應用程式自己的 crate，包含其 Rust 元件（`nsh.json` `"rust": "."`）；其在 `src/lib.rs` 中的 `#[native_module]` 指明 TSX 匯入的內容。只用 Rust 編寫的應用程式是同樣的 Cargo 專案，其根元件位於 `src/lib.rs`（[專案結構](./project-structure.md)）。

應用程式外殼負責組合頁面，但幾乎不包含頁面邏輯。頁面讀取 store 的訊號並呼叫其函式；它們絕不會寫入另一個頁面的狀態。請保持 store 的訊號為私有，只匯出讀取和更改它們的函式，使可變狀態隱藏在其公開函式之後：

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

頁面可以持有工作區，並把其 id 傳給搜尋；搜尋不需要工作區的整個集合或其私有訊號。一個簡單的無環依賴結構如下：

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

頁面可以依賴 store 和元件，但不可依賴外殼或另一個頁面的私有部分。如果某個頁面必須更改另一個頁面所顯示的內容，應透過 store 進行。這些邊界讓不同的工程師或 AI 代理能夠並行處理不同的頁面，減少檔案衝突和共享狀態的耦合；不過 store 仍需要協調。

<a id="bootstrap-and-root-ownership"></a>

## 啟動與根元件的擁有權

應用程式只掛載一次，並讓根元件佔據整個表面：TSX 入口呼叫 `mount(App)`，Rust 應用程式則在 `nsh.json`（`"root": "App"`）中指明其根元件。根元件以 `flex: 1` 和取自主題的背景填滿表面：

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

根元件負責協調屬於整個表面的事物：導航堆疊、顯示在其中所有內容之上的對話框、彈出框、選單、面板和工具提示，以及安全區域。不要在同一個表面內為每個頁面掛載第二個根元件。一個表面就是一個引擎：原生應用程式嵌入的每個 `NshAppView`、`NshView` 或 `AppView` 都執行自己的 VM、自己的模組狀態和自己的響應式圖，因此同一個宿主應用程式中的多個表面不會意外共享狀態。

<a id="understand-what-runs-once-and-what-runs-again"></a>

## 了解哪些只執行一次、哪些會再次執行

NSH 是基於 Solid 模型的保留式狀態配合宣告式建構（[響應式](./reactivity.md)）。訊號在多次更新之間持續存在；元件主體在建立時只描述它那部分的樹一次。請清楚區分這一點：

| 你撰寫的內容 | 執行時機 | 再次執行的條件 |
| --- | --- | --- |
| 元件主體 | 建立時執行一次 | 永不 |
| 綁定：放在需要值之處的閉包（Rust）或呼叫或讀取屬性的表達式（TSX） | 一次 | 它讀取的訊號變更時；只更新該屬性或子節點 |
| `computed(fn)` | 建立時 | 它讀取的訊號變更時 |
| `effect(fn)` | 該次處理的元素存在之後 | 它讀取的訊號變更時 |
| `each` / `<Each>` 的一列 | 其鍵首次出現時 | 永不；其項目和索引訊號會變更 |
| `virtual_list` / `<List>` 的一個儲存格 | 每個儲存格一次 | 永不；儲存格會被給予其他列 |

- 正在執行的元件就是**擁有者**：在其執行期間建立的 effect、計算值、任務、計時器、按鍵綁定和清理函式都屬於它，並隨它一同被釋放；
- **context**（`provide_context` / `use_context`、`context()` 和 `<Ctx.Provider>`）讓子樹取得一個值，但並不表示讀取它的元素擁有它；
- Rust 元件的 **`Scope`**（`cx`）發出其事件，並讀取獲提供的內邊距；
- **ref**（`element_ref()`、`ref`）為宿主元素命名，以供命令式呼叫（`focus()`、`scroll_to()`、`measure()`）；
- 版面配置和量度屬於稍後的原生階段；只有在確實需要已解析的幾何資料時，才使用 `onLayout` 和 `measure()`。

切勿在事件處理器或計時器中讀取 context，因為那裏沒有可供查找的元件：應在主體中讀取，並保留所得的值。請保留具型別的控制代碼（訊號、資源、ref、領域 id），它們在 Rust 中是 `Copy`，並在其擁有者消失後停止作用。

<a id="choose-the-right-unit"></a>

## 選擇合適的單元

<a id="use-a-plain-function-for-value-like-elements"></a>

### 對值式元素使用普通函式

**輕量、可重用的 UI 片段，預設使用普通函式。** 呼叫者提供當前的屬性和處理器，函式返回元素，除了它建立的綁定之外，不會留下任何東西。它的參數就是它的屬性；顯示的標籤、值和回呼都來自呼叫者的當前狀態。它與任何元件一樣只執行一次：之後變更的是它的綁定。

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### 對保留式行為使用元件

當一段 UI 擁有持久狀態或獨立的生命週期（訊號、effect、非同步工作、計時器、按鍵綁定）時，請使用 `#[component]`（或建立訊號的 TSX 元件）。這些狀態應在元件主體中建立一次，絕不可在綁定內建立。

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

`#[component]` 具有型別化的屬性（`#[derive(Props)]`）和事件（`#[derive(Event)]`）；TSX 透過由它們生成的宣告來匯入它。TSX 配合 `new` 使用的保留式狀態（帳本、解析器、工作階段）是一個 `#[class]`，而函式則是一個 `#[module]`（[以 Rust 建構](./rust.md#extending-a-rust-app-with-tsx)）。應用程式最常用的部分、元件庫和要求較高的邏輯，請以 Rust 編寫，因為 Rust 從頭到尾都是原生程式碼；TSX 則留給經常變動或在執行時交付的內容。

不要把每個視覺片段都變成元件。元件邊界帶有生命週期和協調的成本；應只在保留身分識別有意義之處使用。

<a id="elements-views-and-behavior-systems-are-different"></a>

### 元素、視圖和行為系統各不相同

不要強迫每個元件都套用同一個範本。生態系統包含：

- 語意元素，例如 `Button`、`Switch` 和 `MenuItem`；
- 複合行為根，例如 `Dialog`、`Popover`、`Menu`、`ContextMenu`、`Sheet` 和 `NavStack`；
- 有狀態的系統，例如 `Input`、`List`、`TextView` 和導航堆疊的狀態；
- 基礎設施，例如覆蓋層及其放置、虛擬化、捲動、安全區域、鍵盤和動畫。

一個元素在內部可以很複雜，但對呼叫者而言仍是值式的。有狀態的系統可以公開渲染函式，讓應用程式擁有呈現方式，而無需重新實作行為。公開的接縫應根據行為來選擇，而不是根據其輸出中出現多少個視圖。

<a id="state-ownership"></a>

## 狀態擁有權

<a id="own-persistent-ui-text-with-103"></a>

### 以 `SharedString` 擁有持久的 UI 文字

**在 Rust 中，對於跨更新或回呼閉包而保留的 UI 文字，必須優先使用 `SharedString`**，包括元件標籤、標題和佔位文字：屬性接受它（`Prop<SharedString>`），而把它複製到綁定中並不會複製文字本身。對於可變的編輯緩衝區，或需要邊格式化邊組合的文字，請使用 `String`，並在結果準備好時再轉換；若只在一次呼叫期間臨時唯讀存取，請使用 `&str`。在 TSX 中，字串是應用程式自己的值；由狀態計算出來的文字，請保留在 `computed` 或閉包中，而不要在多處重複建構。

對於 UI 會保留的不可變回應文字，請保持收到的值不變，並把衍生或已格式化的呈現文字放在另一個領域值中，而不是改寫該回應。

把每項狀態放在能保持其正確性的最窄擁有者中：

- 領域狀態屬於 store（`store.ts`）或應用程式的 crate；
- 暫時性的視圖狀態屬於渲染它的元件，以訊號形式存在；
- 可重用的行為狀態屬於為此而設計的元件（沒有 `open` 的 `Menu` 或 `Popover` 會自行保留）；
- 子樹共享的狀態，是透過 [context](./reactivity.md#context) 提供的訊號；
- 在一次執行之後仍需保留的內容，屬於[儲存](../modules/nsh.md#storage)或伺服器。

對於一般的選取和切換，請優先使用受控值：把當前值傳入元件，接收請求的變更，更新擁有者，綁定便會隨之更新。回呼只回報意圖；它不應建立第二個隱藏的單一事實來源。

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

無需通知任何對象：寫入訊號會準確更新讀取它的綁定。Rust 元件發出語意事件，其擁有者應以 `cx.emit(..)` 處理；effect 會在其擁有者存活期間追蹤訊號。構成同一個不變式的多個欄位，應在同一個 [`batch`](./reactivity.md#batch) 中寫入，讓 effect 和計算值同時看到它們。

應用程式自己的受控元件遵循相同的契約。數量步進器是一個只用 Rust 編寫一次、並可從 Rust 和 TSX 放置的領域控制項：

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

TSX 中的相同契約，是位於 `components/` 的一個元件：

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### 讓所有權連結與訂閱保持有界

組件擁有自己所建立的一切，而這一切會隨組件一併消失：當其 `<If>` 分支隱藏、其所在的列被移除，或其頁面被彈出時。在 Rust 中，任務、計時器與間隔計時器（`spawn`、`set_timeout`、`set_interval`）以及按鍵綁定（`on_key`）會隨建立它們時所屬的擁有者一同結束；在 TSX 中，請以 [`cleanup`](./reactivity.md#cleanup) 註冊停止動作，或從 effect 中回傳。監聽使用 `on(event, listener)`（`host.on(name, listener)`、`BackHandler.on("press", listener)`），它會回傳一個用來停止監聽的函式（`() => void`，在 Rust 中為 `Stop`）；組件渲染期間所註冊的內容會隨組件一併消失，`keymap.bind` 的按鍵綁定亦然。

當有東西意外地持續運行時，首先檢查：在組件之外建立的 effect 與計算值（在事件處理器或計時器回呼中建立的沒有擁有者，會永久存在）、註冊了但沒有對應停止動作的監聽器，以及從沒有組件擁有的 store 啟動的工作。被丟棄的 `resource` 載入會被中止（TSX 中為 `info.signal`）；它不會讓其組件保持存活。以上是常見的起點，並非詳盡清單。

不要僅因為讀取或推導了某個值就寫入 signal。避免在讀取同一 signal 的綁定或 effect 中無條件寫入：它會不斷重新觸發自己，直至 NSH 以錯誤將其停止。由其他狀態計算而來的值應為 `computed`，而不是寫入第二個 signal 的 effect。

<a id="avoid-state-feedback-loops"></a>

### 避免狀態回饋迴圈

文字輸入、選取、篩選器及受控彈出層通常有兩條路徑：外部擁有者更新值，而使用者互動則請求新值。同步時，不要把擁有者提供的值再經由使用者回呼送回去。處理使用者操作時，以非追蹤方式讀取擁有者的當前值（Rust 中為 `props.value.get_untracked()`，同上；TSX 的事件處理器本身已是非追蹤的），並與下一個值比較，使每個邏輯變更只被回報一次。當回呼可能同步關閉、替換或更新呼叫它的組件時，要讓回呼具備可重入安全性。

<a id="stable-identity"></a>

## 穩定識別

key 是行為的一部分。它為列、頁面或重複的控件提供穩定識別，並決定資料變更時由哪一個保留其狀態、焦點與量度。

- 為列、分頁、頁面及重複的控件使用穩定的領域 id：`each(projects, |p| p.id, ..)`、`<Each of={projects()} key={(p) => p.id}>`、列表的 `keyExtractor`。
- 當同一控件重複出現時，測試 id 要加上其所屬物件作為命名空間（`delete-${project.id}`）。
- 當項目可能被插入或重新排序時，切勿以翻譯後的標籤或可變的列表索引來推導識別。
- 不要在渲染期間產生全新的隨機 key 或 id。

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

key 改變即代表 UI 識別改變。請將這種重置視為刻意的行為。

同一規則適用於導覽路由、列表 key、儲存 key 及測試 id。留在 `setRoutes` 中的路由會保留其頁面與狀態；若兩個各自獨立保留的行為共用同一個 key，它們可能互相覆蓋對方的狀態；若某個行為每次更新都更換 key，它便永遠無法累積狀態。

<a id="rendering-and-composition"></a>

## 渲染與組合

讓組件主體保持宣告式：讀取當前狀態、推導呈現用的值，並組合元素。把領域操作、解析及較複雜的變更移至 store 或應用程式 crate 中具名的函式。

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

當 helper 能為一個有意義的區域命名，並減少讀者須同時記住的狀態量時，才抽出 helper。當該區域有自己可重用的契約或需保留的生命週期時，才抽出新組件，而不是僅因為 builder 鏈或 JSX 區塊很長。

在 Rust 中一致地使用具型別的樣式方法與組件的 builder，在 TSX 中則使用 class。對於小幅的條件式調整，建議使用 `.when(..)` / `.when_some(..)`（Rust）及 `classList`（TSX）；當不同分支代表截然不同的介面時，請使用 `when` / `<If>`，因為閉包中的三元運算式會在它所讀取的任何內容改變時重新建構其分支。

先從標準的語義組件組合，再考慮自行建構自訂表面。不要僅為了貼合某張截圖，就用通用的 view 重製選單、popover、sheet 或對話框：來自 `nsh/base` 的 `Menu`、`ContextMenu`、`Popover`、`Sheet`、`Tooltip` 及 `Dialog` 會保留定位、焦點轉移、鍵盤導覽、選取、停用狀態、按 Escape 與返回時關閉，以及無障礙契約。若標準組件無法表達某個經常出現的有效模式，請改進其明確的 API，而不是在每個呼叫處為任意的子孫元素加樣式。

由應用程式碼提供的渲染函式應當沒有副作用。列表的 row、`TextView` 的 `renderCodeBlock` 或選單的項目，可能在其擁有者每次需要一個儲存格、一個部件或一次開啟時執行。它們不得執行業務操作、附加資料或啟動沒有界限的訂閱。

<a id="behavior-and-presentation-boundary"></a>

## 行為與呈現的界線

長期有效的 Base 規則是：

> Base 擁有可重用的行為，以及實現該行為所需的結構。呈現層擁有產品的視覺語言。

「無樣式」並不等於「一個空的 view」。覆蓋層定位、鍵盤導覽、編輯、虛擬化、返回導覽、關閉及安全區域，都需要內部結構與狀態。把這些工作交給每個呼叫者並不會帶來彈性，只會重複脆弱的行為。

反過來說，Base 不得決定品牌顏色、字體排印、密度、最終圖示、組件變體、字串或應用程式的組合方式。請透過以下方式公開呈現：主要部件上的 `class` / `style`、其他每個部件的 `<part>Class` / `<part>Style`、具型別的狀態樣式（`active`、`hover`、`focus`、`selected`、`checked`、`disabled`）、具名的 slot（`trigger`、`header`、`footer`）以及渲染函式。不要檢查任意的子孫元素來找出標題、說明或關閉按鈕：請讓語義部件明確化，並把每個標籤都作為 prop 或子元素傳入。

<a id="theme-and-styling"></a>

## 主題與樣式

從主題讀取語義值，並在 Rust 中以具型別的樣式方法、在 TSX 中以 Tailwind class 套用版面配置（[Tailwind](./tailwind.md)、[主題 token](./tailwind.md#theme-tokens)）：

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

規則：

- 不要硬編碼產品顏色、圓角半徑、間距或控件幾何尺寸；
- 應用程式碼不得引入原始的十六進位值、`rgb` / `rgba` 或 `hsla` 值；請從 `theme()` 或 token class（`bg-primary`）讀取語義顏色，或將缺少的角色加入應用程式的主題檔；
- 應用程式的版面配置應使用間距與字級尺度（`p-2`、`gap-3`、`w-64`、`text-sm`；`.p_2()`、`.gap_3()`、`.w_64()`、`.text_sm()`），而非任意值（`p-[13px]`、`px(13.0)`）；
- class 的意義與 Tailwind CSS v4 完全一致，樣式值則依 [樣式參考](../modules/style-reference.md) 所給予的意義（即 CSS 的意義，以原生形式表示：數字的單位為 point）；`unknown class` 警告是必須修正的問題；
- 以語義 token 表達意義，而非調色板中的位置；
- 與狀態無關的幾何尺寸，請放在一般的 builder 鏈或 class 字串中；
- 執行期的互動狀態請使用 `active:`、`hover:` 及 `focus:`（`.active(..)`、`.hover(..)`、`.focus(..)`）；它們會在原生層直接套用，無須往返應用程式碼；
- 已勾選、已選取、已按下或已停用的外觀，請使用組件的語義狀態樣式（`selected:`、`checked:`、`disabled:`）；
- 以明確的狀態（`open` 搭配 `onOpenChange`）持有彈出層的擁有權，使其觸發元件在彈出層被關閉前都能呈現開啟或按下的外觀；
- 組件變體要少而有意義，不要為每個呼叫處各加一個變體；
- 主要樣式應綁定到決策區域真正的預設提交動作及其 return 鍵操作；不要由動作數量、使用頻率或工具列位置推導；
- badge 與 alert 的變體要保持語義化且克制。一般的中繼資料保持中性；不要僅因為存在某個變體，就把每個 enum 案例或區段對應到不同顏色。

有效的優先順序是：元素自身的樣式，其次是各狀態樣式（較後的狀態優先），而 `disabled` 凌駕於所有樣式之上。較後的層只會取代它所設定的欄位。

對於新的、由應用程式擁有的呈現，請優先使用主題的語義 token。應用程式主題檔中的每個名稱都是 token，就如同 Tailwind 的 `@theme` 變數一樣（`"up": "#16a34a"` 在 TSX 中會產生 `text-up`、`bg-up/30`、`token("up")`，在 Rust 中則產生 `theme().color("up")`），而主題有淺色與深色兩套值，因此 token 會跟隨外觀變化，無須 `dark:` class。請依角色而非組件為 token 命名，免得它們變成每個 widget 的擴充點。

請透過應用程式的主題檔（`nsh.json` `"theme"`）更改主題，或讓嵌入的應用程式提供自己的主題：引用 token 的 class 與讀取 `theme()` 的 Rust 綁定會在其變更時於原生層重新套用樣式，無須執行任何 JavaScript。把 token 的值複製到自己的 signal 中的程式碼，將不再跟隨它的變化。

向外的焦點環需要實際的空間。帶有 `overflow: hidden`（`overflow-hidden`）的祖先元素會將它裁切。請優先採用留有空間的版面配置；若產品必須大幅裁切，請改為在控件內部繪製焦點狀態，而不要悄悄地隱藏所有鍵盤焦點。

<a id="the-users-text-size-is-the-apps-zoom"></a>

### 使用者的文字大小就是應用程式的縮放

文字會跟隨使用者的文字大小（Dynamic Type、Android 的字型縮放，以及桌面平台的設定）：TSX 中為 `fontScale()`，Rust 中為 `font_scale()`，兩者皆具響應性。字級尺度（`text-sm`、`text-base`：16 point，即內文大小）設定基準，再由使用者的設定進行縮放。這刻意沿用了 Tailwind 模型中有用的部分：採用具名的字級、間距與尺寸級距，而不是互不相關的 point 常數。

讓文字容器隨其文字增長：請為它們設定最小高度與內距，而非固定高度。若自訂組件把會縮放的文字與周圍固定的幾何尺寸結合，必須記錄為何該部分不應增長。

應用程式 UI 中每個任意的 point 值與原始顏色建構式，都應視為審查發現。只有在以下情況才可接受：有文件說明的物理或平台邊界、實際量度所得的執行期幾何尺寸、點陣圖或資料顏色，或主題定義本身。方便省事與貼合截圖都不是有效的例外理由。

任何從已解析的版面配置快取的內容，其失效 key 都必須包含字型縮放比例，無論是直接包含，還是透過隨之改變的修訂版本：列表被告知的列高、文字量度、彈出層幾何尺寸、由文字推導的圖示大小，以及自訂 canvas 的度量。
<a id="events-commands-and-focus"></a>

## 事件、命令與焦點

啟動操作請使用按下（press）：`onPress`、`onLongPress`、`onPressDown` 和 `onPressUp` 無論透過手指、手寫筆、滑鼠或鍵盤，意思都相同。觸控處理器和手勢只用於跟隨手指的操作（平移、拖曳）。需要支援按鍵綁定、選單或多種輸入來源觸發的命令，請使用鍵盤快速鍵（`keymap.bind`、`on_key`）和選單項目。處理器應放在擁有該命令的頁面附近。

一個邏輯命令只建模一次。`Button`、`Menu` 項目、`ContextMenu` 項目、`nsh/desktop` 的應用程式選單項目和鍵盤快速鍵，應呼叫 store 中同一個函數，而不是複製五份變更邏輯。在可行的情況下，從同一份命令策略推導它們的標籤、圖示、快速鍵和停用狀態（`key_label("mod+s")` 會按平台慣例書寫快速鍵），這樣各個入口就不會互相矛盾。選單負責導覽和關閉；命令是否允許執行、執行什麼，仍由頁面決定。

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

選擇元素時要保留語意角色。命令請使用 `Button`，即使想要的呈現方式較低調，也應為它設定低調的樣式，而不是改用連結。NSH 應用程式將 `link` 角色保留給在應用程式之外開啟的目標，例如 URL 或電郵地址；應用程式內的目的地請使用導覽，命令則使用 `Button`。

只有在巢狀互動必須阻止父層處理同一個觸控時，才停止傳播（觸控事件上的 `stopPropagation()`）。一律停止傳播會破壞捲動、按下和手勢，而且很難診斷。

**主執行緒絕不等待應用程式程式碼。** 當系統需要即時答覆時（這個頁面可否彈出、這個 sheet 或 popover 可否關閉、這段文字可否更改），NSH 會根據事先掛載的 props 在原生端直接回答，之後再以事件通知應用程式。因此，決定是一個 prop，一知道就設定，而不是返回 true 或 false 的回呼：`popOnBack={!dirty()}` 配合 `onBackPress` 作確認（[popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)）、`closeOnEscape` 和 `closeOnBackdropPress` 配合 `onCancel` 以接收嘗試通知、輸入框上的 `maxLength`，以及按鈕上的 `disabled`。

選單項目的 `shortcut`（`nsh/desktop`）會在選單設定期間綁定其按鍵，選單也會以平台的風格顯示它；同一按鍵的 `keymap` 綁定優先於它。每個按鍵只應有一個擁有者；當選單項目或快速鍵變更時，請重新設定應用程式選單。

讓焦點的擁有權明確：

- `Button`、`Switch` 和選單項目是桌面平台和網頁上的鍵盤焦點停靠點；請在它們之上建構控件，而不是在裸 view 上建構；
- 在狀態變更後，從事件或 effect 中使用 ref 的 `focus()` 移動焦點，並以 `set_accessibility_focus()`（Rust）或 `nsh` 中的 `setAccessibilityFocus`（TSX）移動螢幕閱讀器的焦點；
- 呈現可見的 `focus:` 狀態；
- 不要在渲染期間無條件請求焦點。

複合型小工具應實作完整的導覽模型（方向鍵移動、適當時支援 Home / End 或翻頁移動、確認、取消和 Tab 行為），而不是只有幾個零散的快速鍵。

覆疊層由最上層開始關閉：Escape 和 Android 返回按鈕會交給正在監聽的最上層覆疊層（`onCancel`）。處理快速連續的關閉和開啟操作時，不要對中間那個已在關閉中的介面採取動作。

<a id="async-work-and-side-effects"></a>

## 非同步工作與副作用

非同步工作應從事件、effect 或 [`resource`](./reactivity.md#resource) 啟動，而不是作為元件主體中無條件的副作用。effect 只會追蹤它同步讀取的內容：先讀取 signals，再啟動工作。工作完成時，透過 signals 更新狀態，並接受元件可能已經不存在，同時將相關的變更一併寫入。

讓週期性工作歸屬於某個擁有者，使其消失時工作也隨之取消：Rust 的任務和計時器隨擁有者結束，TSX 的計時器則在 `cleanup` 中停止。必須獨立完成的一次性任務可以從 store 啟動，但這樣就放棄了取消能力。請明確處理錯誤和失敗的請求。

以明確的狀態表示非同步操作：resource 的 `state()` 為 `unresolved`、`pending`、`ready`、`refreshing` 或 `errored`。重新整理期間保留可用的舊資料：resource 在重新載入時會保留其值。防止重複提交具破壞性的操作，並在 UI 中呈現可恢復的錯誤；不要依賴日誌作為使用者回饋。

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

將耗費資源的解析或運算移出 TSX 處理器：移到 `computed`、移離互動路徑，或移到 Rust 中。結果可能在查詢、頁面或選取項目已變更之後才到達：resource 會捨棄已被取代的載入，而你自己的工作則應附上修訂版本或身分識別，並拒絕過時的結果，而不是將其套用到新狀態上。

<a id="layout-measurement-and-scrolling"></a>

## 版面配置、測量與捲動

view 以直欄排列其子項，而子項預設會橫向拉伸填滿；`class="flex"`（`.flex_row()`）是橫列，與 CSS 相同。一列控件通常希望子項置中（`items-center`），這樣寫就說明了意圖。由全高直欄組成的橫列則保留預設的拉伸，使直欄填滿橫列的高度，標題也保持在頂部：

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

大部分 UI 應使用版面配置，而不是自行測量（[版面配置](./layout.md)）。測量（`onLayout`、`measure()`）是進階的行為工具，適用於覆疊層、虛擬化、編輯器、圖表，以及其正確性取決於已解析幾何資訊的類似元件。

- 將測量和幾何邏輯放在擁有該行為的層級。
- 只有在一般版面配置無法表達該關係時，才觀察版面。
- 切勿在每個版面事件中寫入不相關的應用程式狀態。
- 將測量資料視為以修訂版本為範圍；文字大小、寬度、主題或內容變更後，它可能變得過時。
- 讓 `nsh/base` 的覆疊層放置彈出內容：其放置、翻轉和安全區域邊距都遵循同一套策略。

對於對齊的不變條件，寧可從結構上建立，也不要事後修正：相鄰區域應使用同一個間距 token 或共用的內縮值，而不是重複寫相同的字面值。對於關鍵的重複邊緣、欄和間隙，請在真實平台上加入幾何檢查或截圖（`nsh test --target`）。測試時不要只用預設視窗：較大的文字大小和顯示縮放，可能令小數座標產生一像素的偏移，即使預設截圖看起來是對齊的。

審查精確度時要測量已解析的結果，但不要將測量得出的修正編碼為任意數值。請追查不符的原因，看是重複的 padding、巢狀的內縮、邊框的擁有權、字型度量還是四捨五入所致，然後修正結構上的擁有者。

每個可捲動區域都必須有唯一的擁有者。避免在同一軸向上意外出現巢狀捲動。請將捲動視圖交給擁有整個頁面、面板或列表的元素，使其指示器相對於該區域的邊緣定位，並將內容的內縮放在其內部（`contentClass` / `contentStyle`），而不是將捲動視圖包在有 padding 的容器中。指示器若浮在內容與頁面邊界之間，通常表示捲動擁有者選錯了，或 padding 放在錯誤的層級。在 padding 和 margin 中使用 `env(safe-area-inset-*)` 和 `env(keyboard-inset-height)`（以其存取器讀取數值）來避開安全區域和鍵盤，它們會在原生端跟隨旋轉和鍵盤變化。

<a id="lists-tables-and-large-data"></a>

## 列表、表格與大量資料

當資料可能增長至超出小型且有界的集合時，請使用 [`List`](./lists.md)（Rust 中為 `virtual_list`）。將資料列的身分識別與可見位置分開，並避免在每次更新時複製整個資料集。讓列表負責回收、捲動協調和可見範圍，而資料列函數則負責資料列的呈現。

請分開處理：

- 來源資料和領域 id；
- 篩選和排序狀態；
- 選取狀態；
- 捲動狀態；
- 資料列渲染。

這可讓更新保持局部，並避免 view 樹變成資料模型。

虛擬化是行為上的約定，而不只是效能開關。資料列函數對每個儲存格只執行一次，而儲存格會被重用於其他資料列：

- **必須將每個項目的狀態保存在以 id 為鍵的資料中**，而不是保存在資料列函數內建立的 signal 中，因為該 signal 會隨儲存格移到下一個項目；
- **必須在使用處讀取項目**，也就是在綁定中讀取：在資料列函數頂部複製的值，屬於該儲存格最初顯示的那一列；
- 在 TSX 中以不可變方式更新（新陣列、未變更的項目重用、變更的項目使用新物件），並提供接近典型資料列大小的 `estimatedItemSize`；
- 捲動至某個項目（`scrollToIndex`）以資料座標運作，即使大部分資料列並不存在也一樣。

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## 公開 API 設計

對於可重用的元件：

- props 要建立有效的預設值：Rust 中使用 `#[prop(default)]` 或 `#[prop(default = …)]`，TSX 中則在讀取 prop 之處使用 `??`；
- 每個 prop、事件和匯出都要有文件註解；在 Rust 中，它會成為 TSX 所見的 TypeScript 宣告；
- 回呼描述所請求的變更，只在有意義時才包含指標詳情；
- 明確的部件（parts）、插槽和渲染函數，比檢查任意後代元素更可取；
- 加入可重用的行為時，不得強加產品層面的視覺選擇。

應用程式以簽署套件的形式交付給宿主應用程式，而且可能不會再重新建置：NSH 日後的每個版本都會按原樣執行它們。對於應用程式或元件庫向他人公開的內容（其元件的 props 和事件、其 crate 的匯出，以及宿主應用程式的原生元件和模組所接收的函數），也應遵守同樣的準則：

- 輸入只新增可選成員；型別只會放寬；預設值和行為維持不變（新行為須由使用者選擇啟用）；
- 參數可能增加的函數，應將其選項放在單一物件中（`scrollTo({ x, y, animated })`），絕不再新增位置參數；不會增加的參數，例如範圍的起點和終點，則維持為位置參數；
- 模式使用字串聯集型別（可以新增值），而不是日後需要第三種狀態的布林值；
- 一個值只有一種型別：`version: string`，絕不是 `string | number`；
- 函數返回的是物件（可以新增欄位），而不是元組或單一裸值；
- 返回 Promise 的函數以 reject 來回報所有失敗，而呼叫者可處理的失敗會帶有 `code`，與 NSH 自身的做法一致：呼叫者依據代碼分支處理，訊息則是給人閱讀的，可能會改變；
- 重新命名時，要將舊名稱保留為同一實作的 `@deprecated` 別名。

在 Rust 中，對於必須演進而不破壞呼叫者的行為狀態，預設使用私有欄位。公開欄位適用於刻意設計為記錄型的設定和序列化資料。每個帶有公開欄位的公開 struct 都必須標上 `#[non_exhaustive]` 並實作 `Default`，這樣呼叫者無需窮盡的 struct 字面值即可建立值，日後新增欄位也不會破壞他們的程式碼。

在重組內部結構時，請保持公開的匯入路徑穩定：crate 的 `#[native_module]` 識別字串及其匯出，以及 TSX 模組的匯出，都是其他程式碼所匯入的內容。請優先使用平台控件的術語和 NSH 既有的命名，而不是網頁框架的詞彙。
<a id="platform-and-capability-boundaries"></a>

## 平台與能力邊界

不要假設每個平台都支援相同的功能。標題列與視窗控制項、無障礙功能、剪貼簿、觸覺回饋、捲動物理效果、字型和時序都可能不同。同一個 bundle 可在所有平台運行（[Platform-specific code](./platform-specific.md)）；請把平台專屬程式碼放在 NSH 提供的位置，並定義後備行為：

- 元素在每個平台上的意義屬於頂層 prop；某個平台自身的系統功能則放進 `ios={{…}}`、`android={{…}}`、`desktop={{…}}` 或 `web={{…}}`（Rust 中為 builder 方法），在每個具備該功能的平台上各自提供，而且只會套用目前平台的物件；
- 行動平台的 API 來自 `nsh/mobile`，桌面平台的 API 來自 `nsh/desktop`；
- 各平台的樣式使用 `ios:`、`android:` 和 `web:` class。

即使呈現方式不同，平台分支也必須保持語意契約。例如，對話框在 iOS 上是 sheet，在桌面平台上則是覆蓋於視窗之上的圖層，但應用程式仍需要一致的開啟狀態。以 headless 方式測試共用行為，並用 `nsh test --target` 測試平台專屬的部分。對於 NSH 回報的值（`platform.os`、狀態、原因），每個分支判斷都要提供 `default`：日後的版本會新增平台和情況，而今天交付的應用程式也會在這些平台上運行（[Compatibility](./compatibility.md)）。

應用程式須在 `nsh.json` `"capabilities"` 中宣告它在 VM 之外存取的資源：所抓取資料的主機、web view 所顯示的頁面、剪貼簿、狀態列（[Sandbox and Capabilities](./sandbox-and-capabilities.md)）。會被交付到其他應用程式內的應用程式，應精確列出所用的資源，並以處理失敗請求的方式處理被拒絕的請求：宿主應用程式授予的權限可能少於應用程式所宣告的。被拒絕的呼叫會以 `code` `"ERR_ACCESS_DENIED"` 失敗，其 `permission` 指明是哪項能力，`resource` 指明所請求的內容。

<a id="file-and-naming-conventions"></a>

## 檔案與命名慣例

- 以產品概念為頁面和元件命名：`ProjectList`、`ProjectEditor`、`SettingsPage`。
- 以意圖為事件處理器命名：`confirmDelete`、`openProject`、`onQueryChange`。
- 每個模組只負責一項主要職責；當不閱讀無關行為就無法理解狀態擁有權或生命週期時，就拆分檔案。
- 若元件的模組、props、事件和針對性測試會一起變動，就把它們放在一起。
- 記錄不變式（invariant）和出人意料的生命週期限制；不要為顯而易見的 builder 呼叫撰寫說明。
- Rust 使用 `rustfmt` 並符合 Clippy 的要求，TSX 使用 `nsh check`。避免使用會掩蓋無關警告的寬泛 `allow` 屬性。

<a id="vocabulary-is-part-of-the-api"></a>

### 詞彙是 API 的一部分

同一個概念在不同元件之間要使用同一個詞。為 prop 或事件命名之前，先在 NSH 自身的 API 中尋找該術語，然後是 GPUI Kit 的 `gpui-base`、GPUI 和 `gpui-component`，最後才是各平台的控制項。基本元件所顯示的內容和全域 API 的名稱取自 HTML、DOM 和 CSS（`src`、`html`、`placeholder`）。Rust 的名稱是 `snake_case`，在 TSX 中轉換為 `camelCase`（`on_open_change` 變成 `onOpenChange`）；一個詞始終只用一種寫法（`readonly`、`multiline`）。

| 概念 | 命名模式 | 範例 |
| --- | --- | --- |
| 元件 | 名詞，`PascalCase` | `Button`、`Dialog`、`QuantityStepper` |
| 其 props 和事件（Rust） | `<Component>Props`、`<Component>Event` | `ButtonProps`、`ButtonEvent::Press` → `onPress` |
| 行為的狀態物件 | `<Control>State`，由 `create<Control>` 建立 | `NavStackState`、`createNavStack` |
| 值為何改變 | `<Control>ChangeReason`，字串聯合型別 | `DialogChangeReason`：`"cancel"`、`"backdropPress"` |
| 狀態 | 形容詞，使用正面詞義，不加 `is` 前綴 | `open`、`hidden`、`disabled`、`selected`、`checked`、`readonly` |
| 使用者可以做什麼 | 形容詞 | `scrollable`、`zoomable`、`selectable`、`resizable` |
| 沒有對應形容詞的功能 | `<feature>Enabled` | `pagingEnabled` |
| 某個部分是否顯示 | 以該部分命名的布林值，預設為 `true` | `scrollbar`、`caret`（`scrollbar={false}`） |
| 某個 slot 是否顯示 | `<slot>Visible`，預設為 `true` | `headerVisible`（`header` 是頁面的 slot） |
| 某個部分的樣式 | `<part>Class`、`<part>Style` | `backdropClass`、`contentStyle` |
| 某個狀態的樣式 | `<state>Style`、`<state>:` class | `activeStyle`、`disabled:` |
| slot | 它是什麼 | `header`、`footer`、`trigger`、`content`、`empty` |
| 應用程式的內容 | `render<Part>` | `renderCodeBlock` |
| 關閉旗標 | `closeOn<Trigger>`，預設為 `true` | `closeOnEscape`、`closeOnBackdropPress` |
| 值的變更 | `on<Value>Change({ <value>, ... })`，單一物件 | `onChange({ value })`、`onOpenChange({ open, reason })` |
| 任何其他事件 | `on<Event>`，現在式，單一物件 | `onPress()`、`onSubmit({ text })` |
| 階段 | `<act>Start`、`<act>End` | `onPanStart`、`onLoadStart` |
| 滑鼠經過某個 view | `Enter` / `Move` / `Leave`，沿用 DOM 的名稱 | `onMouseEnter`、`onMouseMove`、`onMouseLeave` |
| 開始監聽 | `on(event, listener)`，回傳 `() => void` | `host.on(name, l)`、`BackHandler.on("press", l)` |
| 環境的某個值 | 一個存取器，旁邊附上 `set<Value>` | `colorScheme()`、`setColorScheme` |
| 唯讀布林值 | `is<Adjective>`、`has<Noun>` | `isAvailable` |

Props 絕不使用 `is<Adjective>`：該形式只用於僅讀取布林值的對象（常數、payload 的欄位）。顯示中的部分以該部分命名，絕不使用 `<part>Shown`、`<part>Hidden` 或 `shows<Part>`。

Rust builder 接收並回傳 `Self`，以其設定的 prop 命名，不加 `set_`（`.disabled(..)`、`.checked(..)`、`.on_change(..)`）；就地修改則使用 `set_<field>`（`setRoutes`、`setColorScheme`）。布林值讀取方法是 `has<Noun>`（當值包含某些內容時），或 `is<Adjective>`（當它描述狀態或權限時）。只要動作有對應的形容詞，就優先使用形容詞：用 `isClosable` 而非 `canClose`，用 `isZoomable` 而非 `canZoom`。當動作是沒有形容詞形式的動詞短語時，則改為以它所需要的事物命名：用 `hasDefinition`，而非 `canGoToDefinition`。不要新增 `can` 讀取方法。

<a id="let-the-enclosing-name-carry-the-context"></a>

### 讓外層名稱承載上下文

名稱是在某個範圍之內被閱讀的：prop 在其元件之內，欄位在其型別之內。兩者都不應重複外層已有的內容（用 `contentStyle`，而非 `contentContainerStyle`；用 `Dialog` 的 `backdropClass`，而非 `dialogBackdropClass`）。同一型別的欄位應保持相同的縮寫程度。

<a id="use-precise-domain-words"></a>

### 使用精確的領域詞彙

- **selected** 表示成員資格或當前項目；**checked** 和 **pressed** 是核取方塊或切換開關的值；**focused** 是鍵盤的目標；**hovered** 是指標的存在。切勿互換使用。
- **open / close** 是覆蓋層的狀態；**show / hide** 是暫時性的請求；**expand / collapse** 針對結構。
- **disabled** 會阻止互動；**readonly** 允許選取和導覽但不允許編輯；**loading** 在操作進行期間防止重複工作。
- **press** 是任何輸入方式的啟動操作，NSH 的事件使用 press（`onPress`）；**click** 專指滑鼠。
- **index** 是位置；**id** 是身分識別。不要以 index 來持久化可重新排序的資料，也不要以它作為這類資料的 key。
- **value** 是受控的領域資料；**state** 是被保留的行為。
- **src** 是元素所顯示的資源（圖片、影片、頁面）；任何其他位址都是 **url**。
- **role** 表示某個選項的意義（`"cancel"`、`"destructive"`）；外觀則由應用程式決定。

當存在更精確的領域術語時，避免使用 `data`、`item2`、`handleAction`、`updateUi`、`process`、`manager` 或 `config` 這類含糊的名稱。

<a id="type-and-module-style"></a>

### 型別與模組風格

- Rust 型別使用 `UpperCamelCase`；模組、函式、方法、欄位和區域變數使用 `snake_case`；常數使用 `SCREAMING_SNAKE_CASE`。context 綁定命名為 `cx`。
- TSX 元件及其標籤使用 `PascalCase`；props、函式和區域變數使用 `camelCase`。基本元件來自 `nsh`，基礎元件來自 `nsh/base`。
- 以元件命名的模組擁有其公開接口；可將其狀態、各部分和測試拆分到不同檔案，但不得改變其他模組的匯入方式。
- 單一元件概念使用單數模組名稱，元件家族則使用既定的名稱（`menu` 對應 `Menu`、`MenuItem` 和 `Submenu`）。
- 識別符號加上 `Id` 後綴，集合則使用有意義的複數形式。在同一個子系統中，不要交替使用 `idx`、`index` 和 `ix`。
- 盡可能以正面詞義命名判斷式。一個正面的狀態比多個否定更易於組合，但在符合控制項語意的情況下，保留 `disabled` 這類既定術語。

<a id="callback-and-event-wording"></a>

### 回呼與事件措辭

- 每個事件都傳遞單一物件，即使只有一個欄位，值的變更也是如此，其欄位以所回報的 props 命名：`onChange({ value })`、`onOpenChange({ open, reason })`、`onLinkPress({ url })`。這樣之後新增欄位就屬於附加變更。API 的資料型別是一個欄位，絕不是 payload 本身（`onImagePress({ image })`）；沒有內容可回報的事件則不傳遞任何東西。
- 以動作命名，不要用過去式或請求語氣：`onPress`、`onClose`、`onCancel`、`onBackPress`。
- 當動作有既定名稱時，以意圖而非幾何位置命名：用 `onLoadMore`，而非「已到達末端」。
- 生命週期成對使用 `onOpen` / `onClose`；階段使用 `Start` / `End`，絕不使用 `Begin`；滑鼠經過某個 view 使用 `onMouseEnter` / `onMouseMove` / `onMouseLeave`（DOM 的名稱），檔案被拖曳到其上則使用 `Enter` / `Leave`。
- 記錄回呼是在元件自身狀態改變之前還是之後執行，以及它是否可以重入（re-enter）該元件。

<a id="documentation-and-copy-style"></a>

### 文件與文案風格

公開文件應以元件的功能和狀態由誰擁有作為開頭。範例必須使用目前的 API，並顯示穩定的 id。記錄預設值、平台差異、焦點行為、回呼順序，以及主執行緒以原生方式讀取哪些 props。

標籤、命令、確認對話框、大小寫和省略號，請遵循 Design Guides 的介面語言規則。每個領域物件、命令和狀態只使用一個標準術語。

翻譯鍵（translation key）描述的是穩定的意圖（`dialog.deleteProject.title`），而不是源語言的句子或畫面上的座標。切勿以翻譯後的片段拼湊句子，也不要因為不同的意思碰巧有相同的英文文字就共用同一個鍵。

本地化的是意圖，而不是語法。讓每個語言區域都能自行控制語序、複數處理、標點以及所需的上下文量。測試應能找出缺失的鍵和不一致的固定術語；至於重複是否因上下文而合理，仍由人工審閱決定。請在元件內以真實內容、文字膨脹和大字體尺寸驗證每個字串。

<a id="testing-strategy"></a>

## 測試策略

在能夠證明行為的最低層進行測試（[Testing](./testing-and-trace.md)）：

1. 針對狀態轉換、格式化、解析和排序的純測試（crate 函式的 `cargo test`，store 函式的測試檔案）；
2. 針對元件、事件和生命週期的 headless 應用程式測試：使用真實的引擎、渲染器、版面配置和列表，顯示幀率為 60 Hz，可在 `nsh test`（`nsh/test`）或 `cargo test`（`nsh_testing::Headless`）中進行；
3. 針對焦點、鍵盤、指標、版面配置和渲染狀態的互動測試，依照使用者的操作步驟（`press`、`type`、`scroll`、`drag`、`keyboard.press`），在 headless 環境和真實平台上進行（`nsh test --target macos`、`ios`、`android`、`web`……）；
4. 針對完整工作流程的範例或應用程式冒煙測試，以及用 `nsh test --trace` 量度一次互動的成本。

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

對於互動式元件，應涵蓋語意契約，而不是實作細節：以按壓和鍵盤啟動、受控的值變更、disabled 行為、焦點移動、事件數量與順序、穩定的身分識別，以及重要的空白狀態或失敗狀態。以 stub 取代網路（`network` 路由），並控制時間（手動時鐘），而不是等待真實的網路和時間。只要失敗可以被確定性地重現，就在修復 bug 之前先加入迴歸測試。

像使用者一樣尋找 view：依角色和名稱、標籤或文字（`role:button[Save]`、`label:Close`），在沒有其他東西可以命名它們時才使用穩定的 `testID`。選取器在每一步都會重新讀取，因此步驟絕不會對過時的快照進行操作。對於選取器無法表達的視覺事實，使用螢幕截圖（`app.screenshot`，在真實平台上）；只有作為後備時才使用座標。自動化與人工的證據應分開回報。

<a id="performance-rules"></a>

## 效能規則

- 不要在讀取某個狀態的綁定或 effect 中無條件寫入該狀態。
- 避免在綁定或列的函式內建立 signal、effect、按鍵綁定和開銷高昂的資料結構。
- 在綁定中讀取 signal，這樣一次連貫的變更只會更新樹中最窄的部分。
- 對於很長的集合，使用 `List`，並且只渲染可見範圍。
- 避免僅為了滿足閉包而複製大型字串或集合；改為捕獲 `Copy` 控制代碼或共用資料（`SharedString`、`Rc`）。
- 保持 TSX 處理器和計算值輕量；把繁重的工作移出互動路徑，或移到 Rust 中。
- 在加入快取之前，先用 `nsh test --trace` 量度。快取必須有明確負責失效處理的擁有者。
- 讓動畫工作保持有界：動畫值放在 UI 執行緒，而不是每一幀都寫入 signal；使用 `scrollValue` 而非捲動監聽器（[Animation](./animation.md)）；並遵守減少動態的設定（`reduceMotion()`）。
<a id="common-failure-modes"></a>

## 常見失敗模式

避免以下做法:

- 一個 signal 包含應用程式中互不相關的狀態;
- 將業務邏輯和網絡請求嵌入冗長的元件主體;
- 對可重新排序的內容使用隨機或以索引為基礎的 key;
- 在 `List` 的列內建立 signal 來保存每列的狀態;
- 在元件主體中讀取 prop 或 signal,並期望它會更新;
- 使用字面的顏色和圓角值,導致自訂主題和深色模式失效;
- 在已有語義化元件提供焦點、鍵盤、停用和無障礙行為的情況下,仍使用自訂的可按壓視圖;
- 重複的本地狀態與受控值產生偏差;
- 將一個 signal 複製到另一個 signal 的 effect,以及透過 binding 形成循環的寫入;
- 系統需要即時作出的決定,卻交給回呼處理,而不是事先設定好 prop;
- 沒有明確擁有者的巢狀捲動視圖;
- 為單一畫面而新增元件變體;
- 對可還原、低風險的操作使用確認對話框;
- 測試只呼叫內部函式,卻從不按壓、輸入或捲動。

<a id="rules-for-coding-agents"></a>

## 給編碼代理的規則

在編輯之前,代理必須閱讀最接近的實作、其測試、模組的公開匯出,以及相關的參考頁面。代理必須搜尋目前的原始碼和 `.nsh/types` 以查找簽名,而不是依類比方式轉譯 React、React Native、CSS 或 GPUI 的範例:NSH 元件只會執行一次,而 binding 會追蹤它們所讀取的 signal。

對於每項變更,代理應能說出:

1. 行為擁有者和呈現擁有者;
2. 保留的身份識別和狀態生命週期;
3. 按壓、鍵盤、焦點和無障礙的約定;
4. 版面配置和捲動的擁有者;
5. 主題 token 和有意為之的例外;
6. 若行為出現退化便會失敗的測試。

產生的程式碼必須由人員審閱和測試。「能編譯」不是 UI 品質的標準,而僅僅為了讓產生的程式碼看起來整潔而進行大範圍重構,也不能取代與應用程式架構保持一致。

<a id="implementation-checklist"></a>

## 實作檢查清單

在提交變更以供審閱之前,請確認:

- 狀態和副作用的擁有者明確;
- 已審慎選擇使用普通函式還是元件,而且 prop 和 signal 都在使用處讀取;
- 重複的元素具有穩定且以領域為基礎的 key 和 test id;
- 以主題 token 和 Tailwind 刻度取代零散的視覺字面值;
- 按壓、鍵盤快捷鍵、焦點、停用狀態和覆蓋層可以協同運作;
- 系統需要即時作出的決定,均為事先設定的 prop;
- 已涵蓋載入中、空白、錯誤和取消的路徑;
- 長資料集使用 `List`,並將每個項目的狀態保存在資料中;
- 公開 API 的新增只作擴充,並保持依賴方向和封裝;
- 測試在適當的層級驗證行為,包括無頭模式以及變更所涉及的平台;
- 格式化、Clippy、`nsh check`、針對性的測試和相關範例均已通過。

有關應用程式設定,請參閱[入門指南](./getting-started.md);有關目前的 API 詳情,請參閱 [Elements](../elements/index.md) 和 [API](../modules/index.md) 參考。
