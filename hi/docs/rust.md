---
title: "Rust के साथ बिल्डिंग"
description: "Native Shell ऐप को पूरी तरह Rust में लिखें, किसी भी प्लेटफ़ॉर्म पर QuickJS के बिना, या ऊपर TSX स्क्रीन के साथ Rust में लिखें: कब कौन-सा विकल्प चुनें, और दोनों कंपोनेंट और मॉड्यूल कैसे साझा करते हैं।"
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# Rust के साथ बनाना

Native Shell ऐप्स Rust में, TSX में, या दोनों में लिखे जाते हैं। तीनों एक ही engine पर चलते हैं: reactive graph, renderer, Taffy layout और native modules (navigation, dialogs, keyboard, status bar) हर स्थिति में Rust हैं, और हर प्लेटफ़ॉर्म अपने ही UI से render करता है। फ़र्क़ आपके अपने कोड की भाषा में है, और इसमें कि ऐप के साथ JavaScript VM रहता है या नहीं।

| | Rust | TSX | Rust के साथ TSX |
|---|---|---|---|
| आपका UI, state और handlers | Rust | QuickJS पर TSX | Rust components और modules, और उनका उपयोग करने वाली TSX screens |
| ऐप में क्या चलता है | केवल engine और आपका crate, हर प्लेटफ़ॉर्म पर और ब्राउज़र में | QuickJS और engine (ब्राउज़र में, उसका JavaScript engine) | QuickJS और engine, आपके crate के साथ (ब्राउज़र में, उसका JavaScript engine) |
| किसके लिए उपयुक्त | जटिल business logic वाले मध्यम और बड़े ऐप्स | रन टाइम पर वितरित होने वाले ऐप्स और modules, तेज़ iteration | Rust core, जिसके कुछ हिस्से अक्सर बदलते हैं |
| बदलाव | Rebuild और restart | Hot updates | TSX के लिए hot updates, Rust के लिए rebuild और restart |
| शुरुआत | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## चुनना

**Rust** उन ऐप्स के लिए उपयुक्त है जिनका business logic बड़ा और जटिल है: trading, editors, डेटा-प्रधान टूल्स। आपको पूरे ऐप में Rust का type system और compile-time checks मिलते हैं, crates.io का ecosystem मिलता है, आपके अपने कोड के लिए भी native performance मिलती है (केवल NSH के कोड के लिए नहीं), और `cargo test` के साथ असली UI के headless tests मिलते हैं। ऐप शुरू से अंत तक Rust और native कोड है: iOS, Android, macOS, Windows, Linux, GPUI और वेब पर कोई JavaScript VM न उसके साथ आता है और न उसमें चलता है। Components ऐसे functions हैं जो एक बार चलते हैं और signals को उनके दिखाए जाने वाले कंटेंट से bind करते हैं, जैसे TSX में ([Reactivity](./reactivity.md)), फ़र्क़ बस इतना कि class strings की जगह typed styles का उपयोग होता है।

**TSX** उस UI के लिए उपयुक्त है जो ऐप के शिप होने के बाद आता है: ऐसे modules जिन्हें native ऐप रन टाइम पर लोड करता है, जो किसी model द्वारा बनाए गए हों या किसी दूसरी टीम ने लिखे हों, [signed packages](./signed-packages.md) के रूप में वितरित होते हैं और host द्वारा कॉन्फ़िगर किए गए sandbox में चलते हैं, और विकास के दौरान hot updates के साथ।

**Rust के साथ TSX** Rust core को बनाए रखता है और TSX वहाँ जोड़ता है जहाँ उसका फ़ायदा है: screens, settings, onboarding, experiments, और वह सब कुछ जिस पर आप hot updates से iterate करते हैं या [signed package](./signed-packages.md) के रूप में रन टाइम पर वितरित करते हैं। TSX आपके Rust components और modules को किसी भी NSH module की तरह import करता है, इसलिए दोनों हिस्से typed interfaces पर मिलते हैं। TSX QuickJS पर चलता है, जिसे फिर ऐप अपने साथ रखता है।

<a id="an-app-written-in-rust"></a>

