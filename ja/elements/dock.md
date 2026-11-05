---
title: "Dock"
description: "DockArea:分割、タブグループ、左・右・下端のドックで構成される、ドッキング可能なワークスペースです。レイアウトはアプリが所有するデータとして扱われます。エリアはタブのドラッグ&ドロップ、リサイズ、ドック、ズーム、ロックを管理し、パネルが移動してもそのコンテンツを保持し、スマートフォンにも適応します。見た目とパネルのコンテンツはアプリ側が担当します。"
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

ドックエリアは、ユーザーが配置するワークスペースです。パネルはタブグループにまとめられ、グループは左右に並べたり上下に積んだりでき、左・右・下の端にあるドックは開閉やリサイズができます。タブを別のグループにドラッグするとそのグループに加わり、グループの端にドラッグするとそのグループが分割されます。パネルは移動しても、保持している内容をそのまま保ちます。`DockArea`が動作を担います。フレーム単位でネイティブに実行されるタブのドラッグ&ドロップ、分割とドックのリサイズ、ドックの開閉、ズーム、ロックです。見た目はアプリ側のものです。タブ、タブバー、ハンドル、ドロップインジケーター、各パネルの内容はアプリがレンダリングしスタイルを指定するもので、エリア自体は何も描画しません。

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea`とそれが取る値は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) に由来します(`nsh_base::dock_area()`、値は`nsh_base::dock`)。Rust では、`dock_area()` がエリアを作成します。prop ごとのセッター、イベントごとのリスナー、型付きのスタイルメソッドを備えています。`DockLayout` は、パネルのキー(`h_split()`、`v_split()`、`tabs()`、`.child(layout, size)`、`.panel(key)`)でレイアウトを記述します。

<a id="the-layout"></a>

## レイアウト

レイアウトは値(`DockAreaLayout`)で、センターと、左・右・下の各端のドック(いずれも省略可能)からなります。各リージョンは、2 種類のノードからなるツリーです。

| ノード | 保持するもの | フィールド |
|---|---|---|
| `{ type: "split" }` | 他のノードを、横に並べる(`axis: "horizontal"`)か縦に積む(`"vertical"`)かして保持 | `children`と`sizes`:各子の軸方向の長さ(ポイント)。残りを分け合う場合は`null` |
| `{ type: "tabs" }` | パネルをキーで保持し、一度に一つだけ表示 | `panels`(タブ順のキー)、`activeIndex`(表示中のもの、デフォルトは 0) |

パネルは必ずタブグループの中にあります。パネルが一つのリージョンは、一つのパネルからなるタブグループです。パネルのキーはアプリがそのパネルに付ける文字列(`"files"`、ドキュメントの id など)で、レイアウト全体で一度だけ現れます。ドック(`DockRegion`)は、そのツリー(`layout`)、端をまたぐ方向のサイズ(`size`、デフォルトは 200、最小 100)、開いているかどうか(`open`、デフォルトは`true`)、最小サイズ未満までエッジをドラッグすると閉じるかどうか(`collapsible`、デフォルトは`true`)で構成されます。

すべてのノードには `id` があります。アプリが書くレイアウトでは id を省略でき、その場合はエリアが割り当てます。エリアが報告するレイアウトには必ず id が含まれます。報告されたレイアウトをそのまま渡し戻すと各グループの同一性が保たれ、ref のメソッドはこれを使ってグループを指定します。エリアは渡されたレイアウトの整理も行います。空のグループや分割は取り除かれ、子が一つの分割はその子に置き換えられ、同じ軸の分割の中にある分割は親に統合され、`activeIndex` は範囲内に収められ、二度listされたキーは最初の位置だけが残ります。報告されるレイアウトは常にこの正規の形です。

レイアウトはアプリのものです(`layout`)。ユーザーが行うあらゆる変更(タブの選択・ドラッグ・クローズ、分割やドックのリサイズ、ドックの開閉)は新しいレイアウト全体として報告され(`onLayoutChange`)、エリアはアプリが渡し戻したレイアウトを表示します。アプリ自身がレイアウトを変更するときは、新しい値を渡します。保存したレイアウトの復元や、ワークスペースを並べ替えるコマンドなどです。`layout` のないエリアは自前のレイアウトを保持し、`defaultLayout` から始まり、すべての変更を引き続き報告します。

<a id="panels-content"></a>

## パネルの内容

パネルが何を表示するかはアプリ次第です。`renderPanel` がパネルのキー(`panel.id`)から内容をレンダリングします。グループ内のすべてのパネルは配置され、表示中のものだけが見えるため、タブを切り替えても各パネルの内容は保たれます。また、パネルが移動するとき(別のグループへ、ドックへ、ズームへ、そして元へ)も、同じ内容が一緒に移動します。作成されたシグナル、入力欄のテキスト、スクロール位置、Web ビューのページはすべて保持されます。エリアはパネルが最初に現れたときに一度だけレンダリングし、パネルがレイアウトから外れると(`onPanelRemove`)その内容を解放します。

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` は、各パネルが許可する操作をキーごとに設定します。リストにないパネルはすべてを許可します。

