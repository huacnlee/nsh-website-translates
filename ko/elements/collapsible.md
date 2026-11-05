---
title: "Collapsible"
description: "Collapsible 컴포넌트: 콘텐츠가 펼쳐지고 접히는 영역으로, 앱이 열어 둔 동안 자식 요소 뒤에 표시되며, 요청 시 스프링 방식의 높이 변화로 나타납니다. 트리거와 모든 외형은 앱이 정합니다."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

Collapsible은 내용이 펼쳐지고 접히는 영역입니다. 요약 아래의 상세 내용, "더 보기", 고급 설정 섹션 등이 그 예입니다. 자식 요소는 항상 렌더링하고, `open` 동안에는 그 뒤에 `content`도 렌더링합니다. 앱이 `open`와 그 값을 전환하는 트리거(자식 요소 중 하나)를 소유하며, 모양도 앱이 정합니다. `Collapsible`에는 자체 트리거, 쉐브론, 레이블이 없습니다. `reveal`를 사용하면 콘텐츠가 모션과 함께 열리고 닫힙니다. 영역의 높이가 0에서 콘텐츠 본래의 높이까지 스프링 애니메이션으로 늘어나고 다시 줄어들며, Collapsible 뒤에 오는 요소도 함께 움직입니다.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible`는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 가져옵니다. 값은 앱이 소유합니다. 트리거가 `open`를 전환하고, Collapsible은 앱이 전달한 값을 표시합니다. Rust에서는 `collapsible()`로 Collapsible을 만들 수 있으며, prop마다 setter(`.open(..)`, `.reveal(..)`, `.content(..)`)가 있고, 영역을 위한 타입이 지정된 스타일 메서드와 항상 표시되는 내용을 위한 `.child(..)`가 제공됩니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | 펼침 상태입니다. `content`가 자식 요소 뒤에 트리에 포함됩니다. 값은 앱이 소유합니다. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 리빌(reveal)과 함께 열고 닫습니다. 콘텐츠는 이를 잘라내는 영역 안에 놓이며, 그 영역의 높이는 `open`가 켜지면 0에서 콘텐츠 본래의 높이까지 늘어나고 꺼지면 다시 줄어듭니다. 이때 오버슈트 없이 임계 감쇠(약 265ms)로 움직입니다. Collapsible 뒤에 오는 요소도 함께 움직이며, 콘텐츠는 영역이 완전히 닫힐 때까지 트리에 남아 있습니다. 동작 줄이기(reduced motion)가 설정되어 있으면 즉시 열고 닫힙니다. 영역은 닫혀 있을 때도 높이 0으로 레이아웃에 포함되므로, Collapsible의 `gap`도 그 앞에 옵니다. |
| `content` | `.content(..)` | `JSX.Element` | 없음 | 펼쳐지는 내용입니다. 한 번 만들어지면 접혀 있는 동안에도 유지되므로, 그 안의 상태(입력 필드의 텍스트, 스크롤 위치, 스위치)가 다음에 열릴 때까지 보존됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 펼침 여부와 관계없이 항상 표시되는 내용입니다. 요약이나 `open`를 전환하는 트리거가 여기에 해당합니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 자식 요소와 콘텐츠를 둘러싼 영역입니다(`gap-2`로 간격을 지정합니다). |

<a id="events"></a>

## 이벤트

Collapsible은 자체적으로 보고하는 이벤트가 없습니다. 트리거는 앱의 것이며, 트리거의 press(`role="button"`가 설정된 `View`의 `onPress`)가 앱이 `open`를 전환하는 지점입니다.

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일 지정 방법 |
|---|---|---|
| 영역 | | `class`, `style` |
| 자식 요소 | 영역 안, 맨 앞 | 각자의 요소 |
| 리빌 영역 | 영역 안, 자식 요소 뒤, `reveal` 사용 시 | 없음: 콘텐츠를 잘라내고 그 높이를 따릅니다 |
| 콘텐츠 | 영역 안, 자식 요소 뒤(`reveal` 사용 시 리빌 영역 안), `open` 동안 | 각자의 요소(`content`) |

`reveal`를 사용하지 않으면 콘텐츠가 즉시 나타나고 사라지며, 각 플랫폼은 콘텐츠가 들어오거나 나갈 때 영역의 레이아웃을 다시 계산합니다. `reveal`를 사용하면 `open`를 바꾸는 커밋이 레이아웃 애니메이션이 됩니다(`LayoutAnimation.configureNext`로, 네이티브에서 실행되므로 움직이는 동안 JavaScript가 실행되지 않습니다). 리빌 영역은 0에서 콘텐츠의 높이까지 늘어났다가 다시 줄어들고, 같은 변경으로 움직이는 모든 요소의 프레임, 즉 Collapsible 뒤에 오는 뷰도 함께 움직입니다. 앱의 트랜지션도 함께 적용할 수 있습니다. 트리거의 쉐브론이 회전하고(`transition-transform`), 콘텐츠는 자체 클래스로 페이드 인할 수 있습니다.

<a id="accessibility"></a>

## 접근성

- 영역 자체는 스크린 리더에게 별도의 요소가 아닙니다. 자식 요소와 콘텐츠가 있는 그대로 읽힙니다.
- 트리거는 영역이 펼쳐져 있는지를 알려야 합니다. `accessibilityState={{ expanded: open }}`와 버튼 역할(`View`의 `role="button"`)을 지정하면 스크린 리더가 레이블과 함께 "expanded" 또는 "collapsed"를 안내합니다.
- macOS와 웹에서는 트리거가 press를 받을 때 키보드 포커스 정지점이 됩니다. Tab으로 이동하고, Space와 Return으로 영역을 전환합니다.

레이블, 역할, 안내에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고

- 모든 플랫폼은 `open` 동안 자식 요소 뒤에 콘텐츠를 표시하고, 그렇지 않을 때는 레이아웃에서 제외합니다.
- `reveal`를 사용하면 모든 플랫폼(iOS, Android, macOS, Windows, Linux, GPUI, 웹)이 각자의 애니메이터로 영역의 높이를 스프링 애니메이션으로 움직이며, 시스템이 동작 줄이기를 요청하는 동안에는 즉시 열고 닫습니다.
- iOS, Android, Mac Catalyst에서 트리거의 press는 탭입니다. 데스크톱(macOS, Windows, Linux, GPUI)과 웹에서는 클릭이며, macOS와 웹에서는 포커스된 트리거에서 Space 또는 Return도 해당합니다.
