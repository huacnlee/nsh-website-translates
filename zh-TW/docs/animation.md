---
title: "動畫"
description: "動態效果(現成的進場、退場、吸引注意與循環動畫,或自訂關鍵影格)、樣式轉場與關鍵影格動畫、搭配 timing、spring、decay 與 keyframes 的動畫數值、插值、複合動畫、緩動、版面配置動畫,以及在 UI 執行緒上執行的內容,適用於 Rust 與 TSX。"
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# 動畫

NSH 中的每個動畫都在 UI 執行緒上執行。你只需要用 Rust 或 TSX 描述一次，平台就會逐影格播放（iOS 上使用 Core Animation 與 display link，Android 上使用 UI 執行緒的 animator），過程中不會回呼你的程式碼。忙碌的引擎執行緒不會讓動畫卡頓，動畫在執行期間也不會消耗你的任何程式碼。

共有六種工具，從最現成到最靈活：

| 工具 | 適用情境 |
|---|---|
| [Motion](#motion) | 讓 view 進場、離場、吸引目光或循環播放：使用現成的動態效果（`fadeInUp`、`shake`、`pulse` 等），或針對其不透明度與 transform 自訂關鍵影格。 |
| [轉場](#transitions) | 讓樣式變更以動畫呈現而非瞬間跳變：顏色、不透明度、transform。 |
| [關鍵影格動畫](#keyframe-animations) | 載入指示器、脈動的佔位元件、彈跳的提示。 |
| [關鍵影格](#keyframes) | 透過關鍵影格驅動任何動畫值，播放方式與 CSS 相同：offset、每段各自的 easing、迭代次數與方向。 |
| [動畫值](#animated-values) | 任何隨時間由數值驅動的內容：彈簧、手勢、捲動位置、序列。 |
| [版面動畫](#layoutanimation) | 更新後的尺寸與位置變化：項目插入、移除、重新排序，面板展開。 |

## Motion

Motion 以原生方式透過關鍵影格移動 view 的不透明度與 transform。在擁有該 view 的元件中建立一個 Motion（Rust 中使用 `motion()`，TSX 中使用來自 `nsh` 的 `createMotion()`），將它繫結到 view，然後在其上播放現成的動態效果或你自訂的動態效果。`enter` 會讓 view 從動態效果的起點開始並立即播放，因此 view 從第一個影格起就是進場狀態。

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

Motion 為每個通道各有一個動畫值：`opacity`（0..1）、`translateX` 與 `translateY`（點）、`rotate`、`rotateX` 與 `rotateY`（度）、`scale`、`scaleX` 與 `scaleY`。它們從靜止狀態開始（不透明度與縮放為 1，其餘為 0），並依下列順序套用：先平移，再旋轉，最後縮放，皆以 view 的 transform 原點為基準。Motion 本身沒有任何外觀：它只會移動你設定好樣式的內容。

Motion 只會移動不透明度與 transform。展開 `m.style` 會設定 view 的 `opacity` 與 `transform`；若要保留你自己的不透明度，請只繫結各個步驟（`transform: m.transform`）。顏色則透過動畫值與 [`interpolate`](#interpolation) 來移動。

| TSX | Rust | 說明 |
|---|---|---|
| `createMotion(options?)` | `motion()` | 所有通道皆處於靜止狀態的 Motion。 |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | 指定通道的起始值；其餘通道從靜止狀態開始。 |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | 從 `enter` 的起點開始並立即播放；其他選項會改變其時間設定。`enter` 設定它所移動的通道，作用於 `initial` 之上。 |
| `style={m.style}`、`m.transform` | `.bind_motion(&m)` | 繫結通道：`m.style` 為 `{ opacity, transform }`，其 `transform` 是由七個步驟組成的清單（`scale` 會併入 `scaleX` 與 `scaleY`）。它們在 view 自身的 `translate`、`rotate` 與 `scale` 之後套用；在它們之前加上 perspective 可讓 3D 翻轉具有景深：`transform: [{ perspective: 800 }, ...m.transform]`。在 Rust 中，Motion 的 transform 會在 view 自身的 transform 之後套用。 |
| `m.opacity`、`m.translateX`、... | `m.value(MotionChannel::Opacity)`、... | 單一通道的動畫值，可進行插值或手動驅動。 |
| `m.play(motion, options?)` | `m.play(spec)` | 播放預設動態效果或你自訂的動態效果；新的播放會中斷正在播放的那個。完成時以 `{ finished }`、`true` 解析（Rust 中為 `AnimationEnd`）。 |
| `m.animation(motion, options?)` | `m.animation(spec)` | 同一個動態效果，以[複合動畫](#composite-animations)的形式呈現且尚未啟動，可與其他動畫組成序列、錯開或循環。 |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | 即使使用者要求減少動態效果，仍會播放。 |
| `m.stop()` | `m.stop()` | 就地停止。 |
| `m.reset()` | `m.reset()` | 停止並將每個通道還原為靜止狀態。 |

<a id="presets"></a>

### 預設動態效果

現成的動態效果都是資料：來自 `nsh` 的 `motions`（`motions.fadeInUp` 就是 `play("fadeInUp")` 所播放的內容），以及 Rust 中的 `MotionPreset`（`MotionPreset::FadeInUp.spec()`）。距離以點為單位，大小適合控制項與卡片；對於較大的 view，請縮放動態效果的數值或自行撰寫關鍵影格。`swing` 與其他旋轉效果都以 view 的 transform 原點為軸心：若要做出擺動的招牌，請設定 `transformOrigin: "top"`（`.origin_top()`）。

**進場**：從隱藏或偏移的狀態開始，結束時處於靜止狀態。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | 淡入。 |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | 淡入，並向上升到定位。 |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | 淡入，並向下落到定位。 |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | 淡入，從左側進來。 |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | 淡入，從右側進來。 |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | 淡入，從 90 % 放大。 |
| `popIn` | `MotionPreset::PopIn` | 450 ms | 彈出：從一半大小放大到超過原尺寸後再穩定下來。 |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | 彈跳進場，過衝兩次。 |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | 從下方滑入，不淡入（sheet、toast）。 |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | 從上方滑入，不淡入。 |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | 繞水平軸翻轉進場。 |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | 繞垂直軸翻轉進場。 |

**離場**：從靜止狀態開始，結束時隱藏或偏移。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | 淡出。 |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | 淡出，並向上飄離。 |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | 淡出，並向下落離。 |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | 向左淡出。 |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | 向右淡出。 |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | 淡出，縮小到 90 %。 |
| `popOut` | `MotionPreset::PopOut` | 300 ms | 彈出離場：先稍微膨脹，再縮小消失。 |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | 向下滑出畫面，不淡出。 |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | 向上滑出畫面，不淡出。 |

**吸引注意**：從靜止狀態開始，並在靜止狀態結束。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | 左右搖晃：密碼錯誤、欄位無效。 |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | 搖頭：較溫和的否定。 |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | 繞中心扭動：有需要留意的內容。 |
| `swing` | `MotionPreset::Swing` | 900 ms | 從上緣擺動，像招牌一樣。 |
| `pulse` | `MotionPreset::Pulse` | 500 ms | 稍微放大再縮回：輕微的強調。 |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | 像心跳一樣跳動兩次：按讚、加入最愛。 |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | 像橡皮一樣擠壓與拉伸。 |
| `jello` | `MotionPreset::Jello` | 800 ms | 像果凍一樣晃動。 |
| `tada` | `MotionPreset::Tada` | 900 ms | 先縮小，再邊扭動邊放大：獎勵。 |
| `jump` | `MotionPreset::Jump` | 700 ms | 跳起並以擠壓姿態落地。 |
| `flash` | `MotionPreset::Flash` | 800 ms | 閃爍消失再出現，共兩次。 |

**循環**：持續重複直到被停止。

| TSX | Rust | 時長 | 說明 |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | 持續不斷地旋轉一圈。 |
| `float` | `MotionPreset::Float` | 1500 ms | 持續不斷地上下漂浮。 |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | 呼吸：持續不斷地稍微放大並淡化。 |
| `sway` | `MotionPreset::Sway` | 1000 ms | 持續不斷地繞中心擺盪。 |
| `bob` | `MotionPreset::Bob` | 1000 ms | 像彈跳的球一樣持續上下彈動。 |
| `glow` | `MotionPreset::Glow` | 2000 ms | 持續不斷地發光、淡去。 |

`play` 可在預設動態效果之上套用其時間設定選項（`m.play("shake", { duration: 300 })`），預設動態效果也可以展開成你自訂的動態效果（`m.play({ ...motions.fadeInUp, duration: 600 })`）。在 Rust 中，請修改預設動態效果的規格：`MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`。

<a id="motions-of-your-own"></a>

### 自訂 Motion

自訂 Motion 由每個通道的關鍵影格與一組時間設定構成（即[關鍵影格](#keyframes)的選項）。在 TSX 中，可以撰寫每個通道的關鍵影格（`{ opacity: [0, 1] }`），或是採用 Web Animations API 的寫法提供影格清單（`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`），每個影格都有其 `offset` 與 `easing`。在影格清單中，沒有 offset 的影格會位於它在清單中的位置所決定之處，而每個通道會依循有指名該通道的那些影格。角度可以使用字串（`"45deg"`、`"0.5turn"`）。在 Rust 中，請建立一個 `MotionSpec`。

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

為每一列指定一個進場的動態效果，並讓延遲隨其索引遞增：同時出現的列就會一個接著一個進場。請為延遲設定上限，這樣新增在列表很後面的列就不必久等。

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

Motion 也可以組合：`m.animation(..)` 是以[複合動畫](#composite-animations)形式呈現、尚未啟動的 Motion，因此 `Animated.stagger` 可以原生地執行一組這樣的動畫，並從第一項、最後一項、中心或任意索引開始計算。請為它們設定隱藏的 `initial`（或讓它們從動態效果的起點開始），這樣在輪到它們之前就不會顯示任何內容。

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

先播放離場動畫，等待它結束，再移除 view。[版面動畫](#layoutanimation)可以讓周圍的 view 補上空缺。

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

Motion 會自動遵循使用者的[減少動態效果](#reduced-motion)設定：當使用者要求減少動態效果時，Motion 會直接到達結束狀態，不會產生任何移動。

<a id="transitions"></a>

## 轉場

指定要以動畫呈現的內容與持續時間（Rust 中使用 `.transition_all().duration(400.0)`，TSX 中使用 `transitionProperty` 與 `transitionDuration`），之後對這些屬性的變更就會以原生方式，從畫面上目前的值動畫過渡到新的值。

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

| 樣式 | Rust | 型別 | 說明 |
|---|---|---|---|
| `transitionProperty` | `.transition()`、`.transition_all()`、`.transition_colors()`、`.transition_opacity()`、`.transition_transform()`、`.transition_shadow()` | `string` | 要以動畫呈現的內容，以逗號分隔：`"all"`、`"colors"`、`"opacity"`、`"transform"`、`"box-shadow"`、`"border-radius"` 等。 |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | 以數字表示的毫秒，或 CSS 時間值。 |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | 開始之前的延遲。 |
| `transitionTimingFunction` | `.ease_linear()`、`.ease_in()`、`.ease_out()`、`.ease_in_out()`、`.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | 曲線。 |

可進行轉場的屬性依群組如下：**顏色**（背景、邊框、外框、陰影與文字顏色，以及漸層色標）、**不透明度**、**transform**、**陰影**（`box-shadow`）與**形狀**（邊框圓角與寬度）。CSS 名稱及其 camel-case 形式皆可使用（`background-color`、`backgroundColor`、`transform`、`scale` 等）。版面變化則以[版面動畫](#layoutanimation)呈現。

使用 Tailwind 時，同樣的效果寫作 `transition`（顏色、不透明度、陰影與 transform）、`transition-all`、`transition-colors`、`transition-opacity`、`transition-transform`、`transition-shadow`，並搭配 `duration-*`、`delay-*` 與 `ease-*`。結合按下狀態（`.active(..)`、`active:`）後，就能做出會以動畫呈現的按下狀態：

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

轉場會從畫面上目前的值開始，因此在中途再次改變目標值時，會平滑地轉向。

<a id="keyframe-animations"></a>

## 關鍵影格動畫

內建四種以原生方式執行的關鍵影格動畫，預設會無限循環：`spin`（順時針旋轉一圈）、`ping`（放大到 2 倍並淡出）、`pulse`（淡化到一半的不透明度再回復）與 `bounce`（向上跳起 view 高度的四分之一後落地）。

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

| 樣式 | Rust | 型別 | 說明 |
|---|---|---|---|
| `animationName` | `.animate_spin()`、`.animate_ping()`、`.animate_pulse()`、`.animate_bounce()`、`.animate_none()` 或 `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | 動畫。 |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | 單次迭代。 |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | 開始之前的延遲。 |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | 同 `transitionTimingFunction` | 曲線。 |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | 預設為 `"infinite"`。 |

Tailwind：`animate-spin`、`animate-ping`、`animate-pulse`、`animate-bounce`、`animate-none`。

<a id="animated-values"></a>

## 動畫值

動畫值是存在於 UI 執行緒上的一個數字。建立一個動畫值（Rust 中使用 `animated_value(..)`，TSX 中使用來自 `nsh` 的 `createAnimatedValue`），將它繫結到樣式，再對它進行動畫處理；繫結的 view 會在每個影格跟隨它變化，無需觸發更新。

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

**可繫結的內容：**`opacity`（`.bind_opacity(..)`）；`backgroundColor`、`borderColor`（每一邊）以及文字的 `color`（整段文字），可透過對顏色的插值來繫結（`.bind_background(..)`、`.bind_border_color(..)`、`.bind_color(..)`）；`translate`（`[x, y]`，每個軸各一個值）、`rotate`（度）與 `scale`（每個軸以 `[x, y]` 指定，或兩軸共用一個值）；以及 `transform` 清單中的各個步驟：`translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`、`rotateX`、`rotateY` 與 `rotateZ`（`.bind_translate_x(..)`、`.bind_translate_y(..)`、`.bind_scale(..)`、以度為單位的 `.bind_rotate(..)`，Rust 中為 `.bind_transform(kind, ..)`）。陰影的變化則使用[轉場](#transitions)。聚焦框或閃綠光的價格，就是繫結到邊框或文字顏色的顏色插值：

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

動畫值也能驅動 [canvas 繪圖](./canvas.md#driving-drawings-with-animated-values)，並接收捲動偏移量（[`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)）與手勢（[`pan`、`pinch`、`rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)）。

動畫值會由繫結到它的 view 以及建立它的元件保持存活，因此無論你的變數如何來去，繫結都會保持連線。請在擁有動畫值的元件中建立它（當每個實例都需要自己的動畫值時，不要在模組層級建立）。
<a id="animatedvalue-methods"></a>

### AnimatedValue 方法

| TSX | Rust | 說明 |
|---|---|---|
| `set(value)` | `set(value)` | 跳到 `value`,並停止所有動畫。 |
| `stop()` | `stop()` | 在目前位置停止執行中的動畫;在 TSX 中,會以 `{ value }`(該處的值)resolve。 |
| `getValue()` | `value()` | 目前的值,在值發生移動的 UI 執行緒上讀取(會在一個影格內穩定下來):TSX 中為 promise,Rust 中為可 await 的回應。 |
| `setOffset(offset)` | `set_offset(offset)` | 將 `offset` 加到值所顯示的內容上:binding 看到的是 value + offset,而 `set`、動畫與拖曳移動的是 value。 |
| `flattenOffset()` | `flatten_offset()` | 把 offset 加到 value 上,並將 offset 設為 0。 |
| `extractOffset()` | `extract_offset()` | 將 value 移入 offset,並將 value 設為 0:之後的拖曳會從 0 開始,疊加在上一次拖曳結束的位置之上。 |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`、`timing_with(to, Timing { .. })` | 在 `duration` 毫秒內以動畫方式移至 `to`(預設 300,緩動 `"easeInOut"`)。 |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | 以彈簧方式移至 `to`(預設值:stiffness 170、damping 26、mass 1)。 |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`、`decay_within(velocity, deceleration, (min, max), bounce)` | 從 `velocity`(每秒單位數)開始滑行並逐漸減速(預設每毫秒減速 0.998)。若搭配 `[min, max]` 的 clamp,會在邊界停下,或從邊界彈回並保留 `bounce`(0..1)的速度。 |

每個動畫都會給出一個可 await 的結果,表示是否完成:播放到結尾時為 `true`,被其他操作中斷時為 `false`(`stop()`、`set()`,或同一個值上的新動畫)。在 TSX 中是 `Promise<{ finished: boolean }>`,在 Rust 中是 `AnimationEnd`,task 會對其 await `bool`。在移動中的值上啟動新動畫,會平順地中斷舊動畫:未指定速度的 spring 或 decay 會延續該值目前的速度。

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

`keyframes` 會像 CSS keyframes 一樣讓值依序經過各個關鍵影格:TSX 中為 `value.keyframes(frames, options)`,Rust 中為 `value.keyframes(frames, KeyframeTiming)`(`Animated.keyframes(value, { keyframes, ... })` 與 `Animation::keyframes(..)` 可作為[組合動畫](#composite-animations)的一個步驟)。關鍵影格可以是數字(或角度字串,如 `"90deg"`),與其他影格均勻分布,或是 `{ offset, value, easing }`(Rust 中為 `Keyframe::new(value)`、`Keyframe::at(offset, value)`、`.ease(easing)`)。

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
| `duration` | `KeyframeTiming::new(ms)` | 300 | 單次迭代的時間,單位為毫秒。 |
| `delay` | `.delay(ms)` | 0 | 第一次迭代之前的延遲。 |
| `easing` | `.easing(easing)` | CSS `ease` | 每個沒有自身緩動的區段所使用的曲線。 |
| `iterations` | `.iterations(Some(n))`、`.infinite()` | 1 | 迭代次數,或 `"infinite"`。 |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`、`"reverse"`、`"alternate"` 或 `"alternate-reverse"`。 |

播放方式與 CSS 和 Web Animations API 相同:

- 緩動作用於每個區段,而非整體:關鍵影格的 `easing` 作用於從它開始的區段,timing 的 `easing` 則作用於其他所有區段。
- 沒有 offset 的關鍵影格會在相鄰影格之間均勻分布;第一個預設為 0,最後一個預設為 1。
- 每次迭代都從跳到第一個關鍵影格開始。若沒有 offset 為 0 的關鍵影格,值會從目前的位置開始。
- 在 `delay` 期間,值已經停在第一個關鍵影格(CSS `animation-fill-mode: backwards`),因此延遲的進場動畫會顯示它的第一個影格,而不是靜止狀態的 view。motion 也是如此。
- `reverse` 以及 `alternate` 的反向迭代會倒著播放各個區段,且每個區段的曲線也會反轉。
- 值會停在最後一次迭代結束的位置。回應會說明是否完成:完成時為 `true`,被其他操作中斷時為 `false`。

### Interpolation

`interpolate` 透過分段線性區段將值對應為數字、顏色或角度,並回傳一個可供 binding 的新節點。一個值可以驅動多個屬性。在 Rust 中,`interpolate(&input, &output)` 對應為數字,`interpolate_colors(&input, &colors)` 對應為顏色,`interpolate_with(&input, output, Interpolation { .. })` 接受外插與緩動設定;在 TSX 中,`value.interpolate({ inputRange, outputRange })` 可接受全部這些設定。

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
| `inputRange` | 輸入 slice | 遞增的輸入停駐點。 |
| `outputRange` | 輸出 slice,或 `AnimationOutput` | 每個停駐點對應一個輸出:數字、顏色(`"#rrggbb"`、`"rgba(…)"`、具名顏色)或角度(`"45deg"`、`"1rad"`)。 |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | 超出輸入範圍時:`"clamp"`(預設)、`"extend"`(延續兩端的區段)或 `"identity"`(直接傳回輸入)。 |
| `extrapolateLeft`、`extrapolateRight` | `extrapolate_left`、`extrapolate_right` | 相同,但只針對其中一側。 |
| `easing` | `easing` | 為每個區段塑形。 |

> [!IMPORTANT]
> Interpolation 預設會 **clamp**:超出輸入範圍時,輸出會停在最近的一端。因此將 scroll view 拉過頂端時,與捲動連動的標頭會維持在它的結束狀態。若希望線條繼續延伸,請傳入 `extrapolate: "extend"`(`Extrapolate::Extend`)。

### Arithmetic and diffClamp

節點可以用算術運算組合,同樣在原生端執行:`a.add(b)`、`a.sub(b)`、`a.mul(b)`、`a.div(b)`、`a.mod(b)`(Rust 中為 `a.modulo(b)`;當 `b` 為正數時結果絕不為負,例如 0..360 的角度),其中 `b` 是節點或數字。在 TSX 中,`Animated.add`、`subtract`、`multiply`、`divide` 與 `modulo` 也提供相同功能的函式版本。

`diffClamp(min, max)`(`diff_clamp`)會追蹤節點的*變化量*,同時維持在 `min..max` 範圍內。套用在捲動位移上,可以做出一個在內容向上捲動時隱藏、一向下捲動就立刻回來的標頭:

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

使用 `{ snap: true }`(`diff_clamp_with(min, max, DiffClamp::snapping())`)時,若捲動停止時標頭只顯示了一部分,它會完成這段移動:在 UI 執行緒上以 200 毫秒就近停靠為完全顯示或完全隱藏。只有當頁面至少捲動了標頭的高度後,標頭才會隱藏,因此捲動距離小於該高度的頁面會顯示完整的標頭。在移動途中再次捲動,則會從標頭目前的位置接手。

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

## Composite animations

動畫由多個步驟組成(Rust 中為 `Animation`,TSX 中為來自 `nsh` 的 `Animated`),整棵樹都在原生端執行:每個步驟會在前一個步驟結束的瞬間於 UI 執行緒上啟動,中間沒有空隙,也不會夾帶你的任何程式碼。

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
| `Animated.sequence(list)` | `Animation::sequence(list)` | 依序執行。 |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`、`.stop_together(..)` | 同時執行。 |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`、`Animation::stagger_from(ms, StaggerFrom::Center, list)` | 同時執行,每一個都在前一個之後 `ms` 才開始,從 `from` 起算:`"first"`(預設)、`"last"`、`"center"`(從中間向外擴散的漣漪效果)或索引(`StaggerFrom::First`、`Last`、`Center`、`Index(i)`)。 |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [keyframes](#keyframes) 步驟。 |
| `Animated.delay(ms)` | `Animation::delay(ms)` | 等待。 |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`、`.reset_before_iteration(..)` | 重複(預設無限重複;Rust 中為 `None`)。 |

組合動畫具有 `start()`(在 TSX 中也可搭配 callback 與 promise,兩者都會收到 `{ finished }`;在 Rust 中為可 await 的 `bool`;再次呼叫即再次執行)、`stop()`(在目前位置停止)以及 `reset()`(停止並將其值還原為開始時的狀態)。callback 在整棵樹結束時只會執行一次。

執行中的動畫不會讓它的值保持存活:當擁有這些值的元件消失時(包含其 view 與變數),無限迴圈也會隨之停止,其回應表示未完成(`false`)。

## Easing

緩動曲線是資料,在原生端計算:TSX 中為來自 `nsh` 的 `Easing`,Rust 中為 `Easing` enum。

| TSX | Rust | 說明 |
|---|---|---|
| `Easing.linear`、`Easing.ease` | `Easing::Linear`、`Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | 等速;CSS 的 `ease`。 |
| `Easing.quad`、`Easing.cubic`、`Easing.poly(n)` | `Curve::Quad`、`Curve::Cubic`、`Curve::Poly(n)` | `t²`、`t³`、`tⁿ`。 |
| `Easing.sin`、`Easing.circle`、`Easing.exp` | `Curve::Sin`、`Curve::Circle`、`Curve::Exp` | 正弦、圓形、指數。 |
| `Easing.back(s?)` | `Curve::Back(s)` | 先向後拉再出發(overshoot 為 `s`,預設 1.70158)。 |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | 彈性過衝。 |
| `Easing.bounce` | `Curve::Bounce` | 在結尾處彈跳。 |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | 三次貝茲曲線,與 CSS 相同。 |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | 在 `count` 個層級之間跳躍而非連續移動,如同 CSS 的 `steps()`:逐格的 sprite、滴答走動的指針。`position` 為 `"jump-end"`(預設,亦可寫作 `"end"`)、`"jump-start"`(`"start"`)、`"jump-none"` 或 `"jump-both"`。 |
| `Easing.in(e)`、`Easing.out(e)`、`Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`、`EaseMode::Out`、`EaseMode::InOut` | 這些曲線都是「in」曲線;`out` 與 `inOut` 可將它們反轉。 |

在 TSX 中,凡是接受緩動的地方,也可以傳入名稱(`"linear"`、`"ease"`、`"easeIn"`、`"easeOut"`、`"easeInOut"`)或貝茲陣列 `[x1, y1, x2, y2]`;在 Rust 中,`Easing::EaseIn`、`Easing::EaseOut` 與 `Easing::EaseInOut` 是 CSS 曲線。

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

`Easing.sample(easing, count)`(Rust 中為 `sample_easing`)會回傳曲線在從 0 到 1 之間 `count` 個等距點上的值;`Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)`(`sample_spring`、`sample_decay`)則回傳 spring 或 decay 經過的各個值,從 `config.from`(0)開始直到結束,每個影格一個(預設每秒 60 個)。它們由動畫所執行的同一份原生程式碼計算,因此曲線圖所顯示的正是動畫實際的行為:

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

Layout animation 會在原生端為**下一次**更新的 frame 變化加上動畫:移動或調整大小的 view 會滑動到新的 frame,新的 view 會淡入(或縮放進入),被移除的 view 會淡出。請在狀態變更之前立即呼叫:Rust 中為 `animate_layout(..)`,TSX 中為 `LayoutAnimation.configureNext(config)`。

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
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 為下一次 commit 的變化加上動畫;在 TSX 中,`onEnd` 會在完成時執行。 |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | 三個階段共用同一條曲線的設定。 |
| `Presets.easeInEaseOut`、`Presets.linear`、`Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`、`LINEAR`、`SPRING` | 現成的設定。 |
| `easeInEaseOut(onEnd?)`、`linear(onEnd?)`、`spring(onEnd?)` | 搭配 preset 的 `animate_layout` | 搭配 preset 的 `configureNext`。 |
| `Types`、`Properties` | `LayoutCurve`、`LayoutProperty` | 名稱,用於組合設定。 |

設定為 `{ duration, create?, update?, delete? }`(Rust 中為 `LayoutAnimation { create, update, delete }`):`create` 用於新插入的 view,`update` 用於移動或調整大小的 view,`delete` 用於被移除的 view。每個階段為 `{ type?, property?, duration?, delay?, springDamping? }`(`LayoutTransition { curve, property, duration_ms, delay_ms }`),其中 `type` 為 `"easeInEaseOut"`、`"spring"`、`"linear"`、`"easeIn"`、`"easeOut"` 或 `"keyboard"`(軟體鍵盤自身的曲線,從鍵盤開始移動時起算時間,讓為它騰出空間的內容與它一起移動;`LayoutCurve::Keyboard`),`property` 是出現與消失的 view 所要做動畫的屬性(`"opacity"`、`"scaleXY"`、`"scale"`),而 `springDamping`(0..1,預設 0.7;`LayoutCurve::Spring { damping }`)用於設定 spring 的過衝程度。

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

Layout animation 涵蓋該次更新所改變的每一個 frame,不論在螢幕上的哪個位置:同一次更新中重新整理的列表或到達的即時資料,也會隨之移動。在 Rust 元件中,請使用 `ElementRef::animate_layout(transition)` 只為某個元素的變化所帶動的部分加上動畫:該元素自身的 frame 與其內容的 frame,以及因其大小變化而被推動的 view(它的兄弟 view 與兄弟的內容,一直到螢幕為止)。該次更新中的其他 frame 會立即改變。`nsh/base` 的 `Collapsible` 與 `AccordionPanel` 就是以這種方式展開其內容。

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

## What runs where

| | 執行位置 | 每個影格執行的你的程式碼 |
|---|---|---|
| Transition、keyframe 動畫 | UI 執行緒 | 無 |
| Motion、keyframes、`timing` / `spring` / `decay`、組合動畫 | UI 執行緒 | 無;你的程式碼只會得知它們何時結束 |
| `interpolate`、算術運算、`diffClamp` | UI 執行緒 | 無 |
| `scrollValue`、`pan` / `pinch` / `rotation` | UI 執行緒 | 無;你的程式碼會得知開始與結束 |
| Layout animation | UI 執行緒 | 無 |
| `requestAnimationFrame` 迴圈(Rust 中為 `request_animation_frame`)、`onScroll` handler、`PanResponder` | 你的程式碼,接著進行一次更新 | 每個影格 |

只有在無法事先描述的情況下(例如在你的程式碼中進行物理模擬),才使用 `requestAnimationFrame`(TSX 中為全域函式,與顯示器同步)。任何能夠成為 animated value 的東西,都應該使用 animated value。

## Reduced motion

當使用者要求減少動態效果時(iOS 的「減少動態效果」、Android 的「移除動畫」),Rust 中的 `reduce_motion()` 以及 TSX 中來自 `nsh` 的 `reduceMotion()` 為 `true`,同時 `motion-reduce:` / `motion-safe:` 這些 Tailwind variant 會生效。

[Motion](#motion) 會自行遵循此設定:`play` 與 `enter` 會立即落在 motion 的結束位置而不產生移動,且回應表示已完成(`true`),與播放完畢的 motion 相同。退場動畫仍會以隱藏狀態結束,進場動畫仍會以靜止狀態結束。對於攜帶使用者所需資訊的 motion(例如進度旋轉圖示),請傳入 `ignoreReduceMotion: true`(Rust 中為 `play_ignoring_reduce_motion`)。

Transition、keyframe 動畫、animated value、keyframes 與組合動畫會照原本撰寫的方式播放;可利用這些功能來選擇較為平緩的替代方案:

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

請參閱[無障礙](./accessibility.md#reduced-motion)。

## Related

- [`nsh` 的動畫 API](../modules/nsh.md#animation):TSX 參考文件。
- [觸控與手勢](./touch-and-gestures.md):以手指驅動 animated value。
- [捲動](./scrolling.md#scroll-linked-effects-scrollvalue):`scrollValue`。
- [Canvas](./canvas.md#driving-drawings-with-animated-values):在繪圖中使用 animated value。
- [樣式參考](../modules/style-reference.md):`transition*` 與 `animation*` 鍵。
