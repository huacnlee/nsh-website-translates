---
title: "Avatar"
description: "Los componentes Avatar y AvatarGroup: la imagen de una persona, o un elemento alternativo mientras se carga, cuando falla y cuando no hay ninguna, con el estado de carga ejecutado de forma nativa; y una fila de avatares que muestra los primeros y representa al resto."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---


# Avatar

Un avatar muestra la imagen de una persona: un miembro de un equipo, el autor de un comentario, la cuenta en una cabecera. Mientras la imagen se carga, cuando falla y cuando no hay ninguna, muestra un contenido de respaldo: las iniciales del `name` de la persona, o el propio contenido de la app (un icono). Se encarga del estado de carga de la imagen, ejecutado de forma nativa a partir de los eventos load y error de la propia imagen, sin JavaScript, y de lo que reciben los lectores de pantalla: una imagen etiquetada con el nombre de la persona. El aspecto es el de la app: un `Avatar` no tiene tamaño, forma, colores ni fuente propios. Un `AvatarGroup` muestra los primeros avatares de una fila y un indicador de desbordamiento que representa a los demás ("+5").

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` y `AvatarGroup` provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `avatar()` y `avatar_group()` los crean con un setter por cada prop (`.src(..)`, `.fallback_delay(..)`), los métodos de estilo tipados para el propio avatar y `.child(..)` para lo que se coloca sobre la imagen.

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | ninguno | La imagen, tal como la recibe `src` de [`<Image>`](./image.md): una URL, un URI `asset:/` o `data:`, una URL `blob:` (una foto elegida por el usuario: `URL.createObjectURL(file)`) o una imagen importada. Se muestra una vez cargada; una cadena vacía equivale a ninguna imagen. |
| `name` | `.name(..)` | `string` | ninguno | El nombre de la persona: lo que dicen los lectores de pantalla y las iniciales que muestra el contenido de respaldo cuando la app no pasa ningún `fallback`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | Lo que dicen los lectores de pantalla, con prioridad sobre `name`. `""` hace que el avatar sea decorativo y quede oculto para los lectores de pantalla. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | Cuánto espera el contenido de respaldo mientras se carga la imagen, de modo que una imagen que carga rápido se muestre sin que el contenido de respaldo parpadee antes. `Infinity`: sin contenido de respaldo mientras carga, solo cuando falla o no hay imagen. |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La imagen: su ajuste, su radio y su movimiento. |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El contenido de respaldo: su fondo, el color y el tamaño del texto, y cómo alinea su contenido. |
| `fallback` | `.fallback(..)` | `JSX.Element` | las iniciales | El contenido del respaldo en lugar de las iniciales: un icono, un marcador de posición para alguien sin nombre. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Lo que se muestra sobre la imagen: un punto de presencia, una insignia. Los lectores de pantalla oyen la etiqueta del avatar, no estos elementos (consulta [Accesibilidad](#accessibility)). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio avatar: su tamaño y su forma. |

| Evento | Rust | Payload | Descripción |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | El estado de la imagen cambió: `"idle"` (sin `src`), `"loading"`, `"loaded"` o `"error"`. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con |
|---|---|---|
| El avatar | | `class`, `style` |
| El contenido de respaldo | el avatar, primero, tan grande como este; está presente mientras la imagen se carga (después de `fallbackDelay`), falla o no existe | `fallbackClass`, `fallbackStyle`; su contenido son las iniciales o `fallback` |
| La imagen | el avatar, sobre el contenido de respaldo, llenándolo | `imageClass`, `imageStyle` |
| El contenido de la app | el avatar, último | sus propios elementos (`children`) |

Dale al avatar su tamaño (`class="size-10"`): el contenido de respaldo y la imagen lo llenan, así que cuando el respaldo desaparece no se recalcula ningún diseño. La imagen se coloca en el diseño desde el principio, transparente, y pasa a ser opaca una vez cargada; entonces el contenido de respaldo desaparece. Un `transition-opacity` en `imageClass` la muestra con un fundido (con movimiento reducido se muestra de inmediato). Redondea la imagen y el contenido de respaldo (`rounded-full` en cada uno) en lugar de recortar el avatar, para que un punto de presencia situado en su borde (`absolute bottom-0 right-0`) se vea completo.

Las iniciales son las primeras letras de las dos primeras palabras del nombre, en mayúsculas ("Ada Lovelace" es "AL"); una sola palabra da sus dos primeras letras ("huacnlee" es "HU"), y un nombre en una escritura sin distinción de mayúsculas y minúsculas da su primer carácter ("王小明" es "王").

<a id="groups"></a>

## Grupos

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | Se muestran como máximo este número de avatares, los primeros; los demás no crean vistas. |
| `total` | `.total(..)` | `number` | el número de hijos | A cuántas personas representa el grupo, cuando la app pasa solo las primeras. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla sobre el grupo. |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La parte de desbordamiento, después de los avatares mostrados. |
| `overflow` | `.overflow(..)` | `JSX.Element` | ninguno | Lo que representa a las personas no mostradas ("+5", "⋯"); está presente mientras el grupo tenga más personas que avatares mostrados. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla sobre el desbordamiento en lugar de su contenido: "5 personas más" para un "+5". |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los avatares, en orden. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La fila: su dirección (`flex-row`) y su espaciado. |

El solapamiento, los anillos y la forma del desbordamiento son cosa de la app: un margen negativo en cada avatar después del primero (`-ml-2`) los apila, y un anillo del color del fondo los separa. Para una lista larga, pasa las primeras `limit` personas y `total`: solo se crean los avatares mostrados. El número que representa el desbordamiento es `total` menos los avatares mostrados, que son el menor entre los hijos y `limit`: `total={8}` con dos hijos muestra dos avatares y "+6".

<a id="accessibility"></a>

## Accesibilidad

- Un avatar es una sola imagen para los lectores de pantalla, etiquetada con `accessibilityLabel` o `name`: el nombre se dice una sola vez. El contenido de respaldo y la imagen quedan ocultos para ellos, de modo que las iniciales no se leen por separado. Un avatar sin ninguno de los dos, o con `accessibilityLabel=""`, es decorativo: queda oculto para los lectores de pantalla, como debe ser un avatar situado junto al nombre que representa.
- Un grupo es un grupo, etiquetado con su `accessibilityLabel` ("Ada, Grace y otras 5 personas"); los avatares mostrados son imágenes dentro de él. El desbordamiento se lee como su contenido ("+5"), o como `overflowAccessibilityLabel` ("5 personas más") cuando la app proporciona uno: NSH no escribe ningún texto por su cuenta.
- Un avatar es un solo elemento para los lectores de pantalla, así que lo que muestran sus hijos no se lee por separado, y en iOS un botón o un enlace entre ellos no se puede alcanzar en absoluto. Indica lo que significa un punto de presencia o una insignia en `accessibilityLabel` ("Ada Lovelace, en línea"), y coloca lo que se pueda pulsar junto al avatar, no dentro de él.
- Ninguno de los dos recibe pulsaciones ni foco de teclado: coloca un avatar dentro de un `Button` para que lo haga.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- Cada plataforma carga la imagen con su propio cargador de imágenes y sus propias cachés (consulta [Image](./image.md)); sus eventos load y error cambian el estado del avatar en Rust, de modo que una imagen que se está cargando o que ha fallado cambia la imagen y el contenido de respaldo y nada más.
- La imagen empieza a cargarse en cuanto tiene un marco, por lo que permanece en el diseño mientras es transparente.
