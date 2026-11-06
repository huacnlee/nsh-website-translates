---
title: "Leistungsbericht"
description: "Gemessene Werte von NSH-Apps – Commit- und Frame-Kosten aus den Baselines von NSH sowie Bildrate, CPU- und Speicherauslastung der Gallery seitenweise unter Linux, macOS, Windows und iOS – samt Anleitung zur Reproduktion."
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---


# Leistungsbericht

Was NSH-Apps kosten, gemessen. Wie NSH sie schnell hält und wie du die Performance deiner eigenen App misst, steht unter [Performance](./performance.md).

## Baselines

Aus den eigenen Baselines von NSH (Apple Silicon, sofern nicht anders angegeben):

| Szenario | Werte |
|---|---|
| Counter-App, headless (Debug) | Erster Frame ca. 0,5–0,65 ms (58 Ops / 49 Mount-Items); ein Tap ca. 0,15 ms |
| Counter-App, Mac Catalyst (Release) | Erster Frame ca. 1,05–1,15 ms (davon etwa 0,7 ms für das erstmalige Layout von 10 Texten mit CoreText); ein Tap ca. 0,12 ms |
| Gallery-Fotoliste, headless (Debug) | Erster Frame 653 Ops / 224 Nodes, ca. 2,7 ms |
| Scrollen der Fotoliste, Catalyst (Release) | Neues Binden einer Zeile beim langsamen Scrollen ca. 0,4 ms; ein ganzer Bildschirm mit ca. 32 Zeilen bei schnellem Fling 0,9–1,6 ms |
| Scrollen der Fotoliste, Android-Emulator (arm64, Release) | Neues Binden einer Zeile ca. 0,3–0,4 ms (JS ca. 60 µs) |
| Engine-Start (Release) | ca. 75–155 µs; die globalen APIs (`fetch`, `URL`, ...) kosten bis zur ersten Verwendung nichts, danach ca. 90 µs |
| Hot Reload | ca. 120 ms vom Speichern einer Datei bis zur laufenden neuen Version; das Anwenden des Updates 0,2–0,5 ms |

## Linux (GTK 4)

Gemessen auf einem Linux-Desktop (x86_64, 24 Threads, NVIDIA-GPU), Release-Builds, die Gallery in einem Fenster von 1896 × 1030 auf einem
120-Hz-Display, jeder Messwert automatisch erfasst von `examples/gallery/tools/perf.py` (`nsh test --target linux --fps`,
eine Zeile pro Sekunde; die CPU-Last bezieht sich auf den gesamten Prozess, in Prozent eines Kerns). *Frame p95* ist die Zeit des Main-Threads pro gezeichnetem
Frame im 95. Perzentil: Unter 8,3 ms passt ein Frame in einen 120-Hz-Refresh.

<a id="animated-demos"></a>

### Animierte Demos

<div class="data-table">

| Demo | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 22 Live-Sparklines, ein Intraday-Chart, Orderbuch, Tape | 117–120 | 5–6 ms | 25–29 % (1200 × 800), 28–32 % (1896 × 1030) |
| Stocks, das Fenster füllt ein 4K-144-Hz-Display bei 1,6× | 143–145 | 4,1–4,4 ms | 26–29 % |
| Canvas: ein Gauge, eine Uhr, eine Punktmatrix | 120 | 2,6–4,4 ms | 5–10 % |
| Animations: drei native Loops, Springs, Sequenzen | 120 | 2,0 ms | 12–13 % |

</div>

<a id="every-page"></a>

### Jede Seite

Jede Seite der Gallery, beim Öffnen und während der Test sie scrollt, in einem Fenster von 1200 × 800 auf einem 144-Hz-Display (derselben
Maschine). NSH zeichnet nur dann einen Frame, wenn sich auf dem Bildschirm etwas ändert; *FPS* ist hier daher die Rate, solange sich etwas
bewegt: ein Frame pro Median-Abstand zwischen gezeichneten Frames (`perf.py`, `moving`); bei den 144 des Displays folgt jeder Frame einer
Animation oder eines Scrollvorgangs einen Refresh nach dem vorherigen. *Über einem Refresh* ist der Anteil der Frames, die länger
als ein Refresh (6,9 ms) gedauert haben. GIF und WebP bei Images laufen mit ihren eigenen Bildraten (hier etwa 50 FPS), ebenso Video. Physics, Overlays und Menus sind kurz: In 1200 × 800 erreicht ein Scrollvorgang ihr Ende innerhalb weniger Frames, daher werden sie in einem Fenster von 900 × 500 gemessen, in dem sie Platz zum Scrollen haben.

