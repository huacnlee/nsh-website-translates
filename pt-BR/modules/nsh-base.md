---
title: "nsh/base"
description: "Componentes base sem estilo para a UI de um app: botões, links, avatares, carrosséis, caixas de seleção, botões de opção, switches, abas, toggles, barras de ferramentas, árvores, selects, comboboxes, paletas de comandos, calendários, seletores de data, campos de hora, painéis redimensionáveis, áreas de trabalho acopláveis, documentos Markdown e HTML, um editor de código, diffs, entradas de texto, pilhas de navegação e diálogos, diálogos de alerta do sistema e a barra de status de páginas e diálogos."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---


# nsh/base

`nsh/base` é a camada de componentes base da UI de um app: componentes sem estilo que cuidam de comportamento, estado, foco e acessibilidade, em todas as plataformas. Ela fica entre as primitivas (`nsh`, `nsh/mobile` e `nsh/desktop`) e a biblioteca de componentes do próprio app, assim como `gpui-base` fica entre `gpui` e uma biblioteca estilizada no GPUI Kit (veja [Módulos](./index.md#three-layers)). Ela oferece controles (`Button`, `Link`, `Checkbox`, `ColorPicker` com seu `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` e `ColorEyeDropper`, `NumberInput`, `Radio` em um `RadioGroup`, `Slider`, `Switch`, `Tab` em `Tabs`, `Toggle` em um `ToggleGroup`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), paletas de comandos (`Command`), barras de controles (`Toolbar` com seus `ToolbarGroup` e `ToolbarSeparator`), barras de rolagem com a aparência própria do app (`Scrollbar`), regiões que expandem e recolhem (`Collapsible`, e `Accordion` com seus `AccordionItem`, `AccordionHeader`, `AccordionTrigger` e `AccordionPanel`), uma barra de progresso (`Progress`), códigos de uso único (`OtpInput`), as páginas de um conjunto (`Pagination`), itens que contêm itens (`Tree`), as partes com que gráficos são construídos (`Plot` com `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` e `Arc`, em `nsh/base/plot`), workspaces que o usuário organiza (`ResizablePanel`s em um `ResizablePanelGroup`, e os splits, grupos de abas e docks de `DockArea`), carrosséis (`Carousel` e suas partes), documentos em Markdown ou HTML (`TextView`), um editor de código (`Editor`), as alterações entre textos (`DiffView`) e tabelas de linhas e colunas (`Table` e suas partes, `DataTable`), entradas de texto (`Input`), popups exibidos sobre todo o resto (`Popover`, `Menu` e `ContextMenu` com seus `MenuItem`, `MenuSeparator` e `Submenu`, `Tooltip`, `Sheet`), toasts (`Toast` em um `ToastStack`, com o ciclo de vida em um `ToastManager`), navegação (um `NavStack` de `NavPage`s controlado pelo estado que você cria com `createNavStack`, e `Dialog` para conteúdo apresentado sobre todo o resto) e os diálogos de alerta do sistema (`AlertDialog`). Páginas e diálogos também definem a barra de status (`statusBar`).

O conjunto base também inclui `Avatar` e `AvatarGroup`: imagens com estado nativo de carregamento e uma linha que exibe os primeiros `limit` avatares.

A aparência é do app: o que vai dentro de uma página, de um diálogo ou de um cabeçalho é o seu próprio JSX, montado a partir das primitivas com estilos, classes [Tailwind](../docs/tailwind.md) e o seu tema, componentes Rust de [seu próprio crate](../docs/rust.md), ou uma biblioteca de componentes que a comunidade constrói sobre `nsh/base`. Todo host serve `nsh/base`; apps Rust usam a mesma API a partir do crate `nsh-base` (`nsh_base::{button, dialog, …}`).

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

Esta página é o índice do módulo: cada componente tem uma página de elemento com seus exemplos, props e notas de plataforma. Para tutoriais passo a passo, veja o [Guia de navegação](../docs/navigation.md) e [Formulários e teclado](../docs/forms-and-keyboard.md).

| TSX | Rust | O que é |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | Um alvo de toque com os estados desabilitado e selecionado e um papel para leitores de tela. |
| [`Link`](../elements/link.md) | `link()` | Um alvo de toque que leva a algum lugar: ele abre seu `href` pelo sistema, ou o app o abre (`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | A foto de uma pessoa, ou um substituto (as iniciais, o ícone do app) enquanto ela carrega, quando falha e quando não há foto; e uma linha que mostra os primeiros `limit` e um excedente. O estado de carregamento é nativo. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | Um controle marcado, desmarcado ou indeterminado, com um indicador que o app estiliza e marca. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | Uma opção de um conjunto em que o usuário escolhe uma só, e o conjunto; o app controla qual está marcada. |
| [`Switch`](../elements/switch.md) | `switch()` | Um controle liga / desliga com uma trilha e um botão deslizante que o app estiliza. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | Uma aba de uma lista de abas, e a lista; o app controla qual está selecionada e exibe o conteúdo dela. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | Um botão que fica ligado ou desligado, e uma barra de ferramentas deles; o app controla quais estão pressionados. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | Uma barra de botões, toggles e links: um único ponto de parada do foco do teclado, cujas setas se movem ao longo dela; grupos de itens relacionados e linhas entre eles. |
| [`Carousel`](../elements/carousel.md) e suas partes | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | Slides exibidos um de cada vez sobre a rolagem própria da plataforma, com anterior / próximo, uma paginação, as teclas e um loop contínuo; o app controla `index`. |
| [`Select`](../elements/select.md) | `select()` | Um valor de uma lista de itens: um popup junto ao gatilho em desktops, uma sheet em celulares; o app controla `value` e desenha o gatilho. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | Um valor ou vários (`multiple`) de uma lista de itens filtrada pelo que se digita em seu campo de entrada; o app controla `value` e estiliza o campo. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | Uma data ou um intervalo de datas escolhido em meses de dias, com visões de mês e de ano e o teclado; o app controla `value` e desenha os itens. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | Um horário do dia editado segmento por segmento (hora, minuto, segundo, AM/PM); o app controla `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | Uma data, um intervalo ou uma data e hora escolhidos em um calendário, em um popup junto ao gatilho em desktops, uma sheet em celulares; o app controla `value` e desenha o gatilho. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | Uma região cujo conteúdo expande e recolhe; o app controla `open` e o gatilho dela. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | Seções empilhadas que expandem e recolhem sob seus títulos, uma de cada vez ou várias (`multiple`); o app controla `value`, os itens abertos. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | Um código de uso único em células que o app estiliza; o app controla `value`, e `onComplete` avisa quando está completo. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | As páginas de um conjunto: Anterior, as páginas ao redor da atual com reticências, os filhos do app e Próxima; o app controla `page`. |
| [`Command`](../elements/command.md) | `command()` | Uma paleta de comandos: um campo de busca sobre os comandos do app, filtrados nativamente por rótulo e palavras-chave, em uma lista virtualizada; Return ou um toque escolhe (`onSelect`), em um `Dialog` para uma paleta Cmd+K. |
| [`Tree`](../elements/tree.md) | `tree()` | Itens que contêm itens, virtualizados: expandidos e recolhidos, um selecionado, um único ponto de parada do foco do teclado; o app controla `expanded` e `selected` ou a árvore mantém o próprio estado. |
| [`Progress`](../elements/progress.md) | `progress()` | Uma barra de progresso; o app controla `value` (0 a 100) e `indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | Um número digitado em um campo ou ajustado com botões e teclas; o app controla `value` (ou o campo mantém o próprio a partir de `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | Uma barra de rolagem com a aparência própria do app, para a scroll view ou lista que ela nomeia (`scroll`); o indicador dela acompanha o conteúdo e seus arrastos e toques o rolam. |
| [`Slider`](../elements/slider.md) | `slider()` | Um valor, ou um intervalo de dois, escolhido ao longo de uma trilha; o app controla `value` (ou o slider mantém o próprio a partir de `defaultValue`). |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | Um seletor de cor e suas partes: uma área de saturação e brilho, sliders de qualquer canal de RGB, HSL, HSB ou OKLCH e do alfa, campos da cor ou de um canal, amostras, um conta-gotas; o app controla `value` (ou o seletor mantém o próprio a partir de `defaultValue`). |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | Painéis lado a lado ou empilhados, com alças que o usuário arrasta para redimensioná-los. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | Um workspace de splits, grupos de abas e docks de borda que o usuário organiza; o layout dele são dados do app. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | Uma pilha de navegação nativa e suas páginas. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | Conteúdo apresentado sobre todo o resto: sheets, fluxos em tela cheia, diálogos. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | O alerta ou action sheet da plataforma. |
| [`TextView`](../elements/text-view.md) | `text_view()` | Um documento em Markdown, HTML ou blocos, desenhado com textos e views, para respostas de IA em streaming. |
| [`Editor`](../elements/editor.md) | `editor()` | Um editor de código: realce de sintaxe, vários cursores, dobramento, localizar e substituir, diagnósticos. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | As alterações entre dois textos ou de um patch, lado a lado ou unificadas, com ações por alteração. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | Uma tabela com as linhas e células do próprio app, com os papéis de tabela para leitores de tela. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | Uma tabela com qualquer número de linhas e colunas: seleção, ordenação, colunas fixas, redimensionáveis e móveis, linhas servidas uma página por vez. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | A entrada de texto nativa da plataforma, de uma linha ou de várias. |
| [`Popover`](../elements/popover.md) | `popover()` | Conteúdo ancorado a um gatilho, sobre todo o resto. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | Uma prévia do que seu gatilho aponta, enquanto o ponteiro repousa sobre ele (um toque em telas sensíveis ao toque). |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | Menus: popups com submenus em cascata em desktops, sheets em celulares; itens marcáveis e escolhas de um só. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | Uma dica ao lado de seu gatilho. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | Um painel em uma borda da tela sobre um fundo escurecido. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | Toasts sem estilo: uma raiz semântica, uma pilha de camadas e o ciclo de vida delas. |
| `statusBar` em páginas e diálogos | `.status_bar(..)` | A barra de status enquanto uma página ou diálogo está ativo. Veja [Barra de status](#status-bar). |

Em Rust, `theme()` lê o tema do app como design tokens (`theme().primary`, `theme().radius`), os mesmos tokens que as [classes de tema](../docs/tailwind.md#theme-tokens) do TSX usam.

<a id="controls"></a>

## Controles

### Button

Um alvo de toque que cuida do próprio comportamento e não tem aparência: toques, os estados desabilitado e selecionado e seu papel para leitores de tela. A aparência é o `class` e o `style` do app com variantes de estado, e o conteúdo são os filhos dele. Veja [Button](../elements/button.md).

### Link

Um alvo de toque que leva a algum lugar e não tem aparência: toques, Return e Space enquanto ele tem o foco do teclado, o estado desabilitado, o papel de link para leitores de tela e a página atual de uma navegação (`current`). `href` é para onde ele leva, nunca exibido: um toque o informa (`onOpen`) e, em seguida, abre uma página web ou o link de outro app fora do app ou, com `openWith="app"`, deixa a abertura para as rotas do próprio app. Veja [Link](../elements/link.md).

### Checkbox

Um controle marcado, desmarcado ou indeterminado que cuida do próprio comportamento e não tem aparência: toques, ativação pelo teclado, o estado desabilitado e o papel e o valor de checkbox para leitores de tela (misto enquanto indeterminado), com o valor controlado pelo app (`checked`, `indeterminate`, `onChange`). O app estiliza o checkbox e seu indicador, cujas classes `checked:`, `indeterminate:` e `disabled:` acompanham o checkbox, e coloca a própria marca no indicador (`indicator`). Veja [Checkbox](../elements/checkbox.md).

<a id="radio-and-radiogroup"></a>

### Radio e RadioGroup

Uma opção de um conjunto em que o usuário escolhe exatamente uma, e o conjunto ao redor delas. Um radio cuida do próprio comportamento e não tem aparência: toques, ativação pelo teclado, o estado desabilitado e o papel de radio e o estado marcado para leitores de tela. O grupo é o radio group que os leitores de tela anunciam e não guarda valor: o app informa a cada radio se ele está marcado (`checked`), e um toque em um desmarcado pede essa marcação (`onChange`). O indicador e o rótulo do app são os filhos do radio, cujas classes `group-checked:` o acompanham. Veja [Radio](../elements/radio.md).

### Switch

Um controle liga / desliga que cuida do próprio comportamento e não tem aparência: toques, ativação pelo teclado, o estado desabilitado e o papel e o valor de switch para leitores de tela, com o valor controlado pelo app (`checked`, `onChange`). O app estiliza o switch, sua trilha e seu botão deslizante, cujas classes `checked:` e `disabled:` acompanham o switch. Veja [Switch](../elements/switch.md).

<a id="tab-and-tabs"></a>

### Tab e Tabs

As abas de uma lista de abas e a lista ao redor delas. Uma aba cuida do próprio comportamento e não tem aparência: toques, ativação pelo teclado, o estado desabilitado e o papel de aba e o estado selecionado para leitores de tela. A lista é a tab list que os leitores de tela anunciam e não guarda valor: o app informa a cada aba se ela está selecionada (`selected`), recebe os toques (`onPress`) e exibe por conta própria o conteúdo da seção selecionada. O rótulo do app são os filhos da aba, cujas classes `group-selected:` a acompanham. O indicador da lista (`indicatorClass`, `indicatorStyle`), um sublinhado ou uma pílula que o app estiliza, fica sobre a aba selecionada e salta nativamente para a seguinte. Veja [Tabs](../elements/tabs.md).
### Carousel

Slides exibidos um lugar por vez (as fotos de um produto, um onboarding, um banner, uma fileira de cards). O conteúdo é uma scroll view nativa que se alinha ao início dos slides, de modo que o dedo, a roda do mouse e o touchpad os movem no mesmo frame que o ponteiro; quando ele para, o carousel informa o slide com `onChange`. Anterior e próximo (`CarouselPrevious`, `CarouselNext`), a paginação (`CarouselPaginationItem`s em um `CarouselPagination`, com um indicador que se desloca com efeito de mola até o slide exibido) e as setas do teclado o movem nativamente, dando a volta nas extremidades de forma contínua com `looping`. O slide exibido é o `index` do app, que o próprio timer do app avança nos slides que passam sozinhos (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` indicam quando esperar); a aparência e todos os rótulos ficam por conta do app. Veja [Carousel](../elements/carousel.md).

### Toggle and ToggleGroup

Um botão que fica ligado ou desligado (negrito, um favorito, uma opção de visualização) e uma barra de ferramentas deles. O toggle é dono do seu comportamento e não tem aparência: pressionamentos, ativação pelo teclado, o estado desabilitado e o papel de botão com seu estado pressionado para leitores de tela. O grupo é a barra de ferramentas que os leitores de tela anunciam, uma única parada do foco do teclado cujas setas movem entre seus toggles sem pressioná-los, e não guarda valor: o app informa a cada toggle se ele está pressionado (`pressed`), recebe o valor que ele pede (`onChange`) e mantém qualquer quantidade pressionada ou exatamente um. `disabled` no grupo desabilita todos os toggles dentro dele. O ícone ou rótulo do app são os filhos do toggle, e as classes `group-aria-pressed:` os acompanham. Veja [Toggle](../elements/toggle.md).

### Toolbar, ToolbarGroup and ToolbarSeparator

Uma barra de controles: a formatação de um editor de texto, o transporte de um player de mídia, uma paleta vertical de ferramentas. A toolbar é o elemento que os leitores de tela anunciam (nomeada por `accessibilityLabel`) e uma única parada do foco do teclado sobre os `Button`s, `Toggle`s e `Link`s dentro dela: Tab entra no item em que o foco esteve por último, as setas de seu `axis` se movem ao longo dela e Home e End saltam para suas extremidades, sem pressionar nada. Um `ToolbarGroup` é uma sequência nomeada de itens relacionados (desfazer e refazer, um alinhamento), e um `ToggleGroup` dentro de uma toolbar é um de seus grupos, com seus toggles como itens da toolbar. Um `ToolbarSeparator` é uma linha que o app desenha entre as sequências. `disabled` na toolbar ou em um grupo desabilita todos os itens dentro dele. A toolbar não guarda valor e não tem aparência: cada controle mantém seu próprio estado, e o app estiliza a barra, seus grupos e separadores. Veja [Toolbar](../elements/toolbar.md).

### Select

Um valor escolhido de uma lista de itens fornecidos como dados (`items`: um valor e um título cada, opcionalmente desabilitado ou em uma seção), sem aparência. O gatilho do app abre a lista: um popup junto ao gatilho nos desktops, uma sheet na parte inferior em celulares e tablets. O select é dono do teclado (Up, Down, Home, End, Page Up e Down, typeahead, Return e Escape), da busca (`searchable`), da linha destacada (`focus:` em `itemClass`; `renderItem` recebe o que um item é, nunca o seu estado) e dos papéis combobox, listbox e option para leitores de tela. O app é dono do valor (`value`, `onChange`) ou o deixa com o select (`defaultValue`), e estiliza cada parte ou desenha as linhas. Veja [Select](../elements/select.md).

### Combobox

Valores escolhidos de uma lista de itens, como a lista de um select, filtrados pela digitação no input do combobox, sem aparência: um só ou, com `multiple`, vários, e então uma escolha alterna o item enquanto a lista permanece aberta. O valor é um array que o app controla (`value`, `onChange`) ou deixa com o combobox (`defaultValue`); `onConfirm` o informa quando a lista fecha. A consulta pode ser do app (`query`, `onQueryChange`), um rodapé aparece abaixo das linhas e um botão de limpar esvazia o valor. Veja [Combobox](../elements/combobox.md).

### Calendar

Uma data, ou, com `range`, um intervalo de datas, escolhida entre meses de dias, sem aparência. Um mês ou vários (`numberOfMonths`) são exibidos lado a lado; o cabeçalho os vira e abre uma visão dos meses ou uma página de anos. O valor é uma data ISO (`"2026-10-28"`) ou `[start, end]` que o app controla (`value`, `onChange`) ou deixa com o calendar (`defaultValue`); `disabledMatcher` impede que dias sejam escolhidos, e os dias recebem o teclado como uma única parada do Tab. O app estiliza as partes e desenha os itens (`renderItem`, dado o que um item é; seus estados são suas classes, os dias de um intervalo `selected:` com `data-range-start:`, `data-range-middle:` e `data-range-end:`). Veja [Calendar](../elements/calendar.md).

### TimeField

Um horário do dia editado um segmento por vez, sem aparência: a hora, o minuto, o segundo (`precision`) e AM/PM (`hourCycle="h12"`), por incremento, digitação ou pelo teclado numérico de um celular. O valor é `"HH:MM"` (`"HH:MM:SS"`) em um relógio de 24 horas, o do app (`value`, `onChange`) ou o do próprio campo (`defaultValue`). Veja [TimeField](../elements/time-field.md).

### DatePicker

Uma data escolhida em um calendar que abre a partir do gatilho do app, como a lista de um select: um popup nos desktops, uma sheet nos celulares. O valor segue as formas dos inputs HTML: uma data ISO, `[start, end]` com `range` ou uma data e hora com `timePrecision` (um time field sob o calendar), o do app (`value`, `onChange`) ou o do próprio picker (`defaultValue`). Predefinições o definem, um botão de limpar o limpa, e todas as props de `Calendar` são repassadas. Veja [DatePicker](../elements/date-picker.md).

### Collapsible

Uma região cujo conteúdo expande e recolhe, sem aparência: seus filhos aparecem sempre (um resumo, o gatilho), e seu `content` depois deles enquanto `open`. O app é dono de `open` e do gatilho que o alterna, e informa o estado expandido aos leitores de tela ali. O conteúdo é criado uma vez e mantido enquanto recolhido, de modo que o que está dentro preserva seu estado. Com `reveal`, ele abre e fecha com uma altura em mola, de forma nativa. Veja [Collapsible](../elements/collapsible.md).

### Accordion

Seções empilhadas que expandem e recolhem sob seus títulos, sem aparência: um `Accordion` de `AccordionItem`s, cada um um `AccordionHeader` em torno de seu `AccordionTrigger` e de um `AccordionPanel`. O app é dono de `value`, os valores dos itens abertos, e define o único `onChange` que é informado quando um gatilho é pressionado: um item por vez, ou vários com `multiple`. Os leitores de tela ouvem um grupo de títulos cujos botões dizem se o item está expandido, e cada painel aberto como uma região. Com `reveal`, um painel abre e fecha com uma altura em mola, de forma nativa; com `keepMounted`, seu conteúdo permanece na árvore enquanto fechado. Veja [Accordion](../elements/accordion.md).

### Avatar

A imagem de uma pessoa, sem aparência: o fallback (as iniciais de `name`, ou o `fallback` do app) e a imagem sobre ele, transparente até ser carregada, ambos do tamanho do avatar, depois os filhos do app (um ponto de presença). Os eventos de carregamento e de erro da própria imagem alteram seu status de forma nativa (`onStatusChange`), e `fallbackDelay` mantém o fallback oculto enquanto uma imagem carrega. Os leitores de tela ouvem uma imagem rotulada com o nome. Um `AvatarGroup` mostra seus primeiros `limit` avatares, não cria views para os demais e mostra seu `overflow` enquanto `total` for maior. Veja [Avatar](../elements/avatar.md).

### Progress

Uma barra de progresso linear, sem aparência: uma trilha com um indicador dentro dela, o indicador com `value` por cento da largura da trilha. O app é dono de `value` (0 a 100) e de `indeterminate`; os leitores de tela recebem o papel de barra de progresso, o intervalo e o valor, e nenhum valor enquanto indeterminado, quando a largura e o movimento do indicador ficam por conta do app. Veja [Progress](../elements/progress.md).

### NumberInput

Um número digitado em um campo ou incrementado, sem aparência: o campo (`Input`), o decremento antes dele e o incremento depois (ou ambos em uma coluna à direita, `controlsRight`). O app é dono de `value` (um número ou `null`; ou o input mantém o seu a partir de `defaultValue`) e recebe `onChange` com o número que o campo interpreta. O campo aceita um número ou o texto a caminho de um, incluindo dígitos e sinais de outros teclados; os botões, Up / Down e Page Up / Page Down o incrementam em `step`, preservando as casas decimais, até `min` e `max`, e sair do campo ajusta um valor digitado a eles. O campo é um spin button para os leitores de tela, cujo incremento e decremento o ajustam. Veja [NumberInput](../elements/number-input.md).

### Slider

Um valor, ou um intervalo de dois, escolhido ao longo de uma trilha, sem aparência: uma trilha que recebe pressionamentos e arrastos, o indicador dentro dela sobre o qual os valores são mapeados, o intervalo e um thumb por valor sobre ela. O app é dono de `value` (um número ou `[start, end]`; ou o slider mantém o seu a partir de `defaultValue`) e recebe `onChange` para cada novo valor, ajustado a `step` a partir de `min`, e `onChangeEnd` uma vez por alteração; `scale` distribui os valores de forma linear ou por ordens de grandeza, `axis` dispõe a trilha na horizontal ou na vertical. Cada thumb é um elemento ajustável para os leitores de tela, com seu próprio valor, é uma parada do foco do teclado e se move com as teclas de slider do WAI-ARIA. Veja [Slider](../elements/slider.md).

### Scrollbar

Uma barra de rolagem com a aparência própria do app para uma scroll view ou uma lista, posicionada onde o app quiser, sem aparência: uma trilha (o `class` da barra) e um thumb nela (`thumbClass`). Ela nomeia sua scroll view (`scroll`, seu `ref`) e acompanha seu deslocamento, conteúdo e viewport; arrastar o thumb rola o conteúdo, e pressionar a trilha leva o meio do thumb até ali. `mode` a mostra enquanto o conteúdo rola (até `motion.idle` depois), enquanto o ponteiro está sobre a barra, ou sempre; `axis` a torna horizontal. `Scrollbar.setTheme` dá a toda scroll view e lista uma barra com a aparência do app sobre sua viewport, sem nenhuma para posicionar, e uma view recebe um tema próprio como sua prop `scrollbar`. Veja [Scrollbar](../elements/scrollbar.md).

### ColorPicker

Um seletor de cor sem aparência: a raiz guarda a cor e as partes dentro dela a mostram e alteram, dispostas pelo app. `ColorArea` é a saturação e o brilho do HSB, `ColorSlider` qualquer canal de RGB, HSL, HSB ou OKLCH ou o alfa (horizontal ou vertical), `ColorField` a cor em qualquer forma CSS ou o número de um canal, `ColorSwatch` uma predefinição que um pressionamento escolhe ou uma prévia da cor, `ColorEyeDropper` um botão que escolhe uma cor na tela (macOS, web). O app é dono de `value` (ou o picker mantém o seu a partir de `defaultValue`) e recebe `onChange` e `onChangeEnd` com a cor e seu texto como `format` o escreve; o picker mantém os canais de cada espaço como o usuário os definiu. Os thumbs são elementos ajustáveis para os leitores de tela e paradas do foco do teclado. Veja [ColorPicker](../elements/color-picker.md).

### OtpInput

Um código numérico de uso único de comprimento fixo, sem aparência: um campo de texto nativo sobre as células recebe o teclado, de modo que digitação, colar, o teclado numérico e o preenchimento automático de códigos do sistema são da plataforma, e os leitores de tela encontram um único campo de texto. Entram apenas dígitos, até `length`; Backspace remove o último. O app é dono de `value` (ou fornece `defaultValue`) e recebe `onChange` e `onComplete`; ele estiliza as células (`focus:` na que recebe o próximo dígito, `data-filled:` nas que contêm um dígito), seus grupos e o cursor. Veja [OtpInput](../elements/otp-input.md).

### Pagination

As páginas de um conjunto entre as quais navegar, um landmark de navegação sem aparência: Anterior, a primeira e a última página, a atual com suas vizinhas (`visiblePages`), reticências para cada trecho omitido, os filhos do app e Próxima; `compact` mantém Anterior, os filhos e Próxima. O app é dono de `page` e recebe `onChange({ page })`; a página atual é `selected:` e a página atual para os leitores de tela. O app estiliza os itens (`itemClass`) ou os desenha (`renderItem`). Veja [Pagination](../elements/pagination.md).

### Command

Uma paleta de comandos: um campo de busca sobre os comandos do app (`items`: um `id`, um `label`, `keywords`, um `group`, um `shortcut` a mostrar, `disabled`, `checked`), filtrados de forma nativa conforme o usuário digita (o rótulo ou uma palavra-chave contém a consulta, ignorando maiúsculas e minúsculas; seções sem correspondência somem), em uma lista virtualizada que cria apenas as linhas visíveis. Up e Down movem o destaque, Return ou um pressionamento escolhe (`onSelect({ id })`), Escape limpa a consulta e depois informa `onCancel`, onde o app fecha um `Dialog` ao redor dele. A consulta é do app (`query`, `onQueryChange`) ou do próprio campo; com `filterable={false}` e `loading`, o app a responde a partir de um servidor. O app estiliza cada parte (`itemClass` com `focus:` para o destaque, `checked:`, `disabled:`) e desenha as linhas (`renderItem`, dado o atalho como mostrado aqui). Veja [Command](../elements/command.md).

### Tree

Itens que contêm itens: os arquivos de um projeto, uma barra lateral de configurações, um outline. `items` são dados (`TreeItem`: um `id`, um `label`, `children`, `disabled`), e as linhas são virtualizadas: apenas as visíveis são criadas, e os filhos de um item recolhido nunca são, de modo que uma árvore com milhares de itens continua rápida. O app é dono dos ids expandidos e do selecionado (`expanded`, `selected`, com `onExpandedChange` e `onSelectedChange`) ou a árvore mantém os seus (`defaultExpanded`, `defaultSelected`). Um pressionamento seleciona uma linha e expande ou recolhe uma pasta; a árvore é uma única parada do foco do teclado cujas setas movem a seleção (Right e Left expandem, recolhem, entram e saem de uma pasta), com Home, End, Return, Space e typeahead. O app estiliza as linhas (`itemClass` com `selected:`, `aria-expanded:`, `focus:`) e as desenha (`renderItem`, dado o `depth` de cada item). Veja [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

As partes com que os gráficos são construídos, como o `plot` de `gpui-base`, em um módulo próprio: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
são chaves verificadas ou funções de uma linha), as escalas `point`, `linear` ou `band` de seus eixos, a linha sob o ponteiro
(`onHoverChange`) e seu movimento (`motion`: a entrada, o esmaecimento e o deslizamento do hover); suas marcas são desenhadas nativamente a partir das
linhas, sem JS por ponto, e são pintadas com as propriedades de pintura do SVG (`stroke-*`, `fill-*`), `currentColor` onde nenhuma
está definida; um `Area` ou um `Bar` mostra um fundo (um gradiente, `bg-linear-*`) dentro de suas formas. As barras ficam nas
faixas de uma escala `band`, lado a lado ou empilhadas em um `stack`, crescem quando o gráfico aparece e esmaecem, exceto a linha
sob o ponteiro, com uma parte `label` na ponta de cada barra. A linha transversal do hover, os pontos (os de cada marca
com `hoverDotClass`) e o tooltip (`tooltipPlacement`, mantido dentro do gráfico) são partes que o app estiliza e preenche, movidas
nativamente; os rótulos dos eixos são elementos do próprio app. Um `Pie` divide a volta em uma fatia por linha (um donut com um
`innerRadius`), cada uma pintada com suas próprias classes (`sliceClass`, uma função de sua linha), e um `Arc` desenha um setor
entre dois ângulos (a trilha e o valor de um medidor); sobre um gráfico de pizza, o gráfico informa a fatia sob o ponteiro, que se eleva
(`hoverLift`) enquanto as outras esmaecem (`hoverDim`). Um `Sankey` desenha fluxos entre as linhas (`links`), dispostos como
o d3-sankey os dispõe, com cada nó e cada faixa pintados com suas próprias classes, nós com rótulos, com hover e que se movem para novos fluxos. Um `Treemap` divide as linhas em uma hierarquia de retângulos
aninhados (`id`, `parent`), sendo a área de cada folha o seu `value`, colorido por categoria ou ao longo de uma rampa do
`colorScale` do gráfico, com seus rótulos exibidos onde couberem. Veja [Plot](../elements/plot.md).

## Workspaces

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup e ResizablePanel

Painéis lado a lado ou empilhados, com uma alça entre cada dois que o usuário arrasta para repartir o espaço. O grupo é dono
do arraste, que roda nativamente, dos limites de cada painel (`minSize`, `maxSize`) e do cursor de redimensionamento; os tamanhos são do
app (`size`, informados com `onResize`), assim como a aparência das alças e o conteúdo dos painéis. Veja
[Resizable](../elements/resizable.md).

### DockArea

Um espaço de trabalho com docking: painéis em grupos de abas, grupos divididos lado a lado ou empilhados, e docks nas bordas esquerda, direita e
inferior. O layout são dados de propriedade do app (`layout`, informados com `onLayoutChange`); a área é dona do arrastar e soltar de abas,
do redimensionamento, dos docks, do zoom e do bloqueio, preserva o conteúdo de cada painel quando ele se move e apresenta o mesmo layout com
gavetas e um bottom sheet quando está estreita. As abas, as alças, o indicador de soltura e o conteúdo dos painéis são
do app. Veja [Dock](../elements/dock.md).

<a id="documents"></a>

## Documentos

### TextView

`TextView` mostra um documento em Markdown, HTML ou em blocos que o app constrói, desenhado com elementos e views de [`Text`](../elements/text.md):
títulos, listas, código, tabelas, imagens, fórmulas, notas de rodapé e a sintaxe própria do app. Foi feito para
respostas de chat de IA que chegam em streaming, com uma tipografia de leitura nas cores do tema que o app reestiliza parte por parte,
e funções de renderização que colocam o conteúdo do app no lugar. Veja [TextView](../elements/text-view.md).

<a id="code"></a>

## Código

### Editor

`Editor` é um editor de código para mais de cinquenta linguagens: realce de sintaxe, números de linha, vários cursores, dobramento,
quebra de linha automática, localizar e substituir, diagnósticos e decorações, com os atalhos de teclado dos editores de código. O texto é do app
(`value` e `onChange`), assim como a barra de busca, que controla o `search` do editor. Vem com uma aparência construída a partir dos
tokens do tema, que o app reestiliza parte por parte. Veja [Editor](../elements/editor.md).

### DiffView

`DiffView` mostra as alterações entre dois textos, ou dos arquivos de um patch, como as ferramentas de code review: lado a lado ou
unificado, com as palavras alteradas dentro das linhas realçadas, linhas inalteradas recolhidas em separadores que se expandem, nas
cores de sintaxe do `Editor`. As ações do app mantêm ou revertem cada alteração. Veja [DiffView](../elements/diff-view.md).

### Table

`Table` e suas partes organizam algumas linhas que o app escreve como filhos e oferecem uma tabela aos leitores de tela: grupos de linhas,
linhas, cabeçalhos de coluna e células. Cada parte aceita a aparência do app. Veja [Table](../elements/table.md).

### DataTable

`DataTable` mostra linhas e colunas e rola nas duas direções sobre qualquer quantidade de ambas, renderizando apenas as células visíveis. Linhas,
colunas ou células são selecionáveis; as colunas são redimensionáveis, movíveis, fixáveis e ordenáveis (o app faz a ordenação); o app fornece as linhas uma página por vez
e pode desenhar células e títulos. Veja [DataTable](../elements/data-table.md).

<a id="navigation"></a>

## Navegação

Um `NavStack` de `NavPage`s é `UINavigationController` no iOS e uma pilha com barra de ferramentas e voltar preditivo no
Android; nos desktops e na web, cada página mostra o `header` do próprio app. Veja
[NavStack](../elements/nav-stack.md), que também cobre `createNavStack` e como sair de uma página.

### Dialog

`Dialog` apresenta conteúdo sobre todo o resto, inclusive o cabeçalho da pilha, em sua própria camada de janela nativa. Seu
popup e seu backdrop são estilizados pelo app. Veja [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## Diálogos de alerta

### AlertDialog

`AlertDialog.show(options)` mostra o alerta ou action sheet da própria plataforma e resolve com `{ action }`, o `id`
da ação que o usuário escolheu. Veja [AlertDialog](../elements/alert-dialog.md).

<a id="input"></a>

## Entrada

`Input` é o campo de entrada de texto nativo da plataforma: um campo de uma ou várias linhas cuja digitação, cursor, seleção,
autocorreção e preenchimento automático são tratados pela plataforma. O app é dono do seu valor e da sua aparência. Suas props são o tipo `InputProps` (com `IOSInputProps` para `ios={{…}}`), exportado junto com ele. Veja [Input](../elements/input.md).

<a id="status-bar"></a>

## Barra de status

A barra de status pertence ao que está na tela, como no UIKit, em que cada view controller declara seu
`preferredStatusBarStyle` e a que está no topo decide. No NSH, as páginas e os diálogos são esses view controllers: uma
`NavPage` ou um `Dialog` declara a barra de status que deseja com `statusBar`, e o app declara seu padrão em
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

`statusBar` aceita estes campos, todos opcionais (em Rust, um `StatusBarStyle` sozinho, ou os métodos de builder de `StatusBarSetting`
com os mesmos nomes):

| Campo | Tipo | Descrição |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | A cor do conteúdo (hora, bateria, sinal): `"light"` para fundos escuros, `"dark"` para fundos claros, `"auto"` a da plataforma para a aparência atual. |
| `hidden` | `boolean` | Oculta a barra de status. |
| `animated` | `boolean` | Anima a mudança quando a página ou o diálogo entra e sai. |

O valor é reativo: `statusBar={{ foreground: dark() ? "light" : "dark" }}` acompanha o signal, assim como uma closure
Rust que lê um.

<a id="which-one-applies"></a>

### Qual deles se aplica

A página ou o diálogo exibido **mais recentemente** decide, **campo a campo**: uma página empilhada em uma pilha fica sobre as páginas
abaixo dela, e um diálogo aberto fica sobre as páginas. Um campo que ela omite vem do que está abaixo e, no fim,
do padrão do app. Quando a página é removida da pilha ou o diálogo fecha, o que está abaixo volta a valer.

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

### O padrão do app

`"statusBar"` de `nsh.json` é a configuração sob todas as páginas e diálogos, como `UIStatusBarStyle` e
`UIStatusBarHidden` do Info.plist em um app UIKit:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

Os dois campos são opcionais. Sem ele, o conteúdo é `"auto"` e a barra é exibida. Apps iOS empacotados também o mostram na
tela de abertura.

<a id="the-status-bar-on-each-platform"></a>

### A barra de status em cada plataforma

- **iOS**: ocultar e mostrar são animados com um fade. Em um app [embutido](../docs/ios.md) em um app nativo,
  o view controller do app host decide a aparência da barra de status. O host aplica a configuração do NSH retornando
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` e
  `NshAppView.preferredStatusBarUpdateAnimation` do seu view controller.
- **Android**: os apps desenham de borda a borda, atrás da barra de status (Android 15, API 35): o fundo do próprio app é o
  da barra, e `foreground` mantém o conteúdo legível sobre ele.
- **Desktops e web**: a barra de título da janela e as barras do navegador pertencem ao sistema e ao navegador;
  `statusBar` e `"statusBar"` de `nsh.json` são para os celulares.

> [!IMPORTANT]
> Quando o seu `nsh.json` declara `"capabilities"`, a barra de status só muda quando elas incluem
> `"statusBar": true`; outras mudanças são recusadas e registradas em log. Veja
> [Sandbox e capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## Relacionados

- [Guia de navegação](../docs/navigation.md).
- [Formulários e teclado](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) e [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) e
  [Input](../elements/input.md).
- [Dispositivo e ambiente](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` e outras APIs exclusivas do Android.
