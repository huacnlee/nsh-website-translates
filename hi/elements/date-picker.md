---
title: "DatePicker"
description: "DatePicker कॉम्पोनेंट: कैलेंडर से चुनी गई एक तारीख, तारीखों की एक सीमा या तारीख और समय, जो डेस्कटॉप पर ट्रिगर के पास एक पॉपअप में और फ़ोन पर एक शीट में दिखाई देता है, और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

डेट पिकर ऐप के ट्रिगर से खुलने वाले [Calendar](./calendar.md) से तारीख़ चुनता है: कोई नियत तारीख़, कोई जन्मदिन, `range` के साथ यात्रा के दिन, `timePrecision` के साथ तारीख़ और दिन का समय। [Select](./select.md) की तरह यह हर डिवाइस की अपेक्षा के अनुसार खुलता है:

- डेस्कटॉप और डेस्कटॉप ब्राउज़र पर, ट्रिगर के पास एक पॉपअप; इसे खोलने पर कीबोर्ड दिनों पर पहुँच जाता है।
- फ़ोन और टैबलेट पर, स्क्रीन के नीचे बैकड्रॉप के ऊपर एक शीट।

पिकर व्यवहार को संभालता है: मान (ऐप का अपना या पिकर का अपना), खुली/बंद स्थिति, कैलेंडर, समय, प्रीसेट, कीबोर्ड और स्क्रीन रीडर जो सुनाते हैं। रूप-रंग ऐप का है: ऐप ट्रिगर बनाता है (मान, प्लेसहोल्डर, आइकन के साथ) और पॉपअप, कैलेंडर के भागों, प्रीसेट और समय फ़ील्ड को स्टाइल करता है।

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` क्रेट है। Rust में, `date_picker()` हर प्रॉप के लिए एक सेटर और हर इवेंट के लिए एक लिसनर (`.on_change(..)`) के साथ एक पिकर बनाता है (`.value(..)`, `.range(..)`, `.time_precision(..)`)। इसका मान एक `DateTime` है (`DateTime::Single`, `DateTime::Range`, `chrono` तारीख़ों या तारीख़ों और समय से); `onChange` एक `PickedDate` देता है, यानी पिकर की समय-परिशुद्धता वाला मान।

<a id="value"></a>

## मान

मान HTML इनपुट के रूपों में होता है: ISO तारीख़, `"2026-10-28"`, जैसी `<input type="date">` की होती है; `range` के साथ `[start, end]`; `timePrecision` के साथ तारीख़ और समय, `"2026-10-28T09:30"` (सेकंड पर `"2026-10-28T09:30:15"`), जैसा `<input type="datetime-local">` का होता है; `null` यानी कोई मान नहीं। `value` के साथ, मान ऐप का होता है: पिकर उसे दिखाता है और हर बदलाव की सूचना `onChange({ value })` से देता है; ऐप उसका पालन करने के लिए `value` सेट करता है। इसे न देने पर, पिकर अपना मान खुद रखता है, शुरुआत में `defaultValue` से।

- एक तारीख़: किसी दिन पर प्रेस करने से मान सेट हो जाता है और पॉपअप बंद हो जाता है।
- `range` के साथ, पहला प्रेस रेंज शुरू करता है और दूसरा उसे समाप्त करता है, जैसा [कैलेंडर](./calendar.md#value) में होता है; पूरी रेंज मान सेट करती है और पॉपअप बंद हो जाता है।
- `timePrecision` के साथ (केवल एक तारीख़ के लिए), कैलेंडर के नीचे एक समय फ़ील्ड दिखता है और समय के हर बदलाव की सूचना दी जाती है। डेस्कटॉप पर, दिन चुनने पर समय के लिए पॉपअप खुला रहता है और तारीख़ समय के साथ रिपोर्ट होती है; चुने हुए दिन पर फिर से प्रेस करने से पॉपअप बंद हो जाता है। फ़ोन और टैबलेट पर, किसी दिन पर टैप करने से वह उसके समय के साथ चुना जाता है और शीट बंद हो जाती है, जैसा एक तारीख़ में होता है; समय के लिए शीट फिर से खुलती है। समय तय होने से पहले चुने गए दिन को `defaultTime` मिलता है (डिफ़ॉल्ट `00:00`)। `hourCycle` यह तय करता है कि फ़ील्ड घंटों को कैसे गिनता है।

`cleanable` मान होने पर एक क्लियर बटन जोड़ता है: उस पर प्रेस करने से मान साफ़ हो जाता है (`onChange({ value: null })`)। यह ट्रिगर के बाद आता है, उसके अंदर नहीं, इसलिए इस पर प्रेस करने से पॉपअप कभी नहीं खुलता; ऐप इसे रखता है और इसकी सामग्री भरता है (`clearButton`), जैसा [select के क्लियर बटन](./select.md#value) में होता है।

<a id="presets"></a>

## प्रीसेट

`presets` कैलेंडर के बगल में बटन होते हैं जो मान सेट करते हैं: "आज", "पिछले 7 दिन", "कल सुबह 9 बजे"। हर एक `{ label, value }` है, `value` एक तारीख़, एक रेंज या तारीख़ें और समय, जैसा दिया गया हो वैसा ही रखा जाता है; प्रेस करने पर वह मान सेट करता है और पॉपअप बंद हो जाता है। `contentClass` प्रीसेट के कॉलम और समय के साथ कैलेंडर को व्यवस्थित करता है (एक पंक्ति, `flex-row`); `presetsClass` कॉलम को स्टाइल करता है, `presetClass` हर बटन को।

<a id="the-calendar"></a>

## कैलेंडर

[Calendar](./calendar.md) का हर प्रॉप, उसके मान को छोड़कर, पिकर में आगे पहुँच जाता है: `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, भाग (`headerClass` से `itemStyle` तक) और `renderItem`। `calendarClass` और `calendarStyle` कैलेंडर को ही स्टाइल करते हैं। इसके व्यू और कुंजियाँ कैलेंडर की ही हैं।

