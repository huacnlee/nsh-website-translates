---
title: "DataTable"
description: "مكوّن DataTable: جدول من الصفوف والأعمدة يدعم التمرير في الاتجاهين فوق أي عدد منهما، مع أعمدة ثابتة وقابلة لتغيير الحجم والنقل والفرز، وتحديد الصفوف والأعمدة والخلايا، وصفوف يقدّمها التطبيق صفحةً صفحةً، وتسميات للمجموعات، والتنقل باستخدام لوحة المفاتيح، وخلايا يرسمها التطبيق."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` يعرض الصفوف والأعمدة كما تفعل جداول البيانات، ويتمرر في الاتجاهين فوق أي عدد منهما. لا تُنشأ إلا الخلايا الظاهرة، لذا يتمرر جدول من مليون صف وعشرة آلاف عمود كما يتمرر جدول صغير. يمكن تحديد الصفوف أو الأعمدة أو الخلايا بالمؤشر ولوحة المفاتيح. للأعمدة عروض ثابتة، ويمكن تغيير عرضها بسحب حافتها، ونقلها بسحب عنوانها، وتثبيتها عند اليسار بينما تتمرر الأعمدة الأخرى، وفرزها. يمكن وضع العناوين تحت تسميات المجموعات، ويمكن للتطبيق رسم أي خلية أو عنوان.

`DataTable` يوفر التخطيط والمحاذاة والافتراضية (virtualization) والتفاعل. أما المسافات الداخلية والألوان والحدود وتأثيرات التحديد لأجزائه فيحددها التطبيق عبر `classes` و`styles`. في Rust يُنشأ الجدول بواسطة `nsh_base::data_table()`، وفي TSX بواسطة `<DataTable>` من `nsh/base`.

```rust tabs
use nsh_base::{DataTableColumn, data_table};
use nsh_core::prelude::*;

fn column(key: &str, title: &str) -> DataTableColumn {
    let mut column = DataTableColumn::default();
    column.key = key.into();
    column.title = Some(title.into());
    column
}

fn table() -> impl IntoElement {
    data_table()
        .columns(vec![column("name", "Name"), column("city", "City")])
        .flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DataTable, type DataTableColumn } from "nsh/base";

const columns: DataTableColumn[] = [
  { key: "name", title: "Name", width: 160, sortable: true },
  { key: "city", title: "City", width: 120 },
  { key: "score", title: "Score", width: 90, align: "end" },
];

const rows = [
  { name: "Ada", city: "Oslo", score: 91 },
  { name: "Grace", city: "Lima", score: 87 },
  { name: "Linus", city: "Kyoto", score: 78 },
];

function App() {
  return <DataTable columns={columns} data={rows} class="flex-1" />;
}

