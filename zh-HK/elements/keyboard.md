---
title: "鍵盤"
description: "keyboard-inset-height 環境變數、Keyboard.dismiss 以及鍵盤高度:讓內容保持在軟件鍵盤上方,並隨鍵盤一同移動。"
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---


# 鍵盤

`env(keyboard-inset-height)` 是軟件鍵盤在 surface 上方的高度，鍵盤隱藏時為 0。把它用作 view 的底部 padding 或 margin，可令內容保持在鍵盤之上：鍵盤顯示或隱藏時，view 會按鍵盤的高度騰出空間，而且這個變化會以原生方式配合鍵盤一同播放動畫。它適用於 scroll view 以外的內容，例如聊天畫面底部的訊息列；位於 [scroll view](./scroll.md) 或 [List](./list.md) 內的輸入欄位，則會以原生方式自動捲動到可見位置。與它搭配的有 `Keyboard.dismiss()`（用來隱藏鍵盤）和鍵盤高度，可用於自行設計的版面。

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

完整的鍵盤高度適合延伸至螢幕底部的 view，例如整個畫面的內容。如果 view 下方還有其他元素（例如 tab bar），就要用一個長度值把那部分減去：`calc(env(keyboard-inset-height) + -49px)` 可令 view 保持在 49 pt 的 tab bar 之上，而 `calc(env(keyboard-inset-height) + 12px)` 則會在鍵盤上方加入間距。padding 最小為 0。

<a id="padding-or-margin"></a>

## Padding 或 margin

| 樣式 | 騰出空間的方式 |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"`（Tailwind `pb-[env(keyboard-inset-height)]`，Rust `.pb_keyboard()`） | 上方的內容會縮小；背景仍然延伸至螢幕底部。 |
| `marginBottom: "env(keyboard-inset-height)"`（Tailwind `mb-[env(keyboard-inset-height)]`，Rust `.mb_keyboard()`） | 整個 view（包括背景）終止於鍵盤頂部。 |

鍵盤高度只會加到同一個宣告內的長度值上，所以 view 若要把它與自己的間距結合，須在 `calc()` 中處理。在 Rust 中，`.pb_keyboard_plus(px(..))` 和 `.mb_keyboard_plus(px(..))` 可加上一個長度值。

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

在這個例子中，view 下方的 49 pt tab bar 已經遮住了部分鍵盤高度。如要停用騰出空間的效果，只需在樣式中不使用該變數，例如以 signal 作為條件。

<a id="hiding-the-keyboard"></a>

## 隱藏鍵盤

來自 `nsh` 的 `Keyboard.dismiss()` 會令目前取得焦點的輸入欄位失去焦點，從而隱藏鍵盤。如果沒有任何輸入欄位取得焦點，則一切維持不變。Rust 元件則呼叫 `dismiss_keyboard()`。

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
> 如要在使用者拖曳 scroll view 時隱藏鍵盤，請在 [scroll view](./scroll.md) 或 [List](./list.md) 上設定 `keyboardDismissMode="on-drag"` 或 `"interactive"`。

<a id="the-keyboards-height"></a>

## 鍵盤高度

| TSX | Rust | 回傳值 |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`、`keyboard_duration()` | 軟件鍵盤在 NSH surface 上方的高度（以 point 為單位，隱藏時為 0），以及其顯示或隱藏動畫的時長（以毫秒為單位）。 |

兩者都是響應式的：讀取它們的 effect、JSX 表達式或樣式 closure，會在鍵盤顯示、隱藏或高度改變時重新執行。

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

這個高度是指鍵盤與 NSH surface 重疊的部分。當視窗本身因鍵盤而縮小（例如會調整大小的 Android activity），或 NSH 嵌入在一個終止於鍵盤上方的 view 中時，高度為 0。

> [!NOTE]
> 如要令內容保持在鍵盤之上，`env(keyboard-inset-height)` 是更簡單的做法：它無需執行程式碼，便能以原生方式配合鍵盤播放動畫。

<a id="platform-notes"></a>

## 平台備註

- **iOS**：騰出空間的動畫會採用鍵盤本身的時長，以及 ease-in-ease-out 曲線。
- **Android**：如果視窗會因鍵盤而縮小（會調整大小的 activity），內容本來就終止於鍵盤上方，變數為 0。如果鍵盤覆蓋在 view 上方，則會像 iOS 一樣騰出空間。
- **桌面平台和 Mac Catalyst** 使用實體鍵盤輸入：變數為 0，view 會保持原有版面。
- **Web**：變數採用瀏覽器本身的（即 VirtualKeyboard API 的）值。

有關焦點順序、return 鍵和輸入附件，請參閱 [Forms and keyboard](../docs/forms-and-keyboard.md)；有關其他環境變數，請參閱 [Safe area](./safe-area.md)。