## Rust में लिखा ऐप

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` ऐप को धारण करता है: components, state, handlers, tasks।

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

Elements और components एक ही तरह बनते हैं: एक function उन्हें बनाता है (`view()`, `text(..)`, `nsh_base` का `button()`, आपके `#[component] fn Chart` का `chart()`), और उसके methods उसके props सेट करते हैं, हर prop के लिए एक setter (एक value, एक signal या एक closure), और उसके listeners, हर event के लिए एक method। Listeners अपने event के closures हैं (`move |text: &str| ..`), और बिना डेटा वाले event के लिए `move || ..`; `.child(..)` एक element लेता है, या एक `Option`, एक `Vec`, elements का array या iterator (`.child(rows.iter().map(|r| row(r)))`)।

`nsh.json` root का नाम बताता है, और `nsh` उसे mount करता है:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` crate में component का path है (`App`, `shell::Gallery`; पहले वाले में [कई crates](#several-crates) के साथ); `"theme"` वह [theme](#theme) है जिससे उसके components draw होते हैं, और `"appearance"` उस पर वैसे ही लागू होता है जैसे TSX ऐप पर। इसके साथ, ऐप की directory में `nsh run` और `nsh package` target के लिए ऐप का अपना runner बनाते हैं, जिसमें root mount होता है और QuickJS लिंक नहीं होता:

| Target | क्या चलता है |
|---|---|
| macOS, Windows, Linux | आपके crate के साथ release runner, एक विंडो में; `nsh run` debug build चलाता है और ऐप के logs टर्मिनल में दिखाता है |
| iOS, iOS simulator, Mac Catalyst | आपके crate के साथ iOS runner, एक ऐप में |
| Android | आपके crate के साथ ऐप का `libnsh.so`, जिसे runtime की activity शुरू करती है |
| Web | engine और आपके crate के साथ `nsh.wasm` (पूरे Rust gallery के लिए 3.3 MB, brotli के साथ 0.75 MB); पेज root को mount करता है |

`nsh` वही बनाता है जो आपके crate को चाहिए और उससे अधिक कुछ नहीं: आपके crate और NSH के core का एक छोटा प्रोग्राम जो उसके components और modules का वर्णन CLI को देता है, जो फिर बाक़ी सब खुद करता है, और हर उस target का runner जिसे आप चलाते या package करते हैं। नए Rust ऐप का पहला build आपके crate और NSH के core को compile करता है, लगभग 60 crates। `nsh test` ऐप के tests को उसी तरह बने आपके crate के runner में headless चलाता है।

Linux पर, आपका crate वैकल्पिक platform features चुनता है। web views का उपयोग करने के लिए अपनी `nsh-platform-linux` dependency पर `webview` enable करें; यह WebKitGTK 6.0 को लिंक करता है, जिसे ऐप build और run करने के लिए इंस्टॉल होना चाहिए। जनरेट किया गया runner यह चुनाव Cargo feature unification के ज़रिए प्राप्त करता है।

`nsh run` के दौरान, crate के Rust कोड में बदलाव runner को फिर से build करता है और ऐप को restart करता है; ब्राउज़र में, खुला पेज नया runtime अपने आप लोड कर लेता है। `cargo run` उसी root को सीधे desktop backend (`src/main.rs`) पर शुरू करता है, और NSH को embed करने वाले native ऐप्स macOS, Windows, Linux, GPUI और iOS के `AppView` पर `AppSource::Rust` से Rust root mount करते हैं।

हर प्लेटफ़ॉर्म के लिए कोड, वेब सहित, NSH की services का उपयोग करता है: HTTP के लिए `fetch` ([Networking](./networking.md#from-rust-components)), प्रतीक्षा के लिए `timer`, `set_timeout` और `set_interval`, घड़ी के लिए `nsh_core::time::Instant` और `nsh_core::time::unix_ms()`। `background` और `blocking` native targets के threads पर काम चलाते हैं।

## Desktop title bars

Rust ऐप्स `nsh_core::element::desktop` से अपने title bars खुद draw करते हैं। `set_title_bar(TitleBarStyle::Hidden, Some(height))` कॉल करें, bar की background को `.window_drag(true)` से चिह्नित करें, और native window controls की जगह को `title_bar()` से आरक्षित करें। इसका `top` bar की ऊँचाई है, और `left` और `right` system controls द्वारा घेरी गई चौड़ाइयाँ हैं। इसे पढ़ने पर बदलावों की subscription हो जाती है, full screen सहित। प्लेटफ़ॉर्म window dragging और उपयोगकर्ता के title-bar double-click व्यवहार को संभालता है; `.window_drag(false)` किसी child को उसके parent के drag region से बाहर रखता है।

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

`set_title_bar(TitleBarStyle::Default, None)` system title bar को बहाल करता है। `close_window()` embedding host के सामान्य window-close व्यवहार का पालन करता है। इस module में window के अन्य functions (`set_title`, `minimize`, `toggle_full_screen`, ...) और menus (`set_application_menu`, `popup_menu`) भी हैं: [nsh/desktop](../modules/nsh-desktop.md)।

<a id="files-and-folders"></a>

## फ़ाइलें और फ़ोल्डर

Desktops पर, Rust कोड system के file dialogs दिखाता है और local paths को system को सौंपता है, हर उत्तर एक task में awaited होता है: `pick_paths` एक `OpenDialog` के साथ (`OpenDialog::files()`, `::folders()` या `::files_and_folders()`), `pick_save_path` एक `SaveDialog` के साथ, `open_path` (फ़ाइल का default ऐप), `reveal_path` (Finder, File Explorer या file manager में चुना गया item) और `move_to_trash` (item कहाँ गया, जब macOS बताता है)। जब उपयोगकर्ता रद्द करता है तो dialogs `Ok(None)` लौटाते हैं, और जब वे दिखाए नहीं जा सकते तो error (Linux पर file chooser portal के बिना, और iOS, Android और वेब पर, जहाँ `open_path`, `reveal_path` और `move_to_trash` भी error लौटाते हैं)। हर विफल अनुरोध अपना error लौटाता है, कभी `false` नहीं।

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

## TSX के साथ Rust ऐप का विस्तार

Crate का `#[native_module("app/native")]` function बताता है कि TSX क्या import कर सकता है: components (`registry.register::<Chart>()`), functions के modules (`registry.module::<Portfolio>()`, unit struct और उसके `impl` पर `#[module]`), classes (`registry.class::<Ledger>()`, struct और उसके `impl` पर `#[class]`) और assets; यह attribute crate के root पर `pub fn registry()` भी बनाता है, वही सेट आपके tests और अन्य Rust कोड के लिए (`my_app_native::registry()`, `nsh_base::registry()` के पास)। किसी `#[module]` या `#[class]` `impl` में, `pub fn` exported होते हैं (`pub(crate)` भी); बिना visibility वाले functions helpers हैं जो Rust में ही रहते हैं। उनकी TypeScript declarations, doc comments सहित, Rust types से `.nsh/types` में जनरेट होती हैं, इसलिए TSX की जाँच `nsh check` और आपका editor उनके विरुद्ध करते हैं:

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

