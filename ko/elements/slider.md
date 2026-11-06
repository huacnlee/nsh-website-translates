---
title: "Slider"
description: "Slider 컴포넌트: 트랙을 따라 값 하나 또는 두 값의 범위를 선택하며, 터치스크린과 마우스에서의 누르기 및 드래그, WAI-ARIA의 slider 키, 각 썸(thumb)에 대한 스크린 리더용 값을 지원하고, 앱에서 스타일을 지정할 수 있는 트랙, 인디케이터, 범위, 썸을 제공합니다."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---

# Slider

슬라이더는 트랙을 따라 값 하나(볼륨, 밝기)를 선택하거나, 썸(thumb)이 각각 하나씩 있는 두 값의 범위(가격 범위)를 선택합니다. 동작은 슬라이더가 직접 처리합니다. 트랙을 누르면 더 가까운 썸이 그 위치로 이동하고, 썸은 마우스나 손가락 드래그를 따라갑니다. 값은 `step`에 맞춰 스냅되며, 각 썸은 키보드 포커스의 정지점이고 화살표 키로 움직이며, 스크린 리더에는 자체 값을 가진 조절 가능한 요소로 노출됩니다. 외형은 앱이 정합니다. `Slider`에는 고유한 색상, 크기, 반경, 모션이 없습니다. 슬라이더는 트랙과 그 안의 인디케이터, 인디케이터 위의 범위와 썸, 그리고 자식 요소(레이블, 텍스트로 된 값)로 구성되며, 앱이 각 부분의 스타일을 지정합니다.

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서 `slider()`는 속성마다 setter(`.value(..)`, `.thumb_style(..)`), 이벤트마다 리스너 메서드(`.on_change(..)`), 슬라이더 자체를 위한 타입이 지정된 스타일 메서드, 레이블을 위한 `.child(..)`를 갖춘 슬라이더를 만듭니다. 값은 `SliderValue`이며, `Single(f64)` 또는 `Range(f64, f64)`입니다.

## Value

