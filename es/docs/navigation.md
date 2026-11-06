---
title: "Navegación"
description: "Pilas de navegación nativas con createNavStack, NavStack y NavPage, encabezados en todas las plataformas, cómo mantener al usuario en una página con popOnBack, diálogos y el botón Atrás de Android."
order: 41
group: ui
source_hash: f7722b75b9e46970
---


# Navegación

`nsh_base` (TSX: `nsh/base`) ofrece una pila de navegación nativa y diálogos nativos. Una pila de navegación (`nav_stack()` en Rust, `NavStack` en TSX) es un UINavigationController en iOS, con su encabezado, el gesto de deslizar para volver y los títulos grandes, y una pila con barra de herramientas y back predictivo en Android; en los escritorios y en la web, cada página muestra el encabezado que dibuja tu app. Tú guardas las rutas en tu estado; la pila renderiza cada ruta como una página y la mantiene montada, con su estado, mientras esté en la pila.

En Rust, importa los builders por nombre junto al prelude (`use nsh_base::{dialog, nav_page, nav_stack};`; las alertas del sistema son `nsh_base::alert_dialog()`). Las rutas son una signal y los hijos de la pila son sus páginas, una por ruta, identificadas por clave (`each`): para hacer push se añade una página y para hacer pop se quita. En TSX, `createNavStack` contiene las rutas y `NavStack` las renderiza.

```rust tabs
use nsh_base::{nav_page, nav_stack};
use nsh_core::prelude::*;

#[derive(Debug, Clone, PartialEq)]
enum Route {
    Inbox,
    Message(u32),
}

/// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
fn header(routes: Signal<Vec<Route>>, title: &'static str) -> impl IntoElement {
    view()
        .h(px(48.0))
        .flex_row()
        .items_center()
        .gap_3()
        .border_b_1()
        .border_color(rgb(0xe5e7eb))
        .px_4()
        .child(when(
            move || routes.with(|r| r.len() > 1),
            move || {
                text("Back")
                    .role(AccessibilityRole::Button)
                    .on_press(move || routes.update(|r| { r.pop(); }))
                    .text_color(rgb(0x2563eb))
                    .active(|s| s.opacity(0.6))
            },
        ))
        .child(text(title).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
}

fn inbox(routes: Signal<Vec<Route>>) -> Screen {
    nav_page()
        .title("Inbox")
        .header(header(routes, "Inbox"))
        .child(scroll().flex_1().children((1..=5).map(move |id| {
            view()
                .on_press(move || routes.update(|r| r.push(Route::Message(id))))
                .p_4()
                .active(|s| s.bg(rgb(0xf3f4f6)))
                .child(text(format!("Message {id}")))
        })))
}

fn message(routes: Signal<Vec<Route>>, id: u32) -> Screen {
    nav_page()
        .title(format!("Message {id}"))
        .header(header(routes, "Message"))
        .child(view().flex_1().p(px(16.0)).child(text(format!("The body of message {id}."))))
}

#[component]
pub fn App() -> impl IntoElement {
    let routes = signal(vec![Route::Inbox]);
    nav_stack().flex_1().child(each(
        move || routes.get(),
        |route: &Route| format!("{route:?}"),
        move |route, index| {
            let page = match route.get_untracked() {
                Route::Inbox => inbox(routes),
                Route::Message(id) => message(routes, id),
            };
            // The user went back natively: drop the route (and those above it).
            page.on_dismiss(move || routes.update(|r| r.truncate(index.get_untracked())))
        },
    ))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "inbox" } | { name: "message"; id: number };

const nav = createNavStack<Route>([{ name: "inbox" }]);

// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
function Header(props: { title: string }) {
  return (
    <View class="h-12 flex-row items-center gap-3 border-b border-gray-200 px-4">
      <If when={nav.routes().length > 1}>
        <Text role="button" onPress={() => nav.pop()} class="text-blue-600 active:opacity-60">
          Back
        </Text>
      </If>
      <Text style={{ fontSize: 17, fontWeight: "600" }}>{props.title}</Text>
    </View>
  );
}

function Inbox() {
  return (
    <NavPage title="Inbox" header={<Header title="Inbox" />}>
      <Scroll style={{ flex: 1 }}>
        <Each of={[1, 2, 3, 4, 5]}>
          {(id) => (
            <View onPress={() => nav.push({ name: "message", id: id() })} class="p-4 active:bg-gray-100">
              <Text>Message {id()}</Text>
            </View>
          )}
        </Each>
      </Scroll>
    </NavPage>
  );
}

function Message(props: { id: number }) {
  return (
    <NavPage title={`Message ${props.id}`} header={<Header title={`Message ${props.id}`} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The body of message {props.id}.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => {
        switch (route.name) {
          case "inbox":
            return <Inbox />;
          case "message":
            return <Message id={route.id} />;
        }
      }}
    </NavStack>
  );
}

mount(App);
```

