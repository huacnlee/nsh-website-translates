---
title: "Paquetes firmados"
description: "Distribuya código de aplicación que las aplicaciones host descargan y verifican: claves, certificados, nsh publish, nueva firma, verificación, revocación y protección contra reversiones."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---


# Paquetes firmados

Un paquete firmado (`.nshpkg`) es la forma en que una app anfitriona ejecuta código NSH que no venía incluido con ella: una actualización de sus propias pantallas NSH, o una mini app de terceros. `nsh publish` compila la app y la firma; la app anfitriona verifica la firma, la cadena de certificados, las revocaciones y el número de build antes de ejecutar nada.

Un paquete contiene TSX. El código Rust de la app anfitriona (una app escrita en Rust, los componentes, módulos y clases de sus crates) forma parte de la propia app anfitriona y se entrega con ella, y el TSX de un paquete lo importa mediante sus especificadores, como hace cualquier TSX ([Desarrollo con Rust](./rust.md#extending-a-rust-app-with-tsx)). Así, una app en Rust mantiene su núcleo en Rust y entrega como paquetes firmados las pantallas que cambian con frecuencia.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH verifica y ejecuta paquetes; no los distribuye. De dónde vienen los paquetes (tu servidor de actualizaciones, una CDN, una tienda de mini apps) y cuándo los descarga la app depende de la app anfitriona.

<a id="why-packages-are-signed"></a>

## Por qué se firman los paquetes

El JS que ejecuta una app anfitriona puede acceder a todo lo que la app [concede](./sandbox-and-capabilities.md), por lo que debe provenir de alguien en quien la app confíe. Hay una segunda razón: NSH distribuye las apps como bytecode de QuickJS, que carga más rápido que el código fuente, pero QuickJS no valida el bytecode, y un bytecode manipulado puede corromper la memoria. Por eso NSH solo carga bytecode de los recursos propios de la app (firmados por el sistema), del servidor de desarrollo al que se conectó el desarrollador y de paquetes verificados. Todo lo demás debe ser código fuente JS.

<a id="keys-two-levels"></a>

## Claves: dos niveles

- Una **clave raíz** permanece sin conexión. Las apps anfitrionas confían en su clave pública; pueden confiar en varias raíces, que es la forma de rotar una raíz.
- Una raíz **certifica claves de release**: un certificado nombra la clave de release, los ids de app para los que puede firmar y una ventana de tiempo.
- **Los paquetes los firma una clave de release** y llevan su certificado. Por lo tanto, las claves de release pueden rotarse (o revocarse) sin actualizar las apps anfitrionas, que solo conocen la raíz.

Cada clave tiene un id derivado de su clave pública (los primeros 8 bytes de su SHA-256, en hexadecimal), que muestra cada comando.

<a id="create-the-keys"></a>

### Crear las claves

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

Cada clave son dos archivos: `<name>.secret` (legible solo por su propietario) y `<name>.pub`, ambos de una línea en base64. `nsh keygen` nunca sobrescribe una clave existente.

> [!CAUTION]
> Mantén `root.secret` sin conexión, por ejemplo en una unidad cifrada guardada en una caja fuerte. Quien la tenga puede certificar claves que toda app anfitriona que confíe en la raíz aceptará. Las claves de release pertenecen a la máquina de compilación o a los secretos de CI.

<a id="certify-a-release-key"></a>

### Certificar una clave de release

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Opción | Descripción |
|---|---|
| `--root <file>` | La clave secreta de la raíz. |
| `--key <file>` | La clave pública de la clave de release. |
| `--apps <pattern>` | Ids de app para los que puede firmar: `*` (cualquiera), `com.example.*` (ids bajo `com.example.`) o un id exacto. Repetible. |
| `--days <n>` | Durante cuánto tiempo puede firmar, a partir de ahora. Por defecto, 365. |
| `-o, --out <file>` | El certificado que se escribirá. |

El certificado es un pequeño archivo JSON; no es secreto.

<a id="publish-a-package"></a>

## Publicar un paquete

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` compila la app en modo release y la firma. El id de app, el nombre, la versión y el build provienen de `nsh.json` junto al punto de entrada, y los sobrescriben las opciones:

| Opción | Descripción |
|---|---|
| `--key <file>` | La clave secreta de la clave de release. |
| `--cert <file>` | Su certificado. |
| `-o, --out <file>` | El paquete que se escribirá. Por defecto, `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <id>` | Id de app, como `com.example.app`. |
| `--app-version <version>` | Versión, como `1.2.0`. |
| `--build <n>` | Número de build. Obligatorio (aquí o en `nsh.json`); debe aumentar con cada release. |
| `--source-map <where>` | `package` (el valor por defecto): dentro del paquete. `file`: en `<package>.map` junto a él, fuera del paquete. `none`: omitido. Consulta [Errores de paquetes publicados](#errors-from-published-packages). |
| `--strip-debug` | Omite las tablas de líneas y columnas del bytecode: un paquete más pequeño cuyas trazas de error no tienen posiciones. |
| `--min-runtime <version>` | El runtime más antiguo que ejecuta el paquete, como `0.2.0` (`nsh.json` `minRuntime`). Por defecto: la versión de este CLI. Consulta [Qué runtimes ejecutan un paquete](#which-runtimes-run-a-package). |

`nsh publish` se niega a firmar lo que un dispositivo rechazaría: el certificado debe cubrir el id de app y la hora actual.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### Qué runtimes ejecutan un paquete

Un paquete indica el runtime de NSH más antiguo que lo ejecuta, y las apps anfitrionas con un runtime más antiguo lo rechazan antes de ejecutar nada:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

Por defecto, esta es la versión del CLI que compiló el paquete: el bundle se compila contra los módulos de ese CLI, por lo que ese runtime es el que se sabe que lo ejecuta. Cuando las apps anfitrionas en producción tienen un runtime más antiguo y la app usa solo lo que ese runtime ofrece, publica para él con `--min-runtime` (o `minRuntime` en `nsh.json`):

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

La versión es `MAJOR.MINOR.PATCH`; un sufijo de pre-release (`0.2.0-beta.1`) cuenta como su versión sin él. No puede ser más reciente que el CLI. Prueba el paquete en una app anfitriona con ese runtime antes de subirlo: un import o una función que el runtime más antiguo no tiene falla cuando se carga el módulo.

<a id="what-a-package-holds"></a>

### Qué contiene un paquete

Un paquete es un único archivo: una cabecera JSON (id de app, nombre, versión, build, las capacidades declaradas, la versión del bytecode, el runtime mínimo, la hora de firma, el certificado de la clave de release y una tabla de archivos con su SHA-256), después los archivos, y por último la firma Ed25519 de la clave de release sobre todo lo anterior. Los archivos son:

- el código fuente JS de la app (siempre),
- su bytecode, que se usa solo cuando el runtime del dispositivo tiene la misma versión de bytecode (de lo contrario se ejecuta el código fuente, de modo que un paquete sigue funcionando en runtimes más nuevos),
- su source map (salvo que se publicara con `--source-map file` o `none`),
- los assets que importa (imágenes, fuentes).

La identidad del paquete, usada para la revocación, es el SHA-256 del archivo completo.

<a id="packages-from-newer-versions-of-nsh"></a>

### Paquetes de versiones más nuevas de NSH

Una app anfitriona ejecuta paquetes firmados por un `nsh publish` más nuevo, siempre que su runtime sea al menos el [runtime mínimo](#which-runtimes-run-a-package) del paquete. Lo que una versión más nueva añade y el runtime del anfitrión no conoce se omite, y nunca amplía lo que el paquete puede hacer:

- los campos de cabecera y los archivos que no conoce se ignoran (siguen cubiertos por la firma y sus hashes), salvo que el paquete marque un campo como uno que su runtime debe entender: en ese caso los runtimes más antiguos lo rechazan;
- las [capacidades](./sandbox-and-capabilities.md) que no conoce no se conceden, y una capacidad o una concesión de `http` con una clave que no conoce se descarta por completo, ya que esa clave podría restringirla.

Lo que se omitió se registra en el log cuando se carga el paquete.

<a id="sign-a-package-again"></a>

## Volver a firmar un paquete

Una plataforma que distribuye los paquetes de varias apps puede firmarlos todos con una clave propia: CI compila cada paquete y lo firma con una clave en la que confían sus apps de prueba, y la plataforma lo firma de nuevo con la clave en la que confían las apps de producción.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Opción | Descripción |
|---|---|
| `--key <file>` | La clave secreta de la clave de release. |
| `--cert <file>` | Su certificado. |
| `-o, --out <file>` | El paquete que se escribirá. Puede ser el paquete leído. Por defecto: `.nsh/out/<id>-<build>.nshpkg`. |

El paquete conserva todo lo que CI puso en él: los archivos, el id de app, la versión y el build, las capacidades declaradas, el [runtime mínimo](#which-runtimes-run-a-package) y lo que escribió una [versión más nueva de NSH](#packages-from-newer-versions-of-nsh). El certificado, la hora de firma y la firma pasan a ser los de la nueva clave, por lo que el paquete tiene un SHA-256 propio, el que sirve para [revocarlo](#revoke-keys-and-packages).

Antes de firmar, `nsh publish` comprueba que el paquete está intacto (firmado por la clave que nombra su certificado, con su tabla de archivos cubriendo los datos y cada archivo coincidiendo con su hash) y que el nuevo certificado cubre el id de app y la hora actual. A partir de ese momento la nueva firma avala el paquete, incluido su bytecode, por lo que una plataforma vuelve a firmar los paquetes que hicieron sus propias compilaciones. Las herramientas en Rust vuelven a firmar con `nsh_package::resign(&bytes, &key, &certificate)`.

<a id="verify-a-package"></a>

## Verificar un paquete

`nsh verify` comprueba un paquete exactamente como lo haría una app anfitriona que confíe en las raíces indicadas:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Opción | Descripción |
|---|---|
| `--root <file>` | La clave pública de una raíz de confianza. Repetible. Sin ninguna, solo se comprueba la firma propia del paquete. |
| `--revocations <file>` | Una lista de revocación que se aplica primero. |

Un dispositivo comprueba, en orden:

1. la firma del certificado por una raíz de confianza;
2. que la clave de release no esté revocada;
3. la firma del paquete por la clave de release;
4. que el certificado cubra el id de app y la hora de firma;
5. el runtime mínimo que necesita el paquete;
6. que la tabla de archivos cubra exactamente los datos y que cada archivo coincida con su hash;
7. que el propio paquete no esté revocado;
8. que su build no sea anterior al build más alto de esa app aceptado anteriormente (protección contra rollback).

Un paquete rechazado genera un error que indica qué comprobación falló; la app que se estaba ejecutando sigue ejecutándose.

<a id="revoke-keys-and-packages"></a>

## Revocar claves y paquetes

Una raíz firma **listas de revocación**: claves de release y paquetes que ya no deben cargarse.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Opción | Descripción |
|---|---|
| `--root <file>` | La clave secreta de la raíz. |
| `--extend <file>` | Conserva las entradas de esta lista (la última publicada). |
| `--sequence <n>` | El número de la lista, mayor que el de cualquier lista publicada antes. Con `--extend`, por defecto es el de esa lista más uno. |
| `--key <id>` | El id de una clave de release que se revocará. Repetible. |
| `--package <sha256>` | El SHA-256 de un paquete (tal como lo muestra `nsh verify`) que se revocará. Repetible. |
| `-o, --out <file>` | La lista que se escribirá. |

Un almacén de confianza solo acepta una lista con un número de secuencia mayor que el que ya tiene, de modo que una lista antigua no puede reutilizarse para deshacer una revocación. Publica la lista más reciente donde tus apps la obtengan, y aplícala con `updateRevocations` antes de abrir paquetes.

<a id="rollback-protection"></a>

## Protección contra rollback

Cuando una app anfitriona acepta un paquete, su almacén de confianza registra el número de build para ese id de app y, a partir de entonces, rechaza los builds más antiguos. Un atacante que haya obtenido un paquete firmado más antiguo con una vulnerabilidad conocida no puede lograr que la app lo ejecute. El registro persiste en el directorio de estado del almacén (`nsh-trust.json`), por lo que sobrevive a los reinicios. En GPUI, una app anfitriona puede registrarlo más tarde, una vez que el nuevo paquete haya demostrado funcionar correctamente (`verify_package`, y después `accept_package`; véase más abajo).

<a id="loading-packages-in-a-host-app"></a>

## Cargar paquetes en una app anfitriona

La verificación calcula el hash de todo el paquete y extrae sus assets (una vez por paquete, en el directorio del almacén de confianza), por lo que se ejecuta fuera del hilo de la UI; la ejecución del resultado ocurre en él.

**GPUI (Rust)**, donde la app anfitriona también puede aceptar un paquete solo después de que haya demostrado funcionar correctamente:

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)**:

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

Hasta que se acepta un paquete, el build aceptado anteriormente sigue verificándose, de modo que una app anfitriona cuyo nuevo paquete falla puede volver al que ejecutaba (los errores fatales de `AppView::on_error`, o un fallo antes de aceptar, son las señales). Los builds más antiguos que el aceptado siguen rechazados, y un paquete revocado entretanto no se acepta. `load_package` verifica y acepta a la vez, como hace `openPackage` en iOS y Android.

Las [capacidades](./sandbox-and-capabilities.md) declaradas del paquete viajan con él: un paquete solo puede hacer lo que declara, y solo lo que la app anfitriona conceda además.

API completa: [GPUI](./gpui.md#embedding-in-a-gpui-app), [Integración en apps iOS](./ios.md#signed-packages), [Integración en apps Android](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## Errores de paquetes publicados

El bytecode de un paquete conserva sus tablas de líneas y columnas, por lo que sus errores tienen posiciones, y el runtime las asigna a tus fuentes con el source map del paquete antes de entregarlas al gestor de errores de la app anfitriona:

```text
Error: boom
    at n (App.tsx:5:3)
```

El source map contiene los fuentes originales de tu app y suele ser el archivo más grande de un paquete: cerca de la mitad de los 2,6 MB del ejemplo gallery. Para reservártelo, publícalo junto al paquete en lugar de dentro:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

Entonces los dispositivos informan de las posiciones del bundle (`at n (bundle.js:1:80)`). Conserva el mapa junto con el paquete al que pertenece, y traduce lo que informó la app anfitriona con `nsh symbolicate`:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` lee el texto del error desde un archivo o la entrada estándar y acepta un archivo de mapa o un paquete que contenga uno. Las tablas de líneas añaden aproximadamente una quinta parte al bytecode (entre un 3 y un 5 % de un paquete con su mapa); `--strip-debug` las omite, y entonces las trazas muestran `at n (<null>:0:1)`, sin nada que mapear.

<a id="trying-a-package-in-development"></a>

## Probar un paquete en desarrollo

Los hosts de desarrollo que instala `nsh run` pueden ejecutar un paquete como lo haría una app que integra NSH.

En iOS, el ejecutable del host acepta `--package <file>` y uno o más `--root <root.pub>`. Una vez que `nsh run` ha instalado el host en el simulador (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

En Android, el host de desarrollo (`DevActivity`, instalado por `nsh run --target android`) acepta los extras `package` (una ruta en el dispositivo) y `root` (claves públicas en base64, separadas por comas):

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

Su estado de confianza reside en el directorio temporal (iOS) o de caché (Android), por lo que allí también se rechazan los builds más antiguos que uno que hayan aceptado.
<a id="a-release-checklist"></a>

## Lista de verificación de publicación

1. Mantén la clave raíz sin conexión; certifica una clave de publicación por equipo o por familia de apps, con una validez de un año o menos.
2. Incrementa `build` en `nsh.json` en cada publicación; `nsh publish` rechaza un paquete que no lo incluya.
3. Ejecuta `nsh verify --root root.pub` sobre el paquete antes de subirlo.
4. Incluye `root.pub` dentro de la app host; distribuye las listas de revocación por separado, para poder revocar sin actualizar la app.
5. Si se filtra una clave de publicación, revócala (`nsh revoke --extend … --key <id>`), certifica una nueva y vuelve a publicar.
6. Con una plataforma que firma para sus apps, dale a CI una raíz propia en la que confíen únicamente las apps de prueba, e incluye la raíz de la plataforma en las apps de producción; la plataforma vuelve a firmar los paquetes de CI (`nsh publish <package>`).

<a id="see-also"></a>

## Véase también

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