TypeScript में हर export का दस्तावेज़ उस Rust item की doc comment से बनता है जो उसे नाम देता है: component का उसके `#[component] fn` (`Chart`) से, module और class का उनके struct (`Portfolio`, `Ledger`) से, और props, events, functions और members का उनकी अपनी doc comments से (setter को अपने getter के अलावा किसी की आवश्यकता नहीं)। `Props` struct की और event enum की अपनी doc comments, और `impl` blocks की doc comments, Rust में ही रहती हैं; `#[module]` या `#[class]` `impl` block पर doc comment एक compile error है, क्योंकि TypeScript उसे नहीं दिखाएगा। `.nsh/types` लिखने वाला हर command उस export के बारे में चेतावनी देता है जिसे TSX बिना doc comment के देखता है, और उसका नाम बताता है (`Ledger.add`, `Chart.range`)।

TypeScript doc comment को उसके पहले heading तक दिखाता है। Rust callers के लिए नोट्स, जैसे `&self` क्या borrow करता है या कोई function `cx` क्यों लेता है, heading के नीचे जाते हैं, `# Rust` (या rustdoc का `# Panics`, `# Examples`), और Rust docs में ही रहते हैं:

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

Props component के `Props` struct के fields हैं और events उसके `Event` enum (`onSelect`) के variants हैं, दोनों camel case में। Rust कोड उसी component को उसके constructor, हर prop के लिए एक setter और हर event के लिए एक listener method से रखता है: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`। Rust component का अपना कंटेंट, events और state Rust में ही रहते हैं; TSX props अंदर भेजता है और events सुनता है। गलत type का prop (`u32` prop के लिए `level={1.5}`) एक चेतावनी है, जैसे built-in element पर: prop अपनी value रखता है और component का बाक़ी हिस्सा render होता है।

Function या member वैसे चलता है जैसा उसका Rust signature कहता है। जो `async` नहीं है वह TSX कॉल के अंदर चलता है और अपनी value लौटाता है (`Portfolio.total()` एक number है, `ledger.balance` एक property): यह गणना करता है और state रखता है। `async fn` एक Promise लौटाता है और NSH की services (`fetch`, `timer`, dialogs) के साथ task के रूप में चलता है। `cx: &mut ModuleCx` लेने वाला module function UI के क्रम में platform तक पहुँचता है (toast, status bar), और component का ref method भी; उनका return type तय करता है कि TSX को क्या मिलता है: `()` लौटाने वाला `void` देता है, बिना उत्तर के (TSX उसे कॉल करके आगे बढ़ जाता है); `Result<(), E>` लौटाने वाला `Promise<void>` देता है, जो `Err` के संदेश के साथ reject होता है (कॉल UI के बदलावों के साथ, TSX कॉल के लौटने के बाद चलती है, इसलिए Promise अपना error ले जाता है; जिसे कोई await या catch नहीं करता वह [unhandled rejection](./dev-server-and-debugging.md#logs) के रूप में log होता है); value लौटाने वाला `Promise<T>` देता है। Arguments और results signature से typed होते हैं: numbers, strings, `Option`, `Vec`, आपके `#[derive(JsObject)]` structs और `#[derive(PropEnum)]` enums, आपकी classes के instances, और TSX functions (`Callback<A, R>`, जिन्हें Rust कॉल के अंदर तुरंत कॉल करता है, या बाद में `post` और `call_async` से; TS `Callback<f64>` के लिए `(value: number) => void` देखता है, और `#[args(balance)] listener: Callback<f64>` argument का नाम बताता है, `(balance: number) => void`)। सुनना शुरू करने वाले function का नाम `on(event, listener)` होता है और वह `Stop` (`Stop::new(|| …)`) लौटाता है, जो TSX को उसे रोकने वाले function के रूप में मिलता है (`() => void`); यह एक बार चलता है, जब TSX उसे कॉल करता है या जब `on` को कॉल करने वाला हट जाता है (एक component, या hot reload के तहत module का run)। Event का handler एक object पाता है: variant की value उसका field `value` है, जिसे variant पर `#[args(price)]` नाम देता है (`onSelect({ price })`), और `#[args(open, reason)]` कई fields वाले variant के fields के नाम बताता है। गलत type का argument कॉल में `TypeError` throw करता है, या Promise लौटाने वाले function का Promise reject करता है; `Err` अपने संदेश के साथ throw (या reject) करता है। Class का object अपनी Rust value का स्वामी है: object के collect होने पर वह मुक्त हो जाती है, या `ledger.dispose()` (साथ ही `using ledger = new Ledger()`) से तुरंत। TSX entry का नाम देकर उसे चलाएँ, `nsh run App.tsx` या `nsh package App.tsx --target …`: TSX के बदलाव hot updates हैं, Rust के बदलाव ऐप को rebuild और restart करते हैं। CLI TSX को खुद bundle और compile करता है, और आपके crate के exports को उसके विवरण से जानता है; development hosts और `nsh test` का headless runner आपके crate और QuickJS के साथ बनते हैं।

