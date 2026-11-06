---
title: "nsh/base"
description: "アプリの UI のためのスタイルなしのベースコンポーネント: ボタン、リンク、アバター、カルーセル、チェックボックス、ラジオ、スイッチ、タブ、トグル、ツールバー、ツリー、セレクト、コンボボックス、コマンドパレット、カレンダー、日付ピッカー、時刻フィールド、サイズ変更可能なパネル、ドッキング可能なワークスペース、Markdown および HTML ドキュメント、コードエディタ、差分表示、テキスト入力、ナビゲーションスタックとダイアログ、システムアラートダイアログ、ページおよびダイアログのステータスバー。"
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` は、アプリのUIの基盤となるコンポーネント層です。スタイルを持たず、動作、状態、フォーカス、アクセシビリティをすべてのプラットフォームで担うコンポーネントを提供します。プリミティブ（`nsh`、`nsh/mobile`、`nsh/desktop`）とアプリ独自のコンポーネントライブラリの間に位置し、GPUI Kit で `gpui-base` が `gpui` とスタイル付きライブラリの間にあるのと同じ関係です（[モジュール](./index.md#three-layers)を参照）。提供するのは次のものです。コントロール（`Button`、`Link`、`Checkbox`、`ColorPicker`（`ColorArea` 付き）、`ColorSlider`、`ColorField`、`ColorSwatch`、`ColorEyeDropper`、`NumberInput`、`Radio`（`RadioGroup` 内）、`Slider`、`Switch`、`Tab`（`Tabs` 内）、`Toggle`（`ToggleGroup` 内）、`Select`、`Combobox`、`Calendar`、`TimeField`、`DatePicker`）、コマンドパレット（`Command`）、コントロールのバー（`Toolbar`、`ToolbarGroup`、`ToolbarSeparator`）、アプリ独自の見た目のスクロールバー（`Scrollbar`）、展開・折りたたみできる領域（`Collapsible`、および `Accordion`、`AccordionItem`、`AccordionHeader`、`AccordionTrigger`、`AccordionPanel`）、プログレスバー（`Progress`）、ワンタイムコード（`OtpInput`）、セットのページ（`Pagination`）、項目を保持する項目（`Tree`）、チャートを構成する部品（`Plot`、`Line`、`Area`、`Bar`、`Rule`、`Dot`、`Cell`、`Grid`、`Pie`、`Arc`、`nsh/base/plot` 内）、ユーザーが配置するワークスペース（`ResizablePanelGroup` 内の `ResizablePanel`、および `DockArea` のスプリット、タブグループ、ドック）、カルーセル（`Carousel` とその部品）、MarkdownまたはHTMLのドキュメント（`TextView`）、コードエディター（`Editor`）、テキスト間の変更点（`DiffView`）、行と列のテーブル（`Table` とその部品、`DataTable`）、テキスト入力（`Input`）、すべての上に表示されるポップアップ（`Popover`、`Menu`、`ContextMenu` とそれぞれの `MenuItem`、`MenuSeparator`、`Submenu`、`Tooltip`、`Sheet`）、トースト（`ToastStack` 内の `Toast`、ライフサイクルは `ToastManager`）、ナビゲーション（`createNavStack` で作成する状態によって動く `NavPage` の `NavStack`、および他のすべての上に表示するコンテンツのための `Dialog`）、そしてシステムのアラートダイアログ（`AlertDialog`）です。ページとダイアログはステータスバー（`statusBar`）も決定します。

基本セットには `Avatar` と `AvatarGroup` も含まれます。ネイティブの画像読み込み状態を持つ画像と、先頭の `limit` 人のアバターを並べる行です。

見た目はアプリ側のものです。ページ、ダイアログ、ヘッダーの中身は、プリミティブからスタイル、[Tailwind](../docs/tailwind.md) クラス、テーマを使って組み立てる独自のJSX、[独自のクレート](../docs/rust.md)の Rust コンポーネント、あるいは `nsh/base` 上にコミュニティが構築するコンポーネントライブラリで構成します。すべてのホストが `nsh/base` を提供し、Rust アプリは `nsh-base` クレート（`nsh_base::{button, dialog, …}`）から同じ API を使います。

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

このページはモジュールの索引です。各コンポーネントには、例、props、プラットフォームごとの注意点を載せた要素ページがあります。解説は [ナビゲーションガイド](../docs/navigation.md)と[フォームとキーボード](../docs/forms-and-keyboard.md)を参照してください。

| TSX | Rust | 概要 |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | 無効状態と選択状態、およびスクリーンリーダー向けのロールを持つ押下対象。 |
| [`Link`](../elements/link.md) | `link()` | どこかへ移動する押下対象。`href` をシステス経由で開くか、アプリが開きます（`openWith="app"`、`onOpen`）。 |
| [`Avatar`](../elements/avatar.md)、[`AvatarGroup`](../elements/avatar.md) | `avatar()`、`avatar_group()` | 人物の画像。読み込み中、失敗時、画像がない場合は代替表示（イニシャル、アプリのアイコン）になります。また、先頭の `limit` 件と超過分を表示する行。読み込み状態はネイティブです。 |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | チェック済み、未チェック、不確定を表すコントロール。インジケーターとそのマークはアプリがスタイルを指定します。 |
| [`Radio`](../elements/radio.md)、[`RadioGroup`](../elements/radio.md) | `radio()`、`radio_group()` | ユーザーが1つ選ぶセットの選択肢1つと、そのセット。どれがチェックされるかはアプリが持ちます。 |
| [`Switch`](../elements/switch.md) | `switch()` | オン/オフのコントロール。トラックとサムはアプリがスタイルを指定します。 |
| [`Tab`](../elements/tabs.md)、[`Tabs`](../elements/tabs.md) | `tab()`、`tabs()` | タブリストの1つのタブと、そのリスト。どれが選択されるかはアプリが持ち、その内容もアプリが表示します。 |
| [`Toggle`](../elements/toggle.md)、[`ToggleGroup`](../elements/toggle.md) | `toggle()`、`toggle_group()` | オンまたはオフのボタンと、そのツールバー。どれが押された状態かはアプリが持ちます。 |
| [`Toolbar`](../elements/toolbar.md)、[`ToolbarGroup`](../elements/toolbar.md)、[`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`、`toolbar_group()`、`toolbar_separator()` | ボタン、トグル、リンクのバー。キーボードフォーカスの停止位置は1つで、矢印キーでバー内を移動します。関連する項目のグループと、その間の線。 |
| [`Carousel`](../elements/carousel.md) とその部品 | `carousel()`、`carousel_content()`、`carousel_item()`、`carousel_previous()`、`carousel_next()`、`carousel_pagination()`、`carousel_pagination_item()` | プラットフォーム標準のスクロールで1か所ずつ表示されるスライド。前へ/次へ、ページネーション、キー操作、シームレスなループを備えます。`index` はアプリが持ちます。 |
| [`Select`](../elements/select.md) | `select()` | 項目のリストから1つの値を選びます。デスクトップではトリガーの位置にポップアップ、スマートフォンではシートで表示します。`value` はアプリが持ち、トリガーも描画します。 |
| [`Combobox`](../elements/combobox.md) | `combobox()` | 入力欄への入力で絞り込んだ項目リストから、1つまたは複数（`multiple`）の値を選びます。`value` はアプリが持ち、フィールドもスタイルします。 |
| [`Calendar`](../elements/calendar.md) | `calendar()` | 月ごとの日の並びから日付または日付範囲を選びます。月・年ビューとキーボード操作に対応します。`value` はアプリが持ち、項目も描画します。 |
| [`TimeField`](../elements/time-field.md) | `time_field()` | 時刻をセグメント（時、分、秒、AM/PM）ごとに編集します。`value` はアプリが持ちます。 |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | カレンダーから日付、範囲、または日付と時刻を選びます。デスクトップではトリガーの位置のポップアップ、スマートフォンではシートで表示します。`value` はアプリが持ち、トリガーも描画します。 |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | 内容が展開・折りたたみされる領域。`open` とそのトリガーはアプリが持ちます。 |
| [`Accordion`](../elements/accordion.md)、[`AccordionItem`](../elements/accordion.md)、[`AccordionHeader`](../elements/accordion.md)、[`AccordionTrigger`](../elements/accordion.md)、[`AccordionPanel`](../elements/accordion.md) | `accordion()`、`accordion_item()`、`accordion_header()`、`accordion_trigger()`、`accordion_panel()` | 見出しの下で展開・折りたたみされる、積み重ねられたセクション。一度に1つ、または複数（`multiple`）を開けます。開いている項目である `value` はアプリが持ちます。 |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | アプリがスタイルを指定するセルに入るワンタイムコード。`value` はアプリが持ち、`onComplete` が入力完了を知らせます。 |
| [`Pagination`](../elements/pagination.md) | `pagination()` | セットのページ。前へ、現在のページの周辺のページと省略記号、アプリの子要素、次へで構成されます。`page` はアプリが持ちます。 |
| [`Command`](../elements/command.md) | `command()` | コマンドパレット。アプリのコマンドに対する検索フィールドがあり、ラベルとキーワードでネイティブに絞り込まれ、仮想化リストに表示されます。Return または押下で選択します（`onSelect`）。Cmd+K のパレットには `Dialog` 内で使います。 |
| [`Tree`](../elements/tree.md) | `tree()` | 項目を保持する項目（仮想化）。展開・折りたたみ、1つの選択、キーボードフォーカスの停止位置は1つです。`expanded` と `selected` はアプリが持つか、ツリーが独自に保持します。 |
| [`Progress`](../elements/progress.md) | `progress()` | プログレスバー。`value`（0〜100）と `indeterminate` はアプリが持ちます。 |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | フィールドに入力するか、ボタンやキーで増減する数値。`value` はアプリが持ちます（または入力が `defaultValue` から独自に保持します）。 |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | 指定したスクロールビューまたはリスト（`scroll`）向けの、アプリ独自の見た目のスクロールバー。サムはコンテンツに追従し、ドラッグと押下でスクロールします。 |
| [`Slider`](../elements/slider.md) | `slider()` | トラック上で選ぶ値、または2つの値による範囲。`value` はアプリが持ちます（またはスライダーが `defaultValue` から独自に保持します）。 |
| [`ColorPicker`、`ColorArea`、`ColorSlider`、`ColorField`、`ColorSwatch`、`ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`、`color_area()`、`color_slider()`、`color_field()`、`color_swatch()`、`color_eye_dropper()` | カラーピッカーとその部品。彩度・明度エリア、RGB、HSL、HSB、OKLCH の任意のチャンネルとアルファのスライダー、色またはチャンネルのフィールド、スウォッチ、スポイトを備えます。`value` はアプリが持ちます（またはピッカーが `defaultValue` から独自に保持します）。 |
| [`ResizablePanelGroup`、`ResizablePanel`](../elements/resizable.md) | `h_resizable()`、`v_resizable()`、`resizable_panel()` | 横に並べた、または縦に積んだパネル。ユーザーがハンドルをドラッグしてサイズを変更します。 |
| [`DockArea`](../elements/dock.md) | `dock_area()` | ユーザーが配置するスプリット、タブグループ、端のドックからなるワークスペース。レイアウトはアプリのデータです。 |
| [`NavStack`、`NavPage`、`createNavStack`](../elements/nav-stack.md) | `nav_stack()`、`nav_page()` | ネイティブのナビゲーションスタックとそのページ。 |
| [`Dialog`](../elements/dialog.md) | `dialog()` | 他のすべての上に表示されるコンテンツ。シート、フルスクリーンフロー、ダイアログ。 |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | プラットフォームのアラートまたはアクションシート。 |
| [`TextView`](../elements/text-view.md) | `text_view()` | Markdown、HTML、ブロックのドキュメント。テキストとビューで描画され、ストリーミングされる AI の返信に使えます。 |
| [`Editor`](../elements/editor.md) | `editor()` | コードエディター。シンタックスハイライト、複数キャレット、折りたたみ、検索と置換、診断を備えます。 |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | 2つのテキスト間、またはパッチの変更点を、左右並べまたは統合表示で示します。変更ごとのアクションも備えます。 |
| [`Table`、`TableHeader`、`TableBody`、`TableFooter`、`TableRow`、`TableHead`、`TableCell`、`TableCaption`](../elements/table.md) | `table()`、`table_row()`、... | アプリ独自の行とセルによるテーブル。スクリーンリーダー向けのテーブルロールを持ちます。 |
| [`DataTable`](../elements/data-table.md) | `data_table()` | 任意の数の行と列を持つテーブル。選択、並べ替え、固定・サイズ変更可能・移動可能な列、1ページずつ提供される行に対応します。 |
| [`Input`](../elements/input.md) | `nsh_base::input()` | プラットフォームネイティブのテキスト入力。1行または複数行。 |
| [`Popover`](../elements/popover.md) | `popover()` | トリガーに固定され、すべての上に表示されるコンテンツ。 |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | ポインターが載っている間（タッチスクリーンでは押下時）に、トリガーが指すもののプレビューを表示します。 |
| [`Menu`、`ContextMenu`、`MenuItem`、`MenuSeparator`、`Submenu`](../elements/menu.md) | `menu()`、... | メニュー。デスクトップではカスケードするサブメニュー付きのポップアップ、スマートフォンではシートで表示します。チェック可能な項目と単一選択に対応します。 |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | トリガーの隣に表示されるヒント。 |
| [`Sheet`](../elements/sheet.md) | `sheet()` | 画面の端にあり、バックドロップの上に表示されるパネル。 |
| [`Toast`、`ToastStack`、`ToastManager`](../elements/toast.md) | `toast()`、`toast_stack()`、`ToastManager` | スタイルなしのトースト。セマンティックなルート、レイヤーのスタック、そのライフサイクルで構成されます。 |
| ページとダイアログ上の `statusBar` | `.status_bar(..)` | ページまたはダイアログが表示されている間のステータスバー。[ステータスバー](#status-bar)を参照してください。 |

Rust では、`theme()` がアプリのテーマをデザイントークン（`theme().primary`、`theme().radius`）として読み取ります。これは TSX の[テーマクラス](../docs/tailwind.md#theme-tokens)が使うトークンと同じです。

<a id="controls"></a>

## コントロール

### Button

自身で動作を持ち、見た目を持たない押下対象です。押下、無効状態と選択状態、スクリーンリーダー向けのロールを扱います。見た目はアプリの `class` と `style` に状態バリアントを付けたもので、内容は子要素です。[Button](../elements/button.md)を参照してください。

### Link

どこかへ移動する、見た目を持たない押下対象です。押下、フォーカス中の Return と Space、無効状態、スクリーンリーダー向けのリンクロール、ナビゲーションの現在のページ（`current`）を扱います。`href` は移動先を表し、画面には表示されません。押下すると通知（`onOpen`）が発生し、その後ウェブページや他のアプリのリンクをアプリの外で開きます。`openWith="app"` を指定した場合は、開く処理をアプリ独自のルートに任せます。[Link](../elements/link.md)を参照してください。

### Checkbox

自身で動作を持ち、見た目を持たない、チェック済み・未チェック・不確定のコントロールです。押下、キーボードによる操作、無効状態、スクリーンリーダー向けのチェックボックスロールと値（不確定のときは mixed）を扱い、値はアプリが持ちます（`checked`、`indeterminate`、`onChange`）。アプリはチェックボックスとそのインジケーターをスタイルします。インジケーターの `checked:`、`indeterminate:`、`disabled:` クラスはチェックボックスに追従し、インジケーターの中にはアプリ独自のマークを置きます（`indicator`）。[Checkbox](../elements/checkbox.md)を参照してください。

<a id="radio-and-radiogroup"></a>

### Radio と RadioGroup

ユーザーがちょうど1つを選ぶセットの選択肢1つと、それらを囲むセットです。Radio は自身で動作を持ち、見た目を持ちません。押下、キーボードによる操作、無効状態、スクリーンリーダー向けのラジオロールとチェック状態を扱います。グループはスクリーンリーダーが読み上げるラジオグループであり、値は保持しません。各ラジオがチェックされているかはアプリが伝え（`checked`）、未チェックのラジオが押されるとチェックを要求します（`onChange`）。アプリのインジケーターとラベルがラジオの子要素となり、その `group-checked:` クラスはラジオに追従します。[Radio](../elements/radio.md)を参照してください。

### Switch

自身で動作を持ち、見た目を持たない、オン/オフのコントロールです。押下、キーボードによる操作、無効状態、スクリーンリーダー向けのスイッチロールと値を扱い、値はアプリが持ちます（`checked`、`onChange`）。アプリはスイッチ、そのトラック、サムをスタイルします。トラックとサムの `checked:` と `disabled:` クラスはスイッチに追従します。[Switch](../elements/switch.md)を参照してください。

<a id="tab-and-tabs"></a>

### Tab と Tabs

タブリストのタブと、それらを囲むリストです。Tab は自身で動作を持ち、見た目を持ちません。押下、キーボードによる操作、無効状態、スクリーンリーダー向けのタブロールと選択状態を扱います。リストはスクリーンリーダーが読み上げるタブリストであり、値は保持しません。各タブが選択されているかはアプリが伝え（`selected`）、押下を受け取り（`onPress`）、選択されたセクションの内容もアプリが自分で表示します。アプリのラベルがタブの子要素となり、その `group-selected:` クラスはタブに追従します。リストのインジケーター（`indicatorClass`、`indicatorStyle`）は、アプリがスタイルする下線やピル型の表示で、選択中のタブの上に置かれ、次のタブへネイティブにスプリングで移動します。[Tabs](../elements/tabs.md)を参照してください。
### Carousel

スライドを一度に1つずつ表示します(商品の写真、オンボーディング、バナー、カードの列など)。コンテンツはスライドの先頭にスナップするネイティブのスクロールビューなので、指、ホイール、タッチパッドの操作はポインターと同じフレームでスライドを動かします。静止すると、カルーセルは `onChange` で表示中のスライドを報告します。前へ・次へ(`CarouselPrevious`、`CarouselNext`)、ページネーション(`CarouselPagination` 内の `CarouselPaginationItem` と、表示中のスライドへバネのように動くインジケーター)、矢印キーはネイティブに動かし、`looping` を使うと端をまたいで途切れなく循環します。表示中のスライドはアプリの `index` であり、自動で切り替わるスライドではアプリ自身のタイマーが進めます(`onDragStart` / `onDragEnd`、`onFocus` / `onBlur` が待つべきタイミングを伝えます)。見た目とすべてのラベルはアプリが決めます。[Carousel](../elements/carousel.md) を参照してください。

### Toggle and ToggleGroup

オンとオフを切り替えるボタン(太字、お気に入り、表示オプションなど)と、それらをまとめたツールバーです。Toggle は自身の動作を持ち、見た目は持ちません。押下、キーボードによる操作、無効状態、そしてスクリーンリーダー向けの押下状態を持つボタンロールを担います。グループはスクリーンリーダーがツールバーとして読み上げるもので、キーボードフォーカスの1つの停止位置となり、矢印キーで各トグルを押さずに移動できます。グループは値を持ちません。各トグルが押されているかどうかはアプリが伝え(`pressed`)、要求された値を受け取り(`onChange`)、押されている数を任意にするか、ちょうど1つにするかを管理します。グループの `disabled` は、その中のすべてのトグルを無効にします。アプリのアイコンやラベルはトグルの子要素となり、その `group-aria-pressed:` クラスが子要素に適用されます。[Toggle](../elements/toggle.md) を参照してください。

### Toolbar, ToolbarGroup and ToolbarSeparator

コントロールのバーです(テキストエディターの書式設定、メディアプレーヤーの操作、縦型のツールパレットなど)。ツールバーはスクリーンリーダーが読み上げる対象で(`accessibilityLabel` で名前を付けます)、内部の `Button`、`Toggle`、`Link` に対するキーボードフォーカスの1つの停止位置です。Tab は最後に離れた項目に入り、`axis` の矢印キーで項目間を移動し、Home と End で両端へ移動します。いずれも何も押しません。`ToolbarGroup` は関連する項目をまとめた名前付きの並びです(元に戻す・やり直す、配置など)。ツールバー内の `ToggleGroup` はそのグループの1つとなり、そのトグルがツールバーの項目になります。`ToolbarSeparator` は、アプリが並びの間に引く線です。ツールバーまたはグループの `disabled` は、その中のすべての項目を無効にします。ツールバーは値を持たず、見た目もありません。各コントロールが自身の状態を保持し、バー、グループ、区切り線のスタイルはアプリが決めます。[Toolbar](../elements/toolbar.md) を参照してください。

### Select

データとして与えられた項目のリストから1つの値を選択します(`items`:それぞれ値とタイトルを持ち、無効化やセクションへの所属も指定できます)。見た目は持ちません。リストはアプリのトリガーで開き、デスクトップではトリガー位置のポップアップ、スマートフォンとタブレットでは下部のシートとして表示されます。Select はキーボード操作(Up、Down、Home、End、Page Up と Down、タイプアヘッド、Return、Escape)、検索(`searchable`)、ハイライトされた行(`itemClass` の `focus:`。`renderItem` には項目が何であるかだけが渡され、その状態は渡されません)、そしてスクリーンリーダー向けの combobox、listbox、option ロールを担います。値はアプリが管理するか(`value`、`onChange`)、Select に任せ(`defaultValue`)、各パーツのスタイル設定や行の描画はアプリが行います。[Select](../elements/select.md) を参照してください。

### Combobox

Select のリストと同様に項目のリストから値を選択しますが、Combobox の入力欄に入力して絞り込みます。見た目は持ちません。選択は1つ、または `multiple` を使うと複数で、その場合は選択するたびに項目がトグルされ、リストは開いたままになります。値はアプリが管理する(`value`、`onChange`)か、Combobox に任せる(`defaultValue`)配列です。`onConfirm` はリストが閉じるときにそれを通知します。クエリはアプリが管理でき(`query`、`onQueryChange`)、フッターは行の下に表示され、クリアボタンは値を空にします。[Combobox](../elements/combobox.md) を参照してください。

### Calendar

日付、または `range` を使うと日付の範囲を、日の並ぶ月から選択します。見た目は持ちません。1か月または複数の月(`numberOfMonths`)を並べて表示し、ヘッダーで月を送り、月のビューや年のページを開きます。値は ISO 日付(`"2026-10-28"`)または `[start, end]` で、アプリが管理する(`value`、`onChange`)か、Calendar に任せます(`defaultValue`)。`disabledMatcher` は日が選択されないようにし、日は Tab の1つの停止位置としてキーボードを受け付けます。パーツのスタイル設定と項目の描画(`renderItem`。項目が何であるかが渡されます。その状態はクラスで表され、範囲の日には `selected:` に `data-range-start:`、`data-range-middle:`、`data-range-end:` が付きます)はアプリが行います。[Calendar](../elements/calendar.md) を参照してください。

### TimeField

時刻をセグメントごとに編集します。見た目は持ちません。時、分、秒(`precision`)、AM/PM(`hourCycle="h12"`)を、ステップ操作、入力、またはスマートフォンのテンキーで編集します。値は24時間制では `"HH:MM"`(`"HH:MM:SS"`)で、アプリが管理する(`value`、`onChange`)か、フィールド自身が持ちます(`defaultValue`)。[TimeField](../elements/time-field.md) を参照してください。

### DatePicker

Select のリストと同様に、アプリのトリガーから開くカレンダーで日付を選択します。デスクトップではポップアップ、スマートフォンではシートで表示されます。値は HTML の input の形式で、ISO 日付、`range` を伴う `[start, end]`、または `timePrecision` を伴う日付と時刻(カレンダーの下に TimeField が表示されます)であり、アプリが管理する(`value`、`onChange`)か、ピッカー自身が持ちます(`defaultValue`)。プリセットで値を設定でき、クリアボタンでクリアでき、`Calendar` のすべての prop が引き継がれます。[DatePicker](../elements/date-picker.md) を参照してください。

### Collapsible

コンテンツを展開・折りたたむ領域です。見た目は持ちません。子要素(サマリー、トリガー)は常に表示され、`content` は `open` の間だけその後に表示されます。`open` とそれを切り替えるトリガーはアプリが管理し、そこで展開状態をスクリーンリーダーに伝えます。コンテンツは一度作成され、折りたたまれている間も保持されるため、内部の状態は維持されます。`reveal` を使うと、ネイティブにバネのような高さの動きで開閉します。[Collapsible](../elements/collapsible.md) を参照してください。

### Accordion

見出しの下で展開・折りたたみできるセクションを積み重ねます。見た目は持ちません。`AccordionItem` の `Accordion` で、各 `AccordionHeader` が `AccordionTrigger` と `AccordionPanel` を囲みます。アプリは開いている項目の値である `value` を管理し、トリガーが押されたときに `onChange` が報告する値を設定します。同時に開くのは1項目のみ、または `multiple` を使うと複数です。スクリーンリーダーには見出しのグループとして読み上げられ、そのボタンが項目の展開状態を伝え、開いている各パネルはリージョンとして読み上げられます。`reveal` を使うと、パネルはネイティブにバネのような高さの動きで開閉し、`keepMounted` を使うと、閉じている間もそのコンテンツはツリーに残ります。[Accordion](../elements/accordion.md) を参照してください。

### Avatar

人物の画像です。見た目は持ちません。フォールバック(`name` のイニシャル、またはアプリの `fallback`)と、その上に重なる画像(読み込みが完了するまでは透明)がどちらもアバターと同じ大きさで配置され、その後にアプリの子要素(プレゼンスドットなど)が続きます。画像自身の load イベントと error イベントがステータスをネイティブに変更し(`onStatusChange`)、`fallbackDelay` は画像の読み込み中にフォールバックを表示しないようにします。スクリーンリーダーには、名前がラベルとして付いた画像として読み上げられます。`AvatarGroup` は最初の `limit` 個のアバターを表示し、残りのビューは作成せず、`total` がさらにある間は `overflow` を表示します。[Avatar](../elements/avatar.md) を参照してください。

### Progress

リニアなプログレスバーです。見た目は持ちません。トラックとその内側のインジケーターで構成され、インジケーターはトラック幅の `value` パーセントになります。アプリは `value`(0 から 100)と `indeterminate` を管理します。スクリーンリーダーには、プログレスバーのロール、範囲、値が伝えられます。不確定の間は値は伝えられず、インジケーターの幅と動きはアプリが決めます。[Progress](../elements/progress.md) を参照してください。

### NumberInput

フィールドに入力するか、ステップ操作で数値を指定します。見た目は持ちません。フィールド(`Input`)、その前の減少ボタン、後ろの増加ボタン(または右側に縦に並べた両方、`controlsRight`)で構成されます。アプリは `value`(数値または `null`。または `defaultValue` から入力欄自身が値を保持)を管理し、フィールドが読み取った数値とともに `onChange` を受け取ります。フィールドは数値、または数値になる途中のテキストを受け付け、他のキーボードの数字や符号も含まれます。ボタン、Up / Down、Page Up / Page Down は `step` ずつ小数部を保ったまま `min` と `max` の範囲で値を増減し、フィールドを離れると、入力された値はそれらの範囲に収められます。フィールドはスクリーンリーダーに対してスピンボタンとして扱われ、その増加と減少で値をステップ操作できます。[NumberInput](../elements/number-input.md) を参照してください。

### Slider

トラック上で1つの値、または2つの値の範囲を選択します。見た目は持ちません。押下とドラッグを受け付けるトラック、値が対応づけられるその内側のインジケーター、範囲、そして値ごとに1つのサムで構成されます。アプリは `value`(数値または `[start, end]`。または `defaultValue` からスライダー自身が値を保持)を管理し、新しい値ごとに `onChange` を受け取ります。値は `min` を起点に `step` にスナップされ、`onChangeEnd` は変更ごとに1回通知されます。`scale` は値を線形に、または桁ごとに配置し、`axis` はトラックを水平または垂直にレイアウトします。各サムはスクリーンリーダー向けの調整可能な要素で、独自の値を持ち、キーボードフォーカスの停止位置となり、WAI-ARIA のスライダーキーで動きます。[Slider](../elements/slider.md) を参照してください。

### Scrollbar

スクロールビューやリスト向けの、アプリ独自の見た目のスクロールバーです。アプリが望む場所に配置でき、見た目は持ちません。トラック(バーの `class`)とその中のサム(`thumbClass`)で構成されます。対象のスクロールビュー(`scroll`、その `ref`)を名前で指定し、そのオフセット、コンテンツ、ビューポートに追従します。サムをドラッグするとコンテンツがスクロールし、トラックを押すとサムの中央がその位置に移動します。`mode` は、コンテンツのスクロール中(その後 `motion.idle` まで)、ポインターがバー上にある間、または常にバーを表示します。`axis` はバーを水平にします。`Scrollbar.setTheme` は、配置するものがなくても、すべてのスクロールビューとリストのビューポート上にアプリの見た目のバーを与え、ビューは `scrollbar` prop で独自のテーマを受け取れます。[Scrollbar](../elements/scrollbar.md) を参照してください。

### ColorPicker

見た目を持たないカラーピッカーです。ルートが色を保持し、その内側のパーツが色を表示・変更します。レイアウトはアプリが決めます。`ColorArea` は HSB の彩度と明度、`ColorSlider` は RGB、HSL、HSB、OKLCH の任意のチャンネルまたはアルファ(水平または垂直)、`ColorField` は任意の CSS 形式の色またはチャンネルの数値、`ColorSwatch` は押して選択するプリセットまたは色のプレビュー、`ColorEyeDropper` は画面上の色を選択するボタン(macOS、Web)です。アプリは `value`(または `defaultValue` からピッカー自身が値を保持)を管理し、色とその `format` が書き出すテキストとともに `onChange` と `onChangeEnd` を受け取ります。ピッカーは各色空間のチャンネルをユーザーが設定したとおりに保持します。サムはスクリーンリーダー向けの調整可能な要素であり、キーボードフォーカスの停止位置です。[ColorPicker](../elements/color-picker.md) を参照してください。

### OtpInput

固定長の数字のワンタイムコードです。見た目は持ちません。セルの上に重なる1つのネイティブのテキストフィールドがキーボードを受け付けるため、入力、ペースト、テンキー、システムのコード自動入力はプラットフォームの機能で行われ、スクリーンリーダーからは1つのテキストフィールドとして認識されます。入力できるのは数字のみで、`length` までです。Backspace は最後の1桁を削除します。アプリは `value`(または `defaultValue` を指定)を管理し、`onChange` と `onComplete` を受け取ります。セルのスタイル設定として、次の数字を受け取るセルには `focus:`、数字が入っているセルには `data-filled:` を適用でき、グループとキャレットのスタイルもアプリが決めます。[OtpInput](../elements/otp-input.md) を参照してください。

### Pagination

セットのページ間を移動するためのナビゲーションランドマークです。見た目は持ちません。Previous、最初と最後のページ、現在のページとその隣接ページ(`visiblePages`)、省略された区間ごとの省略記号、アプリの子要素、Next で構成され、`compact` を使うと Previous、子要素、Next のみが残ります。アプリは `page` を管理し、`onChange({ page })` を受け取ります。現在のページは `selected:` であり、スクリーンリーダーにとっての現在のページです。項目のスタイル設定(`itemClass`)または描画(`renderItem`)はアプリが行います。[Pagination](../elements/pagination.md) を参照してください。

### Command

コマンドパレットです。アプリのコマンド(`items`:`id`、`label`、`keywords`、`group`、表示する `shortcut`、`disabled`、`checked`)の上に検索フィールドがあり、ユーザーの入力に合わせてネイティブに絞り込まれます(ラベルまたはキーワードがクエリを含むかを大文字小文字を区別せずに判定し、一致のないセクションは除かれます)。リストは仮想化されており、表示範囲内の行だけが作成されます。Up と Down でハイライトを移動し、Return または押下で選択します(`onSelect({ id })`)。Escape はクエリをクリアし、その次に `onCancel` を報告します。アプリはそこで周囲の `Dialog` を閉じます。クエリはアプリが管理する(`query`、`onQueryChange`)か、フィールド自身が持ちます。`filterable={false}` と `loading` を使うと、アプリがサーバーからそれに応答します。すべてのパーツのスタイル設定(ハイライトには `focus:` を伴う `itemClass`、`checked:`、`disabled:`)と行の描画(`renderItem`。ここに表示されるとおりのショートカットが渡されます)はアプリが行います。[Command](../elements/command.md) を参照してください。

### Tree

項目が項目を保持する構造です(プロジェクトのファイル、設定のサイドバー、アウトラインなど)。`items` はデータであり(`TreeItem`:`id`、`label`、`children`、`disabled`)、行は仮想化されています。表示範囲内の行だけが作成され、折りたたまれた項目の子は作成されないため、数千項目のツリーでも高速に動作します。アプリは展開されている ID と選択中の項目を管理する(`expanded`、`selected`、および `onExpandedChange` と `onSelectedChange`)か、ツリー自身が保持します(`defaultExpanded`、`defaultSelected`)。押下で行が選択され、フォルダーは展開または折りたたまれます。ツリーはキーボードフォーカスの1つの停止位置であり、矢印キーで選択を移動し(Right と Left で展開と折りたたみ、フォルダーへの出入り)、Home、End、Return、Space、タイプアヘッドにも対応します。行のスタイル設定(`selected:`、`aria-expanded:`、`focus:` を伴う `itemClass`)と描画(`renderItem`。各項目の `depth` が渡されます)はアプリが行います。[Tree](../elements/tree.md) を参照してください。
### Plot (`nsh/base/plot`)

チャートを構成する部品は、`gpui-base`の`plot`として、独立したモジュールにまとめられています: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
は行のチェック済みキーまたは関数です)。軸の`point`、`linear`、`band`スケール、ポインターの下にある行
(`onHoverChange`)、およびそのモーション (`motion`: 表示時のアニメーション、ホバー時のフェードとグライド) を扱います。マークは
行からネイティブに描画され、点ごとの JS は不要です。SVG のペイントプロパティ (`stroke-*`、`fill-*`) で塗られ、指定がない場合は`currentColor`が使われます。`Area`や`Bar`は、図形の内側に背景 (グラデーション、`bg-linear-*`) を表示できます。Bar は
`band`スケールのバンド内に、横に並べて、または`stack`に積み重ねて配置され、プロットの表示時に伸びて現れ、ポインターの下の行以外はフェードアウトします。各バーの端には`label`パーツを置けます。ホバー時の十字線、ドット (各マーク固有のもので
`hoverDotClass`を使用)、ツールチップ (`tooltipPlacement`、プロット内に収まります) は、アプリがスタイルと内容を指定するパーツで、ネイティブに
移動します。軸ラベルはアプリ自身の要素です。`Pie`は円を行ごとのスライスに分割し (`innerRadius`付きのドーナツも可能)、各スライスは固有のクラス (`sliceClass`、行の関数) で塗られます。`Arc`は2つの角度の間に1つの扇形を描きます (ゲージのトラックと値など)。円グラフ上では、プロットがポインターの下のスライスを通知し、そのスライスが持ち上がり
(`hoverLift`)、他のスライスはフェードします
(`hoverDim`)。`Sankey`は行 (`links`) の間のフローを描き、レイアウトは
d3-sankey と同じ方法で行われます。各ノードとリボンは固有のクラスで塗られ、ノードにはラベルが付き、ホバーでき、新しいフローへ移動します。`Treemap`は行を入れ子の長方形による階層としてタイル状に配置します
(`id`、`parent`)。各リーフの面積はその`value`で決まり、カテゴリー別、またはプロットの
`colorScale`のランプに沿って色付けされ、ラベルは収まる場所に表示されます。[Plot](../elements/plot.md) を参照してください。

## Workspaces

### ResizablePanelGroup and ResizablePanel

パネルを横または縦に並べ、隣り合う2つのパネルの間にハンドルを置き、ユーザーがドラッグしてスペースを分け合えます。グループが
ネイティブに実行されるドラッグ、各パネルの制限 (`minSize`、`maxSize`)、およびリサイズカーソルを管理します。サイズ
(`size`、`onResize`で通知) はアプリが持ち、ハンドルの見た目とパネルの内容もアプリが決めます。
[Resizable](../elements/resizable.md) を参照してください。

### DockArea

ドッキング可能なワークスペースです。パネルはタブグループに入り、グループは横または縦に分割でき、左・右・下の端にドックを置けます。レイアウトはアプリが所有するデータです (`layout`、`onLayoutChange`で通知)。エリアはタブのドラッグ&ドロップ、リサイズ、ドック、ズーム、ロックを管理し、移動してもパネルの内容を保持し、幅が狭いときは同じレイアウトをドロワーとボトムシートで表示します。タブ、ハンドル、ドロップインジケーター、パネルの内容はアプリが用意します。[Dock](../elements/dock.md) を参照してください。

## Documents

### TextView

`TextView`は、Markdown、HTML、またはアプリが構築したブロックによるドキュメントを、[`Text`](../elements/text.md)
の要素とビューで表示します。見出し、リスト、コード、テーブル、画像、数式、脚注、アプリ独自の構文に対応します。ストリーミングで届く
AI チャットの返信向けに作られており、テーマの色による読みやすいタイポグラフィをパーツごとにアプリが再スタイルでき、レンダー関数でアプリ独自の内容を差し込めます。[TextView](../elements/text-view.md) を参照してください。

## Code

### Editor

`Editor`は50以上の言語に対応したコードエディターです。シンタックスハイライト、行番号、複数キャレット、折りたたみ、
ソフトラップ、検索と置換、診断、デコレーションを備え、コードエディターのキー操作に対応します。テキスト
(`value`と`onChange`) はアプリが持ち、エディターの`search`を操作する検索バーもアプリが用意します。テーマのトークンから作られた見た目が付属し、アプリがパーツごとに再スタイルできます。[Editor](../elements/editor.md) を参照してください。

### DiffView

`DiffView`は、コードレビューツールのように、2つのテキストの間、またはパッチに含まれるファイルの変更を表示します。左右並べて、または
統合形式で表示でき、行内で変更された単語がハイライトされ、変更のない行は展開可能な区切りにまとめられ、
`Editor`のシンタックスカラーが使われます。各変更の保持や取り消しはアプリのアクションで行います。[DiffView](../elements/diff-view.md) を参照してください。

### Table

`Table`とそのパーツは、アプリが子要素として書く少数の行をレイアウトし、スクリーンリーダーにテーブルとして伝えます。行のグループ、
行、列ヘッダー、セルがあります。すべてのパーツにアプリの見た目を適用できます。[Table](../elements/table.md) を参照してください。

### DataTable

`DataTable`は行と列を表示し、どちらも任意の数で縦横にスクロールでき、表示範囲内のセルだけを描画します。行、
列、セルを選択でき、列はリサイズ、移動、固定、ソートができます (ソートはアプリが行います)。アプリは行を1ページずつ提供し、
セルやタイトルを描画することもできます。[DataTable](../elements/data-table.md) を参照してください。

## Navigation

`NavPage`の`NavStack`は、iOS では`UINavigationController`、Android ではツールバーと予測型「戻る」を備えたスタックになります。デスクトップと Web では、各ページがアプリ独自の`header`を表示します。
[NavStack](../elements/nav-stack.md) を参照してください。`createNavStack`とページからの離脱についても説明しています。

### Dialog

`Dialog`は、スタックのヘッダーを含むすべての上に、専用のネイティブウィンドウレイヤーでコンテンツを表示します。そのポップアップと
バックドロップはアプリがスタイルを指定します。[Dialog](../elements/dialog.md) を参照してください。

## Alert dialogs

### AlertDialog

`AlertDialog.show(options)`は、プラットフォーム標準のアラートまたはアクションシートを表示し、ユーザーが選んだアクションの`id`である`{ action }`で解決されます。[AlertDialog](../elements/alert-dialog.md) を参照してください。

## Input

`Input`は、プラットフォームのネイティブなテキスト入力です。1行または複数行のフィールドで、入力、キャレット、選択、
自動修正、自動入力はプラットフォームが処理します。値と見た目はアプリが管理します。その props は型`InputProps` (`ios={{…}}`用の`IOSInputProps`付き) で、あわせてエクスポートされます。[Input](../elements/input.md) を参照してください。

## Status bar

ステータスバーは、UIKit と同様に、画面に表示されているものに属します。UIKit では各ビューコントローラーが自身の
`preferredStatusBarStyle`を宣言し、最前面のものが決定します。NSH ではページとダイアログがそのビューコントローラーにあたります。
`NavPage`または`Dialog`が、必要なステータスバーを`statusBar`で宣言し、アプリはデフォルトを
`nsh.json`で宣言します。

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

`statusBar`は次のフィールドを取り、すべて省略可能です (Rust では、`StatusBarStyle`単体、または同名の`StatusBarSetting`のビルダー
メソッドを使います)。

| フィールド | 型 | 説明 |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`、`Light`、`Dark`) | コンテンツ (時刻、バッテリー、電波) の色です。`"light"`は暗い背景用、`"dark"`は明るい背景用、`"auto"`は現在の外観に合わせたプラットフォームの色です。 |
| `hidden` | `boolean` | ステータスバーを非表示にします。 |
| `animated` | `boolean` | ページまたはダイアログの表示・非表示に合わせて変更をアニメーションにします。 |

