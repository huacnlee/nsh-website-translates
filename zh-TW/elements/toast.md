---
title: "Toast"
description: "Toast、ToastStack 與 ToastManager:與 gpui-base 相同的無樣式 toast,具備語意化根元素與轉場狀態,以及將 toast 以層疊方式排列的堆疊元件,還有它們的 headless 生命週期。"
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

Toast 是在應用程式上方短暫顯示的簡短訊息:「已複製」、「草稿已刪除 · 復原」、「無法傳送」。
`nsh/base` 以三個無樣式的部分提供其行為,與 GPUI Kit 的 `gpui-base` 相同:

- **`ToastManager`** 依序保存各個 toast 及其生命週期:每個 toast 先是 `"starting"`,動畫時長過後變為 `"present"`,在存在且未暫停時倒數其逾時,並在退出動畫的時長內維持 `"ending"`,之後才被移除。
- **`ToastStack`** 測量其 toast 並從某個邊緣開始排版,最新的最靠近該邊緣:收合時為重疊的層,展開時(指標位於其上,或手指按在其上)為清單,並以彈簧動畫移動。
- **`Toast`** 是每個 toast 的根:`alert` 角色、供應用程式樣式使用的 `transitionStatus`、要求關閉它的滑動手勢,以及在其顯示時由螢幕閱讀器朗讀其標籤。

外觀與內容由應用程式決定,從任何地方顯示 toast 的便利性也是:應用程式在這些元件之上建構自己的 `toast(...)`,如 gallery 所做的(`examples/gallery/toast.tsx`),GPUI Kit 的通知也是建構在 `gpui-base` 的 toast 之上。

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

`Toast`、`ToastStack` 與 `ToastManager` 來自 [`nsh/base`](../modules/nsh-base.md)。在 Rust 中,它們是 `nsh_base` 的 `toast`、`toast_stack` 與 `ToastManager`。

## ToastManager

管理器是 headless 的:不渲染任何內容,也不執行計時器。應用程式推入 toast,連同其狀態渲染 `visible(limit)` 回傳的那些 toast,並在任何 toast 已掛載時以計時器呼叫 `advance`,在堆疊展開時傳入 `paused`。在 Rust 中它是針對應用程式的 id 與值的 `ToastManager<I, T>`,每個呼叫各有一個 `Instant`;在 TS 中它是針對字串 id 與任何 JSON 值的類別,使用引擎的時鐘(包含測試的手動時鐘)。

- `push(id, value, options)` 新增最新的 toast,並取代具有相同 id 的 toast(回傳其值);`options.timeout` 為其顯示時間,單位為毫秒(無:持續到被關閉為止)。
- `dismiss(id)` 開始某個 toast 的退出;`dismissAll()` 開始所有 toast 的退出,並回傳其 id。
- `advance(paused)` 推進生命週期並回報有何變化:`presented`、`ending`(其逾時已到)、`removed`(連同其值),以及 `changed`。
- `visible(limit)` 是最新的 `limit` 個未在退出的 toast,加上正在退出的 toast,最舊的在前;`entries()`(Rust 為 `iter()`)是全部;`get(id)`、`len()`、`isEmpty()`。

`ToastMotion` 保存兩者的 token:`duration`(400 ms:進場的期限與堆疊的彈簧回應時間)、`exitDuration`(200 ms)、`collapsedPeek`(14)、`expandedGap`(14)、`collapsedScaleStep`(0.05)與 `collapsedVisible`(3),預設值皆取自 Sonner(Rust 中為 `ToastMotion::sonner()`;TS 中省略的欄位會保留這些值)。

## ToastStack

堆疊的子元素即為其 toast,最舊的在前。從其 `placement` 邊緣(預設為 `"topRight"`;底部錨點向上排版)開始,收合的 toast 彼此相距 `collapsedPeek` 重疊,每多一個就窄 `collapsedScaleStep`,且只會顯示 `collapsedVisible`;展開時則為彼此相距 `expandedGap` 的清單。toast 的到來與離開,以及展開,都以臨界阻尼彈簧移動。當指標在其上或手指按在其上時即為展開(`onExpandedChange({ expanded })`;Rust 為 `ToastStackState`,由 `is_expanded()` 讀取),因此應用程式會在使用者閱讀或觸碰 toast 時暫停逾時。

堆疊由應用程式擺放:放在邊緣的 [Overlay](./overlay.md) 中,位於安全區域內。其 `class` 與 `style` 決定其寬度。當它持有 toast 時,會接收 Escape 與 Android 返回鍵(`onCancel`;`closeOnEscape={false}` 則將它們留給應用程式的其餘部分):關閉最新的 toast。

<a id="toast-1"></a>

## Toast

Toast 是應用程式內容外圍的 `alert` 角色。其 `transitionStatus` 來自管理器,其狀態 class 透過其 `class` 跟隨它:`"starting"` 時,其第一個影格帶有 `startingClass`,使其 `transition` class 從它開始動畫(Tailwind 的 `starting:`,CSS 的 `@starting-style`);`"ending"` 時帶有 `endingClass`,持續退出動畫的時長;指標滑動它時帶有 `swipingClass`(`transition-none` 使其停留在手指下)。

手指或滑鼠朝 `swipeDirection`(預設為 `"right"`;`null` 會關閉滑動)拖曳時會移動它,但要等指標移動之後才開始,因此其按鈕仍然是按鈕;放開時若超過 `swipeThreshold` 點(50)或是快速甩動,它會繼續移出並要求被關閉(`onDismissRequest`),未達則會回到原位。螢幕閱讀器會在其顯示時朗讀其 `accessibilityLabel`。

<a id="toast-props"></a>

## Toast 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | 其生命週期階段。 |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | 無 | 其在第一個影格、退出中、被滑動時的 class。 |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | 其被滑開的方向。 |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | 滑動多遠之後,放開才會要求關閉它。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器在其顯示時朗讀的內容。 |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | 無 | 使用者將其滑開。 |

<a id="toaststack-props"></a>

## ToastStack 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Sonner 的預設值 | 其動態 token。 |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | 其排版所從出發的邊緣。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | 持有 toast 時,接收 Escape 與返回。 |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | 無 | 互動使其展開或收合。 |
| `onCancel` | `.on_cancel(..)` | `() => void` | 無 | Escape 或返回:關閉最新的 toast。 |
