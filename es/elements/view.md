---
title: "View"
description: "El elemento contenedor básico: diseño, fondos, bordes, sombras, gestión de pulsaciones y gestos."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---


# View

`View` es el bloque de construcción de cada pantalla: un contenedor nativo (un UIView en iOS y Mac Catalyst, un ViewGroup en
Android) que organiza a sus hijos con flexbox o grid, dibuja un fondo, bordes, sombras y degradados, y gestiona las
pulsaciones. Los botones, las tarjetas, las filas y las pantallas son todas vistas. Rust crea una con `view()`, TSX con `<View>` desde `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

## Layout

Una vista organiza a sus hijos con flexbox, con estos valores por defecto: `flexDirection: "column"`, `flexShrink: 0`,
`alignContent: "flex-start"`, `position: "relative"`. `display: "grid"` (`.grid()` en Rust) cambia a CSS grid y
`display: "block"` al layout de bloque. Los tamaños se expresan en puntos. Consulta [layout](../docs/layout.md) y la
[referencia de estilos](../modules/style-reference.md).

`display: "flex"` sigue a CSS: en un estilo, como la clase `flex` y el `.flex()` de Rust, es una fila salvo que se indique una dirección
(`flexDirection: "column"`, `flex-col`, `.flex_col()`). Una vista que no define display apila a sus hijos en una columna.

## Props

`View` tiene una prop propia, `selectable` (`.selectable(true)` en Rust): los textos dentro de la vista se seleccionan juntos, como una sola selección ([Selección de texto](./text-selection.md)). El resto son las [props comunes](./index.md#common-props): sus estilos (`style`, `class`,
`classList`; los métodos `Styled` en Rust), `disabled`, las props de pulsación (`onPress`, `onLongPress`, `onPressDown`,
`onPressUp`, `delayLongPress`, `hitSlop`), los estilos de estado (`activeStyle`, `hoverStyle`,
`focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`,
`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, las
props de gestos (`pan`, `pinch`, `rotation` y sus eventos), las props de toque y de responder, las props de accesibilidad
y `ios` / `android` / `desktop`.

<a id="selectable-views"></a>

## Vistas seleccionables

Con `selectable`, una selección abarca los elementos [`Text`](./text.md) y [`TextView`](./text-view.md) que hay dentro de
la vista, en orden de lectura; los textos con `selectable={false}` quedan excluidos, y una vista seleccionable dentro de otra forma parte de
la exterior. Consulta [Selección de texto](./text-selection.md) para ver los gestos en cada plataforma.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## Respuesta visual a la pulsación

Una vista pulsable es cualquier vista con un manejador de pulsación. Su respuesta visual la define la app: un estilo mientras está pulsada, aplicado de forma nativa
mientras el dedo está apoyado, sin ida y vuelta al código de la app. `hoverStyle`, `focusStyle` y `disabledStyle` hacen lo
mismo para los demás estados:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

En Android, `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` en Rust) añade el efecto ripple de
Material (`borderless`, `radius` y `foreground` lo ajustan).

`disabled` elimina los listeners de pulsación de la vista nativa (sin pulsación y sin respuesta visual) y aplica los estilos de deshabilitado:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (ninguno en Rust) | Un toque terminó dentro de la vista. |
| `onLongPress` | `.on_long_press` | `PressEvent` (ninguno en Rust) | El dedo permaneció apoyado durante `delayLongPress` (500 ms). |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (ninguno en Rust) | Un dedo se apoyó / se levantó o salió de la vista. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | El ratón entró en la vista (o en una vista dentro de ella) / salió de ella o de la ventana ([hover](./index.md#hover)); el de `onMouseLeave` es el punto donde estuvo por última vez. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | El ratón se movió sobre la vista (o sobre una vista dentro de ella), con o sin un botón pulsado, o se pulsó o soltó una tecla modificadora mientras el ratón permanece sobre ella sin ningún botón pulsado: `position`, `pagePosition` (`Point`), `modifiers` y `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` o `null`); como máximo una vez por fotograma. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | Se pulsó el botón secundario sobre la vista ([menús contextuales](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | ninguno | Un arrastre de archivos locales entró en / salió del destino de escritorio activo. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | Se soltaron archivos o directorios locales sobre el destino de escritorio. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | Cambió el frame relativo al padre. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | Un arrastre vinculado con `pan` comenzó / terminó; `cancelled` es true cuando el sistema lo cancela. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | Un gesto de pellizco vinculado con `pinch` comenzó / terminó. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | Una rotación vinculada con `rotation` comenzó / terminó. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | Se ejecutó una acción de accesibilidad personalizada. |

Eventos de toque y de responder: consulta las [props comunes](./index.md#raw-touches-and-the-responder-system).

<a id="desktop-file-drops"></a>

## Soltar archivos en escritorio

En AppKit, GTK, Win32 y GPUI, una vista con `onFileDrop` recibe archivos y directorios locales arrastrados desde otra
aplicación. `onFileDragEnter` y `onFileDragLeave` siguen el destino activo; `onFileDrop` recibe
`{ uris: string[] }` en el orden de la lista de archivos nativa. Cada entrada es una URL `file:` absoluta con los espacios y los
caracteres no ASCII escapados. Analiza la URL para obtener una ruta del sistema de archivos en lugar de quitar el prefijo a mano.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

El ancestro habilitado más cercano que escuche `onFileDrop` recibe el drop. Una raíz modal delimita esa búsqueda. `disabled`
elimina los listeners de arrastrar y soltar archivos; al salir, cancelar, completar o eliminar el destino se limpia el estado activo.
La aceptación usa la operación Copy y el estado nativo montado. La app decide si lee, abre o transfiere los
archivos recibidos.

<a id="ref-methods"></a>

## Métodos de ref

El ref de una vista simple es un `ViewRef`: `focus()`, `blur()` y `measure()`. `ref` (`.element_ref(&handle)` en Rust) te da su nodo, por ejemplo para pasarlo a
`setAccessibilityFocus` ([la API de accesibilidad de `nsh`](../modules/nsh.md#accessibility)), o para medirlo
(`handle.measure()` en Rust).

<a id="views-inside-text"></a>

## Vistas dentro de texto

Una vista colocada dentro de un texto es un adjunto en línea: se asienta sobre la línea base, se ajusta con las palabras y recibe
pulsaciones propias. Consulta [texto](./text.md#inline-views-and-images).

<a id="platform-notes"></a>

## Notas por plataforma

- `boxShadow` se dibuja en todas las plataformas; `android={{ elevation }}` aplica en cambio la sombra de Material de Android. En Android, una sombra necesita un
  color de fondo (una vista con fondo transparente no proyecta ninguna).
- `filter` en vistas: iOS admite `opacity()`, `brightness()` hasta 1 y `drop-shadow()` (las imágenes admiten todos los filtros de
  color y `blur()`); Android los admite todos desde API 31, y los filtros de color en versiones anteriores.
- `backdropFilter: "blur(…)"` es un material del sistema en iOS (una aproximación) y requiere API 31 en Android.
- Android dibuja las transformaciones `translate`, `scale` y `rotate`; las inclinaciones (`skew()`, `skewX()`, `skewY()`) se aplican en las otras plataformas.
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) dibuja esquinas que se suavizan hacia los bordes (como
  los iconos de apps de iOS), en ambas plataformas.
- El estilo `cursor` se aplica donde hay un puntero (Mac Catalyst, iPad con puntero, escritorios).