रिपॉज़िटरी में `examples/rust-exports` exporting का reference है: एक छोटा TSX ऐप जिसका crate एक component (आवश्यक, default वाले और वैकल्पिक props, एक event, children), एक module (हर प्रकार का एक function) और एक class (एक constructor, methods, एक getter और एक setter, एक static, एक `async` member, argument के रूप में दूसरा instance, एक callback जिस पर Rust post करता है, `dispose()` और `using`) export करता है, हर एक में छोटी doc comment के साथ, और Rust तथा TypeScript (`App.test.tsx`) में tests जो ऐप के माध्यम से press करते हैं और जाँचते हैं कि हर एक क्या दिखाता है।

रिपॉज़िटरी में `examples/gallery-rs` एक पूर्ण Rust ऐप है: हर demo Rust है, `nsh run examples/gallery-rs --target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` इसके tests को headless चलाता है, और `cargo run -p gallery-native` इसे desktop backend पर शुरू करता है।
<a id="render-functions-and-the-apps-classes"></a>

### Render functions और app की classes

कोई component अपने पास मौजूद values के लिए app की सामग्री (किसी डेटा की एक row, किसी document का code block) को render function से draw करता है: यह एक prop `Option<Renderer<T>>` है, TypeScript में `(value: T) => JSX.Element`। Component `render(key, value)` को वहाँ कॉल करता है जहाँ सामग्री जानी है और उसे एक view मिलती है, जिसे वह किसी अन्य view की तरह style और place करता है (`text(..)` के अंदर, एक inline view)। Value के बराबर रहने तक सामग्री प्रति key सहेजी जाती है, और value बदलने पर फिर से render की जाती है। Rust parent prop के setter (`quote().render_badge(|symbol| ..)`) को एक closure देता है, जिससे उसका `Renderer` बन जाता है।

