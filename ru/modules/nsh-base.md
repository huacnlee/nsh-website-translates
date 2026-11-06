---
title: "nsh/base"
description: "Базовые компоненты без стилей для пользовательского интерфейса приложения: кнопки, ссылки, аватары, карусели, флажки, радиокнопки, переключатели, вкладки, переключаемые кнопки, панели инструментов, деревья, выпадающие списки, комбобоксы, палитры команд, календари, выбор даты, поля ввода времени, панели с изменяемым размером, закрепляемые рабочие области, документы Markdown и HTML, редактор кода, диффы, текстовые поля, стеки навигации и диалоги, системные диалоги предупреждений и строка состояния страниц и диалогов."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` — базовый слой компонентов UI приложения: компоненты без стилей, которые отвечают за поведение, состояние, фокус и
доступность на всех платформах. Он находится между примитивами (`nsh`, `nsh/mobile` и `nsh/desktop`) и
собственной библиотекой компонентов приложения, так же как `gpui-base` находится между `gpui` и стилизованной библиотекой в GPUI Kit (см.
[Модули](./index.md#three-layers)). Он предоставляет элементы управления (`Button`, `Link`, `Checkbox`, `ColorPicker` с `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` и `ColorEyeDropper`, `NumberInput`, `Radio` в `RadioGroup`, `Slider`, `Switch`, `Tab` в `Tabs`, `Toggle` в `ToggleGroup`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), палитры команд (`Command`), панели элементов управления (`Toolbar` с `ToolbarGroup` и `ToolbarSeparator`), полосы прокрутки собственного вида приложения (`Scrollbar`), области, которые разворачиваются и сворачиваются (`Collapsible`, а также `Accordion` с `AccordionItem`, `AccordionHeader`, `AccordionTrigger` и `AccordionPanel`), индикатор выполнения (`Progress`), одноразовые коды (`OtpInput`), страницы набора (`Pagination`), элементы, содержащие элементы (`Tree`), части, из которых строятся диаграммы (`Plot` с `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` и `Arc` в `nsh/base/plot`), рабочие области, которые пользователь организует сам (несколько `ResizablePanel` в
`ResizablePanelGroup`, а также разделения, группы вкладок и док-панели `DockArea`), карусели (`Carousel` и её части), документы в Markdown или HTML (`TextView`), редактор кода (`Editor`), изменения между текстами (`DiffView`) и таблицы со строками и столбцами (`Table` и её части, `DataTable`), текстовые поля ввода
(`Input`), всплывающие элементы поверх всего остального (`Popover`, `Menu` и `ContextMenu` с их `MenuItem`,
`MenuSeparator` и `Submenu`, `Tooltip`, `Sheet`), тосты (`Toast` в `ToastStack`, их жизненный цикл в `ToastManager`), навигацию (`NavStack` из `NavPage`, управляемый
состоянием, которое вы создаёте с помощью `createNavStack`, и `Dialog` для содержимого, показываемого поверх всего остального) и системные
диалоги-предупреждения (`AlertDialog`). Страницы и диалоги также определяют строку состояния
(`statusBar`).

В базовый набор входят также `Avatar` и `AvatarGroup`: изображения с нативным
состоянием загрузки и ряд, в котором размещаются первые `limit` аватаров.

Внешний вид определяет приложение: то, что находится внутри страницы, диалога или заголовка, — это ваш собственный JSX, составленный из примитивов со
стилями, классами [Tailwind](../docs/tailwind.md) и вашей темой, компоненты на Rust из [вашего собственного крейта](../docs/rust.md)
или библиотека компонентов, которую сообщество строит на основе `nsh/base`. Каждый хост предоставляет `nsh/base`; приложения на Rust используют тот же API
из крейта `nsh-base` (`nsh_base::{button, dialog, …}`).

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

Эта страница — указатель модуля: у каждого компонента есть своя страница с примерами, свойствами и особенностями платформ. Пошаговые
руководства см. в [руководстве по навигации](../docs/navigation.md) и в разделе [Формы и клавиатура](../docs/forms-and-keyboard.md).

| TSX | Rust | Что это |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | Цель нажатия с состояниями disabled и selected и ролью для программ чтения с экрана. |
| [`Link`](../elements/link.md) | `link()` | Цель нажатия, которая куда-то ведёт: она открывает свой `href` средствами системы, либо его открывает приложение (`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | Изображение человека или запасной вариант (инициалы, значок приложения) на время загрузки, при ошибке и при отсутствии изображения; а также ряд, показывающий первые `limit` аватаров и счётчик остальных. Состояние загрузки нативное. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | Элемент управления в состоянии «отмечен», «не отмечен» или «неопределённое» с индикатором, стиль и значок которого задаёт приложение. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | Один из вариантов набора, из которого пользователь выбирает один, и сам набор; приложение само определяет, какой вариант отмечен. |
| [`Switch`](../elements/switch.md) | `switch()` | Переключатель «вкл / выкл» с дорожкой и ползунком, стиль которых задаёт приложение. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | Одна вкладка списка вкладок и сам список; приложение само определяет, какая вкладка выбрана, и показывает её содержимое. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | Кнопка, которая включена или выключена, и панель инструментов из таких кнопок; приложение само определяет, какие из них нажаты. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | Панель из кнопок, переключателей и ссылок: одна точка остановки фокуса клавиатуры, по которой перемещаются клавишами со стрелками; группы связанных элементов и линии между ними. |
| [`Carousel`](../elements/carousel.md) и её части | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | Слайды, показываемые по одному на собственной прокрутке платформы, с кнопками «назад / вперёд», пагинацией, клавишами и бесшовным циклом; приложение само определяет `index`. |
| [`Select`](../elements/select.md) | `select()` | Одно значение из списка элементов: всплывающее окно у триггера на компьютерах, лист на телефонах; приложение само определяет `value` и рисует триггер. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | Одно или несколько значений (`multiple`) из списка элементов, фильтруемого вводом в его поле; приложение само определяет `value` и стилизует поле. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | Дата или диапазон дат, выбираемые из месяцев с днями, с представлениями месяца и года и управлением с клавиатуры; приложение само определяет `value` и рисует элементы. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | Время суток, редактируемое по сегментам (час, минута, секунда, AM/PM); приложение само определяет `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | Дата, диапазон или дата со временем, выбираемые из календаря во всплывающем окне у триггера на компьютерах и в листе на телефонах; приложение само определяет `value` и рисует триггер. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | Область, содержимое которой разворачивается и сворачивается; приложение само определяет `open` и свой триггер. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | Стопка секций, которые разворачиваются и сворачиваются под своими заголовками, по одной или несколько одновременно (`multiple`); приложение само определяет `value` — открытые элементы. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | Одноразовый код в ячейках, стиль которых задаёт приложение; приложение само определяет `value`, а `onComplete` сообщает, когда код введён полностью. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | Страницы набора: «Назад», страницы вокруг текущей с многоточиями, дочерние элементы приложения и «Далее»; приложение само определяет `page`. |
| [`Command`](../elements/command.md) | `command()` | Палитра команд: поле поиска над командами приложения, нативно фильтрующее по названию и ключевым словам, в виртуализированном списке; выбор делается клавишей Return или нажатием (`onSelect`), в `Dialog` для палитры Cmd+K. |
| [`Tree`](../elements/tree.md) | `tree()` | Элементы, содержащие элементы, с виртуализацией: развёрнутые и свёрнутые, один выбранный, одна точка остановки фокуса клавиатуры; приложение само определяет `expanded` и `selected`, либо дерево хранит их у себя. |
| [`Progress`](../elements/progress.md) | `progress()` | Индикатор выполнения; приложение само определяет `value` (от 0 до 100) и `indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | Число, вводимое в поле или изменяемое кнопками и клавишами; приложение само определяет `value` (либо поле хранит своё значение, заданное в `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | Полоса прокрутки собственного вида приложения для области прокрутки или списка, которые она называет (`scroll`); её ползунок следует за содержимым, а перетаскивания и нажатия прокручивают его. |
| [`Slider`](../elements/slider.md) | `slider()` | Значение или диапазон из двух значений, выбираемые вдоль дорожки; приложение само определяет `value` (либо слайдер хранит своё значение, заданное в `defaultValue`). |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | Выбор цвета и его части: область насыщенности и яркости, слайдеры любого канала RGB, HSL, HSB или OKLCH и альфа-канала, поля цвета или канала, образцы, пипетка; приложение само определяет `value` (либо выбор цвета хранит своё значение, заданное в `defaultValue`). |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | Панели рядом или друг над другом с ручками, которые пользователь перетаскивает, чтобы изменить их размер. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | Рабочая область из разделений, групп вкладок и док-панелей по краям, которую организует пользователь; её раскладка — данные приложения. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | Нативный стек навигации и его страницы. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | Содержимое, показываемое поверх всего остального: листы, полноэкранные сценарии, диалоги. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | Системное предупреждение или лист действий платформы. |
| [`TextView`](../elements/text-view.md) | `text_view()` | Документ из Markdown, HTML или блоков, отрисованный текстами и представлениями, для потоковых ответов ИИ. |
| [`Editor`](../elements/editor.md) | `editor()` | Редактор кода: подсветка синтаксиса, несколько кареток, сворачивание блоков, поиск и замена, диагностика. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | Изменения между двумя текстами или в патче, рядом или в едином виде, с действиями для каждого изменения. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | Таблица из собственных строк и ячеек приложения с ролями таблицы для программ чтения с экрана. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | Таблица с любым количеством строк и столбцов: выделение, сортировка, закреплённые, изменяемые по размеру и перемещаемые столбцы, строки, загружаемые по одной странице. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | Нативное текстовое поле ввода платформы, однострочное или многострочное. |
| [`Popover`](../elements/popover.md) | `popover()` | Содержимое, привязанное к триггеру, поверх всего остального. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | Предпросмотр того, на что указывает триггер, пока на нём находится указатель (нажатие на сенсорных экранах). |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | Меню: всплывающие окна с каскадными подменю на компьютерах, листы на телефонах; отмечаемые элементы и выбор одного из нескольких. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | Подсказка рядом с триггером. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | Панель у края экрана над затемняющей подложкой. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | Тосты без стилей: семантический корень, стопка слоёв, их жизненный цикл. |
| `statusBar` на страницах и в диалогах | `.status_bar(..)` | Строка состояния, пока показана страница или диалог. См. [Строка состояния](#status-bar). |

В Rust `theme()` читает тему приложения как дизайн-токены (`theme().primary`, `theme().radius`), те же токены
использует [классы темы](../docs/tailwind.md#theme-tokens) в TSX.

<a id="controls"></a>

## Элементы управления

### Button

Цель нажатия, которая сама отвечает за своё поведение и не имеет внешнего вида: нажатия, состояния disabled и selected и роль для
программ чтения с экрана. Её внешний вид задают `class` и `style` приложения с вариантами для состояний, а содержимое — её дочерние элементы. См.
[Button](../elements/button.md).

### Link

Цель нажатия, которая куда-то ведёт и не имеет внешнего вида: нажатия, Return и Space, пока у неё фокус клавиатуры,
состояние disabled, роль ссылки для программ чтения с экрана и текущая страница навигации (`current`). `href` — это то, куда она
ведёт, и оно никогда не показывается: нажатие сообщает о нём (`onOpen`), после чего открывается веб-страница или ссылка другого приложения за пределами приложения, либо,
с `openWith="app"`, открытие остаётся за собственными маршрутами приложения. См. [Link](../elements/link.md).

### Checkbox

Элемент управления в состоянии «отмечен», «не отмечен» или «неопределённое», который сам отвечает за своё поведение и не имеет внешнего вида: нажатия, активация с клавиатуры,
состояние disabled, а также роль checkbox и значение для программ чтения с экрана (mixed в неопределённом состоянии), при этом значением
владеет приложение (`checked`, `indeterminate`, `onChange`). Приложение стилизует чекбокс и его индикатор, чьи
классы `checked:`, `indeterminate:` и `disabled:` следуют за чекбоксом, и помещает в индикатор свой значок
(`indicator`). См. [Checkbox](../elements/checkbox.md).

<a id="radio-and-radiogroup"></a>

### Radio и RadioGroup

Один из вариантов набора, из которого пользователь выбирает ровно один, и набор вокруг них. Radio сам отвечает за своё поведение и не имеет
внешнего вида: нажатия, активация с клавиатуры, состояние disabled, а также роль radio и состояние checked для программ чтения с экрана.
Группа — это группа переключателей, о которой сообщают программы чтения с экрана, и она не хранит значения: приложение сообщает каждому radio, отмечен ли он
(`checked`), а нажатие на неотмеченный запрашивает отметку (`onChange`). Индикатор и подпись приложения — это дочерние элементы radio,
чьи классы `group-checked:` следуют за ним. См. [Radio](../elements/radio.md).

### Switch

Переключатель «вкл / выкл», который сам отвечает за своё поведение и не имеет внешнего вида: нажатия, активация с клавиатуры, состояние disabled, а также
роль switch и значение для программ чтения с экрана, при этом значением владеет приложение (`checked`, `onChange`). Приложение стилизует
переключатель, его дорожку и ползунок, чьи классы `checked:` и `disabled:` следуют за переключателем. См.
[Switch](../elements/switch.md).

<a id="tab-and-tabs"></a>

### Tab и Tabs

Вкладки списка вкладок и список вокруг них. Tab сам отвечает за своё поведение и не имеет внешнего вида: нажатия, активация
с клавиатуры, состояние disabled, а также роль tab и состояние selected для программ чтения с экрана. Список — это список вкладок, о котором
сообщают программы чтения с экрана, и он не хранит значения: приложение сообщает каждой вкладке, выбрана ли она (`selected`), получает
нажатия (`onPress`) и само показывает содержимое выбранной секции. Подпись приложения — это дочерние элементы вкладки, чьи
классы `group-selected:` следуют за ней. Индикатор списка (`indicatorClass`, `indicatorStyle`) — подчёркивание или
«таблетка», стиль которых задаёт приложение, — располагается на выбранной вкладке и нативно перепрыгивает на следующую. См. [Tabs](../elements/tabs.md).
### Carousel

Слайды, которые показываются по одному (фотографии товара, онбординг, баннер, ряд карточек). Содержимое — нативный scroll view, привязывающийся к началу слайдов, поэтому палец, колесо мыши и тачпад двигают слайды в том же кадре, что и указатель; когда прокрутка останавливается, карусель сообщает о показанном слайде через `onChange`. Кнопки «назад» и «вперёд» (`CarouselPrevious`, `CarouselNext`), пагинация (`CarouselPaginationItem` внутри `CarouselPagination`, с индикатором, который пружинисто переходит к показанному слайду) и клавиши со стрелками перемещают карусель нативно, а через концы — бесшовно, с `looping`. Показанный слайд — `index` приложения; для слайдов, которые переключаются сами, его двигает собственный таймер приложения (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` сообщают, когда ждать); внешний вид и все подписи определяет приложение. См. [Carousel](../elements/carousel.md).

