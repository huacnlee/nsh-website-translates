---
title: "NavStack"
description: "Stack di navigazione nativi: NavStack, NavPage e createNavStack, push e pop delle pagine, slot dell'header, uscita da una pagina e come ogni piattaforma mostra uno stack."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

Uno stack di navigazione mostra una pagina alla volta e mantiene le pagine sottostanti: `UINavigationController` su iOS e Mac Catalyst, con l'header di sistema e lo swipe indietro, e una pila di pagine con una toolbar e il back predittivo su Android.
Sui desktop (macOS, Windows, Linux, GPUI) e sul web, ogni pagina mostra in alto l'header proprio dell'app, e i tasti
indietro e il pulsante indietro del browser rimuovono la pagina. `NavStack` è lo stack, `NavPage` una delle sue pagine.

Lo stack gestisce il comportamento di navigazione (transizioni, gesti e pulsanti indietro, stato delle pagine mentre
sono coperte); il contenuto delle pagine e l'header dei desktop sono invece dell'app.

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

Su iOS e Android la pagina mostra l'header di sistema con `title` e un pulsante indietro; sui desktop e sul web
mostra `header`. Un'app destinata solo agli smartphone omette `header`; una destinata solo ai desktop omette le opzioni
dell'header di sistema. La [Guida alla navigazione](../docs/navigation.md) illustra la navigazione di un'app completa: lo stato dello
stack, i dialoghi, il pulsante indietro di Android e le tab.

<a id="how-a-stack-works"></a>

## Come funziona uno stack

- Le pagine dello stack sono le **route**: valori a tua scelta, dal fondo alla cima dello stack. Una route di solito
  identifica la pagina e ne porta i parametri.
- In TSX le route risiedono nello stato creato da `createNavStack`. `NavStack` chiama la sua funzione figlia una volta per ogni push
  e mostra il risultato come pagina. La mantiene finché la sua route è nello stack, quindi una pagina conserva il
  proprio stato (signal, posizione di scorrimento, input) mentre altre pagine la coprono.
- In Rust i figli dello stack sono le sue pagine: un `nav_page()` inserito in `nav_stack()` viene messo nello stack, uno tolto viene
  rimosso. Conserva le route in un signal e renderizza le pagine con `each(..)`, con chiave la route, così le pagine
  sottostanti mantengono il proprio stato.
- Ogni push è una pagina a sé, anche quando lo stesso valore di route viene inserito due volte.
- Quando l'utente lascia una pagina in modo nativo (pulsante indietro, swipe indietro, indietro di Android, tasti
  indietro dei desktop, indietro del browser), la pagina viene rimossa. In TSX lo stack toglie la sua route dallo
  stato, quindi `nav.routes()` corrisponde sempre a ciò che l'utente vede. In Rust la pagina segnala `on_dismiss`, dove elimini la sua
  route (e quelle sopra di essa).
- In TSX, una funzione figlia che restituisce qualcosa di diverso da un `<NavPage>` ottiene una pagina con le opzioni
  predefinite. Restituisci un `<NavPage>` per impostarne l'header e le altre opzioni.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

Crea lo stato di uno stack che parte da `routes`, dal fondo alla cima. Crealo una sola volta, ad esempio a livello di
modulo, e passalo a `<NavStack state>`. Qualsiasi codice può importarlo per navigare.

| Membro | Descrizione |
|---|---|
| `routes: Accessor<readonly R[]>` | Le route, dal fondo alla cima. Reattivo. |
| `push(route: R): void` | Aggiunge una pagina. |
| `pop(count?: number): void` | Rimuove `count` pagine (predefinito 1). Almeno una pagina resta sempre. |
| `popToRoot(): void` | Torna alla prima pagina. |
| `replace(route: R): void` | Sostituisce la pagina in cima. |
| `setRoutes(routes: R[]): void` | Sostituisce le pagine; una route che resta (lo stesso valore) conserva la propria pagina e il proprio stato. |
| `remove(route: R): void` | Rimuove la pagina più alta di `route` (confrontata con `===`), ovunque si trovi nello stack. |

