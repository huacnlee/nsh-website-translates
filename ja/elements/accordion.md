---
title: "Accordion"
description: "Accordion とその各パーツ: 見出しの下で展開・折りたたみができる、積み重ねられたセクションです。一度に1つだけ、または複数を開くことができ、アプリの値によって開閉が制御され、要求に応じてバネのような高さのアニメーションで表示され、見た目はすべてアプリ側で自由に決められます。"
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

アコーディオンは、見出しの下で展開・折りたたみができるセクションを積み重ねたものです。FAQ の質問、設定ページのグループ、チェックアウトの手順などに使います。5 つのパーツで構成され、それぞれが振る舞いの一部だけを担い、見た目には関与しません。

- `Accordion`（スタック）: アプリの `value`、つまり開いているアイテムの値を保持し、次の値を `onChange` で通知します。開けるアイテムは 1 つだけですが、`multiple` を使うと複数開けます。
- `AccordionItem`: 1 つのセクションで、`value` によって識別されます。アコーディオンの `value` に含まれている間は開いています。
- `AccordionHeader`: アイテムの見出しです。スクリーンリーダーが読み上げる `level` を持ちます。
- `AccordionTrigger`: 見出しの中のボタンで、アイテムを展開・折りたたみし、展開しているかどうかを伝えます。
- `AccordionPanel`: アイテムのコンテンツで、開いている間だけ表示されます。`reveal` を指定すると、高さがバネのように開閉します。

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

パーツは [`nsh/base`](../modules/nsh-base.md) から提供されます。これは Rust の `nsh-base` クレートです。値はアプリが持ちます。トリガーが押されると `onChange` で次の `value` が通知され、アコーディオンはアプリが返した値に対応するアイテムを開きます。各パーツは自分を囲むパーツを自動的に見つけるため、アプリは自由に配置できます。アイテム間の区切り線、見出し内のバッジ、タイトルの前のアイコンなどです。Rust では `accordion()`、`accordion_item()`、`accordion_header()`、`accordion_trigger()`、`accordion_panel()` でパーツを作成します。プロパティごとにセッターがあり、中に入れる要素には `.child(..)` を使います。

## Props

<a id="accordion-1"></a>

### Accordion

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | 開いているアイテムの `value`。これらはアプリが管理します。トリガーが押されると次の値が `onChange` で通知され、アコーディオンはアプリが返した値のアイテムを表示します。 |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 複数のアイテムを同時に開きます。1 つ開いても他は開いたままです。指定しない場合、アイテムを開くと、開いていたアイテムは閉じます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | すべてのアイテムを無効にします。どのトリガーも押せず、スクリーンリーダーは各アイテムが淡色表示であると伝えます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アイテム、およびアプリがその間に配置するもの（区切り線など）。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | スタックのレイアウトと外観。アイテムを囲むカードや、アイテム間の間隔など。 |

### AccordionItem

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 必須 | アコーディオンの `value` の中でアイテムを識別するもの。アプリ独自の ID を使い、言語によって変わるタイトルは使わないでください。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | トリガーが押されなくなり、スクリーンリーダーは淡色表示であると伝えます。開閉の状態は、アコーディオンの `value` に従います。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アイテムのヘッダーとパネル、およびアプリがその中に配置するもの。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | セクション自体。下の区切り線や、周囲のカードなど。 |

### AccordionHeader

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | ページ内の見出しの中でのこの見出しのレベル。スクリーンリーダー向けです（1 が最上位）。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アイテムのトリガー、およびヘッダーに含まれるその他のもの（バッジ、独自のアクションなど）。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | 見出しのレイアウト。 |

### AccordionTrigger

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | アイテムが開いている間のトリガーのスタイル。`aria-expanded:` クラスで指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | 子要素に読み上げに適したテキストがない場合に、スクリーンリーダーが読み上げる内容。 |
| `children` | `.child(..)` | `JSX.Element` | なし | タイトルとシェブロン。内側の `group-aria-expanded:` クラスは、トリガーの `class` に `group` を指定するとトリガーに追従します。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | トリガー自体。ユーザーが押す行です。 |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下中、ホバー中、フォーカス中、無効時のトリガーのスタイル。`<state>:` クラスで指定します。 |

### AccordionPanel

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | `Collapsible` と同様のリビールで開閉します。パネルはコンテンツをクリップし、高さがゼロからコンテンツ本来の高さまで、またその逆へと、臨界減衰のバネで変化します（約 265 ms、オーバーシュートなし）。後続のアイテムも一緒に動きます。視差効果を減らす設定では、即座に開閉します。 |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | アイテムが閉じている間も、コンテンツはツリーに残りますが、画面上、キーボードフォーカス、スクリーンリーダーからは見えません。動画は再生位置を保ち、Web ビューはページを保ちます。指定しない場合、パネルが閉じる際（リビールが閉じ終わった後）にコンテンツはツリーから外れ、再び開くと元の状態で戻ります。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがこのリージョンに付ける名前。通常は、ヘッダーが伝えるものと同じアイテムのタイトルです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | コンテンツ。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | リージョンのレイアウトと外観。`reveal` を指定すると、閉じたパネルも高さゼロでレイアウトに残るため、パディングやボーダーはコンテンツを包むビューに指定してください。 |

