---
title: "نظرة عامة على المنصات"
description: "المنصات التي يعمل عليها NSH: iOS وAndroid وmacOS وWindows وLinux وGPUI والويب، لكل منها واجهة خلفية (backend) خاصة بها؛ وكيفية تشغيل تطبيق Rust أو TSX وتغليفه وتضمينه على كل منصة، وما يحتاجه كل منها."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---

# نظرة عامة على المنصات

يعمل NSH على الهواتف وأجهزة سطح المكتب والويب: iOS وAndroid وmacOS وWindows وLinux وGPUI وصفحات الويب. لكل منصة واجهة خلفية خاصة بها ترسم باستخدام واجهة المستخدم الأصلية للمنصة، فيكون التطبيق عناصر UIKit على iPhone، وعناصر AppKit على Mac، وعناصر GTK 4 على Linux، وعناصر GPUI في تطبيق GPUI، وHTML في المتصفح، مع نص المنصة وإدخالها وإمكانية الوصول فيها والوضع الداكن. كل ما يعلو الواجهة الخلفية مشترك: الرسم البياني التفاعلي والمُصيِّر وتخطيط Taffy والمكوّنات والوحدات الأصلية هي نفسها شيفرة Rust في كل مكان، لذلك يعمل تطبيق واحد على جميعها. التطبيق المكتوب بلغة Rust هو هذه الشيفرة مع الـ crate الخاص بك، دون آلة JavaScript الافتراضية؛ أما تطبيق TSX فيشغّل وحداته على QuickJS فوقها ([البناء باستخدام Rust](./rust.md)).

على كل منصة، يُستخدم التطبيق بطريقتين: إما مُحزَّمًا كتطبيق قابل للتثبيت على تلك المنصة (`nsh package`)، وإما مضمَّنًا في تطبيق أصلي خاص بك، سواء ربط المضيف جذر Rust أو حمّل TSX وقت التشغيل. وتطوّره باستخدام `nsh run` (تعديلات Rust تعيد بناء التطبيق وتشغيله، وتعديلات TSX تحديثات فورية).

<a id="at-a-glance"></a>

## نظرة سريعة

| المنصة | الواجهة الخلفية؛ النص | تعمل على | التطوير | التغليف |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit؛ CoreText | iOS 15.0+، الأجهزة والمحاكي | `nsh run --target ios` | `.app` (للمحاكي)، و`.ipa` موقّع |
| [Android](./android.md) | Android views؛ `StaticLayout` | Android 9 (API 28)+، `arm64-v8a`، `armeabi-v7a` و`x86_64` | `nsh run --target android` | `.apk` موقّع |
| [macOS](./macos.md) | AppKit وCore Animation؛ CoreText | macOS 14+ | `nsh run --target macos` | `.app` موقّع توقيعًا مؤقتًا (ad hoc) |
| [Windows](./windows.md) | نوافذ Win32 مرسومة باستخدام Direct2D؛ DirectWrite | Windows 10 1809+، Windows 11 | `nsh run` (الافتراضي على Windows) | مجلد و`.zip` |
| [Linux](./linux.md) | عناصر GTK 4؛ Pango | GTK 4.14+ | `nsh run` (الافتراضي على Linux) | مجلد و`.tar.gz` |
| [GPUI](./gpui.md) | GPUI؛ نظام النص في GPUI | macOS وWindows وLinux (Vulkan) | داخل تطبيق GPUI الخاص بك؛ وTSX أيضًا باستخدام `nsh run --target gpui` | داخل تطبيق GPUI الذي يضمّنه |
| [Web](./web.md) | HTML وCSS؛ خطوط المتصفح | المتصفحات الحديثة، على سطح المكتب والهاتف | `nsh run --target web` | موقع ثابت |

