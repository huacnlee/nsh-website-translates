---
title: "Struttura del progetto"
description: "I file di un'app NSH in Rust o TSX, ogni chiave di nsh.json, la configurazione di TypeScript in .nsh/types, gli asset e il modo in cui vengono importati moduli e pacchetti."
order: 5
group: start
source_hash: 67da39e1182fc05c
---

# Struttura del progetto

Un'app NSH è una directory con un `nsh.json` e il suo codice: un crate Rust il cui componente root è indicato da `nsh.json`, oppure un modulo di ingresso TSX, oppure entrambi. Tutto il resto (altri moduli, immagini, font, file JSON) viene trovato a partire da lì: i moduli di un crate e la sua directory `assets/`, oppure i file importati dall'entry TSX, quindi non c'è nessun elenco di file da mantenere.

Un'app scritta in Rust è un progetto Cargo:

```text
my-app/
├── nsh.json           name, id, version, icon, the crate ("rust") and its root component ("root"), theme
├── Cargo.toml         the crate: nsh-core, nsh-base and your dependencies
├── src/
│   ├── lib.rs         the root component and the crate's UI set (#[native_module])
│   ├── main.rs        cargo run: the root on this machine's desktop backend
│   └── screens/       your own modules (any layout you like)
├── assets/            files the crate ships: asset!("logo@2x.png"), fonts
├── .gitignore         .nsh/ and target/
├── .nsh/              generated: the runners' sources, test entries, build output (.nsh/out)
└── target/            Cargo's build directory
```

Un'app TSX è un entry e i moduli che importa:

```text
my-app/
├── App.tsx            the entry module: calls mount()
├── App.test.tsx       its tests (nsh test)
├── nsh.json           name, id, version, icon, Tailwind theme, capabilities
├── tsconfig.json      TypeScript settings for editors
├── .gitignore         .nsh/ and target/
├── components/        your own modules (any layout you like)
│   └── Header.tsx
├── assets/
│   ├── logo@2x.png    imported images
│   └── Inter.ttf      imported fonts
└── .nsh/              generated: type declarations, development host builds, test entries, build output (.nsh/out)
```

Un'app che usa entrambi elenca i propri crate in `"rust"` e ha un entry TSX che li importa ([Compilare con Rust](./rust.md#extending-a-rust-app-with-tsx)).

Ogni comando riceve come argomento la directory dell'app o il suo entry (`nsh run my-app`, `nsh run my-app/App.tsx`). La directory di `nsh.json` e dell'entry è la root dell'app: `nsh.json` viene letto da lì, i percorsi degli asset sono relativi a essa e `.nsh/` viene scritto lì. In un'app Rust (`nsh.json` `"root"`), la directory esegue il componente root; indicando invece un entry TSX, viene eseguito quest'ultimo.

<a id="the-root-component"></a>

## Il componente root

La root di un'app Rust è un componente del suo crate, che `"root"` di `nsh.json` indica tramite il suo percorso nel crate (`App`, `shell::Gallery`). Un entry TSX è un normale modulo che termina eseguendo il rendering del componente root:

```rust tabs
// src/lib.rs; nsh.json: { "rust": ".", "root": "App" }
mod screens;

use nsh_core::prelude::*;

/// What a TSX entry may import from the crate.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>().assets(assets!());
}

#[component]
pub fn App() -> impl IntoElement {
    screens::home()
}
```

```tsx tabs
// App.tsx
import { mount } from "nsh";
import { Home } from "./components/Home";

function App() {
  return <Home />;
}

mount(App);
```

`nsh run` e `nsh package` montano una root Rust su ogni piattaforma, senza QuickJS. In TSX, `mount(component, props?)` esegue il rendering del componente nella superficie dell'app e restituisce una funzione che lo rimuove di nuovo; un'app la chiama una sola volta. Il codice al livello superiore dell'entry viene eseguito quando il bundle viene caricato, prima del primo frame.

## nsh.json

