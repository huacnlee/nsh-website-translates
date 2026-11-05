---
title: "Dialog"
description: "Dialog कॉम्पोनेंट: बाकी सभी चीज़ों के ऊपर दिखने वाली एक मॉडल सतह, जिसे फ़ुल-स्क्रीन फ़्लो, शीट और ऐसे डायलॉग के लिए इस्तेमाल किया जाता है जिन्हें ऐप स्वयं स्टाइल करता है।"
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

Dialog बाकी ऐप के ऊपर अपनी नेटिव विंडो लेयर में कंटेंट दिखाता है: iOS और Mac Catalyst पर एक presented view controller, Android पर एक Dialog, और डेस्कटॉप व वेब पर पूरी विंडो के ऊपर एक लेयर। इसका उपयोग फ़ुल-स्क्रीन फ़्लो, शीट और डायलॉग के लिए होता है। सिस्टम के अपने जेस्चर (शीट को नीचे स्वाइप करना, Android का बैक बटन, Escape) काम करते हैं, और इनका निर्णय नेटिव स्तर पर होता है। Rust में इसे `nsh_base::dialog()` से बनाया जाता है, और TSX में `nsh/base` से इम्पोर्ट किए गए `<Dialog>` से।

Dialog अपना व्यवहार खुद संभालता है और अपना रूप ऐप पर छोड़ देता है: इसके स्टाइल पॉपअप (children को रखने वाले view) को स्टाइल करते हैं, और TSX में `backdropClass` / `backdropStyle` उसके पीछे एक बैकड्रॉप जोड़ते हैं।

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

TSX में, Dialog तब तक दिखता है जब तक `open` `false` नहीं है, और `false` होते ही बंद हो जाता है। Rust में, यह तब तक प्रस्तुत रहता है जब तक यह view में है और view से हटते ही बंद हो जाता है, इसलिए `when` इसे थामे रखता है। दोनों ही स्थितियों में यह अपने कंटेंट को Dialog के safe-area insets देता है, जिन्हें इसके अंदर मौजूद [`env(safe-area-inset-*)`](./safe-area.md) वेरिएबल और `safeAreaInsets()` (Rust कॉम्पोनेंट में `cx.insets()`) पढ़ते हैं। [`Button`](./button.md), जो `nsh/base` से ही आता है, ऐप द्वारा स्टाइल किया जाने वाला एक प्रेस टारगेट है।

`nsh_core::prelude` में एक पुराना, deprecated `dialog` फ़ंक्शन भी है: `nsh_base::dialog` को ऊपर की तरह नाम से इम्पोर्ट करें, और यह स्पष्ट इम्पोर्ट उसकी जगह ले लेता है। सिस्टम के अलर्ट या एक्शन शीट के लिए [`AlertDialog`](./alert-dialog.md) का उपयोग करें।

## Props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `open` | खुले रहने के दौरान view में (`when(open, ..)`) | `boolean` | `true` | true रहने तक दिखता है। |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | यह कैसे आता और जाता है। |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | कोई नहीं | यह अपने `animation` की जगह एक WGSL शेडर के ज़रिए आता और जाता है: `shade(uv)` पीछे की चीज़ को `sample_from` के रूप में और Dialog को `sample_to` के रूप में पढ़ता है, जबकि `nsh.progress` `duration` मिलीसेकंड (डिफ़ॉल्ट रूप से 350) में 0 से 1 तक चलता है, और बंद होते समय 1 से वापस 0 तक। जब सिस्टम कम मोशन माँगता है, तो यह अपना `animation` लेता है। देखें [Shader](./shader.md)। |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | iOS पर इसका रूप: `fullScreen` साफ़ बैकग्राउंड के साथ स्क्रीन को ढक लेता है; `pageSheet` और `formSheet` सिस्टम शीट हैं जो पीछे की चीज़ को दिखाते रहते हैं (`formSheet` बड़ी स्क्रीन पर एक छोटी, केंद्र में रखी शीट है)। |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape और Android का बैक बटन इसे नेटिव रूप से बंद करते हैं। |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | बैकड्रॉप पर प्रेस इसे बंद करता है। |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | शीट को नीचे स्वाइप करना (iOS, फ़ोन ब्राउज़र) इसे नेटिव रूप से बंद करता है। |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | कोई नहीं | iOS और Android: Dialog खुला रहने तक स्टेटस बार, जो पेजों के स्टेटस बार के ऊपर लागू होता है ([Status bar](../modules/nsh-base.md#status-bar))। |
| `onOpen` | `.on_open(..)` | `() => void` | | यह दिखना पूरा कर चुका है। |
| `onClose` | `.on_close(..)` | `() => void` | | यह हट गया: उपयोगकर्ता ने इसे बंद किया, या ऐप ने इसे हटा दिया। |
| `onCancel` | `.on_cancel(..)` | `() => void` | | उपयोगकर्ता ने इसे बंद करने की कोशिश की (Escape, बैक, बैकड्रॉप पर प्रेस, नीचे स्वाइप), चाहे `closeOn*` फ़्लैग ने इसे बंद होने दिया हो या नहीं। |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | उपयोगकर्ता ने इसे बंद किया: `open` को यहीं सिंक में रखें। Rust में, `on_cancel` Dialog को view से हटा देता है। |
| `class`, `style` | `Styled` मेथड | `string`, `StyleProp<ViewStyle>` | | पॉपअप: children को रखने वाला view। |
| `backdropClass`, `backdropStyle` | Dialog को भरने वाला एक child view | `string`, `StyleProp<ViewStyle>` | | पॉपअप के पीछे Dialog को भरने वाला बैकड्रॉप, जो तब मौजूद होता है जब इनमें से कोई भी सेट हो। |
| `children` | `.child(..)` | `JSX.Element` | | कंटेंट। |