| フィールド | デフォルト | 説明 |
|---|---|---|
| `id` | | パネルのキー。 |
| `closable` | `true` | 閉じることができる。 |
| `zoomable` | `true` | 表示中は、そのグループをズームできる。 |
| `visible` | `true` | 表示される。非表示のパネルは位置を保持し、その位置に戻ります。パネルがすべて非表示のグループや分割は、スペースを取りません。 |

<a id="tabs"></a>

## タブ

各グループには、表示されるパネルごとにタブを持つタブバーがあり、タブは `panels` の順に並びます。`renderTab` はタブの表示内容(タイトル、アイコン、アプリ独自の閉じるボタン)をレンダリングします。指定しない場合、タブにはパネルのキーが表示されます。タブとしての機能はエリアが提供します。押すと選択され、ドラッグするとそのパネルが移動し、スクリーンリーダーは選択状態を持つタブとして読み上げ、`tabClass` の `selected:` クラスが表示中のタブをスタイルします。タブの値は、アプリが描画に必要とする情報を伝えます。

| フィールド | 型 | 説明 |
|---|---|---|
| `panel` | `string` | パネルのキー。 |
| `group` | `number` | 属するタブグループの id。 |
| `index` | `number` | グループ内の表示タブの中での位置。 |
| `active` | `boolean` | グループで表示中のタブである。 |
| `closable` | `boolean` | エリアがこのタブを閉じられる。閉じることが許可され、エリアがロックされておらず、グループがこのパネルを手放せる場合。 |
| `zoomed` | `boolean` | グループがズームされている。 |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## ドラッグ&ドロップ

グループの上にドラッグされたタブは、着地する位置を示し、ドロップするとその位置に置かれます。

| ドロップ先 | パネルの扱い |
|---|---|
| タブバー | そのグループに加わり、ドロップ位置の前後のタブの間に入る |
| グループのコンテンツの中央 | そのグループに加わる |
| グループのコンテンツの端(各辺の外側 35%) | そのグループを分割し、その側に新しい専用グループができる |

ドラッグがホバーしている間、エリアはパネルが占める部分(結合ならコンテンツ全体、分割なら半分)にドロップインジケーターを表示します。これはアプリがスタイルを指定するパーツ(`dropIndicatorClass`)で、アプリがレンダリングすれば独自のコンテンツも持てます(`renderDropIndicator`。渡される情報は `group`、分割で生まれる `side`、またはタブバーの `index`)。インジケーターは新しい位置へネイティブに移動し、イージングで滑らかに動いて、別のグループでは前のものがフェードアウトするのと入れ替わりにフェードインします(ユーザーが視覚効果の軽減を求めている場合は即座に切り替わります)。ポインターや指に追従するものもアプリ次第です(`renderDragPreview`)。ドロップはレイアウトの一回の変更として一度だけ報告され、何も変えないドロップは何も変更しません。

ロックされたエリア、ズームされたエリア、そしてグループの横に何もない場合のそのグループの最後のパネルは、ドラッグできません。

<a id="docks"></a>

## ドック

