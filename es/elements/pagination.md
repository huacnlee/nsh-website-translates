---
title: "Paginación"
description: "El componente Pagination: las páginas de un conjunto entre las que desplazarse, con las páginas alrededor de la actual, puntos suspensivos, Anterior y Siguiente, un paginador compacto, el teclado y la página actual para lectores de pantalla, con estilo definido por la app."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---


# Paginación

Una paginación permite moverse entre las páginas de un conjunto: resultados de búsqueda, las filas de una tabla, un archivo. Muestra Anterior, las páginas alrededor de la actual (la primera y la última siempre, unos puntos suspensivos por cada tramo omitido), los hijos de la app y Siguiente. Se encarga del comportamiento: qué páginas se muestran, las pulsaciones, el teclado, Anterior y Siguiente desactivados en los extremos, el punto de referencia de navegación y la página actual para los lectores de pantalla. El aspecto es responsabilidad de la app: los elementos no tienen color, tamaño ni etiqueta propios, y la app los estiliza o los dibuja.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `pagination()` crea uno con un setter por prop (`.page(..)`, `.total_pages(..)`), `.on_change(..)` para la página que elige el usuario, los métodos de estilo tipados para la fila y `.child(..)` para el contenido de la app.

<a id="the-page"></a>

## La página

La página pertenece a la app: `page` es la actual, desde 1, y `onChange({ page })` informa de la página que el usuario eligió con una pulsación sobre una página, sobre Anterior o sobre Siguiente. La app la establece, carga esa página y muestra sus filas. `totalPages` es cuántas hay; un `page` mayor que la última muestra la última. La página actual no informa de nada al pulsarla, y tampoco lo hacen Anterior en la primera página ni Siguiente en la última.

<a id="the-pages-shown"></a>

## Las páginas mostradas

Con `visiblePages` (al menos 5, el valor por defecto) la fila muestra todas las páginas mientras quepan. Superado ese límite, muestra la primera y la última página, la actual con tantas páginas a cada lado como quepan, `(visiblePages - 3) / 2`, y unos puntos suspensivos por cada tramo de páginas omitido:

| `page` de 20, `visiblePages={7}` | Se muestra |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

Diez mil páginas muestran los mismos siete elementos. Un `visiblePages` impar centra la página actual.

<a id="items"></a>

## Elementos

Cada elemento recibe los `itemClass` y `itemStyle` de la app: la página actual es `selected:`, un elemento que no admite pulsación es `disabled:`, el elemento con el foco del teclado es `focus:`. La app es quien organiza la fila con `class` (una fila por defecto; `gap-*`, `justify-*`).

Sin `renderItem`, una página muestra su número, los puntos suspensivos muestran `…`, y Anterior y Siguiente muestran sus etiquetas de accesibilidad (`‹` y `›` si no las hay). `renderItem` dibuja el contenido de cada elemento a partir de un `PaginationItemState`:

| Campo | Tipo | Descripción |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | Qué es el elemento. |
| `page` | `number` | El número de una página; la página a la que lleva Anterior o Siguiente (la actual en los extremos); la primera página oculta de unos puntos suspensivos. |
| `start`, `end` | `number` | Las páginas ocultas de unos puntos suspensivos: `start` incluida, `end` (la siguiente página mostrada) no. |
| `current` | `boolean` | La página actual. |
| `disabled` | `boolean` | No admite pulsación: Anterior en la primera página, Siguiente en la última, todo en una paginación desactivada. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

Unos puntos suspensivos no admiten pulsación por sí mismos: lo que hagan depende de la app. Un `Menu` dibujado en ellos enumera las páginas que ocultan, como hace `JumpMenu` más arriba.

<a id="compact"></a>

## Compacto

`compact` muestra solo Anterior, los hijos y Siguiente: un paginador para pantallas estrechas, con la página indicada en los hijos.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

En ambas formas, los hijos se sitúan después de las páginas y antes de Siguiente: un contador de páginas, un campo para ir a una página.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | obligatorio | La página actual, desde 1; la app la establece en `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | obligatorio | Cuántas páginas hay, al menos 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | El máximo de páginas mostradas a la vez, incluidas la primera y la última; al menos 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | Solo Anterior, los hijos y Siguiente. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ningún elemento admite pulsación ni foco del teclado; se aplican los estilos de `disabled:`, y los lectores de pantalla indican que están atenuados. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla a la navegación: lo que se recorre con ella. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para Anterior y Siguiente, y su contenido sin `renderItem`. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | ninguno | El aspecto de cada elemento: `selected:` en la página actual, `disabled:`, `focus:`; los estilos de texto se transmiten a su contenido. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | ninguno | Dibuja el contenido de cada elemento a partir de su estado. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido de la app después de las páginas, antes de Siguiente. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto y la disposición de la fila. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: la página que el usuario eligió con una página, Anterior o Siguiente. La página actual nunca se notifica. |

<a id="motion"></a>

## Movimiento

La página actual se desplaza de un elemento a otro según indican las clases `selected:` de la app: `transition-colors` en `itemClass` funde el resaltado desde la página que se deja hasta la página a la que se llega. Un cambio de página mantiene cada elemento en su sitio y cambia lo que muestran los elementos, de modo que la fila nunca parpadea; las transiciones de la app se detienen con movimiento reducido (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## Accesibilidad

- La fila es un punto de referencia de navegación cuyo nombre proviene de `accessibilityLabel`.
- Cada página, Anterior y Siguiente es un botón. La página actual se anuncia como la página actual (el
  `aria-current="page"` de ARIA) y está seleccionada; Anterior en la primera página y Siguiente en la última están atenuados.
- En macOS y la web, cada página, Anterior y Siguiente es una parada del foco del teclado, y Retorno y Espacio la pulsan. Una página pulsada desde el teclado conserva el foco una vez que la app la muestra, vaya a parar donde vaya en la fila, y lo mismo ocurre con la primera o la última página cuando Anterior o Siguiente llegan a ella.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre un elemento.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic; en macOS y la web, Tab llega a los elementos.
- Todas las plataformas dibujan lo que la app estiliza.
