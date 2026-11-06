---
title: "Navigation"
description: "Piles de navigation natives avec createNavStack, NavStack et NavPage, en-têtes sur toutes les plateformes, maintien de l'utilisateur sur une page avec popOnBack, boîtes de dialogue et bouton retour d'Android."
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# Navigation

`nsh_base` (TSX : `nsh/base`) fournit une pile de navigation native et des boîtes de dialogue natives. Une pile de navigation (`nav_stack()` en Rust, `NavStack` en TSX) est un UINavigationController sur iOS, avec son en-tête, le retour par balayage et les grands titres, et une pile avec une barre d'outils et le retour prédictif sur Android ; sur les desktops et le web, chaque page affiche l'en-tête que dessine votre app. Vous gardez les routes dans votre état ; la pile affiche chaque route comme une page et la garde montée, avec son état, tant qu'elle est dans la pile.

En Rust, importez les builders par leur nom à côté du prelude (`use nsh_base::{dialog, nav_page, nav_stack};` ; les alertes système sont dans `nsh_base::alert_dialog()`). Les routes forment un signal et les enfants de la pile sont ses pages, une par route, identifiées par une clé (`each`) : une page qui entre est un push, une page qui sort est un pop. En TSX, `createNavStack` contient les routes et `NavStack` les affiche.

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

## L'état de la pile

