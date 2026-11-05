---
title: "nsh"
description: "Основной модуль: сигналы, эффекты, контекст, монтирование, дизайн-токены, анимация, окружение, жесты, буфер обмена, хранилище, канал хоста, сочетания клавиш, специальные возможности, а также типы элементов и стилей."
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` — основной модуль: реактивное API (сигналы, вычисляемые значения, эффекты, контекст), `mount`, `token`, хост-элементы `View`, `Text`, `Scroll` и `Overlay`, [выделяемые представления](#selectable-views), [безопасная область и клавиатура](#safe-area-and-keyboard), [анимация](#animation), [устройство и его окружение](#device), [`PanResponder`](#panresponder), [буфер обмена](#clipboard), [выбор фото](#picker), [распознавание речи](#speech), [хранилище](#storage), [канал хоста](#host), [сочетания клавиш](#keymap), [нативные компоненты и модули](#nativecomponent-and-nativemodule), [доступность](#accessibility), а также TypeScript-типы элементов, стилей и событий. Сам реактивный граф работает нативно на Rust; чтение сигнала — это вызов в рантайм, который стоит несколько наносекунд, и в интерпретаторе JavaScript выполняются только ваши собственные замыкания.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

Реактивность NSH построена на той же модели, что и в SolidJS: функция компонента выполняется **один раз**, а части UI, которые читают сигналы, обновляются на месте при изменении этих сигналов. Повторного рендера компонента и виртуального DOM нет. Руководство см. в разделе [Reactivity](../docs/reactivity.md).

## signal

```ts
function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;

interface Signal<T> {
  (): T;                              // read (tracked)
  set(value: T): void;                // write
  update(fn: (value: T) => T): void;  // write from the current value
}

interface SignalOptions<T> {
  /** When a new value counts as a change (default `===`); `false`: always. */
  equals?: false | ((previous: T, next: T) => boolean);
}
```

Сигнал хранит значение. Вызов сигнала читает значение и, внутри отслеживающей области (выражения JSX, `computed`, `effect`), подписывает эту область на него. `set` и `update` записывают значение; всё, что его читало, обновляется.

```tsx
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>Count: {count()}</Text>
      <Text onPress={() => count.update((n) => n + 1)}>Add one</Text>
    </View>
  );
}

mount(Counter);
```

По умолчанию запись значения, `===` текущему, ничего не делает. Передайте `equals: false`, чтобы уведомлять при каждой записи (полезно, когда вы изменяете объект на месте и снова записываете тот же объект), или собственную функцию сравнения:

```ts
const items = signal<string[]>([], { equals: false });
const point = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

## computed

```ts
function computed<T>(fn: (previous: T | undefined) => T, options?: SignalOptions<T>): Accessor<T>;

interface Accessor<T> {
  (): T;
}
```

Значение, производное от сигналов. `fn` запускается снова, когда меняется прочитанный им сигнал; читатели вычисляемого значения обновляются, только когда меняется его результат (по `equals`, `===` по умолчанию). `fn` получает предыдущий результат.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

Используйте `computed`, когда вычисление дорогое или его результат читается в нескольких местах. Для дешёвого выражения обычная функция (`const full = () => first() + " " + last()`) реактивна ничуть не хуже.

## effect

```ts
function effect(fn: () => void): void;
```

Запускает `fn` после рендеринга и снова при каждом изменении прочитанного им сигнала. Используйте эффекты для побочных действий: логирования, таймеров, обращений к нативным модулям. Эффект принадлежит компоненту (или эффекту), в котором он создан, и удаляется вместе с ним.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Чтобы отменить что-либо перед повторным запуском эффекта (или когда его компонент исчезает), вызовите внутри него [`cleanup`](#cleanup).

## batch

```ts
function batch<T>(fn: () => T): T;
```

Запускает `fn` и применяет все его записи вместе в конце, так что читатели обновляются один раз, а не по разу на каждую запись. Возвращает то, что возвращает `fn`.

```ts
batch(() => {
  first.set("Grace");
  last.set("Hopper");
}); // `full` recomputes once
```

## untracked

```ts
function untracked<T>(fn: () => T): T;
```

Запускает `fn`, не подписывая текущую область на то, что он читает. Используйте это, чтобы прочитать сигнал внутри эффекта или выражения JSX, не завися от него.

```ts
effect(() => {
  // Runs again when `query` changes, not when `page` changes.
  search(query(), untracked(() => page()));
});
```

## cleanup

```ts
function cleanup(fn: () => void): void;
```

Регистрирует `fn` для запуска перед очередным запуском текущего эффекта или когда текущий компонент или эффект исчезает.

```tsx
function Clock() {
  const now = signal(new Date());
  const timer = setInterval(() => now.set(new Date()), 1000);
  cleanup(() => clearInterval(timer));
  return <Text>{now().toLocaleTimeString()}</Text>;
}
```

## context

```ts
function context<T>(defaultValue: T): Context<T>;

interface Context<T> extends Accessor<T> {
  Provider: (props: { value: T; children?: JSX.Element }) => JSX.Element;
}
```

Значение, которое компонент предоставляет всему, что он рендерит, на любой глубине. Вызов контекста (`Theme()`) читает значение ближайшего провайдера или `defaultValue`, если провайдера нет.

```tsx
import { context, mount, signal, Text, View } from "nsh";

const Theme = context<"light" | "dark">("light");

function Label(props: { text: string }) {
  return <Text style={{ color: Theme() === "dark" ? "#fff" : "#000" }}>{props.text}</Text>;
}

function App() {
  const dark = signal(false);
  return (
    <Theme.Provider value={dark() ? "dark" : "light"}>
      <View style={{ flex: 1, padding: 24, backgroundColor: dark() ? "#000" : "#fff" }}>
        <Label text="Hello" />
        <Text onPress={() => dark.update((d) => !d)}>Toggle</Text>
      </View>
    </Theme.Provider>
  );
}

mount(App);
```

## mount

```ts
function mount<P extends object>(app: Component<P>, props?: P): () => void;
```

Рендерит `app` на поверхность (окно или `NshAppView` / `NshView`, в которые встроено приложение) и возвращает функцию, которая его убирает. Входной файл каждого приложения заканчивается вызовом `mount(App)`.

```tsx
mount(App);
```

## split

```ts
function split<T extends object, K extends readonly (keyof T)[]>(
  props: T,
  keys: K,
): [Pick<T, K[number]>, Omit<T, K[number]>];
```

Разделяет объект props на props, названные в `keys`, и остальные. Обе части остаются реактивными: props, значения которых меняются, являются геттерами, и `split` сохраняет их геттерами. Используйте это в компоненте, который часть props обрабатывает сам, а остальные передаёт дальше. Деструктуризация props (`const { label } = props`) прочитала бы их один раз и потеряла бы обновления.

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function LabeledInput(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input {...rest} />
    </View>
  );
}
```

## ErrorBoundary

```ts
function ErrorBoundary(props: {
  fallback: JSX.Element | ((error: unknown, reset: () => void) => JSX.Element);
  children?: JSX.Element;
}): JSX.Element;
```

Рендерит своих потомков или `fallback`, как только что-то под ними выбросит исключение: тело компонента, привязка, эффект или обработчик события. Часть, в которой произошёл сбой, удаляется, и на её месте показывается запасной вариант. Функция `fallback` вызывается как `fallback(error, reset)` с выброшенным значением и `reset`, который снова рендерит потомков, независимо от того, какие параметры она объявляет; элемент `fallback` показывается как есть. Сбой передаётся ближайшей границе выше него, а сбой в запасном варианте — границе выше той. Компоненты на Rust используют `catch_error` ([Error boundaries](../docs/reactivity.md#error-boundaries)).

```tsx
import { ErrorBoundary, Text, View } from "nsh";

function Feed() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>{error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Posts />
    </ErrorBoundary>
  );
}
```

## token

```ts
function token<K extends keyof Tokens>(name: K): Tokens[K];
```

Токен дизайна `name` темы приложения (`"theme"` в `nsh.json`, поверх токенов shadcn/ui) для отображаемого оформления:
цвет — как `#rrggbbaa`, длина — как число пунктов, шрифт — как название семейства. Имена — это CSS-переменные темы
без `--` (`primary`, `muted-foreground`, `radius`, `font-mono`, а также собственные переменные приложения, например `up`). Чтение
реактивно: компонент, memo или эффект, читающий токен, запускается снова при изменении темы или оформления.
`Tokens` перечисляет токены приложения с их типами; NSH записывает его в `.nsh/types/nsh/tokens.d.ts` на основе темы. Для
классов называйте токены напрямую (`bg-primary`, `rounded-(--radius)`): [Theme tokens](../docs/tailwind.md#theme-tokens).

```tsx
import { effect, token } from "nsh";

effect(() => console.log("primary is", token("primary"), "radius", token("radius")));
```

## View, Text, Scroll, Overlay

```ts
function View(props: ViewProps): JSX.Element;
function Text(props: TextProps): JSX.Element;
function Scroll(props: ScrollProps): JSX.Element;
function Overlay(props: OverlayProps): JSX.Element;
```

Хост-элементы, которые экспортирует `nsh`, записываемые как теги: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (его
дочерние элементы поверх окна, размещённые относительно якоря: [Overlay](../elements/overlay.md)). Компилятор создаёт
нативное представление на месте для тега, который называет один из них через свой импорт (в том числе под псевдонимом), так что
импорт ничего не стоит во время выполнения. Это такие же компоненты, как и любые другие, поэтому их можно и передавать (`const Tag = inline ? Text : View`).
`nsh` точно так же экспортирует другие примитивы: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) и [`Video`](./nsh-video.md), у каждого есть своя страница
справочника. Их props описаны в разделе [Elements](../elements/index.md). Текстовое поле ввода, `Input`, поставляется из
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## Безопасная область и клавиатура

Переменные окружения CSS удерживают содержимое вне системного UI в padding и margin любого представления
(`padding`, `paddingTop`, ..., те же ключи `margin`; произвольные значения `p*` / `m*` в Tailwind; методы `Styled`
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ... в Rust). Их значения — `EnvValue`:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` и `calc(<length> + env(name))`.

| Переменная | Значение |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | Отступы корневого представления, в котором рендерится узел: ближайшей страницы (под её заголовком), ближайшего диалога или, иначе, безопасная область поверхности. См. [Safe area](../elements/safe-area.md). |
| `keyboard-inset-height` | Высота программной клавиатуры над поверхностью, 0, пока она скрыта; изменения анимируются нативно вместе с клавиатурой. См. [Keyboard](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea и safeAreaInsets

`safeArea()` — безопасная область поверхности (`safe_area()` в Rust); `safeAreaInsets()` — отступы там, где
рендерится компонент (`cx.insets()` в Rust), то есть значения переменных `safe-area-inset-*`. Оба являются реактивными `Edges`
(`{ top, right, bottom, left }` в пунктах). См.
[safeArea and safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

<a id="keyboard-and-keyboardframe"></a>

### Keyboard и keyboardFrame

`Keyboard.dismiss()` скрывает программную клавиатуру (`dismiss_keyboard()` в Rust), а `keyboardFrame()` сообщает, какую
часть экрана она закрывает (`keyboard_height()` и `keyboard_duration()` в Rust). См.
[Hiding the keyboard](../elements/keyboard.md#hiding-the-keyboard) и
[The keyboard's height](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## Выделяемые представления

`<View selectable>` (`view().selectable(true)` в Rust) делает так, что тексты внутри него выделяются вместе, как на веб-странице:
одно выделение проходит через представления, элементы `Text` и `TextView` в порядке чтения. См.
[Text selection](../elements/text-selection.md).

<a id="animation"></a>

## Анимация

API анимации выполняет анимацию в UI-потоке. Вы создаёте **анимированное значение**, привязываете его (или производные от него значения) к свойству стиля и запускаете анимацию; дальше каждый кадр вычисляется нативно, без запуска кода приложения. Занятый движок или JS-поток не может вызвать подтормаживание анимации, а сама анимация не требует от приложения никакой работы на каждом кадре. Код на Rust использует `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` и `Easing` из `nsh_core::prelude` и привязывает значения методами `.bind_*` элементов; в TSX их импортируют из `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

Руководство см. в разделе [Animation](../docs/animation.md).

<a id="what-an-animated-value-can-drive"></a>

### Что может управляться анимированным значением

| Где | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | То же: узел цветов. `borderColor` задаёт цвет всех сторон; `color` у `Text` задаёт цвет всего текста |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (градусы) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, шаги `rotateZ`: `transform: [{ translateX: value }]` |
| Позиция прокрутки | `.scroll_value(&value)` у прокручиваемого представления или списка | `<Scroll scrollValue={value}>` и `<List scrollValue={value}>` записывают в него смещение прокрутки на каждом кадре |
| Жесты | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}` у любого элемента: жест записывает значения напрямую (см. [Touch and gestures](../docs/touch-and-gestures.md)) |
| Где прилипают представления | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` в горизонтальном прокручиваемом представлении), `.bind_sticky_header_offset(&value)` у списка | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: липкие представления и заголовки прилипают на таком расстоянии от начала области просмотра, следуя за значением на каждом кадре |
| Canvas | анимированный аргумент вызова painter | Любой числовой или цветовой аргумент вызова рисования [canvas](./nsh-canvas.md) |
| Шейдер | `.uniform(name, &value)` | Член `struct Uniforms` у [shader](../elements/shader.md): `uniforms={{ name: value }}` (числа или узел цветов для `vec3f` / `vec4f`) |

Остальные свойства стиля принимают обычные значения; чтобы анимировать саму раскладку (размеры, позиции в потоке), используйте [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

Создаёт анимированное значение, начинающееся с `value` (по умолчанию `0`). Rust: `animated_value(value)`, дескриптор `Copy`, который хранит компонент, создавший его.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let right = stored(false);
    let toggle = move || {
        let to_right = !right.get();
        right.replace(to_right);
        let _ = x.spring(if to_right { 200.0 } else { 0.0 }, Spring::default());
    };
    view()
        .flex_1()
        .p_6()
        .pt_12()
        .gap_4()
        .child(view().size(px(60.0)).rounded(px(12.0)).bg(rgb(0x6366f1)).bind_translate_x(&x))
        .child(text("Move").on_press(toggle))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  let right = false;
  const toggle = () => {
    right = !right;
    x.spring(right ? 200 : 0);
  };
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 48, gap: 16 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#6366f1", transform: [{ translateX: x }] }} />
      <Text onPress={toggle}>Move</Text>
    </View>
  );
}

