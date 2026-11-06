---
title: "Navigation"
description: "Native Navigationsstacks mit createNavStack, NavStack und NavPage, Header auf jeder Plattform, den Nutzer mit popOnBack auf einer Seite halten, Dialoge und die Android-Zurück-Taste."
order: 41
group: ui
source_hash: f7722b75b9e46970
---


# Navigation

`nsh_base` (TSX: `nsh/base`) bietet einen nativen Navigationsstack und native Dialoge. Ein Navigationsstack (`nav_stack()` in Rust, `NavStack` in TSX) ist auf iOS ein UINavigationController mit Header, Swipe-back und großen Titeln, auf Android ein Stack mit Toolbar und Predictive Back. Auf den Desktop-Plattformen und im Web zeigt jede Seite den Header, den deine App zeichnet. Du hältst die Routen in deinem State. Der Stack rendert jede Route als Seite und hält sie samt ihrem State gemountet, solange sie im Stack liegt.

In Rust importierst du die Builder namentlich neben dem Prelude (`use nsh_base::{dialog, nav_page, nav_stack};`; System-Alerts sind `nsh_base::alert_dialog()`). Die Routen sind ein Signal, und die Kinder des Stacks sind seine Seiten, eine pro Route, über Keys identifiziert (`each`): Eine Seite hinzuzufügen pusht sie, sie zu entfernen poppt sie. In TSX hält `createNavStack` die Routen und `NavStack` rendert sie.

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

## Der Zustand des Stacks

In Rust sind die Routen dein eigenes Signal (`signal(vec![..])` oder `global::<Routes>()` für eines, das die ganze App erreicht). Du pushst, poppst und ersetzt, indem du es aktualisierst: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. Der Key jeder Seite (hier der `Debug`-Text der Route) sagt dem Stack, welche Seite welche ist, sodass Seiten, deren Route erhalten bleibt, ihren State behalten. Gib Routen, die sich wiederholen können, einen eindeutigen Key. Behandle `on_dismiss` jeder Seite: Der Nutzer ist nativ zurückgegangen, und die Route (samt den darüberliegenden) verlässt dein Signal.

In TSX erzeugt `createNavStack(routes)` den State des Stacks aus einem Array von Routen, von unten nach oben. Eine Route ist ein beliebiger Wert (ein String, ein Objekt, eine Discriminated Union wie oben), und jeder Push ist eine eigene Seite, auch wenn dieselbe Route zweimal gepusht wird. Erzeuge den State einmal, auf Modulebene oder in deiner Root-Komponente, und importiere ihn überall, wo Seiten navigieren.

| Member | Beschreibung |
|---|---|
| `routes()` | Die Routen, von unten nach oben (reaktiv). |
| `push(route)` | Pusht eine Seite. |
| `pop(count?)` | Poppt `count` Seiten (Standard 1); mindestens eine bleibt. |
| `popToRoot()` | Poppt zurück zur ersten Seite. |
| `replace(route)` | Ersetzt die oberste Seite. |
| `setRoutes(routes)` | Ersetzt die Seiten, z. B. nach der Anmeldung; eine Route, die bleibt (derselbe Wert), behält ihre Seite und ihren State. |
| `remove(route)` | Entfernt die oberste Seite von `route`, wo auch immer sie liegt. |

Um mehrere Seiten tief zu starten, übergib mehr Routen: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

Wenn der Nutzer eine Seite nativ verlässt (Zurück-Button im Header, Swipe-back auf iOS, Androids Zurück-Taste oder -Geste, die Zurück-Tasten und die Maustaste der Desktop-Plattformen, der Zurück-Button des Browsers), entfernt der TSX-Stack diese Route automatisch aus seinem State, sodass `routes()` immer dem entspricht, was auf dem Bildschirm zu sehen ist. Eine Rust-Seite meldet es mit `on_dismiss`, wie oben.

Eine Route trägt, was die Seite braucht. Die Gallery-Apps pushen Routen, die enthalten, woraus die Seite entsteht, was den Route-Typ bei vielen Seiten klein hält:

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

In Rust ist `nav_stack()` eine View, deren Kinder ihre Seiten sind, von unten nach oben; style sie wie jede View (`.flex_1()`). In TSX:

| Prop | Typ | Beschreibung |
|---|---|---|
| `state` | `NavStackState<R>` | Die anzuzeigenden Routen. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | Rendert eine Route; gib ein `<NavPage>` für ihren Header zurück. |
| `style`, `class` | | Der eigene Style des Stacks (meist `flex: 1`). |

