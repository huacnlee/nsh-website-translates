---
title: "Shader"
description: "Das Shader-Element: eine View, deren Fläche von einem in WGSL geschriebenen GPU-Programm gezeichnet wird, unterhalb ihrer Kindelemente."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---


# Shader

Ein Shader ist eine View, deren Fläche ein GPU-Programm zeichnet: fließende Verläufe, Rauschen und Körnung, Plasma, Aurora, holografische Folie, Wellen, die einem Tipp folgen. Du schreibst eine WGSL-Funktion, `shade`, die die Farbe jedes Punktes der Fläche liefert. Die Plattform führt sie auf der GPU in der Auflösung des Bildschirms aus, über dem Hintergrund der View und unter ihren Kindern. Animierte Werte bewegen sie nativ, Frame für Frame, ohne Aufwand im Code der App. TSX erzeugt einen Shader mit `<Shader>` aus `nsh`, Rust mit `shader().source(program)`.

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

## Der Shader

Der Quelltext eines Shaders ist WGSL, die Shading-Sprache von WebGPU. Er definiert eine Funktion:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` ist der Punkt der Fläche der View, von `(0, 0)` an der oberen linken Ecke bis `(1, 1)` an der unteren rechten Ecke, wobei y wie in CSS nach unten wächst.
- Das Ergebnis ist die Farbe des Punktes: Rot, Grün, Blau und Alpha in 0..1, in sRGB mit Straight Alpha, wie CSS-Farben. Werte außerhalb von 0..1 werden begrenzt.

Neben `shade` enthält der Quelltext beliebige Hilfsfunktionen, Konstanten und `var<private>`-Variablen, die er braucht. NSH stellt die Einstiegspunkte bereit und liest die Eingaben des Shaders aus zwei Quellen.

### Built-ins

| Built-in | Typ | Wert |
|---|---|---|
| `nsh.size` | `vec2f` | Die Größe der View in Punkten. |
| `nsh.time` | `f32` | Sekunden seit dem Erscheinen des Shaders. Ein Shader, der diesen Wert liest, ist animiert: Er zeichnet bei jedem Frame, solange er auf dem Bildschirm ist. |
| `nsh.scale` | `f32` | Pixel pro Punkt des Frames, der gerade gezeichnet wird. |

`uv * nsh.size` ist der Punkt in Punkten; `nsh.size.x / nsh.size.y` ist das Seitenverhältnis, das Kreise in einer nicht quadratischen Fläche rund hält.

### Uniforms

Werte, die die App setzt, stehen in einem Struct namens `Uniforms`, das der Shader als `uniforms` liest:

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

Die Prop `uniforms` setzt seine Member anhand ihres Namens. Jeder Typ akzeptiert diese Werte:

| WGSL-Typ | Werte |
|---|---|
| `f32`, `i32`, `u32` | Eine Zahl (bei `i32` und `u32` gegen null gerundet) oder ein animierter Wert |
| `vec2f` | `[x, y]`: zwei Zahlen oder animierte Werte |
| `vec3f` | Eine Farbe (ihr Rot-, Grün- und Blauanteil), eine animierte Farbe oder drei Zahlen |
| `vec4f` | Eine Farbe mit Alpha, eine animierte Farbe oder vier Zahlen |
| `array<vec4f, N>` | Eine Liste mit bis zu `N` Farben (oder mit je vier Zahlen): eine Palette, die Stopps eines Verlaufs |

Farben sind beliebige CSS-Farben (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) und erreichen den Shader als sRGB-Komponenten in 0..1. Member, die die App weglässt, sind null. Wird `uniforms` erneut gesetzt, zeichnet der Shader mit den neuen Werten neu.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## Animierte Uniforms

Eine Uniform kann ein [nativer animierter Wert](../modules/nsh.md#animation) sein oder ein davon abgeleiteter Knoten (`interpolate`, Arithmetik). Die Plattform schreibt seinen Wert bei jedem Frame, in dem er sich ändert, in den Shader und zeichnet neu, auf dem UI-Thread: Die Animation läuft mit voller Framerate, egal wie ausgelastet der Code der App ist. Zahlen animieren die Member `f32`, `i32` und `u32` sowie die Komponenten eines `vec2f`; eine Interpolation zu Farben animiert ein `vec3f` oder `vec4f`.

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

## Pausieren

`paused` hält die Uhr des Shaders an: `nsh.time` behält seinen Wert, und der Shader hält sein Bild. Wird es wieder auf `false` gesetzt, läuft die Uhr dort weiter, wo sie stehen geblieben ist. Uniforms und Größenänderungen zeichnen einen pausierten Shader weiterhin neu.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

Ein Shader, der `nsh.time` nicht liest, zeichnet bei Änderungen seiner Größe oder seiner Uniforms und hält dazwischen sein Bild.

<a id="children-and-clipping"></a>

## Kinder und Clipping

Ein Shader ist ein Container: Er akzeptiert jede Prop einer [View](./view.md) (Styles, Padding und Layout seiner Kinder, Press- und Gesten-Props, `onLayout`, Barrierefreiheit, `ref`), und seine Kinder zeichnen über dem Shader. Der Shader füllt die Fläche der View wie ein Hintergrund, innerhalb ihrer abgerundeten Ecken (`borderRadius`), über ihrem `backgroundColor`.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Gib dem Shader über seine Styles eine Größe (width / height, `flex`, ein Seitenverhältnis) oder lass ihn von seinen Kindern dimensionieren.

<a id="effects-transitions-and-the-screen"></a>

## Effekte, Übergänge und der Bildschirm

Ein Shader kann auch zeichnen, was andere Views zeichnen. Sein WGSL liest dann Bilder über vier Funktionen, die jeweils einen Punkt `uv` seiner Fläche entgegennehmen und eine Straight-sRGB-Farbe mit Alpha zurückgeben, außerhalb des Bildes transparent:

| Funktion | Liest |
|---|---|
| `sample_content(uv)` | die Kinder eines Effekts, bzw. bei einem Bildschirmeffekt die gesamte Oberfläche |
| `sample_backdrop(uv)` | was hinter der View liegt (jeder Shader darf es lesen) |
| `sample_from(uv)` | die Seite eines Übergangs, die verlassen wird |
| `sample_to(uv)` | die Seite eines Übergangs, zu der gewechselt wird |

`nsh.progress` ist der `progress` eines Effekts bzw. wie weit ein Übergang fortgeschritten ist (0 bis 1), und `nsh.overflow` gibt an, wie weit der Shader über die Fläche hinaus zeichnet, in Punkten.

**`ShaderEffect`** zeichnet seine Kinder durch den Shader: Sie behalten ihre Presses, ihren Fokus und ihre Barrierefreiheit, und sichtbar ist das Ergebnis des Shaders. `progress` ist eine Zahl oder ein animierter Wert, der den Effekt nativ bewegt. `maxSampleOffset` lässt den Shader entsprechend viele Punkte über die Fläche hinaus zeichnen (ein Glow, der Rand eines Blurs); sein `uv` geht dann unter 0 und über 1. Ohne `source` zeichnen die Kinder unverändert.

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

**`ShaderTransition`** verändert seine Kinder durch den Shader, wenn sich `value` (ein String, eine Zahl oder ein Boolean) ändert, nicht beim ersten Wert: `sample_from` ist ein Bild dessen, was sie zuvor gezeichnet haben, `sample_to` das, was sie jetzt zeichnen, und `nsh.progress` läuft über `duration` Millisekunden (300) von 0 bis 1. Ohne `source` läuft `fallback`: `"fade"` (eine Überblendung, der Standard) oder `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** und **`ScreenTransition`** tun dasselbe für die gesamte Oberfläche (ihre Seiten, Dialoge und Overlays). Sie nehmen keinen Platz ein und haben keine Kinder; platziere sie irgendwo in der App. Der zuletzt mit einem `source` eingehängte Bildschirmeffekt zeichnet.

