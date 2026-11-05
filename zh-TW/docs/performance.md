---
title: "效能"
description: "說明 NSH 如何維持應用程式的高效能(Rust 應用程式、原生執行階段、批次跨界呼叫、原生動畫、虛擬化清單)、這對您的程式碼意味著什麼,以及如何在無頭模式與螢幕上進行效能量測。"
order: 62
group: tools
source_hash: f8f220699bc54685
---

# 效能

效能是 NSH 的首要考量，而且大部分效能由框架而非你的應用程式決定：執行環境是原生的，每次更新只跨一次執行緒，動畫與清單虛擬化不需要 JS，以 Rust 撰寫的應用程式則完全不執行 JS。本頁說明 NSH 遵循的規則、這些規則對你在 Rust 與 TSX 中撰寫的程式碼有何影響，以及如何進行量測。

<a id="the-rules"></a>

## 規則

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS 做的事越少越好

**以 Rust 撰寫的應用程式從頭到尾都是原生程式碼**：其元件、狀態與處理常式都由 NSH 的引擎編譯，不會有任何直譯器在執行（[使用 Rust 開發](./rust.md)）。這是撰寫應用程式最快的方式，也適合用於要求嚴苛的商業邏輯。

在 TSX 應用程式中，QuickJS 是一個直譯器：體積小、啟動快，但處理繁重工作時比原生程式碼慢得多。因此在 NSH 中，**只有你應用程式的程式碼是 JS**。響應式圖（signal、computed 值、effect）、編譯後的 JSX 所呼叫的渲染器、版面配置引擎、清單虛擬化、動畫，以及你匯入的每個模組，全都是 Rust。解析、差異比對、版面配置與字串處理都在原生端完成。

這項效果是可量測的。以下是同一個計數器應用程式在 NSH 先前的 JS 執行環境與原生執行環境上的比較（release 建置）：

| | 先前的 JS 執行環境 | 原生執行環境 |
|---|---|---|
| Bundle 大小 | 14 KB JS / 19.6 KB bytecode | 886 B JS / 1.7 KB bytecode |
| 評估 bundle | ~390 µs | ~95 µs |
| 一次點擊的 JS 時間（中位數） | ~14 µs | ~5 µs |
| 一次點擊的 commit | ~22 µs | ~15 µs |
| 捲動 1000 列清單時，每個重新綁定影格的 JS 時間 | ~150 µs | ~77 µs |

元件也是如此：以 Rust 元件撰寫的按鈕與功能相同的 TSX 按鈕，各 200 個的比較：

| | Rust 按鈕：JS / core | TSX 按鈕：JS / core |
|---|---|---|
| 第一個影格（ops） | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| 更新全部 200 個標題（ops） | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

（於 Apple silicon 上量測；第二張表使用先前的執行環境。兩者皆來自 NSH 的效能基準。）

**對你的程式碼而言：** 請讓事件處理常式與 computed 值保持輕量。繁重的運算（解析大型 payload、每次按鍵都對數千個項目排序）在 QuickJS 中的成本，會比你在具備 JIT 的 V8 或 JavaScriptCore 中習慣的更高。請只做一次並快取在 `computed` 中，或將它移出互動路徑。

<a id="2-cross-threads-in-batches"></a>

### 2. 以批次方式跨越執行緒

你應用程式的程式碼，無論是 Rust 或 JS，都在引擎執行緒上執行，絕不會在主執行緒上。一個回合，例如一個事件處理常式連同它所改變的一切，會成為**一次 commit**：執行環境會渲染元件、進行版面配置、做差異比對，並產生一批原生檢視操作，這批操作會以**一次跳轉**抵達主執行緒。不會為每個檢視各發一則橋接訊息，也不會為每個屬性各做一次序列化。

**對你的程式碼而言：** 你不需要為了效能而合併寫入；在一個處理常式中呼叫十次 `set`，仍然只會產生一次 commit，Rust 與 TSX 皆然。當你希望 effect 與 computed 值一次看到所有寫入，而不是在每次寫入後各自執行時，請使用 `batch`。

<a id="3-fine-grained-updates"></a>

### 3. 細粒度更新

元件只會執行**一次**，Rust 與 TSX 皆然。之後，只有讀取某個 signal 的綁定會在該 signal 變更時重新執行：一段文字、一個樣式屬性、`when`（`<If>`）的一個分支、`each`（`<Each>`）的各列。不會為了找出變更內容而重新渲染整個子樹。

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

- 請在使用 signal 的地方讀取它（在綁定內、Rust 中的 `move ||` 閉包與 TSX 中的 JSX 運算式，以及 `computed` 與 `effect` 內），而不是在元件的最上層讀取，這樣最窄的綁定才會更新。
- 集合請使用 `each` / `<Each>`（依 key 保留各列）或[虛擬清單](./lists.md)；若各列是從整個集合重新產生（Rust 中的 `dynamic`、JSX 中單純的 `.map()`），每次變更時都會全部重新建立。
- 當多個綁定使用同一個值時，請用 `computed` 推導該值，這樣每次變更只會計算一次。

在三個項目的清單後附加第四個項目，以 `nsh test --trace` 顯示如下：

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

請參閱[響應式](./reactivity.md)。

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. 不傳送不需要的內容

核心只會傳送有變更的部分：新檢視不會附帶預設樣式或空的事件遮罩，未變更的樣式與 frame 不會被傳送，文字顏色的變更也不會讓文字重新進行版面配置。一次只改變一個數字的點擊，只會傳送一個文字項目。你可以在 `nsh test --trace` 的輸出中看到這一點（見下文）。

<a id="5-animate-natively"></a>

### 5. 以原生方式執行動畫

