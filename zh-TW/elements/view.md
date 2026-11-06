---
title: "View"
description: "基本容器元素：版面配置、背景、邊框、陰影、按壓處理與手勢。"
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` 是每個畫面的基本構件:一個原生容器(在 iOS 與 Mac Catalyst 上是 UIView,在 Android 上是 ViewGroup),以 flexbox 或 grid 排列其子元件、繪製背景、邊框、陰影與漸層,並處理按壓。按鈕、卡片、列與畫面都是 view。Rust 使用 `view()` 建立,TSX 則使用來自 `nsh` 的 `<View>`。

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

<a id="layout"></a>

## 版面配置

View 以 flexbox 排列其子元件,預設值如下:`flexDirection: "column"`、`flexShrink: 0`、`alignContent: "flex-start"`、`position: "relative"`。`display: "grid"`(Rust 中為 `.grid()`)會切換為 CSS grid,`display: "block"` 則切換為區塊版面。尺寸單位為 point。請參閱 [layout](../docs/layout.md) 與 [style reference](../modules/style-reference.md)。

`display: "flex"` 遵循 CSS:在 style 中、作為 `flex` class,以及 Rust 的 `.flex()` 時,除非設定了方向(`flexDirection: "column"`、`flex-col`、`.flex_col()`),否則為橫列。未設定 display 的 view 會將其子元件以直欄方式堆疊。

## Props

`View` 有一個專屬的 prop:`selectable`(Rust 中為 `.selectable(true)`),讓 view 內的文字作為單一選取範圍一起被選取([Text selection](./text-selection.md))。其餘為[通用 props](./index.md#common-props):樣式(`style`、`class`、`classList`;Rust 中為 `Styled` 方法)、`disabled`、按壓 props(`onPress`、`onLongPress`、`onPressDown`、`onPressUp`、`delayLongPress`、`hitSlop`)、狀態樣式(`activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle`、`checkedStyle`)、`onMouseEnter` / `onMouseMove` / `onMouseLeave`、`onContextMenu`、`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`、`focusable`、`onLayout`、`ref`、`nativeID`、`testID`、手勢 props(`pan`、`pinch`、`rotation` 及其事件)、觸控與 responder props、無障礙 props,以及 `ios` / `android` / `desktop`。

<a id="selectable-views"></a>

## 可選取的 View

設定 `selectable` 後,選取範圍會依閱讀順序跨越 view 內的 [`Text`](./text.md) 元素與 [`TextView`](./text-view.md);設定 `selectable={false}` 的文字不會被納入,而位於另一個可選取 view 內的可選取 view 會成為外層 view 的一部分。各平台上的手勢請參閱 [Text selection](./text-selection.md)。

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## 按壓回饋

可按壓的 view 是指任何具有按壓處理函式的 view。其回饋由應用程式定義:按壓期間套用的樣式,會在手指按下時於原生端直接套用,無需往返應用程式程式碼。`hoverStyle`、`focusStyle` 與 `disabledStyle` 對其他狀態的作用相同:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

在 Android 上,`android={{ ripple: { color: "#0000001f" } }}`(Rust 中為 `.ripple(Ripple { .. })`)會加入 Material 漣漪效果(可用 `borderless`、`radius` 與 `foreground` 調整)。

`disabled` 會從原生 view 移除按壓監聽器(無法按壓、無回饋),並套用停用樣式:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

<a id="events"></a>

## 事件

| 事件 | Rust | Payload | 時機 |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent`(Rust 中無) | 點按在 view 內結束。 |
| `onLongPress` | `.on_long_press` | `PressEvent`(Rust 中無) | 手指持續按住 `delayLongPress`(500 ms)。 |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent`(Rust 中無) | 手指按下 / 抬起或移出。 |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | 滑鼠移入 view(或其內部的 view)/ 離開 view 或視窗([hover](./index.md#hover));`onMouseLeave` 的值為滑鼠最後所在的位置。 |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | 滑鼠在 view(或其內部的 view)上移動(無論是否按住按鍵),或滑鼠停留其上且未按住任何按鍵時,修飾鍵被按下或放開:`position`、`pagePosition`(`Point`)、`modifiers` 與 `pressedButton`(`"left"`、`"right"`、`"middle"`、`"back"`、`"forward"` 或 `null`);每個影格最多觸發一次。 |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | 在 view 上按下次要按鍵([context menus](./index.md#context-menus))。 |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | 無 | 本機檔案拖曳進入 / 離開作用中的桌面目的地。 |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }`(`FileDropEvent`) | 本機檔案或目錄被放到桌面目的地上。 |
| `onLayout` | `.on_layout` | `{ bounds }`(`Bounds<Points>`) | 相對於父層的 frame 發生變化。 |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | 以 `pan` 綁定的拖曳開始 / 結束;系統取消時 `cancelled` 為 true。 |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | 以 `pinch` 綁定的捏合開始 / 結束。 |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | 以 `rotation` 綁定的旋轉開始 / 結束。 |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | 自訂的無障礙動作已執行。 |