값은 숫자이거나, 썸이 두 개인 범위를 나타내는 `[start, end]`입니다. 값의 형태에 따라 썸의 개수가 정해집니다. 앱은 `value`로 값을 소유하고 `onChange`가 보고하는 값을 설정하며, 이는 `nsh/base`의 모든 컨트롤과 같습니다. 또는 `defaultValue`로 값을 슬라이더에 맡기고 변경 사항만 전달받을 수도 있습니다. 드래그하는 동안 썸과 범위는 같은 프레임 안에서 네이티브하게 포인터를 따라갑니다. 포인터를 떼면 드래그의 마지막 변경에 대해 앱이 설정한 `value`가 다시 표시됩니다. 스크린 리더는 드래그가 진행되는 동안에는 드래그 중의 값을, 그렇지 않을 때는 최종 값을 읽어 줍니다.

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange`는 사용자가 요청한 새 값을 매번 보고합니다. 트랙을 누를 때, 드래그의 각 단계마다, 키를 누를 때마다 보고되며, 각 보고는 새로운 값입니다.
- `onChangeEnd`는 변경이 끝난 시점의 값을 한 번만 보고합니다. 값을 설정한 누름이나 드래그 뒤에 포인터를 뗄 때, 그리고 키 입력이나 스크린 리더 단계마다(각각이 하나의 완결된 변경입니다) 보고됩니다. 값을 저장하거나 전송하는 작업은 여기서 하세요.
- 값은 `min`부터 계산한 `step`에 스냅되고(`min={1} step={2}`이면 1, 3, 5, ...) `min`와 `max` 사이에 머뭅니다. `max`는 항상 도달할 수 있으므로, 범위가 step의 정수 배가 아니면 마지막 step은 더 짧아집니다. `step={0}`는 모든 값을 받습니다.
- 범위의 썸은 서로 교차하지 않습니다. 드래그하는 썸은 다른 썸에서 멈춥니다. 두 썸이 같은 값에 있는 상태에서 드래그를 시작하면 포인터가 향하는 방향으로 갈 수 있는 썸이 움직입니다.
- 표시되는 값은 앱이 정한 값이며 `min`와 `max`로 제한됩니다(범위는 양 끝이 순서대로 유지됩니다). step의 격자에서 벗어난 값은 있는 그대로 표시되고, 사용자의 다음 변경 때 스냅됩니다.

## Props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | 없음 | 값(제어 방식)입니다. 숫자이거나 썸이 두 개인 범위입니다. 앱은 `onChange`가 보고하는 값을 설정합니다. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | `value`가 설정되지 않았을 때의 초기 값입니다. 이 경우 슬라이더가 값을 자체적으로 유지합니다. |
| `min` | `.min(..)` | `number` | `0` | 가장 작은 값입니다. |
| `max` | `.max(..)` | `number` | `100` | 가장 큰 값입니다. `min`보다 작으면 `min`입니다. |
| `step` | `.step(..)` | `number` | `1` | 값이 스냅되는 step이며 `min`부터 계산합니다. `0`는 모든 값을 받습니다. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | 트랙을 따라 값이 분포하는 방식입니다. 균등하게 분포하거나 자릿수 단위로 분포합니다(1에서 1000까지라면 3분의 1 지점이 10입니다). 로그 방식은 `min`가 0보다 커야 하며, `min`가 그보다 낮으면 선형이 됩니다. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 트랙의 방향입니다. `min`는 시작 쪽(왼쪽, 오른쪽에서 왼쪽 레이아웃에서는 오른쪽)이거나 아래쪽입니다. 슬라이더가 만들어질 때 읽힙니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 포인터, 키보드, 스크린 리더로 값을 바꿀 수 없으며, `disabled:` 클래스가 슬라이더와 그 부분들에 적용됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 썸에 대해 말하는 내용입니다(범위에서는 끝 썸의 것입니다). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | 스크린 리더가 범위의 시작 썸에 대해 말하는 내용입니다. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트랙입니다. 누름과 드래그를 받는 영역입니다. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 인디케이터입니다. 값이 대응되는 레일입니다. |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | `min`에서 썸까지(범위에서는 두 썸 사이)의 범위이며, 슬라이더가 배치합니다. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 썸이며, 자신의 값을 중심으로 배치됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 트랙 뒤의 콘텐츠입니다. 레이블, 텍스트로 된 값 등입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 슬라이더 자체입니다. 트랙과 레이블을 감싸는 열(또는 행)입니다. |

## Events

| 이벤트 | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 사용자가 새 값을 요청했을 때입니다. 트랙 누름, 드래그의 한 단계, 키 입력, 스크린 리더의 증가 또는 감소가 해당합니다. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 변경이 끝났을 때입니다. 포인터를 뗐거나, 키 입력 또는 스크린 리더 단계가 완료되었을 때입니다. 변경당 한 번 발생합니다. |

## Parts

| 부분 | 포함 위치 | 스타일 지정 |
|---|---|---|
| 슬라이더 | | `class`, `style` |
| 트랙 | 슬라이더 안, 첫 번째 | `trackClass`, `trackStyle` |
| 인디케이터 | 트랙 안 | `indicatorClass`, `indicatorStyle` |
| 범위 | 인디케이터 안, 값에 따라 배치됨 | `rangeClass`, `rangeStyle` |
| 썸(범위에서는 두 개) | 인디케이터 안, 자신의 값을 중심으로 배치됨 | `thumbClass`, `thumbStyle` |
| 레이블 | 슬라이더 안, 트랙 뒤 | 자체 요소(`children`) |

트랙은 누름과 드래그를 받습니다. 인디케이터의 길이는 값의 범위이며, `min`가 앞쪽 가장자리(세로일 때는 아래쪽)에 있습니다. 슬라이더는 그 위에 범위와 썸을 배치하며, 썸은 크기와 관계없이 자신의 값을 중심으로 놓입니다. 배치하는 방법은 두 가지입니다.

- 트랙이 레일인 경우(위의 예제)입니다. `h-2 px-2 rounded-full bg-muted`와 `h-full` 인디케이터를 함께 씁니다. 패딩은 썸이 레일 양 끝 안쪽에 머물게 하고, 범위의 `-ml-2`는 채우기가 레일 자체의 가장자리에서 시작되게 합니다.
- 트랙이 레일을 둘러싼 띠인 경우입니다. 터치 화면에서 손가락이 쉽게 찾을 수 있도록 더 높게 만듭니다. `h-8 justify-center`와 `h-2 rounded-full` 인디케이터를 함께 씁니다(세로 슬라이더에서는 `w-8 items-center`와 `w-2 h-full`).

각 부분이 나타내는 상태는 다음과 같습니다.

- 썸: 포인터 아래에 있을 때 `hover:`, 드래그되는 동안 `active:`, 키보드 포커스가 있을 때 `focus:`, 그리고 `disabled:`입니다.
- 트랙: 트랙을 누른 채 드래그하는 동안 `active:`입니다. 트랙은 `group`이므로 인디케이터, 범위, 썸이 트랙으로부터 `group-hover:`와 `group-active:`를 받습니다.
- 모든 부분: 슬라이더가 그 상태일 때 `disabled:`입니다.

썸은 값이 바뀔 때 움직이며 드래그는 즉시 따라갑니다. 썸의 상태에 적용하는 모션은 앱이 선택합니다(`hover:`와 `active:`에서 밝아지는 썸을 위한 `transition`). `motion-reduce:`는 모션 감소를 요청한 사용자를 위해 이를 정지 상태로 유지합니다. 키보드 포커스는 썸이 가집니다. 썸이 포커스를 가진 동안 트랙의 `focus-within:`는 레일 전체에 링을 그리며, 썸의 `focus:outline-none`가 플랫폼 자체의 포커스 윤곽선을 대신합니다.

## Keyboard

macOS와 웹에서 각 썸은 키보드 포커스의 정지점(Tab)이며, 포커스된 썸은 WAI-ARIA의 슬라이더 키를 받습니다.

| 키 | 동작 |
|---|---|
| Right, Up | 한 step 올립니다(세로 슬라이더에서도 동일합니다). |
| Left, Down | 한 step 내립니다. |
| Page Up, Page Down | 범위의 10분의 1만큼(스케일을 따라) 올리거나 내리며, 최소 한 step입니다. |
| Home, End | 썸이 갈 수 있는 가장 낮은 값 또는 가장 높은 값까지 이동합니다(범위의 시작 썸은 끝 썸까지). |

오른쪽에서 왼쪽 레이아웃에서 가로 슬라이더는 오른쪽에서 시작하며 `min`가 오른쪽 끝에 있습니다. Left는 한 step 올리고 Right는 한 step 내리며, 왼쪽으로 드래그하면 값이 올라갑니다. 세로 슬라이더는 Right와 Up이 계속 한 step 올리는 키입니다.

값을 바꾸는 키는 매번 `onChange`를 보고한 다음 `onChangeEnd`를 보고합니다. 화살표 키와 페이지 키는 누르고 있으면 반복됩니다. 키는 텍스트 입력이 편집 중이지 않을 때만 슬라이더에 전달됩니다.

## Accessibility

- 각 썸은 레이블, 값, 취할 수 있는 값을 가진 조절 가능한 요소입니다(`"adjustable"`, 브라우저에서는 slider). 범위의 시작 썸은 `min`부터 끝 썸까지, 끝 썸은 시작 썸부터 `max`까지의 값을 가지므로 스크린 리더가 둘 다 읽고 설정할 수 있습니다. 값은 step의 소수 자릿수를 가진 숫자로 읽힙니다(`2.5`).
- 스크린 리더의 증가 및 감소 동작(VoiceOver의 위, 아래 스와이프)은 화살표 키처럼 썸을 한 step 움직입니다.
- 썸은 스크린 리더에 대한 슬라이더의 요소이며 `accessibilityLabel`로 이름이 붙습니다(범위의 시작 썸은 `startAccessibilityLabel`). 자식 요소 중 보이는 레이블은 그 위치에서 읽힙니다.
- `disabled`일 때 스크린 리더는 썸이 비활성(dimmed) 상태라고 말하며, 썸은 어떤 동작도 받지 않습니다.

레이블, 역할, 동작에 대한 일반적인 내용은 [Accessibility](../docs/accessibility.md)를 참고하세요.

## Platform notes

- 모든 플랫폼은 앱이 스타일을 지정한 대로 그립니다. 누름과 드래그는 마우스, 펜, 손가락 모두 코어에서 추적하며, 슬라이더를 감싼 스크롤 뷰는 슬라이더에서 시작된 드래그를 가져가지 않습니다.
- macOS와 웹에서는 Tab이 썸 사이로 키보드 포커스를 이동하며, 포커스된 썸이 슬라이더 키를 받습니다.
- 스크린 리더: VoiceOver(iOS, macOS)와 TalkBack은 각 썸을 조절하며, UI Automation(Windows), GTK의 접근성(Linux), 브라우저(`role="slider"`, `aria-valuenow`, `aria-valuetext`)는 썸의 범위와 값을 가져옵니다.
