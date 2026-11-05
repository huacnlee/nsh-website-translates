---
title: "NavStack"
description: "Piles de navigation natives : NavStack, NavPage et createNavStack, empilement et dépilement de pages, slots d'en-tête, fermeture d'une page et manière dont chaque plateforme affiche une pile."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

Une pile de navigation affiche une page à la fois et conserve les pages situées en dessous : `UINavigationController` sur iOS et Mac
Catalyst, avec l'en-tête système et le balayage pour revenir, et une pile de pages avec une barre d'outils et le retour prédictif sur Android.
Sur les plateformes de bureau (macOS, Windows, Linux, GPUI) et le web, chaque page affiche en haut l'en-tête propre à l'app, et les
touches de retour ainsi que le bouton retour du navigateur dépilent la page. `NavStack` est la pile, `NavPage` l'une de ses pages.

La pile gère le comportement de navigation (transitions, gestes et boutons de retour, état des pages tant qu'elles sont
recouvertes) ; le contenu des pages et l'en-tête sur les plateformes de bureau relèvent de l'app.

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

Sur iOS et Android, la page affiche l'en-tête système avec `title` et un bouton de retour ; sur les plateformes de bureau et le web, elle
affiche `header`. Une app qui cible uniquement les téléphones omet `header` ; une app qui cible uniquement les plateformes de bureau omet les
options de l'en-tête système. Le [Guide de navigation](../docs/navigation.md) présente la navigation d'une app complète : l'état de la
pile, les dialogues, le bouton retour d'Android et les onglets.

<a id="how-a-stack-works"></a>

## Fonctionnement d'une pile

- Les pages de la pile sont des **routes** : des valeurs de votre choix, du bas de la pile vers le haut. Une route
  désigne généralement la page et porte ses paramètres.
- En TSX, les routes résident dans l'état que `createNavStack` crée. `NavStack` appelle sa fonction enfant une fois pour chaque push
  et affiche le résultat comme une page. Il conserve cette page tant que sa route est dans la pile, de sorte qu'une page garde son état
  (signaux, position de défilement, champs de saisie) pendant que d'autres pages la recouvrent.
- En Rust, les enfants de la pile sont ses pages : un `nav_page()` placé dans `nav_stack()` est empilé, et un autre retiré est
  dépilé. Conservez les routes dans un signal et affichez les pages avec `each(..)`, indexées par route, afin que les pages en dessous conservent
  leur état.
- Chaque push crée une page distincte, y compris lorsque la même valeur de route est empilée deux fois.
- Lorsque l'utilisateur quitte une page de façon native (bouton retour, balayage pour revenir, retour Android, touches de retour des
  plateformes de bureau, retour du navigateur), la page disparaît. En TSX, la pile retire sa route de l'état, de sorte que `nav.routes()` correspond toujours
  à ce que voit l'utilisateur. En Rust, la page signale `on_dismiss`, où vous retirez sa route (et les routes au-dessus).
- En TSX, une fonction enfant qui renvoie autre chose qu'un `<NavPage>` produit une page avec les options par défaut. Renvoyez
  un `<NavPage>` pour définir son en-tête et ses autres options.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

Crée l'état d'une pile qui démarre avec `routes`, de bas en haut. Créez-le une seule fois, par exemple au niveau du module,
et passez-le à `<NavStack state>`. N'importe quel code peut l'importer pour naviguer.

| Membre | Description |
|---|---|
| `routes: Accessor<readonly R[]>` | Les routes, de bas en haut. Réactif. |
| `push(route: R): void` | Empile une page. |
| `pop(count?: number): void` | Dépile `count` pages (1 par défaut). Au moins une page reste toujours. |
| `popToRoot(): void` | Dépile jusqu'à la première page. |
| `replace(route: R): void` | Remplace la page du haut. |
| `setRoutes(routes: R[]): void` | Remplace les pages ; une route qui reste (la même valeur) conserve sa page et son état. |
| `remove(route: R): void` | Retire la page la plus haute de `route` (comparée avec `===`), où qu'elle se trouve dans la pile. |

