---
title: "Immagini e asset"
description: "Come mostrare immagini in Rust e TSX: gli asset dell'app e i file @2x, le immagini SVG, gli URL remoti, le modalità di ridimensionamento, i segnaposto, la sfocatura, la tinta, gli eventi di caricamento, la lettura delle dimensioni di un'immagine e il suo prefetch."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---

# Immagini e asset

L'elemento image (`image(..)` in Rust, `<Image>` in TSX) mostra una bitmap o un disegno SVG: un file distribuito con l'app, oppure un'immagine scaricata da un URL. Le immagini vengono lette e decodificate fuori dal main thread, ridotte alla dimensione con cui la vista le mostra e messe in cache; il main thread si limita a visualizzare il risultato decodificato.

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

Le prop dell'elemento sono elencate in [image](../elements/image.md).

<a id="images-in-the-app"></a>

## Immagini nell'app

Un crate Rust tiene i propri file nella directory `assets/`: `asset!("logo@2x.png")` (il percorso relativo a `assets/`) è un `ImageAsset`, `{ url, size, scales }`, letto quando il crate viene compilato, e `registry.assets(assets!())` nella funzione `#[native_module]` del crate distribuisce con l'app tutti i file della directory. In TSX, importa un file immagine come un modulo: l'import restituisce un `ImageAsset`, `{ url, size, scales? }`, e il bundler distribuisce il file con l'app:

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

