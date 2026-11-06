---
title: "Avatar"
description: "Avatar と AvatarGroup コンポーネント: 人物の画像を表示し、読み込み中、読み込み失敗時、画像がない場合にはフォールバックを表示します。読み込み状態はネイティブで処理されます。また、先頭の数件を表示して残りを集約して示す、アバターの横並びも提供します。"
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---

# Avatar

アバターは人物の画像を表示します。チームのメンバー、コメントの投稿者、ヘッダーのアカウントなどです。画像の読み込み中、読み込みに失敗したとき、そして画像がないときには、フォールバックを表示します。フォールバックは、その人物の `name` のイニシャル、またはアプリ独自のコンテンツ (アイコン) です。アバターは、画像自身の load イベントと error イベントから JavaScript なしでネイティブに実行される画像の読み込み状態と、スクリーンリーダーに渡される内容 (人物の名前が付いた画像) を管理します。見た目はアプリ側で決めます。`Avatar` には、サイズ、形状、色、フォントがありません。`AvatarGroup` は、行の先頭のいくつかのアバターと、残りを表すオーバーフロー ("+5") を表示します。

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` と `AvatarGroup` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に含まれています。Rust では、`avatar()` と `avatar_group()` が、プロパティごとのセッター (`.src(..)`、`.fallback_delay(..)`)、アバター自体のための型付きスタイルメソッド、そして画像の上に置くもののための `.child(..)` を使って、これらを作成します。

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | なし | 画像です。[`<Image>`](./image.md) の `src` が受け取る形式で指定します。URL、`asset:/` または `data:` URI、`blob:` URL (ユーザーが選択した写真: `URL.createObjectURL(file)`)、またはインポートした画像です。読み込みが完了すると表示されます。空文字列は画像なしを意味します。 |
| `name` | `.name(..)` | `string` | なし | 人物の名前です。スクリーンリーダーが読み上げる内容であり、アプリが `fallback` を渡さない場合にフォールバックが表示するイニシャルの元になります。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | スクリーンリーダーが読み上げる内容で、`name` より優先されます。`""` を指定すると、アバターは装飾扱いとなり、スクリーンリーダーから隠されます。 |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | 画像の読み込み中にフォールバックを表示するまで待つ時間です。これにより、すぐに読み込まれる画像でフォールバックが一瞬表示されることを防ぎます。`Infinity`: 読み込み中はフォールバックを表示せず、失敗したときまたは画像がないときにのみ表示します。 |
| `imageClass`、`imageStyle` | `.image_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 画像のフィット、角丸、モーションです。 |
| `fallbackClass`、`fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | フォールバックの背景、文字色、サイズ、およびコンテンツの配置方法です。 |
| `fallback` | `.fallback(..)` | `JSX.Element` | イニシャル | イニシャルの代わりに表示するフォールバックのコンテンツです。アイコンや、名前のない人物用のプレースホルダーなどです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 画像の上に表示するものです。プレゼンスドットやバッジなどです。スクリーンリーダーはこれらではなくアバターのラベルを読み上げます ([Accessibility](#accessibility) を参照)。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | アバター自体のサイズと形状です。 |

| Event | Rust | Payload | Description |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | 画像のステータスが変化しました: `"idle"` (`src` なし)、`"loading"`、`"loaded"`、または `"error"`。 |

## Parts

| Part | Inside | Styled with |
|---|---|---|
| アバター | | `class`、`style` |
| フォールバック | アバターの中の最初の要素で、アバターと同じ大きさです。画像の読み込み中 (`fallbackDelay` の後)、読み込み失敗時、または画像がないときに存在します | `fallbackClass`、`fallbackStyle`。コンテンツはイニシャルまたは `fallback` |
| 画像 | アバターの中でフォールバックの上に重なり、全体を覆います | `imageClass`、`imageStyle` |
| アプリのコンテンツ | アバターの中の最後の要素 | アプリ自身の要素 (`children`) |

アバターにサイズ (`class="size-10"`) を指定してください。フォールバックと画像はそのサイズいっぱいに広がるため、フォールバックが消えてもレイアウトが再計算されることはありません。画像は最初から透明な状態でレイアウトされ、読み込みが完了すると不透明になり、その後フォールバックが消えます。`imageClass` の `transition-opacity` を使うと、画像をフェードインさせることができます (モーションを減らす設定では即座に表示されます)。アバターをクリップするのではなく、画像とフォールバックのそれぞれ (それぞれに `rounded-full`) を丸めてください。そうすれば、端に配置したプレゼンスドット (`absolute bottom-0 right-0`) が欠けずに表示されます。

イニシャルは、名前の最初の 2 単語の頭文字を大文字にしたものです ("Ada Lovelace" は "AL")。1 単語の場合は最初の 2 文字になります ("huacnlee" は "HU")。大文字と小文字の区別がない文字体系の名前では、最初の 1 文字になります ("王小明" は "王")。

## Groups

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | 表示されるアバターは最大でこの数までで、先頭から順に表示されます。残りのアバターのビューは作成されません。 |
| `total` | `.total(..)` | `number` | 子の数 | グループが表す人数です。アプリが先頭の一部だけを渡す場合に指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがグループについて読み上げる内容です。 |
| `overflowClass`、`overflowStyle` | `.overflow_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 表示されたアバターの後ろに置かれるオーバーフロー部分です。 |
| `overflow` | `.overflow(..)` | `JSX.Element` | なし | 表示されていない人々を表すもの ("+5"、"⋯") です。グループ内の人数が表示中のアバター数より多い間だけ存在します。 |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | なし | オーバーフローの内容の代わりにスクリーンリーダーが読み上げる内容です。たとえば "+5" に対する "5 more people" です。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アバターを順番に並べたものです。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 行の方向 (`flex-row`) と間隔です。 |

