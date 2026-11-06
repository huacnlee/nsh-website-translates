---
title: "nsh/desktop"
description: "僅限桌面平台的 API:視窗(標題、標題列、最大化、全螢幕)、應用程式自訂標題列與可拖曳區域、應用程式選單、右鍵選單及鍵盤快速鍵。"
order: 12.5
source_hash: 460c34aa14353d38
---


# nsh/desktop

`nsh/desktop` 收納只有桌面才有的功能：視窗及其標題列、應用程式選單和右鍵選單。它適用於 macOS、Windows 和 Linux。Rust 程式碼可在 `nsh_core::element::desktop` 找到同樣的功能：視窗的函式（`set_title`、`set_title_bar`、`title_bar`、`minimize`、… `close_window`）、應用程式選單和右鍵選單（`set_application_menu`、`popup_menu`，由 `MenuItem` 組成），並以 `.window_drag(true)` 標記可拖曳的檢視；TSX 則匯入 `nsh/desktop`。此模組可在所有平台匯入，因此同一個 bundle 可到處執行：在 iOS 和 Android 上，其函式不會有任何作用，而 `isAvailable` 會告訴你視窗和選單是否存在。

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

`true` 表示此模組的視窗和選單 API 可用的平台：macOS、Windows 和 Linux；其他平台則為 `false`。Rust：`os().is_desktop()`。

