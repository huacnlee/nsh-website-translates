---
title: "Toggle"
description: "Toggle 및 ToggleGroup: 켜짐 또는 꺼짐 상태를 가지는 버튼과 그러한 버튼들로 구성된 툴바입니다. 각 Toggle은 누르기, 키보드 활성화, 비활성화 상태, 그리고 스크린 리더를 위한 역할과 눌림 상태를 직접 처리하며, 그룹은 키보드 포커스 정류장이 하나인 툴바입니다. 모양과 어떤 Toggle이 눌린 상태인지는 앱이 결정합니다."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

토글은 켜짐 또는 꺼짐 상태를 유지하는 버튼입니다. 텍스트 툴바의 굵게, 즐겨찾기 별, 보기 옵션 등이 그 예입니다. `Toggle`는 토글 하나의 동작을 담당합니다. 누르기, 키보드 활성화, 비활성 상태, 그리고 스크린 리더가 토글 버튼으로 안내하도록 하는 눌림 상태를 가진 버튼 역할이 여기에 포함됩니다. 여러 토글을 감싸는 `ToggleGroup`은 툴바입니다. 스크린 리더는 이를 하나의 툴바로 안내하고, 키보드는 한 번에 툴바로 진입해 방향키로 토글 사이를 이동합니다. 모양은 앱의 몫입니다. 토글에는 자체 색상, 크기, 아이콘, 레이블이 없습니다. 자식은 앱의 아이콘이나 레이블이며, 토글에 지정한 `aria-pressed:` 클래스나 토글 안쪽 요소에 지정한 `group-aria-pressed:` 클래스가 토글의 상태를 따릅니다.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle`와 `ToggleGroup`은 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 값은 앱이 가집니다. 각 토글은 눌린 상태인지 여부를 전달받고, 누르면 요청하는 값을 `onChange`로 보고하며, 토글은 앱이 다시 전달한 `pressed`를 표시합니다. 그룹도 값을 가지지 않으므로 몇 개의 토글을 누를 수 있는지도 앱이 정합니다. 개수 제한이 없을 수도 있고(굵게, 기울임, 밑줄), 정확히 하나일 수도 있습니다(정렬, 보기 전환기). 하나만 허용하는 경우 앱은 요청된 토글을 누른 상태로 만들고, 나머지는 해제하며, 이미 눌린 토글은 계속 눌린 상태로 유지합니다. Rust에서는 `toggle()`와 `toggle_group()`로 이들을 만들며, prop마다 setter(`.pressed(..)`), 이벤트마다 리스너(`.on_change(..)`), 타입이 지정된 스타일 메서드, 내용을 위한 `.child(..)`를 제공합니다.

## Props

<a id="toggle-1"></a>

### Toggle

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | 켜짐 또는 꺼짐입니다. 스크린 리더는 눌린 상태라고 안내하며 `aria-pressed:` 스타일이 적용됩니다. 누르면 반대 값을 `onChange`로 보고하고, 토글은 앱이 다시 전달한 값을 표시합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기와 누름 피드백이 없습니다. `disabled:` 스타일이 적용되고 스크린 리더는 흐리게 표시된 상태라고 안내합니다. 비활성화된 `ToggleGroup` 안의 토글도 비활성화됩니다. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 눌렸고 비활성화되지 않은 동안의 토글 스타일이며, `aria-pressed:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 읽는 내용입니다. 자식에 그 역할을 하는 텍스트가 없을 때(아이콘) 토글이 무엇을 켜는지 설명합니다. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 없음 | 경계 바깥으로 얼마나 떨어진 위치까지 누르기로 인정할지를 포인트 단위로 지정합니다. 모든 변에 같은 숫자 하나를 쓰거나 변별로 이름을 지정합니다. 뷰의 `hitSlop`와 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 앱의 아이콘 또는 레이블이며, 스크린 리더가 읽습니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 토글 자체, 즉 내용을 둘러싼 표면입니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 누르는 중, 호버, 포커스, 비활성 상태일 때의 토글 스타일이며, `<state>:` 클래스로 지정합니다. |

### ToggleGroup

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 그룹의 모든 토글이 각자의 `disabled`와 관계없이 비활성화됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 그룹의 토글들과, 그 사이에 앱이 배치하는 모든 요소(구분선)입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 그룹의 레이아웃과 모양입니다. 기본은 열이며, 행으로 배치하려면 `flex-row`를 사용합니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | 토글이 눌렸습니다. 탭, 클릭, 키보드 포커스가 있는 상태에서의 Space 또는 Return, 스크린 리더의 활성화가 이에 해당합니다. `{ pressed }`는 토글이 요청하는 값이며 `pressed`의 반대입니다. 아무것도 바뀌기 전에 실행되며, 토글은 앱이 다시 전달한 `pressed`를 표시합니다. |

`ToggleGroup`의 방향키는 키보드 포커스만 이동할 뿐 아무것도 누르지 않습니다. 비활성화된 토글은 아무것도 보고하지 않습니다.

<a id="parts"></a>