mount(App);
```

يملأ الجدول الصندوق الذي يعطيه إياه التطبيق (`flex-1`، وارتفاع) ويتمرر داخله: عموديًا عبر الصفوف وأفقيًا عبر الأعمدة، مع أشرطة تمرير (`scrollbar={false}` يخفيها، و`bounces={false}` يوقف الارتداد عند النهايات على المنصات التي فيها ذلك).

<a id="rows-and-columns"></a>

## الصفوف والأعمدة

`data` هي الصفوف: إما كائنات تسمّي حقولها قيم `key` للأعمدة، أو مصفوفات تفهرسها الأعمدة بالموضع. تظهر الأرقام والقيم المنطقية والنصوص كنص. في Rust تُعطى الصفوف حقلًا بعد حقل، ولكل حقل نوع واحد: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. العمود هو `DataTableColumn`:

| الحقل | الوصف |
|---|---|
| `key` | هويته، وهي فريدة بين الأعمدة: حقل الصفوف الذي تعرضه خلاياه، والاسم الذي تستخدمه الأحداث والـ ref. |
| `title` | نص عنوانه. الافتراضي: `key` الخاص به. |
| `width` | عرضه بالنقاط. الافتراضي: `120`. |
| `minWidth`، `maxWidth` | أضيق عرض وأوسع عرض يصل إليهما السحب أو الملاءمة. الافتراضي: `20` و`1200`. |
| `fitPadding` | مساحة إضافية للمسافات الداخلية والأيقونات والشارات الخاصة بالتطبيق، تُضاف إلى أعرض نص بين العنوان والخلايا عند ملاءمة العمود. |
| `align` | `"start"` (الافتراضي) أو `"center"` أو `"end"`، للأرقام. يشمل الخلايا والعنوان معًا. |
| `sortable` | في عنوانه زر فرز يطلب الفرز (انظر [الفرز](#sorting)). |
| `fixed` | يبقى عند اليسار بينما تتمرر الأعمدة الأخرى تحته. تتقدم الأعمدة الثابتة غيرها بترتيبها. |
| `resizable`، `movable` | هل يغيّر سحب حافته عرضه، وهل ينقله سحب عنوانه. الافتراضي: قيمتا `resizableColumns` و`movableColumns` للجدول. |
| `selectable` | هل يشارك في التحديد. العمود الذي يحوي أزرارًا أو خانات اختيار يضبط `false`. الافتراضي: `true`. |
| `cellClass` | أصناف خلايا العمود، بعد أصناف جزء `cell`: مسافات داخلية أو محاذاة لعمود واحد. |
| `headerClass` | أصناف عنوان العمود، بعد أصناف جزء `headerCell`. |
| `positiveClass` | أصناف خلايا العمود التي تحمل ارتفاعًا: رقم أكبر من الصفر، أو نص يبدأ بـ `+`. |
| `negativeClass` | أصناف خلايا العمود التي تحمل انخفاضًا: رقم أصغر من الصفر، أو نص يبدأ بـ `-`. |

`rowHeight` هو ارتفاع صف الجسم (الافتراضي `32`) و`headerHeight` ارتفاع صف العناوين (الافتراضي ارتفاع الصف). `rowHeader` يضيف عمودًا لأرقام الصفوف عند اليسار، يحدد الصفوف. `stripe` يعطي الصفوف الفردية الجزء `rowOdd`.

<a id="group-labels"></a>

### تسميات المجموعات

`groups` يضع تسميات فوق الأعمدة، بدءًا من المستوى الأدنى. كل مستوى قائمة من `{ label, span }` يساوي مجموع امتداداتها عدد الأعمدة، أو عدد تسميات المستوى الأدنى.

```tsx
<DataTable
  columns={columns}
  data={rows}
  groups={[
    [{ label: "Person", span: 2 }, { label: "Result", span: 1 }],
  ]}
  class="flex-1"
/>
```

<a id="any-number-of-rows"></a>

## أي عدد من الصفوف

يطلب الجدول الصفوف بالموضع، ويخدمها التطبيق. `rowCount` هو العدد الكلي للصفوف، و`data` الصفوف التي يحتفظ بها التطبيق، و`dataStart` موضع أول صف منها. الصفوف خارج `data` تبقى فارغة إلى أن يوفرها التطبيق. `onVisibleRowsChange` يبلّغ عن الصفوف الظاهرة، `{ range: { start, end } }`، عند كل خطوة تمرير، وهو المكان المناسب لجلب الصفحة المحيطة بها.

```tsx
const ROWS = 1_000_000;
const page = signal({ start: 0, rows: load(0) });

<DataTable
  columns={columns}
  data={page().rows}
  dataStart={page().start}
  rowCount={ROWS}
  onVisibleRowsChange={({ range: { start, end } }) => {
    // Keep the rows in view inside the page held.
    const held = page();
    if (start < held.start || end > held.start + held.rows.length) {
      const first = Math.max(0, start - 200);
      page.set({ start: first, rows: load(first) });
    }
  }}
  class="flex-1"
