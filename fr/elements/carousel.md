---
title: "Carousel"
description: "Carousel et ses parties : des diapositives affichées une à la fois, déplacées par balayage, à la molette et au pavé tactile grâce au défilement natif de la plateforme, par des commandes précédent et suivant, une pagination et le clavier, avec un bouclage sans rupture aux extrémités. Le carousel gère la diapositive affichée, l'accrochage, le bouclage, les touches et l'accessibilité ; l'apparence et chaque libellé relèvent de l'application."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

Un carousel affiche les slides une à la fois : les photos d'un produit, les étapes d'un onboarding, une bannière qui avance toute seule, une rangée de cartes. `Carousel` gère le comportement : quelle slide est affichée, le balayage entre elles, les contrôles précédent et suivant, une pagination, les touches fléchées, le bouclage aux extrémités et ce qu'entendent les lecteurs d'écran. Ses parties le retrouvent par le contexte, de sorte que l'app les agence librement dans son propre layout. L'apparence relève de l'app : le carousel n'a ni couleurs, ni tailles, ni flèches, ni points, ni libellés propres.

Le contenu est une vue de défilement native. Un doigt, la molette et le pavé tactile déplacent les slides sur le thread principal de la plateforme, dans la même frame que le pointeur, et au relâchement le contenu s'aimante sur la slide la plus proche, une slide par geste. Quand il s'immobilise, le carousel signale la slide avec `onChange`. Les contrôles, la pagination, les touches et le `index` de l'app font défiler nativement le contenu jusqu'à la slide, avec animation.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` et ses parties viennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La slide affichée appartient à l'app (`index`) : un balayage, un contrôle ou une touche signale la suivante avec `onChange`, et le carousel défile vers ce que l'app renvoie en `index`. La slide sur laquelle s'arrête un balayage reste affichée jusqu'à ce que l'app ait répondu à `onChange` : elle reste quand l'app la renvoie comme `index`, et le contenu revient en ressort à la slide de l'app, avec animation, quand l'app garde la valeur `index` qu'elle avait. Sans `index`, le carousel garde la sienne, à partir de `defaultIndex`. En Rust, `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()` et `carousel_pagination_item()` construisent les parties, avec un setter par prop (`.index(..)`), un listener par événement (`.on_change(..)`), les méthodes de style typées et `.child(..)` pour leur contenu.

## Props

<a id="carousel-1"></a>

### Carousel

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | aucune | La slide affichée, à partir de 0, bornée au nombre de slides. Elle appartient à l'app : les changements sont signalés avec `onChange`, et toute nouvelle valeur `index` fait défiler jusqu'à cette slide, avec animation. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | La slide affichée au départ, tant que `index` n'est pas défini. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Le sens dans lequel les slides se suivent ; lu à la création du carousel. Les touches fléchées d'un carousel vertical sont Haut et Bas. |
| `looping` | `.looping(..)` | `boolean` | `false` | Les slides bouclent : après la dernière vient la première, et avant la première vient la dernière, sans couture, aussi bien pour un balayage, précédent, suivant, les touches que pour le `index` de l'app ([Boucle](#looping)). Lu à la création du carousel. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Le nom que les lecteurs d'écran donnent au carousel, une région : ce que sont ses slides (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le `CarouselContent`, les contrôles et tout ce que l'app dispose autour. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La mise en page du carousel : où vont le contenu et les contrôles. |

### CarouselContent

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | aucune | Les `CarouselItem`s, chacun un enfant du contenu. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La taille du viewport et la piste que forment les slides à l'intérieur : un `gap` entre elles, un padding qui laisse apercevoir les slides voisines de celle affichée. |

### CarouselItem

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Le nom que les lecteurs d'écran donnent à la slide, un groupe : sa place parmi les autres et ce qu'elle montre (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le contenu de la slide. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | Sa taille selon l'axe (`w-full` pour une slide par vue, `basis-1/3` pour trois) et son apparence. Dans un carousel qui boucle, sa translation appartient au carousel : placez un `transform` sur une vue à l'intérieur. |

### CarouselPrevious, CarouselNext

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Le nom du contrôle, quand ses enfants n'ont pas de texte qui le dise (une icône de flèche). |
| `children` | `.child(..)` | `JSX.Element` | aucune | L'icône ou le libellé de l'app. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | Son apparence et sa place : à côté du contenu, ou `absolute` par-dessus son bord. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucune | Son style lorsqu'il est pressé, survolé, focalisé, ou désactivé à une extrémité, comme les classes `<state>:`. |

### CarouselPagination

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Le nom que les lecteurs d'écran donnent au groupe d'items de pagination (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | aucune | Les classes Tailwind de l'indicateur, une vue placée sur l'item de la slide affichée (une pastille derrière les points, un soulignement) : son apparence et sa place sur l'axe transverse de la rangée (`inset-y-0`, `bottom-0 h-0.5`). Le long de la rangée, il couvre cet item et glisse en ressort vers le suivant, nativement. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucune | Le style de l'indicateur, appliqué par-dessus `indicatorClass`. Sans l'un ni l'autre, la pagination n'a pas d'indicateur. |
| `children` | `.child(..)` | `JSX.Element` | aucune | Les `CarouselPaginationItem`s, et tout ce que l'app dispose entre eux. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La mise en page de la rangée (`flex-row gap-2`). |

### CarouselPaginationItem

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | obligatoire | La slide qu'il représente, à partir de 0. Un index au-delà de la dernière slide est désactivé. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucune | Son style tant que sa slide est affichée, comme les classes `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Quelle slide il représente (`"Slide 3"`), quand ses enfants n'ont pas de texte qui le dise (un point). |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le point, la miniature ou le numéro de l'app. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | Son apparence ; les classes `group-selected:` à l'intérieur le suivent sous `group`. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | L'utilisateur est passé à une autre slide : un balayage, la molette ou le pavé tactile s'est immobilisé dessus, ou un contrôle, un item de pagination ou une touche l'a demandée. `{ index }` est cette slide. Un nouveau `index` venant de l'app ne signale rien. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | L'utilisateur a commencé à faire glisser le contenu (un doigt, le pavé tactile). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | Le contenu que l'utilisateur faisait glisser s'est immobilisé. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | Le focus clavier est entré dans le carousel : sur sa propre vue, son contrôle précédent ou suivant, un item de pagination ou une vue focalisable dans une slide. Passer de l'un à l'autre ne signale rien. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | Le focus clavier a quitté le carousel : sa propre vue, ses contrôles, ses items de pagination et le contenu des slides. |

