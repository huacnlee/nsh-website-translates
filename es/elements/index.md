---
title: "Elementos"
description: "Las primitivas y los componentes base con los que se construye toda aplicación NSH, en Rust y TSX, y las props, los eventos y los métodos de ref que todos comparten."
order: 1
source_hash: 84e4cb96ec250ab2
---


# Elementos

Native Shell construye cada pantalla a partir de un pequeño conjunto de elementos: primitivas como `View`, `Text` y `Image`, y componentes base como `Button`, `Dialog` y `NavStack`. Cada primitiva es una vista nativa (una subclase de UIView en iOS y Mac Catalyst, un `View` de Android, una vista de AppKit, GTK o Win32 en los escritorios), creada y maquetada por el runtime de NSH. Todo lo que muestra una app está hecho con ellos: los botones, tarjetas, filas y pantallas de una app son sus propios componentes, dibujados con estos elementos y con el estilo que les da la app, de modo que su aspecto es enteramente suyo.

Cada ejemplo de estas páginas viene en Rust y TSX: elige una pestaña y todos los ejemplos de la página la siguen.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

En Rust, las primitivas son funciones de `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`) y los componentes base provienen del crate `nsh_base`. Los estilos son métodos tipados (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`, `.bg(..)`), los estilos de estado reciben un closure (`.active(|s| s.opacity(0.6))`), los listeners son closures de su evento (`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`) y `.child(..)` añade hijos. Un fragmento de UI es una función simple que devuelve `impl IntoElement`; se ejecuta una sola vez, y los signals que lee dentro de closures (`text(move || ..)`, `.bg(move || ..)`) actualizan aquello a lo que están enlazados. Consulta [Building with Rust](../docs/rust.md).

En TSX, cada etiqueta va en PascalCase y nombra un binding en el ámbito: las primitivas provienen de `nsh` y los componentes base de `nsh/base`. Solo `<If>` y `<Each>` son globales que no necesitan importación. Una etiqueta en minúsculas como `<view>` es un error de compilación, porque TypeScript la comprobaría contra un tipo global por nombre, y componentes genéricos como `List` y `Each` no podrían inferir el tipo de sus elementos. El compilador reconoce los elementos por sus importaciones y crea las vistas nativas en el sitio, así que importarlos no cuesta nada en tiempo de ejecución. Consulta [JSX and components](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## Primitivas

Se importan de `nsh` en TSX y de `nsh_core::prelude` en Rust.

| Elemento | Rust | Vista nativa (iOS / Android) | Página |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup; con `selectable`, los textos que contiene se seleccionan juntos | [View](./view.md), [Text selection](./text-selection.md) |
| `<Text>` | `text(content)` | vista CoreText / vista StaticLayout | [Text](./text.md) |
| `<Image>` | `image(src)` | una vista con una capa de imagen / una vista de imagen | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView con celdas recicladas | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | una vista que reproduce un dibujo 2D | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | una vista cuya caja dibuja en la GPU un programa WGSL, debajo de sus hijos | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer sobre un TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | una vista sobre la ventana (o el diálogo en el que está), colocada respecto a un ancla | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | control de flujo: los elementos que eligen | [Control flow](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | una barra sobre el teclado en iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

El padding y el margin mantienen el contenido alejado de la interfaz del sistema con el `env()` de CSS: `env(safe-area-inset-top)` y los demás bordes ([Safe area](./safe-area.md)) y `env(keyboard-inset-height)` ([Keyboard](./keyboard.md)).

## Base

Se importan de `nsh/base` en TSX y del crate `nsh_base` en Rust. Poseen el comportamiento, el estado, el foco y la accesibilidad, y toman su aspecto de la app.

| Componente | Rust | Qué hace | Página |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | La alerta y la hoja de acciones del sistema | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` y sus partes | `nsh_base::accordion()`, `accordion_item()`, ... | Secciones apiladas que se expanden y se contraen bajo sus encabezados, de una en una o varias a la vez | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | La imagen de una persona, o un sustituto mientras carga o si falla, y una fila de ellas que muestra las primeras | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | Un control pulsable con sus estados y su rol | [Button](./button.md) |
| `<Carousel>` y sus partes | `nsh_base::carousel()`, `carousel_content()`, ... | Diapositivas mostradas de una en una, con deslizamiento nativo, anterior / siguiente, una paginación, las teclas y un bucle continuo | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | Un control marcado, desmarcado o indeterminado con un indicador | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | Una región cuyo contenido se expande y se contrae | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | Una paleta de comandos: un campo de búsqueda sobre comandos filtrados de forma nativa, una lista virtualizada y las teclas de una paleta Cmd+K | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | Una tabla de filas y columnas en cualquier cantidad, seleccionable, ordenable, con columnas redimensionables y movibles | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | Presenta a sus hijos por encima de todo lo demás | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | Los cambios entre dos textos o de un parche, en vista dividida o unificada | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | Un espacio de trabajo de divisiones, grupos de pestañas y docks en los bordes que el usuario organiza | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | Un editor de código con resaltado, varios cursores, plegado y búsqueda | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | Una vista previa de aquello a lo que apunta su trigger, mientras el puntero reposa sobre él | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | El campo de texto nativo (UITextField o UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | Un objetivo de pulsación que abre una página, un sitio o una ruta de la app | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | Menús: popups con submenús en cascada en los escritorios, hojas en los teléfonos | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | Navegación nativa: una pila de páginas con el encabezado y los gestos de retroceso de la plataforma | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | Un número escrito en un campo o ajustado con botones y teclas | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | Un código de un solo uso con un número fijo de dígitos, escrito, pegado o autocompletado en celdas | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | Las páginas de un conjunto: Anterior, las páginas alrededor de la actual, puntos suspensivos y Siguiente | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | Elementos que contienen elementos, expandidos y contraídos, con uno seleccionado: virtualizado, una sola parada del foco del teclado | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | El marco de un gráfico y sus marcas, dibujados de forma nativa a partir de las filas de la app | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | Contenido anclado a un trigger, por encima de todo | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | Una barra de progreso: cuánto avanzó una tarea, o que está en curso | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | Una opción de un conjunto del que el usuario elige una, y el conjunto | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | Paneles uno junto a otro o apilados, con tiradores que los redimensionan | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | Una barra de desplazamiento con el aspecto propio de la app para una vista de scroll o una lista | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | Un valor elegido de una lista de elementos, con teclado, búsqueda y secciones | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | Un panel en un borde de la pantalla sobre un fondo | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | Un valor, o un rango de dos, elegido a lo largo de una pista | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | Un control de activado / desactivado con una pista y un pulgar | [Switch](./switch.md) |
| `<Table>` y sus partes | `nsh_base::table()`, `table_row()`, ... | Una tabla con las filas y celdas propias de la app, con los roles de una tabla | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | Una pestaña de una lista de pestañas, y la lista | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Muestra un documento Markdown o HTML con textos y vistas | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | La raíz semántica de un toast; toasts dispuestos como capas desde un borde | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | Un botón que está activado o desactivado, y una barra de herramientas de ellos | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | Una barra de botones, toggles y enlaces, una sola parada del foco del teclado | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | Una pista junto a su trigger, al pasar el puntero o al mantener el dedo | [Tooltip](./tooltip.md) |

> [!NOTE]
> Una cadena solo se dibuja dentro de un `Text`. Una cadena hija de un `View` no crea ninguna vista nativa y no participa en el layout.

<a id="common-props"></a>

## Props comunes

Toda primitiva acepta las props siguientes (el tipo `CommonProps` en TSX; los traits `Styled`, `Interactive` y `Accessible` en Rust). Las páginas de cada elemento solo enumeran sus propias props. La columna Rust nombra el método del builder.

<a id="styling"></a>

### Estilos

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `style` | métodos `Styled` tipados; `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` para `<Text>` y `<Input>`, `ImageStyle` para `<Image>`) | Estilo en línea, o un array de estilos combinados de izquierda a derecha (se omiten las entradas falsy; los arrays pueden anidarse, por lo que `style={[base, props.style]}` acepta un `props.style` que a su vez sea un array). Prevalece sobre `class`. Consulta la [referencia de estilos](../modules/style-reference.md). |
| `class` | métodos `Styled` tipados (`.flex_row().gap_2().p_4()`) | `string` | Clases de Tailwind, resueltas de forma nativa (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). Las clases posteriores prevalecen sobre las anteriores. Consulta [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | Clases aplicadas mientras su valor sea truthy (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | Ignora las pulsaciones (tampoco da respuesta visual de pulsación), aplica los estilos `disabled:`, deshabilita controles como los inputs, y los lectores de pantalla indican que está deshabilitado (`accessibilityState.disabled`). |

<a id="presses-and-feedback"></a>

### Pulsaciones y respuesta visual

El manejo de las pulsaciones se ejecuta de forma nativa: la plataforma reconoce la pulsación y aplica los estilos de pulsación de la app, y el código de la app solo se entera después. Solo responde la vista pulsable más interna; dentro de las vistas de scroll, el inicio de una pulsación espera unos 130 ms para que un desplazamiento pueda comenzar primero.

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | Un toque terminó dentro de la vista. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | El dedo permaneció apoyado durante `delayLongPress`. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | Un dedo se apoyó sobre la vista. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | El dedo se levantó o salió. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | Milisegundos antes de que una pulsación se convierta en pulsación larga. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | Amplía el área táctil más allá de los límites, en puntos. |

`PressEvent` es `{ position, pagePosition, modifiers, clickCount }`: dónde estaba el puntero en la vista y en su vista raíz (`Point`s), las teclas modificadoras mantenidas cuando comenzó la pulsación y los clics consecutivos (2 para un doble clic). Cuando la plataforma no informa de ningún puntero, es el origen de la vista, sin teclas y con un clic.

La clave de estilo `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` en Rust, las clases `pointer-events-*`) decide qué toques reciben la vista y las vistas que contiene: `"none"` ninguna de las dos (una vista interior que establezca `"auto"` vuelve a recibirlos), `"box-none"` solo las vistas que contiene, `"box-only"` solo la propia vista ([touch and gestures](../docs/touch-and-gestures.md#pointerevents)).

La respuesta visual de la pulsación es de la app: `activeStyle` (o las clases `active:`, `.active(..)` en Rust) se aplica mientras la vista está pulsada, de forma nativa, sin ida y vuelta al código de la app (más abajo).

<a id="state-styles"></a>

### Estilos de estado

Estilos que se aplican mientras la vista está en un estado, sobre sus propios estilos, de forma nativa. Cada uno es la forma de objeto de una variante de Tailwind. Los estados posteriores prevalecen (selected, checked e indeterminate, luego hover, focus, active); `disabledStyle` prevalece sobre todos, y los demás no se aplican mientras la vista está deshabilitada. Cada uno recibe el estilo propio del elemento: un `TextStyle` en un `<Text>`, un `InputStyle` en un `<Input>`, un `ImageStyle` en un `<Image>`, un `ViewStyle` en cualquier otro.

| Prop | Rust | Variante de clase | Se aplica |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | Mientras está pulsada. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | Mientras un puntero está sobre la vista. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | Mientras la vista tiene el foco. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | Mientras la vista o una vista dentro de ella tiene el foco (el contenido de un `Overlay` cuenta como dentro de la vista en la que está). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | Mientras `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | Mientras `accessibilityState.checked` es `true` (un checkbox, un switch, un radio; `"mixed"` no está marcado). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | Mientras `accessibilityState.checked` es `"mixed"` (un checkbox que no está ni marcado ni desmarcado). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | Mientras `accessibilityState.selected` es `true` (un `Button` seleccionado, una pestaña). |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | Mientras `accessibilityState.expanded` es `true` (el trigger de un `Popover` o de un `Menu` mientras su popup está abierto). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | Mientras `accessibilityState.pressed` es `true` (un botón toggle que está activado; `"mixed"` no está pulsado). No es `activeStyle`, una pulsación en curso. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
### Hover

La app detecta cuándo el mouse entra en una vista, se mueve sobre ella y la abandona: en macOS, Windows, Linux, el backend de GPUI y en navegadores de escritorio, con el puntero de un iPad o el mouse de un Mac en iOS, y con un mouse o un lápiz en Android. Los estilos de hover (`hover:`, `.hover(..)`) dan estilo a las vistas bajo el cursor en esos mismos lugares.

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | El mouse entró en la vista o en una vista dentro de ella (el `mouseenter` del DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | El mouse se movió sobre la vista (o sobre una vista dentro de ella), con o sin un botón presionado, o se presionó o soltó una tecla modificadora mientras el mouse reposa allí sin ningún botón presionado (el `mousemove` del DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | El mouse salió de la vista y de las vistas dentro de ella, o de la ventana; `e` es donde estuvo por última vez (el `mouseleave` del DOM). |

Como `:hover` en CSS y `mouseenter` en el DOM, una vista cuenta como en hover mientras el mouse está sobre ella o sobre cualquier elemento dentro de ella, de modo que las vistas que rodean a la que está bajo el mouse también reciben `onMouseEnter` (de afuera hacia adentro; `onMouseLeave` de adentro hacia afuera). Los eventos llegan después de ocurrir el hecho y nunca con toques. Una vista que se elimina de debajo del mouse recibe `onMouseLeave`, en Linux y Windows en el siguiente movimiento del mouse.

`MouseEvent` indica dónde está el mouse, como lo hace `MouseMoveEvent` de GPUI: `position` en la vista (un `Point` en puntos, con sus transformaciones deshechas), `pagePosition` en la vista raíz que la contiene, como lo dan los toques, los `modifiers` presionados (`control`, `alt`, `shift`, `platform`: Command en las plataformas de Apple, la tecla Windows en las demás), y `pressedButton`, el botón presionado (`"left"`, `"right"`, `"middle"`, `"back"` o `"forward"`, el `MouseButton` de GPUI) o `null`; en Rust `position`, `page_position`, `modifiers` y `pressed_button`. En los escritorios y en la web, un arrastre también es un toque (`onTouchMove`, el responder), y sus movimientos llegan a `onMouseMove` con `pressedButton` activado: el feedback que solo sigue al hover los omite; en iOS y Android el hover informa del puntero sin ningún botón presionado. Los movimientos llegan como máximo una vez por fotograma, el más reciente, y siempre antes del `onMouseLeave` que los sigue, de modo que un manejador puede redibujar en cada movimiento:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

### Tooltips

`tooltip` da una pista a cualquier elemento, que se muestra encima de él en los escritorios (macOS, Windows, Linux, el backend de GPUI y navegadores de escritorio) cuando el puntero ha reposado sobre él durante medio segundo, hasta que el puntero sale o lo presiona. Los teléfonos y las tabletas no muestran ninguna. La pista nunca captura el puntero ni las pulsaciones, así que el elemento funciona exactamente igual que sin ella.

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | La pista, un elemento al que la app da estilo: un [`Tooltip`](tooltip.md) de `nsh/base` es el propio tooltip, con su ubicación, retardo y eventos; cualquier otro elemento se muestra tal cual. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

El `Tooltip` define su propio aspecto, ubicación, retardo y eventos, como lo hace el `.tooltip(..)` de GPUI. Una app con muchos tooltips mantiene un pequeño componente propio que envuelve un texto en su `Tooltip`.

<a id="context-menus"></a>

### Menús contextuales

`onContextMenu` indica a una vista que se presionó el botón secundario sobre ella: un clic derecho, Control-clic en macOS, un clic con dos dedos en un touchpad, el clic secundario del puntero de un iPad; en navegadores también la tecla de menú del teclado. Abre ahí el menú propio de la app; en TSX, [`Menu.popup`](../modules/nsh-desktop.md) muestra el del sistema:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | Se presionó el botón secundario sobre la vista o sobre una vista dentro de ella. |

`ContextMenuEvent` tiene `position` en la vista, `pagePosition` en su vista raíz (donde `Menu.popup` ubica un menú: `Menu.popup(items, e.pagePosition)`) y los `modifiers`; en Rust `position`, `page_position` y `modifiers`. La vista más cercana que escucha, desde la que está bajo el puntero hacia afuera, lo recibe. Un campo de texto, o texto seleccionable con un menú de edición (Windows, el backend de GPUI, navegadores), más cercano que esa vista muestra su propio menú en su lugar. La plataforma lo decide en el momento en que el botón baja, a partir de lo que está montado, así que el manejador se entera después de ocurrir el hecho y no hay nada que cancelar. Una vista `disabled` deja el clic al oyente habilitado más cercano que la rodea. En pantallas táctiles, una pulsación larga abre los menús: maneja `onLongPress` con la misma función.

<a id="keyboard-focus"></a>

### Foco del teclado

En macOS y en la web, Tab mueve el foco del teclado entre sus paradas en el orden del árbol: los campos de texto, las vistas que aceptan pulsaciones y cada vista `focusable`. Los estilos de foco (`focus:`, `.focus(..)`) dan estilo a la vista con el foco, y Return o Espacio la presionan cuando acepta pulsaciones. Un clic presiona una vista sin darle el foco, de modo que los estilos de foco se muestran solo para el foco del teclado.

El foco y las pulsaciones son cosas distintas. Una vista que recibe teclas mientras tiene el foco (un gráfico, un slider, una lista que mueve su selección con las teclas de flecha) define `focusable` y enlaza sus teclas mientras tiene el foco (`onFocus` / `onBlur` con [`keymap`](../modules/nsh.md#keymap)); una pulsación sobre ella sigue llegando a un elemento presionable que la rodea, como una tarjeta que abre una página.

El `focus()` de una ref mueve el foco del teclado a una parada como lo hace Tab (se muestran sus estilos de foco y se dispara `onFocus`), por ejemplo para devolverlo al disparador de un popup que se cerró, y `blur()` lo quita.

Una vista que rodea al foco se da estilo a sí misma con `focus-within:` (`focusWithinStyle`, `.focus_within(..)`) mientras el foco está en ella o en cualquier vista dentro de ella: el marco de un campo alrededor del input que edita, una barra de herramientas mientras uno de sus botones tiene el foco. El contenido de un `Overlay` está dentro de la vista en la que está el overlay, se muestre donde se muestre, así que un popup cuenta como parte de la vista que contiene su disparador. En Rust, un componente detecta cuándo el foco entra en un elemento y sale de él con los `on_focus_in(..)` y `on_focus_out(..)` de su ref: moverse entre vistas dentro de él no es ninguna de las dos cosas.

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` para las vistas que aceptan pulsaciones | Si la vista es una parada de Tab. `true` convierte cualquier vista en una, ya acepte pulsaciones o las deje a las vistas que la rodean; `false` deja un elemento presionable solo al puntero (un fondo que cierra un popover, filas entre las que se mueven las teclas de flecha). |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (o `focus()`) dio a la vista el foco del teclado. |
| `onBlur` | `.on_blur(..)` | `() => void` | | El foco del teclado salió de la vista. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### Layout e identidad

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` es el marco de la vista relativo a su padre, `{ origin, size }`, después de cada layout que lo cambia. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | La ref del elemento (consulta los [métodos de ref](#ref-methods)): `ViewRef`, o el tipo propio del elemento sobre ella. `ref={el}` asigna una variable, `ref={fn}` llama a una función. |
| `nativeID` | `.native_id(id)` | `string` | Da un nombre a la vista para otros, p. ej. el `InputAccessoryView` al que se refiere un input. |
| `testID` | `.test_id(id)` | `string` | Un identificador para pruebas de UI (en Android, el resource id de la vista). |
| `key` | `.key(key)` | `string` | La identidad del elemento entre sus hermanos. |

<a id="gestures-driving-animated-values"></a>

### Gestos que controlan valores animados

Estas props enlazan un gesto a [valores animados nativos](../modules/nsh.md#animation) que se mueven en el hilo de la UI, sin trabajo en el código de la app en cada fotograma. Consulta [toques y gestos](../docs/touch-and-gestures.md).

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | Los arrastres controlan estos valores (puntos). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Comenzó un arrastre. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Terminó un arrastre, con la velocidad de liberación (p. ej. para iniciar un `decay`). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | Los gestos de pellizco con dos dedos controlan `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Un pellizco comenzó / terminó. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | Las rotaciones con dos dedos controlan `angle` (grados). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Una rotación comenzó / terminó. |

`PanEvent` es `{ cancelled, translation, velocity, value? }` (en Rust `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`): si el sistema canceló el arrastre, la traslación desde el inicio y la velocidad en puntos por segundo (`Point`s), y los valores enlazados en ese momento, `{ x?, y? }` para los ejes que enlaza `pan` (un arrastre puede tomar un valor en mitad de una animación).

<a id="raw-touches-and-the-responder-system"></a>

### Toques sin procesar y el sistema responder

Para los gestos que las props anteriores no cubren, cada elemento acepta las props de toque y de responder: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (y sus formas `…Capture`), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (y `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` y `onResponderTerminationRequest`. Cada manejador recibe un `GestureResponderEvent` (`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...). Devolver `true` desde `onResponderGrant` impide que las scroll views nativas se queden con los toques. `panActivation` (`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) convierte a la vista en responder solo cuando la plataforma activa su pan, de modo que los arrastres dentro de scroll views dejan el otro eje a estas ([Toques y gestos](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)). `PanResponder` en [`PanResponder`](../modules/nsh.md#panresponder) se construye sobre ellos. En Rust, `.on_touch(..)` recibe cada toque (`TouchEvent`), `.claim_touches(..)` decide cuándo la vista los toma, y `.on_responder_grant(..)`, `.on_responder_move(..)`, `.on_responder_release(..)` y los demás siguen al responder.

<a id="accessibility"></a>

### Accesibilidad

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | La vista es un solo elemento para las tecnologías de asistencia; sus hijos no se exponen por separado. |
| `accessibilityLabel` | `.label(..)` | `string` | Lo que leen los lectores de pantalla. Las vistas sin etiqueta leen sus textos. |
| `accessibilityHint` | `.hint(..)` | `string` | Lo que hace activar el elemento. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | Lo que es el elemento (`"button"`, `"header"`, `"link"`, `"switch"`, …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | El estado que informan las tecnologías de asistencia (`checked` y `pressed` pueden ser `"mixed"`; `current` es `true` o `"page"`, `"step"`, `"location"`, `"date"`, `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | El nivel de un encabezado (1 el más alto), la profundidad de un elemento de árbol (1 en la cima). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | El valor de un elemento de rango o de texto. |
| `accessibilityElementsHidden` | | `boolean` | Oculta la vista y su subárbol a las tecnologías de asistencia. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Si la vista está expuesta. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Acciones personalizadas ofrecidas a las tecnologías de asistencia. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | El usuario invocó una de las `accessibilityActions`. |

Consulta [accesibilidad](../docs/accessibility.md).

<a id="platform-only-props"></a>

### Props específicas de una plataforma

Las props que existen en una sola plataforma van en un objeto con su nombre en TSX, de modo que las props compartidas sean las mismas en todas partes. Solo se envía el objeto de la plataforma actual; los demás se ignoran. Los builders de Rust las aceptan como métodos que se aplican en su plataforma.

| Prop | Descripción |
|---|---|
| `ios={{…}}` | iOS y Mac Catalyst. `<Input>`, `Dialog` y `WebView` añaden sus propias claves. |
| `android={{…}}` | Android. Cada elemento acepta `ripple`, `elevation` y `accessibilityLiveRegion` (abajo). |
| `desktop={{…}}` | Plataformas de escritorio y navegadores de escritorio; se ignora en móviles. Cada elemento acepta `windowDrag` (abajo). |
| `web={{…}}` | Navegadores; se ignora en el resto. |

| Clave de `android` | Rust | Tipo | Descripción |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | El efecto ripple de Material mientras se presiona. |
| `elevation` | `.elevation(px(2.0))` | `number` | La sombra de Material (puntos), a partir de la forma de la vista. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | Cómo se anuncian a TalkBack los cambios de la vista. |

| Clave de `desktop` | Rust | Tipo | Descripción |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | Presionar la vista arrastra la ventana, como lo haría su barra de título; `false` mantiene clicable una parte de una vista arrastrable. Consulta [una barra de título propia](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

Consulta [código específico de plataforma](../docs/platform-specific.md).
<a id="ref-methods"></a>

## Métodos de ref

En TSX, `ref` recibe la ref del elemento, cuyo tipo es el propio del elemento: `ViewRef` (`focus`, `blur`, `measure`) para
`View`, `Text`, `Image`, `Canvas`, `Overlay` y `Shader`, y un tipo sobre `ViewRef` con los métodos del elemento para los
demás: `InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef`
(`Video`) y `NativeComponentRef` (componentes nativos). En Rust, `element_ref()` crea un handle `ElementRef` que
`.element_ref(&handle)` adjunta. Sus métodos envían comandos a la vista nativa, en orden con los cambios realizados
antes de ellos en el mismo turno. La página de cada elemento indica cuáles le corresponden. Tipa una variable de ref con el tipo propio de su elemento
(`let field!: InputRef` para un `<Input>`): una variable tipada como `ViewRef` no encaja con un elemento cuya ref tiene métodos
propios.

| Método | Rust | Ref | Descripción |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | Enfoca un `<Input>` (muestra el teclado), o da el foco del teclado a una vista que recibe pulsaciones / lo quita. |
| `measure()` | `measure()` | `ViewRef` | [Dónde está la vista](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | Selecciona `start..end` en unidades UTF-16; un cursor sin `end`. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | Se desplaza a un offset. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (un `<Scroll>` con zoom) | Aplica zoom a `scale` alrededor de un punto del contenido. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | Se desplaza a un offset a lo largo del eje de la lista. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | Desplaza un elemento hasta hacerlo visible. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | Se desplaza al final del contenido. |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | Controla la página. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | Salta a un instante. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | Llama a un comando de un componente nativo registrado ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## Por qué los manejadores nunca bloquean la UI

El hilo principal nunca espera al código de la app. Cuando el sistema necesita una respuesta al instante (si puede cambiar este texto, si el
botón de retroceso puede quitar la pantalla, si se puede cerrar esta hoja), NSH la responde de forma nativa a partir de props definidas de antemano (`maxLength`,
`popOnBack`, `closeOnSwipe`, …), y el evento llega a la app después. Por eso ese comportamiento
es una prop y no el valor de retorno de un manejador.
