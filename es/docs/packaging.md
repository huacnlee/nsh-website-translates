---
title: "Empaquetado"
description: "Compila aplicaciones instalables en Rust y TSX con nsh package para dispositivos iOS, el simulador de iOS, Android, macOS, Windows, Linux y la web, con metadatos de la aplicación, iconos y firma."
order: 19
group: platforms
source_hash: 74c2991490481926
---


# Empaquetado

`nsh package` convierte una app en algo que puedes instalar: un `.app` para el simulador de iOS, un `.ipa` firmado para dispositivos iOS, un `.apk` firmado para Android, un `.app` con firma ad hoc para macOS, un directorio y `.tar.gz` para Linux, un directorio y `.zip` para Windows, o un sitio estático para la web. No necesita proyecto de Xcode ni Gradle.

- **Una app de Rust** (`nsh.json` nombra su `"root"`) se empaqueta desde su directorio. `nsh` compila el runner del destino en modo release con tu crate incluido y la raíz montada, sin QuickJS: Cargo, el target de Rust de la plataforma (`rustup target add …`) y, para Android, el NDK.
- **Una app TSX** indica su entrada. Su build de release (minificado, compilado a bytecode de QuickJS, exactamente como lo compila `nsh build --release`) se coloca junto al **runtime precompilado** que se distribuye con NSH, por lo que no necesita toolchain de Rust. Una app con un crate propio (`"rust"` sin `"root"`) obtiene runners compilados con su crate.

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

El resultado se genera en `.nsh/out/` a menos que pases `--out`. Las secciones siguientes muestran el comando de cada destino para una app de Rust; una app TSX añade su entrada (`nsh package App.tsx --target …`).

