---
title: "Tree"
description: "Tree: عناصر تحتوي على عناصر أخرى، يمكن توسيعها وطيّها، ويمكن تحديد أحدها: ملفات مشروع، أو شريط جانبي للإعدادات، أو مخطط تفصيلي. يدعم المحاكاة الافتراضية للقوائم (virtualization)، ويشكّل محطة واحدة فقط في التنقل بلوحة المفاتيح، ويوفّر شجرة يمكن لقارئات الشاشة التعامل معها. مظهر كل صف يعود إلى التطبيق."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# Tree

تعرض الشجرة عناصر تحتوي على عناصر أخرى: ملفات المشروع ومجلداته، وأقسام الشريط الجانبي للإعدادات، وهيكل المستند. يتولى `Tree` سلوك الشجرة: العناصر الموسَّعة، والعنصر المحدد، ولوحة المفاتيح، وما يسمعه قارئ الشاشة. صفوفها افتراضية (virtualized): لا يُنشأ إلا ما يظهر منها، ولا يُنشأ أبناء العنصر المطوي أصلًا، فتُفتح شجرة من آلاف العناصر وتُمرَّر فورًا. أما المظهر فهو للتطبيق: لا ترسم الشجرة شيئًا بنفسها، بل ينسّق التطبيق كل صف (`itemClass`) ويرسم محتواه (`renderItem`: أيقونة، وتسمية مزاحة بحسب عمق العنصر، وسهم، وشارة).

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

يأتي `Tree` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة `nsh-base` في Rust. تكون العناصر الموسَّعة والعنصر المحدد من شأن التطبيق عندما يضبط `expanded` و`selected` ويحدّثهما في `onExpandedChange` و`onSelectedChange`؛ وبدونهما تحتفظ الشجرة بحالتها الخاصة، بادئةً من `defaultExpanded` و`defaultSelected`. تُعرَّف العناصر بـ`id` الخاص بالتطبيق (مسار، أو مفتاح سجل)، وليس بتسميتها أبدًا. في Rust ينشئه `tree()`، مع دالة ضبط لكل خاصية (`.items(..)`، `.expanded(..)`، `.render_item(..)`)، ودالة مستمع لكل حدث، ودوال التنسيق المطبَّعة.

<a id="items"></a>

## العناصر

`items` هي عناصر المستوى الأعلى، وكل منها `TreeItem`:

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `string` | ما يعرّفه في `expanded` و`selected` والأحداث: فريد في الشجرة (يُسجَّل المعرّف المكرر، ولا يُوسَّع أو يُحدَّد إلا عنصره الأول). |
| `label` | `string` | ما يعرضه صفه ما لم يرسمه `renderItem`، وما يقوله قارئ الشاشة، وما يطابقه الكتابة السريعة (typeahead). |
| `children` | `TreeItem[]` | العناصر التي تحته بالترتيب. إذا وُجد أي منها فهو مجلد: يتوسع وينطوي. |
| `disabled` | `boolean` | لا يستطيع المستخدم تحديده أو توسيعه أو طيّه: تتجاوزه الضغطات والمفاتيح، وتنطبق تنسيقات `disabled:`. يبقى أبناؤه كما يحدد `expanded`. |