<a id="the-stacks-state"></a>

## El estado de la pila

En Rust, las rutas son tu propia signal (`signal(vec![..])`, o `global::<Routes>()` para una a la que accede toda la app), y haces push, pop y replace actualizándola: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. La clave de cada página (aquí el texto `Debug` de la ruta) le dice a la pila qué página es cuál, de modo que las páginas cuya ruta permanece conservan su estado; da una clave única a las rutas que puedan repetirse. Gestiona el `on_dismiss` de cada página: el usuario volvió atrás de forma nativa, y la ruta (junto con las que están encima) sale de tu signal.

En TSX, `createNavStack(routes)` crea el estado de la pila a partir de un array de rutas, de abajo hacia arriba. Una ruta es cualquier valor que quieras (una cadena, un objeto, una unión discriminada como la anterior), y cada push es una página propia, incluida la misma ruta empujada dos veces. Crea el estado una sola vez, a nivel de módulo o en tu componente raíz, e impórtalo donde las páginas naveguen.

| Miembro | Descripción |
|---|---|
| `routes()` | Las rutas, de abajo hacia arriba (reactivo). |
| `push(route)` | Empuja una página. |
| `pop(count?)` | Quita `count` páginas (1 por defecto); siempre queda al menos una. |
| `popToRoot()` | Vuelve a la primera página. |
| `replace(route)` | Reemplaza la página superior. |
| `setRoutes(routes)` | Reemplaza las páginas, p. ej. tras iniciar sesión; una ruta que permanece (el mismo valor) conserva su página y su estado. |
| `remove(route)` | Quita la página más alta de `route`, esté donde esté. |

Para empezar con varias páginas de profundidad, pasa más rutas: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

Cuando el usuario sale de una página de forma nativa (el botón atrás del encabezado, deslizar para volver en iOS, el botón o gesto atrás de Android, las teclas y el botón del ratón de atrás en los escritorios, el botón atrás del navegador), la pila de TSX quita esa ruta de su estado por ti, así que `routes()` siempre coincide con lo que hay en pantalla; una página de Rust lo notifica con `on_dismiss`, como se vio antes.

Una ruta lleva lo que la página necesita. Las apps de galería empujan rutas que contienen lo que construye la página, lo que mantiene pequeño el tipo de ruta cuando hay muchas páginas:

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

/// A pushed page: its key (unique in the stack) and what makes it.
#[derive(Clone)]
pub struct Route {
    pub key: SharedString,
    pub page: Rc<dyn Fn() -> Screen>,
}

impl PartialEq for Route {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
}

/// The pushed pages, bottom to top: one signal for the whole app.
#[derive(Default, Clone)]
pub struct Routes(pub Vec<Route>);

pub fn routes() -> Signal<Routes> {
    global::<Routes>()
}

// Elsewhere: routes().update(|r| r.0.push(Route { key: "settings".into(), page: Rc::new(settings) }));
```

```ts tabs
import { type JSX } from "nsh";
import { createNavStack } from "nsh/base";

export type Route = { name: "home" } | { name: "page"; page: () => JSX.Element };
export const nav = createNavStack<Route>([{ name: "home" }]);

