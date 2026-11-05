---
title: "Shader"
description: "Shader एलिमेंट: एक ऐसा व्यू जिसका बॉक्स WGSL में लिखा गया GPU प्रोग्राम अपने चाइल्ड एलिमेंट्स के नीचे ड्रॉ करता है।"
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

Shader एक ऐसा view है जिसका box एक GPU प्रोग्राम बनाता है: बहते हुए gradient, noise और grain, plasma, aurora, holographic foil, और tap का पीछा करती लहरें। आप एक WGSL फ़ंक्शन `shade` लिखते हैं, जो box के हर बिंदु का रंग देता है; प्लैटफ़ॉर्म उसे GPU पर स्क्रीन के resolution पर चलाता है, view के background के ऊपर और उसके children के नीचे। Animated values उसे native रूप से, फ़्रेम दर फ़्रेम चलाते हैं, ऐप के कोड में बिना कोई काम किए। TSX में `<Shader>` को `nsh` से बनाया जाता है, Rust में `shader().source(program)` से।

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

## शेडर

Shader का सोर्स WGSL में होता है, जो WebGPU की shading भाषा है। यह एक फ़ंक्शन परिभाषित करता है:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` view के box का बिंदु है, ऊपर-बाएँ कोने पर `(0, 0)` से नीचे-दाएँ कोने पर `(1, 1)` तक; y नीचे की ओर बढ़ता है, जैसे CSS में।
- नतीजा उस बिंदु का रंग है: red, green, blue और alpha 0..1 में, sRGB में straight alpha के साथ, जैसे CSS रंग होते हैं। 0..1 से बाहर के मान clamp कर दिए जाते हैं।

`shade` के साथ सोर्स में जितने helper फ़ंक्शन, constants और `var<private>` वेरिएबल चाहिए, उतने हो सकते हैं। NSH entry points देता है और shader के inputs दो जगहों से पढ़ता है।

### Built-ins

| Built-in | टाइप | मान |
|---|---|---|
| `nsh.size` | `vec2f` | view का size, points में। |
| `nsh.time` | `f32` | shader के प्रकट होने के बाद के सेकंड। जो shader इसे पढ़ता है वह animate होता है: जब तक वह स्क्रीन पर है, हर फ़्रेम draw करता है। |
| `nsh.scale` | `f32` | जिस फ़्रेम को draw किया जा रहा है उसके प्रति point pixels। |

`uv * nsh.size` points में बिंदु है; `nsh.size.x / nsh.size.y` aspect ratio है, जो गैर-वर्गाकार box में वृत्तों को गोल रखता है।

### Uniforms

ऐप जो मान सेट करता है वे `Uniforms` नाम के struct में जाते हैं, जिसे shader `uniforms` के रूप में पढ़ता है:

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

`uniforms` prop इसके members को नाम से सेट करता है। हर टाइप ये मान लेता है:

| WGSL टाइप | मान |
|---|---|
| `f32`, `i32`, `u32` | एक number (`i32` और `u32` के लिए शून्य की ओर पूर्णांकित), या animated value |
| `vec2f` | `[x, y]`: दो numbers या animated values |
| `vec3f` | एक रंग (उसके red, green और blue), animated रंग, या तीन numbers |
| `vec4f` | alpha के साथ एक रंग, animated रंग, या चार numbers |
| `array<vec4f, N>` | अधिकतम `N` रंगों की सूची (या हर एक में चार numbers): palette, gradient के stops |

रंग कोई भी CSS रंग हो सकते हैं (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) और shader तक 0..1 में sRGB components के रूप में पहुँचते हैं। ऐप जिन members को छोड़ देता है वे शून्य होते हैं। `uniforms` को फिर से सेट करने पर shader नए मानों के साथ दोबारा draw होता है।

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

## Animated uniforms

Uniform एक [native animated value](../modules/nsh.md#animation) हो सकता है, या उससे बना कोई node (`interpolate`, arithmetic)। प्लैटफ़ॉर्म हर उस फ़्रेम पर, जिसमें उसका मान बदलता है, उसे shader में लिखता है और दोबारा draw करता है, UI थ्रेड पर: ऐप का कोड कितना भी व्यस्त हो, animation पूरे frame rate पर चलता है। Numbers `f32`, `i32` और `u32` members तथा `vec2f` के components को animate करते हैं; रंगों की interpolation `vec3f` या `vec4f` को animate करती है।

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

## Pausing

`paused` shader की घड़ी रोक देता है: `nsh.time` अपना मान बनाए रखता है और shader अपनी तस्वीर थामे रखता है। इसे वापस `false` पर सेट करने से घड़ी वहीं से चलती है जहाँ रुकी थी। Uniforms और size में बदलाव फिर भी रुके हुए shader को draw करते हैं।

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

जो shader `nsh.time` नहीं पढ़ता, वह अपना size या uniforms बदलने पर draw होता है, और बीच में अपनी तस्वीर थामे रखता है।

<a id="children-and-clipping"></a>

## Children और clipping

Shader एक container है: यह [view](./view.md) का हर prop लेता है (styles, उसके children का padding और layout, press और gesture props, `onLayout`, accessibility, `ref`), और उसके children shader के ऊपर draw होते हैं। Shader view के box को उसी तरह भरता है जैसे background भरता है, उसके गोल कोनों (`borderRadius`) के अंदर, उसके `backgroundColor` के ऊपर।

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Shader को size उसके styles से दें (width / height, `flex`, aspect ratio) या उसके children को तय करने दें।

<a id="effects-transitions-and-the-screen"></a>

## Effects, transitions और screen

Shader वह भी draw कर सकता है जो दूसरे views draw करते हैं। तब उसका WGSL चार फ़ंक्शनों से तस्वीरें पढ़ता है, जिनमें से हर एक अपने box का एक बिंदु `uv` लेता है और alpha के साथ straight sRGB रंग लौटाता है, तस्वीर के बाहर पारदर्शी:

| Function | क्या पढ़ता है |
|---|---|
| `sample_content(uv)` | किसी effect के children, या screen effect के लिए पूरी surface |
| `sample_backdrop(uv)` | view के पीछे क्या है (कोई भी shader इसे पढ़ सकता है) |
| `sample_from(uv)` | transition का वह पक्ष जिसे वह छोड़ रहा है |
| `sample_to(uv)` | transition का वह पक्ष जिस पर वह आ रहा है |

`nsh.progress` effect का `progress` है या यह कि transition कितना आगे बढ़ा है (0 से 1), और `nsh.overflow` यह कि shader box के बाहर कितनी दूर तक draw करता है, points में।

**`ShaderEffect`** अपने children को shader से होकर draw करता है: वे अपने presses, focus और accessibility बनाए रखते हैं, और जो दिखता है वह shader का नतीजा है। `progress` एक number या animated value है, जो effect को native रूप से चलाती है। `maxSampleOffset` shader को box के बाहर उतने points तक draw करने देता है (glow, blur का किनारा); तब उसका `uv` 0 से नीचे और 1 से ऊपर जाता है। `source` के बिना children जैसे हैं वैसे ही draw होते हैं।

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

**`ShaderTransition`** अपने children को shader से बदलता है जब `value` (string, number या boolean) बदलता है, पहले मान पर नहीं: `sample_from` उस चीज़ की तस्वीर है जो उन्होंने पहले draw की थी, `sample_to` वह जो वे अब draw करते हैं, और `nsh.progress` `duration` milliseconds (300) में 0 से 1 तक जाता है। `source` के बिना यह `fallback` चलाता है: `"fade"` (cross-fade, डिफ़ॉल्ट) या `"none"`।

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** और **`ScreenTransition`** पूरी surface (उसके pages, dialogs और overlays) के लिए यही करते हैं। वे जगह नहीं घेरते और उनके children नहीं होते; उन्हें ऐप में कहीं भी रखें। `source` के साथ mount हुआ आख़िरी screen effect draw होता है।

Pages और dialogs **`transitionShader`** के साथ shader से होकर आते-जाते हैं: `{ source, uniforms, duration }` किसी `NavPage` या `Dialog` पर (Rust: `.transition_shader(TransitionShader::new(program))` `nav_page()` या `dialog()` पर)। जब page push या pop होता है, या dialog दिखाया या बंद किया जाता है, तो निचला पक्ष (उसके नीचे का page, dialog के बिना ऐप) `sample_from` होता है और ऊपरी पक्ष `sample_to`; `nsh.progress` page या dialog के आने पर 0 से 1 तक और जाने पर 1 से 0 तक जाता है, इसलिए एक ही shader दोनों दिशाओं में draw करता है।

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

Shader page या dialog के `animation` की जगह लेता है, चाहे वह कुछ भी हो (`"none"` भी)। `animation` उस डिवाइस पर चलता है जिसमें GPU नहीं है, जब उपयोगकर्ता कम motion माँगता है (Reduce Motion, Remove animations), और ऐसे सोर्स के लिए जो compile नहीं होता; `"none"` के साथ तब बदलाव तुरंत दिखता है। जो push, pop, show या close किसी दूसरे के चलते समय शुरू होता है, वह पहले उसे पूरा करता है: उसका page या dialog आ या चला जाता है, उसका `onShow` या `onDismiss` fire होता है, और नया बदलाव वहीं से शुरू होता है।

प्लैटफ़ॉर्म तस्वीरें तब लेते हैं जब जो वे दिखाते हैं वह बदलता है, प्रति display frame अधिकतम एक बार। तस्वीर प्लैटफ़ॉर्म के अपने renderer से draw होती है, इसलिए जिसे वह तस्वीर में draw नहीं कर सकता (video, web page, किसी दूसरे ऐप का view) वह उसमें पारदर्शी दिखता है।

## Props

Shader [view](./view.md) के props लेता है, साथ में:

| Prop | Rust | टाइप | विवरण |
|---|---|---|---|
| `source` | `.source(program)` | `string` | `fn shade(uv: vec2f) -> vec4f` को परिभाषित करने वाला WGSL सोर्स। Rust इसे `Shader::compile(source)` से compile करता है। |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | `struct Uniforms` के members के मान, नाम से: numbers, रंग, animated values और उनकी सूचियाँ। |
| `paused` | `.paused(bool)` | `boolean` | `nsh.time` की घड़ी रोकता है। डिफ़ॉल्ट `false`। |

`ShaderEffect` और `ScreenEffect` ये लेते हैं (`source` वैकल्पिक), साथ में:

| Prop | Rust | टाइप | विवरण |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`। डिफ़ॉल्ट 0। |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | box के बाहर कितनी दूर तक, points में, shader draw करता है और उसकी तस्वीरें पहुँचती हैं (`ShaderEffect` और `ShaderTransition`)। डिफ़ॉल्ट 0। |

