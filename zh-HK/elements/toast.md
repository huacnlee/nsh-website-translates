---
title: "Toast"
description: "Toast、ToastStack 和 ToastManager:與 gpui-base 一致的無樣式 toast、帶有過渡狀態的語義化根元素、以分層方式排列 toast 的堆疊,以及它們的無介面生命週期。"
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---


# Toast

Toast 是短暫顯示於應用程式上方的簡短訊息，例如「已複製」、「草稿已刪除 · 復原」、「無法傳送」。
`nsh/base` 以三個無樣式的部分提供其行為，與 GPUI Kit 的 `gpui-base` 相同：

- **`ToastManager`** 按順序保存各 Toast 及其生命週期：每個 Toast 先是 `"starting"`，待動態效果的時長過去後變為 `"present"`，在顯示且未暫停期間倒數其逾時，並在退出時長內保持 `"ending"`，之後才被移除。
- **`ToastStack`** 量度其 Toast，並由某一邊開始排列，最新的最靠近該邊：收合時為重疊的層疊，展開時（指標在其上，或手指按在其上）為列表，並以彈簧移動。
- **`Toast`** 是每個 Toast 的根：具備 `alert` 角色、供應用程式樣式使用的 `transitionStatus`、請求關閉該 Toast 的滑動手勢，以及在 Toast 顯示時由螢幕閱讀器朗讀其標籤。

外觀與內容由應用程式決定，在任何地方顯示 Toast 的便利做法亦然：應用程式可在這些部分之上自行建立 `toast(...)`，如範例庫所做（`examples/gallery/toast.tsx`），GPUI Kit 的通知亦是建基於 `gpui-base` 的 Toast。

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`、`ToastStack` 和 `ToastManager` 來自 [`nsh/base`](../modules/nsh-base.md)。在 Rust 中，它們是 `nsh_base` 的 `toast`、`toast_stack` 和 `ToastManager`。

## ToastManager

Manager 是無介面的：它不渲染任何內容，也不運行任何計時器。應用程式推入 Toast，連同其狀態渲染 `visible(limit)` 所返回的 Toast，並在有任何 Toast 掛載時，按計時器呼叫 `advance`，於堆疊展開時傳入 `paused`。在 Rust 中，它是以應用程式的 id 和值為基礎的 `ToastManager<I, T>`，每次呼叫都有一個 `Instant`；在 TS 中，它是一個以字串 id 和任意 JSON 值為基礎的類別，使用引擎的時鐘（包括測試用的手動時鐘）。

- `push(id, value, options)` 加入最新的 Toast，並取代具有相同 id 的 Toast（返回被取代 Toast 的值）；`options.timeout` 是其顯示時間（以毫秒計；無：保持顯示直至被關閉）。
- `dismiss(id)` 開始某個 Toast 的退出；`dismissAll()` 開始所有 Toast 的退出，並返回它們的 id。
- `advance(paused)` 推進生命週期並回報有何變化：`presented`、`ending`（其逾時已耗盡）、`removed`（連同其值），以及 `changed`。
- `visible(limit)` 是最新的 `limit` 個未在結束中的 Toast，加上結束中的 Toast，由最舊的開始排列；`entries()`（Rust 為 `iter()`）是全部 Toast；另有 `get(id)`、`len()`、`isEmpty()`。

`ToastMotion` 存放兩者的 token：`duration`（400 ms：進場的截止時間及堆疊彈簧的響應時間）、`exitDuration`（200 ms）、`collapsedPeek`（14）、`expandedGap`（14）、`collapsedScaleStep`（0.05）和 `collapsedVisible`（3），均為 Sonner 的預設值（Rust 中為 `ToastMotion::sonner()`；TS 中省略的欄位會保留這些預設值）。

## ToastStack

Stack 的子元素就是其 Toast，由最舊的開始排列。從其 `placement` 邊（預設為 `"topRight"`；底部的錨點會向上排列）開始，收合的 Toast 彼此重疊並相隔 `collapsedPeek`，每多一個便窄 `collapsedScaleStep`，而且只顯示 `collapsedVisible` 個；展開時，它們是相隔 `expandedGap` 的列表。Toast 的到達、離開以及展開，都以臨界阻尼彈簧移動。當指標在其上，或有手指按在其上時（`onExpandedChange({ expanded })`；Rust 為 `ToastStackState`，由 `is_expanded()` 讀取），它便處於展開狀態，因此應用程式可在用戶閱讀或觸碰 Toast 時暫停逾時計時。

應用程式負責放置 Stack：放在邊緣的 [Overlay](./overlay.md) 中，並位於安全區域之內。其 `class` 和 `style` 決定其寬度。當它持有 Toast 時，會接收 Escape 和 Android 返回鍵（`onCancel`；`closeOnEscape={false}` 則讓應用程式其餘部分處理這些按鍵）：關閉最新的 Toast。

## Toast

Toast 是圍繞應用程式內容的 `alert` 角色。其 `transitionStatus` 由 manager 提供，其狀態 class 會透過其 `class` 跟隨：在其首個影格中，當 `"starting"` 時為 `startingClass`，因此其 `transition` class 會由此開始動畫（Tailwind 的 `starting:`、CSS 的 `@starting-style`）；當 `"ending"` 時為 `endingClass`，維持退出的時長；當指標正在滑動它時為 `swipingClass`（`transition-none` 使其跟隨手指）。

用手指或滑鼠朝 `swipeDirection` 拖動（預設為 `"right"`；`null` 會關閉滑動），指標移動後便會帶動它，因此其按鈕仍然是按鈕；放開時若超過 `swipeThreshold` 點（50）或是快速撥動，它會繼續移出並請求被關閉（`onDismissRequest`），未達此距離則會返回原位。螢幕閱讀器會在 Toast 顯示時朗讀其 `accessibilityLabel`。

## Toast props

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | 其生命週期階段。 |
| `startingClass`、`endingClass`、`swipingClass` | `.starting_class(..)`, ... | `string` | 無 | 其在首個影格、結束中、被滑動時的 class。 |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | 其被滑走的方向。 |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | 滑動多遠後放開才會請求關閉它。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器在其顯示時朗讀的內容。 |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | 無 | 用戶將其滑走。 |

## ToastStack props

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Sonner 的預設值 | 其動態 token。 |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | 其排列所由的邊緣。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | 持有 Toast 時接收 Escape 和返回鍵。 |
| `onExpandedChange` | `.on_expanded_change(..)`、`.state(..)` | `(e: { expanded: boolean }) => void` | 無 | 互動令其展開或收合。 |
| `onCancel` | `.on_cancel(..)` | `() => void` | 無 | Escape 或返回鍵：關閉最新的 Toast。 |
