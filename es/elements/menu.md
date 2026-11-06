---
title: "Menu"
description: "Menu y ContextMenu con MenuItem, MenuSeparator y Submenu: una ventana emergente con submenús en cascada en equipos de escritorio, una hoja con submenús en el mismo lugar en teléfonos, con el estilo definido por la app."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---


# Menu

Un menú es una lista de acciones que abre su disparador. Una sola estructura sirve para todos los dispositivos, presentada como cada uno espera:

- En los escritorios y en los navegadores de escritorio, un popup junto al disparador; un `Submenu` se despliega en cascada junto a su elemento cuando el puntero pasa sobre él o lo presiona.
- En teléfonos y tablets, una hoja en la parte inferior de la pantalla sobre un fondo; un `Submenu` muestra sus elementos en la hoja en lugar de los del menú, con una fila tuya que lleva de vuelta.

Elegir un elemento, una pulsación fuera, Escape, el botón de retroceso de Android y el gesto de escape de VoiceOver lo cierran. `ContextMenu` es el mismo menú abierto con el botón secundario (un clic derecho) en la posición del puntero, o con un dedo mantenido sobre su disparador en las pantallas táctiles.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

Los cinco provienen de [`nsh/base`](../modules/nsh-base.md). Los elementos llegan a su menú por sí solos, de modo que puedes organizarlos libremente: grupos en vistas, etiquetas, elementos que aparecen y desaparecen con `If`. `popupClass` da estilo al popup en los escritorios y a la hoja en los teléfonos; un estilo que difiera entre ambos puede comparar `platform.idiom` (`nsh`) con `"desktop"`.

<a id="menu-bars"></a>

## Barras de menú

Los menús cuyos disparadores son elementos de un mismo `Toolbar` forman una barra de menú: con uno de sus menús abierto, el puntero sobre el disparador de otro menú abre ese menú en su lugar, y las teclas de flecha se mueven entre los disparadores.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## Menús contextuales

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

En los escritorios, el botón secundario lo abre donde está el puntero. En las pantallas táctiles, un dedo mantenido sobre el disparador lo abre como una hoja; las pulsaciones propias del disparador y las vistas de desplazamiento a su alrededor siguen funcionando, y mover el dedo cancela la pulsación mantenida.

<a id="checkable-items"></a>

## Elementos marcables

`checked` hace que un elemento sea marcable: un ajuste que el menú muestra ("Mostrar barra lateral") o, con `role="menuitemradio"`, una opción de un grupo ("Ordenar por"). El valor es tuyo: al elegir el elemento se llama a `onSelect`, tú estableces el siguiente valor y el elemento lo muestra. Mientras está marcado, se aplican sus clases `checked:` y `checkedStyle`, y también las de su indicador: la parte anterior a su contenido (`indicatorClass`, `indicatorStyle`) que rodea la marca que le das (`indicator`). La marca se crea una sola vez y se conserva; las clases `checked:` del indicador la muestran y la ocultan, o bien las clases `group-checked:` de la propia marca con `group` en `indicatorClass`. `closeOnSelect={false}` mantiene el menú abierto, de modo que un ajuste muestra su nuevo valor de inmediato.

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

Una marca en el borde final va en el contenido, con estilo mediante clases `group-checked:` bajo `group` en el elemento.

<a id="entrance-and-exit"></a>

## Entrada y salida

