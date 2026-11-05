---
title: "Navigazione"
description: "Stack di navigazione nativi con createNavStack, NavStack e NavPage, intestazioni su ogni piattaforma, come mantenere l'utente su una pagina con popOnBack, finestre di dialogo e il pulsante Indietro di Android."
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# Navigazione

`nsh_base` (TSX: `nsh/base`) fornisce uno stack di navigazione nativo e dialog nativi. Uno stack di navigazione (`nav_stack()` in Rust, `NavStack` in TSX) è un UINavigationController su iOS, con il suo header, lo swipe indietro e i titoli grandi, e uno stack con una toolbar e il back predittivo su Android; sui desktop e sul web, ogni pagina mostra l'header disegnato dalla tua app. Le route restano nel tuo stato; lo stack renderizza ogni route come una pagina e la mantiene montata, con il suo stato, finché si trova nello stack.

In Rust, importa i builder per nome accanto al prelude (`use nsh_base::{dialog, nav_page, nav_stack};`; gli alert di sistema sono `nsh_base::alert_dialog()`). Le route sono un signal e i figli dello stack sono le sue pagine, una per route, identificate da una chiave (`each`): una pagina che entra viene aggiunta (push) e una che esce viene rimossa (pop). In TSX, `createNavStack` contiene le route e `NavStack` le renderizza.

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

## Lo stato dello stack

In Rust, le route sono un tuo signal (`signal(vec![..])`, oppure `global::<Routes>()` per uno raggiungibile da tutta l'app), e fai push, pop e replace aggiornandolo: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. La chiave di ogni pagina (qui il testo `Debug` della route) indica allo stack quale pagina è quale, quindi le pagine la cui route rimane mantengono il loro stato; assegna una chiave univoca alle route che possono ripetersi. Gestisci il `on_dismiss` di ogni pagina: l'utente è tornato indietro in modo nativo, e la route (insieme a quelle sopra di essa) esce dal tuo signal.

In TSX, `createNavStack(routes)` crea lo stato dello stack a partire da un array di route, dal basso verso l'alto. Una route è un valore qualsiasi (una stringa, un oggetto, una discriminated union come sopra), e ogni push è una pagina a sé, anche se la stessa route viene aggiunta due volte. Crea lo stato una sola volta, a livello di modulo o nel tuo componente root, e importalo ovunque le pagine navighino.

| Membro | Descrizione |
|---|---|
| `routes()` | Le route, dal basso verso l'alto (reattivo). |
| `push(route)` | Aggiunge una pagina (push). |
| `pop(count?)` | Rimuove `count` pagine (default 1); almeno una rimane. |
| `popToRoot()` | Torna alla prima pagina. |
| `replace(route)` | Sostituisce la pagina in cima. |
| `setRoutes(routes)` | Sostituisce le pagine, ad esempio dopo l'accesso; una route che rimane (lo stesso valore) mantiene la propria pagina e il proprio stato. |
| `remove(route)` | Rimuove la pagina più alta di `route`, ovunque si trovi. |

Per partire con più pagine già nello stack, passa più route: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

Quando l'utente lascia una pagina in modo nativo (il pulsante indietro nell'header, lo swipe indietro su iOS, il pulsante o il gesto indietro di Android, i tasti e il pulsante del mouse per tornare indietro sui desktop, il pulsante indietro del browser), lo stack TSX rimuove quella route dal suo stato per te, così `routes()` corrisponde sempre a ciò che è sullo schermo; una pagina Rust lo segnala con `on_dismiss`, come sopra.

Una route porta con sé ciò che serve alla pagina. Le app della galleria fanno push di route che contengono ciò che costruisce la pagina, il che mantiene piccolo il tipo della route quando le pagine sono molte:

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

In Rust, `nav_stack()` è una view i cui figli sono le sue pagine, dal basso verso l'alto; si stila come qualsiasi view (`.flex_1()`). In TSX:

