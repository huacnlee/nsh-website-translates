---
title: "nsh/base"
description: "用於應用程式 UI 的無樣式基礎元件：按鈕、連結、頭像、輪播、核取方塊、單選按鈕、開關、分頁標籤、切換按鈕、工具列、樹狀檢視、選取器、組合方塊、命令面板、日曆、日期選擇器、時間欄位、可調整大小的面板、可停靠的工作區、Markdown 與 HTML 文件、程式碼編輯器、差異比對、文字輸入框、導覽堆疊與對話框、系統警示對話框，以及頁面與對話框的狀態列。"
order: 2.5
demo: ui-navigation
---

# nsh/base

`nsh/base` 是應用程式 UI 的基礎元件層：在每個平台上，提供負責行為、狀態、焦點與無障礙功能的無樣式元件。它位於基本元件（`nsh`、`nsh/mobile` 與 `nsh/desktop`）和應用程式自己的元件庫之間，如同 GPUI Kit 中 `gpui-base` 位於 `gpui` 與有樣式的元件庫之間（參見[模組](./index.md#three-layers)）。它提供控制項（`Button`、`Link`、`Checkbox`、`ColorPicker` 及其 `ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch` 與 `ColorEyeDropper`、`NumberInput`、`Radio`（在 `RadioGroup` 中）、`Slider`、`Switch`、`Tab`（在 `Tabs` 中）、`Toggle`（在 `ToggleGroup` 中）、`Select`、`Combobox`、`Calendar`、`TimeField`、`DatePicker`）、命令面板（`Command`）、控制項列（`Toolbar` 及其 `ToolbarGroup` 與 `ToolbarSeparator`）、具有應用程式自有外觀的捲軸（`Scrollbar`）、可展開與收合的區域（`Collapsible`，以及 `Accordion` 及其 `AccordionItem`、`AccordionHeader`、`AccordionTrigger` 與 `AccordionPanel`）、進度列（`Progress`）、一次性驗證碼（`OtpInput`）、集合中的各個頁面（`Pagination`）、可包含項目的項目（`Tree`）、組成圖表的各個部分（`Plot` 搭配 `Line`、`Area`、`Bar`、`Rule`、`Dot`、`Cell`、`Grid`、`Pie` 與 `Arc`，位於 `nsh/base/plot` 中）、使用者可自行排列的工作區（`ResizablePanelGroup` 中的多個 `ResizablePanel`，以及 `DockArea` 的分割區、分頁群組與停靠區）、輪播（`Carousel` 及其各部分）、Markdown 或 HTML 文件（`TextView`）、程式碼編輯器（`Editor`）、文字之間的差異（`DiffView`）、由列與欄組成的表格（`Table` 及其各部分、`DataTable`）、文字輸入（`Input`）、顯示在所有內容之上的彈出視窗（`Popover`、`Menu` 與 `ContextMenu` 搭配其 `MenuItem`、`MenuSeparator` 與 `Submenu`、`Tooltip`、`Sheet`）、Toast 通知（`ToastStack` 中的 `Toast`，其生命週期位於 `ToastManager` 中）、導覽（由你以 `createNavStack` 建立的狀態所驅動、由多個 `NavPage` 組成的 `NavStack`，以及用於在其他所有內容之上呈現內容的 `Dialog`），以及系統的警示對話框（`AlertDialog`）。頁面與對話框也會決定狀態列（`statusBar`）。

基礎集合還包含 `Avatar` 與 `AvatarGroup`：前者是具有原生圖片載入狀態的圖片，後者是會顯示前 `limit` 個頭像的一列頭像。

外觀由應用程式決定：頁面、對話框或標題內的內容是你自己的 JSX，以基本元件搭配樣式、[Tailwind](../docs/tailwind.md) 類別與你的主題組成，也可以使用[你自己的 crate](../docs/rust.md) 中的 Rust 元件，或社群基於 `nsh/base` 建構的元件庫。每個主機都提供 `nsh/base`；Rust 應用程式則透過 `nsh-base` crate（`nsh_base::{button, dialog, …}`）使用相同的 API。

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

本頁是模組的索引：每個元件都有自己的元素頁面，包含範例、屬性與平台注意事項。逐步教學請參閱[導覽指南](../docs/navigation.md)與[表單與鍵盤](../docs/forms-and-keyboard.md)。

| TSX | Rust | 說明 |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | 具有停用與選取狀態，並為螢幕閱讀器提供角色的按壓目標。 |
| [`Link`](../elements/link.md) | `link()` | 會前往某處的按壓目標：透過系統開啟其 `href`，或由應用程式自行開啟（`openWith="app"`、`onOpen`）。 |
| [`Avatar`](../elements/avatar.md)、[`AvatarGroup`](../elements/avatar.md) | `avatar()`、`avatar_group()` | 人物的圖片，並在載入中、載入失敗以及沒有圖片時顯示備用內容（姓名縮寫、應用程式圖示）；以及顯示前 `limit` 個頭像與溢出數量的一列頭像。載入狀態由原生處理。 |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | 已勾選、未勾選或不確定狀態的控制項，其指示器由應用程式設定樣式與標記。 |
| [`Radio`](../elements/radio.md)、[`RadioGroup`](../elements/radio.md) | `radio()`、`radio_group()` | 使用者從一組選項中擇一選取的單一選項，以及該選項組；由應用程式決定哪一個為已選取。 |
| [`Switch`](../elements/switch.md) | `switch()` | 開／關控制項，其軌道與滑塊由應用程式設定樣式。 |
| [`Tab`](../elements/tabs.md)、[`Tabs`](../elements/tabs.md) | `tab()`、`tabs()` | 分頁列中的單一分頁，以及分頁列；由應用程式決定哪一個被選取並顯示其內容。 |
| [`Toggle`](../elements/toggle.md)、[`ToggleGroup`](../elements/toggle.md) | `toggle()`、`toggle_group()` | 可開啟或關閉的按鈕，以及由這些按鈕組成的工具列；由應用程式決定哪些處於按下狀態。 |
| [`Toolbar`](../elements/toolbar.md)、[`ToolbarGroup`](../elements/toolbar.md)、[`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`、`toolbar_group()`、`toolbar_separator()` | 由按鈕、切換鈕與連結組成的列：僅佔鍵盤焦點的一個停駐點，方向鍵可在其中移動；另有相關項目的群組以及它們之間的分隔線。 |
| [`Carousel`](../elements/carousel.md) 及其各部分 | `carousel()`、`carousel_content()`、`carousel_item()`、`carousel_previous()`、`carousel_next()`、`carousel_pagination()`、`carousel_pagination_item()` | 以平台原生捲動方式一次顯示一處的投影片，具備上一張／下一張、分頁指示、按鍵操作與無縫循環；由應用程式決定 `index`。 |
| [`Select`](../elements/select.md) | `select()` | 從項目清單中選取一個值：在桌面上是位於觸發元件處的彈出視窗，在手機上是底部面板；由應用程式決定 `value` 並繪製觸發元件。 |
| [`Combobox`](../elements/combobox.md) | `combobox()` | 從項目清單中選取一個值或多個值（`multiple`），清單會依在其輸入欄中輸入的文字篩選；由應用程式決定 `value` 並設定欄位樣式。 |
| [`Calendar`](../elements/calendar.md) | `calendar()` | 從以月份呈現的日期中選取一個日期或日期範圍，具備月份與年份檢視及鍵盤操作；由應用程式決定 `value` 並繪製各項目。 |
| [`TimeField`](../elements/time-field.md) | `time_field()` | 逐段編輯的一天中的時間（時、分、秒、AM/PM）；由應用程式決定 `value`。 |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | 從日曆中選取日期、範圍或日期與時間：在桌面上是位於觸發元件處的彈出視窗，在手機上是底部面板；由應用程式決定 `value` 並繪製觸發元件。 |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | 內容可展開與收合的區域；由應用程式決定 `open` 及其觸發元件。 |
| [`Accordion`](../elements/accordion.md)、[`AccordionItem`](../elements/accordion.md)、[`AccordionHeader`](../elements/accordion.md)、[`AccordionTrigger`](../elements/accordion.md)、[`AccordionPanel`](../elements/accordion.md) | `accordion()`、`accordion_item()`、`accordion_header()`、`accordion_trigger()`、`accordion_panel()` | 堆疊的區段，在各自標題下展開與收合，一次一個或多個（`multiple`）；由應用程式決定 `value`，即已展開的項目。 |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | 以應用程式設定樣式的儲存格呈現的一次性驗證碼；由應用程式決定 `value`，`onComplete` 會在輸入完成時通知。 |
| [`Pagination`](../elements/pagination.md) | `pagination()` | 集合中的各個頁面：上一頁、目前頁面前後的頁面（以省略號分隔）、應用程式的子元素以及下一頁；由應用程式決定 `page`。 |
| [`Command`](../elements/command.md) | `command()` | 命令面板：位於應用程式命令上方的搜尋欄位，以原生方式依標籤與關鍵字篩選，並顯示於虛擬化清單中；按下 Return 或點按即可選擇（`onSelect`），置於 `Dialog` 中即成為 Cmd+K 面板。 |
| [`Tree`](../elements/tree.md) | `tree()` | 可包含項目的項目，已虛擬化：可展開與收合、可選取一個、僅佔鍵盤焦點的一個停駐點；由應用程式決定 `expanded` 與 `selected`，或由樹狀結構自行維護。 |
| [`Progress`](../elements/progress.md) | `progress()` | 進度列；由應用程式決定 `value`（0 到 100）與 `indeterminate`。 |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | 在欄位中輸入，或以按鈕與按鍵逐步調整的數字；由應用程式決定 `value`（或由輸入元件根據 `defaultValue` 自行維護）。 |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | 為其所指定的捲動檢視或清單（`scroll`）提供應用程式自有外觀的捲軸；其滑塊會跟隨內容，拖曳與點按都會捲動內容。 |
| [`Slider`](../elements/slider.md) | `slider()` | 沿著軌道選取的一個值，或由兩個值組成的範圍；由應用程式決定 `value`（或由滑桿根據 `defaultValue` 自行維護）。 |
| [`ColorPicker`、`ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch`、`ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`、`color_area()`、`color_slider()`、`color_field()`、`color_swatch()`、`color_eye_dropper()` | 色彩選擇器及其各部分：飽和度與亮度區域、RGB、HSL、HSB 或 OKLCH 任一色版以及 alpha 的滑桿、色彩或單一色版的欄位、色票、滴管；由應用程式決定 `value`（或由選擇器根據 `defaultValue` 自行維護）。 |
| [`ResizablePanelGroup`、`ResizablePanel`](../elements/resizable.md) | `h_resizable()`、`v_resizable()`、`resizable_panel()` | 並排或堆疊的面板，使用者可拖曳控制把手來調整其大小。 |
| [`DockArea`](../elements/dock.md) | `dock_area()` | 由分割區、分頁群組與邊緣停靠區組成、可供使用者自行排列的工作區；其版面配置是應用程式的資料。 |
| [`NavStack`、`NavPage`、`createNavStack`](../elements/nav-stack.md) | `nav_stack()`、`nav_page()` | 原生導覽堆疊及其頁面。 |
| [`Dialog`](../elements/dialog.md) | `dialog()` | 呈現在其他所有內容之上的內容：底部面板、全螢幕流程、對話框。 |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | 平台的警示或動作面板。 |
| [`TextView`](../elements/text-view.md) | `text_view()` | 由 Markdown、HTML 或區塊組成的文件，以文字與檢視繪製，適用於串流的 AI 回覆。 |
| [`Editor`](../elements/editor.md) | `editor()` | 程式碼編輯器：語法醒目提示、多游標、程式碼摺疊、尋找與取代、診斷。 |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | 兩段文字之間或修補檔的差異，可並排或合併顯示，並提供逐項變更的操作。 |
| [`Table`、`TableHeader`、`TableBody`、`TableFooter`、`TableRow`、`TableHead`、`TableCell`、`TableCaption`](../elements/table.md) | `table()`、`table_row()`、... | 由應用程式自有的列與儲存格組成的表格，並為螢幕閱讀器提供表格角色。 |
| [`DataTable`](../elements/data-table.md) | `data_table()` | 可容納任意數量列與欄的表格：選取、排序、固定、可調整大小與可移動的欄，以及一次提供一頁的列。 |
| [`Input`](../elements/input.md) | `nsh_base::input()` | 平台原生的文字輸入，單行或多行。 |
| [`Popover`](../elements/popover.md) | `popover()` | 錨定於觸發元件、位於所有內容之上的內容。 |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | 當指標停留在觸發元件上時（觸控螢幕上則為點按），顯示其所指向內容的預覽。 |
| [`Menu`、`ContextMenu`、`MenuItem`、`MenuSeparator`、`Submenu`](../elements/menu.md) | `menu()`、... | 選單：在桌面上是帶有階層式子選單的彈出視窗，在手機上是底部面板；包含可勾選的項目與單選項目。 |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | 顯示在觸發元件旁的提示。 |
| [`Sheet`](../elements/sheet.md) | `sheet()` | 位於螢幕邊緣、覆蓋在背景遮罩之上的面板。 |
| [`Toast`、`ToastStack`、`ToastManager`](../elements/toast.md) | `toast()`、`toast_stack()`、`ToastManager` | 無樣式的 Toast 通知：語意根元素、層疊的圖層，以及它們的生命週期。 |
| 頁面與對話框上的 `statusBar` | `.status_bar(..)` | 頁面或對話框顯示期間的狀態列。參見[狀態列](#status-bar)。 |

在 Rust 中，`theme()` 會將應用程式的主題讀取為設計權杖（`theme().primary`、`theme().radius`），與 TSX 的[主題類別](../docs/tailwind.md#theme-tokens)所使用的權杖相同。

<a id="controls"></a>

## 控制項

### Button

擁有自身行為但沒有外觀的按壓目標：處理按壓、停用與選取狀態，並為螢幕閱讀器提供其角色。其外觀是應用程式的 `class` 與 `style` 搭配狀態變體，其內容是它的子元素。參見 [Button](../elements/button.md)。

### Link

會前往某處且沒有外觀的按壓目標：處理按壓、在取得鍵盤焦點時的 Return 與 Space、停用狀態、為螢幕閱讀器提供的連結角色，以及導覽中的目前頁面（`current`）。`href` 是它要前往的位置，不會顯示出來：按壓時會回報該位置（`onOpen`），接著在應用程式之外開啟網頁或其他應用程式的連結，或在使用 `openWith="app"` 時，將開啟的工作交由應用程式自己的路由處理。參見 [Link](../elements/link.md)。

### Checkbox

擁有自身行為但沒有外觀的已勾選、未勾選或不確定狀態控制項：處理按壓、鍵盤啟動、停用狀態，並為螢幕閱讀器提供核取方塊角色與值（不確定時為 mixed），其值由應用程式持有（`checked`、`indeterminate`、`onChange`）。應用程式為核取方塊及其指示器設定樣式，指示器的 `checked:`、`indeterminate:` 與 `disabled:` 類別會跟隨核取方塊，並在指示器中放入應用程式自己的標記（`indicator`）。參見 [Checkbox](../elements/checkbox.md)。

### Radio and RadioGroup

使用者從一組選項中恰好選取一個的單一選項，以及包住它們的選項組。Radio 擁有自身行為但沒有外觀：處理按壓、鍵盤啟動、停用狀態，並為螢幕閱讀器提供單選按鈕角色與已選取狀態。群組是螢幕閱讀器會朗讀的單選按鈕群組，本身不持有值：由應用程式告知每個 radio 是否已被選取（`checked`），對未選取者的按壓會請求將其選取（`onChange`）。應用程式的指示器與標籤是 radio 的子元素，其 `group-checked:` 類別會跟隨它。參見 [Radio](../elements/radio.md)。

### Switch

擁有自身行為但沒有外觀的開／關控制項：處理按壓、鍵盤啟動、停用狀態，並為螢幕閱讀器提供切換開關角色與值，其值由應用程式持有（`checked`、`onChange`）。應用程式為開關、其軌道與滑塊設定樣式，其 `checked:` 與 `disabled:` 類別會跟隨開關。參見 [Switch](../elements/switch.md)。

### Tab and Tabs

分頁列中的各個分頁，以及包住它們的分頁列。Tab 擁有自身行為但沒有外觀：處理按壓、鍵盤啟動、停用狀態，並為螢幕閱讀器提供分頁角色與已選取狀態。分頁列是螢幕閱讀器會朗讀的分頁列表，本身不持有值：由應用程式告知每個分頁是否已被選取（`selected`）、接收按壓事件（`onPress`），並自行顯示所選區段的內容。應用程式的標籤是分頁的子元素，其 `group-selected:` 類別會跟隨它。分頁列的指示器（`indicatorClass`、`indicatorStyle`）是由應用程式設定樣式的底線或膠囊形狀，位於被選取的分頁上，並以原生方式彈跳移動到下一個分頁。參見 [Tabs](../elements/tabs.md)。
### Carousel

一次顯示一張投影片（商品照片、新手引導、橫幅、一排卡片）。內容是原生捲動視圖，會對齊各投影片的起點，因此手指、滑鼠滾輪與觸控板都會與指標在同一影格內移動投影片；靜止時，輪播會以 `onChange` 回報目前顯示的投影片。上一張與下一張（`CarouselPrevious`、`CarouselNext`）、分頁（`CarouselPagination` 中的多個 `CarouselPaginationItem`，其指示器會彈跳到目前顯示的投影片）與方向鍵都以原生方式移動投影片，並以 `looping` 無縫地繞過首尾。目前顯示的投影片是應用程式的 `index`，會自行前進的投影片由應用程式自己的計時器推進（`onDragStart` / `onDragEnd`、`onFocus` / `onBlur` 說明何時該等待）；外觀與每個標籤都由應用程式決定。請參閱 [Carousel](../elements/carousel.md)。

### Toggle and ToggleGroup

一個開或關的按鈕（粗體、我的最愛、檢視選項），以及由這些按鈕組成的工具列。Toggle 自行負責行為，沒有外觀：按下、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的按鈕角色與其按下狀態。群組是螢幕閱讀器會朗讀的工具列，是鍵盤焦點的一個停靠點，其方向鍵會在各 toggle 之間移動而不按下它們，且不持有任何值：應用程式告知每個 toggle 是否被按下（`pressed`），接收 toggle 所要求的值（`onChange`），並可讓任意數量被按下，或恰好一個被按下。群組上的 `disabled` 會停用其中每個 toggle。應用程式的圖示或標籤是 toggle 的子元素，其 `group-aria-pressed:` class 會跟隨它。請參閱 [Toggle](../elements/toggle.md)。

### Toolbar, ToolbarGroup and ToolbarSeparator

一列控制項：文字編輯器的格式設定、媒體播放器的播放控制、垂直的工具面板。工具列是螢幕閱讀器會朗讀的對象（由 `accessibilityLabel` 命名），也是鍵盤焦點在其內部 `Button`、`Toggle` 與 `Link` 上的一個停靠點：Tab 會進入上次離開時所在的項目，其 `axis` 的方向鍵沿著工具列移動，Home 與 End 跳到兩端，且都不會按下任何項目。`ToolbarGroup` 是一組有名稱的相關項目（復原與重做、對齊方式），而工具列內的 `ToggleGroup` 是它的其中一個群組，其 toggle 即是工具列的項目。`ToolbarSeparator` 是應用程式在各組之間繪製的一條線。工具列或群組上的 `disabled` 會停用其中每個項目。工具列不持有任何值，也沒有外觀：每個控制項各自保有自己的狀態，而工具列、其群組與分隔線的樣式由應用程式決定。請參閱 [Toolbar](../elements/toolbar.md)。

### Select

從以資料給定的項目清單中選出一個值（`items`：各有一個值與一個標題，可選擇停用或歸入某個區段），沒有外觀。由應用程式的觸發器開啟清單：桌面平台上是位於觸發器處的彈出視窗，手機與平板上是位於底部的面板（sheet）。Select 負責鍵盤操作（上、下方向鍵、Home、End、Page Up 與 Page Down、輸入即跳選、Return 與 Escape）、搜尋（`searchable`）、反白的列（`itemClass` 上的 `focus:`；`renderItem` 取得的是項目為何，絕不包含其狀態），以及供螢幕閱讀器使用的 combobox、listbox 與 option 角色。值由應用程式擁有（`value`、`onChange`），或交由 select 自行管理（`defaultValue`），並由應用程式為每個部分設定樣式或繪製各列。請參閱 [Select](../elements/select.md)。

### Combobox

從項目清單中選出多個值，清單與 select 的相同，並可在 combobox 的輸入框中輸入以篩選，沒有外觀：可選一個，或搭配 `multiple` 選多個，此時選擇會切換該項目，而清單保持開啟。值是一個陣列，由應用程式擁有（`value`、`onChange`）或交由 combobox 管理（`defaultValue`）；清單關閉時，`onConfirm` 會回報該值。查詢文字可由應用程式持有（`query`、`onQueryChange`），頁尾會顯示在各列下方，清除按鈕會清空該值。請參閱 [Combobox](../elements/combobox.md)。

### Calendar

從一個個月份的日期中選出一個日期，或搭配 `range` 選出一段日期範圍，沒有外觀。可並排顯示一個月或多個月（`numberOfMonths`）；標題列負責翻月，並開啟月份檢視或年份頁面。值是 ISO 日期（`"2026-10-28"`）或 `[start, end]`，由應用程式擁有（`value`、`onChange`）或交由 calendar 管理（`defaultValue`）；`disabledMatcher` 可避免某些日期被選取，而日期以單一 Tab 停靠點的方式接收鍵盤操作。各部分的樣式與項目的繪製（`renderItem`，取得的是項目為何；其狀態即是它的 class，範圍中的日期為 `selected:`，並帶有 `data-range-start:`、`data-range-middle:` 與 `data-range-end:`）都由應用程式決定。請參閱 [Calendar](../elements/calendar.md)。

### TimeField

以一次一個欄段的方式編輯一天中的時間，沒有外觀：時、分、秒（`precision`）與 AM/PM（`hourCycle="h12"`），可透過步進、輸入或手機的數字鍵盤編輯。值為 24 小時制的 `"HH:MM"`（`"HH:MM:SS"`），由應用程式擁有（`value`、`onChange`）或由欄位自行管理（`defaultValue`）。請參閱 [TimeField](../elements/time-field.md)。

### DatePicker

從由應用程式的觸發器開啟的日曆中選取日期，方式與 select 的清單相同：桌面平台上是彈出視窗，手機上是面板（sheet）。值採用 HTML 輸入元素的格式：ISO 日期、搭配 `range` 的 `[start, end]`，或搭配 `timePrecision` 的日期與時間（日曆下方有一個 time field），由應用程式擁有（`value`、`onChange`）或由 picker 自行管理（`defaultValue`）。預設值可設定該值，清除按鈕可清除它，且 `Calendar` 的每個 prop 都會傳遞下去。請參閱 [DatePicker](../elements/date-picker.md)。

### Collapsible

內容可展開與收合的區域，沒有外觀：其子元素一律顯示（摘要、觸發器），其 `content` 則在 `open` 時顯示於子元素之後。應用程式擁有 `open` 以及切換它的觸發器，並在觸發器上向螢幕閱讀器說明展開狀態。內容只建立一次，並在收合時保留，因此其中的內容會保有自己的狀態。搭配 `reveal` 時，它會以原生方式、以彈跳的高度動畫展開與收合。請參閱 [Collapsible](../elements/collapsible.md)。

### Accordion

在標題下方展開與收合的堆疊區段，沒有外觀：由一個 `Accordion` 包含多個 `AccordionItem`，每個 `AccordionHeader` 圍繞著它的 `AccordionTrigger` 與 `AccordionPanel`。應用程式擁有 `value`（即已展開項目的值），並設定按下觸發器時 `onChange` 所回報的內容：一次一個項目，或搭配 `multiple` 一次多個。螢幕閱讀器會聽到一組標題，其按鈕會說明所屬項目是否已展開，而每個展開的面板則視為一個區域（region）。搭配 `reveal` 時，面板會以原生方式、以彈跳的高度動畫展開與收合；搭配 `keepMounted` 時，其內容在收合期間仍保留在樹中。請參閱 [Accordion](../elements/accordion.md)。

### Avatar

一個人的圖片，沒有外觀：備用內容（`name` 的縮寫字母，或應用程式的 `fallback`）與覆蓋其上的圖片（載入完成前為透明），兩者都與 avatar 一樣大，接著是應用程式的子元素（例如在線狀態圓點）。圖片自身的載入與錯誤事件會以原生方式改變其狀態（`onStatusChange`），而 `fallbackDelay` 會在圖片載入期間讓備用內容暫不顯示。螢幕閱讀器會聽到以名稱標示的圖片。`AvatarGroup` 會顯示前 `limit` 個 avatar，不為其餘的建立任何視圖，並在 `total` 更多時顯示其 `overflow`。請參閱 [Avatar](../elements/avatar.md)。

### Progress

線性進度條，沒有外觀：一條軌道，內有一個指示器，指示器的寬度為軌道寬度的 `value` 百分比。應用程式擁有 `value`（0 到 100）與 `indeterminate`；螢幕閱讀器會取得進度條角色、範圍與值，而在不確定狀態時則沒有值，此時指示器的寬度與動態由應用程式決定。請參閱 [Progress](../elements/progress.md)。

### NumberInput

在欄位中輸入或以步進方式調整的數字，沒有外觀：欄位（`Input`）、位於其前的減少按鈕與位於其後的增加按鈕（或兩者以直欄排列在右側，`controlsRight`）。應用程式擁有 `value`（數字或 `null`；或由輸入元素從 `defaultValue` 自行保存），並透過 `onChange` 取得欄位解讀出的數字。欄位接受數字，或接近數字的文字，包括其他鍵盤的數字與符號；按鈕、上 / 下方向鍵與 Page Up / Page Down 會以 `step` 為單位步進，並保留小數位數，最多到 `min` 與 `max`，而離開欄位時，輸入的值會被限制在這些範圍內。對螢幕閱讀器而言，欄位是一個微調按鈕（spin button），其增加與減少動作會對它進行步進。請參閱 [NumberInput](../elements/number-input.md)。

### Slider

沿著軌道挑選一個值或兩個值的範圍，沒有外觀：軌道會接收按下與拖曳，其內的指示器是各值所對應的位置，範圍與每個值各一個滑桿把手（thumb）也在其上。應用程式擁有 `value`（數字或 `[start, end]`；或由滑桿從 `defaultValue` 自行保存），並針對每個新值接收 `onChange`（以 `min` 為起點、依 `step` 對齊），每次變更接收一次 `onChangeEnd`；`scale` 讓值以線性或以數量級分布，`axis` 讓軌道水平或垂直排列。對螢幕閱讀器而言，每個把手都是帶有自身值的可調整元素，也是鍵盤焦點的一個停靠點，並以 WAI-ARIA 的滑桿按鍵移動。請參閱 [Slider](../elements/slider.md)。

### Scrollbar

為捲動視圖或清單提供應用程式自有外觀的捲軸，可放在應用程式想要的位置，沒有外觀：一條軌道（捲軸的 `class`）與其中的滑塊（`thumbClass`）。它會指名其捲動視圖（`scroll`，即其 `ref`），並跟隨該視圖的位移、內容與可視區域；拖曳滑塊會捲動內容，按下軌道會讓滑塊的中央移到該處。`mode` 會在內容捲動時（之後直到 `motion.idle` 為止）、指標位於捲軸上時，或永遠顯示它；`axis` 讓它改為水平。`Scrollbar.setTheme` 會為每個捲動視圖與清單在其可視區域上提供具應用程式外觀的捲軸，無需另行放置，而視圖也可透過其 `scrollbar` prop 採用自己的主題。請參閱 [Scrollbar](../elements/scrollbar.md)。

### ColorPicker

沒有外觀的顏色選取器：根元素持有顏色，其內的各部分負責顯示與變更顏色，並由應用程式排版。`ColorArea` 是 HSB 的飽和度與亮度，`ColorSlider` 是 RGB、HSL、HSB 或 OKLCH 的任一色版或 alpha（水平或垂直），`ColorField` 是任何 CSS 格式的顏色或某個色版的數字，`ColorSwatch` 是按下即可選取的預設色或顏色的預覽，`ColorEyeDropper` 是在螢幕上取色的按鈕（macOS、web）。應用程式擁有 `value`（或由選取器從 `defaultValue` 自行保存），並透過 `onChange` 與 `onChangeEnd` 取得顏色，以及 `format` 所寫出的顏色文字；選取器會依使用者設定的方式保留每個色彩空間的色版。把手是供螢幕閱讀器使用的可調整元素，也是鍵盤焦點的停靠點。請參閱 [ColorPicker](../elements/color-picker.md)。

### OtpInput

固定長度的數字一次性密碼，沒有外觀：覆蓋在各儲存格上的一個原生文字欄位負責接收鍵盤輸入，因此輸入、貼上、數字鍵盤與系統的驗證碼自動填入都由平台處理，螢幕閱讀器只會找到一個文字欄位。只接受數字，最多到 `length`；Backspace 會移除最後一碼。應用程式擁有 `value`（或提供 `defaultValue`），並透過 `onChange` 與 `onComplete` 取得變更；儲存格的樣式、其群組與游標也由應用程式決定（`focus:` 用於接收下一個數字的儲存格，`data-filled:` 用於已有數字的儲存格）。請參閱 [OtpInput](../elements/otp-input.md)。

### Pagination

在一組頁面之間移動，是沒有外觀的導覽地標（navigation landmark）：包含上一頁、第一頁與最後一頁、目前頁及其相鄰頁（`visiblePages`）、每段被省略的頁數對應一個省略號、應用程式的子元素，以及下一頁；`compact` 則只保留上一頁、子元素與下一頁。應用程式擁有 `page` 並透過 `onChange({ page })` 取得變更；目前頁是 `selected:`，也是供螢幕閱讀器使用的目前頁。應用程式為各項目設定樣式（`itemClass`）或自行繪製（`renderItem`）。請參閱 [Pagination](../elements/pagination.md)。

### Command

命令面板：一個搜尋欄位，位於應用程式的命令之上（`items`：`id`、`label`、`keywords`、`group`、要顯示的 `shortcut`、`disabled`、`checked`），會隨使用者輸入以原生方式篩選（標籤或關鍵字包含查詢文字即符合，不分大小寫；沒有符合項目的區段會被移除），並顯示於只建立可視範圍內各列的虛擬化清單中。上、下方向鍵移動反白，Return 或按下即選取（`onSelect({ id })`），Escape 會先清除查詢文字，再回報 `onCancel`，應用程式可在此關閉包圍它的 `Dialog`。查詢文字可由應用程式持有（`query`、`onQueryChange`）或由欄位自行管理；搭配 `filterable={false}` 與 `loading` 時，由應用程式從伺服器回應查詢。應用程式為每個部分設定樣式（用於反白的 `itemClass` 搭配 `focus:`、`checked:`、`disabled:`），並繪製各列（`renderItem`，取得的捷徑為此處所顯示的形式）。請參閱 [Command](../elements/command.md)。

### Tree

項目中包含項目：專案的檔案、設定的側邊欄、大綱。`items` 是資料（`TreeItem`：`id`、`label`、`children`、`disabled`），且各列經過虛擬化：只建立可視範圍內的列，而收合項目的子項目永遠不會被建立，因此即使樹中有數千個項目也能保持流暢。應用程式擁有已展開的 id 與已選取的 id（`expanded`、`selected`，搭配 `onExpandedChange` 與 `onSelectedChange`），或由樹自行管理（`defaultExpanded`、`defaultSelected`）。按下會選取一列，並展開或收合資料夾；樹是鍵盤焦點的一個停靠點，其方向鍵移動選取（右鍵與左鍵負責展開、收合、進入與離開資料夾），另有 Home、End、Return、Space 與輸入即跳選。應用程式為各列設定樣式（`itemClass` 搭配 `selected:`、`aria-expanded:`、`focus:`）並繪製各列（`renderItem`，取得每個項目的 `depth`）。請參閱 [Tree](../elements/tree.md)。
<a id="plot-481"></a>

### Plot（`nsh/base/plot`）

組成圖表的零件，如同 `gpui-base` 的 `plot`，放在各自獨立的模組中：`import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
是經過檢查的鍵，或是以資料列為參數的函式）、座標軸的 `point`、`linear` 或 `band` 比例尺、指標所在的資料列（`onHoverChange`）及其動態（`motion`：出現動畫、懸停時的淡出與滑動）；其標記直接由資料列以原生方式繪製，每個資料點都不需要 JS，並使用 SVG 繪製屬性（`stroke-*`、`fill-*`）上色，未設定時使用 `currentColor`；`Area` 或 `Bar` 會在其形狀內顯示背景（漸層，`bg-linear-*`）。長條位於 `band` 比例尺的各個區段中，可並排或堆疊成 `stack`，在圖表出現時逐漸長出，並從指標所在的資料列向外淡出，每根長條的末端都有一個 `label` 零件。懸停時的十字線、圓點（每個標記各自的圓點，使用 `hoverDotClass`）與提示框（`tooltipPlacement`，保持在圖表範圍內）都是由應用程式設定樣式並填入內容的零件，並以原生方式移動；座標軸標籤則是應用程式自己的元素。`Pie` 會將整圈切分為每個資料列一個扇形（搭配 `innerRadius` 可成為環圈圖），各自使用自己的類別繪製（`sliceClass`，為其資料列的函式）；`Arc` 則在兩個角度之間繪製一個扇區（例如儀表的軌道與數值）；在圓餅圖上，圖表會回報指標下方的扇形，該扇形會浮起（`hoverLift`），其餘扇形則淡出（`hoverDim`）。`Sankey` 會繪製資料列之間的流向（`links`），版面配置方式與 d3-sankey 相同，每個節點與絲帶都以各自的類別繪製，節點有標籤、可懸停，並能隨新的流向移動。`Treemap` 會將資料列以巢狀矩形的階層方式鋪排（`id`、`parent`），每個葉節點的面積即為其 `value`，依類別或沿著圖表 `colorScale` 的色階上色，標籤在放得下時才顯示。請參閱 [Plot](../elements/plot.md)。

<a id="workspaces"></a>

## 工作區

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup 與 ResizablePanel

面板可並排或堆疊，每兩個面板之間有一個把手，使用者可拖曳它來分配空間。群組負責拖曳（以原生方式執行）、各面板的限制（`minSize`、`maxSize`）以及調整大小的游標；尺寸由應用程式掌握（`size`，以 `onResize` 回報），把手的外觀與面板的內容也由應用程式負責。請參閱 [Resizable](../elements/resizable.md)。

### DockArea

可停靠的工作區：面板位於分頁群組中，群組可並排或堆疊分割，並可在左、右與下邊緣設置停靠區。版面配置是由應用程式持有的資料（`layout`，以 `onLayoutChange` 回報）；此區域負責分頁的拖放、調整大小、停靠區、縮放與鎖定，在面板移動時保留其內容，並在空間狹窄時以抽屜與底部面板呈現相同的版面配置。分頁、把手、放置指示器與面板的內容都由應用程式負責。請參閱 [Dock](../elements/dock.md)。

<a id="documents"></a>

## 文件

### TextView

`TextView` 顯示由 Markdown、HTML 或應用程式建構的區塊所組成的文件，使用 [`Text`](../elements/text.md) 元素與檢視繪製：標題、清單、程式碼、表格、圖片、公式、註腳以及應用程式自訂的語法。它專為串流而來的 AI 聊天回覆而設計，具備採用主題色彩的閱讀排版，應用程式可逐部位重新設定樣式，並可透過 render 函式放入應用程式的內容。請參閱 [TextView](../elements/text-view.md)。

<a id="code"></a>

## 程式碼

### Editor

`Editor` 是支援逾五十種語言的程式碼編輯器：語法醒目提示、行號、多個游標、摺疊、自動換行、尋找與取代、診斷與裝飾，並採用程式碼編輯器的按鍵配置。文字由應用程式掌握（`value` 與 `onChange`），尋找列亦然，它會驅動編輯器的 `search`。它內建以主題 token 建構的外觀，應用程式可逐部位重新設定樣式。請參閱 [Editor](../elements/editor.md)。

### DiffView

`DiffView` 如同程式碼審查工具一般，顯示兩段文字之間或修補檔中各檔案的變更：並排或統一檢視，行內變更的字詞會醒目提示，未變更的行摺疊成可展開的分隔線，並使用 `Editor` 的語法色彩。應用程式的動作可保留或還原每項變更。請參閱 [DiffView](../elements/diff-view.md)。

### Table

`Table` 及其零件用來排版應用程式以子元素寫出的少量資料列，並為螢幕閱讀器提供表格語意：資料列群組、資料列、欄標題與儲存格。每個零件都採用應用程式的外觀。請參閱 [Table](../elements/table.md)。

### DataTable

`DataTable` 顯示資料列與欄，可在兩個方向捲動，不論列或欄的數量多寡，都只製作可見範圍內的儲存格。可選取列、欄或儲存格；欄可調整大小、移動、固定並排序（由應用程式負責排序）；應用程式以分頁方式提供資料列，並可自行繪製儲存格與標題。請參閱 [DataTable](../elements/data-table.md)。

<a id="navigation"></a>

## 導覽

由 `NavPage` 組成的 `NavStack` 在 iOS 上是 `UINavigationController`，在 Android 上則是具有工具列與預測式返回的堆疊；在桌面與網頁上，每個頁面顯示應用程式自己的 `header`。請參閱 [NavStack](../elements/nav-stack.md)，其中也涵蓋 `createNavStack` 與離開頁面。

### Dialog

`Dialog` 在其自己的原生視窗層中，將內容呈現於其他所有內容之上，包括堆疊的標頭。其彈出視窗與背景遮罩由應用程式設定樣式。請參閱 [Dialog](../elements/dialog.md)。

<a id="alert-dialogs"></a>

## 警示對話框

### AlertDialog

`AlertDialog.show(options)` 顯示平台原生的警示或動作表，並以 `{ action }` 完成，這是使用者所選動作的 `id`。請參閱 [AlertDialog](../elements/alert-dialog.md)。

## Input

`Input` 是平台原生的文字輸入：單行或多行欄位，其輸入、游標、選取、自動修正與自動填入皆由平台處理。其值與外觀由應用程式掌握。其 props 的型別為 `InputProps`（其中 `IOSInputProps` 用於 `ios={{…}}`），一併匯出。請參閱 [Input](../elements/input.md)。

<a id="status-bar"></a>

## 狀態列

狀態列屬於目前畫面上的內容，如同 UIKit 中，每個 view controller 宣告自己的 `preferredStatusBarStyle`，並由最上層的那個決定。在 NSH 中，頁面與對話框就是這些 view controller：`NavPage` 或 `Dialog` 以 `statusBar` 宣告它想要的狀態列，而應用程式則在 `nsh.json` 中宣告其預設值。

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

`statusBar` 接受下列欄位，皆為選填（在 Rust 中，可單獨使用 `StatusBarStyle`，或使用 `StatusBarSetting` 的同名 builder 方法）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"`（Rust：`StatusBarStyle::Default`、`Light`、`Dark`） | 內容（時間、電量、訊號）的顏色：`"light"` 適用於深色背景，`"dark"` 適用於淺色背景，`"auto"` 則依目前外觀使用平台的設定。 |
| `hidden` | `boolean` | 隱藏狀態列。 |
| `animated` | `boolean` | 在頁面或對話框出現與消失時，以動畫呈現變更。 |

此值具有響應性：`statusBar={{ foreground: dark() ? "light" : "dark" }}` 會追隨 signal，讀取 signal 的 Rust 閉包也是如此。

<a id="which-one-applies"></a>

### 套用哪一個設定

**最近**顯示的頁面或對話框會**逐欄位**決定：推入堆疊的頁面位於其下方頁面之上，而開啟的對話框則位於頁面之上。它省略的欄位會取自其下一層，最終取自應用程式的預設值。當頁面被彈出或對話框關閉時，其下一層的設定會再次生效。

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

### 應用程式的預設值

`nsh.json` 的 `"statusBar"` 是位於所有頁面與對話框之下的設定，如同 UIKit 應用程式中 Info.plist 的 `UIStatusBarStyle` 與 `UIStatusBarHidden`：

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

兩個欄位皆為選填。若未設定，內容為 `"auto"`，且會顯示狀態列。已封裝的 iOS 應用程式在啟動畫面上也會顯示它。

<a id="the-status-bar-on-each-platform"></a>

### 各平台上的狀態列

- **iOS**：隱藏與顯示會以淡入淡出動畫呈現。在[嵌入](../docs/ios.md)原生應用程式的應用中，由宿主應用程式的 view controller 決定狀態列的外觀。宿主應用程式透過在其 view controller 中回傳 `NshAppView.preferredStatusBarStyle`、`NshAppView.prefersStatusBarHidden` 與 `NshAppView.preferredStatusBarUpdateAnimation` 來套用 NSH 的設定。
- **Android**：應用程式以邊到邊方式繪製，位於狀態列之後（Android 15，API 35）：應用程式自己的背景即是狀態列的背景，而 `foreground` 可讓其內容在上面保持易讀。
- **桌面與網頁**：視窗的標題列與瀏覽器的列分別屬於系統與瀏覽器；`statusBar` 與 `nsh.json` 的 `"statusBar"` 僅適用於手機。

> [!IMPORTANT]
> 當你的 `nsh.json` 宣告 `"capabilities"` 時，只有在其中包含 `"statusBar": true` 的情況下，狀態列才會變更；其他變更會被拒絕並記錄。請參閱[沙箱與能力](../docs/sandbox-and-capabilities.md)。

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## 相關資源

- [導覽指南](../docs/navigation.md)。
- [表單與鍵盤](../docs/forms-and-keyboard.md)。
- [Avatar](../elements/avatar.md)、[Button](../elements/button.md)、[Carousel](../elements/carousel.md)、[Link](../elements/link.md)、[Checkbox](../elements/checkbox.md)、[Radio](../elements/radio.md)、[Switch](../elements/switch.md)、[Tabs](../elements/tabs.md)、[Toggle](../elements/toggle.md)、[Toolbar](../elements/toolbar.md)、[Select](../elements/select.md)、[Combobox](../elements/combobox.md)、[Command](../elements/command.md)、[Calendar](../elements/calendar.md)、[TimeField](../elements/time-field.md)、[DatePicker](../elements/date-picker.md)、[Collapsible](../elements/collapsible.md)、[HoverCard](../elements/hover-card.md)、[Accordion](../elements/accordion.md)、[Progress](../elements/progress.md)、[Slider](../elements/slider.md)、[ColorPicker](../elements/color-picker.md)、[Scrollbar](../elements/scrollbar.md)、[NumberInput](../elements/number-input.md)、[OtpInput](../elements/otp-input.md)、[Pagination](../elements/pagination.md)、[Tree](../elements/tree.md)、[Plot](../elements/plot.md)、[NavStack](../elements/nav-stack.md)、[Dialog](../elements/dialog.md)、[AlertDialog](../elements/alert-dialog.md)、[TextView](../elements/text-view.md)、[Editor](../elements/editor.md)、[DiffView](../elements/diff-view.md)、[Table](../elements/table.md)、[DataTable](../elements/data-table.md)、[Text](../elements/text.md) 與 [Input](../elements/input.md)。
  [AlertDialog](../elements/alert-dialog.md)、[TextView](../elements/text-view.md)、[Editor](../elements/editor.md)、[DiffView](../elements/diff-view.md)、[Table](../elements/table.md)、[DataTable](../elements/data-table.md)、
  [Text](../elements/text.md) 與
  [Input](../elements/input.md)。
- [裝置與環境](../docs/device-and-environment.md)。
- [`BackHandler`](./nsh-mobile.md#backhandler)：`BackHandler` 及其他僅限 Android 的 API。
