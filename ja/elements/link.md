---
title: "Link"
description: "Link コンポーネント: 押下するとどこかへ移動するコンテンツ。ページ、サイト、アプリのルートへ移動でき、押下操作、キーボードによるアクティベーション、無効状態、スクリーンリーダー向けの link ロールに対応し、スタイルはアプリ側で指定します。"
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

Link は、ユーザーをどこかへ移動させます。移動先は Web ページ、別のアプリ(`mailto:`、`tel:`)、アプリ自身の画面などです。Link が受け持つのは動作です。具体的には、プレス、キーボードフォーカス中の Return と Space、無効状態、スクリーンリーダー向けの link ロールです。見た目はアプリ側が決めます。`Link` 自体には色も下線もラベルもなく、表示されるのは子要素です。`href` は移動先を示します。これは開くためのデータであり、画面に表示されるテキストではありません。

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。Rust では、`link()` が Link を作成します。プロパティごとのセッター(`.href(..)`、`.open_with(..)`)、イベントごとのリスナー(`.on_open(..)`、`.on_press(..)`)、Link 自体の型付きスタイルメソッド、そのコンテンツ用の `.child(..)` が用意されています。

<a id="opening"></a>

## 開く

フォーカス中の Link に対するプレス、クリック、または Return か Space で、Link は `href` を開きます。

1. `onOpen({ href })` が移動先を通知します。
2. `openWith="system"`(デフォルト)の場合、別のアプリやサイトの URL、つまりスキームを持つ URL(`https:`、`mailto:`、`tel:`、他のアプリが登録したスキーム)は、[`openUrl`](../modules/nsh.md) と同じ方法でアプリの外で開かれます。まず組み込み先アプリのルーターが処理し、その後でシステムが処理します。それ以外の `href`、つまりアプリ内のパス(`/orders/42`)や `#anchor` は、通知されるだけでアプリ側に残ります。
3. `onPress()` がプレスを通知します。

`openWith="app"` を指定すると、Link をどう開くかはアプリの `onOpen` ハンドラーが決めます。アプリ独自のルート、アプリ内 Web ビューのページ、先に確認を挟む処理などが可能です。

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

アプリが `nsh.json`(`"openUrl": true` または `{ "schemes": ["https", "mailto"] }`)で capability を宣言している場合、URL をアプリの外で開くには `openUrl` capability が必要です。

<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | なし | Link の移動先。URL またはアプリ内のパスです。`onOpen` で通知され、表示はされません。 |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | `href` を誰が開くか。別のアプリやサイトの URL はシステムが開き、`"app"` では `onOpen` に任せます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | プレス、プレスのフィードバック、キーボードフォーカスがすべて無効になります。`disabled:` スタイルは適用され、スクリーンリーダーは淡色表示(dimmed)であると伝えます。 |
| `current` | `.current(..)` | `boolean` | `false` | ナビゲーションやパンくずリストで、ユーザーが現在いるページへの Link。スクリーンリーダーは現在のページであると伝えます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | コンテンツだけでは情報が足りない場合(アイコンなど)に、スクリーンリーダーが読み上げる内容。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | なし | 境界の外側でどこまでプレスを有効とみなすか(ポイント単位)。全辺共通の数値か、辺ごとの指定ができます。ビューの `hitSlop` と同じです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | コンテンツ。ラベル、アイコンなど、アプリが表示する任意のもの。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | Link の見た目。色、下線、パディングなど。テキストプロパティは内部のテキストに引き継がれます。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | プレス中、ホバー中、フォーカス中、無効時の Link のスタイル。`<state>:` クラスと同様に指定します。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | Link が `href` を開くときに発生します。`openWith="app"` ではハンドラーが開き、`"system"` ではシステムが開くよう求められた内容を受け取ります。`onPress` より前に発生します。 |
| `onPress` | `.on_press(\|\| ..)` | Link がプレスされたときに発生します。タップ、クリック、またはキーボードフォーカス中の Return か Space が対象です。 |

無効な Link は何も通知せず、その Link へのプレスは周囲のプレス可能なビューにも届きません。

<a id="states"></a>

## 状態

アプリは、クラスまたはスタイルプロパティで各状態のスタイルを指定します。

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

訪問済みの Link は、アプリ側で記憶します。開いた href を保持し、独自の状態に基づいてそれらの Link をスタイルします。

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## テキストの中

`<Text>` の中に置いた `Link` は、テキスト内のあらゆるビューと同様に、段落のインラインボックスになります。行の中に配置され、独自の状態、フォーカス、ロールを持ち、1 行に収まったままになります。`align-text-bottom` は、1 行のテキストを持つ Link を段落のベースラインに揃えます。

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

段落の行に合わせて折り返す Link は、`role="link"` と `onPress` を指定した、入れ子の `<Text>` にします(詳しくは [Text](./text.md) を参照)。[TextView](./text-view.md) がドキュメント内の Link を描画するのも、この方法です。

<a id="a-small-target-with-hitslop"></a>

## hitSlop で小さなターゲットを扱う

Link は指より小さくなることがあります。アイコンや短い単語などです。`hitSlop` を使うと、Link の近くに落ちたプレスも有効になります。範囲は各辺の外側へのポイント数で指定し、レイアウトや見た目は変わりません。全辺共通の数値か、辺ごとの指定(`{ top: 8, bottom: 8 }`)ができます。これは [ビューの `hitSlop`](./index.md#presses-and-feedback) と同じ指定方法です。

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## アクセシビリティ

- Link はスクリーンリーダーに対して 1 つの要素となり、ロールは `"link"` です。ラベルは子要素のテキスト、または `accessibilityLabel` です。`href` はデータのままで、スクリーンリーダーはラベルを読み上げます。
- `current` は現在のページとして読み上げられ(ARIA の `aria-current="page"`)、`disabled` はプラットフォームごとの淡色表示要素の読み上げ方で伝えられます。
- macOS と Web では、Link はキーボードフォーカスの停止位置になります。Tab で到達でき、Return と Space で開き、`focus:` スタイルがフォーカス位置を示します。

ラベル、ロール、アナウンス全般については [アクセシビリティ](../docs/accessibility.md) を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- iOS、Android、Mac Catalyst: プレスは Link の上で終わるタップです。
- デスクトップ(macOS、Windows、Linux、GPUI)と Web: プレスはクリックです。macOS と Web では、キーボードフォーカス中の Link を Return と Space でも開けます。
- Web では、Link を `role="link"` を持つ要素としてレンダリングします。
- どのプラットフォームでも、アプリがスタイルした内容がそのまま描画されます。
