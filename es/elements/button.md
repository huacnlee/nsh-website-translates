---
title: "Button"
description: "El componente Button: un elemento de pulsación que gestiona las pulsaciones, los estados deshabilitado y seleccionado y su rol para lectores de pantalla, con estilos definidos por la app."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---


# Button

Un botón es un objetivo de pulsación. Es dueño del comportamiento: las pulsaciones, la respuesta visual a la pulsación mediante los estilos de estado de la app, los estados deshabilitado y seleccionado, el foco de teclado y su rol para los lectores de pantalla. El aspecto es de la app: un `Button` no tiene colores, tamaños, rellenos ni etiqueta propios, de modo que un mismo componente se convierte en un botón primario, un botón de icono, una pestaña, un interruptor de barra de herramientas o la fila de una lista, según los estilos y los hijos que le des.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` en Rust. En TSX su aspecto se define con `class` y
`style`, con las variantes de estado `active:`, `hover:`, `focus:`, `selected:` y `disabled:` (o las equivalentes
`activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` y `disabledStyle`). En Rust, `button()` crea uno igual que
`view()` crea una vista: un setter por cada prop (`.disabled(..)`, `.selected(..)`), un listener por cada evento (`.on_press(..)`),
los métodos de estilo tipados (`.px_4()`, `.bg(..)`) para su aspecto, los métodos de estado (`.active(..)`, `.hover(..)`,
`.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) para sus estados y `.child(..)` para su contenido.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones ni respuesta visual a la pulsación; se aplican los estilos `disabled:` y los lectores de pantalla lo anuncian como atenuado. |
| `selected` | `.selected(..)` | `boolean` | `false` | Seleccionado: un interruptor activado, la pestaña actual. Los lectores de pantalla lo anuncian. La app es dueña del valor y le da estilo. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo mientras `selected` y no está deshabilitado, como clases de `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla cuando el contenido no basta, como en un icono. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | Qué es para los lectores de pantalla cuando ningún componente `nsh/base` es ese control: `"link"` (abre una URL), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | ninguno | Hasta qué distancia fuera de sus límites las pulsaciones siguen contando, en puntos: un número para todos los lados, o los lados por nombre. Igual que el `hitSlop` de una vista. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido: texto, un icono, cualquier layout. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | Su aspecto, por completo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo mientras está pulsado, con el cursor encima, con foco o deshabilitado, como las clases de `<state>:`. Los estados posteriores prevalecen; `disabled` prevalece sobre todos. |

En Rust cada prop es un setter que recibe un valor, una señal o un closure; las props que omites conservan su valor por defecto:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | Se pulsó el botón: un toque, un clic, Return o Space mientras tiene el foco de teclado, o la activación de un lector de pantalla. |
| `onPressDown` | `.on_press_down(\|\| ..)` | Una pulsación comenzó sobre él. |
| `onPressUp` | `.on_press_up(\|\| ..)` | La pulsación terminó: se soltó, se movió fuera o se canceló. |

`onPressDown` y `onPressUp` sirven para una respuesta visual a la pulsación propia, como un muelle o un resaltado que los estilos de estado no expresan. Un botón deshabilitado no informa de ninguno de ellos.

<a id="styling"></a>

## Estilos

El aspecto de un botón es el de tu app: la app decide qué es un botón primario o secundario. Un par de componentes pequeños mantiene esa decisión en un solo lugar:

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

Las variantes de estado se aplican de forma nativa: una pulsación oscurece el botón en el hilo principal sin que se ejecute JS ni Rust. En Rust los métodos de estado son las mismas variantes: `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` y
`.disabled_style(..)` siguen los estados propios del botón. Los colores de tu tema funcionan igual: `bg-primary` en TSX,
`theme().primary` en Rust (consulta [Theme tokens](../docs/tailwind.md#theme-tokens)).

<a id="disabled"></a>

## Deshabilitado

Un botón deshabilitado no recibe pulsaciones ni da respuesta visual, y los lectores de pantalla lo anuncian como atenuado. Su aspecto mientras está deshabilitado es cosa tuya, con clases `disabled:` o `disabledStyle`:

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## Un interruptor con selected

`selected` convierte un botón en un interruptor: el botón de negrita de una barra de herramientas, un chip de filtro, la pestaña actual. La app guarda el valor, lo invierte en `onPress` y da estilo al estado seleccionado; los lectores de pantalla anuncian el botón como seleccionado.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

Una fila de pestañas es [`Tabs`](./tabs.md) y un control de activado / desactivado es [`Switch`](./switch.md), de `nsh/base`: son dueños del rol, del estado seleccionado y del teclado de su tipo, algo que un `Button` con `role="tab"` o `role="switch"` no ofrece.

<a id="a-small-target-with-hitslop"></a>

## Un objetivo pequeño con hitSlop

Un botón de icono puede ser más pequeño que un dedo. `hitSlop` hace que cuenten las pulsaciones que caen cerca de él, en puntos más allá de cada lado, sin cambiar su layout ni su aspecto: un número para todos los lados, o los lados por nombre (`{ top: 8, bottom: 8 }`), tal como los recibe el [`hitSlop` de una vista](./index.md#presses-and-feedback).

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## Accesibilidad

- Un botón es un solo elemento para los lectores de pantalla, con el rol `"button"` salvo que `role` indique otro. Su etiqueta es su contenido de texto; indica `accessibilityLabel` cuando el contenido es un icono o dice muy poco.
- `disabled` y `selected` se anuncian tal como la plataforma los anuncia (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad del navegador).
- En macOS y la web un botón es una parada del foco de teclado: Tab llega hasta él, Return y Space lo pulsan, y los estilos `focus:` muestran dónde está el foco.

Consulta [Accessibility](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre el botón; alejarse la cancela, igual que con los botones del propio sistema.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Return y Space también pulsan el botón que tiene el foco de teclado. Los estilos `hover:` se aplican con el puntero de un ratón o de un trackpad.
- Cada plataforma dibuja lo que la app define con estilos: la respuesta visual a la pulsación es `active:` / `activeStyle` o una animación propia.
