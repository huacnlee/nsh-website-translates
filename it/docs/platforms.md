---
title: "Panoramica delle piattaforme"
description: "Dove viene eseguito NSH: iOS, Android, macOS, Windows, Linux, GPUI e il web, ciascuno con il proprio backend; come eseguire, creare il pacchetto e incorporare un'app Rust o TSX su ciascuna piattaforma e di cosa ha bisogno ciascuna."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---

# Panoramica delle piattaforme

NSH funziona su telefoni, desktop e web: iOS, Android, macOS, Windows, Linux, GPUI e pagine web. Ognuna ha un proprio backend che disegna con la UI nativa della piattaforma, quindi un'app è fatta di view UIKit su un iPhone, view AppKit su un Mac, widget GTK 4 su Linux, elementi GPUI in un'app GPUI e HTML in un browser, con il testo, l'input, l'accessibilità e la modalità scura della piattaforma. Tutto ciò che sta sopra il backend è condiviso: il grafo reattivo, il renderer, il layout Taffy, i componenti e i moduli nativi sono lo stesso codice Rust ovunque, quindi un'app gira su tutte. Un'app scritta in Rust è quel codice più il tuo crate, senza VM JavaScript; un'app TSX esegue i suoi moduli su QuickJS sopra di esso ([Sviluppare con Rust](./rust.md)).

Su ogni piattaforma un'app si usa in due modi: pacchettizzata come app installabile di quella piattaforma (`nsh package`), oppure incorporata in un'app nativa tua, sia che l'host colleghi una root Rust sia che carichi TSX a runtime. La sviluppi con `nsh run` (le modifiche a Rust ricompilano e riavviano l'app, le modifiche a TSX sono aggiornamenti a caldo).

<a id="at-a-glance"></a>

## In sintesi

