---
title: "البناء باستخدام Rust"
description: "اكتب تطبيق Native Shell بالكامل بلغة Rust، دون استخدام QuickJS على أي منصة، أو بلغة Rust مع شاشات TSX في الأعلى: متى تختار كل خيار، وكيف يتشارك الاثنان المكونات والوحدات."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# البناء باستخدام Rust

تُكتب تطبيقات Native Shell بلغة Rust أو بـ TSX أو بكليهما. وتعمل الثلاثة على المحرّك نفسه: الرسم البياني التفاعلي (reactive graph)، والمُصيِّر (renderer)، وتخطيط Taffy، والوحدات الأصلية (التنقّل، والنوافذ الحوارية، ولوحة المفاتيح، وشريط الحالة) كلها مكتوبة بـ Rust في كل الحالات، وكل منصة تعرض الواجهة بأدواتها الأصلية. الاختلاف في لغة الشيفرة التي تكتبها أنت، وبالتالي في ما إذا كان التطبيق يحمل آلة JavaScript افتراضية.

| | Rust | TSX | Rust with TSX |
|---|---|---|---|
| واجهتك وحالتك ومعالجاتك | Rust | TSX على QuickJS | مكوّنات ووحدات بـ Rust، وشاشات TSX تستخدمها |
| ما الذي يعمل في التطبيق | المحرّك وحزمتك (crate) فقط، على كل منصة وفي المتصفح | QuickJS والمحرّك (وفي المتصفح، محرّك JavaScript الخاص به) | QuickJS والمحرّك مع حزمتك (وفي المتصفح، محرّك JavaScript الخاص به) |
| يناسب | التطبيقات المتوسطة والكبيرة ذات منطق الأعمال المعقّد | التطبيقات والوحدات التي تُسلَّم أثناء التشغيل، والتكرار السريع | نواة Rust مع أجزاء تتغير كثيرًا |
| التعديلات | إعادة بناء وإعادة تشغيل | تحديثات فورية (hot updates) | تحديثات فورية لـ TSX، وإعادة بناء وإعادة تشغيل لـ Rust |
| البدء | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## الاختيار

**Rust** يناسب التطبيقات ذات منطق الأعمال الكبير والمعقّد: التداول، والمحررات، والأدوات كثيفة البيانات. تحصل على نظام أنواع Rust وفحوصاته وقت الترجمة في التطبيق كله، ومنظومة crates.io، وأداءً أصليًا لشيفرتك أنت (وليس لشيفرة NSH وحدها)، واختبارات بلا واجهة (headless) لواجهة المستخدم الحقيقية باستخدام `cargo test`. التطبيق من أوله إلى آخره شيفرة Rust أصلية: لا تُشحن معه آلة JavaScript افتراضية ولا تعمل داخله، على iOS وAndroid وmacOS وWindows وLinux وGPUI والويب. المكوّنات دوال تعمل مرة واحدة وتربط الإشارات (signals) بما تعرضه، كما في TSX ([التفاعلية](./reactivity.md))، وتُكتب بأنماط مُنمَّطة الأنواع بدل سلاسل الأصناف (class strings).

**TSX** يناسب الواجهة التي تصل بعد شحن التطبيق: وحدات يحمّلها تطبيق أصلي أثناء التشغيل، يولّدها نموذج أو يكتبها فريق آخر، وتُسلَّم في [حزم موقّعة](./signed-packages.md) وتعمل في صندوق رمل (sandbox) يضبطه المضيف، مع تحديثات فورية أثناء التطوير.

**Rust with TSX** يُبقي نواة Rust ويضيف TSX حيث يفيد: الشاشات، والإعدادات، وشاشات الاستقبال، والتجارب، وكل ما تكرّر العمل عليه بتحديثات فورية أو تسلّمه أثناء التشغيل في [حزمة موقّعة](./signed-packages.md). يستورد TSX مكوّناتك ووحداتك المكتوبة بـ Rust مثل أي وحدة NSH، فتلتقي النصفان عند واجهات مُنمَّطة الأنواع. ويعمل TSX على QuickJS، الذي يحمله التطبيق عندئذٍ.

<a id="an-app-written-in-rust"></a>

## تطبيق مكتوب بـ Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` يحتضن التطبيق: المكوّنات، والحالة، والمعالجات، والمهام.

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

