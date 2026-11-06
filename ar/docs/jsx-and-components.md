---
title: "JSX والمكوّنات"
description: "كيف يصف NSH واجهة المستخدم في Rust وفي TSX - العناصر والمكوّنات والخصائص (props) والعناصر الفرعية (children) وتدفق التحكم (control flow) والمراجع (refs) والتوزيع (spreads) - وكيف يُنتج مُصرِّف JSX ومُنشئات (builders) Rust العناصر الأصلية نفسها."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX والمكوّنات

تصف تطبيقات NSH واجهتها بالعناصر (elements) والمكوّنات (components)، سواء في Rust أو في TSX. تبني Rust العناصر بدوال وبطرق بناء (builder) مُنمَّطة (`view().gap_4().child(..)`)، بينما يكتبها TSX بصيغة JSX التي يحوّلها مترجم NSH إلى استدعاءات مباشرة للمُصيِّر الأصلي نفسه، دون React ودون DOM افتراضي. وفي الحالتين، المكوّن دالة تعمل مرة واحدة لبناء جزئها من الشجرة. أما ما يُبقي الواجهة محدّثة بعد ذلك فهو [التفاعلية](./reactivity.md): تُتتبَّع الارتباطات (bindings) التي تقرأ الإشارات (signals) بشكل أصلي، وهي وحدها التي تُعاد.

<a id="elements"></a>

## العناصر

كل **عنصر مضيف** (host element) مدعوم بعرض أصلي (native view). تُنشئها Rust بدوال من prelude، ويستوردها TSX من `nsh` بوصفها مكوّنات، ولا يوجد سوى `If` و`Each` كعناصر عامة (globals) لا تحتاج إلى استيراد:

