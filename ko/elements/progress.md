---
title: "Progress"
description: "Progress 컴포넌트: 스크린 리더를 위한 역할, 범위, 값을 자체적으로 관리하고 값에 따라 인디케이터의 너비를 결정하는 선형 진행 막대로, 앱에서 스타일을 지정하는 트랙과 인디케이터로 구성됩니다."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

프로그레스 바는 범위가 정해진 작업(다운로드, 업로드, 설정의 한 단계)이 어디까지 진행되었는지 보여 주며, `indeterminate` 동안에는 범위를 알 수 없는 작업이 진행 중임을 보여 줍니다. 스크린 리더에 전달되는 정보, 즉 0에서 100까지의 범위와 값을 가진 progress bar 역할, 그리고 인디케이터의 너비(트랙 너비의 `value`퍼센트)는 프로그레스 바가 담당합니다. 모양은 앱이 정합니다. `Progress`에는 자체 색상, 크기, 반경, 모션, 레이블이 없습니다. 안에 인디케이터가 들어 있는 트랙과 그 뒤에 오는 자식 요소(레이블, 텍스트로 표시한 값)로 구성되며, 앱이 각 파트의 스타일을 지정합니다.

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress`은(는) Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 값은 앱이 관리합니다. 프로그레스 바는 앱이 전달한 `value`을(를) 0에서 100 사이로 제한하여 표시합니다. Rust에서는 `progress()`이(가) prop마다 setter(`.value(..)`, `.indicator_style(..)`)가 있는 프로그레스 바를 만들고, 프로그레스 바 자체에는 타입이 지정된 스타일 메서드를, 레이블에는 `.child(..)`을(를) 사용합니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | 작업이 얼마나 진행되었는지를 0에서 100 사이의 백분율로 나타냅니다(범위를 벗어나면 가장 가까운 끝값으로 처리). 인디케이터는 트랙 너비에서 이 비율만큼을 차지하며, 스크린 리더가 이 값을 읽어 줍니다. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | 작업의 범위를 알 수 없습니다. 스크린 리더는 값이 없는 progress bar로 인식하며, 인디케이터의 너비는 앱이 정합니다(`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 읽어 주는 내용으로, 자식 요소에 진행 중인 작업을 설명하는 텍스트가 없을 때 무엇이 진행 중인지 알려 줍니다. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트랙으로, 인디케이터가 채워지는 부분입니다. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트랙 안의 인디케이터로, 높이, 색상, 모션을 지정합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 트랙 뒤에 오는 콘텐츠로, 레이블이나 텍스트로 표시한 값이며 스크린 리더가 읽어 줍니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 프로그레스 바 자체로, 트랙과 레이블을 감싸는 열(또는 행)입니다. |

<a id="parts"></a>

## 파트

| 파트 | 포함 위치 | 스타일 지정 방법 |
|---|---|---|
| 프로그레스 바 | | `class`, `style` |
| 트랙 | 프로그레스 바 안, 첫 번째 | `trackClass`, `trackStyle` |
| 인디케이터 | 트랙 안 | `indicatorClass`, `indicatorStyle`. 너비는 트랙 너비의 `value`퍼센트 |
| 레이블 | 프로그레스 바 안, 트랙 뒤 | 자체 요소(`children`) |

인디케이터는 트랙의 시작 가장자리에서 출발합니다. `overflow-hidden`와(과) 트랙의 반경이 트랙의 끝을 둥글게 처리합니다. `w-*` 클래스나 `indicatorStyle` 안의 `width`이(가) 값에 따른 너비를 대체하며, 이를 이용해 불확정 상태의 바가 자체 너비를 갖게 됩니다.

## Indeterminate

범위를 알 수 없는 동안에는 `indeterminate`을(를) 설정하고, 인디케이터에 앱이 정한 너비와 모션을 지정합니다. 모션은 앱이 선택하며, `motion-reduce:`은(는) 모션 감소를 요청한 사용자에게는 움직임 없이 정지된 상태로 유지합니다.

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## 접근성

- 스크린 리더에는 프로그레스 바가 하나의 요소로 인식되며, 역할은 `"progressbar"`, 범위는 0에서 100이고 값이 함께 제공됩니다(VoiceOver와 TalkBack은 이를 백분율로 읽어 줍니다). 트랙과 인디케이터는 그 일부입니다. 레이블은 자식 요소의 텍스트이며, 자식에 텍스트가 없으면 `accessibilityLabel`을(를) 지정하세요.
- `indeterminate` 동안에는 역할과 범위는 유지되고 값은 없습니다(브라우저에서는 ARIA가 불확정 progress bar에 대해 규정한 대로 `aria-valuenow`이(가) 생략됩니다).
- 누르기 입력과 키보드 포커스를 받지 않습니다. 진행 상태를 알려 주기만 하며, 작업을 시작하거나 중지하는 컨트롤은 앱이 제공합니다.

레이블, 역할, 안내 방송에 관한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 모든 플랫폼은 앱이 스타일로 지정한 대로 그립니다. 인디케이터의 너비는 `value`을(를) 즉시 따르며, 앱이 애니메이션을 적용하면 변경도 애니메이션으로 표시됩니다.
- 스크린 리더: VoiceOver(iOS, macOS)는 값을 백분율로 읽고 바가 자주 갱신된다고 알려 줍니다. TalkBack, UI Automation(Windows), GTK의 접근성 기능(Linux), 브라우저(`aria-valuenow`)는 범위와 값을 받습니다.
