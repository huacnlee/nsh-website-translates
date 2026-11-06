---
title: "CLI"
description: "Todos los subcomandos y opciones de NSH: init, build, test, check, dev, run, package y los comandos de firma keygen, certify, publish, verify, symbolicate y revoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---


# CLI

`nsh` es la herramienta con la que se construye una app NSH, en Rust o TSX. Cada subcomando que construye una app recibe `[ENTRY]`: el directorio de la app (por defecto, el actual, de modo que `cd my-app && nsh run` funciona), que ejecuta el componente raíz de una app Rust (`nsh.json` `"root"`) o el `App.tsx` de una app TSX, o un módulo de entrada TSX. Lee `nsh.json` en la raíz de la app y actualiza las declaraciones de tipos en `.nsh/types`.

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

`nsh <command> --help` muestra las opciones de un comando; `nsh -V` (`--version`) muestra la versión y la revisión de Git a partir de la cual se compiló.

<a id="output"></a>

## Salida

Cada comando muestra una línea por paso y los detalles solo cuando algo falla:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` es un paso terminado, `→` indica dónde conectarse y `•` lo que hizo un dispositivo; las líneas `warn` y `error` son problemas, y las líneas sin marca son la salida propia de tu app (`console.log`). En un terminal, un spinner muestra el paso en curso y las líneas se colorean (salvo que `NO_COLOR` esté definida); si la salida se redirige a un archivo, solo se escriben las líneas de resultado, sin colores. La salida de las herramientas que NSH ejecuta (cargo para el crate Rust de una app, los hosts de desarrollo) se muestra debajo de una línea `error` cuando una de ellas falla.

`-v, --verbose` (en cualquier comando; también `NSH_VERBOSE=1`) muestra todo a medida que llega: cada línea de log con su nivel y su origen, la salida de cargo y la de los propios hosts.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

Crea una app en `DIR` (por defecto, el directorio actual, que se crea si no existe) a partir de una plantilla. Sin `--template`, `nsh init` pregunta cuál usar en un terminal (Enter elige `ts`) y toma `ts` en otros entornos (un script, CI).

| Plantilla | Qué crea |
|---|---|
| `rust` | Una app escrita en Rust: un proyecto Cargo (`Cargo.toml`, `src/lib.rs` con el componente raíz, `src/main.rs` para `cargo run`), `nsh.json` con `"rust": "."` y `"root": "App"`, el test de la raíz `App.test.tsx` con `tsconfig.json` y `.nsh/types`, `.gitignore` y un README, que también explica cómo añadir una entrada TSX más adelante. `nsh run` y `nsh package` montan la raíz sin QuickJS en todos los destinos (`nsh test` lo abre para pruebas en TypeScript), incluido el navegador ([Compilar con Rust](./rust.md)); `cargo run` la inicia directamente en macOS, Windows o Linux. |
| `ts` | Una app TSX: `App.tsx`, su test `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` y `.nsh/types`. Los archivos que ya existen se conservan; solo falla si ya existen todos. |
| `mixed` | Una app TSX con un crate Rust propio en su raíz: `App.tsx`, su test `App.test.tsx`, `tsconfig.json`, `nsh.json` con `"rust": "."`, `.gitignore`, `.nsh/types`, un README y el crate junto a `App.tsx` (`Cargo.toml`, `src/lib.rs`), cuyo `#[native_module("<name>/native")]` exporta un componente, un módulo y una clase que `App.tsx` usa. Sin `"root"`, `App.tsx` es la entrada. |

| Opción | Descripción |
|---|---|
| `--name <NAME>` | Nombre visible que se escribe en `nsh.json`. Por defecto: el nombre del directorio. El id pasa a ser `com.example.<name>` (solo letras y dígitos, en minúsculas) y el especificador de importación de los crates, `<name>/native` (en minúsculas, con las palabras unidas por `-`). |
| `--template <TEMPLATE>` | `rust`, `ts` o `mixed` (arriba). `rust` y `mixed` necesitan Rust; `cargo run` necesita además las bibliotecas de desarrollo del backend de escritorio nativo. |
| `--nsh-source <DIR>` | Con `rust` o `mixed`: los crates dependen, por ruta, de los crates de NSH del checkout en `DIR`, para compilar la app contra las fuentes de NSH. |