| Rust | TSX | العرض الأصلي | الصفحة |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: صندوق للتخطيط والتنسيق واللمسات | [View](../elements/view.md) |
| `text(..)` | `<Text>` | عرض نص أصلي؛ عناصر النص المتداخلة تكون spans | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | عرض صورة (أصول محلية وعناوين URL) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | قائمة افتراضية (virtualized) تعيد تدوير عناصرها | [List](../elements/list.md) |
| `canvas(..)`، `web_view(url)`، `video(url)` | `<Canvas>`، `<WebView>`، `<Video>` | رسم، وصفحة ويب، ومشغّل فيديو | [Elements](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` من `nsh/base` | طبقة معروضة | [Elements](../elements/index.md) |
| `when(..)`، `each(..)` | `<If>`، `<Each>` | تحكم في التدفق، دون عرض خاص به | [Control flow](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

في Rust، الأنماط (styles) طرق مُنمَّطة بأسماء تطابق أدوات Tailwind (`.px_4()`، `.rounded_lg()`، `.bg(..)`)، والمستمعات (listeners) طرق أيضًا (`.on_press(..)`)، وللإعدادات الخاصة بمنصة معيّنة طرقها الخاصة. أما في TSX فتحتفظ الخصائص (props) بأسمائها بصيغة camelCase (`onPress`، `allowFontScaling`، `backgroundColor`)؛ ويقبل كل عنصر `style` و`class` / `classList` ([Tailwind](./tailwind.md)) و`ref` ومعالجات اللمس وخصائص إمكانية الوصول (accessibility) و`testID`، وتوضع الخصائص الخاصة بمنصة معيّنة في `ios={{…}}` و`android={{…}}`، حيث يُرسَل كائن المنصة الحالية فقط:

```rust tabs
view()
    .rounded(px(12.0))
    .bg(move || theme().background)
    .on_press(move || open.set(true))
    .child(text("Open").font_weight(FontWeight::SEMIBOLD))
```

```tsx tabs
<View android={{ elevation: 4, ripple: { color: "#0001" } }} style={{ borderRadius: 12 }} onPress={() => open.set(true)}>
  <Text style={{ fontWeight: "600" }}>Open</Text>
</View>
```

وسوم TSX مكتوبة بصيغة PascalCase ليتحقق TypeScript من كل وسم مقابل الربط (binding) الذي يسمّيه: فالوسم بأحرف صغيرة يُفحص مقابل نوع عام واحد لكل اسم، ولذلك لن يتمكن مكوّن عام (generic) مثل `List` أو `Each` من استنتاج نوع صفوفه من `each` / `of`، ولن تكون مكوّنات التطبيق نفسه مُنمَّطة إطلاقًا. والاستيرادات لا تكلّف شيئًا وقت التشغيل: يتعرّف المترجم على العناصر الأساسية (primitives) من خلال استيراداتها (بما في ذلك الأسماء المستعارة)، وينشئ العنصر الأصلي في مكانه، فيصبح `<View>` استدعاءً مباشرًا للمُصيِّر، ويُحذف الاستيراد من الحزمة (bundle). أما الوسم بأحرف صغيرة فهو خطأ في البناء، وتبيّن رسالته ما يجب كتابته:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> لا يُعرض النص إلا داخل عنصر نص: `text(..)` في Rust، و`<Text>` في TSX. أما السلسلة النصية الموضوعة مباشرة داخل `<View>` فلا تنشئ عرضًا أصليًا ولا تظهر.

<a id="components"></a>

## المكوّنات

شكل التطبيق شأنٌ خاص به. توفّر NSH طبقتين: العناصر الأساسية (العناصر أعلاه، والأنماط، وفئات Tailwind)، والمكوّنات الأساسية غير المنسّقة في [`nsh/base`](../modules/nsh-base.md) (`nsh_base` في Rust)، وهي التي تتولى السلوك مثل التنقل، والحوارات، ولوحة المفاتيح، وشريط الحالة، والمناطق الآمنة. أما الطبقة الثالثة، مكتبة المكوّنات، فهي لك: الأزرار والبطاقات وكل جزء آخر من واجهتك مكوّنات تكتبها فوق هاتين الطبقتين، في crate تطبيقك ([Building with Rust](./rust.md)) أو في TSX، أو مكتبة من المجتمع ([الطبقات الثلاث](./architecture.md#three-layers)).

مكوّن Rust هو `#[component] fn` يأخذ بنية خصائصه (props struct) (وعندما تكون له أحداث، يأخذ `Scope` لإطلاقها) ويعيد عناصره. ويُنشئ `#[component]` أيضًا الدالة المُنشِئة (constructor) للمكوّن، وهي باسم الدالة بصيغة snake case: يوضع `Badge` باستخدام `badge()`، كما يضع `view()` عرضًا، مع دالة تعيين (setter) لكل خاصية (`.label(..)`، `.color(..)`: قيمة أو signal أو closure). ومكوّن TSX دالة تأخذ كائن خصائص وتعيد JSX:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct BadgeProps {
    /// The text.
    pub label: Prop<SharedString>,
    /// The background (light blue when left out).
    #[prop(default = Hsla::from(rgb(0xddf4ff)))]
    pub color: Prop<Hsla>,
}

/// A small rounded label.
#[component]
pub fn Badge(props: BadgeProps) -> impl IntoElement {
    view()
        .rounded_full()
        .px(px(10.0))
        .py_1()
        .bg(move || props.color.get())
        .child(text(props.label).text_size(px(13.0)).font_weight(FontWeight::SEMIBOLD))
}

// Placed in another component's view:
badge()
    .label(move || format!("{} new", unread.get()))
    .color(rgb(0xfff8c5))
```

```tsx tabs
function Badge(props: { label: string; color?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: props.color ?? "#ddf4ff" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" }}>{props.label}</Text>
    </View>
  );
}