mount(App);
```

> [!NOTE]
> Анимированное значение живёт в UI-потоке и меняется там на каждом кадре, поэтому приложение читает его асинхронно: `await value.getValue()` (или `{ value }`, с которым завершается `stop()`) возвращает значение на этот момент, а в Rust — `value.value().await` в задаче. Если вашему коду целевое значение нужно сразу, храните его в переменной или сигнале, как показано выше. События жестов сообщают значения на момент их завершения (`PanEvent.value`).

### AnimatedValue

```ts
class AnimatedValue extends AnimatedNode {
  constructor(value: number);
  set(value: number): void;
  stop(): Promise<{ value: number }>;
  getValue(): Promise<number>;
  setOffset(offset: number): void;
  flattenOffset(): void;
  extractOffset(): void;
  timing(to: number, options?: { duration?: number; easing?: Easing; delay?: number }): Promise<{ finished: boolean }>;
  spring(to: number, options?: { stiffness?: number; damping?: number; mass?: number; velocity?: number }): Promise<{ finished: boolean }>;
  decay(options?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): Promise<{ finished: boolean }>;
  keyframes(keyframes: KeyframeValue[], options?: KeyframeTiming): Promise<{ finished: boolean }>;
}
```

| Метод | Rust | Описание |
|---|---|---|
| `set(value)` | `set(value)` | Переходит к `value`, останавливая любую запущенную анимацию. |
| `stop()` | `stop()`, затем `value().await` | Останавливает запущенную анимацию там, где она находится; завершается с `{ value }` — значением в этой точке. |
| `getValue()` | `value().await` | Завершается с текущим значением (с учётом смещения), прочитанным в UI-потоке. |
| `setOffset(offset)` | `set_offset(offset)` | Смещение, добавляемое к значению: привязки видят значение + смещение; `set`, анимации и перетаскивания двигают значение. |
| `flattenOffset()` | `flatten_offset()` | Добавляет смещение к значению и обнуляет его. |
| `extractOffset()` | `extract_offset()` | Переносит значение в смещение и обнуляет значение (следующее перетаскивание тогда начинается с того места, где закончилось предыдущее). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | Анимирует до `to` по кривой плавности. `duration` в мс (по умолчанию 300), `easing` (по умолчанию `"easeInOut"`), `delay` в мс (по умолчанию 0). |
| `spring(to, options)` | `spring(to, Spring { … })` | Пружинно движется к `to`. `stiffness` (по умолчанию 170), `damping` (по умолчанию 26), `mass` (по умолчанию 1), `velocity` (начальная скорость, единиц в секунду). |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Движется по инерции со скоростью `velocity` (единиц в секунду) и замедляется на `deceleration` за миллисекунду (по умолчанию 0.998). Используйте после броска со скоростью из `onPanEnd`. С `clamp: [min, max]` останавливается на границе или отскакивает от неё, сохраняя `bounce` (0..1, по умолчанию 0) своей скорости. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | Проигрывает [keyframes](#keyframes) так же, как проигрываются CSS-кейфреймы: своя плавность на каждый сегмент, `iterations` раз в `direction`. |

Каждый метод анимации возвращает промис, который завершается с `{ finished }`: `true`, когда анимация закончилась, `false`, когда она была остановлена (через `stop`, `set` или другой анимацией того же значения). В Rust он возвращает `AnimationEnd`, которого задача ожидает ради того же `bool`.

```rust tabs
let opacity = animated_value(1.0);
spawn(async move {
    if opacity.timing(0.0, 200.0, Easing::EaseInOut).await {
        visible.set(false);
    }
});
```

```tsx tabs
const opacity = createAnimatedValue(1);
const { finished } = await opacity.timing(0, { duration: 200 });
if (finished) visible.set(false);
```

### AnimatedNode

```ts
class AnimatedNode {
  interpolate(config: {
    inputRange: number[];
    outputRange: number[] | string[];
    extrapolate?: Extrapolation;
    extrapolateLeft?: Extrapolation;
    extrapolateRight?: Extrapolation;
    easing?: Easing;
  }): AnimatedNode;
  diffClamp(min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  add(b: AnimatedNode | number): AnimatedNode;
  sub(b: AnimatedNode | number): AnimatedNode;
  mul(b: AnimatedNode | number): AnimatedNode;
  div(b: AnimatedNode | number): AnimatedNode;
  mod(b: AnimatedNode | number): AnimatedNode;
}

type Extrapolation = "extend" | "clamp" | "identity";
```

Узел нативного графа анимации: `AnimatedValue` или значение, производное от других. Производные узлы вычисляются в UI-потоке при каждом изменении их входов.

| Метод | Rust | Описание |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Отображает вход через кусочные диапазоны. `outputRange` содержит числа, цвета (`"#ff0000"`, `"rgba(…)"`) или углы (`"45deg"`, `"1rad"`). Вне `inputRange` по умолчанию ограничивает значение; `extrapolate` (или `extrapolateLeft` / `extrapolateRight`) может быть `"extend"` (продолжить линию), `"clamp"` или `"identity"` (пропустить вход как есть). `easing` задаёт форму каждого сегмента. Rust принимает числа, цвета темы (которые следуют оформлению) и углы в градусах для `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Следует за изменениями входа, но удерживает результат в пределах `min..max`: заголовок, который скрывается, пока содержимое прокручивается вверх, и возвращается, как только оно прокручивается вниз. `snap: true` доводит его до ближайшей границы за 200 мс, когда его прокручиваемое представление останавливается, а при `max` — только когда вход достиг `max`. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | Арифметика с другим узлом или константой. |
| `mod(b)` | `modulo(b)` | Остаток от деления, никогда не отрицательный при положительном `b` (удерживает углы в диапазоне 0..360). |

```rust tabs
let scroll_y = animated_value(0.0);
let header = scroll_y.diff_clamp(0.0, 44.0);

view()
    .flex_1()
    .child(scroll().scroll_value(&scroll_y).flex_1() /* rows */)
    .child(view().h(px(44.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 44);

<Scroll scrollValue={scroll} style={{ flex: 1 }}>{/* rows */}</Scroll>
<View style={{ height: 44, transform: [{ translateY: header.mul(-1) }] }} />
```

```rust tabs
let progress = animated_value(0.0);
let rotate = progress.interpolate(&[0.0, 1.0], &[0.0, 360.0]); // degrees, for bind_rotate
let color = progress.interpolate_colors(&[0.0, 0.5, 1.0], &[rgb(0x22c55e), rgb(0xeab308), rgb(0xef4444)]);
```

```tsx tabs
const progress = createAnimatedValue(0);
const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
const color = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["#22c55e", "#eab308", "#ef4444"] });
```
### Keyframes

```ts
interface Keyframe {
  offset?: number;          // 0..1 of an iteration; missing offsets spread evenly
  value: number | string;   // a number, or an angle ("45deg", "0.5turn") in degrees
  easing?: Easing;          // the segment that starts here
}
type KeyframeValue = number | string | Keyframe;

interface KeyframeTiming {
  duration?: number;        // one iteration, ms (300)
  delay?: number;           // before the first iteration, ms (0)
  easing?: Easing;          // segments without their own (CSS "ease")
  iterations?: number | "infinite";   // 1
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}
```

`value.keyframes(frames, options)` проигрывает значение по ключевым кадрам и завершается с `{ finished }` — доиграли ли они до конца; `Animated.keyframes(value, { keyframes, ...options })` — то же самое, что шаг композиции. Rust: `value.keyframes(frames, KeyframeTiming)` и `Animation::keyframes(&value, frames, KeyframeTiming)` с `Keyframe::new(value)` (равномерно распределённые), `Keyframe::at(offset, value)` и `.ease(easing)`, а также `KeyframeTiming::new(ms)` с `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` и `.direction(PlaybackDirection::…)`.

Они проигрываются так же, как CSS-кадры анимации: кривая плавности задаёт форму одного сегмента (у ключевого кадра — сегмент, который начинается с него, у timing — все остальные); отсутствующие у ключевых кадров offset распределяются равномерно, первый — в 0, последний — в 1; каждая итерация начинается со скачка к первому ключевому кадру, а без ключевого кадра в 0 значение идёт оттуда, где находится; во время `delay` значение удерживает первый ключевой кадр (CSS `animation-fill-mode: backwards`); обратные итерации проходят сегменты в обратном порядке с обращёнными кривыми; значение остаётся там, где его оставила последняя итерация.

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).iterations(Some(3)),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, iterations: 3 });
```

### createMotion

```ts
function createMotion(options?: MotionOptions): Motion;

interface MotionOptions extends MotionPlayOptions {
  initial?: { [C in MotionChannel]?: number };   // where channels start (the others at rest)
  enter?: MotionName | MotionSpec;   // start where it starts and play it at once
}

interface MotionPlayOptions extends KeyframeTiming {
  ignoreReduceMotion?: boolean;      // play even when the user asks for less motion
}

interface Motion {
  readonly opacity: AnimatedValue;
  readonly translateX: AnimatedValue;
  readonly translateY: AnimatedValue;
  readonly rotate: AnimatedValue;    // degrees
  readonly rotateX: AnimatedValue;
  readonly rotateY: AnimatedValue;
  readonly scale: AnimatedValue;
  readonly scaleX: AnimatedValue;
  readonly scaleY: AnimatedValue;
  readonly style: { opacity: AnimatedValue; transform: MotionTransform };
  readonly transform: MotionTransform;
  play(motion: MotionName | MotionSpec, options?: MotionPlayOptions): Promise<{ finished: boolean }>;
  animation(motion: MotionName | MotionSpec, options?: MotionPlayOptions): CompositeAnimation;
  stop(): void;
  reset(): void;
}
```

Создаёт движение: анимированное значение для каждого канала непрозрачности и трансформации представления в состоянии покоя (непрозрачность и масштабы равны 1, остальные 0), а также движения, которые нативно проигрываются на них. Привяжите его через `style={motion.style}` или разверните `motion.style` либо `motion.transform` в стиль; трансформация применяет сначала сдвиги, затем повороты, затем масштабы, причём `scale` сворачивается в `scaleX` и `scaleY`: это 7 из 8 шагов трансформации представления, так что один остаётся для вашего (`[{ perspective: 600 }, ...motion.transform]` для 3D-переворотов). `initial` задаёт, откуда стартуют каналы (`{ opacity: 0 }`; остальные стартуют из состояния покоя). С `enter` каналы, которые оно двигает, стартуют там, где начинается это движение (по `initial`), и оно проигрывается сразу, а остальные опции служат его параметрами времени (`delay`, `duration`, ...). Движение меняет только непрозрачность и трансформацию: разворачивание `motion.style` задаёт `opacity` представления, поэтому привязывайте только `motion.transform`, чтобы сохранить собственную непрозрачность, а цвета двигайте через анимированное значение и `interpolate`. Rust: `motion()` — дескриптор `Copy`, который хранит компонент, создавший его, привязывается через `.bind_motion(&m)`; `motion().entering(spec)` выполняет вход.

| Элемент | Rust (`Motion`) | Описание |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | Анимированные значения каналов. |
| `style`, `transform` | `.bind_motion(&m)` на элементе | Привязки. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | Проигрывает на каналах готовый пресет по имени или [`MotionSpec`](#motions); новое движение прерывает текущее. `options` меняют его тайминг. Завершается с `{ finished }`: `true`, если оно доиграло, `false`, если что-то его остановило (`AnimationEnd` в Rust). |
| `animation(motion, options?)` | `animation(spec)` | То же движение в виде [`CompositeAnimation`](#animated), не запущенное, для композиции: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). Уменьшенное движение определяется в момент создания. |
| `stop()` | `stop()` | Останавливает его на месте. |
| `reset()` | `reset()` | Останавливает его и возвращает каждый канал в состояние покоя. |

Когда пользователь просит меньше движения (`reduceMotion()`), `play`, `animation` и `enter` сразу переходят в конечную точку движения, не двигаясь, если не задан `ignoreReduceMotion` (в опциях или у движения).

```rust tabs
let card = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(80.0)));
view().size(px(120.0)).rounded(px(16.0)).bg(rgb(0x0969da)).bind_motion(&card).on_press(move || {
    card.play(MotionPreset::Pulse);
})
```

```tsx tabs
const card = createMotion({ enter: "fadeInUp", delay: 80 });
<View onPress={() => card.play("pulse")} style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }} />
```

### motions

```ts
const motions: Readonly<Record<MotionName, MotionPreset>>;

type MotionChannel = "opacity" | "translateX" | "translateY" | "rotate" | "rotateX" | "rotateY" | "scale" | "scaleX" | "scaleY";

interface MotionSpec extends KeyframeTiming {
  keyframes: { [C in MotionChannel]?: KeyframeValue[] } | MotionFrame[];
  ignoreReduceMotion?: boolean;
}
type MotionFrame = { [C in MotionChannel]?: number | string } & { offset?: number; easing?: Easing };