| Piattaforma | Backend; testo | Funziona su | Sviluppo | Pacchetto |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit; CoreText | iOS 15.0+, dispositivi e simulatore | `nsh run --target ios` | `.app` (simulatore), `.ipa` firmato |
| [Android](./android.md) | Android views; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` e `x86_64` | `nsh run --target android` | `.apk` firmato |
| [macOS](./macos.md) | AppKit e Core Animation; CoreText | macOS 14+ | `nsh run --target macos` | `.app` con firma ad hoc |
| [Windows](./windows.md) | finestre Win32 disegnate con Direct2D; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (predefinito su Windows) | una directory e un `.zip` |
| [Linux](./linux.md) | widget GTK 4; Pango | GTK 4.14+ | `nsh run` (predefinito su Linux) | una directory e un `.tar.gz` |
| [GPUI](./gpui.md) | GPUI; il sistema di testo di GPUI | macOS, Windows, Linux (Vulkan) | nella tua app GPUI; TSX anche con `nsh run --target gpui` | dentro l'app GPUI che lo incorpora |
| [Web](./web.md) | HTML e CSS; i font del browser | browser moderni, desktop e telefono | `nsh run --target web` | un sito statico |

- **[GPUI](./gpui.md)** disegna le app con [GPUI](https://gpui-kit.com), il framework del progetto gemello GPUI Kit, su macOS, Windows e Linux allo stesso modo: è il backend per l'incorporamento in app GPUI e GPUI Kit, che inseriscono il proprio `AppView` nel loro albero di elementi. Le app desktop standalone vengono eseguite e pacchettizzate con il backend di ciascun sistema operativo (AppKit, Win32, GTK 4).
- **[Web](./web.md)** renderizza le app come HTML in una pagina del browser: `nsh package --target web` pubblica un sito statico per qualsiasi web server o CDN, con il motore e il crate di un'app Rust compilati in WebAssembly, e una pagina tua incorpora un'app con `createPlayer` o un iframe. Alimenta anche le demo dal vivo e il [playground](/playground) di questo sito.
- **Mac Catalyst** esegue il backend iOS in una finestra delle dimensioni di un iPhone (390×844) su un Mac, per lo sviluppo. Selezionalo con `--target catalyst` per vedere come appare un'app su un telefono.

<a id="develop-and-package"></a>

## Sviluppare e pacchettizzare

`nsh run` sceglie la piattaforma della macchina stessa quando non indichi `--target`: AppKit su macOS, la finestra GTK su Linux e la finestra Win32 su Windows. I telefoni si raggiungono da un computer: iOS da un Mac con Xcode, Android da macOS, Linux o Windows con l'Android SDK ([Installazione](./installation.md#what-works-where)).

Un'app Rust (il suo `nsh.json` indica il componente `"root"`) si esegue e si pacchettizza dalla propria directory: `nsh` compila il runner dell'app per il target, con il tuo crate e senza QuickJS. Un'app TSX indica il proprio entry:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

Ogni sistema operativo desktop pacchettizza le app con il proprio backend, compilato per la macchina su cui gira: pacchettizza un'app Mac su un Mac, un'app Windows su Windows e un'app Linux su Linux. [Pacchettizzazione](./packaging.md) descrive l'output, la firma e le icone di ogni target.

<a id="embed-in-a-native-app"></a>

## Incorporare in un'app nativa

| Piattaforma | Vista host | Esegue | Distribuito come | Linguaggio host |
|---|---|---|---|---|
| macOS | `AppView` (un `NSView`) | una root Rust, bundle TSX | il crate `nsh-platform-macos` | Rust |
| Windows | `AppView` (una finestra figlia) | una root Rust, bundle TSX | il crate `nsh-platform-windows` | Rust |
| Linux | `AppView` (un widget GTK) | una root Rust, bundle TSX | il crate `nsh-platform-linux` | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (una view GPUI) | una root Rust, bundle TSX, pacchetti firmati | il crate `nsh-platform-gpui` | Rust |
| iOS | `AppView` (un `UIView`) | una root Rust, bundle TSX | il crate `nsh-platform-ios` | Rust |
| iOS | `NshAppView` (un `UIView`) | bundle TSX, pacchetti firmati | `NativeShell.xcframework` | Swift |
| Android | `NshView` (un `FrameLayout`) | bundle TSX, pacchetti firmati | `nsh.aar` | Java o Kotlin |
| Web | `createPlayer` (un elemento di pagina) o un iframe | bundle TSX; un'app Rust come sito pubblicato | i file di runtime da `nsh package --target web` | JavaScript o HTML |

Un host Rust monta una root Rust (`Root::of::<App>()`) come `AppSource::Rust` o `App::Rust`, e fornisce ai propri motori i set di UI dell'app con `set_ui_sets`, così il TSX che carica importa i componenti e i moduli propri dell'app. Ogni view è un motore, e un'app può mostrarne diversi. L'host registra le proprie view native perché le app le usino su ogni piattaforma ([Componenti nativi](./native-components.md)).

> [!NOTE]
> Gli host Rust incorporano NSH con i crate di piattaforma del repository NSH; il `AppView` di macOS, Windows e Linux carica i bundle dai file dell'app stessa (o dal codice sorgente), con i limiti predefiniti. Il crate GPUI e gli SDK iOS e Android caricano anche [pacchetti firmati](./signed-packages.md) e impostano limiti e capability per ogni view ([Sandbox e capability](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## Scrivere per ogni piattaforma

La maggior parte di un'app non richiede controlli sulla piattaforma: elementi, stili, layout e moduli si comportano allo stesso modo ovunque. Dove le piattaforme differiscono, NSH dà alla differenza un posto unico ([Codice specifico per piattaforma](./platform-specific.md)):

- **L'ambiente dice dove gira l'app**: in Rust `os()`, `idiom()` e `is_desktop()` (`nsh_core::prelude`), in TSX `platform.os`, `platform.idiom`, `platform.desktop` e `platform.select` da `nsh`. Il sistema operativo è iOS, Android, macOS, Windows, Linux o il web.
- **Le prop specifiche di una piattaforma** vanno in `ios={{…}}`, `android={{…}}`, `web={{…}}` o `desktop={{…}}` in TSX (`desktop`: macOS, Windows, Linux e browser desktop).
- **L'input segue la piattaforma.** I telefoni hanno il tocco e la tastiera software; i desktop hanno il mouse, il trackpad e la tastiera.

I componenti di un'app sono disegnati con le primitive di NSH, quindi funzionano sia sui desktop sia sui telefoni, con lo stesso aspetto su entrambi. Un layout desktop si costruisce con le primitive (`view`, `text`, `scroll`, `virtual_list`, …; `View`, `Text`, `Scroll`, `List`, … in TSX) e un controllo per il desktop, come fa il layout desktop della galleria:

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

Ogni backend elenca ciò che fa a modo proprio: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences).

<a id="see-also"></a>

## Vedi anche

- [Per iniziare](./getting-started.md): una prima app, eseguita su ogni piattaforma.
- [Sviluppare con Rust](./rust.md): app scritte in Rust, e Rust con TSX.
- [Installazione](./installation.md): gli strumenti necessari a ogni piattaforma.
- [Architettura](./architecture.md): cosa è condiviso e cosa fa ogni backend.
