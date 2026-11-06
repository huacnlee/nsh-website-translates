---
title: "AlertDialog"
description: "AlertDialog : la boîte de dialogue d'alerte ou la feuille d'actions propre à la plateforme, affichée de manière native et renvoyant l'action choisie par l'utilisateur."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog` affiche l'alerte ou la feuille d'actions propre à la plateforme : `UIAlertController` sur iOS et Mac Catalyst, un
`AlertDialog` (ou une boîte de dialogue de type liste pour une feuille d'actions) sur Android, et une alerte dans l'apparence de dialogue de la plateforme sur les
autres plateformes. `AlertDialog.show` (`alert_dialog()` de `.show()` en Rust) renvoie une promesse (un future en Rust) qui se résout avec `{ action }` : le `id` de l'action choisie par l'utilisateur.
Chaque libellé vient de l'application : une alerte dit donc ce que dit votre application, dans sa langue.

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

Pour des dialogues avec une apparence qui vous est propre (une carte, une feuille, un parcours en plein écran), utilisez [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

Le résultat est `{ action }` (`AlertDialogResult`) : le `id` de l'action choisie, ou `null` (`None`) lorsque le dialogue s'est fermé
sans action : un appui en dehors de celui-ci, Échap ou le bouton retour, là où
`closeOnBackdropPress` et `closeOnEscape` le permettent. Sans actions, la promesse est rejetée avec une `TypeError` (une `Err`
en Rust). En Rust, `nsh_base::alert_dialog()` configure le dialogue avec une méthode par option et par action, dans l'ordre
d'affichage des actions, et `.show()` l'affiche ; attendez sa réponse dans une tâche (`spawn`).

<a id="action-sheets"></a>

## Feuilles d'actions

Une feuille d'actions accepte les mêmes options avec la présentation `"actionSheet"` :

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

| Champ | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | aucun | Au-dessus de la description. |
| `description` | `.description(..)` | `string \| null` | aucun | Sous le titre. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, une par action | `AlertDialogAction[]` | obligatoire | Les actions, dans l'ordre (au moins une ; au plus trois dans une alerte Android). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | Une alerte au centre, ou une feuille d'actions depuis le bas (une boîte de dialogue de type liste sur Android). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` pour une alerte, `true` pour une feuille d'actions | Échap et le bouton retour d'Android la ferment sans action. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` pour une alerte, `true` pour une feuille d'actions | Un appui en dehors la ferme sans action. |

## AlertDialogResult

| Champ | Rust | Type | Description |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | Le `id` de l'action choisie, ou `null` lorsque le dialogue s'est fermé sans action. |

## AlertDialogAction

| Champ | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `id` | le premier argument de la méthode | `string` | obligatoire | Ce que `show` renvoie comme `action` lorsqu'elle est choisie : le nom que l'application lui donne, qui reste identique quelle que soit la langue des libellés. |
| `label` | le deuxième argument de la méthode | `string` | obligatoire | Ce qu'elle affiche. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | Ce qu'elle signifie : la plateforme la place et la dessine selon son rôle (une action destructive est rouge sur iOS). |

> [!TIP]
> Comme le thread principal n'attend jamais JS ni Rust, le dialogue est affiché et traité nativement, et votre code
> continue à l'arrivée du résultat. Vous pouvez attendre un dialogue d'alerte dans n'importe quel gestionnaire d'événements, par exemple pour confirmer
> la sortie d'une page avec [`popOnBack`](./nav-stack.md#leaving-a-page).

<a id="platform-notes"></a>

## Notes par plateforme

- **iOS** : `UIAlertController` organise les actions. Une action avec le rôle `"cancel"` est placée là où iOS met les
  actions d'annulation, et une feuille d'actions l'affiche séparément en bas. Sur iPad et Mac Catalyst, la feuille d'actions est
  une popover, avec une action d'annulation sans titre : un appui en dehors la ferme, et `action` vaut `null`.
- **Android** : un `AlertDialog` affiche jusqu'à trois actions, associées selon leur position : la dernière action est le bouton
  positif, celle d'avant le bouton négatif, et celle d'avant le bouton neutre. Une feuille d'actions est une
  liste des actions dans une boîte de dialogue, avec un appui en dehors ou le bouton retour à la place de son action d'annulation (`action` vaut
  alors `null`). La boîte de dialogue de type liste affiche le `title`, ou le `description` lorsque la feuille n'a pas de titre.
- **Windows, Linux, GPUI et le web** : NSH dessine l'alerte ou la feuille d'actions dans l'apparence de dialogue de la plateforme.
