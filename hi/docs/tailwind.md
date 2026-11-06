---
title: "Tailwind"
description: "TSX में नेटिव रूप से resolve होने वाली Tailwind CSS क्लासेस और Rust में उनके टाइप्ड समकक्ष - class और classList, pressed स्टेट्स, डार्क मोड और ब्रेकपॉइंट्स के लिए variants, nsh.json में थीम, और बिल्ड-टाइम क्लास चेक।"
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

NSH की स्टाइलिंग Tailwind CSS 4 का पालन करती है। Rust में, Tailwind की यूटिलिटीज़ उन्हीं नामों और मानों वाले टाइप्ड स्टाइल मेथड हैं (`.p_4()` है `p-4`, `.rounded_2xl()` है `rounded-2xl`, `ZINC.shade(900)` है `zinc-900`); TSX में, हर एलिमेंट `class` में सीधे क्लासेज़ स्वीकार करता है, जिन्हें Tailwind 4 की डिफ़ॉल्ट थीम के विरुद्ध नेटिव रूप से रिज़ॉल्व किया जाता है। नीचे हर उदाहरण में पहले टाइप्ड मेथड और फिर क्लासेज़ दिखाई गई हैं:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

टाइप्ड मेथड उन्हीं स्टाइल नियमों में लोअर होते हैं जिनमें क्लासेज़ कंपाइल होती हैं, और पार्स करने के लिए कोई स्ट्रिंग नहीं होती। क्लासेज़ के लिए कोई CSS जनरेट नहीं होता और JavaScript में कुछ नहीं चलता: स्ट्रिंग कोर को दी जाती है, जो हर अलग क्लास स्ट्रिंग को एक बार पार्स करता है (और कैश करता है), उसे स्टाइल नियमों में बदलता है और लागू करता है। जो वेरिएंट स्थिति पर निर्भर हैं (pressed, dark mode, विंडो की चौड़ाई), उन्हें स्थिति बदलने पर कोर फिर से लागू करता है। pressed और focused स्थितियाँ नेटिव रूप से ट्रैक होती हैं, इसलिए `active:` फ़ीडबैक (Rust में `.active(..)`) के लिए आपके कोड तक कोई राउंड ट्रिप नहीं होता।

क्लासेज़ और [`style` prop](./styling.md) एक जैसी नेटिव स्टाइल बनाते हैं और साथ में इस्तेमाल किए जा सकते हैं; यह पेज केवल क्लासेज़ और उनके टाइप्ड समकक्षों की विशिष्टताएँ बताता है। [Tailwind रेफ़रेंस](../modules/tailwind-reference.md) में समर्थित हर यूटिलिटी सूचीबद्ध है।

<a id="class-and-classlist"></a>

## class और classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** क्लासेज़ की एक स्ट्रिंग है। यह डायनामिक हो सकती है: ``class={`h-6 rounded bg-${color()}-500`}`` काम करती है, क्योंकि क्लासेज़ रन टाइम पर रिज़ॉल्व होती हैं।
- **`classList`** क्लासेज़ को शर्तों से मैप करता है: जब तक किसी क्लास का मान truthy है, वह लागू रहती है। यह `class` के बाद लागू होता है।
- **Rust में**, क्लोज़र या सिग्नल दिया गया मेथड उसका अनुसरण करता है (`.bg(move || ..)`), `.style_when(condition, |s| ..)` शर्त के बने रहने तक स्टाइल लागू करता है, और `.when(condition, |v| ..)` एलिमेंट बनते समय एक बार तय करता है।

टकराव कैसे सुलझते हैं:

