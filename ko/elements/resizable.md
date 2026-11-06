---
title: "Resizable"
description: "ResizablePanelGroup과 ResizablePanel: 패널을 나란히 또는 위아래로 배치하고, 각 패널 사이의 핸들을 사용자가 드래그해 공간을 나눠 가질 수 있게 합니다. 그룹은 드래그, 패널의 크기 제한, 크기 조절 커서, 스크린 리더를 위한 핸들의 역할을 담당하며, 크기, 핸들의 모양, 패널의 콘텐츠는 앱이 담당합니다."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

Resizable 그룹은 패널들을 나란히 또는 위아래로 쌓아 배치하며, 인접한 두 패널 사이의 경계마다 핸들이 하나씩 있습니다. 문서 옆의 사이드바, 콘솔 위의 에디터, 상세 화면 옆의 목록이 그 예입니다. 사용자가 핸들을 드래그하면 경계가 이동하고, 각 패널은 앱이 허용하는 크기 범위 안에 머뭅니다. 동작은 `ResizablePanelGroup`에서 담당합니다. 프레임 단위로 네이티브에서 실행되는 드래그, 공간을 나누는 방식, 크기 조절 커서, 손가락을 위한 더 넓은 터치 영역이 여기에 해당합니다. 외형은 앱의 몫입니다. 핸들은 자체 선, 색, 그립이 없는 띠이며, 여기에 그려지는 것은 앱의 인디케이터입니다. 패널은 앱의 뷰입니다.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup`, `ResizablePanel` 모두 Rust용 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 패널은 그룹의 직접 자식입니다. Rust에서는 `h_resizable()` / `v_resizable()`으로 각 축 방향의 그룹을 만들고(`resizable_panel_group().axis(..)`에는 축을 값으로 전달합니다) `resizable_panel()`로 패널을 만들며, 각각 prop마다 setter, 이벤트마다 리스너, 타입이 지정된 스타일 메서드, 콘텐츠를 위한 `.child(..)`을 제공합니다. `.size_range(min..max)`은 두 한계를 한 번에 설정합니다.

<a id="sizes"></a>

## 크기

패널의 `size`은 `minSize`과 `maxSize` 범위 안에서 패널이 원하는 크기입니다. 크기가 없는 패널은 콘텐츠와 관계없이 남은 공간을 균등하게 나눠 가지며, 모든 패널에 크기가 있으면 남은 공간은 그 크기에 비례해 나뉩니다. 사용자가 핸들을 드래그하는 동안 그룹은 JS를 거치지 않고 코어에서 패널 사이의 공간을 이동시킵니다.

- 핸들 앞 패널을 키우면 뒤쪽 패널들에서 가까운 것부터 차례로 공간을 가져오며, 각 패널은 `minSize`까지만 줄어들고 `fixed` 패널은 건너뜁니다.
- 핸들 앞 패널을 `minSize`보다 작게 줄이면 그 앞쪽 패널들에서 공간을 가져옵니다.
- 어떤 패널도 `maxSize`을 넘어 커지지 않으며, 패널들의 합이 그룹보다 커지는 일은 없습니다.

드래그가 끝났을 때 크기가 바뀌었다면, 그룹은 보이는 모든 패널의 크기를 배치 순서대로 보고하고(그룹의 `onResize`), 크기가 바뀐 각 패널은 자신의 크기를 보고합니다(패널의 `onResize`). 드래그로 이동한 패널은 앱이 새 `size`을 전달할 때까지 사용자가 정한 크기를 유지합니다. 앱은 보고된 크기를 `size`으로 다시 전달해 그룹의 수명을 넘어서도 크기를 유지할 수 있으며, 그래서 [저장소](../modules/nsh.md#storage)에서 복원한 레이아웃은 사용자가 마지막으로 둔 크기로 열립니다. 보고되는 것은 드래그와 스크린 리더의 단계 조절뿐이며, 창 크기가 바뀌거나 패널이 표시되거나 숨겨질 때는 아무것도 보고되지 않습니다.

그룹이 커지거나 작아지면(창 크기 조절) 크기가 있는 패널은 그대로 유지하고, 크기가 없는 패널이 차이를 흡수합니다. 그룹이 크기들의 합보다 작아지면 `fixed` 패널(사이드바, 인스펙터)을 제외한 패널들이 줄어들고, 공간이 돌아오면 원래 크기로 돌아옵니다. `visible={false}`인 패널은 공간을 차지하지 않으며, 다른 패널들이 그 공간을 나눠 가졌다가 다시 표시되면 원래 크기로 돌아옵니다.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## 핸들

보이는 두 패널 사이의 경계마다 핸들이 하나씩 있습니다. 핸들은 축을 가로지르는 두께 9포인트의 띠로, 경계를 중심으로 놓이며 해당 축의 크기 조절 커서를 가집니다. 터치 화면에서는 터치 영역이 양쪽으로 10포인트씩 더 넓어져, 1포인트 선도 쉽게 잡을 수 있습니다. 핸들은 `group`입니다. 여기에 그려지는 것은 앱의 인디케이터이며, `handleClass` / `handleStyle`으로 스타일을 지정합니다. 인디케이터는 축 방향 두께 1포인트에 경계의 전체 길이이므로, `bg-border`만 지정해도 어느 축에서나 헤어라인이 되고, `w-[3px]` 또는 `h-[3px]`으로 두껍게 만들 수 있으며, `group-hover:` 및 `group-active:` 클래스는 띠 위의 포인터와 누름 또는 드래그를 따릅니다. 선 이상이 필요하면(점 모양 그립, 아이콘) `renderHandle`이 인디케이터의 콘텐츠를 렌더링하며, 핸들의 `index`, `axis`, `state`가 전달됩니다. 이 콘텐츠는 상태가 바뀔 때 다시 그려지며, 드래그당 몇 번 정도이고 이동할 때마다 그려지지는 않습니다. 애니메이션되는 그립은 핸들의 썸(`handleThumbClass` / `handleThumbStyle`)입니다. 선 중앙에 놓인 하나의 뷰로, 세로선에서는 똑바로, 가로선에서는 90도 돌려서 그려지므로 하나의 클래스로 두 축을 모두 처리하며, `group-hover:` 및 `group-active:` 클래스가 이를 표시하고 전환합니다. 핸들은 포인터가 어디로 가든 드래그 내내 눌린 상태로 유지됩니다.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled`은 모든 핸들을 제자리에 고정합니다(잠긴 레이아웃).