File supportati: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` e `.svg` ([immagini SVG](#svg-images)).

**Le dimensioni sono in punti.** Un suffisso `@2x` o `@3x` nel nome del file indica che il file ha 2 o 3 pixel per punto, quindi `logo@2x.png` di 128×128 pixel è un asset di 64×64 punti. Senza suffisso, un pixel corrisponde a un punto. Un file con il suffisso nel nome è quello che viene mostrato; un file senza suffisso mostra le sue [varianti di densità di pixel](#pixel-densities) quando ne ha.

**Dimensione naturale.** Un'immagine proveniente da un asset viene disposta alla sua dimensione naturale quando lo stile lascia aperta la larghezza o l'altezza, quindi `image(LOGO)` e `<Image src={logo} />` non richiedono alcuno stile. Imposta una dimensione e il rapporto d'aspetto, oppure entrambe le dimensioni, per ottenere un'altra misura.

In Rust, un file mancante o danneggiato fa fallire la build, e un file modificato ricompila il crate. In TSX, gli asset vengono risolti relativamente al modulo che li importa, e il loro `url` è relativo alla radice dell'app (la directory dell'entry). `nsh build` li copia in `out/assets/`, `nsh package` li inserisce nell'app e, durante lo sviluppo, li serve il dev server.

> [!TIP]
> In TSX, `src` accetta anche stringhe `asset:/path`, e i file importati sono gli unici di cui è garantita la distribuzione. Un percorso che non viene mai importato funziona con il dev server, che serve l'intera directory dell'app, ma manca nelle app pacchettizzate. Importa ogni immagine che usi. Un crate Rust distribuisce l'intera directory `assets/` tramite `assets!()`.

<a id="pixel-densities"></a>

### Densità di pixel

Dai al file un nome senza suffisso e metti accanto a esso le versioni più dense: l'app carica quella adatta allo schermo:

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

- `asset!` e il bundler cercano i file affiancati `@1.5x`, `@2x`, `@3x` e `@4x` di un'immagine il cui nome è senza suffisso. `scales` li elenca, con 1 per il file indicato per nome; un'immagine senza file affiancati non ha scale (in TSX viene importata come `{ url, size }`). Il bundler distribuisce i file affiancati che trova, e `assets!()` distribuisce l'intera directory.
- L'immagine carica la scala più piccola che sia almeno pari al rapporto di pixel dello schermo, altrimenti la più grande, come fa React Native: `logo.png` su uno schermo 1×, `logo@2x.png` su uno 2×, `logo@3x.png` su un telefono 3× (e a 2.625). Sul web viene scaricato solo quel file.
- Quando il rapporto di pixel cambia (una finestra spostata su un altro schermo, lo zoom del browser), le immagini la cui scelta cambia vengono caricate di nuovo, con i relativi [eventi di caricamento](#load-events). La loro dimensione resta quella del file indicato per nome, in punti.
- Una variante i cui pixel non corrispondono alla dimensione del file indicato per nome moltiplicata per la sua scala genera un avviso di build in TSX e fa fallire la build in Rust.
- Un file con un suffisso di densità nel nome (`./logo@3x.png`, `asset!("logo@3x.png")`) è quel file e basta.
- Un'[immagine SVG](#svg-images) viene disegnata per lo schermo a qualsiasi rapporto, quindi non distribuisce varianti.

Va bene anche un solo file: esportalo alla densità più alta che ti serve (`@3x` per il risultato più nitido su ogni telefono) e dagli il suffisso nel nome; le immagini vengono ridotte alla dimensione dello schermo durante la decodifica. Le varianti permettono a ogni schermo di scaricare, decodificare e conservare il file che gli si adatta.

<a id="svg-images"></a>

## Immagini SVG

Importa un file `.svg` come qualsiasi immagine. La sua dimensione in punti è data da `width` e `height` (o da una sola delle due, con l'altra ricavata dal rapporto d'aspetto del `viewBox`), altrimenti dal suo `viewBox`: un pixel CSS dell'SVG è un punto, e i suffissi `@2x` lasciano i file SVG così come sono.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

Un SVG è nitido alla dimensione con cui viene mostrato. Il browser lo disegna come vettori; iOS, macOS e Android lo disegnano, in pixel, alla dimensione con cui la vista lo mostra quando l'immagine viene caricata (come avviene per la riduzione delle bitmap; una vista che si ingrandisce in seguito scala quel disegno, finché l'immagine non viene caricata di nuovo); Windows, Linux e GPUI lo disegnano una volta a quattro pixel per punto (fino a 2048 pixel per lato) e lo scalano per ogni vista. Tutto il resto funziona come per le bitmap: `objectFit`, `tintColor` (attraverso le forme opache dell'SVG, così le icone monocolore seguono il tema), filtri, `blurRadius`, segnaposto, eventi di caricamento, `Image.getSize` e `Image.prefetch`. `onLoad` e `Image.getSize` riportano la dimensione di un SVG in punti interi; l'immagine viene disposta alla sua dimensione esatta. Anche i file SVG remoti si caricano allo stesso modo, tramite gli stessi download e gli stessi controlli di [capability](./sandbox-and-capabilities.md); NSH riconosce un SVG dal suo contenuto (anche compresso con gzip, `.svgz`), qualunque sia la fine del suo URL.

**Cosa disegnano le piattaforme native.** iOS, macOS, Android, Windows, Linux e GPUI disegnano gli SVG con un unico renderer (resvg), quindi un disegno appare uguale su ciascuna: forme e tracciati, riempimenti e tratti, gradienti e pattern, clip path e maschere, opacità, filtri e trasformazioni. Testo (`<text>`), animazioni (SMIL e CSS), immagini incorporate (`<image>`) e HTML (`<foreignObject>`) vengono mostrati nel browser; le piattaforme native disegnano il resto dell'SVG, in modo statico, e `nsh build` indica i file che li usano. Esporta il testo come contorni (tracciati) per ottenere lo stesso risultato ovunque.

**Un'immagine autosufficiente.** Sulle piattaforme native un SVG disegna solo ciò che contiene: i file, gli URL, le immagini `data:` e gli altri documenti a cui fa riferimento vengono omessi. Le piattaforme native disegnano gli SVG, anche quelli remoti, entro limiti che tengono sotto controllo la memoria: un documento fino a 16 MiB (uno compresso una volta decompresso), un disegno fino a 8192 pixel per lato e 4096 × 4096 pixel in totale (64 MiB; uno più grande viene disegnato più piccolo), e livelli (gruppi con opacità, maschere, clip path e filtri, che il renderer disegna separatamente) fino a 256 MiB in contemporanea. Un SVG che supera il limite del documento o dei livelli non si carica, con `onError`.

**Dimensioni riportate sul web.** Il browser misura gli SVG da sé, importati o remoti: `onLoad` e `Image.getSize` riportano `width` e `height` dell'SVG quando li ha, altrimenti la dimensione che gli assegna il browser, che di norma la ricava da un valore predefinito di 300 × 150 e dal rapporto d'aspetto del `viewBox`. Gli SVG importati vengono disposti alla dimensione del bundler su ogni piattaforma. Dai agli SVG `width` e `height` per ottenere ovunque la stessa dimensione riportata.

<a id="remote-images"></a>

## Immagini remote

Dai all'elemento un URL: una stringa in Rust (una closure per un URL che cambia), una stringa URL in TSX:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **Dai una dimensione alle immagini remote.** La loro dimensione è sconosciuta finché non vengono caricate, quindi senza larghezza e altezza (o una delle due e un rapporto d'aspetto) collassano ad altezza zero.
- **Un colore di sfondo** viene mostrato mentre l'immagine si carica, oppure usa un segnaposto (più avanti).
- I download sono condivisi: più viste che mostrano lo stesso URL lo scaricano una sola volta, anche quando lo decodificano a dimensioni diverse. Un download che nessuno attende più viene annullato.
- Le immagini decodificate sono messe in cache in memoria (la cache viene svuotata in caso di pressione sulla memoria), con chiave composta da URL, dimensione di decodifica e raggio di sfocatura.
- Quando l'app dichiara delle [capability](./sandbox-and-capabilities.md), l'host dell'immagine deve essere consentito in `network`; un'immagine rifiutata fallisce con il relativo evento di errore.

<a id="kept-on-disk"></a>

### Conservate su disco

Le immagini scaricate vengono conservate anche su disco, così come le ha inviate il server, in modo che un'app riaperta (una conversazione piena
di avatar e foto, un feed) mostri le immagini già mostrate in precedenza senza scaricarle di nuovo, anche offline. L'app
non richiede alcuna impostazione: ogni immagine con un URL `http://` o `https://` passa dalla cache su iOS, Android, macOS,
Windows, Linux e GPUI, mentre nel browser fa lo stesso la cache HTTP del browser stesso.

