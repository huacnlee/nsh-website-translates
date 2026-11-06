---
title: "레이아웃"
description: "열(column)이 기본값인 Flexbox, CSS 그리드, 크기와 백분율, 종횡비, 절대 위치 지정, onLayout을 이용한 측정, 반응형 레이아웃과 오른쪽에서 왼쪽(RTL) 방향 지원을 Rust와 TSX로 설명합니다."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# Layout

NSH는 [Taffy](https://github.com/DioxusLabs/taffy)로 모든 요소의 레이아웃을 계산합니다. Taffy는 CSS flexbox, grid, block 레이아웃을 Rust로 구현한 라이브러리이며, 기본적으로 자식을 세로로 쌓고 축소하지 않도록 설정되어 있습니다. 레이아웃은 코드의 각 턴이 끝난 뒤 코어에서 실행되고, 변경된 프레임만 네이티브 뷰로 전달됩니다. 텍스트는 같은 스레드에서 플랫폼의 텍스트 엔진이 측정하므로, 레이아웃이 메인 스레드를 기다리지 않습니다.

아래의 레이아웃 속성은 모두 스타일 속성입니다. Rust에서는 타입이 지정된 스타일 메서드(`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`)로, TSX에서는 `style` prop의 키로 사용하며, 각 속성에는 [Tailwind](./tailwind.md) 클래스(`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...)가 있습니다. 둘 다 동일한 네이티브 스타일로 변환됩니다.

## Flexbox

뷰는 flexbox로 자식을 배치합니다. `display` 설정이 없는 뷰는 자식을 열(column)로 쌓습니다. 스타일에 `display: "flex"`가 있으면 `flexDirection`가 설정되지 않은 한 행(row)이 되며, 이는 CSS 및 Tailwind의 `flex` 클래스와 같습니다. 아무것도 설정하지 않은 경우 다음 기본값이 적용됩니다.

| 속성 | NSH 기본값 | 웹 기본값 |
|---|---|---|
| `flexDirection` | `"column"` (`display` 설정이 없는 뷰); `display: "flex"` 설정 시 `"row"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (그리드: `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| 속성 | 값 | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | 주축: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | 교차축: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | 자식 하나의 교차축 정렬; `"auto"` 값은 부모의 `alignItems` 설정을 따름 | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | 줄바꿈 컨테이너의 줄 정렬 | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | 단일 숫자 단축 표기(아래 참조) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | CSS와 동일 | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | 자식 사이의 간격 | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)` 및 단계 메서드 `.gap_2()`, `.gap_x_4()`, ... |

다음 속성은 flex 방향을 따릅니다: `flex-start`, `flex-end`. 다음 속성은 CSS와 마찬가지로 쓰기 방향을 따릅니다: `start`, `end` (오른쪽에서 왼쪽 방향일 때 `start`는 오른쪽입니다). `self-start` / `self-end`는 자식 자신의 설정을 나타냅니다.

`flex`는 Tailwind의 `flex-*` 클래스와 마찬가지로 CSS의 단축 속성입니다. 숫자 `n`는 `n`만큼 늘어나고, 1만큼 줄어들며, 기준값 0에서 시작한다는 뜻이므로, `flex: 1`인 형제 요소들(Rust에서는 `.flex_1()`, `flex-1`)은 내용과 관계없이 공간을 균등하게 나눕니다. `"none"`은 `0 0 auto`(뷰가 자신의 크기를 유지함)과 같고, `"auto"`는 `1 1 auto`, `"initial"`는 `0 1 auto`와 같으며, grow, shrink, basis를 각각 풀어서 쓸 수도 있습니다(`"2 0 50%"`, `"1 1 120px"`). 최소 크기의 기본값이 0이므로 `flex: 0`(`0 1 0`)은 `minWidth: "auto"` 설정으로 내용 크기를 유지하지 않는 한 뷰를 0까지 줄입니다.

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

최소 크기의 기본값이 0이므로, 행 안의 `flex: 1` 텍스트는 형제 요소를 밀어내는 대신 줄어들고 줄바꿈됩니다. `minWidth: "auto"` / `minHeight: "auto"`(`min-w-auto` / `min-h-auto`, Rust에서는 `.min_w(auto())`)는 CSS의 자동 최소값입니다. 즉, 줄어드는 아이템은 웹에서와 마찬가지로 내용의 최소 크기, 곧 텍스트에서 가장 긴 단어의 크기에서 멈춥니다.

> [!NOTE]
> `display: "flex"`는 스타일, 클래스(`flex`), Rust(`.flex()`) 모두에서 방향이 설정되지 않은 한 행을 의미합니다: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. `display` 없이도 뷰는 별도 설정 없이 열이 됩니다.

<a id="sizes"></a>

## 크기

| 속성 | 값 | Rust |
|---|---|---|
| `width`, `height` | 포인트, 부모에 대한 백분율(`"50%"`), 또는 `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, 단계 `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | 포인트 또는 백분율; `minWidth` / `minHeight`은 콘텐츠의 최소 크기인 `"auto"`도 가능 | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | 너비를 높이로 나눈 값: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | 포인트 또는 백분율 | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ... 및 단계 `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | 포인트, 백분율, 또는 `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

Rust에서 길이는 타입으로 지정합니다: `px(16.0)`는 16포인트, `relative(0.5)`는 부모의 50%, `auto()`는 `auto`입니다. 단계 메서드는 단계당 4포인트인 Tailwind의 간격 스케일을 따릅니다(`.p_4()`는 16포인트, `.gap_0p5()`는 2포인트).

크기를 지정하지 않으면 뷰는 내용(및 패딩)만큼의 크기가 되며, 기본값 `alignItems: "stretch"`에 의해 부모의 교차축 방향으로 늘어납니다. 백분율은 부모의 크기를 기준으로 합니다(패딩과 마진은 CSS와 마찬가지로 부모의 너비를 기준으로 합니다).

`aspectRatio`는 알려진 한 차원으로부터 다른 차원의 크기를 정합니다.

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

앱 에셋의 이미지는 고유 크기를 가지며, 크기를 지정하지 않으면 그 크기로 배치됩니다([이미지와 에셋](./images-and-assets.md)). 원격 이미지는 로드되기 전까지 크기가 없으므로 크기를 지정해야 합니다.

<a id="grid"></a>

## 그리드

`display: "grid"`(Rust에서는 `.grid()`)은 자식을 CSS 그리드 트랙에 배치합니다.

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| 속성 | 값 | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | CSS 트랙 목록: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, 라인 이름 | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | 암시적으로 생성되는 열과 행의 트랙 | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, 라인 번호 또는 이름: `"content-start / content-end"`, `"2 col"`(`col` 이름의 두 번째 라인), `"span col"`(`col` 이름의 다음 라인까지) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | 라인 번호 또는 이름 | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (라인 번호) |
| `justifyItems`, `justifySelf` | 행 방향으로 아이템이 영역 안에 놓이는 방식: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | 열 방향으로 아이템이 영역 안에 놓이는 방식 | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | 행과 열 방향으로 트랙이 그리드 안에 놓이는 방식 | `.justify_*()` |

템플릿에서는 대괄호로 라인에 이름을 붙이며(라인마다 이름은 하나 또는 여러 개), 아이템은 CSS와 마찬가지로 그 이름으로 배치됩니다(Rust에서는 라인 번호로 배치).

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

그리드에서 `justifyContent`와 `alignContent`의 기본값은 CSS의 `"normal"`입니다. 크기가 `auto`인 트랙은 컨테이너를 채우도록 늘어나므로, 높이가 있고 행 템플릿이 없는 그리드는 그 높이를 행들에 나눠 줍니다. 명시적으로 설정한 값(`"start"`, `"center"`, `"space-between"`, ...)은 CSS에서와 같이 트랙을 배치합니다. 정렬 클래스는 Tailwind CSS가 설정하는 값을 그대로 설정합니다. `content-start`(`align-content: flex-start`)과 `place-content-start`는 트랙을 시작점에 모으고, `content-normal`과 `justify-normal`는 브라우저에서와 마찬가지로 트랙을 늘립니다.

`display: "block"`은 CSS block 레이아웃을 사용하며(자식이 쌓이고 각각 컨테이너 너비만큼 넓어짐), `display: "none"`(`.hidden()`)은 뷰를 레이아웃에서 제거합니다.

<a id="absolute-positioning"></a>

## 절대 위치 지정

`position: "absolute"`(`.absolute()`)은 뷰를 흐름에서 꺼내 `top`, `right`, `bottom`, `left`로 부모를 기준으로 배치합니다.

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

오프셋에는 포인트와 백분율을 사용할 수 있습니다(Rust에서는 `.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)`). `left`와 `right`(또는 `top`과 `bottom`)가 있고 크기가 없는 뷰는 그 사이로 늘어납니다. 나중에 오는 형제 요소가 앞선 요소 위에 그려지며, `zIndex`(`.z_index(n)`)으로 순서를 바꿀 수 있습니다.

<a id="measuring"></a>

## 측정

`onLayout`(`.on_layout(..)`)는 레이아웃이 바뀔 때마다 그 이후에 부모를 기준으로 한 뷰의 프레임을 알려 줍니다.

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

프레임의 단위는 포인트입니다: Rust에서는 `Bounds<Points>`, TSX에서는 `{ bounds }`, 즉 `Bounds`(`{ origin: { x, y }, size: { width, height } }`)입니다. 창 전체의 크기는 Rust에서는 `window()`을, TSX에서는 [`nsh`](../modules/nsh.md#device)의 `windowSize()`를 읽으면 됩니다. 둘 다 회전과 창 크기 조절을 따르며, 이를 읽는 스타일은 창에 따라 변경됩니다.

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Tailwind의 브레이크포인트(`sm:`, `md:`, ...)와 `portrait:` / `landscape:`를 사용하면 코드 없이 같은 결과를 얻을 수 있습니다.

<a id="safe-areas"></a>

## 안전 영역

루트 뷰는 상태 표시줄과 홈 인디케이터 아래까지 화면 전체를 덮습니다. 화면에 안전 영역 인셋만큼 패딩을 주려면 CSS의 `env()`(`paddingTop: "env(safe-area-inset-top)"`, Tailwind에서는 `pt-[env(safe-area-inset-top)]`, Rust에서는 `.p_safe_area()`; [Safe area](../elements/safe-area.md) 참조)을 사용하거나, Rust에서는 `safe_area()`로, TSX에서는 `safeArea()` / `safeAreaInsets()`로 인셋을 읽어 직접 적용하세요. [navigation stack](./navigation.md)의 페이지는 이미 헤더 아래에 놓입니다.

<a id="right-to-left"></a>

## 오른쪽에서 왼쪽(RTL)

앱의 레이아웃 방향은 시스템 언어를 따르며, 뷰의 `direction` 스타일(`"ltr"`, `"rtl"`, `"inherit"`; Rust에서는 `.direction(LayoutDirection::Rtl)`)은 그 하위 트리의 방향을 정합니다. 앱이 오른쪽에서 왼쪽으로 레이아웃될 때는 다음과 같습니다.

- 행은 오른쪽에서부터 배치됩니다.
- `left`과 `right`은 브라우저에서와 마찬가지로 각자의 쪽을 유지하며, 이는 스타일 키와 클래스 모두에 해당합니다: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` 및 `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left`는 왼쪽에 유지됩니다.
- 논리 속성은 방향을 따르며, 인라인 시작은 오른쪽입니다: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"`(클래스로는 `ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start`; Rust에서는 `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ...). `marginHorizontal`와 `paddingHorizontal`은 양쪽을 모두 설정합니다.
- `textAlign: "auto"`이 지정된 텍스트는 오른쪽으로 정렬되고, 네이티브 컨트롤은 좌우가 반전됩니다.

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

언어나 뷰의 방향이 바뀌면 재시작 없이 즉시 적용됩니다. `direction` 스타일을 사용하면 하나의 뷰와 그 자식을 독립된 방향으로 유지할 수도 있습니다. 예를 들어 전화번호를 왼쪽에서 오른쪽으로 표시할 수 있습니다. Android에서 NSH를 임베드하는 앱은 네이티브 컨트롤이 반전되도록 매니페스트에 `android:supportsRtl="true"`을 추가해야 합니다.

<a id="related"></a>

## 관련 문서

- [Styling](./styling.md): 스타일이 결합되는 방식.
- [Scrolling](./scrolling.md)과 [Lists](./lists.md): 화면보다 큰 콘텐츠.
- [Style reference](../modules/style-reference.md): 모든 레이아웃 속성과 그 타입.
