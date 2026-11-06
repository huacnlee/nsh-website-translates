---
title: "NavStack"
description: "Pilas de navegación nativas: NavStack, NavPage y createNavStack, cómo apilar y desapilar páginas, slots de la cabecera, cómo salir de una página y cómo cada plataforma muestra una pila."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---


# NavStack

Una pila de navegación muestra una página a la vez y conserva las páginas que quedan debajo: `UINavigationController` en iOS y Mac
Catalyst, con el encabezado del sistema y el gesto de deslizar para volver, y una pila de páginas con barra de herramientas y retroceso predictivo en Android.
En los escritorios (macOS, Windows, Linux, GPUI) y en la web, cada página muestra el encabezado propio de la app en la parte superior, y las
teclas de retroceso y el botón de retroceso del navegador quitan la página. `NavStack` es la pila y `NavPage` una de sus páginas.

La pila se encarga del comportamiento de navegación (transiciones, gestos y botones de retroceso, el estado de las páginas mientras están cubiertas); el contenido de las páginas y el encabezado de escritorio son de la app.

```rust tabs
use nsh_base::{button, nav_page, nav_stack};
use nsh_core::prelude::*;

/// A button with the app's look.
fn action(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text(title).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// The header on the desktops and the web, with a back button over the first page.
fn bar(title: impl Into<SharedString>, routes: Signal<Vec<u32>>) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .px_4()
        .py_3()
        .border_b_1()
        .border_color(rgb(0xe5e5e5))
        .child(when(
            move || !routes.with(Vec::is_empty),
            move || {
                action("Back", move || {
                    routes.update(|r| {
                        r.pop();
                    })
                })
            },
        ))
        .child(text(title.into()).text_lg().font_weight(FontWeight::SEMIBOLD))
}

fn app() -> impl IntoElement {
    // The messages pushed over the inbox, bottom to top.
    let routes = signal(Vec::<u32>::new());
    nav_stack()
        .flex_1()
        .child(
            nav_page()
                .title("Inbox")
                .header(bar("Inbox", routes))
                .child(view().flex_1().p_4().child(action("Open message 1", move || {
                    routes.update(|r| r.push(1))
                }))),
        )
        .child(each(
            move || routes.get(),
            |id: &u32| *id,
            move |id, depth| {
                let title: SharedString = format!("Message {}", id.get_untracked()).into();
                nav_page()
                    .title(title.clone())
                    .header(bar(title, routes))
                    // The user went back natively: this page and those above it are gone.
                    .on_dismiss(move || routes.update(|r| r.truncate(depth.get_untracked())))
                    .child(view().flex_1().p_4().child(text("The message.")))
            },
        ))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { Button, createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "home" } | { name: "detail"; id: number };

const nav = createNavStack<Route>([{ name: "home" }]);

function Action(props: { title: string; onPress: () => void }) {
  return (
    <Button onPress={props.onPress} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center text-base font-semibold text-white">{props.title}</Text>
    </Button>
  );
}

function Bar(props: { title: string }) {
  return (
    <View class="flex-row items-center gap-3 border-b border-neutral-200 px-4 py-3">
      {nav.routes().length > 1 && <Action title="Back" onPress={() => nav.pop()} />}
      <Text class="text-lg font-semibold">{props.title}</Text>
    </View>
  );
}

function Home() {
  return (
    <NavPage title="Inbox" header={<Bar title="Inbox" />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Action title="Open message 1" onPress={() => nav.push({ name: "detail", id: 1 })} />
      </View>
    </NavPage>
  );
}

function Detail(props: { id: number }) {
  const title = `Message ${props.id}`;
  return (
    <NavPage title={title} header={<Bar title={title} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The message.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => (route.name === "home" ? <Home /> : <Detail id={route.id} />)}
    </NavStack>
  );
}

mount(App);
```

En iOS y Android la página muestra el encabezado del sistema con `title` y un botón de retroceso; en los escritorios y en la web
muestra `header`. Una app que solo apunta a teléfonos omite `header`; una que solo apunta a escritorios omite las opciones del
encabezado del sistema. La [Guía de navegación](../docs/navigation.md) recorre la navegación de una app completa: el estado de la
pila, los diálogos, el botón de retroceso de Android y las pestañas.

