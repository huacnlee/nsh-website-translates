---
title: "Shader"
description: "عنصر Shader: عنصر عرض يرسم داخل مربعه برنامج GPU مكتوب بلغة WGSL، أسفل العناصر التابعة له."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

الـ Shader هو View يرسم برنامجُ GPU صندوقَه: تدرجات لونية متدفقة، وضوضاء وحبيبات، وبلازما، وشفق قطبي، ورقائق هولوغرامية، وتموجات تتبع النقر. تكتب دالة WGSL واحدة، `shade`، تعطي لون كل نقطة من الصندوق؛ وتشغّلها المنصة على GPU بدقة الشاشة، فوق خلفية الـ View وتحت أبنائه. تحرّكها القيم المتحركة أصلياً، إطاراً بإطار، دون أي عمل في شيفرة التطبيق. في TSX تُنشئه بـ `<Shader>` من `nsh`، وفي Rust بـ `shader().source(program)`.

```rust tabs
use nsh_core::{prelude::*, shader::Shader};

const GLOW: &str = r#"
struct Uniforms { tint: vec4f }

fn shade(uv: vec2f) -> vec4f {
  let d = distance(uv, vec2f(0.5));
  let pulse = 0.5 + 0.5 * sin(nsh.time * 2.0);
  let glow = smoothstep(0.5, 0.0, d) * (0.6 + 0.4 * pulse);
  return vec4f(uniforms.tint.rgb * glow, 1.0);
}
"#;

fn glow() -> impl IntoElement {
    let program = Shader::compile(GLOW).expect("a valid shader");
    shader()
        .source(program)
        .uniform("tint", Hsla::from(rgb(0x38bdf8)))
        .h(px(200.0))
        .rounded(px(14.0))
}
```

```tsx tabs
import { mount, Shader } from "nsh";

const GLOW = /* wgsl */ `
struct Uniforms { tint: vec4f }

fn shade(uv: vec2f) -> vec4f {
  let d = distance(uv, vec2f(0.5));
  let pulse = 0.5 + 0.5 * sin(nsh.time * 2.0);
  let glow = smoothstep(0.5, 0.0, d) * (0.6 + 0.4 * pulse);
  return vec4f(uniforms.tint.rgb * glow, 1.0);
}`;

function Glow() {
  return <Shader source={GLOW} uniforms={{ tint: "#38bdf8" }} style={{ height: 200, borderRadius: 14 }} />;
}

mount(() => <Glow />);
```

<a id="the-shader"></a>

## الـ Shader

مصدر الـ Shader هو WGSL، لغة التظليل الخاصة بـ WebGPU. وهو يعرّف دالة واحدة:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` هي نقطة من صندوق الـ View، من `(0, 0)` عند زاويته العلوية اليسرى إلى `(1, 1)` عند زاويته السفلية اليمنى، ويزداد y نحو الأسفل كما في CSS.
- النتيجة هي لون النقطة: الأحمر والأخضر والأزرق وقناة ألفا بقيم من 0 إلى 1، في فضاء sRGB مع ألفا مباشرة (straight alpha)، كما هي ألوان CSS. تُقصّ القيم خارج النطاق من 0 إلى 1.

إلى جانب `shade` يحتوي المصدر على ما يلزمه من دوال مساعدة وثوابت ومتغيرات `var<private>`. يوفّر NSH نقاط الدخول، ويقرأ مدخلات الـ Shader من مكانين.

<a id="built-ins"></a>

### المتغيرات المدمجة

| المتغير المدمج | النوع | القيمة |
|---|---|---|
| `nsh.size` | `vec2f` | حجم الـ View بالنقاط. |
| `nsh.time` | `f32` | الثواني منذ ظهور الـ Shader. الـ Shader الذي يقرؤه يتحرك: يرسم في كل إطار ما دام على الشاشة. |
| `nsh.scale` | `f32` | عدد البكسلات لكل نقطة في الإطار الجاري رسمه. |

`uv * nsh.size` هي النقطة بالنقاط؛ و`nsh.size.x / nsh.size.y` هي نسبة العرض إلى الارتفاع، وتُبقي الدوائر مستديرة في صندوق غير مربع.

<a id="uniforms"></a>

### المتغيرات الموحّدة (Uniforms)

تُوضع القيم التي يحددها التطبيق في بنية (struct) باسم `Uniforms`، يقرؤها الـ Shader بوصفها `uniforms`:

```wgsl
struct Uniforms {
  colors: array<vec4f, 4>,
  speed: f32,
  center: vec2f,
}