<div class="data-table">

| Seite | Frames stammen von | FPS | Frame p95 | Über einem Refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Live-Daten, native Loops | 144 | 4,1 ms | 0 % | 26 % |
| Stocks, Scrollen | Live-Daten, Scrollen | 144 | 4,1 ms | 0 % | 25 % |
| Photos, Scrollen | Scrollen | 144 | 2,8 ms | 2 % | 9 % |
| Lists, Scrollen | Scrollen | 143 | 1,7 ms | 0 % | 7 % |
| Scrolling, Scrollen | Scrollen | 144 | 1,6 ms | 1 % | 4 % |
| Navigation, Scrollen | Scrollen | 143 | 1,7 ms | 0 % | 2 % |
| Form, Scrollen | Scrollen | 144 | 1,3 ms | 0 % | 4 % |
| Resizable, Scrollen | Scrollen | 143 | 0,6 ms | 0 % | 1 % |
| Dock, Scrollen | Scrollen | 142 | 0,5 ms | 1 % | 1 % |
| Gestures | Springs, ein pulsierender Ring | 144 | 1,6 ms | 0 % | 1–5 % |
| Physics, Scrollen | Scrollen (ein Fenster von 900 × 500) | 144 | 1,6 ms | 1 % | 1 % |
| Animations | Native Loops | 144 | 2,6 ms | 0–1 % | 5 % |
| Canvas, Scrollen | Scrollen, native Loops | 144 | 4,2 ms | 0 % | 1–4 % |
| Styles, Scrollen | Scrollen | 144 | 2,3 ms | 2 % | 3 % |
| Tailwind | `animate-*`-Utilities | 144 | 1,7 ms | 0 % | 3–8 % |
| Text, Scrollen | Scrollen | 144 | 1,9 ms | 0 % | 4 % |
| Text View, Scrollen | Scrollen | 141 | 1,8 ms | 2 % | 7 % |
| Images, Scrollen | Scrollen, GIF- und WebP-Frames | 143 | 2,9 ms | 2 % | 8 % |
| Components, Scrollen | Scrollen | 144 | 1,4 ms | 0 % | 3 % |
| Overlays, Scrollen | Scrollen (ein Fenster von 900 × 500) | 144 | 1,7 ms | 0 % | 2 % |
| Menus, Scrollen | Scrollen (ein Fenster von 900 × 500) | 144 | 1,9 ms | 0 % | 2 % |
| Controls | Übergänge | 144 | 0,9 ms | 0 % | 1–4 % |
| Web and video | Videoframes, die Seite | 135–142 | 1,0 ms | 0 % | 7–8 % |

</div>

<a id="memory"></a>

### Speicher

Im Ruhezustand, 3 s nach dem Start (Release-Runner, ein Fenster von 480 × 640). *Private* ist der Speicher, den allein der Prozess besitzt (USS);
*Resident* addiert die Seiten der Shared Libraries (GTK, der GPU-Treiber), die sich jede GTK-App auf der Maschine teilt:

<div class="data-table">

| App | Renderer | Private (USS) | Resident (RSS) |
|---|---|---|---|
| Rust-App (`nsh init --template rust`) | GL (`ngl`) | ca. 49 MB | ca. 142 MB |
| Rust-App | Cairo (`GSK_RENDERER=cairo`) | ca. 28 MB | ca. 95 MB |
| TSX-Counter (`examples/counter`) | GL | ca. 79 MB | ca. 166 MB |
| GTK-4-Fenster mit einem Label, zum Vergleich | Vulkan / Cairo | ca. 62 / ca. 40 MB | ca. 132 / ca. 109 MB |

</div>

Das erneute Aufrufen einer Seite benötigt keinen zusätzlichen Speicher; beim ersten Besuch einer Seite wächst der Prozess um das, was er bewusst cacht (dekodierte
Bilder, auf 128 MB begrenzt), und um die Bibliotheken, die erst bei der ersten Verwendung geladen werden (WebKitGTK für Web Views).

