---
title: "Menu"
description: "MenuItem、MenuSeparator、Submenu を備えた Menu と ContextMenu。デスクトップではカスケード式のサブメニューを持つポップアップとして、スマートフォンではサブメニューをその場で展開するシートとして表示され、アプリ側でスタイルを設定できます。"
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

メニューは、トリガーが開くアクションの一覧です。1つの構造であらゆるデバイスに対応し、それぞれのデバイスが期待する形で表示されます。

- デスクトップとデスクトップブラウザでは、トリガーの位置にポップアップとして表示されます。`Submenu` は、ポインターが項目の上に来るか項目を押すと、その項目の横にカスケード表示されます。
- スマートフォンとタブレットでは、バックドロップの上、画面下部にシートとして表示されます。`Submenu` は、メニュー自身の項目の代わりに自身の項目をシート内に表示し、先頭には元の階層へ戻るための行(あなたが用意するもの)が置かれます。

項目の選択、外側の押下、Escape、Android の戻るボタン、VoiceOver のエスケープジェスチャーのいずれでも閉じます。`ContextMenu` は同じメニューを、セカンダリボタン(右クリック)でポインターの位置に、またはタッチスクリーンではトリガーを指で長押しして開くものです。

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

5つすべて [`nsh/base`](../modules/nsh-base.md) から提供されます。項目は自動的にメニューへ届くので、自由に配置できます。ビューによるグループ化、ラベル、`If` で現れたり消えたりする項目などです。`popupClass` はデスクトップではポップアップを、スマートフォンではシートをスタイリングします。両者で異なるスタイルにしたい場合は、`platform.idiom`(`nsh`)を `"desktop"` と比較できます。

<a id="menu-bars"></a>

## メニューバー

トリガーが1つの `Toolbar` の項目であるメニューは、メニューバーを構成します。いずれかのメニューが開いている間は、別のメニューのトリガー上にポインターを置くとそのメニューが代わりに開き、矢印キーでトリガー間を移動できます。

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## コンテキストメニュー

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

デスクトップでは、セカンダリボタンでポインターの位置に開きます。タッチスクリーンでは、トリガーを指で長押しするとシートとして開きます。トリガー自身の押下や周囲のスクロールビューは引き続き動作し、指を動かすと長押しはキャンセルされます。

<a id="checkable-items"></a>

## チェック可能な項目

`checked` を指定すると、項目がチェック可能になります。メニューが示す設定(「サイドバーを表示」)や、`role="menuitemradio"` を併用したグループ内の1つの選択肢(「並べ替え」)に使います。値はあなたが管理します。項目を選択すると `onSelect` が呼ばれ、あなたが次の値を設定すると、項目がそれを表示します。チェックされている間は、項目の `checked:` クラスと `checkedStyle` が適用され、インジケーターのものも同様に適用されます。インジケーターとは内容の前に置かれる部分(`indicatorClass`、`indicatorStyle`)で、あなたが指定するマーク(`indicator`)を囲みます。マークは一度だけ作られて保持されます。マークの表示と非表示は、インジケーターの `checked:` クラスで切り替えるか、`indicatorClass` 内の `group` とマーク自身の `group-checked:` クラスで切り替えます。`closeOnSelect={false}` を指定するとメニューが開いたままになるため、設定の新しい値がすぐに表示されます。

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

末尾側のマークは、代わりに内容の中に置き、項目の `group` の下で `group-checked:` クラスを使ってスタイリングします。

<a id="entrance-and-exit"></a>

## 表示と終了のトランジション

