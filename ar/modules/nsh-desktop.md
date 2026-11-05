---
title: "nsh/desktop"
description: "واجهات برمجة التطبيقات الخاصة بسطح المكتب فقط: النافذة (العنوان، شريط العنوان، التكبير، ملء الشاشة)، وشريط عنوان خاص بالتطبيق مع مناطق قابلة للسحب، وقائمة التطبيق، والقوائم السياقية، واختصارات لوحة المفاتيح."
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

يضم `nsh/desktop` ما تنفرد به أجهزة سطح المكتب: النافذة وشريط عنوانها، وقائمة التطبيق، والقوائم السياقية. يعمل على macOS وWindows وLinux. يجد كود Rust كل ذلك في `nsh_core::element::desktop`: دوال النافذة (`set_title`، `set_title_bar`، `title_bar`، `minimize`، … `close_window`)، وقائمة التطبيق والقوائم السياقية (`set_application_menu`، `popup_menu`، وتتكوّن من عناصر `MenuItem`)، ويعلّم العروض القابلة للسحب بواسطة `.window_drag(true)`؛ أما TSX فيستورد `nsh/desktop`. يمكن استيراد الوحدة على كل منصة، لذا تعمل حزمة واحدة في كل مكان: على iOS وAndroid لا تفعل دوالها شيئًا، ويخبرك `isAvailable` بما إذا كانت نافذتها وقوائمها متاحة.

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true` حيث تعمل واجهات النافذة والقوائم في هذه الوحدة: macOS وWindows وLinux؛ و`false` في غيرها. في Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) هو الفحص الأوسع لسلوك سطح المكتب (خصائص `desktop={{…}}`، `platform.select({ desktop })`): فهو يصدق أيضًا في المتصفحات بنمط سطح المكتب، وهي تعمل داخل نافذة المتصفح نفسه. اعتمد على `platform.desktop` في تخطيط سطح المكتب وكثافته وإدخاله، وعلى `isAvailable` في استدعاءات `Window` و`Menu`.

<a id="window"></a>

## النافذة

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

يسمّي عمود Rust دوال `nsh_core::element::desktop`.

| العضو | Rust | الوصف |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | عنوان النافذة: يظهر في شريط العنوان، وشريط المهام أو Dock، ومبدّل النوافذ. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` يزيل شريط عنوان النظام: يملأ التطبيق النافذة حتى حافتها العليا ويرسم شريط عنوان خاصًا به. تبقى أزرار تحكم النظام بالنافذة (أزرار macOS الثلاثة الملوّنة، وأزرار التصغير والتكبير والإغلاق في Windows، وأزرار نافذة GTK). `height` هو ارتفاع شريطك بالنقاط: تتوسط الأزرار هذا الارتفاع (تملؤه أزرار العنوان في Windows؛ وفي macOS يختار `height` إطارًا مدمجًا حتى 44 نقطة وإطارًا عاديًا فوق ذلك؛ اضبط حجم شريطك وفق الارتفاع الفعلي من `titleBar().height`، ويضع AppKit الأزرار الملوّنة أثناء تغيير الحجم المباشر. أما شريط الأدوات القائم في تطبيق مُضمِّن فيحتفظ بنمطه وارتفاعه)؛ وبدونه تأخذ الأزرار ارتفاع المنصة. `style: "default"` يعيد شريط عنوان النظام (في Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | على Windows وLinux في تطبيقات GPUI، حيث ترسم النافذة قائمة التطبيق كشريط فوق التطبيق: `"shown"` (الافتراضي) يعرضه دائمًا؛ و`"autoHide"` يعرضه بعد الضغط على Alt وحدها وتحريرها، ويبقى حتى تخفيه Alt وحدها مجددًا، كما في تطبيقات Windows وGNOME. يفتح F10 وAlt مع الحرف الأول من القائمة قائمةً في الحالتين، ويظهر الشريط ما دامت مفتوحة. شريط قوائم macOS يتبع النظام. |
| `minimize()` | `minimize()` | يصغّر النافذة. |
| `toggleMaximize()` | `toggle_maximize()` | يكبّر النافذة، أو يستعيدها إن كانت مكبّرة. |
| `toggleFullScreen()` | `toggle_full_screen()` | يدخل وضع ملء الشاشة أو يغادره. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | يحرّك النافذة ويغيّر حجمها بالنقاط؛ وتحتفظ الحقول المحذوفة بقيمها. على macOS وWindows يشمل `size` (`width`، `height`) زخارف النافذة؛ وعلى Linux يضبط حجم النافذة الافتراضي في GTK. `origin` (`x`، `y`) هو الزاوية العليا اليسرى للنافذة، مقيسة من الزاوية العليا اليسرى للشاشة الرئيسة (وهي في macOS الشاشة التي عليها شريط القوائم) مع تزايد `y` نحو الأسفل، وهو الأمر نفسه على كل المنصات؛ و`height` بلا `y` يُبقي الحافة العليا حيث هي، فتتمدد النافذة وتنكمش من حافتها السفلى. `animated: true` يفعّل حركة تغيير الحجم في macOS (الافتراضي: false). |
| `setLevel(level)` | `set_level(level)` | على macOS وWindows، `"floating"` يُبقي النافذة فوق النوافذ العادية و`"normal"` يعيد المستوى العادي. `"desktopIcon"` يختار مستوى أيقونات سطح المكتب في macOS (وتظهر النافذة أيضًا على كل المساحات، خارج Mission Control وCmd+`)؛ وعلى Windows ينقل النافذة إلى قاع ترتيب z الحالي، حيث قد يرفعها تنشيط لاحق. |
| `orderFront()` | `order_front()` | يجلب النافذة إلى مقدمة مستواها ويمنحها التركيز (يُنشَّط التطبيق؛ وفي macOS تُستعاد النافذة المصغّرة، وفي Windows تُستعاد النوافذ المصغّرة وتُضبط في المقدمة، وفي GTK تُعرض النافذة). تحتفظ النافذة بمستواها. على macOS تبقى الأسطح ذات مستوى سطح المكتب خلف النوافذ الأخرى. يفعّل GPUI نافذته؛ ويتحكم مدير النوافذ في طلبات المقدمة على Linux. |
| `close()` | `close_window()` | يغلق النافذة؛ وينتهي التطبيق معها. |

تغيير حجم النافذة مدعوم على macOS وWindows وLinux؛ أما تحديد الموضع والمستويات فعلى macOS وWindows. يتحكم مدير النوافذ في Linux بالموضع وترتيب التراكب. في تطبيقات GPUI يضبط `setFrame` حجم النافذة وتضع المنصة موضعها؛ ويختار مضيف GPUI موضعها ومستواها عند فتحها.

عند تحديد حجم النافذة من محتوى مقيس بـ`onLayout`، اترك مساحة لزخارف النافذة على macOS وWindows. يقبل `width` و`height` أرقامًا موجبة محدودة؛ ويقبل `x` و`y` أرقامًا محدودة. تحتفظ الحقول غير الصالحة بقيمها السابقة.

<a id="a-title-bar-of-your-own"></a>

## شريط عنوان خاص بك

عند إخفاء شريط العنوان يرسم التطبيق شريطه بنفسه ويحدد أي أجزائه تحرّك النافذة، باستخدام `.window_drag(true)` في Rust و`desktop={{ windowDrag: true }}` في TSX:

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

الضغط على عرض يحمل `windowDrag` يسحب النافذة كما يفعل شريط عنوان النظام: النقر المزدوج يكبّرها (أو يفعل ما ضبطه المستخدم: في macOS، "Double-click a window's title bar to")، وعلى Windows وLinux يفتح النقر الأيمن قائمة النافذة.

- يحسم الأمر أقرب عرض يضبط `windowDrag`: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) يُبقي جزءًا من عرض قابل للسحب قابلًا للنقر.
- تبقى حقول النص والعروض ذات معالجات الضغط أو اللمس (`onPress`، `onTouch*`، المستجيبات) داخل عرض قابل للسحب قابلة للنقر بدونه: حقل البحث وأي أزرار في المثال أعلاه تعمل كالمعتاد.
- يعمل `windowDrag` أيضًا مع شريط عنوان النظام: يمكن لشريط جانبي أو شريط أدوات أن يحرّك النافذة كذلك.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

مساحة شريط العنوان المخفي بالنقاط (تفاعلية): `height` الخاص به، وعرض ما تشغله أزرار تحكم النظام عند طرفيه `left` و`right`. صمّم شريطك بالاعتماد عليها كي لا يقع شيء تحت الأزرار. القيم الثلاث كلها 0 ما دام النظام يعرض شريط عنوانه (وفي وضع ملء الشاشة، وخارج أجهزة سطح المكتب). في Rust: `title_bar() -> Edges<Points>`، حيث `top` هو الارتفاع و`left` و`right` عرضا الأزرار؛ وقراءته تشترك في التغييرات.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`، وإلا ارتفاع شريط العنوان (28 أو 32 بحسب إصدار macOS) | عرض الأزرار الثلاثة الملوّنة | 0 |
| Windows | `height`، وإلا 32 | 0 | أزرار العنوان الثلاثة (138) |
| Linux | `height`، وإلا ارتفاع شريط الرأس | أزرار النافذة عند البداية (تخطيط الأزرار في سطح المكتب) | أزرار النافذة عند النهاية |

على Windows يرسم NSH أزرار العنوان بنمط Windows 11 وتتبع مظهر التطبيق؛ ويعرض تمرير المؤشر فوق زر التكبير تخطيطات الالتقاط (snap layouts) في Windows 11. تحتفظ النافذة بحدود تغيير الحجم والظل والزوايا المستديرة على كل منصة.

<a id="menu"></a>

## القائمة

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| العضو | الوصف |
|---|---|
| `setApplicationMenu(items)` | يضبط قائمة التطبيق: قائمة فرعية لكل عنصر من المستوى الأعلى (`File`، `Edit`، ...). على macOS هي شريط القوائم، وقائمته الأولى هي قائمة التطبيق (يسمّيها AppKit باسم التطبيق). وعلى Windows وLinux هي شريط قوائم النافذة، ولا يظهر ما دام شريط العنوان مخفيًا؛ وتبقى اختصاراته تعمل، ويمكن لشريط عنوان خاص بالتطبيق أن يفتح قوائمه بواسطة `Menu.popup`. `null` يعيد قائمة المنصة الافتراضية. |
| `popup(items, at?)` | يعرض قائمة سياقية وزاويتها العليا اليسرى عند `at` (إحداثيات النافذة بالنقاط: `e.pagePosition` الخاص بـ`onContextMenu`)، أو عند المؤشر. يُحَلّ الوعد (promise) بمجرد إغلاق القائمة، سواء اختير عنصر أم لا: فقد يبقى الزر الذي فتحها مضغوطًا حتى ذلك الحين. |

في Rust يأخذ `set_application_menu(items)` قيمة `Vec<MenuItem>` (`None` يعيد قائمة المنصة الافتراضية)، ويُرجع `popup_menu(items)` (عند المؤشر) و`popup_menu_at(items, at)` قيمة `Answer<()>` تكتمل بعد إغلاق القائمة (الانتظار عليها اختياري). يعمل معالج العنصر ضمن المالك (owner) الذي ضبط القائمة، ما دام هذا المالك حيًا.

استدعِ `setApplicationMenu` مجددًا لتغيير القائمة. وداخل `effect` تتبع القائمةُ الإشاراتِ التي تقرؤها: فتبقى علامة الاختيار أو حالة التعطيل المعتمدة على حالة التطبيق محدّثة.

<a id="menu-items"></a>

### عناصر القائمة

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| الحقل | الوصف |
|---|---|
| `label` | ما يعرضه العنصر. وللعنصر ذي الدور تسمية خاصة به إن لم تُحدَّد. |
| `onSelect` | يُستدعى عند اختيار العنصر، بالنقر أو بالاختصار. |
| `shortcut` | اختصار لوحة المفاتيح: مُعدِّلات ومفتاح واحد يربط بينها `+`، مثل `"mod+n"` أو `"mod+shift+z"` أو `"alt+f4"` أو `"f11"`. المعدِّلات في الجدول أدناه. المفاتيح هي الحروف والأرقام وعلامات الترقيم، وتُكتب بالحرف الذي يطبعه المفتاح على لوحة مفاتيح US دون Shift (`,`، `/`؛ و`"shift+/"` للمفتاح `?`)، أو باسم: `plus` (مفتاح `=` / `+`، وأيضًا `=`)، `minus` (وأيضًا `-`)، `space`، `enter` (`return`)، `escape` (`esc`)، `tab`، `backspace`، `delete` (`del`)، `insert`، والأسهم `up`، `down`، `left`، `right` (`arrowup`، …)، `home`، `end`، `pageup`، `pagedown`، `f1`–`f24`. حالة الأحرف لا تهم (`"Mod+Shift+N"` هو `"mod+shift+n"`؛ والحرف الكبير هو المفتاح نفسه لا Shift)، والأحرف الصغيرة هي النمط الموصى به. الاختصار غير الصالح (`"mod-n"`، `"mod++"`، `"mod+?"`) يرمي خطأً يبيّن الصيغة الصحيحة. يقبل `keymap` ضغطات المفاتيح نفسها. تعرضه القوائم بنمط المنصة (`⇧⌘N` على macOS، `Ctrl+Shift+N` على Windows). |
| `when` | متى يختار الاختصارُ العنصرَ بينما يملك حقل نص تركيز لوحة المفاتيح، في واجهة GPUI الخلفية: `"always"` (الافتراضي)، أو `"auto"` (ما لم يستخدم الحقل المفتاح نفسه: المفاتيح التي تكتب أو تحرّك المؤشر أو تحذف، واختصارات التحرير، كما في ارتباطات [`keymap`](./nsh.md#keymap))، أو `"notEditing"`. المفتاح الذي يتركه العنصر يذهب إلى الحقل. |
| `disabled` | `true` يجعل العنصر رماديًا معطّلًا (الافتراضي `false`). |
| `checked` | اضبطه (على `true` أو `false`) لعنصر بعلامة اختيار. |
| `submenu` | يجعل العنصر قائمة فرعية (ويحتاج إلى `label`). |
| `role` | عنصر قياسي تنفّذه المنصة (أدناه). |

تُحذف عناصر `null` و`undefined` و`false`، لذا يعمل `cond && { … }` داخل قائمة.

في Rust يكون العنصر `MenuItem::new(label)` أو `MenuItem::role(role)` أو `MenuItem::separator()` أو `MenuItem::submenu(label, items)`، وتكون الحقول دوال: `.shortcut("mod+n")` (يُحدث panic عند اختصار غير صالح، مع الصيغة الصحيحة)، `.shortcut_when(When::Auto)`، `.disabled(true)`، `.checked(on)`، `.on_select(f)`، و`.label(..)` لعنصر الدور.

المعدِّلات:

| المعدِّل | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (وأيضًا `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (وأيضًا `command`، `meta`، `super`، `win`) | Command (⌘) | مفتاح Windows | Super |
| `ctrl` (وأيضًا `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (وأيضًا `option`، `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

استخدم `mod` لاختصارات تطبيقك الخاصة: فهو المفتاح الذي تستخدمه تطبيقات كل منصة لها (⌘N على macOS وCtrl+N على Windows وLinux)، فتناسب صيغة واحدة الجميع. مفتاح Windows وSuper يخصّان النظام في الغالب (Win+E، نظرة GNOME العامة)، لذا نادرًا ما يكون `cmd` مناسبًا خارج macOS.

الأدوار:

| الدور | وظيفته | المنصات |
|---|---|---|
| `about`، `hide`، `hideOthers`، `showAll` | العناصر القياسية لقائمة التطبيق | macOS (تُحذف في غيرها) |
| `quit` | يُنهي التطبيق | الكل |
| `undo`، `redo`، `cut`، `copy`، `paste`، `selectAll` | تحرير حقل النص المركَّز عليه (وتبقى اختصارات الحقل الخاصة به له) | الكل |
| `minimize`، `zoom`، `toggleFullScreen`، `close` | النافذة | الكل |

لعنصر الدور تسمية المنصة واختصارها ما لم يضبط تسميته الخاصة (يضيف macOS اسم التطبيق إلى `about` و`hide` و`quit`).

لاختصارات القوائم الأولوية، كما في التطبيقات الأصلية: المفتاح الذي يأخذه عنصر لا يصل أبدًا إلى حقل النص المركَّز عليه ولا إلى مفاتيح NSH نفسها. ولا يسبقها إلا ارتباط من [`keymap`](./nsh.md#keymap) لضغطة المفاتيح نفسها. لذا امنح اختصارات التحرير (`mod+c`، `mod+v`، `mod+x`، `mod+a`، `mod+z`) لأدوار التحرير وحدها، فهي تمررها إلى حقل النص، وتجنّب المفاتيح بلا مُعدِّل (`escape`، الأسهم، الحروف) لأنها ستسلبها من حقول النص ومن التنقل للخلف. في واجهة GPUI الخلفية يتيح `when: "auto"` للعنصر أن يشارك حقول النص المفتاحَ نفسه: `delete` أو `mod+z` يختاران العنصر ما دام لا حقل يملك التركيز، ويحرّران النص حين يملكه حقل.

في واجهة GPUI الخلفية يرى المكوّن الأصلي الذي يملك تركيز لوحة المفاتيح كل مفتاح أولًا. والمفتاح الذي يعالجه بنفسه لا يصل أبدًا إلى خريطة المفاتيح ولا إلى القائمة. والمفتاح الذي يتركه يصل إلى خريطة المفاتيح كما لو كان حقل نص مركَّزًا عليه، ثم إلى القائمة.

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

قائمة سياقية من ضغطة زر:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> القوائم هي قوائم النظام (NSMenu وقوائم Win32 وقوائم GTK المنبثقة): تبدو وتتصرف كما في كل التطبيقات الأخرى، وتتبع مظهر النظام (أو التطبيق)، ويمكن الوصول إليها بلوحة المفاتيح. `examples/desktop` تطبيق بشريط عنوان خاص به وقائمة تطبيق وقوائم سياقية.