<a id="toggle-and-togglegroup"></a>

### Toggle и ToggleGroup

Кнопка, которая включена или выключена (полужирный шрифт, избранное, параметр вида), и панель таких кнопок. Toggle сам отвечает за поведение и не имеет внешнего вида: нажатия, активацию с клавиатуры, отключённое состояние и роль кнопки с состоянием pressed для скринридеров. Группа — это панель инструментов, которую объявляют скринридеры, одна остановка фокуса клавиатуры, чьи стрелки перемещают фокус между её toggle, не нажимая их; значения она не хранит: приложение сообщает каждому toggle, нажат ли он (`pressed`), получает значение, которое тот запрашивает (`onChange`), и держит нажатыми любое число toggle или ровно один. `disabled` у группы отключает все toggle в ней. Значок или подпись приложения — дочерние элементы toggle, на которые распространяются его классы `group-aria-pressed:`. См. [Toggle](../elements/toggle.md).

<a id="toolbar-toolbargroup-and-toolbarseparator"></a>

### Toolbar, ToolbarGroup и ToolbarSeparator

Панель элементов управления: форматирование текстового редактора, управление воспроизведением медиаплеера, вертикальная палитра инструментов. Toolbar — то, что объявляют скринридеры (имя задаёт `accessibilityLabel`), и одна остановка фокуса клавиатуры для `Button`, `Toggle` и `Link` внутри него: Tab входит на элемент, который был последним, стрелки `axis` перемещают по панели, а Home и End переходят к её концам, ничего не нажимая. `ToolbarGroup` — именованный набор связанных элементов (отмена и повтор, выравнивание), а `ToggleGroup` внутри toolbar — одна из его групп, чьи toggle становятся элементами toolbar. `ToolbarSeparator` — линия, которую приложение рисует между наборами. `disabled` у toolbar или группы отключает все элементы в них. Toolbar не хранит значения и не имеет внешнего вида: каждый элемент управления хранит своё состояние, а панель, её группы и разделители оформляет приложение. См. [Toolbar](../elements/toolbar.md).

