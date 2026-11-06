---
title: "選單"
description: "Menu 和 ContextMenu 配合 MenuItem、MenuSeparator 及 Submenu 使用:在桌面平台上以彈出視窗顯示並支援層疊子選單,在手機上則以面板形式顯示並在原位展開子選單,外觀可由應用程式自行設定樣式。"
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---


# 選單

選單是由觸發元件開啟的一列動作。同一個結構適用於所有裝置，並按各裝置的慣例呈現：

- 在桌面平台和桌面瀏覽器上，於觸發元件旁彈出視窗；`Submenu` 會在指標移到其項目上或按下時，於該項目旁邊層疊展開。
- 在手機和平板電腦上，於螢幕底部、背景遮罩之上顯示面板；`Submenu` 會在面板內取代選單本身的項目來顯示其項目，並附有一列由你提供的項目用來返回。

選擇項目、在選單外按一下、Escape、Android 返回按鈕和 VoiceOver 的退出手勢都會關閉選單。`ContextMenu` 是同一個選單，由次要按鈕（右鍵）在指標位置開啟，或在觸控螢幕上以手指按住其觸發元件開啟。

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

這五個全部來自 [`nsh/base`](../modules/nsh-base.md)。項目會自行傳到所屬選單，所以你可以自由排列：以 view 分組、標籤、以 `If` 出現或消失的項目。`popupClass` 為桌面平台上的彈出視窗和手機上的面板設定樣式；若兩者的樣式不同，可以用 `platform.idiom`（`nsh`）與 `"desktop"` 比較。

<a id="menu-bars"></a>

## 選單列

由同一個 `Toolbar` 的項目作為觸發元件的選單會組成選單列：其中一個選單開啟時，指標移到另一個選單的觸發元件上，便會改為開啟該選單，方向鍵則可在各觸發元件之間移動。

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## 情境選單

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

在桌面平台上，次要按鈕會在指標所在位置開啟選單。在觸控螢幕上，以手指按住觸發元件會以面板形式開啟；觸發元件本身的按壓操作和周圍的捲動視圖仍然有效，而移動手指則會取消按住。

<a id="checkable-items"></a>

## 可勾選項目

`checked` 令項目可被勾選：可以是選單顯示的設定（"Show sidebar"），或配合 `role="menuitemradio"` 成為一組中的單一選項（"Sort by"）。值由你管理：選擇項目時會呼叫 `onSelect`，由你設定下一個值，項目便會顯示該值。勾選時，其 `checked:` classes 和 `checkedStyle` 會生效，其指示器的亦然：指示器是內容之前的部分（`indicatorClass`、`indicatorStyle`），圍繞著你提供的標記（`indicator`）。標記只建立一次並保留；可用指示器的 `checked:` classes 來顯示和隱藏它，或使用標記自己的 `group-checked:` classes 配合 `indicatorClass` 中的 `group`。`closeOnSelect={false}` 會保持選單開啟，讓設定即時顯示新值。

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

位於尾端的標記則改放在內容中，並以項目上 `group` 下的 `group-checked:` classes 設定樣式。

<a id="entrance-and-exit"></a>

## 進場與離場

