---
title: "Tailwind"
description: "Clases de Tailwind CSS resueltas de forma nativa en TSX y sus equivalentes tipados en Rust: class y classList, variantes para estados de pulsación, modo oscuro y breakpoints, el tema en nsh.json y la comprobación de clases en tiempo de compilación."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---


# Tailwind

Los estilos de NSH siguen Tailwind CSS 4. En Rust, las utilidades de Tailwind son métodos de estilo tipados con los mismos nombres y valores (`.p_4()` es `p-4`, `.rounded_2xl()` es `rounded-2xl`, `ZINC.shade(900)` es `zinc-900`). En TSX, cada elemento acepta las propias clases en `class`, que se resuelven de forma nativa frente al tema predeterminado de Tailwind 4. Cada ejemplo siguiente muestra primero los métodos tipados y después las clases:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

Los métodos tipados se convierten en las mismas reglas de estilo a las que se compilan las clases, sin ninguna cadena que analizar. En el caso de las clases, no se genera CSS y no se ejecuta nada en JavaScript: la cadena se pasa al núcleo, que analiza una sola vez cada cadena de clases distinta (y la guarda en caché), la convierte en reglas de estilo y las aplica. Las variantes que dependen de un estado (pulsado, modo oscuro, ancho de la ventana) las vuelve a aplicar el núcleo cuando ese estado cambia, y los estados pulsado y con foco se siguen de forma nativa, de modo que el feedback de `active:` (`.active(..)` en Rust) no necesita ningún viaje de ida y vuelta a tu código.

Las clases y la [prop `style`](./styling.md) producen los mismos estilos nativos y pueden combinarse; esta página cubre lo específico de las clases y sus equivalentes tipados. La [referencia de Tailwind](../modules/tailwind-reference.md) enumera todas las utilidades admitidas.

## class and classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** es una cadena de clases. Puede ser dinámica: ``class={`h-6 rounded bg-${color()}-500`}`` funciona, porque las clases se resuelven en tiempo de ejecución.
- **`classList`** asigna clases a condiciones: una clase se aplica mientras su valor sea verdadero. Se aplica después de `class`.
- **En Rust**, un método al que se le pasa un closure o una signal la sigue (`.bg(move || ..)`), `.style_when(condition, |s| ..)` aplica estilos mientras se cumple una condición, y `.when(condition, |v| ..)` decide una sola vez, cuando se crea el elemento.

Cómo se resuelven los conflictos:

1. **Las clases posteriores ganan** a las anteriores en la misma cadena: `"p-2 p-4"` es `p-4`. No hace falta `tailwind-merge`: un componente puede añadir al final el `class` que le pasa quien lo llama. En Rust también ganan los métodos posteriores.
2. **Las clases con variante se aplican después de las simples**, ordenadas según el orden de variantes de Tailwind (`hover:` antes de `active:`, `max-*:` de más ancho a menos ancho, breakpoints ascendentes, `dark:` al final), sea cual sea su posición en la cadena. Como en Tailwind, decide primero la variante más alta de una clase, luego la siguiente, y una clase con una variante más va después: `dark:hover:bg-a dark:bg-b` es `bg-a` al pasar el puntero en modo oscuro, y `max-md:p-2 max-lg:p-4` es `p-2` por debajo de `md`. Como en CSS, `odd:bg-a last:bg-b` da a una última fila impar `bg-a`, porque Tailwind ordena `odd` después de `last`.
3. **`style` gana a las clases.** Una clave de estilo es la propiedad CSS de su nombre, la misma que fijan las clases, así que reemplaza solo esa propiedad: `style={{ paddingLeft: 8 }}` reemplaza `pl-4` y conserva `pr-4`.
4. `!` hace importante una clase: `!p-0`.

Los componentes Rust (los de `nsh/base` y los del propio crate de una app) aceptan también `class` y `classList` desde TSX; tus clases se fusionan después de los estilos propios del componente y ganan con igual rango.

<a id="variants"></a>

## Variantes

