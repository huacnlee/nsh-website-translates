---
title: "nsh/base"
description: "Ungestylte Basiskomponenten für die Benutzeroberfläche einer App: Buttons, Links, Avatare, Karussells, Checkboxen, Radiobuttons, Switches, Tabs, Toggles, Toolbars, Trees, Selects, Comboboxen, Command Palettes, Kalender, Datumsauswahlen, Zeitfelder, in der Größe veränderbare Panels, andockbare Arbeitsbereiche, Markdown- und HTML-Dokumente, einen Code-Editor, Diffs, Texteingaben, Navigationsstapel und Dialoge, System-Alert-Dialoge sowie die Statusleiste von Seiten und Dialogen."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---


# nsh/base

`nsh/base` ist die Basisschicht der UI einer App: ungestylte Komponenten, die auf jeder Plattform Verhalten, Zustand, Fokus und Barrierefreiheit verantworten. Sie liegt zwischen den Primitiven (`nsh`, `nsh/mobile` und `nsh/desktop`) und der eigenen Komponentenbibliothek der App, so wie `gpui-base` im GPUI Kit zwischen `gpui` und einer gestylten Bibliothek liegt (siehe [Module](./index.md#three-layers)). Sie bietet Steuerelemente (`Button`, `Link`, `Checkbox`, `ColorPicker` mit `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` und `ColorEyeDropper`, `NumberInput`, `Radio` in einem `RadioGroup`, `Slider`, `Switch`, `Tab` in `Tabs`, `Toggle` in einem `ToggleGroup`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), Befehlspaletten (`Command`), Leisten mit Steuerelementen (`Toolbar` mit `ToolbarGroup` und `ToolbarSeparator`), Scrollleisten im eigenen Look der App (`Scrollbar`), Bereiche, die sich ein- und ausklappen lassen (`Collapsible` sowie `Accordion` mit `AccordionItem`, `AccordionHeader`, `AccordionTrigger` und `AccordionPanel`), einen Fortschrittsbalken (`Progress`), Einmalcodes (`OtpInput`), die Seiten einer Menge (`Pagination`), Elemente, die Elemente enthalten (`Tree`), die Bausteine, aus denen Diagramme bestehen (`Plot` mit `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` und `Arc`, in `nsh/base/plot`), Arbeitsbereiche, die der Nutzer selbst anordnet (`ResizablePanel`s in einem
`ResizablePanelGroup` sowie die Splits, Tab-Gruppen und Docks von `DockArea`), Karussells (`Carousel` und seine Teile), Dokumente aus Markdown oder HTML (`TextView`), einen Code-Editor (`Editor`), die Änderungen zwischen Texten (`DiffView`) und Tabellen aus Zeilen und Spalten (`Table` und seine Teile, `DataTable`), Texteingaben
(`Input`), Popups, die über allem angezeigt werden (`Popover`, `Menu` und `ContextMenu` mit ihren `MenuItem`,
`MenuSeparator` und `Submenu`, `Tooltip`, `Sheet`), Toasts (`Toast` in einem `ToastStack`, ihr Lebenszyklus in einem `ToastManager`), Navigation (ein `NavStack` aus `NavPage`s, gesteuert
durch den Zustand, den du mit `createNavStack` erzeugst, und `Dialog` für Inhalte, die über allem anderen präsentiert werden) und die Alert-Dialoge
des Systems (`AlertDialog`). Pages und Dialoge bestimmen außerdem die Statusleiste
(`statusBar`).

Zum Basisumfang gehören auch `Avatar` und `AvatarGroup`: Bilder mit nativem
Ladezustand und eine Reihe, die ihre ersten `limit` Avatare platziert.

Der Look gehört der App: Was in einer Page, einem Dialog oder einem Header steht, ist dein eigenes JSX, zusammengesetzt aus den Primitiven mit
Styles, [Tailwind](../docs/tailwind.md)-Klassen und deinem Theme, aus Rust-Komponenten aus [deinem eigenen Crate](../docs/rust.md)
oder aus einer Komponentenbibliothek, die die Community auf `nsh/base` aufbaut. Jeder Host stellt `nsh/base` bereit; Rust-Apps nutzen dieselbe API
aus dem Crate `nsh-base` (`nsh_base::{button, dialog, …}`).

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

Diese Seite ist der Index des Moduls: Jede Komponente hat eine Elementseite mit Beispielen, Props und Plattformhinweisen. Schritt-für-Schritt-Anleitungen findest du im [Navigationsleitfaden](../docs/navigation.md) und unter [Formulare und Tastatur](../docs/forms-and-keyboard.md).

| TSX | Rust | Was es ist |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | Ein Press-Ziel mit den Zuständen „disabled“ und „selected“ und einer Rolle für Screenreader. |
| [`Link`](../elements/link.md) | `link()` | Ein Press-Ziel, das irgendwohin führt: Es öffnet sein `href` über das System, oder die App öffnet es (`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | Das Bild einer Person oder ein Fallback (die Initialen, das Icon der App), während es lädt, wenn es fehlschlägt und wenn keines vorhanden ist; und eine Reihe, die die ersten `limit` und einen Überlauf zeigt. Der Ladezustand ist nativ. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | Ein aktiviertes, nicht aktiviertes oder unbestimmtes Steuerelement mit einem Indikator, den die App stylt und markiert. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | Eine Option einer Menge, aus der der Nutzer genau eine wählt, und die Menge selbst; die App verwaltet, welche ausgewählt ist. |
| [`Switch`](../elements/switch.md) | `switch()` | Ein Ein-/Aus-Steuerelement mit einem Track und einem Thumb, die die App stylt. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | Ein Tab einer Tab-Liste und die Liste selbst; die App verwaltet, welcher ausgewählt ist, und zeigt dessen Inhalt an. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | Eine Schaltfläche, die ein- oder ausgeschaltet ist, und eine Toolbar aus solchen Schaltflächen; die App verwaltet, welche gedrückt sind. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | Eine Leiste aus Buttons, Toggles und Links: ein einziger Halt des Tastaturfokus, entlang dem die Pfeiltasten wandern; Gruppen zusammengehöriger Elemente und Linien dazwischen. |
| [`Carousel`](../elements/carousel.md) und seine Teile | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | Slides, die jeweils an einer Stelle auf dem plattformeigenen Scrollen angezeigt werden, mit Zurück/Weiter, einer Pagination, den Tasten und einer nahtlosen Schleife; die App verwaltet `index`. |
| [`Select`](../elements/select.md) | `select()` | Ein Wert aus einer Liste von Elementen: auf Desktops ein Popup am Trigger, auf Smartphones ein Sheet; die App verwaltet `value` und zeichnet den Trigger. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | Ein Wert oder mehrere (`multiple`) aus einer Liste von Elementen, gefiltert durch Tippen in das Eingabefeld; die App verwaltet `value` und stylt das Feld. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | Ein Datum oder ein Datumsbereich, ausgewählt aus Monaten voller Tage, mit Monats- und Jahresansichten und der Tastatur; die App verwaltet `value` und zeichnet die Elemente. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | Eine Uhrzeit, die Segment für Segment bearbeitet wird (Stunde, Minute, Sekunde, AM/PM); die App verwaltet `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | Ein Datum, ein Bereich oder Datum und Uhrzeit aus einem Kalender: auf Desktops in einem Popup am Trigger, auf Smartphones in einem Sheet; die App verwaltet `value` und zeichnet den Trigger. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | Ein Bereich, dessen Inhalt sich ein- und ausklappen lässt; die App verwaltet `open` und seinen Trigger. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | Gestapelte Abschnitte, die sich unter ihren Überschriften ein- und ausklappen lassen, einer nach dem anderen oder mehrere (`multiple`); die App verwaltet `value`, die geöffneten Elemente. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | Ein Einmalcode in Zellen, die die App stylt; die App verwaltet `value`, `onComplete` meldet, wann er vollständig ist. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | Die Seiten einer Menge: Zurück, die Seiten um die aktuelle herum mit Auslassungspunkten, die Children der App und Weiter; die App verwaltet `page`. |
| [`Command`](../elements/command.md) | `command()` | Eine Befehlspalette: ein Suchfeld über den Befehlen der App, nativ nach Label und Schlüsselwörtern gefiltert, in einer virtualisierten Liste; Return oder ein Press wählt aus (`onSelect`), in einem `Dialog` für eine Cmd+K-Palette. |
| [`Tree`](../elements/tree.md) | `tree()` | Elemente, die Elemente enthalten, virtualisiert: auf- und zugeklappt, eines ausgewählt, ein einziger Halt des Tastaturfokus; die App verwaltet `expanded` und `selected`, oder der Baum behält seinen eigenen Zustand. |
| [`Progress`](../elements/progress.md) | `progress()` | Ein Fortschrittsbalken; die App verwaltet `value` (0 bis 100) und `indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | Eine Zahl, die in ein Feld getippt oder mit Buttons und Tasten schrittweise geändert wird; die App verwaltet `value` (oder die Eingabe behält ihren eigenen Wert aus `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | Eine Scrollleiste im eigenen Look der App für die Scroll-View oder Liste, die sie benennt (`scroll`); ihr Thumb folgt dem Inhalt, und Ziehen und Drücken scrollen ihn. |
| [`Slider`](../elements/slider.md) | `slider()` | Ein Wert oder ein Bereich aus zwei Werten, ausgewählt entlang eines Tracks; die App verwaltet `value` (oder der Slider behält seinen eigenen Wert aus `defaultValue`). |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | Ein Farbwähler und seine Teile: eine Fläche für Sättigung und Helligkeit, Slider für jeden Kanal von RGB, HSL, HSB oder OKLCH und für Alpha, Felder für die Farbe oder einen Kanal, Swatches, eine Pipette; die App verwaltet `value` (oder der Wähler behält seinen eigenen Wert aus `defaultValue`). |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | Panels nebeneinander oder gestapelt, mit Handles, die der Nutzer zum Ändern der Größe zieht. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | Ein Arbeitsbereich aus Splits, Tab-Gruppen und Edge-Docks, den der Nutzer anordnet; sein Layout sind Daten der App. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | Ein nativer Navigationsstapel und seine Pages. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | Inhalte, die über allem anderen präsentiert werden: Sheets, Vollbild-Abläufe, Dialoge. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | Der Alert oder das Action Sheet der Plattform. |
| [`TextView`](../elements/text-view.md) | `text_view()` | Ein Dokument aus Markdown, HTML oder Blöcken, mit Texten und Views gezeichnet, für gestreamte KI-Antworten. |
| [`Editor`](../elements/editor.md) | `editor()` | Ein Code-Editor: Syntaxhervorhebung, mehrere Carets, Code-Faltung, Suchen und Ersetzen, Diagnosen. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | Die Änderungen zwischen zwei Texten oder in einem Patch, nebeneinander oder vereinheitlicht, mit Aktionen pro Änderung. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | Eine Tabelle aus den eigenen Zeilen und Zellen der App, mit den Rollen einer Tabelle für Screenreader. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | Eine Tabelle mit beliebig vielen Zeilen und Spalten: Auswahl, Sortierung, fixierte, in der Größe änderbare und verschiebbare Spalten, Zeilen seitenweise geliefert. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | Die native Texteingabe der Plattform, einzeilig oder mehrzeilig. |
| [`Popover`](../elements/popover.md) | `popover()` | An einem Trigger verankerter Inhalt, über allem anderen. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | Eine Vorschau auf das, worauf der Trigger verweist, solange der Zeiger darauf ruht (auf Touchscreens ein Press). |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | Menüs: auf Desktops Popups mit kaskadierenden Untermenüs, auf Smartphones Sheets; Elemente zum Anhaken und Einzelauswahl. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | Ein Hinweis neben seinem Trigger. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | Ein Panel an einem Bildschirmrand über einem Backdrop. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | Ungestylte Toasts: ein semantisches Root, ein Stapel von Ebenen, ihr Lebenszyklus. |
| `statusBar` auf Pages und Dialogen | `.status_bar(..)` | Die Statusleiste, solange eine Page oder ein Dialog angezeigt wird. Siehe [Statusleiste](#status-bar). |

In Rust liest `theme()` das Theme der App als Design-Tokens (`theme().primary`, `theme().radius`), dieselben Tokens,
die auch die [Theme-Klassen](../docs/tailwind.md#theme-tokens) von TSX verwenden.

<a id="controls"></a>

## Steuerelemente

### Button

Ein Press-Ziel, das sein Verhalten selbst verwaltet und kein Aussehen hat: Presses, die Zustände „disabled“ und „selected“ und seine Rolle für
Screenreader. Sein Look sind die `class` und `style` der App mit Zustandsvarianten, sein Inhalt sind seine Children. Siehe
[Button](../elements/button.md).

### Link

Ein Press-Ziel, das irgendwohin führt und kein Aussehen hat: Presses, Return und Leertaste, solange es den Tastaturfokus hat, der
Zustand „disabled“, die Link-Rolle für Screenreader und die aktuelle Seite einer Navigation (`current`). `href` ist das Ziel, wohin es
führt, und wird nie angezeigt: Ein Press meldet es (`onOpen`) und öffnet dann außerhalb der App eine Webseite oder den Link einer anderen App, oder, mit
`openWith="app"`, überlässt das Öffnen den eigenen Routen der App. Siehe [Link](../elements/link.md).

### Checkbox

Ein aktiviertes, nicht aktiviertes oder unbestimmtes Steuerelement, das sein Verhalten selbst verwaltet und kein Aussehen hat: Presses, Aktivierung per Tastatur,
der Zustand „disabled“ sowie die Checkbox-Rolle und der Wert für Screenreader (gemischt, solange unbestimmt), wobei der Wert
der App gehört (`checked`, `indeterminate`, `onChange`). Die App stylt die Checkbox und ihren Indikator, dessen
Klassen `checked:`, `indeterminate:` und `disabled:` der Checkbox folgen, und setzt ihr eigenes Zeichen in den Indikator
(`indicator`). Siehe [Checkbox](../elements/checkbox.md).

<a id="radio-and-radiogroup"></a>

### Radio und RadioGroup

Eine Option einer Menge, aus der der Nutzer genau eine wählt, und die Menge um sie herum. Ein Radio verwaltet sein Verhalten selbst und hat kein
Aussehen: Presses, Aktivierung per Tastatur, der Zustand „disabled“ sowie die Radio-Rolle und der Checked-Zustand für Screenreader. Die
Gruppe ist die Radiogruppe, die Screenreader ansagen, und hält keinen Wert: Die App teilt jedem Radio mit, ob es ausgewählt ist
(`checked`), und ein Press auf ein nicht ausgewähltes fordert dies an (`onChange`). Der Indikator und das Label der App sind die
Children des Radios, deren Klassen `group-checked:` ihm folgen. Siehe [Radio](../elements/radio.md).

### Switch

Ein Ein-/Aus-Steuerelement, das sein Verhalten selbst verwaltet und kein Aussehen hat: Presses, Aktivierung per Tastatur, der Zustand „disabled“ sowie die
Switch-Rolle und der Wert für Screenreader, wobei der Wert der App gehört (`checked`, `onChange`). Die App stylt den
Switch, seinen Track und seinen Thumb, deren Klassen `checked:` und `disabled:` dem Switch folgen. Siehe
[Switch](../elements/switch.md).

<a id="tab-and-tabs"></a>

### Tab und Tabs

Die Tabs einer Tab-Liste und die Liste um sie herum. Ein Tab verwaltet sein Verhalten selbst und hat kein Aussehen: Presses, Aktivierung per Tastatur,
der Zustand „disabled“ sowie die Tab-Rolle und der Selected-Zustand für Screenreader. Die Liste ist die Tab-Liste, die
Screenreader ansagen, und hält keinen Wert: Die App teilt jedem Tab mit, ob er ausgewählt ist (`selected`), erfährt von
Presses (`onPress`) und zeigt den Inhalt des ausgewählten Abschnitts selbst an. Das Label der App ist das Children des Tabs, dessen
Klassen `group-selected:` ihm folgen. Der Indikator der Liste (`indicatorClass`, `indicatorStyle`), eine Unterstreichung oder eine
Pill, die die App stylt, sitzt auf dem ausgewählten Tab und springt nativ zum nächsten. Siehe [Tabs](../elements/tabs.md).
### Carousel

Folien, die jeweils eine nach der anderen angezeigt werden (die Fotos eines Produkts, ein Onboarding, ein Banner, eine Reihe von Karten). Der Inhalt ist eine native Scroll-View, die an den Anfängen der Folien einrastet. Finger, Mausrad und Touchpad bewegen die Folien daher im selben Frame wie der Zeiger. Kommt das Carousel zur Ruhe, meldet es die angezeigte Folie mit `onChange`. Zurück und Weiter (`CarouselPrevious`, `CarouselNext`), die Paginierung (mehrere `CarouselPaginationItem` in einem `CarouselPagination`, mit einem Indikator, der zur angezeigten Folie federt) und die Pfeiltasten bewegen es nativ, an den Enden nahtlos umlaufend mit `looping`. Die angezeigte Folie ist der `index` der App. Bei Folien, die von selbst weiterwechseln, schaltet ihn der eigene Timer der App weiter (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` geben an, wann zu warten ist). Das Aussehen und jedes Label liegen bei der App. Siehe [Carousel](../elements/carousel.md).

<a id="toggle-and-togglegroup"></a>

### Toggle und ToggleGroup

Ein Button, der an oder aus ist (Fett, ein Favorit, eine Ansichtsoption), und eine Toolbar aus solchen Buttons. Ein Toggle besitzt sein Verhalten und hat kein eigenes Aussehen: Klicks, Tastaturaktivierung, den deaktivierten Zustand und die Button-Rolle mit ihrem gedrückten Zustand für Screenreader. Die Gruppe ist die Toolbar, die Screenreader ansagen, und bildet einen Haltepunkt des Tastaturfokus. Ihre Pfeiltasten bewegen sich zwischen ihren Toggles, ohne sie zu betätigen. Sie hält keinen Wert: Die App teilt jedem Toggle mit, ob er gedrückt ist (`pressed`), erfährt den Wert, den er anfordert (`onChange`), und hält beliebig viele oder genau einen gedrückt. `disabled` an der Gruppe deaktiviert jeden Toggle darin. Das Icon oder Label der App ist das Kind des Toggles, dem seine `group-aria-pressed:`-Klassen folgen. Siehe [Toggle](../elements/toggle.md).

<a id="toolbar-toolbargroup-and-toolbarseparator"></a>

### Toolbar, ToolbarGroup und ToolbarSeparator

Eine Leiste mit Steuerelementen: die Formatierung eines Texteditors, die Steuerung eines Mediaplayers, eine vertikale Werkzeugpalette. Die Toolbar ist das Element, das Screenreader ansagen (benannt durch `accessibilityLabel`), und bildet einen Haltepunkt des Tastaturfokus über die `Button`, `Toggle` und `Link` darin: Tab springt zu dem Element, das zuletzt verlassen wurde, die Pfeiltasten ihrer `axis` bewegen sich daran entlang, und Pos1 und Ende springen zu ihren Enden, ohne etwas zu betätigen. Eine `ToolbarGroup` ist eine benannte Folge zusammengehöriger Elemente (Rückgängig und Wiederholen, eine Ausrichtung), und eine `ToggleGroup` innerhalb einer Toolbar ist eine ihrer Gruppen, ihre Toggles sind die Elemente der Toolbar. Ein `ToolbarSeparator` ist eine Linie, die die App zwischen Folgen zeichnet. `disabled` an der Toolbar oder einer Gruppe deaktiviert jedes Element darin. Die Toolbar hält keinen Wert und hat kein eigenes Aussehen: Jedes Steuerelement behält seinen eigenen Zustand, und die App gestaltet die Leiste, ihre Gruppen und Trenner. Siehe [Toolbar](../elements/toolbar.md).

### Select

Ein Wert, der aus einer Liste von Elementen gewählt wird, die als Daten übergeben werden (`items`: jeweils ein Wert und ein Titel, optional deaktiviert oder in einem Abschnitt), ohne eigenes Aussehen. Der Trigger der App öffnet die Liste: auf dem Desktop als Popup am Trigger, auf Smartphones und Tablets als Sheet am unteren Rand. Der Select besitzt die Tastatur (Pfeil nach oben, Pfeil nach unten, Pos1, Ende, Bild auf und Bild ab, Typeahead, Return und Escape), die Suche (`searchable`), die hervorgehobene Zeile (`focus:` an `itemClass`; `renderItem` erhält, was ein Element ist, nie seinen Zustand) und die Rollen Combobox, Listbox und Option für Screenreader. Die App besitzt den Wert (`value`, `onChange`) oder überlässt ihn dem Select (`defaultValue`) und gestaltet jeden Teil oder zeichnet die Zeilen. Siehe [Select](../elements/select.md).

### Combobox

Werte, die aus einer Liste von Elementen gewählt werden, wie die Liste eines Selects, gefiltert durch Eingabe in das Eingabefeld der Combobox, ohne eigenes Aussehen: einer oder, mit `multiple`, mehrere. Eine Auswahl schaltet dann das Element um, während die Liste geöffnet bleibt. Der Wert ist ein Array, das die App besitzt (`value`, `onChange`) oder der Combobox überlässt (`defaultValue`). `onConfirm` meldet ihn, wenn die Liste sich schließt. Die Suchanfrage kann der App gehören (`query`, `onQueryChange`), ein Footer erscheint unter den Zeilen, und ein Löschen-Button leert den Wert. Siehe [Combobox](../elements/combobox.md).

### Calendar

Ein Datum oder, mit `range`, ein Datumsbereich, der aus Monaten mit Tagen gewählt wird, ohne eigenes Aussehen. Ein Monat oder mehrere (`numberOfMonths`) werden nebeneinander angezeigt. Die Kopfzeile blättert zwischen ihnen und öffnet eine Ansicht der Monate oder eine Seite mit Jahren. Der Wert ist ein ISO-Datum (`"2026-10-28"`) oder `[start, end]`, das die App besitzt (`value`, `onChange`) oder dem Calendar überlässt (`defaultValue`). `disabledMatcher` verhindert, dass Tage gewählt werden, und die Tage nehmen die Tastatur als ein Tab-Haltepunkt entgegen. Die App gestaltet die Teile und zeichnet die Elemente (`renderItem`, mit dem, was ein Element ist; seine Zustände sind seine Klassen, die Tage eines Bereichs `selected:` mit `data-range-start:`, `data-range-middle:` und `data-range-end:`). Siehe [Calendar](../elements/calendar.md).

### TimeField

Eine Uhrzeit, die segmentweise bearbeitet wird, ohne eigenes Aussehen: die Stunde, die Minute, die Sekunde (`precision`) und AM/PM (`hourCycle="h12"`), durch Hoch- und Herunterzählen, Tippen oder den Ziffernblock eines Smartphones. Der Wert ist `"HH:MM"` (`"HH:MM:SS"`) im 24-Stunden-Format, der der App (`value`, `onChange`) oder der des Felds selbst (`defaultValue`). Siehe [TimeField](../elements/time-field.md).

### DatePicker

Ein Datum, das aus einem Calendar gewählt wird, der sich über den Trigger der App öffnet, wie die Liste eines Selects: auf dem Desktop als Popup, auf Smartphones als Sheet. Der Wert hat die Formen der HTML-Inputs: ein ISO-Datum, `[start, end]` mit `range` oder Datum und Uhrzeit mit `timePrecision` (ein TimeField unter dem Calendar), der der App (`value`, `onChange`) oder der des Pickers selbst (`defaultValue`). Voreinstellungen setzen ihn, ein Löschen-Button löscht ihn, und jede Prop von `Calendar` wird weitergereicht. Siehe [DatePicker](../elements/date-picker.md).

### Collapsible

Ein Bereich, dessen Inhalt sich auf- und zuklappt, ohne eigenes Aussehen: Seine Kinder werden immer angezeigt (eine Zusammenfassung, der Trigger), sein `content` danach, solange `open`. Die App besitzt `open` und den Trigger, der ihn umschaltet, und teilt dort Screenreadern den aufgeklappten Zustand mit. Der Inhalt wird einmal erzeugt und bleibt im zugeklappten Zustand erhalten, sodass das, was darin liegt, seinen Zustand behält. Mit `reveal` öffnet und schließt er sich nativ mit federnder Höhe. Siehe [Collapsible](../elements/collapsible.md).

### Accordion

Gestapelte Abschnitte, die sich unter ihren Überschriften auf- und zuklappen, ohne eigenes Aussehen: ein `Accordion` aus `AccordionItem`, jeweils ein `AccordionHeader` um seinen `AccordionTrigger` und ein `AccordionPanel`. Die App besitzt `value`, die Werte der geöffneten Elemente, und setzt das eine `onChange`, das gemeldet wird, wenn ein Trigger gedrückt wird: ein Element nach dem anderen oder, mit `multiple`, mehrere. Screenreader hören eine Gruppe von Überschriften, deren Buttons angeben, ob ihr Element aufgeklappt ist, und jedes geöffnete Panel als Region. Mit `reveal` öffnet und schließt sich ein Panel nativ mit federnder Höhe, mit `keepMounted` bleibt sein Inhalt im geschlossenen Zustand im Baum. Siehe [Accordion](../elements/accordion.md).

### Avatar

Das Bild einer Person, ohne eigenes Aussehen: der Fallback (die Initialen von `name` oder der `fallback` der App) und darüber das Bild, das transparent bleibt, bis es geladen ist, beide so groß wie der Avatar, danach die Kinder der App (ein Präsenzpunkt). Die eigenen Load- und Error-Events des Images ändern seinen Status nativ (`onStatusChange`), und `fallbackDelay` hält den Fallback zurück, während ein Bild lädt. Screenreader hören ein Bild, das mit dem Namen beschriftet ist. Eine `AvatarGroup` zeigt ihre ersten `limit` Avatare, erzeugt keine Views für die übrigen und zeigt ihren `overflow`, solange `total` mehr sind. Siehe [Avatar](../elements/avatar.md).

### Progress

Ein linearer Fortschrittsbalken, ohne eigenes Aussehen: eine Spur mit einem Indikator darin, wobei der Indikator `value` Prozent der Breite der Spur einnimmt. Die App besitzt `value` (0 bis 100) und `indeterminate`. Screenreader erhalten die Rolle Fortschrittsbalken, den Bereich und den Wert, im unbestimmten Zustand jedoch keinen Wert, wobei Breite und Bewegung des Indikators dann Sache der App sind. Siehe [Progress](../elements/progress.md).

### NumberInput

Eine Zahl, die in ein Feld getippt oder schrittweise verändert wird, ohne eigenes Aussehen: das Feld (`Input`), davor das Verringern und danach das Erhöhen (oder beides in einer Spalte rechts, `controlsRight`). Die App besitzt `value` (eine Zahl oder `null`; oder der Input behält seinen eigenen aus `defaultValue`) und erfährt `onChange` mit der Zahl, als die das Feld den Inhalt liest. Das Feld nimmt eine Zahl oder den Text auf dem Weg dorthin an, einschließlich Ziffern und Vorzeichen anderer Tastaturen. Die Buttons, Pfeil nach oben / Pfeil nach unten und Bild auf / Bild ab verändern den Wert um `step`, wobei die Dezimalstellen erhalten bleiben, bis zu `min` und `max`, und beim Verlassen des Felds wird ein getippter Wert auf diese Grenzen gesetzt. Das Feld ist für Screenreader ein Spin-Button, dessen Erhöhen und Verringern es schrittweise verändern. Siehe [NumberInput](../elements/number-input.md).

### Slider

Ein Wert oder ein Bereich aus zwei Werten, der entlang einer Spur gewählt wird, ohne eigenes Aussehen: eine Spur, die Klicks und Drags annimmt, der Indikator darin, auf den die Werte abgebildet werden, der Bereich und ein Thumb pro Wert darauf. Die App besitzt `value` (eine Zahl oder `[start, end]`; oder der Slider behält seinen eigenen aus `defaultValue`) und erfährt `onChange` für jeden neuen Wert, eingerastet auf `step` ab `min`, sowie `onChangeEnd` einmal pro Änderung. `scale` verteilt die Werte linear oder nach Größenordnungen, `axis` legt die Spur horizontal oder vertikal aus. Jeder Thumb ist für Screenreader ein einstellbares Element mit eigenem Wert, ein Haltepunkt des Tastaturfokus, und bewegt sich mit den Slider-Tasten von WAI-ARIA. Siehe [Slider](../elements/slider.md).

### Scrollbar

Eine Bildlaufleiste im eigenen Aussehen der App für eine Scroll-View oder eine Liste, dort platziert, wo die App sie haben will, ohne eigenes Aussehen: eine Spur (die `class` der Leiste) und ein Thumb darin (`thumbClass`). Sie benennt ihre Scroll-View (`scroll`, ihre `ref`) und folgt deren Offset, Inhalt und Viewport. Ein Drag des Thumbs scrollt den Inhalt, ein Klick auf die Spur bringt die Mitte des Thumbs dorthin. `mode` zeigt sie an, während der Inhalt scrollt (danach bis `motion.idle`), solange der Zeiger über der Leiste ist, oder immer. `axis` macht sie horizontal. `Scrollbar.setTheme` gibt jeder Scroll-View und Liste eine Leiste im Aussehen der App über ihrem Viewport, ohne dass eine platziert werden muss, und eine View kann ein eigenes Theme über ihre Prop `scrollbar` erhalten. Siehe [Scrollbar](../elements/scrollbar.md).

### ColorPicker

Ein Farbwähler ohne eigenes Aussehen: Das Root hält die Farbe, und die Teile darin zeigen und ändern sie, von der App angeordnet. `ColorArea` ist Sättigung und Helligkeit von HSB, `ColorSlider` ein beliebiger Kanal von RGB, HSL, HSB oder OKLCH oder der Alpha-Kanal (horizontal oder vertikal), `ColorField` die Farbe in jeder CSS-Form oder die Zahl eines Kanals, `ColorSwatch` eine Voreinstellung, die ein Klick wählt, oder eine Vorschau der Farbe, `ColorEyeDropper` ein Button, der eine Farbe auf dem Bildschirm aufnimmt (macOS, Web). Die App besitzt `value` (oder der Picker behält seinen eigenen aus `defaultValue`) und erfährt `onChange` und `onChangeEnd` mit der Farbe und ihrem Text, wie `format` ihn schreibt. Der Picker behält die Kanäle jedes Farbraums so, wie der Benutzer sie gesetzt hat. Die Thumbs sind für Screenreader einstellbare Elemente und Haltepunkte des Tastaturfokus. Siehe [ColorPicker](../elements/color-picker.md).

### OtpInput

Ein numerischer Einmalcode fester Länge, ohne eigenes Aussehen: Ein natives Textfeld über den Zellen nimmt die Tastatur entgegen, sodass Tippen, Einfügen, der Ziffernblock und das Code-Autofill des Systems Sache der Plattform sind und Screenreader ein einziges Textfeld finden. Es werden nur Ziffern angenommen, bis zu `length`; die Rücktaste entfernt die letzte. Die App besitzt `value` (oder übergibt `defaultValue`) und erfährt `onChange` und `onComplete`. Sie gestaltet die Zellen (`focus:` an der Zelle, die die nächste Ziffer aufnimmt, `data-filled:` an denen, die eine Ziffer enthalten), ihre Gruppen und den Cursor. Siehe [OtpInput](../elements/otp-input.md).

### Pagination

Die Seiten einer Menge, zwischen denen man sich bewegt, eine Navigations-Landmark ohne eigenes Aussehen: Zurück, die erste und die letzte Seite, die aktuelle mit ihren Nachbarn (`visiblePages`), eine Ellipse für jede ausgelassene Folge, die Kinder der App und Weiter. `compact` behält Zurück, die Kinder und Weiter. Die App besitzt `page` und erfährt `onChange({ page })`. Die aktuelle Seite ist `selected:` und für Screenreader die aktuelle Seite. Die App gestaltet die Elemente (`itemClass`) oder zeichnet sie (`renderItem`). Siehe [Pagination](../elements/pagination.md).

### Command

Eine Befehlspalette: ein Suchfeld über den Befehlen der App (`items`: ein `id`, ein `label`, `keywords`, ein `group`, ein `shortcut` zur Anzeige, `disabled`, `checked`), das nativ beim Tippen gefiltert wird (das Label oder ein Schlüsselwort enthält die Suchanfrage, ohne Beachtung der Groß- und Kleinschreibung; Abschnitte ohne Treffer entfallen), in einer virtualisierten Liste, die nur die sichtbaren Zeilen erzeugt. Pfeil nach oben und Pfeil nach unten bewegen die Hervorhebung, Return oder ein Klick wählt (`onSelect({ id })`), Escape leert die Suchanfrage und meldet danach `onCancel`, woraufhin die App einen `Dialog` darum schließt. Die Suchanfrage gehört der App (`query`, `onQueryChange`) oder dem Feld selbst. Mit `filterable={false}` und `loading` beantwortet die App sie von einem Server. Die App gestaltet jeden Teil (`itemClass` mit `focus:` für die Hervorhebung, `checked:`, `disabled:`) und zeichnet die Zeilen (`renderItem`, mit dem Shortcut, wie er hier angezeigt wird). Siehe [Command](../elements/command.md).

### Tree

Elemente, die Elemente enthalten: die Dateien eines Projekts, eine Einstellungs-Sidebar, eine Gliederung. `items` sind Daten (`TreeItem`: ein `id`, ein `label`, `children`, `disabled`), und die Zeilen sind virtualisiert: Nur die sichtbaren werden erzeugt, und die Kinder eines zugeklappten Elements nie, sodass ein Tree mit Tausenden von Elementen schnell bleibt. Die App besitzt die IDs der aufgeklappten Elemente und das ausgewählte (`expanded`, `selected`, mit `onExpandedChange` und `onSelectedChange`) oder der Tree behält seine eigenen (`defaultExpanded`, `defaultSelected`). Ein Klick wählt eine Zeile aus und klappt einen Ordner auf oder zu. Der Tree ist ein Haltepunkt des Tastaturfokus, dessen Pfeiltasten die Auswahl bewegen (Pfeil nach rechts und links klappen auf und zu, betreten und verlassen einen Ordner), dazu Pos1, Ende, Return, Leertaste und Typeahead. Die App gestaltet die Zeilen (`itemClass` mit `selected:`, `aria-expanded:`, `focus:`) und zeichnet sie (`renderItem`, mit dem `depth` jedes Elements). Siehe [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

Die Bausteine, aus denen Diagramme bestehen, wie `gpui-base`s `plot`, liegen in einem eigenen Modul: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"``. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
sind geprüfte Schlüssel oder Funktionen einer Zeile), die `point`-, `linear`- oder `band`-Skalen der Achsen, die Zeile unter dem Zeiger
(`onHoverChange`) und deren Bewegung (`motion`: das Erscheinen, das Ein- und Ausblenden beim Hover und das Gleiten). Die Marks zeichnen nativ aus den
Zeilen, ohne JS pro Punkt, und werden mit den SVG-Paint-Eigenschaften (`stroke-*`, `fill-*`) gemalt, mit `currentColor`, wo keine
gesetzt ist. Ein `Area` oder ein `Bar` zeigt innerhalb seiner Formen einen Hintergrund (einen Verlauf, `bg-linear-*`). Balken stehen in den
Bändern einer `band`-Skala, nebeneinander oder in einem `stack` gestapelt, wachsen beim Erscheinen des Plots ein und blenden sich aus, außer bei der Zeile
unter dem Zeiger, mit einem `label`-Teil am Ende jedes Balkens.
Die Fadenkreuzlinie, die Punkte (bei `hoverDotClass` jeweils die eigenen jedes Marks) und der Tooltip (`tooltipPlacement`, innerhalb des Plots gehalten) beim Hover sind Teile, die die App gestaltet und befüllt und die nativ bewegt werden;
Achsenbeschriftungen sind eigene Elemente der App. Ein `Pie` teilt den Vollkreis in ein Stück pro Zeile (ein Donut mit einem
`innerRadius`), jedes mit eigenen Klassen gemalt (`sliceClass`, eine Funktion der Zeile), und ein `Arc` zeichnet einen Sektor
zwischen zwei Winkeln (Spur und Wert eines Gauges); über einem Pie meldet der Plot das Stück unter dem Zeiger, das sich abhebt
(`hoverLift`), während die anderen ausblenden (`hoverDim`). Ein `Sankey` zeichnet Flüsse zwischen den Zeilen (`links`), angeordnet so,
wie d3-sankey sie anordnet, wobei jeder Knoten und jedes Band mit eigenen Klassen gemalt wird, die Knoten beschriftet sind, auf Hover reagieren und sich zu neuen Flüssen bewegen. Ein `Treemap` legt die Zeilen als Hierarchie verschachtelter
Rechtecke aus (`id`, `parent`), wobei die Fläche jedes Blatts sein `value` ist, eingefärbt nach Kategorie oder entlang einer Rampe der `colorScale` des Plots,
mit Beschriftungen, die dort gezeigt werden, wo sie passen. Siehe [Plot](../elements/plot.md).

## Workspaces

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup und ResizablePanel

Panels nebeneinander oder gestapelt, mit einem Handle zwischen je zwei Panels, das der Nutzer zieht, um den Platz aufzuteilen. Die Gruppe verantwortet
das Ziehen, das nativ abläuft, die Grenzen jedes Panels (`minSize`, `maxSize`) und den Resize-Cursor; die Größen gehören
der App (`size`, gemeldet mit `onResize`), ebenso das Aussehen der Handles und der Inhalt der Panels. Siehe
[Resizable](../elements/resizable.md).

### DockArea

Ein andockbarer Arbeitsbereich: Panels in Tab-Gruppen, Gruppen nebeneinander oder gestapelt geteilt, und Docks am linken, rechten und
unteren Rand. Das Layout sind Daten, die der App gehören (`layout`, gemeldet mit `onLayoutChange`); die Area verantwortet das Ziehen und
Ablegen von Tabs, die Größenänderung, die Docks, den Zoom und die Sperre, behält den Inhalt jedes Panels beim Verschieben und stellt dasselbe Layout bei geringer Breite mit
Drawers und einem Bottom Sheet dar. Die Tabs, Handles, der Drop-Indikator und der Inhalt der Panels gehören
der App. Siehe [Dock](../elements/dock.md).

<a id="documents"></a>

## Dokumente

### TextView

`TextView` zeigt ein Dokument aus Markdown, HTML oder von der App erzeugten Blöcken, gezeichnet mit [`Text`](../elements/text.md)-
Elementen und Views: Überschriften, Listen, Code, Tabellen, Bilder, Formeln, Fußnoten und die eigene Syntax der App. Es ist für
KI-Chat-Antworten gemacht, die per Stream eintreffen, mit einer Lesetypografie in den Farben des Themes, die die App Teil für Teil umgestaltet,
und mit Render-Funktionen, die den Inhalt der App an die richtige Stelle setzen. Siehe [TextView](../elements/text-view.md).

## Code

### Editor

`Editor` ist ein Code-Editor für mehr als fünfzig Sprachen: Syntax-Highlighting, Zeilennummern, mehrere Carets, Folding,
Soft Wrap, Suchen und Ersetzen, Diagnosen und Dekorationen, mit den Tastenkürzeln von Code-Editoren. Der Text gehört der App
(`value` und `onChange`), ebenso die Suchleiste, die den `search` des Editors steuert. Er kommt mit einem Aussehen, das aus
den Tokens des Themes gebaut ist und das die App Teil für Teil umgestaltet. Siehe [Editor](../elements/editor.md).

### DiffView

`DiffView` zeigt die Änderungen zwischen zwei Texten oder in den Dateien eines Patches, wie Code-Review-Tools es tun: nebeneinander oder
vereinheitlicht, mit hervorgehobenen geänderten Wörtern innerhalb der Zeilen, unveränderte Zeilen zu aufklappbaren Trennern zusammengefasst, in den
Syntaxfarben des `Editor`. Die Aktionen der App übernehmen oder verwerfen jede Änderung. Siehe [DiffView](../elements/diff-view.md).

### Table

`Table` und seine Teile ordnen einige Zeilen an, die die App als Children schreibt, und geben Screenreadern eine Tabelle: Zeilengruppen,
Zeilen, Spaltenköpfe und Zellen. Jeder Teil übernimmt das Aussehen der App. Siehe [Table](../elements/table.md).

### DataTable

`DataTable` zeigt Zeilen und Spalten und scrollt in beide Richtungen über beliebig viele davon, wobei nur die sichtbaren Zellen erzeugt werden. Zeilen,
Spalten oder Zellen sind auswählbar; Spalten lassen sich in der Größe ändern, verschieben, fixieren und sortieren (die App sortiert); die App liefert Zeilen seitenweise
und kann Zellen und Titel zeichnen. Siehe [DataTable](../elements/data-table.md).

## Navigation

Ein `NavStack` aus `NavPage`s ist unter iOS `UINavigationController` und unter
Android ein Stack mit Toolbar und Predictive Back; auf den Desktops und im Web zeigt jede Seite den eigenen `header` der App. Siehe
[NavStack](../elements/nav-stack.md), das auch `createNavStack` und das Verlassen einer Seite behandelt.

### Dialog

`Dialog` zeigt Inhalt über allem anderen, einschließlich dem Header des Stacks, in einer eigenen nativen Fensterebene. Popup
und Backdrop werden von der App gestaltet. Siehe [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## Alert-Dialoge

### AlertDialog

`AlertDialog.show(options)` zeigt den plattformeigenen Alert oder Action Sheet und wird mit `{ action }` aufgelöst, dem `id`
der vom Nutzer gewählten Aktion. Siehe [AlertDialog](../elements/alert-dialog.md).

## Input

`Input` ist die native Texteingabe der Plattform: ein einzeiliges oder mehrzeiliges Feld, dessen Eingabe, Caret, Auswahl,
Autokorrektur und Autofill die Plattform übernimmt. Die App verantwortet seinen Wert und sein Aussehen. Seine Props sind der Typ `InputProps` (mit `IOSInputProps` für `ios={{…}}`), der daneben exportiert wird. Siehe [Input](../elements/input.md).

<a id="status-bar"></a>

## Statusleiste

Die Statusleiste gehört zu dem, was auf dem Bildschirm ist, wie in UIKit, wo jeder View Controller seinen
`preferredStatusBarStyle` deklariert und der oberste entscheidet. In NSH sind die Seiten und Dialoge diese View Controller: eine
`NavPage` oder ein `Dialog` deklariert die gewünschte Statusleiste mit `statusBar`, und die App deklariert ihren Standard in
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

`statusBar` nimmt diese Felder entgegen, jedes optional (in Rust ein `StatusBarStyle` allein oder die Builder-Methoden von `StatusBarSetting`
mit denselben Namen):

| Feld | Typ | Beschreibung |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | Die Farbe des Inhalts (Uhrzeit, Akku, Signal): `"light"` für dunkle Hintergründe, `"dark"` für helle, `"auto"` die der Plattform für das aktuelle Erscheinungsbild. |
| `hidden` | `boolean` | Blendet die Statusleiste aus. |
| `animated` | `boolean` | Animiert die Änderung, wenn die Seite oder der Dialog erscheint und verschwindet. |

Der Wert ist reaktiv: `statusBar={{ foreground: dark() ? "light" : "dark" }}` folgt dem Signal, ebenso eine Rust-
Closure, die eines liest.

<a id="which-one-applies"></a>

### Welche Einstellung gilt

Die zuletzt gezeigte Seite bzw. der zuletzt gezeigte Dialog entscheidet **feldweise**: Eine auf einen Stack gepushte Seite liegt über den Seiten
darunter, und ein geöffneter Dialog liegt über den Seiten. Ein Feld, das sie auslässt, kommt von der Ebene darunter und schließlich
vom Standard der App. Wird die Seite gepoppt oder der Dialog geschlossen, gilt wieder die Ebene darunter.

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

### Der Standard der App

`nsh.json`s `"statusBar"` ist die Einstellung unter jeder Seite und jedem Dialog, so wie `UIStatusBarStyle` und
`UIStatusBarHidden` der Info.plist es in einer UIKit-App sind:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

Beide Felder sind optional. Ohne sie ist der Inhalt `"auto"` und die Leiste wird angezeigt. Verpackte iOS-Apps zeigen sie auch auf dem
Launch Screen.

<a id="the-status-bar-on-each-platform"></a>

### Die Statusleiste auf den einzelnen Plattformen

- **iOS**: Ausblenden und Einblenden werden mit einer Überblendung animiert. In einer App, die in eine native App [eingebettet](../docs/ios.md) ist,
  entscheidet der View Controller der Host-App, wie die Statusleiste aussieht. Die Host-App übernimmt die Einstellung von NSH, indem sie
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` und
  `NshAppView.preferredStatusBarUpdateAnimation` aus ihrem View Controller zurückgibt.
- **Android**: Apps zeichnen Edge-to-Edge, hinter der Statusleiste (Android 15, API 35): Der eigene Hintergrund der App ist
  der der Leiste, und `foreground` hält ihren Inhalt darauf lesbar.
- **Desktops und Web**: Die Titelleiste des Fensters und die Leisten des Browsers gehören dem System und dem Browser;
  `statusBar` und `nsh.json`s `"statusBar"` sind für die Smartphones gedacht.

> [!IMPORTANT]
> Wenn Ihr `nsh.json` `"capabilities"` deklariert, ändert sich die Statusleiste nur, wenn diese
> `"statusBar": true` enthalten; andere Änderungen werden abgelehnt und protokolliert. Siehe
> [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## Siehe auch

- [Navigation guide](../docs/navigation.md).
- [Forms and keyboard](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) und [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) und
  [Input](../elements/input.md).
- [Device and environment](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` und weitere Android-only-APIs.
