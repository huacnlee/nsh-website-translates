---
title: "Tailwind"
description: "TSX でネイティブに解決される Tailwind CSS クラスと、Rust における型付きの同等機能について説明します。class と classList、押下状態・ダークモード・ブレークポイントのバリアント、nsh.json のテーマ、ビルド時のクラスチェックを扱います。"
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

NSH のスタイルは Tailwind CSS 4 に従います。Rust では、Tailwind のユーティリティは同じ名前・同じ値を持つ型付きスタイルメソッドとして提供されます(`.p_4()` は `p-4`、`.rounded_2xl()` は `rounded-2xl`、`ZINC.shade(900)` は `zinc-900`)。TSX では、すべての要素が `class` でクラスをそのまま受け取り、Tailwind 4 のデフォルトテーマに対してネイティブに解決されます。以下の各例では、型付きメソッドを先に、クラスを後に示します。

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

型付きメソッドは、クラスがコンパイルされるのと同じスタイルルールに変換され、パースすべき文字列はありません。クラスの場合、CSS は生成されず、JavaScript では何も実行されません。文字列はコアに渡され、コアは異なるクラス文字列ごとに一度だけパースし(結果はキャッシュされます)、スタイルルールに変換して適用します。状態(押下、ダークモード、ウィンドウ幅)に依存するバリアントは、その状態が変化したときにコアが再適用します。押下状態とフォーカス状態はネイティブに追跡されるため、`active:` のフィードバック(Rust では `.active(..)`)はコードへの往復を必要としません。

クラスと [`style` prop](./styling.md) は同じネイティブスタイルを生成し、組み合わせて使用できます。このページでは、クラスとそれに対応する型付きメソッドに固有の内容を扱います。[Tailwind リファレンス](../modules/tailwind-reference.md)には、サポートされているすべてのユーティリティが載っています。

## class and classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** はクラスの文字列です。動的にもできます。クラスは実行時に解決されるため、``class={`h-6 rounded bg-${color()}-500`}`` のような指定も動作します。
- **`classList`** はクラスを条件に対応付けます。値が truthy の間、そのクラスが適用されます。適用は `class` の後に行われます。
- **Rust では**、クロージャまたはシグナルを渡されたメソッドがそれに追従します(`.bg(move || ..)`)。`.style_when(condition, |s| ..)` は条件が成り立つ間スタイルを適用し、`.when(condition, |v| ..)` は要素の生成時に一度だけ決定します。

競合の解決方法:

1. **後のクラスが優先されます。** 同じ文字列内では、前のクラスより後のクラスが勝ちます。`"p-2 p-4"` は `p-4` になります。`tailwind-merge` は不要です。コンポーネントは、呼び出し側から渡された `class` を末尾に追加できます。Rust でも後のメソッドが優先されます。
2. **バリアント付きクラスは、通常のクラスの後に適用されます。** Tailwind のバリアント順序(`hover:` は `active:` より前、`max-*:` は広いものから、ブレークポイントは昇順、`dark:` は最後)に従い、文字列内での位置は関係ありません。Tailwind と同様に、クラスの最上位のバリアントが先に判定され、次にその次の位のバリアントが判定され、バリアントが 1 つ多いクラスが後になります。`dark:hover:bg-a dark:bg-b` はダークモードでホバーされている間は `bg-a` になり、`max-md:p-2 max-lg:p-4` は `md` 未満では `p-2` になります。CSS と同様に、`odd:bg-a last:bg-b` は奇数番目の最後の行に `bg-a` を与えます。Tailwind が `odd` を `last` の後にソートするためです。
3. **`style` はクラスより優先されます。** スタイルキーは、その名前の CSS プロパティ(クラスが設定するもの)に対応するため、そのプロパティだけを置き換えます。`style={{ paddingLeft: 8 }}` は `pl-4` を置き換え、`pr-4` は維持します。
4. `!` はクラスを important にします。`!p-0`。