1. **बाद की क्लासेज़ जीतती हैं** उसी स्ट्रिंग की पहले वाली क्लासेज़ पर: `"p-2 p-4"` का अर्थ `p-4` है। `tailwind-merge` की कोई ज़रूरत नहीं: कंपोनेंट वह `class` जोड़ सकता है जो उसका कॉलर देता है। Rust में भी बाद के मेथड जीतते हैं।
2. **वेरिएंट क्लासेज़ सादी क्लासेज़ के बाद लागू होती हैं**, और स्ट्रिंग में उनकी स्थिति चाहे जो हो, वे Tailwind के वेरिएंट क्रम में लगती हैं (`hover:` `active:` से पहले, `max-*:` में सबसे चौड़ा पहले, ब्रेकपॉइंट बढ़ते क्रम में, `dark:` सबसे अंत में)। Tailwind की तरह ही, पहले क्लास का सबसे ऊँचा वेरिएंट तय करता है, फिर उसका अगला सबसे ऊँचा, और जिस क्लास में एक वेरिएंट अधिक हो वह बाद में आती है: `dark:hover:bg-a dark:bg-b` डार्क मोड में होवर होने पर `bg-a` है, और `max-md:p-2 max-lg:p-4` `md` से नीचे `p-2` है। CSS की तरह, `odd:bg-a last:bg-b` विषम अंतिम पंक्ति को `bg-a` देता है, क्योंकि Tailwind `odd` को `last` के बाद क्रमबद्ध करता है।
3. **`style` क्लासेज़ पर जीतता है।** स्टाइल कुंजी अपने नाम की CSS प्रॉपर्टी होती है, वही जिसे क्लासेज़ सेट करती हैं, इसलिए वह केवल उसी प्रॉपर्टी को बदलती है: `style={{ paddingLeft: 8 }}` `pl-4` को बदलता है और `pr-4` को बनाए रखता है।
4. `!` किसी क्लास को important बनाता है: `!p-0`।

Rust कंपोनेंट (`nsh/base` के और ऐप के अपने crate के) TSX से भी `class` और `classList` स्वीकार करते हैं; आपकी क्लासेज़ कंपोनेंट की अपनी स्टाइल के बाद मर्ज होती हैं और बराबर रैंक पर जीतती हैं।

## Variants

