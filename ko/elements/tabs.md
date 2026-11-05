---
title: "Tabs"
description: "Tab과 Tabs: 탭 목록의 탭과 목록입니다. 각 탭은 누르기(press), 키보드 활성화, 비활성 상태, 그리고 스크린 리더를 위한 역할과 선택 상태를 담당하며, 목록은 그 탭들의 집합으로서 선택된 탭을 네이티브 방식으로 따라가는 인디케이터를 제공합니다. 모양, 값, 그리고 각 탭이 표시하는 콘텐츠는 앱이 결정합니다."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# Tabs

Tabs는 한 곳의 여러 섹션 사이를 전환합니다. 프로젝트의 개요와 활동, 문서의 보기 같은 것입니다.
각 `Tab`는 탭 하나의 동작을 담당합니다. 누르기, 키보드 활성화, 비활성 상태, 그리고 스크린 리더를 위한 tab 역할과 선택 상태입니다. 이들을 감싸는 `Tabs`는 탭 목록이며, 스크린 리더는 이를 하나의 집합으로 알립니다. 모양은 앱의 몫입니다. 탭에는 자체 색상, 크기, 레이블이 없습니다. 탭의 자식 요소가 앱의 레이블이며, 탭의 `selected:` 클래스나 탭 안쪽 요소의 `group-selected:` 클래스가 탭의 상태를 따릅니다. 각 섹션의 콘텐츠도 앱의 몫입니다. 목록 옆에 해당 value가 가리키는 섹션을 보여 줍니다. 목록의 인디케이터는 앱이 스타일을 지정하는 밑줄이나 알약 모양이며, 선택된 탭 위에 놓이고 다음 탭으로 네이티브하게 이동합니다
([Indicator](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab`와 `Tabs`는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. value는 앱의 몫이며, 목록은 value를 갖지 않습니다. 각 탭은 자신이 선택되었는지 전달받고, 누르면 `onPress`를 보고합니다. 앱은 value를 설정하고 해당 섹션을 보여 주며, 모든 탭은 앱이 다시 전달하는 `selected`를 표시합니다. 목록의 모서리와 탭의 모서리는 동심원을 이룹니다. 목록의 패딩(`p-1`)은 `radius.lg`와 `radius`의 차이입니다. 선택된 탭의 채움은 목록의 인디케이터(`indicatorClass`, 해당 패딩 안쪽: `inset-y-1`)이며, 앱이 선택한 탭으로 스프링 애니메이션과 함께 이동합니다. Rust에서는 `tab()`와 `tabs()`가 이들을 만들며, 속성마다 setter(`.selected(..)`), 이벤트마다 리스너(`.on_press(..)`), 타입이 지정된 스타일 메서드, 그리고 콘텐츠를 위한 `.child(..)`를 제공합니다.

## Props

### Tab

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | 목록의 현재 탭입니다. 스크린 리더는 이 탭이 선택되었다고 알리며, `selected:` 스타일이 적용됩니다. 누르면 `onPress`를 보고하고, 탭은 앱이 다시 전달하는 값을 표시합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기도, 누름 피드백도 없습니다. `disabled:` 스타일이 적용되며, 스크린 리더는 흐리게 표시된 상태라고 알립니다. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 선택되었고 비활성이 아닐 때의 탭 스타일이며, `selected:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 말하는 내용입니다. 자식 요소에 이름을 말해 주는 텍스트가 없을 때(아이콘 등) 탭의 이름이 됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 앱의 레이블, 아이콘 또는 배지이며, 스크린 리더가 읽습니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 탭 자체, 즉 레이블을 둘러싼 표면입니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스 또는 비활성 상태일 때의 탭 스타일이며, `<state>:` 클래스로 지정합니다. |

<a id="tabs-1"></a>

### Tabs

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | 없음 | 선택된 탭 위에 놓이는 인디케이터의 Tailwind 클래스입니다. 인디케이터의 모양과 목록을 가로지르는 방향의 위치를 지정합니다(행에서 밑줄은 `bottom-0 h-0.5`, 알약은 `inset-y-1`). 목록의 방향을 따라서는 해당 축의 자체 여백 안쪽에서 선택된 탭 전체에 걸칩니다. `indicatorClass` 또는 `indicatorStyle`가 있으면 목록에 인디케이터가 있습니다. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | `indicatorClass` 위에 적용되는 인디케이터의 스타일입니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 목록의 탭들과, 앱이 그 사이에 배치하는 모든 요소입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 목록의 레이아웃과 모양입니다. 기본값은 열이며, 행으로 하려면 `flex-row`를 사용합니다. |

## Events

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | 탭이 눌렸습니다. 탭, 클릭, 탭에 키보드 포커스가 있을 때의 Space 또는 Return, 스크린 리더의 활성화, 또는 목록의 화살표 키, Home, End가 키보드 포커스를 그 탭으로 옮긴 경우입니다. 아무것도 바뀌기 전에 실행되며, 탭은 앱이 다시 전달하는 `selected`를 표시합니다. |

선택된 탭도 누름을 보고하므로, 앱은 두 번째 누름에 반응할 수 있습니다(예: 해당 섹션을 맨 위로 스크롤).
비활성 탭은 아무것도 보고하지 않습니다.

## Parts

| 부분 | 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 목록 | | `Tabs`의 `class`, `style` | |
| 인디케이터 | 목록 안, 탭 뒤 | `indicatorClass`, `indicatorStyle` | 선택된 탭 위 |
| 탭 | 목록 | `Tab`의 `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (또는 `selectedStyle`, `disabledStyle`, ...) |
| 레이블 | 탭 | 자체 요소 (`children`) | `group-selected:`, `group-disabled:` 및 탭의 `class`에 `group`을 둔 다른 `group-*:` 변형 |
| 섹션의 콘텐츠 | 목록 옆 | 앱의 요소 | 앱의 value |

선택된 탭은 자체 표면으로 보여 주세요. 채움, 더 강한 레이블, 더 굵은 글꼴 두께를 사용할 수 있습니다
([Design guides](../docs/design-guides.md#interaction-states) 참고).

## Indicator

선택된 탭 아래의 밑줄, 그 뒤의 알약 모양, 또는 세그먼트 컨트롤의 도드라진 세그먼트는 목록의 인디케이터입니다. 앱이 `indicatorClass`와 `indicatorStyle`로 스타일을 지정하는 뷰이며, 탭 뒤에 그려지고 목록 안에서 절대 위치로 배치됩니다. Native Shell은 매 레이아웃 후 이 뷰를 선택된 탭 위에 배치합니다. 목록 방향(행의 너비, 열의 높이)으로는 해당 축의 인디케이터 자체 여백 안쪽에서 그 탭 전체에 걸칩니다(탭보다 짧은 밑줄에는 `mx-3`). 목록을 가로지르는 방향에서는 인디케이터의 클래스가 위치를 정합니다.

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

앱이 다른 탭을 선택하면 인디케이터는 GPUI Kit의 tab bar 인디케이터처럼 네이티브하게 스프링 애니메이션으로 그곳으로 이동합니다. 동작 줄이기가 켜져 있으면 즉시 이동합니다. 선택된 탭이 없으면 숨겨지고, 여러 개가 선택되어 있으면 첫 번째 탭 위에 놓입니다. 크기 변경이나 탭 너비의 변화가 있으면 탭과 같은 프레임에서 이동합니다. 인디케이터에는 레이아웃 이벤트도, 앱의 코드도 필요하지 않습니다. 선택된 탭은 `selected`가 true인 탭입니다. 스크롤되는 목록에서는 스크롤 뷰가 `Tabs`를 감싸고, 인디케이터는 탭과 함께 스크롤됩니다.

## Disabled

비활성 탭은 누름을 받지 않으며, 스크린 리더는 이를 흐리게 표시된 상태로 알립니다. 탭의 `disabled:` 클래스는 `selected:` 클래스 위에 적용되고, 그 안쪽의 `group-disabled:` 클래스가 뒤따릅니다.

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

## Accessibility

- 탭은 스크린 리더에게 하나의 요소이며, 역할은 `"tab"`이고 선택 상태를 가집니다. 레이블은 자식 요소의 텍스트 또는 `accessibilityLabel`입니다.
- `Tabs`의 역할은 `"tablist"`입니다. 스크린 리더는 그 안의 탭들을 하나의 집합으로 인식하며, 각 탭은 여전히 별개의 요소입니다.
- `disabled`는 플랫폼이 알리는 방식대로 알려집니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).
- macOS와 웹에서 목록은 키보드 포커스의 정지점 하나이며, 화살표 키로 탭 사이를 이동합니다(아래 참고).
- 인디케이터는 스크린 리더에서 숨겨지고 포커스를 받지 않습니다. 목록의 요소는 탭뿐입니다.

레이블, 역할, 안내 전반에 대해서는 [Accessibility](../docs/accessibility.md)를 참고하세요.

## Keyboard

Tab으로 누름을 받는 뷰에 접근할 수 있는 macOS와 웹에서, `Tabs` 목록은
[WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)을 따릅니다.

| 키 | 동작 |
|---|---|
| Tab, Shift+Tab | 선택된 탭(선택된 탭이 없으면 비활성이 아닌 첫 번째 탭)으로 목록에 진입하고, 한 번에 목록을 벗어납니다. |
| Right, Down | 포커스를 다음 탭으로 옮기며, 마지막 탭에서는 첫 번째 탭으로 이동합니다. |
| Left, Up | 포커스를 이전 탭으로 옮기며, 첫 번째 탭에서는 마지막 탭으로 이동합니다. |
| Home, End | 포커스를 첫 번째 또는 마지막 탭으로 옮깁니다. |
| Space, Return | 포커스된 탭을 누릅니다. |

화살표 키는 비활성 탭을 건너뛰며, 포커스가 이동한 탭은 `onPress`를 보고하므로 앱은 포커스가 이동하는 대로 그 탭을 선택합니다. 즉 섹션이 포커스를 따라갑니다. 두 쌍의 화살표 키 모두 목록의 레이아웃과 상관없이 이동하며, 레이아웃은 앱의 클래스가 정합니다. 오른쪽에서 왼쪽으로 쓰는 레이아웃에서는 행이 오른쪽에서 시작하므로 Left와 Right의 역할이 바뀝니다. Left는 다음 탭으로, Right는 이전 탭으로 이동하며, Up, Down, Home, End는 그대로입니다. `focus:` 스타일은 포커스가 어디에 있는지 보여 줍니다. `Tabs` 밖의 `Tab`는 독립된 정지점입니다.

## Platform notes

- iOS, Android, Mac Catalyst: 누름은 레이블을 포함해 탭 위에서 끝나는 탭 동작입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누름은 클릭입니다. macOS와 웹에서는 Space와 Return도 키보드 포커스가 있는 탭을 누르며, 화살표 키, Home, End는 포커스를 이동합니다([Keyboard](#keyboard)).
- 모든 플랫폼은 앱이 스타일을 지정한 것을 그립니다. 탭, 선택된 탭의 표면, 인디케이터, 섹션의 콘텐츠가 해당합니다. 인디케이터의 이동은 모든 플랫폼에서 네이티브 레이아웃 애니메이션입니다.