In Rust le stesse operazioni sono modifiche del tuo signal di route: `routes.update(|r| r.push(route))` aggiunge,
`r.pop()` rimuove, `r.truncate(1)` torna alla prima pagina che vi mantieni, e `routes.set(..)` sostituisce le pagine.

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

## Prop di NavStack

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `state` | le pagine sono i suoi figli | `NavStackState<R>` | Lo stato che contiene le route (`createNavStack`). Obbligatorio. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | Renderizza una route. Restituisci un `<NavPage>` per le sue opzioni. Obbligatorio. |
| `style`, `class` | metodi di stile | | Lo stile dello stack; di solito `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | Trova lo stack nei test e in `nsh test --trace`. |

La funzione figlia in TSX riceve il valore della route stessa e un accessor della sua posizione nello stack.

<a id="navpage-props"></a>

## Prop di NavPage

`NavPage` è una pagina di uno stack. Contiene il contenuto della pagina, il suo `header` sui desktop e sul web, e le opzioni
dell'header di sistema su iOS e Android. In Rust, `nav_page()` restituisce la pagina e i suoi metodi builder sono i nomi
delle prop in snake case.

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | nessuno | Desktop e web: l'header della pagina, posto in cima alla pagina, largo quanto la pagina e alto quanto il suo layout, con il contenuto sotto. |
| `title` | `.title(..)` | `string` | nessuno | iOS e Android: il titolo dell'header di sistema. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS e Android: l'header di sistema viene mostrato. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS e Android: il contenuto si estende sotto un header di sistema trasparente. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: la tab bar di sistema esce finché questa pagina è in cima, muovendosi durante la transizione — con la stessa animazione della pagina, e la barra non viene mai ricostruita; ritorna quando la pagina viene rimossa. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: un titolo grande che si riduce nella barra mentre il contenuto scorre; il contenuto scorre sotto l'header. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | nessuno | iOS e Android: l'etichetta del pulsante indietro che riporta a questa pagina (su Android, la sua descrizione per gli screen reader). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS e Android: il pulsante indietro viene mostrato. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | nessuno | iOS e Android: contenuto sul bordo iniziale dell'header di sistema, al posto del pulsante indietro. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | nessuno | iOS e Android: contenuto sul bordo finale dell'header di sistema. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | nessuno | iOS e Android: contenuto che sostituisce il titolo. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | piattaforma | iOS e Android: i colori dell'header di sistema: lo sfondo, quello del titolo (`color`) e quello dei pulsanti (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | nessuno | Gli stessi colori come classi: `bg-*`, `text-*` per il titolo, `tint-*` per i pulsanti (in Rust `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, colori del tema che seguono l'aspetto). `headerStyle` ha la precedenza su di essi. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | I pulsanti indietro e lo swipe indietro rimuovono la pagina. Vedi [Uscire da una pagina](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | Il gesto indietro interattivo rimuove la pagina: lo swipe indietro di iOS, il back predittivo di Android che segue il dito. I pulsanti indietro la rimuovono in ogni caso. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Come la pagina entra ed esce. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | nessuno | La pagina entra ed esce tramite uno shader WGSL al posto del suo `animation`: `shade(uv)` legge la pagina sottostante come `sample_from` e questa pagina come `sample_to` mentre `nsh.progress` va da 0 a 1 in `duration` millisecondi (350 per impostazione predefinita), e da 1 a 0 quando la pagina esce. Quando il sistema richiede meno movimento, la pagina usa il proprio `animation`. Vedi [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | nessuno | iOS e Android: la barra di stato mentre la pagina è in cima. Vedi [Barra di stato](../modules/nsh-base.md#status-bar). |
| `style`, `class` | metodi di stile | | nessuno | Lo stile della pagina. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto. |
| `testID` | `.test_id(..)` | `string` | nessuno | Trova la pagina nei test e in `nsh test --trace`. |

<a id="navpage-events"></a>

