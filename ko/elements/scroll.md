---
title: "스크롤"
description: "네이티브 스크롤 뷰: 세로 및 가로 스크롤, 페이징과 스냅, 당겨서 새로고침, 확대/축소 및 스크롤 이벤트."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# 스크롤

`Scroll`는 네이티브 스크롤 뷰입니다(iOS와 Mac Catalyst에서는 UIScrollView, Android에서는 ScrollView). 모든 자식을 콘텐츠로 배치하고 네이티브로 스크롤합니다. 스크롤, 플링, 바운스, 스냅은 플랫폼에서 디스플레이 주사율에 맞춰 실행됩니다. Rust에서는 `scroll()`로, TSX에서는 `nsh`의 `<Scroll>`으로 만듭니다.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

스크롤 뷰는 모든 자식을 생성하므로 적당한 크기의 페이지에 적합합니다. 길거나 끝이 없는 데이터에는 [list](./list.md)를 사용하세요. list는 뷰포트 근처의 행만 생성하고 재활용합니다.

스크롤 뷰는 스크롤 축 방향으로 크기가 정해져 있어야 합니다. `flex: 1`(`.flex_1()`)를 지정하거나, 크기가 정해진 컨테이너 안에서 높이를 지정하세요. 콘텐츠는 스크롤 뷰의 너비(가로 스크롤일 때는 높이)에 맞춰 배치되며, 세로(가로) 길이는 필요한 만큼 늘어납니다.

## Props