Component में styles typed होती हैं; app की Tailwind classes उसके किसी हिस्से तक classes के एक prop और उस हिस्से के element पर `.app_class(..)` के ज़रिए पहुँचती हैं। वे element की अपनी styles के बाद लागू होती हैं, app की theme, `dark:` और states के साथ, जैसा किसी element पर `class` करता है।

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

`nsh/base` में `TextView` इसी तरह बना है: इसके `renderCodeBlock`, `renderMath`, ... render functions हैं, और इसके `classes` हिस्सों के अनुसार app की classes हैं ([TextView](../elements/text-view.md))।

## Testing

Rust app के tests उसे headless चलाते हैं, `cargo test` में या `nsh test` में, एक ही driver के साथ: असली engine पर, बिना window के, 60 Hz पर display frames के साथ, इसलिए timers, tasks और animations वैसे ही चलते हैं जैसे screen पर। Driver app को शुरू करता है, उसके दिखाए views का एक model रखता है और selectors (कोई text, accessibility label या test id; `text:`, `label:`, `id:`) से नाम दिए गए views पर steps (`press`, `type_text`, `submit`, `scroll`, `wait_for`) लेता है; जो step लिया नहीं जा सकता वह screen पर मौजूद texts के साथ fail हो जाता है।

`cargo test` में, `nsh_testing::Headless` (nsh-testing के default features, QuickJS के बिना) root को चलाता है (`app.screen()`: screen पर मौजूद texts, उसके भेजे commands); `EngineConfig::new` एक phone-sized engine है जिसमें और कुछ सेट नहीं होता। `nsh test` आपके crates के साथ बने headless runner में TypeScript tests ([Testing](./testing-and-trace.md)) चलाता है, जहाँ `open(".")` किसी Rust app का root शुरू करता है:

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

TSX entry को `nsh-testing` के feature `bundle` के साथ वैसे ही build किया जाता है जैसे `nsh run` उसे build करता है, उन UI sets के विरुद्ध जो उसके hosts देते हैं: NSH के, और हर crate के `registry()`, जिन्हें `#[native_module]` बनाता है:

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

`nsh_testing::compile_tsx` कई tests के लिए entry को एक बार build करता है, और `nsh_testing::start` batches को ऐसे test को सौंपता है जो screen का अपना model रखता है। `examples/rust-exports` अपने TSX entry को इसी तरह test करता है; `examples/gallery-rs` अपने Rust root को TypeScript में test करता है, लगभग हर demo के लिए एक test file।

## Theme