Los crates de `rust` y `mixed` dependen de los crates de NSH en crates.io en la versión del CLI (con `--nsh-source`, en los de un checkout), y los comandos `nsh` construyen los runners y los hosts de la app a partir de esos mismos crates. Antes de cada comando sobre una app de este tipo, `nsh` compila un pequeño programa con los crates de la app y el núcleo de NSH que describe sus componentes, módulos y clases, y lo ejecuta cuando los crates cambiaron; con esa descripción, el propio CLI empaqueta, compila, comprueba los tipos, sirve y distribuye la app. Las compilaciones de una app Rust solo compilan sus crates y el núcleo de NSH. Créalos en un directorio de app nuevo: si existe cualquiera de sus archivos, se informa de un conflicto antes de escribir nada.

Las apps cuyos crates Rust dependen de NSH mediante Git usan el checkout que Cargo resuelve en el lockfile de la app. Los hosts generados comparten ese checkout, incluidas las dependencias de NSH redirigidas por los parches de Cargo de la app.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

Para una entrada TSX, `nsh run` inicia el servidor de desarrollo (igual que `nsh dev`), lanza un host de desarrollo que carga la app desde él y recompila en cada guardado. Hot module replacement aplica los cambios a la app en ejecución sin reiniciarla; los logs y errores de la app se muestran en el terminal. Se detiene con Ctrl-C (o cerrando la ventana de Catalyst, macOS, Linux, Windows o GPUI). Termine como termine (Ctrl-C, `kill` / `pkill`, un error), detiene el host que inició: la app Catalyst, el host de macOS, Linux, Windows o GPUI, el host de desarrollo en el simulador o en el dispositivo Android.

Una app Rust (`nsh.json` `"root"`, [Compilar con Rust](./rust.md)) se ejecuta sin servidor de desarrollo y sin QuickJS: `nsh run` compila el runner de la app para el destino con su raíz montada y lo inicia (en los escritorios, una compilación de depuración con sus logs en el terminal; en el simulador y en Android, la app instalada), y cuando cambia el código Rust del crate lo compila de nuevo y lo reinicia. Con `--target web` muestra la dirección de la página, y la página abierta carga el nuevo runtime por sí sola. Indica la entrada TSX (`nsh run App.tsx`) para ejecutar esa en su lugar.

