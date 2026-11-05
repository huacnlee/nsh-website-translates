---
title: "AlertDialog"
description: "AlertDialog: 플랫폼 자체의 알림 또는 액션 시트를 네이티브로 표시하고, 사용자가 선택한 동작을 응답으로 반환합니다."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog`는 플랫폼 고유의 알림(alert) 또는 액션 시트(action sheet)를 표시합니다. iOS와 Mac Catalyst에서는 `UIAlertController`, Android에서는 `AlertDialog`(액션 시트의 경우 목록 대화상자), 그 밖의 플랫폼에서는 해당 플랫폼의 대화상자 모양을 따르는 알림을 사용합니다. `AlertDialog.show`(Rust에서는 `alert_dialog()`의 `.show()`)는 사용자가 선택한 액션의 `id`인 `{ action }`로 resolve되는 promise(Rust에서는 future)를 반환합니다.
모든 레이블은 앱에서 제공하므로, 알림에는 앱이 지정한 문구가 앱의 언어로 표시됩니다.

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

앱 고유의 모양이 필요한 대화상자(카드, 시트, 전체 화면 플로우)에는 [Dialog](./dialog.md)를 사용하세요.

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

결과는 `{ action }`(`AlertDialogResult`)입니다. 선택한 액션의 `id`이며, 액션 없이 대화상자가 닫힌 경우에는 `null`(`None`)입니다. 액션 없이 닫히는 경우는 대화상자 바깥을 누르거나 Escape 또는 뒤로 가기 버튼을 누르는 경우이며, `closeOnBackdropPress`와 `closeOnEscape`이 이를 허용할 때에 한합니다. 액션이 없으면 promise는 `TypeError`(Rust에서는 `Err`)로 reject됩니다. Rust에서는 `nsh_base::alert_dialog()`가 옵션별, 액션별 메서드로 대화상자를 구성하며, 액션은 표시되는 순서대로 지정합니다. `.show()`는 대화상자를 표시합니다. 응답은 태스크(`spawn`) 안에서 await하세요.

<a id="action-sheets"></a>

## 액션 시트

액션 시트는 `"actionSheet"` 프레젠테이션과 함께 동일한 옵션을 받습니다.

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

| 필드 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | 없음 | 설명 위에 표시됩니다. |
| `description` | `.description(..)` | `string \| null` | 없음 | 제목 아래에 표시됩니다. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, 액션마다 하나씩 | `AlertDialogAction[]` | 필수 | 액션 목록이며 순서대로 표시됩니다(최소 하나, Android 알림에서는 최대 세 개). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | 가운데에 표시되는 알림, 또는 아래에서 올라오는 액션 시트(Android에서는 목록 대화상자). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | 알림은 `false`, 액션 시트는 `true` | Escape와 Android 뒤로 가기 버튼으로 액션 없이 닫을 수 있습니다. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | 알림은 `false`, 액션 시트는 `true` | 대화상자 바깥을 눌러 액션 없이 닫을 수 있습니다. |

## AlertDialogResult

| 필드 | Rust | 타입 | 설명 |
|---|---|---|---|
| `action` | `action` | `string \| null`(`Option<SharedString>`) | 선택한 액션의 `id`이며, 액션 없이 대화상자가 닫힌 경우에는 `null`입니다. |

## AlertDialogAction

| 필드 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | 메서드의 첫 번째 인자 | `string` | 필수 | 해당 액션이 선택되었을 때 `show`가 `action`로 보고하는 값입니다. 앱에서 그 액션에 붙이는 이름으로, 레이블이 어떤 언어이든 동일하게 유지됩니다. |
| `label` | 메서드의 두 번째 인자 | `string` | 필수 | 액션에 표시되는 문구입니다. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | 액션의 의미입니다. 플랫폼이 역할에 따라 액션의 위치와 모양을 정합니다(iOS에서 destructive 액션은 빨간색입니다). |

> [!TIP]
> 메인 스레드는 JS나 Rust를 기다리지 않으므로, 대화상자는 네이티브에서 표시되고 응답을 받으며, 코드는 결과가 도착하면 이어서 실행됩니다. 어떤 이벤트 핸들러 안에서든 알림 대화상자를 await할 수 있습니다. 예를 들어 [`popOnBack`](./nav-stack.md#leaving-a-page)로 페이지를 떠나기 전에 확인을 받을 때 사용할 수 있습니다.

<a id="platform-notes"></a>

## 플랫폼별 참고

- **iOS**: `UIAlertController`가 액션을 배치합니다. `"cancel"` 역할의 액션은 iOS가 취소 액션을 두는 위치에 배치되며, 액션 시트에서는 맨 아래에 따로 표시됩니다. iPad와 Mac Catalyst에서 액션 시트는 제목 없는 취소 액션이 있는 팝오버입니다. 팝오버 바깥을 탭하면 닫히며, 이때 `action`는 `null`입니다.
- **Android**: `AlertDialog`는 최대 세 개의 액션을 위치에 따라 매핑하여 표시합니다. 마지막 액션이 positive 버튼, 그 앞의 액션이 negative 버튼, 그 앞의 액션이 neutral 버튼이 됩니다. 액션 시트는 대화상자 안의 액션 목록이며, 취소 액션 대신 바깥을 탭하거나 뒤로 가기 버튼을 사용합니다(이때 `action`는 `null`). 목록 대화상자에는 `title`이 표시되며, 시트에 제목이 없으면 `description`이 표시됩니다.
- **Windows, Linux, GPUI, 웹**: NSH가 해당 플랫폼의 대화상자 모양으로 알림 또는 액션 시트를 그립니다.
