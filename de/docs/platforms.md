---
title: "Plattformübersicht"
description: "Wo NSH läuft: iOS, Android, macOS, Windows, Linux, GPUI und das Web, jeweils mit eigenem Backend; wie Sie eine Rust- oder TSX-App auf jeder Plattform ausführen, paketieren und einbetten und was jede Plattform dafür benötigt."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---


# Plattformübersicht

NSH läuft auf Smartphones, Desktops und im Web: iOS, Android, macOS, Windows, Linux, GPUI und Webseiten. Jede Plattform hat ein eigenes Backend, das mit der nativen UI der Plattform zeichnet. Eine App besteht also aus UIKit-Views auf dem iPhone, AppKit-Views auf dem Mac, GTK-4-Widgets unter Linux, GPUI-Elementen in einer GPUI-App und HTML im Browser, jeweils mit Text, Eingabe, Barrierefreiheit und Dark Mode der Plattform. Alles oberhalb des Backends wird geteilt: Der reaktive Graph, der Renderer, das Taffy-Layout, die Komponenten und die nativen Module sind überall derselbe Rust-Code, sodass eine App auf allen Plattformen läuft. Eine in Rust geschriebene App besteht aus diesem Code und deinem Crate, ohne JavaScript-VM. Eine TSX-App führt ihre Module darauf mit QuickJS aus ([Mit Rust entwickeln](./rust.md)).

Auf jeder Plattform wird eine App auf zwei Arten genutzt: paketiert als installierbare App der jeweiligen Plattform (`nsh package`) oder eingebettet in eine eigene native App, unabhängig davon, ob der Host ein Rust-Root linkt oder TSX zur Laufzeit lädt. Entwickelt wird mit `nsh run` (Änderungen an Rust-Code bauen die App neu und starten sie neu, Änderungen an TSX sind Hot Updates).

<a id="at-a-glance"></a>

## Auf einen Blick

