---
title: "Checkbox"
description: "El componente Checkbox: un control marcado, desmarcado o indeterminado que gestiona las pulsaciones, la activación con el teclado, el estado deshabilitado y su rol y valor para los lectores de pantalla, con un indicador que la aplicación estiliza y marca."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---


# Checkbox

Un checkbox selecciona una opción, un elemento de una lista o todos. Está marcado, desmarcado o indeterminado (ni lo uno ni lo otro: un «seleccionar todo» sobre una selección parcial). Se encarga del comportamiento: pulsaciones, activación por teclado, el estado deshabilitado, y el rol de checkbox y su valor para los lectores de pantalla. El aspecto es de la app: un `Checkbox` no tiene caja, marca, colores, tamaños ni etiqueta propios. Se compone de un indicador (la caja) con la marca de la app dentro, y después sus hijos (una etiqueta), y la app da estilo a cada parte, con clases `checked:`, `indeterminate:` y `disabled:` que siguen al checkbox.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. El valor es de la app: una pulsación informa del siguiente valor con `onChange`, y el checkbox muestra el `checked` y `indeterminate` que la app le devuelve. En Rust, `checkbox()` crea uno con un setter por prop (`.checked(..)`, `.indicator_style(..)`), un listener por evento (`.on_change(..)`), los métodos de estilo tipados para el propio checkbox y `.child(..)` para su etiqueta; el estilo del indicador admite los métodos de estado (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`) que siguen al checkbox.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Marcado o no. Una pulsación informa del siguiente valor con `onChange`; el checkbox muestra el valor que la app le devuelve. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Ni marcado ni desmarcado, por encima de `checked` mientras se mantiene: los lectores de pantalla dicen que es mixto, y una pulsación pide marcado. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones ni respuesta a la pulsación; los estilos `disabled:` se aplican al checkbox y a su indicador, y los lectores de pantalla dicen que está atenuado. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del checkbox mientras está marcado y no deshabilitado, como clases `checked:`. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del checkbox mientras es indeterminado y no deshabilitado, como clases `indeterminate:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla: qué selecciona el checkbox, cuando sus hijos no tienen texto que lo diga. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | Qué es para los lectores de pantalla, cuando es algo más específico (un elemento de menú marcado: `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador, la caja que muestra el valor. |
| `indicator` | `.indicator(..)` | `JSX.Element` | ninguno | El contenido del indicador: la marca (una marca de verificación, un guion), que la app muestra según su valor. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | ninguno | Hasta qué distancia fuera de sus límites siguen contando las pulsaciones, en puntos: un número para todos los lados, o los lados con nombre. Como el `hitSlop` de una vista. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido tras el indicador: una etiqueta, que los lectores de pantalla leen. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio checkbox: la fila que rodea al indicador y a la etiqueta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del checkbox mientras está pulsado, con hover, con foco o deshabilitado, como las clases `<state>:`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | El checkbox fue pulsado: un toque, un clic, Espacio o Return mientras tiene el foco del teclado, o la activación de un lector de pantalla. Informa del valor que el checkbox pide como `checked`: `true` desde desmarcado y desde indeterminado, `false` desde marcado. |

Un checkbox deshabilitado no informa de nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilo con | Estados |
|---|---|---|---|
| El checkbox | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (o `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| El indicador | el checkbox, primero | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` siguen al checkbox |
| La marca | el indicador | sus propios elementos (`indicator`) | `group-checked:`, `group-indeterminate:` y las demás variantes `group-*:` con `group` sobre `indicatorClass` |
| La etiqueta | el checkbox, tras el indicador | sus propios elementos (`children`) | variantes `group-*:` con `group` sobre el `class` del checkbox |

La marca es contenido de la app, así que muestra lo que la app decida: una marca de verificación mientras está marcado y un guion mientras es indeterminado, elegidos según el valor que la app mantiene, o ambas marcas con clases `group-checked:` / `group-indeterminate:` que eligen la que se muestra.

<a id="indeterminate"></a>

## Indeterminado

Un checkbox «seleccionar todo» es indeterminado mientras hay algunos elementos seleccionados. Una pulsación pide marcado, y la app selecciona todos los elementos:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## Deshabilitado

Un checkbox deshabilitado no admite pulsaciones, y los lectores de pantalla lo anuncian como atenuado. Sus clases `disabled:` y las de su indicador se aplican, por encima de las `checked:` y `indeterminate:`:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## Un objetivo pequeño con hitSlop

Un checkbox sin etiqueta a su lado (la caja de selección de una fila) puede ser más pequeño que un dedo. `hitSlop` hace que cuenten las pulsaciones que caen cerca, en puntos más allá de cada lado, sin cambiar su disposición ni su aspecto: un número para todos los lados, o los lados con nombre (`{ top: 8, bottom: 8 }`), como los toma el [`hitSlop` de una vista](./index.md#presses-and-feedback).

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## Accesibilidad

- Un checkbox es un único elemento para los lectores de pantalla, con el rol `"checkbox"` (o su `role`) y su valor: marcado, desmarcado, o mixto mientras es indeterminado. El indicador y la marca son partes de él. Su etiqueta es el texto de sus hijos; indica `accessibilityLabel` cuando no tiene ninguno.
- `disabled` se anuncia como lo anuncia la plataforma (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad del navegador).
- En macOS y la web un checkbox es una parada del foco del teclado: Tab llega hasta él, Espacio y Return lo alternan, y los estilos `focus:` muestran dónde está el foco.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre el checkbox, etiqueta incluida.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Espacio y Return también alternan el checkbox que tiene el foco del teclado.
- Cada plataforma dibuja lo que la app estiliza: el indicador, la marca y sus transiciones.
