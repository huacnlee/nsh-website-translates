---
title: "ColorPicker"
description: "ColorPicker コンポーネントとその各パーツ。彩度と明度の領域、RGB・HSL・HSB・OKLCH の任意のチャンネルやアルファのスライダーで色を選択できるほか、CSS の任意の形式での入力、スウォッチからの選択、スポイトによる画面上からの色の取得にも対応しています。スクリーンリーダー向けに WAI-ARIA のキー操作と調整可能な要素を備え、レイアウトとスタイルはアプリ側で自由に設定できます。"
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

カラーピッカーは1つの色を保持し、その内部のパーツが色を表示・変更します。パーツは、彩度と明度の`ColorArea`、RGB、HSL、HSB、OKLCHの任意のチャンネルとアルファの`ColorSlider`、色をテキストとして、または1つのチャンネルを数値として受け取る`ColorField`、プリセットカラーの`ColorSwatch`、画面上のどこからでも色を選べる`ColorEyeDropper`です。アプリは、パーツの間に自前の要素を置いてレイアウトし(チャンネルごとにその文字を添えた行、`Tabs`で選ぶ色空間、`Popover`の中のピッカー)、それぞれにスタイルを適用します。パーツはチャンネルの色を描画し、サイズ、角丸、枠線、影はすべてアプリ側が決めます。

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`、`ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch`、`ColorEyeDropper`は[`nsh/base`](../modules/nsh-base.md)、Rustでは`nsh-base`クレートから提供されます。Rustでは、`color_picker()`とそのパーツの関数が、プロパティごとのセッター(`.channel(..)`、`.thumb_style(..)`)、イベントごとのリスナーメソッド(`.on_change(..)`)、型付きのスタイルメソッドでこれらを生成します。色は`Hsla`で、色空間、チャンネル、フォーマットはそれぞれ`ColorSpace`、`ColorChannel`、`ColorFormat`です。

<a id="value"></a>

## 値

色はCSSカラーです。16進数(`#3b82f6`、アルファ付きの`#3b82f680`)、`rgb()`、`hsl()`、`hsb()`、`oklch()`、またはCSSの色名で、Rustでは`Hsla`です。アプリは`value`で色を所有し、`onChange`が報告した色を設定します。これは`nsh/base`のすべてのコントロールと同じです。または、`defaultValue`で色の管理をピッカーに任せても、変更は同様に受け取れます。

- `onChange({ value, formatted })`は、ユーザーが求めた色をその都度報告します。エリアやスライダーのドラッグの各ステップ、各キー入力、入力中のフィールドの数値、押されたスウォッチごとです。`value`は色そのもの、`formatted`は`format`の指定どおりに書き出した同じ色(`"hex"`、`"rgb"`、`"hsl"`、`"hsb"`、`"oklch"`)で、保存したりトークンとして設定したりできます。
- `onChangeEnd({ value, formatted })`は、変更が終わった時点の色を1回だけ報告します。ポインターを離したとき、各キー入力の後、フィールドからフォーカスが外れたか送信されたとき、スウォッチが押されたときです。
- ピッカーは、各色空間の色をユーザーが設定したとおりに保持します。グレーは色相と彩度を保持するため、色相スライダーはユーザーが残した位置にとどまります。OKLCHで編集した色は、sRGBで表示できる範囲を超えても、入力された明度、クロマ、色相を保持します(報告される色はsRGBで表示できる最も近い色で、`"oklch"`の`formatted`はチャンネルの値を保持します)。
- アプリが設定した`value`のうち、ピッカーが報告していないものは、すべての色空間の色を置き換えます。

<a id="spaces-and-channels"></a>

## 色空間とチャンネル

| `colorSpace` | チャンネル(`channel`) | 範囲 |
|---|---|---|
| `"rgb"` | `"red"`、`"green"`、`"blue"` | 0〜255 |
| `"hsl"` | `"hue"`、`"saturation"`、`"lightness"` | 色相は0〜360、その他は0〜100 |
| `"hsb"` | `"hue"`、`"saturation"`、`"brightness"` | 色相は0〜360、その他は0〜100 |
| `"oklch"` | `"lightness"`、`"chroma"`、`"hue"` | 明度は0〜100(0.1刻み)、クロマは0〜0.4(0.001刻み)、色相は0〜360(0.1刻み) |
| 任意 | `"alpha"` | 0〜100 |

