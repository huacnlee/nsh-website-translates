---
title: "Calendar"
description: "Calendar कॉम्पोनेंट: दिनों वाले महीनों में से एक तारीख या तारीखों की एक रेंज चुनने की सुविधा, जिसमें महीने और साल के व्यू तथा कीबोर्ड सपोर्ट शामिल है, और जिसे ऐप अपनी शैली के अनुसार स्टाइल करता है।"
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

Calendar एक तारीख चुनता है, या `range` के साथ तारीखों की एक रेंज, जो हफ्तों में सजे दिनों वाले महीनों में से चुनी जाती है: किसी फ़ॉर्म की देय तिथि, ठहरने की रातें, किसी रिपोर्ट के दिन। यह एक महीना या कई महीने साथ-साथ दिखाता है, Previous और Next से महीने बदलता है, और दूर जाने के लिए साल के महीनों के व्यू या वर्षों के पेज पर स्विच करता है। यह [DatePicker](./date-picker.md) के पॉपअप में मौजूद calendar ही है, जो यहाँ पेज में अकेला है।

Calendar व्यवहार का मालिक है: मान (ऐप का, या उसका अपना), दिखाया गया महीना, व्यू, वे दिन जो चुने नहीं जा सकते, कीबोर्ड और स्क्रीन रीडर जो सुनते हैं। रूप-रंग ऐप का है: वह हेडर, बॉडी, हर महीने, हर पंक्ति और हर आइटम को स्टाइल करता है, और आइटमों की सामग्री (महीनों और सप्ताह के दिनों के नाम, आज का चिह्न, रेंज की पट्टी) खुद बनाता है। ग्रिड को जितनी चौड़ाई दी जाती है उसे भरता है, जैसे किसी टेबल के कॉलम भरते हैं: महीने उसे आपस में बाँट लेते हैं और एक पंक्ति के आइटम पंक्ति को बराबर बाँट लेते हैं। इसलिए फ़ोन की शीट में calendar पूरी स्क्रीन में फैल जाता है, जबकि अपनी सामग्री के आकार वाले पॉपअप में वह अपने आइटमों की चौड़ाई रखता है (`flex-none` को `itemClass` या `monthClass` में रखने से आइटम या महीना अपनी ही चौड़ाई पर रहता है)।

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। Rust में `calendar()` एक calendar बनाता है, जिसमें हर प्रॉप के लिए एक setter (`.value(..)`, `.range(..)`, `.number_of_months(..)`) और हर इवेंट के लिए एक listener (`.on_change(..)`) होता है। इसका मान एक `Date` है (`Date::Single`, `Date::Range`, किसी `chrono::NaiveDate` से या उनके जोड़े से), और जो दिन यह अक्षम करता है वह एक `Matcher` है।

<a id="value"></a>

## मान

मान एक ISO तारीख है, `"2026-10-28"`, जैसे HTML `<input type="date">` का होता है; `range` के साथ यह `[start, end]` होता है, और `null` का अर्थ है कोई तारीख नहीं। `value` के साथ ऐप उसका मालिक होता है: calendar उसे चुने हुए के रूप में दिखाता है और किसी चयन की सूचना `onChange({ value })` से देता है; उसके साथ चलने के लिए ऐप `value` सेट करता है। छोड़ देने पर calendar अपना मान खुद रखता है, शुरू में `defaultValue` से।

`onChange` केवल पूर्ण मान बताता है, जैसे `gpui-base` का `Selected`: दबाया गया कोई दिन, या रेंज का अंत।