Die Render-Funktion läuft einmal pro Route, wenn sie gepusht wird; `route` ist der reine Wert, `index()` seine aktuelle Position. Was sie zurückgibt, wird zum Inhalt der Seite. Gib ein `<NavPage>` zurück, um den Header zu setzen; alles andere wird in eine Seite mit Standardoptionen verpackt.

Seiten bleiben gemountet, solange ihre Route im Stack liegt: Beim Zurückgehen erscheint die vorherige Seite genau so, wie sie verlassen wurde, mit Scroll-Position, Eingaben und Signalen. Die [`cleanup`](./reactivity.md)-Handler einer Seite laufen, wenn ihre Route den Stack verlässt.

<a id="navpage-and-the-header"></a>

## NavPage und der Header

Eine Seite (`nav_page()` in Rust, `NavPage` in TSX) umschließt den Inhalt einer Seite und trägt ihren Header. iOS und Android zeigen ihren System-Header, der durch den Titel und die Header-Optionen konfiguriert wird. Die Desktop-Plattformen und das Web zeigen den Header-Slot der Seite (`.header(..)`, TSX `header`), deine eigenen Views, oben auf der Seite: so breit wie die Seite, so hoch, wie er sich layoutet, mit dem Inhalt darunter. Gib einer Seite beides, wie im Beispiel oben, und sie wirkt überall heimisch. Alle Optionen sind reaktiv: Ändere ein Signal, und der Header folgt.

