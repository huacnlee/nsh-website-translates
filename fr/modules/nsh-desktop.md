---
title: "nsh/desktop"
description: "API réservées au bureau : la fenêtre (titre, barre de titre, agrandissement, plein écran), une barre de titre propre à l'application avec des zones déplaçables, le menu de l'application, les menus contextuels et les raccourcis clavier."
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` regroupe ce que seuls les ordinateurs de bureau possèdent : la fenêtre et sa barre de titre, le menu de l'application et les menus contextuels. Il fonctionne sous macOS, Windows et Linux. Le code Rust retrouve la même chose dans `nsh_core::element::desktop` : les fonctions de la fenêtre (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), le menu de l'application et les menus contextuels (`set_application_menu`, `popup_menu`, composés de `MenuItem`s), et marque les vues déplaçables avec `.window_drag(true)` ; TSX importe `nsh/desktop`. Le module peut être importé sur toutes les plateformes, donc un seul bundle s'exécute partout : sur iOS et Android, ses fonctions ne font rien, et `isAvailable` indique si sa fenêtre et ses menus sont présents.

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true` là où les API de fenêtre et de menu de ce module fonctionnent : macOS, Windows et Linux ; `false` ailleurs. Rust : `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) est la vérification plus large du comportement de bureau (props `desktop={{…}}`, `platform.select({ desktop })`) : elle est aussi vraie dans les navigateurs en idiome bureau, qui s'exécutent dans la propre fenêtre du navigateur. Conditionnez la mise en page, la densité et la saisie de bureau sur `platform.desktop`, et les appels de `Window` et `Menu` sur `isAvailable`.

<a id="window"></a>

## Fenêtre

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

La colonne Rust nomme les fonctions de `nsh_core::element::desktop`.

| Membre | Rust | Description |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | Le titre de la fenêtre : la barre de titre, la barre des tâches ou le Dock, le sélecteur de fenêtres. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` supprime la barre de titre du système : l'application remplit la fenêtre jusqu'à son bord supérieur et dessine sa propre barre de titre. Les commandes de fenêtre du système restent (les « feux tricolores » de macOS, les boutons réduire / agrandir / fermer de Windows, les boutons de fenêtre de GTK). `height` est la hauteur de votre barre en points : les commandes y sont centrées (les boutons de légende de Windows la remplissent ; sous macOS, `height` sélectionne le chrome compact jusqu'à 44 points et le chrome normal au-delà ; dimensionnez votre barre d'après la hauteur réelle de `titleBar().height`, et AppKit place les feux tricolores pendant le redimensionnement en direct. La barre d'outils existante d'une application hôte conserve son propre style et sa hauteur) ; sans elle, les commandes prennent la hauteur de la plateforme. `style: "default"` rétablit la barre de titre du système (Rust : `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | Sous Windows et Linux dans les applications GPUI, où la fenêtre dessine le menu de l'application comme une barre au-dessus de l'application : `"shown"` (par défaut) l'affiche toujours ; `"autoHide"` l'affiche après que Alt a été pressée puis relâchée seule, jusqu'à ce que Alt seule la masque à nouveau, comme dans les applications Windows et GNOME. F10 et Alt avec l'initiale d'un menu ouvrent un menu dans les deux cas, et la barre s'affiche tant qu'il est ouvert. La barre de menus de macOS est celle du système. |
| `minimize()` | `minimize()` | Réduit la fenêtre. |
| `toggleMaximize()` | `toggle_maximize()` | Agrandit la fenêtre, ou la restaure si elle est agrandie. |
| `toggleFullScreen()` | `toggle_full_screen()` | Entre en plein écran ou le quitte. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | Déplace et dimensionne la fenêtre en points ; les champs omis conservent leurs valeurs. Sous macOS et Windows, `size` (`width`, `height`) inclut les décorations de fenêtre ; sous Linux, il définit la taille par défaut de la fenêtre GTK. `origin` (`x`, `y`) est le coin supérieur gauche de la fenêtre, mesuré depuis le coin supérieur gauche de l'écran principal (sous macOS, celui qui a la barre de menus) avec `y` croissant vers le bas, de la même façon sur toutes les plateformes ; un `height` sans `y` conserve le bord supérieur là où il est, de sorte que la fenêtre grandit et rétrécit par son bord inférieur. `animated: true` active l'animation de redimensionnement de macOS (par défaut : false). |
| `setLevel(level)` | `set_level(level)` | Sous macOS et Windows, `"floating"` garde la fenêtre au-dessus des fenêtres normales et `"normal"` rétablit le niveau normal. `"desktopIcon"` sélectionne le niveau des icônes du bureau de macOS (la fenêtre se trouve aussi sur tous les espaces, hors de Mission Control et de Cmd+`) ; sous Windows, il place la fenêtre au bas de l'ordre z actuel, où une activation ultérieure peut la remonter. |
| `orderFront()` | `order_front()` | Amène la fenêtre au premier plan de son niveau et lui donne le focus (l'application s'active ; macOS désminiaturise, Windows restaure les fenêtres réduites et définit le premier plan, GTK présente). La fenêtre conserve son niveau. Sous macOS, les surfaces de niveau bureau restent derrière les autres fenêtres. GPUI active sa fenêtre ; sous Linux, le gestionnaire de fenêtres contrôle les demandes de premier plan. |
| `close()` | `close_window()` | Ferme la fenêtre ; l'application se termine avec elle. |

