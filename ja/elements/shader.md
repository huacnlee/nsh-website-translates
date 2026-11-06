---
title: "Shader"
description: "Shader 要素：子要素の下に、WGSL で記述した GPU プログラムがボックスを描画するビュー。"
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

シェーダーは、GPU プログラムがボックスを描画するビューです。流れるようなグラデーション、ノイズやグレイン、プラズマ、オーロラ、ホログラフィック箔、タップに追従する波紋などを描けます。ボックス上の各点の色を返す WGSL 関数 `shade` を 1 つ書くと、プラットフォームがそれを画面の解像度で GPU 上で実行し、ビューの背景の上、子の下に描画します。アニメーション値によって、アプリのコードに手を加えることなく、ネイティブにフレームごとに動きます。TSX では `nsh` の `<Shader>` で、Rust では `shader().source(program)` でシェーダーを作成します。

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

## シェーダー

シェーダーのソースは、WebGPU のシェーディング言語である WGSL です。次の関数を 1 つ定義します。

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` はビューのボックス上の点で、左上隅の `(0, 0)` から右下隅の `(1, 1)` までの値をとり、y は CSS と同様に下方向に増えます。
- 戻り値はその点の色で、赤、緑、青、アルファを 0..1 で表します。CSS の色と同様に sRGB のストレートアルファです。0..1 の範囲外の値はクランプされます。

`shade` のほかに、ソースには必要なヘルパー関数、定数、`var<private>` 変数を含められます。エントリーポイントは NSH が提供し、シェーダーの入力は次の 2 か所から読み取られます。

<a id="built-ins"></a>

### ビルトイン

| ビルトイン | 型 | 値 |
|---|---|---|
| `nsh.size` | `vec2f` | ビューのサイズ(ポイント単位)。 |
| `nsh.time` | `f32` | シェーダーが表示されてからの秒数。これを読み取るシェーダーはアニメーションし、画面に表示されている間は毎フレーム描画します。 |
| `nsh.scale` | `f32` | 描画中のフレームにおける 1 ポイントあたりのピクセル数。 |

`uv * nsh.size` はポイント単位の点の位置です。`nsh.size.x / nsh.size.y` はアスペクト比で、正方形でないボックスでも円を丸く保ちます。

<a id="uniforms"></a>

### ユニフォーム

アプリが設定する値は `Uniforms` という名前の構造体に入れます。シェーダーはこれを `uniforms` として読み取ります。

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

`uniforms` プロパティが、そのメンバーを名前で設定します。各型が受け取る値は次のとおりです。

| WGSL の型 | 値 |
|---|---|
| `f32`、`i32`、`u32` | 数値(`i32` と `u32` では 0 方向に切り捨て)、またはアニメーション値 |
| `vec2f` | `[x, y]`:2 つの数値またはアニメーション値 |
| `vec3f` | 色(その赤、緑、青)、アニメーションする色、または 3 つの数値 |
| `vec4f` | アルファ付きの色、アニメーションする色、または 4 つの数値 |
| `array<vec4f, N>` | 最大 `N` 個の色(またはそれぞれ 4 つの数値)のリスト:パレットやグラデーションのストップ |

色は任意の CSS カラー(`"#38bdf8"`、`"rgb(56 189 248)"`、`"hsl(199 93% 60%)"`)で指定でき、0..1 の sRGB 成分としてシェーダーに渡されます。アプリが省略したメンバーは 0 になります。`uniforms` を再度設定すると、新しい値でシェーダーが再描画されます。

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## アニメーションするユニフォーム

ユニフォームには、[ネイティブのアニメーション値](../modules/nsh.md#animation)、またはそこから派生したノード(`interpolate`、算術演算)を指定できます。プラットフォームは、値が変化するフレームごとにシェーダーへ値を書き込み、UI スレッド上で再描画します。そのため、アプリのコードがどれだけ忙しくても、アニメーションはフルフレームレートで動作します。数値は `f32`、`i32`、`u32` メンバーおよび `vec2f` の成分をアニメーションさせ、色への補間は `vec3f` や `vec4f` をアニメーションさせます。

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

## 一時停止

`paused` はシェーダーのクロックを止めます。`nsh.time` は値を保持し、シェーダーは現在の絵を保ちます。`false` に戻すと、止まった時点からクロックが再開します。一時停止中のシェーダーも、ユニフォームやサイズが変わると再描画されます。

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

`nsh.time` を読み取らないシェーダーは、サイズやユニフォームが変化したときに描画し、それ以外のときは絵を保ちます。

<a id="children-and-clipping"></a>

## 子とクリッピング

シェーダーはコンテナです。[ビュー](./view.md)のすべてのプロパティ(スタイル、子のパディングとレイアウト、プレスやジェスチャーのプロパティ、`onLayout`、アクセシビリティ、`ref`)を受け取り、子はシェーダーの上に描画されます。シェーダーは背景と同じ要領でビューのボックスを塗りつぶし、角丸(`borderRadius`)の内側、`backgroundColor` の上に描画されます。

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

シェーダーのサイズは、スタイル(幅 / 高さ、`flex`、アスペクト比)で指定するか、子に決めさせます。

<a id="effects-transitions-and-the-screen"></a>

## エフェクト、トランジション、画面

シェーダーは、ほかのビューが描画した内容を描くこともできます。その場合、WGSL は 4 つの関数で絵を読み取ります。各関数はボックス上の点 `uv` を受け取り、アルファ付きのストレート sRGB 色を返します。絵の外側は透明です。

| 関数 | 読み取り対象 |
|---|---|
| `sample_content(uv)` | エフェクトの子。スクリーンエフェクトでは画面全体 |
| `sample_backdrop(uv)` | ビューの背後にあるもの(どのシェーダーでも読み取れます) |
| `sample_from(uv)` | トランジションの、離れていく側 |
| `sample_to(uv)` | トランジションの、移り変わる先の側 |

`nsh.progress` はエフェクトの `progress`、またはトランジションの進行度(0 から 1)で、`nsh.overflow` はシェーダーがボックスの外側へ描画する範囲(ポイント単位)です。

**`ShaderEffect`** は子をシェーダー経由で描画します。子はプレス、フォーカス、アクセシビリティを保ち、表示されるのはシェーダーの結果です。`progress` は数値またはアニメーション値で、エフェクトをネイティブに動かします。`maxSampleOffset` を指定すると、シェーダーはボックスの外側へその分のポイントだけ描画できます(グロー、ぼかしの端など)。その場合、`uv` は 0 未満および 1 超の値をとります。`source` がなければ、子はそのまま描画されます。

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

**`ShaderTransition`** は、`value`(文字列、数値、真偽値)が変化したとき(最初の値では実行されません)に、子をシェーダー経由で変化させます。`sample_from` は子が以前に描画していた絵、`sample_to` は現在描画している絵で、`nsh.progress` は `duration` ミリ秒(300)かけて 0 から 1 へ進みます。`source` がない場合は `fallback` が実行されます。`"fade"`(クロスフェード、デフォルト)または `"none"` のいずれかです。

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** と **`ScreenTransition`** は、画面全体(ページ、ダイアログ、オーバーレイ)に対して同じことを行います。スペースを取らず、子も持たないため、アプリ内のどこにでも置けます。`source` 付きで最後にマウントされたスクリーンエフェクトが描画されます。

ページとダイアログは、**`transitionShader`** を使ってシェーダー経由で出入りさせられます。TSX では `NavPage` または `Dialog` に `{ source, uniforms, duration }` を指定します(Rust では `nav_page()` または `dialog()` に `.transition_shader(TransitionShader::new(program))` を指定します)。ページが push または pop されるとき、あるいはダイアログが表示または閉じられるとき、下側(その下のページ、ダイアログのないアプリ)が `sample_from`、上側が `sample_to` になります。`nsh.progress` は、ページやダイアログが現れるときに 0 から 1 へ、消えるときに 1 から 0 へ進むので、1 つのシェーダーで両方向を描画できます。

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

シェーダーは、ページまたはダイアログの `animation` の代わりになります(`"none"` も含め、どのようなものでも同様です)。`animation` は、GPU のないデバイス、ユーザーがモーションの低減(Reduce Motion、Remove animations)を求めている場合、およびコンパイルできないソースの場合に実行されます。`"none"` を指定していれば、その場合は変化が即座に表示されます。ある遷移の実行中に push、pop、表示、閉じる操作が始まった場合は、先にその遷移が完了します。そのページやダイアログが到着または退場し、`onShow` や `onDismiss` が発火して、新しい変化はそこから始まります。

プラットフォームは、表示内容が変化したときに、1 表示フレームにつき最大 1 回だけ絵を取得します。絵はプラットフォーム自身のレンダラーで描画されるため、絵の中に描画できないもの(動画、Web ページ、別アプリのビュー)は、その中では透明で表示されます。

<a id="props"></a>

## プロパティ

シェーダーは、[ビュー](./view.md)のプロパティに加えて次のものを受け取ります。

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `source` | `.source(program)` | `string` | `fn shade(uv: vec2f) -> vec4f` を定義する WGSL ソース。Rust では `Shader::compile(source)` でコンパイルします。 |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | `struct Uniforms` のメンバーの値を名前で指定します:数値、色、アニメーション値、およびそれらのリスト。 |
| `paused` | `.paused(bool)` | `boolean` | `nsh.time` のクロックを止めます。デフォルトは `false`。 |

`ShaderEffect` と `ScreenEffect` は、これらに加えて(`source` は省略可能)次を受け取ります。

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `progress` | `.progress(n)`、`.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`。デフォルトは 0。 |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | ボックスの外側へ、シェーダーが描画し絵が届く範囲(ポイント単位。`ShaderEffect` と `ShaderTransition`)。デフォルトは 0。 |

`ShaderTransition` と `ScreenTransition` は、`source`、`uniforms`、`paused` に加えて次を受け取ります。

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | 変化するとトランジションが実行されます(最初の値では実行されません)。 |
| `duration` | `.duration(Duration)` | `number` | 実行時間(ミリ秒)。デフォルトは 300。 |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | `source` がない場合に実行されるもの。デフォルトは `"fade"`。 |

`NavPage` と `Dialog` は次を受け取ります。

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`、`.uniform(name, value)`、`.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | ページまたはダイアログが `animation` の代わりに出入りするシェーダー。`duration` はミリ秒単位で、デフォルトは 350。 |

<a id="errors"></a>

## エラー

NSH は、ソースが設定されたときに、GPU に渡す前にすべてのシェーダーを検査します。コンパイルできないシェーダーは、ソース内の行と列、および問題の内容を含む警告をログに出力します。例:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

この場合、ビューは背景と子を表示します。構造体にないユニフォーム、またはその型が受け付けない値については、そのユニフォーム名を示す警告がログに出力され、ほかのユニフォームは適用されます。

各ソースのコンパイルは 1 回だけです。ソースを共有するビューや、再設定されたソースは、コンパイル済みのシェーダーを使用します。

<a id="rules-and-limits"></a>

## ルールと制限

- `shade` のシグネチャは、正確に `fn shade(uv: vec2f) -> vec4f` でなければなりません。ソースは独自の関数、定数、構造体、`var<private>` 変数を宣言できます。エントリーポイントとバインディングは NSH が提供します。
- ソースは最大 64 KiB です。
- `struct Uniforms` は最大 4096 バイトで、メンバーは上の表にある型でなければなりません。
- フレームは 1 辺が最大 4096 ピクセルです。それより大きいビューでは、シェーダーはより低いスケールで描画されます。

ノイズには、`fract(sin(…) * 43758.5)` ではなく、点が属する整数セルをハッシュする方法(乗算と xor シフトを組み合わせた `bitcast<vec2u>(vec2i(floor(p)))`)を使ってください。整数ハッシュは、どこで計算してもセルに対して同じ値を返すため、バリューノイズはどの GPU でもシームレスになります。ギャラリーのシェーダーにその例があります。

<a id="platforms"></a>

## プラットフォーム

iOS、Android、macOS、Windows、Linux、および GPUI アプリでは、NSH は wgpu を使って(Apple プラットフォームでは Metal、それ以外では Vulkan、Direct3D 12、または OpenGL)、画面のスケールでシェーダーを GPU 上でレンダリングし、各フレームをビューの子の下に表示します。レンダリングは UI と並行して実行されます。フレームは描画されてから 1 ～ 2 表示フレーム後に現れ、GPU が処理している間も UI は応答性を保ちます。Web では、NSH はシェーダーを GLSL に変換し、WebGL 2 で描画します。

シェーダーは、1 表示フレームにつき最大 1 回、表示内容が変化したときにのみ描画します。ユニフォームが固定のシェーダーは 1 回だけ描画し、`nsh.time` を読み取るシェーダーは毎フレーム描画し、アニメーションするユニフォームを持つシェーダーはそれが動いている間描画します。

## Rust

`shader()`(`nsh_core::element` から)はシェーダービューを作成し、`.source(program)` はコンパイル済みの `Shader` を渡します(`nsh_core::shader::Shader::compile(source)` は上記と同じエラーを返します)。プログラムは 1 回コンパイルして共有してください。クローンのコストは小さくて済みます。プログラムはバインドすることもでき、`.source(move || …)` でプログラムを切り替えられます。

| メソッド | 説明 |
|---|---|
| `.uniform(name, value)` | `struct Uniforms` のメンバーを設定します:数値、`Color` または `Hsla`、`[f32; 2]` / `[f32; 3]` / `[f32; 4]`、あるいは `Vec<UniformValue>`。バインドされた値(`move \|\| …`)は変化したときに再設定され、アニメーション値(`&wave`:数値、または `vec3f` / `vec4f` 用の色)は毎フレーム、ネイティブに値を動かします。 |
| `.paused(bool)` | `nsh.time` のクロックを止めます。バインド可能です。 |

子は `.child(..)` で追加し、スタイルは通常の型付きメソッドで指定します。`shader_effect()`、`shader_transition()`、`screen_effect()`、`screen_transition()` は、上の表にあるメソッドを持つ、そのほかの要素を作成します。
