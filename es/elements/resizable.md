---
title: "Resizable"
description: "ResizablePanelGroup y ResizablePanel: paneles dispuestos uno al lado del otro o apilados, con un tirador entre cada par que el usuario arrastra para repartir el espacio. El grupo se encarga del arrastre, de los límites de los paneles, del cursor de redimensionamiento y del rol de los tiradores para los lectores de pantalla; los tamaños, el aspecto de los tiradores y el contenido de los paneles dependen de la app."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---


# Resizable

Un grupo redimensionable dispone paneles lado a lado o apilados, con un tirador en cada límite entre dos de ellos: una barra lateral junto a un documento, un editor sobre su consola, una lista junto a su detalle. El usuario arrastra un tirador para mover el límite, y cada panel se mantiene dentro de los tamaños que la app le permite. `ResizablePanelGroup` se encarga del comportamiento: el arrastre, que se ejecuta de forma nativa fotograma a fotograma, cómo se reparte el espacio, el cursor de redimensionamiento y un área táctil más grande para un dedo.
El aspecto es de la app: un tirador es una banda sin línea, color ni agarre propios, y lo que dibuja es el indicador de la app; los paneles son las vistas de la app.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` y `ResizablePanel` provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. Los paneles son los hijos directos del grupo. En Rust, `h_resizable()` y `v_resizable()` crean un grupo a lo largo de cada eje (`resizable_panel_group().axis(..)` recibe el eje como valor) y `resizable_panel()` crea un panel, con un setter por prop, un listener por evento, los métodos de estilo tipados y `.child(..)` para su contenido; `.size_range(min..max)` establece ambos límites a la vez.

<a id="sizes"></a>

## Tamaños

El `size` de un panel es el tamaño que desea, dentro de su `minSize` y su `maxSize`. Los paneles sin tamaño se reparten a partes iguales lo que queda, sea cual sea su contenido; cuando todos los paneles tienen un tamaño, el espacio sobrante se reparte en proporción a ellos. Mientras el usuario arrastra un tirador, el grupo traslada el espacio entre los paneles en el núcleo, sin pasar por JS:

- Al crecer el panel anterior al tirador, toma espacio de los paneles posteriores, el más cercano primero, cada uno hasta su `minSize`, saltándose los que son `fixed`.
- Al reducirlo por debajo de su `minSize`, toma espacio de los paneles anteriores.
- Ningún panel crece más allá de su `maxSize`, y la suma de los paneles nunca supera el tamaño del grupo.

Cuando un arrastre termina habiendo cambiado los tamaños, el grupo informa del tamaño de cada panel visible, en el orden en que están dispuestos (`onResize` en el grupo), y cada panel cuyo tamaño cambió informa del suyo (`onResize` en el panel). Los paneles que un arrastre movió conservan los tamaños del usuario hasta que la app pase un nuevo `size`; la app los conserva más allá de la vida del grupo devolviendo los tamaños informados como `size`, de modo que un diseño que restaura desde el [almacenamiento](../modules/nsh.md#storage) se abre con los tamaños en que el usuario lo dejó. Solo informan los arrastres y los pasos de los lectores de pantalla: cambiar el tamaño de una ventana o mostrar u ocultar un panel no informa de nada.

Cuando el grupo crece o se reduce (se redimensiona la ventana), los paneles con tamaño lo conservan y los paneles sin tamaño absorben la diferencia. Cuando el grupo es demasiado pequeño para los tamaños, los paneles se reducen, salvo los `fixed` (una barra lateral, un inspector), y vuelven a sus tamaños cuando regresa el espacio. Un panel con `visible={false}` no ocupa espacio: los demás se reparten el suyo, y vuelve a su tamaño cuando se muestra de nuevo.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## Tiradores

Hay un tirador en cada límite entre dos paneles visibles: una banda de 9 puntos de grosor a lo ancho del eje, centrada en el límite, con el cursor de redimensionamiento de su eje. En pantallas táctiles, su área táctil se extiende 10 puntos más a cada lado, de modo que incluso una línea de un punto es fácil de agarrar. El tirador es un `group`: lo que dibuja es el indicador de la app, con estilo mediante `handleClass` / `handleStyle`: 1 punto de ancho y toda la longitud del límite, así que `bg-border` por sí solo es una línea fina en cualquiera de los ejes, y `w-[3px]` o `h-[3px]` la engrosa, y sus clases `group-hover:` y `group-active:` siguen al puntero sobre la banda y la pulsación o el arrastre. Para algo más que una línea (un agarre de puntos, un icono), `renderHandle` renderiza el contenido del indicador, recibiendo los valores `index`, `axis` y `state` del tirador; se vuelve a dibujar cuando cambia el estado, unas pocas veces por arrastre, nunca en cada movimiento. Un agarre animado es el pulgar del tirador (`handleThumbClass` / `handleThumbStyle`): una vista centrada en la línea, dibujada en vertical y girada un cuarto de vuelta en una línea horizontal para que una sola clase sirva para ambos ejes, que las clases `group-hover:` y `group-active:` muestran y con las que hacen la transición; el tirador permanece pulsado durante todo el arrastre, vaya donde vaya el puntero.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` mantiene cada tirador donde está (un diseño bloqueado).

