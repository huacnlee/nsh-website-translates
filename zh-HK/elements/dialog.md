---
title: "Dialog"
description: "Dialog 元件:覆蓋於所有其他內容之上的模態介面,適用於全螢幕流程、底部面板(sheet)以及由應用程式自行設定樣式的對話方塊。"
group: base
demo: el-dialog
source_hash: a054e14119bef924
---


# Dialog

Dialog 在應用程式其餘內容之上，以自己的原生視窗層呈現內容：在 iOS 和 Mac Catalyst 上是被呈現的 view controller，在 Android 上是 Dialog，在桌面平台和 web 上則是覆蓋整個視窗的一層。它用於全螢幕流程、sheet 和對話框。系統本身的手勢（向下滑動 sheet、Android 返回按鈕、Escape）都能使用，並由原生層決定處理方式。Rust 用 `nsh_base::dialog()` 建立，TSX 則用從 `nsh/base` 匯入的 `<Dialog>`。

對話框自行負責行為，外觀則交給應用程式：它的樣式用於設定彈出層（容納子元素的 view），而在 TSX 中，`backdropClass` / `backdropStyle` 會在彈出層後面加上背景遮罩。

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

在 TSX 中，當 `open` 不是 `false` 時顯示對話框，變成 `false` 時關閉。在 Rust 中，對話框存在於視圖時呈現，離開視圖時關閉，因此由 `when` 持有它。無論哪種方式，它都會向內容提供對話框的安全區域邊距，內部的 [`env(safe-area-inset-*)`](./safe-area.md) 變數和 `safeAreaInsets()`（Rust 元件中為 `cx.insets()`）都會讀取這些邊距。同樣來自 `nsh/base` 的 [`Button`](./button.md) 是由應用程式設定樣式的按壓目標。

`nsh_core::prelude` 另有一個較舊且已棄用的 `dialog` 函式：請如上所示按名稱匯入 `nsh_base::dialog`，明確的匯入會取代它。如需系統的警示框或 action sheet，請使用 [`AlertDialog`](./alert-dialog.md)。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | 開啟時存在於視圖中（`when(open, ..)`） | `boolean` | `true` | 為 true 時顯示。 |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | 進場和離場的方式。 |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 無 | 以 WGSL shader 取代 `animation` 來進場和離場：`shade(uv)` 將後方內容讀作 `sample_from`，將對話框讀作 `sample_to`，而 `nsh.progress` 會在 `duration` 毫秒內（預設 350）由 0 變到 1，關閉時則由 1 變回 0。當系統要求減少動態效果時，會改用它自己的 `animation`。參閱 [Shader](./shader.md)。 |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | 在 iOS 上的形式：`fullScreen` 以透明背景覆蓋整個螢幕；`pageSheet` 和 `formSheet` 是系統 sheet，後方內容仍然可見（`formSheet` 在大螢幕上是較小的置中 sheet）。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape 和 Android 返回按鈕會以原生方式關閉它。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | 按壓背景遮罩會關閉它。 |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | 向下滑動 sheet（iOS、手機瀏覽器）會以原生方式關閉它。 |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | 無 | iOS 和 Android：對話框開啟期間的狀態列，優先於各頁面的設定（[Status bar](../modules/nsh-base.md#status-bar)）。 |
| `onOpen` | `.on_open(..)` | `() => void` | | 已完成顯示。 |
| `onClose` | `.on_close(..)` | `() => void` | | 已消失：使用者關閉了它，或應用程式移除了它。 |
| `onCancel` | `.on_cancel(..)` | `() => void` | | 使用者嘗試關閉它（Escape、返回、按壓背景遮罩、向下滑動），不論 `closeOn*` 旗標是否允許關閉。 |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | 使用者已關閉它：請在此同步 `open`。在 Rust 中，`on_cancel` 會將對話框從視圖中移除。 |
| `class`、`style` | `Styled` 方法 | `string`、`StyleProp<ViewStyle>` | | 彈出層：容納子元素的 view。 |
| `backdropClass`、`backdropStyle` | 填滿對話框的子視圖 | `string`、`StyleProp<ViewStyle>` | | 填滿對話框、位於彈出層後方的背景遮罩，設定其中任一項時出現。 |
| `children` | `.child(..)` | `JSX.Element` | | 內容。 |

| `ios` 鍵 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | 沿用呈現者的設定 | 對話框允許的方向。 |

| `android` 鍵 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | 內容延伸至狀態列下方；否則從狀態列下方開始。 |

<a id="opening-and-closing"></a>

## 開啟和關閉

對話框的狀態由應用程式持有。當使用者關閉對話框（Escape、Android 返回按鈕、按壓背景遮罩、向下滑動 sheet）時，它會以原生方式關閉並通知應用程式，由應用程式將自己的狀態設為相符：TSX 的 `onOpenChange({ open: false, reason })`，Rust 的 `on_cancel`。在 TSX 中，只要 `open` 保持為 `true`，對話框就會保持關閉，並在 `open` 由 `false` 變為 `true` 時再次開啟。

每個 `closeOn*` 旗標都會在使用者操作時以原生方式讀取，因為主執行緒從不等待應用程式的程式碼。若要在關閉前確認，請將旗標設為 `false`：嘗試關閉時便會呼叫 `onCancel`，再由應用程式自行關閉對話框（TSX 中將 `open` 設為 `false`，Rust 中則將它從視圖中移除）：

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

每次嘗試關閉都會呼叫 `onCancel`，不論旗標是否允許對話框關閉。

<a id="a-dialog-with-a-backdrop"></a>

## 帶背景遮罩的對話框

使用預設 `fullScreen` 呈現方式的對話框會顯示應用程式所繪製的內容：此處是變暗的背景遮罩，以及置中於其上的卡片。按壓背景遮罩即可關閉：

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

如需系統的警示框或 action sheet，請使用來自 `nsh/base` 的 [`AlertDialog`](./alert-dialog.md)。

<a id="ref-methods"></a>

## Ref 方法

無。

<a id="platform-notes"></a>

## 平台說明

- iOS 和 Mac Catalyst：由 `presentation` 決定形式。`fullScreen` 以透明背景在整個螢幕上呈現；`pageSheet` 和 `formSheet` 是使用系統背景的系統 sheet，向下滑動時會跟隨手指（`closeOnSwipe`）。
- Android：對話框填滿視窗，並顯示應用程式的彈出層和背景遮罩。返回按鈕會先交給最上層的對話框處理，然後才輪到 stack 和 `BackHandler` 監聽器。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：對話框是覆蓋整個視窗的透明層，顯示應用程式的彈出層和背景遮罩。Escape 屬於關閉嘗試。
- `supportedOrientations` 屬於 iOS；`statusBarTranslucent` 屬於 Android。除非設定了 `statusBarTranslucent`，否則 Android 對話框的內容會從狀態列下方開始。
