---
title: "動畫"
description: "Motions（現成的進場、退場、引起注意及循環動畫，或自訂關鍵影格）、樣式過渡與關鍵影格動畫、支援 timing、spring、decay 及 keyframes 的動畫值、插值、組合動畫、緩動、版面配置動畫，以及哪些內容會在 UI 執行緒上運行，涵蓋 Rust 與 TSX。"
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---


# 動畫

NSH 中的所有動畫都在 UI 線程上執行。你只需用 Rust 或 TSX 描述一次，平台便會逐幀播放（iOS 上使用 Core Animation 和 display link，Android 上由 UI 線程的 animator 負責），無需回呼你的程式碼。繁忙的引擎線程不會令動畫卡頓，而動畫在播放期間亦不會佔用你的任何程式碼。

共有六種工具，由最現成到最靈活排列：

| 工具 | 適用情境 |
|---|---|
| [Motion](#motion) | 會進場、離場、吸引目光或循環播放的視圖：現成的 motion（`fadeInUp`、`shake`、`pulse` 等），或自行編寫、作用於其 opacity 和 transform 的關鍵影格。 |
| [過渡](#transitions) | 應以動畫呈現而非瞬間跳變的樣式變化：顏色、opacity、transform。 |
| [關鍵影格動畫](#keyframe-animations) | 旋轉指示器、脈動的佔位元素、彈跳的提示。 |
| [關鍵影格](#keyframes) | 透過關鍵影格驅動任何動畫值，播放方式與 CSS 相同：offset、每個區段的 easing、迭代次數和方向。 |
| [動畫值](#animated-values) | 任何隨時間由數值驅動的效果：彈簧、手勢、捲動位置、序列。 |
| [版面動畫](#layoutanimation) | 更新後尺寸和位置的變化：項目插入、移除、重新排序，面板展開。 |

## Motion

Motion 會以原生方式，透過關鍵影格移動視圖的 opacity 和 transform。在擁有該視圖的元件中建立一個（Rust 中使用 `motion()`，TSX 中使用來自 `nsh` 的 `createMotion()`），將它綁定到視圖，然後在其上播放現成的 motion 或自訂的 motion。`enter` 會令視圖由 motion 的起點開始並立即播放，使視圖從第一幀起便是進場狀態。

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

一個 motion 每個通道各有一個動畫值：`opacity`（0..1）、`translateX` 和 `translateY`（點）、`rotate`、`rotateX` 和 `rotateY`（度）、`scale`、`scaleX` 和 `scaleY`。它們初始處於靜止狀態（opacity 和 scale 為 1，其餘為 0），並按此順序套用：先平移，再旋轉，最後縮放，皆以視圖的 transform origin 為中心。Motion 本身沒有外觀：它只會移動你已設定樣式的內容。

Motion 只會移動 opacity 和 transform。展開 `m.style` 會設定視圖的 `opacity` 和 `transform`；若要保留自己設定的 opacity，只需綁定各步驟（`transform: m.transform`）。顏色則透過動畫值和 [`interpolate`](#interpolation) 來移動。

| TSX | Rust | 說明 |
|---|---|---|
| `createMotion(options?)` | `motion()` | 所有通道皆處於靜止狀態的 motion。 |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | 指定部分通道的起始值；其餘通道從靜止狀態開始。 |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | 從 `enter` 的起點開始並立即播放；其他選項會改變其時序。`enter` 設定它所移動的通道，歷時 `initial`。 |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | 綁定各通道：`m.style` 是 `{ opacity, transform }`，其 `transform` 為七個步驟的列表（`scale` 已折疊入 `scaleX` 和 `scaleY`）。它們會在視圖的 `translate`、`rotate` 和 `scale` 之後套用；在它們之前加上 perspective，可令 3D 翻轉具有深度：`transform: [{ perspective: 800 }, ...m.transform]`。在 Rust 中，motion 的 transform 會在視圖自身的 transform 之後套用。 |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | 單一通道的動畫值，可用來插值或手動驅動。 |
| `m.play(motion, options?)` | `m.play(spec)` | 播放預設或自訂的 motion；新播放的 motion 會中斷正在播放的。完成後會 resolve 並帶有 `{ finished }`、`true`（Rust 中為 `AnimationEnd`）。 |
| `m.animation(motion, options?)` | `m.animation(spec)` | 同一個 motion 以[複合動畫](#composite-animations)形式提供，不會啟動，可與其他動畫組成序列、錯開或循環。 |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | 即使用戶要求減少動態效果，仍會播放。 |
| `m.stop()` | `m.stop()` | 就地停止。 |
| `m.reset()` | `m.reset()` | 停止並將每個通道還原到靜止狀態。 |

<a id="presets"></a>

### 預設

現成的 motion 是資料：來自 `nsh` 的 `motions`（`motions.fadeInUp` 是 `play("fadeInUp")` 所播放的內容），以及 Rust 中的 `MotionPreset`（`MotionPreset::FadeInUp.spec()`）。距離以點為單位，大小適合控制項和卡片；對於較大的視圖，可縮放 motion 的數值或自行編寫關鍵影格。`swing` 和其他旋轉動作會以視圖的 transform origin 為中心轉動：為擺動的標牌設定 `transformOrigin: "top"`（`.origin_top()`）。

**進場**：它們從隱藏或偏離的狀態開始，最後回到靜止。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | 淡入。 |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | 淡入，並向上升到定位。 |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | 淡入，並向下落到定位。 |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | 淡入，並從左側進入。 |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | 淡入，並從右側進入。 |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | 淡入，並由 90 % 放大。 |
| `popIn` | `MotionPreset::PopIn` | 450 ms | 彈出：由一半大小放大至超過原本大小，然後回穩。 |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | 彈跳進場，兩度過衝。 |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | 從下方向上滑入，不帶淡入（底部面板、toast）。 |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | 從上方向下滑入，不帶淡入。 |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | 繞水平軸翻轉進場。 |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | 繞垂直軸翻轉進場。 |

**離場**：它們從靜止狀態開始，最後隱藏或偏離。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | 淡出。 |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | 淡出，並向上移走。 |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | 淡出，並向下移走。 |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | 向左淡出。 |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | 向右淡出。 |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | 淡出，並縮小至 90 %。 |
| `popOut` | `MotionPreset::PopOut` | 300 ms | 彈出離場：先稍為膨脹，再縮小消失。 |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | 向下滑出畫面，不帶淡出。 |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | 向上滑出畫面，不帶淡出。 |

**引人注意**：它們從靜止狀態開始，也在靜止狀態結束。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | 左右搖晃：密碼錯誤、無效欄位。 |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | 搖頭：較溫和的「不」。 |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | 繞中心擺動：有值得留意的事。 |
| `swing` | `MotionPreset::Swing` | 900 ms | 從頂邊擺動，像招牌一樣。 |
| `pulse` | `MotionPreset::Pulse` | 500 ms | 稍微放大再還原：輕柔的強調。 |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | 像心跳般跳動兩下：讚好、收藏。 |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | 像橡膠般壓扁再拉伸。 |
| `jello` | `MotionPreset::Jello` | 800 ms | 像果凍般晃動。 |
| `tada` | `MotionPreset::Tada` | 900 ms | 先縮小，再邊擺動邊放大：獎勵。 |
| `jump` | `MotionPreset::Jump` | 700 ms | 跳起並以壓扁的姿態着地。 |
| `flash` | `MotionPreset::Flash` | 800 ms | 兩度消失再出現。 |

**循環**：它們會重複播放，直至停止。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | 每次轉一圈，永不停止。 |
| `float` | `MotionPreset::Float` | 1500 ms | 上下浮動，永不停止。 |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | 呼吸：輕微放大並淡化，永不停止。 |
| `sway` | `MotionPreset::Sway` | 1600 ms | 繞中心搖擺，永不停止。 |
| `bob` | `MotionPreset::Bob` | 1000 ms | 像彈跳的球般上下起伏，永不停止。 |
| `glow` | `MotionPreset::Glow` | 2000 ms | 忽明忽暗，永不停止。 |

`play` 接受時序選項，用以覆蓋預設的時序（`m.play("shake", { duration: 300 })`），而預設亦可展開到你自己的 motion 中（`m.play({ ...motions.fadeInUp, duration: 600 })`）。在 Rust 中，修改預設的 spec：`MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`。

<a id="motions-of-your-own"></a>

### 自訂 Motion

自訂的 motion 由每個通道的關鍵影格和一組時序構成（選項與[關鍵影格](#keyframes)相同）。在 TSX 中，可逐個通道編寫關鍵影格（`{ opacity: [0, 1] }`），或像 Web Animations API 那樣寫成影格列表（`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`），每個影格各有 `offset` 和 `easing`。在影格列表中，沒有 offset 的影格會依其在列表中的位置而定；每個通道則跟隨有提及它的影格。角度可以寫成字串（`"45deg"`、`"0.5turn"`）。在 Rust 中，則建構 `MotionSpec`。

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

### 進場與錯開的列表

為每一列設定進場的 motion，其延遲隨索引遞增：同時出現的列會依次進場。請為延遲設定上限，使列表後段新增的列不必久等。

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

Motion 也可以組合：`m.animation(..)` 是以[複合動畫](#composite-animations)形式提供的 motion，不會啟動，因此 `Animated.stagger` 可以原生方式執行一組 motion，並由第一項、最後一項、中心或任何索引起算。請給它們隱藏的 `initial`（或讓它們從 motion 的起點開始），使輪到之前不會顯示任何內容。

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

### 離場

先播放離場動畫，等待完成，再移除視圖。[版面動畫](#layoutanimation)可讓周圍的視圖填補空隙。

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

Motion 會自動遵從用戶的[減少動態效果](#reduced-motion)設定：當用戶要求減少動態效果時，motion 會立即落在終點，不作任何移動。

<a id="transitions"></a>

## 過渡

指明要為哪些屬性製作動畫及其時長（Rust 中使用 `.transition_all().duration(400.0)`，TSX 中使用 `transitionProperty` 和 `transitionDuration`），之後這些屬性的變更便會以原生方式，由畫面上的現有值動畫過渡到新值。

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

| 樣式 | Rust | 類型 | 說明 |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | 要製作動畫的屬性，以逗號分隔：`"all"`、`"colors"`、`"opacity"`、`"transform"`、`"box-shadow"`、`"border-radius"` 等。 |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | 毫秒數（數字），或 CSS 時間。 |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | 開始之前的延遲。 |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | 曲線。 |

會產生過渡的屬性，按組別分類：**顏色**（背景、邊框、外框、陰影和文字顏色，以及漸變色標）、**opacity**、**transform**、**陰影**（`box-shadow`）和**形狀**（圓角半徑和邊框寬度）。CSS 名稱及其 camel-case 形式均可使用（`background-color`、`backgroundColor`、`transform`、`scale` 等）。版面變化則以[版面動畫](#layoutanimation)製作動畫。

使用 Tailwind 時，同樣的效果是 `transition`（顏色、opacity、陰影和 transform）、`transition-all`、`transition-colors`、`transition-opacity`、`transition-transform`、`transition-shadow`，並配合 `duration-*`、`delay-*` 和 `ease-*`。與按下狀態（`.active(..)`、`active:`）結合，便可得到帶動畫的按下狀態：

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

過渡會從畫面上目前的值開始，因此在中途再次更改目標時，動畫會平滑地轉向。

<a id="keyframe-animations"></a>

## 關鍵影格動畫

四個內建的關鍵影格動畫以原生方式執行，預設為永遠重複：`spin`（順時針轉一圈）、`ping`（放大至 2 倍並淡出）、`pulse`（淡至半透明再還原）和 `bounce`（向上跳起其高度的四分之一再着地）。

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

| 樣式 | Rust | 類型 | 說明 |
|---|---|---|---|
| `animationName` | `.animate_spin()`、`.animate_ping()`、`.animate_pulse()`、`.animate_bounce()`、`.animate_none()` 或 `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | 動畫。 |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | 一次迭代的時長。 |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | 開始之前的延遲。 |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | 同 `transitionTimingFunction` | 曲線。 |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | 預設為 `"infinite"`。 |

Tailwind：`animate-spin`、`animate-ping`、`animate-pulse`、`animate-bounce`、`animate-none`。

<a id="animated-values"></a>

## 動畫值

動畫值是存在於 UI 線程上的數字。建立一個（Rust 中使用 `animated_value(..)`，TSX 中使用來自 `nsh` 的 `createAnimatedValue`），將它綁定到樣式，然後為它製作動畫；綁定的視圖會在每一幀跟隨它變化，無需更新。

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

**可綁定的項目：**`opacity`（`.bind_opacity(..)`）；`backgroundColor`、`borderColor`（每一邊）及文字的 `color`（整段文字），透過插值轉換為顏色（`.bind_background(..)`、`.bind_border_color(..)`、`.bind_color(..)`）；`translate`（`[x, y]`，每個軸一個值）、`rotate`（度）和 `scale`（每個軸一個 `[x, y]`，或兩個軸共用一個值）；以及 `transform` 列表的各個步驟：`translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`、`rotateX`、`rotateY` 和 `rotateZ`（`.bind_translate_x(..)`、`.bind_translate_y(..)`、`.bind_scale(..)`、`.bind_rotate(..)` 以度為單位，Rust 中為 `.bind_transform(kind, ..)`）。陰影則以[過渡](#transitions)改變。對焦環或閃現綠色的價格，就是綁定到邊框或文字顏色的顏色插值：

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

動畫值也可驅動 [canvas 繪圖](./canvas.md#driving-drawings-with-animated-values)，並接收捲動偏移量（[`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)）和手勢（[`pan`、`pinch`、`rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)）。

動畫值由綁定它的視圖和建立它的元件共同維持存活，因此無論你的變數如何來去，綁定都會保持連接。請在擁有動畫值的元件中建立它們（若每個實例都需要自己的動畫值，則不要在模組層級建立）。
<a id="animatedvalue-methods"></a>

### AnimatedValue 方法

| TSX | Rust | 說明 |
|---|---|---|
| `set(value)` | `set(value)` | 跳至 `value`,並停止任何動畫。 |
| `stop()` | `stop()` | 在當前位置停止正在執行的動畫;在 TSX 中,會以 `{ value }`(即該處的值)resolve。 |
| `getValue()` | `value()` | 當前值,在值移動的 UI thread 上讀取(會在一個影格內穩定下來):TSX 中為 promise,Rust 中為可 await 的結果。 |
| `setOffset(offset)` | `set_offset(offset)` | 為值所顯示的內容加上 `offset`:binding 看到的是 value + offset,而 `set`、動畫和拖曳移動的是 value。 |
| `flattenOffset()` | `flatten_offset()` | 將 offset 加到值上,並把 offset 設為 0。 |
| `extractOffset()` | `extract_offset()` | 將值移入 offset,並把值設為 0:之後的拖曳會從 0 開始,疊加在上一次拖曳的結束位置之上。 |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`、`timing_with(to, Timing { .. })` | 在 `duration` 毫秒內以動畫過渡至 `to`(預設 300,easing 為 `"easeInOut"`)。 |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | 以彈簧效果移至 `to`(預設:stiffness 170、damping 26、mass 1)。 |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`、`decay_within(velocity, deceleration, (min, max), bounce)` | 由 `velocity`(每秒單位)開始滑行並逐漸減速(預設每毫秒減速 0.998)。設定 `[min, max]` 的 clamp 後,它會在邊界停下,或從邊界彈回並保留 `bounce`(0..1)的速度。 |

每個動畫都會給出一個可 await 的結果,表示動畫是否完成:播放至結尾時為 `true`,被中途停止時(`stop()`、`set()`,或同一個值上的新動畫)為 `false`。在 TSX 中它是 `Promise<{ finished: boolean }>`,在 Rust 中是 `AnimationEnd`,任務可 await 它以取得 `bool`。在移動中的值上啟動新動畫,會平順地中斷舊動畫:沒有指定速度的 spring 或 decay,會沿用值當前的速度繼續。

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

`keyframes` 會像 CSS keyframes 一樣,讓一個值依次經過各個 keyframe:TSX 中為 `value.keyframes(frames, options)`,Rust 中為 `value.keyframes(frames, KeyframeTiming)`(`Animated.keyframes(value, { keyframes, ... })` 和 `Animation::keyframes(..)` 則作為[組合動畫](#composite-animations)的一個步驟)。keyframe 可以是數字(或如 `"90deg"` 的角度字串),與其他 keyframe 平均分佈,也可以是 `{ offset, value, easing }`(Rust 中為 `Keyframe::new(value)`、`Keyframe::at(offset, value)`、`.ease(easing)`)。

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

| 選項 | Rust(`KeyframeTiming`) | 預設值 | 說明 |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | 單次迭代的時間,以毫秒計。 |
| `delay` | `.delay(ms)` | 0 | 第一次迭代之前的延遲。 |
| `easing` | `.easing(easing)` | CSS `ease` | 每個沒有自訂 easing 的區段所用的曲線。 |
| `iterations` | `.iterations(Some(n))`、`.infinite()` | 1 | 迭代次數,或 `"infinite"`。 |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`、`"reverse"`、`"alternate"` 或 `"alternate-reverse"`。 |

它們的播放方式與 CSS 和 Web Animations API 相同:

- easing 作用於每個區段,而非整體:keyframe 的 `easing` 作用於由它開始的區段,而 timing 的 `easing` 則作用於其他所有區段。
- 沒有 offset 的 keyframe 會在相鄰的 keyframe 之間平均分佈;第一個預設為 0,最後一個預設為 1。
- 每次迭代都會先跳至其第一個 keyframe。如果沒有 offset 為 0 的 keyframe,值會由當前位置開始。
- 在 `delay` 期間,值已經處於第一個 keyframe(CSS `animation-fill-mode: backwards`),因此延遲的進場動畫會顯示其第一格,而不是靜止狀態的視圖。這同樣適用於 motion。
- `reverse` 以及 `alternate` 的反向迭代會倒序播放各區段,而每個區段的曲線也會反轉。
- 值會停在最後一次迭代結束的位置。結果會表示它們是否完成:完成時為 `true`,被中途停止時為 `false`。

### Interpolation

`interpolate` 會將一個值透過分段線性區段映射為數字、顏色或角度,並返回一個可供 bind 的新節點。一個值可以驅動多個屬性。在 Rust 中,`interpolate(&input, &output)` 映射為數字,`interpolate_colors(&input, &colors)` 映射為顏色,而 `interpolate_with(&input, output, Interpolation { .. })` 接受 extrapolation 和 easing;在 TSX 中,`value.interpolate({ inputRange, outputRange })` 可接受全部選項。

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

| 選項 | Rust | 說明 |
|---|---|---|
| `inputRange` | input slice | 遞增的輸入停駐點。 |
| `outputRange` | output slice,或 `AnimationOutput` | 每個停駐點對應一個輸出:數字、顏色(`"#rrggbb"`、`"rgba(…)"`、顏色名稱)或角度(`"45deg"`、`"1rad"`)。 |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | 超出輸入範圍時:`"clamp"`(預設)、`"extend"`(延續末端區段)或 `"identity"`(直接傳遞輸入)。 |
| `extrapolateLeft`、`extrapolateRight` | `extrapolate_left`、`extrapolate_right` | 同上,但只針對其中一側。 |
| `easing` | `easing` | 為每個區段塑造曲線。 |

> [!IMPORTANT]
> Interpolation 預設會 **clamp**:超出輸入範圍時,輸出會停留在最接近的一端。因此,把 scroll view 拉過頂部時,與捲動連動的標題會維持在其終點狀態。如果希望線條繼續延伸,請傳入 `extrapolate: "extend"`(`Extrapolate::Extend`)。

<a id="arithmetic-and-diffclamp"></a>

### Arithmetic 與 diffClamp

節點可以用算術運算組合,同樣是原生執行:`a.add(b)`、`a.sub(b)`、`a.mul(b)`、`a.div(b)`、`a.mod(b)`(Rust 中為 `a.modulo(b)`;當 `b` 為正數時結果never為負,例如 0..360 的角度),其中 `b` 是節點或數字。在 TSX 中,`Animated.add`、`subtract`、`multiply`、`divide` 和 `modulo` 是對應的函式形式。

`diffClamp(min, max)`(`diff_clamp`)會追蹤節點的*變化量*,同時保持在 `min..max` 之內。套用在捲動 offset 上,可以做出向上捲動內容時隱藏、一向下捲動就立即返回的標題:

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

使用 `{ snap: true }`(`diff_clamp_with(min, max, DiffClamp::snapping())`)時,如果捲動停止時標題只顯示了一部分,它會完成這個移動:在 UI thread 上以 200 毫秒,穩定至完全顯示或完全隱藏(取較近者)。只有當頁面已捲動至少與標題等高的距離後,標題才會隱藏,因此捲動距離不足的頁面會顯示完整標題。在移動期間再次捲動,會從標題當前的位置接手。

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## 組合動畫

動畫由多個步驟組成(Rust 中為 `Animation`,TSX 中為來自 `nsh` 的 `Animated`),整棵動畫樹都在原生端執行:每個步驟會在上一個步驟結束的一刻於 UI thread 上啟動,中間沒有空隙,也不會執行你的任何程式碼。

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

| TSX | Rust | 說明 |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | timing 步驟。 |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | spring 步驟。 |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`、`Animation::decay_within(..)` | decay 步驟。 |
| `Animated.sequence(list)` | `Animation::sequence(list)` | 逐個依次執行。 |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`、`.stop_together(..)` | 同時執行全部。 |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`、`Animation::stagger_from(ms, StaggerFrom::Center, list)` | 同時執行全部,每個步驟在上一個之後 `ms` 開始,從 `from` 起計:`"first"`(預設)、`"last"`、`"center"`(由中間向外擴散的漣漪效果)或索引(`StaggerFrom::First`、`Last`、`Center`、`Index(i)`)。 |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [keyframes](#keyframes) 的一個步驟。 |
| `Animated.delay(ms)` | `Animation::delay(ms)` | 等待。 |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`、`.reset_before_iteration(..)` | 重複(預設為無限重複;Rust 中為 `None`)。 |

組合動畫具有 `start()`(在 TSX 中也可搭配 callback 和 promise,兩者都會收到 `{ finished }`;在 Rust 中為可 await 的 `bool`;再次呼叫即會重新執行)、`stop()`(在當前位置停止)和 `reset()`(停止,並把各個值還原至動畫開始時的位置)。callback 在整棵動畫樹完成時只會執行一次。

執行中的動畫不會讓它的值保持存活:當擁有這些值的 component(連同其視圖和變數)消失時,無限迴圈會隨之停止,而它的結果是未完成(`false`)。

## Easing

Easing 曲線是資料,由原生端求值:TSX 中為來自 `nsh` 的 `Easing`,Rust 中為 `Easing` enum。

| TSX | Rust | 說明 |
|---|---|---|
| `Easing.linear`、`Easing.ease` | `Easing::Linear`、`Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | 等速;即 CSS 的 `ease`。 |
| `Easing.quad`、`Easing.cubic`、`Easing.poly(n)` | `Curve::Quad`、`Curve::Cubic`、`Curve::Poly(n)` | `t²`、`t³`、`tⁿ`。 |
| `Easing.sin`、`Easing.circle`、`Easing.exp` | `Curve::Sin`、`Curve::Circle`、`Curve::Exp` | 正弦、圓形、指數。 |
| `Easing.back(s?)` | `Curve::Back(s)` | 先向後拉再前進(overshoot 為 `s`,預設 1.70158)。 |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | 帶彈性的 overshoot。 |
| `Easing.bounce` | `Curve::Bounce` | 在結尾處彈跳。 |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | 三次 Bézier,與 CSS 相同。 |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | 在 `count` 個層級之間跳躍而非連續移動,如同 CSS 的 `steps()`:逐格的 sprite、滴答走動的指針。`position` 可為 `"jump-end"`(預設,亦可寫作 `"end"`)、`"jump-start"`(`"start"`)、`"jump-none"` 或 `"jump-both"`。 |
| `Easing.in(e)`、`Easing.out(e)`、`Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`、`EaseMode::Out`、`EaseMode::InOut` | 這些曲線都是「in」曲線;`out` 和 `inOut` 會將它們反轉。 |

在 TSX 中,凡是接受 easing 的地方,你也可以傳入名稱(`"linear"`、`"ease"`、`"easeIn"`、`"easeOut"`、`"easeInOut"`)或 Bézier 陣列 `[x1, y1, x2, y2]`;在 Rust 中,`Easing::EaseIn`、`Easing::EaseOut` 和 `Easing::EaseInOut` 是 CSS 曲線。

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

`Easing.sample(easing, count)`(Rust 中為 `sample_easing`)會返回曲線在 0 至 1 之間 `count` 個等距點上的值,而 `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)`(`sample_spring`、`sample_decay`)則返回 spring 或 decay 由 `config.from`(0)開始直至結束為止所經過的值,每個影格一個(預設每秒 60 個)。它們由動畫所用的同一套原生程式碼計算,因此曲線的圖表所顯示的,正是動畫實際的行為:

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

Layout animation 會以原生方式為**下一次**更新中的 frame 變化加上動畫:移動或改變大小的視圖會平滑過渡至新的 frame,新視圖會淡入(或縮放進場),被移除的視圖會淡出。請在狀態變更之前呼叫:Rust 中為 `animate_layout(..)`,TSX 中為 `LayoutAnimation.configureNext(config)`。

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

| TSX | Rust | 說明 |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 為下一次 commit 的變化加上動畫;在 TSX 中,完成時會執行 `onEnd`。 |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | 三個階段共用同一條曲線的設定。 |
| `Presets.easeInEaseOut`、`Presets.linear`、`Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`、`LINEAR`、`SPRING` | 現成的設定。 |
| `easeInEaseOut(onEnd?)`、`linear(onEnd?)`、`spring(onEnd?)` | 搭配 preset 的 `animate_layout` | 搭配 preset 的 `configureNext`。 |
| `Types`、`Properties` | `LayoutCurve`、`LayoutProperty` | 名稱,用於建立設定。 |

設定為 `{ duration, create?, update?, delete? }`(Rust 中為 `LayoutAnimation { create, update, delete }`):`create` 用於新插入的視圖,`update` 用於移動或改變大小的視圖,`delete` 用於被移除的視圖。每個階段為 `{ type?, property?, duration?, delay?, springDamping? }`(`LayoutTransition { curve, property, duration_ms, delay_ms }`),其中 `type` 可為 `"easeInEaseOut"`、`"spring"`、`"linear"`、`"easeIn"`、`"easeOut"` 或 `"keyboard"`(軟鍵盤自身的曲線,從鍵盤開始移動時起計時,讓為鍵盤騰出空間的內容與它一起移動;`LayoutCurve::Keyboard`),`property` 是出現和消失的視圖所播放的動畫屬性(`"opacity"`、`"scaleXY"`、`"scale"`),而 `springDamping`(0..1,預設 0.7;`LayoutCurve::Spring { damping }`)則設定 spring 的 overshoot。

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

Layout animation 涵蓋該次更新所改變的每一個 frame,不論在畫面何處:在同一次更新中刷新的列表或到達的即時資料,也會一併移動。在 Rust component 中,請用 `ElementRef::animate_layout(transition)` 只為某個元素的變化所帶動的部分加上動畫:該元素自身的 frame 及其內容的 frame,以及因其尺寸變化而被推動的視圖(其同級視圖及它們的內容,直至畫面邊緣)。該次更新中的其他 frame 則會即時改變。`nsh/base` 的 `Collapsible` 和 `AccordionPanel` 就是以這種方式展開其內容。

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

## 各項在哪裏執行

| | 執行位置 | 每個影格執行的程式碼 |
|---|---|---|
| Transition、keyframe 動畫 | UI thread | 無 |
| Motion、keyframes、`timing` / `spring` / `decay`、組合動畫 | UI thread | 無;你的程式碼會在動畫結束時收到通知 |
| `interpolate`、arithmetic、`diffClamp` | UI thread | 無 |
| `scrollValue`、`pan` / `pinch` / `rotation` | UI thread | 無;你的程式碼會在開始和結束時收到通知 |
| Layout animation | UI thread | 無 |
| `requestAnimationFrame` 迴圈(Rust 中為 `request_animation_frame`)、`onScroll` handler、`PanResponder` | 你的程式碼,然後更新 | 每個影格 |

只有在無法預先描述的情況下(例如在你的程式碼中執行的物理模擬),才使用 `requestAnimationFrame`(TSX 中為全域函式,與顯示器同步)。凡是可以用 animated value 表達的,都應該使用 animated value。

<a id="reduced-motion"></a>

## 減少動態效果

當用戶要求減少動態效果時(iOS 的「Reduce Motion」、Android 的「Remove animations」),Rust 中的 `reduce_motion()` 和 TSX 中來自 `nsh` 的 `reduceMotion()` 為 `true`,同時 `motion-reduce:` / `motion-safe:` Tailwind variant 會生效。

[Motion](#motion) 會自行遵從此設定:`play` 和 `enter` 會立即到達 motion 的終點而不產生移動,而結果為已完成(`true`),與播放完畢的 motion 一樣。退場動畫仍然以隱藏狀態結束,進場動畫仍然以靜止狀態結束。對於帶有用戶需要的意義的 motion(例如進度轉圈),請傳入 `ignoreReduceMotion: true`(Rust 中為 `play_ignoring_reduce_motion`)。

Transition、keyframe 動畫、animated value、keyframes 和組合動畫會照原樣播放;請用以下方式選擇較平靜的替代方案:

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

參閱 [Accessibility](./accessibility.md#reduced-motion)。

<a id="related"></a>

## 相關內容

- [`nsh` 的動畫 API](../modules/nsh.md#animation):TSX 參考。
- [Touch and gestures](./touch-and-gestures.md):以手指驅動 animated value。
- [Scrolling](./scrolling.md#scroll-linked-effects-scrollvalue):`scrollValue`。
- [Canvas](./canvas.md#driving-drawings-with-animated-values):繪圖中的 animated value。
- [Style reference](../modules/style-reference.md):`transition*` 和 `animation*` 鍵。
