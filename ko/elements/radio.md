---
title: "Radio"
description: "Radio와 RadioGroup: 사용자가 정확히 하나만 선택하는 옵션 집합입니다. 각 Radio는 누르기, 키보드 활성화, 비활성화 상태, 그리고 스크린 리더를 위한 역할(role)과 선택 상태(checked state)를 담당하며, RadioGroup은 이 옵션들의 집합을 관리합니다. 외형과 값은 앱이 결정합니다."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

라디오는 사용자가 요금제, 정렬 순서, 테마처럼 정확히 하나만 고르는 선택지 집합을 제공합니다. 각 `Radio`는 한 선택지의 동작을 맡습니다. 누르기, 키보드 활성화, 비활성화 상태, 그리고 스크린 리더를 위한 라디오 역할과 선택됨 상태가 여기에 포함됩니다. 이들을 감싸는 `RadioGroup`는 집합을 이루며, 스크린 리더는 이를 하나의 그룹으로 안내합니다. 외형은 앱이 정합니다. 라디오에는 자체 원, 점, 색상, 크기, 레이블이 없습니다. 자식 요소가 앱의 표시기와 레이블이 되며, 라디오에 적용한 `checked:` 클래스나 그 안의 요소에 적용한 `group-checked:` 클래스가 라디오의 상태를 따릅니다.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio`와 `RadioGroup`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 값은 앱이 가지며, 그룹은 값을 보관하지 않습니다. 각 라디오는 자신이 선택되었는지 전달받습니다. 선택되지 않은 라디오를 누르면 `onChange({ checked: true })`가 보고되고, 앱이 값을 설정하면, 모든 라디오는 앱이 다시 전달한 `checked`를 표시합니다. Rust에서는 `radio()`와 `radio_group()`로 이들을 만들며, prop마다 setter(`.checked(..)`), 이벤트마다 리스너(`.on_change(..)`), 타입이 지정된 스타일 메서드, 그리고 내용을 위한 `.child(..)`를 사용합니다.

## Props

<a id="radio-1"></a>

### Radio

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 선택 여부입니다. 선택되지 않은 라디오를 누르면 `onChange`와 함께 `true`가 보고되며, 라디오는 앱이 다시 전달한 값을 표시합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기와 누름 피드백이 없습니다. `disabled:` 스타일이 적용되며, 스크린 리더는 흐리게 표시된 상태라고 안내합니다. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 선택되었고 비활성화되지 않은 상태에서의 라디오 스타일이며, `checked:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 읽는 내용입니다. 자식 요소에 선택지를 말해 주는 텍스트가 없을 때 해당 선택지를 나타냅니다. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 없음 | 라디오 영역 바깥에서도 누르기로 인정되는 거리이며, 포인트 단위입니다. 모든 변에 같은 숫자 하나를 지정하거나 변별로 지정합니다. 뷰의 `hitSlop`와 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 앱의 표시기와 레이블이며, 스크린 리더가 이를 읽습니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 라디오 자체, 즉 표시기와 레이블을 감싸는 행입니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스 또는 비활성화 상태에서의 라디오 스타일이며, `<state>:` 클래스로 지정합니다. |

### RadioGroup

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 없음 | 집합을 이루는 라디오와, 앱이 그 사이에 배치하는 모든 요소입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 그룹의 레이아웃과 외형입니다. 기본값은 세로 열이며, 가로 행은 `flex-row`를 사용합니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | 선택되지 않은 라디오가 눌렸습니다. 탭, 클릭, 키보드 포커스가 있을 때의 Space 또는 Return, 스크린 리더의 활성화, 또는 그룹의 화살표 키가 키보드 포커스를 해당 라디오로 옮긴 경우가 이에 해당합니다. 이는 선택을 요청하는 것이므로 `checked`는 `true`입니다. 이 이벤트는 아무것도 바뀌기 전에 실행되며, 라디오는 앱이 다시 전달한 `checked`를 표시합니다. |

선택된 라디오는 선택된 상태를 유지하고 아무것도 보고하지 않습니다. 라디오는 스스로 선택을 해제할 수 없기 때문입니다. 비활성화된 라디오도 아무것도 보고하지 않습니다.

<a id="parts"></a>

## 구성 요소