// Elsewhere: nav.push({ name: "page", page: Settings });
```

## NavStack

En Rust, `nav_stack()` es una vista cuyos hijos son sus páginas, de abajo hacia arriba; se le aplica estilo como a cualquier vista (`.flex_1()`). En TSX:

| Prop | Tipo | Descripción |
|---|---|---|
| `state` | `NavStackState<R>` | Las rutas que se muestran. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | Renderiza una ruta; devuelve un `<NavPage>` para su encabezado. |
| `style`, `class` | | El estilo propio de la pila (normalmente `flex: 1`). |

La función de render se ejecuta una vez por ruta, cuando se empuja; `route` es el valor simple y `index()` su posición actual. Lo que devuelve se convierte en el contenido de la página. Devuelve un `<NavPage>` para configurar el encabezado; cualquier otra cosa se envuelve en una página con las opciones por defecto.

Las páginas permanecen montadas mientras su ruta esté en la pila: al volver atrás se muestra la página anterior exactamente como se dejó, con su posición de scroll, sus inputs y sus signals. Los handlers de [`cleanup`](./reactivity.md) de una página se ejecutan cuando su ruta sale de la pila.

<a id="navpage-and-the-header"></a>

## NavPage y el encabezado

Una página (`nav_page()` en Rust, `NavPage` en TSX) envuelve el contenido de una página y lleva su encabezado. iOS y Android muestran su encabezado del sistema, configurado con el título y las opciones de encabezado. Los escritorios y la web muestran el slot de encabezado de la página (`.header(..)`, en TSX `header`), con tus propias vistas, en la parte superior de la página: tan ancho como la página, tan alto como resulte de su layout, con el contenido debajo. Dale a una página ambos, como hace el ejemplo anterior, y se verá natural en todas partes. Todas las opciones son reactivas: cambia una signal y el encabezado la sigue.

En Rust, cada prop de abajo es un método de `nav_page()` en snake case: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`; sus hijos son su contenido.

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `header` | `JSX.Element` | | Escritorios y web: el encabezado de la página, dibujado por la app (un título, un botón atrás, botones de barra de herramientas). |
| `title` | `string` | | iOS y Android: el título del encabezado del sistema. |
| `headerVisible` | `boolean` | `true` | iOS y Android: se muestra el encabezado del sistema. |
| `headerTransparent` | `boolean` | `false` | iOS y Android: el contenido se extiende bajo el encabezado. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS y Android: el fondo del encabezado, el color del título (`color`) y el de los botones (`tintColor`). |
| `headerClass` | `string` | | Lo mismo que classes: `bg-*`, `text-*` para el título, `tint-*` para los botones; `headerStyle` tiene prioridad sobre ellos. |
| `headerBackVisible` | `boolean` | `true` | iOS y Android: se muestra el botón atrás. |
| `headerLeft` | `JSX.Element` | | iOS y Android: vistas al inicio del encabezado (reemplazan el botón atrás). |
| `headerRight` | `JSX.Element` | | iOS y Android: vistas al final del encabezado. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: el propio botón de barra de UIKit al final del encabezado, con el aspecto, símbolo o etiqueta del sistema, en lugar de las vistas de `headerRight`; una pulsación sobre él es una pulsación sobre la primera vista pulsable de `headerRight`, así que mantén una ahí. Android muestra `headerRight` tal cual. |
| `ios={{ headerLeftSystemItem }}` | igual que `headerRightSystemItem` | | iOS: lo mismo, al inicio del encabezado, pulsando `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: el propio botón de barra de UIKit que muestra el SF Symbol con ese nombre (`"slider.horizontal.3"`) en lugar de las vistas de `headerRight`; una pulsación sobre él es una pulsación sobre la primera vista pulsable de `headerRight`, y VoiceOver lee la etiqueta de esa vista. `headerRightSystemItem` tiene prioridad sobre él; un nombre que SF Symbols no tiene muestra `headerRight` tal cual. Android muestra `headerRight` tal cual. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: lo mismo, al inicio del encabezado, pulsando `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS y Android: vistas que reemplazan el título. |
| `headerLargeTitle` | `boolean` | `false` | iOS: un título grande que se reduce hasta la barra al desplazar el contenido. |
| `headerBackTitle` | `string` | | La etiqueta del botón atrás que lleva de vuelta a esta página (iOS; la flecha de subir de Android se la indica a los lectores de pantalla). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Cómo entra y sale la página. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS y Android: la barra de estado mientras la página está arriba ([Status bar](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | El gesto interactivo de volver (deslizar para volver en iOS, back predictivo en Android) hace pop. Los botones atrás hacen pop en cualquier caso. |
| `popOnBack` | `boolean` | `true` | Toda forma de volver atrás hace pop de la página: los botones atrás, el atrás de Android, las teclas de atrás de los escritorios, el botón atrás del navegador y el deslizamiento. |
| `onBackPress` | `() => void` | | El usuario pulsó atrás en la página, haya permitido `popOnBack` el pop o no. |
| `onDismiss` | `() => void` | | El usuario hizo pop de la página; su ruta ya se ha quitado. |
| `style`, `class` | | | La vista de contenido de la página. |

Los elementos del encabezado son vistas normales, así que pueden ser pulsables y reactivos:

```rust tabs
fn compose(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let cancel = move || {
        text("Cancel")
            .on_press(move || routes.update(|r| { r.pop(); }))
            .text_size(px(17.0))
            .text_color(rgb(0x0969da))
    };
    let send_button = move || {
        text("Send")
            .on_press(move || send(draft.get()))
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(move || if draft.with(String::is_empty) { rgb(0x8c959f) } else { rgb(0x0969da) })
    };
    nav_page()
        .title("New message")
        .header_left(cancel())
        .header_right(send_button())
        .header(
            view()
                .h(px(48.0))
                .flex_row()
                .items_center()
                .justify_between()
                .px_4()
                .child(cancel())
                .child(text("New message").text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
                .child(send_button()),
        )
        .child(
            input()
                .multiline(true)
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .flex_1()
                .p(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
function Compose() {
  const text = signal("");
  const cancel = () => (
    <Text onPress={() => nav.pop()} style={{ fontSize: 17, color: "#0969da" }}>
      Cancel
    </Text>
  );
  const sendButton = () => (
    <Text
      onPress={() => send(text())}
      style={{ fontSize: 17, fontWeight: "600", color: text() ? "#0969da" : "#8c959f" }}
    >
      Send
    </Text>
  );
  return (
    <NavPage
      title="New message"
      headerLeft={cancel()}
      headerRight={sendButton()}
      header={
        <View class="h-12 flex-row items-center justify-between px-4">
          {cancel()}
          <Text style={{ fontSize: 17, fontWeight: "600" }}>New message</Text>
          {sendButton()}
        </View>
      }
    >
      <Input multiline value={text()} onChange={({ value }) => text.set(value)} style={{ flex: 1, padding: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

Un encabezado del sistema con color (en Rust, `header_style_with` admite estilos tipados: `bg`, `text_color` y `tint_color`, el color de los botones del encabezado; los colores del tema siguen la apariencia):

```rust tabs
nav_page()
    .title("Profile")
    .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(rgb(0xffffff)).tint_color(rgb(0xffffff)))
```

```tsx tabs
<NavPage title="Profile" headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}>
  …
