---
title: "Shader"
description: "Shader 元素：一個由以 WGSL 編寫的 GPU 程式在其子元素下方繪製範圍的檢視。"
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---


# Shader

著色器（shader）是一種視圖，其方框由 GPU 程式繪製：流動的漸變、雜訊與顆粒、電漿、極光、全像箔紙，以及跟隨點按的漣漪。你只需撰寫一個 WGSL 函數 `shade`，為方框內每個點給出顏色；平台會在 GPU 上以螢幕解析度執行它，繪製於視圖背景之上、子視圖之下。動畫值由原生層逐幀驅動，無須應用程式碼介入。TSX 使用 `nsh` 中的 `<Shader>` 建立著色器，Rust 則使用 `shader().source(program)`。

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

著色器的原始碼是 WGSL，即 WebGPU 的著色語言。它定義一個函數：

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` 是視圖方框內的點，由左上角的 `(0, 0)` 至右下角的 `(1, 1)`，y 軸向下增長，與 CSS 相同。
- 結果是該點的顏色：紅、綠、藍及 alpha，範圍 0..1，採用 sRGB 及直通 alpha（straight alpha），與 CSS 顏色相同。超出 0..1 的值會被截取。

除 `shade` 外，原始碼可按需要包含輔助函數、常數及 `var<private>` 變數。NSH 會提供進入點，並從兩處讀取著色器的輸入。

<a id="built-ins"></a>

### 內置值

| 內置值 | 類型 | 值 |
|---|---|---|
| `nsh.size` | `vec2f` | 視圖的大小，單位為點。 |
| `nsh.time` | `f32` | 著色器出現後經過的秒數。讀取它的著色器會產生動畫：只要在畫面上，每一幀都會繪製。 |
| `nsh.scale` | `f32` | 正在繪製的畫面中，每點對應的像素數。 |

`uv * nsh.size` 是以點為單位的座標；`nsh.size.x / nsh.size.y` 是寬高比，可令圓形在非正方形的方框中保持圓形。

<a id="uniforms"></a>

### Uniform

應用程式設定的值放在名為 `Uniforms` 的結構體中，著色器以 `uniforms` 讀取：

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

`uniforms` 屬性按名稱設定其成員。各類型可接受以下的值：

| WGSL 類型 | 值 |
|---|---|
| `f32`、`i32`、`u32` | 一個數字（`i32` 和 `u32` 會向零取整），或動畫值 |
| `vec2f` | `[x, y]`：兩個數字或動畫值 |
| `vec3f` | 一個顏色（取其紅、綠、藍）、動畫顏色，或三個數字 |
| `vec4f` | 帶 alpha 的顏色、動畫顏色，或四個數字 |
| `array<vec4f, N>` | 最多 `N` 個顏色（或各自四個數字）的列表：調色盤、漸變的色標 |

顏色可以是任何 CSS 顏色（`"#38bdf8"`、`"rgb(56 189 248)"`、`"hsl(199 93% 60%)"`），並以 0..1 的 sRGB 分量傳到著色器。應用程式沒有設定的成員為零。再次設定 `uniforms` 會以新值重新繪製著色器。

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## 動畫 uniform

uniform 可以是[原生動畫值](../modules/nsh.md#animation)，或由它派生的節點（`interpolate`、算術運算）。每當其值改變，平台便會在 UI 執行緒上把值寫入著色器並重新繪製：不論應用程式碼多繁忙，動畫都以全幀率運行。數字可驅動 `f32`、`i32` 及 `u32` 成員，以及 `vec2f` 的各分量；對顏色的插值則可驅動 `vec3f` 或 `vec4f`。

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

`paused` 會停止著色器的時鐘：`nsh.time` 保持其值，著色器維持其畫面。把它設回 `false` 後，時鐘由停止之處繼續。uniform 及大小的變更仍會令已暫停的著色器重新繪製。

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

不讀取 `nsh.time` 的著色器只會在大小或 uniform 改變時繪製，其餘時間維持原有畫面。

<a id="children-and-clipping"></a>

## 子視圖與裁剪

著色器是容器：它接受[視圖](./view.md)的所有屬性（樣式、子視圖的內距與佈局、按壓及手勢屬性、`onLayout`、無障礙、`ref`），其子視圖繪製在著色器之上。著色器如背景般填滿視圖的方框，位於圓角（`borderRadius`）之內，並覆蓋在 `backgroundColor` 之上。

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

透過樣式（寬度／高度、`flex`、寬高比）為著色器指定大小，或讓其子視圖決定大小。

<a id="effects-transitions-and-the-screen"></a>

## 效果、轉場與畫面

著色器也可以繪製其他視圖所繪的內容。此時它的 WGSL 透過四個函數讀取畫面，每個函數接受方框內的一個點 `uv`，並返回帶 alpha 的直通 sRGB 顏色，畫面以外則為透明：

| 函數 | 讀取 |
|---|---|
| `sample_content(uv)` | 效果的子視圖；若為畫面效果，則為整個畫面 |
| `sample_backdrop(uv)` | 視圖後面的內容（任何著色器都可讀取） |
| `sample_from(uv)` | 轉場中離開的一方 |
| `sample_to(uv)` | 轉場中進入的一方 |

`nsh.progress` 是效果的 `progress`，或轉場的進度（0 至 1）；`nsh.overflow` 是著色器在方框以外繪製的距離，單位為點。

**`ShaderEffect`** 會透過著色器繪製其子視圖：子視圖保留按壓、焦點及無障礙功能，而顯示出來的是著色器的結果。`progress` 是數字或動畫值，可由原生層驅動效果。`maxSampleOffset` 讓著色器在方框以外多繪製相應的點數（例如光暈、模糊的邊緣）；此時其 `uv` 會小於 0 及大於 1。沒有 `source` 時，子視圖照常繪製。

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

**`ShaderTransition`** 會在 `value`（字串、數字或布林值）改變時，透過著色器轉換其子視圖，首個值不會觸發：`sample_from` 是子視圖先前所繪的畫面，`sample_to` 是它們現在所繪的畫面，`nsh.progress` 在 `duration` 毫秒（300）內由 0 變為 1。沒有 `source` 時，它會執行 `fallback`：`"fade"`（交叉淡化，為預設值）或 `"none"`。

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** 與 **`ScreenTransition`** 對整個畫面（其頁面、對話框及覆疊層）作同樣處理。它們不佔空間，也沒有子視圖；可放在應用程式任何位置。最後掛載、帶有 `source` 的畫面效果會生效繪製。

頁面與對話框可透過 **`transitionShader`** 以著色器出入場：在 `NavPage` 或 `Dialog` 上使用 `{ source, uniforms, duration }`（Rust：在 `nav_page()` 或 `dialog()` 上使用 `.transition_shader(TransitionShader::new(program))`）。當頁面被推入或彈出，或對話框顯示或關閉時，下層（其下的頁面，或沒有對話框的應用程式）為 `sample_from`，上層為 `sample_to`；頁面或對話框進場時 `nsh.progress` 由 0 變為 1，離場時由 1 變為 0，因此同一個著色器可同時處理兩個方向。

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

著色器會取代頁面或對話框的 `animation`，不論它是什麼（包括 `"none"`）。`animation` 會在沒有 GPU 的裝置上、用戶要求減少動態效果（Reduce Motion、Remove animations）時，以及原始碼無法編譯時執行；若設為 `"none"`，變更便會即時顯示。如果在轉場進行期間開始新的推入、彈出、顯示或關閉，會先完成進行中的那一個：其頁面或對話框到達或離開，其 `onShow` 或 `onDismiss` 觸發，然後新的變更由該處開始。

平台會在所顯示的內容改變時擷取畫面，每個顯示幀最多一次。畫面由平台自己的渲染器繪製，因此無法繪入畫面的內容（影片、網頁、其他應用程式的視圖）在畫面中會顯示為透明。

<a id="props"></a>

## 屬性

著色器接受[視圖](./view.md)的屬性，另加：

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `source` | `.source(program)` | `string` | 定義 `fn shade(uv: vec2f) -> vec4f` 的 WGSL 原始碼。Rust 以 `Shader::compile(source)` 編譯。 |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | `struct Uniforms` 各成員的值，按名稱指定：數字、顏色、動畫值及其列表。 |
| `paused` | `.paused(bool)` | `boolean` | 停止 `nsh.time` 的時鐘。預設 `false`。 |

`ShaderEffect` 與 `ScreenEffect` 接受上述屬性（`source` 為可選），另加：

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `progress` | `.progress(n)`、`.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`。預設 0。 |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | 著色器繪製及其畫面可延伸至方框以外的距離，單位為點（`ShaderEffect` 及 `ShaderTransition`）。預設 0。 |

`ShaderTransition` 與 `ScreenTransition` 接受 `source`、`uniforms` 及 `paused`，另加：

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | 改變時執行轉場（首個值不會）。 |
| `duration` | `.duration(Duration)` | `number` | 執行時間，單位為毫秒。預設 300。 |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | 沒有 `source` 時執行的內容。預設 `"fade"`。 |

`NavPage` 與 `Dialog` 接受：

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`、`.uniform(name, value)`、`.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 頁面或對話框出入場時所用的著色器，取代其 `animation`。`duration` 單位為毫秒，預設 350。 |

<a id="errors"></a>

## 錯誤

NSH 會在設定原始碼時檢查每個著色器，早於其到達 GPU 之前。無法編譯的著色器會記錄一則警告，列出原始碼中的行號與列號及錯誤所在，例如：

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

視圖此時會顯示其背景及子視圖。若結構體缺少某個 uniform，或其值不屬該類型接受的範圍，會記錄一則指明該 uniform 的警告，其餘 uniform 仍會生效。

每份原始碼只編譯一次：共用同一原始碼的視圖，以及再次設定的原始碼，都會使用已編譯的著色器。

<a id="rules-and-limits"></a>

## 規則與限制

- `shade` 的簽名必須為 `fn shade(uv: vec2f) -> vec4f`。原始碼自行宣告其函數、常數、結構體及 `var<private>` 變數；NSH 提供進入點及綁定。
- 原始碼最大 64 KiB。
- `struct Uniforms` 最多 4096 位元組，成員須為上表所列類型。
- 每個畫面每邊最多 4096 像素：較大的視圖會以較低比例繪製其著色器。

製作雜訊時，請對點所在的整數格子作雜湊（`bitcast<vec2u>(vec2i(floor(p)))` 以乘法及 xor 位移混合），而非使用 `fract(sin(…) * 43758.5)`：整數雜湊在任何計算位置都為同一格子得出相同的值，因此數值雜訊在每款 GPU 上都能無縫銜接。圖庫中的著色器附有示範。

<a id="platforms"></a>

## 平台

在 iOS、Android、macOS、Windows 和 Linux 上，以及 GPUI 應用程式中，NSH 以 wgpu 在 GPU 上渲染著色器（Apple 平台使用 Metal，其他平台使用 Vulkan、Direct3D 12 或 OpenGL），按螢幕的縮放比例繪製，並把每一幀顯示於視圖的子視圖之下。渲染與 UI 並行：一幀在繪製後一至兩個顯示幀才出現，GPU 運算期間 UI 仍保持回應。在網頁上，NSH 會把著色器轉譯為 GLSL，並以 WebGL 2 繪製。

著色器每個顯示幀最多繪製一次，且只在所顯示的內容改變時才繪製：uniform 固定的著色器只繪製一次，讀取 `nsh.time` 的著色器每一幀都繪製，而帶動畫 uniform 的著色器則在 uniform 變動期間繪製。

## Rust

`shader()`（來自 `nsh_core::element`）建立著色器視圖；`.source(program)` 為它提供已編譯的 `Shader`（`nsh_core::shader::Shader::compile(source)`，返回的錯誤與上文相同）。程式只需編譯一次並共用：複製的成本很低。程式可以綁定，如 `.source(move || …)`，以切換程式。

| 方法 | 說明 |
|---|---|
| `.uniform(name, value)` | 設定 `struct Uniforms` 的成員：數字、`Color` 或 `Hsla`、`[f32; 2]`／`[f32; 3]`／`[f32; 4]`，或 `Vec<UniformValue>`。綁定值（`move \|\| …`）在改變時會再次設定；動畫值（`&wave`：數字，或用於 `vec3f`／`vec4f` 的顏色）會由原生層逐幀驅動。 |
| `.paused(bool)` | 停止 `nsh.time` 的時鐘；可綁定。 |

子視圖以 `.child(..)` 加入，樣式則用慣常的型別方法。`shader_effect()`、`shader_transition()`、`screen_effect()` 及 `screen_transition()` 建立其他元素，所用方法見上表。
