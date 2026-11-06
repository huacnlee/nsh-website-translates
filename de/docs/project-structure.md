---
title: "Projektstruktur"
description: "Die Dateien einer NSH-App in Rust oder TSX, jeder Schlüssel von nsh.json, das TypeScript-Setup in .nsh/types, Assets und wie Module und Pakete importiert werden."
order: 5
group: start
source_hash: 67da39e1182fc05c
---


# Projektstruktur

Eine NSH-App ist ein Verzeichnis mit einer `nsh.json` und ihrem Code: einem Rust-Crate, dessen Root-Komponente `nsh.json` benennt, einem TSX-Entry-Modul oder beidem. Alles andere (weitere Module, Bilder, Schriften, JSON-Dateien) wird von dort aus gefunden: über die Module eines Crates und sein Verzeichnis `assets/` bzw. über die Dateien, die der TSX-Entry importiert. Es gibt also keine Dateiliste, die gepflegt werden muss.

Eine in Rust geschriebene App ist ein Cargo-Projekt:

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

Eine TSX-App besteht aus einem Entry und den Modulen, die er importiert:

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

Eine App mit beidem listet ihre Crates in `"rust"` auf und hat einen TSX-Entry, der sie importiert ([Mit Rust bauen](./rust.md#extending-a-rust-app-with-tsx)).

Jeder Befehl nimmt das Verzeichnis der App oder ihren Entry als Argument (`nsh run my-app`, `nsh run my-app/App.tsx`). Das Verzeichnis von `nsh.json` und vom Entry ist das Root der App: Dort wird `nsh.json` gelesen, Asset-Pfade sind relativ dazu, und `.nsh/` wird dort geschrieben. In einer Rust-App (`nsh.json` `"root"`) führt das Verzeichnis die Root-Komponente aus; wird ein TSX-Entry angegeben, wird stattdessen dieser ausgeführt.

<a id="the-root-component"></a>

## Die Root-Komponente

Das Root einer Rust-App ist eine Komponente ihres Crates, die `"root"` von `nsh.json` über ihren Pfad im Crate benennt (`App`, `shell::Gallery`). Ein TSX-Entry ist ein normales Modul, das damit endet, die Root-Komponente zu rendern:

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

`nsh run` und `nsh package` mounten ein Rust-Root auf jeder Plattform, ohne QuickJS. In TSX rendert `mount(component, props?)` die Komponente in die Oberfläche der App und gibt eine Funktion zurück, die sie wieder entfernt; eine App ruft sie einmal auf. Code auf oberster Ebene des Entry läuft, wenn das Bundle geladen wird, vor dem ersten Frame.

## nsh.json

`nsh.json` liegt im Root der App. `nsh init` schreibt `name`, `id`, `version` und `build` und bei einer Rust-App das Crate und seine Root-Komponente:

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

Alle anderen Schlüssel sind optional; eine TSX-App kann auch diese vier weglassen. Die `nsh.json` einer TSX-App könnte so aussehen:

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

| Schlüssel | Typ | Verwendet von | Beschreibung |
|---|---|---|---|
| `name` | string | `package` | Der Anzeigename unter dem App-Symbol. Standard: der Name des Entry-Verzeichnisses. |
| `id` | string | `package`, `publish`, `Storage` | Bundle-Identifier / Application-ID in Reverse-DNS-Form, z. B. `com.yourcompany.app`; erforderlich für `package` und `publish`. `nsh run` verwendet ohne ihn `com.example.<name>`. |
| `version` | string | `package`, `publish` | Die für Nutzer sichtbare Version, z. B. `1.2.0` (`CFBundleShortVersionString`, Android `versionName`). |
| `build` | number | `package`, `publish` | Die Build-Nummer (`CFBundleVersion`, Android `versionCode`). Signierte Pakete verlangen, dass sie mit jedem Release wächst. |
| `minRuntime` | string | `publish` | Die niedrigste NSH-Runtime, die das signierte Paket ausführt, z. B. `0.2.0`. Standard: die Version der CLI ([Signierte Pakete](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | string | `package` | Ein quadratisches PNG, idealerweise 1024×1024, relativ zu `nsh.json`. |
| `tailwind` | object | jeder Build | Erweitert das Tailwind-Theme, gegen das sich Ihre `class`-Strings auflösen ([Tailwind](./tailwind.md#theme)). |
| `appearance` | string | jeder Build, `package` | `"light"`, `"dark"` oder `"system"` (Standard): Eine App, die immer hell oder dunkel ist, legt das hier fest. `colorScheme()`, `dark:`-Klassen, das Theme der Komponenten und die Controls der Plattform folgen dieser Einstellung von Anfang an ([Gerät und Umgebung](./device-and-environment.md#dark-mode)). |
| `theme` | string oder object | jeder Build | Die Design-Tokens der App (shadcn/ui-`cssVars` über dem Standard-Theme `neutral`), mit denen Token-Klassen, `token()` und Rust-Komponenten zeichnen: der Pfad einer Theme-Datei relativ zu `nsh.json` oder das Theme inline ([Mit Rust bauen](./rust.md#theme), [Theme-Tokens](./tailwind.md#theme-tokens)). |
| `statusBar` | object | jeder Build, `package` | Der Standard der Statusleiste unter jeder Seite und jedem Dialog (iOS und Android): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, beide optional. Paketierte iOS-Apps zeigen sie ab dem Launch Screen ([Statusleiste](../modules/nsh-base.md#status-bar)). |
| `capabilities` | object | jeder Build | Worauf die App außerhalb ihrer VM zugreifen darf: Netzwerk-Hosts, Web-View-Hosts, die Statusleiste ([Sandbox und Capabilities](./sandbox-and-capabilities.md)). |
| `resolve` | object | jeder Build | Wie sich Bare Imports auflösen: die Export-Conditions von npm-Paketen und Aliase ([npm-Pakete](#npm-packages)). |
| `rust` | string oder string[] | jeder Befehl | Das Rust-Crate der App oder eine Liste davon, relativ zu `nsh.json`: ihre Komponenten und Module, die TSX über den `#[native_module]`-Specifier jedes Crates importiert ([Mit Rust bauen](./rust.md#several-crates)). |
| `web` | object | `package` | Was ein Web-Paket zu seiner Seite hinzufügt. `web.host`: ein JS-Modul relativ zu `nsh.json`, das `createHost(player)` exportiert und die Aufrufe von [`host`](../modules/nsh.md#host) der App beantwortet; `web.connect`: die Hosts, die die eigenen Anfragen dieses Moduls erreichen, als Muster der Form `capabilities.network.hosts`, die die Content-Security-Policy der Seite erlaubt ([Web](./web.md#the-hosts-functions)). |
| `root` | string | `run`, `package` | Die Root-Komponente einer Rust-App, ihr Pfad im `rust`-Crate, bei einer Liste das erste (`App`, `shell::Gallery`): `nsh run` und `nsh package` des App-Verzeichnisses mounten sie auf jeder Plattform ohne QuickJS; `nsh run App.tsx` führt weiterhin den TSX-Entry aus ([Mit Rust bauen](./rust.md)). |

Die Flags von `nsh package` und `nsh publish` (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) überschreiben die Werte der Datei ([CLI](./cli.md)).

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` und `resolve` werden geprüft, wenn die App gebaut wird. Ein Tippfehler ist ein Build-Fehler statt einer Einstellung, die stillschweigend nichts bewirkt:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

Ohne den Schlüssel `capabilities` darf eine App Netzwerk, Web Views und die Statusleiste frei nutzen: Eine eigenständige App gehört ihrem Entwickler. Mit dem Schlüssel ist alles verboten, was nicht aufgeführt ist, sowohl in der Entwicklung als auch in paketierten Apps:

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

`network` deckt `fetch`, entfernte Bilder und Videoquellen ab; lokale Assets sind immer erlaubt. Eine App, die NSH einbettet, darf weniger gewähren, als eine App deklariert. Die Details stehen unter [Sandbox und Capabilities](./sandbox-and-capabilities.md).

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json und .nsh/types

NSH braucht kein `node_modules`. Stattdessen schreibt jeder Befehl, der die App baut (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`), die TypeScript-Deklarationen von allem, was NSH bereitstellt, nach `.nsh/types` und die TypeScript-Einstellungen von NSH nach `.nsh/tsconfig.json`. Die `tsconfig.json` der App erweitert sie:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` verweist die `nsh`-Imports und die Crates Ihrer App auf `.nsh/types`, bindet die Deklarationen für Globals, Assets und Tokens ein und setzt die Compiler-Optionen, die NSH-Apps verwenden (`lib`, `jsx`, `strict`, ...). NSH hält sie aktuell: Fügt eine neue Version eine Bibliothek oder einen Pfad hinzu, hat Ihre App ihn mit dem nächsten Build, und Ihre `tsconfig.json` bleibt, wie Sie sie geschrieben haben. Optionen, die Sie zu `tsconfig.json` hinzufügen, haben Vorrang vor denen von NSH.

| Datei in `.nsh/types/nsh/` | Deklariert |
|---|---|
| `index.d.ts` | `nsh`: `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... und re-exportiert die folgenden Typen |
| `types.d.ts` | Styles (`ViewStyle`, `TextStyle`, ...), die Props und Events jedes Elements, die Refs (`ViewRef`, `InputRef`, ...: was ein `ref` erhält) |
| `jsx-runtime.d.ts` | Die JSX-Runtime, die TypeScript über `jsxImportSource` auflöst (der Namespace `JSX`) |
| `globals.d.ts` | `If` und `Each`; `console`, Timer, `requestAnimationFrame`, `fetch` und die übrigen [globalen APIs](../modules/globals.md) |
| `assets.d.ts` | Was der Import eines Bildes oder einer Schrift liefert |
| `tokens.d.ts` | `Tokens`: die Design-Tokens der App aus ihrer `"theme"`, die [`token()`](../modules/nsh.md#token) typisieren |
| `mobile.d.ts`, `desktop.d.ts` | Eine Datei pro Modul (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` ist `ES2023` ohne `DOM`: Es gibt weder `document` noch `window`. Die Dateien in `.nsh` werden neu erzeugt (nur wenn sich ihr Inhalt ändert); bearbeiten Sie sie also nicht und committen Sie sie nicht. `.gitignore` schließt `.nsh/` bereits aus. Zeigt Ihr Editor `nsh` nach dem Klonen eines Projekts als fehlend an, führen Sie einmal einen beliebigen Build-Befehl aus, z. B. `nsh check`.

`.nsh/tsconfig.json` fügt `"ESNext.Disposable"` hinzu, das `using`-Deklarationen und `Symbol.dispose` deklariert, die die Runtime hat: `using account = new Account()` gibt den Wert einer [Rust-Klasse](./rust.md) am Ende des Blocks frei. Seine `jsxImportSource: "nsh"` und `jsx: "preserve"` sind nur für den Editor relevant: NSH kompiliert JSX mit seinem eigenen Compiler, unabhängig davon, was `tsconfig.json` vorgibt. TypeScript wird von Ihrem Editor oder von `nsh check` geprüft; die anderen Befehle entfernen die Typen, ohne sie zu prüfen.

Eine App, die mit einem früheren `nsh init` erzeugt wurde, erhält das neue `tsconfig.json` mit ihrem nächsten Build, wenn ihr eigenes unverändert dem Template von NSH entspricht; NSH gibt dazu eine Zeile aus. Ein `tsconfig.json`, das Sie geändert haben, gehört Ihnen: `nsh check` weist darauf hin, wenn es `./.nsh/tsconfig.json` nicht erweitert, und Sie fügen die Zeile `extends` hinzu und entfernen die Optionen, die es setzt.

<a id="modules"></a>

## Module

Der Code einer Rust-App besteht aus den Modulen ihres Crates (`mod screens;`), und ihre Abhängigkeiten kommen wie bei jedem Crate von crates.io; die eigenen Crates von NSH sind `nsh-core` (die Primitives, Signals und typisierten Styles, `use nsh_core::prelude::*`) und `nsh-base` (die Basiskomponenten und das Theme).

In TSX können Sie die App in beliebig viele `.ts`- und `.tsx`-Module aufteilen und mit relativen Pfaden importieren; die Dateiendung darf entfallen:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

Alle werden zu einem Script gebündelt. JSON-Dateien werden als ihr geparster Wert importiert.

<a id="loading-code-on-demand"></a>

### Code bei Bedarf laden

`import()` eines Moduls der App liefert, wie im Browser, ein Promise seiner Exports:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

Apps auf Geräten werden mit einem Bundle ausgeliefert, das Modul ist also bereits vorhanden, und das Promise wird sofort aufgelöst. Eine geteilt veröffentlichte Web-App (`nsh build --split`) erhält das Modul und das, was nur es verwendet, als separate Datei, die beim ersten Aufruf von `import()` heruntergeladen wird ([Web](./web.md#split-bundles)). Der Specifier muss ein literaler relativer Pfad sein: Der Bundler muss erkennen, welches Modul gemeint ist.

<a id="nshs-modules"></a>

### Module von NSH

Imports von `nsh` und `nsh/...` werden nicht gebündelt: Die Runtime stellt sie nativ bereit.

| Modul | Inhalt |
|---|---|
| `nsh` | Reaktivität (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context`; die Primitives `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (`selectable` von `View` für die Textauswahl); Safe-Area-Insets (`safeArea`, `safeAreaInsets`) und die Software-Tastatur (`Keyboard`, `keyboardFrame`); native Animationen; `PanResponder`; die Umgebung (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`); Screenreader- und Reduce-Motion-Status, Ansagen; die Zwischenablage, der Foto-Picker, Storage, der Host-Kanal, Tastenkürzel; Komponenten und Funktionen, die die einbettende App registriert ([Referenz](../modules/nsh.md)) |
| `nsh/base` | Das ungestylte Fundament der UI einer App: Navigation Stacks und ihre Seiten (`NavStack`, `NavPage`, `createNavStack`), Dialoge (`Dialog`), ein Press-Target (`Button`), ein Texteingabefeld (`Input`) und der Alert-Dialog des Systems (`AlertDialog`); Seiten und Dialoge setzen die Statusleiste (`statusBar`) ([Referenz](../modules/nsh-base.md)) |
| `nsh/mobile` | Was iOS und Android bieten: `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([Referenz](../modules/nsh-mobile.md)) |
| `nsh/desktop` | Was macOS, Windows und Linux bieten: `Window`, `titleBar`, `Menu` ([Referenz](../modules/nsh-desktop.md)) |

Die [Modulreferenz](../modules/index.md) dokumentiert jedes dieser Module. Der Import eines Moduls, das NSH nicht hat (`nsh/foo`), ist ein Build-Fehler. Ebenso ein Name, den Ihr Code verwendet und den das Modul nicht exportiert (`import { Buton } from "nsh/base"`): Der Fehler zeigt auf den Import und nennt den ähnlichsten Export (``did you mean `Button`?``). Namen, die nur als Typen verwendet werden, prüft `nsh check`.

<a id="npm-packages"></a>

### npm-Pakete

NSH braucht nichts von npm, aber der Bundler löst Bare Imports aus einem Verzeichnis `node_modules` auf, wenn Sie Pakete mit einem Paketmanager installieren. Pakete werden mit ihren Browser-Builds aufgelöst, weil die Runtime Web-APIs (`fetch`, Streams, `URL`, `TextEncoder`, ...) bereitstellt und nicht die von Node (`fs`, `Buffer`, `process`). Pakete, die das DOM berühren, funktionieren nicht: Es gibt keines.

Ein Paket, dessen Browser-Build das DOM verwendet, hat oft einen weiteren Build für Worker oder React Native. `resolve.conditions` wählt die Export-Conditions, mit denen Pakete aufgelöst werden, anstelle des Standards `["browser"]`: `import`, `require`, `module` und `default` gelten immer, und ohne `browser` werden Pakete über ihre Felder `module` und `main` aufgelöst. `resolve.alias` ersetzt einen Import: durch einen Pfad relativ zu `nsh.json` (`./` oder `../`), durch ein anderes Paket oder durch `false` für ein leeres Modul. TypeScript (`nsh check`, Editoren) typisiert den Import wie geschrieben: Ein Name, der kein installiertes Paket ist, erhält seine Typen aus einer `.d.ts`-Datei der App.

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

`solid-js` kann nicht importiert werden: Der Bundler lehnt es ab und verweist auf die eigenen `signal`, `computed` und `effect` von `nsh`, die es ersetzen.

## Assets

Bilder und Schriften werden mit der App ausgeliefert. Ein Rust-Crate liest jede Datei seines Verzeichnisses `assets/` zur Compile-Zeit mit `asset!` und liefert alle mit `registry.assets(assets!())` in seiner Funktion `#[native_module]` aus; TSX importiert sie wie Module, und der Bundler erfasst jede importierte Datei (und die Pixeldichte-Varianten eines Bildes). `nsh build` kopiert sie nach `.nsh/out/assets/`, `nsh package` legt sie in die App, und während der Entwicklung werden sie an die App ausgeliefert.

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

| Erweiterung | Der Import liefert |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | Ein `ImageAsset`: `{ url, size, scales? }`, in Punkten bemessen. Ein Suffix `@2x` / `@3x` teilt die Pixelgröße durch 2 / 3. Eine Datei ohne Suffix liefert auch ihre Geschwister `@1.5x`–`@4x` mit aus, aufgelistet in `scales`, und die Variante für den jeweiligen Bildschirm wird geladen ([Pixeldichten](./images-and-assets.md#pixel-densities)). |
| `.svg` | Ein `ImageAsset`, in Punkten bemessen durch `width` und `height` des SVG (oder `viewBox`). |
| `.ttf`, `.otf`, `.woff`, `.woff2` | Der Familienname der Schrift, ein String. Die Schrift wird vor dem ersten Frame registriert. |
| `.json` | Das geparste JSON |

Siehe [Bilder und Assets](./images-and-assets.md) und [Schriften](./fonts.md).
<a id="generated-directories"></a>

## Generierte Verzeichnisse

- **`.nsh/`**: alles, was NSH generiert: die Typdeklarationen (`.nsh/types`), die Quellen der Runner einer Rust-App (`.nsh/rust`), das, was `nsh run` auf Simulatoren und Geräten installiert (die Catalyst-Host-App, die Android-Entwicklungs-APK) sowie `.nsh/out`, die Standardausgabe von `nsh build` (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/`; bei einer Rust-App `app.json` und `assets/`) und `nsh package` (`.app`, `.ipa`, `.apk`, eine Site); `-o` schreibt an anderer Stelle. Kann gefahrlos gelöscht werden; es wird neu erstellt.
- **`target/`**: das Build-Verzeichnis von Cargo für die Crates und Runner einer App (oder `CARGO_TARGET_DIR`).
