---
title: "Design-Leitfäden"
description: "Leitfäden zu Produkt- und Interaktionsdesign für Apps, die mit Native Shell entwickelt werden: Hierarchie, Farben und Tokens, Abstände, Dichte, Komponenten, Interaktionszustände, Overlays, Bewegung, datenintensive Ansichten, Interface-Texte und Plattformintegration."
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---


# Design-Leitfäden

Verwenden Sie diesen Leitfaden, bevor Sie Komponenten auswählen oder Layout-Code für eine mit Native Shell gebaute App schreiben. Er hält das Produktverständnis fest, das GPUI Kit in Jahren der Desktop-Arbeit gesammelt hat und das auf NSH übertragen wurde: Eine Oberfläche soll sich nativ, zurückhaltend und präzise anfühlen und ohne Rätselraten verständlich sein.

Dies ist ein normativer Leitfaden. **Muss** kennzeichnet eine Einschränkung der Korrektheit oder des Ökosystems, **sollte** ist der Standard, der einen konkreten Grund zum Abweichen braucht, und **kann** ist eine optionale Technik. Die Seiten [Elements](../elements/index.md) und [API](../modules/index.md) bleiben maßgeblich für einzelne Props und Methoden.

Die Regeln bauen auf dem Verhalten in `nsh/base` (`nsh_base` in Rust), dem Theme und seinen Tokens sowie der Interaktion auf, die die Nutzer jeder Plattform bereits kennen. NSH rendert mit der jeweiligen nativen UI jeder Plattform und überlässt das Erscheinungsbild der App: Die Komponenten von `nsh/base` liefern Verhalten, Zustand, Fokus und Barrierefreiheit, während jede Farbe, Größe, jeder Radius und jeder Abstand aus den eigenen Komponenten der App stammt. Diese Regeln leiten also das Design-System der App an. <a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a> liefert nützliche Methoden (offener Code, Komposition und verlässliche Standardwerte), bestimmt aber nicht, wie eine NSH-App aussehen soll. Wenn Einflüsse kollidieren, bewahren Sie das Verhalten der Plattform und die Interaktion, die Menschen bereits verstehen.

<a id="design-thesis"></a>

## Gestaltungsthese

Bauen Sie Oberflächen, die sich nativ, ruhig und präzise anfühlen. Lassen Sie Inhalt, Hierarchie und Interaktion die Erfahrung tragen; Dekoration soll sie unterstützen, nicht mit ihnen konkurrieren.

