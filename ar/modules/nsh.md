---
title: "nsh"
description: "الوحدة الأساسية: الإشارات (signals)، والتأثيرات (effects)، والسياق (context)، والتركيب (mount)، ورموز التصميم (design tokens)، والرسوم المتحركة، والبيئة، والإيماءات، والحافظة، والتخزين، وقناة المضيف (host channel)، واختصارات لوحة المفاتيح، وإمكانية الوصول، وأنواع العناصر والأنماط."
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` هي الوحدة الأساسية: واجهة البرمجة التفاعلية (الإشارات signals، والقيم المحسوبة computed، والتأثيرات effects، والسياق context)، و`mount`، و`token`، وعناصر المضيف `View` و`Text` و`Scroll` و`Overlay`، و[العروض القابلة للتحديد](#selectable-views)، و[المنطقة الآمنة ولوحة المفاتيح](#safe-area-and-keyboard)، و[الرسوم المتحركة](#animation)، و[الجهاز وبيئته](#device)، و[`PanResponder`](#panresponder)، و[الحافظة](#clipboard)، و[منتقي الصور](#picker)، و[التعرف على الكلام](#speech)، و[التخزين](#storage)، و[قناة المضيف](#host)، و[اختصارات لوحة المفاتيح](#keymap)، و[المكونات والوحدات الأصلية](#nativecomponent-and-nativemodule)، و[إمكانية الوصول](#accessibility)، وأنواع TypeScript الخاصة بالعناصر والأنماط والأحداث. يعمل الرسم التفاعلي نفسه أصلياً بلغة Rust؛ وقراءة الإشارة هي استدعاء إلى بيئة التشغيل يكلّف بضعة نانوثوانٍ، ولا يعمل في مفسّر JavaScript سوى الدوال المغلقة (closures) التي تكتبها أنت.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

يتبع التفاعل في NSH النموذج نفسه المستخدم في SolidJS: تعمل دالة المكوّن **مرة واحدة**، وتُحدَّث أجزاء الواجهة التي تقرأ الإشارات في مكانها عندما تتغير تلك الإشارات. لا يُعاد رسم المكوّن ولا يوجد DOM افتراضي. راجع [التفاعلية](../docs/reactivity.md) للاطلاع على الدليل.

## signal

```ts
function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;

interface Signal<T> {
  (): T;                              // read (tracked)
  set(value: T): void;                // write
  update(fn: (value: T) => T): void;  // write from the current value
}

interface SignalOptions<T> {
  /** When a new value counts as a change (default `===`); `false`: always. */
  equals?: false | ((previous: T, next: T) => boolean);
}
```

تحمل الإشارة قيمة. استدعاؤها يقرأ القيمة، وداخل نطاق التتبع (تعبيرات JSX، و`computed`، و`effect`) يشترك ذلك النطاق فيها. يكتب `set` و`update` القيمة، ويتحدّث كل ما قرأها.

```tsx
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>Count: {count()}</Text>
      <Text onPress={() => count.update((n) => n + 1)}>Add one</Text>
    </View>
  );
}

mount(Counter);
```

افتراضياً، لا يفعل أي شيء الإسناد الذي `===` للقيمة الحالية. مرّر `equals: false` للإشعار عند كل كتابة (مفيد عندما تعدّل كائناً في مكانه ثم تسند الكائن نفسه مرة أخرى)، أو مرّر دالة المقارنة الخاصة بك:

```ts
const items = signal<string[]>([], { equals: false });
const point = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

## computed

```ts
function computed<T>(fn: (previous: T | undefined) => T, options?: SignalOptions<T>): Accessor<T>;

interface Accessor<T> {
  (): T;
}
```

قيمة مشتقة من إشارات. يعمل `fn` مرة أخرى عندما تتغير إشارة قرأها؛ ولا تتحدّث الجهات القارئة للقيمة المحسوبة إلا عندما تتغير نتيجتها (بحسب `equals`، وهي `===` افتراضياً). يستقبل `fn` النتيجة السابقة.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

استخدم `computed` عندما يكون الاشتقاق مكلفاً أو يُقرأ في عدة أماكن. أما التعبير الرخيص فدالة عادية (`const full = () => first() + " " + last()`) تفاعلية بالقدر نفسه.

## effect

```ts
function effect(fn: () => void): void;
```

يشغّل `fn` بعد العرض، ومرة أخرى كلما تغيّرت إشارة قرأها. استخدم التأثيرات للآثار الجانبية: التسجيل (logging)، والمؤقتات، والتخاطب مع الوحدات الأصلية. ينتمي التأثير إلى المكوّن (أو التأثير) الذي أُنشئ فيه ويُتخلص منه معه.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

للتراجع عن شيء قبل أن يعمل التأثير مرة أخرى (أو عندما يزول مكوّنه)، استدعِ [`cleanup`](#cleanup) داخله.

## batch

```ts
function batch<T>(fn: () => T): T;
```

يشغّل `fn` ويطبّق كل عمليات الكتابة فيه معاً في النهاية، فتتحدّث الجهات القارئة مرة واحدة بدلاً من مرة لكل كتابة. يعيد ما يعيده `fn`.

```ts
batch(() => {
  first.set("Grace");
  last.set("Hopper");
}); // `full` recomputes once
```

## untracked

```ts
function untracked<T>(fn: () => T): T;
```

يشغّل `fn` دون اشتراك النطاق الحالي فيما يقرؤه. استخدمه لقراءة إشارة داخل تأثير أو تعبير JSX دون الاعتماد عليها.

```ts
effect(() => {
  // Runs again when `query` changes, not when `page` changes.
  search(query(), untracked(() => page()));
});
```

## cleanup

```ts
function cleanup(fn: () => void): void;
```

يسجّل `fn` ليعمل قبل أن يعمل التأثير الحالي مرة أخرى، أو عندما يزول المكوّن أو التأثير الحالي.

```tsx
function Clock() {
  const now = signal(new Date());
  const timer = setInterval(() => now.set(new Date()), 1000);
  cleanup(() => clearInterval(timer));
  return <Text>{now().toLocaleTimeString()}</Text>;
}
```

## context

```ts
function context<T>(defaultValue: T): Context<T>;

interface Context<T> extends Accessor<T> {
  Provider: (props: { value: T; children?: JSX.Element }) => JSX.Element;
}
```

قيمة يوفّرها مكوّن لكل ما يعرضه، مهما كان عمقه. استدعاء السياق (`Theme()`) يقرأ قيمة أقرب مزوّد، أو `defaultValue` عند عدم وجود مزوّد.

```tsx
import { context, mount, signal, Text, View } from "nsh";

const Theme = context<"light" | "dark">("light");

function Label(props: { text: string }) {
  return <Text style={{ color: Theme() === "dark" ? "#fff" : "#000" }}>{props.text}</Text>;
}

function App() {
  const dark = signal(false);
  return (
    <Theme.Provider value={dark() ? "dark" : "light"}>
      <View style={{ flex: 1, padding: 24, backgroundColor: dark() ? "#000" : "#fff" }}>
        <Label text="Hello" />
        <Text onPress={() => dark.update((d) => !d)}>Toggle</Text>
      </View>
    </Theme.Provider>
  );
}

mount(App);
```

## mount

```ts
function mount<P extends object>(app: Component<P>, props?: P): () => void;
```

يعرض `app` في السطح (النافذة، أو `NshAppView` / `NshView` المضمَّن فيه التطبيق) ويعيد دالة تزيله. ينتهي ملف الدخول لكل تطبيق بـ `mount(App)`.

```tsx
mount(App);
```

## split

```ts
function split<T extends object, K extends readonly (keyof T)[]>(
  props: T,
  keys: K,
): [Pick<T, K[number]>, Omit<T, K[number]>];
```

يقسّم كائن الخصائص إلى الخصائص المسمّاة في `keys` وبقية الخصائص. يبقى النصفان تفاعليين: الخصائص التي تتغير قيمها هي getters، ويحتفظ `split` بها كـ getters. استخدمه في مكوّن يعالج بعض الخصائص بنفسه ويمرّر الباقي. أما تفكيك الخصائص بالتفكيك (`const { label } = props`) فيقرؤها مرة واحدة ويفقد التحديثات.

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function LabeledInput(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input {...rest} />
    </View>
  );
}
```

## ErrorBoundary

```ts
function ErrorBoundary(props: {
  fallback: JSX.Element | ((error: unknown, reset: () => void) => JSX.Element);
  children?: JSX.Element;
}): JSX.Element;
```

يعرض أبناءه، أو `fallback` عندما يُطلق شيء تحتهم استثناءً: جسم مكوّن، أو ربط، أو تأثير، أو معالج حدث. يُزال الجزء الذي فشل ويظهر البديل مكانه. تُستدعى الدالة `fallback` على الصورة `fallback(error, reset)` مع القيمة المُطلَقة و`reset` الذي يعرض الأبناء مرة أخرى، مهما كانت المعاملات التي تعلنها؛ أما العنصر `fallback` فيُعرض كما هو. ينتقل الفشل إلى أقرب حدّ (boundary) فوقه، والفشل في البديل ينتقل إلى الحد الذي فوقه. تستخدم مكونات Rust `catch_error` ([حدود الأخطاء](../docs/reactivity.md#error-boundaries)).

```tsx
import { ErrorBoundary, Text, View } from "nsh";

