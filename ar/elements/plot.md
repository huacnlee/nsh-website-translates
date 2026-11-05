---
title: "Plot"
description: "مكوّن Plot من nsh/base/plot، وعلاماته Line وArea وBar وRule وDot وCell وGrid وPie وArc وRadialLine وRadialGrid وSankey وTreemap، ومكوّنا PlotAxis وPlotLabel: مخططات تُرسم أصلياً (natively) انطلاقاً من صفوف التطبيق، مع مقاييس المحاور وتسمياتها، والنصوص عند نقاط البيانات، والصف أو الخلية أو الشريحة الواقعة تحت المؤشر، والحركة، ومن دون أي مظهر خاص بها."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---

# Plot

Plot هو إطار المخطط البياني: صفوف البيانات التي يعرضها، ومقياسا محوريه x وy، والمؤشر فوقه وحركته. ترسم علاماته (marks) ما يحتويه: `Line` عبر سلسلة، و`Area` بين سلسلة وخط أساس، و`Bar` لكل صف في نطاقات مقياس نطاقات، و`Rule` لكل صف من بداية إلى نهاية (فتيل الشمعة)، و`Dot` لكل صف حيث تلتقي قيمتان من قيمه (نقاط مخطط التبعثر، وفقاعات المخطط الفقاعي)، و`Cell` لكل صف في نطاقات فئتين، ملوّنة بقيمته (خريطة حرارية)، و`Grid` من الخطوط عرضًا، و`Pie` من حصص الصفوف (دونات بثقب)، و`Arc` بين زاويتين، و`RadialLine` حول المركز تقف خلفه حلقات ومحاور `RadialGrid` (مخطط رادار)، و`Sankey` من التدفقات بين الصفوف، و`Treemap` من مستطيلات متداخلة تساوي مساحة كل ورقة فيها قيمتها (خريطة سوق)؛ ويضع `PlotAxis` تسميات على حافة بعلامات مقياسها، ويكتب `PlotLabel` نصوصًا عند نقاط من المقاييس. كل علامة هي canvas واحدة تملأ plot، وتُرسم محليًا من الصفوف: تُقرأ صفوف التطبيق مرة واحدة عندما يضبطها، ثم تُقاس وتُسجَّل وتُرسم في Rust، فلا يشغّل مخطط من ألف نقطة أي JS لكل نقطة. ويُتابَع المؤشر في Rust أيضًا: ينتقل خط التقاطع الخاص بالتمرير ونقاطه وتلميحه ويتلاشى على animator المنصة، ولا يعرف التطبيق سوى صف جديد، لا أكثر. المظهر من شأن التطبيق: ترسم العلامات بخصائص الطلاء في CSS الخاصة بأشكال SVG (`stroke-*`، `fill-*`)، و`currentColor` حيث لا يُحدَّد شيء، وتعرض المساحة أو الشريط خلفية (تدرجًا، `bg-linear-*`) داخل شكلها، وأجزاء التمرير (ومنها نقطة كل علامة) وتسميات المحاور وعلامات التدريج وخطوطها كلها يتولى التطبيق تنسيقها وملأها.

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`، `Line`، `Area`، `Bar`، `Rule`، `Dot`، `Cell`، `Grid`، `Pie`، `Arc`، `RadialLine`، `RadialGrid`، `Sankey`، `Treemap`، `PlotAxis` و`PlotLabel` تأتي من `nsh/base/plot`، وهي وحدة من [`nsh/base`](../modules/nsh-base.md) خاصة بها (في Rust، `nsh_base::plot`). في TypeScript تكون خصائص plot عامة (generic) بحسب نوع صفوفه: تُفحص أسماء الحقول مقابله، وتحصل الدالة المطبَّقة على صف على نوع ذلك الصف. في Rust، ينشئ `plot()` واحدًا بمُعيِّن (setter) لكل خاصية، والصفوف `Rows` (أعمدة من الأرقام بحسب المفتاح)، والقيم `RowAccessor` (مفتاح أو دالة من فهرس الصف)، وتأخذ العلامات دوال الطلاء المكتوبة الأنواع (`.stroke_color(..)`، `.fill_color(..)`، `.stroke_width(..)`).

<a id="plot-1"></a>

## Plot

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (مطلوب) | الصفوف، كائن واحد لكل نقطة. تقرأ العلامات قيمها مرة واحدة، عندما يضبط التطبيق الصفوف؛ ويُتخطى الصف الذي لا قيمة له (حقل ليس رقمًا، `null`). |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | فهرس الصف | ما يحدد موضع الصف على المحور x في مقياس x من النوع `linear`. أما مقياس `point` فيضع الصفوف بالترتيب. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | لا شيء | ما ترسمه العلامات ما لم تسمِّ علامة ما يخصها. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | كيف يضع المحور x الصفوف: `point` (بالترتيب، بتباعد متساوٍ من الحافة اليسرى إلى اليمنى؛ ويقع صف واحد في الوسط)، أو `linear` مع `domain` اختياري، أو `band` (نطاق لكل صف، للأشرطة، [Bar](#bar)؛ أو نطاق لكل فئة، للخلايا، [Cell](#cell)). ومع مقياس y من النوع `band` يكون الافتراضي `linear`، للأشرطة الأفقية. ويجعله `reverse: true` يبدأ من الحافة اليمنى ([المقاييس المعكوسة](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | كيف يضع المحور y القيم: أصغر قيمة في المجال عند الحافة السفلية، وأكبرها عند العلوية. وبدون `domain` يكون المجال امتداد ما ترسمه العلامات. ويضع `band` نطاقًا لكل صف من الحافة العلوية نزولًا، للأشرطة الأفقية. ويعكسه `reverse: true`: أصغر قيمة عند الحافة العلوية، والصفوف من الحافة السفلية صعودًا ([المقاييس المعكوسة](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | لا شيء | مقياس y ثانٍ، `{ type: "linear", domain?, reverse? }`، للعلامات التي تسميه (`scale="y2"`): المقياس الأيمن في مخطط ثنائي المحور ([المحاور المزدوجة](#dual-axes)). وبدون `domain` يكون امتداد القيم الموضوعة عليه. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | ما دام أي من مقياسي y لا يسمّي مجالًا وتوجد علامات على كليهما، يُوسَّع كلاهما إلى الخطوات المستديرة نفسها لتقع علاماتهما على الخطوط نفسها ([المحاور المزدوجة](#dual-axes)). ويُبقي `false` كلًّا منهما على امتداد قيمه. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | يتابع plot المؤشر ولوحة المفاتيح: فيبلّغ عن الصف الواقع تحته ويعرض أجزاء التمرير، وهو محطة توقف لمفتاح Tab تحرّك مفاتيح الأسهم فيه التمرير ([لوحة المفاتيح](#keyboard)). ويرسم `false` العلامات فقط (sparkline في قائمة)، وتذهب الضغطات عليه إلى العروض المحيطة به. أما تقديم plot للوحة المفاتيح من الأساس فيُحدَّد عند إنشائه. |
| `motion` | `.motion(..)` | `PlotMotion` | لا شيء | توقيت الظهور، وتلاشي التمرير دخولًا وخروجًا، والزنبرك الذي ينزلق عليه التمرير عندما تحرّكه المفاتيح (أدناه). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | لا شيء | يفعّل الظهور: تُرسم العلامات تدريجيًا عندما يُعرض plot أول مرة، ومجددًا كلما تغيّر هذا (رمز آخر، فترة أخرى). داخل [`PlotAppearScope`](#plotappearscope)، يظهر الجيل الذي انتهى هناك كاملًا دفعة واحدة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة عن المخطط: ما يعرضه وما يبرز فيه. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | لا شيء | ما تسمعه قارئات الشاشة بوصفه قيمته: كلمات التطبيق للصف الواقع تحت المؤشر. |
| `crossLineClass`، `crossLineStyle` | `.cross_line_class(..)`، `.cross_line_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الخط المتقاطع: عرض بارتفاع plot، متمركز على الصف الواقع تحت المؤشر. وعلى مقياس نطاقات يقع في نطاق الصف، بعرض النطاق (عبر plot على مقياس y ذي نطاقات). |
| `dotClass`، `dotStyle` | `.dot_class(..)`، `.dot_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | نقاط التمرير: عرض لكل من `Line` و`Area` و`RadialLine`، متمركز على نقطته عند الصف الواقع تحت المؤشر، ويكون حجم عرض `Dot` بحجم نقطته تحت المؤشر. وتحل `hoverDotClass` / `hoverDotStyle` الخاصة بعلامة محلها لنقطتها. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | لا شيء | تلميح التطبيق (tooltip)، يضعه `tooltipPlacement` ويتحرك ويتلاشى مع الخط المتقاطع. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | أين يوضع التلميح: أعلى plot، متمركزًا على الخط المتقاطع؛ أو بجانب المؤشر، على جانب الخط المتقاطع المتجه نحو منتصف plot، وتحت المؤشر في النصف العلوي، وفوقه في النصف السفلي. وفي الأعلى يبقى بين حافتي plot اليسرى واليمنى (إزاحته عن الحافة العلوية من شأن التطبيق: فالوسم تحت plot يأخذ ارتفاع plot وأكثر)؛ وبجانب المؤشر يبقى داخل plot. ومع لوحة المفاتيح يذهب بجانب نقطة أول خط أو مساحة عند الصف (منتصف نطاق الشريط، ومنتصف شريحة pie). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | المسافة بين التلميح وما يضعه: الحافة العلوية لـ `"top"`، والخط المتقاطع والمؤشر لـ `"pointer"`. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | لا شيء | ألوان العلامات: من الفئات التي يقرؤها `color` الخاص بها، كما في `scaleOrdinal` في d3 (`{ type: "ordinal", domain?, range, unknown? }`، [الألوان حسب الفئة](#colors-by-category))، أو من الأرقام التي يقرؤها `value` الخاص بـ `Cell` على طول تدرج، كما في `scaleSequential` و`scaleDiverging` في d3 (`{ type: "sequential" \| "diverging", … }`، [الألوان على طول تدرج](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | العلامات، تُرسم بالترتيب فوق بعضها، وكل ما يضعه التطبيق فوقها. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | حجم plot ومظهره؛ وترث العلامات خصائص الطلاء الخاصة به، كما يرثها CSS. ويرسم صنفا `focus:` / `focus-visible:` و`focusStyle` حلقة التركيز الخاصة به. |

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | جاء المؤشر فوق صف آخر: فهرس الصف الأقرب إليه على طول المحور x (على طول المحور y عندما يكون له وحده نطاقات)، أو شريحة [pie](#pie-and-arc) الواقعة تحته، أو [dot](#dot) الذي مركزه الأقرب إليه، أو [cell](#cell) الواقعة تحته (وعبر الفجوة بين خليتين، الأقرب منهما)، أو صف [radial line](#radialline-and-radialgrid) الأقرب إليه بحسب الزاوية؛ و`null` عندما يغادر plot (فوق pie، شرائحه؛ وفوق radial line، نصف قطره الخارجي). |

`Scale` هو `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear` و`domain` هذا المقياس هو امتداد قيمتيه، بأي ترتيب؛ ومجال من قيمة واحدة يضعها في الوسط. أما `domain` مقياس `band` فهو فئات نطاقاته، بالترتيب ([Cell](#cell))؛ وخياراته الأخرى في [Bar](#bar).

تُستدعى الدالة المطبَّقة على صف (`y={(d) => d.high - d.low}`) مرة لكل صف عندما تتغير الصفوف أو الدالة، في الدورة التالية، ولا تُستدعى أبدًا أثناء رسم plot أو متابعته للمؤشر: أبقِها نقية (الصف نفسه، الرقم نفسه). ويُقرأ اسم الحقل بدون أي JS على الإطلاق.

<a id="reversed-scales"></a>

### المقاييس المعكوسة

يجعل `reverse: true` المقياس يبدأ من حافته الأخرى، كما تأخذ مقاييس visx القيمة `reverse` وتأخذ مقاييس d3 مدىً مكتوبًا بالعكس. على المحور x يكون الصف الأول، أو أصغر قيمة في المجال، عند الحافة اليمنى؛ وعلى المحور y تكون أصغر قيمة في المجال عند الحافة العلوية وتسير الصفوف من الحافة السفلية صعودًا. وكل ما وُضع على المقياس يتبعه: العلامات، وقاعدة الأشرطة واتجاه نموها، وخط أساس المساحة، وخطوط الشبكة، وعلامات `PlotAxis`، والصف الذي يجده التمرير، ومفاتيح الأسهم ([لوحة المفاتيح](#keyboard)) والانتقالات إلى مجال جديد. تتدلى الأشرطة من الحافة العلوية على مقياس y معكوس من النوع `linear`، وتنمو الأشرطة الأفقية نحو اليسار من الحافة اليمنى على مقياس x معكوس من النوع `linear`:

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

مع ظهور plot، تُرسم الخطوط والمساحات تدريجيًا من الحافة التي يبدأ منها مقياس x، أي اليمنى عندما يكون معكوسًا.

<a id="dual-axes"></a>

### المحاور المزدوجة

<!-- demo: el-plot-dual -->

لدى plot مقياس y ثانٍ لقيم بوحدات أخرى: أحجام التداول بجانب السعر، والإيرادات بجانب الهامش. كل جزء يضع القيم على طول y يأخذ `scale`: `"y"` (الافتراضي، `yScale` الخاص بـ plot) أو `"y2"` (`y2Scale` الخاص به). ويسمّيه `PlotAxis` على اليمين مع تسميات `scale="y2"`:

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

لكل مقياس مجاله الخاص: `domain` الخاص بالتطبيق، أو امتداد القيم الموضوعة عليه، ويتحرك كل منهما إلى مجال جديد بواسطة `motion.update`. ما دام أي من المقياسين لا يسمّي مجالًا، يرتب plot كليهما بعدد الخطوات المستديرة نفسه (1 أو 2 أو 5 أضعاف قوة من عشرة، بخطوة لكل 32 نقطة تقريبًا من الارتفاع): فعندما يحتوي كلاهما على الصفر، يقع الصفر على الخط نفسه في كليهما؛ وإلا فإن المقياس الذي يبدأ من الصفر (أحجام التداول) يكسب خطواته الإضافية إلى الأعلى، والآخر (السعر) على الجانبين. وعلامات المحورين هي هذه الخطوات، ويرسم `Grid` الذي لا `x` له ولا `y` خطوطه عندها، فتخدم شبكة واحدة المحورين. ويوقف `alignTicks={false}` هذا السلوك؛ وإذا سمّى التطبيق `domain` تُركت المقياسان كما هما.

يجد التمرير صفًا واحدًا؛ وتقع نقطة كل علامة على مقياسها، وعرض القراءة من شأن التطبيق، الذي يقرأ قيمتي الصف اللتين يبلّغ عنهما `onHoverChange`. تقف الأشرطة على المقياسين جنبًا إلى جنب في كل نطاق، و`stack` يكدّس الأشرطة الموجودة على مقياسه فقط. `y2Scale` خطي: فلا مقياس y ثانيًا لـ plot ذي محور y بنطاقات.
<a id="line-area-and-grid"></a>

## Line وArea وGrid

| العلامة | الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | `y` الخاص بالمخطط | ما ترسمه: نقطة لكل صف له قيمة، وتُتخطى الصفوف التي لا قيمة لها. |
| `Line`، `Area` | `data`، `x` | `T[]`، `string \| (d, index) => number` | صفوف المخطط | صفوف سلسلة خاصة بالعلامة (قيم x أخرى)، توضع على مقاييس المخطط وفق `x` الخاص بها (وفهرس الصف عند غيابه). |
| `Line`، `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | كيفية وصل نقاطها: منحنى ناعم، أو قطع مستقيمة، أو درجات تُبقي كل قيمة حتى الصف التالي. وتتبع الحافة السفلية للمساحة المنحنى نفسه. |
| `Line` | `dot`، `dotClass`، `dotStyle` | `boolean`، `string`، `StyleProp<ViewStyle>` | `false` | نقطة دائرية على كل نقطة بيانات: عرض (view) متمركز عليها، ويحدد التطبيق حجمها وخلفيتها وحدودها. |
| `Line`، `Area` | `hoverDotClass`، `hoverDotStyle` | `string`، `StyleProp<ViewStyle>` | `dotClass` و`dotStyle` الخاصان بالمخطط | نقطة التمرير الخاصة بها، على نقطتها في الصف الواقع تحت المؤشر: نقطة كل سلسلة بلونها. وتحل كل منهما محل نقطة المخطط لهذه العلامة (لون العلامة فوق حجم المخطط وحلقته)؛ و`hidden` لا يُظهر شيئًا. |
| `Area` | `backgroundClass`، `backgroundStyle` | `string`، `StyleProp<ViewStyle>` | بلا | خلفيتها: صندوق حول شكلها (من أول نقطة إلى آخرها، ومن أعلى نقطة إلى خط الأساس، أو إلى أدنى نقطة في حافتها السفلية في حالة النطاق) وتظهر خلفيته (`bg-*`، `bg-linear-to-b from-… to-…`، `backgroundImage`) داخل الشكل فقط، تحت `fill`. وعند وجود خلفية، تكون قيمة `fill` هي `none` حيث لا توجد قيمة محددة. |
| `Area` | `y1` | `string \| (d, index) => number` | `y` الخاص بالمخطط | ما يشكّل حافتها العليا. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | الحافة الدنيا لمقياس y | حافتها السفلية: الرقم هو خط أساس على مقياس y؛ أما الحقل أو الدالة فيعطيان كل صف قيمته السفلية الخاصة، مما يجعل المساحة نطاقًا (من أدنى قيمة في اليوم إلى أعلاها، أو مدى التوقعات). وبدونها تنغلق المساحة على الحافة التي توجد عندها أصغر قيم مقياس y: الحافة السفلية، أو العليا في المقياس المعكوس (مساحة معلّقة من الأعلى). ويُتخطى الصف الذي لا قيمة له عند أي من الحافتين. |
| `Line`، `Area`، `Grid` | `scale` | `"y" \| "y2"` | `"y"` | مقياس y الذي تسير قيمها عليه: `yScale` الخاص بالمخطط أو مقياسه الثاني `y2Scale` ([المحوران المزدوجان](#dual-axes)). |
| `Grid` | `x` | `number[]` | بلا | مواضع خطوطها الرأسية، كقيم على مقياس x (فهارس الصفوف على مقياس `point`). |
| `Grid` | `y` | `number[]` | بلا | مواضع خطوطها الأفقية، كقيم على مقياس y. وعند غياب `x` و`y` معًا، تتبع الخطوط علامات تدريج مقياسها، حيث يضعها `PlotAxis` بدون `ticks` (على طول x للأعمدة الأفقية). |
| `Grid` | `ticks` | `number` | افتراضي المحور | العدد التقريبي للخطوط التي ترسمها عند غياب `x` و`y`، مثل `ticks` الخاص بـ `PlotAxis`. |
| `Line`، `Area` | `color` | `string \| (d, index) => string` | بلا | فئة صفوفها، ولونها من `colorScale` الخاص بالمخطط: تحدد فئة صفها الأول `stroke` الخاص بالخط (و`fill` الخاص بالمساحة) حيث لا يحدده شيء آخر ([الألوان حسب الفئة](#colors-by-category)). |

تملأ كل علامة المخطط وترسم بـ[خصائص الطلاء في SVG](../modules/style-reference.md#svg-paint) الخاصة بها، فوق خصائص المخطط، كما ترثها CSS:

| العلامة | ترسم بـ | حيث لا شيء محدد |
|---|---|---|
| `Line` | `stroke`، `strokeWidth`، `strokeDasharray` | `currentColor`، بعرض 1، متصل |
| `Area` | `fill` (فوق جزء `background` منها)؛ وحافتها العليا `stroke`، `strokeWidth`، `strokeDasharray` | `fill` `currentColor` (`none` بجانب الخلفية)؛ بلا حد |
| `Grid` | `stroke`، `strokeWidth`، `strokeDasharray` | `currentColor`، بعرض 1، متصل؛ ويُرسم كل خط على بكسلات جهاز كاملة، فيبقى الرفيع منها حادًا |

القيم التي يرسمها `Line` أو `Area`، وكذلك `y0` الخاص بالمساحة (خط أساسها، أو قيمة كل صف السفلية)، تشكّل نطاق مقياس y عندما لا يكون للمخطط نطاق؛ أما قيم Grid فلا. ولا تُعاد رسم العلامة إلا عندما يتغير ما ترسمه (صفوفها، قيمها، منحناها، حجم المخطط أو مقاييسه، طلاؤها)؛ والمؤشر يحرّك أجزاء التمرير ولا يعيد رسم العلامة أبدًا.

النطاق (band) هو `Area` يقرأ `y0` الخاص به الصفوف: تمر حافته العليا عبر `y1`، وتعود حافته السفلية عبر `y0`، كلتاهما مع `curve` الخاص بالمساحة، ويرسم appear الاثنتين تدريجيًا من الحافة البادئة. وتقع نقطة التمرير فيه على الحافة العليا؛ ويشير `Line` فوقه إلى القيمة الوسطى:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` هو نفسه في CSS، كما في المتصفح: لون. أما التدرج اللوني تحت الخط فهو خلفية المساحة، كما تعرض الصفحة تدرجًا داخل شكل (`background-image` الخاص بالصندوق ضمن `clip-path`): `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` يخفت من أعلى نقطة في المساحة إلى خط الأساس، باستخدام رموز السمة وألوان المظهر مثل خلفية أي عرض.

## Bar

يرسم `Bar` عمودًا لكل صف في نطاق الصف ضمن مقياس `band`: رأسيًا على مقياس x من نوع band، وأفقيًا على مقياس y من نوع band (ويكون مقياس x حينئذ `linear`). يمتد كل عمود من `base` إلى قيمة الصف على المقياس الآخر، فتنمو القيمة السالبة في الاتجاه المعاكس، ولا عمود للصف الذي لا قيمة له. وعلى مقياس قيم معكوس تنمو الأعمدة نزولًا من الحافة العليا أو نحو اليسار من الحافة اليمنى، ويضع مقياس band المعكوس نطاق الصف الأول عند اليمين أو في الأسفل ([المقاييس المعكوسة](#reversed-scales)).

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

الأعمدة خارج التكديس تقف جنبًا إلى جنب في كل نطاق، بترتيب العلامات؛ أما الأعمدة التي لها `stack` نفسه فتتراكم، ويبدأ عمود كل صف من حيث ينتهي العمود الذي قبله في التكديس:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` الخاص بالمخطط | ما يعرضه كل عمود. |
| `base` | `number \| string \| (d, index) => number` | `0` | القيمة التي تنمو منها أعمدتها على مقياس القيم: قيمة واحدة لكل الصفوف، أو حقل أو دالة تعطي كل صف قيمته، فيمتد كل عمود من قاعدة صفه إلى قيمته (والصف الذي لا قاعدة له لا عمود له). وتُحتسب في النطاق. ويبدأ التكديس من قاعدة أول عمود فيه، صفًا بعد صف. |
| `stack` | `string` | بلا | التكديس الذي تنضم إليه: الأعمدة التي لها `stack` نفسه تتراكم بالترتيب (والصف الذي لا قيمة له لا يضيف شيئًا). |
| `scale` | `"y" \| "y2"` | `"y"` | مقياس y الذي تسير عليه قيم أعمدتها الرأسية ([المحوران المزدوجان](#dual-axes))؛ وتقف الأعمدة على كليهما جنبًا إلى جنب، ولا يكدّس التكديس إلا الأعمدة الواقعة على مقياسه. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | نصف قطر كل زاوية من أعمدتها؛ و`{ topLeft: 4, topRight: 4 }` يدوّر رؤوس الأعمدة الرأسية. ونصف القطر الأكبر من نصف العمود يُقيَّد ليناسبه. |
| `stagger` | `number` | `0` | مع appear الخاص بالمخطط، تبدأ الأعمدة واحدًا تلو الآخر، صفًا بعد صف، خلال هذه الحصة منه (من 0 إلى 0.95)، ويتمدد كل منها في الباقي؛ والقيمة 0 تنميها معًا. |
| `inactiveOpacity` | `number` | بلا | شفافية أعمدتها بعيدًا عن الصف الواقع تحت المؤشر ما دام المؤشر فوق المخطط، ليبرز ذلك الصف: تظهر وتختفي مع التمرير وتنتقل من عمود إلى عمود معه. |
| `label` | `string \| (d, index) => string` | بلا | النص عند طرف قيمة كل عمود: حقل (نصه أو رقمه) أو دالة تعيد النص الذي ينسقه التطبيق. |
| `labelClass`، `labelStyle` | `string`، `StyleProp<TextStyle>` | بلا | الجزء `label`: نص متمركز على العمود، فوق طرف العمود الرأسي (وتحت العمود الذي ينمو نزولًا)، وبعد العمود الأفقي (وقبل العمود الذي ينمو عائدًا). والحشو (padding) هو بعده عن العمود. |
| `backgroundClass`، `backgroundStyle` | `string`، `StyleProp<ViewStyle>` | بلا | خلفيتها: صندوق كل عمود، وتظهر خلفيته (`bg-linear-to-t from-… to-…`، من أسفل العمود إلى أعلاه) داخل العمود فقط، تحت `fill`. وعند وجود خلفية، تكون قيمة `fill` هي `none` حيث لا توجد قيمة محددة. |
| `color` | `string \| (d, index) => string` | بلا | فئة كل عمود، ولونه من `colorScale` الخاص بالمخطط: `fill` الخاص بالعمود حيث لا يحدده شيء آخر ([الألوان حسب الفئة](#colors-by-category)). |

يوزّع مقياس band نطاقًا لكل صف من صفوف المخطط بالترتيب، أو نطاقًا لكل فئة من `domain` الخاص به، كما يفعل `scaleBand` في d3:

| الخيار | الافتراضي | الوصف |
|---|---|---|
| `domain` | بلا | فئات نطاقاته بالترتيب (`scaleBand().domain()` في d3): يقع [`Cell`](#cell) في نطاق فئة صفه، ويكتب `PlotAxis` فئة كل نطاق؛ والفئة المكتوبة مرتين تحتفظ بمكانها الأول. وبدونه تكون النطاقات هي الصفوف، أو، على الخلايا، الفئات التي تسميها الخلايا على طول المحور بالترتيب الذي تأتي به الصفوف. |
| `paddingInner` | `0` | الفجوة بين النطاقات المتجاورة، كحصة من خطوة كل نطاق (من 0 إلى 1). |
| `paddingOuter` | `0` | الفجوة قبل النطاق الأول وبعد الأخير، كحصة من الخطوة. ونصف `paddingInner` يضع منتصفات النطاقات على خطوات متساوية عبر المخطط. |
| `maxBandWidth` | بلا | أقصى عرض للنطاق، بالنقاط: فعدد قليل من النطاقات على مخطط عريض يبقى ضيقًا، كل منها في منتصف مكانه. |
| `bandCount` | الصفوف | النطاقات التي يُرتَّب المحور لها عندما تزيد على الصفوف: تأخذ الصفوف النطاقات الأولى وتحتفظ بعرضها ومكانها كما تأتي الصفوف. |
| `groupPadding` | `0` | الفجوة بين الأعمدة الواقفة جنبًا إلى جنب في النطاق، كحصة من مكان كل عمود. |
| `reverse` | `false` | تمتد النطاقات من الحافة الأخرى: نطاق الصف الأول عند يمين محور x، وعند أسفل محور y؛ وتحتفظ الأعمدة الواقفة جنبًا إلى جنب في النطاق بترتيبها. |

يُرسم العمود بـ `fill` (`fill-*`؛ موروثة من المخطط كما ترثها CSS)، و`currentColor` حيث لا يوجد شيء محدد (لون فئته مع `color`)، ولا يُظهر نقطة تمرير. وعلى مقياس band، يجد التمرير النطاق الواقع تحت المؤشر، ويقع خط التقاطع الخاص بالمخطط في ذلك النطاق، بعرضه كله: `crossLineClass="w-full h-full bg-foreground/5"` يلوّن النطاق، و`w-px` يُبقي خطًا في منتصفه. وتشكّل قيم الأعمدة وقاعدتها نطاق مقياس القيم عندما لا يكون للمخطط نطاق. ومع appear الخاص بالمخطط، ينمو كل عمود من قاعدة تكديسه؛ وتجري الحركة والتلاشي والانزلاق على animator الخاص بالمنصة، ولا يعيد المؤشر رسم أي عمود.

### Ranges

<!-- demo: el-plot-ranges -->

عندما يكون `base` حقلًا أو دالة، يمتد كل عمود بين قيمتين من صفه: خطوة الشلال (waterfall) من المجموع الجاري قبلها إلى المجموع بعدها، وجسم الشمعة من الافتتاح إلى الإغلاق، والمهمة من بدايتها إلى نهايتها. وينمو العمود من قاعدته الخاصة عند ظهوره، وتقع تسميته عند طرف قيمته، فوق العمود الصاعد وتحت الهابط.

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

القمع (funnel) أعمدة أفقية متمركزة: `base={(d) => -d.users / 2}` و`value={(d) => d.users / 2}` على مقياس y من نوع band.

## Rule

يرسم `Rule` خطًا مستقيمًا لكل صف على طول محور القيم، من `base` إلى قيمة الصف: في منتصف نطاق الصف على مقياس band (عبر المخطط على مقياس y من نوع band)، وفي موضع الصف على طول محور x على مقياس من نوع point أو linear. وفتيل الشمعة، وشعرة مخطط الصندوق (box plot)، وشريط الخطأ، وساق المصاصة (lollipop) كلها Rule؛ ومخطط الشموع (candlestick) هو `Bar` فوق `Rule`:

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` الخاص بالمخطط | أين ينتهي كل خط. والصف الذي لا قيمة له لا خط له. |
| `base` | `number \| string \| (d, index) => number` | `0` | أين يبدأ كل خط: قيمة واحدة لكل الصفوف (ساق المصاصة من خط الصفر)، أو حقل أو دالة تعطي كل صف قيمته (أدنى سعر في الشمعة). وتُحتسب في النطاق. |
| `scale` | `"y" \| "y2"` | `"y"` | مقياس y الذي تسير عليه قيمها ([المحوران المزدوجان](#dual-axes)). |
| `stagger` | `number` | `0` | مع appear الخاص بالمخطط، تبدأ الخطوط واحدًا تلو الآخر، صفًا بعد صف، خلال هذه الحصة منه (من 0 إلى 0.95)، ويمتد كل منها من بدايته في الباقي. |
| `inactiveOpacity` | `number` | بلا | شفافية خطوطها بعيدًا عن الصف الواقع تحت المؤشر ما دام المؤشر فوق المخطط، مثل `Bar`. |
| `color` | `string \| (d, index) => string` | بلا | فئة كل خط، ولونه من `colorScale` الخاص بالمخطط: `stroke` الخاص بالخط حيث لا يحدده شيء آخر. |

يُرسم حد Rule بـ `stroke` (`stroke-*`، `strokeWidth`، `strokeDasharray`؛ موروثة من المخطط كما ترثها CSS)، و`currentColor` حيث لا يوجد شيء محدد، ولا يُظهر نقطة تمرير. وتشكّل قيمه وقاعدته نطاق مقياس القيم عندما لا يكون للمخطط نطاق؛ وينمو من بدايته مع appear الخاص بالمخطط، ويتحرك مع نطاقات المقاييس، على animator الخاص بالمنصة.
## Dot

<!-- demo: el-plot-dots -->

يرسم `Dot` نقطة لكل صف حيث تلتقي قيمتان من قيم الصف: فعندما تقع `x` على مقياس x `linear` وتقع `value` على محور y ينتج مخطط انتشار (scatter plot). وعلى مقياس x من نوع band تقع كل نقطة في منتصف نطاق صفها. وعبر مقياس y من نوع band (ومقياس x `linear`) تمتد قيمتها على طول x ويمتد نطاق صفها نزولًا عبر الرسم، فينتج مخطط نقطي (dot plot). نصف قطر النقطة `r` إما رقم واحد لكل النقاط، أو قيمة لكل صف `rScale` تحوّلها إلى نصف قطر، فينتج مخطط فقاعي (bubble chart). الصف الذي لا قيمة له لا نقطة له.

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

عندما يكون `r` حقلًا أو دالة، تحدد قيمة كل صف حجم نقطته. يحوّل `rScale={{ type: "sqrt", range: [min, max] }}` الجذور التربيعية للقيم إلى أنصاف أقطار بالنقاط (points)، كما يفعل `scaleSqrt` في d3، لذلك تتناسب مساحة الفقاعة مع قيمتها عندما يبدأ المدى من 0، أما المدى الذي يبدأ من قيمة أكبر من 0 فيُبقي أصغر الفقاعات ظاهرة. يمتد النطاق (domain) من 0 إلى أكبر قيمة ما لم يحدد المقياس نطاقًا. تُرسم النقاط الأكبر أولًا لتبقى الأصغر ظاهرة فوقها:

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

تشكّل قيم النقطة نطاق مقياس القيمة عندما لا يكون للرسم نطاق، من دون السعي إلى بلوغ 0، فتلائم محاور مخطط الانتشار نقاطه. أعطِ الرسم `domain` بمساحة حول القيم عندما تكون النقاط كبيرة، لأن الفقاعة الواقعة عند حافة النطاق تُرسم متجاوزة حافة الرسم.

تصنع علامتان في النطاقات نفسها المخططات التي تقارن بين قيمتين من الصف: مخطط lollipop هو `Rule` من 0 تحت `Dot` عند قيمته، ومخطط dumbbell هو `Rule` من قيمة إلى أخرى مع `Dot` عند كل طرف، عبر مقياس y من نوع band:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` الخاص بالرسم | موضع كل نقطة على محور القيمة: على محور y، أو على طول x عبر مقياس y من نوع band. الصف الذي لا قيمة له لا نقطة له. |
| `r` | `number \| string \| (d, index) => number` | `3` | نصف قطر النقاط بالنقاط (points)، أو حقل أو دالة تعطي كل صف قيمة يحوّلها `rScale` إلى نصف قطر (تكون القيمة هي نصف القطر نفسه من دونه). الصف الذي قيمته مفقودة لا نقطة له. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | لا شيء | كيف تتحول قيم `r` إلى أنصاف أقطار: جذورها التربيعية على `domain` (من 0 إلى أكبر قيمة إن لم يوجد نطاق) إلى `range` أنصاف الأقطار، فيجعل المدى الذي يبدأ من 0 مساحة كل نقطة متناسبة مع قيمتها. القيم خارج النطاق تأخذ طرفي المدى. |
| `stagger` | `number` | `0` | مع appear الخاص بالرسم، تبدأ النقاط بالنمو واحدة تلو الأخرى، صفًا بعد صف، على امتداد هذه الحصة منه (من 0 إلى 0.95)؛ والقيمة 0 تنميها معًا. |
| `inactiveOpacity` | `number` | لا شيء | شفافية بقية النقاط عندما تكون إحداها تحت المؤشر أو المفاتيح: تتلاشى وتعود مع التمرير (hover). |
| `color` | `string \| (d, index) => string` | لا شيء | فئة كل نقطة، ولونها من `colorScale` الخاص بالرسم: `fill` النقطة حيث لا شيء يحدده ([الألوان حسب الفئة](#colors-by-category)). |
| `hitRadius` | `number` | `8` | المسافة التي يظل المؤشر يجد النقطة ضمنها بعد حافتها: من بين النقاط ضمن هذه المسافة، يجد المؤشر تلك التي يكون مركزها الأقرب إليه (خلايا Voronoi)، فتُوجد الفقاعة الصغيرة فوق فقاعة كبيرة حول مركزها هي. يمكن إيجاد صف المخطط النقطي من أي موضع على امتداده بنصف قطر بحجم الصف. |
| `scale` | `"y" \| "y2"` | `"y"` | مقياس y الذي تمتد عليه قيمها ([المحاور المزدوجة](#dual-axes))؛ أما النقاط عبر مقياس y من نوع band فتضع قيمها على x. |
| `hoverDotClass`، `hoverDotStyle` | `string`، `StyleProp<ViewStyle>` | `dotClass`، `dotStyle` الخاصان بالرسم | الجزء `hoverDot`: عرض بعرض النقطة التي تحت المؤشر وارتفاعها، متمركز عليها. يحيط `rounded-full outline-2 outline-offset-1` بها بحلقة؛ ولا يُظهر `hidden` شيئًا لهذه العلامة. |

تمتلئ النقطة بـ `fill` (`fill-*`؛ يُورَّث من الرسم كما يورّث CSS)، أو بـ `currentColor` حيث لا شيء مضبوط (لون فئتها مع `color`)، وتُحدَّد بـ `stroke` حيث يكون مضبوطًا (`stroke-*`، `strokeWidth`): فالحلقة بلون البطاقة تُبقي النقاط المتداخلة منفصلة. فوق رسم فيه نقاط، يبلّغ الرسم عن صف النقطة التي يكون مركزها الأقرب إلى المؤشر (`null` بعيدًا عن كل النقاط)، وتتنقل المفاتيح بين الصفوف بترتيبها (رتّب الصفوف حسب x فتمر المفاتيح على النقاط من اليسار إلى اليمين)، ويحدد الجزء `hoverDot` النقطة. مع appear الخاص بالرسم، تنمو النقاط من العدم؛ ومع `motion.update`، تنتقل إلى قيمها وأحجامها الجديدة، وتنمو نقطة الصف الجديد، وتنكمش نقطة الصف المحذوف حتى تختفي؛ كل ذلك على animator الخاص بالمنصة، من دون إعادة رسم أي علامة.

## Cell

<!-- demo: el-plot-cells -->

يرسم `Cell` مستطيلًا لكل صف في نطاقين في آن واحد: نطاق فئة `x` على مقياس x `band` ونطاق فئة `y` على مقياس y `band`، فتشكّل الصفوف شبكة، أي خريطة حرارية (heatmap). مصفوفة الارتباط، وتقويم العوائد الشهرية، وأسبوع من الصفقات في كل ساعة، كلها خلايا. تملأ كل خلية نطاقيها، لذلك تكون `paddingInner` و`paddingOuter` الخاصان بالمقياسين هما الفجوات بين الخلايا وحولها. لونها هو `value` على `colorScale` الخاص بالرسم، وهو تدرج ألوان ([الألوان على تدرج](#colors-along-a-ramp))، أو لون فئة `color` عبر تدرج ترتيبي (ordinal). تقع الخلايا على مقياسي x وy الخاصين بالرسم.

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

يسمّي `domain` الخاص بمقياس band فئات نطاقاته بالترتيب، كما يفعل `scaleBand().domain()` في d3: أشهر التقويم من يناير إلى ديسمبر، لكل منها نطاقه سواء وصلت صفوفها أم لم تصل، لذلك يكون مارس 2026 أعلاه مكانًا فارغًا في الشبكة. وبلا نطاق، تكون النطاقات هي الفئات التي تسمّيها الخلايا على المحور، بالترتيب الذي تأتي به الصفوف (2025 فوق 2026). يكتب `PlotAxis` على مقياس band من الفئات فئة كل نطاق، من دون `format`.

تسمّي مصفوفة الارتباط الأصول نفسها على المحورين، و`domain` فيها هو المدى الكامل للمعاملات، فيأخذ معامل 0 منتصف التدرج أيًّا كانت الأصول:

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | لا شيء | عمود كل صف: حقل (نصه أو رقمه) أو دالة تعيد الفئة. تذهب خلية الصف في نطاق تلك الفئة من مقياس x؛ والصف الذي لا فئة له لا خلية له. |
| `y` | `string \| (d, index) => string` | لا شيء | سطر كل صف، بوصفه `x` على مقياس y. |
| `value` | `string \| (d, index) => number` | لا شيء | رقم كل خلية، الذي يجعله `sequential` أو `diverging` `colorScale` لونها. الصف الذي لا رقم له يأخذ لون `unknown` الخاص بالمقياس، ومن دونه لا خلية له. |
| `color` | `string \| (d, index) => string` | لا شيء | فئة كل خلية، ولونها من `ordinal` `colorScale` ([الألوان حسب الفئة](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | نصف قطر كل زاوية من زوايا خلاياها. |
| `stagger` | `number` | `0` | مع appear الخاص بالرسم، تبدأ الخلايا بالنمو واحدة تلو الأخرى، صفًا بعد صف، على امتداد هذه الحصة منه (من 0 إلى 0.95)، كل منها من منتصفها في ما تبقى؛ والقيمة 0 تنميها معًا. |
| `inactiveOpacity` | `number` | لا شيء | شفافية بقية الخلايا وتسمياتها عندما تكون إحداها تحت المؤشر أو المفاتيح: تتلاشى وتعود مع التمرير (hover). |
| `label` | `string \| (d, index) => string` | لا شيء | الجزء `label`: نص في منتصف كل خلية، وهو حقل (نصه أو رقمه) أو دالة تعيد النص الذي ينسّقه التطبيق. تظهر كل تسمية حيث يتسع حجمها بعد التخطيط داخل خليتها، فيُظهر الرسم الضيق الألوان وحدها. |
| `labelClass`، `labelStyle` | `string`، `StyleProp<TextStyle>` | لا شيء | خط التسميات وحجمها ولونها. التسمية على خلية لون `colorScale` فيها داكن تحمل السمة `data-dark` (حيث يُقرأ النص الفاتح بشكل أفضل)، لذلك يكتبها `data-dark:text-white` بلون فاتح هناك. |
| `hoverCellClass`، `hoverCellStyle` | `string`، `StyleProp<ViewStyle>` | لا شيء | الجزء `hoverCell`: عرض بحجم الخلية التي تحت المؤشر أو المفاتيح، فوقها؛ ويحيط `rounded-sm outline-2 outline-foreground` بها بحلقة. يتحرك مع المؤشر في الإطار نفسه وينزلق على نابض `pointer` عندما تحركه المفاتيح. |

تمتلئ الخلية بلونها من `colorScale` الخاص بالرسم حيث لا يضبط التطبيق `fill` (تأتي أصناف `fill-*` وأنماطها أولًا، وتُورَّث من الرسم كما يورّثها CSS)، أو بـ `currentColor` حيث لا شيء يحدده، وتُحدَّد بـ `stroke` حيث يكون مضبوطًا. فوق رسم فيه خلايا، يبلّغ الرسم عن صف الخلية التي تحت المؤشر، وعبر الفجوة بين خليتين عن الأقرب منهما؛ وتتنقل مفاتيح الأسهم عبر الشبكة كما تظهر على الشاشة ([لوحة المفاتيح](#keyboard))، وتمر قارئات الشاشة على الصفوف بترتيبها. مع appear الخاص بالرسم، تنمو الخلايا من منتصفها؛ ومع `motion.update`، ينزلق لون الخلية إلى لونها الجديد، وتنمو خلية الصف الجديد، وتنكمش خلية الصف المحذوف حتى تختفي، وتنتقل الخلايا إلى نطاقاتها الجديدة؛ كل ذلك على animator الخاص بالمنصة، من دون إعادة رسم أي علامة.
<a id="pie-and-arc"></a>

## المخطط الدائري والقوس

يقسّم `Pie` الدورة إلى شريحة لكل صف، لكل منها حصتها من قيم الصفوف، باتجاه عقارب الساعة بدءًا من الساعة 12 وبترتيب الصفوف، حول مركز الرسم البياني. ويجعله `innerRadius` مخططًا حلقيًا. كل شريحة canvas مستقل بذاتها، وهي الجزء `slice`، فترسم كل شريحة بفئاتها (classes) الخاصة: `sliceClass` هي الفئات نفسها على كل شريحة، أو دالة لصف الشريحة تعطي كل شريحة فئاتها. فوق المخطط الدائري، يُبلغ الرسم البياني عن صف الشريحة الواقعة تحت المؤشر (لا شيء في الفتحة أو خارج الحلقة)، ويتبع تلميحه المؤشر، وتكبر تلك الشريحة بمقدار `hoverLift` بينما تخفت الشرائح الأخرى بمقدار `hoverDim`، على animator الخاص بالمنصة مع `motion` الخاص بالرسم البياني. ويرسم `Arc` قطاعًا واحدًا بين زاويتين: مسار مقياس وقيمته، أو حلقة خلف مخطط دائري.

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| العلامة | الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | `y` الخاص بالرسم البياني | قيمة كل صف. الصف الذي قيمته صفر أو أقل، أو الذي لا رقم له، لا شريحة له. |
| `Pie`، `Arc` | `startAngle`، `endAngle` | `.start_angle(..)`، `.end_angle(..)` | `number` (راديان) | `0`، `2 * Math.PI` | موضع بداية الشريحة الأولى ونهاية الأخيرة (طرفا القوس): بالراديان من الساعة 12، باتجاه عقارب الساعة. إذا كان `endAngle` أقل من `startAngle` فإن شرائح المخطط الدائري تُوزَّع في الاتجاه المعاكس. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (راديان) | `0` | الزاوية بين الشرائح المتجاورة عند الحافة. تحتفظ كل فجوة بهذا العرض (نحو `padAngle * outerRadius` نقطة) عند كل نصف قطر، وحافتاها متوازيتان، فعرضها عند المركز أو الفتحة كعرضها عند الحافة؛ والشريحة الأضيق من أن تبلغ المركز تنتهي حيث تلتقي حافتاها. المخطط الدائري ذو الشريحة الواحدة لا فجوة فيه. |
| `Pie`، `Arc` | `innerRadius`، `outerRadius` | `.inner_radius(..)`، `.outer_radius(..)` | ``number \| `${number}%` `` | `0`، `"100%"` | نصفا قطر الفتحة والحافة: بالنقاط، أو نسبة مئوية من أكبر دائرة يتسع لها الرسم البياني (نصف ضلعه الأصغر). |
| `Pie`، `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | نصف قطر زوايا كل شريحة (أو القوس)، بالنقاط، كما في `arc.cornerRadius` في d3: كل زاوية دائرة تمس الحافة والحافة الخارجية أو الفتحة، بما في ذلك الحافتان المتوازيتان للفجوات. وحده الأقصى نصف سماكة الحلقة، وهو ما يعطي القوس أطرافًا مستديرة، وفي الشريحة الأضيق من أن تتسع لزاويتين كاملتين تلتقي الزاويتان في منتصفها. الحلقة الكاملة تحتفظ بحوافها المستديرة فقط. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | لا شيء | فئات كل شريحة (`fill-*`، `stroke-*`): نفسها على كل شريحة، أو دالة لصف الشريحة وفهرسها، تُستدعى مرة لكل صف عند تغيّر الصفوف أو الدالة. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط كل شريحة، فوق فئاتها (`fill`، `stroke`، `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | مقدار ما تكبره الشريحة الواقعة تحت المؤشر عن الأخريات، بالنقاط: على زنبرك `pointer` الخاص بالرسم البياني، يظهر ويختفي تدريجيًا مع التمرير. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (من 0 إلى 1) | `0` | مقدار خفوت الشرائح الأخرى أثناء وجود إحداها تحت المؤشر، كنسبة من شفافيتها، مع تلاشي التمرير. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | لا شيء | فئة كل شريحة، ولونها من `colorScale` الخاص بالرسم البياني: `fill` الخاص بالشريحة حيث لا يحدد شيء آخر لونًا ([الألوان حسب الفئة](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | لا شيء | النص بجانب كل شريحة: حقل (رقمه) أو دالة تعيد النص الذي ينسّقه التطبيق. الصف الذي نصه فارغ، أو الشريحة الأضيق من نصف درجة، لا نص لها. |
| `Pie` | `labelClass`، `labelStyle` | `.label_class(..)`، `.label_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | الجزء `label`: نص خارج الحلقة عند نهاية خط الإرشاد الخاص به، متمركز عليه، بعده في النصف الأيمن من المخطط الدائري وقبله في النصف الأيسر. حشوته (padding) هي بعده عن نهاية الخط. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | مدى ابتعاد التسميات عن الحافة، بالنقاط. |
| `Pie` | `labelLineClass`، `labelLineStyle` | `.label_line_class(..)`، `.label_line_style(..)` | `string \| (d: T, index: number) => string`، `StyleProp<ViewStyle>` | لا شيء | الجزء `labelLine`: خط الإرشاد لكل تسمية، من الحافة عند منتصف الشريحة إلى نصف قطر التسمية، ثم عرضًا إلى النص. `stroke` الخاص به (`currentColor` حيث لا يُحدَّد شيء)، و`strokeWidth` و`strokeDasharray`، نفسها على كل خط أو دالة لصف الشريحة؛ ويظهر متى نُسِّق. |

تُملأ الشريحة والقوس بـ`fill` (`currentColor` حيث لا يُحدَّد شيء، ولون فئة الشريحة مع `color`) وتُرسم حوافها بـ`stroke` (لا شيء حيث لا يُحدَّد شيء)، وقيمهما الخاصة تعلو قيم المخطط الدائري والرسم البياني كما ترثها CSS: فحدّ بلون السطح (`stroke-card stroke-2`) يقطع فجوات بين الشرائح أيضًا. ولا تشارك قيمها في مقاييس الرسم البياني. وتُرسم شرائح المخطط الدائري من جديد فقط عند تغيّر الصفوف أو قيمها أو الزوايا أو أنصاف الأقطار أو حجم الرسم البياني؛ أما المؤشر فيحرّك الرفع والخفوت على animator.

عادةً تضع الرسوم البيانية ذات المخطط الدائري التلميح بجانب المؤشر (`tooltipPlacement="pointer"`)، لأن صفوف المخطط الدائري لا موضع لها على محور: يتبع الخط المتقاطع والتلميح المؤشر فوقه، ولا تظهر نقاط تمرير. ومركز المخطط الحلقي عنصر خاص بالتطبيق موضوع فوق الرسم البياني (قيمة الشريحة المُمرَّر فوقها، أو المجموع)، وكذلك مفتاحه، بحيث يحمل كل رمز لون شريحته.

تسمّي تسميات المخطط الدائري شرائحه خارج الحلقة: يقع كل نص على بعد `labelGap` من الحافة باتجاه منتصف شريحته (مركز ثقل الشريحة عند ذلك نصف القطر)، ثم عرضًا إلى نصف القطر ذاك في جهة الشريحة من المخطط، ويصله بالحافة خط إرشاد منسَّق. تنساب التسميات مع شرائحها عند ظهور الرسم البياني وتتلاشى ظاهرةً عند نهايته، وتتحرك معها عند `motion.update`، وترتفع مع الشريحة المُمرَّر فوقها؛ ويجري كل ذلك على animator الخاص بالمنصة. أفسح لها مكانًا في الرسم البياني: `outerRadius` أقل من `"100%"`، أو مساحة حول الرسم البياني. أما محتوى التطبيق الخاص عند شريحة فهو عنصر موضوع فوق الرسم البياني، كما هو مركز المخطط الحلقي.

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## الألوان حسب الفئة

يعطي `colorScale` الخاص بالرسم البياني الفئاتِ ألوانها، كما يفعل `scaleOrdinal` في d3، ويسمّي `color` الخاص بالعلامة فئة كل صف: حقل (نصه أو رقمه) أو دالة للصف. تأخذ فئات `domain` ألوان `range` بالترتيب، ويبدأ المدى من لونه الأول من جديد حين يكون النطاق أطول. والفئة خارج النطاق تأخذ `unknown`؛ وإن لم يوجد، تنضم إلى النطاق أول مرة تصادفها فيها علامة (العلامات بالترتيب، وصفوف كل منها بالترتيب) وتأخذ اللون التالي، فإذا لم يوجد `domain` أصلًا أخذت الفئات الألوان بترتيب مجيء الصفوف بها. والألوان من اختيار التطبيق: ألوان CSS، ومنها رموز (tokens) السمة.

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

تأخذ الشريحة والعمود والنقطة لون صفها؛ أما `Line` و`Area` فكل منهما سلسلة واحدة وتأخذان لون أول صف فيها، فالخط ذو الصفوف الخاصة (`data`) يكون بلون صفوفه، ويُبقي مقياس واحد لون الفئة نفسه عبر المخطط الدائري والأعمدة والخطوط. اللون هو `fill` الخاص بالعلامة (`stroke` للخط) حيث لا يحدد شيء آخر لونًا، في مكان `currentColor`: تأتي فئات التطبيق وأنماطه أولًا، ثم فئات الجزء (`sliceClass`، `sliceStyle`)، ثم فئات العلامة وما ترثه من الرسم البياني، ولذلك يحدد `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` شريحة بمفردها بينما يلوّن المقياس الأخريات. إلى جانب جزء `background`، يبقى `fill` للعمود وللمساحة `none`.

| `OrdinalScale` | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `type` | `"ordinal"` | (مطلوب) | نوع المقياس. |
| `domain` | `string[]` | لا شيء | الفئات بالترتيب. الفئة المكتوبة مرتين تحتفظ بمكانها الأول. |
| `range` | `string[]` | (مطلوب) | الألوان بالترتيب (ألوان CSS)؛ تأخذ الفئة `i` اللون `i % range.length`. |
| `unknown` | `string` | لا شيء | لون كل فئة خارج النطاق؛ وإن لم يوجد، تأخذ كل فئة اللون التالي. |

<a id="colors-along-a-ramp"></a>

### الألوان على طول تدرّج

يعطي `colorScale` من النوع `type: "sequential"` أو `"diverging"` الأرقامَ ألوانها على طول تدرّج، كما يفعل `scaleSequential` و`scaleDiverging` في d3، من أجل `value` الخاص بـ[`Cell`](#cell). و`range` الخاص به لونان أو أكثر موزعة بالتساوي على طول التدرّج من طرفه الأدنى إلى طرفه الأعلى ومخلوطة في OKLab بينها: فتبدو الدرجات متساوية للعين، ويلتقي لونان عبر مزيجهما الخاص. والقيمة التي تتجاوز `domain` تأخذ طرف التدرّج، والصف بلا قيمة يأخذ `unknown`.

يوزّع `sequential` قيم `domain` على التدرّج كله، والنطاق هو مدى قيم الخلايا ما لم يسمِّ التطبيق نطاقًا: أعداد، أحجام، نشاط. ويضع `diverging` قيمة `pivot` (0 افتراضيًا) عند لون منتصف التدرّج، فالقيم الأدنى منها تمتد على النصف الأول والأعلى منها على النصف الثاني: الخسائر بلون واحد، والأرباح بلون آخر، والشهر المستقر في المنتصف المحايد. وما لم يسمِّ التطبيق نطاقًا، فهو مدى القيم مساويًا على جانبي المحور (`symmetric` في Observable Plot)، فتكون الخسارة والربح بالحجم نفسه بالقوة نفسها؛ أما مصفوفة الارتباط فتسمّي `domain: [-1, 1]`.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`، `DivergingScale` | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (مطلوب) | نوع التدرّج. |
| `domain` | `[number, number]` | مدى القيم (مساويًا حول المحور في `diverging`) | قيمتا طرفي التدرّج. |
| `pivot` | `number` | `0` | `diverging` فقط: قيمة لون منتصف التدرّج. |
| `range` | `string[]` | (مطلوب) | الألوان على طول التدرّج، من الطرف الأدنى إلى الأعلى (ألوان CSS)، مخلوطة في OKLab بينها. |
| `unknown` | `string` | لا شيء | لون الصف بلا قيمة؛ وإن لم يوجد، فلا خلية لذلك الصف. |
## RadialLine and RadialGrid

يرسم `RadialLine` سلسلة حول مركز المخطط: مضلّع الرادار، أو خطًا حول قرص مدرّج. كل صف له قيمة يصبح نقطة عند زاوية الصف، على بُعد من المركز يحدده مقياس y للمخطط لقيمته، من `innerRadius` (أصغر قيمة في النطاق) إلى `outerRadius` (أكبر قيمة فيه). بدون `angle`، تتوزع الصفوف بالتساوي على الدورة الكاملة بدءًا من الساعة 12، في اتجاه عقارب الساعة، وبالترتيب، فستة صفوف تشكّل سداسيًا؛ ويصل `closed` النقطة الأخيرة بالأولى. يرسم الخط حدود نقاطه ويملأ مساحته نزولًا إلى `innerRadius` (المركز افتراضيًا)، فعلامة واحدة تعطي مخطط الرادار الخارجي وتظليله. يرسم `RadialGrid` شبكة الرادار خلفه: `rings` عند قيم مقياس y، ومضلّعات تمر عبر زوايا الصفوف أو `circular`، و`spokes` تمتد إلى كل صف. فوق الخط الشعاعي، يُبلغ المخطط عن الصف الأقرب زاويةً إلى مؤشر الفأرة ضمن نصف القطر الخارجي للخط، وتقع نقطة التمرير لكل خط على نقطته في ذلك الصف.

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| العلامة | الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | `y` المخطط | ما يحدد موضع كل صف بُعدًا عن المركز: قيمة من مقياس y، من `innerRadius` عند أصغر قيمة في النطاق إلى `outerRadius` عند أكبر قيمة فيه. يُتخطى الصف الذي لا قيمة له. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | الصفوف موزعة بالتساوي على الدورة | موضع كل صف حول المركز: بالراديان من الساعة 12، في اتجاه عقارب الساعة. |
| `RadialLine`، `RadialGrid` | `startAngle`، `endAngle` | `.start_angle(..)`، `.end_angle(..)` | `number` (راديان) | `0`، `2 * Math.PI` | موضع الصفوف عند غياب `angle`: من `startAngle`، بالتساوي. على دورة كاملة تفصل بين الصفوف خطوة قدرها `1 / rows` من الدورة، وتسبق الصفَّ الأول خطوةً واحدة عن الأخير؛ وعلى جزء من الدورة يقع الأول عند `startAngle` والأخير عند `endAngle`. |
| `RadialLine`، `RadialGrid` | `innerRadius`، `outerRadius` | `.inner_radius(..)`، `.outer_radius(..)` | ``number \| `${number}%` `` | `0`، `"100%"` | موضع أصغر قيمة وأكبر قيمة في نطاق y: بالنقاط، أو كنسبة مئوية من أكبر دائرة يتسع لها المخطط (نصف ضلعه الأصغر)، كأنصاف أقطار المخطط الدائري. تملأ مساحة الخط نزولًا إلى `innerRadius`؛ وتمتد أشعة الشبكة بين الاثنين. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | كيفية وصل نقاطه: قطع مستقيمة، أو منحنى ناعم (وعند الإغلاق حلقة ناعمة)، أو درجات. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | يستمر من نقطته الأخيرة عائدًا إلى الأولى: مضلّع الرادار. وإن كان مفتوحًا، تُغلق مساحته نحو المركز (أو على طول حافتها الداخلية). |
| `RadialLine` | `dot`، `dotClass`، `dotStyle` | `.dot(..)`، `.dot_class(..)`، `.dot_style(..)` | `boolean`، `string`، `StyleProp<ViewStyle>` | `false` | نقطة على كل نقطة من الخط: عنصر عرض متمركز عليها، وحجمه وخلفيته وحدّه من اختيار التطبيق. تنمو النقاط وتتحرك مع الخط. |
| `RadialLine` | `backgroundClass`، `backgroundStyle` | `.background_class(..)`، `.background_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | خلفيته: صندوق حول دائرته الخارجية لا تظهر خلفيته (`bg-*`، أو تدرّج) إلا داخل مساحته، تحت `fill`، كما في المساحة. |
| `RadialLine` | `hoverDotClass`، `hoverDotStyle` | `.hover_dot_class(..)`، `.hover_dot_style(..)` | `string`، `StyleProp<ViewStyle>` | `dotClass`، `dotStyle` المخطط | نقطة التمرير الخاصة به، على نقطته من الصف الذي تحت المؤشر، مع المؤشر في الإطار نفسه، وتنزلق إلى الصف التالي بنابض `pointer` الخاص بالمخطط عند التنقل بالمفاتيح؛ ولا تُظهر `hidden` أيّ نقطة. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | لا شيء | مواضع حلقاته، كقيم من مقياس y: كل حلقة على البُعد الذي يضع الخط الشعاعي عنده تلك القيمة. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | خط من `innerRadius` إلى `outerRadius` عند زاوية كل صف. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | حلقاته دوائر (أقواس على جزء من الدورة). افتراضيًا تكون مضلّعات تمر عبر زوايا الصفوف، وتكون دوائر ما دام في المخطط أقل من ثلاثة صفوف. |

يرسم الخط الشعاعي حدوده بـ `stroke` و`strokeWidth` و`strokeDasharray` (`currentColor`، بعرض 1 ومتصل حيث لا يُحدَّد شيء) ويملأ مساحته بـ `fill` (لا شيء حيث لا يُحدَّد شيء)؛ وترسم الشبكة الشعاعية حدودها كما تفعل الشبكة العادية. ويرث طلاؤهما من المخطط. تشكّل قيم الخط، مع 0، نطاق مقياس y حين لا يكون للمخطط نطاق، فينمو رادار القيم الموجبة من مركزه؛ أما حلقات الشبكة فلا تفعل ذلك. أعطِ المخطط y `domain` لتبقى الحلقات ومقياس الرادار ثابتين بينما تتغير القيم.

التسميات حول الرادار عناصر من التطبيق توضع فوق المخطط، كما يوضع مركز المخطط الحلقي. بدون `angle`، يقع الصف `i` من `n` عند `a = 2π·i / n` من الساعة 12، فيكون في المخطط المربع صندوق بلا حجم عند `left: 50% + r·sin(a)`، `top: 50% − r·cos(a)` (`r` نسبة مئوية من ضلع المخطط تتجاوز قليلًا نصف حصة نصف القطر الخارجي) علامةً على الموضع خلف الحافة، ويمتد الاسم منه مبتعدًا عن المركز: إلى يمينه في النصف الأيمن، وإلى يساره في النصف الأيسر، وفوقه عند القمة، وتحته عند القاع، كما في الأعلى.

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

يرسم `Sankey` التدفقات بين صفوف المخطط: كل صف عقدة، ويسمّي `links` التدفقات بينها، `{
source, target, value }` with the indices of two rows in the plot's `data`. ويرتّبها كما يفعل d3-sankey، ضمن حجم المخطط: العقد في أعمدة (`nodeAlign`)، وارتفاع كل عقدة بقدر أكبر ما يتدفق إليها أو منها، والمسافة بين عقد العمود الواحد `nodePadding`، وتُرخى نحو تدفقاتها على مدى `iterations` تمريرة؛ ولكل رابط شريط من الحافة اليمنى لمصدره إلى الحافة اليسرى لهدفه، عرضه عند كل طرف بقدر حصته من ضلع تلك العقدة، فيُغطّى جانبا كل عقدة حتى حين يختلف تدفقاها الداخل والخارج. يتوسط كل عمود المخطط، وتُزاح قليلًا سلسلة الأعمدة المتساوية ذات العقدة الواحدة لتنحني الأشرطة بينها. ويحدد `valueScale="sqrt"` الأحجام بالجذر التربيعي للقيم، فلا يطغى تدفق واحد مهيمن على التدفقات الصغيرة.

كل عقدة وكل شريط لوحة رسم مستقلة، وهما الجزءان `node` و`link`، فيُرسم كل منهما بفئاته الخاصة: `nodeClass` هي الفئات نفسها على كل عقدة أو دالة في صف العقدة، و`linkClass` هي نفسها على كل شريط أو دالة في الرابط. ويُظهر الجزء `linkBackground` خلفية داخل كل شريط، وهي صندوق من مصدره إلى هدفه: فتمنح الدالة في الرابط كل شريط تدرجًا من لون مصدره إلى لون هدفه. تُرسم الأشرطة تحت العقد، ويُرسم كلاهما من الحافة الأمامية مع حركة ظهور المخطط.

فوق مخطط sankey، يُبلغ المخطط عن العقدة تحت المؤشر (`onHoverChange`، صف العقدة؛ ولا شيء فوق الشريط)، وتتبع أداة التلميح المؤشر، وتخفت الروابط غير المتصلة بتلك العقدة بمقدار `hoverDim`، على animator المنصة مع `motion` الخاص بالمخطط. وتتنقل المفاتيح بين العقد بترتيب الصفوف، وتظهر أداة التلميح بجانب منتصف كل عقدة. يسمّي `nodeLabel` كل عقدة ويعطي `valueLabel` قيمتها، والقيمة فوق الاسم إذا حُدّدا معًا: يسار العقدة في العمود الأول، ويمينها في العمود الأخير، ومتوسطًا فوقها بين ذلك، كما يضعها مخطط `gpui-component`؛ وتبقى التسمية بجانب العقدة بين أعلى المخطط وأسفله، وتستقر التسمية التي تتجاوز حافة المخطط في المساحة التي يتركها التطبيق حوله (هامشه). حشوة الجزء `nodeLabel` هي المسافة إلى عقدته، وفئاته تحدد نصه (`max-w-20 truncate` يقتطع الاسم الطويل)؛ وتظهر التسميات تدريجيًا مع حركة الظهور. وحين يغيّر التطبيق التدفقات، تنتقل كل عقدة وكل شريط من مكانه القديم إلى الجديد مع `motion.update` الخاص بالمخطط، وتنتقل تسميته معه: فالعقدة الجديدة على التدفقات تنمو من منتصفها، والرابط الجديد من أقل عرض له، وتغادر العناصر المحذوفة فورًا؛ ويستمر التغيير الذي يحدث أثناء الحركة من حيث هي مرسومة. تُميَّز الروابط بمصدرها وهدفها، فإعادة ترتيب `links` لا تحرّك شيئًا.

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | مطلوب | التدفقات: من الصف `source` إلى الصف `target` (فهرساهما في `data` الخاص بالمخطط)، و`value` حجمه. القيمة التي ليست رقمًا أو التي هي أقل من صفر لا تحمل شيئًا ولا يُرسم لها شريط. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | عرض كل عقدة، بالنقاط. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | المسافة بين عقد العمود الواحد، بالنقاط؛ وتقل في العمود المزدحم الذي لا يتسع لها. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | العمود الذي تقع فيه كل عقدة، كما في d3-sankey: عمقها من العمود الأول (`"left"`)، أو أقصى اليمين الذي تسمح به تدفقاتها (`"right"`)، أو عمقها مع وضع العقدة التي تبدأ التدفقات فقط بجانب أهدافها (`"center"`)، أو عمقها مع وضع العقد التي تنهي التدفقات في العمود الأخير (`"justify"`). |
| `iterations` | `.iterations(..)` | `number` | `6` | عدد التمريرات التي ترخي العقد نحو تدفقاتها. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | الارتفاعات والعروض بما يتناسب مع القيم، أو مع جذورها التربيعية. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | أقل عرض يُرسم به الشريط، بالنقاط، ليبقى التدفق الصغير مرئيًا. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | نصف قطر زوايا كل عقدة، بالنقاط. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | لا شيء | فئات كل عقدة (`fill-*`، `stroke-*`): هي نفسها على كل عقدة، أو دالة في صف العقدة وفهرسها، تُستدعى مرة لكل صف عند تغيّر الصفوف أو الدالة. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط كل عقدة، فوق فئاتها. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | لا شيء | فئات كل شريط: هي نفسها على كل شريط، أو دالة في الرابط وفهرسه في `links`. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط كل شريط، فوق فئاته. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | لا شيء | فئات خلفية كل شريط (`bg-*`، تدرّج: `bg-linear-to-r from-… to-…`)، وتظهر داخل الشريط فوق صندوق من مصدره إلى هدفه، تحت `fill`. ومع وجود خلفية، تكون قيمة `fill` للشريط هي `none` حيث لا يُحدَّد شيء. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط خلفية كل شريط، فوق فئاتها. |
| `hoverDim` | `.hover_dim(..)` | `number` (من 0 إلى 1) | `0` | مقدار خفوت الروابط غير المتصلة بالعقدة تحت المؤشر، كنسبة من عتمتها، بنابض `pointer` الخاص بالمخطط ومع خفوت التمرير. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | لا شيء | الاسم بجانب كل عقدة: حقل، أو دالة في صف العقدة وفهرسها. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | لا شيء | القيمة بجانب كل عقدة، فوق اسمها: دالة في صفها وفي أكبر ما يتدفق إليها أو منها (بقيم الروابط، أيًا كان `valueScale`). |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | لا شيء | فئات كل تسمية، وهي الجزء `nodeLabel`: حشوته هي المسافة إلى عقدته، ونمط نصه يسري على السطرين معًا. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | لا شيء | نمط كل تسمية، فوق فئاتها. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | لا شيء | فئات سطر القيمة، وهو الجزء `valueLabel`، فوق فئات التسمية. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | لا شيء | نمط سطر القيمة، فوق فئاته. |

تُملأ العقدة والشريط بـ `fill` (`currentColor` حيث لا يُحدَّد شيء) ويُرسم حدّهما بـ `stroke` (لا شيء حيث لا يُحدَّد شيء)، وتكون قيمهما الخاصة فوق قيم sankey والمخطط كما يرثها CSS. العقدة التي لا يمر بها شيء ارتفاعها نقطة واحدة. لا يُعاد التخطيط إلا عند تغيّر الروابط أو الخيارات أو حجم المخطط، ولا يُعاد أبدًا بسبب المؤشر أو حركة الظهور؛ وتغيّر حجم المخطط لا يحرّك شيئًا. الروابط التي تشكّل دورة، أو التي تسمّي صفًا ليس في المخطط، لا يُرسم منها شيء ويُسجَّل تحذير. ولا تشارك قيمها في مقاييس المخطط.
## Treemap

يرسم `Treemap` صفوف الرسم على هيئة تسلسل هرمي من المستطيلات المتداخلة: كل صف عقدة، ويكوّن `id` الخاص بها مع `parent` الذي يسميه الشجرة (`stratify` في d3)، وتتناسب مساحة كل ورقة مع `value`، وكل مجموعة هي صندوق ما تحتها، وقيمتها مجموع قيم أوراقها (أيًّا كان ما يحمله صفها هي). الصف الذي بلا `parent`، أو الذي لا يسمي أبوه أي صف، هو عقدة من المستوى الأعلى؛ وبلا `id` يكون معرّف الصف هو فهرسه، فيمكن لـ`parent` أن يسمي صفًا بفهرسه أيضًا. أما الشجرة بالصيغة المتداخلة التي يكتبها gpt-vis (`{ name, value, children }`) فتحويلها إلى صفوف لا يتطلب من التطبيق سوى بضعة أسطر؛ ولا حد لعدد المستويات.

تُرتَّب البلاطات بطريقة squarified كما يفعل `treemapSquarify` في d3: عقد كل مستوى بترتيب القيمة، الأكبر أولًا من أعلى اليسار (`sort="value"`)، بنسبة أبعاد قريبة من `ratio` (النسبة الذهبية)؛ و`sort="data"` يحافظ على ترتيب الصفوف، فتبقى العقد في أماكنها حين تتغير قيمها. `paddingInner` هي الفجوة بين الأشقاء، ولا تُوضع على أي حافة خارجية لأبيهم؛ و`paddingOuter` هي المساحة داخل المجموعة حول أبنائها؛ و`paddingTop` شريط في أعلى كل مجموعة يُكتب فيه `groupLabel`. يقبل كلٌّ منها رقمًا واحدًا لكل المستويات أو رقمًا لكل مستوى من الأعلى نزولًا (`[3, 1]`: 3 بين عقد المستوى الأعلى، و1 تحتها). يُوضع شريط المستوى على كل أشقاء أب واحد أو على أيٍّ منهم، ويُحذف حيث يضيق أحدهم عنه، فتُقرأ مجموعات المستوى الواحد بالشكل نفسه.

الورقة التي قيمتها 0 أو أقل من 0 أو ليست رقمًا لا تأخذ مساحة: فلا تُرسم، ولا اسم لها، ولا يعثر عليها المؤشر، وكذلك المجموعة التي كل أوراقها كذلك.
مساحات الـ treemap هي حصص من كل، لذلك يُبيّن التطبيق بكلماته ما حُذف منها (ملاحظة تحت الخريطة).
أما الأرقام السالبة فللألوان: كتغير السوق خلال اليوم في خريطة السوق.

لون العقدة هو لون صفها من `colorScale` الخاص بالرسم: `colorValue` رقم على تدرج لوني (`sequential`، `diverging`: الخسائر حمراء، والمكاسب خضراء، والمحايد في الوسط، على مدى القيم إن لم يوجد `domain`)، و`color` فئة (`ordinal`: يلوّن `"parent"` أوراق المجموعة بلون واحد). الأوراق هي الجزء `leaf` (`leafClass`، `leafStyle`) والمجموعات هي الجزء `group` (`groupClass`، `groupStyle`)، ولا تُرسم إلا مع class أو style: مستطيل تحت أبنائه، يظهر في الفجوات وفي حشوته وفي شريطه. كل جزء إما واحد على كل العقد أو دالة لصف العقدة. `cornerRadii` يدوّر كل مستطيل.

يكتب `label` اسم كل ورقة، ويكتب `valueLabel` قيمتها تحته، وهو دالة للصف وقيمته (وقيمة المجموعة هي مجموع أوراقها): في أعلى اليسار (`labelPlacement="start"`) أو في الوسط (`"center"`). الجزء `label` صندوق بحجم ورقته: حشوته هي المسافة من حواف الورقة، ونصه ينسّق الأسطر. يُقطع الاسم بنقاط الحذف حيث تضيق الورقة، ولا يظهر إلا حيث يتسع له المكان؛ أما القيمة فتظهر كاملة أو لا تظهر. التسمية التي لون ورقتها داكن تحمل السمة `data-dark`، فيُبقيها `data-dark:text-white` مقروءة على الأحمر الغامق.

فوق الـ treemap يُبلغ الرسم عن العقدة تحت المؤشر (`onHoverChange`، صف العقدة): ورقة، أو مجموعة في شريطها أو حشوتها؛ وعبر فجوة بين الأشقاء يُبلغ عن أحدهم، حتى لا يومض التحويم. أما العقد الأخرى فتخفت إلى `inactiveOpacity` (تحتفظ الورقة بمجموعاتها، وتحتفظ المجموعة بما تحتها)، ويحدد الجزء `hover`، وهو view بحجم العقدة، حدودها. تنتقل مفاتيح الأسهم إلى الورقة المجاورة على الشاشة، ويذهب Home وEnd إلى الأولى والأخيرة. مع `stagger` الخاص بالرسم تنمو عقد المستوى الأعلى من أواسطها، واحدة بعد أخرى؛ وعند تغير الصفوف تنتقل كل عقدة إلى صندوقها ولونها الجديدين مع `motion.update`، وتُعرف بـ`id`: العقدة الجديدة على الصفوف تنمو من وسطها، والعقدة التي اختفت تنكمش نحو وسطها. ولا تُستخدم مقاييس x وy الخاصة بالرسم.

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | فهرس الصف | معرّف عقدة كل صف: ما يسميه `parent`، وما تُعرف به العقدة عند تغير الصفوف. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | لا شيء: كل صف عقدة من المستوى الأعلى | معرّف أب كل صف؛ يكون فارغًا، أو معرّفًا لا يطابق أي صف، للعقدة من المستوى الأعلى. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | مطلوب | حجم كل ورقة؛ وحجم المجموعة هو مجموع أحجام أبنائها. الورقة التي قيمتها 0 أو أقل من 0 أو ليست رقمًا لا تأخذ مساحة. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | الأشقاء الأكبر أولًا من أعلى اليسار، أو بترتيب الصفوف. |
| `ratio` | `.ratio(..)` | `number` | النسبة الذهبية | نسبة الأبعاد التي تقترب منها البلاطات، وهي 1 على الأقل. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | الفجوة بين الأشقاء، بالنقاط، لكل مستوى من الأعلى نزولًا (الأخيرة تنطبق على ما تحتها). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | المساحة داخل كل مجموعة حول أبنائها، لكل مستوى. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | الشريط في أعلى كل مجموعة، من أجل `groupLabel`، لكل مستوى؛ على كل أشقاء أب واحد أو على أيٍّ منهم. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | مربع | نصف قطر كل زاوية من زوايا مستطيلاتها. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | لا شيء | فئة كل عقدة، التي يمنحها `ordinal` `colorScale` لونًا. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | لا شيء | رقم كل عقدة، الذي يجعله `sequential` أو `diverging` `colorScale` لونها. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | لا شيء | classes كل ورقة (`fill-*`، `stroke-*`)، وهي نفسها على كل ورقة أو دالة لصفها. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | لا شيء | style كل ورقة، فوق classes الخاصة بها. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | لا شيء | classes كل مجموعة، وهي مستطيل تحت أبنائها؛ ولا تُرسم المجموعات إلا مع class أو style. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | لا شيء | style كل مجموعة، فوق classes الخاصة بها. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (من 0 إلى 1) | لا شيء | شفافية العقد البعيدة عن العقدة المحوَّم فوقها، وشفافية تسمياتها، مع تلاشي التحويم. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | لا شيء | الاسم داخل كل ورقة، في سطر واحد، يُقطع بنقاط الحذف. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | لا شيء | القيمة داخل كل ورقة، تحت اسمها، ولا تظهر إلا حيث تتسع لها كاملة. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | التسميات في أعلى يسار أوراقها، أو في وسطها. |
| `labelClass` | `.label_class(..)` | `string` | لا شيء | classes تسمية كل ورقة، وهي صندوق بحجم الورقة: حشوته وتنسيقات نصه؛ و`data-dark:` على الأوراق الداكنة. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | لا شيء | style تسمية كل ورقة، فوق classes الخاصة بها. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | لا شيء | classes سطر القيمة، فوق classes التسمية. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | لا شيء | style سطر القيمة، فوق classes الخاصة به. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | لا شيء | اسم كل مجموعة، في شريطها، يُقطع بنقاط الحذف. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | لا شيء | classes تسمية كل مجموعة، وهي صندوق بحجم الشريط. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | لا شيء | style تسمية كل مجموعة، فوق classes الخاصة بها. |
| `stagger` | `.stagger(..)` | `number` (من 0 إلى 0.95) | `0` | كيف تظهر عقد المستوى الأعلى واحدة بعد أخرى: حصة الظهور التي تبدأ خلالها. |
| `hoverClass` | `.hover_class(..)` | `string` | لا شيء | classes الجزء `hover`، وهو view بحجم العقدة المحوَّم فوقها (`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | لا شيء | style جزء التحويم، فوق classes الخاصة به. |

يُملأ المستطيل بـ`fill` (لون `colorScale`، وإلا `currentColor`، حيث لا لون محدد) ويُحدَّد بـ`stroke` (لا حد حيث لا يُحدَّد شيء)، وقيمه الخاصة تعلو قيم الـ treemap والرسم كما يرثها CSS. لا يُعاد التخطيط إلا عند تغير الصفوف أو الخيارات أو حجم الرسم، ولا يُعاد أبدًا بسبب المؤشر أو الظهور؛ وتغير حجم الرسم لا يحرك شيئًا. يسجل `id` مكرر، و`parent` لا يسمي أي صف، وصف هو سلف نفسه، تحذيرًا مرة واحدة: يحتفظ أول صف بالمعرّف، وتصبح العقدة اليتيمة عقدة من المستوى الأعلى، ولا تُرسم الحلقة.

## PlotAxis

يضع `PlotAxis` تسميات على حافة من حواف الرسم بعلامات المقياس الذي تحمله تلك الحافة: الحافتان السفلية والعلوية بعلامات مقياس x، والحافتان اليسرى واليمنى بعلامات مقياس y، كما في `axisBottom` و`axisTop` و`axisLeft` و`axisRight` في d3. تأتي علاماته من المقياس: قيم مستديرة على مقياس `linear` (1 أو 2 أو 5 أضعاف قوة للعشرة، داخل المجال)، وصفوف على مقياس `point` أو `band`. تسمياته نصوص يضعها تخطيط الرسم، فيحدد التطبيق ما تقرؤه وكيف تبدو، ويضعها التخطيط في أماكنها: كل تسمية تتوسط علامتها على امتداد الحافة. على امتداد الحافتين السفلية والعلوية تنتقل التسمية الأولى والأخيرة نحو الداخل بالقدر اللازم فقط لتبقيا داخل طرفي الرسم؛ وبجوار الحافتين اليسرى واليمنى تبقى كل تسمية عند علامتها، فتُقرأ على أنها لخط شبكتها، وحيث تتجاوز تسمية قرب أحد الطرفين الحافة العلوية أو السفلية للرسم، تبدأ مقاييس y الخطية للرسم من مسافة مماثلة داخل تلك الحافة (نصف ارتفاع التسمية لعلامة عند الطرف)، فتبقى كل تسمية داخل الرسم، عند خط شبكتها.

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | الحافة التي يمتد عليها: تحمل الحافتان السفلية والعلوية علامات مقياس x، واليسرى واليمنى علامات مقياس y. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | مقياس y الذي يسمّيه المحور الأيسر أو الأيمن: `yScale` الخاص بالرسم أو مقياسه الثاني `y2Scale` ([المحاور المزدوجة](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | موضع تسمياته: خلف الحافة، في المساحة التي يتركها التطبيق حول الرسم، حيث تبقى بعيدة عن العلامات؛ أو فوق الرسم على امتداد الحافة، فيحتفظ الرسم بحجمه كاملًا (بجوار الحافة اليسرى أو اليمنى تقع كل تسمية على الجانب العلوي من خط شبكتها). |
| `ticks` | `.ticks(..)` | `number` | `10` على مقياس `linear` (كل خطوة في المقاييس المحاذاة)، وكل صف على المقاييس الأخرى | عدد العلامات التقريبي الذي يأخذه: على مقياس `linear`، قيم مستديرة داخل المجال، بهذا العدد تقريبًا؛ وعلى مقياس `point` أو `band`، هذا العدد من الصفوف موزعة بالتساوي من الأول إلى الأخير. |
| `tickValues` | `.tick_values(..)` | `number[]` | لا شيء | قيم علاماته، بدلًا من `ticks`: قيم من المقياس، أو فهارس صفوف على مقياس `point` أو `band` (`[0, 3, 6]` يسمّي كل صف ثالث). كل قيمة داخل المجال تحصل على علامة. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | فئة النطاق على مقياس نطاقات من الفئات، وإلا القيمة، بالمنازل العشرية التي تحتاجها الخطوة بين العلامات، مع تجميع الآلاف | نص كل علامة: دالة من التطبيق لقيمتها (فهرس الصف على مقياس `point` أو `band`) وفهرسها بين علامات المحور. |
| `labelClass`، `labelStyle` | `.label_class(..)`، `.label_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | الجزء `label`: نص لكل علامة، وخطه ولونه وحشوته من اختيار التطبيق؛ وحشوته نحو الرسم هي مسافته من الحافة (`pt-2` تحت المحور السفلي). |
| `tickClass`، `tickStyle` | `.tick_class(..)`، `.tick_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الجزء `tick`: view لكل علامة على الحافة، يتوسط علامته ويمتد نحو التسميات (`h-1 w-px bg-border` تحت المحور السفلي)؛ ويظهر بمجرد تنسيقه. |
| `lineClass`، `lineStyle` | `.line_class(..)`، `.line_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الجزء `line`: view على امتداد الحافة كلها، في جهة التسميات (`h-px bg-border` تحت المحور السفلي)؛ ويظهر بمجرد تنسيقه. |

في الخارج تقع التسميات في هامش الرسم، كما تقع محاور d3 في هوامش المخطط: يحتفظ الرسم بالحجم الذي يمنحه إياه التطبيق، ويمنحه التطبيق هامشًا في جهة المحور بعمق التسميات (`mb-6` لتسميات `pt-2 text-xs` تحته)، أو حشوة أبيه هناك. ويسمّي كل محور من محورين على حافة واحدة قيمه الخاصة، بتنسيقه الخاص: أطراف المدى باهتة ووسطه أشد.

يُستدعى `format` مرة لكل علامة عند تغير العلامات أو الدالة، في الدورة التالية، ولا يُستدعى أبدًا أثناء رسم الرسم أو تتبعه للمؤشر: أبقِه نقيًّا (القيمة نفسها، النص نفسه). وبدونه تُقرأ العلامة كما يكتبها d3: `1,500`، `0.25`، `−2`. في Rust، `plot_axis()` يصنع محورًا، و`format` الخاص به هو `TickFormat::from_fn(|value, index| ..)`.
لا يستقبل المحور المؤشر، وتقرأ قارئات الشاشة الرسم لا تسمياته.
## PlotLabel

يكتب `PlotLabel` نصوصًا عند نقاط من المخطط: عنوانًا فوق قمة، أو وسمًا عند آخر نقطة في خط، أو ملاحظة عند طرف خط شبكة. يحدد كل عنصر من `texts` نقطته بقيم من مقاييس المخطط، كما تفعل العلامات: فهرس الصف على مقياس `point` أو `band` (منتصف نطاق الصف)، أو قيمة على مقياس `linear`. تقع الحافة العليا للنص على النقطة، ويجعله `align` يبدأ عندها أو يتمركز عليها أو ينتهي عندها. يضع تخطيط المخطط النصوص، فتتبع حجم المخطط؛ وتنزلق مع مجالات المقاييس (`motion.update`) وتظهر تدريجيًا مع الظهور.

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | النصوص التي يكتبها، كل نص عند نقطته. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | مقياس y الذي تكون `y` نصوصه قيمًا منه ([المحاور المزدوجة](#dual-axes)). |

كل نص هو `PlotText`:

| الحقل | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `text` | `string` | | ما يعرضه النص. |
| `x` | `number` | | موضعه على المحور x: قيمة من مقياس x، أو فهرس صف على مقياس `point` أو `band` (`0.5` تقع في منتصف المسافة بين الصفين الأولين). |
| `y` | `number` | | موضع حافته العليا على المحور y: قيمة من مقياس y. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | كيف يقع على x بالنسبة إلى نقطته: يبدأ عندها، أو يتمركز عليها، أو ينتهي عندها. |
| `class`، `style` | `string`، `StyleProp<TextStyle>` | لا شيء | الفئات والنمط الخاصان بالنص، فوق ما يرثه من PlotLabel: صندوقه (خلفية الوسم والحشو) ومسافته عن النقطة. |

المظهر يعود إلى التطبيق: يمنح `class` الخاص بـ PlotLabel كل نص أنماط النص التي يرثها (الخط والحجم واللون)، ويصمّم `class` و`style` الخاصان بكل نص ذلك النص وحده. يوضع النص فوق نقطته باستخدام `-translate-y-full`، ويكون حشوه هو المسافة بينه وبين النقطة (`pb-1`)؛ ويقع الوسم المجاور لآخر نقطة في خط ضمن الهامش الذي يتركه التطبيق في ذلك الجانب (`mr-12`)، كما تفعل تسميات المحور. في Rust، ينشئ `plot_label()` تسمية، وكل نص هو `PlotText::new(text, x, y)` مع `.align(PlotTextAlign::Center)` و`.class(..)` و`.style(..)`. يمر المؤشر عبر النصوص إلى المخطط، وتقرأ قارئات الشاشة المخطط، الذي يذكر `accessibilityLabel` فيه ما تشير إليه النصوص.

<a id="motion"></a>

## الحركة

الحركة من شأن التطبيق، ولا توجد حركة افتراضيًا: يظهر كل شيء دفعة واحدة. يقبل `motion` توقيتات [`nsh`](../modules/nsh.md#animation) (`{ duration, easing, delay }` و`{ stiffness, damping, mass }`):

| المفتاح | النوع | ما الذي يتحرك |
|---|---|---|
| `appear` | timing | تُرسم العلامات تدريجيًا، مع `appearGeneration`: الخطوط والمساحات من الحافة الأمامية، والأعمدة تنمو من قاعدتها (واحدًا تلو الآخر مع `stagger` العمود)؛ والنقاط تنمو من العدم (واحدة تلو الأخرى مع `stagger` النقطة)؛ والخلايا تنمو من منتصفها (واحدة تلو الأخرى مع `stagger` الخلية)؛ وحلقة المخطط الدائري وحلقة القوس تنسابان في اتجاه عقارب الساعة من بدايتهما؛ والخط الشعاعي ينمو من نصف قطره الداخلي ومعه نقاطه؛ وعُقد مخطط sankey وشرائطه من الحافة الأمامية، وتسمياته تظهر تدريجيًا. |
| `update` | timing | تنتقل العلامات إلى الشكل الجديد عندما يغيّره التطبيق: النقاط إلى قيمها وأحجامها الجديدة، ونقطة الصف الجديد تنمو ونقطة الصف المحذوف تتقلص وتختفي؛ والخلايا إلى ألوانها الجديدة (تُمزج في OKLab) ونطاقاتها، وخلية الصف الجديد تنمو وخلية الصف المحذوف تتقلص وتختفي؛ وأنصاف أقطار المخطط الدائري والقوس، فيتسع ثقب الدونات ويضيق، وزواياهما، فيدور المقياس أو الشريحة إلى قيمته الجديدة (`arcTween` في d3: تتحرك الزوايا لا المحيط الخارجي؛ وتنفتح الشريحة الجديدة من حيث تنتهي التي قبلها؛ والتغيير أثناء الحركة يستمر من حيث يُرسم الشكل)؛ ونقاط الخط الشعاعي إلى قيمها وزواياها وأنصاف أقطارها الجديدة (والصف الجديد ينمو من نصف القطر الداخلي)، وحلقات الشبكة الشعاعية معها؛ ومجال المقياس الخطي، أي `domain` الخاص بالتطبيق أو امتداد قيم العلامات عند ورود الصفوف، وينزلق من القديم إلى الجديد، وتنزلق معه العلامات وخطوط الشبكة و`PlotAxis` و`PlotLabel`؛ وعُقد مخطط sankey وشرائطه وتسمياته، من تخطيط التدفقات القديم إلى الجديد، والتغيير أثناء حركتها يستمر من حيث تُرسم. |
| `enter` | timing | تظهر أجزاء التحويم تدريجيًا عندما يمر المؤشر فوق المخطط. |
| `exit` | timing | وتختفي تدريجيًا بعد مغادرته. |
| `pointer` | spring | تنزلق من صف إلى التالي عندما تنقل المفاتيح أو قارئ الشاشة التحويم؛ وترتفع شريحة المخطط الدائري عندها. |

تتبع أجزاء التحويم المؤشر في الإطار نفسه: فعند تحركه يكون الخط المتقاطع والنقاط والتلميح على الصف الذي تحته فورًا، فتتبع اليد، بينما يبقى ظهورها واختفاؤها التدريجي (`enter`، `exit`) متحركًا.

تعمل الحركة على المحرّك المتحرك الخاص بالمنصة، دون JS في كل إطار، وتكتمل فورًا لمن يطلب تقليل الحركة. المخطط الذي تعيد قائمة إنشاءه لصف يعود إلى العرض يُرسم من جديد، ما لم يرَ [`PlotAppearScope`](#plotappearscope) حول القائمة انتهاء ظهوره.

يتحرك المجال كما ينقل d3 مجال المقياس: يضع المقياس الوسيط كل قيمة في موضعها، فتحافظ العلامات على أشكالها، وتتحرك معها خطوط الشبكة وأجزاء التحويم، وتحتفظ الأعمدة بزواياها، ويتحرك الصف الذي يدخل مع المجال الجديد مع البقية. المخطط الحي الذي يلائم مقياس y مع صفوفه بين حين وآخر (مع هامش، فتثبت الشبكة بين الملاءمات) ينزلق إلى كل ملاءمة جديدة بتوقيت `update`. وعندما يتغير حجم المخطط، تتخذ العلامات الحجم الجديد فورًا.

هذه هي حركة المخطط نفسه، أي توقيتات ما يتحرك في المخطط: قصّ علاماته وأجزاء التحويم فيه. أما مداخل العرض ومخارجه وملفتات الانتباه فهي إعدادات [`createMotion`](../modules/nsh.md#createmotion) المسبقة وإطاراتها المفتاحية، ويمكن للتطبيق أن يشغّلها على عرض المخطط أو على العناصر المحيطة به.

## PlotAppearScope

تعيد القائمة إنشاء مخطط الصف في كل مرة يعود فيها الصف إلى العرض، فيُرسم المخطط المصغّر الذي له ظهور من جديد كلما عادت القائمة إليه بالتمرير. يتذكر `PlotAppearScope` حول القائمة حالات الظهور التي انتهت فيها: المخطط الذي يُعاد إنشاؤه هناك وقد انتهى `appearGeneration` الخاص به يعرض علاماته كاملة فورًا. يُتذكر المخطط بجيله، فيكون لمخطط كل صف جيله الخاص، وهو مفتاح الصف مع ما ينبغي أن يعيد تشغيله (`` `${symbol} ${period}` ``).

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | لا شيء | ما يتذكره النطاق من أجله: عندما يتغير، ينسى النطاق وتُرسم مخططاته من جديد حيث هي. سمِّه باسم المحتوى، مثل قائمة متابعة أو محادثة؛ وبدونه يتذكر النطاق ما دام معروضًا. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | ما يحتويه: القائمة، أو أي شيء يعيد إنشاء مخططاته أثناء دخولها وخروجها. |

يظل الجيل الجديد يرسم المخطط تدريجيًا، وكذلك المخطط الذي أُزيل قبل انتهاء ظهوره، من البداية. وما إن ينهي مخطط جيلًا جديدًا حتى ينسى نطاقه الجيل الذي قبله، فيؤدي الرجوع إلى فترة سابقة إلى رسم المخطط من جديد. وتذهب الذاكرة مع النطاق: فالنطاق الذي لم يعد معروضًا، أو الذي له `id` جديد، يرسم مخططاته من جديد، ويتذكر المخطط في أعمق نطاق يحيط به. مظهره من شأن التطبيق: يخطّطه `class` و`style` كما يخطَّط أي عرض (`flex-1` حول قائمة تملأ الشاشة). في Rust، ينشئ `plot_appear_scope()` واحدًا.

<a id="keyboard"></a>

## لوحة المفاتيح

المخطط التفاعلي نقطة توقف في Tab (macOS والويب)، وما دام يملك تركيز لوحة المفاتيح فإن مفاتيحه تحرك التحويم نفسه الذي يحركه المؤشر: ينزلق الخط المتقاطع والنقاط والتلميح بزنبرك `pointer`، وترتفع شريحة المخطط الدائري، ويبلّغ `onHoverChange` عن الصف، وتقرأ قارئات الشاشة `accessibilityValue` الذي يقدمه التطبيق له. حلقة التركيز فيه من شأن التطبيق: فئة `focus-visible:` أو `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`).

| المفاتيح | ما تفعله |
|---|---|
| Right, Left | الانتقال إلى الصف في ذلك الجانب: الصف التالي أو السابق، والعكس على مقياس x المعكوس الذي يكون صفه الأول في اليمين (فوق المخطط الدائري، شرائحه بترتيب الصفوف؛ وفوق sankey، عُقده؛ وفوق treemap، الورقة المجاورة على الشاشة، كما يفعل Up وDown)؛ وإن لم يكن أي صف محوَّمًا فوقه، يبدأ Right من الصف في الطرف الأيسر ويبدأ Left من الصف في الطرف الأيمن (فوق المخطط الدائري، الشريحة الأولى والأخيرة). |
| Home, End | الانتقال إلى الصف الأول أو الأخير. |
| Up, Down | فوق الخلايا: الانتقال إلى الخلية الأعلى أو الأدنى في العمود نفسه. فوق الخلايا تتبع المفاتيح الشبكة كما تظهر على الشاشة (شبكة البيانات في WAI-ARIA): ينقل Right وLeft إلى الخلية التالية على امتداد السطر، وينقل Home وEnd إلى أول خلية في السطر وآخرها؛ وإن لم تكن أي خلية محوَّمًا فوقها، يبدأ المفتاح الأول من الخلية العليا اليسرى (ويبدأ Left وUp وEnd من الخلية السفلى اليمنى). عند الحافة يبقى التحويم حيث هو. |
| Escape | يمسح التحويم. |

يستجيب المخطط لمفاتيحه ما دام يملك التركيز، ولـ Escape ما دام صف محوَّمًا فوقه؛ وفي بقية الوقت تذهب إلى التطبيق والعروض المحيطة به. نقل التركيز بعيدًا يمسح تحويمًا أنشأته المفاتيح. لا يتلقى المخطط أي ضغطات، فيترك المخطط داخل بطاقة قابلة للضغط ضغطاتها لها. وتتنقل قارئات الشاشة بين الصفوف أيضًا: بالتمرير لأعلى ولأسفل في VoiceOver، وبالتمرير للأمام وللخلف في TalkBack، وبكل قارئ شاشة يوفر إجراءي `increment` و`decrement` للعنصر، فتنقل إلى الصف التالي والسابق، بترتيب الصفوف على المقياس المعكوس أيضًا.

<a id="building-charts"></a>

## بناء المخططات

المخطط هو مخطط (plot) وعلاماته ومحاوره وعناصر التطبيق الخاصة المحيطة بها. امنح مقياس y `domain` وامنح محوره قيم الشبكة (`tickValues`): فيقع كل تسمية عندئذ عند خط الشبكة الخاص بها. الخط المتقاطع والنقاط والتلميح في التحويم هي أجزاء من المخطط، ينسّقها التطبيق ويملؤها؛ وقيم الصف تذهب حيث يعرضها التطبيق.

تُقرأ الشبكات أفضل كخطوط رفيعة متصلة مع خط أساس أكثر صلابة، مما يترك الخط المتقطع ليدل على قيمة مرجعية (سعر الافتتاح أدناه). وتُقرأ المساحة أخف كطبقة شفافة تتلاشى نحو خط أساسها منها كتعبئة مصمتة. تأخذ نقطة التحويم في كل سلسلة لون سلسلتها، ولون السطح الذي يجلس عليه المخطط كحلقة لها، فتبدو مقتطعة من خطها، ويقع التلميح أعلى المخطط، داخل حافتيه عند الصفين الأول والأخير: ويُبعده عن الخط `domain` مع فسحة فوق أعلى قيمة.

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

يُقرأ المخطط العمودي أفضل حين تكون أطراف أعمدته مستديرة وقواعدها قائمة (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`)، وأعمدة الصفوف الأخرى خافتة بينما يُحوَّم فوق أحدها (`inactiveOpacity`) ونطاقه مظلَّل (`crossLineClass`)، والقيم بأرقام صغيرة جدولية فوق الأعمدة، مع المجموع فوق التكديس. مع `paddingOuter` يساوي نصف `paddingInner`، تقع منتصفات النطاقات على خطوات متساوية، ويجعل `PlotAxis` كل شهر في منتصف نطاقه؛ ويُبقي `maxBandWidth` بضعة أعمدة رفيعة في بطاقة عريضة.

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

المخطط المصغّر في صف قائمة هو مخطط مع `interactive={false}`: يرسم علاماته ولا يتبع أي مؤشر.

<a id="accessibility"></a>

## إمكانية الوصول

- المخطط عنصر واحد لقارئات الشاشة، بدور الصورة و`accessibilityLabel` الخاص بالتطبيق؛ وعلاماته وتسميات محاوره و`PlotLabel` وأجزاء التحويم فيه هي أجزاء منه ولا تقول شيئًا بنفسها. اذكر في التسمية ما يعرضه المخطط وما يبرز فيه (النطاق، وأعلى قيمة)، وامنح `accessibilityValue` الكلمات الخاصة بالصف الذي تحت المؤشر، فتنطق قارئة الشاشة القيمة عند تغيّرها.
- يُبلَّغ عن الصف الذي تحت المؤشر عبر `onHoverChange` على المنصات التي لها مؤشر (أجهزة سطح المكتب والويب وiPad مع لوحة تتبع). لا تبلّغ الشاشات اللمسية عن أي تحويم: اعرض القيم التي يحتاجها مستخدم اللمس في عناصر التطبيق الخاصة، أو قدّم الصفوف كنص أو قائمة حيث تهم الأرقام.
- فوق المخطط الدائري يكون الصف المُبلَّغ عنه هو شريحة المؤشر: امنح `accessibilityValue` اسمها وقيمتها ونسبتها (`"Team, 340 seats, 34.0%"`)، واذكر المجموع وأكبر نسبة في التسمية. وفوق مخطط radar يكون المحور الأقرب إلى المؤشر: امنحه اسم المحور وقيمة كل سلسلة عنده.
- المخطط التفاعلي نقطة توقف لتركيز لوحة المفاتيح تحرّك مفاتيح الأسهم فيه التحويم ([لوحة المفاتيح](#keyboard))، ويقدّم لقارئات الشاشة `increment` و`decrement` للتنقل بين الصفوف (يقرؤه VoiceOver كعنصر قابل للضبط)؛ أما المخطط مع `interactive={false}` فليس أيًّا من ذلك، ولا يتلقى أي ضغطات في الحالتين.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار بوجه عام.
<a id="platform-notes"></a>

## ملاحظات حول المنصات

- ترسم كل منصة العلامات بالطريقة نفسها، انطلاقًا من رسم واحد لكل علامة يُسجَّل في Rust؛ وأي تغيير في الصفوف يعيد رسم العلامات التي تقرؤها دفعةً واحدة، أما تغيير صنف الطلاء (المظهر، `dark:`) فيُعيد إرسال الرسم دون تسجيله من جديد.
- يقصّ الظهور التدريجي (appear) الخطوط والمساحات، وينمّي الأعمدة، بقيم يحرّكها المحرّك الحركي (animator) الخاص بالمنصة؛ أما تلاشي عمود بعيد عن الصف المُمرَّر فوقه المؤشر فهو شفافية يحسبها المحرّك الحركي من موضع التمرير؛ وأجزاء التمرير هي عروض (views) يحرّكها المحرّك الحركي ويُخفتها، وهو يُبقي التلميح داخل المخطط اعتمادًا على حجم المخطط وحجم التلميح.
- تُرسم خلفية المساحة في لوحة رسم (canvas) خاصة بها، مقصوصة بشكل المساحة، وبالتدرّج اللوني نفسه الذي ترسمه المنصة لـ `bg-linear-*` الخاص بالعرض؛ وتغيير أصنافها (المظهر، `dark:`) يُعيد إرسال الرسم دون تسجيله من جديد.
- يرسم المخطط الدائري كل شريحة في لوحة رسم خاصة بها؛ وتُحدَّد الشريحة الواقعة تحت المؤشر في Rust انطلاقًا من زوايا الشرائح وأنصاف أقطارها، ويكون ارتفاعها نصف قطر، ويكون تلاشي الشرائح الأخرى شفافية يحرّكها المحرّك الحركي، ويحرّك مسحُ الظهور زوايا الشرائح بالطريقة نفسها، فلا يستلزم أيٌّ منهما إعادة تسجيل الرسم.
- يُحدَّد الصف الواقع تحت المؤشر في الخط الشعاعي في Rust انطلاقًا من زوايا نقاطه؛ ونقطة التمرير الخاصة به هي عرض يضعه المحرّك الحركي على الصف الواقع تحت المؤشر (منزلقةً على نابض `pointer` كلما انتقلت المفاتيح)، وأثناء ظهوره أو انتقاله إلى قيم جديدة تكون نقاطه أرقامًا يحرّكها المحرّك الحركي انطلاقًا من مواضعها السابقة، فيُسجَّل الخط مرة واحدة لكل تغيير.
- تُرسم علامة النقطة في لوحة رسم واحدة؛ وتُحدَّد النقطة الواقعة تحت المؤشر في Rust انطلاقًا من مراكز النقاط وأنصاف أقطارها، ونقطة التمرير الخاصة بها هي عرض يضعه المحرّك الحركي عليها، بحجمها نفسه؛ ونموّ الظهور وانتقالات التغيير وتلاشي التمرير كلها قيم يحرّكها المحرّك الحركي، فتُسجَّل النقاط مرة واحدة لكل تغيير.
- تُرسم علامة الخلية في لوحة رسم واحدة؛ وتُحدَّد الخلية الواقعة تحت المؤشر في Rust انطلاقًا من مربعات الخلايا، وخلية التمرير الخاصة بها هي عرض يضعه المحرّك الحركي عليها؛ والنموّ وألوان التغيير وانتقالاته وتلاشي التمرير كلها قيم يحرّكها المحرّك الحركي، فتُسجَّل الخلايا مرة واحدة لكل تغيير. وكل تسمية نص تابع للمنصة، يظهر حيث يتسع حجمه بعد التخطيط داخل خليته.
- نصوص المحور وعلامات تدريجه وخطه هي نصوص وعروض تابعة للمنصة نفسها، يضعها التخطيط في Rust انطلاقًا من حجم المخطط ومقاييسه: فهي تتحرك مع العلامات عند تغيّر حجم المخطط، ويؤدي النطاق الجديد إلى كتابة التسميات من جديد.