1. **Klarheit vor Persönlichkeit.** Machen Sie die Hauptaufgabe und die nächste Aktion klar, bevor Sie Markenausdruck hinzufügen.
2. **Komposition vor Erfindung.** Beginnen Sie mit etablierten Komponenten und setzen Sie sie zu produktspezifischen Workflows zusammen. Erstellen Sie ein neues Primitiv nur, wenn sein Verhalten wirklich neu ist.
3. **Tokens vor Werten.** Farben, Radien, Typografie und Abstände sollten ein System bilden. Vermeiden Sie isolierte Literale, die nicht auf Themes reagieren können. Siehe [Styling](./styling.md), [Tailwind](./tailwind.md) und [das Theme](./rust.md#theme).
4. **Plattform vor Web-Konvention.** Bewahren Sie Tastaturzugriff, Fensterrahmen, Menüs, dichte Datenansichten, in der Größe veränderbare Bereiche und dauerhafte Navigation auf den Desktops sowie die System-Header, die Zurück-Geste, Alerts und Touch-Ziele auf Smartphones und Tablets, wo die Aufgabe davon profitiert.
5. **Zustand muss sichtbar sein.** Hover, Pressed, Fokus, Auswahl, Disabled, Laden, Validierung und destruktive Zustände brauchen eine eindeutige und konsistente Darstellung.
6. **Geometrie erklärt Einschluss.** Radien, Einzüge und Begrenzungen sollten eine kohärente Hierarchie beschreiben, auch wo sich Flächen überlappen.
7. **Feedback spiegelt die Realität.** Laden, Tooltips und Bewegung sollen einen echten Zustand oder Übergang verdeutlichen, nicht eine sofortige Aktion mit Zeremoniell versehen.

<a id="learning-from-shadcn"></a>

## Von Shadcn lernen

Der nützlichste Beitrag von Shadcn ist nicht eine bestimmte Rahmenfarbe. Es ist eine Art, ein System zu bauen:

- die oberste Schicht der Oberfläche selbst besitzen, statt gegen eine abgeschlossene Abstraktion anzukämpfen;
- kleine, vorhersagbare Teile zu produktspezifischen Komponenten zusammensetzen;
- Standardwerte bereitstellen, die bereits eine einheitliche visuelle Sprache bilden;
- Code und Komposition für Menschen und KI gleichermaßen lesbar halten;
- Verhaltensprimitive von der gestalteten Schicht trennen.

NSH wendet diese Ideen über die Trennung zwischen den Primitiven von `nsh`, den ungestalteten Basiskomponenten von `nsh/base` und der gestalteten Schicht an, die der App gehört ([Three layers](./architecture.md#three-layers)). Anwendungen bauen ihre Komponenten auf `nsh/base` auf, in TSX oder im Rust-Crate der App; wiederverwendbares Verhalten gehört in `nsh/base`, und die visuelle Gestaltungsvorgabe bleibt darüber.

Übernehmen Sie diese Web-Annahmen nicht blind:

| Web-Gewohnheit | NSH-Standard |
| --- | --- |
| Zeigende Hand als Cursor bei jedem Button | Standard-Cursor; zeigende Hand (`cursor-pointer`) für Links |
| Seitennavigation als Hauptstruktur | Dauerhafte Fenster, Bereiche, Seitenleisten, Tabs und Menüs auf den Desktops; ein `NavStack` mit dem System-Zurück auf Smartphones |
| Browser-Fokus und -Scrolling als Rückfallebene | Explizite Fokus-Zuständigkeit und Scrolling, das dem jeweiligen Bereich gehört (`Scroll`, `List`) |
| Mobile-first, einspaltig | Eine Spalte auf Smartphones, eine in der Größe veränderbare Shell mit definierter Mindestfenstergröße auf den Desktops |
| Per Hover eingeblendete kritische Aktionen | Aktionen, die per Tastatur, Touch und Zeiger erreichbar sind und nicht vom Hover abhängen |
| Eine Reihe von Icon-Buttons nur bei Hover | Eine sichtbare Hauptaktion plus `Menu` oder `ContextMenu` für sekundäre Befehle |
| Als Link gestalteter Text für Anwendungsbefehle | Ein `Button` im Default-, Outline- oder Ghost-Stil der App; Link-Gestaltung nur für URLs, Web-Ressourcen oder E-Mail-Adressen |
| Große Touch-Dichte überall | Touch-gerechte Ziele auf Touchscreens; mittlere Dichte mit Zeiger, kompakt nur dort, wo Informationsarbeit davon profitiert |
| Ein gezeichneter Header und eine Alert-Karte auf jeder Plattform | Der System-Header und `AlertDialog` auf iOS und Android; der `header`-Slot der Seite auf den Desktops und im Web |
| CSS-Überschreibungen über Nachfahren hinweg | Die Komponenten der App, ihre Teile und die Tokens des Themes |

<a id="start-from-the-task"></a>

## Von der Aufgabe ausgehen

Bevor Sie einen Bildschirm zeichnen, halten Sie fest:

- die Hauptaufgabe des Nutzers;
- das Objekt, das angezeigt oder geändert wird;
- die Aktionen, die jederzeit unmittelbar verfügbar bleiben müssen;
- die Informationen, die für eine Entscheidung nötig sind;
- die Zustände leer, ladend, Fehler, offline, schreibgeschützt und Berechtigung verweigert;
- den Weg durch den Workflow per Tastatur, Touch und Screenreader;
- wo die App angezeigt wird: eigenständig oder innerhalb einer Host-App.

Organisieren Sie den Bildschirm um diese Antworten. Beginnen Sie nicht mit einem Dashboard-Raster oder einem Komponentenkatalog. Eine gute Oberfläche macht das mentale Modell des Nutzers sichtbar: Dokumente, Konten, Projekte, Nachrichten, Einstellungen oder ein anderes stabiles Objekt – nicht die interne Dienstarchitektur.

Gestalten Sie die Hauptaufgabe, bevor Sie Bedienelemente verteilen. Ihr visuelles Gewicht, ihre Position und ihre Informationstiefe sollten ihrer Bedeutung für das Produkt entsprechen. Ein Kernergebnis darf nicht auf eine kleine Zahl, ein Icon in einer Ecke oder eine schwache Aktion in der Fußzeile reduziert werden, während sekundäre Inhalte die Seite beanspruchen. Wenn eine Ergebnismenge der Hauptwert des Produkts ist, erwägen Sie einen Zusammenfassungsbereich oder eine Karte, die die Anzahl, repräsentative Ergebnisse, einen aussagekräftigen Zustand und eine klare nächste Aktion zeigt.

Benennen Sie für jede vorgeschlagene Aktion ihr sichtbares Objekt, den aktuellen Zustand, den Geltungsbereich und das Ergebnis. Wenn die Oberfläche diese Dinge nicht zeigt oder klar andeutet, ist die Aktion verfrüht. Stellen Sie eine Fähigkeit nicht bereit, nur weil das Backend sie hat; gestalten Sie zuerst, wie das Objekt in das mentale Modell des Nutzers gelangt.

<a id="visual-language"></a>

## Visuelle Sprache

<a id="hierarchy"></a>

### Hierarchie

Bevorzugen Sie wenige, klare Ebenen:

- **Fenster- oder Seitentitel** identifiziert das aktuelle Objekt oder den Arbeitsbereich;
- **Abschnittstitel** trennt sinnvolle Bereiche (`role="header"`, damit Screenreader zwischen ihnen springen können);
- **Fließtext** trägt die Arbeit;
- **gedämpfter Text** liefert sekundäre Metadaten und Hilfe;
- **Labels** bezeichnen Bedienelemente und Werte.

Nutzen Sie Größe, Gewicht, Abstand und Trennlinien, bevor Sie Farbe oder Container hinzufügen. Vermeiden Sie Karten in Karten: Die meisten Bereiche brauchen nur einen Hintergrund, eine feine Begrenzungslinie und bewusst gesetzte Abstände.

Bewerten Sie die Hierarchie über das gesamte Feature hinweg, nicht Komponente für Komponente. Blenden Sie bei der Durchsicht Akzentfarbe und Dekoration aus: Die Hauptaufgabe, die aktuelle Auswahl, die Ergebniszusammenfassung und die nächste Aktion sollten allein aus der Struktur noch offensichtlich sein. Ein Bildschirm mit einzeln plausiblen Bedienelementen kann trotzdem scheitern, wenn sie keine gemeinsame Leseordnung und keinen gemeinsamen Entscheidungsweg bilden.

Behandeln Sie Hervorhebung als begrenztes Budget. Eine lokale Fläche braucht einen klaren Blickpunkt, kein Feld konkurrierender Akzente. Wenn alles farbig, mit Badge versehen, fett, umrahmt oder zum Alert hochgestuft ist, wirkt nichts mehr wichtig. Legen Sie Prioritäten zuerst über Struktur und Nähe fest; setzen Sie stärkere Farbe und Komponenten nur dort ein, wo eine Unterscheidung verändert, was der Nutzer bemerkt oder tut.

<a id="color-and-themes"></a>

### Farbe und Themes

Lesen Sie Farben aus dem Theme (`theme()` in Rust, Token-Klassen in TSX) und verwenden Sie sie gemäß ihrer semantischen Rolle:

- `background` und `foreground` für die Hauptfläche und den Haupttext;
- `card`, `popover`, `sidebar` und ihre Foreground-Tokens für die jeweils benannten Flächen;
- `muted` und `muted-foreground` für unterstützende Informationen;
- `primary` für die Hauptaktion oder die Hervorhebung einer Auswahl, `secondary` und `accent` für dezentere Hervorhebung sowie für Zeilen im Hover- oder Fokuszustand;
- `destructive` nur für destruktive Aktionen und Fehler sowie Statusfarben, die die App ihrem Theme hinzufügt (`success`, `warning`), nur für ihre jeweilige Bedeutung;
- `chart-1` bis `chart-5` für Datenreihen;
- `border`, `input` und `ring` für Struktur und Interaktion.

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().background)
    .p_4()
    .gap_1()
    .child(text("Balance").text_color(move || theme().foreground))
    .child(text("Updated just now").text_sm().text_color(move || theme().muted_foreground))
```

```tsx tabs
<View class="gap-1 rounded-(--radius) border border-border bg-background p-4">
  <Text class="text-foreground">Balance</Text>
  <Text class="text-sm text-muted-foreground">Updated just now</Text>
</View>
```

Verwenden Sie eine semantische Statusfarbe nicht als Dekoration. Kodieren Sie Bedeutung nicht allein über Farbe. Prüfen Sie jede eigene Fläche in hellen und dunklen Themes und mit benutzerdefinierten Theme-Werten, einschließlich des Themes einer Host-App, die Ihre einbettet; nehmen Sie nie an, dass der Vordergrund schwarz oder der Hintergrund weiß ist.

Verwenden Sie ein Badge für einen kurzen Zustand, eine Zahl oder eine Klassifizierung, die vom schnellen Überfliegen profitiert – nicht für jedes Label, jeden Metadatenwert, jeden Filter oder jeden Abschnittstitel. Halten Sie die meisten Badges neutral; reservieren Sie semantische Farben für Zustände, die tatsächlich Erfolg, Warnung, Destruktivität oder Information ausdrücken. Eine Reihe mehrfarbiger Badges deutet meist auf eine fehlende Hierarchie- oder Gruppierungsentscheidung hin.

Die Anwendungs-UI sollte keine rohen Hex-Werte, `rgb()`/`rgba()`- oder `hsl()`-Farben und keine Palettenklassen wie `bg-zinc-100` enthalten. Lösen Sie Farben aus dem Theme nach semantischer Rolle auf. Falls die benötigte Rolle nicht existiert, definieren Sie sie in der Theme-Datei der App ([Theme tokens](./tailwind.md#theme-tokens): `"up": "#16a34a"` in ihrem `light` und `dark` erzeugt `text-up`, `bg-up/30`, `token("up")` in TSX und `theme().color("up")` in Rust), statt einen Palettenwert an der Aufrufstelle einzubetten. Rohe Farben gehören nur in Theme-Definitionen oder in geprüfte Daten-/Rasterinhalte, deren Farbe selbst die Daten sind.

<a id="radius-spacing-and-density"></a>

### Radius, Abstand und Dichte

Verwenden Sie wie bei Schrift und Control-Größen eine endliche Radius-Skala. Wählen Sie aus den `radius` des Themes (für Controls und Flächen gleichermaßen, `rounded-(--radius)`), aus Radien, die die App ihrem Theme hinzufügt, und aus Tailwinds `rounded-sm` … `rounded-2xl` dazwischen), statt für jedes Element einen eigenen Radius zu erfinden. Große Container dürfen eine weichere Stufe verwenden als die Controls, die sie enthalten; kompakte Controls und Overlays verwenden engere Stufen. Bei einem gewöhnlichen Rechteck sollte der Radius sichtbar kleiner als die Hälfte der kürzeren Seite bleiben. Verwenden Sie `rounded-full` (`.rounded_full()`) nur für beabsichtigte Kreise und Pillen; ein Tooltip darf nicht versehentlich zur Kapsel werden.

Verschachtelte Flächen sollten als konzentrische Formen wirken. Verwenden Sie `inner radius ≈ max(0, outer radius − gap)`, um den am besten passenden Radius zu wählen; das sichtbare Band sollte über die Rundung hinweg gleichmäßig bleiben. Fügen Sie dem Theme ein benanntes Token hinzu (`"radius-inset": "0.375rem"`, `rounded-(--radius-inset)`), wenn eine wiederkehrende Komposition einen Zwischenwert braucht. Ein Segmented Control ist eine einzige Silhouette: Seine äußeren Segmente folgen den inneren Ecken des Containers, die mittleren Segmente bleiben eckig, und jede Grenze hat genau eine Trennlinie gleichbleibender Stärke.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

Ein Radius muss die gesamte sichtbare Fläche bestimmen, nicht nur ihren Rahmen. Freiliegende Ecken bleiben gegenüber der dahinterliegenden Fläche transparent; auch Hintergründe von Kindelementen, Auswahlfüllungen und scrollender Inhalt müssen der Begrenzung folgen. Geben Sie inneren Flächen einen eigenen Radius oder beschneiden Sie den Container mit `overflow-hidden` (`.overflow_hidden()`) und prüfen Sie die Komposition dann vor einem kontrastierenden Hintergrund in beiden Themes. Bewahren Sie nach außen liegende Fokusringe, wenn Sie ein Clipping wählen.

Verwenden Sie eine kompakte Abstandsskala und wiederholen Sie sie. Zusammengehörige Paare aus Label und Control sollten näher beieinander liegen als getrennte Gruppen; getrennte Gruppen sollten näher beieinander liegen als getrennte Abschnitte. Bevorzugen Sie die Größen der Komponenten der App (klein, mittel als Standard, groß) gegenüber einmaligen Höhen. Verwenden Sie kompakte Varianten für Toolbars und datendichte Bildschirme, nicht um ein unklares Layout in weniger Platz zu pressen.

Die gemeinsame semantische Skala ist bewusst klein: Die Abstände steigen ungefähr über 2, 4, 8, 12, 16, 24 und 32 Punkte, während die Typografie bei etwa 12, 14, 16, 18 und 20 Punkten bleibt. Verstehen Sie diese Werte als Beziehungen, nicht als Erlaubnis, ihre aktuellen Zahlenwerte im Feature-Code zu verstreuen. Tailwinds Abstandsskala liefert sie: Eine Stufe entspricht 4 Punkten (`p-4` sind 16pt), sowohl in Klassen als auch in typisierten Rust-Methoden; `"spacing"` in `nsh.json`s `"tailwind"` ändert die Stufe der Klassen, während typisierte Methoden Tailwinds Standardskala beibehalten. Eine Anwendung, die eine andere Skala braucht, besitzt diese in ihren eigenen Komponenten oder Theme-Tokens (`p-(--gap-card)`) und verwendet sie konsistent.
<a id="spatial-grammar"></a>

### Räumliche Grammatik

Abstände drücken Beziehungen aus. Wähle einen Abstand aus der semantischen Skala, indem du fragst, was die beiden Elemente einander bedeuten:

| Beziehung | Typische Klasse | Aktuelle Skala | Beispiele |
| --- | --- | --- | --- |
| Optische Korrektur | `gap-0.5` | 2 pt | Icon-Grundlinie, kompakter Trenner |
| Teile eines Steuerelements | `gap-1` | 4 pt | Menü-Icon/Label, Titel/Beschreibung |
| Eng verwandte Steuerelemente | `gap-2` | 8 pt | Button-Icon/Label, Dialogaktionen |
| Eine Inhaltsgruppe | `gap-3` | 12 pt | Benachrichtigungsspalten, kompakte Formularzeilen |
| Getrennte Gruppen in einem Abschnitt | `gap-4` | 16 pt | Panel-Padding, Formulargruppen |
| Getrennte Abschnitte | `gap-6` | 24 pt | Hauptblöcke in einer Seite oder einem Inspector |
| Grenze zwischen Hauptbereichen | `gap-8` | 32 pt | Freiraum in Leerzuständen, Seitenbänder |

Diese Werte beschreiben die Standardskala, keine Literale, die du wiederholen sollst. Verwende die Spacing-Klassen und typisierten Methoden (`gap-2`,
`.gap_2()`, `p-4`, `.p_4()`) oder die Tokens des Themes. Eine produkteigene Skala sollte die Reihenfolge und
die Beziehungen bewahren und über die eigenen Komponenten der Anwendung weitergegeben werden, statt an jeder Aufrufstelle geschrieben zu werden.

Verwende diese Regeln, um horizontalen und vertikalen Raum aufzulösen:

1. **Innen vor außen.** Das Padding einer Komponente gehört der Komponente; der Abstand zwischen Komponenten gehört
   ihrem Parent.
2. **Vertikaler Rhythmus zeigt Gruppierung.** Der Abstand zwischen einem Titel und seiner Beschreibung ist kleiner als der Abstand von dieser
   Beschreibung zum nächsten Abschnitt. Gleiche Abstände implizieren gleiche Beziehungen.
3. **Horizontaler Raum unterstützt das Scannen.** Wiederholte Zeilen halten Icons, Labels, Werte, Badges und nachgestellte Aktionen
   auf stabilen Spalten.
4. **Leading und Trailing sind semantisch.** Denke in Kanten der Leserichtung und schreibe sie als Start und Ende (`ps-*`,
   `me-*`, `.ps_4()`), damit das Layout bei Rechts-nach-links gespiegelt wird.
5. **Verdopple Padding nicht.** Eine Karte in einem bereits gepolsterten Panel sollte nicht automatisch einen weiteren vollen
   Panel-Einzug hinzufügen.
6. **Setze optische Ausrichtung sparsam ein.** Eine Korrektur von ein oder zwei Punkten ist für die Geometrie von Icons oder Glyphen zulässig,
   aber dokumentiere, warum sie von der Skala abweicht.

Gängige Kompositionen veranschaulichen die Beziehungen:

- Button-Inhalte verwenden bei kleinen Größen 4 pt und bei normalen Größen 8 pt;
- Dialog-Header und -Footer verwenden einen internen Abstand von 8 pt;
- kompakte Listen- und Menüzeilen verwenden 4 pt vertikales und 8–12 pt horizontales Padding;
- Sheet-Header verwenden etwa 16 pt Leading- und 12 pt Trailing-Abstand, um Platz für ein Schließen-Element zu lassen, während Footer
  16 pt horizontalen und 12 pt vertikalen Abstand verwenden;
- Benachrichtigungen verwenden 16 pt horizontales Padding und 12 pt Spaltenabstand, weil Icon, Nachricht und Aktion
  unterschiedliche Gruppen sind.

Behandle diese nicht als Copy-and-paste-Rezepte für jede Oberfläche. Sie offenbaren das System: Steuerelemente sind intern enger,
Zeilen optimieren das Scannen, und Container investieren an ihrer Grenze mehr Raum als zwischen ihren Inhalten.

<a id="proportion-and-layer-hierarchy"></a>

### Proportion und Ebenenhierarchie

Beginne mit den Inhaltsanforderungen und lege dann die Proportionen fest. Vermeide willkürliche Hälften, wenn ein Bereich eine deutlich andere
Rolle hat.

- Eine Navigations-Sidebar sollte breit genug für stabile Labels sein, aber sichtbar dem Arbeitsbereich untergeordnet. Gib ihr
  eine minimale, bevorzugte und maximale Breite (`min-w-*`, `w-*`, `max-w-*`) statt nur eines Prozentwerts.
- Lass in Master-Detail-Layouts die Sammlung scannbar bleiben und gib dem Detailbereich den Überschuss. Ein ungefähres
  Drittel/Zwei-Drittel-Verhältnis als Ausgangspunkt ist oft nützlich, aber die Inhaltsbeschränkungen sind maßgeblich. Auf einem Smartphone werden die beiden
  zu zwei Seiten eines `NavStack`.
- Inspectors und zusätzliche Sheets sollten das primäre Objekt standardmäßig nicht verdecken. Sie sollten in der Größe veränderbar oder
  schließbar sein, wenn ihr Inhalt wächst; ein [`Sheet`](../elements/sheet.md) schließt sich mit seinem Backdrop, per Escape und per Zurück.
- Die Dialogbreite ergibt sich aus der Entscheidung: ein `AlertDialog` für eine kurze Bestätigung, ein mittleres Formular oder ein eigenes
  Fenster bzw. eine eigene Seite für komplexe Arbeit. Vergrößere einen Dialog nicht, nur um Weißraum zu schaffen.
- Reserviere die stärkste Elevation für die oberste Entscheidungsebene. Innerhalb einer Ebene verwende Hintergrund und Hairlines – nicht
  zunehmend größere Schatten –, um Hierarchie zu zeigen.

Definiere für jeden Hauptbereich drei Größenbeschränkungen: das Minimum, bei dem seine Aufgabe noch funktioniert, einen komfortablen
Standardwert und wie er Überschuss aufnimmt. Persistiere vom Benutzer gesteuerte Splits, wenn sie eine Workflow-Präferenz darstellen,
und begrenze wiederhergestellte Werte (Clamping) anhand des aktuellen Fensters.

<a id="alignment-details"></a>

### Ausrichtungsdetails

Ausrichtung ist ein strukturelles System, kein abschließender Politur-Durchgang. Lege für jede Oberfläche eine kleine Menge von Ausrichtungsachsen fest:
gemeinsame Leading- und Trailing-Kanten, Text-Grundlinien, Mittellinien und feste funktionale Spuren. Elemente auf derselben Ebene
sollten von oben nach unten oder von Leading nach Trailing an derselben Achse anliegen, auch wenn sie unterschiedliche Komponententypen sind.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

Vertikale rote Linien liegen neben gemeinsamen Kanten oder Steuerelement-Mitten für Inhalt, Status, Zeit und nachgestellte Aktionen.
Horizontale Linien liegen unter Text-Grundlinien oder verlaufen durch die Mitte einer Zeile, um untere und vertikal zentrierte Ausrichtung zu zeigen.
Der kompakte Vergleich isoliert eine Abweichung von einem gerenderten Pixel, die bei ihrem strukturellen Eigentümer korrigiert werden muss.

- Gib benachbarten Bereichen einen gemeinsamen Inhaltseinzug. Eine Überschrift, Toolbar, Listenzeile, ein Leerzustand und ein Footer, die dieselbe
  Ebene beschreiben, sollten nicht jeweils eine leicht abweichende Leading-Kante erfinden.
- Wiederhole die Spaltengeometrie im gesamten Bereich. Header, Zeilen, Zusammenfassungen, Ladezustände und Inline-Editoren sollten dieselben
  Spuren für Identität, Metadaten, Status, Zahlen und Aktionen reservieren.
- Richte zusammengehörige Steuerelemente über Zeilen und Abschnitte hinweg aus. Formular-Labels, Felder, Beschreibungen und Validierungsmeldungen sollten
  ein stabiles vertikales Raster zeigen, wenn die Seite von oben nach unten überflogen wird.
- Halte horizontale Bänder kohärent. Elemente, die sich eine Toolbar, einen Header, eine Statusleiste oder eine Zeile teilen, sollten eine Grundlinie oder
  Mittellinie verwenden statt einzeln abgestimmter Offsets.
- Führe Einzüge nur für echte Hierarchie, Einschluss oder Disclosure ein. Dekorative Einzüge lassen Geschwisterelemente
  untergeordnet wirken und brechen die Leselinie der Oberfläche.
- Wenn eine verschachtelte Ebene endet, kehre exakt zur Achse des Parents zurück. Lass kein akkumuliertes Padding
  über verschachtelte Container hinweg driften.
- Bewahre die Achse auch bei optionalem Inhalt. Fehlende Icons, Badges, Beschreibungen oder nachgestellte Aktionen dürfen die verbleibenden Labels nicht verschieben;
  verwende bewusste Slots oder Spuren, wenn der zeilenübergreifende Vergleich wichtig ist.
- Richte Hauptbereiche aneinander aus, wenn ihre Hierarchie übereinstimmt. Sidebar-Header, Inhaltstitel, Split-Panes,
  Toolbars und untere Leisten müssen nicht jede Koordinate teilen, aber zusammenfallende Ebenen sollten sichtbar durchgehende
  Linien bilden.

Nicht jede Kante sollte ausgerichtet sein. Ein Kind kann eingerückt sein, ein primärer Wert kann seinen unterstützenden Metadaten vorangehen, und eine destruktive
Entscheidung kann Abstand gewinnen. Solche Ausnahmen müssen Hierarchie oder Bedeutung vermitteln; sie dürfen nicht aus
unkoordiniertem Komponenten-Padding entstehen. Beginne mit der gemeinsamen Achse und mache dann die Ausnahme explizit.

Behandle exakte Ausrichtung und wiederholte Abstände als Qualitätsinvarianten. Wenn zwei Kanten oder Abstände gleich sein sollen, ist eine
Abweichung von einem gerenderten Pixel ein Defekt, keine akzeptable optische Näherung. Prüfe die aufgelösten Bounds mit einem Messwerkzeug bei repräsentativen Fenstergrößen, Textgrößen
und Display-Skalierungsfaktoren. Vergleiche Koordinaten und
Distanzen; genehmige Ausrichtung nicht nur anhand eines beiläufigen Screenshots.

Die Toleranz auf Ebene gerenderter Pixel ist eine Verifikationsregel, keine Erlaubnis, den Code mit rohen Punkt-Offsets zu flicken.
Gleiche Beziehungen sollten aus derselben Spacing-Klasse oder -Methode, demselben Token, derselben Rasterdefinition oder demselben gemeinsamen Komponenten-Einzug aufgelöst werden.
Behebe den gemeinsamen Eigentümer, wenn sie abweichen. Berücksichtige gebrochenes Layout und Geräterundung (2×- und 3×-Smartphones, gebrochene
Desktop-Skalierungen), damit vorgesehene Achsen auf demselben physischen Pixel landen, statt bei bestimmten Skalierungen zu driften.

- Richte Text an Grundlinien aus, nicht an der Mitte der Bounding-Box, wenn gemischte Größen sich eine Zeile teilen.
- Zentriere Icons in einem festen Slot, damit Labels sich nicht verschieben, wenn Icons unterschiedliche intrinsische Breiten haben.
- Richte vergleichbare Zahlen am Ende aus und verwende tabellarische Ziffern (`tabular-nums`); richte Fließtext und Bezeichner am
  Start aus, sofern die Locale nichts anderes verlangt.
- Halte nachgestellte Zeilenaktionen und Disclosure-Indikatoren in Spuren fester Breite.
- Richte Formularsteuerelemente an ihrem interaktiven Frame aus, nicht am Hilfetext darunter.
- Verwende `justify-between` (`.justify_between()`) nur, wenn die beiden Seiten wirklich gegenüberliegende Kanten besitzen; es sollte keine
  fehlende Struktur in der Mitte verschleiern.
- Hairlines gehören dem Eigentümer der Grenze. Zwei benachbarte Bereiche dürfen nicht beide denselben Trenner zeichnen.
- Eine Scrollbar gehört zu dem Bereich, der scrollt, und liegt an der Trailing-Kante dieses Panels, Editors oder Fensters. Das
  Padding des Inhalts darf Text und Zeilen einrücken; es darf die Scrollbar nicht in die Mitte der Oberfläche ziehen. Polstere den
  Inhalt der Scroll-View, nicht die Scroll-View selbst.

<a id="density-tiers"></a>

### Dichtestufen

Medium ist der Standard. Ändere die Dichte für den gesamten lokalen Kontext, nicht für ein einzelnes Steuerelement:

- **comfortable / large:** Onboarding, spärliche Formulare, prominente Entscheidungen;
- **standard / medium:** der Großteil der Anwendungs-Chrome und Workflows sowie jeder Touchscreen;
- **compact / small:** Desktop-Toolbars, Menüs, Tabellen und wiederholte professionelle Daten;
- **extra compact / xsmall:** außergewöhnliche Hochdichte-Werkzeuge, niemals die automatische Wahl für eine ganze Anwendung.

Verwende eine begrenzte Skala statt beliebiger Größen. Auf Touchscreens ist jedes drückbare Ziel mindestens 44 × 44 Punkte groß
([Touch-Ziele](./accessibility.md#touch-targets)). Mit einem Zeigegerät bewegen sich Buttons üblicherweise durch Frames von etwa 24, 28
und 32 pt, Eingaben reichen bei großer Größe bis etwa 40 pt, und Tabellenzeilen verwenden etwa 28, 32 und 40 pt. Gib den
Komponenten der App eine Größe, die Typografie, Icon, Padding und Hit-Target gemeinsam ändert; eine benutzerdefinierte Höhe, die
nur die äußere Box ändert, ist meist unvollständig.

<a id="text-size-base-font-and-points"></a>

### Textgröße, Basisschrift und Punkte

Eine gut gestaltete Skala bewahrt die Hierarchie, während der Text wächst. Größerer Text ist gelungen, wenn die Beziehung zwischen
Titel und Fließtext, Steuerelement und Icon, innerem und äußerem Abstand sowie primären und sekundären Bereichen bei jeder
Größe gleich wirkt – nicht bloß, wenn jedes Objekt größer wird.

Die Längen in NSH sind Punkte, und die Textgröße des Benutzers (Dynamic Type auf iOS, Schriftgröße auf Android, die Textskalierung der Desktops, eine eigene Einstellung einer Host-App) skaliert Text: Jeder Text und jede Eingabe, die Schriftskalierung erlaubt, wächst, während Abstände,
Radien, Rahmen und Bilder ihre Größe behalten ([Textgröße](./device-and-environment.md#text-size)). Die Basistextgröße der App (Tailwinds `text-base`, 16 Punkte) ist die Größe des Fließtexts, um die sich die Typografieskala stuft.

Entwirf in Verhältnissen:

- Typografiestufen halten dieselbe Hierarchie um die Basisgröße des Fließtexts;
- Abstandsstufen halten dieselben Gruppierungsbeziehungen um die Typografie;
- Steuerelement-Frames und Hit-Targets wachsen mit ihren Labels: Bemesse sie nach ihrem Inhalt und einem Minimum (`min-h-11`), nicht nach einer
  festen Höhe;
- Pane-Minima und komfortable Breiten berücksichtigen größeren Text;
- Eckenradien und Fokusdarstellung bleiben optisch konsistent mit dem Steuerelement-Frame.

Da Text von selbst wächst, bricht ein fester Frame darum: ein größeres Label in einem Button fester Höhe, ein größeres
Dokument in festen Pane-Minima oder größere Zeilen in einer festen Zeilenhöhe zerstören den ursprünglichen Rhythmus und können Inhalt abschneiden.
Lass Zeilen umbrechen oder in eine Spalte wechseln, wenn der Text groß wird (`fontScale()`, `font_scale()`), und begrenze die Skalierung
von Text, der bereits groß ist, etwa eines 34-pt-Titels (`maxFontSizeMultiplier`).

Grundsätzlich sollte das Anwendungslayout keine literalen Punktwerte schreiben (`p-[13px]`, `px(13.0)`). Verwende die Spacing-Skala
(`p-2`, `gap-3`, `w-64`, `text-sm` und ihre typisierten Methoden) oder die Komponentengrößen der App. Verwende literale Punkte nur, wenn
der Wert eine physische oder Raster-Grenze darstellt: eine Hairline, einen plattformspezifischen Fenstereinzug, Bitmap-Abmessungen, eine minimale
Hit-Test-Toleranz oder Geometrie, die zu einer externen Oberfläche passen muss. Dies sind geprüfte, dokumentierte Ausnahmen. Produktabstände,
Typografie, Icon-Größe und gewöhnliche Steuerelement-Geometrie bleiben auf der Skala.

Teste bei mehreren Textgrößen, nicht nur beim Standard. Prüfe Hierarchie, Umbruch, Kürzung, minimale Fenstergröße, Pane-Größenänderung, Freiraum um den Fokusring, Popup-Platzierung und die Messung von Listenzeilen.
<a id="surfaces-and-elevation"></a>

### Oberflächen und Elevation

Verwende Elevation, um Schichtung zu erklären, nicht Wichtigkeit. Die Basisfläche ist flach; Trennlinien und Hintergrundkontrast definieren ihre Bereiche. Popovers, Menüs, Sheets, Dialoge und Benachrichtigungen dürfen zunehmend stärkere Schatten verwenden, weil sie über anderen Inhalten liegen. Setze nicht auf jede Karte einen Schatten.

Alle Oberflächen derselben Art sollten dieselbe Gestaltung teilen. Gib den Popup-Familien eine gemeinsame thematisierte Oberfläche (die `popover`-Tokens, den Rahmen, `radius` und einen Schatten), damit `Popover`, `Menu`, `ContextMenu` und `Tooltip` nicht auseinanderdriften. Wenn eine Anwendung eine weitere verankerte Oberfläche erfindet, verwende diese Gestaltung wieder, statt sie mit unabhängigen Rahmen- und Schattenliteralen anzunähern.

<a id="typography-and-icons"></a>

### Typografie und Icons

Verwende die Plattform-UI-Schrift für Oberflächentext und Monospace nur für Code, Bezeichner, Tastenkürzel und ausgerichtete numerische Daten. Halte Fließtext gut lesbar und vermeide übermäßige Großschreibung oder Buchstabenabstände, besonders bei CJK-Text.

Verwende in einem Produkt nur eine Icon-Familie. Icons ergänzen Beschriftungen; sie sollten unbekannte Aktionen nicht durch bloßes Raten ersetzen. Schaltflächen nur mit Icon brauchen immer einen zugänglichen Namen (`accessibilityLabel`). Ihre visuelle Erklärung folgt der unten beschriebenen Tooltip-Richtlinie. Verwende gefüllte oder farbige Icons, um einen Zustand zu vermitteln, nicht bloß um eine Symbolleiste lebendiger wirken zu lassen.

<a id="layout-patterns"></a>

## Layout-Muster

<a id="choose-a-stable-shell"></a>

### Eine stabile Shell wählen

Die meisten Anwendungen sollten eine dieser Shells verwenden:

- **Einzelner Arbeitsbereich:** eine Kopfzeile oder Symbolleiste über einer primären Ansicht;
- **Navigationsstapel:** Seiten, die ein- und ausgeblendet werden (`NavStack`), mit der Zurück-Geste des Systems auf Smartphones;
- **Seitenleisten-Arbeitsbereich:** dauerhafte Navigation neben einer wechselnden Detailansicht;
- **Master-Detail:** Sammlung und Detailbereich mit veränderbarer Größe, auf einem Smartphone zwei Seiten;
- **Dokument-Arbeitsbereich:** Tabs für mehrere langlebige Objekte;
- **Hilfsfenster:** eine fokussierte Aufgabe mit kurzem, festem Aktionspfad.

Halte die globale Navigation stabil, während sich der Inhalt ändert. Gib dem primären Arbeitsbereich mit `flex-1` (`.flex_1()`) den verbleibenden Platz und verwende `min-w-0` / `min-h-0` dort, wo überlaufende Kindelemente schrumpfen müssen. Verwende `Scroll` und `List` für ihr vorgesehenes Verhalten, statt Scrollen oder Virtualisierung aus verschachtelten Ansichten nachzubauen.

Auf Desktops ist eine eigene Titelleiste der App (`nsh/desktop` (../modules/nsh-desktop.md)) zuerst Fensterrahmen. Erhalte ihren Ziehbereich (`.window_drag(true)`) und vermeide es, gewöhnliche Klicks auf den Titel an selten genutzte Bearbeitungsbefehle zu binden. Umbenennen gehört hinter einen expliziten Objektbefehl, gegebenenfalls mit einem Tastaturpfad.

<a id="responsive-windows"></a>

### Responsive Fenster

Ein Fenster kann beliebig groß sein: Der Benutzer, eine geteilte Ansicht oder die Host-App bestimmt es. Lege fest, was passiert, wenn ein Fenster schmaler wird:

1. die primäre Aufgabe bewahren;
2. Bereiche mit veränderbarer Größe bis zu einem dokumentierten Minimum schrumpfen lassen;
3. sekundäre Beschriftungen oder Inspektoren einklappen;
4. selten genutzte Aktionen in ein Menü verschieben;
5. nur den Bereich scrollen, dessen Inhalt tatsächlich überläuft.

Blende keine Aktion aus, ohne einen anderen Weg dorthin anzubieten. Vermeide es, das gesamte Fenster scrollen zu lassen, wenn nur eine Liste oder ein Dokumentkörper scrollen sollte. Breakpoints (`md:`, `lg:`) und `windowSize()` (`window()` in Rust) richten sich nach der Oberfläche, in die NSH rendert.

Das Flex-Layout von NSH unterliegt demselben Druck durch intrinsische Größen wie andere Layout-Systeme: Ein `flex-1`-Kindelement kann sich bei langem Inhalt dennoch weigern zu schrumpfen. Design und Implementierung müssen sich einig sein, welche Bereiche schrumpfen, abschneiden, umbrechen oder scrollen dürfen. Ein abgeschnittener Bereich schneidet auch einen nach außen reichenden Fokusring ab; opfere niemals die Sichtbarkeit des Tastaturfokus, nur um den Überlauf zu vereinfachen.

<a id="forms-and-settings"></a>

### Formulare und Einstellungen

Verwende für jedes Feld eine sichtbare Beschriftung und platziere Hilfe oder Validierung direkt neben dem Feld, das sie beschreibt. Richte zusammengehörige Felder aus, aber zwinge lange Beschriftungen nicht in eine schmale feste Spalte. Verwende das passende Steuerelement: `Checkbox` für unabhängige Auswahlmöglichkeiten, eine [`RadioGroup`](../elements/radio.md) aus `Radio`s für eine kleine sichtbare Menge, ein `Menu` mit Auswahlmöglichkeiten für eine größere Menge und [`Switch`](../elements/switch.md) für eine Einstellung, die sofort wirksam wird. Ihre Teile (Track und Thumb des Switch, der Indikator der Checkbox) werden von der App gestaltet, mit `checked:`-, `indeterminate:`- und `disabled:`-Klassen, die dem Steuerelement folgen:

```rust tabs
use nsh_base::{switch, theme};

fn setting_switch(label: &'static str, on: Signal<bool>) -> impl IntoElement {
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text(label).text_color(move || theme().foreground))
}
```

```tsx tabs
import { Text } from "nsh";
import { Switch } from "nsh/base";

function SettingSwitch(props: { label: string; on: boolean; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Switch
      checked={props.on}
      onChange={props.onChange}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text class="text-foreground">{props.label}</Text>
    </Switch>
  );
}
```

Eine „Alle auswählen“-Checkbox zeigt eine teilweise Auswahl mit ihrem Zustand „unbestimmt“ (indeterminate) an:

```rust tabs
use nsh_base::{checkbox, theme};

fn select_all(selected: Signal<usize>, total: usize) -> impl IntoElement {
    checkbox()
        .checked(move || selected.get() == total)
        .indeterminate(move || selected.get() > 0 && selected.get() < total)
        .on_change(move |all: &bool| selected.set(if *all { total } else { 0 }))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded(move || theme().radius)
                .border_2()
                .border_color(move || theme().border)
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
                .indeterminate(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || mark(selected.get(), total)).text_color(move || theme().primary_foreground))
        .child(text("Select all").text_color(move || theme().foreground))
}

