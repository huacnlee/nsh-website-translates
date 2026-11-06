---
title: "Overlay"
description: "Overlay 요소: 부모의 클리핑과 관계없이 화면 최상단에 표시되는 콘텐츠로, 고정된 박스로 배치하거나 따라다니는 앵커에 맞춰 배치할 수 있으며, 바깥쪽 누르기와 Escape 입력을 보고합니다."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

Overlay는 자식 요소를 해당 루트 뷰(창 또는 그 둘레의 다이얼로그) 안의 모든 것 위에 표시합니다.
부모의 크기, `overflow: hidden` 및 스크롤 뷰는 overlay를 잘라내지 않습니다. 그 외의 모든 면에서는 작성한 위치에 그대로 머뭅니다.
주변 컨텍스트를 읽고, 핸들러는 해당 컴포넌트의 것이며, 부모와 함께 사라집니다. Popover, 메뉴, 툴팁, 시트는 overlay를 기반으로 만들어져 있습니다. [`nsh/base`](../modules/nsh-base.md)에는 이들이 준비되어 있으며
([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), 직접 만들 때 사용하는 것이 overlay입니다.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

`Overlay`는 TSX에서는 `nsh`에서, Rust에서는 `overlay()`이 `nsh_core::prelude`에서 가져옵니다. 뷰 안에 있는 동안 표시됩니다.
열고 닫으려면 `If`(Rust: `when(..)`) 안에 넣으세요. 나중에 표시된 overlay는 이전 overlay 위에 놓이며,
다른 overlay 안에 있는 overlay는 그 위에 놓입니다.

<a id="placement"></a>

## 배치

`anchor`이 없으면 overlay는 루트 뷰의 `position: fixed` 박스로 배치됩니다. `top`, `left`, `inset`,
크기, 마진은 창(또는 다이얼로그) 전체를 기준으로 합니다. `class="inset-0"`은 전체를 덮으며, 배경막이나
창 전체 레이어에 해당합니다. `class="bottom-0 left-0 right-0"`은 하단을 따라 놓이는 바입니다.

`anchor`이 있으면 NSH가 anchor 옆에 배치합니다.

- `anchor`는 뷰(`ref`), 루트 뷰 좌표계의 `Point`(`{ x, y }`), 터치의 `pageX` / `pageY`
  (포인터가 있는 위치에 열리는 메뉴), 또는 해당 좌표계의 `Bounds`(`{ origin, size }`)입니다. 후자의 예로 입력 필드의 캐럿(`onCaretMove`의 `pageBounds`)이 있으며, 입력 중인 내용에 대한 제안이
  이곳에 열립니다.
- `placement`는 overlay가 놓이는 쪽입니다. `"top"`, `"bottom"`(기본값), `"left"`, `"right"` 중 하나입니다. 그쪽에 맞지 않고
  반대쪽에 맞으면 반대쪽에 놓이며, 어느 쪽에도 맞지 않으면 공간이 더 넓은 쪽에 놓입니다.
- `align`는 그 쪽을 따라 정렬합니다. `"start"`, `"center"`(기본값), `"end"` 중 하나입니다. anchor의 위쪽과 아래쪽에서는
  start와 end가 레이아웃 방향을 따릅니다. start는 왼쪽 가장자리이며, 오른쪽에서 왼쪽으로 쓰는 레이아웃에서는 오른쪽 가장자리입니다.
- `offset`은 anchor와 overlay 사이의 간격입니다. `margin`는 overlay가 머무는 세이프 에어리어 가장자리로부터 유지하는 거리이며,
  맞추기 위해 해당 쪽을 따라 미끄러지듯 이동합니다.

anchor에 고정된 overlay는 anchor를 따라갑니다. anchor가 스크롤되거나 이동하거나 크기가 바뀌면, NSH가 레이아웃하는
같은 프레임에 overlay도 함께 이동합니다. `onPosition`는 overlay가 놓인 위치를 알려 주므로, 화살표가 anchor를 가리키게 하거나 긴 메뉴의
높이를 제한할 수 있습니다.

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## 닫기

overlay는 팝업을 보통 닫게 만드는 상황을 알려 주며, 닫을지 여부는 사용자에게 맡깁니다.

- `onPressOutside`는 손가락이나 마우스 버튼이 overlay, 그 anchor, 그 안의 overlay 바깥에서 눌릴 때 발생합니다.
  누름 동작은 그 아래에 있는 요소로 계속 전달됩니다.
- `onCancel`는 Escape, Android 뒤로 가기 버튼, iOS의 VoiceOver 이스케이프 제스처에서 발생하며, 이를 수신하는 최상위 overlay에만 전달됩니다. 페이지와 `BackHandler`보다
  먼저 이 입력을 받습니다.

팝업 뒤의 화면을 막으려면 `class="inset-0"`가 있는 두 번째 overlay를 그 아래에 두고, 둘 다 닫는 `onPress`를 연결하세요.
[Sheet](./sheet.md)와 [Popover](./popover.md)의 폰 프레젠테이션이 이렇게 동작합니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | 없음 | 배치의 기준이 되는 뷰, 점 또는 박스입니다. 지정하지 않으면 루트 뷰의 고정 박스가 됩니다. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | anchor의 어느 쪽에 놓일지를 정합니다. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 해당 쪽을 따라 anchor와 어떻게 정렬할지를 정합니다. |
| `offset` | `.offset(px(..))` | `number` | `0` | anchor와 overlay 사이의 간격입니다. |
| `margin` | `.margin(px(..))` | `number` | `0` | 세이프 에어리어 가장자리로부터 유지하는 거리입니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 표시할 내용입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 외형이며, anchor가 없을 때는 위치도 정합니다. |

뷰의 [공통 props](./index.md#common-props)도 사용할 수 있습니다.

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | overlay, 그 anchor, 그 안의 overlay 바깥에서 누름이 발생했습니다(`pagePosition`, `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, Android 뒤로 가기 버튼 또는 VoiceOver 이스케이프 제스처가 발생했으며, 이 overlay가 수신 중인 최상위 overlay일 때입니다. |
| `onPosition` | `.on_position(\|position\| ..)` | NSH가 overlay를 배치했습니다. `placement`(놓인 쪽), 루트 뷰 안의 `bounds`, `available`(`Size`: 해당 쪽의 여유 공간)가 전달됩니다. |

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 모든 플랫폼은 overlay를 창(또는 다이얼로그)의 루트 뷰에 속한 네이티브 뷰로 표시하며, 주변 뷰와 동일하게 그려지고
  히트 테스트됩니다. UIKit, Android views, AppKit, GTK, Win32, GPUI, DOM이 이에 해당합니다.
- [Dialog](./dialog.md) 안의 overlay는 해당 다이얼로그 안에서, 그 콘텐츠 위에 표시됩니다.
- overlay는 자신이 속한 창 안에 머뭅니다. 창 가장자리를 넘어갈 메뉴는 다시 안쪽으로 밀려 들어옵니다.
