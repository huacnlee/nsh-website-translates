---
title: "nsh/desktop"
description: "僅限桌面平台的 API：視窗（標題、標題列、最大化、全螢幕）、應用程式自訂的標題列與可拖曳區域、應用程式選單、右鍵選單，以及鍵盤快速鍵。"
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` 收錄只有桌面平台才有的功能：視窗與其標題列、應用程式選單和右鍵選單，可在 macOS、Windows 和 Linux 上運作。Rust 程式碼可在 `nsh_core::element::desktop` 找到相同的內容：視窗的函式（`set_title`、`set_title_bar`、`title_bar`、`minimize`、… `close_window`）、應用程式選單與右鍵選單（`set_application_menu`、`popup_menu`，由多個 `MenuItem` 組成），並以 `.window_drag(true)` 標記可拖曳的 view；TSX 則匯入 `nsh/desktop`。此模組可在所有平台上匯入，因此同一個 bundle 可以到處執行：在 iOS 和 Android 上，它的函式不會執行任何動作，而 `isAvailable` 會告訴你視窗與選單是否可用。

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

`true` 表示此模組的視窗與選單 API 可運作的環境：macOS、Windows 和 Linux；其他環境則為 `false`。Rust：`os().is_desktop()`。

[`platform.desktop`](./nsh.md#platform) 是針對桌面行為（`desktop={{…}}` props、`platform.select({ desktop })`）更廣泛的檢查：在以桌面慣例執行、位於瀏覽器自身視窗中的瀏覽器裡，它同樣成立。請以 `platform.desktop` 判斷桌面版面配置、密度與輸入方式，並以 `isAvailable` 判斷是否呼叫 `Window` 和 `Menu`。

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

Rust 欄位列出 `nsh_core::element::desktop` 的函式。

| 成員 | Rust | 說明 |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | 視窗的標題：顯示於標題列、工作列或 Dock、視窗切換器。 |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` 會移除系統的標題列：app 會填滿視窗直到頂端邊緣，並自行繪製標題列。系統的視窗控制項仍會保留（macOS 的紅綠燈按鈕、Windows 的最小化／最大化／關閉按鈕、GTK 的視窗按鈕）。`height` 是你的標題列高度，單位為 point：控制項會在其中置中（Windows 的標題按鈕會填滿該高度；在 macOS 上，`height` 會在 44 point 以下選用精簡樣式，超過則選用標準樣式；請使用 `titleBar().height` 提供的實際高度來設計你的標題列，而紅綠燈按鈕會由 AppKit 在即時調整大小時定位。嵌入式 app 既有的工具列會保留自己的樣式與高度）；未設定時則採用平台的高度。`style: "default"` 會恢復系統的標題列（Rust：`set_title_bar(TitleBarStyle::Default, None)`）。 |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | 在 Windows 和 Linux 的 GPUI app 中，視窗會將應用程式選單繪製成 app 上方的選單列：`"shown"`（預設）會一律顯示；`"autoHide"` 則在單獨按下並放開 Alt 後顯示，直到再次單獨按下 Alt 才隱藏，與 Windows 和 GNOME 的 app 相同。無論哪種設定，F10 以及 Alt 加上選單的首字母都會開啟選單，且選單開啟期間選單列會顯示。macOS 的選單列由系統管理。 |
| `minimize()` | `minimize()` | 將視窗最小化。 |
| `toggleMaximize()` | `toggle_maximize()` | 將視窗最大化；若已最大化則還原。 |
| `toggleFullScreen()` | `toggle_full_screen()` | 進入或離開全螢幕。 |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | 以 point 為單位移動視窗並調整大小；省略的欄位會保留原值。在 macOS 和 Windows 上，`size`（`width`、`height`）包含視窗裝飾；在 Linux 上則設定 GTK 的預設視窗大小。`origin`（`x`、`y`）是視窗的左上角，從主螢幕（在 macOS 上為有選單列的螢幕）的左上角起算，`y` 向下增加，各平台皆相同；只有 `height` 而沒有 `y` 時，上邊緣會維持原位，因此視窗會從底部邊緣放大或縮小。`animated: true` 會啟用 macOS 的調整大小動畫（預設：false）。 |
| `setLevel(level)` | `set_level(level)` | 在 macOS 和 Windows 上，`"floating"` 會讓視窗保持在一般視窗之上，`"normal"` 則恢復一般層級。`"desktopIcon"` 會選用 macOS 的桌面圖示層級（視窗也會出現在每個空間，但不會出現在 Mission Control 和 Cmd+` 中）；在 Windows 上，它會將視窗移到目前 z 順序的最底部，之後的啟用動作可能會將它拉高。 |
| `orderFront()` | `order_front()` | 將視窗帶到其層級的最前方並取得焦點（app 會啟用；macOS 會取消最小化，Windows 會還原最小化的視窗並設為前景，GTK 會呈現視窗）。視窗會保持原本的層級。在 macOS 上，桌面層級的表面仍會位於其他視窗之後。GPUI 會啟用它的視窗；在 Linux 上，前景請求由視窗管理員控制。 |
| `close()` | `close_window()` | 關閉視窗；app 會隨之結束。 |

視窗大小調整支援 macOS、Windows 和 Linux；定位與層級則支援 macOS 和 Windows。Linux 的視窗管理員控制位置與堆疊順序。在 GPUI app 中，`setFrame` 會設定視窗大小並由平台決定位置；GPUI 的 host 會在開啟視窗時選擇其位置與層級。

依據以 `onLayout` 量測的內容來調整視窗大小時，請在 macOS 和 Windows 上為視窗裝飾預留空間。`width` 和 `height` 接受有限的正數；`x` 和 `y` 接受有限的數字。無效的欄位會保留先前的值。

<a id="a-title-bar-of-your-own"></a>

## 自訂標題列

隱藏標題列後，app 會自行繪製標題列，並透過 Rust 中的 `.window_drag(true)` 與 TSX 中的 `desktop={{ windowDrag: true }}` 指定其中哪些部分可以移動視窗：

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

按下設有 `windowDrag` 的 view 會像系統的標題列一樣拖曳視窗：按兩下會將視窗最大化（或依使用者的設定執行，在 macOS 上為「按兩下視窗的標題列以」），而在 Windows 和 Linux 上，按右鍵會開啟視窗選單。

- 由最近的、設定了 `windowDrag` 的 view 決定：`.window_drag(false)`（`desktop={{ windowDrag: false }}`）可讓可拖曳 view 中的某個部分保持可點擊。
- 可拖曳 view 內的文字欄位以及帶有按下或觸控處理常式（`onPress`、`onTouch*`、responder）的 view，即使沒有它也能保持可點擊：上例中的搜尋欄位和所有按鈕都能照常運作。
- `windowDrag` 也適用於系統的標題列：側邊欄或工具列同樣可以用來移動視窗。

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

隱藏標題列的區域，單位為 point（reactive）：包含它的 `height`，以及系統視窗控制項在其 `left` 與 `right` 兩端所佔的寬度。請依此配置你的標題列，避免內容位於控制項之下。當系統顯示其標題列時（以及在全螢幕和非桌面環境中），這三個值皆為 0。Rust：`title_bar() -> Edges<Points>`，其中 `top` 為高度，`left` 和 `right` 為控制項的寬度；讀取它會訂閱其變更。

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`，否則為標題列的高度（28 或 32，視 macOS 版本而定） | 紅綠燈按鈕的寬度 | 0 |
| Windows | `height`，否則為 32 | 0 | 三個標題按鈕（138） |
| Linux | `height`，否則為標頭列的高度 | 起始端的視窗按鈕（依桌面環境的按鈕配置） | 結尾端的視窗按鈕 |