En Rust, les routes sont votre propre signal (`signal(vec![..])`, ou `global::<Routes>()` pour un signal accessible à toute l'app), et vous faites un push, un pop ou un remplacement en le mettant à jour : `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. La clé de chaque page (ici le texte `Debug` de la route) indique à la pile quelle page est laquelle, de sorte que les pages dont la route reste conservent leur état ; donnez une clé unique aux routes qui peuvent se répéter. Gérez le `on_dismiss` de chaque page : l'utilisateur est revenu en arrière nativement, et la route (avec celles au-dessus) quitte votre signal.

En TSX, `createNavStack(routes)` crée l'état de la pile à partir d'un tableau de routes, de bas en haut. Une route est la valeur de votre choix (une chaîne, un objet, une union discriminée comme ci-dessus), et chaque push est une page à part entière, y compris la même route poussée deux fois. Créez l'état une seule fois, au niveau du module ou dans votre composant racine, et importez-le partout où des pages naviguent.

| Membre | Description |
|---|---|
| `routes()` | Les routes, de bas en haut (réactif). |
| `push(route)` | Pousse une page. |
| `pop(count?)` | Retire `count` pages (1 par défaut) ; il en reste au moins une. |
| `popToRoot()` | Revient à la première page. |
| `replace(route)` | Remplace la page du dessus. |
| `setRoutes(routes)` | Remplace les pages, p. ex. après une connexion ; une route qui reste (la même valeur) conserve sa page et son état. |
| `remove(route)` | Retire la page la plus haute de `route`, où qu'elle soit. |

Pour démarrer plusieurs pages plus loin, passez plus de routes : `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

Quand l'utilisateur quitte une page nativement (le bouton retour de l'en-tête, un balayage arrière sur iOS, le bouton ou le geste retour d'Android, les touches et le bouton de souris retour des desktops, le bouton retour du navigateur), la pile TSX retire cette route de son état pour vous, si bien que `routes()` correspond toujours à ce qui est à l'écran ; une page Rust le signale avec `on_dismiss`, comme ci-dessus.

Une route porte ce dont la page a besoin. Les apps de galerie poussent des routes qui contiennent ce qui constitue la page, ce qui garde le type de route petit quand il y a beaucoup de pages :

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

En Rust, `nav_stack()` est une vue dont les enfants sont ses pages, de bas en haut ; stylez-la comme n'importe quelle vue (`.flex_1()`). En TSX :

| Prop | Type | Description |
|---|---|---|
| `state` | `NavStackState<R>` | Les routes à afficher. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | Affiche une route ; retournez un `<NavPage>` pour son en-tête. |
| `style`, `class` | | Le style propre de la pile (généralement `flex: 1`). |

La fonction de rendu s'exécute une fois par route, lors de son push ; `route` est la valeur brute, `index()` sa position actuelle. Ce qu'elle retourne devient le contenu de la page. Retournez un `<NavPage>` pour définir l'en-tête ; tout autre retour est enveloppé dans une page avec les options par défaut.

Les pages restent montées tant que leur route est dans la pile : revenir en arrière affiche la page précédente exactement comme elle a été laissée, avec sa position de défilement, ses champs et ses signaux. Les gestionnaires [`cleanup`](./reactivity.md) d'une page s'exécutent quand sa route quitte la pile.

<a id="navpage-and-the-header"></a>

## NavPage et l'en-tête

Une page (`nav_page()` en Rust, `NavPage` en TSX) enveloppe le contenu d'une page et porte son en-tête. iOS et Android affichent leur en-tête système, configuré par le titre et les options d'en-tête. Les desktops et le web affichent l'emplacement d'en-tête de la page (`.header(..)`, TSX `header`), vos propres vues, en haut de la page : aussi large que la page, aussi haut que sa mise en page le demande, avec le contenu en dessous. Donnez les deux à une page, comme le fait l'exemple ci-dessus, et elle se présente bien partout. Toutes les options sont réactives : modifiez un signal et l'en-tête suit.

En Rust, chaque prop ci-dessous est une méthode de `nav_page()` en snake case : `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)` ; ses enfants sont son contenu.

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `header` | `JSX.Element` | | Desktops et web : l'en-tête de la page, dessiné par l'app (un titre, un bouton retour, des boutons de barre d'outils). |
| `title` | `string` | | iOS et Android : le titre de l'en-tête système. |
| `headerVisible` | `boolean` | `true` | iOS et Android : l'en-tête système s'affiche. |
| `headerTransparent` | `boolean` | `false` | iOS et Android : le contenu s'étend sous l'en-tête. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS et Android : l'arrière-plan de l'en-tête, la couleur du titre (`color`) et celle des boutons (`tintColor`). |
| `headerClass` | `string` | | Comme classes : `bg-*`, `text-*` pour le titre, `tint-*` pour les boutons ; `headerStyle` l'emporte sur elles. |
| `headerBackVisible` | `boolean` | `true` | iOS et Android : le bouton retour s'affiche. |
| `headerLeft` | `JSX.Element` | | iOS et Android : des vues au début de l'en-tête (elles remplacent le bouton retour). |
| `headerRight` | `JSX.Element` | | iOS et Android : des vues à la fin de l'en-tête. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS : le bouton de barre natif d'UIKit à la fin de l'en-tête, avec l'apparence du système, un symbole ou un libellé, à la place des vues de `headerRight` ; un appui dessus est un appui sur la première vue pressable de `headerRight`, gardez-en donc une. Android affiche `headerRight` tel quel. |
| `ios={{ headerLeftSystemItem }}` | identique à `headerRightSystemItem` | | iOS : la même chose, au début de l'en-tête, avec appui sur `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS : le bouton de barre natif d'UIKit affichant le SF Symbol de ce nom (`"slider.horizontal.3"`) à la place des vues de `headerRight` ; un appui dessus est un appui sur la première vue pressable de `headerRight`, et VoiceOver lit le libellé de cette vue. `headerRightSystemItem` l'emporte sur lui ; un nom que SF Symbols ne connaît pas affiche `headerRight` tel quel. Android affiche `headerRight` tel quel. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS : la même chose, au début de l'en-tête, avec appui sur `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS et Android : des vues qui remplacent le titre. |
| `headerLargeTitle` | `boolean` | `false` | iOS : un grand titre qui se réduit dans la barre quand le contenu défile. |
| `headerBackTitle` | `string` | | Le libellé du bouton retour qui ramène à cette page (iOS ; la flèche vers le haut d'Android le transmet aux lecteurs d'écran). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | La façon dont la page entre et sort. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS et Android : la barre d'état tant que la page est au sommet ([Barre d'état](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | Le geste retour interactif (balayage arrière sur iOS, retour prédictif sur Android) retire la page. Les boutons retour la retirent dans tous les cas. |
| `popOnBack` | `boolean` | `true` | Chaque façon de revenir en arrière retire la page : les boutons retour, le retour d'Android, les touches retour des desktops, le bouton retour du navigateur et le balayage. |
| `onBackPress` | `() => void` | | L'utilisateur a appuyé sur retour sur la page, que `popOnBack` ait permis ou non de la retirer. |
| `onDismiss` | `() => void` | | L'utilisateur a retiré la page ; sa route est déjà supprimée. |
| `style`, `class` | | | La vue de contenu de la page. |

Les éléments d'en-tête sont des vues ordinaires ; ils peuvent donc être pressables et réactifs :

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

Un en-tête système coloré (en Rust, `header_style_with` prend des styles typés : `bg`, `text_color` et `tint_color`, la couleur des boutons de l'en-tête ; les couleurs du thème suivent l'apparence) :

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

Une page qui n'affiche aucun en-tête a quand même les barres système autour d'elle ; appliquez à son contenu une marge intérieure égale aux insets de la [zone sûre](../elements/safe-area.md) :

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

### Zones sûres sous l'en-tête

Dans une page, les variables `env(safe-area-inset-*)` et les insets de la page (`Scope::insets` en Rust, `safeAreaInsets()` en TSX) sont ceux situés sous l'en-tête système, à l'intérieur de la page. Avec un en-tête transparent, le contenu commence en haut de la page et l'inset supérieur est la hauteur de l'en-tête ; une marge intérieure de `env(safe-area-inset-top)` éloigne donc le texte de l'en-tête pendant qu'une image d'arrière-plan remplit toute la page. Avec un grand titre, placez une vue défilante directement dans la page pour que le titre puisse se réduire pendant le défilement. Sur les desktops et le web, le contenu commence sous l'emplacement d'en-tête de la page.

<a id="keeping-the-user-on-a-page-poponback"></a>

## Garder l'utilisateur sur une page : popOnBack

Pour demander confirmation avant d'abandonner des modifications non enregistrées, mettez `pop_on_back` (TSX `popOnBack`) à false tant qu'il y a quelque chose à perdre, gérez l'appui sur retour (`.on_back_press(..)`, TSX `onBackPress`), et retirez la page une fois que l'utilisateur accepte :

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

Avec `pop_on_back(false)` (`popOnBack={false}`), la page reste quelle que soit la façon de revenir en arrière (les boutons retour, le bouton et le geste retour d'Android, les touches retour des desktops, le bouton retour du navigateur, le balayage), et l'événement d'appui sur retour vous indique que l'utilisateur a essayé. Retirer la page depuis le code (en supprimant la route, `nav.pop()`) la retire comme toujours.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` est une prop, et non un callback qui retourne true ou false, car le thread principal n'attend jamais le code de l'app. Quand l'utilisateur commence un balayage ou appuie sur retour, le système demande immédiatement si la page peut partir, et NSH répond nativement à partir des props qu'il a déjà. Définissez-la dès qu'il y a quelque chose à perdre (comme ci-dessus, à partir du texte), avant que l'utilisateur essaie de partir.

`pop_on_swipe(false)` (`popOnSwipe={false}`) est l'option plus légère : elle désactive uniquement le geste interactif (balayage arrière sur iOS, animation de retour prédictif sur Android), et les boutons retour retirent toujours la page.

<a id="dialogs"></a>

## Boîtes de dialogue

Une boîte de dialogue (`dialog()` de `nsh_base` en Rust, `Dialog` en TSX) présente du contenu par-dessus tout le reste, dans sa propre couche de fenêtre native : un view controller présenté sur iOS, une fenêtre de dialogue sur Android, une couche sur toute la fenêtre sur les desktops et le web. Son apparence vous appartient. En Rust, la boîte de dialogue est présentée tant qu'elle est dans la vue (à l'intérieur d'un `when`) et ses enfants la remplissent : dessinez l'arrière-plan et la fenêtre contextuelle comme des vues. En TSX, `class` et `style` stylent la fenêtre contextuelle qui contient ses enfants, `backdropClass` ou `backdropStyle` ajoutent un fond derrière elle, et `open` la contrôle :

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

Échap, le bouton retour d'Android, un appui sur le fond (celui de TSX, celui d'une feuille native en Rust) et un balayage vers le bas sur une feuille la ferment nativement (`close_on_escape`, `close_on_backdrop_press` et `close_on_swipe`, TSX `closeOnEscape`, `closeOnBackdropPress` et `closeOnSwipe`, chacun à true par défaut). En Rust, `on_cancel` signale chaque tentative et `on_close` la fermeture ; retirez donc la boîte de dialogue de la vue à cet endroit ; un fond que votre app dessine la ferme avec son propre gestionnaire d'appui, comme ci-dessus. En TSX, `onOpenChange({ open: false, reason })` vous en informe ; mettez donc `open` à `false` à cet endroit. Pour demander confirmation d'abord, mettez un indicateur à false et gérez l'événement d'annulation (`on_cancel`, `onCancel`), qui signale chaque tentative, puis fermez vous-même la boîte de dialogue. Sur iOS, `.presentation(ModalPresentation::PageSheet)` ou `FormSheet` (`presentation="pageSheet"` ou `"formSheet"`) présente une feuille qui laisse visible ce qui est derrière.

Voir [Dialog](../elements/dialog.md) pour toutes les props. Dans une boîte de dialogue, les variables `env(safe-area-inset-*)` et les insets sont ceux de la boîte elle-même. Pour les boîtes de dialogue système (une alerte avec actions, une feuille d'actions), utilisez [`AlertDialog`](../modules/nsh-base.md#alertdialog) de `nsh_base` (TSX : `nsh/base`).

<a id="the-android-back-button"></a>

## Le bouton retour d'Android

Sur Android, le bouton (ou le geste) retour est traité dans cet ordre :

1. La boîte de dialogue du dessus : elle signale l'annulation (`on_cancel`, `onCancel`), et se ferme tant que `close_on_escape` / `closeOnEscape` vaut true (la valeur par défaut).
2. Vos écouteurs de retour (`on_back_press` en Rust, `BackHandler` de `nsh/mobile` en TSX), le plus récemment ajouté en premier.
3. La pile du dessus : sa page du dessus signale l'appui sur retour, et est retirée tant que `pop_on_back` / `popOnBack` vaut true.
4. Rien ne l'a traité : l'app se ferme.

Un écouteur retourne `true` quand il a traité l'appui, ce qui empêche la pile de retirer la page. Tant qu'un écouteur est enregistré, le geste retour d'Android n'affiche pas d'aperçu du retrait (l'app ne répond qu'à la fin du geste) ; n'ajoutez donc des écouteurs que lorsqu'ils peuvent prendre l'appui :

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

Un écouteur créé dans un effet dure jusqu'à ce que l'effet s'exécute de nouveau ou que son composant disparaisse ; en TSX, la fonction que `BackHandler.on` retourne l'arrête aussi. En TSX, `BackHandler.exitApp()` quitte l'app ; `nsh/mobile` peut aussi être importé sur iOS, où les appels de `BackHandler` retournent immédiatement, de sorte que le même code s'exécute sur les deux plateformes. Voir [Code spécifique à la plateforme](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## Onglets et autres dispositions

Une barre d'onglets est votre propre UI, dessinée à partir de primitives : une rangée de vues pressables et un signal contenant l'onglet sélectionné ; affichez le contenu de l'onglet sélectionné avec [`when` / `<If>`](../elements/control-flow.md) (ou un enfant fonction en TSX). Pour conserver l'état de chaque onglet pendant les changements, donnez à chaque onglet sa propre pile et ses propres routes et gardez-les tous montés, en masquant les inactifs avec `display: none`.

<a id="related"></a>

## Voir aussi

- [`nsh/base`](../modules/nsh-base.md) : la référence de `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` et `Dialog` ; [Zone sûre](../elements/safe-area.md) pour les insets.
- [La barre d'état](../modules/nsh-base.md#status-bar) des pages et des boîtes de dialogue.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler) : `BackHandler`.