تُصنع العناصر والمكوّنات بالطريقة نفسها: تصنع دالة واحدًا منها (`view()`، `text(..)`، `nsh_base` من `button()`، `#[component] fn Chart` الخاص بك من `chart()`)، وتضبط دوالّه خصائصه (props)، بمُعيِّن واحد لكل خاصية (قيمة أو إشارة أو دالة مغلقة closure)، ومستمعيه (listeners)، بدالة واحدة لكل حدث. المستمعون دوال مغلقة تستقبل حدثها (`move |text: &str| ..`)، و`move || ..` للحدث الذي لا يحمل بيانات؛ و`.child(..)` يقبل عنصرًا، أو `Option`، أو `Vec`، أو مصفوفة أو مكرِّرًا (iterator) من العناصر (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` يسمّي الجذر، و`nsh` يركّبه (mount):

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` هو مسار المكوّن في الحزمة (`App`، `shell::Gallery`؛ في الأول مع [عدة حزم](#several-crates))؛ و`"theme"` هو [السمة](#theme) (theme) التي ترسم بها مكوّناته، و`"appearance"` ينطبق عليها كما ينطبق على تطبيق TSX. وبذلك يبني `nsh run` و`nsh package` في مجلد التطبيق المشغّل الخاص بالتطبيق للهدف المطلوب، مع تركيب الجذر ودون ربط QuickJS:

| الهدف | ما الذي يعمل |
|---|---|
| macOS وWindows وLinux | مشغّل الإصدار (release) مع حزمتك، في نافذة؛ و`nsh run` يشغّل بناء تصحيح (debug) ويعرض سجلات التطبيق في الطرفية |
| iOS ومحاكي iOS وMac Catalyst | مشغّل iOS مع حزمتك، في تطبيق |
| Android | `libnsh.so` الخاص بالتطبيق مع حزمتك، تبدأه activity الخاصة بوقت التشغيل |
| الويب | `nsh.wasm` مع المحرّك وحزمتك (3.3 ميغابايت لمعرض Rust كاملًا، و0.75 ميغابايت مع brotli)؛ وتركّب الصفحة الجذر |

`nsh` يبني ما تحتاجه حزمتك ولا شيء غيره: برنامجًا صغيرًا من حزمتك ونواة NSH يصف مكوّناتها ووحداتها لأداة سطر الأوامر (CLI)، التي تتولى الباقي بنفسها، ومشغّلًا لكل هدف تشغّله أو تحزمه. يترجم أول بناء لتطبيق Rust جديد حزمتك ونواة NSH، أي نحو 60 حزمة. و`nsh test` يشغّل اختبارات التطبيق بلا واجهة في مشغّل من حزمتك مبني بالطريقة نفسها.

على Linux، تختار حزمتك ميزات المنصة الاختيارية. فعّل `webview` في اعتمادية `nsh-platform-linux` لاستخدام عروض الويب (web views)؛ وهذا يربط WebKitGTK 6.0، الذي يجب تثبيته لبناء التطبيق وتشغيله. يرث المشغّل المولَّد هذا الاختيار عبر توحيد ميزات Cargo (feature unification).

أثناء `nsh run`، يؤدي أي تغيير في شيفرة Rust بالحزمة إلى إعادة بناء المشغّل وإعادة تشغيل التطبيق؛ وفي المتصفح، تحمّل الصفحة المفتوحة وقت التشغيل الجديد تلقائيًا. و`cargo run` يشغّل الجذر نفسه مباشرة على واجهة سطح المكتب الخلفية (`src/main.rs`)، والتطبيقات الأصلية التي تضمّن NSH تركّب جذر Rust باستخدام `AppSource::Rust` على `AppView` في macOS وWindows وLinux وGPUI وiOS.

تستخدم الشيفرة لكل المنصات، ومنها الويب، خدمات NSH: `fetch` لـ HTTP ([الشبكات](./networking.md#from-rust-components))، و`timer` و`set_timeout` و`set_interval` للانتظار، و`nsh_core::time::Instant` و`nsh_core::time::unix_ms()` للساعة. و`background` و`blocking` يشغّلان العمل على خيوط (threads) الأهداف الأصلية.

<a id="desktop-title-bars"></a>

## أشرطة العنوان على سطح المكتب

ترسم تطبيقات Rust أشرطة عنوانها بنفسها باستخدام `nsh_core::element::desktop`. استدعِ `set_title_bar(TitleBarStyle::Hidden, Some(height))`، وعلّم خلفية الشريط بـ `.window_drag(true)`، واحجز مساحة أزرار النافذة الأصلية بـ `title_bar()`. قيمة `top` فيه هي ارتفاع الشريط، و`left` و`right` هما العرضان اللذان تشغلهما أزرار النظام. وقراءته تشترك في التغيّرات، بما فيها وضع ملء الشاشة. تتولى المنصة سحب النافذة وسلوك النقر المزدوج على شريط العنوان الذي يحدده المستخدم؛ و`.window_drag(false)` يُبقي عنصرًا فرعيًا خارج منطقة السحب الخاصة بأبيه.

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` يعيد شريط عنوان النظام.
`close_window()` يتبع سلوك إغلاق النافذة المعتاد في المضيف المُضمِّن.
وفي الوحدة دوال النافذة الأخرى (`set_title`، `minimize`، `toggle_full_screen`، ...) والقوائم (`set_application_menu`، `popup_menu`) أيضًا: [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## الملفات والمجلدات

على أنظمة سطح المكتب، تعرض شيفرة Rust نوافذ الملفات الحوارية للنظام وتسلّم المسارات المحلية إلى النظام، وتُنتظر كل إجابة داخل مهمة: `pick_paths` مع `OpenDialog` (`OpenDialog::files()` أو `::folders()` أو `::files_and_folders()`)، و`pick_save_path` مع `SaveDialog`، و`open_path` (التطبيق الافتراضي للملف)، و`reveal_path` (العنصر المحدَّد في Finder أو File Explorer أو مدير الملفات) و`move_to_trash` (وجهة العنصر، حين يخبر macOS بها). تُجيب النوافذ الحوارية بـ `Ok(None)` عندما يلغي المستخدم، وبخطأ عندما لا تستطيع الظهور (على Linux دون بوابة منتقي ملفات، وعلى iOS وAndroid والويب، حيث تُجيب `open_path` و`reveal_path` و`move_to_trash` بخطأ أيضًا). كل طلب يفشل يُجيب بخطئه، ولا يُجيب أبدًا بـ `false`.

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## توسيع تطبيق Rust بـ TSX

تحدد دالة `#[native_module("app/native")]` في الحزمة ما يستطيع TSX استيراده: المكوّنات (`registry.register::<Chart>()`)، ووحدات الدوال (`registry.module::<Portfolio>()`، `#[module]` على بنية وحدوية (unit struct) و`impl` الخاص بها)، والأصناف (classes) (`registry.class::<Ledger>()`، `#[class]` على بنية و`impl` الخاص بها)، والأصول (assets)؛ وتولّد السمة (attribute) أيضًا `pub fn registry()` في جذر الحزمة، وهي المجموعة نفسها لاختباراتك وشيفرة Rust الأخرى (`my_app_native::registry()`، بجوار `nsh_base::registry()`). في `#[module]` أو `#[class]` `impl`، تُصدَّر `pub fn` (و`pub(crate)` أيضًا)؛ أما الدوال التي بلا مستوى ظهور (visibility) فهي دوال مساعدة تبقى في Rust. وتُولَّد تصريحات TypeScript الخاصة بها، بما فيها تعليقات التوثيق، من أنواع Rust إلى `.nsh/types`، فيفحص `nsh check` ومحررك شيفرة TSX مقابلها:

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

يُوثَّق كل تصدير في TypeScript بتعليق التوثيق الخاص بعنصر Rust الذي يسمّيه: المكوّن بـ `#[component] fn` (`Chart`)، والوحدة والصنف ببنيتهما (`Portfolio`، `Ledger`)، والخصائص والأحداث والدوال والأعضاء بتعليقاتها هي (ولا يحتاج المُعيِّن إلى تعليق بجوار جالبه getter). أما تعليقات التوثيق الخاصة ببنية `Props` وبتعداد الأحداث نفسه، وتلك الخاصة بكتل `impl`، فتبقى في Rust؛ وتعليق التوثيق على كتلة `#[module]` أو `#[class]` `impl` خطأ في الترجمة، لأن TypeScript لن يعرضه. وكل أمر يكتب `.nsh/types` يحذّر من أي تصدير يراه TSX بلا تعليق توثيق، مسمّيًا إياه (`Ledger.add`، `Chart.range`).

يعرض TypeScript تعليق التوثيق حتى أول عنوان فيه. الملاحظات الموجهة لمستدعي Rust، مثل ما يستعيره `&self` أو سبب أخذ دالة `cx`، تُوضع تحت عنوان، `# Rust` (أو `# Panics` و`# Examples` في rustdoc)، وتبقى في توثيق Rust:

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

الخصائص هي حقول بنية `Props` الخاصة بالمكوّن، والأحداث هي متغيرات تعداد `Event` الخاص به (`onSelect`)، وكلاهما بنمط camel case. تضع شيفرة Rust المكوّن نفسه بمُنشئه (constructor)، ومُعيِّن لكل خاصية، ودالة مستمع لكل حدث: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. أما محتوى المكوّن المكتوب بـ Rust وأحداثه وحالته فتبقى في Rust؛ ويمرّر TSX الخصائص ويسمع الأحداث. خاصية بنوع خاطئ (`level={1.5}` لخاصية `u32`) تُنتج تحذيرًا، كما في العنصر المدمج: تحتفظ الخاصية بقيمتها ويُرسم باقي المكوّن.

تعمل الدالة أو العضو بالطريقة التي يحددها توقيعها في Rust. الدالة التي ليست `async` تعمل داخل استدعاء TSX وتعيد قيمتها (`Portfolio.total()` رقم، و`ledger.balance` خاصية): تحسب وتحتفظ بالحالة. أما `async fn` فتعيد Promise وتعمل كمهمة بخدمات NSH (`fetch`، `timer`، النوافذ الحوارية). ودالة الوحدة التي تأخذ `cx: &mut ModuleCx` تصل إلى المنصة بالترتيب مع الواجهة (رسالة toast، شريط الحالة)، وكذلك دالة ref للمكوّن؛ ويحدد نوع إعادتها ما يحصل عليه TSX: التي تعيد `()` تعطي `void`، دون ردّ (يستدعيها TSX ويمضي)؛ والتي تعيد `Result<(), E>` تعطي `Promise<void>`، الذي يُرفض برسالة `Err` (يعمل الاستدعاء مع تغييرات الواجهة، بعد أن يعود استدعاء TSX، فيحمل الـ Promise خطأه؛ وما لا ينتظره أحد ولا يلتقطه يُسجَّل بوصفه [رفضًا غير معالج](./dev-server-and-debugging.md#logs))؛ والتي تعيد قيمة تعطي `Promise<T>`. تُنمَّط المعاملات والنتائج من التوقيع: الأرقام والسلاسل النصية و`Option` و`Vec` وبنى `#[derive(JsObject)]` الخاصة بك وتعدادات `#[derive(PropEnum)]` وكائنات أصنافك ودوال TSX (`Callback<A, R>`، التي تستدعيها Rust فورًا داخل الاستدعاء، أو لاحقًا بـ `post` و`call_async`؛ ويرى TS `(value: number) => void` لـ `Callback<f64>`، و`#[args(balance)] listener: Callback<f64>` يسمّي المعامل، `(balance: number) => void`). الدالة التي تبدأ الاستماع تُسمّى `on(event, listener)` وتعيد `Stop` (`Stop::new(|| …)`)، التي يحصل عليها TSX بوصفها دالة توقفه (`() => void`)؛ وهي تعمل مرة واحدة، عندما يستدعيها TSX أو عندما يزول ما استدعى `on` (مكوّن، أو تشغيل الوحدة تحت إعادة التحميل الفوري). يحصل معالج الحدث على كائن واحد: قيمة المتغير هي حقله `value`، الذي يسمّيه `#[args(price)]` على المتغير (`onSelect({ price })`)، و`#[args(open, reason)]` يسمّي حقول متغير ذي عدة حقول. معامل بنوع خاطئ يُطلق `TypeError` في الاستدعاء، أو يرفض الـ Promise في الدالة التي تعيد Promise؛ و`Err` يُطلق (أو يرفض) برسالته. يملك كائن الصنف قيمة Rust الخاصة به: تُحرَّر عندما يُجمَع الكائن بجامع المهملات، أو فورًا بـ `ledger.dispose()` (و`using ledger = new Ledger()` أيضًا). سمِّ مدخل TSX لتشغيله، `nsh run App.tsx` أو `nsh package App.tsx --target …`: تعديلات TSX تحديثات فورية، وتعديلات Rust تعيد البناء وتعيد تشغيل التطبيق. تجمّع الأداة CLI شيفرة TSX وتترجمها بنفسها، وتعرف تصديرات حزمتك من وصفها؛ وتُبنى مضيفات التطوير والمشغّل بلا واجهة الخاص بـ `nsh test` مع حزمتك وQuickJS.

`examples/rust-exports` في المستودع هو المرجع للتصدير: تطبيق TSX صغير تصدّر حزمته مكوّنًا واحدًا (خصائص مطلوبة ولها قيم افتراضية واختيارية، وحدث، وعناصر فرعية)، ووحدة واحدة (دالة من كل نوع)، وصنفًا واحدًا (مُنشئ، وطرقًا، وجالبًا ومُعيِّنًا، ودالة ساكنة static، وعضو `async`، وكائنًا آخر معاملًا، ودالة رد نداء تنشر إليها Rust، و`dispose()` و`using`)، لكل منها تعليق توثيق قصير، مع اختبارات، بـ Rust وبـ TypeScript (`App.test.tsx`)، تضغط عبر التطبيق وتتحقق مما يعرضه كل منها.

`examples/gallery-rs` في المستودع تطبيق Rust كامل: كل عرض توضيحي فيه مكتوب بـ Rust، و`nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` يشغّل اختباراته بلا واجهة، و`cargo run -p gallery-native` يشغّله على واجهة سطح المكتب الخلفية.
<a id="render-functions-and-the-apps-classes"></a>

### دوال العرض وفئات التطبيق

يرسم المكوّن محتوى خاصًا بالتطبيق للقيم التي لديه (صف من بياناته، أو كتلة شيفرة من مستند) عبر دالة عرض: خاصية `Option<Renderer<T>>`، وفي TypeScript `(value: T) => JSX.Element`. يستدعي المكوّن
`render(key, value)` في الموضع الذي يوضع فيه المحتوى، ويحصل على عرض ينسّقه ويضعه كأي عرض آخر (داخل `text(..)`، أو عرض
مضمّن). يُحتفظ بالمحتوى لكل مفتاح ما دامت القيمة متساوية، ويُعاد عرضه عند تغيّرها. يمرّر الأب في Rust
إغلاقًا (closure) إلى دالة ضبط الخاصية (`quote().render_badge(|symbol| ..)`)، التي تنشئ
`Renderer` منه.

التنسيقات في المكوّن مكتوبة بأنواع محددة؛ وتصل فئات Tailwind الخاصة بالتطبيق إلى أحد أجزائه عبر خاصية للفئات و
`.app_class(..)` على عنصر ذلك الجزء. تُطبَّق بعد تنسيقات العنصر نفسه، مع سمة التطبيق و`dark:`
والحالات، كما يفعل `class` على عنصر.

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`TextView` في `nsh/base` مبني بهذه الطريقة: `renderCodeBlock` و`renderMath` و... هي دوال عرض، و
`classes` هي فئات التطبيق بحسب الجزء ([TextView](../elements/text-view.md)).

<a id="testing"></a>

## الاختبار

تشغّل اختبارات تطبيق Rust التطبيق بلا واجهة (headless)، في `cargo test` أو في `nsh test`، بالمشغّل (driver) نفسه: على المحرك الحقيقي،
بلا نافذة، وبإطارات عرض بمعدل 60 هرتز، فتعمل المؤقتات والمهام والرسوم المتحركة كما تعمل على الشاشة. يبدأ المشغّل
التطبيق، ويحتفظ بنموذج للعروض التي يعرضها، وينفّذ خطوات (`press` و`type_text` و`submit` و`scroll` و`wait_for`)
على عروض تُحدَّد بمحدِّدات (نص، أو تسمية إتاحة، أو معرّف اختبار؛ `text:` و`label:` و`id:`)؛ والخطوة التي
لا يمكن تنفيذها تفشل مع عرض النصوص الظاهرة على الشاشة.

في `cargo test`، يشغّل `nsh_testing::Headless` (الميزات الافتراضية لـ nsh-testing، بدون QuickJS) الجذر
(`app.screen()`: النصوص الظاهرة على الشاشة، والأوامر التي أرسلها)؛ أما `EngineConfig::new` فهو محرك بحجم الهاتف لا شيء
آخر مضبوط فيه. يشغّل `nsh test` اختبارات TypeScript ([Testing](./testing-and-trace.md)) في مشغّل اختبار بلا واجهة مبني
مع حزمك (crates)، حيث يبدأ `open(".")` جذر تطبيق Rust:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

يُبنى مدخل TSX بالميزة `bundle` الخاصة بـ `nsh-testing` كما يبنيه `nsh run`، مقابل مجموعات الواجهة التي تخدمها مضيفاته:
مجموعات NSH، و`registry()` الخاصة بكل حزمة، التي ينشئها `#[native_module]`:

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

يبني `nsh_testing::compile_tsx` المدخل مرة واحدة لعدة اختبارات، ويسلّم `nsh_testing::start`
الدفعات إلى اختبار يحتفظ بنموذجه الخاص للشاشة. يختبر `examples/rust-exports` مدخل TSX الخاص به بهذه الطريقة؛
ويختبر `examples/gallery-rs` جذر Rust الخاص به في TypeScript، بملف اختبار لكل عرض توضيحي تقريبًا.

<a id="theme"></a>

## السمة

مظهر التطبيق يخص التطبيق نفسه: يوفّر NSH العناصر الأولية والمكوّنات الأساسية غير المنسّقة في `nsh_base`،
وحزمتك هي الطبقة المنسّقة فوقها، أي مكتبة مكوّنات التطبيق الخاصة به ([Three layers](./architecture.md#three-layers)). تأخذ مكوّنات Rust ألوانها ونصف قطر الزوايا والخطوط من سمة، `theme()` من
`nsh_base`، فيعيد ملف واحد تنسيق كل مكوّن في التطبيق. لكل لون قيمة فاتحة وقيمة داكنة؛
وعندما يبدّل النظام المظهر، يتغيّر اللون أصليًا عبر ربط مثل `.bg(move || theme().primary)`، بلا
إعادة عرض.

تحتوي السمة على رموز التصميم (design tokens) الخاصة بـ [shadcn/ui](https://ui.shadcn.com/docs/theming)، وسمتها الافتراضية هي سمة shadcn
`neutral`، وهي لوحة ألوان بالأبيض والأسود مع نصف قطر زوايا 10 نقاط. لاستخدام سمتك الخاصة، اضبط `"theme"` في `nsh.json`
على مسار ملف السمة، بالنسبة إلى `nsh.json`، أو على محتوى السمة مباشرة:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

ملف السمة هو `cssVars` الخاص بـ shadcn، وهو صيغة سمات shadcn وعناصر السجل (registry items)، لذا تعمل السمة المصدَّرة من
[shadcn's themes](https://ui.shadcn.com/themes) أو [tweakcn](https://tweakcn.com) كما هي. يضبط `light`
قيم المظهر الفاتح، ويضبط `dark` قيم المظهر الداكن، ويضبط `theme` قيم المظهرين معًا:

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- تُطبَّق سمتك فوق السمة الافتراضية، فتذكر فقط ما تغيّره. القيمة التي يضبطها `light` ويتركها `dark`
  تُستخدم في المظهرين.
- تُكتب القيم كما في CSS. الألوان هي أي لون CSS (`#7c3aed` و`rgb(…)` و`hsl(…)` و`oklch(…)` و`white`)، أو
  `color-mix(in oklab, var(--primary) 80%, white)`، أو رمز آخر من المظهر نفسه، `var(--primary)` (مع قيمة
  احتياطية: `var(--brand, #7c3aed)`). الأطوال هي `rem` (16 نقطة) أو `px` (نقاط). الخطوط هي قوائم عائلات خطوط:
  تُستخدم أول عائلة ليست عامة، وإذا كانت أول عائلة عامة (`system-ui`، `sans-serif`) فهي
  خط النظام.
- **رموزك الخاصة.** أي اسم آخر هو رمز خاص بالتطبيق، كما هو المتغيّر في `@theme` الخاص بـ Tailwind: `"up"` أعلاه هو
  `theme().color("up")` في Rust، و`bg-up` / `text-up/70` في الفئات و`token("up")` في TSX
  ([Theme tokens](./tailwind.md#theme-tokens)). الرقم مثل `"radius-card": "14px"` هو `theme().number("radius-card")`
  و`rounded-(--radius-card)`.
- تتحقق أداة التجميع من السمة عند البناء: ملف مفقود، أو JSON غير صالح، أو سمة غير `cssVars` يُفشل
  البناء بخطأ `nsh.json: theme: …`.

الرموز، مع قيمها الفاتحة والداكنة الافتراضية (`neutral` الخاص بـ shadcn):

| الرمز | `theme()` | فاتح | داكن | الدور |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | خلفية التطبيق، والنص الذي عليها |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | البطاقات والأسطح المجمّعة، والنص الذي عليها |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | النوافذ المنبثقة والقوائم وتلميحات الأدوات، والنص الذي عليها |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | الإجراء الرئيسي (زر رئيسي)، والنص الذي عليه |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | الإجراءات الثانوية، والنص الذي عليها |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | الأسطح الهادئة؛ النص الثانوي: التعليقات والتسميات والنصوص البديلة |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | عنصر مُمرَّر فوقه أو مميَّز، مثل عنصر قائمة أو صف في قائمة، ونصه |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | الإجراءات الهدّامة والأخطاء |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | الفواصل والحدود |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | حدّ حقول الإدخال |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | حلقات التركيز |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | نفسها | سلاسل المخطط البياني |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | سطح الشريط الجانبي، وإجراؤه الرئيسي، وعنصره المميَّز، وحدوده وحلقة التركيز |
| `radius` | `radius` | `0.625rem` (10 نقاط) | | نصف قطر الزوايا |
| `font-sans` | `font_sans` | خط النظام | | خط التطبيق: كل نص لا يحدد عائلة خط خاصة به |
| `font-mono` | `font_mono` | خط النظام أحادي المسافة | | الخط أحادي المسافة: `font-mono`، والشيفرة في `TextView` |

<a id="several-crates"></a>

## عدة حزم (crates)

يمكن تقسيم شيفرة Rust الخاصة بالتطبيق إلى حزم، تُستورد كل منها بمحدِّدها الخاص: يأخذ `"rust"` قائمة بمسارات
الحزم، ولكل حزمة فيها دالة `#[native_module]` الخاصة بها.

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

يربط كل مشغّل ومضيف جميع الحزم، ويعلن `.nsh/types` كل محدِّد. تتشارك الحزم الشيفرة عبر تبعيات
المسار في Cargo (`shared = { path = "../shared" }`): يمكن لحزمة مكوّنات الشركة أن تُستخدم من عدة حزم
وأن تُدرج في عدة تطبيقات، ولا تُصدَّر إلى TSX سوى الحزم المدرجة في `"rust"`. لكل حزمة مدرجة اسم حزمة
ومحدِّد خاصان بها؛ ويبلّغ `nsh` عن أي تكرار مع المسارين اللذين يتشاركانه. إن `"root"` في تطبيق Rust
هو مكوّن من أول حزمة مدرجة. أثناء `nsh run` و`nsh dev`، يؤدي أي تغيير في أي منها، أو في حزمة
تعتمد عليها بالمسار، إلى إعادة بناء التطبيق وإعادة تشغيله.

<a id="browser-apis-on-the-web"></a>

## واجهات المتصفح البرمجية على الويب

على الويب، يمكن للحزمة استدعاء واجهات المتصفح البرمجية (WebSocket، `IndexedDB`، …) عبر wasm-bindgen و`web-sys`؛
ويبني `nsh` الشيفرة الرابطة التي تحتاجها مع بيئة التشغيل. راجع [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## انظر أيضًا

- [Project structure](./project-structure.md): كل مفتاح في `nsh.json`.
- [Web](./web.md#apps-with-rust-components): تطبيقات Rust في المتصفح.
- [Networking](./networking.md#from-rust-components): `fetch` من Rust.
- [CLI](./cli.md#nsh-init): `nsh init --template rust` و`--template mixed`.
