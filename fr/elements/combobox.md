---
title: "Combobox"
description: "Le composant Combobox : une ou plusieurs valeurs choisies dans une liste d'éléments filtrée par la saisie dans son champ, avec une fenêtre contextuelle sous le champ sur ordinateur et une feuille sur téléphone, stylisée par l'application."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Un Combobox permet de choisir des valeurs dans une liste d'éléments, une seule ou, avec `multiple`, plusieurs : les tags d'un article, les membres d'un canal, les langues d'un document. Son déclencheur est un champ de saisie : taper ouvre la liste et la filtre, comme le combobox de shadcn/ui. C'est le frère de [Select](./select.md) et il partage sa liste, présentée comme chaque appareil l'attend :

- Sur les ordinateurs et dans les navigateurs de bureau, une popup sous le champ, aussi large que le champ (la largeur `popupStyle` / `popupClass` de l'app en définit une autre) et aussi haute que ses lignes, dans la limite de la place disponible à côté.
- Sur les téléphones et les tablettes, une sheet en bas de l'écran, au-dessus d'un backdrop.

Le Combobox gère le comportement : la valeur (celle de l'app, ou la sienne), l'état ouvert, le clavier, la recherche, les sections, la ligne en surbrillance et ce qu'entendent les lecteurs d'écran. Avec `multiple`, un choix bascule l'élément dans la valeur et la liste reste ouverte, ce qui permet d'en choisir plusieurs d'un coup. L'apparence revient à l'app : elle stylise le champ, la popup, la liste, les lignes, les en-têtes de sections, le champ de saisie et le pied, ou dessine elle-même les lignes.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` vient de [`nsh/base`](../modules/nsh-base.md), la crate `nsh-base` en Rust. En Rust, `combobox()` en crée un avec un setter par prop (`.items(..)`, `.value(..)`, `.multiple(..)`) et un listener par événement (`.on_change(..)`). Ses éléments sont ceux de `Select` : `SelectItem::new(value, title)`, avec `.disabled(..)` et `.group(..)`, répartis en sections comme ceux d'un select (voir [Items](./select.md#items)).

<a id="value"></a>

## Valeur

La valeur est un tableau des valeurs des éléments sélectionnés. Avec `value`, l'app la possède : le Combobox affiche ces éléments comme sélectionnés et signale chaque changement avec `onChange({ value })` ; l'app définit `value` pour le suivre, ou garde sa propre valeur. Si elle est omise, le Combobox garde sa propre valeur, initialisée à partir de `defaultValue`.

- Avec `multiple`, un appui, Entrée ou Espace bascule l'élément en surbrillance : dans la valeur s'il n'y était pas, hors de la valeur s'il y était. La liste reste ouverte.
- Sans lui, un choix remplace la valeur par celle de cet élément et ferme la liste ; choisir à nouveau l'élément sélectionné ne fait que fermer la liste.

`onConfirm({ value })` communique la valeur à la fermeture de la liste : une fois par ouverture, quelle que soit la façon dont elle se ferme (un choix, Échap, un appui à l'extérieur, le bouton déclencheur), avec la valeur telle que l'utilisateur l'a laissée. Cmd+Entrée sur Mac (Ctrl+Entrée ailleurs) ferme la liste et confirme.

`cleanable` ajoute un bouton d'effacement tant qu'un élément est sélectionné : un appui vide la valeur (`onChange({ value: [] })`). Le bouton se place après le champ de saisie, avant le bouton déclencheur ; un appui dessus n'ouvre jamais la liste. L'app le remplit, comme [le bouton d'effacement d'un select](./select.md#value).

<a id="input"></a>

## Champ de saisie

Le déclencheur est un champ de texte dans la ligne du Combobox (ses `class` et `style` : la bordure et le fond du champ), avec le `prefix` de l'app devant lui (les éléments choisis sous forme de chips, une icône) et, après lui, le bouton d'effacement, le `triggerButton` de l'app (un chevron) et `suffix`.

- Taper ouvre la liste et filtre les éléments par titre, sans tenir compte de la casse ; `empty` s'affiche tant que rien ne correspond. Bas et Haut l'ouvrent aussi, un appui sur le bouton déclencheur l'ouvre et la ferme, et sur les écrans tactiles un appui sur le champ de saisie l'ouvre.
- Avec une seule valeur, le champ affiche le titre de l'élément choisi (`placeholder` tant qu'il n'y en a pas). Il est sélectionné quand le champ reçoit le focus, de sorte que ce qui est tapé le remplace.
- Avec `multiple`, le champ affiche la requête ; l'app affiche les éléments choisis, dans `prefix` ou à côté du Combobox.

La requête est celle du Combobox, qui repart à chaque ouverture de `defaultQuery` (sinon vide), ou celle de l'app avec `query` : `onQueryChange({ query })` signale ce qui est tapé, et l'app définit `query` pour le suivre, afin de filtrer à sa manière ou de suggérer un point de départ.

<a id="footer"></a>

## Pied

`footer` est un contenu sous les lignes, dans une partie à part (`footerClass`, `footerStyle`) : une action (« Gérer les tags »), un compteur, une indication. Il reste en place pendant que les lignes défilent.

## Props

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Les éléments, dans l'ordre. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Un choix bascule l'élément dans la valeur et la liste reste ouverte. |
| `value` | `.value(..)` | `string[]` | aucune | Les valeurs des éléments sélectionnés, possédées par l'app. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | La valeur initiale, sans `value`. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | L'état ouvert, celui de l'app ou celui du Combobox. |
| `placeholder` | `.placeholder(..)` | `string` | aucun | Le placeholder du champ de saisie, tant qu'il est vide. |
| `query` | `.query(..)` | `string` | aucune | La requête, possédée par l'app. |
| `defaultQuery` | `.default_query(..)` | `string` | aucune | La requête de départ de chaque ouverture, sans `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un bouton d'effacement tant qu'un élément est sélectionné ; un appui vide la valeur. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il reste fermé et n'accepte ni appuis ni focus clavier. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce sur quoi porte le choix, pour les lecteurs d'écran. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | comme ceux de `Select` | `"bottom"`, `"start"`, 0, 0 | Ordinateurs : où placer la popup par rapport au champ. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La popup (ordinateurs) ou la sheet (écrans tactiles). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le backdrop derrière la sheet. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La liste, la vue défilante des lignes. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | La ligne de chaque élément : `focus:` quand elle est en surbrillance, `selected:` quand elle est sélectionnée, `disabled:` quand elle ne peut pas l'être. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'en-tête de chaque section. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | aucun | Le champ de saisie : `focus:` pendant l'édition, `disabled:` avec le Combobox. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le pied, sous les lignes. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le bouton d'effacement (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | aucun | Le contenu du bouton d'effacement. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent au bouton d'effacement. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | aucun | Un bouton après le champ de saisie (un chevron) : un appui ouvre et ferme la liste. |
| `prefix` | `.prefix(..)` | `JSX.Element` | aucun | Contenu avant le champ de saisie : chips, icône. |
| `suffix` | `.suffix(..)` | `JSX.Element` | aucun | Contenu après le bouton déclencheur. |
| `empty` | `.empty(..)` | `JSX.Element` | aucun | Ce que la liste affiche quand aucun élément ne s'affiche. |
| `footer` | `.footer(..)` | `JSX.Element` | aucun | Ce qui s'affiche sous les lignes. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | aucun | La ligne d'un élément, dessinée par l'app à partir de ce qu'est l'élément, jamais de son état : le contenu suit les `group-focus:`, `group-selected:` et `group-disabled:` de la ligne (`group` dans `itemClass`), si bien qu'un déplacement de la surbrillance ou une bascule ne redessine rien ; sinon, le titre de l'élément. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | aucun | L'en-tête d'une section, dessiné par l'app ; sinon, son titre. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le champ : la ligne du préfixe, du champ de saisie, des boutons et du suffixe ; la liste a sa largeur. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | La valeur a changé (un choix, une bascule, le bouton d'effacement) : `{ value }`, les valeurs des éléments sélectionnés. Définissez `value` pour le suivre. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | La liste s'est fermée : `{ value }` tel qu'il est alors, une fois par ouverture. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | L'utilisateur a tapé dans le champ de saisie : `{ query }`. Définissez `query` pour le suivre. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | La liste s'est ouverte ou fermée, avec la raison (`{ open, reason }`). Définissez `open` pour le suivre. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | La liste est affichée, ou a disparu. |
| `onCancel` | `.on_cancel(..)` | L'utilisateur a fermé la liste sans faire de choix qui la ferme (Échap ou retour, un appui à l'extérieur ou sur le backdrop). |

Ils arrivent dans cet ordre : `onChange` pour un choix, ou `onCancel` pour une fermeture sans choix, puis `onOpenChange`, puis `onConfirm` à la fermeture de la liste, puis `onOpen` ou `onClose` une fois la liste affichée ou disparue.

<a id="parts"></a>

## Parties

| Partie | Emplacement | Stylisée avec |
|---|---|---|
| Le champ | la vue du Combobox, une ligne | `class`, `style` |
| Le préfixe | le champ, en premier | l'élément propre à l'app (`prefix`) |
| Le champ de saisie | le champ, après le préfixe | `inputClass`, `inputStyle`, `placeholder` |
| Le bouton d'effacement | le champ, après le champ de saisie (`cleanable`, tant qu'un élément est sélectionné) | `clearButtonClass`, `clearButtonStyle` ; son contenu `clearButton` |
| Le bouton déclencheur | le champ, après le bouton d'effacement | l'élément propre à l'app (`triggerButton`) |
| Le suffixe | le champ, en dernier | l'élément propre à l'app (`suffix`) |
| La popup ou la sheet | au-dessus de tout, sous le champ (ordinateurs) ou en bas (écrans tactiles) | `popupClass`, `popupStyle` |
| Le backdrop | derrière la sheet (écrans tactiles) | `backdropClass`, `backdropStyle` |
| La liste | la popup | `listClass`, `listStyle` |
| L'en-tête d'une section | la liste, avant ses éléments | `groupClass`, `groupStyle`, `renderGroup` |
| La ligne d'un élément | la liste | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` à l'intérieur, sous `group` dans `itemClass`) |
| L'état vide | la popup, tant qu'aucun élément ne s'affiche | son propre élément (`empty`) |
| Le pied | la popup, en dernier | `footerClass`, `footerStyle` ; son contenu `footer` |

<a id="keyboard"></a>

## Clavier

Les touches sont celles d'un select (voir [Keyboard](./select.md#keyboard)) tant que le champ de saisie garde le focus, avec ces différences : les lettres et les chiffres sont saisis dans le champ, qui filtre la liste, au lieu d'une recherche par frappe (typeahead) ; Bas et Haut ouvrent la liste fermée ; Entrée bascule l'élément en surbrillance avec `multiple` et garde la liste ouverte ; Cmd+Entrée sur Mac (Ctrl+Entrée ailleurs) la ferme et confirme. Quand la liste se ferme sur les ordinateurs, le champ de saisie garde le focus.

<a id="accessibility"></a>

## Accessibilité

- Le champ de saisie est un combobox pour les lecteurs d'écran : son libellé est `accessibilityLabel`, sa valeur les titres des éléments sélectionnés, séparés par des virgules, et il indique si la liste est développée. `disabled` l'atténue.
- La liste est une listbox et chaque ligne une option, nommée par son titre ; les options sélectionnées sont indiquées comme telles et une option désactivée est atténuée. Les en-têtes de sections sont des en-têtes.
- Le bouton d'effacement est un bouton nommé par `clearButtonAccessibilityLabel` ; ce n'est pas un arrêt de Tab. Le bouton déclencheur est masqué aux lecteurs d'écran, puisque le champ de saisie indique si la liste est ouverte, et n'est pas non plus un arrêt de Tab.

Voir [Accessibility](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.
