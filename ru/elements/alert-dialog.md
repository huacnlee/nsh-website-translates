---
title: "AlertDialog"
description: "AlertDialog: собственный алерт или лист действий платформы, который отображается нативно и возвращает действие, выбранное пользователем."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog` показывает системное окно предупреждения или лист действий платформы: `UIAlertController` на iOS и Mac Catalyst, `AlertDialog` (или диалог со списком для листа действий) на Android и предупреждение в стиле диалогов платформы на остальных платформах. `AlertDialog.show` (`.show()` из `alert_dialog()` в Rust) возвращает промис (в Rust — future), который завершается значением `{ action }`: `id` действия, выбранного пользователем.
Все подписи задаёт приложение, поэтому предупреждение говорит то, что говорит ваше приложение, на его языке.

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

Для диалогов с собственным внешним видом (карточка, лист, полноэкранный сценарий) используйте [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

Результат — `{ action }` (`AlertDialogResult`): `id` выбранного действия или `null` (`None`), если диалог закрыли без выбора действия: нажатием вне него, клавишей Escape или кнопкой «Назад», если это разрешают `closeOnBackdropPress` и `closeOnEscape`. Если действий нет, промис отклоняется с `TypeError` (в Rust — `Err`). В Rust `nsh_base::alert_dialog()` настраивает диалог отдельным методом для каждой опции и каждого действия, в том порядке, в котором действия отображаются, а `.show()` показывает его; ответ ожидайте в задаче (`spawn`).

<a id="action-sheets"></a>

## Листы действий

Лист действий принимает те же опции с режимом отображения `"actionSheet"`:

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

| Поле | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | нет | Над описанием. |
| `description` | `.description(..)` | `string \| null` | нет | Под заголовком. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, по одному на действие | `AlertDialogAction[]` | обязательно | Действия по порядку (не менее одного; в предупреждении на Android не более трёх). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | Предупреждение посередине или лист действий снизу (на Android — диалог со списком). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` для предупреждения, `true` для листа действий | Escape и кнопка «Назад» на Android закрывают диалог без выбора действия. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` для предупреждения, `true` для листа действий | Нажатие вне диалога закрывает его без выбора действия. |

## AlertDialogResult

| Поле | Rust | Тип | Описание |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | `id` выбранного действия или `null`, если диалог закрыли без выбора действия. |

## AlertDialogAction

| Поле | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `id` | первый аргумент метода | `string` | обязательно | То, что `show` возвращает как `action` при выборе этого действия: имя действия в приложении, которое не меняется независимо от языка подписей. |
| `label` | второй аргумент метода | `string` | обязательно | Что на нём написано. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | Что оно означает: платформа размещает и рисует действие в соответствии с его ролью (деструктивное действие на iOS красного цвета). |

> [!TIP]
> Поскольку главный поток никогда не ждёт JS или Rust, диалог показывается и обрабатывается нативно, а ваш код продолжает работу, когда приходит результат. Вы можете ожидать диалог предупреждения внутри любого обработчика событий, например чтобы подтвердить уход со страницы с помощью [`popOnBack`](./nav-stack.md#leaving-a-page).

<a id="platform-notes"></a>

## Особенности платформ

- **iOS**: `UIAlertController` располагает действия. Действие с ролью `"cancel"` размещается там, где iOS помещает действия отмены, а лист действий показывает его отдельно внизу. На iPad и Mac Catalyst лист действий отображается как popover с безымянным действием отмены: нажатие вне него закрывает его, а `action` равно `null`.
- **Android**: `AlertDialog` показывает до трёх действий, сопоставляемых по позиции: последнее действие — положительная кнопка, предыдущее — отрицательная, а то, что перед ним, — нейтральная. Лист действий — это список действий в диалоге, где вместо действия отмены используются нажатие вне диалога или кнопка «Назад» (`action` тогда равно `null`). Диалог со списком показывает `title`, а если у листа нет заголовка — `description`.
- **Windows, Linux, GPUI и web**: NSH рисует предупреждение или лист действий в стиле диалогов платформы.
