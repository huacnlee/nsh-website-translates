---
title: "要素"
description: "すべての NSH アプリを構成するプリミティブと基本コンポーネント(Rust と TSX)、およびそれらすべてに共通するプロパティ、イベント、ref メソッドについて説明します。"
order: 1
source_hash: 84e4cb96ec250ab2
---

# 要素

Native Shell は、すべての画面を少数の要素から構築します。`View`、`Text`、`Image` などのプリミティブと、`Button`、`Dialog`、`NavStack` などのベースコンポーネントです。各プリミティブはネイティブビューです（iOS と Mac Catalyst では UIView のサブクラス、Android では `View`、デスクトップでは AppKit、GTK、Win32 のビュー）。ビューの作成とレイアウトは NSH ランタイムが行います。アプリが表示するものはすべてこれらで構成されます。アプリのボタン、カード、行、画面はアプリ自身のコンポーネントであり、これらの要素で描画され、アプリがスタイルを定めるため、見た目は完全にアプリ独自のものになります。

このページのすべての例は Rust と TSX の両方で示されます。タブを選ぶと、ページ内のすべての例が切り替わります。

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

Rust では、プリミティブは `nsh_core::prelude` の関数（`view()`、`text(..)`、`image(..)`）であり、ベースコンポーネントは `nsh_base` クレートから提供されます。スタイルは型付きメソッド（`.flex_1()`、`.gap_3()`、`.px(px(20.0))`、`.bg(..)`）で指定し、状態スタイルはクロージャ（`.active(|s| s.opacity(0.6))`）を取ります。リスナーはそのイベントを受け取るクロージャ（`.on_press(move || ..)`、`.on_change(move |text: &str| ..)`）で、`.child(..)` で子要素を追加します。UI の断片は `impl IntoElement` を返す通常の関数で、一度だけ実行されます。クロージャ内（`text(move || ..)`、`.bg(move || ..)`）で読み取られたシグナルは、バインドされた対象を更新します。[Building with Rust](../docs/rust.md) を参照してください。

TSX では、すべてのタグは PascalCase で、スコープ内のバインディングの名前になります。プリミティブは `nsh` から、ベースコンポーネントは `nsh/base` から提供されます。インポートが不要なグローバルは `<If>` と `<Each>` だけです。`<view>` のような小文字のタグはビルドエラーになります。TypeScript が名前ごとに 1 つのグローバル型に照らして検査することになり、`List` や `Each` のようなジェネリックコンポーネントはアイテムの型を推論できないためです。コンパイラはインポートを通じて要素を認識し、ネイティブビューをその場で生成するため、インポートに実行時のコストはかかりません。[JSX and components](../docs/jsx-and-components.md) を参照してください。

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## プリミティブ

TSX では `nsh` から、Rust では `nsh_core::prelude` からインポートします。

