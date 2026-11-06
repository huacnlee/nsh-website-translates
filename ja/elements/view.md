---
title: "View"
description: "基本となるコンテナ要素です。レイアウト、背景、枠線、シャドウ、プレス処理、ジェスチャーを扱えます。"
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` はすべての画面の構成要素です。flexbox または grid で子要素をレイアウトし、背景、枠線、シャドウ、グラデーションを描画し、プレスを処理するネイティブコンテナです（iOS と Mac Catalyst では UIView、Android では ViewGroup）。ボタン、カード、行、画面はすべて view です。Rust では `view()` で、TSX では `nsh` の `<View>` で作成します。

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

<a id="layout"></a>

## レイアウト

view は flexbox で子要素をレイアウトします。デフォルトは `flexDirection: "column"`、`flexShrink: 0`、`alignContent: "flex-start"`、`position: "relative"` です。`display: "grid"`（Rust では `.grid()`）を指定すると CSS grid に、`display: "block"` を指定するとブロックレイアウトに切り替わります。サイズの単位はポイントです。[layout](../docs/layout.md) と [style reference](../modules/style-reference.md) を参照してください。

`display: "flex"` は CSS に従います。style 内、`flex` クラス、Rust の `.flex()` のいずれでも、方向が指定されていない限り row になります（`flexDirection: "column"`、`flex-col`、`.flex_col()`）。display を指定していない view は、子要素を column に積みます。

## Props

`View` 独自の prop は `selectable`（Rust では `.selectable(true)`）の 1 つだけです。view 内のテキストを 1 つの選択範囲としてまとめて選択できるようにします（[Text selection](./text-selection.md)）。残りは[共通 props](./index.md#common-props)です。スタイル（`style`、`class`、`classList`。Rust では `Styled` メソッド）、`disabled`、プレス関連の props（`onPress`、`onLongPress`、`onPressDown`、`onPressUp`、`delayLongPress`、`hitSlop`）、状態スタイル（`activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle`、`checkedStyle`）、`onMouseEnter` / `onMouseMove` / `onMouseLeave`、`onContextMenu`、`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`、`focusable`、`onLayout`、`ref`、`nativeID`、`testID`、ジェスチャー関連の props（`pan`、`pinch`、`rotation` とそのイベント）、タッチおよびレスポンダー関連の props、アクセシビリティ関連の props、そして `ios` / `android` / `desktop` です。

<a id="selectable-views"></a>

## 選択可能な view

`selectable` を指定すると、view 内の [`Text`](./text.md) 要素と [`TextView`](./text-view.md) にまたがって、読み順に選択範囲が伸びます。`selectable={false}` を指定したテキストは対象外になり、選択可能な view が別の選択可能な view の内側にある場合は、外側の view の一部として扱われます。各プラットフォームでのジェスチャーについては [Text selection](./text-selection.md) を参照してください。

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## プレスフィードバック

プレス可能な view とは、プレスハンドラーを持つ view のことです。フィードバックはアプリ側で定義します。指が触れている間、プレス中のスタイルがネイティブに適用され、アプリのコードとのやり取りは発生しません。`hoverStyle`、`focusStyle`、`disabledStyle` は、他の状態に対して同じ働きをします。

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

Android では、`android={{ ripple: { color: "#0000001f" } }}`（Rust では `.ripple(Ripple { .. })`）でマテリアルのリップルを追加できます（`borderless`、`radius`、`foreground` で調整できます）。

`disabled` を指定すると、ネイティブ view からプレスリスナーが取り除かれ（プレスもフィードバックも発生しません）、無効状態のスタイルが適用されます。

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent`（Rust ではなし） | view の内側でタップが終了した。 |
| `onLongPress` | `.on_long_press` | `PressEvent`（Rust ではなし） | 指が `delayLongPress`（500 ms）の間触れたままだった。 |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent`（Rust ではなし） | 指が触れた / 離れた、または view の外に出た。 |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | マウスが view（またはその内側の view）の上に入った / view またはウィンドウから出た（[hover](./index.md#hover)）。`onMouseLeave` のものは最後にあった位置。 |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | ボタンの押下の有無にかかわらずマウスが view（またはその内側の view）の上で動いた、またはボタンが押されていない状態でマウスが静止している間に修飾キーが押された / 離された。`position`、`pagePosition`（`Point`）、`modifiers`、`pressedButton`（`"left"`、`"right"`、`"middle"`、`"back"`、`"forward"`、`null`）。1 フレームにつき最大 1 回。 |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | view の上でセカンダリボタンが押された（[context menus](./index.md#context-menus)）。 |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | なし | ローカルファイルのドラッグが、アクティブなデスクトップの宛先に入った / 出た。 |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }`（`FileDropEvent`） | ローカルのファイルまたはディレクトリがデスクトップの宛先にドロップされた。 |
| `onLayout` | `.on_layout` | `{ bounds }`（`Bounds<Points>`） | 親に対する相対フレームが変化した。 |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | `pan` でバインドされたドラッグが開始 / 終了した。システムによってキャンセルされた場合、`cancelled` は true になる。 |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | `pinch` でバインドされたピンチが開始 / 終了した。 |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | `rotation` でバインドされた回転が開始 / 終了した。 |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | カスタムアクセシビリティアクションが実行された。 |

