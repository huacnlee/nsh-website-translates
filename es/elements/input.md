---
title: "Input"
description: "El campo de texto nativo: texto controlado y no controlado, teclados, autocompletado, selección, entradas multilínea y foco."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` es un campo de texto nativo: un UITextField (una línea) o un UITextView (varias líneas) en iOS y Mac Catalyst, y un
EditText en Android. La escritura, el cursor, la selección, la autocorrección y el autocompletado son los propios de la plataforma. En Rust se crea uno
con `nsh_base::input()`, y en TSX con `<Input>` desde `nsh/base`.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## Controlado y no controlado

- **Controlado**: pasa `value` y actualízalo en `onChange`. La app puede reescribir lo que el usuario ha escrito (recortarlo, darle formato): el texto muestra la edición de inmediato y se corrige cuando llega el nuevo `value`. Cada edición nativa lleva un contador, y un `value` de la app se aplica cuando se basa en la última edición, de modo que lo que se escribe más recientemente siempre prevalece sobre una actualización lenta.
- **No controlado**: pasa `defaultValue` (`.default_value(..)`, o nada) y lee el texto desde `onChange` o
  `onSubmit`.

Las reglas que deben cumplirse mientras el usuario escribe son props y se resuelven de forma nativa: `maxLength` limita la longitud y
`submitBehavior` decide qué hace la tecla de retorno. Consulta [formularios y teclado](../docs/forms-and-keyboard.md).

## Props

Además de las [props comunes](./index.md#common-props) (con `style` de tipo `TextStyle`: se aplican la fuente, el color, la alineación y los estilos de vista):

<a id="text"></a>

### Texto

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | El texto, controlado por la app. |
| `defaultValue` | `.default_value(..)` | `string` | | El texto inicial. |
| `placeholder` | `.placeholder(..)` | `string` | | Se muestra mientras el campo está vacío. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | Varias líneas; la tecla de retorno inserta un salto de línea salvo que `submitBehavior` indique otra cosa. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | La barra de desplazamiento de un campo multilínea: el indicador de la plataforma, o la barra integrada de la app una vez que esta ha definido una ([Scrollbar](./scrollbar.md#built-in-bars)); un objeto es un tema propio, `false` ninguna. |
| `maxLength` | `.max_length(..)` | `number` | | El máximo de caracteres que el usuario puede introducir. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | El usuario puede seleccionar y copiar el texto, pero no modificarlo. |
| `masked` | `.masked(..)` | `boolean` | `false` | El texto está oculto (contraseñas). |
| `allowFontScaling` | | `boolean` | `true` | Sigue el tamaño de texto del sistema. |
| `maxFontSizeMultiplier` | | `number` | `0` | El límite superior de la escala del sistema (0 significa sin límite). |

<a id="keyboard"></a>

### Teclado

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | La disposición del teclado ([los valores](../docs/forms-and-keyboard.md#keyboards-and-autofill); `numbers-and-punctuation` tiene un signo menos en iOS). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | La etiqueta de la tecla de retorno. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Mayúsculas automáticas. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | Las correcciones del sistema. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | Qué contiene el campo, para el autocompletado en iOS, Android y la web: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | Qué hace un pegado: `"insert"` inserta el texto pegado, `"report"` no inserta nada, para que la app gestione lo que informa `onPaste`. Las imágenes y los archivos nunca se insertan. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (una línea), `"newline"` (varias líneas) | Qué hace la tecla de retorno: `"submit"` informa de `onSubmit` y mantiene el foco, `"blurAndSubmit"` además lo quita, `"newline"` inserta un salto de línea (multilínea; una sola línea envía). Un campo multilínea que envía sigue aceptando saltos de línea con Shift+Return u Option / Alt+Return en teclados físicos. `"submit"` mantiene el teclado visible (p. ej., para enviar varios mensajes). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Recibe el foco al aparecer. |

<a id="caret-and-selection"></a>

### Cursor y selección

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | Se dibuja el cursor (por defecto `true`; `false` lo oculta). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | La selección controlada, en unidades UTF-16; `end` toma por defecto el valor `start` (un cursor). |

El cursor parpadea mientras su ventana está visible y activa. En las ventanas GPUI en Linux permanece visible tras diez segundos
sin escribir ni moverlo, como en las apps GTK, de modo que un campo con foco que se deja solo no consume fotogramas.

<a id="colors"></a>

### Colores

Los colores del marcador de posición, del cursor y del resaltado de la selección son claves de estilo, con sus clases de Tailwind, y
métodos en Rust (UIKit tiñe el cursor y la selección con un solo color, el del cursor si está definido):

| Clave de estilo | Rust | Clase | Descripción |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | El color del marcador de posición. |
| `caretColor` | `.caret_color(..)` | `caret-*` | El color del cursor. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | El color del resaltado de la selección. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| Clave de `ios` | Rust | Tipo | Descripción |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | Los nombres de iOS para `autoComplete` (`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | El `nativeID` de un `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)) que se muestra sobre el teclado mientras el campo tiene el foco. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | El aspecto del teclado; `"default"` sigue la apariencia del sistema. Los teclados de Android siguen el tema del sistema. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | El usuario cambió el texto: `value` es el texto actual. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | Se pulsó la tecla de retorno en un campo que envía (una línea, o `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | ninguno | El campo ganó / perdió el foco. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | El cursor o la selección se movieron (unidades UTF-16). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | El usuario pegó: el texto, su formato como HTML (Linux, web), imágenes (una captura de pantalla) como `File`s, y las URLs `file:` de archivos locales. Ocurre antes del `onChange` del texto que inserta ([formularios y teclado](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | El cursor se movió, con la selección o porque el texto se desplazó o se ajustó: `bounds` es su posición en el campo, `pageBounds` en la ventana, y también el `anchor` de un `Overlay` ([formularios y teclado](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | Antes de que cambie el texto: `key` es el texto escrito, `"Backspace"` o `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | El tamaño del texto cambió (al ancho del campo si es multilínea), mientras se escribe; un campo vacío informa de una línea vacía, sea cual sea su marcador de posición. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | La composición de un método de entrada empezó, cambió o terminó: `text` es lo que se está componiendo (pinyin antes de elegir un carácter, kana antes de la conversión), `""` cuando termina. El texto confirmado llega a `onChange` antes del final. |

Un campo multilínea que crece con su texto:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descripción |
|---|---|---|
| `focus()` | `focus()` | Da el foco al campo y muestra el teclado. |
| `blur()` | `blur()` | Le quita el foco. |
| `setSelection(start, end?)` | `set_selection(start, end)` | Selecciona `start..end` (unidades UTF-16); un cursor cuando son iguales. |

Pasar el foco al siguiente campo al pulsar retorno:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`Keyboard.dismiss()` de `nsh` (`dismiss_keyboard()` en Rust) oculta el teclado sea cual sea el campo que lo tenga.

<a id="platform-notes"></a>

## Notas de plataforma

- En macOS, el texto de una línea, los marcadores de posición y los cursores comparten las métricas de fuente del campo nativo y se centran juntos
  dentro de la caja de contenido. `lineHeight` participa en el diseño; los editores multilínea también lo usan para el espaciado entre párrafos.
- Los campos dentro de una [vista de desplazamiento](./scroll.md#keyboard) se mantienen despejados del teclado de forma nativa. En otros casos, usa
  un padding o margen inferior de [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` deshabilita el campo (sin foco) además de aplicar los estilos de deshabilitado; un campo `readonly` conserva su
  foco y su selección.
- `inputAccessoryViewID` se aplica en iOS, donde el teclado tiene una barra de accesorios.