In Rust ist jede der folgenden Props eine Methode von `nav_page()` in Snake Case: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`; ihre Kinder sind ihr Inhalt.

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `header` | `JSX.Element` | | Desktop-Plattformen und Web: der Header der Seite, von der App gezeichnet (ein Titel, ein Zurück-Button, Toolbar-Buttons). |
| `title` | `string` | | iOS und Android: der Titel des System-Headers. |
| `headerVisible` | `boolean` | `true` | iOS und Android: Der System-Header wird angezeigt. |
| `headerTransparent` | `boolean` | `false` | iOS und Android: Der Inhalt reicht unter den Header. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS und Android: der Hintergrund des Headers, die Farbe des Titels (`color`) und die der Buttons (`tintColor`). |
| `headerClass` | `string` | | Dasselbe wie bei classes: `bg-*`, `text-*` für den Titel, `tint-*` für die Buttons; `headerStyle` hat Vorrang vor ihnen. |
| `headerBackVisible` | `boolean` | `true` | iOS und Android: Der Zurück-Button wird angezeigt. |
| `headerLeft` | `JSX.Element` | | iOS und Android: Views am Anfang des Headers (sie ersetzen den Zurück-Button). |
| `headerRight` | `JSX.Element` | | iOS und Android: Views am Ende des Headers. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: UIKits eigener Bar-Button am Ende des Headers, mit dem Look des Systems, Symbol oder Label, anstelle der Views von `headerRight`; ein Tippen darauf ist ein Tippen auf die erste pressable View von `headerRight`, behalte dort also eine. Android zeigt `headerRight` unverändert an. |
| `ios={{ headerLeftSystemItem }}` | wie `headerRightSystemItem` | | iOS: dasselbe, am Anfang des Headers, mit Druck auf `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: UIKits eigener Bar-Button, der das SF Symbol mit diesem Namen zeigt (`"slider.horizontal.3"`), anstelle der Views von `headerRight`; ein Tippen darauf ist ein Tippen auf die erste pressable View von `headerRight`, und VoiceOver liest das Label dieser View vor. `headerRightSystemItem` hat Vorrang; bei einem Namen, den SF Symbols nicht kennt, wird `headerRight` unverändert angezeigt. Android zeigt `headerRight` unverändert an. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: dasselbe, am Anfang des Headers, mit Druck auf `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS und Android: Views, die den Titel ersetzen. |
| `headerLargeTitle` | `boolean` | `false` | iOS: ein großer Titel, der in die Leiste schrumpft, wenn der Inhalt scrollt. |
| `headerBackTitle` | `string` | | Das Label des Zurück-Buttons, der zu dieser Seite zurückführt (iOS; Androids Aufwärtspfeil sagt es Screenreadern). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Wie die Seite erscheint und verschwindet. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS und Android: die Statusleiste, solange die Seite oben liegt ([Statusleiste](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | Die interaktive Zurück-Geste (iOS Swipe-back, Android Predictive Back) poppt. Die Zurück-Buttons poppen in jedem Fall. |
| `popOnBack` | `boolean` | `true` | Jeder Weg zurück poppt die Seite: die Zurück-Buttons, Androids Zurück, die Zurück-Tasten der Desktop-Plattformen, der Zurück-Button des Browsers und der Swipe. |
| `onBackPress` | `() => void` | | Der Nutzer hat auf der Seite Zurück gedrückt, unabhängig davon, ob `popOnBack` das Poppen erlaubt hat. |
| `onDismiss` | `() => void` | | Der Nutzer hat die Seite gepoppt; ihre Route ist bereits entfernt. |
| `style`, `class` | | | Die Content-View der Seite. |

Header-Elemente sind gewöhnliche Views, sie können also pressable und reaktiv sein:

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

Ein farbiger System-Header (in Rust nimmt `header_style_with` typisierte Styles: `bg`, `text_color` und `tint_color`, die Farbe der Header-Buttons; Theme-Farben folgen dem Erscheinungsbild):

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

Eine Seite ohne Header hat trotzdem die Systemleisten um sich herum; versieh ihren Inhalt mit Padding gemäß den Insets der [Safe Area](../elements/safe-area.md):

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

### Safe Areas unter dem Header

Innerhalb einer Seite beziehen sich die `env(safe-area-inset-*)`-Variablen und die Insets der Seite (`Scope::insets` in Rust, `safeAreaInsets()` in TSX) auf den Bereich unterhalb des System-Headers, innerhalb der Seite. Bei einem transparenten Header beginnt der Inhalt am oberen Rand der Seite, und das obere Inset entspricht der Höhe des Headers. Padding mit `env(safe-area-inset-top)` hält Text also frei davon, während ein Hintergrundbild die ganze Seite füllt. Bei einem großen Titel setze eine Scroll-View direkt in die Seite, damit der Titel beim Scrollen einklappen kann. Auf den Desktop-Plattformen und im Web beginnt der Inhalt unterhalb des Header-Slots der Seite.

<a id="keeping-the-user-on-a-page-poponback"></a>

## Den Nutzer auf einer Seite halten: popOnBack

Um vor dem Verwerfen ungespeicherter Änderungen nachzufragen, setze `pop_on_back` (TSX `popOnBack`) auf false, solange etwas verloren gehen könnte, behandle den Zurück-Druck (`.on_back_press(..)`, TSX `onBackPress`) und poppe, sobald der Nutzer zustimmt:

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

Mit `pop_on_back(false)` (`popOnBack={false}`) bleibt die Seite bei jedem Weg zurück stehen (die Zurück-Buttons, Androids Zurück-Taste und -Geste, die Zurück-Tasten der Desktop-Plattformen, der Zurück-Button des Browsers, der Swipe), und das Back-Press-Event teilt dir mit, dass der Nutzer es versucht hat. Poppen aus dem Code (die Route entfernen, `nav.pop()`) poppt wie immer.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` ist eine Prop und kein Callback, der true oder false zurückgibt, weil der Main-Thread nie auf App-Code wartet. Wenn der Nutzer einen Swipe beginnt oder Zurück drückt, fragt das System sofort, ob die Seite gehen darf, und NSH antwortet nativ anhand der Props, die es bereits hat. Setze sie, sobald etwas verloren gehen könnte (wie oben, anhand des Texts), bevor der Nutzer versucht, die Seite zu verlassen.

`pop_on_swipe(false)` (`popOnSwipe={false}`) ist die leichtere Option: Sie deaktiviert nur die interaktive Geste (iOS Swipe-back, Androids Predictive-Back-Animation), und die Zurück-Buttons poppen weiterhin.

<a id="dialogs"></a>

## Dialoge

Ein Dialog (`dialog()` von `nsh_base` in Rust, `Dialog` in TSX) zeigt Inhalt über allem anderen an, in seiner eigenen nativen Fensterebene: ein präsentierter View Controller auf iOS, ein Dialogfenster auf Android, eine Ebene über dem gesamten Fenster auf den Desktop-Plattformen und im Web. Sein Aussehen bestimmst du. In Rust wird der Dialog präsentiert, solange er in der View liegt (innerhalb eines `when`), und seine Kinder füllen ihn: Zeichne Backdrop und Popup als Views. In TSX stylen `class` und `style` das Popup, das seine Kinder hält, `backdropClass` oder `backdropStyle` fügen dahinter einen Backdrop hinzu, und `open` steuert es:

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

