---
title: "nsh/base"
description: "Componenti base senza stile per l'interfaccia utente di un'app: pulsanti, link, avatar, caroselli, checkbox, radio, switch, schede, toggle, barre degli strumenti, alberi, select, combobox, palette di comandi, calendari, selettori di data, campi orario, pannelli ridimensionabili, workspace ancorabili, documenti Markdown e HTML, un editor di codice, diff, campi di testo, stack di navigazione e finestre di dialogo, finestre di avviso di sistema e la barra di stato di pagine e finestre di dialogo."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` è il livello base dei componenti della UI di un'app: componenti privi di stile che gestiscono comportamento, stato, focus e accessibilità, su ogni piattaforma. Si colloca tra le primitive (`nsh`, `nsh/mobile` e `nsh/desktop`) e la libreria di componenti dell'app, così come `gpui-base` si colloca tra `gpui` e una libreria con stile in GPUI Kit (vedi [Moduli](./index.md#three-layers)). Fornisce controlli (`Button`, `Link`, `Checkbox`, `ColorPicker` con il suo `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` e `ColorEyeDropper`, `NumberInput`, `Radio` in un `RadioGroup`, `Slider`, `Switch`, `Tab` in `Tabs`, `Toggle` in un `ToggleGroup`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), palette di comandi (`Command`), barre di controlli (`Toolbar` con i suoi `ToolbarGroup` e `ToolbarSeparator`), barre di scorrimento dall'aspetto proprio dell'app (`Scrollbar`), regioni che si espandono e si comprimono (`Collapsible`, e `Accordion` con i suoi `AccordionItem`, `AccordionHeader`, `AccordionTrigger` e `AccordionPanel`), una barra di avanzamento (`Progress`), codici monouso (`OtpInput`), le pagine di un insieme (`Pagination`), elementi che contengono elementi (`Tree`), le parti con cui si costruiscono i grafici (`Plot` con `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` e `Arc`, in `nsh/base/plot`), spazi di lavoro che l'utente organizza (`ResizablePanel` in un `ResizablePanelGroup`, e le divisioni, i gruppi di schede e i dock di `DockArea`), caroselli (`Carousel` e le sue parti), documenti in Markdown o HTML (`TextView`), un editor di codice (`Editor`), le differenze tra testi (`DiffView`) e tabelle di righe e colonne (`Table` e le sue parti, `DataTable`), campi di testo (`Input`), popup mostrati sopra a tutto (`Popover`, `Menu` e `ContextMenu` con i rispettivi `MenuItem`, `MenuSeparator` e `Submenu`, `Tooltip`, `Sheet`), toast (`Toast` in un `ToastStack`, il loro ciclo di vita in un `ToastManager`), la navigazione (un `NavStack` di `NavPage` guidato dallo stato che crei con `createNavStack`, e `Dialog` per i contenuti presentati sopra a tutto il resto) e le finestre di avviso del sistema (`AlertDialog`). Anche pagine e finestre di dialogo decidono la barra di stato (`statusBar`).

L'insieme base include anche `Avatar` e `AvatarGroup`: immagini con stato di caricamento nativo e una riga che dispone i primi `limit` avatar.

L'aspetto è quello dell'app: ciò che sta dentro una pagina, una finestra di dialogo o un'intestazione è JSX tuo, costruito con le primitive, stili, classi [Tailwind](../docs/tailwind.md) e il tuo tema, componenti Rust dal [tuo crate](../docs/rust.md), oppure una libreria di componenti che la community costruisce su `nsh/base`. Ogni host serve `nsh/base`; le app Rust usano la stessa API dal crate `nsh-base` (`nsh_base::{button, dialog, …}`).

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

Questa pagina è l'indice del modulo: ogni componente ha una pagina dedicata con esempi, props e note sulle piattaforme. Per le guide passo passo, vedi la [Guida alla navigazione](../docs/navigation.md) e [Form e tastiera](../docs/forms-and-keyboard.md).

| TSX | Rust | Cos'è |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | Un elemento premibile con gli stati disabilitato e selezionato e un ruolo per gli screen reader. |
| [`Link`](../elements/link.md) | `link()` | Un elemento premibile che porta da qualche parte: apre il proprio `href` tramite il sistema, oppure è l'app ad aprirlo (`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | L'immagine di una persona, oppure un'alternativa (le iniziali, l'icona dell'app) durante il caricamento, in caso di errore e in assenza di immagine; e una riga che mostra i primi `limit` e un indicatore di eccedenza. Lo stato di caricamento è nativo. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | Un controllo selezionato, non selezionato o indeterminato, con un indicatore che l'app stila e contrassegna. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | Un'opzione di un insieme tra cui l'utente ne sceglie una, e l'insieme stesso; l'app decide quale è selezionata. |
| [`Switch`](../elements/switch.md) | `switch()` | Un controllo acceso / spento con una traccia e un cursore che l'app stila. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | Una scheda di un elenco di schede, e l'elenco; l'app decide quale è selezionata e ne mostra il contenuto. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | Un pulsante che è attivo o inattivo, e una barra degli strumenti di pulsanti simili; l'app decide quali sono premuti. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | Una barra di pulsanti, toggle e link: una sola tappa del focus da tastiera, lungo la quale si muovono i tasti freccia; gruppi di elementi correlati e linee tra di essi. |
| [`Carousel`](../elements/carousel.md) e le sue parti | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | Slide mostrate una alla volta sullo scorrimento nativo della piattaforma, con precedente / successivo, una paginazione, i tasti e un ciclo continuo; l'app decide `index`. |
| [`Select`](../elements/select.md) | `select()` | Un valore da un elenco di elementi: un popup sul trigger su desktop, un foglio sui telefoni; l'app decide `value` e disegna il trigger. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | Uno o più valori (`multiple`) da un elenco di elementi filtrato digitando nel suo campo; l'app decide `value` e stila il campo. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | Una data o un intervallo di date scelti da mesi di giorni, con viste per mese e anno e la tastiera; l'app decide `value` e disegna gli elementi. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | Un orario modificato segmento per segmento (ora, minuti, secondi, AM/PM); l'app decide `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | Una data, un intervallo o una data e ora da un calendario in un popup sul trigger su desktop, un foglio sui telefoni; l'app decide `value` e disegna il trigger. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | Una regione il cui contenuto si espande e si comprime; l'app decide `open` e il suo trigger. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | Sezioni impilate che si espandono e si comprimono sotto le loro intestazioni, una alla volta o più insieme (`multiple`); l'app decide `value`, gli elementi aperti. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | Un codice monouso in celle che l'app stila; l'app decide `value`, `onComplete` segnala quando è completo. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | Le pagine di un insieme: Precedente, le pagine attorno a quella corrente con i puntini di sospensione, i figli dell'app e Successivo; l'app decide `page`. |
| [`Command`](../elements/command.md) | `command()` | Una palette di comandi: un campo di ricerca sopra i comandi dell'app, filtrati in modo nativo per etichetta e parole chiave, in un elenco virtualizzato; Invio o una pressione scelgono (`onSelect`), in un `Dialog` per una palette Cmd+K. |
| [`Tree`](../elements/tree.md) | `tree()` | Elementi che contengono elementi, virtualizzati: espansi e compressi, uno selezionato, una sola tappa del focus da tastiera; l'app decide `expanded` e `selected` oppure l'albero mantiene il proprio stato. |
| [`Progress`](../elements/progress.md) | `progress()` | Una barra di avanzamento; l'app decide `value` (da 0 a 100) e `indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | Un numero digitato in un campo o modificato con pulsanti e tasti; l'app decide `value` (oppure il campo mantiene il proprio a partire da `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | Una barra di scorrimento dall'aspetto proprio dell'app per la scroll view o l'elenco che indica (`scroll`); il suo cursore segue il contenuto e i suoi trascinamenti e le sue pressioni lo fanno scorrere. |
| [`Slider`](../elements/slider.md) | `slider()` | Un valore, o un intervallo di due, scelto lungo una traccia; l'app decide `value` (oppure lo slider mantiene il proprio a partire da `defaultValue`). |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | Un selettore di colore e le sue parti: un'area di saturazione e luminosità, slider per qualsiasi canale di RGB, HSL, HSB o OKLCH e per l'alfa, campi per il colore o per un canale, campioni, un contagocce; l'app decide `value` (oppure il selettore mantiene il proprio a partire da `defaultValue`). |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | Pannelli affiancati o impilati, con maniglie che l'utente trascina per ridimensionarli. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | Uno spazio di lavoro di divisioni, gruppi di schede e dock sui bordi che l'utente organizza; il suo layout è un dato dell'app. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | Uno stack di navigazione nativo e le sue pagine. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | Contenuto presentato sopra a tutto il resto: fogli, flussi a schermo intero, finestre di dialogo. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | L'alert o l'action sheet della piattaforma. |
| [`TextView`](../elements/text-view.md) | `text_view()` | Un documento di Markdown, HTML o blocchi, disegnato con testi e viste, pensato per le risposte AI in streaming. |
| [`Editor`](../elements/editor.md) | `editor()` | Un editor di codice: evidenziazione della sintassi, più cursori, riduzione delle sezioni, trova e sostituisci, diagnostica. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | Le differenze tra due testi o di una patch, affiancate o unificate, con azioni per ogni modifica. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | Una tabella di righe e celle proprie dell'app, con i ruoli di una tabella per gli screen reader. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | Una tabella con un numero qualsiasi di righe e colonne: selezione, ordinamento, colonne fisse, ridimensionabili e spostabili, righe servite una pagina alla volta. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | Il campo di testo nativo della piattaforma, a una riga o a più righe. |
| [`Popover`](../elements/popover.md) | `popover()` | Contenuto ancorato a un trigger, sopra a tutto. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | Un'anteprima di ciò a cui punta il trigger, mentre il puntatore vi si ferma sopra (una pressione sugli schermi touch). |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | Menu: popup con sottomenu a cascata su desktop, fogli sui telefoni; elementi selezionabili e scelte singole. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | Un suggerimento accanto al suo trigger. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | Un pannello al bordo dello schermo sopra uno sfondo. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | Toast senza stile: una radice semantica, uno stack di livelli, il loro ciclo di vita. |
| `statusBar` su pagine e finestre di dialogo | `.status_bar(..)` | La barra di stato mentre una pagina o una finestra di dialogo è visibile. Vedi [Barra di stato](#status-bar). |

In Rust, `theme()` legge il tema dell'app come design token (`theme().primary`, `theme().radius`), gli stessi token usati dalle [classi del tema](../docs/tailwind.md#theme-tokens) di TSX.

<a id="controls"></a>

## Controlli

### Button

Un elemento premibile che gestisce il proprio comportamento e non ha aspetto: pressioni, stati disabilitato e selezionato e il suo ruolo per gli screen reader. Il suo aspetto è dato da `class` e `style` dell'app con varianti di stato, il suo contenuto sono i suoi figli. Vedi [Button](../elements/button.md).

### Link

Un elemento premibile che porta da qualche parte e non ha aspetto: pressioni, Invio e Spazio mentre ha il focus da tastiera, lo stato disabilitato, il ruolo di link per gli screen reader e la pagina corrente di una navigazione (`current`). `href` è la destinazione, mai mostrata: una pressione la segnala (`onOpen`), poi apre una pagina web o il link di un'altra app fuori dall'app oppure, con `openWith="app"`, lascia l'apertura alle route dell'app. Vedi [Link](../elements/link.md).

### Checkbox

Un controllo selezionato, non selezionato o indeterminato che gestisce il proprio comportamento e non ha aspetto: pressioni, attivazione da tastiera, stato disabilitato e ruolo e valore di checkbox per gli screen reader (misto quando è indeterminato), con il valore deciso dall'app (`checked`, `indeterminate`, `onChange`). L'app stila la checkbox e il suo indicatore, le cui classi `checked:`, `indeterminate:` e `disabled:` seguono la checkbox, e inserisce nell'indicatore il proprio segno (`indicator`). Vedi [Checkbox](../elements/checkbox.md).

<a id="radio-and-radiogroup"></a>

### Radio e RadioGroup

Un'opzione di un insieme tra cui l'utente sceglie esattamente una, e l'insieme che le racchiude. Una radio gestisce il proprio comportamento e non ha aspetto: pressioni, attivazione da tastiera, stato disabilitato e ruolo radio e stato di selezione per gli screen reader. Il gruppo è il radio group annunciato dagli screen reader e non contiene alcun valore: l'app comunica a ogni radio se è selezionata (`checked`), e una pressione su una non selezionata ne fa richiesta (`onChange`). L'indicatore e l'etichetta dell'app sono i figli della radio, le cui classi `group-checked:` la seguono. Vedi [Radio](../elements/radio.md).

### Switch

Un controllo acceso / spento che gestisce il proprio comportamento e non ha aspetto: pressioni, attivazione da tastiera, stato disabilitato e ruolo e valore di switch per gli screen reader, con il valore deciso dall'app (`checked`, `onChange`). L'app stila lo switch, la sua traccia e il suo cursore, le cui classi `checked:` e `disabled:` seguono lo switch. Vedi [Switch](../elements/switch.md).

<a id="tab-and-tabs"></a>

### Tab e Tabs

Le schede di un elenco di schede e l'elenco che le racchiude. Una scheda gestisce il proprio comportamento e non ha aspetto: pressioni, attivazione da tastiera, stato disabilitato e ruolo tab e stato di selezione per gli screen reader. L'elenco è la tab list annunciata dagli screen reader e non contiene alcun valore: l'app comunica a ogni scheda se è selezionata (`selected`), ascolta le pressioni (`onPress`) e mostra da sé il contenuto della sezione selezionata. L'etichetta dell'app è costituita dai figli della scheda, le cui classi `group-selected:` la seguono. L'indicatore dell'elenco (`indicatorClass`, `indicatorStyle`), una sottolineatura o una pillola che l'app stila, si posiziona sulla scheda selezionata e scatta nativamente sulla successiva. Vedi [Tabs](../elements/tabs.md).
### Carousel

Slide mostrate una alla volta (le foto di un prodotto, un onboarding, un banner, una riga di card). Il contenuto è una scroll view nativa che si aggancia all'inizio delle slide, così un dito, la rotella e il touchpad le muovono nello stesso frame del puntatore; quando si ferma, il carousel segnala la slide con `onChange`. Precedente e successivo (`CarouselPrevious`, `CarouselNext`), la paginazione (`CarouselPaginationItem` in un `CarouselPagination`, con un indicatore che scatta elasticamente sulla slide mostrata) e i tasti freccia la spostano in modo nativo, anche oltre le estremità senza interruzioni con `looping`. La slide mostrata è il `index` dell'app, che il timer dell'app fa avanzare per le slide che scorrono da sole (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` dicono quando attendere); l'aspetto e ogni etichetta sono dell'app. Vedi [Carousel](../elements/carousel.md).

<a id="toggle-and-togglegroup"></a>

### Toggle e ToggleGroup

Un pulsante che è attivo o inattivo (grassetto, un preferito, un'opzione di visualizzazione) e una toolbar di pulsanti di questo tipo. Un toggle gestisce il proprio comportamento e non ha aspetto: pressioni, attivazione da tastiera, stato disabilitato e ruolo di pulsante con il suo stato di pressione per gli screen reader. Il gruppo è la toolbar annunciata dagli screen reader, un unico punto di sosta del focus da tastiera i cui tasti freccia si spostano tra i suoi toggle senza premerli, e non contiene alcun valore: l'app comunica a ogni toggle se è premuto (`pressed`), riceve il valore richiesto (`onChange`) e mantiene un numero qualsiasi di toggle premuti oppure esattamente uno. `disabled` sul gruppo disabilita tutti i toggle al suo interno. L'icona o l'etichetta dell'app sono i children del toggle, che le classi `group-aria-pressed:` seguono. Vedi [Toggle](../elements/toggle.md).

<a id="toolbar-toolbargroup-and-toolbarseparator"></a>

### Toolbar, ToolbarGroup e ToolbarSeparator

Una barra di controlli: la formattazione di un editor di testo, i comandi di trasporto di un lettore multimediale, una tavolozza verticale di strumenti. La toolbar è quella annunciata dagli screen reader (denominata da `accessibilityLabel`) e costituisce un unico punto di sosta del focus da tastiera sui `Button`, `Toggle` e `Link` al suo interno: Tab entra nell'elemento che aveva lasciato per ultimo, i tasti freccia del suo `axis` si spostano lungo la barra e Home ed End saltano alle sue estremità, senza premere nulla. Un `ToolbarGroup` è una sequenza denominata di elementi correlati (annulla e ripeti, un allineamento), e un `ToggleGroup` dentro una toolbar è uno dei suoi gruppi, i cui toggle sono gli elementi della toolbar. Un `ToolbarSeparator` è una linea che l'app disegna tra una sequenza e l'altra. `disabled` sulla toolbar o su un gruppo disabilita tutti gli elementi al suo interno. La toolbar non contiene alcun valore e non ha aspetto: ogni controllo mantiene il proprio stato, e l'app definisce lo stile della barra, dei suoi gruppi e dei separatori. Vedi [Toolbar](../elements/toolbar.md).

### Select

Un valore scelto da un elenco di elementi forniti come dati (`items`: un valore e un titolo ciascuno, facoltativamente disabilitato o in una sezione), senza aspetto. Il trigger dell'app apre l'elenco: un popup in corrispondenza del trigger sui desktop, un sheet in basso su telefoni e tablet. Il select gestisce la tastiera (Su, Giù, Home, End, Pagina su e Pagina giù, typeahead, Invio ed Esc), la ricerca (`searchable`), la riga evidenziata (`focus:` su `itemClass`; `renderItem` riceve cos'è un elemento, mai il suo stato) e i ruoli combobox, listbox e option per gli screen reader. L'app possiede il valore (`value`, `onChange`) oppure lo lascia al select (`defaultValue`), e definisce lo stile di ogni parte o disegna le righe. Vedi [Select](../elements/select.md).

### Combobox

Valori scelti da un elenco di elementi, come l'elenco di un select, filtrati digitando nell'input del combobox, senza aspetto: uno solo oppure, con `multiple`, più valori; una scelta in tal caso
attiva o disattiva l'elemento mentre l'elenco resta aperto. Il valore è un array posseduto dall'app (`value`, `onChange`) oppure lasciato al combobox (`defaultValue`); `onConfirm` lo comunica alla chiusura dell'elenco. La query può essere dell'app (`query`, `onQueryChange`), un footer compare sotto le righe e un pulsante di cancellazione svuota il valore. Vedi [Combobox](../elements/combobox.md).

### Calendar

Una data, o con `range` un intervallo di date, scelta tra mesi di giorni, senza aspetto. Un mese o più mesi (`numberOfMonths`) sono mostrati affiancati; l'intestazione li scorre e apre una vista dei mesi o una pagina di anni. Il valore è una data ISO (`"2026-10-28"`) o `[start, end]` posseduto dall'app (`value`, `onChange`) oppure lasciato al calendario (`defaultValue`); `disabledMatcher` impedisce di scegliere certi giorni, e i giorni ricevono la tastiera come un unico punto di sosta di Tab. L'app definisce lo stile delle parti e disegna gli elementi (`renderItem`, dato cos'è un elemento; i suoi stati sono le sue classi, i giorni di un intervallo `selected:` con `data-range-start:`, `data-range-middle:` e `data-range-end:`). Vedi [Calendar](../elements/calendar.md).

### TimeField

Un'ora del giorno modificata un segmento alla volta, senza aspetto: l'ora, i minuti, i secondi (`precision`) e AM/PM (`hourCycle="h12"`), tramite incrementi, digitazione o tastierino numerico di un telefono. Il valore è `"HH:MM"` (`"HH:MM:SS"`) su un orologio a 24 ore, quello dell'app (`value`, `onChange`) o quello proprio del campo (`defaultValue`). Vedi [TimeField](../elements/time-field.md).

### DatePicker

Una data scelta da un calendario che si apre dal trigger dell'app, come fa l'elenco di un select: un popup sui desktop, uno sheet sui telefoni. Il valore è nelle forme degli input HTML, una data ISO, `[start, end]` con `range` oppure una data e ora con `timePrecision` (un campo ora sotto il calendario), quello dell'app (`value`, `onChange`) o quello proprio del picker (`defaultValue`). I preset lo impostano, un pulsante di cancellazione lo azzera e ogni prop di `Calendar` viene inoltrata. Vedi [DatePicker](../elements/date-picker.md).

### Collapsible

Una regione il cui contenuto si espande e si comprime, senza aspetto: i suoi children sono sempre visibili (un riepilogo, il trigger), il suo `content` compare dopo di essi mentre `open`. L'app possiede `open` e il trigger che lo inverte, e lì comunica lo stato di espansione agli screen reader. Il contenuto viene creato una sola volta e conservato mentre è compresso, così ciò che contiene mantiene il proprio stato. Con `reveal` si apre e si chiude con un'altezza elastica, in modo nativo. Vedi [Collapsible](../elements/collapsible.md).

### Accordion

Sezioni impilate che si espandono e si comprimono sotto le loro intestazioni, senza aspetto: un `Accordion` di `AccordionItem`, ciascuno un `AccordionHeader` attorno al proprio `AccordionTrigger` e a un `AccordionPanel`. L'app possiede `value`, i valori degli elementi aperti, e imposta quello che `onChange` segnala quando si preme un trigger: un elemento alla volta, oppure più elementi con `multiple`. Gli screen reader sentono un gruppo di intestazioni i cui pulsanti dicono se il loro elemento è espanso, e ogni pannello aperto come una regione. Con `reveal` un pannello si apre e si chiude con un'altezza elastica, in modo nativo; con `keepMounted` il suo contenuto resta nell'albero mentre è chiuso. Vedi [Accordion](../elements/accordion.md).

### Avatar

L'immagine di una persona, senza aspetto: il fallback (le iniziali di `name`, oppure il `fallback` dell'app) e l'immagine sopra di esso, trasparente finché non è caricata, entrambi grandi quanto l'avatar, poi i children dell'app (un indicatore di presenza). Gli eventi di caricamento e di errore dell'immagine ne cambiano lo stato in modo nativo (`onStatusChange`), e `fallbackDelay` tiene nascosto il fallback mentre un'immagine si carica. Gli screen reader sentono un'immagine etichettata con il nome. Un `AvatarGroup` mostra i suoi primi `limit` avatar, non crea view per gli altri e mostra il suo `overflow` quando `total` ce ne sono altri. Vedi [Avatar](../elements/avatar.md).

### Progress

Una barra di avanzamento lineare, senza aspetto: una traccia con un indicatore al suo interno, largo `value` percento della larghezza della traccia. L'app possiede `value` (da 0 a 100) e `indeterminate`; gli screen reader ricevono il ruolo di barra di avanzamento, l'intervallo e il valore, e nessun valore quando è indeterminata, caso in cui larghezza e movimento dell'indicatore sono dell'app. Vedi [Progress](../elements/progress.md).

### NumberInput

Un numero digitato in un campo o incrementato a passi, senza aspetto: il campo (`Input`), il decremento prima di esso e l'incremento dopo di esso (o entrambi in colonna a destra, `controlsRight`). L'app possiede `value` (un numero o `null`; oppure l'input mantiene il proprio a partire da `defaultValue`) e riceve `onChange` con il numero che il campo legge. Il campo accetta un numero o il testo che porta a un numero, comprese cifre e segni di altre tastiere; i pulsanti, Su / Giù e Pagina su / Pagina giù lo incrementano di `step`, mantenendo i decimali, fino a `min` e `max`, e uscendo dal campo un valore digitato viene riportato entro tali limiti. Per gli screen reader il campo è uno spin button, i cui incremento e decremento lo modificano a passi. Vedi [NumberInput](../elements/number-input.md).

### Slider

Un valore, o un intervallo di due, scelto lungo una traccia, senza aspetto: una traccia che accetta pressioni e trascinamenti, l'indicatore al suo interno su cui si mappano i valori, l'intervallo e un thumb per ogni valore. L'app possiede `value` (un numero o `[start, end]`; oppure lo slider mantiene il proprio a partire da `defaultValue`) e riceve `onChange` per ogni nuovo valore, agganciato a `step` a partire da `min`, e `onChangeEnd` una volta per modifica; `scale` distribuisce i valori in modo lineare o per ordini di grandezza, `axis` dispone la traccia in orizzontale o in verticale. Ogni thumb è un elemento regolabile per gli screen reader con un proprio valore, è un punto di sosta del focus da tastiera e si muove con i tasti dello slider di WAI-ARIA. Vedi [Slider](../elements/slider.md).

### Scrollbar

Una barra di scorrimento dall'aspetto proprio dell'app per una scroll view o una lista, posizionata dove l'app vuole, senza aspetto: una traccia (`class` della barra) e un thumb al suo interno (`thumbClass`). Indica la sua scroll view (`scroll`, il suo `ref`) e ne segue offset, contenuto e viewport; il trascinamento del thumb fa scorrere il contenuto, una pressione sulla traccia porta lì il centro del thumb. `mode` la mostra mentre il contenuto scorre (e per `motion.idle` dopo), mentre il puntatore è sulla barra, oppure sempre; `axis` la rende orizzontale. `Scrollbar.setTheme` assegna a ogni scroll view e lista una barra dall'aspetto dell'app sopra la sua viewport, senza nulla da posizionare, e una view accetta un tema proprio come prop `scrollbar`. Vedi [Scrollbar](../elements/scrollbar.md).

### ColorPicker

Un selettore di colore senza aspetto: la root contiene il colore e le parti al suo interno lo mostrano e lo modificano, disposte dall'app. `ColorArea` è la saturazione e la luminosità di HSB, `ColorSlider` qualsiasi canale di RGB, HSL, HSB o OKLCH oppure l'alpha (orizzontale o verticale), `ColorField` il colore in qualsiasi forma CSS o il numero di un canale, `ColorSwatch` un preset che una pressione sceglie o un'anteprima del colore, `ColorEyeDropper` un pulsante che preleva un colore dallo schermo (macOS, il web). L'app possiede `value` (oppure il selettore mantiene il proprio a partire da `defaultValue`) e riceve `onChange` e `onChangeEnd` con il colore e il suo testo come lo scrive `format`; il selettore conserva i canali di ogni spazio come li ha impostati l'utente. I thumb sono elementi regolabili per gli screen reader e punti di sosta del focus da tastiera. Vedi [ColorPicker](../elements/color-picker.md).

### OtpInput

Un codice monouso numerico di lunghezza fissa, senza aspetto: un unico campo di testo nativo sopra le celle riceve la tastiera, così digitazione, incolla, tastierino numerico e compilazione automatica del codice del sistema sono della piattaforma, e gli screen reader trovano un solo campo di testo. Entrano solo cifre, fino a `length`; Backspace rimuove l'ultima. L'app possiede `value` (oppure fornisce `defaultValue`) e riceve `onChange` e `onComplete`; definisce lo stile delle celle (`focus:` su quella che riceve la cifra successiva, `data-filled:` su quelle che contengono una cifra), dei loro gruppi e del cursore. Vedi [OtpInput](../elements/otp-input.md).

### Pagination

Le pagine di un insieme tra cui spostarsi, un landmark di navigazione senza aspetto: Precedente, la prima e l'ultima pagina, quella corrente con le pagine vicine (`visiblePages`), i puntini di sospensione per ogni serie omessa, i children dell'app e Successivo; `compact` mantiene Precedente, i children e Successivo. L'app possiede `page` e riceve `onChange({ page })`; la pagina corrente è `selected:` ed è la pagina corrente per gli screen reader. L'app definisce lo stile degli elementi (`itemClass`) oppure li disegna (`renderItem`). Vedi [Pagination](../elements/pagination.md).

### Command

Una command palette: un campo di ricerca sopra i comandi dell'app (`items`: un `id`, un `label`, `keywords`, un `group`, un `shortcut` da mostrare, `disabled`, `checked`), filtrati in modo nativo mentre l'utente digita (l'etichetta o una parola chiave contiene la query, senza distinzione tra maiuscole e minuscole; le sezioni senza corrispondenze scompaiono), in una lista virtualizzata che crea solo le righe in vista. Su e Giù spostano l'evidenziazione, Invio o una pressione scelgono (`onSelect({ id })`), Esc cancella la query e poi segnala `onCancel`, dove l'app chiude un `Dialog` che la contiene. La query è dell'app (`query`, `onQueryChange`) o del campo stesso; con `filterable={false}` e `loading` l'app risponde da un server. L'app definisce lo stile di ogni parte (`itemClass` con `focus:` per l'evidenziazione, `checked:`, `disabled:`) e disegna le righe (`renderItem`, dato lo shortcut come mostrato qui). Vedi [Command](../elements/command.md).

### Tree

Elementi che contengono elementi: i file di un progetto, una sidebar di impostazioni, una struttura a indice. `items` è costituito da dati (`TreeItem`: un `id`, un `label`, `children`, `disabled`), e le righe sono virtualizzate: vengono create solo quelle in vista, e i figli di un elemento compresso non vengono mai creati, così un albero di migliaia di elementi resta veloce. L'app possiede gli id espansi e quello selezionato (`expanded`, `selected`, con `onExpandedChange` e `onSelectedChange`) oppure l'albero mantiene i propri (`defaultExpanded`, `defaultSelected`). Una pressione seleziona una riga ed espande o comprime una cartella; l'albero è un unico punto di sosta del focus da tastiera i cui tasti freccia spostano la selezione (Destra e Sinistra espandono, comprimono, entrano ed escono da una cartella), con Home, End, Invio, Spazio e typeahead. L'app definisce lo stile delle righe (`itemClass` con `selected:`, `aria-expanded:`, `focus:`) e le disegna (`renderItem`, dato il `depth` di ogni elemento). Vedi [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

Le parti con cui si costruiscono i grafici, come i `plot` di `gpui-base`, in un modulo a sé: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
sono chiavi verificate o funzioni di una riga), le scale `point`, `linear` o `band` dei suoi assi, la riga sotto il puntatore
(`onHoverChange`) e il suo movimento (`motion`: la comparsa, la dissolvenza e lo scorrimento dell'hover); i suoi marchi si disegnano in modo nativo a partire dalle
righe, senza JS per punto, e si dipingono con le proprietà di colore SVG (`stroke-*`, `fill-*`), `currentColor` dove nessuna
è impostata; un `Area` o un `Bar` mostra uno sfondo (un gradiente, `bg-linear-*`) all'interno delle sue forme. Le barre si dispongono
nelle bande di una scala `band`, affiancate o impilate in uno `stack`, crescono quando il plot appare e sfumano allontanandosi dalla riga
sotto il puntatore, con una parte `label` all'estremità di ogni barra. La linea a croce dell'hover, i punti (quelli propri di ogni marchio
con `hoverDotClass`) e il tooltip (`tooltipPlacement`, mantenuto dentro il plot) sono parti che l'app stila e riempie, spostate
in modo nativo; le etichette degli assi sono elementi propri dell'app. Un `Pie` divide il giro in una fetta per riga (una ciambella con un
`innerRadius`), ciascuna dipinta con le proprie classi (`sliceClass`, una funzione della sua riga), e un `Arc` disegna un settore
tra due angoli (la traccia e il valore di un indicatore); su un grafico a torta il plot segnala la fetta sotto il puntatore, che si solleva
(`hoverLift`) mentre le altre sfumano (`hoverDim`). Un `Sankey` disegna i flussi tra le righe (`links`), disposti come
li dispone d3-sankey, con ogni nodo e nastro dipinto con le proprie classi, i nodi etichettati, con hover e che si spostano verso nuovi flussi. Un `Treemap` dispone le righe a mosaico come una gerarchia di rettangoli
annidati (`id`, `parent`), con l'area di ogni foglia pari al suo `value`, colorata per categoria o lungo una rampa del
`colorScale` del plot, con le etichette mostrate dove entrano. Vedi [Plot](../elements/plot.md).

<a id="workspaces"></a>

## Spazi di lavoro

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup e ResizablePanel

Pannelli affiancati o impilati, con una maniglia tra ogni coppia che l'utente trascina per ripartire lo spazio. Il gruppo gestisce
il trascinamento, che avviene in modo nativo, i limiti di ogni pannello (`minSize`, `maxSize`) e il cursore di ridimensionamento; le dimensioni sono
dell'app (`size`, segnalate con `onResize`), così come l'aspetto delle maniglie e il contenuto dei pannelli. Vedi
[Resizable](../elements/resizable.md).

### DockArea

Uno spazio di lavoro ancorabile: pannelli in gruppi di schede, gruppi divisi affiancati o impilati, e dock sui bordi sinistro, destro e
inferiore. Il layout è un dato di proprietà dell'app (`layout`, segnalato con `onLayoutChange`); l'area gestisce il trascinamento e il rilascio delle schede, il ridimensionamento, i dock, lo zoom e il blocco, conserva il contenuto di ogni pannello quando si sposta, e presenta lo stesso layout con
drawer e un bottom sheet quando lo spazio è stretto. Le schede, le maniglie, l'indicatore di rilascio e il contenuto dei pannelli sono
dell'app. Vedi [Dock](../elements/dock.md).

<a id="documents"></a>

## Documenti

### TextView

`TextView` mostra un documento in Markdown, HTML o in blocchi costruiti dall'app, disegnato con gli elementi e le viste di [`Text`](../elements/text.md):
titoli, elenchi, codice, tabelle, immagini, formule, note a piè di pagina e la sintassi propria dell'app. È pensato per
le risposte delle chat AI che arrivano in streaming, con una tipografia di lettura nei colori del tema che l'app ristila parte per parte,
e funzioni di render che inseriscono il contenuto dell'app al loro posto. Vedi [TextView](../elements/text-view.md).

<a id="code"></a>

## Codice

### Editor

`Editor` è un editor di codice per più di cinquanta linguaggi: evidenziazione della sintassi, numeri di riga, più cursori, riduzione dei blocchi,
a capo automatico, trova e sostituisci, diagnostica e decorazioni, con i tasti degli editor di codice. Il testo è dell'app
(`value` e `onChange`), così come la barra di ricerca, che controlla il `search` dell'editor. Viene fornito con un aspetto costruito a partire dai
token del tema che l'app ristila parte per parte. Vedi [Editor](../elements/editor.md).

### DiffView

`DiffView` mostra le modifiche tra due testi, o dei file di una patch, come fanno gli strumenti di code review: affiancate o
unificate, con le parole modificate all'interno delle righe evidenziate, le righe invariate compresse in separatori espandibili, nei
colori di sintassi del `Editor`. Le azioni dell'app mantengono o annullano ogni modifica. Vedi [DiffView](../elements/diff-view.md).

### Table

`Table` e le sue parti dispongono poche righe che l'app scrive come figli, e offrono agli screen reader una tabella: gruppi di righe,
righe, intestazioni di colonna e celle. Ogni parte accetta l'aspetto dell'app. Vedi [Table](../elements/table.md).

### DataTable

`DataTable` mostra righe e colonne e scorre in entrambe le direzioni su un numero qualsiasi di entrambe, rendendo solo le celle in vista. Righe,
colonne o celle si selezionano; le colonne si ridimensionano, si spostano, restano fisse e si ordinano (l'ordinamento lo fa l'app); l'app fornisce le righe una pagina alla volta
e può disegnare celle e titoli. Vedi [DataTable](../elements/data-table.md).

<a id="navigation"></a>

## Navigazione

Un `NavStack` di `NavPage` è `UINavigationController` su iOS e uno stack con una toolbar e il back predittivo su
Android; su desktop e web ogni pagina mostra il `header` proprio dell'app. Vedi
[NavStack](../elements/nav-stack.md), che tratta anche `createNavStack` e l'uscita da una pagina.

### Dialog

`Dialog` presenta il contenuto sopra tutto il resto, compresa l'intestazione dello stack, in un proprio livello di finestra nativo. Il suo
popup e il suo sfondo sono stilati dall'app. Vedi [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## Alert dialog

### AlertDialog

`AlertDialog.show(options)` mostra l'alert o l'action sheet propri della piattaforma e si risolve con `{ action }`, il `id`
dell'azione scelta dall'utente. Vedi [AlertDialog](../elements/alert-dialog.md).

## Input

`Input` è l'input di testo nativo della piattaforma: un campo a riga singola o multiriga di cui la piattaforma gestisce digitazione, cursore, selezione,
correzione automatica e compilazione automatica. L'app gestisce il suo valore e il suo aspetto. Le sue props sono il tipo `InputProps` (con `IOSInputProps` per `ios={{…}}`), esportato accanto ad esso. Vedi [Input](../elements/input.md).

<a id="status-bar"></a>

## Barra di stato

La barra di stato appartiene a ciò che è sullo schermo, come in UIKit, dove ogni view controller dichiara il proprio
`preferredStatusBarStyle` e decide quello più in alto. In NSH le pagine e i dialog sono quei view controller: una
`NavPage` o un `Dialog` dichiara la barra di stato che desidera con `statusBar`, e l'app dichiara il proprio valore predefinito in
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

`statusBar` accetta questi campi, tutti opzionali (in Rust, un solo `StatusBarStyle`, oppure i metodi del builder di `StatusBarSetting`
con gli stessi nomi):

| Campo | Tipo | Descrizione |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | Il colore del contenuto (ora, batteria, segnale): `"light"` per sfondi scuri, `"dark"` per sfondi chiari, `"auto"` quello della piattaforma per l'aspetto corrente. |
| `hidden` | `boolean` | Nasconde la barra di stato. |
| `animated` | `boolean` | Anima il cambiamento quando la pagina o il dialog compare e scompare. |

Il valore è reattivo: `statusBar={{ foreground: dark() ? "light" : "dark" }}` segue il signal, così come una closure Rust
che ne legge uno.

<a id="which-one-applies"></a>

### Quale si applica

Decide la pagina o il dialog mostrato **più di recente**, **campo per campo**: una pagina aggiunta a uno stack sta sopra le pagine
sottostanti, e un dialog aperto sta sopra le pagine. Un campo che omette viene preso da quello sotto di essa, e in ultima istanza
dal valore predefinito dell'app. Quando la pagina viene rimossa o il dialog si chiude, si applica di nuovo quello sottostante.

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

### Il valore predefinito dell'app

`"statusBar"` di `nsh.json` è l'impostazione sotto ogni pagina e dialog, come lo sono `UIStatusBarStyle` e
`UIStatusBarHidden` di Info.plist in un'app UIKit:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

Entrambi i campi sono opzionali. Senza di esso il contenuto è `"auto"` e la barra viene mostrata. Le app iOS pacchettizzate la mostrano anche nella
schermata di avvio.

<a id="the-status-bar-on-each-platform"></a>

### La barra di stato su ogni piattaforma

- **iOS**: nascondere e mostrare si animano con una dissolvenza. In un'app [incorporata](../docs/ios.md) in una app nativa,
  è il view controller dell'app host a decidere l'aspetto della barra di stato. L'host applica l'impostazione di NSH restituendo
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` e
  `NshAppView.preferredStatusBarUpdateAnimation` dal proprio view controller.
- **Android**: le app disegnano da bordo a bordo, dietro la barra di stato (Android 15, API 35): lo sfondo dell'app è quello
  della barra, e `foreground` mantiene leggibile il suo contenuto.
- **Desktop e web**: la barra del titolo della finestra e le barre del browser sono del sistema e del browser;
  `statusBar` e `"statusBar"` di `nsh.json` sono pensati per i telefoni.

> [!IMPORTANT]
> Quando il tuo `nsh.json` dichiara `"capabilities"`, la barra di stato cambia solo se includono
> `"statusBar": true`; le altre modifiche vengono rifiutate e registrate nel log. Vedi
> [Sandbox e capability](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## Correlati

- [Guida alla navigazione](../docs/navigation.md).
- [Moduli e tastiera](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) e [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) e
  [Input](../elements/input.md).
- [Dispositivo e ambiente](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` e altre API solo per Android.
