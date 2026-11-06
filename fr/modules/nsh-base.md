---
title: "nsh/base"
description: "Composants de base sans style pour l'interface d'une application : boutons, liens, avatars, carrousels, cases à cocher, boutons radio, interrupteurs, onglets, boutons à bascule, barres d'outils, arborescences, listes de sélection, comboboxes, palettes de commandes, calendriers, sélecteurs de date, champs d'heure, panneaux redimensionnables, espaces de travail ancrables, documents Markdown et HTML, éditeur de code, diffs, champs de texte, piles de navigation et boîtes de dialogue, boîtes de dialogue d'alerte système et barre d'état des pages et des boîtes de dialogue."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` est la couche de composants de base de l'interface d'une app : des composants sans style qui prennent en charge le comportement, l'état, le focus et l'accessibilité, sur toutes les plateformes. Elle se place entre les primitives (`nsh`, `nsh/mobile` et `nsh/desktop`) et la bibliothèque de composants propre à l'app, comme `gpui-base` se place entre `gpui` et une bibliothèque stylée dans GPUI Kit (voir [Modules](./index.md#three-layers)). Elle fournit des contrôles (`Button`, `Link`, `Checkbox`, `ColorPicker` avec son `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` et `ColorEyeDropper`, `NumberInput`, `Radio` dans un `RadioGroup`, `Slider`, `Switch`, `Tab` dans `Tabs`, `Toggle` dans un `ToggleGroup`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), des palettes de commandes (`Command`), des barres de contrôles (`Toolbar` avec ses `ToolbarGroup` et `ToolbarSeparator`), des barres de défilement au style propre à l'app (`Scrollbar`), des régions qui se déplient et se replient (`Collapsible`, et `Accordion` avec ses `AccordionItem`, `AccordionHeader`, `AccordionTrigger` et `AccordionPanel`), une barre de progression (`Progress`), des codes à usage unique (`OtpInput`), les pages d'un ensemble (`Pagination`), des éléments qui contiennent des éléments (`Tree`), les pièces dont sont faits les graphiques (`Plot` avec `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` et `Arc`, dans `nsh/base/plot`), des espaces de travail que l'utilisateur organise (des `ResizablePanel` dans un `ResizablePanelGroup`, et les divisions, groupes d'onglets et docks de `DockArea`), des carrousels (`Carousel` et ses parties), des documents Markdown ou HTML (`TextView`), un éditeur de code (`Editor`), les différences entre des textes (`DiffView`) et des tableaux de lignes et de colonnes (`Table` et ses parties, `DataTable`), des champs de saisie de texte (`Input`), des popups affichés par-dessus tout (`Popover`, `Menu` et `ContextMenu` avec leurs `MenuItem`, `MenuSeparator` et `Submenu`, `Tooltip`, `Sheet`), des toasts (`Toast` dans un `ToastStack`, leur cycle de vie dans un `ToastManager`), la navigation (un `NavStack` de `NavPage` piloté par l'état que vous créez avec `createNavStack`, et `Dialog` pour le contenu présenté par-dessus tout le reste) et les boîtes de dialogue d'alerte du système (`AlertDialog`). Les pages et les dialogues décident aussi de la barre d'état (`statusBar`).

L'ensemble de base comprend aussi `Avatar` et `AvatarGroup` : des images avec un état de chargement natif et une rangée qui place ses `limit` premiers avatars.

L'apparence est celle de l'app : ce qui se trouve dans une page, un dialogue ou un en-tête est votre propre JSX, construit à partir des primitives avec des styles, des classes [Tailwind](../docs/tailwind.md) et votre thème, des composants Rust issus de [votre propre crate](../docs/rust.md), ou une bibliothèque de composants que la communauté construit sur `nsh/base`. Chaque hôte sert `nsh/base` ; les apps Rust utilisent la même API depuis la crate `nsh-base` (`nsh_base::{button, dialog, …}`).

```rust tabs
use nsh_base::{
    MarkdownExtension, MarkdownOptions, accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger,
    alert_dialog, button, carousel, carousel_content, carousel_item, carousel_next,
    carousel_pagination, carousel_pagination_item, carousel_previous, checkbox, color_area, color_field, color_picker,
    color_slider, color_swatch, dialog, diff_view, dock_area, editor, hover_card, link,
    calendar, combobox, command, date_picker, h_resizable, nav_page, nav_stack, radio, radio_group, resizable_panel, select, switch, tab, tabs, text_view, theme, time_field, toast, toast_stack, toggle, toggle_group, toolbar, toolbar_group, toolbar_separator, tree, v_resizable,
};
```

```tsx tabs
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  AlertDialog,
  Avatar,
  AvatarGroup,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
  Checkbox,
  Collapsible,
  ColorArea,
  ColorEyeDropper,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ContextMenu,
  createNavStack,
  DataTable,
  Dialog,
  DiffView,
  DockArea,
  Editor,
  HoverCard,
  Link,
  Menu,
  OtpInput,
  Pagination,
  Progress,
  MenuItem,
  MenuSeparator,
  NavPage,
  NavStack,
  Popover,
  Radio,
  RadioGroup,
  ResizablePanel,
  ResizablePanelGroup,
  Scrollbar,
  Select,
  Combobox,
  Command,
  Calendar,
  TimeField,
  DatePicker,
  Sheet,
  NumberInput,
  Slider,
  Submenu,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TextView,
  Toast,
  ToastManager,
  ToastStack,
  Toggle,
  ToggleGroup,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  Tree,
  Tooltip,
} from "nsh/base";
import type {
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionPanelProps,
  AccordionProps,
  AccordionTriggerProps,
  AlertDialogAction,
  AlertDialogOptions,
  AlertDialogPresentation,
  AlertDialogResult,
  AlertDialogRole,
  AvatarGroupProps,
  AvatarProps,
  AvatarStatus,
  ButtonProps,
  CarouselContentProps,
  CarouselControlProps,
  CarouselItemProps,
  CarouselPaginationItemProps,
  CarouselPaginationProps,
  CarouselProps,
  CheckboxProps,
  CollapsibleProps,
  ColorAreaProps,
  ColorChannel,
  ColorFieldProps,
  ColorFormat,
  ColorPickerProps,
  ColorSliderProps,
  ColorSpace,
  ColorSwatchProps,
  DialogChangeReason,
  DataTableColumn,
  DataTableProps,
  DataTableRef,
  DataTableSelection,
  DataTableSort,
  DialogProps,
  DiffAnnotation,
  DiffFile,
  DiffHunk,
  DiffLineRange,
  DiffSeparator,
  DiffStats,
  DiffViewProps,
  DiffViewRef,
  DockAreaLayout,
  DockNode,
  DockRegion,
  EditorDecoration,
  EditorDiagnostic,
  EditorProps,
  EditorRef,
  EditorReplaceAll,
  EditorSearch,
  EditorSearchResult,
  EditorSelection,
  Edges,
  HeaderStyle,
  LinkOpenWith,
  LinkProps,
  NavPageProps,
  NavStackProps,
  NavStackState,
  OtpInputProps,
  PaginationItemState,
  PaginationProps,
  ProgressProps,
  StatusBar,
  RadioGroupProps,
  RadioProps,
  NumberInputProps,
  SelectEntry,
  SelectGroup,
  SelectItem,
  SelectProps,
  ComboboxProps,
  CommandEntry,
  CommandGroup,
  CommandItem,
  CommandProps,
  CalendarProps,
  TimeFieldProps,
  DatePickerProps,
  ScrollbarEntrance,
  ScrollbarLook,
  ScrollbarMode,
  ScrollbarMotion,
  ScrollbarProps,
  ScrollbarTheme,
  SliderProps,
  SliderScale,
  SliderValue,
  StatusBarForeground,
  SwitchProps,
  TabProps,
  TabsProps,
  TextViewProps,
  TextViewDocument,
  MarkdownExtension,
  MarkdownOptions,
  ToastEntry,
  ToastMotion,
  ToastOptions,
  ToastProps,
  ToastStackProps,
  ToastTransitionStatus,
  ToggleGroupProps,
  ToggleProps,
  ToolbarProps,
  TreeEntry,
  TreeItem,
  TreeProps,
} from "nsh/base";
```

Cette page est l'index du module : chaque composant a une page d'élément avec ses exemples, ses props et ses notes de plateforme. Pour des guides pas à pas, voir le [Guide de navigation](../docs/navigation.md) et [Formulaires et clavier](../docs/forms-and-keyboard.md).

| TSX | Rust | Ce que c'est |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | Une cible d'appui avec les états désactivé et sélectionné et un rôle pour les lecteurs d'écran. |
| [`Link`](../elements/link.md) | `link()` | Une cible d'appui qui mène quelque part : elle ouvre son `href` via le système, ou l'app l'ouvre (`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | La photo d'une personne, ou un repli (les initiales, l'icône de l'app) pendant son chargement, en cas d'échec et en son absence ; et une rangée qui affiche les `limit` premiers et un débordement. L'état de chargement est natif. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | Un contrôle coché, décoché ou indéterminé avec un indicateur que l'app stylise et marque. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | Une option d'un ensemble dont l'utilisateur choisit une seule, et l'ensemble ; l'app décide laquelle est cochée. |
| [`Switch`](../elements/switch.md) | `switch()` | Un contrôle activé / désactivé avec une piste et un curseur que l'app stylise. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | Un onglet d'une liste d'onglets, et la liste ; l'app décide lequel est sélectionné et affiche son contenu. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | Un bouton activé ou désactivé, et une barre d'outils de ces boutons ; l'app décide lesquels sont enfoncés. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | Une barre de boutons, de bascules et de liens : un seul arrêt du focus clavier dont les flèches se déplacent le long de la barre ; des groupes d'éléments liés et des lignes entre eux. |
| [`Carousel`](../elements/carousel.md) et ses parties | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | Des diapositives affichées une à la fois grâce au défilement propre à la plateforme, avec précédent / suivant, une pagination, les touches et une boucle continue ; l'app détient `index`. |
| [`Select`](../elements/select.md) | `select()` | Une valeur parmi une liste d'éléments : un popup au niveau du déclencheur sur ordinateur, une feuille sur téléphone ; l'app détient `value` et dessine le déclencheur. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | Une ou plusieurs valeurs (`multiple`) parmi une liste d'éléments filtrée par la saisie dans son champ ; l'app détient `value` et stylise le champ. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | Une date ou une plage de dates choisie parmi des mois de jours, avec des vues du mois et de l'année et le clavier ; l'app détient `value` et dessine les éléments. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | Une heure de la journée modifiée segment par segment (heure, minute, seconde, AM/PM) ; l'app détient `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | Une date, une plage ou une date et une heure choisies dans un calendrier, dans un popup au niveau du déclencheur sur ordinateur, une feuille sur téléphone ; l'app détient `value` et dessine le déclencheur. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | Une région dont le contenu se déplie et se replie ; l'app détient `open` et son déclencheur. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | Des sections empilées qui se déplient et se replient sous leurs titres, une à la fois ou plusieurs (`multiple`) ; l'app détient `value`, les éléments ouverts. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | Un code à usage unique dans des cellules que l'app stylise ; l'app détient `value`, `onComplete` indique quand il est complet. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | Les pages d'un ensemble : Précédent, les pages autour de la page courante avec des points de suspension, les enfants de l'app et Suivant ; l'app détient `page`. |
| [`Command`](../elements/command.md) | `command()` | Une palette de commandes : un champ de recherche sur les commandes de l'app, filtrées nativement par libellé et mots-clés, dans une liste virtualisée ; Entrée ou un appui choisit (`onSelect`), dans un `Dialog` pour une palette Cmd+K. |
| [`Tree`](../elements/tree.md) | `tree()` | Des éléments qui contiennent des éléments, virtualisés : dépliés et repliés, un sélectionné, un seul arrêt du focus clavier ; l'app détient `expanded` et `selected`, ou l'arbre garde les siens. |
| [`Progress`](../elements/progress.md) | `progress()` | Une barre de progression ; l'app détient `value` (0 à 100) et `indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | Un nombre saisi dans un champ ou incrémenté avec des boutons et des touches ; l'app détient `value` (ou le champ garde sa propre valeur à partir de `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | Une barre de défilement au style propre à l'app pour la vue défilante ou la liste qu'elle désigne (`scroll`) ; son curseur suit le contenu, et ses glissements et appuis le font défiler. |
| [`Slider`](../elements/slider.md) | `slider()` | Une valeur, ou une plage de deux, choisie le long d'une piste ; l'app détient `value` (ou le curseur garde sa propre valeur à partir de `defaultValue`). |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | Un sélecteur de couleur et ses parties : une zone de saturation et de luminosité, des curseurs pour n'importe quel canal de RGB, HSL, HSB ou OKLCH et pour l'alpha, des champs pour la couleur ou un canal, des nuances, une pipette ; l'app détient `value` (ou le sélecteur garde sa propre valeur à partir de `defaultValue`). |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | Des panneaux côte à côte ou empilés, avec des poignées que l'utilisateur fait glisser pour les redimensionner. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | Un espace de travail de divisions, de groupes d'onglets et de docks en bordure que l'utilisateur organise ; sa disposition est une donnée de l'app. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | Une pile de navigation native et ses pages. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | Du contenu présenté par-dessus tout le reste : feuilles, parcours plein écran, dialogues. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | L'alerte ou la feuille d'actions de la plateforme. |
| [`TextView`](../elements/text-view.md) | `text_view()` | Un document Markdown, HTML ou en blocs, dessiné avec des textes et des vues, pour les réponses d'IA diffusées en flux. |
| [`Editor`](../elements/editor.md) | `editor()` | Un éditeur de code : coloration syntaxique, plusieurs curseurs de saisie, repli de code, recherche et remplacement, diagnostics. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | Les différences entre deux textes ou d'un patch, côte à côte ou unifiées, avec des actions par modification. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | Un tableau des lignes et cellules propres à l'app, avec les rôles d'un tableau pour les lecteurs d'écran. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | Un tableau d'un nombre quelconque de lignes et de colonnes : sélection, tri, colonnes fixes, redimensionnables et déplaçables, lignes servies une page à la fois. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | Le champ de saisie de texte natif de la plateforme, sur une ou plusieurs lignes. |
| [`Popover`](../elements/popover.md) | `popover()` | Contenu ancré à un déclencheur, au-dessus de tout. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | Un aperçu de ce que désigne son déclencheur, tant que le pointeur reste dessus (un appui sur les écrans tactiles). |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | Des menus : popups avec sous-menus en cascade sur ordinateur, feuilles sur téléphone ; éléments cochables et choix unique. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | Une info-bulle à côté de son déclencheur. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | Un panneau sur un bord de l'écran, au-dessus d'un fond. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | Des toasts sans style : une racine sémantique, une pile de couches, leur cycle de vie. |
| `statusBar` sur les pages et les dialogues | `.status_bar(..)` | La barre d'état tant qu'une page ou un dialogue est affiché. Voir [Barre d'état](#status-bar). |

En Rust, `theme()` lit le thème de l'app sous forme de design tokens (`theme().primary`, `theme().radius`), les mêmes tokens qu'utilisent les [classes de thème](../docs/tailwind.md#theme-tokens) de TSX.

<a id="controls"></a>

## Contrôles

### Button

Une cible d'appui qui gère son comportement et n'a pas d'apparence : appuis, états désactivé et sélectionné et son rôle pour les lecteurs d'écran. Son apparence est celle des `class` et `style` de l'app avec des variantes d'état, son contenu est ses enfants. Voir [Button](../elements/button.md).

### Link

Une cible d'appui qui mène quelque part et n'a pas d'apparence : appuis, Entrée et Espace lorsqu'elle a le focus clavier, état désactivé, rôle de lien pour les lecteurs d'écran et page courante d'une navigation (`current`). `href` est sa destination, jamais affichée : un appui la signale (`onOpen`), puis ouvre une page web ou le lien d'une autre app en dehors de l'app, ou, avec `openWith="app"`, laisse l'ouverture aux routes propres de l'app. Voir [Link](../elements/link.md).

### Checkbox

Un contrôle coché, décoché ou indéterminé qui gère son comportement et n'a pas d'apparence : appuis, activation au clavier, état désactivé et rôle et valeur de case à cocher pour les lecteurs d'écran (mixte tant qu'il est indéterminé), la valeur étant détenue par l'app (`checked`, `indeterminate`, `onChange`). L'app stylise la case à cocher et son indicateur, dont les classes `checked:`, `indeterminate:` et `disabled:` suivent la case à cocher, et place sa propre marque dans l'indicateur (`indicator`). Voir [Checkbox](../elements/checkbox.md).

<a id="radio-and-radiogroup"></a>

### Radio et RadioGroup

Une option d'un ensemble dont l'utilisateur choisit exactement une, et l'ensemble qui les entoure. Un radio gère son comportement et n'a pas d'apparence : appuis, activation au clavier, état désactivé et rôle et état coché de bouton radio pour les lecteurs d'écran. Le groupe est le groupe de boutons radio qu'annoncent les lecteurs d'écran et ne contient aucune valeur : l'app indique à chaque radio s'il est coché (`checked`), et un appui sur un radio non coché le demande (`onChange`). L'indicateur et le libellé de l'app sont les enfants du radio, dont les classes `group-checked:` le suivent. Voir [Radio](../elements/radio.md).

### Switch

Un contrôle activé / désactivé qui gère son comportement et n'a pas d'apparence : appuis, activation au clavier, état désactivé et rôle et valeur d'interrupteur pour les lecteurs d'écran, la valeur étant détenue par l'app (`checked`, `onChange`). L'app stylise l'interrupteur, sa piste et son curseur, dont les classes `checked:` et `disabled:` suivent l'interrupteur. Voir [Switch](../elements/switch.md).

<a id="tab-and-tabs"></a>

### Tab et Tabs

Les onglets d'une liste d'onglets et la liste qui les entoure. Un onglet gère son comportement et n'a pas d'apparence : appuis, activation au clavier, état désactivé et rôle et état sélectionné d'onglet pour les lecteurs d'écran. La liste est la liste d'onglets qu'annoncent les lecteurs d'écran et ne contient aucune valeur : l'app indique à chaque onglet s'il est sélectionné (`selected`), reçoit les appuis (`onPress`) et affiche elle-même le contenu de la section sélectionnée. Le libellé de l'app est l'enfant de l'onglet, dont les classes `group-selected:` le suivent. L'indicateur de la liste (`indicatorClass`, `indicatorStyle`), un soulignement ou une pastille que l'app stylise, se place sur l'onglet sélectionné et glisse nativement vers le suivant. Voir [Tabs](../elements/tabs.md).
### Carousel

Des diapositives affichées une à la fois (les photos d'un produit, un onboarding, une bannière, une rangée de cartes). Le contenu est une vue défilante native qui s'aimante au début des diapositives : un doigt, la molette et le pavé tactile les déplacent dans la même frame que le pointeur. Au repos, le carousel signale la diapositive affichée avec `onChange`. Précédent et suivant (`CarouselPrevious`, `CarouselNext`), la pagination (des `CarouselPaginationItem`s dans un `CarouselPagination`, avec un indicateur qui rebondit vers la diapositive affichée) et les touches fléchées la déplacent nativement, en bouclant sans rupture aux extrémités avec `looping`. La diapositive affichée est le `index` de l'app, que son propre minuteur fait avancer pour les diapositives qui défilent d'elles-mêmes (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` indiquent quand attendre) ; l'apparence et chaque libellé sont ceux de l'app. Voir
[Carousel](../elements/carousel.md).