由引擎執行緒驅動的動畫（每個影格都寫入一次 signal）每個影格都要花費一次 commit，在 TSX 中還要加上一次 JS 呼叫，而且在引擎執行緒忙碌時會出現卡頓。動畫值（[動畫](./animation.md)：Rust 中的 `animated_value`、TSX 中的 [`nsh` 動畫 API](../modules/nsh.md#animation)）則改為以原生方式執行動畫：

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

- `timing`、`spring` 與 `decay` 在平台的 UI 執行緒上逐影格執行，每個影格都不會在引擎執行緒上做任何工作。
- `scroll_value`（`scrollValue`）會在同一個影格內將捲動偏移量寫入動畫值；平移手勢（`pan={{ x, y }}`）則讓拖曳直接移動檢視。你的程式碼會得知結束事件（動畫完成時，平移手勢結束時會取得速度）。
- `Animated.sequence` / `parallel` / `stagger` / `loop` 會作為一棵原生樹執行：每個步驟在前一個步驟結束的瞬間開始，不會因為等待 JS 而產生空隙。
- `LayoutAnimation.configureNext` 會以原生方式為下一次 commit 的 frame、插入與移除加上動畫。

<a id="6-virtualize-long-lists"></a>

### 6. 虛擬化長清單

[`List`](./lists.md) 只保留視埠附近的列，回收其 cell，並以原生方式計算位置、欄、黏性標頭與可見性。沒有顯示任何新列的捲動影格不會執行你的任何程式碼，也不會產生批次；在圖庫的照片清單中，綁定一個新列的影格只有 4 個操作與 4 個 mount 項目。

**對你的程式碼而言：**

- 請為 `estimated_item_size`（`estimatedItemSize`）提供接近實際列高的值。
- 請將每個項目的狀態保存在你的資料中（以 id 作為 key），而不是保存在列內建立的 signal 中：cell 會被重複用於其他項目，當重複使用時，列的位置（`at.index()`；TSX 中的 `item()` / `index()`）也會改變。
- 請讓列保持輕量：每次回收時列都會綁定一次，因此其程式碼會在使用者捲動時執行。
- 對於跟隨捲動位置的效果，請使用 `scroll_value`（`scrollValue`），而不是 `on_scroll`（`onScroll`）。捲動監聽器每個引擎回合最多只會收到一個事件，但每個事件仍然是一次對你程式碼的呼叫（在 TSX 中則是對 JS 的呼叫）。

<a id="measuring"></a>

## 量測

<a id="headless-50"></a>

### 無頭模式：`--trace`

在 Rust 測試中，`EngineConfig::trace` 會記錄相同的 `perf` 行，而 `Headless::observe` 可以看到每個批次（[測試](./testing-and-trace.md#tracing-with-trace)）。`nsh test --trace` 會為 TSX 印出這些資訊：

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

需要注意的項目：

- **ops**（你的 JS 排入佇列的操作）與 **mount items**（原生檢視操作）：這兩者是確定性的。如果一次本應只變更一個標籤的點擊產生了 40 個項目，就表示有東西重新建立了本應更新的檢視。
- **event js**：處理常式及其觸發的內容所耗費的 JS 成本。
- **commit**：核心渲染元件、版面配置與差異比對的成本。
- **list js**：該次 commit 期間用於綁定清單列的 JS 時間。

完整指南：[測試](./testing-and-trace.md)。

<a id="on-a-device-55"></a>

### 在裝置上：`--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

會從 TSX 應用程式的實際主機，以平台自己的文字引擎記錄相同的 commit 行。`NshAppView(trace: true)` 與 `new NshView(context, true)` 在內嵌應用程式中也會做同樣的事。

<a id="on-screen-58"></a>

### 在螢幕上：`--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

（Rust 應用程式的 `run_app` 中使用 `AppOptions { fps: true, .. }`）會在執行中的應用程式上顯示影格率，以及影格與 commit 的成本，並附上 CPU、GPU 與記憶體資訊（[macOS：效能監視器](./macos.md#performance-monitor)）。在 Linux 與 Windows 上，`--target linux --fps` 與 `--target windows --fps` 會每秒記錄相同的讀數，並附上影格各階段的時間；`nsh test --target linux --fps -v`（或 `windows`）則會在測試驅動應用程式時擷取這些資料。

> [!TIP]
> 單次量測會受到 CPU 時脈狀態的強烈影響：剛休眠過的執行緒會在一段時間內執行得較慢。
> 請比較多次執行中的最小值，在同一台機器上進行，並且計時時優先使用 release 建置。

<a id="reference-numbers"></a>

## 參考數據

實測數據、NSH 的基準，以及圖庫在 Linux 上逐頁的數據，都收錄在[效能報告](./performance-report.md)中。

<a id="checklist"></a>

## 檢查清單

- 語言：以 Rust 撰寫應用程式，或撰寫其中最常使用的部分（[使用 Rust 開發](./rust.md)）；TSX 則保留給經常變動或在執行階段才傳遞的部分。
- 互動：一次點擊只會改變少數幾個 mount 項目，而不是數十個。
- 清單：任何很長的清單都使用虛擬清單（`virtual_list`、`List`），並提供預估的項目大小；每個項目的狀態放在資料中。
- 動畫：使用動畫值，而不是每個影格都寫入的 signal。
- 捲動效果：使用 `scroll_value`（`scrollValue`），而不是捲動監聽器。
- 處理常式：不要在每次按鍵或每個捲動事件中做繁重的工作；請快取在 `computed` 中。

<a id="see-also"></a>

## 另請參閱

- [效能報告](./performance-report.md)
- [架構](./architecture.md)
- [測試](./testing-and-trace.md)
- [清單](./lists.md)、[動畫](./animation.md)、[響應式](./reactivity.md)
