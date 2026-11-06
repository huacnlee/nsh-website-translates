---
title: "Shader"
description: "Элемент Shader: представление, в границах которого GPU-программа, написанная на WGSL, рисует под своими дочерними элементами."
order: 70
group: primitives
demo: el-shader
source_hash: 0aab5bdc067b9e06
---

# Shader

Shader — это view, прямоугольник которого рисует программа на GPU: перетекающие градиенты, шум и зерно, плазма, северное сияние, голографическая фольга, рябь, следующая за касанием. Вы пишете одну функцию на WGSL, `shade`, которая возвращает цвет каждой точки прямоугольника; платформа выполняет её на GPU в разрешении экрана, поверх фона view и под его дочерними элементами. Анимированные значения двигают её нативно, кадр за кадром, без работы в коде приложения. В TSX Shader создаётся с помощью `<Shader>` из `nsh`, в Rust — с помощью `shader().source(program)`.

```rust tabs
use nsh_core::{prelude::*, shader::Shader};

const GLOW: &str = r#"
struct Uniforms { tint: vec4f }

fn shade(uv: vec2f) -> vec4f {
  let d = distance(uv, vec2f(0.5));
  let pulse = 0.5 + 0.5 * sin(nsh.time * 2.0);
  let glow = smoothstep(0.5, 0.0, d) * (0.6 + 0.4 * pulse);
  return vec4f(uniforms.tint.rgb * glow, 1.0);
}
"#;

fn glow() -> impl IntoElement {
    let program = Shader::compile(GLOW).expect("a valid shader");
    shader()
        .source(program)
        .uniform("tint", Hsla::from(rgb(0x38bdf8)))
        .h(px(200.0))
        .rounded(px(14.0))
}
```

```tsx tabs
import { mount, Shader } from "nsh";

const GLOW = /* wgsl */ `
struct Uniforms { tint: vec4f }

fn shade(uv: vec2f) -> vec4f {
  let d = distance(uv, vec2f(0.5));
  let pulse = 0.5 + 0.5 * sin(nsh.time * 2.0);
  let glow = smoothstep(0.5, 0.0, d) * (0.6 + 0.4 * pulse);
  return vec4f(uniforms.tint.rgb * glow, 1.0);
}`;

function Glow() {
  return <Shader source={GLOW} uniforms={{ tint: "#38bdf8" }} style={{ height: 200, borderRadius: 14 }} />;
}

mount(() => <Glow />);
```

<a id="the-shader"></a>

## Шейдер

Исходный код шейдера — это WGSL, язык шейдеров WebGPU. Он определяет одну функцию:

```wgsl
fn shade(uv: vec2f) -> vec4f
```

- `uv` — точка прямоугольника view: от `(0, 0)` в левом верхнем углу до `(1, 1)` в правом нижнем, ось y растёт вниз, как в CSS.
- Результат — цвет точки: красный, зелёный, синий и альфа в диапазоне 0..1, в sRGB с прямой (straight) альфой, как и CSS-цвета. Значения вне 0..1 обрезаются.

Рядом с `shade` в исходном коде могут быть любые нужные вспомогательные функции, константы и переменные `var<private>`. NSH предоставляет точки входа и читает входные данные шейдера из двух источников.

<a id="built-ins"></a>

### Встроенные значения

| Встроенное значение | Тип | Значение |
|---|---|---|
| `nsh.size` | `vec2f` | Размер view в точках. |
| `nsh.time` | `f32` | Секунды с момента появления шейдера. Шейдер, который читает это значение, анимируется: он рисуется в каждом кадре, пока находится на экране. |
| `nsh.scale` | `f32` | Пикселей на точку в рисуемом кадре. |

`uv * nsh.size` — это точка в точках; `nsh.size.x / nsh.size.y` — соотношение сторон, которое сохраняет круглую форму кругов в неквадратном прямоугольнике.

<a id="uniforms"></a>

### Uniform-значения