fn mark(selected: usize, total: usize) -> &'static str {
    if selected == total { "✓" } else if selected > 0 { "–" } else { "" }
}
```

```tsx tabs
import { Text } from "nsh";
import { Checkbox } from "nsh/base";

function SelectAll(props: { selected: number; total: number; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Checkbox
      checked={props.selected === props.total}
      indeterminate={props.selected > 0 && props.selected < props.total}
      onChange={props.onChange}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-(--radius) border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
      indicator={
        <Text class="text-primary-foreground">
          {props.selected === props.total ? "✓" : props.selected > 0 ? "–" : ""}
        </Text>
      }
    >
      <Text class="text-foreground">Select all</Text>
    </Checkbox>
  );
}
```

Deaktiviere das Absenden, solange ein Vorgang läuft, behalte die Eingaben des Benutzers bei und zeige das Ergebnis in der Nähe der Aktion an. Halte Eingabefelder oberhalb der Software-Tastatur (`env(keyboard-inset-height)`). Reserviere Dialoge für kurze, fokussierte Entscheidungen; verwende eine ganze Seite oder ein Sheet für Abläufe, die Erkundung oder viele Felder erfordern.

Eine Ladeanzeige muss tatsächliches Warten darstellen. Der Wechsel zwischen Einstellungsbereichen, deren Inhalt bereits verfügbar ist, sollte sofort erfolgen; ein Skeleton ist nur angemessen, solange Inhalte wirklich geladen werden und ihre Form bekannt ist.

<a id="components-and-composition"></a>

## Komponenten und Komposition

Folge dem Shadcn-Prinzip, dass Komponenten Baumaterial sind und kein abgeschlossenes Designsystem. `nsh/base` liefert das Verhalten; die App liefert stimmige Standardwerte in ihren eigenen Komponenten und verantwortet Komposition und Produktsemantik.

- Verwende Komponentenvarianten nach Bedeutung. „Primary“ ist der expliziten Standardbestätigung in einem Entscheidungsbereich vorbehalten – normalerweise die Aktion, die auf Desktops durch Return ausgelöst wird. Eine einzelne, häufige oder wünschenswerte Aktion ist nicht automatisch primary. Ein `Add`-Befehl in einer Verwaltungssymbolleiste verwendet normalerweise eine Default-Schaltfläche; die Standardbestätigung `Create` eines Formulars darf primary verwenden. Verwende destructive für destruktive Bestätigungen und ghost für ruhige Symbolleistenaktionen.
- Bevorzuge explizite Teile und Slots gegenüber dem Stylen beliebiger Nachkommen.
- Halte ein wiederkehrendes Muster im ganzen Produkt konsistent. Kapsle es in einer Anwendungskomponente, wenn es Fachsprache oder Richtlinien trägt.
- Verwende die Standardkomponente für ihre semantische Rolle. `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Dialog` und `AlertDialog` sind keine austauschbaren Boxen; jede besitzt eigene Verträge für Auswahl, Fokus, Tastatur, Schließen und Layout und nimmt auf jedem Gerät ihre eigene Form an.
- Bewahre die Geometrie der Komponentenfamilie. Menüzeilen teilen vertikalen und horizontalen Innenabstand, Höhe, Icon- und Häkchen-Slots, Trennlinien, Radius und Zustandsgestaltung. Ahme kein Menü mit einem eigenen Popup nach, dessen Abstände das System nur annähern.
- Kapsle eine Komponente nicht bloß, um jede Prop umzubenennen oder alle ihre Fähigkeiten einzufrieren.
- Verschiebe wiederverwendbares Verhalten ohne Produkt-Styling nach `nsh/base` oder in ein Crate, das die Produkte der App gemeinsam nutzen; behalte thematisierte, meinungsstarke Präsentation in den Komponenten der Anwendung.

```rust tabs
use nsh_base::{button, theme};

