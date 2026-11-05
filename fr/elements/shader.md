---
title: "Shader"
description: "L'élément Shader : une vue dont la zone est dessinée par un programme GPU écrit en WGSL, sous ses enfants."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

Un shader est une vue dont la boîte est dessinée par un programme GPU : dégradés fluides, bruit et grain, plasma, aurore, feuille holographique, ondulations qui suivent un appui. Vous écrivez une seule fonction WGSL, `shade`, qui donne la couleur de chaque point de la boîte ; la plateforme l'exécute sur le GPU à la résolution de l'écran, au-dessus de l'arrière-plan de la vue et sous ses enfants. Les valeurs animées la font évoluer nativement, image par image, sans aucun travail dans le code de l'application. TSX en crée un avec `<Shader>` depuis `nsh`, Rust avec `shader().source(program)`.

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

## Le shader

Le source d'un shader est en WGSL, le langage de shading de WebGPU. Il définit une seule fonction :

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` est le point de la boîte de la vue, de `(0, 0)` à son coin supérieur gauche jusqu'à `(1, 1)` à son coin inférieur droit, avec y croissant vers le bas comme en CSS.
- Le résultat est la couleur du point : rouge, vert, bleu et alpha dans 0..1, en sRGB avec alpha droit (straight alpha), comme les couleurs CSS. Les valeurs hors de 0..1 sont ramenées dans cet intervalle.

Outre `shade`, le source contient les fonctions utilitaires, constantes et variables `var<private>` dont il a besoin. NSH fournit les points d'entrée et lit les entrées du shader à deux endroits.

<a id="built-ins"></a>

### Valeurs intégrées

| Valeur intégrée | Type | Valeur |
|---|---|---|
| `nsh.size` | `vec2f` | La taille de la vue en points. |
| `nsh.time` | `f32` | Les secondes écoulées depuis l'apparition du shader. Un shader qui la lit s'anime : il dessine à chaque image tant qu'il est à l'écran. |
| `nsh.scale` | `f32` | Les pixels par point de l'image en cours de dessin. |

`uv * nsh.size` est le point en points ; `nsh.size.x / nsh.size.y` est le rapport d'aspect, qui garde les cercles ronds dans une boîte non carrée.

### Uniforms

Les valeurs définies par l'application vont dans une struct nommée `Uniforms`, que le shader lit sous le nom `uniforms` :

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

La prop `uniforms` définit ses membres par leur nom. Chaque type accepte ces valeurs :

| Type WGSL | Valeurs |
|---|---|
| `f32`, `i32`, `u32` | Un nombre (arrondi vers zéro pour `i32` et `u32`), ou une valeur animée |
| `vec2f` | `[x, y]` : deux nombres ou valeurs animées |
| `vec3f` | Une couleur (ses composantes rouge, verte et bleue), une couleur animée, ou trois nombres |
| `vec4f` | Une couleur avec son alpha, une couleur animée, ou quatre nombres |
| `array<vec4f, N>` | Une liste d'au plus `N` couleurs (ou de quatre nombres chacune) : une palette, les stops d'un dégradé |

Les couleurs peuvent être n'importe quelle couleur CSS (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) et arrivent dans le shader sous forme de composantes sRGB dans 0..1. Les membres que l'application omet valent zéro. Définir `uniforms` à nouveau redessine le shader avec les nouvelles valeurs.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## Uniforms animés

Un uniform peut être une [valeur animée native](../modules/nsh.md#animation), ou un nœud dérivé d'une telle valeur (`interpolate`, arithmétique). La plateforme écrit sa valeur dans le shader à chaque image où elle change et redessine, sur le thread UI : l'animation tourne à la pleine fréquence d'images, quelle que soit la charge du code de l'application. Les nombres animent les membres `f32`, `i32` et `u32` ainsi que les composantes d'un `vec2f` ; une interpolation vers des couleurs anime un `vec3f` ou un `vec4f`.

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

## Mise en pause

`paused` arrête l'horloge du shader : `nsh.time` garde sa valeur et le shader conserve son image. Le remettre à `false` relance l'horloge là où elle s'était arrêtée. Les uniforms et les changements de taille redessinent quand même un shader en pause.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

Un shader qui ne lit pas `nsh.time` se dessine quand sa taille ou ses uniforms changent, et conserve son image entre-temps.

<a id="children-and-clipping"></a>

## Enfants et découpage

Un shader est un conteneur : il accepte toutes les props d'une [vue](./view.md) (styles, padding et disposition de ses enfants, props d'appui et de gestes, `onLayout`, accessibilité, `ref`), et ses enfants se dessinent par-dessus le shader. Le shader remplit la boîte de la vue comme le fait un arrière-plan, à l'intérieur de ses coins arrondis (`borderRadius`), par-dessus son `backgroundColor`.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Donnez une taille au shader via ses styles (largeur / hauteur, `flex`, un rapport d'aspect) ou laissez ses enfants la déterminer.

<a id="effects-transitions-and-the-screen"></a>

## Effets, transitions et écran

Un shader peut aussi dessiner ce que d'autres vues dessinent. Son WGSL lit alors des images grâce à quatre fonctions, chacune prenant un point `uv` de sa boîte et renvoyant une couleur sRGB droite avec alpha, transparente en dehors de l'image :

| Fonction | Lit |
|---|---|
| `sample_content(uv)` | les enfants d'un effet, ou toute la surface pour un effet d'écran |
| `sample_backdrop(uv)` | ce qui se trouve derrière la vue (tout shader peut le lire) |
| `sample_from(uv)` | le côté qu'une transition quitte |
| `sample_to(uv)` | le côté vers lequel une transition va |

`nsh.progress` est le `progress` d'un effet ou l'avancement d'une transition (0 à 1), et `nsh.overflow` indique jusqu'où le shader dessine au-delà de la boîte, en points.

**`ShaderEffect`** dessine ses enfants à travers le shader : ils conservent leurs appuis, leur focus et leur accessibilité, et ce qui s'affiche est le résultat du shader. `progress` est un nombre ou une valeur animée, qui fait évoluer l'effet nativement. `maxSampleOffset` permet au shader de dessiner autant de points au-delà de la boîte (une lueur, le bord d'un flou) ; son `uv` sort alors de l'intervalle, en dessous de 0 et au-dessus de 1. Sans `source`, les enfants se dessinent tels quels.

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

**`ShaderTransition`** transforme ses enfants à travers le shader quand `value` (une chaîne, un nombre ou un booléen) change, mais pas pour sa première valeur : `sample_from` est une image de ce qu'ils dessinaient avant, `sample_to` ce qu'ils dessinent maintenant, et `nsh.progress` va de 0 à 1 en `duration` millisecondes (300). Sans `source`, il exécute `fallback` : `"fade"` (un fondu enchaîné, par défaut) ou `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** et **`ScreenTransition`** font de même pour toute la surface (ses pages, dialogues et surcouches). Ils ne prennent aucune place et n'ont pas d'enfants ; placez-les où vous voulez dans l'application. Le dernier effet d'écran monté avec un `source` est celui qui dessine.

