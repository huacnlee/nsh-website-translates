---
title: "Menu"
description: "Menu et ContextMenu avec MenuItem, MenuSeparator et Submenu : une fenêtre contextuelle avec des sous-menus en cascade sur ordinateur, une feuille avec des sous-menus intégrés sur téléphone, stylée par l'application."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

Un menu est une liste d'actions qu'ouvre son déclencheur. Une même structure sert tous les appareils, présentée comme chacun l'attend :

- Sur les ordinateurs de bureau et dans les navigateurs de bureau, une popup au niveau du déclencheur ; un `Submenu` s'ouvre en cascade à côté de son élément lorsque le pointeur le survole ou appuie dessus.
- Sur les téléphones et les tablettes, une feuille en bas de l'écran au-dessus d'un fond ; un `Submenu` affiche ses éléments dans la feuille à la place de ceux du menu, avec une ligne de votre choix pour revenir en arrière.

Choisir un élément, un appui à l'extérieur, Échap, le bouton retour d'Android et le geste d'échappement de VoiceOver le ferment. `ContextMenu` est le même menu ouvert par le bouton secondaire (un clic droit) à l'emplacement du pointeur, ou par un doigt maintenu sur son déclencheur sur les écrans tactiles.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

Les cinq proviennent de [`nsh/base`](../modules/nsh-base.md). Les éléments rejoignent leur menu d'eux-mêmes, vous pouvez donc les organiser librement : groupes dans des vues, libellés, éléments qui apparaissent et disparaissent avec `If`. `popupClass` stylise la popup sur les ordinateurs de bureau et la feuille sur les téléphones ; un style qui diffère entre les deux peut comparer `platform.idiom` (`nsh`) avec `"desktop"`.

<a id="menu-bars"></a>

## Barres de menus

Les menus dont les déclencheurs sont des éléments d'un même `Toolbar` forment une barre de menus : lorsqu'un de ses menus est ouvert, le pointeur passant sur le déclencheur d'un autre menu ouvre celui-ci à la place, et les touches fléchées se déplacent entre les déclencheurs.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## Menus contextuels

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

Sur les ordinateurs de bureau, le bouton secondaire l'ouvre à l'emplacement du pointeur. Sur les écrans tactiles, un doigt maintenu sur le déclencheur l'ouvre sous forme de feuille ; les appuis propres au déclencheur et les vues défilantes environnantes continuent de fonctionner, et déplacer le doigt annule le maintien.

<a id="checkable-items"></a>

## Éléments cochables

`checked` rend un élément cochable : un réglage que le menu affiche (« Afficher la barre latérale ») ou, avec `role="menuitemradio"`, un choix parmi un groupe (« Trier par »). La valeur vous appartient : choisir l'élément appelle `onSelect`, vous définissez la valeur suivante, et l'élément l'affiche. Tant qu'il est coché, ses classes `checked:` et `checkedStyle` s'appliquent, ainsi que celles de son indicateur : la partie située avant son contenu (`indicatorClass`, `indicatorStyle`) autour de la marque que vous lui donnez (`indicator`). La marque est créée une seule fois puis conservée ; les classes `checked:` de l'indicateur l'affichent et la masquent, ou bien les classes `group-checked:` propres à la marque avec `group` dans `indicatorClass`. `closeOnSelect={false}` garde le menu ouvert, de sorte qu'un réglage montre sa nouvelle valeur immédiatement.

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

Une marque au bord de fin se place plutôt dans le contenu, stylisée avec les classes `group-checked:` sous `group` sur l'élément.

<a id="entrance-and-exit"></a>

## Entrée et sortie

Sur les ordinateurs de bureau, la popup apparaît et disparaît avec vos transitions, comme celle d'un [Popover](./popover.md#entrance-and-exit) : `popupStartingClass` est son aspect dans sa première image, `popupEndingClass` son aspect une fois fermée, qu'elle conserve pendant l'exécution des classes `transition-*` de `popupClass`, puis `onClose` suit. Les sous-menus reprennent les mêmes aspects et se ferment avec leur menu. La feuille des téléphones glisse d'elle-même à l'entrée et à la sortie.

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

<a id="open-state"></a>

## État d'ouverture

Sans `open`, un menu garde son propre état (à partir de `defaultOpen` pour `Menu`). Avec `open`, l'app en est propriétaire et le modifie dans `onOpenChange({ open, reason })` : `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` ou `"longPress"`.

## Props

<a id="menu-1"></a>

