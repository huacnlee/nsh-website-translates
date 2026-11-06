---
title: "HoverCard"
description: "HoverCard 컴포넌트: 포인터가 트리거 위에 머무는 동안 트리거가 가리키는 대상의 미리보기를 표시하며, 앱에서 스타일을 지정합니다."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

hover card는 트리거가 가리키는 대상을 페이지를 떠나지 않고 미리 보여 줍니다. 멘션 뒤의 프로필, 링크 뒤의 페이지, 티커 뒤의 시세가 그 예입니다. 데스크톱과 데스크톱 브라우저에서는 포인터가 트리거 위에 `openDelay`(600 ms) 동안 머물렀을 때, 또는 키보드 포커스가 트리거에 왔을 때 열립니다. 포인터가 트리거에서 카드로, 다시 카드에서 트리거로 이동하는 동안, 그리고 키보드 포커스가 트리거나 카드 안의 링크 또는 버튼에 있는 동안에는 열린 상태를 유지하므로, 카드 안의 모든 요소를 포인터와 키보드 모두로 사용할 수 있습니다. 포인터가 둘 다에서 벗어나고 포커스도 어느 쪽에도 없게 된 뒤 `closeDelay`(300 ms)가 지나면 닫힙니다. Escape와 바깥쪽 누르기는 즉시 닫습니다. 휴대폰과 태블릿에서는 트리거를 누르면 열리고 닫히며, 바깥쪽을 누르면 닫힙니다.

[`nsh/base`](../modules/nsh-base.md)의 `HoverCard`은 자체적으로 아무것도 그리지 않습니다. 트리거는 여러분의 요소이고, 팝업과 그 콘텐츠도 여러분의 것입니다.

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

트리거는 자신의 역할, 누르기 동작, 모양을 그대로 유지합니다. `role="link"`와 자체 `onPress`를 가진 view는 눌렀을 때 여전히 원래 가던 곳으로 이동하며, 카드는 거기에 미리보기를 더할 뿐입니다. 콘텐츠는 카드가 열릴 때마다 만들어지므로, 그 시점에 보여 줄 내용을 불러올 수 있습니다. 누르기로 카드를 여는 휴대폰과 태블릿에서는, 트리거가 카드가 열려 있는지 여부를 스크린 리더에 알립니다. [Toolbar](./toolbar.md)에서는 트리거가 항목 중 하나가 될 수 있지만, 카드에 표시되는 내용은 항목이 아닙니다. 카드 안의 버튼과 링크는 각자의 Tab 정지 지점을 유지하며, toolbar의 `disabled`는 이들을 건드리지 않습니다.

<a id="delays"></a>

## 지연 시간

`openDelay`는 포인터가 다른 곳으로 가는 길에 트리거를 지나갈 때 카드가 번쩍 열리는 것을 막아 주고, `closeDelay`는 포인터가 트리거와 카드 사이의 간격을 건너갈 시간을 줍니다. 두 값 모두 밀리초 단위입니다. 포인터와 지연 시간은 네이티브로 추적되므로, 트리거 위에 머무르거나 트리거와 카드 사이를 오가는 동안에는 카드가 열리거나 닫힐 때까지 여러분의 코드가 실행되지 않습니다. `openDelay`을 `Infinity`로 지정하면 열기를 앱(그리고 터치 스크린에서의 누르기)에 맡기고, `closeDelay`을 `Infinity`로 지정하면 닫기를 Escape, 바깥쪽 누르기, 앱에 맡깁니다.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## 열림 상태

`open`이 없으면 카드는 `defaultOpen`에서 시작하는 자체 상태를 유지합니다. `open`을 사용하면 앱이 상태를 소유하며, `onOpenChange({ open, reason })`에서 상태를 변경합니다. 이 콜백은 열기 또는 닫기 요청마다 그 이유와 함께 호출되며, 이유는 `"hover"`(포인터), `"focus"`(키보드 포커스), `"triggerPress"`(터치 스크린에서의 누르기), `"pressOutside"` 또는 `"cancel"`(Escape 또는 뒤로 가기)입니다.

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## 진입과 퇴장