</NavPage>
```

Una página que no muestra encabezado sigue teniendo las barras del sistema a su alrededor; aplica padding a su contenido según los insets del [safe area](../elements/safe-area.md):

```rust tabs
use nsh_base::nav_page;

nav_page()
    .header_visible(false)
    .child(view().flex_1().p_safe_area() /* … */)
```

```tsx tabs
<NavPage headerVisible={false}>
  <View class="flex-1 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)] px-4">…</View>
</NavPage>
```

<a id="safe-areas-under-the-header"></a>

### Áreas seguras bajo el encabezado

Dentro de una página, las variables `env(safe-area-inset-*)` y los insets de la página (`Scope::insets` en Rust, `safeAreaInsets()` en TSX) son los que quedan bajo el encabezado del sistema, dentro de la página. Con un encabezado transparente, el contenido empieza en la parte superior de la página y el inset superior es la altura del encabezado, así que aplicar padding con `env(safe-area-inset-top)` mantiene el texto despejado mientras una imagen de fondo llena toda la página. Con un título grande, coloca una vista de scroll directamente en la página para que el título pueda contraerse al desplazar. En los escritorios y en la web, el contenido empieza debajo del slot de encabezado de la página.

<a id="keeping-the-user-on-a-page-poponback"></a>

## Mantener al usuario en una página: popOnBack

Para preguntar antes de descartar cambios sin guardar, establece `pop_on_back` (TSX `popOnBack`) en false mientras haya algo que perder, gestiona la pulsación de atrás (`.on_back_press(..)`, TSX `onBackPress`) y haz pop cuando el usuario acepte:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| { r.pop(); });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || draft.with(String::is_empty))
        .on_back_press(move || {
            if !draft.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .placeholder("A note")
                .m(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const dirty = () => text().length > 0;
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
    <NavPage title="Edit" popOnBack={!dirty()} onBackPress={() => dirty() && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" style={{ margin: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

Con `pop_on_back(false)` (`popOnBack={false}`), la página permanece con cualquier forma de volver atrás (los botones atrás, el botón y gesto atrás de Android, las teclas de atrás de los escritorios, el botón atrás del navegador, el deslizamiento), y el evento de pulsación de atrás te avisa de que el usuario lo intentó. Hacer pop desde código (quitar la ruta, `nav.pop()`) hace pop como siempre.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` es una prop, no un callback que devuelve true o false, porque el hilo principal nunca espera al código de la app. Cuando el usuario empieza un deslizamiento o pulsa atrás, el sistema pregunta de inmediato si la página puede irse, y NSH responde de forma nativa a partir de las props que ya tiene. Establécela en cuanto haya algo que perder (como arriba, a partir del texto), antes de que el usuario intente salir.

