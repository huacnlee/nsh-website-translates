---
title: "Toolbar"
description: "Toolbar, ToolbarGroup y ToolbarSeparator: una barra de botones, interruptores y enlaces que constituye una única parada del foco del teclado, cuyas teclas de flecha permiten desplazarse por ella, con grupos con nombre y separadores. El aspecto y el estado de cada control dependen de la aplicación."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---


# Toolbar

Una barra de herramientas es una barra de controles: el formato de un editor de texto, el transporte de un reproductor multimedia, una paleta vertical de herramientas.
`Toolbar` se encarga del teclado y de la semántica de una: los lectores de pantalla anuncian una barra de herramientas (nombrada por su
`accessibilityLabel`), y el teclado llega a ella en una sola parada y se mueve entre sus elementos con las teclas de flecha de su
`axis`. Sus elementos son los `Button`, `Toggle` y `Link` que contiene, a cualquier profundidad. Un `ToolbarGroup` es una serie con nombre de
elementos relacionados (deshacer y rehacer, la alineación), y un `ToolbarSeparator` es una línea que la app dibuja entre series. El aspecto
es de la app: la barra de herramientas no tiene colores, relleno ni espacios propios, y cada control conserva su propio estado.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` y `ToolbarSeparator` provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base`
en Rust. La barra de herramientas no guarda ningún valor: a un toggle dentro de ella se le indica si está pulsado y reporta `onChange`, un
botón reporta `onPress`, y la app conserva el estado. En Rust, `toolbar()`, `toolbar_group()` y
`toolbar_separator()` los crean, con un setter por prop (`.axis(..)`, `.disabled(..)`), los métodos de estilo tipados y
`.child(..)` para su contenido.

## Props

### Toolbar

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La dirección en que se disponen sus elementos: las teclas de flecha que se mueven a lo largo de ella (Izquierda y Derecha, o Arriba y Abajo) y la dirección en que distribuye a sus hijos (una fila o una columna). Se lee cuando se crea la barra de herramientas. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos los elementos de la barra de herramientas están deshabilitados, sea cual sea su propio `disabled`: sin pulsaciones, sin parada del foco del teclado y atenuados para los lectores de pantalla. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla a la barra de herramientas ("Formato"), útil en una página con más de una. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los elementos, sus grupos y separadores, y cualquier otra cosa que la app distribuya entre ellos (un título, un espaciador, un campo de entrada). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La disposición y el aspecto de la barra: alineación, espacios, relleno, su superficie. |

### ToolbarGroup

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos los elementos del grupo están deshabilitados, sea cual sea su propio `disabled`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al grupo ("Historial", "Alineación"). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los elementos del grupo y cualquier otra cosa que la app distribuya entre ellos. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La disposición y el aspecto del grupo. Se extiende a lo largo del eje de la barra de herramientas. |

### ToolbarSeparator

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La línea: un trazo fino a lo ancho de una fila (`h-5 w-px bg-border`) o de una columna (`h-px self-stretch bg-border`). |

<a id="items"></a>

## Elementos