ドックは、パネルもサイズも失わずに開閉できます。閉じてもツリーは保持され、開くと同じグループが同じサイズで表示されます。ドックとセンターの間のエッジは、ユーザーがドラッグしてドックをリサイズするハンドルです。ドックは最小 100 ポイント、センターも最小 100 ポイントが保たれ、折りたたみ可能なドックを 50 ポイント未満で離すと閉じ、開くときのためにサイズを保持します。エリアは常に自身の範囲に収まります。ドックはエリアが残す範囲内で `size` のサイズで表示され、それでも収まらないときは、ドックが他の部分とともに縮み、分割の最小サイズは譲られます。`renderDock` は、ドックのレイアウトの前に、ドック固有のクローム(タイトルストリップや折りたたみボタンなど)を描画します。渡される情報は `placement`、`open`、`size`、`collapsible` で、`dockClass` がそのフレームをスタイルします。

アプリからドックを開閉・リサイズするには、ref(`toggleDock`、`setDockOpen`、`setDockSize`)を使います。これらはどちらのプレゼンテーションでも動作します。または、渡すレイアウトの中でドックの `open` と `size` を書き込みます(`open` はフルプレゼンテーションのものです)。`onDockOpenChange` は、ドックが表示または非表示になるたびに報告します。これはレイアウトの `open` を基準に測られます(最初からコンパクトなエリアは、レイアウト上で開いている各ドックを非表示として報告します)。そのため、レイアウトの `open` から始めて `onDockOpenChange` に従うトグルは、常にドックの状態を正しく表示します。

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

<a id="zoom"></a>

## ズーム

ズームされたグループは、ズームアウトされるか、レイアウトから外れるまで、エリア全体を占めます(`area.toggleZoom(group)`、ズームアウトは `area.toggleZoom()`)。`onZoomChange` は、表示中のパネル、または `null` を報告します。ズームはグループに属するため、表示中のパネルが閉じられて次のパネルに替わっても、ズームされたままです。`zoomable: false` を持つパネルは、表示中の間そのグループがズームされるのを防ぎます。

<a id="locking"></a>

## ロック

`locked` は配置をそのまま保ちます。タブのドラッグ、ドロップ、クローズはできません。タブの選択、リサイズ、ドックの開閉は引き続き使えるため、ロックされたワークスペースも使えるワークスペースのままです。

<a id="methods"></a>

## メソッド

`ref={area}` はエリアのメソッド(`DockAreaRef`)を提供します。アプリのコマンド、ショートカット、メニューで使います。各編集は、ユーザーによる編集と同様に `onLayoutChange` で報告されます。レイアウトにないパネル、グループ、タブインデックス、ドックを渡されたメソッドは、レイアウトをそのままにし、メソッド名と値を示す警告をログに出力します。