/>
```

للقائمة التي تنمو عند نهايتها، اضبط `hasMore`: يُطلق `onLoadMore` مرة واحدة لكل عدد من الصفوف عندما تصبح الصفوف الظاهرة ضمن `loadMoreThreshold` (الافتراضي `20`) من آخر صف. وما دام `loading` صحيحًا ينتظر، ويظهر الفتحة `loadingView` فوق الصفوف. وتظهر الفتحة `empty` عندما لا توجد صفوف.

عند تجاوز بضعة ملايين من النقاط في المحتوى، تغطي أشرطة التمرير نطاقًا مُقيَّسًا، فيظل بالإمكان الوصول بالتمرير إلى كل صف حتى مع مليون صف.

<a id="selection"></a>

## التحديد

ثلاثة مفاتيح تقرر ما الذي تحدده الضغطة، كما في gpui-component:

| الخاصية | ما تحدده الضغطة | `selection` |
|---|---|---|
| `rowSelectable` (الافتراضي `true`) | صفًا: أي خلية فيه أو رأس صفه | `{ row }` |
| `columnSelectable` (الافتراضي `true`) | عمودًا: عنوانه | `{ column }` |
| `cellSelectable` (الافتراضي `false`) | خلية؛ ورأس الصف (يظهر افتراضيًا معه) يحدد الصفوف | `{ row, column }` |

مع `cellSelectable` وإخفاء رأس الصف (`rowHeader={false}`)، تؤدي الضغطة على الخلية المحددة مرة أخرى إلى تحديد صفها. لا تحدد الضغطة مع Shift أو مفتاح الأمر في المنصة صفًا إلا بينما `selectOnModifierPress` (الافتراضي `true`)، لذا فإن التطبيق الذي يحتفظ بتحديده الخاص لعدة صفوف يعالج هذه الضغطات بنفسه: `onRowPress` يبلّغ عن كل ضغطة على الجسم مع صفها، والعمود تحت المؤشر، وعدد النقرات في الصف، والمفاتيح المعدِّلة المضغوطة. والعمود الذي قيمة `selectable` فيه `false` لا يحدد نفسه ولا خلاياه.

تُعدّ الصفوف في البيانات من 0، والعمود هو فهرسه ضمن `columns` مهما كان الترتيب الذي نقله إليه المستخدم. `onSelectionChange` يبلّغ بما حدده المستخدم (`null` إن لم يحدد شيئًا). الخاصية `selection` تضبط التحديد من التطبيق؛ وإن تُركت دون ضبط احتفظ الجدول به بنفسه. `onDoublePress` يبلّغ عن صف أو خلية أو عنوان جرت الضغطة عليه مرتين، و`onContextMenu` عن ضغطة ثانوية أو مطوّلة مع النقطة التي ينبغي فتح [`Menu`](./menu.md) الخاصة بالتطبيق عندها. وكلاهما يسمّي الخلية تحت المؤشر (`row` و`column`)، أو رقم صف (`row` فقط)، أو عنوانًا (`column` فقط). وإلى الضغطة التالية، تحمل الخلية التي طُلبت لها قائمة الجزء `cellActive`، أو يحمل صفها الجزء `rowActive` حيث لا تحدَّد الخلايا.

تحصل قارئات الشاشة على شبكة (اسمها من `accessibilityLabel`) من رؤوس الأعمدة والخلايا، وتُذكر المحددة منها على أنها محددة.

<a id="keyboard"></a>

## لوحة المفاتيح

الضغط على الجدول، أو الوصول إليه بمفتاح Tab (في macOS والويب)، يمنحه لوحة المفاتيح إلى أن تحدث ضغطة أخرى، أو ينتقل التركيز إلى مكان آخر، أو `blur()`؛ و`focus()` يمنحه إياها من التطبيق. الجدول محطة واحدة في Tab: داخله ينقل Tab التحديد، ويعيد Escape لوحة المفاتيح.

| المفاتيح | ما تفعله |
|---|---|
| مفاتيح الأسهم | تنقل التحديد بصف أو عمود أو خلية، مع تمريره إلى حيز الرؤية. |
| Tab، Shift+Tab | الانتقال إلى العمود التالي أو السابق. |
| Page Up، Page Down | الانتقال بمقدار صفحة من الصفوف. |
| Home، End | الانتقال إلى الأول أو الأخير. |
| Escape | يمسح التحديد، ثم يعيد لوحة المفاتيح. |
| اختصار النسخ | يضع نص التحديد في الحافظة (`copy()`). |

`loopSelection` (الافتراضي `true`) يجعل مفاتيح الأسهم تلتف حول النهايات.

<a id="sorting"></a>

## الفرز

للعمود `sortable` زر فرز في نهاية عنوانه، وهو زر شفاف صغير يخفت ما دام العمود غير مفروز. الضغط عليه يبلّغ بالفرز التالي (`{ key, direction }`) ضمن الدورة: غير مفروز، تصاعدي، تنازلي، ثم غير مفروز من جديد، مع `onSortChange({ sort })` (`null` للمسح). لا يعيد الجدول ترتيب الصفوف: التطبيق هو من يفرز بياناته، أو يطلب من خادمه الصفوف بالترتيب الجديد، ثم يضبط `sort` ليظهره العنوان. ولأن التطبيق يملك الترتيب، يعمل الفرز بالطريقة نفسها فوق مليون صف لا يحتفظ بها التطبيق أصلًا.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  sort={sort()}
  onSortChange={({ sort: next }) => {
    sort.set(next ?? undefined);
    rows.set(sorted(people, next));
  }}
  class="flex-1"
/>
```

