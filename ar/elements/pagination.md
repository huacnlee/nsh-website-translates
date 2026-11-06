---
title: "التصفّح بين الصفحات (Pagination)"
description: "مكوّن Pagination: صفحات مجموعة من العناصر للتنقّل بينها، مع الصفحات المحيطة بالصفحة الحالية، وعلامات الحذف (...)، وزرّي السابق والتالي، ومُنقّل مضغوط للصفحات، ودعم لوحة المفاتيح، وإبلاغ قارئات الشاشة بالصفحة الحالية، مع إمكانية تنسيقه من قِبل التطبيق."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# الترقيم (Pagination)

يتنقّل الترقيم (Pagination) بين صفحات مجموعة: نتائج بحث، أو صفوف جدول، أو أرشيف. ويعرض زر «السابق»، والصفحات المحيطة بالصفحة الحالية (الأولى والأخيرة تظهران دائمًا، مع علامة حذف لكل مقطع محذوف)، ثم العناصر الأبناء الخاصة بالتطبيق، ثم زر «التالي». وهو يتولى السلوك: أي الصفحات تظهر، والضغطات، ولوحة المفاتيح، وتعطيل «السابق» و«التالي» عند الطرفين، ومعلم التنقل (navigation landmark)، والصفحة الحالية لقارئات الشاشة. أما المظهر فمن شأن التطبيق: فلا لون للعناصر ولا حجم ولا تسمية خاصة بها، والتطبيق هو الذي ينسّقها أو يرسمها.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

يأتي `Pagination` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة (crate) `nsh-base` في Rust. في Rust، ينشئ `pagination()` عنصرًا واحدًا بدالة ضبط (setter) لكل خاصية (`.page(..)`، `.total_pages(..)`)، و`.on_change(..)` للصفحة التي يختارها المستخدم، ودوال التنسيق المكتوبة الأنواع (typed style methods) للصف، و`.child(..)` لمحتوى التطبيق.

<a id="the-page"></a>

## الصفحة

الصفحة من شأن التطبيق: `page` هي الصفحة الحالية، بدءًا من 1، و`onChange({ page })` يبلّغ بالصفحة التي اختارها المستخدم بالضغط على صفحة، أو على «السابق»، أو على «التالي». يضبطها التطبيق، ويحمّل تلك الصفحة، ويعرض صفوفها. أما `totalPages` فهو عدد الصفحات؛ وأي `page` بعد الأخيرة يعرض الأخيرة. ولا تُبلّغ الصفحة الحالية بشيء عند الضغط عليها، وكذلك «السابق» في الصفحة الأولى و«التالي» في الأخيرة.

<a id="the-pages-shown"></a>

## الصفحات المعروضة

مع `visiblePages` (5 على الأقل، وهو الافتراضي) يعرض الصف كل الصفحات ما دامت تتسع. وبعد ذلك يعرض الصفحة الأولى والأخيرة، والصفحة الحالية مع أكبر عدد من الصفحات على كل جانب بحسب ما يتسع، `(visiblePages - 3) / 2`، وعلامة حذف لكل مقطع من الصفحات المحذوفة:

| `page` من 20، `visiblePages={7}` | المعروض |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

عشرة آلاف صفحة تعرض العناصر السبعة نفسها. وقيمة `visiblePages` الفردية تجعل الصفحة الحالية في المنتصف.

<a id="items"></a>

## العناصر

يأخذ كل عنصر `itemClass` و`itemStyle` الخاصين بالتطبيق: الصفحة الحالية `selected:`، والعنصر الذي لا يقبل الضغط `disabled:`، والعنصر الذي عليه تركيز لوحة المفاتيح `focus:`. وتنسيق الصف من شأن التطبيق باستخدام `class` (صف افتراضيًا؛ `gap-*`، `justify-*`).

بدون `renderItem` تعرض الصفحة رقمها، وعلامة الحذف `…`، ويعرض «السابق» و«التالي» تسميتيهما لإمكانية الوصول (`‹` و`›` في حال عدم وجودهما). ويرسم `renderItem` محتوى كل عنصر انطلاقًا من `PaginationItemState`:

