---
title: "NumberInput"
description: "NumberInput 컴포넌트: 필드에 직접 입력하거나 버튼, 화살표 키, 스크린 리더로 단계별로 조절하는 숫자 값입니다. 값은 step의 소수 자릿수와 min, max 범위 내로 유지되며, 앱에서 스타일을 지정할 수 있는 필드, 버튼, 컨트롤 열로 구성됩니다."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---

# NumberInput

숫자 입력은 사용자가 입력하거나 단계적으로 조절하는 숫자(수량, 가격, 크기)를 담습니다. 동작은 입력이 직접 소유합니다. 필드는 숫자 또는 숫자가 되어 가는 중의 텍스트(`-`, `1.`)만 받으며, 다른 키보드의 숫자와 부호를 포함해 그 외의 입력은 모두 거부합니다. 버튼, 즉 Up과 Down 키, 그리고 스크린 리더의 증가·감소 동작은 소수 자릿수를 유지한 채 숫자를 `step`만큼 변경하며, `min`과 `max`에서 멈춥니다. 필드를 벗어나면 입력한 숫자는 그 범위로 제한됩니다. 외형은 앱의 몫입니다. `NumberInput`는 자체 색상, 크기, 테두리, 아이콘, 문자열이 없습니다. 감소 버튼, 앱의 `prefix`와 `suffix` 사이에 있는 필드, 증가 버튼(또는 필드와 두 버튼을 모두 담은 열, `controlsRight`)으로 구성되며, 앱이 각 부분을 스타일링하고 버튼의 내용을 채웁니다.

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `number_input()`로 입력을 만들며, prop마다 setter(`.value(..)`, `.input_style(..)`), 이벤트마다 리스너 메서드(`.on_change(..)`), 입력 자체를 위한 타입이 지정된 스타일 메서드, 필드 주변 요소를 위한 `.prefix(..)` / `.suffix(..)`을 제공합니다. 값은 `Option<f64>`입니다.

<a id="value"></a>

## 값

값은 숫자이며, 빈 필드는 `null`입니다. 앱은 `value`로 값을 소유하고 `onChange`가 보고하는 값을 설정합니다. `nsh/base`의 모든 컨트롤과 같은 방식입니다. 또는 `defaultValue`로 값을 입력에 맡기면서도 변경 사항은 동일하게 받을 수 있습니다.

사용자가 자유롭게 입력할 수 있도록, 필드의 텍스트와 값은 필요한 곳에서 분리되어 있습니다.

- `onChange`은 텍스트가 읽히는 숫자가 바뀔 때마다 그 숫자를 보고합니다. 텍스트가 숫자로 읽히지 않는 동안(비어 있음, `-`, `.`)에는 `null`을 보고합니다. `1` 뒤에 `1.`을 입력하거나 `1.5` 뒤에 `1.50`을 입력하면 아무것도 보고하지 않습니다.
- 텍스트가 입력이 가진 값으로 읽히는 동안에는 사용자가 입력한 그대로 유지됩니다. 따라서 보고된 각 값을 다시 전달하는 controlled 입력은 `1.`와 `2.50`을 그대로 유지합니다. 앱이 설정했지만 입력이 보고하지 않은 값은 그 값으로 읽히는 가장 짧은 텍스트(`0.3`, `12`)로 필드에 표시됩니다.
- 입력 중에는 숫자가 `min`과 `max` 범위를 벗어날 수 있으며(`min={10}`일 때 15를 입력하는 도중의 1), 입력한 그대로 보고됩니다. 필드를 벗어나거나 Return / Enter를 누르면 값이 범위로 제한되고 그 값이 보고됩니다. 숫자로 읽히지 않는 텍스트는 그대로 남습니다.
- 단계 이동(버튼, 키, 스크린 리더 동작)은 `onChange`로 다음 값을 요청합니다. controlled 값에서는 앱이 값을 다시 전달할 때 필드가 이동하며, 단계의 소수 자릿수를 유지합니다(`99.5`에서 `max={100}`로 올리면 `100.0`이 표시됨). 따라서 단계를 거부하는 앱은 필드를 그대로 유지합니다. 앱이 거부한 편집은 필드를 편집하는 동안 필드에 남아 있다가 필드를 벗어나면 사라집니다.

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