| Plattform | Backend; Text | Läuft auf | Entwickeln | Paketieren |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit; CoreText | iOS 15.0+, Geräte und Simulator | `nsh run --target ios` | `.app` (Simulator), signiertes `.ipa` |
| [Android](./android.md) | Android-Views; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` und `x86_64` | `nsh run --target android` | signiertes `.apk` |
| [macOS](./macos.md) | AppKit und Core Animation; CoreText | macOS 14+ | `nsh run --target macos` | ad hoc signiertes `.app` |
| [Windows](./windows.md) | Win32-Fenster, gezeichnet mit Direct2D; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (Standard unter Windows) | ein Verzeichnis und ein `.zip` |
| [Linux](./linux.md) | GTK-4-Widgets; Pango | GTK 4.14+ | `nsh run` (Standard unter Linux) | ein Verzeichnis und ein `.tar.gz` |
| [GPUI](./gpui.md) | GPUI; Textsystem von GPUI | macOS, Windows, Linux (Vulkan) | in deiner GPUI-App; TSX auch mit `nsh run --target gpui` | innerhalb der GPUI-App, die es einbettet |
| [Web](./web.md) | HTML und CSS; die Schriften des Browsers | moderne Browser, Desktop und Smartphone | `nsh run --target web` | eine statische Website |

- **[GPUI](./gpui.md)** zeichnet Apps mit [GPUI](https://gpui-kit.com), dem Framework des Schwesterprojekts GPUI Kit, gleichermaßen auf macOS, Windows und Linux. Es ist das Backend für das Einbetten in GPUI- und GPUI-Kit-Apps, die ihr `AppView` in ihren eigenen Elementbaum setzen. Eigenständige Desktop-Apps laufen und werden mit dem jeweiligen Backend des Betriebssystems paketiert (AppKit, Win32, GTK 4).
- **[Web](./web.md)** rendert Apps als HTML in einer Browserseite: `nsh package --target web` veröffentlicht eine statische Website für jeden Webserver oder CDN, wobei Engine und Crate einer Rust-App nach WebAssembly kompiliert werden. Eine eigene Seite bettet eine App mit `createPlayer` oder einem iframe ein. Es betreibt auch die Live-Demos und den [Playground](/playground) auf dieser Website.
- **Mac Catalyst** führt das iOS-Backend zu Entwicklungszwecken in einem iPhone-großen Fenster (390×844) auf einem Mac aus. Wähle es mit `--target catalyst` aus, um zu sehen, wie eine App auf einem Smartphone aussieht.

<a id="develop-and-package"></a>

## Entwickeln und paketieren

`nsh run` wählt die eigene Plattform des Rechners, wenn du kein `--target` angibst: AppKit unter macOS, das GTK-Fenster unter Linux und das Win32-Fenster unter Windows. Smartphones erreicht man von einem Computer aus: iOS von einem Mac mit Xcode, Android von macOS, Linux oder Windows mit dem Android SDK ([Installation](./installation.md#what-works-where)).

Eine Rust-App (ihr `nsh.json` nennt die `"root"`-Komponente) wird aus ihrem Verzeichnis ausgeführt und paketiert: `nsh` baut den eigenen Runner der App für das Ziel, mit deinem Crate und ohne QuickJS. Eine TSX-App nennt ihren Einstiegspunkt:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

Jedes Desktop-Betriebssystem paketiert Apps mit seinem eigenen Backend, gebaut für den Rechner, auf dem es läuft: Eine Mac-App paketierst du auf einem Mac, eine Windows-App unter Windows und eine Linux-App unter Linux. [Paketierung](./packaging.md) behandelt Ausgabe, Signierung und Icons für jedes Ziel.

<a id="embed-in-a-native-app"></a>

## In eine native App einbetten

| Plattform | Host-View | Führt aus | Ausgeliefert als | Host-Sprache |
|---|---|---|---|---|
| macOS | `AppView` (ein `NSView`) | ein Rust-Root, TSX-Bundles | das `nsh-platform-macos`-Crate | Rust |
| Windows | `AppView` (ein Kindfenster) | ein Rust-Root, TSX-Bundles | das `nsh-platform-windows`-Crate | Rust |
| Linux | `AppView` (ein GTK-Widget) | ein Rust-Root, TSX-Bundles | das `nsh-platform-linux`-Crate | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (eine GPUI-View) | ein Rust-Root, TSX-Bundles, signierte Pakete | das `nsh-platform-gpui`-Crate | Rust |
| iOS | `AppView` (ein `UIView`) | ein Rust-Root, TSX-Bundles | das `nsh-platform-ios`-Crate | Rust |
| iOS | `NshAppView` (ein `UIView`) | TSX-Bundles, signierte Pakete | `NativeShell.xcframework` | Swift |
| Android | `NshView` (ein `FrameLayout`) | TSX-Bundles, signierte Pakete | `nsh.aar` | Java oder Kotlin |
| Web | `createPlayer` (ein Seitenelement) oder ein iframe | TSX-Bundles; eine Rust-App als ihre veröffentlichte Website | die Laufzeitdateien aus `nsh package --target web` | JavaScript oder HTML |

Ein Rust-Host bindet ein Rust-Root (`Root::of::<App>()`) als `AppSource::Rust` oder `App::Rust` ein und gibt seinen Engines die UI-Sets der App mit `set_ui_sets`, sodass TSX, das er lädt, die eigenen Komponenten und Module der App importiert. Jede View ist eine Engine, und eine App kann mehrere anzeigen. Der Host registriert auf jeder Plattform seine eigenen nativen Views, die Apps verwenden können ([Native Komponenten](./native-components.md)).

> [!NOTE]
> Rust-Hosts betten NSH mit den Plattform-Crates aus dem NSH-Repository ein. Das `AppView` von macOS, Windows und Linux lädt Bundles aus den eigenen Dateien der App (oder aus dem Quellcode), mit den Standardlimits. Das GPUI-Crate sowie die iOS- und Android-SDKs laden außerdem [signierte Pakete](./signed-packages.md) und legen Limits und Capabilities pro View fest ([Sandbox und Capabilities](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## Für jede Plattform schreiben

Der größte Teil einer App braucht keine Plattformprüfungen: Elemente, Styles, Layout und Module verhalten sich überall gleich. Wo sich Plattformen unterscheiden, gibt NSH dem Unterschied einen festen Ort ([Plattformspezifischer Code](./platform-specific.md)):

- **Die Umgebung sagt, wo die App läuft**: in Rust `os()`, `idiom()` und `is_desktop()` (`nsh_core::prelude`), in TSX `platform.os`, `platform.idiom`, `platform.desktop` und `platform.select` aus `nsh`. Das Betriebssystem ist iOS, Android, macOS, Windows, Linux oder das Web.
- **Plattformspezifische Props** stehen in TSX in `ios={{…}}`, `android={{…}}`, `web={{…}}` oder `desktop={{…}}` (`desktop`: macOS, Windows, Linux und Desktop-Browser).
- **Die Eingabe folgt der Plattform.** Smartphones erhalten Touch-Eingaben und die Software-Tastatur, Desktops Maus, Trackpad und Tastatur.

Die Komponenten einer App werden mit den Primitiven von NSH gezeichnet, sodass sie auf Desktops ebenso laufen wie auf Smartphones und auf beiden gleich aussehen. Ein Desktop-Layout wird aus den Primitiven aufgebaut (`view`, `text`, `scroll`, `virtual_list`, …; in TSX `View`, `Text`, `Scroll`, `List`, …) und einer Prüfung auf den Desktop, wie es beim Desktop-Layout der Galerie der Fall ist:

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

Jedes Backend listet auf, was es auf eigene Weise umsetzt: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences).

<a id="see-also"></a>

## Siehe auch

- [Erste Schritte](./getting-started.md): eine erste App, auf jeder Plattform ausgeführt.
- [Mit Rust entwickeln](./rust.md): in Rust geschriebene Apps sowie Rust mit TSX.
- [Installation](./installation.md): die Tools, die jede Plattform benötigt.
- [Architektur](./architecture.md): was geteilt wird und was jedes Backend übernimmt.
