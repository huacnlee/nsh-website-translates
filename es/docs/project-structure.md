---
title: "Estructura del proyecto"
description: "Los archivos de una aplicación NSH en Rust o TSX, cada clave de nsh.json, la configuración de TypeScript en .nsh/types, los recursos y cómo se importan los módulos y paquetes."
order: 5
group: start
source_hash: 67da39e1182fc05c
---


# Estructura del proyecto

Una app NSH es un directorio con un `nsh.json` y su código: un crate de Rust cuyo componente raíz nombra `nsh.json`, o un módulo de entrada TSX, o ambos. Todo lo demás (más módulos, imágenes, fuentes, archivos JSON) se encuentra a partir de ahí: los módulos de un crate y su directorio `assets/`, o los archivos que importa la entrada TSX, de modo que no hay que mantener ninguna lista de archivos.

Una app escrita en Rust es un proyecto de Cargo:

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

Una app TSX es una entrada y los módulos que importa:

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

Una app con ambos lista sus crates en `"rust"` y tiene una entrada TSX que los importa ([Desarrollo con Rust](./rust.md#extending-a-rust-app-with-tsx)).

Cada comando recibe como argumento el directorio de la app o su entrada (`nsh run my-app`, `nsh run my-app/App.tsx`). El directorio de `nsh.json` y de la entrada es la raíz de la app: `nsh.json` se lee desde allí, las rutas de los recursos son relativas a ella y `.nsh/` se escribe allí. En una app Rust (`nsh.json` `"root"`), el directorio ejecuta el componente raíz; si se indica una entrada TSX, se ejecuta esta en su lugar.

<a id="the-root-component"></a>

## El componente raíz

La raíz de una app Rust es un componente de su crate, que el `"root"` de `nsh.json` nombra por su ruta en el crate (`App`, `shell::Gallery`). Una entrada TSX es un módulo normal que termina renderizando el componente raíz:

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

`nsh run` y `nsh package` montan una raíz Rust en todas las plataformas, sin QuickJS. En TSX, `mount(component, props?)` renderiza el componente en la superficie de la app y devuelve una función que lo elimina de nuevo; una app la llama una sola vez. El código del nivel superior de la entrada se ejecuta cuando se carga el bundle, antes del primer fotograma.

## nsh.json

`nsh.json` está en la raíz de la app. `nsh init` escribe `name`, `id`, `version` y `build`, y, para una app Rust, el crate y su componente raíz:

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

Todas las demás claves son opcionales; una app TSX también puede omitir las cuatro. El `nsh.json` de una app TSX podría ser así:

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

| Clave | Tipo | Usada por | Descripción |
|---|---|---|---|
| `name` | string | `package` | El nombre visible bajo el icono de la app. Por defecto: el nombre del directorio de la entrada. |
| `id` | string | `package`, `publish`, `Storage` | Identificador de bundle / id de aplicación en formato DNS inverso, p. ej. `com.yourcompany.app`; lo exigen `package` y `publish`. `nsh run` usa `com.example.<name>` si no hay uno. |
| `version` | string | `package`, `publish` | La versión visible para el usuario, p. ej. `1.2.0` (`CFBundleShortVersionString`, Android `versionName`). |
| `build` | number | `package`, `publish` | El número de compilación (`CFBundleVersion`, Android `versionCode`). Los paquetes firmados exigen que aumente con cada versión. |
| `minRuntime` | string | `publish` | El runtime de NSH más antiguo que ejecuta el paquete firmado, p. ej. `0.2.0`. Por defecto: la versión de la CLI ([Paquetes firmados](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | string | `package` | Un PNG cuadrado, idealmente de 1024×1024, relativo a `nsh.json`. |
| `tailwind` | object | cada compilación | Amplía el tema de Tailwind contra el que se resuelven tus cadenas `class` ([Tailwind](./tailwind.md#theme)). |
| `appearance` | string | cada compilación, `package` | `"light"`, `"dark"` o `"system"` (el valor por defecto): una app que siempre es clara u oscura lo indica aquí. Las clases `colorScheme()`, `dark:`, el tema de los componentes y los controles de la plataforma lo siguen desde el principio ([Dispositivo y entorno](./device-and-environment.md#dark-mode)). |
| `theme` | string u object | cada compilación | Los tokens de diseño de la app (los `cssVars` de shadcn/ui, sobre el tema `neutral` por defecto), con los que dibujan las clases de token, `token()` y los componentes Rust: la ruta de un archivo de tema relativa a `nsh.json`, o el tema en línea ([Desarrollo con Rust](./rust.md#theme), [Tokens de tema](./tailwind.md#theme-tokens)). |
| `statusBar` | object | cada compilación, `package` | El valor por defecto de la barra de estado bajo cada página y cuadro de diálogo (iOS y Android): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, ambos opcionales. Las apps iOS empaquetadas la muestran desde la pantalla de lanzamiento ([Barra de estado](../modules/nsh-base.md#status-bar)). |
| `capabilities` | object | cada compilación | Lo que la app puede alcanzar fuera de su VM: hosts de red, hosts de web views, la barra de estado ([Sandbox y capacidades](./sandbox-and-capabilities.md)). |
| `resolve` | object | cada compilación | Cómo se resuelven los imports simples: las condiciones de exportación de los paquetes npm y los alias ([Paquetes npm](#npm-packages)). |
| `rust` | string o string[] | todos los comandos | El crate Rust de la app, o una lista de ellos, relativos a `nsh.json`: sus componentes y módulos, que TSX importa mediante el especificador `#[native_module]` de cada crate ([Desarrollo con Rust](./rust.md#several-crates)). |
| `web` | object | `package` | Lo que un paquete web añade a su página. `web.host`: un módulo JS relativo a `nsh.json` que exporta `createHost(player)` y responde a las llamadas de [`host`](../modules/nsh.md#host) de la app; `web.connect`: los hosts a los que llegan las peticiones del propio módulo, como patrones de `capabilities.network.hosts`, que permite la Content-Security-Policy de la página ([Web](./web.md#the-hosts-functions)). |
| `root` | string | `run`, `package` | El componente raíz de una app Rust, su ruta en el crate `rust`, el primero de una lista (`App`, `shell::Gallery`): `nsh run` y `nsh package` del directorio de la app lo montan sin QuickJS, en todas las plataformas; `nsh run App.tsx` sigue ejecutando la entrada TSX ([Desarrollo con Rust](./rust.md)). |

Los flags de `nsh package` y `nsh publish` (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) sustituyen a los valores del archivo ([CLI](./cli.md)).

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` y `resolve` se comprueban cuando se compila la app. Un error tipográfico es un error de compilación en lugar de un ajuste que silenciosamente no hace nada:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

Sin la clave `capabilities`, una app puede usar libremente la red, las web views y la barra de estado: una app independiente es del propio desarrollador. Con la clave, todo lo que no figura en la lista se deniega, tanto en desarrollo como en las apps empaquetadas:

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

`network` cubre `fetch`, imágenes remotas y fuentes de vídeo; los recursos locales siempre se permiten. Una app que incorpora NSH puede conceder menos de lo que una app declara. Los detalles están en [Sandbox y capacidades](./sandbox-and-capabilities.md).

## tsconfig.json and .nsh/types

NSH no necesita `node_modules`. En su lugar, cada comando que compila la app (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`) escribe las declaraciones TypeScript de todo lo que NSH proporciona en `.nsh/types`, y la configuración TypeScript de NSH en `.nsh/tsconfig.json`. El `tsconfig.json` de la app las extiende:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` apunta los imports de `nsh` y los crates de tu app a `.nsh/types`, incluye las declaraciones de globales, recursos y tokens, y establece las opciones del compilador que usan las apps NSH (`lib`, `jsx`, `strict`, ...). NSH lo mantiene actualizado: cuando una versión nueva añade una biblioteca o una ruta, tu app la tiene con la siguiente compilación, y tu `tsconfig.json` queda como lo escribiste. Las opciones que añadas a `tsconfig.json` prevalecen sobre las de NSH.

| Archivo en `.nsh/types/nsh/` | Declara |
|---|---|
| `index.d.ts` | `nsh`: `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... y reexporta los tipos siguientes |
| `types.d.ts` | Estilos (`ViewStyle`, `TextStyle`, ...), las props y eventos de cada elemento, las refs (`ViewRef`, `InputRef`, ...: lo que recibe un `ref`) |
| `jsx-runtime.d.ts` | El runtime JSX que TypeScript resuelve a través de `jsxImportSource` (el namespace `JSX`) |
| `globals.d.ts` | `If` y `Each`; `console`, timers, `requestAnimationFrame`, `fetch` y las demás [APIs globales](../modules/globals.md) |
| `assets.d.ts` | Lo que da importar una imagen o una fuente |
| `tokens.d.ts` | `Tokens`: los tokens de diseño de la app, de su `"theme"`, que tipan [`token()`](../modules/nsh.md#token) |
| `mobile.d.ts`, `desktop.d.ts` | Un archivo por módulo (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` es `ES2023` sin `DOM`: no hay `document` ni `window`. Los archivos de `.nsh` se regeneran (solo cuando cambia su contenido), así que no los edites ni los subas al repositorio; `.gitignore` ya excluye `.nsh/`. Si tu editor muestra `nsh` como ausente tras clonar un proyecto, ejecuta cualquier comando de compilación una vez, p. ej. `nsh check`.

`.nsh/tsconfig.json` añade `"ESNext.Disposable"`, que declara las declaraciones `using` y `Symbol.dispose`, que el runtime tiene: `using account = new Account()` libera el valor de una [clase Rust](./rust.md) al final del bloque. Su `jsxImportSource: "nsh"` y `jsx: "preserve"` solo importan al editor: NSH compila JSX con su propio compilador, diga lo que diga el `tsconfig.json`. TypeScript lo comprueba tu editor o `nsh check`; los demás comandos eliminan los tipos sin comprobarlos.

Una app creada con un `nsh init` anterior obtiene el nuevo `tsconfig.json` con su siguiente compilación cuando el suyo es la plantilla de NSH, sin cambios; NSH imprime una línea que lo indica. Un `tsconfig.json` que hayas cambiado es tuyo: `nsh check` señala cuándo no extiende `./.nsh/tsconfig.json`, y tú añades la línea `extends` y quitas las opciones que establece.

<a id="modules"></a>

## Módulos

El código de una app Rust son los módulos de su crate (`mod screens;`), y sus dependencias vienen de crates.io como las de cualquier crate; los crates propios de NSH son `nsh-core` (las primitivas, signals y estilos tipados, `use nsh_core::prelude::*`) y `nsh-base` (los componentes base y el tema).

En TSX, divide la app en tantos módulos `.ts` y `.tsx` como quieras e impórtalos con rutas relativas; la extensión puede omitirse:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

Todos se empaquetan en un solo script. Los archivos JSON se importan como su valor ya analizado.

<a id="loading-code-on-demand"></a>

### Carga de código bajo demanda

`import()` de uno de los módulos de la app devuelve una promesa de sus exports, como en un navegador:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

Las apps en dispositivos distribuyen un solo bundle, así que el módulo ya está ahí y la promesa se resuelve de inmediato. Una app web publicada dividida (`nsh build --split`) obtiene el módulo, y lo que solo él usa, como un archivo aparte que se descarga la primera vez que `import()` lo pide ([Web](./web.md#split-bundles)). El especificador debe ser una ruta relativa literal: el bundler tiene que ver qué módulo se quiere decir.

<a id="nshs-modules"></a>

### Módulos de NSH

Los imports de `nsh` y `nsh/...` no se empaquetan: el runtime los proporciona de forma nativa.

| Módulo | Qué contiene |
|---|---|
| `nsh` | Reactividad (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context`; las primitivas `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (`selectable` de `View` para la selección de texto); insets de área segura (`safeArea`, `safeAreaInsets`) y el teclado por software (`Keyboard`, `keyboardFrame`); animaciones nativas; `PanResponder`; el entorno (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`); estado del lector de pantalla y de reducción de movimiento, anuncios; el portapapeles, el selector de fotos, almacenamiento, el canal con el host, atajos de teclado; componentes y funciones que registra la app que incorpora NSH ([referencia](../modules/nsh.md)) |
| `nsh/base` | La base sin estilos de la UI de una app: pilas de navegación y sus páginas (`NavStack`, `NavPage`, `createNavStack`), cuadros de diálogo (`Dialog`), un objetivo de pulsación (`Button`), una entrada de texto (`Input`) y el cuadro de alerta del sistema (`AlertDialog`); las páginas y los diálogos establecen la barra de estado (`statusBar`) ([referencia](../modules/nsh-base.md)) |
| `nsh/mobile` | Lo que tienen iOS y Android: `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([referencia](../modules/nsh-mobile.md)) |
| `nsh/desktop` | Lo que tienen macOS, Windows y Linux: `Window`, `titleBar`, `Menu` ([referencia](../modules/nsh-desktop.md)) |

La [referencia de módulos](../modules/index.md) documenta cada uno. Importar un módulo que NSH no tiene (`nsh/foo`) es un error de compilación. También lo es usar en tu código un nombre que el módulo no exporta (`import { Buton } from "nsh/base"`): el error señala el import y nombra el export más cercano (``did you mean `Button`?``). Los nombres usados solo como tipos los comprueba `nsh check`.

<a id="npm-packages"></a>

### Paquetes npm

NSH no necesita nada de npm, pero el bundler resuelve los imports simples desde un directorio `node_modules` si instalas paquetes con un gestor de paquetes. Los paquetes resuelven sus builds para navegador, porque el runtime proporciona APIs web (`fetch`, streams, `URL`, `TextEncoder`, ...) y no las de Node (`fs`, `Buffer`, `process`). Los paquetes que tocan el DOM no funcionan: no hay ninguno.

Un paquete cuyo build para navegador usa el DOM suele tener otro build para workers o React Native. `resolve.conditions` elige las condiciones de exportación con las que se resuelven los paquetes, en lugar de las `["browser"]` por defecto: `import`, `require`, `module` y `default` se aplican siempre, y sin `browser` los paquetes se resuelven mediante sus campos `module` y `main`. `resolve.alias` reemplaza un import: por una ruta relativa a `nsh.json` (`./` o `../`), otro paquete, o `false` para un módulo vacío. TypeScript (`nsh check`, editores) tipa el import tal como está escrito: un nombre que no es un paquete instalado obtiene sus tipos de un archivo `.d.ts` de la app.

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

`solid-js` no se puede importar: el bundler lo rechaza y señala los propios `signal`, `computed` y `effect` de `nsh`, que lo sustituyen.

<a id="assets"></a>

## Recursos

Las imágenes y las fuentes se distribuyen con la app. Un crate Rust lee cada archivo de su directorio `assets/` en tiempo de compilación con `asset!`, y los distribuye todos con `registry.assets(assets!())` en su función `#[native_module]`; TSX los importa como módulos, y el bundler registra cada archivo importado (y las variantes de densidad de píxeles de una imagen). `nsh build` los copia a `.nsh/out/assets/`, `nsh package` los incluye en la app, y durante el desarrollo se sirven a la app.

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

| Extensión | Qué da el import |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | Un `ImageAsset`: `{ url, size, scales? }`, con tamaño en puntos. Un sufijo `@2x` / `@3x` divide el tamaño en píxeles entre 2 / 3. Un archivo sin sufijo distribuye también sus hermanos `@1.5x`–`@4x`, enumerados en `scales`, y se carga la variante de la pantalla ([densidades de píxeles](./images-and-assets.md#pixel-densities)). |
| `.svg` | Un `ImageAsset` con tamaño en puntos según el `width` y el `height` del SVG (o `viewBox`). |
| `.ttf`, `.otf`, `.woff`, `.woff2` | El nombre de familia de la fuente, un string. La fuente se registra antes del primer fotograma. |
| `.json` | El JSON analizado |

Consulta [Imágenes y recursos](./images-and-assets.md) y [Fuentes](./fonts.md).
<a id="generated-directories"></a>

## Directorios generados

- **`.nsh/`**: todo lo que genera NSH: las declaraciones de tipos (`.nsh/types`), los fuentes de los runners de una app Rust (`.nsh/rust`), lo que `nsh run` instala en simuladores y dispositivos (la app host de Catalyst, el APK de desarrollo de Android) y `.nsh/out`, la salida predeterminada de `nsh build` (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/`; para una app Rust, `app.json` y `assets/`) y de `nsh package` (`.app`, `.ipa`, `.apk`, un sitio); `-o` escribe en otro lugar. Se puede eliminar sin problema; se vuelve a crear.
- **`target/`**: el directorio de compilación de Cargo para los crates y runners de una app (o `CARGO_TARGET_DIR`).
