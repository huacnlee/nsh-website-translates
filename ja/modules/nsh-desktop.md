---
title: "nsh/desktop"
description: "デスクトップ専用の API:ウィンドウ(タイトル、タイトルバー、最大化、フルスクリーン)、ドラッグ可能な領域を備えたアプリ独自のタイトルバー、アプリケーションメニュー、コンテキストメニュー、キーボードショートカット。"
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` には、デスクトップにしかないもの、つまりウィンドウとそのタイトルバー、アプリケーションメニュー、コンテキストメニューが含まれます。macOS、Windows、Linux で動作します。Rust コードでは、同じものが `nsh_core::element::desktop` にあります。ウィンドウの関数(`set_title`、`set_title_bar`、`title_bar`、`minimize`、…、`close_window`)、アプリケーションメニューとコンテキストメニュー(`set_application_menu`、`popup_menu`。`MenuItem` で構成されます)があり、ドラッグ可能なビューには `.window_drag(true)` でマークを付けます。TSX では `nsh/desktop` をインポートします。このモジュールはすべてのプラットフォームでインポートできるため、1つのバンドルがどこでも動作します。iOS と Android ではその関数は何もせず、`isAvailable` でウィンドウとメニューが利用できるかどうかを確認できます。

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

このモジュールのウィンドウおよびメニュー API が動作する macOS、Windows、Linux では `true`、それ以外では `false` です。Rust: `os().is_desktop()`。

[`platform.desktop`](./nsh.md#platform) は、デスクトップの挙動(`desktop={{…}}` props、`platform.select({ desktop })`)に対するより広いチェックです。ブラウザー自身のウィンドウで動作する、デスクトップのイディオムのブラウザーでも同様に成り立ちます。デスクトップ向けのレイアウト、密度、入力は `platform.desktop` で切り替え、`Window` と `Menu` の呼び出しは `isAvailable` で切り替えてください。

<a id="window"></a>

## ウィンドウ

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

Rust 列は `nsh_core::element::desktop` の関数名を示します。

| メンバー | Rust | 説明 |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | ウィンドウのタイトル。タイトルバー、タスクバーまたは Dock、ウィンドウスイッチャーに表示されます。 |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` はシステムのタイトルバーを取り除きます。アプリはウィンドウの上端まで描画領域を使い、独自のタイトルバーを描画します。システムのウィンドウコントロールは残ります(macOS のトラフィックライト、Windows の最小化/最大化/閉じるボタン、GTK のウィンドウボタン)。`height` は独自のバーの高さ(ポイント単位)で、コントロールはその中で中央に配置されます(Windows のキャプションボタンはその高さいっぱいに表示されます。macOS では `height` が 44 ポイントまでコンパクトなクロム、それより大きい場合は通常のクロムを選択します。バーのサイズは `titleBar().height` の実際の高さを使って決めてください。ライブリサイズ中は AppKit がトラフィックライトを配置します。組み込み先アプリの既存のツールバーは、独自のスタイルと高さを保ちます)。指定しない場合、コントロールはプラットフォームの高さになります。`style: "default"` はシステムのタイトルバーを元に戻します(Rust: `set_title_bar(TitleBarStyle::Default, None)`)。 |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | GPUI アプリの Windows と Linux では、ウィンドウがアプリケーションメニューをアプリ上部のバーとして描画します。`"shown"`(デフォルト)は常に表示します。`"autoHide"` は Alt を単独で押して離したときに表示し、再び Alt を単独で押すと隠れるまで表示を続けます。これは Windows や GNOME のアプリと同じ動作です。F10 と、Alt にメニューの頭文字を組み合わせたキーは、どちらのモードでもメニューを開き、メニューが開いている間はバーが表示されます。macOS のメニューバーはシステムのものです。 |
| `minimize()` | `minimize()` | ウィンドウを最小化します。 |
| `toggleMaximize()` | `toggle_maximize()` | ウィンドウを最大化します。すでに最大化されている場合は元のサイズに戻します。 |
| `toggleFullScreen()` | `toggle_full_screen()` | フルスクリーンに入る、または解除します。 |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | ウィンドウをポイント単位で移動・リサイズします。省略したフィールドは現在の値を保ちます。macOS と Windows では、`size`(`width`、`height`)にウィンドウの装飾が含まれます。Linux では GTK のデフォルトのウィンドウサイズを設定します。`origin`(`x`、`y`)はウィンドウの左上隅で、プライマリスクリーン(macOS ではメニューバーのあるスクリーン)の左上を基準に測り、`y` は下方向に増加します。これはすべてのプラットフォームで共通です。`height` だけで `y` がない場合は上端の位置を保つため、ウィンドウは下端側で拡大・縮小します。`animated: true` は macOS のリサイズアニメーションを有効にします(デフォルト: false)。 |
| `setLevel(level)` | `set_level(level)` | macOS と Windows では、`"floating"` はウィンドウを通常のウィンドウより前面に保ち、`"normal"` は通常のレベルに戻します。`"desktopIcon"` は macOS ではデスクトップアイコンのレベルを選択します(ウィンドウはすべてのスペースにも表示され、Mission Control と Cmd+` の対象外になります)。Windows では、現在の z オーダーの最背面にウィンドウを移動しますが、その後のアクティベーションで前面に出ることがあります。 |
| `orderFront()` | `order_front()` | ウィンドウを自分のレベルの最前面に出してフォーカスします(アプリがアクティブになります。macOS では最小化を解除し、Windows では最小化されたウィンドウを復元してフォアグラウンドに設定し、GTK では present します)。ウィンドウのレベルは変わりません。macOS では、デスクトップレベルのサーフェスは他のウィンドウの背面に残ります。GPUI は自身のウィンドウをアクティブにします。Linux ではフォアグラウンド要求をウィンドウマネージャーが制御します。 |
| `close()` | `close_window()` | ウィンドウを閉じます。アプリもそれと一緒に終了します。 |

ウィンドウのサイズ変更は macOS、Windows、Linux でサポートされ、位置指定とレベルは macOS と Windows でサポートされます。Linux では配置と重なり順をウィンドウマネージャーが制御します。GPUI アプリでは、`setFrame` はウィンドウのサイズを設定し、位置はプラットフォームが決めます。GPUI のホストは、ウィンドウを開く際にその位置とレベルを選びます。

`onLayout` で測定したコンテンツからウィンドウのサイズを決める場合は、macOS と Windows ではウィンドウの装飾分の余裕を見込んでください。`width` と `height` は正の有限数を受け付け、`x` と `y` は有限数を受け付けます。無効なフィールドは以前の値のままになります。

<a id="a-title-bar-of-your-own"></a>

## 独自のタイトルバー

タイトルバーを非表示にすると、アプリは独自のバーを描画し、そのどの部分でウィンドウを動かせるかを、Rust では `.window_drag(true)`、TSX では `desktop={{ windowDrag: true }}` で指定します。

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

`windowDrag` を持つビューを押すと、システムのタイトルバーと同じようにウィンドウをドラッグできます。ダブルクリックするとウィンドウが最大化され(またはユーザーの設定に従います。macOS では「ウィンドウのタイトルバーをダブルクリックして」の設定)、Windows と Linux では右クリックでウィンドウメニューが開きます。

- `windowDrag` を設定している最も近いビューが優先されます。`.window_drag(false)`(`desktop={{ windowDrag: false }}`)を使うと、ドラッグ可能なビューの一部をクリック可能なままにできます。
- ドラッグ可能なビューの内側にあるテキストフィールドや、プレスまたはタッチのハンドラー(`onPress`、`onTouch*`、レスポンダー)を持つビューは、それを指定しなくてもクリック可能なままです。上の例の検索フィールドやボタンは通常どおり動作します。
- `windowDrag` はシステムのタイトルバーでも動作します。サイドバーやツールバーでもウィンドウを動かせます。

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

非表示にしたタイトルバーの領域(ポイント単位、リアクティブ)です。その `height` と、システムのウィンドウコントロールが `left` 側と `right` 側の端で占める幅を表します。コントロールの下に何も入り込まないよう、これを使ってバーをレイアウトしてください。システムがタイトルバーを表示している間(およびフルスクリーン時、デスクトップ以外)は、3つの値はすべて 0 です。Rust: `title_bar() -> Edges<Points>`。`top` が高さ、`left` と `right` がコントロールの幅で、読み取ると変更を購読します。

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`。未指定の場合はタイトルバーの高さ(macOS のバージョンにより 28 または 32) | トラフィックライトの幅 | 0 |
| Windows | `height`。未指定の場合は 32 | 0 | 3つのキャプションボタン(138) |
| Linux | `height`。未指定の場合はヘッダーバーの高さ | 先頭側のウィンドウボタン(デスクトップのボタンレイアウトによる) | 末尾側のウィンドウボタン |

Windows では、キャプションボタンは NSH が Windows 11 のスタイルで描画し、アプリの外観に従います。最大化ボタンにカーソルを合わせると、Windows 11 のスナップレイアウトが表示されます。ウィンドウは、どのプラットフォームでもリサイズ用の枠、影、角丸を保ちます。

<a id="menu"></a>

## メニュー

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| メンバー | 説明 |
|---|---|
| `setApplicationMenu(items)` | アプリケーションメニューを設定します。トップレベルの項目ごとに1つのサブメニューを指定します(`File`、`Edit`、...)。macOS ではメニューバーになり、最初のメニューがアプリメニューです(AppKit がアプリ名をタイトルにします)。Windows と Linux ではウィンドウのメニューバーになりますが、タイトルバーを非表示にしている間は表示されません。ショートカットは引き続き動作し、アプリ独自のタイトルバーからは `Menu.popup` でそのメニューを開けます。`null` はプラットフォームのデフォルトメニューに戻します。 |
| `popup(items, at?)` | 左上隅を `at`(ウィンドウ座標、ポイント単位。`onContextMenu` の `e.pagePosition`)に置いてコンテキストメニューを表示します。指定しない場合はポインターの位置に表示します。項目が選ばれたかどうかにかかわらず、メニューが閉じると Promise が解決されます。メニューを開いたボタンは、それまで押された状態のままにできます。 |

Rust では、`set_application_menu(items)` は `Vec<MenuItem>` を受け取ります(`None` でプラットフォームのデフォルトメニューに戻ります)。`popup_menu(items)`(ポインター位置に表示)と `popup_menu_at(items, at)` は、メニューが閉じたときに完了する `Answer<()>` を返します(await は任意です)。項目のハンドラーは、メニューを設定したオーナーのもとで、そのオーナーが存続している間実行されます。

メニューを変更するには、`setApplicationMenu` をもう一度呼び出します。`effect` の内側では、読み取ったシグナルに追従するため、アプリの状態に依存するチェックマークや無効状態は常に最新になります。

<a id="menu-items"></a>

### メニュー項目

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| フィールド | 説明 |
|---|---|
| `label` | 項目に表示される内容。ロールの項目は、これを指定しない場合、独自のラベルを持ちます。 |
| `onSelect` | クリックまたはショートカットで項目が選ばれたときに呼び出されます。 |
| `shortcut` | キーボードショートカット。修飾キーと1つのキーを `+` でつなぎます(`"mod+n"`、`"mod+shift+z"`、`"alt+f4"`、`"f11"` など)。修飾キーは下の表のとおりです。キーは文字、数字、記号で、Shift を押さずに US キーボードでそのキーが入力する文字として書くか(`,`、`/`。`?` には `"shift+/"`)、名前で指定します。名前: `plus`(`=` / `+` キー、`=` も可)、`minus`(`-` も可)、`space`、`enter`(`return`)、`escape`(`esc`)、`tab`、`backspace`、`delete`(`del`)、`insert`、矢印キー `up`、`down`、`left`、`right`(`arrowup`、…)、`home`、`end`、`pageup`、`pagedown`、`f1`–`f24`。大文字と小文字は区別されず(`"Mod+Shift+N"` は `"mod+shift+n"` と同じです。大文字は同じキーであり、Shift ではありません)、小文字での記述を推奨します。無効なショートカット(`"mod-n"`、`"mod++"`、`"mod+?"`)はエラーをスローし、正しい綴りが示されます。`keymap` も同じキーストロークを受け付けます。メニューにはプラットフォーム固有のスタイルで表示されます(macOS では `⇧⌘N`、Windows では `Ctrl+Shift+N`)。 |
| `when` | GPUI バックエンドで、テキストフィールドがキーボードフォーカスを持っているときにショートカットで項目を選択するかどうか: `"always"`(デフォルト)、`"auto"`(フィールドがそのキー自体を使う場合を除きます。文字入力、キャレット移動、削除のキーと編集ショートカットが該当し、[`keymap`](./nsh.md#keymap) のバインディングと同様です)、または `"notEditing"`。項目が選択しなかったキーはフィールドに渡されます。 |
| `disabled` | `true` で項目をグレーアウトします(デフォルトは `false`)。 |
| `checked` | チェックマーク付きの項目に設定します(`true` または `false`)。 |
| `submenu` | 項目をサブメニューにします(`label` が必要です)。 |
| `role` | プラットフォームが実行する標準項目(後述)。 |

`null`、`undefined`、`false` の項目は除外されるため、リスト内で `cond && { … }` を使えます。

Rust では、項目は `MenuItem::new(label)`、`MenuItem::role(role)`、`MenuItem::separator()`、`MenuItem::submenu(label, items)` のいずれかで、各フィールドはメソッドになります。`.shortcut("mod+n")`(無効なショートカットではパニックし、正しい綴りが示されます)、`.shortcut_when(When::Auto)`、`.disabled(true)`、`.checked(on)`、`.on_select(f)`、そしてロールの項目用の `.label(..)` です。

修飾キー:

| 修飾キー | macOS | Windows | Linux |
|---|---|---|---|
| `mod`(別名 `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd`(別名 `command`、`meta`、`super`、`win`) | Command (⌘) | Windows キー | Super |
| `ctrl`(別名 `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt`(別名 `option`、`opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

アプリ独自のショートカットには `mod` を使ってください。各プラットフォームのアプリがそのために使うキー(macOS では ⌘N、Windows と Linux では Ctrl+N)なので、1つの記述がどこでも通用します。Windows キーと Super はほとんどがシステムに割り当てられている(Win+E、GNOME のアクティビティ概要)ため、`cmd` は macOS 以外ではほとんど適しません。

ロール:

| ロール | 動作 | プラットフォーム |
|---|---|---|
| `about`、`hide`、`hideOthers`、`showAll` | アプリメニューの標準項目 | macOS(それ以外では除外) |
| `quit` | アプリを終了する | すべて |
| `undo`、`redo`、`cut`、`copy`、`paste`、`selectAll` | フォーカス中のテキストフィールドを編集する(フィールド自身のショートカットはそのまま) | すべて |
| `minimize`、`zoom`、`toggleFullScreen`、`close` | ウィンドウ | すべて |

ロールの項目は、独自に設定しない限り、プラットフォームのラベルとショートカットを持ちます(macOS では `about`、`hide`、`quit` にアプリ名が加わります)。

ネイティブアプリと同様に、メニューのショートカットが最優先されます。項目が使うキーは、フォーカス中のテキストフィールドにも NSH 独自のキーにも届きません。それらより先に処理されるのは、同じキーストロークの [`keymap`](./nsh.md#keymap) のバインディングだけです。したがって、編集ショートカット(`mod+c`、`mod+v`、`mod+x`、`mod+a`、`mod+z`)は、テキストフィールドに渡す編集ロールにのみ割り当て、修飾キーなしのキー(`escape`、矢印キー、文字)は避けてください。これらはテキストフィールドや戻るナビゲーションから奪ってしまいます。GPUI バックエンドでは、`when: "auto"` により項目とテキストフィールドでキーを共有できます。`delete` または `mod+z` は、フィールドにフォーカスがない間は項目を選択し、ある間はテキストを編集します。

GPUI バックエンドでは、キーボードフォーカスを持つネイティブコンポーネントが各キーを最初に受け取ります。コンポーネント自身が処理したキーは、キーマップにもメニューにも届きません。通過させたキーは、テキストフィールドにフォーカスがあるかのようにキーマップに届き、その後メニューに届きます。

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

ボタンの押下から開くコンテキストメニュー:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> メニューはシステムのものです(NSMenu、Win32 メニュー、GTK ポップオーバーメニュー)。他のアプリのメニューと同じ見た目と動作になり、システム(またはアプリ)の外観に従い、キーボードでも操作できます。`examples/desktop` は、独自のタイトルバー、アプリケーションメニュー、コンテキストメニューを備えたアプリです。