Значения, которые задаёт приложение, помещаются в структуру с именем `Uniforms`, которую шейдер читает как `uniforms`:

```wgsl
struct Uniforms {
  colors: array<vec4f, 4>,
  speed: f32,
  center: vec2f,
}

fn shade(uv: vec2f) -> vec4f {
  let t = nsh.time * uniforms.speed;
  // …
}
```

Проп `uniforms` задаёт её члены по имени. Каждый тип принимает следующие значения:

| Тип WGSL | Значения |
|---|---|
| `f32`, `i32`, `u32` | Число (для `i32` и `u32` округляется к нулю) или анимированное значение |
| `vec2f` | `[x, y]`: два числа или анимированных значения |
| `vec3f` | Цвет (его красный, зелёный и синий каналы), анимированный цвет или три числа |
| `vec4f` | Цвет вместе с альфой, анимированный цвет или четыре числа |
| `array<vec4f, N>` | Список до `N` цветов (или по четыре числа в каждом): палитра, опорные точки градиента |

Цвета могут быть любыми CSS-цветами (`"#38bdf8"`, `"rgb(56 189 248)"`, `"hsl(199 93% 60%)"`) и попадают в шейдер как компоненты sRGB в диапазоне 0..1. Члены, которые приложение не указало, равны нулю. Повторная установка `uniforms` заново рисует шейдер с новыми значениями.

```tsx
const palettes = { Sunset: ["#ff6b6b", "#ffb86b", "#7b5cff", "#ff4fa3"], Lagoon: ["#00c2a8", "#2f80ed", "#a0f0ff", "#0b3d91"] };
const palette = signal<keyof typeof palettes>("Sunset");

<Shader source={MESH} uniforms={{ colors: palettes[palette()], speed: 0.5 }} style={{ height: 200 }} />;
```

<a id="animated-uniforms"></a>

## Анимированные uniform-значения

