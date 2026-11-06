---
title: "Command"
description: "Command: لوحة أوامر، وهي حقل بحث فوق أوامر التطبيق تتم تصفيتها أثناء كتابة المستخدم: لوحة Cmd+K داخل مربع حوار، أو قائمة أوامر مضمّنة، أو بحث يجيب عنه التطبيق. تعتمد على المحاكاة الافتراضية للقوائم (virtualization)، وتعطي الأولوية للوحة المفاتيح، وتوفّر مربع قائمة (list box) لقارئات الشاشة. مظهر كل جزء فيها يعود إلى التطبيق."
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

لوحة الأوامر (command palette) هي حقل بحث فوق قائمة من الأوامر: يكتب المستخدم بضعة أحرف فتضيق القائمة إلى الأوامر المطابقة، وتحرّك مفاتيح الأسهم التمييز، ويشغّل Return الأمر المميَّز. `Command` يتولى سلوك لوحة كهذه: التصفية والأقسام والتمييز ولوحة المفاتيح وما تسمعه قارئات الشاشة. تعمل التصفية أصلاً (natively) والصفوف افتراضية (virtualized): لا يُنشأ إلا الصفوف الظاهرة، فتُصفّى لوحة تضم آلاف الأوامر أو الملفات أو الرموز التعبيرية عند كل ضغطة مفتاح. المظهر من شأن التطبيق: لا يرسم الأمر شيئًا بنفسه، بل ينسّق التطبيق كل جزء (`itemClass`، `groupClass`، `searchClass`، ...) ويرسم محتوى الصفوف (`renderItem`: أيقونة والتسمية ومفاتيح الاختصار).

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` يأتي من [`nsh/base`](../modules/nsh-base.md)، حزمة `nsh-base` في Rust. يكون الاستعلام ملكًا للتطبيق حين يضبط `query` ويحدّثه في `onQueryChange`؛ وبدونه يحتفظ حقل البحث باستعلامه الخاص، بادئًا من `defaultQuery`. تُعرَّف العناصر بـ `id` الخاص بالتطبيق، لا بتسمياتها أبدًا: `onSelect({ id })` يحدد أيها اختاره المستخدم. في Rust، `command()` ينشئه، مع دالة ضبط لكل خاصية (`.items(..)` و`.query(..)` و`.render_item(..)`)، ودالة مستمع لكل حدث، ودوال التنسيق المنمطة.

<a id="items"></a>

## العناصر

`items` هي الأوامر، بالترتيب، وكل منها `CommandItem`:

| الحقل | النوع | الوصف |
|---|---|---|
| `id` | `string` | ما يعرّفه في `onSelect` و`onHighlightChange`: فريد بين العناصر. |
| `label` | `string` | ما يعرضه صفه ما لم يرسمه `renderItem`، وما تنطق به قارئات الشاشة، وما يطابقه الاستعلام. |
| `keywords` | `string[]` | كلمات إضافية يطابقها الاستعلام: مرادفات، أو اسم بالإنجليزية بجانب تسمية مترجمة. |
| `group` | `string` | قسمه: تظهر العناصر المتجاورة من المجموعة نفسها تحت ترويسة بهذا العنوان. |
| `shortcut` | `string` | ضغطة المفاتيح للأمر نفسه، كما يسميها [`keymap`](../modules/nsh.md#keymap) (`"mod+shift+p"`)، ليعرضها صفه. يربطها التطبيق بـ `keymap.bind`. |
| `disabled` | `boolean` | لا يمكن اختياره: تتخطاه المفاتيح، ولا تفعل الضغطات شيئًا، وتُطبَّق أنماط `disabled:`. |
| `checked` | `boolean` | هو العنصر الساري (سمة، لغة): تُطبَّق أنماط `checked:` وتذكر قارئات الشاشة أنه محدد. |

يطابق الاستعلام عنصرًا حين تحتويه تسميته أو إحدى كلماته المفتاحية، بغض النظر عن حالة الأحرف والمسافات المحيطة به. تبقى العناصر على ترتيبها، ويختفي القسم الذي لا مطابقة فيه مع ترويسته. يتلقى `renderItem` قيمة `CommandEntry` لكل صف ظاهر: حقول العنصر، و`shortcutLabel`، أي `shortcut` كما تعرضه التلميحات هنا (`⇧⌘P` على منصات Apple، و`Ctrl+Shift+P` في غيرها). هذا هو ما يكونه العنصر، أما التمييز فهو `focus:` الصف: يُنجز الرسم مرة واحدة لكل عنصر ويحتفظ بعروضه بينما ينتقل التمييز.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | الأوامر، بالترتيب. |
| `query` | `.query(..)` | `string` | لا شيء | الاستعلام (متحكَّم به)، ويضبطه التطبيق في `onQueryChange`. |
| `defaultQuery` | `.default_query(..)` | `string` | لا شيء | الاستعلام في البداية، ما دام `query` غير مضبوط. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | حقل بحث فوق الصفوف. بدونه تظهر كل العناصر، ويكون الأمر محطة واحدة في تركيز لوحة المفاتيح مع الكتابة التنبؤية (typeahead). |
| `filterable` | `.filterable(..)` | `boolean` | `true` | يصفّي الاستعلام العناصر. عند إيقافه تظهر كل العناصر: لبحث يجيب عنه التطبيق بنفسه (نتائج خادم تُضبط في `items`). ويظل الاستعلام الجديد يميّز العنصر الأول. |
| `loading` | `.loading(..)` | `boolean` | `false` | بحث قيد التنفيذ: `empty` ينتظر، والقائمة مشغولة بالنسبة لقارئات الشاشة. اعرض مؤشرك في `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | لا شيء | النص البديل (placeholder) لحقل البحث. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | يأخذ حقل البحث تركيز لوحة المفاتيح بمجرد ظهوره: لوحة تُفتح ليُكتب فيها. |
| `separator` | `.separator(..)` | `boolean` | `true` | صف فاصل بين قسمين ظاهرين، ينسّقه `separatorClass`؛ لا يكون أول ولا أخيرًا ولا مكررًا. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تسمي به قارئات الشاشة القائمة، وحقل البحث ما دام `searchAccessibilityLabel` غير مضبوط ("Commands"). |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | ما تسمي به قارئات الشاشة حقل البحث: ما يبحث فيه ("Search commands"). |
| `header`، `footer` | `.header(..)`، `.footer(..)` | `JSX.Element` | لا شيء | ما يظهر فوق حقل البحث (عنوان) وتحت الصفوف (تلميحات المفاتيح، عدد). |
| `empty` | `.empty(..)` | `JSX.Element` | لا شيء | ما يظهر حين لا يظهر أي عنصر: استعلام لا يطابق شيئًا، أو لا عناصر. |
| `searchPrefix`، `searchSuffix` | `.search_prefix(..)`، `.search_suffix(..)` | `JSX.Element` | لا شيء | ما يظهر قبل حقل البحث وبعده في شريطه: أيقونة بحث، ومؤشر دوران أثناء `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | لا شيء | محتوى الصف، للصفوف الظاهرة؛ وبدونه يعرض الصف تسمية العنصر. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | لا شيء | ترويسة القسم (`{ heading }`)؛ وبدونها تعرض الترويسة عنوانه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الأمر نفسه: حجمه وإطاره وسطحه. |
| `searchBarClass`، `searchBarStyle` | `.search_bar_class(..)`، `.search_bar_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | صف `searchPrefix` وحقل البحث و`searchSuffix`. |
| `searchClass`، `searchStyle` | `.search_class(..)`، `.search_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | حقل البحث. |
| `listClass`، `listStyle` | `.list_class(..)`، `.list_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | عرض التمرير للصفوف. أعطه ارتفاعًا (`max-h-80`، أو أمرًا محدد الحجم): تتمرر الصفوف داخله ولا يُنشأ إلا الظاهر منها. |
| `itemClass`، `itemStyle` | `.item_class(..)`، `.item_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | صف كل عنصر وحالاته (أدناه)؛ وتصل أنماط نصه إلى التسمية. |
| `groupClass`، `groupStyle` | `.group_class(..)`، `.group_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | ترويسة كل قسم. |
| `separatorClass`، `separatorStyle` | `.separator_class(..)`، `.separator_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل فاصل: ارتفاع الخط ولونه. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | اختار المستخدم عنصرًا: Return، أو ضغطة على صفه. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | انتقل التمييز (المفاتيح، المؤشر، استعلام جديد أو عناصر جديدة، `highlight`): لمعاينة ما سيشغّله Return. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | كتب المستخدم في حقل البحث، أو مسحه Escape. |
| `onCancel` | `.on_cancel(..)` | لا شيء | Escape مع استعلام فارغ: أغلق ما يحتوي الأمر (`open` في مربع حوار). |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بـ | الحالات |
|---|---|---|---|
| الأمر | | `class`، `style` | |
| `header` | الأمر | عنصر التطبيق | |
| شريط البحث | الأمر | `searchBarClass`، `searchBarStyle` | |
| `searchPrefix`، حقل البحث، `searchSuffix` | شريط البحث | عناصر التطبيق؛ `searchClass`، `searchStyle` | `focus:` الحقل |
| القائمة | الأمر | `listClass`، `listStyle` | |
| ترويسة القسم | القائمة | `groupClass`، `groupStyle`، `renderGroup` | |
| الفاصل | القائمة | `separatorClass`، `separatorStyle` | |
| الصف | القائمة | `itemClass`، `itemStyle` | `focus:` (مميَّز)، `checked:`، `disabled:`، `hover:`، `active:` |
| محتوى الصف | الصف | `renderItem` | `group-focus:`، `group-checked:`، `group-disabled:` تحت `group` في `itemClass` |
| `empty` | الأمر | عنصر التطبيق | |
| `footer` | الأمر | عنصر التطبيق | |

أظهر الصف المميَّز بـ `focus:` (انظر [إرشادات التصميم](../docs/design-guides.md#interaction-states)).

## Ref

| الدالة | الوصف |
|---|---|
| `focus()` | تعطي حقل البحث تركيز لوحة المفاتيح (وبدونه، الأمر). |
| `highlight(id)` | تميّز عنصر `id` وتمرر صفه إلى الظهور؛ أما العنصر غير الظاهر أو المعطّل فيبقى كما هو. |
| `matchedCount()` | `Promise<number>`: عدد العناصر التي يظهرها الاستعلام، بما فيها المعطّلة. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## لوحة أوامر داخل مربع حوار

ضع الأمر في [`Dialog`](./dialog.md) وافتحه باختصار التطبيق. يمسح Escape الاستعلام أولًا؛ ومع استعلام فارغ يصبح `onCancel`، حيث يغلق التطبيق مربع الحوار.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## بحث يجيب عنه التطبيق

مع `filterable={false}` تظهر كل العناصر التي يعطيها التطبيق: يبحث التطبيق في `onQueryChange` (خادم، قاعدة بيانات) ويضبط `items` بالنتائج، و`loading` أثناء انتظاره.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## إمكانية الوصول

- للقائمة الدور `"listbox"`، وتسميها `accessibilityLabel`؛ وكل صف هو `"option"` تسميه تسمية عنصره، ويكون محددًا ومعطّلًا كما يكون عنصره؛ وترويسة القسم هي `"header"`، والفاصل مخفي.
- حقل البحث حقل نصي تسميه `searchAccessibilityLabel` (وإلا `accessibilityLabel`)؛ ونصه البديل تلميح يظهر ما دام فارغًا.
- يحتفظ حقل البحث بتركيز لوحة المفاتيح بينما تحرّك مفاتيح الأسهم التمييز، وتسمع قارئات الشاشة تسمية الصف المميَّز. وبدون حقل بحث، يأخذ الصف المميَّز تركيز قارئ الشاشة.
- أثناء `loading`، تكون القائمة مشغولة.

انظر [إمكانية الوصول](../docs/accessibility.md) للتسميات والأدوار والإعلانات عمومًا.

<a id="keyboard"></a>

## لوحة المفاتيح

| المفتاح | ما يفعله |
|---|---|
| الكتابة | تصفّي العناصر؛ ويُميَّز أول عنصر مطابق ممكَّن. |
| Down، Up | تميّز العنصر التالي أو السابق، متخطية المعطّلة، من الأخير إلى الأول والعكس. |
| Page Down، Page Up | تنقل التمييز بمقدار الصفوف الظاهرة. |
| Return | يختار العنصر المميَّز (`onSelect`). |
| Escape | يمسح الاستعلام؛ ومع استعلام فارغ، يبلّغ `onCancel`. |
| Home، End | بدون حقل بحث: العنصر الأول أو الأخير (وفي الحقل تنقلان مؤشر الإدخال). |
| Space، الأحرف، الأرقام | بدون حقل بحث: يختار Space، وتميّز الأحرف والأرقام بالكتابة التنبؤية (typeahead). |

<a id="platform-notes"></a>

## ملاحظات المنصات

- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: يميّز المؤشر الصف الذي يمر فوقه، وينتقي النقر العنصر لحظة الضغط، فيحتفظ حقل البحث بتركيز لوحة المفاتيح.
- iOS وAndroid وMac Catalyst: تختار النقرة صفًا، ويختار مفتاح الإدخال في لوحة المفاتيح العنصر المميَّز ويُبقي الحقل للاستعلام التالي.
- تعرض كل منصة ما ينسّقه التطبيق: الأمر وشريط بحثه وصفوفه ومحتواها.