<a id="how-a-stack-works"></a>

## Cómo funciona una pila

- Las páginas de la pila son **rutas**: valores que tú eliges, desde la base de la pila hasta la cima. Una ruta suele
  nombrar la página y llevar sus parámetros.
- En TSX las rutas viven en el estado que crea `createNavStack`. `NavStack` llama a su función hija una vez por cada push
  y muestra el resultado como una página. Mantiene esa página mientras su ruta esté en la pila, de modo que una página conserva su estado
  (señales, posición de scroll, campos de entrada) mientras otras páginas la cubren.
- En Rust los hijos de la pila son sus páginas: un `nav_page()` puesto en `nav_stack()` se apila, y uno que se deja fuera se
  quita. Guarda las rutas en una señal y renderiza las páginas con `each(..)`, con clave por ruta, para que las páginas de abajo conserven
  su estado.
- Cada push es una página propia, incluido el mismo valor de ruta apilado dos veces.
- Cuando el usuario sale de una página de forma nativa (el botón de retroceso, deslizar para volver, el retroceso de Android, las teclas de retroceso de los escritorios, el
  retroceso del navegador), la página se va. En TSX la pila quita su ruta del estado, de modo que `nav.routes()` siempre coincide
  con lo que ve el usuario. En Rust la página informa `on_dismiss`, donde eliminas su ruta (y las rutas que están encima).
- En TSX, una función hija que devuelve algo distinto de un `<NavPage>` obtiene una página con las opciones por defecto. Devuelve
  un `<NavPage>` para definir su encabezado y otras opciones.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

Crea el estado de una pila que empieza con `routes`, de la base a la cima. Créalo una sola vez, por ejemplo a nivel de módulo,
y pásalo a `<NavStack state>`. Cualquier código puede importarlo para navegar.

| Miembro | Descripción |
|---|---|
| `routes: Accessor<readonly R[]>` | Las rutas, de la base a la cima. Reactivo. |
| `push(route: R): void` | Apila una página. |
| `pop(count?: number): void` | Quita `count` páginas (1 por defecto). Siempre queda al menos una página. |
| `popToRoot(): void` | Vuelve a la primera página. |
| `replace(route: R): void` | Reemplaza la página superior. |
| `setRoutes(routes: R[]): void` | Reemplaza las páginas; una ruta que permanece (el mismo valor) conserva su página y su estado. |
| `remove(route: R): void` | Quita la página más alta de `route` (comparada con `===`), esté donde esté en la pila. |

En Rust las mismas operaciones son cambios de tu señal de rutas: `routes.update(|r| r.push(route))` apila,
`r.pop()` quita, `r.truncate(1)` vuelve a la primera página que conservas en ella, y `routes.set(..)` reemplaza las páginas.

```rust tabs
routes.update(|r| r.push(7));
routes.update(|r| r.truncate(r.len().saturating_sub(2)));
routes.set(vec![1, 2]);
let depth = move || routes.with(Vec::len);
```

```tsx tabs
nav.push({ name: "detail", id: 7 });
nav.pop(2);
nav.setRoutes([{ name: "home" }, { name: "detail", id: 1 }]);
const depth = () => nav.routes().length;
```

<a id="navstack-props"></a>

