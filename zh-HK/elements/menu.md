---
title: "選單"
description: "Menu 與 ContextMenu，搭配 MenuItem、MenuSeparator 和 Submenu：在桌面平台上為具有串接子選單的彈出式選單，在手機上則為子選單就地展開的面板，並可由應用程式自訂樣式。"
group: base
demo: el-menu
---

# Menu

選單是由觸發元件開啟的動作清單。同一個結構適用於所有裝置，並依各裝置的慣例呈現：

- 在桌面平台與桌面瀏覽器上，於觸發元件處顯示彈出視窗；`Submenu` 會在指標移到或按下其項目時，於該項目旁展開。
- 在手機與平板上，於螢幕底部顯示覆蓋在背景遮罩上的面板（sheet）；`Submenu` 會在面板中以自己的項目取代選單的項目，並提供一列由你自訂的項目用來返回。

選擇項目、在外部按下、按 Escape、Android 返回鍵以及 VoiceOver 的跳出手勢都會關閉選單。`ContextMenu` 是同一種選單，透過次要按鈕（右鍵點擊）在指標處開啟，或在觸控螢幕上以手指長按其觸發元件開啟。

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

這五個都來自 [`nsh/base`](../modules/nsh-base.md)。項目會自行找到所屬的選單，因此你可以自由編排：在 view 中分組、加上標籤，或搭配 `If` 讓項目出現與消失。`popupClass` 為桌面上的彈出視窗與手機上的面板設定樣式；若兩者的樣式不同，可以將 `platform.idiom`（`nsh`）與 `"desktop"` 比較。

<a id="menu-bars"></a>

## 選單列

當多個選單的觸發元件是同一個 `Toolbar` 的項目時，它們會構成選單列：其中一個選單開啟時，指標移到另一個選單的觸發元件上，就會改為開啟該選單，方向鍵則可在各觸發元件之間移動。

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

在桌面平台上，次要按鈕會在指標所在處開啟它。在觸控螢幕上，手指長按觸發元件會以面板開啟；觸發元件本身的按下操作與周圍的捲動檢視仍可正常運作，手指移動則會取消長按。

<a id="checkable-items"></a>

## 可勾選項目

`checked` 會讓項目變成可勾選項目：可以是選單所顯示的設定（「Show sidebar」），或搭配 `role="menuitemradio"` 表示群組中的單一選擇（「Sort by」）。值由你管理：選擇項目時會呼叫 `onSelect`，由你設定下一個值，項目隨之顯示。勾選時，其 `checked:` classes 與 `checkedStyle` 會生效，其指示器也一樣：指示器是內容之前的部分（`indicatorClass`、`indicatorStyle`），圍繞著你提供的記號（`indicator`）。記號只會建立一次並保留；可用指示器的 `checked:` classes 顯示與隱藏它，或使用記號自己的 `group-checked:` classes，並搭配 `group`（位於 `indicatorClass` 中）。`closeOnSelect={false}` 會讓選單保持開啟，因此設定能立即顯示新的值。

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

位於尾端邊緣的記號則放在內容中，並以項目上 `group` 之下的 `group-checked:` classes 設定樣式。

<a id="entrance-and-exit"></a>

## 進場與退場

