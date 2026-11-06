---
title: "效能"
description: "說明 NSH 如何保持應用程式流暢(Rust 應用程式、原生執行環境、批次跨界呼叫、原生動畫、虛擬化清單)、這對你的程式碼有何影響,以及如何在無介面模式和螢幕上進行效能量度。"
order: 62
group: tools
source_hash: f8f220699bc54685
---


# 效能

效能是 NSH 的首要考慮，而且大部分由框架而非你的應用程式決定：runtime 是原生的，每次更新只跨執行緒一次，動畫和列表虛擬化無需 JS 即可運行，而以 Rust 編寫的應用程式完全不運行 JS。本頁說明 NSH 遵循的規則、這些規則對你以 Rust 和 TSX 編寫的程式碼意味著什麼，以及如何量度效能。

<a id="the-rules"></a>

## 規則

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS 盡量少做事

**以 Rust 編寫的應用程式從頭到尾都是原生程式碼**：its 元件、狀態和處理函式都由 NSH 的引擎編譯，不會運行任何直譯器（[Building with Rust](./rust.md)）。這是編寫應用程式最快的方式，也是處理要求高的業務邏輯時的首選。

在 TSX 應用程式中，QuickJS 是一個直譯器：體積小、啟動快，但處理繁重工作時比原生程式碼慢得多。因此在 NSH 中，**只有你應用程式的程式碼是 JS**。響應式圖（signal、computed 值、effect）、你編譯後的 JSX 所呼叫的渲染器、佈局引擎、列表虛擬化、動畫，以及你匯入的每個模組，全部都是 Rust。解析、diff、佈局和字串處理都在原生層完成。

效果是可以量度的。同一個計數器應用程式，在 NSH 較早的 JS runtime 與原生 runtime 上的比較（release 建置）：

| | 舊 JS runtime | 原生 runtime |
|---|---|---|
| Bundle 大小 | 14 KB JS / 19.6 KB bytecode | 886 B JS / 1.7 KB bytecode |
| 評估 bundle | ~390 µs | ~95 µs |
| 一次點按的 JS 時間（中位數） | ~14 µs | ~5 µs |
| 一次點按的 commit | ~22 µs | ~15 µs |
| 捲動 1000 行列表，每個重新綁定幀的 JS | ~150 µs | ~77 µs |

元件方面也是如此：以 Rust 元件編寫的按鈕與功能相同的 TSX 按鈕，各 200 個：

| | Rust 按鈕：JS / core | TSX 按鈕：JS / core |
|---|---|---|
| 首幀（ops） | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| 更新全部 200 個標題（ops） | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

（於 Apple silicon 上量度；第二個表格在舊 runtime 上量度。兩者均來自 NSH 的效能基準。）

**對你的程式碼而言：** 保持事件處理函式和 computed 值輕量。繁重的運算（解析大型 payload、每次按鍵都對數千個項目排序）在 QuickJS 中的開銷，比你在配備 JIT 的 V8 或 JavaScriptCore 中習慣的要大。只做一次並快取在 `computed` 中，或把它移出互動路徑。

<a id="2-cross-threads-in-batches"></a>

### 2. 分批跨越執行緒

你應用程式的程式碼，無論是 Rust 還是 JS，都在引擎執行緒上運行，絕不會在主執行緒上運行。一個回合，例如一個事件處理函式連同它所改動的一切，會成為**一次 commit**：runtime 渲染元件、佈局、diff，並產生一批原生 view 操作，這批操作會以**一次跳轉**到達主執行緒。不會為每個 view 傳送一則橋接訊息，也不會為每個 prop 做序列化。

**對你的程式碼而言：** 你無需為了效能而合併寫入；在一個處理函式中呼叫十次 `set`，仍然只會產生一次 commit，Rust 和 TSX 都一樣。若你想讓 effect 和 computed 值一次看到所有寫入，而不是在每次寫入後各自運行，請使用 `batch`。

<a id="3-fine-grained-updates"></a>

### 3. 細粒度更新

元件只會運行**一次**，Rust 和 TSX 同樣如此。之後，只有讀取了某個 signal 的綁定會在它改變時重新運行：一段文字、一個樣式屬性、`when`（`<If>`）的一個分支、`each`（`<Each>`）的各行。不會為了找出改變了什麼而重新渲染整棵子樹。

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**對你的程式碼而言：**

- 在使用 signal 的地方讀取它（在綁定內、Rust 中的 `move ||` closure 和 TSX 中的 JSX 表達式內，以及在 `computed` 和 `effect` 中），而不是在元件頂部讀取，這樣最窄的綁定才會更新。
- 對集合使用 `each` / `<Each>`（以 key 保留各行）或[虛擬列表](./lists.md)；若各行由整個集合重新產生（Rust 中的 `dynamic`、JSX 中的普通 `.map()`），每次改動時所有行都會被重新建立。
- 當多個綁定使用同一個值時，用 `computed` 衍生該值，讓它每次改動只計算一次。

向三個項目的列表追加第四個項目，在 `nsh test --trace` 中顯示如下：

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

請參閱 [Reactivity](./reactivity.md)。

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. 不傳送不需要的內容

核心只傳送有改變的內容：新建立的 view 不帶預設樣式和空的事件遮罩，未改變的樣式和 frame 不會傳送，文字顏色改變不會令文字重新佈局。一次只改變一個數字的點按，只傳送一個文字項目。你可以在 `nsh test --trace` 的輸出中看到這一點（見下文）。

<a id="5-animate-natively"></a>

