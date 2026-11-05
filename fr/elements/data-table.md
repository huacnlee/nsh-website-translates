---
title: "DataTable"
description: "Le composant DataTable : un tableau de lignes et de colonnes qui défile dans les deux sens, quel que soit le nombre de lignes ou de colonnes, avec des colonnes fixes, redimensionnables, déplaçables et triables, une sélection de lignes, de colonnes et de cellules, des lignes que l'application fournit page par page, des libellés de groupe, une navigation au clavier et des cellules dessinées par l'application."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` affiche des lignes et des colonnes comme un tableur et défile dans les deux sens, quel que soit leur nombre. Seules les
cellules visibles sont créées : un tableau d'un million de lignes et de dix mille colonnes défile aussi aisément qu'un petit. Les lignes,
les colonnes ou les cellules se sélectionnent au pointeur et au clavier ; les colonnes ont des largeurs fixes, se redimensionnent en faisant glisser leur
bord, se déplacent en faisant glisser leur titre, restent à gauche pendant que les autres défilent, et se trient. Les titres peuvent être placés sous des libellés
de groupe, et une cellule ou un titre peut être dessiné par l'app.

`DataTable` fournit la mise en page, l'alignement, la virtualisation et l'interaction. L'app donne à ses parties leur espacement interne,
leurs couleurs, leurs bordures et le retour visuel de la sélection via `classes` et `styles`. En Rust, on en crée un avec
`nsh_base::data_table()` ; en TSX, avec `<DataTable>` depuis `nsh/base`.

```rust tabs
use nsh_base::{DataTableColumn, data_table};
use nsh_core::prelude::*;

fn column(key: &str, title: &str) -> DataTableColumn {
    let mut column = DataTableColumn::default();
    column.key = key.into();
    column.title = Some(title.into());
    column
}

fn table() -> impl IntoElement {
    data_table()
        .columns(vec![column("name", "Name"), column("city", "City")])
        .flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DataTable, type DataTableColumn } from "nsh/base";

const columns: DataTableColumn[] = [
  { key: "name", title: "Name", width: 160, sortable: true },
  { key: "city", title: "City", width: 120 },
  { key: "score", title: "Score", width: 90, align: "end" },
];

const rows = [
  { name: "Ada", city: "Oslo", score: 91 },
  { name: "Grace", city: "Lima", score: 87 },
  { name: "Linus", city: "Kyoto", score: 78 },
];

function App() {
  return <DataTable columns={columns} data={rows} class="flex-1" />;
}

mount(App);
```

Le tableau remplit la boîte que l'app lui donne (`flex-1`, une hauteur) et défile à l'intérieur : verticalement à travers les lignes et
horizontalement à travers les colonnes, avec des barres de défilement (`scrollbar={false}` les masque, `bounces={false}` supprime l'effet de rebond aux extrémités sur les plateformes qui en ont un).

<a id="rows-and-columns"></a>

## Lignes et colonnes

`data` désigne les lignes : des objets dont les champs sont nommés par les `key` des colonnes, ou des tableaux que les colonnes indexent par position. Les nombres,
booléens et chaînes s'affichent comme du texte. En Rust, les lignes sont fournies champ par champ, chacun d'un seul type :
`DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. Une colonne est un
`DataTableColumn` :

