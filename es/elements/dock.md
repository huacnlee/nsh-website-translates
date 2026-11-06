---
title: "Dock"
description: "DockArea: un espacio de trabajo acoplable de divisiones, grupos de pestañas y docks en los bordes izquierdo, derecho e inferior, cuyo diseño son datos que pertenecen a la app. El área gestiona el arrastre y soltado de pestañas, el redimensionado, los docks, el zoom y el bloqueo, conserva el contenido de cada panel cuando se mueve y se adapta a los teléfonos; el aspecto y el contenido de los paneles dependen de la app."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---


# Dock

Un área de dock es un espacio de trabajo que el usuario organiza: paneles en grupos de pestañas, grupos divididos lado a lado o apilados, y docks en los bordes izquierdo, derecho e inferior que se abren, se cierran y cambian de tamaño. Una pestaña arrastrada a otro grupo se une a él, arrastrada al borde de un grupo lo divide, y cada panel conserva lo que contiene al moverse. `DockArea` se encarga del comportamiento: arrastrar y soltar pestañas, que se ejecuta de forma nativa fotograma a fotograma, redimensionar divisiones y docks, abrir y cerrar docks, el zoom y el bloqueo. La apariencia es de la app: las pestañas, las barras de pestañas, los tiradores, el indicador de destino y el contenido de cada panel los renderiza y les da estilo la app, y el área no dibuja nada por sí misma.

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` y los valores que toma provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust
(`nsh_base::dock_area()`, los valores en `nsh_base::dock`). En Rust, `dock_area()` lo crea, con un setter por
prop, un listener por evento y los métodos de estilo tipados; `DockLayout` describe una disposición mediante las claves de los paneles
(`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`).

<a id="the-layout"></a>

## La disposición

La disposición es un valor, `DockAreaLayout`: el centro y un dock en cada uno de los bordes izquierdo, derecho e inferior, todos
opcionales. Cada región es un árbol con dos tipos de nodo:

| Nodo | Contiene | Campos |
|---|---|---|
| `{ type: "split" }` | Otros nodos, lado a lado (`axis: "horizontal"`) o apilados (`"vertical"`) | `children` y `sizes`: la longitud de cada hijo a lo largo del eje en puntos, `null` para repartir el resto |
| `{ type: "tabs" }` | Paneles, por clave, uno visible a la vez | `panels` (las claves, en orden de pestañas), `activeIndex` (la visible, 0 por defecto) |

Un panel siempre vive en un grupo de pestañas: una región con un solo panel es un grupo de pestañas de uno. La clave de un panel es la cadena que la app usa para identificarlo (`"files"`, el id de un documento), y una clave aparece una sola vez en toda la disposición. Un dock (`DockRegion`) es su árbol
(`layout`), su tamaño a lo ancho de su borde (`size`, 200 por defecto, mínimo 100), si está abierto (`open`, por defecto `true`)
y si arrastrar su borde por debajo de su tamaño mínimo lo cierra (`collapsible`, por defecto `true`).

Todo nodo tiene un `id`. Una disposición que escribe la app puede omitir los ids: el área los asigna, y toda disposición que informa los incluye. Al devolver una disposición informada se conserva la identidad de cada grupo, que es como los métodos del ref nombran los grupos. El área también ordena lo que recibe: un grupo o una división vacíos desaparecen, una división de un solo hijo se convierte en ese hijo, una división dentro de otra división del mismo eje se une a su padre, `activeIndex` permanece dentro del rango, y una clave listada dos veces conserva su primer lugar. Las disposiciones que informa siempre tienen esa única forma canónica.

La disposición es de la app (`layout`): cada cambio que hace el usuario (una pestaña seleccionada, arrastrada o cerrada, una división o un dock redimensionados, un dock abierto o cerrado) se informa como la nueva disposición completa (`onLayoutChange`), y el área muestra la
disposición que la app le devuelve. La app cambia la disposición por sí misma pasando un nuevo valor: una disposición guardada que se restaura, un
comando que reorganiza el espacio de trabajo. Un área sin `layout` mantiene la suya propia, a partir de `defaultLayout`, y
sigue informando cada cambio.

<a id="panels-content"></a>

## Contenido de los paneles

Lo que muestra un panel es de la app: `renderPanel` lo renderiza a partir de la clave del panel (`panel.id`). Todos los paneles de un grupo se colocan y solo se muestra el visible, de modo que al cambiar de pestaña cada panel conserva su contenido; y cuando un panel se mueve (a otro grupo, a un dock, a un zoom y de vuelta), el mismo contenido se mueve con él: las signals que creó, el texto de un input, una posición de scroll, la página de un web view, todo permanece. El área renderiza un panel una vez, cuando aparece por primera vez, y libera su contenido cuando el panel sale de la disposición (`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` define lo que permite cada panel, por clave; un panel que no figura en la lista lo permite todo:

| Campo | Por defecto | Descripción |
|---|---|---|
| `id` | | La clave del panel. |
| `closable` | `true` | Puede cerrarse. |
| `zoomable` | `true` | Su grupo puede hacer zoom mientras el panel está visible. |
| `visible` | `true` | Se muestra. Un panel oculto conserva su lugar y vuelve a él; un grupo o una división cuyos paneles están todos ocultos no ocupa espacio. |

<a id="tabs"></a>

## Pestañas

Cada grupo tiene una barra de pestañas con una pestaña por cada panel visible, en el orden de su `panels`. `renderTab` renderiza lo que muestra una pestaña (su título, un icono, un botón de cierre propio de la app); sin él, una pestaña muestra la clave del panel. El área la convierte en la pestaña: una pulsación la selecciona, un arrastre mueve su panel, los lectores de pantalla la anuncian como una pestaña con su estado de selección, y las clases `selected:` de `tabClass` dan estilo a la visible. El valor de una pestaña indica lo que la app necesita para dibujarla:

| Campo | Tipo | Descripción |
|---|---|---|
| `panel` | `string` | La clave del panel. |
| `group` | `number` | El id del grupo de pestañas en el que está. |
| `index` | `number` | Su lugar entre las pestañas visibles del grupo. |
| `active` | `boolean` | Es la pestaña visible del grupo. |
| `closable` | `boolean` | El área la cerraría: es cerrable, el área no está bloqueada y su grupo puede cederla. |
| `zoomed` | `boolean` | Su grupo tiene zoom. |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## Arrastrar y soltar

Una pestaña arrastrada sobre un grupo muestra dónde aterrizaría, y al soltarla se coloca allí:

| Se suelta sobre | El panel |
|---|---|
| Una barra de pestañas | Se une a ese grupo, entre las pestañas junto a las que se suelta |
| El centro del contenido de un grupo | Se une a ese grupo |
| Un borde del contenido de un grupo (su 35 % exterior en cada lado) | Divide ese grupo: un nuevo grupo propio en ese lado |

Mientras un arrastre pasa por encima, el área muestra el indicador de destino sobre la parte del grupo que ocuparía el panel (todo su contenido si se une, la mitad si divide): una parte a la que la
app da estilo (`dropIndicatorClass`), con contenido propio si la app lo renderiza (`renderDropIndicator`, que recibe el
`group`, el `side` que separa o la barra de pestañas `index`). Se mueve a cada nuevo lugar de forma nativa, deslizándose hasta allí y apareciendo gradualmente sobre otro grupo mientras el anterior se desvanece (de inmediato cuando el usuario pide menos movimiento). Lo que sigue al puntero o al dedo también es de la app
(`renderDragPreview`). Un soltar es un único cambio de la disposición, informado una sola vez; un soltar que no cambiaría nada no cambia nada.

Un área bloqueada, un área con zoom y el último panel de un grupo cuando no hay nada junto a ese grupo no permiten arrastrar nada.

## Docks

Un dock se abre y se cierra sin perder sus paneles ni su tamaño: al cerrarlo conserva su árbol, y al abrirlo muestra los mismos grupos con el mismo tamaño. El borde entre un dock y el centro es un tirador que el usuario arrastra para redimensionar el dock; se mantiene en al menos 100 puntos y el centro conserva al menos 100 puntos, y un dock colapsable que se suelta por debajo de 50 puntos se cierra y conserva su tamaño para cuando se abra. El área siempre se ajusta a sus límites: un dock se muestra con su `size` dentro de lo que el área le deja, y cuando ni así cabe, los docks se reducen junto con el resto y los tamaños mínimos de las divisiones ceden. `renderDock` dibuja el chrome propio de un dock antes de su disposición (una franja de título, un botón de colapso), y recibe su
`placement`, `open`, `size` y `collapsible`; `dockClass` da estilo a su marco.

Abre, cierra y redimensiona docks desde la app mediante el ref (`toggleDock`, `setDockOpen`, `setDockSize`), que funcionan
en ambas presentaciones, o escribiendo los campos `open` y `size` del dock en la disposición que pasa (`open` es el de la
presentación completa). `onDockOpenChange` informa
cada vez que un dock se muestra o se oculta, medido respecto al `open` de la disposición (un área que es compacta desde el inicio informa
como oculto cada dock abierto en la disposición), de modo que un interruptor que parte del `open` de la disposición y sigue a `onDockOpenChange` siempre
muestra el estado del dock:

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

## Zoom

Un grupo con zoom llena toda el área hasta que se le quita el zoom o sale de la disposición (`area.toggleZoom(group)`, y `area.toggleZoom()` para quitar
el zoom), y `onZoomChange` informa el panel que muestra, o `null`. El zoom pertenece al grupo, por lo que sigue con zoom
cuando se cierra su panel visible y el siguiente toma su lugar. Un panel con `zoomable: false` impide que su grupo haga
zoom mientras está visible.

<a id="locking"></a>

## Bloqueo

`locked` mantiene la organización tal como está: sin arrastrar pestañas, sin soltar, sin cerrar. Seleccionar pestañas, redimensionar y abrir y
cerrar docks siguen funcionando, de modo que un espacio de trabajo bloqueado sigue siendo un espacio de trabajo utilizable.

<a id="methods"></a>

## Métodos

`ref={area}` proporciona los métodos del área (`DockAreaRef`), para los comandos, atajos y menús de la app. Cada edición se
informa con `onLayoutChange` igual que las del usuario. Un método al que se le pasa un panel, un grupo, un índice de pestaña o un dock que la disposición
no tiene deja la disposición como está y registra una advertencia con el nombre del método y el valor.

| Método | Descripción |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: la disposición mostrada. |
| `addPanel(panel, placement?, size?)` | Añade un panel a una región (`"center"`, el valor por defecto, `"left"`, `"right"`, `"bottom"`), en su primer grupo de pestañas, como visible; un dock inexistente se crea, con `size` de ancho. Un panel que el área ya contiene se mueve allí. |
| `removePanel(panel)` | Elimina un panel, sin importar lo que digan sus opciones. |
| `closePanel(panel)` | Cierra un panel como lo haría su pestaña: salvo que el área esté bloqueada, el panel no sea cerrable o sea el último panel de un grupo sin nada junto a él. |
| `movePanel(panel, target)` | Mueve un panel a `target`: `{ group, side?, index?, activate?, size? }`, al grupo de pestañas `group` (en `index`) o a un nuevo grupo en su `side` (`size` puntos a lo largo de la nueva división). |
| `splitAt(group, panel, side)` | Coloca un panel en un nuevo grupo de pestañas en un lado (`"left"`, `"right"`, `"top"`, `"bottom"`) de un contenedor. |
| `selectPanel(panel)` | Muestra un panel en su grupo. |
| `selectTab(group, index)` | Muestra una pestaña de un grupo. |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | Abre o cierra un dock. |
| `setDockSize(placement, size)` | Define el tamaño de un dock a lo ancho de su borde (mínimo 100). |
| `toggleZoom(group?)` | Aplica zoom a un grupo, o se lo quita cuando ya lo tiene; sin `group`, quita el zoom al grupo ampliado. |
| `zoomedGroup()` | `Promise<number \| null>`: el id del grupo con zoom. |
| `groupOf(panel)` | `Promise<number \| null>`: el id del grupo de pestañas que contiene un panel. |

En Rust, `component_ref::<DockArea>()` y `.component_ref(&r)` en el área proporcionan un ref cuyo `r.api::<DockAreaApi>()` tiene
los mismos métodos en snake case.

<a id="saving-and-restoring"></a>

## Guardar y restaurar

Una disposición informada son datos simples, así que guardarla es `JSON.stringify(layout)` en el [almacenamiento](../modules/nsh.md#storage),
y restaurarla es pasar el valor analizado como `layout`. `onLayoutChange` informa cada cambio, incluidos un redimensionamiento y una selección de
pestaña, así que escribe en el almacenamiento cuando los cambios se hayan asentado (un temporizador corto que se reinicia con cada informe).

En Rust, `DockAreaLayout::to_state` y `from_state` leen y escriben `DockAreaState`, el formato de archivo de disposición
que también usa el dock de `gpui-base`.

<a id="phones-and-narrow-windows"></a>

## Teléfonos y ventanas estrechas

El dock se adapta a su propio ancho. Un área de 600 puntos de ancho o más (en una ventana de escritorio, en la web, en una tablet, un
iPad a pantalla completa, un plegable abierto) es el espacio de trabajo completo: divisiones, grupos y docks lado a lado, como las apps multipanel de una tablet. Con un dedo en un teléfono o una tablet, el arrastre de una pestaña comienza con una pulsación larga, como en el arrastrar y soltar de iPadOS, de modo que una barra de pestañas
sigue desplazándose con un deslizamiento, y los tiradores tienen un área táctil más amplia con el mismo aspecto.

Un área de menos de 600 puntos (en un teléfono, un iPad en Slide Over, en una ventana de escritorio o de navegador estrecha, o en una
columna estrecha de una ancha) presenta la misma disposición para una sola pantalla, igual que las vistas divididas del iPad colapsan sus columnas y el panel de apoyo de Material Design
se convierte en una hoja inferior:

- El centro muestra un grupo a la vez, a tamaño completo. Su barra de pestañas lista todos los paneles visibles del centro, y al seleccionar
  un panel de otro grupo ese grupo pasa a ser el que se muestra.
- Los docks izquierdo y derecho son cajones sobre el centro desde su borde, tan anchos como el dock, y el dock inferior es una
  hoja tan alta como el dock. Se muestra uno a la vez, cuando la app lo presenta (`toggleDock`, `setDockOpen`, que
  descartan el otro); se desliza al entrar y al salir, y una pulsación en su fondo, Escape o atrás lo descartan. Al entrar en la
  presentación compacta no se muestra ninguno.
- Una pestaña arrastrada (con un dedo tras una pulsación larga, con un puntero de inmediato) se mueve dentro de la barra de pestañas para reordenarla.

Todos los paneles permanecen colocados en ambas presentaciones, de modo que al cambiar se conserva su contenido. El cajón o la hoja mostrados son
propios de la presentación compacta: el `open` de la disposición pertenece a la presentación completa, y presentar o descartar un
cajón no informa ningún `onLayoutChange`, de modo que un área que vuelve a ensancharse muestra los docks exactamente como estaban.
`onDockOpenChange` informa ambos: un dock cuyo `open` de la disposición cambia en la presentación completa, un cajón o una hoja mostrados
o descartados en la compacta, y cada dock cuyo estado de visibilidad cambia cuando cambia la presentación. En
`renderDock`, `open` indica si el dock se muestra en la presentación actual. La disposición sigue siendo el mismo valor,
de modo que un área que cruza los 600 puntos (un plegable que se abre, un iPad que entra en Split View, una ventana o una columna que cambia de tamaño)
mantiene cada panel donde estaba, y la app guarda una sola disposición. El ancho del área decide una vez que está maquetada (el
ancho de la ventana lo sustituye antes de eso), y `compact` elige la presentación en lugar del ancho. Los
cajones, la hoja y el fondo son partes a las que la app da estilo (`drawerClass`, `sheetClass`, `backdropClass`), igual que el
resto del área.

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | ninguno | La disposición mostrada (controlada): devuelve lo que informa `onLayoutChange`. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | un centro vacío | La disposición inicial, cuando no se define `layout`; a partir de entonces el área conserva la suya. |
| `locked` | `.locked(..)` | `boolean` | `false` | Ninguna pestaña se arrastra, se suelta ni se cierra. |
| `compact` | `.compact(..)` | `boolean` | según el ancho | La presentación para teléfono (`true`) o la completa (`false`); sin esta prop, compacta mientras el área sea más estrecha que 600 puntos. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | Lo que permite cada panel, por clave: `closable`, `zoomable`, `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | ninguno | El contenido de un panel, por su clave (`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | la clave | Lo que muestra una pestaña. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | ninguno | Lo que va dentro del indicador de colocación: `group`, `side`, `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | ninguno | La estructura visual propia de un dock, antes de su disposición: `placement`, `open` (se muestra en la presentación actual), `size`, `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | ninguno | Lo que muestra un centro vacío. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | ninguno | Lo que sigue al puntero o al dedo mientras se arrastra una pestaña. |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El marco de cada grupo de pestañas. |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada barra de pestañas (`flex-row` para una fila). |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada pestaña; `selected:` para la que se muestra. |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El marco de contenido de cada grupo, donde se muestran sus paneles. |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador de colocación. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador de cada tirador, entre los grupos de una división y en el borde de cada dock; `group-hover:` y `group-active:` siguen al tirador. Mide 1 punto a lo ancho del tirador y recorre toda su longitud salvo que se indique otra cosa, de modo que `bg-border` es una línea fina en ambos casos; `w-[3px]` / `h-[3px]` la engrosan. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El pulgar de cada tirador: un agarre centrado en la línea, dibujado en vertical como en una línea vertical y girado un cuarto de vuelta en una horizontal, de modo que una sola clase sirve para ambos ejes. Sigue siendo la misma vista mientras el tirador tiene el cursor encima, está pulsado o se arrastra, así que las clases `group-hover:` y `group-active:` lo hacen transitar (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El marco de cada dock. |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Compacta: los cajones de los docks laterales. |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Compacta: la hoja del dock inferior. |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Compacta: el fondo detrás de un cajón o una hoja abiertos, cuya pulsación lo cierra. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para cada tirador, entre los grupos de una división y en el borde de cada dock. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | Los [métodos](#methods) del área. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El área en sí: su tamaño dentro de su padre (`flex-1`) y su fondo. Se mantiene dentro de sus límites y no toma ningún tamaño mínimo de su contenido. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | La disposición cambió (un arrastre, una selección, un redimensionado, un dock abierto o cerrado, un método): `{ layout }`, la nueva disposición completa, con todos sus ids. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: un panel pasó a ser, o dejó de ser, la pestaña mostrada de su grupo (un dock cerrado no muestra ninguna). Una vez por cambio; a un panel que se va no se le avisa con `false`: `onPanelRemove` es su final. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: un panel salió del área para siempre: se cerró, se eliminó o falta en una disposición nueva. Un panel que se mueve nunca lo recibe. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | Un grupo se amplió o se redujo: `{ panel }`, el panel que muestra, o `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: un dock se mostró o se ocultó: cambió su disposición `open` en la presentación completa, se mostró o se descartó su cajón u hoja en la compacta, o cambió la presentación. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada con | Estados |
|---|---|---|---|
| El área | | `class`, `style` | |
| Un grupo de pestañas | una región | `groupClass`, `groupStyle` | |
| Una barra de pestañas | un grupo | `tabBarClass`, `tabBarStyle` | |
| Una pestaña | una barra de pestañas | `tabClass`, `tabStyle`; `renderTab` | `selected:`, `active:`, `hover:` |
| El contenido de un grupo | un grupo | `contentClass`, `contentStyle`; `renderPanel` | |
| El indicador de un tirador | entre los grupos de una división, en el borde de un dock | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| El pulgar de un tirador | centrado en la línea de un tirador | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (pulsado hasta que termina el arrastre) |
| Un dock | un borde | `dockClass`, `dockStyle`; `renderDock` | |
| El indicador de colocación | sobre un grupo durante un arrastre | `dropIndicatorClass`, `dropIndicatorStyle`; `renderDropIndicator` | |
| La vista previa del arrastre | bajo el puntero o el dedo | `renderDragPreview` | |
| El centro vacío | el centro | `renderEmpty` | |
| Un cajón, la hoja, el fondo | sobre el centro, en la presentación compacta | `drawerClass`, `sheetClass`, `backdropClass` (y sus estilos) | |

<a id="accessibility"></a>

## Accesibilidad

- Cada pestaña es una pestaña con su estado de selección para los lectores de pantalla, igual que [`Tab`](./tabs.md), y
  activarla la selecciona. Su etiqueta es el texto que dibuja `renderTab`.
- Cada tirador, entre los grupos de una división y en el borde de cada dock, es un elemento ajustable con la etiqueta
  `handleAccessibilityLabel`. Los tiradores entre los grupos de una división son los de [Resizable](./resizable.md): un lector de pantalla
  los mueve de 10 en 10 puntos, y lo informa con `onLayoutChange`.
- En la presentación compacta, Escape y atrás descartan el cajón o la hoja mostrados.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas de plataforma

- Un puntero (un ratón, un trackpad, un lápiz que flota sobre la pantalla) arrastra una pestaña cuando se mueve 4 puntos
  con el botón pulsado, en todas las plataformas: un iPad con trackpad y una ventana de navegador estrecha manejada con
  el arrastre de un ratón se comportan como un escritorio. En macOS, Windows, Linux y GPUI toda pulsación cuenta como de
  puntero, incluida la de un dedo en un portátil con pantalla táctil.
- Un dedo en iOS, iPadOS y Android arrastra una pestaña tras una pulsación larga, como lo hace el arrastrar y soltar de
  iPadOS, de modo que un deslizamiento sobre la barra de pestañas la desplaza.
- Escritorios y web: los tiradores muestran el cursor de redimensionado de su eje.
- Teléfonos y áreas estrechas: la presentación compacta, con cajones y una hoja inferior.
- Todas las plataformas dibujan lo que la app estiliza: pestañas, barras de pestañas, tiradores, el indicador de colocación, docks, cajones y la hoja.
