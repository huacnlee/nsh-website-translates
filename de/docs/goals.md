---
title: "Ziele und Designprinzipien"
description: "Die Ziele von Native Shell: native Views und Interaktion, app-eigenes Design, gemeinsame Komponenten sowie Rust und TSX auf einer Engine."
order: 1.5
group: start
source_hash: bad49295450504d6
---

Native Shell bietet native Views und Interaktion auf iOS, Android, macOS, Windows, Linux und im Web. Die App bestimmt ihr visuelles Design selbst. Ein Komponentenmodell deckt vollständige Apps, eingebettete Features und dynamisch ausgelieferte UI ab.

<a id="native-foundations-app-owned-design"></a>

## Native Grundlagen, App-eigenes Design

NSH baut auf den Views, der Text- und der Eingabeinfrastruktur der jeweiligen Plattform auf und passt die Interaktion an das Gerät an: Tastaturnavigation, Zeiger- und Touch-Eingabe, Texteingabe, Scrollen und Barrierefreiheit ([Einführung](./index.md#what-native-means)).

Die App definiert Farben, Typografie, Abstände, Formen, Zustandsrückmeldungen und Animationen. Ein Einstellungsbildschirm kann auf iOS und Android dem Branding der App folgen, während Eingabe und Navigation den Konventionen des jeweiligen Geräts folgen. Designer verfeinern diese visuelle Sprache über Styles und Komponententeile.

Eine native View ist die Rendering-Grundlage. Ein systemgestaltetes Steuerelement ist eine bestimmte visuelle und verhaltensbezogene Entscheidung. Die gängigen Steuerelemente von NSH stellen gemeinsames Verhalten und anpassbare Teile bereit, sodass Anwendungen ihre eigenen Designsysteme aufbauen können.

<a id="native-integration-in-practice"></a>

## Native Integration in der Praxis

Zu den nativen Grundlagen gehören Rendering, framebasierte Animation, Eingabe und Semantik für Barrierefreiheit. Auf iOS und Android verwendet [Input](../elements/input.md) plattformeigene Textfelder: Die Plattform übernimmt Bearbeitung, Auswahlmenüs, Eingabemethoden und unterstützte Autofill-Dienste. Die App beschreibt das Feld über `autoComplete`, zum Beispiel mit `current-password` oder `postal-code`, und das System liefert die verfügbaren Vorschläge entsprechend seinen Einstellungen und Diensten ([Formulare und Tastatur](./forms-and-keyboard.md)). Das Gestalten des Felds ist mit dieser Systemintegration vereinbar.

Das ist ein architektonischer Unterschied zu einem Textfeld, das vollständig in einem eigenen Renderer gezeichnet wird: Ein eigener Renderer muss seine Integration in Systemdienste für Texteingabe und Barrierefreiheit selbst bereitstellen, während NSH plattformeigene Textsteuerelemente verwendet, wo das Backend sie bereitstellt. Die Dokumentation jedes Backends beschreibt dessen Integration, einschließlich des eigenen Editors von NSH unter Windows und des GPUI-Embedding-Backends ([Plattformen](./platforms.md)).

Die Trennung von Komponentenverhalten und visuellem Design in [GPUI Kit](https://gpui-kit.com) prägt die Schichten von NSH. NSH baut auf diesem Prinzip mit der View- und Eingabeinfrastruktur der Plattform auf. Native Integration und App-eigenes Design wirken in diesem Modell durchgehend zusammen.

<a id="one-component-model-across-platforms"></a>

## Ein Komponentenmodell für alle Plattformen

Ein Switch bedeutet auf einem Smartphone, einem Desktop und im Web dasselbe. [`nsh/base`](../modules/nsh-base.md) stellt Zustand, Eingabeverarbeitung, Fokus und Barrierefreiheit bereit; die App gestaltet Track, Thumb und Zustände des [Switch](../elements/switch.md). Buttons, Checkboxen und Radios folgen demselben Prinzip.

| Verantwortung | Zuständig | Beispiel |
|---|---|---|
| Rendering, Layout, Reaktivität und Umgebung | `nsh-core`, `nsh` und Runtime-Module | Views, Text, Signals, Styles |
| Gemeinsames Verhalten und barrierefreie Struktur | `nsh-base`, in TSX als `nsh/base` importiert | `Button`, `Checkbox`, `Switch`, `Tabs` |
| Visuelles Design und gestaltete Komponenten | Die App oder eine Community-Bibliothek | Gebrandete Steuerelemente, Cards, Formularzeilen |
| Plattformspezifische Fähigkeiten | `nsh/mobile`, `nsh/desktop` | Mobile Navigationsleiste, Fenstersteuerung auf dem Desktop |

Gängige Steuerelemente haben ein plattformübergreifendes Zuhause in `nsh/base`. Plattformmodule sind nach Zweck und Plattformsemantik abgegrenzt. [`TabBar`](../modules/nsh-mobile.md#tabbar) dient der mobilen Navigation auf oberster Ebene; [`Tabs`](../elements/tabs.md) schaltet plattformübergreifend zwischen Tab-Inhalten um. Ihre Rollen sind verschieden. `nsh/mobile` nimmt Fähigkeiten mit mobilspezifischer Interaktionssemantik auf; Unterschiede in Aussehen, Größe, Tönung oder Animation eines gängigen Steuerelements gehören in dessen gemeinsame Komponente und in das App-Styling. Eine Benachrichtigung oder ein Toast mit gemeinsamer Rolle sollte zunächst um einen plattformübergreifenden Vertrag herum entworfen werden, wobei die Darstellung intern angepasst wird.

Eine gemeinsame Komponente kann ihre Interaktion intern anpassen: Ein Menü öffnet sich auf dem Desktop als Popup und auf dem Smartphone als Sheet, während die App eine einzige API verwendet und das Aussehen selbst festlegt. Systemverwaltete Darstellungen wie Navigationsleisten und Alerts folgen den dokumentierten Darstellungsregeln der Plattform. Apps können ihre eigenen nativen Komponenten und Dienste über die [Embedding-Schnittstellen](./native-components.md) bereitstellen.

<a id="the-unstyled-foundation-and-the-component-library-layer"></a>

## Die ungestaltete Grundlage und die Schicht der Komponentenbibliothek

NSH besitzt die Primitives und die ungestaltete Grundlage (`nsh-core` und `nsh-base`). Anwendungen und Drittanbieter-Bibliotheken besitzen die Schicht der gestalteten Komponentenbibliothek – die Rolle, die `gpui-component` in [GPUI Kit](https://gpui-kit.com) spielt. Diese Aufteilung gibt jedem Produkt die Kontrolle über seine visuelle Sprache und ermöglicht zugleich, die schwierigen Teile der Komponentenimplementierung wiederzuverwenden.

Die Erfahrung hinter dieser Entscheidung stammt aus [GPUI Kit](https://gpui-kit.com). Die gestalteten Komponenten entstanden aus der Arbeit an Longbridge Pro. Als Anwendungen zunehmend unterschiedliche Designs benötigten, führte der Anpassungsdruck dazu, dass Nutzer Komponenten forkten. Die gemeinsame Grundlage in `gpui-base` herauszulösen machte das Verhalten über diese Designs hinweg wiederverwendbar. Gestaltete Komponenten bleiben nützlich als Designreferenz und für Anwendungen, deren Anforderungen zu ihren Anpassungsmöglichkeiten passen; die Grundlage gibt anderen Anwendungen direkte Kontrolle über die Darstellung.

NSH wendet diese Erkenntnis von Anfang an an. `nsh/base` besitzt komplexes Verhalten, Interaktion, reaktiven Zustand, Fokus, Barrierefreiheit und adaptive Darstellung, mit Tests auf der Ebene, die das jeweilige Verhalten besitzt. Das umfasst auch größere Strukturen wie [Dock](../elements/dock.md). Anwendungen bauen auf dieser Grundlage vielfältige Designs über Styles, Zustände, Slots und Parts. Beiträge zu Komponenten folgen derselben Grenze: Visuelle Standardwerte und gebrandete Varianten gehören zu Anwendungs- oder Drittanbieter-Komponenten. Die dokumentierten systemverwalteten Darstellungen und die Leseeinstellungen von `TextView` behalten ihre spezifischen Verträge ([Architektur](./architecture.md#three-layers)).

<a id="what-the-gallery-demonstrates"></a>

### Was die Gallery zeigt

Die Website-Demos und die Gallery sind gestaltete Beispielanwendungen. Ihre Verläufe, Schatten, abgerundeten Ecken, Übergänge und Bewegungen nutzen die Anpassungsmöglichkeiten von NSH aus und liefern Quellcode-Beispiele. Diese Entscheidungen gehören zu den Demos und zur Gallery; die wiederverwendbaren Basiskomponenten stellen das darunterliegende Verhalten und die Parts bereit. Anwendungen können die Beispiele übernehmen oder eine andere visuelle Sprache entwickeln.

Eine eigenständig verteilte gestaltete Bibliothek gehörte zur oben beschriebenen Anwendungs-/Community-Schicht. Das Styling der Gallery veranschaulicht eine Designrichtung; ob sie zu einem bestimmten Produkt passt, ist eine Designentscheidung dieses Produkts.

<a id="rust-and-tsx-on-one-engine"></a>

## Rust und TSX auf einer Engine

Rust-Apps, TSX-Bildschirme und gemischte Projekte teilen sich Primitives, Basiskomponenten, Signals und Layout. Rust liefert kompilierte Anwendungslogik und wiederverwendbare native Komponenten. TSX ermöglicht schnelle Iteration und zur Laufzeit ausgelieferte Module ([Entwicklung mit Rust](./rust.md)).

Die Engine aktualisiert Bindings, die von geänderten Signals abhängen, und bündelt View-Operationen. Textlayout, native Animationen und Eingabe gehören zur Engine und ihren Plattform-Backends ([Architektur](./architecture.md)). Die Performance wird anhand reproduzierbarer Anwendungs-Workloads bewertet ([Performance](./performance.md)).

<a id="embedding-dynamic-delivery-and-ai"></a>

## Embedding, dynamische Auslieferung und KI

Eine bestehende native App platziert eine NSH-View dort, wo ein Feature hingehört, und stellt ihre eigenen nativen Komponenten und Host-Dienste bereit. Eigenständige Apps verwenden dieselbe Runtime und dasselbe Komponentenmodell ([Plattformen](./platforms.md)).

Dynamisch ausgelieferte TSX-Module besitzen ihren eigenen Zustand, ihre Logik und ihr Layout. Signierte Pakete legen fest, welchen Herausgebern der Host vertraut; Sandbox-Grenzen und Capabilities definieren, was Module tun dürfen. Der Host bestimmt sowohl Vertrauen als auch Berechtigungen ([Signierte Pakete](./signed-packages.md), [Sandbox und Capabilities](./sandbox-and-capabilities.md)).

KI-generierte UI folgt diesem Vertrag: TSX gegen deklarierte APIs generieren, prüfen und testen, das Modul bauen und signieren, dann unter der Richtlinie des Hosts verifizieren und ausführen. Generierte Deklarationen, modelllesbare Dokumentation und CLI-Tests machen den Workflow nachvollziehbar und wiederholbar ([Testen und Tracing](./testing-and-trace.md)).

<a id="how-these-goals-guide-additions"></a>

## Wie diese Ziele Erweiterungen leiten

1. Das Nutzerverhalten klären und feststellen, ob es plattformübergreifend gilt.
2. Gemeinsames Verhalten im vorhandenen Primitive oder in der Basiskomponente unterbringen und Zustand sowie Parts für die Anpassung durch die App bereitstellen.
3. Fähigkeiten mit plattformspezifischer Semantik in ihr Plattformmodul legen und dokumentieren, wo sie anwendbar sind und wie sie sich mit gemeinsamer UI kombinieren lassen.
4. Gestaltete Komponenten in der App oder in der Community-Bibliothek bauen.
5. Verhalten, Barrierefreiheit, Layout und Eingabe auf den betroffenen Plattformen verifizieren und den öffentlichen Vertrag in beiden Sprachen dokumentieren.

Diese Prinzipien halten das visuelle Design flexibel, die gemeinsamen Komponenten-APIs kohärent und die Plattformintegration explizit, während NSH wächst.