<a id="resizing-and-moving-columns"></a>

## تغيير عرض الأعمدة ونقلها

سحب الحافة الخلفية للعمود يغيّر عرضه ضمن `minWidth` و`maxWidth`، و`onColumnResize({ key, width })` يبلّغ عن كل خطوة. الضغط على الحافة مرتين متتاليتين يلائم العمود مع أعرض نص فيه وعنوانه. وسحب العنوان ينقل العمود، ويظهر خط يبيّن مكان الإفلات؛ و`onColumnMove` يبلّغ بـ `{ key, from, to, order }`، حيث `order` هي `key` جميع الأعمدة بالترتيب المعروض. تبقى الأعمدة الثابتة بين الأعمدة الثابتة. `resizableColumns` و`movableColumns` يعطّلان الأمرين معًا للجدول، وقيمتا `resizable` و`movable` للعمود تتقدمان عليهما.

<a id="live-data"></a>

## البيانات الحية

جدول الأسعار يتغير عدة مرات في الثانية. ينسّق التطبيق الصفوف الظاهرة ونطاقًا حولها (يعرفها من `onVisibleRowsChange`) ويسلّمها كـ `data` من `dataStart`، فتكلّف أي تحديثات ما هو على الشاشة فقط، مهما كان عدد الصفوف. وتأخذ الارتفاعات والانخفاضات ألوانها من `positiveClass` و`negativeClass` للعمود، وتُطبَّق أصليًا على الخلايا التي قيمتها فوق الصفر أو تحته (أو التي يبدأ نصها بـ `+` أو `-`).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

الصفوف والأعمدة فتحات ينشئها الجدول مرة واحدة ويحتفظ بها: التمرير يمنحها صفوفًا وأعمدة أخرى لتعرضها، فلا يغيّر التمرير، مهما طال، سوى النصوص والمواضع.

<a id="drawing-cells-and-titles"></a>

## رسم الخلايا والعناوين

`renderCell` يرسم خلايا خاصة بالتطبيق حيث لا يكون العمود نصًا فقط (شارة، زر). يُستدعى للخلايا الظاهرة فقط، مع `DataTableCell`: `row` و`column` و`key` و`text` (ما كان الجدول سيعرضه) و`selected`. يبحث التطبيق عن بياناته بواسطة `row`. `renderHeaderCell` يرسم عنوانًا عبر خليته، ويُمرَّر إليه `DataTableHeaderCell`: `column` و`key` و`title` و`sort` (الاتجاه، أو لا شيء) و`selected`.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  renderCell={(cell) =>
    cell.key === "status" ? (
      <View class={cell.text === "open" ? "rounded bg-green-500/20 px-2" : "rounded bg-muted px-2"}>
        <Text class="text-xs">{cell.text}</Text>
      </View>
    ) : (
      <Text class="px-2 text-sm">{cell.text}</Text>
    )
  }
  class="flex-1"