### Select

Одно значение, выбранное из списка элементов, заданных данными (`items`: у каждого значение и заголовок, при желании — отключённость или раздел), без внешнего вида. Список открывает триггер приложения: popup у триггера на десктопах и sheet внизу на телефонах и планшетах. Select отвечает за клавиатуру (Up, Down, Home, End, Page Up и Down, typeahead, Return и Escape), поиск (`searchable`), подсвеченную строку (`focus:` у `itemClass`; `renderItem` получает то, чем является элемент, но не его состояние) и роли combobox, listbox и option для скринридеров. Значением владеет приложение (`value`, `onChange`) или оставляет его select (`defaultValue`), оформляет каждую часть или рисует строки само. См. [Select](../elements/select.md).

### Combobox

Значения, выбранные из списка элементов, как в списке select, с фильтрацией по вводу в поле combobox, без внешнего вида: одно или, с `multiple`, несколько; выбор тогда переключает элемент, а список остаётся открытым. Значение — массив, которым владеет приложение (`value`, `onChange`) или который оставляет combobox (`defaultValue`); `onConfirm` сообщает его при закрытии списка. Запрос может принадлежать приложению (`query`, `onQueryChange`), футер показывается под строками, а кнопка очистки опустошает значение. См. [Combobox](../elements/combobox.md).

