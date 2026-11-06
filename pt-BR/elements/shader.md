---
title: "Shader"
description: "O elemento Shader: uma view cujo retângulo é desenhado por um programa de GPU escrito em WGSL, sob seus filhos."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---


# Shader

Um shader é uma view cuja caixa é desenhada por um programa de GPU: gradientes que fluem, ruído e granulação, plasma, aurora, folha holográfica, ondulações que seguem um toque. Você escreve uma função WGSL, `shade`, que dá a cor de cada ponto da caixa; a plataforma a executa na GPU na resolução da tela, sobre o fundo da view e sob os seus filhos. Valores animados a movem de forma nativa, quadro a quadro, sem trabalho no código do app. Em TSX, cria-se um com `<Shader>` de `nsh`; em Rust, com `shader().source(program)`.

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

## O shader

O código-fonte de um shader é WGSL, a linguagem de shading do WebGPU. Ele define uma função:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` é o ponto da caixa da view, de `(0, 0)` no canto superior esquerdo até `(1, 1)` no canto inferior direito, com y crescendo para baixo, como no CSS.
- O resultado é a cor do ponto: vermelho, verde, azul e alfa em 0..1, em sRGB com alfa direto (straight alpha), como as cores CSS. Valores fora de 0..1 são limitados ao intervalo.

Ao lado de `shade`, o código-fonte contém as funções auxiliares, constantes e variáveis `var<private>` de que precisar. O NSH fornece os pontos de entrada e lê as entradas do shader de dois lugares.

### Built-ins

| Built-in | Tipo | Valor |
|---|---|---|
| `nsh.size` | `vec2f` | O tamanho da view em pontos. |
| `nsh.time` | `f32` | Segundos desde que o shader apareceu. Um shader que o lê é animado: ele desenha a cada quadro enquanto estiver na tela. |
| `nsh.scale` | `f32` | Pixels por ponto do quadro que está sendo desenhado. |

`uv * nsh.size` é o ponto em pontos; `nsh.size.x / nsh.size.y` é a proporção (aspect ratio), que mantém os círculos redondos em uma caixa que não é quadrada.

### Uniforms

Os valores definidos pelo app ficam em uma struct chamada `Uniforms`, que o shader lê como `uniforms`:

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

A prop `uniforms` define seus membros por nome. Cada tipo aceita estes valores:

| Tipo WGSL | Valores |
|---|---|
| `f32`, `i32`, `u32` | Um número (arredondado para zero em `i32` e `u32`) ou um valor animado |
| `vec2f` | `[x, y]`: dois números ou valores animados |
| `vec3f` | Uma cor (seu vermelho, verde e azul), uma cor animada ou três números |
| `vec4f` | Uma cor com seu alfa, uma cor animada ou quatro números |
| `array<vec4f, N>` | Uma lista de até `N` cores (ou de quatro números cada): uma paleta, os pontos de parada (stops) de um gradiente |

As cores podem ser qualquer cor CSS (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) e chegam ao shader como componentes sRGB em 0..1. Os membros que o app omite valem zero. Definir `uniforms` novamente desenha o shader outra vez com os novos valores.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## Uniforms animados

Um uniform pode ser um [valor animado nativo](../modules/nsh.md#animation) ou um nó derivado de um (`interpolate`, aritmética). A plataforma grava seu valor no shader a cada quadro em que ele muda e desenha novamente, na thread de UI: a animação roda na taxa de quadros máxima, por mais ocupado que esteja o código do app. Números animam os membros `f32`, `i32` e `u32` e os componentes de um `vec2f`; uma interpolação para cores anima um `vec3f` ou `vec4f`.

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

`paused` interrompe o relógio do shader: `nsh.time` mantém seu valor e o shader preserva sua imagem. Voltar a defini-lo como `false` reinicia o relógio de onde ele parou. Mudanças nos uniforms e no tamanho ainda desenham um shader pausado.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

Um shader que não lê `nsh.time` desenha quando seu tamanho ou seus uniforms mudam e mantém sua imagem nesse meio-tempo.

<a id="children-and-clipping"></a>

## Filhos e recorte

Um shader é um contêiner: ele aceita todas as props de uma [view](./view.md) (estilos, padding e layout dos filhos, props de toque e de gestos, `onLayout`, acessibilidade, `ref`), e seus filhos são desenhados sobre o shader. O shader preenche a caixa da view como um fundo faz, dentro dos cantos arredondados (`borderRadius`), sobre o seu `backgroundColor`.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Dê um tamanho ao shader por meio de seus estilos (largura / altura, `flex`, uma proporção) ou deixe que seus filhos o dimensionem.

<a id="effects-transitions-and-the-screen"></a>

## Efeitos, transições e a tela

Um shader também pode desenhar o que outras views desenham. Seu WGSL então lê imagens por meio de quatro funções, cada uma recebendo um ponto `uv` de sua caixa e retornando uma cor sRGB direta com alfa, transparente fora da imagem:

| Função | Lê |
|---|---|
| `sample_content(uv)` | os filhos de um efeito, ou a superfície inteira em um efeito de tela |
| `sample_backdrop(uv)` | o que está atrás da view (qualquer shader pode lê-lo) |
| `sample_from(uv)` | o lado de uma transição do qual ela sai |
| `sample_to(uv)` | o lado de uma transição para o qual ela vai |

`nsh.progress` é o `progress` de um efeito ou o quanto uma transição avançou (0 a 1), e `nsh.overflow` é o quanto além da caixa o shader desenha, em pontos.

**`ShaderEffect`** desenha seus filhos através do shader: eles mantêm seus toques, foco e acessibilidade, e o que aparece é o resultado do shader. `progress` é um número ou um valor animado, que move o efeito de forma nativa. `maxSampleOffset` permite que o shader desenhe essa quantidade de pontos além da caixa (um brilho, a borda de um blur); seu `uv` então fica abaixo de 0 e acima de 1. Sem `source`, os filhos são desenhados como estão.

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

**`ShaderTransition`** altera seus filhos através do shader quando `value` (uma string, número ou booleano) muda, e não para o seu primeiro valor: `sample_from` é uma imagem do que eles desenhavam antes, `sample_to` o que desenham agora, e `nsh.progress` vai de 0 a 1 ao longo de `duration` milissegundos (300). Sem `source`, ele executa `fallback`: `"fade"` (um cross-fade, o padrão) ou `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** e **`ScreenTransition`** fazem o mesmo para a superfície inteira (suas páginas, diálogos e sobreposições). Eles não ocupam espaço e não têm filhos; coloque-os em qualquer lugar do app. O último efeito de tela montado com um `source` é o que desenha.