<a id="parts"></a>

## Parties

| Partie | Dans | Stylée avec | États |
|---|---|---|---|
| Le carousel | | `class`, `style` de `Carousel` | `focus:` |
| Le contenu | le carousel | `class`, `style` de `CarouselContent` | |
| Une slide | le contenu | `class`, `style` de `CarouselItem` | |
| Précédent, suivant | le carousel | leurs `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| La pagination | le carousel | `class`, `style` de `CarouselPagination` | |
| L'indicateur | la pagination | `indicatorClass`, `indicatorStyle` | |
| Un item de pagination | la pagination | ses `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## Plusieurs slides par vue

La largeur d'une slide est celle de sa propre classe : une rangée de cartes met donc plusieurs slides dans le viewport. Chaque slide est un point d'accroche à l'endroit où elle commence : le contenu s'immobilise avec cette slide là où s'immobilise la première, de sorte qu'un padding avant la première est conservé avant chacune. À la fin de la plage, les slides qui ne peuvent pas atteindre cet emplacement s'immobilisent avec la dernière, et suivant s'arrête là. `index` désigne la slide en première position ; les slides qui s'immobilisent avec la dernière montrent le même emplacement, et un balayage à cet endroit signale la première d'entre elles :

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

`basis-1/2` à la largeur d'un téléphone, ou `basis-[85%]`, laisse apercevoir la carte suivante. Un carousel vertical (`axis="vertical"`) dimensionne ses slides selon leur hauteur.

<a id="looping"></a>

## Boucle

Avec `looping`, les slides bouclent sans couture : après la dernière vient la première, qu'on balaie, qu'on atteigne avec suivant ou les touches, ou qu'on définisse avec le `index` de l'app, sans rembobinage à travers les slides intermédiaires. Le contenu garde la place d'un tour complet de slides avant et après elles, et dessine chaque slide là où elle est la plus proche du milieu de la vue ; l'animation l'exécute sur les frames propres de la plateforme, avec le défilement. Chaque slide n'existe qu'une fois : les lecteurs d'écran et la pagination ne la voient qu'une fois.

