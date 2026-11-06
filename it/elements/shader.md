---
title: "Shader"
description: "L'elemento Shader: una vista il cui riquadro viene disegnato da un programma GPU scritto in WGSL, sotto i suoi figli."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

Uno shader è una view il cui riquadro viene disegnato da un programma GPU: gradienti che scorrono, rumore e grana, plasma, aurora, lamina olografica, onde che seguono un tap. Si scrive una sola funzione WGSL, `shade`, che restituisce il colore di ogni punto del riquadro; la piattaforma la esegue sulla GPU alla risoluzione dello schermo, sopra lo sfondo della view e sotto i suoi figli. I valori animati lo muovono in modo nativo, frame per frame, senza alcun lavoro nel codice dell'app. In TSX se ne crea uno con `<Shader>` da `nsh`, in Rust con `shader().source(program)`.

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

## Lo shader

Il sorgente di uno shader è WGSL, il linguaggio di shading di WebGPU. Definisce una funzione:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` è il punto del riquadro della view, da `(0, 0)` nell'angolo in alto a sinistra a `(1, 1)` in basso a destra, con la y che cresce verso il basso come in CSS.
- Il risultato è il colore del punto: rosso, verde, blu e alpha in 0..1, in sRGB con alpha straight, come i colori CSS. I valori fuori da 0..1 vengono limitati (clamped).

Accanto a `shade` il sorgente contiene le funzioni di supporto, le costanti e le variabili `var<private>` che gli servono. NSH fornisce gli entry point e legge gli input dello shader da due posti.

<a id="built-ins"></a>

### Built-in

| Built-in | Tipo | Valore |
|---|---|---|
| `nsh.size` | `vec2f` | La dimensione della view in punti. |
| `nsh.time` | `f32` | Secondi trascorsi da quando lo shader è apparso. Uno shader che lo legge si anima: disegna a ogni frame finché è sullo schermo. |
| `nsh.scale` | `f32` | Pixel per punto del frame che viene disegnato. |

`uv * nsh.size` è il punto in punti; `nsh.size.x / nsh.size.y` è il rapporto d'aspetto, che mantiene i cerchi tondi in un riquadro non quadrato.

<a id="uniforms"></a>

### Uniform

I valori impostati dall'app vanno in una struct chiamata `Uniforms`, che lo shader legge come `uniforms`:

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

La prop `uniforms` ne imposta i membri per nome. Ogni tipo accetta questi valori:

| Tipo WGSL | Valori |
|---|---|
| `f32`, `i32`, `u32` | Un numero (arrotondato verso lo zero per `i32` e `u32`), o un valore animato |
| `vec2f` | `[x, y]`: due numeri o valori animati |
| `vec3f` | Un colore (il suo rosso, verde e blu), un colore animato, o tre numeri |
| `vec4f` | Un colore con il suo alpha, un colore animato, o quattro numeri |
| `array<vec4f, N>` | Un elenco di al massimo `N` colori (o di quattro numeri ciascuno): una palette, i punti di un gradiente |

I colori possono essere qualsiasi colore CSS (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) e arrivano allo shader come componenti sRGB in 0..1. I membri che l'app omette valgono zero. Impostare di nuovo `uniforms` ridisegna lo shader con i nuovi valori.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## Uniform animate

Una uniform può essere un [valore animato nativo](../modules/nsh.md#animation), o un nodo derivato da uno (`interpolate`, aritmetica). La piattaforma scrive il suo valore nello shader a ogni frame in cui cambia e ridisegna, sul thread UI: l'animazione gira a frame rate pieno per quanto sia impegnato il codice dell'app. I numeri animano i membri `f32`, `i32` e `u32` e le componenti di un `vec2f`; un'interpolazione verso colori anima un `vec3f` o un `vec4f`.

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

## Pausa

`paused` ferma l'orologio dello shader: `nsh.time` mantiene il suo valore e lo shader mantiene la sua immagine. Reimpostarlo a `false` fa ripartire l'orologio da dove si era fermato. Le uniform e i cambi di dimensione ridisegnano comunque uno shader in pausa.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

Uno shader che non legge `nsh.time` si ridisegna quando cambiano la sua dimensione o le sue uniform, e nel frattempo mantiene la sua immagine.

<a id="children-and-clipping"></a>

## Figli e ritaglio

Uno shader è un contenitore: accetta ogni prop di una [view](./view.md) (stili, padding e layout dei figli, prop di pressione e di gesti, `onLayout`, accessibilità, `ref`), e i suoi figli si disegnano sopra lo shader. Lo shader riempie il riquadro della view come fa uno sfondo, dentro gli angoli arrotondati (`borderRadius`), sopra il suo `backgroundColor`.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Dai allo shader una dimensione tramite gli stili (width / height, `flex`, un aspect ratio) oppure lascia che lo dimensionino i figli.

<a id="effects-transitions-and-the-screen"></a>

## Effetti, transizioni e schermo

Uno shader può anche disegnare ciò che disegnano altre view. Il suo WGSL legge allora le immagini tramite quattro funzioni, ognuna delle quali riceve un punto `uv` del suo riquadro e restituisce un colore sRGB straight con alpha, trasparente fuori dall'immagine:

| Funzione | Legge |
|---|---|
| `sample_content(uv)` | i figli di un effetto, o l'intera superficie per un effetto schermo |
| `sample_backdrop(uv)` | ciò che sta dietro la view (qualsiasi shader può leggerlo) |
| `sample_from(uv)` | il lato di una transizione che sta lasciando |
| `sample_to(uv)` | il lato di una transizione a cui sta arrivando |

`nsh.progress` è il `progress` di un effetto o a che punto si trova una transizione (da 0 a 1), e `nsh.overflow` è quanto oltre il riquadro disegna lo shader, in punti.

**`ShaderEffect`** disegna i suoi figli attraverso lo shader: i figli mantengono pressioni, focus e accessibilità, e ciò che appare è il risultato dello shader. `progress` è un numero o un valore animato, che muove l'effetto in modo nativo. `maxSampleOffset` permette allo shader di disegnare altrettanti punti oltre il riquadro (un bagliore, il bordo di una sfocatura); il suo `uv` scende allora sotto 0 e sale sopra 1. Senza `source` i figli si disegnano così come sono.

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

**`ShaderTransition`** modifica i suoi figli attraverso lo shader quando `value` (una stringa, un numero o un booleano) cambia, non per il suo primo valore: `sample_from` è un'immagine di ciò che i figli disegnavano prima, `sample_to` ciò che disegnano ora, e `nsh.progress` va da 0 a 1 in `duration` millisecondi (300). Senza `source` esegue `fallback`: `"fade"` (una dissolvenza incrociata, il default) o `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** e **`ScreenTransition`** fanno lo stesso per l'intera superficie (le sue pagine, i dialog e gli overlay). Non occupano spazio e non hanno figli; mettili ovunque nell'app. Disegna l'ultimo effetto schermo montato con un `source`.

