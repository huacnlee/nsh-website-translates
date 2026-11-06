---
title: "성능"
description: "NSH가 앱을 빠르게 유지하는 방법(Rust 앱, 네이티브 런타임, 일괄 처리되는 경계 넘기, 네이티브 애니메이션, 가상화된 목록)과 이것이 여러분의 코드에 의미하는 바, 그리고 헤드리스 환경과 화면에서 성능을 측정하는 방법을 설명합니다."
order: 62
group: tools
source_hash: f8f220699bc54685
---

# 성능

성능은 NSH의 최우선 과제이며, 대부분은 앱이 아니라 프레임워크가 결정합니다. 런타임은 네이티브이고, 각 업데이트는 스레드를 한 번만 넘나들며, 애니메이션과 리스트 가상화는 JS 없이 실행되고, Rust로 작성한 앱은 JS를 전혀 실행하지 않습니다. 이 페이지에서는 NSH가 따르는 규칙, 그 규칙이 Rust와 TSX로 작성하는 코드에 의미하는 바, 그리고 측정 방법을 설명합니다.

<a id="the-rules"></a>

## 규칙

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS는 가능한 한 적게 실행한다

**Rust로 작성한 앱은 처음부터 끝까지 네이티브 코드입니다.** 컴포넌트, 상태, 핸들러가 NSH의 엔진으로 컴파일되며 인터프리터는 실행되지 않습니다([Building with Rust](./rust.md)). 이는 앱을 작성하는 가장 빠른 방법이며, 요구 사항이 높은 비즈니스 로직에 적합한 선택입니다.

TSX 앱에서 QuickJS는 인터프리터입니다. 작고 시작이 빠르지만, 무거운 작업에서는 네이티브 코드보다 훨씬 느립니다. 그래서 NSH에서는 **앱의 코드만 JS입니다.** 반응형 그래프(signal, computed 값, effect), 컴파일된 JSX가 호출하는 렌더러, 레이아웃 엔진, 리스트 가상화, 애니메이션, 그리고 가져오는 모든 모듈은 Rust입니다. 파싱, diff, 레이아웃, 문자열 처리는 네이티브로 수행됩니다.

그 효과는 측정할 수 있습니다. 동일한 카운터 앱을 NSH의 이전 JS 런타임과 네이티브 런타임(릴리스 빌드)에서 비교한 결과입니다.

| | 이전 JS 런타임 | 네이티브 런타임 |
|---|---|---|
| 번들 크기 | 14 KB JS / 19.6 KB 바이트코드 | 886 B JS / 1.7 KB 바이트코드 |
| 번들 평가 | ~390 µs | ~95 µs |
| 탭 한 번의 JS 시간(중앙값) | ~14 µs | ~5 µs |
| 탭 한 번의 커밋 | ~22 µs | ~15 µs |
| 1000행 리스트 스크롤, 리바인딩 프레임당 JS | ~150 µs | ~77 µs |

컴포넌트도 마찬가지입니다. Rust 컴포넌트로 작성한 버튼과 동등한 TSX 버튼을 각각 200개 만든 결과입니다.

| | Rust 버튼: JS / 코어 | TSX 버튼: JS / 코어 |
|---|---|---|
| 첫 프레임(ops) | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| 200개 제목 모두 업데이트(ops) | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

(Apple silicon에서 측정했으며, 두 번째 표는 이전 런타임에서 측정했습니다. 두 표 모두 NSH의 성능 기준선에서 가져왔습니다.)

**코드 작성 시 유의할 점:** 이벤트 핸들러와 computed 값은 가볍게 유지하세요. 무거운 연산(대용량 페이로드 파싱, 키 입력마다 수천 개 항목 정렬 등)은 JIT이 있는 V8이나 JavaScriptCore에 익숙한 경우보다 QuickJS에서 더 많은 비용이 듭니다. 한 번만 수행하고 `computed`에 캐시하거나, 상호작용 경로에서 벗어나도록 옮기세요.

<a id="2-cross-threads-in-batches"></a>

### 2. 스레드는 배치로 넘나든다

앱의 코드는 Rust이든 JS이든 메인 스레드가 아니라 엔진 스레드에서 실행됩니다. 한 턴(예를 들어 이벤트 핸들러 하나와 그것이 바꾸는 모든 것)은 **하나의 커밋**이 됩니다. 런타임이 컴포넌트를 렌더링하고, 레이아웃을 계산하고, diff를 수행하여 네이티브 뷰 연산 배치 하나를 만들며, 이 배치는 **한 번의 이동**으로 메인 스레드에 도달합니다. 뷰마다 브리지 메시지를 보내지 않으며, prop마다 직렬화하지도 않습니다.