### Calendar

Дата или, с `range`, диапазон дат, выбираемые из месяцев с днями, без внешнего вида. Один месяц или несколько (`numberOfMonths`) показываются рядом; заголовок листает их и открывает вид месяцев или страницу лет. Значение — дата ISO (`"2026-10-28"`) или `[start, end]`, которым владеет приложение (`value`, `onChange`) или которое оставляет calendar (`defaultValue`); `disabledMatcher` запрещает выбирать дни, а дни получают клавиатуру как одна остановка Tab. Приложение оформляет части и рисует элементы (`renderItem`, получающий то, чем является элемент; его состояния — его классы, а дни диапазона `selected:` с `data-range-start:`, `data-range-middle:` и `data-range-end:`). См. [Calendar](../elements/calendar.md).

### TimeField

Время суток, редактируемое по одному сегменту, без внешнего вида: час, минута, секунда (`precision`) и AM/PM (`hourCycle="h12"`) — шагами, вводом или цифровой клавиатурой телефона. Значение — `"HH:MM"` (`"HH:MM:SS"`) в 24-часовом формате, значение приложения (`value`, `onChange`) или собственное значение поля (`defaultValue`). См. [TimeField](../elements/time-field.md).

### DatePicker

Дата, выбираемая из календаря, который открывается от триггера приложения, как список select: popup на десктопах, sheet на телефонах. Значение имеет формы HTML-полей ввода: дата ISO, `[start, end]` с `range` или дата и время с `timePrecision` (под календарём поле времени), значение приложения (`value`, `onChange`) или собственное значение picker (`defaultValue`). Пресеты задают его, кнопка очистки сбрасывает, а все props `Calendar` передаются дальше. См. [DatePicker](../elements/date-picker.md).

