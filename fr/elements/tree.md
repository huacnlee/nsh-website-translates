---
title: "Tree"
description: "Tree : des éléments qui contiennent d'autres éléments, développés ou réduits, dont un est sélectionné : les fichiers d'un projet, une barre latérale de paramètres, un plan. Virtualisé, un seul arrêt du focus clavier, une arborescence pour les lecteurs d'écran. L'apparence de chaque ligne est laissée à l'application."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# Arbre

Un arbre affiche des éléments qui contiennent d'autres éléments : les fichiers et dossiers d'un projet, les sections de la barre latérale d'un écran de réglages, le plan d'un document. `Tree` gère le comportement de l'arbre : quels éléments sont dépliés, lequel est sélectionné, le clavier et ce qu'entendent les lecteurs d'écran. Ses lignes sont virtualisées : seules les lignes visibles sont créées, et les enfants d'un élément replié ne sont jamais créés, si bien qu'un arbre de plusieurs milliers d'éléments s'ouvre et défile instantanément. L'apparence revient à l'app : l'arbre ne dessine rien lui-même, l'app stylise chaque ligne (`itemClass`) et dessine son contenu (`renderItem` : une icône, le libellé indenté selon la profondeur de l'élément, un chevron, un badge).

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. Les éléments dépliés et l'élément sélectionné appartiennent à l'app lorsqu'elle définit `expanded` et `selected`, qu'elle met à jour dans `onExpandedChange` et `onSelectedChange` ; sans eux, l'arbre garde son propre état, à partir de `defaultExpanded` et `defaultSelected`. Les éléments sont identifiés par leur `id`, propre à l'app (un chemin, la clé d'un enregistrement), jamais par leur libellé. En Rust, `tree()` le construit, avec un setter par prop (`.items(..)`, `.expanded(..)`, `.render_item(..)`), une méthode d'écoute par événement et les méthodes de style typées.

<a id="items"></a>

## Éléments

`items` désigne les éléments de premier niveau, chacun étant un `TreeItem` :

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Ce qui l'identifie dans `expanded`, `selected` et les événements : unique dans l'arbre (un id donné deux fois est consigné dans les logs, et seul son premier élément se déplie ou est sélectionné). |
| `label` | `string` | Ce que sa ligne affiche tant que `renderItem` ne la dessine pas, ce que disent les lecteurs d'écran et ce que la recherche au clavier compare. |
| `children` | `TreeItem[]` | Les éléments qui se trouvent sous lui, dans l'ordre. S'il en a, c'est un dossier : il se déplie et se replie. |
| `disabled` | `boolean` | L'utilisateur ne peut ni le sélectionner, ni le déplier, ni le replier : les pressions et les touches l'ignorent, les styles `disabled:` s'appliquent. Ses enfants restent tels que `expanded` les définit. |

`renderItem` reçoit un `TreeEntry` pour chaque ligne visible : les `id`, `label` et `disabled` de l'élément, sa `depth` (0 au premier niveau, 1 sous un élément de premier niveau, …) et s'il s'agit d'un `folder`. Cela décrit ce qu'est l'élément, et les états de la ligne en sont les classes : le dessin est réalisé une seule fois par élément et conserve ses vues pendant que la ligne est sélectionnée, dépliée ou repliée, de sorte qu'un chevron pivote avec une transition.

## Props

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | Les éléments de premier niveau, chacun avec les éléments qui se trouvent sous lui. |
| `expanded` | `.expanded(..)` | `string[]` | aucun | Les ids des éléments dépliés (contrôlé). Un élément est visible tant que tous les éléments au-dessus de lui sont dépliés. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | Les éléments dépliés au départ, tant que `expanded` n'est pas défini. |
| `selected` | `.selected(..)` | `string \| null` | aucun | L'id de l'élément sélectionné (contrôlé), `null` pour aucun. |
| `defaultSelected` | `.default_selected(..)` | `string` | aucun | L'élément sélectionné au départ, tant que `selected` n'est pas défini. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Un arbre en lecture seule : ni pressions ni touches, aucun arrêt du focus clavier, `disabled:` sur chaque ligne ; il affiche ce que disent `expanded` et `selected`. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Lorsqu'on déplie ou replie, les lignes situées après l'élément rejoignent leur nouvelle place avec un ressort, exécuté nativement. Désactivé avec la réduction des animations. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent à l'arbre (« Fichiers »). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | aucun | Le contenu d'une ligne, pour les lignes visibles ; sans lui, une ligne affiche le libellé de l'élément. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | Chaque ligne : sa hauteur, son remplissage, sa surface et ses états (voir plus bas) ; ses styles de texte atteignent le libellé. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La vue de défilement des lignes à l'intérieur de l'arbre : son remplissage et ses espacements. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'arbre lui-même. Donnez-lui une hauteur (ou `flex-1` dans un parent qui en a une) : les lignes défilent à l'intérieur, et seules celles qui sont visibles sont créées. |

<a id="events"></a>

## Événements

| Événement | Rust | Payload | Quand |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | L'utilisateur a déplié ou replié un élément (une pression, Return, Space, Right ou Left, `revealItem`) : les ids dépliés tels qu'ils seraient. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | L'utilisateur a sélectionné un autre élément (une pression, les touches fléchées, Home, End, la recherche au clavier). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | L'utilisateur a déplié l'élément de `id`, après `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | L'utilisateur a replié l'élément de `id`, après `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | L'utilisateur a agi sur l'élément de `id` : Return sur l'élément sélectionné lorsqu'il n'a pas d'enfants, ou un double clic ou un double toucher sur n'importe quel élément, après les événements propres à la pression. Les éléments désactivés et un arbre désactivé ne le signalent jamais. |

La sélection suit les touches fléchées, de sorte qu'un explorateur de fichiers ouvre un fichier dans `onAction`, et non dans `onSelectedChange` : en parcourant les fichiers, on les prévisualise un à un, puis Return ou un double clic ouvre celui que l'utilisateur veut.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## Parties

| Partie | Dans | Stylisée avec | États |
|---|---|---|---|
| L'arbre | | `class`, `style` | |
| La liste | l'arbre | `listClass`, `listStyle` | |
| Une ligne | la liste | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (un dossier ouvert), `focus:` (lorsque l'arbre a le focus clavier, la ligne sur laquelle agissent les touches : la ligne sélectionnée, l'élément replié sous lequel se trouve une sélection masquée, ou la première ligne tant que rien n'est sélectionné), `disabled:`, `hover:`, `active:` |
| Le contenu d'une ligne | une ligne | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` sous `group` dans `itemClass` |

Montrez la ligne sélectionnée avec `selected:` et l'emplacement du clavier avec `focus:` (voir les [Design guides](../docs/design-guides.md#interaction-states)). Dessinez le focus à l'intérieur de la ligne (`focus:outline-2 focus:-outline-offset-2`) : la liste rogne ce qui dépasse sur ses côtés.

## Ref

| Méthode | Description |
|---|---|
| `focus()` | Prend le focus clavier, comme lorsque Tab atteint l'arbre. |
| `revealItem(id)` | Déplie les éléments situés au-dessus de l'élément de `id` (signalé avec `onExpandedChange` et `onExpand`, le plus externe d'abord) et fait défiler sa ligne jusqu'à la vue dès qu'elle est visible : si l'app suit le changement, immédiatement ; sinon, la demande s'arrête là. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## Désactivé

Un élément désactivé ne reçoit aucune pression, les touches fléchées l'ignorent, et les lecteurs d'écran l'annoncent comme grisé. `disabled` sur l'arbre le rend en lecture seule : il affiche ce que dit l'état de l'app et ne reçoit aucune entrée.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## Accessibilité

- L'arbre a le rôle `"tree"`, nommé par `accessibilityLabel` ; chaque ligne est un `"treeitem"` nommé par le libellé de son élément, avec son niveau (sa profondeur + 1), son état déplié ou non (pour les dossiers), sélectionné et désactivé.
- Lorsque l'arbre prend le focus clavier et que les touches déplacent la sélection, la ligne sur laquelle agissent les touches prend le focus du lecteur d'écran.

Voir [Accessibility](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Sur les ordinateurs de bureau et le web, où Tab atteint les vues qui reçoivent des pressions, un `Tree` suit le [modèle d'arbre WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) :

| Touche | Effet |
|---|---|
| Tab, Shift+Tab | Entre dans l'arbre en une seule étape et en sort en une seule étape ; au retour, les touches reprennent depuis la ligne sélectionnée. Sans sélection, le focus s'affiche sur la première ligne, que Down sélectionne. |
| Down, Up | Sélectionne la ligne suivante ou précédente, en ignorant les éléments désactivés, de la dernière à la première et inversement. |
| Right | Déplie un dossier replié ; sur un dossier déplié, sélectionne son premier enfant activé. |
| Left | Replie un dossier déplié ; sur tout autre élément, sélectionne son parent. |
| Home, End | Sélectionne la première ou la dernière ligne. |
| Return | Déplie ou replie le dossier sélectionné ; sur un élément sans enfants, agit sur lui (`onAction`). |
| Space | Déplie ou replie le dossier sélectionné. |
| Lettres, chiffres | Sélectionne la ligne suivante dont le libellé commence par ce qui a été saisi. |

Lorsque la sélection est masquée sous un élément replié (l'app l'a replié), les touches agissent sur la ligne de cet élément : Right ou Return le déplie, Down sélectionne la ligne qui le suit.

Dans une disposition de droite à gauche, les lignes partent de la droite, donc Left et Right échangent leur rôle, comme le dit le modèle : Left déplie un dossier et y entre, Right le replie et sélectionne le parent. Up, Down, Home et End gardent le leur.

<a id="platform-notes"></a>

## Notes sur les plateformes

- iOS, Android et Mac Catalyst : un toucher sélectionne une ligne et déplie ou replie un dossier ; un double toucher agit sur l'élément (`onAction`).
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : un clic fait la même chose et donne à l'arbre le focus clavier, et les touches ci-dessus s'y appliquent ; un double clic agit sur l'élément.
- Chaque plateforme dessine ce que l'app stylise : l'arbre, ses lignes et leur contenu.