समय की पंक्ति (`timeClass`, `timeStyle`) में शुरुआत में `timeLabel` होता है, जो ऐप के अपने शब्दों में उसका लेबल है ("समय"), और अंत में समय फ़ील्ड (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`): एक पंक्ति जिसके आइटम बीच में संरेखित और दूर-दूर फैले होते हैं (`flex-row items-center justify-between`, जैसा `gpui-component` का होता है)। फ़ील्ड के सेगमेंट [TimeField](./time-field.md) के हैं (`segmentClass`, `separatorClass`, `renderSegment`)।

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | कोई नहीं | मान, जो ऐप का होता है। |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | शुरुआती मान, `value` के बिना। |
| `range` | `.range(..)` | `boolean` | `false` | तारीख़ों की रेंज चुनें। |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | खुली/बंद स्थिति, ऐप की या पिकर की अपनी। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | यह बंद रहता है और कोई प्रेस या कीबोर्ड फ़ोकस नहीं लेता। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर इसे क्या कहते हैं। |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` और समय | स्क्रीन रीडर मान को कैसे सुनाते हैं, `chrono` के फ़ॉर्मैट में। |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | कोई नहीं | दिन का समय भी संपादित करें, इस परिशुद्धता तक। |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | समय फ़ील्ड घंटों को कैसे गिनता है। |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | उपयोगकर्ता के समय सेट करने से पहले तारीख़ को मिलने वाला समय। |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | मान होने पर एक क्लियर बटन। |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | पॉपअप में बटन जो मान सेट करते हैं। |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | `Calendar` के समान | `Calendar` के समान | `Calendar` के समान | कैलेंडर के महीने, सप्ताह, अक्षम तारीख़ें और वर्ष। |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `Calendar` के समान | `string` | कोई नहीं | कैलेंडर के Previous और Next के लिए स्क्रीन रीडर क्या कहते हैं। |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | `Select` के समान | `"bottom"`, `"start"`, 0, 0 | डेस्कटॉप: पॉपअप ट्रिगर के सापेक्ष कहाँ जाता है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पॉपअप (डेस्कटॉप) या शीट (टच स्क्रीन)। |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | शीट के पीछे का बैकड्रॉप। |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पॉपअप की सामग्री: कैलेंडर और समय के बगल में प्रीसेट। |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | प्रीसेट का कॉलम। |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर प्रीसेट का बटन। |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | कैलेंडर। |
| `headerClass` … `itemStyle` | `Calendar` के समान | `Calendar` के समान | कोई नहीं | कैलेंडर का हेडर, बॉडी, महीने, पंक्तियाँ और आइटम। |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | कोई नहीं | कैलेंडर का हर आइटम, जिसे ऐप इस आधार पर बनाता है कि वह क्या है; इसकी स्थितियाँ आइटम की क्लास हैं, जैसी `Calendar` की होती हैं। |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | समय की पंक्ति: शुरुआत में उसका लेबल, अंत में फ़ील्ड। |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | कोई नहीं | फ़ील्ड से पहले समय की पंक्ति में क्या दिखता है। |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | समय फ़ील्ड। |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर समय फ़ील्ड को क्या कहते हैं। |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | `TimeField` के समान | `TimeField` के समान | कोई नहीं | समय फ़ील्ड के सेगमेंट और `:`। |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | क्लियर बटन (`cleanable`)। |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | कोई नहीं | क्लियर बटन की सामग्री। |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्लियर बटन को क्या कहते हैं। |
| `trigger` | `.trigger(..)` | `JSX.Element` | कोई नहीं | प्रेस करने पर जो पॉपअप खोलता है; पॉपअप इसी के सापेक्ष रखा जाता है। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ट्रिगर के चारों ओर का व्यू। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | मान बदल गया (दिन, रेंज का अंत, प्रीसेट, समय, क्लियर बटन): `{ value }`। इसका पालन करने के लिए `value` सेट करें। |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | पॉपअप खुला या बंद हुआ, कारण के साथ (`{ open, reason }`)। इसका पालन करने के लिए `open` सेट करें। |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | पॉपअप दिखाया गया, या हट गया। |
| `onCancel` | `.on_cancel(..)` | उपयोगकर्ता ने बिना कोई चुनाव किए पॉपअप बंद किया (Escape या back, बाहर या बैकड्रॉप पर प्रेस)। |

<a id="parts"></a>

## भाग

| भाग | कहाँ | स्टाइल करने का तरीका |
|---|---|---|
| ट्रिगर | पिकर का व्यू | ऐप का अपना एलिमेंट (`trigger`) |
| क्लियर बटन | पिकर का व्यू, ट्रिगर के बाद (`cleanable`, मान होने पर) | `clearButtonClass`, `clearButtonStyle`; इसकी सामग्री `clearButton` |
| पॉपअप या शीट | सबके ऊपर, ट्रिगर पर (डेस्कटॉप) या नीचे (टच स्क्रीन) | `popupClass`, `popupStyle` |
| बैकड्रॉप | शीट के पीछे (टच स्क्रीन) | `backdropClass`, `backdropStyle` |
| सामग्री | पॉपअप | `contentClass`, `contentStyle` |
| प्रीसेट | सामग्री, सबसे पहले (`presets`) | `presetsClass`, `presetsStyle`; हर एक `presetClass`, `presetStyle` |
| कैलेंडर | सामग्री | `calendarClass`, `calendarStyle`, और [Calendar](./calendar.md#parts) के भाग |
| समय की पंक्ति | कैलेंडर के नीचे (`timePrecision`) | `timeClass`, `timeStyle`; इसका लेबल `timeLabel` |
| समय फ़ील्ड | समय की पंक्ति | `timeFieldClass`, `timeFieldStyle`, और [TimeField](./time-field.md#parts) के भाग |

<a id="keyboard"></a>

## कीबोर्ड

| कुंजी | क्रिया |
|---|---|
| Return (ट्रिगर पर) | पॉपअप खोलता है, या बंद करता है। |
| Delete, Backspace (ट्रिगर पर) | पॉपअप बंद होने पर मान साफ़ करता है। |
| Escape | बिना कोई चुनाव किए पॉपअप बंद करता है। |

पॉपअप में, कैलेंडर की कुंजियाँ दिनों के बीच जाती हैं और एक को चुनती हैं ([कीबोर्ड](./calendar.md#keyboard) देखें) और समय फ़ील्ड की कुंजियाँ समय संपादित करती हैं ([कीबोर्ड](./time-field.md#keyboard) देखें)।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- स्क्रीन रीडर के लिए ट्रिगर एक combobox है: इसका लेबल `accessibilityLabel` है, इसका मान वह तारीख़ है जैसी `dateFormat` लिखता है (डिफ़ॉल्ट रूप से `2026/10/28`, समय के साथ `timePrecision` पर), और यह बताता है कि पॉपअप विस्तारित है या नहीं। `disabled` इसे मंद कर देता है।
- कैलेंडर के दिन बटन हैं जिनके नाम उनकी ISO तारीख़ें हैं ([एक्सेसिबिलिटी](./calendar.md#accessibility) देखें); प्रीसेट बटन हैं जिनके नाम उनके लेबल हैं; समय फ़ील्ड का नाम `timeAccessibilityLabel` से तय होता है।
- क्लियर बटन एक बटन है जिसका नाम `clearButtonAccessibilityLabel` से तय होता है।

सामान्य रूप से लेबल, भूमिकाओं और घोषणाओं के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।
