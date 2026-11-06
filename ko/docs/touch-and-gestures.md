---
title: "터치와 제스처"
description: "프레스와 프레스 피드백, 히트 영역, 포인터 이벤트, 원시 터치, 응답자 시스템, PanResponder, 그리고 네이티브 팬, 핀치, 회전 제스처를 다룹니다."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# 터치와 제스처

NSH에는 세 가지 수준의 터치 처리가 있습니다. **프레스**(Rust의 `.on_press`, TSX의 `onPress` 및 관련 핸들러)는 버튼, 행, 링크를 다루며 프레스 피드백은 네이티브로 그려집니다. **네이티브 제스처**(팬, 핀치, 회전)는 UI 스레드에서 [애니메이션 값](./animation.md#animated-values)을 움직이므로, 코드가 바쁜 중에도 드래그하는 카드가 손가락을 따라갑니다. **원시 터치와 responder 시스템**(Rust의 `.on_touch`과 `.claim_touches` 및 `.on_responder_*` 핸들러, TSX의 `onTouchStart`, `onResponderMove`, `PanResponder`)은 그리기처럼 나머지 두 수준으로 표현할 수 없는 작업을 위해 모든 손가락의 위치를 코드에 전달합니다.

작업을 해낼 수 있는 가장 높은 수준을 선택하세요. 수준이 높을수록 UI 스레드에서 코드로 넘어오는 작업이 줄어듭니다.

<a id="presses"></a>

## 프레스

모든 요소가 프레스 핸들러를 받을 수 있으며, 별도의 "touchable" 컴포넌트는 없습니다. view, text, image 등 어떤 요소에도 `.on_press` / `onPress`을 지정할 수 있습니다.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | 기본값 | 설명 |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | view 안에서 손가락을 뗐습니다(프레스 후, 롱 프레스가 아닌 경우). |
| `.on_long_press(..)` | `onLongPress` | | 롱 프레스 지연 시간 동안 손가락을 누르고 있었습니다. 이후 프레스 핸들러는 호출되지 않습니다. |
| `.on_press_down(..)` | `onPressDown` | | 프레스가 시작되었습니다. |
| `.on_press_up(..)` | `onPressUp` | | 프레스가 끝났습니다. 손가락을 뗐거나, view 밖으로 미끄러졌거나, 스크롤 view가 가져갔습니다. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | 프레스가 롱 프레스가 되기까지의 시간(밀리초)입니다. |
| `.disabled(..)` | `disabled` | `false` | 프레스를 받지 않고 피드백도 표시하지 않습니다. 비활성화 스타일이 적용되며, 스크린 리더는 비활성화되었다고 읽어 줍니다. |

프레스의 동작 방식:

- **가장 안쪽의 pressable view만 반응합니다.** pressable 버튼을 포함한 pressable 행에서 버튼을 누르면, 행에는 프레스가 전달되지 않습니다.
- **스크롤 view 안에서는 프레스가 시작되기까지(그리고 피드백이 표시되기까지) 약 130ms를 기다립니다.** 따라서 버튼에서 시작한 드래그는 버튼을 누르는 대신 스크롤합니다.
- **미끄러져 벗어나면 취소됩니다.** 손가락이 view 밖으로 나가면 프레스 종료 핸들러가 호출되고 프레스는 발생하지 않습니다.
- **비활성화하면 마운트된 요소에서 프레스 리스너가 제거되므로** view에 피드백이 전혀 표시되지 않고, 비활성화 스타일이 적용됩니다(`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **프레스 핸들러가 있는 중첩 텍스트 span은 링크입니다.** 문단은 하나의 네이티브 view이며, 프레스는 손가락 아래에 있는 span으로 전달됩니다. [Text](./text.md)를 참고하세요.

<a id="press-feedback"></a>

## 프레스 피드백

프레스 피드백은 앱이 정의하는 것으로, view가 눌렸을 때, 호버되었을 때, 포커스를 받았을 때, 비활성화되었을 때 적용되는 스타일입니다. 상태가 바뀌는 즉시 코드로의 왕복 없이 네이티브로 적용됩니다. 각 상태에는 Rust 메서드, TSX 스타일 prop, [Tailwind 변형(variant)](./tailwind.md)이 있습니다.

| Rust | TSX prop | 클래스 | 설명 |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | 눌려 있는 동안. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | 포인터가 위에 있는 동안(데스크톱, iPad 포인터, 브라우저). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | 포커스를 가진 동안. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | view 자신 또는 그 안의 view가 포커스를 가진 동안. 입력을 편집하는 요소를 둘러싼 필드 프레임에 사용합니다. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | 비활성화된 동안. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | 스타일에 더해 적용되는 Android의 머티리얼 리플(`color`, `borderless`, `radius`, `foreground`). |

상태 스타일은 view 자신의 스타일 위에 적용됩니다. 나중 상태가 우선하며(hover, focus, active 순), 비활성화 스타일이 모든 것보다 우선하고, view가 비활성화된 동안에는 나머지 상태 스타일이 적용되지 않습니다.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

테두리 없는 리플은 view 바깥으로 퍼지므로 아이콘 버튼에 적합합니다: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. [Platform-specific code](./platform-specific.md)를 참고하세요.

트랜지션(`.transition()`, `transition` 클래스)을 사용하면 상태 변화가 애니메이션됩니다. `.group()`(`group` 클래스)는 view를 그룹으로 만들고, `.group_active(..)`(`group-active:`)는 그룹이 눌려 있는 동안 자식의 스타일을 지정합니다.

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## 히트 영역: hitSlop

hit slop(`.hit_slop(..)`, `hitSlop`)은 레이아웃을 바꾸지 않고, 터치를 받는 영역을 view의 경계 너머로 확장합니다. 닫기 버튼이나 토글처럼 작은 대상에 사용하세요.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | 설명 |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | 경계 둘레에 추가되는 포인트 값입니다. `EdgeInsets::all(..)`과 TSX의 숫자는 네 변 모두에 적용됩니다. |

확장된 영역은 부모의 경계 안에 두세요(작은 view 주위에 margin이나 padding을 주세요). 히트 테스트는 부모를 거쳐 자식에 도달하므로, 부모 바깥의 터치는 자식의 slop에 닿지 못합니다.

<a id="children-outside-their-parent"></a>

## 부모 밖에 있는 자식

부모의 경계 밖에 놓인 자식(`overflow`로 절대 위치를 지정하고 보이도록 둔 경우, 예를 들어 필드 아래의 드롭다운)은 다른 view와 마찬가지로 그려진 위치에서 터치를 받습니다. NSH는 view 밖으로 뻗은 하위 요소를 네이티브로 히트 테스트합니다. 오버플로를 잘라내는 부모는 이들도 잘라내며, 그 경우 해당 영역에서는 보이지도 터치를 받지도 않습니다. 이 영역은 레이아웃에서 계산되므로, transform으로 부모 밖으로 옮겨진 자식은 부모의 경계 안에서만 터치를 받습니다.

그리기 순서에 유의하세요. 드롭다운은 필드가 형제 요소들보다 뒤에 오거나 더 높은 `z-index`를 가질 때에만 그 형제들 위에 그려지며, 터치는 맨 위에 그려진 요소로 전달됩니다.

## pointerEvents

스타일 키 `pointerEvents`(Rust에서는 `.pointer_events(..)`)은 하위 트리의 어떤 view가 터치의 대상이 될 수 있는지 결정합니다. 히트 테스트 중에 네이티브로 평가되므로 터치마다 비용이 들지 않습니다.

| Rust | TSX | view | 자식 |
|---|---|---|---|
| `PointerEvents::Auto` (기본값) | `"auto"` | 터치를 받음 | 터치를 받음 |
| `PointerEvents::None` | `"none"` | 대상이 되지 않음 | `"auto"`를 지정한 자식이 없으면 대상이 되지 않음: 터치는 뒤에 있는 요소로 통과함 |
| `PointerEvents::BoxNone` | `"box-none"` | 대상이 되지 않음 | 터치를 받음 |
| `PointerEvents::BoxOnly` | `"box-only"` | 터치를 받음 | 대상이 되지 않음 |

대표적인 용도는 다음과 같습니다. 아래에 있는 요소를 막지 않아야 하는 오버레이(none), 빈 공간은 뒤의 콘텐츠로 터치를 통과시키면서 버튼은 계속 동작해야 하는 전체 화면 컨테이너(box-none), 손가락이 자식 위에 닿더라도 프레스를 받아야 하는 행(box-only)입니다.

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"`은 CSS의 `pointer-events`처럼 상속됩니다. 그 안에서 `"auto"`를 지정한 view는 다시 터치를 받습니다. `"box-none"`과 `"box-only"`은 이를 지정한 view에만 적용됩니다. Tailwind 클래스 `pointer-events-none`과 `pointer-events-auto`은 `"none"`과 `"auto"`를 설정하며, 스타일 키로서 `pointerEvents`은 상태 스타일(`activeStyle` 등)과 변형도 받습니다.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## 네이티브 제스처: 팬, 핀치, 회전

화면에서 무언가를 움직이는 드래그, 핀치, 회전에는 [애니메이션 값](./animation.md#animated-values)을 제스처에 바인딩하세요. 플랫폼의 제스처 인식기가 UI 스레드에서 값을 쓰고, 그 값에 바인딩된 view는 같은 프레임에서 움직입니다. 코드는 제스처가 시작되고 끝날 때 알림을 받습니다.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | 설명 |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | 한 손가락 드래그가 이 값들을 포인트 단위로 움직입니다. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | 두 손가락 핀치가 `scale`(배율)를 구동합니다. |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | 두 손가락 회전이 `angle`을 도(degree) 단위로 구동합니다. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | 드래그가 시작됨 / 끝남. `PanEvent`가 함께 전달됩니다. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | 핀치가 시작됨 / 끝남. 배율과 속도(`GestureEvent`)가 전달됩니다. |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | 회전이 시작됨 / 끝남. 각도(Rust: `GestureEvent<Radians>`)와 속도가 전달됩니다. |

팬 이벤트에는 이동량(`translation`, `Point`: 시작 이후의 포인트), 속도(`velocity_x` / `velocity_y`, TSX: `velocity`, `Point`: **초**당 포인트), 그리고 그 시점에 바인딩된 값(`value_x` / `value_y`, TSX: `value`, `{ x?, y? }`에 `pan`이 바인딩하는 축이 포함됨)이 들어 있습니다.

네이티브 쪽에서 대신 처리해 주는 것:

- **드래그는 값이 있는 위치에서 이어집니다.** 시작 시점에 값을 읽고 이동량을 더합니다. 아직 애니메이션 중인 값(제자리로 돌아가는 스프링)을 붙잡으면 애니메이션이 그 자리에서 멈춥니다.
- **한 축만 바인딩하면 다른 축은 스크롤에 양보합니다.** 가로 값만 바인딩하면 손가락이 세로보다 가로로 더 많이 움직일 때만 드래그가 시작되므로, 세로 스크롤 view 안의 가로 스와이프 행에서도 세로 스크롤은 계속 동작합니다. 이 판단은 시스템이 제스처를 시작해도 되는지 물을 때 네이티브로 이루어집니다.
- **팬, 핀치, 회전은 같은 view에서 함께 동작합니다.** 하나의 카드를 드래그하고, 핀치하고, 회전하는 일을 동시에 할 수 있습니다.
- **물리 효과를 위한 해제 속도.** 팬 종료 시의 속도는 스프링이나 decay의 속도로 바로 전달할 수 있으며, 값을 이용해 스냅 지점을 고를 수 있습니다.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> 드래그가 무언가를 움직이기만 한다면, responder로 따라가는 대신 애니메이션 값을 제스처에 바인딩하세요. 값을 바인딩하면 앱 코드가 바빠도 드래그가 끊기지 않습니다. responder를 사용하면 모든 이동이 코드로 전달되는 이벤트가 되고, view가 보여 주는 내용도 매번 갱신해야 합니다.

<a id="raw-touches"></a>

## 원시 터치

터치 핸들러는 모든 손가락이 닿고, 움직이고, 떨어질 때마다 이를 보고합니다. 로깅, 커스텀 히트 테스트, 멀티터치 대응에 유용하며, 터치를 점유하지는 않습니다(프레스와 스크롤 view는 계속 동작합니다).

Rust에서는 `.on_touch(..)`이 모든 단계를 `TouchEvent`로 받습니다. 여기에는 `phase`(`TouchPhase::Start`, `Move`, `End`, `Cancel`), `timestamp`, `points`이 있고, 닿아 있는 모든 손가락이 포함되며, 각 손가락에는 `id`, 손가락이 처음 닿은 view에서의 `location`, 서피스에서의 `page` 위치가 있고, 이벤트와 관련된 손가락에는 `changed`가 있습니다. TSX에서는 각 단계에 별도의 핸들러가 있습니다.

| TSX | 설명 |
|---|---|
| `onTouchStart` | view 위 또는 그 안에서 손가락이 닿았습니다. |
| `onTouchMove` | 손가락이 움직였습니다. 이동 이벤트는 엔진 턴마다 병합됩니다. |
| `onTouchEnd` | 손가락이 떨어졌습니다. |
| `onTouchCancel` | 시스템이 터치를 가져갔습니다(스크롤 view가 스크롤을 시작했거나 전화가 왔을 때). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | 위와 같지만, 버블링 핸들러보다 먼저 바깥쪽에서 안쪽으로 호출됩니다. |

각 TSX 핸들러는 `GestureResponderEvent`를 받습니다.

| 필드 | 설명 |
|---|---|
| `identifier` | 손가락이 닿아 있는 동안 해당 손가락을 식별합니다. |
| `locationX`, `locationY` | 손가락이 처음 닿은 view에서의 위치(`target`). |
| `pageX`, `pageY` | 서피스에서의 위치. |
| `target` | 손가락이 처음 닿은 view의 id. |
| `timestamp` | 밀리초. |
| `touches` | 닿아 있는 모든 손가락. |
| `changedTouches` | 이 이벤트와 관련된 손가락. |
| `nativeEvent` | 이벤트 자체이므로 `e.nativeEvent.locationX`도 동작합니다. |
| `stopPropagation()` | 더 바깥쪽 view는 이 터치 이벤트를 받지 못합니다. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### view의 위치 확인: measure

터치의 위치는 손가락이 처음 닿은 view를 기준으로 하며, 그 view는 실제로 관심 있는 view의 자식(예: 슬라이더의 노브)일 수 있습니다. view를 측정하면 그 위치를 알 수 있으므로 페이지 위치를 대신 사용할 수 있습니다. Rust에서는 view에 `element_ref()`을 지정하고 그 `measure()`를 await하며, TSX에서는 ref에서 `measure()`를 호출합니다.

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

이 호출은 지금까지의 변경 사항이 레이아웃된 뒤에 결과를 반환합니다. Rust에서는 `Measurement`(`frame`은 레이아웃 핸들러가 보고하는 부모 안에서의 프레임이고, `page`는 왼쪽 위 모서리)로, TSX에서는 `{ bounds, pagePosition }`로 반환합니다. 모서리 좌표는 서피스 기준이거나, view가 다이얼로그 안에 있으면 그 다이얼로그 기준이며, 터치의 페이지 위치와 같은 좌표계입니다. 주변 스크롤 view와 리스트의 오프셋은 반영되지만, transform(애니메이션 포함)은 반영되지 않습니다. 화면에 없는 view에 대해서는 `None` / `null`을 반환합니다.
<a id="the-responder-system"></a>

## 응답자 시스템

코드가 터치 시퀀스를 직접 소유해야 할 때(손가락으로 그리기, 커스텀 슬라이더, 네이티브 인식기가 제공하지 않는 제스처) 제스처 응답자 시스템을 사용합니다. 한 번에 하나의 뷰만 **응답자(responder)**가 되어 이동 이벤트를 받으며, 어떤 뷰가 응답자가 될지는 뷰들끼리 협상합니다.

응답자가 되는 과정:

| Rust | TSX | 설명 |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` (`true` 반환) | 손가락이 닿을 때 대상에서 바깥쪽으로 향하며 질의됩니다. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` (`true` 반환) | 응답자가 없는 동안(또는 응답자를 넘겨받기 위해) 이동할 때마다 질의됩니다. |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | 위와 같지만 바깥쪽에서 안쪽으로, 버블링 방식보다 먼저 질의됩니다. 부모는 이를 사용해 자식에게서 터치를 가져옵니다. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | 이동 버전입니다. |

요청(claim)은 별도로 묻지 않는 한 사용자의 코드를 실행하지 않고 뷰만으로 결정됩니다. 묻는 경우는 다음과 같습니다. `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)`은 리스너가 `r.claim()` 호출 시 지금까지의 제스처(`r.event.gesture`)를 기준으로 결정하여 요청합니다. TSX 핸들러는 제스처를 두 번째 인자 `gestureState`로 받으며, [PanResponder](#panresponder)와 동일한 필드(`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`)를 가집니다. 가로 이동만 요청하는 스와이프: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. 이 결정은 여전히 이동 한 번만큼 늦게 이루어지므로 주변 스크롤 뷰가 먼저 스크롤을 시작할 수 있습니다. 스크롤 뷰 안의 드래그에는 [팬 활성화](#pans-inside-scroll-views-panactivation)를 사용하세요.

응답 중일 때:

| Rust | TSX | 설명 |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | 이 뷰가 이제 응답자입니다. Rust에서는 기본적으로 네이티브 스크롤 뷰가 터치를 가져가지 못하게 합니다(`TouchClaim::block_native(false)`를 사용하면 허용). TSX에서는 이를 위해 `true` 값을 반환합니다. |
| `.on_responder_reject(..)` | `onResponderReject` | 다른 뷰가 응답자이며 넘겨주지 않았습니다. |
| `.on_responder_start(..)` | `onResponderStart` | 다른 손가락이 닿았습니다. |
| `.on_responder_move(..)` | `onResponderMove` | 손가락이 이동했습니다. |
| `.on_responder_end(..)` | `onResponderEnd` | 손가락을 뗐습니다. |
| `.on_responder_release(..)` | `onResponderRelease` | 마지막 손가락을 뗐습니다. 제스처가 끝났습니다. |
| `.keep_touches(true)` | `onResponderTerminationRequest` (`false` 반환) | 다른 뷰가 터치를 원할 때 호출되며, 터치를 유지할 수 있습니다(기본적으로는 넘겨줍니다). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | 다른 뷰 또는 네이티브 제스처가 터치를 가져갔습니다. |

Rust 컴포넌트의 응답자는 CSS의 `:active` 상태가 버튼을 놓을 때까지 유지되는 것처럼, 손가락이나 포인터가 어디로 이동하든 grant부터 터치가 끝날 때까지 눌린 상태로 유지됩니다. 따라서 `.active(..)` 스타일과 그 안의 `group-active:` 클래스는 드래그하는 내내 모양을 유지합니다(밴드 밖으로 끌려 나간 크기 조절 핸들 등).

Rust 핸들러는 `ResponderEvent` 값을 받습니다. 여기에는 손가락이 처음 닿은 뷰 안에서의 `location`, `page` 위치, `timestamp`, 그리고 grant 이후의 `gesture`이 들어 있습니다.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

동작 방식: 터치 또는 응답자 핸들러가 하나라도 있는 뷰는 네이티브로 터치를 수신합니다. 플랫폼은 해당 뷰(및 그 내부)에서 발생한 터치를 수신 중인 뷰의 경로와 함께 보고하고, 협상은 NSH의 Rust 코어에서 실행되어 요청을 질의하고 핸들러를 순서대로 호출합니다. 캡처 핸들러는 가장 바깥쪽 뷰에서 안쪽으로, 나머지는 대상에서 바깥쪽으로 호출됩니다. 여기서 두 가지 결과가 따라옵니다.

- **네이티브 스크롤 뷰와 응답자는 경쟁합니다.** 응답자가 스크롤 뷰를 막고 있는 동안에는 주변 스크롤 뷰가 터치가 끝날 때까지 터치를 받지 않습니다. 네이티브 스크롤 뷰가 먼저 드래그를 시작하면 스크롤 뷰가 이깁니다. 응답자는 terminate 핸들러를, 터치 핸들러는 cancel을 받습니다.
- **모든 이동이 코드에 이벤트로 전달됩니다.** 응답자 기반 드래그의 부드러움은 코드의 속도에 좌우됩니다. 뷰만 움직이는 드래그에는 [바인딩된 값](#native-gestures-pan-pinch-and-rotation)을 사용하는 것이 좋습니다.

## PanResponder

Rust에서는 응답자 이벤트가 이미 제스처를 담고 있습니다. 여기서 `ResponderEvent::gesture` 값은 시작점으로부터의 거리, 속도, 손가락 수를 담은 `PanGesture`입니다. TSX에서는 `nsh`에서 가져온 `PanResponder` 객체가 응답자 시스템을 감싸 동일한 제스처 상태를 추가합니다. 뷰에 `panHandlers` 값을 펼쳐 넣습니다.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

제스처 상태:

| Rust (`PanGesture`) | TSX (`gestureState`) | 설명 |
|---|---|---|
| | `stateID` | 제스처를 식별합니다. |
| `position` | `moveX`, `moveY` | 터치 중심점의 최신 위치(서피스 포인트 단위). |
| `origin` | `x0`, `y0` | 응답자가 부여될 때 중심점의 위치. |
| `delta` | `dx`, `dy` | grant 이후 이동한 거리. |
| `vx`, `vy` | `vx`, `vy` | 속도(초당 포인트). |
| `active_touches` | `numberActiveTouches` | 닿아 있는 손가락 수. |

Rust에서 원시 터치(`.on_touch`)로부터 제스처를 추적하는 방법은 `PanGesture::begin` 및 `PanGesture::update`입니다. TSX 콜백이 받는 값은 `(event, gestureState)`입니다: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` 및 `onShouldBlockNativeResponder`. 마지막 항목의 기본값은 `true`입니다. grant된 PanResponder는 네이티브 스크롤 뷰가 자신의 터치를 가져가지 못하게 합니다.

<a id="pans-inside-scroll-views-panactivation"></a>

## 스크롤 뷰 안의 팬: panActivation

세로 스크롤 뷰 안에서 좌우로 훑는 차트는 가로 드래그를 가져가고 세로 드래그는 스크롤 뷰에 맡겨야 합니다. 시작 시점에 터치를 요청하면 첫 픽셀부터 스크롤이 막히고, 코드에서 이동을 보고 결정하면 너무 늦습니다. 코드가 응답하는 시점에는 이미 스크롤 뷰가 터치를 가져갔을 수 있기 때문입니다. 팬 활성화(`TouchClaim::on_pan(..)`, `panActivation`)를 사용하면 손가락이 움직이는 동안 플랫폼이 메인 스레드에서 이를 결정하게 할 수 있습니다:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | 설명 |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | 손가락이 닿은 지점에서 해당 축을 따라 이 값보다 더 멀리 이동하면 팬이 활성화됩니다(양방향, 포인트 단위). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | 손가락이 먼저 이 값보다 더 멀리 이동하면 팬이 실패하며, 스크롤 뷰가 터치를 유지합니다. |

`PanActivation::horizontal(active, fail)` 및 `PanActivation::vertical(active, fail)` 사용 시 일반적인 쌍이 설정됩니다. 활성 오프셋이 없으면 팬은 어느 방향으로든 10포인트 이동한 뒤 활성화됩니다. 활성화되기 전까지 주변 스크롤 뷰는 팬을 기다리며(iOS), 해당 뷰의 다른 요청(claim)은 질의되지 않습니다. 팬이 활성화되면 스크롤 뷰는 더 이상 이 터치를 가져갈 수 없고 해당 뷰가 응답자가 됩니다(grant 후 이동 이벤트). 팬이 실패하면 스크롤 뷰가 평소처럼 스크롤합니다. TSX에서는 `PanResponder`의 `panHandlers`도 함께 동작합니다. prop 옆에 펼쳐 놓으면 되며, 활성화 시점에 실행되는 것은 `onPanResponderGrant`입니다.

> [!NOTE]
> 모든 속도는 초당 포인트 단위입니다. 응답자 제스처의 `vx` / `vy`, 팬의 속도, 스프링과 decay의 속도가 모두 해당하므로, 스프링이나 decay에는 `vx` 값을 그대로 전달하면 됩니다.

<a id="why-some-answers-are-props"></a>

## 일부 응답이 prop인 이유

메인 스레드는 사용자의 코드를 기다리지 않습니다. 시스템이 즉시 답을 필요로 할 때(이 팬 제스처를 시작해도 되는지, 이 지점이 뷰에 히트되는지, 이 탭이 키보드를 닫아야 하는지) NSH는 미리 마운트된 정보를 바탕으로 네이티브에서 답합니다. 여기에는 바인딩된 팬 값(축), 핀치 값, hit slop, 포인터 이벤트, 스크롤 뷰의 키보드 탭 설정, 팬 활성화가 포함됩니다. 핸들러는 일이 일어난 뒤에야 그 사실을 전달받습니다. 이것이 이러한 항목이 콜백이 아닌 선언적 설정인 이유이며, 코드를 실행하는 응답자 협상이 응답자들 사이의 결정만 담당하고 네이티브 제스처를 막지 않는 이유이기도 합니다.

<a id="related"></a>

## 관련 문서

- [`View`](../elements/view.md): 기본 요소의 모든 터치 prop.
- [애니메이션](./animation.md): 제스처 기반 모션을 위한 애니메이션 값, 스프링, decay.
- [스크롤](./scrolling.md): 키보드 탭 설정, 스크롤 뷰, 중첩된 제스처.
- [`PanResponder`](../modules/nsh.md#panresponder): `PanResponder` 레퍼런스.
- [접근성](./accessibility.md): 눌 수 있는(pressable) 뷰는 접근성 요소입니다. role과 label을 지정하세요.
