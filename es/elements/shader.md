---
title: "Shader"
description: "El elemento Shader: una vista cuyo recuadro es dibujado por un programa de GPU escrito en WGSL, por debajo de sus hijos."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---


# Shader

Un shader es una vista cuya caja dibuja un programa de GPU: degradados que fluyen, ruido y grano, plasma, aurora, lámina holográfica, ondas que siguen un toque. Escribes una sola función WGSL, `shade`, que da el color de cada punto de la caja; la plataforma la ejecuta en la GPU a la resolución de la pantalla, sobre el fondo de la vista y bajo sus hijos. Los valores animados la mueven de forma nativa, fotograma a fotograma, sin trabajo en el código de la app. TSX crea uno con `<Shader>` de `nsh`, Rust con `shader().source(program)`.

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

## El shader

El código fuente de un shader es WGSL, el lenguaje de shaders de WebGPU. Define una función:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` es el punto de la caja de la vista, desde `(0, 0)` en su esquina superior izquierda hasta `(1, 1)` en su esquina inferior derecha, con y creciendo hacia abajo como en CSS.
- El resultado es el color del punto: rojo, verde, azul y alfa en 0..1, en sRGB con alfa directo, como los colores CSS. Los valores fuera de 0..1 se recortan.

Junto a `shade`, el código contiene las funciones auxiliares, constantes y variables `var<private>` que necesite. NSH aporta los puntos de entrada y lee las entradas del shader desde dos lugares.

### Built-ins

| Built-in | Tipo | Valor |
|---|---|---|
| `nsh.size` | `vec2f` | El tamaño de la vista en puntos. |
| `nsh.time` | `f32` | Segundos desde que apareció el shader. Un shader que lo lee se anima: dibuja en cada fotograma mientras está en pantalla. |
| `nsh.scale` | `f32` | Píxeles por punto del fotograma que se dibuja. |

`uv * nsh.size` es el punto en puntos; `nsh.size.x / nsh.size.y` es la relación de aspecto, que mantiene redondos los círculos en una caja que no es cuadrada.

### Uniforms

Los valores que fija la app van en un struct llamado `Uniforms`, que el shader lee como `uniforms`:

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

La prop `uniforms` fija sus miembros por nombre. Cada tipo acepta estos valores:

| Tipo WGSL | Valores |
|---|---|
| `f32`, `i32`, `u32` | Un número (redondeado hacia cero para `i32` y `u32`), o un valor animado |
| `vec2f` | `[x, y]`: dos números o valores animados |
| `vec3f` | Un color (su rojo, verde y azul), un color animado, o tres números |
| `vec4f` | Un color con su alfa, un color animado, o cuatro números |
| `array<vec4f, N>` | Una lista de hasta `N` colores (o de cuatro números cada uno): una paleta, los puntos de parada de un degradado |

Los colores pueden ser cualquier color CSS (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) y llegan al shader como componentes sRGB en 0..1. Los miembros que la app omite valen cero. Al fijar `uniforms` de nuevo, el shader se dibuja otra vez con los nuevos valores.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## Uniforms animados

Un uniform puede ser un [valor animado nativo](../modules/nsh.md#animation), o un nodo derivado de uno (`interpolate`, aritmética). La plataforma escribe su valor en el shader en cada fotograma en que cambia y vuelve a dibujar, en el hilo de la UI: la animación se ejecuta a la tasa de fotogramas completa por muy ocupado que esté el código de la app. Los números animan los miembros `f32`, `i32` y `u32` y los componentes de un `vec2f`; una interpolación a colores anima un `vec3f` o `vec4f`.

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

`paused` detiene el reloj del shader: `nsh.time` conserva su valor y el shader mantiene su imagen. Al volver a ponerlo en `false`, el reloj continúa desde donde se detuvo. Los uniforms y los cambios de tamaño siguen dibujando un shader en pausa.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

Un shader que no lee `nsh.time` se dibuja cuando cambian su tamaño o sus uniforms, y mantiene su imagen entre un cambio y otro.

<a id="children-and-clipping"></a>

## Hijos y recorte

Un shader es un contenedor: acepta todas las props de una [vista](./view.md) (estilos, relleno y diseño de sus hijos, props de pulsación y de gestos, `onLayout`, accesibilidad, `ref`), y sus hijos se dibujan sobre el shader. El shader llena la caja de la vista como lo hace un fondo, dentro de sus esquinas redondeadas (`borderRadius`), sobre su `backgroundColor`.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Dale un tamaño al shader mediante sus estilos (width / height, `flex`, una relación de aspecto) o deja que sus hijos lo dimensionen.

<a id="effects-transitions-and-the-screen"></a>

## Efectos, transiciones y la pantalla

Un shader también puede dibujar lo que dibujan otras vistas. Su WGSL lee entonces imágenes mediante cuatro funciones, cada una de las cuales recibe un punto `uv` de su caja y devuelve un color sRGB con alfa directo, transparente fuera de la imagen:

| Función | Lee |
|---|---|
| `sample_content(uv)` | los hijos de un efecto, o toda la superficie en un efecto de pantalla |
| `sample_backdrop(uv)` | lo que hay detrás de la vista (cualquier shader puede leerlo) |
| `sample_from(uv)` | el lado de una transición del que se sale |
| `sample_to(uv)` | el lado de una transición al que se llega |

`nsh.progress` es el `progress` de un efecto o el avance de una transición (de 0 a 1), y `nsh.overflow` es cuánto más allá de la caja dibuja el shader, en puntos.

**`ShaderEffect`** dibuja sus hijos a través del shader: conservan sus pulsaciones, foco y accesibilidad, y lo que se muestra es el resultado del shader. `progress` es un número o un valor animado, que mueve el efecto de forma nativa. `maxSampleOffset` permite que el shader dibuje esa cantidad de puntos más allá de la caja (un resplandor, el borde de un desenfoque); su `uv` pasa entonces a valores por debajo de 0 y por encima de 1. Sin `source`, los hijos se dibujan tal cual.

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

**`ShaderTransition`** cambia sus hijos a través del shader cuando cambia `value` (una cadena, un número o un booleano), no con su primer valor: `sample_from` es una imagen de lo que dibujaban antes, `sample_to` lo que dibujan ahora, y `nsh.progress` va de 0 a 1 durante `duration` milisegundos (300). Sin `source` ejecuta `fallback`: `"fade"` (un fundido cruzado, el valor por defecto) o `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** y **`ScreenTransition`** hacen lo mismo con toda la superficie (sus páginas, diálogos y superposiciones). No ocupan espacio y no tienen hijos; colócalos en cualquier lugar de la app. Se dibuja el último efecto de pantalla montado con un `source`.

