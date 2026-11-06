---
title: "Carousel"
description: "Carousel ومكوّناته: شرائح تُعرض في مكان واحد في كل مرة، ويمكن التنقل بينها بالسحب باللمس، وعجلة الماوس ولوحة اللمس عبر التمرير الأصلي للمنصة، وبواسطة عناصر التحكم السابق والتالي، والترقيم الصفحي ولوحة المفاتيح، مع انتقال سلس عند الوصول إلى الطرفين. يتحكم Carousel في الشريحة المعروضة، والالتقاط عند حدود الشرائح (snapping)، والتكرار الدوري، والمفاتيح، وإمكانية الوصول؛ أما المظهر وكل التسميات النصية فهي من مسؤولية التطبيق."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

يعرض الـ carousel الشرائح واحدة في كل مرة: صور المنتج، أو خطوات التعريف بالتطبيق، أو لافتة تنتقل من تلقاء نفسها، أو صفًا من البطاقات. يتولى `Carousel` السلوك: أي شريحة تظهر، والتمرير بين الشرائح، وعنصرا التحكم السابق والتالي، والترقيم (pagination)، ومفاتيح الأسهم، والانتقال الدائري عند الأطراف، وما يسمعه قارئو الشاشة. تجد أجزاؤه الـ carousel عبر السياق (context)، فيرتبها التطبيق بحرية في تخطيطه. أما المظهر فهو من شأن التطبيق: لا ألوان ولا أحجام ولا أسهم ولا نقاط ولا تسميات من الـ carousel نفسه.

المحتوى عبارة عن native scroll view. يحرّك الإصبع وعجلة الفأرة ولوحة اللمس الشرائح على الخيط الرئيسي للمنصة، في الإطار نفسه الذي يتحرك فيه المؤشر، وعند الإفلات يستقر المحتوى على أقرب شريحة، بشريحة واحدة لكل swipe سريع. وعندما يستقر المحتوى يبلّغ الـ carousel عن الشريحة عبر `onChange`. أما عناصر التحكم والترقيم والمفاتيح و`index` الخاص بالتطبيق فتمرّر المحتوى أصليًا إلى الشريحة، بحركة متحركة.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

يأتي `Carousel` وأجزاؤه من [`nsh/base`](../modules/nsh-base.md)، وهي `nsh-base` crate في Rust. الشريحة المعروضة هي `index` الخاصة بالتطبيق: يبلّغ التمرير أو عنصر التحكم أو المفتاح عن الشريحة التالية عبر `onChange`، ويمرّر الـ carousel إلى `index` التي يعيدها التطبيق. تبقى الشريحة التي استقر عليها التمرير معروضة إلى أن يجيب التطبيق عن `onChange` الخاص بها: تبقى إذا أعادها التطبيق بوصفها `index`، ويرتد المحتوى إلى شريحة التطبيق بحركة متحركة إذا أبقى التطبيق على `index` التي كانت لديه. وعند غياب `index` يحتفظ الـ carousel بقيمته الخاصة، انطلاقًا من `defaultIndex`. في Rust تنشئ `carousel()` و`carousel_content()` و`carousel_item()` و`carousel_previous()` و`carousel_next()` و`carousel_pagination()` و`carousel_pagination_item()` الأجزاء، مع setter لكل خاصية (`.index(..)`)، وlistener لكل حدث (`.on_change(..)`)، وطرق الأنماط typed، و`.child(..)` لمحتواها.

<a id="props"></a>

## الخصائص

<a id="carousel-1"></a>