`nsh.json` si trova nella root dell'app. `nsh init` scrive `name`, `id`, `version` e `build` e, per un'app Rust, il crate e il suo componente root:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "rust": ".",
  "root": "App",
  "theme": "theme.json"
}
```

Ogni altra chiave è facoltativa; un'app TSX può anche omettere le quattro. Il `nsh.json` di un'app TSX potrebbe essere così:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png",
  "tailwind": {
    "colors": { "brand": { "500": "#7c3aed", "600": "#6d28d9" } },
    "radius": { "card": 14 }
  },
  "capabilities": {
    "network": { "hosts": ["api.example.com", "*.cdn.example.com"] }
  }
}
```

| Chiave | Tipo | Usata da | Descrizione |
|---|---|---|---|
| `name` | string | `package` | Il nome visualizzato sotto l'icona dell'app. Predefinito: il nome della directory dell'entry. |
| `id` | string | `package`, `publish`, `Storage` | Bundle identifier / application id in formato reverse-DNS, ad es. `com.yourcompany.app`; richiesto da `package` e `publish`. `nsh run` usa `com.example.<name>` se manca. |
| `version` | string | `package`, `publish` | La versione visibile all'utente, ad es. `1.2.0` (`CFBundleShortVersionString`, Android `versionName`). |
| `build` | number | `package`, `publish` | Il numero di build (`CFBundleVersion`, Android `versionCode`). I pacchetti firmati richiedono che cresca a ogni release. |
| `minRuntime` | string | `publish` | Il runtime NSH più vecchio in grado di eseguire il pacchetto firmato, ad es. `0.2.0`. Predefinito: la versione della CLI ([Pacchetti firmati](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | string | `package` | Un PNG quadrato, idealmente 1024×1024, relativo a `nsh.json`. |
| `tailwind` | object | ogni build | Estende il tema Tailwind rispetto al quale vengono risolte le tue stringhe `class` ([Tailwind](./tailwind.md#theme)). |
| `appearance` | string | ogni build, `package` | `"light"`, `"dark"` oppure `"system"` (il valore predefinito): un'app sempre chiara o sempre scura lo dichiara qui. Le classi `colorScheme()`, `dark:`, il tema dei componenti e i controlli della piattaforma lo seguono fin dall'avvio ([Dispositivo e ambiente](./device-and-environment.md#dark-mode)). |
| `theme` | string or object | ogni build | I design token dell'app (`cssVars` di shadcn/ui, sopra il tema predefinito `neutral`), con cui disegnano le classi token, `token()` e i componenti Rust: il percorso di un file di tema relativo a `nsh.json`, oppure il tema inline ([Compilare con Rust](./rust.md#theme), [Token del tema](./tailwind.md#theme-tokens)). |
| `statusBar` | object | ogni build, `package` | Il valore predefinito della barra di stato sotto ogni pagina e dialog (iOS e Android): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, entrambi facoltativi. Le app iOS pacchettizzate la mostrano già dalla schermata di avvio ([Barra di stato](../modules/nsh-base.md#status-bar)). |
| `capabilities` | object | ogni build | Ciò a cui l'app può accedere al di fuori della propria VM: host di rete, host delle web view, la barra di stato ([Sandbox e capabilities](./sandbox-and-capabilities.md)). |
| `resolve` | object | ogni build | Come vengono risolti gli import non relativi: le export condition dei pacchetti npm e gli alias ([Pacchetti npm](#npm-packages)). |
| `rust` | string or string[] | ogni comando | Il crate Rust dell'app, o un elenco di crate, relativi a `nsh.json`: i loro componenti e moduli, che TSX importa tramite lo specifier `#[native_module]` di ciascun crate ([Compilare con Rust](./rust.md#several-crates)). |
| `web` | object | `package` | Ciò che un pacchetto web aggiunge alla propria pagina. `web.host`: un modulo JS relativo a `nsh.json` che esporta `createHost(player)`, il quale risponde alle chiamate [`host`](../modules/nsh.md#host) dell'app; `web.connect`: gli host raggiunti dalle richieste di quel modulo, come pattern di `capabilities.network.hosts`, che la Content-Security-Policy della pagina consente ([Web](./web.md#the-hosts-functions)). |
| `root` | string | `run`, `package` | Il componente root di un'app Rust, il suo percorso nel crate `rust`, il primo di un elenco (`App`, `shell::Gallery`): `nsh run` e `nsh package` della directory dell'app lo montano senza QuickJS, su ogni piattaforma; `nsh run App.tsx` esegue comunque l'entry TSX ([Compilare con Rust](./rust.md)). |

I flag di `nsh package` e `nsh publish` (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) sovrascrivono i valori del file ([CLI](./cli.md)).

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` e `resolve` vengono verificati quando l'app viene compilata. Un errore di battitura è un errore di build, anziché un'impostazione che silenziosamente non fa nulla:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

Senza la chiave `capabilities`, un'app può usare liberamente la rete, le web view e la barra di stato: un'app standalone appartiene al suo sviluppatore. Con la chiave, tutto ciò che non è elencato viene negato, sia in sviluppo sia nelle app pacchettizzate:

```json
"capabilities": {
  "network": {
    "hosts": ["api.example.com", "*.cdn.example.com"],
    "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }]
  },
  "webview": { "hosts": ["*.example.com"] },
  "statusBar": true
}
```

`network` copre `fetch`, le immagini remote e le sorgenti video; gli asset locali sono sempre consentiti. Un'app che incorpora NSH può concedere meno di quanto un'app dichiara. I dettagli sono in [Sandbox e capabilities](./sandbox-and-capabilities.md).

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json e .nsh/types

NSH non ha bisogno di `node_modules`. Al suo posto, ogni comando che compila l'app (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`) scrive in `.nsh/types` le dichiarazioni TypeScript di tutto ciò che NSH fornisce, e le impostazioni TypeScript di NSH in `.nsh/tsconfig.json`. Il `tsconfig.json` dell'app le estende:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` fa puntare gli import `nsh` e i crate della tua app a `.nsh/types`, include le dichiarazioni dei globali, degli asset e dei token, e imposta le opzioni del compilatore usate dalle app NSH (`lib`, `jsx`, `strict`, ...). NSH lo mantiene aggiornato: quando una nuova versione aggiunge una libreria o un percorso, la tua app lo ottiene con la build successiva, e il tuo `tsconfig.json` resta come lo hai scritto. Le opzioni che aggiungi a `tsconfig.json` hanno la precedenza su quelle di NSH.

| File in `.nsh/types/nsh/` | Dichiara |
|---|---|
| `index.d.ts` | `nsh`: `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... e riesporta i tipi qui sotto |
| `types.d.ts` | Gli stili (`ViewStyle`, `TextStyle`, ...), le props e gli eventi di ogni elemento, i ref (`ViewRef`, `InputRef`, ...: ciò che riceve un `ref`) |
| `jsx-runtime.d.ts` | Il runtime JSX che TypeScript risolve tramite `jsxImportSource` (il namespace `JSX`) |
| `globals.d.ts` | `If` e `Each`; `console`, i timer, `requestAnimationFrame`, `fetch` e le altre [API globali](../modules/globals.md) |
| `assets.d.ts` | Ciò che restituisce l'importazione di un'immagine o di un font |
| `tokens.d.ts` | `Tokens`: i design token dell'app, dal suo `"theme"`, che tipizzano [`token()`](../modules/nsh.md#token) |
| `mobile.d.ts`, `desktop.d.ts` | Un file per modulo (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` è `ES2023` senza `DOM`: non ci sono `document` né `window`. I file in `.nsh` vengono rigenerati (solo quando il loro contenuto cambia), quindi non modificarli e non committarli; `.gitignore` esclude già `.nsh/`. Se dopo aver clonato un progetto il tuo editor mostra `nsh` come mancante, esegui una volta un qualsiasi comando di build, ad es. `nsh check`.

`.nsh/tsconfig.json` aggiunge `"ESNext.Disposable"`, che dichiara le dichiarazioni `using` e `Symbol.dispose`, che il runtime possiede: `using account = new Account()` libera il valore di una [classe Rust](./rust.md) alla fine del blocco. Le sue `jsxImportSource: "nsh"` e `jsx: "preserve"` interessano solo l'editor: NSH compila il JSX con il proprio compilatore, qualunque cosa dica `tsconfig.json`. TypeScript viene controllato dal tuo editor o da `nsh check`; gli altri comandi rimuovono i tipi senza controllarli.

Un'app creata da un `nsh init` precedente ottiene il nuovo `tsconfig.json` con la build successiva se il suo è il template di NSH, invariato; NSH stampa una riga per segnalarlo. Un `tsconfig.json` che hai modificato è tuo: `nsh check` segnala quando non estende `./.nsh/tsconfig.json`, e tu aggiungi la riga `extends` e rimuovi le opzioni che essa imposta.

<a id="modules"></a>

## Moduli

Il codice di un'app Rust sono i moduli del suo crate (`mod screens;`), e le sue dipendenze provengono da crates.io come quelle di qualsiasi crate; i crate di NSH sono `nsh-core` (le primitive, i signal e gli stili tipizzati, `use nsh_core::prelude::*`) e `nsh-base` (i componenti di base e il tema).

In TSX, suddividi l'app in quanti moduli `.ts` e `.tsx` vuoi e importali con percorsi relativi; l'estensione può essere omessa:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

Tutti vengono raggruppati in un unico script. I file JSON vengono importati come il loro valore analizzato.

<a id="loading-code-on-demand"></a>

### Caricamento del codice su richiesta

`import()` di uno dei moduli dell'app restituisce una promise delle sue esportazioni, come in un browser:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

Le app sui dispositivi distribuiscono un solo bundle, quindi il modulo è già presente e la promise si risolve subito. Un'app web pubblicata in forma suddivisa (`nsh build --split`) ottiene il modulo, e ciò che solo esso usa, come file separato che viene scaricato la prima volta che `import()` lo richiede ([Web](./web.md#split-bundles)). Lo specifier deve essere un percorso relativo letterale: il bundler deve vedere quale modulo si intende.

<a id="nshs-modules"></a>

### I moduli di NSH

Gli import di `nsh` e `nsh/...` non vengono inclusi nel bundle: il runtime li fornisce in modo nativo.

| Modulo | Cosa contiene |
|---|---|
| `nsh` | La reattività (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context`; le primitive `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (`selectable` di `View` per la selezione del testo); i safe area inset (`safeArea`, `safeAreaInsets`) e la tastiera software (`Keyboard`, `keyboardFrame`); le animazioni native; `PanResponder`; l'ambiente (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`); lo stato dello screen reader e della riduzione del movimento, gli annunci; gli appunti, il selettore di foto, lo storage, il canale host, le scorciatoie da tastiera; i componenti e le funzioni registrati dall'app che incorpora ([riferimento](../modules/nsh.md)) |
| `nsh/base` | Le fondamenta senza stile dell'interfaccia di un'app: gli stack di navigazione e le loro pagine (`NavStack`, `NavPage`, `createNavStack`), i dialog (`Dialog`), un bersaglio di pressione (`Button`), un input di testo (`Input`) e il dialog di avviso del sistema (`AlertDialog`); pagine e dialog impostano la barra di stato (`statusBar`) ([riferimento](../modules/nsh-base.md)) |
| `nsh/mobile` | Ciò che offrono iOS e Android: `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([riferimento](../modules/nsh-mobile.md)) |
| `nsh/desktop` | Ciò che offrono macOS, Windows e Linux: `Window`, `titleBar`, `Menu` ([riferimento](../modules/nsh-desktop.md)) |

Il [riferimento dei moduli](../modules/index.md) documenta ciascuno di essi. Importare un modulo che NSH non ha (`nsh/foo`) è un errore di build. Lo è anche usare nel codice un nome che il modulo non esporta (`import { Buton } from "nsh/base"`): l'errore punta all'import e indica l'esportazione più simile (``did you mean `Button`?``). I nomi usati solo come tipi sono verificati da `nsh check`.

<a id="npm-packages"></a>

### Pacchetti npm

NSH non richiede nulla da npm, ma il bundler risolve gli import non relativi da una directory `node_modules` se installi pacchetti con un package manager. I pacchetti risolvono le loro build per browser, perché il runtime fornisce le API web (`fetch`, stream, `URL`, `TextEncoder`, ...) e non quelle di Node (`fs`, `Buffer`, `process`). I pacchetti che toccano il DOM non funzionano: non ce n'è uno.

Un pacchetto la cui build per browser usa il DOM ha spesso un'altra build per i worker o per React Native. `resolve.conditions` sceglie le export condition con cui i pacchetti vengono risolti, al posto del valore predefinito `["browser"]`: `import`, `require`, `module` e `default` si applicano sempre, e senza `browser` i pacchetti vengono risolti tramite i loro campi `module` e `main`. `resolve.alias` sostituisce un import: con un percorso relativo a `nsh.json` (`./` o `../`), con un altro pacchetto, oppure con `false` per un modulo vuoto. TypeScript (`nsh check`, editor) tipizza l'import così com'è scritto: un nome che non è un pacchetto installato ottiene i propri tipi da un file `.d.ts` dell'app.

```json
"resolve": {
  "conditions": ["worker"],
  "alias": { "dom-only-helper": "./shims/helper.ts", "node-polyfill": false }
}
```

```ts
// shims/aliases.d.ts
declare module "node-polyfill";
```

`solid-js` non può essere importato: il bundler lo rifiuta e rimanda a `signal`, `computed` e `effect` propri di `nsh`, che lo sostituiscono.

<a id="assets"></a>

## Asset

Immagini e font vengono distribuiti con l'app. Un crate Rust legge ogni file della sua directory `assets/` in fase di compilazione con `asset!`, e li distribuisce tutti con `registry.assets(assets!())` nella sua funzione `#[native_module]`; TSX li importa come moduli, e il bundler registra ogni file importato (e le varianti di densità di pixel di un'immagine). `nsh build` li copia in `.nsh/out/assets/`, `nsh package` li inserisce nell'app e durante lo sviluppo vengono serviti all'app.

```rust tabs
use nsh_core::element::{FontAsset, ImageAsset, asset};

const LOGO: ImageAsset = asset!("logo@2x.png");      // its url, and its size: 64×64 points
const INTER: FontAsset = asset!("Inter.ttf");        // its uri, and its family: "Inter"

image(LOGO)
text("Hello").font_family(INTER.family)
```

```tsx tabs
import { Image, Text } from "nsh";
import logo from "./assets/logo@2x.png";   // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
import Inter from "./assets/Inter.ttf";     // "Inter"

<Image src={logo} />
<Text style={{ fontFamily: Inter }}>Hello</Text>
```

| Estensione | L'import restituisce |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | Un `ImageAsset`: `{ url, size, scales? }`, dimensionato in punti. Un suffisso `@2x` / `@3x` divide la dimensione in pixel per 2 / 3. Un file senza suffisso distribuisce anche i suoi fratelli `@1.5x`–`@4x`, elencati in `scales`, e viene caricata la variante adatta allo schermo ([densità di pixel](./images-and-assets.md#pixel-densities)). |
| `.svg` | Un `ImageAsset` dimensionato in punti da `width` e `height` dell'SVG (o `viewBox`). |
| `.ttf`, `.otf`, `.woff`, `.woff2` | Il nome della famiglia del font, una stringa. Il font viene registrato prima del primo frame. |
| `.json` | Il JSON analizzato |

Vedi [Immagini e asset](./images-and-assets.md) e [Font](./fonts.md).
<a id="generated-directories"></a>

## Directory generate

- **`.nsh/`**: tutto ciò che NSH genera: le dichiarazioni dei tipi (`.nsh/types`), i sorgenti dei runner di un'app Rust (`.nsh/rust`), ciò che `nsh run` installa su simulatori e dispositivi (l'app host Catalyst, l'APK di sviluppo Android) e `.nsh/out`, l'output predefinito di `nsh build` (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/`; per un'app Rust, `app.json` e `assets/`) e di `nsh package` (`.app`, `.ipa`, `.apk`, un sito); `-o` scrive altrove. Si può eliminare senza problemi; viene ricreata.
- **`target/`**: la directory di build di Cargo per i crate e i runner di un'app (oppure `CARGO_TARGET_DIR`).
