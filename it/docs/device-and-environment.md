---
title: "Dispositivo e ambiente"
description: "Lettura delle dimensioni della finestra, dello schema di colori, della scala dei caratteri, delle aree sicure, della piattaforma, della densità di pixel e della direzione del layout, e come reagire quando cambiano."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# Dispositivo e ambiente

L'ambiente in cui gira un'app cambia mentre l'app è in esecuzione: la finestra viene ridimensionata (rotazione, split view, una finestra su Mac), l'utente passa alla modalità scura o a una dimensione del testo maggiore, la tastiera compare e scompare. NSH espone ciascuno di questi aspetti come un **accessor reattivo**: lo chiami come un signal, e tutto ciò che lo ha letto (uno stile, un testo, un valore calcolato) si aggiorna quando cambia. Non ci sono listener da aggiungere o rimuovere.

In Rust gli accessor sono funzioni di `nsh_core::prelude`; in TSX provengono dai moduli indicati.

| Rust | TSX | Valore |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | Larghezza e altezza della superficie, in punti. |
| `dark()` | `colorScheme()` (`nsh`) | Scuro o chiaro: quello del sistema, oppure quello proprio dell'app (`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | La dimensione del testo preferita dall'utente rispetto a quella predefinita (1 è il valore predefinito). |
| `safe_area()` | `safeArea()` (`nsh`) | Inset della superficie non coperti dall'interfaccia di sistema: alto, destra, basso, sinistra. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | Gli inset nel punto in cui viene renderizzato il componente chiamante (una pagina, una finestra di dialogo). |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | L'altezza della tastiera software e la durata della sua animazione. |
| `locale()` | `locale()` (`nsh`) | Il locale dell'utente come tag BCP 47 (`"en-US"`, `"zh-Hans-CN"`): ciò per cui `Intl` formatta per impostazione predefinita. |
| `lifecycle()` | `lifecycle()` (`nsh`) | Se l'app è in uso: `active`, `inactive` (visibile senza il focus) o `background` ([In background](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | Vedi [Accessibilità](./accessibility.md). |

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

## Dimensione della finestra e layout responsive

`window()` (TSX: `windowSize()`) è la dimensione della superficie su cui NSH esegue il rendering: lo schermo su un telefono, la finestra su un iPad in split view o su un Mac, la vista host quando NSH è incorporato. Usalo per cambiare il layout, non solo le dimensioni:

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

Spesso flexbox, le percentuali e `aspect_ratio` (`aspectRatio`) bastano senza leggere affatto la dimensione; vedi [Layout](./layout.md). In Rust `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` cambia gli stili in base alla larghezza; in TSX con Tailwind, anche le varianti di breakpoint (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) e `portrait:` / `landscape:` seguono la finestra: `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## Modalità scura

L'aspetto segue il sistema, a meno che l'app non imposti il proprio. In Rust, il modo più semplice per supportare la modalità scura è un colore con un valore chiaro e uno scuro, `AdaptiveColor::rgb(light, dark)`: cambia in modo nativo quando cambia l'aspetto, senza nulla da eseguire. In TSX è la variante Tailwind `dark:`, che si applica quando `colorScheme()` è `"dark"`:

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

Per tutto il resto, leggi `dark()` (TSX: `colorScheme()`) in una closure o in un valore calcolato; in TSX, per più di pochi colori, ricava una palette una sola volta:

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

Anche i componenti Rust prendono i loro colori dal tema, che ha valori chiari e scuri (`nsh.json` `"theme"`, vedi [Sviluppare con Rust](./rust.md)), quindi cambiano anch'essi insieme al sistema. Per far corrispondere la barra di stato al tuo sfondo, assegna alle tue pagine e finestre di dialogo un [`statusBar`](../modules/nsh-base.md#status-bar), oppure all'app uno in `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### Un'app con un proprio aspetto

