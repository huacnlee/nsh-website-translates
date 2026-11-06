---
title: "Combobox"
description: "مكوّن Combobox: قيمة واحدة أو عدة قيم يتم اختيارها من قائمة عناصر تتم تصفيتها بالكتابة في حقل الإدخال الخاص به، مع نافذة منبثقة أسفل الحقل على أجهزة سطح المكتب وورقة سفلية على الهواتف، ويتولى التطبيق تنسيقه."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

يختار الـ Combobox قيمًا من قائمة عناصر، قيمة واحدة أو، مع `multiple`، عدة قيم: وسوم منشور، أو أعضاء قناة، أو لغات مستند. زر التشغيل فيه حقل إدخال: الكتابة تفتح القائمة وتصفّيها، كما يفعل combobox في shadcn/ui. وهو شقيق [Select](./select.md) ويشاركه قائمته، ويعرضها بالشكل الذي يتوقعه كل جهاز:

- على أجهزة سطح المكتب ومتصفحات سطح المكتب، نافذة منبثقة تحت الحقل، بعرض الحقل (ويمكن لعرض `popupStyle` / `popupClass` في التطبيق أن يحدد عرضًا آخر) وبارتفاع صفوفها حتى حدّ المساحة المتاحة بجانبها.
- على الهواتف والأجهزة اللوحية، ورقة سفلية (sheet) في أسفل الشاشة فوق خلفية معتمة (backdrop).