interface MotionPreset extends MotionSpec {
  kind: "enter" | "exit" | "attention" | "loop";
}
```

Готовые движения в виде данных: `motion.play("shake")` проигрывает `motions.shake`. `MotionName` — одно из `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (появление); `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (исчезновение); `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (привлечение внимания); `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (цикл). [Animation](../docs/animation.md#presets) описывает каждое из них. Разверните пресет, чтобы изменить его: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

`MotionSpec` — это ваше собственное движение: ключевые кадры каждого канала (`{ opacity: [0, 1], translateY: [24, 0] }`) или список кадров в том виде, как их записывает Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`; кадр без offset размещается по его позиции в списке), с [таймингом ключевых кадров](#keyframes). Rust: `MotionSpec::new(KeyframeTiming)` с `.values(channel, values)` (равномерно распределённые), `.track(channel, keyframes)` и `.timing(|t| …)`; `MotionPreset::FadeInUp` (или `.spec()`) — пресет, а `MotionChannel` называет каналы.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(MotionChannel::TranslateY, [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)]);
card.play(rise);
```

```tsx tabs
card.play({ duration: 400, keyframes: [{ opacity: 0, translateY: 24, easing: "easeOut" }, { opacity: 1, translateY: 0 }] });
```

### Animated

```ts
const Animated: {
  timing(value: AnimatedValue, config: { toValue: number; duration?: number; easing?: Easing; delay?: number }): CompositeAnimation;
  spring(value: AnimatedValue, config: { toValue: number; stiffness?: number; damping?: number; mass?: number; velocity?: number }): CompositeAnimation;
  decay(value: AnimatedValue, config?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): CompositeAnimation;
  sequence(list: CompositeAnimation[]): CompositeAnimation;
  parallel(list: CompositeAnimation[], config?: { stopTogether?: boolean }): CompositeAnimation;
  stagger(ms: number, list: CompositeAnimation[], config?: { from?: "first" | "last" | "center" | number }): CompositeAnimation;
  delay(ms: number): CompositeAnimation;
  loop(animation: CompositeAnimation, config?: { iterations?: number; resetBeforeIteration?: boolean }): CompositeAnimation;
  keyframes(value: AnimatedValue, config: KeyframeTiming & { keyframes: KeyframeValue[] }): CompositeAnimation;
  add(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  subtract(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  multiply(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  divide(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  modulo(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  diffClamp(a: AnimatedNode, min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  sampleSpring(config: SpringConfig & { from?: number }, fps?: number): number[];
  sampleDecay(config: DecayConfig & { from?: number }, fps?: number): number[];
};

interface CompositeAnimation {
  start(callback?: (result: { finished: boolean }) => void): Promise<{ finished: boolean }>;
  stop(): void;
  reset(): void;
}
```

`Animated` собирает анимации из шагов (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...). Ничего не выполняется, пока не вызван `start()`; затем всё дерево выполняется нативно, и каждый шаг запускается в UI-потоке в точный момент завершения предыдущего (без промежутка в кадр и без обращений к коду приложения между шагами). В Rust то же дерево строится с помощью `Animation`.

| Функция | Rust | Описание |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | Одна анимация одного значения; те же опции и значения по умолчанию, что у методов [`AnimatedValue`](#animatedvalue), а цель передаётся как `toValue`. |
| `sequence(list)` | `Animation::sequence(list)` | Выполняет анимации одну за другой. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | Выполняет их одновременно. При `stopTogether` (по умолчанию `true`) остановка одной останавливает все. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Выполняет их параллельно, каждая стартует через `ms` после предыдущей, отсчитывая от `from`: `"first"` (по умолчанию), `"last"`, `"center"` (средняя стартует сразу, остальные расходятся от неё; при чётном количестве обе средние стартуют сразу) или индекс (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Значение по [ключевым кадрам](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | Ждёт; полезно внутри `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | Повторяет `animation` `iterations` раз (по умолчанию бесконечно), возвращая его значения на место перед каждым запуском, если только `resetBeforeIteration` не равно `false`. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | методы узла | То же, что методы [`AnimatedNode`](#animatednode), в виде функций. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | Значения пружины или затухания по одному на кадр (см. [Easing](#easing)). |

`CompositeAnimation`:

| Метод | Rust (`Animation`) | Описание |
|---|---|---|
| `start(callback?)` | `start()`, `AnimationEnd` для ожидания | Запускает его (снова). Один раз для всего дерева завершается и вызывает `callback` с `{ finished }`: доиграло ли оно до конца, а не было остановлено. |
| `stop()` | `stop()` | Останавливает его на месте. |
| `reset()` | `reset()` | Останавливает его и возвращает его значения туда, где они были на момент запуска. |

```rust tabs
let ys: Vec<AnimatedValue> = (0..4).map(|_| animated_value(0.0)).collect();
let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -36.0, Timing::new(220.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);
let run = hop.start();
spawn(async move { log::info!("{}", if run.await { "done" } else { "stopped" }) });
```

```tsx tabs
const ys = [0, 1, 2, 3].map(() => createAnimatedValue(0));
const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -36, duration: 220, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);
hop.start(({ finished }) => console.log(finished ? "done" : "stopped"));
```

### Easing

```ts
type Easing =
  | "linear" | "ease" | "easeIn" | "easeOut" | "easeInOut"
  | [number, number, number, number]   // cubic Bézier x1, y1, x2, y2
  | EasingCurve
  | EasingSteps;                     // Easing.steps(…)

const Easing: {
  linear: Easing;
  ease: Easing;
  bezier(x1: number, y1: number, x2: number, y2: number): Easing;
  steps(count: number, position?: "jump-start" | "jump-end" | "jump-none" | "jump-both" | "start" | "end"): EasingSteps;
  in(e: Easing): Easing;
  out(e: Easing): Easing;
  inOut(e: Easing): Easing;
  sample(easing: Easing, count: number): number[];
  quad: EasingCurve;
  cubic: EasingCurve;
  poly(n?: number): EasingCurve;
  sin: EasingCurve;
  circle: EasingCurve;
  exp: EasingCurve;
  elastic(bounciness?: number): EasingCurve;
  back(s?: number): EasingCurve;
  bounce: EasingCurve;
};
```

Кривая плавности — это данные, а не функция приложения: среда выполнения вычисляет её нативно. В Rust это enum `Easing`: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` и `Curve(curve, mode)`, с `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) и `EaseMode` (`In`, `Out`, `InOut`). Чтобы нарисовать кривую, `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) выдаёт её значения в `count` равноотстоящих точках от 0 до 1; `Animated.sampleSpring` и `Animated.sampleDecay` (`sample_spring`, `sample_decay`) выдают значения пружины или затухания по одному на кадр (при `fps`, по умолчанию 60) от `from` (0) до её завершения. Все три берутся из нативного кода, на котором выполняются анимации. Везде, где в TSX принимается `Easing`, можно передать имя (`"easeOut"`), кубическую кривую Безье в виде четырёх чисел или кривую из объекта `Easing`.

| Кривая | Rust | Форма |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` по умолчанию равен 2) |
| `sin` | `Curve::Sin` | Синусоидальная |
| `circle` | `Curve::Circle` | Круговая |
| `exp` | `Curve::Exp` | Экспоненциальная |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Пружинящий перелёт (`bounciness` по умолчанию равен 1) |
| `back(s)` | `Curve::Back(s)` | Откатывается назад перед движением; `s` — величина перелёта (по умолчанию 1.70158) |
| `bounce` | `Curve::Bounce` | Отскакивает в конце |

`Easing.steps(count, position)` — это CSS `steps()`: значение скачет между `count` уровнями вместо плавного движения (покадровый спрайт, тикающая стрелка). `position` указывает, где происходят скачки: `"jump-end"` (по умолчанию, также `"end"`), `"jump-start"` (`"start"`), `"jump-none"` или `"jump-both"`; Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

Кривые даны в форме «in» (медленно в начале). `Easing.out(curve)` обращает кривую, `Easing.inOut(curve)` делает её симметричной, `Easing.in(curve)` оставляет как есть; в Rust это `EaseMode` у `Easing::Curve`.

```rust tabs
let _ = value.timing(1.0, 600.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
let _ = value.timing_with(1.0, Timing { easing: Easing::Bezier(0.2, 0.0, 0.0, 1.0), ..Timing::default() });
let _ = value.timing_with(1.0, Timing { easing: Easing::EaseOut, ..Timing::default() });
```

```tsx tabs
value.timing(1, { duration: 600, easing: Easing.out(Easing.back()) });
value.timing(1, { easing: Easing.bezier(0.2, 0, 0, 1) });
value.timing(1, { easing: "easeOut" });
```

### LayoutAnimation

```ts
const LayoutAnimation: {
  configureNext(config: LayoutAnimationConfig, onEnd?: () => void): void;
  create(duration: number, type?: LayoutAnimationType, property?: LayoutAnimationProperty): LayoutAnimationConfig;
  Types: { easeInEaseOut; spring; linear; easeIn; easeOut; keyboard };
  Properties: { opacity; scaleXY };
  Presets: { easeInEaseOut: LayoutAnimationConfig; linear: LayoutAnimationConfig; spring: LayoutAnimationConfig };
  easeInEaseOut(onEnd?: () => void): void;
  linear(onEnd?: () => void): void;
  spring(onEnd?: () => void): void;
};

interface LayoutAnimationConfig {
  duration: number;                // ms
  create?: LayoutAnimationAnimation;    // views inserted
  update?: LayoutAnimationAnimation;    // views moved or resized
  delete?: LayoutAnimationAnimation;    // views removed
}

interface LayoutAnimationAnimation {
  type?: "easeInEaseOut" | "spring" | "linear" | "easeIn" | "easeOut" | "keyboard";
  property?: "opacity" | "scaleXY" | "scale";
  duration?: number;
  delay?: number;
  springDamping?: number;          // 0..1, default 0.7
}
```

`LayoutAnimation.configureNext(config)` нативно анимирует изменения раскладки следующего коммита: представления, которые перемещаются или меняют размер, плавно переходят к новым фреймам, новые представления появляются (с проявлением или увеличением, согласно `property`), а удалённые исчезают. Вызывайте его непосредственно перед изменением состояния, меняющим раскладку. Rust: `animate_layout(LayoutAnimation)`, с пресетами `nsh_core::element::LayoutAnimation` или его переходами `create`, `update` и `delete`.

| Элемент | Rust | Описание |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Анимирует изменения следующего коммита; `onEnd` вызывается по завершении. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | Конфигурация с одной и той же кривой для всех трёх фаз. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 мс, представления проявляются и угасают. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 мс с постоянной скоростью. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 мс; фреймы пружинят (затухание 0.4), представления плавно появляются и исчезают линейно. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | Сокращения для `configureNext(Presets.…)`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Имена в виде констант. |

```rust tabs
let open = signal(false);
let toggle = move || {
    animate_layout(LayoutAnimation::SPRING);
    open.update(|o| *o = !*o);
};

view()
    .child(text("Details").on_press(toggle))
    .child(when(move || open.get(), || text("Shown with a spring.")))
```

```tsx tabs
const open = signal(false);
const toggle = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  open.update((o) => !o);
};

<View>
  <Text onPress={toggle}>Details</Text>
  <If when={open()}>
    <Text>Shown with a spring.</Text>
  </If>
</View>
```

## Device

API устройства сообщает приложению об устройстве и его окружении. Rust-код вызывает функции `nsh_core::prelude` (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...); TSX импортирует их из `nsh`. Размер окна, цветовая схема, масштаб шрифта, плотность пикселей, локаль и состояние приложения реактивны: читайте их в привязке (замыкание, передаваемое элементу в Rust, JSX в TSX), `computed` или `effect`, и то, что их читает, обновляется, когда платформа сообщает об изменении (поворот, изменение размера окна, переключение на тёмную тему, изменение размера текста или языка, переход на экран другой плотности, выход из приложения и возврат в него).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

См. руководство [Device and environment](../docs/device-and-environment.md).

### windowSize

```ts
const windowSize: Accessor<Size>;
```

Размер поверхности в пунктах: окна или встроенного `NshAppView` / `NshView`. Реактивно. Rust: `window() -> Size<Points>`.

```rust tabs
let wide = move || window().width >= px(600.0);

view().style_when(wide, |s| s.flex_row())
```

```tsx tabs
const wide = () => windowSize().width >= 600;

<View style={{ flexDirection: wide() ? "row" : "column" }}>{/* ... */}</View>
```

### colorScheme

```ts
const colorScheme: Accessor<"light" | "dark">;
```

Отображаемое оформление: системное, если приложение не задало своё (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). Реактивно. Rust: `dark() -> bool`; цвета темы (`AdaptiveColor`) и вариант стиля `.dark(…)` следуют за ним без его чтения. Вариант `dark:` из Tailwind тоже следует за ним (см. [Tailwind](../docs/tailwind.md)).

```rust tabs
view().flex_1().bg(move || if dark() { black() } else { white() })
```

```tsx tabs
const dark = () => colorScheme() === "dark";

<View style={{ flex: 1, backgroundColor: dark() ? "#000" : "#fff" }} />
```

### fontScale

```ts
const fontScale: Accessor<number>;
```

Предпочитаемый пользователем размер текста относительно размера по умолчанию (`1` — размер по умолчанию; Dynamic Type на iOS, размер шрифта на Android) или размер текста, который вместо него задаёт встраивающее приложение. Реактивно. Rust: `font_scale() -> f32`. Текст уже масштабируется вместе с ним, если не задан `allowFontScaling={false}`; читайте его, когда за ним должны следовать другие размеры, например значки рядом с текстом.

### locale

```ts
const locale: Accessor<string>;
```

Локаль пользователя в виде тега BCP 47 (`"en-US"`, `"zh-Hans-CN"`) или локаль, которую вместо неё задаёт встраивающее приложение. Реактивно. Rust: `locale() -> Locale` (`locale().as_str()` — тег). `Intl` по умолчанию форматирует под неё; читайте её, чтобы выбирать строки собственных переводов ([Device and environment](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

Используется ли приложение, в терминах `AppState` из React Native: `"active"` — на переднем плане и принимает ввод, `"inactive"` — видно, но без фокуса (фокус у другого приложения или окна, либо система показывает что-то поверх, например переключатель приложений или входящий звонок), `"background"` — не видно (в фоне, свёрнуто, скрытая вкладка браузера). Приложение, показываемое внутри нативного приложения, следует состоянию этого приложения. Реактивно. Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`).

Читайте его в эффекте, чтобы приостанавливать работу, которую никто не видит, и возобновлять её, когда приложение возвращается:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

### setColorScheme

```ts
function setColorScheme(scheme: "light" | "dark" | "system"): void;
```

Сразу показывает приложение в `scheme` независимо от системного оформления: `colorScheme()`, классы `dark:`, тема компонентов и элементы управления платформы (алерты, стиль строки состояния по умолчанию) следуют за ним; `"system"` снова следует за системой. `nsh.json` `"appearance"` задаёт его с самого начала. Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`).
### platform

```ts
const platform: Platform;

interface Platform {
  readonly os: "ios" | "android" | "macos" | "windows" | "linux" | "web";
  readonly version: string;
  readonly idiom: "phone" | "pad" | "mac" | "tv" | "desktop";
  readonly desktop: boolean;
  readonly catalyst: boolean;
  select<T>(spec: PlatformSelectSpec<T>): T | undefined;
}
```

Платформа, на которой работает приложение; во время работы она не меняется.

| Член | Rust | Описание |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` — строка в TS) | Операционная система. iOS, симулятор iOS и Mac Catalyst сообщают `"ios"`, браузеры — `"web"`. |
| `version` | `os_version() -> (u16, u16)` | iOS и десктопы: версия ОС (`"17.5"`); Android: уровень API (`"35"`); веб: `"0.0"`. Rust отдаёт мажорную и минорную версии, а на Android — уровень API и 0. |
| `idiom` | `idiom() -> Idiom` | Тип устройства: `"desktop"` ровно там, где `desktop` равно `true`; в остальных случаях `"phone"`, `"pad"` (iPad, планшет на Android, Mac Catalyst в идиоме iPad), `"mac"` (Mac Catalyst в идиоме Mac из UIKit, мобильная идиома) или `"tv"` (Apple TV, Android TV). |
| `desktop` | `is_desktop() -> bool` | Применяется поведение десктопа: macOS, Windows, Linux и браузеры с мышью и широким окном. Ему следуют props `desktop={{…}}`, `select({ desktop })` и `idiom` `"desktop"`. Mac Catalyst запускает бэкенд iOS, поэтому он считается мобильным: там применяются props `ios={{…}}`. `isAvailable` у [`nsh/desktop`](./nsh-desktop.md#isavailable) — более узкая проверка для его API окон и меню, которые есть в macOS, Windows и Linux. |
| `catalyst` | `is_catalyst() -> bool` | Приложение работает под Mac Catalyst, в идиоме Mac или iPad (`os` равно `"ios"`). |
| `select(spec)` | `match os() { … }` | Значение для этой платформы (см. ниже). |

```rust tabs
let columns = if is_desktop() { 3 } else { 1 };
```

```tsx tabs
const columns = platform.desktop ? 3 : 1;
```

#### platform.select

```ts
interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  macos?: T;
  windows?: T;
  linux?: T;
  web?: T;
  mobile?: T;   // platform.desktop false: iOS (Mac Catalyst included), Android, phone and tablet browsers
  desktop?: T;  // platform.desktop true: macOS, Windows, Linux, desktop browsers
  native?: T;   // every platform but the web
  default?: T;
}
```

Возвращает значение для текущей ОС (`ios`, `android`, `web`, ...), иначе `desktop` или `mobile` (по `platform.desktop`), иначе `native` (все платформы, кроме веба), иначе `default`, иначе `undefined`. Код на Rust использует match по `os()` (и `is_desktop()` для `mobile` / `desktop`).

```rust tabs
use nsh_core::platform::Os;

let card = view().p_4();
let card = match os() {
    Os::Ios => card.shadow([BoxShadow {
        offset_y: px(2.0),
        blur: px(8.0),
        color: rgba(0x00000026).into(),
        ..BoxShadow::default()
    }]),
    Os::Android => card.elevation(px(4.0)),
    _ => card,
};
```

```tsx tabs
const shadow = platform.select({
  ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.15)" },
  android: { elevation: 4 },
});
```

> [!TIP]
> Для props, которые есть только на одной платформе, предпочитайте props `ios={{…}}` / `android={{…}}` у элементов и компонентов TSX вместо ветвления по `platform` (см. [Платформо-специфичный код](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

Количество физических пикселей устройства на пункт (например, `3` на большинстве iPhone). Значение реактивное: оно меняется, когда окно переезжает на экран с другой плотностью (на Mac Catalyst, десктопах или внешнем дисплее) и когда настройка размера экрана в Android меняет плотность. Rust: `pixel_ratio() -> f32` и `round_to_nearest_pixel(points)` для длины в целых физических пикселях; в TSX эта длина — `Math.round(x * pixelRatio()) / pixelRatio()`.

```rust tabs
let hairline = move || px(1.0 / pixel_ratio());
```

```tsx tabs
const hairline = () => 1 / pixelRatio();
```

### openUrl

```ts
function openUrl(url: string): Promise<OpenUrlResult>;

interface OpenUrlResult {
  opened: boolean;
}
```

Открывает `url` вне приложения: веб-страницу в браузере, ссылку `mailto:` в почтовом приложении, ссылку `tel:` в приложении телефона и любую схему, зарегистрированную другим приложением (`maps:`, собственные ссылки `lb://` хост-приложения). Промис завершается значением `{ opened }` — открылось ли что-нибудь: `false`, если схему не обрабатывает ни одно приложение. Rust: `open_url(url)` от `nsh_core::prelude` — ответ, который нужно ожидать в задаче (или отбросить), тот же `bool`.

```rust tabs
button()
    .child(text("Contact us"))
    .on_press(|| {
        spawn(async {
            if !open_url("mailto:help@example.com").await {
                log::warn!("no mail app");
            }
        });
    })
```

```tsx tabs
<Button
  onPress={async () => {
    const { opened } = await openUrl("mailto:help@example.com");
    if (!opened) {
      console.warn("no mail app");
    }
  }}
>
  <Text>Contact us</Text>
</Button>
```

- URL должен быть абсолютным (содержать схему). URL, которые выполнили бы код или обратились бы к данным самого приложения, — `javascript:`, `data:`, `blob:`, `file:`, `about:` и `asset:` — отклоняют промис с `TypeError`, как и относительные адреса. `openUrl` никогда не бросает исключение: любая ошибка приводит к отклонению промиса.
- Приложению, которое объявляет capabilities, нужно `openUrl`: `"openUrl": true` для любой схемы или `"openUrl": { "schemes": ["https", "mailto"] }` для перечисленных; остальные URL отклоняются с `Error`, у которой `code` равно `"ERR_ACCESS_DENIED"`, `permission` `"openUrl"` и `resource` — URL (см. [Песочница и capabilities](../docs/sandbox-and-capabilities.md)). В Rust `open_url` отвечает `false` для них и пишет причину в лог.
- Сначала URL видит встраивающее приложение и может направить его в собственный роутер (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; см. [iOS](../docs/ios.md#links-the-app-opens) и [Android](../docs/android.md#links-the-app-opens)). Тогда `opened` равно `true`.
- Каждая платформа открывает URL собственным средством: `UIApplication.open` на iOS (приложение-хост при встраивании), intent `ACTION_VIEW` на Android, `NSWorkspace` на macOS, `ShellExecuteW` на Windows, `GtkUriLauncher` на Linux, `open_url` из GPUI, новая вкладка в вебе. `nsh test` записывает URL вместо того, чтобы открывать их.
- [`TextView`](../elements/text-view.md) открывает свои ссылки таким образом с помощью `links="open"`.

<a id="layout-direction"></a>

### Направление раскладки

Направление раскладки следует языку пользователя: в языке с письмом справа налево (арабском, иврите и т. д.) приложение раскладывается справа налево, строки идут от правого края, а свойства стиля `left` / `right` (`marginLeft`, `paddingRight`, ...) означают начало и конец. Изменения применяются сразу, без перезапуска.

Стиль `direction` у представления (`"ltr"`, `"rtl"` или `"inherit"`, по умолчанию) задаёт направление его собственного поддерева; в Rust — `.direction(LayoutDirection::..)`.

```rust tabs
view().direction(LayoutDirection::Rtl).flex_row().gap_2().child(text("First")).child(text("Second"))
```

```tsx tabs
<View style={{ direction: "rtl", flexDirection: "row", gap: 8 }}>
  <Text>First</Text>
  <Text>Second</Text>
</View>
```

<a id="related"></a>

### См. также

- Safe area insets (Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`) и программная клавиатура (Rust `keyboard_height()`; TSX `keyboardFrame()`) описаны в разделе [Safe area и клавиатура](#safe-area-and-keyboard).
- Настройки screen reader и уменьшения анимации описаны в разделе [Accessibility](#accessibility).

## PanResponder

Pan responders — это жесты перетаскивания поверх системы gesture responder: элемент захватывает касания жеста, а затем получает только их вместе с состоянием жеста, которое само отслеживает центроид касаний, пройденное расстояние и скорость. Код на Rust захватывает касания с помощью `.claim_touches(TouchClaim::…)` и получает их через слушатели `.on_responder_*`, чей `ResponderEvent` несёт `PanGesture`, всё это в `nsh_core::prelude`; TSX импортирует `PanResponder` из `nsh`, колбэки `onPanResponder…` которого получают событие касания и состояние жеста.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Pan responder передаёт каждое движение в код приложения, поэтому он подходит для жестов, которые меняют состояние приложения (переупорядочивание, решения о swipe-to-delete). Чтобы двигать представление пальцем, быстрее использовать нативные значения жестов: `.pan_values(x, y)`, `.pinch_value(scale)` и `.rotation_value(angle)` в Rust, props `pan={{ x, y }}`, `pinch` и `rotation` в TSX. Перетаскивание записывает [animated values](#animation) в UI-потоке, а приложение узнаёт только о начале и конце (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`). См. [Касания и жесты](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Создаёт pan responder. Передайте его `panHandlers` через spread представлению, которое должно получать жест. В Rust представление само захватывает касания и слушает их:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view().flex_1().child(
        view()
            .size(px(64.0))
            .rounded(px(32.0))
            .bg(rgb(0x6366f1))
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
                pos.set((x + e.gesture.delta.x.0, y + e.gesture.delta.y.0));
            })
            .on_responder_release(move |e: &ResponderEvent| {
                log::info!("released at {:.0} pt/s", e.gesture.vx);
            }),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function App() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => (start = pos()),
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log(`released at ${g.vx.toFixed(0)} pt/s`),
  });
  return (
    <View style={{ flex: 1 }}>
      <View
        {...pan.panHandlers}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#6366f1",
          transform: [{ translateX: pos().x }, { translateY: pos().y }],
        }}
      />
    </View>
  );
}

mount(App);
```

<a id="callbacks"></a>

### Колбэки

Каждый колбэк получает событие касания (`GestureResponderEvent`, из [`nsh`](#types)) и состояние жеста. В Rust захват решает с помощью `.ask(|request: &ClaimRequest| …)`, вызывая `request.claim()`, чтобы забрать касания (без `ask` он забирает их всегда), а каждый слушатель получает `ResponderEvent`, у которого `gesture` — это состояние.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Колбэк | Rust | Возвращает | Когда вызывается |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | Палец коснулся экрана: верните `true`, чтобы стать responder. Опрашивается от затронутого представления наружу. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | То же, но опрашивается снаружи внутрь, раньше всплывающего варианта (родитель забирает жест у потомков). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | Палец движется: верните `true`, чтобы стать responder (например, только после `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | То же, фаза capture. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | Это представление теперь responder: жест начинается. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | Другое представление является responder и не отпускает касания. |
| `onPanResponderStart` | `.on_responder_start(…)` | | Палец коснулся экрана, пока представление было responder. |
| `onPanResponderMove` | `.on_responder_move(…)` | | Пальцы сдвинулись. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | Палец поднялся, пока представление было responder. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | Поднялся последний палец: жест завершён. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | Другое представление (или нативный жест, например scroll view) забрало касания. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` оставляет их себе | `boolean` | Другое представление хочет забрать касания: верните `false`, чтобы оставить их себе (по умолчанию `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | Не давать ли нативным scroll view забирать касания, пока представление является responder (по умолчанию `true`). |

### PanResponderGestureState

```ts
interface PanResponderGestureState {
  stateID: number;
  moveX: number;               // latest centroid of the touches (surface points)
  moveY: number;
  x0: number;                  // the centroid when the responder was granted
  y0: number;
  dx: number;                  // distance moved since the grant
  dy: number;
  vx: number;                  // velocity, points per second
  vy: number;
  numberActiveTouches: number;
}
```

Rust: `PanGesture`, точки — `Point<Points>`.

| Поле | Rust | Описание |
|---|---|---|
| `stateID` |  | Идентифицирует жест. |
| `moveX`, `moveY` | `position` | Последняя позиция центроида касаний, в пунктах поверхности. |
| `x0`, `y0` | `origin` | Где находился центроид, когда был предоставлен responder. |
| `dx`, `dy` | `delta` | Пройденное расстояние с момента предоставления. |
| `vx`, `vy` | `vx`, `vy` | Скорость в пунктах в секунду. |
| `numberActiveTouches` | `active_touches` | Количество пальцев на экране. |

<a id="inside-scroll-views"></a>

### Внутри scroll view

Пока pan responder является responder, окружающие его нативные scroll view не прокручиваются (`onShouldBlockNativeResponder` по умолчанию равно `true`). Чтобы горизонтальный свайп уживался с вертикальной прокруткой, становитесь responder только при горизонтальных движениях:

```rust tabs
view()
    .claim_touches(TouchClaim::on_move().ask(|request: &ClaimRequest| {
        let d = request.event.gesture.delta;
        if d.x.0.abs() > 10.0 && d.x.0.abs() > d.y.0.abs() {
            request.claim();
        }
    }))
    .on_responder_move(move |e: &ResponderEvent| offset.set(e.gesture.delta.x.0))
    .on_responder_release(move |e: &ResponderEvent| {
        if e.gesture.delta.x.0.abs() > 120.0 { remove() } else { offset.set(0.0) }
    })
    .on_responder_terminate(move |_: &ResponderEvent| offset.set(0.0))
```

```tsx tabs
const swipe = PanResponder.create({
  onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
  onPanResponderMove: (_, g) => offset.set(g.dx),
  onPanResponderRelease: (_, g) => (Math.abs(g.dx) > 120 ? remove() : offset.set(0)),
  onPanResponderTerminate: () => offset.set(0),
});
```

Для pan, который платформа распознаёт сама, `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` принимает решение в главном потоке по мере движения пальцев. Базовые props responder (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) также можно использовать напрямую на любом элементе; см. [Элементы](../elements/index.md).

## Clipboard

API буфера обмена читает и записывает системный буфер обмена: текст — везде (`UIPasteboard` на iOS, `ClipboardManager` на Android, `NSPasteboard`, GDK и буфер обмена Win32 на десктопах, `navigator.clipboard` в вебе), изображения — на iOS, десктопах и в вебе, а файлы, скопированные в файловом менеджере, — на десктопах и Mac Catalyst. Код на Rust вызывает функции `nsh_core::prelude` (`set_clipboard`, `clipboard_string`, ...); TSX импортирует `Clipboard` из `nsh`.

```rust tabs
use nsh_core::prelude::*; // set_clipboard, clipboard_string, clipboard_image, ...
use nsh_core::element::ClipboardImage;
```

```tsx tabs
import { Clipboard } from "nsh";
```

```ts
const Clipboard: {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  hasText(): Promise<boolean>;
  writeImage(src: string): Promise<void>;
  readImage(): Promise<ClipboardImage | null>;
  hasImage(): Promise<boolean>;
  readFiles(): Promise<string[]>;
};

interface ClipboardImage {
  url: string; // a URL that Image shows and fetch reads
  size: PixelSize; // in pixels
}
```

| TS | Rust (`nsh_core::prelude`) |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

Операции чтения в Rust возвращают ответы, которые нужно ожидать в задаче (`spawn` или функция модуля `async`); `ClipboardImage` — это `nsh_core::element::ClipboardImage` с `url` и `size` (`Size<DevicePixels>`).

Изображения проходят через буфер обмена на iOS, десктопах и в вебе. На Android буфер обмена переносит текст: `writeImage` и
`readImage` отклоняются с `Error`, у которой `code` равно `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`, а `hasImage` завершается
`false`. В Rust `set_clipboard_image` оставляет буфер обмена как есть, а `clipboard_image` отвечает `None`.

Пользователь также может сам скопировать текст из [выделяемого текста](../elements/text.md); API буфера обмена предназначен для копирования из кода, например по кнопке «Копировать».

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

Помещает `text` в буфер обмена, заменяя прежнее содержимое. Rust: `set_clipboard(text)`.

```rust tabs
use nsh_core::prelude::*;

fn copy_button(code: Signal<String>) -> impl IntoElement {
    let copied = signal(false);
    view()
        .role(AccessibilityRole::Button)
        .on_press(move || {
            set_clipboard(code.get());
            copied.set(true);
        })
        .child(text(move || if copied.get() { "Copied" } else { "Copy" }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Clipboard } from "nsh";

const copied = signal(false);

<View
  onPress={async () => {
    await Clipboard.writeText(code());
    copied.set(true);
  }}
>
  <Text>{copied() ? "Copied" : "Copy"}</Text>
</View>;
```

### Clipboard.readText

```ts
readText(): Promise<string>;
```

Завершается текстом из буфера обмена или `""`, если текста в нём нет. Rust: `clipboard_string()`. На iOS чтение буфера обмена может показать системное уведомление о вставке («App pasted from …»), а на Android 10 и новее читать его может только приложение на переднем плане. Читайте его, когда пользователь просит вставить, а не на каждом экране.

```rust tabs
spawn(async move {
    let pasted = clipboard_string().await;
    if !pasted.is_empty() {
        code.set(pasted.trim().to_string());
    }
});
```

```tsx tabs
const pasted = await Clipboard.readText();
if (pasted) code.set(pasted.trim());
```

### Clipboard.hasText

```ts
hasText(): Promise<boolean>;
```

Завершается значением, содержит ли буфер обмена текст, без его чтения: на iOS уведомления о вставке нет. Rust: `clipboard_has_string()`. Используйте это, чтобы решить, показывать ли кнопку «Вставить». В вебе браузеры могут определить это только чтением, поэтому может быть запрошено разрешение пользователя.

```rust tabs
let can_paste = signal(false);
spawn(async move { can_paste.set(clipboard_has_string().await) });
```

```tsx tabs
const canPaste = signal(false);
Clipboard.hasText().then((has) => canPaste.set(has));
```

### Clipboard.readImage

```ts
readImage(): Promise<ClipboardImage | null>;
```

Завершается изображением из буфера обмена или `null`, если изображения в нём нет: вставленным скриншотом либо изображением, скопированным в браузере
или графическом редакторе. Rust: `clipboard_image()`, `None`, если изображения нет. `url` — это URL изображения (PNG или собственные
JPEG, GIF, WebP или BMP из буфера обмена), который [`Image`](../elements/image.md) показывает как свой `src` и который читает `fetch`:
`fetch(url)` отдаёт его байты, например для загрузки на сервер. `size` (`width` и `height`) — его размер в пикселях после декодирования. Как и в случае
`readText`, читайте его, когда пользователь просит вставить. Читаются изображения размером до 48 МБ (в закодированном виде), чтобы изображение помещалось в
память приложения; более крупное отклоняется с `Error`, у которой `code` равно `"ERR_NSH_QUOTA_EXCEEDED"` (в сообщении указаны размер
изображения и лимит), тогда как `hasImage` завершается `true`. Rust: `clipboard_image()` отвечает `None` для такого случая.

```rust tabs
use base64::Engine as _;
use nsh_core::{element::ClipboardImage, prelude::*};

fn attachments() -> impl IntoElement {
    let attachments = signal(Vec::<ClipboardImage>::new());
    let paste = move || {
        spawn(async move {
            if let Some(image) = clipboard_image().await {
                attachments.update(|list| list.push(image));
            }
        });
    };
    view()
        .flex_row()
        .gap_2()
        .child(text("Paste").on_press(paste))
        .child(each(
            attachments,
            |shot: &ClipboardImage| shot.url.clone(),
            |shot, _| image(move || shot.with(|s| s.url.clone())).size(px(64.0)).rounded(px(8.0)),
        ))
}

async fn upload(image: &ClipboardImage) -> Result<HttpResponse, String> {
    let (_, data) = image.url.split_once(',').ok_or("not a data: URL")?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let request = HttpRequest::post("https://example.com/upload", bytes).header("Content-Type", "image/png");
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, View } from "nsh";
import { Clipboard, type ClipboardImage } from "nsh";

const attachments = signal<ClipboardImage[]>([]);

async function paste() {
  const image = await Clipboard.readImage();
  if (image) attachments.set([...attachments(), image]);
}

async function upload(image: ClipboardImage) {
  const body = new FormData();
  body.append("file", await (await fetch(image.url)).blob(), "screenshot.png");
  await fetch("https://example.com/upload", { method: "POST", body });
}

<View class="flex-row gap-2">
  <Each of={attachments()}>
    {(image) => <Image src={image().url} style={{ width: 64, height: 64, borderRadius: 8 }} />}
  </Each>
</View>;
```

Приложение в стиле чата, где пользователи вставляют скриншоты в поле ввода сообщения, привязывает сочетание клавиш вставки, пока поле ввода в фокусе,
и забирает изображение, если оно есть:

```rust tabs
use nsh_core::keymap::When;

on_key_with("mod+v", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| {
    spawn(async move {
        if clipboard_has_image().await {
            paste().await;
        } else {
            insert_text(&clipboard_string().await);
        }
    });
});
```

```tsx tabs
import { keymap } from "nsh";

keymap.bind("mod+v", async () => {
  if (await Clipboard.hasImage()) return paste();
  insertText(await Clipboard.readText());
}, { when: "always" });
```

### Clipboard.hasImage

```ts
hasImage(): Promise<boolean>;
```

Завершается значением, содержит ли буфер обмена изображение, без его чтения: на iOS уведомления о вставке нет. Rust:
`clipboard_has_image()`. На Android завершается `false`.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

Помещает в буфер обмена изображение из `src` — URL `data:` в base64 или `url`, который дал `readImage`, — заменяя прежнее содержимое.
Rust: `set_clipboard_image(src)`. На Windows принимается PNG — формат, который читают браузеры, Office и Snipping Tool. На
Android отклоняется с `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.

```rust tabs
set_clipboard_image(image.url.clone());
```

```tsx tabs
await Clipboard.writeImage(image.url);
```

### Clipboard.readFiles

```ts
readFiles(): Promise<string[]>;
```

Завершается URL `file:` файлов и папок, скопированных в файловом менеджере (Finder, Explorer, Files), в их
порядке, или `[]`: теми же URL, которые даёт [file drop](../elements/view.md#desktop-file-drops). Rust: `clipboard_files()`.
Разберите URL, чтобы получить его путь.

```rust tabs
let paths: Vec<std::path::PathBuf> = clipboard_files()
    .await
    .iter()
    .filter_map(|file| url::Url::parse(file).ok()?.to_file_path().ok())
    .collect();
```

```tsx tabs
const files = await Clipboard.readFiles();
const names = files.map((url) => decodeURIComponent(new URL(url).pathname.split("/").pop()!));
```

> [!NOTE]
> Если ваше приложение объявляет `capabilities` в `nsh.json`, доступ к буферу обмена должен быть выдан с помощью `"clipboard": true`. Без него каждая функция `Clipboard` отклоняется с `Error`, у которой `code` равно `"ERR_ACCESS_DENIED"`, `permission` `"clipboard"` и `resource` `""`, и ничего не попадает в системный буфер обмена. В Rust операции записи оставляют буфер обмена как есть, а операции чтения отвечают так, как отвечал бы пустой буфер обмена (`""`, `None`, пустой список, `false`), а отказ записывается в лог. См. [Песочница и capabilities](../docs/sandbox-and-capabilities.md).
>
> ```tsx
> try {
>   await Clipboard.writeText(code());
> } catch (error) {
>   if (error.code === "ERR_ACCESS_DENIED") showHint("Copying is turned off for this app");
>   else throw error;
> }
> ```
## Picker

API picker показывает системный выбор фотографий и передаёт приложению изображения, выбранные пользователем: Photos picker на
iOS (`PHPickerViewController`), Photo Picker на Android, панель открытия или файловый диалог на десктопах и file
input в браузере. На iOS и Android picker работает вне приложения и передаёт только то, что выбрал пользователь, поэтому
разрешение на доступ к фототеке не требуется. Каждое выбранное изображение приходит как `File` (TSX) или `PickedFile` (Rust), байты которого остаются нативными:
показывайте его с помощью `URL.createObjectURL(file)` в [`Image`](../elements/image.md), загружайте с помощью `fetch` и
`FormData`. Код на Rust вызывает `pick_images` из `nsh_core::prelude`; TSX импортирует `Picker` из `nsh`.

```rust tabs
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*; // pick_images
```

```tsx tabs
import { Picker, type PickedImage } from "nsh";
```

```ts
const Picker: {
  pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
};

interface PickImagesOptions {
  multiple?: boolean; // let the user pick several (false: one)
  limit?: number; // at most this many when multiple (up to 100)
  maxDimension?: number; // scale images whose longer side is longer, in pixels
  quality?: number; // JPEG quality from 0 to 1 (0.9)
  format?: "compatible" | "current"; // "compatible": HEIC and the like as JPEG
}

interface PickedImage {
  file: File; // name, type, size in bytes and the bytes
  size: PixelSize; // upright
}
```

| TS | Rust |
|---|---|
| `await Picker.pickImages(options)` | `pick_images(request).await -> Vec<PickedFile>` |
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 означает до 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

Показывает picker и завершается с изображениями, которые выбрал пользователь, в порядке выбора, или с `[]`, если пользователь отменил выбор.
Rust: `pick_images(request)` — ответ, которого нужно дождаться в задаче (`spawn` или функция модуля `async`). `pickImages`
никогда не выбрасывает исключение: параметры вне допустимого диапазона (`limit: 0`, `quality` вне интервала от 0 до 1) отклоняют промис с `RangeError`, а
выбор, который не разрешён возможностями (capabilities) приложения, отклоняется с `ERR_ACCESS_DENIED` (см. ниже). Отмена — это ответ пользователя, а не
сбой: она завершается с `[]`.

Изображения приходят готовыми к отправке:

- **Форматы, которые принимают все браузеры и серверы.** JPEG, PNG, GIF и WebP приходят как есть; фотография, сохранённая в другом
  формате (HEIC на iPhone, HEIF, TIFF), приходит как JPEG. `format: "current"` сохраняет исходный формат.
- **Нативное уменьшение.** С `maxDimension` изображение, у которого длинная сторона больше заданной, уменьшается до этого размера, поворачивается в правильную ориентацию и
  кодируется заново: PNG как PNG, всё остальное как JPEG с `quality`. Фотографии с телефона имеют от 12 до 48 мегапикселей; уменьшение
  до 2048 пикселей перед загрузкой делает их размером в несколько сотен килобайт. `quality` тоже заново кодирует JPEG.
- **Что отображается.** `size` — размер изображения в пикселях в том виде, в каком оно отображается, с учётом ориентации камеры. Изображение, которое NSH
  кодирует заново, не содержит метаданных (в том числе местоположения); изображение, пришедшее как есть, сохраняет свои.

В Windows, Linux и в окнах GPUI диалог предлагает форматы, которые принимает запрос (с `"compatible"`: JPEG, PNG,
GIF и WebP), а файлы приходят как хранятся, в своём исходном размере.

Редактор сообщений в чате прикрепляет фотографию, показывает её во время набора сообщения и загружает при отправке:

```rust tabs
use nsh_core::geometry::{DevicePixels, Percentage};
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*;

fn attach_button(attached: Signal<Option<PickedFile>>) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .accessibility_label("Choose a photo")
        .on_press(move || {
            let mut request = PickRequest::new(false, 1);
            request.max_dimension = Some(DevicePixels(2048));
            request.quality = Some(Percentage(0.85));
            let picked = pick_images(request);
            spawn(async move {
                if let Some(file) = picked.await.into_iter().next() {
                    attached.set(Some(file));
                }
            });
        })
        .child(text("Photo"))
}

async fn upload(file: &PickedFile) -> Result<HttpResponse, String> {
    let request = HttpRequest::post("https://example.com/upload", file.data.to_vec())
        .header("Content-Type", file.mime.as_str());
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, Text, View } from "nsh";
import { Picker } from "nsh";

const attached = signal<{ file: File; src: string } | null>(null);

async function choosePhoto() {
  const [picked] = await Picker.pickImages({ maxDimension: 2048, quality: 0.85 });
  if (picked) attached.set({ file: picked.file, src: URL.createObjectURL(picked.file) });
}

async function send(text: string) {
  const body = new FormData();
  body.append("text", text);
  if (attached()) body.append("photo", attached()!.file);
  await fetch("https://example.com/messages", { method: "POST", body });
  if (attached()) URL.revokeObjectURL(attached()!.src);
  attached.set(null);
}

<View class="flex-row items-center gap-2">
  <View role="button" accessibilityLabel="Choose a photo" onPress={choosePhoto}>
    <Text>Photo</Text>
  </View>
  <If when={attached()}>
    <Image src={attached()!.src} style={{ width: 48, height: 48, borderRadius: 8 }} />
  </If>
</View>;
```

Несколько фотографий сразу:

```rust tabs
let picked = pick_images(PickRequest::new(true, 9));
spawn(async move {
    let files = picked.await;
    photos.update(|list| list.extend(files));
});
```

```tsx tabs
const images = await Picker.pickImages({ multiple: true, limit: 9, maxDimension: 2048 });
photos.set([...photos(), ...images.map((image) => URL.createObjectURL(image.file))]);
```

<a id="embedding-apps"></a>

### Встраивающие приложения

Приложение, которое встраивает NSH и имеет собственный picker (например, со своими альбомами), обрабатывает выбор само: в
Rust `PickerBackend` (`nsh_core::picker`), переданный движку (`EngineConfig::picker` или `AppView::set_picker` в
приложениях GPUI и GPUI Kit), получает `PickRequest` каждого выбора и возвращает файлы, а системный picker не
показывается. Возвращённые им файлы дорабатываются так же, как файлы платформы: обрезаются до лимита запроса, а их размеры, типы и
расширения определяются по их байтам.

<a id="tests"></a>

### Тесты

`nsh test` отвечает на выбор в headless-запусках: `app.onPick(handler)` возвращает файлы, которые выбирает пользователь (`{ name, type, data }`),
а без обработчика выбор отменяется. См. [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Когда ваше приложение объявляет `capabilities` в `nsh.json`, picker должен быть разрешён через `"picker": true`. Без этого
> `pickImages` ничего не показывает и отклоняется с `Error`, у которого `code` равен `"ERR_ACCESS_DENIED"`, `permission`
> `"picker"` и `resource` `""`. В Rust `pick_images` отвечает отсутствием файлов, а отказ записывается в журнал. См.
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

## Speech

API speech превращает сказанное пользователем в текст (диктовка): приложение запускает сессию, платформа слушает
микрофон, а транскрипция приходит по мере роста. macOS и iOS распознают речь системным фреймворком Speech;
система один раз запрашивает у пользователя доступ к микрофону и к распознаванию речи. На других платформах сессия сразу завершается
с ошибкой `"unavailable"`, поэтому проверяйте `Speech.available()` перед показом кнопки микрофона. Код на Rust вызывает
`recognize_speech` из `nsh_core::prelude`; TSX импортирует `Speech` из `nsh`.

```rust tabs
use nsh_core::speech::{SpeechEvent, SpeechRequest};
```

```tsx tabs
import { Speech, type SpeechSession } from "nsh";
```

```ts
const Speech: {
  available(): Promise<boolean>;
  start(options?: SpeechOptions): SpeechSession;
};

interface SpeechOptions {
  /** The language spoken, a BCP 47 tag ("en-US", "zh-CN"); the user's when left out. */
  lang?: string;
  /** Results while the user speaks (true, the default), or only the final one. */
  interim?: boolean;
}

interface SpeechSession {
  on(event: "start", listener: () => void): () => void;
  on(event: "result", listener: (result: SpeechResult) => void): () => void;
  on(event: "end", listener: (end: SpeechEnd) => void): () => void;
  /** The whole transcript so far. */
  readonly text: string;
  readonly ended: boolean;
  stop(): void;
  abort(): void;
}

interface SpeechResult { text: string; isFinal: boolean }
interface SpeechEnd { text: string; error?: SpeechErrorCode }

type SpeechErrorCode =
  | "not-allowed" | "no-speech" | "audio-capture" | "network"
  | "language-not-supported" | "unavailable" | "failed";
```

| TSX | Rust |
|---|---|
| `await Speech.available()` | `speech_available().await -> bool` |
| `Speech.start(options)` | `recognize_speech(request) -> SpeechRecognition` |
| `session.on("result", ...)` | `recognition.next().await -> Option<SpeechEvent>` |
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (его удаление прерывает сессию) |

### Speech.start

Запускает сессию и сразу возвращает её. Сессия сообщает о событиях в таком порядке: `start`, когда микрофон включён и
распознаватель слушает, `result` при каждом изменении транскрипции (`text` — всегда вся транскрипция на данный момент, поэтому
приложение показывает её как есть) и один `end`, после которого ничего не приходит. `stop()` прекращает прослушивание и позволяет распознавателю
закончить обработку услышанного: последний результат с `isFinal: true`, затем `end`. `abort()` сразу завершает сессию без
ошибки и отбрасывает то, о чём не было сообщено. Одновременно работает одна сессия: запуск другой прерывает текущую.

`end` содержит последнюю транскрипцию и, если сессия завершилась сбоем, `error`, названный так же, как в Web Speech API:

| `error` | Когда |
|---|---|
| `"not-allowed"` | Пользователь или система не разрешает доступ к микрофону или распознаванию речи. |
| `"no-speech"` | Ничего не было сказано. |
| `"audio-capture"` | Не удалось использовать микрофон. |
| `"network"` | Распознавателю нужна сеть, но подключиться к ней не удалось. |
| `"language-not-supported"` | Распознаватель не знает `lang`. |
| `"unavailable"` | Эта платформа не распознаёт речь или не может сделать этого сейчас. |
| `"failed"` | Распознаватель дал сбой по другой причине. |

`start` выбрасывает `TypeError` при параметрах неверных типов и `RangeError`, если `lang` не является языковым тегом.

```tsx
import { signal, Speech, type SpeechSession } from "nsh";

const transcript = signal("");
let session: SpeechSession | null = null;

function toggle() {
  if (session && !session.ended) {
    session.stop();
    return;
  }
  session = Speech.start({ lang: "en-US" });
  session.on("result", ({ text }) => transcript.set(text));
  session.on("end", ({ text, error }) => {
    if (error) console.warn("dictation ended:", error);
    else transcript.set(text);
  });
}
```

```rust
use nsh_core::prelude::*;
use nsh_core::speech::{SpeechEvent, SpeechRequest};

async fn dictate() -> String {
    let mut recognition = recognize_speech(SpeechRequest::default());
    let mut text = String::new();
    while let Some(event) = recognition.next().await {
        match event {
            SpeechEvent::Result { text: heard, .. } => text = heard,
            SpeechEvent::End { .. } => break,
            _ => {}
        }
    }
    text
}
```

### Speech.available

Завершается с `true` там, где может работать сессия: на macOS и iOS, а также везде, где встраивающее приложение распознаёт речь само.

### Info.plist

На macOS и iOS система показывает, зачем приложению нужны микрофон и распознавание речи. `nsh package` и
`nsh run` записывают `NSMicrophoneUsageDescription` и `NSSpeechRecognitionUsageDescription` в Info.plist приложения,
если приложение может использовать речь (его разрешение `capabilities` `speech` или оно не объявляет никаких).

<a id="embedding-apps-1"></a>

### Встраивающие приложения

Приложение, которое встраивает NSH и распознаёт речь по-своему (собственным движком или сервисом), обрабатывает сессии само: в
Rust `SpeechBackend` (`nsh_core::speech`), переданный движку (`EngineConfig::speech`), получает
`SpeechRequest` каждой сессии и `SpeechSink`, в который он сообщает из любого потока, и возвращает `SpeechControl`, с которым ядро останавливает и
прерывает сессию. Распознаватель платформы при этом не используется.

<a id="tests-1"></a>

### Тесты

`nsh test` запускает сессии на поддельном распознавателе в headless-запусках: сессия стартует сразу, `app.hear(text)` сообщает
`text` как транскрипцию на данный момент, `app.endSpeech(error?)` завершает её, а `app.speechRequests()` перечисляет сессии, которые
запустило приложение. См. [Testing](../docs/testing-and-trace.md).

> [!NOTE]
> Когда ваше приложение объявляет `capabilities` в `nsh.json`, речь должна быть разрешена через `"speech": true`. Без этого
> `Speech.start` выбрасывает `Error`, у которого `code` равен `"ERR_ACCESS_DENIED"`, `permission` `"speech"` и `resource` `""`.
> В Rust сессия завершается с `not-allowed`, а отказ записывается в журнал. См.
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

## Storage

API storage хранит данные приложения на устройстве: строки по строковому ключу, которые остаются и при следующем запуске приложения. Используйте его для настроек, черновиков, последней открытой пользователем вкладки, кэша того, что прислал сервер, — любого состояния, которое должно пережить процесс приложения. Код на Rust использует `nsh_core::storage::Storage`, TSX импортирует `Storage` из `nsh`; оба читают и записывают одни и те же записи, поэтому приложение с Rust-частью и TSX-частью видит один набор данных.

```rust tabs
use nsh_core::storage::Storage;
```

```tsx tabs
import { Storage } from "nsh";
```

```ts
const Storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
};
```

| TS | Rust (`nsh_core::storage::Storage`) |
|---|---|
| `await Storage.getItem(key)` | `Storage::get_item(key) -> Option<String>` |
| `await Storage.setItem(key, value)` | `Storage::set_item(key, value) -> Result<(), StorageFull>` |
| `await Storage.removeItem(key)` | `Storage::remove_item(key)` |
| `await Storage.keys()` | `Storage::get_all_keys() -> Vec<String>` |
| `await Storage.clear()` | `Storage::clear()` |

Функции Rust синхронные, так как записи находятся в памяти: вызывайте их там, где выполняются компоненты (в их телах, обработчиках и задачах).

У каждого приложения своё хранилище объёмом до 5 МБ для ключей и значений. Вызовы выполняются в том порядке, в котором их делает приложение, поэтому `getItem` после `setItem` видит новое значение, не дожидаясь записи. Чтение происходит из памяти; запись достигает диска в фоне, небольшими порциями.

| Платформа | Где хранятся данные |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` в контейнере приложения |
| Android | `files/nsh/<app id>/storage.json` в приватном каталоге приложения |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | `localStorage` браузера, под ключами, названными по id приложения (`nsh:com.example.todo:…`) |