| Champ | Description |
|---|---|
| `key` | Son identité, unique parmi les colonnes : le champ des lignes que ses cellules affichent, et le nom qu'utilisent les événements et la ref. |
| `title` | Le texte de son titre. Par défaut, son `key`. |
| `width` | Sa largeur, en points. Par défaut `120`. |
| `minWidth`, `maxWidth` | La largeur minimale et maximale qu'un glissement ou un ajustement peut lui donner. Par défaut `20` et `1200`. |
| `fitPadding` | Espace supplémentaire pour l'espacement interne, les icônes ou les badges de l'app, ajouté au texte de titre ou de cellule le plus large lors de l'ajustement de la colonne. |
| `align` | `"start"` (par défaut), `"center"` ou `"end"`, pour les nombres. S'applique aux cellules comme au titre. |
| `sortable` | Son titre a un bouton de tri qui demande un tri (voir [Tri](#sorting)). |
| `fixed` | Elle reste à gauche pendant que les autres colonnes défilent dessous. Les colonnes fixes précèdent les autres, dans leur ordre. |
| `resizable`, `movable` | Indiquent si un glissement de son bord la redimensionne et si un glissement de son titre la déplace. Par défaut `resizableColumns` et `movableColumns` du tableau. |
| `selectable` | Indique si elle participe à la sélection. Une colonne de boutons ou de cases à cocher définit `false`. Par défaut `true`. |
| `cellClass` | Classes des cellules de la colonne, après celles de la partie `cell` : espacements internes ou alignement d'une seule colonne. |
| `headerClass` | Classes du titre de la colonne, après celles de la partie `headerCell`. |
| `positiveClass` | Classes des cellules de la colonne qui contiennent une hausse : un nombre supérieur à zéro, ou un texte commençant par `+`. |
| `negativeClass` | Classes des cellules de la colonne qui contiennent une baisse : un nombre inférieur à zéro, ou un texte commençant par `-`. |

`rowHeight` est la hauteur d'une ligne du corps (par défaut `32`) et `headerHeight` la hauteur d'une ligne de titres (par défaut la hauteur
des lignes). `rowHeader` ajoute à gauche une colonne de numéros de ligne, qui sélectionne les lignes. `stripe` donne aux lignes impaires la
partie `rowOdd`.

<a id="group-labels"></a>

### Libellés de groupe

`groups` place des libellés au-dessus des colonnes, en commençant par le niveau le plus bas. Chaque niveau est une liste de `{ label, span }` dont les étendues
totalisent le nombre de colonnes, ou celui du niveau inférieur.

```tsx
<DataTable
  columns={columns}
  data={rows}
  groups={[
    [{ label: "Person", span: 2 }, { label: "Result", span: 1 }],
  ]}
  class="flex-1"
/>
```

<a id="any-number-of-rows"></a>

## Un nombre quelconque de lignes

Le tableau demande les lignes par position, et l'app les fournit. `rowCount` est le nombre total de lignes, `data` les lignes
que l'app détient, et `dataStart` la position de la première d'entre elles. Les lignes hors de `data` restent vides jusqu'à ce que l'app les
fournisse. `onVisibleRowsChange` signale les lignes visibles, `{ range: { start, end } }`, à chaque pas de défilement, et c'est l'endroit où récupérer
la page qui les entoure.

```tsx
const ROWS = 1_000_000;
const page = signal({ start: 0, rows: load(0) });

<DataTable
  columns={columns}
  data={page().rows}
  dataStart={page().start}
  rowCount={ROWS}
  onVisibleRowsChange={({ range: { start, end } }) => {
    // Keep the rows in view inside the page held.
    const held = page();
    if (start < held.start || end > held.start + held.rows.length) {
      const first = Math.max(0, start - 200);
      page.set({ start: first, rows: load(first) });
    }
  }}
  class="flex-1"
/>
```

Pour une liste qui s'allonge par la fin, définissez `hasMore` : `onLoadMore` se déclenche une fois pour chaque nombre de lignes lorsque les lignes visibles
arrivent à moins de `loadMoreThreshold` (par défaut `20`) de la dernière. Tant que `loading` est vrai, il attend, et le slot `loadingView`
s'affiche par-dessus les lignes. Le slot `empty` s'affiche lorsqu'il n'y a aucune ligne.

Au-delà de quelques millions de points de contenu, les barres de défilement couvrent une plage mise à l'échelle, de sorte qu'un million de lignes permet encore d'atteindre chaque ligne.

<a id="selection"></a>

## Sélection

Trois commutateurs déterminent ce qu'un appui sélectionne, comme dans gpui-component :

| Prop | Un appui sélectionne | `selection` |
|---|---|---|
| `rowSelectable` (par défaut `true`) | Une ligne : n'importe laquelle de ses cellules, ou son en-tête de ligne | `{ row }` |
| `columnSelectable` (par défaut `true`) | Une colonne : son titre | `{ column }` |
| `cellSelectable` (par défaut `false`) | Une cellule ; l'en-tête de ligne (affiché par défaut avec elle) sélectionne les lignes | `{ row, column }` |

Avec `cellSelectable` et l'en-tête de ligne masqué (`rowHeader={false}`), appuyer de nouveau sur la cellule sélectionnée sélectionne sa
ligne. Un appui avec Maj ou la touche de commande de la plateforme enfoncée ne sélectionne une ligne que si `selectOnModifierPress` (par défaut
`true`) ; une app qui gère sa propre sélection multiligne traite donc elle-même ces appuis : `onRowPress` signale chaque
appui sur le corps avec sa ligne, la colonne sous le pointeur, les clics dans une ligne et les touches de modification enfoncées. Une colonne dont `selectable` vaut
`false` ne se sélectionne pas elle-même et ne sélectionne pas ses cellules.

Les lignes sont numérotées à partir de 0 dans les données, et une colonne est identifiée par son index dans `columns`, quel que soit l'ordre dans lequel l'utilisateur les a déplacées.
`onSelectionChange` signale ce que l'utilisateur a sélectionné (`null` si rien). La prop `selection` définit la sélection depuis
l'app ; si elle n'est pas définie, le tableau la conserve. `onDoublePress` signale une ligne, une cellule ou un titre sur lesquels on a appuyé deux fois, et
`onContextMenu` un appui secondaire ou long, avec le point où ouvrir le [`Menu`](./menu.md) de l'app. Les deux désignent la
cellule sous le pointeur (son `row` et son `column`), le numéro d'une ligne (`row` seulement) ou un titre (`column` seulement). Jusqu'au prochain
appui, la cellule pour laquelle un menu a été demandé a la partie `cellActive`, ou sa ligne la partie `rowActive` lorsque les cellules ne
se sélectionnent pas.

Les lecteurs d'écran obtiennent une grille (nommée par `accessibilityLabel`) d'en-têtes de colonnes et de cellules, les éléments sélectionnés étant annoncés comme
sélectionnés.

<a id="keyboard"></a>

## Clavier

Appuyer sur le tableau, ou l'atteindre avec Tab (macOS, le web), lui donne le clavier jusqu'à un autre appui, un changement de focus
ou `blur()` ; `focus()` le lui donne depuis l'app. Le tableau constitue un seul arrêt de Tab : à l'intérieur, Tab déplace la
sélection, et Échap rend le clavier.

| Touches | Effet |
|---|---|
| Flèches | Déplacent la sélection d'une ligne, d'une colonne ou d'une cellule, en la faisant défiler dans la vue. |
| Tab, Maj+Tab | Passent à la colonne suivante ou précédente. |
| Page précédente, Page suivante | Se déplacent d'une page de lignes. |
| Début, Fin | Passent à la première ou à la dernière. |
| Échap | Efface la sélection, puis rend le clavier. |
| Raccourci de copie | Place le texte de la sélection dans le presse-papiers (`copy()`). |

`loopSelection` (par défaut `true`) fait que les flèches bouclent aux extrémités.

<a id="sorting"></a>

## Tri

Une colonne `sortable` a un bouton de tri à la fin de son titre, un petit bouton fantôme atténué tant que la colonne n'est pas triée. Appuyer dessus signale le tri suivant (`{ key, direction }`) dans le cycle : non trié,
croissant, décroissant, puis de nouveau non trié, avec `onSortChange({ sort })` (`null` pour effacer). Le tableau
ne réordonne pas les lignes : l'app trie ses données, ou demande à son serveur les lignes dans le nouvel ordre, et définit `sort` pour que le
titre l'indique. Comme l'app maîtrise l'ordre, le tri fonctionne de la même façon sur un million de lignes que l'app ne détient jamais.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  sort={sort()}
  onSortChange={({ sort: next }) => {
    sort.set(next ?? undefined);
    rows.set(sorted(people, next));
  }}
  class="flex-1"
/>
```

<a id="resizing-and-moving-columns"></a>

## Redimensionner et déplacer les colonnes

Un glissement du bord de fin d'une colonne la redimensionne dans les limites de `minWidth` et `maxWidth`, et `onColumnResize({ key, width })`
signale chaque pas. Appuyer deux fois de suite sur le bord ajuste la colonne à son texte et son titre les plus larges. Un glissement d'un titre déplace la colonne, et une ligne indique où elle sera déposée ; `onColumnMove` signale
`{ key, from, to, order }`, `order` étant les `key` de toutes les colonnes dans l'ordre affiché. Les colonnes fixes restent parmi
les colonnes fixes. `resizableColumns` et `movableColumns` désactivent les deux pour le tableau, et les `resizable` et
`movable` d'une colonne l'emportent sur eux.

<a id="live-data"></a>

## Données en direct

Un tableau de cotations change plusieurs fois par seconde. L'app formate les lignes visibles et une marge autour (elle les connaît
grâce à `onVisibleRowsChange`) et les transmet sous forme de `data` depuis `dataStart` ; une mise à jour ne coûte donc que ce qui est à l'écran,
quel que soit le nombre de lignes. Les hausses et les baisses tirent leurs couleurs des `positiveClass` et `negativeClass` de la colonne,
appliquées nativement aux cellules dont la valeur est supérieure ou inférieure à zéro (ou dont le texte commence par `+` ou `-`).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

Les lignes et les colonnes sont des slots que le tableau crée une fois et conserve : le défilement leur attribue d'autres lignes et colonnes à afficher, de sorte
qu'un défilement, aussi long soit-il, ne change que des textes et des positions.

<a id="drawing-cells-and-titles"></a>

## Dessiner les cellules et les titres

`renderCell` dessine les cellules propres à l'app lorsqu'une colonne n'est pas que du texte (un badge, un bouton). Il n'est appelé que pour les
cellules visibles, avec un `DataTableCell` : `row`, `column`, `key`, `text` (ce que le tableau afficherait) et `selected`.
L'app retrouve ses propres données par `row`. `renderHeaderCell` dessine un titre sur toute sa cellule, avec un `DataTableHeaderCell` :
`column`, `key`, `title`, `sort` (la direction, ou aucune) et `selected`.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  renderCell={(cell) =>
    cell.key === "status" ? (
      <View class={cell.text === "open" ? "rounded bg-green-500/20 px-2" : "rounded bg-muted px-2"}>
        <Text class="text-xs">{cell.text}</Text>
      </View>
    ) : (
      <Text class="px-2 text-sm">{cell.text}</Text>
    )
  }
  class="flex-1"
/>
```

`fontFamily` et `fontSize` (par défaut `14`) définissent la police des cellules, dans laquelle le tableau mesure aussi les textes pour ajuster
les colonnes.

<a id="the-ref"></a>

## La ref

`ref` fournit un `DataTableRef`. Une méthode à laquelle on donne une ligne, une colonne ou une clé de colonne que le tableau ne possède pas ne change rien
et journalise un avertissement nommant la méthode et la valeur ; `fitColumn` est rejetée avec un `TypeError` pour une clé inconnue.

| Méthode | Description |
|---|---|
| `scrollToRow(row, animated?)` | Fait défiler une ligne dans la vue. |
| `scrollToColumn(key, animated?)` | Fait défiler une colonne dans la vue. |
| `selection()` | Ce qui est sélectionné, `null` si rien. |
| `select(selection)` | Sélectionne (`null` : rien) et amène la sélection dans la vue, sans `onSelectionChange`. |
| `visibleRows()`, `visibleColumns()` | Les lignes et les colonnes défilantes visibles, sous forme de `{ start, end }` (`end` exclues). |
| `columnWidths()` | Les largeurs actuelles, dans l'ordre de `columns`. |
| `setColumnWidth(key, width)` | Définit la largeur d'une colonne, dans ses limites. |
| `fitColumn(key)` | Donne à une colonne la largeur que nécessitent son texte et son titre les plus larges, parmi les lignes visibles et jusqu'à mille de plus autour. Renvoie la largeur. |
| `dump(start?, end?)` | Les textes des lignes données (par défaut toutes celles détenues) et des titres, tels qu'affichés : `{ headers, rows }`, pour l'export. |
| `copy()` | Place le texte de la sélection dans le presse-papiers : les cellules d'une ligne séparées par des tabulations, celles d'une colonne par des sauts de ligne, le texte d'une cellule. |
| `focus()`, `blur()` | Donne le clavier au tableau ou le lui retire. |
| `menuTarget()`, `clearMenuTarget()` | L'endroit pour lequel le dernier menu contextuel a été demandé (`{ row?, column? }`, marqué par `cellActive` / `rowActive`), et la suppression de ce marquage lorsque le menu de l'app se ferme. |

<a id="styling-the-parts"></a>

## Styliser les parties

`class` et `style` stylisent la boîte du tableau. `classes` accepte des classes Tailwind par partie et `styles` des styles en ligne par partie ;
les parties fournissent la structure et l'alignement du tableau ; leurs classes fournissent l'apparence, et les `styles` l'emportent sur les classes.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  stripe
  class="flex-1 rounded-lg border border-border"
  classes={{
    header: "bg-secondary",
    headerCell: "pl-2 pr-1",
    headerContent: "gap-1",
    cell: "px-2",
    resizeHandle: "bg-border group-hover:bg-primary",
    sortAscending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    sortDescending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    rowSelected: "bg-primary/10",
    rowHover: "bg-muted/50",
    fixedEdge: "bg-border",
  }}
/>
```

| Partie | Ce que c'est |
|---|---|
| `root` | La boîte du tableau : sa bordure, son rayon et son arrière-plan |
| `header` | L'en-tête sur toute la largeur du tableau, avec ses lignes de libellés de groupe et de titres |
| `groupCell` | Un libellé de groupe au-dessus des colonnes qu'il couvre |
| `headerCell` | La cellule de titre de chaque colonne |
| `headerContent` | La ligne de mise en page du libellé et du bouton de tri ; définissez ici leur espacement |
| `headerCellDragging` | Le titre en cours de glissement, après `headerCell` |
| `headerCellSorted` | Le titre de la colonne selon laquelle le tableau est trié, après `headerCell` |
| `headerCellSelected` | Le titre de la colonne sélectionnée, après `headerCell` |
| `sortIndicator` | Le bouton de tri d'une colonne triable |
| `sortAscending`, `sortDescending` | Ses deux chevrons ; `selected:` s'applique à la direction du tri |
| `resizeHandle` | La ligne au bord de fin d'une colonne qu'un glissement redimensionne |
| `moveIndicator` | La ligne où une colonne glissée sera déposée |
| `row` | Chaque ligne du corps |
| `rowOdd` | Les lignes impaires, après `row` (`stripe`) |
| `rowHover` | La ligne survolée par le pointeur, après `row` |
| `rowSelected` | La ligne sélectionnée, après `row` |
| `rowActive` | La ligne pour laquelle un menu contextuel a été demandé lorsque les cellules ne se sélectionnent pas, jusqu'au prochain appui, après `row` |
| `cell` | Chaque cellule du corps |
| `cellSelected` | La cellule sélectionnée, après `cell` |
| `cellActive` | La cellule pour laquelle un menu contextuel a été demandé, jusqu'au prochain appui, après `cell` |
| `cellColumnSelected` | Les cellules de la colonne sélectionnée, après `cell` |
| `rowHeader` | Les cellules d'en-tête de ligne, les numéros de ligne |
| `rowHeaderCorner` | Le coin au-dessus des en-têtes de ligne |
| `fixedEdge` | La ligne au bord de fin des colonnes fixes, au-dessus des colonnes qui défilent dessous |
| `empty` | La boîte du slot `empty` |
## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | Les colonnes, de gauche à droite. Les colonnes fixes viennent en premier. |
| `data` | `.data(..)` | `Row[]` | `[]` | Les lignes : objets indexés par la colonne `key`, ou tableaux indexés par position. |
| `rowCount` | `.row_count(..)` | `number` | les lignes fournies | Le nombre total de lignes. |
| `dataStart` | `.data_start(..)` | `number` | `0` | Le numéro de ligne de la première ligne de `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | Classes des lignes données, selon leur position dans `data` : l'apparence propre à une ligne, sans appel à JS par ligne. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | La hauteur d'une ligne du corps, en points. |
| `headerHeight` | `.header_height(..)` | `number` | la hauteur de ligne | La hauteur d'une ligne de titre. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | Libellés au-dessus des colonnes, du niveau le plus bas au plus haut. |
| `sort` | `.sort(..)` | `DataTableSort` | | Le critère de tri des données, affiché sur le titre. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | Les appuis et les touches sélectionnent des lignes. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | L'appui sur un titre sélectionne sa colonne, et les touches horizontales passent d'une colonne à l'autre. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | Les appuis et les touches sélectionnent des cellules. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Un appui avec Shift ou la touche commande maintenue sélectionne une ligne. |
| `selection` | `.selection(..)` | `DataTableSelection` | | Ce qui est sélectionné, lorsque l'application le définit. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | Les touches fléchées bouclent aux extrémités. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent au tableau. |
| `rowHeader` | `.row_header(..)` | `boolean` | affiché avec `cellSelectable` | Une colonne de numéros de ligne à gauche. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | Les lignes impaires reçoivent la partie `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | Faire glisser le bord d'une colonne la redimensionne. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | Faire glisser un titre déplace sa colonne. |
| `loading` | `.loading(..)` | `boolean` | `false` | Le tableau est en cours de chargement : `onLoadMore` attend et `loadingView` s'affiche. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | Il reste des lignes à charger. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | À combien de lignes de la dernière `onLoadMore` se déclenche. |
| `fontFamily` | `.font_family(..)` | `string` | héritée | La police des cellules. |
| `fontSize` | `.font_size(..)` | `number` | `14` | La taille de police des cellules, en points. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Les barres de défilement. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | La barre de défilement d'un axe (la barre horizontale est celle des ordinateurs de bureau, sous le tableau). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Indique si le défilement rebondit aux extrémités, là où la plateforme le permet. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | Dessine les cellules visibles. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | Dessine les titres. |
| `empty` | `.empty(..)` | `JSX.Element` | | Ce qui s'affiche quand il n'y a aucune ligne. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | Ce qui s'affiche par-dessus les lignes tant que `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | Classes Tailwind par partie. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | Styles en ligne par partie, prioritaires sur les classes. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | | La boîte du tableau. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | L'utilisateur a modifié la sélection : `{ selection }`, un `{ row?, column? }` ou `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | Une ligne ou une cellule a été pressée : `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | Une ligne, une cellule ou un titre a été pressé deux fois : `{ target }`, un `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | Un menu contextuel a été demandé : `{ row?, column?, x, y }`, le point dans la vue racine. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | Un bouton de tri a été pressé : `{ sort }`, le tri suivant `{ key, direction }` ou `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | Une colonne a été redimensionnée (`{ key, width }`), à chaque étape d'un glissement et une fois de plus quand un ajustement la définit. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | Une colonne a été déplacée : `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | Les lignes visibles ont changé : `{ range }`, un `{ start, end }`. Récupérez les lignes à partir d'ici. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | Les colonnes défilantes visibles ont changé : `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | Les lignes visibles sont arrivées à moins de `loadMoreThreshold` de la dernière alors que `hasMore` et non `loading`. |

<a id="related"></a>

## Voir aussi

- [Editor](./editor.md) et [DiffView](./diff-view.md) : les autres composants de base riches en données.
- [Menu](./menu.md) : le menu à ouvrir depuis `onContextMenu`.
- [`nsh/base`](../modules/nsh-base.md) : les autres composants de base.
