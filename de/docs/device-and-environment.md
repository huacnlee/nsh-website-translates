---
title: "Gerät und Umgebung"
description: "Auslesen von Fenstergröße, Farbschema, Schriftskalierung, Safe Areas, Plattform, Pixeldichte und Layoutrichtung sowie Reagieren auf Änderungen."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---


# Gerät und Umgebung

In einer laufenden App ändert sich die Umgebung ständig: Das Fenster wird in der Größe verändert (Drehung, Split View, ein Mac-Fenster), der Nutzer wechselt in den Dark Mode oder zu einer größeren Textgröße, die Tastatur erscheint und verschwindet. NSH stellt jede dieser Änderungen als **reaktiven Accessor** bereit: Du rufst ihn wie ein Signal auf, und alles, was ihn gelesen hat (ein Style, ein Text, ein berechneter Wert), aktualisiert sich bei einer Änderung. Es müssen keine Listener hinzugefügt oder entfernt werden.

In Rust sind die Accessoren Funktionen von `nsh_core::prelude`; in TSX stammen sie aus den aufgeführten Modulen.

| Rust | TSX | Wert |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | Breite und Höhe der Oberfläche in Punkten. |
| `dark()` | `colorScheme()` (`nsh`) | Dunkel oder hell: das Erscheinungsbild des Systems oder das eigene der App (`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | Die bevorzugte Textgröße des Nutzers relativ zum Standard (1 ist der Standard). |
| `safe_area()` | `safeArea()` (`nsh`) | Insets der Oberfläche, die nicht von der System-UI verdeckt werden: oben, rechts, unten, links. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | Die Insets an der Stelle, an der die aufrufende Komponente gerendert wird (eine Seite, ein Dialog). |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | Höhe und Animationsdauer der Software-Tastatur. |
| `locale()` | `locale()` (`nsh`) | Die Locale des Nutzers als BCP-47-Tag (`"en-US"`, `"zh-Hans-CN"`): das, wofür `Intl` standardmäßig formatiert. |
| `lifecycle()` | `lifecycle()` (`nsh`) | Ob die App gerade genutzt wird: `active`, `inactive` (sichtbar, aber ohne Fokus) oder `background` ([Im Hintergrund](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | Siehe [Barrierefreiheit](./accessibility.md). |

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

## Fenstergröße und responsives Layout

`window()` (TSX: `windowSize()`) ist die Größe der Oberfläche, in die NSH rendert: der Bildschirm auf einem Smartphone, das Fenster auf einem iPad in Split View oder auf einem Mac, die Host-View, wenn NSH eingebettet ist. Verwende sie, um das Layout zu ändern, nicht nur Größen:

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

Oft reichen Flexbox, Prozentwerte und `aspect_ratio` (`aspectRatio`) aus, ohne die Größe überhaupt zu lesen; siehe [Layout](./layout.md). Rusts `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` schaltet Styles abhängig von der Breite um; in TSX mit Tailwind folgen die Breakpoint-Varianten (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) und `portrait:` / `landscape:` ebenfalls dem Fenster: `class="grid grid-cols-2 md:grid-cols-4"`.

## Dark Mode

Das Erscheinungsbild folgt dem System, solange die App kein eigenes festlegt. In Rust unterstützt du den Dark Mode am einfachsten mit einer Farbe, die einen hellen und einen dunklen Wert hat, `AdaptiveColor::rgb(light, dark)`: Sie wechselt nativ, sobald sich das Erscheinungsbild ändert, ohne dass Code ausgeführt werden muss. In TSX ist es die Tailwind-Variante `dark:`, die gilt, wenn `colorScheme()` den Wert `"dark"` hat:

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

Für alles andere liest du `dark()` (TSX: `colorScheme()`) in einem Closure oder einem berechneten Wert; in TSX leitest du bei mehr als ein paar Farben einmalig eine Palette ab:

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

Auch Rust-Komponenten beziehen ihre Farben aus dem Theme, das helle und dunkle Werte hat (`nsh.json` `"theme"`, siehe [Building with Rust](./rust.md)), sodass sie ebenfalls mit dem System wechseln. Damit die Statusleiste zu deinem Hintergrund passt, gib deinen Seiten und Dialogen eine [`statusBar`](../modules/nsh-base.md#status-bar) oder der App eine in `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### Eine App mit eigenem Erscheinungsbild

Eine App, die immer dunkel (oder immer hell) ist, legt das in `nsh.json` fest, und `dark()` und `colorScheme()`, adaptive Farben, `dark:`-Klassen, das Theme, der Standardstil der Statusleiste und Alerts folgen ab dem ersten Frame (auch gepackte Apps starten darin):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX: `setColorScheme` aus `nsh`) ändert es zur Laufzeit, etwa für eine Einstellung zum Erscheinungsbild innerhalb der App; `Appearance::System` (`"system"`) folgt wieder dem System:

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
> Teste während der Entwicklung beide Erscheinungsbilder: `xcrun simctl ui booted appearance dark` schaltet einen iOS-Simulator um, und Android hat einen Schalter für das dunkle Design in den Quick Settings. Die Änderung erreicht deine App sofort, ohne Reload.

