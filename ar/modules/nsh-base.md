---
title: "nsh/base"
description: "مكونات أساسية غير منسّقة لواجهة مستخدم التطبيق: أزرار، وروابط، وصور رمزية، وعروض دوّارة، ومربعات اختيار، وأزرار اختيار، ومفاتيح تبديل، وعلامات تبويب، وأزرار تبديل، وأشرطة أدوات، وأشجار، وقوائم اختيار، ومربعات تحرير وسرد، ولوحات أوامر، وتقويمات، ومنتقيات تواريخ، وحقول وقت، ولوحات قابلة لتغيير الحجم، ومساحات عمل قابلة للإرساء، ومستندات Markdown وHTML، ومحرر شيفرة، وعروض الفروقات، وحقول إدخال نصية، ومكدسات تنقل وحوارات، وحوارات تنبيه النظام، وشريط الحالة للصفحات والحوارات."
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` هي طبقة المكوّنات الأساسية في واجهة المستخدم للتطبيق: مكوّنات بلا تنسيق تتولى السلوك والحالة والتركيز وإمكانية الوصول على كل منصة. تقع بين العناصر الأولية (`nsh` و`nsh/mobile` و`nsh/desktop`) ومكتبة مكوّنات التطبيق نفسه، كما يقع `gpui-base` بين `gpui` ومكتبة منسّقة في GPUI Kit (راجع [الوحدات](./index.md#three-layers)). وهي توفّر عناصر تحكم (`Button` و`Link` و`Checkbox` و`ColorPicker` مع `ColorArea` و`ColorSlider` و`ColorField` و`ColorSwatch` و`ColorEyeDropper` و`NumberInput` و`Radio` داخل `RadioGroup` و`Slider` و`Switch` و`Tab` في `Tabs` و`Toggle` في `ToggleGroup` و`Select` و`Combobox` و`Calendar` و`TimeField` و`DatePicker`)، ولوحات أوامر (`Command`)، وأشرطة عناصر تحكم (`Toolbar` مع `ToolbarGroup` و`ToolbarSeparator`)، وأشرطة تمرير بمظهر التطبيق نفسه (`Scrollbar`)، ومناطق تتوسع وتنطوي (`Collapsible`، و`Accordion` مع `AccordionItem` و`AccordionHeader` و`AccordionTrigger` و`AccordionPanel`)، وشريط تقدّم (`Progress`)، ورموز الاستخدام لمرة واحدة (`OtpInput`)، وصفحات المجموعة (`Pagination`)، وعناصر تحوي عناصر (`Tree`)، والأجزاء التي تُبنى منها المخططات (`Plot` مع `Line` و`Area` و`Bar` و`Rule` و`Dot` و`Cell` و`Grid` و`Pie` و`Arc`، في `nsh/base/plot`)، ومساحات عمل يرتّبها المستخدم (عناصر `ResizablePanel` في `ResizablePanelGroup`، وتقسيمات `DockArea` ومجموعات علامات التبويب والمراسي)، وعروض شرائح دوّارة (`Carousel` وأجزاؤه)، ومستندات Markdown أو HTML (`TextView`)، ومحرر شيفرة (`Editor`)، والفروق بين النصوص (`DiffView`)، وجداول من الصفوف والأعمدة (`Table` وأجزاؤه، `DataTable`)، وحقول إدخال نصية (`Input`)، ونوافذ منبثقة تظهر فوق كل شيء (`Popover` و`Menu` و`ContextMenu` مع `MenuItem` و`MenuSeparator` و`Submenu`، `Tooltip`، `Sheet`)، وإشعارات مؤقتة (`Toast` في `ToastStack`، ودورة حياتها في `ToastManager`)، والتنقل (`NavStack` من `NavPage` تقوده الحالة التي تنشئها بـ`createNavStack`، و`Dialog` للمحتوى المعروض فوق كل شيء آخر)، ومربعات حوار التنبيه الخاصة بالنظام (`AlertDialog`). كما تحدد الصفحات ومربعات الحوار شريط الحالة (`statusBar`).

تتضمن المجموعة الأساسية أيضًا `Avatar` و`AvatarGroup`: صور بحالة تحميل أصلية للصور، وصف يعرض أول `limit` من الصور الرمزية.

المظهر من شأن التطبيق: ما يوضع داخل صفحة أو مربع حوار أو ترويسة هو JSX خاص بك، مبني من العناصر الأولية بالأنماط وفئات [Tailwind](../docs/tailwind.md) وسمتك، أو مكوّنات Rust من [حزمتك الخاصة](../docs/rust.md)، أو مكتبة مكوّنات يبنيها المجتمع على `nsh/base`. كل مضيف يخدم `nsh/base`؛ وتستخدم تطبيقات Rust واجهة API نفسها من حزمة `nsh-base` (`nsh_base::{button, dialog, …}`).

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

هذه الصفحة هي فهرس الوحدة: لكل مكوّن صفحة عنصر فيها أمثلته وخصائصه وملاحظات المنصات. وللاطلاع على الشروحات، راجع [دليل التنقل](../docs/navigation.md) و[النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md).

| TSX | Rust | ما هو |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | هدف ضغط له حالتا التعطيل والتحديد ودور لقارئات الشاشة. |
| [`Link`](../elements/link.md) | `link()` | هدف ضغط ينقل إلى مكان ما: يفتح `href` عبر النظام، أو يفتحه التطبيق (`openWith="app"`، `onOpen`). |
| [`Avatar`](../elements/avatar.md)، [`AvatarGroup`](../elements/avatar.md) | `avatar()`، `avatar_group()` | صورة شخص، أو بديل عنها (الأحرف الأولى، أيقونة التطبيق) أثناء التحميل وعند الفشل وعند غياب الصورة؛ وصف يعرض أول `limit` وما يفيض عنها. حالة التحميل أصلية. |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | عنصر تحكم محدد أو غير محدد أو غير محسوم، بمؤشر ينسّقه التطبيق ويضع علامته. |
| [`Radio`](../elements/radio.md)، [`RadioGroup`](../elements/radio.md) | `radio()`، `radio_group()` | خيار واحد من مجموعة يختار المستخدم منها واحدًا، والمجموعة نفسها؛ ويملك التطبيق معرفة الخيار المحدد. |
| [`Switch`](../elements/switch.md) | `switch()` | عنصر تحكم للتشغيل / الإيقاف بمسار ومقبض ينسّقهما التطبيق. |
| [`Tab`](../elements/tabs.md)، [`Tabs`](../elements/tabs.md) | `tab()`، `tabs()` | علامة تبويب واحدة من قائمة علامات التبويب، والقائمة نفسها؛ ويملك التطبيق معرفة العلامة المحددة ويعرض محتواها. |
| [`Toggle`](../elements/toggle.md)، [`ToggleGroup`](../elements/toggle.md) | `toggle()`، `toggle_group()` | زر يكون قيد التشغيل أو الإيقاف، وشريط أدوات منها؛ ويملك التطبيق معرفة الأزرار المضغوطة. |
| [`Toolbar`](../elements/toolbar.md)، [`ToolbarGroup`](../elements/toolbar.md)، [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`، `toolbar_group()`، `toolbar_separator()` | شريط من الأزرار والمفاتيح والروابط: محطة واحدة لتركيز لوحة المفاتيح تحرّك مفاتيح الأسهم التركيز على امتدادها؛ ومجموعات من العناصر ذات الصلة وخطوط بينها. |
| [`Carousel`](../elements/carousel.md) وأجزاؤه | `carousel()`، `carousel_content()`، `carousel_item()`، `carousel_previous()`، `carousel_next()`، `carousel_pagination()`، `carousel_pagination_item()` | شرائح تُعرض في مكان واحد كل مرة عبر التمرير الأصلي للمنصة، مع السابق / التالي وترقيم الصفحات والمفاتيح وحلقة متواصلة؛ ويملك التطبيق `index`. |
| [`Select`](../elements/select.md) | `select()` | قيمة واحدة من قائمة عناصر: نافذة منبثقة عند المشغّل على أجهزة سطح المكتب، وورقة على الهواتف؛ ويملك التطبيق `value` ويرسم المشغّل. |
| [`Combobox`](../elements/combobox.md) | `combobox()` | قيمة واحدة أو عدة قيم (`multiple`) من قائمة عناصر تُصفّى بالكتابة في حقل الإدخال الخاص بها؛ ويملك التطبيق `value` وينسّق الحقل. |
| [`Calendar`](../elements/calendar.md) | `calendar()` | تاريخ أو نطاق تواريخ يُختار من أشهر من الأيام، مع عرضي الشهر والسنة ولوحة المفاتيح؛ ويملك التطبيق `value` ويرسم العناصر. |
| [`TimeField`](../elements/time-field.md) | `time_field()` | وقت من اليوم يُحرَّر جزءًا جزءًا (الساعة والدقيقة والثانية وصباحًا/مساءً)؛ ويملك التطبيق `value`. |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | تاريخ أو نطاق أو تاريخ ووقت من تقويم في نافذة منبثقة عند المشغّل على أجهزة سطح المكتب، وورقة على الهواتف؛ ويملك التطبيق `value` ويرسم المشغّل. |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | منطقة يتوسع محتواها وينطوي؛ ويملك التطبيق `open` ومشغّلها. |
| [`Accordion`](../elements/accordion.md)، [`AccordionItem`](../elements/accordion.md)، [`AccordionHeader`](../elements/accordion.md)، [`AccordionTrigger`](../elements/accordion.md)، [`AccordionPanel`](../elements/accordion.md) | `accordion()`، `accordion_item()`، `accordion_header()`، `accordion_trigger()`، `accordion_panel()` | أقسام مكدّسة تتوسع وتنطوي تحت عناوينها، واحدًا في كل مرة أو عدة أقسام (`multiple`)؛ ويملك التطبيق `value`، أي العناصر المفتوحة. |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | رمز للاستخدام مرة واحدة في خلايا ينسّقها التطبيق؛ ويملك التطبيق `value`، ويخبر `onComplete` بامتلائه. |
| [`Pagination`](../elements/pagination.md) | `pagination()` | صفحات المجموعة: السابق، والصفحات المحيطة بالحالية مع علامات الحذف، وعناصر التطبيق الفرعية، والتالي؛ ويملك التطبيق `page`. |
| [`Command`](../elements/command.md) | `command()` | لوحة أوامر: حقل بحث فوق أوامر التطبيق، يُصفّى أصليًا بحسب التسمية والكلمات المفتاحية، في قائمة افتراضية؛ ويختار Return أو الضغط (`onSelect`)، في `Dialog` للوحة Cmd+K. |
| [`Tree`](../elements/tree.md) | `tree()` | عناصر تحوي عناصر، افتراضية: موسّعة ومنطوية، وعنصر واحد محدد، ومحطة واحدة لتركيز لوحة المفاتيح؛ ويملك التطبيق `expanded` و`selected` أو تحتفظ الشجرة بحالتها الخاصة. |
| [`Progress`](../elements/progress.md) | `progress()` | شريط تقدّم؛ ويملك التطبيق `value` (من 0 إلى 100) و`indeterminate`. |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | رقم يُكتب في حقل أو يُزاد وينقص بالأزرار والمفاتيح؛ ويملك التطبيق `value` (أو يحتفظ الحقل بقيمته الخاصة من `defaultValue`). |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | شريط تمرير بمظهر التطبيق نفسه لعرض التمرير أو القائمة التي يسمّيها (`scroll`)؛ يتبع مقبضه المحتوى، وتمرّره عمليات السحب والضغط عليه. |
| [`Slider`](../elements/slider.md) | `slider()` | قيمة، أو نطاق من قيمتين، تُختار على امتداد مسار؛ ويملك التطبيق `value` (أو يحتفظ المنزلق بقيمته الخاصة من `defaultValue`). |
| [`ColorPicker`، `ColorArea`، `ColorSlider`، `ColorField`، `ColorSwatch`، `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`، `color_area()`، `color_slider()`، `color_field()`، `color_swatch()`، `color_eye_dropper()` | منتقي ألوان وأجزاؤه: منطقة للتشبّع والسطوع، ومنزلقات لأي قناة من RGB أو HSL أو HSB أو OKLCH ولقناة الشفافية، وحقول للون أو لقناة، وعيّنات، وأداة التقاط الألوان؛ ويملك التطبيق `value` (أو يحتفظ المنتقي بقيمته الخاصة من `defaultValue`). |
| [`ResizablePanelGroup`، `ResizablePanel`](../elements/resizable.md) | `h_resizable()`، `v_resizable()`، `resizable_panel()` | لوحات جنبًا إلى جنب أو متراصّة، بمقابض يسحبها المستخدم لتغيير حجمها. |
| [`DockArea`](../elements/dock.md) | `dock_area()` | مساحة عمل من تقسيمات ومجموعات علامات تبويب ومراسٍ على الحواف يرتّبها المستخدم؛ وتخطيطها بيانات التطبيق. |
| [`NavStack`، `NavPage`، `createNavStack`](../elements/nav-stack.md) | `nav_stack()`، `nav_page()` | مكدّس تنقل أصلي وصفحاته. |
| [`Dialog`](../elements/dialog.md) | `dialog()` | محتوى يُعرض فوق كل شيء آخر: أوراق، وتدفقات بملء الشاشة، ومربعات حوار. |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | تنبيه المنصة أو ورقة الإجراءات. |
| [`TextView`](../elements/text-view.md) | `text_view()` | مستند من Markdown أو HTML أو كتل، يُرسم بالنصوص والعروض، لردود الذكاء الاصطناعي المتدفقة. |
| [`Editor`](../elements/editor.md) | `editor()` | محرر شيفرة: تمييز البنية، ومؤشرات إدراج متعددة، والطيّ، والبحث والاستبدال، والتشخيصات. |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | الفروق بين نصين أو في رقعة، جنبًا إلى جنب أو موحّدة، مع إجراءات لكل تغيير. |
| [`Table`، `TableHeader`، `TableBody`، `TableFooter`، `TableRow`، `TableHead`، `TableCell`، `TableCaption`](../elements/table.md) | `table()`، `table_row()`، ... | جدول من صفوف التطبيق وخلاياه الخاصة، مع أدوار الجدول لقارئات الشاشة. |
| [`DataTable`](../elements/data-table.md) | `data_table()` | جدول بأي عدد من الصفوف والأعمدة: تحديد، وفرز، وأعمدة ثابتة وقابلة لتغيير الحجم والنقل، وصفوف تُقدَّم صفحة صفحة. |
| [`Input`](../elements/input.md) | `nsh_base::input()` | حقل الإدخال النصي الأصلي للمنصة، بسطر واحد أو عدة أسطر. |
| [`Popover`](../elements/popover.md) | `popover()` | محتوى مثبّت على مشغّله، فوق كل شيء. |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | معاينة لما يشير إليه مشغّله، ما دام المؤشر مستقرًا عليه (الضغط على شاشات اللمس). |
| [`Menu`، `ContextMenu`، `MenuItem`، `MenuSeparator`، `Submenu`](../elements/menu.md) | `menu()`، ... | قوائم: نوافذ منبثقة بقوائم فرعية متتالية على أجهزة سطح المكتب، وأوراق على الهواتف؛ وعناصر قابلة للتحديد واختيارات من بينها خيار واحد. |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | تلميح بجوار مشغّله. |
| [`Sheet`](../elements/sheet.md) | `sheet()` | لوحة عند حافة الشاشة فوق خلفية. |
| [`Toast`، `ToastStack`، `ToastManager`](../elements/toast.md) | `toast()`، `toast_stack()`، `ToastManager` | إشعارات مؤقتة بلا تنسيق: جذر دلالي، ومكدّس من الطبقات، ودورة حياتها. |
| `statusBar` على الصفحات ومربعات الحوار | `.status_bar(..)` | شريط الحالة ما دامت صفحة أو مربع حوار معروضًا. راجع [شريط الحالة](#status-bar). |

في Rust، يقرأ `theme()` سمة التطبيق على شكل رموز تصميم (`theme().primary`، `theme().radius`)، وهي الرموز نفسها التي تستخدمها [فئات السمة](../docs/tailwind.md#theme-tokens) في TSX.

<a id="controls"></a>

## عناصر التحكم

### Button

هدف ضغط يتولى سلوكه وليس له مظهر: الضغطات وحالتا التعطيل والتحديد ودوره لقارئات الشاشة. مظهره هو `class` و`style` الخاصان بالتطبيق مع متغيّرات الحالة، ومحتواه هو عناصره الفرعية. راجع [Button](../elements/button.md).

### Link

هدف ضغط ينقل إلى مكان ما وليس له مظهر: الضغطات، ومفتاحا Return وSpace أثناء امتلاكه تركيز لوحة المفاتيح، وحالة التعطيل، ودور الرابط لقارئات الشاشة، والصفحة الحالية في التنقل (`current`). و`href` هو وجهته التي لا تُعرض أبدًا: يبلّغ الضغط عنها (`onOpen`)، ثم يفتح صفحة ويب أو رابط تطبيق آخر خارج التطبيق، أو يترك الفتح، مع `openWith="app"`، لمسارات التطبيق الخاصة. راجع [Link](../elements/link.md).

### Checkbox

عنصر تحكم محدد أو غير محدد أو غير محسوم يتولى سلوكه وليس له مظهر: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور خانة الاختيار وقيمتها لقارئات الشاشة (مختلطة أثناء عدم الحسم)، مع كون القيمة مملوكة للتطبيق (`checked`، `indeterminate`، `onChange`). ينسّق التطبيق خانة الاختيار ومؤشرها، وتتبع فئات `checked:` و`indeterminate:` و`disabled:` الخاصة بالمؤشر خانة الاختيار، ويضع التطبيق علامته الخاصة في المؤشر (`indicator`). راجع [Checkbox](../elements/checkbox.md).

### Radio and RadioGroup

خيار واحد من مجموعة يختار المستخدم منها واحدًا بالضبط، والمجموعة المحيطة بها. يتولى الراديو سلوكه وليس له مظهر: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور الراديو وحالة تحديده لقارئات الشاشة. أما المجموعة فهي مجموعة الراديو التي تعلنها قارئات الشاشة ولا تحمل قيمة: يخبر التطبيق كل راديو بما إذا كان محددًا (`checked`)، ويطلب الضغط على راديو غير محدد تحديده (`onChange`). مؤشر التطبيق وتسميته هما العنصران الفرعيان للراديو، وتتبعه فئات `group-checked:` الخاصة بهما. راجع [Radio](../elements/radio.md).

### Switch

عنصر تحكم للتشغيل / الإيقاف يتولى سلوكه وليس له مظهر: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور المفتاح وقيمته لقارئات الشاشة، مع كون القيمة مملوكة للتطبيق (`checked`، `onChange`). ينسّق التطبيق المفتاح ومساره ومقبضه، وتتبع فئات `checked:` و`disabled:` المفتاحَ. راجع [Switch](../elements/switch.md).

### Tab and Tabs

علامات التبويب في قائمة علامات التبويب والقائمة المحيطة بها. تتولى علامة التبويب سلوكها وليس لها مظهر: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور علامة التبويب وحالة تحديدها لقارئات الشاشة. والقائمة هي قائمة علامات التبويب التي تعلنها قارئات الشاشة ولا تحمل قيمة: يخبر التطبيق كل علامة بما إذا كانت محددة (`selected`)، ويستمع إلى الضغطات (`onPress`)، ويعرض بنفسه محتوى القسم المحدد. تسمية التطبيق هي العنصر الفرعي لعلامة التبويب، وتتبعها فئات `group-selected:` الخاصة بها. ومؤشر القائمة (`indicatorClass`، `indicatorStyle`)، وهو خط سفلي أو حبّة ينسّقها التطبيق، يستقر على علامة التبويب المحددة وينتقل إلى التالية أصليًا بحركة نابضية. راجع [Tabs](../elements/tabs.md).
### Carousel

شرائح تُعرض واحدة في كل مرة (صور منتج، شاشة تعريفية، لافتة، صف من البطاقات). المحتوى عبارة عن scroll view أصلي يلتقط بدايات الشرائح، فيحرّكها الإصبع وعجلة الفأرة ولوحة اللمس في الإطار نفسه الذي يتحرك فيه المؤشر. وعندما يستقر، يبلغ الـ carousel عن الشريحة المعروضة عبر `onChange`. ويحرّكه بشكل أصلي كل من السابق والتالي (`CarouselPrevious`، `CarouselNext`) والترقيم (عدة `CarouselPaginationItem` داخل `CarouselPagination`، مع مؤشر ينتقل بحركة نابضية إلى الشريحة المعروضة) ومفاتيح الأسهم، مع الالتفاف عند الطرفين بسلاسة بواسطة `looping`. الشريحة المعروضة هي `index` الخاصة بالتطبيق، ويقدّمها مؤقّت التطبيق نفسه للشرائح التي تنتقل من تلقاء نفسها (`onDragStart` / `onDragEnd`، `onFocus` / `onBlur` تحدد متى ينتظر)؛ أما المظهر وكل التسميات فمن مسؤولية التطبيق. انظر [Carousel](../elements/carousel.md).

### Toggle and ToggleGroup

زر يكون مفعّلًا أو غير مفعّل (غامق، مفضلة، خيار عرض)، وشريط أدوات من هذه الأزرار. يتولى الـ toggle سلوكه بنفسه وليس له مظهر: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور الزر مع حالة الضغط لقارئات الشاشة. أما المجموعة فهي شريط الأدوات الذي تعلن عنه قارئات الشاشة، وتمثّل محطة واحدة في تركيز لوحة المفاتيح تنقل مفاتيح الأسهم فيها بين الـ toggles دون ضغطها، ولا تحمل أي قيمة: يخبر التطبيق كل toggle بما إذا كان مضغوطًا (`pressed`)، ويسمع القيمة التي يطلبها (`onChange`)، ويُبقي أي عدد منها مضغوطًا أو واحدًا فقط. ويعطّل `disabled` على المجموعة كل toggle فيها. وأيقونة التطبيق أو تسميته هي children الخاصة بالـ toggle، وتتبعها فئات `group-aria-pressed:`. انظر [Toggle](../elements/toggle.md).

### Toolbar, ToolbarGroup and ToolbarSeparator

شريط من عناصر التحكم: تنسيق محرر نصوص، أو أزرار التشغيل في مشغّل وسائط، أو لوحة أدوات عمودية. الـ toolbar هو ما تعلن عنه قارئات الشاشة (ويُسمّى بواسطة `accessibilityLabel`)، وهو محطة واحدة في تركيز لوحة المفاتيح فوق `Button` و`Toggle` و`Link` التي بداخله: يدخل Tab عند العنصر الذي غادره آخر مرة، وتتحرك مفاتيح الأسهم الخاصة بـ `axis` على امتداده، ويقفز Home وEnd إلى طرفيه، دون ضغط أي شيء. و`ToolbarGroup` هي مجموعة مسمّاة من العناصر المترابطة (التراجع والإعادة، أو المحاذاة)، و`ToggleGroup` داخل toolbar هي إحدى مجموعاته، وتكون أزرار toggle فيها عناصر الـ toolbar. و`ToolbarSeparator` هو خط يرسمه التطبيق بين المجموعات. ويعطّل `disabled` على الـ toolbar أو على مجموعة كل عنصر فيها. لا يحمل الـ toolbar أي قيمة وليس له مظهر: يحتفظ كل عنصر تحكم بحالته، ويصمم التطبيق الشريط ومجموعاته وفواصله. انظر [Toolbar](../elements/toolbar.md).

### Select

اختيار قيمة واحدة من قائمة عناصر تُعطى كبيانات (`items`: لكل عنصر قيمة وعنوان، وقد يكون معطّلًا أو ضمن قسم)، دون مظهر. يفتح زرّ التطبيق القائمة: نافذة منبثقة عند الزر على أجهزة سطح المكتب، وورقة (sheet) من الأسفل على الهواتف والأجهزة اللوحية. يتولى الـ select لوحة المفاتيح (Up وDown وHome وEnd وPage Up وPage Down والإكمال بالكتابة وReturn وEscape)، والبحث (`searchable`)، والصف المميّز (`focus:` على `itemClass`؛ ويتلقى `renderItem` ماهية العنصر، لا حالته أبدًا)، وأدوار combobox وlistbox وoption لقارئات الشاشة. ويملك التطبيق القيمة (`value`، `onChange`) أو يتركها للـ select (`defaultValue`)، ويصمم كل جزء أو يرسم الصفوف. انظر [Select](../elements/select.md).

### Combobox

قيم تُختار من قائمة عناصر، مثل قائمة select، وتُصفّى بالكتابة في حقل إدخال الـ combobox، دون مظهر: قيمة واحدة، أو عدة قيم مع `multiple`، وعندها يبدّل الاختيار حالة العنصر بينما تبقى القائمة مفتوحة. القيمة مصفوفة يملكها التطبيق (`value`، `onChange`) أو يتركها للـ combobox (`defaultValue`)؛ ويخبر `onConfirm` بها عند إغلاق القائمة. ويمكن أن يملك التطبيق الاستعلام (`query`، `onQueryChange`)، ويظهر تذييل تحت الصفوف، ويفرّغ زر المسح القيمة. انظر [Combobox](../elements/combobox.md).

### Calendar

تاريخ، أو نطاق من التواريخ مع `range`، يُختار من أشهر مؤلفة من أيام، دون مظهر. يُعرض شهر واحد أو عدة أشهر (`numberOfMonths`) جنبًا إلى جنب؛ وتنقلها الترويسة وتفتح عرضًا للأشهر أو صفحة للسنوات. القيمة تاريخ بصيغة ISO (`"2026-10-28"`) أو `[start, end]` يملكه التطبيق (`value`، `onChange`) أو يتركه للـ calendar (`defaultValue`)؛ ويمنع `disabledMatcher` اختيار أيام معينة، وتتلقى الأيام لوحة المفاتيح كمحطة واحدة لمفتاح Tab. يصمم التطبيق الأجزاء ويرسم العناصر (`renderItem`، مع إعطائه ماهية العنصر؛ وحالاته هي فئاته، وأيام النطاق `selected:` مع `data-range-start:` و`data-range-middle:` و`data-range-end:`). انظر [Calendar](../elements/calendar.md).

### TimeField

وقت من اليوم يُحرَّر قطاعًا بعد قطاع، دون مظهر: الساعة والدقيقة والثانية (`precision`) وAM/PM (`hourCycle="h12"`)، بالزيادة والنقصان أو بالكتابة أو بلوحة أرقام الهاتف. القيمة هي `"HH:MM"` (`"HH:MM:SS"`) بنظام 24 ساعة، يملكها التطبيق (`value`، `onChange`) أو الحقل نفسه (`defaultValue`). انظر [TimeField](../elements/time-field.md).

### DatePicker

تاريخ يُختار من calendar يُفتح من زرّ التطبيق، كما تُفتح قائمة select: نافذة منبثقة على أجهزة سطح المكتب، وورقة على الهواتف. القيمة بصيغ مدخلات HTML: تاريخ ISO، أو `[start, end]` مع `range`، أو تاريخ ووقت مع `timePrecision` (حقل وقت تحت calendar)، يملكها التطبيق (`value`، `onChange`) أو الـ picker نفسه (`defaultValue`). تضبط القيم المسبقة (presets) القيمة، ويمسحها زر المسح، وتُمرَّر كل خاصية من خاصيات `Calendar`. انظر [DatePicker](../elements/date-picker.md).

### Collapsible

منطقة يتمدد محتواها وينطوي، دون مظهر: تظهر children الخاصة بها دائمًا (ملخص، الزر المحفّز)، ويظهر `content` بعدها عندما يكون `open`. يملك التطبيق `open` والزر الذي يقلبها، ويُعلِم قارئات الشاشة بحالة التمدد هناك. يُنشأ المحتوى مرة واحدة ويبقى أثناء الانطواء، فيحتفظ ما بداخله بحالته. ومع `reveal` يُفتح ويُغلق بارتفاع نابضي، بشكل أصلي. انظر [Collapsible](../elements/collapsible.md).

### Accordion

أقسام مكدّسة تتمدد وتنطوي تحت عناوينها، دون مظهر: `Accordion` من `AccordionItem`، كل منها `AccordionHeader` يحيط بـ `AccordionTrigger` و`AccordionPanel`. يملك التطبيق `value`، وهي قيم العناصر المفتوحة، ويضبط القيمة الوحيدة التي يبلغ عنها `onChange` عند الضغط على زر محفّز: عنصر واحد في كل مرة، أو عدة عناصر مع `multiple`. تسمع قارئات الشاشة مجموعة من العناوين تبيّن أزرارها ما إذا كان عنصرها ممدّدًا، وكل لوحة مفتوحة كمنطقة (region). ومع `reveal` تُفتح اللوحة وتُغلق بارتفاع نابضي، بشكل أصلي؛ ومع `keepMounted` يبقى محتواها في الشجرة أثناء الإغلاق. انظر [Accordion](../elements/accordion.md).

### Avatar

صورة شخص، دون مظهر: البديل (الأحرف الأولى من `name`، أو `fallback` الخاص بالتطبيق) والصورة فوقه، شفافة حتى تُحمَّل، وكلاهما بحجم الـ avatar نفسه، ثم children الخاصة بالتطبيق (نقطة الحضور). تغيّر أحداث التحميل والخطأ في الصورة نفسها حالتها بشكل أصلي (`onStatusChange`)، ويُبقي `fallbackDelay` البديل في الخلف أثناء تحميل الصورة. تسمع قارئات الشاشة صورة موسومة بالاسم. ويعرض `AvatarGroup` أول `limit` من الـ avatars، ولا ينشئ views للبقية، ويعرض `overflow` عندما يكون `total` أكبر. انظر [Avatar](../elements/avatar.md).

### Progress

شريط تقدّم خطي، دون مظهر: مسار يحتوي على مؤشر، عرض المؤشر `value` بالمئة من عرض المسار. يملك التطبيق `value` (من 0 إلى 100) و`indeterminate`؛ وتحصل قارئات الشاشة على دور شريط التقدّم والنطاق والقيمة، ولا قيمة أثناء الحالة غير المحدّدة، حيث يكون عرض المؤشر وحركته من شأن التطبيق. انظر [Progress](../elements/progress.md).

### NumberInput

رقم يُكتب في حقل أو يُزاد وينقص بالخطوات، دون مظهر: الحقل (`Input`)، وزر النقصان قبله وزر الزيادة بعده (أو كلاهما في عمود على اليمين، `controlsRight`). يملك التطبيق `value` (رقمًا أو `null`؛ أو يحتفظ الـ input بقيمته الخاصة من `defaultValue`) ويسمع `onChange` مع الرقم الذي يقرؤه الحقل. يقبل الحقل رقمًا أو النص في طريقه إلى أن يصبح رقمًا، بما في ذلك أرقام وإشارات لوحات المفاتيح الأخرى؛ وتغيّر الأزرار ومفتاحا Up / Down ومفتاحا Page Up / Page Down القيمة بمقدار `step`، مع الحفاظ على الكسور العشرية، حتى `min` و`max`، ويُخضع مغادرة الحقل القيمة المكتوبة لهما. والحقل عنصر spin button لقارئات الشاشة، وتغيّره أوامر الزيادة والنقصان فيه. انظر [NumberInput](../elements/number-input.md).

### Slider

قيمة، أو نطاق من قيمتين، تُختار على امتداد مسار، دون مظهر: مسار يستقبل الضغطات والسحب، والمؤشر بداخله الذي تُعيَّن عليه القيم، والنطاق وإبهام (thumb) واحد لكل قيمة عليه. يملك التطبيق `value` (رقمًا أو `[start, end]`؛ أو يحتفظ الـ slider بقيمته الخاصة من `defaultValue`) ويسمع `onChange` لكل قيمة جديدة، مقرَّبة إلى `step` بدءًا من `min`، و`onChangeEnd` مرة واحدة لكل تغيير؛ ويوزّع `scale` القيم خطيًا أو بحسب رتب الحجم، ويرتّب `axis` المسار أفقيًا أو عموديًا. كل إبهام عنصر قابل للضبط لقارئات الشاشة بقيمته الخاصة، وهو محطة في تركيز لوحة المفاتيح، ويتحرك بمفاتيح slider في WAI-ARIA. انظر [Slider](../elements/slider.md).

### Scrollbar

شريط تمرير بمظهر التطبيق الخاص لـ scroll view أو لقائمة، يوضع حيث يريد التطبيق، دون مظهر: مسار (`class` الخاص بالشريط) وإبهام فيه (`thumbClass`). يسمّي الـ scroll view الخاص به (`scroll`، `ref` الخاص به) ويتبع إزاحته ومحتواه ونافذة العرض؛ ويمرّر سحب الإبهام المحتوى، ويحرّك الضغط على المسار منتصف الإبهام إلى هناك. يُظهره `mode` أثناء تمرير المحتوى (حتى `motion.idle` بعد ذلك)، أو أثناء وجود المؤشر فوق الشريط، أو دائمًا؛ ويجعله `axis` أفقيًا. ويعطي `Scrollbar.setTheme` كل scroll view وقائمة شريطًا بمظهر التطبيق فوق نافذة عرضه، دون شريط يُوضع يدويًا، ويمكن لأي view أن يأخذ سمة خاصة به عبر خاصية `scrollbar`. انظر [Scrollbar](../elements/scrollbar.md).

### ColorPicker

منتقي ألوان دون مظهر: يحمل الجذر اللون وتعرضه الأجزاء بداخله وتغيّره، ويرتّبها التطبيق. `ColorArea` هو التشبّع والسطوع في HSB، و`ColorSlider` أي قناة من RGB أو HSL أو HSB أو OKLCH أو القناة الشفافة alpha (أفقيًا أو عموديًا)، و`ColorField` اللون بأي صيغة CSS أو رقم قناة، و`ColorSwatch` لون مسبق يختاره الضغط أو معاينة للون، و`ColorEyeDropper` زر يلتقط لونًا من الشاشة (macOS، الويب). يملك التطبيق `value` (أو يحتفظ المنتقي بقيمته الخاصة من `defaultValue`) ويسمع `onChange` و`onChangeEnd` مع اللون ونصه كما يكتبه `format`؛ ويحتفظ المنتقي بقنوات كل فضاء لوني كما ضبطها المستخدم. والإبهامات عناصر قابلة للضبط لقارئات الشاشة ومحطات في تركيز لوحة المفاتيح. انظر [ColorPicker](../elements/color-picker.md).

### OtpInput

رمز رقمي لمرة واحدة بطول ثابت، دون مظهر: حقل نصي أصلي واحد فوق الخلايا يستقبل لوحة المفاتيح، فالكتابة واللصق ولوحة الأرقام والملء التلقائي للرمز من النظام كلها من عمل المنصة، وتجد قارئات الشاشة حقلًا نصيًا واحدًا. لا تدخل إلا الأرقام، حتى `length`؛ ويزيل Backspace آخر رقم. يملك التطبيق `value` (أو يعطي `defaultValue`) ويسمع `onChange` و`onComplete`؛ ويصمم الخلايا (`focus:` على الخلية التي تستقبل الرقم التالي، و`data-filled:` على الخلايا التي تحمل رقمًا) ومجموعاتها والمؤشر. انظر [OtpInput](../elements/otp-input.md).

### Pagination

صفحات مجموعة يُنتقل بينها، معلم تنقّل (navigation landmark) دون مظهر: السابق، والصفحة الأولى والأخيرة، والصفحة الحالية مع جاراتها (`visiblePages`)، وعلامة حذف لكل مقطع محذوف، وchildren الخاصة بالتطبيق، والتالي؛ ويُبقي `compact` السابق وchildren والتالي. يملك التطبيق `page` ويسمع `onChange({ page })`؛ والصفحة الحالية هي `selected:` والصفحة الحالية لقارئات الشاشة. يصمم التطبيق العناصر (`itemClass`) أو يرسمها (`renderItem`). انظر [Pagination](../elements/pagination.md).

### Command

لوحة أوامر: حقل بحث فوق أوامر التطبيق (`items`: `id`، و`label`، و`keywords`، و`group`، و`shortcut` لعرضه، و`disabled`، و`checked`)، تُصفّى أصليًا أثناء كتابة المستخدم (تحمل التسمية أو الكلمة المفتاحية الاستعلام، مع تجاهل حالة الأحرف؛ وتُحذف الأقسام التي لا تطابق)، في قائمة افتراضية (virtualized) لا تنشئ إلا الصفوف الظاهرة. يحرّك Up وDown التمييز، ويختار Return أو الضغط (`onSelect({ id })`)، ويمسح Escape الاستعلام ثم يبلّغ عن `onCancel`، حيث يغلق التطبيق `Dialog` المحيط به. الاستعلام يملكه التطبيق (`query`، `onQueryChange`) أو الحقل نفسه؛ ومع `filterable={false}` و`loading` يجيب التطبيق عنه من خادم. يصمم التطبيق كل جزء (`itemClass` مع `focus:` للتمييز، `checked:`، `disabled:`) ويرسم الصفوف (`renderItem`، مع إعطائه الاختصار كما يظهر هنا). انظر [Command](../elements/command.md).

### Tree

عناصر تحتوي على عناصر: ملفات مشروع، شريط جانبي للإعدادات، مخطط تفصيلي. `items` بيانات (`TreeItem`: `id`، و`label`، و`children`، و`disabled`)، والصفوف افتراضية (virtualized): لا يُنشأ منها إلا الظاهر، ولا يُنشأ أبناء العنصر المنطوي أبدًا، فتبقى شجرة من آلاف العناصر سريعة. يملك التطبيق معرّفات العناصر الممدّدة والعنصر المحدد (`expanded`، `selected`، مع `onExpandedChange` و`onSelectedChange`) أو تحتفظ الشجرة بحالتها الخاصة (`defaultExpanded`، `defaultSelected`). يحدد الضغط صفًا ويمدّد المجلد أو ينطويه؛ والشجرة محطة واحدة في تركيز لوحة المفاتيح، تحرّك مفاتيح الأسهم فيها التحديد (يمدّد Right وينطوي Left، ويدخلان المجلد ويغادرانه)، مع Home وEnd وReturn وSpace والإكمال بالكتابة. يصمم التطبيق الصفوف (`itemClass` مع `selected:`، `aria-expanded:`، `focus:`) ويرسمها (`renderItem`، مع إعطائه `depth` لكل عنصر). انظر [Tree](../elements/tree.md).
### Plot (`nsh/base/plot`)

الأجزاء التي تُبنى منها المخططات، كما في `gpui-base` الخاص بـ `plot`، في وحدة مستقلة: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
(x وy مفاتيح مفحوصة أو دوال لصف من الصفوف)، ومقاييس `point` أو `linear` أو `band` لمحاورها، والصف الواقع تحت المؤشر
(`onHoverChange`) وحركته (`motion`: الظهور، وتلاشي التمرير وانزلاقه). ترسم علاماتها محليًا انطلاقًا من
الصفوف، دون أي JS لكل نقطة، وتُطلى بخصائص طلاء SVG (`stroke-*`، `fill-*`)، مع `currentColor` حيث لا يوجد
تحديد؛ ويعرض `Area` أو `Bar` خلفية (تدرجًا لونيًا، `bg-linear-*`) داخل أشكاله. تقف الأعمدة في
نطاقات مقياس `band`، جنبًا إلى جنب أو متراصة في `stack`، وتنمو عند ظهور المخطط وتتلاشى بعيدًا عن الصف
الواقع تحت المؤشر، مع جزء `label` عند طرف كل عمود. أما الخط المتقاطع للتمرير، والنقاط (لكل علامة نقطتها الخاصة
مع `hoverDotClass`)، والتلميح (`tooltipPlacement`، ويبقى داخل المخطط) فهي أجزاء ينسّقها التطبيق ويملؤها، وتتحرك
محليًا؛ وتسميات المحاور هي عناصر التطبيق نفسه. يقسّم `Pie` الدورة إلى شريحة لكل صف (حلقة دائرية مع
`innerRadius`)، وتُطلى كل شريحة بفئاتها الخاصة (`sliceClass`، دالة لصفها)، ويرسم `Arc` قطاعًا واحدًا
بين زاويتين (مسار مقياس القياس وقيمته)؛ وفوق المخطط الدائري يبلّغ المخطط عن الشريحة الواقعة تحت المؤشر، فترتفع
(`hoverLift`) بينما تتلاشى الأخرى (`hoverDim`). يرسم `Sankey` التدفقات بين الصفوف (`links`)، ويرتبها
بالطريقة التي يرتبها بها d3-sankey، ويُطلى كل عقدة وشريط بفئاته الخاصة، وتحمل عقده تسميات وتستجيب للتمرير وتنتقل إلى تدفقات جديدة. يرصف `Treemap` الصفوف على هيئة تسلسل هرمي من
المستطيلات المتداخلة (`id`، `parent`)، ومساحة كل ورقة هي `value`، وتُلوَّن بحسب الفئة أو على امتداد تدرج من
`colorScale` الخاص بالمخطط، وتظهر تسمياتها حيث تتسع لها المساحة. راجع [Plot](../elements/plot.md).

<a id="workspaces"></a>

## مساحات العمل

<a id="resizablepanelgroup-and-resizablepanel"></a>

### ResizablePanelGroup و ResizablePanel

لوحات جنبًا إلى جنب أو متراصة، بينها مقبض بين كل لوحتين يسحبه المستخدم لتقاسم المساحة. تتولى المجموعة
السحب، الذي يجري محليًا، وحدود كل لوحة (`minSize`، `maxSize`) ومؤشر تغيير الحجم؛ أما الأحجام فهي
للتطبيق (`size`، ويُبلَّغ عنها عبر `onResize`)، وكذلك مظهر المقابض ومحتوى اللوحات. راجع
[Resizable](../elements/resizable.md).

### DockArea

مساحة عمل قابلة للإرساء: لوحات في مجموعات تبويب، ومجموعات مقسّمة جنبًا إلى جنب أو متراصة، وأرصفة على الحواف
اليسرى واليمنى والسفلية. التخطيط بيانات يملكها التطبيق (`layout`، ويُبلَّغ عنها عبر `onLayoutChange`)؛ وتتولى المنطقة سحب التبويبات
وإفلاتها، وتغيير الحجم، والأرصفة، والتكبير، والقفل، وتحافظ على محتوى كل لوحة أثناء انتقالها، وتعرض التخطيط نفسه
بأدراج وورقة سفلية عندما تكون المساحة ضيقة. أما التبويبات والمقابض ومؤشر الإفلات ومحتوى اللوحات فهي
للتطبيق. راجع [Dock](../elements/dock.md).

<a id="documents"></a>

## المستندات

### TextView

يعرض `TextView` مستندًا بصيغة Markdown أو HTML أو كتل يبنيها التطبيق، ويرسمه بعناصر [`Text`](../elements/text.md)
وطرق عرض: عناوين وقوائم وشيفرة وجداول وصور ومعادلات وحواشٍ سفلية وصيغة التطبيق الخاصة. وهو مصمم
لردود الدردشة بالذكاء الاصطناعي التي تصل تدفقًا، بطباعة مخصصة للقراءة بألوان السمة يعيد التطبيق تنسيقها جزءًا جزءًا،
ودوال عرض تضع محتوى التطبيق في مكانه. راجع [TextView](../elements/text-view.md).

<a id="code"></a>

## الشيفرة

### Editor

`Editor` محرر شيفرة لأكثر من خمسين لغة: تلوين الصياغة، وأرقام الأسطر، وعدة مؤشرات إدراج، والطي،
والالتفاف التلقائي، والبحث والاستبدال، والتشخيصات والزخارف، مع اختصارات محررات الشيفرة. النص
للتطبيق (`value` و`onChange`)، وكذلك شريط البحث الذي يتحكم في `search` الخاص بالمحرر. ويأتي بمظهر مبني من
رموز السمة يعيد التطبيق تنسيقه جزءًا جزءًا. راجع [Editor](../elements/editor.md).

### DiffView

يعرض `DiffView` التغييرات بين نصين، أو في ملفات تصحيح (patch)، كما تفعل أدوات مراجعة الشيفرة: جنبًا إلى جنب أو
موحّدًا، مع إبراز الكلمات المتغيرة داخل الأسطر، وطي الأسطر غير المتغيرة في فواصل قابلة للتوسيع، بألوان صياغة
`Editor`. وتحتفظ إجراءات التطبيق بكل تغيير أو تتراجع عنه. راجع [DiffView](../elements/diff-view.md).

### Table

يرتّب `Table` وأجزاؤه بضعة صفوف يكتبها التطبيق على أنها عناصر فرعية، ويمنح قارئات الشاشة جدولًا: مجموعات من الصفوف،
وصفوفًا، ورؤوس أعمدة، وخلايا. يقبل كل جزء مظهر التطبيق. راجع [Table](../elements/table.md).

### DataTable

يعرض `DataTable` صفوفًا وأعمدة ويتمرّر في الاتجاهين فوق أي عدد منها، ولا يرسم إلا الخلايا الظاهرة. يمكن تحديد الصفوف
أو الأعمدة أو الخلايا؛ وتتغير أحجام الأعمدة وتنتقل وتثبت وتُرتَّب (يتولى التطبيق الترتيب)؛ ويقدّم التطبيق الصفوف صفحة صفحة
ويمكنه رسم الخلايا والعناوين. راجع [DataTable](../elements/data-table.md).

<a id="navigation"></a>

## التنقل

`NavStack` من `NavPage` هو `UINavigationController` على iOS، ومكدّس بشريط أدوات ورجوع تنبؤي على
Android؛ وعلى أنظمة سطح المكتب والويب تعرض كل صفحة `header` الخاص بالتطبيق. راجع
[NavStack](../elements/nav-stack.md)، الذي يغطي أيضًا `createNavStack` ومغادرة الصفحة.

### Dialog

يعرض `Dialog` المحتوى فوق كل شيء آخر، بما في ذلك ترويسة المكدّس، في طبقة نافذة أصلية خاصة به.
ينسّق التطبيق نافذته المنبثقة وخلفيته. راجع [Dialog](../elements/dialog.md).

<a id="alert-dialogs"></a>

## مربعات حوار التنبيه

### AlertDialog

يعرض `AlertDialog.show(options)` تنبيه المنصة الأصلي أو ورقة الإجراءات، ويُحسم بالقيمة `{ action }`، وهي `id`
الإجراء الذي اختاره المستخدم. راجع [AlertDialog](../elements/alert-dialog.md).

<a id="input"></a>

## الإدخال

`Input` هو حقل إدخال النص الأصلي للمنصة: حقل بسطر واحد أو متعدد الأسطر تتولى المنصة الكتابة فيه ومؤشر الإدراج والتحديد
والتصحيح التلقائي والملء التلقائي. ويملك التطبيق قيمته ومظهره. خصائصه هي النوع `InputProps` (مع `IOSInputProps` لـ `ios={{…}}`)، ويُصدَّر بجانبه. راجع [Input](../elements/input.md).

<a id="status-bar"></a>

## شريط الحالة

ينتمي شريط الحالة إلى ما هو معروض على الشاشة، كما في UIKit، حيث يعلن كل view controller عن
`preferredStatusBarStyle` الخاص به ويقرر الأعلى منها. في NSH تقوم الصفحات ومربعات الحوار مقام وحدات التحكم هذه: تعلن
`NavPage` أو `Dialog` عن شريط الحالة الذي تريده عبر `statusBar`، ويعلن التطبيق إعداده الافتراضي في
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

يقبل `statusBar` هذه الحقول، وكلها اختيارية (في Rust، `StatusBarStyle` وحده، أو دوال البناء الخاصة بـ `StatusBarSetting`
بالأسماء نفسها):

| الحقل | النوع | الوصف |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (في Rust: `StatusBarStyle::Default`، `Light`، `Dark`) | لون المحتوى (الوقت، البطارية، الإشارة): `"light"` للخلفيات الداكنة، `"dark"` للفاتحة، `"auto"` لون المنصة للمظهر الحالي. |
| `hidden` | `boolean` | يخفي شريط الحالة. |
| `animated` | `boolean` | يحرّك التغيير عند ظهور الصفحة أو مربع الحوار واختفائه. |

القيمة تفاعلية: يتبع `statusBar={{ foreground: dark() ? "light" : "dark" }}` الإشارة، وكذلك يفعل إغلاق Rust
الذي يقرأ إشارة.

<a id="which-one-applies"></a>

### أيّها يُطبَّق

تقرر الصفحة أو مربع الحوار المعروض **الأحدث**، **حقلًا بحقل**: الصفحة المدفوعة إلى مكدّس تعلو الصفحات
التي تحتها، ومربع الحوار المفتوح يعلو الصفحات. وأي حقل تُغفله يأتي من الذي تحتها، وفي النهاية
من الإعداد الافتراضي للتطبيق. وعندما تُسحب الصفحة أو يُغلق مربع الحوار، يعود الذي تحتهما إلى التطبيق.

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

### الإعداد الافتراضي للتطبيق

`"statusBar"` في `nsh.json` هو الإعداد الذي يقع تحت كل صفحة ومربع حوار، كما أن `UIStatusBarStyle` و
`UIStatusBarHidden` في Info.plist كذلك في تطبيق UIKit:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

كلا الحقلين اختياري. وبدونه يكون المحتوى `"auto"` ويظهر الشريط. وتعرضه تطبيقات iOS المعبأة أيضًا على
شاشة الإطلاق.

<a id="the-status-bar-on-each-platform"></a>

### شريط الحالة على كل منصة

- **iOS**: يتحرك الإخفاء والإظهار بتلاشٍ. وفي تطبيق [مضمَّن](../docs/ios.md) في تطبيق أصلي،
  يقرر view controller الخاص بالتطبيق المضيف شكل شريط الحالة. ويطبّق المضيف إعداد NSH بإرجاع
  `NshAppView.preferredStatusBarStyle` و`NshAppView.prefersStatusBarHidden` و
  `NshAppView.preferredStatusBarUpdateAnimation` من view controller الخاص به.
- **Android**: ترسم التطبيقات من حافة إلى حافة، خلف شريط الحالة (Android 15، API 35): خلفية التطبيق نفسها هي
  خلفية الشريط، ويُبقي `foreground` محتواه مقروءًا عليها.
- **أنظمة سطح المكتب والويب**: شريط عنوان النافذة وأشرطة المتصفح تابعة للنظام والمتصفح؛
  و`statusBar` و`"statusBar"` الخاص بـ `nsh.json` مخصصة للهواتف.

> [!IMPORTANT]
> عندما يعلن `nsh.json` الخاص بك عن `"capabilities"`، لا يتغير شريط الحالة إلا إذا تضمّنت
> `"statusBar": true`؛ وتُرفض التغييرات الأخرى وتُسجَّل. راجع
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

<a id="related"></a>

## ذات صلة

- [Navigation guide](../docs/navigation.md).
- [Forms and keyboard](../docs/forms-and-keyboard.md).
- [Avatar](../elements/avatar.md)، [Button](../elements/button.md)، [Carousel](../elements/carousel.md)، [Link](../elements/link.md)، [Checkbox](../elements/checkbox.md)، [Radio](../elements/radio.md)، [Switch](../elements/switch.md)، [Tabs](../elements/tabs.md)، [Toggle](../elements/toggle.md)، [Toolbar](../elements/toolbar.md)، [Select](../elements/select.md)، [Combobox](../elements/combobox.md)، [Command](../elements/command.md)، [Calendar](../elements/calendar.md)، [TimeField](../elements/time-field.md)، [DatePicker](../elements/date-picker.md)، [Collapsible](../elements/collapsible.md)، [HoverCard](../elements/hover-card.md)، [Accordion](../elements/accordion.md)، [Progress](../elements/progress.md)، [Slider](../elements/slider.md)، [ColorPicker](../elements/color-picker.md)، [Scrollbar](../elements/scrollbar.md)، [NumberInput](../elements/number-input.md)، [OtpInput](../elements/otp-input.md)، [Pagination](../elements/pagination.md)، [Tree](../elements/tree.md)، [Plot](../elements/plot.md)، [NavStack](../elements/nav-stack.md)، [Dialog](../elements/dialog.md)، [AlertDialog](../elements/alert-dialog.md)، [TextView](../elements/text-view.md)، [Editor](../elements/editor.md)، [DiffView](../elements/diff-view.md)، [Table](../elements/table.md)، [DataTable](../elements/data-table.md)، [Text](../elements/text.md) و[Input](../elements/input.md).
  [AlertDialog](../elements/alert-dialog.md)، [TextView](../elements/text-view.md)، [Editor](../elements/editor.md)، [DiffView](../elements/diff-view.md)، [Table](../elements/table.md)، [DataTable](../elements/data-table.md)،
  [Text](../elements/text.md) و
  [Input](../elements/input.md).
- [Device and environment](../docs/device-and-environment.md).
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` وواجهات برمجة التطبيقات الأخرى الخاصة بـ Android فقط.
