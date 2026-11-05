---
title: "أدلة البرمجة"
description: "قواعد الهندسة المعمارية والبرمجة لبناء تطبيقات ومكتبات مكونات Native Shell قابلة للصيانة، باستخدام Rust وTSX."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---

# أدلة البرمجة

يصف هذا الدليل معمارية التطبيق وأنماط الكود التي أثبتت متانتها في تطبيقات Native Shell. وهو موجَّه للمهندسين ولوكلاء البرمجة على حد سواء: مطوري تطبيقات NSH (وحدات TSX، ومكونات Rust، والتطبيقات الأصلية التي تضمّن NSH) ومؤلفي مكتبات المكونات المبنية على `nsh/base`. اقرأ أدلة التصميم أولًا: ينبغي أن يحافظ هيكل الكود على قصد المنتج لا أن يحل محله.

هذا دليل معياري. تشير **يجب (must)** إلى قيود دورة الحياة أو الصحة أو النظام البيئي، أما **ينبغي (should)** فهي المعمارية الافتراضية، ولا يجوز الخروج عنها إلا لسبب محدد. تبقى المصادر الحالية وصفحات المرجع والتصريحات في `.nsh/types` هي المرجع الحاكم للتواقيع الدقيقة.

<a id="make-the-common-path-inexpensive"></a>

## اجعل المسار الشائع قليل التكلفة