/// The footer of a form: a default Cancel and the primary commit.
fn form_actions(cancel: impl Fn() + 'static, create: impl Fn() + 'static) -> impl IntoElement {
    view()
        .flex_row()
        .justify_end()
        .gap_2()
        .child(
            button()
                .on_press(cancel)
                .rounded(move || theme().radius)
                .border_1()
                .border_color(move || theme().border)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().muted))
                .child(text("Cancel").text_color(move || theme().foreground)),
        )
        .child(
            button()
                .on_press(create)
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .child(text("Create").text_color(move || theme().primary_foreground)),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Button } from "nsh/base";

// The footer of a form: a default Cancel and the primary commit.
function FormActions(props: { onCancel: () => void; onCreate: () => void }) {
  return (
    <View class="flex-row justify-end gap-2">
      <Button onPress={props.onCancel} class="rounded-(--radius) border border-border px-4 py-2 active:bg-muted">
        <Text class="text-foreground">Cancel</Text>
      </Button>
      <Button onPress={props.onCreate} class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
        <Text class="text-primary-foreground">Create</Text>
      </Button>
    </View>
  );
}
```

<a id="interaction-states"></a>

## Interaktionszustände

<a id="make-the-result-understandable-before-the-click"></a>

### Das Ergebnis schon vor dem Klick verständlich machen

Ein Steuerelement sollte sein Ergebnis vorhersagbar machen. Verwende vertraute Plattform-Steuerelemente und -Platzierungen, damit Menschen handeln können, ohne zuvor die Oberfläche lernen zu müssen. Seine Beschriftung nennt Aktion und Objekt, sein Zustand zeigt die Verfügbarkeit, und sein Feedback bestätigt dasselbe Ergebnis.

Beschrifte eine Button nicht mit `Save`, wenn sie einen Konfigurationsablauf öffnet, oder mit `Delete`, wenn sie nur ein Element aus einer Gruppe entfernt. Nenne den Geltungsbereich, wenn der Kontext ihn nicht klar macht. Reagiere sofort auf die Aktivierung, verhindere doppeltes Absenden bei längeren Vorgängen und zeige das Ergebnis in der Nähe des Objekts, das sich geändert hat. Füge eine Erfolgsmeldung nur hinzu, wenn das Ergebnis selbst nicht sichtbar ist.

Jedes interaktive Steuerelement sollte für Folgendes gestaltet sein:

| Zustand | NSH | Designanforderung |
| --- | --- | --- |
| Ruhe | | Klare Affordanz ohne visuelles Rauschen |
| Hover | `hover:` | Dezentes Zeiger-Feedback, niemals der einzige Hinweis |
| Gedrückt | `active:` | Sofortiges Feedback beim Drücken, von der App gestaltet |
| Geöffnet / gedrückt | das `open` des Popups | Dauerhaftes Feedback, solange ein angehängtes Popup geöffnet ist |
| Fokus sichtbar | `focus-visible:` | Kontrastreicher Tastaturfokusring |
| Ausgewählt / aktiviert | `selected:`, `checked:` | Dauerhafter Zustand, der sich vom Hover unterscheidet |
| Deaktiviert | `disabled:` | Geringere Betonung und keine irreführende Hover-/Pressed-Reaktion |
| Laden | | Kontext bewahren, doppelte Aktionen verhindern, lange Wartezeiten erklären |
| Fehler | | Angeben, was passiert ist und wie man sich erholt |

Binde Befehle, die über die Tastatur funktionieren sollen, auf Desktops und im Web mit [`keymap`](../modules/nsh.md#keymap). Verwende vertraute Plattform-Tastenkürzel (`"mod+k"` ist Command unter macOS, sonst Control), zeige Tastenkürzel in Menüs oder Tooltips an und halte den Fokus nach dem Öffnen oder Schließen eines Overlays an einer logischen Stelle.

Auswahl ist Teil des Informationsmodells, kein optionaler Feinschliff. Tabs, segmentierte Auswahlen, auswählbare Zeilen, Filter und Navigationsziele müssen einen dauerhaften Auswahlzustand zeigen (`selected`, den Screenreader ansagen). Eine Button, die ein Menü besitzt, muss sichtbar gedrückt oder geöffnet bleiben, bis das Popup schließt; Hover allein kann die Beziehung zwischen Auslöser und Oberfläche nicht erklären.

```rust tabs
use nsh_base::{tab, theme};

