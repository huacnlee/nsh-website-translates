---
title: "Select"
description: "مكوّن Select: اختيار قيمة واحدة من قائمة عناصر، مع نافذة منبثقة عند عنصر التشغيل على أجهزة سطح المكتب وورقة سفلية على الهواتف، ويدعم لوحة المفاتيح والإكمال التلقائي أثناء الكتابة والبحث والأقسام، ويمكن للتطبيق تنسيقه."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

يختار Select قيمة واحدة من قائمة عناصر: إعداد، أو عامل تصفية، أو بلد، أو منطقة زمنية. يفتح المشغِّل (trigger) الخاص بالتطبيق القائمة، وتُعرض كما يتوقع كل جهاز:

- على أجهزة سطح المكتب وفي متصفحاتها: نافذة منبثقة فوق المشغِّل يقع فيها الصف المحدد فوق المشغِّل تمامًا، فيبقى العنوان المختار في مكانه (موضع `item-aligned` في shadcn/ui)، وبعرض المشغِّل (ويحدد `popupStyle` / `popupClass` في التطبيق عرضًا آخر، كما في `menu_width` الخاص بـ `gpui-component`) وبارتفاع صفوفها بحدّ المساحة المتاحة على الشاشة؛ وعند عدم تحديد أي عنصر تُفتح أسفل المشغِّل. تتنقل لوحة المفاتيح بين العناصر وتختار أحدها.
- على الهواتف والأجهزة اللوحية: ورقة (sheet) في أسفل الشاشة فوق خلفية معتمة (backdrop).

يتحكم Select في السلوك: القيمة (قيمة التطبيق أو قيمته الخاصة)، وحالة الفتح، ولوحة المفاتيح، والبحث بالكتابة (typeahead)، والبحث، والأقسام، والصف المميَّز، وما تنطق به قارئات الشاشة. أما المظهر فللتطبيق: فهو ينسّق المشغِّل والنافذة المنبثقة والقائمة والصفوف وترويسات الأقسام وحقل البحث، أو يرسم الصفوف بنفسه.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

يأتي `Select` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة (crate) `nsh-base` في Rust. في Rust ينشئ `select()` واحدًا منه بدالة ضبط لكل خاصية (`.items(..)`، `.value(..)`، `.item_style(..)`) ومستمع لكل حدث (`.on_change(..)`)؛ وينشئ `SelectItem::new(value, title)` عنصرًا، مع `.disabled(..)` و`.group(..)`.

<a id="items"></a>

## العناصر

`items` هي القائمة بوصفها بيانات: لكل عنصر `value` (فريدة بين العناصر: وهي ما يُضبط عند اختياره)، و`title` (وهو ما يعرضه صفه، وما يطابقه البحث والكتابة السريعة، وما تنطق به قارئات الشاشة)، واختياريًا `disabled` و`group`. العناصر المتجاورة التي لها `group` نفسه تشكّل قسمًا تحت ترويسة بذلك العنوان:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

الصفوف قائمة افتراضية (virtualized) داخل عرض التمرير في النافذة المنبثقة: فالقائمة التي تضم آلاف العناصر لا تنشئ إلا الصفوف الظاهرة، وتتمرر النافذة المنبثقة عندما تزيد صفوفها طولًا على المساحة المتاحة لها.

<a id="value"></a>

## القيمة

مع `value` يملك التطبيق العنصر المختار: يعرض Select العنصر ذا هذه القيمة ويبلّغ عن الاختيار عبر `onChange({ value })`؛ ويضبط التطبيق `value` ليتبعه، أو يحتفظ بقيمته الخاصة. `value={null}` تعني عدم اختيار أي شيء. وإذا حُذفت، يحتفظ Select بقيمته الخاصة، بدءًا من `defaultValue`. يبلّغ `onChange` عن التغييرات: واختيار العنصر المختار نفسه مرة أخرى يغلق القائمة.