Повреждённый `storage.json` сохраняется рядом как `storage.json.corrupt`, и приложение запускается с пустым хранилищем; если файл не удаётся прочитать, изменения приложения остаются в памяти, поэтому файл никогда не заменяется.

Id приложения — это `id` в `nsh.json`, и он путешествует вместе с приложением: `nsh build` и `nsh package` записывают его рядом с бандлом, dev-сервер его отправляет, а подписанный пакет несёт тот id, за который ручается сертификат его ключа выпуска. Поэтому каждое приложение хранит свои данные без каких-либо настроек, где бы оно ни работало; приложение без id хранит их под `default`. Встраивающее приложение может выбрать другое место (см. [Embedding on iOS](../docs/ios.md) и [Embedding on Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

Завершается со значением `key` или с `null`, если значения нет. Rust: `Storage::get_item(key)`, `None`, если значения нет.

```rust tabs
let theme = Storage::get_item("theme").unwrap_or_else(|| "system".into());
```

```tsx tabs
const theme = (await Storage.getItem("theme")) ?? "system";
```

### Storage.setItem

```ts
setItem(key: string, value: string): Promise<void>;
```

Устанавливает для `key` значение `value`, заменяя прежнее. Отклоняется с `Error`, у которого `code` равен `"ERR_NSH_QUOTA_EXCEEDED"`, если хранилище вырастет больше 5 МБ; значение при этом не сохраняется. Rust: `Storage::set_item(key, value)`, который в этом случае возвращает `Err(StorageFull)`. Значения — строки: храните структурированные данные как JSON (`serde_json::to_string` в Rust, `JSON.stringify` в TSX) и читайте их обратно (`serde_json::from_str`, `JSON.parse`).

```rust tabs
let draft = serde_json::json!({ "title": title.get(), "body": body.get() });
if let Err(full) = Storage::set_item("draft", draft.to_string()) {
    log::warn!("{full}");
}
```

```tsx tabs
Storage.setItem("draft", JSON.stringify({ title: title(), body: body() }));
```

### Storage.removeItem

```ts
removeItem(key: string): Promise<void>;
```

Удаляет `key` и его значение. Удаление ключа, у которого нет значения, ничего не делает. Rust: `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

Завершается со всеми ключами по порядку. Rust: `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

Удаляет все ключи приложения, например когда пользователь выходит из аккаунта. Rust: `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### Хранение сигнала на устройстве

Прочитайте сохранённое значение при запуске приложения, а затем записывайте его обратно при каждом изменении сигнала:

```rust tabs
use nsh_core::{storage::Storage, prelude::*};

#[component]
pub fn App() -> impl IntoElement {
    let saved = Storage::get_item("count").and_then(|n| n.parse().ok());
    let count = signal(saved.unwrap_or(0_u32));
    effect(move || {
        if let Err(full) = Storage::set_item("count", count.get().to_string()) {
            log::warn!("{full}");
        }
    });
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Pressed {} times", count.get())))
}
```

```tsx tabs
import { effect, mount, signal, Text, View } from "nsh";
import { Storage } from "nsh";

const count = signal(0);
const loaded = signal(false);
Storage.getItem("count").then((saved) => {
  count.set(Number(saved ?? 0));
  loaded.set(true);
});
effect(() => {
  if (loaded()) Storage.setItem("count", String(count()));
});

mount(() => (
  <View onPress={() => count.update((n) => n + 1)}>
    <Text>Pressed {count()} times</Text>
  </View>
));
```

## host

`host` обращается к приложению, которое встраивает NSH: нативному приложению вокруг `NshAppView` / `NshView` или, в вебе, к странице, на которой работает плеер. Приложение вызывает функции хоста по имени с аргументами в JSON и слушает события, которые отправляет хост.

```ts
import { host } from "nsh";
```

```ts
const host: {
  readonly params: { readonly [key: string]: unknown };
  post(name: string, data?: unknown): void;
  available(): boolean;
  call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
  on(event: string, listener: (payload: unknown) => void): () => void;
};
```

### host.available

```ts
available(): boolean;
```

Показывает, есть ли на платформе хост, отвечающий на вызовы. В вебе значение равно `true`, когда страница передаёт плееру хост ([The host on the web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

Вызывает функцию хоста `name` с `args` (любое значение JSON; `null`, если его нет) и завершается с тем, что она возвращает. `host.call` никогда не выбрасывает исключение: любой сбой отклоняет промис с `Error`, у которого `code` сообщает, что произошло (сообщение предназначено для людей и может меняться):

| `code` | Когда |
|---|---|
| `ERR_NSH_HOST_ERROR` | Функция хоста завершилась сбоем или у хоста нет функции `name`; сообщение принадлежит хосту |
| `ERR_ACCESS_DENIED` | `name` нет в [`host` capability](#capability) приложения; `permission` равен `"host"`, `resource` — имя |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | У платформы нет хоста: `host.available()` равен `false` |
| `ETIMEDOUT` | Хост не ответил вовремя |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 вызова уже ждут ответов встраивающего приложения |

Недопустимое имя (от 1 до 128 символов из `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`, без `..`) отклоняется с `TypeError`.

Вызов ждёт ответа хоста 30 секунд, затем отклоняется с `ETIMEDOUT`; ответ, пришедший позже, отбрасывается. `options.timeout` задаёт ожидание в миллисекундах, `0` — без ограничения; тайм-аут настолько большой, что часы до него никогда не дойдут (около 1e22 мс), тоже означает ожидание без ограничения, а отрицательный, `NaN` или бесконечный отклоняет вызов с `RangeError`. Время считается по часам приложения, как и его таймеры: в `nsh test` с ручными часами оно движется вместе с часами.

```ts
const user = (await host.call("getUserInfo")) as { name: string };
const quote = await host.call("quote.refresh", { symbol: "AAPL" }, { timeout: 5000 }).catch((error) => {
  if (error.code === "ETIMEDOUT" || error.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") return null;
  throw error;
});
```

### host.on

```ts
on(event: string, listener: (payload: unknown) => void): () => void;
```

События платформы вызывают `listener` с полезной нагрузкой каждого `event`, который отправляет хост, пока не будет вызвана функция, возвращаемая `host.on`; слушатель, добавленный во время рендеринга компонента, прекращает работу вместе с компонентом. События, которые хост отправляет до запуска приложения, приходят, как только оно запускается, поэтому слушатели, зарегистрированные на верхнем уровне приложения, получают их; событие, отправленное до регистрации слушателя, ему повторно не доставляется. Читайте состояние, с которым запускается приложение, через `host.call`, а его изменения отслеживайте через `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### Разрешения

Каждая функция, которую вызывает приложение, должна быть указана в `capabilities.host` из `nsh.json`: это точные имена или префиксы, оканчивающиеся на `*`, либо `true` для всех сразу. Это верно для любого приложения, в том числе без других `capabilities`: функции хоста никогда не разрешены по умолчанию. Вызов без разрешения отклоняется с `ERR_ACCESS_DENIED` и записывается в журнал, `host.post` с таким именем во встраивающее приложение выбрасывает ту же ошибку, а сборка приложения, которое импортирует `host` из `nsh` без `capabilities.host`, выдаёт предупреждение. События не требуют разрешения. См. [Песочница и разрешения](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### Хост в вебе

В вебе хостом является страница. Опция `host` из `createPlayer` отвечает на вызовы, а `player.hostEvent(event, payload)` отправляет события:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

Опубликованное приложение указывает свой хост в `nsh.json`: `web.host` — это JS-модуль в каталоге приложения, путь к которому задаётся относительно `nsh.json`; он экспортирует `createHost(player)`, возвращающую объект с `call`. `nsh package --target web` поставляет его вместе с сайтом, `nsh run --target web` запускает его на странице разработки, а `nsh test` запускает его для приложений, которые открывают тесты. `web.connect` перечисляет хосты, до которых доходят собственные запросы хоста; Content-Security-Policy страницы разрешает их наряду с `capabilities.network` приложения. См. [Web](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

Параметры, которые встраивающее приложение задало до запуска вашего приложения; они читаются синхронно с первой строки вашего кода, а если ничего не задано, значением будет `{}`. Пока приложение работает, они не меняются: последующие запросы приходят как события.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```

<a id="native-sdk-channel"></a>

### Канал Native SDK

`send` Native SDK хранит события, пока приложение не начнёт их слушать, до 256 штук. Когда последний слушатель останавливается во время доставки, оставшиеся события продолжают ждать в прежнем порядке; события, отправленные во время завершения работы, ждут следующего загруженного приложения. `host.post(name, data)` доставляет данные обработчику Native SDK, а его `isPost` отличает отправки (post) от вызовов (call).

<a id="the-embedding-apps-side"></a>

### Сторона встраивающего приложения

Каждое представление держит один канал для всех приложений, которые оно загружает. Задавайте параметры до загрузки, отправляйте события в любое время из любого потока и регистрируйте обработчики по имени. Для вызовов и отправок нужно разрешение `capabilities.host` у приложения. Обработчик отвечает один раз, сразу или позже; если ответ так и не пришёл, вызов завершается ошибкой.

```rust tabs
// Any platform's AppView (GPUI, macOS, Windows, Linux, iOS): its HostChannel.
use serde_json::json;

let host = view.host();
let mut params = serde_json::Map::new();
params.insert("conversation".into(), json!("42"));
host.set_params(params);
// Runs on the engine thread: answer at once, or move the call and answer later from any thread.
host.handle("user.profile", |call| {
    let id = call.data()["id"].clone();
    call.resolve(json!({ "id": id, "name": "Ada" }));
});
host.send("conversation.open", json!({ "id": "43" })).unwrap();
```

```swift tabs
appView.params = ["conversation": "42"]
try appView.loadBundle(at: bundleURL)

// On the main thread; return the answer, or throw to reject the call.
appView.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"]
    return ["id": id ?? NSNull(), "name": try await profiles.name(of: id)]
}
appView.handle("analytics") { data, _ in analytics.log(data) }
appView.send("conversation.open", ["id": "43"])
```

```java tabs
nsh.setParams(Map.of("conversation", "42"));
nsh.loadAssetBundle("nsh");

// On the UI thread; answer now or later, from any thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    profiles.load(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});
nsh.send("conversation.open", Map.of("id", "43"));
```

См. [Встраивание на iOS](../docs/ios.md#talking-to-the-app), [Встраивание на Android](../docs/android.md#talking-to-the-app) и [GPUI](../docs/gpui.md).

> [!NOTE]
> Вызовы и отправки Native SDK используют то же [разрешение `host`](../docs/sandbox-and-capabilities.md#host), что и вызовы платформы. Приложение на Rust обращается к Rust-коду встраивающего приложения напрямую, через функции, которые оно регистрирует ([`nativeModule`](#nativemodule) и импорты Rust).

## keymap

Keymap привязывает к клавиатурным сочетаниям приложения функции, которые они запускают: нажатие, например `"mod+k"`, и функцию, которую оно выполняет. Код на Rust вызывает `on_key`, `on_key_with` и `key_label` из `nsh_core::prelude`; TSX импортирует `keymap` из `nsh`. Оба принимают одинаковые нажатия и подчиняются одним и тем же правилам.

```rust tabs
use nsh_core::prelude::*; // on_key, on_key_with, KeyOptions, key_label
```

```tsx tabs
import { keymap } from "nsh";
```

```ts
const keymap: {
  bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
  bind(bindings: Record<string, (e: { keystroke: string }) => void>, options?: KeyBindingOptions): () => void;
  label(keystroke: string): string;
};

interface KeyBindingOptions {
  when?: "always" | "notEditing";
  repeat?: boolean;
}
```

| TS | Rust |
|---|---|
| `keymap.bind(keystroke, handler)` | `on_key(keystroke, handler)` |
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when` — это `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | по одному `on_key` на каждое нажатие |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Привязка в Rust живёт столько же, сколько компонент (владелец), который её создал; обработчик получает нажатие в том виде, в каком оно записано.

Сочетания работают в macOS, Windows, Linux и в браузерах (собственные клавиши браузера, такие как Ctrl+T или Cmd+W, до страницы не доходят), а также в iOS и Android с аппаратной клавиатурой: у iPad, у Mac с запущенным приложением для iPad, у планшета или Chromebook, в симуляторе и в эмуляторе. Один и тот же код работает везде; без клавиатуры ни одна клавиша не запускает привязки.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

Запускает `handler`, когда нажато `keystroke`, и возвращает функцию, которая удаляет привязку. Обработчик получает `{ keystroke }`: нажатие в том виде и регистре, в каком вы его написали. В Rust: `on_key(keystroke, handler)`, обработчик которой получает само нажатие.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let open = signal(false);
    on_key("mod+k", move |_| open.set(true));
    on_key("escape", move |_| open.set(false));
    text(move || if open.get() { "Search…" } else { "Press ⌘K" })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(true));
keymap.bind("escape", () => open.set(false));

mount(() => <Text>{open() ? "Search…" : "Press ⌘K"}</Text>);
```

Передайте объект, чтобы привязать сразу несколько нажатий; возвращённая функция удаляет их все. В Rust каждое нажатие задаётся отдельным `on_key`:

```rust tabs
on_key("mod+s", move |_| save());
on_key("mod+shift+p", move |_| open_palette());
on_key("f5", move |_| refresh());
```

```tsx tabs
const unbind = keymap.bind({
  "mod+s": save,
  "mod+shift+p": openPalette,
  f5: refresh,
});
```

Привязка, созданная во время рендера компонента, удаляется вместе с ним, поэтому сочетания экрана живут столько же, сколько сам экран:

```rust tabs
#[component]
fn Editor() -> impl IntoElement {
    on_key("mod+enter", move |_| send());
    input().multiline(true)
}
```

```tsx tabs
function Editor() {
  keymap.bind("mod+enter", send);
  return <Input multiline />;
}
```

При работе с сервером разработки правка модуля удаляет привязки, созданные его кодом верхнего уровня, прежде чем этот код выполнится снова, так что горячая перезагрузка не оставляет устаревших сочетаний.

### keymap.label

```ts
label(keystroke: string): string;
```

Возвращает `keystroke` в том виде, в каком его показывают меню и подсказки там, где работает приложение: `"⇧⌘L"` в macOS и iOS (а также в браузере на Mac, iPhone или iPad), `"Ctrl+Shift+L"` в Windows, Linux и других браузерах, для `"mod+shift+l"`. В Rust: `key_label(keystroke)`. Используйте её, чтобы показывать сочетания приложения теми клавишами, которые действительно работают:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

Для недопустимого нажатия она выбрасывает `TypeError`, как и `bind`; `key_label` и `on_key` паникуют с тем же сообщением.

<a id="keystrokes"></a>

### Нажатия

Нажатие — это модификаторы и клавиша, соединённые через `+`: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command и минус).

| Модификатор | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (также `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (также `command`, `meta`, `super`, `win`) | Command (⌘) | клавиша Windows | Super |
| `ctrl` (также `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (также `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS следует macOS (`mod` — это Command), а Android следует Windows и Linux (`mod` — это Ctrl, `cmd` — клавиша Meta). В браузере клавиши следуют платформе, на которой он запущен: `mod` — это Command на Mac, iPhone или iPad и Ctrl в остальных случаях.

Используйте `mod` для собственных сочетаний приложения: именно эту клавишу приложения каждой платформы используют для них (⌘K в macOS, Ctrl+K в Windows и Linux), поэтому одна запись подходит везде. Клавиша Windows и Super в основном принадлежат системе, так что `cmd` редко уместна вне macOS.

Клавиша — это буква, цифра или знак препинания, записанные как символ, который она вводит на американской раскладке без Shift (`k`, `1`, `,`, `/`, `[`; `"shift+/"` для `?`, `"shift+k"` для Shift+K), либо имя: `plus` (клавиша `=` / `+`, также записывается как `=`), `minus` (также `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, стрелки `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, от `f1` до `f24`. Регистр не важен: `"Mod+Shift+K"` — это `"mod+shift+k"`, а заглавная буква означает ту же клавишу, а не Shift (`"mod+K"` — это `"mod+k"`). Рекомендуемый стиль — нижний регистр, он используется на этих страницах. `"mod-k"` и `"mod++"` — ошибки, в сообщениях которых указано правильное написание. Сочетания меню в `nsh/desktop` принимают те же нажатия.

Сочетания работают с любой раскладкой клавиатуры: в кириллической или греческой раскладке `mod+k` — это клавиша, которая вводит K на американской раскладке, как и у сочетаний меню.

`bind` выбрасывает `TypeError` с описанием того, что не так с недопустимым нажатием (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`), и отказывается принимать нажатия, которые система оставляет за собой, так что приложение никогда не сможет их нарушить:

| Платформа | Зарезервировано |
|---|---|
| macOS, iOS | Cmd+Q (выход), Cmd+H (скрыть), Option+Cmd+H (скрыть остальные), Cmd+M (свернуть), Ctrl+Cmd+F (полный экран) |
| Linux, Windows, Android | Ctrl+Q (выход), Alt+F4 (закрыть), F11 (полный экран) |
| Web | Нет (браузер оставляет себе свои клавиши) |

<a id="while-typing"></a>

### Во время набора текста

Текстовому полю с фокусом клавиатуры нужны его клавиши: набор, перемещение курсора, удаление, а также выделить всё, вырезать, копировать, вставить, отменить и повторить. Поэтому по умолчанию привязка не срабатывает, пока фокус у текстового поля (или веб-представления), если её нажатие относится к этим: обычные клавиши и клавиши только с Shift или Option, стрелки, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, а также `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`. Остальные нажатия с Command или Control и функциональные клавиши срабатывают независимо от того, где фокус.

`when` меняет это поведение (Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | Срабатывает |
|---|---|
| (по умолчанию) | Как описано выше |
| `"always"` | Также в текстовых полях, до того как поле увидит клавишу |
| `"notEditing"` | Никогда, пока фокус у текстового поля |

```rust tabs
use nsh_core::keymap::When;

// Sends from the message field too.
on_key_with("mod+enter", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| send());
// Only when the user is not typing.
on_key_with("mod+e", KeyOptions { when: When::NotEditing, ..KeyOptions::default() }, move |_| archive());
```

```tsx tabs
// Sends from the message field too.
keymap.bind("mod+enter", send, { when: "always" });
// Only when the user is not typing.
keymap.bind("mod+e", archive, { when: "notEditing" });
```

В iOS и Android клавиша, с которой работает метод ввода (выбор кандидата, подтверждение), остаётся за методом ввода. В бэкенде GPUI нативный компонент с фокусом клавиатуры считается текстовым полем, так как может быть текстовым редактором. Он видит каждую клавишу первым: клавиша, которую он обрабатывает сам, до привязок не доходит, а привязки, срабатывающие во время редактирования текста, получают те клавиши, которые он пропускает.

<a id="which-binding-runs"></a>

### Какая привязка запускается

Клавиша, запустившая привязку, поглощается: она не вводится, система не издаёт звукового сигнала, а собственные клавиши NSH её не видят (Escape для возврата назад, Tab для перемещения фокуса, стрелки для прокрутки). Если у нескольких привязок одинаковое нажатие, запускается самая новая из тех, которым разрешено сработать, поэтому диалог может привязать Escape поверх привязки экрана, а привязка экрана вернётся, когда привязка диалога исчезнет. Привязки проверяются нативно в момент нажатия клавиши; обработчик запускается сразу после этого в потоке движка (Rust) или в потоке JS (TSX).

Удержание клавиши запускает её привязку один раз, до отпускания клавиши; с `repeat: true` она срабатывает снова при каждом автоповторе (например, чтобы переходить по списку):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

Сочетания меню уступают привязке с тем же нажатием: сочетания меню приложения ([`nsh/desktop`](./nsh-desktop)) на всех настольных платформах, а в macOS ещё и сочетания встроенных меню (Cmd+W, Cmd+C, ...). Пока вы разрабатываете с `nsh run`, Cmd+R / Ctrl+R всегда перезагружает приложение, даже если оно привязывает `mod+r`; упакованное приложение может её привязать.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent и nativeModule

`nativeComponent` и `nativeModule` соединяют ваше приложение с тем, что предоставляет приложение-хост, по имени и во время выполнения. Приложение для iOS или Android, встраивающее NSH, может зарегистрировать собственные представления (карту, график, предпросмотр камеры) по имени; `nativeComponent` даёт вам типизированный компонент для одного из них. Поскольку NSH рендерит с помощью настоящих нативных представлений, такой компонент находится в иерархии представлений наравне с любым другим: NSH размещает его, он обрезается и прокручивается вместе с родителями и корректно перекрывается. Приложение, которое встраивает NSH из Rust, может также регистрировать функции, классы и компоненты Rust; `nativeModule` отдаёт их вам как один типизированный объект. В любом случае ваше приложение собирается стандартным `nsh build`: хост подключает то, что предоставляет, когда запускает приложение. Код на Rust размещает зарегистрированное представление с помощью `native(name)` из `nsh_core::prelude`, задаёт его свойства через `.prop(name, value)` (значение JSON либо сигнал или замыкание, которое его возвращает) или привязывает одно из них к анимируемому значению через `.bind_prop(name, &value)`, слушает его события через `.on_native_event(…)` и вызывает его команды через `ElementRef`; TSX импортирует `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

О регистрации нативной стороны см. [Нативные компоненты](../docs/native-components.md), а также [Встраивание на iOS](../docs/ios.md) / [Встраивание на Android](../docs/android.md).

### nativeComponent

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;

interface NativeComponentSpec<P, E> {
  /** Its own props: sent to the component (any JSON value), each when it changes. */
  props: readonly (keyof P & string)[];
  /** The events it emits. */
  events?: readonly (keyof E & string)[];
}
```

Возвращает компонент для нативного компонента, который встраивающее приложение зарегистрировало как `name` (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`). В Rust: `native(name)` — представление, свойства которого являются значениями JSON (`.prop("text", json!(…))`), а события приходят как `NativeEvent { name, data }`.

- `P` — тип его собственных свойств. Каждое свойство, перечисленное в `spec.props`, отправляется на нативную сторону как JSON при изменении; установка его в `undefined` удаляет его.
- `E` сопоставляет имена событий с их данными. Событие `regionChange` становится свойством-обработчиком `onRegionChange`.
- Компонент также принимает все [свойства представления](../elements/view.md), кроме `children`: `style`, `class`, раскладку, доступность, обработчики касаний и `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### Размер

Компонент размещается как представление, с тем размером, который задаёт его стиль. Если стиль оставляет размер по какому-то измерению открытым, используется размер, который сообщает нативный компонент (как изображение использует свой естественный размер).

<a id="commands"></a>

#### Команды

Его `ref` получает `NativeComponentRef`; `ref.command(name, args)` вызывает команду `name` нативного компонента с `args` (любое значение JSON). В Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### Когда ничего не зарегистрировано

Если под `name` ничего не зарегистрировано (другое приложение-хост, хост разработки, браузер), компонент отображает пустое представление, а предупреждение записывается в журнал один раз. Сделайте так, чтобы приложение оставалось пригодным к использованию без него, или проверяйте свой хост, прежде чем его использовать.

<a id="example"></a>

### Пример

Значок здесь — нативное представление приложения-хоста, зарегистрированное как `embed.badge`. NSH размещает его, отправляет ему `text` и `color`, получает его события `tap` и вызывает его команду `pulse`:

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p_5()
        .gap_4()
        .child(
            native("embed.badge")
                .prop("text", json!("Tap the native badge"))
                .prop("color", json!("#8250df"))
                .element_ref(&badge)
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Tapped {}×", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, View } from "nsh";
import { nativeComponent } from "nsh";

const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", gap: 16 }}>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color="#8250df"
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
    </View>
  );
}

mount(App);
```
### nativeModule

```ts
function nativeModule<T extends object>(specifier: string): T;
```

Возвращает экспорты набора, который встраивающее приложение зарегистрировало как `specifier`: его модули, классы, функции и Rust-компоненты, одним объектом. Тип `T` приложение пишет само, поэтому при его сборке ничего о хосте знать не нужно. Rust-код, собранный вместе с крейтом хоста, вызывает эти функции как Rust; `nativeModule` — это способ, которым к ним обращается TSX.

```ts
import { nativeModule, signal } from "nsh";

interface TradingApi {
  quote(symbol: string): number;
  placeOrder(symbol: string, quantity: number, side: "Buy" | "Sell"): Promise<Order>;
  on(event: "change", listener: (desk: Desk) => void): () => void;
}

const { Trading } = nativeModule<{ Trading: TradingApi }>("host/trading");

const price = Trading.quote("AAPL");

const desk = signal<Desk | null>(null);
Trading.on("change", (d) => desk.set(d));
```

- Вызовы работают так же, как при импорте набора: обычная Rust-функция сразу возвращает значение, `async`-функция возвращает промис, а переданная вами функция становится колбэком, который Rust может вызвать позже. Rust проверяет каждый аргумент и выбрасывает `TypeError` при неверном.
- Каждый вызов с одним и тем же `specifier` возвращает один и тот же объект.
- Если под `specifier` ничего не зарегистрировано, `nativeModule` выбрасывает `ReferenceError` с этим именем. Вызывайте его там, где приложение может это обработать, или только в том хосте, для которого оно сделано.

Хост регистрирует набор из Rust с помощью `set_ui_sets` крейта платформы (рядом с собственными наборами NSH) до запуска своих представлений, либо `EngineConfig::ui_sets`:

```rust
use std::{cell::RefCell, rc::Rc};

use nsh_core::prelude::*;

pub struct Trading;

#[module]
impl Trading {
    /// A sample price.
    pub fn quote(symbol: String) -> Result<f64, String> { /* ... */ }

    /// Calls `listener` with the desk now and after every change
    /// (`change`, the one event), until the returned function is called
    /// or what called `on` goes.
    pub fn on(event: String, listener: Callback<Desk>, cx: CallCx<'_>) -> Result<Stop, String> {
        if event != "change" {
            return Err(format!("no Trading event `{event}`"));
        }
        let listener = Rc::new(RefCell::new(Some(listener)));
        let held = listener.clone();
        cx.start(async move {
            let mut desk = DESK.subscribe(); // a tokio watch channel the host keeps
            loop {
                let Some(listener) = held.borrow().clone() else { return };
                listener.post(desk.borrow_and_update().clone());
                if desk.changed().await.is_err() {
                    return;
                }
            }
        });
        Ok(Stop::new(move || drop(listener.take())))
    }
}

let mut trading = Registry::ui_set("host/trading");
trading.module::<Trading>();
nsh_platform_gpui::set_ui_sets(vec![nsh_base::registry(), trading]);
```

`on` — это способ, которым хост синхронизирует все приложения со своими данными: запущенная им задача ожидает изменений хоста и отправляет каждое из них в приложение, так что изменение, сделанное хостом или любым приложением через другую функцию, доходит до каждого приложения, которое слушает. Возвращаемый `Stop` — это функция, которую в TSX возвращает `Trading.on`: она выполняется один раз, когда приложение вызывает её или когда исчезает то, что вызвало `on` (компонент или запуск модуля при горячей перезагрузке), и здесь удаляет слушатель, после чего задача завершается.

> [!NOTE]
> Props, события и аргументы команд передаются на нативную сторону как JSON. Зарегистрированные компоненты и функции — это собственный код приложения-хоста: [ограничения песочницы и возможности](../docs/sandbox-and-capabilities.md) NSH на то, что они делают, не распространяются.

<a id="accessibility"></a>

## Доступность

API доступности читает настройки доступности пользователя (запущен ли screen reader, просил ли он уменьшить анимацию) и взаимодействует со screen reader. Rust-код вызывает `screen_reader()`, `reduce_motion()` и `announce_for_accessibility()` из `nsh_core::prelude` и перемещает фокус с помощью `ElementRef`; TSX импортирует `screenReaderEnabled()`, `reduceMotion()`, `announce()` и `setAccessibilityFocus()` из `nsh`. Настройки реактивны: читайте их в binding, `computed` или `effect`, и то, что их читает, обновляется, когда пользователь их меняет. Props доступности элементов (`accessibilityLabel`, `role`, ...) описаны в разделе [Elements](../elements/index.md); руководство — [Accessibility](../docs/accessibility.md).

```rust tabs
use nsh_core::prelude::*; // screen_reader, reduce_motion, announce_for_accessibility, element_ref
```

```tsx tabs
import { announce, reduceMotion, screenReaderEnabled, setAccessibilityFocus } from "nsh";
```

### screenReaderEnabled

```ts
const screenReaderEnabled: Accessor<boolean>;
```

Запущен ли screen reader (VoiceOver, TalkBack). Реактивно: то, что его читает, обновляется, когда пользователь включает или выключает screen reader. Rust: `screen_reader() -> bool`, реактивно так же.

```rust tabs
when(move || !screen_reader(), || text("Swipe for the next photo"))
    .otherwise(move || text("Next photo").on_press(next))
```

```tsx tabs
<If when={!screenReaderEnabled()} else={<Text onPress={next}>Next photo</Text>}>
  <Text>Swipe for the next photo</Text>
</If>
```

### reduceMotion

```ts
const reduceMotion: Accessor<boolean>;
```

Просил ли пользователь уменьшить анимацию (Reduce Motion в iOS, Remove animations в Android). Реактивно. Rust: `reduce_motion() -> bool`. Классы Tailwind тоже следуют этой настройке с помощью варианта `motion-reduce:`.

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        let _ = panel.spring(0.0, Spring::default());
    }
};
```

```tsx tabs
const open = () => {
  if (reduceMotion()) panel.set(0);
  else panel.spring(0);
};
```

### announce

```ts
function announce(message: string): void;
```

Screen reader зачитывает `message` (объявление VoiceOver, TalkBack). Используйте для результатов, которые появляются без перемещения фокуса, например «Сохранено». Rust: `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Перемещает фокус screen reader на `node` (`ref` элемента). Rust: `ElementRef::set_accessibility_focus()`.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Saved() -> impl IntoElement {
    let note = element_ref();
    let save = move || {
        announce_for_accessibility("Saved");
        note.set_accessibility_focus();
    };
    // Runs again when the setting changes, until the component goes.
    effect(|| log::info!("screen reader {}", screen_reader()));
    view()
        .gap_2()
        .child(text("Save").role(AccessibilityRole::Button).on_press(save))
        .child(text("Your changes are kept on this device.").element_ref(&note))
}
```

```tsx tabs
import { effect, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Saved() {
  let note!: ViewRef;
  const save = () => {
    announce("Saved");
    setAccessibilityFocus(note);
  };
  // Runs again when the setting changes, until the component goes.
  effect(() => console.log("screen reader", screenReaderEnabled()));
  return (
    <View style={{ gap: 8 }}>
      <Text onPress={save} role="button">Save</Text>
      <Text ref={note}>Your changes are kept on this device.</Text>
    </View>
  );
}
```

<a id="types"></a>

## Типы

`nsh` также экспортирует типы реактивного API и host-элементов. Наиболее часто используемые:

| Тип | Что это |
|---|---|
| `Accessor<T>` | Читаемое значение: `() => T` |
| `Signal<T>` | `Accessor<T>` с `set` и `update` |
| `SignalOptions<T>` | Параметры `signal` и `computed` (`equals`) |
| `Context<T>` | То, что возвращает `context` |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | Пространство имён JSX (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | То, что получает `ref`, — собственный тип каждого элемента (`ViewRef` и типы над ним): фокус, прокрутка и другие команды. `ViewRef` также обозначает сам элемент (`JSX.Element`). См. [методы ref](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | Props host-элементов |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Объекты стилей; см. [справочник по стилям](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | Значения внутри стилей |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Полезная нагрузка событий |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | Структуры, из которых состоят полезные нагрузки и props, с полями GPUI (`nsh_core::geometry`) |
| `PixelSize` | Собственный размер изображения или видео в пикселях (`onLoad`, `Image.getSize`, изображения буфера обмена и средства выбора), тогда как `Size` задаётся в points |
| `ImageAsset` | Что даёт импорт файла изображения (`{ url, size: Size, scales? }`; `scales` перечисляет его [варианты для разной плотности пикселей](../docs/images-and-assets.md#pixel-densities)) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Props доступности |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` принимает один стиль или список, объединяемый слева направо, с пропуском ложных элементов:

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