<Badge label={`${unread()} new`} color="#fff8c5" />
```

تعمل الدالة **مرة واحدة** عند إنشاء المكوّن، ولا تتتبّع ما تقرأه: فلا توجد إعادة تصيير (re-rendering). فالشيفرة في جسمها (إنشاء signals، وبدء effects، وحساب الثوابت) تعمل مرة واحدة. أما العناصر التي تعيدها فتبقى مرتبطة بالخصائص والـ signals التي تقرأها، فيحدّث `Badge` أعلاه نصه كلما تغيّر `unread`، دون أن يعمل `Badge` من جديد.

اكتب `#[component]` عندما تكون للواجهة خصائص أو أحداث خاصة بها، أو عندما يستورده مدخل TSX: يُسجَّل مكوّن Rust تحت نوعه (`registry.register::<Badge>()`)، بخصائص مُنمَّطة من البنية ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). أما قطعة الواجهة التي تستعملها Rust وحدها، فتكفي دالة عادية تعيد `impl IntoElement`، وتكون معاملاتها هي الخصائص. وفي TSX، يجوز أن يعيد المكوّن عنصرًا، أو سلسلة نصية أو رقمًا، أو مصفوفة، أو `null`، أو دالة تعيد أيًّا من هذه (يتتبعها المُصيِّر)؛ ويصف النوع `Component<P>` من `nsh` واحدًا منها:

```rust tabs
fn row(title: impl Into<SharedString>, content: impl IntoElement) -> impl IntoElement {
    view()
        .flex_row()
        .gap_2()
        .child(text(title.into()))
        .child(content)
}
```

```tsx tabs
import type { Component, JSX } from "nsh";
import { Text, View } from "nsh";

const Row: Component<{ title: string; children?: JSX.Element }> = (props) => (
  <View style={{ flexDirection: "row", gap: 8 }}>
    <Text>{props.title}</Text>
    {props.children}
  </View>
);
```

<a id="what-runs-again"></a>

### ما الذي يُعاد تشغيله

القيمة المعطاة لعنصر تُعيَّن مرة واحدة؛ أما الارتباط (binding) فيتتبّع ما يقرؤه. في Rust يكون الارتباط closure (أو signal أو memo أو خاصية) يوضع حيث تذهب القيمة. وفي TSX يقرّر المترجم ذلك لكل تعبير في JSX: يتغيّر التعبير عندما **يستدعي دالة أو يقرأ خاصية** (خارج الدوال المتداخلة)، وكل ما عدا ذلك يُعيَّن مرة واحدة:

```rust tabs
text(move || format!("{}", count.get()))     // follows count
text(props.title)                            // follows the prop
text(label.clone())                          // a plain value: set once
view().opacity(move || if busy.get() { 0.5_f32 } else { 1.0 })   // follows busy
```

```tsx tabs
<Text>{count()}</Text>              // follows count
<Text>{props.title}</Text>          // follows the prop
<Text>{user.name}</Text>            // re-read when something it depends on changes
<Text>{label}</Text>                // a plain variable: set once
<View style={{ opacity: busy() ? 0.5 : 1 }} />   // the style object is rebuilt when busy changes
```

الخاصية أو العنصر الفرعي المتغيّر هو effect أصلي صغير يعيّن تلك الخاصية وحدها أو يستبدل ذلك العنصر الفرعي وحده. وتُقارَن الأنماط (diff) في Rust، فالنمط الذي يتغيّر لا يرسل إلا الخصائص التي تغيّرت.

معالجات الأحداث تُعيَّن مرة واحدة: closure في Rust، ودالة أو اسم في TSX (`onPress={() => …}`، `onPress={save}`). وفي TSX تُتتبَّع التعبيرات الأخرى (`onPress={props.onPress}` يتتبّع الخاصية).

<a id="props"></a>

### الخصائص (Props)

خصائص مكوّن Rust هي حقول بنية `#[derive(Props)]`، وكل منها `Prop<T>`: قيمة، أو ارتباط مرّره المكوّن الأب. اقرأ الخاصية داخل ارتباط (`text(props.title)`، `move || props.title.get()`) لتتبّعها؛ أما `props.title.get()` في الجسم فيقرؤها مرة واحدة. الحقول التي عليها `#[prop(default)]` أو `#[prop(default = …)]`، وكذلك `Option`، اختيارية. تبدأ الدالة المُنشِئة كل خاصية بقيمتها الافتراضية، ويستدعي الأب دوال التعيين للخصائص التي يحتاجها: `badge().label("New")`.

