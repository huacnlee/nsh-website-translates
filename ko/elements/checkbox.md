---
title: "Checkbox"
description: "Checkbox 컴포넌트: 선택됨, 선택 안 됨, 불확定 상태를 가지는 컨트롤로, 누르기, 키보드 활성화, 비활성화 상태, 그리고 스크린 리더를 위한 역할과 값을 직접 관리하며, 앱이 스타일을 지정하고 표시를 그릴 수 있는 인디케이터를 제공합니다."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

체크박스는 옵션 하나, 목록의 항목 하나 또는 그 전체를 선택합니다. 체크됨, 체크 해제됨, 또는 불확정 상태(둘 중 어느 쪽도 아님: 일부만 선택된 상태에서의 "모두 선택")가 될 수 있습니다. 동작은 체크박스가 맡습니다: 누르기, 키보드 활성화, 비활성 상태, 그리고 스크린 리더를 위한 checkbox 역할과 값입니다. 모양은 앱의 몫입니다: `Checkbox`에는 자체 박스, 표시, 색상, 크기, 레이블이 없습니다. 인디케이터(박스)와 그 안의 앱의 표시, 그다음 자식 요소(레이블)로 구성되며, 앱이 각 부분을 `checked:`, `indeterminate:`, `disabled:` 클래스로 스타일링합니다. 이 클래스는 체크박스를 따릅니다.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox`의 출처는 [`nsh/base`](../modules/nsh-base.md), 즉 Rust의 `nsh-base` 크레이트입니다. 값은 앱이 가집니다: 누르면 `onChange`로 다음 값을 알리고, 체크박스는 앱이 다시 전달한 `checked` 및 `indeterminate` 값을 표시합니다. Rust에서는 `checkbox()` 호출로 체크박스를 만들며, prop마다 setter(`.checked(..)`, `.indicator_style(..)`), 이벤트마다 리스너(`.on_change(..)`), 체크박스 자체를 위한 타입이 지정된 스타일 메서드, 레이블을 위한 `.child(..)`를 제공합니다. 인디케이터의 스타일은 체크박스를 따르는 상태 메서드(`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`)를 받습니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 체크 여부입니다. 누르면 `onChange`로 다음 값을 알리며, 체크박스는 앱이 다시 전달한 값을 표시합니다. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | 체크됨도 체크 해제됨도 아닌 상태로, 이 상태인 동안 `checked`보다 우선합니다: 스크린 리더는 혼합 상태라고 읽으며, 누르면 체크됨을 요청합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기도, 누르기 피드백도 없습니다. `disabled:` 스타일이 체크박스와 인디케이터에 적용되며, 스크린 리더는 흐림(dimmed) 상태라고 읽습니다. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 체크되었고 비활성이 아닐 때의 체크박스 스타일로, `checked:` 클래스로 지정합니다. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 불확정 상태이고 비활성이 아닐 때의 체크박스 스타일로, `indeterminate:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 읽는 내용: 자식 요소에 그 내용을 말해 주는 텍스트가 없을 때, 체크박스가 무엇을 선택하는지입니다. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | 스크린 리더에게 전달되는 역할로, 더 구체적인 것일 때 사용합니다(체크 가능한 메뉴 항목: `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 인디케이터, 즉 값을 보여 주는 박스입니다. |
| `indicator` | `.indicator(..)` | `JSX.Element` | 없음 | 인디케이터의 내용: 앱이 값에 따라 보여 주는 표시(체크, 대시)입니다. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 없음 | 경계 밖 얼마까지 누르기로 인정할지를 포인트 단위로 지정합니다: 모든 변에 같은 숫자 하나, 또는 변별로 이름을 붙여 지정합니다. view의 `hitSlop` 방식과 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 인디케이터 뒤의 내용: 레이블이며, 스크린 리더가 이를 읽습니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 체크박스 자체: 인디케이터와 레이블을 감싸는 행입니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스, 비활성 상태일 때의 체크박스 스타일로, `<state>:` 클래스로 지정합니다. |

## Events

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | 체크박스가 눌렸습니다: 탭, 클릭, 키보드 포커스가 있는 동안의 Space 또는 Return, 또는 스크린 리더의 활성화입니다. 체크박스가 요청하는 값을 `checked`로 알립니다: 체크 해제됨과 불확정 상태에서는 `true`, 체크됨에서는 `false`입니다. |

비활성 체크박스는 아무것도 알리지 않습니다.

## Parts

| 부분 | 포함 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 체크박스 | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (또는 `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| 인디케이터 | 체크박스, 맨 앞 | `indicatorClass`, `indicatorStyle` | 체크박스를 따르는 `checked:`, `indeterminate:`, `disabled:` |
| 표시 | 인디케이터 | 자체 요소(`indicator`) | `group-checked:`, `group-indeterminate:` 및 그 밖의 `group-*:` 변형 (`indicatorClass` 대상 `group` 사용) |
| 레이블 | 체크박스, 인디케이터 뒤 | 자체 요소(`children`) | 체크박스의 `class` 대상 `group` 사용 `group-*:` 변형 |

표시는 앱의 콘텐츠이므로 앱이 정한 것을 보여 줍니다: 앱이 가진 값에 따라 체크 상태에서는 체크를, 불확정 상태에서는 대시를 고르거나, 두 표시를 모두 두고 `group-checked:` / `group-indeterminate:` 클래스로 보일 하나를 고릅니다.

<a id="indeterminate"></a>

## 불확정 상태

일부 항목만 선택되어 있는 동안 "모두 선택" 체크박스는 불확정 상태입니다. 누르면 체크됨을 요청하며, 앱은 모든 항목을 선택합니다:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## 비활성

비활성 체크박스는 누르기를 받지 않으며, 스크린 리더는 이를 흐림(dimmed) 상태로 안내합니다. 체크박스와 인디케이터의 `disabled:` 클래스가 `checked:` 및 `indeterminate:` 클래스보다 우선하여 적용됩니다:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop으로 작은 대상 누르기

옆에 레이블이 없는 체크박스(행의 선택 박스)는 손가락보다 작을 수 있습니다. `hitSlop` 설정 시, 레이아웃이나 모양을 바꾸지 않고 체크박스 근처에 닿은 누르기도 각 변 바깥쪽으로 포인트 단위만큼 인정됩니다: 모든 변에 같은 숫자 하나, 또는 변별로 이름을 붙여 지정하며(`{ top: 8, bottom: 8 }`), [view의 `hitSlop`](./index.md#presses-and-feedback)에 지정하는 방식과 같습니다.

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## 접근성

- 체크박스는 스크린 리더에게 하나의 요소이며, 역할 `"checkbox"`(또는 `role`) 및 값을 가집니다. 값은 체크됨, 체크 해제됨, 또는 불확정 상태일 때의 혼합입니다. 인디케이터와 표시는 그 일부입니다. 레이블은 자식 요소의 텍스트이며, 텍스트가 없을 때는 `accessibilityLabel` 지정이 필요합니다.
- `disabled` 안내는 플랫폼이 안내하는 방식을 따릅니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).
- macOS와 웹에서 체크박스는 키보드 포커스가 멈추는 지점입니다: Tab으로 이동하고, Space와 Return으로 전환하며, `focus:` 스타일이 포커스 위치를 보여 줍니다.

레이블, 역할, 안내 전반에 대해서는 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- iOS, Android, Mac Catalyst: 누르기는 레이블을 포함한 체크박스 위에서 끝나는 탭입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누르기는 클릭입니다. macOS와 웹에서는 키보드 포커스가 있는 체크박스를 Space와 Return으로도 전환할 수 있습니다.
- 모든 플랫폼은 앱이 스타일링한 것을 그립니다: 인디케이터, 표시, 그리고 그 전환 효과입니다.
