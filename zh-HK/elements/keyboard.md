---
title: "鍵盤"
description: "keyboard-inset-height 環境變數、Keyboard.dismiss 與鍵盤高度:讓內容保持在軟體鍵盤上方,並隨鍵盤一同移動。"
order: 120
group: primitives
demo: el-keyboard
---

# 鍵盤

`env(keyboard-inset-height)` 是軟體鍵盤在畫面表面上方的高度，鍵盤隱藏時為 0。將它用作 view 的底部 padding 或 margin，可讓內容保持在鍵盤上方：當鍵盤顯示或隱藏時，view 會依鍵盤的高度騰出空間，且這項變化會以原生方式與鍵盤同步動畫。它適用於捲動檢視之外的內容，例如聊天畫面底部的訊息列；位於[捲動檢視](./scroll.md)或 [List](./list.md) 內的輸入欄位，則會以原生方式捲動至可見範圍。與它搭配的還有用來隱藏鍵盤的 `Keyboard.dismiss()`，以及鍵盤高度本身，可用於您自訂的版面配置。

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

完整的鍵盤高度適用於延伸至螢幕底部的 view，例如整個畫面的內容。當 view 下方還有其他元素（例如分頁列）時，請以長度值將其扣除：`calc(env(keyboard-inset-height) + -49px)` 會讓 view 保持在 49 pt 分頁列的上方，而 `calc(env(keyboard-inset-height) + 12px)` 則會在鍵盤上方加入間距。padding 最小為 0。

<a id="padding-or-margin"></a>

## Padding 或 margin

| 樣式 | 騰出空間的方式 |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"`（Tailwind `pb-[env(keyboard-inset-height)]`，Rust `.pb_keyboard()`） | 上方的內容會縮小；背景仍會延伸至螢幕底部。 |
| `marginBottom: "env(keyboard-inset-height)"`（Tailwind `mb-[env(keyboard-inset-height)]`，Rust `.mb_keyboard()`） | 整個 view（包含其背景）會在鍵盤頂端結束。 |

鍵盤的高度只會加到同一個宣告中的長度上，因此 view 若要將它與自身的間距結合，請在 `calc()` 中處理。在 Rust 中，可使用 `.pb_keyboard_plus(px(..))` 與 `.mb_keyboard_plus(px(..))` 來加上長度。

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

在此範例中，view 下方的 49 pt 分頁列已經遮住了一部分的鍵盤高度。若要關閉騰出空間的行為，請不要在樣式中使用該變數，例如依據 signal 設定條件。

<a id="hiding-the-keyboard"></a>

## 隱藏鍵盤

來自 `nsh` 的 `Keyboard.dismiss()` 會讓目前取得焦點的輸入欄位失去焦點，進而隱藏鍵盤。若沒有任何輸入欄位取得焦點，則不會有任何變動。Rust 元件則呼叫 `dismiss_keyboard()`。

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> 若要在使用者拖曳捲動檢視時隱藏鍵盤，請在[捲動檢視](./scroll.md)或 [List](./list.md) 上設定 `keyboardDismissMode="on-drag"` 或 `"interactive"`。

<a id="the-keyboards-height"></a>

## 鍵盤的高度

| TSX | Rust | 傳回值 |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`、`keyboard_duration()` | 軟體鍵盤在 NSH 畫面表面上方的高度（以點為單位，隱藏時為 0），以及其顯示或隱藏動畫的持續時間（以毫秒為單位）。 |

兩者皆為響應式：當鍵盤顯示、隱藏或高度改變時，讀取它們的 effect、JSX 運算式或樣式 closure 都會重新執行。

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

此高度是指鍵盤與 NSH 畫面表面重疊的部分。當視窗本身因鍵盤而縮小（例如會調整大小的 Android activity），或 NSH 嵌入在終止於鍵盤上方的 view 中時，高度為 0。

> [!NOTE]
> 若要讓內容保持在鍵盤上方，`env(keyboard-inset-height)` 是更簡單的做法：它會以原生方式與鍵盤同步動畫，且無需執行程式碼。

<a id="platform-notes"></a>

## 平台說明

- **iOS**：騰出的空間會以鍵盤本身的持續時間與 ease-in-ease-out 曲線進行動畫。
- **Android**：當視窗因鍵盤而縮小（會調整大小的 activity）時，內容本來就會在鍵盤上方結束，此變數為 0。當鍵盤覆蓋在 view 上方時，其騰出空間的方式與 iOS 相同。
- **桌面平台與 Mac Catalyst** 使用實體鍵盤輸入：此變數為 0，view 會維持原有的版面配置。
- **Web**：此變數為瀏覽器本身提供的變數（即 VirtualKeyboard API 的變數）。

關於焦點順序、return 鍵與輸入附屬工具列，請參閱[表單與鍵盤](../docs/forms-and-keyboard.md)；關於其他環境變數，請參閱[安全區域](./safe-area.md)。