**코드 작성 시 유의할 점:** 성능을 위해 쓰기를 한데 모을 필요는 없습니다. 한 핸들러에서 `set`를 열 번 호출해도 Rust와 TSX 모두 커밋은 한 번만 발생합니다. effect와 computed 값이 각 쓰기 뒤마다 실행되지 않고 모든 쓰기를 한꺼번에 보게 하려면 `batch`를 사용하세요.

<a id="3-fine-grained-updates"></a>

### 3. 세밀한 업데이트

컴포넌트는 Rust와 TSX 모두에서 **한 번만** 실행됩니다. 이후에는 signal이 변경될 때 그 signal을 읽는 바인딩만 다시 실행됩니다. 텍스트, 스타일 속성, `when`(`<If>`)의 분기, `each`(`<Each>`)의 행이 그 예입니다. 무엇이 바뀌었는지 알아내기 위해 서브트리 전체를 다시 렌더링하는 일은 없습니다.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**코드 작성 시 유의할 점:**

- 가장 좁은 바인딩만 업데이트되도록, signal은 컴포넌트 최상단이 아니라 사용되는 위치(바인딩 내부, Rust의 `move ||` 클로저, TSX의 JSX 표현식, 그리고 `computed`과 `effect` 안)에서 읽으세요.
- 컬렉션에는 `each` / `<Each>`(키로 행을 유지) 또는 [가상 리스트](./lists.md)를 사용하세요. 전체 컬렉션으로 행을 다시 만드는 방식(Rust의 `dynamic`, JSX의 일반 `.map()`)은 변경될 때마다 모든 행을 다시 생성합니다.
- 여러 바인딩이 값을 사용한다면 `computed`로 파생하여 변경당 한 번만 계산되도록 하세요.

세 개짜리 리스트에 네 번째 항목을 추가하는 경우를 `nsh test --trace`가 보여주는 대로 나타내면 다음과 같습니다.

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

[Reactivity](./reactivity.md)를 참고하세요.

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. 필요하지 않은 것은 보내지 않는다

코어는 변경된 것만 보냅니다. 새 뷰에는 기본 스타일이나 빈 이벤트 마스크가 붙지 않고, 변경되지 않은 스타일과 프레임은 전송되지 않으며, 텍스트 색상이 바뀌어도 텍스트 레이아웃을 다시 계산하지 않습니다. 숫자 하나를 바꾸는 탭은 텍스트 항목 하나만 보냅니다. 이는 `nsh test --trace` 출력(아래)에서 확인할 수 있습니다.

<a id="5-animate-natively"></a>

### 5. 애니메이션은 네이티브로 처리한다

