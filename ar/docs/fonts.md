---
title: "الخطوط"
description: "خط النظام والعائلات العامة، وقوائم الخطوط الاحتياطية، وشحن ملفات .ttf و.otf و.woff و.woff2 من أصول حزمة Rust أو من استيرادات TSX، والعائلات التي تضم عدة أوزان وأنماط مائلة، والخطوط في الأنماط المُنمَّطة بالأنواع وفي فئات Tailwind."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# الخطوط

يستخدم النص خط النظام (San Francisco على iOS، وRoboto على Android) ما لم تحدد عائلة خطوط خلاف ذلك (`.font_family(..)` في Rust، و`fontFamily` في TSX). يمكن أن تكون العائلة عائلة عامة، أو خطًا مثبتًا على الجهاز، أو ملف خط تشحنه مع التطبيق.

<a id="system-and-generic-families"></a>

## عائلات النظام والعائلات العامة

| `fontFamily` | الخط |
|---|---|
| (بلا قيمة)، `"system-ui"`، `"sans-serif"`، `"ui-sans-serif"`، `"-apple-system"` | خط النظام |
| `"serif"`، `"ui-serif"` | خط النظام ذو الحواف (New York على iOS، وNoto Serif على Android) |
| `"monospace"`، `"ui-monospace"` | خط النظام أحادي المسافة (SF Mono على iOS) |
| `"ui-rounded"` | خط النظام المستدير (SF Pro Rounded)، على iOS فقط |

