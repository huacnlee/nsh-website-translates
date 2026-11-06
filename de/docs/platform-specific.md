---
title: "Plattformspezifischer Code"
description: "Eine App für Smartphones, Desktops und Browser schreiben - plattformspezifische Props in ios={{}} / android={{}} / desktop={{}} / web={{}}, die Module nsh/mobile und nsh/desktop, platform.os und platform.select sowie plattformspezifische Tailwind-Varianten."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---


# Plattformspezifischer Code

Ein NSH-Bundle läuft auf iOS, Android, macOS, Windows und Linux (und in Mac Catalyst) sowie in Browsern über die [Web-Runtime](./web.md). Die meisten Teile einer App kommen ganz ohne Plattformprüfungen aus: Elemente, Styles, Layout und Module verhalten sich überall gleich, und die daraus gebauten Komponenten sehen überall gleich aus. Wenn etwas wirklich plattformspezifisch ist, gibt NSH dafür einen klaren Platz, damit Plattformcode sichtbar und abgegrenzt bleibt:

| Rust | TSX | Für |
|---|---|---|
| [Builder-Methoden (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | Props, die nur eine Plattform hat. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | APIs, die nur mobile Plattformen oder nur Desktops haben. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | Werte oder Code pro Plattform auswählen. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [Klassen `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | Styles pro Plattform. |

<a id="desktop-and-mobile"></a>

## Desktop und Mobile

Jede Plattform ist nach einer einzigen Regel entweder Desktop oder Mobile. Desktop sind macOS, Windows, Linux und Browser im Desktop-Idiom (eine Maus und ein breites Fenster, [das Web](./web.md)). Mobile sind iOS, Android und Browser im Telefon- oder Tablet-Idiom; Mac Catalyst nutzt das iOS-Backend und ist daher ebenfalls Mobile, mit `ios={{…}}`-Props. `desktop={{…}}`-Props, `platform.select({ desktop, mobile })`, `platform.desktop` und `platform.idiom === "desktop"` folgen alle dieser Regel, ebenso die Komponenten von `nsh/base` (ein Menü ist auf Desktops ein Popup und auf Mobilgeräten ein Sheet) und in Rust `is_desktop()`.

`isAvailable` von `nsh/desktop` beantwortet eine engere Frage: ob die Fenster- und Menü-APIs dieses Moduls funktionieren, was unter macOS, Windows und Linux der Fall ist. Steuere Layout, Dichte und Eingabe über `platform.desktop`, und Aufrufe von `Window` und `Menu` über `isAvailable`.

<a id="platform-only-props"></a>

## Plattformspezifische Props

In Rust ist ein Prop, den nur eine Plattform hat, eine Builder-Methode wie jede andere (`.ripple(..)`, `.elevation(..)` für Android, `.input_accessory(..)` für iOS, `.window_drag(..)` für die Desktops); die anderen Plattformen ignorieren ihn. In TSX sind Props, die nur auf einer Plattform existieren, in einem nach ihr benannten Objekt gruppiert. Jedes Element akzeptiert `ios`, `android`, `desktop` (macOS, Windows, Linux und Browser im Desktop-Idiom) und `web` (Browser); auf anderen Plattformen wird das Objekt ignoriert, und auf der eigenen Plattform werden nur seine Schlüssel angewendet. Ein Desktop-Browser wendet sowohl `desktop` als auch `web` an.

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

Die TSX-Objekte sind wie jedes Prop reaktiv; ein aus dem Objekt entfernter Schlüssel wird zurückgesetzt.

Was es heute gibt:

| Rust | TSX | Auf | Beschreibung |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | jedes Element | Der Material-Ripple beim Drücken: Farbe, borderless, Radius, Vordergrund. |
| `.elevation(..)` | `android={{ elevation }}` | jedes Element | Der Material-Schatten in Punkt, aus der Form der View. |
| | `android={{ accessibilityLiveRegion }}` | jedes Element | `"none"`, `"polite"` oder `"assertive"`: TalkBack kündigt Änderungen der View an. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | Der Inhalt des Dialogs reicht unter die Statusleiste. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | Die `InputAccessoryView`, die über der Tastatur angezeigt wird. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | Die iOS-Namen für Autofill-Typen (`AutoFill` in Rust deckt beide Plattformen ab). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | Die erlaubten Ausrichtungen. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | Wischen vor und zurück im Seitenverlauf. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | Der eigene Bar-Button von UIKit am Ende des Headers, der `headerRight` auslöst. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | Der eigene Bar-Button von UIKit am Anfang des Headers, der `headerLeft` auslöst. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | Der eigene Bar-Button von UIKit mit einem SF Symbol am Ende des Headers, der `headerRight` auslöst. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | Der eigene Bar-Button von UIKit mit einem SF Symbol am Anfang des Headers, der `headerLeft` auslöst. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: Zwei-Finger-Wischen auf dem Trackpad geht im Seitenverlauf vor und zurück; Windows: Wischen auf dem Touchscreen; Linux: Wischen auf dem Touchpad. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | jedes Element | Beim Drücken wird das Fenster gezogen, wie es die Titelleiste des Systems täte (siehe [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

In TSX werden `desktop={{…}}` und `web={{…}}` überall akzeptiert. Die Typen (`IOSProps`, `AndroidProps`, `DesktopProps` und ihre Formen pro Element) zeigen deinem Editor, was jedes Element annimmt.

Was ein Element auf jeder Plattform bedeutet, ist ein Prop auf oberster Ebene (in Rust eine Methode gleichen Namens) und wird dort angewendet, wo es sinnvoll ist: `title`, `headerStyle`, `headerLargeTitle` und `headerBackTitle` von `NavPage` richten den System-Header von iOS und Android ein, sein Slot `header` ist der Header der Desktops und des Webs, und `presentation` von `Dialog` wählt die Sheets von iOS. `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` und die übrigen von `AlertDialog.show` funktionieren auf jeder Plattform. Ein systemeigenes Feature einer Plattform steht in deren Objekt, und wenn mehrere Plattformen es haben, in jedem von ihnen unter demselben Namen: `allowsBackForwardNavigationGestures` von `WebView`, die Wischgesten des Systems durch den Seitenverlauf, steht in `ios={{…}}` und `desktop={{…}}`.

<a id="platform-modules"></a>

## Plattformmodule

In Rust sind die APIs, die nur eine Plattform hat, Funktionen von `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) und von `nsh_core::element::desktop` (das Fenster: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`; Menüs: `set_application_menu`, `popup_menu`); anderswo tun sie nichts. In TSX enthält `nsh/mobile` die APIs von iOS und Android (einige davon nur für eine der beiden Plattformen), `nsh/desktop` die der Desktops. Beide lassen sich auf jeder Plattform importieren, sodass ein Bundle überall läuft: Auf anderen Plattformen kehren ihre Funktionen sofort zurück, und ihre Komponenten belegen keinen Platz. Jedes exportiert `isAvailable`, das auf den eigenen Plattformen `true` ist; `platform.os` unterscheidet sie.

### nsh/mobile

`isAvailable` ist `true` auf iOS (mit Mac Catalyst) und Android. Beide Plattformen haben [`TabBar`](../modules/nsh-mobile.md#tabbar), die Tab-Leiste des Systems.

#### BackHandler (Android)

| Rust | TSX | Beschreibung |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | Lauscht auf die Zurück-Taste nach Dialogen und vor Stacks; gib `true` zurück, wenn sie behandelt wurde. Der Listener gehört zu der Komponente (oder dem Effekt), die ihn hinzugefügt hat; in TSX gibt der Aufruf außerdem eine Funktion zurück, die ihn früher beendet. |
| | `BackHandler.exitApp()` | Beendet die App. |

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

Die Zurück-Taste wird zuerst vom obersten Dialog behandelt, dann von den Back-Listenern (der jüngste zuerst), dann vom obersten Navigations-Stack; die App wird beendet, wenn niemand sie behandelt hat. Siehe [Navigation](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | Beschreibung |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | Eine Leiste über der Tastatur der Eingaben, die ihre native ID nennen (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`). |

Siehe [Formulare und die Tastatur](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

Rust-Apps zeichnen ihre eigenen Titelleisten mit `nsh_core::element::desktop` ([Mit Rust entwickeln](./rust.md#desktop-title-bars)). Das Modul für TSX:

| Export | Beschreibung |
|---|---|
| `Window` | Das Fenster: `setTitle`, `setTitleBar({ style: "hidden" })` für eine eigene Titelleiste der App, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | Die Höhe der ausgeblendeten Titelleiste und der Platz, den die Fenstersteuerung des Systems einnimmt (reaktiv). |
| `Menu` | `setApplicationMenu(items)` (die Menüleiste, mit Tastenkürzeln) und `popup(items, at?)` (Kontextmenüs). |
| `isAvailable` | `true` dort, wo die Fenster- und Menü-APIs funktionieren: macOS, Windows und Linux. Desktop-Browser haben `platform.desktop` und behalten das Fenster und die Menüs des Browsers. |

Siehe [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### Die Statusleiste

Auf beiden Plattformen gehört die Statusleiste der obersten Seite oder dem obersten Dialog, wie in UIKit, wo der oberste View Controller sie bestimmt: [`NavPage` und `Dialog` akzeptieren `statusBar`](../modules/nsh-base.md#status-bar) (in Rust `.status_bar(StatusBarStyle::Light)` oder ein `StatusBarSetting` für die übrigen Felder) mit `foreground` (`"auto"`, `"light"` für dunkle Hintergründe, `"dark"` für helle), `hidden` und `animated`. Die zuletzt angezeigte Seite oder der zuletzt angezeigte Dialog gewinnt, Feld für Feld, und die darunterliegende gilt wieder, sobald sie verschwindet. `"statusBar"` von `nsh.json` ist der Standard der App darunter.

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

In einer App, die in eine native App eingebettet ist, bestimmt unter iOS der View Controller der Host-App die Statusleiste. Eine App, die `"capabilities"` in `nsh.json` deklariert, braucht `"statusBar": true`, um sie zu ändern.

<a id="platformos-and-platformselect"></a>

## platform.os und platform.select

`os()` in Rust und die Konstante `platform` aus `nsh` in TSX verraten dir, wo die App läuft: `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` oder `Os::Web`, und `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` oder `"web"` (Mac Catalyst ist `"ios"`, mit `platform.catalyst` in beiden Idiomen; das [macOS-Backend](./macos.md) ist `"macos"`, das [Linux-Backend](./linux.md) `"linux"` und das [Windows-Backend](./windows.md) `"windows"`, und ihre Elemente wenden ihre `desktop`-Props an; [Browser](./web.md) sind `"web"` und wenden ebenfalls `desktop`-Props an, wenn `platform.desktop` `true` ist). Siehe [Gerät und Umgebung](./device-and-environment.md#the-platform) für die Version, das Idiom und den Rest.

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

In Rust wählt ein `match os()` den Wert aus, mit `is_desktop()` für die Desktops. In TSX gibt `platform.select(spec)` den Wert für diese Plattform zurück. Es sucht nach dem eigenen Schlüssel des Betriebssystems, dann nach `desktop` oder `mobile` gemäß [der obigen Regel](#desktop-and-mobile) (`platform.desktop`), dann nach `native` (jede Plattform außer dem Web), dann nach `default`:

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

Es gibt `undefined` zurück, wenn nichts passt und es kein `default` gibt.

<a id="rendering-different-components"></a>

### Unterschiedliche Komponenten rendern

Wähle Komponenten auf dieselbe Weise aus, auf Modulebene (TSX), wenn sich die Wahl nie ändert:

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

oder inline mit [`when` / `<If>`](../elements/control-flow.md):

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

## Plattformvarianten in Tailwind

Rust gestaltet pro Plattform mit `.when(os() == Os::Ios, |v| ..)`; in TSX wenden die Varianten `ios:`, `android:` und `web:` Klassen auf einer Plattform an:

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

## Gemeinsames Verhalten bevorzugen

Bevor du zu einer Plattformprüfung greifst, überlege, ob der Unterschied für deine Nutzer eine Rolle spielt. Elemente und Styles bilden bereits dort das native Verhalten jeder Plattform ab, wo es sich unterscheiden sollte (Scroll-Physik, Textdarstellung, Tastaturen, Barrierefreiheit), und bleiben gleich, wo Nutzer Konsistenz erwarten (das eigene Erscheinungsbild deiner App). Plattformprüfungen sind am besten für Plattformkonventionen reserviert, auf die sich Nutzer verlassen: die Zurück-Taste und Toasts von Android, Sheets und große Titel von iOS, Autofill-Namen, der Ripple von Android.

<a id="related"></a>

## Siehe auch

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) und [`BackHandler`](../modules/nsh-mobile.md#backhandler): die Referenzen.
- [Geräte-API von `nsh`](../modules/nsh.md#device): `platform`.
- [Native Komponenten](./native-components.md): Views verwenden, die deine Host-App auf jeder Plattform bereitstellt.
- [Tailwind](./tailwind.md): alle Varianten.