重なり、リング、オーバーフローの形状はアプリ側で決めます。最初以外のすべてのアバターに負のマージン (`-ml-2`) を指定すると重ねて配置でき、背景色のリングでアバター同士を区切れます。長いリストの場合は、最初の `limit` 人分だけを渡し、`total` を指定してください。そうすれば、表示されるアバターだけが作成されます。オーバーフローが表す人数は、`total` から表示されるアバター数を引いた値です。表示されるアバター数は、子の数と `limit` のうち小さいほうです。たとえば、子が 2 つで `total={8}` の場合、2 つのアバターと "+6" が表示されます。

## Accessibility

- アバターは、スクリーンリーダーにとって 1 つの画像であり、`accessibilityLabel` または `name` がラベルとして付けられます。名前は一度だけ読み上げられます。フォールバックと画像はスクリーンリーダーから隠されるため、イニシャルが別途読み上げられることはありません。どちらもないアバターや `accessibilityLabel=""` のアバターは装飾扱いとなり、スクリーンリーダーから隠されます。これは、表示している名前の隣にあるアバターに適した動作です。
- グループは group として扱われ、`accessibilityLabel` ("Ada, Grace and 5 others") がラベルとして付けられます。表示されるアバターはその内側の画像です。オーバーフローはその内容 ("+5") として、またはアプリが指定した場合は `overflowAccessibilityLabel` ("5 more people") として読み上げられます。NSH は独自の文言を書き込みません。
- アバターはスクリーンリーダーにとって 1 つの要素であるため、その子要素が表示する内容は別途読み上げられません。また iOS では、その中にあるボタンやリンクには全く到達できません。プレゼンスドットやバッジの意味は `accessibilityLabel` ("Ada Lovelace, online") で伝え、押せるものはアバターの中ではなく隣に置いてください。
- どちらもプレス操作やキーボードフォーカスを受け付けません。操作可能にするには、アバターを `Button` の中に置いてください。

ラベル、ロール、アナウンス全般については [Accessibility](../docs/accessibility.md) を参照してください。

## Platform notes

- 各プラットフォームは、それぞれ独自の画像ローダーとキャッシュで画像を読み込みます ([Image](./image.md) を参照)。その load イベントと error イベントが Rust 側でアバターの状態を変更するため、読み込み中や失敗した画像は、画像とフォールバック以外には影響しません。
- 画像はフレームを持った時点で読み込みを開始するため、透明な間もレイアウトされたままになります。