- `range` के बिना, किसी दिन को दबाने से वह चुन लिया जाता है।
- `range` के साथ, पहला प्रेस रेंज शुरू करता है और दूसरा उसे खत्म करता है; उनके बीच के दिन रेंज में आते हैं (हर एक `selected`, अपने सिरों समेत, देखें [Items](#items))। किसी पहले वाले दिन पर दूसरा प्रेस रेंज को उसी दिन से दोबारा शुरू कर देता है, और रेंज पूरी होने के बाद का प्रेस भी ऐसा ही करता है। आधी रेंज पूरी होने तक दिखती रहती है और पूरी होने पर ही बताई जाती है।

Calendar मान के महीने पर खुलता है (रेंज की शुरुआत वाले), नहीं तो आज के महीने पर।

<a id="months-and-views"></a>

## महीने और व्यू

`numberOfMonths` उतने महीने साथ-साथ दिखाता है, दिखाए गए महीने से आगे; Previous और Next उन्हें एक बार में एक महीना बदलते हैं। `firstDayOfWeek` वह दिन है जिससे हफ्ते शुरू होते हैं, `0` रविवार (डिफ़ॉल्ट) से `6` शनिवार तक।

हेडर में Previous, दो टॉगल और Next होते हैं:

- डे व्यू महीनों के दिन दिखाता है, हर महीना अपने सप्ताह-दिनों की पंक्ति और अपने हफ्तों का एक कॉलम होता है; पहले और बाद के महीनों के दिन हफ्तों को भर देते हैं (`outside`, `data-outside`)।
- महीने का टॉगल (`monthToggle`) मंथ व्यू खोलता है: बारह महीने, तीन-तीन की पंक्तियों में। किसी एक को चुनने पर वह डे व्यू में दिखता है।
- साल का टॉगल (`yearToggle`) ईयर व्यू खोलता है: 20 वर्षों का एक पेज, पाँच-पाँच की पंक्तियों में, जहाँ Previous और Next पेज बदलते हैं। किसी एक को चुनने पर वह साल डे व्यू में दिखता है। `yearRange` वे वर्ष हैं जिन तक पेज चलते हैं, `[start, end)` (डिफ़ॉल्ट: इस साल से 50 वर्ष पहले से 50 वर्ष बाद तक)।

कई महीनों के साथ, हेडर टॉगल की जगह हर महीने का शीर्षक दिखाता है (एक `monthToggle` आइटम जो प्रेस नहीं लेता), जैसे `gpui-base` का।

<a id="disabled-dates"></a>

## अक्षम तिथियाँ

`disabledMatcher` वे दिन हैं जिन्हें उपयोगकर्ता नहीं चुन सकता, `gpui-base` का `Matcher`, चार रूपों में से किसी एक में:

| रूप | क्या अक्षम करता है |
|---|---|
| `[0, 6]` | सप्ताह के वे दिन, `0` रविवार से `6` शनिवार तक। |
| `{ before, after }` | `before` से पहले और `after` के बाद के दिन (कोई भी एक छोड़ा जा सकता है)। |
| `{ from, to }` | `from` से `to` तक के दिन, दोनों समेत (छोड़ा गया सिरा खुला माना जाता है)। |
| `(date) => boolean` | वे दिन जिनके लिए फ़ंक्शन `true` लौटाता है, हर दिखाए गए दिन की ISO तारीख दी जाने पर। |

फ़ंक्शन से हर दिखाए गए दिन के लिए एक बार, अगले JS टर्न में पूछा जाता है, और जिस दिन का वह जवाब दे चुका हो उसके लिए दोबारा नहीं: महीने बदलने पर केवल उन्हीं दिनों के बारे में पूछा जाता है जो वे लाते हैं, इसलिए उसका जवाब तारीख का शुद्ध फ़ंक्शन होना चाहिए। कोई दूसरा फ़ंक्शन देने पर फिर से पूछा जाता है। अक्षम दिन `disabled:` होता है: वह प्रेस नहीं लेता, और Return और Space उसे नहीं चुनते।

<a id="items"></a>

## आइटम

Calendar का हर प्रेस टारगेट और लेबल एक आइटम है: Previous, टॉगल, Next, सप्ताह के दिन, दिन, महीने और वर्ष। हर एक `itemClass` और `itemStyle` से स्टाइल किए गए पार्ट में बनाया जाता है, जिसके वैरिएंट उसकी स्थिति के अनुसार चलते हैं:

| वैरिएंट | आइटम |
|---|---|
| `selected:` | चुना हुआ है: तारीख, पूर्ण रेंज का हर दिन (सिरों समेत, जैसा React Aria का range calendar), आधी रेंज की शुरुआत, दिखाया गया महीना या साल, खुले व्यू का टॉगल। स्क्रीन रीडर इसे चुना हुआ सुनाते हैं। |
| `disabled:` | प्रेस नहीं लेता: अक्षम तारीख, सप्ताह का दिन, महीने का शीर्षक, मंथ व्यू में या वर्षों के सिरों पर Previous और Next। |
| `focus:` | कीबोर्ड इसके पास है। |
| `data-range-start:`, `data-range-end:` | पूर्ण रेंज का पहला या आखिरी दिन है (एक दिन की रेंज में दोनों)। |
| `data-range-middle:` | पूर्ण रेंज के भीतर का दिन है, सिरा नहीं। |
| `data-today:` | आज है। |
| `data-outside:` | पहले या बाद के महीने का दिन है, जो हफ्तों को भरता है। |

`data-*` वैरिएंट Tailwind के हैं (`data-range-start:` `[data-range-start]` से मेल खाता है), जैसे shadcn का calendar अपने दिनों को स्टाइल करता है; `itemClass` में `group` के साथ, सामग्री उनके पीछे `group-selected:`, `group-data-range-middle:` और इसी तरह चलती है। `selected:` का अर्थ है रेंज का हर दिन, इसलिए रेंज के सिरे उसके ऊपर अपना रूप लेते हैं (बाद के वैरिएंट जीतते हैं: `data-*` `selected:` के बाद आता है), और बीच के दिन अपना:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` किसी आइटम की सामग्री इस आधार पर बनाता है कि वह क्या है, यानी `CalendarEntry`, उसकी स्थिति के आधार पर कभी नहीं: ड्रॉइंग एक बार बनती है और आइटम के चुने जाने, फ़ोकस पाने या रेंज में आने पर भी वैसी ही रहती है, इसलिए कुंजियाँ, चयन और फ़ोकस कुछ दोबारा नहीं बनाते, और महीनों का बदलना जो दिन लाता है उन्हें एक-एक बार बनाता है (दिन अपनी ड्रॉइंग अपने महीने और तारीख से रखता है: कई महीनों के साथ, जो महीने अब भी दिख रहे हैं वे अपनी ड्रॉइंग रखते हैं)।

| फ़ील्ड | अर्थ |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` या `"year"`। |
| `value` | उसकी संख्या: महीने का दिन, महीना (1 से 12), वर्ष, सप्ताह का दिन (`0` रविवार से `6` तक); Previous और Next के लिए `0`। |
| `date` | किसी दिन की ISO तारीख। |
| `year`, `month` | वह वर्ष और महीना जिससे वह संबंधित है: किसी दिन का (वह महीना जिसके हफ्तों में वह दिखता है), महीने के टॉगल या शीर्षक का, मंथ व्यू के किसी महीने का; साल के टॉगल और किसी वर्ष का अपना वर्ष। Previous, Next और सप्ताह के दिनों के लिए `0` (और साल के टॉगल तथा वर्षों के लिए `month`)। |
| `today` | दिन आज है। |
| `outside` | दिन पहले या बाद के महीने का है। |

`renderItem` के बिना, आइटम अपनी संख्या दिखाता है, और Previous तथा Next `‹` और `›` दिखाते हैं, जैसे `gpui-base` के; सप्ताह का दिन भी अपनी संख्या दिखाता है, `0` से `6` तक, क्योंकि महीनों और सप्ताह के दिनों के नाम ऐप की भाषा में ऐप के अपने शब्द हैं।

## Props

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | कोई नहीं | मान, जिसका मालिक ऐप है। |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | शुरू में मान, `value` के बिना। |
| `range` | `.range(..)` | `boolean` | `false` | रेंज चुनें: पहला प्रेस उसे शुरू करता है, दूसरा खत्म। |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | कितने महीने साथ-साथ दिखते हैं। |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | वह दिन जिससे हफ्ते शुरू होते हैं, `0` रविवार से `6` शनिवार तक। |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | कोई नहीं | वे तारीखें जो चुनी नहीं जा सकतीं। |
| `yearRange` | `.year_range(..)` | `[number, number]` | दोनों ओर 50 वर्ष | वे वर्ष जिन तक ईयर व्यू के पेज चलते हैं, `[start, end)`। |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | कोई नहीं | Previous के लिए स्क्रीन रीडर क्या बोलते हैं। |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | कोई नहीं | Next के लिए स्क्रीन रीडर क्या बोलते हैं। |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हेडर: Previous, टॉगल (या महीनों के शीर्षक), Next। |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | बॉडी: साथ-साथ महीने, या मंथ या ईयर व्यू की पंक्तियाँ। |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | डे व्यू का हर महीना। |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर पंक्ति: सप्ताह के दिन, एक हफ्ता, महीनों या वर्षों की एक पंक्ति। |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर आइटम: `selected:`, `disabled:`, `focus:`; किसी दिन के `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([Items](#items))। |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | कोई नहीं | आइटम की सामग्री, जिसे ऐप इस आधार पर बनाता है कि आइटम क्या है; अन्यथा उसकी संख्या। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | Calendar: बॉडी के ऊपर हेडर। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | उपयोगकर्ता ने पूर्ण मान चुना: `{ value }`, एक दिन या एक रेंज। उसके साथ चलने के लिए `value` सेट करें। ऐप द्वारा दिया गया `value` कभी रिपोर्ट नहीं होता। |

<a id="parts"></a>

## पार्ट्स

| पार्ट | कहाँ | किससे स्टाइल होता है |
|---|---|---|
| Calendar | रूट | `class`, `style` |
| हेडर | calendar में, सबसे पहले | `headerClass`, `headerStyle` |
| बॉडी | calendar में, हेडर के बाद | `bodyClass`, `bodyStyle` |
| एक महीना | बॉडी (डे व्यू) | `monthClass`, `monthStyle` |
| एक पंक्ति | एक महीना, या बॉडी (मंथ और ईयर व्यू) | `rowClass`, `rowStyle` |
| एक आइटम | हेडर और पंक्तियाँ | `itemClass`, `itemStyle`, `renderItem` (भीतर `group-selected:`, `group-data-range-middle:`, ... `itemClass` में `group` के अंतर्गत) |

<a id="keyboard"></a>

## कीबोर्ड

दिन Tab का एक ठहराव हैं: वह चुने हुए दिन पर उतरता है, नहीं तो आज पर, नहीं तो पहले दिखाए गए दिन पर। फिर:

| कुंजी | क्रिया |
|---|---|
| Left / Right | पहले या बाद का दिन। |
| Up / Down | एक हफ्ते पहले या बाद का वही दिन। |
| Home / End | हफ्ते का पहला या आखिरी दिन। |
| Page Up / Page Down | एक महीने पहले या बाद का वही दिन। |
| Shift+Page Up / Shift+Page Down | एक साल पहले या बाद का वही दिन। |
| Return, Space | दिन को चुनता है। |

दाएँ-से-बाएँ लेआउट में हफ्ते दाईं ओर से चलते हैं, इसलिए Left बाद का दिन है और Right पहले का; Up और Down हफ्तों को वैसा ही रखते हैं। दिखाए गए महीनों के पार जाने पर वे बदल जाते हैं। Previous, टॉगल, Next, महीने और वर्ष प्रेस लेते हैं।
`gpui-base` के दिन केवल प्रेस लेते हैं; कुंजियाँ NSH की हैं, WAI-ARIA date picker dialog के अनुसार।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- हर दिन एक बटन है जिसका नाम उसकी ISO तारीख है, वह तब चुना हुआ माना जाता है जब वह तारीख हो या रेंज का कोई दिन (सिरों समेत, जैसा React Aria का range calendar), और अक्षम होने पर धुंधला दिखता है।
- Previous और Next `previousAccessibilityLabel` और `nextAccessibilityLabel` नाम के बटन हैं; टॉगल, महीने और वर्ष उसी नाम के बटन हैं जो वे दिखाते हैं।

सामान्य रूप से लेबल, रोल और घोषणाओं के लिए [Accessibility](../docs/accessibility.md) देखें।