fn shade(uv: vec2f) -> vec4f {
  let t = nsh.time * uniforms.speed;
  // …
}
```

تحدد الخاصية `uniforms` أعضاءها بالاسم. ويقبل كل نوع هذه القيم:

| نوع WGSL | القيم |
|---|---|
| `f32`، `i32`، `u32` | رقم (يُقرَّب نحو الصفر في `i32` و`u32`)، أو قيمة متحركة |
| `vec2f` | `[x, y]`: رقمان أو قيمتان متحركتان |
| `vec3f` | لون (أحمره وأخضره وأزرقه)، أو لون متحرك، أو ثلاثة أرقام |
| `vec4f` | لون مع ألفا، أو لون متحرك، أو أربعة أرقام |
| `array<vec4f, N>` | قائمة تضم حتى `N` لوناً (أو أربعة أرقام لكل منها): لوحة ألوان، أو نقاط توقف تدرج لوني |

الألوان هي أي لون CSS (`"#38bdf8"`، `"rgb(56 189 248)"`، `"hsl(199 93% 60%)"`) وتصل إلى الـ Shader بمكونات sRGB بقيم من 0 إلى 1. الأعضاء التي يتركها التطبيق تكون صفراً. تعيين `uniforms` مرة أخرى يعيد رسم الـ Shader بالقيم الجديدة.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## المتغيرات الموحّدة المتحركة

قد يكون المتغير الموحّد [قيمة متحركة أصلية](../modules/nsh.md#animation)، أو عقدة مشتقة منها (`interpolate`، عمليات حسابية). تكتب المنصة قيمتها في الـ Shader في كل إطار تتغير فيه، وتعيد الرسم، على خيط واجهة المستخدم: يعمل التحريك بأقصى معدل إطارات مهما كانت شيفرة التطبيق مشغولة. تحرّك الأرقام الأعضاء `f32` و`i32` و`u32` ومكونات `vec2f`؛ والاستيفاء (interpolation) إلى ألوان يحرّك `vec3f` أو `vec4f`.

```rust tabs
use nsh_core::{prelude::*, shader::Shader};

fn ripple(program: Shader) -> impl IntoElement {
    let wave = animated_value(0.0);
    wave.timing(1.0, 2200.0, Easing::Linear);
    shader()
        .source(program)
        .uniform("wave", &wave)
        .uniform("center", [0.5_f32, 0.5])
        .h(px(200.0))
}
```

```tsx tabs
import { Animated, cleanup, createAnimatedValue, Easing, Shader } from "nsh";

const RIPPLE = /* wgsl */ `
struct Uniforms { center: vec2f, wave: f32, tint: vec4f }
fn shade(uv: vec2f) -> vec4f {
  let d = distance(uv * nsh.size, uniforms.center * nsh.size) / max(nsh.size.x, nsh.size.y);
  let ring = exp(-pow((d - uniforms.wave * 0.75) * 28.0, 2.0)) * (1.0 - uniforms.wave);
  return vec4f(vec3f(0.03, 0.03, 0.06) + uniforms.tint.rgb * ring * 1.6, 1.0);
}`;

