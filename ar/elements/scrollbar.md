---
title: "Scrollbar"
description: "مكوّن Scrollbar: شريط تمرير بمظهر خاص بالتطبيق لكل عرض تمرير وقائمة (عبر سمة تُضبط مرة واحدة) أو لعرض واحد فقط، يوضع حيث يريد التطبيق، ويتبع مقبضه المحتوى، وتؤدي عمليات السحب والضغط عليه إلى تمرير المحتوى، ويظهر أثناء التمرير أو عند تمرير المؤشر فوقه أو دائمًا، ويظهر ويختفي تدريجيًا وفق توقيت التطبيق."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# Scrollbar

يمنح شريط التمرير عرضَ تمرير أو قائمةً شريطًا بمظهر التطبيق نفسه: مقبضًا رفيعًا بشكل حبّة يتسع تحت المؤشر، ومسارًا بنغمة العلامة التجارية، وشريطًا بجانب ترويسة ثابتة أو على امتداد لوحتين. عند ضبطه مرة واحدة كسمة للتطبيق، يرسم كل عرض تمرير وكل قائمة شريطًا بدلًا من مؤشر المنصة ([الأشرطة المدمجة](#built-in-bars))؛ وعندما يضعه التطبيق بنفسه، فإنه يحدد عرض التمرير الذي يحرّكه ويقع حيثما يضعه التطبيق. وهو يملك سلوكه: يتبع طولُ المقبض ومكانه المحتوى ونافذة العرض والإزاحة (حتى عندما تنمو القائمة أو يتغير حجم النافذة)؛ وسحب المقبض يمرّر المحتوى، والضغط على المسار ينقل منتصف المقبض إلى موضع الضغط؛ ويظهر أثناء تمرير المحتوى، أو أثناء وجود المؤشر فوقه، أو دائمًا، ويظهر ويتلاشى بشكل أصلي. أما المظهر والتوقيت فهما من شأن التطبيق: فـ `Scrollbar` لا يملك ألوانًا ولا أحجامًا ولا أنصاف أقطار خاصة به، ولا تستغرق عمليات التلاشي فيه أي زمن حتى يمنحها التطبيق بعضًا منه.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

يأتي `Scrollbar` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة (crate) `nsh-base` في Rust. في Rust، ينشئ `scrollbar()` شريطًا بدالة ضبط (setter) لكل خاصية (`.scroll(..)`، `.thumb_style(..)`) ودوال النمط المطبوعة للشريط نفسه؛ ويقبل `scroll` فيه `ElementRef` (أو `ScrollbarTarget`).

<a id="built-in-bars"></a>

## الأشرطة المدمجة

يمكن لكل عرض تمرير ولكل قائمة أن يرسم `Scrollbar` بدلًا من مؤشر المنصة، دون الحاجة إلى وضع شريط: يمنح `Scrollbar.setTheme` مظهر التطبيق لشريط كل عرض تكون قيمة `scrollbar` فيه `true`، مرة واحدة، أينما بدأ التطبيق. ينال كل عرض شريطه الخاص فوق نافذة العرض الخاصة به، ويبقى فيها أثناء تمرير المحتوى (على الخيط الرئيسي، كما تفعل العروض اللاصقة) ويُرسم فوق المحتوى؛ وهو يتبع ويتمرر ويتلاشى كما يفعل `Scrollbar` الموضوع يدويًا.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

يضم `ScrollbarTheme` الخصائص التي تتطابق في أشرطة جميع العروض، ومظهر كل محور:

| الحقل | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | متى تظهر الأشرطة: [متى يظهر](#when-it-shows). |
| `motion` | `ScrollbarMotion` | يظهر ويختفي فورًا، `idle` `2000` | كيف تظهر وتختفي: [الحركة](#motion). |
| `minThumbLength` | `number` | `48` | أقصر طول يبلغه المقبض. |
| `vertical`، `horizontal` | `ScrollbarLook` | لا شيء | مظهر أشرطة العروض العمودية والأفقية: `class` و `style` للمسار، ويوضعان في نافذة عرض العرض؛ و `thumbClass` و `thumbStyle`؛ `accessibilityLabel`. يحتفظ العرض الذي لا مظهر لمحوره بمؤشر المنصة. |

يعيد `setTheme` لاحق تنسيق الأشرطة، ويعيد `Scrollbar.setTheme(null)` مؤشر المنصة إلى العروض. ويمكن لعرض واحد أن يأخذ سمة خاصة به كخاصية `scrollbar` (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`)، سواء ضبط التطبيق سمة أم لا؛ ويترك `scrollbar={false}` العرض بلا شريط. والقائمة المرتّبة داخل نافذة عرض أصلها (`viewport="parent"`) تتمرر مع ذلك العرض ومع شريطه. ويحصل `Input` متعدد الأسطر على شريط المظهر العمودي أيضًا، فوق نصه الذي يمرّره كما يفعل مؤشر عرض النص نفسه.

<a id="the-scroll-view-it-moves"></a>

## عرض التمرير الذي يحرّكه

يحدد `scroll` عرض التمرير أو القائمة التي يتبعها الشريط: أي `ref` الخاص به. يعثر الشريط عليه بعد ظهوره على الشاشة، لذا يجوز ضبط `ref` بواسطة عنصر لاحق في عملية العرض نفسها؛ اكتب الشريط بعد عرض التمرير الخاص به (أو احتفظ بـ `ref` في signal). أوقف مؤشر عرض التمرير الأصلي بـ `scrollbar={false}`، وضع الشريط بـ `class`: فوق حافة عرض التمرير داخل صندوق `relative` يضم الاثنين، أو في أي مكان آخر على الشاشة.

- يبلغ طول المقبض نسبة المحتوى التي تعرضها نافذة العرض، على امتداد صندوق محتوى المسار (داخل حشوته)، ولا يقل عن `minThumbLength`. ويدل موضعه على مقدار ما تمرّر من المحتوى؛ وعندما يرتد المحتوى متجاوزًا أحد طرفيه، يبقى المقبض عند ذلك الطرف.
- يمرّر سحب المقبض المحتوى بقدر ما يتحرك المقبض. ويجلب الضغط على المسار منتصف المقبض إلى موضع المؤشر، ويتابع السحب من هناك.
- يتبع الشريط العمودي عرض تمرير عموديًا؛ ويصنع `axis="horizontal"` شريطًا لعرض أفقي (ضعه على امتداد الحافة السفلية). شريط واحد لكل محور.
- تعمل القوائم بالطريقة نفسها: يتبع المقبض الطول الكامل للقائمة مع قياس الصفوف وإضافتها.

<a id="when-it-shows"></a>

## متى يظهر

| `mode` | يظهر |
|---|---|
| `"scrolling"` (الافتراضي) | أثناء تمرير المحتوى، وحتى `motion.idle` بعد توقفه؛ ووجود المؤشر على الشريط أثناء ظهوره يُبقيه ظاهرًا. |
| `"hover"` | أثناء وجود المؤشر فوق الشريط (حيث يظهر، حتى وهو مخفي)، وكما يفعل `"scrolling"`. |
| `"always"` | دائمًا. |

في كل الأوضاع يظهر أثناء سحب مقبضه، ويبقى `motion.idle` بعد آخر تمرير أو سحب أو تحويم. وما دام المحتوى يتسع في نافذة العرض، يبقى مخفيًا. وعندما يكون مخفيًا، يكون الشريط عند `opacity: 0` ويمرّر الضغطات إلى ما تحته.

<a id="motion"></a>

## الحركة

يحدد `motion` توقيت عمليات تلاشي الشريط، التي تعمل بشكل أصلي، كما يفعل `ScrollbarMotion` في `gpui-base`:

| الحقل | الافتراضي | الوصف |
|---|---|---|
| `idle` | `2000` | المدة التي يبقى فيها الشريط بعد آخر تمرير أو سحب أو تحويم، بالميلي ثانية. |
| `enter` | `0` | المدة التي يستغرقها ظهوره: تزداد عتامته خطيًا، وتتباطأ الحركة المنزلقة في نهايتها. |
| `exit` | `0` | المدة التي يستغرقها تلاشيه بعد انتهاء `idle`، مع تسارع في البداية؛ وينزلق خارج مساره أثناء تلاشيه. |
| `entrance` | `"fade"` | كيف يدخل: `"fade"` في مكانه، أو `"slideAndFade"` من الحافة التي يقع عليها (اليمين، الأسفل). |
| `thumbHoverEntrance` | `"fade"` | كيف يدخل عندما يُظهره المؤشر الموجود على مقبضه المخفي (`"hover"`). |

من دون مدد زمنية يظهر الشريط ويختفي فورًا. ويحتفظ التلاشي المعكوس في منتصفه بسرعته: إذ يستمر بقدر النسبة المتبقية من مدته. ولا يتحرك شريط `"always"` أبدًا، ولا أي شريط عندما يطلب المستخدم حركة أقل. ويقص المسار ما ينزلق. أما حركة المقبض نفسه، مثل عرض ينمو عند `hover:`، فهي من شأن نمطه (`transition-all` على `thumbClass`).

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | لا شيء | عرض التمرير أو القائمة التي يتبعها الشريط ويحرّكها (`ref` الخاص بها). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | محور عرض التمرير: يمتد المسار على طوله. يُقرأ عند إنشاء الشريط. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | متى يظهر الشريط. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | يظهر ويختفي فورًا، `idle` `2000` | كيف يظهر ويختفي: [الحركة](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | أقصر طول يبلغه المقبض مع المحتوى الطويل، ليبقى سهل الإمساك. |
| `thumbClass`، `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المقبض. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة عن الشريط. |
| `class`، `style` | دوال النمط | `string`، `StyleProp<ViewStyle>` | لا شيء | الشريط: مساره، حيث يضعه التطبيق. |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بـ |
|---|---|---|
| المسار | حيث يضعه التطبيق | `class`، `style` |
| المقبض | صندوق محتوى المسار | `thumbClass`، `thumbStyle` |

يحدد الشريط طول المقبض على امتداد المحور ويحرّكه؛ أما سماكته وموضعه عبر المسار فمن شأن التطبيق (فـ `w-1.5` و `items-end` على المسار يضعان مقبضًا بسماكة 6 نقاط على اليمين). وتُبعد حشوة المسار المقبض عن طرفيه وجانبيه.

الحالات التي تظهر على الأجزاء:

- المسار: `hover:` تحت المؤشر؛ وهو `group`، فيأخذ المقبض `group-hover:` منه (مقبض يتسع عند اقتراب المؤشر).
- المقبض: `hover:` تحت المؤشر، و `active:` أثناء سحبه.

ظهور الشريط هو عتامته: امنح شفافية الألوان لخلفية المسار أو للمقبض. والمقبض الذي يتسع يأخذ `transition-all` (فلا يؤخر أبدًا موضع المقبض، الذي يحدده الشريط بمعزل عن أنماط المقبض)، ويُبقيه `motion-reduce:` ثابتًا للأشخاص الذين يطلبون حركة أقل.

<a id="accessibility"></a>

## إمكانية الوصول

- يظل عرض التمرير هو ما تمرّره قارئات الشاشة: فهي تحرّكه بإيماءاتها الخاصة وتقرأ محتواه.
- يُوسَم الشريط بـ `accessibilityLabel` لقارئات الشاشة التي تصل إليه.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإجراءات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- ترسم كل منصة ما ينسّقه التطبيق، ويتبع المقبض الإزاحة التي تبلغ عنها كل منصة لعرض التمرير. ويعمل سحب المقبض والضغط على المسار بالفأرة أو بالقلم أو بالإصبع.
- يتبع `"hover"` مؤشر الفأرة أو لوحة اللمس (أنظمة سطح المكتب والويب)؛ وعلى شاشة اللمس يظهر الشريط أثناء تمرير المحتوى، ويترك مساره المخفي اللمسات تمر.