Las páginas y los diálogos entran y salen a través de un shader con **`transitionShader`**: `{ source, uniforms, duration }` en un `NavPage` o un `Dialog` (Rust: `.transition_shader(TransitionShader::new(program))` en `nav_page()` o `dialog()`). Cuando se apila o se desapila la página, o se muestra o se cierra el diálogo, el lado inferior (la página que queda debajo, la app sin el diálogo) es `sample_from` y el superior `sample_to`; `nsh.progress` va de 0 a 1 cuando la página o el diálogo llega y de 1 a 0 cuando se va, de modo que un solo shader dibuja ambos sentidos.

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

El shader ocupa el lugar de `animation` de la página o del diálogo, sea cual sea (también `"none"`). El `animation` se ejecuta en un dispositivo sin GPU, cuando el usuario pide menos movimiento (Reduce Motion, Remove animations) y con un código fuente que no compila; con `"none"` el cambio se muestra entonces de inmediato. Un push, pop, show o close que empieza mientras otro se ejecuta completa primero ese: su página o diálogo llega o se va, se dispara su `onShow` o `onDismiss`, y el nuevo cambio empieza desde ahí.

Las plataformas toman las imágenes cuando cambia lo que muestran, como máximo una vez por fotograma de pantalla. Una imagen la dibuja el propio renderizador de la plataforma, así que lo que este no puede dibujar en una imagen (un vídeo, una página web, la vista de otra app) aparece transparente en ella.

## Props

