---
title: "Dock"
description: "DockArea: 분할 영역, 탭 그룹, 그리고 왼쪽·오른쪽·아래쪽 가장자리의 독(dock)으로 구성된 도킹 가능한 작업 공간이며, 레이아웃은 앱이 소유하는 데이터입니다. 이 영역은 탭 드래그 앤 드롭, 크기 조절, 독, 확대/축소 및 잠금을 관리하고, 패널이 이동하더라도 각 패널의 콘텐츠를 유지하며, 휴대폰 화면에도 맞게 조정됩니다. 외형과 패널의 콘텐츠는 앱이 담당합니다."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

dock 영역은 사용자가 직접 배치하는 작업 공간입니다. 패널은 탭 그룹에 담기고, 그룹은 나란히 또는 위아래로 분할되며, 왼쪽, 오른쪽, 아래쪽 가장자리의 dock은 열리고, 닫히고, 크기가 바뀝니다. 탭을 다른 그룹에 끌어다 놓으면 그 그룹에 합류하고, 그룹의 가장자리로 끌면 그 그룹을 분할하며, 모든 패널은 이동해도 담고 있던 내용을 그대로 유지합니다. `DockArea`가 동작을 맡습니다. 프레임 단위로 네이티브로 실행되는 탭 드래그 앤 드롭, 분할과 dock의 크기 조절, dock 열기와 닫기, 줌, 잠금이 여기에 해당합니다. 모양은 앱의 몫입니다. 탭, 탭 바, 핸들, 드롭 표시기, 각 패널의 내용은 앱이 렌더링하고 스타일을 지정하며, 영역 자체는 아무것도 그리지 않습니다.

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea`와 그것이 받는 값은 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공합니다(`nsh_base::dock_area()`, 값은 `nsh_base::dock`에 있습니다). Rust에서는 `dock_area()`가 이를 만들며, prop마다 setter가, 이벤트마다 리스너가, 그리고 타입이 지정된 스타일 메서드가 있습니다. `DockLayout`는 패널의 키로 레이아웃을 기술합니다(`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`).

<a id="the-layout"></a>

## 레이아웃

레이아웃은 `DockAreaLayout`라는 값입니다. 중앙 영역과, 왼쪽, 오른쪽, 아래쪽 가장자리에 각각 둘 수 있는 dock으로 이루어지며, dock은 모두 선택 사항입니다. 각 영역은 두 종류의 노드로 이루어진 트리입니다.

| 노드 | 담는 것 | 필드 |
|---|---|---|
| `{ type: "split" }` | 다른 노드들을 나란히(`axis: "horizontal"`) 또는 위아래로(`"vertical"`) 배치 | `children`, 그리고 `sizes`: 축을 따라 잰 각 자식의 길이(포인트 단위), 나머지를 나눠 가지려면 `null` |
| `{ type: "tabs" }` | 키로 식별되는 패널들, 한 번에 하나만 표시 | `panels`(키, 탭 순서대로), `activeIndex`(표시 중인 패널, 기본값 0) |

패널은 항상 탭 그룹에 속합니다. 패널이 하나뿐인 영역은 패널 하나짜리 탭 그룹입니다. 패널의 키는 앱이 그 패널에 붙이는 문자열(`"files"`, 문서의 id)이며, 하나의 키는 전체 레이아웃에서 한 번만 나타납니다. dock(`DockRegion`)은 트리(`layout`), 가장자리 방향의 크기(`size`, 기본값 200, 최소 100), 열려 있는지 여부(`open`, 기본값 `true`), 그리고 가장자리를 최소 크기 아래로 끌면 닫히는지 여부(`collapsible`, 기본값 `true`)로 구성됩니다.

모든 노드에는 `id`가 있습니다. 앱이 작성하는 레이아웃에서는 id를 생략할 수 있으며, 이 경우 영역이 id를 부여하고 영역이 보고하는 모든 레이아웃에는 id가 포함됩니다. 보고된 레이아웃을 그대로 다시 전달하면 각 그룹의 정체성이 유지되며, ref의 메서드는 이 id로 그룹을 지정합니다. 영역은 전달받은 레이아웃을 정리하기도 합니다. 비어 있는 그룹이나 분할은 제거되고, 자식이 하나뿐인 분할은 그 자식으로 대체되며, 같은 축의 분할 안에 있는 분할은 부모에 합쳐지고, `activeIndex`는 범위 안으로 유지되며, 두 번 나열된 키는 처음 위치만 남습니다. 영역이 보고하는 레이아웃은 항상 이 하나의 정규 형태입니다.

레이아웃은 앱이 소유합니다(`layout`). 사용자가 일으키는 모든 변경(탭 선택, 드래그, 닫기, 분할이나 dock의 크기 조절, dock 열기와 닫기)은 새 레이아웃 전체로 보고되며(`onLayoutChange`), 영역은 앱이 다시 전달한 레이아웃을 표시합니다. 앱은 새 값을 전달해서 직접 레이아웃을 바꿀 수 있습니다. 저장된 레이아웃을 복원하거나, 작업 공간을 재배치하는 명령을 실행하는 경우가 그렇습니다. `layout`가 없는 영역은 `defaultLayout`에서 시작하는 자신의 레이아웃을 유지하며, 모든 변경을 그대로 보고합니다.

<a id="panels-content"></a>

## 패널의 내용

패널이 무엇을 보여 줄지는 앱이 정합니다. `renderPanel`가 패널의 키(`panel.id`)로 내용을 렌더링합니다. 그룹의 모든 패널은 배치되어 있고 표시 중인 패널만 보이므로, 탭을 전환해도 각 패널의 내용이 유지됩니다. 패널이 이동할 때(다른 그룹으로, dock 안으로, 줌 상태로 들어갔다 나올 때)에도 같은 내용이 함께 이동합니다. 패널이 만든 signal, 입력란의 텍스트, 스크롤 위치, 웹 뷰의 페이지가 모두 그대로 남습니다. 영역은 패널이 처음 나타날 때 한 번 렌더링하고, 패널이 레이아웃에서 사라지면 그 내용을 해제합니다(`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels`은 각 패널이 허용하는 동작을 키별로 지정합니다. 나열되지 않은 패널은 모든 동작을 허용합니다.

| 필드 | 기본값 | 설명 |
|---|---|---|
| `id` | | 패널의 키. |
| `closable` | `true` | 닫을 수 있습니다. |
| `zoomable` | `true` | 이 패널이 표시되는 동안 해당 그룹을 줌할 수 있습니다. |
| `visible` | `true` | 표시됩니다. 숨겨진 패널은 자기 자리를 유지하다가 다시 그 자리로 돌아오며, 모든 패널이 숨겨진 그룹이나 분할은 공간을 차지하지 않습니다. |

<a id="tabs"></a>

## 탭

각 그룹에는 보이는 패널마다 탭이 하나씩 있는 탭 바가 있으며, 탭은 `panels`의 순서를 따릅니다. `renderTab`는 탭이 보여 주는 내용(제목, 아이콘, 앱이 만든 닫기 버튼)을 렌더링하며, 이것이 없으면 탭에는 패널의 키가 표시됩니다. 영역이 이를 탭으로 만듭니다. 누르면 선택되고, 드래그하면 패널이 이동하며, 스크린 리더는 선택 상태가 있는 탭으로 읽어 주고, `tabClass`의 `selected:` 클래스가 표시 중인 탭을 꾸밉니다. 탭의 값에는 앱이 탭을 그리는 데 필요한 정보가 담겨 있습니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `panel` | `string` | 패널의 키. |
| `group` | `number` | 탭이 속한 탭 그룹의 id. |
| `index` | `number` | 그룹의 보이는 탭 중에서 이 탭의 위치. |
| `active` | `boolean` | 그룹에서 표시 중인 탭입니다. |
| `closable` | `boolean` | 영역이 이 탭을 닫을 수 있습니다. 닫을 수 있는 패널이고, 영역이 잠겨 있지 않으며, 그룹이 이 패널을 내놓을 수 있는 경우입니다. |
| `zoomed` | `boolean` | 그룹이 줌된 상태입니다. |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## 드래그 앤 드롭

그룹 위로 끌어온 탭은 놓을 위치를 보여 주고, 드롭하면 그 위치에 놓입니다.

| 드롭 위치 | 패널의 동작 |
|---|---|
| 탭 바 | 그 그룹에 합류하며, 드롭한 위치 옆의 탭들 사이에 들어갑니다 |
| 그룹 내용의 가운데 | 그 그룹에 합류합니다 |
| 그룹 내용의 가장자리(각 변의 바깥쪽 35%) | 그 그룹을 분할합니다. 그쪽에 패널 하나만 담긴 새 그룹이 생깁니다 |

드래그가 위에 머무는 동안 영역은 패널이 차지하게 될 부분(합류할 때는 내용 전체, 분할할 때는 절반) 위에 드롭 표시기를 보여 줍니다. 이는 앱이 스타일을 지정하는 부분이며(`dropIndicatorClass`), 앱이 렌더링하면 자체 내용을 담을 수도 있습니다(`renderDropIndicator`, `group`, 분할되어 나올 `side` 또는 탭 바 `index`를 전달받습니다). 표시기는 새 위치로 네이티브로 이동하며, 부드럽게 이동하고, 다른 그룹으로 옮겨 갈 때는 이전 표시기가 사라지는 동시에 새 표시기가 나타납니다(사용자가 동작 줄이기를 설정했다면 즉시 이동합니다). 포인터나 손가락을 따라다니는 요소도 앱이 정합니다(`renderDragPreview`). 드롭은 레이아웃의 변경 한 번으로 한 번만 보고되며, 아무것도 바꾸지 않는 드롭은 아무것도 바꾸지 않습니다.

잠긴 영역, 줌된 영역, 그리고 그룹 옆에 다른 것이 없을 때 그 그룹의 마지막 패널은 드래그할 수 없습니다.

<a id="docks"></a>

## Dock

dock은 패널이나 크기를 잃지 않고 열리고 닫힙니다. 닫아도 트리가 유지되고, 다시 열면 같은 그룹이 같은 크기로 표시됩니다. dock과 중앙 영역 사이의 경계는 사용자가 끌어서 dock의 크기를 조절하는 핸들입니다. dock은 최소 100포인트를 유지하고 중앙 영역도 최소 100포인트를 유지하며, 접을 수 있는 dock을 50포인트 아래에서 놓으면 닫히고 다시 열 때를 위해 크기를 보존합니다. 영역은 항상 자신의 경계 안에 맞춰집니다. dock은 영역이 남겨 준 공간 안에서 `size`의 크기로 표시되고, 그것도 맞지 않으면 dock이 나머지와 함께 줄어들고 분할의 최소 크기는 양보됩니다. `renderDock`는 dock의 레이아웃 앞에 dock 자체의 크롬(제목 영역, 접기 버튼)을 그리며, `placement`, `open`, `size`, `collapsible`를 전달받습니다. `dockClass`는 dock의 프레임을 꾸밉니다.

앱에서는 ref(`toggleDock`, `setDockOpen`, `setDockSize`)를 통해 dock을 열고, 닫고, 크기를 조절할 수 있으며, 이는 두 가지 표시 방식 모두에서 동작합니다. 또는 전달하는 레이아웃에 dock의 `open`과 `size`를 써서 조절할 수도 있습니다(`open`은 전체 표시 방식의 값입니다). `onDockOpenChange`는 dock이 표시되거나 숨겨질 때마다 이를 보고하며, 레이아웃의 `open`을 기준으로 측정합니다(처음부터 compact인 영역은 레이아웃상 열려 있는 각 dock을 숨겨진 것으로 보고합니다). 따라서 레이아웃의 `open`에서 시작해 `onDockOpenChange`를 따르는 토글은 항상 dock의 상태를 정확히 보여 줍니다.

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

<a id="zoom"></a>

## 줌

줌된 그룹은 줌이 해제되거나 레이아웃에서 사라질 때까지 영역 전체를 채웁니다(`area.toggleZoom(group)`, 줌을 해제하려면 `area.toggleZoom()`). `onZoomChange`는 그 그룹이 표시 중인 패널을 보고하며, 줌 상태가 아니면 `null`를 보고합니다. 줌은 그룹에 속하므로, 표시 중인 패널이 닫히고 다음 패널이 이어받아도 그룹은 줌된 상태로 남습니다. `zoomable: false`가 설정된 패널이 표시되는 동안에는 그 그룹을 줌할 수 없습니다.

<a id="locking"></a>

## 잠금

`locked`은 배치를 지금 그대로 유지합니다. 탭 드래그, 드롭, 닫기가 모두 막힙니다. 탭 선택, 크기 조절, dock 열기와 닫기는 여전히 동작하므로, 잠긴 작업 공간도 계속 사용할 수 있는 작업 공간입니다.

<a id="methods"></a>

## 메서드

`ref={area}`는 영역의 메서드(`DockAreaRef`)를 제공하며, 앱의 명령, 단축키, 메뉴에서 사용합니다. 각 편집은 사용자의 편집과 마찬가지로 `onLayoutChange`로 보고됩니다. 레이아웃에 없는 패널, 그룹, 탭 인덱스, dock을 메서드에 전달하면 레이아웃은 그대로 유지되고, 메서드 이름과 값을 담은 경고가 로그에 남습니다.

| 메서드 | 설명 |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: 현재 표시 중인 레이아웃. |
| `addPanel(panel, placement?, size?)` | 패널을 한 영역(`"center"`, 기본값, `"left"`, `"right"`, `"bottom"`)의 첫 번째 탭 그룹에 추가하고 표시합니다. 없는 dock은 만들어지며 가로 크기는 `size`입니다. 영역이 이미 가지고 있는 패널은 그곳으로 이동합니다. |
| `removePanel(panel)` | 패널의 옵션과 관계없이 패널을 제거합니다. |
| `closePanel(panel)` | 탭이 닫는 것과 같은 방식으로 패널을 닫습니다. 영역이 잠겨 있거나, 패널을 닫을 수 없거나, 옆에 아무것도 없는 그룹의 마지막 패널이면 닫지 않습니다. |
| `movePanel(panel, target)` | 패널을 `target`로 이동합니다. `{ group, side?, index?, activate?, size? }`, 탭 그룹 `group` 안으로(`index` 위치에), 또는 `side`의 새 그룹으로(`size`은 새 분할을 따라 잰 포인트 값) 이동할 수 있습니다. |
| `splitAt(group, panel, side)` | 컨테이너의 한 변(`"left"`, `"right"`, `"top"`, `"bottom"`)에 새 탭 그룹을 만들어 패널을 넣습니다. |
| `selectPanel(panel)` | 패널이 속한 그룹에서 그 패널을 표시합니다. |
| `selectTab(group, index)` | 그룹의 한 탭을 표시합니다. |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | dock을 열거나 닫습니다. |
| `setDockSize(placement, size)` | dock의 가장자리 방향 크기를 설정합니다(최소 100). |
| `toggleZoom(group?)` | 그룹을 줌하거나, 이미 줌된 그룹이면 줌을 해제합니다. `group`가 없으면 줌된 그룹의 줌을 해제합니다. |
| `zoomedGroup()` | `Promise<number \| null>`: 줌된 그룹의 id. |
| `groupOf(panel)` | `Promise<number \| null>`: 패널이 속한 탭 그룹의 id. |

Rust에서는 영역의 `component_ref::<DockArea>()`와 `.component_ref(&r)`가 ref를 제공하며, 그 `r.api::<DockAreaApi>()`에는 snake case로 된 같은 메서드들이 있습니다.

<a id="saving-and-restoring"></a>

## 저장과 복원

보고된 레이아웃은 단순한 데이터이므로, 저장은 `JSON.stringify(layout)`를 [storage](../modules/nsh.md#storage)에 쓰는 것이고, 복원은 파싱한 값을 `layout`로 전달하는 것입니다. `onLayoutChange`는 크기 조절이나 탭 선택을 포함한 모든 변경을 보고하므로, 변경이 잦아든 뒤에 storage에 쓰는 것이 좋습니다(보고가 올 때마다 초기화되는 짧은 타이머를 사용하세요).

Rust에서는 `DockAreaLayout::to_state`와 `from_state`가 `DockAreaState`를 읽고 쓰며, 이는 `gpui-base`의 dock도 사용하는 레이아웃 파일 형식입니다.

<a id="phones-and-narrow-windows"></a>

## 휴대폰과 좁은 창

dock은 자신의 너비에 맞춰 적응합니다. 너비가 600포인트 이상인 영역(데스크톱 창, 웹, 태블릿, 전체 화면의 iPad, 펼친 폴더블)은 전체 작업 공간으로 표시되며, 태블릿의 멀티 패널 앱처럼 분할, 그룹, dock이 나란히 놓입니다. 휴대폰이나 태블릿에서 손가락으로 조작할 때는 iPadOS의 드래그 앤 드롭처럼 길게 눌러서 탭 드래그가 시작되므로, 탭 바는 스와이프하면 여전히 스크롤되고, 핸들은 모양은 같되 더 넓은 터치 영역을 갖습니다.

너비가 600포인트보다 좁은 영역(휴대폰, Slide Over 상태의 iPad, 좁은 데스크톱 또는 브라우저 창, 넓은 영역 안의 좁은 열)은 iPad의 분할 보기가 열을 접고 Material Design의 보조 패널이 하단 시트가 되는 것처럼, 같은 레이아웃을 한 화면에 맞게 표시합니다.

- 중앙 영역은 한 번에 하나의 그룹만 전체 크기로 보여 줍니다. 탭 바에는 중앙 영역의 보이는 모든 패널이 나열되며, 다른 그룹의 패널을 선택하면 그 그룹이 표시됩니다.
- 왼쪽과 오른쪽 dock은 가장자리에서 중앙 영역 위로 나오는 서랍(drawer)이며 너비는 dock의 너비와 같고, 아래쪽 dock은 높이가 dock의 크기와 같은 시트(sheet)입니다. 앱이 표시를 요청하면(`toggleDock`, `setDockOpen`, 다른 것은 닫힘) 한 번에 하나만 표시되고, 미끄러지듯 나타나고 사라지며, 배경을 누르거나 Escape 또는 뒤로 가기로 닫을 수 있습니다. compact 표시 방식으로 들어갈 때는 아무것도 표시되지 않습니다.
- 탭을 끌면(손가락은 길게 누른 뒤, 포인터는 즉시) 탭 바 안에서 이동하며 순서가 바뀝니다.

두 표시 방식 모두에서 모든 패널이 배치된 상태로 유지되므로, 전환해도 내용이 보존됩니다. 표시된 서랍이나 시트는 compact 표시 방식 고유의 상태입니다. 레이아웃의 `open`은 전체 표시 방식에 속하며, 서랍을 표시하거나 닫아도 `onLayoutChange`는 보고되지 않으므로, 영역이 다시 넓어지면 dock은 이전과 정확히 같은 상태로 표시됩니다.
`onDockOpenChange`는 이 둘을 모두 보고합니다. 전체 표시 방식에서 레이아웃의 `open`이 바뀐 dock, compact 표시 방식에서 표시되거나 닫힌 서랍이나 시트, 그리고 표시 방식이 전환될 때 표시 상태가 바뀌는 각 dock이 해당합니다. `renderDock`에서 `open`는 현재 표시 방식에서 dock이 표시되는지 여부입니다. 레이아웃은 여전히 하나의 같은 값이므로, 영역이 600포인트를 넘나들어도(폴더블이 펼쳐지거나, iPad가 Split View에 들어가거나, 창이나 열의 크기가 바뀔 때) 모든 패널은 있던 자리에 그대로 있고, 앱은 하나의 레이아웃만 저장하면 됩니다. 영역의 너비는 레이아웃이 계산된 뒤에 결정되며(그 전에는 창의 너비가 대신 쓰입니다), `compact`은 너비 대신 표시 방식을 직접 선택합니다. 서랍, 시트, 배경은 영역의 나머지 부분과 마찬가지로 앱이 스타일을 지정하는 부분입니다(`drawerClass`, `sheetClass`, `backdropClass`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | 없음 | 표시되는 레이아웃(제어형): `onLayoutChange`에서 보고한 값을 그대로 다시 전달합니다. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | 비어 있는 중앙 | `layout` 설정이 없을 때의 초기 레이아웃입니다. 이후에는 영역이 자체 레이아웃을 유지합니다. |
| `locked` | `.locked(..)` | `boolean` | `false` | 탭을 드래그하거나 드롭하거나 닫을 수 없습니다. |
| `compact` | `.compact(..)` | `boolean` | 너비에 따라 | 휴대폰용 표시 방식(`true`) 또는 전체 표시 방식(`false`)입니다. 지정하지 않으면 영역 너비가 600포인트보다 좁은 동안 컴팩트 표시로 동작합니다. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | 각 패널이 허용하는 동작을 키별로 지정합니다: `closable`, `zoomable`, `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | 없음 | 패널의 콘텐츠를 키별로 지정합니다(`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | 키 | 탭에 표시되는 내용입니다. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | 없음 | 드롭 표시기 안에 들어가는 내용: `group`, `side`, `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | 없음 | 레이아웃 앞에 위치하는 도크 자체의 크롬: `placement`, `open`(현재 표시 방식에서 표시됨), `size`, `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | 없음 | 비어 있는 중앙에 표시되는 내용입니다. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | 없음 | 탭을 드래그하는 동안 포인터나 손가락을 따라다니는 내용입니다. |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 탭 그룹의 프레임입니다. |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 탭 바입니다(행에는 `flex-row`). |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 탭입니다. 표시 중인 탭에는 `selected:`. |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 그룹의 콘텐츠 프레임으로, 해당 패널이 표시되는 곳입니다. |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 드롭 표시기입니다. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 핸들의 표시선으로, 분할된 그룹 사이와 각 도크의 가장자리에 있습니다. 핸들에 따라 달라지는 항목은 `group-hover:` 및 `group-active:`입니다. 별도로 지정하지 않으면 핸들을 가로지르는 두께는 1포인트이고 전체 길이에 걸쳐 이어지므로, 어느 방향이든 `bg-border` 사용 시 헤어라인이 됩니다. `w-[3px]` / `h-[3px]` 사용 시 더 두꺼워집니다. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 핸들의 썸입니다. 선 중앙에 놓이는 그립으로, 세로선에서는 똑바로 그려지고 가로선에서는 90도 회전하여 그려지므로 하나의 클래스로 두 축을 모두 처리합니다. 핸들에 호버하거나 누르거나 드래그하는 동안에도 같은 뷰가 유지되므로, `group-hover:` 및 `group-active:` 클래스가 이를 전환합니다(`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 도크의 프레임입니다. |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | Compact: 측면 도크의 드로어입니다. |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | Compact: 하단 도크의 시트입니다. |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | Compact: 열려 있는 드로어나 시트 뒤의 백드롭으로, 누르면 닫힙니다. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | 없음 | 분할된 그룹 사이와 각 도크의 가장자리에 있는 모든 핸들에 대해 스크린 리더가 읽어 주는 내용입니다. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | 영역의 [메서드](#methods)입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 영역 자체: 부모 안에서의 크기(`flex-1`)와 배경입니다. 자신의 경계 안에 머무르며 콘텐츠로부터 최소 크기를 가져오지 않습니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | 레이아웃이 변경됨(드래그, 선택, 크기 조정, 도크 열기 또는 닫기, 메서드 호출): `{ layout }`, 즉 모든 id를 포함하는 새 레이아웃 전체입니다. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: 패널이 그룹에서 표시되는 탭이 되었거나 더 이상 아니게 되었습니다(닫힌 도크에는 표시되는 탭이 없음). 변경당 한 번 호출되며, 떠나는 패널에는 `false` 알림이 가지 않고 `onPanelRemove` 이벤트가 그 종료를 나타냅니다. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: 패널이 영역을 완전히 떠났습니다. 닫히거나, 제거되거나, 새 레이아웃에서 빠진 경우입니다. 이동하는 패널에는 절대 전달되지 않습니다. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | 그룹이 확대 또는 축소되었습니다: `{ panel }`(표시 중인 패널) 또는 `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: 도크가 표시되거나 숨겨졌습니다. 전체 표시 방식에서는 레이아웃 `open` 값이 변경된 경우, compact에서는 드로어나 시트가 표시되거나 닫힌 경우, 또는 표시 방식이 전환된 경우입니다. |

<a id="parts"></a>

## 구성 요소

| 구성 요소 | 포함 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 영역 | | `class`, `style` | |
| 탭 그룹 | 리전 | `groupClass`, `groupStyle` | |
| 탭 바 | 그룹 | `tabBarClass`, `tabBarStyle` | |
| 탭 | 탭 바 | `tabClass`, `tabStyle`; `renderTab` | `selected:`, `active:`, `hover:` |
| 그룹의 콘텐츠 | 그룹 | `contentClass`, `contentStyle`; `renderPanel` | |
| 핸들의 표시선 | 분할된 그룹 사이, 도크의 가장자리 | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| 핸들의 썸 | 핸들 선의 중앙 | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:`(드래그가 끝날 때까지 눌림 상태) |
| 도크 | 가장자리 | `dockClass`, `dockStyle`; `renderDock` | |
| 드롭 표시기 | 드래그 중 그룹 위 | `dropIndicatorClass`, `dropIndicatorStyle`; `renderDropIndicator` | |
| 드래그 미리보기 | 포인터나 손가락 아래 | `renderDragPreview` | |
| 비어 있는 중앙 | 중앙 | `renderEmpty` | |
| 드로어, 시트, 백드롭 | compact에서 중앙 위 | `drawerClass`, `sheetClass`, `backdropClass`(및 해당 스타일) | |

<a id="accessibility"></a>

## 접근성

- 스크린 리더에는 각 탭이 선택 상태를 가진 탭으로 노출되며([`Tab`](./tabs.md)도 마찬가지), 활성화하면 해당 탭이 선택됩니다.
  레이블은 `renderTab` 렌더링 텍스트입니다.
- 분할된 그룹 사이와 각 도크의 가장자리에 있는 모든 핸들은 `handleAccessibilityLabel` 레이블이 붙은 조절 가능한 요소입니다.
  분할된 그룹 사이의 핸들은 [Resizable](./resizable.md)의 것이며, 스크린 리더는 한 번에 10포인트씩 이동시키고 `onLayoutChange` 값으로 보고합니다.
- compact 표시 방식에서는 Escape와 뒤로 가기로 표시된 드로어나 시트를 닫습니다.

레이블, 역할, 알림 전반에 대해서는 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 포인터(마우스, 트랙패드, 화면 위에서 호버하는 펜)는 버튼을 누른 채 4포인트 이동하면 탭을 드래그하며, 이는 모든 플랫폼에서 동일합니다.
  트랙패드를 연결한 iPad와 마우스로 조작하는 좁은 브라우저 창도 데스크톱과 똑같이 드래그됩니다.
  macOS, Windows, Linux, GPUI에서는 터치스크린 노트북의 손가락 입력을 포함해 모든 누름이 포인터 입력으로 간주됩니다.
- iOS, iPadOS, Android에서는 손가락으로 길게 누른 뒤에 탭을 드래그합니다. iPadOS의 드래그 앤 드롭과 같은 방식이므로, 탭 바 위에서 스와이프하면 탭 바가 스크롤됩니다.
- 데스크톱과 웹: 핸들에 해당 축의 크기 조절 커서가 표시됩니다.
- 휴대폰과 좁은 영역: 드로어와 하단 시트를 사용하는 compact 표시 방식입니다.
- 모든 플랫폼에서 앱이 스타일을 지정한 요소(탭, 탭 바, 핸들, 드롭 표시기, 도크, 드로어, 시트)를 그립니다.