필드가 받는 입력은 다음과 같습니다.

- 숫자, 소수점 하나, 맨 앞의 부호(`+` 또는 `-`). 문자, 두 번째 소수점이나 부호, 다른 위치의 부호는 거부되며 필드는 이전 텍스트로 돌아갑니다.
- 전각 숫자, 부호, 소수점, 마이너스 기호(U+2212), 표의 마침표(`。`)는 중국어·일본어 입력기가 입력하는 방식 그대로 ASCII 형태로 읽힙니다.
- 텍스트에 소수점이 없는 동안의 쉼표는 소수점으로 읽힙니다(`3,25`는 3.25). 여러 언어 키보드의 소수점 키가 입력하는 방식입니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | 없음 | 값(controlled): 숫자 또는 빈 필드를 나타내는 `null`. 앱이 `onChange`가 보고하는 값을 설정합니다. |
| `defaultValue` | `.default_value(..)` | `number \| null` | 없음 | `value`이 설정되지 않은 동안의 초기 값. 이 경우 입력이 값을 직접 유지합니다. |
| `min` | `.min(..)` | `number` | 없음 | 가장 작은 값: 단계는 이 값에서 멈추며, 이보다 작게 입력한 값은 필드를 벗어날 때 이 값으로 제한됩니다. |
| `max` | `.max(..)` | `number` | 없음 | 가장 큰 값으로, 위쪽에서 `min`처럼 동작합니다. `min`보다 작은 값은 `min`로 처리됩니다. |
| `step` | `.step(..)` | `number` | `1` | 한 단계의 크기(Page Up / Page Down: 열 단계). 양수가 아닌 값은 `1`로 처리됩니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 입력, 단계, 포커스가 모두 불가능합니다. `disabled:` 클래스가 입력과 그 부분에 적용됩니다. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | 텍스트를 선택하고 복사할 수 있지만, 입력이나 단계로 변경할 수 없습니다. 버튼은 비활성화됩니다. |
| `placeholder` | `.placeholder(..)` | `string` | 없음 | 필드가 비어 있는 동안 표시됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 보이는 레이블이 필드의 이름을 나타내지 않을 때 스크린 리더가 필드에 대해 읽는 내용. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | 두 버튼을 필드 오른쪽의 열에 배치하며, 증가 버튼이 감소 버튼 위에 놓입니다. 입력이 만들어질 때 읽습니다. |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | 없음 | 필드: 상자와 텍스트(`color`, `fontSize`, `textAlign`, `placeholderColor`, `caretColor`). |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 감소 버튼. |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 증가 버튼. |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | 없음 | 버튼의 내용: 기호, 아이콘. |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | `controlsRight` 사용 시 두 버튼을 담는 열. |
| `prefix` | `.prefix(..)` | `JSX.Element` | 없음 | 필드 앞, 왼쪽 버튼 뒤에 오는 요소: 통화 기호, 아이콘. |
| `suffix` | `.suffix(..)` | `JSX.Element` | 없음 | 필드 뒤, 오른쪽 버튼 앞에 오는 요소: 단위, 통화. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 입력 자체: 필드와 버튼을 감싸는 행. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | 필드가 읽히는 숫자가 바뀌었을 때(입력, 단계, 스크린 리더의 증가 또는 감소, 범위를 벗어난 값을 가진 채 필드를 벗어남). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | 필드에서 Return / Enter: `min`과 `max`로 제한된 값. |
| `onFocus` | `.on_focus(..)` | 없음 | 필드가 키보드 포커스를 받았습니다. |
| `onBlur` | `.on_blur(..)` | 없음 | 필드가 키보드 포커스를 잃었습니다(값이 먼저 `min`과 `max`로 제한됨). |

<a id="parts"></a>

## 구성 요소

