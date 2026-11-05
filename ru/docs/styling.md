---
title: "Стилизация"
description: "Типизированные методы стилей в Rust и проп style в TSX: flexbox, grid и эффекты CSS, цвета, границы, скругления, тени, градиенты, фильтры, трансформации и переходы, с учётом различий между платформами."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# Стилизация

Каждый элемент стилизуется одними и теми же нативными стилями, записанными двумя способами. В Rust стили — это типизированные методы, вызываемые цепочкой на элементе (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`); в TSX — проп `style` со свойствами в camelCase или [классы Tailwind](./tailwind.md). Оба способа поддерживают возможности CSS, такие как тени, градиенты, фильтры, контуры, переходы и grid, а в нативное представление отправляются только изменившиеся свойства.

Три способа записывают один и тот же набор свойств и означают одно и то же. Их имена совпадают с именами CSS (некоторые получили более простые названия, привычные в приложениях, например `paddingHorizontal`, `marginStart` и `numberOfLines`). Значения CSS (цвета, градиенты, фильтры, тени, трансформации, ключевые слова выравнивания) и утилиты Tailwind означают то же, что и в вебе: каждый метод Rust и каждая утилита задаёт то, что для неё генерирует Tailwind CSS 4, поэтому знания из веба переносятся. `paddingLeft` — это `padding-left` и `pl-4`, `boxShadow` — это `box-shadow`, `display: "flex"` — это строка, как и класс `flex`. Остальное создано для нативных приложений: длины измеряются в пунктах (`16`, `"50%"`, `"auto"`; классы принимают `rem` и другие единицы CSS), значения по умолчанию соответствуют нативной раскладке (они перечислены ниже), значение, которое меняется, принимает числа вместо строки (`translate: [x, 0]`, слои тени), а то, что платформы умеют сверх CSS, имеет собственные [расширения](#extensions).

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

На этой странице описано, как комбинируются стили, и визуальные свойства. Свойства раскладки (flexbox, grid, размеры, позиции) описаны в разделе [Layout](./layout.md), свойства текста — в [Text](./text.md), а все свойства с их типами перечислены в [справочнике стилей](../modules/style-reference.md).

<a id="combining-styles"></a>

## Сочетание стилей

В Rust общие стили — это функции, которые принимают элемент и возвращают его стилизованным, а условия — обычный Rust: `.when(condition, |v| ..)` для того, что известно при создании элемента, `.style_when(signal, |s| ..)` для стилей, которые переключаются во время работы приложения. В TSX `style` принимает объект или массив объектов, объединяемых слева направо; ложные элементы (`false`, `null`, `undefined`) пропускаются, что делает условные стили короткими:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

В TSX определяйте общие стили как константы вне компонентов (с `as const`, чтобы TypeScript сохранял литеральные типы, такие как `"row"`). Достаточно обычного объекта: стили разбираются в Rust при каждой установке, а объекты не нужно нигде регистрировать.

Стиль, который читает сигналы, следует за ними: в Rust передайте методу замыкание (`.bg(move || ..)`), и при изменении сигналов повторно устанавливается только это свойство; в TSX выражение стиля, читающее сигналы, перестраивается, а NSH отправляет только те свойства, значения которых отличаются:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

Когда у элемента TSX заданы и то и другое, `style` имеет приоритет над `class`: сначала применяются классы, затем поверх них — встроенный стиль. Ключ со значением `undefined` ничего не задаёт (`backgroundColor: active ? accent : undefined` сохраняет цвет из класса, когда элемент неактивен); `null` задаёт значение по умолчанию. В Rust более поздний метод имеет приоритет над более ранним для того же свойства.

В пределах одного стиля (объекта или массива, объединённого в один) порядок ключей не имеет значения: более специфичное свойство побеждает свою сокращённую запись, `borderTopWidth` над `borderWidth`, `borderLeftColor` над `borderColor`, `marginTop` над `marginVertical` над `margin` (так же для padding), `rowGap` над `gap`, `flexGrow` над `flex`, `gridColumnStart` над `gridColumn`. Специфичное свойство, заданное в `null`, показывает значение сокращённой записи.

<a id="units-and-values"></a>

## Единицы и значения

- **Длины измеряются в пунктах** (независимых от плотности пикселях): `px(100.0)` в Rust и `width: 100` в TSX — это 100pt, то есть 200 или 300 физических пикселей на экране 2× или 3×.
- **Проценты** (`relative(0.5)` в Rust, `"50%"` в TSX) считаются относительно родителя — для размеров, позиций, внешних и внутренних отступов ([Layout](./layout.md)).
- **Углы** — `deg(45.0)`, `radians(0.5)` или `turn(0.25)` в Rust, а в TSX — градусы в виде чисел или строк с единицей измерения: `45`, `"45deg"`, `"0.5rad"`; `rotate` и `transform` из CSS также принимают `"0.25turn"`, а внутри строки `transform` у каждого угла есть единица измерения.
- **Длительности** — миллисекунды: `.duration(150.0)` в Rust, числа или строки (`"150ms"`, `"0.2s"`) в TSX.

<a id="defaults"></a>

## Значения по умолчанию

Там, где свойство не задано, применяются значения NSH по умолчанию:

| | По умолчанию |
|---|---|
| Раскладка дочерних элементов представления | колонка (flex-контейнер с `flexDirection: "column"`); `display: "flex"` делает строку, если не задан `flexDirection`, как в CSS |
| `flexShrink` | `0` (дочерние элементы не сжимаются, пока этого не потребуют) |
| `alignContent` | `"flex-start"` (в grid — `"normal"` из CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | прозрачный |
| Текст | чёрный, 14pt, насыщенность 400 |
| Цвет границы и контура | цвет текста (`currentColor` из CSS) |

Новые представления вообще не несут стилей, пока вы их не зададите, поэтому нестилизованные обёртки ничего не стоят на нативной стороне.

<a id="colors"></a>

## Цвета

В Rust цвета — типизированные значения: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, а также палитра Tailwind в виде `nsh_core::element::palette` (`BLUE.shade(500)`). Методы цвета принимают `AdaptiveColor` — светлое и тёмное значение: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` переключается вместе с системным оформлением на нативном уровне, без повторного рендера. Цвета из темы приложения (`theme().primary` из `nsh_base`) тоже адаптивны ([Rust](./rust.md#theme)).

В TSX свойства цвета принимают строки цветов CSS:

| Форма | Пример |
|---|---|
| Hex | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| Именованные | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: цвет текста, в том числе внутри градиента, тени, `drop-shadow()` или `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`); в классах записывается как `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

Для тёмной темы в TSX читайте [`colorScheme()`](../modules/nsh.md#device) из `nsh` — акцессора, который следует за системным оформлением, или используйте вариант Tailwind `dark:`:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Для стилей, не связанных с цветом, `.dark(|s| ..)` в Rust применяет стили в тёмном оформлении, а `dark()` считывает текущее оформление. Цвет текста по умолчанию чёрный в обоих оформлениях: задавайте цвета явно в приложениях, поддерживающих тёмную тему.

<a id="borders-and-corners"></a>

## Границы и углы

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Ширина и цвета** по сторонам: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., которые сохраняют свою сторону при любом направлении; а также `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, которые следуют [направлению раскладки](./layout.md#right-to-left) (`.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ... в Rust).
- **Цвет** стороны, у которой задана ширина, но не задан цвет, — это цвет текста, как `currentColor` в CSS: `{ borderWidth: 1, color: "#0969da" }` рисует синюю границу.
- **Радиусы** по углам: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, а также `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (верхний начальный, верхний конечный, нижний начальный, нижний конечный), которые следуют [направлению раскладки](./layout.md#right-to-left) (`.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)` в Rust и пресеты `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) рисует углы, кривизна которых плавно переходит в края, как у иконок приложений iOS, на обеих платформах. Пилюля (`borderRadius` в половину высоты) остаётся пилюлей.
- **`overflow: "hidden"`** (`.overflow_hidden()`) обрезает дочерние элементы по скруглённой форме. То, что обрезано, обрезано и в раскладке: оно не влияет на размер содержимого объемлющего scroll view. Поэтому блок, который раскладывает дочерний элемент шире себя и уменьшает его с помощью `transform` (трансформации не влияют на раскладку), не затрагивает scroll view.

Радиусы, превышающие половину стороны, ограничиваются, поэтому `borderRadius: 9999` (`.rounded_full()`) даёт круг или пилюлю.

<a id="shadows"></a>

## Тени

Представления отбрасывают `boxShadow` из CSS, а Android добавляет собственную material elevation:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` следует CSS: `offsetX offsetY blur spread color`, `inset` для внутренних теней. Он также принимает слои в виде чисел — это форма для значений, которые меняются, и она не создаёт строку: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (обязательны только `x` и `y`; слой без цвета рисуется цветом текста). Rust принимает слои, `.shadow([BoxShadow { .. }])`. Тени следуют скруглённой форме представления, а переход анимирует их (`transitionProperty: "boxShadow"`, `.transition_shadow()`). Пресеты Tailwind — `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... в Rust, а `.shadow_color(..)` перекрашивает их слои. Тень, следующая за содержимым прозрачного представления (например, за глифами иконки), — это `filter: "drop-shadow(...)"` ([Filters](#filters-and-blending)); у текста есть `textShadow` ([Text](./text.md)).

> [!NOTE]
> На Android для теней нужен фон: представление с прозрачным фоном (например, текст без фона) не отбрасывает тень.

<a id="gradients"></a>

## Градиенты

`backgroundImage` принимает градиенты CSS, рисуемые поверх цвета фона; в Rust — `.bg_linear(angle)`, `.bg_radial()` и `.bg_conic(angle)` с остановками `.gradient_from(..)`, `.gradient_via(..)` и `.gradient_to(..)`, как `bg-linear-*` в Tailwind с `from-*`, `via-*` и `to-*`. В TSX несколько градиентов разделяются запятыми.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

Цветовые остановки задаются процентами или длинами (`px`, `pt`, `rem`; простые числа — это пункты) вдоль линейного или радиального градиента и процентами или углами (`deg`, `turn`, `rad`, `grad`) вокруг конического. Остановка с двумя позициями (`#8250df 0 12px`) — это полоса одного цвета, как и две остановки в одной позиции. Длины измеряются вдоль линии градиента при текущем размере представления, поэтому полоса в 12px остаётся шириной 12px при изменении размера представления.

Цвета смешиваются между остановками как в CSS: в пространстве, которое указано в градиенте (`linear-gradient(in oklab, …)`; также `srgb`, `srgb-linear`, `xyz`, `oklch` с методом интерполяции оттенка, например `longer hue`, и `hsl`), а в остальных случаях — в sRGB, если все цвета заданы как hex, `rgb()`, `hsl()` или именованные, и в Oklab, если хотя бы один из них — `oklch()`, `oklab()`, `lab()`, `lch()` или `color()`.

Текстовые элементы не рисуют градиенты на iOS.

<a id="filters-and-blending"></a>

## Фильтры и смешивание

| Свойство | Значение | Rust |
|---|---|---|
| `filter` | CSS-фильтры представления и его содержимого: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (без цвета — цветом текста, как в CSS); несколько фильтров разделяются пробелами | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | Фильтры того, что находится за представлением: `"blur(10px)"` (матовое стекло) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` или `"clear"` для Liquid Glass от Apple на iOS 26 и macOS 26 и новее; `"none"` (по умолчанию) использует `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | Как представление смешивается с тем, что находится за ним: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

Поддержка на платформах различается:

| | iOS | Android |
|---|---|---|
| `filter` у представлений | `opacity`, `brightness` до 1 и только `drop-shadow` | Все, начиная с Android 12 (API 31); ниже — только цветовые фильтры |
| `filter` у изображений | Все цветовые фильтры и `blur` | Как у представлений |
| `backdropFilter` | Системный материал размытия, приблизительно соответствующий радиусу | Начиная с Android 12 (API 31) |
| `mixBlendMode` | Да | Начиная с Android 10 (API 29) |

Web, Windows и Linux применяют все фильтры к представлениям, macOS — так же, как iOS; GPUI рисует цветовые фильтры и `drop-shadow()`. Фильтр фона — это размытие на iOS, macOS и Android и любые фильтры на web и Windows; Linux и GPUI не рисуют его, а GPUI рисует представления в обычном режиме смешивания. Если у `filter` несколько `drop-shadow()`, iOS, macOS и Android рисуют последний. `mixBlendMode` смешивает представление со всем, что нарисовано за ним.

На iOS `ios={{ backdropMaterial: "regular" }}` выбирает системный материал, используемый размытием `backdropFilter`. Значения: `"ultraThin"` (по умолчанию), `"thin"`, `"regular"`, `"thick"` и `"chrome"`. Сочетайте проп с положительным радиусом размытия, чтобы материал был виден. Rust использует `.backdrop_material(BackdropMaterial::Regular)` вместе с `.backdrop_blur(px(30.0))`. Радиус приблизительно задаёт силу материала: NSH применяет долю выбранного материала, достигая полной силы при 30 пунктах. Светлый или тёмный вариант следует за цветом фона представления. Эти варианты соответствуют [системным материалам размытия](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` рисует Liquid Glass за содержимым представления на iOS 26 и macOS 26 и новее. `"regular"` использует стандартный материал; `"clear"` берёт меньше цвета из фона. Сочетайте его с `backdropFilter` для размытия, которое показывается в более ранних версиях iOS и на других платформах. Стекло следует размеру и скруглённым углам представления.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Контуры, прозрачность и видимость

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): линия снаружи границы, не занимающая места (отрицательные смещения рисуют внутри). `outlineStyle: "none"` (или `"hidden"`, `.outline_none()`) скрывает контур независимо от его ширины, как в CSS.
- `opacity` (`.opacity(n)`): от 0 до 1, применяется к представлению и его дочерним элементам.
- `visibility: "hidden"` (`.invisible()` в Rust): представление не рисуется, но сохраняет своё место, а программы чтения с экрана пропускают его и его поддерево, как в браузере. `display: "none"` (`.hidden()`) убирает его из раскладки.
- `zIndex` (`.z_index(n)`): порядок среди соседних элементов, а также нативный порядок наложения (стабильный для равных значений).
- `cursor` (`.cursor(..)`, `.cursor_pointer()`): форма указателя над представлением, для указывающих устройств и десктопов.
<a id="transforms"></a>

## Трансформации

Трансформации такие же, как в CSS. В TSX `translate`, `rotate` и `scale` — отдельные свойства, а `transform` принимает CSS-строку функций или список шагов. Они применяются в порядке CSS: `translate`, затем `rotate`, затем `scale`, затем `transform`, независимо от порядка ключей. В Rust трансформации — это методы (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...), которые применяются в том же порядке:

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| Свойство | Значение |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (проценты от собственного размера view), число (пункты по оси x) или `[x, y]` с числом, строкой или анимированным значением для каждой оси |
| `rotate` | `"45deg"`, `"0.25turn"`, вращение вокруг оси `"x 90deg"`, число (градусы) или анимированное значение (градусы) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x и y), анимированное значение (обе оси) или `[x, y]` |
| `transform` | Функции CSS: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`; длины в `px` (для сдвигов также `%`), углы в `deg`, `rad` или `turn`; `"none"`; либо список шагов (`[{ perspective: 800 }, { rotateY: angle }]`), величины которых могут быть анимированными значениями |

Каждое из них — отдельное свойство, как и в случае с классами: `scale` в стиле заменяет класс `scale-95` и сохраняет его `rotate-3`. Анимированные значения управляют `translate`, `rotate` и `scale` нативно. Для случаев, которые CSS-строка не может выразить с анимированной величиной, например для 3D-вращения, передайте в `transform` список шагов: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` и `perspective` ([Анимация](./animation.md)). `transform` стиля — это либо одна форма, либо другая, поэтому перспектива перед анимированными шагами сама является шагом списка.

`.perspective(..)` в Rust — это свойство CSS `perspective`, аналог `perspective-*` в Tailwind: оно задаёт глубину дочерним элементам view, тогда как функция `perspective()` в `transform` применяется к собственной трансформации view. `transformOrigin` принимает ключевые слова, проценты и длины (`"top left"`, `"50% 0"`, `[10, 20]`; `.origin_top_left()`, `.transform_origin(..)` в Rust); по умолчанию используется центр. Трансформации не влияют на раскладку: соседние элементы размещаются так, как будто view не трансформирован.

В Android нет трансформаций наклона (skew).

<a id="transitions"></a>

## Переходы

View анимирует изменения собственного стиля, если вы укажете, что именно анимировать. Анимация выполняется нативно; ваш код не вызывается на каждом кадре.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| Свойство | Значение | Rust |
|---|---|---|
| `transitionProperty` | Что анимируется: `"all"` или имена через запятую: цвета (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (все свойства трансформации), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | Как у длительности | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

Размеры и позиции относятся к раскладке, а не к стилю, и не участвуют в переходах. Анимируйте изменения раскладки с помощью `LayoutAnimation` или управляйте значениями через нативные анимации ([Анимация](./animation.md)).

<a id="keyframe-animations"></a>

### Анимации по ключевым кадрам

`animationName` нативно запускает одну из встроенных keyframe-анимаций Tailwind: `"spin"`, `"ping"`, `"pulse"` или `"bounce"` вместе с `animationDuration`, `animationDelay`, `animationTimingFunction` и `animationIterationCount` (число или `"infinite"`), в любом порядке. В Rust `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` и `.animate_bounce()` запускают их с таймингом Tailwind, а `.animation(KeyframeAnimation::new(..))` — с вашим собственным:

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## Отклик на нажатие

Отклик на нажатие — это стили приложения для состояния нажатия, которые применяются нативно без обращения к вашему коду. Состояния наведения, фокуса и отключения принимают стили таким же образом (`.hover(..)`, `.focus(..)`, `.disabled_style(..)` в Rust; `hoverStyle`, `focusStyle` и `disabledStyle` или `hover:`, `focus:`, `disabled:` в TSX):

| Rust | TSX | Эффект при нажатии |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | View плавно меняет непрозрачность до этого значения |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | Фон приобретает этот цвет |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Material-рябь (ripple) в Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | Любой стиль |

См. [Касания и жесты](./touch-and-gestures.md).

<a id="extensions"></a>

## Расширения

Эти ключи и классы передают то, что нативные платформы умеют сверх CSS:

| Ключ | Класс | Что делает |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | Цвет плейсхолдера у `<Input>` |
| `selectionColor` | `selection:bg-*` | Цвет выделения у `<Input>` или выделяемого `<Text>` |
| `tintColor` | `tint-*` | Перекрашивает непрозрачные пиксели `<Image>` (шаблонные изображения, иконки) |
| `borderCurve` | | `"continuous"`: углы, плавно переходящие в стороны, как у системных элементов (непрерывные углы Apple) |
| `glassEffect` | | Liquid Glass от Apple позади view на iOS 26 и macOS 26, на остальных платформах — `backdropFilter` |
| `writingDirection` | | Базовое направление текста: `"auto"` (по умолчанию: определяется по содержимому, как в текстовых view платформ), `"ltr"` или `"rtl"`; `direction` задаёт направление раскладки |
| `textAlignVertical` | | Где располагается текст, более короткий, чем его блок `<Text>`: `"top"` (по умолчанию), `"center"` или `"bottom"` |
| `textAlign: "auto"` | | Естественная сторона текста в соответствии с его направлением (по умолчанию) |
| `selectedStyle` | `selected:` | Стиль, пока `accessibilityState.selected` равно `true` (выбранный `Button`, вкладка) |
| | `ios:`, `android:`, `web:` | Классы для одной платформы (`ios:pt-2`) |

Изменяемые значения также принимают числа там, где CSS принимает строку: `transform` — как список шагов, `translate` и `scale` — как `[x, y]`, `boxShadow` и `textShadow` — как слои.

<a id="related"></a>

## См. также

- [Tailwind](./tailwind.md): те же стили в виде классов, с вариантами для тёмной темы, состояний нажатия и брейкпоинтов, а также их типизированные аналоги.
- [Раскладка](./layout.md) и [Текст](./text.md).
- [Справочник по стилям](../modules/style-reference.md): все свойства стиля и их типы.