Rust コンポーネント(`nsh/base` のものと、アプリ自身のクレートのもの)も、TSX から `class` と `classList` を受け取れます。渡されたクラスはコンポーネント自身のスタイルの後にマージされ、同じ優先度では渡されたクラスが優先されます。

<a id="variants"></a>

## バリアント

| バリアント | 適用される条件 | Rust |
|---|---|---|
| `active:` | ビューが押されている | `.active(\|s\| ..)` |
| `hover:` | ポインターがビューの上にある(iPad と Mac のポインター) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | 入力欄がフォーカスを持っている | `.focus(\|s\| ..)` |
| `focus-within:` | ビューまたはその子孫がフォーカスを持っている(`Overlay` の内容は、それが置かれているビューの子孫です) | `.focus_within(..)` |
| `disabled:`, `enabled:` | 要素の `disabled` prop が true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | 要素が選択されている(`Button` の `selected`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | 要素がチェックされている(`accessibilityState.checked` は `true`、`"mixed"` はチェックされていない) | `.checked_style(..)` |
| `indeterminate:` | 要素が不確定状態である(`accessibilityState.checked` は `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | 要素が展開されている(`accessibilityState.expanded` は `true`)。`Popover` または `Menu` のトリガーで、そのポップアップが開いている間 | `.expanded_style(..)` |
| `aria-pressed:` | 要素がオン状態のトグルボタンである(`accessibilityState.pressed` は `true`、`"mixed"` は押されていない)。`active:`(進行中の押下)ではありません | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`、`checked`(`true`、`"mixed"` ではない)または `selected` が `true`。Tailwind の `aria-*` バリアントと同じ扱いで、疑似クラスの後に、名前順で適用されます | |
| `data-<name>:` | 要素が `data-*` 属性 `name` を持っている。Tailwind の真偽値 `data-*` バリアント(`&[data-range-start]`)と同じ扱いで、コンポーネントのパーツが状態以外に示すもの、たとえばカレンダーの範囲開始日(`data-range-start:`)に使います。`aria-*` バリアントの後に、名前順で適用されます | `Interactive::project_data(name, ..)` でコンポーネントのパーツに設定します |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | `group` クラスを持つ最も近い祖先がその状態である、またはその `data-*` 属性を持っている | 祖先側は `.group()`、内側は `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` |
| `group-active/name:` ... | 同じ内容で、`group/name` が付いた祖先が対象 | `.group_named("name")`、`.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | 兄弟要素の中での要素自身の位置。行の位置に応じてラベルの色を変えるには、行に `last:text-*` を指定します。ラベルはそれを継承します | 行のインデックスからの通常の Rust コード(`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | 入力欄のプレースホルダーをスタイル指定する(`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | 入力欄や選択可能なテキスト、およびその要素内にあるものの選択ハイライトの色を指定する(`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | システムの外観がダークである | `AdaptiveColor`、または `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | ウィンドウの幅が 640、768、1024、1280、1536 ポイント以上 | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | ウィンドウの幅がブレークポイント未満 | 同じ指定で、`<` を使用 |
| `min-[600px]:`, `max-[600px]:` | 任意のブレークポイント | 同じ |
| `portrait:`, `landscape:` | ウィンドウの向き | `window().width > window().height` |
| `ios:`, `android:`, `web:` | プラットフォーム | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | [レイアウト方向](./layout.md#right-to-left) | ビューの `.direction(LayoutDirection::..)` |
| `motion-safe:`, `motion-reduce:` | ユーザーの視差効果を減らす設定 | `reduce_motion()` |

バリアントは組み合わせられます。`dark:active:bg-zinc-700`、`md:landscape:flex-row`。Rust では、`.active(..)` スタイル内の `AdaptiveColor` は `dark:active:` になります。

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

任意の要素の `disabled`(Rust では `.disabled(..)`)は、`disabled:` クラス(`.disabled_style(..)`)を適用し、マウントされたものから押下ハンドラーを取り除くため、押下フィードバックも表示されません。

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

ブレークポイントはデバイスではなく、ウィンドウ(NSH が描画する面)と比較されます。iPad のスプリットビューやサイズ変更可能なウィンドウでは、`window()` と同様に、ウィンドウの幅に従います。

<a id="what-differs-from-tailwind-on-the-web"></a>

## Web 上の Tailwind との違い

- **単位はポイントです。** `p-4`(`.p_4()`)は 16 ポイントです(スペーシング 1 ステップ = 4pt、1rem = 16pt)。`px` の任意の値もポイントです。`p-[13px]`(`.p(px(13.0))`)は 13pt です。
- **`flex` は行方向です。** CSS と同じく、`class="flex"` は方向クラスで別の指定がない限り子要素を行に並べます(方向クラスは文字列内のどこにあっても有効です。`flex-col flex` は列方向です)。スタイルの `display: "flex"` と Rust の `.flex()` も同様に行方向で、display を設定しないビューは NSH のデフォルトである列方向のままです。`block` と `flow-root` はブロックレイアウトを使い、`inline` と `inline-block` も、ブラウザーが flex または grid の親の中でレイアウトするのと同様にブロックレイアウトを使います。Rust では、`.flex_row()` と `.flex_col()` が方向を設定します。
- **ビューに指定したテキストクラスは継承されます。** `text-*`、`font-*`、`leading-*`、`tracking-*` およびビューに指定したその他のテキストユーティリティ(Rust では `.text_color(..)`、`.font_weight(..)` など)は、CSS の継承と同様に、内側のテキスト要素と入力要素に引き継がれます。`<View class="text-white">` はラベルを白にします。
- **すべてのビューは独立したボックスです。** `overflow-x-hidden` と `overflow-y-hidden` は、`overflow-hidden` と同様に両方の軸でクリップします(スクロールは [scroll](../elements/scroll.md) 要素の役割です)。`invisible` はビューとその中のすべてを非表示にします。`mix-blend-*` はビューを背面に描画されているすべてのものとブレンドします。`block` のボックスは、自身のマージンと子要素のマージンを分離したままにします。`absolute` のビューは、CSS と同様に、最も近い位置指定された祖先の中に配置されます。`fixed` はビューをそのルートビューの中にレイアウトします(他の要素は `absolute` として配置されます)。
- **テキストは空白を保持します。** 文字列内のスペースと改行は書かれたとおりに描画され、`whitespace-*` が折り返しを設定します。JSX コンパイラーは、JSX と同様に、リテラルの JSX テキストの空白を畳み込みます。
- **トランジションはプロパティグループをアニメーションします。** `transition` は色、不透明度、シャドウ、変形をアニメーションし、`transition-all` はそれに加えて角の半径とボーダー幅もアニメーションします。フィルター、背景フィルター、グラデーション、レイアウトは新しい値に即座に切り替わります。
- **`focus-visible:` は `focus:` です。** 要素がフォーカスを持っている間は常に適用されます。
- **状態の背景はグラデーションの上に表示されます。** CSS ではグラデーションが `background-color` を覆うため、`bg-linear-*` の面に `active:bg-*` を指定しても表示されませんが、NSH では `active:`、`hover:`、`focus:`、`group-*:` による背景色は、その状態が続く間グラデーションを置き換えます(その状態が `active:from-*` のように独自のグラデーションを設定している場合を除く)。`activeStyle` やその他の状態スタイル、アニメーションする背景色も同様です。
- **テキストとタッチの設定はスタイルキーです。** `line-clamp-*` は `numberOfLines` を設定し、`text-ellipsis` と `text-clip` は `textOverflow` を、`truncate` は両方を、`select-*` は `userSelect` を、`pointer-events-*` は `pointerEvents` を設定します。そのため、状態バリアントで機能し、すべてのクラスと同様にインラインの `style` に負けます。`caret-*`、`placeholder:text-*`、`selection:bg-*` は、同じ方法で `caretColor`、`placeholderColor`、`selectionColor` スタイルを設定します。Rust ではこれらは `Styled` メソッドです(`.number_of_lines(..)`、`.truncate()`、`.text_overflow(..)`、`.select_text()`、`.pointer_events(..)` など)。`whitespace-nowrap` はクラスとしてテキストを 1 行に保ちます。`object-*` は画像と動画の `objectFit` と `objectPosition` スタイルを設定し、スタイルのキーは他のものと同様にこれらを置き換えます。
- **サポート範囲:** Tailwind 4 のユーティリティとバリアントのうち、ネイティブでの意味を持つもの。`peer-*` バリアント、疑似要素(`before:`、`after:`)、任意のプロパティ(`[mask-type:luminance]`)は未知のクラスとして報告され、NSH にネイティブでの意味がないユーティリティもすべて同様です。これにより、クラスがブラウザーでの意味と異なる意味になることはありません。レンダリングヒント(`antialiased`、`will-change-transform`、`appearance-none`、`box-border` など)は受け付けられますが、何も変更しません。

それ以外はすべて Tailwind 4 のドキュメントどおりに動作します。カラーパレット、不透明度修飾子(`bg-black/40`)、任意の値(`bg-[#34c759]`、`w-[72px]`、`grid-cols-[1fr_2fr]`。`p`、`px`、`py`、`pt`、`pr`、`pb`、`pl` および `m` ユーティリティでは環境変数 `pt-[env(safe-area-inset-top)]`、`pb-[calc(env(keyboard-inset-height)+49px)]` も使用可能。[Safe area](../elements/safe-area.md) と [Keyboard](../elements/keyboard.md) を参照)、分数(`w-1/2`、`translate-x-1/2`)、シャドウとリング、グラデーション(`bg-linear-to-r`、`bg-radial`、`bg-conic` と `from-` / `via-` / `to-`)、フィルター、`backdrop-blur-*`、`mix-blend-*`、変形、`transition-*` と `duration-*`、`animate-spin` / `ping` / `pulse` / `bounce`、グリッドがあり、それぞれに Rust の型付きメソッドが対応しています。[フィルターとブレンド](./styling.md#filters-and-blending)のプラットフォーム上の制限は、クラスにも適用されます。

<a id="theme"></a>

## テーマ

クラスは Tailwind 4 のデフォルトテーマに対して解決されます。テーマを拡張するには、`nsh.json` の `"tailwind"` に記述します。記述したエントリーはデフォルトに追加されます(同じ名前のデフォルトがある場合は置き換えられます)。

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

このテーマでは、`bg-brand-500`、`text-brand`(`DEFAULT` シェード)、`border-ink`、`rounded-card`、`font-display`、`tablet:flex-row` が有効なクラスになります。

| キー | 値 | 生成されるもの |
|---|---|---|
| `colors` | CSS の色、またはシェードのオブジェクト(名前のみの場合は `"DEFAULT"`) | `bg-*`、`text-*`、`border-*`、`from-*`、`ring-*` など |
| `spacing` | スペーシング 1 ステップあたりのポイント数(デフォルトは 4) | `p-*`、`m-*`、`gap-*`、`w-*` など |
| `rem` | 任意の値における `rem` あたりのポイント数(デフォルトは 16) | |
| `breakpoints` | ポイント | `name:` バリアント |
| `container` | ポイント | `max-w-*` サイズ |
| `fontSize` | ポイント、または行の高さをサイズの倍数とする `[size, lineHeight]` | `text-*` |
| `fontWeight` | 1~1000 | `font-*` |
| `fontFamily` | フォントファミリー名(システムファミリー、または[インポートしたフォント](./fonts.md)の名前) | `font-*` |
| `tracking` | em | `tracking-*` |
| `leading` | フォントサイズの倍数 | `leading-*` |
| `radius` | ポイント | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | CSS の `box-shadow` | `shadow-*`、`inset-shadow-*`、`drop-shadow-*` |
| `blur` | ポイント | `blur-*`、`backdrop-blur-*` |
| `perspective` | ポイント | `perspective-*` |
| `aspect` | 比率(`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

未知のキーや無効な値はビルドエラーになります(`nsh.json: tailwind: unknown theme key 'colours'`)。テーマはバンドルにコンパイルされ、最初のフレームの前に適用されます。

Tailwind テーマが形作るのはクラスです。型付きメソッドは Tailwind のデフォルトスケールを維持するため、Rust コンポーネントはどのアプリでも同じ見た目になります。アプリ固有の見た目は、そのテーマのデザイントークン(`nsh.json` の `"theme"`、[Rust](./rust.md#theme))から取得します。
<a id="theme-tokens"></a>

## テーマトークン

アプリのテーマ(`nsh.json` 内の `"theme"`)には、デザイントークンが保持されます。shadcn/ui のカラー(`background`、`foreground`、`primary`、`muted-foreground`、`border`、`ring`、`chart-1`、`sidebar`、...)、`radius`、フォントの `font-sans` と `font-mono`、そしてアプリが追加する任意のトークンです。クラスでは、Tailwind の名前として CSS の `@theme` の変数を指定し、Rust コンポーネントは `nsh_base` の `theme()` で読み取り、TSX は `nsh` の `token()` で読み取ります。そのため、TSX の画面と Rust コンポーネントは同じテーマに従います。

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

トークンの名前は、テーマファイルに書かれているとおり、CSS 変数名から `--` を除いたものです。たとえば `muted-foreground`、`radius`、`chart-1` です。Rust では、shadcn のトークンは `theme()` のメソッド(`primary()`、`muted_foreground()`、`radius()`、`font_mono()`)で、すべてのトークンは `theme().color("up")`、`theme().number("radius-card")`、`theme().font("font-display")` のいずれかです。

| 形式 | 受け取るもの | 例 |
|---|---|---|
| 任意のカラーユーティリティ内のカラー名 | テーマカラー(不透明度も指定可能) | `bg-primary`、`text-muted-foreground/70`、`bg-up/30`、`border-t-border`、`ring-ring`、`from-accent`、`placeholder:text-muted-foreground` |
| `(--name)`(Tailwind 4 の変数ショートハンド) | テーマカラーまたは数値 | `bg-(--primary)`、`rounded-(--radius)`、`p-(--gap-card)` |
| `(color:--name)`、`(length:--name)`、`(number:--name)`、`(family-name:--name)` | 同上。ユーティリティが複数の種類を受け取る場合に型を指定する | `text-(color:--up)`、`text-(length:--text-title)`、`font-(family-name:--font-mono)` |
| `font-sans`、`font-mono` | テーマのフォント(テーマで設定している場合) | `font-mono` |

- **独自のトークン。** CSS の `@theme` のすべての変数がそうであるように、テーマファイル内のすべての名前がトークンになります。`"up": "#16a34a"` からは `bg-up`、`text-up`、`bg-up/30` が作られ、`"radius-card": "14px"` からは `rounded-(--radius-card)` が、`"font-display": "Pacifico"` からは `font-(family-name:--font-display)` が作られます。長さの単位はポイントです。`(number:--name)` は数値をそのまま渡します。
- **フォント。** `font-sans` はアプリのフォントです。独自のフォントファミリーを指定していないすべてのテキストは、ページが Tailwind の `--font-sans` で描画されるのと同じように、このフォントで描画されます。`font-mono` は `font-mono` と `TextView` 内のコードに使われるフォントです。未設定の場合、どちらもシステムのフォントになります。
- **両方の外観。** トークンにはテーマのライトとダークの値があります。`bg-primary`、`theme().primary`、`token("primary")` は、`dark:` クラスなしで外観に応じて自動的に切り替わります。テーマが片方の外観でのみ設定しているカラーは、両方の外観で使われます。
- **Tailwind のカラーが優先されます。** `"tailwind"` の `colors` または Tailwind のパレットにある名前はそのカラーになります。したがって、Tailwind のテーマに `primary` というカラーがない場合に限り、`bg-primary` はテーマトークンになります。
- **テーマはアプリの実行中に変更できます。** ネイティブアプリに埋め込まれたアプリにそのアプリのテーマが渡されたとき、およびテーマが変更されるたびに、トークンを指定するクラス、`theme()` を読み取る Rust バインディング、`token()` を読み取る TSX コードが更新されます。クラスとバインディングはネイティブに更新されます。埋め込み元アプリのテーマにないトークンは、アプリ自身の `"theme"` の値(それもなければデフォルトテーマの値)を保持します。ブランドのみを追加するホストは、テーマのオーバーライドを渡します。これは、ブランドで変更されるトークンを同じファイル形式で記述したものです([iOS](./ios.md#theme-overrides)、[Android](./android.md#theme-overrides)、デスクトップでは `AppView::set_theme_overrides`)。
- **ほかのクラスと同様に検査されます。** デフォルトテーマにもアプリの `"theme"` にもないトークン名は、ビルド時に未知のクラスとして扱われます(`unknown class 'bg-chart-up'`)。埋め込み元アプリのみが提供するトークンを使うには、アプリの `"theme"` にもその値を指定してください。その値は、アプリが単独で実行されるときに表示されます。

トークンを指定するクラスは、ほかのクラスと同様にテーマごとに一度だけ解決されます。描画のコストはパレットカラーと同等です。

<a id="445-in-tsx"></a>

### TSX での `token()`

`nsh` の `token(name)` は、現在表示されている外観におけるトークンの値です。カラーは `#rrggbbaa`、長さはポイント数、フォントはファミリー名として返されます。リアクティブであるため、コンポーネント、メモ、エフェクト内でこれを読み取るコードは、テーマや外観が変わると再実行されます。キャンバスやチャートなど、クラスを指定できない場所に渡す値に適しています。

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

名前には型が付いています。NSH はアプリのトークンをテーマから `.nsh/types/nsh/tokens.d.ts` に書き込むため、テーマに `"up"` があれば `token("up")` は `string` になり、テーマにない名前は型エラーになります。

<a id="the-class-check"></a>

## クラスの検査

`nsh build`、`nsh dev`、`nsh run`、`nsh test` は、JSX 内の静的なクラス名(`class` 内の文字列リテラルと `classList` のキー)を、ランタイムが使うものと同じパーサーとテーマで検査し、存在しないクラスについて警告します。

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

警告によってビルドが失敗することはありません。実行時に組み立てられるクラス(``bg-${color()}-500``)は、ランタイムが初めてそれを見たときに検査され、未知のクラスごとに一度だけログに記録されます(`unknown classes: ...`)。型付きメソッドは Rust コンパイラが検査します。

<a id="classes-or-styles"></a>

## クラスとスタイルの使い分け

どちらもネイティブに解決され、コストはほぼ同じです。クラスは記述が短く、コードなしでバリアント(押下状態、ダークモード、ブレークポイント)を使えます。インラインスタイルは JavaScript で計算された値を受け取り、[ネイティブのアニメーション値](./animation.md)(`opacity: fade`、`translate: [x, 0]`)を受け付けます。ほとんどの TSX アプリでは、静的な見た目にはクラスを使い、計算される値やアニメーションする値には `style` を使います。Rust コンポーネントでは、どちらにも型付きメソッドを使い、アニメーション値は `.bind_opacity(..)`、`.bind_translate_x(..)` などのバインディングでバインドします。

<a id="related"></a>

## 関連項目

- [Styling](./styling.md): style prop、型付きメソッド、エフェクトのプラットフォーム上の制限。
- [Tailwind reference](../modules/tailwind-reference.md): すべてのユーティリティとバリアント。
- [Layout](./layout.md): フレックスボックスとグリッド。クラスとしても利用できます。