الخاصية في TSX التي تُعطى تعبيرًا متغيّرًا تُمرَّر على شكل getter: قراءة `props.title` تستدعيه، وهذا ما يتيح لـ JSX الذي يقرؤه أن يتتبّعه. أما الخصائص الثابتة فقيم عادية. وفي الحالتين، تُقرأ الخصائص في المكان الذي تُستخدم فيه:

```rust tabs
// Wrong: reads the prop once, when the component runs.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    let content = props.text.get();
    text(content)
}

// Right: binds the text to the prop.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    text(props.text)
}
```

```tsx tabs
// Wrong: reads the prop once, when the component runs.
function Title(props: { text: string }) {
  const { text } = props;
  return <Text>{text}</Text>;
}

// Right: reads it in JSX, which follows it.
function Title(props: { text: string }) {
  return <Text>{props.text}</Text>;
}
```

ومكوّن TSX الذي يفكّك خصائصه في المعامل، `function Title({ text }: …)`، يقرؤها بالطريقة نفسها مرة واحدة، ويحذّر البناء من ذلك مع ذكر الخصائص التي ينبغي قراءتها بدلًا منها:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

الخاصية التي يريدها المكوّن مرة واحدة فقط، مثل معرّف (id) يبدأ به، تُقرأ في الجسم (`props.id.get_untracked()`، `const { id } = props;`)، فيكون ذلك صريحًا.

وفي TSX ينطبق الأمر نفسه على القيم الافتراضية: اكتب `props.color ?? "#ddf4ff"` في JSX بدلًا من التفكيك مع قيمة افتراضية. ولحساب شيء انطلاقًا من الخصائص، استخدم closure أو [`computed`](./reactivity.md#computed):

```rust tabs
#[component]
fn Price(props: PriceProps) -> impl IntoElement {
    let formatted = move || format!("${:.2}", props.cents.get() as f64 / 100.0);
    text(formatted)
}
```

```tsx tabs
function Price(props: { cents: number }) {
  const formatted = () => `$${(props.cents / 100).toFixed(2)}`;
  return <Text>{formatted()}</Text>;
}
```

<a id="children"></a>

### العناصر الفرعية (Children)

ما يضعه الأب داخل مكوّن يصل إليه بوصفه عناصره الفرعية: حقل `children: Prop<Children>` في Rust، يملؤه الأب بـ `.child(..)`؛ و`props.children` في TSX، وهو getter يبني تلك العناصر عند قراءته:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct CardProps {
    /// The title.
    pub title: Prop<SharedString>,
    /// The content.
    pub children: Prop<Children>,
}

#[component]
pub fn Card(props: CardProps) -> impl IntoElement {
    view()
        .p(px(14.0))
        .rounded(px(12.0))
        .bg(move || theme().background)
        .gap_2()
        .child(text(props.title).font_weight(FontWeight::SEMIBOLD))
        .child(props.children)
}

card()
    .title("Account")
    .child(text(move || format!("Signed in as {}", user.get().name)))
```

```tsx tabs
function Card(props: { title: string; children?: JSX.Element }) {
  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#ffffff", gap: 8 }}>
      <Text style={{ fontWeight: "600" }}>{props.title}</Text>
      {props.children}
    </View>
  );
}

<Card title="Account">
  <Text>Signed in as {user().name}</Text>
</Card>
```

في TSX، كل قراءة لـ `props.children` تبني العناصر الفرعية من جديد (عروض أصلية جديدة): لذا اقرأها مرة واحدة، في المكان الذي توضع فيه العناصر الفرعية. ومن بين عدة عناصر فرعية، يصل العنصر المتغيّر (`<If>` أو `<Each>` أو `{cond() ? a : b}`) على شكل دالة، ويحدّث `{props.children}` ذلك العنصر وحده: فتحتفظ العناصر المجاورة بعروضها، ويحتفظ حقل الإدخال بنصه وتركيزه. وتجمع الأجزاء (Fragments) (`<>…</>`) العناصر دون عرض.

ويمكن أيضًا بناء العناصر الفرعية بدالة يستدعيها المكوّن مع معاملات، أي دالة استدعاء للتصيير (render callback):

```rust tabs
fn repeat<E: IntoElement>(times: usize, row: impl Fn(usize) -> E) -> impl IntoElement {
    view().child((0..times).map(row))
}