يضيف `cleanable` زر مسح ما دام عنصر مختارًا: يمسح الضغط عليه القيمة ويُبلَّغ عنه عبر `onChange({ value: null })`، وتبقى القائمة مغلقة. يأتي الزر بعد المشغِّل في عرض Select، لا داخله، فلا يفتح الضغط عليه القائمة أبدًا؛ ويضعه التطبيق (فوق نهاية المشغِّل باستخدام `absolute`، حيث يكون السهم عادةً) ويملؤه:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

المشغِّل عنصر يخص التطبيق، فيعرض ما يشاؤه التطبيق للعنصر المختار: عنوانه، أو أيقونة، أو نصًا بديلًا ما دام لا شيء مختارًا. في TSX هو العنصر الذي تمرره: فهو الـ combobox ويتولى بنفسه الضغطات، وتركيز لوحة المفاتيح، وحالة التوسيع، و`disabled`، فتتبع فئات `active:` و`focus:` و`disabled:` الخاصة به حالة Select، ويعمل `onPress` الخاص به أيضًا، وتوضع القائمة قبالته وبعرضه.

<a id="open-state"></a>

## حالة الفتح

بدون `open` يحتفظ Select بحالة الفتح الخاصة به (بدءًا من `defaultOpen`). ومع `open` يملكها التطبيق ويغيّرها في `onOpenChange({ open, reason })`: `"triggerPress"` (ضغطة على المشغِّل، أو أحد مفاتيحه)، `"select"` (اختيار)، `"pressOutside"`، `"backdropPress"` أو `"cancel"` (Escape أو الرجوع). يخبر `onOpen` و`onClose` بوقت ظهور القائمة وزوالها (في الورقة: بعد أن دخلت وبعد أن خرجت)، ويخبر `onCancel` بأن المستخدم أغلقها دون اختيار.

<a id="search"></a>

## البحث

يضع `searchable` حقل بحث فوق العناصر: تصفّيها الكتابة بحسب العنوان دون مراعاة حالة الأحرف، ويختفي القسم الذي لا يطابق شيء منه مع ترويسته. ينتقل التمييز إلى أول نتيجة مطابقة، وتواصل المفاتيح تحريكه ما دام الحقل يملك لوحة المفاتيح، ويختارها Return. `empty` هو ما تعرضه القائمة عندما لا يطابق شيء:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

على أجهزة سطح المكتب يستحوذ حقل البحث على لوحة المفاتيح عند فتح القائمة؛ وعلى الشاشات التي تعمل باللمس تظهر لوحة المفاتيح عند الضغط على الحقل. يبدأ كل فتح ببحث فارغ.

<a id="rows-the-app-draws"></a>

## الصفوف التي يرسمها التطبيق

