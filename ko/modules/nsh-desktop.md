---
title: "nsh/desktop"
description: "데스크톱 전용 API: 창(제목, 제목 표시줄, 최대화, 전체 화면), 드래그 가능한 영역을 갖춘 앱 고유의 제목 표시줄, 애플리케이션 메뉴, 컨텍스트 메뉴, 키보드 단축키를 다룹니다."
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` 모듈에는 데스크톱에만 있는 기능, 즉 창과 타이틀 바, 애플리케이션 메뉴, 컨텍스트 메뉴가 들어 있습니다. macOS, Windows, Linux에서 동작합니다. Rust 코드는 `nsh_core::element::desktop`에서 같은 기능을 찾을 수 있습니다. 창의 함수(`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), 애플리케이션 메뉴와 컨텍스트 메뉴(`set_application_menu`, `popup_menu`, `MenuItem`로 구성)가 있고, `.window_drag(true)`로 드래그할 수 있는 뷰를 표시합니다. TSX에서는 `nsh/desktop`를 import합니다. 이 모듈은 모든 플랫폼에서 import할 수 있으므로 하나의 번들이 어디서나 실행됩니다. iOS와 Android에서는 함수들이 아무 동작도 하지 않으며, 창과 메뉴가 있는지는 `isAvailable`로 확인할 수 있습니다.

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

macOS, Windows, Linux처럼 이 모듈의 창 및 메뉴 API가 동작하는 곳에서는 `true`, 그 밖의 곳에서는 `false`입니다. Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform)는 데스크톱 동작(`desktop={{…}}` props, `platform.select({ desktop })`)에 대한 더 넓은 범위의 검사입니다. 브라우저 자체 창에서 실행되는 데스크톱 방식의 브라우저에서도 참이 됩니다. 데스크톱 레이아웃, 밀도, 입력은 `platform.desktop`로 분기하고, `Window`와 `Menu` 호출은 `isAvailable`로 분기하세요.

## Window

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

Rust 열은 `nsh_core::element::desktop`의 함수 이름입니다.