Le dimensionnement de la fenêtre est pris en charge sous macOS, Windows et Linux ; le positionnement et les niveaux, sous macOS et Windows. Le gestionnaire de fenêtres de Linux contrôle le placement et l'empilement. Dans les applications GPUI, `setFrame` définit la taille de la fenêtre et la plateforme la place ; l'hôte de GPUI choisit sa position et son niveau à l'ouverture de la fenêtre.

Lorsque vous dimensionnez une fenêtre d'après un contenu mesuré avec `onLayout`, prévoyez de la place pour les décorations de fenêtre sous macOS et Windows. `width` et `height` acceptent des nombres finis positifs ; `x` et `y` acceptent des nombres finis. Les champs invalides conservent leurs valeurs précédentes.

<a id="a-title-bar-of-your-own"></a>

## Votre propre barre de titre

Lorsque la barre de titre est masquée, l'application dessine sa propre barre et indique quelles parties déplacent la fenêtre, avec `.window_drag(true)` en Rust et `desktop={{ windowDrag: true }}` en TSX :

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

Appuyer sur une vue avec `windowDrag` fait glisser la fenêtre comme le ferait la barre de titre du système : un double-clic l'agrandit (ou fait ce que l'utilisateur a choisi : sous macOS, « Double-cliquer sur la barre de titre d'une fenêtre pour »), et sous Windows et Linux un clic droit ouvre le menu de la fenêtre.

- La vue la plus proche qui définit `windowDrag` décide : `.window_drag(false)` (`desktop={{ windowDrag: false }}`) garde une partie d'une vue déplaçable cliquable.
- Les champs de texte et les vues avec des gestionnaires de pression ou de toucher (`onPress`, `onTouch*`, responders) à l'intérieur d'une vue déplaçable restent cliquables sans cela : le champ de recherche et les boutons de l'exemple ci-dessus fonctionnent normalement.
- `windowDrag` fonctionne aussi avec la barre de titre du système : une barre latérale ou une barre d'outils peut aussi déplacer la fenêtre.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

La zone de la barre de titre masquée, en points (réactif) : sa `height`, et les largeurs que prennent les commandes de fenêtre du système à ses extrémités `left` et `right`. Disposez votre barre avec elle pour que rien ne passe sous les commandes. Les trois valent 0 tant que le système affiche sa barre de titre (et en plein écran, et hors des ordinateurs de bureau). Rust : `title_bar() -> Edges<Points>`, dont `top` est la hauteur et `left` et `right` les largeurs des commandes ; la lire abonne aux changements.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, sinon celle de la barre de titre (28 ou 32, selon la version de macOS) | La largeur des feux tricolores | 0 |
| Windows | `height`, sinon 32 | 0 | Les trois boutons de légende (138) |
| Linux | `height`, sinon celle de la barre d'en-tête | Les boutons de fenêtre au début (la disposition des boutons du bureau) | Les boutons de fenêtre à la fin |

Sous Windows, les boutons de légende sont dessinés par NSH dans le style de Windows 11 et suivent l'apparence de l'application ; survoler le bouton d'agrandissement affiche les dispositions d'ancrage (snap layouts) de Windows 11. La fenêtre conserve ses bordures de redimensionnement, son ombre et ses coins arrondis sur toutes les plateformes.