| `ios` कुंजी | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | प्रेज़enter वाला | वे ओरिएंटेशन जिन्हें Dialog अनुमति देता है। |

| `android` कुंजी | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | कंटेंट स्टेटस बार के नीचे तक पहुँचता है; अन्यथा यह उसके नीचे से शुरू होता है। |

<a id="opening-and-closing"></a>

## खोलना और बंद करना

Dialog की स्टेट ऐप की होती है। जब उपयोगकर्ता Dialog को बंद करता है (Escape, Android का बैक बटन, बैकड्रॉप पर प्रेस, नीचे स्वाइप की गई शीट), तो यह नेटिव रूप से बंद हो जाता है और ऐप को बताता है, जो अपनी स्टेट को उसके अनुरूप सेट करता है: TSX में `onOpenChange({ open: false, reason })`, Rust में `on_cancel`। TSX में, जब तक `open` `true` रहता है Dialog बंद रहता है, और `open` के `false` से `true` होने पर यह फिर खुल जाता है।

हर `closeOn*` फ़्लैग उपयोगकर्ता की कार्रवाई के समय नेटिव रूप से पढ़ा जाता है, क्योंकि मुख्य थ्रेड कभी ऐप के कोड का इंतज़ार नहीं करता। बंद करने से पहले पुष्टि करने के लिए, फ़्लैग को `false` पर सेट करें: तब प्रयास `onCancel` को कॉल करता है, और ऐप Dialog को खुद बंद करता है (TSX में `open` को `false` पर सेट करके, Rust में इसे view से हटाकर):

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel` हर प्रयास पर कॉल होता है, चाहे फ़्लैग ने Dialog को बंद होने दिया हो या नहीं।

<a id="a-dialog-with-a-backdrop"></a>

## बैकड्रॉप वाला Dialog

डिफ़ॉल्ट `fullScreen` प्रेज़ेंटेशन वाला Dialog वही दिखाता है जो ऐप ड्रॉ करता है: यहाँ एक धुंधला बैकड्रॉप और उसके ऊपर केंद्र में एक कार्ड। बैकड्रॉप पर प्रेस इसे बंद कर देता है:

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

सिस्टम के अलर्ट या एक्शन शीट के लिए `nsh/base` से [`AlertDialog`](./alert-dialog.md) का उपयोग करें।

<a id="ref-methods"></a>

## Ref मेथड

कोई नहीं।

<a id="platform-notes"></a>

## प्लैटफ़ॉर्म नोट्स

- iOS और Mac Catalyst: `presentation` रूप चुनता है। `fullScreen` साफ़ बैकग्राउंड के साथ पूरी स्क्रीन पर प्रस्तुत होता है; `pageSheet` और `formSheet` सिस्टम बैकग्राउंड वाली सिस्टम शीट हैं, जो नीचे स्वाइप करने पर उंगली के साथ चलती हैं (`closeOnSwipe`)।
- Android: Dialog विंडो को भर देता है और ऐप का पॉपअप व बैकड्रॉप दिखाता है। बैक बटन स्टैक और `BackHandler` लिसनर से पहले सबसे ऊपर वाले Dialog के पास जाता है।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: Dialog पूरी विंडो के ऊपर एक पारदर्शी लेयर है जो ऐप का पॉपअप व बैकड्रॉप दिखाती है। Escape एक बंद करने का प्रयास है।
- `supportedOrientations` iOS का है; `statusBarTranslucent` Android का है। Android Dialog का कंटेंट स्टेटस बार के नीचे से शुरू होता है, जब तक `statusBarTranslucent` सेट न हो।