<a id="text-size"></a>

## Textgröße

`font_scale()` (TSX: `fontScale()`) ist die Einstellung des Nutzers für die Textgröße (Dynamic Type unter iOS, Schriftgröße unter Android) relativ zum Standard. Texte und Eingabefelder folgen ihr von selbst: `fontSize: 16` wird größer dargestellt, wenn der Nutzer größeren Text eingestellt hat. Pro Element kannst du dies abschalten oder begrenzen:

| Rust (auf `text` und `input`) | TSX (auf `<Text>` und `<Input>`) | Standard | Beschreibung |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | Der System-Textgröße folgen. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (keine) | Die größte Skalierung, die auf diesen Text angewendet wird. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

Lies `font_scale()`, um Layouts anzupassen, die dem Text nicht automatisch folgen, zum Beispiel um eine Zeile in eine Spalte umzuwandeln, wenn der Text groß wird: `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` in Rust, `flexDirection: fontScale() > 1.3 ? "column" : "row"` in TSX.

Die Textgröße skaliert Text: jeden Text und jedes Eingabefeld, die Schriftskalierung erlauben, sowie die Alerts und Toasts der Plattform. Längen behalten ihre Größe: Abstände, Breiten und Höhen, Eckenradien, Rahmen und Bilder, in Punkten oder in Klassen (`p-4`, `rounded-lg`, `w-[2rem]`). Boxen, deren Größe vom Inhalt bestimmt wird, wachsen mit ihrem Text.

<a id="language-and-region"></a>

## Sprache und Region

`locale()` ist die Locale des Nutzers als BCP-47-Tag (`locale().as_str()` in Rust). In TSX formatiert `Intl` Zahlen und Datumsangaben standardmäßig dafür, sodass `new Intl.NumberFormat().format(1234.5)` in `en-US` den Wert `1,234.5` und in `de-DE` den Wert `1.234,5` liefert. Lies `locale()`, um die Strings deiner eigenen Übersetzungen auszuwählen: Die Texte, die sie lesen, aktualisieren sich bei einer Änderung.

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

## In einer einbettenden App

Eine App, die innerhalb einer nativen App angezeigt wird, folgt den eigenen Einstellungen dieser App, sofern sie welche setzt: Die Locale und die Textgröße der Embedding-APIs (`AppView::set_locale` und `set_font_scale` in Rust auf [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) und [Windows](./windows.md), `locale` und `fontScale` in Swift auf [iOS](./ios.md), `setLocale` und `setFontScale` in Java auf [Android](./android.md)) ersetzen Sprache und Textgröße des Systems. `locale()`, `Intl`, `fontScale()` und Text folgen ihnen sofort, so wie sie einer Systemänderung folgen, und die Werte des Systems kehren zurück, wenn die einbettende App sie zurücksetzt. Nutze sie, wenn die native App ihren Nutzern erlaubt, eine eigene Sprache oder Textgröße zu wählen.

<a id="in-the-background"></a>

## Im Hintergrund

`lifecycle()` (in TSX identisch) gibt an, ob der Nutzer die App gerade verwendet. Der Wert ist `active` im Vordergrund, `inactive`, solange die App noch sichtbar ist, aber eine andere App oder ein anderes Fenster den Fokus hat (oder das System etwas darüber anzeigt: den App-Umschalter, einen eingehenden Anruf), und `background`, solange sie nicht sichtbar ist: im Hintergrund auf einem Smartphone, minimiert auf einem Desktop, ein verborgener Tab im Web. Wie jeder Accessor aktualisiert er alles, was ihn gelesen hat, sodass ein Effect einen Live-Feed, Polling oder ein Video im Hintergrund pausiert und fortsetzt, wenn der Nutzer zurückkehrt:

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