repeat(3, |i| text(format!("Row {i}")))
```

```tsx tabs
function Repeat(props: { times: number; children: (i: number) => JSX.Element }) {
  return <View>{Array.from({ length: props.times }, (_, i) => props.children(i))}</View>;
}

<Repeat times={3}>{(i) => <Text>Row {i}</Text>}</Repeat>
```

<a id="control-flow"></a>

## التحكم في التدفق

`when` و`each` في Rust، و`<If>` و`<Each>` في TSX، هي أدوات تحكم في التدفق مضمّنة. ولا تُصيّر أي عرض خاص بها.

```rust tabs
when(move || user.get().is_some(), move || {
    text(move || format!("Hello, {}", user.get().map(|u| u.name).unwrap_or_default()))
})
.otherwise(|| text("Signed out"))

each(todos, |todo| todo.id, |todo, index| {
    text(move || format!("{}. {}", index.get() + 1, todo.get().title))
})
```

```tsx tabs
<If when={user()} else={<Text>Signed out</Text>}>
  {(u) => <Text>Hello, {u().name}</Text>}
</If>

<Each of={todos()} key={(t) => t.id}>
  {(todo, index) => (
    <Text>
      {index() + 1}. {todo().title}
    </Text>
  )}
</Each>
```

- **`when`** / **`<If>`** يعرض فرعه ما دام الشرط متحققًا، وإلا عرض فرع `otherwise` / `else`. ولا يُعيد تصيير فرع إلا عندما يتغيّر كون الشرط متحققًا أم لا، وليس في كل مرة يُعاد فيها تقييم الشرط. وفي TSX، تحصل الدالة الفرعية على accessor لقيمة `when`، منمَّط بدون `null` و`undefined`: `u()` هو المستخدم ما دام الفرع معروضًا، ويتتبّعه عندما يتغيّر.
- **`each`** / **`<Each>`** يصيّر صفًا لكل عنصر، تبنيه دالة الصف الخاصة به. تُحفظ الصفوف بحسب المفتاح (Rust: دالة المفتاح؛ TSX: `key`، وهو افتراضيًا العنصر نفسه، فالكائنات بالهوية والقيم الأولية بالقيمة): وعندما تتغيّر القائمة، تُنقل الصفوف المحفوظة بدل إعادة بنائها، ولا تُنشأ صفوف جديدة إلا للمفاتيح الجديدة. تستقبل دالة الصف **signals** للعنصر وفهرسه (`todo.get()` و`index.get()` في Rust، و`todo()` و`index()` في TSX)، لأن عنصر الصف المحفوظ وموضعه قد يتغيّران. وفي TSX، يُبقي `key="index"` (أو `key={(item, i) => i}`) الصفوف بحسب الموضع بدلًا من ذلك: فالقائمة من السلاسل النصية التي تتغيّر في مكانها، مثل نص يصل تدفقًا، تحتفظ بصفوفها ولا يتغيّر فيها إلا `item()`.

الاختيار الذي يتم داخل closure (`dynamic(move || if busy.get() { … } else { … })` في Rust، أو عامل ثلاثي أو `&&` في TSX) يبني فرعه من جديد في كل مرة يتغيّر فيها أي شيء يقرؤه. فضّل `when` / `<If>` عندما يتجاوز الفرع بضعة عناصر.

للقوائم الطويلة أو اللانهائية، استخدم [`List`](./lists.md) (`virtual_list` في Rust): فهو ينشئ عروضًا للصفوف الظاهرة على الشاشة فقط ويعيد تدويرها. انظر [التحكم في التدفق](../elements/control-flow.md) للتفاصيل.

<a id="refs"></a>

## المراجع (Refs)

يسمّي الـ ref عنصرًا مضيفًا من أجل الاستدعاءات الأمرية (imperative): `focus()`، `blur()`، `scroll_to()` / `scrollTo()`، `scroll_to_index()` / `scrollToIndex()`، `measure()` ([مكان العرض](./touch-and-gestures.md#where-a-view-is-measure))، ... في Rust، ينشئ `element_ref()` واحدًا ويضعه `.element_ref(&handle)` على عنصر؛ وفي TSX، يعطيك `ref` الـ ref الخاص بالعنصر، ونوعه هو نوع العنصر نفسه (`InputRef` هنا، و`ViewRef` لـ `View`؛ انظر [دوال ref](../elements/index.md#ref-methods)):

```rust tabs
fn search() -> impl IntoElement {
    let field = element_ref();
    view()
        .child(input().element_ref(&field).placeholder("Search"))
        .child(text("Focus").on_press(move || field.focus()))
}
```

```tsx tabs
import type { InputRef } from "nsh";
import { Text, View } from "nsh";
import { Input } from "nsh/base";