Los elementos de una barra de herramientas son los `Button`, `Toggle` y `Link` que contiene, en sus grupos y también en un
[`ToggleGroup`](./toggle.md) dentro de ella. El activador de un [`Menu`](./menu.md) o de un [`Popover`](./popover.md) es
también un elemento: la vista en su ranura `trigger`, a la que el popup le da sus pulsaciones, su foco y su estado `expanded`. Una
herramienta que la app dibuja por sí misma es un `Button` con las clases de la app: un `Button` no tiene aspecto propio, por lo que se ve como
la app lo estiliza y es un elemento (un `View` con `onPress` sigue siendo una parada independiente, fuera de las teclas de flecha). Un
`ToggleGroup` dentro de una barra de herramientas es uno de sus grupos: sus toggles son los elementos de la barra, los lectores de pantalla oyen un grupo,
y su `disabled` sigue deshabilitando sus propios toggles. Otros controles (un `Input`, un `Select`, un `Slider`) siguen siendo paradas
independientes y conservan sus teclas de flecha; colócalos al final de la barra. Lo que muestra un popup que abre un elemento (los
campos y botones de un popover, los elementos de un menú, los enlaces de una hover card) no forma parte de la barra de herramientas. Las teclas de flecha recorren los elementos en el orden en que
la barra los dispone, sin importar a qué profundidad esté cada uno, y un elemento que la app muestre más tarde ocupa su lugar entre ellos.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con | Estados |
|---|---|---|---|
| La barra | | `class`, `style` de `Toolbar` | |
| Un grupo | la barra | `class`, `style` de `ToolbarGroup` | |
| Un separador | la barra, un grupo | `class`, `style` de `ToolbarSeparator` | |
| Un elemento | la barra, un grupo | los `class`, `style` propios del elemento | los suyos: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

Muestra el elemento en el que está el teclado con estilos `focus:`, y un toggle pulsado mediante su propia superficie (consulta
[Guías de diseño](../docs/design-guides.md#interaction-states)).

## Vertical

Una paleta de herramientas es una columna: `axis="vertical"` dispone los elementos de arriba abajo, y Arriba y Abajo se mueven a lo largo de ellos.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## Deshabilitado

`disabled` en una barra de herramientas deshabilita todos sus elementos, una barra que la app bloquea; en un grupo, los elementos del grupo. Un elemento deshabilitado
no recibe pulsaciones, las teclas de flecha lo omiten y los lectores de pantalla lo anuncian como atenuado:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## Accesibilidad

- `Toolbar` tiene el rol `"toolbar"`, nombrado por `accessibilityLabel`; sus elementos siguen siendo elementos independientes. En iOS la
  barra de herramientas es un grupo semántico en el que entra VoiceOver.
- `ToolbarGroup` tiene el rol `"group"`, nombrado por su `accessibilityLabel`, de modo que una serie de elementos se lee como una sola unidad. Un
  `ToggleGroup` dentro de una barra de herramientas también es un grupo.
- `ToolbarSeparator` no es un elemento para los lectores de pantalla.
- `disabled` se anuncia como lo anuncia la plataforma (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad
  del navegador).

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

En macOS y en la web, donde Tab llega a las vistas que reciben pulsaciones, un `Toolbar` sigue el
[patrón de barra de herramientas de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Tecla | Qué hace |
|---|---|
| Tab, Shift+Tab | Entra en la barra de herramientas por el elemento donde el foco estuvo por última vez (al principio, el primer elemento que no está deshabilitado), y sale de ella en un solo paso. |
| Derecha, Izquierda (`axis="horizontal"`) | Mueve el foco al elemento siguiente o al anterior, del último al primero y viceversa. |
| Abajo, Arriba (`axis="vertical"`) | Mueve el foco al elemento siguiente o al anterior, del último al primero y viceversa. |
| Inicio, Fin | Mueve el foco al primer o al último elemento. |
| Espacio, Retorno | Pulsa el elemento enfocado. |

Las teclas de flecha omiten los elementos deshabilitados y no pulsan nada: un toggle solo cambia cuando se pulsa. El otro par de
flechas se deja a los elementos (el activador de un menú abre su menú con Abajo). En una disposición de derecha a izquierda, una barra de herramientas
horizontal avanza desde la derecha, de modo que Izquierda pasa al elemento siguiente y Derecha al anterior; una vertical mantiene Abajo y
Arriba.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS, Android y Mac Catalyst: cada elemento se pulsa con un toque; la barra de herramientas es un grupo que anuncian los lectores de pantalla.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y en la web la barra de herramientas es una sola parada
  de Tab, y las teclas de flecha, Inicio y Fin se mueven entre sus elementos ([Teclado](#keyboard)).
- Todas las plataformas dibujan lo que la app estiliza: la barra, sus grupos, sus separadores y sus elementos.
