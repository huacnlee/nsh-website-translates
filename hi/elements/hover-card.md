---
title: "HoverCard"
description: "HoverCard कॉम्पोनेंट: ट्रिगर जिस चीज़ की ओर इशारा करता है उसका प्रीव्यू, जो पॉइंटर के ट्रिगर पर टिके रहने के दौरान दिखाई देता है और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

हॉवर कार्ड पेज छोड़े बिना यह प्रीव्यू दिखाता है कि उसका ट्रिगर किस ओर इशारा करता है: मेंशन के पीछे की प्रोफ़ाइल, लिंक के पीछे का पेज, टिकर के पीछे का कोट। डेस्कटॉप और डेस्कटॉप ब्राउज़र पर यह तब खुलता है जब पॉइंटर `openDelay` (600 ms) तक ट्रिगर पर टिका रहे, या कीबोर्ड फ़ोकस ट्रिगर पर आ जाए। पॉइंटर के ट्रिगर से कार्ड पर और वापस जाने के दौरान, और कीबोर्ड फ़ोकस के ट्रिगर पर या कार्ड के किसी लिंक या बटन पर रहने तक यह खुला रहता है, इसलिए कार्ड की हर चीज़ पॉइंटर और कीबोर्ड दोनों से इस्तेमाल की जा सकती है। पॉइंटर के दोनों से हट जाने और फ़ोकस के किसी में भी न रहने के `closeDelay` (300 ms) बाद यह बंद हो जाता है। Escape और बाहर प्रेस करने पर यह तुरंत बंद हो जाता है। फ़ोन और टैबलेट पर ट्रिगर पर प्रेस करने से यह खुलता और बंद होता है, और बाहर प्रेस करने से बंद हो जाता है।

[`nsh/base`](../modules/nsh-base.md) का `HoverCard` अपनी ओर से कुछ भी ड्रॉ नहीं करता: ट्रिगर आपका एलिमेंट है, और पॉपअप तथा उसका कंटेंट भी आपके हैं।

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

ट्रिगर अपनी भूमिका (role), प्रेस और रूप बनाए रखता है: `role="link"` और अपने `onPress` वाला व्यू प्रेस करने पर अब भी वहीं जाता है जहाँ वह जाता था, और कार्ड उसमें एक प्रीव्यू जोड़ देता है। कंटेंट हर बार कार्ड खुलने पर बनाया जाता है, इसलिए वह जो दिखाता है उसे उसी समय लोड कर सकता है। फ़ोन और टैबलेट पर, जहाँ प्रेस से कार्ड खुलता है, ट्रिगर स्क्रीन रीडर को बताता है कि उसका कार्ड खुला है या नहीं। [Toolbar](./toolbar.md) में ट्रिगर उसके आइटम में से एक हो सकता है; कार्ड में जो दिखता है वह नहीं हो सकता: उसके बटन और लिंक अपने-अपने Tab स्टॉप रखते हैं और टूलबार का `disabled` उन्हें जैसा है वैसा ही छोड़ देता है।

## Delays

`openDelay` कार्ड को तब अचानक खुलने से रोकता है जब पॉइंटर कहीं और जाते हुए ट्रिगर के ऊपर से गुज़रता है; `closeDelay` पॉइंटर को ट्रिगर और कार्ड के बीच की दूरी पार करने का समय देता है। दोनों मिलीसेकंड में हैं। पॉइंटर और देरी को नेटिव रूप से ट्रैक किया जाता है, इसलिए ट्रिगर पर टिकने और उसके तथा कार्ड के बीच जाने पर कार्ड के खुलने या बंद होने तक आपका कोई कोड नहीं चलता। `Infinity` का `openDelay` खोलने का काम ऐप पर (और टच स्क्रीन पर प्रेस पर) छोड़ देता है; `Infinity` का `closeDelay` बंद करने का काम Escape, बाहर प्रेस और ऐप पर छोड़ देता है।

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

## Open state

`open` के बिना कार्ड अपनी स्टेट खुद रखता है, जो `defaultOpen` से शुरू होती है। `open` के साथ स्टेट ऐप के पास होती है: इसे `onOpenChange({ open, reason })` में बदलें, जो खोलने या बंद करने के हर अनुरोध को उसके कारण के साथ रिपोर्ट करता है: `"hover"` (पॉइंटर), `"focus"` (कीबोर्ड फ़ोकस), `"triggerPress"` (टच स्क्रीन पर प्रेस), `"pressOutside"` या `"cancel"` (Escape या back)।

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

