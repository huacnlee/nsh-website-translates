---
title: "DiffView"
description: "مكوّن DiffView: يعرض التغييرات بين نصّين أو التغييرات في ملف تصحيح (patch)، بعرض متجاور أو موحّد، مع إبراز الكلمات المتغيّرة داخل الأسطر، وطيّ الأسطر غير المتغيّرة في فواصل قابلة للتوسيع، وتلوين الصياغة (syntax highlighting)، والتفاف النص، وإجراءات لكل تغيير، وتحديد الأسطر، وتعليقات المراجعة."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

يعرض `DiffView` التغييرات بين نصين كما تفعل أدوات مراجعة الشيفرة: إما جنبًا إلى جنب، النص القديم على اليسار والجديد على اليمين مع محاذاة أسطرهما، أو في عرض موحّد تظهر فيه الأسطر المحذوفة فوق الأسطر المضافة. تُميَّز الكلمات التي تغيّرت داخل السطر المتغيّر، وتنطوي الأسطر غير المتغيّرة بين التغييرات في فواصل قابلة للتوسيع، ويُلوَّن النص بألوان صياغة [`Editor`](./editor.md). يعرض نصين (`oldValue` و`newValue`) أو ملفات diff موحّد (`patch`: ناتج `git diff`، أو طلب سحب)، كلٌّ منها تحت ترويسته، وهو مصمَّم لمراجعة التغييرات، ومنها التعديلات التي يقترحها الذكاء الاصطناعي: إجراءات التطبيق على كل تغيير تُبقيه أو تتراجع عنه. تُنشأ الصفوف الظاهرة فقط، لذا يتمرّر الملف الطويل كما يتمرّر القصير.

يتولى `DiffView` السلوك، ويأتي بمظهر خاص به مبني على رموز (tokens) السمة: `font-mono` الخاص بالسمة بحجم 13pt في صفوف ارتفاعها 20pt، وأرقام الأسطر بـ`muted-foreground`، والأسطر المضافة بدرجة خضراء والمحذوفة بدرجة حمراء، والكلمات المتغيّرة بدرجة أقوى، وشريط عند حافة الهامش لكل سطر متغيّر، والفواصل على `muted`. يأخذ كل جزء أنماط التطبيق بدلًا من هذه القيم الافتراضية (`classes` و`styles`). يُنشئ Rust واحدًا بـ`nsh_base::diff_view()`، وTSX بـ`<DiffView>` من `nsh/base`.

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

يملأ العرض الصندوق الذي يمنحه التطبيق إياه (`flex-1`، وارتفاع) ويتمرّر داخله: عموديًا عبر الصفوف، وأفقيًا حتى أطول سطر، مع تمرّر جانبَي العرض المقسّم معًا. وعند استخدام `softWrap` تلتف الأسطر الطويلة عند عرض الجانب بدلًا من ذلك، ويكون الصف المقسّم بارتفاع أطول جانبيه، فيبقى الجانبان محاذيين.

<a id="two-texts-or-a-patch"></a>

## نصان أو رقعة

