---
title: "Popover"
description: "Popover 컴포넌트: 트리거에 고정되어 모든 요소 위에 표시되는 콘텐츠로, 트리거, 바깥쪽 누르기, Escape, 뒤로 가기로 닫히며 앱에서 스타일을 지정합니다."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

Popover는 트리거 옆, 다른 모든 요소 위에 콘텐츠를 표시합니다. 세부 정보, 작은 폼, 색상 선택기 등을 넣을 수 있습니다.
트리거를 누르면 열리고 닫히며, 바깥을 누르거나 Escape, Android 뒤로 가기 버튼, VoiceOver의 이스케이프 제스처를 사용해도 닫힙니다. 트리거의 한쪽 면에 배치되고, 공간이 없으면 반대쪽으로 이동하며, 안전 영역 안에 머물고, 트리거가 스크롤되면 함께 따라갑니다. 자체적으로 그리는 것은 없으며, 팝업과 그 콘텐츠는 앱의 몫입니다.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover`은(는) [`nsh/base`](../modules/nsh-base.md)에서 가져옵니다. 콘텐츠는 열릴 때마다 새로 만들어지므로, 그 안의 상태는 처음부터 시작합니다.

<a id="open-state"></a>

## 열림 상태

`open` 없이는 popover가 자체 상태를 유지하며 `defaultOpen`에서 시작합니다. `open`을(를) 사용하면 앱이 상태를 소유합니다. 열기 또는 닫기 요청마다 그 이유(`"triggerPress"`, `"pressOutside"`, `"cancel"`)와 함께 알려 주는 `onOpenChange({ open, reason })`에서 상태를 변경하세요.

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}`은(는) Escape와 뒤로 가기에도 열린 상태를 유지하고(`onCancel`은(는) 먼저 확인할 수 있도록 여전히 이를 받습니다), `closeOnPressOutside={false}`은(는) 바깥을 눌러도 열린 상태를 유지합니다.

<a id="phones-and-desktops"></a>

## 휴대폰과 데스크톱

Popover는 모든 기기에서 트리거에 고정됩니다. 표시되는 내용은 그것을 연 요소 옆에 있어야 하기 때문입니다.

- 데스크톱과 데스크톱 브라우저에서는 바깥을 누르면 popover가 닫히고, 그 press가 포인터 아래의 요소로 그대로 전달됩니다. 따라서 한 번의 클릭으로 popover를 닫고 클릭한 위치의 버튼도 누르게 됩니다.
- 휴대폰과 태블릿에서는 바깥을 누르면 닫히기만 합니다. 시스템 popover처럼 투명한 백드롭이 press를 받습니다.

동작 목록에는 휴대폰에서 시트로 바뀌는 [Menu](./menu.md)를, 패널에는 [Sheet](./sheet.md)를 사용하세요.

<a id="entrance-and-exit"></a>

## 진입과 종료

Popover는 앱에서 정의한 트랜지션에 맞춰 나타나고 사라집니다. `popupStartingClass`은(는) 첫 프레임에서의 팝업 모습이며, `popupClass`의 `transition-*` 클래스가 이를 팝업 고유의 모습으로 이끌어 줍니다. 이것이 진입 효과입니다. `popupEndingClass`은(는) 닫힌 뒤의 모습입니다. 이 트랜지션이 실행되는 동안 popover는 press를 받지 않은 채 남아 있다가 사라지고, 이어서 `onClose`이(가) 발생합니다. 종료 중에 다시 열리면 현재 상태의 모습에서 원래 모습으로 되돌아갑니다. `popupStartingStyle`과(와) `popupEndingStyle`은(는) 인라인 스타일로 같은 일을 합니다. 사용자가 모션 줄이기를 요청하면 즉시 나타나고 사라집니다.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })`은(는) 팝업이 어디에 놓였는지 알려 줍니다. 트리거의 어느 쪽인지(`placement`에 공간이 없었다면 반대쪽), 팝업의 프레임, 그쪽의 여유 공간이 포함되므로 화살표나 진입 효과가 트리거를 가리키게 할 수 있습니다.

## Props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 없음 | 열림 여부이며 앱이 제어합니다. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` 없이 처음에 열려 있는지 여부. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 트리거의 어느 쪽에 배치할지. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 그 면을 따라 트리거와 어떻게 정렬할지. |
| `offset` | `.offset(..)` | `number` | `0` | 트리거와 팝업 사이의 간격. |
| `margin` | `.margin(..)` | `number` | `0` | 안전 영역의 가장자리에서 유지하는 거리. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape와 Android 뒤로 가기 버튼으로 닫을지 여부. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | 바깥을 눌러 닫을지 여부. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업의 모습, 즉 콘텐츠를 담는 상자. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 첫 프레임에서 팝업 고유의 모습 위에 적용되는 모습이며, 트랜지션이 여기에서 시작됩니다. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 닫힌 뒤 팝업 고유의 모습 위에 적용되는 모습이며, 트랜지션이 실행되는 동안 유지됩니다. |
| `trigger` | `.trigger(..)` | `JSX.Element` | 없음 | 팝업을 여는 요소이며, 팝업은 이를 기준으로 배치됩니다. Popover가 열려 있는 동안 해당 요소의 `aria-expanded:` 클래스와 `expandedStyle`이(가) 적용됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 콘텐츠. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 열리거나 닫혔으며, 그 이유(`"triggerPress"`, `"pressOutside"` 또는 `"cancel"`)가 함께 전달됩니다. |
| `onOpen` | `.on_open(\|\| ..)` | 표시되었습니다. |
| `onClose` | `.on_close(\|\| ..)` | 종료 효과가 끝난 뒤 사라졌으며, 앱이 닫은 경우에도 발생합니다. |
| `onCancel` | `.on_cancel(\|\| ..)` | 사용자가 닫으려고 시도했으며(Escape 또는 뒤로 가기, 바깥 press), 실제로 닫혔는지와 상관없이 발생합니다. |
| `onPosition` | `.on_position(\|e\| ..)` | 팝업이 배치되었습니다. `placement`(배치된 면), `bounds`(프레임), `available`(그 면의 여유 공간)가 전달됩니다. |

<a id="accessibility"></a>

## 접근성

트리거는 popover가 확장되었는지를 스크린 리더에 알립니다. Escape와 뒤로 가기 버튼은 사용자가 팝업에 기대하는 대로 popover를 닫습니다. TSX에서 트리거는 전달하는 요소, 즉 `Button` 또는 직접 만든 뷰입니다. 이 요소가 press와 확장 상태를 직접 받으므로, 눌려 있는 동안 해당 요소의 `active:` 클래스와 `activeStyle`이(가) 적용되고 자체 `onPress`도 함께 실행됩니다.