<a id="app-size"></a>

### App-Größe

Eine Hello-World-App, erzeugt von `nsh init` mit jedem Template, und zwei Apps, die Menschen tatsächlich nutzen, so wie `nsh package --target linux`
sie für x86_64 baut. Der Runner ist die einzige ausführbare Datei der App; das Archiv ist das `.tar.gz`, als das sie ausgeliefert wird. Die Hello
Worlds werden mit Link-Time-Optimierung gebaut und gestrippt (`CARGO_PROFILE_RELEASE_LTO=fat`,
`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`):

<div class="data-table">

| App | Geschrieben in | Runner | Archiv |
|---|---|---|---|
| Hello World (`--template rust`) | Rust | 16,5 MB | 7,5 MB |
| Hello World (`--template ts`) | TSX, auf QuickJS | 25,7 MB | 11,6 MB |
| Hello World (`--template mixed`) | TSX und ein Rust-Crate | 25,8 MB | 11,7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20,9 MB gestrippt | 9,7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22,3 MB | 9,8 MB |

</div>

Die TSX-Runner enthalten die QuickJS-Runtime, die nativen Module und den Renderer; der eigene Code einer App ist ihr Bundle neben
dem Runner, bei einem Hello World unter 1 KB.

Was diese Zahlen ausmacht:

- **Der Renderer**: Unter dem NVIDIA-Treiber zeichnet NSH mit dem GL-Renderer von GSK, dessen Frames dort nur einen Bruchteil dessen kosten, was der Vulkan-
  Renderer braucht (die Animations-Demo: ca. 1 ms Zeichenzeit pro Frame statt ca. 9,5 ms). `GSK_RENDERER` hat weiterhin das letzte Wort.
- **Canvas-Rasters**: Jeder Canvas wird einmal in 256-px-Kacheln gerastert, die auf der GPU bleiben. Ein animierter Wert zeichnet nur
  den Bereich neu, den die Operationen abdecken, die ihn lesen, über den beibehaltenen Pixeln des statischen Teils der Zeichnung; ein Canvas außerhalb des Sichtbereichs
  wartet, bis er in den Sichtbereich scrollt.
- **Pfade einmal beiseitegelegt**: `fillRect` und `fillText` nach einem langen Pfad lassen ihn an Ort und Stelle, bis er erneut verwendet wird (eine
  Linie mit 400 Punkten, dann 240 Balken: 0,63 ms).

## macOS (AppKit)

Gemessen auf einem MacBook Pro (Apple M3, 24 GB) mit dem integrierten 120-Hz-ProMotion-Display, Release-Builds, die Gallery in
einem Fenster von 1200 × 800, jeder Messwert automatisch erfasst von `examples/gallery/tools/perf.py` (`nsh test --target macos
--fps`, eine Zeile pro Sekunde; die CPU-Last bezieht sich auf den gesamten Prozess, in Prozent eines Kerns, die GPU auf ihren Anteil an der GPU). Die Phasen sind
die des Main-Threads pro Frame: *tick* (die nativen Animationen des Display Links) und *canvas* (das Abspielen von Zeichnungen).

<a id="animated-demos-1"></a>

### Animierte Demos

<div class="data-table">

| Demo | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 22 Live-Sparklines, ein Intraday-Chart, Orderbuch, Tape | 120 | 2,7–3,7 ms | 33–36 % | 18–22 % |
| Canvas: ein Gauge, eine Uhr, eine Punktmatrix | 119–120 | 0,6–0,7 ms | 4–7 % | 0 % |
| Animations: drei native Loops, Springs, Sequenzen | 119–120 | 0,3–1,6 ms | 5–8 % | 0 % |

</div>

Bei Stocks beträgt die Main-Thread-Zeit eines Frames ca. 1,6 ms für Ticks, wovon ca. 0,45 ms auf das Abspielen der animierten Teile der Canvases entfallen;
Core Animation zeichnet den Rest jedes Canvas auf eigenen Threads.

<a id="every-page-1"></a>

### Jede Seite