La cache segue le intestazioni HTTP di caching del server:

- Un'immagine viene conservata a meno che la risposta non dica `Cache-Control: no-store`.
- Viene usata senza una richiesta finché è valida: per `max-age`, altrimenti fino a `Expires`, altrimenti per un decimo del tempo
  trascorso da `Last-Modified` (al massimo una settimana).
- Dopo di che viene verificata con il server (`If-None-Match` con il suo `ETag`, `If-Modified-Since` con il suo
  `Last-Modified`): un'immagine invariata (`304`) viene riutilizzata senza scaricarla, una modificata la sostituisce.
- Quando la richiesta fallisce (nessuna rete) o il server restituisce un errore (`5xx`), viene mostrata la copia conservata, a meno che la risposta
  non dicesse `must-revalidate` o `no-cache`.

Ogni app ha una propria cache di 256 MiB; oltre questo limite, le immagini usate meno di recente vengono eliminate per prime. Più viste,
superfici e processi della stessa app la condividono in sicurezza. Le app che incorporano NSH scelgono dove si trova e quanto è grande, oppure la disattivano:

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

`CacheLocation::Off` (`.off`, `noDiskCache()`) non conserva nulla su disco.

Per impostazione predefinita la cache si trova nella directory di cache del sistema: `Library/Caches/nsh` su iOS, `nsh` nella directory di cache
su Android, `~/Library/Caches` su macOS, `%LOCALAPPDATA%` su Windows e `$XDG_CACHE_HOME` (`~/.cache`) su Linux,
con ogni app in `<app id>/images` al suo interno. Il sistema può svuotare queste directory quando ha bisogno di spazio.

<a id="resize-modes"></a>

## Modalità di ridimensionamento

Lo stile `objectFit`, il `object-fit` di CSS (`.object_fit(..)` in Rust), decide come un'immagine riempie un riquadro di forma diversa:

