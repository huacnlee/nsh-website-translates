---
title: "العناصر"
description: "العناصر الأساسية والمكونات القاعدية التي يُبنى منها كل تطبيق NSH، بلغتي Rust وTSX، إضافةً إلى الخصائص (props) والأحداث والدوال المرجعية (ref methods) التي تشترك فيها جميعًا."
order: 1
source_hash: 84e4cb96ec250ab2
---

# العناصر

يبني Native Shell كل شاشة من مجموعة صغيرة من العناصر: عناصر أولية (primitives) مثل `View` و`Text` و`Image`، ومكوّنات أساسية (base components) مثل `Button` و`Dialog` و`NavStack`. كل عنصر أولي هو عرض أصلي (native view): صنف فرعي من UIView على iOS وMac Catalyst، أو `View` على Android، أو عرض AppKit أو GTK أو Win32 على أنظمة سطح المكتب، وينشئه بيئة تشغيل NSH ويتولى تخطيطه. كل ما يعرضه التطبيق مصنوع منها: أزرار التطبيق وبطاقاته وصفوفه وشاشاته هي مكوّنات خاصة به، تُرسم بهذه العناصر ويُنسّقها التطبيق، فيكون مظهره من صنعه بالكامل.

كل مثال في هذه الصفحات متاح بلغتي Rust وTSX: اختر تبويبًا، وستتبعه جميع الأمثلة في الصفحة.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

في Rust، العناصر الأولية هي دوال من `nsh_core::prelude` (`view()` و`text(..)` و`image(..)`)، وتأتي المكوّنات الأساسية من الحزمة `nsh_base`. الأنماط هي دوال مكتوبة الأنواع (`.flex_1()` و`.gap_3()` و`.px(px(20.0))` و`.bg(..)`)، وأنماط الحالات تأخذ closure ‏(`.active(|s| s.opacity(0.6))`)، والمستمعات هي closures تستقبل حدثها (`.on_press(move || ..)` و`.on_change(move |text: &str| ..)`)، وتضيف `.child(..)` العناصر الأبناء. قطعة الواجهة هي دالة عادية تعيد `impl IntoElement`؛ تُنفَّذ مرة واحدة، وتحدّث الإشارات (signals) التي تقرؤها داخل closures ‏(`text(move || ..)` و`.bg(move || ..)`) ما ترتبط به. راجع [البناء باستخدام Rust](../docs/rust.md).

