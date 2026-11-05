---
title: "Progress"
description: "Progress コンポーネント：スクリーンリーダー向けにロール、範囲、値を管理し、値に応じてインジケーターの幅を制御する、リニア型のプログレスバーです。トラックとインジケーターのスタイルはアプリ側で設定します。"
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

プログレスバーは、範囲が分かっているタスク(ダウンロード、アップロード、セットアップの1ステップなど)がどこまで進んだかを示します。`indeterminate` の間は、範囲が不明なタスクが進行中であることを示します。スクリーンリーダーに伝わる内容(0〜100の範囲と値を持つ progress bar ロール)と、インジケーターの幅(トラックの `value` パーセント)は、プログレスバーが管理します。見た目はアプリ側のものです。`Progress` 自体には、色、サイズ、角丸、モーション、ラベルがありません。トラックとその内側のインジケーター、続いて子要素(ラベル、テキストとしての値)で構成され、各パーツのスタイルはアプリが指定します。

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) が提供します。値はアプリ側のものです。プログレスバーは、アプリが渡した `value` を 0〜100 の範囲に収めて表示します。Rust では、`progress()` が、プロパティごとのセッター(`.value(..)`、`.indicator_style(..)`)、プログレスバー自体用の型付きスタイルメソッド、ラベル用の `.child(..)` を備えたプログレスバーを作成します。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | タスクがどこまで進んだかを 0〜100 のパーセントで表します(範囲外の場合は最も近い端の値になります)。インジケーターの幅はトラックの幅のその割合になり、スクリーンリーダーもこの値を読み上げます。 |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | タスクの範囲が不明です。スクリーンリーダーには値のない progress bar として伝わり、インジケーターの幅はアプリ側で決めます(`indicatorClass`)。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが読み上げる内容です。子要素に進行中の内容を表すテキストがない場合に、何が進行中なのかを伝えます。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | トラックです。インジケーターが満たしていく部分にあたります。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | トラックの内側にあるインジケーターです。高さ、色、モーションを指定します。 |
| `children` | `.child(..)` | `JSX.Element` | なし | トラックの後に続くコンテンツです。ラベルやテキストとしての値などで、スクリーンリーダーが読み上げます。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | プログレスバー自体です。トラックとラベルを囲む列(または行)にあたります。 |

<a id="parts"></a>

## パーツ

| パーツ | 内側 | スタイルの指定方法 |
|---|---|---|
| プログレスバー | | `class`、`style` |
| トラック | プログレスバーの先頭 | `trackClass`、`trackStyle` |
| インジケーター | トラック | `indicatorClass`、`indicatorStyle`。幅はトラックの `value` パーセント |
| ラベル | プログレスバー内のトラックの後 | 専用の要素(`children`) |

インジケーターはトラックの先頭側の端から始まります。`overflow-hidden` とトラックの角丸を指定すると、インジケーターの端がトラックの端と一緒に丸くなります。`w-*` クラスや `indicatorStyle` 内の `width` を指定すると、値に基づく幅の代わりにそちらが使われます。不確定状態のバーが独自の幅を持てるのは、この仕組みによります。

## Indeterminate

範囲が不明な間は `indeterminate` を設定し、アプリ側で決めた幅とモーションをインジケーターに与えます。モーションをどうするかはアプリが選びます。`motion-reduce:` を使うと、動きを減らすよう求めているユーザーに対してモーションを止めておけます。

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## アクセシビリティ

- プログレスバーはスクリーンリーダーにとって1つの要素であり、ロールは `"progressbar"`、範囲は 0〜100 で、値を持ちます(VoiceOver と TalkBack はこれをパーセントとして読み上げます)。トラックとインジケーターはその一部です。ラベルは子要素のテキストです。子要素にテキストがない場合は `accessibilityLabel` を指定してください。
- `indeterminate` の間は、ロールと範囲は保たれ、値はありません(ブラウザーでは、ARIA の仕様どおり、不確定な progress bar として `aria-valuenow` が省かれます)。
- 押下操作もキーボードフォーカスも受け付けません。状況を伝えるだけで、タスクを開始・停止するコントロールはアプリ側で用意します。

ラベル、ロール、アナウンス全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注記

- どのプラットフォームでも、アプリが指定したスタイルどおりに描画されます。インジケーターの幅は `value` にすぐ追従し、アプリがアニメーションを指定していれば、変化はアニメーションします。
- スクリーンリーダー:VoiceOver(iOS、macOS)は、値をパーセントとして、バーを頻繁に更新されるものとして読み上げます。TalkBack、UI Automation(Windows)、GTK のアクセシビリティ(Linux)、ブラウザー(`aria-valuenow`)には、範囲と値が渡されます。