## 구성 요소

| 구성 요소 | 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 그룹 | | `ToggleGroup`의 `class`, `style` | |
| 토글 | 그룹 안 또는 어디든 | `Toggle`의 `class`, `style` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (또는 `pressedStyle`, `disabledStyle`, ...) |
| 아이콘 또는 레이블 | 토글 안 | 자체 요소 (`children`) | `group-aria-pressed:`, `group-disabled:` 및 토글의 `class`에 `group`를 둔 나머지 `group-*:` 변형 |

`aria-pressed:`는 토글이 켜진 상태이고, `active:`은 켜짐 여부와 관계없이 누르는 중인 상태입니다. 눌린 토글은 채움, 도드라진 알약 모양, 더 강한 아이콘처럼 토글 자체의 표면으로 표현하세요([디자인 가이드](../docs/design-guides.md#interaction-states) 참고).

## Segmented

토글이 서로 붙어 있고 한 번에 하나만 눌리는 그룹은 세그먼트 컨트롤(보기 전환기)입니다. 앱은 값 하나를 유지하고 그 값에 해당하는 토글을 누른 상태로 만듭니다. 붙어 있는 모양은 앱의 클래스로 만듭니다.

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

## Disabled

비활성화된 토글은 누르기를 받지 않으며, 스크린 리더는 흐리게 표시된 상태라고 안내합니다. 토글의 `disabled:` 클래스가 `aria-pressed:` 클래스보다 우선 적용되고, 그 안쪽의 `group-disabled:` 클래스도 따라갑니다. `ToggleGroup`의 `disabled`는 그 안의 모든 토글을 비활성화하며, 앱이 잠그는 툴바에 해당합니다.

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop으로 작은 대상 다루기

아이콘 토글은 손가락보다 작을 수 있습니다. `hitSlop`은 토글 근처에 닿은 누르기도 각 변 바깥쪽 포인트 단위로 인정하며, 레이아웃이나 모양은 바꾸지 않습니다. 모든 변에 같은 숫자 하나를 쓰거나 변별로 이름을 지정하며(`{ top: 8, bottom: 8 }`), [뷰의 `hitSlop`](./index.md#presses-and-feedback)이 받는 방식과 같습니다.

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## 접근성

- 토글은 스크린 리더에게 하나의 요소이며, `"button"` 역할과 눌림 상태를 가진 토글 버튼입니다. 레이블은 자식의 텍스트이거나 `accessibilityLabel`입니다.
- `ToggleGroup`은 `"toolbar"` 역할을 가집니다. 스크린 리더는 그 안의 토글들을 하나의 툴바로 인식하지만, 각 토글은 여전히 별도의 요소입니다.
- `disabled`은 플랫폼이 안내하는 방식대로 안내됩니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).
- macOS와 웹에서 그룹은 키보드 포커스의 정류장 하나이며, 방향키로 그 안의 토글 사이를 이동합니다(아래 참고).

레이블, 역할, 안내 전반에 대해서는 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="keyboard"></a>

## 키보드

Tab이 누르기를 받는 뷰에 도달하는 macOS와 웹에서 `ToggleGroup`은 [WAI-ARIA 툴바 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)을 따릅니다.

| 키 | 동작 |
|---|---|
| Tab, Shift+Tab | 눌린 첫 번째 토글로 그룹에 진입하며(눌린 토글이 없으면 비활성화되지 않은 첫 번째 토글), 한 번에 그룹을 벗어납니다. |
| Right, Down | 포커스를 다음 토글로 옮기며, 마지막에서는 첫 번째로 돌아갑니다. |
| Left, Up | 포커스를 이전 토글로 옮기며, 첫 번째에서는 마지막으로 이동합니다. |
| Home, End | 포커스를 첫 번째 또는 마지막 토글로 옮깁니다. |
| Space, Return | 포커스된 토글을 누릅니다. |

방향키는 비활성화된 토글을 건너뛰고 아무것도 누르지 않습니다. 토글은 눌렸을 때만 바뀝니다. 그룹의 레이아웃(앱의 클래스)과 관계없이 두 쌍의 방향키가 모두 이동합니다. 오른쪽에서 왼쪽으로 쓰는 레이아웃에서는 Left와 Right의 역할이 바뀌어 Left가 다음 토글로, Right가 이전 토글로 이동하며, Up, Down, Home, End는 그대로입니다. `focus:` 스타일은 포커스가 어디에 있는지 보여 줍니다. `ToggleGroup` 밖에 있는 `Toggle`은 별도의 정류장입니다.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS, Android, Mac Catalyst: 누르기는 내용을 포함한 토글 위에서 끝나는 탭입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누르기는 클릭입니다. macOS와 웹에서는 Space와 Return도 키보드 포커스가 있는 토글을 누르며, 방향키, Home, End는 포커스를 이동합니다([키보드](#keyboard)).
- 모든 플랫폼은 앱이 스타일을 지정한 것을 그대로 그립니다. 토글, 눌린 토글의 표면, 그룹의 트랙이 이에 해당합니다.
