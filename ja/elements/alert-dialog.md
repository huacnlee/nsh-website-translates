---
title: "AlertDialog"
description: "AlertDialog: プラットフォーム標準のアラートまたはアクションシートをネイティブに表示し、ユーザーが選択したアクションを返します。"
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog` は、プラットフォーム標準のアラートまたはアクションシートを表示します。iOS と Mac Catalyst では `UIAlertController`、Android では
`AlertDialog`(アクションシートの場合はリストダイアログ)、その他のプラットフォームではプラットフォームのダイアログの外観に合わせたアラートが使われます。`AlertDialog.show`(Rust では `alert_dialog()` の `.show()`)は、ユーザーが選択したアクションの `id` である `{ action }` で解決される promise(Rust では future)を返します。
ラベルはすべてアプリ側から渡されるため、アラートにはアプリが指定した内容が、アプリの言語で表示されます。

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

独自の外観を持つダイアログ(カード、シート、全画面フローなど)には、[Dialog](./dialog.md) を使用してください。

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

結果は `{ action }`(`AlertDialogResult`)です。選択されたアクションの `id` になります。アクションが選択されずにダイアログが閉じられた場合は `null`(`None`)になります。これには、ダイアログ外のタップ、Escape キーまたは戻るボタンによる終了が含まれ、`closeOnBackdropPress` と `closeOnEscape` で許可されている場合に限ります。アクションがない場合、promise は `TypeError`(Rust では `Err`)で reject されます。Rust では、`nsh_base::alert_dialog()` がオプションごと、アクションごとのメソッドでダイアログを構成します。アクションは表示される順に指定し、`.show()` で表示します。その結果はタスク(`spawn`)内で await してください。

<a id="action-sheets"></a>

## アクションシート

アクションシートは、`"actionSheet"` プレゼンテーションを指定する以外は、同じオプションを受け取ります。

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

| フィールド | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | なし | 説明文の上に表示されます。 |
| `description` | `.description(..)` | `string \| null` | なし | タイトルの下に表示されます。 |
| `actions` | `.action(..)`、`.cancel(..)`、`.destructive(..)`(アクションごとに 1 つ) | `AlertDialogAction[]` | 必須 | アクションを表示順に指定します(1 つ以上必要。Android のアラートでは最大 3 つ)。 |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | 中央に表示されるアラート、または下から表示されるアクションのシート(Android ではリストダイアログ)。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | アラートでは `false`、アクションシートでは `true` | Escape キーと Android の戻るボタンで、アクションなしでダイアログを閉じます。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | アラートでは `false`、アクションシートでは `true` | ダイアログ外のタップで、アクションなしでダイアログを閉じます。 |

## AlertDialogResult

| フィールド | Rust | 型 | 説明 |
|---|---|---|---|
| `action` | `action` | `string \| null`(`Option<SharedString>`) | 選択されたアクションの `id`。アクションが選択されずにダイアログが閉じられた場合は `null` になります。 |

## AlertDialogAction

| フィールド | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | メソッドの第 1 引数 | `string` | 必須 | アクションが選択されたときに `show` が `action` として返す値です。アプリ側で付ける名前であり、ラベルの言語が変わっても同じ値のままです。 |
| `label` | メソッドの第 2 引数 | `string` | 必須 | アクションに表示される文言。 |
| `role` | `.action(..)`、`.cancel(..)`、`.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | アクションの意味です。プラットフォームがロールに応じて配置と描画を行います(iOS では破壊的アクションは赤で表示されます)。 |

> [!TIP]
> メインスレッドが JS や Rust を待つことはないため、ダイアログの表示と応答はネイティブ側で行われ、結果が届いた時点でコードが再開されます。アラートダイアログは任意のイベントハンドラー内で await できます。たとえば、[`popOnBack`](./nav-stack.md#leaving-a-page) でページを離れる前に確認を求める場合などに使えます。

<a id="platform-notes"></a>

## プラットフォーム別の注意事項

- **iOS**: `UIAlertController` がアクションを配置します。`"cancel"` ロールのアクションは、iOS がキャンセルアクションを配置する位置に置かれ、アクションシートでは下部に分離して表示されます。iPad と Mac Catalyst では、アクションシートはタイトルなしのキャンセルアクションを持つポップオーバーになります。ポップオーバー外をタップすると閉じ、`action` は `null` になります。
- **Android**: `AlertDialog` には最大 3 つのアクションが表示され、位置によって割り当てられます。最後のアクションがポジティブボタン、その前のアクションがネガティブボタン、さらにその前のアクションがニュートラルボタンになります。アクションシートはダイアログ内のアクションのリストで、キャンセルアクションの代わりにダイアログ外のタップまたは戻るボタンで閉じます(このとき `action` は `null` になります)。リストダイアログには `title` が表示され、シートにタイトルがない場合は `description` が表示されます。
- **Windows、Linux、GPUI、Web**: NSH は、プラットフォームのダイアログの外観でアラートまたはアクションシートを描画します。