Un'app sempre scura (o sempre chiara) lo dichiara in `nsh.json`, e `dark()` e `colorScheme()`, i colori adattivi, le classi `dark:`, il tema, lo stile predefinito della barra di stato e gli alert lo seguono fin dal primo frame (anche le app pacchettizzate si avviano con quell'aspetto):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX: `setColorScheme` da `nsh`) lo cambia a runtime, per un'impostazione di aspetto interna all'app; `Appearance::System` (`"system"`) torna a seguire il sistema:

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
> Durante lo sviluppo, testa entrambi gli aspetti: `xcrun simctl ui booted appearance dark` cambia aspetto in un simulatore iOS, e Android ha un interruttore del tema scuro nelle Impostazioni rapide. La modifica raggiunge subito la tua app, senza ricaricare.

<a id="text-size"></a>

## Dimensione del testo

`font_scale()` (TSX: `fontScale()`) è l'impostazione della dimensione del testo dell'utente (Dynamic Type su iOS, dimensione del carattere su Android) rispetto a quella predefinita. Testi e input la seguono da soli: `fontSize: 16` viene renderizzato più grande quando l'utente ha chiesto un testo più grande. Per ogni elemento puoi disattivare questo comportamento o limitarlo:

| Rust (su `text` e `input`) | TSX (su `<Text>` e `<Input>`) | Predefinito | Descrizione |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | Segue la dimensione del testo del sistema. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (nessuno) | La scala massima applicata a questo testo. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

Leggi `font_scale()` per adattare il layout che non segue automaticamente il testo, ad esempio passando da una riga a una colonna quando il testo diventa grande: `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` in Rust, `flexDirection: fontScale() > 1.3 ? "column" : "row"` in TSX.

La dimensione del testo scala il testo: ogni testo e input che consente il ridimensionamento del carattere, e gli alert e i toast della piattaforma. Le lunghezze mantengono la loro dimensione: spaziatura, larghezze e altezze, raggi degli angoli, bordi e immagini, in punti o in classi (`p-4`, `rounded-lg`, `w-[2rem]`). I riquadri dimensionati dal contenuto crescono insieme al loro testo.

<a id="language-and-region"></a>

## Lingua e regione

`locale()` è il locale dell'utente, come tag BCP 47 (`locale().as_str()` in Rust). In TSX, `Intl` formatta per impostazione predefinita numeri e date secondo di esso, quindi `new Intl.NumberFormat().format(1234.5)` restituisce `1,234.5` in `en-US` e `1.234,5` in `de-DE`. Leggi `locale()` per scegliere le stringhe delle tue traduzioni: i testi che lo leggono si aggiornano quando cambia.

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

## In un'app che incorpora

Un'app mostrata all'interno di un'app nativa segue le impostazioni di quest'ultima quando le definisce: il locale e la dimensione del testo delle API di embedding (`AppView::set_locale` e `set_font_scale` in Rust su [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) e [Windows](./windows.md), `locale` e `fontScale` in Swift su [iOS](./ios.md), `setLocale` e `setFontScale` in Java su [Android](./android.md)) sostituiscono la lingua e la dimensione del testo del sistema. `locale()`, `Intl`, `fontScale()` e il testo li seguono subito, come seguono una modifica di sistema, e quelli del sistema tornano quando l'app che incorpora li rimuove. Usali quando l'app nativa permette ai suoi utenti di scegliere una lingua o una dimensione del testo propria.

<a id="in-the-background"></a>

## In background

`lifecycle()` (uguale in TSX) indica se l'utente sta usando l'app. È `active` in primo piano, `inactive` finché l'app è ancora visibile ma un'altra app o finestra ha il focus (o il sistema mostra qualcosa sopra di essa: lo switcher delle app, una chiamata in arrivo), e `background` finché non è visibile: in background su un telefono, ridotta a icona su un desktop, una scheda nascosta sul web. Come ogni accessor, aggiorna ciò che lo ha letto, quindi un effect mette in pausa un feed live, il polling o un video in background e li riprende quando l'utente torna:

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

