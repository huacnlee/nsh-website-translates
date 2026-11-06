---
title: "AlertDialog"
description: "AlertDialog: o alerta ou action sheet próprio da plataforma, exibido de forma nativa e respondido com a ação escolhida pelo usuário."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---


# AlertDialog

`AlertDialog` exibe o alerta ou action sheet nativo da plataforma: `UIAlertController` no iOS e no Mac Catalyst, um `AlertDialog` (ou um diálogo de lista para um action sheet) no Android, e um alerta no visual de diálogo da plataforma nas demais plataformas. `AlertDialog.show` (o `.show()` de `alert_dialog()` em Rust) retorna uma promise (um future em Rust) que é resolvida com `{ action }`: o `id` da ação escolhida pelo usuário.
Todos os rótulos vêm do app, então um alerta diz o que o seu app diz, no idioma dele.

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

Para diálogos com visual próprio (um card, uma sheet, um fluxo em tela cheia), use [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

O resultado é `{ action }` (`AlertDialogResult`): o `id` da ação escolhida, ou `null` (`None`) quando o diálogo foi fechado
sem uma ação: um toque fora dele, Escape ou o botão voltar, nos casos em que
`closeOnBackdropPress` e `closeOnEscape` permitem. Sem ações, a promise é rejeitada com um `TypeError` (um `Err`
em Rust). Em Rust, `nsh_base::alert_dialog()` configura o diálogo com um método por opção e por ação, na ordem
em que as ações aparecem, e `.show()` o exibe; aguarde a resposta em uma task (`spawn`).

## Action sheets

Um action sheet recebe as mesmas opções com a apresentação `"actionSheet"`:

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

| Campo | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | nenhum | Acima da descrição. |
| `description` | `.description(..)` | `string \| null` | nenhum | Abaixo do título. |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, um por ação | `AlertDialogAction[]` | obrigatório | As ações, em ordem (pelo menos uma; no máximo três em um alerta do Android). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | Um alerta no centro, ou uma sheet de ações vinda da parte inferior (um diálogo de lista no Android). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` para um alerta, `true` para um action sheet | Escape e o botão voltar do Android o fecham sem uma ação. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` para um alerta, `true` para um action sheet | Um toque fora dele o fecha sem uma ação. |

## AlertDialogResult

| Campo | Rust | Tipo | Descrição |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | O `id` da ação escolhida, ou `null` quando o diálogo foi fechado sem uma ação. |

## AlertDialogAction

| Campo | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | o primeiro argumento do método | `string` | obrigatório | O que `show` informa como `action` quando a ação é escolhida: o nome dela no app, que permanece o mesmo independentemente do idioma dos rótulos. |
| `label` | o segundo argumento do método | `string` | obrigatório | O que ela diz. |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | O que ela significa: a plataforma a posiciona e a desenha de acordo com seu papel (uma ação destrutiva fica vermelha no iOS). |

> [!TIP]
> Como a thread principal nunca espera por JS ou Rust, o diálogo é exibido e respondido nativamente, e o seu código
> continua quando o resultado chega. Você pode aguardar um diálogo de alerta dentro de qualquer manipulador de eventos, por exemplo para confirmar
> a saída de uma página com [`popOnBack`](./nav-stack.md#leaving-a-page).

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: `UIAlertController` organiza as ações. Uma ação com o papel `"cancel"` é posicionada onde o iOS coloca
  as ações de cancelamento, e um action sheet a exibe separada, na parte inferior. No iPad e no Mac Catalyst, o action sheet é
  um popover, com uma ação de cancelamento sem título: um toque fora dele o fecha, e `action` é `null`.
- **Android**: um `AlertDialog` exibe até três ações, mapeadas por posição: a última ação é o botão
  positivo, a anterior a ele é o botão negativo, e a anterior a esta é o botão neutro. Um action sheet é uma
  lista das ações em um diálogo, com um toque fora ou o botão voltar no lugar da ação de cancelamento (`action` fica
  então `null`). O diálogo de lista exibe o `title`, ou o `description` quando a sheet não tem título.
- **Windows, Linux, GPUI e web**: o NSH desenha o alerta ou action sheet no visual de diálogo da plataforma.