Verwende `background`, um Arbeit zu pausieren, und speichere Änderungen des Nutzers, sobald sie passieren: Das System kann eine App wenige Sekunden nach dem Wechsel in den Hintergrund anhalten, noch bevor ein Effect, der die Änderung liest, gelaufen ist. Eine App, die innerhalb einer nativen App angezeigt wird, folgt dem Zustand dieser App, und wenn eine App mehrere Fenster hat (ein iPad, ein Desktop), folgt eine View dem Fenster, in dem sie sich befindet. In Tests versetzt `app.setLifecycle("background")` von `nsh/test` die App dorthin ([Testing](./testing-and-trace.md#steps)).

## Safe Areas

Notches, der Home-Indikator, die Statusleiste, Androids Navigationsleiste und die Titelleiste von Mac Catalyst verdecken Teile der Oberfläche. NSH-Apps zeichnen auf jeder Plattform randlos und erhalten die verdeckten Bereiche als Insets.

- `safe_area()` (TSX: `safeArea()`) liefert die Insets der Oberfläche.
- Die `cx.insets()` einer Komponente (TSX: `safeAreaInsets()`) liefert die Insets, **an der Stelle, an der die Komponente gerendert wird**: Innerhalb einer Navigations-[Seite](./navigation.md#safe-areas-under-the-header) werden sie unterhalb ihres Headers gemessen, innerhalb eines [Dialogs](../elements/dialog.md) sind es die des Dialogs. Bevorzuge sie in Komponenten, die an mehreren Stellen angezeigt werden können.
- CSS' `env(safe-area-inset-top)`, `-right`, `-bottom` und `-left` versehen jede View mit Padding oder Abstand entsprechend den Insets an der Stelle, an der sie gerendert wird, in `padding*` und `margin*` (`calc(env(safe-area-inset-bottom) + 8px)` addiert eine Länge; Tailwind `pt-[env(safe-area-inset-top)]`; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...). Das Padding aktualisiert sich nativ, wenn sich die Insets ändern ([Safe area](../elements/safe-area.md)).

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

Unter Android erhält eine View, die unterhalb einer Toolbar eingebettet ist, nur die Teile der Systemleisten, die sie überlappen, wie bei der Safe Area von UIKit: kein oberes Inset, wenn sie nicht bis zur Statusleiste reicht.

<a id="the-platform"></a>

## Die Plattform

`os()`, `os_version()`, `idiom()`, `is_desktop()` und `is_catalyst()` in Rust sowie die Konstante `platform` aus `nsh` in TSX beschreiben, wo die App läuft. Sie bleiben gleich, solange die App läuft.

| Rust | TSX | Beschreibung |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` oder `Os::Web` (`os().name()` ist der String in TSX). Mac Catalyst ist iOS. |
| `os_version()` | `platform.version` | Haupt- und Nebenversion; unter Android das API-Level und 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` oder `Desktop`; `Desktop` genau dort, wo `is_desktop()` gilt. |
| `is_desktop()` | `platform.desktop` | macOS, Windows oder Linux, oder ein Desktop-Browser ([Desktop and mobile](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, in beiden Idioms. |

TSX' `platform` vollständig:

| Member | Beschreibung |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` oder `"web"`. Mac Catalyst meldet `"ios"`. |
| `platform.version` | Ein String: iOS und Desktops: die OS-Version (`"17.5"`); Android: das API-Level (`"35"`); Web: `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` oder `"desktop"`. `"desktop"` genau dort, wo `platform.desktop` den Wert `true` hat. `"mac"` ist das Mac-Idiom von UIKit unter Mac Catalyst, ein mobiles Idiom. |
| `platform.desktop` | Desktop-Verhalten gilt: macOS, Windows, Linux und Desktop-Browser. `desktop={{…}}`-Props und `platform.select({ desktop })` folgen ihm. |
| `platform.catalyst` | Die App läuft unter Mac Catalyst (`os` `"ios"`), im Mac- oder im iPad-Idiom. |
| `platform.select(spec)` | Der Wert für diese Plattform; siehe [Platform-specific code](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` läuft headless als iOS.

Unter [Linux](./linux.md) ist `platform.os` gleich `"linux"`, das Idiom `"desktop"` und `platform.version` die Haupt- und Nebenversion des Kernels (`"6.12"`): Distributionen nummerieren ihre Releases auf eine Weise, die sich nicht vergleichen lässt. Dort sind Safe Area und Tastaturhöhe 0, `colorScheme()` folgt live der Einstellung des Desktops (dem XDG-Settings-Portal), `fontScale()` der Textskalierung des Desktops und `pixelRatio()` der Skalierung des Displays, einschließlich gebrochener Werte.

Unter [macOS](./macos.md) (dem AppKit-Backend) ist `platform.os` gleich `"macos"`, das Idiom `"desktop"` und `platform.version` die macOS-Version. Safe Area und Tastaturhöhe sind 0, `colorScheme()` folgt live dem Erscheinungsbild des Systems, `fontScale()` ist 1 und `pixelRatio()` die Backing-Skalierung des Displays.

Unter [Windows](./windows.md) ist `platform.os` gleich `"windows"`, das Idiom `"desktop"` und `platform.version` `"10.0"`, auch unter Windows 11 (Windows hat die Versionsnummer beibehalten). Safe Area und Tastaturhöhe sind 0, `colorScheme()` folgt live Settings > Personalization > Colors, `fontScale()` der Einstellung Text size (1 bis 2,25), `reduceMotion()` der Einstellung für Animationseffekte, `pixelRatio()` der Skalierung des Monitors, und `Intl` formatiert im regionalen Format des Nutzers.

In einem Browser ([the web runtime](./web.md)) ist `platform.os` gleich `"web"` und `platform.version` `"0.0"`. Das Idiom ist `"desktop"` mit einer Maus und einem Fenster von mindestens 600 Punkten Breite, `"pad"` auf einem Tablet und `"phone"` auf einem Smartphone, festgelegt beim Start der App. Die Locale, `reduceMotion()`, `fontScale()` (die Textgröße des Browsers), `pixelRatio()`, die Safe Area und die Tastaturhöhe stammen vom Browser und folgen ihm live.

<a id="pixel-density"></a>

## Pixeldichte

`pixel_ratio()` und `round_to_nearest_pixel(points)` in Rust sowie `pixelRatio()` aus `nsh` in TSX rechnen zwischen Punkten und Geräte-Pixeln um.

| Rust | TSX | Beschreibung |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | Geräte-Pixel pro Punkt (2 oder 3 auf den meisten Smartphones), reaktiv. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | Punkte, gerundet auf das nächstgelegene Geräte-Pixel. |

Eine Haarlinie, ein Geräte-Pixel hoch:

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

`pixel_ratio()` und `pixelRatio()` sind reaktiv, sodass eine Haarlinie einem Fenster folgt, das auf einen Bildschirm mit anderer Dichte verschoben wird.

<a id="right-to-left"></a>

## Rechts-nach-links

Wenn die Sprache des Geräts von rechts nach links geschrieben wird (Arabisch, Hebräisch, Persisch, ...), legt NSH die App von rechts nach links aus: Zeilen laufen von rechts, die logischen Style-Eigenschaften nehmen ihre Rechts-nach-links-Seiten an, Text wird rechts ausgerichtet, und native Widgets werden gespiegelt. Die Layoutrichtung folgt der Sprache des Nutzers von selbst. Der Style `direction` einer View (`"ltr"`, `"rtl"` oder `"inherit"`; `.direction(LayoutDirection::..)` in Rust) legt die Richtung ihres Teilbaums fest; auf der Root-View legt er die der App fest.

Änderungen werden sofort angewendet, ohne die App neu zu starten; die Demo auf dieser Seite schaltet den Style `direction` um.

Schreibe Layouts, die in beide Richtungen funktionieren, mit den logischen Eigenschaften: in Rust `ms` / `me` und `ps` / `pe` (die Namen von Tailwind), in TSX `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` und so weiter, die in Links-nach-rechts-Layouts links und rechts bedeuten und von rechts nach links das Gegenteil. `left` und `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) behalten in beiden ihre Seiten, wie in CSS. Der Style `direction` (`"inherit"`, `"ltr"`, `"rtl"`) überschreibt die Richtung für einen Teilbaum, zum Beispiel um eine Telefonnummer oder die Steuerelemente eines Mediaplayers von links nach rechts zu belassen. Die Tailwind-Varianten `rtl:` und `ltr:` gelten je nach Richtung.

Horizontale Scroll-Views und Listen beginnen in Rechts-nach-links-Layouts am rechten Ende. Unter Android muss die Host-App `android:supportsRtl="true"` in ihrem Manifest deklarieren, damit native Widgets gespiegelt werden.

<a id="related"></a>

## Siehe auch

- [`nsh`s Geräte-API](../modules/nsh.md#device): die Referenz.
- [Platform-specific code](./platform-specific.md): `platform.select`, Plattform-Props und -Module.
- [Accessibility](./accessibility.md): Screenreader und reduzierte Bewegung.
- [Safe area](../elements/safe-area.md), [Keyboard](../elements/keyboard.md) und [die Statusleiste](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`, Breakpoint- und Orientierungsvarianten.
