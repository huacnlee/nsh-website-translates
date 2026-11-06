---
title: "Link"
description: "El componente Link: contenido que lleva a algún lugar al pulsarlo, una página, un sitio o una ruta de la aplicación, con pulsaciones, activación mediante teclado, el estado deshabilitado y el rol de enlace para lectores de pantalla, con estilos definidos por la aplicación."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---


# Link

Un enlace lleva al usuario a algún lugar: una página web, otra app (`mailto:`, `tel:`) o una pantalla de la propia app. Se encarga del comportamiento: pulsaciones, Return y Espacio mientras tiene el foco del teclado, el estado deshabilitado y el rol de enlace para los lectores de pantalla. El aspecto es cosa de la app: un `Link` no tiene color, subrayado ni etiqueta propios, y lo que se muestra son sus hijos. `href` indica adónde lleva; es un dato para la apertura, nunca texto en pantalla.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `link()` crea uno con un setter por prop (`.href(..)`, `.open_with(..)`), un listener por evento (`.on_open(..)`, `.on_press(..)`), los métodos de estilo tipados para el enlace y `.child(..)` para su contenido.

<a id="opening"></a>

## Apertura

Una pulsación, un clic, o Return o Espacio sobre el enlace enfocado abren su `href`:

1. `onOpen({ href })` informa de adónde lleva.
2. Con `openWith="system"` (el valor por defecto), una URL de otra app o sitio, es decir, una con esquema (`https:`, `mailto:`, `tel:`, un esquema que registró otra app), se abre fuera de la app, tal como la abre [`openUrl`](../modules/nsh.md): primero la toma el router de la app anfitriona y después el sistema. Cualquier otro `href`, una ruta de la app (`/orders/42`) o `#anchor`, se notifica y se queda en la app.
3. `onPress()` informa de la pulsación.

Con `openWith="app"`, el manejador `onOpen` de la app es el que abre el enlace: una ruta propia, una página en un web view dentro de la app, una confirmación previa.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

Abrir una URL fuera de la app requiere la capacidad `openUrl` cuando la app declara capacidades en `nsh.json` (`"openUrl": true`, o `{ "schemes": ["https", "mailto"] }`).

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | ninguno | Adónde lleva el enlace: una URL, o una ruta de la app. Se informa con `onOpen`, nunca se muestra. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | Quién abre `href`: el sistema abre una URL de otra app o sitio; `"app"` lo deja en manos de `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones, sin respuesta visual a la pulsación, sin foco del teclado; se aplican los estilos `disabled:` y los lectores de pantalla indican que está atenuado. |
| `current` | `.current(..)` | `boolean` | `false` | El enlace a la página en la que está el usuario, en una navegación o un breadcrumb: los lectores de pantalla indican que es la página actual. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla cuando el contenido dice muy poco (un icono). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | ninguno | Cuánto más allá de sus límites siguen contando las pulsaciones, en puntos: un número para todos los lados, o los lados por nombre. Como el `hitSlop` de una vista. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido: una etiqueta, un icono, cualquier cosa que muestre la app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del enlace: su color, subrayado, relleno; las propiedades de texto pasan a los textos que contiene. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del enlace mientras está pulsado, con el cursor encima, enfocado o deshabilitado, como las clases `<state>:`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | El enlace abre `href`: con `openWith="app"` lo abre el manejador, con `"system"` oye lo que se pidió abrir al sistema. Ocurre antes que `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | Se pulsó el enlace: un toque, un clic, o Return o Espacio mientras tiene el foco del teclado. |

Un enlace deshabilitado no informa de nada, y una pulsación sobre él no llega a ninguna vista pulsable que lo rodee.

<a id="states"></a>

## Estados

La app da estilo a cada estado con clases o props de estilo:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Recordar un enlace visitado corresponde a la app: guarda los href que abrió y da estilo a esos enlaces según su propio estado.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## Dentro de un texto

Un `Link` dentro de un `<Text>` es una caja en línea del párrafo, como toda vista dentro de un texto: se coloca en la línea, conserva sus propios estados, foco y rol, y permanece en una sola línea. `align-text-bottom` coloca un enlace de una línea de texto sobre la línea base del párrafo:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

Un enlace que se divide junto con las líneas del párrafo es un `<Text>` anidado con `role="link"` y `onPress` (consulta [Text](./text.md)), tal como [TextView](./text-view.md) dibuja los enlaces de un documento.

<a id="a-small-target-with-hitslop"></a>

## Un objetivo pequeño con hitSlop

Un enlace puede ser más pequeño que un dedo: un icono, una palabra corta. `hitSlop` hace que cuenten las pulsaciones que caen cerca de él, en puntos más allá de cada lado, sin cambiar su diseño ni su aspecto: un número para todos los lados, o los lados por nombre (`{ top: 8, bottom: 8 }`), tal como los toma el [`hitSlop` de una vista](./index.md#presses-and-feedback).

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## Accesibilidad

- Un enlace es un solo elemento para los lectores de pantalla, con el rol `"link"`; su etiqueta es el texto de sus hijos, o `accessibilityLabel`. `href` sigue siendo un dato: los lectores de pantalla dicen la etiqueta.
- `current` se anuncia como la página actual (`aria-current="page"` de ARIA), y `disabled` como la plataforma anuncia un elemento atenuado.
- En macOS y la web un enlace es una parada del foco del teclado: Tab llega hasta él, Return y Espacio lo abren, y los estilos `focus:` muestran dónde está el foco.

Consulta [Accessibility](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre el enlace.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Return y Espacio también abren el enlace que tiene el foco del teclado.
- La web renderiza un enlace como un elemento con `role="link"`.
- Todas las plataformas dibujan lo que la app define en sus estilos.