> [!NOTE]
> Para poner NSH *dentro* de una app nativa existente, consulta [Plataformas](./platforms.md#embed-in-a-native-app) y, para una app de
> GPUI o GPUI Kit, [GPUI](./gpui.md#embedding-in-a-gpui-app). Para publicar actualizaciones que las apps descargan y verifican, consulta
> [Paquetes firmados](./signed-packages.md).

<a id="app-metadata-30"></a>

## Metadatos de la app: `nsh.json`

`nsh package` lee `nsh.json` en el directorio de la app (junto al archivo de entrada de una app TSX). `nsh init` escribe uno:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| Clave | Tipo | Valor por defecto | Uso |
|---|---|---|---|
| `name` | cadena | el nombre del directorio de la entrada | El nombre visible bajo el icono (`CFBundleDisplayName`, `android:label` en Android) y el nombre del archivo de salida. |
| `id` | cadena | obligatorio | El identificador de bundle / nombre de paquete de Android, en formato DNS inverso bajo un dominio que te pertenezca. También da nombre al lugar donde la app guarda su [almacenamiento](../modules/nsh.md#storage), de modo que cada app tiene el suyo. `nsh package` y `nsh publish` avisan sobre el marcador de posición `com.example.`. |
| `version` | cadena | `"1.0.0"` | La versión visible para el usuario (`CFBundleShortVersionString`, `versionName`). |
| `build` | número | `1` | El número de compilación (`CFBundleVersion`, `versionCode`). Increméntalo en cada versión que subas. |
| `icon` | cadena | ninguno | Un PNG cuadrado, idealmente de 1024×1024, relativo a `nsh.json`. |

`nsh.json` también contiene `rust` y `root` (los crates de la app y su componente raíz, [Compilar con Rust](./rust.md)),
`theme` y `appearance`, `tailwind` (consulta [Tailwind](./tailwind.md)) y `capabilities` (consulta
[Sandbox y capacidades](./sandbox-and-capabilities.md)); [Estructura del proyecto](./project-structure.md#nshjson) enumera
todas las claves. Las claves desconocidas producen un error.

Cada una de las claves anteriores se puede sobrescribir en la línea de comandos, lo cual es útil en CI:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## Opciones

| Opción | Descripción |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | Para qué compilar (obligatorio). |
| `-o, --out <dir>` | Directorio de salida. Por defecto `.nsh/out`. |
| `--name <name>` | Nombre visible. |
| `--id <id>` | Identificador de bundle, como `com.example.app`. |
| `--app-version <version>` | Versión, como `1.2.0`. |
| `--build <n>` | Número de compilación. |
| `--icon <png>` | Icono de la app: un PNG cuadrado, idealmente de 1024×1024. |
| `--sign <identity>` | iOS: la identidad de firma de código para dispositivos. |
| `--profile <file>` | iOS: el perfil de aprovisionamiento para dispositivos (`.mobileprovision`). |
| `--keystore <file>` | Android: un keystore de release (por defecto: la clave de debug). |
| `--key-alias <alias>` | Android: el alias de la clave en el keystore. |
| `--keystore-password <password>` | Android: la contraseña del keystore; también se lee de `NSH_KEYSTORE_PASSWORD`. |
| `--abi <abi>` | Android: las ABI del APK, repetidas o separadas por comas (por defecto: `arm64-v8a` y `armeabi-v7a`). |
| `--run` | Instalar y ejecutar después: en el simulador de iOS, o en el dispositivo o emulador Android que `adb` detecte; las apps de macOS, Linux y Windows se ejecutan en esta máquina; un sitio web se sirve en esta máquina y se abre en el navegador. No disponible para `--target ios`. |

<a id="ios-simulator"></a>

## Simulador de iOS

```sh
nsh package --target ios-simulator --run
```

Escribe `.nsh/out/<Name>.app`, con firma ad hoc (el simulador necesita una firma, pero no una identidad). Con `--run` arranca un
simulador si no hay ninguno en ejecución, instala la app y la lanza. Requiere Xcode.

<a id="ios-devices"></a>

## Dispositivos iOS

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

Escribe `.nsh/out/<Name>.ipa`, listo para TestFlight, para las herramientas de subida a App Store o para la instalación directa (según el
perfil). Qué ocurre:

- El perfil de aprovisionamiento se copia en la app como `embedded.mobileprovision`.
- Los entitlements provienen del perfil. NSH comprueba que el identificador de aplicación del perfil cubra el `id` de la app
  (funcionan perfiles comodín como `TEAMID.*` o `TEAMID.com.example.*`) y, en caso contrario, se detiene con un error.
- La app se firma con `codesign` usando la identidad y después se comprime en un `.ipa` (`Payload/<Name>.app`).

Encuentra tus identidades con:

```sh
security find-identity -v -p codesigning
```

Sin `--sign` y `--profile`, NSH escribe un `.nsh/out/<Name>.app` sin firmar y te lo indica; no se puede instalar en un
dispositivo tal cual.

La app admite iPhone y iPad, en vertical y horizontal (vertical invertido solo en iPad), y requiere iOS 15.0 o
posterior.

## Android

```sh
nsh package --target android --run
```

Escribe `.nsh/out/<Name>.apk`. El APK se ensambla directamente con las herramientas de compilación del SDK (`aapt2`, `zipalign`, `apksigner`),
sin Gradle. Requisitos:

- El SDK de Android, localizado mediante `ANDROID_HOME` (o `ANDROID_SDK_ROOT`, o `~/Library/Android/sdk`), con build tools
  y el paquete `platforms;android-35`. NSH te indica el comando `sdkmanager` cuando falta alguno.
- Un JDK, para crear el keystore de debug la primera vez.
- Para una app de Rust, el NDK de Android (`sdkmanager "ndk;<version>"`, o `ANDROID_NDK_HOME`), que compila su
  `libnsh.so`.

La app tiene como objetivo la API 35 y requiere la API 28 (Android 9) o posterior. Contiene código nativo para las ABI de los teléfonos,
`arm64-v8a` y `armeabi-v7a`; con `--run`, también la del dispositivo, como el `x86_64` de un emulador. `--abi` las elige
tú mismo, por ejemplo `--abi arm64-v8a` solo para teléfonos de 64 bits, el APK más pequeño:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Firma para release

Sin `--keystore`, el APK se firma con la clave de debug estándar (`~/.android/debug.keystore`, que se crea si no existe),
y NSH avisa de que no sirve para publicar en tiendas. Para un release, crea un keystore una sola vez y pásalo:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

Prefiere la variable de entorno a `--keystore-password` para que la contraseña no acabe en el historial de tu shell.

## macOS

```sh
nsh package --target macos --run
```

Escribe `.nsh/out/<Name>.app`: el ejecutable en `Contents/MacOS/`, y `nsh/assets/…`, `nsh/app.json` (el título de la ventana
y la apariencia de la app) y, en una app TSX, su `nsh/bundle.nshc` en `Contents/Resources/`. La app tiene firma ad hoc y requiere macOS 14 o
posterior; para distribuirla, fírmala con un Developer ID y notarízala. Consulta [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

Escribe `.nsh/out/<Name>/` (el ejecutable `<Name>`, `nsh/assets/…`, `nsh/app.json` con el título de la ventana y el
id de la aplicación, el `nsh/bundle.nshc` de una app TSX, `<id>.desktop` y el icono `<id>.png`) y lo mismo que
`.nsh/out/<Name>.tar.gz`. Empaqueta en
Linux: el runner se compila para la máquina en la que se compila. GTK 4 (4.14 o posterior), Pango y WebKitGTK 6.0 (para las web
views) deben estar instalados donde se ejecute la app. Para su instalación y la entrada de escritorio: [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

Escribe `.nsh\out\<Name>\` (el ejecutable `<Name>.exe` con el icono de la app, `nsh\assets\…`, `nsh\app.json` con el
título de la ventana, el id de la app, la versión y la apariencia, y el `nsh\bundle.nshc` de una app TSX) y lo mismo que
`.nsh\out\<Name>.zip`. Una app TSX no necesita herramientas; el runner de una app de Rust se compila con Visual Studio Build Tools. Empaqueta en Windows: el runner se compila para la máquina en la que se compila, y solo Windows puede
incrustar el icono. La app se ejecuta desde donde se copie su directorio; no se instala nada. Consulta
[Windows](./windows.md#packaging).

## Web

```sh
nsh package --target web --run
```

Escribe `.nsh/out/<Name>/`, un sitio estático: `index.html`, `manifest.webmanifest`, el script de la página (`nsh.<digest>.js`)
y `nsh.<digest>.wasm` (el motor y el crate de una app de Rust; en una app TSX, el runtime, junto al módulo ES de la app
`app.<digest>.js`), sus assets e iconos, cada uno con un nombre derivado de su contenido
para que los hosts puedan almacenarlos en caché de forma indefinida. Despliega el directorio en cualquier servidor web o CDN; `--run` lo sirve en
`http://127.0.0.1:4173/` para que lo abras. Cabeceras de caché e incrustación: [Web](./web.md#publish-an-app).

<a id="icons"></a>

## Iconos

Proporciona un PNG cuadrado, idealmente de 1024×1024, en `nsh.json` (`"icon": "icon.png"`) o con `--icon`:

- **iOS:** compilado por `actool` de Xcode en el catálogo de assets de la app (`Assets.car`), que deriva todos los tamaños que
  necesita iOS.
- **Android:** redimensionado a 192×192 y usado como icono del launcher (`mipmap-xxxhdpi`).
- **macOS:** convertido por `sips` a `AppIcon.icns`.
- **Linux:** copiado como `<id>.png`, que el archivo `.desktop` nombra como su `Icon`.
- **Windows:** redimensionado de 16 a 64 píxeles y a 256 píxeles e incrustado en el ejecutable como su icono, que muestran la ventana,
  el Explorador y la barra de tareas.
- **Web:** redimensionado a 32 píxeles (el favicon), 180 (`apple-touch-icon`), 192 y 512 (el manifiesto de la aplicación web).

Sin icono, el sistema muestra el suyo por defecto.

<a id="what-is-inside"></a>

## Qué contiene

El paquete de una app de Rust es su runner, compilado con tu crate y su raíz montada, y los assets que registran sus crates
(`assets!()`). El paquete de una app TSX contiene su bytecode, su `capabilities.json` (cuando declara capacidades) y los
assets que importa, junto al runtime precompilado:

| Destino | Runtime | Una app TSX |
|---|---|---|
| iOS | el ejecutable `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (sin símbolos, almacenado sin comprimir, alineado a 16 KB) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | el ejecutable `nsh-macos-app`, renombrado a `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | el ejecutable `nsh-linux-app`, renombrado a `<Name>` | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | el ejecutable `nsh-windows-app.exe`, renombrado a `<Name>.exe` | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

Una app empaquetada no registra [componentes nativos](./native-components.md); para ellos, incrusta NSH en tu propia app.

<a id="finding-the-runtime"></a>

## Localizar el runtime

Una app de Rust compila sus propios runners. Para las apps TSX, `nsh package` busca el runtime precompilado junto a la CLI (`bin/../runtime` en la distribución). En un checkout de
NSH usa `target/<triple>/<profile>` y `target/android/<profile>`, con el perfil de la propia CLI (una CLI de debug usa
runtimes de debug): compílalos con `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (o `aarch64-apple-ios`
para dispositivos) y `cargo xtask android` (añade `--release` para una CLI de release); `nsh-macos-app` (en macOS), `nsh-linux-app` (en Linux) y `nsh-windows-app` (en Windows) se compilan para esta
máquina en `target/<profile>` (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`); el runtime web se compila con el perfil `web` sea cual sea el de la CLI, en `target/wasm32-unknown-unknown/web/`. La variable de entorno `NSH_RUNTIME`
apunta la CLI a otro directorio organizado como el `runtime/` de la distribución (`ios/iphoneos`,
`ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...).

<a id="see-also"></a>

## Véase también

- [CLI](./cli.md): todos los comandos
- [Paquetes firmados](./signed-packages.md): actualizaciones que las apps descargan
- [Estructura del proyecto](./project-structure.md): `nsh.json` y los archivos de una app