## Props de NavStack

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `state` | las páginas son sus hijos | `NavStackState<R>` | El estado que contiene las rutas (`createNavStack`). Obligatoria. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | Renderiza una ruta. Devuelve un `<NavPage>` para sus opciones. Obligatoria. |
| `style`, `class` | métodos de estilo | | El estilo de la pila; normalmente `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | Localiza la pila en las pruebas y en `nsh test --trace`. |

La función hija de TSX recibe el propio valor de la ruta y un accesor de su posición en la pila.

<a id="navpage-props"></a>

## Props de NavPage

`NavPage` es una página de una pila. Contiene el contenido de la página, su `header` en los escritorios y en la web, y las
opciones del encabezado del sistema en iOS y Android. En Rust, `nav_page()` devuelve la página y sus métodos de construcción son
los nombres de las props en snake-case.

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | ninguno | Escritorios y web: el encabezado de la página, colocado en la parte superior, tan ancho como la página y tan alto como resulte de su layout, con el contenido debajo. |
| `title` | `.title(..)` | `string` | ninguno | iOS y Android: el título del encabezado del sistema. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS y Android: se muestra el encabezado del sistema. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS y Android: el contenido se extiende bajo un encabezado del sistema transparente. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: la barra de pestañas del sistema se retira mientras esta página está en la cima, moviéndose con la transición (la misma animación que la página), y la barra nunca se reconstruye; vuelve cuando la página se quita. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: un título grande que se reduce hacia la barra a medida que el contenido se desplaza; el contenido se desplaza bajo el encabezado. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | ninguno | iOS y Android: la etiqueta del botón de retroceso que lleva de vuelta a esta página (en Android, su descripción para lectores de pantalla). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS y Android: se muestra el botón de retroceso. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | ninguno | iOS y Android: contenido en el borde inicial del encabezado del sistema, en lugar del botón de retroceso. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | ninguno | iOS y Android: contenido en el borde final del encabezado del sistema. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | ninguno | iOS y Android: contenido que reemplaza al título. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | plataforma | iOS y Android: los colores del encabezado del sistema: su fondo, los del título (`color`) y los de los botones (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | ninguno | Los mismos colores como clases: `bg-*`, `text-*` para el título, `tint-*` para los botones (en Rust `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, colores del tema que siguen la apariencia). `headerStyle` tiene prioridad sobre ellas. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | Los botones de retroceso y el gesto de deslizar para volver quitan la página. Consulta [Salir de una página](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | El gesto de retroceso interactivo quita la página: deslizar para volver en iOS, retroceso predictivo de Android que sigue el dedo. Los botones de retroceso la quitan en cualquier caso. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Cómo entra y sale la página. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | ninguno | La página entra y sale mediante un shader WGSL en lugar de su `animation`: `shade(uv)` lee la página de abajo como `sample_from` y esta página como `sample_to` mientras `nsh.progress` va de 0 a 1 durante `duration` milisegundos (350 por defecto), y de 1 a 0 cuando la página sale. Cuando el sistema pide menos movimiento, la página usa su propio `animation`. Consulta [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | ninguno | iOS y Android: la barra de estado mientras la página está en la cima. Consulta [Barra de estado](../modules/nsh-base.md#status-bar). |
| `style`, `class` | métodos de estilo | | ninguno | El estilo de la página. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido. |
| `testID` | `.test_id(..)` | `string` | ninguno | Localiza la página en las pruebas y en `nsh test --trace`. |

<a id="navpage-events"></a>

## Eventos de NavPage

| Evento | Rust | Descripción |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | El usuario pulsó retroceso en la página (el botón de retroceso del encabezado, el retroceso de Android, Escape, Alt+Izquierda o el botón de retroceso de un ratón en los escritorios, el retroceso del navegador), tanto si `popOnBack` permitió quitarla como si no. |
| `onDismiss` | `.on_dismiss(..)` | El usuario quitó la página (botón de retroceso, deslizamiento); su ruta desaparece en TSX, y Rust la elimina aquí. |

<a id="header-slots"></a>

## Slots del encabezado

`header`, `headerLeft`, `headerRight` y `headerTitle` son slots: elementos normales que leen señales, gestionan pulsaciones
y se actualizan mientras la página se muestra. `header` es el encabezado completo de la app en los escritorios y en la web; los otros tres
van en el encabezado del sistema en iOS y Android.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn profile(edit: impl Fn() + 'static) -> Screen {
    nav_page()
        .title("Profile")
        .header(profile_bar())
        .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(white()).tint_color(white()))
        .header_right(text("Edit").text_color(white()).on_press(move || edit()))
        .child(scroll().flex_1())
}
```

```tsx tabs
<NavPage
  title="Profile"
  header={<ProfileBar />}
  headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}
  headerRight={<Text onPress={edit} style={{ color: "#ffffff", fontSize: 17 }}>Edit</Text>}
>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

El contenido de la página empieza debajo del encabezado: debajo de un encabezado del sistema opaco en iOS y Android, debajo de `header` en los
escritorios y en la web. Con `headerTransparent`, `headerLargeTitle` o `headerVisible={false}`, empieza en la parte superior de
la página en iOS y Android; usa [`env(safe-area-inset-top)`](./safe-area.md) o `safeAreaInsets()` para mantenerlo despejado del
encabezado y de la barra de estado.

En iOS, `headerVisible={false}` mantiene activado el gesto de deslizar para volver mientras `popOnSwipe` y `popOnBack` sean verdaderos.
Un gesto de retroceso interactivo aceptado finaliza la edición cuando empieza la transición, por lo que el teclado se cierra durante el
arrastre. Si se cancela la transición, se restaura el foco del mismo editor cuando otro control no lo ha tomado.

```rust tabs
nav_page()
    .title("Large title")
    .header_large_title(true)
    .child(scroll().flex_1())
```

```tsx tabs
<NavPage title="Large title" headerLargeTitle>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

<a id="leaving-a-page"></a>

## Salir de una página

`popOnBack={false}` mantiene al usuario en una página, por ejemplo mientras un formulario tiene cambios sin guardar. Mientras es falso, deslizar para volver
está desactivado y los botones y teclas de retroceso llaman a `onBackPress` sin quitar la página. Pregunta al usuario y luego quítala tú mismo:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<u32>>) -> Screen {
    let note = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| {
                    r.pop();
                });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || note.with(String::is_empty))
        .on_back_press(move || {
            if !note.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(note)
                .on_change(move |v: &str| note.set(v.to_owned()))
                .placeholder("A note"),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Discard your changes?",
      actions: [
        { label: "Keep editing", role: "cancel", id: "keep" },
        { label: "Discard", role: "destructive", id: "discard" },
      ],
    });
    if (action === "discard") nav.pop();
  };
  return (
    <NavPage title="Edit" popOnBack={text().length === 0} onBackPress={() => text().length > 0 && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" />
    </NavPage>
  );
}
```

> [!IMPORTANT]
> El sistema pregunta si el usuario puede volver en el hilo principal, en el momento en que el usuario actúa, y el hilo principal
> nunca espera a JS ni a tu código Rust. Por eso NSH responde con el valor de `popOnBack` que ya está montado. Define
> `popOnBack={false}` en cuanto haya algo que perder, antes de que el usuario vuelva atrás.

`onBackPress` se llama en cada pulsación de retroceso, también cuando la página se quita, así que además te indica que el usuario volvió atrás.
Para desactivar solo el gesto de deslizamiento y mantener los botones de retroceso, usa `popOnSwipe={false}`. La confirmación en sí es un
[AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: `UINavigationController` con el encabezado del sistema, botón de retroceso y deslizar para volver; `headerLargeTitle` es el
  título grande de UIKit. Los cambios en la pila que llegan durante una transición en curso se aplican cuando esta termina.
- **Android**: una pila con barra de herramientas. El botón de retroceso del sistema quita la página superior, con retroceso predictivo en las versiones
  de Android que lo incluyen; la descripción de la flecha hacia arriba para lectores de pantalla es el `headerBackTitle` de la página inferior, o la
  del sistema. Consulta `BackHandler` en [`BackHandler`](../modules/nsh-mobile.md#backhandler) para gestionar tú mismo el botón de retroceso.
- **Mac Catalyst**: igual que en iOS.
- **Escritorios (macOS, Windows, Linux, GPUI) y web**: cada página muestra su `header` en la parte superior y su contenido
  debajo. Escape, Alt+Izquierda y el botón de retroceso de un ratón vuelven atrás en los escritorios, y el botón de retroceso del navegador en la web.

Para el contenido que se muestra sobre la pila y su encabezado, como una hoja o un flujo de pantalla completa, usa un
[Dialog](./dialog.md).