function Search() {
  let input: InputRef | undefined;
  return (
    <View>
      <Input ref={input} placeholder="Search" />
      <View onPress={() => input?.focus()}>
        <Text>Focus</Text>
      </View>
    </View>
  );
}
```

الـ ref في Rust مقبض (handle) من نوع `Copy`؛ تذهب استدعاءاته إلى العنصر الذي يحمله، ولا تفعل شيئًا بعد زوال مالكه. وفي TSX، يستقبل ما يسمّيه `ref={…}` العقدة:

- المتغيّر المُعلَن بـ `let` تُسنَد إليه؛
- الحقل (`ref={refs.input}`، `ref={refs[name]}`) تُسنَد إليه؛
- الـ [signal](./reactivity.md) تُعيَّن إليه، فيتتبّعها ما يقرأ الـ signal؛
- الدالة تُستدعى بها (`<Scroll ref={(node) => (scroller = node)} />`).

يحمل `const` أو الاستيراد signal أو دالة، كما في `const input = signal<InputRef>()` مع `<Input ref={input} />` و`input()?.focus()`؛ وأي شيء آخر يُبلَّغ عنه عند إنشاء العنصر، مع بيان ما يجب كتابته.

يُعيَّن الـ ref عند إنشاء العنصر، قبل أن يعيد المكوّن قيمته، فيكون متاحًا في [effects](./reactivity.md#effect) ومعالجات الأحداث. وتُرسَل الاستدعاءات إلى العرض بالترتيب مع التغييرات التي حدثت قبلها. وتقبل المكوّنات الأساسية ومكوّنات Rust في crate تطبيقك `ref` أيضًا (في Rust `component_ref()`، يوضع على العنصر بـ `.component_ref(&r)`: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## تمرير الخصائص بالنشر (Spreading)

في Rust، يستدعي الأب دوال التعيين للخصائص التي يحتاجها وتحتفظ البقية بقيمها الافتراضية، ويمرّر المغلِّف (wrapper) `Prop` الخاصة به كما هي (`card().title(props.title)`): فيظل `Prop` يتتبّع ما أُعطيه.

وفي TSX، انشر كائن خصائص على عنصر أو مكوّن باستخدام `{...props}`. تبقى الـ getters كما هي، فتظل الخصائص المنشورة تتتبّع ما تقرؤه. ولأخذ بعض الخصائص لنفسك وتمرير الباقي، استخدم `split`:

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function Field(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} {...rest} />
    </View>
  );
}

<Field label="Email" value={email()} onChange={({ value }) => email.set(value)} keyboardType="email-address" />
```

يعيد `split(props, keys)` القيمة `[picked, rest]`، وكلاهما لا يزال يقرأ عبر الخصائص الأصلية (أما تفكيك `{ label, ...rest } = props` فكان سيقرأ كل خاصية مرة واحدة). وخصائص العنصر التي تأتي لاحقًا في JSX تتغلّب على السابقة لها.