在桌面平台上，彈出視窗隨你的 transition 出現和消失，與 [Popover](./popover.md#entrance-and-exit) 相同：`popupStartingClass` 是它第一個影格的外觀，`popupEndingClass` 是關閉後的外觀，在 `popupClass` 的 `transition-*` classes 執行期間會一直保持，之後是 `onClose`。子選單採用相同的外觀，並隨所屬選單關閉。手機的面板會自行滑入和滑出。

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

## 開啟狀態

沒有 `open` 時，選單自行保持狀態（由 `defaultOpen` 起始，對應 `Menu`）。有 `open` 時，狀態由應用程式擁有，並在 `onOpenChange({ open, reason })` 中更改：`"triggerPress"`、`"select"`、`"pressOutside"`、`"backdropPress"`、`"cancel"`、`"contextMenu"` 或 `"longPress"`。

## Props

### Menu

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 開啟狀態，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 初始為開啟，適用於沒有 `open` 的情況。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 桌面平台：放在觸發元件的哪一邊。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | 桌面平台：與觸發元件的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面平台：觸發元件與彈出視窗之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 桌面平台：與安全區域邊緣保持的距離。 |
| `popupClass`、`popupStyle` | `.popup_class(..)`、`.popup_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 彈出視窗（桌面平台）或面板（手機），以及子選單的彈出視窗。 |
| `popupStartingClass`、`popupStartingStyle` | `.popup_starting_class(..)`、`.popup_starting_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 桌面平台：彈出視窗在第一個影格的外觀，疊加於它們本身的外觀之上。 |
| `popupEndingClass`、`popupEndingStyle` | `.popup_ending_class(..)`、`.popup_ending_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 桌面平台：彈出視窗關閉後的外觀，在其 transition 執行期間保持。 |
| `backdropClass`、`backdropStyle` | `.backdrop_class(..)`、`.backdrop_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 手機：面板後方的背景遮罩。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 按下時開啟選單的元件。選單開啟期間，其 `aria-expanded:` classes 和 `expandedStyle` 會生效。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目，每次開啟時建立。 |

### ContextMenu

`open`、`popupClass` / `popupStyle`、起始和結束外觀、`backdropClass` / `backdropStyle`、`trigger` 和 `children` 與 `Menu` 相同，另有：

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 次要按鈕和按住的手指均不起作用。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面平台：指標與彈出視窗之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 桌面平台：與安全區域邊緣保持的距離。 |

### MenuItem

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不可選擇；套用 `disabled:` 樣式。 |
| `checked` | `.checked(..)` | `boolean` | 無 | 是否已勾選，令它成為可勾選項目；由應用程式擁有。 |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | 無 | 勾選時的樣式，以 `checked:` classes 設定。 |
| `role` | `.role(..)` | `AccessibilityRole` | 有 `checked` 時為 `"menuitemcheckbox"`，否則為 `"menuitem"` | 螢幕閱讀器如何理解它；`"menuitemradio"` 用於一組中的單一選項。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_class(..)`、`.indicator_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 指示器，即內容之前的部分；其 `checked:` 和 `disabled:` classes 跟隨項目。 |
| `indicator` | `.indicator(..)` | `JSX.Element` | 無 | 指示器內的標記。 |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | 選擇它會關閉選單。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 內容不足時，螢幕閱讀器所讀出的內容。 |
| `children`、`class`、`style` | `.child(..)`、樣式方法 | | 無 | 內容和外觀，附有 `hover:`、`active:` 和 `checked:` 狀態。 |

### Submenu

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 開啟它的項目。 |
| `back` | `.back(..)` | `JSX.Element` | 無 | 手機：位於其項目上方、用來返回上一層項目的一列。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不會開啟。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面平台：所屬選單與其彈出視窗之間的間距。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 它的項目。 |

`MenuSeparator` 是你可設定樣式的 view（`class`、`style`），與所屬層級的項目一同顯示。

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange`（`Menu`、`ContextMenu`） | `.on_open_change(\|e\| ..)` | 已開啟或關閉，並附上原因。 |
| `onOpen`（`Menu`、`ContextMenu`） | `.on_open(\|\| ..)` | 已顯示；作為面板時，在滑入完成後觸發。 |
| `onClose`（`Menu`、`ContextMenu`） | `.on_close(\|\| ..)` | 已消失：作為面板時在滑出之後，作為彈出視窗時在其離場之後。應用程式將其關閉時亦會觸發。 |
| `onPosition`（`Menu`、`ContextMenu`） | `.on_position(\|e\| ..)` | 桌面平台：彈出視窗已定位：`placement`（所放置的一邊）、`bounds`、`available`。 |
| `onCancel`（`Menu`、`ContextMenu`） | `.on_cancel(\|\| ..)` | 使用者嘗試不作選擇而關閉（Escape 或返回、在選單外或背景遮罩上按下）。 |
| `onSelect`（`MenuItem`） | `.on_select(\|\| ..)` | 項目已被選擇；可勾選項目會要求取得其另一個值。 |

<a id="accessibility"></a>

## 無障礙

對螢幕閱讀器而言，彈出視窗或面板是選單，其項目是選單項目；觸發元件會表明選單是否已展開。可勾選項目是核取方塊或選項按鈕選單項目，會讀作已勾選或未勾選；其指示器是項目的一部分。在 TSX 中，觸發元件是你傳入的元素，即 `Button` 或你自己的 view：它會自行接收按壓和展開狀態，所以按下時，其自身的 `active:` classes 和 `activeStyle` 會顯示，其自身的 `onPress` 也會執行。畫面上只有當前所顯示層級的項目，所以螢幕閱讀器會讀出目前存在的內容。
