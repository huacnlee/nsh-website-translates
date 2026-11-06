---
title: "التعليمات البرمجية الخاصة بكل منصة"
description: "كتابة تطبيق واحد للهواتف وأجهزة سطح المكتب والمتصفحات - خصائص خاصة بمنصة معينة داخل ios={{}} / android={{}} / desktop={{}} / web={{}}، والوحدتان nsh/mobile وnsh/desktop، وplatform.os وplatform.select، ومتغيّرات Tailwind الخاصة بكل منصة."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# الشيفرة الخاصة بكل منصة

تعمل حزمة NSH واحدة على iOS وAndroid وmacOS وWindows وLinux (وفي Mac Catalyst)، وفي المتصفحات عبر [بيئة تشغيل الويب](./web.md). لا يحتاج معظم التطبيق إلى أي فحوصات للمنصة: فالعناصر والأنماط والتخطيط والوحدات تتصرف بالطريقة نفسها في كل مكان، والمكونات التي تبنيها منها تبدو متطابقة في كل مكان. وعندما يكون شيء ما خاصًا بمنصة واحدة فعلًا، يمنحه NSH مكانًا واضحًا، بحيث تبقى شيفرة المنصة ظاهرة ومحصورة:

| Rust | TSX | الاستخدام |
|---|---|---|
| [دوال البناء (`.ripple(..)`، `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`، `android={{…}}`، `desktop={{…}}`، `web={{…}}`](#platform-only-props) | الخصائص التي تتوفر على منصة واحدة فقط. |
| [`on_back_press`، `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`، `nsh/desktop`](#platform-modules) | واجهات برمجية تتوفر على المنصات المحمولة فقط أو على أجهزة سطح المكتب فقط. |
| [`os()`، `idiom()`، `is_desktop()`](#platformos-and-platformselect) | [`platform.os`، `platform.desktop`، `platform.select`](#platformos-and-platformselect) | اختيار القيم أو الشيفرة حسب المنصة. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [فئات `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | أنماط خاصة بكل منصة. |

<a id="desktop-and-mobile"></a>

## سطح المكتب والجوال

كل منصة هي إما سطح مكتب أو جوال، وفق قاعدة واحدة. سطح المكتب هو macOS وWindows وLinux، والمتصفحات بنمط سطح المكتب (فأرة ونافذة عريضة، [الويب](./web.md)). أما الجوال فهو iOS وAndroid، والمتصفحات بنمط الهاتف أو الجهاز اللوحي؛ ويشغّل Mac Catalyst واجهة iOS الخلفية، فهو جوال أيضًا، مع خصائص `ios={{…}}`. وتتبع هذه القاعدة خصائص `desktop={{…}}` و`platform.select({ desktop, mobile })` و`platform.desktop` و`platform.idiom === "desktop"` جميعها، وكذلك مكونات `nsh/base` (القائمة نافذة منبثقة على أجهزة سطح المكتب وورقة سفلية على الجوال)، وفي Rust أيضًا `is_desktop()`.

أما `isAvailable` في `nsh/desktop` فيجيب عن سؤال أضيق: هل تعمل واجهات النافذة والقوائم في تلك الوحدة، وهي تعمل على macOS وWindows وLinux. استخدم `platform.desktop` للتحكم في التخطيط والكثافة والإدخال، واستخدم `isAvailable` للتحكم في استدعاءات `Window` و`Menu`.

<a id="platform-only-props"></a>

## الخصائص الخاصة بمنصة واحدة

في Rust، الخاصية التي تتوفر على منصة واحدة هي دالة بناء كأي دالة أخرى (`.ripple(..)`، و`.elevation(..)` لـ Android، و`.input_accessory(..)` لـ iOS، و`.window_drag(..)` لأجهزة سطح المكتب)؛ وتتجاهلها المنصات الأخرى. أما في TSX فتُجمع الخصائص الموجودة على منصة واحدة فقط في كائن يحمل اسمها. يقبل كل عنصر `ios` و`android` و`desktop` (macOS وWindows وLinux، والمتصفحات بنمط سطح المكتب) و`web` (المتصفحات)؛ وعلى المنصات الأخرى يُتجاهل الكائن، وعلى منصته الخاصة تُطبَّق مفاتيحه وحدها. ويطبّق متصفح سطح المكتب كلًّا من `desktop` و`web`.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

كائنات TSX تفاعلية كأي خاصية؛ والمفتاح الذي يُحذف من الكائن يُمسح أثره.

ما هو متوفر حاليًا:

| Rust | TSX | على | الوصف |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | كل عنصر | تأثير التموّج (ripple) المادي أثناء الضغط: اللون، وبلا حدود، ونصف القطر، والمقدمة. |
| `.elevation(..)` | `android={{ elevation }}` | كل عنصر | الظل المادي، بالنقاط، انطلاقًا من شكل العرض. |
| | `android={{ accessibilityLiveRegion }}` | كل عنصر | `"none"` أو `"polite"` أو `"assertive"`: يعلن TalkBack عن تغيّرات العرض. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | يمتد محتوى مربع الحوار أسفل شريط الحالة. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | `InputAccessoryView` الذي يظهر فوق لوحة المفاتيح. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | أسماء iOS لأنواع الملء التلقائي (`AutoFill` في Rust يغطي المنصتين). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | الاتجاهات التي يسمح بها. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | السحب للرجوع والتقدم في سجل الصفحات. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | زر شريط UIKit الأصلي في نهاية الترويسة، ويستدعي عند الضغط `headerRight`. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | زر شريط UIKit الأصلي في بداية الترويسة، ويستدعي عند الضغط `headerLeft`. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | زر شريط UIKit الأصلي الذي يعرض SF Symbol في نهاية الترويسة، ويستدعي عند الضغط `headerRight`. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | زر شريط UIKit الأصلي الذي يعرض SF Symbol في بداية الترويسة، ويستدعي عند الضغط `headerLeft`. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | على macOS: تُرجع حركات السحب بإصبعين على لوحة اللمس وتُقدِّم في سجل الصفحات؛ وعلى Windows: حركات السحب على شاشة اللمس؛ وعلى Linux: حركات السحب على لوحة اللمس. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | كل عنصر | الضغط عليه يسحب النافذة، كما يفعل شريط العنوان في النظام (انظر [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

في TSX، يُقبل `desktop={{…}}` و`web={{…}}` في كل مكان. وتخبر الأنواع (`IOSProps` و`AndroidProps` و`DesktopProps` وصيغها الخاصة بكل عنصر) محرّرك بما يقبله كل عنصر.

ما يعنيه العنصر على كل المنصات هو خاصية من المستوى الأعلى (وفي Rust دالة بالاسم نفسه)، وتُطبَّق حيث يكون لها معنى: فـ `title` و`headerStyle` و`headerLargeTitle` و`headerBackTitle` في `NavPage` تُعدّ ترويسة النظام في iOS وAndroid، وخانتها `header` هي ترويسة أجهزة سطح المكتب والويب، و`presentation` في `Dialog` تختار أوراق iOS السفلية. أما `closeOnBackdropPress` و`pagingEnabled` و`refreshing` و`hitSlop` وغيرها في `AlertDialog.show` فتعمل على كل المنصات. وميزة النظام الخاصة بمنصة تُوضع في كائنها، وعندما تتوفر على عدة منصات توضع في كائن كل منها بالاسم نفسه: فـ `allowsBackForwardNavigationGestures` في `WebView`، وهي حركات النظام للتنقل في سجل الصفحات، موجودة في `ios={{…}}` و`desktop={{…}}`.

<a id="platform-modules"></a>

## وحدات المنصات

في Rust، الواجهات التي تتوفر على منصة واحدة فقط هي دوال في `nsh_core::prelude` (`on_back_press`، `input_accessory_view`) وفي `nsh_core::element::desktop` (النافذة: `set_title`، `set_title_bar`، `title_bar`، `minimize`، `toggle_maximize`، `toggle_full_screen`، `set_frame`، `set_level`، `order_front`، `close_window`؛ والقوائم: `set_application_menu`، `popup_menu`)؛ وفي غيرها لا تفعل شيئًا. وفي TSX، تحوي `nsh/mobile` واجهات iOS وAndroid (بعضها يخص منصة واحدة)، وتحوي `nsh/desktop` واجهات أجهزة سطح المكتب. يمكن استيراد الاثنتين على كل المنصات، فتعمل حزمة واحدة في كل مكان: على المنصات الأخرى تعود دوالهما فورًا ولا تشغل مكوناتهما أي مساحة. وتصدّر كل منهما `isAvailable`، وهي `true` على منصاتها الخاصة؛ ويميّز `platform.os` بينهما.

### nsh/mobile

`isAvailable` هي `true` على iOS (مع Mac Catalyst) وAndroid. وتتوفر على المنصتين [`TabBar`](../modules/nsh-mobile.md#tabbar)، وهي شريط علامات التبويب في النظام.

#### BackHandler (Android)

| Rust | TSX | الوصف |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | يستمع إلى زر الرجوع بعد مربعات الحوار وقبل المكدسات؛ أعد `true` عند المعالجة. يرتبط المستمع بالمكون (أو التأثير) الذي أضافه؛ وفي TSX يعيد الاستدعاء أيضًا دالة توقفه مبكرًا. |
| | `BackHandler.exitApp()` | يغادر التطبيق. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

يعالج مربع الحوار العلوي زر الرجوع أولًا، ثم مستمعو الرجوع (الأحدث أولًا)، ثم مكدس التنقل العلوي، ويخرج التطبيق إذا لم يعالجه أحد. انظر [التنقل](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | الوصف |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | شريط فوق لوحة المفاتيح لحقول الإدخال التي تذكر معرّفها الأصلي (`.input_accessory(..)`، `ios={{ inputAccessoryViewID }}`). |

انظر [النماذج ولوحة المفاتيح](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

ترسم تطبيقات Rust أشرطة العنوان الخاصة بها باستخدام `nsh_core::element::desktop` ([البناء باستخدام Rust](./rust.md#desktop-title-bars)). وهذه وحدة TSX:

| التصدير | الوصف |
|---|---|
| `Window` | النافذة: `setTitle`، و`setTitleBar({ style: "hidden" })` لشريط عنوان خاص بالتطبيق، و`minimize`، و`toggleMaximize`، و`toggleFullScreen`، و`close`. |
| `titleBar` | ارتفاع شريط العنوان المخفي والمساحة التي تشغلها عناصر تحكم النافذة في النظام (تفاعلي). |
| `Menu` | `setApplicationMenu(items)` (شريط القوائم، مع الاختصارات) و`popup(items, at?)` (القوائم السياقية). |
| `isAvailable` | `true` حيث تعمل واجهات النافذة والقوائم: macOS وWindows وLinux. أما متصفحات سطح المكتب فلها `platform.desktop` وتحتفظ بنافذة المتصفح وقوائمه. |

انظر [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### شريط الحالة

على المنصتين، يتبع شريط الحالة الصفحة أو مربع الحوار العلوي، كما في UIKit حيث يقرره متحكم العرض الأعلى: [`NavPage` و`Dialog` يقبلان `statusBar`](../modules/nsh-base.md#status-bar) (وفي Rust `.status_bar(StatusBarStyle::Light)`، أو `StatusBarSetting` لبقية الحقول) مع `foreground` (`"auto"`، و`"light"` للخلفيات الداكنة، و`"dark"` للفاتحة) و`hidden` و`animated`. تفوز الصفحة أو مربع الحوار الأحدث عرضًا، حقلًا بحقل، وحين تزول يُطبَّق ما تحتها من جديد. و`"statusBar"` في `nsh.json` هو الإعداد الافتراضي للتطبيق تحتها.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

في تطبيق مدمج داخل تطبيق أصلي، يقرر متحكم العرض في التطبيق المضيف شريط الحالة على iOS. والتطبيق الذي يصرّح بـ `"capabilities"` في `nsh.json` يحتاج إلى `"statusBar": true` لتغييره.

<a id="platformos-and-platformselect"></a>

## platform.os وplatform.select

يخبرك `os()` في Rust والثابت `platform` من `nsh` في TSX بمكان تشغيل التطبيق: `Os::Ios` أو `Os::Android` أو `Os::MacOs` أو `Os::Windows` أو `Os::Linux` أو `Os::Web`، و`platform.os` `"ios"` أو `"android"` أو `"macos"` أو `"windows"` أو `"linux"` أو `"web"` (Mac Catalyst هو `"ios"`، مع `platform.catalyst` في أي من نمطيه؛ و[الواجهة الخلفية لـ macOS](./macos.md) هي `"macos"`، و[الواجهة الخلفية لـ Linux](./linux.md) هي `"linux"`، و[الواجهة الخلفية لـ Windows](./windows.md) هي `"windows"`، وتطبّق عناصرها خصائص `desktop`؛ و[المتصفحات](./web.md) هي `"web"`، وتطبّق خصائص `desktop` أيضًا عندما يكون `platform.desktop` هو `true`). انظر [الجهاز والبيئة](./device-and-environment.md#the-platform) للإصدار والنمط وغيرهما.

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

في Rust يختار `match os()` القيمة، مع `is_desktop()` لأجهزة سطح المكتب. وفي TSX تعيد `platform.select(spec)` القيمة الخاصة بهذه المنصة. وهي تبحث عن مفتاح نظام التشغيل نفسه، ثم `desktop` أو `mobile` وفق [القاعدة أعلاه](#desktop-and-mobile) (`platform.desktop`)، ثم `native` (كل المنصات عدا الويب)، ثم `default`:

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

وتعيد `undefined` عندما لا يتطابق شيء ولا يوجد `default`.

<a id="rendering-different-components"></a>

### عرض مكونات مختلفة

اختر المكونات بالطريقة نفسها، على مستوى الوحدة (TSX) عندما لا يتغير الاختيار أبدًا:

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

أو ضمن الشيفرة مباشرة باستخدام [`when` / `<If>`](../elements/control-flow.md):

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## متغيرات المنصات في Tailwind

تنسّق Rust الأنماط لكل منصة باستخدام `.when(os() == Os::Ios, |v| ..)`؛ وفي TSX تطبّق المتغيرات `ios:` و`android:` و`web:` الفئات على منصة واحدة:

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## فضّل السلوك المشترك

قبل اللجوء إلى فحص المنصة، فكّر فيما إذا كان الاختلاف يهم مستخدميك. فالعناصر والأنماط تُطابَق أصلًا مع السلوك الأصلي لكل منصة حيث ينبغي أن يختلف (فيزياء التمرير، وعرض النصوص، ولوحات المفاتيح، وإمكانية الوصول)، وتبقى متطابقة حيث يتوقع المستخدمون الاتساق (مظهر تطبيقك الخاص). وأفضل استخدام لفحوصات المنصة هو للأعراف التي يعتمد عليها المستخدمون: زر الرجوع في Android ورسائل toast، وأوراق iOS السفلية والعناوين الكبيرة، وأسماء الملء التلقائي، وتأثير ripple في Android.

<a id="related"></a>

## ذو صلة

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) و[`BackHandler`](../modules/nsh-mobile.md#backhandler): المراجع.
- [واجهة الجهاز في `nsh`](../modules/nsh.md#device): `platform`.
- [المكونات الأصلية](./native-components.md): استخدام العروض التي يوفرها تطبيقك المضيف على كل منصة.
- [Tailwind](./tailwind.md): كل المتغيرات.
