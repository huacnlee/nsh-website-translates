---
title: "nsh/base"
description: "Componentes base sin estilos para la interfaz de usuario de una app: botones, enlaces, avatares, carruseles, casillas de verificación, botones de opción, interruptores, pestañas, botones de alternancia, barras de herramientas, árboles, selectores, comboboxes, paletas de comandos, calendarios, selectores de fecha, campos de hora, paneles redimensionables, espacios de trabajo acoplables, documentos Markdown y HTML, un editor de código, diffs, campos de texto, pilas de navegación y diálogos, diálogos de alerta del sistema y la barra de estado de páginas y diálogos."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---


# nsh/base

`nsh/base` es la capa de componentes base de la interfaz de una app: componentes sin estilo que se encargan del comportamiento, el estado, el foco y la accesibilidad, en todas las plataformas. Se sitúa entre las primitivas (`nsh`, `nsh/mobile` y `nsh/desktop`) y la biblioteca de componentes propia de la app, igual que `gpui-base` se sitúa entre `gpui` y una biblioteca con estilos en GPUI Kit (consulta [Módulos](./index.md#three-layers)). Ofrece controles (`Button`, `Link`, `Checkbox`, `ColorPicker` con su `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` y `ColorEyeDropper`, `NumberInput`, `Radio` en un `RadioGroup`, `Slider`, `Switch`, `Tab` en `Tabs`, `Toggle` en un `ToggleGroup`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), paletas de comandos (`Command`), barras de controles (`Toolbar` con sus `ToolbarGroup` y `ToolbarSeparator`), barras de desplazamiento con el aspecto propio de la app (`Scrollbar`), regiones que se expanden y se contraen (`Collapsible`, y `Accordion` con sus `AccordionItem`, `AccordionHeader`, `AccordionTrigger` y `AccordionPanel`), una barra de progreso (`Progress`), códigos de un solo uso (`OtpInput`), las páginas de un conjunto (`Pagination`), elementos que contienen elementos (`Tree`), las piezas con las que se construyen los gráficos (`Plot` con `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` y `Arc`, en `nsh/base/plot`), espacios de trabajo que organiza el usuario (`ResizablePanel`s en un `ResizablePanelGroup`, y las divisiones, los grupos de pestañas y los docks de `DockArea`), carruseles (`Carousel` y sus partes), documentos de Markdown o HTML (`TextView`), un editor de código (`Editor`), los cambios entre textos (`DiffView`) y tablas de filas y columnas (`Table` y sus partes, `DataTable`), campos de texto (`Input`), ventanas emergentes que se muestran sobre todo lo demás (`Popover`, `Menu` y `ContextMenu` con sus `MenuItem`, `MenuSeparator` y `Submenu`, `Tooltip`, `Sheet`), toasts (`Toast` en un `ToastStack`, su ciclo de vida en un `ToastManager`), navegación (un `NavStack` de `NavPage`s impulsado por el estado que creas con `createNavStack`, y `Dialog` para el contenido presentado sobre todo lo demás) y los diálogos de alerta del sistema (`AlertDialog`). Las páginas y los diálogos también deciden la barra de estado (`statusBar`).

El conjunto base incluye además `Avatar` y `AvatarGroup`: imágenes con estado de carga nativo y una fila que coloca sus primeros `limit` avatares.

El aspecto es el de la app: lo que va dentro de una página, un diálogo o una cabecera es tu propio JSX, construido a partir de las primitivas con estilos, clases de [Tailwind](../docs/tailwind.md) y tu tema, componentes Rust de [tu propio crate](../docs/rust.md), o una biblioteca de componentes que la comunidad construye sobre `nsh/base`. Todos los hosts sirven `nsh/base`; las apps Rust usan la misma API desde el crate `nsh-base` (`nsh_base::{button, dialog, …}`).

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

Esta página es el índice del módulo: cada componente tiene una página de elemento con sus ejemplos, props y notas de plataforma. Para ver guías paso a paso, consulta la [guía de navegación](../docs/navigation.md) y [Formularios y teclado](../docs/forms-and-keyboard.md).

| TSX | Rust | Qué es |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | Un elemento pulsable con los estados deshabilitado y seleccionado y un rol para lectores de pantalla. |
| [`Link`](../elements/link.md) | `link()` | Un elemento pulsable que lleva a algún sitio: abre su `href` a través del sistema, o la app lo abre (`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | La imagen de una persona, o un sustituto (las iniciales, el icono de la app) mientras carga, cuando falla y cuando no hay imagen; y una fila que muestra los primeros `limit` y un desbordamiento. El estado de carga es nativo. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | Un control marcado, desmarcado o indeterminado con un indicador que la app estiliza y marca. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | Una opción de un conjunto del que el usuario elige una, y el conjunto; la app decide cuál está marcada. |
| [`Switch`](../elements/switch.md) | `switch()` | Un control de activado / desactivado con un carril y un control deslizante que la app estiliza. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | Una pestaña de una lista de pestañas, y la lista; la app decide cuál está seleccionada y muestra su contenido. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | Un botón que está activado o desactivado, y una barra de herramientas con ellos; la app decide cuáles están pulsados. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | Una barra de botones, interruptores y enlaces: una sola parada del foco de teclado cuyas teclas de flecha se mueven a lo largo de ella; grupos de elementos relacionados y líneas entre ellos. |
| [`Carousel`](../elements/carousel.md) y sus partes | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | Diapositivas que se muestran de una en una sobre el desplazamiento propio de la plataforma, con anterior / siguiente, una paginación, las teclas y un bucle continuo; la app decide `index`. |
| [`Select`](../elements/select.md) | `select()` | Un valor de una lista de elementos: una ventana emergente junto al disparador en escritorio, una hoja en teléfonos; la app decide `value` y dibuja el disparador. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | Un valor o varios (`multiple`) de una lista de elementos filtrada al escribir en su campo; la app decide `value` y estiliza el campo. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | Una fecha o un intervalo de fechas elegido entre meses de días, con vistas de mes y de año y el teclado; la app decide `value` y dibuja los elementos. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | Una hora del día que se edita segmento a segmento (hora, minuto, segundo, AM/PM); la app decide `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | Una fecha, un intervalo o una fecha y hora desde un calendario en una ventana emergente junto al disparador en escritorio, una hoja en teléfonos; la app decide `value` y dibuja el disparador. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | Una región cuyo contenido se expande y se contrae; la app decide `open` y su disparador. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | Secciones apiladas que se expanden y se contraen bajo sus encabezados, de una en una o varias (`multiple`); la app decide `value`, los elementos abiertos. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | Un código de un solo uso en celdas que la app estiliza; la app decide `value`, `onComplete` indica cuándo está completo. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | Las páginas de un conjunto: Anterior, las páginas alrededor de la actual con puntos suspensivos, los hijos de la app y Siguiente; la app decide `page`. |
| [`Command`](../elements/command.md) | `command()` | Una paleta de comandos: un campo de búsqueda sobre los comandos de la app, filtrados de forma nativa por etiqueta y palabras clave, en una lista virtualizada; Return o una pulsación eligen (`onSelect`), en un `Dialog` para una paleta Cmd+K. |
| [`Tree`](../elements/tree.md) | `tree()` | Elementos que contienen elementos, virtualizados: expandidos y contraídos, uno seleccionado, una sola parada del foco de teclado; la app decide `expanded` y `selected` o el árbol mantiene los suyos. |
| [`Progress`](../elements/progress.md) | `progress()` | Una barra de progreso; la app decide `value` (de 0 a 100) y `indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | Un número escrito en un campo o ajustado con botones y teclas; la app decide `value` (o el campo mantiene el suyo a partir de `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | Una barra de desplazamiento con el aspecto propio de la app para la vista de desplazamiento o la lista que nombra (`scroll`); su control deslizante sigue el contenido y sus arrastres y pulsaciones lo desplazan. |
| [`Slider`](../elements/slider.md) | `slider()` | Un valor, o un intervalo de dos, elegido a lo largo de un carril; la app decide `value` (o el control mantiene el suyo a partir de `defaultValue`). |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | Un selector de color y sus partes: un área de saturación y brillo, deslizadores de cualquier canal de RGB, HSL, HSB u OKLCH y del alfa, campos del color o de un canal, muestras, un cuentagotas; la app decide `value` (o el selector mantiene el suyo a partir de `defaultValue`). |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | Paneles en paralelo o apilados, con tiradores que el usuario arrastra para redimensionarlos. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | Un espacio de trabajo de divisiones, grupos de pestañas y docks de borde que organiza el usuario; su diseño son datos de la app. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | Una pila de navegación nativa y sus páginas. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | Contenido presentado sobre todo lo demás: hojas, flujos a pantalla completa, diálogos. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | La alerta o la hoja de acciones de la plataforma. |
| [`TextView`](../elements/text-view.md) | `text_view()` | Un documento de Markdown, HTML o bloques, dibujado con textos y vistas, para respuestas de IA transmitidas en streaming. |
| [`Editor`](../elements/editor.md) | `editor()` | Un editor de código: resaltado de sintaxis, varios cursores, plegado, buscar y reemplazar, diagnósticos. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | Los cambios entre dos textos o de un parche, en paralelo o unificados, con acciones por cambio. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | Una tabla con las filas y celdas propias de la app, con los roles de una tabla para lectores de pantalla. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | Una tabla de cualquier número de filas y columnas: selección, ordenación, columnas fijas, redimensionables y movibles, filas servidas página a página. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | El campo de texto nativo de la plataforma, de una línea o de varias. |
| [`Popover`](../elements/popover.md) | `popover()` | Contenido anclado a un disparador, sobre todo lo demás. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | Una vista previa de lo que señala su disparador, mientras el puntero se detiene sobre él (una pulsación en pantallas táctiles). |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | Menús: ventanas emergentes con submenús en cascada en escritorio, hojas en teléfonos; elementos marcables y opciones de una sola elección. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | Una pista junto a su disparador. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | Un panel en un borde de la pantalla sobre un fondo. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | Toasts sin estilo: una raíz semántica, una pila de capas, su ciclo de vida. |
| `statusBar` en páginas y diálogos | `.status_bar(..)` | La barra de estado mientras hay una página o un diálogo visible. Consulta [Barra de estado](#status-bar). |

En Rust, `theme()` lee el tema de la app como tokens de diseño (`theme().primary`, `theme().radius`), los mismos tokens que usan las [clases de tema](../docs/tailwind.md#theme-tokens) de TSX.

<a id="controls"></a>

## Controles

### Button

Un elemento pulsable que se encarga de su comportamiento y no tiene aspecto: pulsaciones, los estados deshabilitado y seleccionado y su rol para lectores de pantalla. Su aspecto son los `class` y `style` de la app con variantes de estado, y su contenido son sus hijos. Consulta [Button](../elements/button.md).

### Link

Un elemento pulsable que lleva a algún sitio y no tiene aspecto: pulsaciones, Return y Espacio mientras tiene el foco de teclado, el estado deshabilitado, el rol de enlace para lectores de pantalla y la página actual de una navegación (`current`). `href` es el destino, nunca se muestra: una pulsación lo notifica (`onOpen`) y después abre una página web o el enlace de otra app fuera de la app o, con `openWith="app"`, deja la apertura a las rutas propias de la app. Consulta [Link](../elements/link.md).

### Checkbox

Un control marcado, desmarcado o indeterminado que se encarga de su comportamiento y no tiene aspecto: pulsaciones, activación por teclado, el estado deshabilitado y el rol y el valor de casilla de verificación para lectores de pantalla (mixto mientras es indeterminado), con el valor en manos de la app (`checked`, `indeterminate`, `onChange`). La app estiliza la casilla y su indicador, cuyas clases `checked:`, `indeterminate:` y `disabled:` siguen a la casilla, y coloca su propia marca en el indicador (`indicator`). Consulta [Checkbox](../elements/checkbox.md).

<a id="radio-and-radiogroup"></a>

### Radio y RadioGroup

Una opción de un conjunto del que el usuario elige exactamente una, y el conjunto que las rodea. Un radio se encarga de su comportamiento y no tiene aspecto: pulsaciones, activación por teclado, el estado deshabilitado y el rol de radio y el estado marcado para lectores de pantalla. El grupo es el grupo de radios que anuncian los lectores de pantalla y no guarda ningún valor: la app indica a cada radio si está marcado (`checked`), y una pulsación sobre uno sin marcar lo solicita (`onChange`). El indicador y la etiqueta de la app son los hijos del radio, cuyas clases `group-checked:` lo siguen. Consulta [Radio](../elements/radio.md).

### Switch

Un control de activado / desactivado que se encarga de su comportamiento y no tiene aspecto: pulsaciones, activación por teclado, el estado deshabilitado y el rol y el valor de interruptor para lectores de pantalla, con el valor en manos de la app (`checked`, `onChange`). La app estiliza el interruptor, su carril y su control deslizante, cuyas clases `checked:` y `disabled:` siguen al interruptor. Consulta [Switch](../elements/switch.md).

<a id="tab-and-tabs"></a>

### Tab y Tabs

Las pestañas de una lista de pestañas y la lista que las rodea. Una pestaña se encarga de su comportamiento y no tiene aspecto: pulsaciones, activación por teclado, el estado deshabilitado y el rol de pestaña y el estado seleccionado para lectores de pantalla. La lista es la lista de pestañas que anuncian los lectores de pantalla y no guarda ningún valor: la app indica a cada pestaña si está seleccionada (`selected`), escucha las pulsaciones (`onPress`) y muestra ella misma el contenido de la sección seleccionada. La etiqueta de la app son los hijos de la pestaña, cuyas clases `group-selected:` la siguen. El indicador de la lista (`indicatorClass`, `indicatorStyle`), un subrayado o una píldora que la app estiliza, se sitúa sobre la pestaña seleccionada y salta de forma nativa a la siguiente. Consulta [Tabs](../elements/tabs.md).
### Carousel

Diapositivas que se muestran de una en una (las fotos de un producto, un onboarding, un banner, una fila de tarjetas). El contenido es una vista de desplazamiento nativa que se ajusta al inicio de cada diapositiva, de modo que un dedo, la rueda y el touchpad las mueven en el mismo fotograma que el puntero; cuando se detiene, el carrusel informa de la diapositiva con `onChange`. Anterior y siguiente (`CarouselPrevious`, `CarouselNext`), la paginación (los `CarouselPaginationItem` dentro de un `CarouselPagination`, con un indicador que se desplaza con efecto de resorte hasta la diapositiva mostrada) y las teclas de flecha la mueven de forma nativa, dando la vuelta en los extremos sin saltos con `looping`. La diapositiva mostrada es el `index` de la app, que el propio temporizador de la app avanza en las diapositivas que pasan solas (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` indican cuándo esperar); el aspecto y cada etiqueta son de la app. Consulta [Carousel](../elements/carousel.md).

<a id="toggle-and-togglegroup"></a>

### Toggle y ToggleGroup

Un botón que está activado o desactivado (negrita, un favorito, una opción de vista) y una barra de herramientas de ellos. Un toggle se encarga de su comportamiento y no tiene aspecto: pulsaciones, activación por teclado, estado deshabilitado y el rol de botón con su estado de pulsado para los lectores de pantalla. El grupo es la barra de herramientas que anuncian los lectores de pantalla, una sola parada del foco del teclado cuyas teclas de flecha se mueven entre sus toggles sin pulsarlos, y no guarda ningún valor: la app indica a cada toggle si está pulsado (`pressed`), recibe el valor que pide (`onChange`) y mantiene cualquier número de toggles pulsados o exactamente uno. `disabled` en el grupo deshabilita todos los toggles que contiene. El icono o la etiqueta de la app son los hijos del toggle, y las clases `group-aria-pressed:` los siguen. Consulta [Toggle](../elements/toggle.md).

<a id="toolbar-toolbargroup-and-toolbarseparator"></a>

### Toolbar, ToolbarGroup y ToolbarSeparator

Una barra de controles: el formato de un editor de texto, el transporte de un reproductor multimedia, una paleta vertical de herramientas. La barra de herramientas es la que anuncian los lectores de pantalla (con el nombre dado por `accessibilityLabel`) y una sola parada del foco del teclado sobre los `Button`, `Toggle` y `Link` que contiene: Tab entra por el elemento que dejó por última vez, las flechas de su `axis` se mueven a lo largo de ella, y Inicio y Fin saltan a sus extremos, sin pulsar nada. Un `ToolbarGroup` es una serie con nombre de elementos relacionados (deshacer y rehacer, una alineación), y un `ToggleGroup` dentro de una toolbar es uno de sus grupos, cuyos toggles son los elementos de la toolbar. Un `ToolbarSeparator` es una línea que la app dibuja entre series. `disabled` en la toolbar o en un grupo deshabilita todos los elementos que contiene. La toolbar no guarda ningún valor y no tiene aspecto: cada control conserva su propio estado, y la app da estilo a la barra, a sus grupos y a sus separadores. Consulta [Toolbar](../elements/toolbar.md).

### Select

Un valor elegido de una lista de elementos dada como datos (`items`: un valor y un título cada uno, opcionalmente deshabilitado o dentro de una sección), sin aspecto. El disparador de la app abre la lista: un popup junto al disparador en los equipos de escritorio, una hoja en la parte inferior en teléfonos y tablets. El select se encarga del teclado (Arriba, Abajo, Inicio, Fin, Re Pág y Av Pág, escritura predictiva, Return y Escape), de la búsqueda (`searchable`), de la fila resaltada (`focus:` en `itemClass`; `renderItem` recibe lo que es un elemento, nunca su estado) y de los roles combobox, listbox y option para los lectores de pantalla. La app es dueña del valor (`value`, `onChange`) o se lo deja al select (`defaultValue`), y da estilo a cada parte o dibuja las filas. Consulta [Select](../elements/select.md).

### Combobox

Valores elegidos de una lista de elementos, como la lista de un select, filtrada al escribir en el campo de entrada del combobox, sin aspecto: uno solo o, con `multiple`, varios; una elección entonces
alterna el elemento mientras la lista sigue abierta. El valor es un array del que es dueña la app (`value`, `onChange`) o que se deja al combobox (`defaultValue`); `onConfirm` lo comunica cuando la lista se cierra. La consulta puede ser de la app (`query`, `onQueryChange`), un pie se muestra debajo de las filas y un botón de borrado vacía el valor. Consulta
[Combobox](../elements/combobox.md).

### Calendar

Una fecha, o con `range` un rango de fechas, elegida entre meses de días, sin aspecto. Se muestran uno o varios meses (`numberOfMonths`) en paralelo; la cabecera los hace avanzar y abre una vista de los meses o una página de años. El valor es una fecha ISO (`"2026-10-28"`) o `[start, end]` del que es dueña la app (`value`, `onChange`) o que se deja al calendar (`defaultValue`); `disabledMatcher` impide que se elijan días, y los días reciben el teclado como una sola parada de Tab. La app da estilo a las partes y dibuja los elementos (`renderItem`, dado lo que es un elemento; sus estados son sus clases, los días de un rango `selected:` con `data-range-start:`, `data-range-middle:` y `data-range-end:`). Consulta
[Calendar](../elements/calendar.md).

### TimeField

Una hora del día editada por segmentos, sin aspecto: la hora, el minuto, el segundo (`precision`) y AM/PM (`hourCycle="h12"`), mediante incrementos, escribiendo o con el teclado numérico de un teléfono. El valor es `"HH:MM"` (`"HH:MM:SS"`) en un reloj de 24 horas, el de la app (`value`, `onChange`) o el propio del campo (`defaultValue`). Consulta
[TimeField](../elements/time-field.md).

### DatePicker

Una fecha elegida en un calendario que se abre desde el disparador de la app, como lo hace la lista de un select: un popup en escritorio, una hoja en teléfonos. El valor tiene las formas de los inputs HTML: una fecha ISO, `[start, end]` con `range` o una fecha y hora con `timePrecision` (un campo de hora bajo el calendario), el de la app (`value`, `onChange`) o el propio del picker (`defaultValue`). Los preajustes lo establecen, un botón de borrado lo borra y todas las props de `Calendar` se transmiten. Consulta
[DatePicker](../elements/date-picker.md).

### Collapsible

Una región cuyo contenido se expande y se contrae, sin aspecto: sus hijos se muestran siempre (un resumen, el disparador), su `content` después de ellos mientras `open`. La app es dueña de `open` y del disparador que lo cambia, y comunica allí el estado expandido a los lectores de pantalla. El contenido se crea una sola vez y se conserva mientras está contraído, de modo que lo que hay dentro mantiene su estado. Con `reveal` se abre y se cierra con una altura con efecto de resorte, de forma nativa. Consulta [Collapsible](../elements/collapsible.md).

### Accordion

Secciones apiladas que se expanden y se contraen bajo sus encabezados, sin aspecto: un `Accordion` de `AccordionItem`, cada uno un `AccordionHeader` que rodea su `AccordionTrigger` y un `AccordionPanel`. La app es dueña de `value`, los valores de los elementos abiertos, y establece el que `onChange` informa cuando se pulsa un disparador: un elemento a la vez, o varios con `multiple`. Los lectores de pantalla oyen un grupo de encabezados cuyos botones indican si su elemento está expandido, y cada panel abierto como una región. Con `reveal` un panel se abre y se cierra con una altura con efecto de resorte, de forma nativa; con `keepMounted` su contenido permanece en el árbol mientras está cerrado. Consulta [Accordion](../elements/accordion.md).

### Avatar

La imagen de una persona, sin aspecto: el contenido alternativo (las iniciales de `name`, o el `fallback` de la app) y la imagen encima, transparente hasta que se ha cargado, ambos tan grandes como el avatar, y después los hijos de la app (un punto de presencia). Los eventos de carga y de error de la propia imagen cambian su estado de forma nativa (`onStatusChange`), y `fallbackDelay` mantiene oculto el contenido alternativo mientras se carga una imagen. Los lectores de pantalla oyen una imagen etiquetada con el nombre. Un `AvatarGroup` muestra sus primeros `limit` avatares, no crea vistas para los demás y muestra su `overflow` mientras `total` sea mayor. Consulta
[Avatar](../elements/avatar.md).

### Progress

Una barra de progreso lineal, sin aspecto: una pista con un indicador dentro, cuyo ancho es el `value` por ciento del ancho de la pista. La app es dueña de `value` (de 0 a 100) y de `indeterminate`; los lectores de pantalla reciben el rol de barra de progreso, el rango y el valor, y ningún valor mientras es indeterminada, cuando el ancho y el movimiento del indicador son de la app. Consulta [Progress](../elements/progress.md).

### NumberInput

Un número escrito en un campo o ajustado con pasos, sin aspecto: el campo (`Input`), el decremento antes de él y el incremento después (o ambos en una columna a la derecha, `controlsRight`). La app es dueña de `value` (un número o `null`; o el input conserva el suyo a partir de `defaultValue`) y recibe `onChange` con el número que el campo interpreta. El campo acepta un número o el texto que lleva a uno, incluidos dígitos y signos de otros teclados; los botones, Arriba / Abajo y Re Pág / Av Pág lo ajustan en pasos de `step`, conservando los decimales, hasta `min` y `max`, y al salir del campo un valor escrito se ajusta a ellos. El campo es un spin button para los lectores de pantalla, cuyo incremento y decremento lo ajustan. Consulta
[NumberInput](../elements/number-input.md).

### Slider

Un valor, o un rango de dos, elegido a lo largo de una pista, sin aspecto: una pista que admite pulsaciones y arrastres, el indicador dentro de ella sobre el que se proyectan los valores, el rango y un thumb por valor sobre ella. La app es dueña de `value` (un número o `[start, end]`; o el slider conserva el suyo a partir de `defaultValue`) y recibe `onChange` por cada nuevo valor, ajustado a `step` desde `min`, y `onChangeEnd` una vez por cambio; `scale` reparte los valores de forma lineal o por órdenes de magnitud, `axis` coloca la pista en horizontal o en vertical. Cada thumb es un elemento ajustable para los lectores de pantalla con su propio valor, una parada del foco del teclado, y se mueve con las teclas de slider de WAI-ARIA. Consulta [Slider](../elements/slider.md).

### Scrollbar

Una barra de desplazamiento con el aspecto propio de la app para una vista de desplazamiento o una lista, colocada donde la app quiera, sin aspecto: una pista (el `class` de la barra) y un thumb dentro de ella (`thumbClass`). Nombra su vista de desplazamiento (`scroll`, su `ref`) y sigue su desplazamiento, su contenido y su área visible; arrastrar el thumb desplaza el contenido, y una pulsación en la pista lleva allí el centro del thumb. `mode` la muestra mientras el contenido se desplaza (hasta `motion.idle` después), mientras el puntero está sobre la barra, o siempre; `axis` la hace horizontal. `Scrollbar.setTheme` da a cada vista de desplazamiento y lista una barra con el aspecto de la app sobre su área visible, sin nada que colocar, y una vista admite un tema propio mediante su prop `scrollbar`. Consulta
[Scrollbar](../elements/scrollbar.md).

### ColorPicker

Un selector de color sin aspecto: la raíz guarda el color y las partes que contiene lo muestran y lo cambian, dispuestas por la app. `ColorArea` es la saturación y el brillo de HSB, `ColorSlider` cualquier canal de RGB, HSL, HSB u OKLCH o el alfa (horizontal o vertical), `ColorField` el color en cualquier forma CSS o el número de un canal, `ColorSwatch` un preajuste que elige una pulsación o una vista previa del color, `ColorEyeDropper` un botón que elige un color de la pantalla (macOS, la web). La app es dueña de `value` (o el picker conserva el suyo a partir de `defaultValue`) y recibe `onChange` y `onChangeEnd` con el color y su texto tal como lo escribe `format`; el picker conserva los canales de cada espacio tal como los fijó el usuario. Los thumbs son elementos ajustables para los lectores de pantalla y paradas del foco del teclado.
Consulta [ColorPicker](../elements/color-picker.md).

### OtpInput

Un código numérico de un solo uso de longitud fija, sin aspecto: un único campo de texto nativo sobre las celdas recibe el teclado, de modo que escribir, pegar, el teclado numérico y el autocompletado de códigos del sistema son los de la plataforma, y los lectores de pantalla encuentran un solo campo de texto. Solo entran dígitos, hasta `length`; Retroceso elimina el último. La app es dueña de `value` (o proporciona `defaultValue`) y recibe `onChange` y `onComplete`; da estilo a las celdas (`focus:` en la que recibe el siguiente dígito, `data-filled:` en las que contienen un dígito), a sus grupos y al cursor. Consulta [OtpInput](../elements/otp-input.md).

### Pagination

Las páginas de un conjunto entre las que moverse, un landmark de navegación sin aspecto: Anterior, la primera y la última página, la actual con sus vecinas (`visiblePages`), unos puntos suspensivos por cada tramo omitido, los hijos de la app y Siguiente; `compact` conserva Anterior, los hijos y Siguiente. La app es dueña de `page` y recibe `onChange({ page })`; la página actual es `selected:` y la página actual para los lectores de pantalla. La app da estilo a los elementos (`itemClass`) o los dibuja (`renderItem`). Consulta [Pagination](../elements/pagination.md).

### Command

Una paleta de comandos: un campo de búsqueda sobre los comandos de la app (`items`: un `id`, un `label`, `keywords`, un `group`, un `shortcut` que mostrar, `disabled`, `checked`), filtrados de forma nativa mientras el usuario escribe (la etiqueta o una palabra clave contiene la consulta, sin distinguir mayúsculas; las secciones sin coincidencias desaparecen), en una lista virtualizada que crea solo las filas visibles. Arriba y Abajo mueven el resaltado, Return o una pulsación eligen (`onSelect({ id })`), Escape borra la consulta y después informa de `onCancel`, donde la app cierra un `Dialog` que lo rodea. La consulta es de la app (`query`, `onQueryChange`) o del propio campo; con `filterable={false}` y `loading` la app la responde desde un servidor. La app da estilo a cada parte (`itemClass` con `focus:` para el resaltado, `checked:`, `disabled:`) y dibuja las filas (`renderItem`, dado el atajo tal como se muestra aquí). Consulta [Command](../elements/command.md).

### Tree

Elementos que contienen elementos: los archivos de un proyecto, una barra lateral de ajustes, un esquema. `items` son datos (`TreeItem`: un `id`, un `label`, `children`, `disabled`), y las filas están virtualizadas: solo se crean las visibles, y nunca las de los hijos de un elemento contraído, de modo que un árbol de miles de elementos sigue siendo rápido. La app es dueña de los ids expandidos y del seleccionado (`expanded`, `selected`, con `onExpandedChange` y `onSelectedChange`) o el tree conserva los suyos (`defaultExpanded`, `defaultSelected`). Una pulsación selecciona una fila y expande o contrae una carpeta; el tree es una sola parada del foco del teclado cuyas teclas de flecha mueven la selección (Derecha e Izquierda expanden, contraen, entran en una carpeta y salen de ella), con Inicio, Fin, Return, Espacio y escritura predictiva. La app da estilo a las filas (`itemClass` con `selected:`, `aria-expanded:`, `focus:`) y las dibuja (`renderItem`, dado el `depth` de cada elemento). Consulta [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

Las partes con las que se construyen los gráficos, como `gpui-base` de `plot`, en un módulo propio: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"``. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
son claves comprobadas o funciones de una fila), las escalas `point`, `linear` o `band` de sus ejes, la fila bajo el puntero
(`onHoverChange`) y su movimiento (`motion`: la aparición, el desvanecimiento y el deslizamiento del hover); sus marcas se dibujan de forma nativa a partir de las
filas, sin JS por punto, y se pintan con las propiedades de pintura de SVG (`stroke-*`, `fill-*`), `currentColor` donde no hay ninguna
definida; un `Area` o un `Bar` muestra un fondo (un degradado, `bg-linear-*`) dentro de sus formas. Las barras se sitúan en las
bandas de una escala `band`, una junto a otra o apiladas en un `stack`, crecen al aparecer el gráfico y se desvanecen respecto de la fila
bajo el puntero, con una parte `label` al final de cada barra. La línea cruzada del hover, los puntos (los de cada marca
con `hoverDotClass`) y el tooltip (`tooltipPlacement`, mantenido dentro del gráfico) son partes que la app estiliza y rellena, y que se mueven
de forma nativa; las etiquetas de los ejes son elementos propios de la app. Un `Pie` divide la circunferencia en una porción por fila (un donut con un
`innerRadius`), cada una pintada con sus propias clases (`sliceClass`, una función de su fila), y un `Arc` dibuja un sector
entre dos ángulos (la pista y el valor de un indicador); sobre un gráfico circular, el gráfico informa de la porción bajo el puntero, que se eleva
(`hoverLift`) mientras las demás se desvanecen (`hoverDim`). Un `Sankey` dibuja flujos entre las filas (`links`), dispuestos como
los dispone d3-sankey, con cada nodo y cinta pintados con sus propias clases, sus nodos etiquetados, con hover y que se mueven hacia nuevos flujos. Un `Treemap` divide las filas en mosaico como una jerarquía de rectángulos
anidados (`id`, `parent`), donde el área de cada hoja es su `value`, coloreada por categoría o a lo largo de una rampa del
`colorScale` del gráfico, con sus etiquetas mostradas donde caben. Consulta [Plot](../elements/plot.md).

<a id="workspaces"></a>

## Espacios de trabajo

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup y ResizablePanel

Paneles uno junto a otro o apilados, con un tirador entre cada dos que el usuario arrastra para repartir el espacio. El grupo se encarga
del arrastre, que se ejecuta de forma nativa, de los límites de cada panel (`minSize`, `maxSize`) y del cursor de redimensionado; los tamaños son de la
app (`size`, notificados con `onResize`), y también lo son el aspecto de los tiradores y el contenido de los paneles. Consulta
[Resizable](../elements/resizable.md).

### DockArea

Un espacio de trabajo acoplable: paneles en grupos de pestañas, grupos divididos uno junto a otro o apilados, y docks en los bordes izquierdo, derecho e
inferior. El diseño son datos que posee la app (`layout`, notificados con `onLayoutChange`); el área se encarga de arrastrar y soltar pestañas, del redimensionado, de los docks, del zoom y del bloqueo, conserva el contenido de cada panel cuando se mueve, y presenta el mismo diseño con
cajones y una hoja inferior cuando el espacio es estrecho. Las pestañas, los tiradores, el indicador de colocación y el contenido de los paneles son
de la app. Consulta [Dock](../elements/dock.md).

<a id="documents"></a>

## Documentos

### TextView

`TextView` muestra un documento de Markdown, HTML o bloques que construye la app, dibujado con elementos y vistas de [`Text`](../elements/text.md): encabezados, listas, código, tablas, imágenes, fórmulas, notas al pie y la sintaxis propia de la app. Está pensado para
respuestas de chat de IA que llegan en streaming, con una tipografía de lectura en los colores del tema que la app reestiliza parte por parte,
y funciones de renderizado que colocan el contenido de la app en su sitio. Consulta [TextView](../elements/text-view.md).

<a id="code"></a>

## Código

### Editor

`Editor` es un editor de código para más de cincuenta lenguajes: resaltado de sintaxis, números de línea, varios cursores, plegado,
ajuste de línea, buscar y reemplazar, diagnósticos y decoraciones, con los atajos de los editores de código. El texto es de la app
(`value` y `onChange`), y también lo es la barra de búsqueda, que controla el `search` del editor. Incluye un aspecto construido a partir de
los tokens del tema que la app reestiliza parte por parte. Consulta [Editor](../elements/editor.md).

### DiffView

`DiffView` muestra los cambios entre dos textos, o de los archivos de un parche, como lo hacen las herramientas de revisión de código: en paralelo o
unificado, con las palabras modificadas dentro de las líneas resaltadas, las líneas sin cambios colapsadas en separadores que se expanden, con los
colores de sintaxis de `Editor`. Las acciones de la app conservan o revierten cada cambio. Consulta [DiffView](../elements/diff-view.md).

### Table

`Table` y sus partes disponen unas pocas filas que la app escribe como hijos, y ofrecen una tabla a los lectores de pantalla: grupos de filas,
filas, encabezados de columna y celdas. Cada parte adopta el aspecto de la app. Consulta [Table](../elements/table.md).

### DataTable

`DataTable` muestra filas y columnas y se desplaza en ambas direcciones sobre cualquier cantidad de unas y otras, renderizando solo las celdas visibles. Las filas,
columnas o celdas se seleccionan; las columnas se redimensionan, se mueven, se fijan y se ordenan (la app ordena); la app sirve las filas página a página
y puede dibujar celdas y títulos. Consulta [DataTable](../elements/data-table.md).

<a id="navigation"></a>

## Navegación

Un `NavStack` de `NavPage`s es `UINavigationController` en iOS y una pila con barra de herramientas y retroceso predictivo en
Android; en los escritorios y en la web cada página muestra el `header` propio de la app. Consulta
[NavStack](../elements/nav-stack.md), que también cubre `createNavStack` y la salida de una página.

### Dialog

`Dialog` presenta contenido por encima de todo lo demás, incluido el encabezado de la pila, en su propia capa de ventana nativa. Su
popup y su fondo los estiliza la app. Consulta [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## Diálogos de alerta

### AlertDialog

`AlertDialog.show(options)` muestra la alerta o la hoja de acciones propia de la plataforma y se resuelve con `{ action }`, el `id`
de la acción que eligió el usuario. Consulta [AlertDialog](../elements/alert-dialog.md).

<a id="input"></a>

## Entrada

`Input` es la entrada de texto nativa de la plataforma: un campo de una o varias líneas cuya escritura, cursor, selección,
autocorrección y autocompletado gestiona la plataforma. La app posee su valor y su aspecto. Sus props son el tipo `InputProps` (con `IOSInputProps` para `ios={{…}}`), exportado junto a él. Consulta [Input](../elements/input.md).

<a id="status-bar"></a>

## Barra de estado

La barra de estado pertenece a lo que hay en pantalla, como en UIKit, donde cada view controller declara su
`preferredStatusBarStyle` y decide el que está más arriba. En NSH las páginas y los diálogos son esos view controllers: un
`NavPage` o un `Dialog` declara la barra de estado que quiere con `statusBar`, y la app declara la suya por defecto en
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

`statusBar` acepta estos campos, todos opcionales (en Rust, un `StatusBarStyle` solo, o los métodos del builder de `StatusBarSetting`
con los mismos nombres):

| Campo | Tipo | Descripción |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | El color del contenido (hora, batería, señal): `"light"` para fondos oscuros, `"dark"` para fondos claros, `"auto"` el de la plataforma para la apariencia actual. |
| `hidden` | `boolean` | Oculta la barra de estado. |
| `animated` | `boolean` | Anima el cambio cuando la página o el diálogo aparece y desaparece. |

El valor es reactivo: `statusBar={{ foreground: dark() ? "light" : "dark" }}` sigue la señal, igual que un closure de Rust
que lee una.

<a id="which-one-applies"></a>

### Cuál se aplica

La página o el diálogo mostrado **más recientemente** decide, **campo por campo**: una página apilada sobre una pila está por encima de las páginas
inferiores, y un diálogo abierto está por encima de las páginas. Un campo que omite proviene del que está debajo, y al final
del valor por defecto de la app. Cuando la página se desapila o el diálogo se cierra, vuelve a aplicarse el que está debajo.

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

### El valor por defecto de la app

`"statusBar"` de `nsh.json` es el ajuste que hay bajo cada página y diálogo, igual que `UIStatusBarStyle` y
`UIStatusBarHidden` de Info.plist en una app de UIKit:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

Ambos campos son opcionales. Sin él, el contenido es `"auto"` y la barra se muestra. Las apps de iOS empaquetadas también la muestran en la
pantalla de inicio.

<a id="the-status-bar-on-each-platform"></a>

### La barra de estado en cada plataforma

- **iOS**: ocultar y mostrar se animan con un fundido. En una app [embebida](../docs/ios.md) en una nativa,
  el view controller de la app anfitriona decide el aspecto de la barra de estado. El anfitrión aplica el ajuste de NSH devolviendo
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` y
  `NshAppView.preferredStatusBarUpdateAnimation` desde su view controller.
- **Android**: las apps dibujan de borde a borde, detrás de la barra de estado (Android 15, API 35): el fondo propio de la app es el
  de la barra, y `foreground` mantiene su contenido legible sobre él.
- **Escritorios y web**: la barra de título de la ventana y las barras del navegador son del sistema y del navegador;
  `statusBar` y `"statusBar"` de `nsh.json` son para los teléfonos.

> [!IMPORTANT]
> Cuando tu `nsh.json` declara `"capabilities"`, la barra de estado cambia solo cuando incluyen
> `"statusBar": true`; los demás cambios se rechazan y se registran. Consulta
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## Relacionado

- [Navigation guide](../docs/navigation.md).
- [Forms and keyboard](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) e [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) e
  [Input](../elements/input.md).
- [Device and environment](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` y otras APIs exclusivas de Android.