La boucle est sans couture tant que les slides couvrent le viewport plus une slide (trois slides pleine largeur, ou cinq d'un tiers de largeur). Avec moins, précédent, suivant et les touches bouclent quand même, mais en refaisant défiler en arrière à travers les slides.

<a id="slides-that-move-on-by-themselves"></a>

## Slides qui avancent d'elles-mêmes

Une bannière qui défile toute seule relève de l'app : un timer qui définit `index`. Le carousel signale quand l'utilisateur y touche, de sorte que le timer attend alors, comme le demande le [motif carrousel WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) : `onDragStart` / `onDragEnd` autour d'un glissement, `onFocus` / `onBlur` tant que le focus clavier est dans le carousel (sur lui, ses contrôles, sa pagination ou le contenu des slides), et le pointeur au-dessus d'une vue qui l'entoure. Désactivez-le avec la réduction des animations, et donnez aux utilisateurs un bouton qui l'arrête (le contrôle de rotation) :

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

Lire `index()` dans l'effet relance un intervalle complet après chaque changement, y compris ceux de l'utilisateur. Avec `looping`, passer de la dernière slide à la première avance à travers la couture.

<a id="accessibility"></a>

## Accessibilité

- Le carousel est une région nommée par `accessibilityLabel` ; chaque slide est un groupe nommé par son propre libellé (sa place parmi les autres et ce qu'elle montre).
- Précédent et suivant sont des boutons, désactivés aux extrémités sauf si le carousel boucle ; chaque item de pagination est un bouton, sélectionné tant que sa slide est affichée.
- Chaque libellé est celui de l'app, dans la langue de l'app.
- Dans un carousel qui boucle, chaque slide n'existe qu'une fois, où qu'elle soit dessinée.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, où Tab atteint les vues qui reçoivent les appuis, le carousel est un arrêt du focus clavier, tout comme ses contrôles et ses items de pagination. Tant que l'un d'eux a le focus :

| Touche | Action |
|---|---|
| Gauche, Droite (Haut, Bas en vertical) | Passe à la slide précédente ou suivante, en bouclant aux extrémités si le carousel boucle. |
| Début, Fin | Passe à la première ou à la dernière slide. |
| Espace, Entrée | Appuie sur le contrôle ou l'item de pagination qui a le focus. |

Dans une mise en page de droite à gauche, les slides d'un carousel horizontal défilent depuis la droite : Gauche passe donc à la slide suivante et Droite à la précédente ; un carousel vertical garde Haut et Bas. Un contrôle qui devient désactivé alors qu'il a le focus (suivant sur la dernière slide) transmet le focus au carousel, de sorte que les touches continuent d'y fonctionner. Les vues focalisables de l'app placées dans les slides gardent leurs propres touches : les flèches d'un champ de saisie déplacent son curseur.

<a id="motion"></a>

## Animation

- Un balayage, la molette et le pavé tactile déplacent les slides avec le pointeur, dans la même frame : c'est la plateforme qui les fait défiler.
- Au relâchement, le contenu glisse jusqu'à la slide la plus proche, une slide par geste, selon l'aimantation de la plateforme.
- Précédent, suivant, un item de pagination, une touche et le `index` de l'app font défiler le contenu jusqu'à la slide, avec animation ; avec la réduction des animations, immédiatement.
- L'indicateur de la pagination glisse en ressort jusqu'à l'item de la slide affichée ; avec la réduction des animations, il s'y déplace immédiatement.
- `looping` passe de la dernière slide à la première en avançant d'un pas, à travers la couture ; une fois le contenu immobilisé, il recule d'un tour complet sans animation, ce qui ne change rien à l'écran.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS, Android et Mac Catalyst : un doigt balaie les slides ; un toucher appuie sur un contrôle.
- Bureaux (macOS, Windows, Linux, GPUI) et web : la molette et le pavé tactile font défiler les slides, et un clic appuie sur un contrôle. Le glissement à la souris sur le contenu appartient à l'app, comme sur toute vue de défilement de ces plateformes.
- Chaque plateforme dessine ce que l'app stylise : les slides, les contrôles, la pagination et son indicateur.
