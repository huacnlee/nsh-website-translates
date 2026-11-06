---
title: "Slider"
description: "Slider コンポーネント: トラック上で値、または 2 つの値からなる範囲を選択します。タッチスクリーンとマウスでのプレスとドラッグに対応し、WAI-ARIA のスライダーキーと、各サムに対するスクリーンリーダー向けの値を備えています。トラック、インジケーター、範囲、サムはアプリ側でスタイルを設定できます。"
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---

# Slider

Slider は、トラック上の値(音量、明るさなど)、または各端にサムを持つ2つの値の範囲(価格帯など)を選択するコンポーネントです。動作は Slider 自身が管理します。トラックを押すと近いほうのサムがその位置へ移動し、サムはマウスや指でのドラッグに追従します。値は `step` にスナップします。各サムはキーボードフォーカスの停止位置となり、矢印キーで動かせ、スクリーンリーダーには固有の値を持つ調整可能な要素として公開されます。見た目はアプリ側が決めます。`Slider` 自体は色、サイズ、角丸、モーションを持ちません。Slider は、トラックとその内側のインジケーター、インジケーター上のレンジとサム、そして子要素(ラベル、テキストとしての値)で構成され、アプリが各パーツにスタイルを適用します。

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。Rust では、`slider()` がプロパティごとのセッター(`.value(..)`、`.thumb_style(..)`)、イベントごとのリスナーメソッド(`.on_change(..)`)、Slider 自身用の型付きスタイルメソッド、ラベル用の `.child(..)` を備えた Slider を作成します。値は `SliderValue` で、`Single(f64)` または `Range(f64, f64)` のいずれかです。

<a id="value"></a>

## 値