`pop_on_swipe(false)` (`popOnSwipe={false}`) es la opción más ligera: desactiva solo el gesto interactivo (deslizar para volver en iOS, la animación de back predictivo de Android), y los botones atrás siguen haciendo pop.

<a id="dialogs"></a>

## Diálogos

Un diálogo (`dialog()` de `nsh_base` en Rust, `Dialog` en TSX) presenta contenido por encima de todo lo demás, en su propia capa de ventana nativa: un view controller presentado en iOS, una ventana de diálogo en Android, una capa sobre toda la ventana en los escritorios y en la web. Su aspecto es tuyo. En Rust, el diálogo se presenta mientras está en la vista (dentro de un `when`) y sus hijos lo llenan: dibuja el fondo y el popup como vistas. En TSX, `class` y `style` dan estilo al popup que contiene a sus hijos, `backdropClass` o `backdropStyle` añaden un fondo detrás de él, y `open` lo controla:

```rust tabs
use nsh_base::dialog;
use nsh_core::prelude::*;

pub fn files() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .child(view().on_press(move || open.set(true)).p(px(16.0)).child(text("Delete the file")))
        .child(when(
            move || open.get(),
            move || {
                dialog()
                    .animation(ModalAnimation::Fade)
                    // Escape, Android's back button, a swipe down on a sheet.
                    .on_cancel(move || open.set(false))
                    .child(
                        // The backdrop and the popup are the app's views.
                        view()
                            .flex_1()
                            .bg(rgba(0x00000066))
                            .items_center()
                            .justify_center()
                            .on_press(move || open.set(false))
                            .child(
                                view()
                                    .w(px(320.0))
                                    .gap_3()
                                    .rounded_2xl()
                                    .bg(white())
                                    .p_5()
                                    .on_press(|| {})
                                    .child(text("Delete the file?").text_size(px(20.0)).font_weight(FontWeight::BOLD))
                                    .child(
                                        view()
                                            .on_press(move || open.set(false))
                                            .child(text("Delete").text_color(rgb(0xcf222e))),
                                    ),
                            ),
                    )
            },
        ))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Dialog } from "nsh/base";

function Files() {
  const open = signal(false);
  return (
    <View style={{ flex: 1 }}>
      <View onPress={() => open.set(true)} style={{ padding: 16 }}>
        <Text>Delete the file</Text>
      </View>
      <Dialog
        open={open()}
        animation="fade"
        onOpenChange={(e) => open.set(e.open)}
        backdropClass="bg-black/40"
        class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete the file?</Text>
        <View onPress={() => open.set(false)}>
          <Text style={{ color: "#cf222e" }}>Delete</Text>
        </View>
      </Dialog>
    </View>
  );
}
```

