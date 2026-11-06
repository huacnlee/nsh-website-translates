---
title: "Shader"
description: "Shader 요소: 자식 요소 아래에서 WGSL로 작성된 GPU 프로그램이 박스를 그리는 뷰입니다."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

Shader는 GPU 프로그램이 박스를 그리는 뷰입니다. 흐르는 그라디언트, 노이즈와 그레인, 플라즈마, 오로라, 홀로그램 포일, 탭을 따라가는 물결 효과 등이 해당합니다. 뷰 박스의 각 지점에 대한 색을 반환하는 WGSL 함수 `shade` 하나를 작성하면, 플랫폼이 화면 해상도로 GPU에서 이를 실행하여 뷰의 배경 위, 자식 아래에 그립니다. 애니메이션 값은 앱 코드에서 별도 작업 없이 프레임마다 네이티브로 셰이더를 움직입니다. TSX에서는 `nsh`의 `<Shader>`로, Rust에서는 `shader().source(program)`로 만듭니다.

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

## 셰이더

셰이더의 소스는 WebGPU의 셰이딩 언어인 WGSL입니다. 소스는 다음 함수 하나를 정의합니다.

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv`은 뷰 박스 안의 지점이며, 왼쪽 위 모서리의 `(0, 0)`부터 오른쪽 아래 모서리의 `(1, 1)`까지입니다. y는 CSS와 같이 아래쪽으로 증가합니다.
- 결과는 해당 지점의 색이며, CSS 색상과 마찬가지로 straight alpha를 사용하는 sRGB의 red, green, blue, alpha를 0..1 범위로 나타냅니다. 0..1을 벗어난 값은 범위 안으로 고정됩니다.

`shade` 옆에는 필요한 보조 함수, 상수, `var<private>` 변수를 얼마든지 둘 수 있습니다. NSH가 진입점을 제공하며, 셰이더의 입력은 두 곳에서 읽습니다.

<a id="built-ins"></a>

### 내장 값

| 내장 값 | 타입 | 값 |
|---|---|---|
| `nsh.size` | `vec2f` | 뷰의 크기(포인트 단위). |
| `nsh.time` | `f32` | 셰이더가 나타난 이후의 경과 시간(초). 이 값을 읽는 셰이더는 애니메이션되며, 화면에 있는 동안 매 프레임 그립니다. |
| `nsh.scale` | `f32` | 그려지는 프레임의 포인트당 픽셀 수. |

`uv * nsh.size`은 포인트 단위의 지점이고, `nsh.size.x / nsh.size.y`은 종횡비로, 정사각형이 아닌 박스에서도 원이 둥글게 유지되도록 합니다.

<a id="uniforms"></a>

### 유니폼

앱이 설정하는 값은 `Uniforms`이라는 이름의 구조체에 넣으며, 셰이더는 이를 `uniforms`로 읽습니다.

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

`uniforms` prop이 멤버를 이름으로 설정합니다. 각 타입이 받는 값은 다음과 같습니다.

| WGSL 타입 | 값 |
|---|---|
| `f32`, `i32`, `u32` | 숫자(`i32` 및 `u32`의 경우 0 방향으로 버림) 또는 애니메이션 값 |
| `vec2f` | `[x, y]`: 숫자 또는 애니메이션 값 두 개 |
| `vec3f` | 색상(red, green, blue), 애니메이션 색상 또는 숫자 세 개 |
| `vec4f` | alpha를 포함한 색상, 애니메이션 색상 또는 숫자 네 개 |
| `array<vec4f, N>` | 최대 `N`개의 색상(또는 각각 숫자 네 개) 목록: 팔레트, 그라디언트의 스톱 |

색상은 모든 CSS 색상(`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`)을 사용할 수 있으며, 0..1 범위의 sRGB 구성 요소로 셰이더에 전달됩니다. 앱이 생략한 멤버는 0입니다. `uniforms`을 다시 설정하면 새 값으로 셰이더를 다시 그립니다.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## 애니메이션 유니폼

유니폼은 [네이티브 애니메이션 값](../modules/nsh.md#animation) 또는 그로부터 파생된 노드(`interpolate`, 산술 연산)가 될 수 있습니다. 플랫폼은 값이 바뀔 때마다 매 프레임 셰이더에 그 값을 쓰고 다시 그리며, 이는 UI 스레드에서 이루어집니다. 앱 코드가 아무리 바빠도 애니메이션은 최대 프레임 레이트로 실행됩니다. 숫자는 `f32`, `i32`, `u32` 멤버와 `vec2f`의 구성 요소를 애니메이션합니다. 색상으로의 보간은 `vec3f` 또는 `vec4f`를 애니메이션합니다.

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

## 일시 정지

`paused`은 셰이더의 시계를 멈춥니다. `nsh.time`은 값을 유지하고 셰이더는 현재 화면을 그대로 유지합니다. 이를 다시 `false`로 설정하면 멈춘 지점부터 시계가 다시 시작됩니다. 유니폼과 크기가 바뀌면 일시 정지된 셰이더도 다시 그립니다.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

`nsh.time`을 읽지 않는 셰이더는 크기나 유니폼이 바뀔 때 그리고, 그 사이에는 화면을 그대로 유지합니다.

<a id="children-and-clipping"></a>

## 자식과 클리핑

Shader는 컨테이너입니다. [view](./view.md)의 모든 prop(스타일, 자식의 패딩과 레이아웃, 프레스 및 제스처 prop, `onLayout`, 접근성, `ref`)을 받으며, 자식은 셰이더 위에 그려집니다. 셰이더는 배경과 같은 방식으로 뷰의 박스를 채우며, 둥근 모서리(`borderRadius`) 안쪽, `backgroundColor` 위에 그려집니다.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

셰이더의 크기는 스타일(width / height, `flex`, 종횡비)로 지정하거나 자식이 결정하게 하세요.

<a id="effects-transitions-and-the-screen"></a>

## 이펙트, 전환, 화면

셰이더는 다른 뷰가 그린 내용을 그릴 수도 있습니다. 이 경우 WGSL은 네 개의 함수로 이미지를 읽으며, 각 함수는 박스의 지점 `uv`을 받아 alpha가 있는 straight sRGB 색상을 반환하고, 이미지 바깥에서는 투명을 반환합니다.

| 함수 | 읽는 대상 |
|---|---|
| `sample_content(uv)` | 이펙트의 자식, 또는 화면 이펙트의 경우 전체 서피스 |
| `sample_backdrop(uv)` | 뷰 뒤에 있는 것(모든 셰이더가 읽을 수 있음) |
| `sample_from(uv)` | 전환에서 떠나는 쪽 |
| `sample_to(uv)` | 전환에서 들어오는 쪽 |

`nsh.progress`은 이펙트의 `progress` 또는 전환의 진행 정도(0에서 1)이고, `nsh.overflow`는 셰이더가 박스 바깥으로 얼마나 멀리(포인트 단위) 그리는지를 나타냅니다.

**`ShaderEffect`**는 자식을 셰이더를 거쳐 그립니다. 자식은 프레스, 포커스, 접근성을 유지하며, 화면에 보이는 것은 셰이더의 결과입니다. `progress`은 숫자 또는 애니메이션 값이며, 이펙트를 네이티브로 움직입니다. `maxSampleOffset`는 셰이더가 박스 바깥으로 해당 포인트만큼 더 그리게 합니다(글로우, 블러의 가장자리). 이 경우 `uv`는 0 미만과 1 초과의 값을 가집니다. `source`가 없으면 자식은 있는 그대로 그려집니다.

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

**`ShaderTransition`**은 `value`(문자열, 숫자 또는 불리언)이 바뀔 때 자식을 셰이더를 거쳐 변경하며, 첫 번째 값에서는 실행되지 않습니다. `sample_from`은 이전에 그려진 내용의 이미지이고, `sample_to`은 지금 그려지는 내용이며, `nsh.progress`은 `duration`밀리초(300) 동안 0에서 1로 진행됩니다. `source`이 없으면 `fallback`을 실행합니다. 값은 `"fade"`(크로스페이드, 기본값) 또는 `"none"`입니다.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`**와 **`ScreenTransition`**는 전체 서피스(페이지, 다이얼로그, 오버레이)에 대해 같은 일을 합니다. 공간을 차지하지 않고 자식도 없으며, 앱의 어느 위치에든 둘 수 있습니다. `source`과 함께 마지막으로 마운트된 화면 이펙트가 그려집니다.