hover card는 [Popover](./popover.md)와 마찬가지로 여러분의 transition에 따라 나타나고 사라집니다. `popupStartingClass`은 첫 프레임에서의 팝업 모양이며, `popupClass`의 `transition-*` 클래스가 이를 팝업 자체의 모양으로 전환합니다. `popupEndingClass`은 닫힌 후의 모양입니다. 이 transition이 실행되는 동안 카드는 남아 있되 포인터 입력은 받지 않고, 끝나면 사라지며, 이어서 `onClose`이 호출됩니다. 사라지는 도중에 트리거 위에 다시 머무르면 카드가 되돌아옵니다. 사용자가 동작 줄이기를 요청한 경우에는 즉시 나타나고 사라집니다.

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

기본적으로 카드는 트리거 아래쪽에 놓이고(`placement`, `align`), 공간이 없으면 반대쪽에 놓이며, safe area 안에 머뭅니다. `onPosition({ placement, bounds, available })`는 카드가 어디에 놓였는지 알려 줍니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | 없음 | 열림 여부이며, 앱이 제어합니다. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` 없이 처음부터 열려 있을지 여부입니다. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | 열리기 전에 포인터가 트리거 위에 머무르거나 포커스가 트리거에 머물러야 하는 시간(밀리초)입니다. `Infinity`: 스스로는 열리지 않습니다. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | 닫히기 전에 포인터가 트리거와 카드를 벗어나 있고 포커스도 어느 쪽에도 없어야 하는 시간(밀리초)입니다. `Infinity`: 스스로는 닫히지 않습니다. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 카드가 놓이는 트리거의 면입니다. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 그 면을 따라 트리거와 정렬되는 방식입니다. |
| `offset` | `.offset(..)` | `number` | `0` | 트리거와 카드 사이의 간격입니다. |
| `margin` | `.margin(..)` | `number` | `0` | safe area의 가장자리로부터 유지하는 거리입니다. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업, 즉 콘텐츠가 담기는 카드의 모양입니다. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업 자체 모양 위에 덮어씌우는, 첫 프레임에서의 모양입니다. transition이 여기서 시작됩니다. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업 자체 모양 위에 덮어씌우는, 닫힌 후의 모양입니다. transition이 실행되는 동안 유지됩니다. |
| `trigger` | `.trigger(..)` | `JSX.Element` | 없음 | 미리 보여 줄 대상이며, 카드는 이를 기준으로 배치됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 열릴 때마다 만들어지는 콘텐츠입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 이유와 함께 열기 또는 닫기를 요청합니다. 이유는 `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` 또는 `"cancel"`입니다. |
| `onOpen` | `.on_open(\|\| ..)` | 카드가 표시되었습니다. |
| `onClose` | `.on_close(\|\| ..)` | 퇴장이 끝나 카드가 사라졌습니다. 앱이 닫은 경우에도 호출됩니다. |
| `onPosition` | `.on_position(\|e\| ..)` | 팝업이 배치되었습니다. `placement`(놓인 면), `bounds`(프레임), `available`(그 면의 여유 공간)을 제공합니다. |

<a id="accessibility"></a>

## 접근성

hover card는 트리거에 기능을 더할 뿐입니다. 트리거는 자신의 역할과 레이블을 유지하며, 눌렀을 때 열리거나 수행되는 동작도 그대로입니다. 키보드 사용자는 포커스가 트리거에 머물면 카드를 볼 수 있고, Escape로 카드를 닫을 수 있습니다. 카드는 자체적으로 포커스를 가져가지 않으므로, Tab은 이전처럼 트리거에서 다음 요소로 이동합니다. 카드 안의 링크와 버튼은 다른 곳과 마찬가지로 포커스를 받으며, 그중 하나가 포커스를 가지고 있는 동안 카드는 열린 상태를 유지합니다. 카드에서 중요한 내용은 트리거가 이동시키는 페이지에서도 접근할 수 있어야 합니다.