엔진 스레드에서 구동하는 애니메이션(프레임마다 signal에 값을 쓰는 방식)은 프레임마다 커밋 비용이 들고, TSX에서는 JS 호출도 필요하며, 엔진 스레드가 바쁠 때는 끊깁니다. 애니메이션 값([Animation](./animation.md): Rust의 `animated_value`, TSX의 [`nsh`의 애니메이션 API](../modules/nsh.md#animation))은 대신 애니메이션을 네이티브로 실행합니다.

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring`, `decay`은 플랫폼의 UI 스레드에서 프레임 단위로 실행되며, 프레임마다 엔진 스레드에서 수행하는 작업이 없습니다.
- `scroll_value`(`scrollValue`)는 같은 프레임에서 스크롤 오프셋을 애니메이션 값에 기록합니다. 팬(`pan={{ x, y }}`)은 드래그로 뷰를 직접 움직이게 합니다. 코드는 종료 시점에 알림을 받습니다(애니메이션 완료 시, 팬 종료 시에는 속도를 받음).
- `Animated.sequence` / `parallel` / `stagger` / `loop`은 하나의 네이티브 트리로 실행됩니다. 각 단계는 이전 단계가 끝나는 즉시 시작되며, JS를 기다리는 공백이 없습니다.
- `LayoutAnimation.configureNext`는 다음 커밋의 프레임, 삽입, 제거를 네이티브로 애니메이션합니다.

<a id="6-virtualize-long-lists"></a>

### 6. 긴 리스트는 가상화한다

[`List`](./lists.md)는 뷰포트 근처의 행만 유지하고, 셀을 재활용하며, 위치, 열, 스티키 헤더, 가시성(viewability)을 네이티브로 계산합니다. 새 행이 나타나지 않는 스크롤 프레임은 앱의 코드를 전혀 실행하지 않으며 배치도 생성하지 않습니다. 갤러리의 사진 리스트에서 새 행 하나를 바인딩하는 프레임은 연산 4개와 마운트 항목 4개입니다.

**코드 작성 시 유의할 점:**

- `estimated_item_size`(`estimatedItemSize`)에는 실제 행 높이에 가까운 값을 지정하세요.
- 항목별 상태는 행 내부에서 생성한 signal이 아니라 데이터(id를 키로 사용)에 보관하세요. 셀은 다른 항목에 재사용되며, 재사용될 때 행의 위치(`at.index()`, TSX에서는 `item()` / `index()`)가 바뀝니다.
- 행은 가볍게 유지하세요. 행은 재활용될 때마다 한 번 바인딩되므로, 사용자가 스크롤하는 동안 해당 코드가 실행됩니다.
- 스크롤 위치를 따라가는 effect에는 `on_scroll`(`onScroll`) 대신 `scroll_value`(`scrollValue`)를 사용하세요. 스크롤 리스너는 엔진 턴당 최대 한 번의 이벤트를 받지만, 각 이벤트는 여전히 앱의 코드(TSX에서는 JS)를 호출합니다.

<a id="measuring"></a>

## 측정

<a id="headless-50"></a>

### 헤드리스: `--trace`

Rust 테스트에서 `EngineConfig::trace`는 동일한 `perf` 로그 줄을 기록하고 `Headless::observe`는 모든 배치를 볼 수 있습니다([Testing](./testing-and-trace.md#tracing-with-trace)). TSX의 경우 `nsh test --trace`가 이를 출력합니다.

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

확인할 항목은 다음과 같습니다.

- **ops**(JS가 큐에 넣은 연산)와 **mount items**(네이티브 뷰 연산): 이 값들은 결정적입니다. 레이블 하나만 바꿔야 하는 탭이 40개 항목을 만든다면, 업데이트해야 할 뷰를 어딘가에서 다시 생성하고 있는 것입니다.
- **event js**: 핸들러와 그것이 유발한 작업의 JS 비용.
- **commit**: 컴포넌트 렌더링, 레이아웃, diff에 대한 코어의 비용.
- **list js**: 해당 커밋 동안 리스트 행을 바인딩하는 데 쓴 JS 시간.

전체 가이드: [Testing](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### 기기에서: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

TSX 앱의 실제 호스트에서 플랫폼 자체 텍스트 엔진을 사용하여 동일한 커밋 로그 줄을 기록합니다. `NshAppView(trace: true)`과 `new NshView(context, true)`은 임베딩 앱에서 같은 역할을 합니다.

<a id="on-screen-58"></a>

### 화면에서: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(Rust 앱의 `run_app`에서는 `AppOptions { fps: true, .. }`)는 실행 중인 앱 위에 프레임 레이트와 프레임 및 커밋에 드는 비용을 CPU, GPU, 메모리와 함께 표시합니다([macOS: performance monitor](./macos.md#performance-monitor)). Linux와 Windows에서는 `--target linux --fps`과 `--target windows --fps`가 프레임의 각 단계별 시간과 함께 같은 측정값을 초당 한 번 기록하며, `nsh test --target linux --fps -v`(또는 `windows`)는 테스트가 앱을 구동하는 동안 이를 수집합니다.

> [!TIP]
> 단일 측정값은 CPU의 클럭 상태에 크게 좌우됩니다. 방금 휴면에서 깨어난 스레드는 한동안 더 느리게 실행됩니다.
> 같은 머신에서 여러 번 실행한 결과 중 최솟값을 비교하고, 시간 측정에는 릴리스 빌드를 사용하세요.

<a id="reference-numbers"></a>

## 참고 수치

측정 수치, NSH의 기준선, Linux에서 페이지별로 측정한 갤러리 결과는 [성능 보고서](./performance-report.md)에 있습니다.

<a id="checklist"></a>

## 체크리스트

- 언어: 앱 전체 또는 가장 많이 쓰이는 부분을 Rust로 작성하세요([Building with Rust](./rust.md)). TSX는 자주 바뀌거나 런타임에 전달되는 부분에 사용하세요.
- 상호작용: 탭 한 번이 수십 개가 아니라 소수의 마운트 항목만 변경해야 합니다.
- 리스트: 긴 리스트에는 가상 리스트(`virtual_list`, `List`)와 추정 항목 크기를 사용하고, 항목별 상태는 데이터에 두세요.
- 애니메이션: 프레임마다 signal에 쓰지 말고 애니메이션 값을 사용하세요.
- 스크롤 효과: 스크롤 리스너가 아니라 `scroll_value`(`scrollValue`)을 사용하세요.
- 핸들러: 키 입력이나 스크롤 이벤트마다 무거운 작업을 하지 말고, `computed`에 캐시하세요.

<a id="see-also"></a>

## 관련 문서

- [성능 보고서](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md), [Animation](./animation.md), [Reactivity](./reactivity.md)
