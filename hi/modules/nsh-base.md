---
title: "nsh/base"
description: "ऐप की UI के लिए बिना स्टाइल वाले बेस कंपोनेंट: बटन, लिंक, अवतार, कैरोसेल, चेकबॉक्स, रेडियो, स्विच, टैब, टॉगल, टूलबार, ट्री, सेलेक्ट, कॉम्बोबॉक्स, कमांड पैलेट, कैलेंडर, डेट पिकर, टाइम फ़ील्ड, रिसाइज़ करने योग्य पैनल, डॉक करने योग्य वर्कस्पेस, Markdown और HTML दस्तावेज़, कोड एडिटर, डिफ़, टेक्स्ट इनपुट, नेविगेशन स्टैक और डायलॉग, सिस्टम अलर्ट डायलॉग, तथा पेजों और डायलॉग का स्टेटस बार।"
order: 2.5
demo: ui-navigation
source_hash: 292724fc2b76d1a0
---

# nsh/base

`nsh/base` ऐप के UI की बेस कंपोनेंट लेयर है: बिना स्टाइल वाले कंपोनेंट, जो हर प्लेटफ़ॉर्म पर व्यवहार, स्टेट, फ़ोकस और एक्सेसिबिलिटी संभालते हैं। यह प्रिमिटिव (`nsh`, `nsh/mobile` और `nsh/desktop`) और ऐप की अपनी कंपोनेंट लाइब्रेरी के बीच आती है, ठीक वैसे ही जैसे GPUI Kit में `gpui-base`, `gpui` और स्टाइल वाली लाइब्रेरी के बीच आता है (देखें [Modules](./index.md#three-layers))। यह ये सब उपलब्ध कराती है: कंट्रोल (`Button`, `Link`, `Checkbox`, `ColorPicker` अपने `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` और `ColorEyeDropper` के साथ, `RadioGroup` में `NumberInput`, `Radio`, `Slider`, `Switch`, `Tabs` में `Tab`, `ToggleGroup` में `Toggle`, `Select`, `Combobox`, `Calendar`, `TimeField`, `DatePicker`), कमांड पैलेट (`Command`), कंट्रोल की बार (`Toolbar` अपने `ToolbarGroup` और `ToolbarSeparator` के साथ), ऐप के अपने रूप वाले स्क्रोल बार (`Scrollbar`), फैलने और सिकुड़ने वाले क्षेत्र (`Collapsible`, और `Accordion` अपने `AccordionItem`, `AccordionHeader`, `AccordionTrigger` और `AccordionPanel` के साथ), प्रोग्रेस बार (`Progress`), एक-बार वाले कोड (`OtpInput`), किसी सेट के पेज (`Pagination`), ऐसे आइटम जिनमें आइटम होते हैं (`Tree`), चार्ट बनाने वाले हिस्से (`Plot` के साथ `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie` और `Arc`, `nsh/base/plot` में), यूज़र द्वारा सजाए जाने वाले वर्कस्पेस (`ResizablePanelGroup` में `ResizablePanel`, और `DockArea` के स्प्लिट, टैब ग्रुप और डॉक), कैरोसेल (`Carousel` और उसके हिस्से), Markdown या HTML के दस्तावेज़ (`TextView`), कोड एडिटर (`Editor`), टेक्स्ट के बीच के बदलाव (`DiffView`) और पंक्तियों और स्तंभों की टेबल (`Table` और उसके हिस्से, `DataTable`), टेक्स्ट इनपुट (`Input`), सबसे ऊपर दिखने वाले पॉपअप (`Popover`, `Menu` और `ContextMenu` अपने `MenuItem`, `MenuSeparator` और `Submenu` के साथ, `Tooltip`, `Sheet`), टोस्ट (`ToastStack` में `Toast`, उनका लाइफ़साइकिल `ToastManager` में), नेविगेशन (`createNavStack` से बनाई गई स्टेट से चलने वाला `NavPage` का `NavStack`, और बाकी सब कुछ के ऊपर प्रस्तुत होने वाली सामग्री के लिए `Dialog`) और सिस्टम के अलर्ट डायलॉग (`AlertDialog`)। पेज और डायलॉग स्टेटस बार भी तय करते हैं (`statusBar`)।

बेस सेट में `Avatar` और `AvatarGroup` भी शामिल हैं: नेटिव इमेज-लोडिंग स्टेट वाली तस्वीरें, और एक पंक्ति जो अपने पहले `limit` अवतार दिखाती है।

रूप ऐप का अपना होता है: पेज, डायलॉग या हेडर के अंदर जो कुछ जाता है वह आपका अपना JSX है, जिसे प्रिमिटिव से स्टाइल, [Tailwind](../docs/tailwind.md) क्लास और आपकी थीम के साथ बनाया जाता है, या [आपके अपने crate](../docs/rust.md) के Rust कंपोनेंट, या कोई ऐसी कंपोनेंट लाइब्रेरी जिसे समुदाय `nsh/base` पर बनाता है। हर होस्ट `nsh/base` उपलब्ध कराता है; Rust ऐप `nsh-base` crate (`nsh_base::{button, dialog, …}`) से यही API इस्तेमाल करते हैं।

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

यह पेज मॉड्यूल का इंडेक्स है: हर कंपोनेंट का अपना एलिमेंट पेज है, जिसमें उसके उदाहरण, props और प्लेटफ़ॉर्म नोट हैं। विस्तृत मार्गदर्शन के लिए [Navigation guide](../docs/navigation.md) और [Forms and keyboard](../docs/forms-and-keyboard.md) देखें।

| TSX | Rust | यह क्या है |
|---|---|---|
| [`Button`](../elements/button.md) | `button()` | प्रेस का लक्ष्य, जिसमें disabled और selected स्टेट हैं और स्क्रीन रीडर के लिए एक रोल है। |
| [`Link`](../elements/link.md) | `link()` | प्रेस का लक्ष्य जो कहीं ले जाता है: यह अपना `href` सिस्टम के ज़रिए खोलता है, या ऐप उसे खोलता है (`openWith="app"`, `onOpen`)। |
| [`Avatar`](../elements/avatar.md), [`AvatarGroup`](../elements/avatar.md) | `avatar()`, `avatar_group()` | किसी व्यक्ति की तस्वीर, या उसके लोड होने के दौरान, विफल होने पर और तस्वीर न होने पर एक फ़ॉलबैक (नाम के आद्याक्षर, ऐप का आइकन); और एक पंक्ति जो पहले `limit` और एक ओवरफ़्लो दिखाती है। लोडिंग स्टेट नेटिव है। |
| [`Checkbox`](../elements/checkbox.md) | `checkbox()` | checked, unchecked या indeterminate कंट्रोल, जिसका इंडिकेटर और चिह्न ऐप स्टाइल करता है। |
| [`Radio`](../elements/radio.md), [`RadioGroup`](../elements/radio.md) | `radio()`, `radio_group()` | ऐसे सेट का एक विकल्प जिसमें से यूज़र एक चुनता है, और वह सेट; कौन सा चेक है यह ऐप तय करता है। |
| [`Switch`](../elements/switch.md) | `switch()` | on / off कंट्रोल, जिसका ट्रैक और थंब ऐप स्टाइल करता है। |
| [`Tab`](../elements/tabs.md), [`Tabs`](../elements/tabs.md) | `tab()`, `tabs()` | टैब सूची का एक टैब, और वह सूची; कौन सा चुना गया है और उसकी सामग्री दिखाना, यह ऐप के पास है। |
| [`Toggle`](../elements/toggle.md), [`ToggleGroup`](../elements/toggle.md) | `toggle()`, `toggle_group()` | on या off रहने वाला बटन, और ऐसे बटनों का टूलबार; कौन से दबे हैं यह ऐप तय करता है। |
| [`Toolbar`](../elements/toolbar.md), [`ToolbarGroup`](../elements/toolbar.md), [`ToolbarSeparator`](../elements/toolbar.md) | `toolbar()`, `toolbar_group()`, `toolbar_separator()` | बटन, टॉगल और लिंक की एक बार: कीबोर्ड फ़ोकस का एक ठहराव, जिस पर एरो कुंजियाँ आगे-पीछे ले जाती हैं; संबंधित आइटमों के समूह और उनके बीच की रेखाएँ। |
| [`Carousel`](../elements/carousel.md) और उसके हिस्से | `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()`, `carousel_pagination_item()` | स्लाइड जो प्लेटफ़ॉर्म की अपनी स्क्रोलिंग पर एक समय में एक जगह दिखती हैं, साथ में previous / next, पेजिनेशन, कुंजियाँ और सहज लूप; `index` ऐप के पास रहता है। |
| [`Select`](../elements/select.md) | `select()` | आइटमों की सूची में से एक मान: डेस्कटॉप पर ट्रिगर पर एक पॉपअप, फ़ोन पर एक शीट; `value` ऐप के पास है और ट्रिगर वही बनाता है। |
| [`Combobox`](../elements/combobox.md) | `combobox()` | आइटमों की सूची में से एक या कई मान (`multiple`), जिसे उसके इनपुट में टाइप करके फ़िल्टर किया जाता है; `value` ऐप के पास है और फ़ील्ड को वही स्टाइल करता है। |
| [`Calendar`](../elements/calendar.md) | `calendar()` | दिनों के महीनों में से चुनी गई एक तारीख या तारीखों की एक रेंज, जिसमें महीने और साल के व्यू और कीबोर्ड सपोर्ट है; `value` ऐप के पास है और आइटम वही बनाता है। |
| [`TimeField`](../elements/time-field.md) | `time_field()` | दिन का समय, जिसे खंड-दर-खंड (घंटा, मिनट, सेकंड, AM/PM) संपादित किया जाता है; `value` ऐप के पास है। |
| [`DatePicker`](../elements/date-picker.md) | `date_picker()` | कैलेंडर से चुनी गई तारीख, रेंज या तारीख और समय, डेस्कटॉप पर ट्रिगर पर एक पॉपअप में, फ़ोन पर एक शीट में; `value` ऐप के पास है और ट्रिगर वही बनाता है। |
| [`Collapsible`](../elements/collapsible.md) | `collapsible()` | ऐसा क्षेत्र जिसकी सामग्री फैलती और सिकुड़ती है; `open` और उसका ट्रिगर ऐप के पास है। |
| [`Accordion`](../elements/accordion.md), [`AccordionItem`](../elements/accordion.md), [`AccordionHeader`](../elements/accordion.md), [`AccordionTrigger`](../elements/accordion.md), [`AccordionPanel`](../elements/accordion.md) | `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()` | एक के ऊपर एक रखे सेक्शन जो अपने शीर्षकों के नीचे फैलते और सिकुड़ते हैं, एक बार में एक या कई (`multiple`); खुले आइटम, यानी `value`, ऐप के पास हैं। |
| [`OtpInput`](../elements/otp-input.md) | `otp_input()` | ऐप द्वारा स्टाइल किए गए सेलों में एक-बार वाला कोड; `value` ऐप के पास है, और `onComplete` बताता है कि कोड कब पूरा भर गया। |
| [`Pagination`](../elements/pagination.md) | `pagination()` | किसी सेट के पेज: Previous, मौजूदा पेज के आसपास के पेज एलिप्सिस के साथ, ऐप के children और Next; `page` ऐप के पास है। |
| [`Command`](../elements/command.md) | `command()` | कमांड पैलेट: ऐप के कमांड के ऊपर एक सर्च फ़ील्ड, जो लेबल और कीवर्ड से नेटिव रूप से फ़िल्टर होती है, वर्चुअलाइज़्ड सूची में; Return या प्रेस से चुनाव होता है (`onSelect`), Cmd+K पैलेट के लिए `Dialog` में। |
| [`Tree`](../elements/tree.md) | `tree()` | ऐसे आइटम जिनमें आइटम होते हैं, वर्चुअलाइज़्ड: फैले और सिकुड़े हुए, एक चुना हुआ, कीबोर्ड फ़ोकस का एक ठहराव; `expanded` और `selected` ऐप के पास हैं, या ट्री अपने खुद के रखता है। |
| [`Progress`](../elements/progress.md) | `progress()` | प्रोग्रेस बार; `value` (0 से 100) और `indeterminate` ऐप के पास हैं। |
| [`NumberInput`](../elements/number-input.md) | `number_input()` | फ़ील्ड में टाइप की गई या बटनों और कुंजियों से घटाई-बढ़ाई गई संख्या; `value` ऐप के पास है (या इनपुट `defaultValue` से अपना खुद का रखता है)। |
| [`Scrollbar`](../elements/scrollbar.md) | `scrollbar()` | ऐप के अपने रूप वाला स्क्रोल बार, उस स्क्रोल व्यू या सूची के लिए जिसका वह नाम लेता है (`scroll`); उसका थंब सामग्री के साथ चलता है और उसके ड्रैग और प्रेस उसे स्क्रोल करते हैं। |
| [`Slider`](../elements/slider.md) | `slider()` | ट्रैक पर चुना गया एक मान, या दो मानों की रेंज; `value` ऐप के पास है (या स्लाइडर `defaultValue` से अपना खुद का रखता है)। |
| [`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`](../elements/color-picker.md) | `color_picker()`, `color_area()`, `color_slider()`, `color_field()`, `color_swatch()`, `color_eye_dropper()` | कलर पिकर और उसके हिस्से: सैचुरेशन और ब्राइटनेस का क्षेत्र, RGB, HSL, HSB या OKLCH के किसी भी चैनल और अल्फ़ा के स्लाइडर, रंग या किसी चैनल के फ़ील्ड, स्वैच, एक आईड्रॉपर; `value` ऐप के पास है (या पिकर `defaultValue` से अपना खुद का रखता है)। |
| [`ResizablePanelGroup`, `ResizablePanel`](../elements/resizable.md) | `h_resizable()`, `v_resizable()`, `resizable_panel()` | अगल-बगल या ऊपर-नीचे रखे पैनल, जिनके हैंडल को यूज़र खींचकर उनका आकार बदलता है। |
| [`DockArea`](../elements/dock.md) | `dock_area()` | स्प्लिट, टैब ग्रुप और किनारे के डॉक का वर्कस्पेस, जिसे यूज़र सजाता है; उसका लेआउट ऐप का डेटा है। |
| [`NavStack`, `NavPage`, `createNavStack`](../elements/nav-stack.md) | `nav_stack()`, `nav_page()` | नेटिव नेविगेशन स्टैक और उसके पेज। |
| [`Dialog`](../elements/dialog.md) | `dialog()` | बाकी सब कुछ के ऊपर प्रस्तुत की गई सामग्री: शीट, फ़ुल-स्क्रीन फ़्लो, डायलॉग। |
| [`AlertDialog`](../elements/alert-dialog.md) | `alert_dialog()` | प्लेटफ़ॉर्म का अलर्ट या एक्शन शीट। |
| [`TextView`](../elements/text-view.md) | `text_view()` | Markdown, HTML या ब्लॉक का दस्तावेज़, जो टेक्स्ट और व्यू से बनाया जाता है, स्ट्रीम किए गए AI उत्तरों के लिए। |
| [`Editor`](../elements/editor.md) | `editor()` | कोड एडिटर: सिंटैक्स हाइलाइटिंग, कई कैरेट, फ़ोल्डिंग, खोजें और बदलें, डायग्नोस्टिक्स। |
| [`DiffView`](../elements/diff-view.md) | `diff_view()` | दो टेक्स्ट या एक पैच के बीच के बदलाव, अगल-बगल या एकीकृत रूप में, हर बदलाव की अपनी क्रियाओं के साथ। |
| [`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`](../elements/table.md) | `table()`, `table_row()`, ... | ऐप की अपनी पंक्तियों और सेलों की टेबल, जिसमें स्क्रीन रीडर के लिए टेबल के रोल हैं। |
| [`DataTable`](../elements/data-table.md) | `data_table()` | कितनी भी पंक्तियों और स्तंभों की टेबल: चयन, सॉर्टिंग, स्थिर, आकार बदलने योग्य और खिसकाने योग्य स्तंभ, एक बार में एक पेज के रूप में परोसी गई पंक्तियाँ। |
| [`Input`](../elements/input.md) | `nsh_base::input()` | प्लेटफ़ॉर्म का नेटिव टेक्स्ट इनपुट, एक पंक्ति या कई। |
| [`Popover`](../elements/popover.md) | `popover()` | किसी ट्रिगर से जुड़ी सामग्री, सबसे ऊपर। |
| [`HoverCard`](../elements/hover-card.md) | `hover_card()` | उस चीज़ का प्रीव्यू जिसकी ओर उसका ट्रिगर इशारा करता है, जब तक पॉइंटर उस पर टिका रहता है (टच स्क्रीन पर प्रेस से)। |
| [`Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator`, `Submenu`](../elements/menu.md) | `menu()`, ... | मेन्यू: डेस्कटॉप पर कैस्केडिंग सबमेन्यू वाले पॉपअप, फ़ोन पर शीट; चेक किए जा सकने वाले आइटम और एक में से चुनने वाले विकल्प। |
| [`Tooltip`](../elements/tooltip.md) | `tooltip()` | अपने ट्रिगर के बगल में एक संकेत। |
| [`Sheet`](../elements/sheet.md) | `sheet()` | बैकड्रॉप के ऊपर, स्क्रीन के किनारे पर एक पैनल। |
| [`Toast`, `ToastStack`, `ToastManager`](../elements/toast.md) | `toast()`, `toast_stack()`, `ToastManager` | बिना स्टाइल वाले टोस्ट: एक सिमेंटिक रूट, परतों का स्टैक, उनका लाइफ़साइकिल। |
| पेज और डायलॉग पर `statusBar` | `.status_bar(..)` | जब तक कोई पेज या डायलॉग ऊपर है, तब तक स्टेटस बार। देखें [Status bar](#status-bar)। |

Rust में `theme()` ऐप की थीम को डिज़ाइन टोकन (`theme().primary`, `theme().radius`) के रूप में पढ़ता है, ये वही टोकन हैं जो TSX की [थीम क्लास](../docs/tailwind.md#theme-tokens) इस्तेमाल करती हैं।

<a id="controls"></a>

## कंट्रोल

### Button

प्रेस का ऐसा लक्ष्य जो अपना व्यवहार खुद संभालता है और जिसका कोई रूप नहीं होता: प्रेस, disabled और selected स्टेट और स्क्रीन रीडर के लिए उसका रोल। उसका रूप ऐप का अपना `class` और स्टेट वेरिएंट वाला `style` है, और उसकी सामग्री उसके children हैं। देखें [Button](../elements/button.md)।

### Link

प्रेस का ऐसा लक्ष्य जो कहीं ले जाता है और जिसका कोई रूप नहीं होता: प्रेस, कीबोर्ड फ़ोकस रहने पर Return और Space, disabled स्टेट, स्क्रीन रीडर के लिए link रोल और नेविगेशन का मौजूदा पेज (`current`)। `href` वह जगह है जहाँ वह ले जाता है, जो कभी दिखाई नहीं देती: प्रेस उसे रिपोर्ट करता है (`onOpen`), फिर ऐप के बाहर कोई वेब पेज या किसी दूसरे ऐप का लिंक खोलता है, या `openWith="app"` के साथ खोलने का काम ऐप के अपने रूट पर छोड़ देता है। देखें [Link](../elements/link.md)।

### Checkbox

checked, unchecked या indeterminate कंट्रोल, जो अपना व्यवहार खुद संभालता है और जिसका कोई रूप नहीं होता: प्रेस, कीबोर्ड एक्टिवेशन, disabled स्टेट और स्क्रीन रीडर के लिए checkbox रोल और मान (indeterminate होने पर mixed), जबकि मान ऐप के पास रहता है (`checked`, `indeterminate`, `onChange`)। ऐप checkbox और उसके इंडिकेटर को स्टाइल करता है, जिसकी `checked:`, `indeterminate:` और `disabled:` क्लास checkbox के साथ बदलती हैं, और इंडिकेटर में अपना चिह्न रखता है (`indicator`)। देखें [Checkbox](../elements/checkbox.md)।

<a id="radio-and-radiogroup"></a>

### Radio और RadioGroup

ऐसे सेट का एक विकल्प जिसमें से यूज़र ठीक एक चुनता है, और उनके आसपास का सेट। radio अपना व्यवहार खुद संभालता है और उसका कोई रूप नहीं होता: प्रेस, कीबोर्ड एक्टिवेशन, disabled स्टेट और स्क्रीन रीडर के लिए radio रोल और checked स्टेट। समूह वह radio group है जिसकी घोषणा स्क्रीन रीडर करते हैं और वह कोई मान नहीं रखता: ऐप हर radio को बताता है कि वह checked है या नहीं (`checked`), और unchecked पर प्रेस इसकी माँग करता है (`onChange`)। ऐप का इंडिकेटर और लेबल radio के children हैं, जिनकी `group-checked:` क्लास उसके साथ बदलती हैं। देखें [Radio](../elements/radio.md)।

### Switch

on / off कंट्रोल, जो अपना व्यवहार खुद संभालता है और जिसका कोई रूप नहीं होता: प्रेस, कीबोर्ड एक्टिवेशन, disabled स्टेट और स्क्रीन रीडर के लिए switch रोल और मान, जबकि मान ऐप के पास रहता है (`checked`, `onChange`)। ऐप switch, उसके ट्रैक और उसके थंब को स्टाइल करता है, जिनकी `checked:` और `disabled:` क्लास switch के साथ बदलती हैं। देखें [Switch](../elements/switch.md)।

<a id="tab-and-tabs"></a>

### Tab और Tabs

टैब सूची के टैब और उनके आसपास की सूची। tab अपना व्यवहार खुद संभालता है और उसका कोई रूप नहीं होता: प्रेस, कीबोर्ड एक्टिवेशन, disabled स्टेट और स्क्रीन रीडर के लिए tab रोल और selected स्टेट। सूची वह tab list है जिसकी घोषणा स्क्रीन रीडर करते हैं और वह कोई मान नहीं रखती: ऐप हर tab को बताता है कि वह चुना गया है या नहीं (`selected`), प्रेस सुनता है (`onPress`) और चुने गए सेक्शन की सामग्री खुद दिखाता है। ऐप का लेबल tab का child है, जिसकी `group-selected:` क्लास उसके साथ बदलती हैं। सूची का इंडिकेटर (`indicatorClass`, `indicatorStyle`), जो अंडरलाइन या पिल होता है और जिसे ऐप स्टाइल करता है, चुने गए tab पर बैठता है और नेटिव रूप से अगले tab पर कूद जाता है। देखें [Tabs](../elements/tabs.md)।
### Carousel

स्लाइड एक समय में एक जगह दिखाई जाती हैं (किसी उत्पाद की फ़ोटो, ऑनबोर्डिंग, बैनर, कार्ड्स की एक पंक्ति)। कंटेंट एक नेटिव स्क्रॉल व्यू है जो स्लाइडों की शुरुआत पर स्नैप होता है, इसलिए उंगली, व्हील और टचपैड उन्हें पॉइंटर के उसी फ़्रेम में हिलाते हैं; रुकने पर carousel दिखाई गई स्लाइड को `onChange` से रिपोर्ट करता है। पिछला और अगला (`CarouselPrevious`, `CarouselNext`), पेजिनेशन (`CarouselPaginationItem`s एक `CarouselPagination` में, ऐसे इंडिकेटर के साथ जो दिखाई गई स्लाइड तक स्प्रिंग की तरह जाता है) और ऐरो कीज़ इसे नेटिव रूप से चलाते हैं, सिरों के पार भी निर्बाध रूप से, `looping` के साथ। दिखाई गई स्लाइड ऐप की `index` है, जिसे ऐप का अपना टाइमर उन स्लाइडों के लिए आगे बढ़ाता है जो अपने आप आगे बढ़ती हैं (`onDragStart` / `onDragEnd`, `onFocus` / `onBlur` बताते हैं कि कब रुकना है); लुक और हर लेबल ऐप का अपना है। देखें [Carousel](../elements/carousel.md)।

### Toggle and ToggleGroup

एक बटन जो ऑन या ऑफ होता है (बोल्ड, पसंदीदा, व्यू का कोई विकल्प), और ऐसे बटनों का एक टूलबार। Toggle अपना व्यवहार खुद संभालता है और उसका कोई लुक नहीं होता: प्रेस, कीबोर्ड से सक्रिय करना, disabled स्थिति, और स्क्रीन रीडर के लिए pressed स्थिति के साथ बटन की भूमिका। ग्रुप वह टूलबार है जिसे स्क्रीन रीडर घोषित करते हैं; वह कीबोर्ड फ़ोकस का एक ठहराव है जिसकी ऐरो कीज़ toggles को दबाए बिना उनके बीच जाती हैं, और उसमें कोई वैल्यू नहीं होती: ऐप हर toggle को बताता है कि वह pressed है या नहीं (`pressed`), वह वैल्यू सुनता है जो toggle माँगता है (`onChange`), और चाहे जितने toggles pressed रखे या ठीक एक। ग्रुप पर `disabled` उसके हर toggle को disable कर देता है। ऐप का आइकन या लेबल toggle के children होते हैं, जिनकी `group-aria-pressed:` क्लासेज़ उनके साथ चलती हैं। देखें [Toggle](../elements/toggle.md)।

### Toolbar, ToolbarGroup and ToolbarSeparator

नियंत्रणों की एक बार: टेक्स्ट एडिटर की फ़ॉर्मैटिंग, मीडिया प्लेयर के ट्रांसपोर्ट बटन, टूल्स का एक वर्टिकल पैलेट। टूलबार वह है जिसे स्क्रीन रीडर घोषित करते हैं (नाम `accessibilityLabel` से दिया जाता है), और उसके अंदर के `Button`, `Toggle` और `Link` पर कीबोर्ड फ़ोकस का एक ठहराव: Tab उस आइटम पर प्रवेश करता है जिसे उसने आख़िरी बार छोड़ा था, उसके `axis` की ऐरो कीज़ उसके साथ-साथ चलती हैं और Home तथा End उसके सिरों पर कूदती हैं, कुछ भी दबाए बिना। `ToolbarGroup` संबंधित आइटमों की एक नामित शृंखला है (undo और redo, कोई alignment), और टूलबार के अंदर का `ToggleGroup` उसके ग्रुपों में से एक है, और उसके toggles टूलबार के आइटम हैं। `ToolbarSeparator` वह रेखा है जो ऐप शृंखलाओं के बीच खींचता है। टूलबार या ग्रुप पर `disabled` उसके हर आइटम को disable कर देता है। टूलबार में कोई वैल्यू नहीं होती और उसका कोई लुक नहीं होता: हर नियंत्रण अपनी स्थिति खुद रखता है, और बार, उसके ग्रुपों और separators की स्टाइलिंग ऐप करता है। देखें [Toolbar](../elements/toolbar.md)।

### Select

आइटमों की एक सूची में से एक वैल्यू चुनना, जहाँ सूची डेटा के रूप में दी जाती है (`items`: हर एक में एक वैल्यू और एक शीर्षक, वैकल्पिक रूप से disabled या किसी सेक्शन में), बिना किसी लुक के। ऐप का trigger सूची खोलता है: डेस्कटॉप पर trigger के पास एक popup, फ़ोन और टैबलेट पर नीचे एक sheet। Select कीबोर्ड (Up, Down, Home, End, Page Up और Down, typeahead, Return और Escape), खोज (`searchable`), हाइलाइट की गई पंक्ति (`itemClass` पर `focus:`; `renderItem` को मिलता है कि आइटम क्या है, उसकी स्थिति कभी नहीं) और स्क्रीन रीडर के लिए combobox, listbox और option भूमिकाओं को संभालता है। वैल्यू ऐप की होती है (`value`, `onChange`) या वह उसे select पर छोड़ देता है (`defaultValue`), और ऐप हर हिस्से को स्टाइल करता है या पंक्तियाँ खुद बनाता है। देखें [Select](../elements/select.md)।

### Combobox

सूची के आइटमों में से चुनी गई वैल्यूज़, जैसे select की सूची, जो combobox के input में टाइप करने से फ़िल्टर होती है, बिना किसी लुक के: एक, या `multiple` के साथ कई, जहाँ चुनाव आइटम को toggle करता है और सूची खुली रहती है। वैल्यू एक array है जो ऐप की होती है (`value`, `onChange`) या जिसे वह combobox पर छोड़ देता है (`defaultValue`); सूची बंद होते समय `onConfirm` उसे बताता है। क्वेरी ऐप की हो सकती है (`query`, `onQueryChange`), पंक्तियों के नीचे एक footer दिखता है और एक clear बटन वैल्यू को खाली कर देता है। देखें [Combobox](../elements/combobox.md)।

### Calendar

महीनों के दिनों में से चुनी गई एक तारीख़, या `range` के साथ तारीख़ों की एक रेंज, बिना किसी लुक के। एक महीना या कई (`numberOfMonths`) साथ-साथ दिखते हैं; हेडर उन्हें पलटता है और महीनों का एक व्यू या वर्षों का एक पेज खोलता है। वैल्यू एक ISO तारीख़ (`"2026-10-28"`) या `[start, end]` होती है, जो ऐप की होती है (`value`, `onChange`) या जिसे वह calendar पर छोड़ देता है (`defaultValue`); `disabledMatcher` दिनों को चुने जाने से रोकता है, और दिन कीबोर्ड को Tab के एक ठहराव के रूप में लेते हैं। ऐप हिस्सों को स्टाइल करता है और आइटम बनाता है (`renderItem`, जिसे बताया जाता है कि आइटम क्या है; उसकी स्थितियाँ उसकी क्लासेज़ हैं, रेंज के दिन `selected:` के साथ `data-range-start:`, `data-range-middle:` और `data-range-end:`)। देखें [Calendar](../elements/calendar.md)।

### TimeField

दिन का एक समय जिसे एक-एक सेगमेंट करके एडिट किया जाता है, बिना किसी लुक के: घंटा, मिनट, सेकंड (`precision`) और AM/PM (`hourCycle="h12"`), स्टेपिंग, टाइपिंग या फ़ोन के नंबर पैड से। वैल्यू 24-घंटे की घड़ी पर `"HH:MM"` (`"HH:MM:SS"`) होती है, ऐप की (`value`, `onChange`) या फ़ील्ड की अपनी (`defaultValue`)। देखें [TimeField](../elements/time-field.md)।

### DatePicker

ऐप के trigger से खुलने वाले calendar से चुनी गई एक तारीख़, जैसे select की सूची खुलती है: डेस्कटॉप पर popup, फ़ोन पर sheet। वैल्यू HTML inputs के रूपों में होती है: ISO तारीख़, `range` के साथ `[start, end]` या `timePrecision` के साथ तारीख़ और समय (calendar के नीचे एक time field), ऐप की (`value`, `onChange`) या picker की अपनी (`defaultValue`)। Presets इसे सेट करते हैं, एक clear बटन इसे साफ़ करता है, और `Calendar` का हर prop आगे पास हो जाता है। देखें [DatePicker](../elements/date-picker.md)।

### Collapsible

एक क्षेत्र जिसका कंटेंट फैलता और सिमटता है, बिना किसी लुक के: उसके children हमेशा दिखते हैं (एक सारांश, trigger), उसका `content` उनके बाद तब दिखता है जब `open` हो। `open` और उसे पलटने वाला trigger ऐप के होते हैं, और ऐप ही वहाँ स्क्रीन रीडर को expanded स्थिति बताता है। कंटेंट एक बार बनता है और सिमटे रहने पर भी बना रहता है, इसलिए उसके अंदर की चीज़ें अपनी स्थिति बनाए रखती हैं। `reveal` के साथ यह नेटिव रूप से स्प्रिंग जैसी ऊँचाई के साथ खुलता और बंद होता है। देखें [Collapsible](../elements/collapsible.md)।

### Accordion

ऊपर-नीचे रखे सेक्शन जो अपने शीर्षकों के नीचे फैलते और सिमटते हैं, बिना किसी लुक के: `AccordionItem` का एक `Accordion`, जिनमें हर एक `AccordionTrigger` और `AccordionPanel` के चारों ओर एक `AccordionHeader` है। `value`, यानी खुले आइटमों की वैल्यूज़, ऐप की होती हैं, और trigger दबाए जाने पर `onChange` जो रिपोर्ट करता है उसे ऐप सेट करता है: एक समय में एक आइटम, या `multiple` के साथ कई। स्क्रीन रीडर शीर्षकों का एक समूह सुनते हैं जिनके बटन बताते हैं कि उनका आइटम expanded है या नहीं, और हर खुला पैनल एक region के रूप में सुनाई देता है। `reveal` के साथ पैनल नेटिव रूप से स्प्रिंग जैसी ऊँचाई के साथ खुलता और बंद होता है; `keepMounted` के साथ उसका कंटेंट बंद रहने पर भी ट्री में रहता है। देखें [Accordion](../elements/accordion.md)।

### Avatar

किसी व्यक्ति की तस्वीर, बिना किसी लुक के: fallback (`name` के आद्याक्षर, या ऐप का `fallback`) और उसके ऊपर तस्वीर, जो लोड होने तक पारदर्शी रहती है, दोनों avatar जितने बड़े, फिर ऐप के children (एक presence dot)। इमेज के अपने load और error इवेंट उसकी स्थिति को नेटिव रूप से बदलते हैं (`onStatusChange`), और `fallbackDelay` तस्वीर लोड होते समय fallback को पीछे रखता है। स्क्रीन रीडर नाम के लेबल वाली एक इमेज सुनते हैं। `AvatarGroup` अपने पहले `limit` avatars दिखाता है, बाकियों के लिए कोई व्यू नहीं बनाता, और जब `total` अधिक हों तब अपना `overflow` दिखाता है। देखें [Avatar](../elements/avatar.md)।

### Progress

एक रैखिक प्रोग्रेस बार, बिना किसी लुक के: एक track जिसके अंदर एक indicator है, और indicator track की चौड़ाई का `value` प्रतिशत है। `value` (0 से 100) और `indeterminate` ऐप के होते हैं; स्क्रीन रीडर को progress bar की भूमिका, रेंज और वैल्यू मिलती है, और indeterminate रहने पर कोई वैल्यू नहीं मिलती, जब indicator की चौड़ाई और गति ऐप की होती है। देखें [Progress](../elements/progress.md)।

### NumberInput

एक फ़ील्ड में टाइप की गई या स्टेप की गई संख्या, बिना किसी लुक के: फ़ील्ड (`Input`), उसके पहले decrement और उसके बाद increment (या दोनों दाईं ओर एक कॉलम में, `controlsRight`)। `value` (एक संख्या या `null`; या input `defaultValue` से अपनी खुद की रखता है) ऐप का होता है और `onChange` उस संख्या के साथ सुनता है जो फ़ील्ड पढ़ता है। फ़ील्ड एक संख्या या संख्या तक पहुँचता हुआ टेक्स्ट लेता है, दूसरे कीबोर्ड के अंक और चिह्न भी शामिल; बटन, Up / Down और Page Up / Page Down इसे `step` से स्टेप करते हैं, दशमलव बनाए रखते हुए, `min` और `max` तक, और फ़ील्ड छोड़ने पर टाइप की गई वैल्यू उनके भीतर रोक दी जाती है। फ़ील्ड स्क्रीन रीडर के लिए एक spin button है, जिसके increment और decrement उसे स्टेप करते हैं। देखें [NumberInput](../elements/number-input.md)।

### Slider

एक track पर चुनी गई एक वैल्यू, या दो की रेंज, बिना किसी लुक के: एक track जो प्रेस और ड्रैग लेता है, उसके अंदर indicator जिस पर वैल्यूज़ मैप होती हैं, रेंज और उस पर हर वैल्यू के लिए एक thumb। `value` (एक संख्या या `[start, end]`; या slider `defaultValue` से अपनी खुद की रखता है) ऐप का होता है और हर नई वैल्यू के लिए `onChange` सुनता है, जो `min` से शुरू होकर `step` पर snap होती है, और हर बदलाव पर एक बार `onChangeEnd`; `scale` वैल्यूज़ को रैखिक रूप से या परिमाण के क्रमों के अनुसार फैलाता है, `axis` track को क्षैतिज या ऊर्ध्वाधर बिछाता है। हर thumb स्क्रीन रीडर के लिए अपनी वैल्यू वाला एक adjustable element है, कीबोर्ड फ़ोकस का एक ठहराव है, और WAI-ARIA की slider कीज़ से चलता है। देखें [Slider](../elements/slider.md)।

### Scrollbar

किसी स्क्रॉल व्यू या सूची के लिए ऐप के अपने लुक वाला स्क्रॉल बार, जिसे ऐप जहाँ चाहे वहाँ रखता है, बिना किसी लुक के: एक track (बार का `class`) और उसमें एक thumb (`thumbClass`)। यह अपने स्क्रॉल व्यू को नाम से पहचानता है (`scroll`, उसका `ref`) और उसके offset, कंटेंट और viewport का अनुसरण करता है; thumb को ड्रैग करने से कंटेंट स्क्रॉल होता है, track पर प्रेस करने से thumb का मध्य वहाँ आ जाता है। `mode` इसे तब दिखाता है जब कंटेंट स्क्रॉल होता है (उसके बाद `motion.idle` तक), जब पॉइंटर बार के ऊपर हो, या हमेशा; `axis` इसे क्षैतिज बनाता है। `Scrollbar.setTheme` हर स्क्रॉल व्यू और सूची को उसके viewport के ऊपर ऐप के लुक वाला बार देता है, बिना कुछ रखे, और कोई व्यू अपनी खुद की थीम को अपने `scrollbar` prop के रूप में ले सकता है। देखें [Scrollbar](../elements/scrollbar.md)।

### ColorPicker

बिना किसी लुक वाला एक color picker: root रंग को रखता है और उसके अंदर के हिस्से उसे दिखाते और बदलते हैं, जिन्हें ऐप बिछाता है। `ColorArea` HSB की saturation और brightness है, `ColorSlider` RGB, HSL, HSB या OKLCH का कोई भी channel या alpha (क्षैतिज या ऊर्ध्वाधर), `ColorField` किसी भी CSS रूप में रंग या किसी channel की संख्या, `ColorSwatch` एक preset जिसे प्रेस चुनता है या रंग का एक preview, `ColorEyeDropper` स्क्रीन पर से रंग चुनने वाला एक बटन (macOS, web)। `value` ऐप का होता है (या picker `defaultValue` से अपना खुद का रखता है) और `onChange` तथा `onChangeEnd` को रंग और उसके उस टेक्स्ट के साथ सुनता है जैसा `format` लिखता है; picker हर space के channels को वैसे ही रखता है जैसे उपयोगकर्ता ने सेट किए। thumbs स्क्रीन रीडर के लिए adjustable elements और कीबोर्ड फ़ोकस के ठहराव हैं। देखें [ColorPicker](../elements/color-picker.md)।

### OtpInput

निश्चित लंबाई का एक संख्यात्मक वन-टाइम कोड, बिना किसी लुक के: cells के ऊपर एक नेटिव टेक्स्ट फ़ील्ड कीबोर्ड लेता है, इसलिए टाइपिंग, paste, नंबर पैड और सिस्टम का कोड autofill प्लेटफ़ॉर्म के होते हैं, और स्क्रीन रीडर एक टेक्स्ट फ़ील्ड पाते हैं। केवल अंक अंदर जाते हैं, `length` तक; Backspace आख़िरी अंक हटाता है। `value` ऐप का होता है (या वह `defaultValue` देता है) और `onChange` तथा `onComplete` सुनता है; वह cells को स्टाइल करता है (अगला अंक लेने वाले पर `focus:`, अंक रखने वालों पर `data-filled:`), उनके groups और caret को भी। देखें [OtpInput](../elements/otp-input.md)।

### Pagination

किसी सेट के पेज जिनके बीच जाया जाता है, बिना किसी लुक के एक navigation landmark: Previous, पहला और आख़िरी पेज, वर्तमान पेज अपने पड़ोसियों के साथ (`visiblePages`), हर छूटी हुई शृंखला के लिए एक ellipsis, ऐप के children और Next; `compact` Previous, children और Next को रखता है। `page` ऐप का होता है और `onChange({ page })` सुनता है; वर्तमान पेज `selected:` है और स्क्रीन रीडर के लिए current page है। ऐप आइटमों को स्टाइल करता है (`itemClass`) या उन्हें बनाता है (`renderItem`)। देखें [Pagination](../elements/pagination.md)।

### Command

एक command palette: ऐप के commands पर एक खोज फ़ील्ड (`items`: एक `id`, एक `label`, `keywords`, एक `group`, दिखाने के लिए एक `shortcut`, `disabled`, `checked`), जो उपयोगकर्ता के टाइप करते ही नेटिव रूप से फ़िल्टर होता है (label या कोई keyword क्वेरी रखता है, अक्षरों के केस की अनदेखी करते हुए; जिन सेक्शनों में कोई मेल नहीं होता वे हट जाते हैं), एक virtualized सूची में जो केवल दिखती पंक्तियाँ बनाती है। Up और Down हाइलाइट को हिलाते हैं, Return या प्रेस चुनाव करता है (`onSelect({ id })`), Escape क्वेरी साफ़ करता है और फिर `onCancel` रिपोर्ट करता है, जहाँ ऐप उसके चारों ओर के `Dialog` को बंद करता है। क्वेरी ऐप की होती है (`query`, `onQueryChange`) या फ़ील्ड की अपनी; `filterable={false}` और `loading` के साथ ऐप उसका उत्तर किसी सर्वर से देता है। ऐप हर हिस्से को स्टाइल करता है (हाइलाइट के लिए `focus:` के साथ `itemClass`, `checked:`, `disabled:`) और पंक्तियाँ बनाता है (`renderItem`, जिसे shortcut वैसे ही दिया जाता है जैसा यहाँ दिखाया गया है)। देखें [Command](../elements/command.md)।

### Tree

ऐसे आइटम जो आइटम रखते हैं: किसी प्रोजेक्ट की फ़ाइलें, सेटिंग्स का साइडबार, एक आउटलाइन। `items` डेटा है (`TreeItem`: एक `id`, एक `label`, `children`, `disabled`), और पंक्तियाँ virtualized हैं: केवल दिखती पंक्तियाँ बनती हैं, और सिमटे हुए आइटम के children कभी नहीं बनते, इसलिए हज़ारों आइटमों का ट्री भी तेज़ रहता है। expanded ids और चुना हुआ आइटम ऐप के होते हैं (`expanded`, `selected`, `onExpandedChange` और `onSelectedChange` के साथ) या ट्री अपने खुद के रखता है (`defaultExpanded`, `defaultSelected`)। एक प्रेस पंक्ति को चुनता है और फ़ोल्डर को फैलाता या समेटता है; ट्री कीबोर्ड फ़ोकस का एक ठहराव है जिसकी ऐरो कीज़ चयन को हिलाती हैं (Right और Left फैलाती, समेटती हैं, फ़ोल्डर में जाती और उससे निकलती हैं), साथ में Home, End, Return, Space और typeahead। ऐप पंक्तियों को स्टाइल करता है (`selected:`, `aria-expanded:`, `focus:` के साथ `itemClass`) और उन्हें बनाता है (`renderItem`, जिसे हर आइटम का `depth` दिया जाता है)। देखें [Tree](../elements/tree.md)।
### Plot (`nsh/base/plot`)

चार्ट जिन हिस्सों से बनते हैं, वे `gpui-base` के `plot` की तरह, अपने अलग मॉड्यूल में हैं: `import { Plot, Line, Area, Bar,
Grid, Pie, Arc, Sankey, Treemap } from "nsh/base/plot"`. A `Plot` holds the app's rows (`data`, generic over their type, so `x` and `y`
पंक्ति की चेक की गई कुंजियाँ या फ़ंक्शन हैं), इसके अक्षों के `point`, `linear` या `band` स्केल, पॉइंटर के नीचे की पंक्ति
(`onHoverChange`) और इसकी गति (`motion`: प्रकट होना, होवर का फ़ेड और ग्लाइड); इसके मार्क पंक्तियों से नेटिव रूप में बनते हैं,
प्रति पॉइंट कोई JS नहीं, और SVG पेंट प्रॉपर्टी (`stroke-*`, `fill-*`) से रंगे जाते हैं, जहाँ कोई सेट नहीं है वहाँ `currentColor`। `Area` या `Bar` अपनी आकृतियों के भीतर एक बैकग्राउंड (ग्रेडिएंट, `bg-linear-*`) दिखाता है। बार `band` स्केल के बैंड में खड़े होते हैं, अगल-बगल या `stack` में एक के ऊपर एक, प्लॉट के प्रकट होने पर बढ़ते हुए आते हैं और पॉइंटर के नीचे की पंक्ति से दूर फ़ेड हो जाते हैं, हर बार के सिरे पर एक `label` हिस्सा होता है। होवर की क्रॉस लाइन, डॉट (`hoverDotClass` के साथ हर मार्क का अपना) और टूलटिप (`tooltipPlacement`, प्लॉट के भीतर रखा गया) ऐसे हिस्से हैं जिन्हें ऐप स्टाइल करता और भरता है, और जो नेटिव रूप में चलते हैं; अक्ष के लेबल ऐप के अपने एलिमेंट हैं। `Pie` पूरे घेरे को प्रति पंक्ति एक स्लाइस में बाँटता है (`innerRadius` वाला डोनट), हर एक अपनी क्लासेज़ (`sliceClass`, उसकी पंक्ति का एक फ़ंक्शन) से रंगा जाता है, और `Arc` दो कोणों के बीच एक सेक्टर बनाता है (गेज का ट्रैक और वैल्यू); पाई के ऊपर प्लॉट पॉइंटर के नीचे वाले स्लाइस की सूचना देता है, जो ऊपर उठता है
(`hoverLift`) जबकि बाकी फ़ेड हो जाते हैं (`hoverDim`)। `Sankey` पंक्तियों के बीच फ़्लो बनाता है (`links`), जिन्हें d3-sankey जिस तरह लेआउट करता है उसी तरह रखा जाता है, हर नोड और रिबन अपनी क्लासेज़ से रंगा जाता है, इसके नोड लेबल वाले होते हैं, होवर होते हैं और नए फ़्लो की ओर बढ़ते हैं। `Treemap` पंक्तियों को नेस्टेड आयतों के पदानुक्रम के रूप में टाइल करता है (`id`, `parent`), हर लीफ़ का क्षेत्रफल उसका `value` होता है, श्रेणी के अनुसार या प्लॉट के
`colorScale` की रैम्प के साथ रंगा जाता है, और इसके लेबल वहाँ दिखते हैं जहाँ वे समा सकें। देखें [Plot](../elements/plot.md)।

## Workspaces

### ResizablePanelGroup and ResizablePanel

पैनल अगल-बगल या एक के ऊपर एक, हर दो के बीच एक हैंडल के साथ, जिसे उपयोगकर्ता जगह बाँटने के लिए खींचता है। ग्रुप ड्रैग का मालिक है, जो नेटिव रूप में चलता है, साथ ही हर पैनल की सीमाओं (`minSize`, `maxSize`) और रीसाइज़ कर्सर का भी; साइज़ ऐप के हैं (`size`, `onResize` के साथ रिपोर्ट किए जाते हैं), और हैंडल का रूप और पैनल की सामग्री भी ऐप की है। देखें
[Resizable](../elements/resizable.md)।

### DockArea

एक डॉक करने योग्य वर्कस्पेस: टैब ग्रुप में पैनल, अगल-बगल या एक के ऊपर एक बँटे ग्रुप, और बाएँ, दाएँ तथा नीचे के किनारों पर डॉक। लेआउट वह डेटा है जिसका मालिक ऐप है (`layout`, `onLayoutChange` के साथ रिपोर्ट किया जाता है); एरिया टैब के ड्रैग और ड्रॉप, रीसाइज़िंग, डॉक, ज़ूम और लॉक का मालिक है, पैनल के हिलने पर हर पैनल की सामग्री को बनाए रखता है, और जगह कम होने पर उसी लेआउट को ड्रॉअर और बॉटम शीट के साथ प्रस्तुत करता है। टैब, हैंडल, ड्रॉप इंडिकेटर और पैनल की सामग्री ऐप की हैं। देखें [Dock](../elements/dock.md)।

## Documents

### TextView

`TextView` Markdown, HTML या ऐप द्वारा बनाए गए ब्लॉक का दस्तावेज़ दिखाता है, जिसे [`Text`](../elements/text.md)
एलिमेंट और व्यू से बनाया जाता है: हेडिंग, सूचियाँ, कोड, टेबल, इमेज, सूत्र, फ़ुटनोट और ऐप का अपना सिंटैक्स। यह स्ट्रीम होकर आने वाले
AI चैट जवाबों के लिए बना है, जिसमें थीम के रंगों में पढ़ने की टाइपोग्राफ़ी है जिसे ऐप हिस्सा-दर-हिस्सा री-स्टाइल करता है, और रेंडर फ़ंक्शन हैं जो ऐप की सामग्री को सही जगह रखते हैं। देखें [TextView](../elements/text-view.md)।

## Code

### Editor

`Editor` पचास से अधिक भाषाओं के लिए एक कोड एडिटर है: सिंटैक्स हाइलाइटिंग, लाइन नंबर, एक से अधिक कैरेट, फ़ोल्डिंग,
सॉफ़्ट रैप, खोजें और बदलें, डायग्नोस्टिक और डेकोरेशन, कोड एडिटरों की कुंजियों के साथ। टेक्स्ट ऐप का है
(`value` और `onChange`), और फ़ाइंड बार भी, जो एडिटर के `search` को चलाता है। यह थीम के टोकन से बने रूप के साथ आता है
जिसे ऐप हिस्सा-दर-हिस्सा री-स्टाइल करता है। देखें [Editor](../elements/editor.md)।

### DiffView

`DiffView` दो टेक्स्ट के बीच के बदलाव, या किसी पैच की फ़ाइलों के बदलाव दिखाता है, जैसा कोड रिव्यू टूल करते हैं: अगल-बगल या
एकीकृत, पंक्तियों के भीतर बदले गए शब्द हाइलाइट किए हुए, अपरिवर्तित पंक्तियाँ ऐसे सेपरेटरों में समेटी हुई जो फैल सकते हैं, `Editor`
के सिंटैक्स रंगों में। ऐप की क्रियाएँ हर बदलाव को रखती या पलटती हैं। देखें [DiffView](../elements/diff-view.md)।

### Table

`Table` और इसके हिस्से ऐप द्वारा चिल्ड्रन के रूप में लिखी गई कुछ पंक्तियों को लेआउट करते हैं, और स्क्रीन रीडर को एक टेबल देते हैं: पंक्तियों के ग्रुप,
पंक्तियाँ, कॉलम हेडर और सेल। हर हिस्सा ऐप का रूप लेता है। देखें [Table](../elements/table.md)।

### DataTable

`DataTable` पंक्तियाँ और कॉलम दिखाता है और दोनों दिशाओं में स्क्रॉल होता है, चाहे दोनों में से कितने भी हों, और केवल दिखने वाले सेल बनाता है। पंक्तियाँ,
कॉलम या सेल चुने जाते हैं; कॉलम रीसाइज़ होते हैं, हिलते हैं, स्थिर रहते हैं और सॉर्ट होते हैं (सॉर्ट ऐप करता है); ऐप पंक्तियाँ एक बार में एक पेज के रूप में देता है
और सेल तथा शीर्षक बना सकता है। देखें [DataTable](../elements/data-table.md)।

## Navigation

`NavPage` का एक `NavStack` iOS पर `UINavigationController` है और Android पर टूलबार तथा प्रेडिक्टिव बैक वाला स्टैक; डेस्कटॉप और वेब पर हर पेज ऐप का अपना `header` दिखाता है। देखें
[NavStack](../elements/nav-stack.md), जिसमें `createNavStack` और किसी पेज को छोड़ना भी शामिल है।

### Dialog

`Dialog` सामग्री को बाकी सब कुछ के ऊपर, स्टैक के हेडर सहित, अपनी नेटिव विंडो लेयर में प्रस्तुत करता है। इसका
पॉपअप और बैकड्रॉप ऐप द्वारा स्टाइल किए जाते हैं। देखें [Dialog](../elements/dialog.md)।

## Alert dialogs

### AlertDialog

`AlertDialog.show(options)` प्लैटफ़ॉर्म का अपना अलर्ट या एक्शन शीट दिखाता है और `{ action }` के साथ रिज़ॉल्व होता है, जो उपयोगकर्ता द्वारा चुनी गई क्रिया का `id`
है। देखें [AlertDialog](../elements/alert-dialog.md)।

## Input

`Input` प्लैटफ़ॉर्म का नेटिव टेक्स्ट इनपुट है: एक सिंगल-लाइन या मल्टीलाइन फ़ील्ड जिसकी टाइपिंग, कैरेट, चयन,
ऑटोकरेक्शन और ऑटोफ़िल प्लैटफ़ॉर्म संभालता है। इसकी वैल्यू और रूप ऐप के हैं। इसके props टाइप `InputProps` हैं (`ios={{…}}` के लिए `IOSInputProps` के साथ), जो इसके साथ एक्सपोर्ट किए जाते हैं। देखें [Input](../elements/input.md)।

## Status bar

स्टेटस बार उसका होता है जो स्क्रीन पर है, जैसा UIKit में, जहाँ हर व्यू कंट्रोलर अपना
`preferredStatusBarStyle` घोषित करता है और सबसे ऊपर वाला तय करता है। NSH में पेज और डायलॉग वही व्यू कंट्रोलर हैं: एक
`NavPage` या एक `Dialog` `statusBar` से वह स्टेटस बार घोषित करता है जो वह चाहता है, और ऐप अपना डिफ़ॉल्ट
`nsh.json` में घोषित करता है।

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

`statusBar` ये फ़ील्ड लेता है, हर एक वैकल्पिक (Rust में, अकेला `StatusBarStyle`, या उन्हीं नामों वाले `StatusBarSetting` के बिल्डर
मेथड):

| फ़ील्ड | टाइप | विवरण |
|---|---|---|
| `foreground` | `"auto" \| "light" \| "dark"` (Rust: `StatusBarStyle::Default`, `Light`, `Dark`) | सामग्री (समय, बैटरी, सिग्नल) का रंग: गहरे बैकग्राउंड के लिए `"light"`, हल्के बैकग्राउंड के लिए `"dark"`, `"auto"` मौजूदा अपीयरेंस के लिए प्लैटफ़ॉर्म का। |
| `hidden` | `boolean` | स्टेटस बार को छिपाता है। |
| `animated` | `boolean` | पेज या डायलॉग के आने और जाने पर बदलाव को एनिमेट करता है। |

वैल्यू रिएक्टिव है: `statusBar={{ foreground: dark() ? "light" : "dark" }}` सिग्नल का अनुसरण करता है, वैसे ही जैसे वह Rust
क्लोज़र करता है जो किसी सिग्नल को पढ़ता है।

### Which one applies

**सबसे हाल में** दिखाया गया पेज या डायलॉग **फ़ील्ड-दर-फ़ील्ड** तय करता है: स्टैक पर पुश किया गया पेज नीचे के पेजों के ऊपर होता है, और खुला डायलॉग पेजों के ऊपर होता है। जो फ़ील्ड वह छोड़ देता है वह उसके नीचे वाले से आता है, और अंत में
ऐप के डिफ़ॉल्ट से। जब पेज पॉप होता है या डायलॉग बंद होता है, तो उसके नीचे वाला फिर से लागू होता है।

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

`nsh.json` का `"statusBar"` हर पेज और डायलॉग के नीचे की सेटिंग है, जैसे UIKit ऐप में Info.plist का `UIStatusBarStyle` और
`UIStatusBarHidden` होते हैं:

```json
{
  "statusBar": { "foreground": "light", "hidden": false }
}
```

दोनों फ़ील्ड वैकल्पिक हैं। इसके बिना सामग्री `"auto"` होती है और बार दिखता है। पैकेज किए गए iOS ऐप इसे
लॉन्च स्क्रीन पर भी दिखाते हैं।

### The status bar on each platform

- **iOS**: छिपना और दिखना फ़ेड के साथ एनिमेट होता है। किसी नेटिव ऐप में [एम्बेड किए गए](../docs/ios.md) ऐप में,
  होस्ट ऐप का व्यू कंट्रोलर तय करता है कि स्टेटस बार कैसा दिखे। होस्ट अपने व्यू कंट्रोलर से
  `NshAppView.preferredStatusBarStyle`, `NshAppView.prefersStatusBarHidden` और
  `NshAppView.preferredStatusBarUpdateAnimation` लौटाकर NSH की सेटिंग लागू करता है।
- **Android**: ऐप किनारे से किनारे तक, स्टेटस बार के पीछे बनते हैं (Android 15, API 35): ऐप का अपना बैकग्राउंड
  बार का बैकग्राउंड है, और `foreground` उस पर सामग्री को पढ़ने योग्य रखता है।
- **डेस्कटॉप और वेब**: विंडो का टाइटल बार और ब्राउज़र के बार सिस्टम और ब्राउज़र के हैं;
  `statusBar` और `nsh.json` का `"statusBar"` फ़ोन के लिए हैं।

> [!IMPORTANT]
> जब आपका `nsh.json` `"capabilities"` घोषित करता है, तो स्टेटस बार तभी बदलता है जब उनमें
> `"statusBar": true` शामिल हो; अन्य बदलाव अस्वीकार कर दिए जाते हैं और लॉग किए जाते हैं। देखें
> [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)।

```json
{
  "capabilities": {
    "statusBar": true
  }
}
```

## Related

- [Navigation guide](../docs/navigation.md)।
- [Forms and keyboard](../docs/forms-and-keyboard.md)।
- [Avatar](../elements/avatar.md), [Button](../elements/button.md), [Carousel](../elements/carousel.md), [Link](../elements/link.md), [Checkbox](../elements/checkbox.md), [Radio](../elements/radio.md), [Switch](../elements/switch.md), [Tabs](../elements/tabs.md), [Toggle](../elements/toggle.md), [Toolbar](../elements/toolbar.md), [Select](../elements/select.md), [Combobox](../elements/combobox.md), [Command](../elements/command.md), [Calendar](../elements/calendar.md), [TimeField](../elements/time-field.md), [DatePicker](../elements/date-picker.md), [Collapsible](../elements/collapsible.md), [HoverCard](../elements/hover-card.md), [Accordion](../elements/accordion.md), [Progress](../elements/progress.md), [Slider](../elements/slider.md), [ColorPicker](../elements/color-picker.md), [Scrollbar](../elements/scrollbar.md), [NumberInput](../elements/number-input.md), [OtpInput](../elements/otp-input.md), [Pagination](../elements/pagination.md), [Tree](../elements/tree.md), [Plot](../elements/plot.md), [NavStack](../elements/nav-stack.md), [Dialog](../elements/dialog.md), [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md), [Text](../elements/text.md) और [Input](../elements/input.md)।
  [AlertDialog](../elements/alert-dialog.md), [TextView](../elements/text-view.md), [Editor](../elements/editor.md), [DiffView](../elements/diff-view.md), [Table](../elements/table.md), [DataTable](../elements/data-table.md),
  [Text](../elements/text.md) और
  [Input](../elements/input.md)।
- [Device and environment](../docs/device-and-environment.md)।
- [`BackHandler`](./nsh-mobile.md#backhandler): `BackHandler` और अन्य केवल-Android API।