| Prop | Tipo | Descrizione |
|---|---|---|
| `state` | `NavStackState<R>` | Le route da mostrare. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | Renderizza una route; restituisci un `<NavPage>` per il suo header. |
| `style`, `class` | | Lo stile dello stack stesso (di solito `flex: 1`). |

La funzione di render viene eseguita una volta per route, quando questa viene aggiunta; `route` è il valore semplice, `index()` la sua posizione attuale. Ciò che restituisce diventa il contenuto della pagina. Restituisci un `<NavPage>` per impostare l'header; qualsiasi altra cosa viene racchiusa in una pagina con le opzioni predefinite.

Le pagine restano montate finché la loro route è nello stack: tornando indietro si vede la pagina precedente esattamente come era stata lasciata, con la sua posizione di scroll, i suoi input e i suoi signal. Gli handler [`cleanup`](./reactivity.md) di una pagina vengono eseguiti quando la sua route lascia lo stack.

<a id="navpage-and-the-header"></a>

## NavPage e l'header

Una pagina (`nav_page()` in Rust, `NavPage` in TSX) racchiude il contenuto di una pagina e ne porta l'header. iOS e Android mostrano il loro header di sistema, configurato dal titolo e dalle opzioni dell'header. I desktop e il web mostrano lo slot header della pagina (`.header(..)`, TSX `header`), cioè le tue view, in cima alla pagina: largo quanto la pagina, alto quanto il suo layout, con il contenuto sotto. Fornisci a una pagina entrambi, come fa l'esempio sopra, e sarà a suo agio ovunque. Tutte le opzioni sono reattive: cambia un signal e l'header lo segue.