Usa `background` per mettere in pausa il lavoro, e salva ciò che l'utente modifica man mano che lo modifica: il sistema può sospendere un'app pochi secondi dopo il passaggio in background, prima che un effect che legge la modifica sia stato eseguito. Un'app mostrata all'interno di un'app nativa segue lo stato di quest'ultima, e dove un'app ha più finestre (un iPad, un desktop) una vista segue la finestra in cui si trova. Nei test, `app.setLifecycle("background")` di `nsh/test` porta l'app in quello stato ([Test](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## Safe area

Notch, home indicator, barra di stato, barra di navigazione di Android e barra del titolo di Mac Catalyst coprono parti della superficie. Le app NSH disegnano da bordo a bordo su ogni piattaforma, e ricevono le parti coperte come inset.

- `safe_area()` (TSX: `safeArea()`) fornisce gli inset della superficie.
- `cx.insets()` di un componente (TSX: `safeAreaInsets()`) fornisce gli inset **nel punto in cui il componente viene renderizzato**: all'interno di una [pagina](./navigation.md#safe-areas-under-the-header) di navigazione sono misurati sotto la sua intestazione, all'interno di una [finestra di dialogo](../elements/dialog.md) sono quelli della finestra di dialogo. Preferiscilo nei componenti che possono essere mostrati in più posti.
- `env(safe-area-inset-top)`, `-right`, `-bottom` e `-left` di CSS aggiungono padding o spaziatura a qualsiasi vista in base agli inset del punto in cui viene renderizzata, in `padding*` e `margin*` (`calc(env(safe-area-inset-bottom) + 8px)` aggiunge una lunghezza; Tailwind `pt-[env(safe-area-inset-top)]`; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...). Il padding si aggiorna in modo nativo quando gli inset cambiano ([Safe area](../elements/safe-area.md)).

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

Su Android, una vista incorporata sotto una toolbar riceve solo le parti delle barre di sistema che la sovrappongono, come la safe area di UIKit: nessun inset superiore se non raggiunge la barra di stato.

<a id="the-platform"></a>

## La piattaforma

`os()`, `os_version()`, `idiom()`, `is_desktop()` e `is_catalyst()` in Rust, e la costante `platform` da `nsh` in TSX, descrivono dove gira l'app. Restano invariati mentre l'app è in esecuzione.

| Rust | TSX | Descrizione |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` o `Os::Web` (`os().name()` è la stringa di TSX). Mac Catalyst è iOS. |
| `os_version()` | `platform.version` | Maggiore e minore; su Android il livello API e 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` o `Desktop`; `Desktop` esattamente dove vale `is_desktop()`. |
| `is_desktop()` | `platform.desktop` | macOS, Windows o Linux, oppure un browser desktop ([Desktop e mobile](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, in entrambi i suoi idiom. |

`platform` di TSX per intero:

| Membro | Descrizione |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` o `"web"`. Mac Catalyst riporta `"ios"`. |
| `platform.version` | Una stringa: iOS e desktop: la versione del sistema operativo (`"17.5"`); Android: il livello API (`"35"`); il web: `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` o `"desktop"`. `"desktop"` esattamente dove `platform.desktop` è `true`. `"mac"` è l'idiom Mac di UIKit sotto Mac Catalyst, un idiom mobile. |
| `platform.desktop` | Si applica il comportamento desktop: macOS, Windows, Linux e browser desktop. Le prop `desktop={{…}}` e `platform.select({ desktop })` lo seguono. |
| `platform.catalyst` | L'app gira sotto Mac Catalyst (`os` `"ios"`), nell'idiom Mac o iPad. |
| `platform.select(spec)` | Il valore per questa piattaforma; vedi [Codice specifico per piattaforma](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` gira in modalità headless come iOS.

Su [Linux](./linux.md), `platform.os` è `"linux"`, l'idiom `"desktop"` e `platform.version` la versione maggiore e minore del kernel (`"6.12"`): le distribuzioni numerano le proprie release in modi che non si possono confrontare. Lì, la safe area e l'altezza della tastiera sono 0, `colorScheme()` segue in tempo reale l'impostazione del desktop (l'XDG settings portal), `fontScale()` il ridimensionamento del testo del desktop e `pixelRatio()` la scala del display, comprese quelle frazionarie.

Su [macOS](./macos.md) (il backend AppKit), `platform.os` è `"macos"`, l'idiom `"desktop"` e `platform.version` la versione di macOS. La safe area e l'altezza della tastiera sono 0, `colorScheme()` segue in tempo reale l'aspetto del sistema, `fontScale()` è 1 e `pixelRatio()` la scala di backing del display.

Su [Windows](./windows.md), `platform.os` è `"windows"`, l'idiom `"desktop"` e `platform.version` `"10.0"`, anche su Windows 11 (Windows ha mantenuto il numero di versione). La safe area e l'altezza della tastiera sono 0, `colorScheme()` segue in tempo reale Impostazioni > Personalizzazione > Colori, `fontScale()` l'impostazione Dimensione del testo (da 1 a 2,25), `reduceMotion()` l'impostazione degli effetti di animazione, `pixelRatio()` la scala del monitor, e `Intl` formatta secondo il formato regionale dell'utente.

In un browser ([il runtime web](./web.md)), `platform.os` è `"web"` e `platform.version` `"0.0"`. L'idiom è `"desktop"` con un mouse e una finestra larga almeno 600 punti, `"pad"` su un tablet e `"phone"` su un telefono, deciso all'avvio dell'app. Il locale, `reduceMotion()`, `fontScale()` (la dimensione del testo del browser), `pixelRatio()`, la safe area e l'altezza della tastiera provengono dal browser e lo seguono in tempo reale.

<a id="pixel-density"></a>

## Densità di pixel

`pixel_ratio()` e `round_to_nearest_pixel(points)` in Rust, e `pixelRatio()` da `nsh` in TSX, convertono tra punti e pixel del dispositivo.

| Rust | TSX | Descrizione |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | Pixel del dispositivo per punto (2 o 3 sulla maggior parte dei telefoni), reattivo. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | Punti arrotondati al pixel del dispositivo più vicino. |

Una hairline, alta un pixel del dispositivo:

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

`pixel_ratio()` e `pixelRatio()` sono reattivi, quindi una hairline segue una finestra spostata su uno schermo con un'altra densità.

<a id="right-to-left"></a>

## Da destra a sinistra

Quando la lingua del dispositivo si scrive da destra a sinistra (arabo, ebraico, persiano, ...), NSH imposta il layout dell'app da destra a sinistra: le righe partono da destra, le proprietà di stile logiche assumono i lati da destra a sinistra, il testo si allinea a destra e i widget nativi si specchiano. La direzione del layout segue da sola la lingua dell'utente. Lo stile `direction` di una vista (`"ltr"`, `"rtl"` o `"inherit"`; `.direction(LayoutDirection::..)` in Rust) imposta la direzione del suo sottoalbero; sulla vista radice imposta quella dell'app.

Le modifiche si applicano subito, senza riavviare l'app; la demo in questa pagina attiva e disattiva lo stile `direction`.

Scrivi layout che funzionano in entrambi i versi con le proprietà logiche: in Rust `ms` / `me` e `ps` / `pe` (i nomi di Tailwind), in TSX `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` e così via, che significano sinistra e destra nei layout da sinistra a destra e l'opposto da destra a sinistra. `left` e `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) mantengono i loro lati in entrambi, come in CSS. Lo stile `direction` (`"inherit"`, `"ltr"`, `"rtl"`) sovrascrive la direzione per un sottoalbero, ad esempio per mantenere da sinistra a destra un numero di telefono o i controlli di un lettore multimediale. Le varianti Tailwind `rtl:` e `ltr:` si applicano per direzione.

Le viste di scorrimento orizzontale e le liste partono dall'estremità destra nei layout da destra a sinistra. Su Android, l'app host deve dichiarare `android:supportsRtl="true"` nel proprio manifest affinché i widget nativi si specchino.

<a id="related"></a>

## Vedi anche

- [API del dispositivo di `nsh`](../modules/nsh.md#device): il riferimento.
- [Codice specifico per piattaforma](./platform-specific.md): `platform.select`, prop e moduli per piattaforma.
- [Accessibilità](./accessibility.md): screen reader e riduzione del movimento.
- [Safe area](../elements/safe-area.md), [Tastiera](../elements/keyboard.md) e [la barra di stato](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`, varianti di breakpoint e di orientamento.