fn section_tab(label: &'static str, id: Section, current: Signal<Section>) -> impl IntoElement {
    let selected = move || current.get() == id;
    tab()
        .selected(selected)
        .on_press(move || current.set(id))
        .rounded(move || theme().radius)
        .px_3()
        .py_2()
        .selected_style(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || {
            if selected() { theme().foreground } else { theme().muted_foreground }
        }))
}
```

```tsx tabs
import { Text } from "nsh";
import { Tab } from "nsh/base";

function SectionTab(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tab
      selected={props.selected}
      onPress={props.onPress}
      class="group rounded-(--radius) px-3 py-2 selected:bg-muted"
    >
      <Text class="text-muted-foreground group-selected:text-foreground">{props.label}</Text>
    </Tab>
  );
}
```

In einem segmentierten Steuerelement müssen die ausgewählte Füllung und die nicht ausgewählte Oberfläche die Silhouette des Containers teilen. Keine von beiden darf eine Endecke eckig machen oder eine Grenze schwerer erscheinen lassen als ihre Nachbarn.

Zeige ein ausgewähltes Navigationselement, eine Listenzeile oder einen Tab über die eigene Oberfläche des Elements: eine Auswahlfüllung, einen stärkeren Vordergrund oder ein kräftigeres Schriftgewicht. Füge keine Leiste an der Vorderkante und keinen einseitigen Rahmen als Auswahlmarkierung hinzu. Das ist eine Gewohnheit aus Web-Vorlagen, keine native Konvention; sie bricht die abgerundete Silhouette des Elements und fügt einer Spalte, die sich bereits am Text ausrichtet, eine zweite, konkurrierende Kante hinzu.

Unterscheide bei destruktiven Aktionen zwischen umkehrbarer und unumkehrbarer Arbeit. Bevorzuge Rückgängig oder eine temporäre Benachrichtigung für umkehrbare Änderungen. Verwende einen [`AlertDialog`](../elements/alert-dialog.md), wenn die Folge schwerwiegend und nicht rückgängig zu machen ist; nenne im Bestätigungstext das konkrete Objekt und die Folge.

<a id="pointer-conventions"></a>

### Zeigerkonventionen

Verwende den Standardcursor für Buttons, Checkboxen, Menüeinträge, Tabs und andere Steuerelemente. Verwende eine zeigende Hand (`cursor-pointer`) für Links und Inhalte, die sich wie ein Link verhalten. Verwende Text-, Größenänderungs-, Greif- und Verboten-Cursor nur, wenn sie die aktive Manipulation beschreiben. Ein Cursor verstärkt eine Affordanz; er ersetzt weder den sichtbaren Zustand noch die zugängliche Rolle des Steuerelements.

Halte Hover-Effekte dezent, da Touch-, Tastatur- und Barrierefreiheits-Interaktion keinen Hover kennen. Blende die einzige Kopie einer destruktiven oder wesentlichen Aktion nicht erst beim Hover ein. Kontextbezogene Zeilenaktionen dürfen im Ruhezustand zurückhaltender sein, wenn dieselben Befehle weiterhin über Auswahl, Tastatur oder ein Kontextmenü verfügbar sind.

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### Befehlsoberflächen gegenüber Hover-Symbolleisten bevorzugen

Wähle anhand von Häufigkeit und Geltungsbereich eines Befehls, wo die Aktion liegt:

- halte die primäre oder häufige Aktion als beschriftete Schaltfläche oder vertrautes Symbolleisten-Steuerelement sichtbar;
- lege sekundäre Aktionen für den aktuellen Bereich hinter einen sichtbaren [`Menu`](../elements/menu.md)-Auslöser;
- lege Befehle, die auf das Objekt unter dem Zeiger oder Finger wirken, in ein `ContextMenu`: ein Rechtsklick auf Desktops, ein gehaltener Finger auf Touchscreens;
- biete denselben wichtigen Befehl über ein Tastenkürzel an ([`keymap`](../modules/nsh.md#keymap)), wenn er eine natürliche Tastaturform hat, sowie im Anwendungsmenü (`Menu.setApplicationMenu` von [`nsh/desktop`](../modules/nsh-desktop.md));
- verwende ein beim Hover eingeblendetes Icon nur als Abkürzung zu einem Befehl, der anderswo weiterhin erreichbar bleibt.

Das ist mehr als eine visuelle Vorliebe. Die Menüs von `nsh/base` übernehmen bereits die Platzierung am Auslöser, kaskadierende Untermenüs auf Desktops und ein Sheet mit direkt eingebetteten Untermenüs auf Smartphones, das Schließen durch Auswahl eines Eintrags, einen Klick außerhalb, Escape oder Zurück sowie die Rollen „menu“ und „menu item“ für Screenreader. Eine eigene Leiste mit Hover-Buttons muss diese Verhalten nachbauen und ist für Touch, reine Tastaturbedienung und viele Workflows mit assistiven Technologien unsichtbar.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, theme};
use nsh_core::{color::black, element::StyleRefinement};

/// The app's popup surface, shared by its menus, popovers and tooltips.
fn popup(s: StyleRefinement) -> StyleRefinement {
    s.min_w(px(192.0))
        .p_1()
        .rounded(move || theme().radius)
        .border_1()
        .border_color(move || theme().border)
        .bg(move || theme().popover)
        .shadow_lg()
}

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded(move || theme().radius)
        .hover(|s| s.bg(move || theme().muted))
        .active(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || theme().foreground))
}

fn more_menu(rename: impl Fn() + 'static, duplicate: impl Fn() + 'static, delete: impl Fn() + 'static) -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .popup_style(popup)
        .backdrop_style(|s| s.bg(black().opacity(0.5)))
        .trigger(
            view()
                .label("More actions")
                .size(px(44.0))
                .items_center()
                .justify_center()
                .rounded_full()
                .active(|s| s.bg(move || theme().muted))
                .child(text("⋯").text_color(move || theme().foreground)),
        )
        .child(item("Rename…", rename))
        .child(item("Duplicate", duplicate))
        .child(menu_separator().h(px(1.0)).my_1().bg(move || theme().border))
        .child(item("Delete…", delete))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator } from "nsh/base";

/** The app's popup surface, shared by its menus, popovers and tooltips. */
export const popup = "min-w-48 rounded-(--radius) border border-border bg-popover p-1 shadow-lg";
const item = "rounded-(--radius) px-3 py-2 hover:bg-muted active:bg-muted";

function MoreMenu(props: { onRename: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      offset={4}
      popupClass={popup}
      backdropClass="bg-black/50"
      trigger={
        <View accessibilityLabel="More actions" class="size-11 items-center justify-center rounded-full active:bg-muted">
          <Text class="text-foreground">⋯</Text>
        </View>
      }
    >
      <MenuItem onSelect={props.onRename} class={item}><Text class="text-foreground">Rename…</Text></MenuItem>
      <MenuItem onSelect={props.onDuplicate} class={item}><Text class="text-foreground">Duplicate</Text></MenuItem>
      <MenuSeparator class="my-1 h-px bg-border" />
      <MenuItem onSelect={props.onDelete} class={item}><Text class="text-foreground">Delete…</Text></MenuItem>
    </Menu>
  );
}
```