Les pages et les dialogues apparaissent et disparaissent à travers un shader grâce à **`transitionShader`** : `{ source, uniforms, duration }` sur un `NavPage` ou un `Dialog` (Rust : `.transition_shader(TransitionShader::new(program))` sur `nav_page()` ou `dialog()`). Quand la page est poussée ou retirée, ou le dialogue affiché ou fermé, le côté inférieur (la page en dessous, l'application sans le dialogue) est `sample_from` et le côté supérieur `sample_to` ; `nsh.progress` va de 0 à 1 quand la page ou le dialogue arrive et de 1 à 0 quand il part, si bien qu'un seul shader dessine les deux sens.

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

Le shader prend la place du `animation` de la page ou du dialogue, quel qu'il soit (`"none"` aussi). Le `animation` s'exécute sur un appareil sans GPU, quand l'utilisateur demande moins de mouvement (Reduce Motion, Remove animations), et pour un source qui ne compile pas ; avec `"none"`, le changement s'affiche alors immédiatement. Un push, pop, show ou close qui démarre pendant qu'un autre s'exécute termine d'abord celui-ci : sa page ou son dialogue arrive ou part, son `onShow` ou son `onDismiss` se déclenche, et le nouveau changement démarre à partir de là.

Les plateformes capturent les images quand ce qu'elles montrent change, au plus une fois par image d'affichage. Une image est dessinée par le moteur de rendu propre à la plateforme ; ce qu'il ne peut pas dessiner dans une image (une vidéo, une page web, la vue d'une autre application) apparaît donc transparent dedans.

## Props

Un shader accepte les props d'une [vue](./view.md), plus :

