---
title: "Scrollbar"
description: "Scrollbar 컴포넌트: 앱 고유의 모양을 가진 스크롤 막대로, 모든 스크롤 뷰와 목록에 (한 번 설정하는 테마로) 또는 하나의 뷰에만 적용할 수 있으며, 앱이 원하는 위치에 배치할 수 있습니다. 스크롤 막대의 썸(thumb)은 콘텐츠를 따라 움직이고, 드래그와 누르기 동작으로 콘텐츠를 스크롤하며, 스크롤하는 동안, 마우스를 올렸을 때 또는 항상 표시되고, 앱이 정한 타이밍에 따라 페이드 인/아웃됩니다."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# Scrollbar

Scrollbar는 스크롤 뷰나 리스트에 앱 고유의 모양을 가진 바를 제공합니다. 포인터를 올리면 넓어지는 얇은 알약 모양, 브랜드 톤의 트랙, 고정된 헤더 옆이나 두 패널을 따라 놓이는 바 등을 만들 수 있습니다. 앱의 테마로 한 번 설정하면 모든 스크롤 뷰와 리스트가 플랫폼의 인디케이터 대신 이 바를 그립니다([기본 제공 바](#built-in-bars)). 앱이 직접 배치하는 경우에는 움직일 스크롤 뷰를 지정하며, 앱이 정한 어느 위치에든 놓일 수 있습니다. Scrollbar는 동작을 스스로 관리합니다. 썸의 길이와 위치는 콘텐츠, 뷰포트, 오프셋에 따라 정해지고(리스트가 늘어나거나 창 크기가 바뀔 때도 마찬가지입니다), 썸을 드래그하면 콘텐츠가 스크롤되며, 트랙을 누르면 썸의 중앙이 그 위치로 이동합니다. 콘텐츠가 스크롤되는 동안, 포인터가 바 위에 있는 동안, 또는 항상 표시되도록 할 수 있으며, 나타나고 사라질 때의 페이드는 네이티브로 처리됩니다. 모양과 타이밍은 앱이 정합니다. `Scrollbar`에는 자체 색상, 크기, 반경이 없으며, 앱이 시간을 지정하기 전까지 페이드는 시간이 걸리지 않습니다.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar`는 [`nsh/base`](../modules/nsh-base.md)에서 제공되며, Rust에서는 `nsh-base` crate에 해당합니다. Rust에서 `scrollbar()`는 prop마다 하나의 setter(`.scroll(..)`, `.thumb_style(..)`)와 바 자체를 위한 타입이 지정된 스타일 메서드로 바를 만들며, `scroll`는 `ElementRef`(또는 `ScrollbarTarget`)를 받습니다.

<a id="built-in-bars"></a>

## 기본 제공 바

모든 스크롤 뷰와 리스트는 배치할 바 없이도 플랫폼의 인디케이터 대신 `Scrollbar`를 그릴 수 있습니다. 앱이 시작되는 곳 어디서든 한 번, `Scrollbar.setTheme`로 `scrollbar` 값이 `true`인 각 뷰의 바에 앱의 모양을 지정합니다. 각 뷰는 자신의 뷰포트 위에 고유한 바를 가지며, 이 바는 콘텐츠가 스크롤되어도 제자리에 머물고(sticky 뷰처럼 메인 스레드에서 처리됩니다) 콘텐츠 위에 그려집니다. 배치된 `Scrollbar`와 마찬가지로 따라가고, 스크롤되고, 페이드됩니다.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

`ScrollbarTheme`는 모든 뷰에 공통인 바의 prop과 각 축의 모양을 가집니다.

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | 바가 표시되는 시점: [표시 시점](#when-it-shows). |
| `motion` | `ScrollbarMotion` | 즉시 전환, `idle` `2000` | 표시되고 숨겨지는 방식: [모션](#motion). |
| `minThumbLength` | `number` | `48` | 썸이 가질 수 있는 최소 길이. |
| `vertical`, `horizontal` | `ScrollbarLook` | 없음 | 세로 뷰와 가로 뷰의 바 모양: 트랙용 `class`와 `style`(뷰의 뷰포트 안에 배치), `thumbClass`와 `thumbStyle`, `accessibilityLabel`. 해당 축에 모양이 지정되지 않은 뷰는 플랫폼의 인디케이터를 유지합니다. |

이후에 적용한 `setTheme`는 바의 스타일을 다시 지정하고, `Scrollbar.setTheme(null)`는 뷰에 플랫폼의 인디케이터를 되돌려 줍니다. 앱이 테마를 설정했는지 여부와 관계없이, 개별 뷰는 `scrollbar` prop(`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`)으로 자신만의 테마를 가질 수 있으며, `scrollbar={false}`는 해당 뷰를 바 없이 둡니다. 부모의 뷰포트 안에 배치된 리스트(`viewport="parent"`)는 그 뷰 및 그 뷰의 바와 함께 스크롤됩니다. 여러 줄 `Input`도 세로 모양의 바를 텍스트 위에 가지며, 텍스트 뷰 자체의 인디케이터가 하던 대로 텍스트를 스크롤합니다.

<a id="the-scroll-view-it-moves"></a>

## 바가 움직이는 스크롤 뷰

`scroll`는 바가 따라가는 스크롤 뷰 또는 리스트, 즉 해당 `ref`를 지정합니다. 바는 화면에 나타난 뒤에 대상을 찾으므로, `ref`는 같은 렌더에서 나중에 오는 요소가 설정해도 됩니다. 바는 스크롤 뷰 뒤에 작성하거나(또는 `ref`를 signal에 보관하세요). 스크롤 뷰 자체의 인디케이터는 `scrollbar={false}`로 끄고, 바는 `class`로 배치합니다. 둘을 감싸는 `relative` 박스 안에서 스크롤 뷰의 가장자리 위에 놓거나, 화면의 다른 어느 곳에든 놓을 수 있습니다.

- 썸의 길이는 뷰포트가 보여 주는 콘텐츠의 비율에 따라, 트랙의 콘텐츠 박스(패딩 안쪽)를 기준으로 정해지며, `minThumbLength`보다 짧아지지 않습니다. 썸의 위치는 콘텐츠가 스크롤된 정도입니다. 콘텐츠가 끝을 넘어 바운스되는 동안 썸은 그 끝에 머뭅니다.
- 썸을 드래그하면 썸이 움직인 만큼 콘텐츠가 스크롤됩니다. 트랙을 누르면 썸의 중앙이 포인터 아래로 이동하고, 드래그는 거기서부터 이어집니다.
- 세로 바는 세로 스크롤 뷰를 따라가며, `axis="horizontal"`는 가로 스크롤 뷰용 바를 만듭니다(아래쪽 가장자리를 따라 배치하세요). 축마다 바는 하나입니다.
- 리스트도 마찬가지로 동작합니다. 행이 측정되고 추가됨에 따라 썸이 리스트 전체 길이를 따라갑니다.

<a id="when-it-shows"></a>

## 표시 시점

| `mode` | 표시 |
|---|---|
| `"scrolling"` (기본값) | 콘텐츠가 스크롤되는 동안, 그리고 멈춘 뒤 `motion.idle`가 지날 때까지. 바가 표시되는 동안 포인터가 바 위에 있으면 계속 표시됩니다. |
| `"hover"` | 포인터가 바 위에 있는 동안(바가 표시되는 위치에서는 숨겨져 있어도 해당), 그리고 `"scrolling"`처럼 동작합니다. |
| `"always"` | 항상. |

모든 모드에서 썸을 드래그하는 동안에는 바가 표시되며, 마지막 스크롤, 드래그 또는 호버 이후 `motion.idle` 동안 유지됩니다. 콘텐츠가 뷰포트에 들어맞는 동안에는 숨겨진 상태로 유지됩니다. 숨겨진 바는 `opacity: 0` 상태이며, 누름 이벤트를 그 아래에 있는 요소로 통과시킵니다.

<a id="motion"></a>

## 모션

`motion`는 바의 페이드 시간을 지정하며, 페이드는 `gpui-base`의 `ScrollbarMotion`처럼 네이티브로 실행됩니다.

| 필드 | 기본값 | 설명 |
|---|---|---|
| `idle` | `2000` | 마지막 스크롤, 드래그 또는 호버 이후 바가 머무는 시간(밀리초). |
| `enter` | `0` | 나타나는 데 걸리는 시간. 불투명도는 선형으로 증가하고, 슬라이드는 ease-out으로 진행됩니다. |
| `exit` | `0` | `idle`가 끝난 뒤 사라지는 데 걸리는 시간. ease-in으로 진행되며, 페이드되면서 트랙 밖으로 슬라이드됩니다. |
| `entrance` | `"fade"` | 나타나는 방식: 제자리에서 `"fade"`, 또는 바가 있는 가장자리(오른쪽, 아래쪽)에서 `"slideAndFade"`. |
| `thumbHoverEntrance` | `"fade"` | 숨겨진 썸 위의 포인터로 바가 표시될 때 나타나는 방식(`"hover"`). |

지속 시간이 없으면 바는 즉시 나타나고 사라집니다. 중간에 되돌려진 페이드는 속도를 유지하며, 남은 구간에 해당하는 비율만큼의 시간 동안 실행됩니다. `"always"` 바는 애니메이션되지 않으며, 사용자가 모션 줄이기를 요청한 동안에는 어떤 바도 애니메이션되지 않습니다. 트랙은 슬라이드되는 부분을 클리핑합니다. `hover:`에서 너비가 커지는 것과 같은 썸 자체의 모션은 썸 스타일에 속합니다(`thumbClass`의 `transition-all`).

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | 없음 | 바가 따라가며 움직이는 스크롤 뷰 또는 리스트(해당 `ref`). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | 스크롤 뷰의 축. 트랙이 이 축을 따라 놓입니다. 바가 만들어질 때 읽습니다. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | 바가 표시되는 시점. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | 즉시 전환, `idle` `2000` | 표시되고 숨겨지는 방식: [모션](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | 긴 콘텐츠에서 썸이 가질 수 있는 최소 길이. 잡기 쉬운 상태를 유지하기 위한 값입니다. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 썸. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 바에 대해 읽어 주는 내용. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 바: 트랙과 앱이 배치하는 위치. |

<a id="parts"></a>

## 파트

| 파트 | 내부 | 스타일 지정 |
|---|---|---|
| 트랙 | 앱이 배치한 위치 | `class`, `style` |
| 썸 | 트랙의 콘텐츠 박스 | `thumbClass`, `thumbStyle` |

바는 축을 따라 썸의 크기를 정하고 이동시킵니다. 썸의 두께와 트랙을 가로지르는 방향의 위치는 앱이 정합니다(트랙에 `w-1.5`와 `items-end`를 지정하면 6포인트 두께의 썸이 오른쪽에 놓입니다). 트랙의 패딩은 썸이 트랙의 양 끝과 측면에 닿지 않게 합니다.

각 파트가 보여 주는 상태는 다음과 같습니다.

- 트랙: 포인터 아래에서 `hover:`. 트랙은 `group`이므로 썸이 트랙으로부터 `group-hover:`를 가져옵니다(포인터가 가까워지면 넓어지는 썸).
- 썸: 포인터 아래에서 `hover:`, 드래그되는 동안 `active:`.

바의 가시성은 곧 불투명도입니다. 색상의 투명도는 트랙의 배경이나 썸에 지정하세요. 넓어지는 썸은 `transition-all`를 사용하며(바가 썸의 스타일과 별도로 설정하는 썸의 위치는 절대 지연시키지 않습니다), `motion-reduce:`는 모션 줄이기를 요청한 사용자에게는 썸을 움직이지 않게 합니다.

<a id="accessibility"></a>

## 접근성

- 스크롤 뷰는 계속해서 스크린 리더가 스크롤하는 대상입니다. 스크린 리더는 자체 제스처로 스크롤 뷰를 움직이고 그 콘텐츠를 읽습니다.
- 바에 접근할 수 있는 스크린 리더를 위해 바에는 `accessibilityLabel`로 레이블이 지정됩니다.

레이블, 역할, 액션에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 모든 플랫폼은 앱이 스타일을 지정한 대로 그리며, 썸은 각 플랫폼이 스크롤 뷰에 대해 보고하는 오프셋을 따라갑니다. 썸 드래그와 트랙 누름은 마우스, 펜, 손가락으로 모두 동작합니다.
- `"hover"`는 마우스나 터치패드 포인터를 따라갑니다(데스크톱과 웹). 터치 스크린에서는 콘텐츠가 스크롤되는 동안 바가 표시되며, 숨겨진 트랙은 터치를 통과시킵니다.
