---
title: "AlertDialog"
description: "AlertDialog: l'alert o l'action sheet nativo della piattaforma, mostrato in modo nativo e che restituisce l'azione scelta dall'utente."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog` mostra l'alert o l'action sheet nativo della piattaforma: `UIAlertController` su iOS e Mac Catalyst, un
`AlertDialog` (o una finestra di dialogo con elenco per un action sheet) su Android, e un alert con l'aspetto delle finestre di dialogo della piattaforma sulle
altre piattaforme. `AlertDialog.show` (`alert_dialog()` di `.show()` in Rust) restituisce una promise (un future in Rust) che si risolve con `{ action }`: il `id` dell'azione scelta dall'utente.
Ogni etichetta proviene dall'app, quindi un alert dice ciò che dice la tua app, nella sua lingua.

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

Per le finestre di dialogo con un aspetto personalizzato (una card, uno sheet, un flusso a schermo intero), usa [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

Il risultato è `{ action }` (`AlertDialogResult`): il `id` dell'azione scelta, oppure `null` (`None`) quando la finestra di dialogo si è chiusa
senza un'azione: un tocco al di fuori di essa, Escape o il pulsante Indietro, dove
`closeOnBackdropPress` e `closeOnEscape` lo consentono. Senza azioni la promise viene rifiutata con un `TypeError` (un `Err`
in Rust). In Rust, `nsh_base::alert_dialog()` configura la finestra di dialogo con un metodo per ogni opzione e per ogni azione, nell'ordine
in cui le azioni vengono mostrate, e `.show()` la mostra; attendi la sua risposta in un task (`spawn`).

<a id="action-sheets"></a>

## Action sheet

Un action sheet accetta le stesse opzioni con la presentazione `"actionSheet"`:

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

| Campo | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | nessuno | Sopra la descrizione. |
| `description` | `.description(..)` | `string \| null` | nessuno | Sotto il titolo. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, uno per azione | `AlertDialogAction[]` | obbligatorio | Le azioni, in ordine (almeno una; al massimo tre in un alert Android). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | Un alert al centro, oppure uno sheet di azioni dal basso (una finestra di dialogo con elenco su Android). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` per un alert, `true` per un action sheet | Escape e il pulsante Indietro di Android lo chiudono senza un'azione. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` per un alert, `true` per un action sheet | Un tocco al di fuori lo chiude senza un'azione. |

## AlertDialogResult

| Campo | Rust | Tipo | Descrizione |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | Il `id` dell'azione scelta, oppure `null` quando la finestra di dialogo si è chiusa senza un'azione. |

## AlertDialogAction

| Campo | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `id` | il primo argomento del metodo | `string` | obbligatorio | Ciò che `show` restituisce come `action` quando viene scelta: il nome che l'app le assegna, che resta lo stesso qualunque sia la lingua delle etichette. |
| `label` | il secondo argomento del metodo | `string` | obbligatorio | Ciò che dice. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | Cosa significa: la piattaforma la posiziona e la disegna in base al suo ruolo (un'azione distruttiva è rossa su iOS). |

> [!TIP]
> Poiché il thread principale non attende mai JS o Rust, la finestra di dialogo viene mostrata e gestita in modo nativo, e il tuo codice
> prosegue quando arriva il risultato. Puoi attendere un alert dialog all'interno di qualsiasi gestore di eventi, ad esempio per confermare
> l'uscita da una pagina con [`popOnBack`](./nav-stack.md#leaving-a-page).

<a id="platform-notes"></a>

## Note sulle piattaforme

- **iOS**: `UIAlertController` dispone le azioni. Un'azione con il ruolo `"cancel"` viene collocata dove iOS mette
  le azioni di annullamento, e un action sheet la mostra separata in basso. Su iPad e Mac Catalyst l'action sheet è
  un popover, con un'azione di annullamento senza titolo: un tocco al di fuori lo chiude, e `action` è `null`.
- **Android**: un `AlertDialog` mostra fino a tre azioni, associate in base alla posizione: l'ultima azione è il pulsante
  positivo, quella prima il pulsante negativo, e quella ancora prima il pulsante neutro. Un action sheet è un
  elenco delle azioni in una finestra di dialogo, con un tocco al di fuori o il pulsante Indietro al posto della sua azione di annullamento (`action` è
  allora `null`). La finestra di dialogo con elenco mostra il `title`, oppure il `description` quando lo sheet non ha titolo.
- **Windows, Linux, GPUI e web**: NSH disegna l'alert o l'action sheet con l'aspetto delle finestre di dialogo della piattaforma.