Escape, el botón atrás de Android, una pulsación sobre el fondo (el fondo de TSX, el de una sheet nativa en Rust) y un deslizamiento hacia abajo sobre una sheet lo cierran de forma nativa (`close_on_escape`, `close_on_backdrop_press` y `close_on_swipe`, en TSX `closeOnEscape`, `closeOnBackdropPress` y `closeOnSwipe`, todos true por defecto). En Rust, `on_cancel` notifica cada intento y `on_close` el cierre, así que deja el diálogo fuera de la vista allí; un fondo que dibuje tu app lo cierra con su propio handler de pulsación, como arriba. En TSX, `onOpenChange({ open: false, reason })` te avisa, así que establece `open` en `false` allí. Para confirmar primero, pon una bandera en false y gestiona el evento de cancelación (`on_cancel`, `onCancel`), que notifica cada intento, y luego cierra tú mismo el diálogo. En iOS, `.presentation(ModalPresentation::PageSheet)` o `FormSheet` (`presentation="pageSheet"` o `"formSheet"`) presenta una sheet que mantiene visible lo que hay detrás.

Consulta [Dialog](../elements/dialog.md) para ver todas las props. Dentro de un diálogo, las variables `env(safe-area-inset-*)` y los insets son los propios del diálogo. Para diálogos del sistema (una alerta con acciones, un action sheet) usa [`AlertDialog`](../modules/nsh-base.md#alertdialog) de `nsh_base` (TSX: `nsh/base`).

<a id="the-android-back-button"></a>

## El botón atrás de Android

En Android, el botón (o gesto) atrás se gestiona en este orden:

1. El diálogo superior: notifica la cancelación (`on_cancel`, `onCancel`) y se cierra mientras `close_on_escape` / `closeOnEscape` sea true (el valor por defecto).
2. Tus listeners de atrás (`on_back_press` en Rust, `BackHandler` de `nsh/mobile` en TSX), el añadido más recientemente primero.
3. La pila superior: su página superior notifica la pulsación de atrás y hace pop mientras `pop_on_back` / `popOnBack` sea true.
4. Nadie lo gestionó: la app se cierra.

Un listener devuelve `true` cuando gestionó la pulsación, lo que evita que la pila haga pop. Mientras hay un listener registrado,
el gesto atrás de Android no muestra una vista previa del pop (la app responde solo cuando termina el gesto), así que añade listeners únicamente
mientras puedan tomar la pulsación:

```rust tabs
use nsh_core::prelude::*;

pub fn editor() -> impl IntoElement {
    let selecting = signal(false);
    // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
    effect(move || {
        if selecting.get() {
            on_back_press(move || {
                selecting.set(false);
                true
            });
        }
    });
    // …
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { BackHandler } from "nsh/mobile";

function Editor() {
  const selecting = signal(false);
  // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
  effect(() => {
    if (selecting()) {
      BackHandler.on("press", () => {
        selecting.set(false);
        return true;
      });
    }
  });
  // …
}
```

Un listener creado en un effect dura hasta que el effect se vuelve a ejecutar o su componente desaparece; en TSX, la función
que devuelve `BackHandler.on` también lo detiene. En TSX, `BackHandler.exitApp()` sale de la app; `nsh/mobile` también se puede importar en iOS, donde las llamadas de `BackHandler` regresan de inmediato, de modo que el mismo código se ejecuta en ambas plataformas. Consulta [Platform-specific code](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## Pestañas y otros layouts

Una barra de pestañas es tu propia UI, dibujada a partir de primitivas: una fila de vistas pulsables y una signal que guarda la pestaña seleccionada; renderiza el contenido de la pestaña seleccionada con [`when` / `<If>`](../elements/control-flow.md) (o un hijo función en TSX). Para conservar el estado de cada pestaña al cambiar, dale a cada una su propia pila y rutas y mantén todas montadas, ocultando las inactivas con `display: none`.

<a id="related"></a>

## Relacionado

- [`nsh/base`](../modules/nsh-base.md): la referencia de `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` y `Dialog`; [Safe area](../elements/safe-area.md) para los insets.
- [La barra de estado](../modules/nsh-base.md#status-bar) de páginas y diálogos.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