In Rust, ogni prop qui sotto è un metodo di `nav_page()` in snake case: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`; i suoi figli sono il suo contenuto.

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `header` | `JSX.Element` | | Desktop e web: l'header della pagina, disegnato dall'app (un titolo, un pulsante indietro, pulsanti della toolbar). |
| `title` | `string` | | iOS e Android: il titolo dell'header di sistema. |
| `headerVisible` | `boolean` | `true` | iOS e Android: l'header di sistema viene mostrato. |
| `headerTransparent` | `boolean` | `false` | iOS e Android: il contenuto si estende sotto l'header. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS e Android: lo sfondo dell'header, il colore del titolo (`color`) e quello dei pulsanti (`tintColor`). |
| `headerClass` | `string` | | Come classes: `bg-*`, `text-*` per il titolo, `tint-*` per i pulsanti; `headerStyle` ha la precedenza su di essi. |
| `headerBackVisible` | `boolean` | `true` | iOS e Android: il pulsante indietro viene mostrato. |
| `headerLeft` | `JSX.Element` | | iOS e Android: view all'inizio dell'header (sostituiscono il pulsante indietro). |
| `headerRight` | `JSX.Element` | | iOS e Android: view alla fine dell'header. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: il bar button nativo di UIKit alla fine dell'header, con l'aspetto di sistema, simbolo o etichetta, al posto delle view di `headerRight`; una pressione su di esso è una pressione sulla prima view pressable di `headerRight`, quindi tienine una lì. Android mostra `headerRight` così com'è. |
| `ios={{ headerLeftSystemItem }}` | come `headerRightSystemItem` | | iOS: lo stesso, all'inizio dell'header, premendo `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: il bar button nativo di UIKit che mostra l'SF Symbol con quel nome (`"slider.horizontal.3"`) al posto delle view di `headerRight`; una pressione su di esso è una pressione sulla prima view pressable di `headerRight`, e VoiceOver legge l'etichetta di quella view. `headerRightSystemItem` ha la precedenza su di esso; un nome che SF Symbols non ha mostra `headerRight` così com'è. Android mostra `headerRight` così com'è. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: lo stesso, all'inizio dell'header, premendo `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS e Android: view che sostituiscono il titolo. |
| `headerLargeTitle` | `boolean` | `false` | iOS: un titolo grande che si riduce nella barra mentre il contenuto scorre. |
| `headerBackTitle` | `string` | | L'etichetta del pulsante indietro che riporta a questa pagina (iOS; la freccia su di Android la comunica agli screen reader). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Come la pagina entra ed esce. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS e Android: la status bar mentre la pagina è in cima ([Status bar](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | Il gesto interattivo indietro (swipe indietro su iOS, back predittivo su Android) rimuove la pagina. I pulsanti indietro la rimuovono in ogni caso. |
| `popOnBack` | `boolean` | `true` | Ogni modo per tornare indietro rimuove la pagina: i pulsanti indietro, il back di Android, i tasti indietro dei desktop, il pulsante indietro del browser e lo swipe. |
| `onBackPress` | `() => void` | | L'utente ha premuto indietro sulla pagina, indipendentemente dal fatto che `popOnBack` le abbia permesso di essere rimossa. |
| `onDismiss` | `() => void` | | L'utente ha rimosso la pagina; la sua route è già stata rimossa. |
| `style`, `class` | | | La view del contenuto della pagina. |

Gli elementi dell'header sono view ordinarie, quindi possono essere pressable e reattivi:

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

Un header di sistema colorato (in Rust, `header_style_with` accetta stili tipizzati: `bg`, `text_color` e `tint_color`, il colore dei pulsanti dell'header; i colori del tema seguono l'aspetto):

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

Una pagina che non mostra alcun header ha comunque le barre di sistema attorno a sé; applica al suo contenuto un padding pari agli inset della [safe area](../elements/safe-area.md):

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

### Safe area sotto l'header

All'interno di una pagina, le variabili `env(safe-area-inset-*)` e gli inset della pagina (`Scope::insets` in Rust, `safeAreaInsets()` in TSX) sono quelli sotto l'header di sistema, all'interno della pagina. Con un header trasparente, il contenuto parte dall'alto della pagina e l'inset superiore è l'altezza dell'header, quindi applicare un padding di `env(safe-area-inset-top)` tiene il testo lontano da esso mentre un'immagine di sfondo riempie l'intera pagina. Con un titolo grande, metti una scroll view direttamente nella pagina in modo che il titolo possa comprimersi durante lo scroll. Sui desktop e sul web, il contenuto parte sotto lo slot header della pagina.

<a id="keeping-the-user-on-a-page-poponback"></a>

## Trattenere l'utente su una pagina: popOnBack

Per chiedere conferma prima di scartare modifiche non salvate, imposta `pop_on_back` (TSX `popOnBack`) a false finché c'è qualcosa da perdere, gestisci la pressione di indietro (`.on_back_press(..)`, TSX `onBackPress`) e rimuovi la pagina quando l'utente acconsente:

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

Con `pop_on_back(false)` (`popOnBack={false}`), la pagina resta in ogni modo di tornare indietro (i pulsanti indietro, il pulsante e il gesto indietro di Android, i tasti indietro dei desktop, il pulsante indietro del browser, lo swipe), e l'evento di pressione di indietro ti segnala che l'utente ha provato. Rimuovere la pagina dal codice (togliendo la route, `nav.pop()`) la rimuove come sempre.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` è una prop, non una callback che restituisce true o false, perché il main thread non attende mai il codice dell'app. Quando l'utente inizia uno swipe o preme indietro, il sistema chiede subito se la pagina può andarsene, e NSH risponde in modo nativo in base alle prop che ha già. Impostala non appena c'è qualcosa da perdere (come sopra, a partire dal testo), prima che l'utente provi a uscire.

`pop_on_swipe(false)` (`popOnSwipe={false}`) è l'opzione più leggera: disattiva solo il gesto interattivo (swipe indietro su iOS, animazione del back predittivo di Android), e i pulsanti indietro continuano a rimuovere la pagina.

<a id="dialogs"></a>

## Dialog

Un dialog (`dialog()` di `nsh_base` in Rust, `Dialog` in TSX) presenta contenuto sopra a tutto il resto, nel proprio livello di finestra nativo: un view controller presentato su iOS, una finestra di dialog su Android, un livello sopra l'intera finestra sui desktop e sul web. Il suo aspetto è tuo. In Rust, il dialog viene presentato finché è nella view (dentro un `when`) e i suoi figli lo riempiono: disegna il backdrop e il popup come view. In TSX, `class` e `style` stilano il popup che contiene i suoi figli, `backdropClass` o `backdropStyle` aggiungono un backdrop dietro di esso, e `open` lo controlla:

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