### Menu

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | aucun | Ouvert, contrôlé par l'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Ouvert au départ, sans `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Ordinateurs de bureau : le côté du déclencheur où il se place. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Ordinateurs de bureau : son alignement par rapport au déclencheur. |
| `offset` | `.offset(..)` | `number` | `0` | Ordinateurs de bureau : l'écart entre le déclencheur et la popup. |
| `margin` | `.margin(..)` | `number` | `0` | Ordinateurs de bureau : la distance qu'il garde par rapport aux bords de la zone sûre. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La popup (ordinateurs de bureau) ou la feuille (téléphones), et les popups des sous-menus. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Ordinateurs de bureau : l'aspect des popups dans leur première image, par-dessus le leur. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Ordinateurs de bureau : l'aspect des popups une fois fermées, conservé pendant l'exécution de leurs transitions. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Téléphones : le fond derrière la feuille. |
| `trigger` | `.trigger(..)` | `JSX.Element` | aucun | Ce qui l'ouvre lorsqu'on appuie dessus. Tant que le menu est ouvert, ses classes `aria-expanded:` et `expandedStyle` s'appliquent. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les éléments, créés à chaque ouverture. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, les aspects de départ et de fin, `backdropClass` / `backdropStyle`, `trigger` et `children` comme pour `Menu`, et :

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Le bouton secondaire et les doigts maintenus ne font rien. |
| `offset` | `.offset(..)` | `number` | `0` | Ordinateurs de bureau : l'écart entre le pointeur et la popup. |
| `margin` | `.margin(..)` | `number` | `0` | Ordinateurs de bureau : la distance qu'il garde par rapport aux bords de la zone sûre. |

### MenuItem

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Non sélectionnable ; les styles `disabled:` s'appliquent. |
| `checked` | `.checked(..)` | `boolean` | aucun | Coché ou non, ce qui en fait un élément cochable ; appartient à l'app. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | aucun | Son style lorsqu'il est coché, sous forme de classes `checked:`. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` avec `checked`, sinon `"menuitem"` | Ce qu'il est pour les lecteurs d'écran ; `"menuitemradio"` pour un choix parmi un groupe. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'indicateur, la partie située avant son contenu ; ses classes `checked:` et `disabled:` suivent l'élément. |
| `indicator` | `.indicator(..)` | `JSX.Element` | aucun | La marque à l'intérieur de l'indicateur. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | Le choisir ferme le menu. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran, lorsque le contenu ne suffit pas. |
| `children`, `class`, `style` | `.child(..)`, méthodes de style | | aucun | Son contenu et son aspect, avec les états `hover:`, `active:` et `checked:`. |

### Submenu

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | aucun | L'élément qui l'ouvre. |
| `back` | `.back(..)` | `JSX.Element` | aucun | Téléphones : la ligne au-dessus de ses éléments qui ramène aux éléments du niveau englobant. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il ne s'ouvre pas. |
| `offset` | `.offset(..)` | `number` | `0` | Ordinateurs de bureau : l'écart entre le menu qui l'entoure et sa popup. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Ses éléments. |

`MenuSeparator` est une vue que vous stylisez (`class`, `style`), affichée avec les éléments de son niveau.

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | Il s'est ouvert ou fermé, avec la raison. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | Il est affiché ; sous forme de feuille, une fois entré. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | Il a disparu : sous forme de feuille une fois sorti, sous forme de popup après sa sortie. Également lorsque l'app l'a fermé. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | Ordinateurs de bureau : la popup a été placée : `placement` (le côté où elle s'est placée), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | L'utilisateur a tenté de le fermer sans rien choisir (Échap ou retour, un appui à l'extérieur ou sur le fond). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | L'élément a été choisi ; un élément cochable demande son autre valeur. |

<a id="accessibility"></a>

## Accessibilité

La popup ou la feuille est un menu et ses éléments sont des éléments de menu pour les lecteurs d'écran ; le déclencheur indique si le menu est déployé. Un élément cochable est un élément de menu de type case à cocher ou bouton radio, lu comme coché ou non coché ; son indicateur fait partie de l'élément. En TSX, le déclencheur est l'élément que vous passez, un `Button` ou une vue de votre cru : il prend lui-même en charge les appuis et l'état déployé, de sorte que ses propres classes `active:` et `activeStyle` s'appliquent pendant l'appui, et que son propre `onPress` s'exécute aussi. Seuls les éléments du niveau affiché sont à l'écran, les lecteurs d'écran lisent donc ce qui s'y trouve.
