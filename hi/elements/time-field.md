---
title: "TimeField"
description: "TimeField कॉम्पोनेंट: दिन का समय, जिसे खंड-दर-खंड (घंटे, मिनट और सेकंड) कीबोर्ड या फ़ोन के नंबर पैड से संपादित किया जाता है, और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

टाइम फ़ील्ड दिन के समय को एक बार में एक सेगमेंट के रूप में एडिट करता है: घंटा, मिनट, `precision="second"` के साथ सेकंड, और `hourCycle="h12"` के साथ AM या PM। किसी रिमाइंडर का समय, मीटिंग की शुरुआत, दुकान के खुलने के घंटे। यह [DatePicker](./date-picker.md) के कैलेंडर के नीचे `timePrecision` वाला समय है, जो यहाँ पेज में अकेला है।

व्यवहार फ़ील्ड के पास है: समय (ऐप का, या फ़ील्ड का अपना), कीज़ किस सेगमेंट को एडिट करती हैं, अंक टाइप करना और स्टेप करना, और स्क्रीन रीडर क्या सुनाते हैं। रूप-रंग ऐप के हाथ में है: वह सेगमेंट और उनके बीच के `:` को स्टाइल करता है, या सेगमेंट खुद ड्रॉ करता है।

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` क्रेट है। Rust में `time_field()` हर प्रॉप के लिए एक सेटर (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) और हर इवेंट के लिए एक लिसनर (`.on_change(..)`) के साथ इसे बनाता है। इसका समय एक `TimeOfDay` है, यानी एक `chrono::NaiveTime`।

## Value

वैल्यू 24-घंटे की घड़ी पर दिन का समय है, ठीक HTML `<input type="time">` की तरह: `"HH:MM"`, या `precision="second"` के साथ `"HH:MM:SS"`, यानी जो भी `hourCycle` फ़ील्ड दिखाता है। `value` के साथ ऐप इसका मालिक होता है: फ़ील्ड इसे दिखाता है और हर एडिट को `onChange({ value })` से रिपोर्ट करता है; ऐप इसे फ़ॉलो करने के लिए `value` सेट करता है। छोड़ देने पर फ़ील्ड अपना समय खुद रखता है, शुरू में `defaultValue` से (डिफ़ॉल्ट `00:00`)।

`precision` वह सबसे छोटी इकाई है जिसे फ़ील्ड एडिट करता है, `"minute"` (डिफ़ॉल्ट) या `"second"`। `hourCycle` यह तय करता है कि फ़ील्ड घंटे कैसे गिनता है: `"h23"` (डिफ़ॉल्ट) में 00 से 23 तक, `"h12"` में 12 से 11 तक, और अंकों के बाद एक AM/PM सेगमेंट।

## Editing

एक सेगमेंट चुना हुआ होता है; कीज़ उसे एडिट करती हैं, ठीक `gpui-base` के टाइम फ़ील्ड की तरह:

- Up और Down सेगमेंट को एक-एक स्टेप बदलते हैं और घूमकर लौट आते हैं (59 से 00), अगले सेगमेंट में कैरी किए बिना।
- अंक उसमें दो-दो करके टाइप होते हैं: जो अंक लंबी वैल्यू की शुरुआत नहीं हो सकता (घंटे में `7`) वह सेगमेंट को पूरा कर देता है और अगले पर चला जाता है।
- `a` और `p` AM और PM सेट करते हैं।
- Backspace और Delete सेगमेंट को रीसेट करते हैं।

किसी सेगमेंट पर प्रेस करने से वह चुन लिया जाता है। चुने हुए AM/PM सेगमेंट पर प्रेस करने से वह बदल जाता है, क्योंकि फ़ोन में `a` और `p` कीज़ नहीं होतीं। कीज़ सेगमेंट के पीछे मौजूद एक पारदर्शी नेटिव टेक्स्ट फ़ील्ड तक पहुँचती हैं, जैसा [OtpInput](./otp-input.md) में होता है: फ़ोन और टैबलेट पर यह नंबर पैड ले आता है।

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | कोई नहीं | समय, जिसका मालिक ऐप है। |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | शुरुआत में समय, `value` के बिना। |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | सबसे छोटी इकाई जिसे यह एडिट करता है। |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | यह घंटे कैसे गिनता है; `"h12"` एक AM/PM सेगमेंट जोड़ता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | न फ़ोकस, न एडिटिंग; `disabled:` स्टाइल फ़ील्ड और उसके सेगमेंट पर लागू होते हैं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर फ़ील्ड को क्या नाम देते हैं। |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर सेगमेंट: फ़ील्ड पर फ़ोकस रहते चुने हुए सेगमेंट पर `focus:`, फ़ील्ड के साथ `disabled:`; `group` के साथ, उसका कंटेंट इनके अनुसार बदलता है (`group-focus:`, `group-disabled:`)। |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | अंकों के बीच हर `:`। |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | कोई नहीं | किसी सेगमेंट का कंटेंट, जिसे ऐप इस आधार पर ड्रॉ करता है कि वह क्या दिखाता है; अन्यथा उसका लेबल। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | फ़ील्ड, अपने सेगमेंट के चारों ओर (एक रो)। |

`renderSegment` को एक `TimeFieldSegmentEntry` मिलता है: `segment` (`"hour"`, `"minute"`, `"second"` या `"period"`), `value` (फ़ील्ड की घड़ी के अनुसार घंटा, मिनट या सेकंड; AM के लिए `0` और PM के लिए `1`) और `label` (दो अंक, या `AM` / `PM`)। इसे सेगमेंट की स्टेट कभी नहीं मिलती: सेगमेंट तब `focus:` होता है जब कीज़ उसे एडिट कर रही हों और फ़ील्ड के साथ `disabled:` होता है, और `segmentClass` में `group` के साथ उसका कंटेंट `group-focus:` और `group-disabled:` के अनुसार बदलता है। इसलिए सेगमेंट केवल तभी दोबारा ड्रॉ होता है जब उसकी वैल्यू बदलती है; सेगमेंट के बीच जाने और फ़ोकस के आने-जाने पर कुछ ड्रॉ नहीं होता:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

## Events

| Event | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | यूज़र ने समय बदला: `{ value }`। इसे फ़ॉलो करने के लिए `value` सेट करें। ऐप जो `value` पास करता है, वह कभी रिपोर्ट नहीं होता। |

## Parts

| Part | Where | Styled with |
|---|---|---|
| फ़ील्ड | रूट, एक रो | `class`, `style` |
| एक सेगमेंट | फ़ील्ड: घंटा, मिनट, सेकंड, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` अंदर, `segmentClass` में `group` के तहत) |
| एक सेपरेटर | फ़ील्ड, दो अंकों के बीच | `separatorClass`, `separatorStyle` |

## Keyboard

Tab चुने हुए सेगमेंट के साथ फ़ील्ड तक पहुँचता है। फिर:

| Key | Action |
|---|---|
| Left / Right | पिछला या अगला सेगमेंट। |
| Tab / Shift+Tab | अगला या पिछला सेगमेंट; आख़िरी से Tab और पहले से Shift+Tab फ़ील्ड से बाहर ले जाते हैं। |
| Up / Down | सेगमेंट को एक स्टेप बदलता है, घूमकर लौटते हुए। |
| 0 to 9 | सेगमेंट में टाइप करता है। |
| A / P | AM या PM। |
| Backspace, Delete | सेगमेंट को रीसेट करता है। |

## Accessibility

- फ़ील्ड एक टेक्स्ट फ़ील्ड है जिसका नाम `accessibilityLabel` से तय होता है; स्क्रीन रीडर वही समय पढ़ते हैं जो वह दिखाता है। `disabled` इसे फीका कर देता है।
- फ़ोन और टैबलेट पर नंबर पैड दिखता है।

लेबल, रोल और अनाउंसमेंट के सामान्य नियमों के लिए [Accessibility](../docs/accessibility.md) देखें।
