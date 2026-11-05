---
title: "Link"
description: "Link 컴포넌트: 누르면 페이지, 사이트 또는 앱의 라우트로 이동하는 콘텐츠입니다. 누르기, 키보드 활성화, 비활성화 상태, 스크린 리더를 위한 link 역할을 지원하며, 스타일은 앱에서 지정합니다."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

링크는 사용자를 웹 페이지, 다른 앱(`mailto:`, `tel:`), 또는 앱 자체의 화면으로 이동시킵니다. 링크는 동작을
담당합니다. 누르기, 키보드 포커스가 있을 때의 Return과 Space, 비활성 상태, 스크린 리더를 위한 link 역할이
여기에 해당합니다. 모양은 앱의 몫입니다. `Link`에는 자체 색상, 밑줄, 레이블이 없으며 자식 요소가 화면에
표시됩니다. `href`은 이동할 곳을 알려 주는 열기용 데이터일 뿐, 화면에 표시되는 텍스트가 아닙니다.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 `Link`를 제공합니다. Rust에서는 `link()`로 링크를 만들며, prop마다
setter(`.href(..)`, `.open_with(..)`), 이벤트마다 리스너(`.on_open(..)`, `.on_press(..)`), 링크용 타입이 지정된 스타일 메서드, 콘텐츠용 `.child(..)`를
제공합니다.

<a id="opening"></a>

## 열기

링크를 누르거나 클릭하거나, 포커스된 링크에서 Return 또는 Space를 누르면 `href`을 엽니다.

1. `onOpen({ href })`이 이동할 곳을 알립니다.
2. `openWith="system"`(기본값)에서는 스킴이 있는 다른 앱이나 사이트의 URL(`https:`, `mailto:`, `tel:`, 다른 앱이 등록한 스킴)이
   [`openUrl`](../modules/nsh.md)이 여는 방식과 같이 앱 밖에서 열립니다. 먼저 임베딩하는 앱의 라우터가 처리하고, 그다음
   시스템이 처리합니다. 그 외의 `href`, 즉 앱의 경로(`/orders/42`)나 `#anchor`는 보고만 되고 앱이 처리합니다.
3. `onPress()`이 누름을 알립니다.

`openWith="app"`에서는 앱의 `onOpen` 핸들러가 링크를 여는 방법이 됩니다. 앱 자체 라우트, 앱 내 웹 뷰의 페이지, 또는
먼저 확인 절차를 둘 수 있습니다.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

앱이 `nsh.json`(`"openUrl": true` 또는 `{ "schemes": ["https", "mailto"] }`)에서 capability를 선언하는 경우, URL을 앱 밖에서 열려면 `openUrl` capability가
필요합니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | 없음 | 링크가 이동할 곳: URL 또는 앱의 경로. `onOpen`과 함께 보고되며 화면에는 표시되지 않습니다. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | `href`을 여는 주체: 시스템이 다른 앱이나 사이트의 URL을 엽니다. `"app"`은 `onOpen`에 맡깁니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누르기, 누름 피드백, 키보드 포커스가 없습니다. `disabled:` 스타일이 적용되며, 스크린 리더는 흐리게 표시된 상태라고 읽습니다. |
| `current` | `.current(..)` | `boolean` | `false` | 내비게이션이나 breadcrumb에서 사용자가 현재 있는 페이지로 가는 링크: 스크린 리더가 현재 페이지라고 읽습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 콘텐츠만으로는 정보가 부족할 때(아이콘 등) 스크린 리더가 읽는 내용. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 없음 | 경계 밖으로 얼마나 멀리까지 누름을 인정할지(포인트 단위): 모든 변에 적용되는 숫자 하나, 또는 변별 지정. view의 `hitSlop`과 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 콘텐츠: 레이블, 아이콘 등 앱이 표시하는 무엇이든. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 링크의 모양: 색상, 밑줄, 패딩. 텍스트 속성은 링크 안의 텍스트에 전달됩니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스, 비활성 상태일 때의 링크 스타일. `<state>:` 클래스와 같습니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | 링크가 `href`을 엽니다. `openWith="app"`에서는 핸들러가 열고, `"system"`에서는 시스템에 열도록 요청된 내용을 받습니다. `onPress`보다 먼저 발생합니다. |
| `onPress` | `.on_press(\|\| ..)` | 링크가 눌렸습니다: 탭, 클릭, 또는 키보드 포커스가 있을 때 Return 또는 Space. |

비활성 링크는 아무것도 보고하지 않으며, 그 링크를 눌러도 주변의 누를 수 있는 뷰에는 전달되지 않습니다.

<a id="states"></a>

## 상태

앱은 클래스나 스타일 prop으로 각 상태를 스타일링합니다.

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

방문한 링크는 앱이 기억합니다. 앱이 연 href를 보관하고, 자체 상태에 따라 해당 링크를 스타일링합니다.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## 텍스트 안에서

`<Text>` 안의 `Link`은 텍스트 안의 모든 뷰와 마찬가지로 단락의 인라인 박스입니다. 줄 안에 놓이고, 자체 상태,
포커스, 역할을 유지하며, 한 줄에 머뭅니다. `align-text-bottom`는 한 줄 텍스트로 된 링크를 단락의 baseline에 맞춥니다.

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

단락의 줄과 함께 줄바꿈되는 링크는 `role="link"`와 `onPress`가 있는 중첩된 `<Text>`입니다([Text](./text.md) 참고).
[TextView](./text-view.md)가 문서의 링크를 그리는 방식이 이것입니다.

<a id="a-small-target-with-hitslop"></a>

## hitSlop으로 작은 대상 누르기

링크는 손가락보다 작을 수 있습니다. 아이콘이나 짧은 단어가 그런 경우입니다. `hitSlop`은 레이아웃이나 모양을
바꾸지 않고, 링크 근처에 닿은 누름도 인정합니다. 각 변 바깥쪽으로 포인트 단위로 지정하며, 모든 변에 적용되는
숫자 하나 또는 변별 지정(`{ top: 8, bottom: 8 }`)이 가능합니다. [view의 `hitSlop`](./index.md#presses-and-feedback)과 같은 방식입니다.

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## 접근성

- 링크는 스크린 리더에게 `"link"` 역할을 가진 하나의 요소입니다. 레이블은 자식의 텍스트 또는 `accessibilityLabel`입니다.
  `href`는 데이터로 남으며, 스크린 리더는 레이블을 읽습니다.
- `current`는 현재 페이지로 읽히며(ARIA의 `aria-current="page"`), `disabled`는 플랫폼이 흐리게 표시된 요소를 읽는 방식으로
  읽힙니다.
- macOS와 웹에서 링크는 키보드 포커스 정지점입니다. Tab으로 이동하고, Return과 Space로 열며, `focus:`
  스타일이 포커스 위치를 보여 줍니다.

레이블, 역할, 안내 전반에 대해서는 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS, Android, Mac Catalyst: 누름은 링크 위에서 끝나는 탭입니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 누름은 클릭입니다. macOS와 웹에서는 Return과 Space로도 키보드
  포커스가 있는 링크를 열 수 있습니다.
- 웹은 링크를 `role="link"`이 있는 요소로 렌더링합니다.
- 모든 플랫폼이 앱이 지정한 스타일대로 그립니다.
