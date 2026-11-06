---
title: "스크롤"
description: "Rust와 TSX의 스크롤 뷰 - 페이징과 스냅, 확대/축소, 당겨서 새로고침, 스크롤 이벤트, scrollValue를 이용한 스크롤 연동 효과, 스크롤 뷰에서의 키보드, 코드에서의 스크롤 제어를 다룹니다."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# 스크롤

스크롤 뷰(Rust에서는 `scroll()`, TSX에서는 `<Scroll>`)는 플랫폼 자체의 스크롤 뷰(iOS의 UIScrollView, Android의 ScrollView)입니다. 플링, 바운스, 스크롤 인디케이터, 당겨서 새로고침은 모두 네이티브로 동작하며, 스냅도 마찬가지입니다. 코드는 이벤트를 통해 스크롤 상황을 전달받으며, 오프셋을 [애니메이션 값](./animation.md#animated-values)에 바인딩하여 손가락을 프레임 단위로 따라가는 효과를 만들 수 있습니다.

스크롤 뷰는 크기가 알려져 있고 규모가 적당한 콘텐츠에 사용하세요. 설정 페이지, 폼, 기사, 칩 행 등이 그 예입니다. 길거나 끝이 없는 데이터에는 행을 재활용하고 동일한 스크롤 props를 받는 [리스트](./lists.md)를 사용하세요.

<a id="a-scroll-view"></a>

## 스크롤 뷰

스크롤 뷰는 뷰포트이며, 그 자식이 콘텐츠입니다. 뷰포트는 부모로부터 크기를 받아야 하며(보통 `flex: 1`, `.flex_1()`), 콘텐츠는 뷰포트의 너비(세로 스크롤) 또는 높이(가로 스크롤)에 맞춰 배치되고 필요한 만큼 길어집니다.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

위의 자식 뷰는 스크롤 뷰의 콘텐츠 컨테이너입니다. TSX에서는 `contentStyle`(또는 `contentClass`)가 해당 스타일의 뷰로 자식들을 감싸서 컨테이너를 만들어 주며, 이 뷰는 자식들과 함께 스크롤됩니다. `flexGrow: 1`(`.flex_grow(1.0)`)은 콘텐츠를 최소한 뷰포트만큼 높게 만들므로, 짧은 콘텐츠는 가운데에 배치하면서도 긴 콘텐츠는 계속 스크롤할 수 있습니다.

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

가로 스크롤 뷰에는 `horizontal`(`.horizontal()`)를 지정하고, 자식으로 행(row)을 사용합니다.

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

오른쪽에서 왼쪽으로 읽는 환경([기기와 환경](./device-and-environment.md#right-to-left) 참고)에서는 가로 스크롤 뷰가 오른쪽 끝에서 시작하며, 그 끝으로부터의 거리를 유지합니다.

스크롤 뷰는 손가락으로 드래그합니다. 데스크톱(macOS, Windows, Linux)과 브라우저에서는 데스크톱 앱처럼 마우스로 스크롤합니다. 휠(Shift + 휠은 가로 스크롤), 터치패드, 키보드, 스크롤 인디케이터를 사용하며, 인디케이터는 마우스가 뷰 위에 있는 동안 표시되고 스크롤 바처럼 드래그할 수 있습니다. 마우스 드래그는 앱의 팬, 리스폰더, 텍스트 선택에 전달됩니다. 데스크톱의 터치스크린은 손가락과 동일하게 스크롤 뷰를 드래그합니다. 가로 스크롤 뷰는 `scrollbar={false}`를 지정해도 데스크톱에서 인디케이터를 유지하는데, 가로 휠이 없는 마우스로 뷰를 움직일 수 있는 방법이기 때문입니다.

<a id="behavior-props"></a>

### 동작 props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 가로로 스크롤합니다. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 사용자가 스크롤할 수 있습니다. 코드에서의 스크롤은 계속 동작합니다. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 가장자리를 넘어서는 오버스크롤입니다. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | 스크롤 인디케이터가 표시됩니다. 데스크톱과 데스크톱 브라우저에서는 가로 뷰가 이를 유지하는데, 마우스의 스크롤 바이기 때문입니다. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | 콘텐츠 주위의 여백이며, 그 안으로 스크롤할 수 있습니다. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 시작 위치입니다. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | 플랫폼 기본값 | 플링이 느려지는 속도입니다. `"normal"`, `"fast"` 또는 밀리초당 유지되는 속도 값을 지정합니다(`0.998`은 보통, `0.99`은 빠름이며, `0`는 플랫폼의 기본값입니다). |

<a id="paging-and-snapping"></a>

## 페이징과 스냅

스냅은 손가락을 뗄 때 해제 시점의 오프셋, 예상 활주 거리, 속도를 바탕으로 네이티브에서 결정됩니다. 이후 스크롤 뷰가 선택된 정지 지점까지 미끄러지듯 이동하며, 코드는 전혀 관여하지 않습니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | 뷰포트 크기의 배수 위치에서 멈춥니다. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | 이 길이의 배수 위치에서 멈춥니다(0: 꺼짐). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | 이 오프셋들에서 멈춥니다. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `snapToInterval`와 함께 사용하며, 아이템의 어느 지점을 뷰포트에 맞출지 지정합니다. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | 플링은 최대 한 지점만 이동합니다. |

스크롤 뷰와 같은 너비의 페이지들과, 활주가 끝날 때 갱신되는 인디케이터로 구성한 페이저입니다.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

플링 한 번에 카드 한 장씩 가운데로 스냅되는 카드 캐러셀입니다.

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

리스트도 동일한 스냅 props를 받으므로, 긴 캐러셀에는 리스트가 더 나은 선택입니다.

<a id="scroll-events"></a>

## 스크롤 이벤트

| Prop | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | 오프셋이 변경되었습니다. 프레임당 최대 한 번 발생하며, `scrollEventThrottle`로 간격을 더 늘릴 수 있습니다. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | `onScroll` 이벤트 사이의 최소 간격(밀리초)입니다. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | 사용자가 드래그를 시작했습니다. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | 사용자가 손가락을 뗐습니다. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | 플링 이후의 활주가 시작되었습니다. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | 활주가 끝났습니다(새 드래그가 활주를 멈춘 경우도 포함). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | 사용자 스크롤이 멈췄습니다. 활주가 끝난 뒤, 또는 활주 없이 드래그가 끝났을 때입니다. |

`ScrollEvent`에는 오프셋(`offset`, `Point` 타입이며 Rust에서도 동일), 콘텐츠의 크기와 확대된 크기(`contentSize`, `Size` 타입, `content_size`), 뷰포트(`size`), 그리고 `zoomScale`(`zoom_scale`)이 담겨 있습니다. 다른 이벤트들은 오프셋을 전달하며, TSX에서는 `{ offset }`에 `Point`로, Rust에서는 `Point<Points>`로 전달됩니다.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll`은 스크롤의 매 프레임마다(스로틀 적용 범위 내에서) 코드를 실행합니다. 페이드되는 헤더나 시차(parallax) 이미지처럼 스크롤에 연동된 것처럼 *보이기만* 하면 되는 경우에는 완전히 네이티브로 실행되는 [`scrollValue`](#scroll-linked-effects-scrollvalue)를 대신 사용하세요.

<a id="scroll-linked-effects-scrollvalue"></a>

## 스크롤 연동 효과: scrollValue

`scrollValue`(`.scroll_value(&value)`)는 [애니메이션 값](./animation.md#animated-values)을 받아, 콘텐츠가 움직이는 동일한 프레임에 네이티브에서 (주축 방향의) 스크롤 오프셋을 그 값에 기록합니다. 이 값 또는 `interpolate`, `diffClamp`(`diff_clamp`)이나 산술 연산으로 파생된 노드를 스타일에 바인딩하세요.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

콘텐츠가 위로 스크롤되는 동안 사라지고 아래로 스크롤하면 바로 돌아오는 헤더는 오프셋의 `diffClamp`입니다.

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

보간은 기본적으로 입력 범위 밖에서 값이 고정(clamp)되므로, 맨 위를 넘어 당기면(음수 오프셋) 효과가 끝 값에 머뭅니다. 당길수록 커지는 늘어나는 헤더를 만들려면 `extrapolate: "extend"`(Rust에서는 `interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))`)를 전달하세요.

<a id="pull-to-refresh"></a>

## 당겨서 새로고침

`refreshing`와 `onRefresh`(`.refreshing(..)`와 `.on_refresh(..)`)는 플랫폼의 당겨서 새로고침 컨트롤을 추가합니다. 컨트롤은 `refreshing`가 true인 동안 표시되며, `onRefresh`에서 값을 설정하고 작업이 끝나면 해제하세요.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

iOS에서는 컨트롤이 UIRefreshControl이며, Mac Catalyst의 Mac 방식에서는 NSH가 동일한 동작의 자체 스피너를 표시합니다. 리스트도 동일한 props를 받습니다. 데스크톱과 브라우저에서는 마우스가 드래그 없이 스크롤하므로, 당기기는 터치스크린(또는 맨 위를 넘어 당기는 macOS 트랙패드)의 제스처입니다. 따라서 버튼이나 키보드 단축키 같은 다른 새로고침 방법도 함께 제공하세요.

<a id="an-indicator-of-your-own"></a>

### 직접 만드는 인디케이터

당기기의 모양은 앱이 선택할 수 있습니다. `refreshIndicator={{ height }}`는 앱이 자체 인디케이터를 그린다는 뜻이고, `height`는 그 높이를 포인트 단위로 지정합니다. 이 경우 플랫폼의 스피너는 숨겨지고, 당김이 `height`에 도달하면 새로고침이 시작되며, 새로고침 중에는 인디케이터를 위해 콘텐츠 위쪽에 `height`만큼의 공간이 유지됩니다. `pullValue`는 콘텐츠가 맨 위를 넘어 얼마나 당겨졌는지를 애니메이션 값에 전달합니다. 정지 상태에서는 0이고, 당길수록 커지며, 새로고침 중에는 `height`입니다. 인디케이터를 스크롤 뷰의 위쪽에 겹쳐 그리고 그 값으로 스타일을 보간하세요. 인디케이터는 UI 스레드에서 손가락을 따라가며, 프레임마다 JS가 실행되지 않습니다.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

`height`는 뷰포트의 절반 이내로 유지하세요. 맨 위를 넘어서면 멀리 갈수록 콘텐츠가 손가락에 더 강하게 저항하므로, 너무 큰 높이에는 도달할 수 없습니다. iOS에서는 앱 자체의 인디케이터가 UIRefreshControl을 대체하며, Mac 방식에서처럼 NSH가 직접 감지한 당김을 사용합니다.

<a id="zooming"></a>

## 확대/축소

스크롤 뷰(리스트의 배율은 1로 유지됩니다)는 최대 확대 배율이 최소 배율보다 크면 확대/축소할 수 있습니다. 핀치하면 콘텐츠가 확대/축소되고, 확대된 상태에서는 양방향으로 스크롤됩니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 가장 작은 배율입니다. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 가장 큰 배율입니다. 최솟값보다 크면 핀치로 확대/축소됩니다. |
| `zoomScale` | `.zoom(scale)` | `number` | | prop이 바뀌면 이 배율로 확대/축소됩니다. 그 외에는 사용자가 설정한 배율이 유지됩니다. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | 핀치가 한계를 넘어갈 수 있으며 이후 원래대로 되돌아옵니다. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | 사용자가 핀치로 확대/축소할 수 있습니다. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | 뷰포트보다 작은(축소된) 콘텐츠를 가운데에 배치합니다. |

스크롤 이벤트는 확대 배율과 확대된 콘텐츠 크기를 보고합니다. 코드에서는 `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })`가 (확대되지 않은 포인트 단위의) 콘텐츠 지점이 뷰포트 중앙에 오도록 확대/축소합니다. 더블 탭으로 확대는 이를 호출하는 press 핸들러로 구현합니다.

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

확대된 스크롤 뷰 안의 텍스트와 캔버스는 확대/축소가 끝나면 새 해상도로 다시 그려지므로, iOS에서도 선명하게 유지됩니다. Android에서는 NSH가 자체 스크롤 뷰로 확대/축소를 처리하며, 핀치의 초점을 중심으로 배율을 조절하고, 손가락 수에 관계없이 팬을 지원하며, 플링과 가장자리 및 확대 한계에서의 러버밴딩을 지원합니다. Android는 시스템의 제스처 감지기와 마찬가지로 손가락이 약 27mm 떨어지면 핀치를 시작합니다.

<a id="scrolling-from-code"></a>

## 코드에서 스크롤하기

스크롤 뷰에 ref를 지정하고(Rust에서는 `element_ref()`와 `.element_ref(&scroller)`, TSX에서는 [`ref`](./jsx-and-components.md)) 해당 메서드를 호출하세요. 명령은 같은 업데이트의 나머지 변경 사항 이후에 실행되므로, 방금 추가한 콘텐츠로 스크롤하는 것도 가능합니다.

| Rust | TSX | 설명 |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 오프셋으로 스크롤합니다. TSX에서는 기본적으로 애니메이션이 적용됩니다. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | 확대/축소 가능한 스크롤 뷰에서 `scale`(한계 내로 고정됨)로 확대/축소하며, 콘텐츠 지점 또는 중앙을 중심으로 합니다. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

리스트는 `scrollToIndex`, `scrollToOffset`, `scrollToEnd`를 추가로 제공합니다. [리스트](./lists.md#scrolling-from-code)를 참고하세요.

<a id="scroll-views-and-the-keyboard"></a>

## 스크롤 뷰와 키보드

NSH는 포커스된 입력 필드가 보이도록 자동으로 유지합니다. 키보드가 나타나면 입력 필드를 감싸는 스크롤 뷰에 키보드 높이만큼의 하단 인셋이 적용되고, 입력 필드가 보이도록 스크롤됩니다. 이는 네이티브에서 처리되며 앱에 코드가 필요하지 않습니다. 하단에 고정된 메시지 바처럼 스크롤 뷰 밖의 콘텐츠에는 `env(keyboard-inset-height)`를 하단 패딩으로 사용하세요([스크롤 뷰 밖의 콘텐츠](./forms-and-keyboard.md#content-outside-scroll-views)).

두 가지 props가 스크롤 및 탭이 키보드와 상호작용하는 방식을 결정합니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 콘텐츠를 드래그할 때 키보드를 숨길지 여부입니다. `"interactive"`는 iOS에서 키보드가 손가락을 따라 내려가게 하며, Android에서는 `"on-drag"`처럼 동작합니다. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | 키보드가 표시된 동안 탭이 하는 일입니다. |

`keyboardShouldPersistTaps`:

- `"never"`: 포커스된 입력 필드 밖을 탭하면 키보드만 숨겨지고, 버튼은 그다음 탭을 받습니다. 사용자는 닫으려고 한 번, 누르려고 한 번 더 탭해야 합니다.
- `"handled"`: 탭을 처리하는 요소(버튼)를 탭하면 그대로 전달되고 키보드는 유지되며, 빈 공간을 탭하면 키보드가 숨겨집니다. 보통 폼에 적합한 선택입니다.
- `"always"`: 모든 탭에도 키보드가 유지됩니다.

두 동작 모두 탭이나 드래그가 발생하는 시점에 코드를 기다리지 않고 네이티브에서 결정됩니다. 코드에서 키보드를 숨기려면 Rust에서는 `dismiss_keyboard()`을, TSX에서는 [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe)의 `Keyboard.dismiss()`을 호출하세요.

<a id="nested-scroll-views"></a>

## 중첩된 스크롤 뷰

세로 스크롤 뷰 안의 가로 스크롤 뷰는 예상대로 동작하며, 각각 자신의 축 방향 드래그를 처리합니다. 같은 축의 스크롤 뷰 두 개도 중첩할 수 있습니다(안쪽 뷰가 먼저 스크롤됩니다). 스크롤 뷰 안의 그리기 캔버스처럼 손가락을 계속 필요로 하는 리스폰더는 주위의 스크롤 뷰로부터 손가락을 가져옵니다. Rust에서는 `.keep_touches(true)`, TSX에서는 `onResponderGrant`에서 반환하는 `true`를 사용하세요. [터치와 제스처](./touch-and-gestures.md#the-responder-system)를 참고하세요.

<a id="related"></a>

## 관련 문서

- [Scroll](../elements/scroll.md): 요소 레퍼런스이며, 모든 prop과 이벤트를 다룹니다.
- [리스트](./lists.md): 동일한 스크롤 props를 사용하는 가상화된 리스트입니다.
- [애니메이션](./animation.md): 애니메이션 값이며, 스크롤 연동 효과를 위한 `interpolate`과 `diffClamp`을 다룹니다.
- [폼과 키보드](./forms-and-keyboard.md): 입력, 포커스, 키보드를 다룹니다.
