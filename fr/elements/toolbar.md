---
title: "Toolbar"
description: "Toolbar, ToolbarGroup et ToolbarSeparator : une barre de boutons, de boutons à bascule et de liens qui constitue un seul arrêt du focus clavier, dont les touches fléchées permettent de se déplacer, avec des groupes nommés et des séparateurs. L'apparence et l'état de chaque contrôle relèvent de l'application."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

Une barre d'outils est une barre de contrôles : la mise en forme d'un éditeur de texte, les commandes de lecture d'un lecteur multimédia, une palette verticale d'outils.
`Toolbar` gère le clavier et la sémantique d'une barre d'outils : les lecteurs d'écran l'annoncent comme telle (nommée par son
`accessibilityLabel`), et le clavier l'atteint en un seul arrêt puis circule entre ses éléments avec les flèches de son
`axis`. Ses éléments sont les `Button`, `Toggle` et `Link` qu'elle contient, à n'importe quelle profondeur. `ToolbarGroup` désigne une suite nommée d'éléments liés (annuler et rétablir, l'alignement), et `ToolbarSeparator` un trait que l'app dessine entre deux suites. L'apparence revient à l'app : la barre d'outils n'a ni couleurs, ni marges intérieures, ni espacements propres, et chaque contrôle conserve son propre état.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` et `ToolbarSeparator` proviennent de [`nsh/base`](../modules/nsh-base.md), la crate `nsh-base`
en Rust. La barre d'outils ne détient aucune valeur : un toggle qu'elle contient reçoit l'information de son état pressé et signale `onChange`, un
bouton signale `onPress`, et l'app conserve l'état. En Rust, `toolbar()`, `toolbar_group()` et
`toolbar_separator()` les construisent, avec un setter par prop (`.axis(..)`, `.disabled(..)`), les méthodes de style typées et
`.child(..)` pour leur contenu.

## Props

<a id="toolbar-1"></a>

### Toolbar

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direction dans laquelle courent ses éléments : les flèches qui s'y déplacent (Gauche et Droite, ou Haut et Bas) et le sens dans lequel elle dispose ses enfants (une ligne ou une colonne). Lue à la création de la barre d'outils. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Tous les éléments de la barre d'outils sont désactivés, quel que soit leur propre `disabled` : aucun appui, aucun arrêt du focus clavier, atténués pour les lecteurs d'écran. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent à la barre d'outils (« Mise en forme »), pour une page qui en comporte plusieurs. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les éléments, leurs groupes et séparateurs, et tout ce que l'app dispose parmi eux (un titre, un espaceur, un champ de saisie). |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La mise en page et l'apparence de la barre : alignement, espacements, marges intérieures, sa surface. |

### ToolbarGroup

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Tous les éléments du groupe sont désactivés, quel que soit leur propre `disabled`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent au groupe (« Historique », « Alignement »). |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les éléments du groupe, et tout ce que l'app dispose parmi eux. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La mise en page et l'apparence du groupe. Il suit l'axe de la barre d'outils. |

### ToolbarSeparator

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le trait : un filet fin en travers d'une ligne (`h-5 w-px bg-border`) ou d'une colonne (`h-px self-stretch bg-border`). |

<a id="items"></a>

## Éléments

Les éléments d'une barre d'outils sont les `Button`, `Toggle` et `Link` qu'elle contient, dans ses groupes et aussi dans un
[`ToggleGroup`](./toggle.md) placé à l'intérieur. Le déclencheur d'un [`Menu`](./menu.md) ou d'un [`Popover`](./popover.md) est
aussi un élément : la vue placée dans son slot `trigger`, à laquelle le popup donne ses appuis, son focus et son état `expanded`. Un
outil que l'app dessine elle-même est un `Button` avec les classes de l'app : un `Button` n'a pas d'apparence propre, il se présente donc comme
l'app le stylise et constitue un élément (un `View` avec `onPress` reste un arrêt à part entière, hors des flèches). Un
`ToggleGroup` placé dans une barre d'outils est l'un de ses groupes : ses toggles sont les éléments de la barre, les lecteurs d'écran annoncent un groupe,
et son `disabled` continue de désactiver ses propres toggles. Les autres contrôles (un `Input`, un `Select`, un `Slider`) restent des arrêts à part entière
et conservent leurs flèches ; placez-les à la fin de la barre. Ce qu'affiche un popup ouvert par un élément (champs et boutons d'un popover, éléments d'un menu, liens d'une hover card) ne fait pas partie de la barre d'outils. Les flèches parcourent les éléments dans l'ordre où la
barre les dispose, quelle que soit leur profondeur, et un élément que l'app affiche plus tard prend sa place parmi eux.