| 구성 요소 | 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 그룹 | | `RadioGroup`의 `class`, `style` | |
| 라디오 | 그룹 내부 | `Radio`의 `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (또는 `checkedStyle`, `disabledStyle`, ...) |
| 표시기와 레이블 | 라디오 내부 | 각자의 요소 (`children`) | 라디오의 `class`에 `group`가 있을 때의 `group-checked:`, `group-disabled:` 및 기타 `group-*:` 변형 |

표시기는 앱의 콘텐츠입니다. 점이 있는 링, 체크 표시, 강조된 카드 등이 될 수 있습니다. 라디오의 `class`에 `group`를 지정하면, 라디오가 선택된 동안 해당 `group-checked:` 클래스가 점을 표시합니다.

<a id="disabled"></a>

## 비활성화

비활성화된 라디오는 누르기를 받지 않으며, 스크린 리더는 이를 흐리게 표시된 상태로 안내합니다. 라디오의 `disabled:` 클래스는 `checked:` 클래스보다 우선하여 적용되고, 그 안의 `group-disabled:` 클래스도 이를 따릅니다.

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop으로 작은 대상 다루기

옆에 레이블이 없는 라디오(표의 행에 있는 점 등)는 손가락보다 작을 수 있습니다. `hitSlop`은 레이아웃이나 외형을 바꾸지 않고, 각 변 바깥쪽 포인트 거리 안에서 일어난 누르기도 인정되게 합니다. 모든 변에 같은 숫자 하나를 지정하거나 변별로 지정하며(`{ top: 8, bottom: 8 }`), [뷰의 `hitSlop`](./index.md#presses-and-feedback)가 받는 방식과 같습니다.

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## 접근성

- 라디오는 스크린 리더에게 하나의 요소이며, 역할은 `"radio"`이고 상태로 선택 여부를 가집니다. 일부 스크린 리더는 선택됨을, 일부는 선택(selected)을 읽으므로(UI Automation의 라디오는 선택 항목입니다) 선택된 동안에는 selected도 함께 설정됩니다. 표시기와 레이블은 라디오의 일부이며, 레이블은 자식 요소의 텍스트 또는 `accessibilityLabel`입니다.
- `RadioGroup`의 역할은 `"radiogroup"`입니다. 스크린 리더는 그 안의 라디오를 하나의 집합으로 인식하며, 각 라디오는 여전히 별도의 요소입니다.
- `disabled`는 플랫폼이 안내하는 방식대로 안내됩니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).
- macOS와 웹에서 `RadioGroup`은 키보드 포커스의 정지점 하나이며, 화살표 키로 그 안의 라디오 사이를 이동하며 선택합니다(아래 참조).

레이블, 역할, 안내에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="keyboard"></a>

## 키보드

Tab으로 누르기를 받는 뷰에 도달할 수 있는 macOS와 웹에서 `RadioGroup`은 [WAI-ARIA 라디오 그룹 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)을 따릅니다.

| 키 | 동작 |
|---|---|
| Tab, Shift+Tab | 선택된 라디오로 그룹에 들어가며(선택된 라디오가 없으면 비활성화되지 않은 첫 번째 라디오), 한 번에 그룹을 벗어납니다. |
| Down, Right | 포커스를 다음 라디오로 옮기고(마지막에서는 첫 번째로) 선택합니다. |
| Up, Left | 포커스를 이전 라디오로 옮기고(첫 번째에서는 마지막으로) 선택합니다. |
| Space | 포커스된 라디오를 선택합니다. |

화살표 키는 비활성화된 라디오를 건너뜁니다. 이동한 라디오는 `onChange`로 선택을 요청하고, 앱이 이를 선택합니다. 오른쪽에서 왼쪽으로 쓰는 레이아웃에서는 Left와 Right의 역할이 바뀌어, Left는 다음 라디오로, Right는 이전 라디오로 이동합니다. Up과 Down은 그대로입니다. `focus:` 스타일은 포커스가 있는 위치를 보여 줍니다. `RadioGroup` 밖에 있는 `Radio`는 독립적인 정지점이며, Tab으로 도달하고 Space와 Return으로 선택합니다.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- iOS, Android, Mac Catalyst: 누르기는 레이블을 포함해 라디오 위에서 끝나는 탭입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누르기는 클릭입니다. macOS와 웹에서는 Space와 Return도 키보드 포커스가 있는 라디오를 선택하며, 화살표 키는 포커스를 이동합니다([키보드](#keyboard)).
- 모든 플랫폼은 앱이 스타일을 지정한 요소(표시기, 레이블, 그리고 이들의 전환 효과)를 그립니다.