لا يقبل `<If>` و`<Each>` خصائص منشورة، ولا يُدعم نشر العناصر الفرعية (`{...items}`): استخدم `<Each>` أو تعبير مصفوفة.

<a id="tags-and-names"></a>

## الوسوم والأسماء

عنصر Rust هو أي شيء تستدعيه الشيفرة: دالة عنصر أساسي، أو الدالة المُنشِئة لمكوّن (`badge()`، `nsh_base::button()`)، أو دالة من كتابتك. ووسم TSX يسمّي ربطًا (binding) موجودًا في النطاق، كالمعتاد: `<Badge />`، `<Theme.Provider>`، أو `<Button>` من كتابتك. والوسم الذي لا يسمّي شيئًا في النطاق خطأ في البناء، باستثناء `<If>` و`<Each>` فهما عنصران عامان.

```rust tabs
/// The app's button: a press target styled by the app.
fn primary_button(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_5()
        .py_3()
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text(title).text_base().font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

primary_button("Save", save)
```

```tsx tabs
import { Text, View } from "nsh";

function Button(props: { title: string; onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} role="button" class="rounded-lg bg-blue-600 px-5 py-3">
      <Text class="text-base font-semibold text-white">{props.title}</Text>
    </View>
  );
}

<Button title="Save" onPress={save} />
```

إن `Button` الخاص بـ `nsh_base` (`button()` في Rust، و`<Button>` من `nsh/base`) هو هدف الضغط غير المنسّق، مع حالتي التعطيل والتحديد وما يخصهما من إمكانية الوصول؛ ويمنحه التطبيق مظهره: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

وفي TSX، تتغلّب ارتباطاتك على العناصر العامة: فمكوّن باسم `Each` في النطاق يجعل `<Each>` ذلك المكوّن. ويُتعرَّف على العنصر الأساسي من خلال استيراده، فيجعل `import { View as Box } from "nsh"` العنصر `<Box>` عرضًا، أما مكوّن من كتابتك باسم `Text` فهو مجرد مكوّنك. والعناصر الأساسية مكوّنات حقيقية أيضًا: `const Tag = inline ? Text : View;` ثم `<Tag>…</Tag>` يعمل.

تُنمَّط المكوّنات بتصريحاتها الخاصة: يفحص المترجم بنى خصائص Rust، ويفحص TypeScript خصائص مكوّن TSX أينما استُخدم، دون أي شيء يلزم توليده. ويحصل مكوّن Rust الذي يستورده مدخل TSX على تصريحات TypeScript تُولَّد من بنيته.

<a id="mounting-and-the-root"></a>

## التركيب (Mounting) والجذر

جذر تطبيق Rust هو المكوّن الذي يسمّيه `"root"` الخاص بـ `nsh.json`؛ ويركّبه `nsh run` و`nsh package`. ويستدعي مدخل TSX الدالة `mount(App)` لتصيير المكوّن الجذر (`mount(App, props)` يمرّر له الخصائص). ويملأ العرض الجذر السطح (النافذة، أو العرض الذي يضمّن التطبيق فيه NSH). أعطِ الجذر `flex: 1` ليملأ الشاشة، ولونَ خلفية: فخلفية السطح نفسه تعتمد على المنصة.

```rust tabs
// nsh.json: { "rust": ".", "root": "App" }
#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(home())
}
```

```tsx tabs
mount(() => (
  <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <App />
  </View>
));
```
<a id="related"></a>

## ذات صلة

- [Reactivity](./reactivity.md): الإشارات (signals) والتأثيرات (effects) والسياق (context).
- [Elements](../elements/index.md): جميع عناصر المضيف (host elements) وخصائصها (props).
- [Styling](./styling.md) و[Tailwind](./tailwind.md): مظهر مكوّناتك.
- [Building with Rust](./rust.md): تطبيقات Rust، والمكوّنات في الحزمة (crate) الخاصة بتطبيقك، وTSX فوقها.