| メソッド | 説明 |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`:表示中のレイアウト。 |
| `addPanel(panel, placement?, size?)` | パネルをリージョン(`"center"`、デフォルト、`"left"`、`"right"`、`"bottom"`)の最初のタブグループに追加し、表示します。ドックがなければ作成され、幅は `size` です。エリアが保持しているパネルはそこへ移動します。 |
| `removePanel(panel)` | オプションにかかわらずパネルを削除します。 |
| `closePanel(panel)` | タブと同じ条件でパネルを閉じます。エリアがロックされている場合、パネルが閉じられない場合、または横に何もないグループの最後のパネルである場合は閉じません。 |
| `movePanel(panel, target)` | パネルを `target` に移動します:`{ group, side?, index?, activate?, size? }`、タブグループ `group`(位置は `index`)、またはその `side` 側の新しいグループ(`size` は新しい分割に沿ったポイント数)。 |
| `splitAt(group, panel, side)` | コンテナの一辺(`"left"`、`"right"`、`"top"`、`"bottom"`)に新しいタブグループとしてパネルを置きます。 |
| `selectPanel(panel)` | パネルをそのグループで表示します。 |
| `selectTab(group, index)` | グループのタブを表示します。 |
| `toggleDock(placement)`、`setDockOpen(placement, open)` | ドックを開く、または閉じる。 |
| `setDockSize(placement, size)` | ドックの端をまたぐ方向のサイズを設定します(最小 100)。 |
| `toggleZoom(group?)` | グループをズームインし、すでにズームされている場合はズームアウトします。`group` を指定しない場合は、ズームされているグループをズームアウトします。 |
| `zoomedGroup()` | `Promise<number \| null>`:ズームされているグループの id。 |
| `groupOf(panel)` | `Promise<number \| null>`:パネルを保持するタブグループの id。 |

Rust では、エリアの `component_ref::<DockArea>()` と `.component_ref(&r)` が ref を提供し、その `r.api::<DockAreaApi>()` が、スネークケースの同じメソッドを持ちます。

<a id="saving-and-restoring"></a>

## 保存と復元

報告されたレイアウトはプレーンなデータなので、保存は `JSON.stringify(layout)` して[ストレージ](../modules/nsh.md#storage)に書き込むことで、復元はパースした値を `layout` として渡すことで行えます。`onLayoutChange` はリサイズやタブ選択を含むすべての変更を報告するため、変更が落ち着いてからストレージに書き込んでください(報告のたびにリセットされる短いタイマーを使います)。

Rust では、`DockAreaLayout::to_state` と `from_state` が `DockAreaState` を読み書きします。これは `gpui-base` のドックも使うレイアウトのファイル形式です。

<a id="phones-and-narrow-windows"></a>

## スマートフォンと狭いウィンドウ

Dock は自身の幅に適応します。幅 600 ポイント以上のエリア(デスクトップのウィンドウ、Web、タブレット、全画面の iPad、開いた状態の折りたたみ端末)は、ワークスペース全体として表示され、タブレットのマルチペインアプリのように、分割、グループ、ドックが並んで表示されます。スマートフォンやタブレットで指を使う場合、タブのドラッグは iPadOS のドラッグ&ドロップと同様に長押しで始まるため、タブバーはスワイプでもスクロールでき、ハンドルは見た目はそのままでタッチ領域が広くなります。

幅 600 ポイント未満のエリア(スマートフォン、Slide Over の iPad、狭いデスクトップやブラウザのウィンドウ、または広いレイアウトの狭いカラム)では、iPad のスプリットビューがカラムを折りたたむように、また Material Design のサポートペインがボトムシートになるように、同じレイアウトを一画面向けに提示します。

- センターは一度に一つのグループを全サイズで表示します。タブバーにはセンターのすべての表示パネルが並び、別のグループのパネルを選択すると、そのグループが表示されます。
- 左右のドックは、その端からセンターの上に重なるドロワーとなり、幅はドックと同じです。下のドックは、高さがドックと同じシートです。アプリが表示を指示したときに(`toggleDock`、`setDockOpen`。もう一方は閉じられます)一つだけ表示され、スライドして出入りし、背景のバックドロップの押下、Escape、または戻る操作で閉じられます。コンパクトなプレゼンテーションに入った時点では、どれも表示されません。
- ドラッグされたタブ(指の場合は長押しの後、ポインターの場合はすぐに)は、タブバー内で移動して並べ替えられます。

どちらのプレゼンテーションでもすべてのパネルは配置されたままなので、切り替えても内容は保たれます。表示されているドロワーやシートはコンパクトなプレゼンテーション固有のものです。レイアウトの `open` はフルプレゼンテーションに属し、ドロワーの表示や非表示は `onLayoutChange` を報告しないため、再び広くなったエリアは、ドックを元のままの状態で表示します。`onDockOpenChange` は両方を報告します。フルプレゼンテーションでレイアウトの `open` が変わったドック、コンパクトで表示または閉じられたドロワーやシート、そしてプレゼンテーションの切り替え時に表示状態が変わった各ドックです。`renderDock` では、`open` が、そのドックが現在のプレゼンテーションで表示されているかどうかを表します。レイアウトも同じ値のままなので、600 ポイントをまたぐエリア(折りたたみ端末が開く、iPad が Split View に加わる、ウィンドウやカラムがリサイズされる)でも、すべてのパネルは元の位置に留まり、アプリが保存するレイアウトは一つで済みます。エリアの幅はレイアウトされた時点で決まり(それまではウィンドウの幅が代わりに使われます)、`compact` は幅の代わりにプレゼンテーションを選択します。ドロワー、シート、バックドロップはアプリがスタイルを指定するパーツ(`drawerClass`、`sheetClass`、`backdropClass`)で、エリアの他の部分と同様です。

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | なし | 表示するレイアウト(制御): `onLayoutChange` が報告した内容をそのまま渡します。 |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | 空のセンター | 最初のレイアウト。`layout` が設定されていない場合に使われ、以後はエリア自身が保持します。 |
| `locked` | `.locked(..)` | `boolean` | `false` | タブのドラッグ、ドロップ、クローズができません。 |
| `compact` | `.compact(..)` | `boolean` | 幅に応じる | スマートフォン向けの表示(`true`)またはフル表示(`false`)。指定しない場合、エリアの幅が 600 ポイント未満の間はコンパクト表示になります。 |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | 各パネルが許可する操作(キー別): `closable`、`zoomable`、`visible`。 |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | なし | パネルのコンテンツ(キー別)(`panel.id`)。 |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | キー | タブに表示する内容。 |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | なし | ドロップインジケーターの内部に表示する内容: `group`、`side`、`index`。 |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | なし | ドック自身のクローム(レイアウトより前): `placement`、`open`(現在の表示形式で表示)、`size`、`collapsible`。 |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | なし | 空のセンターに表示する内容。 |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | なし | タブのドラッグ中にポインターや指に追従するもの。 |
| `groupClass`、`groupStyle` | `.group_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各タブグループのフレーム。 |
| `tabBarClass`、`tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各タブバー(行用は `flex-row`)。 |
| `tabClass`、`tabStyle` | `.tab_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各タブ。表示中のタブ用は `selected:`。 |
| `contentClass`、`contentStyle` | `.content_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各グループのコンテンツフレーム。パネルが表示される場所です。 |
| `dropIndicatorClass`、`dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | ドロップインジケーター。 |
| `handleClass`、`handleStyle` | `.handle_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各ハンドルのインジケーター。分割のグループ間と各ドックの端にあります。`group-hover:` と `group-active:` はハンドルに追従します。ハンドルを横切る方向に 1 ポイントの幅を持ち、指定がなければ全長にわたって伸びるため、どちらの場合も `bg-border` はヘアラインになります。`w-[3px]` / `h-[3px]` で太くできます。 |
| `handleThumbClass`、`handleThumbStyle` | `.handle_thumb_class(..)`、`.handle_thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各ハンドルのサム: 線の中央に配置されるグリップで、縦線の場合と同じ向きで描画され、横線では 90 度回転するため、1 つのクラスで両方の軸に対応できます。ハンドルがホバー、押下、ドラッグされている間も同じビューのままなので、`group-hover:` と `group-active:` のクラスでトランジションさせます(`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`)。 |
| `dockClass`、`dockStyle` | `.dock_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | 各ドックのフレーム。 |
| `drawerClass`、`drawerStyle` | `.drawer_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | コンパクト表示: サイドドックのドロワー。 |
| `sheetClass`、`sheetStyle` | `.sheet_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | コンパクト表示: 下部ドックのシート。 |
| `backdropClass`、`backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | コンパクト表示: 開いているドロワーまたはシートの背後のバックドロップ。押すと閉じます。 |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | なし | スクリーンリーダーがすべてのハンドル(分割のグループ間と各ドックの端)に対して読み上げる内容。 |
| `ref` | `.component_ref(&r)`(`component_ref::<DockArea>()`) | `DockAreaRef` | | エリアの[メソッド](#methods)。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | エリア自体: 親の中でのサイズ(`flex-1`)と背景。境界内に収まり、コンテンツから最小サイズを取りません。 |

## Events

| イベント | Rust | 説明 |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | レイアウトが変更されました(ドラッグ、選択、リサイズ、ドックの開閉、メソッド): `{ layout }`、つまりすべての id を含む新しいレイアウト全体。 |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)`(`PanelActiveChange(panel, active)`) | `{ panel, active }`: パネルがグループの表示タブになった、または表示タブでなくなった(閉じたドックは何も表示しません)。変更ごとに 1 回だけ通知されます。離れるパネルには `false` は通知されず、`onPanelRemove` がその終わりを示します。 |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: パネルがエリアから完全に離れた(閉じられた、削除された、または新しいレイアウトに含まれていない)。移動するだけのパネルには通知されません。 |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | グループがズームインまたはズームアウトしました: `{ panel }`、表示中のパネル、または `null`。 |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)`(`DockOpenChange(placement, open)`) | `{ placement, open }`: ドックが表示または非表示になった。フル表示ではそのレイアウトの `open` が変わったとき、コンパクト表示ではドロワーまたはシートが表示または閉じられたとき、または表示形式が切り替わったとき。 |

