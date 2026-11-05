---
title: "Overlay"
description: "Overlay एलिमेंट: ऐसा कंटेंट जो स्क्रीन के ऊपर दिखाया जाता है, चाहे उसके पैरेंट को कोई भी चीज़ क्लिप करे। इसे एक फिक्स्ड बॉक्स के रूप में लेआउट किया जाता है या किसी ऐसे anchor के सापेक्ष रखा जाता है जिसे यह फ़ॉलो करता है, और बाहर की ओर होने वाले प्रेस तथा Escape की सूचना दी जाती है।"
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

Overlay अपने children को उस root view में सबसे ऊपर दिखाता है जिसमें वह है: window, या उसके आसपास का dialog। इसके parent का आकार, `overflow: hidden` और scroll views इसे clip नहीं करते। बाकी सब बातों में यह वहीं रहता है जहाँ आपने इसे लिखा है: यह अपने आसपास का context पढ़ता है, इसके handlers इसके component के होते हैं, और यह अपने parent के साथ हट जाता है। Popovers, menus, tooltips और sheets इसी पर बने हैं; [`nsh/base`](../modules/nsh-base.md) में ये तैयार मिलते हैं ([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), और अपना खुद का बनाने के लिए आप overlay का उपयोग करते हैं।

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

TSX में `Overlay` `nsh` से आता है और Rust में `overlay()` `nsh_core::prelude` से। यह तब तक दिखता है जब तक यह view में है: इसे खोलने और बंद करने के लिए इसे `If` (Rust: `when(..)`) में रखें। बाद में दिखाए गए overlays पहले वालों के ऊपर होते हैं, और किसी दूसरे के अंदर का overlay उसके ऊपर होता है।

## Placement

`anchor` के बिना, overlay अपने root view के एक `position: fixed` box की तरह लेआउट होता है: इसके `top`, `left`, `inset`, size और margins पूरी window (या dialog) के सापेक्ष होते हैं। `class="inset-0"` इसे पूरा ढक देता है, जो backdrop या पूरी window की layer बनता है; `class="bottom-0 left-0 right-0"` नीचे की ओर एक bar है।

`anchor` के साथ, NSH इसे anchor के पास रखता है:

- `anchor` एक view (`ref`), root view के coordinates में एक `Point` (`{ x, y }`), touch का `pageX` / `pageY` (pointer जहाँ है वहाँ menu), या वहीं एक `Bounds` (`{ origin, size }`) हो सकता है: किसी input का caret (`onCaretMove` का `pageBounds`), जहाँ टाइप किए जा रहे टेक्स्ट के सुझाव खुलते हैं।
- `placement` वह side है जिस पर यह जाता है: `"top"`, `"bottom"` (डिफ़ॉल्ट), `"left"` या `"right"`। जब यह वहाँ फिट नहीं होता और दूसरी side पर फिट होता है, तो यह वहाँ चला जाता है; जब यह किसी पर भी फिट नहीं होता, तो यह उस side पर जाता है जहाँ ज़्यादा जगह हो।
- `align` इसे उस side के साथ संरेखित करता है: `"start"`, `"center"` (डिफ़ॉल्ट) या `"end"`। anchor के ऊपर और नीचे, start और end लेआउट की दिशा के अनुसार चलते हैं: start बायाँ किनारा है, या right-to-left लेआउट में दायाँ किनारा।
- `offset` anchor और overlay के बीच की दूरी है; `margin` वह दूरी है जो यह safe area के किनारों से बनाए रखता है, और जिसके अंदर यह रहता है: यह फिट होने के लिए अपनी side के साथ खिसक जाता है।

Anchored overlay अपने anchor का अनुसरण करता है: जब anchor scroll होता है, हिलता है या उसका आकार बदलता है, तो overlay उसी frame में उसके साथ चलता है जिसमें NSH उसे लेआउट करता है। `onPosition` बताता है कि यह कहाँ गया, ताकि कोई arrow anchor की ओर इशारा कर सके या लंबा menu अपनी ऊँचाई सीमित कर सके:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

## Dismissing

Overlay वह रिपोर्ट करता है जो आमतौर पर popup को बंद करता है, और निर्णय आप पर छोड़ देता है:

- `onPressOutside` तब fire होता है जब overlay, उसके anchor और उसके अंदर के overlays के बाहर कोई उँगली या mouse button नीचे जाता है। press उसके नीचे वाली चीज़ तक पहुँचता रहता है।
- `onCancel` Escape, Android के back button और iOS पर VoiceOver के escape gesture पर fire होता है, केवल उस सबसे ऊपरी overlay के लिए जो इसे सुनता है। यह इन्हें pages और `BackHandler` से पहले ले लेता है।

popup के पीछे की screen को block करने के लिए, उसके नीचे `class="inset-0"` के साथ एक दूसरा overlay रखें और एक `onPress` जो दोनों को बंद करे: [Sheet](./sheet.md) और [Popover](./popover.md) का phone presentation इसी तरह काम करते हैं।

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | कोई नहीं | वह view, point या box जिसके सापेक्ष इसे रखा जाता है। इसके बिना यह अपने root view का एक fixed box होता है। |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | anchor की वह side जिस पर यह जाता है। |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | उस side के साथ यह anchor से कैसे संरेखित होता है। |
| `offset` | `.offset(px(..))` | `number` | `0` | anchor और overlay के बीच की दूरी। |
| `margin` | `.margin(px(..))` | `number` | `0` | safe area के किनारों से यह जो दूरी बनाए रखता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | यह क्या दिखाता है। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इसका रूप और, anchor के बिना, इसकी जगह। |

यह view के [common props](./index.md#common-props) भी लेता है।

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | एक press इसके, इसके anchor के और इसके अंदर के overlays के बाहर नीचे गया (`pagePosition`, एक `Point`)। |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, Android का back button या VoiceOver का escape gesture, जब यह सुनने वाला सबसे ऊपरी overlay हो। |
| `onPosition` | `.on_position(\|position\| ..)` | NSH ने इसे रखा: `placement` (वह side जिस पर यह गया), root view में `bounds`, और `available` (एक `Size`: उस side पर उपलब्ध जगह)। |

## Platform notes

- हर platform overlay को window (या dialog) के root view के एक native view के रूप में दिखाता है, जो आसपास के views की तरह ही draw और hit-test होता है: UIKit, Android views, AppKit, GTK, Win32, GPUI और DOM।
- [Dialog](./dialog.md) के अंदर का overlay उसी dialog में, उसकी सामग्री के ऊपर दिखता है।
- Overlays अपनी window में ही रहते हैं: जो menu window के किनारे से आगे जाता, वह खिसककर वापस उसके अंदर आ जाता है।
