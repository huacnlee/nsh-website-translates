---
title: "Resizable"
description: "ResizablePanelGroup と ResizablePanel は、パネルを横並びまたは縦積みに配置し、隣り合うパネルの間にあるハンドルをユーザーがドラッグすることで、領域を分け合えるようにします。グループは、ドラッグ操作、パネルのサイズ制限、リサイズカーソル、スクリーンリーダー向けのハンドルのロールを管理します。サイズ、ハンドルの見た目、パネルの内容はアプリ側で定義します。"
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

Resizable グループは、パネルを横並びまたは縦積みに配置し、隣り合う 2 つのパネルの境界ごとにハンドルを置きます。たとえば、ドキュメントの横のサイドバー、コンソールの上のエディター、詳細の横のリストなどです。ユーザーがハンドルをドラッグすると境界が動き、各パネルはアプリが許可するサイズの範囲内にとどまります。`ResizablePanelGroup` が動作を担います。具体的には、フレームごとにネイティブで実行されるドラッグ、空きスペースの分配、リサイズカーソル、指で操作するための広いタッチ領域です。見た目はアプリ側が決めます。ハンドルは線も色もグリップも持たない帯であり、そこに描かれるものはアプリのインジケーターです。パネルもアプリのビューです。

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` と `ResizablePanel` は Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に含まれています。パネルはグループの直接の子です。Rust では、`h_resizable()` と `v_resizable()` が各軸のグループを作り（`resizable_panel_group().axis(..)` は軸を値として受け取ります）、`resizable_panel()` がパネルを作ります。それぞれにプロパティごとのセッター、イベントごとのリスナー、型付きのスタイルメソッド、そしてコンテンツ用の `.child(..)` があります。`.size_range(min..max)` は両方の制限を一度に設定します。

<a id="sizes"></a>

## サイズ

パネルの `size` は、そのパネルが希望するサイズで、`minSize` と `maxSize` の範囲内で決まります。サイズを持たないパネルは、コンテンツに関係なく残りのスペースを均等に分け合います。すべてのパネルにサイズがある場合は、余ったスペースがそれらのサイズに比例して分配されます。ユーザーがハンドルをドラッグしている間、グループは JS を介さずコア内でパネル間のスペースを移動します。

- ハンドルの前にあるパネルを大きくすると、後ろにあるパネルから近い順にスペースを取ります。各パネルは `minSize` まで縮み、`fixed` のパネルは飛ばされます。
- ハンドルの前にあるパネルを `minSize` より小さくすると、その前にあるパネルからスペースを取ります。
- どのパネルも `maxSize` を超えて大きくならず、パネルの合計がグループを超えることもありません。

ドラッグが終了してサイズが変わっていた場合、グループは表示中のすべてのパネルのサイズをレイアウト順に報告します（グループの `onResize`）。また、サイズが変わった各パネルは自身のサイズを報告します（パネルの `onResize`）。ドラッグで動いたパネルは、アプリが新しい `size` を渡すまでユーザーが設定したサイズを保持します。報告されたサイズを `size` として渡し直すことで、アプリはグループの寿命を超えてサイズを保持できます。これにより、[ストレージ](../modules/nsh.md#storage)から復元したレイアウトは、ユーザーが最後に設定したサイズで開きます。報告が行われるのはドラッグとスクリーンリーダーの操作ステップのみです。ウィンドウのリサイズやパネルの表示・非表示では何も報告されません。

グループが拡大または縮小したとき（ウィンドウがリサイズされたとき）は、サイズを持つパネルはそのサイズを保ち、サイズを持たないパネルが差分を受け持ちます。グループがサイズの合計に対して小さすぎる場合は、`fixed` のパネル（サイドバーやインスペクターなど）を除いてパネルが縮み、スペースが戻ると元のサイズに戻ります。`visible={false}` のパネルはスペースを取らず、他のパネルがそのスペースを分け合います。再び表示されると、元のサイズで戻ります。

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## ハンドル

表示中の 2 つのパネルの境界ごとにハンドルがあります。ハンドルは、軸に対して 9 ポイントの太さの帯で、境界を中心に配置され、その軸のリサイズカーソルを持ちます。タッチスクリーンでは、タッチ領域が両側にさらに 10 ポイント広がるため、1 ポイントの線でも簡単につかめます。ハンドルは `group` です。そこに描かれるのはアプリのインジケーターで、`handleClass` / `handleStyle` でスタイルを設定します。大きさは軸方向に 1 ポイント、長さは境界の全長なので、`bg-border` だけでどちらの軸でもヘアラインになります。`w-[3px]` または `h-[3px]` で太くでき、`group-hover:` クラスと `group-active:` クラスは、帯の上のポインターと、押下やドラッグに追従します。線より凝った表現（点のグリップやアイコン）が必要な場合は、`renderHandle` がインジケーターの内容を描画します。ハンドルの `index`、`axis`、`state` が渡され、状態が変わったときに再描画されます。再描画はドラッグ中に数回程度で、移動のたびには行われません。アニメーションするグリップはハンドルのサムです（`handleThumbClass` / `handleThumbStyle`）。これは線の中央に置かれる 1 つのビューで、縦線では縦向きに描かれ、横線では 4 分の 1 回転して描かれるため、1 つのクラスで両方の軸に対応できます。このビューは `group-hover:` クラスと `group-active:` クラスで表示と遷移が行われます。ハンドルは、ポインターがどこへ動いても、ドラッグ全体を通して押された状態を保ちます。

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` は、すべてのハンドルをその位置に固定します（ロックされたレイアウト）。