### Collapsible

Область, содержимое которой разворачивается и сворачивается, без внешнего вида: её дочерние элементы показаны всегда (сводка, триггер), а `content` — после них, пока `open`. Приложение владеет `open` и триггером, который его переключает, и именно там сообщает скринридерам о развёрнутом состоянии. Содержимое создаётся один раз и сохраняется в свёрнутом виде, поэтому всё внутри сохраняет своё состояние. С `reveal` оно открывается и закрывается с пружинящей высотой, нативно. См. [Collapsible](../elements/collapsible.md).

### Accordion

Стопка секций, которые разворачиваются и сворачиваются под своими заголовками, без внешнего вида: `Accordion` из `AccordionItem`, каждый — это `AccordionHeader` вокруг своего `AccordionTrigger` и `AccordionPanel`. Приложение владеет `value` — значениями открытых элементов — и задаёт то, что сообщает `onChange` при нажатии триггера: по одному элементу за раз или несколько с `multiple`. Скринридеры слышат группу заголовков, кнопки которых сообщают, развёрнут ли их элемент, и каждую открытую панель как region. С `reveal` панель открывается и закрывается с пружинящей высотой, нативно; с `keepMounted` её содержимое остаётся в дереве, пока она закрыта. См. [Accordion](../elements/accordion.md).

### Avatar

Изображение человека, без внешнего вида: запасной вариант (инициалы `name` или `fallback` приложения) и изображение поверх него, прозрачное, пока не загрузится, оба размером с avatar, затем дочерние элементы приложения (индикатор присутствия). События load и error самого изображения нативно меняют его статус (`onStatusChange`), а `fallbackDelay` удерживает запасной вариант, пока изображение загружается. Скринридеры слышат изображение с подписью-именем. `AvatarGroup` показывает первые `limit` аватаров, не создаёт представлений для остальных и показывает свой `overflow`, пока `total` больше. См. [Avatar](../elements/avatar.md).

### Progress

Линейный индикатор прогресса, без внешнего вида: трек с индикатором внутри, ширина индикатора — `value` процентов от ширины трека. Приложение владеет `value` (от 0 до 100) и `indeterminate`; скринридеры получают роль progress bar, диапазон и значение, а в неопределённом состоянии значения нет, и тогда ширина и движение индикатора определяются приложением. См. [Progress](../elements/progress.md).

### NumberInput

Число, вводимое в поле или изменяемое шагами, без внешнего вида: поле (`Input`), кнопка уменьшения перед ним и кнопка увеличения после него (или обе столбцом справа, `controlsRight`). Приложение владеет `value` (число или `null`; либо input хранит своё значение, исходя из `defaultValue`) и получает `onChange` с числом, которое прочитано из поля. Поле принимает число или текст на пути к нему, включая цифры и знаки других клавиатур; кнопки, Up / Down и Page Up / Page Down меняют значение с шагом `step`, сохраняя десятичные знаки, вплоть до `min` и `max`, а при уходе из поля введённое значение приводится к ним. Для скринридеров поле — spin button, чьи действия increment и decrement меняют его шагами. См. [NumberInput](../elements/number-input.md).

### Slider

Значение или диапазон из двух значений, выбираемые вдоль трека, без внешнего вида: трек, принимающий нажатия и перетаскивание, индикатор внутри него, на который отображаются значения, диапазон и один thumb на каждое значение. Приложение владеет `value` (число или `[start, end]`; либо slider хранит своё значение, исходя из `defaultValue`) и получает `onChange` для каждого нового значения, привязанного к `step` от `min`, и `onChangeEnd` один раз за изменение; `scale` распределяет значения линейно или по порядкам величины, `axis` раскладывает трек горизонтально или вертикально. Каждый thumb для скринридеров — adjustable-элемент со своим значением, остановка фокуса клавиатуры, и двигается клавишами slider из WAI-ARIA. См. [Slider](../elements/slider.md).

### Scrollbar