<a id="parts"></a>

## Parties

| Partie | Contenue dans | Stylisée avec | États |
|---|---|---|---|
| La barre | | `class`, `style` de `Toolbar` | |
| Un groupe | la barre | `class`, `style` de `ToolbarGroup` | |
| Un séparateur | la barre, un groupe | `class`, `style` de `ToolbarSeparator` | |
| Un élément | la barre, un groupe | `class`, `style` propres à l'élément | les siens : `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

Montrez l'élément sur lequel se trouve le clavier avec des styles `focus:`, et un toggle pressé par sa propre surface (voir
[Guides de conception](../docs/design-guides.md#interaction-states)).

## Vertical

Une palette d'outils est une colonne : `axis="vertical"` dispose les éléments de haut en bas, et Haut et Bas permettent de les parcourir.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## Désactivé

`disabled` sur une barre d'outils désactive tous ses éléments, une barre que l'app verrouille ; sur un groupe, les éléments du groupe. Un élément désactivé
ne reçoit aucun appui, les flèches le sautent, et les lecteurs d'écran l'annoncent comme atténué :

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## Accessibilité

- `Toolbar` a le rôle `"toolbar"`, nommé par `accessibilityLabel` ; ses éléments restent des éléments à part entière. Sur iOS, la
  barre d'outils est un groupe sémantique dans lequel VoiceOver entre.
- `ToolbarGroup` a le rôle `"group"`, nommé par son `accessibilityLabel`, de sorte qu'une suite d'éléments se lit comme une seule unité. Un
  `ToggleGroup` placé dans une barre d'outils est aussi un groupe.
- `ToolbarSeparator` n'est pas un élément pour les lecteurs d'écran.
- `disabled` est annoncé comme la plateforme l'annonce (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité du navigateur).

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, où Tab atteint les vues qui reçoivent des appuis, un `Toolbar` suit le
[modèle de barre d'outils WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) :

| Touche | Effet |
|---|---|
| Tab, Shift+Tab | Entre dans la barre d'outils à l'élément que le focus a quitté en dernier (au début, le premier élément non désactivé), et en sort en une seule étape. |
| Droite, Gauche (`axis="horizontal"`) | Déplace le focus vers l'élément suivant ou précédent, du dernier au premier et inversement. |
| Bas, Haut (`axis="vertical"`) | Déplace le focus vers l'élément suivant ou précédent, du dernier au premier et inversement. |
| Home, End | Déplace le focus vers le premier ou le dernier élément. |
| Espace, Return | Appuie sur l'élément ayant le focus. |

Les flèches sautent les éléments désactivés et n'appuient sur rien : un toggle ne change que lorsqu'il est pressé. L'autre paire de
flèches est laissée aux éléments (le déclencheur d'un menu ouvre son menu avec Bas). Dans une mise en page de droite à gauche, une barre d'outils
horizontale part de la droite : Gauche passe donc à l'élément suivant et Droite au précédent ; une barre verticale conserve Bas et
Haut.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS, Android et Mac Catalyst : chaque élément s'active d'un toucher ; la barre d'outils est un groupe que les lecteurs d'écran annoncent.
- Postes de bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic. Sur macOS et le web, la barre d'outils est un seul arrêt
  de Tab, et les flèches, Home et End circulent entre ses éléments ([Clavier](#keyboard)).
- Chaque plateforme dessine ce que l'app stylise : la barre, ses groupes, ses séparateurs et ses éléments.
