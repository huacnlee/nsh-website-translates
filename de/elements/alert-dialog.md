---
title: "AlertDialog"
description: "AlertDialog: der plattformeigene Alert bzw. das plattformeigene Action Sheet, nativ angezeigt und mit der vom Nutzer gewählten Aktion beantwortet."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---


# AlertDialog

`AlertDialog` zeigt den plattformeigenen Alert bzw. Action Sheet an: `UIAlertController` unter iOS und Mac Catalyst, einen
`AlertDialog` (oder einen Listendialog für ein Action Sheet) unter Android und einen Alert im Dialogstil der Plattform auf den
anderen Plattformen. `AlertDialog.show` (`.show()` von `alert_dialog()` in Rust) gibt ein Promise zurück (in Rust ein Future), das mit `{ action }` aufgelöst wird: dem `id` der Aktion, die der Benutzer gewählt hat.
Jedes Label stammt aus der App, ein Alert sagt also genau das, was Ihre App sagt, in deren Sprache.

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

Für Dialoge mit eigenem Aussehen (eine Karte, ein Sheet, ein Vollbild-Ablauf) verwenden Sie [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

Das Ergebnis ist `{ action }` (`AlertDialogResult`): das `id` der gewählten Aktion oder `null` (`None`), wenn der Dialog ohne Aktion geschlossen wurde:
durch einen Tipp außerhalb, Escape oder die Zurück-Taste, sofern `closeOnBackdropPress` und `closeOnEscape` dies erlauben. Ohne Aktionen wird das Promise mit einem `TypeError` abgelehnt (in Rust mit einem `Err`). In Rust richtet `nsh_base::alert_dialog()` den Dialog mit einer Methode pro Option und pro Aktion ein, in der Reihenfolge,
in der die Aktionen angezeigt werden, und `.show()` zeigt ihn an; warten Sie in einem Task auf die Antwort (`spawn`).

## Action sheets

Ein Action Sheet übernimmt dieselben Optionen mit der Präsentation `"actionSheet"`:

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

| Feld | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | keiner | Über der Beschreibung. |
| `description` | `.description(..)` | `string \| null` | keiner | Unter dem Titel. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, eine pro Aktion | `AlertDialogAction[]` | erforderlich | Die Aktionen in ihrer Reihenfolge (mindestens eine; bei einem Android-Alert höchstens drei). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | Ein Alert in der Mitte oder ein Sheet mit Aktionen vom unteren Rand (unter Android ein Listendialog). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` bei einem Alert, `true` bei einem Action Sheet | Escape und die Android-Zurück-Taste schließen den Dialog ohne Aktion. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` bei einem Alert, `true` bei einem Action Sheet | Ein Tipp außerhalb schließt den Dialog ohne Aktion. |

## AlertDialogResult

| Feld | Rust | Typ | Beschreibung |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | Das `id` der gewählten Aktion oder `null`, wenn der Dialog ohne Aktion geschlossen wurde. |

## AlertDialogAction

| Feld | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `id` | das erste Argument der Methode | `string` | erforderlich | Was `show` bei Auswahl als `action` meldet: der Name der App dafür, der unabhängig von der Sprache der Labels gleich bleibt. |
| `label` | das zweite Argument der Methode | `string` | erforderlich | Was sie anzeigt. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | Was sie bedeutet: Die Plattform platziert und zeichnet sie nach ihrer Rolle (eine destruktive Aktion ist unter iOS rot). |

> [!TIP]
> Da der Hauptthread nie auf JS oder Rust wartet, wird der Dialog nativ angezeigt und beantwortet, und Ihr Code
> läuft weiter, sobald das Ergebnis eintrifft. Sie können einen Alert-Dialog in jedem Event-Handler abwarten, zum Beispiel, um das
> Verlassen einer Seite mit [`popOnBack`](./nav-stack.md#leaving-a-page) zu bestätigen.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- **iOS**: `UIAlertController` ordnet die Aktionen an. Eine Aktion mit der Rolle `"cancel"` wird dort platziert, wo iOS
  Abbrechen-Aktionen platziert, und ein Action Sheet zeigt sie getrennt an seinem unteren Rand. Auf dem iPad und unter Mac Catalyst ist das Action Sheet
  ein Popover mit einer Abbrechen-Aktion ohne Titel: Ein Tipp außerhalb schließt es, und `action` ist `null`.
- **Android**: Ein `AlertDialog` zeigt bis zu drei Aktionen an, die nach Position zugeordnet werden: Die letzte Aktion ist der positive
  Button, die davor der negative Button und die davor der neutrale Button. Ein Action Sheet ist eine
  Liste der Aktionen in einem Dialog, wobei ein Tipp außerhalb oder die Zurück-Taste an die Stelle der Abbrechen-Aktion tritt (`action` ist
  dann `null`). Der Listendialog zeigt den `title` oder die `description`, wenn das Sheet keinen Titel hat.
- **Windows, Linux, GPUI und das Web**: NSH zeichnet den Alert bzw. das Action Sheet im Dialogstil der Plattform.