Wähle `Menu`, wenn Benutzer einen sichtbaren Hinweis brauchen, dass weitere Befehle existieren – zum Beispiel bei einem Symbolleisten-Überlauf, Dokumentaktionen oder einem Kontomenü. Wähle `ContextMenu` für auswahl- oder objektbezogene Befehle wie Umbenennen, Duplizieren, Anzeigen oder Entfernen. Das Kontextmenü darf nicht der einzige Weg sein, einen wesentlichen Befehl auszuführen; biete je nach Bedarf einen Pfad über die Menüleiste, die Symbolleiste, die Tastatur oder die Detailansicht an.

Lege nicht jede Aktion in ein Menü, nur damit ein Bildschirm minimalistisch aussieht. Auffindbarkeit und Geschwindigkeit zählen: Die Hauptaktion bleibt sichtbar, gefährliche Einträge bleiben klar beschriftet und abgesetzt, und ein Menüeintrag sollte überall, wo er erscheint, dasselbe Verb, dasselbe Icon, dasselbe Tastenkürzel, denselben Aktivierungszustand und dasselbe Ergebnis haben.
<a id="button-means-application-action-link-means-external-resource"></a>

### Button steht für eine Anwendungsaktion, Link für eine externe Ressource

Verwende einen `Button`, wenn die Aktivierung den Anwendungszustand ändert, eine Entscheidung bestätigt, ein Werkzeug öffnet, Daten absendet oder einen Befehl ausführt. Wähle die Darstellung nach der lokalen Hierarchie:

- Primary-Button für die eine hervorgehobene Festlegung in einem Entscheidungsbereich;
- Default-Button für gewöhnliche, sichtbare Aktionen;
- Outline-Button, wenn eine Aktion eine klare Begrenzung bei geringerer Betonung braucht;
- Ghost-Button für vertraute, zurückhaltende Aktionen in Symbolleisten und im Fließtext;
- Icon-Button nur für ein allgemein bekanntes Symbol, mit einem zugänglichen Namen und einem Tooltip, wenn Bedeutung oder Geltungsbereich unklar sind.

Vergib Primary nicht, nur weil ein Button die einzige Aktion auf dem Bildschirm ist, weil er oben rechts steht oder weil das Team mehr Klicks haben möchte. Primary vermittelt die voreingestellte Festlegung und das Tastaturverhalten. Ist die Aktivierung lediglich ein gewöhnlicher Befehl wie das Hinzufügen eines Eintrags, das Öffnen eines Werkzeugs oder das Aktualisieren einer Ansicht, verwende je nach lokaler Hierarchie einen Default-, Outline- oder Ghost-Button.

Verwende einen unterstrichenen Link (`role="link"`) nur für ein externes Ressourcenziel: eine URL, eine Webseite, eine Online-Dokumentation oder eine E-Mail-Adresse. Er verwendet den Zeigefinger-Cursor, weil sein Vertrag darin besteht, den aktuellen Anwendungskontext in Richtung dieser Ressource zu verlassen. Verwende keine Link-Optik, um einen funktionalen Befehl unauffällig wirken zu lassen. Eine als Link gestaltete Aktion wie Löschen, Speichern, Aktualisieren, Hinzufügen, Menü öffnen oder die Navigation innerhalb der App verbirgt die Affordanz des Steuerelements und stellt die falsche Accessibility-Rolle bereit.

„Ansehen“ macht ein Ziel innerhalb der App nicht zu einem Link. Ein vollständiger Bericht, eine Analyse, ein Detailbereich oder ein lokaler Datensatz öffnet sich weiterhin über einen Button, eine Zeile, eine Karte, einen Tab oder ein Disclosure-Steuerelement. Verwende knappe, kontextbezogene Beschriftungen wie `Full analysis`, wenn die umgebende Karte bereits festlegt, was sich öffnet; reserviere die Unterstreichung für eine Ressource, die sich tatsächlich in einem Browser oder E-Mail-Programm öffnet.

Jede interne Navigation – Seitenleistenzeilen, Tabs, Breadcrumbs, Listeneinträge, das Öffnen einer lokalen Ansicht oder der Wechsel zwischen Arbeitsbereichen – muss den Navigation-Stack, einen `Button` oder die entsprechende Komponente verwenden. Visuelle Betonung wird über die Variante des Buttons oder den ausgewählten Zustand der Navigationskomponente festgelegt, niemals durch falsche Semantik.

<a id="feedback-and-overlays"></a>

## Feedback und Overlays

Wähle die kleinste Oberfläche, die zur Entscheidung passt:

- Tooltip: eine kurze Erklärung oder ein Tastenkürzel ([`Tooltip`](../elements/tooltip.md) oder das `tooltip` eines beliebigen Elements);
- Popover: kontextbezogene Steuerelemente, die die Aufgabe nicht unterbrechen ([`Popover`](../elements/popover.md));
- Menü: eine kompakte Liste von Aktionen ([`Menu`](../elements/menu.md));
- Benachrichtigung: asynchroner Status, der keine Entscheidung erfordert;
- Dialog: eine fokussierte Entscheidung oder ein kurzes Formular ([`Dialog`](../elements/dialog.md));
- Alert-Dialog: ausdrückliche Bestätigung einer folgenreichen Aktion ([`AlertDialog`](../elements/alert-dialog.md));
- Sheet: ergänzende Arbeit, die von dauerhafterem Platz profitiert ([`Sheet`](../elements/sheet.md)).

Jedes dieser Elemente nimmt die Form an, die das jeweilige Gerät erwartet, und zwar aus einer einzigen Struktur, die die App gestaltet (`popupClass`, `backdropClass`):

| | Desktop | Smartphones und Tablets |
| --- | --- | --- |
| `Tooltip` | nachdem der Zeiger auf dem Element verweilt | nur, wenn die App ihn öffnet |
| `Popover` | verankert; ein Klick außerhalb schließt es und wird weitergegeben | verankert; ein Tippen außerhalb schließt es nur |
| `Menu` | ein Popup am Auslöser, kaskadierende Untermenüs | ein Sheet am unteren Rand; ein Untermenü ersetzt dessen Einträge |
| `ContextMenu` | die sekundäre Maustaste, am Zeiger | ein gehaltener Finger öffnet das Sheet |
| `Sheet` | ein Seitenpanel über einem Backdrop | dasselbe |
| `AlertDialog` | ein Alert im Dialogstil der Plattform | der Alert oder Action Sheet des Systems |

Ein Tooltip liefert fehlende Bedeutung; er wiederholt keine offensichtliche Aktion. Reserviere ihn für ein unbekanntes Symbol, einen unklaren Geltungsbereich oder ein nützliches Tastenkürzel, das sonst verborgen bliebe. Wiederkehrende, erkennbare Befehle wie Kopieren und Herunterladen in der Fußzeile einer Nachricht benötigen zugängliche Namen und Tastaturzugriff, aber ihre Hover-Beschriftungen stören eher, als dass sie Klarheit schaffen. Auf Smartphones erscheint ein Tooltip nur, wenn die App ihn öffnet; ein Tooltip darf deshalb niemals Informationen enthalten, die Touch-Nutzer benötigen.

Ein Alert unterbricht die visuelle Hierarchie, auch wenn er kein Modal öffnet. Verwende ihn für wichtige, außergewöhnliche Informationen, die in der aktuellen Aufgabe Aufmerksamkeit erfordern, nicht als dekorierten Container für gewöhnliche Beschreibungen, Tipps oder leeren Raum. Bevorzuge Inline-Hilfe, abgeschwächten Text oder einen normalen Abschnitt, wenn der Inhalt weder sofortige Beachtung noch eine Aktion erfordert.

Vermeide gestapelte Overlays. Escape und die Zurück-Taste von Android schließen die oberste schließbare Ebene; halte den Zustand der App über `onOpenChange` synchron und setze den Fokus auf den Auslöser oder das nächste logische Ziel zurück.

Eine Overlay-Aktion muss sich auf ein Objekt oder einen Zustand beziehen, den das Overlay tatsächlich zeigt. Blende beispielsweise `Clear history` nur ein, wenn ein eigener Abschnitt mit dem Verlauf sichtbar ist und Einträge enthält. Suchergebnisse, zuletzt verwendete Elemente und Favoriten sind unterschiedliche Sammlungen; beschrifte und trenne sie, statt sie in einer unerklärten Liste zu vermischen. Blende eine nicht anwendbare Aktion aus oder deaktiviere sie mit einer hilfreichen Begründung – platziere kein mehrdeutiges Papierkorb-Symbol in einer Fußzeile.

Der Platz in der Fußzeile ist kein Sammelbecken für Funktionen, die im Entwurf keinen Platz fanden. Eine Fußzeile darf Tastenkürzel, Status oder Aktionen zeigen, die für die gesamte Oberfläche gelten, aber jeder Eintrag muss beantworten: Was ist sein Objekt, warum ist er jetzt verfügbar, welchen Geltungsbereich betrifft er und welcher sichtbare Zustand ändert sich nach der Aktivierung?

