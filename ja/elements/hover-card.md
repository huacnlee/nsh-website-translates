---
title: "HoverCard"
description: "HoverCard コンポーネント: トリガーが指す内容のプレビューを、ポインターがトリガー上にある間表示します。スタイルはアプリ側で自由に設定できます。"
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

ホバーカードは、ページを離れることなく、トリガーが指し示す先をプレビューします。メンションの先にあるプロフィール、リンクの先にあるページ、ティッカーの先にある相場などが例です。デスクトップおよびデスクトップブラウザでは、ポインターがトリガー上に `openDelay`(600 ms)の間とどまったとき、またはキーボードフォーカスがトリガーに移ったときに開きます。ポインターがトリガーからカードへ、またカードからトリガーへ移動している間、およびキーボードフォーカスがトリガー、またはカード内のリンクやボタンにある間は開いたままになるため、カード内のすべてをポインターでもキーボードでも操作できます。ポインターが両方から離れ、フォーカスもどちらにもない状態が `closeDelay`(300 ms)続くと閉じます。Escape とカード外の押下は、ただちに閉じます。スマートフォンとタブレットでは、トリガーを押すと開閉し、カード外を押すと閉じます。

[`nsh/base`](../modules/nsh-base.md) の `HoverCard` は、それ自体では何も描画しません。トリガーはあなたの要素であり、ポップアップとその内容もあなたのものです。

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

トリガーは、それ自体のロール、押下の動作、見た目をそのまま保ちます。`role="link"` と独自の `onPress` を持つビューは、押されたときに従来どおりの遷移先へ移動し、カードはそこにプレビューを追加するだけです。内容はカードが開くたびに作られるため、表示するものをそのときに読み込めます。押下でカードが開くスマートフォンとタブレットでは、トリガーがカードの開閉状態をスクリーンリーダーに伝えます。[Toolbar](./toolbar.md) では、トリガーをそのアイテムの 1 つにできます。ただしカードの中身はアイテムではありません。カード内のボタンやリンクはそれぞれ独自の Tab ストップを保ち、Toolbar の `disabled` はそれらに手を加えません。

<a id="delays"></a>

## 遅延

`openDelay` は、ポインターが別の場所へ向かう途中でトリガーを横切ったときに、カードが一瞬だけ開いてしまうのを防ぎます。`closeDelay` は、ポインターがトリガーとカードの間のすき間を渡るための猶予を与えます。どちらもミリ秒単位です。ポインターと遅延はネイティブ側で追跡されるため、トリガー上でとどまる操作や、トリガーとカードの間の移動では、カードが開閉するまであなたのコードは実行されません。`openDelay` を `Infinity` にすると、開く操作はアプリに委ねられます(タッチスクリーンでの押下も同様です)。`closeDelay` を `Infinity` にすると、閉じる操作は Escape、カード外の押下、およびアプリに委ねられます。

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## 開閉状態

`open` がない場合、カードは自身で状態を保持し、`defaultOpen` から始まります。`open` を指定すると、状態はアプリが所有します。状態は `onOpenChange({ open, reason })` で変更します。このコールバックは、開閉のすべての要求を理由とともに通知します。理由は `"hover"`(ポインター)、`"focus"`(キーボードフォーカス)、`"triggerPress"`(タッチスクリーンでの押下)、`"pressOutside"` または `"cancel"`(Escape または戻る操作)です。

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## 開始と終了のアニメーション

ホバーカードは、[Popover](./popover.md) と同様に、トランジションとともに現れ、消えます。`popupStartingClass` は最初のフレームでのポップアップの見た目であり、`popupClass` の `transition-*` クラスがそこから本来の見た目へ移行させます。`popupEndingClass` は閉じた後の見た目です。これらのトランジションが実行されている間、カードは残りますがポインター操作は受け付けず、その後に消え、続いて `onClose` が呼ばれます。消えている最中にもう一度トリガー上にとどまると、カードは元に戻ります。ユーザーがモーションの軽減を求めている場合は、カードはただちに表示され、ただちに消えます。

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

カードはデフォルトでトリガーの下に表示され(`placement`、`align`)、スペースがなければ反対側に表示され、セーフエリアの内側にとどまります。どこに表示されたかは `onPosition({ placement, bounds, available })` で分かります。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | なし | 開閉状態。アプリが制御します。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` を使わない場合の、最初の開閉状態。 |
| `openDelay` | `.open_delay(..)` | `number` | `600` | カードが開くまでに、ポインターがトリガー上にとどまる、またはフォーカスがトリガーにある時間(ミリ秒)。`Infinity`: 自動では開きません。 |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | カードが閉じるまでに、ポインターがトリガーとカードの両方から離れ、フォーカスもどちらにもない時間(ミリ秒)。`Infinity`: 自動では閉じません。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | カードを表示するトリガーの辺。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | その辺に沿ったトリガーとの揃え方。 |
| `offset` | `.offset(..)` | `number` | `0` | トリガーとカードの間隔。 |
| `margin` | `.margin(..)` | `number` | `0` | セーフエリアの端から保つ距離。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | ポップアップ、つまり内容を収めるカードの見た目。 |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 最初のフレームでのポップアップの見た目。本来の見た目に重ねて適用され、トランジションはここから始まります。 |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 閉じた後のポップアップの見た目。本来の見た目に重ねて適用され、トランジションが実行されている間は残ります。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | なし | プレビューの対象。カードはこれを基準に配置されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 内容。開くたびに作られます。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 開閉を要求します。理由は `"hover"`、`"focus"`、`"triggerPress"`、`"pressOutside"`、`"cancel"` のいずれかです。 |
| `onOpen` | `.on_open(\|\| ..)` | 表示されました。 |
| `onClose` | `.on_close(\|\| ..)` | 終了アニメーションの後に消えました。アプリが閉じた場合も通知されます。 |
| `onPosition` | `.on_position(\|e\| ..)` | ポップアップが配置されました。`placement`(表示された辺)、`bounds`(フレーム)、`available`(その辺の余白)。 |

<a id="accessibility"></a>

## アクセシビリティ

ホバーカードはトリガーに機能を追加します。トリガーのロールとラベルは保たれ、押下したときに開くものや実行される動作も変わりません。キーボードユーザーは、フォーカスがトリガーにとどまるとカードを利用でき、Escape で閉じられます。カードは独自のフォーカスを取らないため、Tab はこれまでどおりトリガーから先へ進みます。カード内のリンクとボタンは、他の場所と同様にフォーカスを受け取り、そのいずれかがフォーカスを持っている間、カードは開いたままです。カード内の重要な情報は、トリガーの遷移先のページからも到達できるようにしてください。
