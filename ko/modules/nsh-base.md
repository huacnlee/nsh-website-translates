---
title: "nsh/base"
description: "앱 UI를 위한 스타일이 적용되지 않은 기본 컴포넌트: 버튼, 링크, 아바타, 캐러셀, 체크박스, 라디오, 스위치, 탭, 토글, 툴바, 트리, 셀렉트, 콤보박스, 커맨드 팔레트, 캘린더, 날짜 선택기, 시간 필드, 크기 조절 가능한 패널, 도킹 가능한 워크스페이스, Markdown 및 HTML 문서, 코드 에디터, diff, 텍스트 입력, 내비게이션 스택과 대화상자, 시스템 알림 대화상자, 그리고 페이지와 대화상자의 상태 표시줄."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` 모듈은 앱 UI의 기본 컴포넌트 계층입니다. 모든 플랫폼에서 동작, 상태, 포커스, 접근성을 담당하는 스타일 없는 컴포넌트로 이루어져 있습니다. 이 계층은 프리미티브(`nsh`, `nsh/mobile`, `nsh/desktop`)와 앱 자체 컴포넌트 라이브러리 사이에 위치하며, GPUI Kit에서 `gpui`과 스타일이 적용된 라이브러리 사이에 `gpui-base`이(가) 놓이는 것과 같습니다([Modules](./index.md#three-layers) 참고). 이 모듈은 다음을 제공합니다. 컨트롤(`Button`, `Link`, `Checkbox`, `ColorPicker`과 그 `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`, `NumberInput`, `Radio`(`RadioGroup` 안), `Slider`, `Switch`, `Tab`(`Tabs` 안), `Toggle`(`ToggleGroup` 안), `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), 명령 팔레트(`Command`), 컨트롤 막대(`Toolbar`과 그 `ToolbarGroup`, `ToolbarSeparator`), 앱 고유의 모양을 가진 스크롤 바(`Scrollbar`), 펼치고 접는 영역(`Collapsible`, 그리고 `Accordion`과 그 `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionPanel`), 진행 막대(`Progress`), 일회용 코드(`OtpInput`), 집합의 페이지(`Pagination`), 항목을 담는 항목(`Tree`), 차트를 구성하는 부품(`Plot`과 `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `nsh/base/plot` 안), 사용자가 배치하는 워크스페이스(`ResizablePanelGroup` 안의 `ResizablePanel`들, 그리고 `DockArea`의 분할, 탭 그룹, 도크), 캐러셀(`Carousel`과 그 부품), Markdown 또는 HTML 문서(`TextView`), 코드 에디터(`Editor`), 텍스트 간 변경 사항(`DiffView`), 행과 열로 이루어진 테이블(`Table`과 그 부품, `DataTable`), 텍스트 입력(`Input`), 모든 것 위에 표시되는 팝업(`Popover`, `Menu`, `ContextMenu`과 그 `MenuItem`, `MenuSeparator`, `Submenu`, `Tooltip`, `Sheet`), 토스트(`ToastStack` 안의 `Toast`, `ToastManager` 안의 수명 주기), 내비게이션(`createNavStack`으로 만든 상태가 구동하는 `NavPage`들의 `NavStack`, 그리고 다른 모든 것 위에 표시되는 콘텐츠를 위한 `Dialog`), 시스템 알림 대화상자(`AlertDialog`). 페이지와 대화상자는 상태 표시줄도 결정합니다(`statusBar`).

기본 세트에는 `Avatar`과 `AvatarGroup`도 포함됩니다. 네이티브 이미지 로딩 상태를 가진 사진과, 처음 `limit`개의 아바타를 배치하는 행입니다.

모양은 앱의 몫입니다. 페이지, 대화상자, 헤더 안에 들어가는 내용은 프리미티브에 스타일, [Tailwind](../docs/tailwind.md) 클래스, 테마를 적용해 작성하는 직접 만든 JSX, [자체 crate](../docs/rust.md)의 Rust 컴포넌트, 또는 커뮤니티가 `nsh/base` 위에 구축한 컴포넌트 라이브러리입니다. 모든 호스트는 `nsh/base`을(를) 제공하며, Rust 앱은 `nsh-base` crate(`nsh_base::{button, dialog, …}`)에서 동일한 API를 사용합니다.

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

이 페이지는 모듈의 색인입니다. 각 컴포넌트에는 예제, props, 플랫폼 참고 사항이 있는 요소 페이지가 있습니다. 단계별 안내는 [Navigation guide](../docs/navigation.md)와 [Forms and keyboard](../docs/forms-and-keyboard.md)를 참고하세요.

| TSX | Rust | 설명 |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | 비활성화 및 선택 상태와 스크린 리더용 역할을 가진 누르기 대상입니다. |
| [`Link`](../elements/link.md) | `link()` | 어딘가로 이동하는 누르기 대상입니다. 시스템을 통해 `href`을(를) 열거나 앱이 직접 엽니다(`openWith="app"`, `onOpen`). |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | 사람의 사진 또는 로딩 중, 실패 시, 사진이 없을 때의 대체 표시(이니셜, 앱 아이콘)와, 처음 `limit`개와 초과분을 보여 주는 행입니다. 로딩 상태는 네이티브입니다. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | 앱이 스타일과 표시를 지정하는 인디케이터를 가진, 선택됨, 선택 안 됨, 불확정 상태의 컨트롤입니다. |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | 사용자가 하나를 고르는 집합의 옵션 하나와 그 집합입니다. 어느 것이 선택되었는지는 앱이 관리합니다. |
| [`Switch`](../elements/switch.md) | `switch()` | 앱이 스타일을 지정하는 트랙과 썸을 가진 켜기 / 끄기 컨트롤입니다. |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | 탭 목록의 탭 하나와 그 목록입니다. 어느 것이 선택되었는지와 그 콘텐츠 표시는 앱이 관리합니다. |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | 켜짐 또는 꺼짐 상태를 가진 버튼과 그 툴바입니다. 어느 것이 눌렸는지는 앱이 관리합니다. |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | 버튼, 토글, 링크의 막대입니다. 키보드 포커스 정지점이 하나이며 화살표 키로 그 안에서 이동합니다. 관련 항목의 그룹과 그 사이의 선도 포함합니다. |
| [`Carousel`](../elements/carousel.md)과 그 부품 | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | 플랫폼 고유의 스크롤로 한 번에 한 곳씩 표시되는 슬라이드이며, 이전 / 다음, 페이지 매김, 키, 끊김 없는 루프를 제공합니다. `index`은(는) 앱이 관리합니다. |
| [`Select`](../elements/select.md) | `select()` | 항목 목록에서 값 하나를 고릅니다. 데스크톱에서는 트리거 위치의 팝업, 휴대폰에서는 시트로 표시됩니다. `value`은(는) 앱이 관리하며 트리거도 앱이 그립니다. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | 입력란에 입력해 필터링되는 항목 목록에서 값 하나 또는 여러 개(`multiple`)를 고릅니다. `value`은(는) 앱이 관리하며 필드 스타일도 앱이 지정합니다. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | 날짜로 이루어진 월 단위 보기에서 날짜 또는 날짜 범위를 고릅니다. 월 및 연도 보기와 키보드를 지원합니다. `value`은(는) 앱이 관리하며 항목도 앱이 그립니다. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | 시, 분, 초, AM/PM 같은 세그먼트 단위로 편집하는 하루 중 시각입니다. `value`은(는) 앱이 관리합니다. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | 데스크톱에서는 트리거 위치의 팝업, 휴대폰에서는 시트로 표시되는 캘린더에서 날짜, 범위, 또는 날짜와 시간을 고릅니다. `value`은(는) 앱이 관리하며 트리거도 앱이 그립니다. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | 콘텐츠가 펼쳐지고 접히는 영역입니다. `open`과 그 트리거는 앱이 관리합니다. |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | 제목 아래에서 펼쳐지고 접히는, 쌓인 섹션입니다. 한 번에 하나 또는 여러 개(`multiple`)를 열 수 있습니다. 열린 항목인 `value`은(는) 앱이 관리합니다. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | 앱이 스타일을 지정하는 셀에 입력하는 일회용 코드입니다. `value`은(는) 앱이 관리하며, `onComplete`은(는) 코드가 다 채워졌을 때를 알려 줍니다. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | 집합의 페이지입니다. 이전, 현재 페이지 주변의 페이지와 줄임표, 앱의 자식, 다음으로 구성됩니다. `page`은(는) 앱이 관리합니다. |
| [`Command`](../elements/command.md) | `command()` | 명령 팔레트입니다. 앱의 명령 위에 있는 검색 필드가 레이블과 키워드로 네이티브하게 필터링하며, 가상화된 목록에 표시됩니다. Return 또는 누르기로 선택하며(`onSelect`), Cmd+K 팔레트용으로 `Dialog` 안에 둘 수 있습니다. |
| [`Tree`](../elements/tree.md) | `tree()` | 항목을 담는 항목이며 가상화됩니다. 펼침과 접힘, 하나의 선택, 키보드 포커스 정지점 하나를 가집니다. `expanded`과 `selected`은(는) 앱이 관리하거나 트리가 자체적으로 유지합니다. |
| [`Progress`](../elements/progress.md) | `progress()` | 진행 막대입니다. `value`(0에서 100)과 `indeterminate`은(는) 앱이 관리합니다. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | 필드에 입력하거나 버튼과 키로 증감하는 숫자입니다. `value`은(는) 앱이 관리하거나 입력란이 `defaultValue`에서 자체적으로 유지합니다. |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | 지정한 스크롤 뷰 또는 목록(`scroll`)을 위한 앱 고유 모양의 스크롤 바입니다. 썸이 콘텐츠를 따라가며 드래그와 누르기로 스크롤합니다. |
| [`Slider`](../elements/slider.md) | `slider()` | 트랙을 따라 고르는 값 하나 또는 두 값의 범위입니다. `value`은(는) 앱이 관리하거나 슬라이더가 `defaultValue`에서 자체적으로 유지합니다. |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | 색상 선택기와 그 부품입니다. 채도와 밝기 영역, RGB, HSL, HSB, OKLCH의 모든 채널과 알파의 슬라이더, 색상 또는 채널의 필드, 견본, 스포이드를 제공합니다. `value`은(는) 앱이 관리하거나 선택기가 `defaultValue`에서 자체적으로 유지합니다. |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | 나란히 또는 쌓아 배치한 패널이며, 사용자가 핸들을 드래그해 크기를 조절합니다. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | 사용자가 배치하는 분할, 탭 그룹, 가장자리 도크의 워크스페이스입니다. 레이아웃은 앱의 데이터입니다. |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | 네이티브 내비게이션 스택과 그 페이지입니다. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | 다른 모든 것 위에 표시되는 콘텐츠입니다. 시트, 전체 화면 흐름, 대화상자가 해당됩니다. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | 플랫폼의 알림 또는 액션 시트입니다. |
| [`TextView`](../elements/text-view.md) | `text_view()` | 텍스트와 뷰로 그려지는 Markdown, HTML 또는 블록 문서이며, 스트리밍되는 AI 응답용입니다. |
| [`Editor`](../elements/editor.md) | `editor()` | 코드 에디터입니다. 구문 강조, 다중 캐럿, 접기, 찾기 및 바꾸기, 진단을 제공합니다. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | 두 텍스트 또는 패치의 변경 사항을 나란히 또는 통합 형식으로 보여 주며, 변경별 동작을 제공합니다. |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | 앱 고유의 행과 셀로 이루어진 테이블이며, 스크린 리더를 위한 테이블 역할을 갖습니다. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | 임의 개수의 행과 열을 가진 테이블입니다. 선택, 정렬, 고정, 크기 조절 및 이동 가능한 열, 한 번에 한 페이지씩 제공되는 행을 지원합니다. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | 한 줄 또는 여러 줄을 지원하는 플랫폼 네이티브 텍스트 입력입니다. |
| [`Popover`](../elements/popover.md) | `popover()` | 트리거에 고정되어 모든 것 위에 표시되는 콘텐츠입니다. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | 포인터가 트리거 위에 머무는 동안(터치 스크린에서는 누르는 동안) 트리거가 가리키는 대상을 미리 보여 줍니다. |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | 메뉴입니다. 데스크톱에서는 계단식 하위 메뉴가 있는 팝업, 휴대폰에서는 시트로 표시되며, 체크 가능한 항목과 단일 선택 항목을 제공합니다. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | 트리거 옆에 표시되는 힌트입니다. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | 백드롭 위에서 화면 가장자리에 표시되는 패널입니다. |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | 스타일 없는 토스트입니다. 시맨틱 루트, 레이어 스택, 그 수명 주기로 구성됩니다. |
| 페이지와 대화상자의 `statusBar` | `.status_bar(..)` | 페이지 또는 대화상자가 표시되어 있는 동안의 상태 표시줄입니다. [Status bar](#status-bar)를 참고하세요. |

Rust에서는 `theme()`이(가) 앱의 테마를 디자인 토큰(`theme().primary`, `theme().radius`)으로 읽으며, 이는 TSX의 [테마 클래스](../docs/tailwind.md#theme-tokens)가 사용하는 토큰과 같습니다.

<a id="controls"></a>

## 컨트롤

### Button

자체 동작을 담당하고 모양은 없는 누르기 대상입니다. 누르기, 비활성화 및 선택 상태, 스크린 리더용 역할을 담당합니다. 모양은 상태 변형이 있는 앱의 `class`과 `style`이며, 콘텐츠는 자식입니다. [Button](../elements/button.md)을 참고하세요.

### Link

어딘가로 이동하며 모양은 없는 누르기 대상입니다. 누르기, 키보드 포커스가 있을 때의 Return과 Space, 비활성화 상태, 스크린 리더용 링크 역할, 내비게이션의 현재 페이지(`current`)를 담당합니다. `href`은(는) 이동할 위치이며 화면에 표시되지 않습니다. 누르면 이를 보고(`onOpen`)한 뒤 웹 페이지나 다른 앱의 링크를 앱 밖에서 열거나, `openWith="app"`을(를) 사용하면 여는 일을 앱 자체 라우트에 맡깁니다. [Link](../elements/link.md)를 참고하세요.

### Checkbox

자체 동작을 담당하고 모양은 없는, 선택됨, 선택 안 됨, 불확정 상태의 컨트롤입니다. 누르기, 키보드 활성화, 비활성화 상태, 스크린 리더용 checkbox 역할과 값(불확정일 때는 mixed)을 담당하며, 값은 앱이 관리합니다(`checked`, `indeterminate`, `onChange`). 앱은 체크박스와 그 인디케이터의 스타일을 지정하며, 인디케이터의 `checked:`, `indeterminate:`, `disabled:` 클래스는 체크박스를 따릅니다. 인디케이터 안에는 앱 자체의 표시를 넣습니다(`indicator`). [Checkbox](../elements/checkbox.md)를 참고하세요.

<a id="radio-and-radiogroup"></a>

### Radio와 RadioGroup

사용자가 정확히 하나를 고르는 집합의 옵션 하나와 그 주변의 집합입니다. Radio는 자체 동작을 담당하고 모양은 없습니다. 누르기, 키보드 활성화, 비활성화 상태, 스크린 리더용 radio 역할과 선택 상태를 담당합니다. 그룹은 스크린 리더가 알리는 radio 그룹이며 값을 가지지 않습니다. 앱이 각 radio에 선택 여부를 알려 주고(`checked`), 선택되지 않은 radio를 누르면 선택을 요청합니다(`onChange`). 앱의 인디케이터와 레이블이 radio의 자식이며, 그 `group-checked:` 클래스는 radio를 따릅니다. [Radio](../elements/radio.md)를 참고하세요.

### Switch

자체 동작을 담당하고 모양은 없는 켜기 / 끄기 컨트롤입니다. 누르기, 키보드 활성화, 비활성화 상태, 스크린 리더용 switch 역할과 값을 담당하며, 값은 앱이 관리합니다(`checked`, `onChange`). 앱은 스위치, 트랙, 썸의 스타일을 지정하며, 그 `checked:`와 `disabled:` 클래스는 스위치를 따릅니다. [Switch](../elements/switch.md)를 참고하세요.

<a id="tab-and-tabs"></a>

### Tab과 Tabs

탭 목록의 탭들과 그 주변의 목록입니다. Tab은 자체 동작을 담당하고 모양은 없습니다. 누르기, 키보드 활성화, 비활성화 상태, 스크린 리더용 tab 역할과 선택 상태를 담당합니다. 목록은 스크린 리더가 알리는 탭 목록이며 값을 가지지 않습니다. 앱이 각 탭에 선택 여부를 알려 주고(`selected`), 누르기를 전달받으며(`onPress`), 선택된 섹션의 콘텐츠를 직접 표시합니다. 앱의 레이블이 탭의 자식이며, 그 `group-selected:` 클래스는 탭을 따릅니다. 목록의 인디케이터(`indicatorClass`, `indicatorStyle`)는 앱이 스타일을 지정하는 밑줄 또는 알약 모양이며, 선택된 탭 위에 놓이고 다음 탭으로 네이티브하게 튕기듯 이동합니다. [Tabs](../elements/tabs.md)를 참고하세요.
### Carousel

한 번에 한 장씩 보여 주는 슬라이드입니다(상품 사진, 온보딩, 배너, 카드 행). 콘텐츠는 슬라이드의 시작 위치에 스냅되는 네이티브 스크롤 뷰이므로 손가락, 휠, 터치패드가 포인터와 같은 프레임에서 슬라이드를 움직입니다. 멈추면 캐러셀이 `onChange`로 현재 슬라이드를 알립니다. 이전과 다음(`CarouselPrevious`, `CarouselNext`), 페이지네이션(`CarouselPagination` 안의 `CarouselPaginationItem`들과, 현재 슬라이드로 스프링처럼 이동하는 인디케이터), 화살표 키가 슬라이드를 네이티브로 움직이며, `looping`으로 양 끝에서도 끊김 없이 이어집니다. 현재 표시 중인 슬라이드는 앱의 `index`이며, 저절로 넘어가는 슬라이드는 앱 자체의 타이머가 진행시킵니다(`onDragStart` / `onDragEnd`, `onFocus` / `onBlur`가 언제 기다릴지 알려 줍니다). 모양과 모든 레이블은 앱이 정합니다. 참고: [Carousel](../elements/carousel.md)

### Toggle and ToggleGroup

켜짐 또는 꺼짐 상태를 갖는 버튼(굵게, 즐겨찾기, 보기 옵션)과 그 버튼들의 툴바입니다. Toggle은 동작만 담당하고 모양은 없습니다. 누르기, 키보드 활성화, 비활성 상태, 그리고 스크린 리더를 위한 눌림 상태를 가진 버튼 역할을 처리합니다. 그룹은 스크린 리더가 안내하는 툴바이며 키보드 포커스의 정지점 하나입니다. 방향키로 토글을 누르지 않고 토글 사이를 이동하며, 값은 갖지 않습니다. 앱이 각 토글에 눌림 여부를 알려 주고(`pressed`), 토글이 요청하는 값을 전달받으며(`onChange`), 여러 개를 누른 상태로 두거나 정확히 하나만 누른 상태로 둘 수 있습니다. 그룹의 `disabled`는 그 안의 모든 토글을 비활성화합니다. 앱의 아이콘이나 레이블이 토글의 children이 되며, 이를 따르는 `group-aria-pressed:` 클래스가 적용됩니다. 참고: [Toggle](../elements/toggle.md)

### Toolbar, ToolbarGroup and ToolbarSeparator

컨트롤의 모음입니다. 텍스트 편집기의 서식 도구, 미디어 플레이어의 재생 컨트롤, 세로 도구 팔레트 등이 해당합니다. 툴바는 스크린 리더가 안내하는 대상(`accessibilityLabel`으로 이름 지정)이며, 그 안의 `Button`, `Toggle`, `Link`에 대해 키보드 포커스의 정지점 하나입니다. Tab은 마지막으로 떠난 항목으로 들어가고, `axis`의 방향키는 항목을 따라 이동하며, Home과 End는 양 끝으로 이동할 뿐 아무것도 누르지 않습니다. `ToolbarGroup`은 관련 항목을 묶어 이름을 붙인 단위이고(실행 취소와 다시 실행, 정렬 등), 툴바 안의 `ToggleGroup`은 그 그룹 중 하나이며 그 토글이 툴바의 항목이 됩니다. `ToolbarSeparator`는 앱이 항목 묶음 사이에 그리는 선입니다. 툴바나 그룹의 `disabled`는 그 안의 모든 항목을 비활성화합니다. 툴바는 값을 갖지 않고 모양도 없습니다. 각 컨트롤이 자신의 상태를 유지하며, 앱이 툴바와 그룹, 구분선의 스타일을 정합니다. 참고: [Toolbar](../elements/toolbar.md)

### Select

데이터로 주어진 항목 목록(`items`: 각각 값과 제목을 가지며, 선택적으로 비활성화하거나 섹션에 속함)에서 값 하나를 선택하며, 모양은 없습니다. 앱의 트리거가 목록을 엽니다. 데스크톱에서는 트리거 위치의 팝업, 휴대폰과 태블릿에서는 하단의 시트로 열립니다. Select는 키보드(Up, Down, Home, End, Page Up과 Down, 타이핑 검색, Return, Escape), 검색(`searchable`), 강조된 행(`itemClass`의 `focus:`, `renderItem`는 항목이 무엇인지만 받고 그 상태는 받지 않음), 그리고 스크린 리더를 위한 combobox, listbox, option 역할을 담당합니다. 앱이 값을 소유하거나(`value`, `onChange`) Select에 맡기고(`defaultValue`), 각 부분의 스타일을 정하거나 행을 직접 그립니다. 참고: [Select](../elements/select.md)

### Combobox

Select의 목록처럼 항목 목록에서 값을 선택하되, Combobox의 입력란에 입력하여 필터링하며 모양은 없습니다. 하나를 선택하거나, `multiple`을 사용하면 여러 개를 선택할 수 있고, 이때는 선택이 항목을 토글하며 목록은 열린 상태로 유지됩니다. 값은 앱이 소유하거나(`value`, `onChange`) Combobox에 맡기는(`defaultValue`) 배열이며, `onConfirm`는 목록이 닫힐 때 그 값을 알립니다. 쿼리는 앱이 소유할 수 있고(`query`, `onQueryChange`), 푸터는 행 아래에 표시되며, 지우기 버튼은 값을 비웁니다. 참고: [Combobox](../elements/combobox.md)

### Calendar

월별 일자에서 날짜 하나, 또는 `range`을 사용하면 날짜 범위를 선택하며, 모양은 없습니다. 한 달 또는 여러 달(`numberOfMonths`)을 나란히 표시하고, 헤더로 월을 넘기거나 월 보기 또는 연도 페이지를 엽니다. 값은 ISO 날짜(`"2026-10-28"`) 또는 `[start, end]`이며 앱이 소유하거나(`value`, `onChange`) Calendar에 맡깁니다(`defaultValue`). `disabledMatcher`는 일자를 선택하지 못하게 하며, 일자는 Tab의 정지점 하나로서 키보드를 받습니다. 앱이 각 부분의 스타일을 정하고 항목을 그립니다(`renderItem`, 항목이 무엇인지 전달받음. 항목의 상태는 클래스로 표현되며, 범위의 일자는 `selected:`에 `data-range-start:`, `data-range-middle:`, `data-range-end:`가 적용됨). 참고: [Calendar](../elements/calendar.md)

### TimeField

시각을 세그먼트 단위로 편집하며 모양은 없습니다. 시(hour), 분(minute), 초(second)(`precision`)와 AM/PM(`hourCycle="h12"`)을 단계 조정, 입력, 또는 휴대폰의 숫자 패드로 편집합니다. 값은 24시간제에서 `"HH:MM"`(`"HH:MM:SS"`)이며, 앱이 소유하거나(`value`, `onChange`) 필드가 자체적으로 가집니다(`defaultValue`). 참고: [TimeField](../elements/time-field.md)

### DatePicker

앱의 트리거에서 열리는 달력에서 날짜를 선택하며, Select의 목록과 같은 방식입니다. 데스크톱에서는 팝업, 휴대폰에서는 시트로 열립니다. 값은 HTML 입력의 형식을 따릅니다. ISO 날짜, `range`이 있는 `[start, end]`, 또는 `timePrecision`가 있는 날짜와 시각(달력 아래의 TimeField)이며, 앱이 소유하거나(`value`, `onChange`) 선택기가 자체적으로 가집니다(`defaultValue`). 프리셋으로 값을 설정하고, 지우기 버튼으로 지우며, `Calendar`의 모든 prop이 그대로 전달됩니다. 참고: [DatePicker](../elements/date-picker.md)

### Collapsible

콘텐츠가 펼쳐지고 접히는 영역이며 모양은 없습니다. children(요약, 트리거)은 항상 표시되고, `content`는 `open`인 동안 그 뒤에 표시됩니다. 앱이 `open`와 그 값을 뒤집는 트리거를 소유하며, 거기에서 펼침 상태를 스크린 리더에 알립니다. 콘텐츠는 한 번 만들어져 접힌 동안에도 유지되므로 그 안의 상태가 보존됩니다. `reveal`을 사용하면 스프링 효과의 높이 변화로 네이티브하게 열리고 닫힙니다. 참고: [Collapsible](../elements/collapsible.md)

### Accordion

제목 아래에서 펼쳐지고 접히는 섹션을 쌓아 놓은 것이며 모양은 없습니다. `Accordion` 안에 `AccordionItem`들이 있고, 각 항목은 `AccordionTrigger`와 `AccordionPanel`를 감싸는 `AccordionHeader`입니다. 앱이 열린 항목의 값인 `value`을 소유하고, 트리거를 눌렀을 때 `onChange`가 보고하는 값을 설정합니다. 한 번에 한 항목만 열리거나, `multiple`로 여러 항목을 열 수 있습니다. 스크린 리더는 제목들의 그룹으로 인식하며, 제목의 버튼이 해당 항목의 펼침 여부를 알려 주고, 열린 각 패널은 영역(region)으로 인식됩니다. `reveal`을 사용하면 패널이 스프링 효과의 높이 변화로 네이티브하게 열리고 닫히며, `keepMounted`을 사용하면 닫힌 동안에도 콘텐츠가 트리에 남아 있습니다. 참고: [Accordion](../elements/accordion.md)

### Avatar

사람의 사진이며 모양은 없습니다. 폴백(`name`의 이니셜 또는 앱의 `fallback`)과 그 위의 사진(로드될 때까지 투명)이 모두 아바타와 같은 크기로 표시되고, 그다음에 앱의 children(접속 상태 점)이 옵니다. 이미지 자체의 load와 error 이벤트가 상태를 네이티브하게 바꾸며(`onStatusChange`), `fallbackDelay`는 사진이 로드되는 동안 폴백을 뒤에 둡니다. 스크린 리더는 이름이 레이블로 붙은 이미지로 인식합니다. `AvatarGroup`는 처음 `limit`개의 아바타만 표시하고 나머지는 뷰를 만들지 않으며, `total`가 더 있는 동안 `overflow`를 표시합니다. 참고: [Avatar](../elements/avatar.md)

### Progress

선형 진행 표시줄이며 모양은 없습니다. 트랙과 그 안의 인디케이터로 구성되며, 인디케이터는 트랙 너비의 `value` 퍼센트입니다. 앱이 `value`(0에서 100)과 `indeterminate`를 소유합니다. 스크린 리더는 progress bar 역할, 범위, 값을 받으며, 불확정(indeterminate) 상태에서는 값이 없고 이때 인디케이터의 너비와 움직임은 앱이 정합니다. 참고: [Progress](../elements/progress.md)

### NumberInput

필드에 입력하거나 단계적으로 조정하는 숫자이며 모양은 없습니다. 필드(`Input`), 그 앞의 감소 버튼, 뒤의 증가 버튼(또는 오른쪽에 세로로 둘 다 배치, `controlsRight`)으로 구성됩니다. 앱이 `value`(숫자 또는 `null`. 또는 입력이 `defaultValue`에서 시작해 자체적으로 유지)을 소유하고, 필드가 읽어 낸 숫자와 함께 `onChange`를 전달받습니다. 필드는 숫자 또는 숫자가 되어 가는 중의 텍스트를 받으며, 다른 키보드의 숫자와 부호도 포함합니다. 버튼, Up / Down, Page Up / Page Down은 `step`만큼 값을 조정하되 소수 자릿수를 유지하고 `min`와 `max`까지 허용하며, 필드를 벗어날 때 입력된 값은 이 범위에 맞춰집니다. 필드는 스크린 리더에게 스핀 버튼이며, 스크린 리더의 증가와 감소 동작으로 값을 조정합니다. 참고: [NumberInput](../elements/number-input.md)

### Slider

트랙을 따라 값 하나 또는 두 값의 범위를 선택하며 모양은 없습니다. 누르기와 드래그를 받는 트랙, 값이 대응되는 그 안의 인디케이터, 범위, 그리고 값마다 하나씩의 썸(thumb)으로 구성됩니다. 앱이 `value`(숫자 또는 `[start, end]`. 또는 슬라이더가 `defaultValue`에서 시작해 자체적으로 유지)을 소유하고, 새 값마다 `onChange`를 전달받습니다. 값은 `min`에서 시작하는 `step`에 스냅되며, `onChangeEnd`는 변경마다 한 번 호출됩니다. `scale`은 값을 선형 또는 자릿수 단위로 분배하고, `axis`는 트랙을 가로 또는 세로로 배치합니다. 각 썸은 스크린 리더에게 고유한 값을 가진 조정 가능한 요소이며 키보드 포커스의 정지점이고, WAI-ARIA의 슬라이더 키로 움직입니다. 참고: [Slider](../elements/slider.md)

### Scrollbar

스크롤 뷰나 리스트를 위한 앱 고유 모양의 스크롤 바이며, 앱이 원하는 위치에 배치하고 모양은 없습니다. 트랙(바의 `class`)과 그 안의 썸(`thumbClass`)으로 구성됩니다. 스크롤 뷰(`scroll`, 그 `ref`)를 지정하고 그 오프셋, 콘텐츠, 뷰포트를 따라갑니다. 썸을 드래그하면 콘텐츠가 스크롤되고, 트랙을 누르면 썸의 가운데가 그 위치로 이동합니다. `mode`는 콘텐츠가 스크롤되는 동안(이후 `motion.idle`까지), 포인터가 바 위에 있는 동안, 또는 항상 바를 표시하며, `axis`는 바를 가로로 만듭니다. `Scrollbar.setTheme`는 배치할 바 없이 모든 스크롤 뷰와 리스트의 뷰포트 위에 앱 고유 모양의 바를 제공하며, 뷰는 `scrollbar` prop으로 자신만의 테마를 받을 수 있습니다. 참고: [Scrollbar](../elements/scrollbar.md)

### ColorPicker

모양이 없는 색상 선택기입니다. 루트가 색을 보유하고, 그 안의 부분들이 색을 표시하고 변경하며 배치는 앱이 정합니다. `ColorArea`는 HSB의 채도와 명도, `ColorSlider`는 RGB, HSL, HSB, OKLCH의 임의 채널 또는 알파(가로 또는 세로), `ColorField`는 임의의 CSS 형식의 색 또는 채널의 숫자, `ColorSwatch`는 눌러서 선택하는 프리셋 또는 색의 미리보기, `ColorEyeDropper`는 화면에서 색을 고르는 버튼(macOS, 웹)입니다. 앱이 `value`(또는 선택기가 `defaultValue`에서 시작해 자체적으로 유지)을 소유하고, `onChange`와 `onChangeEnd`를 색과 `format`가 쓴 텍스트와 함께 전달받습니다. 선택기는 각 색 공간의 채널을 사용자가 설정한 그대로 유지합니다. 썸은 스크린 리더에게 조정 가능한 요소이며 키보드 포커스의 정지점입니다. 참고: [ColorPicker](../elements/color-picker.md)

### OtpInput

고정 길이의 숫자 일회용 코드이며 모양은 없습니다. 셀 위의 네이티브 텍스트 필드 하나가 키보드를 받으므로 입력, 붙여넣기, 숫자 패드, 시스템의 코드 자동 완성은 플랫폼이 처리하며, 스크린 리더는 텍스트 필드 하나로 인식합니다. 숫자만 입력되며 `length`까지 허용되고, Backspace는 마지막 숫자를 지웁니다. 앱이 `value`(또는 `defaultValue`를 지정)을 소유하고 `onChange`와 `onComplete`를 전달받으며, 셀(다음 숫자를 받을 셀의 `focus:`, 숫자가 들어 있는 셀의 `data-filled:`), 셀 그룹, 캐럿의 스타일을 정합니다. 참고: [OtpInput](../elements/otp-input.md)

### Pagination

집합의 페이지 사이를 이동하는 내비게이션 랜드마크이며 모양은 없습니다. 이전, 첫 페이지와 마지막 페이지, 현재 페이지와 그 이웃(`visiblePages`), 생략된 구간마다 하나씩의 줄임표, 앱의 children, 다음으로 구성되며, `compact`는 이전, children, 다음만 남깁니다. 앱이 `page`를 소유하고 `onChange({ page })`를 전달받으며, 현재 페이지는 `selected:`이고 스크린 리더에게는 현재 페이지로 안내됩니다. 앱이 항목(`itemClass`)의 스타일을 정하거나 직접 그립니다(`renderItem`). 참고: [Pagination](../elements/pagination.md)

### Command

커맨드 팔레트로, 앱의 명령(`items`: `id`, `label`, `keywords`, `group`, 표시할 `shortcut`, `disabled`, `checked`) 위에 놓인 검색 필드입니다. 사용자가 입력하는 대로 네이티브하게 필터링되며(레이블 또는 키워드가 쿼리를 포함하는지 대소문자 구분 없이 확인하고, 일치하는 항목이 없는 섹션은 사라짐), 화면에 보이는 행만 만드는 가상화된 리스트에 표시됩니다. Up과 Down은 강조 표시를 이동하고, Return 또는 누르기는 선택하며(`onSelect({ id })`), Escape는 쿼리를 지운 다음 `onCancel`를 보고하고, 앱은 이를 감싸는 `Dialog`를 닫습니다. 쿼리는 앱이 소유하거나(`query`, `onQueryChange`) 필드가 자체적으로 가지며, `filterable={false}`와 `loading`를 사용하면 앱이 서버에서 응답을 받아 처리합니다. 앱이 모든 부분의 스타일을 정하고(강조 표시용 `focus:`가 있는 `itemClass`, `checked:`, `disabled:`), 행을 그립니다(`renderItem`, 여기에 표시되는 대로의 단축키를 전달받음). 참고: [Command](../elements/command.md)

### Tree

항목이 항목을 담는 구조입니다. 프로젝트의 파일, 설정 사이드바, 개요 등이 해당합니다. `items`는 데이터(`TreeItem`: `id`, `label`, `children`, `disabled`)이며, 행은 가상화됩니다. 화면에 보이는 행만 만들어지고 접힌 항목의 자식은 만들어지지 않으므로, 수천 개의 항목이 있는 트리도 빠르게 유지됩니다. 앱이 펼쳐진 ID와 선택된 ID를 소유하거나(`expanded`, `selected`, `onExpandedChange`와 `onSelectedChange` 사용) 트리가 자체적으로 유지합니다(`defaultExpanded`, `defaultSelected`). 누르면 행이 선택되고 폴더가 펼쳐지거나 접힙니다. 트리는 키보드 포커스의 정지점 하나이며 방향키가 선택을 이동합니다(Right와 Left는 펼치기, 접기, 폴더 안으로 들어가기와 나오기). Home, End, Return, Space, 타이핑 검색도 지원합니다. 앱이 행의 스타일을 정하고(`selected:`, `aria-expanded:`, `focus:`가 있는 `itemClass`), 행을 그립니다(`renderItem`, 각 항목의 `depth`를 전달받음). 참고: [Tree](../elements/tree.md)
### Plot (`nsh/base/plot`)

차트를 구성하는 부분들은 `gpui-base`의 `plot`로서 별도의 모듈에 들어 있습니다: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
는 행의 검사되는 키 또는 함수입니다), 축의 `point`, `linear` 또는 `band` 스케일, 포인터 아래의 행
(`onHoverChange`)과 그 모션(`motion`: 등장, 호버 시의 페이드와 글라이드)을 다룹니다. 마크는 행으로부터 네이티브로 그려지며 포인트마다 JS를 실행하지 않고, SVG paint 속성(`stroke-*`, `fill-*`)으로 칠해지며, 아무것도 지정하지 않은 경우 `currentColor`를 사용합니다. `Area` 또는 `Bar`는 도형 안쪽에 배경(그라디언트, `bg-linear-*`)을 표시합니다. 막대는 `band` 스케일의 밴드 안에 나란히 서거나 `stack`로 쌓이고, 플롯이 나타날 때 자라며, 포인터 아래의 행에서 멀어지는 막대는 페이드 아웃되고, 각 막대의 끝에는 `label` 파트가 붙습니다. 호버 시의 십자선, 점(`hoverDotClass`가 있는 각 마크의 고유한 점), 툴팁(`tooltipPlacement`, 플롯 안에 유지됨)은 앱이 스타일을 지정하고 내용을 채우는 파트이며 네이티브로 이동합니다. 축 레이블은 앱 자체의 요소입니다. `Pie`는 한 바퀴를 행마다 하나의 슬라이스로 나누고(`innerRadius`가 있는 도넛 형태), 각 슬라이스는 자신의 클래스(`sliceClass`, 행의 함수)로 칠해지며, `Arc`는 두 각도 사이의 섹터 하나를 그립니다(게이지의 트랙과 값). 파이 위에서 플롯은 포인터 아래의 슬라이스를 보고하며, 그 슬라이스는 올라오고(`hoverLift`) 나머지는 페이드됩니다(`hoverDim`). `Sankey`는 행 사이의 흐름을 그리며(`links`), d3-sankey가 배치하는 방식으로 배치되고, 각 노드와 리본은 자신의 클래스로 칠해지며, 노드에는 레이블이 붙고, 호버할 수 있으며, 새 흐름으로 이동합니다. `Treemap`는 행을 중첩된 사각형의 계층으로 타일링하며(`id`, `parent`), 각 리프의 면적은 그 `value`이고, 카테고리별로 또는 플롯의 `colorScale` 램프를 따라 색이 지정되며, 레이블은 들어갈 수 있는 곳에 표시됩니다. [Plot](../elements/plot.md)을 참고하세요.

<a id="workspaces"></a>

## 워크스페이스

### ResizablePanelGroup and ResizablePanel

패널을 나란히 또는 쌓아서 배치하고, 각 패널 사이의 핸들을 사용자가 드래그해 공간을 나눕니다. 그룹은 네이티브로 실행되는 드래그, 각 패널의 한계(`minSize`, `maxSize`), 리사이즈 커서를 담당하며, 크기는 앱의 것(`size`, `onResize`로 보고됨)이고 핸들의 모양과 패널의 내용도 마찬가지입니다. [Resizable](../elements/resizable.md)을 참고하세요.

### DockArea

도킹 가능한 워크스페이스입니다. 패널은 탭 그룹에 들어 있고, 그룹은 나란히 또는 쌓아서 분할되며, 도크는 왼쪽, 오른쪽, 아래쪽 가장자리에 놓입니다. 레이아웃은 앱이 소유하는 데이터(`layout`, `onLayoutChange`로 보고됨)이며, 영역은 탭 드래그와 드롭, 리사이즈, 도크, 확대, 잠금을 담당하고, 패널이 이동해도 각 패널의 내용을 유지하며, 좁은 화면에서는 같은 레이아웃을 드로어와 바텀 시트로 표시합니다. 탭, 핸들, 드롭 표시기, 패널의 내용은 앱의 것입니다. [Dock](../elements/dock.md)을 참고하세요.

<a id="documents"></a>

## 문서

### TextView

`TextView`는 Markdown, HTML 또는 앱이 만든 블록으로 된 문서를 [`Text`](../elements/text.md) 요소와 뷰로 그려서 보여 줍니다: 제목, 목록, 코드, 표, 이미지, 수식, 각주, 앱 고유의 구문을 지원합니다. 스트리밍으로 들어오는 AI 채팅 응답을 위해 만들어졌으며, 테마 색상의 읽기용 타이포그래피를 제공하고 앱이 파트별로 다시 스타일을 지정할 수 있으며, 렌더 함수로 앱의 콘텐츠를 제자리에 넣을 수 있습니다. [TextView](../elements/text-view.md)를 참고하세요.

<a id="code"></a>

## 코드

### Editor

`Editor`는 50개가 넘는 언어를 위한 코드 에디터입니다: 구문 강조, 줄 번호, 다중 캐럿, 접기, 소프트 랩, 찾기 및 바꾸기, 진단과 장식을 지원하며 코드 에디터의 단축키를 따릅니다. 텍스트는 앱의 것(`value`와 `onChange`)이고, 에디터의 `search`를 구동하는 찾기 바도 마찬가지입니다. 테마의 토큰으로 만든 룩이 함께 제공되며 앱이 파트별로 다시 스타일을 지정할 수 있습니다. [Editor](../elements/editor.md)를 참고하세요.

### DiffView

`DiffView`는 코드 리뷰 도구처럼 두 텍스트 사이 또는 패치의 파일들의 변경 사항을 보여 줍니다: 나란히 보기 또는 통합 보기, 줄 안에서 바뀐 단어 강조, 펼칠 수 있는 구분선으로 접힌 변경 없는 줄, `Editor`의 구문 색상을 사용합니다. 앱의 액션으로 각 변경을 유지하거나 되돌립니다. [DiffView](../elements/diff-view.md)를 참고하세요.

### Table

`Table`와 그 파트는 앱이 children으로 작성한 몇 개의 행을 배치하고, 스크린 리더에 표를 제공합니다: 행 그룹, 행, 열 헤더, 셀. 모든 파트는 앱의 룩을 따릅니다. [Table](../elements/table.md)을 참고하세요.

### DataTable

`DataTable`는 행과 열을 보여 주며, 어느 쪽이든 개수에 관계없이 양방향으로 스크롤하고 보이는 셀만 만듭니다. 행, 열 또는 셀을 선택할 수 있으며, 열은 크기 조절, 이동, 고정, 정렬(정렬은 앱이 수행)이 가능하고, 앱은 한 번에 한 페이지씩 행을 제공하며 셀과 제목을 직접 그릴 수 있습니다. [DataTable](../elements/data-table.md)을 참고하세요.

<a id="navigation"></a>

## 내비게이션

`NavPage`의 `NavStack`은 iOS에서는 `UINavigationController`이고 Android에서는 툴바와 predictive back이 있는 스택이며, 데스크톱과 웹에서는 각 페이지가 앱 자체의 `header`를 표시합니다. `createNavStack`와 페이지 떠나기도 다루는 [NavStack](../elements/nav-stack.md)을 참고하세요.

### Dialog

`Dialog`는 스택의 헤더를 포함한 다른 모든 것 위에, 자체 네이티브 윈도우 레이어에서 콘텐츠를 표시합니다. 팝업과 백드롭은 앱이 스타일을 지정합니다. [Dialog](../elements/dialog.md)를 참고하세요.

<a id="alert-dialogs"></a>

## 알림 대화상자

### AlertDialog

`AlertDialog.show(options)`는 플랫폼 고유의 알림 또는 액션 시트를 표시하고, 사용자가 선택한 액션의 `id`인 `{ action }`로 결과를 반환합니다. [AlertDialog](../elements/alert-dialog.md)를 참고하세요.

## Input

`Input`는 플랫폼의 네이티브 텍스트 입력입니다: 입력, 캐럿, 선택, 자동 수정, 자동 완성을 플랫폼이 처리하는 한 줄 또는 여러 줄 필드입니다. 값과 룩은 앱이 소유합니다. props는 타입 `InputProps`(`ios={{…}}`용 `IOSInputProps` 포함)이며 함께 export됩니다. [Input](../elements/input.md)을 참고하세요.

<a id="status-bar"></a>

## 상태 표시줄

상태 표시줄은 화면에 표시되는 것에 속합니다. UIKit에서 각 뷰 컨트롤러가 자신의 `preferredStatusBarStyle`를 선언하고 가장 위에 있는 것이 결정하는 것과 같습니다. NSH에서는 페이지와 대화상자가 그 뷰 컨트롤러에 해당합니다: `NavPage` 또는 `Dialog`는 원하는 상태 표시줄을 `statusBar`로 선언하고, 앱은 기본값을 `nsh.json`에서 선언합니다.

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

`statusBar`는 다음 필드를 받으며, 모두 선택 사항입니다(Rust에서는 `StatusBarStyle` 단독으로, 또는 같은 이름의 `StatusBarSetting` 빌더 메서드로):

| 필드 | 타입 | 설명 |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | 콘텐츠(시간, 배터리, 신호)의 색상: 어두운 배경에는 `"light"`, 밝은 배경에는 `"dark"`, 현재 외관에 맞는 플랫폼 기본값은 `"auto"`. |
| `hidden` | `boolean` | 상태 표시줄을 숨깁니다. |
| `animated` | `boolean` | 페이지나 대화상자가 나타나고 사라질 때 변경을 애니메이션으로 처리합니다. |

값은 반응형입니다: `statusBar={{ foreground: dark() ? "light" : "dark" }}`는 시그널을 따르며, 시그널을 읽는 Rust 클로저도 마찬가지입니다.

<a id="which-one-applies"></a>

### 적용되는 설정

**가장 최근에** 표시된 페이지 또는 대화상자가 **필드별로** 결정합니다: 스택에 push된 페이지는 그 아래 페이지들보다 위에 있고, 열린 대화상자는 페이지들보다 위에 있습니다. 그것이 생략한 필드는 그 아래의 것에서, 최종적으로는 앱의 기본값에서 가져옵니다. 페이지가 pop되거나 대화상자가 닫히면 그 아래의 것이 다시 적용됩니다.

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

### 앱의 기본값

`nsh.json`의 `"statusBar"`는 UIKit 앱에서 Info.plist의 `UIStatusBarStyle`와 `UIStatusBarHidden`처럼 모든 페이지와 대화상자 아래에 깔리는 설정입니다:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

두 필드 모두 선택 사항입니다. 이를 지정하지 않으면 콘텐츠는 `"auto"`이고 상태 표시줄이 표시됩니다. 패키징된 iOS 앱은 시작 화면에서도 이를 표시합니다.

<a id="the-status-bar-on-each-platform"></a>

### 플랫폼별 상태 표시줄

- **iOS**: 숨기기와 보이기는 페이드로 애니메이션됩니다. 네이티브 앱에 [임베드](../docs/ios.md)된 앱에서는 호스트 앱의 뷰 컨트롤러가 상태 표시줄의 모양을 결정합니다. 호스트 앱은 자신의 뷰 컨트롤러에서 `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden`, `NshAppView.preferredStatusBarUpdateAnimation`를 반환하여 NSH의 설정을 적용합니다.
- **Android**: 앱은 상태 표시줄 뒤까지 가장자리에서 가장자리까지 그립니다(Android 15, API 35): 앱 자체의 배경이 곧 바의 배경이며, `foreground`가 그 위에서 콘텐츠를 읽을 수 있게 유지합니다.
- **데스크톱과 웹**: 창의 제목 표시줄과 브라우저의 바는 시스템과 브라우저의 것이며, `statusBar`와 `nsh.json`의 `"statusBar"`는 휴대폰용입니다.

> [!IMPORTANT]
> `nsh.json`가 `"capabilities"`를 선언하면, 상태 표시줄은 그 목록에 `"statusBar": true`가 포함된 경우에만 변경되며, 그 외의 변경은 거부되고 로그에 기록됩니다. [샌드박스와 권한](../docs/sandbox-and-capabilities.md)을 참고하세요.

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## 관련 항목

- [내비게이션 가이드](../docs/navigation.md).
- [폼과 키보드](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md), [Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md),
  [Input](../elements/input.md).
- [기기 및 환경](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` 및 기타 Android 전용 API.
