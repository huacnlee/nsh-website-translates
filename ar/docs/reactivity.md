---
title: "التفاعلية"
description: "الإشارات (Signals) والقيم المحسوبة (computed) والتأثيرات (effects) والموارد (resources) وbatch وuntracked والتنظيف (cleanup) والسياق (context) في Rust وTSX - كيف يحدّث NSH ما تغيّر بالضبط فقط، والأخطاء التي يجب تجنّبها."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# التفاعلية

يحدّث NSH واجهة المستخدم عبر **الإشارات (signals)**: قيم تعرف من يقرؤها. عندما تتغير إشارة، يعيد NSH تشغيل الحسابات التي قرأتها بالضبط (نص، أو نمط، أو تأثير) ولا شيء غير ذلك. لا تُعاد معالجة المكونات. النموذج مأخوذ من Solid، أما الرسم التفاعلي نفسه فهو أصلي (native): تعمل مكونات Rust وTSX على الرسم نفسه المكتوب بلغة Rust، وهكذا يجري الجدولة وتتبع الاعتماديات والتنظيف خارج المفسّر حتى في TSX.

تأخذ مكونات Rust كل ما في هذه الصفحة من prelude، بينما يستورده TSX من `nsh`:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## الإشارات

`signal(value)` تنشئ إشارة. اقرأها باستخدام `get()` في Rust، أو باستدعائها في TSX؛ و`set` و`update` تكتبانها:

```rust tabs
let count = signal(0);

count.get();                    // 0, and tracks the read
count.set(5);
count.update(|n| *n += 1);      // 6
```

```tsx tabs
const count = signal(0);

count();                     // 0, and tracks the read
count.set(5);
count.update((n) => n + 1);  // 6
```

القراءة داخل نطاق تتبّع (ربط، أو `computed`، أو `effect`) تشترك ذلك النطاق في الإشارة. والكتابة تُخطر المشتركين إذا تغيرت القيمة: تُقارَن بـ `PartialEq` في Rust، وبـ `===` في TSX.

```rust tabs
fn counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Tapped {} times", count.get())))
}
```

```tsx tabs
function Counter() {
  const count = signal(0);
  return (
    <View onPress={() => count.update((n) => n + 1)}>
      <Text>Tapped {count()} times</Text>
    </View>
  );
}
```

تؤدي النقرة إلى تحديث عقدة النص الوحيدة التي تقرأ `count`. أما `counter()` / `Counter` نفسها فتعمل مرة واحدة. الإشارة في Rust مقبض `Copy`، لذا تأخذها الإغلاقات (closures) باستخدام `move` وتستعملها بحرية.

يمكن للإشارة أن تعدّ كل كتابة تغييرًا، ويمكن لـ TSX مقارنة القيم بطريقته الخاصة:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

