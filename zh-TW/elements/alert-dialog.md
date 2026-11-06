---
title: "AlertDialog"
description: "AlertDialog:平台原生的警示對話框或動作表單,以原生方式顯示,並回傳使用者所選擇的動作。"
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog` 會顯示平台原生的警示對話框或動作表單（action sheet）：在 iOS 與 Mac Catalyst 上是 `UIAlertController`，在 Android 上是
`AlertDialog`（動作表單則是清單對話框），在其他平台上則是採用該平台對話框外觀的警示對話框。`AlertDialog.show`（Rust 中為 `alert_dialog()` 的 `.show()`）會回傳一個 promise（Rust 中為 future），並以 `{ action }` 解析：即使用者所選動作的 `id`。
所有標籤都由應用程式提供，因此警示對話框會以應用程式所使用的語言，顯示應用程式所設定的內容。

```rust tabs
use nsh_base::{alert_dialog, button};
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let answer = signal(SharedString::from("–"));
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Delete the photo?")
                .description("This cannot be undone.")
                .cancel("cancel", "Cancel")
                .destructive("delete", "Delete")
                .show()
                .await;
            let deleted = matches!(choice, Ok(r) if r.action.as_deref() == Some("delete"));
            answer.set(if deleted { "deleted" } else { "kept" }.into());
        });
    };
    view()
        .flex_1()
        .p_4()
        .pt(px(48.0))
        .gap_3()
        .child(
            button()
                .on_press(confirm)
                .rounded_lg()
                .bg(rgb(0xdc2626))
                .px_4()
                .py_3()
                .child(text("Delete…").text_color(white()).font_weight(FontWeight::SEMIBOLD)),
        )
        .child(text(answer))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { AlertDialog, Button } from "nsh/base";

function App() {
  const answer = signal("–");
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Delete the photo?",
      description: "This cannot be undone.",
      actions: [
        { label: "Cancel", role: "cancel", id: "cancel" },
        { label: "Delete", role: "destructive", id: "delete" },
      ],
    });
    answer.set(action === "delete" ? "deleted" : "kept");
  };
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 48, gap: 12 }}>
      <Button onPress={confirm} class="rounded-lg bg-red-600 px-4 py-3 active:bg-red-700">
        <Text class="text-center font-semibold text-white">Delete…</Text>
      </Button>
      <Text>{answer()}</Text>
    </View>
  );
}

mount(App);
```

若需要自訂外觀的對話框（卡片、表單、全螢幕流程），請使用 [Dialog](./dialog.md)。

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

結果為 `{ action }`（`AlertDialogResult`）：即所選動作的 `id`；若對話框在未選擇任何動作的情況下關閉，則為 `null`（`None`）。關閉的情形包括：點擊對話框外部、按下 Escape 或返回鍵，前提是 `closeOnBackdropPress` 與 `closeOnEscape` 允許。若沒有任何動作，promise 會以 `TypeError` 拒絕（Rust 中為 `Err`）。在 Rust 中，`nsh_base::alert_dialog()` 會以每個選項、每個動作各一個方法來設定對話框，動作的呼叫順序即為顯示順序，並以 `.show()` 顯示對話框；請在任務（`spawn`）中等待其回應。

## Action sheets

動作表單接受相同的選項，只需使用 `"actionSheet"` 呈現方式：

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

fn share() {
    spawn(async move {
        let choice = alert_dialog()
            .title("Share the photo")
            .action_sheet()
            .action("copy", "Copy link")
            .action("save", "Save")
            .destructive("delete", "Delete")
            .cancel("cancel", "Cancel")
            .show()
            .await;
        match choice.ok().and_then(|r| r.action).as_deref() {
            Some("copy") => { /* … */ }
            Some("save") => { /* … */ }
            Some("delete") => { /* … */ }
            _ => {} // "cancel", or closed without an action.
        }
    });
}
```

```tsx tabs
const { action } = await AlertDialog.show({
  title: "Share the photo",
  presentation: "actionSheet",
  actions: [
    { label: "Copy link", id: "copy" },
    { label: "Save", id: "save" },
    { label: "Delete", role: "destructive", id: "delete" },
    { label: "Cancel", role: "cancel", id: "cancel" },
  ],
});
```

## AlertDialogOptions

| Field | Rust | Type | Default | Description |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | 無 | 顯示在說明文字上方。 |
| `description` | `.description(..)` | `string \| null` | 無 | 顯示在標題下方。 |
| `actions` | `.action(..)`、`.cancel(..)`、`.destructive(..)`，每個動作一個 | `AlertDialogAction[]` | 必填 | 動作清單，依順序排列（至少一個；Android 警示對話框最多三個）。 |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | 顯示於中央的警示對話框，或從底部彈出的動作表單（Android 上為清單對話框）。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | 警示對話框為 `false`，動作表單為 `true` | 按下 Escape 與 Android 返回鍵時，不選擇任何動作即關閉對話框。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | 警示對話框為 `false`，動作表單為 `true` | 點擊對話框外部時，不選擇任何動作即關閉對話框。 |

## AlertDialogResult

| Field | Rust | Type | Description |
|---|---|---|---|
| `action` | `action` | `string \| null`（`Option<SharedString>`） | 所選動作的 `id`；若對話框在未選擇任何動作的情況下關閉，則為 `null`。 |

## AlertDialogAction

| Field | Rust | Type | Default | Description |
|---|---|---|---|---|
| `id` | 方法的第一個引數 | `string` | 必填 | 選取該動作時，`show` 會以 `action` 回報的值：即應用程式為該動作所取的名稱，無論標籤使用哪種語言，此名稱都保持不變。 |
| `label` | 方法的第二個引數 | `string` | 必填 | 顯示的文字內容。 |
| `role` | `.action(..)`、`.cancel(..)`、`.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | 動作的語意：平台會依其角色決定位置與繪製方式（例如在 iOS 上，破壞性動作會顯示為紅色）。 |

> [!TIP]
> 由於主執行緒從不等待 JS 或 Rust，對話框會以原生方式顯示並取得回應，而你的程式碼會在結果送達時繼續執行。你可以在任何事件處理常式中等待警示對話框，例如在離開頁面前以 [`popOnBack`](./nav-stack.md#leaving-a-page) 進行確認。

## Platform notes

- **iOS**：由 `UIAlertController` 負責排列動作。具有 `"cancel"` 角色的動作會被放置在 iOS 擺放取消動作的位置，動作表單則會將它獨立顯示在底部。在 iPad 與 Mac Catalyst 上，動作表單是一個彈出視窗（popover），其取消動作不顯示標題：點擊彈出視窗外部即可關閉，此時 `action` 為 `null`。
- **Android**：`AlertDialog` 最多顯示三個動作，並依位置對應：最後一個動作為 positive 按鈕，前一個為 negative 按鈕，再前一個為 neutral 按鈕。動作表單是對話框中的動作清單，以點擊對話框外部或返回鍵取代取消動作（此時 `action` 為 `null`）。清單對話框會顯示 `title`；若動作表單沒有標題，則顯示 `description`。
- **Windows、Linux、GPUI 與 web**：NSH 會以該平台的對話框外觀繪製警示對話框或動作表單。