Páginas e diálogos entram e saem através de um shader com **`transitionShader`**: `{ source, uniforms, duration }` em um `NavPage` ou um `Dialog` (Rust: `.transition_shader(TransitionShader::new(program))` em `nav_page()` ou `dialog()`). Quando a página é empilhada ou desempilhada, ou o diálogo é exibido ou fechado, o lado inferior (a página embaixo dele, o app sem o diálogo) é `sample_from` e o superior é `sample_to`; `nsh.progress` vai de 0 a 1 conforme a página ou o diálogo chega e de 1 a 0 conforme sai, de modo que um único shader desenha nos dois sentidos.

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

O shader toma o lugar do `animation` da página ou do diálogo, seja ele qual for (`"none"` também). O `animation` é executado em um dispositivo sem GPU, quando o usuário pede menos movimento (Reduce Motion, Remove animations) e para um código-fonte que não compila; com `"none"`, a mudança então aparece imediatamente. Um push, pop, show ou close que começa enquanto outro está em execução conclui o anterior primeiro: sua página ou diálogo chega ou sai, seu `onShow` ou `onDismiss` é disparado, e a nova mudança começa a partir daí.

As plataformas capturam as imagens quando o que elas mostram muda, no máximo uma vez por quadro de exibição. Uma imagem é desenhada pelo renderizador da própria plataforma, então o que ele não consegue desenhar em uma imagem (um vídeo, uma página web, a view de outro app) aparece transparente nela.

## Props

