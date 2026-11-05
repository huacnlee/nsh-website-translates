---
title: "الأداء"
description: "كيف تحافظ NSH على سرعة التطبيقات (تطبيقات Rust، وبيئة تشغيل أصلية، وعبور مجمّع بين الطبقات، ورسوم متحركة أصلية، وقوائم افتراضية)، وماذا يعني ذلك لشيفرتك، وكيف تقيس الأداء بدون واجهة وعلى الشاشة."
order: 62
group: tools
source_hash: f8f220699bc54685
---

# الأداء

الأداء هو الأولوية الأولى في NSH، ويُحسم معظمه في إطار العمل نفسه لا في تطبيقك: بيئة التشغيل أصلية (native)، وكل تحديث يعبر بين الخيوط مرة واحدة، والرسوم المتحركة وتvirtualization للقوائم تعملان دون JS، والتطبيق المكتوب بلغة Rust لا يشغّل أي JS على الإطلاق. تشرح هذه الصفحة القواعد التي يتبعها NSH، وما تعنيه للشيفرة التي تكتبها بلغة Rust وبـ TSX، وكيفية القياس.

<a id="the-rules"></a>

## القواعد

<a id="1-js-does-as-little-as-possible"></a>

### 1. أقل قدر ممكن من JS

**التطبيق المكتوب بلغة Rust شيفرة أصلية من البداية إلى النهاية**: مكوّناته وحالته ومعالجاته تُترجم بمحرك NSH، ولا يعمل أي مفسّر ([البناء باستخدام Rust](./rust.md)). هذه أسرع طريقة لكتابة تطبيق، وهي الخيار الأنسب لمنطق الأعمال الذي يتطلب أداءً عاليًا.

في تطبيق TSX، يُعدّ QuickJS مفسّرًا صغيرًا وسريع البدء، لكنه أبطأ بكثير من الشيفرة الأصلية في الأعمال الثقيلة. لذلك **لا يكون JS في NSH إلا شيفرة تطبيقك**. أما الرسم البياني التفاعلي (signals والقيم المحسوبة وeffects)، والـ renderer الذي تستدعيه JSX المترجمة، ومحرك التخطيط، وlist virtualization، والرسوم المتحركة، وكل وحدة تستوردها، فكلها Rust. التحليل (parsing) والمقارنة (diffing) والتخطيط ومعالجة النصوص تجري كلها بشكل أصلي.

الأثر قابل للقياس. هذا تطبيق عدّاد واحد على بيئة JS السابقة في NSH وعلى البيئة الأصلية (إصدارات release):

| | بيئة JS السابقة | البيئة الأصلية |
|---|---|---|
| حجم الحزمة | 14 KB JS / 19.6 KB bytecode | 886 B JS / 1.7 KB bytecode |
| تقييم الحزمة | ~390 µs | ~95 µs |
| زمن JS لنقرة واحدة (الوسيط) | ~14 µs | ~5 µs |
| commit لنقرة واحدة | ~22 µs | ~15 µs |
| تمرير قائمة من 1000 صف، زمن JS لكل إطار إعادة ربط | ~150 µs | ~77 µs |

والأمر نفسه ينطبق على المكوّنات: زر مكتوب كمكوّن Rust مقابل زر TSX مكافئ، 200 زر من كل نوع:

| | زر Rust: JS / core | زر TSX: JS / core |
|---|---|---|
| الإطار الأول (العمليات) | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| تحديث جميع العناوين الـ 200 (العمليات) | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

(القياسات على Apple silicon؛ والجدول الثاني على البيئة السابقة. وكلاهما من خطوط الأساس لأداء NSH.)

**بالنسبة لشيفرتك:** أبقِ معالجات الأحداث والقيم المحسوبة خفيفة. الحسابات الثقيلة (تحليل حمولات كبيرة، أو فرز آلاف العناصر عند كل ضغطة مفتاح) تكلّف في QuickJS أكثر مما اعتدت عليه في V8 أو JavaScriptCore مع JIT. نفّذها مرة واحدة، أو خزّنها مؤقتًا في `computed`، أو انقلها بعيدًا عن مسار التفاعل.

<a id="2-cross-threads-in-batches"></a>

### 2. العبور بين الخيوط على دفعات

شيفرة تطبيقك، سواء كانت Rust أو JS، تعمل على خيط المحرك (engine thread) ولا تعمل أبدًا على الخيط الرئيسي. الدورة الواحدة، مثل معالج حدث واحد مع كل ما يغيّره، تصبح **commit واحدًا**: تعرض بيئة التشغيل المكوّنات، وتحسب التخطيط، وتقارن، وتنتج دفعة واحدة من عمليات العرض الأصلية، تصل إلى الخيط الرئيسي في **قفزة واحدة**. لا توجد رسالة جسر لكل عرض، ولا تسلسل (serialization) لكل خاصية.

