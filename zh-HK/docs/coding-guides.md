---
title: "程式開發指南"
description: "以 Rust 與 TSX 打造可維護的 Native Shell 應用程式與元件庫所需的架構與程式碼慣例。"
order: 29.5
group: ui
---

# 程式碼撰寫指南

本指南說明在 Native Shell 應用程式中,經實證可長期維持的應用程式架構與程式碼模式。本指南同時寫給工程師與 coding agent:NSH 應用程式的開發者(TSX 模組、Rust 元件、嵌入 NSH 的原生應用程式),以及建構於 `nsh/base` 之上的元件庫作者。請先閱讀設計指南:程式碼結構應保留產品意圖,而非取代它。

本指南為規範性文件。**必須(Must)** 標示生命週期、正確性或生態系的限制;**應該(should)** 是預設架構,若要偏離,需有具體理由。確切的簽章仍以目前的原始碼、參考頁面與 `.nsh/types` 中的宣告為準。

<a id="make-the-common-path-inexpensive"></a>

## 讓常見路徑成本低廉

**設計原則:選擇框架型別與所有權方式,讓一般的元件使用預設就成本低廉。** 開發者應能建構並重複使用 UI,而不必在每個呼叫處都加上快取。只執行一次的元件,以及在使用處才讀取的 [signal](./reactivity.md),就是例子:元件只建構一次它負責的那部分樹,之後只有讀取了已變更 signal 的綁定會重新執行,因此常見路徑避免了重複的工作。響應式圖、渲染器、版面配置與列表都是原生的,應用程式程式碼的一次執行會變成一批原生操作。小成本仍會隨元素與更新次數累積,在 TSX 中尤其如此,因為其程式碼是在直譯器中執行;在加入快取之前,請先量測特殊的熱點路徑([效能](./performance.md))。兩種選擇都不保證零成本。[狀態所有權規則](#state-ownership)與後續的渲染章節會說明其機制。

<a id="architecture-at-a-glance"></a>

## 架構總覽

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

依賴關係向下指。較高的層負責領域語意與協調;較低的層負責可重複使用的呈現或行為。不要讓可重複使用的元件依賴某個應用程式頁面,也不要讓元件庫依賴單一應用程式的主題([三個層次](./architecture.md#three-layers))。

請使用以下邊界:

- **app shell:** 入口(`App.tsx`,或 `nsh.json` `"root"`)負責組合根節點與導覽堆疊,同時不放入頁面邏輯;
- **page:** 一個 `NavPage`,包含其內容、其對話框,以及它啟動的工作;
- **app component:** 重複出現、具領域意識的模式;
- **component library:** 具樣式的通用 UI,可以是應用程式自己的或社群的,建構於 `nsh/base` 之上;
- **`nsh/base`:** 不含產品呈現的可重用行為:導覽、對話框、彈出層、選單、sheet、按壓目標;
- **`nsh`:** 基本元件、樣式、版面配置、響應式與環境。

<a id="lay-out-an-apps-files"></a>

### 配置應用程式的檔案

應用程式的檔案遵循 NSH 的慣例,因此無需任何設定:`App.tsx` 是入口,`nsh.json` 與它並列,兩者都依慣例被找到。

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

- `pages/` 為每個 `NavPage` 放一個檔案。頁面只有在需要時才會成長為多個檔案。
- `components/` 放置應用程式中可重複使用、由多個頁面共用的元件。
- `store.ts` 放置應用程式的狀態:它的 signal,以及變更這些 signal 的函式。頁面讀取 signal 並呼叫這些函式。
- 測試是與被測對象並列的 `*.test.tsx` 檔案(`App.test.tsx`、`pages/Inbox.test.tsx`)。
- `Cargo.toml` 與 `src/lib.rs` 是應用程式自己的 crate,內含其 Rust 元件(`nsh.json` `"rust": "."`);其位於 `src/lib.rs` 的 `#[native_module]` 指定了 TSX 要匯入的內容。純 Rust 撰寫的應用程式是同一種 Cargo 專案,其根元件位於 `src/lib.rs`([專案結構](./project-structure.md))。

app shell 負責組合頁面,但幾乎不含頁面邏輯。頁面讀取 store 的 signal 並呼叫其函式;頁面絕不寫入其他頁面的狀態。請將 store 的 signal 保持為私有,只匯出用來讀取與變更它們的內容,讓可變狀態留在其公開函式之後:

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

頁面可以持有 workspace 並將其 id 傳給搜尋;搜尋不需要 workspace 的整個集合或其私有 signal。一個簡單的無環依賴形態如下:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

頁面可以依賴 store 與元件,但不可依賴 shell,也不可依賴其他頁面的私有部分。若某個頁面必須改變另一個頁面所顯示的內容,請透過 store 進行。這些邊界讓不同的工程師或 AI agent 能平行處理各自的頁面,減少檔案衝突與共享狀態的耦合;不過 store 仍需要協調。

<a id="bootstrap-and-root-ownership"></a>

## 啟動與根節點所有權

應用程式只掛載一次,並將整個表面交給根節點:TSX 入口呼叫 `mount(App)`,Rust 應用程式則在 `nsh.json`(`"root": "App"`)中指定其根元件。根節點以 `flex: 1` 以及來自主題的背景填滿整個表面:

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

根節點負責協調屬於整個表面的事物:導覽堆疊、顯示在其上方的對話框、彈出層、選單、sheet 與工具提示,以及安全區域。不要在同一個表面內為每個頁面各掛載第二個根節點。一個表面就是一個引擎:原生應用程式嵌入的每個 `NshAppView`、`NshView` 或 `AppView` 都會執行自己的 VM、自己的模組狀態與自己的響應式圖,因此同一個宿主應用程式中的多個表面不會意外共享狀態。

<a id="understand-what-runs-once-and-what-runs-again"></a>

## 了解哪些只執行一次、哪些會再次執行

NSH 採用保留狀態搭配宣告式建構,基於 Solid 的模型([響應式](./reactivity.md))。signal 會在更新之間持續存在;元件主體在建立時只描述一次它負責的那部分樹。請明確維持這個區別:

| 你寫的內容 | 執行時機 | 再次執行的條件 |
| --- | --- | --- |
| 元件主體 | 建立時執行一次 | 永不 |
| 綁定:放在值的位置、呼叫或讀取屬性的閉包(Rust)或運算式(TSX) | 一次 | 它所讀取的 signal 變更時;只更新該 prop 或子節點 |
| `computed(fn)` | 建立時 | 它所讀取的 signal 變更時 |
| `effect(fn)` | 該次傳遞的元素都存在之後 | 它所讀取的 signal 變更時 |
| `each` / `<Each>` 的一列 | 其 key 首次出現時 | 永不;只有其 item 與 index signal 會變更 |
| `virtual_list` / `<List>` 的一個儲存格 | 每個儲存格一次 | 永不;儲存格會被指派到其他列 |

- 正在執行的元件就是 **owner**:在其執行期間建立的 effect、計算值、任務、計時器、按鍵綁定與清理函式都屬於它,並隨它一起被釋放;
- **context**(`provide_context` / `use_context`、`context()` 與 `<Ctx.Provider>`)讓子樹取得一個值,但不代表讀取它的元素擁有它;
- Rust 元件的 **`Scope`**(`cx`)負責發出其事件,並讀取給予它的 inset;
- **ref**(`element_ref()`、`ref`)用來為宿主元素命名,以進行命令式呼叫(`focus()`、`scroll_to()`、`measure()`);
- 版面配置與量測屬於較後面的原生階段;只有在確實需要已解析的幾何資訊時,才使用 `onLayout` 與 `measure()`。

絕不要在事件處理函式或計時器中讀取 context,因為那裡沒有可供查找的元件:請在主體中讀取,並保留取得的內容。請保留具型別的 handle(signal、resource、ref、領域 id),它們在 Rust 中是 `Copy`,且在其 owner 消失後便不再有作用。

<a id="choose-the-right-unit"></a>

## 選擇正確的單位

<a id="use-a-plain-function-for-value-like-elements"></a>

### 以純函式處理類似值的元素

**輕量、可重複使用的 UI 片段,預設使用純函式。** 呼叫端提供目前的 props 與處理函式,函式回傳元素,除了它所建立的綁定之外,什麼都不會留下。它的參數就是它的 props;顯示的標籤、值與回呼都來自呼叫端目前的狀態。它和任何元件一樣只會執行一次:之後改變的是它的綁定。

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

### 以元件處理保留的行為

當一段 UI 擁有持久狀態或獨立的生命週期(signal、effect、非同步工作、計時器、按鍵綁定)時,請使用 `#[component]`(或建立 signal 的 TSX 元件)。請在元件主體中一次性建立該狀態,絕不要在綁定內建立。

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

`#[component]` 具有型別化的 props(`#[derive(Props)]`)與事件(`#[derive(Event)]`);TSX 以由它們產生的宣告來匯入。TSX 搭配 `new` 使用的保留狀態(帳本、解析器、工作階段)是一個 `#[class]`,而函式則是一個 `#[module]`([以 Rust 建構](./rust.md#extending-a-rust-app-with-tsx))。應用程式最常用的部分、元件庫與要求嚴苛的邏輯請以 Rust 撰寫,它從頭到尾都是原生程式碼;TSX 則用於經常變動或在執行期交付的內容。

不要把每個視覺片段都變成元件。元件邊界帶有生命週期與協調的成本;請在保留身分確實重要的地方使用它們。

<a id="elements-views-and-behavior-systems-are-different"></a>

### 元素、view 與行為系統各不相同

不要強迫每個元件都套用同一個範本。生態系中包含:

- 語意元素,例如 `Button`、`Switch` 與 `MenuItem`;
- 複合行為根節點,例如 `Dialog`、`Popover`、`Menu`、`ContextMenu`、`Sheet` 與 `NavStack`;
- 具狀態的系統,例如 `Input`、`List`、`TextView` 以及導覽堆疊的狀態;
- 基礎設施,例如覆蓋層及其定位、虛擬化、捲動、安全區域、鍵盤與動畫。

一個元素在內部可以很複雜,但對呼叫端而言仍然像一個值。具狀態的系統可以公開 render 函式,讓應用程式掌控呈現,而不必重新實作行為。請依行為來選擇公開的接縫,而不是依其輸出中出現多少個 view。

<a id="state-ownership"></a>

## 狀態所有權

<a id="own-persistent-ui-text-with-103"></a>

### 以 `SharedString` 持有持久的 UI 文字

**在 Rust 中,對於跨更新或跨回呼閉包而保留的 UI 文字,必須優先使用 `SharedString`**,包括元件的標籤、標題與預留位置文字:props 接受它(`Prop<SharedString>`),而將它複製進綁定並不會複製文字本身。對於可變的編輯緩衝區,或需要邊格式化邊組裝的文字,請使用 `String`,並在結果就緒時再轉換;對於單次呼叫中暫時的唯讀存取,請使用 `&str`。在 TSX 中,字串是應用程式自己的值;由狀態計算而來的文字,請放在 `computed` 或閉包中,而不要在多處重新建構。

對於 UI 將保留的不可變回應文字,請保持收到的值原封不動,並將衍生或格式化後的呈現文字放在另一個領域值中,而不是改寫回應本身。

將每個狀態放在能維持其正確性的最窄 owner 中:

- 領域狀態屬於 store(`store.ts`)或應用程式的 crate;
- 暫時性的 view 狀態屬於渲染它的元件,以 signal 表示;
- 可重用的行為狀態屬於為此設計的元件(沒有 `open` 的 `Menu` 或 `Popover` 會自行保管);
- 子樹共享的狀態是透過 [context](./reactivity.md#context) 提供的 signal;
- 超出一次執行生命週期的內容,屬於 [儲存空間](../modules/nsh.md#storage) 或伺服器。

對於一般的選取與切換,請優先使用受控值:將目前的值傳入元件,接收請求的變更,更新 owner,綁定隨之更新。回呼回報的是意圖;它不應建立第二個隱藏的真實來源。

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

無需通知任何對象:寫入 signal 就會精確更新讀取它的綁定。Rust 元件發出語意事件,其 owner 應以 `cx.emit(..)` 處理;effect 會在其 owner 存活期間追蹤某個 signal。若有數個欄位構成同一個不變式,請在同一個 [`batch`](./reactivity.md#batch) 中寫入,讓 effect 與計算值同時看到它們。

應用程式自己的受控元件遵循相同的契約。數量步進器是一個領域控制項,以 Rust 寫一次,並可從 Rust 與 TSX 放置:

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

TSX 中相同的契約,是位於 `components/` 的元件:

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

元件擁有它所建立的一切，這些東西會隨元件一起消失：當它的 `<If>` 分支隱藏、它所在的列被移除，或它的頁面被彈出時。在 Rust 中，任務、計時器與間隔（`spawn`、`set_timeout`、`set_interval`）以及按鍵綁定（`on_key`）會隨著建立它們時所屬的擁有者一同結束；在 TSX 中，請將停止函式註冊到 [`cleanup`](./reactivity.md#cleanup)，或從 effect 中回傳。監聽是 `on(event, listener)`（`host.on(name, listener)`、`BackHandler.on("press", listener)`），它會回傳一個用來停止監聽的函式（`() => void`，在 Rust 中則是 `Stop`），而在元件渲染期間註冊的內容會隨元件一起消失，就像 `keymap.bind` 的綁定一樣。

當某些工作意外地持續執行時，請先檢查以下幾處：在元件之外建立的 effect 與 computed 值（在事件處理器或計時器回呼中建立的它們沒有擁有者，會永遠存活）、註冊時沒有保留停止函式的監聽器，以及由沒有任何元件擁有的 store 所啟動的工作。被丟棄的 `resource` 載入會被中止（在 TSX 中為 `info.signal`），它不會讓所屬元件保持存活。這些是常見的起點，而非完整清單。

不要僅僅因為讀取或衍生了某個值就寫入 signal。避免在 binding 或讀取同一個 signal 的 effect 中進行無條件寫入：它會不斷重新執行自己，直到 NSH 以錯誤將其停止。由其他狀態計算得出的值應該是 `computed`，而不是寫入第二個 signal 的 effect。

<a id="avoid-state-feedback-loops"></a>

### 避免狀態回饋迴圈

文字輸入、選取、篩選器與受控的彈出視窗通常有兩條路徑：外部擁有者更新值，而使用者互動則請求新的值。在同步期間，不要把擁有者提供的值再經由使用者回呼送回去。處理使用者操作時，以非追蹤方式讀取擁有者目前的值（在 Rust 中使用 `props.value.get_untracked()`，如上所述；TSX 的事件處理器本身就是非追蹤的），並與下一個值比較，這樣每個邏輯上的變更只會被回報一次。當回呼可能同步地關閉、替換或更新呼叫它的元件時，請確保回呼是可重入安全的。

<a id="stable-identity"></a>

## 穩定的識別

key 是行為的一部分。它為列、頁面或重複的控制項提供穩定的識別，並決定資料變更時由哪一個保留其狀態、焦點與量測結果。

- 為列、分頁、頁面與重複的控制項使用穩定的領域 id：`each(projects, |p| p.id, ..)`、
  `<Each of={projects()} key={(p) => p.id}>`、清單的 `keyExtractor`。
- 當同一個控制項重複出現時，請以其所屬物件為測試 id 加上命名空間（`delete-${project.id}`）。
- 當項目可能被插入或重新排序時，絕不要從翻譯後的標籤或可變的清單索引推導識別。
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

key 改變就代表 UI 識別改變。請將這種重設視為刻意的行為。

同樣的規則適用於導覽路由、清單 key、儲存 key 與測試 id。留在 `setRoutes` 中的路由會保留其頁面與狀態；如果兩個各自獨立保留的行為共用同一個 key，它們可能會互相覆寫對方的狀態；如果某個行為在每次更新時都更換 key，它就永遠無法累積狀態。

<a id="rendering-and-composition"></a>

## 渲染與組合

讓元件本體保持宣告式：讀取目前狀態、推導呈現值，並組合元素。將領域操作、解析與非單純的變更移到 store 或應用程式 crate 中具名的函式。

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

當某個輔助函式能為一個有意義的區域命名，並減少讀者需要同時掌握的狀態量時，就抽出它。當該區域擁有自己可重用的契約或需保留的生命週期時，才抽出新的元件，而不是僅僅因為 builder 鏈或 JSX 區塊很長。

在 Rust 中一致地使用型別化的樣式方法與元件的 builder，在 TSX 中則使用 class。對於小幅的條件式調整，請優先使用 `.when(..)` / `.when_some(..)`（Rust）與 `classList`（TSX）；當各分支代表截然不同的介面時，請使用 `when` / `<If>`，因為閉包中的三元運算式會在其讀取的任何內容變更時重新建立其分支。

在建立自訂介面之前，先以標準的語意元件進行組合。不要僅僅為了符合某張截圖，就用通用的 view 重新製作選單、popover、sheet 或對話框：來自 `nsh/base` 的 `Menu`、`ContextMenu`、`Popover`、`Sheet`、`Tooltip` 與 `Dialog` 保留了定位、焦點轉移、鍵盤導覽、選取、停用狀態、以 Escape 與返回來關閉，以及無障礙契約。如果標準元件無法表達某個經常出現且合理的模式，請改進它的明確 API，而不是在每個呼叫處為任意的後代元素設定樣式。

由應用程式程式碼提供的渲染函式應該沒有副作用。清單的列、`TextView` 的 `renderCodeBlock` 或選單的項目，可能在其擁有者需要儲存格、部件或開啟時就被執行。它們不得執行業務操作、附加資料或啟動沒有界限的訂閱。

<a id="behavior-and-presentation-boundary"></a>

## 行為與呈現的邊界

持久的 Base 規則是：

> Base 擁有可重用的行為，以及實作該行為所需的結構。呈現層擁有產品的視覺語言。

「無樣式」並不代表「一個空的 view」。覆蓋層的定位、鍵盤導覽、編輯、虛擬化、返回導覽、關閉與安全區域都需要內部結構與狀態。把這些工作移給每個呼叫者並不會帶來彈性，只會重複實作脆弱的行為。

反過來說，Base 不得選擇品牌色彩、字體排印、密度、最終圖示、元件變體、字串或應用程式的組合方式。請透過下列方式公開呈現：主要部件上的 `class` / `style`、其他每個部件的 `<part>Class` / `<part>Style`、型別化的狀態樣式（`active`、`hover`、`focus`、`selected`、`checked`、`disabled`）、具名的 slot（`trigger`、`header`、`footer`）以及渲染函式。不要檢視任意的後代元素來探索標題、描述或關閉按鈕：請明確定義語意部件，並讓每個標籤都以 prop 或子項的形式傳入。

<a id="theme-and-styling"></a>

## 主題與樣式

從主題讀取語意值，並在 Rust 中以型別化的樣式方法、在 TSX 中以 Tailwind class 套用版面配置（[Tailwind](./tailwind.md)、[主題 token](./tailwind.md#theme-tokens)）：

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

- 不要寫死產品色彩、圓角半徑、間距或控制項的幾何尺寸；
- 應用程式程式碼不得引入原始的十六進位值、`rgb` / `rgba` 或 `hsla` 值；請從 `theme()` 或 token class（`bg-primary`）讀取語意色彩，或在應用程式的主題檔中補上缺少的角色；
- 應用程式版面應使用間距與字級尺度（`p-2`、`gap-3`、`w-64`、`text-sm`；`.p_2()`、`.gap_3()`、`.w_64()`、`.text_sm()`），而不是任意值（`p-[13px]`、`px(13.0)`）；
- class 的意義與 Tailwind CSS v4 中完全相同，樣式值則與[樣式參考](../modules/style-reference.md)所給定的相同（CSS 的值，以原生形式表示：數字的單位是 point）；`unknown class` 警告就是必須修正的問題；
- 使用語意 token 來表達意義，而不是調色盤中的位置；
- 與狀態無關的幾何尺寸，請放在一般的 builder 鏈或 class 字串中；
- 對於執行期的互動狀態，請使用 `active:`、`hover:` 與 `focus:`（`.active(..)`、`.hover(..)`、`.focus(..)`）；它們會以原生方式套用，不需要與應用程式程式碼往返；
- 對於已勾選、已選取、已按下或已停用的外觀，請使用元件的語意狀態樣式（`selected:`、`checked:`、`disabled:`）；
- 以明確的狀態（`open` 搭配 `onOpenChange`）保管彈出視窗的擁有權，讓它的觸發器在視窗被關閉之前都能呈現開啟或按下的外觀；
- 讓元件變體保持少量且有意義，而不是為每個呼叫處都新增一個變體；
- 主要樣式應繫結到決策區域真正的預設提交動作及其 return 鍵動作；不要從動作數量、使用頻率或工具列位置推導；
- 讓 badge 與 alert 的變體保持語意化且節制使用。一般的中繼資料維持中性；不要僅僅因為存在某個變體，就把每個列舉案例或區段對應到不同的顏色。

實際的優先順序是：元素自身的樣式，然後是各狀態樣式（後面的狀態優先），而 `disabled` 凌駕於所有之上。較後面的層級只會取代它所設定的欄位。

對於新的、由應用程式擁有的呈現，請優先使用主題的語意 token。應用程式主題檔中的每個名稱都是一個 token，就像 Tailwind 的 `@theme` 變數一樣（`"up": "#16a34a"` 在 TSX 中會產生 `text-up`、`bg-up/30`、`token("up")`，在 Rust 中則產生 `theme().color("up")`），而且主題具有淺色與深色的值，因此 token 會跟隨外觀變化，不需要 `dark:` class。請依角色而非元件來命名 token，這樣它們才不會變成每個小工具的擴充點。

請透過應用程式的主題檔（`nsh.json` `"theme"`）變更主題，或讓嵌入的應用程式提供自己的主題：只要主題改變，引用 token 的 class 與讀取 `theme()` 的 Rust 綁定就會以原生方式重新套用樣式，而不需要執行任何 JavaScript。把 token 的值複製到自己的 signal 中的程式碼，將不再跟隨它的變化。

向外的焦點環需要實際的空間。帶有 `overflow: hidden`（`overflow-hidden`）的祖先元素會將它裁切掉。請優先採用留有空間的版面；如果產品必須大量裁切，請在控制項內部繪製焦點狀態，而不要悄悄地隱藏所有鍵盤焦點。

<a id="the-users-text-size-is-the-apps-zoom"></a>

### 使用者的文字大小就是應用程式的縮放

文字會跟隨使用者的文字大小（Dynamic Type、Android 的字型縮放比例、桌面系統的設定）：在 TSX 中為 `fontScale()`，在 Rust 中為 `font_scale()`，兩者皆為響應式。字級尺度（`text-sm`、`text-base`：16 point，即內文大小）設定基準，而使用者的設定會對其進行縮放。這刻意沿用了 Tailwind 模型中實用的部分：使用具名的字級、間距與尺寸階層，而不是互不相關的 point 常數。

讓文字容器隨其文字成長：請給它們最小高度與內距，而不是固定高度。若自訂元件將縮放後的文字與周圍固定的幾何尺寸結合在一起，必須說明為何該部分不應成長。

將應用程式 UI 中每一個任意的 point 值與原始色彩建構式都視為審查時的發現。只有在以下情況才可接受：有文件說明的實體或平台邊界、量測得到的執行期幾何尺寸、點陣圖或資料色彩，或主題定義本身。方便或為了符合截圖，都不是有效的例外理由。

任何由已解析版面快取而來的內容，其失效 key 都必須包含字型縮放比例，無論是直接包含，還是透過隨之變化的修訂版本：包括清單被告知的列高、文字量測、彈出視窗的幾何尺寸、由文字推導出的圖示大小，以及自訂 canvas 的度量。
<a id="events-commands-and-focus"></a>

## 事件、命令與焦點

啟用操作請使用 press：`onPress`、`onLongPress`、`onPressDown` 與 `onPressUp` 在手指、觸控筆、滑鼠或鍵盤上的意義相同。觸控處理器與手勢只用於跟隨手指的操作（平移、拖曳）。需要支援按鍵綁定、選單，或從多種輸入來源分派的命令，請使用鍵盤快速鍵（`keymap.bind`、`on_key`）與選單項目。處理器應放在擁有該命令的頁面附近。

一個邏輯命令只建模一次。`Button`、`Menu` 項目、`ContextMenu` 項目、`nsh/desktop` 的應用程式選單項目與鍵盤快速鍵，應呼叫 store 中的同一個函式，而不是複製五份變更邏輯。在可行的情況下，從同一份命令原則推導它們的標籤、圖示、快速鍵與停用狀態（`key_label("mod+s")` 會依平台慣例書寫快速鍵），使各個進入點不會彼此矛盾。選單負責導覽與關閉；頁面仍負責決定命令是否允許執行，以及執行什麼。

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

選擇元素時要保留語意角色。命令請使用 `Button`，即使想要的呈現方式很低調也一樣；請為它設定低調的樣式，而不是改用連結。NSH 應用程式將 `link` 角色保留給在應用程式之外開啟的目標，例如 URL 或電子郵件地址；應用程式內的目的地請使用導覽，命令請使用 `Button`。

只有在巢狀互動必須阻止父層處理同一個觸控時，才停止傳遞（對觸控事件使用 `stopPropagation()`）。全面停止傳遞會破壞捲動、press 與手勢，而且問題很難診斷。

**主執行緒絕不等待應用程式程式碼。** 當系統需要立即得到答案時（這個頁面可以 pop 嗎、這個 sheet 或 popover 可以關閉嗎、這段文字可以變更嗎），NSH 會根據事先掛載的 prop 在原生端回答，之後再以事件通知應用程式。因此，決定是一個 prop，在得知結果時立即設定，而不是回傳 true 或 false 的回呼：`popOnBack={!dirty()}` 搭配 `onBackPress` 用於確認（[popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)）、`closeOnEscape` 與 `closeOnBackdropPress` 搭配 `onCancel` 用於接收嘗試通知、輸入元件上的 `maxLength`，以及按鈕上的 `disabled`。

選單項目的 `shortcut`（`nsh/desktop`）會在選單設定期間綁定其按鍵，且選單會以平台的樣式顯示它；相同按鍵組合的 `keymap` 綁定優先於它。每個按鍵組合只能有一個擁有者；當選單項目或快速鍵變更時，請重新設定應用程式選單。

讓焦點的擁有者明確：

- `Button`、`Switch` 與選單項目是桌面平台與網頁上的鍵盤焦點停駐點；請以它們建構控制項，而不是以單純的 view；
- 從狀態變更之後的事件或 effect 中，以 ref 的 `focus()` 移動焦點，並以 `set_accessibility_focus()`（Rust）或 `nsh`（TSX）中的 `setAccessibilityFocus` 移動螢幕閱讀器的焦點；
- 呈現明確可見的 `focus:` 狀態；
- 不要在 render 期間無條件請求焦點。

複合元件應實作完整的導覽模型（方向鍵移動、適當時的 Home / End 或分頁移動、確認、取消與 Tab 行為），而不是只提供幾個零散的快速鍵。

浮層由最上層開始關閉：Escape 與 Android 返回鈕會傳給正在監聽的最上層浮層（`onCancel`）。處理快速連續的關閉與開啟時，不要對已在關閉中的中間狀態表面採取動作。

<a id="async-work-and-side-effects"></a>

## 非同步工作與副作用

非同步工作應從事件、effect 或 [`resource`](./reactivity.md#resource) 啟動，而不是作為元件主體中無條件執行的副作用。effect 只追蹤它同步讀取的內容：先讀取 signal，再啟動工作。工作完成時，透過 signal 更新狀態，並接受元件可能已經不存在，同時將相關的變更一併寫入。

讓重複性的工作隸屬於某個擁有者，使其消失時工作也隨之取消：Rust 的 task 與計時器會隨其擁有者結束，TSX 計時器則在 `cleanup` 中停止。必須獨立完成的一次性 task 可以從 store 啟動，但這樣就放棄了該取消機制。請明確處理錯誤與失敗的請求。

以明確的狀態表示非同步操作：resource 的 `state()` 為 `unresolved`、`pending`、`ready`、`refreshing` 或 `errored`。重新整理期間請保留可用的先前資料：resource 在重新載入時會保留其值。防止重複提交具破壞性的操作，並在 UI 中呈現可復原的錯誤；不要依賴記錄檔作為使用者回饋。

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

將耗費資源的解析或運算移出 TSX 處理器：移到 `computed`、互動路徑之外，或移到 Rust。結果可能在查詢、頁面或選取項目已經改變後才送達：resource 會捨棄被取代的載入，而你自己的工作則應附上 revision 或識別碼，並拒絕過期的結果，而不是將其套用到新的狀態。

<a id="layout-measurement-and-scrolling"></a>

## 版面配置、測量與捲動

view 會將其子元素排成一欄，子元素預設會橫向延展填滿；`class="flex"`（`.flex_row()`）則如 CSS 一般是一列。一列控制項需要子元素置中（`items-center`），請明確指定。一列由全高欄位組成的版面則保留預設的延展，使欄位填滿該列的高度，其標頭也會停留在頂端：

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

大多數 UI 應使用版面配置，而不是自行測量（[版面配置](./layout.md)）。測量（`onLayout`、`measure()`）是進階的行為工具，適用於浮層、虛擬化、編輯器、圖表，以及正確性取決於已解析幾何資訊的類似元件。

- 將測量與幾何邏輯放在擁有該行為的那一層。
- 只有在一般版面配置無法表達該關係時才觀察版面。
- 不要在每次版面事件時寫入不相關的應用程式狀態。
- 將測量資料視為受 revision 限定；文字大小、寬度、主題或內容變更後，它可能變得過期。
- 讓 `nsh/base` 的浮層來放置彈出視窗：其放置、翻轉與安全區域邊距遵循同一套原則。

對於對齊不變量，優先透過建構來達成，而不是事後修正：同層區域應使用相同的間距 token 或共用的 inset，而不是重複寫入相等的字面值。對於關鍵的重複邊緣、欄位與間隙，請在真實平台（`nsh test --target`）上加入幾何檢查或截圖。不要只測試預設視窗：較大的文字大小與顯示縮放，可能使小數座標造成一個像素的偏移，即使預設截圖看起來是對齊的。

檢視精確度時請測量已解析的結果，但不要將測量得到的修正編碼為任意數值。請追查不一致的原因，例如重複的 padding、巢狀的 inset、邊框的歸屬、字型度量或四捨五入，然後修正結構上的擁有者。

每個可捲動區域都必須只有一個擁有者。避免在同一軸向上意外出現巢狀捲動。請將擁有整個頁面、面板或清單的元素交給 scroll view，使其捲動指示器相對於該區域的邊緣定位，並將內容的 inset 放在其內部（`contentClass` / `contentStyle`），而不是將 scroll view 包在帶有 padding 的容器中。若捲動指示器浮在內容與頁面邊界之間，通常表示捲動擁有者選錯了，或是 padding 放在錯誤的層級。請在 padding 與 margin 中使用 `env(safe-area-inset-*)` 與 `env(keyboard-inset-height)`（以其存取器讀取數值）來避開安全區域與鍵盤，它們會在原生端跟隨旋轉與鍵盤變化。

<a id="lists-tables-and-large-data"></a>

## 清單、表格與大量資料

當資料可能成長到超出小型且有界的集合時，請使用 [`List`](./lists.md)（Rust 中為 `virtual_list`）。將資料列的識別與其可見位置分開，並避免在每次更新時複製整個資料集。讓清單負責回收、捲動協調與可見範圍，而資料列函式負責資料列的呈現。

請分開處理：

- 來源資料與領域 id；
- 篩選與排序狀態；
- 選取狀態；
- 捲動狀態；
- 資料列渲染。

這樣可使更新保持局部，並避免 view tree 變成資料模型。

虛擬化是一份行為契約，而不只是效能開關。資料列函式對每個 cell 只執行一次，而 cell 會被重複用於其他資料列：

- **必須將每個項目的狀態保存在以 id 為鍵的資料中**，而不是保存在資料列內建立的 signal 裡，因為該 signal 會隨 cell 移到下一個項目；
- **必須在使用處讀取項目**，也就是在 binding 中：在資料列函式頂端複製的值，會屬於該 cell 最初顯示的那一列；
- 在 TSX 中以不可變方式更新（新的陣列、重用未變動的項目、變動的項目使用新物件），並提供接近典型資料列的 `estimatedItemSize`；
- 捲動到某個項目（`scrollToIndex`）是以資料座標運作，即使大多數資料列並不存在也一樣。

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

- prop 要建立有效的預設值：Rust 中使用 `#[prop(default)]` 或 `#[prop(default = …)]`，TSX 中則在讀取 prop 之處使用 `??`；
- 每個 prop、事件與匯出都要有文件註解；在 Rust 中，它會成為 TSX 所見的 TypeScript 宣告；
- 回呼描述所請求的變更，只有在指標細節具有意義時才包含它們；
- 明確的 part、slot 與 render 函式，優於檢查任意的子孫節點；
- 新增可重用的行為時，不得強制套用產品層級的視覺選擇。

應用程式會以簽署套件的形式交付給宿主應用程式，且可能不會再次建置：之後每個 NSH 版本都會原封不動地執行它們。對於應用程式或元件庫向他人公開的內容（其元件的 prop 與事件、其 crate 的匯出，以及宿主應用程式的原生元件與模組所接收的函式），請遵守相同的原則：

- 輸入只新增選用成員；型別只放寬；預設值與行為保持不變（新行為須由使用者主動啟用）；
- 參數可能增加的函式，應將其選項作為單一物件接收（`scrollTo({ x, y, animated })`），而不是再新增位置參數；永遠不會增加的參數，例如範圍的起點與終點，則保持為位置參數；
- 模式使用可新增值的字串聯集，而不是日後需要第三種狀態的布林值；
- 一個值只有一種型別：`version: string`，絕不是 `string | number`；
- 函式回傳的是可新增欄位的物件，而不是 tuple 或單一的裸值；
- 回傳 Promise 的函式，一律以 reject 回報所有失敗，而呼叫端可處理的失敗要帶有 `code`，如同 NSH 自身的做法：呼叫端依據代碼分支處理，而訊息是給人看的，可能會改變；
- 重新命名時，要將舊名稱保留為 `@deprecated` 別名，並指向同一個實作。

在 Rust 中，對於必須演進而不破壞呼叫端的行為狀態，預設使用私有欄位。公開欄位則適用於刻意設計成紀錄型的設定與序列化資料。每個具有公開欄位的公開 struct 都必須標註 `#[non_exhaustive]` 並實作 `Default`，使呼叫端無需使用完整的 struct 字面值即可建立數值，且新增欄位時不會破壞它們。

在重組內部結構時，請保持公開的匯入路徑穩定：crate 的 `#[native_module]` 指定符與其匯出，以及 TSX 模組的匯出，都是其他程式碼所匯入的內容。請優先採用平台控制項的術語與 NSH 既有的命名，而不是網頁框架的詞彙。
<a id="platform-and-capability-boundaries"></a>

## 平台與能力邊界

不要假設每個平台都支援相同的功能。標題列與視窗控制項、無障礙、剪貼簿、觸覺回饋、捲動物理、字型與計時都可能不同。同一個 bundle 可在所有平台上執行（[平台專屬程式碼](./platform-specific.md)）；請將平台專屬的程式碼放在 NSH 提供的位置，並定義後備行為：

- 一個元素在所有平台上的意義是頂層 prop；平台自身的系統功能則放在 `ios={{…}}`、`android={{…}}`、`desktop={{…}}` 或 `web={{…}}`（Rust 中為 builder 方法），寫在各個具備該功能的平台中，而且只會套用目前平台的物件；
- 行動平台的 API 來自 `nsh/mobile`，桌面平台的 API 來自 `nsh/desktop`；
- 各平台的樣式使用 `ios:`、`android:` 與 `web:` class。

即使呈現方式不同，平台分支也必須保持語意契約。例如，對話框在 iOS 上是 sheet，在桌面平台上則是覆蓋於視窗之上的圖層，但應用程式仍然需要一致的開啟狀態。共用的行為以 headless 方式測試，平台專屬的部分則使用 `nsh test --target` 測試。對於 NSH 回報的值（`platform.os`、某個狀態、某個原因）所做的每一個分支，都要提供 `default`：後續版本會新增平台與情況，而今天交付的應用程式也會在這些平台上執行（[相容性](./compatibility.md)）。

應用程式要在 `nsh.json` `"capabilities"` 中宣告它在 VM 之外所存取的資源：它所擷取資料的主機、web view 所顯示的頁面、剪貼簿、狀態列（[沙箱與能力](./sandbox-and-capabilities.md)）。要交付到其他應用程式之中的應用程式，應精確列出它所使用的項目，並且像處理失敗的請求一樣處理被拒絕的請求：宿主應用程式授予的權限可能少於該應用程式所宣告的。被拒絕的呼叫會以 `code` `"ERR_ACCESS_DENIED"` 失敗，其 `permission` 指出是哪一項能力，其 `resource` 則是所請求的內容。

<a id="file-and-naming-conventions"></a>

## 檔案與命名慣例

- 以產品概念為頁面與元件命名：`ProjectList`、`ProjectEditor`、`SettingsPage`。
- 以意圖為事件處理函式命名：`confirmDelete`、`openProject`、`onQueryChange`。
- 每個模組只保留一項主要職責；當不閱讀無關行為就無法理解狀態的擁有者或生命週期時，就拆分檔案。
- 若元件的模組、props、事件與針對性測試會一起變動，就將它們放在一起。
- 記錄不變條件與出人意料的生命週期限制；不要敘述顯而易見的 builder 呼叫。
- 在 Rust 中使用 `rustfmt` 並通過 Clippy，在 TSX 中使用 `nsh check`。避免使用範圍過廣、會掩蓋無關警告的 `allow` 屬性。

<a id="vocabulary-is-part-of-the-api"></a>

### 詞彙就是 API 的一部分

不同元件中的同一概念要使用同一個詞。在為 prop 或事件命名之前，先在 NSH 自身的 API 中尋找該術語，再到 GPUI Kit 的 `gpui-base`、GPUI 與 `gpui-component` 中尋找，最後才參考各平台的控制項。primitive 所顯示的內容以及全域 API 的名稱取自 HTML、DOM 與 CSS（`src`、`html`、`placeholder`）。Rust 的名稱是 `snake_case`，在 TSX 中會轉換為 `camelCase`（`on_open_change` 對應 `onOpenChange`）；一個詞就只用一種寫法（`readonly`、`multiline`）。

| 概念 | 命名模式 | 範例 |
| --- | --- | --- |
| 元件 | 名詞，`PascalCase` | `Button`、`Dialog`、`QuantityStepper` |
| 其 props 與事件（Rust） | `<Component>Props`、`<Component>Event` | `ButtonProps`、`ButtonEvent::Press` → `onPress` |
| 行為的狀態物件 | `<Control>State`，由 `create<Control>` 建立 | `NavStackState`、`createNavStack` |
| 值為何改變 | `<Control>ChangeReason`，字串聯集 | `DialogChangeReason`：`"cancel"`、`"backdropPress"` |
| 狀態 | 形容詞，使用肯定形式，不加 `is` 前綴 | `open`、`hidden`、`disabled`、`selected`、`checked`、`readonly` |
| 使用者可以做的事 | 形容詞 | `scrollable`、`zoomable`、`selectable`、`resizable` |
| 沒有對應形容詞的功能 | `<feature>Enabled` | `pagingEnabled` |
| 某個部分是否顯示 | 以該部分命名的布林值，預設為 `true` | `scrollbar`、`caret`（`scrollbar={false}`） |
| 某個 slot 是否顯示 | `<slot>Visible`，預設為 `true` | `headerVisible`（`header` 是頁面的 slot） |
| 某個部分的樣式 | `<part>Class`、`<part>Style` | `backdropClass`、`contentStyle` |
| 某個狀態的樣式 | `<state>Style`、`<state>:` class | `activeStyle`、`disabled:` |
| slot | 它是什麼就叫什麼 | `header`、`footer`、`trigger`、`content`、`empty` |
| 應用程式的內容 | `render<Part>` | `renderCodeBlock` |
| 關閉旗標 | `closeOn<Trigger>`，預設為 `true` | `closeOnEscape`、`closeOnBackdropPress` |
| 值的變更 | `on<Value>Change({ <value>, ... })`，單一物件 | `onChange({ value })`、`onOpenChange({ open, reason })` |
| 其他任何事件 | `on<Event>`，現在式，單一物件 | `onPress()`、`onSubmit({ text })` |
| 階段 | `<act>Start`、`<act>End` | `onPanStart`、`onLoadStart` |
| 滑鼠在 view 上 | `Enter` / `Move` / `Leave`，沿用 DOM 的名稱 | `onMouseEnter`、`onMouseMove`、`onMouseLeave` |
| 開始監聽 | `on(event, listener)`，回傳 `() => void` | `host.on(name, l)`、`BackHandler.on("press", l)` |
| 環境中的值 | 存取器，旁邊附上 `set<Value>` | `colorScheme()`、`setColorScheme` |
| 唯讀布林值 | `is<Adjective>`、`has<Noun>` | `isAvailable` |

props 絕不使用 `is<Adjective>`：該形式只用於僅讀取布林值的對象（常數、payload 的欄位）。顯示的部分以該部分命名，絕不使用 `<part>Shown`、`<part>Hidden` 或 `shows<Part>`。

Rust builder 接收並回傳 `Self`，以其所設定的 prop 命名，不加 `set_`（`.disabled(..)`、`.checked(..)`、`.on_change(..)`）；原地修改則使用 `set_<field>`（`setRoutes`、`setColorScheme`）。布林值讀取器在值持有某樣東西時使用 `has<Noun>`，在描述狀態或權限時使用 `is<Adjective>`。只要該動作有對應的形容詞，就使用形容詞：用 `isClosable` 而非 `canClose`，用 `isZoomable` 而非 `canZoom`。當動作是沒有形容詞形式的動詞片語時，改以它所需要的對象命名：用 `hasDefinition`，而非 `canGoToDefinition`。不要新增 `can` 讀取器。

<a id="let-the-enclosing-name-carry-the-context"></a>

### 讓外層名稱承載上下文

名稱是在某個範圍內被閱讀的：prop 在其元件之內，欄位在其型別之內。兩者都不要重複外層已有的內容（用 `contentStyle`，而非 `contentContainerStyle`；用 `Dialog` 的 `backdropClass`，而非 `dialogBackdropClass`）。同一個型別的欄位應保持相同的縮寫程度。

<a id="use-precise-domain-words"></a>

### 使用精確的領域詞彙

- **selected** 表示成員身分或目前項目；**checked** 與 **pressed** 是核取方塊或切換鈕的值；**focused** 是鍵盤的目標；**hovered** 是指標的存在。絕不可互相混用。
- **open / close** 是覆蓋層的狀態；**show / hide** 是暫時性的請求；**expand / collapse** 則用於結構。
- **disabled** 會阻擋互動；**readonly** 允許選取與導覽但不允許編輯；**loading** 會在操作執行期間防止重複工作。
- **press** 是任何輸入方式的啟動，NSH 的事件使用 press（`onPress`）；**click** 則專指滑鼠。
- **index** 是位置；**id** 是身分識別。不要以 index 持久化可重新排序的資料或作為其 key。
- **value** 是受控的領域資料；**state** 是被保留的行為。
- **src** 是元素所顯示的資源（圖片、影片、頁面）；其他任何位址都是 **url**。
- **role** 說明某個選項的意義（`"cancel"`、`"destructive"`）；外觀則由應用程式決定。

當存在更精確的領域術語時，避免使用含糊的名稱，例如 `data`、`item2`、`handleAction`、`updateUi`、`process`、`manager` 或 `config`。

<a id="type-and-module-style"></a>

### 型別與模組風格

- Rust 型別使用 `UpperCamelCase`；模組、函式、方法、欄位與區域變數使用 `snake_case`；常數使用 `SCREAMING_SNAKE_CASE`。context 繫結命名為 `cx`。
- TSX 元件及其標籤使用 `PascalCase`；props、函式與區域變數使用 `camelCase`。primitive 來自 `nsh`，基礎元件來自 `nsh/base`。
- 以元件命名的模組擁有其公開的接縫；可以將其狀態、各部分與測試拆分到不同檔案，但不要改變其他模組所匯入的內容。
- 單一元件概念使用單數的模組名稱，元件家族則使用既定的名稱（`menu` 對應 `Menu`、`MenuItem` 與 `Submenu`）。
- 識別碼加上 `Id` 後綴，集合則使用有意義的複數。在同一個子系統中，不要交替使用 `idx`、`index` 與 `ix`。
- 在可能時以肯定形式命名謂詞。肯定的狀態比多個否定更容易組合，但在符合控制項語意時，應保留既定的術語，例如 `disabled`。

<a id="callback-and-event-wording"></a>

### 回呼與事件的措辭

- 每個事件都傳遞單一物件，即使只有一個欄位，值的變更也一樣，其欄位以其所回報的 props 命名：`onChange({ value })`、`onOpenChange({ open, reason })`、`onLinkPress({ url })`。如此一來，之後新增的欄位只是一項追加。API 的資料型別是一個欄位，絕不是 payload 本身（`onImagePress({ image })`）；沒有內容可回報的事件則不傳遞任何東西。
- 以動作命名，不用過去式或請求語氣：`onPress`、`onClose`、`onCancel`、`onBackPress`。
- 當動作本身有名稱時，以意圖而非幾何關係命名：用 `onLoadMore`，而不是「已到達末端」。
- 生命週期成對為 `onOpen` / `onClose`；階段為 `Start` / `End`，絕不使用 `Begin`；滑鼠在 view 上為 `onMouseEnter` / `onMouseMove` / `onMouseLeave`（DOM 的名稱），檔案被拖曳到其上則為 `Enter` / `Leave`。
- 記錄回呼是在元件自身狀態改變之前還是之後執行，以及它是否可以重入該元件。

<a id="documentation-and-copy-style"></a>

### 文件與文案風格

公開文件應以元件的功能以及狀態的擁有者開頭。範例必須使用目前的 API，並展示穩定的 id。記錄預設值、平台差異、焦點行為、回呼順序，以及哪些 props 由主執行緒以原生方式讀取。

標籤、指令、確認對話框、大小寫與刪節號，請遵循設計指南中的介面語言規則。每個領域物件、指令與狀態都只保留一個標準術語。

翻譯 key 描述的是穩定的意圖（`dialog.deleteProject.title`），而不是來源語言的句子或畫面座標。絕不用翻譯過的片段拼湊句子，也不要因為英文文字碰巧相同，就將同一個 key 用於不同的意義。

在地化的是意圖，而非語法。讓每個語系都能控制詞序、複數形式、標點，以及所需的上下文量。測試應能抓出遺漏的 key 與不一致的固定術語；重複是否因上下文而合理，仍由人工審查決定。請在元件內以貼近實際的內容、文字膨脹以及大字級來驗證每一個字串。

<a id="testing-strategy"></a>

## 測試策略

在能夠證明該行為的最低層級進行測試（[測試](./testing-and-trace.md)）：

1. 針對狀態轉換、格式化、解析與排序的純測試（crate 函式的 `cargo test`、store 函式的測試檔案）；
2. 針對元件、事件與生命週期的 headless 應用程式測試：使用真實的引擎、渲染器、版面配置與列表，顯示影格為 60 Hz，位於 `nsh test`（`nsh/test`）或 `cargo test`（`nsh_testing::Headless`）；
3. 針對焦點、鍵盤、指標、版面配置與渲染狀態的互動測試，依照使用者的操作步驟（`press`、`type`、`scroll`、`drag`、`keyboard.press`），在 headless 環境與真實平台上皆執行（`nsh test --target macos`、`ios`、`android`、`web`……）；
4. 針對完整工作流程的範例或應用程式冒煙測試，並以 `nsh test --trace` 衡量一次互動的成本。

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

對於互動式元件，應涵蓋語意契約而非實作細節：以按壓與鍵盤啟動、受控的值變更、disabled 行為、焦點移動、事件數量與順序、穩定的身分識別，以及重要的空白或失敗狀態。以 stub 取代網路（`network` 路由），並以手動時鐘控制時間，而不是等待真實的網路與時間。只要失敗能被確定性地重現，就在修復 bug 之前先加入回歸測試。

像使用者一樣尋找 view：依角色與名稱、標籤或文字（`role:button[Save]`、`label:Close`），在沒有其他東西可以指稱時才使用穩定的 `testID`。選擇器在每一個步驟都會重新讀取，因此步驟絕不會作用於過時的快照。對於選擇器無法表達的視覺事實，使用螢幕截圖（`app.screenshot`，在真實平台上）；座標只作為後備手段。自動化與手動的證據要分開回報。

<a id="performance-rules"></a>

## 效能規則

- 不要在讀取某個狀態的繫結或 effect 中無條件寫入該狀態。
- 避免在繫結或列函式中建立 signal、effect、按鍵繫結與高成本的資料結構。
- 在繫結中讀取 signal，讓一致的變更只更新樹中最小的部分。
- 對於長集合使用 `List`，並只渲染可見範圍。
- 避免僅為了滿足 closure 而複製大型字串或集合；改為捕獲 `Copy` handle 或共用資料（`SharedString`、`Rc`）。
- 保持 TSX 處理函式與計算值輕量；將繁重的工作移出互動路徑，或移到 Rust 中。
- 在加入快取之前，先以 `nsh test --trace` 量測。快取必須有明確的失效負責者。
- 讓動畫工作保持有界：動畫值放在 UI 執行緒上，而不是每個影格都寫入的 signal；使用 `scrollValue` 而非捲動監聽器（[動畫](./animation.md)）；並遵守減少動態效果的設定（`reduceMotion()`）。
<a id="common-failure-modes"></a>

## 常見的失敗模式

請避免以下做法:

- 讓單一 signal 包含應用程式中互不相關的狀態;
- 將商業邏輯與網路請求寫在冗長的元件本體中;
- 對可重新排序的內容使用隨機或以索引為基礎的 key;
- 在 `List` 列內建立的 signal 中保存每一列的狀態;
- 在元件本體中讀取 prop 或 signal,卻期待它會自動更新;
- 使用寫死的顏色與圓角,導致自訂主題與深色模式失效;
- 在已有語意化元件提供焦點、鍵盤、停用與無障礙行為的情況下,仍自行實作可按壓的 view;
- 重複的本地狀態與受控值產生不一致;
- 將一個 signal 複製到另一個 signal 的 effect,以及透過 binding 形成迴圈的寫入;
- 把系統需要即時做出的決定交給 callback 處理,而不是事先設定好的 prop;
- 沒有明確指定擁有者的巢狀捲動視圖;
- 為了單一畫面而新增元件變體;
- 對可還原、低風險的操作使用確認對話框;
- 測試只呼叫內部函式,卻從不執行按壓、輸入或捲動。

<a id="rules-for-coding-agents"></a>

## 給程式碼代理的規則

在編輯之前,代理必須先閱讀最接近的實作、其測試、該模組的公開匯出,以及相關的參考頁面。代理必須搜尋目前的原始碼與 `.nsh/types` 來確認簽章,而不是類比 React、React Native、CSS 或 GPUI 的範例來轉譯:NSH 元件只會執行一次,而 binding 會追蹤它們所讀取的 signal。

對於每一項變更,代理都應該能夠說明:

1. 行為的擁有者與呈現的擁有者;
2. 保留的身分(identity)與狀態生命週期;
3. 按壓、鍵盤、焦點與無障礙的約定;
4. 版面配置與捲動的擁有者;
5. 主題 token 與刻意的例外;
6. 當行為退化時會失敗的測試。

產生的程式碼必須由人員審查與測試。「能夠編譯」並不是 UI 品質的標準,而僅僅為了讓產生的程式碼看起來整齊所做的大範圍重構,也無法取代與應用程式架構的契合。

<a id="implementation-checklist"></a>

## 實作檢查清單

在送出變更以供審查之前,請確認:

- 狀態與副作用的擁有者明確;
- 刻意選擇使用純函式或元件,且 prop 與 signal 在使用處才讀取;
- 重複的元素具有穩定、以領域資料為基礎的 key 與測試 id;
- 以主題 token 與 Tailwind 刻度取代零散的視覺寫死值;
- 按壓、鍵盤快捷鍵、焦點、停用狀態與覆蓋層能夠協同運作;
- 系統需要即時做出的決定以 prop 形式事先設定;
- 已涵蓋載入、空白、錯誤與取消的路徑;
- 長資料集使用 `List`,並將每個項目的狀態放在資料中;
- 公開 API 的新增只做擴充,並維持相依方向與封裝性;
- 測試在適當的層級驗證行為,包含 headless 模式以及變更所涉及的平台;
- 格式化、Clippy、`nsh check`、針對性測試與相關範例皆已通過。

應用程式設定請參閱[入門指南](./getting-started.md),目前的 API 細節請參閱 [Elements](../elements/index.md) 與 [API](../modules/index.md) 參考文件。