## Parts

| パーツ | 配置先 | スタイル指定 | 状態 |
|---|---|---|---|
| エリア | | `class`、`style` | |
| タブグループ | リージョン | `groupClass`、`groupStyle` | |
| タブバー | グループ | `tabBarClass`、`tabBarStyle` | |
| タブ | タブバー | `tabClass`、`tabStyle`; `renderTab` | `selected:`、`active:`、`hover:` |
| グループのコンテンツ | グループ | `contentClass`、`contentStyle`; `renderPanel` | |
| ハンドルのインジケーター | 分割のグループ間、ドックの端 | `handleClass`、`handleStyle` | `group-hover:`、`group-active:` |
| ハンドルのサム | ハンドルの線の中央 | `handleThumbClass`、`handleThumbStyle` | `group-hover:`、`group-active:`(ドラッグが終わるまで押下状態) |
| ドック | 端 | `dockClass`、`dockStyle`; `renderDock` | |
| ドロップインジケーター | ドラッグ中のグループの上 | `dropIndicatorClass`、`dropIndicatorStyle`; `renderDropIndicator` | |
| ドラッグプレビュー | ポインターや指の下 | `renderDragPreview` | |
| 空のセンター | センター | `renderEmpty` | |
| ドロワー、シート、バックドロップ | コンパクト表示でのセンターの上 | `drawerClass`、`sheetClass`、`backdropClass`(およびそれらのスタイル) | |

