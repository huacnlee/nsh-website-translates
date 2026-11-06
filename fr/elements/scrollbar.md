---
title: "Scrollbar"
description: "Le composant Scrollbar : une barre de défilement à l'apparence propre à l'application, pour toutes les vues défilantes et listes (un thème défini une seule fois) ou pour une seule, placée où l'application le souhaite, dont le curseur suit le contenu et dont les glissements et les appuis font défiler celui-ci, affichée pendant le défilement, au survol ou en permanence, avec des apparitions et disparitions en fondu selon le timing de l'application."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# Scrollbar

Une Scrollbar donne à une vue de défilement ou à une liste une barre aux couleurs de l'app : une fine pilule qui s'élargit sous le pointeur, une piste dans le ton de la marque, une barre à côté d'un en-tête fixe ou le long de deux panneaux. Définie une fois comme thème de l'app, elle fait dessiner par chaque vue de défilement et chaque liste une barre à la place de l'indicateur de la plateforme ([Barres intégrées](#built-in-bars)) ; placée par l'app, elle désigne la vue de défilement qu'elle déplace et se trouve là où l'app la met. Elle gère elle-même son comportement : la longueur et la position du curseur suivent le contenu, la zone visible et le décalage (y compris quand une liste s'allonge ou que la fenêtre est redimensionnée) ; faire glisser le curseur fait défiler le contenu, et un appui sur la piste amène le milieu du curseur à cet endroit ; elle s'affiche pendant le défilement du contenu, tant que le pointeur la survole, ou en permanence, et apparaît et disparaît en fondu de manière native. L'apparence et le timing relèvent de l'app : une `Scrollbar` n'a ni couleurs, ni tailles, ni rayons qui lui soient propres, et ses fondus ne durent pas tant que l'app ne leur donne pas de durée.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `scrollbar()` en crée une avec un setter par prop (`.scroll(..)`, `.thumb_style(..)`) et les méthodes de style typées pour la barre elle-même ; son `scroll` accepte un `ElementRef` (ou un `ScrollbarTarget`).

<a id="built-in-bars"></a>

## Barres intégrées

Chaque vue de défilement et chaque liste peut dessiner une `Scrollbar` à la place de l'indicateur de la plateforme, sans aucune barre à placer : `Scrollbar.setTheme` donne l'apparence de l'app à la barre de chaque vue dont `scrollbar` vaut `true`, une seule fois, au démarrage de l'app. Chaque vue obtient sa propre barre au-dessus de sa zone visible, qui y reste pendant le défilement du contenu (sur le thread principal, comme les vues sticky) et se dessine au-dessus du contenu ; elle suit, défile et s'estompe comme le fait une `Scrollbar` placée.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

Un `ScrollbarTheme` contient les props de barre communes à toutes les vues, ainsi que l'apparence de chaque axe :

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Quand les barres s'affichent : [Quand elle s'affiche](#when-it-shows). |
| `motion` | `ScrollbarMotion` | bascule instantanément, `idle` `2000` | Comment elles apparaissent et disparaissent : [Animation](#motion). |
| `minThumbLength` | `number` | `48` | La longueur minimale d'un curseur. |
| `vertical`, `horizontal` | `ScrollbarLook` | aucun | L'apparence des barres des vues verticales et horizontales : `class` et `style` pour la piste, placée dans la zone visible de la vue ; `thumbClass` et `thumbStyle` ; `accessibilityLabel`. Une vue dont l'axe n'a pas d'apparence conserve l'indicateur de la plateforme. |

Un `setTheme` ultérieur restyle les barres, et `Scrollbar.setTheme(null)` rend aux vues l'indicateur de la plateforme. Une vue peut recevoir un thème propre via sa prop `scrollbar` (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`), que l'app en ait défini un ou non ; `scrollbar={false}` laisse une vue sans barre. Une liste disposée dans la zone visible de son parent (`viewport="parent"`) défile avec cette vue et sa barre. Un `Input` multiligne reçoit aussi la barre de son apparence verticale, au-dessus de son texte, qu'elle fait défiler comme le fait l'indicateur propre de la vue de texte.

<a id="the-scroll-view-it-moves"></a>

## La vue de défilement qu'elle déplace

`scroll` désigne la vue de défilement ou la liste que la barre suit : son `ref`. La barre la trouve une fois qu'elle est à l'écran, de sorte que `ref` peut être défini par un élément situé plus loin dans le même rendu ; écrivez la barre après sa vue de défilement (ou conservez le `ref` dans un signal). Désactivez l'indicateur propre de la vue de défilement avec `scrollbar={false}`, et placez la barre avec `class` : sur le bord de la vue de défilement dans une boîte `relative` qui les entoure toutes deux, ou n'importe où ailleurs à l'écran.

- Le curseur a la longueur correspondant à la part du contenu que montre la zone visible, mesurée le long de la boîte de contenu de la piste (à l'intérieur de son padding), et n'est pas plus court que `minThumbLength`. Sa position correspond à la distance de défilement du contenu ; tant que le contenu rebondit au-delà d'une extrémité, le curseur reste à cette extrémité.
- Un glissement du curseur fait défiler le contenu d'autant que le curseur se déplace. Un appui sur la piste amène le milieu du curseur sous le pointeur, et un glissement se poursuit à partir de là.
- Une barre verticale suit une vue de défilement verticale ; `axis="horizontal"` crée une barre pour une vue horizontale (placez-la le long du bord inférieur). Une barre par axe.
- Les listes fonctionnent de la même façon : le curseur suit la longueur totale de la liste à mesure que les lignes sont mesurées et ajoutées.

<a id="when-it-shows"></a>

## Quand elle s'affiche

| `mode` | Affichage |
|---|---|
| `"scrolling"` (par défaut) | Pendant le défilement du contenu, et jusqu'à `motion.idle` après son arrêt ; le pointeur sur la barre pendant qu'elle s'affiche la maintient. |
| `"hover"` | Tant que le pointeur survole la barre (là où elle s'affiche, même lorsqu'elle est masquée), et comme le fait `"scrolling"`. |
| `"always"` | Toujours. |

Dans tous les modes, elle s'affiche pendant que son curseur est glissé, et reste `motion.idle` après le dernier défilement, glissement ou survol. Tant que le contenu tient dans la zone visible, elle reste masquée. Masquée, la barre est à `opacity: 0` et laisse passer les appuis vers ce qui se trouve en dessous.

<a id="motion"></a>

## Animation

`motion` règle la durée des fondus de la barre, qui s'exécutent nativement, comme le fait `ScrollbarMotion` de `gpui-base` :

| Champ | Défaut | Description |
|---|---|---|
| `idle` | `2000` | Combien de temps la barre reste affichée après le dernier défilement, glissement ou survol, en millisecondes. |
| `enter` | `0` | Le temps qu'elle met à apparaître : son opacité augmente linéairement, un glissement ralentit en fin de course. |
| `exit` | `0` | Le temps qu'elle met à disparaître une fois `idle` écoulé, avec une accélération progressive ; elle glisse hors de sa piste en s'estompant. |
| `entrance` | `"fade"` | La façon dont elle entre : `"fade"` sur place, ou `"slideAndFade"` depuis le bord où elle se trouve (la droite, le bas). |
| `thumbHoverEntrance` | `"fade"` | La façon dont elle entre quand le pointeur sur son curseur masqué la fait apparaître (`"hover"`). |

Sans durées, la barre apparaît et disparaît instantanément. Un fondu inversé à mi-course garde sa vitesse : il dure la part de sa durée qu'il reste à parcourir. Une barre `"always"` n'est jamais animée, pas plus que toute barre tant que l'utilisateur demande moins de mouvement. La piste coupe ce qui glisse. L'animation propre du curseur, comme une largeur qui augmente au `hover:`, relève de son style (`transition-all` sur `thumbClass`).

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | aucun | La vue de défilement ou la liste que la barre suit et déplace (son `ref`). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | L'axe de la vue de défilement : la piste s'étend le long de celui-ci. Lu à la création de la barre. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Quand la barre s'affiche. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | bascule instantanément, `idle` `2000` | Comment elle apparaît et disparaît : [Animation](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | La longueur minimale du curseur sur un long contenu, afin qu'il reste facile à saisir. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le curseur. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour la barre. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La barre : sa piste, là où l'app la place. |

<a id="parts"></a>

## Parties

| Partie | À l'intérieur de | Stylée avec |
|---|---|---|
| La piste | l'endroit où l'app la place | `class`, `style` |
| Le curseur | la boîte de contenu de la piste | `thumbClass`, `thumbStyle` |

La barre dimensionne le curseur le long de l'axe et le déplace ; son épaisseur et sa position en travers de la piste relèvent de l'app (`w-1.5` et `items-end` sur la piste placent un curseur de 6 points à droite). Le padding de la piste tient le curseur à distance de ses extrémités et de ses côtés.

États que montrent les parties :

- La piste : `hover:` sous le pointeur ; c'est un `group`, de sorte que le curseur y reçoit `group-hover:` (un curseur qui s'élargit à l'approche du pointeur).
- Le curseur : `hover:` sous le pointeur, `active:` pendant qu'il est glissé.

La visibilité de la barre est son opacité : appliquez la transparence des couleurs à l'arrière-plan de la piste ou au curseur. Un curseur qui s'élargit reçoit `transition-all` (qui ne retarde jamais la position du curseur, que la barre définit indépendamment des styles du curseur), et `motion-reduce:` le fige pour les personnes qui demandent moins de mouvement.

<a id="accessibility"></a>

## Accessibilité

- La vue de défilement reste ce que font défiler les lecteurs d'écran : ils la déplacent avec leurs propres gestes et lisent son contenu.
- La barre est étiquetée par `accessibilityLabel` pour les lecteurs d'écran qui l'atteignent.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les actions en général.

<a id="platform-notes"></a>

## Notes par plateforme

- Chaque plateforme dessine ce que l'app stylise, et le curseur suit le décalage que chaque plateforme rapporte pour la vue de défilement. Les glissements du curseur et les appuis sur la piste fonctionnent avec une souris, un stylet ou un doigt.
- `"hover"` suit un pointeur de souris ou de pavé tactile (les ordinateurs de bureau et le web) ; sur un écran tactile, la barre s'affiche pendant le défilement du contenu, et sa piste masquée laisse passer les touchers.
