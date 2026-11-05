---
title: "Collapsible"
description: "Collapsible コンポーネント: コンテンツが展開および折りたたみされる領域です。アプリが開いている間は子要素の後に表示され、要求に応じてバネのように高さが変化して現れます。トリガーと外観はすべてアプリ側で定義します。"
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

Collapsible は、コンテンツが展開・折りたたみされる領域です。要約の下に表示される詳細、「もっと見る」、詳細設定のセクションなどに使います。子要素は常に描画し、`open` の間はその後ろに `content` を描画します。`open` と、それを切り替えるトリガー(子要素の 1 つ)はアプリが持ち、見た目もアプリ側で決めます。`Collapsible` 自体には、トリガー、シェブロン、ラベルはありません。`reveal` を指定すると、コンテンツはモーション付きで開閉します。領域の高さが 0 からコンテンツ本来の高さまでスプリングで変化し、元に戻り、Collapsible の後ろにある要素もそれに合わせて動きます。

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。値はアプリが持ちます。トリガーが `open` を切り替え、Collapsible はアプリから渡された値を表示します。Rust では、`collapsible()` が各 prop に対応するセッター(`.open(..)`、`.reveal(..)`、`.content(..)`)、領域用の型付きスタイルメソッド、常に表示する要素用の `.child(..)` を備えたものを生成します。

## Props

| Prop | Rust | 型 | 既定値 | 説明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | 展開状態です。`content` が子要素の後ろでツリーに含まれます。値はアプリが持ちます。 |
| `reveal` | `.reveal(..)` | `boolean` | `false` | リビール(reveal)で開閉します。コンテンツは、はみ出しをクリップする領域に置かれ、その高さは `open` がオンになると 0 からコンテンツ本来の高さまで、オフになると元に戻る方向にスプリングで変化します。減衰は臨界減衰です(約 265 ms、オーバーシュートなし)。Collapsible の後ろにある要素も一緒に動き、コンテンツは領域が閉じきるまでツリーに残ります。モーション低減が有効な場合は、即座に開閉します。この領域は閉じている間もレイアウトに含まれ、高さは 0 です。そのため、Collapsible に指定した `gap` は、その前にも入ります。 |
| `content` | `.content(..)` | `JSX.Element` | なし | 展開される内容です。一度作成された後は折りたたみ中も保持されるため、内部の状態(入力中のテキスト、スクロール位置、スイッチなど)は次に開くときまで維持されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 常に表示される内容です。要約や、`open` を切り替えるトリガーなどです。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 子要素とコンテンツを囲む領域です(`gap-2` でそれらの間隔を設定します)。 |

## Events

Collapsible 自体は何もイベントを通知しません。トリガーはアプリ側のものであり、そのプレス(`role="button"` を持つ `View` の `onPress`)が、アプリが `open` を切り替える場所になります。

## Parts

| パーツ | 内側 | スタイルの指定方法 |
|---|---|---|
| 領域 | | `class`、`style` |
| 子要素 | 領域内の先頭 | それぞれの要素自身 |
| リビールの領域 | 領域内の子要素の後ろ(`reveal` 指定時) | なし。コンテンツをクリップし、その高さを取ります |
| コンテンツ | 領域内の子要素の後ろ(`reveal` 指定時はリビールの領域内)、`open` の間 | それぞれの要素自身(`content`) |

`reveal` がない場合、コンテンツは即座に現れたり消えたりし、各プラットフォームはコンテンツの出現時と消滅時に領域のレイアウトをやり直します。`reveal` を指定すると、この変化は `open` を変更するコミットのレイアウトアニメーションになります(`LayoutAnimation.configureNext` として、ネイティブで実行されるため、動いている間 JavaScript は実行されません)。リビールの領域は 0 からコンテンツの高さまで伸び、元に戻ります。同じ変更で動く他のものすべてのフレーム、たとえば Collapsible の後ろにあるビューも、一緒に動きます。アプリ側のトランジションも連動します。トリガーのシェブロンが回転し(`transition-transform`)、コンテンツは独自のクラスでフェードインさせることもできます。

## Accessibility

- 領域自体は、スクリーンリーダーにとって独立した要素ではありません。子要素とコンテンツは、そのまま読み上げられます。
- トリガーは、領域が展開されているかどうかを伝えます。`accessibilityState={{ expanded: open }}` とボタンのロール(`View` では `role="button"`)を指定すると、スクリーンリーダーがそのラベルとともに「展開済み」または「折りたたみ済み」と読み上げます。
- macOS と Web では、トリガーがプレスを受け付ける場合、キーボードフォーカスの停止位置になります。Tab で到達でき、Space と Return で領域を切り替えられます。

ラベル、ロール、読み上げ全般については、[Accessibility](../docs/accessibility.md) を参照してください。

## Platform notes

- どのプラットフォームでも、`open` の間はコンテンツを子要素の後ろに表示し、それ以外のときはレイアウトから外します。
- `reveal` を指定すると、どのプラットフォーム(iOS、Android、macOS、Windows、Linux、GPUI、Web)でも、それぞれ独自のアニメーターで領域の高さをスプリング駆動します。システムがモーション低減を求めている間は、即座に開閉します。
- iOS、Android、Mac Catalyst: トリガーのプレスはタップです。デスクトップ(macOS、Windows、Linux、GPUI)と Web: クリックです。macOS と Web では、フォーカスされたトリガー上の Space または Return も同様に働きます。