في TSX، كل وسم مكتوب بنمط PascalCase ويسمّي ارتباطًا (binding) موجودًا في النطاق: تأتي العناصر الأولية من `nsh` والمكوّنات الأساسية من `nsh/base`. `<If>` و`<Each>` فقط عنصران عامّان لا يحتاجان إلى استيراد. الوسم بأحرف صغيرة مثل `<view>` يسبب خطأ في البناء، لأن TypeScript كان سيفحصه مقابل نوع عام واحد لكل اسم، ولن تتمكن المكوّنات العامة (generic) مثل `List` و`Each` من استنتاج أنواع عناصرها. يتعرف المترجم على العناصر من خلال عمليات الاستيراد وينشئ العروض الأصلية في موضعها، لذلك لا يكلّف استيرادها شيئًا وقت التشغيل. راجع [JSX والمكوّنات](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## العناصر الأولية

تُستورد من `nsh` في TSX، ومن `nsh_core::prelude` في Rust.

| العنصر | Rust | العرض الأصلي (iOS / Android) | الصفحة |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup؛ ومع `selectable` تُحدَّد النصوص بداخله معًا | [View](./view.md)، [تحديد النص](./text-selection.md) |
| `<Text>` | `text(content)` | عرض CoreText / عرض StaticLayout | [Text](./text.md) |
| `<Image>` | `image(src)` | عرض بطبقة صورة / عرض صورة | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView مع خلايا معاد تدويرها | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | عرض يعيد تشغيل رسم ثنائي الأبعاد | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | عرض يرسم برنامج WGSL مربعه على GPU، أسفل عناصره الأبناء | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`، `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer على TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | عرض فوق النافذة (أو الحوار الموجود فيه)، يوضع بالنسبة إلى نقطة ارتكاز | [Overlay](./overlay.md) |
| `<If>`، `<Each>` | `when(..)`، `each(..)`، `dynamic(..)` | تدفق التحكم: العناصر التي يختارانها | [تدفق التحكم](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | شريط فوق لوحة المفاتيح على iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

يُبقي الحشو (padding) والهامش (margin) المحتوى بعيدًا عن واجهة النظام باستخدام `env()` من CSS: `env(safe-area-inset-top)` وبقية الحواف ([المنطقة الآمنة](./safe-area.md)) و`env(keyboard-inset-height)` ([لوحة المفاتيح](./keyboard.md)).

<a id="base"></a>

## الأساسية

تُستورد من `nsh/base` في TSX، ومن الحزمة `nsh_base` في Rust. تمتلك هذه المكوّنات السلوك والحالة والتركيز وإمكانية الوصول، ويأتي مظهرها من التطبيق.

| المكوّن | Rust | وظيفته | الصفحة |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | تنبيه النظام وورقة الإجراءات (action sheet) | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` وأجزاؤه | `nsh_base::accordion()`، `accordion_item()`، ... | أقسام متراصة تتوسع وتنطوي تحت عناوينها، قسم واحد في كل مرة أو عدة أقسام | [Accordion](./accordion.md) |
| `<Avatar>`، `<AvatarGroup>` | `nsh_base::avatar()`، `avatar_group()` | صورة شخص، أو بديل عنها أثناء التحميل أو عند الفشل، وصف منها يعرض الأولى فقط | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | عنصر تحكم قابل للضغط بحالاته ودوره | [Button](./button.md) |
| `<Carousel>` وأجزاؤه | `nsh_base::carousel()`، `carousel_content()`، ... | شرائح تُعرض واحدة في كل مرة، تُمرَّر أصليًا، مع السابق / التالي وترقيم الصفحات ومفاتيح لوحة المفاتيح وتكرار سلس | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | عنصر تحكم محدد أو غير محدد أو غير حاسم، مع مؤشر | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | منطقة يتوسع محتواها وينطوي | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | لوحة أوامر: حقل بحث فوق أوامر تُصفّى أصليًا، وقائمة افتراضية (virtualized)، ومفاتيح لوحة Cmd+K | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | جدول بأي عدد من الصفوف والأعمدة، قابل للتحديد والفرز، مع أعمدة يمكن تغيير حجمها ونقلها | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | يعرض عناصره الأبناء فوق كل شيء آخر | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | الفروق بين نصين أو ضمن تصحيح (patch)، بعرض مقسّم أو موحّد | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | مساحة عمل من أقسام ومجموعات تبويبات ولوحات مثبّتة على الحواف يرتبها المستخدم | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | محرر شيفرة مع تمييز الصياغة وعدة مؤشرات إدخال وطيّ وبحث | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | معاينة لما يشير إليه المشغّل (trigger)، بينما يستقر المؤشر عليه | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | حقل إدخال النص الأصلي (UITextField أو UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | هدف ضغط يفتح صفحة أو موقعًا أو مسارًا في التطبيق | [Link](./link.md) |
| `<Menu>`، `<ContextMenu>`، `<MenuItem>`، `<MenuSeparator>`، `<Submenu>` | `nsh_base::menu()`، ... | القوائم: نوافذ منبثقة بقوائم فرعية متتالية على أنظمة سطح المكتب، وأوراق (sheets) على الهواتف | [Menu](./menu.md) |
| `<NavStack>`، `<NavPage>` | `nsh_base::nav_stack()`، `nsh_base::nav_page()` | تنقّل أصلي: مكدّس من الصفحات مع ترويسة المنصة وإيماءات الرجوع | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | رقم يُكتب في حقل أو يُزاد وينقص بالأزرار والمفاتيح | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | رمز لمرة واحدة بعدد ثابت من الأرقام، يُكتب أو يُلصق أو يُملأ تلقائيًا في خلايا | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | صفحات مجموعة: السابق، والصفحات المحيطة بالحالية، وعلامات الحذف، والتالي | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | عناصر تحتوي عناصر، موسّعة ومطوية، يُحدَّد منها واحد: افتراضية (virtualized) وتشكّل محطة واحدة في تركيز لوحة المفاتيح | [Tree](./tree.md) |
| `<Plot>`، `<Line>`، `<Area>`، `<Bar>`، `<Grid>`، `<Pie>`، `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | إطار مخطط ورموزه البيانية، تُرسم أصليًا من صفوف التطبيق | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | محتوى مرتبط بمشغّل (trigger)، فوق كل شيء | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | شريط تقدم: مدى تقدم مهمة، أو أنها قيد التنفيذ | [Progress](./progress.md) |
| `<Radio>`، `<RadioGroup>` | `nsh_base::radio()`، `radio_group()` | خيار واحد من مجموعة يختار المستخدم منها واحدًا، والمجموعة نفسها | [Radio](./radio.md) |
| `<ResizablePanelGroup>`، `<ResizablePanel>` | `nsh_base::h_resizable()`، `resizable_panel()` | لوحات متجاورة أو متراصة، مع مقابض لتغيير حجمها | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | شريط تمرير بمظهر خاص بالتطبيق لعرض تمرير أو قائمة | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | قيمة واحدة تُختار من قائمة عناصر، مع لوحة المفاتيح والبحث والأقسام | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | لوحة عند حافة الشاشة فوق خلفية معتمة | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | قيمة، أو مدى من قيمتين، تُختار على امتداد مسار | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | عنصر تحكم تشغيل / إيقاف بمسار ومقبض | [Switch](./switch.md) |
| `<Table>` وأجزاؤه | `nsh_base::table()`، `table_row()`، ... | جدول من صفوف وخلايا التطبيق نفسه، مع أدوار الجدول | [Table](./table.md) |
| `<Tab>`، `<Tabs>` | `nsh_base::tab()`، `tabs()` | تبويب واحد من قائمة تبويبات، والقائمة نفسها | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | يعرض مستند Markdown أو HTML بنصوص وعروض | [TextView](./text-view.md) |
| `<Toast>`، `<ToastStack>` | `nsh_base::toast()`، `toast_stack()` | الجذر الدلالي لإشعار منبثق (toast)؛ إشعارات تُرتَّب كطبقات انطلاقًا من حافة | [Toast](./toast.md) |
| `<Toggle>`، `<ToggleGroup>` | `nsh_base::toggle()`، `toggle_group()` | زر يكون في حالة تشغيل أو إيقاف، وشريط أدوات منها | [Toggle](./toggle.md) |
| `<Toolbar>`، `<ToolbarGroup>`، `<ToolbarSeparator>` | `nsh_base::toolbar()`، `toolbar_group()`، `toolbar_separator()` | شريط من الأزرار وأزرار التبديل والروابط، ومحطة واحدة في تركيز لوحة المفاتيح | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | تلميح بجوار مشغّله (trigger)، عند تمرير المؤشر أو إبقاء الإصبع مضغوطًا | [Tooltip](./tooltip.md) |

> [!NOTE]
> لا تُرسم السلسلة النصية إلا داخل `Text`. السلسلة النصية الابنة لـ `View` لا تنشئ عرضًا أصليًا ولا تشارك في التخطيط.

<a id="common-props"></a>

## الخصائص المشتركة

يقبل كل عنصر أولي الخصائص التالية (النوع `CommonProps` في TSX؛ والسمات `Styled` و`Interactive` و`Accessible` في Rust). تسرد صفحات العناصر خصائصها الخاصة فقط. يذكر عمود Rust اسم دالة البناء.

<a id="styling"></a>

### التنسيق

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `style` | دوال `Styled` مكتوبة الأنواع؛ `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` لـ `<Text>` و`<Input>`، `ImageStyle` لـ `<Image>`) | نمط مضمّن، أو مصفوفة أنماط تُدمج من اليسار إلى اليمين (تُتجاهل القيم الخاطئة falsy؛ ويمكن تداخل المصفوفات، لذا يقبل `style={[base, props.style]}` قيمة `props.style` هي نفسها مصفوفة). له الأولوية على `class`. راجع [مرجع الأنماط](../modules/style-reference.md). |
| `class` | دوال `Styled` مكتوبة الأنواع (`.flex_row().gap_2().p_4()`) | `string` | أصناف Tailwind، تُحلّ أصليًا (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). الأصناف اللاحقة لها الأولوية على السابقة. راجع [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | أصناف تُطبَّق ما دامت قيمتها صحيحة (truthy) (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | يتجاهل الضغطات (دون أي استجابة بصرية للضغط أيضًا)، ويطبّق أنماط `disabled:`، ويعطّل عناصر التحكم مثل حقول الإدخال، وتعلن قارئات الشاشة أنه معطّل (`accessibilityState.disabled`). |

<a id="presses-and-feedback"></a>

### الضغطات والاستجابة

تجري معالجة الضغط أصليًا: تتعرف المنصة على الضغطة وتطبّق أنماط الضغط الخاصة بالتطبيق، ولا تعلم شيفرة التطبيق بها إلا بعد ذلك. لا يستجيب إلا أعمق عرض قابل للضغط؛ وداخل عروض التمرير ينتظر بدء الضغط (press-in) نحو 130 ms ليتمكن التمرير من البدء أولًا.

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | انتهت نقرة داخل العرض. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | بقي الإصبع مضغوطًا مدة `delayLongPress`. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | لمس إصبع العرض. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | رُفع الإصبع أو غادر العرض. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | الميلي ثانية قبل أن تصبح الضغطة ضغطة مطوّلة. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | يوسّع منطقة اللمس خارج الحدود، بالنقاط (points). |

`PressEvent` هو `{ position, pagePosition, modifiers, clickCount }`: موضع المؤشر داخل العرض وداخل عرضه الجذر (`Point`)، ومفاتيح التعديل المضغوطة عند بدء الضغطة، وعدد النقرات المتتابعة (2 للنقر المزدوج). وعندما لا تُبلغ المنصة عن مؤشر، فهو نقطة أصل العرض دون مفاتيح ونقرة واحدة.

مفتاح النمط `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` في Rust، والأصناف `pointer-events-*`) يحدد أي اللمسات يستقبلها العرض والعروض الموجودة بداخله: `"none"` لا هذا ولا تلك (ويستعيدها أي عرض بداخله يضبط `"auto"`)، `"box-none"` العروض الموجودة بداخله فقط، `"box-only"` العرض نفسه فقط ([اللمس والإيماءات](../docs/touch-and-gestures.md#pointerevents)).

استجابة الضغط من شأن التطبيق: يُطبَّق `activeStyle` (أو أصناف `active:`، أو `.active(..)` في Rust) أصليًا ما دام العرض مضغوطًا، دون أي ذهاب وإياب إلى شيفرة التطبيق (انظر أدناه).

<a id="state-styles"></a>

### أنماط الحالات

أنماط تُطبَّق ما دام العرض في حالة معينة، فوق أنماطه الخاصة، وتتم أصليًا. كل منها هو الصيغة الكائنية لمتغيّر (variant) في Tailwind. الحالات اللاحقة لها الأولوية (selected وchecked وindeterminate، ثم hover وfocus وactive)؛ ولـ `disabledStyle` الأولوية على الجميع، ولا تُطبَّق الحالات الأخرى ما دام العرض معطّلًا. يأخذ كل منها نمط العنصر نفسه: `TextStyle` على `<Text>`، و`InputStyle` على `<Input>`، و`ImageStyle` على `<Image>`، و`ViewStyle` في غير ذلك.

| الخاصية | Rust | متغيّر الصنف | يُطبَّق |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | أثناء الضغط. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | ما دام مؤشر فوق العرض. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | ما دام التركيز على العرض. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | ما دام التركيز على العرض أو على عرض بداخله (يُعدّ محتوى `Overlay` داخل العرض الذي يوجد فيه). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | ما دام `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`، `.checked_style(style)` | `checked:` | ما دامت `accessibilityState.checked` تساوي `true` (مربع اختيار، أو مفتاح تبديل، أو زر راديو؛ `"mixed"` ليس محددًا). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`، `.indeterminate_style(style)` | `indeterminate:` | ما دامت `accessibilityState.checked` تساوي `"mixed"` (مربع اختيار ليس محددًا ولا غير محدد). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | ما دامت `accessibilityState.selected` تساوي `true` (`Button` محدد، أو تبويب). |
| `expandedStyle` | `.expanded(\|s\| ..)`، `.expanded_style(style)` | `aria-expanded:` | ما دامت `accessibilityState.expanded` تساوي `true` (مشغّل `Popover` أو `Menu` ما دامت نافذته المنبثقة مفتوحة). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`، `.pressed_style(style)` | `aria-pressed:` | ما دامت `accessibilityState.pressed` تساوي `true` (زر تبديل في حالة التشغيل؛ `"mixed"` ليس مضغوطًا). وليس `activeStyle`، أي ضغطة جارية. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
<a id="hover"></a>

### التحويم (Hover)

يسمع التطبيق دخول الفأرة إلى عنصر عرض (view) وحركتها فوقه ومغادرتها له: على macOS وWindows وLinux وواجهة GPUI الخلفية ومتصفحات سطح المكتب، وبمؤشر iPad أو فأرة Mac على iOS، وبفأرة أو قلم على Android. أنماط التحويم (`hover:`، `.hover(..)`) تنسّق العناصر المحوَّم فوقها في الأماكن نفسها.

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | دخلت الفأرة إلى العنصر أو إلى عنصر بداخله (يقابل `mouseenter` في DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | تحركت الفأرة فوق العنصر (أو فوق عنصر بداخله)، سواء كان هناك زر مضغوط أم لا، أو ضُغط مفتاح تعديل أو حُرر بينما تستقر الفأرة فوقه دون زر مضغوط (يقابل `mousemove` في DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | غادرت الفأرة العنصر والعناصر التي بداخله، أو النافذة؛ `e` هو آخر موضع لها (يقابل `mouseleave` في DOM). |

مثل `:hover` في CSS و`mouseenter` في DOM، يُعدّ العنصر محوَّمًا فوقه ما دامت الفأرة فوقه أو فوق أي شيء بداخله، لذا تسمع العناصر المحيطة بالعنصر الذي تحت الفأرة `onMouseEnter` أيضًا (من الخارج إلى الداخل؛ `onMouseLeave` من الداخل إلى الخارج). تصل الأحداث بعد وقوع الفعل ولا تصل أبدًا عند اللمس. العنصر الذي يُزال من تحت الفأرة يسمع `onMouseLeave`، وذلك على Linux وWindows عند حركة الفأرة التالية.

يبيّن `MouseEvent` موضع الفأرة، كما يفعل `MouseMoveEvent` في GPUI: `position` داخل العنصر (`Point` بالنقاط، مع التراجع عن تحويلاته)، و`pagePosition` داخل العنصر الجذر الذي يوجد فيه، كما تعطيه اللمسات، و`modifiers` المضغوطة (`control`، `alt`، `shift`، `platform`: Command على منصات Apple، ومفتاح Windows في غيرها)، و`pressedButton`، الزر المضغوط (`"left"`، `"right"`، `"middle"`، `"back"` أو `"forward"`، وهو `MouseButton` في GPUI) أو `null`؛ وفي Rust `position`، `page_position`، `modifiers` و`pressed_button`. على أنظمة سطح المكتب والويب يُعدّ السحب لمسة أيضًا (`onTouchMove`، المستجيب)، وتصل حركاته إلى `onMouseMove` مع ضبط `pressedButton`: التغذية الراجعة التي تتبع التحويم فقط تتجاهلها؛ وعلى iOS وAndroid يبلّغ التحويم عن المؤشر دون زر مضغوط. تصل الحركات مرة واحدة في الإطار كحد أقصى، وهي الأحدث، وتصل دائمًا قبل `onMouseLeave` الذي يليها، لذا يمكن للمعالج إعادة الرسم عند كل حركة:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

<a id="tooltips"></a>

### التلميحات (Tooltips)

يمنح `tooltip` أي عنصر تلميحًا، يظهر فوقه على أنظمة سطح المكتب (macOS وWindows وLinux وواجهة GPUI الخلفية ومتصفحات سطح المكتب) بعد أن يستقر المؤشر عليه نصف ثانية، ويبقى حتى يغادره المؤشر أو يضغطه. لا تعرض الهواتف واللوحيات أي تلميح. لا يلتقط التلميح المؤشر ولا الضغطات أبدًا، فيعمل العنصر تمامًا كما يعمل بدونه.

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | التلميح، وهو عنصر ينسّقه التطبيق: [`Tooltip`](tooltip.md) من نوع `nsh/base` هو التلميح نفسه، مع موضعه وتأخيره وأحداثه؛ وأي عنصر آخر يُعرض كما هو. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

يحدد `Tooltip` مظهره وموضعه وتأخيره وأحداثه بنفسه، كما يفعل `.tooltip(..)` في GPUI. التطبيق الذي فيه تلميحات كثيرة يحتفظ بمكوّن صغير خاص به يلفّ نصًا في `Tooltip`.

<a id="context-menus"></a>

### قوائم السياق (Context menus)

يخبر `onContextMenu` العنصر بأن الزر الثانوي ضُغط فوقه: نقرة يمين، أو Control-click على macOS، أو نقرة بإصبعين على لوحة اللمس، أو النقرة الثانوية لمؤشر iPad؛ وفي المتصفحات مفتاح القائمة في لوحة المفاتيح أيضًا. افتح قائمة التطبيق الخاصة هناك؛ وفي TSX يعرض [`Menu.popup`](../modules/nsh-desktop.md) قائمة النظام:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | ضُغط الزر الثانوي فوق العنصر أو فوق عنصر بداخله. |

يحتوي `ContextMenuEvent` على `position` داخل العنصر، و`pagePosition` داخل عنصره الجذر (حيث يضع `Menu.popup` قائمة: `Menu.popup(items, e.pagePosition)`) و`modifiers`؛ وفي Rust `position` و`page_position` و`modifiers`. أقرب عنصر يستمع، بدءًا من العنصر الذي تحت المؤشر ثم نحو الخارج، هو الذي يسمعه. حقل إدخال نصي، أو نص قابل للتحديد له قائمة تحرير (Windows وواجهة GPUI الخلفية والمتصفحات)، إذا كان أقرب من ذلك العنصر فإنه يعرض قائمته الخاصة بدلًا منه. تقرر المنصة ذلك لحظة نزول الزر، بناءً على ما هو مركّب، فيُبلَّغ المعالج بعد وقوع الفعل ولا حاجة إلى إلغاء أي شيء. العنصر `disabled` يترك النقرة لأقرب مستمع مفعّل حوله. على الشاشات اللمسية يفتح الضغط المطوّل القوائم: عالج `onLongPress` بالدالة نفسها.

<a id="keyboard-focus"></a>

### تركيز لوحة المفاتيح (Keyboard focus)

على macOS والويب، ينقل Tab تركيز لوحة المفاتيح بين نقاط توقفه بترتيب الشجرة: حقول الإدخال، والعناصر التي تقبل الضغط، وكل عنصر `focusable`. أنماط التركيز (`focus:`، `.focus(..)`) تنسّق العنصر المركَّز، ويضغطه Return أو Space إذا كان يقبل الضغط. النقرة تضغط العنصر دون تركيزه، لذا تظهر أنماط التركيز لتركيز لوحة المفاتيح فقط.

التركيز والضغط منفصلان. العنصر الذي يستقبل المفاتيح وهو مركَّز (مخطط، أو منزلق، أو قائمة تحرّك تحديدها بمفاتيح الأسهم) يضبط `focusable` ويربط مفاتيحه أثناء التركيز (`onFocus` / `onBlur` مع [`keymap`](../modules/nsh.md#keymap))؛ وتظل الضغطة عليه تصل إلى عنصر قابل للضغط حوله، مثل بطاقة تفتح صفحة.

يحرّك `focus()` الخاص بـ ref تركيز لوحة المفاتيح إلى نقطة توقف كما يفعل Tab (تظهر أنماط تركيزها ويُطلَق `onFocus`)، مثلًا لإعادته إلى مشغّل نافذة منبثقة أُغلقت، ويزيله `blur()`.

يُنسّق العنصر المحيط بالتركيز نفسه بـ `focus-within:` (`focusWithinStyle`، `.focus_within(..)`) ما دام التركيز عليه أو على أي عنصر بداخله: إطار حقل حول الإدخال الذي يحرّر، أو شريط أدوات بينما أحد أزراره عليه التركيز. محتوى `Overlay` داخل العنصر الذي يوجد فيه التراكب، أينما ظهر، لذا تُعدّ النافذة المنبثقة جزءًا من العنصر الذي يحمل مشغّلها. في Rust يسمع المكوّن دخول التركيز إلى عنصر وخروجه منه عبر `on_focus_in(..)` و`on_focus_out(..)` الخاصين بـ ref: والتنقل بين العناصر داخله ليس دخولًا ولا خروجًا.

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` للعناصر التي تقبل الضغط | ما إذا كان العنصر نقطة توقف لمفتاح Tab. `true` يجعل أي عنصر نقطة توقف، سواء قبل الضغطات أو تركها للعناصر المحيطة به؛ `false` يترك العنصر القابل للضغط للمؤشر (خلفية تغلق نافذة منبثقة، وصفوف تتنقل بينها مفاتيح الأسهم). |
| `onFocus` | `.on_focus(..)` | `() => void` | | منح Tab (أو `focus()`) العنصر تركيز لوحة المفاتيح. |
| `onBlur` | `.on_blur(..)` | `() => void` | | غادر تركيز لوحة المفاتيح العنصر. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### التخطيط والهوية (Layout and identity)

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` هو إطار العنصر نسبةً إلى أصله، `{ origin, size }`، بعد كل تخطيط يغيّره. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | مرجع العنصر (انظر [دوال ref](#ref-methods)): `ViewRef`، أو نوع العنصر نفسه فوقه. `ref={el}` يسند متغيرًا، و`ref={fn}` يستدعي دالة. |
| `nativeID` | `.native_id(id)` | `string` | يسمّي العنصر لغيره، مثل `InputAccessoryView` الذي يشير إليه حقل إدخال. |
| `testID` | `.test_id(id)` | `string` | معرّف لاختبارات واجهة المستخدم (على Android، معرّف مورد العنصر). |
| `key` | `.key(key)` | `string` | هوية العنصر بين أشقائه. |

<a id="gestures-driving-animated-values"></a>

### الإيماءات التي تقود القيم المتحركة (Gestures driving animated values)

تربط هذه الخصائص إيماءة بـ[القيم المتحركة الأصلية](../modules/nsh.md#animation) التي تتحرك على خيط واجهة المستخدم، دون أي عمل في شيفرة التطبيق عند كل إطار. انظر [اللمس والإيماءات](../docs/touch-and-gestures.md).

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | تقود عمليات السحب هذه القيم (بالنقاط). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | بدأ سحب. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | انتهى سحب، مع سرعة الإفلات (مثلًا لبدء `decay`). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | تقود قرصات الإصبعين `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | بدأت قرصة / انتهت. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | تقود تدويرات الإصبعين `angle` (بالدرجات). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | بدأ تدوير / انتهى. |

`PanEvent` هو `{ cancelled, translation, velocity, value? }` (وفي Rust `cancelled`، `translation`، `velocity_x`، `velocity_y`، `value_x`، `value_y`): هل ألغى النظام السحب، والإزاحة منذ البداية، والسرعة بالنقاط في الثانية (قيم `Point`)، والقيم المرتبطة في تلك اللحظة، `{ x?, y? }` للمحاور التي يربطها `pan` (يمكن للسحب أن يمسك قيمة أثناء حركتها).

<a id="raw-touches-and-the-responder-system"></a>

### اللمسات الخام ونظام المستجيب (Raw touches and the responder system)

للإيماءات التي لا تغطيها الخصائص أعلاه، يقبل كل عنصر خصائص اللمس والمستجيب: `onTouchStart`، `onTouchMove`، `onTouchEnd`، `onTouchCancel` (وصيغ `…Capture` الخاصة بها)، `onStartShouldSetResponder`، `onMoveShouldSetResponder` (و`…Capture`)، `onResponderGrant`، `onResponderReject`، `onResponderStart`، `onResponderMove`، `onResponderEnd`، `onResponderRelease`، `onResponderTerminate` و`onResponderTerminationRequest`. يستقبل كل معالج `GestureResponderEvent`
(`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...).
إرجاع `true` من `onResponderGrant` يمنع عروض التمرير الأصلية من أخذ اللمسات. `panActivation`
(`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) يجعل العنصر مستجيبًا فقط بعد أن تفعّل المنصة حركة السحب الخاصة بها، فتترك عمليات السحب داخل عروض التمرير المحور الآخر لها
([اللمس والإيماءات](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)).
يعتمد `PanResponder` في [`PanResponder`](../modules/nsh.md#panresponder) عليها. في Rust يسمع `.on_touch(..)` كل لمسة
(`TouchEvent`)، ويقرر `.claim_touches(..)` متى يأخذها العنصر، وتتبع `.on_responder_grant(..)`
و`.on_responder_move(..)` و`.on_responder_release(..)` وغيرها المستجيب.

<a id="accessibility"></a>

### إمكانية الوصول (Accessibility)

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | العنصر عنصر واحد بالنسبة إلى التقنيات المساعدة؛ ولا يُكشف عن أبنائه بشكل منفصل. |
| `accessibilityLabel` | `.label(..)` | `string` | ما تقرؤه قارئات الشاشة. العناصر التي بلا تسمية تقرأ نصوصها. |
| `accessibilityHint` | `.hint(..)` | `string` | ما يفعله تنشيط العنصر. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | ما هو العنصر (`"button"`، `"header"`، `"link"`، `"switch"`، …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | الحالة التي تبلّغ عنها التقنيات المساعدة (يمكن أن يكون `checked` و`pressed` `"mixed"`؛ و`current` هو `true` أو `"page"`، `"step"`، `"location"`، `"date"`، `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | مستوى العنوان (1 هو الأعلى)، وعمق عنصر الشجرة (1 في الأعلى). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | قيمة عنصر نطاقي أو نصي. |
| `accessibilityElementsHidden` | | `boolean` | يخفي العنصر وشجرته الفرعية عن التقنيات المساعدة. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | ما إذا كان العنصر مكشوفًا. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | إجراءات مخصصة تُقدَّم للتقنيات المساعدة. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | استدعى المستخدم أحد `accessibilityActions`. |

انظر [إمكانية الوصول](../docs/accessibility.md).

<a id="platform-only-props"></a>

### الخصائص الخاصة بمنصة واحدة (Platform-only props)

الخصائص الموجودة على منصة واحدة فقط توضع في كائن يحمل اسمها في TSX، لتبقى الخصائص المشتركة نفسها في كل مكان. يُرسل كائن المنصة الحالية فقط، وتُهمل الكائنات الأخرى. تتلقاها بُناة Rust كدوال تُطبَّق على منصتها.

| الخاصية | الوصف |
|---|---|
| `ios={{…}}` | iOS وMac Catalyst. `<Input>` و`Dialog` و`WebView` تضيف مفاتيحها الخاصة. |
| `android={{…}}` | Android. يقبل كل عنصر `ripple` و`elevation` و`accessibilityLiveRegion` (أدناه). |
| `desktop={{…}}` | منصات سطح المكتب ومتصفحات سطح المكتب؛ تُهمل على الأجهزة المحمولة. يقبل كل عنصر `windowDrag` (أدناه). |
| `web={{…}}` | المتصفحات؛ تُهمل في غيرها. |

| مفتاح `android` | Rust | النوع | الوصف |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | تموّج Material أثناء الضغط. |
| `elevation` | `.elevation(px(2.0))` | `number` | ظل Material (بالنقاط)، من شكل العنصر. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | كيفية الإعلان عن تغيرات العنصر إلى TalkBack. |

| مفتاح `desktop` | Rust | النوع | الوصف |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | ضغط العنصر يسحب النافذة، كما يفعل شريط عنوانها؛ `false` يُبقي جزءًا من عنصر قابل للسحب قابلًا للنقر. انظر [شريط عنوان خاص بك](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

انظر [الشيفرة الخاصة بكل منصة](../docs/platform-specific.md).
<a id="ref-methods"></a>

## طرق الـ Ref

في TSX، يستقبل `ref` الـ ref الخاص بالعنصر، ونوعه هو نوع العنصر نفسه: `ViewRef` (`focus`، `blur`، `measure`) للعناصر
`View` و`Text` و`Image` و`Canvas` و`Overlay` و`Shader`، ونوع مبني على `ViewRef` مع طرق العنصر بالنسبة إلى
البقية: `InputRef` (`Input`)، `ScrollRef` (`Scroll`)، `ListRef` (`List`)، `WebViewRef` (`WebView`)، `VideoRef`
(`Video`) و`NativeComponentRef` (المكوّنات الأصلية native components). في Rust، ينشئ `element_ref()` مقبضًا من النوع `ElementRef`
يقوم `.element_ref(&handle)` بربطه. ترسل طرقه أوامر إلى الـ view الأصلي، بالترتيب نفسه مع التغييرات التي أُجريت
قبلها في الدورة نفسها. توضح صفحة كل عنصر الطرق التي تنطبق عليه. اكتب نوع متغير الـ ref بنوع عنصره
نفسه (`let field!: InputRef` للعنصر `<Input>`): فالمتغير المكتوب بالنوع `ViewRef` لا يناسب عنصرًا يحتوي الـ ref الخاص به على طرق
خاصة به.

| الطريقة | Rust | Ref | الوصف |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | تمنح التركيز لعنصر `<Input>` (وتُظهر لوحة المفاتيح)، أو تمنح تركيز لوحة المفاتيح لـ view يستقبل الضغطات / تزيل التركيز. |
| `measure()` | `measure()` | `ViewRef` | [مكان الـ view](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | تحدد `start..end` بوحدات UTF-16؛ ومؤشر إدراج (caret) بدون `end`. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`، `ListRef` | تمرّر إلى إزاحة محددة. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (عنصر `<Scroll>` قابل للتكبير) | تكبّر إلى `scale` حول نقطة في المحتوى. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | تمرّر إلى إزاحة محددة على محور القائمة. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | تمرّر عنصرًا ليصبح ظاهرًا. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`، `ListRef` | تمرّر إلى نهاية المحتوى. |
| `reload()`، `goBack()`، `goForward()`، `stopLoading()`، `injectJavaScript(script)`، `postMessage(data)` | `reload()`، `go_back()`، `go_forward()`، `stop_loading()`، `inject_java_script(..)`، `post_message(..)` | `WebViewRef` | تتحكم في الصفحة. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | تنتقل إلى وقت محدد. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | تستدعي أمرًا من مكوّن أصلي مسجَّل ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## لماذا لا تحجب المعالجات واجهة المستخدم أبدًا

لا ينتظر الخيط الرئيسي (main thread) شيفرة التطبيق أبدًا. فعندما يحتاج النظام إلى إجابة فورية (هل يجوز تغيير هذا النص، وهل يجوز للزر الرجوع أن يُخرج الصفحة من المكدس، وهل يجوز إغلاق هذه الورقة السفلية)، يجيب NSH عنها محليًا اعتمادًا على props جرى ضبطها مسبقًا (`maxLength`،
`popOnBack`، `closeOnSwipe`، …)، ثم يصل الحدث إلى التطبيق بعد ذلك. ولهذا السبب يكون هذا السلوك
prop وليس قيمة مُعادة من معالج.
