---
title: "Command"
description: "Command : une palette de commandes, un champ de recherche portant sur les commandes de l'application, filtrées au fil de la saisie : une palette Cmd+K dans une boîte de dialogue, un menu de commandes intégré, une recherche à laquelle l'application répond. Virtualisé, pensé d'abord pour le clavier, avec une list box pour les lecteurs d'écran. L'apparence de chaque partie est laissée à l'application."
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

Une palette de commandes est un champ de recherche au-dessus d'une liste de commandes : l'utilisateur tape quelques lettres, la liste se réduit aux commandes qui correspondent, les flèches déplacent la mise en surbrillance et Entrée exécute la commande en surbrillance. `Command` gère le comportement d'une palette : le filtrage, les sections, la surbrillance, le clavier et ce qu'entendent les lecteurs d'écran. Le filtrage s'exécute nativement et les lignes sont virtualisées : seules les lignes visibles sont créées, de sorte qu'une palette de milliers de commandes, de fichiers ou d'emoji filtre à chaque frappe. L'apparence appartient à l'app : la commande ne dessine rien d'elle-même, l'app style chaque partie (`itemClass`, `groupClass`, `searchClass`, ...) et dessine le contenu des lignes (`renderItem` : une icône, le libellé, les touches du raccourci).

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La requête appartient à l'app lorsque celle-ci définit `query`, qu'elle met à jour dans `onQueryChange` ; sans cela, le champ de recherche garde la sienne, à partir de `defaultQuery`. Les éléments sont identifiés par leur `id`, propre à l'app, jamais par leur libellé : `onSelect({ id })` indique lequel l'utilisateur a choisi. En Rust, `command()` la construit, avec un setter par prop (`.items(..)`, `.query(..)`, `.render_item(..)`), une méthode d'écouteur par événement et les méthodes de style typées.

<a id="items"></a>

## Éléments

`items` désigne les commandes, dans l'ordre, chacune étant un `CommandItem` :

