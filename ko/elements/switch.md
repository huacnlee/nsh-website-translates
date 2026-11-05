---
title: "Switch"
description: "Switch 컴포넌트: 누르기, 키보드 활성화, 비활성화 상태, 그리고 스크린 리더를 위한 역할(role)과 값(value)을 직접 관리하는 켜기/끄기 컨트롤로, 앱에서 스타일을 지정하는 트랙(track)과 썸(thumb)으로 구성됩니다."
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

스위치는 설정을 켜거나 끄며, 변경은 즉시 적용됩니다. 스위치는 동작을 담당합니다. 누르기, 키보드 활성화, 비활성 상태, 그리고 스크린 리더를 위한 switch 역할과 그 값이 여기에 포함됩니다. 외형은 앱의 몫입니다. `Switch` 컴포넌트에는 자체 색상, 크기, 모션, 레이블이 없습니다. 스위치는 안에 썸(thumb)이 들어 있는 트랙(track)과 그 뒤의 자식(레이블)으로 구성되며, 앱이 각 파트를 스타일링합니다. 이때 스위치를 따라가는 `checked:` 및 `disabled:` 클래스를 사용합니다.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` 컴포넌트는 [`nsh/base`](../modules/nsh-base.md)에서 제공되며, 이는 Rust의 `nsh-base` 크레이트입니다. 값은 앱이 소유합니다. 누르면 `onChange`로 다음 값을 보고하고, 스위치는 앱이 다시 전달하는 `checked` 값을 표시합니다. Rust에서는 `switch()`로 스위치를 만들며, 프롭마다 setter(`.checked(..)`, `.track_style(..)`), 이벤트마다 리스너(`.on_change(..)`), 스위치 자체를 위한 타입이 지정된 스타일 메서드, 레이블을 위한 `.child(..)`이 제공됩니다. 각 파트의 스타일은 스위치를 따라가는 상태 메서드(`.checked(..)`, `.disabled_style(..)`)를 받습니다.

<a id="props"></a>

## 프롭

| 프롭 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 켜짐 또는 꺼짐. 누르면 `onChange`로 다음 값을 보고하며, 스위치는 앱이 다시 전달한 값을 표시합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기와 누르기 피드백이 없습니다. `disabled:` 스타일이 스위치와 그 파트에 적용되며, 스크린 리더는 흐리게 표시된(dimmed) 상태라고 알립니다. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | `checked` 상태이면서 비활성이 아닐 때의 스위치 스타일이며, `checked:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 읽는 내용. 자식에 스위치가 무엇을 켜는지 설명하는 텍스트가 없을 때 사용합니다. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트랙. 썸이 따라 움직이는 파트입니다. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트랙 안에 있는 썸입니다. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 없음 | 경계 바깥으로 얼마나 떨어진 곳까지 누르기를 인정할지를 포인트 단위로 지정합니다. 모든 변에 하나의 숫자를 쓰거나 변을 각각 지정합니다. 뷰의 `hitSlop` 방식과 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 트랙 뒤의 콘텐츠인 레이블이며, 스크린 리더가 읽습니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 스위치 자체. 트랙과 레이블을 감싸는 행(row)입니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스, 비활성 상태일 때의 스위치 스타일이며, `<state>:` 클래스로 지정합니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | 스위치가 눌렸습니다. 탭, 클릭, 키보드 포커스가 있을 때의 Space 또는 Return, 또는 스크린 리더의 활성화가 해당합니다. 스위치가 요청하는 값을 `checked`로 보고하며, 이는 스위치가 현재 가진 `checked`의 반대 값입니다. |

비활성 스위치는 아무것도 보고하지 않습니다.

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일링 | 상태 |
|---|---|---|---|
| 스위치 | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (또는 `checkedStyle`, `disabledStyle`, ...) |
| 트랙 | 스위치 안, 첫 번째 | `trackClass`, `trackStyle` | `checked:`, `disabled:` 상태가 스위치를 따라갑니다 |
| 썸 | 트랙 안 | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` 상태가 스위치를 따라갑니다 |
| 레이블 | 스위치 안, 트랙 뒤 | 자체 요소(`children`) | 스위치의 `class`에 `group`를 사용한 `group-checked:` 및 기타 `group-*:` 변형 |

썸은 자체 `checked:` 스타일로 움직입니다. 이동 변환(`checked:translate-x-5`)을 쓰거나, 마진 또는 트랙의 정렬(트랙의 `checked:justify-end`)을 사용합니다. `transition-*` 클래스는 변경을 네이티브로 애니메이션합니다. 레이블을 트랙 앞에 두려면 행을 반전하세요: `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## 비활성

비활성 스위치는 누르기를 받지 않으며, 스크린 리더는 흐리게 표시된 상태로 알립니다. 스위치와 그 트랙, 썸의 `disabled:` 클래스가 `checked:` 클래스보다 우선하여 적용됩니다.

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop으로 작은 대상 만들기

레이블이 없는 스위치는 손가락보다 작을 수 있습니다. `hitSlop`은 레이아웃이나 외형을 바꾸지 않고, 각 변 바깥으로 지정한 포인트만큼 가까운 곳에 닿는 누르기도 인정합니다. 모든 변에 하나의 숫자를 쓰거나 변을 각각 지정(`{ top: 8, bottom: 8 }`)할 수 있으며, [뷰의 `hitSlop`](./index.md#presses-and-feedback)와 같은 형식으로 지정합니다.

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## 접근성

- 스위치는 스크린 리더에게 하나의 요소이며, `"switch"` 역할과 값(켜짐 또는 꺼짐)을 가집니다. 트랙과 썸은 그 일부입니다. 레이블은 자식의 텍스트이며, 자식에 텍스트가 없으면 `accessibilityLabel` 값을 지정하세요.
- `disabled` 상태는 플랫폼이 알리는 방식대로 안내됩니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).
- macOS와 웹에서 스위치는 키보드 포커스 정지점입니다. Tab으로 이동하고, Space와 Return으로 토글하며, `focus:` 스타일이 포커스 위치를 보여 줍니다.

레이블, 역할, 안내에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- iOS, Android, Mac Catalyst: 누르기는 레이블을 포함해 스위치 위에서 끝나는 탭입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누르기는 클릭입니다. macOS와 웹에서는 키보드 포커스가 있는 스위치를 Space와 Return으로도 토글할 수 있습니다.
- 모든 플랫폼은 앱이 스타일링한 대로 그립니다. 썸은 앱의 스타일과 전환(transition) 설정에 따라 움직입니다.