| 要素 | Rust | ネイティブビュー (iOS / Android) | ページ |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup。`selectable` を指定すると、内部のテキストがまとめて選択される | [View](./view.md)、[Text selection](./text-selection.md) |
| `<Text>` | `text(content)` | CoreText view / StaticLayout view | [Text](./text.md) |
| `<Image>` | `image(src)` | 画像レイヤーを持つビュー / イメージビュー | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | セルをリサイクルする UIScrollView / ScrollView | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | 2D 描画を再生するビュー | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | WGSL プログラムが子要素の下に GPU でボックスを描画するビュー | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`、`web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / TextureView 上の MediaPlayer | [Video](./video.md) |
| `<Overlay>` | `overlay()` | ウィンドウ（またはそれが含まれるダイアログ）の最前面に、アンカーを基準に配置されるビュー | [Overlay](./overlay.md) |
| `<If>`、`<Each>` | `when(..)`、`each(..)`、`dynamic(..)` | 制御フロー。選択された要素を表示する | [Control flow](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | iOS でキーボードの上に表示されるバー | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

パディングとマージンは、CSS の `env()` によってシステム UI を避けます。`env(safe-area-inset-top)` とその他の辺（[Safe area](./safe-area.md)）、および `env(keyboard-inset-height)`（[Keyboard](./keyboard.md)）が使えます。

<a id="base"></a>

## ベース

TSX では `nsh/base` から、Rust では `nsh_base` クレートからインポートします。これらは動作、状態、フォーカス、アクセシビリティを担い、見た目はアプリから与えられます。

| コンポーネント | Rust | 役割 | ページ |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | システムのアラートとアクションシート | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` とその部品 | `nsh_base::accordion()`、`accordion_item()`、... | 見出しの下で展開・折りたたみができる積み重ねられたセクション。一度に 1 つまたは複数を開ける | [Accordion](./accordion.md) |
| `<Avatar>`、`<AvatarGroup>` | `nsh_base::avatar()`、`avatar_group()` | 人物の画像、または読み込み中や失敗時のフォールバックと、先頭の数件を表示する Avatar の列 | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | 状態とロールを持つ押下可能なコントロール | [Button](./button.md) |
| `<Carousel>` とその部品 | `nsh_base::carousel()`、`carousel_content()`、... | 一度に 1 か所ずつ表示され、ネイティブにスワイプできるスライド。前へ / 次へ、ページネーション、キー操作、シームレスなループを備える | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | チェック済み、未チェック、不確定の状態とインジケーターを持つコントロール | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | 内容が展開・折りたたまれる領域 | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | コマンドパレット。ネイティブに絞り込まれるコマンド上の検索フィールド、仮想化されたリスト、Cmd+K パレットのキー操作を備える | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | 任意の数の行と列を持つテーブル。選択、並べ替えができ、列のサイズ変更と移動が可能 | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | 子要素を他のすべての上に表示する | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | 2 つのテキスト間、またはパッチの変更点を、分割表示または統合表示で示す | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | ユーザーが配置を変えられる、分割、タブグループ、端のドックからなるワークスペース | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | シンタックスハイライト、複数キャレット、折りたたみ、検索を備えたコードエディター | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | ポインターが乗っている間、トリガーが指す対象をプレビューする | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | ネイティブのテキスト入力（UITextField または UITextView / EditText） | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | ページ、サイト、アプリのルートを開く押下ターゲット | [Link](./link.md) |
| `<Menu>`、`<ContextMenu>`、`<MenuItem>`、`<MenuSeparator>`、`<Submenu>` | `nsh_base::menu()`、... | メニュー。デスクトップではカスケード式のサブメニューを持つポップアップ、スマートフォンではシート | [Menu](./menu.md) |
| `<NavStack>`、`<NavPage>` | `nsh_base::nav_stack()`、`nsh_base::nav_page()` | ネイティブのナビゲーション。プラットフォームのヘッダーと戻るジェスチャーを備えたページのスタック | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | フィールドに入力するか、ボタンやキーで増減させる数値 | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | 固定桁数のワンタイムコード。入力、貼り付け、自動入力でセルに入る | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | セットのページ。前へ、現在のページ前後のページ、省略記号、次へ | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | アイテムを含むアイテム。展開・折りたたみができ、1 つが選択される。仮想化されており、キーボードフォーカスの停止位置は 1 つ | [Tree](./tree.md) |
| `<Plot>`、`<Line>`、`<Area>`、`<Bar>`、`<Grid>`、`<Pie>`、`<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | アプリの行からネイティブに描画される、チャートのフレームとマーク | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | トリガーに固定され、他のすべての上に表示されるコンテンツ | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | プログレスバー。タスクの進捗、または処理中であることを示す | [Progress](./progress.md) |
| `<Radio>`、`<RadioGroup>` | `nsh_base::radio()`、`radio_group()` | ユーザーが 1 つを選ぶセットの選択肢 1 つと、そのセット | [Radio](./radio.md) |
| `<ResizablePanelGroup>`、`<ResizablePanel>` | `nsh_base::h_resizable()`、`resizable_panel()` | 横または縦に並べられ、ハンドルでサイズを変更できるパネル | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | スクロールビューまたはリスト用の、アプリ独自の見た目のスクロールバー | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | アイテムのリストから 1 つの値を選ぶ。キーボード、検索、セクションに対応 | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | 背景の上に、画面の端に表示されるパネル | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | トラック上で選ぶ 1 つの値、または 2 つの値による範囲 | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | トラックとつまみを持つオン / オフのコントロール | [Switch](./switch.md) |
| `<Table>` とその部品 | `nsh_base::table()`、`table_row()`、... | テーブルのロールを持つ、アプリ独自の行とセルのテーブル | [Table](./table.md) |
| `<Tab>`、`<Tabs>` | `nsh_base::tab()`、`tabs()` | タブリストの 1 つのタブと、そのリスト | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Markdown または HTML ドキュメントを、テキストとビューで表示する | [TextView](./text-view.md) |
| `<Toast>`、`<ToastStack>` | `nsh_base::toast()`、`toast_stack()` | トーストのセマンティックなルートと、端からレイヤーとして配置されるトースト | [Toast](./toast.md) |
| `<Toggle>`、`<ToggleGroup>` | `nsh_base::toggle()`、`toggle_group()` | オンまたはオフのボタンと、それらのツールバー | [Toggle](./toggle.md) |
| `<Toolbar>`、`<ToolbarGroup>`、`<ToolbarSeparator>` | `nsh_base::toolbar()`、`toolbar_group()`、`toolbar_separator()` | ボタン、トグル、リンクのバー。キーボードフォーカスの停止位置は 1 つ | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | ホバー時または指を置いている間に、トリガーの隣に表示されるヒント | [Tooltip](./tooltip.md) |

> [!NOTE]
> 文字列は `Text` の内側でのみ描画されます。`View` の子としての文字列はネイティブビューを作成せず、レイアウトにも参加しません。

<a id="common-props"></a>

## 共通プロパティ

すべてのプリミティブは、以下のプロパティを受け付けます（TSX では `CommonProps` 型、Rust では `Styled`、`Interactive`、`Accessible` トレイト）。各要素のページには、その要素固有のプロパティのみを記載しています。Rust の列にはビルダーメソッドを示しています。

<a id="styling"></a>

### スタイリング

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `style` | 型付き `Styled` メソッド、`.inline_style(style)` | `StyleProp<ViewStyle>`（`<Text>` と `<Input>` では `TextStyle`、`<Image>` では `ImageStyle`） | インラインスタイル、または左から右へマージされるスタイルの配列（falsy な要素は無視される。配列はネストでき、そのため `style={[base, props.style]}` はそれ自体が配列である `props.style` を受け取れる）。`class` より優先される。[style reference](../modules/style-reference.md) を参照。 |
| `class` | 型付き `Styled` メソッド（`.flex_row().gap_2().p_4()`） | `string` | ネイティブに解決される Tailwind クラス（`"flex-row gap-2 p-4 dark:bg-zinc-900"`）。後のクラスが前のクラスより優先される。[Tailwind](../docs/tailwind.md) を参照。 |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | 値が truthy の間だけ適用されるクラス（`{ "opacity-50": busy() }`）。 |
| `disabled` | `.disabled(..)` | `boolean` | 押下を無視し（押下フィードバックも行わない）、`disabled:` スタイルを適用し、入力などのコントロールを無効にする。スクリーンリーダーは無効であることを読み上げる（`accessibilityState.disabled`）。 |

<a id="presses-and-feedback"></a>

### 押下とフィードバック

押下の処理はネイティブに実行されます。プラットフォームが押下を認識してアプリの押下スタイルを適用し、アプリのコードには事後に通知されるだけです。反応するのは最も内側の押下可能なビューだけです。スクロールビュー内では、スクロールを先に開始できるよう、押下の開始が約 130 ms 待機されます。

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | ビューの内側でタップが終了した。 |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | 指が `delayLongPress` の間、置かれたままだった。 |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | ビューに指が触れた。 |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | 指が離れた、または外れた。 |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | 押下が長押しになるまでのミリ秒数。 |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | タッチ領域を境界の外側へポイント単位で拡張する。 |

`PressEvent` は `{ position, pagePosition, modifiers, clickCount }` です。ビュー内とそのルートビュー内（`Point`）でのポインターの位置、押下の開始時に押されていた修飾キー、連続クリック数（ダブルクリックなら 2）を含みます。プラットフォームがポインターを報告しない場合は、ビューの原点、キーなし、クリック 1 回になります。

スタイルキー `pointerEvents`（Rust では `.pointer_events(PointerEvents::BoxNone)`、クラスでは `pointer-events-*`）は、そのビューとその内部のビューがどのタッチを受け取るかを決めます。`"none"` はどちらも受け取らず（内部で `"auto"` を設定したビューは再び受け取ります）、`"box-none"` は内部のビューのみ、`"box-only"` はビュー自身のみが受け取ります（[touch and gestures](../docs/touch-and-gestures.md#pointerevents)）。

押下フィードバックはアプリ側で定義します。`activeStyle`（または `active:` クラス、Rust では `.active(..)`）は、ビューが押されている間、アプリのコードへ往復することなくネイティブに適用されます（後述）。

<a id="state-styles"></a>

### 状態スタイル

ビューがある状態にある間、ビュー自身のスタイルの上にネイティブに適用されるスタイルです。それぞれ Tailwind バリアントのオブジェクト形式です。後の状態が優先されます（selected、checked と indeterminate、次に hover、focus、active の順）。`disabledStyle` はすべてに優先し、それ以外はビューが無効の間は適用されません。それぞれ要素自身のスタイルを取ります。`<Text>` では `TextStyle`、`<Input>` では `InputStyle`、`<Image>` では `ImageStyle`、それ以外では `ViewStyle` です。

| プロパティ | Rust | クラスバリアント | 適用される場面 |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | 押されている間。 |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | ポインターがビューの上にある間。 |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | ビューがフォーカスを持つ間。 |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | ビューまたはその内部のビューがフォーカスを持つ間（`Overlay` のコンテンツは、それが置かれているビューの内部とみなされる）。 |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | `disabled` の間。 |
| `checkedStyle` | `.checked(\|s\| ..)`、`.checked_style(style)` | `checked:` | `accessibilityState.checked` が `true` の間（チェックボックス、スイッチ、ラジオ。`"mixed"` はチェックされていない）。 |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`、`.indeterminate_style(style)` | `indeterminate:` | `accessibilityState.checked` が `"mixed"` の間（チェック済みでも未チェックでもないチェックボックス）。 |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | `accessibilityState.selected` が `true` の間（選択された `Button`、タブ）。 |
| `expandedStyle` | `.expanded(\|s\| ..)`、`.expanded_style(style)` | `aria-expanded:` | `accessibilityState.expanded` が `true` の間（ポップアップが開いている間の `Popover` または `Menu` のトリガー）。 |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`、`.pressed_style(style)` | `aria-pressed:` | `accessibilityState.pressed` が `true` の間（オンになっているトグルボタン。`"mixed"` は押されていない）。進行中の押下である `activeStyle` ではない。 |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
### Hover

アプリは、マウスがビューの上に来たこと、ビューの上を動いたこと、ビューから離れたことを受け取れます。対応するのは、macOS、Windows、Linux、GPUI バックエンド、デスクトップブラウザー、iOS での iPad のポインターまたは Mac のマウス、Android でのマウスまたはスタイラスです。ホバースタイル(`hover:`、`.hover(..)`)は、同じ環境でホバーされたビューにスタイルを適用します。

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | マウスがビュー、またはビュー内のビューの上に来ました(DOM の `mouseenter`)。 |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | マウスがビュー(またはビュー内のビュー)の上を動きました。ボタンが押されているかどうかは問いません。また、ボタンが押されていない状態でマウスが止まっている間に修飾キーが押された、または離された場合も発火します(DOM の `mousemove`)。 |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | マウスがビューとその内側のビュー、またはウィンドウから離れました。`e` は最後にあった位置です(DOM の `mouseleave`)。 |

CSS の `:hover` や DOM の `mouseenter` と同様に、マウスがビューの上、またはビュー内の何かの上にある間、そのビューはホバーされているものとして扱われます。そのため、マウスの真下にあるビューの周囲のビューにも `onMouseEnter` が届きます(外側から内側の順。`onMouseLeave` は内側から外側の順)。イベントは事後に届き、タッチでは発生しません。マウスの下から取り除かれたビューには `onMouseLeave` が届きます。Linux と Windows では、次にマウスが動いたときです。

`MouseEvent` は、GPUI の `MouseMoveEvent` と同様にマウスの位置を表します。ビュー内での `position`(ポイント単位の `Point`。変換は打ち消されています)、属するルートビュー内での `pagePosition`(タッチと同じ形式)、押されている `modifiers`(`control`、`alt`、`shift`、`platform`:Apple プラットフォームでは Command、それ以外では Windows キー)、そして押されているボタンを示す `pressedButton`(`"left"`、`"right"`、`"middle"`、`"back"` または `"forward"`。GPUI の `MouseButton`)、または `null` です。Rust では `position`、`page_position`、`modifiers`、`pressed_button` です。デスクトップとウェブでは、ドラッグもタッチ(`onTouchMove`、レスポンダー)であり、その移動は `pressedButton` が設定された状態で `onMouseMove` にも届きます。ホバーだけを追うフィードバックでは、これらを無視してください。iOS と Android では、ホバーはボタンが押されていないポインターを報告します。移動イベントは 1 フレームにつき最大 1 回、最新のものだけが届き、後に続く `onMouseLeave` より必ず前に届くので、ハンドラーは移動のたびに再描画できます。

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

### Tooltips

`tooltip` は、任意の要素にヒントを付けます。デスクトップ(macOS、Windows、Linux、GPUI バックエンド、デスクトップブラウザー)では、ポインターが要素の上に 0.5 秒間とどまると要素の上にヒントが表示され、ポインターが離れるか要素が押されるまで表示されます。スマートフォンとタブレットでは表示されません。ヒントがポインターや押下を受け取ることはないため、要素はヒントがない場合とまったく同じように動作します。

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | ヒント。アプリがスタイルを設定する要素です。`nsh/base` の [`Tooltip`](tooltip.md) はツールチップそのものであり、配置、遅延、イベントを持ちます。それ以外の要素はそのまま表示されます。 |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

`Tooltip` は、GPUI の `.tooltip(..)` がそうであるように、見た目、配置、遅延、イベントを自分で設定します。ツールチップを多く使うアプリでは、テキストを `Tooltip` で包む小さな独自コンポーネントを 1 つ用意しておくとよいでしょう。

### Context menus

`onContextMenu` は、ビューの上でセカンダリボタンが押されたことを伝えます。右クリック、macOS での Control-click、タッチパッドでの 2 本指クリック、iPad のポインターのセカンダリクリックが該当し、ブラウザーではキーボードのメニューキーも該当します。ここでアプリ独自のメニューを開きます。TSX では、[`Menu.popup`](../modules/nsh-desktop.md) がシステムのメニューを表示します。

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | ビュー、またはビュー内のビューの上でセカンダリボタンが押されました。 |

`ContextMenuEvent` には、ビュー内での `position`、ルートビュー内での `pagePosition`(`Menu.popup` がメニューを配置する基準:`Menu.popup(items, e.pagePosition)`)、そして `modifiers` が含まれます。Rust では `position`、`page_position`、`modifiers` です。リスナーを持つ最も近いビュー(ポインターの下のビューから外側へ向かって探します)がイベントを受け取ります。そのビューよりも近くにテキスト入力、または編集メニューを持つ選択可能なテキスト(Windows、GPUI バックエンド、ブラウザー)がある場合は、代わりにそちらが独自のメニューを表示します。これはボタンが押された時点で、マウントされているものをもとにプラットフォームが判断します。そのためハンドラーには事後に通知され、何かをキャンセルする必要はありません。`disabled` のビューは、クリックを周囲にある最も近い有効なリスナーに任せます。タッチスクリーンでは長押しでメニューが開くので、同じ関数で `onLongPress` を処理してください。

### Keyboard focus

macOS とウェブでは、Tab キーでキーボードフォーカスがツリー順にストップ間を移動します。ストップとなるのは、入力、押下を受け取るビュー、そしてすべての `focusable` ビューです。フォーカススタイル(`focus:`、`.focus(..)`)はフォーカスされたビューにスタイルを適用し、押下を受け取るビューでは Return または Space でそのビューが押されます。クリックはビューにフォーカスを移さずに押下するため、フォーカススタイルが表示されるのはキーボードフォーカスのときだけです。

フォーカスと押下は別のものです。フォーカスがある間にキーを受け取るビュー(チャート、スライダー、矢印キーで選択を移動するリストなど)は、`focusable` を設定し、フォーカス中のキーをバインドします([`keymap`](../modules/nsh.md#keymap) と組み合わせた `onFocus` / `onBlur`)。そのビューへの押下は、周囲にある押下可能なビュー、たとえばページを開くカードにも引き続き届きます。

ref の `focus()` は、Tab と同じようにキーボードフォーカスをストップに移します(フォーカススタイルが表示され、`onFocus` が発火します)。たとえば、閉じたポップアップのトリガーにフォーカスを戻すときに使います。`blur()` はフォーカスを外します。

フォーカスの周囲にあるビューは、フォーカスがそのビュー自身、またはその内側のいずれかのビューにある間、`focus-within:`(`focusWithinStyle`、`.focus_within(..)`)で自身のスタイルを設定できます。たとえば、編集中の入力を囲むフィールドの枠や、ボタンの 1 つにフォーカスがある間のツールバーです。`Overlay` の内容は、実際の表示位置にかかわらず、オーバーレイが置かれているビューの内側にあるものとして扱われます。そのため、ポップアップはトリガーを持つビューの一部として数えられます。Rust では、コンポーネントは ref の `on_focus_in(..)` と `on_focus_out(..)` によって、フォーカスが要素に入ったこと、出たことを受け取ります。要素の内側のビュー間での移動は、そのどちらにも当たりません。

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | 押下を受け取るビューでは `true` | ビューが Tab のストップかどうか。`true` を指定すると、押下を受け取るビューでも、周囲のビューに任せるビューでも、任意のビューがストップになります。`false` を指定すると、押下可能なビューはポインター専用になります(ポップオーバーを閉じるバックドロップ、矢印キーで移動する行など)。 |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab(または `focus()`)でビューにキーボードフォーカスが移りました。 |
| `onBlur` | `.on_blur(..)` | `() => void` | | キーボードフォーカスがビューから離れました。 |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

### Layout and identity

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` は、レイアウトで変化するたびに通知される、親に対するビューのフレーム(`{ origin, size }`)です。 |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | 要素の ref([ref メソッド](#ref-methods)を参照):`ViewRef`、またはそれに重ねた要素自身の型。`ref={el}` は変数に代入し、`ref={fn}` は関数を呼び出します。 |
| `nativeID` | `.native_id(id)` | `string` | 他の要素から参照できるようにビューに名前を付けます。たとえば、入力が参照する `InputAccessoryView` です。 |
| `testID` | `.test_id(id)` | `string` | UI テスト用の識別子(Android ではビューのリソース ID)。 |
| `key` | `.key(key)` | `string` | 兄弟要素の中での要素の識別子。 |

### Gestures driving animated values

これらの Prop は、ジェスチャーを、UI スレッド上で動く[ネイティブのアニメーション値](../modules/nsh.md#animation)にバインドします。フレームごとのアプリコードによる処理は不要です。[タッチとジェスチャー](../docs/touch-and-gestures.md)も参照してください。

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | ドラッグがこれらの値(ポイント)を動かします。 |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | ドラッグが始まりました。 |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | ドラッグが終わりました。離したときの速度が付きます(たとえば `decay` を開始するときに使います)。 |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | 2 本指のピンチが `scale` を動かします。 |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | ピンチが始まりました / 終わりました。 |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | 2 本指の回転が `angle`(度)を動かします。 |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | 回転が始まりました / 終わりました。 |

`PanEvent` は `{ cancelled, translation, velocity, value? }` です(Rust では `cancelled`、`translation`、`velocity_x`、`velocity_y`、`value_x`、`value_y`)。システムがドラッグをキャンセルしたかどうか、開始からの移動量、秒あたりのポイントで表した速度(`Point`)、そしてその時点でのバインドされた値が含まれます。バインドされた値は、`pan` がバインドする軸については `{ x?, y? }` です(ドラッグはアニメーション中の値をつかむことができます)。

### Raw touches and the responder system

上の Prop ではカバーできないジェスチャーのために、すべての要素がタッチ系とレスポンダー系の Prop を受け付けます。`onTouchStart`、`onTouchMove`、`onTouchEnd`、`onTouchCancel`(およびその `…Capture` 形式)、`onStartShouldSetResponder`、`onMoveShouldSetResponder`(および `…Capture`)、`onResponderGrant`、`onResponderReject`、`onResponderStart`、`onResponderMove`、`onResponderEnd`、`onResponderRelease`、`onResponderTerminate`、`onResponderTerminationRequest` です。各ハンドラーは `GestureResponderEvent` を受け取ります(`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...)。`onResponderGrant` から `true` を返すと、ネイティブのスクロールビューがタッチを奪わなくなります。`panActivation`(`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`)は、プラットフォームがパンを有効にした後にはじめてビューをレスポンダーにするため、スクロールビュー内でのドラッグでは、もう一方の軸がスクロールビューに任されます([タッチとジェスチャー](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation))。[`PanResponder`](../modules/nsh.md#panresponder) の `PanResponder` は、これらをもとに作られています。Rust では、`.on_touch(..)` がすべてのタッチを受け取り(`TouchEvent`)、`.claim_touches(..)` がビューがタッチを引き受けるタイミングを決め、`.on_responder_grant(..)`、`.on_responder_move(..)`、`.on_responder_release(..)` などがレスポンダーに従います。

### Accessibility

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | ビューは支援技術にとって 1 つの要素となり、その子は個別には公開されません。 |
| `accessibilityLabel` | `.label(..)` | `string` | スクリーンリーダーが読み上げる内容。ラベルのないビューは、中のテキストが読み上げられます。 |
| `accessibilityHint` | `.hint(..)` | `string` | 要素を操作したときに何が起こるか。 |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | 要素が何であるか(`"button"`、`"header"`、`"link"`、`"switch"` など)。 |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | 支援技術が報告する状態(`checked` と `pressed` は `"mixed"` にできます。`current` は `true` または `"page"`、`"step"`、`"location"`、`"date"`、`"time"`)。 |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | 見出しのレベル(1 が最上位)、ツリー項目の深さ(1 が最上位)。 |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | 範囲要素またはテキスト要素の値。 |
| `accessibilityElementsHidden` | | `boolean` | ビューとそのサブツリーを支援技術から隠します。 |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | ビューを公開するかどうか。 |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | 支援技術に提供するカスタムアクション。 |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | ユーザーが `accessibilityActions` のいずれかを実行しました。 |

[アクセシビリティ](../docs/accessibility.md)を参照してください。

### Platform-only props

1 つのプラットフォームにしかない Prop は、TSX ではそのプラットフォーム名のオブジェクトに入れるため、共通の Prop はどこでも同じままです。送られるのは現在のプラットフォームのオブジェクトだけで、それ以外は無視されます。Rust のビルダーでは、これらはメソッドとして用意され、該当するプラットフォームでのみ適用されます。

| Prop | 説明 |
|---|---|
| `ios={{…}}` | iOS と Mac Catalyst。`<Input>`、`Dialog`、`WebView` は独自のキーを追加します。 |
| `android={{…}}` | Android。すべての要素が `ripple`、`elevation`、`accessibilityLiveRegion`(下記)を受け付けます。 |
| `desktop={{…}}` | デスクトッププラットフォームとデスクトップブラウザー。モバイルでは無視されます。すべての要素が `windowDrag`(下記)を受け付けます。 |
| `web={{…}}` | ブラウザー。それ以外では無視されます。 |

| `android` のキー | Rust | 型 | 説明 |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | 押されている間のマテリアルのリップル。 |
| `elevation` | `.elevation(px(2.0))` | `number` | ビューの形状から作られるマテリアルの影(ポイント)。 |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | ビューの変化を TalkBack にどのように通知するか。 |

| `desktop` のキー | Rust | 型 | 説明 |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | ビューを押すと、タイトルバーと同じようにウィンドウをドラッグします。`false` は、ドラッグ可能なビューの一部をクリック可能なままにします。[独自のタイトルバー](../modules/nsh-desktop.md#a-title-bar-of-your-own)を参照してください。 |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

[プラットフォーム固有のコード](../docs/platform-specific.md)を参照してください。
<a id="ref-methods"></a>

## Ref メソッド

TSX では、`ref` は要素の ref を受け取ります。その型は要素固有のものです。`View`、`Text`、`Image`、`Canvas`、`Overlay`、`Shader` には `ViewRef`（`focus`、`blur`、`measure`）が使われ、それ以外の要素には、その要素のメソッドを持つ `ViewRef` ベースの型が使われます。具体的には `InputRef`（`Input`）、`ScrollRef`（`Scroll`）、`ListRef`（`List`）、`WebViewRef`（`WebView`）、`VideoRef`（`Video`）、`NativeComponentRef`（ネイティブコンポーネント）です。Rust では、`element_ref()` が `ElementRef` ハンドルを作成し、`.element_ref(&handle)` がそれをアタッチします。これらのメソッドは、ネイティブビューにコマンドを送ります。コマンドは、同じターン内でそれより前に行われた変更と同じ順序で送られます。各要素のページに、その要素で使えるメソッドが記載されています。ref 変数には、その要素固有の型（`<Input>` なら `let field!: InputRef`）を指定してください。`ViewRef` 型の変数は、固有のメソッドを持つ ref の要素には適合しません。

| メソッド | Rust | Ref | 説明 |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | `<Input>` にフォーカスを当てる（キーボードを表示する）、または、プレスを受け取るビューにキーボードフォーカスを与える／フォーカスを外します。 |
| `measure()` | `measure()` | `ViewRef` | [ビューの位置](../docs/touch-and-gestures.md#where-a-view-is-measure)。 |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | UTF-16 単位で `start..end` を選択します。`end` がない場合はキャレットになります。 |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`、`ListRef` | オフセットまでスクロールします。 |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef`（ズーム可能な `<Scroll>`） | コンテンツ上の点を中心に `scale` までズームします。 |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | リストの軸方向のオフセットまでスクロールします。 |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | アイテムが見える位置までスクロールします。 |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`、`ListRef` | コンテンツの末尾までスクロールします。 |
| `reload()`、`goBack()`、`goForward()`、`stopLoading()`、`injectJavaScript(script)`、`postMessage(data)` | `reload()`、`go_back()`、`go_forward()`、`stop_loading()`、`inject_java_script(..)`、`post_message(..)` | `WebViewRef` | ページを制御します。 |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | 指定した時間へジャンプします。 |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | 登録済みのネイティブコンポーネントのコマンドを呼び出します（[`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)）。 |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## ハンドラが UI をブロックしない理由

メインスレッドは、アプリのコードを待つことはありません。システムがその場で答えを必要とする場合（このテキストを変更してよいか、戻るボタンで pop してよいか、このシートを閉じてよいか）、NSH は事前に設定された props（`maxLength`、`popOnBack`、`closeOnSwipe` など）に基づいてネイティブ側で応答し、イベントはその後でアプリに届きます。このような動作が、ハンドラの戻り値ではなく prop になっているのはそのためです。