Полоса прокрутки с собственным внешним видом приложения для scroll view или списка, размещаемая там, где нужно приложению, без внешнего вида по умолчанию: трек (`class` полосы) и thumb в нём (`thumbClass`). Она называет свой scroll view (`scroll`, его `ref`) и следует за его смещением, содержимым и видимой областью; перетаскивание thumb прокручивает содержимое, а нажатие на трек переносит середину thumb в это место. `mode` показывает её, пока содержимое прокручивается (и `motion.idle` после), пока указатель находится над полосой или постоянно; `axis` делает её горизонтальной. `Scrollbar.setTheme` даёт каждому scroll view и списку полосу во внешнем виде приложения поверх его видимой области, не требуя её размещать, а view может принимать собственную тему через prop `scrollbar`. См. [Scrollbar](../elements/scrollbar.md).

### ColorPicker

Выбор цвета без внешнего вида: корень хранит цвет, а части внутри него показывают и меняют его, располагаясь так, как решит приложение. `ColorArea` — насыщенность и яркость HSB, `ColorSlider` — любой канал RGB, HSL, HSB или OKLCH либо альфа-канал (горизонтально или вертикально), `ColorField` — цвет в любой форме CSS или число канала, `ColorSwatch` — пресет, выбираемый нажатием, или предпросмотр цвета, `ColorEyeDropper` — кнопка, выбирающая цвет на экране (macOS, веб). Приложение владеет `value` (либо picker хранит своё значение, исходя из `defaultValue`) и получает `onChange` и `onChangeEnd` с цветом и его текстом в том виде, как его записывает `format`; picker хранит каналы каждого пространства так, как их задал пользователь. Thumb — adjustable-элементы для скринридеров и остановки фокуса клавиатуры. См. [ColorPicker](../elements/color-picker.md).

### OtpInput

Одноразовый числовой код фиксированной длины, без внешнего вида: одно нативное текстовое поле поверх ячеек принимает клавиатуру, поэтому ввод, вставка, цифровая клавиатура и автозаполнение кода системой — на стороне платформы, а скринридеры находят одно текстовое поле. Вводятся только цифры, не больше `length`; Backspace удаляет последнюю. Приложение владеет `value` (или передаёт `defaultValue`) и получает `onChange` и `onComplete`; оно оформляет ячейки (`focus:` у той, что примет следующую цифру, `data-filled:` у тех, что содержат цифру), их группы и каретку. См. [OtpInput](../elements/otp-input.md).

### Pagination

Страницы набора, между которыми можно переходить; ориентир навигации без внешнего вида: Previous, первая и последняя страницы, текущая со своими соседями (`visiblePages`), многоточие для каждого пропущенного участка, дочерние элементы приложения и Next; `compact` оставляет Previous, дочерние элементы и Next. Приложение владеет `page` и получает `onChange({ page })`; текущая страница — `selected:` и текущая страница для скринридеров. Приложение оформляет элементы (`itemClass`) или рисует их (`renderItem`). См. [Pagination](../elements/pagination.md).

### Command

Палитра команд: поле поиска над командами приложения (`items`: `id`, `label`, `keywords`, `group`, `shortcut` для показа, `disabled`, `checked`), фильтруемыми нативно по мере ввода (запрос содержится в подписи или ключевом слове, регистр не учитывается; разделы без совпадений исчезают), в виртуализированном списке, который создаёт только видимые строки. Up и Down двигают подсветку, Return или нажатие выбирает (`onSelect({ id })`), Escape очищает запрос, а затем сообщает `onCancel`, где приложение закрывает окружающий `Dialog`. Запрос принадлежит приложению (`query`, `onQueryChange`) или самому полю; с `filterable={false}` и `loading` приложение отвечает на него с сервера. Приложение оформляет каждую часть (`itemClass` с `focus:` для подсветки, `checked:`, `disabled:`) и рисует строки (`renderItem`, получающий сочетание клавиш в том виде, как оно показано здесь). См. [Command](../elements/command.md).

### Tree