| Member | Rust | Description |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | 창의 제목입니다. 타이틀 바, 작업 표시줄 또는 Dock, 창 전환기에 표시됩니다. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"`는 시스템의 타이틀 바를 제거합니다. 앱이 창의 위쪽 가장자리까지 채우고 자체 타이틀 바를 그립니다. 시스템의 창 컨트롤(macOS의 traffic lights, Windows의 최소화 / 최대화 / 닫기 버튼, GTK의 창 버튼)은 그대로 남습니다. `height`는 포인트 단위의 자체 바 높이이며, 컨트롤은 그 안에서 가운데에 정렬됩니다(Windows의 캡션 버튼은 그 높이를 가득 채웁니다. macOS에서는 `height`가 44포인트까지는 compact chrome을, 그 이상은 regular chrome을 선택합니다. 바의 크기는 `titleBar().height`가 알려 주는 실제 높이를 기준으로 정하세요. 라이브 리사이즈 중에는 AppKit이 traffic lights를 배치합니다. 임베딩하는 앱의 기존 툴바는 자체 스타일과 높이를 유지합니다). 이 값이 없으면 컨트롤은 플랫폼의 기본 높이를 사용합니다. `style: "default"`는 시스템의 타이틀 바를 되돌립니다(Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | GPUI 앱에서 창이 애플리케이션 메뉴를 앱 위쪽의 바로 그리는 Windows와 Linux의 경우입니다. `"shown"`(기본값)는 항상 표시하고, `"autoHide"`는 Alt만 눌렀다 떼면 표시하며 Alt만 다시 누를 때까지 유지합니다. Windows와 GNOME 앱과 같은 방식입니다. F10과 메뉴의 머리글자와 함께 누른 Alt는 어느 쪽이든 메뉴를 열며, 메뉴가 열려 있는 동안에는 바가 표시됩니다. macOS의 메뉴 바는 시스템의 것입니다. |
| `minimize()` | `minimize()` | 창을 최소화합니다. |
| `toggleMaximize()` | `toggle_maximize()` | 창을 최대화하거나, 이미 최대화되어 있으면 복원합니다. |
| `toggleFullScreen()` | `toggle_full_screen()` | 전체 화면으로 들어가거나 전체 화면에서 나옵니다. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | 창을 포인트 단위로 이동하고 크기를 조정합니다. 생략한 필드는 기존 값을 유지합니다. macOS와 Windows에서 `size`(`width`, `height`)는 창 장식을 포함하며, Linux에서는 GTK의 기본 창 크기를 설정합니다. `origin`(`x`, `y`)는 주 화면(macOS에서는 메뉴 바가 있는 화면)의 왼쪽 위에서 잰 창의 왼쪽 위 모서리이며, `y`는 아래쪽으로 증가합니다. 모든 플랫폼에서 동일합니다. `y` 없이 `height`만 지정하면 위쪽 가장자리가 그대로 유지되므로 창은 아래쪽 가장자리에서 커지거나 줄어듭니다. `animated: true`는 macOS의 리사이즈 애니메이션을 활성화합니다(기본값: false). |
| `setLevel(level)` | `set_level(level)` | macOS와 Windows에서 `"floating"`는 창을 일반 창들보다 위에 유지하고, `"normal"`는 일반 레벨로 되돌립니다. `"desktopIcon"`는 macOS의 데스크톱 아이콘 레벨을 선택합니다(창은 모든 space에도 나타나고 Mission Control과 Cmd+`에서는 제외됩니다). Windows에서는 창을 현재 z-order의 맨 아래로 옮기며, 이후 활성화되면 다시 올라올 수 있습니다. |
| `orderFront()` | `order_front()` | 창을 해당 레벨의 맨 앞으로 가져와 포커스를 줍니다(앱이 활성화되며, macOS는 deminiaturize, Windows는 최소화된 창을 복원하고 foreground로 설정, GTK는 present합니다). 창은 자신의 레벨을 유지합니다. macOS에서 데스크톱 레벨의 표면은 다른 창들 뒤에 남습니다. GPUI는 자신의 창을 활성화하며, Linux에서는 foreground 요청을 창 관리자가 제어합니다. |
| `close()` | `close_window()` | 창을 닫으며, 앱도 함께 종료됩니다. |

창 크기 조정은 macOS, Windows, Linux에서 지원되며, 위치 지정과 레벨은 macOS와 Windows에서 지원됩니다. Linux에서는 창 관리자가 배치와 쌓임 순서를 제어합니다. GPUI 앱에서 `setFrame`는 창의 크기를 설정하고 플랫폼이 위치를 정합니다. 창을 열 때 GPUI의 호스트가 위치와 레벨을 선택합니다.

`onLayout`로 측정한 콘텐츠를 기준으로 창 크기를 정할 때는 macOS와 Windows에서 창 장식을 위한 여유 공간을 두세요. `width`와 `height`는 양의 유한한 수를, `x`와 `y`는 유한한 수를 받습니다. 유효하지 않은 필드는 이전 값을 유지합니다.

<a id="a-title-bar-of-your-own"></a>

## 나만의 타이틀 바

타이틀 바를 숨기면 앱이 자체 바를 그리고, 그중 어느 부분이 창을 움직이는지를 Rust에서는 `.window_drag(true)`, TSX에서는 `desktop={{ windowDrag: true }}`로 알려 줍니다.

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

`windowDrag`가 지정된 뷰를 누르면 시스템의 타이틀 바처럼 창이 드래그됩니다. 더블 클릭하면 창이 최대화되거나(macOS에서는 사용자가 설정한 "Double-click a window's title bar to" 동작을 따릅니다), Windows와 Linux에서는 오른쪽 클릭으로 창 메뉴가 열립니다.

- `windowDrag`를 설정한 가장 가까운 뷰가 결정합니다. `.window_drag(false)`(`desktop={{ windowDrag: false }}`)는 드래그 가능한 뷰의 일부를 클릭 가능한 상태로 유지합니다.
- 드래그 가능한 뷰 안의 텍스트 필드와 press 또는 touch 핸들러(`onPress`, `onTouch*`, responders)가 있는 뷰는 별도 설정 없이도 클릭할 수 있습니다. 위 예제의 검색 필드와 버튼들은 평소처럼 동작합니다.
- `windowDrag`는 시스템의 타이틀 바와 함께 사용해도 동작합니다. 사이드바나 툴바도 창을 움직이게 할 수 있습니다.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

숨겨진 타이틀 바의 영역을 포인트 단위로 나타냅니다(반응형). 높이인 `height`와, 시스템의 창 컨트롤이 `left` 끝과 `right` 끝에서 차지하는 너비를 담고 있습니다. 컨트롤 아래로 아무것도 들어가지 않도록 이 값으로 바를 배치하세요. 시스템이 타이틀 바를 표시하는 동안(그리고 전체 화면과 데스크톱이 아닌 환경에서) 세 값은 모두 0입니다. Rust: `title_bar() -> Edges<Points>`, 여기서 `top`는 높이이고 `left`와 `right`는 컨트롤의 너비입니다. 값을 읽으면 변경 사항을 구독하게 됩니다.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, 없으면 타이틀 바의 높이(macOS 버전에 따라 28 또는 32) | traffic lights의 너비 | 0 |
| Windows | `height`, 없으면 32 | 0 | 세 개의 캡션 버튼(138) |
| Linux | `height`, 없으면 헤더 바의 높이 | 시작 쪽의 창 버튼(데스크톱의 버튼 레이아웃) | 끝 쪽의 창 버튼 |

Windows에서 캡션 버튼은 NSH가 Windows 11 스타일로 그리며 앱의 외관을 따릅니다. 최대화 버튼에 마우스를 올리면 Windows 11의 snap layouts가 표시됩니다. 창은 모든 플랫폼에서 크기 조절 경계, 그림자, 둥근 모서리를 유지합니다.

## Menu

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Member | Description |
|---|---|
| `setApplicationMenu(items)` | 애플리케이션 메뉴를 설정합니다. 최상위 항목(`File`, `Edit`, ...)마다 하나의 서브메뉴를 둡니다. macOS에서는 메뉴 바이며 첫 번째 메뉴가 앱 메뉴입니다(AppKit이 앱 이름으로 제목을 붙입니다). Windows와 Linux에서는 창의 메뉴 바이며, 타이틀 바가 숨겨져 있는 동안에는 표시되지 않습니다. 단축키는 계속 동작하고, 앱 자체 타이틀 바에서는 `Menu.popup`로 메뉴를 열 수 있습니다. `null`는 플랫폼의 기본 메뉴를 복원합니다. |
| `popup(items, at?)` | 컨텍스트 메뉴를 왼쪽 위 모서리가 `at`(창 좌표, 포인트 단위: `onContextMenu`의 `e.pagePosition`)에 오도록 표시하거나, 포인터 위치에 표시합니다. 이 promise는 항목이 선택되었는지와 상관없이 메뉴가 닫히면 resolve됩니다. 메뉴를 연 버튼은 그때까지 눌린 상태로 둘 수 있습니다. |

Rust에서 `set_application_menu(items)`는 `Vec<MenuItem>`를 받으며(`None`는 플랫폼의 기본 메뉴를 복원합니다), `popup_menu(items)`(포인터 위치)와 `popup_menu_at(items, at)`는 메뉴가 닫히면 완료되는 `Answer<()>`를 반환합니다(await는 선택 사항입니다). 항목의 핸들러는 메뉴를 설정한 owner가 살아 있는 동안 그 owner 아래에서 실행됩니다.

메뉴를 바꾸려면 `setApplicationMenu`를 다시 호출하세요. `effect` 안에서는 읽는 signal을 따라가므로, 앱 상태에 따라 달라지는 체크 표시나 비활성 상태가 항상 최신으로 유지됩니다.

<a id="menu-items"></a>

### 메뉴 항목

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

| Field | Description |
|---|---|
| `label` | 항목에 표시되는 내용입니다. role 항목은 이 값이 없으면 자체 레이블을 사용합니다. |
| `onSelect` | 클릭이나 단축키로 항목이 선택되었을 때 호출됩니다. |
| `shortcut` | 키보드 단축키입니다. 수정자 키와 하나의 키를 `+`로 연결합니다(예: `"mod+n"`, `"mod+shift+z"`, `"alt+f4"`, `"f11"`). 수정자 키는 아래 표에 있습니다. 키는 문자, 숫자, 구두점이며 US 키보드에서 Shift 없이 그 키로 입력되는 문자로 적습니다(`,`, `/`, `?`는 `"shift+/"`). 또는 이름을 쓸 수 있습니다: `plus`(`=` / `+` 키, `=`도 가능), `minus`(`-`도 가능), `space`, `enter`(`return`), `escape`(`esc`), `tab`, `backspace`, `delete`(`del`), `insert`, 화살표 `up`, `down`, `left`, `right`(`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. 대소문자는 구분하지 않으며(`"Mod+Shift+N"`는 `"mod+shift+n"`와 같습니다. 대문자는 Shift가 아니라 같은 키입니다), 소문자 표기를 권장합니다. 유효하지 않은 단축키(`"mod-n"`, `"mod++"`, `"mod+?"`)는 올바른 표기를 알려 주는 오류를 던집니다. `keymap`도 같은 키 입력을 받습니다. 메뉴는 이를 플랫폼 고유의 스타일로 표시합니다(macOS에서는 `⇧⌘N`, Windows에서는 `Ctrl+Shift+N`). |
| `when` | GPUI 백엔드에서 텍스트 필드가 키보드 포커스를 가진 동안 단축키가 항목을 선택하는 경우를 정합니다. `"always"`(기본값), `"auto"`(필드가 그 키를 직접 사용하지 않는 한. 문자를 입력하거나 캐럿을 이동하거나 삭제하는 키와 편집 단축키가 해당하며, [`keymap`](./nsh.md#keymap)의 바인딩과 같습니다), 또는 `"notEditing"`입니다. 항목이 사용하지 않는 키는 필드로 전달됩니다. |
| `disabled` | `true`는 항목을 회색으로 비활성화합니다(기본값 `false`). |
| `checked` | 체크 표시가 있는 항목에는 (`true` 또는 `false`로) 설정합니다. |
| `submenu` | 항목을 서브메뉴로 만듭니다(`label`가 필요합니다). |
| `role` | 플랫폼이 직접 수행하는 표준 항목입니다(아래 참고). |

`null`, `undefined`, `false` 항목은 제외되므로 `cond && { … }`를 리스트 안에서 사용할 수 있습니다.

Rust에서 항목은 `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()`, `MenuItem::submenu(label, items)` 중 하나이며, 필드는 메서드로 제공됩니다: `.shortcut("mod+n")`(유효하지 않은 단축키에는 올바른 표기와 함께 panic이 발생합니다), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)`, 그리고 role 항목용 `.label(..)`.

수정자 키:

| Modifier | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (`cmdorctrl`도 가능) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (`command`, `meta`, `super`, `win`도 가능) | Command (⌘) | Windows key | Super |
| `ctrl` (`control`도 가능) | Control (⌃) | Ctrl | Ctrl |
| `alt` (`option`, `opt`도 가능) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

앱 자체 단축키에는 `mod`를 사용하세요. 각 플랫폼의 앱이 단축키에 쓰는 키(macOS에서는 ⌘N, Windows와 Linux에서는 Ctrl+N)이므로 하나의 표기로 모든 곳에 맞습니다. Windows key와 Super는 대부분 시스템이 사용하므로(Win+E, GNOME 개요), macOS 밖에서 `cmd`가 적합한 경우는 드뭅니다.

Roles:

| Role | Does | Platforms |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | 앱 메뉴의 표준 항목 | macOS (그 외에서는 제외됨) |
| `quit` | 앱을 종료합니다 | 모든 플랫폼 |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | 포커스된 텍스트 필드를 편집합니다(필드 자체의 단축키는 그대로 필드의 것입니다) | 모든 플랫폼 |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | 창 | 모든 플랫폼 |

role 항목은 자체 레이블과 단축키를 지정하지 않으면 플랫폼의 레이블과 단축키를 사용합니다(macOS는 `about`, `hide`, `quit`에 앱 이름을 덧붙입니다).

메뉴 단축키는 네이티브 앱처럼 가장 먼저 처리됩니다. 항목이 차지한 키는 포커스된 텍스트 필드나 NSH 자체의 키에 도달하지 않습니다. 같은 키 입력에 대한 [`keymap`](./nsh.md#keymap)의 바인딩만 메뉴보다 먼저 처리됩니다. 따라서 편집 단축키(`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`)는 텍스트 필드로 전달해 주는 edit role에만 지정하세요. 수정자 키 없는 키(`escape`, 화살표, 문자)는 텍스트 필드와 뒤로 가기 내비게이션에서 해당 키를 빼앗게 되므로 피하세요. GPUI 백엔드에서는 `when: "auto"`로 항목이 텍스트 필드와 키를 공유할 수 있습니다. `delete`나 `mod+z`는 필드에 포커스가 없을 때는 항목을 선택하고, 있을 때는 텍스트를 편집합니다.

GPUI 백엔드에서 키보드 포커스를 가진 네이티브 컴포넌트는 모든 키를 가장 먼저 받습니다. 컴포넌트가 직접 처리하는 키는 keymap이나 메뉴에 도달하지 않습니다. 컴포넌트가 통과시킨 키는 텍스트 필드에 포커스가 있는 것처럼 keymap에 도달하고, 그다음 메뉴에 도달합니다.

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

버튼을 눌러 여는 컨텍스트 메뉴:

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
> 메뉴는 시스템의 것입니다(NSMenu, Win32 menus, GTK popover menus). 다른 모든 앱의 메뉴와 같은 모습과 동작을 보이고, 시스템(또는 앱)의 외관을 따르며, 키보드로 접근할 수 있습니다. `examples/desktop`는 자체 타이틀 바, 애플리케이션 메뉴, 컨텍스트 메뉴를 갖춘 앱입니다.