<a id="motion"></a>

## Animation

Animation erklärt Veränderung; sie ist keine Ambient-Dekoration. Verwende kurze Übergänge für Einblenden, Ausblenden, Aufklappen und räumliche Kontinuität. Vermeide es, große Layoutänderungen zu animieren, wenn Opazität oder Transformation dieselbe Beziehung vermitteln. Beachte die Einstellungen zur reduzierten Bewegung (`motion-reduce:`, `reduceMotion()`), verlange niemals eine Animation, um einen Zustand zu verstehen, und füge nicht jeder Komponente standardmäßig eine Animation hinzu.

```rust tabs
view()
    .on_press(open)
    .transition_transform()
    .duration(150.0)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.97)))
```

```tsx tabs
<View onPress={open} class="transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100" />
```

Die Animationsrichtlinie gehört zur Anwendungsschicht. `nsh/base` besitzt den Lebenszyklusmechanismus oder die Geometrie, die für einen Übergang nötig sind, entscheidet aber nicht, dass jedes Produkt ein- und ausblendet oder gleitet. Gib unabhängig animierten Werten eine stabile Identität und lass eine Unterbrechung sanft vom aktuell abgetasteten Wert aus umkehren, statt von einem alten Endpunkt neu zu starten.

Animation folgt der Kontinuität der Interaktion. Solange sich ein Zeiger oder eine Scrollposition zwischen verwandten Zielen bewegt, halte die Vorschaufläche stabil und aktualisiere ihren Inhalt oder ihre Position an Ort und Stelle. Schließe sie erst, wenn die Interaktion endet; wiederholtes Ausblenden und erneutes Einblenden bei jeder Aktualisierung wirkt wie Flackern.

<a id="designing-data-heavy-interfaces"></a>

## Datenintensive Oberflächen gestalten

Dicht bedeutet nicht beengt. In Tabellen, Bäumen, langen Listen und Editoren gilt:

- Halte Kopfzeilen und die primäre Zeilenidentität visuell stabil.
- Richte vergleichbare Werte aus und verwende, wo sinnvoll, tabellarische Ziffern.
- Unterscheide Fokus, Hover, aktive Zeile und Mehrfachauswahl.
- Halte Sortierung und Filterung sichtbar und umkehrbar.
- Bewahre die Auswahl über die Domänenidentität, auch beim Filtern und Umsortieren.
- Virtualisiere große Sammlungen (`List`), ohne die Tastatursemantik zu ändern.
- Nutze Progressive Disclosure für sekundäre Spalten und Inspektoren.
- Biete einen nützlichen Leerzustand, der die nächste Aktion erklärt.

Wähle eine Tabelle für den Vergleich über einheitliche Felder, eine Liste zum Überfliegen uneinheitlicher Einträge und einen Baum für echte Hierarchie. Verwende kein komplexes Datenlayout als reinen Stil.

<a id="interface-language"></a>

## Sprache der Oberfläche

Worte sind Teil der Interface-Architektur. Schreibe das Vokabular eines Features als System – Ziele, Objekte, Befehle, Zustände und Ergebnisse –, nicht als isolierte Übersetzungen von Implementierungsmerkmalen. Bevorzuge die kürzeste Formulierung, die im tatsächlichen Kontext zutreffend bleibt.

<a id="let-context-carry-context"></a>

### Den Kontext den Kontext tragen lassen

Wiederhole keine Informationen, die die umgebende Oberfläche bereits festlegt. Ein Ziel in der Seitenleiste ist meist das Objekt oder die Domäne selbst: Verwende `Users`, nicht `User Management`; `Shortcuts`, nicht `Shortcut Configuration Management`. Eine Spalte, deren Zeilen bereits Aktionen enthalten, kann auf eine generische Überschrift `Operation` verzichten. Ein Dialog mit dem Titel `Delete “Roadmap”?` braucht keinen Fließtext, der dieselbe Frage noch einmal stellt.

Das ist Kontextökonomie, nicht Streichen um des Streichens willen. Ergänze Text, wenn er die Entscheidung verändert: wenn er den betroffenen Geltungsbereich benennt, eine nicht umkehrbare Folge, eine ungewöhnliche Voraussetzung oder einen Weg zur Wiederherstellung. Jedes zusätzliche Wort soll eine Frage beantworten, die das aktuelle Layout nicht schon beantwortet.

Verwende Substantive für Ziele und Objekte (`Users`, `Appearance`, `Orders`), Verben für Befehle (`Save`, `Duplicate`, `Export`) und Adjektive oder kurze Wendungen für Zustände (`Offline`, `Up to date`, `Pending review`). Vermeide Umschreibungen wie `Management`, `Module`, `Page`, `Function`, `Operation` und `System`, es sei denn, das Wort unterscheidet ein echtes Domänenkonzept.

<a id="write-each-language-do-not-translate-its-shape"></a>

### Jede Sprache eigens schreiben, nicht ihre Form übersetzen

Beginne mit gemeinsamer Absicht, Hierarchie und Terminologie und forme dann jede Locale als natürliche Oberflächensprache. Bewahre nicht die Wortstellung, die Wortanzahl, Höflichkeitsfüllwörter oder die grammatische Kategorie der Ausgangssprache. Das englische `Users` kann ein chinesisches Funktionskonzept ausdrücken, das wörtlich zu „Benutzerverwaltung“ ausgeschrieben würde; Treue bedeutet, den Zweck zu bewahren, nicht die Token.

Entferne Wörter, die die umgebende Informationsarchitektur bereits liefert. Innerhalb einer `Settings`-Oberfläche lautet ein Ziel oft einfach `Account`, nicht `Account Settings` und niemals der unnatürliche Singular `Account Setting`. Die richtige englische Beschriftung ergibt sich aus ihrer Rolle und ihren Nachbarn, nicht aus der isolierten Ausgangsphrase.

Pflege ein kleines Produktlexikon für wiederkehrende Objekte, Befehle und Zustände. Verwende denselben Begriff in der Symbolleiste, im Menü, im Kontextmenü, im Dialog, in der Tastenkürzelsuche und in der Dokumentation, es sei denn, der Kontext verändert seine Bedeutung tatsächlich. Prüfe Texte in der gerenderten Oberfläche: Benachbarte Beschriftungen offenbaren oft Wiederholungen oder uneinheitliche Geltungsbereiche, die eine Locale-Datei nicht zeigt.

Bewahre in lokalisierten technischen Texten einen etablierten Framework-Begriff, wenn eine Übersetzung weniger präzise wäre. Behalte API-Bezeichner in ihrer Originalform und formatiere sie als Code. Behalte gewöhnliche Fremdwörter nicht allein deshalb bei, damit der Text technisch klingt. Erkläre einen beibehaltenen Begriff bei der ersten Verwendung, wenn nötig, und verwende danach in Oberfläche, Dokumentation und API-Beispielen durchgängig dieselbe Form.

Verwende in der Dokumentation für eine benannte API, Komponente, Quelldatei oder einen Leitfaden im Linktext den exakten englischen Namen, auch auf lokalisierten Seiten. Schreibe zum Beispiel `View`, `Button`, `Menu` und `Text`, statt ihre Namen zu übersetzen oder ein überflüssiges Präfix `NSH` voranzustellen. Formuliere die umgebenden Erklärungen in der Sprache der Seite. Verlinke nur das benannte Ziel; Wörter wie „Quelle“ stehen außerhalb des Links, wenn sie beschreiben, warum darauf verwiesen wird.

Behalte in einer technischen Vergleichstabelle, die über mehrere Locales hinweg geteilt wird, Fähigkeitsnamen, Framework-Namen, API-Namen und Modellnamen in ihrer etablierten englischen Form. Übersetze die Erklärung rund um die Tabelle, nicht ihre technischen Beschriftungen. Gängige Oberflächenwörter mit etablierter lokaler Bezeichnung dürfen außerhalb dieses Vergleichskontexts weiterhin lokalisiert werden.
<a id="buttons-and-confirmation-dialogs"></a>

### Schaltflächen und Bestätigungsdialoge

Schaltflächenbeschriftungen sind standardmäßig kurz – meist ein oder zwei Wörter – und beschreiben das Ergebnis, nicht die Geste oder die Komponente.
Bevorzuge `Save`, `Move` oder `Delete` gegenüber `Click to save`, `Perform move` oder `Confirm deletion`. Verwende `Cancel` konsistent
für die Aktion, die den Dialog verlässt, ohne etwas zu übernehmen. Reserviere `OK` für die Kenntnisnahme rein informativer Inhalte.

Kurz ist ein Standardwert, keine Zeichenbegrenzung. Eine bewusst längere Beschriftung ist besser, wenn ihre Wörter eine Konsequenz offenlegen
oder Optionen unterscheiden, die Nutzer sonst verwechseln könnten, zum Beispiel `Delete from this group` gegenüber `Delete
everywhere`, or `Restart without saving`. Länge muss entscheidungsrelevante Information liefern; sie darf den Titel
oder den Text des Dialogs nicht wiederholen.

Verwende als Bestätigungsbeschriftung möglichst das spezifischste knappe Ergebnis:

| Kontext | Schwach | Besser |
| --- | --- | --- |
| Löschdialog | `Yes`, `Sure`, `Confirm deletion` | `Delete` |
| Nicht gespeicherte Änderungen | `Confirm`, `Yes` | `Discard changes` |
| Reine Kenntnisnahme | `Confirm operation` | `OK` oder `Done` |
| Komplexe Zustimmung, deren Ergebnis kein klares Verb hat | `Yes` | `Confirm` |

`Confirm` ist eine nützliche Rückfalloption, wenn der umgebende Dialog eine komplexe Verpflichtung vollständig benennt und kein kürzeres Ergebnisverb zutrifft. Es sollte keinen klaren Befehl ersetzen. `Sure` ist umgangssprachlich und kein stabiler englischer Befehl und
ist zu mehrdeutig für das Standardvokabular.

Ein Bestätigungsdialog sollte eine kompakte Entscheidung bilden:

- Titel: die Entscheidung oder Bedingung, etwa `Delete “Roadmap”?`;
- Text: nur neuer Umfang, neue Konsequenzen oder Informationen zur Wiederherstellung;
- Aktionen: `Cancel` und das Ergebnis, etwa `Delete`;
- destruktive Gestaltung: wird auf das destruktive Ergebnis angewendet (eine `AlertDialog`-Aktion mit der `destructive`-Rolle), ersetzt aber keine präzise Formulierung.

Vermeide generische Titel wie `Notice`, `Warning`, `Error` und `Confirmation`, wenn sich die tatsächliche Bedingung benennen lässt.
Vermeide Ritualphrasen wie „Sind Sie sicher, dass Sie …", „Möchten Sie …", „Bitte beachten Sie, dass …" und
„erfolgreich", wenn Struktur oder Zustand dies bereits vermitteln. Höflichkeit soll aus einem ruhigen, respektvollen
Ton entstehen, nicht aus wiederholtem `please`.

<a id="capitalization-punctuation-and-symbols"></a>

### Groß- und Kleinschreibung, Interpunktion und Symbole