[공통 props](./index.md#common-props)에 더해 다음 props를 사용할 수 있습니다(`style`는 `ViewStyle` 타입). Rust에서 스크롤 관련 props는 list와 공유하는 `Scrollable` trait의 메서드입니다.

<a id="scrolling"></a>

### 스크롤

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 가로로 스크롤합니다. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 사용자가 스크롤할 수 있습니다. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 스크롤 인디케이터를 표시합니다. 플랫폼 기본 인디케이터를 쓰며, 앱이 테마를 설정한 경우에는 앱의 [기본 제공 바](./scrollbar.md#built-in-bars)를 씁니다. 객체를 지정하면 해당 뷰 전용 테마가 됩니다. 데스크톱과 데스크톱 브라우저에서 가로 스크롤 뷰는 이 값을 유지합니다. 마우스용 스크롤 바이기 때문입니다. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 가장자리를 넘어서 오버스크롤합니다. |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | 뷰포트의 배수 위치에서 멈춥니다. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | 이 길이의 배수 위치에서 멈춥니다(0: 꺼짐). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | 지정한 오프셋에서 멈춥니다. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | `snapToInterval` 사용 시 항목의 어느 지점을 뷰포트에 맞출지 정합니다. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | 플링으로 최대 한 개의 스냅 지점만 이동합니다. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | 플랫폼 기본값 | 플링이 느려지는 속도입니다. 밀리초당 유지되는 속도 비율입니다(`normal` 0.998, `fast` 0.99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | 콘텐츠 주변의 여백입니다. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | 시작 위치입니다. |
| `contentStyle` | 콘텐츠 뷰 자체의 스타일 | `ViewStyle` | | 자식을 감싸며 함께 스크롤되는 뷰의 스타일입니다. `flexGrow: 1`는 콘텐츠를 최소한 뷰포트 높이만큼 늘립니다(가운데 정렬된 빈 상태 화면 등). |
| `contentClass` | 콘텐츠 뷰 자체의 스타일 | `string` | | classes와 같으며, 예: `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 드래그하면 키보드를 내릴지 여부입니다. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | 탭하면 키보드를 내릴지 여부입니다. `never`(탭하면 키보드만 내려감), `always`(키보드 유지), `handled`(탭을 처리하는 대상이 있으면 키보드 유지). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | 스크롤 오프셋(주축)이 전달되는 애니메이션 값으로, 스크롤에 연동되는 애니메이션에 사용합니다. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | `onScroll` 이벤트 사이의 최소 간격(밀리초)입니다(어차피 프레임당 최대 한 번만 발생합니다). |

<a id="pull-to-refresh"></a>

### 당겨서 새로고침

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | 새로고침 스피너를 표시합니다. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | 사용자가 당겨서 새로고침했습니다. 로딩을 시작하고, 끝날 때까지 `refreshing`을 설정하세요. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | 앱이 높이 `height` 포인트의 자체 인디케이터를 그립니다. 플랫폼 스피너는 숨겨지고, `height`에 도달하면 새로고침이 시작되며, 새로고침 중에는 콘텐츠 위에 `height`만큼의 공간을 유지합니다. 높이가 0 이하이면 사용하지 않는 것으로 처리합니다. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | 뷰가 상단을 넘어 당겨진 거리가 전달되는 애니메이션 값입니다(정지 상태에서 0이며 당길수록 커지고, 새로고침 중에는 콘텐츠 위에 유지되는 공간인 `height`(`refreshIndicator` 사용 시)입니다). 앱의 인디케이터에 사용합니다. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

<a id="zooming"></a>

### 확대/축소

`maximumZoomScale`를 `minimumZoomScale`(Rust에서는 `.zoom_range(min, max)`)보다 크게 설정하면 핀치로 콘텐츠를 확대/축소할 수 있습니다. 확대하면 양방향으로 스크롤됩니다. list는 배율을 유지합니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 최소 배율입니다. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 최대 배율입니다. |
| `zoomScale` | `.zoom(..)` | `number` | | 값이 바뀌면 이 배율로 확대/축소합니다. 그렇지 않으면 사용자가 조정한 배율을 유지합니다. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | 핀치로 한계를 넘어설 수 있으며 놓으면 되돌아옵니다. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | 사용자가 핀치로 확대/축소할 수 있습니다. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | 뷰포트보다 작은 콘텐츠(축소된 상태)를 가운데에 배치합니다. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | Payload | 발생 시점 |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | 오프셋이 변경되었을 때입니다(프레임당 최대 한 번, `scrollEventThrottle`보다 자주 발생하지 않음). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | 사용자가 드래그를 시작/종료했을 때입니다. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 드래그 이후의 관성 이동이 시작/종료되었을 때입니다. 새 드래그에 의해 중단된 관성 이동도 `onMomentumEnd`로 끝납니다. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | 스크롤이 멈췄을 때입니다. |
| `onRefresh` | `.on_refresh` | 없음 | 당겨서 새로고침했을 때입니다. |

`ScrollEvent`는 `{ offset: Point; contentSize: Size; size: Size; zoomScale }`입니다(Rust에서는 `offset`, `content_size`, `size`, `zoom_scale`). 오프셋, (확대/축소가 적용된) 콘텐츠 크기, 뷰포트 크기, 확대/축소 배율(뷰가 확대/축소되지 않으면 1)을 담고 있습니다.

> [!TIP]
> 스크롤 위치에 따라 무언가를 움직이려면(줄어드는 헤더, 패럴랙스 이미지 등) `scrollValue`를 네이티브 값에 바인딩하고 스타일에서 보간하세요. 이 방식은 UI 스레드에서 디스플레이 주사율에 맞춰 실행되는 반면, `onScroll`는 앱 코드에서 프레임마다 발생하는 이벤트입니다. [animation](../docs/animation.md)을 참고하세요.

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | Rust | 설명 |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | 지정한 오프셋으로 스크롤합니다. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | `scale`(한계 내로 제한됨)로 확대/축소하며, 콘텐츠 지점(`x`, `y`, 확대/축소 전 기준 포인트)을 뷰포트 중앙에 두거나 중앙 부근을 기준으로 합니다. 예: 더블 탭한 지점을 확대. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## 키보드

스크롤 뷰 안의 입력 요소는 네이티브 방식으로 키보드에 가려지지 않게 유지됩니다. 스크롤 뷰에 하단 인셋이 적용되고, 포커스된 입력 요소로 자동 스크롤됩니다. 스크롤 뷰 밖의 콘텐츠에는 하단 padding 또는 margin에서 [`env(keyboard-inset-height)`](./keyboard.md)를 사용하세요. [폼과 키보드](../docs/forms-and-keyboard.md)를 참고하세요.

<a id="right-to-left"></a>

## 오른쪽에서 왼쪽 (RTL)

가로 스크롤 뷰는 RTL 레이아웃에서 오른쪽 끝에서 시작하며, 콘텐츠가 바뀌어도 오른쪽 끝으로부터의 거리를 유지합니다. 자식은 좌우가 반전되어 배치됩니다.

<a id="platform-notes"></a>

## 플랫폼별 참고 사항

- Android: 당겨서 새로고침은 NSH가 그리며(오버스크롤은 네이티브 유지), `contentInset`는 padding으로 적용되고, `decelerationRate`는 스냅 관성 이동의 동작을 결정합니다.
- Android는 NSH 자체 스크롤 뷰로 확대/축소하며, 이 뷰는 콘텐츠를 왼쪽 위를 기준으로 확대/축소하고 양방향으로 스크롤합니다. 핀치는 Android의 최소 손가락 간격(약 27mm)을 넘은 뒤에 시작됩니다.
- Mac Catalyst(Mac idiom)에서는 NSH가 당기는 동작을 감지하여 자체 스피너를 표시합니다.
- iOS는 확대/축소가 끝나면 텍스트와 캔버스를 확대/축소된 해상도로 다시 그립니다.
