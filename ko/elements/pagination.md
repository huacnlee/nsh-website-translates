---
title: "Pagination"
description: "Pagination 컴포넌트: 이동할 수 있는 페이지 집합으로, 현재 페이지 주변의 페이지, 줄임표, 이전 및 다음 버튼, 간결한 페이저, 키보드 조작, 스크린 리더를 위한 현재 페이지 정보를 제공하며 앱에서 스타일을 지정합니다."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# Pagination

Pagination은 검색 결과, 표의 행, 아카이브처럼 페이지로 나뉜 집합 사이를 이동합니다. 이전, 현재 페이지 주변의 페이지(처음과 마지막 페이지는 항상 표시하고, 생략된 구간마다 줄임표를 하나씩 표시), 앱의 children, 다음을 보여 줍니다. 표시할 페이지, 누름, 키보드, 처음과 끝에서의 이전·다음 비활성화, 내비게이션 랜드마크, 스크린 리더용 현재 페이지 정보 같은 동작은 Pagination이 담당합니다. 외형은 앱의 몫입니다. 항목에는 고유한 색, 크기, 레이블이 없으며 앱이 스타일을 지정하거나 직접 그립니다.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination`의 출처는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)입니다. Rust에서는 `pagination()`로 만들며, prop마다 setter(`.page(..)`, `.total_pages(..)`), 사용자가 고른 페이지를 위한 `.on_change(..)`, 행에 쓰는 타입이 지정된 스타일 메서드, 앱의 콘텐츠를 위한 `.child(..)`를 제공합니다.

<a id="the-page"></a>

## 페이지

페이지는 앱이 관리합니다. `page`: 1부터 시작하는 현재 페이지. `onChange({ page })`: 사용자가 페이지, 이전, 다음을 눌러 고른 페이지를 알립니다. 앱은 이 값을 설정하고, 해당 페이지를 불러와 행을 표시합니다. `totalPages`: 전체 페이지 수. 마지막 페이지를 넘어서는 `page` 값은 마지막 페이지를 표시합니다. 현재 페이지를 누르면 아무것도 알리지 않으며, 첫 페이지의 이전과 마지막 페이지의 다음도 마찬가지입니다.

<a id="the-pages-shown"></a>

## 표시되는 페이지

`visiblePages`(최소 5, 기본값)을 기준으로, 모든 페이지가 들어가는 동안에는 행이 모든 페이지를 표시합니다. 그보다 많아지면 처음과 마지막 페이지, 현재 페이지와 그 양쪽에 들어가는 만큼의 페이지, `(visiblePages - 3) / 2`, 그리고 생략된 구간마다 줄임표를 표시합니다.

| 20 중 `page`, `visiblePages={7}` | 표시 |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

페이지가 1만 개여도 같은 7개 항목이 표시됩니다. `visiblePages`이 홀수이면 현재 페이지가 가운데에 놓입니다.

<a id="items"></a>

## 항목

각 항목에는 앱의 `itemClass` 및 `itemStyle`이 적용됩니다. 현재 페이지는 `selected:`, 누름을 받지 않는 항목은 `disabled:`, 키보드 포커스가 있는 항목은 `focus:`입니다. 행의 레이아웃은 앱이 `class`로 정합니다(기본값은 row, `gap-*`, `justify-*`).

`renderItem`이 없으면 페이지는 번호를, 줄임표는 `…`을, 이전과 다음은 접근성 레이블을 표시합니다(레이블이 없으면 `‹` 및 `›`). `renderItem`은 `PaginationItemState`에서 각 항목의 콘텐츠를 그립니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | 항목의 종류. |
| `page` | `number` | 페이지의 번호. 이전 또는 다음이 이동할 페이지(양 끝에서는 현재 페이지). 줄임표의 경우 숨겨진 첫 페이지. |
| `start`, `end` | `number` | 줄임표가 숨기는 페이지. `start` 포함, `end`(다음에 표시되는 페이지)은 제외. |
| `current` | `boolean` | 현재 페이지. |
| `disabled` | `boolean` | 누름을 받지 않음. 첫 페이지의 이전, 마지막 페이지의 다음, 비활성화된 pagination의 모든 항목. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

줄임표는 자체적으로 누름을 받지 않으며, 줄임표가 하는 일은 앱이 정합니다. 줄임표 안에 그린 `Menu`은 위의 `JumpMenu`처럼 줄임표가 숨기는 페이지를 나열합니다.

## Compact

`compact`는 이전, children, 다음만 표시합니다. 좁은 화면을 위한 페이저이며, 페이지 정보는 children에 담습니다.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

children은 두 형태 모두에서 페이지 뒤, 다음 앞에 놓입니다. 페이지 수나 특정 페이지로 이동하는 입력 필드 등을 넣을 수 있습니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | 필수 | 1부터 시작하는 현재 페이지. 앱이 `onChange`에서 설정합니다. |
| `totalPages` | `.total_pages(..)` | `number` | 필수 | 전체 페이지 수. 최소 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | 한 번에 표시하는 최대 페이지 수(처음과 마지막 포함). 최소 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | 이전, children, 다음만 표시. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 어떤 항목도 누름이나 키보드 포커스를 받지 않습니다. `disabled:` 스타일이 적용되고, 스크린 리더는 흐리게 표시된 상태라고 알립니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 내비게이션을 부르는 이름. 무엇을 넘겨 보는지 나타냅니다. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 이전과 다음에 대해 말하는 내용, 그리고 `renderItem`이 없을 때의 콘텐츠. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 항목의 외형. 현재 페이지에는 `selected:`, 그 밖에 `disabled:`, `focus:`. 텍스트 스타일은 콘텐츠에 전달됩니다. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | 없음 | 각 항목의 상태로부터 콘텐츠를 그립니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 페이지 뒤, 다음 앞에 놓이는 앱의 콘텐츠. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 행의 외형과 레이아웃. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: 사용자가 페이지, 이전, 다음으로 고른 페이지. 현재 페이지는 알리지 않습니다. |

<a id="motion"></a>

## 모션

현재 페이지 표시는 앱의 `selected:` 클래스에 따라 항목 사이를 이동합니다. `itemClass`에 `transition-colors`를 지정하면 강조 표시가 이전 페이지에서 이동한 페이지로 서서히 바뀝니다. 페이지가 바뀌어도 모든 항목은 제자리에 있고 항목이 보여 주는 내용만 바뀌므로 행이 깜박이지 않습니다. 모션 줄이기가 켜져 있으면 앱의 transition은 멈춥니다(`motion-reduce:transition-none`).

<a id="accessibility"></a>

## 접근성

- 행은 `accessibilityLabel`으로 이름이 붙은 내비게이션 랜드마크입니다.
- 각 페이지, 이전, 다음은 버튼입니다. 현재 페이지는 현재 페이지(ARIA의 `aria-current="page"`)로 읽히며 선택된 상태입니다. 첫 페이지의 이전과 마지막 페이지의 다음은 흐리게 표시됩니다.
- macOS와 웹에서는 각 페이지, 이전, 다음이 키보드 포커스의 정지 지점이며, Return과 Space로 누릅니다. 키보드로 누른 페이지는 앱이 해당 페이지를 표시한 뒤에도 행 안의 위치와 관계없이 포커스를 유지합니다. 이전 또는 다음이 도달한 첫 페이지나 마지막 페이지도 마찬가지입니다.

레이블, 역할, 안내 방송에 대한 일반적인 내용은 [Accessibility](../docs/accessibility.md)를 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS, Android, Mac Catalyst: 항목 위에서 끝나는 탭이 누름입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누름은 클릭입니다. macOS와 웹에서는 Tab으로 항목에 이동할 수 있습니다.
- 모든 플랫폼에서 앱이 스타일을 지정한 대로 그립니다.