<a id="toggle-and-togglegroup"></a>

### Toggle et ToggleGroup

Un bouton activé ou désactivé (gras, un favori, une option d'affichage), et une barre d'outils de boutons de ce type. Un toggle possède son comportement et n'a pas d'apparence propre : appuis, activation au clavier, état désactivé et rôle de bouton avec son état pressé pour les lecteurs d'écran. Le groupe est la barre d'outils qu'annoncent les lecteurs d'écran, un seul arrêt du focus clavier dont les touches fléchées passent d'un toggle à l'autre sans les presser, et il ne contient aucune valeur : l'app indique à chaque toggle s'il est pressé (`pressed`), reçoit la valeur qu'il demande (`onChange`), et conserve autant de toggles pressés qu'elle le souhaite, ou exactement un. `disabled` sur le groupe désactive tous les toggles qu'il contient. L'icône ou le libellé de l'app constitue les enfants du toggle, dont les classes `group-aria-pressed:` les suivent. Voir [Toggle](../elements/toggle.md).

<a id="toolbar-toolbargroup-and-toolbarseparator"></a>

### Toolbar, ToolbarGroup et ToolbarSeparator

Une barre de contrôles : la mise en forme d'un éditeur de texte, les commandes de lecture d'un lecteur multimédia, une palette d'outils verticale. La barre d'outils est celle qu'annoncent les lecteurs d'écran (nommée par `accessibilityLabel`), et constitue un seul arrêt du focus clavier sur les `Button`s, `Toggle`s et `Link`s qu'elle contient : Tab entre sur l'élément quitté en dernier, les touches fléchées de son `axis` se déplacent le long de la barre, et Début et Fin sautent à ses extrémités, sans rien presser. Un `ToolbarGroup` est une série nommée d'éléments liés (annuler et rétablir, un alignement), et un `ToggleGroup` dans une barre d'outils est l'un de ses groupes, ses toggles étant les éléments de la barre. Un `ToolbarSeparator` est un trait que l'app dessine entre deux séries. `disabled` sur la barre d'outils ou sur un groupe désactive tous les éléments qu'il contient. La barre d'outils ne contient aucune valeur et n'a pas d'apparence propre : chaque contrôle garde son propre état, et l'app stylise la barre, ses groupes et ses séparateurs. Voir [Toolbar](../elements/toolbar.md).

### Select

Une valeur choisie dans une liste d'éléments fournis comme données (`items` : une valeur et un titre chacun, éventuellement désactivé ou dans une section), sans apparence propre. Le déclencheur de l'app ouvre la liste : une popup au niveau du déclencheur sur les ordinateurs, une feuille en bas sur les téléphones et les tablettes. Le select gère le clavier (Haut, Bas, Début, Fin, Page précédente et suivante, saisie prédictive, Retour et Échap), la recherche (`searchable`), la ligne en surbrillance (`focus:` sur `itemClass` ; `renderItem` reçoit ce qu'est un élément, jamais son état) et les rôles combobox, listbox et option pour les lecteurs d'écran. L'app possède la valeur (`value`, `onChange`) ou la laisse au select (`defaultValue`), et stylise chaque partie ou dessine les lignes. Voir [Select](../elements/select.md).

### Combobox

Des valeurs choisies dans une liste d'éléments, comme celle d'un select, filtrée par la saisie dans le champ de la combobox, sans apparence propre : une seule valeur, ou plusieurs avec `multiple`, un choix basculant alors l'élément tandis que la liste reste ouverte. La valeur est un tableau que l'app possède (`value`, `onChange`) ou qu'elle laisse à la combobox (`defaultValue`) ; `onConfirm` la communique à la fermeture de la liste. La requête peut être celle de l'app (`query`, `onQueryChange`), un pied de liste s'affiche sous les lignes et un bouton d'effacement vide la valeur. Voir
[Combobox](../elements/combobox.md).

### Calendar

Une date, ou avec `range` une plage de dates, choisie parmi des mois de jours, sans apparence propre. Un mois ou plusieurs (`numberOfMonths`) s'affichent côte à côte ; l'en-tête les fait défiler et ouvre une vue des mois ou une page d'années. La valeur est une date ISO (`"2026-10-28"`) ou `[start, end]` que l'app possède (`value`, `onChange`) ou qu'elle laisse au calendrier (`defaultValue`) ; `disabledMatcher` empêche de choisir certains jours, et les jours reçoivent le clavier comme un seul arrêt de Tab. L'app stylise les parties et dessine les éléments (`renderItem`, recevant ce qu'est un élément ; ses états sont ses classes, les jours d'une plage `selected:` avec `data-range-start:`, `data-range-middle:` et `data-range-end:`). Voir
[Calendar](../elements/calendar.md).

### TimeField

Une heure de la journée modifiée un segment à la fois, sans apparence propre : l'heure, la minute, la seconde (`precision`) et AM/PM (`hourCycle="h12"`), par incrémentation, saisie ou pavé numérique d'un téléphone. La valeur est `"HH:MM"` (`"HH:MM:SS"`) sur une horloge de 24 heures, celle de l'app (`value`, `onChange`) ou celle du champ lui-même (`defaultValue`). Voir
[TimeField](../elements/time-field.md).

### DatePicker

Une date choisie dans un calendrier qui s'ouvre depuis le déclencheur de l'app, comme le fait la liste d'un select : une popup sur les ordinateurs, une feuille sur les téléphones. La valeur prend les formes des inputs HTML : une date ISO, `[start, end]` avec `range` ou une date et une heure avec `timePrecision` (un champ d'heure sous le calendrier), celle de l'app (`value`, `onChange`) ou celle du sélecteur lui-même (`defaultValue`). Des préréglages la définissent, un bouton d'effacement la vide, et chaque prop de `Calendar` est transmise. Voir
[DatePicker](../elements/date-picker.md).

### Collapsible

Une région dont le contenu se déplie et se replie, sans apparence propre : ses enfants s'affichent toujours (un résumé, le déclencheur), son `content` après eux tant que `open`. L'app possède `open` et le déclencheur qui le bascule, et y indique l'état déplié aux lecteurs d'écran. Le contenu est créé une fois et conservé pendant qu'il est replié, de sorte que ce qu'il contient garde son état. Avec `reveal`, il s'ouvre et se ferme nativement avec une hauteur à effet de ressort. Voir [Collapsible](../elements/collapsible.md).

### Accordion

Des sections empilées qui se déplient et se replient sous leurs titres, sans apparence propre : un `Accordion` de `AccordionItem`s, chacun étant un `AccordionHeader` autour de son `AccordionTrigger` et d'un `AccordionPanel`. L'app possède `value`, les valeurs des éléments ouverts, et définit celui que `onChange` signale lorsqu'un déclencheur est pressé : un élément à la fois, ou plusieurs avec `multiple`. Les lecteurs d'écran entendent un groupe de titres dont les boutons indiquent si leur élément est déplié, et chaque panneau ouvert comme une région. Avec `reveal`, un panneau s'ouvre et se ferme nativement avec une hauteur à effet de ressort ; avec `keepMounted`, son contenu reste dans l'arbre tant qu'il est fermé. Voir [Accordion](../elements/accordion.md).

### Avatar

L'image d'une personne, sans apparence propre : le repli (les initiales de `name`, ou le `fallback` de l'app) et l'image par-dessus, transparente tant qu'elle n'est pas chargée, toutes deux aussi grandes que l'avatar, puis les enfants de l'app (une pastille de présence). Les événements de chargement et d'erreur de l'image modifient nativement son statut (`onStatusChange`), et `fallbackDelay` retient le repli pendant le chargement d'une image. Les lecteurs d'écran entendent une image étiquetée avec le nom. Un `AvatarGroup` affiche ses `limit` premiers avatars, ne crée aucune vue pour les autres, et affiche son `overflow` tant que `total` est plus grand. Voir
[Avatar](../elements/avatar.md).

### Progress

Une barre de progression linéaire, sans apparence propre : une piste contenant un indicateur, l'indicateur occupant `value` pour cent de la largeur de la piste. L'app possède `value` (de 0 à 100) et `indeterminate` ; les lecteurs d'écran reçoivent le rôle de barre de progression, la plage et la valeur, et aucune valeur lorsqu'elle est indéterminée, cas où la largeur et le mouvement de l'indicateur appartiennent à l'app. Voir [Progress](../elements/progress.md).

### NumberInput

Un nombre saisi dans un champ ou incrémenté, sans apparence propre : le champ (`Input`), le bouton de décrémentation avant lui et celui d'incrémentation après lui (ou les deux en colonne à droite, `controlsRight`). L'app possède `value` (un nombre ou `null` ; ou l'input conserve la sienne à partir de `defaultValue`) et reçoit `onChange` avec le nombre que le champ lit. Le champ accepte un nombre ou le texte en cours de saisie, y compris les chiffres et signes d'autres claviers ; les boutons, Haut / Bas et Page précédente / Page suivante l'incrémentent de `step`, en conservant les décimales, jusqu'à `min` et `max`, et quitter le champ y ramène une valeur saisie. Le champ est un spin button pour les lecteurs d'écran, dont l'incrémentation et la décrémentation le font varier. Voir
[NumberInput](../elements/number-input.md).

### Slider

Une valeur, ou une plage de deux, choisie le long d'une piste, sans apparence propre : une piste qui reçoit les appuis et les glissements, l'indicateur à l'intérieur sur lequel les valeurs sont projetées, la plage et un curseur par valeur. L'app possède `value` (un nombre ou `[start, end]` ; ou le slider conserve la sienne à partir de `defaultValue`) et reçoit `onChange` pour chaque nouvelle valeur, alignée sur `step` à partir de `min`, et `onChangeEnd` une fois par changement ; `scale` répartit les valeurs de façon linéaire ou par ordres de grandeur, `axis` dispose la piste horizontalement ou verticalement. Chaque curseur est un élément ajustable pour les lecteurs d'écran avec sa propre valeur, un arrêt du focus clavier, et se déplace avec les touches de slider de WAI-ARIA. Voir [Slider](../elements/slider.md).

### Scrollbar

Une barre de défilement à l'apparence propre à l'app pour une vue défilante ou une liste, placée où l'app le souhaite, sans apparence par défaut : une piste (le `class` de la barre) et un curseur dedans (`thumbClass`). Elle nomme sa vue défilante (`scroll`, son `ref`) et suit son décalage, son contenu et sa zone visible ; un glissement du curseur fait défiler le contenu, un appui sur la piste amène le milieu du curseur à cet endroit. `mode` l'affiche pendant le défilement du contenu (jusqu'à `motion.idle` après), tant que le pointeur est sur la barre, ou en permanence ; `axis` la rend horizontale. `Scrollbar.setTheme` donne à chaque vue défilante et à chaque liste une barre à l'apparence de l'app par-dessus sa zone visible, sans rien à placer, et une vue accepte un thème qui lui est propre via sa prop `scrollbar`. Voir
[Scrollbar](../elements/scrollbar.md).

### ColorPicker

Un sélecteur de couleur sans apparence propre : la racine contient la couleur et les parties à l'intérieur l'affichent et la modifient, disposées par l'app. `ColorArea` est la saturation et la luminosité de HSB, `ColorSlider` n'importe quel canal de RGB, HSL, HSB ou OKLCH ou l'alpha (horizontal ou vertical), `ColorField` la couleur sous n'importe quelle forme CSS ou le nombre d'un canal, `ColorSwatch` un préréglage qu'un appui choisit ou un aperçu de la couleur, `ColorEyeDropper` un bouton qui prélève une couleur à l'écran (macOS, le web). L'app possède `value` (ou le sélecteur conserve la sienne à partir de `defaultValue`) et reçoit `onChange` et `onChangeEnd` avec la couleur et son texte tel que `format` l'écrit ; le sélecteur conserve les canaux de chaque espace tels que l'utilisateur les a définis. Les curseurs sont des éléments ajustables pour les lecteurs d'écran et des arrêts du focus clavier. Voir
[ColorPicker](../elements/color-picker.md).

### OtpInput

Un code à usage unique numérique de longueur fixe, sans apparence propre : un champ de texte natif unique au-dessus des cellules reçoit le clavier, de sorte que la saisie, le collage, le pavé numérique et le remplissage automatique de code du système relèvent de la plateforme, et les lecteurs d'écran trouvent un seul champ de texte. Seuls les chiffres sont acceptés, jusqu'à `length` ; Retour arrière supprime le dernier. L'app possède `value` (ou fournit `defaultValue`) et reçoit `onChange` et `onComplete` ; elle stylise les cellules (`focus:` sur celle qui reçoit le prochain chiffre, `data-filled:` sur celles qui contiennent un chiffre), leurs groupes et le curseur de saisie. Voir [OtpInput](../elements/otp-input.md).

### Pagination

Les pages d'un ensemble entre lesquelles naviguer, un repère de navigation sans apparence propre : Précédent, la première et la dernière page, la page courante avec ses voisines (`visiblePages`), une ellipse pour chaque série omise, les enfants de l'app et Suivant ; `compact` conserve Précédent, les enfants et Suivant. L'app possède `page` et reçoit `onChange({ page })` ; la page courante est `selected:` et la page courante pour les lecteurs d'écran. L'app stylise les éléments (`itemClass`) ou les dessine (`renderItem`). Voir [Pagination](../elements/pagination.md).

### Command

Une palette de commandes : un champ de recherche sur les commandes de l'app (`items` : un `id`, un `label`, `keywords`, un `group`, un `shortcut` à afficher, `disabled`, `checked`), filtrées nativement pendant la saisie (le libellé ou un mot-clé contient la requête, sans tenir compte de la casse ; les sections sans correspondance disparaissent), dans une liste virtualisée qui ne crée que les lignes visibles. Haut et Bas déplacent la surbrillance, Retour ou un appui choisit (`onSelect({ id })`), Échap efface la requête puis signale `onCancel`, où l'app ferme un `Dialog` autour de la palette. La requête est celle de l'app (`query`, `onQueryChange`) ou celle du champ lui-même ; avec `filterable={false}` et `loading`, l'app y répond depuis un serveur. L'app stylise chaque partie (`itemClass` avec `focus:` pour la surbrillance, `checked:`, `disabled:`) et dessine les lignes (`renderItem`, recevant le raccourci tel qu'il est affiché ici). Voir [Command](../elements/command.md).

### Tree

Des éléments qui contiennent des éléments : les fichiers d'un projet, une barre latérale de réglages, un plan. `items` est une donnée (`TreeItem` : un `id`, un `label`, `children`, `disabled`), et les lignes sont virtualisées : seules celles visibles sont créées, et celles des enfants d'un élément replié ne le sont jamais, si bien qu'un arbre de milliers d'éléments reste rapide. L'app possède les identifiants dépliés et l'élément sélectionné (`expanded`, `selected`, avec `onExpandedChange` et `onSelectedChange`) ou l'arbre conserve les siens (`defaultExpanded`, `defaultSelected`). Un appui sélectionne une ligne et déplie ou replie un dossier ; l'arbre est un seul arrêt du focus clavier dont les touches fléchées déplacent la sélection (Droite et Gauche déplient, replient, entrent dans un dossier et en sortent), avec Début, Fin, Retour, Espace et la saisie prédictive. L'app stylise les lignes (`itemClass` avec `selected:`, `aria-expanded:`, `focus:`) et les dessine (`renderItem`, recevant le `depth` de chaque élément). Voir [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

Les éléments dont sont faits les graphiques, comme `gpui-base` et son `plot`, dans un module à part : `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"``. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
sont des clés vérifiées ou des fonctions d'une ligne), les échelles `point`, `linear` ou `band` de ses axes, la ligne sous le pointeur
(`onHoverChange`) et son mouvement (`motion` : l'apparition, le fondu et le glissement du survol) ; ses marques se dessinent nativement à partir des
lignes, sans JS par point, et se peignent avec les propriétés de peinture SVG (`stroke-*`, `fill-*`), `currentColor` lorsqu'aucune
n'est définie ; un `Area` ou un `Bar` affiche un arrière-plan (un dégradé, `bg-linear-*`) à l'intérieur de ses formes. Les barres se placent dans les
bandes d'une échelle `band`, côte à côte ou empilées dans un `stack`, grandissent à l'apparition du plot et s'estompent loin de la ligne
sous le pointeur, avec un élément `label` au bout de chaque barre. La ligne en croix du survol, les points (propres à chaque marque
avec `hoverDotClass`) et l'infobulle (`tooltipPlacement`, maintenue à l'intérieur du plot) sont des éléments que l'app stylise et remplit, déplacés
nativement ; les étiquettes des axes sont des éléments propres à l'app. Un `Pie` découpe le tour en une part par ligne (un donut avec un
`innerRadius`), chacune peinte avec ses propres classes (`sliceClass`, fonction de sa ligne), et un `Arc` dessine un secteur
entre deux angles (la piste et la valeur d'une jauge) ; sur un camembert, le plot signale la part sous le pointeur, qui se soulève
(`hoverLift`) tandis que les autres s'estompent (`hoverDim`). Un `Sankey` dessine des flux entre les lignes (`links`), disposés comme
d3-sankey les dispose, chaque nœud et chaque ruban étant peint avec ses propres classes, les nœuds étant étiquetés, survolables et se déplaçant vers de nouveaux flux. Un `Treemap` pave les lignes sous forme de hiérarchie de
rectangles imbriqués (`id`, `parent`), l'aire de chaque feuille étant son `value`, colorée par catégorie ou selon un dégradé du
`colorScale` du plot, ses étiquettes s'affichant là où elles tiennent. Voir [Plot](../elements/plot.md).

<a id="workspaces"></a>

## Espaces de travail

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup et ResizablePanel

Des panneaux côte à côte ou empilés, avec une poignée entre chaque paire que l'utilisateur fait glisser pour partager l'espace. Le groupe gère
le glissement, qui s'exécute nativement, les limites de chaque panneau (`minSize`, `maxSize`) et le curseur de redimensionnement ; les tailles appartiennent à
l'app (`size`, signalées avec `onResize`), tout comme l'apparence des poignées et le contenu des panneaux. Voir
[Resizable](../elements/resizable.md).

### DockArea

Un espace de travail ancrable : des panneaux dans des groupes d'onglets, des groupes divisés côte à côte ou empilés, et des docks sur les bords gauche, droit et
inférieur. La disposition est une donnée que l'app possède (`layout`, signalée avec `onLayoutChange`) ; la zone gère le glisser-déposer des onglets,
le redimensionnement, les docks, le zoom et le verrouillage, conserve le contenu de chaque panneau lorsqu'il se déplace, et présente la même disposition avec
des tiroirs et une feuille inférieure lorsqu'elle est étroite. Les onglets, les poignées, l'indicateur de dépôt et le contenu des panneaux appartiennent
à l'app. Voir [Dock](../elements/dock.md).

## Documents

### TextView

`TextView` affiche un document en Markdown, en HTML ou en blocs que l'app construit, dessiné avec des éléments et des vues [`Text`](../elements/text.md) :
titres, listes, code, tableaux, images, formules, notes de bas de page et syntaxe propre à l'app. Il est conçu pour
les réponses de chat IA diffusées en flux, avec une typographie de lecture aux couleurs du thème que l'app restylise partie par partie,
et des fonctions de rendu qui placent le contenu de l'app. Voir [TextView](../elements/text-view.md).

## Code

### Editor

`Editor` est un éditeur de code pour plus de cinquante langages : coloration syntaxique, numéros de ligne, curseurs multiples, repli,
retour à la ligne automatique, recherche et remplacement, diagnostics et décorations, avec les raccourcis des éditeurs de code. Le texte appartient à l'app
(`value` et `onChange`), tout comme la barre de recherche, qui pilote le `search` de l'éditeur. Il est livré avec une apparence construite à partir des
tokens du thème que l'app restylise partie par partie. Voir [Editor](../elements/editor.md).

### DiffView

`DiffView` affiche les changements entre deux textes, ou dans les fichiers d'un patch, comme les outils de revue de code : côte à côte ou
unifié, avec les mots modifiés au sein des lignes mis en évidence, les lignes inchangées repliées en séparateurs que l'on peut déplier, dans les couleurs de syntaxe du
`Editor`. Les actions de l'app conservent ou annulent chaque changement. Voir [DiffView](../elements/diff-view.md).

### Table

`Table` et ses parties disposent quelques lignes que l'app écrit comme enfants, et offrent un tableau aux lecteurs d'écran : groupes de lignes,
lignes, en-têtes de colonnes et cellules. Chaque partie prend l'apparence de l'app. Voir [Table](../elements/table.md).

### DataTable

`DataTable` affiche des lignes et des colonnes et défile dans les deux sens sur un nombre quelconque des unes et des autres, en ne produisant que les cellules visibles. Les lignes,
colonnes ou cellules se sélectionnent ; les colonnes se redimensionnent, se déplacent, restent fixes et se trient (c'est l'app qui trie) ; l'app fournit les lignes page par page
et peut dessiner les cellules et les titres. Voir [DataTable](../elements/data-table.md).

## Navigation

Un `NavStack` de `NavPage` est `UINavigationController` sur iOS et une pile avec barre d'outils et retour prédictif sur
Android ; sur les ordinateurs de bureau et le web, chaque page affiche son propre `header` de l'app. Voir
[NavStack](../elements/nav-stack.md), qui couvre aussi `createNavStack` et la sortie d'une page.

### Dialog

`Dialog` présente du contenu au-dessus de tout le reste, y compris l'en-tête de la pile, dans sa propre couche de fenêtre native. Sa
fenêtre contextuelle et son arrière-plan sont stylisés par l'app. Voir [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## Boîtes de dialogue d'alerte

### AlertDialog

`AlertDialog.show(options)` affiche l'alerte ou la feuille d'actions propre à la plateforme et se résout avec `{ action }`, le `id`
de l'action choisie par l'utilisateur. Voir [AlertDialog](../elements/alert-dialog.md).

## Input

`Input` est le champ de saisie de texte natif de la plateforme : un champ monoligne ou multiligne dont la saisie, le curseur, la sélection,
la correction automatique et le remplissage automatique sont gérés par la plateforme. L'app possède sa valeur et son apparence. Ses props ont pour type `InputProps` (avec `IOSInputProps` pour `ios={{…}}`), exporté à côté. Voir [Input](../elements/input.md).

<a id="status-bar"></a>

## Barre d'état

La barre d'état appartient à ce qui est à l'écran, comme dans UIKit, où chaque view controller déclare son
`preferredStatusBarStyle` et où celui du dessus décide. Dans NSH, les pages et les dialogues sont ces view controllers : un
`NavPage` ou un `Dialog` déclare la barre d'état qu'il souhaite avec `statusBar`, et l'app déclare sa valeur par défaut dans
`nsh.json`.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> Screen {
    nav_page().header_visible(false).status_bar(
        StatusBarSetting::default()
            .foreground(StatusBarStyle::Light)
            .hidden(true)
            .animated(true),
    )
}
```

```tsx tabs
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light", hidden: true, animated: true }}>
      …
    </NavPage>
  );
}
```

`statusBar` accepte ces champs, tous facultatifs (en Rust, un `StatusBarStyle` seul, ou les méthodes de construction de `StatusBarSetting`
du même nom) :

| Champ | Type | Description |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust : `StatusBarStyle::Default`, `Light`, `Dark`) | La couleur du contenu (heure, batterie, signal) : `"light"` pour les arrière-plans sombres, `"dark"` pour les clairs, `"auto"` celle de la plateforme pour l'apparence courante. |
| `hidden` | `boolean` | Masque la barre d'état. |
| `animated` | `boolean` | Anime le changement lorsque la page ou le dialogue apparaît et disparaît. |

La valeur est réactive : `statusBar={{ foreground: dark() ? "light" : "dark" }}` suit le signal, tout comme une closure
Rust qui en lit un.

<a id="which-one-applies"></a>

### Lequel s'applique

La page ou le dialogue affiché **le plus récemment** décide, **champ par champ** : une page poussée sur une pile est au-dessus des pages
en dessous, et un dialogue ouvert est au-dessus des pages. Un champ qu'il omet provient de celui du dessous, et en fin de compte
de la valeur par défaut de l'app. Lorsque la page est retirée ou que le dialogue se ferme, celui du dessous s'applique de nouveau.

```rust tabs
nav_page()
    .title("Inbox")
    .status_bar(StatusBarStyle::Dark);

// Pushed over it: hidden, with the inbox's dark content when it shows again.
nav_page()
    .title("Photo")
    .status_bar(StatusBarSetting::default().hidden(true));
```

```tsx tabs
<NavPage title="Inbox" statusBar={{ foreground: "dark" }}>…</NavPage>

// Pushed over it: hidden, with the inbox's dark content when it shows again.
<NavPage title="Photo" statusBar={{ hidden: true }}>…</NavPage>
```

<a id="the-apps-default"></a>

### La valeur par défaut de l'app

`"statusBar"` de `nsh.json` est le réglage sous chaque page et chaque dialogue, comme `UIStatusBarStyle` et
`UIStatusBarHidden` d'Info.plist dans une app UIKit :

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

Les deux champs sont facultatifs. Sans lui, le contenu est `"auto"` et la barre s'affiche. Les apps iOS empaquetées l'affichent aussi sur l'écran
de lancement.

<a id="the-status-bar-on-each-platform"></a>

### La barre d'état sur chaque plateforme

- **iOS** : le masquage et l'affichage s'animent par un fondu. Dans une app [intégrée](../docs/ios.md) à une app native,
  c'est le view controller de l'app hôte qui décide de l'apparence de la barre d'état. L'hôte applique le réglage de NSH en renvoyant
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` et
  `NshAppView.preferredStatusBarUpdateAnimation` depuis son view controller.
- **Android** : les apps dessinent bord à bord, derrière la barre d'état (Android 15, API 35) : l'arrière-plan propre à l'app est celui de la
  barre, et `foreground` garde son contenu lisible dessus.
- **Ordinateurs de bureau et web** : la barre de titre de la fenêtre et les barres du navigateur appartiennent au système et au navigateur ;
  `statusBar` et `"statusBar"` de `nsh.json` sont destinés aux téléphones.

> [!IMPORTANT]
> Lorsque votre `nsh.json` déclare `"capabilities"`, la barre d'état ne change que s'ils incluent
> `"statusBar": true` ; les autres changements sont refusés et consignés. Voir
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## Voir aussi

- [Navigation guide](../docs/navigation.md).
- [Forms and keyboard](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) et [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) et
  [Input](../elements/input.md).
- [Device and environment](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler) : `BackHandler` et autres API propres à Android.