function Ripple() {
  const wave = createAnimatedValue(0);
  const tint = wave.interpolate({ inputRange: [0, 1], outputRange: ["#38bdf8", "#c084fc"] });
  const loop = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad) }));
  loop.start();
  cleanup(() => loop.stop());
  return <Shader source={RIPPLE} uniforms={{ center: [0.5, 0.5], wave, tint }} style={{ height: 200, borderRadius: 14 }} />;
}
```

<a id="pausing"></a>

## الإيقاف المؤقت

`paused` يوقف ساعة الـ Shader: يحتفظ `nsh.time` بقيمته ويثبت الـ Shader صورته. وعند إعادته إلى `false` تبدأ الساعة من حيث توقفت. وتظل تغيّرات المتغيرات الموحّدة والحجم تعيد رسم الـ Shader الموقوف.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

الـ Shader الذي لا يقرأ `nsh.time` يرسم عند تغيّر حجمه أو متغيراته الموحّدة، ويحتفظ بصورته فيما بينها.

<a id="children-and-clipping"></a>

## الأبناء والقص

الـ Shader حاوية: يقبل كل خصائص الـ [View](./view.md) (الأنماط، والحشو وتخطيط أبنائه، وخصائص الضغط والإيماءات، و`onLayout`، وإمكانية الوصول، و`ref`)، ويُرسم أبناؤه فوقه. يملأ الـ Shader صندوق الـ View كما تفعل الخلفية، داخل زواياه المستديرة (`borderRadius`)، وفوق `backgroundColor` الخاصة به.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

حدّد حجماً للـ Shader عبر أنماطه (العرض / الارتفاع، `flex`، نسبة العرض إلى الارتفاع) أو اترك أبناءه يحددون حجمه.

<a id="effects-transitions-and-the-screen"></a>

## التأثيرات والانتقالات والشاشة

يمكن للـ Shader أيضاً أن يرسم ما ترسمه Views أخرى. فيقرأ WGSL الخاص به صوراً عبر أربع دوال، تأخذ كل منها نقطة `uv` من صندوقه وتعيد لوناً sRGB مباشراً مع ألفا، شفافاً خارج الصورة:

| الدالة | تقرأ |
|---|---|
| `sample_content(uv)` | أبناء التأثير، أو السطح كله في تأثير الشاشة |
| `sample_backdrop(uv)` | ما خلف الـ View (يمكن لأي Shader قراءته) |
| `sample_from(uv)` | الجانب الذي يغادره الانتقال |
| `sample_to(uv)` | الجانب الذي يصل إليه الانتقال |

`nsh.progress` هي `progress` الخاصة بالتأثير أو مدى تقدم الانتقال (من 0 إلى 1)، و`nsh.overflow` هو مدى رسم الـ Shader خارج الصندوق، بالنقاط.

**`ShaderEffect`** يرسم أبناءه عبر الـ Shader: فيحتفظون بضغطاتهم وتركيزهم وإمكانية وصولهم، وما يظهر هو نتيجة الـ Shader. `progress` رقم أو قيمة متحركة، تحرّك التأثير أصلياً. `maxSampleOffset` تتيح للـ Shader أن يرسم هذا العدد من النقاط خارج الصندوق (توهج، حافة تمويه)؛ فتخرج `uv` حينئذ عن النطاق من 0 إلى 1. وبدون `source` يُرسم الأبناء كما هم.

```tsx
import { createAnimatedValue, ShaderEffect, Text } from "nsh";

const WIPE_OUT = `
fn shade(uv: vec2f) -> vec4f {
  let c = sample_content(uv);
  let edge = smoothstep(nsh.progress - 0.05, nsh.progress + 0.05, uv.x);
  return vec4f(c.rgb, c.a * edge);
}`;

const gone = createAnimatedValue(0);

<ShaderEffect source={WIPE_OUT} progress={gone} style={{ padding: 16 }}>
  <Text>Wiped away as `gone` goes to 1</Text>
</ShaderEffect>
```

**`ShaderTransition`** يغيّر أبناءه عبر الـ Shader عندما تتغير `value` (نص أو رقم أو قيمة منطقية)، وليس عند قيمتها الأولى: `sample_from` صورة لما رسموه قبلاً، و`sample_to` ما يرسمونه الآن، و`nsh.progress` تنتقل من 0 إلى 1 خلال `duration` ميلي ثانية (300). وبدون `source` يعمل `fallback`: `"fade"` (تلاشٍ متقاطع، وهو الافتراضي) أو `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** و**`ScreenTransition`** يفعلان الشيء نفسه للسطح كله (صفحاته وحواراته وطبقاته العلوية). لا يشغلان مساحة ولا أبناء لهما؛ ضعهما في أي مكان من التطبيق. يُرسم آخر تأثير شاشة جرى تركيبه مع `source`.