| الحقل | النوع | الوصف |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | ماهية العنصر. |
| `page` | `number` | رقم الصفحة؛ أو الصفحة التي ينتقل إليها «السابق» أو «التالي» (الصفحة الحالية عند الطرفين)؛ أو أول صفحة مخفية في علامة الحذف. |
| `start`، `end` | `number` | الصفحات التي تخفيها علامة الحذف: `start` مشمولة، و`end` (الصفحة التالية المعروضة) غير مشمولة. |
| `current` | `boolean` | الصفحة الحالية. |
| `disabled` | `boolean` | لا يقبل الضغط: «السابق» في الصفحة الأولى، و«التالي» في الأخيرة، وكل عناصر الترقيم المعطّل. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

علامة الحذف لا تقبل الضغط من تلقاء نفسها: وما تفعله من شأن التطبيق. ويسرد `Menu` مرسوم داخلها الصفحات التي تخفيها، كما يفعل `JumpMenu` أعلاه.

<a id="compact"></a>

## الوضع المضغوط

يعرض `compact` «السابق» والعناصر الأبناء و«التالي» فقط: منقّل للشاشات الضيقة، وتُذكر الصفحة في العناصر الأبناء.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

تقع العناصر الأبناء بعد الصفحات وقبل «التالي» في الشكلين: عدد الصفحات، أو حقل للانتقال إلى صفحة.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | مطلوب | الصفحة الحالية، بدءًا من 1؛ يضبطها التطبيق في `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | مطلوب | عدد الصفحات، 1 على الأقل. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | أكبر عدد من الصفحات يُعرض دفعة واحدة، بما فيها الأولى والأخيرة؛ 5 على الأقل. |
| `compact` | `.compact(..)` | `boolean` | `false` | «السابق» والعناصر الأبناء و«التالي» فقط. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا يقبل أي عنصر الضغط أو تركيز لوحة المفاتيح؛ وتُطبَّق أنماط `disabled:`، وتعلن قارئات الشاشة أنها معتمة (dimmed). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تسمّي به قارئات الشاشة التنقل: ما يجري ترقيمه. |
| `previousAccessibilityLabel`، `nextAccessibilityLabel` | `.previous_accessibility_label(..)`، `.next_accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة عن «السابق» و«التالي»، ومحتواهما عند غياب `renderItem`. |
| `itemClass`، `itemStyle` | `.item_class(..)`، `.item_style(\|s\| ..)` | `string`، `StyleProp<TextStyle>` | لا شيء | مظهر كل عنصر: `selected:` في الصفحة الحالية، `disabled:`، `focus:`؛ وتنتقل أنماط النص إلى محتواه. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | لا شيء | يرسم محتوى كل عنصر انطلاقًا من حالته. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | محتوى التطبيق بعد الصفحات وقبل «التالي». |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر الصف وتخطيطه. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: الصفحة التي اختارها المستخدم بالضغط على صفحة أو «السابق» أو «التالي». ولا تُبلَّغ الصفحة الحالية أبدًا. |

<a id="motion"></a>

## الحركة

تنتقل الصفحة الحالية من عنصر إلى عنصر وفق فئات `selected:` الخاصة بالتطبيق: `transition-colors` على `itemClass` يُخفت التمييز من الصفحة المغادَرة إلى الصفحة المقصودة. وتغيير الصفحة يُبقي كل عنصر في مكانه ويغيّر ما تعرضه العناصر، فلا يومض الصف أبدًا؛ وتتوقف انتقالات التطبيق مع تقليل الحركة (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## إمكانية الوصول

- الصف معلم تنقل (navigation landmark) يُسمّى بواسطة `accessibilityLabel`.
- كل صفحة، وكذلك «السابق» و«التالي»، زر. وتُعلَن الصفحة الحالية بوصفها الصفحة الحالية (`aria-current="page"` في ARIA) وهي محددة؛ أما «السابق» في الصفحة الأولى و«التالي» في الأخيرة فمعتمان (dimmed).
- على macOS والويب، تشكّل كل صفحة، وكذلك «السابق» و«التالي»، محطة لتركيز لوحة المفاتيح، ويضغطها Return وSpace. وتحتفظ الصفحة المضغوطة من لوحة المفاتيح بالتركيز بعد أن يعرضها التطبيق، أينما وقعت في الصف، وكذلك الصفحة الأولى أو الأخيرة عندما يصل إليها «السابق» أو «التالي».

انظر [إمكانية الوصول (Accessibility)](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات عمومًا.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغط هو نقرة بإصبع تنتهي على عنصر.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغط هو نقرة بالفأرة؛ وعلى macOS والويب يصل Tab إلى العناصر.
- ترسم كل المنصات ما ينسّقه التطبيق.