**بالنسبة لشيفرتك:** لا تحتاج إلى دمج الكتابات من أجل الأداء؛ فعشرة استدعاءات `set` في معالج واحد تنتج commit واحدًا، في Rust وفي TSX. استخدم `batch` عندما تريد أن ترى effects والقيم المحسوبة جميع الكتابات دفعة واحدة بدل أن تعمل بعد كل كتابة.

<a id="3-fine-grained-updates"></a>

### 3. تحديثات دقيقة التفصيل

تعمل المكوّنات **مرة واحدة**، في Rust وفي TSX على حد سواء. بعد ذلك، لا يعمل من جديد إلا الربط (binding) الذي يقرأ signal عندما يتغير: نص، أو خاصية نمط، أو فرع من `when` (`<If>`)، أو صفوف `each` (`<Each>`). لا شيء يعيد عرض شجرة فرعية كاملة لاكتشاف ما تغيّر.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**بالنسبة لشيفرتك:**

- اقرأ الـ signals حيث تُستخدم (داخل الروابط، وإغلاقات `move ||` في Rust وتعبيرات JSX في TSX، وفي `computed` و`effect`)، لا في أعلى المكوّن، حتى يتحدّث أضيق ربط ممكن.
- استخدم `each` / `<Each>` (صفوف تُحفظ بالمفتاح) أو [virtual list](./lists.md) للمجموعات؛ أما الصفوف التي تُنشأ من جديد من المجموعة كلها (`dynamic` في Rust، أو `.map()` عادية في JSX) فتُنشأ كلها من جديد عند كل تغيير.
- اشتقّ القيم باستخدام `computed` عندما تستخدمها عدة روابط، لتُحسب مرة واحدة لكل تغيير.

إضافة عنصر رابع إلى قائمة من ثلاثة عناصر، كما يعرضها `nsh test --trace`:

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

راجع [التفاعلية (Reactivity)](./reactivity.md).

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. لا ترسل ما لا حاجة إليه

لا يرسل core إلا ما تغيّر: العروض الجديدة لا تحصل على نمط افتراضي ولا على قناع أحداث فارغ، والأنماط والإطارات غير المتغيرة لا تُرسل، وتغيير لون النص لا يعيد تخطيط النص. النقرة التي تغيّر رقمًا واحدًا ترسل عنصر نص واحدًا. يمكنك رؤية ذلك في مخرجات `nsh test --trace` (أدناه).

<a id="5-animate-natively"></a>

### 5. حرّك بشكل أصلي