## Props

### ResizablePanelGroup

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 나란히(핸들을 좌우로 드래그) 또는 쌓아서(상하로 드래그) 배치합니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 드래그할 수 없으며, 핸들은 제자리에 유지됩니다. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 경계 위, 핸들의 띠 안에 놓이는 각 핸들의 인디케이터입니다. 별도로 지정하지 않으면(`w-[3px]`, `h-[3px]`) 축 방향 두께 1포인트에 경계의 전체 길이이며, `group-hover:`와 `group-active:`은 띠를 따릅니다. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 핸들의 썸입니다. 선 중앙에 놓이는 그립으로, 세로선처럼 똑바로 그려지고 가로선에서는 90도 돌려서 그려지므로 하나의 클래스로 두 축을 모두 처리합니다. 핸들이 호버, 누름, 드래그되는 동안에도 같은 뷰로 유지되므로 `group-hover:` 및 `group-active:` 클래스가 이를 전환합니다(`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | 없음 | 각 인디케이터 안에 들어가는 내용으로, 핸들의 `state`가 바뀔 때 다시 그려집니다. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | 없음 | 각 핸들에 대해 스크린 리더가 읽는 내용으로, 무엇의 크기를 조절하는지를 나타냅니다. 스크린 리더는 한 번에 10포인트씩 조절합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 직접 자식인 `ResizablePanel`들입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | `size-full` | 그룹 자체입니다. 클래스에서 달리 지정하지 않으면 부모를 가득 채웁니다. |

### ResizablePanel

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | 없음 | `minSize`과 `maxSize` 범위 안에서 그룹의 축 방향으로 원하는 길이(포인트 단위)입니다. 새 값을 전달하면 크기가 바뀝니다. 값이 없으면 남은 공간을 나눠 가집니다. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | 가질 수 있는 가장 작은 크기입니다. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | 제한 없음 | 가질 수 있는 가장 큰 크기입니다. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | 그룹이 패널들에 비해 너무 작을 때 자신의 크기를 유지합니다. 자신의 핸들을 드래그하면 여전히 크기가 바뀝니다. `size`를 받습니다. |
| `visible` | `.visible(..)` | `boolean` | `true` | 숨기면 공간을 차지하지 않으며 다른 패널들이 그 공간을 나눠 가집니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 패널의 콘텐츠입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 패널 자체의 표면입니다. 축 방향 크기는 그룹이 정합니다. |

### ResizeHandleContext

| 필드 | 타입 | 설명 |
|---|---|---|
| `index` | `number` | `index`번째 보이는 패널 뒤의 경계입니다. |
| `axis` | `"horizontal" \| "vertical"` | 크기를 조절하는 축입니다. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | 포인터나 손가락이 핸들과 함께 이동한 거리입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | 드래그가 끝나면서 핸들이 이동했거나, 스크린 리더가 핸들을 조절했습니다. `sizes`는 보이는 모든 패널의 크기이며 배치 순서(왼쪽에서 오른쪽, 위에서 아래)대로입니다. |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | 드래그가 끝나면서 이 패널의 크기가 바뀌었습니다. `size`는 새 크기이며, 패널의 `size`으로 다시 전달하면 됩니다. |

<a id="parts"></a>

## 파트

| 파트 | 포함 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 그룹 | | `ResizablePanelGroup`의 `class`, `style` | |
| 패널 | 그룹 | `ResizablePanel`의 `class`, `style` | |
| 핸들의 인디케이터 | 경계 위, 핸들의 띠 | `handleClass`, `handleStyle`, `renderHandle` | 포인터 아래에서 `group-hover:`, 누르거나 드래그하는 동안 `group-active:`, `renderHandle`에서 `state` |
| 핸들의 썸 | 핸들의 선 중앙 | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (드래그가 끝날 때까지 눌린 상태) |

<a id="accessibility"></a>

## 접근성

- 각 핸들은 스크린 리더용 조절 가능한 요소이며, `handleAccessibilityLabel`이 레이블로 사용됩니다. 값은 앞 패널의 크기이며, 해당 패널의 `minSize`과 `maxSize` 범위 안에 있습니다.
- VoiceOver에서 핸들을 위나 아래로 스와이프하거나 TalkBack의 볼륨 키를 누르면 드래그와 마찬가지로 10포인트씩 이동하며, 그룹은 이를 `onResize`으로 보고합니다. `disabled` 그룹의 핸들은 제자리에 유지됩니다.
- 패널의 콘텐츠는 앱의 것이며 다른 곳에서와 똑같이 읽힙니다.

레이블, 역할, 안내 방송에 대한 일반적인 내용은 [Accessibility](../docs/accessibility.md)를 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 핸들 위에 포인터를 올리면 열 또는 행 크기 조절 커서가 표시되며, 마우스나 터치패드로 드래그하면 경계가 이동합니다.
- iOS, Android, Mac Catalyst: 손가락으로 핸들을 드래그하며, 터치 영역은 띠보다 양쪽으로 10포인트씩 더 넓습니다.
- 오른쪽에서 왼쪽으로 읽는(RTL) 레이아웃에서는 패널과 그 크기가 레이아웃의 순서를 따릅니다.
- 모든 플랫폼은 앱이 스타일을 지정한 것, 즉 인디케이터와 패널을 그대로 그립니다.
- [Dock](./dock.md)의 분할 영역은 resizable 그룹이며, 같은 방식으로 크기가 조절됩니다.
