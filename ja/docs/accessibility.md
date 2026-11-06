---
title: "アクセシビリティ"
description: "VoiceOver と TalkBack でアプリを利用できるようにする方法 - ラベル、ロール、状態、値、カスタムアクション、グループ化と非表示、アナウンスとフォーカス、文字サイズ、モーション低減。"
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# アクセシビリティ

NSH はネイティブビューで描画するため、プラットフォームの支援技術(iOS と Mac Catalyst の VoiceOver、Android の TalkBack、Switch Control、Voice Control など)は、アプリの実際のビュー階層を認識します。開発者が追加するのは、支援技術が推測できない情報、つまり要素が何であるか、何と書かれているか、どのような状態か、何ができるかという説明です。すべての要素が、以下のメソッド(Rust)とプロパティ(TSX)を受け付けます。

<a id="what-you-get-without-doing-anything"></a>

## 何もしなくても得られるもの

- **テキストは読み上げられます。** テキスト要素はアクセシビリティ要素であり、そのラベルはテキストの内容です。ラベルのないビューは、内部のテキストが読み上げられます。
- **押下可能なビューは要素になります。** 押下または長押しのハンドラ(`.on_press`、`onPress`)を持つビューは、デフォルトでアクセシビリティ要素になり、アクティベート(VoiceOver や TalkBack ではダブルタップ)すると押下されます。
- **入力欄はテキストフィールドになります。** プレースホルダー、値、キーボードも含まれます。
- **テキストはユーザーのサイズ設定に従います。** [テキストサイズ](#text-size)を参照してください。

<a id="labels-hints-and-roles"></a>

## ラベル、ヒント、ロール

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | 型 | 説明 |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | ビューは支援技術に対して 1 つの要素になり、子要素は個別には公開されません。 |
| `.label(..)` | `accessibilityLabel` | `string` | 内部のテキストの代わりに、スクリーンリーダーが読み上げる内容です。 |
| `.hint(..)` | `accessibilityHint` | `string` | 要素をアクティベートしたときの動作で、少し間を置いて読み上げられます。 |
| `.role(..)` | `role` | `AccessibilityRole` | 要素が何であるかを表します。 |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | 要素の状態(disabled、selected、checked、busy、expanded、pressed、current)です。`selected` は selected スタイルも適用し、`checked` は true のとき checked スタイルを、`"mixed"` のとき indeterminate スタイルを適用し、`pressed` は true のとき pressed スタイルを適用します。 |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | 見出しのレベル(1 が最上位)、ツリー項目の深さ(最上位が 1)です。 |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | レンジ要素またはテキスト要素の値です。 |
| | `accessibilityActions` | `{ name, label? }[]` | 支援技術に提供するアクションです。 |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | アクションが実行されました(Rust ではその名前)。 |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | ビューとそのサブツリーを支援技術から隠します。 |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | ビュー(およびそのサブツリー)を公開するかどうかです。 |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: ビューの変更を TalkBack にどのように通知するかです。 |
| `.test_id(..)` | `testID` | `string` | UI テスト用の識別子です(iOS では accessibility identifier、Android では resource id)。読み上げられません。 |

アイコンのみのコントロールには必ずラベルを付けてください。スクリーンリーダーはグリフや画像を読み上げられません。ラベルは短くし、ロールを含めないでください(「再生ボタン」ではなく「再生」)。ロールは別途読み上げられます。

<a id="roles"></a>

### ロール

ロール(`.role(AccessibilityRole::Header)`、`role="header"`)は、ユーザーにその要素がどのような種類で、どう操作するかを伝えます。Rust では `AccessibilityRole` のバリアント(`Button`、`Header`、`Switch` など)で指定します。TSX の値は `"none"`、`"button"`、`"link"`、`"search"`、`"image"`、`"imagebutton"`、`"keyboardkey"`、`"text"`、`"adjustable"`、`"header"`、`"summary"`、`"alert"`、`"checkbox"`、`"combobox"`、`"menu"`、`"menubar"`、`"menuitem"`、`"progressbar"`、`"radio"`、`"radiogroup"`、`"scrollbar"`、`"spinbutton"`、`"switch"`、`"tab"`、`"tablist"`、`"timer"`、`"toolbar"`、`"list"`、`"grid"`、`"table"`、`"rowgroup"`、`"row"`、`"columnheader"`、`"cell"`([`Table`](../elements/table.md)の各パーツのロール)、`"listbox"` と `"option"`(選択肢のリスト、たとえば [`Select`](../elements/select.md)のリストとその選択肢で、選ばれたものは `accessibilityState.selected` で示します)、`"group"`(まとまりのある関連要素)、`"region"`(アコーディオンのパネルのように、単独で到達できる価値のあるセクション)、`"navigation"`(ページネーションのように、アプリ内を移動するリンク)、`"tree"` と `"treeitem"`(展開・折りたたみする項目で、それぞれ `accessibilityLevel` に位置します)、`"menuitemcheckbox"` と `"menuitemradio"`(チェックされるメニュー項目で、単独のものと、グループ内の 1 つの選択肢としてのもの)です。

特によく使うロール:

- `"button"` はリンクではない押下可能な要素に、`"link"` はコンテンツへの移動に使います。
- `"header"` はセクションの見出しに使います。スクリーンリーダーのユーザーは見出し間を移動して画面を流し読みします。`accessibilityLevel` はプラットフォームが読み上げる場合にそのレベル(1 が最上位)を指定します。
- `"button"` と `accessibilityState.pressed` はトグルボタン、つまりオンまたはオフのまま保持されるもの(ツールバーの太字など)に使います。
- `"navigation"` はページ間を移動するリンクを囲み、表示中のページのリンクには `accessibilityState.current: "page"` を指定します。
- `"switch"`、`"checkbox"`、`"radio"` は `accessibilityState.checked` と組み合わせます。
- `"adjustable"` はスライダーとステッパーに使い、`accessibilityValue` と `increment` / `decrement` アクションを伴います
  ([`Slider`](../elements/slider.md)の各サムが 1 つに該当します)。
- `"spinbutton"` はユーザーがステップ操作もできる数値を保持するフィールドに使い、同じ値とアクションを伴います
  ([`NumberInput`](../elements/number-input.md)のフィールド)。
- `"image"` は意味のある画像にラベル付きで使います。装飾的な画像は代わりに非表示にしてください。

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### 状態と値

アプリ内のオン/オフのコントロールには、`nsh/base` の [`Switch`](../elements/switch.md)を使ってください。ロールと状態は自動で設定されます。以下の例は、ビューにロールと状態を設定すると何が起こるかを示しています。

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

状態は Rust では `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }`、TSX では `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` です。`pressed` はボタンをトグルボタン(ARIA の `aria-pressed`)にします。`current` は集合内の現在の項目(ARIA の `aria-current`)、たとえばページネーションのページやウィザードのステップを示します。`disabled` は、ビューを無効にする(`.disabled(..)`、`disabled`)ことでも暗黙的に設定されます。`accessibilityValue` を `min`、`max`、`now` とともに使うとパーセンテージとして読み上げられ、`text` と使うと指定どおりに読み上げられます(「10 件中 3 件」「中」など)。

<a id="actions"></a>

## アクション

押下可能なビューは、すでにアクティベートに対応しています。それ以外のビューでは、`accessibilityActions` でアクションを宣言し、`onAccessibilityAction` で処理します。Rust のコンポーネントは、実行されたアクションの名前を `.on_accessibility_action(|name: &str| ..)` で受け取ります。

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

一部のアクション名は標準で、各プラットフォーム固有のジェスチャーに対応します。

| 名前 | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | ダブルタップ | ダブルタップ(クリック) |
| `increment`、`decrement` | 上 / 下にスワイプし、その後 VoiceOver が新しい値を読み上げる | 前方 / 後方にスクロール |
| `longpress` | | ダブルタップして長押し |
| `expand`、`collapse` | | 展開 / 折りたたみ |
| `magicTap` | 2 本指でダブルタップ | |
| `escape` | 2 本指で Z 字にスクラブ | |

`increment` または `decrement` を持つ要素は、ロールにかかわらず調整可能になります。たとえばチャートは `"image"` ロールのまま、VoiceOver のスワイプや TalkBack のスクロールで各データポイントを順に移動でき、各ステップの後に `accessibilityValue` が読み上げられます。

それ以外の名前はカスタムアクションになり、VoiceOver のアクションローターや TalkBack のアクションメニューに、その `label`(なければ名前)で一覧表示されます。カスタムアクションは、スワイプ削除などのジェスチャーをアクセシブルにした形です。

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## グループ化と非表示

ビューをアクセシブルにする(`.accessible(true)`、`accessible`)と、そのビューは 1 つの要素になります。タイトル、サブタイトル、価格を持つカードは、ユーザーが 3 つのテキストをスワイプで順に移動する代わりに、まとめて読み上げられます。

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

何も付け加えないもの、たとえば装飾的な画像、区切り線、同じ内容を示すテキストの横にあるアイコンは非表示にしてください。

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden`(iOS での名前)と `importantForAccessibility="no-hide-descendants"`(Android での名前)は、どちらも両方のプラットフォームでサブツリーを非表示にします。両方を設定しても問題ありません。

<a id="the-screen-reader-and-the-users-settings"></a>

## スクリーンリーダーとユーザー設定

Rust では、プレリュードがユーザーの設定を報告し、スクリーンリーダーと連携します。`screen_reader()` と `reduce_motion()` はリアクティブで、`announce_for_accessibility(message)` はスクリーンリーダーにメッセージを読み上げさせ、要素の `element_ref()` は `set_accessibility_focus()` でスクリーンリーダーのフォーカスをその要素に移動します。TSX では、`nsh` のアクセシビリティ API がユーザーの設定を報告し、スクリーンリーダーに話しかけることができます。

| メンバー | 説明 |
|---|---|
| `screenReaderEnabled()` | VoiceOver または TalkBack が動作しているかどうか(リアクティブ)。 |
| `reduceMotion()` | ユーザーがモーションの軽減を求めているかどうか(リアクティブ)。 |
| `announce(message)` | スクリーンリーダーが `message` を読み上げます。 |
| `setAccessibilityFocus(ref)` | スクリーンリーダーのフォーカスをビューに移動します。 |

これらの設定はアクセサーです。バインディングやエフェクト内で読み取ると、ユーザーが設定を変更したときに、それを読み取っているものが更新されます。クリーンアップは不要です。

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

ユーザーが見逃してしまう変更は通知してください。たとえば、バックグラウンド保存の完了、フォーカスから離れた場所に現れたエラー、タイマーの終了などです。Android では、ビューに `android={{ accessibilityLiveRegion: "polite" }}` を指定すると、TalkBack がそのビューの変更を自動的に通知します。

<a id="text-size"></a>

## テキストサイズ

テキストと入力欄は、オフにしない限り、システムのテキストサイズ(iOS では Dynamic Type、Android ではフォントサイズ)に従います(`.allow_font_scaling(false)`、`allowFontScaling={false}`)。オフにするのではなく、サイズ変更を前提に設計してください。

- テキストを折り返せるようにします。テキストを含むビューには固定の高さを避けてください。
- 非常に大きな見出しは、スケーリングを無効にするのではなく、`.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` で上限を設けます。
- テキストが大きいときはレイアウトを切り替えます。`font_scale()`(Rust)または `nsh` の `fontScale()`(TSX)を読み取ります(たとえば、1.3 を超えたらラベルと値を縦に積みます)。

[デバイスと環境](./device-and-environment.md#text-size)を参照してください。

<a id="reduced-motion"></a>

## モーションの軽減

`reduce_motion()`(Rust)と `reduceMotion()`(TSX)は、ユーザーが iOS の「視差効果を減らす」または Android のアニメーション削除の設定をオンにしている場合に `true` になります。アニメーションは記述したとおりに実行されるため、この値、または Tailwind の `motion-reduce:` と `motion-safe:` バリアントを使って、大きな動きをフェードや即時の変化に置き換えてください。

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## タッチターゲット

押下可能な要素は、少なくとも 44 × 44 ポイントにしてください。コントロールを小さく見せる必要がある場合は、サイズを変えるのではなく、ヒットスロップ(`.hit_slop(..)`、`hitSlop`)でタッチ領域を拡張してください。[タッチとジェスチャー](./touch-and-gestures.md#hit-areas-hitslop)を参照してください。

<a id="checking-your-app"></a>

## アプリの確認

- VoiceOver(iOS の設定、アクセシビリティ、または設定済みの場合はサイドボタンのトリプルクリック)または TalkBack をオンにし、画面を見ずにアプリを使ってみてください。すべてのコントロールが、それが何であり何をするのかを伝えるはずです。
- iOS シミュレーターでは、Xcode の Accessibility Inspector で各要素のラベル、トレイト、値を確認できます。
- 最大のテキストサイズとダークモードを試してください。
- テスト ID(`.test_id(..)`、`testID`)は、ラベルの言語に依存しない、UI テスト用の安定した識別子になります。

<a id="related"></a>

## 関連項目

- [`nsh` のアクセシビリティ API](../modules/nsh.md#accessibility): リファレンス。
- [`View`](../elements/view.md): すべてのアクセシビリティプロパティ。
- [アニメーション](./animation.md#reduced-motion)と[デバイスと環境](./device-and-environment.md)。