Escape, Androids Zurück-Taste, ein Tippen auf den Backdrop (der Backdrop in TSX, bei einem nativen Sheet in Rust) und ein Wischen nach unten auf einem Sheet schließen ihn nativ (`close_on_escape`, `close_on_backdrop_press` und `close_on_swipe`, TSX `closeOnEscape`, `closeOnBackdropPress` und `closeOnSwipe`, jeweils standardmäßig true). In Rust meldet `on_cancel` jeden Versuch und `on_close` das Schließen, lass den Dialog dort also aus der View weg; ein Backdrop, den deine App zeichnet, schließt ihn mit seinem eigenen Press-Handler, wie oben. In TSX teilt dir `onOpenChange({ open: false, reason })` das mit, setze dort also `open` auf `false`. Um vorher nachzufragen, setze ein Flag auf false und behandle das Cancel-Event (`on_cancel`, `onCancel`), das jeden Versuch meldet, und schließe den Dialog dann selbst. Auf iOS präsentiert `.presentation(ModalPresentation::PageSheet)` oder `FormSheet` (`presentation="pageSheet"` oder `"formSheet"`) ein Sheet, das den Hintergrund sichtbar lässt.

Alle Props findest du unter [Dialog](../elements/dialog.md). Innerhalb eines Dialogs gehören die `env(safe-area-inset-*)`-Variablen und die Insets dem Dialog selbst. Für System-Dialoge (ein Alert mit Aktionen, ein Action Sheet) verwende [`AlertDialog`](../modules/nsh-base.md#alertdialog) aus `nsh_base` (TSX: `nsh/base`).

<a id="the-android-back-button"></a>

## Die Zurück-Taste unter Android

Unter Android wird die Zurück-Taste (oder -Geste) in dieser Reihenfolge behandelt:

1. Der oberste Dialog: Er meldet das Abbrechen (`on_cancel`, `onCancel`) und schließt sich, solange `close_on_escape` / `closeOnEscape` true ist (der Standard).
2. Deine Back-Listener (`on_back_press` in Rust, `BackHandler` aus `nsh/mobile` in TSX), der zuletzt hinzugefügte zuerst.
3. Der oberste Stack: Seine oberste Seite meldet den Zurück-Druck und poppt, solange `pop_on_back` / `popOnBack` true ist.
4. Nichts hat es behandelt: Die App wird beendet.

Ein Listener gibt `true` zurück, wenn er den Druck behandelt hat, wodurch der Stack nicht poppt. Solange ein Listener registriert ist,
zeigt Androids Zurück-Geste das Poppen nicht in der Vorschau (die App antwortet erst, wenn die Geste endet). Füge Listener also nur hinzu,
solange sie den Druck übernehmen könnten:

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

Ein Listener, der in einem Effect erzeugt wurde, besteht, bis der Effect erneut läuft oder seine Komponente verschwindet; in TSX stoppt ihn auch die Funktion,
die `BackHandler.on` zurückgibt. In TSX beendet `BackHandler.exitApp()` die App; `nsh/mobile` lässt sich auch auf iOS importieren, wo die Aufrufe von `BackHandler` sofort zurückkehren, sodass derselbe Code auf beiden Plattformen läuft. Siehe [Plattformspezifischer Code](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## Tabs und andere Layouts

Eine Tab-Leiste ist deine eigene UI, aus Primitiven gezeichnet: eine Zeile pressable Views und ein Signal, das den gewählten Tab hält. Rendere den Inhalt des gewählten Tabs mit [`when` / `<If>`](../elements/control-flow.md) (oder einem Funktions-Child in TSX). Um den State jedes Tabs beim Wechseln zu behalten, gib jedem Tab seinen eigenen Stack und seine eigenen Routen, halte alle gemountet und blende die inaktiven mit `display: none` aus.

<a id="related"></a>

## Siehe auch

- [`nsh/base`](../modules/nsh-base.md): die Referenz zu `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` und `Dialog`; [Safe Area](../elements/safe-area.md) für die Insets.
- [Die Statusleiste](../modules/nsh-base.md#status-bar) von Seiten und Dialogen.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