Pagine e dialog entrano ed escono attraverso uno shader con **`transitionShader`**: `{ source, uniforms, duration }` su un `NavPage` o un `Dialog` (Rust: `.transition_shader(TransitionShader::new(program))` su `nav_page()` o `dialog()`). Quando la pagina viene aggiunta o rimossa, o il dialog viene mostrato o chiuso, il lato inferiore (la pagina sotto, l'app senza il dialog) è `sample_from` e quello superiore `sample_to`; `nsh.progress` va da 0 a 1 quando la pagina o il dialog arriva e da 1 a 0 quando se ne va, così un solo shader disegna in entrambe le direzioni.

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

Lo shader prende il posto del `animation` della pagina o del dialog, qualunque esso sia (anche `"none"`). Il `animation` viene eseguito su un dispositivo senza GPU, quando l'utente chiede meno movimento (Reduce Motion, Remove animations), e per un sorgente che non compila; con `"none"` il cambiamento appare allora subito. Un push, pop, show o close che inizia mentre un altro è in corso completa prima quello: la sua pagina o il suo dialog arriva o se ne va, scatta il suo `onShow` o `onDismiss`, e il nuovo cambiamento parte da lì.

Le piattaforme acquisiscono le immagini quando cambia ciò che mostrano, al massimo una volta per frame di display. Un'immagine è disegnata dal renderer della piattaforma stessa, quindi ciò che questo non può disegnare in un'immagine (un video, una pagina web, la view di un'altra app) appare trasparente al suo interno.

<a id="props"></a>

## Prop

Uno shader accetta le prop di una [view](./view.md) più:

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `source` | `.source(program)` | `string` | Il sorgente WGSL che definisce `fn shade(uv: vec2f) -> vec4f`. Rust lo compila con `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | I valori dei membri di `struct Uniforms`, per nome: numeri, colori, valori animati ed elenchi di questi. |
| `paused` | `.paused(bool)` | `boolean` | Ferma l'orologio di `nsh.time`. Default `false`. |

`ShaderEffect` e `ScreenEffect` accettano queste (`source` opzionale) più:

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. Default 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | Quanto oltre il riquadro, in punti, disegna lo shader e arrivano le sue immagini (`ShaderEffect` e `ShaderTransition`). Default 0. |

`ShaderTransition` e `ScreenTransition` accettano `source`, `uniforms` e `paused` più:

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | Quando cambia, la transizione parte (non per il primo valore). |
| `duration` | `.duration(Duration)` | `number` | Quanto dura, in millisecondi. Default 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | Cosa viene eseguito senza `source`. Default `"fade"`. |

`NavPage` e `Dialog` accettano:

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | Lo shader attraverso cui la pagina o il dialog entra ed esce al posto del suo `animation`. `duration` in millisecondi, 350 per default. |

<a id="errors"></a>

## Errori

NSH controlla ogni shader quando ne viene impostato il sorgente, prima che raggiunga la GPU. Uno shader che non compila registra un avviso con la riga e la colonna nel sorgente e ciò che non va, ad esempio:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

La view mostra allora il suo sfondo e i suoi figli. Una uniform che manca nella struct, o un valore che il suo tipo non accetta, registra un avviso con il nome della uniform, e le altre uniform vengono applicate.

Ogni sorgente viene compilato una sola volta: le view che condividono un sorgente, e un sorgente impostato di nuovo, usano lo shader compilato.

<a id="rules-and-limits"></a>

## Regole e limiti

- `shade` ha esattamente la firma `fn shade(uv: vec2f) -> vec4f`. Il sorgente dichiara le proprie funzioni, costanti, struct e variabili `var<private>`; NSH fornisce gli entry point e i binding.
- Il sorgente è di al massimo 64 KiB.
- `struct Uniforms` occupa al massimo 4096 byte, con membri dei tipi indicati nella tabella sopra.
- Un frame è di al massimo 4096 pixel per lato: una view più grande disegna il proprio shader a una scala inferiore.

Per il rumore, fai l'hash della cella intera in cui si trova un punto (`bitcast<vec2u>(vec2i(floor(p)))` mescolato con moltiplicazioni e xor-shift) invece di `fract(sin(…) * 43758.5)`: gli hash interi danno lo stesso valore per una cella ovunque vengano calcolati, così il value noise resta senza giunture su ogni GPU. Gli shader della galleria ne mostrano uno.

<a id="platforms"></a>

## Piattaforme

Su iOS, Android, macOS, Windows e Linux, e nelle app GPUI, NSH renderizza gli shader sulla GPU con wgpu (Metal sulle piattaforme Apple, Vulkan, Direct3D 12 o OpenGL altrove) alla scala dello schermo, e mostra ogni frame sotto i figli della view. Il rendering procede in parallelo alla UI: un frame appare uno o due frame di display dopo essere stato disegnato, e la UI resta reattiva mentre la GPU lavora. Sul web, NSH traduce lo shader in GLSL e lo disegna con WebGL 2.

Gli shader disegnano al massimo una volta per frame di display, e solo quando cambia ciò che mostrano: uno shader con uniform fisse disegna una volta, uno che legge `nsh.time` disegna a ogni frame, e uno con uniform animate disegna finché queste si muovono.

## Rust

`shader()` (da `nsh_core::element`) crea una view shader; `.source(program)` le assegna un `Shader` compilato (`nsh_core::shader::Shader::compile(source)`, che restituisce gli stessi errori visti sopra). Compila un programma una sola volta e condividilo: è economico da clonare. Il programma può essere associato (bound), `.source(move || …)`, per cambiare programma.

| Metodo | Descrizione |
|---|---|
| `.uniform(name, value)` | Imposta un membro di `struct Uniforms`: un numero, un `Color` o `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]`, o un `Vec<UniformValue>`. Un valore associato (`move \|\| …`) lo reimposta quando cambia; un valore animato (`&wave`: un numero, o colori per un `vec3f` / `vec4f`) lo muove a ogni frame, in modo nativo. |
| `.paused(bool)` | Ferma l'orologio di `nsh.time`; associabile. |

I figli si aggiungono con `.child(..)`, gli stili con i consueti metodi tipizzati. `shader_effect()`, `shader_transition()`, `screen_effect()` e `screen_transition()` creano gli altri elementi, con i metodi delle tabelle sopra.