在 Windows 上，標題按鈕由 NSH 以 Windows 11 的樣式繪製並跟隨 app 的外觀；將滑鼠移到最大化按鈕上會顯示 Windows 11 的貼齊版面配置。在每個平台上，視窗都會保留其調整大小的邊框、陰影和圓角。

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
| `setApplicationMenu(items)` | 設定應用程式選單：每個頂層項目對應一個子選單（`File`、`Edit`、...）。在 macOS 上它是選單列，第一個選單為 app 選單（AppKit 會以 app 的名稱作為其標題）。在 Windows 和 Linux 上它是視窗的選單列，隱藏標題列時不會顯示；其快速鍵仍可運作，而 app 自訂的標題列可以用 `Menu.popup` 開啟它的選單。`null` 會恢復平台的預設選單。 |
| `popup(items, at?)` | 顯示右鍵選單，其左上角位於 `at`（視窗座標，單位為 point：例如 `onContextMenu` 的 `e.pagePosition`），或位於指標處。此 promise 會在選單關閉後 resolve，無論是否選擇了項目：開啟選單的按鈕可以在此之前保持按下狀態。 |

在 Rust 中，`set_application_menu(items)` 接受 `Vec<MenuItem>`（`None` 會恢復平台的預設選單），而 `popup_menu(items)`（位於指標處）和 `popup_menu_at(items, at)` 會回傳一個 `Answer<()>`，在選單關閉後完成（是否 await 它為選擇性）。項目的處理常式會在設定該選單的 owner 底下執行，直到該 owner 結束。

