---
title: "AlertDialog"
description: "AlertDialog: प्लैटफ़ॉर्म का अपना अलर्ट या ऐक्शन शीट, जो नेटिव रूप में दिखाया जाता है और उपयोगकर्ता द्वारा चुनी गई कार्रवाई के साथ उसका उत्तर देता है।"
group: base
demo: el-alert-dialog
source_hash: 26dcaa8ac6db9886
---

# AlertDialog

`AlertDialog` प्लेटफ़ॉर्म का अपना अलर्ट या एक्शन शीट दिखाता है: iOS और Mac Catalyst पर `UIAlertController`, Android पर `AlertDialog` (एक्शन शीट के लिए सूची वाला डायलॉग), और अन्य प्लेटफ़ॉर्म पर प्लेटफ़ॉर्म के डायलॉग जैसे रूप में एक अलर्ट। `AlertDialog.show` (Rust में `alert_dialog()` का `.show()`) एक promise (Rust में future) लौटाता है, जो `{ action }` के साथ resolve होता है: यानी उपयोगकर्ता द्वारा चुनी गई action का `id`।
हर लेबल ऐप से आता है, इसलिए अलर्ट वही कहता है जो आपका ऐप कहता है, उसी की भाषा में।

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

अपने खुद के रूप वाले डायलॉग के लिए (कार्ड, शीट, पूर्ण-स्क्रीन फ़्लो) [Dialog](./dialog.md) का उपयोग करें।

## AlertDialog.show

```ts
AlertDialog.show(options: AlertDialogOptions): Promise<AlertDialogResult>
```

```rust
alert_dialog().title(..).description(..).action(..).cancel(..).destructive(..).show()
    -> impl Future<Output = Result<AlertDialogResult, String>>
```

परिणाम `{ action }` (`AlertDialogResult`) होता है: चुनी गई action का `id`, या `null` (`None`) जब डायलॉग किसी action के बिना बंद हुआ: उसके बाहर टैप करने पर, Escape या back बटन से, जहाँ `closeOnBackdropPress` और `closeOnEscape` इसकी अनुमति देते हैं। actions के बिना promise `TypeError` के साथ reject हो जाता है (Rust में `Err`)। Rust में `nsh_base::alert_dialog()` डायलॉग को हर विकल्प और हर action के लिए एक मेथड के साथ सेट करता है, उसी क्रम में जिसमें actions दिखते हैं, और `.show()` उसे दिखाता है; उसका उत्तर किसी task में await करें (`spawn`)।

## Action sheets

एक्शन शीट वही विकल्प लेती है, बस `"actionSheet"` presentation के साथ:

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
| `title` | `.title(..)` | `string \| null` | none | विवरण के ऊपर। |
| `description` | `.description(..)` | `string \| null` | none | शीर्षक के नीचे। |
| `actions` | `.action(..)`, `.cancel(..)`, `.destructive(..)`, हर action के लिए एक | `AlertDialogAction[]` | required | Actions, क्रम में (कम से कम एक; Android अलर्ट में अधिकतम तीन)। |
| `presentation` | `.action_sheet()` | `"alert" \| "actionSheet"` | `"alert"` | बीच में एक अलर्ट, या नीचे से actions की एक शीट (Android पर सूची वाला डायलॉग)। |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean \| null` | अलर्ट के लिए `false`, एक्शन शीट के लिए `true` | Escape और Android का back बटन इसे किसी action के बिना बंद कर देते हैं। |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean \| null` | अलर्ट के लिए `false`, एक्शन शीट के लिए `true` | इसके बाहर टैप करने से यह किसी action के बिना बंद हो जाता है। |

## AlertDialogResult

| Field | Rust | Type | Description |
|---|---|---|---|
| `action` | `action` | `string \| null` (`Option<SharedString>`) | चुनी गई action का `id`, या `null` जब डायलॉग किसी action के बिना बंद हुआ। |

## AlertDialogAction

| Field | Rust | Type | Default | Description |
|---|---|---|---|---|
| `id` | मेथड का पहला argument | `string` | required | चुने जाने पर `show` इसे `action` के रूप में रिपोर्ट करता है: यह action के लिए ऐप का दिया नाम है, जो लेबल किसी भी भाषा में हों, वही रहता है। |
| `label` | मेथड का दूसरा argument | `string` | required | यह क्या कहता है। |
| `role` | `.action(..)`, `.cancel(..)`, `.destructive(..)` | `"default" \| "cancel" \| "destructive"` | `"default"` | इसका अर्थ क्या है: प्लेटफ़ॉर्म इसकी role के अनुसार इसे रखता और बनाता है (iOS पर destructive action लाल होती है)। |

> [!TIP]
> क्योंकि मुख्य थ्रेड कभी JS या Rust की प्रतीक्षा नहीं करता, डायलॉग नेटिव रूप से दिखाया और उसका उत्तर लिया जाता है, और आपका कोड परिणाम आने पर आगे बढ़ता है। आप किसी भी event handler के अंदर अलर्ट डायलॉग को await कर सकते हैं, उदाहरण के लिए [`popOnBack`](./nav-stack.md#leaving-a-page) के साथ किसी पेज को छोड़ने की पुष्टि करने के लिए।

## Platform notes

- **iOS**: `UIAlertController` actions को व्यवस्थित करता है। `"cancel"` role वाली action वहाँ रखी जाती है जहाँ iOS cancel actions रखता है, और एक्शन शीट उसे अपने नीचे अलग से दिखाती है। iPad और Mac Catalyst पर एक्शन शीट एक popover होती है, जिसमें बिना शीर्षक वाली cancel action होती है: उसके बाहर टैप करने से वह बंद हो जाती है, और `action` तब `null` होता है।
- **Android**: `AlertDialog` अधिकतम तीन actions दिखाता है, जो स्थिति के अनुसार map होती हैं: अंतिम action positive बटन है, उससे पहले वाली negative बटन, और उससे पहले वाली neutral बटन। एक्शन शीट एक डायलॉग में actions की सूची होती है, जिसमें उसकी cancel action की जगह बाहर टैप करना या back बटन होता है (`action` तब `null` होता है)। सूची वाला डायलॉग `title` दिखाता है, या जब शीट में शीर्षक न हो तो `description`।
- **Windows, Linux, GPUI और web**: NSH अलर्ट या एक्शन शीट को प्लेटफ़ॉर्म के डायलॉग जैसे रूप में बनाता है।