Элементы, содержащие элементы: файлы проекта, боковая панель настроек, структура документа. `items` — данные (`TreeItem`: `id`, `label`, `children`, `disabled`), а строки виртуализированы: создаются только видимые, а дочерние элементы свёрнутого элемента не создаются никогда, поэтому дерево из тысяч элементов остаётся быстрым. Приложение владеет id развёрнутых элементов и выбранным элементом (`expanded`, `selected`, с `onExpandedChange` и `onSelectedChange`) или дерево хранит своё состояние (`defaultExpanded`, `defaultSelected`). Нажатие выбирает строку и разворачивает или сворачивает папку; дерево — одна остановка фокуса клавиатуры, чьи стрелки двигают выбор (Right и Left разворачивают, сворачивают, входят в папку и выходят из неё), а также Home, End, Return, Space и typeahead. Приложение оформляет строки (`itemClass` с `selected:`, `aria-expanded:`, `focus:`) и рисует их (`renderItem`, получающий `depth` каждого элемента). См. [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

Элементы, из которых строятся графики, как `gpui-base` у `plot`, находятся в отдельном модуле: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
являются проверяемыми ключами или функциями строки), `point`, `linear` или `band` шкалы его осей, строка под указателем
(`onHoverChange`) и её движение (`motion`: появление, затухание при наведении и плавное скольжение); его метки рисуются нативно по
строкам, без JS на каждую точку, и закрашиваются свойствами заливки SVG (`stroke-*`, `fill-*`), `currentColor` там, где ничего
не задано; `Area` или `Bar` показывает фон (градиент, `bg-linear-*`) внутри своих фигур. Столбцы стоят в
полосах шкалы `band`, рядом друг с другом или стопкой в `stack`, вырастают при появлении графика и бледнеют, кроме строки
под указателем, с частью `label` на конце каждого столбца.
Перекрестие при наведении, точки (у каждой метки своя, с `hoverDotClass`) и подсказка (`tooltipPlacement`, остаётся внутри графика) — это части, которые приложение стилизует и наполняет, а перемещаются они
нативно; подписи осей — собственные элементы приложения. `Pie` делит оборот на сектор для каждой строки (кольцевая диаграмма с
`innerRadius`), каждый закрашивается своими классами (`sliceClass`, функция от его строки), а `Arc` рисует один сектор
между двумя углами (дорожка и значение индикатора); над круговой диаграммой график сообщает о секторе под указателем, который приподнимается
(`hoverLift`), пока остальные бледнеют (`hoverDim`). `Sankey` рисует потоки между строками (`links`), раскладывая их
так, как это делает d3-sankey; каждый узел и лента закрашиваются своими классами, узлы подписаны, реагируют на наведение и перемещаются к новым потокам. `Treemap` выкладывает строки плиткой как иерархию вложенных
прямоугольников (`id`, `parent`), площадь каждого листа равна его `value`, цвет задаётся по категории или вдоль градиента
`colorScale` графика, подписи показываются там, где помещаются. См. [Plot](../elements/plot.md).

<a id="workspaces"></a>

## Рабочие пространства

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup и ResizablePanel

Панели рядом или одна над другой, между каждыми двумя — ручка, которую пользователь перетаскивает, чтобы распределить место. Группа отвечает
за перетаскивание, которое выполняется нативно, за пределы каждой панели (`minSize`, `maxSize`) и курсор изменения размера; размеры
принадлежат приложению (`size`, сообщаются через `onResize`), как и внешний вид ручек и содержимое панелей. См.
[Resizable](../elements/resizable.md).

### DockArea

Рабочее пространство с закрепляемыми панелями: панели в группах вкладок, группы делятся рядом или одна над другой, а доки располагаются у левого, правого и
нижнего краёв. Раскладка — это данные, которыми владеет приложение (`layout`, сообщаются через `onLayoutChange`); область отвечает за перетаскивание вкладок и
их сброс, изменение размеров, доки, масштабирование и блокировку, сохраняет содержимое каждой панели при перемещении и показывает ту же раскладку
в виде выдвижных панелей и нижнего листа, когда места мало. Вкладки, ручки, индикатор сброса и содержимое панелей
принадлежат приложению. См. [Dock](../elements/dock.md).

<a id="documents"></a>

## Документы

### TextView

`TextView` показывает документ из Markdown, HTML или блоков, которые строит приложение, и рисует его элементами и представлениями [`Text`](../elements/text.md):
заголовки, списки, код, таблицы, изображения, формулы, сноски и собственный синтаксис приложения. Он создан для
ответов ИИ-чата, поступающих потоком, с типографикой для чтения в цветах темы, которую приложение переопределяет по частям, и
функциями отрисовки, которые вставляют содержимое приложения на нужные места. См. [TextView](../elements/text-view.md).

<a id="code"></a>

## Код

### Editor

`Editor` — редактор кода для более чем пятидесяти языков: подсветка синтаксиса, номера строк, несколько кареток, сворачивание,
мягкий перенос, поиск и замена, диагностика и оформление, с привычными клавишами редакторов кода. Текст принадлежит приложению
(`value` и `onChange`), как и панель поиска, которая управляет `search` редактора. Он поставляется с оформлением, построенным из
токенов темы, которое приложение переопределяет по частям. См. [Editor](../elements/editor.md).

### DiffView

`DiffView` показывает изменения между двумя текстами или в файлах патча, как инструменты код-ревью: рядом или
единым списком, с подсветкой изменённых слов внутри строк и неизменёнными строками, свёрнутыми в разделители, которые можно раскрыть, в цветах синтаксиса
`Editor`. Действия приложения сохраняют или отменяют каждое изменение. См. [DiffView](../elements/diff-view.md).

### Table

`Table` и его части раскладывают несколько строк, которые приложение пишет как дочерние элементы, и предоставляют программам чтения с экрана таблицу: группы строк,
строки, заголовки столбцов и ячейки. Каждая часть принимает оформление приложения. См. [Table](../elements/table.md).

