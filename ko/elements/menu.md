---
title: "Menu"
description: "MenuItem, MenuSeparator, Submenu를 사용하는 Menu와 ContextMenu: 데스크톱에서는 계단식 하위 메뉴가 있는 팝업으로, 휴대폰에서는 하위 메뉴가 제자리에서 펼쳐지는 시트로 표시되며, 앱에서 스타일을 지정할 수 있습니다."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

메뉴는 트리거가 여는 액션의 목록입니다. 하나의 구조가 모든 기기에서 쓰이며, 각 기기가 기대하는 방식으로 표시됩니다.

- 데스크톱과 데스크톱 브라우저에서는 트리거 위치에 팝업으로 표시됩니다. `Submenu`의 팝업은 포인터를 항목 위에 올리거나 항목을 누르면 해당 항목 옆에 계단식으로 열립니다.
- 휴대폰과 태블릿에서는 화면 하단에 백드롭 위로 시트가 나타납니다. `Submenu`의 항목은 메뉴의 항목 대신 시트 안에 표시되며, 맨 앞에 사용자가 지정한 행이 있어 이전으로 돌아갈 수 있습니다.

항목을 선택하거나, 바깥을 누르거나, Escape, Android 뒤로 가기 버튼, VoiceOver의 이스케이프 제스처를 사용하면 메뉴가 닫힙니다. 같은 메뉴를 보조 버튼(오른쪽 클릭)으로 포인터 위치에서 열거나, 터치 화면에서는 트리거를 손가락으로 길게 눌러 여는 것이 `ContextMenu`입니다.

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

다섯 가지 모두 [`nsh/base`](../modules/nsh-base.md)에서 가져옵니다. 항목은 알아서 메뉴에 전달되므로 자유롭게 배치할 수 있습니다. 뷰로 묶은 그룹, 레이블, `If`로 나타났다 사라지는 항목 모두 가능합니다. `popupClass`로 데스크톱의 팝업과 휴대폰의 시트에 스타일을 지정하며, 둘의 스타일이 달라야 하면 `platform.idiom`(`nsh`)을 `"desktop"`와 비교하면 됩니다.

<a id="menu-bars"></a>

## 메뉴 막대

하나의 `Toolbar` 안의 항목들을 트리거로 가진 메뉴들은 메뉴 막대를 이룹니다. 그중 하나가 열려 있을 때 다른 메뉴의 트리거 위에 포인터를 올리면 그 메뉴가 대신 열리고, 화살표 키로 트리거 사이를 이동합니다.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## 컨텍스트 메뉴

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

데스크톱에서는 보조 버튼을 누르면 포인터가 있는 위치에 열립니다. 터치 화면에서는 트리거를 손가락으로 길게 누르면 시트로 열립니다. 트리거 자체의 누름과 주변 스크롤 뷰는 계속 동작하며, 손가락을 움직이면 길게 누르기가 취소됩니다.

<a id="checkable-items"></a>

## 체크 가능한 항목

`checked`로 항목을 체크 가능하게 만듭니다. 메뉴가 보여 주는 설정("Show sidebar")이 될 수도 있고, `role="menuitemradio"`을 함께 쓰면 그룹 중 하나의 선택("Sort by")이 될 수도 있습니다. 값은 사용자가 관리합니다. 항목을 선택하면 `onSelect`가 호출되고, 다음 값을 설정하면 항목이 그 값을 표시합니다. 체크된 동안에는 항목의 `checked:` 클래스와 `checkedStyle`이 적용되며, 인디케이터의 것도 함께 적용됩니다. 인디케이터는 콘텐츠 앞쪽의 영역(`indicatorClass`, `indicatorStyle`)으로, 지정한 표시(`indicator`)를 감쌉니다. 표시는 한 번 만들어 유지되며, 인디케이터의 `checked:` 클래스로 표시를 보이거나 숨기거나, 표시 자체의 `group-checked:` 클래스를 `indicatorClass`의 `group`과 함께 사용합니다. `closeOnSelect={false}`는 메뉴를 열린 채로 유지하므로 설정이 새 값을 즉시 보여 줍니다.

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

후행 가장자리의 표시는 대신 콘텐츠 안에 넣고, 항목의 `group` 아래 `group-checked:` 클래스로 스타일을 지정합니다.

<a id="entrance-and-exit"></a>

## 진입과 퇴장

