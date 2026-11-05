---
title: "Font"
description: "Il font di sistema e le famiglie generiche, gli elenchi di fallback, la distribuzione di file .ttf, .otf, .woff e .woff2 dagli asset di un crate Rust o da import TSX, le famiglie con più pesi e corsivi, e i font negli stili tipizzati e nelle classi Tailwind."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# Font

Il testo usa il font di sistema (San Francisco su iOS, Roboto su Android) a meno che una famiglia di font non indichi diversamente (`.font_family(..)` in Rust, `fontFamily` in TSX). Una famiglia può essere una famiglia generica, un font installato sul dispositivo o un file di font distribuito con l'app.

<a id="system-and-generic-families"></a>

## Famiglie di sistema e generiche

| `fontFamily` | Font |
|---|---|
| (nessuna), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | Il font di sistema |
| `"serif"`, `"ui-serif"` | Il serif di sistema (New York su iOS, Noto Serif su Android) |
| `"monospace"`, `"ui-monospace"` | Il font monospazio di sistema (SF Mono su iOS) |
| `"ui-rounded"` | Il font di sistema arrotondato (SF Pro Rounded), solo iOS |

Il font di sistema supporta ogni peso da 100 a 900. Le classi Tailwind `font-sans`, `font-serif` e `font-mono` corrispondono alle prime tre righe, mentre `font-sans` e `font-mono` corrispondono ai font del tema, quando questo li imposta ([Un font predefinito per l'app](#a-default-font-for-the-app)).

Una famiglia installata sul dispositivo può essere indicata direttamente per nome (`"Georgia"`, `"Avenir Next"` su iOS). I font installati variano tra piattaforme e versioni, quindi distribuisci con l'app i font da cui dipende il tuo design. Su iOS, una famiglia inesistente ripiega sul font di sistema con un avviso nel log (`font family 'X' is not available`); indica un elenco di famiglie per scegliere quale usare in alternativa ([Elenchi di fallback](#fallback-lists)).

<a id="shipping-a-font"></a>

## Distribuire un font

Un crate Rust distribuisce i file della propria directory `assets/`: `registry.assets(assets!())` nella sua funzione `#[native_module]` li distribuisce tutti, e `asset!("fonts/Pacifico-Regular.ttf")` è un `FontAsset` il cui `family` è il nome della famiglia del font, letto dal file quando il crate viene compilato. In TSX, importa un file `.ttf`, `.otf`, `.woff` o `.woff2`: l'import restituisce il nome della famiglia del font. In entrambi i casi il font viene registrato prima del primo frame, quindi è pronto quando il testo viene renderizzato per la prima volta. I file WOFF e WOFF2 sono font TrueType o OpenType compressi (un file WOFF2 pesa spesso la metà del TrueType corrispondente, con un risparmio per il pacchetto dell'app e per i download sul web): NSH li legge come i font che contengono, su ogni piattaforma:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` e l'import TSX `Pacifico` sono la stringa `"Pacifico"`: il nome della famiglia memorizzato nel file del font (il suo nome di famiglia tipografico o, in mancanza, il nome di famiglia), non il nome del file. Usare il valore dell'asset invece di scrivere il nome a mano mantiene i due allineati; un file mancante o danneggiato fa fallire la build Rust, e un file importato viene incluso nel bundle con certezza.

I file vengono distribuiti con l'app come qualsiasi altro [asset](./images-and-assets.md). I font sono registrati solo per il processo dell'app; non vengono installati sul dispositivo.

> [!WARNING]
> In TSX, un import il cui valore non viene mai usato viene rimosso dall'import elision di TypeScript, e con esso il font. Se ti riferisci a una famiglia solo per nome (per esempio nel tema Tailwind), importa il file per il suo effetto collaterale: `import "./fonts/Inter-Bold.ttf";`. Un crate Rust distribuisce ogni file di `assets/` tramite `assets!()`.

<a id="fallback-lists"></a>

## Elenchi di fallback

`fontFamily` accetta un elenco, come in CSS: famiglie separate da virgole, la più preferita per prima, un nome con spazi tra virgolette oppure no (`"Brand, 'Noto Sans SC', sans-serif"`), un nome tra virgolette che mantiene le proprie virgole (`'ACME, Inc'`). Il testo viene composto nella prima famiglia disponibile sulla piattaforma, e un carattere che quella famiglia non possiede (un'altra scrittura, un simbolo) viene preso dalla successiva famiglia dell'elenco che lo contiene, poi dai font di fallback del sistema. Un elenco permette a un font di marca che copre solo il latino di mostrare il cinese con un font coordinato, oppure di indicare un font che l'app scarica insieme a un font di sistema da mostrare finché non arriva:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

Ogni piattaforma rispetta l'ordine dell'elenco con il proprio meccanismo per i font: una cascade list su iOS e macOS, un font fallback su Windows (uno per paragrafo: l'elenco del suo primo stile), un elenco di famiglie Pango su Linux, quello del browser sul web, i fallback di GPUI. Su Android, il testo viene composto nella prima famiglia disponibile; quando questa è un font registrato dall'app, i font registrati che la seguono nell'elenco sono i suoi fallback (Android 10 e successivi).

<a id="weights-and-italics"></a>

## Pesi e corsivi

Una famiglia è di solito composta da più file, uno per peso e stile. Distribuisci ciascuno (mettili in `assets/` in Rust, importa ciascuno in TSX); vengono registrati con lo stesso nome di famiglia, e il peso e lo stile scelgono la variante:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

Quando nessuna variante registrata ha esattamente il peso richiesto, viene usata la più vicina. Le piattaforme si comportano diversamente quando una variante manca:

| | iOS | Android |
|---|---|---|
| Peso senza variante | La variante registrata più vicina | La variante più vicina, con il grassetto sintetico di Android dove applicabile |
| Corsivo senza variante corsiva | La variante dritta (nessuna inclinazione) | Una versione inclinata della variante dritta |

Distribuisci le varianti che usi per ottenere lo stesso risultato su entrambe.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Font negli stili tipizzati e nelle classi Tailwind

In Rust, `.font_family(..)` accetta la famiglia dell'asset ovunque sia previsto uno stile, e i metodi per il peso (`.font_weight(FontWeight::SEMIBOLD)`) selezionano le varianti. Per le classi, assegna un nome alle tue famiglie nel tema Tailwind in `nsh.json` per usarle come classi `font-*`:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

Una famiglia arbitraria funziona senza una voce nel tema: `font-[Pacifico]`. Le classi di peso (`font-light`, `font-semibold`, `font-bold`, ...) selezionano le varianti come fa `fontWeight`. Gli stili di testo su una vista si propagano ai testi al suo interno, quindi `.font_family(INTER.family)` su una vista, o `<View class="font-body">`, imposta la famiglia per un'intera schermata.

<a id="a-default-font-for-the-app"></a>

## Un font predefinito per l'app

Il `font-sans` del tema è il font dell'app: ogni testo che non imposta una propria famiglia viene disegnato con esso, sia nei componenti Rust sia in TSX, come accade in una pagina web con il `--font-sans` di Tailwind. `font-mono` è il font monospazio, della classe `font-mono` e del codice in `TextView`. Impostali nel tema dell'app (`"theme"` in `nsh.json`, [Rust](./rust.md#theme)) e distribuisci i file dei font come descritto sopra:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

La prima famiglia dell'elenco che non sia generica è il font; una prima famiglia generica (`system-ui`, `sans-serif`) è il font di sistema. Il font può essere impostato anche su un contenitore: i testi al suo interno lo ereditano.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## Funzionalità dei font

`fontVariant` attiva le funzionalità OpenType del font: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` e `"small-caps"` (`.tabular_nums()`, `.small_caps()`, ... in Rust; [Testo](./text.md#text-styles)). Il font deve contenerle; i font di sistema le contengono.

<a id="related"></a>

## Vedi anche

- [Testo](./text.md): stili di testo, dimensioni e l'impostazione di sistema per la dimensione del testo.
- [Tailwind](./tailwind.md#theme): le chiavi del tema.
- [Immagini e asset](./images-and-assets.md): come vengono distribuiti i file dell'app.