En los escritorios, el popup aparece y desaparece con tus transiciones, como las de un [Popover](./popover.md#entrance-and-exit): `popupStartingClass` es su aspecto en el primer fotograma, `popupEndingClass` su aspecto una vez cerrado, que conserva mientras se ejecutan las clases `transition-*` de `popupClass`, y a continuación viene `onClose`. Los submenús adoptan los mismos aspectos y se cierran con su menú. La hoja de los teléfonos entra y sale deslizándose por sí sola.

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

<a id="open-state"></a>

## Estado de apertura

Sin `open`, un menú mantiene su propio estado (a partir de `defaultOpen` para `Menu`). Con `open`, la app es su propietaria y lo cambia en `onOpenChange({ open, reason })`: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` o `"longPress"`.

## Props

### Menu

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | ninguno | Abierto, controlado por la app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Abierto al inicio, sin `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Escritorios: el lado del disparador en el que se coloca. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Escritorios: cómo se alinea con el disparador. |
| `offset` | `.offset(..)` | `number` | `0` | Escritorios: el espacio entre el disparador y el popup. |
| `margin` | `.margin(..)` | `number` | `0` | Escritorios: la distancia que mantiene respecto a los bordes del área segura. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El popup (escritorios) o la hoja (teléfonos), y los popups de los submenús. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Escritorios: el aspecto de los popups en su primer fotograma, sobre el suyo propio. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Escritorios: el aspecto de los popups una vez cerrados, conservado mientras se ejecutan sus transiciones. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Teléfonos: el fondo detrás de la hoja. |
| `trigger` | `.trigger(..)` | `JSX.Element` | ninguno | Lo que lo abre al presionarlo. Mientras el menú está abierto, se aplican sus clases `aria-expanded:` y `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los elementos, creados cada vez que se abre. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, los aspectos inicial y final, `backdropClass` / `backdropStyle`, `trigger` y `children` como en `Menu`, y además:

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | El botón secundario y los dedos mantenidos no hacen nada. |
| `offset` | `.offset(..)` | `number` | `0` | Escritorios: el espacio entre el puntero y el popup. |
| `margin` | `.margin(..)` | `number` | `0` | Escritorios: la distancia que mantiene respecto a los bordes del área segura. |

### MenuItem

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | No se puede elegir; se aplican los estilos `disabled:`. |
| `checked` | `.checked(..)` | `boolean` | ninguno | Marcado o no, lo que lo convierte en un elemento marcable; es propiedad de la app. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | ninguno | Su estilo mientras está marcado, como clases `checked:`. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` con `checked`, si no `"menuitem"` | Qué es para los lectores de pantalla; `"menuitemradio"` para una opción de un grupo. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador, la parte anterior a su contenido; sus clases `checked:` y `disabled:` siguen al elemento. |
| `indicator` | `.indicator(..)` | `JSX.Element` | ninguno | La marca dentro del indicador. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | Elegirlo cierra el menú. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla, cuando el contenido no basta. |
| `children`, `class`, `style` | `.child(..)`, métodos de estilo | | ninguno | Su contenido y aspecto, con estados `hover:`, `active:` y `checked:`. |

### Submenu

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | ninguno | El elemento que lo abre. |
| `back` | `.back(..)` | `JSX.Element` | ninguno | Teléfonos: la fila sobre sus elementos que regresa a los elementos que lo rodean. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | No se abre. |
| `offset` | `.offset(..)` | `number` | `0` | Escritorios: el espacio entre el menú que lo rodea y su popup. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Sus elementos. |

`MenuSeparator` es una vista a la que das estilo (`class`, `style`), mostrada junto con los elementos de su nivel.

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | Se abrió o se cerró, con el motivo. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | Se muestra; como hoja, una vez que entró. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | Ya no está: como hoja, una vez que salió; como popup, tras su salida. También cuando la app lo cerró. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | Escritorios: el popup fue colocado: `placement` (el lado en el que se colocó), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | El usuario intentó cerrarlo sin elegir (Escape o retroceso, una pulsación fuera o sobre el fondo). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | Se eligió el elemento; un elemento marcable solicita su otro valor. |

<a id="accessibility"></a>

## Accesibilidad

Para los lectores de pantalla, el popup o la hoja es un menú y sus elementos son elementos de menú; el disparador indica si el menú está expandido. Un elemento marcable es un elemento de menú de tipo casilla o de opción, leído como marcado o no marcado; su indicador forma parte del elemento. En TSX el disparador es el elemento que pasas, un `Button` o una vista propia: recibe por sí mismo las pulsaciones y el estado expandido, de modo que sus propias clases `active:` y `activeStyle` se muestran mientras está presionado, y su propio `onPress` también se ejecuta. Solo los elementos del nivel mostrado están en pantalla, así que los lectores de pantalla leen lo que hay allí.