### Carousel

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | لا شيء | الشريحة المعروضة، تبدأ من 0 وتُقيَّد بعدد الشرائح الموجودة. يملكها التطبيق: يُبلَّغ عن التغييرات عبر `onChange`، وقيمة `index` جديدة تمرّر إلى هناك بحركة متحركة. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | الشريحة المعروضة في البداية، ما دام `index` غير مضبوط. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | الاتجاه الذي تتعاقب فيه الشرائح؛ يُقرأ عند إنشاء الـ carousel. مفتاحا الأسهم في الـ carousel العمودي هما Up وDown. |
| `looping` | `.looping(..)` | `boolean` | `false` | تدور الشرائح: بعد الأخيرة تأتي الأولى، وقبل الأولى تأتي الأخيرة، بسلاسة، في التمرير والسابق والتالي والمفاتيح و`index` الخاص بالتطبيق على حد سواء ([التكرار الدائري](#looping)). يُقرأ عند إنشاء الـ carousel. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما يسمّي به قارئو الشاشة الـ carousel، وهو منطقة (region): ما هي شرائحه (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | `CarouselContent` وعناصر التحكم وكل ما يرتبه التطبيق حولها. |
| `class`، `style` | style methods | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط الـ carousel: أين يوضع المحتوى وعناصر التحكم. |

### CarouselContent

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | لا شيء | `CarouselItem`، وكل واحدة منها عنصر فرعي للمحتوى. |
| `class`، `style` | style methods | `string`، `StyleProp<ViewStyle>` | لا شيء | حجم منطقة العرض (viewport)، والمسار الذي تشكّله الشرائح فيها: `gap` بينها، وحشوة تُظهر جزءًا من الشرائح المجاورة للشريحة المعروضة. |

### CarouselItem

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما يسمّي به قارئو الشاشة الشريحة، وهي مجموعة (group): موضعها بين الشرائح الأخرى وما تعرضه (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | محتوى الشريحة. |
| `class`، `style` | style methods | `string`، `StyleProp<ViewStyle>` | لا شيء | حجمها على امتداد المحور (`w-full` لشريحة واحدة في كل عرض، و`basis-1/3` لثلاث) ومظهرها. في carousel دائري تكون إزاحتها (translation) من شأن الـ carousel: ضع `transform` على view داخلها. |

### CarouselPrevious, CarouselNext

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | اسم عنصر التحكم، حين لا يكون في عناصره الفرعية نص يدل عليه (أيقونة سهم). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | أيقونة التطبيق أو تسميته. |
| `class`، `style` | style methods | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهره وموضعه: بجانب المحتوى، أو `absolute` فوق حافته. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمطه عند الضغط عليه، أو تمرير المؤشر فوقه، أو حصوله على التركيز، أو تعطيله عند أحد الطرفين، بوصفها فئات `<state>:`. |

### CarouselPagination

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما يسمّي به قارئو الشاشة مجموعة عناصر الترقيم (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | لا شيء | فئات Tailwind الخاصة بالمؤشر (indicator)، وهو view على عنصر الشريحة المعروضة (قرص خلف النقاط، أو خط سفلي): مظهره وموضعه عبر الصف (`inset-y-0`، `bottom-0 h-0.5`). وعلى امتداد الصف يغطي ذلك العنصر ويقفز إلى العنصر التالي أصليًا. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | نمط المؤشر، فوق `indicatorClass`. وبدون أي منهما لا يكون للترقيم مؤشر. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | `CarouselPaginationItem` وكل ما يرتبه التطبيق بينها. |
| `class`، `style` | style methods | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط الصف (`flex-row gap-2`). |

### CarouselPaginationItem

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | مطلوب | الشريحة التي يمثلها، تبدأ من 0. العنصر الذي يتجاوز فهرسه الشريحة الأخيرة يكون معطّلًا. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | نمطه أثناء ظهور شريحته، بوصفه فئات `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | أي شريحة يمثل (`"Slide 3"`)، حين لا يكون في عناصره الفرعية نص يدل عليها (نقطة). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | نقطة التطبيق أو صورته المصغرة أو رقمه. |
| `class`، `style` | style methods | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهره؛ وفئات `group-selected:` داخله تتبعه ضمن `group`. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | انتقل المستخدم إلى شريحة أخرى: استقر التمرير أو العجلة أو لوحة اللمس عليها، أو طلبها عنصر تحكم أو عنصر ترقيم أو مفتاح. `{ index }` هي تلك الشريحة. قيمة `index` جديدة من التطبيق لا تُبلِّغ عن شيء. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | بدأ المستخدم سحب المحتوى (بإصبع أو بلوحة اللمس). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | استقر المحتوى الذي سحبه المستخدم. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | دخل تركيز لوحة المفاتيح إلى الـ carousel: إلى view الخاص به، أو عنصر التحكم السابق أو التالي، أو عنصر ترقيم، أو view قابل للتركيز داخل شريحة. التنقل بينها لا يُبلِّغ عن شيء. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | غادر تركيز لوحة المفاتيح الـ carousel: view الخاص به وعناصر التحكم وعناصر الترقيم ومحتوى الشرائح. |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بـ | الحالات |
|---|---|---|---|
| الـ carousel | | `Carousel`: `class`، `style` | `focus:` |
| المحتوى | الـ carousel | `CarouselContent`: `class`، `style` | |
| شريحة | المحتوى | `CarouselItem`: `class`، `style` | |
| السابق، التالي | الـ carousel | `class`، `style` الخاصان بهما | `disabled:`، `active:`، `hover:`، `focus:` |
| الترقيم | الـ carousel | `CarouselPagination`: `class`، `style` | |
| المؤشر | الترقيم | `indicatorClass`، `indicatorStyle` | |
| عنصر ترقيم | الترقيم | `class`، `style` الخاصان به | `selected:`، `disabled:`، `active:`، `hover:`، `focus:` |

<a id="several-slides-per-view"></a>

## عدة شرائح في كل عرض

عرض الشريحة يحدده صنفها (class) الخاص، لذا فصف من البطاقات هو عدة شرائح داخل منطقة العرض. كل شريحة نقطة التقاط (snap point) عند بدايتها: يستقر المحتوى بحيث تكون تلك الشريحة حيث تستقر الأولى، فتُحفظ الحشوة التي قبل الأولى قبل كل شريحة. وعند نهاية المدى تستقر الشرائح التي لا تبلغ ذلك الموضع مع الأخيرة، ويتوقف التالي هناك. يسمّي `index` الشريحة في الموضع الأول؛ أما الشرائح التي تستقر مع الأخيرة فتُظهر الموضع نفسه، ويُبلَّغ عند التمرير هناك عن أولاها:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

يُظهر `basis-1/2` بعرض هاتف، أو `basis-[85%]`، جزءًا من البطاقة التالية. أما الـ carousel العمودي (`axis="vertical"`) فيحدد أحجام شرائحه بحسب ارتفاعها.

<a id="looping"></a>

## التكرار الدائري

مع `looping` تدور الشرائح بسلاسة: بعد الأخيرة تأتي الأولى، سواء بالتمرير أو بالانتقال بالتالي أو بالمفاتيح، أو بضبط `index` الخاص بالتطبيق، دون إرجاع للشرائح التي بينهما. يحتفظ المحتوى بمساحة دورة كاملة من الشرائح قبلها وبعدها، ويرسم كل شريحة حيث تكون أقرب إلى منتصف العرض؛ وتجري الحركة ذلك على إطارات المنصة نفسها، مع التمرير. كل شريحة موجودة مرة واحدة فقط: يراها قارئو الشاشة والترقيم مرة واحدة.

يكون التكرار سلسًا ما دامت الشرائح تغطي منطقة العرض وشريحة إضافية (ثلاث شرائح بعرض كامل، أو خمس بعرض ثلث). ومع عدد أقل، يبقى السابق والتالي والمفاتيح تدور، لكن بالتمرير راجعًا عبر الشرائح.

<a id="slides-that-move-on-by-themselves"></a>

## شرائح تنتقل من تلقاء نفسها

اللافتة التي تتحرك تلقائيًا من شأن التطبيق: مؤقّت يضبط `index`. يبلّغ الـ carousel بوقت تفاعل المستخدم معه، فينتظر المؤقت حينها، كما يطلب [نمط carousel في WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): `onDragStart` / `onDragEnd` حول السحب، و`onFocus` / `onBlur` ما دام تركيز لوحة المفاتيح داخل الـ carousel (عليه، أو على عناصر التحكم فيه، أو الترقيم، أو محتوى الشرائح)، ومؤشر الفأرة فوق view يحيط به. أوقفه عند تفعيل تقليل الحركة، وامنح المستخدمين زرًّا يوقفه (عنصر التحكم في التدوير):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

قراءة `index()` داخل الـ effect تبدأ فترة كاملة من جديد بعد كل تغيير، بما فيه تغيير المستخدم. ومع `looping`، يتحرك الانتقال من الشريحة الأخيرة إلى الأولى إلى الأمام عبر الوصلة.

<a id="accessibility"></a>

## إمكانية الوصول

- الـ carousel منطقة (region) تسمّيها `accessibilityLabel`؛ وكل شريحة مجموعة (group) تسمّيها تسميتها الخاصة (موضعها بين الشرائح الأخرى وما تعرضه).
- السابق والتالي زرّان (buttons)، يُعطَّلان عند الطرفين ما لم يكن الـ carousel دائريًا؛ وكل عنصر ترقيم زر، يكون محددًا (selected) ما دامت شريحته معروضة.
- كل تسمية من التطبيق، وبلغة التطبيق.
- كل شريحة في الـ carousel الدائري موجودة مرة واحدة، أينما رُسمت.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب، حيث يصل Tab إلى الـ views التي تستقبل الضغطات، يكون الـ carousel نقطة توقف لتركيز لوحة المفاتيح، وكذلك عناصر التحكم فيه وعناصر الترقيم. وما دام أحدها يملك التركيز:

| المفتاح | ما يفعله |
|---|---|
| Left، Right (Up، Down عند الاتجاه العمودي) | ينتقل إلى الشريحة السابقة أو التالية، مع الدوران عند الأطراف أثناء التكرار الدائري. |
| Home، End | ينتقل إلى الشريحة الأولى أو الأخيرة. |
| Space، Return | يضغط عنصر التحكم أو عنصر الترقيم المركَّز عليه. |

في التخطيط من اليمين إلى اليسار تتتابع شرائح الـ carousel الأفقي من اليمين، فينقل Left إلى الشريحة التالية وRight إلى السابقة؛ أما الـ carousel العمودي فيحتفظ بـ Up وDown. وعنصر التحكم الذي يصبح معطّلًا وهو يملك التركيز (التالي في الشريحة الأخيرة) يسلّم التركيز إلى الـ carousel، فتستمر المفاتيح في العمل هناك. أما الـ views القابلة للتركيز التي يضعها التطبيق داخل الشرائح فتحتفظ بمفاتيحها: أسهم حقل الإدخال تحرك مؤشر الكتابة فيه.

<a id="motion"></a>

## الحركة

- يحرّك التمرير والعجلة ولوحة اللمس الشرائح مع المؤشر، في الإطار نفسه: المنصة هي التي تمرّرها.
- عند الإفلات ينساب المحتوى إلى أقرب شريحة، بشريحة واحدة لكل swipe سريع، كما تلتقط المنصة.
- السابق والتالي وعنصر الترقيم والمفتاح و`index` الخاص بالتطبيق تمرّر المحتوى إلى الشريحة بحركة متحركة؛ ومع تقليل الحركة، فورًا.
- يقفز مؤشر الترقيم إلى عنصر الشريحة المعروضة؛ ومع تقليل الحركة ينتقل فورًا.
- `looping` ينتقل من الشريحة الأخيرة إلى الأولى بخطوة إلى الأمام عبر الوصلة؛ وحين يستقر المحتوى يرجع بدورة كاملة دون حركة، وهذا لا يغيّر شيئًا على الشاشة.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: يمرّر الإصبع الشرائح؛ والنقرة تضغط عنصر تحكم.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: تمرّر العجلة ولوحة اللمس الشرائح، والنقر يضغط عنصر تحكم. أما سحب الفأرة فوق المحتوى فمن شأن التطبيق، كما في كل scroll view هناك.
- ترسم كل منصة ما ينسّقه التطبيق: الشرائح وعناصر التحكم والترقيم ومؤشره.