/>
```

`fontFamily` و`fontSize` (الافتراضي `14`) يحددان خط الخلايا، وبه يقيس الجدول النصوص أيضًا لملاءمة الأعمدة.

<a id="the-ref"></a>

## الـ ref

`ref` يعطي `DataTableRef`. أي دالة تُعطى صفًا أو عمودًا أو مفتاح عمود لا يملكه الجدول لا تغيّر شيئًا وتسجّل تحذيرًا يسمّي الدالة والقيمة؛ و`fitColumn` يُرفض بـ `TypeError` عند مفتاح غير معروف.

| الدالة | الوصف |
|---|---|
| `scrollToRow(row, animated?)` | تمرّر صفًا إلى حيز الرؤية. |
| `scrollToColumn(key, animated?)` | تمرّر عمودًا إلى حيز الرؤية. |
| `selection()` | ما هو محدد، و`null` إن لم يكن شيء محددًا. |
| `select(selection)` | تحدد (`null`: لا شيء) وتُظهر المحدد، دون `onSelectionChange`. |
| `visibleRows()`، `visibleColumns()` | الصفوف والأعمدة المتمررة الظاهرة، كـ `{ start, end }` (دون `end`). |
| `columnWidths()` | العروض الحالية، بترتيب `columns`. |
| `setColumnWidth(key, width)` | تضبط عرض عمود، ضمن حدوده. |
| `fitColumn(key)` | تجعل العمود بعرض أعرض نص وعنوان فيه بين الصفوف الظاهرة وحتى ألف صف إضافي حولها. وتعيد العرض. |
| `dump(start?, end?)` | نصوص الصفوف المعطاة (الافتراضي كل المحتفظ بها) ونصوص العناوين، كما تظهر: `{ headers, rows }`، للتصدير. |
| `copy()` | تضع نص التحديد في الحافظة: خلايا الصف تفصل بينها علامات جدولة، وخلايا العمود تفصل بينها فواصل أسطر، ونص الخلية. |
| `focus()`، `blur()` | تمنح لوحة المفاتيح للجدول أو تأخذها منه. |
| `menuTarget()`، `clearMenuTarget()` | ما طُلبت له آخر قائمة سياقية (`{ row?, column? }`، موسومًا بـ `cellActive` / `rowActive`)، وإزالة هذه العلامة عند إغلاق قائمة التطبيق. |

<a id="styling-the-parts"></a>

## تنسيق الأجزاء

`class` و`style` ينسّقان صندوق الجدول. `classes` يأخذ أصناف Tailwind حسب الجزء، و`styles` أنماطًا مضمنة حسب الجزء؛ الأجزاء توفر بنية الجدول ومحاذاته، وأصنافها توفر المظهر، و`styles` تتقدم على الأصناف.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  stripe
  class="flex-1 rounded-lg border border-border"
  classes={{
    header: "bg-secondary",
    headerCell: "pl-2 pr-1",
    headerContent: "gap-1",
    cell: "px-2",
    resizeHandle: "bg-border group-hover:bg-primary",
    sortAscending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    sortDescending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    rowSelected: "bg-primary/10",
    rowHover: "bg-muted/50",
    fixedEdge: "bg-border",
  }}
/>
```