## Menu

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Membre | Description |
|---|---|
| `setApplicationMenu(items)` | Définit le menu de l'application : un sous-menu par élément de premier niveau (`File`, `Edit`, ...). Sous macOS, c'est la barre de menus, dont le premier menu est le menu de l'application (AppKit le titre avec le nom de l'application). Sous Windows et Linux, c'est la barre de menus de la fenêtre, qui n'est pas affichée tant que la barre de titre est masquée ; ses raccourcis fonctionnent toujours, et une barre de titre propre à l'application peut ouvrir ses menus avec `Menu.popup`. `null` rétablit le menu par défaut de la plateforme. |
| `popup(items, at?)` | Affiche un menu contextuel avec son coin supérieur gauche en `at` (coordonnées de la fenêtre, en points : le `e.pagePosition` d'un `onContextMenu`), ou au niveau du pointeur. La promesse se résout à la fermeture du menu, qu'un élément ait été choisi ou non : un bouton qui l'a ouvert peut rester enfoncé jusque-là. |

En Rust, `set_application_menu(items)` prend un `Vec<MenuItem>` (`None` rétablit le menu par défaut de la plateforme), et `popup_menu(items)` (au niveau du pointeur) et `popup_menu_at(items, at)` renvoient un `Answer<()>` qui arrive une fois le menu fermé (l'attendre est facultatif). Le gestionnaire d'un élément s'exécute sous le propriétaire (owner) qui a défini le menu, tant que ce propriétaire vit.

Appelez `setApplicationMenu` de nouveau pour changer le menu. À l'intérieur d'un `effect`, il suit les signaux qu'il lit : une coche ou un état désactivé qui dépend de l'état de l'application reste à jour.

<a id="menu-items"></a>

### Éléments de menu

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| Champ | Description |
|---|---|
| `label` | Ce que l'élément affiche. Un élément de rôle a son propre libellé sans lui. |
| `onSelect` | Appelé quand l'élément est choisi, par un clic ou son raccourci. |
| `shortcut` | Son raccourci clavier : modificateurs et une touche reliés par `+`, tels que `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` ou `"f11"`. Les modificateurs figurent dans le tableau ci-dessous. Les touches sont des lettres, des chiffres et de la ponctuation, écrits comme le caractère que la touche tape sur un clavier US sans Shift (`,`, `/` ; `"shift+/"` pour `?`), ou un nom : `plus` (la touche `=` / `+`, aussi `=`), `minus` (aussi `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, les flèches `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. La casse n'a pas d'importance (`"Mod+Shift+N"` vaut `"mod+shift+n"` ; une lettre majuscule est la même touche, pas Shift), et les minuscules sont le style recommandé. Un raccourci invalide (`"mod-n"`, `"mod++"`, `"mod+?"`) lève une erreur qui donne la bonne orthographe. `keymap` accepte les mêmes frappes. Les menus l'affichent dans le style propre à la plateforme (`⇧⌘N` sous macOS, `Ctrl+Shift+N` sous Windows). |
| `when` | Quand le raccourci choisit l'élément alors qu'un champ de texte a le focus clavier, sur le backend GPUI : `"always"` (par défaut), `"auto"` (sauf si le champ utilise lui-même la touche : touches qui saisissent, déplacent le curseur ou suppriment, et raccourcis d'édition, comme avec les liaisons de [`keymap`](./nsh.md#keymap)) ou `"notEditing"`. Une touche que l'élément laisse passe au champ. |
| `disabled` | `true` grise l'élément (par défaut `false`). |
| `checked` | Défini (à `true` ou `false`) pour un élément avec une coche. |
| `submenu` | Fait de l'élément un sous-menu (il a besoin d'un `label`). |
| `role` | Un élément standard que la plateforme exécute (ci-dessous). |

Les éléments `null`, `undefined` et `false` sont ignorés, de sorte que `cond && { … }` fonctionne dans une liste.

En Rust, un élément est `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` ou `MenuItem::submenu(label, items)`, avec les champs comme méthodes : `.shortcut("mod+n")` (elle panique sur un raccourci invalide, avec la bonne orthographe), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)`, et `.label(..)` pour un élément de rôle.

Modificateurs :

| Modificateur | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (aussi `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (aussi `command`, `meta`, `super`, `win`) | Command (⌘) | Touche Windows | Super |
| `ctrl` (aussi `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (aussi `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

Utilisez `mod` pour les raccourcis propres à une application : c'est la touche que les applications de chaque plateforme utilisent pour eux (⌘N sous macOS, Ctrl+N sous Windows et Linux), donc une seule écriture convient partout. La touche Windows et Super appartiennent surtout au système (Win+E, la vue d'ensemble de GNOME), donc `cmd` est rarement approprié hors de macOS.

Rôles :

| Rôle | Action | Plateformes |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | Les éléments standard du menu de l'application | macOS (omis ailleurs) |
| `quit` | Quitte l'application | Toutes |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | Modifient le champ de texte ayant le focus (ses propres raccourcis restent les siens) | Toutes |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | La fenêtre | Toutes |

L'élément d'un rôle a le libellé et le raccourci de la plateforme, sauf s'il définit les siens (macOS ajoute le nom de l'application à `about`, `hide` et `quit`).

Les raccourcis de menu passent en premier, comme dans les applications natives : une touche prise par un élément n'atteint jamais le champ de texte ayant le focus ni les touches propres à NSH. Seule une liaison de [`keymap`](./nsh.md#keymap) avec la même frappe passe avant eux. Donnez donc les raccourcis d'édition (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) uniquement aux rôles d'édition, qui les transmettent au champ de texte, et évitez les touches sans modificateur (`escape`, les flèches, les lettres), qui les prendraient aux champs de texte et à la navigation arrière. Sur le backend GPUI, `when: "auto"` permet à un élément de partager une touche avec les champs de texte : `delete` ou `mod+z` choisissent l'élément tant qu'aucun champ n'a le focus et modifient le texte tant qu'un champ l'a.

Sur le backend GPUI, un composant natif ayant le focus clavier voit chaque touche en premier. Une touche qu'il gère lui-même n'atteint jamais la keymap ni le menu. Une touche qu'il laisse passer atteint la keymap comme si un champ de texte avait le focus, puis le menu.

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

Un menu contextuel, à partir de l'appui sur un bouton :

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> Les menus sont ceux du système (NSMenu, menus Win32, menus popover GTK) : ils ont l'apparence et le comportement de ceux de toutes les autres applications, suivent l'apparence du système (ou de l'application) et sont accessibles au clavier. `examples/desktop` est une application avec sa propre barre de titre, un menu d'application et des menus contextuels.