| Variante | Se aplica cuando | Rust |
|---|---|---|
| `active:` | La vista está pulsada | `.active(\|s\| ..)` |
| `hover:` | Un puntero está sobre la vista (punteros de iPad y Mac) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | Un input tiene el foco | `.focus(\|s\| ..)` |
| `focus-within:` | La vista o un descendiente tiene el foco (el contenido de un `Overlay` es descendiente de la vista en la que está) | `.focus_within(..)` |
| `disabled:`, `enabled:` | La prop `disabled` del elemento es true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | El elemento está seleccionado (de un `Button`: `selected`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | El elemento está marcado (`accessibilityState.checked` es `true`; `"mixed"` no está marcado) | `.checked_style(..)` |
| `indeterminate:` | El elemento es indeterminado (`accessibilityState.checked` es `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | El elemento está expandido (`accessibilityState.expanded` es `true`): el disparador de un `Popover` o de un `Menu` mientras su popup está abierto | `.expanded_style(..)` |
| `aria-pressed:` | El elemento es un botón de alternancia que está activado (`accessibilityState.pressed` es `true`; `"mixed"` no está pulsado). No es `active:`, una pulsación en curso | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, no `"mixed"`) o `selected` es `true`, como las variantes `aria-*` de Tailwind: después de las pseudoclases, en el orden de sus nombres | |
| `data-<name>:` | El elemento tiene el atributo `data-*` `name`, como las variantes booleanas `data-*` de Tailwind (`&[data-range-start]`): lo que la parte de un componente muestra más allá de sus estados, como el día de un calendario al inicio de un rango (`data-range-start:`). Después de las variantes `aria-*`, en el orden de sus nombres | `Interactive::project_data(name, ..)` fija uno en una parte de un componente |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | El ancestro más cercano con la clase `group` está en ese estado, o tiene ese atributo `data-*` | `.group()` en el ancestro; `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` dentro |
| `group-active/name:` ... | Lo mismo, para un ancestro marcado con `group/name` | `.group_named("name")`; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | La posición propia del elemento entre sus hermanos. Para colorear la etiqueta de una fila según la posición de la fila, pon `last:text-*` en la fila: la etiqueta lo hereda | Rust normal a partir del índice de la fila (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | Da estilo al placeholder de un input (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | Colorea el resaltado de selección de un input o de un texto seleccionable, y de los que están dentro del elemento (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | La apariencia del sistema es oscura | Un `AdaptiveColor`, o `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | La ventana mide al menos 640, 768, 1024, 1280, 1536 puntos de ancho | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | La ventana es más estrecha que el breakpoint | Lo mismo, con `<` |
| `min-[600px]:`, `max-[600px]:` | Breakpoints arbitrarios | Lo mismo |
| `portrait:`, `landscape:` | La orientación de la ventana | `window().width > window().height` |
| `ios:`, `android:`, `web:` | La plataforma | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | La [dirección del layout](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` en una vista |
| `motion-safe:`, `motion-reduce:` | El ajuste de reducción de movimiento del usuario | `reduce_motion()` |

Las variantes se combinan: `dark:active:bg-zinc-700`, `md:landscape:flex-row`. En Rust, un `AdaptiveColor` dentro de un estilo `.active(..)` es `dark:active:`.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

`disabled` en cualquier elemento (`.disabled(..)` en Rust) aplica las clases `disabled:` (`.disabled_style(..)`) y quita sus manejadores de pulsación de lo montado, de modo que tampoco muestra feedback de pulsación:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

Los breakpoints se comparan con la ventana (la superficie en la que NSH renderiza), no con el dispositivo: en una vista dividida de iPad o en una ventana redimensionable, siguen el ancho de la ventana, igual que `window()`.

<a id="what-differs-from-tailwind-on-the-web"></a>

## Qué difiere de Tailwind en la web

- **Las unidades son puntos.** `p-4` (`.p_4()`) son 16 puntos (1 paso de espaciado = 4pt, 1rem = 16pt). Los valores arbitrarios en `px` también son puntos: `p-[13px]` (`.p(px(13.0))`) son 13pt.
- **`flex` es una fila**, como en CSS: `class="flex"` dispone a sus hijos en una fila salvo que una clase de dirección indique otra cosa (en cualquier parte de la cadena: `flex-col flex` es una columna). El `display: "flex"` de un estilo y el `.flex()` de Rust son filas del mismo modo, y una vista que no fija display mantiene la columna predeterminada de NSH. `block` y `flow-root` usan layout de bloque, y también `inline` y `inline-block`, tal como un navegador los dispone dentro de un padre flex o grid. En Rust, `.flex_row()` y `.flex_col()` fijan la dirección.
- **Las clases de texto en las vistas se heredan.** `text-*`, `font-*`, `leading-*`, `tracking-*` y las demás utilidades de texto en una vista (`.text_color(..)`, `.font_weight(..)`, ... en Rust) pasan a los elementos de texto y de input de su interior, como hace la herencia en CSS: `<View class="text-white">` pone blancas sus etiquetas.
- **Cada vista es una caja propia.** `overflow-x-hidden` y `overflow-y-hidden` recortan ambos ejes, como `overflow-hidden` (el desplazamiento es cosa del elemento [scroll](../elements/scroll.md)); `invisible` oculta la vista y todo lo que contiene; `mix-blend-*` mezcla una vista con todo lo dibujado detrás; las cajas `block` mantienen separados sus propios márgenes y los de sus hijos; una vista `absolute` se coloca en su ancestro posicionado más cercano, como en CSS; `fixed` dispone una vista en su vista raíz (los demás elementos se colocan como `absolute`).
- **El texto conserva sus espacios en blanco.** Los espacios y saltos de línea de una cadena se dibujan tal como están escritos, y `whitespace-*` define el ajuste de línea; el compilador de JSX colapsa los espacios en blanco del texto literal de JSX, como hace JSX.
- **Las transiciones animan grupos de propiedades**: `transition` anima colores, opacidad, sombras y transformaciones, `transition-all` anima además los radios de las esquinas y los grosores de borde; los filtros, los filtros de fondo, los degradados y el layout toman sus nuevos valores de inmediato.
- **`focus-visible:` es `focus:`**: se aplica siempre que el elemento tiene el foco.
- **Los fondos de estado se ven sobre los degradados.** En CSS un degradado cubre `background-color`, así que `active:bg-*` en una superficie `bg-linear-*` nunca se vería; en NSH un color de fondo de `active:`, `hover:`, `focus:` o `group-*:` reemplaza el degradado mientras ese estado se mantiene (a menos que el estado fije un degradado propio, como `active:from-*`). Lo mismo ocurre con `activeStyle` y los demás estilos de estado, y con los colores de fondo animados.
- **Los ajustes de texto y táctiles son claves de estilo**: `line-clamp-*` fija `numberOfLines`, `text-ellipsis` y `text-clip` fijan `textOverflow`, `truncate` ambos, `select-*` fija `userSelect` y `pointer-events-*` fija `pointerEvents`, así que funcionan en las variantes de estado y pierden frente al `style` en línea, como toda clase; `caret-*`, `placeholder:text-*` y `selection:bg-*` fijan del mismo modo los estilos `caretColor`, `placeholderColor` y `selectionColor`. En Rust son métodos de `Styled` (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap` mantiene un texto en una sola línea como clase. `object-*` fijan los estilos `objectFit` y `objectPosition` de imágenes y vídeos, que las claves de un estilo reemplazan como cualquier otra.
- **El conjunto admitido**: las utilidades y variantes de Tailwind 4 que tienen un significado nativo. Las variantes `peer-*`, los pseudoelementos (`before:`, `after:`) y las propiedades arbitrarias (`[mask-type:luminance]`) se notifican como clases desconocidas, y lo mismo ocurre con toda utilidad para la que NSH no tiene un significado nativo, de modo que una clase nunca significa algo distinto de lo que significa en un navegador. Las pistas de renderizado (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) se aceptan y no cambian nada.

Todo lo demás funciona como documenta Tailwind 4: la paleta de colores, los modificadores de opacidad (`bg-black/40`), los valores arbitrarios (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`; en `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` y las utilidades `m` también las variables de entorno, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, consulta [Safe area](../elements/safe-area.md) y [Keyboard](../elements/keyboard.md)), las fracciones (`w-1/2`, `translate-x-1/2`), las sombras y los anillos, los degradados (`bg-linear-to-r`, `bg-radial`, `bg-conic` con `from-` / `via-` / `to-`), los filtros, `backdrop-blur-*`, `mix-blend-*`, las transformaciones, `transition-*` y `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce`, y grid, cada uno con su método tipado en Rust. Los límites de plataforma de los [filtros y la mezcla](./styling.md#filters-and-blending) se aplican también a las clases.

<a id="theme"></a>

## Tema

Las clases se resuelven frente al tema predeterminado de Tailwind 4. Amplíalo en `nsh.json` bajo `"tailwind"`; tus entradas se añaden a las predeterminadas (o reemplazan la predeterminada del mismo nombre):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

Con este tema, `bg-brand-500`, `text-brand` (el tono `DEFAULT`), `border-ink`, `rounded-card`, `font-display` y `tablet:flex-row` son clases válidas.

| Clave | Valores | Genera |
|---|---|---|
| `colors` | Un color CSS, o un objeto de tonos (`"DEFAULT"` para el nombre solo) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | Puntos por paso de espaciado (4 por defecto) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Puntos por `rem` en valores arbitrarios (16 por defecto) | |
| `breakpoints` | Puntos | Variantes `name:` |
| `container` | Puntos | Tamaños `max-w-*` |
| `fontSize` | Puntos, o `[size, lineHeight]` con la altura de línea como múltiplo del tamaño | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | Un nombre de familia (una familia del sistema o el nombre de una [fuente importada](./fonts.md)) | `font-*` |
| `tracking` | Ems | `tracking-*` |
| `leading` | Múltiplos del tamaño de fuente | `leading-*` |
| `radius` | Puntos | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | Un `box-shadow` CSS | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | Puntos | `blur-*`, `backdrop-blur-*` |
| `perspective` | Puntos | `perspective-*` |
| `aspect` | Una proporción (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

Las claves desconocidas y los valores no válidos son errores de compilación (`nsh.json: tailwind: unknown theme key 'colours'`). El tema se compila en el bundle y se aplica antes del primer fotograma.

El tema de Tailwind da forma a tus clases. Los métodos tipados mantienen las escalas predeterminadas de Tailwind, de modo que un componente Rust se ve igual en todas las apps, y toman la apariencia de la app de los design tokens de su tema, `"theme"` en `nsh.json` ([Rust](./rust.md#theme)).
<a id="theme-tokens"></a>

## Tokens del tema

El tema de la app (`"theme"` en `nsh.json`) contiene sus tokens de diseño: los colores de shadcn/ui (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), su `radius`, sus fuentes `font-sans` y `font-mono`, y cualquier token que añada la app. Las clases los nombran como nombres de Tailwind a las variables de un `@theme` de CSS, los componentes Rust los leen con `theme()` desde `nsh_base`, y TSX los lee con `token()` desde `nsh`, de modo que una pantalla TSX y los componentes Rust siguen el mismo tema:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

El nombre de un token es el de su variable CSS sin `--`, tal como lo escribe el archivo del tema: `muted-foreground`, `radius`, `chart-1`. En Rust, los tokens de shadcn son métodos de `theme()` (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), y cada token es `theme().color("up")`, `theme().number("radius-card")` o `theme().font("font-display")`.

| Forma | Admite | Ejemplo |
|---|---|---|
| Un nombre de color en cualquier utilidad de color | Un color del tema, también con opacidad | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, el atajo de variables de Tailwind 4 | Un color del tema o un número | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | Lo mismo, con tipo explícito cuando una utilidad admite varios tipos | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | Las fuentes del tema, cuando las define | `font-mono` |

- **Tus propios tokens.** Cada nombre del archivo del tema es un token, igual que cada variable de un `@theme` de CSS: `"up": "#16a34a"` crea `bg-up`, `text-up` y `bg-up/30`; `"radius-card": "14px"` crea `rounded-(--radius-card)`; `"font-display": "Pacifico"` crea `font-(family-name:--font-display)`. Las longitudes están en puntos; `(number:--name)` pasa el número tal cual.
- **Fuentes.** `font-sans` es la fuente de la app: todo texto que no define una familia propia se dibuja con ella, igual que una página con el `--font-sans` de Tailwind. `font-mono` es la fuente de `font-mono` y del código en `TextView`. Si no se definen, ambas son las fuentes del sistema.
- **Ambas apariencias.** Un token tiene el valor claro y el oscuro del tema: `bg-primary`, `theme().primary` y `token("primary")` cambian con la apariencia por sí solos, sin clase `dark:`. Un color que el tema define solo en una apariencia se usa en ambas.
- **Tus colores de Tailwind tienen prioridad.** Un nombre en `"tailwind"` `colors` o en la paleta de Tailwind es ese color, de modo que `bg-primary` es un token del tema cuando el tema de Tailwind no tiene ningún color `primary`.
- **El tema puede cambiar mientras la app se ejecuta.** Cuando una app incrustada en una app nativa recibe el tema de esa app, y cada vez que el tema cambia, se actualizan las clases que nombran tokens, los enlaces de Rust que leen `theme()` y el código TSX que lee `token()`; las clases y los enlaces se actualizan de forma nativa. Los tokens que el tema de la app anfitriona no tiene conservan los valores del `"theme"` de la propia app (y después los del tema por defecto). Un anfitrión que solo añade su marca proporciona sobrescrituras del tema, es decir, los tokens que su marca cambia, en el mismo formato de archivo ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), `AppView::set_theme_overrides` en los escritorios).
- **Se comprueban como las demás clases.** Un nombre que no es un token del tema por defecto ni del `"theme"` de la app es una clase desconocida al compilar (`unknown class 'bg-chart-up'`). Para usar un token que solo proporciona la app anfitriona, dale también un valor en el `"theme"` de la app: ese valor se muestra cuando la app se ejecuta por sí sola.

Las clases que nombran tokens se resuelven una vez por tema, como cualquier otra clase: dibujarlas cuesta lo mismo que un color de la paleta.

<a id="445-in-tsx"></a>

### `token()` en TSX

`token(name)` de `nsh` es el valor de un token en la apariencia mostrada: un color como `#rrggbbaa`, una longitud como un número de puntos, una fuente como el nombre de su familia. Es reactivo, por lo que el código que lo lee en un componente, un memo o un efecto se ejecuta de nuevo cuando cambia el tema o la apariencia, lo que resulta útil para valores que van donde no llega ninguna clase, como un canvas o un gráfico:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

Los nombres tienen tipo: NSH escribe los tokens de la app en `.nsh/types/nsh/tokens.d.ts` a partir de su tema, de modo que `token("up")` es un `string` una vez que `"up"` está en el tema, y un nombre que el tema no tiene es un error de tipos.

<a id="the-class-check"></a>

## La comprobación de clases

`nsh build`, `nsh dev`, `nsh run` y `nsh test` comprueban los nombres de clase estáticos de tu JSX (literales de cadena en `class` y las claves de `classList`) con el mismo analizador y el mismo tema que usa el entorno de ejecución, y avisan de las clases que no existen:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

Las advertencias no hacen fallar la compilación. Las clases construidas en tiempo de ejecución (``bg-${color()}-500``) se comprueban la primera vez que el entorno de ejecución las ve, y este registra cada clase desconocida una sola vez (`unknown classes: ...`). Los métodos con tipo los comprueba el compilador de Rust.

<a id="classes-or-styles"></a>

## ¿Clases o estilos?

Ambos se resuelven de forma nativa y cuestan casi lo mismo. Las clases son más cortas y ofrecen variantes (estados de pulsación, modo oscuro, breakpoints) sin código. Los estilos en línea admiten valores calculados en JavaScript y aceptan [valores animados nativos](./animation.md) (`opacity: fade`, `translate: [x, 0]`). La mayoría de las apps TSX usan clases para el aspecto estático y `style` para lo que se calcula o se anima. Los componentes Rust usan métodos con tipo para ambos casos, y enlazan valores animados con `.bind_opacity(..)`, `.bind_translate_x(..)` y los demás enlaces.

<a id="related"></a>

## Relacionado

- [Estilos](./styling.md): la propiedad style, los métodos con tipo y los límites de los efectos según la plataforma.
- [Referencia de Tailwind](../modules/tailwind-reference.md): todas las utilidades y variantes.
- [Layout](./layout.md): flexbox y grid, también disponibles como clases.