### 5. 以原生方式製作動畫

由引擎執行緒驅動的動畫（每一幀都寫入 signal）每幀都要一次 commit，在 TSX 中還要一次 JS 呼叫，而且當引擎執行緒繁忙時會出現卡頓。動畫值（[Animation](./animation.md)：Rust 中的 `animated_value`、TSX 中的 [`nsh` 動畫 API](../modules/nsh.md#animation)）則改為以原生方式運行動畫：

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`、`spring` 和 `decay` 在平台的 UI 執行緒上逐幀運行，每幀都無需引擎執行緒做任何工作。
- `scroll_value`（`scrollValue`）會在同一幀內把捲動偏移量寫入動畫值；平移手勢（`pan={{ x, y }}`）讓拖曳直接移動 view。你的程式碼會得知結束事件（動畫完成時、平移手勢結束時會取得速度）。
- `Animated.sequence` / `parallel` / `stagger` / `loop` 作為一棵原生樹運行：每一步在上一步結束的一刻開始，不會因等待 JS 而出現空隙。
- `LayoutAnimation.configureNext` 以原生方式為下一次 commit 的 frame、插入和移除製作動畫。

<a id="6-virtualize-long-lists"></a>

### 6. 虛擬化長列表

[`List`](./lists.md) 只保留視口附近的行，回收它們的儲存格，並以原生方式計算位置、欄、黏附標題和可見性。沒有顯示新行的捲動幀不會運行你的任何程式碼，也不會產生批次；在圖庫的相片列表中，綁定一個新行的一幀只有 4 個操作和 4 個 mount 項目。

**對你的程式碼而言：**

- 為 `estimated_item_size`（`estimatedItemSize`）提供接近真實行高的值。
- 將每個項目的狀態保存在你的資料中（以 id 作 key），而不是保存在行內建立的 signal 中：儲存格會被其他項目重用，行的位置（`at.index()`；TSX 中的 `item()` / `index()`）也會隨之改變。
- 保持各行輕量：每次回收時行都會綁定一次，因此它的程式碼會在使用者捲動時運行。
- 對於跟隨捲動位置的 effect，請使用 `scroll_value`（`scrollValue`）而不是 `on_scroll`（`onScroll`）。捲動監聽器每個引擎回合最多收到一個事件，但每個事件仍然是對你程式碼的一次呼叫（在 TSX 中是對 JS 的呼叫）。

<a id="measuring"></a>

## 量度

<a id="headless-50"></a>

### 無頭模式：`--trace`

在 Rust 測試中，`EngineConfig::trace` 會記錄相同的 `perf` 行，而 `Headless::observe` 可以看到每個批次（[Testing](./testing-and-trace.md#tracing-with-trace)）。`nsh test --trace` 會為 TSX 列印這些內容：

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

需要留意的項目：

- **ops**（你的 JS 排入佇列的操作）和 **mount items**（原生 view 操作）：這些是確定性的。如果一次本應只改變一個標籤的點按產生了 40 個項目，就表示有東西重新建立了本應更新的 view。
- **event js**：處理函式及其所觸發內容的 JS 開銷。
- **commit**：核心渲染元件、佈局和 diff 的開銷。
- **list js**：該次 commit 期間綁定列表行所花的 JS 時間。

完整指南：[Testing](./testing-and-trace.md)。

<a id="on-a-device-55"></a>

### 在裝置上：`--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

會從 TSX 應用程式的真實宿主記錄相同的 commit 行，並使用平台自己的文字引擎。`NshAppView(trace: true)` 和 `new NshView(context, true)` 在嵌入式應用程式中的作用相同。

<a id="on-screen-58"></a>

### 在螢幕上：`--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

（Rust 應用程式的 `run_app` 中的 `AppOptions { fps: true, .. }`）會在運行中的應用程式上方顯示幀率、幀和 commit 的開銷，以及 CPU、GPU 和記憶體（[macOS: performance monitor](./macos.md#performance-monitor)）。在 Linux 和 Windows 上，`--target linux --fps` 和 `--target windows --fps` 會每秒記錄相同的讀數，以及一幀中各階段的時間；`nsh test --target linux --fps -v`（或 `windows`）則在測試驅動應用程式時擷取這些讀數。

> [!TIP]
> 單次量度主要受 CPU 時脈狀態影響：剛休眠過的執行緒會在一段時間內運行得較慢。
> 請比較多次運行中的最小值，在同一部機器上進行，並且計時時優先使用 release 建置。

<a id="reference-numbers"></a>

## 參考數字

實測數字、NSH 的基準，以及圖庫在 Linux 上逐頁的數據，載於[效能報告](./performance-report.md)。

<a id="checklist"></a>

## 檢查清單

- 語言：以 Rust 編寫應用程式，或編寫其中最常用的部分（[Building with Rust](./rust.md)）；TSX 則留給經常改動或在執行時才交付的部分。
- 互動：一次點按只改變少數幾個 mount 項目，而不是數十個。
- 列表：任何較長的內容都使用虛擬列表（`virtual_list`、`List`），並提供估算的項目大小；每個項目的狀態放在資料中。
- 動畫：使用動畫值，而不是每幀寫入 signal。
- 捲動 effect：使用 `scroll_value`（`scrollValue`），而不是捲動監聽器。
- 處理函式：不要在每次按鍵或每個捲動事件中做繁重工作；在 `computed` 中快取。

<a id="see-also"></a>

## 另請參閱

- [效能報告](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md)、[Animation](./animation.md)、[Reactivity](./reactivity.md)
