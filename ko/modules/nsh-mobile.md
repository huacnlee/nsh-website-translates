---
title: "nsh/mobile"
description: "iOS와 Android가 제공하는 기능: 시스템 탭 바인 TabBar, iOS의 InputAccessoryView, Android의 BackHandler, 그리고 isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

iOS와 Android에 특화된 기능은 `nsh/mobile`에 있습니다. 두 플랫폼 모두에서 시스템 탭 바(`TabBar`), iOS에서 키보드 위의 바인 [`InputAccessoryView`](#inputaccessoryview), Android에서 뒤로 가기 버튼을 다루는 [`BackHandler`](#backhandler)을 제공합니다. Rust 코드: `nsh_core::mobile`, `nsh_core::prelude` 사용. TSX: `nsh/mobile` import. 이 모듈은 모든 플랫폼에서 import할 수 있으므로 하나의 번들이 어디서나 실행됩니다. 다른 플랫폼에서는 컴포넌트가 공간을 차지하지 않고 호출은 즉시 반환되며, `isAvailable`로 iOS인지 Android인지 알 수 있습니다(어느 쪽인지는 `nsh`의 `platform.os`로 확인). 데스크톱 기능은 [nsh/desktop](./nsh-desktop.md)에 있습니다.

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

## Scope

이 모듈은 모바일 플랫폼에 특화된 기능, 예를 들어 앱 최상위 내비게이션을 위한 시스템 탭 바를 제공합니다. 공통 컨트롤은 [`nsh/base`](./nsh-base.md)에 속합니다. 예를 들어 [Switch](../elements/switch.md)는 휴대폰, 데스크톱, 웹에서 동작과 API를 공유하며, 트랙, 썸, 상태 스타일은 앱이 제공합니다. 모바일 앱 내비게이션용은 `TabBar`, 플랫폼 공통 탭 콘텐츠용은 `Tabs`입니다. 모바일 고유의 상호작용 의미를 가진 기능만 여기에 속합니다. 시스템 외관, 크기, 애니메이션만으로는 공통 컨트롤의 공유된 역할이 바뀌지 않습니다. 이 구분이 어떤 기능이 여기에 속하는지를 정합니다([목표 및 설계 원칙](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

iOS, iOS 시뮬레이터, Mac Catalyst, Android에서는 `true`, 그 외에서는 `false`입니다. Rust: `matches!(os(), Os::Ios | Os::Android)`.

## TabBar

탭 바는 앱의 최상위 섹션(기록과 통계, 받은편지함과 설정 등) 사이를 전환합니다. 시스템 자체의 바(`TabBar`)이므로 시스템 앱과 같은 모습과 동작을 보입니다. iOS와 iPadOS에서는 `UITabBar`(iOS 26의 Liquid Glass와 그 선택 표시), Android에서는 Material 3의 내비게이션 바이며, 시스템 색상으로 라이트와 다크를 지원합니다. 앱은 탭(`items`)을 제공하고, 선택된 탭(`selectedIndex`)을 지정하고, 사용자의 선택(`onChange`)을 받고, 바의 위치(`class`, `style`)를 정하며, 선택된 섹션의 콘텐츠는 직접 표시합니다. 페이지 안의 탭이나 모든 플랫폼용 탭에는 `nsh/base`의 [Tabs](../elements/tabs.md)를 사용하세요.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar`: `nsh/mobile`에서 가져오며, Rust에서는 `nsh_core::mobile`입니다. 선택 상태는 앱이 관리합니다. 탭하면 탭의 인덱스(`{ index }`)와 함께 `onChange`이 보고되고, 시스템 바처럼 바는 선택을 즉시 표시하며, 앱은 해당 섹션을 표시하고 그 인덱스를 `selectedIndex` 값으로 다시 전달합니다. 스타일에서 높이를 지정하지 않으면 시스템 기본 높이를 사용합니다. Rust에서는 `tab_bar()`로 바를 만들며, prop마다 setter(`.items(..)`, `.selected_index(..)`), 이벤트마다 리스너(`.on_change(..)`), 타입이 지정된 스타일 메서드가 있습니다. 탭은 `TabBarItem::new(title).icon(name)`로 만듭니다.

### Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | 탭 목록이며 순서대로 표시됩니다. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | 선택된 탭의 인덱스이며, 탭 범위를 벗어난 인덱스는 아무것도 선택하지 않습니다. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: 전환 없이 바를 숨깁니다. push와 pop 사이에서 이 값은 앱이 관리합니다. 이 prop과 표시 중인 스택의 `hidesBottomBarWhenPushed` 요청이 모두 false일 때 바가 표시됩니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 바의 위치와 크기. 외관은 시스템의 것이며, 선택된 탭은 테마의 `primary` 색으로 표시됩니다. |
| `testID` | `.test_id(..)` | `string` | 없음 | 테스트와 `nsh test --trace`에서 바를 찾는 데 사용합니다. |

#### TabBarItem

| 필드 | Rust | 타입 | 설명 |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | 탭의 제목이며 스크린 리더가 읽어 줍니다. |
| `icon` | `.icon(name)` | `string` | 플랫폼별 이름으로 지정하는 탭의 아이콘입니다. iOS에서는 [SF Symbol](https://developer.apple.com/sf-symbols/)(`"house"`), Android에서는 앱의 drawable입니다(`res/drawable/home.xml` = `"home"`, 시스템 아이콘은 `"android:ic_menu_search"`). 플랫폼별 선택: `platform.select`. |

### Events

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | 사용자가 탭을 선택했습니다(`{ index }`: 탭의 인덱스). 바는 선택을 즉시 표시하며, 앱은 탭의 콘텐츠를 표시하고 `selectedIndex` 값을 설정합니다. |

### Platform notes

- **iOS 및 Mac Catalyst**: `UITabBar`를 사용하며, iOS 버전에 맞는 시스템 외관을 따릅니다(iOS 26에서는 떠 있는 Liquid Glass 바와 그 선택 표시). 아이콘은 SF Symbol입니다. 테마의 `primary` 값이 바의 `tintColor`(선택된 탭의 색상)이 되며, 나머지 탭은 시스템 색상을 유지합니다.
- **Android**: 플랫폼 뷰로 만들어진 Material 3의 내비게이션 바입니다. 각 레이블 위의 활성 인디케이터 안에 아이콘이 있고, 누르면 리플이 나타나며, Android 12 이상에서는 시스템 동적 색상, 그 이전에는 Material 기본 색상을 사용하고, 앱의 외관에 따라 라이트 또는 다크로 표시됩니다. 창 하단에서는 Material처럼 내비게이션 바 아래까지 확장되어 inset만큼 더 높습니다. 아이콘은 앱의 drawable입니다(바가 색을 입힙니다). 선택된 탭의 아이콘과 레이블은 테마의 `primary` 색을 사용하며, 그 색의 12% 불투명도로 된 활성 인디케이터 위에 표시됩니다. 나머지 탭은 시스템 색상을 유지합니다.
- **데스크톱(macOS, Windows, Linux, GPUI)과 웹**: 섹션은 앱의 외관을 따르는 [Tabs](../elements/tabs.md)로 표시됩니다. 그곳에서는 `TabBar`이 공간을 차지하지 않으므로 하나의 레이아웃에 둘을 모두 담고 `platform.os`로 선택합니다([`nsh`의 device API](./nsh.md#device)).

## InputAccessoryView

iOS와 Mac Catalyst에서 동작하며, Android에서는 비어 있는 숨겨진 뷰입니다.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

키보드 위의 바(UIKit의 `inputAccessoryView`)로, 입력의 `ios={{ inputAccessoryViewID }}` 값이 바의 `nativeID` 값과 일치하는 입력에 포커스가 있는 동안 표시됩니다. Rust: `input_accessory_view(native_id)`, `.input_accessory(native_id)` 값이 일치하는 입력에 대해 표시됩니다. 너비는 창과 같고 높이는 콘텐츠에 맞으며, 키보드와 함께 네이티브로 움직입니다.

| Prop | 타입 | Rust | 설명 |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | 이 `inputAccessoryViewID` 값을 가진 입력에 바가 표시됩니다. |
| `style` | `StyleProp<ViewStyle>` | `Styled` 메서드(`.bg(…)`) | 바의 스타일(예: 배경). |
| `class` | `string` | | Tailwind 클래스. |
| `children` | `JSX.Element` | `.child(…)` | 바의 콘텐츠. |

트리에서 배치된 위치에는 아무것도 렌더링하지 않으며 Android에서는 전혀 렌더링하지 않으므로, 연결된 입력 옆에 두어도 됩니다.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

[폼과 키보드](../docs/forms-and-keyboard.md)도 참고하세요.

## BackHandler

Android에서 동작하며, iOS에서는 리스너가 보관만 되고 호출되지 않으며 `exitApp()` 호출은 즉시 반환됩니다.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

시스템 뒤로 가기 버튼과 뒤로 가기 제스처를 다룹니다. 뒤로 가기 입력은 다이얼로그가 먼저 처리하고(다이얼로그가 닫힘), 그다음 `BackHandler`의 리스너가 가장 최근에 추가된 것부터 실행됩니다. 어느 리스너도 처리하지 않으면 최상위 내비게이션 스택이 pop되고, 돌아갈 페이지가 없으면 앱이 종료됩니다.

| 멤버 | Rust | 설명 |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | 리스너(`listener`)는 입력을 처리했을 때 `true` 값을 반환합니다. 리스닝을 중단하는 함수를 반환하며, 컴포넌트가 렌더링되는 동안(또는 effect가 실행되는 동안) 추가된 리스너는 Rust와 TSX 모두에서 해당 컴포넌트와 함께 중단됩니다. |
| `exitApp()` | 리스너가 `false` 반환 | 앱을 종료합니다. `false` 값을 반환하는 Rust 리스너는 입력을 계속 진행시키므로, 스택이 뒤로 가거나 앱이 종료됩니다. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> 리스너는 시스템이 뒤로 가기 입력을 전달한 뒤에 실행되며, 메인 스레드는 앱 코드를 기다리지 않습니다. 리스너가 하나 이상 등록되어 있는 동안 NSH는 다이얼로그가 남긴 뒤로 가기 입력을 가져가고, `true` 값을 반환하는 리스너가 없으면 최상위 스택에서 뒤로 가거나 앱을 직접 종료합니다.

상태 표시줄은 iOS와 Android 모두에서 `nsh/base`의 [페이지와 다이얼로그](./nsh-base.md#status-bar)가 가진 `statusBar`로 설정합니다.