يتلقى `renderItem` كائن `TreeEntry` لكل صف ظاهر: `id` و`label` و`disabled` للعنصر، و`depth` (0 في المستوى الأعلى، و1 تحت عنصر من المستوى الأعلى، …) وما إذا كان `folder`. هذا هو ما يمثّله العنصر، أما حالات الصف فهي فئاته (classes): يُرسم المحتوى مرة واحدة لكل عنصر ويحتفظ بعناصر عرضه (views) أثناء تحديد الصف أو توسيعه أو طيّه، فيدور السهم بانتقال سلس.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | عناصر المستوى الأعلى، لكل منها العناصر التي تحته. |
| `expanded` | `.expanded(..)` | `string[]` | لا شيء | معرّفات العناصر الموسَّعة (متحكَّم بها). يظهر العنصر ما دام كل عنصر فوقه موسَّعًا. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | العناصر الموسَّعة في البداية، ما دام `expanded` غير مضبوط. |
| `selected` | `.selected(..)` | `string \| null` | لا شيء | معرّف العنصر المحدد (متحكَّم به)، و`null` لعدم وجود تحديد. |
| `defaultSelected` | `.default_selected(..)` | `string` | لا شيء | العنصر المحدد في البداية، ما دام `selected` غير مضبوط. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | شجرة للقراءة فقط: لا ضغطات ولا مفاتيح، ولا محطة لتركيز لوحة المفاتيح، و`disabled:` على كل صف؛ تعرض ما يقوله `expanded` و`selected`. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | يؤدي التوسيع والطي إلى نقل الصفوف التي بعد العنصر إلى أماكنها الجديدة بحركة نابضية تُنفَّذ أصلًا على المنصة. تتوقف عند تقليل الحركة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما يسمّي به قارئ الشاشة الشجرة ("Files"). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | لا شيء | محتوى الصف، للصفوف الظاهرة؛ وبدونه يعرض الصف تسمية العنصر. |
| `itemClass`، `itemStyle` | `.item_class(..)`، `.item_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | كل صف: ارتفاعه وحشوه وسطحه وحالاته (أدناه)؛ وتصل تنسيقات النص فيه إلى التسمية. |
| `listClass`، `listStyle` | `.list_class(..)`، `.list_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | عرض التمرير للصفوف داخل الشجرة: حشوه وفجواته. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الشجرة نفسها. أعطها ارتفاعًا (أو `flex-1` داخل أب له ارتفاع): تُمرَّر الصفوف داخلها، ولا يُنشأ إلا الظاهر منها. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | وسّع المستخدم عنصرًا أو طواه (ضغطة، أو Return، أو Space، أو Right أو Left، أو `revealItem`): المعرّفات الموسَّعة كما ستكون. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | حدد المستخدم عنصرًا آخر (ضغطة، أو مفاتيح الأسهم، أو Home، أو End، أو الكتابة السريعة). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | وسّع المستخدم العنصر الذي معرّفه `id`، بعد `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | طوى المستخدم العنصر الذي معرّفه `id`، بعد `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | تصرّف المستخدم على العنصر الذي معرّفه `id`: Return على العنصر المحدد إذا لم يكن له أبناء، أو نقرة مزدوجة أو لمسة مزدوجة على أي عنصر، بعد أحداث الضغطة نفسها. لا تبلّغ العناصر المعطلة ولا الشجرة المعطلة عنه أبدًا. |

يتبع التحديدُ مفاتيحَ الأسهم، لذا يفتح مستكشف الملفات الملف في `onAction` لا في `onSelectedChange`: التنقل بين الملفات يعاينها واحدًا واحدًا، وReturn أو النقرة المزدوجة تفتح الملف الذي يريده المستخدم.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بـ | الحالات |
|---|---|---|---|
| الشجرة | | `class`، `style` | |
| القائمة | الشجرة | `listClass`، `listStyle` | |
| الصف | القائمة | `itemClass`، `itemStyle` | `selected:`، `aria-expanded:` (مجلد مفتوح)، `focus:` (عندما يكون تركيز لوحة المفاتيح على الشجرة: الصف الذي تعمل عليه المفاتيح، وهو الصف المحدد، أو العنصر المطوي الذي يقع تحته تحديد مخفي، أو الصف الأول إذا لم يكن هناك تحديد)، `disabled:`، `hover:`، `active:` |
| محتوى الصف | صف | `renderItem` | `group-selected:`، `group-aria-expanded:`، `group-focus:`، `group-disabled:` تحت `group` في `itemClass` |

