---
title: "Pagination"
description: "Le composant Pagination : les pages d'un ensemble entre lesquelles naviguer, avec les pages autour de la page courante, des points de suspension, Précédent et Suivant, un paginateur compact, le clavier et la page courante pour les lecteurs d'écran, stylé par l'application."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# Pagination

Une pagination permet de naviguer entre les pages d'un ensemble : résultats de recherche, lignes d'un tableau, archive. Elle affiche Précédent, les pages autour de la page courante (toujours la première et la dernière, avec une ellipse pour chaque série omise), les enfants de l'app et Suivant. Elle gère le comportement : les pages affichées, les appuis, le clavier, Précédent et Suivant désactivés aux extrémités, le repère de navigation et la page courante pour les lecteurs d'écran. L'apparence revient à l'app : les éléments n'ont ni couleur, ni taille, ni libellé propres, et l'app les stylise ou les dessine.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust,
`pagination()` en crée un avec un setter par prop (`.page(..)`, `.total_pages(..)`), `.on_change(..)` pour la page que
l'utilisateur choisit, les méthodes de style typées pour la ligne et `.child(..)` pour le contenu de l'app.

<a id="the-page"></a>

## La page

La page appartient à l'app : `page` est la page courante, à partir de 1, et `onChange({ page })` signale la page choisie par l'utilisateur
par un appui sur une page, sur Précédent ou sur Suivant. L'app la définit, charge cette page et affiche ses lignes. `totalPages` est
le nombre de pages ; un `page` au-delà de la dernière affiche la dernière. La page courante ne signale rien quand on appuie dessus, pas plus
que Précédent sur la première page ni Suivant sur la dernière.

<a id="the-pages-shown"></a>

## Les pages affichées

Avec `visiblePages` (au moins 5, valeur par défaut), la ligne affiche toutes les pages tant qu'elles tiennent. Au-delà, elle affiche la première et
la dernière page, la page courante avec autant de pages de chaque côté que possible, `(visiblePages - 3) / 2`, et une ellipse pour
chaque série de pages omise :

| `page` sur 20, `visiblePages={7}` | Affichage |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

Dix mille pages affichent les mêmes sept éléments. Un `visiblePages` impair centre la page courante.

<a id="items"></a>

## Éléments

Chaque élément reçoit les `itemClass` et `itemStyle` de l'app : la page courante est `selected:`, un élément qui n'accepte aucun appui est
`disabled:`, l'élément qui a le focus clavier est `focus:`. La disposition de la ligne revient à l'app, avec `class` (une ligne par
défaut ; `gap-*`, `justify-*`).

Sans `renderItem`, une page affiche son numéro, une ellipse `…`, et Précédent et Suivant leurs libellés d'accessibilité (`‹` et
`›` en l'absence de libellés). `renderItem` dessine le contenu de chaque élément à partir d'un `PaginationItemState` :

| Champ | Type | Description |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | Ce qu'est l'élément. |
| `page` | `number` | Le numéro d'une page ; la page vers laquelle mène Précédent ou Suivant (la page courante aux extrémités) ; la première page masquée d'une ellipse. |
| `start`, `end` | `number` | Les pages masquées d'une ellipse : `start` incluse, `end` (la page affichée suivante) exclue. |
| `current` | `boolean` | La page courante. |
| `disabled` | `boolean` | Il n'accepte aucun appui : Précédent sur la première page, Suivant sur la dernière, tous les éléments d'une pagination désactivée. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

Une ellipse n'accepte aucun appui par elle-même : ce qu'elle fait relève de l'app. Un `Menu` dessiné dedans liste les pages qu'elle masque, comme
`JumpMenu` ci-dessus.

## Compact

`compact` n'affiche que Précédent, les enfants et Suivant : un pager pour un écran étroit, la page étant indiquée dans les enfants.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

Les enfants se placent après les pages et avant Suivant, dans les deux formes : un nombre de pages, un champ pour aller à une page.

## Props

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | requis | La page courante, à partir de 1 ; l'app la définit dans `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | requis | Le nombre de pages, au moins 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | Le nombre maximal de pages affichées à la fois, première et dernière comprises ; au moins 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | Précédent, les enfants et Suivant uniquement. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun élément n'accepte d'appui ni de focus clavier ; les styles `disabled:` s'appliquent, et les lecteurs d'écran indiquent qu'ils sont grisés. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent à la navigation : ce qu'elle parcourt. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour Précédent et Suivant, et leur contenu en l'absence de `renderItem`. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | aucun | L'apparence de chaque élément : `selected:` sur la page courante, `disabled:`, `focus:` ; les styles de texte sont transmis à son contenu. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | aucun | Dessine le contenu de chaque élément à partir de son état. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu de l'app après les pages, avant Suivant. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence et la disposition de la ligne. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }` : la page choisie par l'utilisateur avec une page, Précédent ou Suivant. La page courante n'est jamais signalée. |

<a id="motion"></a>

## Animation

La page courante se déplace d'un élément à l'autre selon les classes `selected:` de l'app : `transition-colors` sur `itemClass` fait passer en fondu
la mise en évidence de la page quittée à la page atteinte. Un changement de page garde chaque élément en place et change ce que les éléments
affichent, si bien que la ligne ne scintille jamais ; les transitions de l'app sont figées lorsque la réduction des animations est activée (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## Accessibilité

- La ligne est un repère de navigation nommé par `accessibilityLabel`.
- Chaque page, Précédent et Suivant est un bouton. La page courante est annoncée comme page courante (`aria-current="page"` d'ARIA)
  et est sélectionnée ; Précédent sur la première page et Suivant sur la dernière sont grisés.
- Sur macOS et le web, chaque page, Précédent et Suivant est un arrêt du focus clavier, et Entrée et Espace l'activent. Une
  page activée au clavier conserve le focus une fois que l'app l'affiche, où qu'elle se retrouve dans la ligne, et il en va de même pour la
  première ou la dernière page quand Précédent ou Suivant l'atteint.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS, Android et Mac Catalyst : un appui est un toucher qui se termine sur un élément.
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic ; sur macOS et le web, Tab atteint les éléments.
- Chaque plateforme dessine ce que l'app stylise.