페이지와 다이얼로그는 **`transitionShader`**로 셰이더를 거쳐 나타나고 사라집니다. `NavPage` 또는 `Dialog`에 `{ source, uniforms, duration }`를 지정합니다(Rust: `nav_page()` 또는 `dialog()`에 `.transition_shader(TransitionShader::new(program))`). 페이지가 push 또는 pop되거나 다이얼로그가 표시되거나 닫힐 때, 아래쪽(그 아래의 페이지, 다이얼로그가 없는 앱)은 `sample_from`이고 위쪽은 `sample_to`입니다. `nsh.progress`은 페이지나 다이얼로그가 나타날 때 0에서 1로, 사라질 때 1에서 0으로 진행되므로 하나의 셰이더로 양방향을 그립니다.

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

셰이더는 페이지나 다이얼로그의 `animation`을 대신하며, 그것이 무엇이든(`"none"` 포함) 마찬가지입니다. `animation`은 GPU가 없는 기기, 사용자가 동작 줄이기(Reduce Motion, Remove animations)를 요청한 경우, 컴파일되지 않는 소스에 대해 실행되며, `"none"`가 있으면 이때 변경이 즉시 표시됩니다. 하나가 실행되는 동안 시작된 push, pop, show, close는 먼저 실행 중인 것을 완료합니다. 해당 페이지나 다이얼로그가 도착하거나 떠나고, `onShow` 또는 `onDismiss`이 발생하며, 새 변경은 그 시점부터 시작됩니다.