再次呼叫 `setApplicationMenu` 即可變更選單。在 `effect` 內呼叫時，它會追蹤所讀取的 signal：依 app 狀態而定的勾選記號或停用狀態會保持最新。

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
| `label` | 項目顯示的內容。具有 role 的項目在未設定時會使用自己的標籤。 |
| `onSelect` | 在項目被選取時呼叫，無論是透過點擊或其快速鍵。 |
| `shortcut` | 其鍵盤快速鍵：修飾鍵與一個按鍵以 `+` 連接，例如 `"mod+n"`、`"mod+shift+z"`、`"alt+f4"` 或 `"f11"`。修飾鍵列於下表。按鍵可以是字母、數字和標點符號，寫成該鍵在美式鍵盤上不按 Shift 時所輸入的字元（`,`、`/`；`?` 寫作 `"shift+/"`），或是名稱：`plus`（`=` ／ `+` 鍵，也可寫作 `=`）、`minus`（也可寫作 `-`）、`space`、`enter`（`return`）、`escape`（`esc`）、`tab`、`backspace`、`delete`（`del`）、`insert`、方向鍵 `up`、`down`、`left`、`right`（`arrowup`、…）、`home`、`end`、`pageup`、`pagedown`、`f1`–`f24`。不分大小寫（`"Mod+Shift+N"` 即 `"mod+shift+n"`；大寫字母是同一個鍵，而不是 Shift），建議使用小寫。無效的快速鍵（`"mod-n"`、`"mod++"`、`"mod+?"`）會擲出錯誤並提示正確的寫法。`keymap` 接受相同的按鍵組合。選單會以平台自身的樣式顯示它（macOS 上為 `⇧⌘N`，Windows 上為 `Ctrl+Shift+N`）。 |
| `when` | 在 GPUI 後端上，當文字欄位擁有鍵盤焦點時，快速鍵何時會選取該項目：`"always"`（預設）、`"auto"`（除非欄位本身會使用該按鍵：包括會輸入文字、移動插入點或刪除的按鍵，以及編輯快速鍵，如同 [`keymap`](./nsh.md#keymap) 的綁定）或 `"notEditing"`。項目放過的按鍵會交給欄位處理。 |
| `disabled` | `true` 會將項目設為灰色（預設為 `false`）。 |
| `checked` | 設為（`true` 或 `false`）時，項目會帶有勾選記號。 |
| `submenu` | 使項目成為子選單（需要搭配 `label`）。 |
| `role` | 由平台執行的標準項目（見下文）。 |

`null`、`undefined` 和 `false` 的項目會被略過，因此 `cond && { … }` 可以在清單中使用。

在 Rust 中，項目為 `MenuItem::new(label)`、`MenuItem::role(role)`、`MenuItem::separator()` 或 `MenuItem::submenu(label, items)`，各欄位對應為方法：`.shortcut("mod+n")`（快速鍵無效時會 panic，並提示正確的寫法）、`.shortcut_when(When::Auto)`、`.disabled(true)`、`.checked(on)`、`.on_select(f)`，以及用於具有 role 項目的 `.label(..)`。

修飾鍵：

| 修飾鍵 | macOS | Windows | Linux |
|---|---|---|---|
| `mod`（也可寫作 `cmdorctrl`） | Command (⌘) | Ctrl | Ctrl |
| `cmd`（也可寫作 `command`、`meta`、`super`、`win`） | Command (⌘) | Windows 鍵 | Super |
| `ctrl`（也可寫作 `control`） | Control (⌃) | Ctrl | Ctrl |
| `alt`（也可寫作 `option`、`opt`） | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

app 自己的快速鍵請使用 `mod`：它是各平台 app 用於此目的的按鍵（macOS 上為 ⌘N，Windows 和 Linux 上為 Ctrl+N），因此一種寫法即可適用於所有平台。Windows 鍵和 Super 大多由系統使用（Win+E、GNOME 概覽），所以 `cmd` 在 macOS 以外很少是合適的選擇。

Role：

| Role | 作用 | 平台 |
|---|---|---|
| `about`、`hide`、`hideOthers`、`showAll` | app 選單的標準項目 | macOS（其他平台會略過） |
| `quit` | 結束 app | 所有平台 |
| `undo`、`redo`、`cut`、`copy`、`paste`、`selectAll` | 編輯取得焦點的文字欄位（其自身的快速鍵仍由它自己處理） | 所有平台 |
| `minimize`、`zoom`、`toggleFullScreen`、`close` | 視窗 | 所有平台 |

除非自行設定，具有 role 的項目會使用平台的標籤與快速鍵（macOS 會在 `about`、`hide` 和 `quit` 加上 app 的名稱）。

選單快速鍵優先，與原生 app 相同：項目佔用的按鍵絕不會傳到取得焦點的文字欄位或 NSH 本身的按鍵。只有具有相同按鍵組合的 [`keymap`](./nsh.md#keymap) 綁定會排在它們之前。因此，編輯快速鍵（`mod+c`、`mod+v`、`mod+x`、`mod+a`、`mod+z`）只應指派給編輯 role，由它們傳遞給文字欄位；並請避免使用沒有修飾鍵的按鍵（`escape`、方向鍵、字母），否則會從文字欄位和返回導覽中奪走這些按鍵。在 GPUI 後端上，`when: "auto"` 可讓項目與文字欄位共用同一個按鍵：`delete` 或 `mod+z` 會在沒有欄位取得焦點時選取該項目，而在有欄位取得焦點時編輯文字。

在 GPUI 後端上，取得鍵盤焦點的原生元件會最先接收每個按鍵。它自己處理的按鍵絕不會傳到 keymap 或選單。它放過的按鍵會像有文字欄位取得焦點一樣傳到 keymap，然後才傳到選單。

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

由按鈕按下所開啟的右鍵選單：

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
> 選單由系統提供（NSMenu、Win32 選單、GTK 彈出式選單）：它們的外觀和行為與其他 app 一致，會跟隨系統（或 app）的外觀，並支援鍵盤操作。`examples/desktop` 是一個具有自訂標題列、應用程式選單和右鍵選單的 app。
