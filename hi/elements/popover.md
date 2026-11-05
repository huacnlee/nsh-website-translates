---
title: "Popover"
description: "Popover कॉम्पोनेंट: ट्रिगर से जुड़ा हुआ कंटेंट, जो सबसे ऊपर दिखता है, और जिसे ट्रिगर, बाहर प्रेस, Escape और बैक से बंद किया जा सकता है, और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

Popover अपने trigger के पास, बाकी सब कुछ के ऊपर, सामग्री दिखाता है: जानकारी, छोटा फ़ॉर्म, कलर पिकर।
Trigger दबाने से यह खुलता और बंद होता है; बाहर दबाने, Escape, Android के back बटन और VoiceOver के escape जेस्चर से यह बंद हो जाता है। इसे trigger की किसी एक तरफ़ रखा जाता है, जगह न होने पर यह दूसरी तरफ़ चला जाता है, safe area के अंदर रहता है और scroll होने पर trigger के साथ चलता है। यह अपना कुछ भी नहीं बनाता: popup और उसकी सामग्री ऐप की होती है।

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` [`nsh/base`](../modules/nsh-base.md) से आता है। इसकी सामग्री हर बार खुलने पर बनाई जाती है, इसलिए इसके अंदर की state हर बार नए सिरे से शुरू होती है।

## Open state

`open` के बिना, popover अपनी state खुद रखता है, जो `defaultOpen` से शुरू होती है। `open` के साथ, state ऐप के पास होती है: उसे `onOpenChange({ open, reason })` में बदलें, जो खोलने या बंद करने के हर अनुरोध की सूचना उसके कारण (`"triggerPress"`, `"pressOutside"`, `"cancel"`) के साथ देता है।

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` इसे Escape और back पर खुला रखता है (`onCancel` को फिर भी इनकी सूचना मिलती है, ताकि वह पहले पूछ सके); `closeOnPressOutside={false}` इसे बाहर दबाने पर खुला रखता है।

## Phones and desktops

Popover हर डिवाइस पर अपने trigger से जुड़ा रहता है: जो कुछ यह दिखाता है, वह उसी के पास होना चाहिए जिसने इसे खोला।

- Desktops और desktop browsers पर, बाहर दबाने से यह बंद हो जाता है और दबाव उसके नीचे मौजूद चीज़ तक भी पहुँचता है, इसलिए एक ही क्लिक से popover बंद होता है और जिस बटन पर क्लिक पड़ा वह भी दब जाता है।
- Phones और tablets पर, बाहर दबाने से केवल यह बंद होता है: एक पारदर्शी backdrop दबाव को ले लेता है, जैसा सिस्टम के popovers करते हैं।

कार्रवाइयों की सूची के लिए [Menu](./menu.md) इस्तेमाल करें, जो phones पर sheet बन जाता है; पैनल के लिए [Sheet](./sheet.md) इस्तेमाल करें।

## Entrance and exit

Popover आपके transitions के साथ आता और जाता है। `popupStartingClass` popup का पहले फ़्रेम में दिखने वाला रूप है, और `popupClass` की `transition-*` classes उसे उसके अपने रूप तक ले जाती हैं: यही इसका entrance है। `popupEndingClass` बंद होने के बाद का रूप है: वे transitions चलते रहने तक popover बना रहता है और दबाव नहीं लेता, फिर चला जाता है, और उसके बाद `onClose` चलता है। बाहर जाते समय फिर से खोलने पर, यह जहाँ है वहीं से अपने रूप में लौट आता है। `popupStartingStyle` और `popupEndingStyle` यही काम inline styles के साथ करते हैं। जब उपयोगकर्ता कम motion माँगता है, तो यह तुरंत दिखता और चला जाता है।

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` बताता है कि popup कहाँ गया: trigger की कौन-सी तरफ़ (`placement` के लिए जगह न होने पर दूसरी), उसका frame और उस तरफ़ की खाली जगह, ताकि कोई तीर या entrance trigger की ओर इशारा कर सके।

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | none | खुला है या नहीं, ऐप द्वारा नियंत्रित। |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | शुरू में खुला, `open` के बिना। |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Trigger की वह तरफ़ जहाँ यह जाता है। |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | उस तरफ़ के साथ यह trigger से कैसे संरेखित होता है। |
| `offset` | `.offset(..)` | `number` | `0` | Trigger और popup के बीच का अंतर। |
| `margin` | `.margin(..)` | `number` | `0` | Safe area के किनारों से यह कितनी दूरी रखता है। |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape और Android back बटन इसे बंद करते हैं। |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | बाहर दबाने से यह बंद होता है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | none | Popup का रूप, यानी वह box जिसमें सामग्री होती है। |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | none | Popup का पहले फ़्रेम में रूप, उसके अपने रूप के ऊपर: इसके transitions यहीं से चलते हैं। |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | none | बंद होने के बाद popup का रूप, उसके अपने रूप के ऊपर: transitions चलते रहने तक यह बना रहता है। |
| `trigger` | `.trigger(..)` | `JSX.Element` | none | जो इसे खोलता है; इसे उसी के सापेक्ष रखा जाता है। Popover खुला रहने तक इसकी `aria-expanded:` classes और `expandedStyle` लागू रहते हैं। |
| `children` | `.child(..)` | `JSX.Element` | none | सामग्री। |

## Events

| Event | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | यह खुला या बंद हुआ, कारण के साथ: `"triggerPress"`, `"pressOutside"` या `"cancel"`। |
| `onOpen` | `.on_open(\|\| ..)` | यह दिखाया गया है। |
| `onClose` | `.on_close(\|\| ..)` | यह हट गया है, इसके exit के बाद; ऐप द्वारा बंद किए जाने पर भी। |
| `onCancel` | `.on_cancel(\|\| ..)` | उपयोगकर्ता ने इसे बंद करने की कोशिश की (Escape या back, बाहर दबाना), चाहे यह बंद हुआ हो या नहीं। |
| `onPosition` | `.on_position(\|e\| ..)` | Popup को रखा गया: `placement` (वह तरफ़ जहाँ यह गया), `bounds` (इसका frame), `available` (उस तरफ़ की खाली जगह)। |

## Accessibility

Trigger screen readers को बताता है कि popover फैला हुआ (expanded) है या नहीं। Escape और back बटन इसे बंद करते हैं, जैसा उपयोगकर्ता किसी popup से अपेक्षा करते हैं। TSX में trigger वह element है जो आप देते हैं, यानी `Button` या आपका अपना view: यह दबाव और expanded state खुद लेता है, इसलिए दबे रहने के दौरान इसकी अपनी `active:` classes और `activeStyle` दिखते हैं, और इसका अपना `onPress` भी चलता है।