## Entrance and exit

हॉवर कार्ड आपके ट्रांज़िशन के साथ आता और जाता है, जैसा [Popover](./popover.md) करता है। `popupStartingClass` पॉपअप का पहले फ़्रेम में रूप है, और `popupClass` की `transition-*` क्लासेज़ उसे उसके अपने रूप तक ले जाती हैं। `popupEndingClass` बंद होने के बाद का उसका रूप है: ये ट्रांज़िशन चलने तक कार्ड रहता है और कोई पॉइंटर इनपुट नहीं लेता, फिर चला जाता है, और उसके बाद `onClose` आता है। उसके जाते समय ट्रिगर पर फिर टिकने से वह वापस आ जाता है। जब उपयोगकर्ता कम मोशन माँगता है, तो वह तुरंत दिखता है और तुरंत चला जाता है।

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

यह डिफ़ॉल्ट रूप से ट्रिगर के नीचे आता है (`placement`, `align`), जगह न होने पर दूसरी ओर आता है, और सेफ़ एरिया के भीतर रहता है। `onPosition({ placement, bounds, available })` बताता है कि वह कहाँ गया।

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | none | खुला है या नहीं, ऐप द्वारा नियंत्रित। |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | शुरू में खुला, `open` के बिना। |
| `openDelay` | `.open_delay(..)` | `number` | `600` | खुलने से पहले पॉइंटर के ट्रिगर पर टिकने, या फ़ोकस के उस पर रहने के मिलीसेकंड; `Infinity`: अपने आप कभी नहीं। |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | बंद होने से पहले पॉइंटर के ट्रिगर और कार्ड से दूर रहने, और फ़ोकस के दोनों में न होने के मिलीसेकंड; `Infinity`: अपने आप कभी नहीं। |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | ट्रिगर का वह किनारा जिस पर यह आता है। |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | उस किनारे के साथ यह ट्रिगर से कैसे संरेखित होता है। |
| `offset` | `.offset(..)` | `number` | `0` | ट्रिगर और कार्ड के बीच की दूरी। |
| `margin` | `.margin(..)` | `number` | `0` | सेफ़ एरिया के किनारों से यह जो दूरी रखता है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | none | पॉपअप का रूप, यानी वह कार्ड जिसमें कंटेंट है। |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | none | पहले फ़्रेम में पॉपअप का रूप, उसके अपने रूप के ऊपर: उसके ट्रांज़िशन यहीं से चलते हैं। |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | none | बंद होने के बाद पॉपअप का रूप, उसके अपने रूप के ऊपर: ट्रांज़िशन चलने तक यह बना रहता है। |
| `trigger` | `.trigger(..)` | `JSX.Element` | none | जिसका यह प्रीव्यू दिखाता है; इसे उसी के सापेक्ष रखा जाता है। |
| `children` | `.child(..)` | `JSX.Element` | none | कंटेंट, जो हर बार खुलने पर बनाया जाता है। |

## Events

| Event | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | यह कारण के साथ खुलने या बंद होने का अनुरोध करता है: `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` या `"cancel"`। |
| `onOpen` | `.on_open(\|\| ..)` | यह दिखाया गया है। |
| `onClose` | `.on_close(\|\| ..)` | यह चला गया है, अपने exit के बाद; ऐप द्वारा बंद किए जाने पर भी। |
| `onPosition` | `.on_position(\|e\| ..)` | पॉपअप रखा गया: `placement` (वह किनारा जिस पर गया), `bounds` (उसका फ़्रेम), `available` (उस किनारे पर जगह)। |

## Accessibility

हॉवर कार्ड अपने ट्रिगर में कुछ जोड़ता है: ट्रिगर अपनी भूमिका (role) और लेबल बनाए रखता है, और प्रेस करने पर वह जो खोलता या करता है वह वैसा ही रहता है। कीबोर्ड उपयोगकर्ताओं को कार्ड तब मिलता है जब फ़ोकस ट्रिगर पर टिकता है, और Escape उसे बंद कर देता है। कार्ड अपना कोई फ़ोकस नहीं लेता, इसलिए Tab पहले की तरह ट्रिगर से आगे बढ़ जाता है। कार्ड के लिंक और बटन कहीं और की तरह फ़ोकस लेते हैं, और उनमें से किसी के पास फ़ोकस रहने तक कार्ड खुला रहता है; कार्ड में जो ज़रूरी है वह उस पेज से भी पहुँच में होना चाहिए जिस पर ट्रिगर ले जाता है।
