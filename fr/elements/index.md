---
title: "Éléments"
description: "Les primitives et composants de base à partir desquels toute application NSH est construite, en Rust et en TSX, ainsi que les props, événements et méthodes de ref qu'ils partagent tous."
order: 1
source_hash: 84e4cb96ec250ab2
---

# Éléments

Native Shell construit chaque écran à partir d'un petit ensemble d'éléments : des primitives comme `View`, `Text` et `Image`, et des composants de base comme `Button`, `Dialog` et `NavStack`. Chaque primitive est une vue native (une sous-classe de UIView sur iOS et Mac Catalyst, une `View` Android, une vue AppKit, GTK ou Win32 sur les ordinateurs de bureau), créée et disposée par le runtime NSH. Tout ce qu'une application affiche en est composé : les boutons, cartes, lignes et écrans d'une application sont ses propres composants, dessinés avec ces éléments et stylés par l'application, de sorte que son apparence lui appartient entièrement.

Chaque exemple de ces pages existe en Rust et en TSX : choisissez un onglet, et tous les exemples de la page suivent.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

En Rust, les primitives sont des fonctions de `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`) et les composants de base proviennent de la crate `nsh_base`. Les styles sont des méthodes typées (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`, `.bg(..)`), les styles d'état prennent une closure (`.active(|s| s.opacity(0.6))`), les écouteurs sont des closures de leur événement (`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`) et `.child(..)` ajoute des enfants. Un morceau d'UI est une simple fonction qui retourne `impl IntoElement` ; elle s'exécute une seule fois, et les signaux qu'elle lit dans des closures (`text(move || ..)`, `.bg(move || ..)`) mettent à jour ce à quoi ils sont liés. Voir [Créer avec Rust](../docs/rust.md).

En TSX, chaque balise est en PascalCase et désigne une liaison présente dans la portée : les primitives viennent de `nsh`, les composants de base de `nsh/base`. Seuls `<If>` et `<Each>` sont des globaux qui ne demandent aucun import. Une balise en minuscules telle que `<view>` est une erreur de build, car TypeScript la vérifierait par rapport à un type global unique par nom, et les composants génériques comme `List` et `Each` ne pourraient pas inférer le type de leurs éléments. Le compilateur reconnaît les éléments grâce à leurs imports et crée les vues natives sur place, de sorte que les importer ne coûte rien à l'exécution. Voir [JSX et composants](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

## Primitives

Importées depuis `nsh` en TSX, depuis `nsh_core::prelude` en Rust.

| Élément | Rust | Vue native (iOS / Android) | Page |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup ; avec `selectable`, les textes qu'elle contient se sélectionnent ensemble | [View](./view.md), [Sélection de texte](./text-selection.md) |
| `<Text>` | `text(content)` | vue CoreText / vue StaticLayout | [Text](./text.md) |
| `<Image>` | `image(src)` | une vue avec une couche d'image / une vue d'image | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView avec des cellules recyclées | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | une vue qui rejoue un dessin 2D | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | une vue dont la boîte est dessinée sur le GPU par un programme WGSL, sous ses enfants | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer sur une TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | une vue au-dessus de la fenêtre (ou du dialogue dans lequel elle se trouve), placée par rapport à une ancre | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | flux de contrôle : les éléments qu'ils choisissent | [Flux de contrôle](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | une barre au-dessus du clavier sur iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

Le padding et la marge tiennent le contenu à l'écart de l'UI système grâce à `env()` de CSS : `env(safe-area-inset-top)` et les autres bords ([Safe area](./safe-area.md)) et `env(keyboard-inset-height)` ([Clavier](./keyboard.md)).

## Base

Importés depuis `nsh/base` en TSX, depuis la crate `nsh_base` en Rust. Ils gèrent le comportement, l'état, le focus et l'accessibilité, et tirent leur apparence de l'application.

| Composant | Rust | Ce qu'il fait | Page |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | L'alerte et l'action sheet du système | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` et ses parties | `nsh_base::accordion()`, `accordion_item()`, ... | Des sections empilées qui se déplient et se replient sous leurs titres, une à la fois ou plusieurs | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | L'image d'une personne, ou un repli pendant son chargement ou en cas d'échec, et une rangée d'avatars qui n'en montre que les premiers | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | Un contrôle pressable avec ses états et son rôle | [Button](./button.md) |
| `<Carousel>` et ses parties | `nsh_base::carousel()`, `carousel_content()`, ... | Des diapositives affichées une à la fois, balayées nativement, avec précédent / suivant, une pagination, les touches du clavier et une boucle sans couture | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | Un contrôle coché, décoché ou indéterminé, avec un indicateur | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | Une région dont le contenu se déplie et se replie | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | Une palette de commandes : un champ de recherche au-dessus de commandes filtrées nativement, une liste virtualisée, les touches d'une palette Cmd+K | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | Un tableau d'un nombre quelconque de lignes et de colonnes, sélectionnable, triable, avec des colonnes redimensionnables et déplaçables | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | Présente ses enfants au-dessus de tout le reste | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | Les différences entre deux textes ou celles d'un patch, en vue scindée ou unifiée | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | Un espace de travail de séparations, de groupes d'onglets et de docks sur les bords que l'utilisateur organise | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | Un éditeur de code avec coloration syntaxique, plusieurs curseurs, repli et recherche | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | Un aperçu de ce que désigne son déclencheur, tant que le pointeur reste dessus | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | Le champ de saisie de texte natif (UITextField ou UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | Une cible de pression qui ouvre une page, un site ou une route de l'application | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | Menus : popups avec sous-menus en cascade sur les ordinateurs de bureau, sheets sur les téléphones | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | Navigation native : une pile de pages avec l'en-tête et les gestes de retour de la plateforme | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | Un nombre saisi dans un champ ou incrémenté avec des boutons et des touches | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | Un code à usage unique d'un nombre fixe de chiffres, saisi, collé ou rempli automatiquement dans des cellules | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | Les pages d'un ensemble : Précédent, les pages autour de la page courante, des points de suspension et Suivant | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | Des éléments qui contiennent des éléments, dépliés et repliés, un seul sélectionné : virtualisé, un seul arrêt du focus clavier | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | Le cadre d'un graphique et ses marques, dessinés nativement à partir des lignes de l'application | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | Du contenu ancré à un déclencheur, au-dessus de tout le reste | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | Une barre de progression : l'avancement d'une tâche, ou le fait qu'elle est en cours | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | Une option d'un ensemble dont l'utilisateur choisit une seule, et l'ensemble | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | Des panneaux côte à côte ou empilés, avec des poignées qui les redimensionnent | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | Une barre de défilement à l'apparence propre à l'application pour une scroll view ou une liste | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | Une valeur choisie dans une liste d'éléments, avec le clavier, la recherche et des sections | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | Un panneau sur un bord de l'écran au-dessus d'un fond | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | Une valeur, ou une plage de deux, choisie le long d'une piste | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | Un contrôle activé / désactivé avec une piste et un curseur | [Switch](./switch.md) |
| `<Table>` et ses parties | `nsh_base::table()`, `table_row()`, ... | Un tableau des lignes et cellules propres à l'application, avec les rôles d'un tableau | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | Un onglet d'une liste d'onglets, et la liste | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Affiche un document Markdown ou HTML avec des textes et des vues | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | La racine sémantique d'un toast ; des toasts disposés en couches à partir d'un bord | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | Un bouton activé ou désactivé, et une barre d'outils de ces boutons | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | Une barre de boutons, de toggles et de liens, un seul arrêt du focus clavier | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | Une indication à côté de son déclencheur, au survol ou lorsqu'un doigt reste appuyé | [Tooltip](./tooltip.md) |

> [!NOTE]
> Une chaîne n'est dessinée que dans un `Text`. Une chaîne enfant d'un `View` ne crée aucune vue native et ne participe pas à la mise en page.

<a id="common-props"></a>

## Props communes

Chaque primitive accepte les props ci-dessous (le type `CommonProps` en TSX ; les traits `Styled`, `Interactive` et `Accessible` en Rust). Les pages des éléments ne listent que leurs propres props. La colonne Rust indique le nom de la méthode du builder.

<a id="styling"></a>

### Style

| Prop | Rust | Type | Description |
|---|---|---|---|
| `style` | méthodes `Styled` typées ; `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` pour `<Text>` et `<Input>`, `ImageStyle` pour `<Image>`) | Style en ligne, ou tableau de styles fusionnés de gauche à droite (les entrées falsy sont ignorées ; les tableaux peuvent s'imbriquer, de sorte que `style={[base, props.style]}` accepte un `props.style` qui est lui-même un tableau). Prend le pas sur `class`. Voir la [référence des styles](../modules/style-reference.md). |
| `class` | méthodes `Styled` typées (`.flex_row().gap_2().p_4()`) | `string` | Classes Tailwind, résolues nativement (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). Les dernières classes l'emportent sur les précédentes. Voir [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | Classes appliquées tant que leur valeur est truthy (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | Ignore les pressions (sans retour visuel de pression non plus), applique les styles `disabled:`, désactive les contrôles tels que les inputs, et les lecteurs d'écran indiquent qu'il est désactivé (`accessibilityState.disabled`). |

<a id="presses-and-feedback"></a>

### Pressions et retour visuel

La gestion des pressions s'exécute nativement : la plateforme reconnaît la pression et applique les styles de pression de l'application, et le code de l'application ne l'apprend qu'ensuite. Seule la vue pressable la plus interne répond ; à l'intérieur des scroll views, un press-in attend environ 130 ms afin qu'un défilement puisse démarrer en premier.

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | Un tap s'est terminé à l'intérieur de la vue. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | Le doigt est resté posé pendant `delayLongPress`. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | Un doigt s'est posé sur la vue. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | Le doigt s'est levé ou a quitté la vue. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | Millisecondes avant qu'une pression devienne une pression longue. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | Étend la zone tactile au-delà des limites, en points. |

`PressEvent` est `{ position, pagePosition, modifiers, clickCount }` : l'endroit où se trouvait le pointeur dans la vue et dans sa vue racine (`Point`s), les touches de modification maintenues au début de la pression et les clics consécutifs (2 pour un double clic). Lorsque la plateforme ne signale aucun pointeur, c'est l'origine de la vue, sans touches et avec un seul clic.

La clé de style `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` en Rust, les classes `pointer-events-*`) détermine quels touchers la vue et les vues qu'elle contient reçoivent : `"none"` aucune des deux (une vue à l'intérieur qui définit `"auto"` les reçoit de nouveau), `"box-none"` seulement les vues qu'elle contient, `"box-only"` seulement la vue elle-même ([toucher et gestes](../docs/touch-and-gestures.md#pointerevents)).

