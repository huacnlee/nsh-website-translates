---
title: "nsh/base"
description: "用於應用程式介面的無樣式基礎元件：按鈕、連結、頭像、輪播、勾選框、單選按鈕、開關、分頁標籤、切換按鈕、工具列、樹狀檢視、下拉選單、組合框、命令面板、日曆、日期選擇器、時間欄位、可調整大小的面板、可停靠的工作區、Markdown 與 HTML 文件、程式碼編輯器、差異比較、文字輸入框、導覽堆疊與對話框、系統警示對話框，以及頁面和對話框的狀態列。"
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---


# nsh/base

`nsh/base` 是應用程式 UI 的基礎元件層：不帶樣式的元件，在每個平台上負責行為、狀態、焦點和無障礙功能。它位於基本元件（`nsh`、`nsh/mobile` 和 `nsh/desktop`）與應用程式自己的元件庫之間，正如 GPUI Kit 中 `gpui-base` 位於 `gpui` 與有樣式的元件庫之間（見[模組](./index.md#three-layers)）。它提供控制項（`Button`、`Link`、`Checkbox`、`ColorPicker` 及其 `ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch` 和 `ColorEyeDropper`、`NumberInput`、`Radio` 置於 `RadioGroup` 中、`Slider`、`Switch`、`Tab` 於 `Tabs` 中、`Toggle` 於 `ToggleGroup` 中、`Select`、`Combobox`、`Calendar`、`TimeField`、`DatePicker`）、指令面板（`Command`）、控制項列（`Toolbar` 及其 `ToolbarGroup` 和 `ToolbarSeparator`）、具應用程式自有外觀的捲軸（`Scrollbar`）、可展開和收合的區域（`Collapsible`，以及 `Accordion` 及其 `AccordionItem`、`AccordionHeader`、`AccordionTrigger` 和 `AccordionPanel`）、進度條（`Progress`）、一次性驗證碼（`OtpInput`）、一組內容的各個頁面（`Pagination`）、可包含項目的項目（`Tree`）、組成圖表的部件（`Plot` 配合 `Line`、`Area`、`Bar`、`Rule`、`Dot`、`Cell`、`Grid`、`Pie` 和 `Arc`，置於 `nsh/base/plot` 中）、由使用者自行排列的工作區（`ResizablePanel` 置於 `ResizablePanelGroup` 中，以及 `DockArea` 的分割區、分頁群組和停靠區）、輪播（`Carousel` 及其部件）、Markdown 或 HTML 文件（`TextView`）、程式碼編輯器（`Editor`）、文字之間的差異（`DiffView`）、由列和欄組成的表格（`Table` 及其部件、`DataTable`）、文字輸入（`Input`）、顯示於所有內容之上的彈出視窗（`Popover`、`Menu` 和 `ContextMenu` 及其 `MenuItem`、`MenuSeparator` 和 `Submenu`、`Tooltip`、`Sheet`）、Toast 通知（`Toast` 置於 `ToastStack` 中，其生命週期由 `ToastManager` 管理）、導覽（`NavStack` 內含 `NavPage`，由你以 `createNavStack` 建立的狀態驅動，以及用於在所有其他內容之上呈現內容的 `Dialog`）和系統的警示對話框（`AlertDialog`）。頁面和對話框亦會決定狀態列（`statusBar`）。

基礎元件集亦包括 `Avatar` 和 `AvatarGroup`：前者是帶有原生圖片載入狀態的圖片，後者是顯示前 `limit` 個頭像的一列元件。

外觀由應用程式決定：頁面、對話框或標題列內的內容都是你自己的 JSX，以基本元件配合樣式、[Tailwind](../docs/tailwind.md) 類別和你的主題組成，或使用[你自己的 crate](../docs/rust.md) 中的 Rust 元件，又或是社群在 `nsh/base` 之上建構的元件庫。每個宿主都提供 `nsh/base`；Rust 應用程式則透過 `nsh-base` crate（`nsh_base::{button, dialog, …}`）使用相同的 API。

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

本頁是模組的索引：每個元件都有各自的元素頁面，載有範例、屬性和平台說明。如需逐步教學，請參閱[導覽指南](../docs/navigation.md)和[表單與鍵盤](../docs/forms-and-keyboard.md)。

| TSX | Rust | 說明 |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | 可按壓的目標，具有停用和選取狀態，以及供螢幕閱讀器使用的角色。 |
| [`Link`](../elements/link.md) | `link()` | 會前往某處的可按壓目標：它透過系統開啟其 `href`，或由應用程式自行開啟（`openWith="app"`、`onOpen`）。 |
| [`Avatar`](../elements/avatar.md)、[`AvatarGroup`](../elements/avatar.md) | `avatar()`、`avatar_group()` | 一個人的圖片，或在載入中、載入失敗和沒有圖片時的後備內容（姓名縮寫、應用程式圖示）；以及顯示前 `limit` 個頭像和溢出數量的一列元件。載入狀態為原生。 |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | 已勾選、未勾選或不確定狀態的控制項，其指示器由應用程式設定樣式和標記。 |
| [`Radio`](../elements/radio.md)、[`RadioGroup`](../elements/radio.md) | `radio()`、`radio_group()` | 使用者從一組選項中挑選其一的單一選項，以及該組選項；由應用程式決定哪一項被勾選。 |
| [`Switch`](../elements/switch.md) | `switch()` | 開／關控制項，其軌道和滑塊由應用程式設定樣式。 |
| [`Tab`](../elements/tabs.md)、[`Tabs`](../elements/tabs.md) | `tab()`、`tabs()` | 分頁列表中的單一分頁，以及該列表；由應用程式決定哪一個被選取並顯示其內容。 |
| [`Toggle`](../elements/toggle.md)、[`ToggleGroup`](../elements/toggle.md) | `toggle()`、`toggle_group()` | 可開啟或關閉的按鈕，以及由這些按鈕組成的工具列；由應用程式決定哪些處於按下狀態。 |
| [`Toolbar`](../elements/toolbar.md)、[`ToolbarGroup`](../elements/toolbar.md)、[`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`、`toolbar_group()`、`toolbar_separator()` | 由按鈕、切換按鈕和連結組成的列：是鍵盤焦點的單一停駐點，方向鍵可沿著它移動；以及相關項目的群組和它們之間的分隔線。 |
| [`Carousel`](../elements/carousel.md) 及其部件 | `carousel()`、`carousel_content()`、`carousel_item()`、`carousel_previous()`、`carousel_next()`、`carousel_pagination()`、`carousel_pagination_item()` | 每次顯示一個位置的投影片，採用平台自身的捲動方式，附有上一張／下一張、分頁指示、按鍵操作和無縫循環；由應用程式決定 `index`。 |
| [`Select`](../elements/select.md) | `select()` | 從項目清單中選取一個值：在桌面裝置上是觸發元件旁的彈出視窗，在手機上是面板；由應用程式決定 `value` 並繪製觸發元件。 |
| [`Combobox`](../elements/combobox.md) | `combobox()` | 從項目清單中選取一個或多個值（`multiple`），清單會隨輸入欄位中的輸入內容篩選；由應用程式決定 `value` 並設定欄位樣式。 |
| [`Calendar`](../elements/calendar.md) | `calendar()` | 從按月份排列的日期中選取一個日期或日期範圍，附有月份和年份檢視及鍵盤操作；由應用程式決定 `value` 並繪製各個項目。 |
| [`TimeField`](../elements/time-field.md) | `time_field()` | 逐段編輯的時間（時、分、秒、AM/PM）；由應用程式決定 `value`。 |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | 從日曆中選取日期、日期範圍或日期和時間：在桌面裝置上是觸發元件旁的彈出視窗，在手機上是面板；由應用程式決定 `value` 並繪製觸發元件。 |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | 內容可展開和收合的區域；由應用程式決定 `open` 及其觸發元件。 |
| [`Accordion`](../elements/accordion.md)、[`AccordionItem`](../elements/accordion.md)、[`AccordionHeader`](../elements/accordion.md)、[`AccordionTrigger`](../elements/accordion.md)、[`AccordionPanel`](../elements/accordion.md) | `accordion()`、`accordion_item()`、`accordion_header()`、`accordion_trigger()`、`accordion_panel()` | 堆疊的區段，可在其標題下展開和收合，每次只可展開一個或可展開多個（`multiple`）；由應用程式決定 `value`，即已展開的項目。 |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | 以應用程式設定樣式的儲存格顯示的一次性驗證碼；由應用程式決定 `value`，`onComplete` 會在輸入完成時通知。 |
| [`Pagination`](../elements/pagination.md) | `pagination()` | 一組內容的各個頁面：上一頁、目前頁面前後的頁碼（以省略號表示其餘）、應用程式的子元素和下一頁；由應用程式決定 `page`。 |
| [`Command`](../elements/command.md) | `command()` | 指令面板：位於應用程式指令之上的搜尋欄位，以原生方式按標籤和關鍵字篩選，並顯示於虛擬化清單中；按下 Return 或點按即可選擇（`onSelect`），置於 `Dialog` 中即成為 Cmd+K 面板。 |
| [`Tree`](../elements/tree.md) | `tree()` | 可包含項目的項目，已虛擬化：可展開和收合，可選取一項，是鍵盤焦點的單一停駐點；由應用程式決定 `expanded` 和 `selected`，或由樹狀結構自行管理。 |
| [`Progress`](../elements/progress.md) | `progress()` | 進度條；由應用程式決定 `value`（0 至 100）和 `indeterminate`。 |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | 在欄位中輸入或以按鈕和按鍵逐步調整的數字；由應用程式決定 `value`（或由輸入元件根據 `defaultValue` 自行管理）。 |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | 具應用程式自有外觀的捲軸，用於其指定的捲動檢視或清單（`scroll`）；其滑塊跟隨內容，拖曳和按壓都會捲動內容。 |
| [`Slider`](../elements/slider.md) | `slider()` | 沿軌道選取的一個值或由兩個值組成的範圍；由應用程式決定 `value`（或由滑桿根據 `defaultValue` 自行管理）。 |
| [`ColorPicker`、`ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch`、`ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`、`color_area()`、`color_slider()`、`color_field()`、`color_swatch()`、`color_eye_dropper()` | 顏色選擇器及其部件：飽和度和亮度區域、可調整 RGB、HSL、HSB 或 OKLCH 任何色版及透明度的滑桿、顏色或色版的欄位、色票、滴管；由應用程式決定 `value`（或由選擇器根據 `defaultValue` 自行管理）。 |
| [`ResizablePanelGroup`、`ResizablePanel`](../elements/resizable.md) | `h_resizable()`、`v_resizable()`、`resizable_panel()` | 並排或堆疊的面板，附有可供使用者拖曳以調整大小的控點。 |
| [`DockArea`](../elements/dock.md) | `dock_area()` | 由使用者自行排列的工作區，包含分割區、分頁群組和邊緣停靠區；其版面配置是應用程式的資料。 |
| [`NavStack`、`NavPage`、`createNavStack`](../elements/nav-stack.md) | `nav_stack()`、`nav_page()` | 原生導覽堆疊及其頁面。 |
| [`Dialog`](../elements/dialog.md) | `dialog()` | 呈現在所有其他內容之上的內容：面板、全螢幕流程、對話框。 |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | 平台的警示對話框或動作面板。 |
| [`TextView`](../elements/text-view.md) | `text_view()` | 由 Markdown、HTML 或區塊組成的文件，以文字和檢視繪製，適用於串流輸出的 AI 回覆。 |
| [`Editor`](../elements/editor.md) | `editor()` | 程式碼編輯器：語法醒目標示、多個插入點、摺疊、尋找和取代、診斷訊息。 |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | 兩段文字之間或修補檔的差異，以並排或統一格式顯示，附有逐項變更的操作。 |
| [`Table`、`TableHeader`、`TableBody`、`TableFooter`、`TableRow`、`TableHead`、`TableCell`、`TableCaption`](../elements/table.md) | `table()`、`table_row()`、... | 由應用程式自有的列和儲存格組成的表格，具備供螢幕閱讀器使用的表格角色。 |
| [`DataTable`](../elements/data-table.md) | `data_table()` | 可容納任意數量列和欄的表格：支援選取、排序、固定、可調整大小和可移動的欄，列則按頁提供。 |
| [`Input`](../elements/input.md) | `nsh_base::input()` | 平台的原生文字輸入，可為單行或多行。 |
| [`Popover`](../elements/popover.md) | `popover()` | 錨定於觸發元件、顯示在所有內容之上的內容。 |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | 在指標停留於觸發元件上時（觸控螢幕則為按壓時），預覽其所指向的內容。 |
| [`Menu`、`ContextMenu`、`MenuItem`、`MenuSeparator`、`Submenu`](../elements/menu.md) | `menu()`、... | 選單：在桌面裝置上是附有層疊子選單的彈出視窗，在手機上是面板；包含可勾選的項目和單選項目。 |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | 顯示在觸發元件旁的提示。 |
| [`Sheet`](../elements/sheet.md) | `sheet()` | 位於螢幕邊緣、置於背景遮罩之上的面板。 |
| [`Toast`、`ToastStack`、`ToastManager`](../elements/toast.md) | `toast()`、`toast_stack()`、`ToastManager` | 不帶樣式的 Toast 通知：語意根元素、層疊的圖層堆疊，以及它們的生命週期。 |
| 頁面和對話框上的 `statusBar` | `.status_bar(..)` | 頁面或對話框顯示期間的狀態列。請參閱[狀態列](#status-bar)。 |

在 Rust 中，`theme()` 會以設計權杖（`theme().primary`、`theme().radius`）讀取應用程式的主題，與 TSX 的[主題類別](../docs/tailwind.md#theme-tokens)所使用的權杖相同。

<a id="controls"></a>

## 控制項

### Button

擁有自身行為但不帶外觀的可按壓目標：包括按壓、停用和選取狀態，以及供螢幕閱讀器使用的角色。其外觀是應用程式的 `class` 和 `style`（附有狀態變體），其內容則是它的子元素。請參閱 [Button](../elements/button.md)。

### Link

會前往某處且不帶外觀的可按壓目標：包括按壓、取得鍵盤焦點時的 Return 和 Space、停用狀態、供螢幕閱讀器使用的連結角色，以及導覽中的目前頁面（`current`）。`href` 是它的前往目標，不會顯示出來：按壓時會回報該目標（`onOpen`），然後在應用程式外開啟網頁或其他應用程式的連結；若使用 `openWith="app"`，則改由應用程式自己的路由負責開啟。請參閱 [Link](../elements/link.md)。

### Checkbox

擁有自身行為但不帶外觀的已勾選、未勾選或不確定狀態控制項：包括按壓、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的 checkbox 角色和值（不確定時為 mixed），其值由應用程式管理（`checked`、`indeterminate`、`onChange`）。應用程式為 checkbox 及其指示器設定樣式，指示器的 `checked:`、`indeterminate:` 和 `disabled:` 類別會跟隨 checkbox，並將自己的標記放進指示器中（`indicator`）。請參閱 [Checkbox](../elements/checkbox.md)。

### Radio and RadioGroup

使用者從一組選項中恰好選取其一的單一選項，以及包住它們的群組。radio 擁有自身行為但不帶外觀：包括按壓、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的 radio 角色和已勾選狀態。群組是螢幕閱讀器會朗讀的 radio group，本身不持有任何值：應用程式會告知每個 radio 是否已勾選（`checked`），按壓未勾選的 radio 則會請求勾選（`onChange`）。應用程式的指示器和標籤是 radio 的子元素，其 `group-checked:` 類別會跟隨 radio。請參閱 [Radio](../elements/radio.md)。

### Switch

擁有自身行為但不帶外觀的開／關控制項：包括按壓、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的 switch 角色和值，其值由應用程式管理（`checked`、`onChange`）。應用程式為 switch 及其軌道和滑塊設定樣式，其 `checked:` 和 `disabled:` 類別會跟隨 switch。請參閱 [Switch](../elements/switch.md)。

### Tab and Tabs

分頁列表中的各個分頁，以及包住它們的列表。tab 擁有自身行為但不帶外觀：包括按壓、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的 tab 角色和已選取狀態。列表是螢幕閱讀器會朗讀的 tab list，本身不持有任何值：應用程式會告知每個 tab 是否已選取（`selected`）、接收按壓事件（`onPress`），並自行顯示已選取區段的內容。應用程式的標籤是 tab 的子元素，其 `group-selected:` 類別會跟隨 tab。列表的指示器（`indicatorClass`、`indicatorStyle`）是由應用程式設定樣式的底線或膠囊形標記，位於已選取的 tab 上，並以原生方式彈跳到下一個 tab。請參閱 [Tabs](../elements/tabs.md)。
### Carousel

一次顯示一張投影片(產品相片、新手導覽、橫額、一列卡片)。內容是原生捲動視圖，會對齊各投影片的起點，因此手指、滑鼠滾輪和觸控板都會與指標在同一影格內移動投影片；停下時，Carousel 會以 `onChange` 回報目前顯示的投影片。上一張與下一張(`CarouselPrevious`、`CarouselNext`)、分頁(`CarouselPagination` 內的多個 `CarouselPaginationItem`，附有彈跳至目前投影片的指示器)和方向鍵都以原生方式移動，並可透過 `looping` 無縫循環越過首尾。目前顯示的投影片由應用程式的 `index` 決定，會自動輪播的投影片由應用程式自己的計時器推進(`onDragStart` / `onDragEnd`、`onFocus` / `onBlur` 指示何時暫停等候)；外觀和所有標籤均由應用程式決定。參閱 [Carousel](../elements/carousel.md)。

<a id="toggle-and-togglegroup"></a>

### Toggle 與 ToggleGroup

可開關的按鈕(粗體、我的最愛、檢視選項)，以及由這類按鈕組成的工具列。Toggle 自行負責行為，沒有外觀：按下、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的按鈕角色及其按下狀態。群組是螢幕閱讀器會報讀的工具列，是鍵盤焦點的一個停駐點，其方向鍵可在各 Toggle 之間移動而不會按下它們，且不持有任何值：應用程式告知每個 Toggle 是否已按下(`pressed`)，並接收它請求的值(`onChange`)，可讓任意數量處於按下狀態，或只有一個。群組上的 `disabled` 會停用其中每個 Toggle。應用程式的圖示或標籤是 Toggle 的子元素，其 `group-aria-pressed:` 類別會隨之套用。參閱 [Toggle](../elements/toggle.md)。

<a id="toolbar-toolbargroup-and-toolbarseparator"></a>

### Toolbar、ToolbarGroup 與 ToolbarSeparator

一列控制項：文字編輯器的格式設定、媒體播放器的播放控制、垂直的工具面板。工具列是螢幕閱讀器會報讀的對象(以 `accessibilityLabel` 命名)，也是鍵盤焦點在其內的 `Button`、`Toggle` 和 `Link` 上的一個停駐點：Tab 會進入上次離開時所在的項目，其 `axis` 的方向鍵沿工具列移動，Home 和 End 跳至兩端，皆不會按下任何項目。`ToolbarGroup` 是一組有名稱的相關項目(復原與重做、對齊方式)，工具列內的 `ToggleGroup` 是其群組之一，其 Toggle 即工具列的項目。`ToolbarSeparator` 是應用程式在各組之間繪製的線條。工具列或群組上的 `disabled` 會停用其中每個項目。工具列不持有值，也沒有外觀：每個控制項各自保有其狀態，由應用程式為工具列、群組和分隔線設定樣式。參閱 [Toolbar](../elements/toolbar.md)。

### Select

從以資料給定的項目清單中選出一個值(`items`：各有值和標題，可選擇停用或歸入某個區段)，沒有外觀。清單由應用程式的觸發元件開啟：桌面平台上是位於觸發元件處的彈出視窗，手機和平板上是從底部彈出的面板。Select 負責鍵盤操作(Up、Down、Home、End、Page Up 和 Page Down、輸入即搜尋、Return 和 Escape)、搜尋(`searchable`)、醒目標示的列(`itemClass` 上的 `focus:`；`renderItem` 取得的是項目是甚麼，而非其狀態)，以及供螢幕閱讀器使用的 combobox、listbox 和 option 角色。值由應用程式持有(`value`、`onChange`)，或交由 Select 管理(`defaultValue`)，並由應用程式為各部分設定樣式或繪製各列。參閱 [Select](../elements/select.md)。

### Combobox

從項目清單中選取值，清單與 Select 的相同，可在 Combobox 的輸入框打字篩選，沒有外觀：選一個，或以 `multiple` 選多個，此時每次選擇都會切換該項目，清單則保持開啟。值是一個陣列，由應用程式持有(`value`、`onChange`)或交由 Combobox 管理(`defaultValue`)；清單關閉時，`onConfirm` 會回報該值。查詢文字可由應用程式持有(`query`、`onQueryChange`)，頁尾顯示在各列下方，清除按鈕會清空值。參閱 [Combobox](../elements/combobox.md)。

### Calendar

選取一個日期，或以 `range` 選取日期範圍，從按月顯示的日子中挑選，沒有外觀。可並排顯示一個或多個月份(`numberOfMonths`)；標題列負責翻動月份，並開啟月份檢視或年份頁面。值是 ISO 日期(`"2026-10-28"`)或 `[start, end]`，由應用程式持有(`value`、`onChange`)或交由 Calendar 管理(`defaultValue`)；`disabledMatcher` 可避免某些日子被選取，各日子整體作為 Tab 的一個停駐點接收鍵盤操作。應用程式為各部分設定樣式並繪製項目(`renderItem`，會給定項目是甚麼；其狀態即其類別，範圍中的日子為 `selected:`，帶有 `data-range-start:`、`data-range-middle:` 和 `data-range-end:`)。參閱 [Calendar](../elements/calendar.md)。

### TimeField

逐段編輯的時間，沒有外觀：時、分、秒(`precision`)和 AM/PM(`hourCycle="h12"`)，可透過步進、打字或手機的數字鍵盤輸入。值為 24 小時制的 `"HH:MM"`(`"HH:MM:SS"`)，由應用程式持有(`value`、`onChange`)或由欄位自行管理(`defaultValue`)。參閱 [TimeField](../elements/time-field.md)。

### DatePicker

從月曆選取日期，月曆由應用程式的觸發元件開啟，與 Select 的清單相同：桌面平台上是彈出視窗，手機上是面板。值採用 HTML input 的格式：ISO 日期、`[start, end]` 搭配 `range`，或搭配 `timePrecision` 的日期和時間(月曆下方有時間欄位)，由應用程式持有(`value`、`onChange`)或由選擇器自行管理(`defaultValue`)。預設值可設定它，清除按鈕可清除它，`Calendar` 的每個 prop 都會傳遞下去。參閱 [DatePicker](../elements/date-picker.md)。

### Collapsible

內容可展開和收合的區域，沒有外觀：其子元素一直顯示(摘要、觸發元件)，其 `content` 在 `open` 時顯示於其後。應用程式持有 `open` 和切換它的觸發元件，並在該處向螢幕閱讀器說明展開狀態。內容只建立一次，收合時仍會保留，因此其中的內容會保有自己的狀態。使用 `reveal` 時，會以原生方式、透過彈性動畫的高度展開和收合。參閱 [Collapsible](../elements/collapsible.md)。

### Accordion

堆疊的區段，可在標題下展開和收合，沒有外觀：一個 `Accordion` 內有多個 `AccordionItem`，每個都是包住其 `AccordionTrigger` 和一個 `AccordionPanel` 的 `AccordionHeader`。應用程式持有 `value`(即已展開項目的值)，並設定按下觸發元件時 `onChange` 所回報的內容：一次一個項目，或以 `multiple` 同時展開多個。螢幕閱讀器會讀出一組標題，其按鈕會說明所屬項目是否已展開，每個開啟的面板則讀作區域。使用 `reveal` 時，面板會以原生方式、透過彈性動畫的高度開合；使用 `keepMounted` 時，面板內容在關閉時仍保留在樹中。參閱 [Accordion](../elements/accordion.md)。

### Avatar

人物的圖片，沒有外觀：備用內容(`name` 的姓名縮寫，或應用程式的 `fallback`)，以及覆蓋其上的圖片(載入完成前為透明)，兩者都與 Avatar 一樣大，之後是應用程式的子元素(在線狀態圓點)。圖片自身的載入和錯誤事件會以原生方式更改其狀態(`onStatusChange`)，`fallbackDelay` 會在圖片載入期間暫不顯示備用內容。螢幕閱讀器會讀出以姓名作標籤的圖片。`AvatarGroup` 顯示最前面的 `limit` 個 Avatar，不為其餘的建立視圖，並在 `total` 較多時顯示其 `overflow`。參閱 [Avatar](../elements/avatar.md)。

### Progress

線性進度條，沒有外觀：軌道內有一個指示器，指示器的寬度為軌道寬度的 `value` 百分比。應用程式持有 `value`(0 至 100)和 `indeterminate`；螢幕閱讀器會取得進度條角色、範圍和值，處於不確定狀態時則沒有值，此時指示器的寬度和動態由應用程式決定。參閱 [Progress](../elements/progress.md)。

### NumberInput

在欄位中輸入或步進的數字，沒有外觀：欄位(`Input`)、其前的減少按鈕和其後的增加按鈕(或兩者以直列放在右側，`controlsRight`)。應用程式持有 `value`(數字或 `null`；或由輸入元件從 `defaultValue` 自行管理)，並接收 `onChange`，附帶欄位所讀取的數字。欄位接受數字，或正在輸入成數字的文字，包括其他鍵盤的數字和符號；按鈕、Up / Down 以及 Page Up / Page Down 會以 `step` 步進，保留小數位，不超出 `min` 和 `max`，離開欄位時，亦會把輸入的值限制在此範圍內。對螢幕閱讀器而言，欄位是 spin button，其增加和減少動作會步進該值。參閱 [NumberInput](../elements/number-input.md)。

### Slider

沿軌道選取的一個值或兩個值的範圍，沒有外觀：接受按壓和拖曳的軌道、其內讓各值對應的指示器、範圍，以及其上每個值各一個的控點。應用程式持有 `value`(數字或 `[start, end]`；或由 Slider 從 `defaultValue` 自行管理)，並為每個新值接收 `onChange`(已由 `min` 起按 `step` 對齊)，以及每次變更一次的 `onChangeEnd`；`scale` 讓各值線性分布或按數量級分布，`axis` 讓軌道水平或垂直排列。對螢幕閱讀器而言，每個控點是帶有自己的值的可調整元素，是鍵盤焦點的一個停駐點，並以 WAI-ARIA 的滑桿按鍵移動。參閱 [Slider](../elements/slider.md)。

### Scrollbar

應用程式自訂外觀的捲動條，用於捲動視圖或清單，可放在應用程式想要的位置，沒有外觀：軌道(即捲動條的 `class`)和其內的滑塊(`thumbClass`)。它指明其捲動視圖(`scroll`，其 `ref`)，並跟隨其偏移量、內容和可視區域；拖曳滑塊會捲動內容，按壓軌道會讓滑塊中央移至該處。`mode` 會在內容捲動時(之後再持續 `motion.idle`)、指標位於捲動條上時，或一律顯示它；`axis` 使其呈水平。`Scrollbar.setTheme` 為每個捲動視圖和清單在其可視區域上提供應用程式外觀的捲動條，無需另行放置，而視圖可透過其 `scrollbar` prop 採用自己的主題。參閱 [Scrollbar](../elements/scrollbar.md)。

### ColorPicker

沒有外觀的顏色選擇器：根元素持有顏色，其內的各部分顯示並更改顏色，版面由應用程式安排。`ColorArea` 是 HSB 的飽和度和亮度，`ColorSlider` 是 RGB、HSL、HSB 或 OKLCH 的任何通道或 alpha(水平或垂直)，`ColorField` 是以任何 CSS 形式表示的顏色或某通道的數字，`ColorSwatch` 是按下即可選取的預設色或顏色預覽，`ColorEyeDropper` 是在螢幕上取色的按鈕(macOS、web)。應用程式持有 `value`(或由選擇器從 `defaultValue` 自行管理)，並接收 `onChange` 和 `onChangeEnd`，附帶顏色及 `format` 所寫出的文字；選擇器會保留每個色彩空間的通道值，與用戶設定的一致。控點對螢幕閱讀器而言是可調整元素，亦是鍵盤焦點的停駐點。參閱 [ColorPicker](../elements/color-picker.md)。

### OtpInput

固定長度的數字一次性驗證碼，沒有外觀：覆蓋在各格子上的一個原生文字欄位負責接收鍵盤輸入，因此打字、貼上、數字鍵盤和系統的驗證碼自動填入均由平台處理，螢幕閱讀器只會找到一個文字欄位。只接受數字，最多 `length` 位；Backspace 會刪除最後一位。應用程式持有 `value`(或提供 `defaultValue`)，並接收 `onChange` 和 `onComplete`；它為各格子設定樣式(`focus:` 用於接收下一位數字的格子，`data-filled:` 用於已有數字的格子)、其群組和游標。參閱 [OtpInput](../elements/otp-input.md)。

### Pagination

在一組頁面之間移動，是沒有外觀的導覽地標：上一頁、第一頁和最後一頁、目前頁及其相鄰頁(`visiblePages`)、每段被省略的頁碼以刪節號表示、應用程式的子元素，以及下一頁；`compact` 只保留上一頁、子元素和下一頁。應用程式持有 `page` 並接收 `onChange({ page })`；目前頁是 `selected:`，並向螢幕閱讀器標示為目前頁。應用程式為各項目設定樣式(`itemClass`)或自行繪製(`renderItem`)。參閱 [Pagination](../elements/pagination.md)。

### Command

命令面板：在應用程式的命令上方有一個搜尋欄位(`items`：`id`、`label`、`keywords`、`group`、要顯示的 `shortcut`、`disabled`、`checked`)，隨用戶打字以原生方式篩選(標籤或關鍵字包含查詢文字即符合，不分大小寫；沒有符合項目的區段會被移除)，並顯示於只建立可見列的虛擬化清單中。Up 和 Down 移動醒目標示，Return 或按下即選取(`onSelect({ id })`)，Escape 會先清除查詢文字，再回報 `onCancel`，應用程式可在此關閉包著它的 `Dialog`。查詢文字由應用程式持有(`query`、`onQueryChange`)，或由欄位自行管理；使用 `filterable={false}` 和 `loading` 時，應用程式會從伺服器取得結果。應用程式為每個部分設定樣式(`itemClass` 搭配 `focus:` 表示醒目標示、`checked:`、`disabled:`)並繪製各列(`renderItem`，會給定如此處所示的快速鍵)。參閱 [Command](../elements/command.md)。

### Tree

包含項目的項目：專案的檔案、設定側邊欄、大綱。`items` 是資料(`TreeItem`：`id`、`label`、`children`、`disabled`)，各列經過虛擬化：只建立可見的列，已收合項目的子項目則一律不建立，因此即使有數以千計項目的樹也能保持流暢。應用程式持有已展開的 id 和已選取的一項(`expanded`、`selected`，連同 `onExpandedChange` 和 `onSelectedChange`)，或由 Tree 自行管理(`defaultExpanded`、`defaultSelected`)。按下會選取某列，並展開或收合資料夾；Tree 是鍵盤焦點的一個停駐點，其方向鍵移動選取項目(Right 和 Left 用於展開、收合、進入和離開資料夾)，另有 Home、End、Return、Space 和輸入即搜尋。應用程式為各列設定樣式(`itemClass` 搭配 `selected:`、`aria-expanded:`、`focus:`)並繪製它們(`renderItem`，會給定每個項目的 `depth`)。參閱 [Tree](../elements/tree.md)。
### Plot (`nsh/base/plot`)

組成圖表的各個部件，作為 `gpui-base` 的 `plot`，放在獨立的模組中：`import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
是經過檢查的鍵，或是以資料列為參數的函式），座標軸的 `point`、`linear` 或 `band` 比例尺，指標所在的資料列
（`onHoverChange`）及其動態（`motion`：出現、懸停時的淡出與滑動）；其圖形標記直接以原生方式根據資料列繪製，每個資料點都不需要 JS，並以 SVG 繪製屬性（`stroke-*`、`fill-*`）上色，未設定時使用 `currentColor`。`Area` 或 `Bar` 可在其形狀內顯示背景（漸層，`bg-linear-*`）。長條位於 `band` 比例尺的各個區段內，可並排或堆疊成 `stack`，在圖表出現時逐漸長出，並由指標所在資料列向外淡出，每根長條的末端各有一個 `label` 部件。懸停時的十字線、圓點（各個標記自己的圓點，以 `hoverDotClass` 設定）和提示框（`tooltipPlacement`，保持在圖表範圍內）都是由應用程式設定樣式及填入內容的部件，並以原生方式移動；座標軸標籤是應用程式自己的元素。`Pie` 將整圈按每個資料列分成一塊扇形（帶有 `innerRadius` 的為甜甜圈圖），每塊以各自的 class 上色（`sliceClass`，是其資料列的函式），而 `Arc` 則在兩個角度之間繪製一個扇區（用作儀表的軌道和數值）；在圓餅圖上，圖表會回報指標下方的扇形，該扇形會浮起（`hoverLift`），其餘扇形則淡出（`hoverDim`）。`Sankey` 繪製資料列之間的流向（`links`），佈局方式與 d3-sankey 相同，每個節點和流帶都以各自的 class 上色，節點有標籤、可懸停，並會隨新的流向移動。`Treemap` 將資料列以巢狀矩形的層級結構平鋪（`id`、`parent`），每片葉節點的面積即其 `value`，按類別或沿圖表 `colorScale` 的色階上色，標籤在空間足夠時顯示。請參閱 [Plot](../elements/plot.md)。

<a id="workspaces"></a>

## 工作區

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup 與 ResizablePanel

面板可並排或堆疊，每兩個面板之間有一個控點，用戶可拖曳它來分配空間。群組負責拖曳（以原生方式執行）、各面板的限制（`minSize`、`maxSize`）以及調整大小的游標；尺寸由應用程式掌管（`size`，以 `onResize` 回報），控點的外觀和面板的內容亦然。請參閱 [Resizable](../elements/resizable.md)。

### DockArea

可停靠的工作區：面板位於分頁群組中，群組可並排或堆疊分割，並可在左、右及底部邊緣設置停靠區。版面配置是應用程式擁有的資料（`layout`，以 `onLayoutChange` 回報）；區域負責分頁的拖曳與放置、調整大小、停靠區、縮放及鎖定，在面板移動時保留各面板的內容，並在空間狹窄時以抽屜和底部面板呈現同一個版面配置。分頁、控點、放置指示器和面板的內容都由應用程式提供。請參閱 [Dock](../elements/dock.md)。

<a id="documents"></a>

## 文件

### TextView

`TextView` 顯示由 Markdown、HTML 或應用程式建構的區塊所組成的文件，以 [`Text`](../elements/text.md) 元素和視圖繪製：標題、清單、程式碼、表格、圖片、公式、註腳以及應用程式自己的語法。它專為串流而來的 AI 聊天回覆而設計，採用適合閱讀的排版和主題的顏色，應用程式可逐部件重新設定樣式，並可用渲染函式放入應用程式自己的內容。請參閱 [TextView](../elements/text-view.md)。

<a id="code"></a>

## 程式碼

### Editor

`Editor` 是支援五十多種語言的程式碼編輯器：語法突顯、行號、多個插入點、摺疊、自動換行、尋找與取代、診斷與裝飾，並採用程式碼編輯器的快捷鍵。文字由應用程式掌管（`value` 和 `onChange`），尋找列亦然，它驅動編輯器的 `search`。它附帶以主題的 token 建立的外觀，應用程式可逐部件重新設定樣式。請參閱 [Editor](../elements/editor.md)。

### DiffView

`DiffView` 如程式碼審查工具般，顯示兩段文字之間或修補檔中各檔案的變更：可並排或統一顯示，突顯行內被更改的字詞，並將未更改的行收合為可展開的分隔線，使用 `Editor` 的語法顏色。應用程式的操作可保留或還原每項變更。請參閱 [DiffView](../elements/diff-view.md)。

### Table

`Table` 及其部件負責排列應用程式以子元素寫出的少量資料列，並為螢幕閱讀器提供表格結構：列群組、列、欄標題和儲存格。每個部件都採用應用程式的外觀。請參閱 [Table](../elements/table.md)。

### DataTable

`DataTable` 顯示資料列和資料欄，可在兩個方向上捲動，不論列數或欄數多少，都只製作可見範圍內的儲存格。可選取列、欄或儲存格；欄可調整大小、移動、固定及排序（排序由應用程式處理）；應用程式可按頁提供資料列，亦可自行繪製儲存格和標題。請參閱 [DataTable](../elements/data-table.md)。

<a id="navigation"></a>

## 導覽

由 `NavPage` 組成的 `NavStack` 在 iOS 上是 `UINavigationController`，在 Android 上則是附帶工具列和預測返回的堆疊；在桌面平台和網頁上，每個頁面顯示應用程式自己的 `header`。請參閱 [NavStack](../elements/nav-stack.md)，其中亦涵蓋 `createNavStack` 和離開頁面。

### Dialog

`Dialog` 在其自己的原生視窗層中，將內容呈現於所有其他內容之上，包括堆疊的標題列。其彈出視窗和背景遮罩由應用程式設定樣式。請參閱 [Dialog](../elements/dialog.md)。

<a id="alert-dialogs"></a>

## 警示對話框

### AlertDialog

`AlertDialog.show(options)` 顯示平台自己的警示或動作表單，並以 `{ action }` 完成，即用戶所選動作的 `id`。請參閱 [AlertDialog](../elements/alert-dialog.md)。

<a id="input"></a>

## 輸入

`Input` 是平台的原生文字輸入：單行或多行欄位，其輸入、插入點、選取、自動校正和自動填入均由平台處理。其值和外觀由應用程式掌管。其 props 是類型 `InputProps`（其中 `ios={{…}}` 使用 `IOSInputProps`），與它一同匯出。請參閱 [Input](../elements/input.md)。

<a id="status-bar"></a>

## 狀態列

狀態列屬於螢幕上正在顯示的內容，就像 UIKit 中，每個 view controller 宣告自己的 `preferredStatusBarStyle`，並由最上層的一個決定。在 NSH 中，頁面和對話框就是那些 view controller：`NavPage` 或 `Dialog` 以 `statusBar` 宣告其想要的狀態列，而應用程式則在 `nsh.json` 中宣告預設值。

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

`statusBar` 接受以下欄位，全部皆為選填（在 Rust 中，可單獨使用 `StatusBarStyle`，或使用 `StatusBarSetting` 中同名的 builder 方法）：

| 欄位 | 類型 | 說明 |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"`（Rust：`StatusBarStyle::Default`、`Light`、`Dark`） | 內容（時間、電量、訊號）的顏色：`"light"` 用於深色背景，`"dark"` 用於淺色背景，`"auto"` 則為平台針對目前外觀所選的顏色。 |
| `hidden` | `boolean` | 隱藏狀態列。 |
| `animated` | `boolean` | 在頁面或對話框出現和離開時，以動畫呈現變化。 |

此值具有響應性：`statusBar={{ foreground: dark() ? "light" : "dark" }}` 會跟隨 signal，讀取 signal 的 Rust 閉包亦然。

<a id="which-one-applies"></a>

### 哪一個生效

**最近**顯示的頁面或對話框會**逐個欄位**決定：推入堆疊的頁面位於其下方頁面之上，而開啟的對話框則位於各頁面之上。它沒有指定的欄位會取自其下方的一層，最終取自應用程式的預設值。當頁面被彈出或對話框關閉時，其下方的一層會再次生效。

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

`nsh.json` 的 `"statusBar"` 是位於所有頁面和對話框之下的設定，就像 UIKit 應用程式中 Info.plist 的 `UIStatusBarStyle` 和 `UIStatusBarHidden` 一樣：

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

兩個欄位都是選填。若未設定，內容為 `"auto"`，並顯示狀態列。已打包的 iOS 應用程式在啟動畫面上也會顯示它。

<a id="the-status-bar-on-each-platform"></a>

### 各平台上的狀態列

- **iOS**：隱藏和顯示時會以淡入淡出動畫呈現。在[嵌入](../docs/ios.md)於原生應用程式的 app 中，由宿主應用程式的 view controller 決定狀態列的外觀。宿主應用程式透過從其 view controller 回傳 `NshAppView.preferredStatusBarStyle`、`NshAppView.prefersStatusBarHidden` 和 `NshAppView.preferredStatusBarUpdateAnimation` 來套用 NSH 的設定。
- **Android**：應用程式以邊到邊方式繪製，延伸至狀態列之後（Android 15，API 35）：應用程式自己的背景即是狀態列的背景，而 `foreground` 可讓其內容在該背景上保持清晰可讀。
- **桌面平台和網頁**：視窗的標題列和瀏覽器的工具列屬於系統和瀏覽器；`statusBar` 和 `nsh.json` 的 `"statusBar"` 僅適用於手機。

> [!IMPORTANT]
> 當你的 `nsh.json` 宣告 `"capabilities"` 時，只有在其中包含 `"statusBar": true` 的情況下，狀態列才會改變；其他變更會被拒絕並記錄。請參閱
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)。

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## 相關內容

- [Navigation guide](../docs/navigation.md)。
- [Forms and keyboard](../docs/forms-and-keyboard.md)。
- [Avatar](../elements/avatar.md)、[Button](../elements/button.md)、[Carousel](../elements/carousel.md)、[Link](../elements/link.md)、[Checkbox](../elements/checkbox.md)、[Radio](../elements/radio.md)、[Switch](../elements/switch.md)、[Tabs](../elements/tabs.md)、[Toggle](../elements/toggle.md)、[Toolbar](../elements/toolbar.md)、[Select](../elements/select.md)、[Combobox](../elements/combobox.md)、[Command](../elements/command.md)、[Calendar](../elements/calendar.md)、[TimeField](../elements/time-field.md)、[DatePicker](../elements/date-picker.md)、[Collapsible](../elements/collapsible.md)、[HoverCard](../elements/hover-card.md)、[Accordion](../elements/accordion.md)、[Progress](../elements/progress.md)、[Slider](../elements/slider.md)、[ColorPicker](../elements/color-picker.md)、[Scrollbar](../elements/scrollbar.md)、[NumberInput](../elements/number-input.md)、[OtpInput](../elements/otp-input.md)、[Pagination](../elements/pagination.md)、[Tree](../elements/tree.md)、[Plot](../elements/plot.md)、[NavStack](../elements/nav-stack.md)、[Dialog](../elements/dialog.md)、[AlertDialog](../elements/alert-dialog.md)、[TextView](../elements/text-view.md)、[Editor](../elements/editor.md)、[DiffView](../elements/diff-view.md)、[Table](../elements/table.md)、[DataTable](../elements/data-table.md)、[Text](../elements/text.md) 和 [Input](../elements/input.md)。
  [AlertDialog](../elements/alert-dialog.md)、[TextView](../elements/text-view.md)、[Editor](../elements/editor.md)、[DiffView](../elements/diff-view.md)、[Table](../elements/table.md)、[DataTable](../elements/data-table.md)、
  [Text](../elements/text.md) 和
  [Input](../elements/input.md)。
- [Device and environment](../docs/device-and-environment.md)。
- [`BackHandler`](./nsh-mobile.md#backhandler)：`BackHandler` 及其他僅限 Android 的 API。