| वेरिएंट | कब लागू होता है | Rust |
|---|---|---|
| `active:` | व्यू दबा हुआ है | `.active(\|s\| ..)` |
| `hover:` | पॉइंटर व्यू के ऊपर है (iPad और Mac के पॉइंटर) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | इनपुट पर फ़ोकस है | `.focus(\|s\| ..)` |
| `focus-within:` | व्यू या उसके किसी डिसेंडेंट पर फ़ोकस है (`Overlay` की सामग्री उस व्यू का डिसेंडेंट है जिसमें वह है) | `.focus_within(..)` |
| `disabled:`, `enabled:` | एलिमेंट का `disabled` prop true / false है | `.disabled_style(\|s\| ..)` |
| `selected:` | एलिमेंट चयनित है (`Button` का `selected`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | एलिमेंट चेक्ड है (`accessibilityState.checked` है `true`; `"mixed"` चेक्ड नहीं है) | `.checked_style(..)` |
| `indeterminate:` | एलिमेंट indeterminate है (`accessibilityState.checked` है `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | एलिमेंट विस्तारित है (`accessibilityState.expanded` है `true`): `Popover` या `Menu` का ट्रिगर, जब उसका पॉपअप खुला हो | `.expanded_style(..)` |
| `aria-pressed:` | एलिमेंट एक टॉगल बटन है जो ऑन है (`accessibilityState.pressed` है `true`; `"mixed"` दबा हुआ नहीं है)। यह `active:` नहीं है, जो चल रहा प्रेस है | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, `"mixed"` नहीं) या `selected` `true` है, जैसे Tailwind के `aria-*` वेरिएंट: pseudo-classes के बाद, उनके नामों के क्रम में | |
| `data-<name>:` | एलिमेंट में `data-*` एट्रिब्यूट `name` है, जैसे Tailwind के बूलियन `data-*` वेरिएंट (`&[data-range-start]`): कंपोनेंट का पार्ट अपनी स्थितियों के अलावा जो दिखाता है, जैसे कैलेंडर का रेंज की शुरुआत वाला दिन (`data-range-start:`)। `aria-*` वेरिएंट के बाद, उनके नामों के क्रम में | `Interactive::project_data(name, ..)` कंपोनेंट के पार्ट पर एक सेट करता है |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | निकटतम पूर्वज, जिसमें `group` क्लास है, उस स्थिति में है, या उसमें वह `data-*` एट्रिब्यूट है | पूर्वज पर `.group()`; अंदर `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` |
| `group-active/name:` ... | यही, `group/name` से चिह्नित पूर्वज के लिए | `.group_named("name")`; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | एलिमेंट की अपने सिबलिंग्स के बीच अपनी स्थिति। किसी पंक्ति के लेबल को पंक्ति की स्थिति के अनुसार रंगने के लिए `last:text-*` पंक्ति पर लगाएँ: लेबल उसे इनहेरिट करता है | पंक्ति के इंडेक्स से सादा Rust (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | इनपुट के प्लेसहोल्डर को स्टाइल करता है (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | इनपुट या चयन-योग्य टेक्स्ट, और एलिमेंट के भीतर मौजूद ऐसे एलिमेंट्स, के सिलेक्शन हाइलाइट को रंगता है (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | सिस्टम अपीयरेंस डार्क है | एक `AdaptiveColor`, या `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | विंडो कम से कम 640, 768, 1024, 1280, 1536 पॉइंट चौड़ी है | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | विंडो ब्रेकपॉइंट से संकरी है | वही, `<` के साथ |
| `min-[600px]:`, `max-[600px]:` | मनमाने ब्रेकपॉइंट | वही |
| `portrait:`, `landscape:` | विंडो का ओरिएंटेशन | `window().width > window().height` |
| `ios:`, `android:`, `web:` | प्लेटफ़ॉर्म | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | [लेआउट दिशा](./layout.md#right-to-left) | व्यू पर `.direction(LayoutDirection::..)` |
| `motion-safe:`, `motion-reduce:` | उपयोगकर्ता की reduce motion सेटिंग | `reduce_motion()` |

वेरिएंट आपस में जुड़ते हैं: `dark:active:bg-zinc-700`, `md:landscape:flex-row`। Rust में, `.active(..)` स्टाइल में `AdaptiveColor` का अर्थ `dark:active:` है।

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

किसी भी एलिमेंट पर `disabled` (Rust में `.disabled(..)`) `disabled:` क्लासेज़ (`.disabled_style(..)`) लागू करता है और जो माउंट किया गया है उससे उसके प्रेस हैंडलर हटा देता है, इसलिए वह कोई प्रेस फ़ीडबैक भी नहीं दिखाता:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

ब्रेकपॉइंट विंडो (वह सतह जिस पर NSH रेंडर करता है) से तुलना करते हैं, डिवाइस से नहीं: iPad के स्प्लिट व्यू या आकार बदलने योग्य विंडो में वे विंडो की चौड़ाई का अनुसरण करते हैं, जैसा `window()` करता है।

<a id="what-differs-from-tailwind-on-the-web"></a>

## वेब पर Tailwind से क्या अलग है

- **इकाइयाँ पॉइंट हैं।** `p-4` (`.p_4()`) 16 पॉइंट है (1 स्पेसिंग स्टेप = 4pt, 1rem = 16pt)। `px` में मनमाने मान भी पॉइंट हैं: `p-[13px]` (`.p(px(13.0))`) 13pt है।
- **`flex` एक पंक्ति है**, जैसा CSS में होता है: `class="flex"` अपने चाइल्ड को एक पंक्ति में रखता है, जब तक कोई दिशा क्लास कुछ और न कहे (स्ट्रिंग में कहीं भी: `flex-col flex` एक कॉलम है)। किसी स्टाइल का `display: "flex"` और Rust का `.flex()` भी इसी तरह पंक्तियाँ हैं, और जो व्यू कोई display सेट नहीं करता वह NSH का डिफ़ॉल्ट कॉलम रखता है। `block` और `flow-root` ब्लॉक लेआउट इस्तेमाल करते हैं, और `inline` तथा `inline-block` भी, जैसे ब्राउज़र उन्हें flex या grid पेरेंट में लेआउट करता है। Rust में `.flex_row()` और `.flex_col()` दिशा सेट करते हैं।
- **व्यू पर टेक्स्ट क्लासेज़ इनहेरिट होती हैं।** `text-*`, `font-*`, `leading-*`, `tracking-*` और व्यू पर अन्य टेक्स्ट यूटिलिटीज़ (Rust में `.text_color(..)`, `.font_weight(..)`, ...) उसके अंदर के टेक्स्ट और इनपुट एलिमेंट्स तक पहुँचती हैं, जैसे CSS इनहेरिटेंस करती है: `<View class="text-white">` उसके लेबल सफ़ेद कर देता है।
- **हर व्यू अपना एक बॉक्स है।** `overflow-x-hidden` और `overflow-y-hidden` दोनों अक्षों पर क्लिप करते हैं, जैसा `overflow-hidden` करता है (स्क्रॉलिंग [scroll](../elements/scroll.md) एलिमेंट का काम है); `invisible` व्यू और उसके अंदर की हर चीज़ को छिपा देता है; `mix-blend-*` व्यू को उसके पीछे बनी हर चीज़ के साथ ब्लेंड करता है; `block` बॉक्स अपने मार्जिन और अपने चाइल्ड के मार्जिन को अलग रखते हैं; `absolute` व्यू अपने निकटतम पोज़िशन्ड पूर्वज में रखा जाता है, जैसा CSS में होता है; `fixed` व्यू को उसके रूट व्यू में लेआउट करता है (अन्य एलिमेंट `absolute` की तरह रखे जाते हैं)।
- **टेक्स्ट अपनी व्हाइटस्पेस बनाए रखता है।** स्ट्रिंग में स्पेस और लाइन ब्रेक जैसे लिखे हैं वैसे ही बनते हैं, और `whitespace-*` रैपिंग तय करता है; JSX कंपाइलर लिटरल JSX टेक्स्ट की व्हाइटस्पेस को संकुचित करता है, जैसा JSX करता है।
- **ट्रांज़िशन प्रॉपर्टी समूहों को एनिमेट करते हैं**: `transition` रंग, opacity, शैडो और ट्रांसफ़ॉर्म को एनिमेट करता है, `transition-all` कॉर्नर रेडियस और बॉर्डर की चौड़ाई को भी; फ़िल्टर, बैकड्रॉप फ़िल्टर, ग्रेडिएंट और लेआउट अपने नए मान तुरंत ले लेते हैं।
- **`focus-visible:` है `focus:`**: यह तब भी लागू होता है जब एलिमेंट पर फ़ोकस हो।
- **स्थिति के बैकग्राउंड ग्रेडिएंट के ऊपर दिखते हैं।** CSS में ग्रेडिएंट `background-color` को ढक लेता है, इसलिए `bg-linear-*` सतह पर `active:bg-*` कभी दिखाई नहीं देता; NSH में `active:`, `hover:`, `focus:` या `group-*:` से आया बैकग्राउंड रंग उस स्थिति के बने रहने तक ग्रेडिएंट की जगह ले लेता है (जब तक स्थिति अपना ग्रेडिएंट सेट न करे, जैसे `active:from-*`)। `activeStyle` और अन्य स्थिति स्टाइल, तथा एनिमेटेड बैकग्राउंड रंग भी ऐसे ही हैं।
- **टेक्स्ट और टच सेटिंग्स स्टाइल कुंजियाँ हैं**: `line-clamp-*` `numberOfLines` सेट करता है, `text-ellipsis` और `text-clip` `textOverflow` सेट करते हैं, `truncate` दोनों, `select-*` `userSelect` सेट करता है और `pointer-events-*` `pointerEvents` सेट करता है, इसलिए वे स्थिति वेरिएंट में काम करती हैं और हर क्लास की तरह इनलाइन `style` से हार जाती हैं; `caret-*`, `placeholder:text-*` और `selection:bg-*` इसी तरह `caretColor`, `placeholderColor` और `selectionColor` स्टाइल सेट करते हैं। Rust में ये `Styled` मेथड हैं (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...)। `whitespace-nowrap` टेक्स्ट को क्लास के रूप में एक पंक्ति में रखता है। `object-*` इमेज और वीडियो की `objectFit` और `objectPosition` स्टाइल सेट करते हैं, जिन्हें स्टाइल की कुंजियाँ किसी अन्य की तरह बदल देती हैं।
- **समर्थित सेट**: Tailwind 4 की वे यूटिलिटीज़ और वेरिएंट जिनका नेटिव अर्थ है। `peer-*` वेरिएंट, pseudo-elements (`before:`, `after:`) और मनमानी प्रॉपर्टीज़ (`[mask-type:luminance]`) अज्ञात क्लासेज़ के रूप में रिपोर्ट होते हैं, और हर वह यूटिलिटी भी जिसका NSH में कोई नेटिव अर्थ नहीं है, ताकि कोई क्लास कभी ब्राउज़र से अलग अर्थ न रखे। रेंडरिंग संकेत (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) स्वीकार किए जाते हैं और कुछ नहीं बदलते।

बाकी सब कुछ वैसे ही काम करता है जैसा Tailwind 4 में दस्तावेज़ित है: रंग पैलेट, opacity मॉडिफ़ायर (`bg-black/40`), मनमाने मान (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`; `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` और `m` यूटिलिटीज़ पर एनवायरनमेंट वेरिएबल भी, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, देखें [Safe area](../elements/safe-area.md) और [Keyboard](../elements/keyboard.md)), भिन्न (`w-1/2`, `translate-x-1/2`), शैडो और रिंग, ग्रेडिएंट (`bg-linear-to-r`, `bg-radial`, `bg-conic` के साथ `from-` / `via-` / `to-`), फ़िल्टर, `backdrop-blur-*`, `mix-blend-*`, ट्रांसफ़ॉर्म, `transition-*` और `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce`, और grid, हर एक Rust में अपने टाइप्ड मेथड के साथ। [फ़िल्टर और ब्लेंडिंग](./styling.md#filters-and-blending) की प्लेटफ़ॉर्म सीमाएँ क्लासेज़ पर भी लागू होती हैं।

## Theme

क्लासेज़ Tailwind 4 की डिफ़ॉल्ट थीम के विरुद्ध रिज़ॉल्व होती हैं। इसे `nsh.json` में `"tailwind"` के अंतर्गत बढ़ाएँ; आपकी प्रविष्टियाँ डिफ़ॉल्ट में जुड़ जाती हैं (या उसी नाम के डिफ़ॉल्ट को बदल देती हैं):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

इस थीम के साथ `bg-brand-500`, `text-brand` (`DEFAULT` शेड), `border-ink`, `rounded-card`, `font-display` और `tablet:flex-row` मान्य क्लासेज़ हैं।

| कुंजी | मान | क्या बनाता है |
|---|---|---|
| `colors` | एक CSS रंग, या शेड्स का ऑब्जेक्ट (सादे नाम के लिए `"DEFAULT"`) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | प्रति स्पेसिंग स्टेप पॉइंट (डिफ़ॉल्ट 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | मनमाने मानों में प्रति `rem` पॉइंट (डिफ़ॉल्ट 16) | |
| `breakpoints` | पॉइंट | `name:` वेरिएंट |
| `container` | पॉइंट | `max-w-*` साइज़ |
| `fontSize` | पॉइंट, या `[size, lineHeight]` जिसमें लाइन की ऊँचाई आकार का गुणज हो | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | फ़ॉन्ट फ़ैमिली का नाम (सिस्टम फ़ैमिली या [इम्पोर्ट किए गए फ़ॉन्ट](./fonts.md) का नाम) | `font-*` |
| `tracking` | Ems | `tracking-*` |
| `leading` | फ़ॉन्ट साइज़ के गुणज | `leading-*` |
| `radius` | पॉइंट | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | एक CSS `box-shadow` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | पॉइंट | `blur-*`, `backdrop-blur-*` |
| `perspective` | पॉइंट | `perspective-*` |
| `aspect` | एक अनुपात (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

अज्ञात कुंजियाँ और अमान्य मान बिल्ड एरर हैं (`nsh.json: tailwind: unknown theme key 'colours'`)। थीम बंडल में कंपाइल होती है और पहले फ़्रेम से पहले लागू हो जाती है।

Tailwind थीम आपकी क्लासेज़ को आकार देती है। टाइप्ड मेथड Tailwind के डिफ़ॉल्ट स्केल बनाए रखते हैं, ताकि Rust कंपोनेंट हर ऐप में एक जैसा दिखे, और ऐप का लुक अपनी थीम के डिज़ाइन टोकन से लेते हैं, जो `nsh.json` में `"theme"` है ([Rust](./rust.md#theme))।
<a id="theme-tokens"></a>

## थीम टोकन

ऐप की थीम (`"theme"`, `nsh.json` में) उसके डिज़ाइन टोकन रखती है: shadcn/ui के रंग (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), उसका `radius`, उसके फ़ॉन्ट `font-sans` और `font-mono`, और ऐप द्वारा जोड़ा गया कोई भी टोकन। क्लासें इन्हें Tailwind नामों से इस्तेमाल करती हैं, जैसे CSS `@theme` के वेरिएबल नाम होते हैं; Rust कंपोनेंट इन्हें `nsh_base` से `theme()` के ज़रिए पढ़ते हैं, और TSX इन्हें `nsh` से `token()` के ज़रिए पढ़ता है, इसलिए TSX स्क्रीन और Rust कंपोनेंट एक ही थीम का पालन करते हैं:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

टोकन का नाम उसके CSS वेरिएबल का नाम होता है, `--` के बिना, जैसा थीम फ़ाइल उसे लिखती है: `muted-foreground`, `radius`, `chart-1`। Rust में shadcn के टोकन `theme()` के मेथड हैं (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), और हर टोकन `theme().color("up")`, `theme().number("radius-card")` या `theme().font("font-display")` होता है।

| रूप | क्या लेता है | उदाहरण |
|---|---|---|
| किसी भी रंग उपयोगिता में रंग का नाम | थीम का रंग, ओपेसिटी के साथ भी | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, Tailwind 4 का वेरिएबल शॉर्टहैंड | थीम का रंग या संख्या | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | वही, टाइप के साथ, जहाँ कोई उपयोगिता कई प्रकार लेती है | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | थीम के फ़ॉन्ट, जब वह उन्हें सेट करती है | `font-mono` |

- **आपके अपने टोकन।** थीम फ़ाइल का हर नाम एक टोकन है, ठीक वैसे ही जैसे CSS `@theme` का हर वेरिएबल: `"up": "#16a34a"` से `bg-up`, `text-up` और `bg-up/30` बनते हैं; `"radius-card": "14px"` से `rounded-(--radius-card)` बनता है; `"font-display": "Pacifico"` से `font-(family-name:--font-display)` बनता है। लंबाइयाँ पॉइंट में होती हैं; `(number:--name)` सादी संख्या देता है।
- **फ़ॉन्ट।** `font-sans` ऐप का फ़ॉन्ट है: जो भी टेक्स्ट अपना कोई फ़ैमिली सेट नहीं करता, वह इसी से बनाया जाता है, जैसे किसी पेज पर Tailwind का `--font-sans` लागू होता है। `font-mono` `font-mono` का और `TextView` में कोड का फ़ॉन्ट है। सेट न होने पर दोनों सिस्टम के फ़ॉन्ट होते हैं।
- **दोनों अपीयरेंस।** टोकन के पास थीम का लाइट और डार्क दोनों मान होते हैं: `bg-primary`, `theme().primary` और `token("primary")` अपीयरेंस के साथ अपने आप बदल जाते हैं, इसके लिए किसी `dark:` क्लास की ज़रूरत नहीं। जो रंग थीम केवल एक अपीयरेंस में सेट करती है, वह दोनों में इस्तेमाल होता है।
- **आपके Tailwind रंग प्राथमिकता पाते हैं।** `"tailwind"` `colors` या Tailwind पैलेट का कोई नाम वही रंग होता है, इसलिए `bg-primary` तभी थीम टोकन है जब Tailwind थीम में `primary` नाम का कोई रंग न हो।
- **ऐप चलते समय थीम बदल सकती है।** जब नेटिव ऐप में एम्बेड किए गए ऐप को उस ऐप की थीम दी जाती है, और जब भी थीम बदलती है, तब टोकन नाम वाली क्लासें, `theme()` पढ़ने वाली Rust बाइंडिंग और `token()` पढ़ने वाला TSX कोड अपडेट हो जाते हैं, क्लासें और बाइंडिंग नेटिव रूप से। एम्बेड करने वाले ऐप की थीम में जो टोकन नहीं होते, वे ऐप के अपने `"theme"` के मान (फिर डिफ़ॉल्ट थीम के मान) रखते हैं। जो होस्ट केवल अपनी ब्रांडिंग जोड़ता है, वह थीम ओवरराइड देता है, यानी वे टोकन जिन्हें उसकी ब्रांडिंग उसी फ़ाइल फ़ॉर्मैट में बदलती है ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), डेस्कटॉप पर `AppView::set_theme_overrides`)।
- **अन्य क्लासों की तरह जाँचे जाते हैं।** जो नाम डिफ़ॉल्ट थीम का या ऐप के `"theme"` का टोकन नहीं है, वह बिल्ड के समय अज्ञात क्लास है (`unknown class 'bg-chart-up'`)। ऐसा टोकन इस्तेमाल करने के लिए जो केवल एम्बेड करने वाला ऐप देता है, उसे ऐप के `"theme"` में भी एक मान दें: ऐप के अकेले चलने पर वही मान दिखता है।

टोकन नाम वाली क्लासें हर थीम के लिए एक बार हल की जाती हैं, किसी भी अन्य क्लास की तरह: इन्हें ड्रॉ करने की लागत उतनी ही है जितनी पैलेट के रंग की।

<a id="445-in-tsx"></a>

### TSX में `token()`

`nsh` से `token(name)` दिखाए गए अपीयरेंस में टोकन का मान देता है: रंग `#rrggbbaa` के रूप में, लंबाई पॉइंट की संख्या के रूप में, फ़ॉन्ट उसके फ़ैमिली नाम के रूप में। यह रिऐक्टिव है, इसलिए जो कोड इसे किसी कंपोनेंट, मेमो या इफ़ेक्ट में पढ़ता है, वह थीम या अपीयरेंस बदलने पर फिर चलता है। यह उन मानों के लिए उपयुक्त है जो वहाँ जाते हैं जहाँ कोई क्लास नहीं जाती, जैसे कैनवास या चार्ट:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

नाम टाइप किए हुए हैं: NSH ऐप के टोकन उसकी थीम से `.nsh/types/nsh/tokens.d.ts` में लिखता है, इसलिए थीम में `"up"` होने पर `token("up")` एक `string` होता है, और थीम में जो नाम नहीं है, वह टाइप एरर है।

<a id="the-class-check"></a>

## क्लास जाँच

`nsh build`, `nsh dev`, `nsh run` और `nsh test` आपके JSX में स्टैटिक क्लास नामों (`class` में स्ट्रिंग लिटरल और `classList` की कुंजियाँ) को उसी पार्सर और थीम से जाँचते हैं जो रनटाइम इस्तेमाल करता है, और जो क्लासें मौजूद नहीं हैं उनके बारे में चेतावनी देते हैं:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

चेतावनियों से बिल्ड फ़ेल नहीं होता। रन टाइम पर बनी क्लासें (``bg-${color()}-500``) तब जाँची जाती हैं जब रनटाइम उन्हें पहली बार देखता है, और वह हर अज्ञात क्लास को एक बार लॉग करता है (`unknown classes: ...`)। टाइप किए गए मेथड Rust कंपाइलर जाँचता है।

<a id="classes-or-styles"></a>

## क्लासें या स्टाइल?

दोनों नेटिव रूप से हल होते हैं और लगभग समान लागत वाले हैं। क्लासें छोटी होती हैं और बिना कोड के वेरिएंट (प्रेस्ड स्टेट, डार्क मोड, ब्रेकपॉइंट) देती हैं। इनलाइन स्टाइल JavaScript में गणना किए गए मान लेते हैं और [नेटिव एनिमेटेड मान](./animation.md) (`opacity: fade`, `translate: [x, 0]`) स्वीकार करते हैं। अधिकांश TSX ऐप स्थिर रूप के लिए क्लासें और गणना किए गए या एनिमेटेड मानों के लिए `style` इस्तेमाल करते हैं। Rust कंपोनेंट दोनों के लिए टाइप किए गए मेथड इस्तेमाल करते हैं, और एनिमेटेड मानों को `.bind_opacity(..)`, `.bind_translate_x(..)` और अन्य बाइंडिंग से बाइंड करते हैं।

<a id="related"></a>

## संबंधित

- [Styling](./styling.md): स्टाइल प्रॉप, टाइप किए गए मेथड और इफ़ेक्ट की प्लेटफ़ॉर्म सीमाएँ।
- [Tailwind संदर्भ](../modules/tailwind-reference.md): हर उपयोगिता और वेरिएंट।
- [Layout](./layout.md): फ़्लेक्सबॉक्स और ग्रिड, जो क्लासों के रूप में भी उपलब्ध हैं।