Escape, il pulsante indietro di Android, una pressione sul backdrop (il backdrop di TSX, quello di uno sheet nativo in Rust) e uno swipe verso il basso su uno sheet lo chiudono in modo nativo (`close_on_escape`, `close_on_backdrop_press` e `close_on_swipe`, TSX `closeOnEscape`, `closeOnBackdropPress` e `closeOnSwipe`, ciascuno true per default). In Rust, `on_cancel` segnala ogni tentativo e `on_close` la chiusura, quindi lì lascia il dialog fuori dalla view; un backdrop disegnato dalla tua app lo chiude con il proprio handler di pressione, come sopra. In TSX, è `onOpenChange({ open: false, reason })` a informarti, quindi lì imposta `open` a `false`. Per chiedere prima una conferma, imposta un flag a false e gestisci l'evento di annullamento (`on_cancel`, `onCancel`), che segnala ogni tentativo, poi chiudi tu il dialog. Su iOS, `.presentation(ModalPresentation::PageSheet)` o `FormSheet` (`presentation="pageSheet"` o `"formSheet"`) presenta uno sheet che mantiene visibile ciò che c'è dietro.

Vedi [Dialog](../elements/dialog.md) per tutte le prop. All'interno di un dialog, le variabili `env(safe-area-inset-*)` e gli inset sono quelli del dialog stesso. Per i dialog di sistema (un alert con azioni, un action sheet) usa [`AlertDialog`](../modules/nsh-base.md#alertdialog) da `nsh_base` (TSX: `nsh/base`).

<a id="the-android-back-button"></a>

## Il pulsante indietro di Android

Su Android, il pulsante (o gesto) indietro viene gestito in quest'ordine:

1. Il dialog in cima: segnala l'annullamento (`on_cancel`, `onCancel`) e si chiude finché `close_on_escape` / `closeOnEscape` è true (il default).
2. I tuoi listener per il back (`on_back_press` in Rust, `BackHandler` da `nsh/mobile` in TSX), a partire dal più recente.
3. Lo stack in cima: la sua pagina in cima segnala la pressione di indietro e viene rimossa finché `pop_on_back` / `popOnBack` è true.
4. Nessuno l'ha gestita: l'app esce.

Un listener restituisce `true` quando ha gestito la pressione, il che impedisce allo stack di rimuovere la pagina. Finché è registrato un listener, il gesto indietro di Android non mostra l'anteprima della rimozione (l'app risponde solo quando il gesto termina), quindi aggiungi i listener solo
quando possono davvero intercettare la pressione:

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

Un listener creato in un effect dura finché l'effect non viene rieseguito o il suo componente non scompare; in TSX, anche la funzione
restituita da `BackHandler.on` lo ferma. In TSX, `BackHandler.exitApp()` esce dall'app; `nsh/mobile` può essere importato anche su iOS, dove le chiamate di `BackHandler` ritornano subito, così lo stesso codice funziona su entrambe le piattaforme. Vedi [Codice specifico per piattaforma](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## Tab e altri layout

Una tab bar è una tua UI, disegnata con le primitive: una riga di view pressable e un signal che contiene la tab selezionata; renderizza il contenuto della tab selezionata con [`when` / `<If>`](../elements/control-flow.md) (o con una function child in TSX). Per mantenere lo stato di ogni tab durante il cambio, dai a ogni tab il proprio stack e le proprie route e tienile tutte montate, nascondendo quelle inattive con `display: none`.

<a id="related"></a>

## Correlati

- [`nsh/base`](../modules/nsh-base.md): il riferimento a `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` e `Dialog`; [Safe area](../elements/safe-area.md) per gli inset.
- [La status bar](../modules/nsh-base.md#status-bar) di pagine e dialog.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