App का look app का अपना होता है: NSH `nsh_base` के primitives और unstyled base components देता है, और आपका crate उनके ऊपर की styled layer है, यानी app की अपनी component library ([तीन परतें](./architecture.md#three-layers))। Rust components अपने colors, corner radius और fonts एक theme से लेते हैं, जो `nsh_base` से `theme()` होती है, इसलिए एक file app के हर component को restyle कर देती है। हर color का एक light और एक dark value होता है; जब system appearance बदलता है, तो `.bg(move || theme().primary)` जैसी binding बिना किसी render के native रूप से color बदल देती है।

Theme में [shadcn/ui](https://ui.shadcn.com/docs/theming) के design tokens हैं, और इसका default shadcn की `neutral` theme है, जो 10 pt corner radius वाला black-and-white palette है। अपनी theme इस्तेमाल करने के लिए, `nsh.json` में `"theme"` को theme file के path पर सेट करें, `nsh.json` के सापेक्ष, या theme की सामग्री inline दें:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Theme file shadcn की `cssVars` होती है, जो shadcn की themes और registry items का format है, इसलिए [shadcn's themes](https://ui.shadcn.com/themes) या [tweakcn](https://tweakcn.com) से export की गई theme जैसी है वैसी चलती है। `light` light appearance के values सेट करता है, `dark` dark के, और `theme` दोनों के:

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

- आपकी theme default theme के ऊपर लागू होती है, इसलिए आप केवल वही लिखते हैं जो बदलना है। जिस value को `light` सेट करता है और `dark` छोड़ देता है, वह दोनों appearances में इस्तेमाल होता है।
- Values CSS की तरह लिखे जाते हैं। Colors कोई भी CSS color हो सकते हैं (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`), `color-mix(in oklab, var(--primary) 80%, white)`, या उसी appearance का कोई अन्य token, `var(--primary)` (fallback के साथ: `var(--brand, #7c3aed)`)। Lengths `rem` (16 points) या `px` (points) होती हैं। Fonts font family की सूचियाँ होती हैं: पहली वह family जो generic नहीं है इस्तेमाल होती है, और पहली family generic हो (`system-ui`, `sans-serif`) तो system font इस्तेमाल होता है।
- **आपके अपने tokens।** कोई भी अन्य नाम app का token है, जैसे Tailwind के `@theme` में variable होता है: ऊपर का `"up"` Rust में `theme().color("up")` है, classes में `bg-up` / `text-up/70` और TSX में `token("up")` ([Theme tokens](./tailwind.md#theme-tokens))। `"radius-card": "14px"` जैसी संख्या `theme().number("radius-card")` और `rounded-(--radius-card)` है।
- Bundler build के समय theme की जाँच करता है: file न मिलने, अमान्य JSON, या `cssVars` के अलावा किसी theme पर build `nsh.json: theme: …` error के साथ fail हो जाता है।

Tokens, उनके default light और dark values के साथ (shadcn का `neutral`):

| Token | `theme()` | Light | Dark | भूमिका |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | App का background, और उस पर का text |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Cards और grouped surfaces, और उन पर का text |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popovers, menus और tooltips, और उन पर का text |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | मुख्य action (primary button), और उस पर का text |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Secondary actions, और उन पर का text |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | शांत surfaces; गौण text: captions, labels, placeholders |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Hover किया हुआ या highlight किया हुआ item, जैसे menu item या list row, और उसका text |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Destructive actions और errors |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Dividers और borders |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Inputs का border |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Focus rings |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | वही | Chart की series |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | Sidebar की surface, उसका मुख्य action, उसका highlighted item, borders और focus ring |
| `radius` | `radius` | `0.625rem` (10 pt) | | Corner radius |
| `font-sans` | `font_sans` | system font | | App का font: हर वह text जो अपनी कोई family सेट नहीं करता |
| `font-mono` | `font_mono` | system monospace font | | Monospaced font: `font-mono`, `TextView` में code |

<a id="several-crates"></a>

## कई crates

App का Rust code कई crates में बाँटा जा सकता है, जिनमें से हर एक अपने specifier से import होता है: `"rust"` crate paths की एक सूची लेता है, और उसमें हर crate का अपना `#[native_module]` function होता है।

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

हर runner और host इन सभी को link करता है, और `.nsh/types` हर specifier घोषित करता है। Crates Cargo path dependencies (`shared = { path = "../shared" }`) के ज़रिए code साझा करते हैं: company components का एक crate कई crates इस्तेमाल कर सकते हैं और कई apps उसे सूचीबद्ध कर सकते हैं, और केवल `"rust"` में सूचीबद्ध crates ही TSX में export होते हैं। हर सूचीबद्ध crate का अपना package name और specifier होता है; `nsh` दोहराए गए specifier को उन दो paths के साथ report करता है जो उसे साझा करते हैं। Rust app का `"root"` सूची के पहले crate का एक component होता है। `nsh run` और `nsh dev` के दौरान, इनमें से किसी में भी, या उन crates में जिन पर वे path से निर्भर हैं, बदलाव होने पर app फिर से build होता है और restart होता है।

<a id="browser-apis-on-the-web"></a>

## Web पर Browser APIs

Web पर, कोई crate wasm-bindgen और `web-sys` के ज़रिए browser के APIs (WebSocket, `IndexedDB`, …) को कॉल कर सकता है; `nsh` runtime के साथ उनके लिए ज़रूरी glue बनाता है। [Web](./web.md#browser-apis-from-rust) देखें।

<a id="see-also"></a>

## यह भी देखें

- [Project structure](./project-structure.md): `nsh.json` की हर key।
- [Web](./web.md#apps-with-rust-components): browser में Rust apps।
- [Networking](./networking.md#from-rust-components): Rust से `fetch`।
- [CLI](./cli.md#nsh-init): `nsh init --template rust` और `--template mixed`।