`ShaderTransition` और `ScreenTransition` `source`, `uniforms` और `paused` लेते हैं, साथ में:

| Prop | Rust | टाइप | विवरण |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | इसके बदलने पर transition चलता है (पहले मान पर नहीं)। |
| `duration` | `.duration(Duration)` | `number` | कितनी देर चलता है, milliseconds में। डिफ़ॉल्ट 300। |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | `source` के बिना क्या चलता है। डिफ़ॉल्ट `"fade"`। |

`NavPage` और `Dialog` लेते हैं:

| Prop | Rust | टाइप | विवरण |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | वह shader जिससे होकर page या dialog अपने `animation` की जगह आता-जाता है। `duration` milliseconds में, डिफ़ॉल्ट 350। |

## Errors

NSH हर shader को तब जाँचता है जब उसका सोर्स सेट होता है, GPU तक पहुँचने से पहले। जो shader compile नहीं होता वह सोर्स में line और column तथा क्या गलत है, इसके साथ एक warning log करता है, उदाहरण के लिए:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

तब view अपना background और children दिखाता है। जो uniform struct में नहीं है, या ऐसा मान जिसे उसका टाइप नहीं लेता, उस uniform का नाम बताने वाली warning log करता है, और बाकी uniforms लागू होते हैं।

हर सोर्स एक बार compile होता है: जो views एक सोर्स साझा करते हैं, और दोबारा सेट किया गया सोर्स, compile किए हुए shader का उपयोग करते हैं।

