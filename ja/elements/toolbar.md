---
title: "Toolbar"
description: "Toolbar、ToolbarGroup、ToolbarSeparator: ボタン、トグル、リンクを並べたバーです。キーボードフォーカスでは 1 つの停止位置として扱われ、矢印キーでバー内を移動できます。名前付きグループとセパレーターにも対応しています。各コントロールの見た目と状態はアプリ側で管理します。"
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

ツールバーは、コントロールを並べたバーです。テキストエディタの書式設定、メディアプレーヤーの操作、縦に並ぶツールパレットなどがあたります。
`Toolbar` はそのキーボード操作とセマンティクスを担います。スクリーンリーダーはツールバーを(`accessibilityLabel` で名前を付けて)読み上げ、キーボードは 1 回の停止でツールバーに到達し、`axis` の矢印キーでアイテム間を移動します。アイテムは、ツールバーの内側にある `Button`、`Toggle`、`Link` で、階層の深さは問いません。`ToolbarGroup` は関連するアイテムのまとまり(元に戻すとやり直し、配置など)に名前を付けたもの、`ToolbarSeparator` はまとまりの間にアプリが描く線です。見た目はアプリ側で決めます。ツールバー自体は色、パディング、ギャップを持たず、各コントロールが自身の状態を保持します。

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`、`ToolbarGroup`、`ToolbarSeparator` は [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では `nsh-base` クレートです。ツールバーは値を保持しません。内側のトグルは押された状態かどうかを渡されて `onChange` を報告し、ボタンは `onPress` を報告し、状態はアプリが保持します。Rust では `toolbar()`、`toolbar_group()`、`toolbar_separator()` でこれらを作成します。プロパティごとのセッター(`.axis(..)`、`.disabled(..)`)、型付きのスタイルメソッド、内容を指定する `.child(..)` を備えています。

<a id="props"></a>

## プロパティ

<a id="toolbar-1"></a>

### Toolbar

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | アイテムが並ぶ方向。移動に使う矢印キー(左右、または上下)と、子要素のレイアウト方向(行または列)を決めます。ツールバーの作成時に読み取られます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 各アイテム自身の `disabled` に関係なく、ツールバーのすべてのアイテムを無効にします。押下を受け付けず、キーボードフォーカスの停止位置にならず、スクリーンリーダーには淡色表示として伝わります。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがツールバーを呼ぶ名前(「Formatting」など)。ページに複数のツールバーがある場合に使います。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アイテム、そのグループとセパレーター、およびアプリがその間に配置するもの(タイトル、スペーサー、入力欄など)。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | バーのレイアウトと見た目: 配置、ギャップ、パディング、サーフェス。 |

### ToolbarGroup

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 各アイテム自身の `disabled` に関係なく、グループのすべてのアイテムを無効にします。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがグループを呼ぶ名前(「History」、「Alignment」など)。 |
| `children` | `.child(..)` | `JSX.Element` | なし | グループのアイテム、およびアプリがその間に配置するもの。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | グループのレイアウトと見た目。ツールバーの軸に沿って並びます。 |

### ToolbarSeparator

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 線の指定: 行を横切る細い線(`h-5 w-px bg-border`)、または列を横切る細い線(`h-px self-stretch bg-border`)。 |

<a id="items"></a>

## アイテム

ツールバーのアイテムは、その内側にある `Button`、`Toggle`、`Link` です。グループの中にあるものや、内側の [`ToggleGroup`](./toggle.md) の中にあるものも含みます。[`Menu`](./menu.md) や [`Popover`](./popover.md) のトリガーもアイテムです。これは `trigger` スロット内のビューで、ポップアップが押下、フォーカス、`expanded` 状態を与えます。アプリが自前で描画するツールは、アプリのクラスを付けた `Button` です。`Button` 自体には見た目がないため、アプリがスタイルしたとおりに表示され、アイテムとして扱われます(`onPress` を指定した `View` は独立した停止位置のままで、矢印キーの対象外です)。ツールバー内の `ToggleGroup` はそのグループの 1 つになります。そのトグルはツールバーのアイテムとなり、スクリーンリーダーはグループとして読み上げ、その `disabled` は引き続き自身のトグルを無効にします。その他のコントロール(`Input`、`Select`、`Slider`)は独立した停止位置のままで、矢印キーも自身で使います。これらはバーの末尾に配置してください。アイテムが開くポップアップの内容(ポップオーバーのフィールドやボタン、メニューのアイテム、ホバーカードのリンク)は、ツールバーには含まれません。矢印キーは、各アイテムがどれほど深い階層にあっても、バーがレイアウトした順にアイテムをたどります。あとから表示されたアイテムは、その並びの中に収まります。

<a id="parts"></a>

## パーツ

| パーツ | 内側 | スタイル指定 | 状態 |
|---|---|---|---|
| バー | | `Toolbar` の `class`、`style` | |
| グループ | バー | `ToolbarGroup` の `class`、`style` | |
| セパレーター | バー、グループ | `ToolbarSeparator` の `class`、`style` | |
| アイテム | バー、グループ | アイテム自身の `class`、`style` | 各アイテム自身のもの: `aria-pressed:`、`disabled:`、`hover:`、`focus:`、`active:` |

キーボードが置かれているアイテムは `focus:` スタイルで示し、押されたトグルはそのトグル自身のサーフェスで示します(参照: [デザインガイド](../docs/design-guides.md#interaction-states))。

<a id="vertical"></a>

## 縦向き

ツールのパレットは列になります。`axis="vertical"` でアイテムを上から下へ配置し、上下キーでそれらの間を移動します。

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## 無効化

ツールバーに `disabled` を指定すると、バー内のすべてのアイテムが無効になります(アプリがバーをロックする場合です)。グループに指定すると、そのグループのアイテムが無効になります。無効なアイテムは押下を受け付けず、矢印キーはそれを飛ばし、スクリーンリーダーには淡色表示として伝わります。

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## アクセシビリティ

- `Toolbar` はロール `"toolbar"` を持ち、`accessibilityLabel` で名前が付きます。アイテムは引き続き独立した要素です。iOS では、ツールバーは VoiceOver が入っていくセマンティックなグループです。
- `ToolbarGroup` はロール `"group"` を持ち、`accessibilityLabel` で名前が付くため、一連のアイテムが 1 つのまとまりとして読み上げられます。ツールバー内の `ToggleGroup` もグループです。
- `ToolbarSeparator` はスクリーンリーダーにとって要素ではありません。
- `disabled` は、各プラットフォームの流儀に従って読み上げられます(VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー)。

ラベル、ロール、読み上げ全般については [アクセシビリティ](../docs/accessibility.md) を参照してください。

<a id="keyboard"></a>

## キーボード

Tab が押下を受け付けるビューに到達する macOS と Web では、`Toolbar` は [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) に従います。

| キー | 動作 |
|---|---|
| Tab、Shift+Tab | フォーカスが最後に離れたアイテム(最初は、無効でない最初のアイテム)でツールバーに入り、1 回の操作でツールバーから出ます。 |
| 右、左(`axis="horizontal"`) | フォーカスを次または前のアイテムへ移動します。最後から最初へ、またその逆へも循環します。 |
| 下、上(`axis="vertical"`) | フォーカスを次または前のアイテムへ移動します。最後から最初へ、またその逆へも循環します。 |
| Home、End | フォーカスを最初または最後のアイテムへ移動します。 |
| Space、Return | フォーカスされているアイテムを押します。 |

矢印キーは無効なアイテムを飛ばし、何も押しません。トグルが変化するのは、押されたときだけです。もう一方の組の矢印キーはアイテムに任されます(メニューのトリガーは下キーでメニューを開きます)。右から左へのレイアウトでは、横向きのツールバーは右から並ぶため、左キーが次のアイテム、右キーが前のアイテムへ移動します。縦向きのツールバーでは、下キーと上キーのままです。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- iOS、Android、Mac Catalyst: 各アイテムはタップで押します。ツールバーはスクリーンリーダーが読み上げるグループです。
- デスクトップ(macOS、Windows、Linux、GPUI)と Web: 押下はクリックです。macOS と Web では、ツールバーは Tab の停止位置が 1 つで、矢印キー、Home、End でアイテム間を移動します([キーボード](#keyboard))。
- すべてのプラットフォームで、アプリがスタイルしたものが描画されます。バー、そのグループ、セパレーター、アイテムが対象です。
