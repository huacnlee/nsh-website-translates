---
title: "nsh/desktop"
description: "APIs exclusivas de escritorio: la ventana (título, barra de título, maximizar, pantalla completa), una barra de título propia de la aplicación con regiones arrastrables, el menú de la aplicación, los menús contextuales y los atajos de teclado."
order: 12.5
source_hash: 460c34aa14353d38
---


# nsh/desktop

`nsh/desktop` reúne lo que solo existe en los escritorios: la ventana y su barra de título, el menú de la aplicación y los menús contextuales. Funciona en macOS, Windows y Linux. El código Rust encuentra lo mismo en `nsh_core::element::desktop`: las funciones de la ventana (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), el menú de la aplicación y los menús contextuales (`set_application_menu`, `popup_menu`, formados por `MenuItem`) y marca las vistas arrastrables con `.window_drag(true)`; TSX importa `nsh/desktop`. El módulo puede importarse en todas las plataformas, de modo que un único bundle se ejecuta en todas partes: en iOS y Android sus funciones no hacen nada, y `isAvailable` indica si su ventana y sus menús están disponibles.

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true` donde las API de ventana y menú de este módulo funcionan: macOS, Windows y Linux; `false` en cualquier otro caso. Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) es la comprobación más amplia del comportamiento de escritorio (props `desktop={{…}}`, `platform.select({ desktop })`): también se cumple en navegadores con el idioma de escritorio, que se ejecutan en la ventana propia del navegador. Condiciona el diseño, la densidad y la entrada de escritorio con `platform.desktop`, y las llamadas a `Window` y `Menu` con `isAvailable`.

<a id="window"></a>

## Ventana

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

La columna Rust nombra las funciones de `nsh_core::element::desktop`.

| Miembro | Rust | Descripción |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | El título de la ventana: la barra de título, la barra de tareas o el Dock, el selector de ventanas. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` elimina la barra de título del sistema: la aplicación ocupa la ventana hasta su borde superior y dibuja su propia barra de título. Los controles de ventana del sistema se mantienen (los botones de semáforo de macOS, los botones de minimizar / maximizar / cerrar de Windows, los botones de ventana de GTK). `height` es la altura de tu barra en puntos: los controles se centran en ella (los botones de título de Windows la llenan; en macOS `height` selecciona el chrome compacto hasta 44 puntos y el chrome normal por encima; dimensiona tu barra con la altura real de `titleBar().height`, y AppKit coloca los botones de semáforo durante el redimensionado en vivo. La barra de herramientas existente de una aplicación anfitriona conserva su propio estilo y altura); sin ella, adoptan la altura de la plataforma. `style: "default"` restituye la barra de título del sistema (Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | En Windows y Linux en aplicaciones GPUI, donde la ventana dibuja el menú de la aplicación como una barra sobre la app: `"shown"` (el valor predeterminado) la muestra siempre; `"autoHide"` la muestra después de pulsar y soltar Alt solo, hasta que Alt solo la oculta de nuevo, como en las aplicaciones de Windows y GNOME. F10 y Alt con la inicial de un menú abren un menú en ambos casos, y la barra se muestra mientras está abierto. La barra de menús de macOS es la del sistema. |
| `minimize()` | `minimize()` | Minimiza la ventana. |
| `toggleMaximize()` | `toggle_maximize()` | Maximiza la ventana, o la restaura si ya está maximizada. |
| `toggleFullScreen()` | `toggle_full_screen()` | Entra en pantalla completa o sale de ella. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | Mueve y dimensiona la ventana en puntos; los campos omitidos conservan sus valores. En macOS y Windows, `size` (`width`, `height`) incluye las decoraciones de la ventana; en Linux establece el tamaño predeterminado de ventana de GTK. `origin` (`x`, `y`) es la esquina superior izquierda de la ventana, medida desde la esquina superior izquierda de la pantalla principal (en macOS, la que tiene la barra de menús) con `y` creciendo hacia abajo, igual en todas las plataformas; un `height` sin `y` mantiene el borde superior donde está, de modo que la ventana crece y se encoge por su borde inferior. `animated: true` activa la animación de redimensionado de macOS (por defecto: false). |
| `setLevel(level)` | `set_level(level)` | En macOS y Windows, `"floating"` mantiene la ventana por encima de las ventanas normales y `"normal"` restablece el nivel normal. `"desktopIcon"` selecciona el nivel de los iconos del escritorio de macOS (la ventana además aparece en todos los espacios, fuera de Mission Control y de Cmd+`); en Windows lleva la ventana al fondo del orden z actual, donde una activación posterior puede elevarla. |
| `orderFront()` | `order_front()` | Trae la ventana al frente de su nivel y le da el foco (la aplicación se activa; macOS la restaura del Dock, Windows restaura las ventanas minimizadas y establece el primer plano, GTK la presenta). La ventana conserva su nivel. En macOS, las superficies de nivel de escritorio permanecen detrás de las demás ventanas. GPUI activa su ventana; el gestor de ventanas controla las peticiones de primer plano en Linux. |
| `close()` | `close_window()` | Cierra la ventana; la aplicación termina con ella. |

El dimensionado de ventanas es compatible con macOS, Windows y Linux; el posicionamiento y los niveles, con macOS y Windows. El gestor de ventanas de Linux controla la ubicación y el apilamiento. En aplicaciones GPUI, `setFrame` establece el tamaño de la ventana y la plataforma la coloca; el host de GPUI elige su posición y su nivel al abrir la ventana.

Al dimensionar una ventana a partir de contenido medido con `onLayout`, deja espacio para las decoraciones de la ventana en macOS y Windows. `width` y `height` aceptan números finitos positivos; `x` y `y` aceptan números finitos. Los campos no válidos conservan sus valores anteriores.

<a id="a-title-bar-of-your-own"></a>

## Una barra de título propia

Con la barra de título oculta, la aplicación dibuja su propia barra e indica qué partes de ella mueven la ventana, con `.window_drag(true)` en Rust y `desktop={{ windowDrag: true }}` en TSX:

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

Pulsar una vista con `windowDrag` arrastra la ventana como lo haría la barra de título del sistema: un doble clic la maximiza (o hace lo que haya configurado el usuario: en macOS, "Double-click a window's title bar to"), y en Windows y Linux un clic derecho abre el menú de la ventana.

- Decide la vista más cercana que define `windowDrag`: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) mantiene clicable una parte de una vista arrastrable.
- Los campos de texto y las vistas con manejadores de pulsación o toque (`onPress`, `onTouch*`, responders) dentro de una vista arrastrable siguen siendo clicables sin ello: el campo de búsqueda y los botones del ejemplo anterior funcionan como siempre.
- `windowDrag` también funciona con la barra de título del sistema: una barra lateral o una barra de herramientas también pueden mover la ventana.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

El área de la barra de título oculta, en puntos (reactivo): su `height` y los anchos que ocupan los controles de ventana del sistema en sus extremos `left` y `right`. Organiza tu barra con ella para que nada quede bajo los controles. Los tres valen 0 mientras el sistema muestra su barra de título (y en pantalla completa, y fuera de los escritorios). Rust: `title_bar() -> Edges<Points>`, cuyo `top` es la altura y `left` y `right` los anchos de los controles; leerlo suscribe a los cambios.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, o si no la de la barra de título (28 o 32, según la versión de macOS) | El ancho de los botones de semáforo | 0 |
| Windows | `height`, o si no 32 | 0 | Los tres botones de título (138) |
| Linux | `height`, o si no la de la barra de encabezado | Los botones de ventana del inicio (la disposición de botones del escritorio) | Los botones de ventana del final |

En Windows, los botones de título los dibuja NSH al estilo de Windows 11 y siguen la apariencia de la aplicación; al pasar el cursor sobre el botón de maximizar se muestran los diseños de ajuste (snap layouts) de Windows 11. La ventana conserva sus bordes de redimensionado, su sombra y sus esquinas redondeadas en todas las plataformas.

<a id="menu"></a>

## Menú

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Miembro | Descripción |
|---|---|
| `setApplicationMenu(items)` | Establece el menú de la aplicación: un submenú por cada elemento de nivel superior (`File`, `Edit`, ...). En macOS es la barra de menús, cuyo primer menú es el menú de la aplicación (AppKit lo titula con el nombre de la aplicación). En Windows y Linux es la barra de menús de la ventana, que no se muestra mientras la barra de título está oculta; sus atajos siguen funcionando, y una barra de título propia de la aplicación puede abrir sus menús con `Menu.popup`. `null` restablece el menú predeterminado de la plataforma. |
| `popup(items, at?)` | Muestra un menú contextual con su esquina superior izquierda en `at` (las coordenadas de la ventana, en puntos: el `e.pagePosition` de un `onContextMenu`), o en el puntero. La promesa se resuelve cuando el menú se cierra, se haya elegido un elemento o no: un botón que lo abrió puede permanecer pulsado hasta entonces. |

En Rust, `set_application_menu(items)` recibe un `Vec<MenuItem>` (`None` restablece el menú predeterminado de la plataforma), y `popup_menu(items)` (en el puntero) y `popup_menu_at(items, at)` devuelven un `Answer<()>` que se completa cuando el menú se cierra (esperarlo es opcional). El manejador de un elemento se ejecuta bajo el owner que estableció el menú, mientras ese owner siga vivo.

Llama de nuevo a `setApplicationMenu` para cambiar el menú. Dentro de un `effect` sigue las señales que lee: una marca de verificación o un estado deshabilitado que dependa del estado de la aplicación se mantiene actualizado.

<a id="menu-items"></a>

### Elementos de menú

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| Campo | Descripción |
|---|---|
| `label` | Lo que muestra el elemento. Un elemento con rol tiene su propia etiqueta si no se indica. |
| `onSelect` | Se llama cuando se elige el elemento, con un clic o con su atajo. |
| `shortcut` | Su atajo de teclado: modificadores y una tecla unidos por `+`, como `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` o `"f11"`. Los modificadores están en la tabla siguiente. Las teclas son letras, dígitos y signos de puntuación, escritos como el carácter que la tecla escribe en un teclado estadounidense sin Shift (`,`, `/`; `"shift+/"` para `?`), o un nombre: `plus` (la tecla `=` / `+`, también `=`), `minus` (también `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, las flechas `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. Las mayúsculas y minúsculas no importan (`"Mod+Shift+N"` es `"mod+shift+n"`; una letra mayúscula es la misma tecla, no Shift), y se recomienda usar minúsculas. Un atajo no válido (`"mod-n"`, `"mod++"`, `"mod+?"`) lanza un error que indica la grafía correcta. `keymap` acepta las mismas combinaciones de teclas. Los menús lo muestran en el estilo propio de la plataforma (`⇧⌘N` en macOS, `Ctrl+Shift+N` en Windows). |
| `when` | Cuándo el atajo elige el elemento mientras un campo de texto tiene el foco del teclado, en el backend GPUI: `"always"` (el valor predeterminado), `"auto"` (salvo que el campo use la propia tecla: las teclas que escriben, mueven el cursor o borran, y los atajos de edición, como en los bindings de [`keymap`](./nsh.md#keymap)) o `"notEditing"`. Una tecla que el elemento deja pasar va al campo. |
| `disabled` | `true` atenúa el elemento (por defecto `false`). |
| `checked` | Se establece (a `true` o `false`) para un elemento con marca de verificación. |
| `submenu` | Convierte el elemento en un submenú (necesita un `label`). |
| `role` | Un elemento estándar que ejecuta la plataforma (más abajo). |

Los elementos `null`, `undefined` y `false` se omiten, de modo que `cond && { … }` funciona en una lista.

En Rust, un elemento es `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` o `MenuItem::submenu(label, items)`, con los campos como métodos: `.shortcut("mod+n")` (entra en pánico con un atajo no válido, indicando la grafía correcta), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)`, y `.label(..)` para el elemento de un rol.

Modificadores:

| Modificador | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (también `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (también `command`, `meta`, `super`, `win`) | Command (⌘) | Tecla Windows | Super |
| `ctrl` (también `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (también `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

Usa `mod` para los atajos propios de una aplicación: es la tecla que usan las aplicaciones de cada plataforma para ellos (⌘N en macOS, Ctrl+N en Windows y Linux), así que una sola grafía sirve en todas partes. La tecla Windows y Super pertenecen en su mayoría al sistema (Win+E, la vista de actividades de GNOME), por lo que `cmd` rara vez es adecuado fuera de macOS.

Roles:

| Rol | Hace | Plataformas |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | Los elementos estándar del menú de la aplicación | macOS (se omiten en las demás) |
| `quit` | Cierra la aplicación | Todas |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | Editan el campo de texto enfocado (sus propios atajos siguen siendo suyos) | Todas |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | La ventana | Todas |

Un elemento con rol tiene la etiqueta y el atajo de la plataforma a menos que defina los suyos (macOS añade el nombre de la aplicación a `about`, `hide` y `quit`).

Los atajos de menú tienen prioridad, como en las aplicaciones nativas: una tecla que toma un elemento nunca llega al campo de texto enfocado ni a las teclas propias de NSH. Solo un binding de [`keymap`](./nsh.md#keymap) con la misma combinación de teclas tiene prioridad sobre ellos. Por eso, asigna los atajos de edición (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) únicamente a los roles de edición, que se los pasan al campo de texto, y evita las teclas sin modificador (`escape`, las flechas, las letras), que se las quitarían a los campos de texto y a la navegación hacia atrás. En el backend GPUI, `when: "auto"` permite que un elemento comparta una tecla con los campos de texto: `delete` o `mod+z` eligen el elemento mientras ningún campo tiene el foco y editan el texto mientras uno lo tiene.

En el backend GPUI, un componente nativo con el foco del teclado ve primero cada tecla. Una tecla que gestiona por sí mismo nunca llega al keymap ni al menú. Una tecla que deja pasar llega al keymap como si hubiera un campo de texto enfocado, y después al menú.

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

Un menú contextual, desde la pulsación de un botón:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> Los menús son los del sistema (NSMenu, menús de Win32, menús emergentes de GTK): tienen el aspecto y el comportamiento de los de cualquier otra aplicación, siguen la apariencia del sistema (o de la aplicación) y son accesibles con el teclado. `examples/desktop` es una aplicación con una barra de título propia, un menú de aplicación y menús contextuales.