Seiten und Dialoge erscheinen und verschwinden mit **`transitionShader`** durch einen Shader: `{ source, uniforms, duration }` an einer `NavPage` oder einem `Dialog` (Rust: `.transition_shader(TransitionShader::new(program))` an `nav_page()` oder `dialog()`). Wenn die Seite gepusht oder gepoppt oder der Dialog angezeigt oder geschlossen wird, ist die untere Seite (die Seite darunter, die App ohne den Dialog) `sample_from` und die obere `sample_to`; `nsh.progress` läuft von 0 bis 1, wenn die Seite oder der Dialog erscheint, und von 1 bis 0, wenn er verschwindet, sodass ein Shader beide Richtungen zeichnet.

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

Der Shader tritt an die Stelle des `animation` der Seite oder des Dialogs, was auch immer es ist (auch `"none"`). Der `animation` läuft auf einem Gerät ohne GPU, wenn der Nutzer weniger Bewegung wünscht (Reduce Motion, Remove animations) und bei einem Quelltext, der nicht kompiliert; mit `"none"` erscheint die Änderung dann sofort. Ein Push, Pop, Show oder Close, das beginnt, während ein anderer Vorgang läuft, schließt diesen zuerst ab: Seite oder Dialog kommen an bzw. verschwinden, ihr `onShow` oder `onDismiss` wird ausgelöst, und die neue Änderung beginnt von dort aus.

Die Plattformen nehmen die Bilder auf, wenn sich ändert, was sie zeigen, höchstens einmal pro Display-Frame. Ein Bild wird vom plattformeigenen Renderer gezeichnet; was dieser nicht in ein Bild zeichnen kann (ein Video, eine Webseite, die View einer anderen App), erscheint darin transparent.

## Props