値はリアクティブです。`statusBar={{ foreground: dark() ? "light" : "dark" }}`はシグナルに追従し、シグナルを読み取る Rust の
クロージャも同様です。

### Which one applies

**最後に**表示されたページまたはダイアログが、**フィールドごとに**決定します。スタックにプッシュされたページはその下のページより上にあり、
開いているダイアログはページより上にあります。省略されたフィールドは、その下にあるものから、最終的には
アプリのデフォルトから取得されます。ページがポップされるかダイアログが閉じると、その下のものが再び適用されます。

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

### The app's default

`nsh.json`の`"statusBar"`は、UIKit アプリで Info.plist の`UIStatusBarStyle`と
`UIStatusBarHidden`が果たす役割と同様に、すべてのページとダイアログの下にある設定です。

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

どちらのフィールドも省略可能です。指定がない場合、コンテンツは`"auto"`で、バーは表示されます。パッケージ化された iOS アプリでは、
起動画面にも適用されます。

### The status bar on each platform

- **iOS**: 非表示と表示はフェードでアニメーションします。ネイティブアプリに[埋め込まれた](../docs/ios.md)アプリでは、
  ステータスバーの見た目はホストアプリのビューコントローラーが決定します。ホストは、自身のビューコントローラーから
  `NshAppView.preferredStatusBarStyle`、`NshAppView.prefersStatusBarHidden`、
  `NshAppView.preferredStatusBarUpdateAnimation`を返すことで、NSH の設定を適用します。