| Valore | Risultato |
|---|---|
| `"cover"` (`ResizeMode::Cover`, predefinito) | Riempie il riquadro, mantenendo il rapporto d'aspetto e ritagliando ciò che eccede |
| `"contain"` (`ResizeMode::Contain`) | Si adatta all'interno del riquadro, mantenendo il rapporto d'aspetto e lasciando bande vuote |
| `"fill"` (`ResizeMode::Stretch`) | Riempie esattamente il riquadro, distorcendo l'immagine |
| `"none"` (`ResizeMode::Center`) | Dimensione naturale, posizionata in `objectPosition` (centrata per impostazione predefinita) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | Dimensione naturale, ridotta per adattarsi dove è più grande |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Le classi Tailwind `object-cover`, `object-contain`, `object-fill`, `object-none` e `object-scale-down` impostano lo stesso stile.

<a id="image-position"></a>

### Posizione dell'immagine

Il punto in cui l'immagine dimensionata si colloca nel suo riquadro è lo stile `objectPosition` (`.object_position(..)` e `.object_top()`, ... in Rust), il `object-position` di CSS: per impostazione predefinita il centro. Un'immagine in modalità cover viene ritagliata attorno a quel punto, una in modalità contain si muove all'interno delle sue bande. Accetta parole chiave (`"top"`, `"left bottom"`), percentuali e lunghezze (`"25% 75%"`, `"10px 0"`) e bordi con offset (`"right 10px bottom 20%"`). In questo modo una foto alta in un fumetto di chat mostra la sua parte superiore:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Le classi Tailwind sono quelle di Tailwind: `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` e valori arbitrari (`object-[25%_75%]`).

<a id="styling-images"></a>

## Stile delle immagini

