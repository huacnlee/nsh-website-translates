---
title: "Checkbox"
description: "Checkbox コンポーネント: チェック済み、未チェック、または不確定の状態を持つコントロールです。プレス操作、キーボードによるアクティベーション、無効状態、およびスクリーンリーダー向けのロールと値を管理し、アプリ側でスタイルやマークを設定できるインジケーターを備えています。"
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

Checkbox は、オプション、リストの項目、またはそのすべてを選択します。チェックあり、チェックなし、または不確定(どちらでもない状態:一部だけが選択されているときの「すべて選択」)のいずれかです。動作として、押下、キーボードによる操作、無効状態、そして画面読み上げ向けの checkbox ロールとその値を担います。見た目はアプリ側が決めます。`Checkbox` 自体にはボックス、マーク、色、サイズ、ラベルがありません。インジケーター(ボックス)とその内側にあるアプリのマーク、続いて子要素(ラベル)で構成され、アプリは各パートを、checkbox に追従する `checked:`、`indeterminate:`、`disabled:` クラスでスタイル指定します。

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します。値はアプリが保持します。押下すると `onChange` で次の値が通知され、checkbox はアプリが渡し返す `checked` と `indeterminate` を表示します。Rust では、`checkbox()` が各 prop 用のセッター(`.checked(..)`、`.indicator_style(..)`)、各イベント用のリスナー(`.on_change(..)`)、checkbox 自体用の型付きスタイルメソッド、そしてラベル用の `.child(..)` を備えたものを生成します。インジケーターのスタイルには、checkbox に追従する状態メソッド(`.checked(..)`、`.indeterminate(..)`、`.disabled_style(..)`)を使用します。

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | チェックされているかどうか。押下すると `onChange` で次の値が通知されます。checkbox はアプリが渡し返した値を表示します。 |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | チェックありでもチェックなしでもない状態です。この状態の間は `checked` より優先されます。画面読み上げでは「混在」と読み上げられ、押下するとチェックありが要求されます。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 押下も押下フィードバックも行いません。`disabled:` スタイルが checkbox とそのインジケーターに適用され、画面読み上げでは無効(dimmed)と読み上げられます。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | チェックありかつ無効でないときの checkbox のスタイルで、`checked:` クラスとして指定します。 |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | 不確定かつ無効でないときの checkbox のスタイルで、`indeterminate:` クラスとして指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | 画面読み上げが読み上げる内容です。子要素に内容を表すテキストがない場合に、checkbox が何を選択するのかを示します。 |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | より具体的な役割がある場合に、画面読み上げに対して何であるかを示します(チェック付きメニュー項目:`"menuitem"`)。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | インジケーター。値を表示するボックスです。 |
| `indicator` | `.indicator(..)` | `JSX.Element` | なし | インジケーターの内容。マーク(チェック、ダッシュ)で、アプリが値に応じて表示します。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | なし | 境界の外側どこまで押下を有効とみなすか(ポイント単位)。すべての辺に共通の数値を 1 つ指定するか、辺ごとに指定します。ビューの `hitSlop` と同じです。 |
| `children` | `.child(..)` | `JSX.Element` | なし | インジケーターの後ろに置く内容。ラベルで、画面読み上げが読み上げます。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | checkbox 自体。インジケーターとラベルを囲む行です。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下中、ホバー中、フォーカス中、無効のときの checkbox のスタイルで、`<state>:` クラスとして指定します。 |

## Events

| Event | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | checkbox が押されました。タップ、クリック、キーボードフォーカス中の Space または Return、あるいは画面読み上げによる操作が該当します。checkbox が要求する値を `checked` として通知します。チェックなしおよび不確定からは `true`、チェックありからは `false` です。 |

無効な checkbox は何も通知しません。

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| checkbox | | `class`、`style` | `checked:`、`indeterminate:`、`disabled:`、`active:`、`hover:`、`focus:`(または `checkedStyle`、`indeterminateStyle`、`disabledStyle` など) |
| インジケーター | checkbox の先頭 | `indicatorClass`、`indicatorStyle` | `checked:`、`indeterminate:`、`disabled:` は checkbox に追従します |
| マーク | インジケーター | 独自の要素(`indicator`) | `group-checked:`、`group-indeterminate:`、および `indicatorClass` に `group` を指定したその他の `group-*:` バリアント |
| ラベル | checkbox 内のインジケーターの後ろ | 独自の要素(`children`) | checkbox の `class` に `group` を指定した `group-*:` バリアント |

マークはアプリのコンテンツであるため、アプリが決めたものが表示されます。たとえば、アプリが保持する値に応じて、チェックありのときはチェック、不確定のときはダッシュを選んで表示します。あるいは両方のマークを置き、`group-checked:` / `group-indeterminate:` クラスで表示するものを切り替えることもできます。

## Indeterminate

「すべて選択」の checkbox は、一部の項目が選択されている間は不確定になります。押下するとチェックありが要求され、アプリはすべての項目を選択します。

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

## Disabled

無効な checkbox は押下を受け付けず、画面読み上げでは無効(dimmed)と読み上げられます。`disabled:` クラスとインジケーターの同クラスが、`checked:` や `indeterminate:` のクラスより優先して適用されます。

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

## A small target with hitSlop

行の選択ボックスのように、隣にラベルがない checkbox は、指より小さくなることがあります。`hitSlop` を使うと、レイアウトや見た目を変えずに、checkbox の近くで行われた押下を有効にできます。各辺の外側に向けてポイント単位で指定し、すべての辺に共通の数値を 1 つ、または辺ごとの指定(`{ top: 8, bottom: 8 }`)を渡せます。これは [ビューの `hitSlop`](./index.md#presses-and-feedback) と同じ形式です。

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

## Accessibility

- checkbox は画面読み上げにとって 1 つの要素であり、ロールは `"checkbox"`(または `role`)、値はチェックあり、チェックなし、または不確定の間は「混在」です。インジケーターとマークはその一部です。ラベルは子要素のテキストです。子要素にテキストがない場合は `accessibilityLabel` を指定してください。
- `disabled` は、各プラットフォームの方式で読み上げられます(VoiceOver、TalkBack、UI Automation、ブラウザーのアクセシビリティツリー)。
- macOS と Web では、checkbox はキーボードフォーカスの停止位置になります。Tab で移動でき、Space と Return で切り替えられ、`focus:` スタイルでフォーカスの位置が示されます。

ラベル、ロール、読み上げ全般については [Accessibility](../docs/accessibility.md) を参照してください。

## Platform notes

- iOS、Android、Mac Catalyst:押下は checkbox 上(ラベルを含む)で終わるタップです。
- デスクトップ(macOS、Windows、Linux、GPUI)と Web:押下はクリックです。macOS と Web では、キーボードフォーカスのある checkbox を Space と Return でも切り替えられます。
- すべてのプラットフォームで、アプリがスタイル指定したものが描画されます。インジケーター、マーク、およびそれらのトランジションが対象です。