Verwende für englische UI standardmäßig Satzschreibweise (sentence case): `Reset layout`, nicht `Reset Layout` oder `RESET LAYOUT`. Eigennamen
und etablierte Akronyme bleiben erhalten. Folge einer Plattformkonvention, etwa Title Case für native Menübefehle, nur dann, wenn die
Plattformintegration davon profitiert, und wende sie innerhalb der Komponentenklasse konsistent an.

Versalien (ALL CAPS) können zurückhaltend als typografische Hervorhebung für sehr kurze Abschnittsbezeichnungen, Eyebrows, Status, etablierte
Akronyme und code-ähnliche Bezeichner dienen. Ihre kompakte Form und die gemessene Laufweite können eine Ebene ähnlich der Fettschrift bilden, doch
sie gehören nicht auf Schaltflächen, in lange Überschriften, Sätze oder dichte Listen. Kombiniere nicht Versalien, kräftige Farbe und
fette Schrift im selben Bereich, und wandle nicht automatisch jeden String um: Produktnamen, Akronyme und
lokalisierte Inhalte müssen ihre vorgesehene Schreibweise behalten.

Beschriftungen, Schaltflächen, Menüeinträge, Tabs, Überschriften, Platzhalter und kurze Status erhalten keinen abschließenden Punkt. Vollständige
erklärende Sätze, Warnungen und Fehlermeldungen erhalten ihn. Vermeide Ausrufezeichen in routinemäßigen Erfolgs- und Fehlermeldungen. Im
Chinesischen werden in Sätzen vollbreite Satzzeichen verwendet, und bei kurzen Steuerelementbeschriftungen entfällt das abschließende Satzzeichen nach derselben
semantischen Regel.

Verwende das einzelne Auslassungszeichen (`…`), nicht drei Punkte. Hänge es an jede Schaltfläche und jeden Menüeintrag an, die einen Dialog,
ein Sheet oder ein separates Fenster öffnen, sowie an Befehle, die weitere Eingaben oder Auswahlen benötigen, bevor sie abgeschlossen werden können, etwa
`Settings…` oder `Export…`. Ein sofort ausgeführter Befehl erhält kein Auslassungszeichen. Verwende einen unbestimmten Fortschrittsindikator
und keine dekorativen Punkte, um laufende Arbeit zu zeigen.

Fehlermeldungen sollten sagen, was passiert ist, und wenn sinnvoll die nächste Aktion zur Wiederherstellung. Erfolgsrückmeldungen sollten den resultierenden Zustand nur benennen,
wenn dieser nicht bereits sichtbar ist. Bevorzuge `Couldn’t save. Check your connection and try again.` gegenüber einem
technischen Code oder einer langen Entschuldigung; lass einen `Saved successfully`-Toast weg, wenn das Dokument sichtbar als gespeichert gilt.

<a id="internationalization-and-platform-fit"></a>

## Internationalisierung und Plattformpassung

Namen und Beschriftungen für Barrierefreiheit (A11y) dürfen auf Englisch bleiben; eine Lokalisierung dieser Strings ist nicht erforderlich. Behalte
die eigene Beschriftung des Elements bei, wenn du ein Steuerelement benennst, das darauf wirkt, auch wenn diese Beschriftung lokalisiert ist. Diese Ausnahme gilt
nicht für sichtbare UI-Texte.

Texte müssen Längenzuwachs, CJK-Typografie, Rechts-nach-links-Schriften und unterschiedliche Tastenkürzel-Notationen überstehen. Dimensioniere kein
Steuerelement anhand einer einzigen englischen Beschriftung. Halte Text aus Rastergrafiken heraus, vermeide das Zusammensetzen übersetzter Fragmente, und lass
Beschriftungen nur dort umbrechen oder abschneiden, wo das Produkt einen Weg zur Wiederherstellung definiert, etwa einen Tooltip.

Respektiere Plattformunterschiede, die Bedeutung tragen: Command versus Control, native Fensterdekorationen, Systemdarstellung, Scrollbar-Verhalten, Menüs, Benachrichtigungsfunktionen und auf Smartphones der System-Header, die Zurück-Geste und
Alerts. Halte die Informationsarchitektur des Produkts plattformübergreifend stabil, aber lösche vertrautes Plattformverhalten nicht
zugunsten oberflächlicher Pixelgleichheit.

NSH-Apps laufen auf Smartphones, Tablets, Desktops und im Web, oft innerhalb einer Host-App. Gestalte für jede dieser Umgebungen:

- **System-UI behält das Aussehen der Plattform.** Unter iOS und Android ist der Header einer Seite der des Systems (`NavPage`: `title` und
  Header-Optionen); auf Desktops und im Web wird der `header`-Slot der Seite angezeigt, den die App zeichnet. Gib jeder Seite beides
  ([Navigation](./navigation.md#navpage-and-the-header)). Bestätigungen verwenden `AlertDialog`; die Statusleiste folgt der
  obersten Seite oder dem obersten Dialog (`statusBar`).
- **Das Theme des Hosts.** Einer eingebetteten App kann das Theme ihres Hosts übergeben werden; Klassen und Rust-Bindings, die Tokens lesen,
  folgen ihm nativ ([Theme tokens](./tailwind.md#theme-tokens)).
- **Safe Areas und die Tastatur.** Halte Inhalte innerhalb der Safe Area (`env(safe-area-inset-*)`, `safeAreaInsets()`) und Eingabefelder
  oberhalb der Software-Tastatur (`env(keyboard-inset-height)`) ([Device and environment](./device-and-environment.md)).
- **Darstellung, Textgröße und Bewegung.** Jede Oberfläche funktioniert im hellen und dunklen Modus (`dark:`, `colorScheme()`), mit der
  Textgröße des Nutzers und mit reduzierter Bewegung (`motion-reduce:`, `reduceMotion()`).
- **Rechts nach links.** Die Layoutrichtung folgt der Locale, und der Stil `direction` legt sie für eine View und ihren
  Teilbaum fest; Start- und End-Eigenschaften werden gespiegelt ([Right to left](./layout.md#right-to-left)).
- **Touch und Zeiger.** Touch-Ziele sind mindestens 44 × 44 Punkte groß; Hover und Tooltips gibt es nur mit einem Zeigegerät.

```rust tabs
use nsh_base::nav_page;

nav_page()
    .title("Inbox")
    .header(page_header("Inbox"))
    .child(inbox())
```

```tsx tabs
import { NavPage } from "nsh/base";

<NavPage title="Inbox" header={<PageHeader title="Inbox" />}>
  <Inbox />
</NavPage>
```

<a id="guidance-for-ai-generated-interfaces"></a>

## Leitlinien für KI-generierte Oberflächen

Eine KI, die eine NSH-Oberfläche ändert, sollte zunächst das nächstgelegene Feature, die Komponenten und Theme-Tokens der App sowie
die Komponentendokumentation und -deklarationen (`.nsh/types`) prüfen. Sie sollte vor dem Generieren von Code die Hauptaufgabe, den Besitzer des Zustands, die
Komposition der Komponenten sowie Tastatur- und Touch-Pfade benennen. Sie darf eine API nicht aus Beispielen für React, React Native
oder Shadcn ableiten oder eine NSH-Prop oder -Methode erfinden, nur weil der Name plausibel klingt; `nsh check` und die Klassenprüfung des Builds
melden, was nicht existiert.

KI-Ausgabe ist unvollständig, bis ein Mensch erklären kann, warum Hierarchie, Dichte, Komponentenwahl und ausnahmsweise
verwendete Literalwerte zu diesem Produkt gehören. Ein optisch plausibler Screenshot ist kein Beweis: Tastatur- und Touch-Verhalten,
Fokus, dynamische Inhalte, Themes, Größenänderung, Textgröße und Fehlerzustände sind Teil des Designs.

<a id="accessibility-checklist"></a>

## Checkliste für Barrierefreiheit

Prüfe vor dem Abschluss eines Screens, dass:

- jede Aktion per Tastatur, Touch und Screenreader erreichbar und bedienbar ist;
- die Fokusreihenfolge der visuellen Reihenfolge und der Aufgabenreihenfolge folgt;
- der Fokus sichtbar bleibt und nach Overlays wiederhergestellt wird;
- Steuerelemente barrierefreie Namen haben; reine Icon-Steuerelemente Tooltips verwenden, wenn ihre Bedeutung, ihr Umfang oder ihr Tastenkürzel
  eine Erklärung braucht;
- Text und aussagekräftige Begrenzungen ausreichend Kontrast haben;
- Status nicht allein durch Farbe vermittelt wird;
- deaktivierte und schreibgeschützte Zustände unterscheidbar sind;
- Beschriftungen, Fehlermeldungen und Beschreibungen in der Nähe ihrer Steuerelemente bleiben;
- Inhalte mit längeren Übersetzungen, Rechts-nach-links-Layout und größerem Text nutzbar bleiben;
- Touch-Ziele mindestens 44 × 44 Punkte groß sind und Zeigerziele auch in einem dichten Layout angenehm groß sind.

<a id="design-review-checklist"></a>

## Checkliste für das Design-Review

Ein Review inventarisiert keine Komponenten; es beurteilt, ob die Oberfläche die richtigen Entscheidungen getroffen hat. Frage der Reihe nach:

1. **Ist die Aufgabe klar?** Kann ein neuer Nutzer Zweck, Hauptaktion und nächsten Schritt erkennen, ohne zu lernen,
   zu raten oder zu experimentieren?
2. **Hält jede Aktion ihr Versprechen?** Beschreiben Beschriftung, Steuerelement, Zustand, Umfang, Rückmeldung und Ergebnis ein
   und dasselbe konsistente Resultat?
3. **Ist die Hierarchie entschieden und zurückhaltend?** Erhält das Kernfeature den Raum, den es verdient, während kräftige Farbe,
   fette Schrift, Badges, Alerts und primäre Schaltflächen knapp bleiben?
4. **Könnte die Oberfläche weniger tun, dafür besser?** Lässt sich ein Einstiegspunkt, eine Option oder ein Zustand entfernen, zusammenführen oder verschieben,
   ohne die vollständige Aufgabe zu schwächen?
5. **Ist die Struktur exakt?** Teilen gleichrangige Elemente Ausrichtungsachsen, bleiben gleiche Abstände bis auf das gerenderte Pixel gleich, und
   sitzen Scrollbars am Rand ihres tatsächlichen Scrollbereichs?
6. **Folgt sie dem Komponentensystem?** Behalten Standardsteuerelemente ihre Geometrie, Zustände, ihr Tastaturverhalten und ihr
   Schließverhalten, wobei das Erscheinungsbild durch Theme- und Skalierungs-Tokens bestimmt wird?
7. **Bleibt sie in jedem Zustand und unter jeder Einschränkung nutzbar?** Prüfe Tastatur-, Touch- und Fokusverhalten,
   Zustände für leer/Laden/Fehler/Berechtigung, längere Übersetzungen, größeren Text, Rechts-nach-links, beide Darstellungen,
   minimale Fenstergröße und reduzierte Bewegung.
8. **Wurde sie auf echten Plattformen getestet?** Schließe die Aufgabe mit echten Komponenten, echten Texten und repräsentativen Inhalten
   auf jeder Plattform ab, für die ausgeliefert wird (`nsh run --target …`, `nsh test --target …`) – nicht nur anhand eines idealen Screenshots.