في TSX، تبدأ `signal<T>()` بلا قيمة بالقيمة `undefined` ويكون نوعها `Signal<T | undefined>`؛ وفي Rust، يقول `Option` الشيء نفسه (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### الكائنات والمصفوفات

في Rust، تغيّر `update` القيمة في مكانها وتُخطر القرّاء؛ بينما تستبدلها `set`. في TSX، تُقارَن الإشارات بـ `===`، لذا فالقيمة التي تُعدَّل في مكانها لا تُعدّ تغييرًا: اكتب كائنًا أو مصفوفة جديدة.

```rust tabs
let todos = signal(Vec::<Todo>::new());

todos.update(|list| list.push(Todo { id: 3, title: "New".into(), done: false }));   // notifies
todos.update(|list| {
    if let Some(todo) = list.iter_mut().find(|t| t.id == id) {
        todo.done = true;
    }
});
```

```tsx tabs
const todos = signal<Todo[]>([]);

todos.update((list) => [...list, { id: 3, title: "New" }]);                 // notifies
todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: true } : t)));

todos().push(item);    // does not notify anyone
todos.set(todos());    // still the same array: no change
```

`each` / `<Each>` تفهرس الصفوف بالعنصر، فتغيير عنصر واحد يعيد بناء صفه فقط ([JSX والمكونات](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` تشتق قيمة من إشارات أخرى. تشغّل `fn` وتحتفظ بالنتيجة وتعيد تشغيلها عند تغير إشارة قرأتها. قراءتها كقراءة إشارة:

```rust tabs
let price = signal(12);
let quantity = signal(2);
let total = computed(move || price.get() * quantity.get());

text(move || format!("Total: {}", total.get()))
```

```tsx tabs
const price = signal(12);
const quantity = signal(2);
const total = computed(() => price() * quantity());

<Text>Total: {total()}</Text>
```

استخدم `computed` عندما تُقرأ القيمة المشتقة في عدة أماكن أو تكون مكلفة: فهي تعمل مرة واحدة لكل تغيير مهما كان عدد قرّائها، ولا يُخطَر القرّاء إلا عندما تتغير نتيجتها. أما للقيمة الرخيصة التي تُقرأ مرة واحدة فيكفي إغلاق عادي:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

في TSX، تستقبل `fn` القيمة السابقة (`undefined` في المرة الأولى)، للقيم التي تتراكم:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` تشغّل `fn`، وتعيد تشغيلها كلما تغيرت إشارة قرأتها. التأثيرات مخصصة للآثار الجانبية: التسجيل (logging)، والمؤقتات، وطلبات الشبكة، والاستدعاءات الأمرية على [المراجع](./jsx-and-components.md#refs).

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// What to search for.
    pub query: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let results = signal(Vec::<SharedString>::new());
    effect(move || {
        let q = props.query.get();          // tracked: runs again when the prop changes
        if q.is_empty() {
            return;
        }
        spawn(async move {
            if let Ok(response) = fetch(format!("https://api.example.com/search?q={q}")).await {
                results.set(response.text().lines().map(|line| SharedString::from(line.to_owned())).collect());
            }
        });
    });
    view().child(each(results, |item| item.clone(), |item, _| text(item)))
}
```

```tsx tabs
function Search(props: { query: string }) {
  const results = signal<string[]>([]);
  effect(() => {
    const q = props.query;          // tracked: runs again when the prop changes
    if (!q) return;
    fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => results.set(data.items));
  });
  return <Each of={results()}>{(item) => <Text>{item()}</Text>}</Each>;
}
```

يتتبع التأثير القراءات التي تحدث أثناء تشغيله المتزامن. أما القراءات داخل مهمة، أو دالة `.then` أو بعد `await` فلا تُتتبَّع.

التأثير الذي يستدعي [مرجعًا](./jsx-and-components.md#refs) يعمل على العنصر الذي عليه المرجع؛ وفي TSX تعمل التأثيرات بعد وجود العناصر المنشأة في الدورة نفسها، فتكون المراجع قد ضُبطت:

```rust tabs
let input = element_ref();
effect(move || {
    if editing.get() {
        input.focus();
    }
});
```

```tsx tabs
let input: InputRef | undefined;
effect(() => {
  if (editing()) input?.focus();
});
```

> [!TIP]
> لا تستخدم التأثيرات لإبقاء إشارة متزامنة مع أخرى (`effect(() => b.set(a() * 2))`). استخدم `computed`: فهي لا تكون قديمة أبدًا ولا تسبب دورة ثانية. التأثير الذي يكتب إشارة يقرؤها أيضًا يعيد تشغيل نفسه مرارًا حتى يوقفه NSH بخطأ.

## resource

`resource(source, fetcher)` تحمّل قيمة بشكل غير متزامن وتحتفظ بحالة التحميل، فيعرض المكوّن البيانات أو مؤشر تحميل أو خطأ دون أن يديرها بنفسه:

```rust tabs
let url = signal(SharedString::from("https://api.example.com/quote"));
let quote = resource(move || Some(url.get()), |url, _info| async move {
    let response = fetch(url.to_string()).await?;
    if !response.ok() {
        return Err(format!("HTTP {}", response.status()));
    }
    Ok(response.text())
});

view()
    .child(text(move || match (quote.get(), quote.error()) {
        (_, Some(error)) => format!("Failed: {error}"),
        (Some(quote), None) => quote,
        (None, None) => "Loading…".to_owned(),
    }))
    .child(text("Reload").on_press(move || quote.refetch()))
```

```tsx tabs
import { List, resource, signal, Text } from "nsh";

type Post = { id: number; title: string };

const url = signal("https://jsonplaceholder.typicode.com/posts?_limit=20");
const posts = resource(url, async (u, { signal }) => {
  const response = await fetch(u, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Post[];
});

<If when={posts.error()}>
  <Text>Failed: {String(posts.error())}</Text>
</If>
<List
  each={posts() ?? []}
  refreshing={posts.state() === "refreshing"}
  onRefresh={posts.refetch}
>
  {(post) => <Text>{post().title}</Text>}
</List>
```

`source` متتبَّع: كلما أعطى قيمة جديدة، يحمّل `fetcher(value, info)` من جديد. في Rust هو إغلاق يعيد `Option`، و`None` لا تحمّل شيئًا؛ وفي TSX هو دالة وصول (إشارة، دالة) أو قيمة، و`undefined` أو `null` أو `false` لا تحمّل شيئًا: لمستخدم لم يسجّل الدخول بعد أو لم يُختَر شيء. وعند غياب المصدر، يمرر Rust القيمة `|| Some(())`، ويحمّل `resource(fetcher)` في TSX مرة واحدة عبر استدعاء `fetcher(info)`. تعيد دالة الجلب في Rust `Result`؛ أما في TSX فتعيد قيمة أو وعدًا (promise)، ويُعدّ الرمي (throw) فشلًا.

| Rust | TSX | ما هو |
|---|---|---|
| `quote.get()` | `posts()` | أحدث قيمة: لا شيء قبل انتهاء أول تحميل، وتبقى أثناء إعادة التحميل وبعد الفشل. |
| `quote.loading()` | `posts.loading()` | هل يجري تحميل. |
| `quote.error()` | `posts.error()` | خطأ آخر تحميل، ولا شيء بعد أن يعطي تحميل قيمة. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (لا شيء للتحميل)، `Pending` (التحميل الأول)، `Ready`، `Refreshing` (إعادة التحميل مع بقاء القيمة)، `Errored`. |
| `quote.refetch()` | `posts.refetch()` | يحمّل من جديد من المصدر نفسه: إعادة محاولة، أو السحب للتحديث. |
| `quote.mutate(value)` | `posts.mutate(value)` | يضبط القيمة هنا دون تحميل، وهو تحديث متفائل (optimistic)، ويمسح الخطأ. |

المورد (resource) في Rust مقبض `Copy` كالإشارات؛ وأعضاء TSX مربوطة، لذا تعمل `onRefresh={posts.refetch}` و`const loading = posts.loading` كما هي.

يُعتدّ بآخر تحميل فقط. التحميل الجديد يُسقط الجاري، وكذلك زوال المكوّن؛ وفي TSX، تُلغي `info.signal` الـ `fetch` الممرَّر إليها. التحميل الذي ينتهي بعد أن حلّ محله غيره لا يغيّر شيئًا. `info.refetching` تدل على أن `refetch()` بدأ التحميل. `resource_with_value(value, source, fetcher)` في Rust و`{ initialValue }` في TSX تمنحان المورد قيمة منذ البداية.

## cleanup

`cleanup(fn)` تسجّل `fn` لتعمل قبل إعادة تشغيل التأثير الحالي، أو عند زوال المكوّن أو التأثير الذي تنتمي إليه:

```rust tabs
effect(move || {
    if !running.get() {
        return;
    }
    let ticker = spawn(async move {
        loop {
            timer(Duration::from_millis(100)).await;
            tick();
        }
    });
    cleanup(move || ticker.cancel());   // before the next run, or on removal
});
```

```tsx tabs
function Clock() {
  const now = signal(Date.now());
  const id = setInterval(() => now.set(Date.now()), 1000);
  cleanup(() => clearInterval(id));       // when Clock is removed
  return <Text>{new Date(now()).toLocaleTimeString()}</Text>;
}

effect(() => {
  if (!running()) return;
  const id = setInterval(tick, 100);
  cleanup(() => clearInterval(id));       // before the next run, or on removal
});
```

في Rust، تنتهي المهام والمؤقتات والفواصل الزمنية (`spawn`، `set_timeout`، `set_interval`) مع المالك الذي أُنشئت تحته، فلا تحتاج ساعة العرض الخاصة إلى تنظيف:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

يمكن لتأثير TSX أيضًا أن يعيد دالة التنظيف الخاصة به، كما في React: الدالة التي تعيدها `fn` تعمل في اللحظات نفسها التي تعمل فيها الدالة التي تمررها إلى `cleanup`.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

يزول المكوّن عندما لا يعود معروضًا: يُخفى فرع `when` / `<If>` الخاص به، أو يُزال صف `each` / `<Each>` الخاص به، أو تُزال صفحته من المكدس (popped). وكل ما أنشأه (التأثيرات، والقيم المحسوبة، والمهام، وعمليات التنظيف، والمكونات المتداخلة) يُتخلَّص منه معه.

## batch

كل كتابة تُخطر مشتركيها فورًا. ولجعل عدة كتابات تُحسب تغييرًا واحدًا، غلّفها بـ `batch`: تعمل الاعتماديات مرة واحدة بعد آخر كتابة.

```rust tabs
let save = move || {
    batch(|| {
        first_name.set(form.first.clone());
        last_name.set(form.last.clone());
        dirty.set(false);
    })
};
```

```tsx tabs
const save = () =>
  batch(() => {
    firstName.set(form.first);
    lastName.set(form.last);
    dirty.set(false);
  });
```

معالجات الأحداث لا تُجمَّع تلقائيًا: كتابتان في معالج الضغط تشغّلان تأثيرًا يقرأ الإشارتين مرتين. تعيد `batch` ما تعيده دالتها.

## untracked

`untracked(fn)` تشغّل `fn` دون الاشتراك فيما تقرؤه. استخدمها داخل نطاق تتبّع لقراءة قيمة دون الاعتماد عليها:

```rust tabs
effect(move || {
    let q = query.get();                          // runs again when query changes
    let filters = untracked(|| active_filters.get());   // read, but not a reason to run again
    search(q, filters);
});
```

```tsx tabs
effect(() => {
  const q = query();                     // runs again when query changes
  const filters = untracked(activeFilters); // read, but not a reason to run again
  search(q, filters);
});
```

تقرأ `get_untracked()` في Rust إشارة واحدة بالطريقة نفسها. جسم المكوّن غير متتبَّع أصلًا: قراءة إشارة هناك تقرؤها مرة واحدة.

## context

السياق (context) قيمة يوفّرها مكوّن لكل ما يعرضه، مهما بلغ عمقه. في Rust، توفّر `provide_context(value)` قيمة من نوعها، وتجد `use_context::<T>()` أقرب قيمة؛ وفي TSX، تنشئ `context(defaultValue)` سياقًا، واستدعاؤه يقرأ أقرب قيمة موفَّرة (أو القيمة الافتراضية)، وتوفّر `<Ctx.Provider value>` قيمة:

```rust tabs
#[derive(Clone, Copy)]
struct Dark(bool);

fn label(content: &'static str) -> impl IntoElement {
    let dark = use_context::<Dark>().is_some_and(|d| d.0);
    text(content).text_color(if dark { rgb(0xffffff) } else { rgb(0x1f2328) })
}

fn screen() -> impl IntoElement {
    provide_context(Dark(true));
    view().child(label("Hello"))
}
```

```tsx tabs
const Theme = context<"light" | "dark">("light");

function Label(props: { children: string }) {
  const theme = Theme();
  return <Text style={{ color: theme === "dark" ? "#ffffff" : "#1f2328" }}>{props.children}</Text>;
}

mount(() => (
  <Theme.Provider value="dark">
    <Label>Hello</Label>
  </Theme.Provider>
));
```

القيمة الموفَّرة تُقرأ مرة واحدة، عند البحث عنها. ولتوفير شيء يتغير، وفّر إشارة (أو بنية struct من الإشارات) واقرأها في ربط:

```rust tabs
#[derive(Clone, Copy)]
struct Accent(Signal<Hsla>);

#[component]
fn App() -> impl IntoElement {
    provide_context(Accent(signal(rgb(0x0969da).into())));
    view().child(swatch())
}

fn swatch() -> impl IntoElement {
    let Accent(accent) = use_context::<Accent>().expect("an accent");
    view()
        .w(px(40.0))
        .h(px(40.0))
        .bg(move || accent.get())
        .on_press(move || accent.set(rgb(0x8250df).into()))
}
```

```tsx tabs
const Accent = context(signal("#0969da"));

function App() {
  const accent = signal("#0969da");
  return (
    <Accent.Provider value={accent}>
      <Swatch />
    </Accent.Provider>
  );
}

function Swatch() {
  const accent = Accent();
  return <View onPress={() => accent.set("#8250df")} style={{ width: 40, height: 40, backgroundColor: accent() }} />;
}
```

اقرأ السياق في جسم المكوّن (أو في شيفرة تعمل أثناء إنشاء المكونات)، لا في معالج حدث أو مؤقت، حيث لا يوجد مكوّن للبحث منه. تأخذ مكونات Rust سمة (theme) التطبيق بهذه الطريقة أيضًا: `theme()` من `nsh_base` ([السمة](./rust.md#theme)).

## Error boundaries

تحصر حدود الأخطاء (error boundary) الفشل في جزء واحد من العرض. عندما يرمي شيء تحتها (في Rust: panic) أثناء العرض أو التشغيل، مثل جسم مكوّن أو ربط أو تأثير أو معالج حدث، يُزال الجزء الفاشل وتعرض الحدود بديلها (fallback) مكانه؛ ويبقى بقية العرض كما هو. في Rust هي `catch_error(view, fallback)`؛ وفي TSX هي `<ErrorBoundary fallback>` من `nsh`. يتلقى البديل الخطأ (في TSX القيمة المرمية نفسها، وهي عادةً `Error`) ودالة إعادة ضبط (reset) تعرض العرض من جديد:

```rust tabs
fn profile_card(user: Signal<Option<User>>) -> impl IntoElement {
    catch_error(
        move || profile(user),
        |error, reset| {
            view()
                .child(text(format!("Something went wrong: {error}")))
                .child(text("Try again").on_press(move || reset.reset()))
        },
    )
}
```

```tsx tabs
import { ErrorBoundary, Text, View } from "nsh";

function ProfileCard(props: { user: User | undefined }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>Something went wrong: {error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Profile user={props.user} />
    </ErrorBoundary>
  );
}
```

يذهب الفشل إلى أقرب حدود فوق موضع حدوثه، ويذهب الفشل داخل البديل إلى الحدود التي فوقها. وبدون حدود، يُبلَّغ عن الفشل كخطأ غير ملتقَط (طبقة الأخطاء أثناء التطوير، والسجل). في TSX، يُعرض عنصر `fallback` كما هو (`fallback={<Text>Unavailable</Text>}`)، وتُستدعى الدالة مع الخطأ و`reset`، مهما كانت المعاملات التي تعلنها.

<a id="what-runs-and-when"></a>

## ما الذي يعمل، ومتى

| ما تكتبه | يعمل | يعمل من جديد عندما |
|---|---|---|
| جسم المكوّن | مرة واحدة، عند إنشائه | أبدًا (باستثناء إعادة التحميل الساخن) |
| ربط: إغلاق يُعطى إلى `text` أو نمط أو خاصية (prop) في Rust؛ `{expr}` أو `prop={expr}` يستدعي أو يقرأ خاصية في TSX | مرة واحدة، عند إنشاء العنصر | تتغير إشارة قرأها؛ تُحدَّث تلك الخاصية أو ذلك الابن فقط |
| `computed(fn)` | عند إنشائه | تتغير إشارة قرأها |
| `effect(fn)` | بعد وجود عناصر الدورة الحالية | تتغير إشارة قرأها |
| `when(cond, ..)` / `<If when>` | عند إنشائه | يتغير تحقق الشرط |
| صف `each(..)` / `<Each of>` | عند ظهور مفتاحه أول مرة | أبدًا؛ بل تتغير إشارتا عنصره وفهرسه |

البيئة تفاعلية بالطريقة نفسها: `window()` و`dark()` و`font_scale()` و`safe_area()` و`keyboard_height()` في Rust، و`windowSize()` و`colorScheme()` و`fontScale()` من [`nsh`](../modules/nsh.md#device) و`safeArea()` و`keyboardFrame()` من [`nsh`](../modules/nsh.md) في TSX، لذا فالربوط التي تقرؤها تتبع التدوير والوضع الداكن ولوحة المفاتيح.

<a id="common-mistakes"></a>

## أخطاء شائعة

**قراءة إشارة في جسم المكوّن وانتظار التحديثات.**

```rust tabs
fn bad() -> impl IntoElement {
    let n = count.get();                       // read once
    text(format!("{n}"))                       // never changes
}

fn good() -> impl IntoElement {
    text(move || format!("{}", count.get()))   // a binding: follows count
}
```

```tsx tabs
function Bad() {
  const n = count();           // read once
  return <Text>{n}</Text>;     // never changes
}

function Good() {
  return <Text>{count()}</Text>;
}
```

**قراءة الخصائص مرة واحدة.** خاصية Rust المقروءة بـ `props.title.get()` في الجسم تُقرأ مرة واحدة؛ اقرأها في ربط (`text(props.title)`، `move || props.title.get()`). وفي TSX، تقرأ `const { title } = props` قيمة `title` مرة واحدة: اقرأ `props.title` حيث تستخدمها، أو قسّم الخصائص باستخدام [`split`](./jsx-and-components.md#spreading-props).

**التعديل بدل الضبط، في TSX.** `list().push(x)` يغيّر المصفوفة لكنه لا يُخطر أحدًا. اكتب مصفوفة جديدة، كما تفعل `update` في Rust نيابةً عنك.

**اشتقاق الحالة بالتأثيرات.** `effect(() => total.set(price() * qty()))` تعمل، لكنها تترك `total` قديمة بين الكتابة والتأثير، وتكلّف دورة ثانية. استخدم `computed`.

**إنشاء التأثيرات خارج المكونات.** التأثيرات والقيم المحسوبة تنتمي إلى المكوّن الذي أنشأها ويُتخلَّص منها معه. وإذا أُنشئت في معالج حدث أو دالة مؤقت فلا مالك لها وتبقى إلى الأبد. أنشئها في جسم مكوّن ودعها تقرأ الإشارات التي تتغير.

**توقع تتبّع الشيفرة غير المتزامنة.** تُتتبَّع فقط القراءات التي تحدث بشكل متزامن أثناء تشغيل تأثير أو قيمة محسوبة. اقرأ الإشارات أولًا، ثم ابدأ العمل غير المتزامن.

<a id="related"></a>

## ذات صلة

- [JSX والمكونات](./jsx-and-components.md): المكونات والخصائص و`when` / `<If>` و`each` / `<Each>`، في Rust وTSX.
- [البناء باستخدام Rust](./rust.md): تطبيقات Rust والمهام والسمة.
- [مرجع وحدة `nsh`](../modules/nsh.md): توقيع كل دالة في TSX.
- [الحركة (Animation)](./animation.md): قيم متحركة تتحرك على خيط واجهة المستخدم دون إشارات.