### DataTable

`DataTable` показывает строки и столбцы и прокручивается в обе стороны при любом их количестве, отрисовывая только видимые ячейки. Строки,
столбцы или ячейки выделяются; столбцы меняют размер, перемещаются, закрепляются и сортируются (сортирует приложение); приложение отдаёт строки по страницам
и может рисовать ячейки и заголовки. См. [DataTable](../elements/data-table.md).

<a id="navigation"></a>

## Навигация

`NavStack` из `NavPage` — это `UINavigationController` на iOS и стек с панелью инструментов и предиктивным возвратом на
Android; на настольных платформах и в вебе каждая страница показывает собственный `header` приложения. См.
[NavStack](../elements/nav-stack.md), где также описаны `createNavStack` и уход со страницы.

### Dialog

`Dialog` показывает содержимое поверх всего остального, включая заголовок стека, в собственном нативном оконном слое. Его
всплывающее окно и фон стилизуются приложением. См. [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## Диалоги-предупреждения

### AlertDialog

`AlertDialog.show(options)` показывает собственное предупреждение платформы или лист действий и завершается значением `{ action }`, то есть `id`
действия, выбранного пользователем. См. [AlertDialog](../elements/alert-dialog.md).

## Input

`Input` — это нативное текстовое поле платформы: однострочное или многострочное, в котором ввод, каретку, выделение,
автокоррекцию и автозаполнение обрабатывает платформа. Значением и внешним видом владеет приложение. Его свойства — тип `InputProps` (с `IOSInputProps` для `ios={{…}}`), экспортируемый рядом с ним. См. [Input](../elements/input.md).

<a id="status-bar"></a>

## Строка состояния

Строка состояния принадлежит тому, что находится на экране, как в UIKit, где каждый view controller объявляет свой
`preferredStatusBarStyle`, а решает самый верхний. В NSH эти view controller — страницы и диалоги: 
`NavPage` или `Dialog` объявляет нужную ему строку состояния через `statusBar`, а приложение объявляет значение по умолчанию в
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

`statusBar` принимает следующие поля, каждое необязательное (в Rust — только `StatusBarStyle`, либо методы построителя
`StatusBarSetting` с теми же именами):

| Поле | Тип | Описание |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | Цвет содержимого (время, батарея, сигнал): `"light"` для тёмного фона, `"dark"` для светлого, `"auto"` — выбор платформы для текущего оформления. |
| `hidden` | `boolean` | Скрывает строку состояния. |
| `animated` | `boolean` | Анимирует изменение, когда страница или диалог появляются и исчезают. |

Значение реактивно: `statusBar={{ foreground: dark() ? "light" : "dark" }}` следует за сигналом, как и замыкание
Rust, которое его читает.

<a id="which-one-applies"></a>

### Какое значение применяется

Решает страница или диалог, показанные **последними**, **по каждому полю отдельно**: страница, добавленная в стек, находится над страницами
ниже, а открытый диалог — над страницами. Поле, которое она не задаёт, берётся у нижележащей, а в конце концов
из значения приложения по умолчанию. Когда страница убирается из стека или диалог закрывается, снова применяется нижележащая.

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

### Значение по умолчанию для приложения

`nsh.json`: `"statusBar"` — это настройка, лежащая под каждой страницей и диалогом, подобно `UIStatusBarStyle` и
`UIStatusBarHidden` из Info.plist в приложении UIKit:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

Оба поля необязательны. Без него содержимое имеет значение `"auto"`, а строка показывается. Упакованные приложения iOS также показывают её на
экране запуска.

<a id="the-status-bar-on-each-platform"></a>

### Строка состояния на каждой платформе

- **iOS**: скрытие и показ анимируются затуханием. В приложении, [встроенном](../docs/ios.md) в нативное,
  вид строки состояния определяет view controller хост-приложения. Хост применяет настройку NSH, возвращая
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` и
  `NshAppView.preferredStatusBarUpdateAnimation` из своего view controller.
- **Android**: приложения рисуются от края до края, под строкой состояния (Android 15, API 35): собственный фон приложения —
  это фон строки, а `foreground` сохраняет читаемость её содержимого на нём.
- **Настольные платформы и веб**: заголовок окна и панели браузера принадлежат системе и браузеру;
  `statusBar` и `"statusBar"` из `nsh.json` предназначены для телефонов.

> [!IMPORTANT]
> Когда ваш `nsh.json` объявляет `"capabilities"`, строка состояния меняется, только если они включают
> `"statusBar": true`; остальные изменения отклоняются и записываются в журнал. См.
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## См. также

- [Руководство по навигации](../docs/navigation.md).
- [Формы и клавиатура](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) и [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) и
  [Input](../elements/input.md).
- [Устройство и окружение](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` и другие API только для Android.
