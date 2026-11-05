---
title: "Tooltip"
description: "Tooltip कॉम्पोनेंट: उस एलिमेंट के बारे में एक संकेत जिसके अंदर वह होता है, जो डेस्कटॉप पर तब दिखाई देता है जब पॉइंटर उस पर ठहरता है, और जिसकी स्टाइल ऐप द्वारा तय की जाती है।"
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# Tooltip

Tooltip एक छोटा संकेत (hint) है जो उस चीज़ के बगल में दिखता है जिसके बारे में वह है: जैसे किसी आइकन बटन का काम, या कटे हुए (truncated) लेबल का पूरा टेक्स्ट।
डेस्कटॉप और डेस्कटॉप ब्राउज़र पर यह तब दिखता है जब पॉइंटर अपने ट्रिगर पर `delay` (500 ms) तक टिका रहे, और
पॉइंटर के हटने या ट्रिगर को दबाने पर छिप जाता है। फ़ोन और टैबलेट पर Tooltip तभी दिखता है जब ऐप उसे खोले
(`open`)। यह कभी पॉइंटर या प्रेस को नहीं रोकता, इसलिए ट्रिगर ठीक वैसे ही काम करता है जैसे इसके बिना करता।

[`nsh/base`](../modules/nsh-base.md) से `Tooltip` को `tooltip` prop के रूप में दिया जाता है, जो हर element में होता है
([Common props](index.md#tooltips)), जैसे GPUI का `.tooltip(..)`: यह element वही है जिस पर पॉइंटर टिकता है और जिसके सापेक्ष
Tooltip रखा जाता है। Tooltip स्वयं बबल है: इसे `class` / `style` से स्टाइल करें, और इसके children वही हैं जो यह कहता है।

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

यह डिफ़ॉल्ट रूप से अपने ट्रिगर के ऊपर आता है (`placement`), जगह न होने पर दूसरी ओर आता है, और सेफ़ एरिया के भीतर रहता है। `open` के साथ ऐप तय करता है कि यह कब दिखे: यह `onOpenChange` का अनुसरण करता है, जो ट्रिगर पर पॉइंटर के टिकने या उससे हटने की सूचना देता है, और इसे किसी भी डिवाइस पर दिखा सकता है।

यह आपके transitions के साथ आता और जाता है: `startingClass` इसका पहले फ़्रेम में रूप है और `endingClass` छिपने के बाद का रूप, जिसे यह तब तक बनाए रखता है जब तक इसके `class` की `transition-*` क्लासेज़ चलती हैं; `onClose` आगे आता है।

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | none | यह क्या कहता है। |
| `class`, `style` | `.app_class(..)`, `Styled` methods | `string`, `StyleProp<ViewStyle>` | none | बबल का रूप: यानी स्वयं Tooltip। |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | none | पहले फ़्रेम में इसका रूप: इसके transitions यहीं से शुरू होते हैं। |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | none | छिपने के बाद इसका रूप: transitions चलने तक यह बना रहता है। |
| `open` | `.open(..)` | `boolean` | none | दिखाया गया, ऐप द्वारा नियंत्रित। |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | शुरू में दिखाया गया, `open` के बिना। |
| `delay` | `.delay(..)` | `number` | `500` | दिखने से पहले पॉइंटर ट्रिगर पर कितने मिलीसेकंड टिकता है; `Infinity`: अपने आप कभी नहीं, केवल तब जब ऐप इसे खोले। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | यह कभी नहीं दिखता। |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | ट्रिगर का वह किनारा जिस ओर यह आता है। |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | उस किनारे के साथ यह ट्रिगर से कैसे संरेखित होता है। |
| `offset` | `.offset(..)` | `number` | `4` | ट्रिगर और Tooltip के बीच की दूरी। |
| `margin` | `.margin(..)` | `number` | `4` | सेफ़ एरिया के किनारों से यह कितनी दूरी बनाए रखता है। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | पॉइंटर ट्रिगर पर टिका, या उससे हटा या उसे दबाया (`reason` `"hover"`)। |
| `onOpen` | `.on_open(\|\| ..)` | यह दिखाया जा चुका है। |
| `onClose` | `.on_close(\|\| ..)` | यह अपने exit के बाद हट चुका है; ऐप द्वारा छिपाए जाने पर भी। |

## Accessibility

Tooltip स्क्रीन रीडर को वही दोहराता है जो इसका ट्रिगर कहता है: ट्रिगर को भी `accessibilityLabel` दें, ताकि
संकेत सभी के लिए उपलब्ध रहे।