Le immagini sono viste: accettano raggi degli angoli (anche per singolo angolo), bordi, ombre, opacità e trasformazioni. Gli angoli ritagliano l'immagine.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **Tint** (`.tint_color(..)` in Rust, lo stile `tintColor` in TSX) ricolora i pixel opachi dell'immagine: usalo per le icone monocolore che seguono il tema.
- **I filtri** (`.grayscale(..)`, `.sepia(..)`, `.blur(..)`; `filter` in TSX) si applicano alle immagini su entrambe le piattaforme ([Filters](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## Segnaposto, dissolvenza e sfocatura

| Prop | Rust | Descrizione |
|---|---|---|
| `placeholder` | `.placeholder(..)` | Un'immagine mostrata finché `src` non è stata caricata, un URL o un asset; meglio un asset locale |
| `fadeDuration` | `.fade_duration(ms)` | Millisecondi in cui l'immagine caricata appare in dissolvenza. Predefinito 0 su iOS, 300 su Android |
| `blurRadius` | `.blur_radius(px(..))` | Sfoca l'immagine con questo raggio in punti, applicato una sola volta durante la decodifica |

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

## Immagini animate

I file GIF, WebP e APNG animati vengono riprodotti automaticamente, come asset o da URL. Accettano gli stessi stili, `objectFit` incluso; un'immagine animata con tint mostra il primo fotogramma su iOS.

<a id="load-events"></a>

## Eventi di caricamento

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | Il caricamento inizia |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` in byte (`total` 0 quando sconosciuto) | Durante un download, al massimo ogni 100 ms |
| `onLoad` | `.on_load(..)` | `{ size }` | L'immagine è pronta; la dimensione della sorgente in pixel (quella di un SVG in punti, [sul web come la misura il browser](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (un `&str` in Rust) | Il caricamento o la decodifica sono falliti |
| `onLoadEnd` | `.on_load_end(..)` | | Dopo `onLoad` o `onError` |

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

L'evento di caricamento riporta la dimensione dell'immagine sorgente, non quella a cui è stata decodificata.

Un'immagine con [varianti di densità di pixel](#pixel-densities) carica uno dei suoi file, e l'evento di caricamento riporta i pixel di quel file: 192×192 per `logo@3x.png` su uno schermo 3×, dove `Image.getSize(logo)` restituisce i 64×64 del file importato. Quando il rapporto di pixel cambia e l'immagine carica un'altra variante, anche quel caricamento riporta i propri eventi: `onLoadStart`, poi `onLoad` con la dimensione del nuovo file (oppure `onError`), poi `onLoadEnd`.
<a id="an-images-size-and-prefetching"></a>

## Dimensione di un'immagine e prefetching

Le immagini che non sono sullo schermo possono essere misurate e caricate in anticipo: `image_size(..)` e `prefetch_image(..)` in Rust, `Image.getSize` e `Image.prefetch` (sullo stesso `Image` che renderizza l'elemento) in TSX:

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

| Rust | TSX | Restituisce |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | La dimensione dell'immagine in pixel (quella di un SVG in punti, [sul web come la misura il browser](#svg-images)); un errore quando non può essere caricata |
| `prefetch_image(src)` | `Image.prefetch(src)` | Nulla, una volta caricati i byte dell'immagine; un errore quando non può essere caricata |

In TSX, `src` è una stringa URL o un'immagine importata. Per un'immagine importata con [varianti](#pixel-densities), entrambi caricano la variante che le view caricano su questa schermata, e `getSize` restituisce la dimensione del file importato. Entrambi conservano i byte scaricati per le view che mostreranno l'immagine successivamente, quindi un'immagine precaricata prima di essere mostrata appare senza alcun download.

Un uso comune è dimensionare un'immagine remota in base al suo rapporto d'aspetto:

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

## Altri asset

| File | Rust (`asset!`) | Import in TSX | Pagina |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | Un `FontAsset` con il nome della sua famiglia | Il nome della famiglia del font | [Font](./fonts.md) |
| `.json` e altri file | Un `FileAsset` con il suo URI | `.json`: il valore analizzato, incluso nello script | [Struttura del progetto](./project-structure.md#modules) |

In entrambi i casi i font vengono registrati prima del primo frame.

<a id="reading-a-file-at-run-time"></a>

### Leggere un file a runtime

`fetch` legge un file distribuito con l'app tramite il suo URL `asset:/`, sia in TSX sia in Rust, su ogni piattaforma. Un'immagine importata porta con sé il proprio URL (`url`), i file di un crate Rust hanno il loro da `asset!` (`FileAsset::uri`) e `assets!()`:

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

Il motore legge il file dai file dell'app fuori dal proprio thread (dal dev server durante `nsh run`), senza bisogno di alcuna capability: sono i file dell'app stessa. Un'app web scarica ciò che la pagina non ha precaricato dal luogo in cui serve i propri asset. La risposta è `200` con i byte del file, il suo `Content-Length` e il `Content-Type` derivato dalla sua estensione (`image/png`, `application/json`, ...), e il suo `url` è l'URL `asset:/` indipendentemente da come il file è arrivato; un file che l'app non distribuisce viene rifiutato con un errore di rete che lo nomina. L'URL indica il file tramite il suo percorso all'interno dei file dell'app, e la richiesta lo legge con `GET` (o `HEAD`): un URL il cui percorso esce da essi (`..`, un percorso assoluto) e una richiesta con un altro metodo vengono rifiutati allo stesso modo, prima che venga letto o scaricato qualsiasi cosa.

<a id="a-modules-own-url"></a>

### L'URL di un modulo

In TSX, `import.meta.url` è l'URL del modulo in cui è scritto, quindi `new URL("./data.json", import.meta.url)` indica un file accanto ad esso. I moduli di un'app desktop locale o pacchettizzata hanno URL `file:` nella directory dell'app, che `fs/promises` legge con un permesso `${pluginDir}`; quelli di un'app web sono quelli della pagina; quelli di un'app mobile pacchettizzata sono URL `asset:/` come quelli delle immagini importate. Importa un'immagine per distribuirla: un URL creato in questo modo indica il file, ma non lo include nel pacchetto.

Le immagini bitmap si disegnano anche su un canvas con `draw_image` / `drawImage` ([Canvas](./canvas.md)), e i gradienti sostituiscono molte immagini decorative ([Styling](./styling.md#gradients)).

<a id="related"></a>

## Correlati

- [Elemento image](../elements/image.md): ogni prop, con `getSize` e `prefetch`.
- [Liste](./lists.md): le liste lunghe di immagini riciclano le proprie view.