- **نصان**: `oldValue` و`newValue`. تُقارَن الأسطر كما هي، لذا فإضافة فاصل سطر أخير أو إزالته تُعدّ تغييرًا، كما يعرضه git.
- **رقعة (patch)**: `patch`، وهي diff موحّد لملف واحد أو عدة ملفات (`git diff` و`git format-patch` و`diff -u`؛ مع عمليات إعادة التسمية والأذونات والملفات الجديدة والمحذوفة والثنائية، ورسالة الإيداع التي تسبقها، وتُقرأ كما يكتبها git). يعرض العرض أسطر مقاطعها (hunks)، مرقّمة كما في الملف، كل مقطع تحت فاصل لترويسته (الدالة التي يقع فيها)، وكل ملف من عدة ملفات تحت ترويسة خاصة به ([ملفات الرقعة](#files-of-a-patch)). يحدد مسار كل ملف لغته عندما لا يكون `language` معيّنًا.

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

يسمّي `language` اللغة كما يفعل `Editor`: باسم أو اسم مستعار أو امتداد أو اسم ملف (`"rust"`، `"tsx"`، `"main.go"`، `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## ملفات الرقعة

تعرض الرقعة متعددة الملفات كل ملف تحت صف ترويسة: افتراضيًا مساره (`old → new` عند إعادة التسمية)، وعدد أسطره المضافة والمحذوفة، و`▾`، والضغط عليها يطوي الملف إلى ترويسته (`▸`) أو يوسّعه. يرسم `renderFileHeader` الترويسات بطريقة التطبيق (ويعرض واحدة فوق رقعة الملف الواحد أيضًا)، ويُعطى الملف (`DiffFile`): `index`، `path`، `oldPath` (أُعيدت تسميته أو نُسخ منه)، `status` (`"modified"`، `"added"`، `"deleted"`، `"renamed"`، `"copied"`)، `binary` (لا تعرض الرقعة أيًا من أسطره)، `added`، `deleted`، `hunks`، `firstHunk` و`collapsed`. تستدعي ترويسة التطبيق دالة `toggleFile(path)` الخاصة بالمرجع (ref)؛ ويضبط `collapseFile` و`expandFile` الحالة، ويُبلَّغ عن كل تغيير بـ`onFileToggle({ file })`. يبقى الملف المطوي مطويًا ما دام `patch` جديد ما زال يحتويه.

تُعدّ التغييرات عبر الملفات بالترتيب: تغييرات الملف هي من `firstHunk` إلى `firstHunk + hunks - 1`، وتستخدمها `goToHunk` و`renderHunkActions` و`hunks()` (`file` الخاص بـ`DiffHunk` هو فهرس ملفه، وتُحسب أسطره داخل ذلك الملف)، ويجمع `stats()` تغييرات كل الملفات. يوسّع `goToHunk` الملف المطوي أولًا.

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## التخطيط والتغييرات داخل السطر

قيمة `layout` هي `"split"` (الافتراضي: جنبًا إلى جنب، كل سطر محذوف بجوار أكثر الأسطر المضافة شبهًا به) أو `"unified"` (عمود واحد، تظهر فيه الأسطر المحذوفة للتغيير فوق أسطره المضافة، مع رقمي السطر معًا). ويحدد `inline` ما يُميَّز داخل السطر المتغيّر:

| `inline` | ما يتم تمييزه |
|---|---|
| `"wordAlt"` (الافتراضي) | الكلمات التي تغيّرت، وتُدمج عندما يفصل بينها حرف واحد، فتُقرأ العبارة المتغيّرة كوحدة واحدة |
| `"word"` | كل كلمة تغيّرت |
| `"char"` | كل حرف تغيّر |
| `"none"` | لا شيء: درجات لون الأسطر وحدها |

الكلمات هي سلاسل من الأحرف والأرقام و`_`؛ وكل حرف CJK ومقطع كانا أو هانغول يُعدّ كلمة بذاته، فيقتصر تمييز الحرف المتغيّر في جملة على نفسه. أما السطر الذي تغيّر بالكامل تقريبًا فيعرض درجة لونه وحدها.

يضع `indicators` علامة على الأسطر المتغيّرة بجوار أرقامها: `"bars"` (الافتراضي، شريط عند حافة الهامش)، أو `"classic"` (`+` و`−` قبل النص)، أو `"none"`. ويترك `background={false}` الأسطر المتغيّرة دون تلوين، ويخفي `lineNumbers={false}` الأرقام.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## الأسطر المطوية

حول كل تغيير تظهر `contextLines` من الأسطر غير المتغيّرة (3 افتراضيًا)؛ أما الأسطر غير المتغيّرة بين التغييرات، وتلك التي قبل الأول وبعد الأخير، فتنطوي في فاصل يبيّن عدد الأسطر التي يخفيها. والضغط عليه يعرضها كلها. ويعرض `expandAll` كل الأسطر؛ وتكشفها `expand` و`expandAll()` و`collapseAll()` الخاصة بالمرجع وتطويها من التطبيق.

يرسم `renderSeparator` الفواصل بطريقة التطبيق. ويُعطى الفاصل (`DiffSeparator`): `gap`، وهو فهرس المقطع المطوي (0 قبل أول تغيير، و`i` بين التغييرين `i - 1` و`i`)، و`lines`، وهو عدد الأسطر التي يخفيها، و`first` و`last`، وللرقعة `header` الخاص بالمقطع. ويعرض `expand(gap, direction, lines)` `"all"` أسطره (الافتراضي)، أو `lines` (الافتراضي 20) `"up"`، فوق التغيير الواقع تحت الفاصل مباشرة، أو `"down"`، تحت التغيير الواقع فوقه مباشرة. يتوسّع الفاصل الأول للأعلى والأخير للأسفل.

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## الإبقاء على التغييرات والتراجع عنها

يضع `renderHunkActions` إجراءات التطبيق في أعلى يمين كل تغيير ظاهر، ويُعطى التغيير (`DiffHunk`: `index`، `oldStart`، `oldLines`، `newStart`، `newLines`، وتبدأ الأسطر من 0، و`file`، وهو فهرس ملفه في الرقعة). وتستدعي هذه الإجراءات المرجع: يعيد `revertHunk(index)` الأسطر القديمة للتغيير إلى النص الجديد، ويجعل `acceptHunk(index)` أسطره الجديدة هي أسطر النص القديم. يعرض العرض النتيجة فورًا ويبلّغ عن النصين معًا بـ`onChange({ change })` (`{ oldValue, newValue }`)، ويضبطهما التطبيق بوصفهما props. مراجعة تعديلات الذكاء الاصطناعي بالإبقاء عليها أو التراجع عنها تغييرًا بتغيير تبدو هكذا:

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

هنا النص القديم هو الملف كما هو: الإبقاء على تغيير يطبّقه على الملف (`onApply`)، والتراجع عنه يزيله من الاقتراح. أما العرض الذي يعرض `patch` فيعرض مقتطفات من الملفات، وتبقى تغييراته كما هي.

<a id="methods"></a>

## الدوال

يوفّر `ref={diff}` دوال العرض (`DiffViewRef`). الدوال التي تُرجع قيمة (`hunks()`، `stats()`) تُرجع `Promise` للقيمة في JS، لذا استخدم `await` معها: `const changes = await diff.hunks()`. وبالنسبة إلى الأعداد المعروضة على الشاشة، يبلّغ `onStatsChange` عنها كلما تغيّرت. وأي دالة تُعطى تغييرًا أو فاصلًا أو ملفًا لا يوجد في diff لا تغيّر شيئًا وتسجّل تحذيرًا يسمّي الدالة والقيمة.

| الدالة | الوصف |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: التغييرات بالترتيب. |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`، والأسطر المضافة والمحذوفة وعدد التغييرات. |
| `goToHunk(index)` | يمرّر التغيير `index` إلى مجال الرؤية، بحيث يكون صفه الأول في الأعلى. |
| `revertHunk(index)` | يعيد الأسطر القديمة للتغيير `index` إلى النص الجديد ويبلّغ عن النصين (`onChange`). |
| `acceptHunk(index)` | يجعل الأسطر الجديدة للتغيير `index` هي أسطر النص القديم ويبلّغ عن النصين (`onChange`). |
| `expand(gap, direction?, lines?)` | يعرض الأسطر التي يخفيها الفاصل `gap`: `"all"` (الافتراضي)، أو `lines` (الافتراضي 20) `"up"` أو `"down"`. |
| `expandAll()` | يعرض كل سطر غير متغيّر. |
| `collapseAll()` | يطوي الأسطر غير المتغيّرة مجددًا. |
| `nextHunk()` | `Promise<number \| null>`: يمرّر التغيير التالي إلى الأعلى ويعطي فهرسه (بعد الأخير يعود إلى الأول). |
| `previousHunk()` | `Promise<number \| null>`: يمرّر التغيير السابق إلى الأعلى ويعطي فهرسه (قبل الأول يعود إلى الأخير). |
| `currentHunk()` | `Promise<number \| null>`: التغيير الذي انتُقل إليه آخرًا ما دام العرض باقيًا عنده، وإلا فالتغيير الموجود أعلى العرض أو أول تغيير ظاهر. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: الأسطر المحددة على أرقام الأسطر. |
| `setSelectedLines(range)` | يحدد أسطرًا من أحد الجانبين (`null`: لا شيء)، دون `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>`: نص الأسطر المحددة. |
| `files()` | `Promise<DiffFile[]>`: ملفات الرقعة بالترتيب مع أعدادها (لا شيء في حالة نصين). |
| `scrollToFile(path)` | يمرّر ترويسة الملف عند `path` إلى الأعلى. |
| `collapseFile(path)` | يعرض ترويسة الملف عند `path` فقط. |
| `expandFile(path)` | يعرض أسطر الملف عند `path` مجددًا. |
| `toggleFile(path)` | يطوي الملف عند `path`، أو يوسّعه إذا كان مطويًا. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: موضع كل تغيير في الصفوف بالترتيب ([مسطرة النظرة العامة](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: مدى تمرّر الصفوف (`x` يساوي 0). |
| `setScrollOffset(offset)` | يمرّر الصفوف إلى `offset.y` فورًا، بقدر ما تسمح به، كما يتبع المقبض المؤشر الذي يسحبه. |

يكمل `nextHunk()` و`previousHunk()` من التغيير الذي انتقلا إليه ما دام العرض باقيًا عنده، وإلا فمن أعلى العرض، لذا يظل التغيير القريب من النهاية الذي لا يمكن تمريره إلى الأعلى محسوبًا. أزرار التغيير التالي والسابق، مع الأعداد من `onStatsChange`:

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## مسطرة النظرة العامة

يبلّغ `onScroll({ offset, contentSize, size })` عن موضع الصفوف، بمفاتيح [`Scroll`](./scroll.md) نفسها: `offset.y`، وهو مدى تمرّرها (تتمرّر الصفوف عموديًا بعرض العرض، وتتمرّر الجوانب أفقيًا بمفردها: `offset.x` يساوي 0)، و`contentSize`، وهو حجم كل الصفوف معًا، و`size`، وهو حجم منفذ العرض. يُستدعى مرة بعد تخطيط العرض ثم كلما تغيّر أحدها: عند تمرّر الصفوف، وعند تغيّر حجم العرض، وعند تغيّر ارتفاع الصفوف (نصوص أخرى، `layout`، `softWrap`، أو توسيع ملف أو فاصل أو طيّه، أو تخطيط تعليق توضيحي). يعطي `hunkBounds()` موضع كل تغيير في الصفوف (`DiffHunkBounds`: `{ index, bounds }`، و`bounds` من أعلى صفه الأول إلى أسفل صفه الأخير، مع التعليقات التوضيحية تحتها، عبر العرض)، أي التغييرات الظاهرة: ولا صفوف لتغييرات الملف المطوي. ويعطي `onHunkBoundsChange({ hunkBounds })` القائمة نفسها بعد تخطيط العرض ثم كلما تحرّك تغيير أو تغيّر حجمه، حتى لو حافظت الصفوف على ارتفاعها (سطر متغيّر يصبح سطرًا آخر): وترسم المسطرة علاماتها منها بدلًا من قراءتها على `onScroll`. ويقرأ `scrollOffset()` مدى تمرّر الصفوف، ويمرّر `setScrollOffset({ x, y })` الصفوف إلى `y` فورًا، فيتبع المقبض المسحوب المؤشر في الإطار نفسه.

تُكوّن هذه معًا مسطرة نظرة عامة بجوار العرض، كما في محررات الشيفرة: علامة لكل تغيير، ومقبضًا فوق الصفوف الظاهرة، وضغطة أو سحبة تمرّر إلى هناك. هنا المسطرة بارتفاع العرض نفسه:

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

يأتي `index` العلامة من التغيير في `hunks()`، وبـ`oldLines` و`newLines` فيه يُميَّز التغيير المضاف (بلا أسطر قديمة) عن المحذوف (بلا أسطر جديدة) لتلوين علامته.

<a id="review-comments"></a>

## تعليقات المراجعة

تحدد أرقام الأسطر أسطرًا من أحد الجانبين: الضغط يحدد سطرًا واحدًا، والضغط مع Shift يمدّ التحديد إليه، وسحب الفأرة فوق الأرقام يحدد ما يمرّ عليه. ويبلّغ `onLineSelectionChange` عن الأسطر بوصفها `range` (`DiffLineRange`: `{ side, start, end }`، وتبدأ الأسطر من 0، و`null` لعدم وجود تحديد)، ويبلّغ الضغط على رقم أيضًا عن `onLineNumberPress({ line })` (`{ side, line }`). ويقرأ المرجع التحديد (`selectedLines()`، `selectedText()`) ويضبطه.

يضع `annotations` محتوى التطبيق تحت الأسطر: يرسم `renderAnnotation` كل `{ id, side, line }` على امتداد جانب سطره (العرض كله في العرض الموحّد)، بالارتفاع الذي يُخطَّط به، ويظهر ما دام سطره ظاهرًا. و`renderAddAnnotation` هو عنصر التحكم الذي يوفّره التطبيق لإضافة واحد، عند يمين هامش السطر الذي يمرّ عليه المؤشر وآخر سطر محدد؛ ويُعطى الأسطر المحددة عندما يكون سطره أحدها، وإلا فذلك السطر.

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## تنسيق الأجزاء

`class` و`style` ينسّقان صندوق العرض. `classes` يقبل فئات Tailwind حسب الجزء، و`styles` يقبل أنماطًا مضمّنة حسب الجزء؛ فئات الجزء تأتي بعد أنماطه الافتراضية، لذا تتغلب عليها، وأنماطه `styles` تتغلب على فئاته. يُضبط الخط عبر `fontFamily` و`fontSize` و`lineHeight`.

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| الجزء | ما هو | الافتراضي |
|---|---|---|
| `side` | كل جانب (split) أو العمود الواحد (unified) | خط `border` بين الجانبين |
| `gutter` | أرقام أسطر الجانب ومؤشراته | |
| `lineNumber` | كل رقم سطر | محاذاة لليمين، `muted-foreground` |
| `lineNumberAdded` | أرقام الأسطر المضافة، بعد `lineNumber` | |
| `lineNumberDeleted` | أرقام الأسطر المحذوفة، بعد `lineNumber` | |
| `content` | نص الجانب، بجوار هامشه | 8pt قبل النص وبعده |
| `line` | كل صف في الجانب | |
| `lineAdded` | صفوف الأسطر المضافة، بعد `line` | تظليل أخضر |
| `lineDeleted` | صفوف الأسطر المحذوفة، بعد `line` | تظليل أحمر |
| `filler` | النصف الفارغ من الصف المقسوم بجوار سطر يفتقر إليه الجانب الآخر | تعبئة `muted` خافتة |
| `wordAdded` | الكلمات المتغيرة داخل سطر مضاف | أخضر أقوى |
| `wordDeleted` | الكلمات المتغيرة داخل سطر محذوف | أحمر أقوى |
| `indicatorAdded` | شريط السطر المضاف (`"bars"`) أو `+` (`"classic"`) | أخضر، بعرض 3pt |
| `indicatorDeleted` | شريط السطر المحذوف أو `−` | أحمر، بعرض 3pt |
| `separator` | فاصل الأسطر المطوية، أو ترويسة hunk في patch | `⋯` والعدد على `muted` |
| `hunkActions` | صندوق إجراءات التطبيق على تغيير | في أعلى يمين التغيير |
| `lineSelected` | فوق صفوف الأسطر المحددة في جانبها | لون التحديد في السمة (كتحديدات `Editor`) |
| `annotation` | صندوق التعليق التوضيحي، تحت سطره | بعرض جانب سطره |
| `addAnnotation` | صندوق عنصر الإضافة، بعرض الهامش وارتفاع سطر واحد | عنصر التحكم عند يمينه |
| `fileHeader` | ترويسة ملف في patch | المسار والأعداد على `secondary`، وخط `border` أسفلها |

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | النص القديم. |
| `newValue` | `.new_value(..)` | `string` | | النص الجديد. |
| `patch` | `.patch(..)` | `string` | | diff موحّد لملف واحد أو عدة ملفات، يُعرض عندما لا يُضبط `oldValue` و`newValue`. |
| `language` | `.language(..)` | `string` | نص عادي (في patch: لغة كل ملف) | اسم لغة أو اسمها المستعار أو امتدادها أو اسم ملف. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | جنبًا إلى جنب أو عمود واحد. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | ما يُميَّز داخل الأسطر المتغيرة. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | كيف تُعلَّم الأسطر المتغيرة بجوار أرقامها. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | الأسطر غير المتغيرة المعروضة حول كل تغيير. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | تظهر كل الأسطر غير المتغيرة. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | أرقام الأسطر. |
| `background` | `.background(..)` | `boolean` | `true` | تُظلَّل الأسطر المتغيرة. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` السمة | خط النص. |
| `fontSize` | `.font_size(..)` | `number` | `13` | حجم الخط بالنقاط. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | ارتفاع الصف بالنقاط. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | يرسم فواصل الأسطر المطوية. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | إجراءات التطبيق على كل تغيير. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | تلتف الأسطر الطويلة عند عرض الجانب. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | محتوى التطبيق تحت الأسطر: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | يرسم تعليقًا توضيحيًا تحت سطره. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | عنصر التحكم الخاص بالتطبيق لإضافة تعليق توضيحي، بجوار السطر الذي يحوم عليه المؤشر وآخر سطر محدد. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | يرسم ترويسة كل ملف في patch، بارتفاع صف واحد. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | فئات Tailwind حسب الجزء. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | أنماط مضمّنة حسب الجزء، تتغلب على الفئات. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | | صندوق العرض. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | تم الاحتفاظ بتغيير أو التراجع عنه: `{ change }`، والنصوص الحالية (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | تم الضغط على رقم سطر: `{ line }`، وهو `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | تغيرت الأسطر المحددة: `{ range }`، وهو `{ side, start, end }` أو `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | تغيرت الأعداد: `{ stats }`، وهو `{ added, deleted, hunks }`. يُطلق مرة عند إنشاء العرض ومرة أخرى كلما قورنت النصوص فنتجت أعداد أخرى، لعرض سطر مثل "+8 −8 · 5 changes". |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | طُوي ملف من patch أو وُسّع (ترويسته، أو المرجع ref): `{ file }`، و`DiffFile` الآن. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | تم تمرير الصفوف، أو تغير حجمها أو حجم منطقة العرض: `{ offset, contentSize, size }`، كما في `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` في Rust). يُطلق عند اكتمال تخطيط العرض ومرة أخرى عند تغير أحدها. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | تغير موضع التغييرات بين الصفوف: `{ hunkBounds }`، وهي القائمة التي يعطيها `hunkBounds()`. يُطلق عند اكتمال تخطيط العرض ومرة أخرى عند انتقال تغيير أو تغير حجمه، سواء بقي ارتفاع الصفوف كما هو أم لا، وذلك لعلامات مسطرة النظرة العامة. |

<a id="related"></a>

## ذات صلة

- [Editor](./editor.md): محرر الشيفرة الذي يستخدم `DiffView` ألوان الصياغة ولغاته.
- [TextView](./text-view.md): مستندات Markdown وHTML، للنص المحيط بالمراجعة.
- [`nsh/base`](../modules/nsh-base.md): المكونات الأساسية الأخرى.