데스크톱에서 팝업은 [Popover](./popover.md#entrance-and-exit)의 경우처럼 사용자가 정의한 트랜지션에 따라 나타나고 사라집니다. `popupStartingClass`: 첫 프레임에서의 모습. `popupEndingClass`: 닫힌 뒤의 모습으로, `popupClass`의 `transition-*` 클래스가 실행되는 동안 유지됩니다. 이어서 `onClose`가 뒤따릅니다. 서브메뉴도 같은 모습을 사용하며 메뉴와 함께 닫힙니다. 휴대폰의 시트는 스스로 슬라이드하며 들어오고 나갑니다.

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

## 열림 상태

`open` 없이는 메뉴가 자체 상태를 유지합니다(`Menu`에 대한 `defaultOpen`에서 시작). `open` 사용 시에는 앱이 상태를 소유하며 `onOpenChange({ open, reason })`에서 변경합니다: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` 또는 `"longPress"`.

## Props

<a id="menu-1"></a>

### Menu

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 없음 | 열림 여부. 앱이 제어합니다. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` 없이 처음부터 열려 있습니다. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 데스크톱: 트리거의 어느 쪽에 표시할지 지정합니다. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | 데스크톱: 트리거와 정렬하는 방식입니다. |
| `offset` | `.offset(..)` | `number` | `0` | 데스크톱: 트리거와 팝업 사이의 간격입니다. |
| `margin` | `.margin(..)` | `number` | `0` | 데스크톱: 안전 영역 가장자리에서 유지하는 거리입니다. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업(데스크톱) 또는 시트(휴대폰), 그리고 서브메뉴의 팝업입니다. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 데스크톱: 팝업의 첫 프레임 모습이며, 팝업 자체의 스타일 위에 적용됩니다. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 데스크톱: 팝업이 닫힌 뒤의 모습이며, 트랜지션이 실행되는 동안 유지됩니다. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 휴대폰: 시트 뒤의 백드롭입니다. |
| `trigger` | `.trigger(..)` | `JSX.Element` | 없음 | 누르면 메뉴를 여는 요소입니다. 메뉴가 열려 있는 동안 `aria-expanded:` 클래스와 `expandedStyle`이 적용됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 항목들이며, 메뉴가 열릴 때마다 만들어집니다. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, 시작 및 종료 모습, `backdropClass` / `backdropStyle`, `trigger`, `children`은 `Menu`의 경우와 같으며, 추가로 다음이 있습니다.

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 보조 버튼과 길게 누른 손가락에 아무 반응도 하지 않습니다. |
| `offset` | `.offset(..)` | `number` | `0` | 데스크톱: 포인터와 팝업 사이의 간격입니다. |
| `margin` | `.margin(..)` | `number` | `0` | 데스크톱: 안전 영역 가장자리에서 유지하는 거리입니다. |

### MenuItem

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 선택할 수 없으며 `disabled:` 스타일이 적용됩니다. |
| `checked` | `.checked(..)` | `boolean` | 없음 | 체크 여부이며, 이를 지정하면 체크 가능한 항목이 됩니다. 앱이 소유합니다. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | 없음 | 체크된 동안의 스타일이며, `checked:` 클래스로 지정합니다. |
| `role` | `.role(..)` | `AccessibilityRole` | `checked` 지정 시 `"menuitemcheckbox"`, 그 외 `"menuitem"` | 스크린 리더에 대한 항목의 역할이며, 그룹 중 하나의 선택에는 `"menuitemradio"`를 사용합니다. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 인디케이터, 즉 콘텐츠 앞쪽의 영역이며, `checked:` 및 `disabled:` 클래스가 항목을 따릅니다. |
| `indicator` | `.indicator(..)` | `JSX.Element` | 없음 | 인디케이터 안의 표시입니다. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | 선택하면 메뉴가 닫힙니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 콘텐츠만으로 부족할 때 스크린 리더가 읽는 내용입니다. |
| `children`, `class`, `style` | `.child(..)`, 스타일 메서드 | | 없음 | 콘텐츠와 모습이며, `hover:`, `active:`, `checked:` 상태를 지원합니다. |

### Submenu

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | 없음 | 서브메뉴를 여는 항목입니다. |
| `back` | `.back(..)` | `JSX.Element` | 없음 | 휴대폰: 항목들 위에 놓여 주변 항목으로 돌아가게 하는 행입니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 열리지 않습니다. |
| `offset` | `.offset(..)` | `number` | `0` | 데스크톱: 주변 메뉴와 서브메뉴 팝업 사이의 간격입니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 서브메뉴의 항목들입니다. |

`MenuSeparator`: 스타일을 지정하는 뷰(`class`, `style`)로, 같은 레벨의 항목과 함께 표시됩니다.

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | 열리거나 닫혔으며, 그 이유가 함께 전달됩니다. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | 표시되었습니다. 시트의 경우 들어온 뒤에 발생합니다. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | 사라졌습니다. 시트는 나간 뒤에, 팝업은 퇴장이 끝난 뒤에 발생하며, 앱이 닫은 경우에도 발생합니다. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | 데스크톱: 팝업이 배치되었습니다. `placement`(표시된 쪽), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | 사용자가 항목을 선택하지 않고 닫으려 했습니다(Escape 또는 뒤로 가기, 바깥이나 백드롭 누름). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | 항목이 선택되었습니다. 체크 가능한 항목은 반대 값을 요청합니다. |

<a id="accessibility"></a>

## 접근성

팝업 또는 시트는 스크린 리더에 메뉴로, 그 항목은 메뉴 항목으로 노출되며, 트리거는 메뉴가 펼쳐져 있는지 알려 줍니다. 체크 가능한 항목은 체크박스 또는 라디오 메뉴 항목이며 체크됨 또는 체크되지 않음으로 읽히고, 인디케이터는 항목의 일부입니다. TSX에서 트리거는 전달하는 요소로, `Button` 또는 직접 만든 뷰입니다. 트리거가 누름과 펼침 상태를 스스로 처리하므로, 눌려 있는 동안 자체 `active:` 클래스와 `activeStyle`이 적용되고 자체 `onPress`도 실행됩니다. 표시된 레벨의 항목만 화면에 있으므로 스크린 리더는 그곳에 있는 것을 읽습니다.