ينسّق `itemClass` صف كل عنصر، الذي يعرض عنوان العنصر إلى أن يرسمه `renderItem`: يُطبَّق `focus:` على الصف المميَّز (حيث المفاتيح أو المؤشر)، و`selected:` على الصف المختار، و`disabled:` على الصف المعطَّل. لرسم صف، مرّر `renderItem`: يتلقى ما هو العنصر ([`SelectEntry`](#types)) ويعيد محتوى الصف، للصفوف الظاهرة. ولا يتلقى حالة الصف أبدًا: فمع `group` في `itemClass` يتبع المحتوى حالات الصف بفئات `group-focus:` و`group-selected:` و`group-disabled:`، فيُنجَز الرسم مرة واحدة لكل عنصر، ولا ينتج عن انتقال التمييز أو الاختيار أي رسم جديد. يرسم `renderGroup` ترويسة القسم بالطريقة نفسها:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | العناصر، بالترتيب. |
| `value` | `.value(..)` | `string \| null` | لا شيء | `value` العنصر المختار، ويملكها التطبيق؛ و`null` تعني عدم اختيار شيء. وإذا حُذفت، يحتفظ Select بقيمته الخاصة. |
| `defaultValue` | `.default_value(..)` | `string` | لا شيء | القيمة في البداية، بدون `value`. |
| `open` | `.open(..)` | `boolean` | لا شيء | حالة الفتح، ويملكها التطبيق. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | مفتوحة في البداية، بدون `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | حقل بحث فوق العناصر يصفّيها بحسب العنوان. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | لا شيء | النص البديل لحقل البحث. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | لا شيء | ما تسمّي به قارئات الشاشة حقل البحث: ما الذي يبحث فيه. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | زر مسح ما دام عنصر مختارًا؛ يمسح الضغط عليه القيمة (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | تبقى القائمة مغلقة: لا يقبل المشغِّل ضغطات ولا تركيز لوحة المفاتيح، وتُطبَّق عليه أنماط `disabled:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تسمّي به قارئات الشاشة عنصر Select: موضوع الاختيار. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | أجهزة سطح المكتب: جهة المشغِّل التي توضع عليها القائمة، والجهة الأخرى إذا كانت وحدها تتسع لها. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | أجهزة سطح المكتب: كيف تُحاذى مع المشغِّل. |
| `offset` | `.offset(..)` | `number` | `0` | أجهزة سطح المكتب: الفجوة بين المشغِّل والقائمة. |
| `margin` | `.margin(..)` | `number` | `0` | أجهزة سطح المكتب: المسافة التي تحافظ عليها من حواف المنطقة الآمنة. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | النافذة المنبثقة (أجهزة سطح المكتب) أو الورقة (الشاشات اللمسية) التي توجد القائمة فيها. |
| `backdropClass`، `backdropStyle` | `.backdrop_class(..)`، `.backdrop_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الشاشات اللمسية: الخلفية المعتمة خلف الورقة. |
| `listClass`، `listStyle` | `.list_class(..)`، `.list_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | القائمة، وهي عرض التمرير للصفوف. |
| `itemClass`، `itemStyle` | `.item_class(..)`، `.item_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | صف كل عنصر، ويرث عنوانه أنماط النص منه: `focus:` أثناء التمييز، `selected:` أثناء الاختيار، `disabled:` عندما لا يمكن اختياره. |
| `groupClass`، `groupStyle` | `.group_class(..)`، `.group_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | ترويسة كل قسم. |
| `searchClass`، `searchStyle` | `.search_class(..)`، `.search_style(..)` | `string`، `StyleProp<InputStyle>` | لا شيء | حقل البحث: صندوقه ونصه (`color`، `fontSize`، `placeholderColor`). |
| `clearButtonClass`، `clearButtonStyle` | `.clear_button_class(..)`، `.clear_button_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | زر المسح (`cleanable`)؛ `disabled:` مع Select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | لا شيء | محتوى زر المسح: علامة ×، أو أيقونة. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | لا شيء | ما تسمّي به قارئات الشاشة زر المسح. |
| `trigger` | `.trigger(..)` | `JSX.Element` | لا شيء | ما يفتح القائمة عند الضغط عليه؛ وتوضع القائمة قبالته. |
| `empty` | `.empty(..)` | `JSX.Element` | لا شيء | ما تعرضه القائمة عندما لا يظهر أي عنصر (بحث بلا نتائج). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | لا شيء | صف العنصر، يرسمه التطبيق مما هو العنصر (وحالاته هي فئات الصف)؛ وإلا فعنوان العنصر. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | لا شيء | ترويسة القسم، يرسمها التطبيق؛ وإلا فعنوانه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | العرض المحيط بالمشغِّل. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | اختار المستخدم عنصرًا آخر (ضغطة، أو Return أو Space، أو الكتابة السريعة على المشغِّل): `value` الخاصة به؛ أو `null` عندما مسحه زر المسح. اضبط `value` لتتبعه. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | فُتحت القائمة أو أُغلقت، مع السبب. اضبط `open` لتتبعه. |
| `onOpen` | `.on_open(\|\| ..)` | القائمة ظاهرة؛ وفي حالة الورقة: بعد أن دخلت. |
| `onClose` | `.on_close(\|\| ..)` | زالت القائمة؛ وفي حالة الورقة: بعد أن خرجت. وكذلك عندما أغلقها التطبيق. |
| `onCancel` | `.on_cancel(\|\| ..)` | أغلق المستخدم القائمة دون اختيار (Escape أو الرجوع، أو ضغطة خارجها أو على الخلفية المعتمة). |

تأتي بهذا الترتيب: `onChange` عند الاختيار، أو `onCancel` عند الإغلاق دون اختيار، ثم `onOpenChange`، ثم `onOpen` أو `onClose` بعد أن تظهر القائمة أو تزول.

<a id="types"></a>

<a id="types"></a>

## الأنواع

| النوع | الأعضاء | الوصف |
|---|---|---|
| `SelectItem` | `value: string`، `title: string`، `disabled?: boolean`، `group?: string` | عنصر في `items`. |
| `SelectEntry` | `value`، `title`، `disabled`، `group?` (الخاصة بالعنصر)، `index: number` | ما يتلقاه `renderItem`: العنصر وفهرسه بين `items`، وليس حالته أبدًا (`focus:` و`selected:` و`disabled:` الخاصة بالصف). |
| `SelectGroup` | `title: string` | ما يتلقاه `renderGroup`: `group` الخاص بالقسم. |

في Rust هي `nsh_base::SelectItem` و`SelectEntry` و`SelectGroup`؛ و`value` هو `SelectValue` (`Controlled(Some(..))` للقيمة، `Controlled(None)` لـ `null`)، ويصنعه `.value(..)` من `Option<SharedString>` أو من سلسلة نصية.

<a id="parts"></a>

## الأجزاء

| الجزء | الموضع | يُنسَّق بواسطة |
|---|---|---|
| المشغِّل | عرض Select | عنصر التطبيق نفسه (`trigger`) |
| زر المسح | عرض Select، بعد المشغِّل (`cleanable`، ما دام عنصر مختارًا) | `clearButtonClass`، `clearButtonStyle`؛ ومحتواه `clearButton` |
| النافذة المنبثقة أو الورقة | فوق كل شيء، عند المشغِّل (أجهزة سطح المكتب) أو في الأسفل (الشاشات اللمسية) | `popupClass`، `popupStyle` |
| الخلفية المعتمة | خلف الورقة (الشاشات اللمسية) | `backdropClass`، `backdropStyle` |
| حقل البحث | النافذة المنبثقة، أولًا (`searchable`) | `searchClass`، `searchStyle`، `searchPlaceholder`، `searchAccessibilityLabel` |
| القائمة | النافذة المنبثقة، بعد حقل البحث | `listClass`، `listStyle` |
| ترويسة القسم | القائمة، قبل عناصره | `groupClass`، `groupStyle`، `renderGroup` |
| صف العنصر | القائمة | `itemClass`، `itemStyle`، `renderItem` (`group-focus:`، `group-selected:`، `group-disabled:` في الداخل، تحت `group` في `itemClass`) |
| الحالة الفارغة | النافذة المنبثقة، ما دام لا عنصر ظاهرًا | عنصرها الخاص (`empty`) |

النافذة المنبثقة عمود: يتبع ارتفاعها حقل البحث والصفوف، فيحدّه `max-h-*` على `popupClass` وتتمرر القائمة داخله.

<a id="keyboard"></a>

## لوحة المفاتيح

على أجهزة سطح المكتب يصل Tab إلى مشغِّل عنصر Select غير `disabled`. والقائمة مغلقة، تفتحها Down وUp وReturn وSpace عند العنصر المختار (وإن لم يكن شيء مختارًا، تفتحها Up عند آخر عنصر مفعّل وتفتحها الباقية عند الأول)، وتختار الأحرف والأرقام العنصر الذي يبدأ عنوانه بما كُتب، كما يفعل عنصر select الأصلي. والقائمة مفتوحة:

| المفتاح | الإجراء |
|---|---|
| Down، Up | العنصر المفعّل التالي أو السابق، مع الالتفاف عند الطرفين. |
| Home، End | أول عنصر مفعّل أو آخره (وتبقى لحقل البحث وظيفتهما الخاصة ما دام يملك لوحة المفاتيح). |
| Page Down، Page Up | التقدم صفحة من الصفوف أو الرجوع صفحة. |
| Return | يختار العنصر المميَّز ويغلق القائمة. |
| Space | يختار العنصر المميَّز (بدون حقل بحث). |
| الأحرف، الأرقام | العنصر التالي الذي يبدأ عنوانه بما كُتب في الثانية الأخيرة (بدون حقل بحث). |
| Escape | يغلق القائمة دون اختيار. |

عند إغلاق القائمة تعود لوحة المفاتيح إلى المشغِّل، ما لم تنقلها ضغطة خارجية إلى مكان آخر. يميّز المؤشر الصف الذي يمر فوقه؛ ويُكشف الصف المميَّز عندما تنتقل إليه المفاتيح.

<a id="on-each-device"></a>

## على كل جهاز

| | أجهزة سطح المكتب ومتصفحاتها | الهواتف والأجهزة اللوحية |
| --- | --- | --- |
| القائمة | نافذة منبثقة فوق المشغِّل والصف المختار فوقه (أسفله إن لم يكن شيء مختارًا)، بعرض المشغِّل ما لم يحدد `popupStyle` عرضًا، وبارتفاع صفوفها بحدّ المساحة المتاحة على الشاشة | ورقة في الأسفل فوق خلفية معتمة، بارتفاع صفوفها حتى شريط الحالة |
| إغلاقها | اختيار، أو Escape، أو ضغطة خارجها (تمتد إلى ما تحت المؤشر) | اختيار، أو الخلفية المعتمة، أو زر الرجوع في Android |
| البحث | يستحوذ الحقل على لوحة المفاتيح عند فتح القائمة | تظهر لوحة المفاتيح عند الضغط على الحقل |
| الاختيار | الضغطة النازلة تختار، فيحتفظ حقل البحث بلوحة المفاتيح | نقرة |

ينسّق `popupClass` النافذة المنبثقة على أجهزة سطح المكتب والورقة على الهواتف؛ ويمكن لنمط يختلف بينهما أن يقارن `platform.idiom` (`nsh/device`) بـ `"desktop"`.
<a id="accessibility"></a>

## إمكانية الوصول

- يُعرَّف المحفّز (trigger) لقارئات الشاشة على أنه مربّع تحرير وسرد (combobox): تسميته `accessibilityLabel`، وقيمته عنوان العنصر المختار، ويُعلن عمّا إذا كانت القائمة موسّعة. ويؤدي `disabled` إلى تعتيمه.
- زر المسح هو زر يحمل الاسم `clearButtonAccessibilityLabel`؛ ولا يُعدّ إحدى محطات مفتاح Tab.
- حقل البحث هو حقل نصي يحمل الاسم `searchAccessibilityLabel`؛ ونصه البديل (placeholder) تلميح يظهر ما دام الحقل
  فارغًا.
- القائمة هي listbox وكل صف فيها خيار (option) مسمّى بعنوانه؛ ويكون الخيار المختار محدَّدًا، ويُعتَّم الخيار المعطَّل. أما ترويسات الأقسام فهي ترويسات (headers).
- أثناء تحريك المفاتيح للتمييز (highlight)، ينتقل تركيز قارئ الشاشة إلى الصف المميَّز؛ وما دام حقل البحث
  يستقبل لوحة المفاتيح، يُعلن عنوان العنصر المميَّز بدلًا من ذلك، فيستمر الكتابة دون انقطاع.

راجع [إمكانية الوصول](../docs/accessibility.md) لمعرفة التسميات والأدوار والإعلانات بوجه عام.
