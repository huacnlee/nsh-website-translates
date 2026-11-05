---
title: "텍스트 선택"
description: "선택 가능한 뷰: 웹 페이지의 텍스트가 선택되는 방식처럼, 뷰 내부의 여러 텍스트, 여러 뷰, Text 요소, TextView에 걸쳐 하나의 선택 영역을 만듭니다."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# 텍스트 선택

`selectable`가 지정된 [`View`](./view.md)는 그 안의 텍스트를 웹 페이지처럼 함께 선택할 수 있게 합니다. 하나의 선택이 한 텍스트의 어느 지점에서 시작해 다른 텍스트의 어느 지점까지, 뷰, [`Text`](./text.md) 요소, [`TextView`](./text-view.md)를 가로지르며 읽는 순서대로 이어집니다. 채팅 대화 기록을 선택 가능하게 만들면 한 메시지에서 시작한 선택이 다음 메시지에서 끝날 수 있습니다. Copy는 선택한 텍스트를 클립보드에 넣으며, 나란히 놓인 텍스트는 탭으로, 그 외의 텍스트는 줄바꿈으로 이어 붙입니다. Rust에서는 `view().selectable(true)`로, TSX에서는 `<View selectable>`로 설정하며, 개별 텍스트를 선택할 수 있는지는 해당 텍스트의 `userSelect` 스타일이 결정합니다.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

뷰의 레이아웃과 외형은 앱의 스타일이 정하고, 내용은 뷰의 자식이 정합니다. 선택 자체는 플랫폼이 처리하며, 뷰는 선택을 위해 자체적으로 아무것도 그리지 않습니다.

<a id="a-chat-transcript"></a>

## 채팅 대화 기록

선택 가능한 하나의 뷰 안에 있는 대화 기록은 하나의 페이지처럼 선택됩니다. 한 답변에서 드래그를 시작해 다른 답변에서 끝낼 수 있으며, Copy는 그 사이에 있는 모든 메시지의 텍스트를 가져갑니다.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## 선택 방식

| 플랫폼 | 선택 방식 |
|---|---|
| macOS, Windows, Linux, GPUI | 텍스트를 가로질러 드래그합니다. 더블 클릭은 단어를, 트리플 클릭은 문단을 선택하며, 그 뒤에 이어서 드래그하면 단어 또는 문단 단위로 계속 선택합니다. Shift+클릭은 선택 범위를 확장합니다. Ctrl / Cmd+A는 뷰 안의 모든 것을 선택하고, Ctrl / Cmd+C는 복사하며, Escape 또는 바깥을 누르면 선택이 해제됩니다. |
| iOS, Android | 길게 누르면 단어가 선택됩니다. 플랫폼의 핸들로 선택 범위를 확장하며, 편집 메뉴에 Copy와 Select All이 있습니다. |
| Web | 브라우저 자체의 선택 기능과 제스처, 메뉴, 단축키를 사용합니다. |

<a id="what-it-selects"></a>

## 선택 대상

- **선택에서 제외되는 텍스트**: `userSelect: "none"`(Rust에서는 `.select_none()`, 클래스는 `select-none`)이 지정된 텍스트(레이블, 버튼의 캡션 등)는 선택과 선택 제스처에서 건너뜁니다.
- **중첩된 뷰**: 다른 선택 가능한 뷰 안에 있는 선택 가능한 뷰는 바깥 뷰의 일부가 되므로, 하나의 선택이 둘을 모두 포함합니다.
- **TextView**: `selectable`가 지정된 [`TextView`](./text-view.md)는 자체적으로 하나의 단위로 선택되며, 문단, 목록 항목, 셀, 코드 블록이 함께 선택됩니다. 선택 가능한 뷰 안에서는 바깥 선택에 합류합니다.
- **개별 텍스트**: 선택 가능한 뷰 밖에서 `userSelect: "text"`가 지정된 텍스트는 [Text](./text.md#props)에 설명된 대로 단독으로 선택됩니다.
- **외형**은 각 텍스트의 `selectionColor`(`selection:text-*`)에 적용되는 플랫폼의 하이라이트입니다.
- **목록**: 가상화된 [List](./list.md)에서는 선택이 마운트된 행만 포함하며, 화면 밖으로 재활용된 행은 선택에서 빠집니다.

<a id="related"></a>

## 관련 문서

- [View](./view.md): `selectable` prop.
- [Text](./text.md): `userSelect`, `selectionColor` 및 개별 텍스트의 선택.
- [TextView](./text-view.md): 블록들이 하나로 선택되는 문서.