## Events

| イベント | Rust | 説明 |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | トリガーが押されました。タップ、クリック、キーボードフォーカス中の Space または Return、スクリーンリーダーによるアクティベーションが該当します。`value` は、そうなった場合の開いているアイテムの値です。開いているアイテムの値は取り除かれ、閉じているアイテムの値は末尾に追加されます。`multiple` がない場合は、開いていた値が置き換えられます。このイベントは何かが変わる前に実行されます。それを反映するには `value` を設定してください。 |

## Parts

| パーツ | 内側 | スタイル指定 | 状態 |
|---|---|---|---|
| スタック | | `Accordion` の `class`, `style` | |
| アイテム | スタック | `AccordionItem` の `class`, `style` | アプリの値 |
| 見出し | アイテム | `AccordionHeader` の `class`, `style` | |
| トリガー | 見出し | `AccordionTrigger` の `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:`（または `expandedStyle`, `disabledStyle` など） |
| タイトルとシェブロン | トリガー | それぞれ独自の要素 (`children`) | `group-aria-expanded:`, `group-disabled:`（トリガーの `class` に `group` を指定） |
| パネル | アイテム内、見出しの後 | `AccordionPanel` の `class`, `style` | |
| コンテンツ | パネル | 独自の要素 (`children`) | |

`reveal` がない場合、閉じたパネルはレイアウトから外れ、そのコンテンツはツリーから外れます。`reveal` を指定すると、この変化は `value` を変更したコミットでのレイアウトアニメーションになります（`LayoutAnimation.configureNext` と同様にネイティブで実行されるため、動いている間 JavaScript は実行されません）。開くパネルは高さゼロからコンテンツの高さまで広がり、閉じるパネルは元に縮みます。どちらも同じバネで動き、後続のアイテムも一緒に動きます。アプリ側のトランジションを組み合わせることもできます。たとえばシェブロンを回転させます (`transition-transform group-aria-expanded:rotate-180`)。

## Disabled

無効なアイテムのトリガーは押せず、スクリーンリーダーは淡色表示であると伝えます。トリガーの `disabled:` クラスと、その内側の `group-disabled:` もこれに追従します。アコーディオンの `disabled` を指定すると、すべてのアイテムが無効になります。無効なアイテムも、アプリの `value` が示すとおりに表示されます。アプリがそれを開くことは可能です。

## Accessibility

- スタックはグループ、各ヘッダーは `level` のレベルの見出し、各トリガーはその中のボタンとして扱われ、アイテムが展開されているかどうかを伝えます。スクリーンリーダーは見出しから見出しへ移動できます。
- 開いているパネルは `accessibilityLabel` によって名前が付けられたリージョンです。閉じているパネルは、保持されているコンテンツも含めてスクリーンリーダーから隠されます。
- 開いているアイテムの見た目はアプリが決めるものですが、色だけに頼らないようにしてください。例のように、シェブロンを回転させます。

ラベル、ロール、アナウンス全般については [Accessibility](../docs/accessibility.md) を参照してください。

## Keyboard

押下を受け付けるビューがキーボードフォーカスの停止位置になるプラットフォーム（macOS と Web）では、各トリガーがページの順序どおりにフォーカスの停止位置となり、Space と Return で押せます。無効なトリガーと、閉じたパネルのコンテンツはスキップされます。Tab を押すと、トリガーから、開いているパネル内のコントロールへ、さらに次のトリガーへと移動します。

## Platform notes

- すべてのプラットフォームで、開いているアイテムのパネルは見出しの下に表示され、閉じているパネルはレイアウトから外れます（`reveal` を指定した場合は高さゼロ）。
- `reveal` を指定すると、すべてのプラットフォームがそれぞれ独自のアニメーターでパネルの高さをバネのように動かします（iOS、Android、macOS、Windows、Linux、GPUI、Web）。システムが視差効果の低減を求めている間は、即座に開閉します。
- 各プラットフォームのスクリーンリーダーは、見出しを読み上げる際に見出しとそのレベルを読み上げ、その中のトリガーを展開状態付きのボタンとして読み上げます。iOS では VoiceOver がトリガー自体を読み上げます。
- iOS、Android、Mac Catalyst: トリガーの押下はタップです。デスクトップ（macOS、Windows、Linux、GPUI）と Web: クリックです。macOS と Web では、フォーカス中のトリガーで Space または Return も使えます。
