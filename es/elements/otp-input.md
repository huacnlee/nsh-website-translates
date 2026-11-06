---
title: "OtpInput"
description: "El componente OtpInput: un código numérico de un solo uso de longitud fija que se escribe, se pega o se autocompleta en un único campo nativo, y se muestra en celdas, grupos y un cursor que la aplicación puede personalizar."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---


# OtpInput

A one-time-code input toma un número fijo de dígitos (un código de verificación de un mensaje de texto, el código de un autenticador) y los muestra en celdas. Se encarga del comportamiento: un campo de texto nativo, transparente y colocado sobre las celdas, recibe el teclado, de modo que la escritura, los métodos de entrada, el pegado, el teclado numérico y el autocompletado de códigos del sistema ("From Messages" de iOS, las sugerencias de SMS de Android) son los propios de la plataforma, y los lectores de pantalla encuentran un solo campo de texto. Solo entran dígitos, hasta `length`; Retroceso elimina el último, y `onComplete` indica cuándo el código está completo. El aspecto es el de la app: un `OtpInput` no tiene colores, tamaños, bordes ni etiqueta propios. Sus partes son las celdas, los grupos en que se dividen y un cursor, y la app da estilo a cada una.

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `otp_input()` crea uno con un setter por prop (`.length(..)`, `.cell_style(..)`), un método de listener por evento (`.on_complete(..)`) y los métodos de estilo tipados para el propio input.

<a id="the-code"></a>

## El código

- **Controlado**: pasa `value` y actualízalo en `onChange`. Las celdas muestran el `value` que pasa la app, tal cual; un valor que establece la app (por ejemplo, borrar el código tras uno incorrecto) nunca se notifica.
- **No controlado**: pasa `defaultValue` (o nada), y lee el código desde `onChange` y `onComplete`.

Lo que hace el usuario se lee desde el campo, con el cursor siempre al final:

| El usuario | El código |
|---|---|
| Escribe un dígito | Se añade al final mientras el código sea más corto que `length`; una vez completo, no cambia nada. |
| Escribe un dígito de ancho completo (`０`–`９`, de un método de entrada de Asia oriental) | Se añade el dígito ASCII. |
| Escribe cualquier otra cosa | No cambia nada; el campo lo descarta. |
| Pulsa Retroceso | Se elimina el último dígito. |
| Pega, o el sistema autocompleta un código | Sus dígitos se añaden de la misma manera; un texto con `length` dígitos o más (`123-456`, el código de un mensaje) reemplaza el código por sus primeros `length` dígitos. |

`onChange` notifica cada cambio con el nuevo código, y `onComplete` lo sigue cuando el cambio llenó la última celda, de modo que la app verifica el código en ese momento.

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | obligatorio | Cuántos dígitos tiene el código: una celda por cada uno. |
| `value` | `.value(..)` | `string` | ninguno | El código, controlado por la app (se muestra tal cual). Sin él, el input mantiene el suyo. |
| `defaultValue` | `.default_value(..)` | `string` | ninguno | El código al principio, mientras `value` no está establecido. |
| `masked` | `.masked(..)` | `boolean` | `false` | Las celdas llenas muestran un punto en lugar de su dígito, y el campo es seguro: los lectores de pantalla no leen el código y el sistema lo mantiene fuera de sus sugerencias. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin foco ni edición; los estilos `disabled:` se aplican al input y a sus partes, y los lectores de pantalla indican que está atenuado. |
| `groups` | `.groups(..)` | `number` | `1` | En cuántos grupos se dividen las celdas, lo más uniformemente posible (3 + 3 para seis dígitos en dos); al menos uno, como máximo uno por celda. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para el campo: para qué sirve el código y cuántos dígitos tiene. |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | ninguno | Cada celda: su tamaño, borde y texto (`color`, `fontSize`, que su dígito hereda); `focus:` y `data-filled:` dan estilo a sus estados (ver Partes). |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada grupo de celdas (`flex-row gap-2`). |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El cursor: su ancho, alto y color. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio input: la fila (o columna) que rodea a sus grupos. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | El usuario cambió el código: escribió, borró, pegó o autocompletó. |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | El cambio del usuario llenó la última celda, después de su `onChange`. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | ninguno | El input recibió / perdió el foco del teclado. |

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descripción |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | Toma el foco del teclado y muestra el teclado en pantalla, como lo hace una pulsación sobre el input. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con |
|---|---|---|
| El input | | `class`, `style` |
| Un grupo | el input, uno por grupo | `groupClass`, `groupStyle`; `disabled:` sigue al input |
| Una celda | su grupo, una por dígito | `cellClass`, `cellStyle`; `focus:` en la celda que recibe el siguiente dígito mientras el input tiene el foco, `data-filled:` en cada celda que contiene un dígito, `disabled:` sigue al input |
| El dígito | una celda llena | los estilos de texto de la celda (`text-xl`, `font-semibold`); `•` mientras `masked` |
| El cursor | la celda vacía que recibe el siguiente dígito, mientras el input tiene el foco | `caretClass`, `caretStyle` |

La celda que recibe el siguiente dígito es la que sigue al último dígito, o la última celda una vez que el código está completo. El cursor parpadea como el de un campo de texto (medio segundo encendido, medio apagado, y fijo durante un momento después de cada edición), mediante su opacidad, de forma nativa, y conserva su lugar en el layout; con movimiento reducido permanece quieto. Una pulsación en cualquier parte del input le da el foco: el campo está sobre las celdas.

Una celda que contiene un dígito, enmascarado o no, tiene el atributo `data-filled`, de modo que las clases `data-filled:` dan estilo a las celdas que el usuario ha llenado (un borde más marcado, un relleno: `data-filled:border-foreground data-filled:bg-muted`), tal como lo escribe shadcn/ui con sus estados. Con `group` en `cellClass`, las clases `group-data-filled:` dan estilo a lo que hay dentro de una celda llena, su dígito. Las celdas cambian sus clases, nunca su contenido, así que una tecla restaura el estilo de una sola celda y no vuelve a dibujar nada.

<a id="accessibility"></a>

## Accesibilidad

- Los lectores de pantalla encuentran un solo campo de texto, nombrado por `accessibilityLabel` (indica para qué sirve el código y su longitud: "Código de verificación, 6 dígitos") con el código como su valor; las celdas quedan ocultas para ellos. Mientras `masked` el campo es seguro, así que el código no se lee en voz alta.
- El teclado es el de la plataforma: el teclado numérico en teléfonos, cualquier teclado en escritorio (solo entran dígitos) y Retroceso. Tab llega al input como a cualquier campo de texto.
- Mientras `disabled` no recibe foco, y los lectores de pantalla indican que está atenuado.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS: el campo es un campo de código (`textContentType` `oneTimeCode`), por lo que la barra QuickType ofrece un código de Messages o Mail; aparece el teclado numérico. Un campo `masked` empieza de nuevo cuando se vuelve a escribir en él después de haber perdido el foco, como lo hacen los campos seguros de iOS.
- Android: `autofillHints` `smsOTPCode` permite que el teclado y el servicio de autocompletado ofrezcan el código de un mensaje de texto; aparece el teclado numérico.
- macOS, Windows, Linux y la web: la escritura y el pegado van al campo (en el navegador, con `inputmode="numeric"` para el teclado numérico de un teléfono), y el puntero en forma de I se muestra sobre las celdas.