Le retour visuel de pression est celui de l'application : `activeStyle` (ou les classes `active:`, `.active(..)` en Rust) s'applique tant que la vue est pressée, nativement, sans aller-retour avec le code de l'application (voir ci-dessous).

<a id="state-styles"></a>

### Styles d'état

Des styles qui s'appliquent tant que la vue est dans un état, par-dessus ses propres styles, nativement. Chacun est la forme objet d'une variante Tailwind. Les derniers états l'emportent (selected, checked et indeterminate, puis hover, focus, active) ; `disabledStyle` l'emporte sur tous, et les autres ne s'appliquent pas tant que la vue est désactivée. Chacun prend le style propre à l'élément : un `TextStyle` sur un `<Text>`, un `InputStyle` sur un `<Input>`, un `ImageStyle` sur un `<Image>`, un `ViewStyle` ailleurs.

| Prop | Rust | Variante de classe | S'applique |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | Pendant la pression. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | Tant qu'un pointeur est au-dessus de la vue. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | Tant que la vue a le focus. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | Tant que la vue ou une vue qu'elle contient a le focus (le contenu d'un `Overlay` compte comme étant à l'intérieur de la vue dans laquelle il se trouve). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | Tant que `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | Tant que `accessibilityState.checked` vaut `true` (une checkbox, un switch, un radio ; `"mixed"` n'est pas coché). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | Tant que `accessibilityState.checked` vaut `"mixed"` (une checkbox ni cochée ni décochée). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | Tant que `accessibilityState.selected` vaut `true` (un `Button` sélectionné, un onglet). |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | Tant que `accessibilityState.expanded` vaut `true` (le déclencheur d'un `Popover` ou d'un `Menu` tant que sa popup est ouverte). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | Tant que `accessibilityState.pressed` vaut `true` (un bouton toggle activé ; `"mixed"` n'est pas pressé). Pas `activeStyle`, une pression en cours. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
<a id="hover"></a>

### Survol

L'app détecte l'arrivée de la souris sur une vue, son déplacement au-dessus d'elle et sa sortie : sur macOS, Windows, Linux, le backend GPUI et dans les navigateurs de bureau, avec le pointeur d'un iPad ou la souris d'un Mac sous iOS, et avec une souris ou un stylet sous Android. Les styles de survol (`hover:`, `.hover(..)`) stylent les vues survolées aux mêmes endroits.

| Prop | Rust | Type | Description |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | La souris est arrivée sur la vue ou sur une vue à l'intérieur (le `mouseenter` du DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | La souris s'est déplacée sur la vue (ou sur une vue à l'intérieur), avec ou sans bouton enfoncé, ou une touche de modification a été pressée ou relâchée alors que la souris y reste immobile sans bouton enfoncé (le `mousemove` du DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | La souris a quitté la vue et les vues à l'intérieur, ou la fenêtre ; `e` est sa dernière position (le `mouseleave` du DOM). |

Comme le `:hover` de CSS et le `mouseenter` du DOM, une vue est considérée comme survolée tant que la souris est sur elle ou sur n'importe quelle vue à l'intérieur : les vues qui entourent celle située sous la souris reçoivent donc aussi `onMouseEnter` (de l'extérieur vers l'intérieur ; `onMouseLeave` de l'intérieur vers l'extérieur). Les événements arrivent après coup et jamais pour les touchers. Une vue retirée de sous la souris reçoit `onMouseLeave`, sous Linux et Windows au prochain mouvement de la souris.

`MouseEvent` indique où se trouve la souris, comme le `MouseMoveEvent` de GPUI : `position` dans la vue (un `Point` en points, ses transformations annulées), `pagePosition` dans la vue racine où elle se trouve, comme le fournissent les touchers, les `modifiers` maintenues (`control`, `alt`, `shift`, `platform` : Command sur les plateformes Apple, la touche Windows ailleurs), et `pressedButton`, le bouton maintenu enfoncé (`"left"`, `"right"`, `"middle"`, `"back"` ou `"forward"`, le `MouseButton` de GPUI) ou `null` ; en Rust `position`, `page_position`, `modifiers` et `pressed_button`. Sur les ordinateurs de bureau et le web, un glissement est aussi un toucher (`onTouchMove`, le responder), et ses mouvements parviennent à `onMouseMove` avec `pressedButton` activé : un retour visuel qui ne suit que le survol les ignore ; sous iOS et Android, le survol signale le pointeur sans bouton enfoncé. Les mouvements arrivent au plus une fois par image, le dernier seulement, et toujours avant le `onMouseLeave` qui les suit, de sorte qu'un gestionnaire peut redessiner à chaque mouvement :

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

<a id="tooltips"></a>

### Infobulles

`tooltip` donne un indice à n'importe quel élément, affiché au-dessus de lui sur les ordinateurs de bureau (macOS, Windows, Linux, le backend GPUI et les navigateurs de bureau) une fois que le pointeur est resté une demi-seconde dessus, jusqu'à ce que le pointeur parte ou appuie dessus. Les téléphones et les tablettes n'en affichent aucune. L'indice ne capte jamais le pointeur ni les appuis : l'élément fonctionne exactement comme sans lui.

| Prop | Rust | Type | Description |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | L'indice, un élément que l'app stylise : un [`Tooltip`](tooltip.md) de `nsh/base` est l'infobulle elle-même, avec son placement, son délai et ses événements ; tout autre élément est affiché tel quel. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

Le `Tooltip` définit lui-même son apparence, son placement, son délai et ses événements, comme le `.tooltip(..)` de GPUI en reçoit un. Une app qui a beaucoup d'infobulles garde un petit composant à elle qui enveloppe un texte dans son `Tooltip`.

<a id="context-menus"></a>

### Menus contextuels

`onContextMenu` indique à une vue que le bouton secondaire a été pressé sur elle : un clic droit, un Control-clic sur macOS, un clic à deux doigts sur un pavé tactile, le clic secondaire du pointeur d'un iPad ; dans les navigateurs, aussi la touche menu du clavier. Ouvrez-y le menu propre à l'app ; en TSX, [`Menu.popup`](../modules/nsh-desktop.md) affiche celui du système :

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | Type | Description |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | Le bouton secondaire a été pressé sur la vue ou sur une vue à l'intérieur. |

`ContextMenuEvent` contient `position` dans la vue, `pagePosition` dans sa vue racine (là où `Menu.popup` place un menu : `Menu.popup(items, e.pagePosition)`) et les `modifiers` ; en Rust `position`, `page_position` et `modifiers`. La vue la plus proche qui écoute, depuis celle située sous le pointeur vers l'extérieur, le reçoit. Un champ de saisie, ou un texte sélectionnable avec un menu d'édition (Windows, le backend GPUI, les navigateurs), plus proche que cette vue affiche à la place son propre menu. La plateforme en décide au moment où le bouton est enfoncé, d'après ce qui est monté : le gestionnaire est donc informé après coup et rien n'a à être annulé. Une vue `disabled` laisse le clic au plus proche écouteur activé qui l'entoure. Sur les écrans tactiles, un appui long ouvre les menus : gérez `onLongPress` avec la même fonction.

<a id="keyboard-focus"></a>

### Focus clavier

Sur macOS et le web, Tab déplace le focus clavier entre ses arrêts dans l'ordre de l'arbre : les champs de saisie, les vues qui prennent les appuis, et chaque vue `focusable`. Les styles de focus (`focus:`, `.focus(..)`) stylent la vue qui a le focus, et Retour ou Espace l'actionne lorsqu'elle prend les appuis. Un clic appuie sur une vue sans lui donner le focus, de sorte que les styles de focus ne s'affichent que pour le focus clavier.

Le focus et les appuis sont distincts. Une vue qui prend les touches tant qu'elle a le focus (un graphique, un curseur, une liste qui déplace sa sélection avec les flèches) définit `focusable` et lie ses touches pendant qu'elle a le focus (`onFocus` / `onBlur` avec [`keymap`](../modules/nsh.md#keymap)) ; un appui sur elle atteint tout de même un élément pressable qui l'entoure, comme une carte qui ouvre une page.

Le `focus()` d'une ref déplace le focus clavier vers un arrêt comme le fait Tab (ses styles de focus s'affichent et `onFocus` se déclenche), par exemple pour le rendre au déclencheur d'une popup qui s'est fermée, et `blur()` le retire.

Une vue qui entoure le focus se stylise avec `focus-within:` (`focusWithinStyle`, `.focus_within(..)`) tant que le focus est sur elle ou sur n'importe quelle vue à l'intérieur : le cadre d'un champ autour de l'entrée qui édite, une barre d'outils pendant que l'un de ses boutons a le focus. Le contenu d'un `Overlay` est à l'intérieur de la vue dans laquelle se trouve la superposition, où qu'il s'affiche : une popup compte donc comme faisant partie de la vue qui contient son déclencheur. En Rust, un composant détecte l'arrivée du focus dans un élément et sa sortie avec les `on_focus_in(..)` et `on_focus_out(..)` de sa ref : passer d'une vue à une autre à l'intérieur n'est ni l'un ni l'autre.

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` pour les vues qui prennent les appuis | Indique si la vue est un arrêt de Tab. `true` en fait un arrêt pour n'importe quelle vue, qu'elle prenne les appuis ou les laisse aux vues qui l'entourent ; `false` laisse un élément pressable au pointeur (un fond qui ferme un popover, des lignes entre lesquelles les flèches se déplacent). |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (ou `focus()`) a donné le focus clavier à la vue. |
| `onBlur` | `.on_blur(..)` | `() => void` | | Le focus clavier a quitté la vue. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### Mise en page et identité

| Prop | Rust | Type | Description |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` est le cadre de la vue relatif à son parent, `{ origin, size }`, après chaque mise en page qui le modifie. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | La ref de l'élément (voir [méthodes de ref](#ref-methods)) : `ViewRef`, ou le type propre de l'élément par-dessus. `ref={el}` affecte une variable, `ref={fn}` appelle une fonction. |
| `nativeID` | `.native_id(id)` | `string` | Nomme la vue pour les autres, par exemple le `InputAccessoryView` auquel un champ de saisie fait référence. |
| `testID` | `.test_id(id)` | `string` | Un identifiant pour les tests d'interface (sous Android, l'identifiant de ressource de la vue). |
| `key` | `.key(key)` | `string` | L'identité de l'élément parmi ses frères. |

<a id="gestures-driving-animated-values"></a>

### Gestes pilotant des valeurs animées

Ces props lient un geste à des [valeurs animées natives](../modules/nsh.md#animation) qui évoluent sur le thread d'interface, sans aucun travail dans le code de l'app à chaque image. Voir [toucher et gestes](../docs/touch-and-gestures.md).

| Prop | Rust | Type | Description |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | Les glissements pilotent ces valeurs (en points). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Un glissement a commencé. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Un glissement s'est terminé, avec la vitesse au relâchement (par exemple pour démarrer un `decay`). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | Les pincements à deux doigts pilotent `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Un pincement a commencé / s'est terminé. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | Les rotations à deux doigts pilotent `angle` (en degrés). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Une rotation a commencé / s'est terminée. |

`PanEvent` est `{ cancelled, translation, velocity, value? }` (en Rust `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`) : indique si le système a annulé le glissement, la translation depuis le début et la vitesse en points par seconde (`Point`s), ainsi que les valeurs liées à cet instant, `{ x?, y? }` pour les axes que `pan` lie (un glissement peut saisir une valeur en cours d'animation).

<a id="raw-touches-and-the-responder-system"></a>

### Touchers bruts et système de responder

Pour les gestes que les props ci-dessus ne couvrent pas, chaque élément accepte les props de toucher et de responder : `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (et leurs formes `…Capture`), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (et `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` et `onResponderTerminationRequest`. Chaque gestionnaire reçoit un `GestureResponderEvent` (`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...). Renvoyer `true` depuis `onResponderGrant` empêche les vues de défilement natives de prendre les touchers. `panActivation` (`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) ne fait de la vue le responder qu'une fois que la plateforme a activé son panoramique, de sorte que les glissements à l'intérieur des vues de défilement laissent l'autre axe à celles-ci ([Toucher et gestes](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)). `PanResponder` dans [`PanResponder`](../modules/nsh.md#panresponder) s'appuie sur eux. En Rust, `.on_touch(..)` reçoit chaque toucher (`TouchEvent`), `.claim_touches(..)` décide quand la vue les prend, et `.on_responder_grant(..)`, `.on_responder_move(..)`, `.on_responder_release(..)` et les autres suivent le responder.

<a id="accessibility"></a>

### Accessibilité

| Prop | Rust | Type | Description |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | La vue forme un seul élément pour les technologies d'assistance ; ses enfants ne sont pas exposés séparément. |
| `accessibilityLabel` | `.label(..)` | `string` | Ce que lisent les lecteurs d'écran. Les vues sans libellé lisent leurs textes. |
| `accessibilityHint` | `.hint(..)` | `string` | Ce que fait l'activation de l'élément. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | Ce qu'est l'élément (`"button"`, `"header"`, `"link"`, `"switch"`, …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | L'état que signalent les technologies d'assistance (`checked` et `pressed` peuvent valoir `"mixed"` ; `current` vaut `true` ou `"page"`, `"step"`, `"location"`, `"date"`, `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | Le niveau d'un titre (1 pour le plus haut), la profondeur d'un élément d'arbre (1 en haut). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | La valeur d'un élément de type plage ou textuel. |
| `accessibilityElementsHidden` | | `boolean` | Masque la vue et son sous-arbre aux technologies d'assistance. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Indique si la vue est exposée. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Actions personnalisées proposées aux technologies d'assistance. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | L'utilisateur a invoqué l'une des `accessibilityActions`. |

Voir [accessibilité](../docs/accessibility.md).

<a id="platform-only-props"></a>

### Props propres à une plateforme

Les props qui n'existent que sur une plateforme vont dans un objet portant son nom en TSX, de sorte que les props partagées restent les mêmes partout. Seul l'objet de la plateforme courante est envoyé ; les autres sont ignorés. Les builders Rust les reçoivent sous forme de méthodes qui s'appliquent sur leur plateforme.

| Prop | Description |
|---|---|
| `ios={{…}}` | iOS et Mac Catalyst. `<Input>`, `Dialog` et `WebView` ajoutent leurs propres clés. |
| `android={{…}}` | Android. Chaque élément accepte `ripple`, `elevation` et `accessibilityLiveRegion` (ci-dessous). |
| `desktop={{…}}` | Plateformes de bureau et navigateurs de bureau ; ignoré sur mobile. Chaque élément accepte `windowDrag` (ci-dessous). |
| `web={{…}}` | Navigateurs ; ignoré ailleurs. |

| Clé de `android` | Rust | Type | Description |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | L'effet d'ondulation Material pendant l'appui. |
| `elevation` | `.elevation(px(2.0))` | `number` | L'ombre Material (en points), d'après la forme de la vue. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | La façon dont les changements de la vue sont annoncés à TalkBack. |

| Clé de `desktop` | Rust | Type | Description |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | Appuyer sur la vue fait glisser la fenêtre, comme le ferait sa barre de titre ; `false` garde cliquable une partie d'une vue déplaçable. Voir [une barre de titre à vous](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

Voir [code spécifique à une plateforme](../docs/platform-specific.md).
<a id="ref-methods"></a>

## Méthodes de ref

En TSX, `ref` reçoit la ref de l'élément, dont le type est propre à l'élément : `ViewRef` (`focus`, `blur`, `measure`) pour
`View`, `Text`, `Image`, `Canvas`, `Overlay` et `Shader`, et un type construit sur `ViewRef` avec les méthodes de l'élément pour les
autres : `InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef`
(`Video`) et `NativeComponentRef` (composants natifs). En Rust, `element_ref()` crée un handle `ElementRef` que
`.element_ref(&handle)` attache. Leurs méthodes envoient des commandes à la vue native, dans l'ordre avec les changements effectués
avant elles au cours du même tour. Chaque page d'élément indique celles qui s'y appliquent. Typez une variable de ref avec le type propre
à son élément (`let field!: InputRef` pour un `<Input>`) : une variable typée `ViewRef` ne convient pas à un élément dont la ref possède ses propres méthodes.

| Méthode | Rust | Ref | Description |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | Donne le focus à un `<Input>` (affiche le clavier), ou donne le focus clavier à une vue qui reçoit les appuis / le retire. |
| `measure()` | `measure()` | `ViewRef` | [Où se trouve la vue](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | Sélectionne `start..end` en unités UTF-16 ; un curseur sans `end`. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | Défile jusqu'à un décalage. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (un `<Scroll>` zoomable) | Zoome à `scale` autour d'un point du contenu. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | Défile jusqu'à un décalage le long de l'axe de la liste. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | Fait défiler jusqu'à rendre un élément visible. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | Défile jusqu'à la fin du contenu. |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | Contrôle la page. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | Saute à un instant. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | Appelle une commande d'un composant natif enregistré ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## Pourquoi les handlers ne bloquent jamais l'UI

Le thread principal n'attend jamais le code de l'app. Lorsque le système a besoin d'une réponse immédiate (ce texte peut-il changer, le bouton retour peut-il dépiler, cette sheet peut-elle se fermer), NSH y répond nativement à partir de props définies au préalable (`maxLength`,
`popOnBack`, `closeOnSwipe`, …), et l'événement parvient à l'app ensuite. C'est pourquoi un tel comportement
est une prop, et non la valeur de retour d'un handler.