タッチおよびレスポンダーのイベントについては、[共通 props](./index.md#raw-touches-and-the-responder-system)を参照してください。

<a id="desktop-file-drops"></a>

## デスクトップでのファイルドロップ

AppKit、GTK、Win32、GPUI では、`onFileDrop` を持つ view が、他のアプリケーションからドラッグされたローカルのファイルやディレクトリを受け取ります。`onFileDragEnter` と `onFileDragLeave` はアクティブな宛先を追跡し、`onFileDrop` はネイティブのファイルリストの順序で `{ uris: string[] }` を受け取ります。各エントリは、スペースや非 ASCII 文字がエスケープされた絶対 `file:` URL です。プレフィックスを手作業で取り除くのではなく、URL をパースしてファイルシステムパスを取得してください。

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

`onFileDrop` をリッスンしている、最も近い有効な祖先がドロップを受け取ります。モーダルルートがこの探索の範囲を区切ります。`disabled` はファイルのドラッグ＆ドロップのリスナーを取り除きます。ドラッグが離れたとき、キャンセルされたとき、完了したとき、宛先が削除されたときには、アクティブ状態がクリアされます。受け入れには Copy 操作とマウント済みのネイティブ状態が使われます。受け取ったファイルを読み取るか、開くか、転送するかはアプリが決めます。

<a id="ref-methods"></a>

## Ref メソッド

通常の view の ref は `ViewRef` で、`focus()`、`blur()`、`measure()` を持ちます。`ref`（Rust では `.element_ref(&handle)`）はそのノードを返します。たとえば `setAccessibilityFocus`（[`nsh` のアクセシビリティ API](../modules/nsh.md#accessibility)）に渡したり、サイズを測定したりできます（Rust では `handle.measure()`）。

<a id="views-inside-text"></a>

## テキスト内の view

テキストの内側に置いた view はインライン添付になります。ベースライン上に配置され、単語と一緒に折り返され、独自のプレスも受け付けます。[text](./text.md#inline-views-and-images) を参照してください。

<a id="platform-notes"></a>

## プラットフォーム別の注意事項

- `boxShadow` はすべてのプラットフォームで描画されます。`android={{ elevation }}` を使うと、代わりに Android のマテリアルシャドウが使われます。Android でシャドウを表示するには背景色が必要です（背景が透明な view にはシャドウが落ちません）。
- view に対する `filter`：iOS では `opacity()`、1 までの `brightness()`、`drop-shadow()` をサポートします（画像ではすべてのカラーフィルターと `blur()` が使えます）。Android では API 31 以降ですべてをサポートし、それ未満ではカラーフィルターのみサポートします。
- `backdropFilter: "blur(…)"` は iOS ではシステムマテリアル（近似）で、Android では API 31 が必要です。
- Android は `translate`、`scale`、`rotate` の変換を描画します。スキュー（`skew()`、`skewX()`、`skewY()`）は他のプラットフォームで適用されます。
- `borderCurve: "continuous"`（`.border_curve(BorderCurve::Continuous)`）は、辺になめらかにつながる角（iOS のアプリアイコンのような角）を、両プラットフォームで描画します。
- `cursor` スタイルは、ポインターがある環境（Mac Catalyst、ポインター接続時の iPad、デスクトップ）で適用されます。
