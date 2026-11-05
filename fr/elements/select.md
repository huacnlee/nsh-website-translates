---
title: "Select"
description: "Le composant Select : une valeur choisie dans une liste d'éléments, une fenêtre contextuelle au niveau de son déclencheur sur ordinateur et une feuille (sheet) sur téléphone, avec le clavier, la saisie prédictive, la recherche et les sections, stylisé par l'application."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Un select permet de choisir une valeur dans une liste d'éléments : un réglage, un filtre, un pays, un fuseau horaire. Le déclencheur de l'app ouvre la liste, présentée comme chaque appareil l'attend :

- Sur les ordinateurs de bureau et dans les navigateurs de bureau, une popup au-dessus du déclencheur, avec la ligne sélectionnée superposée au déclencheur, de sorte que le titre choisi reste à sa place (la position `item-aligned` de shadcn/ui), aussi large que le déclencheur (la largeur `popupStyle` / `popupClass` de l'app en impose une autre, comme le `menu_width` de `gpui-component`) et aussi haute que ses lignes, dans la limite de la place disponible à l'écran ; sans sélection, elle s'ouvre sous le déclencheur. Le clavier parcourt les éléments et en choisit un.
- Sur les téléphones et les tablettes, une feuille en bas de l'écran, au-dessus d'un fond d'arrière-plan.

Le select gère le comportement : la valeur (celle de l'app, ou la sienne), l'état d'ouverture, le clavier, la saisie prédictive, la recherche, les sections, la ligne en surbrillance et ce qu'entendent les lecteurs d'écran. L'apparence revient à l'app : elle stylise le déclencheur, la popup, la liste, les lignes, les en-têtes de section et le champ de recherche, ou dessine elle-même les lignes.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `select()` en crée un avec un setter par prop (`.items(..)`, `.value(..)`, `.item_style(..)`) et un écouteur par événement (`.on_change(..)`) ; `SelectItem::new(value, title)` crée un élément, avec `.disabled(..)` et `.group(..)`.

<a id="items"></a>

## Éléments

`items` est la liste sous forme de données : chaque élément a une `value` (unique parmi les éléments : ce que le choix de l'élément définit), un `title` (ce que montre sa ligne, ce que la recherche et la saisie prédictive comparent, et ce que disent les lecteurs d'écran), et en option `disabled` et un `group`. Les éléments adjacents d'un même `group` forment une section sous un en-tête portant ce titre :

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

Les lignes forment une liste virtualisée dans la vue défilante de la popup : une liste de milliers d'éléments ne crée que les lignes visibles, et la popup défile lorsque ses lignes dépassent la place dont elle dispose.

<a id="value"></a>

## Valeur

Avec `value`, l'app possède l'élément choisi : le select affiche l'élément de cette valeur et signale un choix avec `onChange({ value })` ; l'app définit `value` pour le suivre, ou garde sa propre valeur. `value={null}` signifie que rien n'est choisi. S'il est omis, le select garde sa propre valeur, à partir de `defaultValue` au départ. `onChange` signale les changements : choisir à nouveau l'élément déjà choisi ferme la liste.

`cleanable` ajoute un bouton d'effacement tant qu'un élément est choisi : un appui efface la valeur, signalé par `onChange({ value: null })`, et la liste reste fermée. Le bouton se place après le déclencheur dans la vue du select, et non à l'intérieur, de sorte qu'un appui dessus n'ouvre jamais la liste ; l'app le place (sur la fin du déclencheur avec `absolute`, là où serait un chevron) et le remplit :

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

Le déclencheur est l'élément de l'app : il affiche donc ce que l'app veut pour l'élément choisi : son titre, une icône, un texte indicatif tant que rien n'est choisi. En TSX, c'est l'élément que vous passez : il est la combobox et reçoit lui-même les appuis, le focus clavier, l'état déployé et `disabled`, de sorte que ses propres classes `active:`, `focus:` et `disabled:` suivent le select, que son propre `onPress` s'exécute aussi, et que la liste se place contre lui et a sa largeur.

<a id="open-state"></a>

## État d'ouverture

Sans `open`, le select garde son propre état d'ouverture (à partir de `defaultOpen`). Avec `open`, l'app le possède et le modifie dans `onOpenChange({ open, reason })` : `"triggerPress"` (un appui sur le déclencheur, ou l'une de ses touches), `"select"` (un choix), `"pressOutside"`, `"backdropPress"` ou `"cancel"` (Échap ou retour). `onOpen` et `onClose` indiquent quand la liste est affichée et quand elle a disparu (pour une feuille, une fois qu'elle est entrée et une fois qu'elle est sortie), `onCancel` que l'utilisateur l'a fermée sans choisir.

<a id="search"></a>

## Recherche

`searchable` place un champ de recherche au-dessus des éléments : la saisie les filtre par titre, sans tenir compte de la casse, et une section sans correspondance disparaît avec son en-tête. La surbrillance se déplace sur la première correspondance, les touches continuent de la déplacer tant que le champ a le clavier, et Entrée la choisit. `empty` est ce que la liste affiche tant que rien ne correspond :

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

Sur les ordinateurs de bureau, le champ de recherche prend le clavier à l'ouverture de la liste ; sur les écrans tactiles, le clavier apparaît lorsqu'on appuie sur le champ. Chaque ouverture commence avec une recherche vide.

<a id="rows-the-app-draws"></a>

## Lignes dessinées par l'app

`itemClass` stylise la ligne de chaque élément, qui affiche le titre de l'élément jusqu'à ce que `renderItem` la dessine : `focus:` s'applique à la ligne en surbrillance (là où se trouvent les touches ou le pointeur), `selected:` à la ligne choisie et `disabled:` à une ligne désactivée. Pour dessiner une ligne, donnez `renderItem` : elle reçoit ce qu'est l'élément ([`SelectEntry`](#types)) et renvoie le contenu de la ligne, pour les lignes visibles. Elle ne reçoit jamais l'état de la ligne : avec `group` dans `itemClass`, le contenu suit les états de la ligne grâce aux classes `group-focus:`, `group-selected:` et `group-disabled:`, de sorte que le dessin est réalisé une seule fois par élément et qu'un déplacement de la surbrillance ou un choix ne redessine rien. `renderGroup` dessine l'en-tête d'une section de la même manière :

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Les éléments, dans l'ordre. |
| `value` | `.value(..)` | `string \| null` | aucun | La `value` de l'élément choisi, possédée par l'app ; `null` pour aucun. S'il est omis, le select garde la sienne. |
| `defaultValue` | `.default_value(..)` | `string` | aucun | La valeur initiale, sans `value`. |
| `open` | `.open(..)` | `boolean` | aucun | Ouvert, possédé par l'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Ouvert au départ, sans `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | Un champ de recherche au-dessus des éléments les filtre par titre. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | aucun | Le texte indicatif du champ de recherche. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | aucun | Comment les lecteurs d'écran nomment le champ de recherche : ce qu'il recherche. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un bouton d'effacement tant qu'un élément est choisi ; un appui efface la valeur (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il reste fermé : le déclencheur ne reçoit ni appuis ni focus clavier, et les styles `disabled:` s'y appliquent. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Comment les lecteurs d'écran le nomment : ce que concerne le choix. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Ordinateurs de bureau : le côté du déclencheur où se place la liste, l'autre côté si seul celui-là a de la place. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Ordinateurs de bureau : son alignement par rapport au déclencheur. |
| `offset` | `.offset(..)` | `number` | `0` | Ordinateurs de bureau : l'écart entre le déclencheur et la liste. |
| `margin` | `.margin(..)` | `number` | `0` | Ordinateurs de bureau : la distance qu'elle conserve par rapport aux bords de la zone de sécurité. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La popup (ordinateurs de bureau) ou la feuille (écrans tactiles) qui contient la liste. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Écrans tactiles : le fond d'arrière-plan derrière la feuille. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La liste, la vue défilante des lignes. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | La ligne de chaque élément, dont les styles de texte sont hérités par son titre : `focus:` en surbrillance, `selected:` lorsqu'elle est choisie, `disabled:` lorsqu'elle ne peut pas l'être. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'en-tête de chaque section. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | aucun | Le champ de recherche : sa boîte et son texte (`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le bouton d'effacement (`cleanable`) ; `disabled:` avec le select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | aucun | Le contenu du bouton d'effacement : une croix, une icône. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | aucun | Comment les lecteurs d'écran nomment le bouton d'effacement. |
| `trigger` | `.trigger(..)` | `JSX.Element` | aucun | Ce qui ouvre la liste lorsqu'on appuie dessus ; la liste se place contre lui. |
| `empty` | `.empty(..)` | `JSX.Element` | aucun | Ce que la liste affiche lorsqu'aucun élément n'est visible (une recherche sans correspondance). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | aucun | La ligne d'un élément, dessinée par l'app à partir de ce qu'est l'élément (ses états sont les classes de la ligne) ; sinon, le titre de l'élément. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | aucun | L'en-tête d'une section, dessiné par l'app ; sinon, son titre. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La vue autour du déclencheur. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | L'utilisateur a choisi un autre élément (un appui, Entrée ou Espace, la saisie prédictive sur le déclencheur) : sa `value` ; `null` lorsque le bouton d'effacement l'a effacée. Définissez `value` pour le suivre. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | La liste s'est ouverte ou fermée, avec la raison. Définissez `open` pour le suivre. |
| `onOpen` | `.on_open(\|\| ..)` | La liste est affichée ; pour une feuille, une fois qu'elle est entrée. |
| `onClose` | `.on_close(\|\| ..)` | La liste a disparu ; pour une feuille, une fois qu'elle est sortie. Aussi lorsque l'app l'a fermée. |
| `onCancel` | `.on_cancel(\|\| ..)` | L'utilisateur a fermé la liste sans choisir (Échap ou retour, un appui à l'extérieur ou sur le fond d'arrière-plan). |

Ils arrivent dans cet ordre : `onChange` pour un choix, ou `onCancel` pour une fermeture sans choix, puis `onOpenChange`, puis `onOpen` ou `onClose` une fois la liste affichée ou disparue.

<a id="types"></a>

## Types

| Type | Membres | Description |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | Un élément de `items`. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (celui de l'élément), `index: number` | Ce que reçoit `renderItem` : l'élément et son index parmi les `items`, jamais son état (les `focus:`, `selected:` et `disabled:` de la ligne). |
| `SelectGroup` | `title: string` | Ce que reçoit `renderGroup` : le `group` de la section. |

En Rust, ce sont `nsh_base::SelectItem`, `SelectEntry` et `SelectGroup` ; `value` est un `SelectValue` (`Controlled(Some(..))` pour une valeur, `Controlled(None)` pour `null`), que `.value(..)` construit à partir d'un `Option<SharedString>` ou d'une chaîne.

<a id="parts"></a>

## Parties

| Partie | Emplacement | Stylisée avec |
|---|---|---|
| Le déclencheur | la vue du select | l'élément propre de l'app (`trigger`) |
| Le bouton d'effacement | la vue du select, après le déclencheur (`cleanable`, tant qu'un élément est choisi) | `clearButtonClass`, `clearButtonStyle` ; son contenu `clearButton` |
| La popup ou la feuille | au-dessus de tout, au niveau du déclencheur (ordinateurs de bureau) ou en bas (écrans tactiles) | `popupClass`, `popupStyle` |
| Le fond d'arrière-plan | derrière la feuille (écrans tactiles) | `backdropClass`, `backdropStyle` |
| Le champ de recherche | la popup, en premier (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| La liste | la popup, après le champ de recherche | `listClass`, `listStyle` |
| L'en-tête d'une section | la liste, avant ses éléments | `groupClass`, `groupStyle`, `renderGroup` |
| La ligne d'un élément | la liste | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` à l'intérieur, sous `group` dans `itemClass`) |
| L'état vide | la popup, tant qu'aucun élément n'est visible | son propre élément (`empty`) |

La popup est une colonne : sa hauteur suit le champ de recherche et les lignes, de sorte qu'un `max-h-*` sur `popupClass` la plafonne et que la liste défile à l'intérieur.

<a id="keyboard"></a>

## Clavier

Sur les ordinateurs de bureau, Tab atteint le déclencheur d'un select qui n'est pas `disabled`. Lorsque la liste est fermée, Bas, Haut, Entrée et Espace l'ouvrent sur l'élément choisi (sans élément choisi, Haut ouvre sur le dernier élément activé et les autres touches sur le premier), et les lettres et les chiffres choisissent l'élément dont le titre commence par ce qui a été saisi, comme le fait un select natif. Lorsque la liste est ouverte :

| Touche | Action |
|---|---|
| Bas, Haut | L'élément activé suivant ou précédent, en bouclant aux extrémités. |
| Début, Fin | Le premier ou le dernier élément activé (ceux du champ de recherche lorsqu'il a le clavier). |
| Page suivante, Page précédente | Une page de lignes plus loin, ou en arrière. |
| Entrée | Choisit l'élément en surbrillance et ferme la liste. |
| Espace | Choisit l'élément en surbrillance (sans champ de recherche). |
| Lettres, chiffres | L'élément suivant dont le titre commence par ce qui a été saisi pendant la dernière seconde (sans champ de recherche). |
| Échap | Ferme la liste sans choisir. |

Une fois la liste fermée, le focus clavier revient au déclencheur, sauf si un appui à l'extérieur l'a emmené ailleurs. Le pointeur met en surbrillance la ligne qu'il survole ; la ligne en surbrillance est rendue visible lorsque les touches s'y déplacent.

<a id="on-each-device"></a>

## Sur chaque appareil

| | Ordinateurs de bureau et navigateurs de bureau | Téléphones et tablettes |
| --- | --- | --- |
| La liste | une popup au-dessus du déclencheur, avec la ligne sélectionnée dessus (en dessous tant qu'aucune ne l'est), aussi large que le déclencheur sauf si `popupStyle` définit une largeur, aussi haute que ses lignes dans la limite de la place disponible à l'écran | une feuille en bas au-dessus d'un fond d'arrière-plan, aussi haute que ses lignes jusqu'à la barre d'état |
| La fermer | un choix, Échap, un appui à l'extérieur (qui se poursuit sur ce qui se trouve sous le pointeur) | un choix, le fond d'arrière-plan, le bouton retour d'Android |
| Recherche | le champ prend le clavier à l'ouverture de la liste | le clavier apparaît lorsqu'on appuie sur le champ |
| Un choix | l'appui vers le bas choisit, de sorte que le champ de recherche garde le clavier | un toucher |

`popupClass` stylise la popup sur les ordinateurs de bureau et la feuille sur les téléphones ; un style qui diffère entre les deux peut comparer `platform.idiom` (`nsh/device`) avec `"desktop"`.
<a id="accessibility"></a>

## Accessibilité

- Le déclencheur est une combobox pour les lecteurs d'écran : son libellé est `accessibilityLabel`, sa valeur est le titre de l'élément choisi,
  et il indique si la liste est développée. `disabled` l'atténue.
- Le bouton d'effacement est un bouton nommé par `clearButtonAccessibilityLabel` ; il n'est pas un arrêt de tabulation.
- Le champ de recherche est un champ de texte nommé par `searchAccessibilityLabel` ; son texte indicatif est une aide affichée tant qu'il est
  vide.
- La liste est une listbox et chaque ligne une option, nommée par son titre ; l'option choisie est sélectionnée et une option désactivée
  est atténuée. Les en-têtes de sections sont des en-têtes.
- Lorsque les touches déplacent la surbrillance, le focus du lecteur d'écran se déplace vers la ligne mise en surbrillance ; tant que le champ de recherche a
  le clavier, le titre de l'élément mis en surbrillance est annoncé à la place, afin que la saisie puisse continuer.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.