## Props

### ResizablePanelGroup

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Lado a lado (los tiradores se arrastran a izquierda y derecha) o apilados (arriba y abajo). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin arrastres: los tiradores se quedan donde están. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador de cada tirador, en el límite, dentro de la banda del tirador: 1 punto de ancho a lo ancho del eje y toda la longitud del límite, salvo que indique otra cosa (`w-[3px]`, `h-[3px]`); `group-hover:` y `group-active:` siguen a la banda. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El pulgar de cada tirador: un agarre centrado en la línea, dibujado en vertical como en una línea vertical y girado un cuarto de vuelta en una horizontal, para que una sola clase sirva para ambos ejes. Sigue siendo la misma vista mientras el tirador recibe el puntero, se pulsa y se arrastra, así que las clases `group-hover:` y `group-active:` hacen la transición (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | ninguno | Lo que hay dentro de cada indicador, que se vuelve a dibujar cuando cambia el `state` del tirador. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para cada tirador: qué redimensiona. Lo ajustan de 10 en 10 puntos. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los `ResizablePanel`, sus hijos directos. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | `size-full` | El propio grupo; llena a su padre salvo que su clase diga otra cosa. |

### ResizablePanel

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | ninguno | La longitud que desea a lo largo del eje del grupo, en puntos, dentro de `minSize` y `maxSize`; un nuevo valor lo redimensiona. Sin él, comparte lo que queda. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | Lo mínimo que alcanza. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | sin límite | Lo máximo que alcanza. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | Conserva su tamaño cuando el grupo es demasiado pequeño para los paneles; arrastrar su propio tirador aún lo redimensiona. Acepta un `size`. |
| `visible` | `.visible(..)` | `boolean` | `true` | Oculto, no ocupa espacio y los demás se reparten el suyo. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Su contenido. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La superficie propia del panel. Su tamaño a lo largo del eje lo fija el grupo. |

### ResizeHandleContext

| Campo | Tipo | Descripción |
|---|---|---|
| `index` | `number` | El límite posterior al panel visible número `index`. |
| `axis` | `"horizontal" \| "vertical"` | El eje a lo largo del cual redimensiona. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | Cuánto se han desplazado con él el puntero o el dedo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | Un arrastre terminó y movió un tirador, o un lector de pantalla ajustó uno: `sizes`, el tamaño de cada panel visible, en el orden en que están dispuestos (de izquierda a derecha, de arriba abajo). |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | Un arrastre terminó y cambió el tamaño de este panel: `size`, el nuevo, para devolverlo como su `size`. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizado con | Estados |
|---|---|---|---|
| El grupo | | `ResizablePanelGroup` de `class`, `style` | |
| Un panel | el grupo | `ResizablePanel` de `class`, `style` | |
| El indicador de un tirador | la banda del tirador, en un límite | `handleClass`, `handleStyle`, `renderHandle` | `group-hover:` bajo un puntero, `group-active:` mientras se pulsa o se arrastra; `state` en `renderHandle` |
| El pulgar de un tirador | centrado en la línea de un tirador | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (pulsado hasta que termina el arrastre) |

<a id="accessibility"></a>

## Accesibilidad

- Cada tirador es un elemento ajustable para los lectores de pantalla, con `handleAccessibilityLabel` como etiqueta. Su valor es el tamaño del panel anterior, dentro de los `minSize` y `maxSize` de ese panel.
- Deslizar hacia arriba o hacia abajo sobre un tirador con VoiceOver, o usar las teclas de volumen de TalkBack, lo mueve 10 puntos, como lo haría un arrastre; el grupo lo informa con `onResize`. Los tiradores de un grupo `disabled` se quedan donde están.
- El contenido de los paneles es de la app y se lee como en cualquier otro lugar.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- Escritorios (macOS, Windows, Linux, GPUI) y la web: el puntero sobre un tirador muestra el cursor de redimensionamiento de columna o de fila, y un arrastre con el ratón o un touchpad mueve el límite.
- iOS, Android y Mac Catalyst: un dedo arrastra el tirador, dentro de un área táctil 10 puntos más ancha a cada lado que la banda.
- En diseños de derecha a izquierda, los paneles y sus tamaños siguen el orden del diseño.
- Cada plataforma dibuja lo que la app estiliza: los indicadores y los paneles.
- Las divisiones de [Dock](./dock.md) son grupos redimensionables: se redimensionan de la misma manera.
