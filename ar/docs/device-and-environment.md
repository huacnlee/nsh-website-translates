---
title: "الجهاز والبيئة"
description: "قراءة حجم النافذة ونظام الألوان ومقياس الخط والمناطق الآمنة والمنصة وكثافة البكسل واتجاه التخطيط، والاستجابة عند تغيّرها."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# الجهاز والبيئة

تتغير البيئة التي يعمل فيها التطبيق أثناء تشغيله: يتغير حجم النافذة (التدوير، العرض المقسّم، نافذة Mac)، أو ينتقل المستخدم إلى الوضع الداكن أو إلى حجم نص أكبر، أو تظهر لوحة المفاتيح وتختفي. يعرض NSH كل واحد من هذه عبر **دالة وصول تفاعلية** (reactive accessor): استدعها كما تستدعي signal، وكل ما قرأها (نمط أو نص أو قيمة محسوبة) يتحدث عند تغيّرها. لا توجد مستمعات لإضافتها أو إزالتها.

في Rust تكون دوال الوصول دوالَّ في `nsh_core::prelude`؛ وفي TSX تأتي من الوحدات المذكورة.

| Rust | TSX | القيمة |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | عرض السطح وارتفاعه بالنقاط. |
| `dark()` | `colorScheme()` (`nsh`) | الوضع الداكن أو الفاتح: وضع النظام، أو وضع التطبيق نفسه (`set_color_scheme`، `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | تفضيل المستخدم لحجم النص نسبةً إلى الافتراضي (1 هو الافتراضي). |
| `safe_area()` | `safeArea()` (`nsh`) | هوامش السطح التي لا تغطيها واجهة النظام: أعلى، يمين، أسفل، يسار. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | الهوامش في الموضع الذي يُعرض فيه المكوّن المستدعي (صفحة، حوار). |
| `keyboard_height()`، `keyboard_duration()` | `keyboardFrame()` (`nsh`) | ارتفاع لوحة المفاتيح البرمجية ومدة حركتها. |
| `locale()` | `locale()` (`nsh`) | لغة المستخدم ومنطقته (locale) كوسم BCP 47 (`"en-US"`، `"zh-Hans-CN"`): ما يُنسّق `Intl` وفقه افتراضيًا. |
| `lifecycle()` | `lifecycle()` (`nsh`) | هل التطبيق قيد الاستخدام: `active`، `inactive` (ظاهر دون التركيز) أو `background` ([في الخلفية](#in-the-background)). |
| `reduce_motion()`، `screen_reader()` | `reduceMotion()`، `screenReaderEnabled()` (`nsh`) | انظر [إمكانية الوصول](./accessibility.md). |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## حجم النافذة والتخطيط المتجاوب

`window()` (TSX: `windowSize()`) هو حجم السطح الذي يرسم فيه NSH: الشاشة في الهاتف، والنافذة في iPad بالعرض المقسّم أو في Mac، والعرض المضيف عند تضمين NSH. استخدمه لتغيير التخطيط، لا الأحجام فقط:

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

غالبًا ما تكفي flexbox والنسب المئوية و`aspect_ratio` (`aspectRatio`) دون قراءة الحجم إطلاقًا؛ انظر [التخطيط](./layout.md). تبدّل `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` في Rust الأنماط بحسب العرض؛ أما في TSX مع Tailwind فمتغيرات نقاط التوقف (`sm:`، `md:`، `lg:`، `xl:`، `2xl:`، `max-*:`، `min-[…]:`) و`portrait:` / `landscape:` تتبع النافذة أيضًا: `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## الوضع الداكن

يتبع المظهر النظام ما لم يضبط التطبيق مظهره الخاص. في Rust أبسط طريقة لدعم الوضع الداكن هي لون بقيمة فاتحة وأخرى داكنة، `AdaptiveColor::rgb(light, dark)`: يتبدل أصليًا عند تبدل المظهر، دون أي شيء يجب تشغيله. وفي TSX هو متغير Tailwind `dark:`، الذي يُطبَّق عندما تكون `colorScheme()` هي `"dark"`:

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

لأي حالة أخرى، اقرأ `dark()` (TSX: `colorScheme()`) داخل closure أو قيمة محسوبة؛ وفي TSX، إن زاد عدد الألوان على بضعة ألوان، فاشتقّ لوحة ألوان مرة واحدة:

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

تأخذ مكوّنات Rust ألوانها أيضًا من السمة (theme) التي لها قيم فاتحة وداكنة (`nsh.json` `"theme"`، انظر [البناء باستخدام Rust](./rust.md))، لذا تتبدل مع النظام كذلك. لمطابقة شريط الحالة مع خلفيتك، امنح صفحاتك وحواراتك [`statusBar`](../modules/nsh-base.md#status-bar)، أو امنح التطبيق واحدًا في `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### تطبيق بمظهره الخاص

التطبيق الذي يكون داكنًا دائمًا (أو فاتحًا دائمًا) يصرّح بذلك في `nsh.json`، فتتبعه `dark()` و`colorScheme()` والألوان التكيفية وفئات `dark:` والسمة والنمط الافتراضي لشريط الحالة والتنبيهات منذ الإطار الأول (وتُطلَق التطبيقات المحزَّمة به أيضًا):

```json
{ "appearance": "dark" }
```

يغيّره `set_color_scheme(Appearance::Dark)` (TSX: `setColorScheme` من `nsh`) أثناء التشغيل، لإعداد مظهر داخل التطبيق؛ ويعيد `Appearance::System` (`"system"`) اتباع النظام مجددًا:

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> اختبر المظهرين أثناء التطوير: `xcrun simctl ui booted appearance dark` يبدّل محاكي iOS، وفي Android مفتاح للسمة الداكنة في الإعدادات السريعة (Quick Settings). يصل التغيير إلى تطبيقك فورًا، دون إعادة تحميل.

<a id="text-size"></a>

## حجم النص

`font_scale()` (TSX: `fontScale()`) هو إعداد حجم النص لدى المستخدم (Dynamic Type في iOS، وحجم الخط في Android) نسبةً إلى الافتراضي. يتبعه النص وحقول الإدخال تلقائيًا: يُعرض `fontSize: 16` أكبر عندما يطلب المستخدم نصًا أكبر. ويمكنك لكل عنصر إلغاء ذلك أو وضع حدّ أقصى له:

| Rust (على `text` و`input`) | TSX (على `<Text>` و`<Input>`) | الافتراضي | الوصف |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | اتباع حجم نص النظام. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (بلا حد) | أكبر مقياس يُطبَّق على هذا النص. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

اقرأ `font_scale()` لتكييف التخطيط الذي لا يتبع النص تلقائيًا، مثل تحويل صف إلى عمود عندما يكبر النص: `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` في Rust، و`flexDirection: fontScale() > 1.3 ? "column" : "row"` في TSX.

يغيّر حجم النص مقياس النص: كل نص وحقل إدخال يسمح بتحجيم الخط، وتنبيهات المنصة ورسائلها المنبثقة (toasts). أما الأطوال فتحتفظ بحجمها: المسافات والعروض والارتفاعات وأنصاف أقطار الزوايا والحدود والصور، سواء بالنقاط أو بالفئات (`p-4`، `rounded-lg`، `w-[2rem]`). وتكبر الصناديق التي يحدد محتواها حجمها مع نصها.

<a id="language-and-region"></a>

## اللغة والمنطقة

`locale()` هي لغة المستخدم ومنطقته (locale) كوسم BCP 47 (`locale().as_str()` في Rust). في TSX يُنسّق `Intl` الأرقام والتواريخ وفقها افتراضيًا، فيعطي `new Intl.NumberFormat().format(1234.5)` القيمة `1,234.5` في `en-US` و`1.234,5` في `de-DE`. اقرأ `locale()` لاختيار نصوص ترجماتك الخاصة: تتحدث النصوص التي تقرؤها عند تغيّرها.

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## في تطبيق مُضمِّن

يتبع التطبيق المعروض داخل تطبيق أصلي (native) إعدادات ذلك التطبيق إن ضبطها: تحل لغة واجهات التضمين البرمجية وحجم نصها (`AppView::set_locale` و`set_font_scale` في Rust على [GPUI](./gpui.md) و[macOS](./macos.md) و[Linux](./linux.md) و[Windows](./windows.md)، و`locale` و`fontScale` في Swift على [iOS](./ios.md)، و`setLocale` و`setFontScale` في Java على [Android](./android.md)) محل لغة النظام وحجم نصه. تتبعها `locale()` و`Intl` و`fontScale()` والنص فورًا، كما تتبع تغيير النظام، وتعود قيم النظام عندما يمسحها التطبيق المُضمِّن. استخدمها عندما يتيح التطبيق الأصلي لمستخدميه اختيار لغة أو حجم نص خاص بهم.

<a id="in-the-background"></a>

## في الخلفية

يخبر `lifecycle()` (وهو نفسه في TSX) ما إذا كان المستخدم يستخدم التطبيق. قيمته `active` في المقدمة، و`inactive` عندما يظل التطبيق ظاهرًا لكن تطبيقًا أو نافذة أخرى تملك التركيز (أو يعرض النظام شيئًا فوقه: مبدّل التطبيقات، مكالمة واردة)، و`background` عندما لا يكون ظاهرًا: في الخلفية على الهاتف، أو مصغّرًا على سطح المكتب، أو علامة تبويب مخفية على الويب. وكما هي الحال مع كل دالة وصول، يحدّث ما قرأه، فيوقف effect بثًا مباشرًا أو استطلاعًا دوريًا أو فيديو مؤقتًا في الخلفية ويستأنفها عندما يعود المستخدم:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

استخدم `background` لإيقاف العمل مؤقتًا، واحفظ ما يغيّره المستخدم لحظة تغييره: فقد يعلّق النظام التطبيق بعد ثوانٍ من انتقاله إلى الخلفية، قبل أن يعمل effect يقرأ التغيير. يتبع التطبيق المعروض داخل تطبيق أصلي حالة ذلك التطبيق، وحيث يكون للتطبيق عدة نوافذ (iPad، سطح مكتب) يتبع العرض النافذة التي هو فيها. في الاختبارات، ينقل `app.setLifecycle("background")` من `nsh/test` التطبيق إلى هناك ([الاختبار](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## المناطق الآمنة

تغطي الشقوق (notches) ومؤشر الشاشة الرئيسية وشريط الحالة وشريط التنقل في Android وشريط عنوان Mac Catalyst أجزاءً من السطح. ترسم تطبيقات NSH من حافة إلى حافة على كل منصة، وتحصل على الأجزاء المغطاة في صورة هوامش (insets).

- `safe_area()` (TSX: `safeArea()`) يعطي هوامش السطح.
- `cx.insets()` الخاص بالمكوّن (TSX: `safeAreaInsets()`) يعطي الهوامش **في الموضع الذي يُعرض فيه المكوّن**: داخل [صفحة](./navigation.md#safe-areas-under-the-header) تنقّل تُقاس أسفل ترويستها، وداخل [حوار](../elements/dialog.md) تكون هوامش الحوار. فضّله في المكوّنات التي قد تظهر في أكثر من موضع.
- تضيف `env(safe-area-inset-top)` و`-right` و`-bottom` و`-left` في CSS حشوة أو مسافة لأي عرض بمقدار الهوامش في موضع عرضه، داخل `padding*` و`margin*` (يضيف `calc(env(safe-area-inset-bottom) + 8px)` طولًا؛ وفي Tailwind `pt-[env(safe-area-inset-top)]`؛ وفي Rust `.p_safe_area()` و`.pt_safe_area()` و`.pb_safe_area_plus(px(8.0))`، ...). تتحدث الحشوة أصليًا عند تغيّر الهوامش ([المنطقة الآمنة](../elements/safe-area.md)).

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

في Android، لا يحصل العرض المضمَّن أسفل شريط أدوات إلا على أجزاء أشرطة النظام التي تتداخل معه، كما في المنطقة الآمنة في UIKit: لا هامش علوي إن لم يصل إلى شريط الحالة.

<a id="the-platform"></a>

## المنصة

تصف `os()` و`os_version()` و`idiom()` و`is_desktop()` و`is_catalyst()` في Rust، والثابت `platform` من `nsh` في TSX، المكان الذي يعمل فيه التطبيق. وتبقى ثابتة طوال تشغيل التطبيق.

| Rust | TSX | الوصف |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`، `Os::Android`، `Os::MacOs`، `Os::Windows`، `Os::Linux` أو `Os::Web` (`os().name()` هي السلسلة النصية في TSX). Mac Catalyst هو iOS. |
| `os_version()` | `platform.version` | الرقمان الرئيسي والفرعي؛ وفي Android مستوى API و0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`، `Pad`، `Mac`، `Tv` أو `Desktop`؛ `Desktop` تمامًا حيث يتحقق `is_desktop()`. |
| `is_desktop()` | `platform.desktop` | macOS أو Windows أو Linux، أو متصفح سطح مكتب ([سطح المكتب والجوال](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst، في أي من نمطيه (idiom). |

`platform` في TSX كاملًا:

| العضو | الوصف |
|---|---|
| `platform.os` | `"ios"`، `"android"`، `"macos"`، `"windows"`، `"linux"` أو `"web"`. يُبلّغ Mac Catalyst عن `"ios"`. |
| `platform.version` | سلسلة نصية: في iOS وأنظمة سطح المكتب: إصدار نظام التشغيل (`"17.5"`)؛ في Android: مستوى API (`"35"`)؛ على الويب: `"0.0"`. |
| `platform.idiom` | `"phone"`، `"pad"`، `"mac"`، `"tv"` أو `"desktop"`. `"desktop"` تمامًا حيث يكون `platform.desktop` هو `true`. `"mac"` هو نمط Mac في UIKit تحت Mac Catalyst، وهو نمط جوال. |
| `platform.desktop` | ينطبق سلوك سطح المكتب: macOS وWindows وLinux ومتصفحات سطح المكتب. تتبعه خصائص `desktop={{…}}` و`platform.select({ desktop })`. |
| `platform.catalyst` | يعمل التطبيق تحت Mac Catalyst (`os` `"ios"`)، بنمط Mac أو iPad. |
| `platform.select(spec)` | القيمة لهذه المنصة؛ انظر [الشيفرة الخاصة بالمنصة](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

يعمل `nsh test` دون واجهة (headless) بوصفه iOS.

على [Linux](./linux.md)، تكون `platform.os` هي `"linux"`، والنمط `"desktop"`، و`platform.version` هو الإصدار الرئيسي والفرعي للنواة (`"6.12"`): فالتوزيعات ترقّم إصداراتها بطرق لا يمكن مقارنتها. وهناك تكون المنطقة الآمنة وارتفاع لوحة المفاتيح 0، ويتبع `colorScheme()` إعداد سطح المكتب (XDG settings portal) مباشرةً، ويتبع `fontScale()` تحجيم النص في سطح المكتب، ويتبع `pixelRatio()` مقياس الشاشة، بما فيه المقاييس الكسرية.

على [macOS](./macos.md) (واجهة AppKit الخلفية)، تكون `platform.os` هي `"macos"`، والنمط `"desktop"`، و`platform.version` هو إصدار macOS. المنطقة الآمنة وارتفاع لوحة المفاتيح 0، ويتبع `colorScheme()` مظهر النظام مباشرةً، وقيمة `fontScale()` هي 1، و`pixelRatio()` هو مقياس الدعم (backing scale) للشاشة.

على [Windows](./windows.md)، تكون `platform.os` هي `"windows"`، والنمط `"desktop"`، و`platform.version` هي `"10.0"`، في Windows 11 أيضًا (فقد أبقى Windows رقم الإصدار). المنطقة الآمنة وارتفاع لوحة المفاتيح 0، ويتبع `colorScheme()` Settings > Personalization > Colors مباشرةً، ويتبع `fontScale()` إعداد حجم النص (من 1 إلى 2.25)، ويتبع `reduceMotion()` إعداد تأثيرات الحركة، ويتبع `pixelRatio()` مقياس الشاشة، ويُنسّق `Intl` وفق التنسيق الإقليمي للمستخدم.

في المتصفح ([بيئة تشغيل الويب](./web.md))، تكون `platform.os` هي `"web"` و`platform.version` هي `"0.0"`. يكون النمط `"desktop"` مع الفأرة ونافذة بعرض 600 نقطة على الأقل، و`"pad"` على الجهاز اللوحي، و`"phone"` على الهاتف، ويُحدَّد عند بدء التطبيق. أما اللغة (locale) و`reduceMotion()` و`fontScale()` (حجم نص المتصفح) و`pixelRatio()` والمنطقة الآمنة وارتفاع لوحة المفاتيح فتأتي من المتصفح وتتبعه مباشرةً.

<a id="pixel-density"></a>

## كثافة البكسل

تحوّل `pixel_ratio()` و`round_to_nearest_pixel(points)` في Rust، و`pixelRatio()` من `nsh` في TSX، بين النقاط وبكسلات الجهاز.

| Rust | TSX | الوصف |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | بكسلات الجهاز لكل نقطة (2 أو 3 في معظم الهواتف)، تفاعلية. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | النقاط مقرّبة إلى أقرب بكسل جهاز. |

خط رفيع (hairline) بارتفاع بكسل جهاز واحد:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` و`pixelRatio()` تفاعليتان، لذا يتبع الخط الرفيع نافذةً نُقلت إلى شاشة ذات كثافة أخرى.

<a id="right-to-left"></a>

## من اليمين إلى اليسار

عندما تُكتب لغة الجهاز من اليمين إلى اليسار (العربية، العبرية، الفارسية، ...)، يرتّب NSH التطبيق من اليمين إلى اليسار: تمتد الصفوف من اليمين، وتأخذ خصائص النمط المنطقية جهاتها في الاتجاه من اليمين إلى اليسار، ويُحاذى النص إلى اليمين، وتنعكس الأدوات الأصلية. يتبع اتجاه التخطيط لغة المستخدم تلقائيًا. ويحدد نمط `direction` للعرض (`"ltr"` أو `"rtl"` أو `"inherit"`؛ `.direction(LayoutDirection::..)` في Rust) اتجاه شجرته الفرعية؛ وعلى العرض الجذر يحدد اتجاه التطبيق.

تُطبَّق التغييرات فورًا دون إعادة تشغيل التطبيق؛ والعرض التوضيحي في هذه الصفحة يبدّل نمط `direction`.

اكتب تخطيطات تعمل في الاتجاهين باستخدام الخصائص المنطقية: في Rust `ms` / `me` و`ps` / `pe` (بأسماء Tailwind)، وفي TSX `marginStart` / `marginEnd` و`paddingStart` / `paddingEnd` و`start` / `end` و`borderTopStartRadius` و`textAlign: "start"` وغيرها، وهي تعني اليسار واليمين في التخطيطات من اليسار إلى اليمين، والعكس في التخطيطات من اليمين إلى اليسار. أما `left` و`right` (`marginLeft` و`paddingRight` و`left` و`textAlign: "left"` ...) فتحتفظان بجهتيهما في الاتجاهين، كما في CSS. ويتجاوز نمط `direction` (`"inherit"` و`"ltr"` و`"rtl"`) الاتجاه لشجرة فرعية، مثلًا للإبقاء على رقم هاتف أو أزرار مشغّل وسائط من اليسار إلى اليمين. وتُطبَّق متغيرات Tailwind `rtl:` و`ltr:` بحسب الاتجاه.

تبدأ عروض التمرير الأفقي والقوائم من الطرف الأيمن في التخطيطات من اليمين إلى اليسار. وفي Android يجب أن يصرّح التطبيق المضيف بـ`android:supportsRtl="true"` في ملف manifest الخاص به كي تنعكس الأدوات الأصلية.

<a id="related"></a>

## ذات صلة

- [واجهة الجهاز في `nsh`](../modules/nsh.md#device): المرجع.
- [الشيفرة الخاصة بالمنصة](./platform-specific.md): `platform.select`، وخصائص المنصة ووحداتها.
- [إمكانية الوصول](./accessibility.md): قارئات الشاشة وتقليل الحركة.
- [المنطقة الآمنة](../elements/safe-area.md) و[لوحة المفاتيح](../elements/keyboard.md) و[شريط الحالة](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`، ومتغيرات نقاط التوقف والاتجاه.
