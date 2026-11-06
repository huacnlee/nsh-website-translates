---
title: "Progress"
description: "El componente Progress: una barra de progreso lineal que gestiona su rol, rango y valor para los lectores de pantalla, y el ancho del indicador según el valor, con una pista y un indicador que la aplicación puede estilizar."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---


# Progress

A progress bar muestra hasta dónde ha avanzado una tarea de extensión conocida (una descarga, una subida, un paso de una configuración) o, mientras
`indeterminate`, que una tarea de extensión desconocida está en curso. Se encarga de lo que reciben los lectores de pantalla, el rol de barra de progreso
con el rango de 0 a 100 y el valor, y del ancho del indicador: `value` por ciento del ancho de la pista. El aspecto es
el de la app: un `Progress` no tiene colores, tamaños, radios, movimiento ni etiqueta propios. Se compone de una pista con un indicador
dentro, y después sus hijos (una etiqueta, el valor como texto), y la app da estilo a cada parte.

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. El valor es de la app: la
progress bar muestra el `value` que la app le pasa, limitado a un rango de 0 a 100. En Rust, `progress()` crea una con un setter por prop
(`.value(..)`, `.indicator_style(..)`), los métodos de estilo tipados para la propia progress bar y `.child(..)` para su
etiqueta.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | Hasta dónde ha avanzado la tarea, como porcentaje de 0 a 100 (fuera del rango, se usa el extremo más cercano). El indicador ocupa esa parte del ancho de la pista, y los lectores de pantalla la anuncian. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | La extensión de la tarea es desconocida: los lectores de pantalla oyen una barra de progreso sin valor, y el ancho del indicador lo define la app (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla: qué está en curso, cuando sus hijos no tienen texto que lo diga. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La pista, la parte que llena el indicador. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador, dentro de la pista: su altura, color y movimiento. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido después de la pista: una etiqueta o el valor como texto, que los lectores de pantalla anuncian. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La propia progress bar: la columna (o fila) que rodea la pista y la etiqueta. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilo con |
|---|---|---|
| La progress bar | | `class`, `style` |
| La pista | la progress bar, primero | `trackClass`, `trackStyle` |
| El indicador | la pista | `indicatorClass`, `indicatorStyle`; su ancho es `value` por ciento del de la pista |
| La etiqueta | la progress bar, después de la pista | sus propios elementos (`children`) |

El indicador comienza en el borde inicial de la pista; `overflow-hidden` y un radio en la pista redondean su extremo junto con el
de la pista. Una clase `w-*` o un `width` en `indicatorStyle` sustituye el ancho del valor, que es como una
barra indeterminada obtiene el suyo.

<a id="indeterminate"></a>

## Indeterminada

Mientras la extensión sea desconocida, establece `indeterminate` y dale al indicador un ancho y un movimiento propios de la app. El movimiento es
decisión de la app, y `motion-reduce:` lo mantiene quieto para las personas que piden menos movimiento:

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## Accesibilidad

- Una progress bar es un solo elemento para los lectores de pantalla, con el rol `"progressbar"`, el rango de 0 a 100 y su valor
  (VoiceOver y TalkBack lo dicen como porcentaje); la pista y el indicador son partes de ella. Su etiqueta es el texto
  de sus hijos; indica `accessibilityLabel` cuando no tiene ninguno.
- Mientras `indeterminate`, conserva el rol y el rango y no tiene valor (en el navegador: `aria-valuenow` se omite,
  tal como ARIA define una barra de progreso indeterminada).
- No admite pulsaciones ni foco de teclado: informa, y los controles que inician o detienen la tarea son de la app.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- Cada plataforma dibuja lo que la app define con estilos; el ancho del indicador sigue a `value` al instante, y un cambio se anima
  cuando la app lo anima.
- Lectores de pantalla: VoiceOver (iOS, macOS) oye el valor como porcentaje y la barra como de actualización frecuente;
  TalkBack, UI Automation (Windows), la accesibilidad de GTK (Linux) y el navegador (`aria-valuenow`) reciben el rango y el
  valor.
