---
title: "البدء"
description: "أنشئ تطبيقًا بلغة Rust أو TSX باستخدام nsh init، وشغّله على iOS وAndroid وmacOS وWindows وLinux أو على الويب، واستضف وحدات TSX داخل تطبيقك وانشرها كحزم موقّعة، أو قم بتجميع التطبيق بشكل مستقل."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---

# البدء

يُنشئ هذا الدليل تطبيق NSH، ويشغّله على المنصات التي تستهدفها، ثم ينشره. تُكتب تطبيقات NSH بلغة Rust أو TSX، على المحرك نفسه: يُترجم Rust تطبيقك إلى شيفرة أصلية بلا آلة JavaScript افتراضية، ويعمل TSX على QuickJS مع تحديثات فورية، في صورة وحدات يستطيع التطبيق الأصلي تحميلها وقت التشغيل. يتناول الدليل تطبيق Rust أولاً، ثم التطبيق نفسه بلغة TSX. ويفترض أن `nsh` مثبّت وموجود في `PATH` ([التثبيت](./installation.md))؛ وفي نسخة مستنسخة من المستودع استخدم `./target/debug/nsh` بدلاً منه.

> [!TIP]
> لا يوجد مشروع تطبيق بين يديك؟ لا يحتاج القسمان الأولان إلى أي مشروع: يعرض `nsh run` التطبيق في نافذة على حاسوبك، أو في محاكي iOS، أو على جهاز Android، أو في المتصفح. يمكنك التوقف هنا، أو [حزم التطبيق كتطبيق مستقل](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## إنشاء تطبيق

في الطرفية، يسأل `nsh init` عن اللغة التي يُكتب بها التطبيق: `rust` أو `ts` أو `mixed` (TSX مع حزمة Rust خاصة به). ويختار `--template` من دون سؤال.

<a id="in-rust"></a>

### بلغة Rust

```sh
nsh init my-app --template rust
```

ينشئ `nsh init` المجلد ويكتب مشروع Cargo:

| الملف | ما هو |
|---|---|
| `src/lib.rs` | التطبيق: مكوّنه الجذر وحالته ومعالجاته |
| `src/main.rs` | يركّب الجذر نفسه على macOS أو Windows أو Linux من أجل `cargo run` |
| `Cargo.toml` | الحزمة، وتعتمد على `nsh-core` و`nsh-base` بإصدار CLI نفسه |
| `nsh.json` | اسم التطبيق ومعرّفه وإصداره ورقم البناء، وحزمته (`"rust": "."`) ومكوّنه الجذر (`"root": "App"`) ([بنية المشروع](./project-structure.md#nshjson)) |
| `App.test.tsx` | اختبار الجذر، بلغة TypeScript (`nsh test`)، مع `tsconfig.json` و`.nsh/types` لمحررك |
| `README.md` | كيفية تشغيل التطبيق واختباره وحزمه، وكيفية إضافة نقطة دخول TSX لاحقاً |
| `.gitignore` | يتجاهل `.nsh/` و`target/` |

يتطلب التطوير بلغة Rust سلسلة أدوات Rust ([rustup](https://rustup.rs))؛ وتبني أوامر `nsh` مشغّلات التطبيق من حزم NSH على crates.io، بإصدار CLI نفسه.

<a id="in-tsx"></a>

### بلغة TSX

```sh
nsh init my-app --template ts
```

تطبيق TSX هو ملف `.tsx` واحد أو أكثر مع نقطة دخول: وهي ما يشغّله `nsh run`، وما يحمّله التطبيق المضيف كوحدة.

| الملف | ما هو |
|---|---|
| `App.tsx` | وحدة الدخول: تعرض التطبيق باستخدام `mount` |
| `App.test.tsx` | اختباره (`nsh test`) |
| `nsh.json` | اسم التطبيق ومعرّفه وإصداره ورقم البناء ([بنية المشروع](./project-structure.md#nshjson)) |
| `tsconfig.json` | يمدّد `.nsh/tsconfig.json`، وهو إعدادات TypeScript الخاصة بـ NSH، التي تحلّ `nsh` إلى التصريحات الموجودة في `.nsh/types` |
| `.gitignore` | يتجاهل `.nsh/` و`target/` |
| `.nsh/types/` | تصريحات مولَّدة لكل وحدات NSH، من أجل محررك |

تُحفظ الملفات الموجودة أصلاً، فيمكنك تشغيله في مجلد يحوي بعضها؛ أما تطبيق Rust فيُنشأ في مجلد جديد.

في الحالتين، يكون اسم العرض افتراضياً اسم المجلد؛ مرّر `--name "My App"` لاختيار اسم آخر. ويصبح المعرّف `com.example.<name>`: غيّره في `nsh.json` قبل النشر. وينشئ `nsh init my-app --template mixed` تطبيق TSX هو أيضاً حزمة Rust (`Cargo.toml` و`src/lib.rs` بجانب `App.tsx`)، ويستورد `App.tsx` مكوّنها ووحدتها وصنفها ([البناء باستخدام Rust](./rust.md)).

<a id="the-root-component"></a>

### المكوّن الجذر

يُنتج القالبان التطبيق نفسه، وهو عدّاد:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

في Rust:

- يجلب **`use nsh_core::prelude::*`** العناصر الأولية (`view()` و`text()` و`scroll()` و`input()` و`image()` ...) و[الإشارات](./reactivity.md) وطرق الأنماط المصنّفة (يضيف `.p_safe_area()` حشوة إلى العرض بمقدار [المنطقة الآمنة](../elements/safe-area.md))؛ ويحوي **`nsh_base`** المكوّنات الأساسية غير المنسّقة (`button()` ولوحة المفاتيح والحوارات) و`theme()`، أي الألوان وأنصاف الأقطار التي ترسم بها مكوّنات التطبيق ([السمة](./rust.md#theme)).
- **`#[component] pub fn App()`** مكوّن: دالة تعمل **مرة واحدة** وتُرجع عناصرها. يسمّيه `"root": "App"` الخاص بـ `nsh.json`، ويركّبه `nsh run`. ويُنشئ `signal(0_u32)` قيمة تتغير مع الزمن.
- **`text(move || format!(…, count.get()))`** يربط النص بالإشارة: عندما يتغير `count`، يشغّل NSH هذا الإغلاق (closure) مرة أخرى ويحدّث هذا النص وحده، ولا شيء غيره. وتقبل الأنماط إغلاقات بالطريقة نفسها: يتبع `.bg(move || theme().primary)` السمة إلى الوضع الداكن.
- **`.on_press(..)`** يجعل العرض يستجيب للضغط؛ و`.active(|s| s.opacity(0.6))` هو نمطه أثناء الضغط، ويُطبَّق أصلياً. الزر هنا من صنع التطبيق نفسه: يوفّر NSH العناصر الأولية والقدرات، ويرسم التطبيق واجهته منها.
- **`.px_5()` و`.rounded(px(10.0))` و`.gap_4()`** طرق أنماط مصنّفة سُمّيت كما تُسمّى أدوات Tailwind المساعدة، بالنقاط (`px`). التخطيط يعتمد flexbox، ويرصّ الأبناء في عمود افتراضياً ([التخطيط](./layout.md)).
- **`#[native_module("my-app/native")]`** يسمّي ما يجوز لنقطة دخول TSX استيراده من الحزمة، لحين إضافة شاشات TSX فوقها ([البناء باستخدام Rust](./rust.md#extending-a-rust-app-with-tsx)).

في TSX:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` هي الوحدة الأساسية: الإشارات و`mount` والعناصر الأولية التفاعلية الأخرى والعناصر المضيفة. تقدّمها بيئة التشغيل الأصلية ولا تُضمَّن في الحزمة. ويحوي **`nsh/base`** المكوّنات الأساسية، كما يفعل `nsh_base` في Rust.
- **`function App()`** مكوّن يعمل **مرة واحدة**. و**`{count()}`** يقرأ الإشارة داخل JSX: يرى المترجم استدعاءً فيجعل هذا النص يتبع الإشارة.
- **`<View onPress>`** عرض أصلي يتفاعل مع الضغط؛ وأصناف `active:` هي نمطه أثناء الضغط. أما `View` و`Text` و`Image` و`Scroll` وغيرها من [العناصر المضيفة](../elements/index.md) فتُستورد من `nsh` (و`Input` من `nsh/base`)؛ ولا يحتاج إلى استيراد سوى `If` و`Each`.
- يقبل **`class`** أصناف [Tailwind](./tailwind.md)؛ ويقبل `style={{ … }}` كائناً من خصائص الأنماط بصيغة camelCase، بأرقام بالنقاط. وتسمّي `bg-background` و`bg-primary` و`text-primary-foreground` و`rounded-(--radius)` رموز سمة التطبيق ([رموز السمة](./tailwind.md#theme-tokens)): وهي تتبع الوضع الداكن من تلقاء نفسها، ويعيد `"theme"` في `nsh.json` تنسيقها.
- **`mount(App)`** يعرض المكوّن في سطح التطبيق.

> [!IMPORTANT]
> يظهر النص داخل عنصر نصي: `text(..)` في Rust، و`<Text>` في TSX. في TSX، يُعدّ النص المكتوب مباشرة داخل `<View>` (`<View>Hello</View>`) خطأ بناء يشير إليه، وتُسجَّل في السجل أي سلسلة نصية يضعها تعبير هناك (`<View>{name}</View>`).

<a id="develop-it"></a>

## التطوير

<a id="run-it"></a>

### التشغيل

يبني `nsh run` التطبيق ويشغّله ويعيد البناء أثناء التعديل؛ وتظهر سجلات التطبيق في الطرفية. أعطه مجلد التطبيق: فهو يشغّل جذر تطبيق Rust، أو `App.tsx` الخاص بتطبيق TSX (ويسمّي `nsh run my-app/App.tsx` نقطة دخول أخرى).

في تطبيق Rust، يبني `nsh run` مشغّل التطبيق الخاص بالهدف، مع حزمتك والجذر المركّب ودون QuickJS، ثم يشغّله؛ وأي تغيير في شيفرة Rust يعيد البناء ويعيد تشغيل التطبيق. ويشغّل `cargo run` في مجلد التطبيق الجذر نفسه مباشرة على خلفية سطح المكتب. أما في تطبيق TSX، فيشغّل `nsh run` خادم تطوير ومضيف تطوير يحمّل التطبيق منه، ويرقّع التطبيق العامل عند كل حفظ.

من دون `--target`، يستخدم `nsh run` الجهاز الذي أنت عليه: نافذة AppKit على macOS، ونافذة Win32 على Windows، ونافذة GTK على Linux. اختر منصة أخرى باستخدام `--target`:

| الهدف | الأمر | يعمل من |
|---|---|---|
| محاكي iOS | `nsh run my-app --target ios` | macOS مع Xcode |
| Android | `nsh run my-app --target android` | macOS وWindows وLinux |
| macOS (AppKit) | `nsh run my-app` | macOS (الافتراضي) |
| Windows | `nsh run my-app` | Windows (الافتراضي) |
| Linux (GTK 4) | `nsh run my-app` | Linux (الافتراضي) |
| الويب | `nsh run my-app --target web` | macOS وWindows وLinux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### محاكي iOS

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

يستخدم `nsh` محاكياً يعمل، أو يشغّل أحدث iPhone إن لم يكن أي محاكٍ قيد التشغيل، ثم يثبّت التطبيق فيه (مشغّل تطبيق Rust، أو مضيف التطوير). ويختار `--device` محاكياً بالاسم أو بـ UDID.

#### Android

```sh
nsh run my-app --target android
```

شغّل محاكياً أو وصّل جهازاً أولاً (يسردها `adb devices`؛ ويستخدم NSH أولها). يثبّت `nsh` التطبيق عليه: `libnsh.so` الخاص بتطبيق Rust، أو APK مضيف التطوير (لا يُعاد بناؤه إلا عند تغيّر بيئة التشغيل) الذي يُمرَّر منفذ خادم التطوير الخاص به إلى الجهاز بواسطة `adb reverse`، فيعمل عبر USB دون شبكة مشتركة.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

يُفتح التطبيق كتطبيق Mac لسطح المكتب (AppKit، في نافذة قابلة لتغيير الحجم)، مع إدخال بالفأرة ولوحة اللمس ولوحة المفاتيح بدلاً من اللمس. ويتطلب macOS 14 أو أحدث؛ راجع [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (الافتراضي على Windows)

```sh
nsh run my-app
```

يُفتح التطبيق في نافذة سطح مكتب (1200×800 نقطة)، مع إدخال بالفأرة ولوحة اللمس واللمس ولوحة المفاتيح. ويتطلب Windows 10 الإصدار 1809 أو أحدث؛ راجع [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (الافتراضي على Linux)

```sh
nsh run my-app
```

يُفتح التطبيق في نافذة GTK (390×844 نقطة). ويتطلب GTK 4.14 أو أحدث؛ راجع [Linux](./linux.md).

<a id="web"></a>

#### الويب

```sh
nsh run my-app --target web
```

يطبع `nsh` عنوان الصفحة؛ افتحه في متصفح. يعمل تطبيق Rust بصيغة WebAssembly مع حزمتك، وتحمّل الصفحة المفتوحة البناء الجديد من تلقاء نفسها بعد كل تغيير؛ راجع [الويب](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

يُفتح التطبيق في نافذة بحجم iPhone (390×844 نقطة) على جهاز Mac. وهذه أسرع طريقة لرؤية التطبيق كما يظهر على الهاتف: لا حاجة إلى تشغيل محاكٍ. وهو يستخدم UIKit مثل iOS، فما تراه هو ما يعرضه iPhone، باستثناء السلوك الخاص بنظام Mac مثل التمرير بعجلة الفأرة. أما لتطبيق Mac نفسه، فاستخدم `--target macos`.

<a id="edit-it"></a>

### التعديل

اترك `nsh run` يعمل وغيّر نص الزر:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

احفظ. يُعاد بناء تطبيق Rust ويُعاد تشغيله بالنص الجديد؛ ويبدأ العدّاد من جديد. أما تطبيق TSX فيتلقى تحديثاً فورياً: يعيد CLI البناء ويرسل رقعة، وينفّذ المضيف الوحدة المتغيرة مرة أخرى ويعيد عرض المكوّنات التي تغيّرت شيفرتها فقط. وهو هنا `App`، الذي يملك الإشارة `count`، فيبدأ العدّاد من جديد أيضاً.

يمكن نقل أجزاء من الواجهة إلى مكوّنات خاصة بها، أو إلى دوال عادية تُرجع عناصر:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

في TSX، تبقى الحالة عند تعديل مكوّن لا يملكها: اضغط عدة مرات، ثم غيّر لون `TapButton`، فيتحدّث الزر ويبقى العدّ. يعمل الاستبدال الفوري لكل مكوّن من المستوى الأعلى: دالة باسم يبدأ بحرف كبير ويحوي جسمها JSX. يُعاد عرض المكوّن عندما تتغير شيفرته، أو عندما تتغير شيفرة الوحدة خارج المكوّنات (ثابت يستخدمه، أو دالة مساعدة). وإذا تعذّر تطبيق تعديل في مكانه (مثلاً لأنه يستورد وحدة NSH لم يستوردها التطبيق العامل بعد، أو يغيّر قدرات `nsh.json`)، يعيد المضيف تحميل التطبيق كاملاً.

<a id="errors"></a>

#### الأخطاء

يُطبع خطأ ترجمة Rust في الطرفية مع مخرجات cargo، ويبني `nsh run` من جديد عند الحفظ التالي. أما خطأ بناء TSX فيُطبع في الطرفية ويظهر على الجهاز كطبقة حمراء مع الملف والسطر والعمود؛ ويواصل التطبيق تشغيل آخر بناء سليم. وتختفي الطبقة عند البناء الناجح التالي (اضغط عليها لإخفائها قبل ذلك). ويُعرض الاستثناء الذي يُطلق وقت التشغيل بالطريقة نفسها، مع تتبّع المكدس مرتبطاً بمصدر `.tsx` لديك.

<a id="host-it-in-your-app"></a>

## استضافته في تطبيقك

يعرض التطبيق الأصلي NSH في عرض خاص به: `NshAppView` (وهو `UIView`) على iOS، و`NshView` (وهو `View` في Android) على Android، و`AppView` على macOS وWindows وLinux وفي تطبيقات GPUI. ضعه كأي عرض آخر، في أي شاشة، وبالعدد الذي تحتاجه.

الجذر المكتوب بـ Rust جزء من بناء التطبيق: يربط التطبيق حزمتك ويركّب الجذر باستخدام `AppSource::Rust` على `AppView` في macOS وWindows وLinux وGPUI وiOS ([البناء باستخدام Rust](./rust.md#an-app-written-in-rust)). أما تطبيق TSX فهو وحدة يحمّلها العرض: من خادم التطوير أثناء التطوير، ومن حزمة مبنية أو حزمة موقّعة منزَّلة في الإصدار النهائي. تحمّل الأقسام التالية وحدات TSX.

### iOS

اربط `NativeShellDev.xcframework` في Debug و`NativeShell.xcframework` في Release ([التضمين في تطبيقات iOS](./ios.md))، ثم:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

يقدّم `nsh dev my-app` الوحدة إلى التطبيق ويدفع كل عملية حفظ، كما يفعل `nsh run` مع مضيفه الخاص. وللبناء النهائي، يكتب `nsh build my-app --release --out MyApp/nsh` الحزمة في مجلد تضيفه إلى موارد التطبيق.

### Android

أضف `nsh-dev.aar` لبناءات التصحيح و`nsh.aar` لبناءات الإصدار ([التضمين في تطبيقات Android](./android.md))، ثم:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS وWindows وLinux

تضمّن تطبيقات سطح المكتب المكتوبة بـ Rust نظام NSH باستخدام `AppView`، من حزم `nsh-platform-macos` و`nsh-platform-windows` و`nsh-platform-linux` و`nsh-platform-gpui`: `NSView`، أو نافذة فرعية، أو عنصر واجهة GTK، أو عرض GPUI يركّب جذر Rust أو يحمّل حزمة مبنية. راجع [macOS](./macos.md#embedding-in-a-mac-app) و[Windows](./windows.md#embedding-in-a-win32-app) و[Linux](./linux.md#embedding-in-a-gtk-app) و[GPUI](./gpui.md)، و[المنصات](./platforms.md#embed-in-a-native-app) لعرض كل المضيفات جنباً إلى جنب.

<a id="what-the-module-may-do"></a>

### ما الذي يجوز للوحدة فعله

على iOS وAndroid، يقرر المضيف قبل التحميل ما يجوز للوحدة فعله: يحدد `grantCapabilities` مضيفات الشبكة والقدرات الأخرى التي يجوز لها الوصول إليها، وتضع الحدود سقفاً لذاكرتها ووقت استدعاءاتها وعدد عقدها ([الصندوق الرملي والقدرات](./sandbox-and-capabilities.md)). ولتزويد الوحدات بعروضك الأصلية الخاصة (خريطة، أو مخطط، أو مكوّن من نظام تصميم)، سجّلها بوصفها [مكوّنات أصلية](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## نشر التحديثات كحزم موقّعة

تأتي وحدة TSX التي ينزّلها التطبيق بعد الإصدار في صورة حزمة موقّعة. أنشئ مفتاحاً جذرياً مرة واحدة واحتفظ به دون اتصال، ثم صدّق به مفتاح إصدار، وانشر:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

يثق التطبيق بالمفتاح العام للجذر ويحمّل ما ينزّله؛ ويتحقق NSH من التوقيع والشهادة وقائمة الإبطال قبل تشغيل أي شيء:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

يعتمد Android التدفق نفسه مع `NshTrust` و`NshPackage`. وللتفاصيل عن الاستضافة والتسليم والإبطال: [الحزم الموقّعة](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## أو أصدِره كتطبيق مستقل

يبني `nsh package` تطبيقًا قابلًا للتثبيت، سواء بـ Rust أو TSX، دون الحاجة إلى مشروع Xcode أو بناء Gradle خاص بك:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

يُحزَّم تطبيق Rust مع مشغّله الخاص، المبني من الـ crate الخاص بك ومن crates الخاصة بـ NSH، مع تركيب جذره؛ أما تطبيق TSX فيُحزَّم مع بيئة التشغيل المبنية مسبقًا. الخيارات والتوقيع والأيقونات: [Packaging](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## جرّبه في الطرفية

يشغّل `nsh test` التطبيق دون واجهة (headless)، بلا جهاز ولا نافذة. عند تمرير `nsh.json` لتطبيق Rust أو نقطة الدخول لتطبيق TSX، يفتح التطبيق ويتركه يعمل ثم يطبع ما يركّبه؛ ومع `--trace` يطبع أيضًا عمليات العرض الأصلية (native view operations) ووقت كل commit ([Testing](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

وعند تمرير مجلد، يشغّل اختبارات التطبيق: يفتح `App.test.tsx` الخاص بكل قالب التطبيق، ويضغط زره، ويتحقق مما يعرضه (`nsh test my-app`). أما اختبار تطبيق Rust فيفتح جذره (`open(".")`)؛ ويمكن اختباره أيضًا في `cargo test` باستخدام `nsh_testing::Headless` ([Building with Rust](./rust.md#testing)).

<a id="next-steps"></a>

## الخطوات التالية

- [Building with Rust](./rust.md): تطبيقات Rust وسمتها (theme)، وTSX فوق crate بلغة Rust.
- [JSX and components](./jsx-and-components.md) و[Reactivity](./reactivity.md): المكوّنات والإشارات (signals)، في Rust وTSX.
- [Platforms](./platforms.md): ما تدعمه كل منصة، وصفحتها الخاصة ([iOS](./ios.md)، [Android](./android.md)، [macOS](./macos.md)، [Windows](./windows.md)، [Linux](./linux.md)).
- [Signed packages](./signed-packages.md) و[Sandbox and capabilities](./sandbox-and-capabilities.md): التسليم وما يُسمح للوحدات بفعله.
- [Project structure](./project-structure.md): ما يوضع في `nsh.json` والأصول والملفات.