スライダーのトラックは、他のチャンネルを固定したままそのチャンネルの色を描画するため、各値がどの色になるかが分かります。色空間にないチャンネルを指定した場合は、その色空間の最初のチャンネルになります(警告が出ます)。

<a id="props"></a>

## プロパティ

<a id="colorpicker-1"></a>

### ColorPicker

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | なし | 色(制御)。アプリは`onChange`が報告した色を設定します。 |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | `value`が未設定の間の初期の色。この場合、ピッカーが自身で色を保持します。 |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | `formatted`が色を書き出す形式。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | どのパーツからも変更できません。`disabled:`クラスがピッカーとそのパーツに適用されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | パーツと、その間に置くアプリの要素。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | ピッカー自体。パーツを囲む列(または行)。 |

### ColorArea

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `panelClass`、`panelStyle` | `.panel_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | パネル。エリア全体を満たし、色相の色を表示します。彩度は左から右へ(右から左のレイアウトでは右から左へ)、明度は下から上へ変化し、角に沿ってクリップされます。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | サム。色の位置を中心に配置されます。 |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | サムの背景がその色になります。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | ポインター、キーボード、スクリーンリーダーによる変更を受け付けません。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | サムについてスクリーンリーダーが読み上げる内容。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | エリア。サイズはアプリが決めます。 |

### ColorSlider

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | チャンネルの色空間。 |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | 変更するチャンネル。色空間のいずれか、または`"alpha"`。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | トラックの向き。最小値が開始側(左。右から左のレイアウトでは右)、または下になります。スライダーの作成時に読み取られます。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | トラック。チャンネルの色がそれに沿って並び、角に沿ってクリップされます。サムはその上に配置されます。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | サム。値の位置を中心に配置されます。 |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | サムの背景がその色になります(アルファスライダーではアルファを含みます)。 |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | なし | トラックの下の市松模様の色。アルファスライダーの色を通して見えます。 |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 市松模様の正方形の一辺の長さ。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | ポインター、キーボード、スクリーンリーダーによる変更を受け付けません。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | サムについてスクリーンリーダーが読み上げる内容。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | スライダー。トラックを囲み、押下とドラッグを受け付ける帯状の領域。 |

### ColorField

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | なし | 数値として受け取るチャンネル。指定しない場合、フィールドは色全体をテキストとして受け取ります。 |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | `channel`の色空間。 |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | フィールドが色全体を書き出す形式。読み取りはどのCSS形式でも可能です。 |
| `placeholder` | `.placeholder(..)` | `string` | なし | フィールドが空の間に表示されます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 入力できません。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | フィールドについてスクリーンリーダーが読み上げる内容。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<TextStyle>` | なし | フィールド(テキスト入力)。 |

チャンネルのフィールドは、数値が入力されるたびに色を変更し、値はチャンネルの範囲に収められます。色全体のフィールドは、フィールドからフォーカスが外れるか送信されたときに、テキストが色として読み取れる場合に色を変更します。フィールドからフォーカスが外れると、その値は元の形式で書き直されます。

### ColorSwatch

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | なし | 表示する色。押すと、それを囲むピッカーでその色が選ばれます。指定しない場合はピッカー自身の色になり、プレビューとして機能します。 |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | なし | ピッカーの色になっている間のスタイル。`selected:`クラスとして指定します。 |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | なし | 半透明の色の下に敷く市松模様。 |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 正方形の一辺の長さ。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下を受け付けません。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 16進数の色 | スクリーンリーダーが読み上げる内容。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 色の上に重ねるコンテンツ。選択中のスウォッチ上のチェックマークなど(`group-selected:`)。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | スウォッチ。サイズ、形、枠線を指定し、角で色がクリップされます。 |

### ColorEyeDropper

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下を受け付けません。プラットフォームにスポイトがない場合も無効になります。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが読み上げる内容。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 内容。アプリのアイコンまたはラベル。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | ボタン。 |

押すとシステムのスポイトが表示されます。macOSではAppKitのカラーサンプラー、Webではブラウザの`EyeDropper`(ChromeとEdge)です。選ばれた色がピッカーの色になります(`onChange`、続いて`onChangeEnd`)。Escapeキーを押すと何も選ばれません。プラットフォームにスポイトがない場合、ボタンは無効になり、`disabled:hidden`によってそこでは非表示になります。