- **[GPUI](./gpui.md)** يرسم التطبيقات باستخدام [GPUI](https://gpui-kit.com)، إطار العمل الخاص بالمشروع الشقيق GPUI Kit، على macOS وWindows وLinux على حد سواء: وهو الواجهة الخلفية للتضمين في تطبيقات GPUI وGPUI Kit، التي تضع `AppView` الخاص بها في شجرة العناصر لديها. أما تطبيقات سطح المكتب المستقلة فتُشغَّل وتُغلَّف بالواجهة الخلفية الخاصة بكل نظام تشغيل (AppKit وWin32 وGTK 4).
- **[Web](./web.md)** يعرض التطبيقات بصيغة HTML في صفحة متصفح: يقوم `nsh package --target web` بنشر موقع ثابت لأي خادم ويب أو CDN، مع محرّك تطبيق Rust والـ crate الخاص به مُصرَّفَين إلى WebAssembly، وتضمّن صفحتك الخاصة تطبيقًا باستخدام `createPlayer` أو iframe. كما يشغّل العروض التجريبية الحية و[playground](/playground) على هذا الموقع.
- **Mac Catalyst** يشغّل الواجهة الخلفية لـ iOS في نافذة بحجم iPhone (390×844) على Mac، لأغراض التطوير. اخترها باستخدام `--target catalyst` لترى كيف يبدو التطبيق على الهاتف.

<a id="develop-and-package"></a>

## التطوير والتغليف

يختار `nsh run` منصة الجهاز نفسه عندما لا تحدد `--target`: AppKit على macOS، ونافذة GTK على Linux، ونافذة Win32 على Windows. تُستهدف الهواتف من الحاسوب: iOS من جهاز Mac مع Xcode، وAndroid من macOS أو Linux أو Windows مع Android SDK ([التثبيت](./installation.md#what-works-where)).

يُشغَّل تطبيق Rust (يحدد `nsh.json` فيه مكوّن `"root"`) ويُغلَّف من مجلده: يبني `nsh` المشغّل الخاص بالتطبيق للهدف، مع الـ crate الخاص بك ودون QuickJS. أما تطبيق TSX فيحدد نقطة دخوله:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

يغلّف كل نظام تشغيل لسطح المكتب التطبيقات بواجهته الخلفية الخاصة، وتُبنى للجهاز الذي تعمل عليه: غلّف تطبيق Mac على Mac، وتطبيق Windows على Windows، وتطبيق Linux على Linux. يغطي [التغليف](./packaging.md) مخرجات كل هدف والتوقيع والأيقونات.

<a id="embed-in-a-native-app"></a>

## التضمين في تطبيق أصلي

| المنصة | عرض المضيف | يشغّل | يُوزَّع على شكل | لغة المضيف |
|---|---|---|---|---|
| macOS | `AppView` (`NSView`) | جذر Rust وحزم TSX | الـ crate `nsh-platform-macos` | Rust |
| Windows | `AppView` (نافذة فرعية) | جذر Rust وحزم TSX | الـ crate `nsh-platform-windows` | Rust |
| Linux | `AppView` (عنصر GTK) | جذر Rust وحزم TSX | الـ crate `nsh-platform-linux` | Rust |
| GPUI (macOS وWindows وLinux) | `AppView` (عرض GPUI) | جذر Rust وحزم TSX وحزم موقّعة | الـ crate `nsh-platform-gpui` | Rust |
| iOS | `AppView` (`UIView`) | جذر Rust وحزم TSX | الـ crate `nsh-platform-ios` | Rust |
| iOS | `NshAppView` (`UIView`) | حزم TSX وحزم موقّعة | `NativeShell.xcframework` | Swift |
| Android | `NshView` (`FrameLayout`) | حزم TSX وحزم موقّعة | `nsh.aar` | Java أو Kotlin |
| Web | `createPlayer` (عنصر في الصفحة) أو iframe | حزم TSX؛ وتطبيق Rust كموقعه المنشور | ملفات وقت التشغيل من `nsh package --target web` | JavaScript أو HTML |

يركّب مضيف Rust جذر Rust (`Root::of::<App>()`) على شكل `AppSource::Rust` أو `App::Rust`، ويزوّد محرّكاته بمجموعات واجهة المستخدم الخاصة بالتطبيق باستخدام `set_ui_sets`، فيستورد TSX الذي يحمّله مكوّنات التطبيق ووحداته الخاصة. كل عرض هو محرّك واحد، ويمكن للتطبيق أن يعرض عدة محرّكات. ويسجّل المضيف عروضه الأصلية الخاصة لتستخدمها التطبيقات على كل منصة ([المكوّنات الأصلية](./native-components.md)).

> [!NOTE]
> تضمّن مضيفات Rust الـ NSH باستخدام crates المنصات من مستودع NSH؛ ويحمّل `AppView` على macOS وWindows وLinux الحزم من ملفات التطبيق نفسه (أو من شيفرته المصدرية)، بالحدود الافتراضية. كما تحمّل الـ crate الخاصة بـ GPUI وحزما SDK لنظامي iOS وAndroid [الحزم الموقّعة](./signed-packages.md) وتضبط الحدود والصلاحيات لكل عرض ([العزل والصلاحيات](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## الكتابة لكل المنصات

لا يحتاج معظم التطبيق إلى فحوص للمنصة: العناصر والأنماط والتخطيط والوحدات تتصرف بالطريقة نفسها في كل مكان. وحيثما تختلف المنصات، يمنح NSH الاختلاف موضعًا واحدًا ([الشيفرة الخاصة بالمنصة](./platform-specific.md)):

- **تخبرك البيئة أين يعمل التطبيق**: في Rust `os()` و`idiom()` و`is_desktop()` (`nsh_core::prelude`)، وفي TSX `platform.os` و`platform.idiom` و`platform.desktop` و`platform.select` من `nsh`. ونظام التشغيل هو iOS أو Android أو macOS أو Windows أو Linux أو الويب.
- **الخصائص الخاصة بمنصة معينة** توضع في `ios={{…}}` أو `android={{…}}` أو `web={{…}}` أو `desktop={{…}}` في TSX (`desktop`: macOS وWindows وLinux ومتصفحات سطح المكتب).
- **الإدخال يتبع المنصة.** تحصل الهواتف على اللمس ولوحة المفاتيح البرمجية؛ وتحصل أجهزة سطح المكتب على الفأرة ولوحة اللمس ولوحة المفاتيح.

تُرسم مكوّنات التطبيق باستخدام عناصر NSH الأساسية، لذلك تعمل على أجهزة سطح المكتب كما تعمل على الهواتف، وتبدو متماثلة في الاثنين. يُبنى تخطيط سطح المكتب من العناصر الأساسية (`view` و`text` و`scroll` و`virtual_list` وغيرها؛ `View` و`Text` و`Scroll` و`List` وغيرها في TSX) مع فحص لسطح المكتب، كما هو الحال في تخطيط سطح المكتب في المعرض:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

تسرد كل واجهة خلفية ما تفعله بطريقتها الخاصة: [macOS](./macos.md#what-differs-on-macos) و[Windows](./windows.md#what-differs-on-windows) و[Linux](./linux.md#what-differs-on-linux) و[GPUI](./gpui.md#differences).

<a id="see-also"></a>

## انظر أيضًا

- [البدء](./getting-started.md): أول تطبيق، يعمل على كل منصة.
- [البناء باستخدام Rust](./rust.md): تطبيقات مكتوبة بلغة Rust، وRust مع TSX.
- [التثبيت](./installation.md): الأدوات التي تحتاجها كل منصة.
- [البنية](./architecture.md): ما هو مشترك وما تفعله كل واجهة خلفية.
