---
title: "Ansätze im Vergleich"
description: "Wie sich Native Shell im Vergleich zu React Native, Flutter, Qt, GPUI und Slint, zu Electron und Tauri sowie zu Web Views und Server-driven UI für UI behält, die nach dem Release ausgeliefert wird."
order: 2
group: start
source_hash: 80f11e255cf3463f
---


# Ansätze im Vergleich

NSH ist ein Framework für vollständige Apps auf iOS, Android, macOS, Windows, Linux und im Web sowie eine Runtime für UI, die nach dem Release an Apps ausgeliefert wird. Diese Seite vergleicht es zunächst mit den plattformübergreifenden Frameworks, in denen Apps geschrieben werden, und danach mit den Wegen, auf denen Apps UI übernehmen, die sie nicht selbst mitgeliefert haben. Grün bedeutet, dass die Fähigkeit verfügbar ist, gelb, dass sie mehr Eigenarbeit in der App oder ein separates Projekt erfordert, und rot, dass sie nicht angeboten wird. Die Markierungen beschreiben die Verfügbarkeit, nicht die Performance. Die Versionen sind die jeweils dokumentierten Mindestversionen der Frameworks zum Zeitpunkt des Schreibens; prüfen Sie sie für das Release, das Sie verwenden.

Legende: <span class="status status--yes" role="img" aria-label="Ja"></span> Ja · <span class="status status--partial" role="img" aria-label="Teilweise"></span> Teilweise · <span class="status status--no" role="img" aria-label="Nein"></span> Nein.

<a id="cross-platform-frameworks"></a>

## Plattformübergreifende Frameworks

| Fähigkeit | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| Gezeichnet von | Plattform-UI | Plattform-Views | Eigene Engine | Szenengraph | Eigene, GPU | Eigene, GPU | Eigener Renderer |
| UI-Modell | Retained | Retained | Retained | Retained | Immediate | Immediate + Retained | Reaktiv, retained |
| Sprache | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="Ja"></span> 15+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 15+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 17+ | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="Ja"></span> 9+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 7+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 7+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 9+ | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="Ja"></span> 14+ | <span class="status status--partial" role="img" aria-label="Teilweise"></span> Separat | <span class="status status--yes" role="img" aria-label="Ja"></span> 12+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 13+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 12+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 12+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="Ja"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="Teilweise"></span> Separat | <span class="status status--yes" role="img" aria-label="Ja"></span> 10+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 10+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 10+ | <span class="status status--yes" role="img" aria-label="Ja"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="Ja"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="Ja"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="Ja"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Ja"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Ja"></span> |
| Web | <span class="status status--yes" role="img" aria-label="Ja"></span> HTML | <span class="status status--partial" role="img" aria-label="Teilweise"></span> Bibliothek | <span class="status status--yes" role="img" aria-label="Ja"></span> Canvas | <span class="status status--yes" role="img" aria-label="Ja"></span> Canvas | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> Canvas |
| Systemtext | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> |
| Geräteabhängige UX | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> |
| Keine JS-Runtime | <span class="status status--yes" role="img" aria-label="Ja"></span> Rust-Apps | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> C++ | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--yes" role="img" aria-label="Ja"></span> |
| Signierte Auslieferung | <span class="status status--yes" role="img" aria-label="Ja"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> OTA | <span class="status status--no" role="img" aria-label="Nein"></span> | <span class="status status--partial" role="img" aria-label="Teilweise"></span> QML | <span class="status status--partial" role="img" aria-label="Teilweise"></span> Shell | <span class="status status--partial" role="img" aria-label="Teilweise"></span> Shell | <span class="status status--no" role="img" aria-label="Nein"></span> |
| Lizenz | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, kommerziell | Apache-2.0 | Apache-2.0 | GPL, kommerziell |

