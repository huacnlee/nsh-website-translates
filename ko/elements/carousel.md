---
title: "Carousel"
description: "Carousel과 그 구성 요소: 슬라이드를 한 번에 한 곳씩 보여 주며, 스와이프, 휠과 터치패드(플랫폼 고유의 스크롤 방식 사용), 이전/다음 컨트롤, 페이지네이션, 키보드로 이동할 수 있고, 양 끝에서도 끊김 없이 이어집니다. Carousel은 어떤 슬라이드를 표시할지, 스냅, 루핑, 키 입력, 접근성을 담당하며, 모양과 모든 레이블은 앱에서 정합니다."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

캐러셀은 슬라이드를 한 번에 한 장씩 보여 줍니다. 제품 사진, 온보딩 단계, 저절로 넘어가는 배너, 카드 한 줄 등이 그 예입니다. 동작은 `Carousel`에서 맡습니다. 어떤 슬라이드를 보여 줄지, 슬라이드 간 스와이프, 이전/다음 컨트롤, 페이지네이션, 화살표 키, 양 끝에서의 순환, 스크린 리더가 읽어 주는 내용이 모두 여기에 포함됩니다. 각 파트는 컨텍스트를 통해 캐러셀을 찾으므로 앱이 자신의 레이아웃에서 자유롭게 배치할 수 있습니다. 모양은 앱의 몫입니다. 자체 색상, 크기, 화살표, 점, 레이블은 없습니다.

콘텐츠는 네이티브 스크롤 뷰입니다. 손가락, 휠, 터치패드가 플랫폼의 메인 스레드에서 포인터와 같은 프레임에 슬라이드를 움직이고, 손을 떼면 콘텐츠가 가장 가까운 슬라이드에 스냅되며 플링 한 번에 슬라이드 하나씩 넘어갑니다. 멈추면 캐러셀이 해당 슬라이드를 `onChange` 이벤트로 보고합니다. 컨트롤, 페이지네이션, 키, 앱의 `index` 모두 콘텐츠를 해당 슬라이드까지 애니메이션과 함께 네이티브로 스크롤합니다.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` 및 그 파트는 [`nsh/base`](../modules/nsh-base.md)에서 제공되며, Rust의 `nsh-base` 크레이트입니다. 표시되는 슬라이드는 앱의 `index`입니다. 스와이프, 컨트롤, 키가 다음 슬라이드를 `onChange` 콜백으로 보고하면, 캐러셀은 앱이 돌려준 `index` 값으로 스크롤합니다. 스와이프가 멈춘 슬라이드는 앱이 해당 `onChange`에 응답할 때까지 표시됩니다. 앱이 `index` 값으로 돌려주면 그대로 유지되고, 앱이 기존의 `index` 값을 유지하면 콘텐츠는 애니메이션과 함께 앱의 슬라이드로 되돌아갑니다. `index` 없이는 캐러셀이 `defaultIndex`에서 시작한 자체 값을 유지합니다. Rust에서 파트를 만드는 함수는 `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()`입니다. 각 속성에는 세터(`.index(..)`), 각 이벤트에는 리스너(`.on_change(..)`)가 있고, 타입이 지정된 스타일 메서드와 콘텐츠를 위한 `.child(..)` 등이 제공됩니다.

<a id="props"></a>

## 속성

<a id="carousel-1"></a>

### Carousel

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 없음 | 표시되는 슬라이드로, 0부터 시작하며 실제 슬라이드 수 범위로 제한됩니다. 앱이 이 값을 소유합니다. 변경은 `onChange` 이벤트로 보고되며, 앱이 새 `index` 값을 전달하면 그 슬라이드로 애니메이션과 함께 스크롤합니다. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | `index` 값이 설정되지 않은 동안 처음에 표시되는 슬라이드. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 슬라이드가 이어지는 방향이며, 캐러셀이 만들어질 때 읽습니다. 세로 캐러셀의 화살표 키는 Up과 Down입니다. |
| `looping` | `.looping(..)` | `boolean` | `false` | 슬라이드가 순환합니다. 마지막 뒤에 첫 번째가, 첫 번째 앞에 마지막이 끊김 없이 이어지며, 스와이프, 이전, 다음, 키, 앱의 `index` 모두 동일하게 적용됩니다([순환](#looping)). 캐러셀이 만들어질 때 읽습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 캐러셀을 부르는 이름으로, region입니다. 슬라이드가 무엇인지를 나타냅니다(`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | 없음 | `CarouselContent`, 컨트롤, 그리고 그 주변에 앱이 배치하는 모든 것. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 캐러셀의 레이아웃: 콘텐츠와 컨트롤이 놓이는 위치. |