在桌面平台上，彈出視窗會隨你的轉場出現與消失，與 [Popover](./popover.md#entrance-and-exit) 相同：`popupStartingClass` 是其第一個畫格的外觀，`popupEndingClass` 是關閉後的外觀，在 `popupClass` 的 `transition-*` classes 執行期間會保持此外觀，之後接著 `onClose`。子選單採用相同的外觀，並隨其選單一同關閉。手機上的面板則自行滑入與滑出。

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

未使用 `open` 時，選單會自行維持狀態（從 `defaultOpen` 對應 `Menu` 開始）。使用 `open` 時，狀態由應用程式持有，並在 `onOpenChange({ open, reason })` 中變更：`"triggerPress"`、`"select"`、`"pressOutside"`、`"backdropPress"`、`"cancel"`、`"contextMenu"` 或 `"longPress"`。

## Props

<a id="menu-1"></a>

### Menu

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 無 | 開啟狀態，由應用程式控制。 |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 在未使用 `open` 時，一開始即開啟。 |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 桌面：放置於觸發元件的哪一側。 |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | 桌面：與觸發元件的對齊方式。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面：觸發元件與彈出視窗之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 桌面：與安全區域邊緣保持的距離。 |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 彈出視窗（桌面）或面板（手機），以及子選單的彈出視窗。 |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 桌面：彈出視窗在第一個畫格的外觀，疊加在其自身樣式之上。 |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 桌面：彈出視窗關閉後的外觀，在其轉場執行期間保持。 |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 手機：面板後方的背景遮罩。 |
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 按下時用來開啟選單的元件。選單開啟時，其 `aria-expanded:` classes 與 `expandedStyle` 會生效。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 項目，每次開啟時建立。 |

### ContextMenu

`open`、`popupClass` / `popupStyle`、起始與結束外觀、`backdropClass` / `backdropStyle`、`trigger` 與 `children` 皆與 `Menu` 相同，另外還有：

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 次要按鈕與長按的手指不會有任何作用。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面：指標與彈出視窗之間的間距。 |
| `margin` | `.margin(..)` | `number` | `0` | 桌面：與安全區域邊緣保持的距離。 |

### MenuItem

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不可選擇；`disabled:` 樣式會生效。 |
| `checked` | `.checked(..)` | `boolean` | 無 | 是否已勾選，這會使它成為可勾選項目；由應用程式管理。 |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | 無 | 勾選時的樣式，以 `checked:` classes 表示。 |
| `role` | `.role(..)` | `AccessibilityRole` | 搭配 `checked` 時為 `"menuitemcheckbox"`，否則為 `"menuitem"` | 螢幕閱讀器如何理解它；`"menuitemradio"` 表示群組中的單一選擇。 |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | 無 | 指示器，即其內容之前的部分；其 `checked:` 與 `disabled:` classes 會跟隨項目。 |
| `indicator` | `.indicator(..)` | `JSX.Element` | 無 | 指示器內的記號。 |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | 選擇它會關閉選單。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器朗讀的內容，用於內容本身不足以說明時。 |
| `children`, `class`, `style` | `.child(..)`、樣式方法 | | 無 | 其內容與外觀，含 `hover:`、`active:` 與 `checked:` 狀態。 |

### Submenu

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | 無 | 開啟它的項目。 |
| `back` | `.back(..)` | `JSX.Element` | 無 | 手機：位於其項目上方、可返回周圍項目的一列。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 它不會開啟。 |
| `offset` | `.offset(..)` | `number` | `0` | 桌面：其周圍選單與其彈出視窗之間的間距。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 它的項目。 |

`MenuSeparator` 是你自行設定樣式的 view（`class`、`style`），會與其所在層級的項目一同顯示。

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpenChange`（`Menu`、`ContextMenu`） | `.on_open_change(\|e\| ..)` | 已開啟或關閉，並附帶原因。 |
| `onOpen`（`Menu`、`ContextMenu`） | `.on_open(\|\| ..)` | 已顯示；作為面板時，是在進場完成之後。 |
| `onClose`（`Menu`、`ContextMenu`） | `.on_close(\|\| ..)` | 已消失：作為面板時是在離場之後，作為彈出視窗時是在其退場之後。應用程式關閉它時也會觸發。 |
| `onPosition`（`Menu`、`ContextMenu`） | `.on_position(\|e\| ..)` | 桌面：彈出視窗已就定位：`placement`（它所放置的一側）、`bounds`、`available`。 |
| `onCancel`（`Menu`、`ContextMenu`） | `.on_cancel(\|\| ..)` | 使用者嘗試不經選擇就關閉它（Escape 或返回、在外部或背景遮罩上按下）。 |
| `onSelect`（`MenuItem`） | `.on_select(\|\| ..)` | 項目已被選擇；可勾選項目會要求其另一個值。 |

<a id="accessibility"></a>

## 無障礙

對螢幕閱讀器而言，彈出視窗或面板是選單，其項目是選單項目；觸發元件會告知選單是否已展開。可勾選項目是核取方塊或選項按鈕選單項目，朗讀為已勾選或未勾選；其指示器是項目的一部分。在 TSX 中，觸發元件是你傳入的元素，可以是 `Button` 或你自己的 view：它會自行接管按下操作與展開狀態，因此在按下期間，其自身的 `active:` classes 與 `activeStyle` 會生效，其自身的 `onPress` 也會執行。畫面上只有目前所顯示層級的項目，因此螢幕閱讀器朗讀的就是當下所見的內容。