Der Immediate Mode baut die UI-Beschreibung in jedem Frame neu auf; der Retained Mode behält sie und aktualisiert nur, was sich geändert hat. GPUI Fast kombiniert beides auf Basis von GPUI und läuft überall dort, wo GPUI läuft. „Shell“ ist [GPUI Shell](https://gpui-kit.com/shell).

NSH ist das einzige Framework hier, das all dies vereint: die jeweils eigene UI und Texteingabe jeder Plattform, Smartphones, Desktops und das Web aus einer App – das Web als HTML –, Rust-Apps ohne JavaScript-Runtime sowie signierte, sandboxed UI, die nach dem Release ausgeliefert wird.

<a id="what-the-rows-mean"></a>

### Was die Zeilen bedeuten

- **Gezeichnet von, UI-Modell.** NSH bindet die eigenen Views jeder Plattform ein und behält sie bei (Retained Mode): Eine Änderung aktualisiert nur die Views, die sie betrifft. React Native bindet ebenfalls Plattform-Views ein, auf iOS und Android. Flutter, Qt Quick, GPUI und Slint zeichnen mit eigenen Renderern; GPUI baut den Elementbaum in jedem Frame neu auf (Immediate Mode), und [GPUI Fast](https://github.com/longbridge/gpui-fast) verwendet wieder, was sich nicht geändert hat.
- **Plattformen.** Die Mindestversionen von NSH sind eigene ([Platforms](./platforms.md)). Die übrigen stammen aus [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24; macOS und Windows über die separaten Projekte react-native-macos und react-native-windows, das Web über die Bibliothek react-native-web), [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), den [Anforderungen von Zed](https://zed.dev/docs/installation) für GPUI und den [Plattformanleitungen von Slint](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS aus Rust). „Canvas“ bedeutet, dass das Framework in ein Canvas auf der Seite zeichnet; die Web-Apps von NSH sind mit CSS gestaltete HTML-Elemente, die der Browser scrollt, markiert und bearbeitet ([Web](./web.md)).
- **Systemtext.** Die Textfelder von NSH sind die Editoren der Plattform – `UITextView`, `EditText`, `NSTextView`, `TextView` von GTK, die des Browsers – mit den Eingabemethoden, Auswahlgriffen und Bearbeitungsmenüs des Systems; unter Windows arbeitet der eigene Editor von NSH mit DirectWrite und den Eingabemethoden des Systems (IMM32). React Native nutzt ebenfalls die Texteingaben der Plattform. Die selbst zeichnenden Frameworks implementieren die Textbearbeitung selbst und binden sie an die Eingabemethoden des Systems an.
- **Geräteabhängige UX.** Die Basiskomponenten von NSH richten sich nach dem Gerät: Dasselbe `Menu` ist mit Zeigegerät ein Popup an seinem Auslöser und auf dem Smartphone ein Sheet vom unteren Rand, und ein `ContextMenu` öffnet sich per Rechtsklick oder bei gehaltenem Finger. Bei den anderen ist die Anpassung der Interaktion an das Gerät meist Eigenarbeit der App.
- **Keine JS-Runtime.** Die Runner einer Rust-App binden auf keiner Plattform eine JavaScript-Engine ein; TSX ist der zweite Weg, auf derselben Engine. QML von Qt Quick läuft auf der JavaScript-Engine von Qt; Qt Widgets in C++ nicht.
- **Signierte Auslieferung.** NSH prüft signierte `.nshpkg`-Pakete anhand der Schlüssel, denen es vertraut, und einer Sperrliste und führt jedes in einer VM mit den Limits und Capabilities aus, die der Host gewährt ([Signed packages](./signed-packages.md), [Sandbox and capabilities](./sandbox-and-capabilities.md)). Die Over-the-Air-Updates von React Native liefern vertrauenswürdigen App-Code aus; Qt kann QML-Dateien laden; GPUI-Apps beziehen JavaScript-Module über [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### Was NSH auszeichnet

- **Auf jeder Plattform nativ, in beiderlei Sinn.** Jedes Backend baut auf den eigenen Views, dem Text und den Eingabemethoden seiner Plattform auf – UIKit, Android-Views, AppKit, Win32 mit Direct2D, GTK 4, HTML – und die Interaktion der jeweiligen Plattform kommt mit. Textauswahl, Eingabemethoden und Barrierefreiheit sind die des Systems, und was eine neue OS-Version daran verbessert, erreicht die App ([Introduction](./index.md#what-native-means)).
- **Smartphones, Desktops und das Web aus einer App.** Sechs Plattformen sind Backends eines Frameworks, mit Layouts, die sich anpassen, und Eingaben, die dem Gerät folgen; im Web ist die App HTML und wird als statische Site veröffentlicht.
- **Rust zuerst, ohne JavaScript-Runtime.** Eine ganze App kann von Anfang bis Ende in Rust geschrieben sein, kompiliert zu nativem Code mit den Typen, Threads und Crates von Rust. TSX ist der zweite Weg, auf derselben Engine, für schnell geschriebene Screens ([Building with Rust](./rust.md)).
- **Retained Views für alltägliche Apps.** Chats, Formulare, Listen und Dokumente sind im Ruhezustand nahezu im Leerlauf, weil eine Änderung nur die Views sendet, die sie betrifft ([Introduction](./index.md#retained-views)).
- **UI nach dem Release ausgeliefert, signiert und sandboxed.** Mit NSH gebaute Apps – und native Apps, die mit den eigenen Tools der jeweiligen Plattform geschrieben wurden – übernehmen TSX-Module zur Laufzeit, geschrieben von einem Team oder von KI generiert ([Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui)).
- **Eine Toolchain, für Menschen und Agenten.** Eine ausführbare `nsh`-Datei erstellt, startet, testet auf echten Plattformen, paketiert und signiert Apps für jedes Ziel.

### React Native

React Native kommt in der Zielsetzung am nächsten: Beide verringern doppelten Client-Aufwand und verwenden die Views der Plattform. Der Schwerpunkt von React Native liegt auf JavaScript oder TypeScript mit React und dessen Paket-Ökosystem, auf iOS und Android, mit Desktop-Unterstützung in separaten Projekten. Der Schwerpunkt von NSH liegt auf Rust: Runtime, Renderer und Module sind Rust, Rust ist eine eigenständige App-Sprache, und TSX ist einer von zwei Wegen; seine sechs Plattformen, einschließlich der Desktops und des Webs, sind Backends desselben Frameworks.

### Flutter

Flutter zeichnet jeden Pixel mit einer eigenen Engine, sodass eine App auf jeder Plattform gleich aussieht. NSH geht den anderen Weg: die Views, den Text und die Texteingabe jeder Plattform, im Web HTML-Elemente samt dem eigenen Scrollen, Markieren und Eingeben des Browsers. Textbearbeitung, Eingabemethoden und Auswahl sind die der Plattform, statt pro Plattform neu implementiert zu werden.
### Qt

Qt ist ein ausgereiftes Toolkit mit zwei UI-Technologien, Qt Widgets und Qt Quick, sowie langjährigen Tools und Plattformunterstützung. NSH unterscheidet sich in seiner Grundlage und seinem Modell: Rust als Kernsprache mit einem TSX-Pfad, eine Toolchain für automatisierte (und KI-gestützte) Entwicklung, das Web wird als HTML gerendert, und die Interaktion auf Mobilgeräten, Desktops und im Web wird innerhalb eines einzigen Komponentenmodells angepasst.

### GPUI and GPUI Fast

[GPUI](https://gpui-kit.com) ist ein Rust-UI-Framework, das mit der GPU zeichnet und für anspruchsvolle Desktop-Apps gebaut wurde; [GPUI Fast](https://github.com/longbridge/gpui-fast) ist der Fork von Longbridge mit Retained Rendering – er verwendet unveränderte Views, Layouts und Textmessungen wieder – sowie mit Scroll-Layern und nativer Fensterkomposition. NSH baut stattdessen auf den Views der jeweiligen Plattform auf. Texteingabe, Auswahl, Eingabemethoden und Systeminteraktion sind daher die der Plattform selbst, und NSH deckt auch Smartphones und das Web ab. Das GPUI-Backend von NSH bettet NSH-Apps in GPUI- und GPUI-Kit-Apps ein ([GPUI](./gpui.md)).

Die beiden eignen sich für unterschiedliche Lasten. Im [NSH-Performance-Benchmark](https://github.com/longbridge/nsh-perf-bench) (Linux, eine Kurstabelle mit 500 Zeilen, NSH auf seinem GTK-4-Backend) kosten alltägliche Lasten gleich viel: Bei 1.000 Kursen pro Sekunde belegt NSH Rust 18 % eines Kerns und GPUI Fast 20 %. Bei anhaltenden, dichten Updates liegt GPUI Fast vorn: Bei 20.000 Kursen pro Sekunde belegt es 25 % eines Kerns, NSH dagegen 73–78 %, und die Frame-für-Frame-Animation von 1.000 Boxen kostet es etwa ein Drittel der CPU-Last von NSH.

### Slint

Slint ist ein deklaratives UI-Toolkit mit eigener Sprache und leichtgewichtigen Renderern für Desktops und Embedded-Geräte, nutzbar mit Rust, C++, JavaScript oder Python. Beide legen Wert auf native Performance; der Weg von NSH führt über die plattformeigene UI und Interaktion, HTML im Web, Rust und TSX als App-Sprachen und KI-gestützte Entwicklung für sechs Plattformen.

### Electron and Tauri

Electron bündelt Chromium, und Tauri verwendet die Web View des Systems: Beide erstellen Desktop-Apps (und mit Tauri auch mobile Apps) aus Webinhalten, mit der Text- und Eingabeverarbeitung des Browsers. NSH baut stattdessen auf den eigenen Views jeder Plattform auf und rendert HTML nur im Web selbst.

## UI delivered after release

Eine App, die UI haben möchte, die sie nicht mitgeliefert hat – von einem Modell generierte Antworten, Funktionen von Partnern oder anderen Teams, Screens, die sich ohne Release ändern –, hat eine Handvoll etablierter Optionen, sowohl auf Smartphones als auch auf Desktops. Sie unterscheiden sich darin, was die UI zeichnet, was der gelieferte Code tun darf und wie viel an der App geändert werden muss, um sie zu hosten.

| Capability | NSH | Web view | Server-driven UI | Mini-programs | OTA updates |
|---|---|---|---|---|---|
| Drawn by | Platform UI | Browser engine | The app's views | Web engine + layer | Framework renderer |
| Native look and behavior | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Own state, logic and layout | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Host's native components | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| Sandbox the host configures | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Yes"></span> Schema | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Signed, revocable packages | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| Fit for AI-generated UI | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> Web pages | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Cost to the host app | One view and a library | A browser engine per view | A renderer per component | A container SDK | The whole app in the framework |

- **Web view (H5).** Eine Seite in einer Browser-Engine: alles, was HTML ausdrücken kann, mit dem Look des Browsers und einer von Hand geschriebenen Bridge zu nativem Code.
- **Server-driven UI.** JSON, das die Komponenten und Aktionen, die die App ohnehin mitliefert, neu kombiniert: einfach zu generieren, ohne lokalen State oder Logik über das hinaus, was das Schema bietet.
- **Mini-Program-Container.** Ein plattformspezifisches Framework und eine API auf einer Web-Engine, innerhalb eines großen Container-SDK.
- **Over-the-air-Updates** (zum Beispiel React Native mit einem Code-Push-Dienst). Das ganze Framework, aber Updates sind vertrauenswürdiger App-Code, und die App muss in diesem Framework geschrieben sein.
- **NSH.** Ein TSX-Modul mit eigenem State, eigener Logik, Animation und Layout, gerendert mit der plattformeigenen UI, das die registrierten nativen Views des Hosts verwenden kann. Es kommt als signiertes Paket, das die App verifiziert, läuft in einer eigenen VM mit Limits für Speicher, Aufrufzeit und Knoten und erreicht nur die Netzwerk-Hosts, Webseiten und Systemeinstellungen, die der Host freigibt ([Sandbox and capabilities](./sandbox-and-capabilities.md)). Der Host fügt dort, wo das Modul erscheint, eine View hinzu ([Platforms](./platforms.md#embed-in-a-native-app)), und dasselbe Bundle läuft auf jeder Plattform. Das ist der Grund, warum NSH neben [GPUI Shell](./index.md#native-shell-and-gpui-shell) existiert.

## When another option fits better

- Der Screen wird von anhaltenden, dichten Updates tausender Views dominiert – ein Marktdaten-Terminal, das zehntausende Kurse pro Sekunde streamt, eine individuelle Visualisierung, die in jedem Frame neu gezeichnet wird: Das Retained-GPU-Rendering von GPUI Fast benötigt nur einen Bruchteil der CPU (siehe [GPUI and GPUI Fast](#gpui-and-gpui-fast)).
- Die App muss auf jeder Plattform pixelgenau gleich aussehen: Ein Framework, das alles selbst zeichnet, wie Flutter oder Slint, bietet das konstruktionsbedingt.
- Sie benötigen heute ein großes Ökosystem an Drittanbieter-Paketen: React Native, Flutter und Qt haben davon über Jahre hinweg viele aufgebaut.
- Die UI ist ein Dokument oder eine bestehende Webseite: Eine Web View zeigt sie so an, wie sie ist.
- Die Menge der Screens ist fest und klein, und nur Inhalt und Reihenfolge ändern sich: Server-driven UI braucht überhaupt keine Runtime.

## See also

- [Introduction](./index.md): was NSH ist und was „nativ“ darin bedeutet.
- [Architecture](./architecture.md): was innerhalb von NSH wo läuft.
- [Performance](./performance.md): die Regeln, denen NSH folgt, und wie man eine App misst.