En Rust, les mêmes opérations sont des modifications de votre signal de routes : `routes.update(|r| r.push(route))` empile,
`r.pop()` dépile, `r.truncate(1)` dépile jusqu'à la première page que vous y conservez, et `routes.set(..)` remplace les pages.

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

| Prop | Rust | Type | Description |
|---|---|---|---|
| `state` | les pages sont ses enfants | `NavStackState<R>` | L'état qui contient les routes (`createNavStack`). Obligatoire. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | Affiche une route. Renvoyez un `<NavPage>` pour ses options. Obligatoire. |
| `style`, `class` | méthodes de style | | Le style de la pile ; généralement `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | Permet de retrouver la pile dans les tests et `nsh test --trace`. |

La fonction enfant TSX reçoit la valeur de la route elle-même et un accesseur de sa position dans la pile.

<a id="navpage-props"></a>

## Props de NavPage

`NavPage` est une page d'une pile. Elle contient le contenu de la page, son `header` sur les plateformes de bureau et le web, et les
options de l'en-tête système sur iOS et Android. En Rust, `nav_page()` renvoie la page et ses méthodes de construction portent
le nom des props en snake_case.

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | aucun | Plateformes de bureau et web : l'en-tête de la page, placé en haut de la page, aussi large que la page et aussi haut que sa mise en page l'exige, avec le contenu en dessous. |
| `title` | `.title(..)` | `string` | aucun | iOS et Android : le titre de l'en-tête système. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS et Android : l'en-tête système est affiché. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS et Android : le contenu s'étend sous un en-tête système transparent. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS : la barre d'onglets système disparaît tant que cette page est au sommet, en se déplaçant pendant la transition — avec la même animation que la page, et la barre n'est jamais reconstruite ; elle revient lorsque la page est dépilée. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS : un grand titre qui se réduit dans la barre lorsque le contenu défile ; le contenu défile sous l'en-tête. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | aucun | iOS et Android : le libellé du bouton de retour qui ramène à cette page (sur Android, sa description pour les lecteurs d'écran). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS et Android : le bouton de retour est affiché. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | aucun | iOS et Android : contenu au bord de début de l'en-tête système, à la place du bouton de retour. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | aucun | iOS et Android : contenu au bord de fin de l'en-tête système. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | aucun | iOS et Android : contenu qui remplace le titre. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | plateforme | iOS et Android : les couleurs de l'en-tête système : son arrière-plan, celle du titre (`color`) et celle des boutons (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | aucun | Les mêmes couleurs sous forme de classes : `bg-*`, `text-*` pour le titre, `tint-*` pour les boutons (en Rust `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, des couleurs de thème qui suivent l'apparence). `headerStyle` l'emporte sur elles. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | Les boutons de retour et le balayage pour revenir dépilent la page. Voir [Quitter une page](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | Le geste de retour interactif dépile la page : balayage pour revenir sur iOS, retour prédictif d'Android qui suit le doigt. Les boutons de retour dépilent dans les deux cas. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | La façon dont la page entre et sort. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | aucun | La page entre et sort au moyen d'un shader WGSL à la place de son `animation` : `shade(uv)` lit la page en dessous sous le nom `sample_from` et cette page sous le nom `sample_to` pendant que `nsh.progress` va de 0 à 1 sur `duration` millisecondes (350 par défaut), puis de 1 à 0 lorsque la page sort. Lorsque le système demande de réduire les animations, la page utilise son propre `animation`. Voir [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | aucun | iOS et Android : la barre d'état tant que la page est au sommet. Voir [Barre d'état](../modules/nsh-base.md#status-bar). |
| `style`, `class` | méthodes de style | | aucun | Le style de la page. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu. |
| `testID` | `.test_id(..)` | `string` | aucun | Permet de retrouver la page dans les tests et `nsh test --trace`. |

<a id="navpage-events"></a>

## Événements de NavPage

| Événement | Rust | Description |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | L'utilisateur a appuyé sur retour sur la page (bouton de retour de l'en-tête, retour Android, Échap, Alt+Gauche ou bouton retour d'une souris sur les plateformes de bureau, retour du navigateur), que `popOnBack` ait autorisé ou non le dépilement. |
| `onDismiss` | `.on_dismiss(..)` | L'utilisateur a dépilé la page (bouton de retour, balayage) ; sa route a disparu en TSX, et Rust la retire ici. |

<a id="header-slots"></a>

## Slots de l'en-tête

`header`, `headerLeft`, `headerRight` et `headerTitle` sont des slots : des éléments ordinaires qui lisent des signaux, gèrent les appuis
et se mettent à jour tant que la page est affichée. `header` constitue l'intégralité de l'en-tête de l'app sur les plateformes de bureau et le web ; les trois autres
vont dans l'en-tête système sur iOS et Android.

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

Le contenu de la page commence sous l'en-tête : sous un en-tête système opaque sur iOS et Android, sous `header` sur les
plateformes de bureau et le web. Avec `headerTransparent`, `headerLargeTitle` ou `headerVisible={false}`, il commence en haut de
la page sur iOS et Android ; utilisez [`env(safe-area-inset-top)`](./safe-area.md) ou `safeAreaInsets()` pour le maintenir à distance de
l'en-tête et de la barre d'état.

Sur iOS, `headerVisible={false}` garde le balayage pour revenir activé tant que `popOnSwipe` et `popOnBack` sont vrais.
Un geste de retour interactif accepté met fin à l'édition au début de la transition, de sorte que le clavier se ferme pendant
le glissement. L'annulation de la transition rend le focus au même éditeur si aucun autre contrôle ne l'a pris.

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

## Quitter une page

`popOnBack={false}` garde l'utilisateur sur une page, par exemple tant qu'un formulaire contient des modifications non enregistrées. Tant qu'il est faux, le balayage pour
revenir est désactivé et les boutons et touches de retour appellent `onBackPress` sans dépiler. Interrogez l'utilisateur, puis dépilez vous-même :

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
> Le système demande si l'utilisateur peut revenir en arrière sur le thread principal, au moment où l'utilisateur agit, et le thread principal
> n'attend jamais JS ni votre code Rust. NSH répond donc à partir de la valeur de `popOnBack` déjà montée. Définissez
> `popOnBack={false}` dès qu'il y a quelque chose à perdre, avant que l'utilisateur ne revienne en arrière.

`onBackPress` est appelé à chaque appui sur retour, y compris lorsque la page est dépilée, il vous indique donc aussi que l'utilisateur est revenu en arrière.
Pour désactiver uniquement le geste de balayage et conserver les boutons de retour, utilisez `popOnSwipe={false}`. La confirmation elle-même est une
[AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## Notes par plateforme

- **iOS** : `UINavigationController` avec l'en-tête système, le bouton de retour et le balayage pour revenir ; `headerLargeTitle` est le grand titre
  d'UIKit. Les changements de pile qui arrivent pendant une transition en cours sont appliqués à la fin de celle-ci.
- **Android** : une pile avec une barre d'outils. Le bouton retour système dépile la page du haut, avec le retour prédictif sur les versions d'Android
  qui le prennent en charge ; la description de la flèche de retour pour les lecteurs d'écran est le `headerBackTitle` de la page inférieure, ou celle du
  système. Voir `BackHandler` dans [`BackHandler`](../modules/nsh-mobile.md#backhandler) pour gérer vous-même le bouton retour.
- **Mac Catalyst** : comme sur iOS.
- **Plateformes de bureau (macOS, Windows, Linux, GPUI) et web** : chaque page affiche son `header` en haut et son contenu
  en dessous. Échap, Alt+Gauche et le bouton retour d'une souris reviennent en arrière sur les plateformes de bureau, le bouton retour du navigateur sur le web.

Pour du contenu affiché au-dessus de la pile et de son en-tête, comme une feuille ou un parcours en plein écran, utilisez un
[Dialog](./dialog.md).