**مبدأ التصميم: اختر أنواع إطار العمل وملكيتها بحيث يكون الاستخدام العادي للمكونات قليل التكلفة افتراضيًا.** ينبغي أن يتمكن المطورون من بناء الواجهات وإعادة استخدامها دون إضافة ذاكرة تخزين مؤقت عند كل موضع استدعاء. من الأمثلة على ذلك المكونات التي تعمل مرة واحدة، و[signals](./reactivity.md) التي تُقرأ حيث تُستخدم: يبني المكوّن جزءه من الشجرة مرة واحدة، وبعد ذلك لا تعمل من جديد إلا الارتباطات التي قرأت signal تغيّرت قيمته، فيتجنب المسار الشائع العمل المتكرر. الرسم البياني التفاعلي والمُصيِّر والتخطيط والقوائم كلها أصلية، ودورة واحدة من كود التطبيق تتحول إلى دفعة واحدة من العمليات الأصلية. ومع ذلك تتضاعف التكاليف الصغيرة عبر العناصر والتحديثات، وبخاصة في TSX الذي يعمل كوده في مفسِّر؛ لذا قِس المسارات الساخنة الاستثنائية قبل إضافة ذاكرة تخزين مؤقت ([الأداء](./performance.md)). لا يَعِد أي من الخيارين بتكلفة صفرية. تشرح [قواعد ملكية الحالة](#state-ownership) وأقسام التصيير اللاحقة الآليات.

<a id="architecture-at-a-glance"></a>

## نظرة عامة على المعمارية

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

تتجه الاعتماديات نحو الأسفل. تملك الطبقات العليا المعنى الخاص بالمجال والتنسيق، بينما تملك الطبقات الدنيا العرض أو السلوك القابل لإعادة الاستخدام. لا تجعل مكونًا قابلًا لإعادة الاستخدام يعتمد على صفحة في التطبيق، ولا تجعل مكتبة مكونات تعتمد على سمة تخص تطبيقًا بعينه ([الطبقات الثلاث](./architecture.md#three-layers)).

استخدم هذه الحدود:

- **غلاف التطبيق (app shell):** يؤلّف المدخل (`App.tsx`، أو `nsh.json` `"root"`) الجذر ومكدسات التنقل مع إبقاء منطق الصفحات خارجه؛
- **الصفحة (page):** `NavPage` واحد مع محتواه وحواراته والعمل الذي يبدؤه؛
- **مكوّن التطبيق (app component):** نمط متكرر يدرك المجال؛
- **مكتبة المكونات (component library):** واجهة عامة الغرض ومنسَّقة الأسلوب، سواء كانت خاصة بالتطبيق أو من المجتمع، مبنية على `nsh/base`؛
- **`nsh/base`:** سلوك قابل لإعادة الاستخدام دون عرض خاص بالمنتج: التنقل والحوارات والنوافذ المنبثقة والقوائم والصفحات السفلية وهدف الضغط؛
- **`nsh`:** العناصر الأولية والأنماط والتخطيط والتفاعلية والبيئة.

<a id="lay-out-an-apps-files"></a>

### نظّم ملفات التطبيق

تتبع ملفات التطبيق اصطلاحات NSH، فلا حاجة إلى أي إعداد: `App.tsx` هو المدخل و`nsh.json` يجاوره، ويُعثر على كليهما بالاصطلاح.

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- يحتوي `pages/` على ملف واحد لكل `NavPage`. لا تتفرع الصفحة إلى ملفات أكثر إلا عند الحاجة.
- يحتوي `components/` على مكونات التطبيق القابلة لإعادة الاستخدام، أي التي تستخدمها عدة صفحات.
- يحتوي `store.ts` على حالة التطبيق: signals الخاصة به والدوال التي تغيّرها. تقرأ الصفحات الـ signals وتستدعي الدوال.
- الاختبارات هي ملفات `*.test.tsx` بجوار ما تختبره (`App.test.tsx`، `pages/Inbox.test.tsx`).
- `Cargo.toml` و`src/lib.rs` هما crate الخاص بالتطبيق، ويضم مكونات Rust الخاصة به (`nsh.json` `"rust": "."`)؛ ويحدد `#[native_module]` في `src/lib.rs` ما يستورده TSX. التطبيق المكتوب بـ Rust فقط هو مشروع Cargo نفسه، ومكوّنه الجذر في `src/lib.rs` ([بنية المشروع](./project-structure.md)).

يؤلّف غلاف التطبيق الصفحات لكنه يحتوي على قدر قليل من منطقها. تقرأ الصفحات signals الخاصة بالمخزن (store) وتستدعي دوالّه؛ ولا تكتب أبدًا في حالة صفحة أخرى. أبقِ signals المخزن خاصة وصدِّر ما يقرؤها ويغيّرها، لتبقى الحالة القابلة للتغيير خلف دوالّها العامة:

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

قد تحتفظ إحدى الصفحات بمساحة العمل وتمرر معرّفها إلى البحث؛ فالبحث لا يحتاج إلى مجموعة مساحة العمل بأكملها ولا إلى signals الخاصة بها. شكل الاعتماديات البسيط غير الدوري هو:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

يجوز للصفحات أن تعتمد على المخزن وعلى المكونات، لكن ليس على الغلاف ولا على الأجزاء الخاصة بصفحة أخرى. إذا كان لا بد لإحدى الصفحات من تغيير ما تعرضه صفحة أخرى، ففعل ذلك عبر المخزن. تتيح هذه الحدود لمهندسين مختلفين أو لوكلاء ذكاء اصطناعي العمل على صفحات منفصلة بالتوازي مع تعارضات ملفات أقل واقتران أقل في الحالة المشتركة؛ ومع ذلك يظل المخزن بحاجة إلى تنسيق.

<a id="bootstrap-and-root-ownership"></a>

## التهيئة وملكية الجذر

ركّب التطبيق مرة واحدة، وامنح الجذر السطح كاملًا: يستدعي مدخل TSX الدالة `mount(App)`، ويسمّي تطبيق Rust مكوّنه الجذر في `nsh.json` (`"root": "App"`). يملأ الجذر السطح باستخدام `flex: 1` وبخلفية من السمة:

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

ينسّق الجذر ما يخص السطح بأكمله: مكدس التنقل، والحوارات، والنوافذ المنبثقة، والقوائم، والصفحات السفلية، وتلميحات الأدوات المعروضة فوق كل ما فيه، والمنطقة الآمنة. لا تركّب جذرًا ثانيًا لكل صفحة داخل سطح واحد. السطح الواحد محرك واحد: كل `NshAppView` أو `NshView` أو `AppView` يضمّنه تطبيق أصلي يشغّل آلته الافتراضية (VM) الخاصة وحالة وحداته الخاصة ورسمه التفاعلي الخاص، فلا تتشارك الأسطح المتعددة في تطبيق مضيف واحد الحالة عن طريق الخطأ.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## افهم ما يعمل مرة واحدة وما يعمل من جديد

NSH حالة محتفَظ بها مع بناء تصريحي، على نموذج Solid ([التفاعلية](./reactivity.md)). يبقى الـ signal عبر التحديثات؛ أما جسم المكوّن فيصف جزءه من الشجرة مرة واحدة عند إنشائه. أبقِ هذا التمييز صريحًا:

| ما تكتبه | متى يعمل | متى يعمل من جديد |
| --- | --- | --- |
| جسم المكوّن | مرة واحدة عند إنشائه | أبدًا |
| ربط (binding): دالة إغلاق (Rust) أو تعبير يستدعي دالة أو يقرأ خاصية (TSX) في موضع القيمة | مرة واحدة | عند تغيّر signal قرأه؛ لا يتحدّث إلا ذلك الـ prop أو العنصر الابن |
| `computed(fn)` | عند إنشائه | عند تغيّر signal قرأه |
| `effect(fn)` | بعد أن توجد عناصر الجولة | عند تغيّر signal قرأه |
| صف في `each` / `<Each>` | عند ظهور مفتاحه أول مرة | أبدًا؛ تتغير signals الخاصة بعنصره وفهرسه |
| خلية في `virtual_list` / `<List>` | مرة واحدة لكل خلية | أبدًا؛ تُعطى الخلية صفوفًا أخرى |

- المكوّن الذي يعمل هو **المالك (owner)**: التأثيرات (effects) والقيم المحسوبة والمهام والمؤقتات وارتباطات المفاتيح وعمليات التنظيف التي تُنشأ أثناء عمله تعود إليه وتُتلف معه؛
- **السياق (context)** (`provide_context` / `use_context`، `context()` و`<Ctx.Provider>`) يعطي شجرة فرعية قيمةً دون أن يعني ذلك أن العناصر التي تقرؤها تملكها؛
- **`Scope`** الخاص بمكوّن Rust (`cx`) يُصدر أحداثه ويقرأ الهوامش (insets) المعطاة له؛
- **المراجع (refs)** (`element_ref()`، `ref`) تسمّي عنصرًا مضيفًا للاستدعاءات الأمرية (`focus()`، `scroll_to()`، `measure()`)؛
- التخطيط والقياس مرحلتان أصليتان لاحقتان؛ لا تستخدم `onLayout` و`measure()` إلا عندما تكون الهندسة المحلولة مطلوبة فعلًا.

لا تقرأ سياقًا أبدًا داخل معالج حدث أو مؤقت، إذ لا يوجد مكوّن للبحث منه: اقرأه في الجسم واحتفظ بما أعطاك. احتفظ بالمقابض المنمذجة (signals والموارد والمراجع ومعرّفات المجال)، وهي `Copy` في Rust وتتوقف عن أداء أي عمل بمجرد زوال مالكها.

<a id="choose-the-right-unit"></a>

## اختر الوحدة المناسبة

<a id="use-a-plain-function-for-value-like-elements"></a>

### استخدم دالة عادية للعناصر الشبيهة بالقيم

**اجعل الدالة العادية الخيار الافتراضي لقطع الواجهة الخفيفة القابلة لإعادة الاستخدام.** يوفّر المستدعي الـ props والمعالجات الحالية، وتُرجع الدالة عناصر، ولا يتبقى منها سوى الارتباطات التي أنشأتها. وسيطاتها هي props الخاصة بها؛ أما التسمية المعروضة والقيمة والاستدعاءات الراجعة فتأتي من حالة المستدعي الحالية. وهي تعمل مرة واحدة كأي مكوّن: ما يتغير بعد ذلك هو ارتباطاتها.

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### استخدم مكوّنًا للسلوك المحتفَظ به

استخدم `#[component]` (أو مكوّن TSX ينشئ signals) عندما تملك قطعة الواجهة حالة دائمة أو دورة حياة مستقلة: signals وتأثيرات وعملًا غير متزامن ومؤقتات وارتباطات مفاتيح. أنشئ تلك الحالة في جسم المكوّن، مرة واحدة، ولا تنشئها أبدًا داخل ارتباط.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

يملك `#[component]` props منمذجة (`#[derive(Props)]`) وأحداثًا (`#[derive(Event)]`)؛ ويستوردها TSX عبر تصريحات مولَّدة منها. الحالة المحتفَظ بها التي يستخدمها TSX مع `new` (دفتر حسابات أو محلل أو جلسة) هي `#[class]`، والدوال هي `#[module]` ([البناء باستخدام Rust](./rust.md#extending-a-rust-app-with-tsx)). اكتب بـ Rust الأجزاء التي يستخدمها التطبيق أكثر من غيرها، ومكتبات المكونات، والمنطق الكثيف، فهو كود أصلي من البداية إلى النهاية؛ واحتفظ بـ TSX لما يتغير كثيرًا أو يُسلَّم وقت التشغيل.

لا تحوّل كل جزء بصري إلى مكوّن. لحدود المكونات تكاليف في دورة الحياة والتنسيق؛ فاستخدمها حيث تهم الهوية المحتفَظ بها.

<a id="elements-views-and-behavior-systems-are-different"></a>

### العناصر والعروض وأنظمة السلوك أمور مختلفة

لا تُجبر كل مكوّن على قالب واحد. يضم النظام البيئي:

- عناصر دلالية مثل `Button` و`Switch` و`MenuItem`؛
- جذور سلوك مركّبة مثل `Dialog` و`Popover` و`Menu` و`ContextMenu` و`Sheet` و`NavStack`؛
- أنظمة ذات حالة مثل `Input` و`List` و`TextView` وحالة مكدس التنقل؛
- بنية تحتية مثل الطبقات العلوية (overlays) وتحديد مواضعها، والتمرير الافتراضي (virtualization)، والتمرير، والمناطق الآمنة، ولوحة المفاتيح، والحركة.

قد يكون العنصر معقدًا داخليًا ومع ذلك يبدو شبيهًا بالقيمة لمستدعيه. وقد يكشف نظام ذو حالة عن دوال تصيير ليملك التطبيق العرض دون إعادة تنفيذ السلوك. اختر الواجهة العامة انطلاقًا من السلوك، لا من عدد العروض الظاهرة في مخرجاته.

<a id="state-ownership"></a>

## ملكية الحالة

<a id="own-persistent-ui-text-with-103"></a>

### امتلك نص الواجهة الدائم باستخدام `SharedString`

**في Rust، يجب تفضيل `SharedString` لنص الواجهة المحتفَظ به عبر التحديثات أو دوال الاستدعاء الراجع**، بما في ذلك تسميات المكونات والعناوين والنصوص الإرشادية: تقبله الـ props (`Prop<SharedString>`)، ولا يؤدي استنساخه داخل ارتباط إلى نسخ النص. وللمخزن المؤقت القابل للتحرير أو للنص الذي يُجمَّع مع تنسيق، استخدم `String` وحوّل عند جاهزية النتيجة؛ وللوصول المؤقت للقراءة فقط أثناء استدعاء واحد، استخدم `&str`. في TSX، السلاسل النصية قيم يملكها التطبيق؛ فاحتفظ بالنص المحسوب من الحالة في `computed` أو في دالة إغلاق بدل إعادة بنائه في عدة أماكن.

بالنسبة إلى نص الاستجابة غير القابل للتغيير الذي ستحتفظ به الواجهة، أبقِ القيمة المستلَمة كما هي وضع نص العرض المشتق أو المنسَّق في قيمة مجال منفصلة بدل إعادة كتابة الاستجابة.

ضع كل حالة في أضيق مالك يمكنه إبقاؤها صحيحة:

- حالة المجال تنتمي إلى المخزن (`store.ts`) أو إلى crate التطبيق؛
- حالة العرض المؤقتة تنتمي إلى المكوّن الذي يعرضها، على هيئة signal؛
- الحالة السلوكية القابلة لإعادة الاستخدام تنتمي إلى المكوّن المصمَّم لها (`Menu` أو `Popover` بدون `open` يحتفظ بحالته الخاصة)؛
- الحالة التي تتشاركها شجرة فرعية هي signal يُوفَّر عبر [السياق](./reactivity.md#context)؛
- ما يبقى بعد انتهاء التشغيل ينتمي إلى [التخزين](../modules/nsh.md#storage) أو إلى خادم.

فضّل القيم المتحكَّم بها (controlled) في الاختيار والتبديل العاديين: مرّر القيمة الحالية إلى المكوّن، واستقبل التغيير المطلوب، وحدّث المالك، وستتبع الارتباطات. يبلّغ الاستدعاء الراجع عن النية؛ ولا ينبغي أن ينشئ مصدرًا ثانيًا خفيًا للحقيقة.

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

لا شيء يحتاج إلى إشعار: كتابة signal تحدّث بالضبط الارتباطات التي تقرؤه. يُصدر مكوّن Rust حدثًا دلاليًا ينبغي لمالكه معالجته باستخدام `cx.emit(..)`؛ ويتتبع التأثير signal ما دام مالكه حيًّا. اكتب عدة حقول تشكّل شرطًا ثابتًا واحدًا (invariant) داخل [`batch`](./reactivity.md#batch) واحد، لكي ترى التأثيرات والقيم المحسوبة الحقول معًا.

يتبع المكوّن المتحكَّم به الخاص بالتطبيق العقد نفسه. مثال: عنصر تحكم لزيادة الكمية ونقصانها، وهو عنصر تحكم خاص بالمجال يُكتب مرة واحدة بـ Rust ويوضع من Rust ومن TSX:

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

العقد نفسه في TSX، مكوّن في `components/`:

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### إبقاء روابط الملكية والاشتراكات محدودة

يملك المكوّن ما ينشئه، ويزول كل ما أنشأه بزواله: عندما يختفي فرع `<If>` الخاص به، أو تُزال صفوفه، أو تُسحب صفحته. في Rust، تنتهي المهام والمؤقتات والفواصل الزمنية (`spawn`، `set_timeout`، `set_interval`) وروابط المفاتيح (`on_key`) بانتهاء المالك الذي أُنشئت تحته. أما في TSX، فسجّل الإيقاف عبر [`cleanup`](./reactivity.md#cleanup) أو أعِده من الـ effect. الاستماع يتم عبر `on(event, listener)` (`host.on(name, listener)`، `BackHandler.on("press", listener)`)، وهي تعيد دالة توقفه (`() => void`، ومن Rust تعيد `Stop`). وما يُسجَّل أثناء رسم المكوّن يزول معه، كما هي حال روابط `keymap.bind`.

عندما يستمر شيء في العمل على نحو غير متوقع، فتحقق أولًا من الـ effects والقيم المحسوبة المنشأة خارج المكوّن (في معالج حدث أو دالة استدعاء لمؤقت، إذ لا مالك لها وتبقى حية إلى الأبد)، ومن المستمعين المسجَّلين دون إيقافهم، ومن العمل الذي بدأ من store لا يملكه أي مكوّن. أما تحميل `resource` الذي أُسقط فيُلغى (`info.signal` في TSX)، ولا يُبقي مكوّنه حيًا. هذه أماكن شائعة للبدء، وليست قائمة حصرية.

لا تكتب إلى signal لمجرد أن قيمة قُرئت أو اشتُقّت. تجنّب الكتابة غير المشروطة من ربط (binding) أو effect يقرأ الـ signal نفسه: فهو يعيد تشغيل نفسه إلى أن يوقفه NSH بخطأ. القيمة المحسوبة من حالة أخرى هي `computed`، وليست effect يكتب signal ثانيًا.

<a id="avoid-state-feedback-loops"></a>

### تجنّب حلقات التغذية الراجعة للحالة

لحقول إدخال النص والتحديد والمرشّحات والنوافذ المنبثقة المتحكَّم بها عادةً مساران: مالك خارجي يحدّث القيمة، وتفاعل المستخدم يطلب قيمة جديدة. لا ترسل قيمة وفّرها المالك عائدةً عبر دالة استدعاء المستخدم أثناء المزامنة. اقرأ القيمة الحالية للمالك دون تتبّع (untracked) عند معالجة فعل المستخدم (`props.value.get_untracked()` في Rust، كما سبق؛ ومعالج الأحداث في TSX غير متتبَّع أصلًا) وقارنها بالقيمة التالية، بحيث يُبلَّغ عن كل تغيير منطقي مرة واحدة. اجعل دوال الاستدعاء آمنة عند إعادة الدخول (re-entrancy) متى كان بإمكانها أن تغلق المكوّن الذي استدعاها أو تستبدله أو تحدّثه بشكل متزامن.

<a id="stable-identity"></a>

## الهوية المستقرة

المفتاح جزء من السلوك. فهو يمنح الصف أو الصفحة أو عنصر التحكم المتكرر هوية مستقرة، ويحدد أيّها يحتفظ بحالته وتركيزه وقياساته عند تغيّر البيانات.

- استخدم معرّفات نطاق (domain ids) مستقرة للصفوف والتبويبات والصفحات وعناصر التحكم المتكررة: `each(projects, |p| p.id, ..)`، `<Each of={projects()} key={(p) => p.id}>`، و`keyExtractor` الخاص بالقائمة.
- أضف إلى معرّفات الاختبار بادئة تسمية تخص الكائن المالك عندما يتكرر عنصر التحكم نفسه (`delete-${project.id}`).
- لا تشتق الهوية أبدًا من تسمية مترجمة أو من فهرس قائمة قابل للتغيير عندما يمكن إدراج العناصر أو إعادة ترتيبها.
- لا تولّد مفتاحًا أو معرّفًا عشوائيًا جديدًا أثناء الرسم.

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

تغيّر المفتاح يعني تغيّر هوية الواجهة. تعامل مع إعادة الضبط تلك بوصفها أمرًا مقصودًا.

وتنطبق القاعدة نفسها على مسارات التنقل ومفاتيح القوائم ومفاتيح التخزين ومعرّفات الاختبار. فالمسار الذي يبقى في `setRoutes` يحتفظ بصفحته وحالته؛ وإذا تشارك سلوكان محتفَظ بهما باستقلال المفتاح نفسه فقد يكتب كل منهما فوق حالة الآخر؛ وإذا غيّر سلوك ما مفتاحه في كل تحديث فلن يراكم حالة أبدًا.

<a id="rendering-and-composition"></a>

## الرسم والتركيب

أبقِ جسم المكوّن تصريحيًا: اقرأ الحالة الحالية، واشتق قيم العرض، وركّب العناصر. انقل عمليات النطاق والتحليل (parsing) والتعديلات غير البسيطة إلى دوال مسمّاة في الـ store أو في crate التطبيق.

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

استخرج دالة مساعدة عندما تسمّي منطقة ذات معنى وتقلّل مقدار الحالة التي يجب أن يحتفظ بها القارئ في ذهنه دفعة واحدة. واستخرج مكوّنًا جديدًا عندما يكون للمنطقة عقدها القابل لإعادة الاستخدام أو دورة حياتها المحتفَظ بها، وليس لمجرد أن سلسلة builder أو كتلة JSX طويلة.

استخدم دوال الأنماط المطبوعة (typed style methods) وبُناة (builders) المكوّنات باتساق في Rust، والـ classes في TSX. فضّل `.when(..)` / `.when_some(..)` (Rust) و`classList` (TSX) للتحسينات الشرطية الصغيرة؛ واستخدم `when` / `<If>` عندما تمثّل الفروع واجهات مختلفة جوهريًا، لأن عامل ternary داخل closure يبني فرعه من جديد كلما تغيّر أي شيء يقرؤه.

ركّب من المكوّن الدلالي القياسي قبل بناء سطح مخصص. لا تعِد إنتاج قائمة أو popover أو sheet أو حوار من عروض عامة لمجرد مطابقة لقطة شاشة واحدة: فـ`Menu` و`ContextMenu` و`Popover` و`Sheet` و`Tooltip` و`Dialog` من `nsh/base` تحافظ على التموضع، ونقل التركيز، والتنقل بلوحة المفاتيح، والتحديد، وحالة التعطيل، والإغلاق بـ Escape وبالرجوع، وعقد إمكانية الوصول. وإذا عجز المكوّن القياسي عن التعبير عن نمط صالح متكرر، فحسّن واجهته البرمجية الصريحة بدلًا من تنسيق عناصر فرعية عشوائية في كل موضع استدعاء.

يجب أن تكون دوال الرسم التي يوفرها كود التطبيق خالية من الآثار الجانبية. فقد يجري صف القائمة، أو `renderCodeBlock` الخاص بـ`TextView`، أو عناصر القائمة كلما احتاج مالكها إلى خلية أو جزء أو فتح. ويجب ألا تنفّذ عملية أعمال، أو تضيف بيانات، أو تبدأ اشتراكًا غير محدود.

<a id="behavior-and-presentation-boundary"></a>

## حدود السلوك والعرض

قاعدة Base الدائمة هي:

> يملك Base السلوك القابل لإعادة الاستخدام والبنية اللازمة لتنفيذه. وتملك طبقة العرض اللغة البصرية للمنتج.

"غير منسَّق" لا يعني "عرضًا واحدًا فارغًا". فتموضع الطبقات المتراكبة (overlay)، والتنقل بلوحة المفاتيح، والتحرير، والمحاكاة الافتراضية (virtualization)، والتنقل للخلف، والإغلاق، والمناطق الآمنة كلها تتطلب بنية داخلية وحالة. ونقل هذا العمل إلى كل مستدعٍ لن يخلق مرونة، بل سيكرر سلوكًا هشًا.

وعلى العكس، يجب ألا يختار Base ألوان العلامة التجارية، أو الخطوط، أو الكثافة، أو الأيقونات النهائية، أو أشكال المكوّنات (variants)، أو النصوص، أو تركيب التطبيق. اعرض التنسيق عبر `class` / `style` على الجزء الرئيسي، و`<part>Class` / `<part>Style` لكل جزء آخر، وأنماط الحالة المطبوعة (`active`، `hover`، `focus`، `selected`، `checked`، `disabled`)، والفتحات المسمّاة (`trigger`، `header`، `footer`) ودوال الرسم. لا تفحص عناصر فرعية عشوائية لاكتشاف العناوين أو الأوصاف أو أزرار الإغلاق: اجعل الأجزاء الدلالية صريحة، وخذ كل تسمية بوصفها prop أو عنصرًا فرعيًا.

<a id="theme-and-styling"></a>

## السمة والتنسيق

اقرأ القيم الدلالية من السمة (theme) وطبّق التخطيط بدوال الأنماط المطبوعة في Rust وبـ classes الخاصة بـ Tailwind في TSX ([Tailwind](./tailwind.md)، [رموز السمة](./tailwind.md#theme-tokens)):

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

القواعد:

- لا تثبّت في الكود ألوان المنتج أو أنصاف أقطار الزوايا أو المسافات أو هندسة عناصر التحكم؛
- يجب ألا يُدخل كود التطبيق قيم hex خامًا أو `rgb` / `rgba` أو `hsla`؛ اقرأ لونًا دلاليًا من `theme()` أو من class لرمز (`bg-primary`)، أو أضف الدور المفقود إلى ملف سمة التطبيق؛
- ينبغي أن يستخدم تخطيط التطبيق سلّمي المسافات والخطوط (`p-2`، `gap-3`، `w-64`، `text-sm`؛ `.p_2()`، `.gap_3()`، `.w_64()`، `.text_sm()`) بدلًا من القيم الاعتباطية (`p-[13px]`، `px(13.0)`)؛
- تعني الـ classes تمامًا ما تعنيه في Tailwind CSS v4، وتعني قيم الأنماط ما يعطيها إياه [مرجع الأنماط](../modules/style-reference.md) (قيم CSS بصيغها الأصلية: الأرقام نقاط)؛ وتحذير `unknown class` نتيجة يجب إصلاحها؛
- استخدم الرموز الدلالية للمعنى، لا موضع اللون في لوحة الألوان؛
- أبقِ الهندسة غير المرتبطة بالحالة في سلسلة الـ builder العادية أو في سلسلة الـ classes؛
- استخدم `active:` و`hover:` و`focus:` (`.active(..)`، `.hover(..)`، `.focus(..)`) لحالات التفاعل وقت التشغيل؛ فهي تُطبَّق أصليًا دون رحلة ذهاب وإياب إلى كود التطبيق؛
- استخدم أنماط الحالة الدلالية للمكوّن (`selected:`، `checked:`، `disabled:`) لمظهر الحالات المحدَّدة (checked) أو المختارة أو المضغوطة أو المعطَّلة؛
- أبقِ ملكية النافذة المنبثقة في حالة صريحة (`open` مع `onOpenChange`) بحيث يستطيع المشغِّل (trigger) عرض مظهر الفتح أو الضغط إلى أن يُغلق؛
- أبقِ أشكال المكوّن (variants) قليلة وذات معنى، بدلًا من إضافة شكل لكل موضع استدعاء؛
- اربط التنسيق الأساسي بإجراء الإقرار الافتراضي الفعلي لمنطقة القرار وبإجراء مفتاح الإدخال (return) فيها؛ ولا تشتقّه من عدد الإجراءات أو تكرارها أو موضعها في شريط الأدوات؛
- أبقِ أشكال badge وalert دلالية وشحيحة. تبقى البيانات الوصفية العادية محايدة؛ ولا تربط كل حالة enum أو كل قسم بلون مختلف لمجرد وجود شكل متاح.

الأسبقية الفعلية هي: نمط العنصر نفسه، ثم أنماط الحالة، وتفوز الحالات اللاحقة، مع `disabled` فوق الجميع. والطبقات اللاحقة تستبدل الحقول التي تحدّدها فقط.

فضّل الرموز الدلالية للسمة في العرض الجديد المملوك للتطبيق. كل اسم في ملف سمة التطبيق هو رمز (token)، كما هو متغيّر في `@theme` الخاص بـ Tailwind (يعطي `"up": "#16a34a"` الأسماء `text-up` و`bg-up/30` و`token("up")` في TSX و`theme().color("up")` في Rust)، وللسمة قيم فاتحة وداكنة، فيتبع الرمز المظهر دون class `dark:`. سمِّ الرموز بحسب الأدوار لا بحسب المكوّنات، حتى لا تصبح نقطة التمديد لكل عنصر واجهة.

غيّر السمة عبر ملف سمة التطبيق (`nsh.json` `"theme"`)، أو دع التطبيق المضيف يقدّم ملفه الخاص: فالـ classes التي تسمّي رموزًا وروابط Rust التي تقرأ `theme()` يُعاد تنسيقها أصليًا كلما تغيّرت، دون تشغيل أي JavaScript. أما الكود الذي ينسخ قيمة رمز إلى signal خاص به فيتوقف عن تتبّعه.

يحتاج حلقة التركيز الخارجية إلى مساحة فعلية. فأي عنصر سلف يستخدم `overflow: hidden` (`overflow-hidden`) سيقتطعها. فضّل التخطيطات التي تترك مساحة؛ وإذا اضطر المنتج إلى القص بشدة، فارسم حالة التركيز داخل عنصر التحكم بدلًا من إخفاء كل تركيز لوحة المفاتيح بصمت.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### حجم نص المستخدم هو تكبير التطبيق

يتبع النص حجم نص المستخدم (Dynamic Type، ومقياس الخط في Android، وإعدادات أنظمة سطح المكتب): `fontScale()` في TSX، و`font_scale()` في Rust، وكلاهما تفاعلي (reactive). يحدد سلّم الخطوط (`text-sm`، `text-base`: 16 نقطة، وهو حجم النص الأساسي) المرجع، ويقوم إعداد المستخدم بتكبيره أو تصغيره. وهذا يتبع عمدًا الجزء المفيد من نموذج Tailwind: درجات مسمّاة للخطوط والمسافات والأحجام بدلًا من ثوابت نقاط لا رابط بينها.

دع حاويات النص تنمو مع نصها: امنحها ارتفاعات دنيا وحشوات (padding) بدلًا من ارتفاعات ثابتة. وعلى المكوّن المخصص الذي يجمع نصًا قابلًا للتكبير مع هندسة ثابتة حوله أن يوثّق سبب عدم نمو ذلك الجزء.

اعتبر كل قيمة نقطية اعتباطية وكل دالة إنشاء لون خام في واجهة التطبيق نتيجة مراجعة يجب معالجتها. لا تقبلها إلا عند حدّ فيزيائي أو حدّ منصة موثّق، أو هندسة مقيسة وقت التشغيل، أو لون نقطي (raster) أو لون بيانات، أو تعريف السمة نفسه. فالملاءمة أو مطابقة لقطة شاشة ليستا استثناءين صالحين.

يجب أن يتضمن أي شيء مخزَّن مؤقتًا من تخطيط محلول مقياسَ الخط في مفتاح إبطاله، مباشرةً أو عبر مراجعة (revision) تتغير معه: ارتفاعات الصفوف التي أُبلغت بها القائمة، وقياسات النص، وهندسة النوافذ المنبثقة، وأحجام الأيقونات المشتقة من النص، ومقاييس canvas المخصصة.
<a id="events-commands-and-focus"></a>

## الأحداث والأوامر والتركيز

استخدم الضغطات للتفعيل: تعني `onPress` و`onLongPress` و`onPressDown` و`onPressUp` الشيء نفسه سواء كان الإدخال بإصبع أو قلم أو فأرة أو لوحة مفاتيح. استخدم معالجات اللمس والإيماءات فقط لما يتبع الإصبع (التحريك الجانبي pan، والسحب). استخدم اختصارات لوحة المفاتيح (`keymap.bind`، `on_key`) وعناصر القوائم للأوامر التي ينبغي أن تدعم ارتباطات المفاتيح أو القوائم أو الإرسال من عدة مدخلات. أبقِ المعالجات قريبة من الصفحة التي تملك الأمر.

عبّر عن كل أمر منطقي مرة واحدة. ينبغي أن يستدعي `Button` وعنصر `Menu` وعنصر `ContextMenu` وعنصر قائمة التطبيق من `nsh/desktop` واختصار لوحة المفاتيح الدالة نفسها في المخزن (store) بدلًا من نسخ خمس عمليات تعديل. اشتق التسمية والأيقونة والاختصار وحالة التعطيل من سياسة أمر واحدة حيثما أمكن (`key_label("mod+s")` يكتب الاختصار بالطريقة المعتمدة في المنصة)، حتى لا تتعارض نقاط الدخول فيما بينها. تملك القائمة التنقل والإغلاق، أما الصفحة فتبقى هي المسؤولة عن تحديد ما إذا كان الأمر مسموحًا وعمّا ينفذه.

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

حافظ على الأدوار الدلالية عند اختيار العنصر. استخدم `Button` للأوامر حتى عندما يكون المظهر المطلوب هادئًا؛ امنحه نمطًا هادئًا بدلًا من استبداله برابط. تحتفظ تطبيقات NSH بالدور `link` للوجهات التي تُفتح خارج التطبيق، مثل عنوان URL أو بريد إلكتروني؛ استخدم التنقل للوجهة داخل التطبيق، واستخدم `Button` للأمر.

أوقف الانتشار (`stopPropagation()` على حدث لمس) فقط عندما يجب على تفاعل متداخل أن يمنع عنصره الأب من معالجة اللمسة نفسها. إيقاف الانتشار بشكل شامل يعطّل التمرير والضغطات والإيماءات بطرق يصعب تشخيصها.

**لا ينتظر الخيط الرئيسي شيفرة التطبيق أبدًا.** عندما يحتاج النظام إلى إجابة فورية (هل يجوز إغلاق هذه الصفحة، وهل يجوز إغلاق هذه الورقة أو النافذة المنبثقة، وهل يجوز تغيير هذا النص)، يجيب NSH بشكل أصلي (native) اعتمادًا على props مُركّبة مسبقًا، ثم يخبر حدثٌ التطبيقَ بعد ذلك. لذا فالقرار هو prop يُضبط بمجرد معرفته، وليس callback يعيد true أو false: `popOnBack={!dirty()}` مع `onBackPress` للتأكيد ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback))، و`closeOnEscape` و`closeOnBackdropPress` مع `onCancel` لمعرفة المحاولة، و`maxLength` على حقل إدخال، و`disabled` على زر.

يربط `shortcut` (`nsh/desktop`) الخاص بعنصر القائمة مفتاحه ما دامت القائمة معيّنة، وتعرضه القائمة بنمط المنصة؛ وأي ربط `keymap` للضغطة نفسها له الأسبقية عليه. امنح كل ضغطة مفتاح مالكًا واحدًا، وأعد ضبط قائمة التطبيق عندما تتغير عناصرها أو اختصاراتها.

اجعل ملكية التركيز صريحة:

- `Button` و`Switch` وعناصر القوائم هي نقاط توقف تركيز لوحة المفاتيح على أنظمة سطح المكتب والويب؛ ابنِ عناصر التحكم عليها بدلًا من العناصر المرئية المجردة؛
- انقل التركيز باستخدام `focus()` الخاصة بـ ref من حدث أو من effect يلي تغيير الحالة، وانقل تركيز قارئ الشاشة باستخدام `set_accessibility_focus()` (Rust) أو `setAccessibilityFocus` من `nsh` (TSX)؛
- اعرض حالة `focus:` مرئية؛
- لا تطلب التركيز دون شرط أثناء العرض.

ينبغي أن تنفذ الأدوات المركّبة نموذج التنقل الكامل (الحركة بالأسهم، وHome / End أو الحركة بالصفحات عند الاقتضاء، والتأكيد، والإلغاء، وسلوك Tab) بدلًا من بضعة اختصارات منفصلة.

تُغلق الطبقات العلوية من الأعلى: يذهب Escape وزر الرجوع في Android إلى أعلى طبقة تستمع (`onCancel`). تعامل مع تسلسلات الإغلاق والفتح السريعة دون التصرف على سطح وسيط بدأ إغلاقه بالفعل.

<a id="async-work-and-side-effects"></a>

## العمل غير المتزامن والآثار الجانبية

ابدأ العمل غير المتزامن من حدث أو effect أو [`resource`](./reactivity.md#resource)، وليس كأثر جانبي غير مشروط داخل جسم المكوّن. لا يتتبع الـ effect إلا ما يقرؤه بشكل متزامن: اقرأ الإشارات (signals) أولًا ثم ابدأ العمل. عند اكتمال العمل، حدّث الحالة عبر الإشارات، وافترض أن المكوّن قد يكون زال، واكتب التغييرات المترابطة معًا.

أبقِ العمل المتكرر تحت مالك بحيث يؤدي زواله إلى إلغائه: تنتهي مهام Rust ومؤقتاتها مع مالكها، وتتوقف مؤقتات TSX في `cleanup`. يمكن بدء مهمة لمرة واحدة يجب أن تنتهي باستقلال من المخزن، لكنها تتخلى بذلك عن الإلغاء. عالج الأخطاء والطلبات الفاشلة بشكل صريح.

مثّل العمليات غير المتزامنة بحالات صريحة: `state()` الخاصة بالمورد (resource) هي `unresolved` أو `pending` أو `ready` أو `refreshing` أو `errored`. احتفظ بالبيانات السابقة القابلة للاستخدام أثناء التحديث: يحتفظ المورد بقيمته بينما يُحمَّل مرة أخرى. امنع عمليات الإرسال المدمّرة المكررة، واعرض الأخطاء القابلة للتعافي في واجهة المستخدم؛ ولا تعتمد على السجلات (logs) كتغذية راجعة للمستخدم.

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

انقل التحليل أو الحساب المكلف خارج معالجات TSX: إلى `computed`، أو بعيدًا عن مسار التفاعل، أو إلى Rust. قد تصل النتائج بعد أن يتغير الاستعلام أو الصفحة أو التحديد: يتجاهل المورد التحميلات التي حلّ محلها غيرها، ويُرفق العمل الذي تكتبه بنفسك رقم مراجعة أو معرّفًا ويرفض النتائج القديمة بدلًا من تطبيقها على حالة جديدة.

<a id="layout-measurement-and-scrolling"></a>

## التخطيط والقياس والتمرير

يرتب العرض (view) أبناءه في عمود، ويمتد الأبناء عبره افتراضيًا؛ أما `class="flex"` (`.flex_row()`) فهو صف، كما في CSS. يريد صف من عناصر التحكم أن يكون أبناؤه في المنتصف (`items-center`)، وهذا ما يعبّر عنه صراحةً. أما صف من الأعمدة بكامل الارتفاع فيحتفظ بالتمدد الافتراضي، فيملأ العمود ارتفاع الصف وتبقى ترويسته في الأعلى:

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

ينبغي لمعظم واجهات المستخدم أن تعتمد على التخطيط بدلًا من القياس الذاتي ([Layout](./layout.md)). القياس (`onLayout`، `measure()`) أداة سلوك متعمقة للطبقات المنبثقة (overlays) والمحاكاة الافتراضية (virtualization) والمحررات والمخططات البيانية والمكوّنات المشابهة التي يعتمد صحتها على الهندسة المحسومة.

- ضع القياس والهندسة في الطبقة التي تملك السلوك.
- راقب التخطيط فقط عندما لا يستطيع التخطيط العادي التعبير عن العلاقة.
- لا تكتب أبدًا حالة تطبيق غير ذات صلة عند كل حدث تخطيط.
- تعامل مع البيانات المقيسة على أنها مرتبطة بمراجعة معينة؛ فقد تصبح قديمة بعد تغيّر حجم النص أو العرض أو السمة أو المحتوى.
- دع الطبقات المنبثقة في `nsh/base` تضع النوافذ المنبثقة: فالتموضع والانقلاب وهوامش المنطقة الآمنة تتبع سياسة واحدة.

بالنسبة لثوابت المحاذاة، فضّل البناء الصحيح على التصحيح اللاحق: ينبغي أن تستهلك المناطق المتجاورة رمز التباعد نفسه أو الحشوة المشتركة نفسها بدلًا من تكرار قيم حرفية متساوية. أضف فحوصات هندسية أو لقطات شاشة على منصة حقيقية (`nsh test --target`) للحواف والأعمدة والفجوات المتكررة الحرجة. اختبر أكثر من النافذة الافتراضية: فقد يحوّل حجم النص الكبير وتحجيم العرض الإحداثيات الكسرية إلى انحراف بمقدار بكسل واحد حتى عندما تبدو لقطة الشاشة الافتراضية محاذاة.

قس النتيجة المحسومة عند مراجعة الدقة، لكن لا تُدرج تصحيحًا مقيسًا كقيمة اعتباطية. تتبّع عدم التطابق إلى حشوة مكررة أو حشوات متداخلة أو ملكية الحدود أو مقاييس الخط أو التقريب، ثم أصلح المالك البنيوي.

يجب أن يكون لكل منطقة قابلة للتمرير مالك واحد. تجنب التمرير المتداخل غير المقصود على المحور نفسه. امنح عرض التمرير العنصر الذي يملك الصفحة أو اللوحة أو القائمة بأكملها، بحيث يُحسم مؤشره بالنسبة إلى حافة المنطقة، وضع حشوة المحتوى داخله (`contentClass` / `contentStyle`) بدلًا من تغليف عرض التمرير في حاوية ذات حشوة. غالبًا ما يكشف مؤشر يطفو بين المحتوى وحدود الصفحة عن مالك تمرير خاطئ أو حشوة في الطبقة الخطأ. ابتعد عن المنطقة الآمنة ولوحة المفاتيح باستخدام `env(safe-area-inset-*)` و`env(keyboard-inset-height)` في الحشوة والهامش (اقرأ القيم عبر دوال الوصول الخاصة بها)، فهي تتبع التدوير ولوحة المفاتيح بشكل أصلي.

<a id="lists-tables-and-large-data"></a>

## القوائم والجداول والبيانات الكبيرة

استخدم [`List`](./lists.md) (`virtual_list` في Rust) عندما يمكن أن تنمو البيانات إلى ما يتجاوز مجموعة صغيرة محدودة. افصل هوية الصف عن موضعه المرئي وتجنب نسخ مجموعة البيانات بالكامل عند كل تحديث. دع القائمة تملك إعادة التدوير وتنسيق التمرير والنطاق المرئي، بينما تملك دوال الصفوف عرض الصف.

افصل بين:

- بيانات المصدر ومعرّفات المجال؛
- حالة التصفية والفرز؛
- حالة التحديد؛
- حالة التمرير؛
- عرض الصفوف.

يبقي هذا التحديثات محلية ويمنع شجرة العرض من أن تتحول إلى نموذج البيانات.

المحاكاة الافتراضية عقد سلوكي، وليست مجرد مفتاح للأداء. تعمل دالة الصف مرة واحدة لكل خلية، وتُعاد الخلايا للاستخدام مع صفوف أخرى:

- **يجب إبقاء الحالة الخاصة بكل عنصر في بيانات مفهرسة بالمعرّف**، وليس في إشارة (signal) تُنشأ داخل الصف، لأنها تنتقل مع الخلية إلى العنصر التالي؛
- **يجب قراءة العنصر في الموضع الذي يُستخدم فيه**، أي داخل الارتباطات (bindings): فالقيمة المنسوخة في أعلى دالة الصف تخص الصف الأول الذي عرضته الخلية؛
- حدّث بشكل غير قابل للتغيير (immutably) في TSX (مصفوفة جديدة، مع إعادة استخدام العناصر غير المتغيرة، وكائن جديد للعنصر المتغير)، وامنح `estimatedItemSize` قريبًا من الصف النموذجي؛
- يعمل التمرير إلى عنصر (`scrollToIndex`) بإحداثيات البيانات حتى عندما لا تكون معظم الصفوف موجودة.

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## تصميم واجهة API العامة

بالنسبة للمكوّنات القابلة لإعادة الاستخدام:

- تحدد الـ props قيمًا افتراضية صالحة: `#[prop(default)]` أو `#[prop(default = …)]` في Rust، و`??` حيث تُقرأ الـ prop في TSX؛
- لكل prop وحدث وعنصر مُصدَّر تعليق توثيقي؛ وفي Rust يصبح تصريح TypeScript الذي يراه TSX؛
- تصف الـ callbacks التغييرات المطلوبة ولا تتضمن تفاصيل المؤشر إلا عندما تكون ذات معنى؛
- الأجزاء والفتحات (slots) ودوال العرض الصريحة أفضل من فحص أحفاد عشوائيين؛
- يجب ألا تفرض إضافة سلوك قابل لإعادة الاستخدام خيارًا بصريًا على مستوى المنتج.

تُسلَّم التطبيقات إلى التطبيقات المضيفة كحزم موقّعة وقد لا يُعاد بناؤها أبدًا: كل إصدار لاحق من NSH يشغّلها كما هي. طبّق الانضباط نفسه على ما يعرضه تطبيق أو مكتبة مكوّنات للآخرين (props مكوّناتها وأحداثها، وصادرات الـ crate الخاص بها، والدوال التي تتلقاها المكوّنات والوحدات الأصلية للتطبيق المضيف):

- تكتسب المدخلات أعضاء اختيارية فقط؛ وتتسع الأنواع فقط؛ وتبقى القيم الافتراضية والسلوك كما هي (السلوك الجديد اختياري التفعيل)؛
- الدالة التي قد تزداد معاملاتها تأخذ خياراتها ككائن واحد (`scrollTo({ x, y, animated })`)، ولا تأخذ أبدًا معاملًا موضعيًا إضافيًا؛ أما المعاملات التي لن تزداد أبدًا، مثل بداية النطاق ونهايته، فتبقى موضعية؛
- الوضع (mode) اتحاد من السلاسل النصية (string union) يمكن أن يكتسب قيمًا، وليس قيمة منطقية (boolean) قد تحتاج لاحقًا إلى حالة ثالثة؛
- للقيمة نوع واحد: `version: string`، وليس `string | number` أبدًا؛
- ما تعيده الدالة كائن يمكن أن يكتسب حقلًا، وليس tuple أو قيمة مجردة؛
- الدالة التي تعيد Promise تبلغ عن كل فشل برفضه، والفشل الذي يستطيع المستدعي معالجته يحمل `code`، كما تفعل واجهات NSH نفسها: يتفرع المستدعون بحسب الرموز، بينما الرسائل مخصصة للبشر وقد تتغير؛
- إعادة التسمية تُبقي الاسم القديم كاسم مستعار `@deprecated` لنفس التنفيذ.

في Rust، تكون الحقول الخاصة هي الافتراضي للحالة السلوكية التي يجب أن تتطور دون كسر المستدعين. تناسب الحقول العامة الإعدادات الشبيهة بالسجلات عن قصد والبيانات المسلسلة (serialized). يجب أن يحمل كل struct عام ذي حقول عامة `#[non_exhaustive]` وأن ينفذ `Default`، حتى يستطيع المستدعون إنشاء القيم دون literals كاملة للـ struct ويمكن إضافة حقل دون كسرها.

أبقِ مسارات الاستيراد العامة مستقرة أثناء إعادة تنظيم الأجزاء الداخلية: فمحدد `#[native_module]` الخاص بالـ crate وصادراته، وصادرات وحدة TSX، هي ما تستورده الشيفرة الأخرى. فضّل مصطلحات عناصر التحكم في المنصة وتسميات NSH المعتمدة على مفردات أطر الويب.
<a id="platform-and-capability-boundaries"></a>

## حدود المنصات والإمكانات

لا تفترض أن كل منصة تدعم الإمكانات نفسها. فقد تختلف أشرطة العنوان وعناصر التحكم في النوافذ، وإمكانية الوصول، والحافظة، والاستجابة اللمسية، وفيزياء التمرير، والخطوط، والتوقيت. تعمل حزمة واحدة على كل المنصات ([الشيفرة الخاصة بكل منصة](./platform-specific.md))؛ ضع الشيفرة الخاصة بمنصة معينة في المكان الذي يخصصه لها NSH، وحدّد سلوك الرجوع الاحتياطي:

- ما يعنيه العنصر على كل المنصات يكون prop من المستوى الأعلى؛ أما ميزة النظام الخاصة بمنصة بعينها فتوضع في `ios={{…}}` أو `android={{…}}` أو `desktop={{…}}` أو `web={{…}}` (دالة builder في Rust)، لدى كل منصة تتوفر فيها، ولا يُطبَّق إلا كائن المنصة الحالية؛
- تأتي واجهات API الخاصة بمنصات الجوال من `nsh/mobile`، وواجهات أنظمة سطح المكتب من `nsh/desktop`؛
- أنماط كل منصة هي أصناف `ios:` و`android:` و`web:`.

يجب أن يحافظ فرع المنصة على العقد الدلالي حتى لو اختلف العرض. فمثلًا، يظهر الحوار على iOS كورقة (sheet)، وعلى أنظمة سطح المكتب كطبقة فوق النافذة، ومع ذلك يحتاج التطبيق إلى حالة فتح متسقة. اختبر السلوك المشترك بوضع headless، واختبر الجزء الخاص بالمنصة باستخدام `nsh test --target`. أعطِ كل فرع يعتمد على قيمة يُبلغ عنها NSH (`platform.os`، أو حالة، أو سبب) فرعًا `default`: ستضيف الإصدارات اللاحقة منصات وحالات جديدة، وسيعمل عليها التطبيق المُسلَّم اليوم ([التوافق](./compatibility.md)).

يصرّح التطبيق بما يصل إليه خارج الآلة الافتراضية (VM) الخاصة به في `nsh.json` `"capabilities"`: المضيفات التي يجلب منها البيانات، والصفحات التي يعرضها web view، والحافظة، وشريط الحالة ([العزل والإمكانات](./sandbox-and-capabilities.md)). على التطبيق الذي سيُسلَّم داخل تطبيقات أخرى أن يسرد ما يستخدمه بدقة، وأن يعالج الطلب المرفوض كما يعالج الطلب الفاشل: فقد يمنح التطبيق المضيف أقل مما يصرّح به التطبيق. يفشل الاستدعاء المرفوض بالخطأ `code` `"ERR_ACCESS_DENIED"`، ويسمّي حقل `permission` فيه الإمكانية، ويسمّي حقل `resource` ما طُلب.

<a id="file-and-naming-conventions"></a>

## اصطلاحات الملفات والتسمية

- سمِّ الصفحات والمكونات بأسماء مفاهيم المنتج: `ProjectList`، `ProjectEditor`، `SettingsPage`.
- سمِّ معالجات الأحداث بحسب القصد: `confirmDelete`، `openProject`، `onQueryChange`.
- اجعل لكل وحدة (module) مسؤولية رئيسية واحدة؛ وقسّم الملف حين لا يعود بالإمكان فهم ملكية الحالة أو دورة الحياة دون قراءة سلوك غير ذي صلة.
- أبقِ وحدة المكوّن وprops والأحداث والاختبارات المركّزة الخاصة به معًا ما دامت تتغير معًا.
- وثّق الثوابت (invariants) وقيود دورة الحياة المفاجئة؛ ولا تشرح استدعاءات builder البديهية.
- استخدم `rustfmt` وأرضِ Clippy في Rust، واستخدم `nsh check` في TSX. تجنّب سمات `allow` الواسعة التي تخفي تحذيرات غير ذات صلة.

<a id="vocabulary-is-part-of-the-api"></a>

### المفردات جزء من الـ API

استخدم الكلمة نفسها للمفهوم نفسه عبر المكونات. قبل تسمية prop أو حدث، ابحث عن المصطلح في API الخاص بـ NSH أولًا، ثم في `gpui-base` الخاص بـ GPUI Kit وفي GPUI وفي `gpui-component`، ثم في عناصر التحكم الخاصة بالمنصات. ما تعرضه العناصر الأولية (primitives) وواجهات API العامة تستمد أسماءها من HTML وDOM وCSS (`src`، `html`، `placeholder`). أسماء Rust هي `snake_case` وتُترجم إلى `camelCase` في TSX (`on_open_change` تصبح `onOpenChange`)؛ وتبقى الكلمة الواحدة كلمة واحدة (`readonly`، `multiline`).

| المفهوم | نمط التسمية | مثال |
| --- | --- | --- |
| مكوّن | اسم، `PascalCase` | `Button`، `Dialog`، `QuantityStepper` |
| props المكوّن وأحداثه (Rust) | `<Component>Props`، `<Component>Event` | `ButtonProps`، `ButtonEvent::Press` ← `onPress` |
| كائن حالة سلوك ما | `<Control>State`، يُنشأ بواسطة `create<Control>` | `NavStackState`، `createNavStack` |
| سبب تغيّر قيمة | `<Control>ChangeReason`، اتحاد نصوص (string union) | `DialogChangeReason`: `"cancel"`، `"backdropPress"` |
| حالة | صفة إيجابية، دون البادئة `is` | `open`، `hidden`، `disabled`، `selected`، `checked`، `readonly` |
| ما يحق للمستخدم فعله | الصفة | `scrollable`، `zoomable`، `selectable`، `resizable` |
| ميزة بلا صفة | `<feature>Enabled` | `pagingEnabled` |
| هل يظهر جزء ما | قيمة منطقية باسم الجزء، والافتراضي `true` | `scrollbar`، `caret` (`scrollbar={false}`) |
| هل تظهر فتحة (slot) | `<slot>Visible`، والافتراضي `true` | `headerVisible` (`header` فتحة الصفحة) |
| أنماط جزء ما | `<part>Class`، `<part>Style` | `backdropClass`، `contentStyle` |
| أنماط حالة ما | أصناف `<state>Style`، `<state>:` | `activeStyle`، `disabled:` |
| فتحة (slot) | ما تمثله | `header`، `footer`، `trigger`، `content`، `empty` |
| محتوى خاص بالتطبيق | `render<Part>` | `renderCodeBlock` |
| علامة الإغلاق (dismissal) | `closeOn<Trigger>`، والافتراضي `true` | `closeOnEscape`، `closeOnBackdropPress` |
| تغيّر قيمة | `on<Value>Change({ <value>, ... })`، كائن واحد | `onChange({ value })`، `onOpenChange({ open, reason })` |
| أي حدث آخر | `on<Event>`، بصيغة المضارع، كائن واحد | `onPress()`، `onSubmit({ text })` |
| مرحلة | `<act>Start`، `<act>End` | `onPanStart`، `onLoadStart` |
| الفأرة فوق عرض (view) | `Enter` / `Move` / `Leave`، وفق DOM | `onMouseEnter`، `onMouseMove`، `onMouseLeave` |
| بدء الاستماع | `on(event, listener)`، ويعيد `() => void` | `host.on(name, l)`، `BackHandler.on("press", l)` |
| قيمة من البيئة | دالة وصول (accessor)، و`set<Value>` بجانبها | `colorScheme()`، `setColorScheme` |
| قيمة منطقية للقراءة فقط | `is<Adjective>`، `has<Noun>` | `isAvailable` |

لا تكون props أبدًا `is<Adjective>`: هذه الصيغة لما يقرأ قيمة منطقية فقط (ثابت، أو حقل في حمولة). الجزء الذي يظهر يُسمّى باسم الجزء، وليس أبدًا `<part>Shown` أو `<part>Hidden` أو `shows<Part>`.

يأخذ builder في Rust `Self` ويعيده، ويُسمّى باسم الـ prop الذي يضبطه، دون `set_` (`.disabled(..)`، `.checked(..)`، `.on_change(..)`)؛ أما التعديل في المكان نفسه فهو `set_<field>` (`setRoutes`، `setColorScheme`). دالة قراءة القيمة المنطقية إما `has<Noun>`، حين تحمل القيمة شيئًا، وإما `is<Adjective>`، حين تصف حالة أو إذنًا. اختر الصفة كلما كان للفعل صفة: `isClosable` بدلًا من `canClose`، و`isZoomable` بدلًا من `canZoom`. وحين يكون الفعل عبارة فعلية بلا صيغة صفة، سمِّ الشيء الذي يحتاجه: `hasDefinition`، وليس `canGoToDefinition`. لا تضف دوال قراءة جديدة من النوع `can`.

<a id="let-the-enclosing-name-carry-the-context"></a>

### دع الاسم المحيط يحمل السياق

يُقرأ الاسم داخل شيء ما: prop داخل مكوّنه، وحقل داخل نوعه. ولا يكرر أيٌّ منهما ما يحيط به (`contentStyle`، وليس `contentContainerStyle`؛ و`backdropClass` الخاص بـ `Dialog`، وليس `dialogBackdropClass`). أبقِ حقول النوع الواحد على مستوى الاختصار نفسه.

<a id="use-precise-domain-words"></a>

### استخدم كلمات المجال بدقة

- **selected** تعني الانتماء أو العنصر الحالي؛ و**checked** و**pressed** قيمة مربع الاختيار أو زر التبديل؛ و**focused** هدف لوحة المفاتيح؛ و**hovered** وجود المؤشر. لا تستخدمها بالتبادل أبدًا.
- **open / close** حالة طبقة التراكب (overlay)؛ و**show / hide** طلب مؤقت؛ و**expand / collapse** للبنية.
- **disabled** يمنع التفاعل؛ و**readonly** يسمح بالتحديد والتنقل لكن لا يسمح بالتحرير؛ و**loading** يمنع تكرار العمل أثناء تشغيل عملية.
- **press** هو التفعيل بأي وسيلة إدخال، وأحداث NSH تستخدم press (`onPress`)؛ أما **click** فخاص بالفأرة.
- **index** هو الموضع؛ و**id** هو الهوية. لا تحفظ البيانات القابلة لإعادة الترتيب ولا تفهرسها بحسب index.
- **value** هي بيانات المجال المتحكَّم فيها؛ و**state** هي السلوك المحتفَظ به.
- **src** هو المورد الذي يعرضه العنصر (صورة، أو فيديو، أو صفحة)؛ وأي عنوان آخر هو **url**.
- **role** يوضح معنى الخيار (`"cancel"`، `"destructive"`)؛ أما المظهر فيعود إلى التطبيق.

تجنّب الأسماء الغامضة مثل `data` و`item2` و`handleAction` و`updateUi` و`process` و`manager` أو `config` حين يتوفر مصطلح مجال أضيق.

<a id="type-and-module-style"></a>

### أسلوب الأنواع والوحدات

- أنواع Rust هي `UpperCamelCase`؛ والوحدات والدوال والطرق والحقول والمتغيرات المحلية `snake_case`؛ والثوابت `SCREAMING_SNAKE_CASE`. سمِّ روابط السياق (context bindings) `cx`.
- مكونات TSX ووسومها هي `PascalCase`؛ وprops والدوال والمتغيرات المحلية `camelCase`. تأتي العناصر الأولية من `nsh`، والمكونات الأساسية من `nsh/base`.
- الوحدة التي تحمل اسم مكوّن تملك واجهتها العامة؛ قسّم حالتها وأجزاءها واختباراتها إلى ملفات دون تغيير ما يستورده الآخرون.
- استخدم أسماء وحدات مفردة لمفهوم مكوّن واحد، والأسماء المعتمدة للعائلات (`menu` لـ `Menu` و`MenuItem` و`Submenu`).
- ألحق المعرّفات باللاحقة `Id`، وسمِّ المجموعات بصيغ جمع ذات معنى. لا تتناوب بين `idx` و`index` و`ix` في نظام فرعي واحد.
- سمِّ الشروط (predicates) بصيغة إيجابية متى أمكن. فالحالة الإيجابية أسهل تركيبًا من عدة حالات سلبية، لكن أبقِ المصطلحات المعتمدة مثل `disabled` حيث تطابق دلالات عنصر التحكم.

<a id="callback-and-event-wording"></a>

### صياغة الاستدعاءات والأحداث

- يمرّر كل حدث كائنًا واحدًا، حتى لو كان فيه حقل واحد وحتى لتغيّر قيمة، وتُسمّى حقوله بأسماء props التي تُبلغ عنها: `onChange({ value })`، `onOpenChange({ open, reason })`، `onLinkPress({ url })`. وبذلك يكون أي حقل لاحق مجرد إضافة. نوع البيانات في API يكون حقلًا، وليس الحمولة نفسها أبدًا (`onImagePress({ image })`)؛ والحدث الذي لا يُبلغ عن شيء لا يمرّر شيئًا.
- سمِّ الفعل نفسه، لا صيغة الماضي ولا الطلب: `onPress`، `onClose`، `onCancel`، `onBackPress`.
- سمِّ القصد لا الهندسة حين يكون للفعل اسم: `onLoadMore`، وليس "تم الوصول إلى النهاية".
- أزواج دورة الحياة هي `onOpen` / `onClose`؛ والمراحل هي `Start` / `End`، وليس `Begin` أبدًا؛ والفأرة فوق عرض (view) هي `onMouseEnter` / `onMouseMove` / `onMouseLeave` (أسماء DOM)، وملف يُسحب فوقه `Enter` / `Leave`.
- وثّق ما إذا كان الاستدعاء يعمل قبل تغيّر حالة المكوّن نفسه أو بعده، وما إذا كان يجوز له إعادة الدخول إلى المكوّن.

<a id="documentation-and-copy-style"></a>

### أسلوب التوثيق والنصوص

ينبغي أن تبدأ الوثائق العامة بما يفعله المكوّن ومن يملك حالته. يجب أن تستخدم الأمثلة واجهات API الحالية وتُظهر معرّفات (ids) ثابتة. وثّق القيم الافتراضية، والاختلافات بين المنصات، وسلوك التركيز، وترتيب الاستدعاءات، وprops التي يقرؤها الخيط الرئيسي أصليًا.

اتبع قواعد لغة الواجهة في Design Guides فيما يخص التسميات والأوامر وحوارات التأكيد وحالة الأحرف وعلامات الحذف. أبقِ مصطلحًا معتمدًا واحدًا لكل كائن مجال وأمر وحالة.

تصف مفاتيح الترجمة قصدًا ثابتًا (`dialog.deleteProject.title`)، لا جملة بلغة المصدر ولا إحداثيات شاشة. لا تُركّب جملة أبدًا من أجزاء مترجمة، ولا تعِد استخدام مفتاح واحد لمعانٍ يصادف أن لها النص الإنجليزي نفسه.

عرِّب القصد لا الصياغة النحوية. امنح كل لغة محلية (locale) التحكم في ترتيب الكلمات والجمع وعلامات الترقيم ومقدار السياق الذي تحتاجه. ينبغي أن تكشف الاختبارات المفاتيح المفقودة والمصطلحات الثابتة غير المتسقة؛ ويبقى القرار للمراجعة البشرية في ما إذا كان التكرار مبررًا بالسياق. تحقق من كل نص داخل مكوّنه بمحتوى واقعي، ومع تمدد النص، وبحجم نص كبير.

<a id="testing-strategy"></a>

## استراتيجية الاختبار

اختبر في أدنى طبقة يمكنها إثبات السلوك ([الاختبار](./testing-and-trace.md)):

1. اختبارات خالصة لانتقالات الحالة والتنسيق والتحليل والترتيب (`cargo test` لدوال الحزمة (crate)، وملف اختبار لدوال المتجر (store))؛
2. اختبارات تطبيق headless للمكونات والأحداث وأعمار الكائنات: المحرك والمُصيِّر والتخطيط والقوائم الحقيقية، مع إطارات عرض بتردد 60 Hz، في `nsh test` (`nsh/test`) أو `cargo test` (`nsh_testing::Headless`)؛
3. اختبارات تفاعل للتركيز ولوحة المفاتيح والمؤشر والتخطيط والحالة المعروضة، بالخطوات التي يتبعها المستخدم (`press`، `type`، `scroll`، `drag`، `keyboard.press`)، بوضع headless وعلى منصة حقيقية (`nsh test --target macos`، `ios`، `android`، `web`، ...)؛
4. اختبارات smoke للأمثلة أو التطبيقات لسير العمل الكامل، و`nsh test --trace` لقياس كلفة التفاعل.

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

بالنسبة إلى المكوّن التفاعلي، غطِّ العقد الدلالي لا تفاصيل تنفيذه: التفعيل بالضغط ولوحة المفاتيح، وتغيّرات القيمة المتحكَّم فيها، وسلوك التعطيل، وانتقال التركيز، وعدد الأحداث وترتيبها، والهوية الثابتة، وحالات الفراغ أو الفشل المهمة. استبدل الشبكة بمحاكاة (مسارات `network`) وتحكّم في الزمن (ساعة يدوية) بدلًا من انتظار الحقيقيين منهما. أضف اختبار انحدار (regression) قبل إصلاح خطأ متى أمكن إعادة إنتاج الفشل بصورة حتمية.

اعثر على العروض كما يفعل المستخدم: بالدور (role) والاسم أو التسمية أو النص (`role:button[Save]`، `label:Close`)، وبـ `testID` ثابت حيث لا يوجد ما يسمّيها غيره. تُقرأ المحددات (selectors) من جديد عند كل خطوة، فلا تعمل أي خطوة على لقطة قديمة. استخدم لقطات الشاشة (`app.screenshot`، على منصة حقيقية) للحقائق البصرية التي لا تعبّر عنها المحددات؛ واستخدم الإحداثيات كحل أخير فقط. أبلغ عن الأدلة الآلية واليدوية بشكل منفصل.

<a id="performance-rules"></a>

## قواعد الأداء

- لا تكتب الحالة دون شرط من ربط (binding) أو أثر (effect) يقرؤها.
- تجنّب إنشاء signals وeffects وارتباطات مفاتيح (key bindings) وهياكل بيانات مكلفة داخل الارتباطات أو دوال الصفوف.
- اقرأ signals داخل الارتباطات، كي يحدّث التغيير المتسق أضيق جزء من الشجرة.
- استخدم `List` للمجموعات الطويلة وارسم النطاق المرئي فقط.
- تجنّب نسخ النصوص أو المجموعات الكبيرة لمجرد إرضاء closure؛ التقط مقابض `Copy` أو بيانات مشتركة (`SharedString`، `Rc`).
- أبقِ معالجات TSX والقيم المحسوبة خفيفة؛ وانقل العمل الثقيل بعيدًا عن مسار التفاعل أو إلى Rust.
- قِس باستخدام `nsh test --trace` قبل إضافة ذاكرات مؤقتة. يجب أن يكون لكل ذاكرة مؤقتة مالك واضح لإبطالها.
- أبقِ عمل الحركة محدودًا: قيم متحركة على خيط واجهة المستخدم بدلًا من signals تُكتب في كل إطار، و`scrollValue` بدلًا من مستمع تمرير ([الحركة](./animation.md))، واحترم تقليل الحركة (`reduceMotion()`).
<a id="common-failure-modes"></a>

## أنماط الفشل الشائعة

تجنّب هذه الأنماط:

- إشارة (signal) واحدة تحتوي على حالة غير مترابطة في التطبيق؛
- منطق الأعمال وطلبات الشبكة مضمَّنة داخل جسم مكوّن طويل؛
- مفاتيح عشوائية أو قائمة على الفهرس للمحتوى القابل لإعادة الترتيب؛
- حالة لكل صف داخل إشارات تُنشأ داخل صف `List`؛
- قراءة خاصية (prop) أو إشارة في جسم المكوّن مع توقّع أن تُحدَّث؛
- ألوان وأنصاف أقطار حرفية تكسر السمات المخصّصة والوضع الداكن؛
- عناصر عرض مخصّصة قابلة للضغط في موضع يوفّر فيه مكوّن دلالي جاهز التركيز ولوحة المفاتيح والتعطيل وإمكانية الوصول؛
- حالة محلية مكرّرة تنحرف عن القيمة المتحكَّم بها؛
- تأثيرات (effects) تنسخ إشارة إلى أخرى، وكتابات تدور في حلقة عبر الربط (binding)؛
- قرار يحتاجه النظام فورًا يُترك لدالة رد نداء (callback)، بدلًا من خاصية تُضبط مسبقًا؛
- عناصر تمرير متداخلة دون تحديد صريح للمالك؛
- متغيّر مكوّن جديد لشاشة لمرة واحدة؛
- مربعات حوار تأكيد لإجراءات قابلة للتراجع ومنخفضة المخاطر؛
- اختبارات تستدعي دوال داخلية لكنها لا تضغط ولا تكتب ولا تمرّر أبدًا.

<a id="rules-for-coding-agents"></a>

## قواعد لوكلاء البرمجة

قبل التعديل، يجب على الوكيل قراءة أقرب تنفيذ، واختباراته، والصادرات العامة للوحدة، وصفحة المرجع ذات الصلة. ويجب عليه البحث في المصدر الحالي و`.nsh/types` عن التواقيع بدلًا من ترجمة مثال من React أو React Native أو CSS أو GPUI بالقياس: فمكوّنات NSH تعمل مرة واحدة، والروابط تتبع الإشارات التي تقرؤها.

لكل تغيير، ينبغي أن يكون الوكيل قادرًا على تحديد:

1. مالك السلوك ومالك العرض؛
2. الهوية المحتفظ بها ودورة حياة الحالة؛
3. عقد الضغط ولوحة المفاتيح والتركيز وإمكانية الوصول؛
4. مالك التخطيط والتمرير؛
5. رموز السمة (theme tokens) والاستثناءات المقصودة؛
6. الاختبار الذي سيفشل إذا تراجع السلوك.

يجب أن يراجع شخصٌ الشيفرة المولَّدة ويختبرها. فعبارة "تُترجَم بنجاح" ليست معيارًا لجودة واجهة المستخدم، وإعادة هيكلة واسعة لا تفعل سوى جعل الشيفرة المولَّدة تبدو مرتّبة ليست بديلًا عن مطابقة معمارية التطبيق.

<a id="implementation-checklist"></a>

## قائمة التحقق للتنفيذ

قبل فتح تغيير للمراجعة، تأكد من أن:

- ملكية الحالة والآثار الجانبية صريحة؛
- الاختيار بين دالة عادية ومكوّن تم عن قصد، وأن الخصائص والإشارات تُقرأ حيث تُستخدم؛
- للعناصر المتكررة مفاتيح ثابتة قائمة على المجال ومعرّفات اختبار ثابتة؛
- رموز السمة ومقياس Tailwind حلّت محل القيم البصرية الحرفية المعزولة؛
- الضغطات واختصارات لوحة المفاتيح والتركيز وحالة التعطيل والطبقات المنبثقة (overlays) تعمل معًا؛
- القرارات التي يحتاجها النظام فورًا هي خصائص تُضبط مسبقًا؛
- مسارات التحميل والفراغ والخطأ والإلغاء ممثَّلة؛
- مجموعات البيانات الطويلة تستخدم `List`، مع حالة كل عنصر ضمن البيانات؛
- إضافات واجهة API العامة توسّع فقط، وتحافظ على اتجاه الاعتماديات والتغليف؛
- الاختبارات تثبت السلوك على الطبقة المناسبة، بدون واجهة (headless) وعلى المنصات التي يمسّها التغيير؛
- التنسيق وClippy و`nsh check` والاختبارات المستهدفة والأمثلة ذات الصلة كلها تنجح.

راجع [البدء](./getting-started.md) لإعداد التطبيق، ومراجع [Elements](../elements/index.md) و[API](../modules/index.md) لتفاصيل واجهة API الحالية.