أظهر الصف المحدد بـ`selected:` ومكان لوحة المفاتيح بـ`focus:` (راجع [أدلة التصميم](../docs/design-guides.md#interaction-states)). ارسم التركيز داخل الصف (`focus:outline-2 focus:-outline-offset-2`): تقصّ القائمة ما يتجاوز جانبيها.

## Ref

| الدالة | الوصف |
|---|---|
| `focus()` | تأخذ تركيز لوحة المفاتيح، كما يفعل وصول Tab إلى الشجرة. |
| `revealItem(id)` | توسّع العناصر التي فوق العنصر الذي معرّفه `id` (يُبلَّغ عنها بـ`onExpandedChange` و`onExpand`، الأبعد أولًا) وتمرّر صفه إلى الظهور بعد أن يظهر: فورًا إذا تابع التطبيق التغيير؛ وإذا لم يتابعه ينتهي الطلب عند هذا الحد. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## التعطيل

لا يقبل العنصر المعطل أي ضغطات، وتتجاوزه مفاتيح الأسهم، ويعلن قارئ الشاشة أنه باهت. `disabled` على الشجرة يجعلها للقراءة فقط: تعرض ما تقوله حالة التطبيق ولا تقبل أي إدخال.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## إمكانية الوصول

- للشجرة الدور `"tree"`، وتُسمّى بـ`accessibilityLabel`؛ وكل صف هو `"treeitem"` يُسمّى بتسمية عنصره، مع مستواه (عمقه + 1)، وما إذا كان موسَّعًا (للمجلدات)، ومحددًا، ومعطلًا.
- عندما تأخذ الشجرة تركيز لوحة المفاتيح وعندما تحرّك المفاتيح التحديد، يأخذ الصف الذي تعمل عليه المفاتيح تركيز قارئ الشاشة.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="keyboard"></a>

## لوحة المفاتيح

على أنظمة سطح المكتب والويب، حيث يصل Tab إلى العناصر التي تقبل الضغطات، يتبع `Tree` [نمط WAI-ARIA tree view](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| المفتاح | ما يفعله |
|---|---|
| Tab، Shift+Tab | يدخل الشجرة بخطوة واحدة، ويخرج منها بخطوة واحدة؛ وعند العودة تتابع المفاتيح من الصف المحدد. وإذا لم يكن هناك تحديد، يظهر التركيز على الصف الأول، ويحدده Down. |
| Down، Up | يحدد الصف التالي أو السابق، متجاوزًا العناصر المعطلة، ومن الأخير إلى الأول والعكس. |
| Right | يوسّع المجلد المطوي؛ وعلى المجلد الموسَّع يحدد أول ابن مفعّل له. |
| Left | يطوي المجلد الموسَّع؛ وعلى أي شيء آخر يحدد أباه. |
| Home، End | يحدد الصف الأول أو الأخير. |
| Return | يوسّع المجلد المحدد أو يطويه؛ وعلى عنصر بلا أبناء يتصرف عليه (`onAction`). |
| Space | يوسّع المجلد المحدد أو يطويه. |
| الحروف، الأرقام | يحدد الصف التالي الذي تبدأ تسميته بما كُتب. |

عندما يكون التحديد مخفيًا تحت عنصر مطوي (طواه التطبيق)، تعمل المفاتيح على صف ذلك العنصر: Right أو Return يوسّعه، وDown يحدد الصف الذي بعده.

في التخطيط من اليمين إلى اليسار تمتد الصفوف من اليمين، فيتبادل Left وRight موضعيهما، كما ينص النمط: Left يوسّع المجلد ويدخله، وRight يطويه ويحدد الأب. أما Up وDown وHome وEnd فتبقى كما هي.

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- iOS وAndroid وMac Catalyst: تحدد اللمسة الصف وتوسّع المجلد أو تطويه؛ واللمسة المزدوجة تتصرف على العنصر (`onAction`).
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: تفعل النقرة الشيء نفسه وتعطي الشجرة تركيز لوحة المفاتيح، وتتحرك المفاتيح المذكورة أعلاه داخلها؛ والنقرة المزدوجة تتصرف على العنصر.
- ترسم كل منصة ما ينسّقه التطبيق: الشجرة وصفوفها ومحتواها.