<a id="rules-and-limits"></a>

## Rules और limits

- `shade` का signature ठीक `fn shade(uv: vec2f) -> vec4f` है। सोर्स अपने functions, constants, structs और `var<private>` वेरिएबल खुद declare करता है; NSH entry points और bindings देता है।
- सोर्स अधिकतम 64 KiB का हो सकता है।
- `struct Uniforms` अधिकतम 4096 bytes लेता है, जिसमें members ऊपर की तालिका के टाइप के होते हैं।
- एक फ़्रेम की हर तरफ़ अधिकतम 4096 pixels होती हैं: बड़ा view अपना shader कम scale पर draw करता है।

Noise के लिए, उस integer cell को hash करें जिसमें बिंदु है (`bitcast<vec2u>(vec2i(floor(p)))` को multiplies और xor-shifts से मिलाकर), `fract(sin(…) * 43758.5)` की बजाय: integer hashes एक cell के लिए हर उस जगह वही मान देते हैं जहाँ उसकी गणना होती है, इसलिए value noise हर GPU पर seamless रहता है। Gallery के shaders में एक उदाहरण है।

## Platforms

iOS, Android, macOS, Windows और Linux पर, और GPUI ऐप्स में, NSH shaders को GPU पर wgpu से render करता है (Apple प्लैटफ़ॉर्म पर Metal, अन्यत्र Vulkan, Direct3D 12 या OpenGL), स्क्रीन के scale पर, और हर फ़्रेम को view के children के नीचे दिखाता है। Rendering UI के साथ-साथ चलती है: फ़्रेम draw होने के एक या दो display frame बाद दिखता है, और GPU के काम करते समय UI responsive रहता है। Web पर, NSH shader को GLSL में translate करता है और WebGL 2 से draw करता है।