<a id="events"></a>

## イベント

| イベント | 対象 | Rust | ペイロード | タイミング |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | ユーザーが色を変更したとき。 |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 変更が終了したとき。変更ごとに1回。 |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | スウォッチが押されたとき。パレットのチップとして単独でも動作します。 |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | ユーザーが画面上の色を選んだとき。単独でも動作します。 |

Rustでは、`ColorPickerEvent::Change(Hsla, SharedString)`と`ColorPickerEvent::ChangeEnd(Hsla, SharedString)`が色とその`formatted`テキストを保持します。

<a id="parts"></a>

## パーツ

| パーツ | 配置先 | スタイルの指定 |
|---|---|---|
| `ColorArea` | ピッカー | `class`、`style` |
| エリアのパネル | エリア(全体を満たす) | `panelClass`、`panelStyle` |
| エリアのサム | エリア(色の位置が中心) | `thumbClass`、`thumbStyle` |
| `ColorSlider` | ピッカー | `class`、`style` |
| スライダーのトラック | スライダー | `trackClass`、`trackStyle` |
| スライダーのサム | スライダー(トラック上の値の位置が中心) | `thumbClass`、`thumbStyle` |
| `ColorField` | ピッカー | `class`、`style` |
| `ColorSwatch` | ピッカー内、または単独 | `class`、`style`、`selectedStyle` |
| `ColorEyeDropper` | ピッカー内、または単独 | `class`、`style` |

スライダーのサムは、チャンネルの両端ではトラックの端を中心に配置されます。スライダーにサムの幅の半分のパディング(`h-3`のトラックの周囲に`h-6 justify-center px-2.5`)を設けると、サム全体がスライダー内に収まり、両端でも押下を受け付けます。パーツが示す状態は、ドラッグ中のサムの`active:`、キーボードフォーカス時の`focus:`、スウォッチの`selected:`、そしてすべてのパーツの`disabled:`です。

<a id="keyboard"></a>

## キーボード

macOSとWebでは、各サムがキーボードフォーカス(Tab)の停止位置になります。

| キー | スライダー上 | エリア上 |
|---|---|---|
| Right、Up | 1ステップ増加 | Right: 彩度を上げる、Up: 明度を上げる |
| Left、Down | 1ステップ減少 | Left: 彩度を下げる、Down: 明度を下げる |
| Shiftと矢印キー | 10ステップ | 10ステップ |
| Page Up、Page Down | 10ステップ | 明度を10ステップ |
| Home、End | チャンネルの両端 | |

右から左へのレイアウトでは、水平スライダーとエリアは右から始まり、最小値(最小の彩度)が右端になります。Leftが1ステップ増加、Rightが1ステップ減少になり、押下やドラッグでは描画されたとおりにポインター下の値が選ばれます。垂直スライダーでは、RightとUpが引き続き1ステップ増加です。エリアのUpとDownは明度を操作します。

スウォッチはSpaceとReturnを受け付けます。各キーは`onChange`に続いて`onChangeEnd`を報告します。矢印キーは押し続けると繰り返されます。

<a id="accessibility"></a>

## アクセシビリティ

- エリアと各スライダーのサムは調整可能な要素(`"adjustable"`、ブラウザではスライダー)で、ラベル、値、範囲を持ちます。スクリーンリーダーの増加・減少操作でステップ単位に変更できます。
- 各フィールドはラベル付きのテキストフィールドです。各スウォッチはボタンで、ピッカーの色である間は選択状態になり、`accessibilityLabel`で名前を指定しない限り16進数の色が名前になります。スポイトは、アプリのラベルを持つボタンです。
- 無効の間、スクリーンリーダーはパーツが淡色表示であると伝え、操作は受け付けません。

ラベル、ロール、アクション全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注記

- どのプラットフォームでも、アプリがスタイルしたものが描画されます。トラックとパネルの色は、プラットフォームが描画するグラデーションです。押下とドラッグは、マウス、ペン、指のいずれでもコアで追跡され、ピッカーを囲むスクロールビューのスクロールは、ほかの場所から始まったドラッグに限られます。
- `ColorEyeDropper`は、macOSではAppKitのカラーサンプラー、Webではブラウザの`EyeDropper`で色を選びます。色はsRGBで渡されます。