Uniform может быть [нативным анимированным значением](../modules/nsh.md#animation) или узлом, производным от него (`interpolate`, арифметика). Платформа записывает его значение в шейдер в каждом кадре, где оно меняется, и перерисовывает в потоке UI: анимация идёт с полной частотой кадров, как бы ни был загружен код приложения. Числа анимируют члены `f32`, `i32` и `u32` и компоненты `vec2f`; интерполяция по цветам анимирует `vec3f` или `vec4f`.

```rust tabs
use nsh_core::{prelude::*, shader::Shader};

fn ripple(program: Shader) -> impl IntoElement {
    let wave = animated_value(0.0);
    wave.timing(1.0, 2200.0, Easing::Linear);
    shader()
        .source(program)
        .uniform("wave", &wave)
        .uniform("center", [0.5_f32, 0.5])
        .h(px(200.0))
}
```

```tsx tabs
import { Animated, cleanup, createAnimatedValue, Easing, Shader } from "nsh";

const RIPPLE = /* wgsl */ `
struct Uniforms { center: vec2f, wave: f32, tint: vec4f }
fn shade(uv: vec2f) -> vec4f {
  let d = distance(uv * nsh.size, uniforms.center * nsh.size) / max(nsh.size.x, nsh.size.y);
  let ring = exp(-pow((d - uniforms.wave * 0.75) * 28.0, 2.0)) * (1.0 - uniforms.wave);
  return vec4f(vec3f(0.03, 0.03, 0.06) + uniforms.tint.rgb * ring * 1.6, 1.0);
}`;

function Ripple() {
  const wave = createAnimatedValue(0);
  const tint = wave.interpolate({ inputRange: [0, 1], outputRange: ["#38bdf8", "#c084fc"] });
  const loop = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad) }));
  loop.start();
  cleanup(() => loop.stop());
  return <Shader source={RIPPLE} uniforms={{ center: [0.5, 0.5], wave, tint }} style={{ height: 200, borderRadius: 14 }} />;
}
```

<a id="pausing"></a>

## Пауза

`paused` останавливает часы шейдера: `nsh.time` сохраняет своё значение, а шейдер удерживает свою картинку. Если вернуть значение `false`, часы продолжат с того места, где остановились. Изменения uniform-значений и размера по-прежнему перерисовывают шейдер на паузе.

```tsx
const paused = signal(false);

<Shader source={AURORA} paused={paused()} style={{ height: 200 }} onPress={() => paused.set(!paused())} />;
```

Шейдер, который не читает `nsh.time`, рисуется при изменении размера или uniform-значений, а между ними удерживает свою картинку.

<a id="children-and-clipping"></a>

## Дочерние элементы и обрезка

Shader — это контейнер: он принимает все пропы [view](./view.md) (стили, отступы и раскладку дочерних элементов, пропы нажатий и жестов, `onLayout`, доступность, `ref`), а его дочерние элементы рисуются поверх шейдера. Shader заполняет прямоугольник view так же, как фон: внутри скруглённых углов (`borderRadius`), поверх `backgroundColor`.

```tsx
<Shader source={HOLO} uniforms={{ tilt }} style={{ height: 200, borderRadius: 18, padding: 20, justifyContent: "space-between" }}>
  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>NATIVE SHELL</Text>
  <Text style={{ color: "#ffffff", fontSize: 26, fontWeight: "700" }}>4242 0000 1717</Text>
</Shader>
```

Задайте Shader размер через стили (width / height, `flex`, соотношение сторон) или позвольте определить его дочерним элементам.

<a id="effects-transitions-and-the-screen"></a>

## Эффекты, переходы и экран

Shader может также рисовать то, что рисуют другие view. Тогда его WGSL читает картинки через четыре функции; каждая принимает точку `uv` его прямоугольника и возвращает цвет sRGB с прямой альфой, прозрачный за пределами картинки:

| Функция | Что читает |
|---|---|
| `sample_content(uv)` | дочерние элементы эффекта или всю поверхность для эффекта экрана |
| `sample_backdrop(uv)` | то, что находится позади view (читать это может любой шейдер) |
| `sample_from(uv)` | сторону перехода, которую он покидает |
| `sample_to(uv)` | сторону перехода, к которой он приходит |

`nsh.progress` — это `progress` эффекта или степень выполнения перехода (от 0 до 1), а `nsh.overflow` — насколько за пределами прямоугольника рисует шейдер, в точках.

**`ShaderEffect`** рисует свои дочерние элементы через шейдер: они сохраняют нажатия, фокус и доступность, а на экране виден результат шейдера. `progress` — число или анимированное значение, которое двигает эффект нативно. `maxSampleOffset` позволяет шейдеру рисовать на столько точек за пределами прямоугольника (свечение, край размытия); тогда его `uv` выходит за значения 0 и 1. Без `source` дочерние элементы рисуются как есть.

```tsx
import { createAnimatedValue, ShaderEffect, Text } from "nsh";

const WIPE_OUT = `
fn shade(uv: vec2f) -> vec4f {
  let c = sample_content(uv);
  let edge = smoothstep(nsh.progress - 0.05, nsh.progress + 0.05, uv.x);
  return vec4f(c.rgb, c.a * edge);
}`;

const gone = createAnimatedValue(0);

<ShaderEffect source={WIPE_OUT} progress={gone} style={{ padding: 16 }}>
  <Text>Wiped away as `gone` goes to 1</Text>
</ShaderEffect>
```

**`ShaderTransition`** изменяет свои дочерние элементы через шейдер, когда меняется `value` (строка, число или булево значение), но не при первом значении: `sample_from` — картинка того, что они рисовали раньше, `sample_to` — того, что они рисуют сейчас, а `nsh.progress` идёт от 0 до 1 за `duration` миллисекунд (300). Без `source` выполняется `fallback`: `"fade"` (плавное перекрёстное затухание, по умолчанию) или `"none"`.

```tsx
<ShaderTransition source={WIPE} value={card()} duration={450}>
  <Card name={card()} />
</ShaderTransition>
```

**`ScreenEffect`** и **`ScreenTransition`** делают то же самое для всей поверхности (её страниц, диалогов и оверлеев). Они не занимают места и не имеют дочерних элементов; размещайте их где угодно в приложении. Рисует последний смонтированный эффект экрана с `source`.

Страницы и диалоги могут появляться и исчезать через шейдер с помощью **`transitionShader`**: `{ source, uniforms, duration }` на `NavPage` или `Dialog` (Rust: `.transition_shader(TransitionShader::new(program))` на `nav_page()` или `dialog()`). Когда страница добавляется или убирается либо диалог показывается или закрывается, нижняя сторона (страница под ним, приложение без диалога) — это `sample_from`, а верхняя — `sample_to`; `nsh.progress` идёт от 0 до 1, когда страница или диалог появляется, и от 1 до 0, когда исчезает, так что один шейдер рисует оба направления.

```rust tabs
use std::time::Duration;

use nsh_base::nav_page;
use nsh_core::{prelude::*, shader::{Shader, TransitionShader}};

fn details() -> impl IntoElement {
    let ripple = Shader::compile(RIPPLE).expect("a valid shader");
    nav_page()
        .title("Details")
        .transition_shader(TransitionShader::new(ripple).duration(Duration::from_millis(500)))
        .child(text("…"))
}
```

```tsx tabs
<NavPage title="Details" transitionShader={{ source: RIPPLE, duration: 500 }}>…</NavPage>
```

Шейдер занимает место `animation` страницы или диалога, каким бы он ни был (`"none"` тоже). `animation` выполняется на устройстве без GPU, когда пользователь просит уменьшить анимацию (Reduce Motion, Remove animations) и для исходного кода, который не компилируется; с `"none"` изменение тогда показывается сразу. Добавление, удаление, показ или закрытие, которые начинаются, пока выполняется предыдущее, сначала завершают его: его страница или диалог приходит или уходит, срабатывает его `onShow` или `onDismiss`, и новое изменение начинается с этого состояния.

Платформы снимают картинки, когда меняется то, что они показывают, не чаще одного раза за кадр дисплея. Картинку рисует собственный рендерер платформы, поэтому то, что он не может нарисовать в картинку (видео, веб-страница, view другого приложения), показывается в ней прозрачным.

<a id="props"></a>

## Пропы

Shader принимает пропы [view](./view.md) плюс:

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `source` | `.source(program)` | `string` | Исходный код WGSL, определяющий `fn shade(uv: vec2f) -> vec4f`. Rust компилирует его с помощью `Shader::compile(source)`. |
| `uniforms` | `.uniform(name, value)` | `Record<string, ShaderUniform>` | Значения членов `struct Uniforms` по имени: числа, цвета, анимированные значения и их списки. |
| `paused` | `.paused(bool)` | `boolean` | Останавливает часы `nsh.time`. По умолчанию `false`. |

`ShaderEffect` и `ScreenEffect` принимают их (`source` необязателен) плюс:

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `progress` | `.progress(n)`, `.animated_progress(&value)` | `number \| AnimatedNode` | `nsh.progress`. По умолчанию 0. |
| `maxSampleOffset` | `.max_sample_offset(px(n))` | `number` | Насколько за пределами прямоугольника, в точках, рисует шейдер и достают его картинки (`ShaderEffect` и `ShaderTransition`). По умолчанию 0. |

`ShaderTransition` и `ScreenTransition` принимают `source`, `uniforms` и `paused` плюс:

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `value` | `.value(key)` | `string \| number \| boolean` | Когда он меняется, запускается переход (но не при первом значении). |
| `duration` | `.duration(Duration)` | `number` | Как долго он выполняется, в миллисекундах. По умолчанию 300. |
| `fallback` | `.fallback(TransitionFallback)` | `"fade" \| "none"` | Что выполняется без `source`. По умолчанию `"fade"`. |

`NavPage` и `Dialog` принимают:

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `transitionShader` | `.transition_shader(TransitionShader::new(program))`, `.uniform(name, value)`, `.duration(Duration)` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | Шейдер, через который страница или диалог появляется и исчезает вместо своего `animation`. `duration` в миллисекундах, по умолчанию 350. |

<a id="errors"></a>

## Ошибки

NSH проверяет каждый шейдер при установке его исходного кода, до того как он попадёт на GPU. Шейдер, который не компилируется, записывает в лог предупреждение со строкой и столбцом в исходном коде и описанием проблемы, например:

```text
the shader of node 12: 2:1: `shade` takes the point's `uv: vec2f` and returns its color, a `vec4f`
```

После этого view показывает свой фон и дочерние элементы. Uniform, которого нет в структуре, или значение, которое его тип не принимает, записывает в лог предупреждение с именем uniform, а остальные uniform-значения применяются.

Каждый исходный код компилируется один раз: view с общим исходным кодом и исходный код, установленный повторно, используют уже скомпилированный шейдер.

<a id="rules-and-limits"></a>

## Правила и ограничения

- У `shade` ровно такая сигнатура: `fn shade(uv: vec2f) -> vec4f`. Исходный код объявляет собственные функции, константы, структуры и переменные `var<private>`; NSH предоставляет точки входа и привязки.
- Исходный код занимает не более 64 КиБ.
- `struct Uniforms` занимает не более 4096 байт, с членами типов из таблицы выше.
- Кадр имеет не более 4096 пикселей по стороне: view большего размера рисует свой шейдер в меньшем масштабе.

Для шума хешируйте целочисленную ячейку, в которой находится точка (`bitcast<vec2u>(vec2i(floor(p)))`, смешанный умножениями и xor-сдвигами), а не используйте `fract(sin(…) * 43758.5)`: целочисленные хеши дают одно и то же значение для ячейки везде, где оно вычисляется, поэтому шум значений остаётся бесшовным на любом GPU. Пример есть в шейдерах галереи.

<a id="platforms"></a>

## Платформы

На iOS, Android, macOS, Windows и Linux, а также в приложениях GPUI NSH рендерит шейдеры на GPU с помощью wgpu (Metal на платформах Apple, Vulkan, Direct3D 12 или OpenGL на остальных) в масштабе экрана и показывает каждый кадр под дочерними элементами view. Рендеринг идёт параллельно с UI: кадр появляется через один-два кадра дисплея после отрисовки, а UI остаётся отзывчивым, пока работает GPU. В вебе NSH преобразует шейдер в GLSL и рисует его с помощью WebGL 2.

Шейдеры рисуются не чаще одного раза за кадр дисплея и только тогда, когда меняется то, что они показывают: шейдер с неизменными uniform-значениями рисуется один раз, шейдер, который читает `nsh.time`, — в каждом кадре, а шейдер с анимированными uniform-значениями — пока они движутся.

## Rust

`shader()` (из `nsh_core::element`) создаёт view Shader; `.source(program)` передаёт ему скомпилированный `Shader` (`nsh_core::shader::Shader::compile(source)`, который возвращает те же ошибки, что описаны выше). Скомпилируйте программу один раз и используйте её совместно: клонировать её дёшево. Программа может быть привязанной, `.source(move || …)`, чтобы переключать программы.

| Метод | Описание |
|---|---|
| `.uniform(name, value)` | Задаёт член `struct Uniforms`: число, `Color` или `Hsla`, `[f32; 2]` / `[f32; 3]` / `[f32; 4]` либо `Vec<UniformValue>`. Привязанное значение (`move \|\| …`) задаёт его заново при изменении; анимированное значение (`&wave`: число или цвета для `vec3f` / `vec4f`) двигает его в каждом кадре, нативно. |
| `.paused(bool)` | Останавливает часы `nsh.time`; поддерживает привязку. |

Дочерние элементы добавляются с помощью `.child(..)`, стили — обычными типизированными методами. `shader_effect()`, `shader_transition()`, `screen_effect()` и `screen_transition()` создают остальные элементы, с методами из таблиц выше.