Jede Seite der Gallery, beim Öffnen und während der Test sie scrollt, im selben Fenster von 1200 × 800. Wie unter Linux ist *FPS*
die Rate, solange sich etwas bewegt (ein Frame pro Median-Abstand zwischen gezeichneten Frames); bei den 120 des Displays folgt jeder Frame
einer Animation oder eines Scrollvorgangs einen Refresh nach dem vorherigen. *Über einem Refresh* ist der Anteil der Frames, die
länger als ein Refresh (8,3 ms) gedauert haben. Eine ruhende Seite zeichnet keinen Frame und verbraucht 2–5 % CPU. GIF und WebP bei Images laufen in Core
Animation und Video in AVFoundation, jeweils mit ihren eigenen Bildraten.

<div class="data-table">

| Seite | Frames stammen von | FPS | Frame p95 | Über einem Refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Live-Daten, native Loops | 120 | 3,2 ms | 0 % | 35 % |
| Stocks, Scrollen | Live-Daten, Scrollen | 120 | 3,5 ms | 0 % | 36 % |
| AI Chat, Scrollen | Scrollen | 120 | 2,4 ms | 1 % | 5 % |
| Photos, Scrollen | Scrollen | 120 | 1,4 ms | 0 % | 10 % |
| Lists, Scrollen | Scrollen | 120 | 1,6 ms | 0 % | 8 % |
| Scrolling, Scrollen | Scrollen | 120 | 2,7 ms | 0 % | 6 % |
| Navigation, Scrollen | Scrollen | 120 | 0,2 ms | 0 % | 4 % |
| Form, Scrollen | Scrollen | 120 | 0,6 ms | 0 % | 5 % |
| Resizable, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 4 % |
| Dock, Scrollen | Scrollen | 120 | 0,3 ms | 1 % | 5 % |
| Gestures | Springs, ein pulsierender Ring | 120 | 0,4 ms | 0 % | 4 % |
| Physics, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 4 % |
| Animations | Native Loops | 120 | 0,3 ms | 0 % | 5 % |
| Canvas, Scrollen | Scrollen, native Loops | 120 | 1,2 ms | 0 % | 7 % |
| Styles, Scrollen | Scrollen, eine schwingende Transformation | 120 | 1,0 ms | 0 % | 6 % |
| Tailwind | `animate-*`-Utilities | 120 | 0,5 ms | 0 % | 4 % |
| Text, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 5 % |
| Text View, Scrollen | Scrollen | 120 | 0,7 ms | 0 % | 5 % |
| Images, Scrollen | Scrollen | 120 | 0,4 ms | 0 % | 5 % |
| Components, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 5 % |
| Overlays, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 4 % |
| Menus, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 5 % |
| Controls | Übergänge | 120 | 0,3 ms | 0 % | 4 % |
| Web and video, Scrollen | Scrollen | 120 | 0,2 ms | 0 % | 6 % |
| System | `requestAnimationFrame`, Timer | 120 | 0,2 ms | 0 % | 3 % |
| Standard APIs, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 5 % |
| Storage, Scrollen | Scrollen | 120 | 0,3 ms | 0 % | 5 % |

</div>

<a id="memory-1"></a>

### Speicher

Im Ruhezustand, 3 s nach dem Start (Release-Runner). *Footprint* ist der Speicher, den macOS dem Prozess anrechnet (das, was die Aktivitätsanzeige
zeigt); *Resident* addiert die Seiten der Shared Libraries des Systems:

<div class="data-table">

| App | Fenster | Footprint | Resident (RSS) |
|---|---|---|---|
| Rust-App (`nsh init --template rust`) | 1200 × 800 | ca. 19 MB | ca. 86 MB |
| TSX-Counter (`examples/counter`) | 1200 × 800 | ca. 20 MB | ca. 89 MB |
| AppKit-Fenster mit einem Label, zum Vergleich | 480 × 640 | ca. 17 MB | ca. 80 MB |

</div>

Während der Tour durch die Gallery belegt der Prozess bis zur Canvas-Seite 84–230 MB und ab der Text-View-Seite
ca. 350–360 MB, bedingt durch das, was er bewusst cacht (dekodierte Bilder, auf 128 MB begrenzt; die Dokumente der Text-View-Seite), und durch die
Frameworks, die er erst bei der ersten Verwendung lädt (WebKit für Web Views); die Rasters der Canvas-Seite, bis zu ca. 310 MB, wenn alle drei
Canvases auf dem Bildschirm sind, verschwinden, wenn die Seite geschlossen wird.
<a id="app-size-1"></a>