## Accessibility

- 各タブは、スクリーンリーダーに対して選択状態を持つタブとして扱われ、[`Tab`](./tabs.md) と同様です。アクティブにするとそのタブが選択されます。ラベルは `renderTab` が描画するテキストです。
- すべてのハンドル(分割のグループ間と各ドックの端)は、`handleAccessibilityLabel` というラベルが付いた調整可能な要素です。分割のグループ間のハンドルは [Resizable](./resizable.md) のものであり、スクリーンリーダーは一度に 10 ポイントずつ動かし、`onLayoutChange` で値を報告します。
- コンパクト表示では、Escape と戻る操作で、表示中のドロワーまたはシートが閉じます。

ラベル、ロール、アナウンス全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

## Platform notes

- ポインター(マウス、トラックパッド、画面上でホバーするペン)は、ボタンを押したまま 4 ポイント動かすとタブをドラッグします。これはどのプラットフォームでも同じです。トラックパッド付きの iPad や、マウスのドラッグで操作する幅の狭いブラウザウィンドウも、デスクトップと同様に動作します。macOS、Windows、Linux、GPUI では、タッチスクリーン搭載ノートパソコン上の指を含め、すべての押下がポインターのものとして扱われます。
- iOS、iPadOS、Android では、指で長押ししてからタブをドラッグします。これは iPadOS のドラッグ&ドロップと同じで、タブバー上のスワイプはスクロールになります。
- デスクトップとウェブ: ハンドルには、その軸に応じたリサイズカーソルが表示されます。
- スマートフォンや幅の狭いエリア: ドロワーと下部シートを備えたコンパクト表示になります。
- どのプラットフォームでも、アプリがスタイルを指定したものが描画されます: タブ、タブバー、ハンドル、ドロップインジケーター、ドック、ドロワー、シート。