| 부분 | 위치 | 스타일링 |
|---|---|---|
| 입력 | | `class`, `style` |
| 감소 버튼 | 입력 안, 첫 번째(`controlsRight` 사용 시: 컨트롤 열 안, 두 번째) | `decrementButtonClass`, `decrementButtonStyle`. 내용은 `decrementButton` |
| 필드 | 입력 안 | `inputClass`, `inputStyle` |
| 접두 요소 | 입력 안, 필드 앞 | 자체 요소(`prefix`) |
| 접미 요소 | 입력 안, 필드 뒤 | 자체 요소(`suffix`) |
| 증가 버튼 | 입력 안, 마지막(`controlsRight` 사용 시: 컨트롤 열 안, 첫 번째) | `incrementButtonClass`, `incrementButtonStyle`. 내용은 `incrementButton` |
| 컨트롤 열 | 입력 안, 마지막, `controlsRight` 사용 시 | `controlsClass`, `controlsStyle` |

입력은 앱이 배치하는 행입니다. `flex-row`를 `class`에 지정하고, 버튼이 남기는 공간을 필드가 차지하도록 필드에는 `flex-1`을 지정합니다. 각 부분이 나타내는 상태는 다음과 같습니다.

- 입력: 필드가 편집 중일 때 `focus-within:`(입력 전체를 둘러싼 링), `disabled:`.
- 필드: 편집 중일 때 `focus:`, `disabled:`.
- 버튼: 포인터 아래에 있을 때 `hover:`, 눌려 있는 동안 `active:`, 입력이 비활성화되었거나 읽기 전용일 때와 단계가 아무 동작도 하지 않을 곳(`min`에서의 감소 버튼, `max`에서의 증가 버튼)에서 `disabled:`. 비활성화된 버튼이 강조되지 않도록 hover는 `enabled:`(`enabled:hover:bg-accent`) 뒤에 두세요.

상태 전환의 모션은 앱이 선택하며(`transition-colors`), 모션 감소를 요청한 사용자에게는 `motion-reduce:`가 모션을 정지시킵니다.

<a id="keyboard"></a>

## 키보드

필드가 편집 중일 때 입력은 WAI-ARIA의 spin button 키를 받으며, 키를 누르고 있으면 반복됩니다.

| 키 | 동작 |
|---|---|
| Up | 한 단계 위로. |
| Down | 한 단계 아래로. |
| Page Up, Page Down | 열 단계 위 또는 아래로. |

Home과 End는 필드의 기본 동작을 유지하여 텍스트 안에서 캐럿을 이동합니다. 버튼은 키보드 포커스의 정지 지점이 아닙니다. Tab은 필드에서 입력 다음의 요소로 이동하며, 버튼을 눌러도 포커스는 필드에 남습니다(데스크톱에서는 포커스가 다른 곳에 있었다면 버튼을 눌렀을 때 필드로 이동하고, 터치 화면에서는 포커스를 그대로 두어 키보드가 나타나지 않습니다).

<a id="accessibility"></a>

## 접근성

- 필드는 레이블, 값(`min`과 `max` 사이에서 읽히는 숫자), 텍스트를 가진 spin button(`"spinbutton"`)입니다.
- 스크린 리더의 증가 및 감소 동작(VoiceOver의 위/아래 스와이프)은 Up과 Down처럼 값을 한 단계 변경합니다.
- 버튼은 브라우저의 number 필드와 마찬가지로 스크린 리더에서 숨겨집니다. 필드 자체의 증가 및 감소 동작이 값을 변경합니다.
- `disabled`일 때 스크린 리더는 필드가 흐리게 표시되었다고 알립니다.

레이블, 역할, 동작에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 필드는 플랫폼의 텍스트 필드([Input](./input.md))입니다. 키보드, 캐럿, 선택, 복사 및 붙여넣기, 입력기는 시스템의 것입니다. 휴대폰은 소수점 키보드를 표시하며, `min`가 0보다 작거나 설정되지 않은 경우에는 부호 키가 포함됩니다.
- 모든 플랫폼은 앱이 스타일링한 대로 그립니다. 하드웨어 키보드의 Up / Down과 Page Up / Page Down은 모든 플랫폼에서 입력에 전달됩니다.
