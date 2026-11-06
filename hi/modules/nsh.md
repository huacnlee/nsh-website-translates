---
title: "nsh"
description: "कोर मॉड्यूल: सिग्नल, इफ़ेक्ट, कॉन्टेक्स्ट, माउंट, डिज़ाइन टोकन, एनीमेशन, एनवायरमेंट, जेस्चर, क्लिपबोर्ड, स्टोरेज, होस्ट चैनल, कीबोर्ड शॉर्टकट, एक्सेसिबिलिटी, तथा एलिमेंट और स्टाइल टाइप।"
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` कोर मॉड्यूल है: reactive API (signals, computed values, effects, context), `mount`, `token`, host elements `View`, `Text`, `Scroll` और `Overlay`, [चुने जा सकने वाले व्यू](#selectable-views), [safe area और कीबोर्ड](#safe-area-and-keyboard), [animation](#animation), [डिवाइस और उसका परिवेश](#device), [`PanResponder`](#panresponder), [क्लिपबोर्ड](#clipboard), [फ़ोटो पिकर](#picker), [स्पीच रिकग्निशन](#speech), [स्टोरेज](#storage), [host channel](#host), [कीबोर्ड शॉर्टकट](#keymap), [नेटिव कंपोनेंट और मॉड्यूल](#nativecomponent-and-nativemodule), [एक्सेसिबिलिटी](#accessibility), और elements, styles और events के TypeScript टाइप। Reactive graph खुद नेटिव रूप से Rust में चलता है; किसी signal को पढ़ना runtime में एक कॉल है जिसकी लागत कुछ नैनोसेकंड है, और JavaScript interpreter में केवल आपके अपने closures चलते हैं।

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

NSH की reactivity SolidJS वाले मॉडल पर चलती है: कंपोनेंट फ़ंक्शन **एक बार** चलता है, और UI के जो हिस्से signals को पढ़ते हैं, वे signals बदलने पर अपनी जगह पर ही अपडेट हो जाते हैं। कंपोनेंट का कोई re-render नहीं होता और कोई virtual DOM नहीं है। गाइड के लिए [Reactivity](../docs/reactivity.md) देखें।

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

Signal एक मान रखता है। उसे कॉल करने पर मान पढ़ा जाता है और, tracking scope (JSX एक्सप्रेशन, `computed`, `effect`) के अंदर, वह scope उसका subscriber बन जाता है। `set` और `update` उसमें लिखते हैं; जिसने भी उसे पढ़ा था, वह अपडेट हो जाता है।

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

डिफ़ॉल्ट रूप से, वर्तमान मान के `===` किसी मान को लिखने से कुछ नहीं होता। हर लिखने पर सूचित करने के लिए `equals: false` दें (यह तब उपयोगी है जब आप किसी ऑब्जेक्ट को उसी जगह बदलकर वही ऑब्जेक्ट दोबारा सेट करते हैं), या अपनी तुलना दें:

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

Signals से निकला हुआ मान। जब `fn` द्वारा पढ़ा गया कोई signal बदलता है, तो वह फिर से चलता है; computed मान को पढ़ने वाले तभी अपडेट होते हैं जब उसका नतीजा बदलता है (`equals` से, जो डिफ़ॉल्ट रूप से `===` है)। `fn` को पिछला नतीजा मिलता है।

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

जब कोई derivation महंगी हो या कई जगह पढ़ी जाती हो, तब `computed` का उपयोग करें। सस्ते एक्सप्रेशन के लिए साधारण फ़ंक्शन (`const full = () => first() + " " + last()`) भी उतना ही reactive है।

## effect

```ts
function effect(fn: () => void): void;
```

`fn` को रेंडरिंग के बाद चलाता है, और जब भी उसका पढ़ा हुआ कोई signal बदलता है तब फिर से चलाता है। Effects का उपयोग side effects के लिए करें: लॉगिंग, टाइमर, नेटिव मॉड्यूल से बात करना। Effect उस कंपोनेंट (या effect) का होता है जिसमें वह बनाया गया था और उसी के साथ dispose हो जाता है।

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Effect के दोबारा चलने से पहले (या उसके कंपोनेंट के हट जाने पर) कुछ पूर्ववत करने के लिए, उसके अंदर [`cleanup`](#cleanup) को कॉल करें।

## batch

```ts
function batch<T>(fn: () => T): T;
```

`fn` को चलाता है और उसकी सभी writes को अंत में एक साथ लागू करता है, ताकि पढ़ने वाले हर write पर अलग से नहीं, बल्कि केवल एक बार अपडेट हों। `fn` जो लौटाता है, वही यह लौटाता है।

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

`fn` को इस तरह चलाता है कि वर्तमान scope उसके पढ़े हुए का subscriber न बने। किसी effect या JSX एक्सप्रेशन के अंदर किसी signal को उस पर निर्भर हुए बिना पढ़ने के लिए इसका उपयोग करें।

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

`fn` को पंजीकृत करता है ताकि वह वर्तमान effect के दोबारा चलने से पहले, या वर्तमान कंपोनेंट या effect के हट जाने पर चले।

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

ऐसा मान जो कोई कंपोनेंट अपने रेंडर किए हर चीज़ को देता है, चाहे वह कितनी भी गहराई पर हो। Context को कॉल करने (`Theme()`) पर निकटतम provider का मान पढ़ा जाता है, और provider न होने पर `defaultValue` मिलता है।

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

`app` को surface में रेंडर करता है (विंडो, या वह `NshAppView` / `NshView` जिसमें ऐप एम्बेड है) और उसे हटाने वाला फ़ंक्शन लौटाता है। हर ऐप की एंट्री फ़ाइल `mount(App)` पर खत्म होती है।

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

Props ऑब्जेक्ट को दो हिस्सों में बांटता है: `keys` में नामित props और बाकी। दोनों हिस्से reactive रहते हैं: जिन props के मान बदलते हैं वे getters होते हैं, और `split` उन्हें getters ही रखता है। इसका उपयोग ऐसे कंपोनेंट में करें जो कुछ props खुद संभालता है और बाकी आगे भेज देता है। Props को destructure करने (`const { label } = props`) से वे एक बार पढ़े जाएंगे और अपडेट खो जाएंगे।

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

अपने children को रेंडर करता है, या जैसे ही उनके नीचे कुछ throw करता है, तब `fallback` को: कंपोनेंट की body, कोई binding, कोई effect या कोई event handler। जो हिस्सा विफल हुआ उसे हटा दिया जाता है और उसकी जगह fallback दिखता है। फ़ंक्शन `fallback` को `fallback(error, reset)` के रूप में throw किए गए मान और `reset` के साथ कॉल किया जाता है, जो children को फिर से रेंडर करता है, चाहे वह कोई भी पैरामीटर घोषित करे; `fallback` element को जैसा है वैसा दिखाया जाता है। विफलता अपने ऊपर के निकटतम boundary के पास जाती है, और fallback में हुई विफलता उससे ऊपर वाले boundary के पास। Rust कंपोनेंट `catch_error` का उपयोग करते हैं ([Error boundaries](../docs/reactivity.md#error-boundaries))।

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

ऐप की थीम का डिज़ाइन token `name` (`"theme"`, `nsh.json` में, shadcn/ui के tokens के ऊपर) दिखाए जा रहे appearance में:
रंग `#rrggbbaa` के रूप में, लंबाई points की संख्या के रूप में, फ़ॉन्ट अपने family नाम के रूप में। नाम थीम के CSS variables होते हैं,
`--` के बिना (`primary`, `muted-foreground`, `radius`, `font-mono`, और ऐप के अपने, जैसे `up`)। इसे पढ़ना
reactive है: token पढ़ने वाला कंपोनेंट, memo या effect थीम या appearance बदलने पर फिर से चलता है।
`Tokens` ऐप के tokens को उनके प्रकारों के साथ सूचीबद्ध करता है; NSH इसे थीम से `.nsh/types/nsh/tokens.d.ts` में लिखता है।
क्लासों के लिए tokens को सीधे नाम दें (`bg-primary`, `rounded-(--radius)`): [Theme tokens](../docs/tailwind.md#theme-tokens)।

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

वे host elements जिन्हें `nsh` export करता है, टैग के रूप में लिखे जाते हैं: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (इसके
children विंडो के ऊपर, किसी anchor के सापेक्ष रखे जाते हैं: [Overlay](../elements/overlay.md))। जो टैग अपने import (alias भी) के ज़रिए इनमें से किसी का नाम लेता है, उसके लिए कंपाइलर
नेटिव व्यू उसी जगह बना देता है, इसलिए इन्हें import करने की रन टाइम पर
कोई लागत नहीं है। ये किसी भी अन्य कंपोनेंट की तरह कंपोनेंट हैं, इसलिए इन्हें इधर-उधर पास भी किया जा सकता है (`const Tag = inline ? Text : View`)।
`nsh` अन्य primitives को इसी तरह export करता है: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) और [`Video`](./nsh-video.md), हर एक का अपना रेफ़रेंस
पेज है। उनके props [Elements](../elements/index.md) के अंतर्गत प्रलेखित हैं। टेक्स्ट इनपुट, `Input`,
[`nsh/base`](./nsh-base.md#input) से आता है।

<a id="safe-area-and-keyboard"></a>

## Safe area और कीबोर्ड

CSS के environment variables किसी भी व्यू के padding और margin में कंटेंट को सिस्टम UI से दूर रखते हैं
(`padding`, `paddingTop`, ..., वही `margin` keys; Tailwind के `p*` / `m*` arbitrary values; Rust में `Styled` methods
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ...)। इनके मान `EnvValue` होते हैं:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` और `calc(<length> + env(name))`।

| Variable | मान |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | उस root view के insets जिसमें नोड रेंडर होता है: निकटतम पेज का (उसके हेडर के नीचे), निकटतम डायलॉग का, या नहीं तो surface का safe area। [Safe area](../elements/safe-area.md) देखें। |
| `keyboard-inset-height` | surface के ऊपर सॉफ़्टवेयर कीबोर्ड की ऊंचाई, छिपे होने पर 0; बदलाव कीबोर्ड के साथ नेटिव रूप से animate होते हैं। [Keyboard](../elements/keyboard.md) देखें। |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea और safeAreaInsets

`safeArea()` surface का safe area है (Rust में `safe_area()`); `safeAreaInsets()` वे insets हैं जहां कंपोनेंट
रेंडर होता है (Rust में `cx.insets()`), यानी `safe-area-inset-*` variables के मान। दोनों reactive `Edges` हैं
(`{ top, right, bottom, left }` points में)। देखें
[safeArea और safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets)।

<a id="keyboard-and-keyboardframe"></a>

### Keyboard और keyboardFrame

`Keyboard.dismiss()` सॉफ़्टवेयर कीबोर्ड को छिपाता है (Rust में `dismiss_keyboard()`) और `keyboardFrame()` बताता है कि वह
स्क्रीन का कितना हिस्सा ढकता है (Rust में `keyboard_height()` और `keyboard_duration()`)। देखें
[कीबोर्ड छिपाना](../elements/keyboard.md#hiding-the-keyboard) और
[कीबोर्ड की ऊंचाई](../elements/keyboard.md#the-keyboards-height)।

<a id="selectable-views"></a>

## चुने जा सकने वाले व्यू

`<View selectable>` (Rust में `view().selectable(true)`) अपने अंदर के टेक्स्ट को एक साथ चुनने योग्य बनाता है, जैसा किसी वेब पेज में होता है:
एक ही selection व्यू, `Text` elements और `TextView` के पार, पढ़ने के क्रम में चलता है। देखें
[Text selection](../elements/text-selection.md)।

## Animation

Animation API UI थ्रेड पर animate करता है। आप एक **animated value** बनाते हैं, उसे (या उससे निकले मानों को) किसी style property से bind करते हैं, और एक animation शुरू करते हैं; उसके बाद हर फ़्रेम नेटिव रूप से गणना किया जाता है, ऐप का कोड चलाए बिना। व्यस्त इंजन या JS थ्रेड animation को अटकने नहीं दे सकता, और animation में ऐप को प्रति फ़्रेम कोई काम नहीं करना पड़ता। Rust कोड `nsh_core::prelude` से `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` और `Easing` का उपयोग करता है और elements के `.bind_*` methods से मान bind करता है; TSX इन्हें `nsh` से import करता है।

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

गाइड के लिए [Animation](../docs/animation.md) देखें।

<a id="what-an-animated-value-can-drive"></a>

### Animated value क्या चला सकती है

| कहां | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | वही: रंगों का एक node। `borderColor` हर side को रंगता है; `Text` का `color` पूरे टेक्स्ट को रंगता है |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (डिग्री में) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` steps: `transform: [{ translateX: value }]` |
| Scroll position | scroll view या list पर `.scroll_value(&value)` | `<Scroll scrollValue={value}>` और `<List scrollValue={value}>` हर फ़्रेम में scroll offset को उसमें लिखते हैं |
| Gestures | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | किसी भी element पर `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}`: gesture मानों को सीधे लिखता है ([Touch and gestures](../docs/touch-and-gestures.md) देखें) |
| व्यू कहां चिपकते हैं | `.sticky().bind_sticky_top(&value)` (horizontal scroll view में `.bind_sticky_left`), list पर `.bind_sticky_header_offset(&value)` | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: sticky व्यू और हेडर viewport की शुरुआत से उतनी दूरी पर चिपकते हैं, और हर फ़्रेम में मान का अनुसरण करते हैं |
| Canvas | painter की कॉल का कोई animated argument | [canvas](./nsh-canvas.md) की drawing call का कोई भी number या color argument |
| Shader | `.uniform(name, &value)` | [shader](../elements/shader.md) के `struct Uniforms` का एक सदस्य: `uniforms={{ name: value }}` (numbers, या `vec3f` / `vec4f` के लिए रंगों का एक node) |

अन्य style properties साधारण मान लेती हैं; layout को ही animate करने के लिए (आकार, flow में स्थितियां), [`LayoutAnimation`](#layoutanimation) का उपयोग करें।

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

`value` (डिफ़ॉल्ट `0`) से शुरू होने वाली animated value बनाता है। Rust: `animated_value(value)`, एक `Copy` handle जो उसे बनाने वाले कंपोनेंट के पास रहता है।

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
> Animated value UI थ्रेड पर रहती है और वहां हर फ़्रेम बदलती है, इसलिए ऐप उसे asynchronously पढ़ता है: `await value.getValue()` (या वह `{ value }` जिससे `stop()` resolve होता है) उस क्षण का मान देता है, और Rust में किसी task में `value.value().await`। जब आपके कोड को target तुरंत चाहिए हो, तो उसे किसी वेरिएबल या signal में रखें, जैसा ऊपर किया गया है। Gesture events अपने अंत पर मान बताते हैं (`PanEvent.value`)।

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

| Method | Rust | विवरण |
|---|---|---|
| `set(value)` | `set(value)` | `value` पर कूद जाता है, चल रही किसी भी animation को रोककर। |
| `stop()` | `stop()`, फिर `value().await` | चल रही animation को जहां है वहीं रोक देता है; `{ value }` के साथ resolve होता है, यानी वहां का मान। |
| `getValue()` | `value().await` | वर्तमान मान के साथ resolve होता है (उसके offset सहित), जिसे UI थ्रेड पर पढ़ा गया हो। |
| `setOffset(offset)` | `set_offset(offset)` | मान में जुड़ने वाला offset: bindings को value + offset दिखता है; `set`, animations और drags मान को हिलाते हैं। |
| `flattenOffset()` | `flatten_offset()` | Offset को मान में जोड़ देता है और उसे 0 कर देता है। |
| `extractOffset()` | `extract_offset()` | मान को offset में ले जाता है और मान को 0 कर देता है (इसके बाद drag वहीं से शुरू होता है जहां पिछला खत्म हुआ था)। |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | `to` तक easing curve के साथ animate करता है। `duration` ms में (डिफ़ॉल्ट 300), `easing` (डिफ़ॉल्ट `"easeInOut"`), `delay` ms में (डिफ़ॉल्ट 0)। |
| `spring(to, options)` | `spring(to, Spring { … })` | `to` तक spring करता है। `stiffness` (डिफ़ॉल्ट 170), `damping` (डिफ़ॉल्ट 26), `mass` (डिफ़ॉल्ट 1), `velocity` (प्रारंभिक वेग, units प्रति सेकंड)। |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | `velocity` (units प्रति सेकंड) से चलता है और प्रति मिलीसेकंड `deceleration` के हिसाब से धीमा होता है (डिफ़ॉल्ट 0.998)। इसे fling के बाद, `onPanEnd` से मिले वेग के साथ उपयोग करें। `clamp: [min, max]` के साथ यह किसी सीमा पर रुक जाता है, या उससे अपनी गति का `bounce` (0..1, डिफ़ॉल्ट 0) हिस्सा रखकर वापस उछलता है। |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | [keyframes](#keyframes) को वैसे चलाता है जैसे CSS keyframes चलते हैं: हर segment के लिए एक easing, `direction` में `iterations` times। |

हर animation method एक promise लौटाता है जो `{ finished }` के साथ resolve होता है: animation के पूरा होने पर `true`, उसके रुकने पर `false` (`stop`, `set` या उसी मान की किसी दूसरी animation द्वारा)। Rust में यह एक `AnimationEnd` लौटाता है, जिसे कोई task उसी `bool` के लिए await करता है।

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

नेटिव animation graph का एक node: एक `AnimatedValue`, या दूसरों से निकला हुआ मान। Derived nodes का मूल्यांकन UI थ्रेड पर तब होता है जब भी उनके inputs बदलते हैं।

| Method | Rust | विवरण |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Input को piecewise ranges के ज़रिए map करता है। `outputRange` में numbers, रंग (`"#ff0000"`, `"rgba(…)"`) या कोण (`"45deg"`, `"1rad"`) होते हैं। `inputRange` के बाहर यह डिफ़ॉल्ट रूप से clamp करता है; `extrapolate` (या `extrapolateLeft` / `extrapolateRight`) `"extend"` (रेखा को जारी रखना), `"clamp"` या `"identity"` (input को ज्यों का त्यों पास करना) हो सकता है। `easing` हर segment को आकार देता है। Rust `bind_rotate` के लिए numbers, थीम रंग (जो appearance का अनुसरण करते हैं) और डिग्री में कोण लेता है। |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Input के बदलावों का अनुसरण करता है पर नतीजे को `min..max` के भीतर रखता है: ऐसा हेडर जो कंटेंट के ऊपर scroll होने पर छिपता है और नीचे scroll होते ही लौट आता है। `snap: true` इसे तब 200 ms में नज़दीकी सीमा पर स्थिर करता है जब उसका scroll view रुक जाता है, `max` पर केवल तब जब input `max` तक पहुंच चुका हो। |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | किसी दूसरे node या constant के साथ अंकगणित। |
| `mod(b)` | `modulo(b)` | Modulo, धनात्मक `b` के लिए कभी ऋणात्मक नहीं (कोणों को 0..360 में रखते हुए)। |

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

`value.keyframes(frames, options)` किसी value को keyframes के माध्यम से चलाता है और `{ finished }` के साथ resolve होता है, जो बताता है कि वे पूरे हुए या नहीं; `Animated.keyframes(value, { keyframes, ...options })` composite के एक step के समान है। Rust: `value.keyframes(frames, KeyframeTiming)` और `Animation::keyframes(&value, frames, KeyframeTiming)`, `Keyframe::new(value)` (समान रूप से फैला हुआ), `Keyframe::at(offset, value)` और `.ease(easing)` के साथ, तथा `KeyframeTiming::new(ms)`, `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` और `.direction(PlaybackDirection::…)` के साथ।

ये वैसे ही चलते हैं जैसे CSS keyframes चलते हैं: एक easing एक segment को आकार देती है (keyframe की easing उस segment पर लागू होती है जो उसी से शुरू होता है, timing की easing बाकी सभी पर); keyframes में जिनके offset नहीं दिए गए, वे समान रूप से फैलते हैं, पहला 0 पर और आख़िरी 1 पर; हर iteration अपने पहले keyframe पर छलांग लगाकर शुरू होता है, और 0 पर keyframe न होने पर value वहीं से चलती है जहाँ वह है; `delay` के दौरान value पहले keyframe पर टिकी रहती है (CSS `animation-fill-mode: backwards`); backward iterations segments को उनके curves उलटकर पीछे की ओर चलाते हैं; value वहीं रहती है जहाँ आख़िरी iteration उसे छोड़ता है।

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

एक motion बनाता है: view की opacity और transform के हर channel के लिए एक animated value, जो rest अवस्था में होती है (opacity और scales 1, बाकी 0), और उन पर natively चलने वाले motions। इसे `style={motion.style}` से bind करें, या `motion.style` अथवा `motion.transform` को style में spread करें; transform पहले अपने translations लागू करता है, फिर rotations, फिर scales, जिसमें `scale` को `scaleX` और `scaleY` में मिला दिया जाता है: view के 8 transform steps में से 7, जिससे आपके लिए एक बचता है (3D flips के लिए `[{ perspective: 600 }, ...motion.transform]`)। `initial` तय करता है कि channels कहाँ से शुरू हों (`{ opacity: 0 }`; बाकी rest से शुरू होते हैं)। `enter` के साथ, जिन channels को वह चलाता है वे वहीं से शुरू होते हैं जहाँ वह motion शुरू होता है (`initial` पर) और वह तुरंत चलने लगता है, बाकी options उसकी timing होते हैं (`delay`, `duration`, ...)। एक motion केवल opacity और transform को चलाता है: `motion.style` को spread करने से view की `opacity` सेट हो जाती है, इसलिए अपनी opacity रखने के लिए केवल `motion.transform` को bind करें, और रंगों को animated value और `interpolate` से चलाएँ। Rust: `motion()`, एक `Copy` handle जिसे उसे बनाने वाला component अपने पास रखता है, और जिसे `.bind_motion(&m)` से bind किया जाता है; `motion().entering(spec)` enter करता है।

| Member | Rust (`Motion`) | विवरण |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | Channels की animated values। |
| `style`, `transform` | element पर `.bind_motion(&m)` | Bindings। |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | channels पर नाम से कोई preset या [`MotionSpec`](#motions) चलाता है; नया motion पहले से चल रहे motion को बीच में रोक देता है। `options` उसकी timing बदलते हैं। `{ finished }` के साथ resolve होता है: पूरा होने पर `true`, किसी चीज़ के रोक देने पर `false` (Rust में `AnimationEnd`)। |
| `animation(motion, options?)` | `animation(spec)` | वही motion [`CompositeAnimation`](#animated) के रूप में, शुरू किए बिना, compose करने के लिए: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`)। Reduced motion उसके बनते समय तय होता है। |
| `stop()` | `stop()` | इसे जहाँ है वहीं रोक देता है। |
| `reset()` | `reset()` | इसे रोकता है और हर channel को वापस rest पर रख देता है। |

जब user कम motion माँगता है (`reduceMotion()`), तो `play`, `animation` और `enter` बिना चले तुरंत वहीं पहुँच जाते हैं जहाँ motion खत्म होता है, जब तक `ignoreReduceMotion` सेट न हो (options पर या motion पर)।

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

तैयार motions data के रूप में: `motion.play("shake")` `motions.shake` को चलाता है। `MotionName` इनमें से एक है: `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (enter); `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (exit); `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (attention); `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (loop)। [Animation](../docs/animation.md#presets) हर एक का वर्णन करता है। किसी preset को बदलने के लिए उसे spread करें: `motion.play({ ...motions.fadeInUp, duration: 600 })`।

`MotionSpec` आपका अपना motion है: हर channel के keyframes (`{ opacity: [0, 1], translateY: [24, 0] }`), या frames की एक सूची जैसी Web Animations API में लिखी जाती है (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, बिना offset वाला frame सूची में अपनी स्थिति के अनुसार रखा जाता है), साथ में [keyframe timing](#keyframes)। Rust: `MotionSpec::new(KeyframeTiming)`, `.values(channel, values)` (समान रूप से फैला हुआ), `.track(channel, keyframes)` और `.timing(|t| …)` के साथ; `MotionPreset::FadeInUp` (या `.spec()`) एक preset है, और `MotionChannel` channels के नाम बताता है।

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

`Animated` steps (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...) से animations बनाता है। `start()` तक कुछ नहीं चलता; उसके बाद पूरा tree natively चलता है, और हर step UI thread पर ठीक उसी क्षण शुरू होता है जब पिछला खत्म होता है (कोई frame gap नहीं, steps के बीच app के code तक कोई round trip नहीं)। Rust वही tree `Animation` से बनाता है।

| Function | Rust | विवरण |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | एक value की एक animation; [`AnimatedValue`](#animatedvalue) methods जैसे ही options और defaults, जिनमें target `toValue` के रूप में दिया जाता है। |
| `sequence(list)` | `Animation::sequence(list)` | animations को एक के बाद एक चलाता है। |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | उन्हें एक साथ चलाता है। `stopTogether` के साथ (default `true`), एक को रोकने से सभी रुक जाते हैं। |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | उन्हें parallel में चलाता है, हर एक पिछले के `ms` बाद शुरू होता है, जिसकी गिनती `from` से होती है: `"first"` (default), `"last"`, `"center"` (बीच वाला तुरंत शुरू होता है, बाकी उससे फैलते हैं; सम संख्या होने पर दोनों बीच वाले तुरंत शुरू होते हैं) या एक index (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`)। |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [keyframes](#keyframes) के माध्यम से एक value। |
| `delay(ms)` | `Animation::delay(ms)` | प्रतीक्षा करता है; `sequence` के अंदर उपयोगी। |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | `animation` को `iterations` बार दोहराता है (default रूप से हमेशा), और हर run से पहले उसकी values को वापस रख देता है, जब तक `resetBeforeIteration` का मान `false` न हो। |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | node methods | [`AnimatedNode`](#animatednode) methods जैसे ही, functions के रूप में। |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | spring या decay की values, प्रति frame एक ([Easing](#easing) देखें)। |

`CompositeAnimation`:

| Method | Rust (`Animation`) | विवरण |
|---|---|---|
| `start(callback?)` | `start()`, await करने के लिए एक `AnimationEnd` | इसे (फिर से) चलाता है। पूरे tree के लिए एक बार resolve होता है, और `callback` को `{ finished }` के साथ call करता है: यानी वह पूरा हुआ, रोका नहीं गया। |
| `stop()` | `stop()` | इसे जहाँ है वहीं रोक देता है। |
| `reset()` | `reset()` | इसे रोकता है और इसकी values को वहीं वापस रख देता है जहाँ वे शुरू होते समय थीं। |

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

Easing data है, app का function नहीं: runtime इसे natively evaluate करता है। Rust में यह enum `Easing` है: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` और `Curve(curve, mode)`, साथ में एक `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) और एक `EaseMode` (`In`, `Out`, `InOut`)। किसी को draw करने के लिए, `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) 0 से 1 तक `count` समान दूरी वाले बिंदुओं पर उसकी values देता है; `Animated.sampleSpring` और `Animated.sampleDecay` (`sample_spring`, `sample_decay`) spring या decay की values प्रति frame एक देते हैं (`fps` पर, default 60) `from` (0) से उसके खत्म होने तक। तीनों उसी native code से आते हैं जिस पर animations चलती हैं। TSX में जहाँ भी `Easing` स्वीकार किया जाता है, आप एक नाम (`"easeOut"`), चार संख्याओं के रूप में एक cubic Bézier, या `Easing` object से एक curve दे सकते हैं।

| Curve | Rust | आकार |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` का default 2 है) |
| `sin` | `Curve::Sin` | Sinusoidal |
| `circle` | `Curve::Circle` | Circular |
| `exp` | `Curve::Exp` | Exponential |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Springy overshoot (`bounciness` का default 1 है) |
| `back(s)` | `Curve::Back(s)` | जाने से पहले पीछे खिंचता है; `s` overshoot है (default 1.70158) |
| `bounce` | `Curve::Bounce` | अंत में उछलता है |

`Easing.steps(count, position)` CSS `steps()` है: value चलने के बजाय `count` स्तरों के बीच छलांग लगाती है (frame-by-frame sprite, टिक-टिक करती सुई)। `position` बताता है कि छलांगें कहाँ पड़ती हैं: `"jump-end"` (default, साथ ही `"end"`), `"jump-start"` (`"start"`), `"jump-none"` या `"jump-both"`; Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`।

Curves अपने "in" रूप में हैं (शुरू में धीमे)। `Easing.out(curve)` एक को उलट देता है, `Easing.inOut(curve)` उसे सममित बनाता है, `Easing.in(curve)` उसे जैसा है वैसा रखता है; Rust में यह `Easing::Curve` का `EaseMode` है।

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

`LayoutAnimation.configureNext(config)` अगले commit के layout बदलावों को natively animate करता है: जो views खिसकते या आकार बदलते हैं वे अपने नए frames तक सरकते हैं, नए views दिखाई देते हैं (`property` के अनुसार fade या scale होकर) और हटाए गए views गायब हो जाते हैं। इसे उस state change से ठीक पहले call करें जो layout बदलता है। Rust: `animate_layout(LayoutAnimation)`, `nsh_core::element::LayoutAnimation` के presets या उसके `create`, `update` और `delete` transitions के साथ।

| Member | Rust | विवरण |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | अगले commit के बदलावों को animate करता है; पूरा होने पर `onEnd` चलता है। |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | एक config जो तीनों phases के लिए एक ही curve उपयोग करती है। |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, views fade in और out होते हैं। |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms, स्थिर गति से। |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms; frames spring करते हैं (damping 0.4), views linearly fade होते हैं। |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | `configureNext(Presets.…)` के shorthands। |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | नाम, constants के रूप में। |

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

Device API app को device और उसके परिवेश के बारे में बताता है। Rust code `nsh_core::prelude` के functions (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...) call करता है; TSX उन्हें `nsh` से import करता है। Window size, color scheme, font scale, pixel ratio, locale और app state reactive हैं: उन्हें binding (Rust में element को दिया गया closure, TSX में JSX), `computed` या `effect` में पढ़ें, और जो उन्हें पढ़ता है वह तब update हो जाता है जब platform बदलाव की सूचना देता है (rotation, window resize, dark mode में स्विच करना, text size या भाषा बदलना, किसी दूसरी density वाली screen पर जाना, app छोड़कर वापस आना)।

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

गाइड के लिए [Device and environment](../docs/device-and-environment.md) देखें।

### windowSize

```ts
const windowSize: Accessor<Size>;
```

Surface का आकार points में: window, या embedded `NshAppView` / `NshView`। Reactive। Rust: `window() -> Size<Points>`।

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

दिखाई जा रही appearance: system की, जब तक app ने अपनी सेट न की हो (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme))। Reactive। Rust: `dark() -> bool`; theme colors (`AdaptiveColor`) और `.dark(…)` style variant इसे पढ़े बिना ही इसका अनुसरण करते हैं। Tailwind का `dark:` variant भी इसका अनुसरण करता है ([Tailwind](../docs/tailwind.md) देखें)।

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

User का पसंदीदा text size, default की तुलना में (`1` default size है; iOS पर Dynamic Type, Android पर font size), या उसके स्थान पर वह text size जो embedding app सेट करता है। Reactive। Rust: `font_scale() -> f32`। Text पहले से इसके साथ scale होता है, जब तक `allowFontScaling={false}` न हो; जब दूसरे sizes को भी इसके अनुसार चलना चाहिए, जैसे text के बगल के icons, तब इसे पढ़ें।

### locale

```ts
const locale: Accessor<string>;
```

User का locale BCP 47 tag के रूप में (`"en-US"`, `"zh-Hans-CN"`), या उसके स्थान पर वह locale जो embedding app सेट करता है। Reactive। Rust: `locale() -> Locale` (`locale().as_str()` tag है)। `Intl` default रूप से उसी के अनुसार format करता है; अपने अनुवादों की strings चुनने के लिए इसे पढ़ें ([Device and environment](../docs/device-and-environment.md#language-and-region))।

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

क्या app उपयोग में है, React Native के `AppState` की शर्तों में: `"active"` foreground में और input ले रहा है, `"inactive"` दिखाई देते हुए लेकिन focus के बिना (कोई दूसरा app या window उसके पास है, या system उसके ऊपर कुछ दिखाता है, जैसे app switcher या आती हुई call), `"background"` जब दिखाई नहीं दे रहा (background में, minimized, छिपा हुआ browser tab)। किसी native app के अंदर दिखाया गया app उस app की स्थिति का अनुसरण करता है। Reactive। Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`)।

जिस काम को कोई नहीं देख रहा उसे रोकने और app के लौटने पर दोबारा शुरू करने के लिए इसे effect में पढ़ें:

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

System की appearance चाहे जो हो, app को तुरंत `scheme` में दिखाता है: `colorScheme()`, `dark:` classes, components का theme और platform के controls (alerts, status bar की default style) इसका अनुसरण करते हैं; `"system"` फिर से system का अनुसरण करता है। `nsh.json` `"appearance"` इसे शुरू से सेट करता है। Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`)।
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

वह प्लेटफ़ॉर्म जिस पर ऐप चलता है; ऐप के चलने के दौरान यह स्थिर रहता है।

| सदस्य | Rust | विवरण |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` TS स्ट्रिंग है) | ऑपरेटिंग सिस्टम। iOS, iOS सिम्युलेटर और Mac Catalyst `"ios"` बताते हैं, ब्राउज़र `"web"` बताते हैं। |
| `version` | `os_version() -> (u16, u16)` | iOS और डेस्कटॉप: OS संस्करण (`"17.5"`); Android: API स्तर (`"35"`); वेब: `"0.0"`। Rust मेजर और माइनर संस्करण देता है, या Android पर API स्तर और 0 देता है। |
| `idiom` | `idiom() -> Idiom` | डिवाइस का प्रकार: `"desktop"` ठीक वहीं जहाँ `desktop` का मान `true` है; अन्यत्र `"phone"`, `"pad"` (iPad, Android टैबलेट, iPad idiom में Mac Catalyst), `"mac"` (UIKit के Mac idiom में Mac Catalyst, एक मोबाइल idiom) या `"tv"` (Apple TV, Android TV)। |
| `desktop` | `is_desktop() -> bool` | डेस्कटॉप व्यवहार लागू होता है: macOS, Windows, Linux, और माउस तथा चौड़ी विंडो वाले ब्राउज़र। `desktop={{…}}` props, `select({ desktop })` और `idiom` `"desktop"` सभी इसी का अनुसरण करते हैं। Mac Catalyst iOS बैकएंड चलाता है, इसलिए वह मोबाइल है: वहाँ `ios={{…}}` props लागू होते हैं। [`nsh/desktop`](./nsh-desktop.md#isavailable) का `isAvailable` उसके विंडो और मेनू API के लिए अधिक संकीर्ण जाँच है, जो macOS, Windows और Linux में होते हैं। |
| `catalyst` | `is_catalyst() -> bool` | ऐप Mac Catalyst के अंतर्गत चल रहा है, Mac या iPad idiom में (`os` का मान `"ios"` है)। |
| `select(spec)` | `match os() { … }` | इस प्लेटफ़ॉर्म के लिए मान (नीचे देखें)। |

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

वर्तमान OS (`ios`, `android`, `web`, ...) के लिए मान लौटाता है, अन्यथा `desktop` या `mobile` (`platform.desktop` के अनुसार), अन्यथा `native` (वेब को छोड़कर हर प्लेटफ़ॉर्म), अन्यथा `default`, अन्यथा `undefined`। Rust कोड `os()` पर match करता है (और `mobile` / `desktop` के लिए `is_desktop()` पर)।

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
> जिन props के लिए केवल एक प्लेटफ़ॉर्म होता है, उनके लिए `platform` पर शाखा बनाने के बजाय TSX elements और components के `ios={{…}}` / `android={{…}}` props को प्राथमिकता दें ([Platform-specific code](../docs/platform-specific.md) देखें)।

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

प्रति पॉइंट डिवाइस पिक्सेल (जैसे अधिकांश iPhone पर `3`)। यह रिएक्टिव है: जब विंडो किसी अन्य घनत्व वाली स्क्रीन पर जाती है (Mac Catalyst, डेस्कटॉप या बाहरी डिस्प्ले पर), और जब Android की डिस्प्ले साइज़ सेटिंग घनत्व बदलती है, तब यह बदलता है। Rust: `pixel_ratio() -> f32`, और पूरे डिवाइस पिक्सेल वाली लंबाई के लिए `round_to_nearest_pixel(points)`; TSX में वह लंबाई `Math.round(x * pixelRatio()) / pixelRatio()` है।

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

`url` को ऐप के बाहर खोलता है: वेब पेज ब्राउज़र में, `mailto:` लिंक मेल ऐप में, `tel:` लिंक फ़ोन ऐप में, और कोई भी स्कीम जिसे किसी अन्य ऐप ने रजिस्टर किया हो (`maps:`, होस्ट ऐप के अपने `lb://` लिंक)। यह `{ opened }` के साथ resolve होता है, यानी कुछ ने उसे खोला या नहीं: जब कोई ऐप उस स्कीम को नहीं संभालता तो `false`। Rust: `nsh_core::prelude` का `open_url(url)`, एक उत्तर जिसे किसी task में await किया जाता है (या drop कर दिया जाता है), वही `bool`।

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

- URL निरपेक्ष (absolute) होता है (उसमें स्कीम होती है)। जो URL कोड चलाएँगे या ऐप के अपने डेटा तक पहुँचेंगे, यानी `javascript:`, `data:`, `blob:`, `file:`, `about:` और `asset:`, वे promise को `TypeError` के साथ reject करते हैं, जैसे सापेक्ष (relative) पते करते हैं। `openUrl` कभी throw नहीं करता: हर विफलता reject होती है।
- जो ऐप capabilities घोषित करता है उसे `openUrl` चाहिए: हर स्कीम के लिए `"openUrl": true`, या सूचीबद्ध स्कीमों के लिए `"openUrl": { "schemes": ["https", "mailto"] }`; अन्य URL `Error` के साथ reject होते हैं जिसका `code` `"ERR_ACCESS_DENIED"` है, `permission` `"openUrl"` है और `resource` URL है ([Sandbox and capabilities](../docs/sandbox-and-capabilities.md) देखें)। Rust में `open_url` उनके लिए `false` लौटाता है और कारण लॉग करता है।
- एम्बेड करने वाला ऐप URL को पहले देखता है और उसे अपने राउटर से भेज सकता है (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; [iOS](../docs/ios.md#links-the-app-opens) और [Android](../docs/android.md#links-the-app-opens) देखें)। तब `opened` का मान `true` होता है।
- हर प्लेटफ़ॉर्म इसे अपने opener से खोलता है: iOS पर `UIApplication.open` (एम्बेड होने पर होस्ट ऐप का application), Android पर `ACTION_VIEW` intent, macOS पर `NSWorkspace`, Windows पर `ShellExecuteW`, Linux पर `GtkUriLauncher`, GPUI का `open_url`, वेब पर नया टैब। `nsh test` URL को खोलने के बजाय रिकॉर्ड करता है।
- [`TextView`](../elements/text-view.md) अपने लिंक इसी तरह `links="open"` से खोलता है।

<a id="layout-direction"></a>

### लेआउट दिशा

लेआउट की दिशा उपयोगकर्ता की भाषा का अनुसरण करती है: दाएँ-से-बाएँ लिखी जाने वाली भाषा (अरबी, हिब्रू, ...) में ऐप दाएँ से बाएँ लेआउट होता है, पंक्तियाँ दाईं ओर से चलती हैं, और `left` / `right` स्टाइल प्रॉपर्टीज़ (`marginLeft`, `paddingRight`, ...) का अर्थ start और end होता है। बदलाव तुरंत लागू होते हैं, पुनः आरंभ की आवश्यकता नहीं।

किसी view की `direction` स्टाइल (`"ltr"`, `"rtl"` या `"inherit"`, जो डिफ़ॉल्ट है) उसके अपने subtree की दिशा तय करती है; Rust में, `.direction(LayoutDirection::..)`।

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

### संबंधित

- Safe area insets (Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`) और सॉफ़्टवेयर कीबोर्ड (Rust `keyboard_height()`; TSX `keyboardFrame()`) [Safe area and keyboard](#safe-area-and-keyboard) में हैं।
- स्क्रीन रीडर और reduced motion सेटिंग्स [Accessibility](#accessibility) में हैं।

## PanResponder

Pan responders जेस्चर रिस्पॉन्डर सिस्टम के ऊपर बने ड्रैग जेस्चर हैं: element किसी जेस्चर के touches को claim करता है, फिर उन्हें अकेले सुनता है, साथ में जेस्चर state भी मिलती है, जो touches का centroid, तय की गई दूरी और velocity आपके लिए ट्रैक करती है। Rust कोड उन्हें `.claim_touches(TouchClaim::…)` से claim करता है और `.on_responder_*` listeners से सुनता है, जिनका `ResponderEvent` एक `PanGesture` लिए होता है, सब `nsh_core::prelude` में; TSX `nsh` से `PanResponder` import करता है, जिसके `onPanResponder…` callbacks को touch event और जेस्चर state मिलती है।

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Pan responder हर move को ऐप के कोड तक पहुँचाता है, इसलिए यह उन जेस्चर के लिए उपयुक्त है जो ऐप state बदलते हैं (reordering, swipe-to-delete के निर्णय)। उँगली से किसी view को हिलाने के लिए नेटिव जेस्चर वैल्यूज़ अधिक तेज़ हैं: Rust में `.pan_values(x, y)`, `.pinch_value(scale)` और `.rotation_value(angle)`, TSX में `pan={{ x, y }}`, `pinch` और `rotation` props। ड्रैग [animated values](#animation) को UI थ्रेड पर लिखता है और ऐप को केवल तब पता चलता है जब वह शुरू और समाप्त होता है (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`)। [Touch and gestures](../docs/touch-and-gestures.md) देखें।

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

एक pan responder बनाता है। इसके `panHandlers` को उस view पर spread करें जिसे जेस्चर मिलना चाहिए। Rust में, view touches को claim करता है और खुद सुनता है:

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

### कॉलबैक

हर callback को touch event (`GestureResponderEvent`, [`nsh`](#types) से) और जेस्चर state मिलती है। Rust में, claim `.ask(|request: &ClaimRequest| …)` से निर्णय लेता है, touches लेने के लिए `request.claim()` को बुलाता है (`ask` के बिना वह उन्हें हमेशा लेता है), और हर listener को एक `ResponderEvent` मिलता है जिसका `gesture` state है।

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Callback | Rust | लौटाता है | कब बुलाया जाता है |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | कोई उँगली नीचे जाती है: responder बनने के लिए `true` लौटाएँ। छुए गए view से बाहर की ओर पूछा जाता है। |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | वही, पर bubbling वाले से पहले बाहर से अंदर की ओर पूछा जाता है (parent अपने children से जेस्चर ले लेता है)। |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | कोई उँगली हिलती है: responder बनने के लिए `true` लौटाएँ (जैसे केवल `Math.abs(g.dx) > 10` के बाद)। |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | वही, capture चरण में। |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | यह view अब responder है: जेस्चर शुरू होता है। |
| `onPanResponderReject` | `.on_responder_reject(…)` | | कोई अन्य view responder है और छोड़ने को तैयार नहीं। |
| `onPanResponderStart` | `.on_responder_start(…)` | | responding के दौरान कोई उँगली नीचे गई। |
| `onPanResponderMove` | `.on_responder_move(…)` | | उँगलियाँ हिलीं। |
| `onPanResponderEnd` | `.on_responder_end(…)` | | responding के दौरान कोई उँगली उठी। |
| `onPanResponderRelease` | `.on_responder_release(…)` | | आखिरी उँगली उठी: जेस्चर समाप्त हुआ। |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | किसी अन्य view (या किसी नेटिव जेस्चर, जैसे scroll view) ने touches ले लिए। |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` उन्हें रखता है | `boolean` | कोई अन्य view touches चाहता है: उन्हें रखने के लिए `false` लौटाएँ (डिफ़ॉल्ट `true`)। |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | responding के दौरान नेटिव scroll views को touches लेने से रोका जाए या नहीं (डिफ़ॉल्ट `true`)। |

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

Rust: `PanGesture`, जिसमें points `Point<Points>` के रूप में हैं।

| फ़ील्ड | Rust | विवरण |
|---|---|---|
| `stateID` |  | जेस्चर की पहचान करता है। |
| `moveX`, `moveY` | `position` | touches के centroid की नवीनतम स्थिति, surface points में। |
| `x0`, `y0` | `origin` | responder दिए जाने के समय centroid कहाँ था। |
| `dx`, `dy` | `delta` | grant के बाद से तय की गई दूरी। |
| `vx`, `vy` | `vx`, `vy` | velocity, points प्रति सेकंड में। |
| `numberActiveTouches` | `active_touches` | नीचे मौजूद उँगलियाँ। |

<a id="inside-scroll-views"></a>

### स्क्रॉल व्यू के अंदर

जब तक कोई pan responder responder है, उसके आसपास के नेटिव scroll views स्क्रॉल नहीं करते (`onShouldBlockNativeResponder` का डिफ़ॉल्ट `true` है)। क्षैतिज swipe को ऊर्ध्वाधर स्क्रॉलिंग के साथ चलने देने के लिए, केवल क्षैतिज moves पर responder बनें:

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

उस pan के लिए जिसे प्लेटफ़ॉर्म पहचानता है, `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` उँगलियों के हिलने के साथ main thread पर निर्णय लेता है। अंतर्निहित responder props (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) को किसी भी element पर सीधे भी इस्तेमाल किया जा सकता है; [Elements](../elements/index.md) देखें।

## Clipboard

Clipboard API सिस्टम क्लिपबोर्ड को पढ़ता और लिखता है: हर जगह टेक्स्ट (iOS पर `UIPasteboard`, Android पर `ClipboardManager`, डेस्कटॉप पर `NSPasteboard`, GDK और Win32 क्लिपबोर्ड, वेब पर `navigator.clipboard`), iOS, डेस्कटॉप और वेब पर इमेज, और डेस्कटॉप तथा Mac Catalyst पर फ़ाइल मैनेजर में कॉपी की गई फ़ाइलें। Rust कोड `nsh_core::prelude` के फ़ंक्शन (`set_clipboard`, `clipboard_string`, ...) बुलाता है; TSX `nsh` से `Clipboard` import करता है।

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

Rust के read फ़ंक्शन ऐसे उत्तर लौटाते हैं जिन्हें task में await किया जाता है (`spawn`, या `async` मॉड्यूल का फ़ंक्शन); `ClipboardImage` `nsh_core::element::ClipboardImage` है, जिसमें `url` और `size` (एक `Size<DevicePixels>`) हैं।

इमेज iOS, डेस्कटॉप और वेब पर क्लिपबोर्ड से होकर जाती हैं। Android पर क्लिपबोर्ड टेक्स्ट ले जाता है: `writeImage` और
`readImage` `Error` के साथ reject होते हैं जिसका `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` है, और `hasImage` `false` के साथ resolve होता है। Rust में, `set_clipboard_image` क्लिपबोर्ड को वैसा ही छोड़ देता है जैसा वह वहाँ है और `clipboard_image` `None` लौटाता है।

उपयोगकर्ता किसी [selectable text](../elements/text.md) से खुद भी कॉपी कर सकता है; Clipboard API कोड से कॉपी करने के लिए है, जैसे Copy बटन।

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

`text` को क्लिपबोर्ड पर रखता है, जो वहाँ था उसे बदल देता है। Rust: `set_clipboard(text)`।

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

क्लिपबोर्ड के टेक्स्ट के साथ resolve होता है, या जब उसमें कोई टेक्स्ट न हो तो `""` के साथ। Rust: `clipboard_string()`। iOS पर, क्लिपबोर्ड पढ़ने से सिस्टम का paste notice ("App pasted from …") दिख सकता है, और Android 10 और बाद के संस्करणों पर केवल foreground वाला ऐप ही इसे पढ़ सकता है। इसे तब पढ़ें जब उपयोगकर्ता paste करने को कहे, हर स्क्रीन पर नहीं।

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

इसे पढ़े बिना, resolve होता है इस जानकारी के साथ कि क्लिपबोर्ड में टेक्स्ट है या नहीं: iOS पर कोई paste notice नहीं। Rust: `clipboard_has_string()`। इसका उपयोग यह तय करने के लिए करें कि Paste बटन दिखाना है या नहीं। वेब पर, ब्राउज़र केवल पढ़कर ही बताते हैं, इसलिए यह उपयोगकर्ता से अनुमति माँग सकता है।

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

क्लिपबोर्ड की इमेज के साथ resolve होता है, या जब उसमें कोई इमेज न हो तो `null` के साथ: चिपकाया गया स्क्रीनशॉट, या ब्राउज़र
या इमेज एडिटर में कॉपी की गई इमेज। Rust: `clipboard_image()`, जब उसमें कोई इमेज न हो तो `None`। `url` इमेज का URL है (PNG, या
क्लिपबोर्ड का अपना JPEG, GIF, WebP या BMP) जिसे एक [`Image`](../elements/image.md) अपने `src` के रूप में दिखाता है और `fetch` पढ़ता है:
`fetch(url)` इसके bytes देता है, अपलोड के लिए। `size` (`width` और `height`) डिकोड के अनुसार पिक्सेल में इसका आकार है। `readText` की तरह,
इसे तब पढ़ें जब उपयोगकर्ता paste करने को कहे। 48 MB (encoded) तक की इमेज पढ़ी जाती हैं, ताकि इमेज ऐप की
मेमोरी में समा सके; इससे बड़ी इमेज `Error` के साथ reject होती है जिसका `code` `"ERR_NSH_QUOTA_EXCEEDED"` है (उसका संदेश
इमेज का आकार और सीमा बताता है), जबकि `hasImage` `true` के साथ resolve होता है। Rust: `clipboard_image()` इसके लिए `None` लौटाता है।

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

चैट-शैली का ऐप, जहाँ उपयोगकर्ता composer में स्क्रीनशॉट paste करते हैं, अपने input के focus में रहते हुए paste शॉर्टकट को bind करता है
और इमेज होने पर उसे ले लेता है:

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

इसे पढ़े बिना, resolve होता है इस जानकारी के साथ कि क्लिपबोर्ड में इमेज है या नहीं: iOS पर कोई paste notice नहीं। Rust:
`clipboard_has_image()`। Android पर यह `false` के साथ resolve होता है।

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

`src` की इमेज, यानी base64 `data:` URL या वह जो `url` `readImage` ने दी, क्लिपबोर्ड पर रखता है, और जो उसमें था उसे बदल देता है।
Rust: `set_clipboard_image(src)`। Windows पर यह PNG लेता है, वह फ़ॉर्मेट जिसे ब्राउज़र, Office और Snipping Tool पढ़ते हैं। Android पर
यह `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` के साथ reject होता है।

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

फ़ाइल मैनेजर (Finder, Explorer, Files) में कॉपी की गई फ़ाइलों और फ़ोल्डरों के `file:` URLs के साथ, उनके
क्रम में, resolve होता है, या `[]` के साथ: वही URLs जो [file drop](../elements/view.md#desktop-file-drops) देता है। Rust: `clipboard_files()`।
उसका path पाने के लिए URL को parse करें।

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
> जब आपका ऐप `nsh.json` में `capabilities` घोषित करता है, तो क्लिपबोर्ड को `"clipboard": true` से grant करना होगा। इसके बिना `Clipboard` का हर फ़ंक्शन `Error` के साथ reject होता है जिसका `code` `"ERR_ACCESS_DENIED"` है, `permission` `"clipboard"` है और `resource` `""` है, और कुछ भी सिस्टम क्लिपबोर्ड तक नहीं पहुँचता। Rust में, writes क्लिपबोर्ड को वैसा ही छोड़ देते हैं और reads वही उत्तर देते हैं जो खाली क्लिपबोर्ड देता है (`""`, `None`, खाली सूची, `false`), और इनकार लॉग किया जाता है। [Sandbox and capabilities](../docs/sandbox-and-capabilities.md) देखें।
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

Picker API सिस्टम का फ़ोटो picker दिखाता है और उपयोगकर्ता की चुनी हुई इमेज ऐप को देता है: iOS पर Photos picker (`PHPickerViewController`), Android पर Photo Picker, डेस्कटॉप पर open panel या file dialog और ब्राउज़र में file input। iOS और Android पर picker ऐप के बाहर चलता है और ऐप को सिर्फ़ वही देता है जो उपयोगकर्ता चुनता है, इसलिए इसे फ़ोटो लाइब्रेरी की अनुमति की ज़रूरत नहीं होती। चुनी गई हर इमेज `File` (TSX) या `PickedFile` (Rust) के रूप में आती है, जिसके bytes नेटिव ही रहते हैं: इसे [`Image`](../elements/image.md) में `URL.createObjectURL(file)` से दिखाएँ, और `fetch` तथा `FormData` से अपलोड करें। Rust कोड `nsh_core::prelude` का `pick_images` कॉल करता है; TSX `nsh` से `Picker` इम्पोर्ट करता है।

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
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 का मतलब अधिकतम 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

यह picker दिखाता है और उपयोगकर्ता की चुनी हुई इमेज, चुनने के क्रम में, लेकर resolve होता है; उपयोगकर्ता के रद्द करने पर यह `[]` के साथ resolve होता है। Rust में: `pick_images(request)`, जो ऐसा उत्तर है जिसका task में await किया जाता है (`spawn`, या `async` मॉड्यूल फ़ंक्शन)। `pickImages` कभी throw नहीं करता: सीमा से बाहर के options (`limit: 0`, यानी 0 से 1 के बाहर का `quality`) promise को `RangeError` के साथ reject करते हैं, और ऐसा pick जिसकी अनुमति ऐप की capabilities नहीं देतीं, `ERR_ACCESS_DENIED` (नीचे देखें) के साथ reject होता है। रद्द करना उपयोगकर्ता का उत्तर है, विफलता नहीं: यह `[]` के साथ resolve होता है।

इमेज भेजने के लिए तैयार मिलती हैं:

- **ऐसे फ़ॉर्मेट जो हर ब्राउज़र और सर्वर समझता है।** JPEG, PNG, GIF और WebP जैसी हैं वैसी ही आती हैं; किसी और फ़ॉर्मेट (iPhone पर HEIC, HEIF, TIFF) में सहेजी गई फ़ोटो JPEG बनकर आती है। `format: "current"` सहेजा हुआ फ़ॉर्मेट ही रखता है।
- **नेटिव रूप से छोटी की गई।** `maxDimension` देने पर, जिस इमेज की लंबी भुजा उससे बड़ी हो, उसे उस सीमा में फ़िट होने तक छोटा किया जाता है, सीधी (upright) करके, और दोबारा encode किया जाता है: PNG को PNG के रूप में, बाकी सबको `quality` वाले JPEG के रूप में। फ़ोन की फ़ोटो 12 से 48 मेगापिक्सल की होती हैं; अपलोड से पहले उन्हें 2048 पिक्सल तक छोटा करने पर वे कुछ सौ किलोबाइट की रह जाती हैं। `quality` भी JPEG को दोबारा encode करता है।
- **जैसी दिखती है।** `size` इमेज का पिक्सल में आकार है, जैसी वह दिखती है, यानी कैमरे का orientation लागू होने के बाद। जिस इमेज को NSH दोबारा encode करता है उसमें कोई metadata (जैसे लोकेशन) नहीं रहता; जो इमेज जैसी है वैसी आती है, उसका अपना metadata बना रहता है।

Windows, Linux और GPUI विंडो में डायलॉग वे फ़ॉर्मेट दिखाता है जो अनुरोध स्वीकार करता है (`"compatible"` के साथ: JPEG, PNG, GIF और WebP), और फ़ाइलें वैसी ही आती हैं जैसी सहेजी गई हैं, अपने मूल आकार में।

एक चैट composer फ़ोटो जोड़ता है, संदेश लिखे जाने के दौरान उसे दिखाता है, और संदेश भेजे जाने पर उसे अपलोड करता है:

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

एक साथ कई फ़ोटो:

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

### एम्बेड करने वाले ऐप

जो ऐप NSH को एम्बेड करता है और जिसका अपना picker है (जैसे ऐप के अपने एल्बम वाला), वह picks का उत्तर खुद देता है: Rust में, इंजन को दिया गया `PickerBackend` (`nsh_core::picker`) (`EngineConfig::picker`, या GPUI और GPUI Kit ऐप में `AppView::set_picker`) हर pick का `PickRequest` पाता है और फ़ाइलें लौटाता है, और सिस्टम का picker नहीं दिखाया जाता। वह जो फ़ाइलें लौटाता है उन्हें वैसे ही पूरा किया जाता है जैसे प्लेटफ़ॉर्म की फ़ाइलों को: अनुरोध की सीमा तक काटा जाता है, और उनका आकार, प्रकार और एक्सटेंशन उनके bytes से पढ़े जाते हैं।

<a id="tests"></a>

### टेस्ट

`nsh test` headless रन में picks का उत्तर देता है: `app.onPick(handler)` वे फ़ाइलें लौटाता है जो उपयोगकर्ता चुनता है (`{ name, type, data }`), और handler न होने पर pick रद्द हो जाता है। देखें [टेस्टिंग](../docs/testing-and-trace.md)।

> [!NOTE]
> जब आपका ऐप `nsh.json` में `capabilities` घोषित करता है, तब picker को `"picker": true` से अनुमति देनी होगी। इसके बिना `pickImages` कुछ नहीं दिखाता और `Error` के साथ reject होता है, जिसका `code` `"ERR_ACCESS_DENIED"` है, `permission` `"picker"` और `resource` `""`। Rust में `pick_images` कोई फ़ाइल नहीं देता और इनकार को लॉग किया जाता है। देखें [Sandbox और capabilities](../docs/sandbox-and-capabilities.md)।

## Speech

Speech API उपयोगकर्ता की बोली को टेक्स्ट में बदलता है (dictation): ऐप एक सेशन शुरू करता है, प्लेटफ़ॉर्म माइक्रोफ़ोन सुनता है, और transcript बढ़ते हुए आता है। macOS और iOS सिस्टम के Speech framework से पहचान करते हैं; सिस्टम उपयोगकर्ता से माइक्रोफ़ोन और speech recognition की अनुमति एक बार माँगता है। अन्य प्लेटफ़ॉर्म पर सेशन तुरंत `"unavailable"` त्रुटि के साथ खत्म हो जाता है, इसलिए माइक्रोफ़ोन बटन दिखाने से पहले `Speech.available()` जाँचें। Rust कोड `nsh_core::prelude` का `recognize_speech` कॉल करता है; TSX `nsh` से `Speech` इम्पोर्ट करता है।

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
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (इसे drop करने पर सेशन abort हो जाता है) |

### Speech.start

सेशन शुरू करता है और उसे तुरंत लौटा देता है। सेशन इसी क्रम में रिपोर्ट करता है: `start` जब माइक्रोफ़ोन चालू हो और recognizer सुन रहा हो, `result` हर बार जब transcript बदलता है (`text` हमेशा अब तक का पूरा transcript होता है, इसलिए ऐप उसे जैसा है वैसा दिखा सकता है), और एक `end`, जिसके बाद कुछ नहीं आता। `stop()` सुनना बंद कर देता है और recognizer को जो उसने सुना उसे पूरा करने देता है: `isFinal: true` के साथ एक आखिरी परिणाम, फिर `end`। `abort()` सेशन को तुरंत, बिना त्रुटि के, खत्म कर देता है और जो रिपोर्ट नहीं हुआ उसे छोड़ देता है। एक समय में एक ही सेशन चलता है: दूसरा शुरू करने पर चल रहा सेशन abort हो जाता है।

`end` में आखिरी transcript होता है और, सेशन विफल होने पर, `error` होता है, जिनके नाम Web Speech API की तरह हैं:

| `error` | कब |
|---|---|
| `"not-allowed"` | उपयोगकर्ता या सिस्टम माइक्रोफ़ोन या speech recognition की अनुमति नहीं देता। |
| `"no-speech"` | कुछ बोला नहीं गया। |
| `"audio-capture"` | माइक्रोफ़ोन का उपयोग नहीं हो सका। |
| `"network"` | Recognizer को नेटवर्क चाहिए और वह उस तक नहीं पहुँच सका। |
| `"language-not-supported"` | Recognizer `lang` को नहीं जानता। |
| `"unavailable"` | यह प्लेटफ़ॉर्म कोई speech नहीं पहचानता, या अभी नहीं पहचानता। |
| `"failed"` | Recognizer किसी और कारण से विफल हुआ। |

गलत प्रकार के options पर `start` `TypeError` throw करता है, और ऐसे `lang` पर `RangeError` throw करता है जो भाषा टैग नहीं है।

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

जहाँ सेशन चल सकता है वहाँ `true` के साथ resolve होता है: macOS और iOS पर, और जहाँ भी एम्बेड करने वाला ऐप speech खुद पहचानता है।

### Info.plist

macOS और iOS पर सिस्टम दिखाता है कि ऐप को माइक्रोफ़ोन और speech recognition क्यों चाहिए। जब ऐप speech का उपयोग कर सकता है (उसका `capabilities` grant `speech` हो, या वह कोई grant घोषित न करे), तब `nsh package` और `nsh run` ऐप की Info.plist में `NSMicrophoneUsageDescription` और `NSSpeechRecognitionUsageDescription` लिख देते हैं।

<a id="embedding-apps-1"></a>

### एम्बेड करने वाले ऐप

जो ऐप NSH को एम्बेड करता है और speech को अपने तरीके से पहचानता है (अपने इंजन या सेवा से), वह सेशन का उत्तर खुद देता है: Rust में, इंजन (`EngineConfig::speech`) को दिया गया `SpeechBackend` (`nsh_core::speech`) हर सेशन का `SpeechRequest` और एक `SpeechSink` पाता है, जिसे वह किसी भी थ्रेड से रिपोर्ट करता है, और वह `SpeechControl` लौटाता है जिससे कोर सेशन को रोकता और abort करता है। तब प्लेटफ़ॉर्म का recognizer उपयोग नहीं होता।

<a id="tests-1"></a>

### टेस्ट

`nsh test` headless रन में सेशन को नकली recognizer पर चलाता है: सेशन तुरंत शुरू होता है, `app.hear(text)` अब तक के transcript के रूप में `text` रिपोर्ट करता है, `app.endSpeech(error?)` उसे खत्म करता है, और `app.speechRequests()` ऐप द्वारा शुरू किए गए सेशन की सूची देता है। देखें [टेस्टिंग](../docs/testing-and-trace.md)।

> [!NOTE]
> जब आपका ऐप `nsh.json` में `capabilities` घोषित करता है, तब speech को `"speech": true` से अनुमति देनी होगी। इसके बिना `Speech.start` `Error` throw करता है, जिसका `code` `"ERR_ACCESS_DENIED"` है, `permission` `"speech"` और `resource` `""`। Rust में सेशन `not-allowed` के साथ खत्म होता है और इनकार को लॉग किया जाता है। देखें [Sandbox और capabilities](../docs/sandbox-and-capabilities.md)।

## Storage

Storage API ऐप का डेटा डिवाइस पर रखता है: स्ट्रिंग, स्ट्रिंग key से, जो ऐप के अगली बार शुरू होने पर भी मौजूद रहती हैं। इसका उपयोग सेटिंग, ड्राफ़्ट, उपयोगकर्ता का आखिरी खुला टैब, सर्वर से आए डेटा का cache — यानी ऐसी किसी भी state के लिए करें जो ऐप की प्रोसेस के बाद भी बची रहनी चाहिए। Rust कोड `nsh_core::storage::Storage` का उपयोग करता है, TSX `nsh` से `Storage` इम्पोर्ट करता है; दोनों एक ही entries पढ़ते और लिखते हैं, इसलिए Rust entry और TSX entry वाले ऐप को डेटा का एक ही सेट दिखता है।

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

Rust फ़ंक्शन synchronous हैं, क्योंकि entries मेमोरी में रहती हैं: उन्हें वहीं कॉल करें जहाँ कंपोनेंट चलते हैं (उनकी bodies, handlers और tasks में)।

हर ऐप का अपना storage होता है, keys और values मिलाकर अधिकतम 5 MB का। कॉल उसी क्रम में चलते हैं जिसमें ऐप उन्हें करता है, इसलिए `setItem` के बाद `getItem` लिखे जाने का इंतज़ार किए बिना नया मान देखता है। पढ़ना मेमोरी से होता है; लिखना बैकग्राउंड में, कुछ-कुछ करके, डिस्क तक पहुँचता है।

| प्लेटफ़ॉर्म | डेटा कहाँ रखा जाता है |
|---|---|
| iOS | ऐप के container में `Library/Application Support/nsh/<app id>/storage.json` |
| Android | ऐप की निजी डायरेक्टरी में `files/nsh/<app id>/storage.json` |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | ब्राउज़र का `localStorage`, ऐप id के नाम पर रखी गई keys के अंतर्गत (`nsh:com.example.todo:…`) |

जो `storage.json` खराब हो जाती है उसे उसके बगल में `storage.json.corrupt` के रूप में रख लिया जाता है और ऐप खाली storage के साथ शुरू होता है; जो फ़ाइल पढ़ी नहीं जा सकती, उसके मामले में ऐप के बदलाव मेमोरी में ही रहते हैं, इसलिए फ़ाइल कभी बदली नहीं जाती।

ऐप id `nsh.json` में `id` है, और यह ऐप के साथ चलती है: `nsh build` और `nsh package` इसे bundle के बगल में लिखते हैं, dev server इसे भेजता है, और signed पैकेज में वही id होती है जिसकी पुष्टि उसकी release key का certificate करता है। इसलिए हर ऐप, जहाँ भी चले, बिना किसी सेटिंग के अपना डेटा अलग रखता है; जिस ऐप की id नहीं है वह अपना डेटा `default` के अंतर्गत रखता है। एम्बेड करने वाला ऐप कोई दूसरी जगह चुन सकता है (देखें [iOS पर एम्बेड करना](../docs/ios.md) और [Android पर एम्बेड करना](../docs/android.md))।

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

`key` के मान के साथ resolve होता है, या मान न होने पर `null` के साथ। Rust में: `Storage::get_item(key)`, मान न होने पर `None`।

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

`key` को `value` पर सेट करता है, जो पहले था उसे बदलकर। जब storage 5 MB से आगे बढ़ने वाला हो तब यह `Error` के साथ reject होता है, जिसका `code` `"ERR_NSH_QUOTA_EXCEEDED"` है; तब मान नहीं रखा जाता। Rust में: `Storage::set_item(key, value)`, जो तब `Err(StorageFull)` लौटाता है। मान स्ट्रिंग होते हैं: संरचित डेटा को JSON के रूप में रखें (Rust में `serde_json::to_string`, TSX में `JSON.stringify`) और वापस पढ़ें (`serde_json::from_str`, `JSON.parse`)।

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

`key` और उसका मान हटा देता है। जिस key का कोई मान नहीं है उसे हटाने पर कुछ नहीं होता। Rust में: `Storage::remove_item(key)`।

### Storage.keys

```ts
keys(): Promise<string[]>;
```

हर key के साथ, क्रम में, resolve होता है। Rust में: `Storage::get_all_keys()`।

### Storage.clear

```ts
clear(): Promise<void>;
```

ऐप की हर key हटा देता है, जैसे जब उपयोगकर्ता साइन आउट करता है। Rust में: `Storage::clear()`।

<a id="keeping-a-signal-on-the-device"></a>

### Signal को डिवाइस पर रखना

ऐप शुरू होने पर संग्रहीत मान पढ़ें, फिर signal बदलने पर उसे वापस लिखें:

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

`host` उस ऐप तक पहुँचता है जो NSH को एम्बेड करता है: `NshAppView` / `NshView` के आसपास का नेटिव ऐप, या वेब पर वह पेज जो player चलाता है। ऐप host के फ़ंक्शन को नाम से JSON arguments के साथ कॉल करता है और host द्वारा भेजे गए events सुनता है।

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

क्या प्लेटफ़ॉर्म के पास ऐसा host है जो कॉल का उत्तर देता है। वेब पर यह `true` होता है जब पेज player को host देता है ([वेब पर host](#the-host-on-the-web))।

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

host के फ़ंक्शन `name` को `args` (कोई भी JSON मान; बिना मान के `null`) के साथ कॉल करता है और जो वह लौटाता है उसके साथ resolve होता है। `host.call` कभी throw नहीं करता: हर विफलता promise को reject करती है, `Error` के साथ जिसका `code` बताता है कि क्या हुआ (संदेश लोगों के लिए है और बदल सकता है):

| `code` | कब |
|---|---|
| `ERR_NSH_HOST_ERROR` | host का फ़ंक्शन विफल हुआ, या host में `name` नाम का कोई फ़ंक्शन नहीं है; संदेश host का है |
| `ERR_ACCESS_DENIED` | `name` ऐप की [`host` capability](#capability) में नहीं है; `permission` `"host"` है, `resource` नाम है |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | प्लेटफ़ॉर्म में कोई host नहीं है: `host.available()` `false` है |
| `ETIMEDOUT` | host ने समय पर उत्तर नहीं दिया |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 कॉल पहले से एम्बेड करने वाले ऐप के उत्तरों की प्रतीक्षा कर रहे हैं |

जो नाम मान्य नहीं है (`A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-` में से 1 से 128 वर्ण, `..` के बिना) वह `TypeError` के साथ reject होता है।

कॉल host के उत्तर के लिए 30 सेकंड प्रतीक्षा करता है, फिर `ETIMEDOUT` के साथ reject होता है; बाद में आने वाला उत्तर छोड़ दिया जाता है। `options.timeout` प्रतीक्षा को मिलीसेकंड में तय करता है, `0` का मतलब कोई सीमा नहीं; इतना बड़ा timeout कि घड़ी वहाँ कभी पहुँचे ही नहीं (लगभग 1e22 ms) भी बिना सीमा के प्रतीक्षा करता है, और ऋणात्मक, `NaN` या अनंत मान कॉल को `RangeError` के साथ reject करता है। समय ऐप का है, उसके timers की तरह: मैनुअल घड़ी वाले `nsh test` में यह घड़ी के साथ चलता है।

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

Platform events, host द्वारा भेजे गए हर `event` के payload के साथ `listener` को कॉल करते हैं, तब तक जब तक `host.on` द्वारा लौटाया गया फ़ंक्शन कॉल न किया जाए; रेंडर के दौरान जोड़ा गया listener कंपोनेंट के साथ बंद हो जाता है। ऐप शुरू होने से पहले host जो events भेजता है वे ऐप शुरू होने पर पहुँचते हैं, इसलिए ऐप के top level पर रजिस्टर किए गए listeners उन्हें पाते हैं; listener रजिस्टर होने से पहले भेजा गया event उसे दोबारा नहीं भेजा जाता। ऐप जिस state से शुरू होता है उसे `host.call` से पढ़ें, और उसके बदलावों को `host.on` से फ़ॉलो करें।

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### क्षमता (Capability)

ऐप जो भी फ़ंक्शन कॉल करता है, उसे `nsh.json` के `capabilities.host` में सूचीबद्ध होना चाहिए: सटीक नाम, या `*` पर समाप्त होने वाले प्रीफ़िक्स, या सभी के लिए `true`। यह हर ऐप पर लागू होता है, उस ऐप पर भी जिसमें कोई अन्य `capabilities` न हो: होस्ट के फ़ंक्शन डिफ़ॉल्ट रूप से कभी नहीं दिए जाते। जिस कॉल को अनुमति नहीं दी गई, वह `ERR_ACCESS_DENIED` के साथ अस्वीकार हो जाती है और लॉग की जाती है, एम्बेड करने वाले ऐप को ऐसे नाम का `host.post` वही त्रुटि फेंकता है, और `capabilities.host` के बिना `nsh` से `host` इम्पोर्ट करने वाले ऐप को बिल्ड करने पर चेतावनी मिलती है। इवेंट के लिए किसी अनुमति की ज़रूरत नहीं होती। देखें [Sandbox और capabilities](../docs/sandbox-and-capabilities.md#host)।

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### वेब पर होस्ट

वेब पर पेज ही होस्ट है। `createPlayer` का `host` विकल्प कॉल का जवाब देता है, और `player.hostEvent(event, payload)` इवेंट भेजता है:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

प्रकाशित ऐप अपना होस्ट `nsh.json` में बताता है: `web.host` ऐप की डायरेक्टरी में एक JS मॉड्यूल है, जो `nsh.json` के सापेक्ष होता है और `createHost(player)` एक्सपोर्ट करता है, जो `call` वाला ऑब्जेक्ट लौटाता है। `nsh package --target web` इसे साइट के साथ भेजता है, `nsh run --target web` इसे डेवलपमेंट पेज पर चलाता है, और `nsh test` इसे उन ऐप के लिए चलाता है जिन्हें उसके टेस्ट खोलते हैं। `web.connect` उन होस्ट की सूची देता है जिन तक होस्ट के अपने अनुरोध पहुँचते हैं, और जिन्हें पेज की Content-Security-Policy ऐप के `capabilities.network` के साथ अनुमति देती है। देखें [Web](../docs/web.md#the-hosts-functions)।

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

एम्बेड करने वाले ऐप ने आपका ऐप शुरू करने से पहले जो पैरामीटर सेट किए थे; इन्हें आपके कोड की पहली पंक्ति से सिंक्रोनस रूप से पढ़ा जा सकता है। कुछ भी सेट न होने पर यह `{}` होता है। ऐप चलने के दौरान ये वही रहते हैं: बाद के अनुरोध इवेंट के रूप में आते हैं।

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```

### Native SDK channel

Native SDK का `send` ऐप के सुनना शुरू करने तक इवेंट रोके रखता है, अधिकतम 256। जब डिलीवरी के दौरान आखिरी listener रुक जाता है, तो बचे हुए इवेंट क्रम में प्रतीक्षा करते रहते हैं; शटडाउन के दौरान भेजे गए इवेंट अगले लोड होने वाले ऐप के लिए प्रतीक्षा करते हैं। `host.post(name, data)` डेटा को Native SDK हैंडलर तक पहुँचाता है, जिसका `isPost` पोस्ट और कॉल में अंतर करता है।

<a id="the-embedding-apps-side"></a>

### एम्बेड करने वाले ऐप की ओर

हर view अपने द्वारा लोड किए गए सभी ऐप के लिए एक चैनल रखता है। पैरामीटर लोड करने से पहले सेट करें, इवेंट किसी भी समय किसी भी थ्रेड से भेजें, और हैंडलर नाम से रजिस्टर करें। कॉल और पोस्ट के लिए ऐप का `capabilities.host` grant ज़रूरी है। हैंडलर एक बार जवाब देते हैं, अभी या बाद में; जो जवाब कभी नहीं आता, उससे कॉल विफल हो जाती है।

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

देखें [iOS पर एम्बेड करना](../docs/ios.md#talking-to-the-app), [Android पर एम्बेड करना](../docs/android.md#talking-to-the-app) और [GPUI](../docs/gpui.md)।

> [!NOTE]
> Native SDK के कॉल और पोस्ट प्लेटफ़ॉर्म कॉल जैसी ही [`host` capability](../docs/sandbox-and-capabilities.md#host) का उपयोग करते हैं। Rust ऐप एम्बेड करने वाले ऐप के Rust तक सीधे पहुँचता है, उन फ़ंक्शन के ज़रिए जो वह रजिस्टर करता है ([`nativeModule`](#nativemodule) और Rust इम्पोर्ट)।

## keymap

keymap ऐप के कीबोर्ड शॉर्टकट को बाँधता है: एक keystroke, जैसे `"mod+k"`, और वह फ़ंक्शन जिसे वह चलाता है। Rust कोड `nsh_core::prelude` से `on_key`, `on_key_with` और `key_label` कॉल करता है; TSX `nsh` से `keymap` इम्पोर्ट करता है। दोनों समान keystroke लेते हैं और समान नियमों का पालन करते हैं।

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
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when` है `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | हर keystroke के लिए एक `on_key` |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Rust की binding उस कॉम्पोनेंट (owner) जितने समय तक रहती है जिसने उसे बनाया; हैंडलर को keystroke वैसा ही मिलता है जैसा लिखा गया था।

शॉर्टकट macOS, Windows, Linux और ब्राउज़र में काम करते हैं (ब्राउज़र की अपनी कुंजियाँ, जैसे Ctrl+T या Cmd+W, पेज तक कभी नहीं पहुँचतीं), और हार्डवेयर कीबोर्ड वाले iOS और Android पर भी: iPad का, iPad ऐप चलाने वाले Mac का, टैबलेट या Chromebook का, सिम्युलेटर और एमुलेटर का। वही कोड हर जगह चलता है; कीबोर्ड के बिना कोई भी कुंजी binding को नहीं चलाती।

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

जब `keystroke` दबाया जाता है तब `handler` चलाता है और एक फ़ंक्शन लौटाता है जो binding को हटा देता है। हैंडलर को `{ keystroke }` मिलता है: keystroke वैसा ही जैसा आपने लिखा था, उसी केस में। Rust: `on_key(keystroke, handler)`, जिसके हैंडलर को स्वयं keystroke मिलता है।

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

एक साथ कई keystroke बाँधने के लिए ऑब्जेक्ट पास करें; लौटाया गया फ़ंक्शन उन सभी को हटा देता है। Rust में हर keystroke एक `on_key` है:

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

कॉम्पोनेंट के रेंडर होने के दौरान बनाई गई binding कॉम्पोनेंट के साथ हट जाती है, इसलिए स्क्रीन के शॉर्टकट उतने ही समय तक रहते हैं जितने समय तक स्क्रीन:

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

dev server के साथ, किसी मॉड्यूल को संपादित करने पर उसके top-level कोड द्वारा बनाई गई binding दोबारा चलने से पहले हटा दी जाती हैं, इसलिए hot reload कभी पुराने शॉर्टकट नहीं छोड़ता।

### keymap.label

```ts
label(keystroke: string): string;
```

`keystroke` को वैसे लौटाता है जैसे मेनू और संकेत उसे ऐप चलने की जगह दिखाते हैं: macOS और iOS पर (और Mac, iPhone या iPad के ब्राउज़र में) `"⇧⌘L"`, Windows, Linux और अन्य ब्राउज़र में `"Ctrl+Shift+L"`, `"mod+shift+l"` के लिए। Rust: `key_label(keystroke)`। इसका उपयोग ऐप के शॉर्टकट को उन कुंजियों के साथ दिखाने के लिए करें जो वास्तव में काम करती हैं:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

अमान्य keystroke के लिए यह `TypeError` फेंकता है, जैसा `bind` करता है; `key_label` और `on_key` उसी संदेश के साथ panic करते हैं।

<a id="keystrokes"></a>

### Keystroke

Keystroke modifier और एक कुंजी से बनता है, जिन्हें `+` से जोड़ा जाता है: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command और माइनस)।

| Modifier | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (साथ ही `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (साथ ही `command`, `meta`, `super`, `win`) | Command (⌘) | Windows कुंजी | Super |
| `ctrl` (साथ ही `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (साथ ही `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS, macOS का अनुसरण करता है (`mod` का अर्थ Command है) और Android, Windows और Linux का (`mod` का अर्थ Ctrl है, `cmd` Meta कुंजी है)। ब्राउज़र में कुंजियाँ उस प्लेटफ़ॉर्म का अनुसरण करती हैं जिस पर ब्राउज़र चल रहा है: `mod` Mac, iPhone या iPad पर Command है और अन्यत्र Ctrl।

ऐप के अपने शॉर्टकट के लिए `mod` का उपयोग करें: यह वही कुंजी है जिसे हर प्लेटफ़ॉर्म के ऐप इनके लिए इस्तेमाल करते हैं (macOS पर ⌘K, Windows और Linux पर Ctrl+K), इसलिए एक ही वर्तनी हर जगह चलती है। Windows कुंजी और Super ज़्यादातर सिस्टम के हैं, इसलिए macOS के बाहर `cmd` शायद ही कभी सही होता है।

कुंजी एक अक्षर, अंक या विराम-चिह्न की कुंजी होती है, जिसे उस वर्ण के रूप में लिखा जाता है जो वह US कीबोर्ड पर Shift के बिना टाइप करती है (`k`, `1`, `,`, `/`, `[`; `?` के लिए `"shift+/"`, Shift+K के लिए `"shift+k"`), या एक नाम: `plus` (`=` / `+` कुंजी, जिसे `=` भी लिखा जाता है), `minus` (साथ ही `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, तीर वाली कुंजियाँ `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1` से `f24` तक। अक्षर का केस मायने नहीं रखता: `"Mod+Shift+K"` वही है जो `"mod+shift+k"`, और बड़ा अक्षर वही कुंजी है, Shift नहीं (`"mod+K"` वही है जो `"mod+k"`)। छोटे अक्षर लिखना अनुशंसित शैली है, जिसका उपयोग ये पेज करते हैं। `"mod-k"` और `"mod++"` त्रुटियाँ हैं जिनके संदेश सही वर्तनी बताते हैं। `nsh/desktop` में मेनू शॉर्टकट भी यही keystroke लेते हैं।

शॉर्टकट किसी भी कीबोर्ड लेआउट के साथ काम करते हैं: Cyrillic या Greek लेआउट पर `mod+k` वही कुंजी है जो US लेआउट पर K टाइप करती है, जैसा मेनू शॉर्टकट के साथ होता है।

अमान्य keystroke (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`) के लिए `bind` एक `TypeError` फेंकता है जो बताता है कि क्या गलत है, और उन keystroke को अस्वीकार करता है जिन्हें सिस्टम अपने लिए रखता है, ताकि ऐप उन्हें कभी तोड़ न सके:

| प्लेटफ़ॉर्म | आरक्षित |
|---|---|
| macOS, iOS | Cmd+Q (बाहर निकलना), Cmd+H (छिपाना), Option+Cmd+H (अन्य छिपाना), Cmd+M (छोटा करना), Ctrl+Cmd+F (फ़ुल स्क्रीन) |
| Linux, Windows, Android | Ctrl+Q (बाहर निकलना), Alt+F4 (बंद करना), F11 (फ़ुल स्क्रीन) |
| Web | कोई नहीं (ब्राउज़र अपनी कुंजियाँ अपने पास रखता है) |

<a id="while-typing"></a>

### टाइप करते समय

कीबोर्ड फ़ोकस वाले टेक्स्ट इनपुट को अपनी कुंजियाँ चाहिए: टाइप करना, कैरेट हिलाना, मिटाना, और सब चुनना, कट, कॉपी, पेस्ट, undo और redo। इसलिए डिफ़ॉल्ट रूप से, जब किसी टेक्स्ट इनपुट (या वेब व्यू) पर फ़ोकस हो, तब binding नहीं चलती यदि उसका keystroke इनमें से एक है: सादी कुंजियाँ और केवल Shift या Option वाली कुंजियाँ, तीर, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, और `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`। Command या Control वाले अन्य keystroke और फ़ंक्शन कुंजियाँ फ़ोकस जहाँ भी हो, वहाँ चलती हैं।

`when` इसे बदलता है (Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | कब चलती है |
|---|---|
| (डिफ़ॉल्ट) | जैसा ऊपर बताया गया |
| `"always"` | टेक्स्ट इनपुट में भी, इनपुट के कुंजी देखने से पहले |
| `"notEditing"` | टेक्स्ट इनपुट पर फ़ोकस होने पर कभी नहीं |

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

iOS और Android पर, जिस कुंजी से इनपुट मेथड कम्पोज़ कर रहा है (उम्मीदवार चुनना, कमिट करना), वह इनपुट मेथड की ही रहती है। GPUI बैकएंड पर, कीबोर्ड फ़ोकस वाला native कॉम्पोनेंट टेक्स्ट इनपुट माना जाता है, क्योंकि वह टेक्स्ट एडिटर हो सकता है। वह हर कुंजी को सबसे पहले देखता है: जिस कुंजी को वह स्वयं संभालता है वह binding तक कभी नहीं पहुँचती, और टेक्स्ट संपादित होते समय जो binding चलती हैं उन्हें वही कुंजियाँ मिलती हैं जिन्हें वह आगे जाने देता है।

<a id="which-binding-runs"></a>

### कौन सी binding चलती है

जो कुंजी किसी binding को चलाती है, वह खप जाती है: वह टाइप नहीं होती, सिस्टम बीप नहीं करता, और NSH की अपनी कुंजियाँ उसे नहीं देखतीं (Escape से पीछे जाना, Tab से फ़ोकस हिलाना, तीरों से स्क्रॉल करना)। जब कई binding का keystroke एक ही हो, तो उनमें से सबसे नई binding चलती है जिसे चलने की अनुमति है, इसलिए डायलॉग स्क्रीन की binding के ऊपर Escape बाँध सकता है और डायलॉग की binding जाने पर स्क्रीन की वापस आ जाती है। कुंजी दबते ही binding की जाँच native रूप से होती है; हैंडलर उसके तुरंत बाद चलता है, engine थ्रेड (Rust) या JS थ्रेड (TSX) पर।

कुंजी को दबाए रखने पर उसकी binding एक बार चलती है, जब तक कुंजी छोड़ी न जाए; `repeat: true` के साथ वह हर auto-repeat पर फिर चलती है (जैसे सूची में आगे बढ़ने के लिए):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

मेनू शॉर्टकट उसी keystroke की binding के लिए जगह छोड़ देते हैं: हर डेस्कटॉप पर एप्लिकेशन मेनू के ([`nsh/desktop`](./nsh-desktop)), और macOS पर बिल्ट-इन मेनू के भी (Cmd+W, Cmd+C, ...)। `nsh run` के साथ डेवलप करते समय, Cmd+R / Ctrl+R हमेशा ऐप को रीलोड करता है, भले ही वह `mod+r` को बाँधे; पैकेज किया हुआ ऐप इसे बाँध सकता है।

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent और nativeModule

`nativeComponent` और `nativeModule` आपके ऐप को उससे जोड़ते हैं जो होस्ट ऐप प्रदान करता है, नाम से, रन टाइम पर। NSH को एम्बेड करने वाला iOS या Android ऐप अपने views (मैप, चार्ट, कैमरा प्रीव्यू) नाम से रजिस्टर कर सकता है; `nativeComponent` आपको उनमें से किसी एक के लिए टाइप्ड कॉम्पोनेंट देता है। क्योंकि NSH असली native views से रेंडर करता है, ऐसा कॉम्पोनेंट किसी भी अन्य view की तरह view hierarchy में बैठता है: NSH उसका लेआउट करता है, वह अपने पैरेंट के साथ क्लिप और स्क्रॉल होता है, और सही ढंग से ओवरलैप होता है। Rust से NSH को एम्बेड करने वाला ऐप फ़ंक्शन, क्लास और Rust कॉम्पोनेंट भी रजिस्टर कर सकता है; `nativeModule` उन्हें आपको एक टाइप्ड ऑब्जेक्ट के रूप में देता है। आपका ऐप दोनों तरह से स्टॉक `nsh build` से बनता है: होस्ट ऐप चलाते समय जो कुछ वह प्रदान करता है उसे जोड़ देता है। Rust कोड रजिस्टर किए गए view को `nsh_core::prelude` से `native(name)` द्वारा रखता है, उसके props `.prop(name, value)` से सेट करता है (एक JSON वैल्यू, या उसका signal या क्लोज़र) या `.bind_prop(name, &value)` से किसी को animated value से बाँधता है, उसके इवेंट `.on_native_event(…)` से सुनता है और उसके कमांड `ElementRef` के ज़रिए कॉल करता है; TSX `nsh` इम्पोर्ट करता है।

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

native पक्ष को रजिस्टर करने के लिए [Native components](../docs/native-components.md) देखें, और [iOS पर एम्बेड करना](../docs/ios.md) / [Android पर एम्बेड करना](../docs/android.md)।

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

उस native कॉम्पोनेंट के लिए एक कॉम्पोनेंट लौटाता है जिसे एम्बेड करने वाले ऐप ने `name` नाम से रजिस्टर किया है (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`)। Rust: `native(name)`, एक view जिसके props JSON वैल्यू हैं (`.prop("text", json!(…))`) और जिसके इवेंट `NativeEvent { name, data }` के रूप में आते हैं।

- `P` उसके अपने props का टाइप है। `spec.props` में सूचीबद्ध हर prop बदलने पर JSON के रूप में native पक्ष को भेजा जाता है; उसे `undefined` पर सेट करने से वह हट जाता है।
- `E` इवेंट के नामों को उनके payload से मैप करता है। इवेंट `regionChange` हैंडलर prop `onRegionChange` बन जाता है।
- कॉम्पोनेंट `children` को छोड़कर हर [view prop](../elements/view.md) भी लेता है: `style`, `class`, लेआउट, accessibility, touch हैंडलर और `ref`।

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### आकार

कॉम्पोनेंट का लेआउट view की तरह होता है, उस आकार में जो उसकी style देती है। जहाँ style कोई आयाम खुला छोड़ती है, वहाँ वह उस आकार का उपयोग करता है जो native कॉम्पोनेंट बताता है (जैसे इमेज अपने प्राकृतिक आकार का उपयोग करती है)।

<a id="commands"></a>

#### कमांड

उसका `ref` एक `NativeComponentRef` प्राप्त करता है; `ref.command(name, args)` native कॉम्पोनेंट के कमांड `name` को `args` (कोई भी JSON वैल्यू) के साथ कॉल करता है। Rust: `ElementRef::command(name, args)`।

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### जब कुछ रजिस्टर न हो

जहाँ `name` के नाम से कुछ रजिस्टर नहीं है (कोई अलग होस्ट ऐप, dev host, ब्राउज़र), वहाँ कॉम्पोनेंट एक खाली view रेंडर करता है और एक बार चेतावनी लॉग की जाती है। ऐप को उसके बिना भी उपयोग योग्य रखें, या उसका उपयोग करने से पहले अपने होस्ट की जाँच करें।

<a id="example"></a>

### उदाहरण

यहाँ का बैज होस्ट ऐप का native view है, जो `embed.badge` के रूप में रजिस्टर है। NSH उसका लेआउट करता है, उसे `text` और `color` भेजता है, उसके `tap` इवेंट प्राप्त करता है, और उसके `pulse` कमांड को कॉल करता है:

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

एम्बेड करने वाले ऐप ने जिस सेट को `specifier` के रूप में रजिस्टर किया है, यह उसके एक्सपोर्ट एक ही ऑब्जेक्ट के रूप में लौटाता है: उसके मॉड्यूल, क्लास, फ़ंक्शन और Rust कंपोनेंट। टाइप `T` ऐप खुद लिखता है, इसलिए इसे बनाते समय होस्ट के बारे में कुछ भी जानने की ज़रूरत नहीं होती। होस्ट के crate के साथ बना Rust कोड उन फ़ंक्शन को सीधे Rust की तरह कॉल करता है; TSX उन तक `nativeModule` से पहुँचता है।

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

- कॉल वैसे ही काम करते हैं जैसे किसी सेट के import से करते हैं: साधारण Rust फ़ंक्शन अपना मान तुरंत लौटाता है, `async` फ़ंक्शन एक promise लौटाता है, और आपका पास किया हुआ फ़ंक्शन एक callback होता है जिसे Rust बाद में कॉल कर सकता है। Rust हर आर्गुमेंट जाँचता है और गलत आर्गुमेंट पर `TypeError` throw करता है।
- एक ही `specifier` के साथ हर कॉल वही ऑब्जेक्ट लौटाता है।
- जहाँ `specifier` के अंतर्गत कुछ भी रजिस्टर नहीं है, वहाँ `nativeModule` उसका नाम बताते हुए `ReferenceError` throw करता है। इसे वहीं कॉल करें जहाँ ऐप इसे संभाल सके, या केवल उसी होस्ट में जिसके लिए यह बना है।

होस्ट सेट को Rust से रजिस्टर करता है, प्लेटफ़ॉर्म crate के `set_ui_sets` से (NSH के अपने सेट के बगल में) अपने views शुरू करने से पहले, या `EngineConfig::ui_sets` से:

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

`on` वह तरीका है जिससे होस्ट हर ऐप को अपने डेटा के साथ तालमेल में रखता है: जो task यह शुरू करता है वह होस्ट के बदलावों का इंतज़ार करता है और हर बदलाव ऐप को भेज देता है, इसलिए होस्ट द्वारा, या किसी भी ऐप द्वारा किसी दूसरे फ़ंक्शन के ज़रिए किया गया बदलाव सुनने वाले हर ऐप तक पहुँचता है। यह जो `Stop` लौटाता है वही फ़ंक्शन है जो TSX में `Trading.on` लौटाता है: यह एक बार चलता है, जब ऐप इसे कॉल करता है या जब `on` को कॉल करने वाला हट जाता है (कोई कंपोनेंट, या hot reload में मॉड्यूल का run), और यहाँ यह listener हटा देता है, जिससे task समाप्त हो जाता है।

> [!NOTE]
> Props, events और कमांड आर्गुमेंट JSON के रूप में नेटिव साइड तक पहुँचते हैं। रजिस्टर किए गए कंपोनेंट और फ़ंक्शन होस्ट ऐप का अपना कोड हैं: NSH की [sandbox सीमाएँ और capabilities](../docs/sandbox-and-capabilities.md) उनके काम पर लागू नहीं होतीं।

## Accessibility

Accessibility API उपयोगकर्ता की accessibility सेटिंग पढ़ती है (क्या screen reader चल रहा है, क्या उन्होंने कम motion माँगा है) और screen reader से संवाद करती है। Rust कोड `nsh_core::prelude` से `screen_reader()`, `reduce_motion()` और `announce_for_accessibility()` को कॉल करता है और `ElementRef` से फ़ोकस ले जाता है; TSX `nsh` से `screenReaderEnabled()`, `reduceMotion()`, `announce()` और `setAccessibilityFocus()` import करता है। सेटिंग reactive हैं: उन्हें किसी binding, `computed` या `effect` में पढ़ें, और जो उन्हें पढ़ता है वह उपयोगकर्ता के बदलने पर अपडेट हो जाता है। एलिमेंट के accessibility props (`accessibilityLabel`, `role`, ...) [Elements](../elements/index.md) के अंतर्गत दस्तावेज़ित हैं; गाइड [Accessibility](../docs/accessibility.md) है।

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

क्या कोई screen reader (VoiceOver, TalkBack) चल रहा है। Reactive: उपयोगकर्ता के screen reader चालू या बंद करने पर इसे पढ़ने वाली चीज़ अपडेट हो जाती है। Rust: `screen_reader() -> bool`, उसी तरह reactive।

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

क्या उपयोगकर्ता ने कम motion माँगा है (iOS में Reduce Motion, Android में Remove animations)। Reactive। Rust: `reduce_motion() -> bool`। Tailwind क्लासेस भी `motion-reduce:` variant के साथ इसका पालन करती हैं।

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

Screen reader `message` पढ़कर सुनाता है (VoiceOver announcement, TalkBack)। इसे उन नतीजों के लिए इस्तेमाल करें जो फ़ोकस हिले बिना दिखते हैं, जैसे "Saved"। Rust: `announce_for_accessibility(message)`।

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Screen reader का फ़ोकस `node` पर ले जाता है (किसी एलिमेंट का `ref`)। Rust: `ElementRef::set_accessibility_focus()`।

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

## Types

`nsh` reactive API और होस्ट एलिमेंट के types भी एक्सपोर्ट करता है। सबसे ज़्यादा इस्तेमाल होने वाले:

| Type | यह क्या है |
|---|---|
| `Accessor<T>` | पढ़ने योग्य मान: `() => T` |
| `Signal<T>` | `set` और `update` वाला एक `Accessor<T>` |
| `SignalOptions<T>` | `signal` और `computed` के विकल्प (`equals`) |
| `Context<T>` | `context` जो लौटाता है |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | JSX namespace (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | `ref` को जो मिलता है, हर एलिमेंट का अपना type (`ViewRef` और उसके ऊपर के types): focus, scroll और अन्य कमांड। `ViewRef` यह भी है कि एलिमेंट क्या है (`JSX.Element`)। देखें [ref methods](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | होस्ट एलिमेंट के props |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Style ऑब्जेक्ट; देखें [style reference](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | styles के अंदर के मान |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Event payload |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | वे आकार जिनसे payload और props बने हैं, GPUI के फ़ील्ड के साथ (`nsh_core::geometry`) |
| `PixelSize` | किसी इमेज या वीडियो का अपना आकार पिक्सेल में (`onLoad`, `Image.getSize`, क्लिपबोर्ड और picker की इमेज), जहाँ `Size` points में है |
| `ImageAsset` | इमेज फ़ाइल import करने पर जो मिलता है (`{ url, size: Size, scales? }`; `scales` उसके [pixel-density variants](../docs/images-and-assets.md#pixel-densities) सूचीबद्ध करता है) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Accessibility props |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` एक style या बाएँ से दाएँ मर्ज की गई style की सूची स्वीकार करता है, falsy एंट्री को छोड़ते हुए:

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