Um shader aceita as props de uma [view](./view.md) mais:

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `source` | `.source(program)` | `string` | O código-fonte WGSL que define `fn shade(uv: vec2f) -> vec4f`. O Rust o compila com `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | Os valores dos membros de `struct Uniforms`, por nome: números, cores, valores animados e listas deles. |
| `paused` | `.paused(bool)` | `boolean` | Interrompe o relógio de `nsh.time`. Padrão `false`. |

`ShaderEffect` e `ScreenEffect` aceitam essas (`source` opcional) mais:

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. Padrão 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | Quanto além da caixa, em pontos, o shader desenha e suas imagens alcançam (`ShaderEffect` e `ShaderTransition`). Padrão 0. |

`ShaderTransition` e `ScreenTransition` aceitam `source`, `uniforms` e `paused` mais:

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | Quando ela muda, a transição é executada (não para o primeiro valor). |
| `duration` | `.duration(Duration)` | `number` | Quanto tempo ela dura, em milissegundos. Padrão 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | O que é executado sem um `source`. Padrão `"fade"`. |

`NavPage` e `Dialog` aceitam:

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | O shader pelo qual a página ou o diálogo entra e sai no lugar de seu `animation`. `duration` em milissegundos, 350 por padrão. |

<a id="errors"></a>

## Erros

O NSH verifica cada shader quando seu código-fonte é definido, antes de chegar à GPU. Um shader que não compila registra um aviso com a linha e a coluna no código-fonte e o que está errado, por exemplo:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

A view então mostra seu fundo e seus filhos. Um uniform que a struct não tem, ou um valor que seu tipo não aceita, registra um aviso com o nome do uniform, e os demais uniforms são aplicados.

Cada código-fonte é compilado uma vez: views que compartilham um código-fonte, e um código-fonte definido novamente, usam o shader compilado.

<a id="rules-and-limits"></a>

## Regras e limites

- `shade` tem exatamente a assinatura `fn shade(uv: vec2f) -> vec4f`. O código-fonte declara suas próprias funções, constantes, structs e variáveis `var<private>`; o NSH fornece os pontos de entrada e os bindings.
- O código-fonte tem no máximo 64 KiB.
- `struct Uniforms` aceita no máximo 4096 bytes, com membros dos tipos da tabela acima.
- Um quadro tem no máximo 4096 pixels por lado: uma view maior desenha seu shader em uma escala menor.

Para ruído, calcule o hash da célula inteira em que um ponto está (`bitcast<vec2u>(vec2i(floor(p)))` combinado com multiplicações e xor-shifts) em vez de `fract(sin(…) * 43758.5)`: hashes de inteiros dão o mesmo valor para uma célula em qualquer lugar onde são calculados, de modo que o value noise permanece contínuo em todas as GPUs. Os shaders da galeria mostram um exemplo.

<a id="platforms"></a>

## Plataformas

No iOS, Android, macOS, Windows e Linux, e em apps GPUI, o NSH renderiza shaders na GPU com wgpu (Metal nas plataformas Apple, Vulkan, Direct3D 12 ou OpenGL nas demais) na escala da tela, e mostra cada quadro sob os filhos da view. A renderização roda em paralelo à UI: um quadro aparece um ou dois quadros de exibição depois de ser desenhado, e a UI permanece responsiva enquanto a GPU trabalha. Na web, o NSH traduz o shader para GLSL e o desenha com WebGL 2.

Shaders desenham no máximo uma vez por quadro de exibição, e apenas quando o que eles mostram muda: um shader com uniforms fixos desenha uma vez, um que lê `nsh.time` desenha a cada quadro, e um com uniforms animados desenha enquanto eles se movem.

## Rust

`shader()` (de `nsh_core::element`) cria uma view de shader; `.source(program)` entrega a ela um `Shader` compilado (`nsh_core::shader::Shader::compile(source)`, que retorna os mesmos erros descritos acima). Compile um programa uma vez e compartilhe-o: ele é barato de clonar. O programa pode ser vinculado (bound), `.source(move || …)`, para trocar de programa.

| Método | Descrição |
|---|---|
| `.uniform(name, value)` | Define um membro de `struct Uniforms`: um número, um `Color` ou `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]`, ou um `Vec<UniformValue>`. Um valor vinculado (`move \|\| …`) o define novamente quando muda; um valor animado (`&wave`: um número, ou cores para um `vec3f` / `vec4f`) o move a cada quadro, de forma nativa. |
| `.paused(bool)` | Interrompe o relógio de `nsh.time`; pode ser vinculado. |

Os filhos são adicionados com `.child(..)`, e os estilos com os métodos tipados de sempre. `shader_effect()`, `shader_transition()`, `screen_effect()` e `screen_transition()` criam os outros elementos, com os métodos das tabelas acima.