| Prop | Rust | Type | Description |
|---|---|---|---|
| `source` | `.source(program)` | `string` | Le source WGSL définissant `fn shade(uv: vec2f) -> vec4f`. Rust le compile avec `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | Les valeurs des membres de `struct Uniforms`, par nom : nombres, couleurs, valeurs animées et listes de ces éléments. |
| `paused` | `.paused(bool)` | `boolean` | Arrête l'horloge de `nsh.time`. Par défaut `false`. |

`ShaderEffect` et `ScreenEffect` acceptent celles-ci (`source` facultatif), plus :

| Prop | Rust | Type | Description |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. Par défaut 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | Jusqu'où au-delà de la boîte, en points, le shader dessine et où ses images portent (`ShaderEffect` et `ShaderTransition`). Par défaut 0. |

`ShaderTransition` et `ScreenTransition` acceptent `source`, `uniforms` et `paused`, plus :

| Prop | Rust | Type | Description |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | Quand elle change, la transition s'exécute (pas pour la première valeur). |
| `duration` | `.duration(Duration)` | `number` | Sa durée, en millisecondes. Par défaut 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | Ce qui s'exécute sans `source`. Par défaut `"fade"`. |

`NavPage` et `Dialog` acceptent :

| Prop | Rust | Type | Description |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | Le shader à travers lequel la page ou le dialogue apparaît et disparaît, à la place de son `animation`. `duration` en millisecondes, 350 par défaut. |

<a id="errors"></a>

## Erreurs

NSH vérifie chaque shader quand son source est défini, avant qu'il n'atteigne le GPU. Un shader qui ne compile pas journalise un avertissement avec la ligne et la colonne dans son source et la nature du problème, par exemple :

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

La vue affiche alors son arrière-plan et ses enfants. Un uniform absent de la struct, ou une valeur que son type n'accepte pas, journalise un avertissement nommant l'uniform, et les autres uniforms s'appliquent.

Chaque source ne compile qu'une fois : les vues qui partagent un source, et un source redéfini, utilisent le shader compilé.

<a id="rules-and-limits"></a>

## Règles et limites

- `shade` a exactement la signature `fn shade(uv: vec2f) -> vec4f`. Le source déclare ses propres fonctions, constantes, structs et variables `var<private>` ; NSH fournit les points d'entrée et les bindings.
- Le source fait au plus 64 KiB.
- `struct Uniforms` occupe au plus 4096 octets, avec des membres des types du tableau ci-dessus.
- Une image fait au plus 4096 pixels de côté : une vue plus grande dessine son shader à une échelle plus basse.

Pour le bruit, hachez la cellule entière dans laquelle se trouve un point (`bitcast<vec2u>(vec2i(floor(p)))` mélangé avec des multiplications et des xor-shifts) plutôt que `fract(sin(…) * 43758.5)` : les hachages entiers donnent la même valeur pour une cellule partout où elle est calculée, de sorte que le bruit de valeur reste continu sur tous les GPU. Les shaders de la galerie en montrent un.

<a id="platforms"></a>

## Plateformes

Sur iOS, Android, macOS, Windows et Linux, ainsi que dans les applications GPUI, NSH rend les shaders sur le GPU avec wgpu (Metal sur les plateformes Apple, Vulkan, Direct3D 12 ou OpenGL ailleurs) à l'échelle de l'écran, et affiche chaque image sous les enfants de la vue. Le rendu s'exécute en parallèle de l'UI : une image apparaît une ou deux images d'affichage après avoir été dessinée, et l'UI reste réactive pendant que le GPU travaille. Sur le web, NSH traduit le shader en GLSL et le dessine avec WebGL 2.

Les shaders dessinent au plus une fois par image d'affichage, et seulement quand ce qu'ils montrent change : un shader aux uniforms fixes dessine une fois, un shader qui lit `nsh.time` dessine à chaque image, et un shader aux uniforms animés dessine tant qu'ils bougent.

## Rust

`shader()` (depuis `nsh_core::element`) crée une vue shader ; `.source(program)` lui donne un `Shader` compilé (`nsh_core::shader::Shader::compile(source)`, qui renvoie les mêmes erreurs que ci-dessus). Compilez un programme une seule fois et partagez-le : il est peu coûteux à cloner. Le programme peut être lié, `.source(move || …)`, pour changer de programme.

| Méthode | Description |
|---|---|
| `.uniform(name, value)` | Définit un membre de `struct Uniforms` : un nombre, un `Color` ou `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]`, ou un `Vec<UniformValue>`. Une valeur liée (`move \|\| …`) le redéfinit quand elle change ; une valeur animée (`&wave` : un nombre, ou des couleurs pour un `vec3f` / `vec4f`) le fait évoluer à chaque image, nativement. |
| `.paused(bool)` | Arrête l'horloge de `nsh.time` ; peut être liée. |

Les enfants s'ajoutent avec `.child(..)`, les styles avec les méthodes typées habituelles. `shader_effect()`, `shader_transition()`, `screen_effect()` et `screen_transition()` créent les autres éléments, avec les méthodes des tableaux ci-dessus.