| Opción | Por defecto | Descripción |
|---|---|---|
| `--target <TARGET>` | `macos` en macOS, `linux` en Linux, `windows` en Windows | `catalyst`: el host Mac Catalyst, una ventana del tamaño de un iPhone (390×844). `ios`: el host en un simulador de iOS. `android`: el host en un dispositivo o emulador Android. `macos`: el host AppKit, una ventana de 1200×800 ([macOS](./macos.md)). `linux`: el host GTK, una ventana de 390×844 ([Linux](./linux.md)). `windows`: el host Win32, una ventana de 1200×800 ([Windows](./windows.md)). `gpui`: el host GPUI, una ventana de 1200×800, en macOS, Windows o Linux, que muestra una app TSX como la muestran las apps GPUI que la incrustan ([GPUI](./gpui.md)). `web`: la página del servidor de desarrollo, en la dirección que imprime ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | Simulador de iOS que se usará, por nombre (`"iPhone 16 Pro"`) o UDID. Por defecto: uno ya iniciado; si no, el iPhone más reciente, que se inicia. |
| `--port <PORT>` | `8790` | Puerto del servidor de desarrollo. Reemplaza la sesión de desarrollo de NSH anterior en este puerto una vez completada su limpieza. |
| `--release` | | Minifica y elimina la información de depuración. Los bundles de release no tienen hot module replacement: cada guardado recarga la app. |
| `--limits [<LIMITS>]` | | Ejecuta la app como una app incrustada en otra, dentro de los límites que establece su app anfitriona: `memory` y `stack` (en `KB`, `MB` o `GB`), `load` y `call` (en `ms` o `s`) y `nodes`, como `--limits memory=128MB,call=500ms`. Los que se omiten conservan los valores por defecto de la incrustación, con los que se ejecuta `--limits` por sí solo ([Sandbox y capacidades](./sandbox-and-capabilities.md#limits)). Sin esta opción, la app se ejecuta por su cuenta, como una app empaquetada. Entradas TSX. |
| `--trace` | | El host registra en el terminal el tiempo de cada commit (JS, layout, mount items). |
| `--fps` | | El monitor de rendimiento: velocidad de fotogramas, coste de los fotogramas y los commits, CPU, GPU y memoria, que se muestra sobre la app en macOS ([macOS](./macos.md#performance-monitor)) y se registra una vez por segundo en macOS, Linux, Windows e iOS. |
| `--name <NAME>` | Nombre de `nsh.json` | Nombre visible de la aplicación en la barra de menús y título inicial de la ventana (`--target macos`, entradas TSX). |
| `--window-size <WIDTHxHEIGHT>` | Valor por defecto del host | Tamaño inicial de la ventana en puntos, como `800x600` (`--target macos`, `linux`, `windows` y `gpui`, entradas TSX). |
| `--display <N>` | La pantalla principal | La pantalla en la que se abre la ventana, centrada: `1` es la pantalla primaria (la que tiene la barra de menús), `2` la siguiente, y así sucesivamente; un número sin pantalla correspondiente la abre en la principal (`--target macos`, entradas TSX). |

Con `--target android`, se usa el primer dispositivo que lista `adb devices`; el puerto del servidor de desarrollo se reenvía a él con `adb reverse`. Consulta [Primeros pasos](./getting-started.md#run-it) y [Servidor de desarrollo y depuración](./dev-server-and-debugging.md).

Un reemplazo espera hasta diez segundos a que la sesión anterior termine su limpieza. Un puerto ocupado por otro programa, o por un CLI de NSH más antiguo, produce un error que nombra el puerto. Usa valores distintos de `--port` para ejecutar varias apps a la vez; `--port 0` pide al sistema operativo un puerto libre.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Inicia el servidor de desarrollo y abre el host nativo de este sistema: AppKit en macOS, GTK en Linux, Win32 en Windows. Elige `--target ios` o `--target android` explícitamente para el desarrollo móvil. `--server-only` sirve a los hosts que inicias tú mismo. El servidor compila la app, vigila el directorio de la entrada y envía cada recompilación a los hosts conectados. Con `--server-only`, imprime la URL para los hosts de esta máquina y una por cada dirección de la LAN para los dispositivos y, cuando el runtime web está presente, la página que abren los navegadores para ejecutar la app ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

Usa `nsh dev --server-only` con una app que incruste el SDK de desarrollo (`NativeShellDev.xcframework`, `nsh-dev.aar`). `--target`, `--device`, `--port`, `--release` y `--limits` funcionan como en `nsh run`; `--server-only` selecciona un servidor sin host lanzado.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

Ejecuta las pruebas de la app sin interfaz ([Pruebas](./testing-and-trace.md)): los archivos de test (`*.test.tsx`, `*.test.ts`, que importan `nsh/test`) en `PATH`, un directorio (por defecto, el actual; se omiten los directorios ocultos, `node_modules` y `target`), o el archivo de test `PATH`. Dado el directorio de una app con crates Rust propios (`nsh.json` `"rust"`: una app Rust o una app TSX con un crate), primero ejecuta `cargo test` para cada crate del directorio, en el directorio del propio crate, y muestra y cuenta cada test de Rust junto con los tests de TypeScript, bajo el archivo de su destino de test (`src/lib.rs › tests::adds`); una app Rust con solo tests de Rust también se prueba así. Cada archivo de test se ejecuta en su propio motor, y cada app que sus tests abren, en otro nuevo. Imprime una línea por test y, para un fallo, lo que se lanzó, dónde ocurrió en el archivo de test y los textos en pantalla; cualquier fallo hace que termine con un código distinto de cero. Dada la entrada de la app (`nsh test App.tsx`; la de una app Rust: `nsh test nsh.json`), abre la app en la red, la deja funcionar 1,2 s y ejecuta los pasos que da la entrada estándar (`await app.press("Add")`, con `app` la app). Una app TSX se ejecuta en el propio proceso del CLI; una app con crates Rust propios se ejecuta en un runner sin interfaz construido con ellos, para el cual el CLI compila las entradas. Las ejecuciones sin interfaz se comportan como iOS, a menos que un test abra la app como Android (`open` con `platform`): `platform.os` es `"ios"`, y se aplican las clases `ios:` y las props `ios={{…}}`.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Opción | Descripción |
|---|---|
| `--filter <NAME>` | Ejecuta solo los tests cuyo nombre (después de los nombres de los bloques `describe` que lo contienen) incluye `NAME`; para los crates, `cargo test <NAME>`. |
| `--trace` | Imprime cada lote de montaje de las apps que abren los tests, bajo el paso en el que llegó (`── press(Add): 7 items`), y el tiempo de cada commit: lo que cuesta el primer fotograma, un paso o un fotograma de desplazamiento. Con `--target`, los lotes y tiempos del host. |
| `--fps` | Con `--target linux`, `macos`, `windows` o `ios`: el host registra las lecturas de su monitor de rendimiento una vez por segundo (velocidad de fotogramas, fases de los fotogramas, commits, CPU, memoria), que se muestran con `-v`. |
| `--junit <FILE>` | Escribe además los resultados en `FILE` como un informe JUnit XML, el formato desde el que los servicios de CI muestran los resultados de los tests: un `testsuite` por archivo de test y un `testcase` por test. |
| `--target <TARGET>` | Ejecuta las apps que abren los tests en el host de desarrollo de esta plataforma en lugar de sin interfaz (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` y `android`; `web` las ejecuta en un Chrome, Edge o Chromium sin interfaz): los pasos actúan con la entrada propia de la plataforma ([Pruebas](./testing-and-trace.md#on-a-real-platform)), y `open` comprueba sus opciones contra la plataforma y rechaza la que no puede cumplir (`ERR_NSH_TEST_UNSUPPORTED`: `width` y `height` en iOS y Android, un `platform` de otro tipo de dispositivo). Los tests de Rust de los crates se ejecutan en esta máquina, en las ejecuciones sin `--target`. |
| `--browser <PATH>` | El ejecutable de Chrome, Edge o Chromium en el que `--target web` ejecuta las apps (por defecto, el instalado en esta máquina). |
| `--display <N>` | Con `--target macos`: la pantalla en la que se abren las ventanas de las apps, centradas: `1` es la pantalla primaria (la que tiene la barra de menús), `2` la siguiente, y así sucesivamente; un número sin pantalla correspondiente las abre en la principal. Por defecto se abren en una pantalla secundaria (la primera además de la primaria, que no sea un espejo de ella), de modo que una ejecución de tests se mantiene en una pantalla propia, y en la primaria cuando es la única. Los tests se ejecutan igual en cualquier pantalla. |
| `--web-host <JS>` | El módulo host de la página web que reciben las apps abiertas sin interfaz (por defecto: `nsh.json` `web.host`; exporta `createHost(player)`): responde a sus llamadas a [`host`](../modules/nsh.md#host) y su `player.hostEvent` llega a `host.on` ([Pruebas](./testing-and-trace.md#the-pages-host)). Solo en ejecuciones sin interfaz; `--target web` ejecuta el `web.host` de `nsh.json`. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

Comprueba los tipos de la app. En una app con crates de Rust propios (`nsh.json` `"rust"`), cada crate se comprueba primero con `cargo check --all-targets` en el directorio del crate, incluidos sus tests; los errores de Cargo hacen que el comando termine con un código distinto de cero. Una app Rust (`"root"`) se comprueba después hasta donde tenga TypeScript: con un `tsconfig.json` (el que `nsh init --template rust` escribe para `App.test.tsx`) también se comprueban los tipos de sus archivos de test. La comprobación de TypeScript actualiza `.nsh/types` y `.nsh/tsconfig.json`, y luego ejecuta `tsc -p <app directory> --noEmit` con el `tsconfig.json` de la app. Usa TypeScript 7, el compilador nativo, que no necesita Node: la primera ejecución lo descarga del registro de npm (unos 9 MB), lo verifica con el checksum que NSH registra y lo guarda en la caché de NSH (`~/Library/Caches/nsh` en macOS, `~/.cache/nsh` en Linux, `%LOCALAPPDATA%\nsh` en Windows, o `NSH_CACHE`). Los errores de tipos hacen que el comando termine con un código distinto de cero. Avisa cuando `tsconfig.json` no extiende `./.nsh/tsconfig.json`, donde NSH guarda su configuración de TypeScript ([Estructura del proyecto](./project-structure.md#tsconfigjson-and-nshtypes)).

| Opción | Descripción |
|---|---|
| `--tsc <TSC>` | Ejecuta este `tsc` en su lugar (también `NSH_TSC`), por ejemplo uno de `node_modules` o una copia para máquinas sin red. |
| `-- <TSC ARGS>` | Se pasa a `tsc`, p. ej. `nsh check -- --pretty false`. |

Los archivos generados por NSH permanecen bajo `.nsh/`: declaraciones, fuentes de los runners y las salidas de build/package por defecto en
`.nsh/out/`. Cargo mantiene su caché normal `target/` y el comportamiento existente de `CARGO_TARGET_DIR`; NSH no
añade configuración de Cargo para reubicarla. `--out` sigue sobrescribiendo la ubicación de salida.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

Compila la app. Para una app Rust (`nsh.json` `"root"`), compila y describe los crates de la app y escribe `app.json` y los archivos que distribuye (`assets/`): sus runners montan la raíz. Para una app TSX, empaqueta la app en un bundle y la compila a bytecode de QuickJS, para las apps que integran NSH y distribuyen el bundle por su cuenta.

| Opción | Valor por defecto | Descripción |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | Directorio de salida. |
| `--release` | | Minifica y elimina la información de depuración. |
| `--split` | | Coloca lo que `import()` carga en archivos de chunk propios, que se descargan al importarse por primera vez (apps web, véase [Bundles divididos](./web.md#split-bundles)). Sin esta opción, el bundle contiene toda la app. |

Escribe:

| Archivo | Contenido |
|---|---|
| `bundle.js` | El bundle como JavaScript |
| `bundle.js.map` | Su source map (los stack traces se asignan de vuelta a tus fuentes) |
| `bundle.nshc` | El bundle como bytecode compilado: lo que cargan las apps |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | Con `--split`: cada chunk, su source map y su bytecode (`Screen.js` para `import("./Screen")`) |
| `capabilities.json` | El `capabilities` de `nsh.json`, si está declarado (se elimina en caso contrario) |
| `assets/` | Cada imagen y fuente importada, en su ruta relativa a la raíz de la app |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

Compila una app instalable en modo release. Una app Rust (`nsh.json` `"root"`) se empaqueta con su propio runner, compilado con Cargo a partir de tus crates y los de NSH, con su raíz montada y sin QuickJS ([Building with Rust](./rust.md)); una app TSX, con el runtime precompilado. No interviene ningún proyecto de Xcode ni compilación de Gradle: NSH ensambla el bundle de la app por sí mismo y usa `actool` y `codesign` de Xcode (iOS) o `aapt2`, `zipalign` y `apksigner` del SDK (Android); para macOS ensambla un `.app` con firma ad hoc mediante `codesign` (y `sips` para el icono); para Linux copia el runner y escribe un `.tar.gz` con `tar`; para Windows copia el runner, incrusta el icono y escribe un `.zip`, sin herramientas adicionales; para la web escribe un sitio estático, sin herramientas adicionales. Los metadatos provienen de `nsh.json` y los sobrescriben las opciones.

| Opción | Descripción |
|---|---|
| `--target <TARGET>` | Obligatoria. `ios`: dispositivos iOS, un `.ipa` firmado (o un `.app` sin firmar si no se indica `--sign`). `ios-simulator`: un `.app` con firma ad hoc. `android`: un `.apk` firmado. `macos`: un `.app` con firma ad hoc ([macOS](./macos.md#packaging)). `linux`: un directorio `<Name>/` (el ejecutable, `nsh/`, un archivo `.desktop`) y `<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows`: un directorio `<Name>\` (`<Name>.exe`, `nsh\`) y `<Name>.zip` ([Windows](./windows.md#packaging)). `web`: un directorio `<Name>/`, un sitio estático (`index.html` y archivos con nombre derivado de su contenido) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | Directorio de salida (por defecto `.nsh/out`). |
| `--name <NAME>` | Nombre visible. |
| `--id <ID>` | Identificador del bundle, p. ej. `com.example.app`. |
| `--app-version <VERSION>` | Versión, p. ej. `1.2.0`. |
| `--build <BUILD>` | Número de compilación. |
| `--icon <ICON>` | Icono de la app: un PNG cuadrado, idealmente de 1024×1024. |
| `--sign <IDENTITY>` | Dispositivos iOS: identidad de firma de código, p. ej. `"Apple Development: …"`. |
| `--profile <FILE>` | Dispositivos iOS: perfil de aprovisionamiento (`.mobileprovision`). Los entitlements provienen de él. |
| `--keystore <FILE>` | Android: keystore de release. Por defecto: la clave de depuración en `~/.android/debug.keystore` (se crea si no existe). |
| `--key-alias <ALIAS>` | Android: alias de la clave en el keystore. |
| `--keystore-password <PASSWORD>` | Android: contraseña del keystore. También se lee de `NSH_KEYSTORE_PASSWORD`. |
| `--abi <ABI>` | Android: las ABI del APK (`arm64-v8a`, `armeabi-v7a`, `x86_64`), repetidas o separadas por comas. Por defecto: `arm64-v8a` y `armeabi-v7a`, más la del dispositivo con `--run`. |
| `--run` | Instala y lanza la app después: en el simulador (`ios-simulator`) o en el dispositivo Android conectado; `macos`, `linux` y `windows` la lanzan; `web` sirve el sitio en esta máquina en la dirección que imprime. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Consulta [Empaquetado](./packaging.md).

## Signing commands

Estos comandos crean y comprueban paquetes firmados (`.nshpkg`): bundles de apps que las apps que integran NSH descargan y verifican antes de ejecutarlos. [Paquetes firmados](./signed-packages.md) explica el modelo (una clave raíz offline certifica claves de release para ciertos ids de app).

### nsh keygen

```sh
nsh keygen <NAME>
```

Crea un par de claves Ed25519: `<NAME>.secret` y `<NAME>.pub` (p. ej. `nsh keygen keys/root`). Mantén el `.secret` de una raíz offline; las apps confían en su `.pub`.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

Certifica una clave de release con una clave raíz para ciertos ids de app y una ventana de tiempo; los paquetes llevan el certificado.

| Opción | Descripción |
|---|---|
| `--root <ROOT>` | La clave secreta de la raíz. |
| `--key <KEY>` | La clave pública de la clave de release. |
| `--apps <APPS>` | Ids de app para los que puede firmar: `*`, `com.example.*` o un id. Repetible. |
| `--days <DAYS>` | Durante cuánto tiempo puede firmar, a partir de ahora (por defecto 365). |
| `-o, --out <OUT>` | El certificado que se escribe. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

Compila la app en modo release y la firma en un paquete. Los metadatos provienen de `nsh.json` y los sobrescriben las opciones.

Si se le da un paquete (`ENTRY` es un archivo `.nshpkg`), lo vuelve a firmar con esta clave, como hace una plataforma que firma
los paquetes de sus apps con una clave propia. Los archivos y la cabecera del paquete se mantienen; su certificado,
la hora de firma y la firma pasan a ser los de la nueva clave ([Paquetes firmados](./signed-packages.md#sign-a-package-again)). `-o`
puede nombrar el paquete leído, y solo se aplican `--key`, `--cert` y `-o`.

| Opción | Descripción |
|---|---|
| `--key <KEY>` | La clave secreta de la clave de release. |
| `--cert <CERT>` | Su certificado (`nsh certify`). |
| `-o, --out <OUT>` | El paquete que se escribe. Por defecto: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | Id de la app. |
| `--app-version <VERSION>` | Versión. |
| `--build <BUILD>` | Número de compilación: debe crecer con cada release. |
| `--source-map <WHERE>` | Dónde va el source map: `package` (por defecto), `file` (`<package>.map` junto al paquete) o `none` ([Paquetes firmados](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | Omite las tablas de líneas y columnas del bytecode: más pequeño, pero los stacks de error no tienen posiciones. |
| `--min-runtime <VERSION>` | El runtime más antiguo que ejecuta el paquete, p. ej. `0.2.0`; los runtimes anteriores lo rechazan. Por defecto: la versión de este CLI ([Paquetes firmados](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

Verifica un paquete como lo haría una app que confía en las raíces indicadas. Sin `--root`, solo se comprueba la firma propia del paquete. Imprime el SHA-256 del paquete, que `nsh revoke --package` acepta.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

Reescribe las posiciones del bundle (`bundle.js:LINE:COL`) de un error que informó un paquete a tus fuentes e imprime el
resultado. `MAP` es un source map (`<package>.map` de `nsh publish --source-map file`, `bundle.js.map`) o un paquete que
contenga uno; `INPUT` es el texto del error (por defecto: la entrada estándar).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

Firma una lista de revocación: claves de release y paquetes que ya no deben cargarse.

| Opción | Descripción |
|---|---|
| `--root <ROOT>` | La clave secreta de la raíz. |
| `--extend <EXTEND>` | Conserva las entradas de esta lista (la última publicada). |
| `--sequence <N>` | El número de la lista, mayor que el de cualquiera publicada antes. Por defecto con `--extend`: el de esa lista más uno. |
| `--key <ID>` | Un id de clave de release que se revoca. Repetible. |
| `--package <SHA256>` | Un SHA-256 de paquete que se revoca. Repetible. |
| `-o, --out <OUT>` | La lista que se escribe. |

## Environment variables

| Variable | Usada por | Descripción |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Targets de Android | El SDK de Android. Alternativa: `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | apps con crates de Rust | Dónde se compilan los runners de la app. Por defecto: el `target/` de la app. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | La contraseña del keystore. |
| `NSH_RUNTIME` | `run`, `package` | Un directorio de runtime que se usa en lugar del que está junto al CLI. |
| `NSH_VERBOSE` | todos los comandos | `1`: como `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | El CLI de `wasm-bindgen` para una app cuyos crates [llaman a APIs del navegador](./web.md#browser-apis-from-rust). Por defecto: el que esté en `PATH`. |
| `NO_COLOR` | todos los comandos | Si está definida: sin colores en los terminales. |
