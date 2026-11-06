---
title: "Toolbar"
description: "Toolbar, ToolbarGroup, ToolbarSeparator: 버튼, 토글, 링크로 이루어진 바로, 키보드 포커스에서는 하나의 정지점(tab stop)으로 동작하며 방향키로 바 안에서 이동할 수 있고, 이름이 지정된 그룹과 구분선을 지원합니다. 각 컨트롤의 모양과 상태는 앱에서 관리합니다."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

툴바는 컨트롤을 모아 놓은 바입니다. 텍스트 편집기의 서식 도구, 미디어 플레이어의 재생 컨트롤, 세로 도구 팔레트가 그 예입니다.
`Toolbar`는 툴바의 키보드 동작과 시맨틱을 담당합니다. 스크린 리더는 툴바를 안내하고(이름은 `accessibilityLabel`로 지정), 키보드는 한 번에 툴바로 진입하여 `axis`의 화살표 키로 항목 사이를 이동합니다. 항목은 툴바 안에 있는 `Button`, `Toggle`, `Link`이며 깊이는 상관없습니다. `ToolbarGroup`은 관련 항목을 묶어 이름을 붙인 모음(실행 취소와 다시 실행, 정렬 등)이고, `ToolbarSeparator`은 앱이 모음 사이에 그리는 선입니다. 모양은 앱이 정합니다. 툴바에는 자체 색상, 패딩, 간격이 없으며 각 컨트롤은 자신의 상태를 유지합니다.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup`, `ToolbarSeparator`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 툴바는 값을 갖지 않습니다. 툴바 안의 토글은 눌린 상태인지를 전달받아 `onChange`을 보고하고, 버튼은 `onPress`를 보고하며, 상태는 앱이 유지합니다. Rust에서는 `toolbar()`, `toolbar_group()`, `toolbar_separator()`로 이들을 만들며, 속성마다 setter(`.axis(..)`, `.disabled(..)`), 타입이 있는 스타일 메서드, 내용을 위한 `.child(..)`가 있습니다.

## Props

<a id="toolbar-1"></a>

### Toolbar

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 항목이 늘어서는 방향입니다. 이 방향을 따라 이동하는 화살표 키(왼쪽/오른쪽 또는 위/아래)와 자식을 배치하는 방향(행 또는 열)을 결정합니다. 툴바를 만들 때 읽습니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 각 항목의 `disabled` 값과 관계없이 툴바의 모든 항목을 비활성화합니다. 누를 수 없고, 키보드 포커스 정지 지점에서 제외되며, 스크린 리더에는 흐리게 표시된 것으로 전달됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 툴바를 부르는 이름입니다("Formatting"). 한 페이지에 툴바가 둘 이상일 때 사용합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 항목, 그룹, 구분선과 앱이 그 사이에 배치하는 모든 것(제목, 스페이서, 입력 등)입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 바의 레이아웃과 모양입니다. 정렬, 간격, 패딩, 표면을 지정합니다. |

### ToolbarGroup

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 각 항목의 `disabled` 값과 관계없이 그룹의 모든 항목을 비활성화합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 그룹을 부르는 이름입니다("History", "Alignment"). |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 그룹의 항목과 앱이 그 사이에 배치하는 모든 것입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 그룹의 레이아웃과 모양입니다. 툴바의 축을 따라 늘어섭니다. |

### ToolbarSeparator

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 구분선입니다. 행(`h-5 w-px bg-border`)이나 열(`h-px self-stretch bg-border`)을 가로지르는 가는 선입니다. |

<a id="items"></a>

## 항목

툴바의 항목은 그 안에 있는 `Button`, `Toggle`, `Link`이며, 그룹 안에 있는 것과 툴바 안의 [`ToggleGroup`](./toggle.md) 안에 있는 것도 포함합니다. [`Menu`](./menu.md)나 [`Popover`](./popover.md)의 트리거도 항목입니다. 트리거는 `trigger` 슬롯에 있는 뷰로, 팝업이 여기에 누르기, 포커스, `expanded` 상태를 부여합니다. 앱이 직접 그리는 도구는 앱의 클래스를 가진 `Button`입니다. `Button`는 자체 모양이 없으므로 앱이 지정한 스타일대로 보이며 항목이 됩니다(`onPress`이 있는 `View`는 화살표 키 이동 대상에서 벗어난 별도의 정지 지점으로 남습니다). 툴바 안의 `ToggleGroup`은 그 툴바의 그룹 중 하나입니다. 이 그룹의 토글은 툴바의 항목이 되고, 스크린 리더는 그룹으로 읽으며, 그룹의 `disabled`은 여전히 자신의 토글을 비활성화합니다. 그 밖의 컨트롤(`Input`, `Select`, `Slider`)은 별도의 정지 지점으로 남고 자신의 화살표 키 동작을 유지하므로, 바의 끝에 두십시오. 항목이 여는 팝업에 표시되는 내용(팝오버의 필드와 버튼, 메뉴의 항목, 호버 카드의 링크)은 툴바에 속하지 않습니다. 화살표 키는 바가 배치한 순서대로 항목을 거치며, 항목이 얼마나 깊이 있든 상관없습니다. 앱이 나중에 표시하는 항목도 그 순서에 맞는 자리에 들어갑니다.

<a id="parts"></a>

## 구성 요소

| 부분 | 포함 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 바 | | `Toolbar`의 `class`, `style` | |
| 그룹 | 바 | `ToolbarGroup`의 `class`, `style` | |
| 구분선 | 바, 그룹 | `ToolbarSeparator`의 `class`, `style` | |
| 항목 | 바, 그룹 | 항목 자체의 `class`, `style` | 항목 자체의 상태: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

키보드가 위치한 항목은 `focus:` 스타일로 표시하고, 눌린 토글은 해당 토글 자체의 표면으로 표시하십시오([디자인 가이드](../docs/design-guides.md#interaction-states) 참고).

<a id="vertical"></a>

## 세로 방향

도구 팔레트는 열입니다. `axis="vertical"`은 항목을 위에서 아래로 배치하며, 위쪽과 아래쪽 화살표 키로 항목 사이를 이동합니다.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## 비활성화

툴바의 `disabled`은 그 안의 모든 항목을 비활성화하여 앱이 바를 잠급니다. 그룹에서는 그룹의 항목을 비활성화합니다. 비활성화된 항목은 누를 수 없고, 화살표 키가 건너뛰며, 스크린 리더는 흐리게 표시된 것으로 안내합니다.

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## 접근성

- `Toolbar`의 역할은 `"toolbar"`이며 `accessibilityLabel`로 이름이 지정됩니다. 항목은 각자 별도의 요소로 남습니다. iOS에서 툴바는 VoiceOver가 진입하는 시맨틱 그룹입니다.
- `ToolbarGroup`의 역할은 `"group"`이며 `accessibilityLabel`로 이름이 지정되어, 항목 모음이 하나의 단위로 읽힙니다. 툴바 안의 `ToggleGroup`도 그룹입니다.
- `ToolbarSeparator`은 스크린 리더에 요소로 노출되지 않습니다.
- `disabled`은 플랫폼이 안내하는 방식대로 안내됩니다(VoiceOver, TalkBack, UI Automation, 브라우저의 접근성 트리).

레이블, 역할, 안내에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하십시오.

<a id="keyboard"></a>

## 키보드

Tab이 누르기를 받는 뷰에 도달하는 macOS와 웹에서 `Toolbar`은 [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)을 따릅니다.

| 키 | 동작 |
|---|---|
| Tab, Shift+Tab | 포커스가 마지막으로 떠난 항목(처음에는 비활성화되지 않은 첫 번째 항목)으로 툴바에 진입하고, 한 번에 툴바를 벗어납니다. |
| 오른쪽, 왼쪽 (`axis="horizontal"`) | 포커스를 다음 또는 이전 항목으로 이동하며, 마지막에서 처음으로, 처음에서 마지막으로 순환합니다. |
| 아래쪽, 위쪽 (`axis="vertical"`) | 포커스를 다음 또는 이전 항목으로 이동하며, 마지막에서 처음으로, 처음에서 마지막으로 순환합니다. |
| Home, End | 포커스를 첫 번째 또는 마지막 항목으로 이동합니다. |
| Space, Return | 포커스된 항목을 누릅니다. |

화살표 키는 비활성화된 항목을 건너뛰며 아무것도 누르지 않습니다. 토글은 눌렀을 때만 바뀝니다. 나머지 한 쌍의 화살표는 항목에 맡겨집니다(메뉴의 트리거는 아래쪽 화살표로 메뉴를 엽니다). 오른쪽에서 왼쪽으로 쓰는 레이아웃에서 가로 툴바는 오른쪽에서 시작하므로 왼쪽 화살표가 다음 항목으로, 오른쪽 화살표가 이전 항목으로 이동합니다. 세로 툴바는 아래쪽과 위쪽 화살표 동작을 그대로 유지합니다.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS, Android, Mac Catalyst: 각 항목은 탭으로 누르며, 툴바는 스크린 리더가 안내하는 그룹입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누르기는 클릭입니다. macOS와 웹에서 툴바는 Tab의 정지 지점 하나이며, 화살표 키, Home, End로 항목 사이를 이동합니다([키보드](#keyboard)).
- 모든 플랫폼은 앱이 스타일을 지정한 것(바, 그룹, 구분선, 항목)을 그대로 그립니다.