<a id="props"></a>

## プロパティ

### ResizablePanelGroup

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 横並び（ハンドルを左右にドラッグ）または縦積み（上下にドラッグ）。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | ドラッグ不可。ハンドルはその位置にとどまります。 |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | 各ハンドルのインジケーター。境界上のハンドルの帯の中に置かれ、特に指定がない限り、軸方向に 1 ポイント、長さは境界の全長です（`w-[3px]`, `h-[3px]`）。`group-hover:` と `group-active:` は帯に追従します。 |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | なし | 各ハンドルのサム。線の中央に置かれるグリップで、縦線では縦向きに描かれ、横線では 4 分の 1 回転して描かれるため、1 つのクラスで両方の軸に対応できます。ハンドルがホバー、押下、ドラッグされている間も同じビューのままなので、`group-hover:` クラスと `group-active:` クラスで遷移させます（`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`）。 |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | なし | 各インジケーターの内容。ハンドルの `state` が変わると再描画されます。 |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | なし | 各ハンドルについてスクリーンリーダーが読み上げる内容（何をリサイズするか）。スクリーンリーダーは 10 ポイントずつ調整します。 |
| `children` | `.child(..)` | `JSX.Element` | なし | `ResizablePanel`。グループの直接の子です。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | `size-full` | グループ自体。クラスで指定しない限り、親を満たします。 |

### ResizablePanel

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | なし | グループの軸方向に希望する長さ（ポイント単位）。`minSize` と `maxSize` の範囲内で決まり、新しい値を渡すとリサイズされます。指定しない場合は残りのスペースを分け合います。 |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | 最小サイズ。 |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | 制限なし | 最大サイズ。 |
| `fixed` | `.fixed(..)` | `boolean` | `false` | グループがパネルの合計に対して小さすぎる場合でもサイズを保ちます。自身のハンドルをドラッグすればリサイズできます。`size` を受け取ります。 |
| `visible` | `.visible(..)` | `boolean` | `true` | 非表示の場合、スペースを取らず、他のパネルがそのスペースを分け合います。 |
| `children` | `.child(..)` | `JSX.Element` | なし | パネルの内容。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | なし | パネル自体の表面。軸方向のサイズはグループが決めます。 |

### ResizeHandleContext

| フィールド | 型 | 説明 |
|---|---|---|
| `index` | `number` | `index` 番目の表示中のパネルの後ろにある境界。 |
| `axis` | `"horizontal" \| "vertical"` | リサイズする軸。 |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | ポインターまたは指がハンドルとともに移動した距離。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | ドラッグが終了してハンドルが動いた場合、またはスクリーンリーダーがハンドルを調整した場合に発生します。`sizes` は、表示中のすべてのパネルのサイズで、レイアウト順（左から右、上から下）に並びます。 |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | ドラッグが終了してこのパネルのサイズが変わった場合に発生します。`size` は新しいサイズで、パネルの `size` として渡し直します。 |

<a id="parts"></a>

## パーツ

| パーツ | 配置先 | スタイル | 状態 |
|---|---|---|---|
| グループ | | `ResizablePanelGroup` の `class`, `style` | |
| パネル | グループ | `ResizablePanel` の `class`, `style` | |
| ハンドルのインジケーター | 境界上のハンドルの帯 | `handleClass`, `handleStyle`, `renderHandle` | ポインター下では `group-hover:`、押下中またはドラッグ中は `group-active:`、`renderHandle` では `state` |
| ハンドルのサム | ハンドルの線の中央 | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:`（ドラッグが終わるまで押された状態） |

<a id="accessibility"></a>

## アクセシビリティ

- 各ハンドルは、スクリーンリーダー向けの調整可能な要素で、`handleAccessibilityLabel` がラベルになります。値は、ハンドルの前にあるパネルのサイズで、そのパネルの `minSize` と `maxSize` の範囲内です。
- VoiceOver でハンドルを上下にスワイプするか、TalkBack の音量キーを使うと、ドラッグと同様にハンドルが 10 ポイント動きます。グループは `onResize` でそれを報告します。`disabled` のグループでは、ハンドルはその位置にとどまります。
- パネルの内容はアプリのものであり、他の場所と同じように読み上げられます。

ラベル、ロール、アナウンスの全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- デスクトップ（macOS、Windows、Linux、GPUI）と Web: ハンドル上のポインターには列または行のリサイズカーソルが表示され、マウスまたはタッチパッドでドラッグすると境界が動きます。
- iOS、Android、Mac Catalyst: 指でハンドルをドラッグします。タッチ領域は、帯より両側に 10 ポイントずつ広くなります。
- 右から左へのレイアウトでは、パネルとそのサイズはレイアウトの順序に従います。
- どのプラットフォームでも、アプリがスタイルを設定したもの（インジケーターとパネル）が描画されます。
- [Dock](./dock.md) の分割は Resizable グループです。同じ方法でリサイズされます。
