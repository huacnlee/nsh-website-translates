---
title: "Tooltip"
description: "Tooltip 컴포넌트: 포인터가 데스크톱에서 해당 요소 위에 머물 때 표시되는, 요소에 대한 힌트이며 앱에서 스타일을 지정합니다."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# 툴팁

툴팁은 대상 옆에 표시되는 짧은 힌트입니다. 아이콘 버튼이 무엇을 하는지, 또는 잘린 레이블의 전체 텍스트를 보여 줄 때 사용합니다.
데스크톱과 데스크톱 브라우저에서는 포인터가 트리거 위에 `delay`(500 ms) 동안 머물면 표시되고, 포인터가 트리거를 벗어나거나 트리거를 누르면 사라집니다. 휴대폰과 태블릿에서는 앱이 직접 열 때(`open`)에만 툴팁이 표시됩니다. 툴팁은 포인터나 누르기 입력을 가로채지 않으므로, 트리거는 툴팁이 없을 때와 똑같이 동작합니다.

[`nsh/base`](../modules/nsh-base.md)의 `Tooltip`는 모든 요소가 가지는 `tooltip` prop([공통 props](index.md#tooltips))으로 전달되며, GPUI의 `.tooltip(..)`에 해당합니다. 이 요소는 포인터가 머무는 대상이자 툴팁이 배치되는 기준이 됩니다. 툴팁 자체는 말풍선입니다. `class` / `style`로 스타일을 지정하며, 자식 요소가 툴팁에 표시되는 내용입니다.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

툴팁은 기본적으로 트리거 위쪽에 표시되고(`placement`), 공간이 없으면 반대쪽에 표시되며, 항상 안전 영역 안에 머뭅니다. `open`를 사용하면 앱이 표시 시점을 결정합니다. 이때 툴팁은 트리거 위에 포인터가 머물거나 벗어나는 것을 알려 주는 `onOpenChange`을 따르며, 모든 기기에서 표시할 수 있습니다.

툴팁은 트랜지션에 맞춰 나타나고 사라집니다. `startingClass`는 첫 프레임의 모습이고 `endingClass`는 숨겨졌을 때의 모습이며, 이 모습은 `class`의 `transition-*` 클래스가 실행되는 동안 유지됩니다. `onClose`이(가) 그 뒤를 따릅니다.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 없음 | 툴팁에 표시되는 내용입니다. |
| `class`, `style` | `.app_class(..)`, `Styled` 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 말풍선, 즉 툴팁 자체의 모습입니다. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 첫 프레임의 모습입니다. 트랜지션이 이 모습에서 시작됩니다. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 숨겨졌을 때의 모습입니다. 트랜지션이 실행되는 동안 유지됩니다. |
| `open` | `.open(..)` | `boolean` | 없음 | 앱이 제어하는 표시 상태입니다. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open` 없이 처음부터 표시됩니다. |
| `delay` | `.delay(..)` | `number` | `500` | 툴팁이 표시되기 전에 포인터가 트리거 위에 머물러야 하는 시간(밀리초)입니다. `Infinity`: 자동으로는 표시되지 않으며 앱이 열 때만 표시됩니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 툴팁이 표시되지 않습니다. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | 툴팁이 배치되는 트리거의 면입니다. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | 해당 면을 따라 트리거와 정렬되는 방식입니다. |
| `offset` | `.offset(..)` | `number` | `4` | 트리거와 툴팁 사이의 간격입니다. |
| `margin` | `.margin(..)` | `number` | `4` | 안전 영역의 가장자리와 유지하는 거리입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 포인터가 트리거 위에 머물렀거나, 트리거를 벗어났거나, 트리거를 눌렀습니다(`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | 툴팁이 표시되었습니다. |
| `onClose` | `.on_close(\|\| ..)` | 종료 트랜지션이 끝난 뒤 툴팁이 사라졌습니다. 앱이 숨긴 경우에도 발생합니다. |

<a id="accessibility"></a>

## 접근성

툴팁은 트리거가 스크린 리더에 전달하는 내용을 반복합니다. 모든 사용자가 힌트를 얻을 수 있도록 트리거에도 `accessibilityLabel`을(를) 지정하세요.
