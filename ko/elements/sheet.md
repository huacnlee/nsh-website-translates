---
title: "Sheet"
description: "Sheet 컴포넌트: 배경 위에 화면 가장자리에 표시되는 패널로, 배경, Escape 키, 뒤로 가기로 닫을 수 있으며 앱에서 스타일을 지정합니다."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---

# Sheet

Sheet는 화면 가장자리에 배경(backdrop)과 함께 나타나 나머지 영역을 덮는 패널입니다. 필터, 공유 패널, 사이드 드로어 등에 사용합니다. 배경을 누르거나, Escape, Android 뒤로 가기 버튼, VoiceOver의 이스케이프 제스처로 닫을 수 있습니다. 창 안의 다른 모든 요소 위에 표시되며 모든 기기에서 동일하게 보이고, 자체적으로 그리는 것은 없습니다. 패널과 배경은 앱이 직접 정의합니다.

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet`는 [`nsh/base`](../modules/nsh-base.md)에서 가져옵니다. 콘텐츠는 열릴 때마다 새로 만들어집니다. `side`는 화면의 `"bottom"`(기본값) 또는 `"top"`에는 화면 너비만큼, `"left"` 또는 `"right"`에는 화면 높이만큼 시트를 배치합니다. 가로질러 차지하는 크기는 패널의 크기이며, 콘텐츠 또는 `popupClass`에 따라 결정됩니다.

슬라이드 애니메이션은 진입 중에 콘텐츠가 생성되거나 커질 때 측정된 패널 크기를 따릅니다. 지연(lazy) 콘텐츠와 비동기 크기 업데이트는 동일한 애니메이션 진행률을 공유하며, 패널은 현재 크기에 맞춰 안정됩니다.

<a id="open-state"></a>

## 열림 상태

`open`가 없으면 시트는 자체 상태를 유지하며 `defaultOpen`에서 시작합니다. `open`를 사용하면 앱이 상태를 소유합니다. 이때 `onOpenChange({ open, reason })`에서 상태를 변경하며, 이 콜백은 닫기 요청마다 그 이유(`"backdropPress"`, `"cancel"`, `"swipe"`)를 함께 전달합니다.
`onOpen`와 `onClose`는 누가 열거나 닫았는지와 관계없이 열림과 닫힘을 따라갑니다.

`closeOnEscape={false}`는 Escape와 뒤로 가기에 대해 시트를 열린 상태로 유지하고, `closeOnBackdropPress={false}`는 배경 누름에 대해 열린 상태로 유지합니다.
`onCancel`는 이러한 동작도 여전히 감지하므로, 먼저 확인하는 용도로 사용할 수 있습니다.

<a id="dragging-a-bottom-sheet"></a>

## 하단 시트 드래그

`closeOnSwipe`를 설정하면 하단 패널이 아래쪽 드래그를 따라 움직입니다. 배경은 드래그 거리에 따라 점점 투명해지며, 패널 높이의 30%를 넘겨서 놓거나 초당 800포인트 이상의 속도로 아래로 놓으면 이유 `"swipe"`와 함께 닫기를 요청합니다.
이보다 짧게 드래그하면 부드럽게 원래 위치로 돌아갑니다. 제어형(controlled) 소유자는 닫기 요청 후 패널을 되돌리려면 `open`를 true로 유지하면 됩니다.
모션 감소 설정이 켜져 있으면 손을 놓을 때와 프로그래밍 방식의 열기/닫기는 즉시 완료되며, 직접 드래그하는 동안에는 여전히 손가락을 따라갑니다.

패널은 짧은 메뉴를 포함해 콘텐츠에 맞게 크기가 조정됩니다. 더 큰 콘텐츠를 제한하려면 `popupStyle` 또는 자식 요소의 높이를 사용하세요.
핸들은 앱이 직접 그리며, 패널 안의 어떤 뷰든 핸들이 될 수 있습니다. iOS에서는 내부의 세로 `Scroll` 또는 `List`가 맨 위에 도달할 때까지 드래그를 처리하고, 남은 아래쪽 이동을 같은 제스처 안에서 패널에 넘겨줍니다.
Android, 데스크톱, 웹에서는 스크롤 영역 밖의 핸들이나 콘텐츠를 드래그할 때 각 플랫폼의 기본 팬(pan) 지원을 사용하며,
내부 스크롤은 해당 플랫폼의 일반적인 제스처 중재 방식을 그대로 유지합니다. `closeOnSwipe`를 false로 설정하면 패널은
고정된 상태를 유지하고, 마운트된 콘텐츠와 스크롤 위치도 보존됩니다. 다른 방향의 시트는 기존 동작을 그대로 유지합니다.

<a id="native-sheets"></a>

## 네이티브 시트

Sheet는 앱의 창 안에서 NSH가 그리며, 스타일은 앱이 지정합니다. 플랫폼 고유의 시트(iOS의 페이지 시트)가 필요하다면 `presentation="pageSheet"`와 함께 [Dialog](./dialog.md)를 사용하세요.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 없음 | 앱이 제어하는 열림 상태입니다. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | 처음부터 열린 상태입니다. `open`가 없을 때 사용합니다. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 시트가 위치하는 가장자리입니다. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape와 Android 뒤로 가기 버튼으로 닫습니다. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | 배경을 누르면 닫습니다. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | 하단 패널이 아래쪽 드래그를 따라가며, 충분히 끌었다 놓으면 닫힙니다. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 패널의 모양입니다. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 반투명 색상 등 배경의 모양입니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 콘텐츠입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 닫기 요청이며, 이유는 `"backdropPress"`, `"cancel"` 또는 `"swipe"`입니다. |
| `onOpen` | `.on_open(\|\| ..)` | 시트가 나타났으며, 모든 요소가 준비되었습니다. |
| `onClose` | `.on_close(\|\| ..)` | 시트가 사라졌으며, 모든 요소가 제거되었습니다. 앱이 닫은 경우에도 발생합니다. |
| `onCancel` | `.on_cancel(\|\| ..)` | 사용자가 닫으려고 시도했습니다(Escape 또는 뒤로 가기, 배경 누름, 활성화된 스와이프). 실제로 닫혔는지 여부와 관계없이 발생합니다. |

웹에서 `dialogs: "viewport"`로 임베드하면 시트와 배경이 호스트 페이지 위에 표시되며,
같은 출처(same-origin)의 iframe도 포함합니다. 교차 출처(cross-origin) 프레임에는 [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page)를 사용하세요.
