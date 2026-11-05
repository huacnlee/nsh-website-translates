---
title: "If / Each"
description: "التحكم في التدفق: يعرض If فرعًا بحسب شرط معيّن، بينما يعرض Each صفًا ذا مفتاح لكل عنصر في قائمة، وذلك في Rust وTSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` و`Each` يحددان أي العناصر موجودة: المحتوى الشرطي والمتكرر. لا ينشئان أي عنصر عرض أصلي (native view) خاص بهما.
يحدّث العارض الأصلي ما تغيّر فقط: `If` يبدّل الفرع عند تغيّر حالة الشرط، و`Each` يضيف الصفوف وينقلها ويزيلها
بحسب المفتاح بدلاً من إعادة بناء القائمة. في Rust توجد `when(..)` و`each(..)` و`dynamic(..)` في
`nsh_core::prelude`؛ وفي TSX توجد `<If>` و`<Each>`، وهما متغيرات عامة لا تحتاج إلى استيراد.

```rust tabs
use nsh_core::prelude::*;

view()
    .child(
        when(move || user.with(|u| u.is_some()), move || {
            text(move || format!("Hello, {}", user.with(|u| u.as_ref().map(|u| u.name.clone()).unwrap_or_default())))
        })
        .otherwise(|| text("Signed out")),
    )
    .child(each(todos, |t: &Todo| t.id, |todo, _index| text(move || todo.get().title)))
```

```tsx tabs
<View>
  <If when={user()} else={<Text>Signed out</Text>}>
    {(u) => <Text>Hello, {u().name}</Text>}
  </If>
  <Each of={todos()}>{(todo) => <Text>{todo().title}</Text>}</Each>
</View>
```

في TSX هما عامّان (أي ارتباط بالاسم نفسه في النطاق يحل محلهما). داخل تعابير JSX ما زال بإمكانك استخدام
JavaScript العادي (`cond ? a : b`، `items.map(…)`)، وفي Rust `dynamic(move || ..)`: هذه تعيد إنشاء عناصرها
في كل مرة يتغيّر فيها ما تقرؤه، بينما `If` و`Each` (`when` و`each` في Rust) تحتفظ بالعناصر التي تبقى.

## If

يعرض فرعه ما دام الشرط متحققاً، وإلا يعرض الفرع الآخر (أو لا شيء).

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | الشرط: قيمة أو signal أو closure في Rust؛ وفي TSX تُقيَّم قيمته من حيث الصدق (truthiness). |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | يُعرض ما دام `when` غير متحقق. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | يُعرض ما دام `when` متحققاً. في TSX تتلقى الدالة accessor لقيمة `when`. |

يُنشأ الفرع عندما يتحول الشرط إليه، ويُزال ما أنشأه عندما يتحول الشرط عنه. أما `when` في TSX الذي ينتقل من
قيمة صادقة إلى أخرى (مثل `user()` حين يتغير من كائن إلى آخر) فيحتفظ بالفرع، وتتحدّث التعابير داخله
من تلقاء نفسها.

```rust tabs
let loading = signal(true);

when(move || !loading.get(), || profile())
    .otherwise(|| text("Loading…").text_color(rgb(0x6e7781)))
```

```tsx tabs
const loading = signal(true);

<If when={!loading()} else={<Text style={{ color: "#6e7781" }}>Loading…</Text>}>
  <Profile />
</If>;
```

في TSX تقرأ الدالة الابن القيمة التي أعطاها `when`، دون `null` أو `undefined` في نوعها، ولذلك لا يحتاج الفرع إلى
`!`. وفي Rust يقرأ الفرع الـ signal نفسه، أو يحوّل `dynamic` القيمة إلى عناصر:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

يعرض صفاً لكل عنصر في القائمة.

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | العناصر: في Rust `Vec` أو signal له أو closure يعيده. `null` و`undefined` لا يعرضان شيئاً. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | هوية العنصر. الافتراضي في TSX: العنصر نفسه (الكائنات بحسب الهوية، والقيم الأولية بحسب القيمة). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | يعرض صفاً واحداً. |

تتلقى دالة الصف **accessors** وليس قيماً: استدعِ `item()` و`index()` في TSX، و`item.get()` و`index.get()` في
Rust (كلاهما `ReadSignal`). عند تغيّر العناصر، تُحفظ الصفوف التي ما زال مفتاحها موجوداً (وتُنقل إذا تغيّر
موضعها)؛ ويتحدّث عنصرها وفهرسها، ولا يُعاد تشغيل سوى التعابير التي تقرؤهما. المفاتيح الجديدة تحصل على صفوف جديدة؛ والصفوف
التي اختفى مفتاحها تُزال.

```rust tabs
#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    title: String,
    done: bool,
}

let todos = signal(Vec::<Todo>::new());

each(todos, |t: &Todo| t.id, |todo, index| {
    view()
        .flex_row()
        .gap_2()
        .child(text(move || format!("{}.", index.get() + 1)))
        .child(
            text(move || todo.get().title)
                .style_when(move || todo.get().done, |s| s.line_through()),
        )
})
```

```tsx tabs
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

<Each of={todos()} key={(t: Todo) => t.id}>
  {(todo, index) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text>{index() + 1}.</Text>
      <Text style={{ textDecorationLine: todo().done ? "line-through" : "none" }}>{todo().title}</Text>
    </View>
  )}
</Each>;
```

<a id="choosing-a-key"></a>

### اختيار المفتاح

- العناصر التي تُستبدل بكائنات جديدة في كل تحديث (التحديثات غير القابلة للتعديل، `{ ...t, done: true }`) تحتاج إلى `key`، وعادةً ما يكون معرّفاً (id).
  بدونه يصبح كل كائن جديد صفاً جديداً وتُنشأ عناصره من جديد. أما في Rust فيلزم دائماً مفتاح.
- في TSX تعمل مصفوفات النصوص أو الأرقام دون مفتاح: تُقارن بحسب القيمة.
- لكل صف مالكه (owner) الخاص: الـ effects وعمليات التنظيف (cleanups) المنشأة في صف تنتهي عند إزالته.

> [!NOTE]
> `Each` و`each` عامّان (generic): يستنتج TypeScript نوع العنصر من `of`، وRust من العناصر، لذا يكون `todo()` الخاص بالصف
> والمعامل `key` مُنوَّعين دون تعليقات توضيحية.

<a id="each-or-a-list"></a>

## Each أم list

`Each` ينشئ كل الصفوف. هذا مناسب لعشرات أو بضع مئات من العناصر، في view أو [scroll view](./scroll.md).
للبيانات الطويلة أو غير المحدودة استخدم [list](./list.md): فهو ينشئ الصفوف القريبة من منطقة العرض ويعيد تدويرها.

راجع [JSX والمكوّنات](../docs/jsx-and-components.md) و[التفاعلية](../docs/reactivity.md) لمعرفة كيفية
تحديث التعابير.