function Feed() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>{error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Posts />
    </ErrorBoundary>
  );
}
```

## token

```ts
function token<K extends keyof Tokens>(name: K): Tokens[K];
```

رمز التصميم `name` في سمة التطبيق (`"theme"` في `nsh.json`، فوق رموز shadcn/ui) بحسب المظهر المعروض:
اللون على صورة `#rrggbbaa`، والطول كعدد من النقاط، والخط باسم عائلته. الأسماء هي متغيرات CSS الخاصة بالسمة
دون `--` (`primary`، `muted-foreground`، `radius`، `font-mono`، والرموز الخاصة بالتطبيق، مثل `up`). قراءته
تفاعلية: يعمل المكوّن أو memo أو التأثير الذي يقرأ رمزاً مرة أخرى عندما تتغير السمة أو المظهر.
يسرد `Tokens` رموز التطبيق مع أنواعها؛ ويكتبه NSH في `.nsh/types/nsh/tokens.d.ts` انطلاقاً من السمة. بالنسبة إلى
الأصناف (classes)، سمِّ الرموز مباشرة (`bg-primary`، `rounded-(--radius)`): [رموز السمة](../docs/tailwind.md#theme-tokens).

```tsx
import { effect, token } from "nsh";

effect(() => console.log("primary is", token("primary"), "radius", token("radius")));
```

## View, Text, Scroll, Overlay

```ts
function View(props: ViewProps): JSX.Element;
function Text(props: TextProps): JSX.Element;
function Scroll(props: ScrollProps): JSX.Element;
function Overlay(props: OverlayProps): JSX.Element;
```

عناصر المضيف التي يصدّرها `nsh`، تُكتب كوسوم: `<View>`، `<Text>`، `<Scroll>`، `<Overlay>` (يضع
أبناءه أعلى النافذة، موضوعين مقابل نقطة ارتكاز: [Overlay](../elements/overlay.md)). ينشئ المصرّف (compiler)
العرض الأصلي في مكانه للوسم الذي يسمّي أحدها عبر استيراده (ويشمل ذلك الاسم المستعار)، لذا فاستيرادها لا يكلّف
شيئاً وقت التشغيل. وهي مكوّنات مثل أي مكوّن آخر، فيمكن تمريرها أيضاً (`const Tag = inline ? Text : View`).
يصدّر `nsh` بقية العناصر الأولية بالطريقة نفسها: [`List`](./nsh-list.md)، و[`Image`](./nsh-image.md)،
و[`Canvas`](./nsh-canvas.md)، و[`WebView`](./nsh-webview.md) و[`Video`](./nsh-video.md)، ولكل منها صفحة مرجعية
خاصة. وخصائصها موثقة ضمن [العناصر](../elements/index.md). أما حقل إدخال النص `Input` فيأتي من
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## المنطقة الآمنة ولوحة المفاتيح

تُبقي متغيرات البيئة في CSS المحتوى بعيداً عن واجهة النظام، في الحشو (padding) والهامش (margin) لأي عرض
(`padding`، `paddingTop`، ...، مفاتيح `margin` نفسها؛ والقيم الاعتباطية `p*` / `m*` في Tailwind؛ والدوال `Styled`
`.p_safe_area()`، `.pt_safe_area_plus(..)`، `.pb_keyboard()`، ... في Rust). قيمها هي `EnvValue`:
`env(name)`، `env(name, <length>)`، `calc(env(name) + <length>)` و`calc(<length> + env(name))`.

| المتغير | القيمة |
|---|---|
| `safe-area-inset-top`، `-right`، `-bottom`، `-left` | هوامش العرض الجذري الذي تُعرض فيه العقدة: هوامش أقرب صفحة (أسفل ترويستها)، أو أقرب حوار، وإلا فالمنطقة الآمنة للسطح. راجع [المنطقة الآمنة](../elements/safe-area.md). |
| `keyboard-inset-height` | ارتفاع لوحة المفاتيح البرمجية فوق السطح، ويساوي 0 أثناء إخفائها؛ وتتحرك التغييرات بحركة أصلية مع لوحة المفاتيح. راجع [لوحة المفاتيح](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

### safeArea and safeAreaInsets

`safeArea()` هي المنطقة الآمنة للسطح (`safe_area()` في Rust)؛ و`safeAreaInsets()` هي الهوامش حيث
يُعرض المكوّن (`cx.insets()` في Rust)، وهي قيم المتغيرات `safe-area-inset-*`. كلاهما `Edges` تفاعلي
(`{ top, right, bottom, left }` بالنقاط). راجع
[safeArea and safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

### Keyboard and keyboardFrame

`Keyboard.dismiss()` يخفي لوحة المفاتيح البرمجية (`dismiss_keyboard()` في Rust) و`keyboardFrame()` يخبرك بمقدار
ما تغطيه من الشاشة (`keyboard_height()` و`keyboard_duration()` في Rust). راجع
[إخفاء لوحة المفاتيح](../elements/keyboard.md#hiding-the-keyboard) و
[ارتفاع لوحة المفاتيح](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## العروض القابلة للتحديد

`<View selectable>` (`view().selectable(true)` في Rust) يجعل النصوص داخله تُحدَّد معاً، كما في
صفحة الويب: تمتد تحديدة واحدة عبر العروض وعناصر `Text` وعناصر `TextView` بترتيب القراءة. راجع
[تحديد النص](../elements/text-selection.md).

<a id="animation"></a>

## الرسوم المتحركة

تحرّك واجهة برمجة الرسوم المتحركة على خيط واجهة المستخدم. تنشئ **قيمة متحركة**، وتربطها (أو القيم المشتقة منها) بخاصية نمط، وتبدأ الحركة؛ ومن ذلك الحين يُحسب كل إطار أصلياً، دون تشغيل شيفرة التطبيق. ولا يمكن لمحرك مشغول أو خيط JS مشغول أن يجعل الحركة متقطعة، ولا تكلّف الحركة التطبيق أي عمل لكل إطار. تستخدم شيفرة Rust `animated_value()` و`motion()` و`Animation` و`Spring` و`Timing` و`KeyframeTiming` و`MotionPreset` و`Easing` من `nsh_core::prelude` وتربط القيم بدوال `.bind_*` الخاصة بالعناصر؛ أما TSX فيستوردها من `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

راجع [الرسوم المتحركة](../docs/animation.md) للاطلاع على الدليل.

<a id="what-an-animated-value-can-drive"></a>

### ما الذي يمكن أن تقوده القيمة المتحركة

| أين | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`، `color` | `.bind_border_color(&node)`، `.bind_color(&node)` | الشيء نفسه: عقدة من الألوان. `borderColor` يلوّن كل الجوانب؛ و`color` الخاص بـ `Text` يلوّن النص كله |
| `transform` | `.bind_translate_x(&value)`، `.bind_translate_y`، `.bind_scale`، `.bind_rotate` (بالدرجات) | `translateX`، `translateY`، `scale`، `scaleX`، `scaleY`، `rotate`، `rotateX`، `rotateY`، `rotateZ` خطوات: `transform: [{ translateX: value }]` |
| موضع التمرير | `.scroll_value(&value)` على عرض تمرير أو قائمة | `<Scroll scrollValue={value}>` و`<List scrollValue={value}>` يكتبان إزاحة التمرير فيها في كل إطار |
| الإيماءات | `.pan_values(Some(&x), Some(&y))`، `.pinch_value(&scale)`، `.rotation_value(&angle)` | `pan={{ x, y }}`، `pinch={{ scale }}`، `rotation={{ angle }}` على أي عنصر: تكتب الإيماءة القيم مباشرة (راجع [اللمس والإيماءات](../docs/touch-and-gestures.md)) |
| أين تلتصق العروض | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` في عرض تمرير أفقي)، `.bind_sticky_header_offset(&value)` على قائمة | `style={{ position: "sticky", top: value }}`، `<List stickyHeaderOffset={value}>`: تلتصق العروض والترويسات اللاصقة على هذا البعد من بداية إطار العرض، متبعةً القيمة في كل إطار |
| Canvas | معامل متحرك في استدعاء أداة رسم | أي معامل رقمي أو لوني في استدعاء رسم [canvas](./nsh-canvas.md) |
| Shader | `.uniform(name, &value)` | عضو في `struct Uniforms` الخاص بـ [shader](../elements/shader.md): `uniforms={{ name: value }}` (أرقام، أو عقدة من الألوان لـ `vec3f` / `vec4f`) |

تأخذ خصائص النمط الأخرى قيماً عادية؛ ولتحريك التخطيط نفسه (الأحجام، والمواضع في التدفق)، استخدم [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

ينشئ قيمة متحركة تبدأ من `value` (الافتراضي `0`). في Rust: `animated_value(value)`، وهو مقبض `Copy` يحتفظ به المكوّن الذي أنشأه.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let right = stored(false);
    let toggle = move || {
        let to_right = !right.get();
        right.replace(to_right);
        let _ = x.spring(if to_right { 200.0 } else { 0.0 }, Spring::default());
    };
    view()
        .flex_1()
        .p_6()
        .pt_12()
        .gap_4()
        .child(view().size(px(60.0)).rounded(px(12.0)).bg(rgb(0x6366f1)).bind_translate_x(&x))
        .child(text("Move").on_press(toggle))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  let right = false;
  const toggle = () => {
    right = !right;
    x.spring(right ? 200 : 0);
  };
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 48, gap: 16 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#6366f1", transform: [{ translateX: x }] }} />
      <Text onPress={toggle}>Move</Text>
    </View>
  );
}

mount(App);
```

> [!NOTE]
> تعيش القيمة المتحركة على خيط واجهة المستخدم وتتغير هناك في كل إطار، لذا يقرؤها التطبيق بشكل غير متزامن: `await value.getValue()` (أو `{ value }` الذي يحلّ به `stop()`) يعطي القيمة في تلك اللحظة، وفي Rust `value.value().await` داخل مهمة. احتفظ بالهدف في متغير أو إشارة عندما تحتاجه شيفرتك فوراً، كما في الأعلى. وتبلّغ أحداث الإيماءات بالقيم عند نهايتها (`PanEvent.value`).

### AnimatedValue

```ts
class AnimatedValue extends AnimatedNode {
  constructor(value: number);
  set(value: number): void;
  stop(): Promise<{ value: number }>;
  getValue(): Promise<number>;
  setOffset(offset: number): void;
  flattenOffset(): void;
  extractOffset(): void;
  timing(to: number, options?: { duration?: number; easing?: Easing; delay?: number }): Promise<{ finished: boolean }>;
  spring(to: number, options?: { stiffness?: number; damping?: number; mass?: number; velocity?: number }): Promise<{ finished: boolean }>;
  decay(options?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): Promise<{ finished: boolean }>;
  keyframes(keyframes: KeyframeValue[], options?: KeyframeTiming): Promise<{ finished: boolean }>;
}
```

| الدالة | Rust | الوصف |
|---|---|---|
| `set(value)` | `set(value)` | يقفز إلى `value`، موقفاً أي حركة جارية. |
| `stop()` | `stop()`، ثم `value().await` | يوقف الحركة الجارية عند موضعها؛ ويحلّ بـ `{ value }`، أي القيمة عند ذلك الموضع. |
| `getValue()` | `value().await` | يحلّ بالقيمة الحالية (مع إزاحتها)، مقروءةً على خيط واجهة المستخدم. |
| `setOffset(offset)` | `set_offset(offset)` | إزاحة تُضاف إلى القيمة: ترى الروابط القيمة + الإزاحة؛ و`set` والحركات والسحب تحرّك القيمة. |
| `flattenOffset()` | `flatten_offset()` | يضيف الإزاحة إلى القيمة ويجعلها 0. |
| `extractOffset()` | `extract_offset()` | ينقل القيمة إلى الإزاحة ويجعل القيمة 0 (فيبدأ السحب التالي من حيث انتهى السابق). |
| `timing(to, options)` | `timing(to, ms, easing)`، `timing_with(to, Timing { … })` | يتحرك إلى `to` على منحنى تسهيل (easing). `duration` بالميلي ثانية (الافتراضي 300)، `easing` (الافتراضي `"easeInOut"`)، `delay` بالميلي ثانية (الافتراضي 0). |
| `spring(to, options)` | `spring(to, Spring { … })` | يرتد كالنابض إلى `to`. `stiffness` (الافتراضي 170)، `damping` (الافتراضي 26)، `mass` (الافتراضي 1)، `velocity` (السرعة الابتدائية، بوحدات في الثانية). |
| `decay(options)` | `decay(velocity, deceleration)`، `decay_within(velocity, deceleration, (min, max), bounce)` | ينساب انطلاقاً من `velocity` (بوحدات في الثانية) ويتباطأ بمقدار `deceleration` لكل ميلي ثانية (الافتراضي 0.998). استخدمه بعد حركة الدفع السريع (fling)، بالسرعة القادمة من `onPanEnd`. ومع `clamp: [min, max]` يتوقف عند حد، أو يرتد عنه محتفظاً بـ `bounce` (من 0 إلى 1، الافتراضي 0) من سرعته. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | يشغّل [الإطارات المفتاحية](#keyframes) كما تُشغَّل الإطارات المفتاحية في CSS: تسهيل لكل مقطع، و`iterations` مرة في `direction`. |

تعيد كل دالة حركة وعداً (promise) يحلّ بـ `{ finished }`: `true` عندما انتهت الحركة، و`false` عندما أُوقفت (بواسطة `stop` أو `set` أو حركة أخرى للقيمة نفسها). وفي Rust تعيد `AnimationEnd`، تنتظرها مهمة (task) للحصول على `bool` نفسه.

```rust tabs
let opacity = animated_value(1.0);
spawn(async move {
    if opacity.timing(0.0, 200.0, Easing::EaseInOut).await {
        visible.set(false);
    }
});
```

```tsx tabs
const opacity = createAnimatedValue(1);
const { finished } = await opacity.timing(0, { duration: 200 });
if (finished) visible.set(false);
```

### AnimatedNode

```ts
class AnimatedNode {
  interpolate(config: {
    inputRange: number[];
    outputRange: number[] | string[];
    extrapolate?: Extrapolation;
    extrapolateLeft?: Extrapolation;
    extrapolateRight?: Extrapolation;
    easing?: Easing;
  }): AnimatedNode;
  diffClamp(min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  add(b: AnimatedNode | number): AnimatedNode;
  sub(b: AnimatedNode | number): AnimatedNode;
  mul(b: AnimatedNode | number): AnimatedNode;
  div(b: AnimatedNode | number): AnimatedNode;
  mod(b: AnimatedNode | number): AnimatedNode;
}

type Extrapolation = "extend" | "clamp" | "identity";
```

عقدة في رسم الحركة الأصلي: `AnimatedValue`، أو قيمة مشتقة من قيم أخرى. تُقيَّم العقد المشتقة على خيط واجهة المستخدم كلما تغيّرت مدخلاتها.

| الدالة | Rust | الوصف |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`، `interpolate_colors(&input, &colors)`، `interpolate_with(&input, output, Interpolation { … })` | يحوّل المدخل عبر نطاقات مجزأة. يحتوي `outputRange` على أرقام أو ألوان (`"#ff0000"`، `"rgba(…)"`) أو زوايا (`"45deg"`، `"1rad"`). خارج `inputRange` يقصّ القيمة افتراضياً؛ ويمكن أن يكون `extrapolate` (أو `extrapolateLeft` / `extrapolateRight`) `"extend"` (متابعة الخط)، أو `"clamp"` أو `"identity"` (تمرير المدخل كما هو). `easing` يشكّل كل مقطع. يقبل Rust الأرقام وألوان السمة (التي تتبع المظهر) والزوايا بالدرجات لـ `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`، `diff_clamp_with(min, max, DiffClamp::snapping())` | يتبع تغيّرات المدخل لكنه يُبقي النتيجة ضمن `min..max`: ترويسة تختفي أثناء تمرير المحتوى للأعلى وتعود فور التمرير للأسفل. `snap: true` يثبّتها عند الحد الأقرب خلال 200 ms عندما يستقر عرض التمرير الخاص بها، وعند `max` فقط بعد أن يبلغ المدخل `max`. |
| `add`، `sub`، `mul`، `div` | `add`، `sub`، `mul`، `div` | عمليات حسابية مع عقدة أخرى أو ثابت. |
| `mod(b)` | `modulo(b)` | باقي القسمة، لا يكون سالباً أبداً مع `b` موجب (يُبقي الزوايا ضمن 0..360). |

```rust tabs
let scroll_y = animated_value(0.0);
let header = scroll_y.diff_clamp(0.0, 44.0);

view()
    .flex_1()
    .child(scroll().scroll_value(&scroll_y).flex_1() /* rows */)
    .child(view().h(px(44.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 44);

<Scroll scrollValue={scroll} style={{ flex: 1 }}>{/* rows */}</Scroll>
<View style={{ height: 44, transform: [{ translateY: header.mul(-1) }] }} />
```

```rust tabs
let progress = animated_value(0.0);
let rotate = progress.interpolate(&[0.0, 1.0], &[0.0, 360.0]); // degrees, for bind_rotate
let color = progress.interpolate_colors(&[0.0, 0.5, 1.0], &[rgb(0x22c55e), rgb(0xeab308), rgb(0xef4444)]);
```

```tsx tabs
const progress = createAnimatedValue(0);
const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
const color = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["#22c55e", "#eab308", "#ef4444"] });
```
### Keyframes

```ts
interface Keyframe {
  offset?: number;          // 0..1 of an iteration; missing offsets spread evenly
  value: number | string;   // a number, or an angle ("45deg", "0.5turn") in degrees
  easing?: Easing;          // the segment that starts here
}
type KeyframeValue = number | string | Keyframe;

interface KeyframeTiming {
  duration?: number;        // one iteration, ms (300)
  delay?: number;           // before the first iteration, ms (0)
  easing?: Easing;          // segments without their own (CSS "ease")
  iterations?: number | "infinite";   // 1
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}
```

يشغّل `value.keyframes(frames, options)` قيمةً عبر إطارات مفتاحية (keyframes) ويُنجَز بالقيمة `{ finished }` التي تبيّن هل اكتملت؛ `Animated.keyframes(value, { keyframes, ...options })` مثل خطوة في animation مركّب. Rust: `value.keyframes(frames, KeyframeTiming)` و`Animation::keyframes(&value, frames, KeyframeTiming)`، مع `Keyframe::new(value)` (موزّعة بالتساوي) و`Keyframe::at(offset, value)` و`.ease(easing)`، و`KeyframeTiming::new(ms)` مع `.delay(ms)` و`.easing(e)` و`.iterations(Some(n))` و`.infinite()` و`.direction(PlaybackDirection::…)`.

تعمل كما تعمل إطارات CSS المفتاحية: يشكّل الـ easing مقطعًا واحدًا (easing الإطار المفتاحي للمقطع الذي يبدأ عنده، وeasing التوقيت لكل المقاطع الأخرى)؛ والإزاحات (offsets) الغائبة من الإطارات تُوزَّع بالتساوي، فيكون الأول عند 0 والأخير عند 1؛ وتبدأ كل دورة (iteration) بقفزة إلى أول إطار مفتاحي، وإن لم يكن هناك إطار عند 0 فإن القيمة تنطلق من موضعها الحالي؛ وخلال `delay` تحتفظ القيمة بأول إطار مفتاحي (في CSS `animation-fill-mode: backwards`)؛ وتشغّل الدورات العكسية المقاطع بالاتجاه المعاكس مع عكس منحنياتها؛ وتبقى القيمة حيث تتركها الدورة الأخيرة.

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).iterations(Some(3)),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, iterations: 3 });
```

### createMotion

```ts
function createMotion(options?: MotionOptions): Motion;

interface MotionOptions extends MotionPlayOptions {
  initial?: { [C in MotionChannel]?: number };   // where channels start (the others at rest)
  enter?: MotionName | MotionSpec;   // start where it starts and play it at once
}

interface MotionPlayOptions extends KeyframeTiming {
  ignoreReduceMotion?: boolean;      // play even when the user asks for less motion
}

interface Motion {
  readonly opacity: AnimatedValue;
  readonly translateX: AnimatedValue;
  readonly translateY: AnimatedValue;
  readonly rotate: AnimatedValue;    // degrees
  readonly rotateX: AnimatedValue;
  readonly rotateY: AnimatedValue;
  readonly scale: AnimatedValue;
  readonly scaleX: AnimatedValue;
  readonly scaleY: AnimatedValue;
  readonly style: { opacity: AnimatedValue; transform: MotionTransform };
  readonly transform: MotionTransform;
  play(motion: MotionName | MotionSpec, options?: MotionPlayOptions): Promise<{ finished: boolean }>;
  animation(motion: MotionName | MotionSpec, options?: MotionPlayOptions): CompositeAnimation;
  stop(): void;
  reset(): void;
}
```

ينشئ حركة (motion): قيمة متحركة لكل قناة من قنوات opacity وtransform في العرض، في حالة السكون (opacity والمقاييس 1، والبقية 0)، وحركات تُشغَّل عليها بشكل native. اربطه بـ `style={motion.style}`، أو وزّع `motion.style` أو `motion.transform` داخل style؛ يطبّق التحويل الإزاحات أولًا ثم التدويرات ثم المقاييس، مع دمج `scale` في `scaleX` و`scaleY`: 7 من خطوات التحويل الثماني للعرض، مما يترك واحدة لك (`[{ perspective: 600 }, ...motion.transform]` للقلب ثلاثي الأبعاد). `initial` يحدد أين تبدأ القنوات (`{ opacity: 0 }`؛ وتبدأ البقية في حالة السكون). مع `enter`، تبدأ القنوات التي تحرّكها من حيث تبدأ تلك الحركة (خلال `initial`) وتُشغَّل فورًا، وتكون الخيارات الأخرى هي توقيتها (`delay` و`duration` و...). تحرّك الحركة opacity وtransform فقط: توزيع `motion.style` يضبط `opacity` للعرض، لذا اربط `motion.transform` فقط إن أردت الاحتفاظ بـ opacity خاصة بك، وحرّك الألوان بقيمة متحركة و`interpolate`. Rust: `motion()`، وهو مقبض `Copy` يحتفظ به المكوّن الذي أنشأه، ويُربط بـ `.bind_motion(&m)`؛ و`motion().entering(spec)` تشغّل حركة الدخول.

| العضو | Rust (`Motion`) | الوصف |
|---|---|---|
| `opacity`، `translateX`، ... `scaleY` | `value(MotionChannel::Opacity)`، ... | القيم المتحركة للقنوات. |
| `style`، `transform` | `.bind_motion(&m)` على العنصر | عمليات الربط. |
| `play(motion, options?)` | `play(spec)`، `play_ignoring_reduce_motion(spec)` | يشغّل preset بالاسم أو [`MotionSpec`](#motions) على القنوات؛ وتقاطع الحركةُ الجديدة الحركةَ الجارية. `options` تغيّر توقيتها. يُنجَز بالقيمة `{ finished }`: `true` عند اكتمالها، و`false` عندما أوقفها شيء ما (`AnimationEnd` في Rust). |
| `animation(motion, options?)` | `animation(spec)` | الحركة نفسها بصيغة [`CompositeAnimation`](#animated) غير مبدوءة، لتركيبها: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). يُحدَّد وضع الحركة المخفَّضة عند إنشائها. |
| `stop()` | `stop()` | يوقفها حيث هي. |
| `reset()` | `reset()` | يوقفها ويعيد كل قناة إلى حالة السكون. |

عندما يطلب المستخدم حركة أقل (`reduceMotion()`)، تصل `play` و`animation` و`enter` فورًا إلى حيث تنتهي الحركة، دون أن تتحرك، ما لم يُضبط `ignoreReduceMotion` (في الخيارات أو في الحركة).

```rust tabs
let card = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(80.0)));
view().size(px(120.0)).rounded(px(16.0)).bg(rgb(0x0969da)).bind_motion(&card).on_press(move || {
    card.play(MotionPreset::Pulse);
})
```

```tsx tabs
const card = createMotion({ enter: "fadeInUp", delay: 80 });
<View onPress={() => card.play("pulse")} style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }} />
```

### motions

```ts
const motions: Readonly<Record<MotionName, MotionPreset>>;

type MotionChannel = "opacity" | "translateX" | "translateY" | "rotate" | "rotateX" | "rotateY" | "scale" | "scaleX" | "scaleY";

interface MotionSpec extends KeyframeTiming {
  keyframes: { [C in MotionChannel]?: KeyframeValue[] } | MotionFrame[];
  ignoreReduceMotion?: boolean;
}
type MotionFrame = { [C in MotionChannel]?: number | string } & { offset?: number; easing?: Easing };

interface MotionPreset extends MotionSpec {
  kind: "enter" | "exit" | "attention" | "loop";
}
```

الحركات الجاهزة كبيانات: `motion.play("shake")` يشغّل `motions.shake`. `MotionName` هو أحد `fadeIn` أو `fadeInUp` أو `fadeInDown` أو `fadeInLeft` أو `fadeInRight` أو `zoomIn` أو `popIn` أو `bounceIn` أو `slideInUp` أو `slideInDown` أو `flipInX` أو `flipInY` (دخول)؛ `fadeOut` أو `fadeOutUp` أو `fadeOutDown` أو `fadeOutLeft` أو `fadeOutRight` أو `zoomOut` أو `popOut` أو `slideOutDown` أو `slideOutUp` (خروج)؛ `shake` أو `headShake` أو `wiggle` أو `swing` أو `pulse` أو `heartbeat` أو `rubberBand` أو `jello` أو `tada` أو `jump` أو `flash` (لفت الانتباه)؛ `spin` أو `float` أو `breathe` أو `sway` أو `bob` أو `glow` (تكرار). تصف صفحة [Animation](../docs/animation.md#presets) كل واحدة منها. وزّع preset لتعديله: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

`MotionSpec` هي حركة من تصميمك: الإطارات المفتاحية لكل قناة (`{ opacity: [0, 1], translateY: [24, 0] }`)، أو قائمة إطارات كما تكتبها Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`، والإطار بلا offset يُوضع بحسب موضعه في القائمة)، مع [توقيت الإطارات المفتاحية](#keyframes). Rust: `MotionSpec::new(KeyframeTiming)` مع `.values(channel, values)` (موزّعة بالتساوي) و`.track(channel, keyframes)` و`.timing(|t| …)`؛ `MotionPreset::FadeInUp` (أو `.spec()`) هو preset، و`MotionChannel` يسمّي القنوات.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(MotionChannel::TranslateY, [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)]);
card.play(rise);
```

```tsx tabs
card.play({ duration: 400, keyframes: [{ opacity: 0, translateY: 24, easing: "easeOut" }, { opacity: 1, translateY: 0 }] });
```

### Animated

```ts
const Animated: {
  timing(value: AnimatedValue, config: { toValue: number; duration?: number; easing?: Easing; delay?: number }): CompositeAnimation;
  spring(value: AnimatedValue, config: { toValue: number; stiffness?: number; damping?: number; mass?: number; velocity?: number }): CompositeAnimation;
  decay(value: AnimatedValue, config?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): CompositeAnimation;
  sequence(list: CompositeAnimation[]): CompositeAnimation;
  parallel(list: CompositeAnimation[], config?: { stopTogether?: boolean }): CompositeAnimation;
  stagger(ms: number, list: CompositeAnimation[], config?: { from?: "first" | "last" | "center" | number }): CompositeAnimation;
  delay(ms: number): CompositeAnimation;
  loop(animation: CompositeAnimation, config?: { iterations?: number; resetBeforeIteration?: boolean }): CompositeAnimation;
  keyframes(value: AnimatedValue, config: KeyframeTiming & { keyframes: KeyframeValue[] }): CompositeAnimation;
  add(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  subtract(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  multiply(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  divide(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  modulo(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  diffClamp(a: AnimatedNode, min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  sampleSpring(config: SpringConfig & { from?: number }, fps?: number): number[];
  sampleDecay(config: DecayConfig & { from?: number }, fps?: number): number[];
};

interface CompositeAnimation {
  start(callback?: (result: { finished: boolean }) => void): Promise<{ finished: boolean }>;
  stop(): void;
  reset(): void;
}
```

يبني `Animated` الرسوم المتحركة من خطوات (`timing` و`spring` و`decay` و`sequence` و`parallel` و...). لا يعمل شيء حتى `start()`؛ عندها تعمل الشجرة كلها بشكل native، وتبدأ كل خطوة على UI thread في اللحظة نفسها التي تنتهي فيها السابقة (بلا فجوة بين الإطارات، وبلا ذهاب وإياب إلى شيفرة التطبيق بين الخطوات). يبني Rust الشجرة نفسها بـ `Animation`.

| الدالة | Rust | الوصف |
|---|---|---|
| `timing`، `spring`، `decay` | `Animation::timing(&value, to, Timing)`، `Animation::spring(&value, to, Spring)`، `Animation::decay(&value, velocity, deceleration)` | animation واحد لقيمة واحدة؛ بالخيارات والقيم الافتراضية نفسها لدوال [`AnimatedValue`](#animatedvalue)، مع الهدف في `toValue`. |
| `sequence(list)` | `Animation::sequence(list)` | يشغّل الرسوم المتحركة واحدًا تلو الآخر. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | يشغّلها في الوقت نفسه. مع `stopTogether` (الافتراضي `true`)، إيقاف واحد يوقف الجميع. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`، `Animation::stagger_from(ms, StaggerFrom::Center, list)` | يشغّلها بالتوازي، ويبدأ كل واحد بعد `ms` من سابقه، محسوبًا من `from`: `"first"` (الافتراضي) أو `"last"` أو `"center"` (يبدأ الأوسط فورًا وتتوزع البقية انطلاقًا منه؛ وإذا كان العدد زوجيًا يبدأ العنصران الأوسطان فورًا) أو فهرس (`StaggerFrom::First` و`Last` و`Center` و`Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | قيمة عبر [الإطارات المفتاحية](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | ينتظر؛ مفيد داخل `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | يكرّر `animation` `iterations` مرة (إلى ما لا نهاية افتراضيًا)، ويعيد قيمه قبل كل تشغيل ما لم يكن `resetBeforeIteration` هو `false`. |
| `add`، `subtract`، `multiply`، `divide`، `modulo`، `diffClamp` | دوال العقدة | مثل دوال [`AnimatedNode`](#animatednode)، لكن كدوال مستقلة. |
| `sampleSpring`، `sampleDecay` | `nsh_core::element::sample_spring`، `sample_decay` | قيم spring أو decay، قيمة واحدة لكل إطار (انظر [Easing](#easing)). |

`CompositeAnimation`:

| الدالة | Rust (`Animation`) | الوصف |
|---|---|---|
| `start(callback?)` | `start()`، و`AnimationEnd` لانتظاره | يشغّله (من جديد). يُنجَز، ويستدعي `callback`، مرة واحدة للشجرة كلها بالقيمة `{ finished }`: هل اكتملت لا أنها أُوقفت. |
| `stop()` | `stop()` | يوقفه حيث هو. |
| `reset()` | `reset()` | يوقفه ويعيد قيمه إلى ما كانت عليه عند بدئه. |

```rust tabs
let ys: Vec<AnimatedValue> = (0..4).map(|_| animated_value(0.0)).collect();
let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -36.0, Timing::new(220.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);
let run = hop.start();
spawn(async move { log::info!("{}", if run.await { "done" } else { "stopped" }) });
```

```tsx tabs
const ys = [0, 1, 2, 3].map(() => createAnimatedValue(0));
const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -36, duration: 220, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);
hop.start(({ finished }) => console.log(finished ? "done" : "stopped"));
```

### Easing

```ts
type Easing =
  | "linear" | "ease" | "easeIn" | "easeOut" | "easeInOut"
  | [number, number, number, number]   // cubic Bézier x1, y1, x2, y2
  | EasingCurve
  | EasingSteps;                     // Easing.steps(…)

const Easing: {
  linear: Easing;
  ease: Easing;
  bezier(x1: number, y1: number, x2: number, y2: number): Easing;
  steps(count: number, position?: "jump-start" | "jump-end" | "jump-none" | "jump-both" | "start" | "end"): EasingSteps;
  in(e: Easing): Easing;
  out(e: Easing): Easing;
  inOut(e: Easing): Easing;
  sample(easing: Easing, count: number): number[];
  quad: EasingCurve;
  cubic: EasingCurve;
  poly(n?: number): EasingCurve;
  sin: EasingCurve;
  circle: EasingCurve;
  exp: EasingCurve;
  elastic(bounciness?: number): EasingCurve;
  back(s?: number): EasingCurve;
  bounce: EasingCurve;
};
```

الـ easing بيانات، وليس دالة من التطبيق: يقيّمه runtime بشكل native. في Rust هو enum `Easing`: `Linear` و`EaseIn` و`EaseOut` و`EaseInOut` و`Bezier(x1, y1, x2, y2)` و`Steps(count, StepPosition)` و`Curve(curve, mode)`، مع `Curve` (`Quad` و`Cubic` و`Poly(n)` و`Sin` و`Circle` و`Exp` و`Elastic(bounciness)` و`Back(s)` و`Bounce`) و`EaseMode` (`In` و`Out` و`InOut`). لرسم أحدها، يعطي `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) قيمه عند `count` من النقاط المتباعدة بالتساوي من 0 إلى 1؛ ويعطي `Animated.sampleSpring` و`Animated.sampleDecay` (`sample_spring` و`sample_decay`) قيم spring أو decay، قيمة لكل إطار (عند `fps`، وهو 60 افتراضيًا) من `from` (0) حتى ينتهي. وتأتي الثلاثة من الشيفرة native التي تعمل بها الرسوم المتحركة. وفي أي مكان يُقبل فيه `Easing` في TSX يمكنك تمرير اسم (`"easeOut"`)، أو منحنى Bézier تكعيبي بأربعة أرقام، أو منحنى من الكائن `Easing`.

| المنحنى | Rust | الشكل |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (القيمة الافتراضية لـ `n` هي 2) |
| `sin` | `Curve::Sin` | جيبي |
| `circle` | `Curve::Circle` | دائري |
| `exp` | `Curve::Exp` | أُسّي |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | تجاوز نابضي (القيمة الافتراضية لـ `bounciness` هي 1) |
| `back(s)` | `Curve::Back(s)` | يتراجع قبل الانطلاق؛ `s` هو مقدار التجاوز (الافتراضي 1.70158) |
| `bounce` | `Curve::Bounce` | يرتدّ عند النهاية |

`Easing.steps(count, position)` هو `steps()` في CSS: تقفز القيمة بين `count` من المستويات بدل أن تتحرك (sprite إطارًا بإطار، عقرب يدقّ). `position` يحدد مواضع القفزات: `"jump-end"` (الافتراضي، وكذلك `"end"`)، أو `"jump-start"` (`"start"`)، أو `"jump-none"` أو `"jump-both"`؛ Rust: `Easing::Steps(count, StepPosition::JumpEnd)` و`JumpStart` و`JumpNone` و`JumpBoth`.

المنحنيات بصيغة "in" (بطيئة في البداية). `Easing.out(curve)` يعكس المنحنى، و`Easing.inOut(curve)` يجعله متماثلًا، و`Easing.in(curve)` يبقيه كما هو؛ وفي Rust يكون ذلك هو `EaseMode` في `Easing::Curve`.

```rust tabs
let _ = value.timing(1.0, 600.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
let _ = value.timing_with(1.0, Timing { easing: Easing::Bezier(0.2, 0.0, 0.0, 1.0), ..Timing::default() });
let _ = value.timing_with(1.0, Timing { easing: Easing::EaseOut, ..Timing::default() });
```

```tsx tabs
value.timing(1, { duration: 600, easing: Easing.out(Easing.back()) });
value.timing(1, { easing: Easing.bezier(0.2, 0, 0, 1) });
value.timing(1, { easing: "easeOut" });
```

### LayoutAnimation

```ts
const LayoutAnimation: {
  configureNext(config: LayoutAnimationConfig, onEnd?: () => void): void;
  create(duration: number, type?: LayoutAnimationType, property?: LayoutAnimationProperty): LayoutAnimationConfig;
  Types: { easeInEaseOut; spring; linear; easeIn; easeOut; keyboard };
  Properties: { opacity; scaleXY };
  Presets: { easeInEaseOut: LayoutAnimationConfig; linear: LayoutAnimationConfig; spring: LayoutAnimationConfig };
  easeInEaseOut(onEnd?: () => void): void;
  linear(onEnd?: () => void): void;
  spring(onEnd?: () => void): void;
};

interface LayoutAnimationConfig {
  duration: number;                // ms
  create?: LayoutAnimationAnimation;    // views inserted
  update?: LayoutAnimationAnimation;    // views moved or resized
  delete?: LayoutAnimationAnimation;    // views removed
}

interface LayoutAnimationAnimation {
  type?: "easeInEaseOut" | "spring" | "linear" | "easeIn" | "easeOut" | "keyboard";
  property?: "opacity" | "scaleXY" | "scale";
  duration?: number;
  delay?: number;
  springDamping?: number;          // 0..1, default 0.7
}
```

يحرّك `LayoutAnimation.configureNext(config)` تغييرات التخطيط في الـ commit التالي بشكل native: العروض التي تتحرك أو يتغير حجمها تنزلق إلى إطاراتها الجديدة، والعروض الجديدة تظهر (بتلاشٍ أو بتكبير، بحسب `property`)، والعروض المحذوفة تختفي. استدعه قبل تغيير الحالة الذي يغيّر التخطيط مباشرة. Rust: `animate_layout(LayoutAnimation)`، مع presets الخاصة بـ `nsh_core::element::LayoutAnimation` أو انتقالاتها `create` و`update` و`delete`.

| العضو | Rust | الوصف |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | يحرّك تغييرات الـ commit التالي؛ ويعمل `onEnd` عند الانتهاء. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | إعداد يستخدم المنحنى نفسه للمراحل الثلاث. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms، والعروض تتلاشى دخولًا وخروجًا. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms بسرعة ثابتة. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms؛ الإطارات تنتفض كالنابض (damping 0.4)، والعروض تتلاشى خطيًا. |
| `easeInEaseOut(onEnd?)` و`linear(onEnd?)` و`spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | اختصارات لـ `configureNext(Presets.…)`. |
| `Types` و`Properties` | `LayoutCurve` و`LayoutProperty` | الأسماء، كثوابت. |

```rust tabs
let open = signal(false);
let toggle = move || {
    animate_layout(LayoutAnimation::SPRING);
    open.update(|o| *o = !*o);
};

view()
    .child(text("Details").on_press(toggle))
    .child(when(move || open.get(), || text("Shown with a spring.")))
```

```tsx tabs
const open = signal(false);
const toggle = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  open.update((o) => !o);
};

<View>
  <Text onPress={toggle}>Details</Text>
  <If when={open()}>
    <Text>Shown with a spring.</Text>
  </If>
</View>
```

## Device

تعرّف device API التطبيقَ بالجهاز وبيئته. تستدعي شيفرة Rust دوال `nsh_core::prelude` (`window()` و`dark()` و`font_scale()` و`locale()` و`lifecycle()` و`os()` و`idiom()` و`pixel_ratio()` و`set_color_scheme()` و...)؛ وتستوردها TSX من `nsh`. حجم النافذة ونظام الألوان ومقياس الخط ونسبة البكسل واللغة المحلية (locale) وحالة التطبيق كلها تفاعلية: اقرأها في binding (إغلاق closure يُمرَّر إلى عنصر في Rust، وJSX في TSX) أو `computed` أو `effect`، فيتحدّث كل ما يقرؤها عندما تبلّغ المنصة عن تغيير (تدوير الشاشة، تغيير حجم النافذة، التبديل إلى الوضع الداكن، تغيير حجم النص أو اللغة، الانتقال إلى شاشة بكثافة أخرى، مغادرة التطبيق والعودة إليه).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

راجع [الجهاز والبيئة](../docs/device-and-environment.md) للاطلاع على الدليل.

### windowSize

```ts
const windowSize: Accessor<Size>;
```

حجم السطح بالنقاط (points): النافذة، أو `NshAppView` / `NshView` المضمَّن. تفاعلي. Rust: `window() -> Size<Points>`.

```rust tabs
let wide = move || window().width >= px(600.0);

view().style_when(wide, |s| s.flex_row())
```

```tsx tabs
const wide = () => windowSize().width >= 600;

<View style={{ flexDirection: wide() ? "row" : "column" }}>{/* ... */}</View>
```

### colorScheme

```ts
const colorScheme: Accessor<"light" | "dark">;
```

المظهر المعروض: مظهر النظام، ما لم يضبط التطبيق مظهره الخاص (`nsh.json` `"appearance"`، [`setColorScheme`](#setcolorscheme)). تفاعلي. Rust: `dark() -> bool`؛ وألوان السمة (`AdaptiveColor`) ونسخة style ‏`.dark(…)` تتبعه دون قراءته. كما يتبعه متغيّر `dark:` في Tailwind (انظر [Tailwind](../docs/tailwind.md)).

```rust tabs
view().flex_1().bg(move || if dark() { black() } else { white() })
```

```tsx tabs
const dark = () => colorScheme() === "dark";

<View style={{ flex: 1, backgroundColor: dark() ? "#000" : "#fff" }} />
```

### fontScale

```ts
const fontScale: Accessor<number>;
```

حجم النص المفضّل لدى المستخدم نسبةً إلى الافتراضي (`1` هو الحجم الافتراضي؛ Dynamic Type في iOS، وحجم الخط في Android)، أو حجم النص الذي يضبطه التطبيق المضيف بدلًا منه. تفاعلي. Rust: `font_scale() -> f32`. النص يتدرّج معه أصلًا ما لم `allowFontScaling={false}`؛ اقرأه عندما ينبغي أن تتبعه أحجام أخرى، مثل الأيقونات بجوار النص.

### locale

```ts
const locale: Accessor<string>;
```

لغة المستخدم المحلية بصيغة وسم BCP 47 (`"en-US"`، `"zh-Hans-CN"`)، أو اللغة التي يضبطها التطبيق المضيف بدلًا منها. تفاعلي. Rust: `locale() -> Locale` (`locale().as_str()` هو الوسم). ينسّق `Intl` وفقها افتراضيًا؛ اقرأها لاختيار نصوص ترجماتك الخاصة ([الجهاز والبيئة](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

هل التطبيق قيد الاستخدام، بمصطلحات `AppState` في React Native: `"active"` في المقدمة ويستقبل الإدخال، `"inactive"` وهو ظاهر دون التركيز (يملكه تطبيق أو نافذة أخرى، أو يعرض النظام شيئًا فوقه، كمبدّل التطبيقات أو مكالمة واردة)، `"background"` وهو غير ظاهر (في الخلفية، أو مصغّر، أو تبويب متصفح مخفي). والتطبيق المعروض داخل تطبيق native يتبع حالة ذلك التطبيق. تفاعلي. Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active` و`Inactive` و`Background`).

اقرأه في effect لإيقاف العمل الذي لا يراه أحد واستئنافه عند عودة التطبيق:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

### setColorScheme

```ts
function setColorScheme(scheme: "light" | "dark" | "system"): void;
```

يعرض التطبيق بـ `scheme` مهما كان مظهر النظام، فورًا: `colorScheme()` وفئات `dark:` وسمة المكوّنات وعناصر التحكم في المنصة (التنبيهات، والنمط الافتراضي لشريط الحالة) تتبعه؛ و`"system"` يعيده إلى اتباع النظام. `nsh.json` `"appearance"` يضبطه منذ البداية. Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light` و`Appearance::System`).
### platform

```ts
const platform: Platform;

interface Platform {
  readonly os: "ios" | "android" | "macos" | "windows" | "linux" | "web";
  readonly version: string;
  readonly idiom: "phone" | "pad" | "mac" | "tv" | "desktop";
  readonly desktop: boolean;
  readonly catalyst: boolean;
  select<T>(spec: PlatformSelectSpec<T>): T | undefined;
}
```

المنصة التي يعمل عليها التطبيق، وهي ثابتة طوال مدة التشغيل.

| العضو | Rust | الوصف |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` هو نص TS) | نظام التشغيل. تُبلغ iOS ومحاكي iOS وMac Catalyst عن `"ios"`، والمتصفحات عن `"web"`. |
| `version` | `os_version() -> (u16, u16)` | في iOS وأنظمة سطح المكتب: إصدار نظام التشغيل (`"17.5"`)؛ في Android: مستوى API (`"35"`)؛ في الويب: `"0.0"`. يعطي Rust الإصدار الرئيسي والفرعي، أو مستوى API و0 على Android. |
| `idiom` | `idiom() -> Idiom` | نوع الجهاز: `"desktop"` تحديدًا حيث يكون `desktop` هو `true`؛ وفي غير ذلك `"phone"`، أو `"pad"` (iPad، أو جهاز Android لوحي، أو Mac Catalyst بنمط iPad)، أو `"mac"` (Mac Catalyst بنمط Mac في UIKit، وهو نمط جوال)، أو `"tv"` (Apple TV وAndroid TV). |
| `desktop` | `is_desktop() -> bool` | ينطبق سلوك سطح المكتب: macOS وWindows وLinux والمتصفحات ذات الفأرة والنافذة العريضة. وتتبعه كلها خصائص `desktop={{…}}` و`select({ desktop })` و`idiom` `"desktop"`. يشغّل Mac Catalyst الواجهة الخلفية لـ iOS، لذا فهو جوال: تنطبق عليه خصائص `ios={{…}}`. أما `isAvailable` في [`nsh/desktop`](./nsh-desktop.md#isavailable) فهو الفحص الأضيق لواجهات النوافذ والقوائم فيه، وهي متوفرة في macOS وWindows وLinux. |
| `catalyst` | `is_catalyst() -> bool` | يعمل التطبيق ضمن Mac Catalyst، بنمط Mac أو iPad (`os` هو `"ios"`). |
| `select(spec)` | `match os() { … }` | القيمة الخاصة بهذه المنصة (انظر أدناه). |

```rust tabs
let columns = if is_desktop() { 3 } else { 1 };
```

```tsx tabs
const columns = platform.desktop ? 3 : 1;
```

#### platform.select

```ts
interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  macos?: T;
  windows?: T;
  linux?: T;
  web?: T;
  mobile?: T;   // platform.desktop false: iOS (Mac Catalyst included), Android, phone and tablet browsers
  desktop?: T;  // platform.desktop true: macOS, Windows, Linux, desktop browsers
  native?: T;   // every platform but the web
  default?: T;
}
```

تعيد القيمة الخاصة بنظام التشغيل الحالي (`ios`، `android`، `web`، ...)، وإلا `desktop` أو `mobile` (بحسب `platform.desktop`)، وإلا `native` (كل المنصات عدا الويب)، وإلا `default`، وإلا `undefined`. يعتمد كود Rust على المطابقة مع `os()` (ومع `is_desktop()` لـ `mobile` / `desktop`).

```rust tabs
use nsh_core::platform::Os;

let card = view().p_4();
let card = match os() {
    Os::Ios => card.shadow([BoxShadow {
        offset_y: px(2.0),
        blur: px(8.0),
        color: rgba(0x00000026).into(),
        ..BoxShadow::default()
    }]),
    Os::Android => card.elevation(px(4.0)),
    _ => card,
};
```

```tsx tabs
const shadow = platform.select({
  ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.15)" },
  android: { elevation: 4 },
});
```

> [!TIP]
> بالنسبة إلى الخصائص التي تتوفر لمنصة واحدة فقط، فضّل خصائص `ios={{…}}` / `android={{…}}` في عناصر ومكونات TSX على التفرع بحسب `platform` (انظر [الكود الخاص بكل منصة](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

عدد بكسلات الجهاز لكل نقطة (مثل `3` في معظم أجهزة iPhone). وهي تفاعلية: تتغير عندما تنتقل النافذة إلى شاشة ذات كثافة مختلفة (على Mac Catalyst وأنظمة سطح المكتب أو شاشة خارجية)، وعندما يغيّر إعداد حجم العرض في Android الكثافة. في Rust: `pixel_ratio() -> f32`، و`round_to_nearest_pixel(points)` لطول يُقاس بوحدات بكسلات الجهاز الكاملة؛ وفي TSX يكون هذا الطول `Math.round(x * pixelRatio()) / pixelRatio()`.

```rust tabs
let hairline = move || px(1.0 / pixel_ratio());
```

```tsx tabs
const hairline = () => 1 / pixelRatio();
```

### openUrl

```ts
function openUrl(url: string): Promise<OpenUrlResult>;

interface OpenUrlResult {
  opened: boolean;
}
```

تفتح `url` خارج التطبيق: صفحة ويب في المتصفح، ورابط `mailto:` في تطبيق البريد، ورابط `tel:` في تطبيق الهاتف، وأي مخطط سجّله تطبيق آخر (`maps:`، وروابط `lb://` الخاصة بالتطبيق المضيف). وتُحلّ بالقيمة `{ opened }`، أي هل فتحها شيء ما: `false` عندما لا يعالج أي تطبيق المخطط. في Rust: `open_url(url)` من `nsh_core::prelude`، وهي نتيجة يُنتظر اكتمالها داخل مهمة (أو تُهمل)، وهي نفس `bool`.

```rust tabs
button()
    .child(text("Contact us"))
    .on_press(|| {
        spawn(async {
            if !open_url("mailto:help@example.com").await {
                log::warn!("no mail app");
            }
        });
    })
```

```tsx tabs
<Button
  onPress={async () => {
    const { opened } = await openUrl("mailto:help@example.com");
    if (!opened) {
      console.warn("no mail app");
    }
  }}
>
  <Text>Contact us</Text>
</Button>
```

- يجب أن يكون الرابط مطلقًا (له مخطط). الروابط التي قد تنفّذ كودًا أو تصل إلى بيانات التطبيق نفسه، `javascript:` و`data:` و`blob:` و`file:` و`about:` و`asset:`، ترفض الوعد بـ `TypeError`، وكذلك العناوين النسبية. لا ترمي `openUrl` استثناءً أبدًا: كل فشل يرفض الوعد.
- يحتاج التطبيق الذي يعلن القدرات إلى `openUrl`: `"openUrl": true` لكل المخططات، أو `"openUrl": { "schemes": ["https", "mailto"] }` للمخططات المدرجة؛ وترفض الروابط الأخرى بـ `Error` تكون `code` فيه `"ERR_ACCESS_DENIED"`، و`permission` `"openUrl"` و`resource` الرابط (انظر [الصندوق الرملي والقدرات](../docs/sandbox-and-capabilities.md)). في Rust، تُجيب `open_url` بـ `false` في هذه الحالات وتسجّل السبب.
- يرى التطبيق المضيف الرابط أولًا ويمكنه توجيهه عبر موجّهه الخاص بدلًا من ذلك (Swift `NshAppView.onOpenURL`، Java `NshView.setOpenUrlHandler`، Rust `AppView::host().handle_open_url`؛ انظر [iOS](../docs/ios.md#links-the-app-opens) و[Android](../docs/android.md#links-the-app-opens)). وتكون `opened` عندئذ `true`.
- تفتحه كل منصة بفاتحها الخاص: `UIApplication.open` في iOS (تطبيق المضيف عند التضمين)، وintent من نوع `ACTION_VIEW` في Android، و`NSWorkspace` في macOS، و`ShellExecuteW` في Windows، و`GtkUriLauncher` في Linux، و`open_url` من GPUI، وعلامة تبويب جديدة في الويب. أما `nsh test` فتسجّل الروابط بدلًا من فتحها.
- يفتح [`TextView`](../elements/text-view.md) روابطه بهذه الطريقة باستخدام `links="open"`.

<a id="layout-direction"></a>

### اتجاه التخطيط

يتبع اتجاه التخطيط لغة المستخدم: في اللغات التي تُكتب من اليمين إلى اليسار (العربية والعبرية وغيرهما) يُخطَّط التطبيق من اليمين إلى اليسار، وتبدأ الصفوف من اليمين، وتعني خصائص الأنماط `left` / `right` (`marginLeft`، `paddingRight`، ...) البداية والنهاية. تُطبَّق التغييرات فورًا دون إعادة تشغيل.

يحدد نمط `direction` في العرض (`"ltr"` أو `"rtl"` أو `"inherit"`، وهو الافتراضي) اتجاه شجرته الفرعية؛ وفي Rust: `.direction(LayoutDirection::..)`.

```rust tabs
view().direction(LayoutDirection::Rtl).flex_row().gap_2().child(text("First")).child(text("Second"))
```

```tsx tabs
<View style={{ direction: "rtl", flexDirection: "row", gap: 8 }}>
  <Text>First</Text>
  <Text>Second</Text>
</View>
```

<a id="related"></a>

### ذات صلة

- هوامش المنطقة الآمنة (Rust `safe_area()`؛ TSX `safeArea()`، `safeAreaInsets()`) ولوحة المفاتيح البرمجية (Rust `keyboard_height()`؛ TSX `keyboardFrame()`) موصوفة في [المنطقة الآمنة ولوحة المفاتيح](#safe-area-and-keyboard).
- إعدادات قارئ الشاشة وتقليل الحركة موصوفة في [إمكانية الوصول](#accessibility).

## PanResponder

مستجيبات السحب (Pan responders) هي إيماءات سحب مبنية فوق نظام مستجيب الإيماءات: يستحوذ العنصر على لمسات الإيماءة، ثم يسمعها وحده مع حالة الإيماءة، التي تتتبع مركز اللمسات والمسافة المقطوعة والسرعة نيابةً عنك. يستحوذ كود Rust عليها بـ `.claim_touches(TouchClaim::…)` ويسمعها بمستمعي `.on_responder_*` الذين يحمل `ResponderEvent` فيهم `PanGesture`، وكل ذلك في `nsh_core::prelude`؛ أما TSX فيستورد `PanResponder` من `nsh`، وتتلقى دوال `onPanResponder…` فيه حدث اللمس وحالة الإيماءة.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> يسلّم مستجيب السحب كل حركة إلى كود التطبيق، لذا فهو يناسب الإيماءات التي تغيّر حالة التطبيق (إعادة الترتيب، وقرارات السحب للحذف). أما لتحريك عرض بالإصبع فقيم الإيماءات الأصلية أسرع: `.pan_values(x, y)` و`.pinch_value(scale)` و`.rotation_value(angle)` في Rust، وخصائص `pan={{ x, y }}` و`pinch` و`rotation` في TSX. يكتب السحب في [القيم المتحركة](#animation) على خيط واجهة المستخدم، ولا يسمع التطبيق إلا عند البدء والانتهاء (`on_pan_start` / `on_pan_end`، `onPanStart` / `onPanEnd`). انظر [اللمس والإيماءات](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

تنشئ مستجيب سحب. وزّع `panHandlers` الخاصة به على العرض الذي يجب أن يستقبل الإيماءة. في Rust، يستحوذ العرض على اللمسات ويستمع بنفسه:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view().flex_1().child(
        view()
            .size(px(64.0))
            .rounded(px(32.0))
            .bg(rgb(0x6366f1))
            .style_with(move |s| {
                let (x, y) = pos.get();
                s.translate_x(px(x)).translate_y(px(y))
            })
            .claim_touches(TouchClaim::on_start())
            .on_responder_grant(move |_: &ResponderEvent| {
                start.replace(pos.get_untracked());
            })
            .on_responder_move(move |e: &ResponderEvent| {
                let (x, y) = start.get();
                pos.set((x + e.gesture.delta.x.0, y + e.gesture.delta.y.0));
            })
            .on_responder_release(move |e: &ResponderEvent| {
                log::info!("released at {:.0} pt/s", e.gesture.vx);
            }),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function App() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => (start = pos()),
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log(`released at ${g.vx.toFixed(0)} pt/s`),
  });
  return (
    <View style={{ flex: 1 }}>
      <View
        {...pan.panHandlers}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#6366f1",
          transform: [{ translateX: pos().x }, { translateY: pos().y }],
        }}
      />
    </View>
  );
}

mount(App);
```

<a id="callbacks"></a>

### دوال الاستدعاء

تتلقى كل دالة استدعاء حدث اللمس (`GestureResponderEvent`، من [`nsh`](#types)) وحالة الإيماءة. في Rust، يقرر الاستحواذ عبر `.ask(|request: &ClaimRequest| …)`، مستدعيًا `request.claim()` لأخذ اللمسات (وبدون `ask` يأخذها دائمًا)، ويتلقى كل مستمع `ResponderEvent` تكون `gesture` فيه هي الحالة.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| دالة الاستدعاء | Rust | تعيد | تُستدعى عندما |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | يلمس إصبع الشاشة: أعد `true` لتصبح المستجيب. يُسأل بدءًا من العرض الملموس نحو الخارج. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | الأمر نفسه، لكن يُسأل من الخارج إلى الداخل قبل مرحلة الفقاعة (أب يأخذ الإيماءة من أبنائه). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | يتحرك إصبع: أعد `true` لتصبح المستجيب (مثلًا فقط بعد `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | الأمر نفسه، في مرحلة الالتقاط. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | هذا العرض هو المستجيب الآن: تبدأ الإيماءة. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | عرض آخر هو المستجيب ولم يتخلَّ عنها. |
| `onPanResponderStart` | `.on_responder_start(…)` | | لمس إصبع الشاشة أثناء الاستجابة. |
| `onPanResponderMove` | `.on_responder_move(…)` | | تحركت الأصابع. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | رُفع إصبع أثناء الاستجابة. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | رُفع آخر إصبع: انتهت الإيماءة. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | أخذ عرض آخر (أو إيماءة أصلية، مثل عرض التمرير) اللمسات. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` يحتفظ بها | `boolean` | يريد عرض آخر اللمسات: أعد `false` للاحتفاظ بها (الافتراضي `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | هل يُمنع عرض التمرير الأصلي من أخذ اللمسات أثناء الاستجابة (الافتراضي `true`). |

### PanResponderGestureState

```ts
interface PanResponderGestureState {
  stateID: number;
  moveX: number;               // latest centroid of the touches (surface points)
  moveY: number;
  x0: number;                  // the centroid when the responder was granted
  y0: number;
  dx: number;                  // distance moved since the grant
  dy: number;
  vx: number;                  // velocity, points per second
  vy: number;
  numberActiveTouches: number;
}
```

في Rust: `PanGesture`، مع النقاط على شكل `Point<Points>`.

| الحقل | Rust | الوصف |
|---|---|---|
| `stateID` |  | يحدد الإيماءة. |
| `moveX`، `moveY` | `position` | آخر موضع لمركز اللمسات، بنقاط السطح. |
| `x0`، `y0` | `origin` | موضع المركز عند منح الاستجابة. |
| `dx`، `dy` | `delta` | المسافة المقطوعة منذ المنح. |
| `vx`، `vy` | `vx`، `vy` | السرعة بالنقاط في الثانية. |
| `numberActiveTouches` | `active_touches` | عدد الأصابع الملامسة. |

<a id="inside-scroll-views"></a>

### داخل عروض التمرير

بينما يكون مستجيب السحب هو المستجيب، لا تتمرر عروض التمرير الأصلية المحيطة به (`onShouldBlockNativeResponder` افتراضيًا `true`). ولكي تتعايش إيماءة سحب أفقية مع التمرير العمودي، لا تصبح المستجيب إلا عند الحركات الأفقية:

```rust tabs
view()
    .claim_touches(TouchClaim::on_move().ask(|request: &ClaimRequest| {
        let d = request.event.gesture.delta;
        if d.x.0.abs() > 10.0 && d.x.0.abs() > d.y.0.abs() {
            request.claim();
        }
    }))
    .on_responder_move(move |e: &ResponderEvent| offset.set(e.gesture.delta.x.0))
    .on_responder_release(move |e: &ResponderEvent| {
        if e.gesture.delta.x.0.abs() > 120.0 { remove() } else { offset.set(0.0) }
    })
    .on_responder_terminate(move |_: &ResponderEvent| offset.set(0.0))
```

```tsx tabs
const swipe = PanResponder.create({
  onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
  onPanResponderMove: (_, g) => offset.set(g.dx),
  onPanResponderRelease: (_, g) => (Math.abs(g.dx) > 120 ? remove() : offset.set(0)),
  onPanResponderTerminate: () => offset.set(0),
});
```

بالنسبة إلى السحب الذي تتعرف عليه المنصة، يقرر `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` على الخيط الرئيسي أثناء حركة الأصابع. ويمكن أيضًا استخدام خصائص المستجيب الأساسية (`onStartShouldSetResponder`، `onResponderGrant`، `onTouchStart`، ...) مباشرة على أي عنصر؛ انظر [العناصر](../elements/index.md).

## Clipboard

تقرأ واجهة الحافظة (Clipboard) حافظة النظام وتكتب فيها: النص في كل مكان (`UIPasteboard` في iOS، `ClipboardManager` في Android، `NSPasteboard` وGDK وحافظة Win32 في أنظمة سطح المكتب، `navigator.clipboard` في الويب)، والصور في iOS وأنظمة سطح المكتب والويب، والملفات المنسوخة في مدير الملفات في أنظمة سطح المكتب وMac Catalyst. يستدعي كود Rust دوال `nsh_core::prelude` (`set_clipboard`، `clipboard_string`، ...)؛ أما TSX فيستورد `Clipboard` من `nsh`.

```rust tabs
use nsh_core::prelude::*; // set_clipboard, clipboard_string, clipboard_image, ...
use nsh_core::element::ClipboardImage;
```

```tsx tabs
import { Clipboard } from "nsh";
```

```ts
const Clipboard: {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  hasText(): Promise<boolean>;
  writeImage(src: string): Promise<void>;
  readImage(): Promise<ClipboardImage | null>;
  hasImage(): Promise<boolean>;
  readFiles(): Promise<string[]>;
};

interface ClipboardImage {
  url: string; // a URL that Image shows and fetch reads
  size: PixelSize; // in pixels
}
```

| TS | Rust (`nsh_core::prelude`) |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

تعيد عمليات القراءة في Rust نتائج يُنتظر اكتمالها داخل مهمة (`spawn`، أو دالة في وحدة `async`)؛ و`ClipboardImage` هي `nsh_core::element::ClipboardImage`، مع `url` و`size` (وهي `Size<DevicePixels>`).

تمر الصور عبر الحافظة في iOS وأنظمة سطح المكتب والويب. أما في Android فتحمل الحافظة النص فقط: تُرفض `writeImage` و
`readImage` بـ `Error` تكون `code` فيه `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`، وتُحلّ `hasImage` بالقيمة
`false`. في Rust، تترك `set_clipboard_image` الحافظة كما هي هناك، وتُجيب `clipboard_image` بـ `None`.

يستطيع المستخدم أيضًا النسخ بنفسه من [نص قابل للتحديد](../elements/text.md)؛ وواجهة الحافظة مخصصة للنسخ من الكود، مثل زر "نسخ".

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

تضع `text` في الحافظة، مستبدلة ما كان فيها. في Rust: `set_clipboard(text)`.

```rust tabs
use nsh_core::prelude::*;

fn copy_button(code: Signal<String>) -> impl IntoElement {
    let copied = signal(false);
    view()
        .role(AccessibilityRole::Button)
        .on_press(move || {
            set_clipboard(code.get());
            copied.set(true);
        })
        .child(text(move || if copied.get() { "Copied" } else { "Copy" }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Clipboard } from "nsh";

const copied = signal(false);

<View
  onPress={async () => {
    await Clipboard.writeText(code());
    copied.set(true);
  }}
>
  <Text>{copied() ? "Copied" : "Copy"}</Text>
</View>;
```

### Clipboard.readText

```ts
readText(): Promise<string>;
```

تُحلّ بنص الحافظة، أو بـ `""` عندما لا تحتوي على نص. في Rust: `clipboard_string()`. في iOS، قد تُظهر قراءة الحافظة إشعار اللصق من النظام ("App pasted from …")، وفي Android 10 وما بعده لا يستطيع القراءة إلا التطبيق الموجود في المقدمة. اقرأها عندما يطلب المستخدم اللصق، وليس في كل شاشة.

```rust tabs
spawn(async move {
    let pasted = clipboard_string().await;
    if !pasted.is_empty() {
        code.set(pasted.trim().to_string());
    }
});
```

```tsx tabs
const pasted = await Clipboard.readText();
if (pasted) code.set(pasted.trim());
```

### Clipboard.hasText

```ts
hasText(): Promise<boolean>;
```

تُحلّ بما إذا كانت الحافظة تحتوي على نص، دون قراءته: لا إشعار لصق في iOS. في Rust: `clipboard_has_string()`. استخدمها لتقرر هل تُظهر زر "لصق". في الويب، لا تعرف المتصفحات إلا بالقراءة، لذا قد يُطلب من المستخدم إذن.

```rust tabs
let can_paste = signal(false);
spawn(async move { can_paste.set(clipboard_has_string().await) });
```

```tsx tabs
const canPaste = signal(false);
Clipboard.hasText().then((has) => canPaste.set(has));
```

### Clipboard.readImage

```ts
readImage(): Promise<ClipboardImage | null>;
```

تُحلّ بصورة الحافظة، أو بـ `null` عندما لا تحتوي على صورة: لقطة شاشة ملصقة، أو صورة نُسخت في متصفح
أو محرر صور. في Rust: `clipboard_image()`، و`None` عندما لا تحتوي على صورة. `url` هو رابط الصورة (PNG، أو
JPEG أو GIF أو WebP أو BMP الخاصة بالحافظة) الذي يعرضه [`Image`](../elements/image.md) بوصفه `src` وتقرؤه `fetch`:
`fetch(url)` تعطي بايتاتها، لرفعها. و`size` (`width` و`height`) هو حجمها بالبكسل، كما فُكّ ترميزها. وكما في
`readText`، اقرأها عندما يطلب المستخدم اللصق. تُقرأ الصور حتى 48 ميغابايت (مرمّزة) كي تتسع الصورة في
ذاكرة التطبيق؛ وترفض الصورة الأكبر بـ `Error` تكون `code` فيه `"ERR_NSH_QUOTA_EXCEEDED"` (وتذكر رسالته
حجم الصورة والحد الأقصى)، بينما تُحلّ `hasImage` بـ `true`. في Rust: تُجيب `clipboard_image()` بـ `None` في هذه الحالة.

```rust tabs
use base64::Engine as _;
use nsh_core::{element::ClipboardImage, prelude::*};

fn attachments() -> impl IntoElement {
    let attachments = signal(Vec::<ClipboardImage>::new());
    let paste = move || {
        spawn(async move {
            if let Some(image) = clipboard_image().await {
                attachments.update(|list| list.push(image));
            }
        });
    };
    view()
        .flex_row()
        .gap_2()
        .child(text("Paste").on_press(paste))
        .child(each(
            attachments,
            |shot: &ClipboardImage| shot.url.clone(),
            |shot, _| image(move || shot.with(|s| s.url.clone())).size(px(64.0)).rounded(px(8.0)),
        ))
}

async fn upload(image: &ClipboardImage) -> Result<HttpResponse, String> {
    let (_, data) = image.url.split_once(',').ok_or("not a data: URL")?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let request = HttpRequest::post("https://example.com/upload", bytes).header("Content-Type", "image/png");
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, View } from "nsh";
import { Clipboard, type ClipboardImage } from "nsh";

const attachments = signal<ClipboardImage[]>([]);

async function paste() {
  const image = await Clipboard.readImage();
  if (image) attachments.set([...attachments(), image]);
}

async function upload(image: ClipboardImage) {
  const body = new FormData();
  body.append("file", await (await fetch(image.url)).blob(), "screenshot.png");
  await fetch("https://example.com/upload", { method: "POST", body });
}

<View class="flex-row gap-2">
  <Each of={attachments()}>
    {(image) => <Image src={image().url} style={{ width: 64, height: 64, borderRadius: 8 }} />}
  </Each>
</View>;
```

يربط تطبيق على نمط الدردشة، يلصق فيه المستخدمون لقطات الشاشة في مربع الكتابة، اختصار اللصق ما دام حقل الإدخال في التركيز،
ويأخذ الصورة إن وجدت:

```rust tabs
use nsh_core::keymap::When;

on_key_with("mod+v", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| {
    spawn(async move {
        if clipboard_has_image().await {
            paste().await;
        } else {
            insert_text(&clipboard_string().await);
        }
    });
});
```

```tsx tabs
import { keymap } from "nsh";

keymap.bind("mod+v", async () => {
  if (await Clipboard.hasImage()) return paste();
  insertText(await Clipboard.readText());
}, { when: "always" });
```

### Clipboard.hasImage

```ts
hasImage(): Promise<boolean>;
```

تُحلّ بما إذا كانت الحافظة تحتوي على صورة، دون قراءتها: لا إشعار لصق في iOS. في Rust:
`clipboard_has_image()`. في Android تُحلّ بالقيمة `false`.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

تضع صورة `src`، وهو رابط `data:` بترميز base64 أو `url` الذي أعطته `readImage`، في الحافظة، مستبدلة ما فيها.
في Rust: `set_clipboard_image(src)`. في Windows تقبل PNG، وهو التنسيق الذي تقرؤه المتصفحات وOffice وأداة القص. في
Android تُرفض بـ `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.

```rust tabs
set_clipboard_image(image.url.clone());
```

```tsx tabs
await Clipboard.writeImage(image.url);
```

### Clipboard.readFiles

```ts
readFiles(): Promise<string[]>;
```

تُحلّ بروابط `file:` للملفات والمجلدات المنسوخة في مدير الملفات (Finder وExplorer وFiles)، بترتيبها،
أو بـ `[]`: وهي نفس الروابط التي يعطيها [إسقاط الملفات](../elements/view.md#desktop-file-drops). في Rust: `clipboard_files()`.
حلّل الرابط للحصول على مساره.

```rust tabs
let paths: Vec<std::path::PathBuf> = clipboard_files()
    .await
    .iter()
    .filter_map(|file| url::Url::parse(file).ok()?.to_file_path().ok())
    .collect();
```

```tsx tabs
const files = await Clipboard.readFiles();
const names = files.map((url) => decodeURIComponent(new URL(url).pathname.split("/").pop()!));
```

> [!NOTE]
> عندما يعلن تطبيقك `capabilities` في `nsh.json`، يجب منح الحافظة بـ `"clipboard": true`. وبدونها ترفض كل دالة في `Clipboard` بـ `Error` تكون `code` فيه `"ERR_ACCESS_DENIED"`، و`permission` `"clipboard"` و`resource` `""`، ولا يصل شيء إلى حافظة النظام. في Rust، تترك عمليات الكتابة الحافظة كما هي، وتُجيب عمليات القراءة بما تُجيب به حافظة فارغة (`""`، `None`، قائمة فارغة، `false`)، ويُسجَّل الرفض. انظر [الصندوق الرملي والقدرات](../docs/sandbox-and-capabilities.md).
>
> ```tsx
> try {
>   await Clipboard.writeText(code());
> } catch (error) {
>   if (error.code === "ERR_ACCESS_DENIED") showHint("Copying is turned off for this app");
>   else throw error;
> }
> ```
## Picker

يعرض Picker API أداة اختيار الصور في النظام ويمنح التطبيق الصور التي يختارها المستخدم: أداة Photos picker على iOS (`PHPickerViewController`)، وأداة Photo Picker على Android، ولوحة فتح أو مربع حوار ملفات على أنظمة سطح المكتب، وحقل إدخال ملف (file input) في المتصفح. على iOS وAndroid تعمل الأداة خارج التطبيق وتسلّم فقط ما يختاره المستخدم، ولذلك لا تحتاج إلى إذن الوصول إلى مكتبة الصور. تصل كل صورة مختارة على شكل `File` (في TSX) أو `PickedFile` (في Rust) تبقى بايتاتها في الطبقة الأصلية (native): اعرضها باستخدام `URL.createObjectURL(file)` داخل [`Image`](../elements/image.md)، وارفعها باستخدام `fetch` و`FormData`. يستدعي كود Rust الدالة `pick_images` من `nsh_core::prelude`؛ أما TSX فيستورد `Picker` من `nsh`.

```rust tabs
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*; // pick_images
```

```tsx tabs
import { Picker, type PickedImage } from "nsh";
```

```ts
const Picker: {
  pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
};

interface PickImagesOptions {
  multiple?: boolean; // let the user pick several (false: one)
  limit?: number; // at most this many when multiple (up to 100)
  maxDimension?: number; // scale images whose longer side is longer, in pixels
  quality?: number; // JPEG quality from 0 to 1 (0.9)
  format?: "compatible" | "current"; // "compatible": HEIC and the like as JPEG
}

interface PickedImage {
  file: File; // name, type, size in bytes and the bytes
  size: PixelSize; // upright
}
```

| TS | Rust |
|---|---|
| `await Picker.pickImages(options)` | `pick_images(request).await -> Vec<PickedFile>` |
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: القيمة 0 تعني حتى 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

تعرض أداة الاختيار ثم تُنجَز بالصور التي اختارها المستخدم، بالترتيب الذي اختارها به، أو بالقيمة `[]` عندما يلغي المستخدم. في Rust: `pick_images(request)`، وهي نتيجة تُنتظر داخل مهمة (task) (`spawn`، أو دالة وحدة (module) من `async`). `pickImages` لا ترمي استثناءً أبدًا: الخيارات خارج النطاق (`limit: 0`، أو `quality` خارج المجال من 0 إلى 1) ترفض الوعد (promise) بـ `RangeError`، والاختيار الذي لا تمنحه صلاحيات التطبيق (capabilities) يُرفض بـ `ERR_ACCESS_DENIED` (انظر أدناه). الإلغاء هو جواب المستخدم وليس فشلًا: فهو يُنجز بالقيمة `[]`.

تصل الصور جاهزة للإرسال:

- **صيغ يقبلها كل متصفح وكل خادم.** تصل صور JPEG وPNG وGIF وWebP كما هي؛ أما الصورة المخزّنة بصيغة أخرى (HEIC على أجهزة iPhone، وHEIF، وTIFF) فتصل بصيغة JPEG. `format: "current"` تُبقي الصيغة المخزّنة.
- **تصغير أصلي (native).** مع `maxDimension`، تُصغَّر الصورة التي يزيد ضلعها الأطول على هذا الحد لتناسبه، وتُعدَّل لتكون قائمة، ثم تُرمَّز من جديد: PNG بصيغة PNG، وأي صيغة أخرى بصيغة JPEG بجودة `quality`. صور الهواتف بدقة 12 إلى 48 ميغابكسل؛ وتصغيرها إلى 2048 بكسل قبل الرفع يجعل حجمها بضع مئات من الكيلوبايتات. كما يعيد `quality` ترميز صور JPEG.
- **ما تعرضه.** `size` هو حجم الصورة بالبكسل كما تظهر، بعد تطبيق اتجاه الكاميرا. الصورة التي يعيد NSH ترميزها لا تحمل أي بيانات وصفية (ولا الموقع)؛ أما التي تصل كما هي فتحتفظ ببياناتها.

على Windows وLinux وفي نوافذ GPUI، يعرض مربع الحوار الصيغ التي يقبلها الطلب (مع `"compatible"`: ‏JPEG وPNG وGIF وWebP) وتصل الملفات كما هي مخزّنة وبحجمها الأصلي.

يرفق مُحرِّر الدردشة صورة، ويعرضها أثناء كتابة الرسالة، ثم يرفعها عند الإرسال:

```rust tabs
use nsh_core::geometry::{DevicePixels, Percentage};
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*;

fn attach_button(attached: Signal<Option<PickedFile>>) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .accessibility_label("Choose a photo")
        .on_press(move || {
            let mut request = PickRequest::new(false, 1);
            request.max_dimension = Some(DevicePixels(2048));
            request.quality = Some(Percentage(0.85));
            let picked = pick_images(request);
            spawn(async move {
                if let Some(file) = picked.await.into_iter().next() {
                    attached.set(Some(file));
                }
            });
        })
        .child(text("Photo"))
}

async fn upload(file: &PickedFile) -> Result<HttpResponse, String> {
    let request = HttpRequest::post("https://example.com/upload", file.data.to_vec())
        .header("Content-Type", file.mime.as_str());
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, Text, View } from "nsh";
import { Picker } from "nsh";

const attached = signal<{ file: File; src: string } | null>(null);

async function choosePhoto() {
  const [picked] = await Picker.pickImages({ maxDimension: 2048, quality: 0.85 });
  if (picked) attached.set({ file: picked.file, src: URL.createObjectURL(picked.file) });
}

async function send(text: string) {
  const body = new FormData();
  body.append("text", text);
  if (attached()) body.append("photo", attached()!.file);
  await fetch("https://example.com/messages", { method: "POST", body });
  if (attached()) URL.revokeObjectURL(attached()!.src);
  attached.set(null);
}

<View class="flex-row items-center gap-2">
  <View role="button" accessibilityLabel="Choose a photo" onPress={choosePhoto}>
    <Text>Photo</Text>
  </View>
  <If when={attached()}>
    <Image src={attached()!.src} style={{ width: 48, height: 48, borderRadius: 8 }} />
  </If>
</View>;
```

عدة صور دفعة واحدة:

```rust tabs
let picked = pick_images(PickRequest::new(true, 9));
spawn(async move {
    let files = picked.await;
    photos.update(|list| list.extend(files));
});
```

```tsx tabs
const images = await Picker.pickImages({ multiple: true, limit: 9, maxDimension: 2048 });
photos.set([...photos(), ...images.map((image) => URL.createObjectURL(image.file))]);
```

<a id="embedding-apps"></a>

### التطبيقات المضمِّنة

التطبيق الذي يضمّن NSH ولديه أداة اختيار خاصة به (مثل أداة بألبومات التطبيق نفسه) يجيب عن عمليات الاختيار بنفسه: في Rust، يستلم `PickerBackend` (`nsh_core::picker`) الممرَّر إلى المحرك (`EngineConfig::picker`، أو `AppView::set_picker` في تطبيقات GPUI وGPUI Kit) `PickRequest` الخاص بكل عملية اختيار ويُرجع الملفات، ولا تُعرض أداة الاختيار الخاصة بالنظام. تُستكمل الملفات التي يُرجعها كما تُستكمل ملفات المنصة: تُقصّ إلى حد الطلب، وتُقرأ أحجامها وأنواعها وامتداداتها من بايتاتها.

<a id="tests"></a>

### الاختبارات

`nsh test` يجيب عن عمليات الاختيار في التشغيل بلا واجهة (headless): `app.onPick(handler)` يُرجع الملفات التي يختارها المستخدم (`{ name, type, data }`)، وبدون معالج (handler) تُلغى عملية الاختيار. انظر [الاختبار](../docs/testing-and-trace.md).

> [!NOTE]
> عندما يصرّح تطبيقك بـ `capabilities` في `nsh.json`، يجب منح أداة الاختيار الصلاحية بـ `"picker": true`. بدونها
> لا يعرض `pickImages` شيئًا ويرفض بـ `Error` قيمة `code` فيه هي `"ERR_ACCESS_DENIED"`، `permission`
> `"picker"` و`resource` `""`. في Rust، يُجيب `pick_images` بلا ملفات ويُسجَّل الرفض. انظر
> [العزل (Sandbox) والصلاحيات](../docs/sandbox-and-capabilities.md).

## Speech

يحوّل Speech API ما يقوله المستخدم إلى نص (الإملاء): يبدأ التطبيق جلسة، وتستمع المنصة إلى الميكروفون، ويصل النص المفرَّغ وهو ينمو. يعتمد macOS وiOS في التعرف على إطار Speech الخاص بالنظام؛ ويسأل النظام المستخدم مرة واحدة عن الميكروفون والتعرف على الكلام. على المنصات الأخرى تنتهي الجلسة فورًا بالخطأ `"unavailable"`، لذا تحقق من `Speech.available()` قبل عرض زر الميكروفون. يستدعي كود Rust الدالة `recognize_speech` من `nsh_core::prelude`؛ أما TSX فيستورد `Speech` من `nsh`.

```rust tabs
use nsh_core::speech::{SpeechEvent, SpeechRequest};
```

```tsx tabs
import { Speech, type SpeechSession } from "nsh";
```

```ts
const Speech: {
  available(): Promise<boolean>;
  start(options?: SpeechOptions): SpeechSession;
};

interface SpeechOptions {
  /** The language spoken, a BCP 47 tag ("en-US", "zh-CN"); the user's when left out. */
  lang?: string;
  /** Results while the user speaks (true, the default), or only the final one. */
  interim?: boolean;
}

interface SpeechSession {
  on(event: "start", listener: () => void): () => void;
  on(event: "result", listener: (result: SpeechResult) => void): () => void;
  on(event: "end", listener: (end: SpeechEnd) => void): () => void;
  /** The whole transcript so far. */
  readonly text: string;
  readonly ended: boolean;
  stop(): void;
  abort(): void;
}

interface SpeechResult { text: string; isFinal: boolean }
interface SpeechEnd { text: string; error?: SpeechErrorCode }

type SpeechErrorCode =
  | "not-allowed" | "no-speech" | "audio-capture" | "network"
  | "language-not-supported" | "unavailable" | "failed";
```

| TSX | Rust |
|---|---|
| `await Speech.available()` | `speech_available().await -> bool` |
| `Speech.start(options)` | `recognize_speech(request) -> SpeechRecognition` |
| `session.on("result", ...)` | `recognition.next().await -> Option<SpeechEvent>` |
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (إسقاطه يُلغي الجلسة) |

### Speech.start

تبدأ جلسة وتُرجعها فورًا. تُبلِّغ الجلسة بالترتيب التالي: `start` عندما يعمل الميكروفون ويستمع المُتعرِّف، ثم `result` في كل مرة يتغير فيها النص المفرَّغ (`text` هو دائمًا النص كاملًا حتى تلك اللحظة، لذا يعرضه التطبيق كما هو)، ثم `end` واحد، لا يصل بعده شيء. `stop()` يوقف الاستماع ويدع المُتعرِّف ينهي ما سمعه: نتيجة أخيرة مع `isFinal: true`، ثم `end`. `abort()` ينهي الجلسة فورًا، بلا خطأ، ويُسقط ما لم يُبلَّغ عنه. تعمل جلسة واحدة في كل مرة: بدء جلسة أخرى يُلغي الجلسة الجارية.

`end` يحمل آخر نص مفرَّغ، وعند فشل الجلسة يحمل `error`، بأسماء مطابقة لما في Web Speech API:

| `error` | الحالة |
|---|---|
| `"not-allowed"` | لا يسمح المستخدم أو النظام بالميكروفون أو بالتعرف على الكلام. |
| `"no-speech"` | لم يُقَل شيء. |
| `"audio-capture"` | تعذّر استخدام الميكروفون. |
| `"network"` | يحتاج المُتعرِّف إلى الشبكة وتعذّر الوصول إليها. |
| `"language-not-supported"` | لا يعرف المُتعرِّف `lang`. |
| `"unavailable"` | لا تتعرف هذه المنصة على الكلام، أو لا تتعرف عليه الآن. |
| `"failed"` | فشل المُتعرِّف لسبب آخر. |

`start` يرمي `TypeError` عند تمرير خيارات من أنواع خاطئة، ويرمي `RangeError` عندما لا يكون `lang` وسم لغة صالحًا.

```tsx
import { signal, Speech, type SpeechSession } from "nsh";

const transcript = signal("");
let session: SpeechSession | null = null;

function toggle() {
  if (session && !session.ended) {
    session.stop();
    return;
  }
  session = Speech.start({ lang: "en-US" });
  session.on("result", ({ text }) => transcript.set(text));
  session.on("end", ({ text, error }) => {
    if (error) console.warn("dictation ended:", error);
    else transcript.set(text);
  });
}
```

```rust
use nsh_core::prelude::*;
use nsh_core::speech::{SpeechEvent, SpeechRequest};

async fn dictate() -> String {
    let mut recognition = recognize_speech(SpeechRequest::default());
    let mut text = String::new();
    while let Some(event) = recognition.next().await {
        match event {
            SpeechEvent::Result { text: heard, .. } => text = heard,
            SpeechEvent::End { .. } => break,
            _ => {}
        }
    }
    text
}
```

### Speech.available

تُنجَز بالقيمة `true` حيثما يمكن تشغيل جلسة: على macOS وiOS، وفي أي مكان يتعرف فيه التطبيق المضمِّن على الكلام بنفسه.

### Info.plist

على macOS وiOS يعرض النظام سبب طلب التطبيق الميكروفون والتعرف على الكلام. `nsh package` و`nsh run` يكتبان `NSMicrophoneUsageDescription` و`NSSpeechRecognitionUsageDescription` في ملف Info.plist الخاص بالتطبيق عندما يُسمح للتطبيق باستخدام الكلام (عندما تمنح صلاحيات `capabilities` قيمة `speech`، أو لا يصرّح بأي منها).

<a id="embedding-apps-1"></a>

### التطبيقات المضمِّنة

التطبيق الذي يضمّن NSH ويتعرف على الكلام بطريقته الخاصة (محرك أو خدمة خاصة به) يجيب عن الجلسات بنفسه: في Rust، يستلم `SpeechBackend` (`nsh_core::speech`) الممرَّر إلى المحرك (`EngineConfig::speech`) `SpeechRequest` الخاص بكل جلسة، و`SpeechSink` يبلِّغ إليه من أي خيط (thread)، ويُرجع `SpeechControl` الذي توقف به النواة الجلسة وتُلغيها. ولا يُستخدم مُتعرِّف المنصة حينئذٍ.

<a id="tests-1"></a>

### الاختبارات

`nsh test` يشغّل الجلسات على مُتعرِّف وهمي في التشغيل بلا واجهة (headless): تبدأ الجلسة فورًا، و`app.hear(text)` يبلِّغ عن `text` بوصفه النص المفرَّغ حتى الآن، و`app.endSpeech(error?)` ينهيها، و`app.speechRequests()` يسرد الجلسات التي بدأها التطبيق. انظر [الاختبار](../docs/testing-and-trace.md).

> [!NOTE]
> عندما يصرّح تطبيقك بـ `capabilities` في `nsh.json`، يجب منح الكلام الصلاحية بـ `"speech": true`. بدونها
> يرمي `Speech.start` `Error` قيمة `code` فيه هي `"ERR_ACCESS_DENIED"`، `permission` `"speech"` و`resource` `""`.
> في Rust، تنتهي الجلسة بـ `not-allowed` ويُسجَّل الرفض. انظر
> [العزل (Sandbox) والصلاحيات](../docs/sandbox-and-capabilities.md).

## Storage

يحتفظ Storage API ببيانات التطبيق على الجهاز: سلاسل نصية بمفتاح نصي، وتبقى موجودة عند بدء التطبيق في المرة التالية. استخدمه للإعدادات والمسودات وآخر تبويب فتحه المستخدم وذاكرة مؤقتة لما أرسله الخادم، أي لأي حالة ينبغي أن تعيش أطول من عملية التطبيق. يستخدم كود Rust `nsh_core::storage::Storage`، ويستورد TSX `Storage` من `nsh`؛ وكلاهما يقرأ ويكتب نفس المدخلات، فالتطبيق الذي فيه مدخل Rust ومدخل TSX يرى مجموعة بيانات واحدة.

```rust tabs
use nsh_core::storage::Storage;
```

```tsx tabs
import { Storage } from "nsh";
```

```ts
const Storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
};
```

| TS | Rust (`nsh_core::storage::Storage`) |
|---|---|
| `await Storage.getItem(key)` | `Storage::get_item(key) -> Option<String>` |
| `await Storage.setItem(key, value)` | `Storage::set_item(key, value) -> Result<(), StorageFull>` |
| `await Storage.removeItem(key)` | `Storage::remove_item(key)` |
| `await Storage.keys()` | `Storage::get_all_keys() -> Vec<String>` |
| `await Storage.clear()` | `Storage::clear()` |

دوال Rust متزامنة لأن المدخلات في الذاكرة: استدعِها حيث تعمل المكوّنات (في أجسامها ومعالجاتها ومهامها).

لكل تطبيق تخزين خاص به، حتى 5 ميغابايت من المفاتيح والقيم. تُنفَّذ الاستدعاءات بالترتيب الذي يجريها به التطبيق، لذا فإن `getItem` بعد `setItem` ترى القيمة الجديدة دون انتظار الكتابة. تأتي القراءات من الذاكرة؛ أما الكتابات فتصل إلى القرص في الخلفية، بضع عمليات في كل مرة.

| المنصة | مكان حفظ البيانات |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` في حاوية التطبيق |
| Android | `files/nsh/<app id>/storage.json` في الدليل الخاص بالتطبيق |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | `localStorage` الخاص بالمتصفح، تحت مفاتيح تحمل اسم معرّف التطبيق (`nsh:com.example.todo:…`) |

يُحفظ `storage.json` التالف باسم `storage.json.corrupt` بجواره، ويبدأ التطبيق بتخزين فارغ؛ أما الذي تتعذّر قراءته فتبقى تغييرات التطبيق في الذاكرة، فلا يُستبدل الملف أبدًا.

معرّف التطبيق هو `id` في `nsh.json`، وهو يسافر مع التطبيق: `nsh build` و`nsh package` يكتبانه بجوار الحزمة (bundle)، وخادم التطوير يرسله، والحزمة الموقّعة تحمل المعرّف الذي تشهد به شهادة مفتاح الإصدار. وهكذا يحتفظ كل تطبيق ببياناته الخاصة دون أي إعداد، أينما عمل؛ والتطبيق بلا معرّف يحتفظ بها تحت `default`. يمكن للتطبيق المضمِّن اختيار مكان آخر (انظر [التضمين على iOS](../docs/ios.md) و[التضمين على Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

تُنجَز بقيمة `key`، أو بـ `null` عندما لا تكون له قيمة. في Rust: `Storage::get_item(key)`، و`None` عندما لا تكون له قيمة.

```rust tabs
let theme = Storage::get_item("theme").unwrap_or_else(|| "system".into());
```

```tsx tabs
const theme = (await Storage.getItem("theme")) ?? "system";
```

### Storage.setItem

```ts
setItem(key: string, value: string): Promise<void>;
```

تضبط `key` على `value` وتستبدل ما كان فيه. تُرفض بـ `Error` قيمة `code` فيه هي `"ERR_NSH_QUOTA_EXCEEDED"` عندما يتجاوز التخزين 5 ميغابايت؛ ولا تُحفظ القيمة حينئذٍ. في Rust: `Storage::set_item(key, value)`، التي تُرجع `Err(StorageFull)` حينئذٍ. القيم نصوص: احتفظ بالبيانات المهيكلة بصيغة JSON (`serde_json::to_string` في Rust، `JSON.stringify` في TSX) واقرأها من جديد (`serde_json::from_str`، `JSON.parse`).

```rust tabs
let draft = serde_json::json!({ "title": title.get(), "body": body.get() });
if let Err(full) = Storage::set_item("draft", draft.to_string()) {
    log::warn!("{full}");
}
```

```tsx tabs
Storage.setItem("draft", JSON.stringify({ title: title(), body: body() }));
```

### Storage.removeItem

```ts
removeItem(key: string): Promise<void>;
```

تحذف `key` وقيمته. حذف مفتاح لا قيمة له لا يفعل شيئًا. في Rust: `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

تُنجَز بكل المفاتيح، بالترتيب. في Rust: `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

تحذف كل مفاتيح التطبيق، مثلًا عندما يسجّل المستخدم الخروج. في Rust: `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### حفظ إشارة على الجهاز

اقرأ القيمة المخزّنة عند بدء التطبيق، ثم اكتبها من جديد كلما تغيّرت الإشارة (signal):

```rust tabs
use nsh_core::{storage::Storage, prelude::*};

#[component]
pub fn App() -> impl IntoElement {
    let saved = Storage::get_item("count").and_then(|n| n.parse().ok());
    let count = signal(saved.unwrap_or(0_u32));
    effect(move || {
        if let Err(full) = Storage::set_item("count", count.get().to_string()) {
            log::warn!("{full}");
        }
    });
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Pressed {} times", count.get())))
}
```

```tsx tabs
import { effect, mount, signal, Text, View } from "nsh";
import { Storage } from "nsh";

const count = signal(0);
const loaded = signal(false);
Storage.getItem("count").then((saved) => {
  count.set(Number(saved ?? 0));
  loaded.set(true);
});
effect(() => {
  if (loaded()) Storage.setItem("count", String(count()));
});

mount(() => (
  <View onPress={() => count.update((n) => n + 1)}>
    <Text>Pressed {count()} times</Text>
  </View>
));
```

## host

`host` يصل إلى التطبيق الذي يضمّن NSH: التطبيق الأصلي (native) المحيط بـ `NshAppView` / `NshView`، أو على الويب الصفحة التي تشغّل المشغِّل (player). يستدعي التطبيق دوال المضيف (host) بأسمائها مع وسائط JSON، ويستمع إلى الأحداث التي يرسلها المضيف.

```ts
import { host } from "nsh";
```

```ts
const host: {
  readonly params: { readonly [key: string]: unknown };
  post(name: string, data?: unknown): void;
  available(): boolean;
  call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
  on(event: string, listener: (payload: unknown) => void): () => void;
};
```

### host.available

```ts
available(): boolean;
```

هل للمنصة مضيف يجيب عن الاستدعاءات. على الويب تكون `true` عندما تمنح الصفحة المشغِّل مضيفًا ([المضيف على الويب](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

تستدعي دالة المضيف `name` مع `args` (أي قيمة JSON؛ و`null` بدونها) وتُنجَز بما تُرجعه. `host.call` لا ترمي استثناءً أبدًا: كل فشل يرفض الوعد (promise)، بـ `Error` يبيّن `code` فيه ما حدث (الرسالة للبشر وقد تتغير):

| `code` | الحالة |
|---|---|
| `ERR_NSH_HOST_ERROR` | فشلت دالة المضيف، أو لا توجد في المضيف دالة `name`؛ والرسالة هي رسالة المضيف |
| `ERR_ACCESS_DENIED` | `name` ليس ضمن [صلاحية `host`](#capability) الخاصة بالتطبيق؛ `permission` هو `"host"`، و`resource` الاسم |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | لا مضيف في المنصة: `host.available()` هو `false` |
| `ETIMEDOUT` | لم يجب المضيف في الوقت المحدد |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 استدعاءً تنتظر بالفعل إجابات التطبيق المضمِّن |

الاسم غير الصالح (من 1 إلى 128 من `A`–`Z`، `a`–`z`، `0`–`9`، `_`، `.`، `:`، `-`، بدون `..`) يُرفض بـ `TypeError`.

ينتظر الاستدعاء إجابة المضيف 30 ثانية، ثم يُرفض بـ `ETIMEDOUT`؛ وتُسقَط الإجابة التي تصل بعد ذلك. `options.timeout` يحدد مدة الانتظار بالمللي ثانية، و`0` لعدم وجود حد؛ والمهلة الكبيرة جدًا بحيث لا تبلغها الساعة (نحو 1e22 مللي ثانية) تنتظر بلا حد أيضًا، أما المهلة السالبة أو `NaN` أو اللانهائية فترفض الاستدعاء بـ `RangeError`. الوقت هو وقت التطبيق، مثل مؤقِّتاته: في `nsh test` مع ساعة يدوية يتحرك مع الساعة.

```ts
const user = (await host.call("getUserInfo")) as { name: string };
const quote = await host.call("quote.refresh", { symbol: "AAPL" }, { timeout: 5000 }).catch((error) => {
  if (error.code === "ETIMEDOUT" || error.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") return null;
  throw error;
});
```

### host.on

```ts
on(event: string, listener: (payload: unknown) => void): () => void;
```

تستدعي أحداث المنصة `listener` بحمولة كل `event` يرسله المضيف، إلى أن تُستدعى الدالة التي يُرجعها `host.on`؛ والمستمع (listener) المضاف أثناء رسم مكوّن يتوقف مع المكوّن. الأحداث التي يرسلها المضيف قبل بدء التطبيق تصل بمجرد بدئه، فالمستمعون المسجَّلون في المستوى الأعلى من التطبيق يستلمونها؛ أما الحدث المرسَل قبل تسجيل المستمع فلا يُعاد إليه. اقرأ الحالة التي يبدأ بها التطبيق عبر `host.call`، وتابع تغيّراتها عبر `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### الصلاحية

يجب إدراج كل دالة يستدعيها التطبيق في `capabilities.host` الخاص بـ `nsh.json`: أسماء دقيقة أو بادئات تنتهي بـ `*`، أو `true` لها جميعًا. ينطبق هذا على كل تطبيق، حتى التطبيق الذي لا يملك `capabilities` أخرى: دوال المضيف لا تُمنح افتراضيًا أبدًا. الاستدعاء غير الممنوح يُرفض بالخطأ `ERR_ACCESS_DENIED` ويُسجَّل، و`host.post` لاسم كهذا إلى تطبيق مضيف يرمي الخطأ نفسه، وبناء تطبيق يستورد `host` من `nsh` دون `capabilities.host` يُصدر تحذيرًا. الأحداث لا تحتاج إلى منح. راجع [الحماية المعزولة والصلاحيات](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### المضيف على الويب

على الويب، الصفحة هي المضيف. الخيار `host` في `createPlayer` يجيب عن الاستدعاءات، و`player.hostEvent(event, payload)` يرسل الأحداث:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

يحدد التطبيق المنشور مضيفه في `nsh.json`: `web.host` وحدة JS في مجلد التطبيق، نسبةً إلى `nsh.json`، تُصدِّر `createHost(player)` التي تعيد الكائن الذي يحتوي `call`. `nsh package --target web` يشحنها مع الموقع، و`nsh run --target web` يشغّلها في صفحة التطوير، و`nsh test` يشغّلها للتطبيقات التي تفتحها اختباراته. `web.connect` يسرد المضيفين الذين تصل إليهم طلبات المضيف نفسه، والتي تسمح بها Content-Security-Policy الخاصة بالصفحة إلى جانب `capabilities.network` الخاص بالتطبيق. راجع [الويب](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

المعاملات التي ضبطها التطبيق المضيف قبل أن يبدأ تطبيقك، وتُقرأ بشكل متزامن من أول سطر في شيفرتك؛ `{}` عندما لم يضبط أيًا منها. تبقى كما هي أثناء تشغيل تطبيقك: الطلبات اللاحقة تأتي كأحداث.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```

<a id="native-sdk-channel"></a>

### قناة Native SDK

يحتفظ `send` في Native SDK بالأحداث إلى أن يستمع التطبيق، حتى 256 حدثًا. عندما يتوقف آخر مستمع أثناء التسليم، تبقى الأحداث المتبقية في الانتظار بالترتيب؛ والأحداث المرسلة أثناء الإغلاق تنتظر التطبيق التالي الذي يُحمَّل. `host.post(name, data)` يسلّم البيانات إلى معالج Native SDK، الذي يميّز `isPost` بين الإرسالات (posts) والاستدعاءات (calls).

<a id="the-embedding-apps-side"></a>

### جانب التطبيق المضيف

يحتفظ كل عرض بقناة واحدة لكل تطبيق يحمّله. اضبط المعاملات قبل التحميل، وأرسل الأحداث في أي وقت من أي خيط، وسجّل المعالجات بالاسم. تتطلب الاستدعاءات والإرسالات منحة `capabilities.host` للتطبيق. يجيب المعالج مرة واحدة، الآن أو لاحقًا؛ والإجابة التي لا تصل أبدًا تُفشل الاستدعاء.

```rust tabs
// Any platform's AppView (GPUI, macOS, Windows, Linux, iOS): its HostChannel.
use serde_json::json;

let host = view.host();
let mut params = serde_json::Map::new();
params.insert("conversation".into(), json!("42"));
host.set_params(params);
// Runs on the engine thread: answer at once, or move the call and answer later from any thread.
host.handle("user.profile", |call| {
    let id = call.data()["id"].clone();
    call.resolve(json!({ "id": id, "name": "Ada" }));
});
host.send("conversation.open", json!({ "id": "43" })).unwrap();
```

```swift tabs
appView.params = ["conversation": "42"]
try appView.loadBundle(at: bundleURL)

// On the main thread; return the answer, or throw to reject the call.
appView.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"]
    return ["id": id ?? NSNull(), "name": try await profiles.name(of: id)]
}
appView.handle("analytics") { data, _ in analytics.log(data) }
appView.send("conversation.open", ["id": "43"])
```

```java tabs
nsh.setParams(Map.of("conversation", "42"));
nsh.loadAssetBundle("nsh");

// On the UI thread; answer now or later, from any thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    profiles.load(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});
nsh.send("conversation.open", Map.of("id", "43"));
```

راجع [التضمين على iOS](../docs/ios.md#talking-to-the-app) و[التضمين على Android](../docs/android.md#talking-to-the-app) و[GPUI](../docs/gpui.md).

> [!NOTE]
> تستخدم استدعاءات Native SDK وإرسالاتها [صلاحية `host`](../docs/sandbox-and-capabilities.md#host) نفسها التي تستخدمها استدعاءات المنصة. يصل تطبيق Rust إلى Rust الخاص بالتطبيق المضيف مباشرة، عبر الدوال التي يسجّلها ([`nativeModule`](#nativemodule) واستيرادات Rust).

## keymap

يربط keymap اختصارات لوحة المفاتيح في التطبيق: ضغطة مفتاح مثل `"mod+k"` والدالة التي تشغّلها. تستدعي شيفرة Rust كلًّا من `on_key` و`on_key_with` و`key_label` من `nsh_core::prelude`؛ وتستورد TSX `keymap` من `nsh`. كلاهما يقبل ضغطات المفاتيح نفسها ويتبع القواعد نفسها.

```rust tabs
use nsh_core::prelude::*; // on_key, on_key_with, KeyOptions, key_label
```

```tsx tabs
import { keymap } from "nsh";
```

```ts
const keymap: {
  bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
  bind(bindings: Record<string, (e: { keystroke: string }) => void>, options?: KeyBindingOptions): () => void;
  label(keystroke: string): string;
};

interface KeyBindingOptions {
  when?: "always" | "notEditing";
  repeat?: boolean;
}
```

| TS | Rust |
|---|---|
| `keymap.bind(keystroke, handler)` | `on_key(keystroke, handler)` |
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`؛ `when` هو `nsh_core::keymap::When` (`Auto`، `Always`، `NotEditing`) |
| `keymap.bind({ … })` | `on_key` واحد لكل ضغطة مفتاح |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

يعيش ربط Rust ما دام المكوّن (المالك) الذي أنشأه حيًّا؛ ويتلقى المعالج ضغطة المفتاح كما كُتبت.

تعمل الاختصارات على macOS وWindows وLinux وفي المتصفحات (مفاتيح المتصفح نفسه، مثل Ctrl+T أو Cmd+W، لا تصل إلى الصفحة أبدًا)، وعلى iOS وAndroid مع لوحة مفاتيح فعلية: لوحة مفاتيح iPad، أو Mac يشغّل تطبيق iPad، أو جهاز لوحي أو Chromebook، أو المحاكيين. تعمل الشيفرة نفسها في كل مكان؛ وبلا لوحة مفاتيح لا يُطلق أي مفتاح هذه الارتباطات.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

يشغّل `handler` عند الضغط على `keystroke`، ويعيد دالة تزيل الربط. يتلقى المعالج `{ keystroke }`: ضغطة المفتاح كما كتبتها، بحالة أحرفها. في Rust: `on_key(keystroke, handler)`، ويتلقى معالجه ضغطة المفتاح نفسها.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let open = signal(false);
    on_key("mod+k", move |_| open.set(true));
    on_key("escape", move |_| open.set(false));
    text(move || if open.get() { "Search…" } else { "Press ⌘K" })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(true));
keymap.bind("escape", () => open.set(false));

mount(() => <Text>{open() ? "Search…" : "Press ⌘K"}</Text>);
```

مرّر كائنًا لربط عدة ضغطات مفاتيح دفعة واحدة؛ والدالة المعادة تزيلها جميعًا. في Rust، كل ضغطة مفتاح هي `on_key` واحد:

```rust tabs
on_key("mod+s", move |_| save());
on_key("mod+shift+p", move |_| open_palette());
on_key("f5", move |_| refresh());
```

```tsx tabs
const unbind = keymap.bind({
  "mod+s": save,
  "mod+shift+p": openPalette,
  f5: refresh,
});
```

الربط الذي يُنشأ أثناء رسم مكوّن يُزال مع المكوّن، فتعيش اختصارات الشاشة ما دامت الشاشة حيّة:

```rust tabs
#[component]
fn Editor() -> impl IntoElement {
    on_key("mod+enter", move |_| send());
    input().multiline(true)
}
```

```tsx tabs
function Editor() {
  keymap.bind("mod+enter", send);
  return <Input multiline />;
}
```

مع خادم التطوير، يؤدي تعديل وحدة إلى إزالة الارتباطات التي أنشأتها شيفرتها العليا قبل تشغيلها من جديد، فلا تترك إعادة التحميل الفورية اختصارات قديمة خلفها.

### keymap.label

```ts
label(keystroke: string): string;
```

يعيد `keystroke` كما تعرضه القوائم والتلميحات في المكان الذي يعمل فيه التطبيق: `"⇧⌘L"` على macOS وiOS (وفي متصفح على Mac أو iPhone أو iPad)، و`"Ctrl+Shift+L"` على Windows وLinux والمتصفحات الأخرى، للمدخل `"mod+shift+l"`. في Rust: `key_label(keystroke)`. استخدمه لعرض اختصارات التطبيق بالمفاتيح التي تعمل فعلًا:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

يرمي `TypeError` عند ضغطة مفتاح غير صالحة، كما يفعل `bind`؛ أما `key_label` و`on_key` فتُحدثان panic بالرسالة نفسها.

<a id="keystrokes"></a>

### ضغطات المفاتيح

ضغطة المفتاح هي معدِّلات ومفتاح تجمعها `+`: `"mod+k"`، `"ctrl+shift+p"`، `"alt+enter"`، `"escape"`، `"f5"`، `"cmd+-"` (Command وعلامة الناقص).

| المعدِّل | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (ويُكتب أيضًا `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (ويُكتب أيضًا `command`، `meta`، `super`، `win`) | Command (⌘) | مفتاح Windows | Super |
| `ctrl` (ويُكتب أيضًا `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (ويُكتب أيضًا `option`، `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

يتبع iOS نظام macOS (`mod` هو Command) ويتبع Android نظامي Windows وLinux (`mod` هو Ctrl، و`cmd` مفتاح Meta). في المتصفح، تتبع المفاتيح المنصة التي يعمل عليها المتصفح: `mod` هو Command على Mac أو iPhone أو iPad، وCtrl في غيرها.

استخدم `mod` لاختصارات التطبيق الخاصة به: فهو المفتاح الذي تستخدمه تطبيقات كل منصة لها (⌘K على macOS وCtrl+K على Windows وLinux)، فتناسب صياغة واحدة كل مكان. مفتاح Windows وSuper يخصّان النظام في الغالب، لذا نادرًا ما يكون `cmd` مناسبًا خارج macOS.

المفتاح حرف أو رقم أو علامة ترقيم، يُكتب كالحرف الذي يطبعه على لوحة مفاتيح أمريكية بدون Shift (`k`، `1`، `,`، `/`، `[`؛ `"shift+/"` لـ `?`، `"shift+k"` لـ Shift+K)، أو اسم: `plus` (مفتاح `=` / `+`، ويُكتب أيضًا `=`)، `minus` (ويُكتب أيضًا `-`)، `space`، `enter` (`return`)، `escape` (`esc`)، `tab`، `backspace`، `delete` (`del`)، `insert`، الأسهم `up`، `down`، `left`، `right` (`arrowup`، …)، `home`، `end`، `pageup`، `pagedown`، `f1` إلى `f24`. حالة الأحرف لا تهم: `"Mod+Shift+K"` هو `"mod+shift+k"`، والحرف الكبير هو المفتاح نفسه وليس Shift (`"mod+K"` هو `"mod+k"`). الأحرف الصغيرة هي النمط الموصى به، وهو ما تستخدمه هذه الصفحات. `"mod-k"` و`"mod++"` خطآن تعطي رسالتاهما الصياغة الصحيحة. تقبل اختصارات القوائم في `nsh/desktop` ضغطات المفاتيح نفسها.

تعمل الاختصارات مع أي تخطيط للوحة المفاتيح: ففي تخطيط سيريلي أو يوناني، `mod+k` هو المفتاح الذي يكتب K في التخطيط الأمريكي، كما هي الحال مع اختصارات القوائم.

`bind` يرمي `TypeError` يوضح الخلل في ضغطة المفتاح غير الصالحة (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`)، ويرفض ضغطات المفاتيح التي يحتفظ بها النظام لنفسه، فلا يستطيع تطبيق كسرها أبدًا:

| المنصة | المحجوز |
|---|---|
| macOS، iOS | Cmd+Q (إنهاء)، Cmd+H (إخفاء)، Option+Cmd+H (إخفاء الباقي)، Cmd+M (تصغير)، Ctrl+Cmd+F (ملء الشاشة) |
| Linux، Windows، Android | Ctrl+Q (إنهاء)، Alt+F4 (إغلاق)، F11 (ملء الشاشة) |
| الويب | لا شيء (المتصفح يحتفظ بمفاتيحه) |

<a id="while-typing"></a>

### أثناء الكتابة

يحتاج حقل النص الذي يملك تركيز لوحة المفاتيح إلى مفاتيحه: الكتابة، وتحريك المؤشر، والحذف، وتحديد الكل، والقص، والنسخ، واللصق، والتراجع، والإعادة. لذلك لا يعمل الربط افتراضيًا أثناء تركيز حقل نص (أو عرض ويب) إذا كانت ضغطة مفتاحه واحدة من هذه: المفاتيح العادية والمفاتيح مع Shift أو Option فقط، والأسهم، وHome، وEnd، وPage Up / Down، وReturn، وTab، وEscape، وBackspace، وDelete، و`mod+a`، `mod+c`، `mod+v`، `mod+x`، `mod+z`. أما ضغطات المفاتيح الأخرى مع Command أو Control، ومفاتيح الوظائف، فتعمل أينما كان التركيز.

`when` يغيّر ذلك (في Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | يعمل |
|---|---|
| (الافتراضي) | كما سبق |
| `"always"` | أيضًا في حقول النص، قبل أن يرى الحقل المفتاح |
| `"notEditing"` | أبدًا أثناء تركيز حقل نص |

```rust tabs
use nsh_core::keymap::When;

// Sends from the message field too.
on_key_with("mod+enter", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| send());
// Only when the user is not typing.
on_key_with("mod+e", KeyOptions { when: When::NotEditing, ..KeyOptions::default() }, move |_| archive());
```

```tsx tabs
// Sends from the message field too.
keymap.bind("mod+enter", send, { when: "always" });
// Only when the user is not typing.
keymap.bind("mod+e", archive, { when: "notEditing" });
```

على iOS وAndroid، يبقى المفتاح الذي تؤلّف به طريقة الإدخال (اختيار مرشّح، تثبيت) من شأن طريقة الإدخال. وفي واجهة GPUI الخلفية، يُعدّ المكوّن الأصلي الذي يملك تركيز لوحة المفاتيح حقل نص، لأنه قد يكون محرّر نصوص. وهو يرى كل مفتاح أولًا: المفتاح الذي يعالجه بنفسه لا يصل إلى الارتباطات أبدًا، والارتباطات التي تعمل أثناء تحرير النص تتلقى المفاتيح التي يتركها له.

<a id="which-binding-runs"></a>

### أي ربط يُنفَّذ

المفتاح الذي يُطلق ربطًا يُستهلك: لا يُكتب، ولا يُصدر النظام صوت تنبيه، ولا ترى مفاتيحُ NSH نفسها هذا المفتاح (Escape للرجوع، وTab لنقل التركيز، والأسهم للتمرير). عندما تتشارك عدة ارتباطات ضغطة المفتاح نفسها، يعمل أحدثها مما يجوز له العمل، فيستطيع حوار ربط Escape فوق ربط الشاشة، ويعود ربط الشاشة عندما يزول ربط الحوار. تُفحص الارتباطات أصليًا لحظة الضغط على المفتاح؛ ويعمل المعالج بعد ذلك مباشرة، على خيط المحرك (Rust) أو خيط JS (TSX).

الضغط المطوّل على مفتاح يُطلق ربطه مرة واحدة، حتى يُترك المفتاح؛ ومع `repeat: true` يُطلقه من جديد عند كل تكرار تلقائي (للتنقل عبر قائمة مثلًا):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

تفسح اختصارات القوائم المجال لربط بضغطة المفتاح نفسها: قائمة التطبيق ([`nsh/desktop`](./nsh-desktop)) على كل أنظمة سطح المكتب، وعلى macOS القوائم المدمجة أيضًا (Cmd+W وCmd+C ...). أثناء التطوير باستخدام `nsh run`، يعيد Cmd+R / Ctrl+R تحميل التطبيق دائمًا، حتى لو ربط `mod+r`؛ أما التطبيق المعبّأ فيستطيع ربطه.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent و nativeModule

`nativeComponent` و`nativeModule` يصلان تطبيقك بما يوفره التطبيق المضيف، بالاسم، وقت التشغيل. يستطيع تطبيق iOS أو Android يضمّن NSH أن يسجّل عروضه الخاصة (خريطة، أو مخطط، أو معاينة كاميرا) بالاسم؛ و`nativeComponent` يعطيك مكوّنًا مضبوط الأنواع لأحدها. ولأن NSH يرسم بعروض أصلية حقيقية، يقع هذا المكوّن في تسلسل العروض مثل أي عرض آخر: يتولى NSH تخطيطه، ويُقتطع ويُمرَّر مع آبائه، ويتراكب بشكل صحيح. ويستطيع التطبيق الذي يضمّن NSH من Rust أيضًا تسجيل دوال وفئات ومكوّنات Rust؛ و`nativeModule` يعطيك إياها ككائن واحد مضبوط الأنواع. يُبنى تطبيقك بـ `nsh build` الاعتيادي في الحالتين: يربط المضيف ما يوفره عندما يشغّل التطبيق. تضع شيفرة Rust عرضًا مسجّلًا بـ `native(name)` من `nsh_core::prelude`، وتضبط خصائصه بـ `.prop(name, value)` (قيمة JSON، أو signal أو closure لها)، أو تربط إحداها بقيمة متحركة بـ `.bind_prop(name, &value)`، وتسمع أحداثه بـ `.on_native_event(…)`، وتستدعي أوامره عبر `ElementRef`؛ وتستورد TSX `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

راجع [المكوّنات الأصلية](../docs/native-components.md) لتسجيل الجانب الأصلي، و[التضمين على iOS](../docs/ios.md) / [التضمين على Android](../docs/android.md).

### nativeComponent

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;

interface NativeComponentSpec<P, E> {
  /** Its own props: sent to the component (any JSON value), each when it changes. */
  props: readonly (keyof P & string)[];
  /** The events it emits. */
  events?: readonly (keyof E & string)[];
}
```

يعيد مكوّنًا للمكوّن الأصلي الذي سجّله التطبيق المضيف باسم `name` (في Swift `NshAppView.register(component:)`، وفي Java `NshView.registerComponent`). في Rust: `native(name)`، وهو عرض خصائصه قيم JSON (`.prop("text", json!(…))`) وتصل أحداثه على هيئة `NativeEvent { name, data }`.

- `P` هو نوع خصائصه الخاصة. كل خاصية مدرجة في `spec.props` تُرسل إلى الجانب الأصلي بصيغة JSON عندما تتغير؛ وضبطها على `undefined` يزيلها.
- `E` يربط أسماء الأحداث بحمولاتها. الحدث `regionChange` يصبح خاصية المعالج `onRegionChange`.
- يقبل المكوّن أيضًا كل [خاصية عرض](../elements/view.md) عدا `children`: `style` و`class` والتخطيط وإمكانية الوصول ومعالجات اللمس و`ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### الحجم

يُخطَّط المكوّن كما يُخطَّط العرض، بالحجم الذي يعطيه له نمطه. وحيثما يترك النمط بُعدًا مفتوحًا، يستخدم الحجم الذي يبلغ عنه المكوّن الأصلي (كما تستخدم الصورة حجمها الطبيعي).

<a id="commands"></a>

#### الأوامر

يتلقى `ref` الخاص به `NativeComponentRef`؛ و`ref.command(name, args)` يستدعي الأمر `name` في المكوّن الأصلي مع `args` (أي قيمة JSON). في Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### عند عدم تسجيل شيء

حيثما لا يوجد شيء مسجّل تحت `name` (تطبيق مضيف مختلف، أو مضيف التطوير، أو المتصفح)، يرسم المكوّن عرضًا فارغًا ويُسجَّل تحذير مرة واحدة. أبقِ التطبيق قابلًا للاستخدام بدونه، أو تحقق من مضيفك قبل استخدامه.

<a id="example"></a>

### مثال

الشارة هنا عرض أصلي في التطبيق المضيف، مسجّل باسم `embed.badge`. يتولى NSH تخطيطها، ويرسل إليها `text` و`color`، ويتلقى أحداث `tap` منها، ويستدعي أمرها `pulse`:

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p_5()
        .gap_4()
        .child(
            native("embed.badge")
                .prop("text", json!("Tap the native badge"))
                .prop("color", json!("#8250df"))
                .element_ref(&badge)
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Tapped {}×", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, View } from "nsh";
import { nativeComponent } from "nsh";

const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", gap: 16 }}>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color="#8250df"
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
    </View>
  );
}

mount(App);
```
### nativeModule

```ts
function nativeModule<T extends object>(specifier: string): T;
```

تعيد exports المجموعة التي سجّلها التطبيق المضيف باسم `specifier`: وحداتها وفئاتها ودوالها ومكوّنات Rust، ككائن واحد. يكتب التطبيق النوع `T` بنفسه، فلا يلزم أي شيء عن المضيف عند بنائه. شيفرة Rust المبنية مع crate المضيف تستدعي هذه الدوال كما هي في Rust؛ أما `nativeModule` فهو الطريقة التي تصل بها TSX إليها.

```ts
import { nativeModule, signal } from "nsh";

interface TradingApi {
  quote(symbol: string): number;
  placeOrder(symbol: string, quantity: number, side: "Buy" | "Sell"): Promise<Order>;
  on(event: "change", listener: (desk: Desk) => void): () => void;
}

const { Trading } = nativeModule<{ Trading: TradingApi }>("host/trading");

const price = Trading.quote("AAPL");

const desk = signal<Desk | null>(null);
Trading.on("change", (d) => desk.set(d));
```

- تعمل الاستدعاءات كما تعمل عبر استيراد مجموعة: الدالة العادية في Rust تعيد قيمتها فورًا، والدالة `async` تعيد promise، والدالة التي تمرّرها تصبح callback يمكن لـ Rust استدعاؤها لاحقًا. يتحقق Rust من كل وسيط، ويرمي `TypeError` عند وجود وسيط خاطئ.
- كل استدعاء بالقيمة `specifier` نفسها يعيد الكائن نفسه.
- إذا لم يكن هناك شيء مسجّل تحت `specifier`، فإن `nativeModule` ترمي `ReferenceError` تذكر فيه الاسم. استدعها حيث يستطيع التطبيق التعامل مع ذلك، أو فقط في المضيف الذي صُنعت له.

يسجّل المضيف المجموعة من Rust، باستخدام `set_ui_sets` الخاصة بـ crate المنصّة (بجانب مجموعات NSH نفسها) قبل أن يبدأ عروضه، أو `EngineConfig::ui_sets`:

```rust
use std::{cell::RefCell, rc::Rc};

use nsh_core::prelude::*;

pub struct Trading;

#[module]
impl Trading {
    /// A sample price.
    pub fn quote(symbol: String) -> Result<f64, String> { /* ... */ }

    /// Calls `listener` with the desk now and after every change
    /// (`change`, the one event), until the returned function is called
    /// or what called `on` goes.
    pub fn on(event: String, listener: Callback<Desk>, cx: CallCx<'_>) -> Result<Stop, String> {
        if event != "change" {
            return Err(format!("no Trading event `{event}`"));
        }
        let listener = Rc::new(RefCell::new(Some(listener)));
        let held = listener.clone();
        cx.start(async move {
            let mut desk = DESK.subscribe(); // a tokio watch channel the host keeps
            loop {
                let Some(listener) = held.borrow().clone() else { return };
                listener.post(desk.borrow_and_update().clone());
                if desk.changed().await.is_err() {
                    return;
                }
            }
        });
        Ok(Stop::new(move || drop(listener.take())))
    }
}

let mut trading = Registry::ui_set("host/trading");
trading.module::<Trading>();
nsh_platform_gpui::set_ui_sets(vec![nsh_base::registry(), trading]);
```

`on` هي الطريقة التي يُبقي بها المضيف كل التطبيقات متزامنة مع بياناته: المهمة التي تبدأها تنتظر تغييرات المضيف وترسل كل تغيير إلى التطبيق، فيصل أي تغيير أجراه المضيف، أو أجراه أي تطبيق عبر دالة أخرى، إلى كل تطبيق يستمع. أما `Stop` الذي تعيده فهو الدالة التي تعيدها `Trading.on` في TSX: تعمل مرة واحدة، عندما يستدعيها التطبيق أو عندما يزول ما استدعى `on` (مكوّن، أو تشغيل الوحدة تحت hot reload)، وهنا تُسقط المستمع فتنتهي المهمة.

> [!NOTE]
> تنتقل props والأحداث ووسائط الأوامر إلى الجانب الأصلي (native) بصيغة JSON. المكوّنات والدوال المسجّلة هي شيفرة التطبيق المضيف نفسه: [حدود الـ sandbox وقدراته](../docs/sandbox-and-capabilities.md) في NSH لا تنطبق على ما تفعله.

<a id="accessibility"></a>

## إمكانية الوصول

تقرأ واجهة إمكانية الوصول (accessibility) إعدادات إمكانية الوصول لدى المستخدم (هل يعمل قارئ الشاشة، وهل طلب حركة أقل) وتتحدث إلى قارئ الشاشة. تستدعي شيفرة Rust كلًا من `screen_reader()` و`reduce_motion()` و`announce_for_accessibility()` من `nsh_core::prelude` وتنقل التركيز باستخدام `ElementRef`؛ وتستورد TSX كلًا من `screenReaderEnabled()` و`reduceMotion()` و`announce()` و`setAccessibilityFocus()` من `nsh`. الإعدادات تفاعلية (reactive): اقرأها في binding أو `computed` أو `effect`، فيتحدّث ما يقرؤها عندما يغيّرها المستخدم. أما props إمكانية الوصول الخاصة بالعناصر (`accessibilityLabel`، `role`، ...) فهي موثّقة ضمن [العناصر](../elements/index.md)؛ والدليل هو [إمكانية الوصول](../docs/accessibility.md).

```rust tabs
use nsh_core::prelude::*; // screen_reader, reduce_motion, announce_for_accessibility, element_ref
```

```tsx tabs
import { announce, reduceMotion, screenReaderEnabled, setAccessibilityFocus } from "nsh";
```

### screenReaderEnabled

```ts
const screenReaderEnabled: Accessor<boolean>;
```

هل يعمل قارئ الشاشة (VoiceOver، TalkBack). تفاعلية: يتحدّث ما يقرؤها عندما يشغّل المستخدم قارئ الشاشة أو يوقفه. في Rust: `screen_reader() -> bool`، وهي تفاعلية بالطريقة نفسها.

```rust tabs
when(move || !screen_reader(), || text("Swipe for the next photo"))
    .otherwise(move || text("Next photo").on_press(next))
```

```tsx tabs
<If when={!screenReaderEnabled()} else={<Text onPress={next}>Next photo</Text>}>
  <Text>Swipe for the next photo</Text>
</If>
```

### reduceMotion

```ts
const reduceMotion: Accessor<boolean>;
```

هل طلب المستخدم حركة أقل (Reduce Motion في iOS، وRemove animations في Android). تفاعلية. في Rust: `reduce_motion() -> bool`. وفئات Tailwind تتبعها أيضًا عبر المتغيّر `motion-reduce:`.

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        let _ = panel.spring(0.0, Spring::default());
    }
};
```

```tsx tabs
const open = () => {
  if (reduceMotion()) panel.set(0);
  else panel.spring(0);
};
```

### announce

```ts
function announce(message: string): void;
```

يقرأ قارئ الشاشة `message` (إعلان في VoiceOver، وفي TalkBack). استخدمها للنتائج التي تظهر دون أن ينتقل التركيز، مثل "Saved". في Rust: `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

ينقل تركيز قارئ الشاشة إلى `node` (`ref` الخاص بعنصر). في Rust: `ElementRef::set_accessibility_focus()`.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Saved() -> impl IntoElement {
    let note = element_ref();
    let save = move || {
        announce_for_accessibility("Saved");
        note.set_accessibility_focus();
    };
    // Runs again when the setting changes, until the component goes.
    effect(|| log::info!("screen reader {}", screen_reader()));
    view()
        .gap_2()
        .child(text("Save").role(AccessibilityRole::Button).on_press(save))
        .child(text("Your changes are kept on this device.").element_ref(&note))
}
```

```tsx tabs
import { effect, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Saved() {
  let note!: ViewRef;
  const save = () => {
    announce("Saved");
    setAccessibilityFocus(note);
  };
  // Runs again when the setting changes, until the component goes.
  effect(() => console.log("screen reader", screenReaderEnabled()));
  return (
    <View style={{ gap: 8 }}>
      <Text onPress={save} role="button">Save</Text>
      <Text ref={note}>Your changes are kept on this device.</Text>
    </View>
  );
}
```

<a id="types"></a>

## الأنواع

يصدّر `nsh` أيضًا أنواع واجهة reactive وأنواع عناصر المضيف. وهذه أكثرها استخدامًا:

| النوع | ما هو |
|---|---|
| `Accessor<T>` | قيمة قابلة للقراءة: `() => T` |
| `Signal<T>` | `Accessor<T>` مع `set` و`update` |
| `SignalOptions<T>` | خيارات `signal` و`computed` (`equals`) |
| `Context<T>` | ما تعيده `context` |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | فضاء أسماء JSX (`JSX.Element`) |
| `ViewRef`، `InputRef`، `ScrollRef`، `ListRef`، `WebViewRef`، `VideoRef`، `NativeComponentRef` | ما يستقبله `ref`، ونوع كل عنصر الخاص به (`ViewRef` والأنواع المبنية عليه): التركيز والتمرير وأوامر أخرى. و`ViewRef` هو أيضًا ما يمثّله العنصر (`JSX.Element`). راجع [دوال ref](../elements/index.md#ref-methods) |
| `ViewProps`، `TextProps`، `ImageProps`، `ScrollProps`، `CommonProps`، `TouchProps` | props عناصر المضيف |
| `ViewStyle`، `TextStyle`، `InputStyle`، `ImageStyle`، `LayoutStyle`، `StyleProp<T>` | كائنات الأنماط؛ راجع [مرجع الأنماط](./style-reference.md) |
| `ColorValue`، `DimensionValue`، `LengthValue`، `TransformStep` | القيم داخل الأنماط |
| `GestureResponderEvent`، `MouseEvent`، `MouseButton`، `ContextMenuEvent`، `PressEvent`، `ScrollEvent`، `PanEvent`، `TouchPoint` | حمولات الأحداث |
| `Point`، `Size`، `Bounds`، `Edges`، `Modifiers` | الأشكال التي تتكوّن منها الحمولات والـ props، مع حقول GPUI (`nsh_core::geometry`) |
| `PixelSize` | الحجم الخاص بالصورة أو الفيديو بالبكسل (`onLoad`، `Image.getSize`، وصور الحافظة والمنتقي)، حيث `Size` بالنقاط |
| `ImageAsset` | ما ينتج عن استيراد ملف صورة (`{ url, size: Size, scales? }`؛ وتسرد `scales` [متغيّرات كثافة البكسل](../docs/images-and-assets.md#pixel-densities) الخاصة بها) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`، `AccessibilityState` | props إمكانية الوصول |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

تقبل `StyleProp<T>` نمطًا واحدًا أو قائمة تُدمج من اليسار إلى اليمين، مع تخطي القيم الخاطئة (falsy):

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