觸控與 responder 事件:請參閱[通用 props](./index.md#raw-touches-and-the-responder-system)。

<a id="desktop-file-drops"></a>

## 桌面檔案拖放

在 AppKit、GTK、Win32 與 GPUI 上,設定 `onFileDrop` 的 view 可接收從其他應用程式拖入的本機檔案與目錄。`onFileDragEnter` 與 `onFileDragLeave` 用於追蹤作用中的目的地;`onFileDrop` 會依原生檔案清單的順序接收 `{ uris: string[] }`。每個項目都是絕對的 `file:` URL,其中的空格與非 ASCII 字元皆已跳脫。請解析該 URL 以取得檔案系統路徑,而不要手動移除前綴。

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

最接近且已啟用、並監聽 `onFileDrop` 的祖先 view 會接收放下的檔案。modal 根節點會限定此搜尋範圍。`disabled` 會移除檔案拖放監聽器;離開、取消、完成與目的地移除都會清除作用中狀態。接受時使用 Copy 操作與已掛載的原生狀態。是否讀取、開啟或傳輸所接收的檔案,由應用程式決定。

<a id="ref-methods"></a>

## Ref 方法

一般 view 的 ref 是 `ViewRef`:`focus()`、`blur()` 與 `measure()`。`ref`(Rust 中為 `.element_ref(&handle)`)會提供其節點,例如可傳給 `setAccessibilityFocus`([`nsh` 的無障礙 API](../modules/nsh.md#accessibility)),或用來測量該節點(Rust 中為 `handle.measure()`)。

<a id="views-inside-text"></a>

## 文字內的 View

放在文字內的 view 是行內附件:它位於基線上、隨文字一起換行,並且可獨立接收按壓。請參閱 [text](./text.md#inline-views-and-images)。

<a id="platform-notes"></a>

## 平台注意事項

- `boxShadow` 在所有平台上皆會繪製;`android={{ elevation }}` 則改為使用 Android 的 Material 陰影。在 Android 上,陰影需要背景色(背景透明的 view 不會產生陰影)。
- View 上的 `filter`:iOS 支援 `opacity()`、最大為 1 的 `brightness()` 以及 `drop-shadow()`(圖片支援所有色彩濾鏡與 `blur()`);Android 自 API 31 起支援全部,更低版本則僅支援色彩濾鏡。
- `backdropFilter: "blur(…)"` 在 iOS 上是系統材質(近似效果),在 Android 上需要 API 31。
- Android 會繪製 `translate`、`scale` 與 `rotate` 轉換;傾斜(`skew()`、`skewX()`、`skewY()`)則適用於其他平台。
- `borderCurve: "continuous"`(`.border_curve(BorderCurve::Continuous)`)會繪製與邊緣平滑銜接的圓角(如同 iOS 應用程式圖示),兩個平台皆支援。
- `cursor` 樣式會套用於有指標裝置的環境(Mac Catalyst、搭配指標裝置的 iPad、桌面平台)。
