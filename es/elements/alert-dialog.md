---
title: "AlertDialog"
description: "AlertDialog: la alerta o el action sheet propio de la plataforma, mostrado de forma nativa y respondido con la acción que el usuario eligió."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---


# AlertDialog

`AlertDialog` muestra la alerta o la action sheet propia de la plataforma: `UIAlertController` en iOS y Mac Catalyst, un
`AlertDialog` (o un diálogo de lista para una action sheet) en Android, y una alerta con el aspecto de diálogo de la plataforma en las
demás plataformas. `AlertDialog.show` (`.show()` de `alert_dialog()` en Rust) devuelve una promesa (un future en Rust) que se resuelve con `{ action }`: el `id` de la acción que eligió el usuario.
Todas las etiquetas provienen de la app, así que una alerta dice lo que dice tu app, en su idioma.

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

Para diálogos con un aspecto propio (una tarjeta, una hoja, un flujo a pantalla completa), usa [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

El resultado es `{ action }` (`AlertDialogResult`): el `id` de la acción elegida, o `null` (`None`) cuando el diálogo se cerró
sin ninguna acción: una pulsación fuera de él, Escape o el botón de retroceso, siempre que
`closeOnBackdropPress` y `closeOnEscape` lo permitan. Sin acciones, la promesa se rechaza con un `TypeError` (un `Err`
en Rust). En Rust, `nsh_base::alert_dialog()` configura el diálogo con un método por cada opción y cada acción, en el orden
en que se muestran las acciones, y `.show()` lo muestra; espera su respuesta en una tarea (`spawn`).

<a id="action-sheets"></a>

## Hojas de acciones

Una action sheet admite las mismas opciones con la presentación `"actionSheet"`:

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

| Campo | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | ninguno | Encima de la descripción. |
| `description` | `.description(..)` | `string \| null` | ninguno | Debajo del título. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, uno por acción | `AlertDialogAction[]` | obligatorio | Las acciones, en orden (al menos una; como máximo tres en una alerta de Android). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | Una alerta en el centro, o una hoja de acciones desde la parte inferior (un diálogo de lista en Android). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` para una alerta, `true` para una action sheet | Escape y el botón de retroceso de Android lo cierran sin ninguna acción. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` para una alerta, `true` para una action sheet | Una pulsación fuera de él lo cierra sin ninguna acción. |

## AlertDialogResult

| Campo | Rust | Tipo | Descripción |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | El `id` de la acción elegida, o `null` cuando el diálogo se cerró sin ninguna acción. |

## AlertDialogAction

| Campo | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | el primer argumento del método | `string` | obligatorio | Lo que `show` informa como `action` cuando se elige: el nombre que la app le da, que se mantiene igual sea cual sea el idioma de las etiquetas. |
| `label` | el segundo argumento del método | `string` | obligatorio | Lo que dice. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | Lo que significa: la plataforma la coloca y la dibuja según su rol (una acción destructiva es roja en iOS). |

> [!TIP]
> Como el hilo principal nunca espera a JS ni a Rust, el diálogo se muestra y se responde de forma nativa, y tu código
> continúa cuando llega el resultado. Puedes esperar un diálogo de alerta dentro de cualquier controlador de eventos, por ejemplo para confirmar
> la salida de una página con [`popOnBack`](./nav-stack.md#leaving-a-page).

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: `UIAlertController` dispone las acciones. Una acción con el rol `"cancel"` se coloca donde iOS pone
  las acciones de cancelar, y una action sheet la muestra por separado en su parte inferior. En iPad y Mac Catalyst la action sheet es
  un popover, con una acción de cancelar sin título: una pulsación fuera de él lo cierra, y `action` es `null`.
- **Android**: un `AlertDialog` muestra hasta tres acciones, asignadas por posición: la última acción es el botón
  positivo, la anterior el botón negativo, y la anterior a esa el botón neutro. Una action sheet es una
  lista de las acciones en un diálogo, con una pulsación fuera o el botón de retroceso en lugar de su acción de cancelar (`action` es
  entonces `null`). El diálogo de lista muestra el `title`, o el `description` cuando la hoja no tiene título.
- **Windows, Linux, GPUI y la web**: NSH dibuja la alerta o la action sheet con el aspecto de diálogo de la plataforma.