Shaders प्रति display frame अधिकतम एक बार draw होते हैं, और केवल तब जब जो वे दिखाते हैं वह बदलता है: fixed uniforms वाला shader एक बार draw होता है, जो shader `nsh.time` पढ़ता है वह हर फ़्रेम, और animated uniforms वाला shader तब तक जब तक वे चलते हैं।

## Rust

`shader()` (`nsh_core::element` से) एक shader view बनाता है; `.source(program)` उसे compile किया हुआ `Shader` देता है (`nsh_core::shader::Shader::compile(source)`, जो ऊपर जैसी ही errors लौटाता है)। प्रोग्राम को एक बार compile करें और साझा करें: उसे clone करना सस्ता है। प्रोग्राम bound हो सकता है, `.source(move || …)`, प्रोग्राम बदलने के लिए।

| Method | विवरण |
|---|---|
| `.uniform(name, value)` | `struct Uniforms` का एक member सेट करता है: number, `Color` या `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]`, या `Vec<UniformValue>`। Bound मान (`move \|\| …`) बदलने पर उसे फिर सेट करता है; animated मान (`&wave`: number, या `vec3f` / `vec4f` के लिए रंग) उसे हर फ़्रेम पर native रूप से चलाता है। |
| `.paused(bool)` | `nsh.time` की घड़ी रोकता है; bindable। |

Children `.child(..)` से जोड़े जाते हैं, styles सामान्य typed methods से। `shader_effect()`, `shader_transition()`, `screen_effect()` और `screen_transition()` बाकी elements बनाते हैं, ऊपर की तालिकाओं के methods के साथ।