يملك الـ Combobox السلوك: القيمة (للتطبيق أو الخاصة به)، وحالة الفتح، ولوحة المفاتيح، والبحث، والأقسام، والصف المميَّز، وما يسمعه قارئو الشاشة. مع `multiple`، يبدّل الاختيار العنصر في القيمة وتبقى القائمة مفتوحة، فيمكن اختيار عدة عناصر دفعة واحدة. أما المظهر فللتطبيق: فهو ينسّق الحقل والنافذة المنبثقة والقائمة والصفوف وعناوين الأقسام وحقل الإدخال والتذييل، أو يرسم الصفوف بنفسه.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` يأتي من [`nsh/base`](../modules/nsh-base.md)، حزمة `nsh-base` في Rust. في Rust، `combobox()` ينشئ واحدًا بدالة ضبط (setter) لكل خاصية (`.items(..)`، `.value(..)`، `.multiple(..)`) ومستمع لكل حدث (`.on_change(..)`). عناصره هي عناصر `Select`: `SelectItem::new(value, title)`، مع `.disabled(..)` و`.group(..)`، في أقسام كما في Select (انظر [العناصر](./select.md#items)).

<a id="value"></a>

## القيمة

القيمة مصفوفة بقيم العناصر المحددة. مع `value` يملكها التطبيق: يعرض الـ Combobox تلك العناصر محددة ويبلغ عن كل تغيير عبر `onChange({ value })`؛ ويضبط التطبيق `value` ليتبعه، أو يحتفظ بقيمته الخاصة. وإن حُذف ذلك، احتفظ الـ Combobox بقيمته الخاصة، ابتداءً من `defaultValue`.

- مع `multiple`، تبدّل الضغطة أو Return أو Space العنصر المميَّز: تدخله في القيمة إن كان خارجها، وتخرجه إن كان فيها. وتبقى القائمة مفتوحة.
- بدونه، يستبدل الاختيار القيمة بقيمة ذلك العنصر ويغلق القائمة؛ واختيار العنصر المحدد مرة أخرى يغلقها فقط.

`onConfirm({ value })` يخبر بالقيمة عند إغلاق القائمة: مرة واحدة لكل فتح، مهما كانت طريقة الإغلاق (اختيار، Escape، ضغطة خارج القائمة، زر التشغيل)، مع القيمة كما تركها المستخدم. و Cmd+Return على Mac (Ctrl+Return في غيره) يغلق القائمة ويؤكد.

`cleanable` يضيف زر مسح أثناء وجود عنصر محدد: ضغطة عليه تفرّغ القيمة (`onChange({ value: [] })`). يأتي الزر بعد حقل الإدخال وقبل زر التشغيل؛ والضغط عليه لا يفتح القائمة أبدًا. ويملؤه التطبيق، كما في [زر المسح في Select](./select.md#value).

<a id="input"></a>

## حقل الإدخال

زر التشغيل حقل نصي في صف الـ Combobox (`class` و`style`: حدّ الحقل وتعبئته)، يسبقه `prefix` الخاص بالتطبيق (العناصر المختارة كرقائق chips، أو أيقونة) ويليه زر المسح و`triggerButton` الخاص بالتطبيق (سهم chevron) و`suffix`.

- الكتابة تفتح القائمة وتصفّي العناصر بحسب العنوان دون مراعاة حالة الأحرف؛ ويظهر `empty` ما دام لا شيء يطابق. ويفتحها أيضًا Down وUp، وضغطة على زر التشغيل تفتحها وتغلقها، وعلى شاشات اللمس تفتحها نقرة على حقل الإدخال.
- مع قيمة واحدة، يعرض حقل الإدخال عنوان العنصر المختار (`placeholder` ما دام لا يوجد). ويكون محددًا عند حصوله على التركيز، فما يُكتب يحلّ محله.
- مع `multiple`، يعرض حقل الإدخال الاستعلام؛ ويعرض التطبيق العناصر المختارة، في `prefix` أو بجوار الـ Combobox.

الاستعلام خاص بالـ Combobox، يبدأ كل فتح من `defaultQuery` (وإلا فارغًا)، أو خاص بالتطبيق مع `query`: `onQueryChange({ query })` يبلغ بما كُتب، ويضبط التطبيق `query` ليتبعه، أو ليصفّي على طريقته، أو ليقترح نقطة بداية.

<a id="footer"></a>

## التذييل

`footer` محتوى تحت الصفوف، في جزء خاص به (`footerClass`، `footerStyle`): إجراء («إدارة الوسوم»)، أو عدّاد، أو تلميح. يبقى في مكانه بينما تتمرر الصفوف.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | العناصر، بالترتيب. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | الاختيار يبدّل العنصر في القيمة وتبقى القائمة مفتوحة. |
| `value` | `.value(..)` | `string[]` | لا شيء | قيم العناصر المحددة، يملكها التطبيق. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | القيمة الأولية، بدون `value`. |
| `open`، `defaultOpen` | `.open(..)`، `.default_open(..)` | `boolean` | `false` | حالة الفتح، للتطبيق أو الخاصة بالـ Combobox. |
| `placeholder` | `.placeholder(..)` | `string` | لا شيء | النص البديل لحقل الإدخال، ما دام فارغًا. |
| `query` | `.query(..)` | `string` | لا شيء | الاستعلام، يملكه التطبيق. |
| `defaultQuery` | `.default_query(..)` | `string` | لا شيء | الاستعلام الذي يبدأ منه كل فتح، بدون `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | زر مسح أثناء وجود عنصر محدد؛ والضغط عليه يفرّغ القيمة. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | يبقى مغلقًا ولا يقبل ضغطات ولا تركيز لوحة المفاتيح. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | موضوع الاختيار، لقارئي الشاشة. |
| `placement`، `align`، `offset`، `margin` | `.placement(..)`, ... | مثل `Select` | `"bottom"`، `"start"`، 0، 0 | أجهزة سطح المكتب: موضع النافذة المنبثقة بالنسبة إلى الحقل. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | النافذة المنبثقة (أجهزة سطح المكتب) أو الورقة السفلية (شاشات اللمس). |
| `backdropClass`، `backdropStyle` | `.backdrop_class(..)`، `.backdrop_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الخلفية المعتمة خلف الورقة السفلية. |
| `listClass`، `listStyle` | `.list_class(..)`، `.list_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | القائمة، عرض التمرير للصفوف. |
| `itemClass`، `itemStyle` | `.item_class(..)`، `.item_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | صف كل عنصر: `focus:` أثناء التمييز، `selected:` أثناء التحديد، `disabled:` حين لا يمكن تحديده. |
| `groupClass`، `groupStyle` | `.group_class(..)`، `.group_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | عنوان كل قسم. |
| `inputClass`، `inputStyle` | `.input_class(..)`، `.input_style(..)` | `string`، `StyleProp<InputStyle>` | لا شيء | حقل الإدخال: `focus:` أثناء التحرير، `disabled:` مع الـ Combobox. |
| `footerClass`، `footerStyle` | `.footer_class(..)`، `.footer_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | التذييل، تحت الصفوف. |
| `clearButtonClass`، `clearButtonStyle` | `.clear_button_class(..)`، `.clear_button_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | زر المسح (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | لا شيء | محتوى زر المسح. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | لا شيء | الاسم الذي يسمّي به قارئو الشاشة زر المسح. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | لا شيء | زر بعد حقل الإدخال (سهم chevron): الضغط عليه يفتح القائمة ويغلقها. |
| `prefix` | `.prefix(..)` | `JSX.Element` | لا شيء | محتوى قبل حقل الإدخال: رقائق chips، أيقونة. |
| `suffix` | `.suffix(..)` | `JSX.Element` | لا شيء | محتوى بعد زر التشغيل. |
| `empty` | `.empty(..)` | `JSX.Element` | لا شيء | ما تعرضه القائمة ما دام لا يظهر فيها عنصر. |
| `footer` | `.footer(..)` | `JSX.Element` | لا شيء | ما يظهر تحت الصفوف. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | لا شيء | صف العنصر، يرسمه التطبيق مما هو عليه العنصر لا من حالته: يتبع المحتوى `group-focus:` و`group-selected:` و`group-disabled:` الخاصة بالصف (`group` في `itemClass`)، فلا يؤدي انتقال التمييز أو التبديل إلى إعادة رسم شيء؛ وإلا فعنوان العنصر. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | لا شيء | عنوان القسم، يرسمه التطبيق؛ وإلا فعنوانه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الحقل: صف البادئة وحقل الإدخال والأزرار واللاحقة؛ وتأخذ القائمة عرضه. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | تغيّرت القيمة (اختيار، تبديل، زر المسح): `{ value }`، قيم العناصر المحددة. اضبط `value` لتتبعه. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | أُغلقت القائمة: `{ value }` كما هي حينئذ، مرة واحدة لكل فتح. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | كتب المستخدم في حقل الإدخال: `{ query }`. اضبط `query` لتتبعه. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | فُتحت القائمة أو أُغلقت، مع السبب (`{ open, reason }`). اضبط `open` لتتبعه. |
| `onOpen`، `onClose` | `.on_open(..)`، `.on_close(..)` | ظهرت القائمة، أو زالت. |
| `onCancel` | `.on_cancel(..)` | أغلق المستخدم القائمة دون اختيار يغلقها (Escape أو الرجوع، ضغطة خارجها أو على الخلفية المعتمة). |

تأتي بهذا الترتيب: `onChange` عند الاختيار، أو `onCancel` عند الإغلاق دون اختيار، ثم `onOpenChange`، ثم `onConfirm` عند إغلاق القائمة، ثم `onOpen` أو `onClose` بعد ظهور القائمة أو زوالها.

<a id="parts"></a>

## الأجزاء

| الجزء | الموضع | التنسيق بواسطة |
|---|---|---|
| الحقل | عرض الـ Combobox، صف | `class`، `style` |
| البادئة | الحقل، أولًا | عنصر خاص بالتطبيق (`prefix`) |
| حقل الإدخال | الحقل، بعد البادئة | `inputClass`، `inputStyle`، `placeholder` |
| زر المسح | الحقل، بعد حقل الإدخال (`cleanable`، أثناء وجود عنصر محدد) | `clearButtonClass`، `clearButtonStyle`؛ ومحتواه `clearButton` |
| زر التشغيل | الحقل، بعد زر المسح | عنصر خاص بالتطبيق (`triggerButton`) |
| اللاحقة | الحقل، أخيرًا | عنصر خاص بالتطبيق (`suffix`) |
| النافذة المنبثقة أو الورقة السفلية | فوق كل شيء، تحت الحقل (أجهزة سطح المكتب) أو في الأسفل (شاشات اللمس) | `popupClass`، `popupStyle` |
| الخلفية المعتمة | خلف الورقة السفلية (شاشات اللمس) | `backdropClass`، `backdropStyle` |
| القائمة | النافذة المنبثقة | `listClass`، `listStyle` |
| عنوان القسم | القائمة، قبل عناصره | `groupClass`، `groupStyle`، `renderGroup` |
| صف العنصر | القائمة | `itemClass`، `itemStyle`، `renderItem` (`group-focus:`، `group-selected:`، `group-disabled:` في داخله، تحت `group` في `itemClass`) |
| الحالة الفارغة | النافذة المنبثقة، ما دام لا يظهر عنصر | عنصر خاص بها (`empty`) |
| التذييل | النافذة المنبثقة، أخيرًا | `footerClass`، `footerStyle`؛ ومحتواه `footer` |

<a id="keyboard"></a>

## لوحة المفاتيح

مفاتيح الـ Combobox هي مفاتيح Select (انظر [لوحة المفاتيح](./select.md#keyboard)) ما دام حقل الإدخال محتفظًا بالتركيز، مع هذه الفروق: تُكتب الأحرف والأرقام في حقل الإدخال فتصفّي القائمة بدل البحث بالكتابة (typeahead)؛ و Down و Up يفتحان القائمة المغلقة؛ و Return يبدّل العنصر المميَّز مع `multiple` ويُبقي القائمة مفتوحة؛ و Cmd+Return على Mac (Ctrl+Return في غيره) يغلقها ويؤكد. عند إغلاق القائمة على أجهزة سطح المكتب، يحتفظ حقل الإدخال بالتركيز.

<a id="accessibility"></a>

## إمكانية الوصول

- حقل الإدخال هو combobox بالنسبة إلى قارئي الشاشة: تسميته `accessibilityLabel`، وقيمته عناوين العناصر المحددة مفصولة بفواصل، ويخبر بما إذا كانت القائمة موسّعة. و`disabled` يعتّمه.
- القائمة listbox وكل صف option، يُسمّى بعنوانه؛ والخيارات المحددة تُعلَن محددة، والمعطّل منها معتَّم. وعناوين الأقسام عناوين (headers).
- زر المسح زر يُسمّى بـ `clearButtonAccessibilityLabel`؛ وليس محطة توقف في Tab. أما زر التشغيل فمخفي عن قارئي الشاشة، لأن حقل الإدخال يخبر بما إذا كانت القائمة مفتوحة، وهو كذلك ليس محطة توقف في Tab.

انظر [إمكانية الوصول](../docs/accessibility.md) للتسميات والأدوار والإعلانات عمومًا.