الرسوم المتحركة المدفوعة من خيط المحرك (signal يُكتب في كل إطار) تكلّف commit لكل إطار، واستدعاء JS في TSX، وتتقطع عندما يكون خيط المحرك مشغولًا. أما القيم المتحركة ([الرسوم المتحركة (Animation)](./animation.md): `animated_value` في Rust، و[واجهة الرسوم المتحركة في `nsh`](../modules/nsh.md#animation) في TSX) فتشغّل الرسوم المتحركة بشكل أصلي بدلًا من ذلك:

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing` و`spring` و`decay` تعمل على خيط واجهة المستخدم الخاص بالمنصة، إطارًا بإطار، دون أي عمل على خيط المحرك في كل إطار.
- `scroll_value` (`scrollValue`) يكتب إزاحة التمرير في قيمة متحركة في الإطار نفسه؛ وإيماءة السحب (`pan={{ x, y }}`) تتيح للسحب تحريك عرض مباشرة. يصلك إشعار بالنهاية فقط (تكتمل الرسوم المتحركة، وتتلقى نهاية السحب السرعة).
- `Animated.sequence` / `parallel` / `stagger` / `loop` تعمل كشجرة أصلية واحدة: تبدأ كل خطوة لحظة انتهاء السابقة، دون فجوة انتظارًا لـ JS.
- `LayoutAnimation.configureNext` يحرّك بشكل أصلي الإطارات وعمليات الإدراج والإزالة في الـ commit التالي.

<a id="6-virtualize-long-lists"></a>

### 6. طبّق virtualization على القوائم الطويلة

[`List`](./lists.md) يحتفظ فقط بالصفوف القريبة من منطقة العرض، ويعيد تدوير خلاياها، ويحسب المواضع والأعمدة والرؤوس اللاصقة وقابلية المشاهدة (viewability) بشكل أصلي. إطارات التمرير التي لا تكشف صفًا جديدًا لا تشغّل أي شيفرة منك ولا تنتج أي دفعة؛ أما الإطار الذي يربط صفًا جديدًا واحدًا من قائمة الصور في المعرض (gallery) فيساوي 4 عمليات و4 عناصر mount.

**بالنسبة لشيفرتك:**

- أعطِ `estimated_item_size` (`estimatedItemSize`) قيمة قريبة من ارتفاع الصف الحقيقي.
- أبقِ حالة كل عنصر في بياناتك (مفهرسة بالمعرّف id)، لا في signals تُنشأ داخل الصف: فالخلايا يُعاد استخدامها لعناصر أخرى، ويتغير موضع الصف (`at.index()`؛ و`item()` / `index()` في TSX) عندما يحدث ذلك.
- أبقِ الصفوف خفيفة: يُربط الصف مرة عند كل إعادة تدوير، لذا تعمل شيفرته أثناء تمرير المستخدم.
- استخدم `scroll_value` (`scrollValue`) بدل `on_scroll` (`onScroll`) للتأثيرات التي تتبع موضع التمرير. يتلقى مستمع التمرير حدثًا واحدًا على الأكثر في كل دورة محرك، لكن كل حدث يظل استدعاءً إلى شيفرتك (إلى JS في TSX).

<a id="measuring"></a>

## القياس

<a id="headless-50"></a>

### بدون واجهة (headless): `--trace`

في اختبار Rust، يسجّل `EngineConfig::trace` أسطر `perf` نفسها، ويرى `Headless::observe` كل دفعة ([الاختبار (Testing)](./testing-and-trace.md#tracing-with-trace)). ويطبعها `nsh test --trace` لتطبيقات TSX:

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

ما يجب النظر إليه:

- **ops** (العمليات التي أضافها JS إلى الطابور) و**mount items** (عمليات العرض الأصلية): هذه حتمية. إذا كانت نقرة يُفترض أن تغيّر تسمية واحدة تنتج 40 عنصرًا، فهناك شيء يعيد إنشاء عروض كان يجب تحديثها.
- **event js**: كلفة JS لمعالج ما وما أطلقه.
- **commit**: كلفة core في عرض المكوّنات والتخطيط والمقارنة.
- **list js**: زمن JS المستغرق في ربط صفوف القائمة أثناء ذلك الـ commit.

الدليل الكامل: [الاختبار (Testing)](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### على جهاز: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

يسجّل أسطر commit نفسها من المضيف (host) الحقيقي لتطبيق TSX، مع محرك النصوص الخاص بالمنصة. ويفعل `NshAppView(trace: true)` و`new NshView(context, true)` الشيء نفسه في تطبيق مضمِّن (embedding app).

<a id="on-screen-58"></a>

### على الشاشة: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(`AppOptions { fps: true, .. }` في `run_app` لتطبيق Rust) يعرض معدل الإطارات وكلفة الإطارات والـ commits فوق التطبيق العامل، مع CPU وGPU والذاكرة ([macOS: performance monitor](./macos.md#performance-monitor)). على Linux وWindows، يسجّل `--target linux --fps` و`--target windows --fps` القراءات نفسها مرة كل ثانية، مع زمن كل مرحلة من مراحل الإطار؛ ويلتقطها `nsh test --target linux --fps -v` (أو `windows`) بينما يقود اختبار التطبيق.

> [!TIP]
> القياسات المفردة تهيمن عليها حالة ساعة CPU: الخيط الذي كان نائمًا للتو يعمل أبطأ لفترة.
> قارن الحد الأدنى لعدة تشغيلات، على الجهاز نفسه، وفضّل إصدارات release عند قياس الزمن.

<a id="reference-numbers"></a>

## أرقام مرجعية

الأرقام المقاسة، وخطوط الأساس لـ NSH، والمعرض صفحةً صفحة على Linux، موجودة في [تقرير الأداء](./performance-report.md).

<a id="checklist"></a>

## قائمة التحقق

- اللغة: اكتب التطبيق، أو الأجزاء الأكثر استخدامًا منه، بلغة Rust ([البناء باستخدام Rust](./rust.md))؛ وأبقِ TSX لما يتغير كثيرًا أو يُسلَّم وقت التشغيل.
- التفاعلات: النقرة تغيّر حفنة من عناصر mount، لا عشرات.
- القوائم: virtual list (`virtual_list`، `List`) لكل ما هو طويل، مع حجم عنصر تقديري؛ وحالة كل عنصر في البيانات.
- الرسوم المتحركة: قيم متحركة، لا signals تُكتب في كل إطار.
- تأثيرات التمرير: `scroll_value` (`scrollValue`)، لا مستمع تمرير.
- المعالجات: لا عمل ثقيل لكل ضغطة مفتاح أو لكل حدث تمرير؛ خزّن مؤقتًا في `computed`.

<a id="see-also"></a>

## انظر أيضًا

- [تقرير الأداء](./performance-report.md)
- [البنية (Architecture)](./architecture.md)
- [الاختبار (Testing)](./testing-and-trace.md)
- [القوائم (Lists)](./lists.md)، [الرسوم المتحركة (Animation)](./animation.md)، [التفاعلية (Reactivity)](./reactivity.md)
