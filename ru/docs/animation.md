---
title: "Анимация"
description: "Motions (готовые анимации входа, выхода, привлечения внимания и циклические анимации или ваши собственные keyframes), переходы стилей и анимации по ключевым кадрам, анимируемые значения с timing, spring, decay и keyframes, интерполяция, составные анимации, easing, анимации layout и то, что выполняется в UI-потоке, в Rust и TSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# Анимация

Каждая анимация в NSH выполняется в UI-потоке. Вы описываете её один раз, из Rust или TSX, и платформа проигрывает её кадр за кадром (Core Animation и display link на iOS, аниматор UI-потока на Android), не обращаясь обратно к вашему коду. Занятый поток движка не может вызвать рывки анимации, а пока анимация идёт, она не расходует ресурсы вашего кода.

Есть шесть инструментов, от самого готового к использованию до самого гибкого:

| Инструмент | Для чего |
|---|---|
| [Движение](#motion) | Представление, которое появляется, исчезает, привлекает внимание или зациклено: готовые движения (`fadeInUp`, `shake`, `pulse`, ...) или собственные ключевые кадры для его прозрачности и трансформации. |
| [Переходы](#transitions) | Изменение стиля, которое должно анимироваться, а не происходить скачком: цвет, прозрачность, трансформация. |
| [Покадровые анимации](#keyframe-animations) | Индикатор загрузки, пульсирующая заглушка, подпрыгивающая подсказка. |
| [Ключевые кадры](#keyframes) | Любое анимируемое значение через ключевые кадры, как их проигрывает CSS: смещения, функция плавности для каждого отрезка, итерации и направление. |
| [Анимированные значения](#animated-values) | Всё, что управляется значением во времени: пружины, жесты, позиция прокрутки, последовательности. |
| [Анимации раскладки](#layoutanimation) | Изменения размера и позиции после обновления: элементы добавляются, удаляются, переставляются, раскрывается панель. |

<a id="motion"></a>

## Движение

Движение изменяет прозрачность и трансформацию представления через ключевые кадры, нативно. Создайте его в компоненте, которому принадлежит представление (`motion()` в Rust, `createMotion()` из `nsh` в TSX), привяжите к представлению и проиграйте на нём готовое движение или собственное. `enter` запускает представление с того состояния, с которого начинается движение, и сразу проигрывает его, так что представление появляется с самого первого кадра.

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

У движения есть анимированное значение на каждый канал: `opacity` (0..1), `translateX` и `translateY` (в пунктах), `rotate`, `rotateX` и `rotateY` (в градусах), `scale`, `scaleX` и `scaleY`. Они начинают в состоянии покоя (прозрачность и масштабы равны 1, остальные 0) и применяются в таком порядке: сдвиги, затем повороты, затем масштабирование, относительно начала координат трансформации представления. У движения нет собственного внешнего вида: оно двигает то, что вы оформили.

Движение изменяет только прозрачность и трансформацию. Если развернуть `m.style` в свойства, задаются `opacity` и `transform` представления; чтобы сохранить собственную прозрачность, привяжите только шаги (`transform: m.transform`). Цвета меняются с помощью анимированного значения и [`interpolate`](#interpolation).

| TSX | Rust | Описание |
|---|---|---|
| `createMotion(options?)` | `motion()` | Движение, все каналы которого в состоянии покоя. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | Откуда стартуют каналы; остальные стартуют из состояния покоя. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | Стартует там, где стартует `enter`, и сразу проигрывает его; остальные опции меняют его тайминг. `enter` задаёт каналы, которые оно двигает, поверх `initial`. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | Привязывает каналы: `m.style` — это `{ opacity, transform }`, его `transform` — список из семи шагов (`scale` сворачивается в `scaleX` и `scaleY`). Они применяются после `translate`, `rotate` и `scale` представления; перспектива перед ними придаёт 3D-перевороту глубину: `transform: [{ perspective: 800 }, ...m.transform]`. В Rust трансформация движения применяется после собственной трансформации представления. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | Анимированное значение одного канала: его можно интерполировать или управлять им вручную. |
| `m.play(motion, options?)` | `m.play(spec)` | Проигрывает пресет или собственное движение; новое прерывает текущее. Разрешается значением `{ finished }` или `true` по завершении (`AnimationEnd` в Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | То же движение в виде [составной анимации](#composite-animations), не запущенное, чтобы выстраивать его в последовательность, запускать со сдвигом или в цикле вместе с другими. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | Проигрывает его, даже когда пользователь просит уменьшить анимацию. |
| `m.stop()` | `m.stop()` | Останавливает его на текущем месте. |
| `m.reset()` | `m.reset()` | Останавливает его и возвращает каждый канал в состояние покоя. |

<a id="presets"></a>

### Пресеты

Готовые движения представляют собой данные: `motions` из `nsh` (`motions.fadeInUp` — это то, что проигрывает `play("fadeInUp")`) и `MotionPreset` в Rust (`MotionPreset::FadeInUp.spec()`). Расстояния заданы в пунктах и рассчитаны на элементы управления и карточки; для более крупных представлений масштабируйте значения движения или напишите собственные ключевые кадры. `swing` и другие повороты вращают представление вокруг его начала координат трансформации: качающейся вывеске задайте `transformOrigin: "top"` (`.origin_top()`).

**Вход**: начинаются скрытыми или смещёнными и заканчиваются в состоянии покоя.

| TSX | Rust | Длительность | Описание |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 мс | Плавно проявляется. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 мс | Проявляется, поднимаясь на место. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 мс | Проявляется, опускаясь на место. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 мс | Проявляется, приходя слева. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 мс | Проявляется, приходя справа. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 мс | Проявляется, вырастая с 90 %. |
| `popIn` | `MotionPreset::PopIn` | 450 мс | Выскакивает: вырастает с половины размера, превышает свой размер и устанавливается. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 мс | Влетает с отскоком, дважды перелетая цель. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 мс | Выезжает снизу без изменения прозрачности (шторки, тосты). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 мс | Выезжает сверху без изменения прозрачности. |
| `flipInX` | `MotionPreset::FlipInX` | 600 мс | Переворачивается вокруг горизонтальной оси. |
| `flipInY` | `MotionPreset::FlipInY` | 600 мс | Переворачивается вокруг вертикальной оси. |

**Выход**: начинаются в состоянии покоя и заканчиваются скрытыми или смещёнными.

| TSX | Rust | Длительность | Описание |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 мс | Плавно исчезает. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 мс | Исчезает, уходя вверх. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 мс | Исчезает, уходя вниз. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 мс | Исчезает, уходя влево. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 мс | Исчезает, уходя вправо. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 мс | Исчезает, уменьшаясь до 90 %. |
| `popOut` | `MotionPreset::PopOut` | 300 мс | Схлопывается: немного раздувается, затем сжимается до исчезновения. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 мс | Уезжает вниз за пределы видимости без изменения прозрачности. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 мс | Уезжает вверх за пределы видимости без изменения прозрачности. |

**Внимание**: начинаются и заканчиваются в состоянии покоя.

| TSX | Rust | Длительность | Описание |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 мс | Трясётся из стороны в сторону: неверный пароль, некорректное поле. |
| `headShake` | `MotionPreset::HeadShake` | 800 мс | Качает головой: более мягкое «нет». |
| `wiggle` | `MotionPreset::Wiggle` | 600 мс | Покачивается вокруг центра: на это стоит обратить внимание. |
| `swing` | `MotionPreset::Swing` | 900 мс | Качается от верхнего края, как вывеска. |
| `pulse` | `MotionPreset::Pulse` | 500 мс | Немного увеличивается и возвращается: мягкий акцент. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 мс | Дважды пульсирует, как сердце: лайк, избранное. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 мс | Сжимается и растягивается, как резина. |
| `jello` | `MotionPreset::Jello` | 800 мс | Колышется, как желе. |
| `tada` | `MotionPreset::Tada` | 900 мс | Уменьшается, затем вырастает с покачиванием: награда. |
| `jump` | `MotionPreset::Jump` | 700 мс | Подпрыгивает и приземляется со сплющиванием. |
| `flash` | `MotionPreset::Flash` | 800 мс | Дважды гаснет и загорается. |

**Цикл**: повторяются, пока их не остановят.

| TSX | Rust | Длительность | Описание |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 мс | Бесконечно вращается: один оборот за цикл. |
| `float` | `MotionPreset::Float` | 1500 мс | Бесконечно плавает вверх и вниз. |
| `breathe` | `MotionPreset::Breathe` | 1800 мс | Дышит: немного увеличивается и бледнеет, бесконечно. |
| `sway` | `MotionPreset::Sway` | 1600 мс | Бесконечно покачивается вокруг центра. |
| `bob` | `MotionPreset::Bob` | 1000 мс | Бесконечно подпрыгивает, как мяч. |
| `glow` | `MotionPreset::Glow` | 2000 мс | Бесконечно разгорается и затухает. |

`play` принимает поверх пресета опции тайминга (`m.play("shake", { duration: 300 })`), а пресет можно развернуть в собственное движение (`m.play({ ...motions.fadeInUp, duration: 600 })`). В Rust измените спецификацию пресета: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### Собственные движения

Собственное движение — это ключевые кадры по каналам и один тайминг (опции [ключевых кадров](#keyframes)). В TSX запишите ключевые кадры каждого канала (`{ opacity: [0, 1] }`) или список кадров так, как их записывает Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), где у каждого кадра есть свои `offset` и `easing`. В списке кадров кадр без смещения располагается там, куда его ставит позиция в списке, а канал следует за кадрами, в которых он указан. Углы могут быть строками (`"45deg"`, `"0.5turn"`). В Rust постройте `MotionSpec`.

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

### Появления и списки с поэтапным запуском

Задайте каждой строке движение входа с задержкой, растущей вместе с её индексом: строки, появляющиеся вместе, входят одна за другой. Ограничьте задержку, чтобы строка, добавленная далеко внизу списка, не ждала.

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

Движения также компонуются: `m.animation(..)` — это движение в виде [составной анимации](#composite-animations), не запущенное, поэтому `Animated.stagger` нативно запускает группу таких движений, отсчитывая от первого элемента, последнего, центра или любого индекса. Задайте им скрытое `initial` (или стартуйте их оттуда, где начинается движение), чтобы ничего не было видно до своей очереди.

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

### Выходы

Проиграйте выход, дождитесь его завершения, затем удалите представление. [Анимация раскладки](#layoutanimation) позволяет окружающим представлениям сомкнуться на освободившемся месте.

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

Движения сами учитывают настройку пользователя [уменьшения движения](#reduced-motion): когда пользователь просит меньше анимации, движение сразу оказывается в конечном состоянии, не двигаясь.

<a id="transitions"></a>

## Переходы

Укажите, что анимировать и как долго (`.transition_all().duration(400.0)` в Rust, `transitionProperty` и `transitionDuration` в TSX), и последующие изменения этих свойств будут нативно анимироваться от того, что на экране, к новому значению.

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

| Стиль | Rust | Тип | Описание |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | Что анимируется, через запятую: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | Миллисекунды числом или время в формате CSS. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | Задержка перед началом. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | Кривая. |

Свойства, поддерживающие переходы, по группам: **цвета** (цвета фона, границы, контура, тени и текста, опорные точки градиента), **прозрачность**, **трансформация**, **тени** (`box-shadow`) и **форма** (радиус и ширина границы). Работают как CSS-имена, так и их camelCase-формы (`background-color`, `backgroundColor`, `transform`, `scale`, ...). Изменения раскладки анимируются с помощью [анимаций раскладки](#layoutanimation).

В Tailwind то же самое делают `transition` (цвета, прозрачность, тени и трансформации), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, вместе с `duration-*`, `delay-*` и `ease-*`. В сочетании с состоянием нажатия (`.active(..)`, `active:`) получаются анимированные состояния нажатия:

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

Переход начинается с текущего значения на экране, поэтому повторное изменение цели на полпути приводит к плавному развороту.

<a id="keyframe-animations"></a>

## Покадровые анимации

Четыре встроенные покадровые анимации выполняются нативно и по умолчанию бесконечно: `spin` (один оборот по часовой стрелке), `ping` (увеличивается до 2× и исчезает), `pulse` (затухает до половины прозрачности и возвращается) и `bounce` (подпрыгивает на четверть своей высоты и приземляется).

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

| Стиль | Rust | Тип | Описание |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` или `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | Анимация. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | Одна итерация. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | Задержка перед началом. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | как `transitionTimingFunction` | Кривая. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | По умолчанию `"infinite"`. |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## Анимированные значения

Анимированное значение — это число, которое живёт в UI-потоке. Создайте его (`animated_value(..)` в Rust, `createAnimatedValue` из `nsh` в TSX), привяжите к стилям и анимируйте; привязанные представления следуют за ним в каждом кадре без обновления.

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

**Что можно привязать:** `opacity` (`.bind_opacity(..)`); `backgroundColor`, `borderColor` (все стороны) и `color` текста (весь текст) через интерполяцию в цвета (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate` (`[x, y]`, значение на каждую ось), `rotate` (в градусах) и `scale` (`[x, y]` на каждую ось или одно значение для обеих); а также шаги списка `transform`: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` и `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` в градусах, `.bind_transform(kind, ..)` в Rust). Тени меняются с помощью [переходов](#transitions). Кольцо фокуса или цена, вспыхивающая зелёным, — это интерполяция цвета, привязанная к цвету границы или текста:

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

Анимированные значения также управляют [рисунками на canvas](./canvas.md#driving-drawings-with-animated-values), получают смещения прокрутки ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) и жесты ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

Значение остаётся живым, пока существуют привязанные к нему представления и создавший его компонент, поэтому привязка остаётся связанной независимо от того, как приходят и уходят ваши переменные. Создавайте анимированные значения в компоненте, который ими владеет (а не на уровне модуля, когда каждому экземпляру нужно своё).
<a id="animatedvalue-methods"></a>

### Методы AnimatedValue

| TSX | Rust | Описание |
|---|---|---|
| `set(value)` | `set(value)` | Мгновенно переходит к `value`, останавливая любую анимацию. |
| `stop()` | `stop()` | Останавливает текущую анимацию на месте; в TSX возвращает промис со значением `{ value }`, то есть значением в этой точке. |
| `getValue()` | `value()` | Текущее значение, которое считывается в UI-потоке там, где оно движется (устанавливается в пределах кадра): промис в TSX, ожидаемый ответ в Rust. |
| `setOffset(offset)` | `set_offset(offset)` | Добавляет `offset` к тому, что показывает значение: привязки видят value + offset, а `set`, анимации и перетаскивания двигают само значение. |
| `flattenOffset()` | `flatten_offset()` | Прибавляет смещение к значению и обнуляет смещение. |
| `extractOffset()` | `extract_offset()` | Переносит значение в смещение и обнуляет значение: тогда перетаскивание начинается с 0, поверх того места, где остановилось предыдущее. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | Анимирует к `to` за `duration` мс (по умолчанию 300, easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | Пружинная анимация к `to` (по умолчанию: stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Движется по инерции со скоростью `velocity` (единиц в секунду) и замедляется (по умолчанию замедление 0.998 за мс). С ограничением `[min, max]` останавливается на границе или отскакивает от неё, сохраняя долю `bounce` (0..1) скорости. |

Каждая анимация возвращает ответ, который можно ожидать и который говорит, завершилась ли она: `true`, если она доиграла до конца, и `false`, если её что-то остановило (`stop()`, `set()` или новая анимация того же значения). В TSX это `Promise<{ finished: boolean }>`, а в Rust `AnimationEnd`, который задача ожидает через `bool`. Запуск новой анимации на движущемся значении плавно прерывает старую: пружина или инерция без заданной скорости продолжают движение с текущей скоростью значения.

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

`keyframes` проигрывает значение по ключевым кадрам так же, как проигрываются CSS keyframes: `value.keyframes(frames, options)` в TSX, `value.keyframes(frames, KeyframeTiming)` в Rust (`Animated.keyframes(value, { keyframes, ... })` и `Animation::keyframes(..)` как шаг [композиции](#composite-animations)). Ключевой кадр это число (или строка с углом, например `"90deg"`), равномерно распределённое среди остальных, либо `{ offset, value, easing }` (`Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)` в Rust).

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

| Опция | Rust (`KeyframeTiming`) | По умолчанию | Описание |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | Одна итерация, в миллисекундах. |
| `delay` | `.delay(ms)` | 0 | Задержка перед первой итерацией. |
| `easing` | `.easing(easing)` | CSS `ease` | Кривая каждого сегмента, у которого нет собственного easing. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | Количество итераций или `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` или `"alternate-reverse"`. |

Они проигрываются так же, как в CSS и Web Animations API:

- Easing задаёт форму каждого сегмента, а не всей анимации: `easing` ключевого кадра определяет сегмент, который начинается с него, а `easing` из параметров времени определяет все остальные сегменты.
- Ключевые кадры без offset равномерно распределяются между соседними; первый по умолчанию получает 0, а последний 1.
- Каждая итерация начинается со скачка к своему первому ключевому кадру. Если ключевого кадра с offset 0 нет, значение стартует оттуда, где находится.
- Во время `delay` значение уже равно первому ключевому кадру (CSS `animation-fill-mode: backwards`), поэтому отложенное появление показывает свой первый кадр, а не вид в состоянии покоя. Это верно и для motions.
- `reverse` и обратные итерации `alternate` проигрывают сегменты в обратном порядке, и кривая каждого из них тоже обращается.
- Значение остаётся там, где его оставила последняя итерация. Ответ сообщает, завершились ли итерации: `true`, если да, и `false`, если их что-то остановило.

### Interpolation

`interpolate` отображает значение через кусочно-линейные сегменты в числа, цвета или углы и возвращает новый узел, который можно привязать. Одно значение может управлять многими свойствами. В Rust `interpolate(&input, &output)` отображает в числа, `interpolate_colors(&input, &colors)` в цвета, а `interpolate_with(&input, output, Interpolation { .. })` принимает экстраполяцию и easing; в TSX `value.interpolate({ inputRange, outputRange })` принимает всё это.

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

| Опция | Rust | Описание |
|---|---|---|
| `inputRange` | срез входных значений | Возрастающие входные опорные точки. |
| `outputRange` | срез выходных значений или `AnimationOutput` | Один выход на каждую опорную точку: числа, цвета (`"#rrggbb"`, `"rgba(…)"`, именованные) или углы (`"45deg"`, `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | Поведение вне диапазона входных значений: `"clamp"` (по умолчанию), `"extend"` (продолжить крайние сегменты) или `"identity"` (передать вход как есть). |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | То же, но для одной стороны. |
| `easing` | `easing` | Задаёт форму каждого сегмента. |

> [!IMPORTANT]
> По умолчанию интерполяции **ограничивают** значение (clamp): вне диапазона входных значений результат остаётся на ближайшем конце. Поэтому если оттянуть scroll view выше начала, заголовок, связанный со скроллом, остаётся в конечном состоянии. Передайте `extrapolate: "extend"` (`Extrapolate::Extend`), если нужно, чтобы линия продолжалась.

<a id="arithmetic-and-diffclamp"></a>

### Arithmetic и diffClamp

Узлы можно комбинировать с помощью арифметики, также нативной: `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (`a.modulo(b)` в Rust; результат никогда не бывает отрицательным при положительном `b`, например для углов в диапазоне 0..360), где `b` это узел или число. В TSX `Animated.add`, `subtract`, `multiply`, `divide` и `modulo` доступны как такие же функции.

`diffClamp(min, max)` (`diff_clamp`) следует за *изменениями* узла, оставаясь в пределах `min..max`. Если применить его к смещению прокрутки, получится заголовок, который скрывается при прокрутке содержимого вверх и возвращается, как только прокрутка идёт вниз:

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

С `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`) заголовок, оставшийся частично показанным после остановки прокрутки, завершает движение сам: он полностью показывается или полностью скрывается, в зависимости от того, что ближе, за 200 мс в UI-потоке. Он скрывается, только когда страница прокручена как минимум на его высоту, поэтому при меньшей прокрутке заголовок виден целиком. Если прокрутка возобновляется во время движения, оно продолжается с того места, где находится заголовок.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

## Composite animations

Анимации собираются из шагов (`Animation` в Rust, `Animated` из `nsh` в TSX), и всё дерево выполняется нативно: каждый шаг запускается в UI-потоке в момент окончания предыдущего, без пауз и без участия вашего кода.

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

| TSX | Rust | Описание |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | Шаг с заданной длительностью. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | Пружинный шаг. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | Шаг с затуханием по инерции. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | Один за другим. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | Все одновременно. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Все одновременно, причём каждый стартует через `ms` после предыдущего, считая от `from`: `"first"` (по умолчанию), `"last"`, `"center"` (волна от середины) или индекс (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Шаг из [ключевых кадров](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | Ожидание. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | Повторяет (по умолчанию бесконечно; `None` в Rust). |

У композиции есть `start()` (в TSX также с колбэком и промисом, которым передаётся `{ finished }`; в Rust это ожидаемый `bool`; повторный вызов запускает её заново), `stop()` (останавливает на месте) и `reset()` (останавливает и возвращает значения туда, где они были при запуске). Колбэк вызывается один раз для всего дерева.

Работающая анимация не удерживает свои значения в памяти: когда компонент, которому они принадлежат (его views и переменные), исчезает, бесконечный цикл останавливается вместе с ним, а его ответ сообщает, что анимация не завершилась (`false`).

## Easing

Кривые easing это данные, которые вычисляются нативно: `Easing` из `nsh` в TSX, enum `Easing` в Rust.

| TSX | Rust | Описание |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | Постоянная скорость; `ease` из CSS. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Синусоидальная, круговая, экспоненциальная. |
| `Easing.back(s?)` | `Curve::Back(s)` | Отводит назад перед началом движения (перелёт `s`, по умолчанию 1.70158). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | Упругий перелёт. |
| `Easing.bounce` | `Curve::Bounce` | Отскоки в конце. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | Кубическая кривая Безье, как в CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | Перескакивает между `count` уровнями вместо плавного движения, как CSS `steps()`: покадровый спрайт, тикающая стрелка. `position` это `"jump-end"` (по умолчанию, также `"end"`), `"jump-start"` (`"start"`), `"jump-none"` или `"jump-both"`. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | Эти кривые являются кривыми «in»; `out` и `inOut` обращают их. |

В TSX везде, где принимается easing, можно также передать имя (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) или массив Безье `[x1, y1, x2, y2]`; в Rust `Easing::EaseIn`, `Easing::EaseOut` и `Easing::EaseInOut` это кривые CSS.

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

`Easing.sample(easing, count)` (`sample_easing` в Rust) возвращает кривую в `count` равноотстоящих точках от 0 до 1, а `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) возвращают значения, через которые проходит пружина или инерция, по одному на кадр (по умолчанию 60 в секунду), начиная с `config.from` (0) и до завершения. Они вычисляются тем же нативным кодом, который выполняет анимации, поэтому график кривой точно показывает, что делает анимация:

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

Layout-анимация нативно анимирует изменения рамок при **следующем** обновлении: views, которые перемещаются или меняют размер, плавно переходят к новым рамкам, новые views появляются (с fade или масштабированием), удалённые исчезают. Вызывайте её непосредственно перед изменением состояния: `animate_layout(..)` в Rust, `LayoutAnimation.configureNext(config)` в TSX.

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

| TSX | Rust | Описание |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Анимирует изменения следующего коммита; в TSX `onEnd` запускается по завершении. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | Конфигурация с одной кривой для всех трёх фаз. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | Готовые конфигурации. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout` с пресетом | `configureNext` с пресетом. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Имена для построения конфигураций. |

Конфигурация это `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` в Rust): `create` для вставляемых views, `update` для перемещённых или изменивших размер, `delete` для удаляемых. Каждая фаза это `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`), где `type` это `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` или `"keyboard"` (собственная кривая экранной клавиатуры, отсчитываемая от момента, когда клавиатура начала двигаться, чтобы то, что освобождает для неё место, двигалось вместе с ней; `LayoutCurve::Keyboard`), `property` это то, что анимируется у появляющихся и исчезающих views (`"opacity"`, `"scaleXY"`, `"scale"`), а `springDamping` (0..1, по умолчанию 0.7; `LayoutCurve::Spring { damping }`) задаёт перелёт пружины.

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

Layout-анимация охватывает каждую рамку, которую изменяет обновление, в любом месте экрана: список, который обновляется, или живые данные, пришедшие в том же обновлении, движутся вместе с ней. В компоненте на Rust анимируйте с помощью `ElementRef::animate_layout(transition)` только то, что движется вместе с изменением одного элемента: рамку самого элемента и рамки его содержимого, а также рамки views, которые сдвигает его размер (его соседей и их соседей, вплоть до экрана). Остальные рамки обновления меняются мгновенно. Именно так `Collapsible` и `AccordionPanel` из `nsh/base` раскрывают своё содержимое.

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

## Что где выполняется

| | Где выполняется | Ваш код на каждый кадр |
|---|---|---|
| Переходы, keyframe-анимации | UI-поток | нет |
| Motions, keyframes, `timing` / `spring` / `decay`, композиции | UI-поток | нет; ваш код узнаёт об их окончании |
| `interpolate`, арифметика, `diffClamp` | UI-поток | нет |
| `scrollValue`, `pan` / `pinch` / `rotation` | UI-поток | нет; ваш код узнаёт о начале и окончании |
| Layout-анимации | UI-поток | нет |
| Циклы `requestAnimationFrame` (`request_animation_frame` в Rust), обработчики `onScroll`, `PanResponder` | ваш код, затем обновление | на каждом кадре |

Используйте `requestAnimationFrame` (глобальная функция в TSX, синхронизированная с дисплеем) только для того, что нельзя описать заранее, например для физической симуляции в вашем коде. Всё, что может быть анимированным значением, должно им быть.

## Reduced motion

Когда пользователь просит уменьшить количество движения (iOS «Reduce Motion», Android «Remove animations»), `reduce_motion()` в Rust и `reduceMotion()` из `nsh` в TSX равны `true`, а Tailwind-варианты `motion-reduce:` / `motion-safe:` применяются.

[Motions](#motion) сами следуют этой настройке: `play` и `enter` сразу попадают в конечную точку motion без движения, а ответ сообщает, что анимация завершилась (`true`), как и для проигранного motion. Выход по-прежнему заканчивается скрытым состоянием, появление по-прежнему заканчивается состоянием покоя. Передайте `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` в Rust) для motion, который несёт нужный пользователю смысл, например для индикатора выполнения.

Переходы, keyframe-анимации, анимированные значения, keyframes и композиции проигрываются как написано; с их помощью выбирайте более спокойную альтернативу:

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

См. [Accessibility](./accessibility.md#reduced-motion).

<a id="related"></a>

## Связанные материалы

- [API анимации `nsh`](../modules/nsh.md#animation): справочник по TSX.
- [Касания и жесты](./touch-and-gestures.md): управление анимированными значениями с помощью пальца.
- [Прокрутка](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): анимированные значения в рисунках.
- [Справочник по стилям](../modules/style-reference.md): ключи `transition*` и `animation*`.