### CarouselContent

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 없음 | `CarouselItem`들이며, 각각 콘텐츠의 자식입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 뷰포트의 크기와 슬라이드가 그 안에서 이루는 트랙: 슬라이드 사이의 `gap`, 보이는 슬라이드 옆 슬라이드가 살짝 보이게 하는 패딩. |

### CarouselItem

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 슬라이드를 부르는 이름으로, group입니다. 다른 슬라이드 중 몇 번째인지와 무엇을 보여 주는지를 나타냅니다(`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 슬라이드의 콘텐츠. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 축 방향의 크기(뷰당 슬라이드를 하나 보이려면 `w-full`, 세 개면 `basis-1/3`)와 모양. 순환하는 캐러셀에서는 슬라이드의 translation을 캐러셀이 관리하므로, 그 안쪽 뷰에 `transform` 속성을 지정하세요. |

### CarouselPrevious, CarouselNext

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 컨트롤의 이름으로, 자식에 그 이름을 말해 주는 텍스트가 없을 때(화살표 아이콘) 사용합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 앱의 아이콘 또는 레이블. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 모양과 위치: 콘텐츠 옆에 두거나, 콘텐츠 가장자리 위에 `absolute` 방식으로 겹쳐 둡니다. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스 상태이거나 끝에서 비활성화된 동안의 스타일로, `<state>:` 클래스로 지정합니다. |

### CarouselPagination

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 페이지네이션 아이템 그룹을 부르는 이름(`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | 없음 | 표시 중인 슬라이드의 아이템 위에 놓이는 뷰인 인디케이터의 Tailwind 클래스(점 뒤의 알약 모양, 밑줄 등): 모양과 행을 가로지르는 방향의 위치(`inset-y-0`, `bottom-0 h-0.5`). 행 방향으로는 해당 아이템을 덮으며, 다음 아이템으로 네이티브하게 스프링처럼 이동합니다. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | `indicatorClass` 위에 적용되는 인디케이터의 스타일. 둘 다 없으면 페이지네이션에는 인디케이터가 없습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | `CarouselPaginationItem`들과 그 사이에 앱이 배치하는 모든 것. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 행의 레이아웃(`flex-row gap-2`). |

### CarouselPaginationItem

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 필수 | 표시할 슬라이드로, 0부터 시작합니다. 마지막 슬라이드를 넘어서는 인덱스는 비활성화됩니다. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 해당 슬라이드가 표시되는 동안의 스타일로, `selected:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 표시하는 슬라이드가 무엇인지(`"Slide 3"`). 자식에 이를 말해 주는 텍스트가 없을 때(점) 사용합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 앱의 점, 썸네일 또는 숫자. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 모양. 그 안의 `group-selected:` 클래스는 `group` 아래에서 이를 따릅니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | 사용자가 다른 슬라이드로 이동했습니다. 스와이프, 휠, 터치패드가 그 슬라이드에서 멈췄거나, 컨트롤, 페이지네이션 아이템, 키가 이동을 요청한 경우입니다. `{ index }` 값이 그 슬라이드입니다. 앱이 새 `index` 값을 전달해도 보고되지 않습니다. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | 사용자가 콘텐츠를 드래그하기 시작했습니다(손가락, 터치패드). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | 사용자가 드래그한 콘텐츠가 멈췄습니다. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | 키보드 포커스가 캐러셀 안으로 들어왔습니다. 캐러셀 자체 뷰, 이전 또는 다음 컨트롤, 페이지네이션 아이템, 슬라이드 안의 포커스 가능한 뷰 중 하나로 들어온 경우입니다. 이들 사이를 이동할 때는 보고되지 않습니다. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | 키보드 포커스가 캐러셀을 벗어났습니다. 캐러셀 자체 뷰, 컨트롤, 페이지네이션 아이템, 슬라이드의 콘텐츠가 해당됩니다. |

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 캐러셀 | | `Carousel`의 `class`, `style` | `focus:` |
| 콘텐츠 | 캐러셀 | `CarouselContent`의 `class`, `style` | |
| 슬라이드 | 콘텐츠 | `CarouselItem`의 `class`, `style` | |
| 이전, 다음 | 캐러셀 | 각자의 `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| 페이지네이션 | 캐러셀 | `CarouselPagination`의 `class`, `style` | |
| 인디케이터 | 페이지네이션 | `indicatorClass`, `indicatorStyle` | |
| 페이지네이션 아이템 | 페이지네이션 | 자체 `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## 뷰당 여러 슬라이드

슬라이드의 너비는 슬라이드 자체 클래스가 정하므로, 카드 한 줄은 뷰포트 안의 여러 슬라이드가 됩니다. 각 슬라이드는 시작 위치가 스냅 지점입니다. 콘텐츠는 첫 번째 슬라이드가 멈추는 자리에 해당 슬라이드가 오도록 멈추므로, 첫 슬라이드 앞의 패딩이 각 슬라이드 앞에도 유지됩니다. 범위의 끝에서는 그 자리에 도달할 수 없는 슬라이드들이 마지막 슬라이드와 함께 멈추며, 다음(next)은 거기서 멈춥니다. `index` 값은 첫 번째 자리에 있는 슬라이드를 가리킵니다. 마지막과 함께 멈추는 슬라이드들은 같은 자리를 나타내며, 그곳에서의 스와이프는 그중 첫 번째를 보고합니다.

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

휴대폰 너비에서 `basis-1/2` 또는 `basis-[85%]` 같은 너비는 다음 카드를 살짝 보여 줍니다. 세로 캐러셀(`axis="vertical"`)은 슬라이드의 크기를 높이로 정합니다.

<a id="looping"></a>

## 순환

`looping` 설정 시 슬라이드가 끊김 없이 순환합니다. 마지막 다음에 첫 번째가 오며, 스와이프하든, 다음 버튼이나 키로 한 칸씩 이동하든, 앱이 `index` 값을 설정하든 그 사이의 슬라이드를 되감듯 가로지르지 않습니다. 콘텐츠는 슬라이드 앞뒤로 한 바퀴 분량의 공간을 확보하고, 각 슬라이드를 뷰의 가운데에 가장 가까운 위치에 그립니다. 이 작업은 애니메이션이 스크롤과 함께 플랫폼 자체 프레임에서 실행합니다. 각 슬라이드는 하나만 존재합니다. 스크린 리더와 페이지네이션도 한 번씩만 인식합니다.

슬라이드가 뷰포트와 슬라이드 하나 더를 채우는 동안에는 순환이 끊김 없이 이어집니다(전체 너비 슬라이드 세 장, 또는 3분의 1 너비 슬라이드 다섯 장). 그보다 적으면 이전, 다음, 키는 여전히 순환하지만, 슬라이드들을 가로질러 되감아 스크롤합니다.

<a id="slides-that-move-on-by-themselves"></a>

## 저절로 넘어가는 슬라이드

자동으로 넘어가는 배너는 앱의 몫입니다. `index` 값을 설정하는 타이머가 그 역할을 합니다. 캐러셀은 사용자가 조작 중일 때 이를 보고하므로 타이머는 그동안 기다려야 하며, [WAI-ARIA 캐러셀 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)도 이를 요구합니다. 드래그 전후의 `onDragStart` / `onDragEnd`, 키보드 포커스가 캐러셀 안에 있는 동안(캐러셀 자체, 컨트롤, 페이지네이션, 슬라이드의 콘텐츠)의 `onFocus` / `onBlur`, 그리고 그 주변 뷰 위의 포인터가 해당됩니다. 모션 줄이기가 켜져 있으면 끄고, 사용자가 멈출 수 있는 버튼(회전 컨트롤)을 제공하세요.

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

이펙트에서 `index()` 값을 읽으면 변경될 때마다(사용자가 만든 변경 포함) 간격 전체가 처음부터 다시 시작됩니다. `looping` 설정 시 마지막 슬라이드에서 첫 슬라이드로 갈 때는 이음새를 가로질러 앞으로 이동합니다.

<a id="accessibility"></a>

## 접근성

- 캐러셀은 `accessibilityLabel` 이름을 가진 region이고, 각 슬라이드는 자체 이름(다른 슬라이드 중 몇 번째인지와 무엇을 보여 주는지)을 가진 group입니다.
- 이전과 다음은 버튼이며, 캐러셀이 순환하지 않으면 양 끝에서 비활성화됩니다. 각 페이지네이션 아이템은 버튼이며, 해당 슬라이드가 표시되는 동안 선택됨 상태입니다.
- 모든 레이블은 앱이 제공하며, 앱의 언어로 작성합니다.
- 순환하는 캐러셀의 슬라이드는 어디에 그려지든 각각 한 번만 존재합니다.

레이블, 역할, 안내 전반은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="keyboard"></a>

## 키보드

Tab으로 누름을 받는 뷰에 도달할 수 있는 macOS와 웹에서는 캐러셀이 키보드 포커스의 정지 지점이며, 컨트롤과 페이지네이션 아이템도 마찬가지입니다. 이 중 하나에 포커스가 있는 동안 다음 키가 동작합니다.

| 키 | 동작 |
|---|---|
| Left, Right(세로일 때는 Up, Down) | 이전 또는 다음 슬라이드로 이동하며, 순환 중에는 양 끝을 넘어 이어집니다. |
| Home, End | 첫 번째 또는 마지막 슬라이드로 이동합니다. |
| Space, Return | 포커스된 컨트롤 또는 페이지네이션 아이템을 누릅니다. |

오른쪽에서 왼쪽으로 쓰는(right-to-left) 레이아웃에서는 가로 캐러셀의 슬라이드가 오른쪽에서부터 이어지므로, Left는 다음 슬라이드로, Right는 이전 슬라이드로 이동합니다. 세로 캐러셀은 Up과 Down을 그대로 유지합니다. 포커스를 가진 채 비활성화되는 컨트롤(마지막 슬라이드의 다음 버튼)은 포커스를 캐러셀로 넘기므로 키가 계속 동작합니다. 슬라이드 안에 있는 앱의 포커스 가능한 뷰는 자체 키를 유지합니다. 입력란의 화살표 키는 캐럿을 움직입니다.

<a id="motion"></a>

## 모션

- 스와이프, 휠, 터치패드는 같은 프레임에서 포인터와 함께 슬라이드를 움직입니다. 플랫폼이 스크롤합니다.
- 손을 떼면 콘텐츠는 플랫폼의 스냅에 따라 가장 가까운 슬라이드로 미끄러지듯 이동하며, 플링 한 번에 슬라이드 하나씩 넘어갑니다.
- 이전, 다음, 페이지네이션 아이템, 키, 앱의 `index` 모두 콘텐츠를 해당 슬라이드로 애니메이션과 함께 스크롤합니다. 모션 줄이기가 켜져 있으면 즉시 이동합니다.
- 페이지네이션의 인디케이터는 표시 중인 슬라이드의 아이템으로 스프링처럼 이동하며, 모션 줄이기가 켜져 있으면 즉시 이동합니다.
- `looping` 동작은 마지막 슬라이드에서 첫 슬라이드로 이음새를 가로질러 한 단계 앞으로 이동합니다. 콘텐츠가 멈추면 애니메이션 없이 한 바퀴만큼 되돌아가는데, 화면에는 아무 변화가 없습니다.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS, Android, Mac Catalyst: 손가락으로 슬라이드를 스와이프하고, 탭하면 컨트롤이 눌립니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 휠과 터치패드가 슬라이드를 스크롤하고, 클릭하면 컨트롤이 눌립니다. 콘텐츠 위의 마우스 드래그는 앱이 처리하며, 이는 그곳의 모든 스크롤 뷰와 같습니다.
- 모든 플랫폼은 앱이 스타일을 지정한 것을 그립니다: 슬라이드, 컨트롤, 페이지네이션, 그리고 그 인디케이터.