플랫폼은 표시 내용이 바뀔 때 이미지를 가져오며, 디스플레이 프레임당 최대 한 번입니다. 이미지는 플랫폼 자체 렌더러가 그리므로, 이미지에 그릴 수 없는 것(비디오, 웹 페이지, 다른 앱의 뷰)은 이미지 안에서 투명하게 나타납니다.

## Props

Shader는 [view](./view.md)의 prop에 더해 다음을 받습니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `source` | `.source(program)` | `string` | `fn shade(uv: vec2f) -> vec4f`을 정의하는 WGSL 소스. Rust는 이를 `Shader::compile(source)`로 컴파일합니다. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | `struct Uniforms` 멤버의 값을 이름으로 지정: 숫자, 색상, 애니메이션 값 및 그 목록. |
| `paused` | `.paused(bool)` | `boolean` | `nsh.time`의 시계를 멈춥니다. 기본값 `false`. |

`ShaderEffect`와 `ScreenEffect`는 위 prop(`source`은 선택 사항)에 더해 다음을 받습니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. 기본값 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | 셰이더가 그리고 이미지가 닿는 박스 바깥 범위(포인트 단위)(`ShaderEffect` 및 `ShaderTransition`). 기본값 0. |

`ShaderTransition`와 `ScreenTransition`는 `source`, `uniforms`, `paused`에 더해 다음을 받습니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | 값이 바뀌면 전환이 실행됩니다(첫 번째 값에서는 실행되지 않음). |
| `duration` | `.duration(Duration)` | `number` | 실행 시간(밀리초). 기본값 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | `source` 없이 실행되는 것. 기본값 `"fade"`. |

`NavPage`와 `Dialog`는 다음을 받습니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 페이지나 다이얼로그가 `animation` 대신 거쳐서 나타나고 사라지는 셰이더. `duration`은 밀리초 단위이며 기본값은 350입니다. |

<a id="errors"></a>

## 오류

NSH는 셰이더의 소스가 설정될 때 GPU에 전달되기 전에 모든 셰이더를 검사합니다. 컴파일되지 않는 셰이더는 소스의 줄과 열, 그리고 무엇이 잘못되었는지를 담은 경고를 로그로 남깁니다. 예를 들면 다음과 같습니다.

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