يدعم خط النظام كل الأوزان من 100 إلى 900. وتقابل الأصناف `font-sans` و`font-serif` و`font-mono` في Tailwind الصفوف الثلاثة الأولى، بينما يقابل `font-sans` و`font-mono` خطوط السمة عندما تحددها ([خط افتراضي للتطبيق](#a-default-font-for-the-app)).

يمكن تسمية عائلة مثبتة على الجهاز مباشرة (`"Georgia"`، `"Avenir Next"` على iOS). تختلف الخطوط المثبتة بين المنصات والإصدارات، لذا اشحن الخطوط التي يعتمد عليها تصميمك. على iOS، إذا لم توجد العائلة المطلوبة فإن النص يعود إلى خط النظام مع تحذير في السجل (`font family 'X' is not available`)؛ سمِّ قائمة لاختيار البديل بنفسك ([قوائم الخطوط البديلة](#fallback-lists)).

<a id="shipping-a-font"></a>

## شحن خط

تشحن حزمة Rust ملفات مجلدها `assets/`: يشحنها `registry.assets(assets!())` في الدالة `#[native_module]` كلها، أما `asset!("fonts/Pacifico-Regular.ttf")` فهو `FontAsset` قيمته `family` هي اسم عائلة الخط، ويُقرأ من الملف عند تجميع الحزمة. في TSX، استورد ملف `.ttf` أو `.otf` أو `.woff` أو `.woff2`: تُقيَّم عملية الاستيراد إلى اسم عائلة الخط. في الحالتين يُسجَّل الخط قبل أول إطار، فيكون جاهزًا عند أول عرض للنص. ملفات WOFF وWOFF2 هي خطوط TrueType أو OpenType مضغوطة (غالبًا ما يكون حجم ملف WOFF2 نصف حجم ملف TrueType المقابل، مما يوفر في حجم حزمة التطبيق وفي تنزيلات الويب): يقرؤها NSH بوصفها الخطوط التي تحتويها، على كل المنصات:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` واستيراد TSX `Pacifico` هما السلسلة `"Pacifico"`: اسم العائلة المخزن في ملف الخط (اسم العائلة الطباعي، أو اسم العائلة إن لم يوجد)، وليس اسم الملف. استخدام قيمة المورد بدل كتابة الاسم يدويًا يُبقي الاثنين متزامنين؛ فالملف المفقود أو التالف يُفشل بناء Rust، والملف المستورد يُضمَن تضمينه في الحزمة.

تُشحن الملفات مع التطبيق مثل أي [مورد](./images-and-assets.md) آخر. تُسجَّل الخطوط لعملية التطبيق فقط؛ ولا تُثبَّت على الجهاز.

> [!WARNING]
> في TSX، يحذف TypeScript أي استيراد لا تُستخدم قيمته (import elision)، ومعه يُحذف الخط. إذا كنت تشير إلى العائلة بالاسم فقط (مثلًا في سمة Tailwind)، فاستورد الملف لأثره الجانبي: `import "./fonts/Inter-Bold.ttf";`. تشحن حزمة Rust كل ملف في `assets/` عبر `assets!()`.

<a id="fallback-lists"></a>

## قوائم الخطوط البديلة

يقبل `fontFamily` قائمة كما في CSS: عائلات تفصل بينها فواصل، الأكثر تفضيلًا أولًا، ويمكن وضع الاسم الذي يحتوي مسافات بين علامتي اقتباس أو بدونهما (`"Brand, 'Noto Sans SC', sans-serif"`)، ويحتفظ الاسم المقتبس بفواصله (`'ACME, Inc'`). يُضبط النص بأول عائلة تملكها المنصة، ويأتي أي حرف تفتقده تلك العائلة (كتابة أخرى أو رمز) من العائلة التالية في القائمة التي تملكه، ثم من خطوط النظام البديلة. تتيح القائمة لخط علامة تجارية يغطي اللاتينية فقط أن يعرض الصينية بخط مناسب، أو أن تسمّي خطًا ينزّله التطبيق مع خط نظام يظهر إلى حين وصوله:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

تحافظ كل منصة على ترتيب القائمة بآليات الخطوط الخاصة بها: قائمة تتالٍ (cascade list) على iOS وmacOS، وخط بديل (font fallback) على Windows (واحدة لكل فقرة: قائمة أول نمط فيها)، وقائمة عائلات Pango على Linux، وقائمة المتصفح على الويب، والخطوط البديلة في GPUI. على Android، يُضبط النص بأول عائلة تتوفر؛ وعندما تكون تلك العائلة خطًا يسجله التطبيق، تكون الخطوط المسجلة التي تليها في القائمة هي بدائلها (Android 10 وما بعده).

<a id="weights-and-italics"></a>

## الأوزان والخط المائل

تأتي العائلة عادةً في عدة ملفات، واحد لكل وزن ونمط. اشحن كل واحد منها (ضعها في `assets/` في Rust، واستورد كلًا منها في TSX)؛ فهي تُسجَّل تحت اسم العائلة نفسه، ويختار الوزن والنمط الوجه المناسب:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

عندما لا يوجد وجه مسجل بالوزن المطلوب بالضبط، يُستخدم أقرب وجه. وتختلف المنصات عند غياب وجه:

| | iOS | Android |
|---|---|---|
| وزن بلا وجه مقابل | أقرب وجه مسجل | أقرب وجه، مع الخط العريض الاصطناعي من Android حيثما ينطبق |
| خط مائل بلا وجه مائل | الوجه القائم (بلا إمالة) | نسخة مائلة من الوجه القائم |

اشحن الأوجه التي تستخدمها لتحصل على النتيجة نفسها على المنصتين.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## الخطوط في الأنماط المكتوبة وأصناف Tailwind

في Rust، يقبل `.font_family(..)` عائلة المورد في أي موضع يُستخدم فيه نمط، وتختار دوال الوزن (`.font_weight(FontWeight::SEMIBOLD)`) الأوجه. أما مع الأصناف، فسمِّ عائلاتك في سمة Tailwind ضمن `nsh.json` لتستخدمها كأصناف `font-*`:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

تعمل أي عائلة اعتباطية دون إدخال في السمة: `font-[Pacifico]`. وتختار أصناف الوزن (`font-light` و`font-semibold` و`font-bold` ...) الأوجه كما يفعل `fontWeight`. تنتقل أنماط النص المضبوطة على عنصر عرض (view) إلى النصوص داخله، لذا فإن `.font_family(INTER.family)` على عنصر عرض، أو `<View class="font-body">`، يضبط العائلة لشاشة كاملة.

<a id="a-default-font-for-the-app"></a>

## خط افتراضي للتطبيق

`font-sans` في السمة هو خط التطبيق: يُرسم به كل نص لا يحدد عائلة خاصة به، في مكونات Rust وTSX على حد سواء، كما تُرسم صفحة الويب مع `--font-sans` في Tailwind. أما `font-mono` فهو الخط أحادي المسافة، لصنف `font-mono` وللشيفرة في `TextView`. اضبطهما في سمة التطبيق (`"theme"` في `nsh.json`، [Rust](./rust.md#theme)) واشحن ملفات الخطوط كما سبق:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

أول عائلة في القائمة ليست عامة هي الخط المعتمد؛ وإذا كانت العائلة الأولى عامة (`system-ui`، `sans-serif`) فهي خط النظام. ويمكن أيضًا ضبط الخط على حاوية: فترثه النصوص داخلها.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## ميزات الخط

يفعّل `fontVariant` ميزات OpenType في الخط: `"tabular-nums"` و`"proportional-nums"` و`"lining-nums"` و`"oldstyle-nums"` و`"small-caps"` (`.tabular_nums()`، `.small_caps()`، ... في Rust؛ [Text](./text.md#text-styles)). يجب أن يحتوي الخط على هذه الميزات؛ وخطوط النظام تحتوي عليها.

<a id="related"></a>

## مراجع ذات صلة

- [Text](./text.md): أنماط النص والأحجام وإعداد حجم نص النظام.
- [Tailwind](./tailwind.md#theme): مفاتيح السمة.
- [Images and assets](./images-and-assets.md): كيف تُشحن ملفات التطبيق.