### App-Größe

Die Hello-World-Apps, die `nsh init` mit jeder Vorlage erzeugt, so wie `nsh package --target macos` sie für Apple
Silicon (arm64) baut, mit Link-Time-Optimierung und gestrippt wie unter Linux, sowie die beiden obigen Apps in der für Apple
Silicon ausgelieferten Form. Die ausführbare Datei ist der Runner im `.app`; das Zip ist das komprimierte `.app` (`ditto -c -k`):

<div class="data-table">

| App | Geschrieben in | Ausführbare Datei | Gezippt `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12,4 MB | 6,0 MB |
| Hello world (`--template ts`) | TSX, auf QuickJS | 19,8 MB | 9,5 MB |
| Hello world (`--template mixed`) | TSX und ein Rust-Crate | 19,8 MB | 9,5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21,6 MB | 8,4 MB (`.tar.gz` seines Releases) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18,4 MB | 9,7 MB (`.tar.gz` seines Releases) |

</div>

Das machen diese Zahlen möglich:

- **Frames nur bei Änderungen**: Der Display Link tickt, solange eine native Animation läuft, und endet mit ihr; eine
  Animation endet mit ihrer Seite (das Löschen ihrer View beendet ihre Keyframes, eine Schleife endet in der `cleanup` ihrer Komponente).
- **Canvases dort gezeichnet, wo es am wenigsten kostet**: Ein Canvas, der oft neu gezeichnet wird (eine Animation, Live-Daten), zeichnet auf den Threads von Core
  Animation (`drawsAsynchronously`), was den Main-Thread freihält; einer, der nur gelegentlich neu gezeichnet wird, zeichnet
  sofort, ohne den Grafikspeicher, den asynchrones Zeichnen belegt. Ein animierter Wert zeichnet nur den Bereich neu, den die
  Operationen abdecken, die ihn lesen.
- **Statische Canvas-Teile bleiben erhalten**: Sobald eine Zeichnung unverändert bleibt, wird ein langer Teil vor der ersten animierten Operation
  als Layer behalten; jeder Frame zeichnet diesen Layer und spielt nur den animierten Rest erneut ab, sofort auf dem Main-Thread (die
  Gauge, die Uhr und die Punktmatrix der Canvas-Seite: keine GPU-Arbeit und halb so viel Speicher).
- **Inhalte werden gezeichnet, wenn sie sich ändern**: Texte und Canvases zeichnen in eigene Layer, erneut, wenn sich ihr Inhalt oder ihre
  Größe ändert, nicht wenn sie bewegt oder gescrollt werden.

## Windows (Win32, Direct2D)

Gemessen auf einem Windows-11-Desktop (Intel Core i7-13700KF, 32 GB, NVIDIA GeForce RTX 3060 Ti) mit einem 4K-144-Hz-Display bei
150 %, Release-Builds, die Gallery in einem Fenster von 1200 × 800 (1800 × 1200 Pixel), jede Messung automatisch erfasst von
`examples/gallery/tools/perf.py` (`nsh test --target windows --fps`, eine Zeile pro Sekunde; CPU ist der gesamte Prozess, in
Prozent eines Kerns). Die Phasen beziehen sich auf den Main-Thread pro Frame: *paint* (Direct2D zeichnet das Fenster) und, darin
enthalten, *canvas* (Aufzeichnen und Abspielen von Zeichnungen).

<a id="animated-demos-2"></a>

### Animierte Demos

<div class="data-table">

| Demo | FPS | Frame p95 | Paint / Canvas pro Frame | CPU |
|---|---|---|---|---|
| Stocks: 22 Live-Sparklines, ein Intraday-Chart, Orderbuch, Tape | 144 | 3,7–4,3 ms | 1,4 / 0,13 ms | 36–43 % |
| Canvas: eine Gauge, eine Uhr, eine Punktmatrix | 144 | 1,0–2,0 ms | 0,8–1,4 / 0,05 ms | 21–35 % |
| Animations: drei native Loops, Springs, Sequenzen | 144 | 1,0–3,6 ms | 0,9–1,9 ms | 20–41 % |

</div>

Stocks committet 16–17 Mal pro Sekunde, jeweils in bis zu 2,1 ms JS und 1,7 ms Core auf dem Engine-Thread (p95).

> [!NOTE]
> Seiten, deren Animationen Views über große Bereiche bewegen, verbrauchen hier mehr CPU als unter Linux und macOS (Animations 20–41 %
> gegenüber 5–13 %, Gestures 36 % gegenüber 1–5 %). Ein Windows-Frame zeichnet mit Direct2D auf dem Main-Thread jede View
> über den geänderten Bereichen neu: Ein wachsender Ring zeichnet in jedem Frame die darunterliegende Karte neu. Unter macOS
> verschiebt, skaliert und blendet Core Animation die Layer, die es behält, auf der GPU aus, ohne sie neu zu zeichnen, und unter Linux behält GSK die
> Render-Nodes dessen, was sich nicht geändert hat. Die Zahlen beinhalten außerdem 144 Frames pro Sekunde bei 1800 × 1200 Pixeln.

<a id="every-page-2"></a>

### Jede Seite

Jede Seite der Gallery, beim Öffnen und während der Test sie scrollt, im selben Fenster von 1200 × 800. Wie unter Linux und
macOS ist *FPS* die Rate, während sich etwas bewegt (ein Frame pro Median der Abstände zwischen gezeichneten Frames); bei den 144 des Displays
kommt jeder Frame einer Animation oder eines Scrollvorgangs einen Refresh nach dem letzten. *Over one refresh* ist der Anteil der Frames,
die länger als ein Refresh (6,9 ms) gebraucht haben. Eine ruhende Seite zeichnet keinen Frame und verbraucht 0–2 % CPU. Die GIF- und WebP-Bilder der Images-Seite spielen
mit ihren eigenen Frameraten (hier etwa 40 FPS). Physics, Overlays, Menus und Storage werden in einem Fenster von 900 × 500 gemessen,
in dem sie Platz zum Scrollen haben.

<div class="data-table">

| Seite | Woher die Frames kommen | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Live-Daten, native Loops | 144 | 3,9 ms | 0 % | 36 % |
| Stocks, scrolling | Live-Daten, Scrollen | 144 | 4,3 ms | 0 % | 43 % |
| Photos, scrolling | Scrollen | 143 | 2,1 ms | 0 % | 9 % |
| Lists, scrolling | Scrollen | 144 | 2,0 ms | 1 % | 19 % |
| Scrolling, scrolling | Scrollen | 143 | 2,1 ms | 0 % | 7 % |
| Navigation, scrolling | Scrollen | 144 | 0,8 ms | 0 % | 9 % |
| Form, scrolling | Scrollen | 144 | 0,8 ms | 0 % | 12 % |
| Resizable, scrolling | Scrollen | 143 | 0,4 ms | 0 % | 4 % |
| Dock, scrolling | Scrollen | 144 | 0,5 ms | 1 % | 5 % |
| Gestures | Springs, ein pulsierender Ring | 144 | 1,8 ms | 0 % | 36 % |
| Physics, scrolling | Scrollen (ein Fenster von 900 × 500) | 144 | 0,8 ms | 0 % | 4 % |
| Animations | Native Loops | 144 | 1,0 ms | 0 % | 28 % |
| Canvas, scrolling | Scrollen, native Loops | 144 | 2,0 ms | 0 % | 35 % |
| Styles, scrolling | Scrollen, eine schwingende Transformation | 144 | 2,1 ms | 0 % | 39 % |
| Tailwind | `animate-*`-Utilities | 144 | 0,6 ms | 0 % | 19 % |
| Text, scrolling | Scrollen | 144 | 1,6 ms | 0 % | 8 % |
| Text View, scrolling | Scrollen | 144 | 1,1 ms | 0 % | 10 % |
| Images, scrolling | Scrollen, GIF- und WebP-Frames | 143 | 4,8 ms | 2 % | 23 % |
| Components, scrolling | Scrollen | 144 | 1,0 ms | 1 % | 11 % |
| Overlays, scrolling | Scrollen (ein Fenster von 900 × 500) | 144 | 0,6 ms | 0 % | 1 % |
| Menus, scrolling | Scrollen (ein Fenster von 900 × 500) | 144 | 0,6 ms | 0 % | 2 % |
| Controls | Übergänge | 117–144 | 1,5 ms | 0 % | 22 % |
| Web and video, scrolling | Scrollen | 144 | 1,6 ms | 0 % | 15 % |
| System | `requestAnimationFrame`, Timer | 144 | < 0,1 ms | 0 % | 1 % |
| Storage, scrolling | Scrollen (ein Fenster von 900 × 500) | 144 | 0,5 ms | 0 % | 1 % |

</div>

<a id="memory-2"></a>

### Arbeitsspeicher

In Ruhe, 3 s nach dem Start (Release-Runner, ein Fenster von 1200 × 800). *Private Working Set* ist der Speicher, den der Prozess
allein nutzt (die Spalte „Arbeitsspeicher“ des Task-Managers); *Private Bytes* der Speicher, den er committet hat; *Working Set* enthält zusätzlich die Seiten der
Systembibliotheken, die er mit anderen Prozessen teilt (Direct3D, Direct2D, DirectWrite, der GPU-Treiber):

<div class="data-table">

| App | Private Working Set | Private Bytes | Working Set |
|---|---|---|---|
| Rust-App (`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| TSX-Counter (`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

Während der Tour durch die Gallery liegt das Working Set bei ~108–115 MB auf Stocks, ~230 MB ab der Canvas-Seite, ~320–340 MB ab der
Text-View-Seite und ~390–405 MB, sobald Web and video WebView2 geöffnet hat (dessen Seiten in eigenen WebView2-Prozessen laufen),
einschließlich dessen, was bewusst gecacht wird (decodierte Bilder, auf 128 MB begrenzt; die Dokumente der Text-View-Seite).

<a id="app-size-2"></a>

### App-Größe

Die Hello-World-Apps, die `nsh init` mit jeder Vorlage erzeugt, so wie `nsh package --target windows` sie für x86_64 baut
(die Rust-Runner mit Link-Time-Optimierung und gestrippt, wie unter Linux). Die ausführbare Datei ist das `<Name>.exe` der App;
das Zip ist das `.zip`, das neben ihrem Verzeichnis geschrieben wird:

<div class="data-table">

| App | Geschrieben in | Ausführbare Datei | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15,0 MB | 6,7 MB |
| Hello world (`--template ts`) | TSX, auf QuickJS | 28,6 MB | 12,4 MB |
| Hello world (`--template mixed`) | TSX und ein Rust-Crate | 26,3 MB | 11,5 MB |

</div>

Das machen diese Zahlen möglich:

- **Frames nur bei Änderungen, nur dort gezeichnet, wo sie sich geändert haben**: Der vom Compositor getaktete Ticker läuft, solange eine native
  Animation, ein Übergang oder ein Frame-Callback läuft. Ein Frame zeichnet die Bereiche der geänderten Views (dort, wo sie
  waren, und dort, wo sie sind) über die Pixel, die das Fenster behält, und übergibt nur diese an den Compositor (Stocks:
  ~34 Views pro Frame).
- **Canvases zeichnen ihren animierten Teil auf**: Eine Zeichnung wird als Direct2D-Command-Lists aufgezeichnet, vektorbasiert und scharf bei jeder
  Skalierung. Ändert sich ein animierter Wert, werden nur die Operationen ab der ersten, die einen animierten Wert liest,
  erneut aufgezeichnet; was davor liegt, bleibt erhalten (Stocks: ~26 ms Aufzeichnung pro Sekunde für 22 pulsierende Sparklines und das
  Chart).
- **Nur das Sichtbare wird gezeichnet**: Die Kinder einer Scroll-View oder einer Clipping-View, die außer Sicht liegen, werden aus dem
  Frame ausgelassen, und Views ohne eigenen Inhalt zeichnen nicht mehr als ihren Hintergrund und Rand.

## iOS (UIKit)

Gemessen im iOS-Simulator (ein iPhone 18 Pro Max, auf dem oben genannten MacBook Pro), Release-Builds, mit derselben Tour
(`perf.py --target ios`: `nsh test --target ios --fps`, die Berührungen eines Fingers, wie UIKit sie erhält). Der Simulator stellt
mit 60 Hz dar; auf einem iPhone mit ProMotion-Display laufen die Display Links von NSH mit den 120 Hz des Displays (Apps, die `nsh package`
baut, und der Entwicklungs-Host fordern dies mit `CADisableMinimumFrameDurationOnPhone` an). Die Phasen sind *tick* (native
Animationen), *drain* (Anwenden der Batches der Engine) und *scroll* (was auf eine Scroll-View folgt: Listen, Sticky Cells,
gebundene Werte).

<div class="data-table">

| Seite | Woher die Frames kommen | FPS | Frame p95 | CPU |
|---|---|---|---|---|
| Home, scrolling | Scrollen | 60 | 0,1 ms | 6 % |
| Stocks | Live-Daten, native Loops | 60 | 0,3 ms | 22 % |
| Stocks, scrolling | Live-Daten, Scrollen | 60 | 0,3 ms | 25 % |
| Photos, scrolling | Scrollen | 60 | 1,2 ms | 6 % |
| Lists, scrolling | Scrollen | 60 | 1,1 ms | 8 % |
| Scrolling, scrolling | Scrollen | 60 | 0,1 ms | 7 % |
| Navigation, scrolling | Scrollen | 60 | 0,2 ms | 7 % |
| Form, scrolling | Scrollen | 60 | 0,3 ms | 7 % |
| Gestures | Springs, ein pulsierender Ring | 60 | 0,3 ms | 3 % |
| Animations | Native Loops | 60 | 0,7 ms | 6 % |
| Canvas | Native Loops | 60 | 0,4 ms | 16 % |
| Styles | Eine schwingende Transformation | 60 | 0,4 ms | 4 % |
| Tailwind, scrolling | Scrollen | 60 | 0,2 ms | 7 % |
| Text, scrolling | Scrollen | 60 | 0,1 ms | 7 % |
| Text View, scrolling | Scrollen | 60 | 0,1 ms | 6 % |
| Images, scrolling | Scrollen | 60 | 0,1 ms | 5 % |
| Components, scrolling | Scrollen | 60 | 0,2 ms | 6 % |
| Overlays, scrolling | Scrollen | 60 | 0,1 ms | 6 % |
| Menus, scrolling | Scrollen | 60 | 0,2 ms | 7 % |
| Controls, scrolling | Scrollen, Übergänge | 60 | 0,2 ms | 5 % |
| Web and video, scrolling | Scrollen | 60 | 0,1 ms | 8 % |
| System | `requestAnimationFrame`, Timer | 60 | 0,3 ms | 4 % |
| Standard APIs, scrolling | Scrollen | 60 | 0,1 ms | 7 % |
| Storage, scrolling | Scrollen | 60 | 0,1 ms | 8 % |

</div>

*FPS* ist die Rate, während sich etwas bewegt, wie oben: Bei den 60 des Simulators kommt jeder Frame einen Refresh nach dem
letzten. Jede Seite, auf der sich nichts bewegt, zeichnet keinen Frame und verbraucht in Ruhe 1–2 % CPU. Der Prozess belegt 40 MB auf der
Startseite der Gallery und ~180 MB nach der gesamten Tour (bewusst gecachte Bilder, die Dokumente der Text-View-Seite).

Auf einem iPhone 17 Pro (ProMotion, 120 Hz), mit dem Entwicklungs-Host und einer Demo auf dem Bildschirm, zeichnen die animierten Seiten
in jedem Refresh:

<div class="data-table">

| Seite | Woher die Frames kommen | FPS | Frame p95 | Over one refresh | CPU | Speicher |
|---|---|---|---|---|---|---|
| Stocks | Live-Daten, native Loops | 120 | 0,2–0,3 ms | 0 % | 46–70 % | 41–43 MB |
| Canvas | Native Loops | 120 | 0,1 ms | 0 % | 25–36 % | 37–38 MB |
| Animations | Native Loops | 120 | 0,2 ms | 0 % | 3–11 % | 37 MB |

</div>

Stocks committet 20 Mal pro Sekunde (ein Tick alle 50 ms), jeweils in 1,5 ms JS und 1,4 ms Core auf dem Engine-Thread
(p95 2,2 und 2,0 ms), der zu 4–6 % der Zeit ausgelastet ist.

<a id="measuring-an-app"></a>

## Eine App messen

Um eine App auf dieselbe Weise zu messen, führen Sie ihre Tests oder Schritte mit `--fps` und `-v` auf `--target linux`, `macos`, `windows` oder `ios` aus:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