이 경우 뷰는 배경과 자식을 표시합니다. 구조체에 없는 유니폼이나 해당 타입이 받지 않는 값은 유니폼 이름을 명시한 경고를 로그로 남기며, 나머지 유니폼은 적용됩니다.

각 소스는 한 번만 컴파일됩니다. 소스를 공유하는 뷰와 다시 설정된 소스는 컴파일된 셰이더를 사용합니다.

<a id="rules-and-limits"></a>

## 규칙과 제한

- `shade`는 정확히 `fn shade(uv: vec2f) -> vec4f` 시그니처를 가집니다. 소스는 자체 함수, 상수, 구조체, `var<private>` 변수를 선언하며, NSH가 진입점과 바인딩을 제공합니다.
- 소스는 최대 64 KiB입니다.
- `struct Uniforms`는 최대 4096바이트이며, 멤버는 위 표의 타입이어야 합니다.
- 프레임은 한 변이 최대 4096픽셀입니다. 더 큰 뷰는 셰이더를 더 낮은 스케일로 그립니다.

노이즈에는 `fract(sin(…) * 43758.5)` 대신, 지점이 속한 정수 셀을 해시하세요(`bitcast<vec2u>(vec2i(floor(p)))`을 곱셈과 xor-shift로 섞음). 정수 해시는 셀이 계산되는 모든 곳에서 같은 값을 내므로, 모든 GPU에서 value noise가 끊김 없이 이어집니다. 갤러리의 셰이더 중에 예시가 있습니다.

<a id="platforms"></a>

## 플랫폼

iOS, Android, macOS, Windows, Linux와 GPUI 앱에서 NSH는 wgpu(Apple 플랫폼에서는 Metal, 그 외에서는 Vulkan, Direct3D 12 또는 OpenGL)로 화면 스케일에 맞춰 GPU에서 셰이더를 렌더링하고, 각 프레임을 뷰의 자식 아래에 표시합니다. 렌더링은 UI와 나란히 실행됩니다. 프레임은 그려진 뒤 한두 디스플레이 프레임 후에 나타나며, GPU가 작업하는 동안에도 UI는 반응성을 유지합니다. 웹에서는 NSH가 셰이더를 GLSL로 변환하여 WebGL 2로 그립니다.

셰이더는 디스플레이 프레임당 최대 한 번, 표시 내용이 바뀔 때만 그립니다. 고정된 유니폼을 가진 셰이더는 한 번 그리고, `nsh.time`을 읽는 셰이더는 매 프레임 그리며, 애니메이션 유니폼을 가진 셰이더는 유니폼이 움직이는 동안 그립니다.

## Rust

`shader()`(`nsh_core::element`에서 제공)는 셰이더 뷰를 만들고, `.source(program)`은 컴파일된 `Shader`(`nsh_core::shader::Shader::compile(source)`, 위와 같은 오류를 반환)를 제공합니다. 프로그램은 한 번 컴파일하여 공유하세요. 복제 비용이 저렴합니다. 프로그램은 `.source(move || …)`로 바인딩하여 프로그램을 전환할 수 있습니다.

| 메서드 | 설명 |
|---|---|
| `.uniform(name, value)` | `struct Uniforms`의 멤버를 설정합니다: 숫자, `Color` 또는 `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]`, 또는 `Vec<UniformValue>`. 바인딩된 값(`move \|\| …`)은 변경될 때 다시 설정되며, 애니메이션 값(`&wave`: 숫자, 또는 `vec3f` / `vec4f`용 색상)은 매 프레임 네이티브로 멤버를 움직입니다. |
| `.paused(bool)` | `nsh.time`의 시계를 멈춥니다. 바인딩 가능. |

자식은 `.child(..)`로 추가하고 스타일은 일반적인 타입 지정 메서드로 지정합니다. `shader_effect()`, `shader_transition()`, `screen_effect()`, `screen_transition()`은 위 표의 메서드와 함께 나머지 요소를 만듭니다.