## Eventi di NavPage

| Evento | Rust | Descrizione |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | L'utente ha premuto indietro sulla pagina (il pulsante indietro dell'header, l'indietro di Android, Escape, Alt+Sinistra o il pulsante indietro del mouse sui desktop, l'indietro del browser), indipendentemente dal fatto che `popOnBack` ne abbia permesso la rimozione. |
| `onDismiss` | `.on_dismiss(..)` | L'utente ha rimosso la pagina (pulsante indietro, swipe); in TSX la sua route è già sparita, in Rust la elimini qui. |

<a id="header-slots"></a>

## Slot dell'header

`header`, `headerLeft`, `headerRight` e `headerTitle` sono slot: elementi ordinari che leggono signal, gestiscono le pressioni
e si aggiornano mentre la pagina è mostrata. `header` è l'intero header dell'app sui desktop e sul web; gli altri tre
vanno nell'header di sistema su iOS e Android.

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

Il contenuto della pagina inizia sotto l'header: sotto un header di sistema opaco su iOS e Android, sotto `header` sui
desktop e sul web. Con `headerTransparent`, `headerLargeTitle` o `headerVisible={false}`, su iOS e Android inizia in cima alla
pagina; usa [`env(safe-area-inset-top)`](./safe-area.md) o `safeAreaInsets()` per tenerlo lontano dall'header e dalla barra di stato.

Su iOS, `headerVisible={false}` mantiene abilitato lo swipe indietro finché `popOnSwipe` e `popOnBack` sono veri.
Un gesto indietro interattivo accettato termina la modifica all'inizio della transizione, quindi la tastiera si
chiude durante il trascinamento. Annullare la transizione ripristina il focus dello stesso editor, se un altro
controllo non lo ha preso.

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

## Uscire da una pagina

`popOnBack={false}` trattiene l'utente su una pagina, ad esempio mentre un modulo ha modifiche non salvate. Finché è false, lo
swipe indietro è disattivato e i pulsanti e i tasti indietro chiamano `onBackPress` senza rimuovere la pagina. Chiedi
all'utente, poi rimuovi la pagina da te:

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
> Il sistema chiede se l'utente può tornare indietro sul thread principale, nel momento in cui l'utente agisce, e il
> thread principale non attende mai JS né il tuo codice Rust. Per questo NSH risponde in base al valore di `popOnBack` già
> montato. Imposta `popOnBack={false}` non appena c'è qualcosa da perdere, prima che l'utente torni indietro.

`onBackPress` viene chiamato a ogni pressione di indietro, anche quando la pagina viene rimossa, quindi indica anche che
l'utente è tornato indietro. Per disattivare solo il gesto di swipe e mantenere i pulsanti indietro, usa `popOnSwipe={false}`. La
conferma stessa è un [AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## Note sulle piattaforme

- **iOS**: `UINavigationController` con header di sistema, pulsante indietro e swipe indietro; `headerLargeTitle` è il titolo grande di UIKit.
  Le modifiche allo stack che arrivano durante una transizione in corso vengono applicate al suo termine.
- **Android**: uno stack con una toolbar. Il pulsante indietro di sistema rimuove la pagina in cima, con il back
  predittivo sulle versioni di Android che lo supportano; la descrizione della freccia su per gli screen reader è
  il `headerBackTitle` della pagina sottostante, oppure quella del sistema. Vedi `BackHandler` in [`BackHandler`](../modules/nsh-mobile.md#backhandler) per gestire tu stesso
  il pulsante indietro.
- **Mac Catalyst**: come su iOS.
- **Desktop (macOS, Windows, Linux, GPUI) e web**: ogni pagina mostra il proprio `header` in alto e il contenuto
  sotto. Escape, Alt+Sinistra e il pulsante indietro del mouse tornano indietro sui desktop, il pulsante indietro
  del browser sul web.

Per il contenuto mostrato sopra lo stack e il suo header, come uno sheet o un flusso a schermo intero, usa un
[Dialog](./dialog.md).