| الجزء | ما هو |
|---|---|
| `root` | صندوق الجدول: حدوده وانحناء زواياه وخلفيته |
| `header` | الترويسة عبر الجدول، بصفوف تسميات المجموعات والعناوين |
| `groupCell` | تسمية مجموعة فوق الأعمدة التي تمتد عليها |
| `headerCell` | خلية عنوان كل عمود |
| `headerContent` | صف التخطيط للتسمية وزر الفرز؛ اضبط الفجوة بينهما هنا |
| `headerCellDragging` | العنوان المسحوب، بعد `headerCell` |
| `headerCellSorted` | عنوان العمود المفروز به الجدول، بعد `headerCell` |
| `headerCellSelected` | عنوان العمود المحدد، بعد `headerCell` |
| `sortIndicator` | زر الفرز في العمود القابل للفرز |
| `sortAscending`، `sortDescending` | سهماه؛ و`selected:` يُطبَّق على الاتجاه المفروز |
| `resizeHandle` | الخط عند الحافة الخلفية للعمود الذي يغيّر سحبه عرضه |
| `moveIndicator` | الخط الذي سيُفلَت عنده العمود المسحوب |
| `row` | كل صف في الجسم |
| `rowOdd` | الصفوف الفردية، بعد `row` (`stripe`) |
| `rowHover` | الصف الذي يمر المؤشر فوقه، بعد `row` |
| `rowSelected` | الصف المحدد، بعد `row` |
| `rowActive` | الصف الذي طُلبت له قائمة سياقية حيث لا تحدَّد الخلايا، إلى الضغطة التالية، بعد `row` |
| `cell` | كل خلية في الجسم |
| `cellSelected` | الخلية المحددة، بعد `cell` |
| `cellActive` | الخلية التي طُلبت لها قائمة سياقية، إلى الضغطة التالية، بعد `cell` |
| `cellColumnSelected` | خلايا العمود المحدد، بعد `cell` |
| `rowHeader` | خلايا رؤوس الصفوف، أي أرقام الصفوف |
| `rowHeaderCorner` | الزاوية فوق رؤوس الصفوف |
| `fixedEdge` | الخط عند الحافة الخلفية للأعمدة الثابتة، فوق الأعمدة التي تتمرر تحتها |
| `empty` | صندوق الفتحة `empty` |
<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | الأعمدة من اليسار إلى اليمين. الأعمدة الثابتة تأتي أولًا. |
| `data` | `.data(..)` | `Row[]` | `[]` | الصفوف: كائنات بحسب `key` العمود، أو مصفوفات بحسب الموضع. |
| `rowCount` | `.row_count(..)` | `number` | الصفوف المحتفظ بها | العدد الإجمالي للصفوف. |
| `dataStart` | `.data_start(..)` | `number` | `0` | رقم الصف الأول في `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | فئات الصفوف المحددة بحسب موضعها في `data`: مظهر خاص بكل صف، دون استدعاء JS لكل صف. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | ارتفاع صف المحتوى بالنقاط. |
| `headerHeight` | `.header_height(..)` | `number` | ارتفاع الصف | ارتفاع صف العناوين. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | تسميات فوق الأعمدة، بدءًا من المستوى الأدنى. |
| `sort` | `.sort(..)` | `DataTableSort` | | ما تُرتَّب البيانات بحسبه، ويظهر على العنوان. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | الضغطات والمفاتيح تحدد الصفوف. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | الضغط على عنوان يحدد عموده، والمفاتيح الأفقية تنقل بين الأعمدة. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | الضغطات والمفاتيح تحدد الخلايا. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | الضغط مع الاستمرار على Shift أو مفتاح command يحدد صفًا. |
| `selection` | `.selection(..)` | `DataTableSelection` | | المحدد حاليًا، عندما يضبطه التطبيق. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | مفاتيح الأسهم تلتف عند الطرفين. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | الاسم الذي تنطق به قارئات الشاشة للجدول. |
| `rowHeader` | `.row_header(..)` | `boolean` | يظهر مع `cellSelectable` | عمود لأرقام الصفوف على اليسار. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | الصفوف الفردية تأخذ الجزء `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | سحب حافة العمود يغيّر حجمه. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | سحب عنوان ينقل عموده. |
| `loading` | `.loading(..)` | `boolean` | `false` | الجدول قيد التحميل: `onLoadMore` ينتظر و`loadingView` يظهر. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | توجد صفوف أخرى للتحميل. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | عدد الصفوف من الصف الأخير التي يُطلق عندها `onLoadMore`. |
| `fontFamily` | `.font_family(..)` | `string` | موروث | خط الخلايا. |
| `fontSize` | `.font_size(..)` | `number` | `14` | حجم خط الخلايا بالنقاط. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | أشرطة التمرير. |
| `verticalScrollbar`، `horizontalScrollbar` | `.vertical_scrollbar(..)`، `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | شريط التمرير لمحور واحد (الأفقي هو شريط أجهزة سطح المكتب أسفل الجدول). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | ما إذا كان التمرير يرتد عند الطرفين، في المنصات التي تدعم ذلك. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | يرسم الخلايا المرئية. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | يرسم العناوين. |
| `empty` | `.empty(..)` | `JSX.Element` | | ما يظهر عند عدم وجود صفوف. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | ما يظهر فوق الصفوف أثناء `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | فئات Tailwind بحسب الجزء. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | أنماط مضمّنة بحسب الجزء، تتغلب على الفئات. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | | صندوق الجدول. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | غيّر المستخدم التحديد: `{ selection }`، وهو `{ row?, column? }` أو `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | تم الضغط على صف أو خلية: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | تم الضغط مرتين على صف أو خلية أو عنوان: `{ target }`، وهو `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | طُلبت قائمة سياقية: `{ row?, column?, x, y }`، النقطة في العرض الجذر. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | تم الضغط على زر الترتيب: `{ sort }`، والترتيب التالي `{ key, direction }` أو `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | تغيّر حجم عمود (`{ key, width }`)، عند كل خطوة من السحب ومرة أخرى عندما تحدده الملاءمة التلقائية. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | نُقل عمود: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | تغيرت الصفوف المرئية: `{ range }`، وهو `{ start, end }`. اجلب الصفوف من هنا. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | تغيرت أعمدة التمرير المرئية: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | اقتربت الصفوف المرئية من الصف الأخير ضمن `loadMoreThreshold` بينما `hasMore` وليس `loading`. |

<a id="related"></a>

## ذات صلة

- [Editor](./editor.md) و[DiffView](./diff-view.md): المكوّنات الأساسية الأخرى كثيفة البيانات.
- [Menu](./menu.md): القائمة التي تُفتح من `onContextMenu`.
- [`nsh/base`](../modules/nsh-base.md): المكوّنات الأساسية الأخرى.