- **Android**: アプリはステータスバーの背後まで端から端まで描画します (Android 15、API 35)。アプリ自身の背景が
  バーの背景になり、`foreground`によってその上でもコンテンツが読みやすく保たれます。
- **デスクトップと Web**: ウィンドウのタイトルバーとブラウザーのバーは、システムとブラウザーのものです。
  `statusBar`と`nsh.json`の`"statusBar"`はスマートフォン向けです。

> [!IMPORTANT]
> `nsh.json`が`"capabilities"`を宣言している場合、ステータスバーが変更されるのは、それらに
> `"statusBar": true`が含まれているときだけです。それ以外の変更は拒否され、ログに記録されます。
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md) を参照してください。

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

## Related

- [Navigation guide](../docs/navigation.md)。
- [Forms and keyboard](../docs/forms-and-keyboard.md)。
- [Avatar](../elements/avatar.md)、[Button](../elements/button.md)、[Carousel](../elements/carousel.md)、[Link](../elements/link.md)、[Checkbox](../elements/checkbox.md)、[Radio](../elements/radio.md)、[Switch](../elements/switch.md)、[Tabs](../elements/tabs.md)、[Toggle](../elements/toggle.md)、[Toolbar](../elements/toolbar.md)、[Select](../elements/select.md)、[Combobox](../elements/combobox.md)、[Command](../elements/command.md)、[Calendar](../elements/calendar.md)、[TimeField](../elements/time-field.md)、[DatePicker](../elements/date-picker.md)、[Collapsible](../elements/collapsible.md)、[HoverCard](../elements/hover-card.md)、[Accordion](../elements/accordion.md)、[Progress](../elements/progress.md)、[Slider](../elements/slider.md)、[ColorPicker](../elements/color-picker.md)、[Scrollbar](../elements/scrollbar.md)、[NumberInput](../elements/number-input.md)、[OtpInput](../elements/otp-input.md)、[Pagination](../elements/pagination.md)、[Tree](../elements/tree.md)、[Plot](../elements/plot.md)、[NavStack](../elements/nav-stack.md)、[Dialog](../elements/dialog.md)、[AlertDialog](../elements/alert-dialog.md)、[TextView](../elements/text-view.md)、[Editor](../elements/editor.md)、[DiffView](../elements/diff-view.md)、[Table](../elements/table.md)、[DataTable](../elements/data-table.md)、[Text](../elements/text.md)、[Input](../elements/input.md)。
  [AlertDialog](../elements/alert-dialog.md)、[TextView](../elements/text-view.md)、[Editor](../elements/editor.md)、[DiffView](../elements/diff-view.md)、[Table](../elements/table.md)、[DataTable](../elements/data-table.md)、
  [Text](../elements/text.md)、
  [Input](../elements/input.md)。
- [Device and environment](../docs/device-and-environment.md)。
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler`およびその他の Android 専用 API。
