---
title: "Bilder und Assets"
description: "Bilder in Rust und TSX anzeigen – die Assets der App und @2x-Dateien, SVG-Bilder, Remote-URLs, Größenänderungsmodi, Platzhalter, Unschärfe, Tönung, Ladeereignisse sowie das Auslesen der Bildgröße oder das Vorabladen eines Bildes."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---


# Bilder und Assets

Das image-Element (`image(..)` in Rust, `<Image>` in TSX) zeigt ein Bitmap oder eine SVG-Zeichnung: eine mit der App ausgelieferte Datei oder ein Bild, das von einer URL heruntergeladen wird. Bilder werden außerhalb des Main-Threads gelesen und dekodiert, auf die Größe heruntergerechnet, in der die View sie darstellt, und zwischengespeichert; der Main-Thread zeigt nur das dekodierte Ergebnis an.

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

image(LOGO)
image("https://picsum.photos/seed/nsh/600/400").w_full().h(px(200.0)).rounded(px(12.0))
```

```tsx tabs
import { Image } from "nsh";
import logo from "./assets/logo@2x.png";

<Image src={logo} />
<Image src="https://picsum.photos/seed/nsh/600/400" style={{ width: "100%", height: 200, borderRadius: 12 }} />
```

Die Props des Elements sind unter [image](../elements/image.md) aufgeführt.

<a id="images-in-the-app"></a>

## Bilder in der App

Ein Rust-Crate hält seine Dateien in seinem Verzeichnis `assets/`: `asset!("logo@2x.png")` (der Pfad relativ zu `assets/`) ist ein `ImageAsset`, `{ url, size, scales }`, der beim Kompilieren des Crates gelesen wird, und `registry.assets(assets!())` in der Funktion `#[native_module]` des Crates liefert jede Datei des Verzeichnisses mit der App aus. In TSX importierst du eine Bilddatei wie ein Modul: Der Import liefert ein `ImageAsset`, `{ url, size, scales? }`, und der Bundler liefert die Datei mit der App aus:

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

// LOGO.url: "asset:/@my-app/logo@2x.png", LOGO.size: 64 × 64 points

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}
```

```tsx tabs
import logo from "./assets/logo@2x.png";

