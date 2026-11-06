---
title: "Button"
description: "Button 컴포넌트: 누르기 동작, disabled 및 selected 상태, 스크린 리더를 위한 역할을 관리하며 앱에서 스타일을 지정하는 누르기 대상입니다."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

버튼은 누르기 대상(press target)입니다. 동작은 버튼이 맡습니다. 누르기, 앱의 상태 스타일을 통한 누름 피드백, 비활성(disabled) 및 선택(selected) 상태, 키보드 포커스, 스크린 리더를 위한 역할(role)이 여기에 해당합니다. 모양은 앱의 몫입니다. `Button`에는 자체 색상, 크기, 패딩, 레이블이 없으므로, 어떤 스타일과 자식 요소를 주느냐에 따라 하나의 컴포넌트가 기본 버튼, 아이콘 버튼, 탭, 툴바 토글, 목록의 행 등이 됩니다.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button`는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. TSX에서 모양은 `class` 및 `style`로 정하고, 상태 변형은 `active:`, `hover:`, `focus:`, `selected:`, `disabled:`(또는 대응하는 `activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle`, `disabledStyle`)을 사용합니다. Rust에서는 `view()`가 뷰를 만들듯 `button()`가 버튼을 만들며, prop마다 setter(`.disabled(..)`, `.selected(..)`), 이벤트마다 리스너(`.on_press(..)`), 모양을 위한 타입 지정 스타일 메서드(`.px_4()`, `.bg(..)`), 상태를 위한 상태 메서드(`.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`), 콘텐츠를 위한 `.child(..)`를 제공합니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기와 누름 피드백이 없습니다. `disabled:` 스타일이 적용되고 스크린 리더는 흐리게 표시된(dimmed) 상태라고 알립니다. |
| `selected` | `.selected(..)` | `boolean` | `false` | 선택됨: 켜진 토글, 현재 탭. 스크린 리더가 이를 알립니다. 값은 앱이 소유하며 스타일도 앱이 지정합니다. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | `selected` 상태이고 비활성이 아닐 때의 스타일로, `selected:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 아이콘처럼 콘텐츠만으로는 부족할 때 스크린 리더가 읽는 내용입니다. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | 해당 컨트롤에 맞는 `nsh/base` 컴포넌트가 없을 때 스크린 리더에 알리는 컨트롤의 종류입니다. 예: `"link"`(URL을 엽니다), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 없음 | 경계 바깥으로 얼마나 떨어진 곳까지 누르기로 인정할지를 포인트 단위로 지정합니다. 모든 변에 같은 숫자 하나를 쓰거나 변별로 지정합니다. 뷰의 `hitSlop`와 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 콘텐츠: 텍스트, 아이콘, 모든 레이아웃. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 모양 전체. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스, 비활성 상태일 때의 스타일로, `<state>:` 클래스로 지정합니다. 뒤의 상태가 우선하며 `disabled`가 모든 상태에 우선합니다. |

Rust에서 각 prop은 값, signal 또는 클로저를 받는 setter이며, 생략한 prop은 기본값을 유지합니다.

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | 버튼이 눌렸습니다. 탭, 클릭, 키보드 포커스가 있을 때의 Return 또는 Space, 또는 스크린 리더의 활성화가 해당합니다. |
| `onPressDown` | `.on_press_down(\|\| ..)` | 버튼 위에서 누르기가 시작되었습니다. |
| `onPressUp` | `.on_press_up(\|\| ..)` | 누르기가 끝났습니다. 뗐거나, 버튼을 벗어났거나, 취소된 경우입니다. |

`onPressDown` 및 `onPressUp`는 스프링이나 하이라이트처럼 상태 스타일로 표현할 수 없는 자체 누름 피드백을 위한 것입니다. 비활성 버튼은 이 중 어떤 것도 보고하지 않습니다.

<a id="styling"></a>

## 스타일링

버튼의 모양은 앱의 몫입니다. 무엇이 기본 버튼이고 무엇이 보조 버튼인지는 앱이 정합니다. 작은 컴포넌트 한 쌍을 두면 그 결정을 한곳에 모아 둘 수 있습니다.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

상태 변형은 네이티브로 적용됩니다. 누르면 JS나 Rust가 실행되지 않아도 메인 스레드에서 버튼이 어두워집니다. Rust에서도 상태 메서드는 같은 변형입니다. `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`는 버튼 자체의 상태를 따릅니다. 테마의 색상도 같은 방식으로 동작합니다. TSX에서는 `bg-primary`, Rust에서는 `theme().primary`를 사용합니다([Theme tokens](../docs/tailwind.md#theme-tokens) 참조).

<a id="disabled"></a>

## 비활성 상태

비활성 버튼은 누르기를 받지 않고 피드백도 주지 않으며, 스크린 리더는 흐리게 표시된 것으로 알립니다. 비활성일 때의 모양은 앱이 정하며, `disabled:` 클래스 또는 `disabledStyle`로 지정합니다.

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## selected로 만드는 토글

`selected`는 버튼을 토글로 만듭니다. 툴바의 굵게 버튼, 필터 칩, 현재 탭이 그 예입니다. 값은 앱이 보관하고 `onPress`에서 뒤집으며, 선택 상태의 스타일도 앱이 지정합니다. 스크린 리더는 버튼을 선택됨으로 알립니다.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

탭 행은 [`Tabs`](./tabs.md), 켜짐/꺼짐 컨트롤은 `nsh/base`의 [`Switch`](./switch.md)입니다. 이들은 해당 종류의 역할, 선택 상태, 키보드 동작을 직접 담당하는데, `role="tab"` 또는 `role="switch"`를 지정한 `Button`는 그렇지 않습니다.

<a id="a-small-target-with-hitslop"></a>

## hitSlop으로 작은 터치 영역 보완

아이콘 버튼은 손가락보다 작을 수 있습니다. `hitSlop`는 버튼 근처에 닿은 누르기도 인정되게 하며, 각 변 바깥으로 포인트 단위로 지정합니다. 레이아웃이나 모양은 바뀌지 않습니다. 모든 변에 같은 숫자 하나를 쓰거나 변별로 지정(`{ top: 8, bottom: 8 }`)할 수 있으며, [뷰의 `hitSlop`](./index.md#presses-and-feedback)와 같은 방식입니다.

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## 접근성

- 버튼은 스크린 리더에게 하나의 요소이며, `role`에서 달리 지정하지 않는 한 역할은 `"button"`입니다. 레이블은 텍스트 콘텐츠이며, 콘텐츠가 아이콘이거나 정보가 부족하면 `accessibilityLabel`를 지정하세요.
- `disabled` 및 `selected`는 각 플랫폼의 방식대로 알려집니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).
- macOS와 웹에서 버튼은 키보드 포커스 정지점입니다. Tab으로 이동하고, Return과 Space로 누르며, `focus:` 스타일이 포커스 위치를 보여 줍니다.

레이블, 역할, 알림에 대한 일반적인 내용은 [Accessibility](../docs/accessibility.md)를 참조하세요.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS, Android, Mac Catalyst: 누르기는 버튼 위에서 끝나는 탭입니다. 시스템 자체 버튼처럼 버튼을 벗어나면 취소됩니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누르기는 클릭입니다. macOS와 웹에서는 키보드 포커스가 있는 버튼을 Return과 Space로도 누를 수 있습니다. `hover:` 스타일은 마우스나 트랙패드 포인터에서 적용됩니다.
- 모든 플랫폼은 앱이 스타일로 지정한 것을 그립니다. 누름 피드백은 `active:` / `activeStyle` 또는 직접 만든 애니메이션입니다.