Un shader acepta las props de una [vista](./view.md) más:

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `source` | `.source(program)` | `string` | El código WGSL que define `fn shade(uv: vec2f) -> vec4f`. Rust lo compila con `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | Los valores de los miembros de `struct Uniforms`, por nombre: números, colores, valores animados y listas de ellos. |
| `paused` | `.paused(bool)` | `boolean` | Detiene el reloj de `nsh.time`. Por defecto `false`. |

`ShaderEffect` y `ScreenEffect` aceptan esas (`source` opcional) más:

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. Por defecto 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | Cuánto más allá de la caja, en puntos, dibuja el shader y llegan sus imágenes (`ShaderEffect` y `ShaderTransition`). Por defecto 0. |

`ShaderTransition` y `ScreenTransition` aceptan `source`, `uniforms` y `paused` más:

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | Cuando cambia, se ejecuta la transición (no con el primer valor). |
| `duration` | `.duration(Duration)` | `number` | Cuánto dura, en milisegundos. Por defecto 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | Lo que se ejecuta sin un `source`. Por defecto `"fade"`. |

`NavPage` y `Dialog` aceptan:

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | El shader a través del cual la página o el diálogo entra y sale, en lugar de su `animation`. `duration` en milisegundos, 350 por defecto. |

<a id="errors"></a>

## Errores

NSH comprueba cada shader cuando se fija su código fuente, antes de que llegue a la GPU. Un shader que no compila registra una advertencia con la línea y la columna en su código y qué está mal, por ejemplo:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

La vista muestra entonces su fondo y sus hijos. Un uniform que el struct no tiene, o un valor que su tipo no acepta, registra una advertencia con el nombre del uniform, y los demás uniforms se aplican.

Cada código fuente se compila una sola vez: las vistas que comparten un código fuente, y un código fuente fijado de nuevo, usan el shader ya compilado.

<a id="rules-and-limits"></a>

## Reglas y límites

- `shade` tiene exactamente la firma `fn shade(uv: vec2f) -> vec4f`. El código declara sus propias funciones, constantes, structs y variables `var<private>`; NSH aporta los puntos de entrada y los bindings.
- El código fuente ocupa como máximo 64 KiB.
- `struct Uniforms` ocupa como máximo 4096 bytes, con miembros de los tipos de la tabla anterior.
- Un fotograma mide como máximo 4096 píxeles por lado: una vista mayor dibuja su shader a una escala menor.

Para el ruido, calcula el hash de la celda entera en la que está un punto (`bitcast<vec2u>(vec2i(floor(p)))` mezclado con multiplicaciones y xor-shifts) en lugar de `fract(sin(…) * 43758.5)`: los hashes enteros dan el mismo valor para una celda en cualquier lugar donde se calculen, así que el ruido de valor no tiene costuras en ninguna GPU. Los shaders de la galería muestran un ejemplo.

<a id="platforms"></a>

## Plataformas

En iOS, Android, macOS, Windows y Linux, y en apps GPUI, NSH renderiza los shaders en la GPU con wgpu (Metal en las plataformas de Apple; Vulkan, Direct3D 12 u OpenGL en el resto) a la escala de la pantalla, y muestra cada fotograma bajo los hijos de la vista. El renderizado se ejecuta en paralelo a la UI: un fotograma aparece uno o dos fotogramas de pantalla después de dibujarse, y la UI sigue respondiendo mientras trabaja la GPU. En la web, NSH traduce el shader a GLSL y lo dibuja con WebGL 2.

Los shaders dibujan como máximo una vez por fotograma de pantalla, y solo cuando cambia lo que muestran: un shader con uniforms fijos se dibuja una vez, uno que lee `nsh.time` se dibuja en cada fotograma, y uno con uniforms animados se dibuja mientras estos se mueven.

## Rust

`shader()` (de `nsh_core::element`) crea una vista de shader; `.source(program)` le da un `Shader` compilado (`nsh_core::shader::Shader::compile(source)`, que devuelve los mismos errores que se describieron antes). Compila un programa una vez y compártelo: clonarlo es barato. El programa puede ser enlazable, `.source(move || …)`, para cambiar de programa.

| Método | Descripción |
|---|---|
| `.uniform(name, value)` | Fija un miembro de `struct Uniforms`: un número, un `Color` o `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]`, o un `Vec<UniformValue>`. Un valor enlazado (`move \|\| …`) lo fija de nuevo cuando cambia; un valor animado (`&wave`: un número, o colores para un `vec3f` / `vec4f`) lo mueve en cada fotograma, de forma nativa. |
| `.paused(bool)` | Detiene el reloj de `nsh.time`; enlazable. |

Los hijos se añaden con `.child(..)`, los estilos con los métodos tipados habituales. `shader_effect()`, `shader_transition()`, `screen_effect()` y `screen_transition()` crean los demás elementos, con los métodos de las tablas anteriores.
