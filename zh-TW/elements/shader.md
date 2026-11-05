---
title: "Shader"
description: "Shader 元素：一種由以 WGSL 撰寫的 GPU 程式在其方框內繪製內容的檢視，繪製內容位於其子元素之下。"
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

Shader 是一種視圖，其範圍由 GPU 程式繪製：流動的漸層、雜訊與顆粒、電漿、極光、全像箔紙，以及跟隨點按的漣漪。你只需撰寫一個 WGSL 函式 `shade`，它會給出視圖範圍內每個點的顏色；平台以螢幕解析度在 GPU 上執行它，繪製於視圖的背景之上、子元件之下。動畫值會以原生方式逐幀驅動它，不需要應用程式碼額外處理。TSX 使用 `nsh` 中的 `<Shader>` 建立，Rust 則使用 `shader().source(program)`。

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

## 著色器

著色器的原始碼是 WGSL，也就是 WebGPU 的著色語言。它定義一個函式：

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` 是視圖範圍內的點，從左上角的 `(0, 0)` 到右下角的 `(1, 1)`，y 軸向下增長，與 CSS 相同。
- 回傳值是該點的顏色：紅、綠、藍與 alpha，範圍為 0..1，採用 sRGB 與直通 alpha（straight alpha），與 CSS 顏色相同。超出 0..1 的值會被截斷。

除了 `shade`，原始碼還可以包含所需的任何輔助函式、常數與 `var<private>` 變數。NSH 會提供進入點，並從兩個地方讀取著色器的輸入。

<a id="built-ins"></a>

### 內建值

| 內建值 | 型別 | 值 |
|---|---|---|
| `nsh.size` | `vec2f` | 視圖的大小，單位為 point。 |
| `nsh.time` | `f32` | 自著色器出現以來經過的秒數。讀取它的著色器會產生動畫：只要在螢幕上，就會逐幀繪製。 |
| `nsh.scale` | `f32` | 正在繪製的影格中，每個 point 對應的像素數。 |

`uv * nsh.size` 是以 point 為單位的點；`nsh.size.x / nsh.size.y` 是長寬比，可讓圓形在非正方形的範圍內保持正圓。

### Uniforms

由應用程式設定的值放在名為 `Uniforms` 的結構中，著色器以 `uniforms` 讀取：

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

`uniforms` 屬性會依名稱設定其成員。各型別接受的值如下：

| WGSL 型別 | 值 |
|---|---|
| `f32`、`i32`、`u32` | 一個數字（`i32` 與 `u32` 會向零捨入），或動畫值 |
| `vec2f` | `[x, y]`：兩個數字或動畫值 |
| `vec3f` | 一個顏色（取其紅、綠、藍）、動畫顏色，或三個數字 |
| `vec4f` | 含 alpha 的顏色、動畫顏色，或四個數字 |
| `array<vec4f, N>` | 最多 `N` 個顏色的清單（或每個為四個數字的清單）：調色盤、漸層的色標 |

顏色可以是任何 CSS 顏色（`"#38bdf8"`、`"rgb(56 189 248)"`、`"hsl(199 93% 60%)"`），並以 0..1 的 sRGB 分量傳入著色器。應用程式未提供的成員為零。再次設定 `uniforms` 會以新值重新繪製著色器。

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## 動畫 uniforms

uniform 可以是[原生動畫值](../modules/nsh.md#animation)，或由其衍生的節點（`interpolate`、算術運算）。每當值改變時，平台會在 UI 執行緒上把它寫入著色器並重新繪製：無論應用程式碼多麼繁忙，動畫都以完整影格率執行。數字可驅動 `f32`、`i32` 與 `u32` 成員，以及 `vec2f` 的各分量；對顏色的插值則可驅動 `vec3f` 或 `vec4f`。

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

## 暫停

`paused` 會停止著色器的時鐘：`nsh.time` 保持原值，著色器維持目前的畫面。將它設回 `false` 後，時鐘會從停止處繼續。uniforms 與尺寸的變更仍會讓已暫停的著色器重新繪製。

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

不讀取 `nsh.time` 的著色器只會在尺寸或 uniforms 改變時繪製，其餘時間保持原畫面。

<a id="children-and-clipping"></a>

## 子元件與裁切

Shader 是一個容器：它接受[視圖](./view.md)的所有屬性（樣式、子元件的內距與版面配置、按壓與手勢屬性、`onLayout`、無障礙、`ref`），其子元件繪製在著色器之上。著色器如同背景一般填滿視圖的範圍，位於圓角（`borderRadius`）之內、`backgroundColor` 之上。

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

請透過樣式為著色器指定大小（寬 / 高、`flex`、長寬比），或讓其子元件決定其大小。

<a id="effects-transitions-and-the-screen"></a>

## 效果、轉場與螢幕

著色器也可以繪製其他視圖所繪製的內容。此時它的 WGSL 透過四個函式讀取圖片，每個函式接受其範圍內的點 `uv`，並回傳直通 sRGB 顏色與 alpha，圖片之外則為透明：

| 函式 | 讀取內容 |
|---|---|
| `sample_content(uv)` | 效果的子元件，或螢幕效果的整個表面 |
| `sample_backdrop(uv)` | 視圖後方的內容（任何著色器都可以讀取） |
| `sample_from(uv)` | 轉場中離開的一側 |
| `sample_to(uv)` | 轉場中進入的一側 |

`nsh.progress` 是效果的 `progress`，或轉場的進度（0 到 1）；`nsh.overflow` 是著色器在範圍之外繪製的距離，單位為 point。

**`ShaderEffect`** 透過著色器繪製其子元件：子元件保留按壓、焦點與無障礙功能，而顯示的是著色器的結果。`progress` 是數字或動畫值，會以原生方式驅動效果。`maxSampleOffset` 讓著色器在範圍之外繪製相應的 point 數（光暈、模糊的邊緣）；此時它的 `uv` 會低於 0 並高於 1。沒有 `source` 時，子元件按原樣繪製。

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

**`ShaderTransition`** 會在 `value`（字串、數字或布林值）改變時，透過著色器轉換其子元件，第一個值不會觸發：`sample_from` 是它們先前繪製內容的圖片，`sample_to` 是它們現在繪製的內容，`nsh.progress` 在 `duration` 毫秒（300）內從 0 變為 1。沒有 `source` 時，它執行 `fallback`：`"fade"`（交叉淡化，預設值）或 `"none"`。

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** 與 **`ScreenTransition`** 對整個表面（其頁面、對話框與浮層）執行相同的操作。它們不佔空間也沒有子元件；可以放在應用程式的任何位置。最後一個掛載且帶有 `source` 的螢幕效果會被繪製。

頁面與對話框可以透過 **`transitionShader`** 以著色器出現與消失：在 `NavPage` 或 `Dialog` 上使用 `{ source, uniforms, duration }`（Rust：在 `nav_page()` 或 `dialog()` 上使用 `.transition_shader(TransitionShader::new(program))`）。當頁面被推入或彈出，或對話框顯示或關閉時，下層（其下方的頁面、沒有對話框的應用程式）是 `sample_from`，上層是 `sample_to`；頁面或對話框出現時 `nsh.progress` 從 0 變為 1，消失時從 1 變為 0，因此同一個著色器可以處理兩個方向。

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

著色器會取代頁面或對話框的 `animation`，不論它是什麼（包括 `"none"`）。在沒有 GPU 的裝置上、使用者要求減少動態效果（Reduce Motion、Remove animations）時，以及原始碼無法編譯時，會使用 `animation`；若搭配 `"none"`，變更會立即顯示。若在一個轉場執行期間又開始了新的推入、彈出、顯示或關閉，會先完成前一個：其頁面或對話框抵達或離開，其 `onShow` 或 `onDismiss` 觸發，然後新的變更從那裡開始。

平台會在所顯示內容改變時擷取圖片，每個顯示影格最多一次。圖片由平台自己的渲染器繪製，因此它無法繪入圖片的內容（影片、網頁、其他應用程式的視圖）在其中會顯示為透明。

<a id="props"></a>

## 屬性

Shader 接受[視圖](./view.md)的屬性，另加：

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `source` | `.source(program)` | `string` | 定義 `fn shade(uv: vec2f) -> vec4f` 的 WGSL 原始碼。Rust 使用 `Shader::compile(source)` 編譯。 |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | `struct Uniforms` 各成員的值，依名稱指定：數字、顏色、動畫值，以及它們的清單。 |
| `paused` | `.paused(bool)` | `boolean` | 停止 `nsh.time` 的時鐘。預設為 `false`。 |

`ShaderEffect` 與 `ScreenEffect` 接受上述屬性（`source` 為選用），另加：

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `progress` | `.progress(n)`、`.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`。預設為 0。 |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | 著色器及其圖片在範圍之外延伸的距離，單位為 point（`ShaderEffect` 與 `ShaderTransition`）。預設為 0。 |

`ShaderTransition` 與 `ScreenTransition` 接受 `source`、`uniforms` 與 `paused`，另加：

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | 它改變時，轉場便會執行（第一個值不會）。 |
| `duration` | `.duration(Duration)` | `number` | 執行時間，單位為毫秒。預設為 300。 |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | 沒有 `source` 時執行的內容。預設為 `"fade"`。 |

`NavPage` 與 `Dialog` 接受：

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`、`.uniform(name, value)`、`.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 頁面或對話框出現與消失時所透過的著色器，取代其 `animation`。`duration` 以毫秒為單位，預設為 350。 |

<a id="errors"></a>

## 錯誤

NSH 在設定每個著色器的原始碼時、在其到達 GPU 之前就會進行檢查。無法編譯的著色器會記錄一則警告，包含其原始碼中的行號與欄號以及錯誤內容，例如：

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

此時視圖會顯示其背景與子元件。若結構中沒有某個 uniform，或某個值不是其型別所接受的，會記錄一則指出該 uniform 的警告，其他 uniforms 仍會套用。

每份原始碼只會編譯一次：共用同一份原始碼的視圖，以及重新設定的原始碼，都會使用已編譯的著色器。

<a id="rules-and-limits"></a>

## 規則與限制

- `shade` 的簽章必須恰為 `fn shade(uv: vec2f) -> vec4f`。原始碼可自行宣告函式、常數、結構與 `var<private>` 變數；NSH 提供進入點與繫結。
- 原始碼最大為 64 KiB。
- `struct Uniforms` 最多 4096 位元組，其成員須為上表中的型別。
- 一個影格每邊最多 4096 像素：更大的視圖會以較低的比例繪製其著色器。

對於雜訊，請對點所在的整數格（`bitcast<vec2u>(vec2i(floor(p)))`，以乘法與 xor-shift 混合）進行雜湊，而不要使用 `fract(sin(…) * 43758.5)`：整數雜湊在任何計算位置都會對同一個格給出相同的值，因此數值雜訊在每種 GPU 上都能保持無縫。圖庫中的著色器有相關示範。

<a id="platforms"></a>

## 平台

在 iOS、Android、macOS、Windows 與 Linux，以及 GPUI 應用程式中，NSH 使用 wgpu 在 GPU 上渲染著色器（Apple 平台使用 Metal，其他平台使用 Vulkan、Direct3D 12 或 OpenGL），依螢幕比例繪製，並將每個影格顯示在視圖的子元件之下。渲染與 UI 並行：影格在繪製後一到兩個顯示影格出現，GPU 運作時 UI 仍保持回應。在 Web 上，NSH 會把著色器轉譯為 GLSL，並以 WebGL 2 繪製。

著色器每個顯示影格最多繪製一次，且只在所顯示內容改變時繪製：uniforms 固定的著色器只繪製一次，讀取 `nsh.time` 的著色器每個影格都繪製，使用動畫 uniforms 的著色器則在它們變動期間繪製。

## Rust

`shader()`（來自 `nsh_core::element`）建立一個著色器視圖；`.source(program)` 為它提供已編譯的 `Shader`（`nsh_core::shader::Shader::compile(source)`，其回傳的錯誤與上述相同）。請只編譯程式一次並共用它：複製的成本很低。程式可以是繫結的 `.source(move || …)`，以便切換程式。

| 方法 | 說明 |
|---|---|
| `.uniform(name, value)` | 設定 `struct Uniforms` 的成員：數字、`Color` 或 `Hsla`、`[f32; 2]` / `[f32; 3]` / `[f32; 4]`，或 `Vec<UniformValue>`。繫結值（`move \|\| …`）會在改變時重新設定；動畫值（`&wave`：數字，或用於 `vec3f` / `vec4f` 的顏色）會以原生方式逐幀驅動它。 |
| `.paused(bool)` | 停止 `nsh.time` 的時鐘；可繫結。 |

子元件以 `.child(..)` 新增，樣式則使用常見的具型別方法。`shader_effect()`、`shader_transition()`、`screen_effect()` 與 `screen_transition()` 建立其他元素，其方法見上表。