値は数値、または2つのサムを持つ範囲の場合は `[start, end]` です。値の形によってサムの数が決まります。アプリは `value` で値を管理し、`nsh/base` のすべてのコントロールと同様に、`onChange` が通知する値を設定します。あるいは `defaultValue` で値を Slider に任せ、変更の通知だけを受け取ることもできます。ドラッグ中は、サムとレンジがネイティブに同じフレームでポインターに追従します。ポインターを離すと、ドラッグの最後の変更に対してアプリが設定した `value` が再び表示されます。スクリーンリーダーには、ドラッグ中はその途中の値が読み上げられ、ドラッグが行われていない場合は最終的な値が読み上げられます。

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` は、ユーザーが求めた新しい値のたびに通知します。トラックを押したとき、ドラッグの各ステップ、各キー入力が対象です。通知のたびに新しい値になります。
- `onChangeEnd` は、変更が終了した時点の値を1回だけ通知します。値を設定した押下やドラッグの後にポインターを離したとき、および各キー入力やスクリーンリーダーの各ステップの後(それぞれが1つの完結した変更)に通知されます。値の保存や送信はここで行ってください。
- 値は `min` を起点とした `step` にスナップし(`min={1} step={2}` では 1、3、5、...)、`min` と `max` の間に収まります。`max` には常に到達できるため、範囲がステップの整数倍でない場合は最後のステップが短くなります。`step={0}` は任意の値を取ります。
- 範囲のサムは交差しません。ドラッグ中のサムはもう一方のサムの位置で止まります。2つのサムが同じ値にある状態でドラッグを開始した場合は、ポインターの向きに動けるほうのサムが動きます。
- 表示される値はアプリの値で、`min` と `max` の範囲に制限されます(範囲の両端は順序どおりに保たれます)。ステップのグリッドから外れた値はその位置にそのまま表示され、ユーザーの次の変更でスナップします。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | 既定値 | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | なし | 値(制御モード)。数値、または2つのサムを持つ範囲。アプリは `onChange` が通知する値を設定します。 |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | `value` が未設定の間の初期値。この場合、Slider が値を自身で保持します。 |
| `min` | `.min(..)` | `number` | `0` | 最小値。 |
| `max` | `.max(..)` | `number` | `100` | 最大値。`min` より小さい値は `min` になります。 |
| `step` | `.step(..)` | `number` | `1` | 値がスナップするステップ。`min` を起点として数えます。`0` は任意の値を取ります。 |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | 値がトラック上にどう分布するか。均等に分布するか、桁数(オーダー)ごとに分布します(1 から 1000 の場合、3分の1の位置が 10)。対数スケールには 0 より大きい `min` が必要で、`min` がそれ以下の場合は線形になります。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | トラックの方向。`min` は開始側(左、右から左へのレイアウトでは右)、または下端に置きます。Slider の作成時に読み取られます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | ポインター、キーボード、スクリーンリーダーによる変更を受け付けません。`disabled:` クラスが Slider とそのパーツに適用されます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがサムに対して読み上げる内容(範囲の場合は終端のサム)。 |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | スクリーンリーダーが範囲の開始側サムに対して読み上げる内容。 |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | トラック。押下とドラッグを受け付ける領域。 |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | インジケーター。値が対応づけられるレール。 |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | レンジ。`min` からサムまで(範囲の場合は2つのサムの間)で、Slider が配置します。 |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | 各サム。それぞれの値の位置を中心に配置されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | トラックの後ろに置くコンテンツ(ラベル、テキストとしての値)。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | Slider 自身。トラックとラベルを囲む列(または行)。 |

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | ユーザーが新しい値を求めたとき。トラックの押下、ドラッグのステップ、キー入力、スクリーンリーダーの増加または減少操作。 |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 変更が終了したとき。ポインターが離れた、またはキーやスクリーンリーダーのステップが完了した場合。変更ごとに1回。 |

<a id="parts"></a>

## パーツ

| パーツ | 配置先 | スタイルの指定方法 |
|---|---|---|
| Slider | | `class`, `style` |
| トラック | Slider の最初の要素 | `trackClass`, `trackStyle` |
| インジケーター | トラックの内側 | `indicatorClass`, `indicatorStyle` |
| レンジ | インジケーターの内側。値に応じて配置 | `rangeClass`, `rangeStyle` |
| サム(範囲では2つ) | インジケーターの内側。それぞれの値の位置を中心に配置 | `thumbClass`, `thumbStyle` |
| ラベル | Slider の内側、トラックの後ろ | 独自の要素(`children`) |

トラックは押下とドラッグを受け付けます。インジケーターの長さが値の範囲を表し、`min` はその先頭端(縦向きの場合は下端)にあります。Slider はレンジとサムをインジケーター上に配置し、サムはそのサイズに関係なく値の位置を中心に置かれます。レイアウトには2つの方法があります。

- トラックをレールにする方法(上の例)。`h-full` のインジケーターを持つ `h-2 px-2 rounded-full bg-muted` を使います。パディングにより両端でサムがレール内に収まり、レンジの `-ml-2` により塗りつぶしがレール自身の端から始まります。
- トラックをレールの周囲の帯にする方法。タッチスクリーンで指が見つけやすいよう、より高くします。`h-2 rounded-full` のインジケーターを持つ `h-8 justify-center` を使います(縦向きの Slider では `w-8 items-center` と `w-2 h-full`)。

パーツが表す状態:

- サム: ポインターの下では `hover:`、ドラッグ中は `active:`、キーボードフォーカス時は `focus:`、そして `disabled:`。
- トラック: トラックへの押下でドラッグしている間は `active:`。これは `group` なので、インジケーター、レンジ、サムはそこから `group-hover:` と `group-active:` を引き継ぎます。
- すべてのパーツ: Slider が無効の間は `disabled:`。

サムは値の変化に合わせて動き、ドラッグには即座に追従します。サムの状態に伴うモーションはアプリが選びます(`hover:` と `active:` で明るくなるサムには `transition`)。`motion-reduce:` を使うと、モーションの軽減を求めているユーザーに対してそれを静止状態に保ちます。キーボードフォーカスはサムが持ちます。サムがフォーカスを持つ間はトラックの `focus-within:` がレール全体を囲み、サムの `focus:outline-none` がプラットフォーム標準のフォーカスアウトラインの代わりになります。

<a id="keyboard"></a>

## キーボード

macOS と Web では、各サムがキーボードフォーカスの停止位置(Tab)となり、フォーカスされたサムは WAI-ARIA の Slider キーを受け付けます。

| キー | 動作 |
|---|---|
| Right、Up | 1ステップ増やす(縦向きの Slider でも同様)。 |
| Left、Down | 1ステップ減らす。 |
| Page Up、Page Down | 範囲の10分の1だけ増減する(スケールに沿って)。最低でも1ステップ。 |
| Home、End | サムが移動できる最小または最大まで動かす(範囲の開始側は終端まで)。 |

右から左へのレイアウトでは、横向きの Slider は右から始まり、その `min` は右端にあります。Left が1ステップ増加、Right が1ステップ減少となり、左へのドラッグで値が増えます。縦向きの Slider では、Right と Up が引き続き1ステップ増加です。

値を変更する各キー入力は、`onChange` の後に `onChangeEnd` を通知します。矢印キーとページキーは押し続けると繰り返されます。キーが Slider に届くのは、テキスト入力が編集中でない間だけです。

<a id="accessibility"></a>

## アクセシビリティ

- 各サムは、ラベル、値、取り得る値を持つ調整可能な要素(`"adjustable"`、ブラウザーでは slider)です。範囲の開始側は `min` から終端まで、終端側は開始側から `max` までの値を取るため、スクリーンリーダーは両方を読み取って設定できます。値は、ステップの小数桁数を持つ数値として読み上げられます(`2.5`)。
- スクリーンリーダーの増加および減少アクション(VoiceOver の上下スワイプ)は、矢印キーと同様にサムをステップ移動します。
- サムはスクリーンリーダーに対する Slider の要素であり、`accessibilityLabel` で名前が付けられます(範囲の開始側は `startAccessibilityLabel`)。子要素にある可視ラベルは、その場所で読み上げられます。
- `disabled` の間、スクリーンリーダーはサムが淡色表示であると伝え、サムはアクションを受け付けません。

ラベル、ロール、アクション全般については [アクセシビリティ](../docs/accessibility.md) を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- すべてのプラットフォームで、アプリがスタイルを指定したものが描画されます。押下とドラッグはコアで追跡され、マウス、ペン、指のいずれにも対応します。Slider を囲むスクロールビューは、Slider 上で始まったドラッグを受け取りません。
- macOS と Web では、Tab でサム間のキーボードフォーカスを移動し、フォーカスされたサムが Slider キーを受け付けます。
- スクリーンリーダー: VoiceOver(iOS、macOS)と TalkBack は各サムを調整します。UI Automation(Windows)、GTK のアクセシビリティ(Linux)、ブラウザー(`role="slider"`、`aria-valuenow`、`aria-valuetext`)は、その範囲と値を取得します。