[`platform.desktop`](./nsh.md#platform) 是針對桌面行為更廣泛的檢查（`desktop={{…}}` 屬性、`platform.select({ desktop })`）：在以桌面慣用方式執行的瀏覽器中（它們在瀏覽器自己的視窗內運行）同樣成立。桌面版面配置、密度和輸入應以 `platform.desktop` 作判斷，而 `Window` 和 `Menu` 的呼叫則以 `isAvailable` 作判斷。

<a id="window"></a>

## 視窗

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

Rust 欄列出 `nsh_core::element::desktop` 的函式。

| 成員 | Rust | 說明 |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | 視窗的標題：標題列、工作列或 Dock，以及視窗切換器。 |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` 會移除系統的標題列：應用程式會填滿視窗直至頂端，並自行繪製標題列。系統的視窗控制項會保留（macOS 的紅綠燈按鈕、Windows 的最小化／最大化／關閉按鈕、GTK 的視窗按鈕）。`height` 是你的標題列高度（以點為單位）：控制項會在其中置中（Windows 的標題按鈕會填滿該高度；在 macOS 上，`height` 選用最高 44 點的精簡外觀，超過則為標準外觀；請使用 `titleBar().height` 提供的實際高度來設定標題列大小，而 AppKit 會在即時調整大小期間放置紅綠燈按鈕。嵌入式應用程式既有的工具列會保留自己的樣式和高度）；若不設定，則採用平台的高度。`style: "default"` 會恢復系統的標題列（Rust：`set_title_bar(TitleBarStyle::Default, None)`）。 |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | 在 Windows 和 Linux 的 GPUI 應用程式中，視窗會把應用程式選單繪製為應用程式上方的選單列：`"shown"`（預設）一律顯示；`"autoHide"` 在單獨按下並放開 Alt 後顯示，直到再次單獨按 Alt 才隱藏，與 Windows 和 GNOME 應用程式相同。無論哪種方式，F10 以及 Alt 加選單的首字母都會開啟選單，選單開啟期間選單列會顯示。macOS 的選單列由系統提供。 |
| `minimize()` | `minimize()` | 最小化視窗。 |
| `toggleMaximize()` | `toggle_maximize()` | 最大化視窗；若已最大化則還原。 |
| `toggleFullScreen()` | `toggle_full_screen()` | 進入或離開全螢幕。 |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | 以點為單位移動視窗並調整大小；省略的欄位保持原值。在 macOS 和 Windows 上，`size`（`width`、`height`）包含視窗裝飾；在 Linux 上則設定 GTK 的預設視窗大小。`origin`（`x`、`y`）是視窗的左上角，從主螢幕（在 macOS 上是有選單列的那個）的左上角量度，`y` 向下遞增，各平台相同；只有 `height` 而沒有 `y` 時，頂邊維持不變，因此視窗會在底邊放大和縮小。`animated: true` 啟用 macOS 的調整大小動畫（預設：false）。 |
| `setLevel(level)` | `set_level(level)` | 在 macOS 和 Windows 上，`"floating"` 讓視窗保持在一般視窗之上，`"normal"` 則恢復一般層級。`"desktopIcon"` 選用 macOS 的桌面圖示層級（視窗也會出現在每個空間，且不在 Mission Control 和 Cmd+` 之中）；在 Windows 上，它會把視窗移到目前 z-order 的底部，之後的啟用操作可能會將其提升。 |
| `orderFront()` | `order_front()` | 將視窗帶到其層級的最前並取得焦點（應用程式會啟用；macOS 會還原最小化的視窗，Windows 會還原最小化的視窗並設為前景，GTK 會呈現視窗）。視窗保持其層級。在 macOS 上，桌面層級的介面會留在其他視窗之後。GPUI 會啟用其視窗；在 Linux 上，前景請求由視窗管理員控制。 |
| `close()` | `close_window()` | 關閉視窗；應用程式隨之結束。 |

視窗大小調整支援 macOS、Windows 和 Linux；定位和層級則支援 macOS 和 Windows。Linux 的視窗管理員控制位置和堆疊。在 GPUI 應用程式中，`setFrame` 設定視窗大小，由平台決定位置；GPUI 的宿主會在開啟視窗時選擇其位置和層級。

當根據以 `onLayout` 量度的內容來決定視窗大小時，請在 macOS 和 Windows 上為視窗裝飾預留空間。`width` 和 `height` 接受正的有限數字；`x` 和 `y` 接受有限數字。無效的欄位會保留先前的值。

<a id="a-title-bar-of-your-own"></a>

## 自訂標題列

隱藏標題列後，應用程式會自行繪製標題列，並以 Rust 的 `.window_drag(true)` 和 TSX 的 `desktop={{ windowDrag: true }}` 指明其中哪些部分可移動視窗：

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

按下設有 `windowDrag` 的檢視會像系統標題列一樣拖曳視窗：按兩下會最大化視窗（或依使用者的設定：在 macOS 上為「按兩下視窗的標題列以」），而在 Windows 和 Linux 上按右鍵會開啟視窗選單。

- 設定 `windowDrag` 的最近一層檢視具決定性：`.window_drag(false)`（`desktop={{ windowDrag: false }}`）可讓可拖曳檢視的一部分保持可點按。
- 可拖曳檢視內的文字欄位，以及設有按壓或觸控處理器（`onPress`、`onTouch*`、responders）的檢視，無需額外設定也保持可點按：上例中的搜尋欄位和任何按鈕都照常運作。
- `windowDrag` 也適用於系統的標題列：側邊欄或工具列同樣可以移動視窗。

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

隱藏標題列的區域（以點為單位，具反應性）：其 `height`，以及系統視窗控制項在其 `left` 和 `right` 兩端所佔的寬度。請用它來排版你的標題列，避免任何內容位於控制項之下。系統顯示標題列時（以及全螢幕時和非桌面平台上），三者皆為 0。Rust：`title_bar() -> Edges<Points>`，其 `top` 為高度，`left` 和 `right` 為控制項的寬度；讀取它會訂閱變更。

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`，否則為標題列的高度（28 或 32，視 macOS 版本而定） | 紅綠燈按鈕的寬度 | 0 |
| Windows | `height`，否則為 32 | 0 | 三個標題按鈕（138） |
| Linux | `height`，否則為標頭列（header bar）的高度 | 開頭處的視窗按鈕（依桌面的按鈕配置） | 末端的視窗按鈕 |

在 Windows 上，標題按鈕由 NSH 以 Windows 11 的風格繪製，並跟隨應用程式的外觀；游標停留在最大化按鈕上會顯示 Windows 11 的貼齊版面配置（snap layouts）。視窗在所有平台上都保留縮放邊框、陰影和圓角。

<a id="menu"></a>

## 選單

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| 成員 | 說明 |
|---|---|
| `setApplicationMenu(items)` | 設定應用程式選單：每個頂層項目對應一個子選單（`File`、`Edit`……）。在 macOS 上它是選單列，第一個選單是應用程式選單（AppKit 以應用程式名稱作標題）。在 Windows 和 Linux 上它是視窗的選單列，標題列隱藏時不會顯示；其快速鍵仍然有效，而應用程式自己的標題列可用 `Menu.popup` 開啟其選單。`null` 會恢復平台的預設選單。 |
| `popup(items, at?)` | 顯示右鍵選單，其左上角位於 `at`（視窗座標，以點為單位：即 `onContextMenu` 的 `e.pagePosition`）或指標位置。選單關閉後 promise 才會完成，不論是否選了項目：開啟選單的按鈕在此之前可保持按下狀態。 |

在 Rust 中，`set_application_menu(items)` 接受 `Vec<MenuItem>`（`None` 恢復平台的預設選單），而 `popup_menu(items)`（在指標位置）和 `popup_menu_at(items, at)` 會返回一個 `Answer<()>`，在選單關閉後完成（是否 await 它皆可）。項目的處理器在設定該選單的 owner 之下執行，只要該 owner 仍存活。

再次呼叫 `setApplicationMenu` 即可更改選單。在 `effect` 內呼叫時，它會跟隨所讀取的 signal：取決於應用程式狀態的勾選標記或停用狀態會保持最新。

<a id="menu-items"></a>

### 選單項目

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

| 欄位 | 說明 |
|---|---|
| `label` | 項目顯示的內容。角色項目若不設定它，則使用自己的標籤。 |
| `onSelect` | 項目被選取時呼叫，不論是點按還是快速鍵。 |
| `shortcut` | 其鍵盤快速鍵：修飾鍵和一個按鍵，以 `+` 連接，例如 `"mod+n"`、`"mod+shift+z"`、`"alt+f4"` 或 `"f11"`。修飾鍵見下表。按鍵為字母、數字和標點符號，寫成該鍵在美式鍵盤上不按 Shift 時輸入的字元（`,`、`/`；`"shift+/"` 代表 `?`），或使用名稱：`plus`（`=` / `+` 鍵，亦可寫 `=`）、`minus`（亦可寫 `-`）、`space`、`enter`（`return`）、`escape`（`esc`）、`tab`、`backspace`、`delete`（`del`）、`insert`、方向鍵 `up`、`down`、`left`、`right`（`arrowup`、…）、`home`、`end`、`pageup`、`pagedown`、`f1`–`f24`。不分大小寫（`"Mod+Shift+N"` 即 `"mod+shift+n"`；大寫字母是同一個鍵，並非 Shift），建議使用小寫。無效的快速鍵（`"mod-n"`、`"mod++"`、`"mod+?"`）會拋出錯誤並給出正確寫法。`keymap` 接受相同的按鍵組合。選單以平台自己的風格顯示（macOS 上為 `⇧⌘N`，Windows 上為 `Ctrl+Shift+N`）。 |
| `when` | 在 GPUI 後端，當文字欄位持有鍵盤焦點時，由快速鍵選取該項目的情況：`"always"`（預設）、`"auto"`（除非欄位本身使用該按鍵：包括輸入字元、移動插入點或刪除的按鍵，以及編輯快速鍵，與 [`keymap`](./nsh.md#keymap) 的綁定相同）或 `"notEditing"`。項目放過的按鍵會交給欄位。 |
| `disabled` | `true` 會使項目變灰（預設 `false`）。 |
| `checked` | 設為（`true` 或 `false`）即成為帶勾選標記的項目。 |
| `submenu` | 使項目成為子選單（需要 `label`）。 |
| `role` | 由平台執行的標準項目（見下）。 |

`null`、`undefined` 和 `false` 項目會被略去，因此 `cond && { … }` 可用於列表中。

在 Rust 中，項目是 `MenuItem::new(label)`、`MenuItem::role(role)`、`MenuItem::separator()` 或 `MenuItem::submenu(label, items)`，欄位則為方法：`.shortcut("mod+n")`（快速鍵無效時會 panic，並給出正確寫法）、`.shortcut_when(When::Auto)`、`.disabled(true)`、`.checked(on)`、`.on_select(f)`，以及用於角色項目的 `.label(..)`。

修飾鍵：

| 修飾鍵 | macOS | Windows | Linux |
|---|---|---|---|
| `mod`（亦可寫 `cmdorctrl`） | Command (⌘) | Ctrl | Ctrl |
| `cmd`（亦可寫 `command`、`meta`、`super`、`win`） | Command (⌘) | Windows 鍵 | Super |
| `ctrl`（亦可寫 `control`） | Control (⌃) | Ctrl | Ctrl |
| `alt`（亦可寫 `option`、`opt`） | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

應用程式自己的快速鍵請用 `mod`：它是各平台應用程式用於此用途的按鍵（macOS 上為 ⌘N，Windows 和 Linux 上為 Ctrl+N），因此一種寫法適用於所有平台。Windows 鍵和 Super 大多屬於系統（Win+E、GNOME 的概覽），因此在 macOS 以外，`cmd` 很少是正確選擇。

角色：

| 角色 | 作用 | 平台 |
|---|---|---|
| `about`、`hide`、`hideOthers`、`showAll` | 應用程式選單的標準項目 | macOS（其他平台會略去） |
| `quit` | 結束應用程式 | 所有平台 |
| `undo`、`redo`、`cut`、`copy`、`paste`、`selectAll` | 編輯焦點所在的文字欄位（其自身的快速鍵仍歸其所有） | 所有平台 |
| `minimize`、`zoom`、`toggleFullScreen`、`close` | 視窗 | 所有平台 |

角色項目除非自行設定，否則使用平台的標籤和快速鍵（macOS 會在 `about`、`hide` 和 `quit` 加上應用程式名稱）。

選單快速鍵優先，與原生應用程式相同：項目佔用的按鍵不會傳到持有焦點的文字欄位，也不會傳到 NSH 自己的按鍵。只有同一按鍵組合的 [`keymap`](./nsh.md#keymap) 綁定會排在它們之前。因此，編輯快速鍵（`mod+c`、`mod+v`、`mod+x`、`mod+a`、`mod+z`）只應交給編輯角色，由它們傳給文字欄位；並避免使用沒有修飾鍵的按鍵（`escape`、方向鍵、字母），否則會從文字欄位和返回導覽中奪走這些按鍵。在 GPUI 後端，`when: "auto"` 可讓項目與文字欄位共用按鍵：`delete` 或 `mod+z` 會在沒有欄位持有焦點時選取項目，而在有欄位持有焦點時編輯文字。

在 GPUI 後端，持有鍵盤焦點的原生元件會先接收每個按鍵。它自行處理的按鍵不會傳到 keymap 或選單。它放過的按鍵會像有文字欄位獲得焦點一樣傳到 keymap，然後才到選單。

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

由按鈕按下觸發的右鍵選單：

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
> 選單由系統提供（NSMenu、Win32 選單、GTK 彈出式選單）：外觀和行為與其他應用程式相同，跟隨系統（或應用程式）的外觀，並支援鍵盤操作。`examples/desktop` 是一個設有自己的標題列、應用程式選單和右鍵選單的應用程式。
