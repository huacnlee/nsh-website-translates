---
title: "Structure du projet"
description: "Les fichiers d'une application NSH en Rust ou en TSX, chaque clé de nsh.json, la configuration TypeScript dans .nsh/types, les assets, et la manière dont les modules et les packages sont importés."
order: 5
group: start
source_hash: 67da39e1182fc05c
---

# Structure du projet

Une application NSH est un répertoire contenant un `nsh.json` et son code : un crate Rust dont le composant racine est désigné par `nsh.json`, ou un module d'entrée TSX, ou les deux. Tout le reste (modules supplémentaires, images, polices, fichiers JSON) est trouvé à partir de là : les modules d'un crate et son répertoire `assets/`, ou les fichiers que l'entrée TSX importe, de sorte qu'il n'y a aucune liste de fichiers à maintenir.

Une application écrite en Rust est un projet Cargo :

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

Une application TSX est une entrée et les modules qu'elle importe :

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

Une application qui combine les deux liste ses crates dans `"rust"` et possède une entrée TSX qui les importe ([Construire avec Rust](./rust.md#extending-a-rust-app-with-tsx)).

Chaque commande prend en argument le répertoire de l'application ou son entrée (`nsh run my-app`, `nsh run my-app/App.tsx`). Le répertoire de `nsh.json` et de l'entrée est la racine de l'application : `nsh.json` y est lu, les chemins des ressources sont relatifs à cette racine, et `.nsh/` y est écrit. Dans une application Rust (`nsh.json` `"root"`), le répertoire exécute le composant racine ; désigner une entrée TSX exécute celle-ci à la place.

<a id="the-root-component"></a>

## Le composant racine

La racine d'une application Rust est un composant de son crate, que le `"root"` de `nsh.json` désigne par son chemin dans le crate (`App`, `shell::Gallery`). Une entrée TSX est un module ordinaire qui se termine par le rendu du composant racine :

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

`nsh run` et `nsh package` montent une racine Rust sur toutes les plateformes, sans QuickJS. En TSX, `mount(component, props?)` affiche le composant dans la surface de l'application et renvoie une fonction qui le retire ; une application l'appelle une seule fois. Le code au niveau supérieur de l'entrée s'exécute au chargement du bundle, avant la première image.

## nsh.json

`nsh.json` se trouve à la racine de l'application. `nsh init` écrit `name`, `id`, `version` et `build`, et, pour une application Rust, le crate et son composant racine :

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

Toutes les autres clés sont facultatives ; une application TSX peut aussi se passer des quatre premières. Le `nsh.json` d'une application TSX pourrait ressembler à ceci :

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

| Clé | Type | Utilisé par | Description |
|---|---|---|---|
| `name` | string | `package` | Le nom affiché sous l'icône de l'application. Par défaut : le nom du répertoire de l'entrée. |
| `id` | string | `package`, `publish`, `Storage` | Identifiant de bundle / identifiant d'application au format DNS inversé, par ex. `com.yourcompany.app` ; requis par `package` et `publish`. `nsh run` utilise `com.example.<name>` en son absence. |
| `version` | string | `package`, `publish` | La version visible par l'utilisateur, par ex. `1.2.0` (`CFBundleShortVersionString`, Android `versionName`). |
| `build` | number | `package`, `publish` | Le numéro de build (`CFBundleVersion`, Android `versionCode`). Les paquets signés exigent qu'il augmente à chaque version. |
| `minRuntime` | string | `publish` | Le runtime NSH le plus ancien capable d'exécuter le paquet signé, par ex. `0.2.0`. Par défaut : la version du CLI ([Paquets signés](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | string | `package` | Un PNG carré, idéalement de 1024×1024, relatif à `nsh.json`. |
| `tailwind` | object | tous les builds | Étend le thème Tailwind sur lequel vos chaînes `class` sont résolues ([Tailwind](./tailwind.md#theme)). |
| `appearance` | string | tous les builds, `package` | `"light"`, `"dark"` ou `"system"` (valeur par défaut) : une application toujours claire ou toujours sombre le précise ici. Les classes `colorScheme()`, `dark:`, le thème des composants et les contrôles de la plateforme le suivent dès le départ ([Appareil et environnement](./device-and-environment.md#dark-mode)). |
| `theme` | string or object | tous les builds | Les design tokens de l'application (les `cssVars` de shadcn/ui, au-dessus du thème par défaut `neutral`), avec lesquels dessinent les classes de tokens, `token()` et les composants Rust : le chemin d'un fichier de thème relatif à `nsh.json`, ou le thème en ligne ([Construire avec Rust](./rust.md#theme), [Tokens de thème](./tailwind.md#theme-tokens)). |
| `statusBar` | object | tous les builds, `package` | La valeur par défaut de la barre d'état sous chaque page et boîte de dialogue (iOS et Android) : `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, tous deux facultatifs. Les applications iOS empaquetées l'affichent dès l'écran de lancement ([Barre d'état](../modules/nsh-base.md#status-bar)). |
| `capabilities` | object | tous les builds | Ce que l'application peut atteindre en dehors de sa VM : hôtes réseau, hôtes des web views, barre d'état ([Sandbox et capabilities](./sandbox-and-capabilities.md)). |
| `resolve` | object | tous les builds | La façon dont les imports nus sont résolus : conditions d'export des paquets npm et alias ([Paquets npm](#npm-packages)). |
| `rust` | string or string[] | toutes les commandes | Le crate Rust de l'application, ou une liste de crates, relatifs à `nsh.json` : leurs composants et modules, que TSX importe par le spécificateur `#[native_module]` de chaque crate ([Construire avec Rust](./rust.md#several-crates)). |
| `web` | object | `package` | Ce qu'un paquet web ajoute à sa page. `web.host` : un module JS relatif à `nsh.json` qui exporte `createHost(player)` et répond aux appels [`host`](../modules/nsh.md#host) de l'application ; `web.connect` : les hôtes que les requêtes propres à ce module atteignent, sous forme de motifs `capabilities.network.hosts`, que la Content-Security-Policy de la page autorise ([Web](./web.md#the-hosts-functions)). |
| `root` | string | `run`, `package` | Le composant racine d'une application Rust, son chemin dans le crate `rust`, le premier d'une liste (`App`, `shell::Gallery`) : `nsh run` et `nsh package` du répertoire de l'application le montent sans QuickJS, sur toutes les plateformes ; `nsh run App.tsx` exécute toujours l'entrée TSX ([Construire avec Rust](./rust.md)). |

Les options de `nsh package` et de `nsh publish` (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) l'emportent sur les valeurs du fichier ([CLI](./cli.md)).

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` et `resolve` sont vérifiés lors du build de l'application. Une faute de frappe provoque une erreur de build plutôt qu'un réglage qui n'a silencieusement aucun effet :

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

Sans clé `capabilities`, une application peut utiliser librement le réseau, les web views et la barre d'état : une application autonome appartient à son développeur. Avec cette clé, tout ce qui n'est pas listé est refusé, en développement comme dans les applications empaquetées :

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

`network` couvre `fetch`, les images distantes et les sources vidéo ; les ressources locales sont toujours autorisées. Une application qui embarque NSH peut accorder moins que ce que l'application déclare. Les détails se trouvent dans [Sandbox et capabilities](./sandbox-and-capabilities.md).

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json et .nsh/types

NSH n'a pas besoin de `node_modules`. À la place, chaque commande qui construit l'application (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`) écrit dans `.nsh/types` les déclarations TypeScript de tout ce que NSH fournit, et dans `.nsh/tsconfig.json` les paramètres TypeScript de NSH. Le `tsconfig.json` de l'application les étend :

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` fait pointer les imports `nsh` et les crates de votre application vers `.nsh/types`, inclut les déclarations des globales, des ressources et des tokens, et définit les options de compilation qu'utilisent les applications NSH (`lib`, `jsx`, `strict`, ...). NSH le tient à jour : lorsqu'une nouvelle version ajoute une bibliothèque ou un chemin, votre application en bénéficie dès le build suivant, et votre `tsconfig.json` reste tel que vous l'avez écrit. Les options que vous ajoutez à `tsconfig.json` s'appliquent par-dessus celles de NSH.

| Fichier dans `.nsh/types/nsh/` | Déclare |
|---|---|
| `index.d.ts` | `nsh` : `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... et réexporte les types ci-dessous |
| `types.d.ts` | Les styles (`ViewStyle`, `TextStyle`, ...), les props et événements de chaque élément, les refs (`ViewRef`, `InputRef`, ... : ce que reçoit un `ref`) |
| `jsx-runtime.d.ts` | Le runtime JSX que TypeScript résout via `jsxImportSource` (l'espace de noms `JSX`) |
| `globals.d.ts` | `If` et `Each` ; `console`, les timers, `requestAnimationFrame`, `fetch` et les autres [API globales](../modules/globals.md) |
| `assets.d.ts` | Ce que donne l'import d'une image ou d'une police |
| `tokens.d.ts` | `Tokens` : les design tokens de l'application, issus de son `"theme"`, qui typent [`token()`](../modules/nsh.md#token) |
| `mobile.d.ts`, `desktop.d.ts` | Un fichier par module (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` est `ES2023` sans `DOM` : il n'y a ni `document` ni `window`. Les fichiers de `.nsh` sont régénérés (uniquement lorsque leur contenu change) ; ne les modifiez donc pas et ne les versionnez pas : `.gitignore` exclut déjà `.nsh/`. Si votre éditeur signale `nsh` comme manquant après le clonage d'un projet, lancez une fois n'importe quelle commande de build, par ex. `nsh check`.

`.nsh/tsconfig.json` ajoute `"ESNext.Disposable"`, qui déclare les déclarations `using` et `Symbol.dispose`, que le runtime possède : `using account = new Account()` libère la valeur d'une [classe Rust](./rust.md) à la fin du bloc. Ses `jsxImportSource: "nsh"` et `jsx: "preserve"` n'importent qu'à l'éditeur : NSH compile le JSX avec son propre compilateur, quoi que dise le `tsconfig.json`. TypeScript est vérifié par votre éditeur ou par `nsh check` ; les autres commandes retirent les types sans les vérifier.

Une application créée par un `nsh init` antérieur reçoit le nouveau `tsconfig.json` à son prochain build lorsque le sien est le modèle de NSH, inchangé ; NSH affiche une ligne pour l'indiquer. Un `tsconfig.json` que vous avez modifié vous appartient : `nsh check` signale lorsqu'il n'étend pas `./.nsh/tsconfig.json`, et vous ajoutez la ligne `extends` et supprimez les options qu'il définit.

## Modules

Le code d'une application Rust est constitué des modules de son crate (`mod screens;`), et ses dépendances proviennent de crates.io comme celles de n'importe quel crate ; les propres crates de NSH sont `nsh-core` (les primitives, les signaux et les styles typés, `use nsh_core::prelude::*`) et `nsh-base` (les composants de base et le thème).

En TSX, découpez l'application en autant de modules `.ts` et `.tsx` que vous le souhaitez et importez-les avec des chemins relatifs ; l'extension peut être omise :

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

Tous sont regroupés dans un seul script. Les fichiers JSON s'importent sous la forme de leur valeur analysée.

<a id="loading-code-on-demand"></a>

### Chargement du code à la demande

`import()` d'un des modules de l'application renvoie une promesse de ses exports, comme dans un navigateur :

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

Sur les appareils, les applications sont livrées avec un seul bundle ; le module est donc déjà présent et la promesse se résout immédiatement. Une application web publiée en mode fractionné (`nsh build --split`) obtient le module, et ce qu'il est seul à utiliser, sous la forme d'un fichier séparé, téléchargé la première fois que `import()` le demande ([Web](./web.md#split-bundles)). Le spécificateur doit être un chemin relatif littéral : le bundler doit voir quel module est visé.

<a id="nshs-modules"></a>

### Modules de NSH

Les imports de `nsh` et `nsh/...` ne sont pas regroupés dans le bundle : le runtime les fournit nativement.

| Module | Contenu |
|---|---|
| `nsh` | La réactivité (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context` ; les primitives `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (le `selectable` de `View` pour la sélection de texte) ; les marges de la zone de sécurité (`safeArea`, `safeAreaInsets`) et le clavier logiciel (`Keyboard`, `keyboardFrame`) ; les animations natives ; `PanResponder` ; l'environnement (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`) ; l'état du lecteur d'écran et de la réduction des animations, les annonces ; le presse-papiers, le sélecteur de photos, le stockage, le canal hôte, les raccourcis clavier ; les composants et fonctions que l'application hôte enregistre ([référence](../modules/nsh.md)) |
| `nsh/base` | Le socle sans style de l'interface d'une application : piles de navigation et leurs pages (`NavStack`, `NavPage`, `createNavStack`), boîtes de dialogue (`Dialog`), une cible d'appui (`Button`), un champ de saisie de texte (`Input`) et la boîte de dialogue d'alerte du système (`AlertDialog`) ; les pages et les boîtes de dialogue définissent la barre d'état (`statusBar`) ([référence](../modules/nsh-base.md)) |
| `nsh/mobile` | Ce que proposent iOS et Android : `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([référence](../modules/nsh-mobile.md)) |
| `nsh/desktop` | Ce que proposent macOS, Windows et Linux : `Window`, `titleBar`, `Menu` ([référence](../modules/nsh-desktop.md)) |

La [référence des modules](../modules/index.md) documente chacun d'eux. Importer un module que NSH ne possède pas (`nsh/foo`) est une erreur de build. Il en va de même pour un nom que votre code utilise et que le module n'exporte pas (`import { Buton } from "nsh/base"`) : l'erreur pointe l'import et indique l'export le plus proche (``did you mean `Button`?``). Les noms utilisés uniquement comme types sont vérifiés par `nsh check`.

<a id="npm-packages"></a>

### Paquets npm

NSH n'a besoin de rien venant de npm, mais le bundler résout les imports nus depuis un répertoire `node_modules` si vous installez des paquets avec un gestionnaire de paquets. Les paquets résolvent leurs builds pour navigateur, car le runtime fournit les API web (`fetch`, streams, `URL`, `TextEncoder`, ...) et non celles de Node (`fs`, `Buffer`, `process`). Les paquets qui touchent au DOM ne fonctionnent pas : il n'y en a pas.

Un paquet dont le build pour navigateur utilise le DOM possède souvent un autre build pour les workers ou pour React Native. `resolve.conditions` choisit les conditions d'export avec lesquelles les paquets sont résolus, à la place de la valeur par défaut `["browser"]` : `import`, `require`, `module` et `default` s'appliquent toujours, et sans `browser` les paquets sont résolus via leurs champs `module` et `main`. `resolve.alias` remplace un import : par un chemin relatif à `nsh.json` (`./` ou `../`), par un autre paquet, ou par `false` pour un module vide. TypeScript (`nsh check`, éditeurs) type l'import tel qu'il est écrit : un nom qui n'est pas un paquet installé obtient ses types d'un fichier `.d.ts` de l'application.

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

`solid-js` ne peut pas être importé : le bundler le refuse et renvoie vers les `signal`, `computed` et `effect` propres à `nsh`, qui le remplacent.

<a id="assets"></a>

## Ressources

Les images et les polices sont livrées avec l'application. Un crate Rust lit chaque fichier de son répertoire `assets/` à la compilation avec `asset!`, et les livre tous avec `registry.assets(assets!())` dans sa fonction `#[native_module]` ; TSX les importe comme des modules, et le bundler enregistre chaque fichier importé (ainsi que les variantes de densité de pixels d'une image). `nsh build` les copie dans `.nsh/out/assets/`, `nsh package` les place dans l'application, et pendant le développement ils sont servis à l'application.

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

| Extension | Ce que donne l'import |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | Un `ImageAsset` : `{ url, size, scales? }`, dimensionné en points. Un suffixe `@2x` / `@3x` divise la taille en pixels par 2 / 3. Un fichier sans suffixe livre aussi ses variantes `@1.5x`–`@4x`, listées dans `scales`, et la variante correspondant à l'écran est chargée ([densités de pixels](./images-and-assets.md#pixel-densities)). |
| `.svg` | Un `ImageAsset` dimensionné en points par les `width` et `height` du SVG (ou `viewBox`). |
| `.ttf`, `.otf`, `.woff`, `.woff2` | Le nom de famille de la police, une chaîne. La police est enregistrée avant la première image. |
| `.json` | Le JSON analysé |

Voir [Images et ressources](./images-and-assets.md) et [Polices](./fonts.md).
<a id="generated-directories"></a>

## Répertoires générés

- **`.nsh/`** : tout ce que NSH génère : les déclarations de types (`.nsh/types`), les sources des runners d'une app Rust (`.nsh/rust`), ce que `nsh run` installe sur les simulateurs et les appareils (l'app hôte Catalyst, l'APK de développement Android), ainsi que `.nsh/out`, la sortie par défaut de `nsh build` (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/` ; pour une app Rust, `app.json` et `assets/`) et de `nsh package` (`.app`, `.ipa`, `.apk`, un site) ; `-o` écrit ailleurs. Peut être supprimé sans risque : il est recréé.
- **`target/`** : le répertoire de build de Cargo pour les crates et les runners d'une app (ou `CARGO_TARGET_DIR`).
