---
title: "AlertDialog"
description: "AlertDialog:平台原生的警示對話框或動作表單,以原生方式顯示,並回傳使用者所選擇的操作。"
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---


# AlertDialog

`AlertDialog` 會顯示平台原生的警示對話框或動作表單（action sheet）：在 iOS 和 Mac Catalyst 上使用 `UIAlertController`，在 Android 上使用 `AlertDialog`（動作表單則使用清單對話框），在其他平台上則以該平台的對話框外觀顯示警示。`AlertDialog.show`（Rust 中為 `alert_dialog()` 的 `.show()`）會傳回一個 promise（Rust 中為 future），並以 `{ action }` 完成：即使用者所選動作的 `id`。
所有標籤均由應用程式提供，因此警示會以你的應用程式所用的語言顯示你的應用程式想說的內容。

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

如果需要自訂外觀的對話框（卡片、表單或全螢幕流程），請使用 [Dialog](./dialog.md)。

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

結果為 `{ action }`（`AlertDialogResult`）：即所選動作的 `id`；如果對話框在沒有選擇任何動作的情況下關閉，則為 `null`（`None`）。這些情況包括：在對話框外按一下、按 Escape 鍵或返回鍵（在 `closeOnBackdropPress` 和 `closeOnEscape` 允許的情況下）。如果沒有任何動作，promise 會以 `TypeError` 拒絕（Rust 中為 `Err`）。在 Rust 中，`nsh_base::alert_dialog()` 會為每個選項和每個動作各提供一個方法來設定對話框，動作按顯示順序排列，再由 `.show()` 顯示對話框；請在任務（`spawn`）中等待其回應。

## Action sheets

動作表單使用相同的選項，但採用 `"actionSheet"` 呈現方式：

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
| `actions` | `.action(..)`、`.cancel(..)`、`.destructive(..)`，每個動作一個 | `AlertDialogAction[]` | 必填 | 動作，按順序排列（至少一個；Android 警示最多三個）。 |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | 顯示在中間的警示，或從底部彈出的動作表單（在 Android 上為清單對話框）。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | 警示為 `false`，動作表單為 `true` | 按 Escape 鍵和 Android 返回鍵會在不選擇任何動作的情況下關閉對話框。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | 警示為 `false`，動作表單為 `true` | 在對話框外按一下會在不選擇任何動作的情況下關閉對話框。 |

## AlertDialogResult

| Field | Rust | Type | Description |
|---|---|---|---|
| `action` | `action` | `string \| null`（`Option<SharedString>`） | 所選動作的 `id`；如果對話框在沒有選擇任何動作的情況下關閉，則為 `null`。 |

## AlertDialogAction

| Field | Rust | Type | Default | Description |
|---|---|---|---|---|
| `id` | 方法的第一個參數 | `string` | 必填 | 選擇該動作時，`show` 會以 `action` 回報的內容：即應用程式為它取的名稱，無論標籤使用哪種語言，此名稱都保持不變。 |
| `label` | 方法的第二個參數 | `string` | 必填 | 動作所顯示的文字。 |
| `role` | `.action(..)`、`.cancel(..)`、`.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | 動作的含義：平台會根據其角色決定位置和外觀（在 iOS 上，破壞性動作會以紅色顯示）。 |

> [!TIP]
> 由於主執行緒從不等待 JS 或 Rust，對話框會以原生方式顯示並取得回應，而你的程式碼會在結果送達後繼續執行。你可以在任何事件處理器中 await 警示對話框，例如在離開頁面前進行確認，請參閱 [`popOnBack`](./nav-stack.md#leaving-a-page)。

## Platform notes

- **iOS**：`UIAlertController` 負責排列動作。具有 `"cancel"` 角色的動作會放置在 iOS 放置取消動作的位置，而動作表單會將它單獨顯示在底部。在 iPad 和 Mac Catalyst 上，動作表單是彈出視窗（popover），並設有無標題的取消動作：在視窗外按一下即可關閉，此時 `action` 為 `null`。
- **Android**：`AlertDialog` 最多顯示三個動作，並按位置對應：最後一個動作是正面按鈕（positive button），前一個是負面按鈕（negative button），再前一個是中性按鈕（neutral button）。動作表單是對話框中的動作清單，以在對話框外按一下或按返回鍵取代取消動作（此時 `action` 為 `null`）。清單對話框會顯示 `title`；如果動作表單沒有標題，則顯示 `description`。
- **Windows、Linux、GPUI 和網頁**：NSH 會以平台的對話框外觀繪製警示或動作表單。