logo; // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
```

Unterstützte Dateien: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` und `.svg` ([SVG-Bilder](#svg-images)).

**Größen sind in Punkten angegeben.** Ein Suffix `@2x` oder `@3x` im Dateinamen besagt, dass die Datei 2 bzw. 3 Pixel pro Punkt hat. So ist `logo@2x.png` mit 128×128 Pixeln ein Asset mit 64×64 Punkten. Ohne Suffix entspricht ein Pixel einem Punkt. Eine Datei, deren Name ein Suffix trägt, wird genau so angezeigt; eine Datei ohne Suffix zeigt ihre [Pixeldichte-Varianten](#pixel-densities), sofern sie welche hat.

**Natürliche Größe.** Ein Bild aus einem Asset wird in seiner natürlichen Größe gelayoutet, wenn sein Style die Breite oder Höhe offen lässt, sodass `image(LOGO)` und `<Image src={logo} />` keinen Style brauchen. Lege eine Dimension und das Seitenverhältnis oder beide fest, um es anders zu dimensionieren.

In Rust lässt eine fehlende oder defekte Datei den Build fehlschlagen, und eine geänderte Datei baut das Crate erneut. In TSX werden Assets relativ zum importierenden Modul aufgelöst, und ihr `url` ist relativ zum Stammverzeichnis der App (dem Verzeichnis des Einstiegspunkts). `nsh build` kopiert sie nach `out/assets/`, `nsh package` legt sie in der App ab, und während der Entwicklung liefert der Dev-Server sie aus.

> [!TIP]
> In TSX akzeptiert `src` auch `asset:/path`-Strings, aber nur importierte Dateien werden garantiert mit ausgeliefert. Ein Pfad, der nie importiert wird, funktioniert mit dem Dev-Server, der das gesamte App-Verzeichnis ausliefert, und fehlt in paketierten Apps. Importiere jedes Bild, das du verwendest. Ein Rust-Crate liefert sein gesamtes Verzeichnis `assets/` über `assets!()` aus.

<a id="pixel-densities"></a>

### Pixeldichten

Benenne die Datei ohne Suffix und lege ihre dichteren Versionen daneben, dann lädt die App die, die zum Bildschirm passt:

```text
assets/
├── logo.png       64×64 pixels
├── logo@2x.png    128×128
└── logo@3x.png    192×192
```

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

// LOGO.size: 64 × 64 points, LOGO.scales: [1.0, 2.0, 3.0]
```

```tsx tabs
import logo from "./assets/logo.png";

logo; // { url: "asset:/assets/logo.png", size: { width: 64, height: 64 }, scales: [1, 2, 3] }
```

- `asset!` und der Bundler suchen nach den Geschwisterdateien `@1.5x`, `@2x`, `@3x` und `@4x` eines Bilds, dessen Name kein Suffix trägt. `scales` listet sie auf, wobei 1 für die benannte Datei steht; ein Bild ohne Geschwisterdateien hat keine Skalierungen (in TSX wird es als `{ url, size }` importiert). Der Bundler liefert die Geschwisterdateien aus, die er findet, und `assets!()` liefert das gesamte Verzeichnis aus.
- Das Bild lädt die kleinste Skalierung, die mindestens dem Pixelverhältnis des Bildschirms entspricht, andernfalls die größte, so wie React Native sie auswählt: `logo.png` auf einem 1×-Bildschirm, `logo@2x.png` auf einem 2×-Bildschirm, `logo@3x.png` auf einem 3×-Smartphone (und bei 2,625). Im Web wird nur diese Datei heruntergeladen.
- Wenn sich das Pixelverhältnis ändert (ein Fenster wird auf einen anderen Bildschirm verschoben, Browser-Zoom), laden die Bilder, deren Auswahl sich ändert, erneut, samt ihrer [Load-Events](#load-events). Ihre Größe bleibt die der benannten Datei, in Punkten.
- Eine Variante, deren Pixel nicht der Größe der benannten Datei mal ihrer Skalierung entsprechen, erzeugt in TSX eine Build-Warnung und lässt in Rust den Build fehlschlagen.
- Eine Datei, die mit einem Dichte-Suffix benannt ist (`./logo@3x.png`, `asset!("logo@3x.png")`), steht für sich allein.
- Ein [SVG-Bild](#svg-images) wird bei jedem Verhältnis passend für den Bildschirm gezeichnet und liefert daher keine Varianten aus.

Eine einzelne Datei genügt ebenfalls: Exportiere sie in der höchsten benötigten Dichte (`@3x` für das schärfste Ergebnis auf jedem Smartphone) und benenne sie mit ihrem Suffix; Bilder werden beim Dekodieren auf den Bildschirm heruntergerechnet. Mit Varianten kann jeder Bildschirm die Datei herunterladen, dekodieren und behalten, die zu ihm passt.

<a id="svg-images"></a>

## SVG-Bilder

Importiere eine `.svg`-Datei wie jedes andere Bild. Ihre Größe in Punkten ergibt sich aus `width` und `height` (oder aus einem von beiden, wobei das andere aus dem Seitenverhältnis der `viewBox` stammt), andernfalls aus ihrer `viewBox`: Ein CSS-Pixel der SVG entspricht einem Punkt, und Suffixe `@2x` lassen SVG-Dateien unverändert.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

Eine SVG ist in der Größe scharf, in der sie angezeigt wird. Der Browser zeichnet sie als Vektoren; iOS, macOS und Android zeichnen sie beim Laden des Bilds in der Größe, in der die View sie darstellt, in Pixeln (wie sie auch Bitmaps herunterrechnen; eine View, die danach wächst, skaliert diese Zeichnung, bis das Bild erneut geladen wird); Windows, Linux und GPUI zeichnen sie einmal mit vier Pixeln pro Punkt (bis zu 2048 Pixel pro Seite) und skalieren sie für jede View. Alles andere funktioniert wie bei Bitmaps: `objectFit`, `tintColor` (über die deckenden Formen der SVG, sodass einfarbige Icons dem Theme folgen), Filter, `blurRadius`, Platzhalter, die Load-Events, `Image.getSize` und `Image.prefetch`. `onLoad` und `Image.getSize` melden die Größe einer SVG in ganzen Punkten; das Bild wird in seiner exakten Größe gelayoutet. Remote-SVG-Dateien werden auf dieselbe Weise geladen, über dieselben Downloads und [Capability](./sandbox-and-capabilities.md)-Prüfungen; NSH erkennt eine SVG an ihrem Inhalt (auch gzip-komprimiert, `.svgz`), unabhängig davon, womit ihre URL endet.

**Was native Plattformen zeichnen.** iOS, macOS, Android, Windows, Linux und GPUI zeichnen SVGs mit einem einzigen Renderer (resvg), sodass eine Zeichnung überall gleich aussieht: Formen und Pfade, Füllungen und Konturen, Verläufe und Muster, Clip-Pfade und Masken, Deckkraft, Filter und Transformationen. Text (`<text>`), Animationen (SMIL und CSS), eingebettete Bilder (`<image>`) und HTML (`<foreignObject>`) werden im Browser angezeigt; native Plattformen zeichnen den Rest der SVG, statisch, und `nsh build` nennt die Dateien, die sie verwenden. Exportiere Text als Umrisse (Pfade), um überall dasselbe Ergebnis zu erhalten.

**Ein in sich geschlossenes Bild.** Auf nativen Plattformen zeichnet eine SVG nur, was sie selbst enthält: Dateien, URLs, `data:`-Bilder und andere Dokumente, auf die sie verweist, werden weggelassen. Native Plattformen zeichnen SVGs, auch Remote-SVGs, innerhalb von Grenzen, die den Speicherverbrauch im Zaum halten: ein Dokument von bis zu 16 MiB (bei einem komprimierten nach dem Entpacken), eine Zeichnung von bis zu 8192 Pixeln pro Seite und insgesamt 4096 × 4096 Pixeln (64 MiB; eine größere wird kleiner gezeichnet) sowie Ebenen (Gruppen mit Deckkraft, Masken, Clip-Pfaden und Filtern, die der Renderer separat zeichnet) von bis zu 256 MiB gleichzeitig. Eine SVG, die die Grenze für Dokument oder Ebenen überschreitet, wird nicht geladen, mit `onError`.

**Gemeldete Größen im Web.** Der Browser vermisst SVGs selbst, importierte wie Remote-SVGs: `onLoad` und `Image.getSize` melden `width` und `height` einer SVG, wenn sie diese hat, und andernfalls die Größe, die der Browser ihr gibt und die Browser typischerweise aus einem Standardwert von 300 × 150 und dem Seitenverhältnis der `viewBox` ableiten. Importierte SVGs werden auf jeder Plattform in der Größe des Bundlers gelayoutet. Gib SVGs `width` und `height`, damit überall dieselbe Größe gemeldet wird.

<a id="remote-images"></a>

## Remote-Bilder

Gib dem Element eine URL: in Rust einen String (eine Closure für eine sich ändernde URL), in TSX einen URL-String:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **Gib Remote-Bildern eine Größe.** Ihre Größe ist bis zum Laden unbekannt, daher kollabieren sie ohne Breite und Höhe (oder eines von beiden und ein Seitenverhältnis) auf keine Höhe.
- **Eine Hintergrundfarbe** wird angezeigt, während das Bild lädt, oder verwende einen Platzhalter (siehe unten).
- Downloads werden geteilt: Mehrere Views, die dieselbe URL anzeigen, laden sie nur einmal herunter, auch wenn sie sie in unterschiedlichen Größen dekodieren. Ein Download, auf den niemand mehr wartet, wird abgebrochen.
- Dekodierte Bilder werden im Arbeitsspeicher zwischengespeichert (der Cache wird bei knappem Speicher geleert), mit URL, Dekodiergröße und Blur-Radius als Schlüssel.
- Wenn die App [Capabilities](./sandbox-and-capabilities.md) deklariert, muss der Host des Bilds unter `network` erlaubt sein; ein abgelehntes Bild schlägt mit seinem error-Event fehl.

<a id="kept-on-disk"></a>

### Auf dem Datenträger gespeichert

Heruntergeladene Bilder werden außerdem so, wie der Server sie gesendet hat, auf dem Datenträger gespeichert, sodass eine erneut geöffnete App (eine Unterhaltung voller Avatare und Fotos, ein Feed) die Bilder, die sie zuvor angezeigt hat, ohne erneuten Download anzeigt, auch offline. Die App
braucht dafür keine Einstellung: Jedes Bild mit einer `http://`- oder `https://`-URL läuft auf iOS, Android, macOS,
Windows, Linux und GPUI durch den Cache, und im Browser leistet der HTTP-Cache des Browsers dasselbe.

Der Cache folgt den HTTP-Caching-Headern des Servers:

- Ein Bild wird gespeichert, sofern die Antwort nicht `Cache-Control: no-store` angibt.
- Es wird ohne Anfrage verwendet, solange es frisch ist: für `max-age`, sonst bis `Expires`, sonst für ein Zehntel der Zeit
  seit `Last-Modified` (höchstens eine Woche).
- Danach wird es beim Server geprüft (`If-None-Match` mit seinem `ETag`, `If-Modified-Since` mit seinem
  `Last-Modified`): Ein unverändertes Bild (`304`) wird erneut verwendet, ohne es herunterzuladen, ein geändertes ersetzt die gespeicherte Kopie.
- Wenn die Anfrage fehlschlägt (kein Netzwerk) oder der Server einen Fehler meldet (`5xx`), wird die gespeicherte Kopie angezeigt, es sei denn, die Antwort
  enthielt `must-revalidate` oder `no-cache`.

Jede App hat ihren eigenen Cache von 256 MiB; darüber hinaus werden die am längsten nicht verwendeten Bilder zuerst entfernt. Mehrere Views,
Surfaces und Prozesse einer App teilen ihn sich sicher. Einbettende Apps legen fest, wo er liegt und wie groß er ist, oder schalten ihn ab:

```rust tabs
// macOS, Windows, Linux and GPUI: the AppView's options (or AppView::set_cache).
let mut cache = CacheOptions::at(CacheLocation::Dir(caches.join("nsh")));  // each app in <dir>/<app id>
cache.images = CachePolicy::MaxSize(ByteSize::mib(64));                     // CachePolicy::Off: none
let view = AppView::new(mtm, AppOptions { cache, ..AppOptions::default() });
```

```swift tabs
// iOS: NshAppView, before loading.
app.cacheOptions = NshCacheOptions(location: .directory(caches.appendingPathComponent("nsh")),
                                   images: .maxSize(megabytes: 64))   // .off: none
```

```java tabs
// Android: NshView, before loading.
nsh.setCacheOptions(NshCacheOptions.builder()
        .location(new File(getCacheDir(), "nsh"))
        .imagesMaxMegabytes(64)          // imagesOff(): none
        .build());
```

`CacheLocation::Off` (`.off`, `noDiskCache()`) speichert nichts auf dem Datenträger.

Standardmäßig liegt der Cache im Cache-Verzeichnis des Systems: `Library/Caches/nsh` auf iOS, `nsh` im Cache-Verzeichnis
auf Android, `~/Library/Caches` auf macOS, `%LOCALAPPDATA%` auf Windows und `$XDG_CACHE_HOME` (`~/.cache`) auf Linux,
jeweils mit der App in `<app id>/images` dort. Das System kann diese Verzeichnisse leeren, wenn es den Speicherplatz benötigt.

<a id="resize-modes"></a>

## Resize-Modi

Der Style `objectFit`, CSS' `object-fit` (`.object_fit(..)` in Rust), bestimmt, wie ein Bild eine Box mit anderer Form ausfüllt:

| Wert | Ergebnis |
|---|---|
| `"cover"` (`ResizeMode::Cover`, Standard) | Füllt die Box unter Beibehaltung des Seitenverhältnisses und schneidet Überstehendes ab |
| `"contain"` (`ResizeMode::Contain`) | Passt in die Box unter Beibehaltung des Seitenverhältnisses und lässt leere Streifen |
| `"fill"` (`ResizeMode::Stretch`) | Füllt die Box exakt und verzerrt das Bild |
| `"none"` (`ResizeMode::Center`) | Natürliche Größe, platziert bei `objectPosition` (standardmäßig zentriert) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | Natürliche Größe, verkleinert, wo sie zu groß ist |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Die Tailwind-Klassen `object-cover`, `object-contain`, `object-fill`, `object-none` und `object-scale-down` setzen denselben Style.

<a id="image-position"></a>

### Bildposition

Wo das dimensionierte Bild in seiner Box sitzt, bestimmt der Style `objectPosition` (`.object_position(..)` und `.object_top()`, ... in Rust), CSS' `object-position`: standardmäßig die Mitte. Ein füllendes Bild wird um diese Position herum beschnitten, ein einpassendes verschiebt sich innerhalb seiner Streifen. Er akzeptiert Schlüsselwörter (`"top"`, `"left bottom"`), Prozentwerte und Längen (`"25% 75%"`, `"10px 0"`) sowie Kanten mit Offsets (`"right 10px bottom 20%"`). Ein hohes Foto in einer Chat-Blase zeigt auf diese Weise seinen oberen Teil:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Die Tailwind-Klassen sind die von Tailwind: `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` und beliebige Werte (`object-[25%_75%]`).

<a id="styling-images"></a>

## Bilder stylen

Bilder sind Views: Sie unterstützen Eckenradien (auch pro Ecke), Rahmen, Schatten, Deckkraft und Transformationen. Die Ecken beschneiden das Bild.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **Tint** (`.tint_color(..)` in Rust, der Style `tintColor` in TSX) färbt die deckenden Pixel des Bilds um: Verwende ihn für einfarbige Icons, die dem Theme folgen.
- **Filter** (`.grayscale(..)`, `.sepia(..)`, `.blur(..)`; `filter` in TSX) wirken auf beiden Plattformen auf Bilder ([Filter](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## Platzhalter, Einblenden und Blur

| Prop | Rust | Beschreibung |
|---|---|---|
| `placeholder` | `.placeholder(..)` | Ein Bild, das angezeigt wird, bis `src` geladen ist, eine URL oder ein Asset; am besten ein lokales Asset |
| `fadeDuration` | `.fade_duration(ms)` | Millisekunden, über die das geladene Bild eingeblendet wird. Standard: 0 auf iOS, 300 auf Android |
| `blurRadius` | `.blur_radius(px(..))` | Verwischt das Bild um diesen Radius in Punkten, einmalig beim Dekodieren angewendet |

```rust tabs
image(move || format!("https://picsum.photos/seed/{}/300/300", id.get()))
    .placeholder(PLACEHOLDER)
    .fade_duration(250.0)
    .size(px(100.0))
    .rounded(px(12.0))
image(cover).blur_radius(px(16.0)).absolute().inset_0()
```

```tsx tabs
<Image
  src={`https://picsum.photos/seed/${id()}/300/300`}
  placeholder={placeholder}
  fadeDuration={250}
  style={{ width: 100, height: 100, borderRadius: 12 }}
/>
<Image src={cover} blurRadius={16} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
```

<a id="animated-images"></a>

## Animierte Bilder

Animierte GIF-, WebP- und APNG-Dateien werden automatisch abgespielt, als Assets oder von URLs. Sie unterstützen dieselben Styles, einschließlich `objectFit`; ein eingefärbtes animiertes Bild zeigt auf iOS seinen ersten Frame.

## Load-Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | Das Laden beginnt |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` in Bytes (`total` 0, wenn unbekannt) | Während eines Downloads, höchstens alle 100 ms |
| `onLoad` | `.on_load(..)` | `{ size }` | Das Bild ist bereit; die Größe der Quelle in Pixeln (bei einer SVG in Punkten, [im Web so, wie der Browser sie misst](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (ein `&str` in Rust) | Laden oder Dekodieren ist fehlgeschlagen |
| `onLoadEnd` | `.on_load_end(..)` | | Nach `onLoad` oder `onError` |

```rust tabs
let status = signal(SharedString::from("loading…"));

image(url)
    .on_load(move |size: &Size<DevicePixels>| status.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| status.set(message.to_owned().into()))
    .w(px(90.0))
    .h(px(60.0))
```

```tsx tabs
const status = signal("loading…");

<Image
  src={url}
  onLoad={({ size }) => status.set(`${size.width}×${size.height}`)}
  onError={(e) => status.set(e.message)}
  style={{ width: 90, height: 60 }}
/>
```

Das Load-Event meldet die Größe des Quellbilds, nicht die Größe, in der es dekodiert wurde.

Ein Bild mit [Pixeldichte-Varianten](#pixel-densities) lädt eine seiner Dateien, und das Load-Event meldet die Pixel dieser Datei: 192×192 für `logo@3x.png` auf einem 3×-Bildschirm, wo `Image.getSize(logo)` mit den 64×64 der importierten Datei aufgelöst wird. Wenn sich das Pixelverhältnis ändert und das Bild eine andere Variante lädt, meldet dieses Laden ebenfalls seine Events: `onLoadStart`, dann `onLoad` mit der Größe der neuen Datei (oder `onError`), dann `onLoadEnd`.
<a id="an-images-size-and-prefetching"></a>

## Größe eines Bildes und Prefetching

Bilder, die nicht auf dem Bildschirm sind, lassen sich vorab vermessen und laden: `image_size(..)` und `prefetch_image(..)` in Rust, `Image.getSize` und `Image.prefetch` (auf demselben `Image`, der das Element rendert) in TSX:

```rust tabs
spawn(async move {
    // Ok(ImageSize { width, height }), in pixels.
    let size = image_size("https://example.com/photo.jpg").await;
    // Ok(()) once the bytes are in memory.
    let loaded = prefetch_image("https://example.com/next.jpg").await;
});
```

```tsx tabs
import { Image } from "nsh";

const size = await Image.getSize("https://example.com/photo.jpg");   // { width, height } in pixels
await Image.prefetch("https://example.com/next.jpg");                // once the bytes are in memory
```

| Rust | TSX | Rückgabe |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | Die Größe des Bildes in Pixeln (bei einem SVG in Punkten, [im Web so, wie der Browser sie misst](#svg-images)); ein Fehler, wenn es sich nicht laden lässt |
| `prefetch_image(src)` | `Image.prefetch(src)` | Nichts, sobald die Bytes des Bildes geladen sind; ein Fehler, wenn es sich nicht laden lässt |

In TSX ist `src` ein URL-String oder ein importiertes Bild. Bei einem importierten Bild mit [Varianten](#pixel-densities) laden beide die Variante, die die Views auf diesem Bildschirm laden, und `getSize` liefert die Größe der importierten Datei. Beide behalten die heruntergeladenen Bytes für die Views, die das Bild als Nächstes anzeigen, sodass ein vor der Anzeige per Prefetch geladenes Bild ohne Download erscheint.

Ein typischer Anwendungsfall ist, ein Remote-Bild anhand seines Seitenverhältnisses zu dimensionieren:

```rust tabs
fn remote_image(url: &'static str) -> impl IntoElement {
    let ratio = signal(1.0_f32);
    spawn(async move {
        if let Ok(size) = image_size(url).await {
            ratio.set(size.width.0 as f32 / size.height.0 as f32);
        }
    });
    image(url).w_full().aspect_ratio(ratio)
}
```

```tsx tabs
function RemoteImage(props: { url: string }) {
  const ratio = signal(1);
  Image.getSize(props.url).then((s) => ratio.set(s.width / s.height));
  return <Image src={props.url} style={{ width: "100%", aspectRatio: ratio() }} />;
}
```

<a id="other-assets"></a>

## Weitere Assets

| Datei | Rust (`asset!`) | TSX-Import | Seite |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | Ein `FontAsset` mit seinem Familiennamen | Der Familienname der Schriftart | [Schriftarten](./fonts.md) |
| `.json` und andere Dateien | Ein `FileAsset` mit seiner URI | `.json`: der geparste Wert, im Skript gebündelt | [Projektstruktur](./project-structure.md#modules) |

Schriftarten werden in beiden Fällen vor dem ersten Frame registriert.

<a id="reading-a-file-at-run-time"></a>

### Eine Datei zur Laufzeit lesen

`fetch` liest eine Datei, die die App mitliefert, über ihre `asset:/`-URL, in TSX wie in Rust, auf jeder Plattform. Ein importiertes Bild trägt seine URL (`url`), die Dateien eines Rust-Crates erhalten ihre von `asset!` (`FileAsset::uri`) und `assets!()`:

```rust tabs
const GREETING: FileAsset = asset!("locales/en.txt");

#[component]
fn Greeting() -> impl IntoElement {
    let greeting = signal(String::new());
    spawn(async move {
        match fetch(GREETING.uri).await {
            Ok(response) => greeting.set(response.text()),
            Err(error) => greeting.set(error),
        }
    });
    text(move || greeting.get())
}
```

```tsx tabs
import flag from "./images/flag.png";

const bytes = await (await fetch(flag.url)).bytes();
```

Die Engine liest die Datei aus den Dateien der App außerhalb ihres Threads (während `nsh run` vom Dev-Server), ohne dass eine Capability nötig ist: Es sind die eigenen Dateien der App. Eine Web-App lädt, was die Seite nicht vorab geladen hat, von dort herunter, wo sie ihre Assets ausliefert. Die Antwort ist `200` mit den Bytes der Datei, ihrem `Content-Length` und dem `Content-Type`, den ihre Dateiendung ergibt (`image/png`, `application/json`, ...), und ihr `url` ist die `asset:/`-URL, unabhängig davon, wie die Datei angekommen ist; eine Datei, die die App nicht mitliefert, wird mit einem Netzwerkfehler abgelehnt, der sie benennt. Die URL benennt die Datei über ihren Pfad innerhalb der Dateien der App, und die Anfrage liest sie mit `GET` (oder `HEAD`): Eine URL, deren Pfad diese Dateien verlässt (`..`, ein absoluter Pfad), und eine Anfrage mit einer anderen Methode werden auf dieselbe Weise abgelehnt, noch bevor etwas gelesen oder heruntergeladen wird.

<a id="a-modules-own-url"></a>

### Die eigene URL eines Moduls

In TSX ist `import.meta.url` die URL des Moduls, in dem es geschrieben steht, sodass `new URL("./data.json", import.meta.url)` eine Datei daneben benennt. Die Module einer lokalen oder gepackten Desktop-App haben `file:`-URLs im Verzeichnis der App, die `fs/promises` mit einer `${pluginDir}`-Berechtigung liest; die einer Web-App sind die der Seite; die einer gepackten mobilen App sind `asset:/`-URLs wie die importierter Bilder. Importiere ein Bild, um es mitzuliefern: Eine auf diese Weise erzeugte URL benennt die Datei, sie packt sie aber nicht ins Paket.

Bitmap-Bilder werden außerdem mit `draw_image` / `drawImage` auf ein Canvas gezeichnet ([Canvas](./canvas.md)), und Verläufe ersetzen viele dekorative Bilder ([Styling](./styling.md#gradients)).

<a id="related"></a>

## Siehe auch

- [image-Element](../elements/image.md): alle Props, mit `getSize` und `prefetch`.
- [Listen](./lists.md): Lange Listen von Bildern recyceln ihre Views.
