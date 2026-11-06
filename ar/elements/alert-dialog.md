---
title: "AlertDialog"
description: "AlertDialog: مربع التنبيه أو ورقة الإجراءات الخاصة بالمنصة، يُعرض بشكل أصلي ويُرجع الإجراء الذي اختاره المستخدم."
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

يعرض `AlertDialog` التنبيه أو ورقة الإجراءات الأصلية الخاصة بالمنصة: `UIAlertController` على iOS وMac Catalyst، و`AlertDialog` (أو مربع حوار بقائمة لورقة الإجراءات) على Android، وتنبيهًا بمظهر مربعات الحوار الخاص بالمنصة على المنصات الأخرى. تعيد `AlertDialog.show` (`.show()` الخاصة بـ `alert_dialog()` في Rust) وعدًا (future في Rust) يكتمل بالقيمة `{ action }`: أي `id` الإجراء الذي اختاره المستخدم.
تأتي كل التسميات من التطبيق، لذلك يقول التنبيه ما يقوله تطبيقك، وبلغته.

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

للحوارات ذات المظهر الخاص بك (بطاقة، أو ورقة، أو مسار بملء الشاشة)، استخدم [Dialog](./dialog.md).

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

النتيجة هي `{ action }` (`AlertDialogResult`): أي `id` الإجراء المختار، أو `null` (`None`) عند إغلاق الحوار
دون اختيار إجراء: بالضغط خارجه، أو بزر Escape، أو بزر الرجوع، حيثما يسمح بذلك
`closeOnBackdropPress` و`closeOnEscape`. وبدون إجراءات يُرفض الوعد بالخطأ `TypeError` (وهو `Err`
في Rust). في Rust، يُعدّ `nsh_base::alert_dialog()` الحوار بطريقة (method) لكل خيار ولكل إجراء، بالترتيب
الذي تظهر به الإجراءات، ويعرضه `.show()`؛ وانتظر إجابته داخل مهمة (`spawn`).

## Action sheets

تقبل ورقة الإجراءات الخيارات نفسها مع نمط العرض `"actionSheet"`:

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

| الحقل | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `title` | `.title(..)` | `string \| null` | لا يوجد | يظهر فوق الوصف. |
| `description` | `.description(..)` | `string \| null` | لا يوجد | يظهر تحت العنوان. |
| `actions` | `.action(..)`، `.cancel(..)`، `.destructive(..)`، واحدة لكل إجراء | `AlertDialogAction[]` | مطلوب | الإجراءات بالترتيب (إجراء واحد على الأقل؛ وثلاثة كحد أقصى في تنبيه Android). |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | تنبيه في المنتصف، أو ورقة إجراءات من الأسفل (مربع حوار بقائمة على Android). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | `false` للتنبيه، `true` لورقة الإجراءات | يغلقه زر Escape وزر الرجوع في Android دون اختيار إجراء. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | `false` للتنبيه، `true` لورقة الإجراءات | يغلقه الضغط خارجه دون اختيار إجراء. |

## AlertDialogResult

| الحقل | Rust | النوع | الوصف |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | `id` الإجراء المختار، أو `null` عند إغلاق الحوار دون اختيار إجراء. |

## AlertDialogAction

| الحقل | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `id` | الوسيط الأول للطريقة | `string` | مطلوب | ما يعيده `show` في `action` عند اختياره: اسم التطبيق لهذا الإجراء، ويبقى كما هو أيًّا كانت لغة التسميات. |
| `label` | الوسيط الثاني للطريقة | `string` | مطلوب | النص الذي يعرضه. |
| `role` | `.action(..)`، `.cancel(..)`، `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | معناه: تحدد المنصة موضعه وشكله حسب دوره (الإجراء المدمّر يظهر باللون الأحمر على iOS). |

> [!TIP]
> بما أن الخيط الرئيسي لا ينتظر JS أو Rust أبدًا، يُعرض الحوار ويُجاب عنه أصليًا، ويتابع
> الكود الخاص بك عند وصول النتيجة. يمكنك انتظار حوار تنبيه داخل أي معالج حدث، على سبيل المثال لتأكيد
> مغادرة صفحة باستخدام [`popOnBack`](./nav-stack.md#leaving-a-page).

<a id="platform-notes"></a>

## ملاحظات المنصات

- **iOS**: يتولى `UIAlertController` ترتيب الإجراءات. يوضع الإجراء ذو الدور `"cancel"` حيث يضع iOS
  إجراءات الإلغاء، وتعرضه ورقة الإجراءات منفصلًا في أسفلها. على iPad وMac Catalyst تكون ورقة الإجراءات
  نافذة منبثقة (popover) مع إجراء إلغاء بلا عنوان: يغلقها الضغط خارجها، وتكون قيمة `action` هي `null`.
- **Android**: يعرض `AlertDialog` حتى ثلاثة إجراءات، تُربط حسب الموضع: الإجراء الأخير هو الزر الإيجابي،
  والذي قبله هو الزر السلبي، والذي قبله هو الزر المحايد. وورقة الإجراءات هي
  قائمة بالإجراءات داخل حوار، ويحل الضغط خارجها أو زر الرجوع محل إجراء الإلغاء (وتكون قيمة `action`
  عندئذٍ `null`). يعرض حوار القائمة `title`، أو `description` عندما لا يكون للورقة عنوان.
- **Windows وLinux وGPUI والويب**: يرسم NSH التنبيه أو ورقة الإجراءات بمظهر مربعات الحوار الخاص بالمنصة.