تأتي الصفحات والحوارات وتذهب عبر Shader باستخدام **`transitionShader`**: `{ source, uniforms, duration }` على `NavPage` أو `Dialog` (في Rust: `.transition_shader(TransitionShader::new(program))` على `nav_page()` أو `dialog()`). عند دفع الصفحة أو سحبها، أو إظهار الحوار أو إغلاقه، يكون الجانب السفلي (الصفحة التي تحتها، والتطبيق بدون الحوار) هو `sample_from` والعلوي هو `sample_to`؛ وتنتقل `nsh.progress` من 0 إلى 1 عند مجيء الصفحة أو الحوار ومن 1 إلى 0 عند ذهابه، فيرسم Shader واحد الاتجاهين.

```rust tabs
use std::time::Duration;

use nsh_base::nav_page;
use nsh_core::{prelude::*, shader::{Shader, TransitionShader}};

fn details() -> impl IntoElement {
    let ripple = Shader::compile(RIPPLE).expect("a valid shader");
    nav_page()
        .title("Details")
        .transition_shader(TransitionShader::new(ripple).duration(Duration::from_millis(500)))
        .child(text("…"))
}
```

```tsx tabs
<NavPage title="Details" transitionShader={{ source: RIPPLE, duration: 500 }}>…</NavPage>
```

يحلّ الـ Shader محل `animation` الخاصة بالصفحة أو الحوار، أياً كانت (بما فيها `"none"`). ويعمل `animation` على جهاز بلا GPU، وعندما يطلب المستخدم حركة أقل (Reduce Motion، Remove animations)، ومع مصدر لا يُترجم؛ ومع `"none"` يظهر التغيير حينئذ فوراً. أي دفع أو سحب أو إظهار أو إغلاق يبدأ أثناء تشغيل آخر يُكمل ذلك الآخر أولاً: تصل صفحته أو حواره أو تغادر، ويُطلق `onShow` أو `onDismiss` الخاص به، ثم يبدأ التغيير الجديد من هناك.

تلتقط المنصات الصور عندما يتغير ما تعرضه، مرة واحدة على الأكثر لكل إطار عرض. وتُرسم الصورة بمُصيّر المنصة نفسها، فما لا يستطيع رسمه في صورة (فيديو، صفحة ويب، View تابع لتطبيق آخر) يظهر شفافاً فيها.

<a id="props"></a>

## الخصائص

يقبل الـ Shader خصائص الـ [View](./view.md) بالإضافة إلى:

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `source` | `.source(program)` | `string` | مصدر WGSL الذي يعرّف `fn shade(uv: vec2f) -> vec4f`. تترجمه Rust بـ `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | قيم أعضاء `struct Uniforms` بالاسم: أرقام وألوان وقيم متحركة وقوائم منها. |
| `paused` | `.paused(bool)` | `boolean` | يوقف ساعة `nsh.time`. الافتراضي `false`. |

`ShaderEffect` و`ScreenEffect` يقبلان هذه (مع `source` اختيارية) بالإضافة إلى:

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `progress` | `.progress(n)`، `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. الافتراضي 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | المدى خارج الصندوق، بالنقاط، الذي يرسمه الـ Shader وتبلغه صوره (`ShaderEffect` و`ShaderTransition`). الافتراضي 0. |

`ShaderTransition` و`ScreenTransition` يقبلان `source` و`uniforms` و`paused` بالإضافة إلى:

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | عندما تتغير، يعمل الانتقال (وليس عند القيمة الأولى). |
| `duration` | `.duration(Duration)` | `number` | مدة تشغيله بالميلي ثانية. الافتراضي 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | ما يعمل بدون `source`. الافتراضي `"fade"`. |

`NavPage` و`Dialog` يقبلان:

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`، `.uniform(name, value)`، `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | الـ Shader الذي تأتي عبره الصفحة أو الحوار وتذهب بدلاً من `animation` الخاصة بها. `duration` بالميلي ثانية، و350 افتراضياً. |

<a id="errors"></a>

## الأخطاء

يفحص NSH كل Shader عند تعيين مصدره، قبل أن يصل إلى الـ GPU. الـ Shader الذي لا يُترجم يسجّل تحذيراً فيه السطر والعمود في مصدره وما هو الخطأ، مثلاً:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