| Champ | Type | Description |
|---|---|---|
| `id` | `string` | Ce qui l'identifie dans `onSelect` et `onHighlightChange` : unique parmi les éléments. |
| `label` | `string` | Ce que sa ligne affiche, sauf si `renderItem` la dessine, ce que disent les lecteurs d'écran et ce que la requête recherche. |
| `keywords` | `string[]` | Des mots supplémentaires que la requête recherche : synonymes, un nom anglais à côté d'un libellé traduit. |
| `group` | `string` | Sa section : les éléments adjacents d'un même groupe s'affichent sous un en-tête portant ce titre. |
| `shortcut` | `string` | Le raccourci clavier de la même commande, tel que le nomme [`keymap`](../modules/nsh.md#keymap) (`"mod+shift+p"`), à afficher sur sa ligne. L'app le lie avec `keymap.bind`. |
| `disabled` | `boolean` | Il ne peut pas être choisi : les touches le sautent, les appuis ne font rien, les styles `disabled:` s'appliquent. |
| `checked` | `boolean` | C'est celui qui est en vigueur (un thème, une langue) : les styles `checked:` s'appliquent et les lecteurs d'écran indiquent qu'il est coché. |

La requête correspond à un élément lorsque son libellé ou l'un de ses mots-clés la contient, sans tenir compte de la casse ni des espaces qui l'entourent. Les éléments gardent leur ordre, et une section sans correspondance disparaît avec son en-tête. `renderItem` reçoit un `CommandEntry` pour chaque ligne visible : les champs de l'élément, et `shortcutLabel`, son `shortcut` tel que les indications l'affichent ici (`⇧⌘P` sur les plateformes d'Apple, `Ctrl+Shift+P` ailleurs). Il décrit ce qu'est l'élément, et la surbrillance est le `focus:` de la ligne : le dessin est réalisé une seule fois par élément et conserve ses vues pendant que la surbrillance se déplace.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | Les commandes, dans l'ordre. |
| `query` | `.query(..)` | `string` | aucun | La requête (contrôlée), que l'app définit dans `onQueryChange`. |
| `defaultQuery` | `.default_query(..)` | `string` | aucun | La requête initiale, tant que `query` n'est pas définie. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | Un champ de recherche au-dessus des lignes. Sans lui, tous les éléments s'affichent, et la commande constitue un arrêt du focus clavier avec saisie prédictive. |
| `filterable` | `.filterable(..)` | `boolean` | `true` | La requête filtre les éléments. Désactivée, tous les éléments s'affichent : pour une recherche dont l'app fournit elle-même les réponses (les résultats d'un serveur définis comme `items`). Une nouvelle requête met quand même en surbrillance le premier élément. |
| `loading` | `.loading(..)` | `boolean` | `false` | Une recherche est en cours : `empty` attend, et la liste est occupée pour les lecteurs d'écran. Affichez votre indicateur dans `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | aucun | Le texte indicatif du champ de recherche. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Le champ de recherche prend le focus clavier dès qu'il est affiché : une palette qui s'ouvre pour qu'on y tape. |
| `separator` | `.separator(..)` | `boolean` | `true` | Une ligne de séparation entre deux sections affichées, stylée par `separatorClass` ; jamais en première ni en dernière position, ni en double. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent à la liste (« Commandes »), et au champ de recherche tant que `searchAccessibilityLabel` n'est pas défini. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | Le nom que les lecteurs d'écran donnent au champ de recherche : ce qu'il recherche (« Rechercher des commandes »). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | aucun | Ce qui s'affiche au-dessus du champ de recherche (un titre) et sous les lignes (les indications de touches, un compteur). |
| `empty` | `.empty(..)` | `JSX.Element` | aucun | Ce qui s'affiche lorsqu'aucun élément ne l'est : une requête sans correspondance, aucun élément. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | aucun | Ce qui s'affiche avant et après le champ de recherche dans sa barre : une icône de recherche, un indicateur de progression pendant `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | aucun | Le contenu d'une ligne, pour les lignes visibles ; sans lui, une ligne affiche le libellé de l'élément. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | aucun | L'en-tête d'une section (`{ heading }`) ; sans lui, un en-tête affiche son titre. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La commande elle-même : sa taille, son cadre et sa surface. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La ligne de `searchPrefix`, du champ de recherche et de `searchSuffix`. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | Le champ de recherche. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La vue défilante des lignes. Donnez-lui une hauteur (`max-h-80`, ou une commande dimensionnée) : les lignes défilent à l'intérieur, et seules celles visibles sont créées. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | La ligne de chaque élément et ses états (ci-dessous) ; ses styles de texte atteignent le libellé. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | L'en-tête de chaque section. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Chaque séparateur : la hauteur et la couleur d'un trait. |

<a id="events"></a>

## Événements

| Événement | Rust | Données | Quand |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | L'utilisateur a choisi un élément : Entrée, ou un appui sur sa ligne. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | La surbrillance s'est déplacée (les touches, le pointeur, une nouvelle requête ou de nouveaux éléments, `highlight`) : pour prévisualiser ce qu'exécuterait Entrée. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | L'utilisateur a tapé dans le champ de recherche, ou Échap l'a vidé. |
| `onCancel` | `.on_cancel(..)` | aucune | Échap avec une requête vide : fermer ce qui contient la commande (le `open` d'une boîte de dialogue). |

<a id="parts"></a>

## Parties

| Partie | Dans | Stylée avec | États |
|---|---|---|---|
| La commande | | `class`, `style` | |
| `header` | la commande | l'élément de l'app | |
| La barre de recherche | la commande | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, le champ de recherche, `searchSuffix` | la barre de recherche | les éléments de l'app ; `searchClass`, `searchStyle` | le `focus:` du champ |
| La liste | la commande | `listClass`, `listStyle` | |
| L'en-tête d'une section | la liste | `groupClass`, `groupStyle`, `renderGroup` | |
| Un séparateur | la liste | `separatorClass`, `separatorStyle` | |
| Une ligne | la liste | `itemClass`, `itemStyle` | `focus:` (en surbrillance), `checked:`, `disabled:`, `hover:`, `active:` |
| Le contenu d'une ligne | une ligne | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:` sous `group` dans `itemClass` |
| `empty` | la commande | l'élément de l'app | |
| `footer` | la commande | l'élément de l'app | |

Affichez la ligne en surbrillance avec `focus:` (voir [Guides de conception](../docs/design-guides.md#interaction-states)).

## Ref

| Méthode | Description |
|---|---|
| `focus()` | Donne le focus clavier au champ de recherche (sans champ, à la commande). |
| `highlight(id)` | Met en surbrillance l'élément de `id` et fait défiler sa ligne jusqu'à la zone visible ; un élément non affiché ou désactivé reste inchangé. |
| `matchedCount()` | `Promise<number>` : combien d'éléments la requête affiche, y compris les éléments désactivés. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## Une palette dans une boîte de dialogue

Placez la commande dans un [`Dialog`](./dialog.md) et ouvrez-le avec le raccourci de l'app. Échap vide d'abord la requête ; avec une requête vide, c'est `onCancel`, où l'app ferme la boîte de dialogue.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## Une recherche dont l'app fournit les réponses

Avec `filterable={false}`, tous les éléments fournis par l'app s'affichent : l'app effectue la recherche dans `onQueryChange` (un serveur, une base de données) et définit `items` avec les résultats, `loading` pendant qu'elle attend.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## Accessibilité

- La liste a le rôle `"listbox"`, nommée par `accessibilityLabel` ; chaque ligne est un `"option"` nommé d'après le libellé de son élément, coché et désactivé comme l'est son élément ; l'en-tête d'une section est un `"header"`, un séparateur est masqué.
- Le champ de recherche est un champ de texte nommé par `searchAccessibilityLabel` (sinon `accessibilityLabel`) ; son texte indicatif est un conseil affiché tant qu'il est vide.
- Le champ de recherche garde le focus clavier pendant que les flèches déplacent la surbrillance, et les lecteurs d'écran énoncent le libellé en surbrillance. Sans champ de recherche, la ligne en surbrillance reçoit le focus du lecteur d'écran.
- Pendant `loading`, la liste est occupée.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

| Touche | Effet |
|---|---|
| Saisie | Filtre les éléments ; la première correspondance activée est mise en surbrillance. |
| Bas, Haut | Met en surbrillance l'élément suivant ou précédent, en sautant les éléments désactivés, du dernier au premier et inversement. |
| Page suivante, Page précédente | Déplace la surbrillance du nombre de lignes visibles. |
| Entrée | Choisit l'élément en surbrillance (`onSelect`). |
| Échap | Vide la requête ; avec une requête vide, signale `onCancel`. |
| Début, Fin | Sans champ de recherche : le premier ou le dernier élément (dans le champ, elles déplacent son curseur). |
| Espace, lettres, chiffres | Sans champ de recherche : Espace choisit, les lettres et les chiffres mettent en surbrillance par saisie prédictive. |

<a id="platform-notes"></a>

## Notes sur les plateformes

- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : le pointeur met en surbrillance la ligne qu'il survole, et un clic choisit dès que le bouton est enfoncé, de sorte que le champ de recherche garde le focus clavier.
- iOS, Android et Mac Catalyst : un appui choisit une ligne, et la touche Retour du clavier choisit l'élément en surbrillance et conserve le champ pour la requête suivante.
- Chaque plateforme dessine ce que l'app style : la commande, sa barre de recherche, ses lignes et leur contenu.