Ein Shader akzeptiert die Props einer [View](./view.md) sowie:

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `source` | `.source(program)` | `string` | Der WGSL-Quelltext, der `fn shade(uv: vec2f) -> vec4f` definiert. Rust kompiliert ihn mit `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | Die Werte der Member von `struct Uniforms`, nach Namen: Zahlen, Farben, animierte Werte und Listen davon. |
| `paused` | `.paused(bool)` | `boolean` | Hält die Uhr von `nsh.time` an. Standard `false`. |

`ShaderEffect` und `ScreenEffect` akzeptieren diese (`source` optional) sowie:

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. Standard 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | Wie weit über die Fläche hinaus, in Punkten, der Shader zeichnet und seine Bilder reichen (`ShaderEffect` und `ShaderTransition`). Standard 0. |

`ShaderTransition` und `ScreenTransition` akzeptieren `source`, `uniforms` und `paused` sowie:

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | Wenn er sich ändert, läuft der Übergang (nicht beim ersten Wert). |
| `duration` | `.duration(Duration)` | `number` | Wie lange er läuft, in Millisekunden. Standard 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | Was ohne `source` läuft. Standard `"fade"`. |

`NavPage` und `Dialog` akzeptieren:

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | Der Shader, durch den die Seite oder der Dialog anstelle seines `animation` erscheint und verschwindet. `duration` in Millisekunden, standardmäßig 350. |

<a id="errors"></a>

## Fehler

NSH prüft jeden Shader, wenn sein Quelltext gesetzt wird, bevor er die GPU erreicht. Ein Shader, der nicht kompiliert, protokolliert eine Warnung mit Zeile und Spalte im Quelltext und dem, was falsch ist, zum Beispiel:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

Die View zeigt dann ihren Hintergrund und ihre Kinder. Eine Uniform, die im Struct fehlt, oder ein Wert, den ihr Typ nicht akzeptiert, protokolliert eine Warnung mit dem Namen der Uniform, und die übrigen Uniforms werden angewendet.

Jeder Quelltext wird einmal kompiliert: Views, die sich einen Quelltext teilen, und ein erneut gesetzter Quelltext verwenden den kompilierten Shader.

<a id="rules-and-limits"></a>

## Regeln und Grenzen

- `shade` hat genau die Signatur `fn shade(uv: vec2f) -> vec4f`. Der Quelltext deklariert seine eigenen Funktionen, Konstanten, Structs und `var<private>`-Variablen; NSH stellt die Einstiegspunkte und die Bindings bereit.
- Der Quelltext ist höchstens 64 KiB groß.
- `struct Uniforms` umfasst höchstens 4096 Bytes, mit Membern der Typen aus der obigen Tabelle.
- Ein Frame ist höchstens 4096 Pixel pro Seite groß: Eine größere View zeichnet ihren Shader in einem kleineren Maßstab.

Für Rauschen hashe die ganzzahlige Zelle, in der ein Punkt liegt (`bitcast<vec2u>(vec2i(floor(p)))`, gemischt mit Multiplikationen und Xor-Shifts), statt `fract(sin(…) * 43758.5)` zu verwenden: Ganzzahl-Hashes liefern für eine Zelle überall, wo sie berechnet wird, denselben Wert, sodass Value Noise auf jeder GPU nahtlos bleibt. Die Shader der Galerie zeigen ein Beispiel.

<a id="platforms"></a>

## Plattformen

Unter iOS, Android, macOS, Windows und Linux sowie in GPUI-Apps rendert NSH Shader mit wgpu auf der GPU (Metal auf Apple-Plattformen, sonst Vulkan, Direct3D 12 oder OpenGL) in der Skalierung des Bildschirms und zeigt jeden Frame unter den Kindern der View. Das Rendering läuft parallel zur UI: Ein Frame erscheint ein bis zwei Display-Frames nach dem Zeichnen, und die UI bleibt reaktionsfähig, während die GPU arbeitet. Im Web übersetzt NSH den Shader nach GLSL und zeichnet ihn mit WebGL 2.

Shader zeichnen höchstens einmal pro Display-Frame und nur, wenn sich ändert, was sie zeigen: Ein Shader mit festen Uniforms zeichnet einmal, einer, der `nsh.time` liest, bei jedem Frame, und einer mit animierten Uniforms, solange sie sich bewegen.

## Rust

`shader()` (aus `nsh_core::element`) erzeugt eine Shader-View; `.source(program)` gibt ihr ein kompiliertes `Shader` (`nsh_core::shader::Shader::compile(source)`, das dieselben Fehler wie oben zurückgibt). Kompiliere ein Programm einmal und teile es: Es ist günstig zu klonen. Das Programm kann gebunden sein, `.source(move || …)`, um zwischen Programmen zu wechseln.

| Methode | Beschreibung |
|---|---|
| `.uniform(name, value)` | Setzt ein Member von `struct Uniforms`: eine Zahl, ein `Color` oder `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]` oder ein `Vec<UniformValue>`. Ein gebundener Wert (`move \|\| …`) setzt es erneut, wenn er sich ändert; ein animierter Wert (`&wave`: eine Zahl oder Farben für ein `vec3f` / `vec4f`) bewegt es bei jedem Frame, nativ. |
| `.paused(bool)` | Hält die Uhr von `nsh.time` an; bindbar. |

Kinder werden mit `.child(..)` hinzugefügt, Styles mit den üblichen typisierten Methoden. `shader_effect()`, `shader_transition()`, `screen_effect()` und `screen_transition()` erzeugen die anderen Elemente, mit den Methoden aus den obigen Tabellen.