デスクトップでは、ポップアップは [Popover](./popover.md#entrance-and-exit) と同様に、あなたのトランジションに合わせて現れたり消えたりします。`popupStartingClass` は最初のフレームでの見た目、`popupEndingClass` は閉じた後の見た目で、`popupClass` の `transition-*` クラスが実行されている間はこの見た目が保たれ、その後に `onClose` が続きます。サブメニューも同じ見た目を受け取り、親のメニューとともに閉じます。スマートフォンのシートは、独自にスライドして出入りします。

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

<a id="open-state"></a>

## 開閉状態

`open` がない場合、メニューは自身の状態を保持します(`Menu` 向けの `defaultOpen` から)。`open` がある場合は、アプリが状態を所有し、`onOpenChange({ open, reason })` で変更します。対象は `"triggerPress"`、`"select"`、`"pressOutside"`、`"backdropPress"`、`"cancel"`、`"contextMenu"`、`"longPress"` です。

## Props

<a id="menu-1"></a>

### Menu

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | なし | 開いているかどうか。アプリが制御します。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` を使わない場合に、最初から開いているかどうか。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | デスクトップ: トリガーのどちら側に配置するか。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | デスクトップ: トリガーとの位置合わせの方法。 |
| `offset` | `.offset(..)` | `number` | `0` | デスクトップ: トリガーとポップアップの間隔。 |
| `margin` | `.margin(..)` | `number` | `0` | デスクトップ: セーフエリアの端から保つ距離。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | ポップアップ(デスクトップ)またはシート(スマートフォン)、およびサブメニューのポップアップ。 |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | デスクトップ: ポップアップの最初のフレームでの見た目。ポップアップ自身のスタイルに重ねて適用されます。 |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | デスクトップ: ポップアップが閉じた後の見た目。トランジションの実行中は保たれます。 |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | スマートフォン: シートの背後のバックドロップ。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | なし | 押されたときにメニューを開く要素。メニューが開いている間は、その `aria-expanded:` クラスと `expandedStyle` が適用されます。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 項目。メニューが開くたびに作られます。 |

### ContextMenu

`open`、`popupClass` / `popupStyle`、開始時と終了時の見た目、`backdropClass` / `backdropStyle`、`trigger`、`children` は `Menu` と同じで、さらに次があります。

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | セカンダリボタンや長押しの指に反応しません。 |
| `offset` | `.offset(..)` | `number` | `0` | デスクトップ: ポインターとポップアップの間隔。 |
| `margin` | `.margin(..)` | `number` | `0` | デスクトップ: セーフエリアの端から保つ距離。 |

### MenuItem

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 選択できません。`disabled:` のスタイルが適用されます。 |
| `checked` | `.checked(..)` | `boolean` | なし | チェックされているかどうか。指定すると項目がチェック可能になります。アプリが管理します。 |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | なし | チェックされている間のスタイル。`checked:` クラスとして指定します。 |
| `role` | `.role(..)` | `AccessibilityRole` | `checked` がある場合は `"menuitemcheckbox"`、それ以外は `"menuitem"` | スクリーンリーダーに対する項目の役割。グループ内の1つの選択肢には `"menuitemradio"` を指定します。 |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | インジケーター(内容の前の部分)。その `checked:` クラスと `disabled:` クラスは項目に従います。 |
| `indicator` | `.indicator(..)` | `JSX.Element` | なし | インジケーター内のマーク。 |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | 選択するとメニューが閉じます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | 内容だけでは足りない場合に、スクリーンリーダーが読み上げる内容。 |
| `children`, `class`, `style` | `.child(..)`, スタイルメソッド | | なし | 項目の内容と見た目。`hover:`、`active:`、`checked:` の各状態を持ちます。 |

### Submenu

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | なし | サブメニューを開く項目。 |
| `back` | `.back(..)` | `JSX.Element` | なし | スマートフォン: 項目の上に置かれ、周囲の項目へ戻るための行。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 開きません。 |
| `offset` | `.offset(..)` | `number` | `0` | デスクトップ: 周囲のメニューとサブメニューのポップアップの間隔。 |
| `children` | `.child(..)` | `JSX.Element` | なし | サブメニューの項目。 |

`MenuSeparator` はスタイリングできるビュー(`class`、`style`)で、同じ階層の項目とともに表示されます。

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onOpenChange`(`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | 開閉されたときに、その理由とともに呼ばれます。 |
| `onOpen`(`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | 表示されたとき。シートの場合は、表示のアニメーションが終わったとき。 |
| `onClose`(`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | 消えたとき。シートの場合は消えた後、ポップアップの場合は終了トランジションの後。アプリが閉じた場合にも呼ばれます。 |
| `onPosition`(`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | デスクトップ: ポップアップが配置されたとき。`placement`(配置された側)、`bounds`、`available`。 |
| `onCancel`(`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | ユーザーが項目を選ばずに閉じようとしたとき(Escape または戻る操作、外側やバックドロップの押下)。 |
| `onSelect`(`MenuItem`) | `.on_select(\|\| ..)` | 項目が選択されたとき。チェック可能な項目では、もう一方の値が渡されます。 |

<a id="accessibility"></a>

## アクセシビリティ

スクリーンリーダーに対して、ポップアップまたはシートはメニュー、その項目はメニュー項目として扱われます。トリガーは、メニューが展開されているかどうかを伝えます。チェック可能な項目はチェックボックスまたはラジオのメニュー項目となり、チェック済みか未チェックかが読み上げられ、そのインジケーターは項目の一部です。TSX では、トリガーはあなたが渡す要素(`Button` またはあなた自身のビュー)です。押下と展開状態はトリガー自身が受け取るため、トリガー自身の `active:` クラスと `activeStyle` は押されている間に適用され、トリガー自身の `onPress` も実行されます。画面上にあるのは表示中の階層の項目だけなので、スクリーンリーダーはそこにあるものを読み上げます。
