---
title: "애니메이션"
description: "모션(바로 사용할 수 있는 진입, 퇴장, 주목 효과, 반복 효과 또는 직접 만든 키프레임), 스타일 트랜지션과 키프레임 애니메이션, timing, spring, decay, keyframes를 사용하는 애니메이션 값, 보간, 복합 애니메이션, 이징, 레이아웃 애니메이션, 그리고 UI 스레드에서 실행되는 항목을 Rust와 TSX 기준으로 설명합니다."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# 애니메이션

NSH의 모든 애니메이션은 UI 스레드에서 실행됩니다. Rust나 TSX에서 애니메이션을 한 번 기술하면, 플랫폼이 코드를 다시 호출하지 않고 프레임 단위로 재생합니다(iOS에서는 Core Animation과 디스플레이 링크, Android에서는 UI 스레드 애니메이터). 엔진 스레드가 바빠도 애니메이션이 끊기지 않으며, 애니메이션이 실행되는 동안에는 작성한 코드가 전혀 비용을 쓰지 않습니다.

도구는 여섯 가지이며, 바로 쓰기 쉬운 것부터 가장 유연한 것 순서입니다.

| 도구 | 용도 |
|---|---|
| [Motion](#motion) | 나타나거나 사라지거나, 시선을 끌거나, 반복되는 뷰: 준비된 모션(`fadeInUp`, `shake`, `pulse`, ...) 또는 직접 만든 키프레임으로 opacity와 transform에 적용합니다. |
| [트랜지션](#transitions) | 갑자기 바뀌지 않고 애니메이션되어야 하는 스타일 변경: 색상, opacity, transform. |
| [키프레임 애니메이션](#keyframe-animations) | 스피너, 맥박처럼 깜빡이는 플레이스홀더, 튀어 오르는 힌트. |
| [키프레임](#keyframes) | CSS가 재생하는 방식 그대로, 키프레임을 통한 모든 애니메이션 값: 오프셋, 구간별 이징, 반복 횟수, 방향. |
| [애니메이션 값](#animated-values) | 시간에 따라 값으로 구동되는 모든 것: 스프링, 제스처, 스크롤 위치, 시퀀스. |
| [레이아웃 애니메이션](#layoutanimation) | 업데이트 후의 크기와 위치 변화: 항목 삽입, 제거, 재정렬, 패널 확장. |

## Motion

모션은 키프레임을 통해 뷰의 opacity와 transform을 네이티브로 움직입니다. 뷰를 소유한 컴포넌트에서 모션을 만들고(Rust에서는 `motion()`, TSX에서는 `nsh`에서 가져온 `createMotion()`), 뷰에 바인딩한 다음, 준비된 모션이나 직접 만든 모션을 재생합니다. `enter`는 모션이 시작되는 지점에서 뷰를 시작해 즉시 재생하므로, 뷰는 첫 프레임부터 등장합니다.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

모션에는 채널마다 애니메이션 값이 하나씩 있습니다: `opacity`(0..1), `translateX`, `translateY`(포인트), `rotate`, `rotateX`, `rotateY`(도), `scale`, `scaleX`, `scaleY`. 채널은 정지 상태(opacity와 scale은 1, 나머지는 0)에서 시작하며, 뷰의 transform origin을 기준으로 이동, 회전, 스케일 순서로 적용됩니다. 모션 자체에는 고유한 모양이 없습니다. 스타일을 지정한 대상을 움직일 뿐입니다.

모션은 opacity와 transform만 움직입니다. `m.style`를 spread하면 뷰의 `opacity` 및 `transform`이 설정됩니다. 직접 지정한 opacity를 유지하려면 step만 바인딩하세요(`transform: m.transform`). 색상은 애니메이션 값과 [`interpolate`](#interpolation)로 움직입니다.

| TSX | Rust | 설명 |
|---|---|---|
| `createMotion(options?)` | `motion()` | 모든 채널이 정지 상태인 모션. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | 채널이 시작하는 위치를 지정하며, 나머지 채널은 정지 상태에서 시작합니다. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | `enter`이 시작하는 지점에서 시작해 즉시 재생합니다. 다른 옵션은 타이밍을 변경합니다. `enter`: `initial` 위에 덧씌워 움직일 채널을 설정합니다. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | 채널을 바인딩합니다. `m.style`은 `{ opacity, transform }`이며, `transform`은 일곱 step의 목록입니다(`scale`은 `scaleX` 및 `scaleY`에 합쳐집니다). 이 step들은 뷰의 `translate`, `rotate`, `scale` 뒤에 적용되며, 앞에 perspective를 두면 3D 플립에 깊이감이 생깁니다: `transform: [{ perspective: 800 }, ...m.transform]`. Rust에서는 모션의 transform이 뷰 자체의 transform 뒤에 적용됩니다. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | 한 채널의 애니메이션 값으로, 보간하거나 직접 구동할 수 있습니다. |
| `m.play(motion, options?)` | `m.play(spec)` | 프리셋 또는 직접 만든 모션을 재생합니다. 새로 재생하면 재생 중이던 모션이 중단됩니다. 끝나면 `{ finished }`, `true`와 함께 resolve됩니다(Rust에서는 `AnimationEnd`). |
| `m.animation(motion, options?)` | `m.animation(spec)` | 같은 모션을 시작하지 않은 [합성 애니메이션](#composite-animations)으로 반환하며, 다른 애니메이션과 순차 실행, 스태거, 반복할 수 있습니다. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | 사용자가 모션 줄이기를 요청한 경우에도 재생합니다. |
| `m.stop()` | `m.stop()` | 현재 위치에서 멈춥니다. |
| `m.reset()` | `m.reset()` | 멈추고 모든 채널을 정지 상태로 되돌립니다. |

<a id="presets"></a>

### 프리셋

준비된 모션은 데이터입니다: `nsh`의 `motions`(`motions.fadeInUp`은 `play("fadeInUp")`가 재생하는 모션), 그리고 Rust의 `MotionPreset`(`MotionPreset::FadeInUp.spec()`). 거리는 포인트 단위이며 컨트롤과 카드 크기에 맞춰져 있습니다. 더 큰 뷰에서는 모션의 값을 키우거나 직접 키프레임을 작성하세요. `swing` 및 다른 회전 모션은 뷰의 transform origin을 중심으로 회전하므로, 흔들리는 간판에는 `transformOrigin: "top"`(`.origin_top()`)을 지정하세요.

**진입**: 숨겨지거나 멀리 떨어진 상태에서 시작해 정지 상태로 끝납니다.

| TSX | Rust | 지속 시간 | 설명 |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | 페이드 인합니다. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | 페이드 인하며 아래에서 올라와 제자리에 놓입니다. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | 페이드 인하며 위에서 내려와 제자리에 놓입니다. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | 페이드 인하며 왼쪽에서 들어옵니다. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | 페이드 인하며 오른쪽에서 들어옵니다. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | 90 %에서 커지며 페이드 인합니다. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | 팝인: 절반 크기에서 원래 크기를 넘어설 만큼 커졌다가 안착합니다. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | 두 번 오버슈트하며 튀어 들어옵니다. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | 페이드 없이 아래에서 위로 슬라이드해 들어옵니다(시트, 토스트). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | 페이드 없이 위에서 아래로 슬라이드해 들어옵니다. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | 가로축을 중심으로 뒤집히며 들어옵니다. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | 세로축을 중심으로 뒤집히며 들어옵니다. |

**퇴장**: 정지 상태에서 시작해 숨겨지거나 멀어진 상태로 끝납니다.

| TSX | Rust | 지속 시간 | 설명 |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | 페이드 아웃합니다. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | 페이드 아웃하며 위로 사라집니다. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | 페이드 아웃하며 아래로 사라집니다. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | 왼쪽으로 페이드 아웃합니다. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | 오른쪽으로 페이드 아웃합니다. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | 90 %로 줄어들며 페이드 아웃합니다. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | 팝아웃: 살짝 부풀었다가 줄어들며 사라집니다. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | 페이드 없이 아래로 슬라이드해 화면 밖으로 나갑니다. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | 페이드 없이 위로 슬라이드해 화면 밖으로 나갑니다. |

**주의 끌기**: 정지 상태에서 시작해 정지 상태로 끝납니다.

| TSX | Rust | 지속 시간 | 설명 |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | 좌우로 흔들립니다: 잘못된 비밀번호, 유효하지 않은 필드. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | 고개를 젓듯 흔들립니다: 더 부드러운 거절. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | 중심을 기준으로 꿈틀거립니다: 눈여겨볼 것. |
| `swing` | `MotionPreset::Swing` | 900 ms | 간판처럼 위쪽 가장자리를 축으로 흔들립니다. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | 살짝 커졌다가 돌아옵니다: 부드러운 강조. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | 심장처럼 두 번 뜁니다: 좋아요, 즐겨찾기. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | 고무처럼 찌그러졌다가 늘어납니다. |
| `jello` | `MotionPreset::Jello` | 800 ms | 젤리처럼 출렁입니다. |
| `tada` | `MotionPreset::Tada` | 900 ms | 줄어들었다가 꿈틀거리며 커집니다: 보상. |
| `jump` | `MotionPreset::Jump` | 700 ms | 점프한 뒤 찌그러지며 착지합니다. |
| `flash` | `MotionPreset::Flash` | 800 ms | 두 번 사라졌다가 나타나며 깜빡입니다. |

**반복**: 멈출 때까지 반복됩니다.

| TSX | Rust | 지속 시간 | 설명 |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | 한 바퀴씩 계속 회전합니다. |
| `float` | `MotionPreset::Float` | 1500 ms | 위아래로 계속 떠다닙니다. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | 숨 쉬듯 살짝 커지고 흐려지기를 계속 반복합니다. |
| `sway` | `MotionPreset::Sway` | 1600 ms | 중심을 기준으로 계속 흔들립니다. |
| `bob` | `MotionPreset::Bob` | 1000 ms | 튀는 공처럼 계속 통통 튑니다. |
| `glow` | `MotionPreset::Glow` | 2000 ms | 계속 밝아졌다 어두워집니다. |

`play`은 프리셋 위에 타이밍 옵션을 추가로 받을 수 있고(`m.play("shake", { duration: 300 })`), 프리셋을 spread해 직접 만든 모션에 포함할 수도 있습니다(`m.play({ ...motions.fadeInUp, duration: 600 })`). Rust에서는 프리셋의 spec을 변경하세요: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### 직접 만드는 모션

직접 만드는 모션은 채널별 키프레임과 하나의 타이밍으로 구성됩니다([키프레임](#keyframes)의 옵션). TSX에서는 채널별 키프레임을 작성하거나(`{ opacity: [0, 1] }`), Web Animations API 방식의 프레임 목록(`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`)을 작성하며, 각 프레임에는 `offset` 및 `easing`이 있습니다. 프레임 목록에서 오프셋이 없는 프레임은 목록 내 위치에 따라 정해지는 지점에 놓이며, 각 채널은 그 채널을 명시한 프레임만 따릅니다. 각도는 문자열로 쓸 수 있습니다(`"45deg"`, `"0.5turn"`). Rust에서는 `MotionSpec`를 빌드합니다.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### 진입 효과와 스태거 목록

각 행에 진입 모션을 주되, 인덱스에 비례해 커지는 지연을 둡니다. 함께 나타나는 행이 차례로 들어옵니다. 목록 아래쪽에 추가된 행이 오래 기다리지 않도록 지연에 상한을 두세요.

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

모션은 합성도 가능합니다. `m.animation(..)`은 시작되지 않은 [합성 애니메이션](#composite-animations) 형태의 모션이므로, `Animated.stagger`가 여러 모션을 네이티브로 실행하며, 첫 번째 항목, 마지막 항목, 중앙 또는 임의의 인덱스부터 순서를 셉니다. 차례가 오기 전에는 아무것도 보이지 않도록 숨겨진 `initial`을 지정하세요(또는 모션이 시작하는 지점에서 시작하게 하세요).

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

<a id="exits"></a>

### 퇴장

퇴장 모션을 재생하고, 끝나기를 기다린 다음, 뷰를 제거합니다. [레이아웃 애니메이션](#layoutanimation)을 쓰면 주변 뷰가 빈 공간을 메웁니다.

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

모션은 사용자의 [동작 줄이기](#reduced-motion) 설정을 자동으로 따릅니다. 사용자가 모션 줄이기를 요청하면, 모션은 움직이지 않고 즉시 끝 지점에 도달합니다.

<a id="transitions"></a>

## 트랜지션

애니메이션할 대상과 시간을 지정하면(Rust에서는 `.transition_all().duration(400.0)`, TSX에서는 `transitionProperty` 및 `transitionDuration`), 이후 해당 속성이 변경될 때 화면에 표시된 값에서 새 값까지 네이티브로 애니메이션됩니다.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| 스타일 | Rust | 타입 | 설명 |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | 애니메이션할 대상을 쉼표로 구분: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | 밀리초 단위 숫자 또는 CSS 시간 값. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | 시작 전 지연. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | 곡선. |

트랜지션되는 속성은 그룹별로 다음과 같습니다: **색상**(배경, 테두리, 아웃라인, 그림자, 텍스트 색상, 그라디언트 스톱), **opacity**, **transform**, **그림자**(`box-shadow`), **모양**(border radius와 너비). CSS 이름과 camel-case 형식 모두 사용할 수 있습니다(`background-color`, `backgroundColor`, `transform`, `scale`, ...). 레이아웃 변경은 [레이아웃 애니메이션](#layoutanimation)으로 애니메이션합니다.

Tailwind에서 같은 기능은 다음과 같습니다: `transition`(색상, opacity, 그림자, transform), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`(`duration-*`, `delay-*`, `ease-*` 포함). pressed 상태(`.active(..)`, `active:`)와 결합하면 애니메이션되는 pressed 상태를 만들 수 있습니다.

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

트랜지션은 현재 화면에 표시된 값에서 시작하므로, 도중에 목표를 다시 바꿔도 부드럽게 방향이 전환됩니다.

<a id="keyframe-animations"></a>

## 키프레임 애니메이션

네 가지 내장 키프레임 애니메이션이 네이티브로 실행되며, 기본적으로 무한 반복됩니다: `spin`(시계 방향으로 한 바퀴), `ping`(최대 2배까지 커지며 사라짐), `pulse`(절반 투명도까지 흐려졌다가 복귀), `bounce`(높이의 4분의 1만큼 점프했다가 착지).

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| 스타일 | Rust | 타입 | 설명 |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` 또는 `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | 애니메이션. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | 한 번 반복되는 시간. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | 시작 전 지연. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | 동일: `transitionTimingFunction` | 곡선. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | 기본값: `"infinite"`. |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## 애니메이션 값

애니메이션 값은 UI 스레드에 존재하는 숫자입니다. 값을 만들고(Rust에서는 `animated_value(..)`, TSX에서는 `nsh`에서 가져온 `createAnimatedValue`), 스타일에 바인딩한 뒤 애니메이션하면, 바인딩된 뷰가 업데이트 없이 매 프레임 그 값을 따라갑니다.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**바인딩할 수 있는 것:** `opacity`(`.bind_opacity(..)`); 색상으로의 보간을 통한 `backgroundColor`, `borderColor`(모든 면), 텍스트의 `color`(텍스트 전체)(`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate`(`[x, y]`, 축별 값), `rotate`(도), `scale`(축별 `[x, y]` 또는 양쪽에 하나의 값); 그리고 `transform` 목록의 step: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ`(`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, 도 단위의 `.bind_rotate(..)`, Rust에서는 `.bind_transform(kind, ..)`). 그림자는 [트랜지션](#transitions)으로 바뀝니다. 포커스 링이나 초록색으로 번쩍이는 가격은 테두리 또는 텍스트 색상에 바인딩한 색상 보간입니다.

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

애니메이션 값은 [캔버스 드로잉](./canvas.md#driving-drawings-with-animated-values)도 구동하고, 스크롤 오프셋([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue))과 제스처([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation))도 받습니다.

값은 바인딩된 뷰와 그 값을 만든 컴포넌트에 의해 유지되므로, 변수가 생기고 사라지더라도 바인딩은 연결된 상태를 유지합니다. 애니메이션 값은 그 값을 소유한 컴포넌트 안에서 만드세요(모든 인스턴스에 각자의 값이 필요하다면 모듈 수준에서 만들지 마세요).
<a id="animatedvalue-methods"></a>

### AnimatedValue 메서드

| TSX | Rust | 설명 |
|---|---|---|
| `set(value)` | `set(value)` | 값을 `value` 값으로 즉시 변경하고 진행 중인 애니메이션을 모두 멈춥니다. |
| `stop()` | `stop()` | 실행 중인 애니메이션을 현재 위치에서 멈춥니다. TSX에서는 그 시점의 값인 `{ value }` 값으로 resolve됩니다. |
| `getValue()` | `value()` | 값이 움직이는 UI 스레드에서 읽은 현재 값입니다(한 프레임 안에 확정됩니다). TSX에서는 promise, Rust에서는 await 가능한 응답입니다. |
| `setOffset(offset)` | `set_offset(offset)` | 값이 표시하는 결과에 `offset` 값을 더합니다. 바인딩은 value + offset을 보며, `set`, 애니메이션, 드래그는 value를 움직입니다. |
| `flattenOffset()` | `flatten_offset()` | offset을 value에 더하고 offset을 0으로 만듭니다. |
| `extractOffset()` | `extract_offset()` | value를 offset으로 옮기고 value를 0으로 만듭니다. 이후 드래그는 0에서 시작하며, 마지막 드래그가 끝난 위치 위에서 이어집니다. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | `duration` ms 동안 `to` 값까지 애니메이션합니다(기본값 300, easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | `to` 값까지 스프링 애니메이션합니다(기본값: stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | `velocity`(초당 단위)에서 출발해 관성으로 이동하며 점차 느려집니다(기본 감속은 ms당 0.998). `[min, max]` clamp를 지정하면 경계에서 멈추거나, 속도의 `bounce`(0..1)을 유지한 채 경계에서 튕겨 돌아옵니다. |

각 애니메이션은 끝까지 재생되었는지를 나타내는 await 가능한 응답을 돌려줍니다. 끝까지 재생되면 `true`, 다른 요인이 멈추면 `false`(`stop()`, `set()`, 또는 같은 값에 대한 새 애니메이션)입니다. TSX에서는 `Promise<{ finished: boolean }>`, Rust에서는 `AnimationEnd`이며, 태스크가 `bool` 용도로 await합니다. 움직이는 값에 새 애니메이션을 시작하면 이전 애니메이션이 부드럽게 중단됩니다. 속도를 지정하지 않은 스프링이나 decay는 값의 현재 속도를 이어받습니다.

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

### Keyframes

`keyframes`은 CSS 키프레임이 재생되는 방식으로 값을 키프레임에 따라 재생합니다. TSX에서는 `value.keyframes(frames, options)`, Rust에서는 `value.keyframes(frames, KeyframeTiming)`을 사용합니다(`Animated.keyframes(value, { keyframes, ... })`과 `Animation::keyframes(..)`은 [composite](#composite-animations)의 한 단계로 사용). 키프레임은 숫자(또는 `"90deg"` 같은 각도 문자열)로 다른 키프레임과 균등하게 배치되거나, `{ offset, value, easing }`(Rust에서는 `Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)`)입니다.

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| 옵션 | Rust (`KeyframeTiming`) | 기본값 | 설명 |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | 한 번 반복하는 시간(밀리초)입니다. |
| `delay` | `.delay(ms)` | 0 | 첫 반복 전의 대기 시간입니다. |
| `easing` | `.easing(easing)` | CSS `ease` | 자체 easing이 없는 각 구간의 곡선입니다. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | 반복 횟수 또는 `"infinite"`입니다. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` 또는 `"alternate-reverse"`입니다. |

CSS 및 Web Animations API와 동일하게 재생됩니다.

- easing은 전체가 아니라 각 구간에 적용됩니다. 키프레임의 `easing`은 그 키프레임에서 시작하는 구간에, 타이밍의 `easing`은 나머지 모든 구간에 적용됩니다.
- offset이 없는 키프레임은 인접한 키프레임 사이에 균등하게 배치됩니다. 첫 키프레임의 기본값은 0, 마지막은 1입니다.
- 각 반복은 첫 키프레임으로 점프하며 시작합니다. offset 0에 키프레임이 없으면 값은 현재 위치에서 출발합니다.
- `delay` 동안 값은 이미 첫 키프레임을 유지하므로(CSS `animation-fill-mode: backwards`), 지연된 진입 애니메이션은 정지 상태의 뷰가 아니라 첫 프레임을 보여 줍니다. 이는 motion에도 동일하게 적용됩니다.
- `reverse`과 `alternate`의 역방향 반복은 구간을 거꾸로 재생하며, 각 구간의 곡선도 뒤집힙니다.
- 값은 마지막 반복이 끝난 위치에 머뭅니다. 응답은 끝까지 재생되었는지를 알려 줍니다. 끝까지 재생되면 `true`, 다른 요인이 멈추면 `false`입니다.

### Interpolation

`interpolate`은 값을 구간별 선형 구간을 통해 숫자, 색상 또는 각도로 매핑하고, 바인딩할 수 있는 새 노드를 반환합니다. 하나의 값으로 여러 속성을 구동할 수 있습니다. Rust에서는 `interpolate(&input, &output)`이 숫자로, `interpolate_colors(&input, &colors)`이 색상으로 매핑하며 `interpolate_with(&input, output, Interpolation { .. })`은 extrapolation과 easing을 받습니다. TSX에서는 `value.interpolate({ inputRange, outputRange })`이 이를 모두 받습니다.

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| 옵션 | Rust | 설명 |
|---|---|---|
| `inputRange` | input 슬라이스 | 증가하는 입력 지점입니다. |
| `outputRange` | output 슬라이스 또는 `AnimationOutput` | 지점마다 하나의 출력입니다. 숫자, 색상(`"#rrggbb"`, `"rgba(…)"`, 이름 지정) 또는 각도(`"45deg"`, `"1rad"`)를 사용할 수 있습니다. |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | 입력 범위 밖의 동작입니다. `"clamp"`(기본값), `"extend"`(끝 구간을 계속 연장) 또는 `"identity"`(입력을 그대로 전달)입니다. |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | 위와 같으며, 한쪽에만 적용됩니다. |
| `easing` | `easing` | 각 구간의 곡선을 결정합니다. |

> [!IMPORTANT]
> Interpolation은 기본적으로 **clamp**됩니다. 입력 범위 밖에서는 출력이 가장 가까운 끝값에 머뭅니다. 따라서 스크롤 뷰를 맨 위 너머로 당겨도 스크롤에 연동된 헤더는 끝 상태를 유지합니다. 선이 계속 이어지기를 원하면 `extrapolate: "extend"`(`Extrapolate::Extend`)을 전달하세요.

<a id="arithmetic-and-diffclamp"></a>

### Arithmetic과 diffClamp

노드는 산술 연산으로도 결합할 수 있으며, 이 역시 네이티브로 처리됩니다. `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)`(Rust에서는 `a.modulo(b)`이며, 양수 `b`에 대해서는 음수가 되지 않습니다. 예: 0..360 범위의 각도)이며, `b`은 노드 또는 숫자입니다. TSX에서는 `Animated.add`, `subtract`, `multiply`, `divide`, `modulo`도 함수로서 동일하게 동작합니다.

`diffClamp(min, max)`(`diff_clamp`)은 노드의 *변화량*을 따라가면서 `min..max` 범위 안에 머뭅니다. 스크롤 오프셋에 적용하면 콘텐츠를 위로 스크롤할 때 숨겨지고 아래로 스크롤하는 즉시 다시 나타나는 헤더를 만들 수 있습니다.

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

`{ snap: true }`(`diff_clamp_with(min, max, DiffClamp::snapping())`)을 사용하면, 스크롤이 멈췄을 때 헤더가 일부만 보이는 상태라면 그 동작을 마무리합니다. UI 스레드에서 200 ms 동안 더 가까운 쪽, 즉 완전히 보이거나 완전히 숨겨진 상태로 안착합니다. 헤더는 페이지가 최소한 헤더 높이만큼 스크롤된 뒤에야 숨겨지므로, 그보다 적게 스크롤된 페이지에서는 헤더 전체가 보입니다. 이동 중에 다시 스크롤하면 헤더가 있는 위치에서부터 이어받습니다.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

## Composite animations

애니메이션은 단계(Rust의 `Animation`, TSX에서 `nsh`의 `Animated`)로 구성되며, 전체 트리가 네이티브로 실행됩니다. 각 단계는 이전 단계가 끝나는 순간 UI 스레드에서 시작되며, 사이에 틈이 없고 사용자 코드도 개입하지 않습니다.

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | 설명 |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | timing 단계입니다. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | spring 단계입니다. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | decay 단계입니다. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | 하나씩 차례로 실행합니다. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | 모두 동시에 실행합니다. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | 모두 동시에 실행하되, 각각 이전 항목보다 `ms` 뒤에 시작합니다. 기준은 `from`부터 셉니다. `"first"`(기본값), `"last"`, `"center"`(가운데에서 퍼져 나가는 물결) 또는 인덱스(`StaggerFrom::First`, `Last`, `Center`, `Index(i)`)입니다. |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [keyframes](#keyframes) 단계입니다. |
| `Animated.delay(ms)` | `Animation::delay(ms)` | 대기합니다. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | 반복합니다(기본값은 무한 반복이며, Rust에서는 `None`). |

composite animation에는 `start()`(TSX에서는 콜백과 promise로도 사용할 수 있으며, 둘 다 `{ finished }`을 받습니다. Rust에서는 await 가능한 `bool`이며, 다시 호출하면 다시 실행됩니다), `stop()`(현재 위치에서 멈춤), `reset()`(멈추고 값을 시작 시점의 상태로 되돌림)이 있습니다. 콜백은 전체 트리에 대해 한 번만 실행됩니다.

실행 중인 애니메이션은 값을 살려 두지 않습니다. 값을 소유한 컴포넌트(뷰와 변수)가 사라지면 무한 루프도 함께 멈추며, 그 응답은 끝까지 재생되지 않았다는 값(`false`)입니다.

## Easing

Easing 곡선은 데이터이며 네이티브로 평가됩니다. TSX에서는 `nsh`의 `Easing`, Rust에서는 `Easing` enum을 사용합니다.

| TSX | Rust | 설명 |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | 일정한 속도이며, CSS의 `ease`에 해당합니다. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | 사인파, 원형, 지수 곡선입니다. |
| `Easing.back(s?)` | `Curve::Back(s)` | 출발하기 전에 뒤로 물러납니다(overshoot `s`, 기본값 1.70158). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | 탄성 있게 넘어갔다 돌아옵니다. |
| `Easing.bounce` | `Curve::Bounce` | 끝에서 튕깁니다. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | CSS와 같은 cubic Bézier입니다. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | 움직이는 대신 `count`개의 단계 사이를 점프합니다. CSS `steps()`와 같으며, 프레임 단위 스프라이트나 똑딱거리는 시곗바늘에 사용합니다. `position`은 `"jump-end"`(기본값, `"end"`도 가능), `"jump-start"`(`"start"`), `"jump-none"` 또는 `"jump-both"`입니다. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | 이 곡선들은 "in" 곡선이며, `out`과 `inOut`로 방향을 뒤집을 수 있습니다. |

TSX에서는 easing을 받는 모든 곳에 이름(`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) 또는 Bézier 배열 `[x1, y1, x2, y2]`도 전달할 수 있습니다. Rust에서는 `Easing::EaseIn`, `Easing::EaseOut`, `Easing::EaseInOut`이 CSS 곡선입니다.

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

`Easing.sample(easing, count)`(Rust에서는 `sample_easing`)은 0에서 1까지 균등한 간격의 `count`개 지점에서 곡선 값을 반환하고, `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)`(`sample_spring`, `sample_decay`)는 스프링이나 decay가 거치는 값을 `config.from`(0)부터 끝날 때까지 프레임마다(기본값은 초당 60프레임) 하나씩 반환합니다. 애니메이션이 실행하는 것과 동일한 네이티브 코드로 계산되므로, 곡선 차트는 애니메이션이 실제로 하는 동작을 그대로 보여 줍니다.

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

layout animation은 **다음** 업데이트의 frame 변화를 네이티브로 애니메이션합니다. 이동하거나 크기가 바뀌는 뷰는 새 frame으로 부드럽게 이동하고, 새 뷰는 페이드(또는 스케일) 인되며, 제거되는 뷰는 페이드 아웃됩니다. 상태를 변경하기 직전에 호출하세요. Rust에서는 `animate_layout(..)`, TSX에서는 `LayoutAnimation.configureNext(config)`입니다.

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | 설명 |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 다음 커밋의 변경을 애니메이션합니다. TSX에서는 완료 시 `onEnd`이 실행됩니다. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | 세 단계 모두에 하나의 곡선을 사용하는 config입니다. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | 미리 만들어진 config입니다. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | 프리셋과 함께 `animate_layout` | 프리셋과 함께 `configureNext`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | config를 만들 때 사용하는 이름입니다. |

config는 `{ duration, create?, update?, delete? }`(Rust에서는 `LayoutAnimation { create, update, delete }`)입니다. `create`은 삽입되는 뷰, `update`은 이동하거나 크기가 바뀌는 뷰, `delete`은 제거되는 뷰에 적용됩니다. 각 단계는 `{ type?, property?, duration?, delay?, springDamping? }`(`LayoutTransition { curve, property, duration_ms, delay_ms }`)이며, `type`은 `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` 또는 `"keyboard"`(소프트웨어 키보드 고유의 곡선으로, 키보드가 움직이기 시작한 시점부터 타이밍이 계산되므로 키보드를 위해 공간을 만드는 요소가 키보드와 함께 움직입니다. `LayoutCurve::Keyboard`)입니다. `property`은 나타나거나 사라지는 뷰가 애니메이션하는 대상(`"opacity"`, `"scaleXY"`, `"scale"`)이며, `springDamping`(0..1, 기본값 0.7. `LayoutCurve::Spring { damping }`)은 스프링의 overshoot를 설정합니다.

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

layout animation은 화면 어디에 있든 업데이트가 변경하는 모든 frame에 적용됩니다. 같은 업데이트에서 새로 고쳐지는 목록이나 도착하는 실시간 데이터도 함께 움직입니다. Rust 컴포넌트에서는 `ElementRef::animate_layout(transition)`를 사용해 한 요소의 변화에 따라 움직이는 것만 애니메이션하세요. 요소 자신의 frame과 그 콘텐츠의 frame, 그리고 요소의 크기 때문에 밀려나는 뷰(형제 요소와 그 자손, 화면 끝까지)가 대상입니다. 업데이트의 다른 frame은 한꺼번에 바뀝니다. `nsh/base`의 `Collapsible`과 `AccordionPanel`이 콘텐츠를 드러내는 방식이 이것입니다.

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## 실행 위치

| | 실행 위치 | 프레임당 사용자 코드 |
|---|---|---|
| Transition, keyframe animation | UI 스레드 | 없음 |
| Motion, keyframes, `timing` / `spring` / `decay`, composite | UI 스레드 | 없음. 끝날 때 사용자 코드에 알려 줍니다 |
| `interpolate`, 산술 연산, `diffClamp` | UI 스레드 | 없음 |
| `scrollValue`, `pan` / `pinch` / `rotation` | UI 스레드 | 없음. 시작과 끝을 사용자 코드에 알려 줍니다 |
| Layout animation | UI 스레드 | 없음 |
| `requestAnimationFrame` 루프(Rust에서는 `request_animation_frame`), `onScroll` 핸들러, `PanResponder` | 사용자 코드, 그다음 업데이트 | 매 프레임 |

`requestAnimationFrame`(TSX에서는 디스플레이를 따르는 전역 함수)은 사용자 코드의 물리 시뮬레이션처럼 미리 기술할 수 없는 경우에만 사용하세요. animated value로 만들 수 있는 것은 모두 animated value로 만들어야 합니다.

## Reduced motion

사용자가 모션 줄이기를 요청하면(iOS "동작 줄이기", Android "애니메이션 제거"), Rust의 `reduce_motion()`과 TSX에서 `nsh`의 `reduceMotion()`이 `true`가 되고, `motion-reduce:` / `motion-safe:` Tailwind variant가 적용됩니다.

[Motions](#motion)는 이 설정을 자동으로 따릅니다. `play`과 `enter`은 움직이지 않고 motion이 끝나는 위치로 즉시 이동하며, motion이 재생된 경우와 마찬가지로 끝까지 완료되었다는 응답(`true`)을 돌려줍니다. 퇴장은 여전히 숨겨진 상태로 끝나고, 진입은 여전히 정지 상태로 끝납니다. 진행 표시 스피너처럼 사용자에게 필요한 의미를 담은 motion에는 `ignoreReduceMotion: true`(Rust에서는 `play_ignoring_reduce_motion`)을 전달하세요.

Transition, keyframe animation, animated value, keyframes, composite는 작성한 그대로 재생됩니다. 이를 사용해 더 차분한 대안을 선택하세요.

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

[Accessibility](./accessibility.md#reduced-motion)를 참고하세요.

<a id="related"></a>

## 관련 문서

- [`nsh`의 animation API](../modules/nsh.md#animation): TSX 레퍼런스입니다.
- [Touch and gestures](./touch-and-gestures.md): 손가락으로 animated value를 구동하는 방법입니다.
- [Scrolling](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): 그림에서의 animated value입니다.
- [Style reference](../modules/style-reference.md): `transition*` 및 `animation*` 키입니다.
