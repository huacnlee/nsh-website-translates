---
title: "スタイリング"
description: "Rust の型付きスタイルメソッドと TSX の style prop。flexbox、grid、CSS エフェクト、カラー、ボーダー、角丸、シャドウ、グラデーション、フィルター、トランスフォーム、トランジション、そしてプラットフォームごとの違いを解説します。"
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# スタイリング

すべての要素は同じネイティブスタイルでスタイルされ、書き方は2通りあります。Rust では、スタイルは要素にチェーンする型付きメソッドです(`.p_4()`、`.rounded(px(12.0))`、`.bg(color)`)。TSX では、camelCase のプロパティからなる `style` prop、または [Tailwind クラス](./tailwind.md)を使います。どちらも box shadow、グラデーション、フィルター、アウトライン、トランジション、グリッドなどの CSS の機能を含み、変更されたプロパティだけがネイティブビューに送られます。

3つの書き方は同じプロパティのセットを記述し、意味も同じです。名前は CSS のものです(アプリで書かれる、よりわかりやすい名前を採用しているものもあります。たとえば `paddingHorizontal`、`marginStart`、`numberOfLines`)。CSS の値(色、グラデーション、フィルター、シャドウ、トランスフォーム、アラインメントのキーワード)と Tailwind のユーティリティは Web と同じ意味を持ち、Rust の各メソッドとユーティリティは Tailwind CSS 4 が生成する内容を設定するため、Web での知識がそのまま使えます。`paddingLeft` は `padding-left` と `pl-4` であり、`boxShadow` は `box-shadow` であり、`display: "flex"` は `flex` クラスと同じく行になります。それ以外はネイティブアプリ向けに作られています。長さはポイントです(`16`、`"50%"`、`"auto"`。クラスは `rem` と CSS のその他の単位を受け付けます)。デフォルトはネイティブレイアウトのものです(下記参照)。変化する値は文字列ではなく数値を受け取ります(`translate: [x, 0]`、シャドウのレイヤー)。各プラットフォームが CSS を超えて行うことには、独自の[拡張](#extensions)があります。

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

このページでは、スタイルの組み合わせ方と視覚的なプロパティを扱います。レイアウトのプロパティ(flexbox、グリッド、サイズ、位置)は [Layout](./layout.md)、テキストのプロパティは [Text](./text.md)、型付きの全プロパティは[スタイルリファレンス](../modules/style-reference.md)にあります。

<a id="combining-styles"></a>

## スタイルの組み合わせ

Rust では、共有スタイルは要素を受け取ってスタイル済みの要素を返す関数で、条件は通常の Rust です。要素の作成時にわかっている条件には `.when(condition, |v| ..)`、アプリの実行中に切り替わるスタイルには `.style_when(signal, |s| ..)` を使います。TSX では、`style` はオブジェクト、または左から右へマージされるオブジェクトの配列を受け取ります。falsy なエントリ(`false`、`null`、`undefined`)はスキップされるため、条件付きスタイルを短く書けます。

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

TSX では、共有スタイルをコンポーネントの外側に定数として定義します(`as const` を付けると、TypeScript が `"row"` のようなリテラル型を保持します)。必要なのは単なるオブジェクトだけです。スタイルは設定されるたびに Rust 側でパースされるため、オブジェクトを登録する必要はありません。

シグナルを読むスタイルは、そのシグナルに追従します。Rust では、メソッドにクロージャを渡すと(`.bg(move || ..)`)、シグナルが変化したときにそのプロパティだけが再設定されます。TSX では、シグナルを読むスタイル式は再構築され、NSH は値が異なるプロパティだけを送ります。

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

TSX の要素に両方がある場合、`style` は `class` より優先されます。クラスが先に適用され、その上にインラインスタイルが適用されます。`undefined` に設定されたキーは何も設定しません(`backgroundColor: active ? accent : undefined` は非アクティブ時にクラスの色を維持します)。`null` はデフォルトを設定します。Rust では、同じプロパティに対して後のメソッドが前のメソッドより優先されます。

1つのスタイル(オブジェクト、または1つにマージされた配列)の中では、キーの順序は結果に影響しません。より具体的なプロパティが、その一括指定プロパティより優先されます。`borderTopWidth` は `borderWidth` より、`borderLeftColor` は `borderColor` より、`marginTop` は `marginVertical` より、さらに `margin` より優先されます(padding も同様)。`rowGap` は `gap` より、`flexGrow` は `flex` より、`gridColumnStart` は `gridColumn` より優先されます。そこで具体的なプロパティを `null` に設定すると、一括指定の値が表示されます。

<a id="units-and-values"></a>

## 単位と値

- **長さはポイント**(密度非依存ピクセル)です。Rust の `px(100.0)` と TSX の `width: 100` は 100pt で、2× または 3× の画面では物理ピクセルで 200 または 300 になります。
- **パーセンテージ**(Rust では `relative(0.5)`、TSX では `"50%"`)は、サイズ、位置、マージン、パディングにおいて親を基準とします([Layout](./layout.md))。
- **角度**は、Rust では `deg(45.0)`、`radians(0.5)`、`turn(0.25)` で、TSX では数値(度)または単位付きの文字列です(`45`、`"45deg"`、`"0.5rad"`)。CSS の `rotate` と `transform` は `"0.25turn"` も受け付け、`transform` 文字列の中ではすべての角度に単位が必要です。
- **時間**はミリ秒です。Rust では `.duration(150.0)`、TSX では数値または文字列(`"150ms"`、`"0.2s"`)です。

<a id="defaults"></a>

## デフォルト

プロパティが何も設定されていない場合、NSH のデフォルトが適用されます。

| | デフォルト |
|---|---|
| ビューの子のレイアウト | 列(`flexDirection: "column"` を持つ flex コンテナ)。CSS と同様、`flexDirection` が設定されていなければ `display: "flex"` は行になる |
| `flexShrink` | `0`(依頼しない限り、子は縮小しない) |
| `alignContent` | `"flex-start"`(グリッドでは CSS の `"normal"`) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | 透明 |
| テキスト | 黒、14pt、ウェイト 400 |
| ボーダーとアウトラインの色 | テキストの色(CSS の `currentColor`) |

新しいビューは、スタイルを与えるまでスタイルをまったく持たないため、スタイルのないラッパーはネイティブ側ではコストがかかりません。

<a id="colors"></a>

## 色

Rust では、色は型付きの値です。`rgb(0x0099ff)`、`rgba(0x0099ffcc)`、`hsla(..)`、`white()`、`black()`、そして Tailwind のパレットを `nsh_core::element::palette` として使えます(`BLUE.shade(500)`)。色のメソッドは `AdaptiveColor`、つまりライト用とダーク用の値を受け取ります。`AdaptiveColor::rgb(0xffffff, 0x0d1117)` は、再レンダリングなしでネイティブにシステムの外観に合わせて切り替わります。アプリのテーマの色(`nsh_base` の `theme().primary`)も適応型です([Rust](./rust.md#theme))。

TSX では、色のプロパティは CSS の色文字列を受け付けます。

| 形式 | 例 |
|---|---|
| Hex | `"#09f"`、`"#09fc"`、`"#0099ff"`、`"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`、`"rgba(0, 0, 0, 0.5)"`、`"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| 名前付き | `"white"`、`"black"`、`"transparent"`、`"rebeccapurple"`、... |
| `currentColor` | `"currentColor"`:テキストの色。グラデーション、シャドウ、`drop-shadow()`、`color-mix()`(`"color-mix(in srgb, currentColor 50%, transparent)"`)の中でも使えます。クラスでは `bg-current`、`border-current/50`、`bg-[color-mix(in_srgb,currentColor_50%,transparent)]` と書きます |

TSX でダークモードに対応するには、システムの外観に追従するアクセサである `nsh` から [`colorScheme()`](../modules/nsh.md#device) を読み取るか、Tailwind の `dark:` バリアントを使います。

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

色以外のスタイルには、Rust では `.dark(|s| ..)` がダーク外観でスタイルを適用し、`dark()` が外観を読み取ります。デフォルトのテキスト色は、どちらの外観でも黒です。ダークモードに対応するアプリでは、色を明示的に設定してください。

<a id="borders-and-corners"></a>

## ボーダーとコーナー

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **幅と色**は辺ごとに指定します。`borderTopWidth`、`borderRightWidth`、...、`borderTopColor`、... は、どちらの方向でもその辺を維持します。`borderStartWidth`、`borderEndWidth`、`borderStartColor`、`borderEndColor` は[レイアウト方向](./layout.md#right-to-left)に従います(Rust では `.border_t(..)`、`.border_t_color(..)`、`.border_s(..)`、`.border_e_color(..)`、...)。
- **色**は、幅が設定されていて色が設定されていない辺ではテキストの色になります。CSS の `currentColor` と同じで、`{ borderWidth: 1, color: "#0969da" }` は青いボーダーを描画します。
- **半径**はコーナーごとに指定します。`borderTopLeftRadius`、`borderTopRightRadius`、`borderBottomRightRadius`、`borderBottomLeftRadius`、そして `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius`(上の開始側、上の終了側、下の開始側、下の終了側)は[レイアウト方向](./layout.md#right-to-left)に従います(Rust では `.rounded_tl(..)`、...、`.rounded_ss(..)`、`.rounded_se(..)`、`.rounded_es(..)`、`.rounded_ee(..)`、およびプリセットの `.rounded_lg()`、`.rounded_full()`、...)。
- **`borderCurve: "continuous"`**(`.border_curve(BorderCurve::Continuous)`)は、iOS のアプリアイコンのように、曲率が辺へなめらかに移るコーナーを両プラットフォームで描画します。ピル型(高さの半分の `borderRadius`)はピル型のままです。
- **`overflow: "hidden"`**(`.overflow_hidden()`)は、子を角丸の形にクリップします。クリップされた部分はレイアウトでもクリップされます。つまり、囲んでいるスクロールビューのコンテンツサイズには影響しません。したがって、自身より広く子をレイアウトし、それを `transform` で縮小するボックス(トランスフォームはレイアウトに影響しません)でも、スクロールビューには影響しません。

辺の半分より大きい半径は制限されるため、`borderRadius: 9999`(`.rounded_full()`)は円またはピル型になります。

<a id="shadows"></a>

## シャドウ

ビューは CSS の `boxShadow` を落とし、Android ではさらにマテリアルの elevation が加わります。

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` は CSS に従います。`offsetX offsetY blur spread color`、内側のシャドウには `inset` です。また、レイヤーを数値としても受け取ります。これは変化する値のための形式で、文字列を構築しません。`boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]`(必須なのは `x` と `y` のみ。色のないレイヤーはテキストの色になります)。Rust ではレイヤーとして `.shadow([BoxShadow { .. }])` を受け取ります。シャドウはビューの角丸の形に従い、トランジションがアニメーションさせます(`transitionProperty: "boxShadow"`、`.transition_shadow()`)。Tailwind のプリセットは、Rust では `.shadow_sm()`、`.shadow_md()`、`.shadow_lg()`、... で、`.shadow_color(..)` はそのレイヤーの色を変更します。透明なビューのコンテンツ(たとえばアイコンのグリフ)に従うシャドウは `filter: "drop-shadow(...)"` です([Filters](#filters-and-blending))。テキストには `textShadow` があります([Text](./text.md))。

> [!NOTE]
> Android では、シャドウには背景が必要です。背景が透明なビュー(たとえば背景のないテキスト)はシャドウを落としません。

<a id="gradients"></a>

## グラデーション

`backgroundImage` は、背景色の上に描画される CSS グラデーションを受け取ります。Rust では `.bg_linear(angle)`、`.bg_radial()`、`.bg_conic(angle)` にストップ `.gradient_from(..)`、`.gradient_via(..)`、`.gradient_to(..)` を使い、これは Tailwind の `bg-linear-*` に `from-*`、`via-*`、`to-*` を使うのと同じです。TSX では、複数のグラデーションはカンマで区切ります。

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

カラーストップは、線形グラデーションと放射状グラデーションではパーセンテージまたは長さ(`px`、`pt`、`rem`。数値のみの場合はポイント)で配置し、円錐グラデーションではパーセンテージまたは角度(`deg`、`turn`、`rad`、`grad`)で周囲に配置します。2つの位置を持つストップ(`#8250df 0 12px`)は、同じ位置に2つのストップを置いた場合と同様に、単色の帯になります。長さはビューの現在のサイズでグラデーション線に沿って測られるため、12px の帯はビューがリサイズされても 12px の幅を保ちます。

色は CSS と同様にストップ間で混合されます。グラデーションが指定する色空間(`linear-gradient(in oklab, …)`。`srgb`、`srgb-linear`、`xyz`、`oklch` に `longer hue` などの色相の方式を付けたものや `hsl` も使えます)で混合されます。指定がない場合、すべての色が hex、`rgb()`、`hsl()`、または名前付きの色であれば sRGB で、`oklch()`、`oklab()`、`lab()`、`lch()`、`color()` のいずれかが含まれていれば Oklab で混合されます。

iOS では、テキスト要素はグラデーションを描画しません。

<a id="filters-and-blending"></a>

## フィルターとブレンド

| プロパティ | 値 | Rust |
|---|---|---|
| `filter` | ビューとそのコンテンツの CSS フィルター:`brightness()`、`contrast()`、`grayscale()`、`hue-rotate()`、`invert()`、`saturate()`、`sepia()`、`opacity()`、`blur()`、`drop-shadow()`(色がない場合は、CSS と同様にテキストの色)。複数指定する場合はスペースで区切ります | `.brightness(n)`、`.contrast(n)`、`.grayscale(n)`、`.hue_rotate(angle)`、`.invert(n)`、`.saturate(n)`、`.sepia(n)`、`.blur(px(..))` |
| `backdropFilter` | ビューの背後にあるものへのフィルター:`"blur(10px)"`(すりガラス) | `.backdrop_blur(px(10.0))`、`.backdrop_saturate(n)`、... |
| `glassEffect` | iOS 26 以降と macOS 26 以降の Apple の Liquid Glass には `"regular"` または `"clear"`。`"none"`(デフォルト)は `backdropFilter` を使用 | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | ビューが背後のものとどうブレンドされるか:`"multiply"`、`"screen"`、`"overlay"`、... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

プラットフォームごとにサポート状況が異なります。

| | iOS | Android |
|---|---|---|
| ビューへの `filter` | `opacity`、1 までの `brightness`、および `drop-shadow` のみ | Android 12(API 31)以降はすべて。それより前はカラーフィルターのみ |
| 画像への `filter` | すべてのカラーフィルターと `blur` | ビューと同じ |
| `backdropFilter` | システムのブラーマテリアル(半径を近似) | Android 12(API 31)以降 |
| `mixBlendMode` | 対応 | Android 10(API 29)以降 |

Web、Windows、Linux はビューにすべてのフィルターを適用し、macOS は iOS と同様です。GPUI はカラーフィルターと `drop-shadow()` を描画します。背景フィルターは、iOS、macOS、Android ではブラー、Web と Windows ではすべてのフィルターです。Linux と GPUI は何も描画せず、GPUI はビューを通常のブレンドモードで描画します。複数の `drop-shadow()` を持つ `filter` では、iOS、macOS、Android は最後のものを描画します。`mixBlendMode` は、ビューを背後に描画されたすべてのものとブレンドします。

iOS では、`ios={{ backdropMaterial: "regular" }}` が `backdropFilter` ブラーで使用されるシステムマテリアルを選択します。値は `"ultraThin"`(デフォルト)、`"thin"`、`"regular"`、`"thick"`、`"chrome"` です。マテリアルを表示するには、この prop と正のブラー半径を組み合わせます。Rust では `.backdrop_blur(px(30.0))` と併せて `.backdrop_material(BackdropMaterial::Regular)` を使います。半径はマテリアルの強さを近似します。NSH は選択したマテリアルの一部を適用し、30 ポイントで最大の強さに達します。ライトかダークかのバリアントは、ビューの背景色に従います。これらの選択肢は、Apple の[システムブラーマテリアル](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial)に対応します。

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` は、iOS 26 以降と macOS 26 以降で、ビューのコンテンツの背後に Liquid Glass を描画します。`"regular"` は標準のマテリアルを使い、`"clear"` は背景から取り込む色が少なくなります。以前の iOS バージョンやほかのプラットフォームで表示されるブラーのために、`backdropFilter` と組み合わせてください。ガラスはビューのサイズと角丸に従います。

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## アウトライン、不透明度、可視性

- `outlineWidth`、`outlineColor`、`outlineStyle`、`outlineOffset`(`.outline(..)`、`.outline_color(..)`、`.outline_dashed()`、`.outline_offset(..)`):ボーダーの外側に描かれ、スペースを取らない線です(負のオフセットは内側に描画されます)。`outlineStyle: "none"`(または `"hidden"`、`.outline_none()`)は、CSS と同様に、幅に関係なくアウトラインを非表示にします。
- `opacity`(`.opacity(n)`):0 から 1 で、ビューとその子に適用されます。
- `visibility: "hidden"`(Rust では `.invisible()`):ビューは描画されませんがスペースは維持され、ブラウザと同様に、スクリーンリーダーはそのビューとサブツリーをスキップします。`display: "none"`(`.hidden()`)はレイアウトから除外します。
- `zIndex`(`.z_index(n)`):兄弟間の順序で、ネイティブのスタッキング順序でもあります(値が等しい場合は安定)。
- `cursor`(`.cursor(..)`、`.cursor_pointer()`):ビュー上のポインターの形状で、ポインターとデスクトップ向けです。
<a id="transforms"></a>

## トランスフォーム

トランスフォームは CSS のものと同じです。TSX では、`translate`、`rotate`、`scale` はそれぞれ独立したプロパティであり、`transform` は CSS の関数文字列またはステップのリストを受け取ります。これらはキーの順序に関係なく、CSS の順序である `translate`、`rotate`、`scale`、`transform` の順に合成されます。Rust では、トランスフォームはメソッド（`.translate_x(..)`、`.rotate(..)`、`.scale(..)` など）で、同じ順序で合成されます。

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| プロパティ | 値 |
|---|---|
| `translate` | `"10px 20px"`、`"-50% 0"`（ビュー自身のサイズに対する割合）、数値（x 方向のポイント数）、または軸ごとに数値、文字列、アニメーション値のいずれかを指定する `[x, y]` |
| `rotate` | `"45deg"`、`"0.25turn"`、軸 `"x 90deg"` まわりの回転、数値（度）、またはアニメーション値（度） |
| `scale` | `1.5`、`"150%"`、`"1 2"`（x と y）、アニメーション値（両軸）、または `[x, y]` |
| `transform` | CSS の関数: `translate()`、`translateX()`、`translateY()`、`scale()`、`scaleX()`、`scaleY()`、`rotate()` / `rotateZ()`、`rotateX()`、`rotateY()`、`skew()`、`skewX()`、`skewY()`、`perspective()`。長さは `px`（平行移動は `%` も可）、角度は `deg`、`rad`、`turn` で指定します。また `"none"`、または量にアニメーション値を使えるステップのリスト（`[{ perspective: 800 }, { rotateY: angle }]`）も指定できます |

クラスと同様に、それぞれが独立したプロパティです。スタイルの `scale` は `scale-95` クラスを置き換えますが、その `rotate-3` は保持します。アニメーション値は `translate`、`rotate`、`scale` をネイティブに動かします。3D 回転のように、CSS の文字列ではアニメーションする量を保持できないものには、`transform` にステップのリストを渡してください。使えるステップは `translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`（`rotateZ`）、`rotateX`、`rotateY`、`skewX`、`skewY`、`perspective` です（[Animation](./animation.md)）。スタイルの `transform` はどちらか一方の形式になるため、アニメーションするステップの前に置くパースペクティブは、リストのステップとして指定します。

Rust の `.perspective(..)` は CSS の `perspective` プロパティに相当し、Tailwind の `perspective-*` と同様です。これはビューの子に奥行きを与えるもので、`transform` の `perspective()` 関数はビュー自身のトランスフォームに適用されます。`transformOrigin` はキーワード、パーセンテージ、長さ（`"top left"`、`"50% 0"`、`[10, 20]`。Rust では `.origin_top_left()`、`.transform_origin(..)`）を受け取り、デフォルトは中央です。トランスフォームはレイアウトに影響しません。兄弟ビューは、そのビューがトランスフォームされていないものとして配置されます。

Android にはスキュートランスフォームがありません。

<a id="transitions"></a>

## トランジション

ビューは、アニメーションさせる対象を指定すると、自身のスタイルの変更をアニメーションします。アニメーションはネイティブに実行され、フレームごとにコードが実行されることはありません。

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| プロパティ | 値 | Rust |
|---|---|---|
| `transitionProperty` | アニメーションの対象: `"all"`、またはカンマ区切りの名前。色（`"colors"`、`"backgroundColor"`、`"borderColor"` など）、`"opacity"`、`"transform"`（すべてのトランスフォームプロパティ）、`"boxShadow"`、`"borderRadius"` / `"borderWidth"` | `.transition()`、`.transition_all()`、`.transition_colors()`、`.transition_opacity()`、`.transition_transform()`、`.transition_shadow()` |
| `transitionDuration` | `300`、`"300ms"`、`"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | duration と同じ | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`、`"ease"`、`"ease-in"`、`"ease-out"`、`"ease-in-out"`、`"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`、`.ease_in()`、`.ease_out()`、`.ease_in_out()`、`.ease_bezier(x1, y1, x2, y2)` |

サイズと位置はスタイルではなくレイアウトであり、トランジションしません。レイアウトの変更をアニメーションさせるには `LayoutAnimation` を使うか、ネイティブアニメーションで値を駆動してください（[Animation](./animation.md)）。

<a id="keyframe-animations"></a>

### キーフレームアニメーション

`animationName` は、Tailwind の組み込みキーフレームアニメーションのいずれかをネイティブに実行します。`"spin"`、`"ping"`、`"pulse"`、`"bounce"` のいずれかを、`animationDuration`、`animationDelay`、`animationTimingFunction`、`animationIterationCount`（数値または `"infinite"`）と任意の順序で組み合わせて指定できます。Rust では、`.animate_spin()`、`.animate_ping()`、`.animate_pulse()`、`.animate_bounce()` が Tailwind のタイミングでそれらを実行し、`.animation(KeyframeAnimation::new(..))` は独自のタイミングで実行します。

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## 押下フィードバック

押下フィードバックは、押下状態に対してアプリが指定するスタイルで、コードへの往復なしにネイティブに適用されます。ホバー、フォーカス、無効の各状態も同じ方法でスタイルを受け取ります（Rust では `.hover(..)`、`.focus(..)`、`.disabled_style(..)`。TSX では `hoverStyle`、`focusStyle`、`disabledStyle`、または `hover:`、`focus:`、`disabled:`）。

| Rust | TSX | 押下中の効果 |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | ビューがこの不透明度までフェードします |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | 背景がこの色になります |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Android のマテリアルリップル |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | 任意のスタイル |

[Touch and gestures](./touch-and-gestures.md) を参照してください。

<a id="extensions"></a>

## 拡張

これらのキーとクラスは、CSS を超えてネイティブプラットフォームが提供する機能を扱います。

| キー | クラス | 機能 |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | `<Input>` のプレースホルダーの色 |
| `selectionColor` | `selection:bg-*` | `<Input>` または選択可能な `<Text>` の選択ハイライト |
| `tintColor` | `tint-*` | `<Image>` の不透明なピクセルの色を変更します（テンプレート画像、アイコン） |
| `borderCurve` | | `"continuous"`: システム標準と同様に、角が辺へなめらかにつながります（Apple の連続した角） |
| `glassEffect` | | iOS 26 と macOS 26 ではビューの背後に Apple の Liquid Glass を表示し、それ以外では `backdropFilter` を使用します |
| `writingDirection` | | テキストの基本方向: `"auto"`（デフォルト。各プラットフォームのテキストビューと同様に内容から決定）、`"ltr"`、`"rtl"`。`direction` はレイアウトの方向を設定します |
| `textAlignVertical` | | `<Text>` ボックスより短いテキストを配置する位置: `"top"`（デフォルト）、`"center"`、`"bottom"` |
| `textAlign: "auto"` | | テキストの方向に応じた自然な側（デフォルト） |
| `selectedStyle` | `selected:` | `accessibilityState.selected` が `true` のときのスタイル（選択された `Button`、タブ） |
| | `ios:`、`android:`、`web:` | 特定のプラットフォーム向けのクラス（`ios:pt-2`） |

変化する値は、CSS が文字列を取る場所で数値も受け取ります。`transform` はステップのリスト、`translate` と `scale` は `[x, y]`、`boxShadow` と `textShadow` はレイヤーとして指定します。

<a id="related"></a>

## 関連項目

- [Tailwind](./tailwind.md): 同じスタイルをクラスとして指定する方法。ダークモード、押下状態、ブレークポイント用のバリアントと、それらに対応する型付きの指定方法も扱います。
- [Layout](./layout.md) と [Text](./text.md)。
- [Style reference](../modules/style-reference.md): すべてのスタイルプロパティとその型。
