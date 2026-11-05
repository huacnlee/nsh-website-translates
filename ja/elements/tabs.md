---
title: "Tabs"
description: "Tab と Tabs: タブリストを構成する個々のタブとリスト本体です。各タブは、プレス操作、キーボードによるアクティブ化、無効状態、そしてスクリーンリーダー向けのロールと選択状態を管理します。リストはタブの集合であり、選択中のタブに追従するインジケーターをネイティブに提供します。外観、値、各タブに表示するコンテンツはアプリ側で定義します。"
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# タブ

タブは、1か所の中のセクションを切り替えます。プロジェクトの概要とアクティビティ、ドキュメントのビューなどです。
各`Tab`は1つのタブの動作を担います。具体的には、押下、キーボードによる操作、無効状態、スクリーンリーダー向けのタブロールとその選択状態です。それらを囲む`Tabs`はタブリストで、スクリーンリーダーはこれを1つのまとまりとして読み上げます。見た目はアプリ側のものです。タブ自身には色もサイズもラベルもありません。子要素がアプリのラベルとなり、タブ上の`selected:`クラスや、タブの内側にある要素の`group-selected:`クラスがその状態に追従します。各セクションのコンテンツもアプリ側のものです。リストの隣に、value が指すセクションを表示します。リストのインジケーターは、アプリがスタイルを指定する下線やピルで、選択中のタブの上に置かれ、次のタブへネイティブにアニメーションしながら移動します
([インジケーター](#indicator))。

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab`と`Tabs`は、Rust の`nsh-base`クレートである[`nsh/base`](../modules/nsh-base.md)に含まれます。value はアプリ側のものであり、リストは値を持ちません。各タブには選択中かどうかが伝えられ、押下すると`onPress`が通知されます。アプリは value を設定してそのセクションを表示し、すべてのタブはアプリが返す`selected`を表示します。リストの角とタブの角は同心になります。リストのパディング(`p-1`)は、`radius.lg`と`radius`の差です。選択中のタブの塗りはリストのインジケーター(`indicatorClass`、そのパディングの内側: `inset-y-1`)で、アプリが選択したタブへスプリングで移動します。Rust では、`tab()`と`tabs()`がこれらを生成します。プロパティごとのセッター(`.selected(..)`)、イベントごとのリスナー(`.on_press(..)`)、型付きのスタイルメソッド、そして内容を渡すための`.child(..)`を備えています。

<a id="props"></a>

## プロパティ

### Tab

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | リスト内の現在のタブです。スクリーンリーダーは選択中と読み上げ、`selected:`スタイルが適用されます。押下すると`onPress`が通知され、タブはアプリが返す値を表示します。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下を受け付けず、押下のフィードバックもありません。`disabled:`スタイルが適用され、スクリーンリーダーは淡色表示と読み上げます。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | 選択中で、かつ無効でないときのタブのスタイルです(`selected:`クラス)。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーが読み上げる内容で、子要素にそれを伝えるテキストがない場合(アイコンなど)のタブの名前です。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アプリのラベル、アイコン、バッジで、スクリーンリーダーが読み上げます。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | タブ自体、つまりラベルを囲むサーフェスです。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下中、ホバー中、フォーカス中、無効時のタブのスタイルです(`<state>:`クラス)。 |

<a id="tabs-1"></a>

### Tabs

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | なし | 選択中のタブ上にあるインジケーターの Tailwind クラスです。見た目と、リストを横切る方向での位置を指定します(行の下線なら`bottom-0 h-0.5`、ピルなら`inset-y-1`)。リストに沿う方向では、その軸上の自身のマージンの内側で、選択中のタブの範囲に広がります。`indicatorClass`または`indicatorStyle`を指定すると、リストにインジケーターが付きます。 |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | インジケーターのスタイルで、`indicatorClass`の上に重ねて適用されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | リストのタブと、その間にアプリが配置する任意の要素です。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | リストのレイアウトと見た目です。デフォルトは列で、行にするには`flex-row`を使います。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | タブが押されました。タップ、クリック、キーボードフォーカス中の Space または Return、スクリーンリーダーによる操作のほか、リストの矢印キー、Home、End によってキーボードフォーカスがそのタブへ移動した場合も含まれます。何かが変更される前に実行され、タブはアプリが返す`selected`を表示します。 |

選択中のタブも押下を通知するため、アプリは2回目の押下に対して処理を行えます(たとえば、そのセクションを先頭までスクロールするなど)。
無効なタブは何も通知しません。

<a id="parts"></a>

## パーツ

| パーツ | 内側 | スタイルの指定方法 | 状態 |
|---|---|---|---|
| リスト | | `Tabs`の`class`、`style` | |
| インジケーター | リストの中、タブの背面 | `indicatorClass`、`indicatorStyle` | 選択中のタブ上 |
| タブ | リスト | `Tab`の`class`、`style` | `selected:`、`disabled:`、`active:`、`hover:`、`focus:`(または`selectedStyle`、`disabledStyle` など) |
| ラベル | タブ | 独自の要素(`children`) | `group-selected:`、`group-disabled:`、およびタブの`class`に`group`を付けたその他の`group-*:`バリアント |
| セクションのコンテンツ | リストの隣 | アプリの要素 | アプリの value |

選択中のタブは、そのタブ自身のサーフェスで示してください。塗り、より強いラベル、より太いウェイトなどです
([デザインガイド](../docs/design-guides.md#interaction-states)を参照)。

<a id="indicator"></a>

## インジケーター

選択中のタブの下の下線、背面のピル、セグメントコントロールで浮き上がるセグメントは、いずれもリストのインジケーターです。これは、アプリが`indicatorClass`と`indicatorStyle`でスタイルを指定するビューで、タブの背面に描画され、リスト内で絶対位置に配置されます。Native Shell は、レイアウトのたびに、これを選択中のタブの上に配置します。リストに沿う方向(行なら幅、列なら高さ)では、そのタブの範囲に、インジケーター自身のその軸上のマージン(タブより短い下線なら`mx-3`)の内側で広がります。リストを横切る方向では、そのクラスが位置を決めます。

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

アプリが別のタブを選択すると、インジケーターは GPUI Kit のタブバーのインジケーターと同様に、ネイティブにスプリングでそこへ移動します。モーションの軽減が有効な場合は、即座に移動します。どのタブも選択されていない間は非表示になり、複数選択されている間は最初のタブの上に置かれます。リサイズやタブの幅の変更があっても、タブと同じフレームで移動します。
インジケーターにレイアウトイベントやアプリ側のコードは必要ありません。選択中のタブとは、`selected`が true のタブのことです。スクロールするリストでは、スクロールビューを`Tabs`の外側に置くと、インジケーターはタブと一緒にスクロールします。

<a id="disabled"></a>

## 無効状態

無効なタブは押下を受け付けず、スクリーンリーダーは淡色表示と読み上げます。`disabled:`クラスは`selected:`クラスの上に適用され、その内側の`group-disabled:`クラスもそれに追従します。

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## アクセシビリティ

- タブは、スクリーンリーダーにとって1つの要素で、ロールは`"tab"`、さらに選択状態を持ちます。ラベルは子要素のテキスト、または`accessibilityLabel`です。
- `Tabs`のロールは`"tablist"`です。スクリーンリーダーは、その中のタブを1つのまとまりとして読み上げますが、各タブは引き続きそれぞれ独立した要素です。
- `disabled`は、各プラットフォームの方法で読み上げられます(VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー)。
- macOS とウェブでは、リストはキーボードフォーカスの1つの停止位置となり、矢印キーでそのタブ間を移動します(後述)。
- インジケーターはスクリーンリーダーからは隠され、フォーカスも受けません。リストの要素はタブだけです。

ラベル、ロール、読み上げ全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="keyboard"></a>

## キーボード

Tab キーで押下を受け付けるビューに到達できる macOS とウェブでは、`Tabs`リストは
[WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)に従います。

| キー | 動作 |
|---|---|
| Tab、Shift+Tab | 選択中のタブ(どれも選択されていない間は、無効でない最初のタブ)でリストに入り、1回の操作でリストを抜けます。 |
| Right、Down | フォーカスを次のタブへ移動します。最後のタブからは最初のタブへ移動します。 |
| Left、Up | フォーカスを前のタブへ移動します。最初のタブからは最後のタブへ移動します。 |
| Home、End | フォーカスを最初または最後のタブへ移動します。 |
| Space、Return | フォーカス中のタブを押下します。 |

矢印キーは無効なタブをスキップし、移動先のタブは`onPress`を通知するため、アプリはフォーカスの移動に合わせてそのタブを選択します。つまり、セクションはフォーカスに追従します。リストのレイアウトはアプリ側のクラスで決まりますが、どのレイアウトでも、2組の矢印キーはどちらも移動します。右から左へのレイアウトでは行が右から始まるため、Left と Right の役割が入れ替わります。Left で次のタブへ、Right で前のタブへ移動します。Up、Down、Home、End は変わりません。`focus:`スタイルがフォーカスの位置を示します。`Tabs`の外にある`Tab`は、それ自体が独立した停止位置になります。

<a id="platform-notes"></a>

## プラットフォームに関する注記

- iOS、Android、Mac Catalyst: 押下は、ラベルを含むタブの上で終わるタップです。
- デスクトップ(macOS、Windows、Linux、GPUI)とウェブ: 押下はクリックです。macOS とウェブでは、Space と Return もキーボードフォーカスのあるタブを押下し、矢印キー、Home、End でフォーカスを移動します([キーボード](#keyboard))。
- どのプラットフォームでも、アプリがスタイルを指定したものが描画されます。タブ、選択中のタブのサーフェス、インジケーター、セクションのコンテンツです。インジケーターの移動は、どのプラットフォームでもネイティブのレイアウトアニメーションです。