يعرض الـ View حينئذ خلفيته وأبناءه. أما متغير موحّد ينقص البنيةَ، أو قيمة لا يقبلها نوعه، فيسجّل تحذيراً باسم المتغير الموحّد، وتُطبَّق المتغيرات الأخرى.

يُترجم كل مصدر مرة واحدة: الـ Views التي تتشارك المصدر، والمصدر المعيَّن مرة أخرى، تستخدم الـ Shader المترجم.

<a id="rules-and-limits"></a>

## القواعد والحدود

- `shade` له التوقيع `fn shade(uv: vec2f) -> vec4f` تماماً. يعلن المصدر دوالّه وثوابته وبنياته ومتغيرات `var<private>` الخاصة به؛ ويوفّر NSH نقاط الدخول والارتباطات (bindings).
- أقصى حجم للمصدر 64 KiB.
- `struct Uniforms` يأخذ 4096 بايت على الأكثر، بأعضاء من الأنواع الواردة في الجدول أعلاه.
- أقصى حجم للإطار 4096 بكسل في كل ضلع: الـ View الأكبر يرسم الـ Shader بمقياس أدنى.

للضوضاء، طبّق دالة تجزئة (hash) على الخلية الصحيحة التي توجد فيها النقطة (`bitcast<vec2u>(vec2i(floor(p)))` مخلوطة بعمليات ضرب وإزاحات xor) بدلاً من `fract(sin(…) * 43758.5)`: فالتجزئة الصحيحة تعطي القيمة نفسها للخلية في كل مكان تُحسب فيه، فتبقى ضوضاء القيم سلسة على كل GPU. تعرض Shaders المعرض (gallery) مثالاً على ذلك.

<a id="platforms"></a>

## المنصات

على iOS وAndroid وmacOS وWindows وLinux، وفي تطبيقات GPUI، يُصيّر NSH الـ Shaders على الـ GPU باستخدام wgpu (Metal على منصات Apple، وVulkan أو Direct3D 12 أو OpenGL في غيرها) بمقياس الشاشة، ويعرض كل إطار تحت أبناء الـ View. يجري التصيير بالتوازي مع واجهة المستخدم: يظهر الإطار بعد رسمه بإطار عرض أو اثنين، وتبقى الواجهة سريعة الاستجابة أثناء عمل الـ GPU. وعلى الويب، يترجم NSH الـ Shader إلى GLSL ويرسمه بـ WebGL 2.

ترسم الـ Shaders مرة واحدة على الأكثر لكل إطار عرض، وفقط عندما يتغير ما تعرضه: الـ Shader ذو المتغيرات الموحّدة الثابتة يرسم مرة واحدة، والذي يقرأ `nsh.time` يرسم في كل إطار، والذي له متغيرات موحّدة متحركة يرسم ما دامت تتحرك.

## Rust

`shader()` (من `nsh_core::element`) تنشئ View من نوع Shader؛ و`.source(program)` تعطيه `Shader` مترجماً (`nsh_core::shader::Shader::compile(source)`، التي تعيد الأخطاء نفسها المذكورة أعلاه). ترجم البرنامج مرة واحدة وشاركه: نسخه رخيص. وقد يكون البرنامج مربوطاً، `.source(move || …)`، للتبديل بين البرامج.

| الطريقة | الوصف |
|---|---|
| `.uniform(name, value)` | تعيّن عضواً من `struct Uniforms`: رقماً، أو `Color` أو `Hsla`، أو `[f32; 2]` / `[f32; 3]` / `[f32; 4]`، أو `Vec<UniformValue>`. القيمة المربوطة (`move \|\| …`) تعيّنه مرة أخرى عندما تتغير؛ والقيمة المتحركة (`&wave`: رقم، أو ألوان لـ `vec3f` / `vec4f`) تحرّكه في كل إطار، أصلياً. |
| `.paused(bool)` | توقف ساعة `nsh.time`؛ قابلة للربط. |

تُضاف الأبناء بـ `.child(..)`، والأنماط بالطرق المنمّطة المعتادة. `shader_effect()` و`shader_transition()` و`screen_effect()` و`screen_transition()` تنشئ العناصر الأخرى، بالطرق الواردة في الجداول أعلاه.
