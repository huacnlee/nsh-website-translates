---
title: "Módulos estándar"
description: "Once módulos estándar con forma de Node: utilidades LLRT fijadas y archivos, procesos y redes con verificación de capacidades."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell ofrece once módulos estándar para TSX, que se importan por su nombre simple (el código Rust usa las propias bibliotecas de Rust: [Desde Rust](#from-rust)): APIs con forma de Node compatibles con las de gpui-shell, que se ejecutan en la VM de la app sobre el runtime nativo de NSH, con sus capacidades verificadas en Rust. Sus declaraciones de TypeScript en `.nsh/types` se generan a partir de las mismas especificaciones que los módulos, de modo que lo que muestran los tipos es lo que exporta el runtime.

| Módulo | Exportaciones |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT); `Buffer` también es global |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT); `crypto` también es global |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default; `URL` y `URLSearchParams` son clases globales de NSH |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, cada una con su forma `Sync`, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: el `console` de la VM (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default; el objeto default también tiene `env` y `dataDir` y es el global `process` |
| `net` | `connect`, `Socket`, default |
| `websocket` | `connect(url, options?)` que resuelve un `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`), `WebSocketConnection`, default; el constructor global `WebSocket` en hosts nativos |

<a id="from-rust"></a>

## Desde Rust

El código Rust hace el mismo trabajo con la biblioteca estándar de Rust y crates.io, en el código nativo propio de la app: las llamadas bloqueantes se ejecutan en los hilos del runtime con `blocking(…)` y las asíncronas con `background(…)` (`nsh_core::prelude`), y sus resultados vuelven al componente en una tarea. Los `capabilities` de `nsh.json` rigen el TSX de la app y los servicios de NSH (`fetch`, el portapapeles); el código Rust propio de la app se ejecuta con los permisos del proceso de la app. En las apps de navegador, el código Rust accede a la red con `fetch` y conserva datos con `nsh_core::storage::Storage`.

| Módulo | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, el crate `base64` |
| `crypto` | crates como `sha2`, `hmac`, `rand` y `uuid` |
| `path` | `std::path` |
| `url` | el crate `url` |
| `zlib` | crates como `flate2`, `brotli` y `zstd` |
| `os` | `std::env::consts`, `os()` |
| `console` | el crate `log` |
| `fs/promises` | `std::fs` en `blocking(…)`; `Storage` para datos clave-valor |
| `process` | `std::process::Command` en `blocking(…)` |
| `net` | `std::net::TcpStream` en `blocking(…)`, o `tokio::net` en `background(…)` |
| `websocket` | un crate como `tokio-tungstenite` en `background(…)` |

<a id="imports-and-generated-types"></a>

## Importaciones y tipos generados

Cada módulo se importa exactamente con el nombre que figura en la tabla: `import { join } from "path"`, `import fs from "fs/promises"`. El bundler conserva estas importaciones y el runtime las sirve de forma nativa; el catálogo se compone de estos once nombres. `buffer`, `crypto`, `path`, `url` y `zlib` son implementaciones de LLRT, fijadas a `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`, con declaraciones proyectadas desde esa revisión sobre las exportaciones que tiene el runtime. Los demás son propios de NSH. NSH conserva la identidad de sus clases URL, Blob, stream y event.

Los once módulos se cargan en hosts nativos y en apps de navegador. `Buffer`, el hashing, la criptografía y la compresión usan la misma implementación portable en Rust sobre WebAssembly, incluidas las APIs síncronas; los valores aleatorios usan la entropía criptográfica del navegador. Las operaciones de `path` en el navegador usan rutas POSIX y un directorio de trabajo virtual `/`. Los archivos del navegador usan almacenamiento persistente privado de la app, y los WebSockets usan el transporte del navegador. La ejecución de procesos y las llamadas TCP sin procesar fallan con `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` en los navegadores.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Comparación con Node.js y gpui-shell

Los módulos siguen los nombres y las formas de Node para el subconjunto que exportan, y el comportamiento de gpui-shell donde este lo define. Decisiones propias de NSH:

- El `exists` de `fs/promises` es `true` para un enlace simbólico cuyo destino no existe, y `unlink`, `rename`, `rmdir`, `lstat` y `readlink` actúan sobre el propio enlace simbólico.
- `Stats` y `Dirent` tienen sus campos (`size`, `mtimeMs`, `name`, ...) como propiedades propias, igual que los de Node, y `isFile()`, `isDirectory()` y `isSymbolicLink()` en su prototipo.
- Un listener de `ChildProcess` recibe la carga del evento: el texto de salida, o el `{ code, signal }` de la salida (con `error` y `errorCode` cuando el runtime terminó el proceso hijo). `on` devuelve el proceso hijo. `run` resuelve `{ code, signal, stdout, stderr }`: la salida de gpui-shell con la señal que terminó el proceso hijo.
- El entorno de un proceso hijo es un conjunto pequeño proveniente del host más los nombres que se le conceden a la app, y se ejecuta en el directorio de datos de la app o en un `cwd` dentro de una raíz `fs.write` ([Procesos](#processes)).
- `process.platform`, `process.arch`, `os.platform()` y `os.arch()` ofrecen los nombres de `std::env::consts` de Rust, igual que los de gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"` ([Metadatos del SO](#os-metadata-and-logging)).
- `process.dataDir` es `null` cuando el host no tiene directorio de datos; `process.exit` le pide al host que cierre la superficie de la app.
- Los límites forman parte de cada API: los tamaños, las cantidades y los tiempos de espera se indican con cada módulo más abajo.

<a id="failures"></a>

## Fallos

Una función que devuelve una promesa informa de todos los fallos rechazándola, como hace el `fs/promises` de Node: un argumento incorrecto, una ruta o un host no concedidos a la app, un límite agotado y un error de E/S por igual, de modo que un único `catch` (o `.catch`) los maneja todos. Una función síncrona (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, el constructor del global `WebSocket` y `send`) lanza una excepción. Un uso incorrecto (un argumento de tipo erróneo, una opción fuera de su rango) es un `TypeError` o `RangeError`. Todo fallo que una app puede manejar incluye un `code`, que se mantiene igual de una versión a otra; el mensaje está escrito para personas y puede cambiar, por lo que las apps se ramifican según `code`:

| `code` | Qué significa |
|---|---|
| `ERR_ACCESS_DENIED` | Los `capabilities` de la app no permiten la llamada. El error incluye `permission`, la clave de la capacidad en `nsh.json` (`"fs"`, `"process"`, `"network"`), y `resource`, lo que se solicitó: la ruta, el comando (`"exit"` para `process.exit`), el `"host:port"` de un socket o la URL del WebSocket |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | La llamada pertenece a otras plataformas: los archivos se ejecutan en escritorios y navegadores, los procesos en escritorios, los sockets TCP en hosts nativos, `os.homedir()` en hosts que configuran un directorio home |
| `ERR_NSH_QUOTA_EXCEEDED` | Se agotó un límite del runtime: operaciones o datos en curso, procesos hijo, sockets, WebSockets, bytes en espera de envío, listeners |
| `ETIMEDOUT` | La llamada agotó su tiempo: el `timeoutMs` de `run`, una conexión, un handshake, una escritura o un cierre de WebSocket |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | La respuesta del sistema operativo, con los códigos de Node; `EACCES` y `EPERM` son el SO rechazando un archivo, al margen de las capacidades de la app |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | Los códigos de Node para un tamaño que supera un límite, una conexión cerrada y una salida que supera la captura de `run` |

```tsx
import fs from "fs/promises";

async function loadSettings(): Promise<string> {
  try {
    return await fs.readFile("${dataDir}/settings.json", "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "{}";
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.permission} ${error.resource}`);
    throw error;
  }
}
```

Un host puede conceder menos de lo que la app declara ([Sandbox y capacidades](../docs/sandbox-and-capabilities.md)), por lo que una app maneja `ERR_ACCESS_DENIED` igual que maneja una solicitud fallida.

<a id="os-metadata-and-logging"></a>

## Metadatos del SO y registro

`os.platform(): string` y `os.arch(): string` informan del SO y la arquitectura reales del host nativo, y `process.platform` y `process.arch` contienen los mismos valores. Son los nombres de `std::env::consts::OS` y `ARCH` de Rust, igual que los de gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` para el SO, `"aarch64"`, `"x86_64"` para la arquitectura, de modo que las apps comparan directamente con ellos (`process.platform === "macos"`). `os.EOL: string` es el separador de línea del host. `os.homedir(): string` devuelve una ruta home absoluta del host configurada; si no hay ninguna configurada, lanza un error con `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Las rutas de directorio son metadatos: las operaciones de archivo siguen requiriendo concesiones `fs.read` / `fs.write`.

Las apps de navegador leen un objeto `process.env` vacío, y `os.homedir()` lanza `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` allí, ya que las rutas home y las variables de entorno pertenecen a los hosts nativos.

`import console from "console"` comparte el objeto global `console` de la VM. El módulo tiene solo una exportación default, que admite `log`, `info`, `debug`, `warn`, `error`, cada uno con la firma `(...values: unknown[]): void`. Usa el formato del logger de NSH.

<a id="compression"></a>

## Compresión

`zlib` es el de LLRT, con un límite que añade NSH: cada descompresión (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` y sus formas `Sync`) produce como máximo 64 MiB, o el límite del heap de la VM cuando este es menor. Una salida más larga lanza un `RangeError`, como hace Node.js con `maxOutputLength`; el `maxOutputLength` propio de una app establece un límite inferior para una llamada. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` y `crypto.randomBytes` lanzan un `RangeError` (`code` `ERR_OUT_OF_RANGE`) para un tamaño que supera el límite del heap de la VM, o 1 GiB si no hay ninguno; `allocUnsafe` devuelve memoria puesta a cero.

<a id="files"></a>

## Archivos

`fs/promises` lee y escribe archivos nativos en hosts de escritorio (macOS, Windows y Linux), y archivos privados de la app en el navegador mediante el Origin Private File System (OPFS). Cada ruta se comprueba contra `capabilities.fs` antes de iniciar la operación: raíces `read` para `readFile`, `readdir`, `stat`, `lstat`, `readlink` y `exists`, raíces `write` para `writeFile`, `mkdir`, `rename`, `unlink` y `rmdir`. Todo fallo rechaza la promesa: una ruta fuera de las concesiones con `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` la ruta tal como la escribió la app), antes de cualquier trabajo en disco.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

Las raíces son rutas absolutas, `${dataDir}` (el directorio de datos de esta app, elegido por el host), `${pluginDir}` (el directorio de la app), `${homeDir}`, o rutas relativas al directorio de la app. Una ruta relativa en una llamada se resuelve en cada raíz concedida por turno. Un host que incrusta la app puede restringir aún más las concesiones. Toda operación permanece dentro de su raíz concedida, enlaces simbólicos incluidos; una ruta absoluta se comprueba tal como está escrita, por lo que se llega a una raíz por su propia ruta (o por la resuelta), no a través de un enlace situado fuera de ella. `lstat`, `readlink`, `exists`, `unlink`, `rename` y `rmdir` actúan sobre el propio enlace simbólico: `exists` es `true` para un enlace simbólico cuyo destino no existe, y `unlink` elimina el enlace y conserva su destino.

Los fallos incluyen las propiedades de error de Node: `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; `EILSEQ` para texto que no es UTF-8, `ERR_FS_FILE_TOO_LARGE` al superar el límite de lectura), `syscall` y `path`, de modo que `error.code === "ENOENT"` distingue un archivo inexistente. Una ruta fuera de las concesiones se rechaza con `ERR_ACCESS_DENIED`, una llamada en iOS o Android (cuyas apps guardan datos con [`Storage`](./nsh.md#storage)) con `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, y un argumento incorrecto (una codificación u opción desconocida) con un `TypeError`.

`readFile` devuelve un `Uint8Array`, o una cadena con `"utf8"`, y lee archivos de hasta 64 MiB. `writeFile` escribe una cadena o un `Uint8Array` de hasta 8 MiB, creando o reemplazando un archivo regular. `readdir` lista hasta 10 000 nombres (1 MiB de ellos; un directorio mayor se rechaza con un `RangeError`, `code` `ERR_OUT_OF_RANGE`), ordenados, o `Dirent`s (`name`, `isDirectory()`) con `{ withFileTypes: true }`. `stat` y `lstat` resuelven un `Stats` con `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` como `Date`s, y `isFile()`, `isDirectory()` y `isSymbolicLink()`. `rmdir` elimina un directorio vacío. Una VM ejecuta hasta 1024 operaciones a la vez y mantiene hasta 64 MiB de datos de archivo en curso (los datos entregados a `writeFile` hasta que se escriben, los datos leídos hasta que su promesa se resuelve); una llamada que supera estos límites se rechaza con `ERR_NSH_QUOTA_EXCEEDED`, y un `writeFile` de más de 8 MiB con un `RangeError` (`code` `ERR_OUT_OF_RANGE`).

El almacenamiento del navegador está limitado al origen de la página y al espacio de nombres propio de la app, con las mismas concesiones de archivos y los mismos límites de tamaño comprobados en Rust. OPFS requiere un contexto seguro, como HTTPS o localhost. Las fechas de modificación de los archivos provienen de los metadatos del navegador; las fechas de acceso/creación y los modos desconocidos son cero. `rename` usa un movimiento atómico de handle del navegador e informa `ENOTSUP` cuando el navegador no lo proporciona. Las entradas del navegador son archivos regulares o directorios, y `readlink` informa `EINVAL`.
<a id="processes"></a>

## Procesos

`process.spawn` y `process.run` lanzan comandos en hosts de escritorio (macOS, Windows y Linux). El runtime ejecuta el programa directamente con un arreglo de argumentos, sin shell, y es dueño de sus pipes; stdout y stderr llegan como UTF-8 incremental.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

Los comandos coinciden exactamente con `process.execute`: `git` y `/usr/bin/git` son permisos independientes. Los comandos sin ruta se resuelven mediante los directorios absolutos del `PATH` del host; en Windows, un comando sin ruta también encuentra allí `<name>.com` y `<name>.exe`. Un archivo por lotes (`.cmd`, `.bat`) se ejecuta mediante `cmd.exe`: concede su ruta absoluta (`C:\Windows\System32\cmd.exe`) y pasa `/d`, `/c` y el script como argumentos. El entorno de un hijo consta de `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` y `LC_*` del host, más los nombres que `process.env` concede (con coincidencia exacta, que ignora mayúsculas y minúsculas solo en Windows, cuyo entorno tampoco las distingue). Un hijo se ejecuta en el directorio de datos de la app (que se crea si no existe), o en `cwd`, un directorio existente dentro de una raíz de `fs.write`, ya que el hijo puede escribir donde se ejecuta. Un host de incrustación puede restringir los permisos.

```rust tabs
use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
};

spawn(async move {
    // `run`: the whole output once the command exits.
    if let Ok(Ok(output)) = blocking(|| Command::new("git").args(["status", "--short"]).output()).await {
        log::info!("{} {}", output.status, String::from_utf8_lossy(&output.stdout));
    }
    // `spawn` with `lines: true`: each line as it comes.
    let _ = blocking(|| -> std::io::Result<()> {
        let mut child = Command::new("git").args(["log", "--oneline"]).stdout(Stdio::piped()).spawn()?;
        if let Some(stdout) = child.stdout.take() {
            for line in BufReader::new(stdout).lines() {
                log::info!("{}", line?);
            }
        }
        log::info!("done {}", child.wait()?);
        Ok(())
    })
    .await;
});
```

```tsx tabs
import process from "process";

const { code, stdout } = await process.run("git", ["status", "--short"]);
const child = process.spawn("git", ["log", "--oneline"], { lines: true });
child.on("stdout", (line) => console.log(line));
child.on("exit", ({ code, signal }) => console.log("done", code, signal));
```

`run` resuelve `{ code, signal, stdout, stderr }` para cualquier estado de salida: `code` es el estado de salida y `signal` `null`, o, cuando una señal terminó el proceso hijo, `code` es `null` y `signal` su nombre (`"SIGTERM"`). Rechaza ante cualquier fallo. `spawn` devuelve un hijo de inmediato; `stdin: "pipe"` habilita `write` y `end`, y `lines: true` entrega líneas completas. `on(event, handler)` devuelve el hijo, y un manejador recibe la carga del evento: el texto, o `{ code, signal }` una sola vez, tras la salida final (con `error` cuando el runtime terminó el hijo: un timeout, una línea demasiado larga) (de inmediato para un listener añadido más tarde). `pid` es el id de proceso del hijo. `spawn` lanza lo mismo con lo que `run` rechaza, antes de que el hijo se inicie: un comando que `process.execute` no concede falla con `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` el comando), un `cwd` fuera de los permisos de `fs.write` falla con `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` el `cwd`), una llamada fuera de los escritorios falla con `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, y una llamada que supera el límite de hijos falla con `ERR_NSH_QUOTA_EXCEEDED`; un fallo de lanzamiento incluye `code` (`ENOENT` para un ejecutable inexistente, `EACCES` para uno que el SO no puede ejecutar), `syscall` (`spawn <command>`) y `path`. `run` rechaza con `ETIMEDOUT` al llegar a su plazo y con un `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) cuando la salida supera su captura; la salida de un hijo creado con spawn incluye el mismo mensaje en `error` y su código en `errorCode`. `process.dataDir` es `null` cuando el host no tiene directorio de datos. `kill`, un timeout, la limpieza del propietario reactivo y el cierre de la VM terminan todo el árbol de procesos: en Unix, su grupo de procesos recibe SIGTERM y luego SIGKILL tras 250 ms (en el cierre, SIGKILL de inmediato).

| Límite | Valor |
|---|---|
| `timeoutMs` | Hasta 4.294.967.295 ms; `run` tiene un valor predeterminado de 30 segundos, `spawn` se ejecuta hasta que termine |
| Captura de `run` | 8 MiB por flujo |
| Una línea con `lines: true` | 8 MiB |
| Hijos por VM | 32 |
| Salida en tránsito por VM | 8 MiB; los lectores esperan a que JS la consuma |
| stdin pendiente por hijo | 1 MiB; `write` lanza `ERR_NSH_QUOTA_EXCEEDED` si se supera |
| Listeners | 64 por evento y por hijo |

`process.exit(code?)` solicita que el host cierre esta superficie de la app. Se concede con `"exit": true` en `capabilities.process`; el motor reenvía la solicitud mediante el comando de salida de app de la plataforma. Una llamada que el permiso no cubre lanza `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`). Los hosts atienden las solicitudes de salida mediante un manejador de salida que instalan; en otros casos la llamada lanza `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. En macOS, esto cierra la ventana de la superficie. En un navegador, detiene la app y limpia su superficie, manteniendo abierta la página host. Un host de incrustación controla cómo su superficie gestiona la solicitud. Gallery deniega esta capacidad para que su acción **Request host exit** demuestre la gestión de permisos y mantenga abierta la demo.

<a id="network-permissions-and-boundaries"></a>

## Permisos y límites de red

El `fetch` global conserva la implementación HTTP con streaming de NSH, comprobando `network.hosts` o `network.http` para las solicitudes y los saltos de redirección. WebSocket admite `ws:` / `wss:`, mensajes de texto y binarios, listeners de eventos y handshakes de cierre. El handshake de un WebSocket es un HTTP GET, por lo que tanto el `WebSocket` global como el `connect` del módulo `websocket` usan los permisos HTTP: `ws` se comprueba como `http` y `wss` como `https`, usando GET (una regla también puede listar `ws` / `wss` en `schemes`). NSH comprueba la URL normalizada inicial antes de iniciar la conexión. El handshake nativo se conecta a esa URL y rechaza las redirecciones; las redirecciones y la política de conexión de WebSocket en el navegador las controla el navegador. Ambas APIs rechazan una URL con credenciales o fragmento. Cada VM mantiene como máximo 32 WebSockets entre ambas APIs, y los mensajes pesan como máximo 8 MiB en ambas.

Una URL que no se ha concedido a la app se rechaza antes de iniciar cualquier conexión. El `WebSocket` global lo informa como un navegador informa de una conexión fallida: el constructor devuelve el socket, que luego dispara `error` y `close` (código 1006, `wasClean` `false`), de modo que los manejadores que la app establece justo después del constructor los reciben. El `connect` del módulo rechaza con `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` la URL). El WebSocket número 33 lanza (el constructor) o rechaza (`connect`) con `ERR_NSH_QUOTA_EXCEEDED`, y una URL con formato incorrecto produce un `SyntaxError` (el constructor) o un `TypeError` (`connect`).

El `WebSocket` global pone en cola como máximo ocho mensajes para enviar, con un máximo de 8 MiB en búfer (`bufferedAmount`); `send()` lanza `ERR_NSH_QUOTA_EXCEEDED` si se supera cualquiera de los dos, y una vez que el socket se está cerrando, `send()` descarta sus datos, igual que el de un navegador. Su handshake y cada escritura expiran a los 30 segundos, y el cierre espera hasta 5 segundos el frame de cierre del par. Los mensajes se entregan como eventos `message` a medida que llegan.

El `WebSocketConnection` del módulo `websocket` admite como máximo ocho operaciones pendientes (lecturas, escrituras, cierre) y como máximo 8 MiB de escrituras aún no enviadas; un `write()` que supere cualquiera de los dos rechaza con `ERR_NSH_QUOTA_EXCEEDED`, y un mensaje de más de 8 MiB con un `RangeError` (`code` `ERR_OUT_OF_RANGE`). Solo puede haber un `read()` en espera a la vez; un segundo rechaza con un `TypeError`. Los mensajes que llegan antes de ser leídos esperan a la app, y su flujo sigue sus lecturas: mientras haya ocho mensajes o 8 MiB sin leer, la conexión deja de leer de la red, de modo que el envío del par también espera, y la lectura se reanuda a medida que la app lee. La resolución, la conexión y el handshake en conjunto, cada escritura y el cierre expiran a los 30 segundos.

`read()` resuelve los mensajes en orden de llegada. Una vez que la conexión se ha cerrado limpiamente (el par la cerró, o la app llamó a `close()`) y se han leído todos los mensajes anteriores, `read()` resuelve `null`, igual que el de un socket `net` al llegar a EOF; `closeCode` y `closeReason` contienen entonces el código y el motivo del frame de cierre (`null` mientras la conexión está abierta; 1005 para un frame de cierre sin código, 1006 para una conexión que terminó sin handshake de cierre). `read()` rechaza solo ante un fallo, después de los mensajes que lo precedieron, con su `code`: `ERR_SOCKET_CLOSED` para una conexión que terminó sin handshake de cierre, `ETIMEDOUT`, el código del SO para un error de socket, o `EPROTO` para un error de protocolo (con el `status` HTTP de un handshake rechazado). `close(code?, reason?)` envía su código (1000, el valor predeterminado, o de 3000 a 4999) y su motivo (como máximo 123 bytes UTF-8) en el frame de cierre, igual que `close()` del `WebSocket` global; un código o motivo fuera de estos límites rechaza con un `RangeError` (`code` `ERR_OUT_OF_RANGE`). Descarta los mensajes aún no leídos y resuelve cuando el par responde al handshake de cierre.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` usa únicamente `network.sockets`, una lista de destinos `"host:port"` exactos (`"[::1]:9000"` para IPv6), comprobados antes de la búsqueda DNS. Cada entrada concede un puerto en un host; los patrones de host, `network.hosts` y los permisos HTTP cubren solo el tráfico HTTP, y una app sin `"capabilities"` también lista sus sockets. El `Socket` devuelto ofrece `read(size?)`, `write(text)` y `close()`; las lecturas devuelven `Uint8Array`, o `null` al llegar a EOF. Todo fallo rechaza: un destino no concedido con `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`), el socket número 33 y las escrituras que superan los 4 MiB que pueden esperar con `ERR_NSH_QUOTA_EXCEEDED`, una lectura o escritura de más de 1 MiB con un `RangeError` (`code` `ERR_OUT_OF_RANGE`); los fallos de conexión y de E/S rechazan con el `code` de Node (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) y `syscall`, el de una conexión además con `address` y `port`, y una escritura en un socket cerrado con `ERR_SOCKET_CLOSED` (una lectura allí devuelve `null`). Las conexiones y la E/S tienen timeouts de 30 segundos, cada lectura/escritura está limitada a 1 MiB, pueden esperar para enviarse como máximo 4 MiB de escrituras, y `close()` termina de inmediato las lecturas y escrituras pendientes. Cada VM mantiene como máximo 32 sockets abiertos o en conexión. Esta es una interfaz de socket cliente basada en promesas.

TCP sin procesar usa hosts nativos. Ambas interfaces WebSocket usan el transporte del navegador en las apps web, conservando las comprobaciones de capacidades de Rust y los límites anteriores. Los encabezados personalizados de handshake en el navegador informan de un error explícito de opción no admitida. También se aplican las políticas de conexión del navegador. Los permisos de incrustación se intersecan con la declaración de capacidades de la app.

<a id="websocket-grant-example"></a>

## Ejemplo de permiso para WebSocket

Este fragmento de `nsh.json` permite el handshake GET para esta URL de `wss`, conservando su ruta y su alcance HTTPS:

```json
{
  "capabilities": {
    "network": {
      "http": [{
        "host": "chat.example.com",
        "methods": ["GET"],
        "schemes": ["https"],
        "pathPrefix": "/socket"
      }]
    }
  }
}
```

```rust tabs
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::Message};

spawn(async move {
    let _ = background(async {
        let (mut socket, _) = connect_async("wss://chat.example.com/socket").await?;
        socket.send(Message::text("hello")).await?;
        while let Some(message) = socket.next().await {
            log::info!("{}", message?);
        }
        Ok::<_, tokio_tungstenite::tungstenite::Error>(())
    })
    .await;
});
```

```tsx tabs
const socket = new WebSocket("wss://chat.example.com/socket");
socket.addEventListener("open", () => socket.send("hello"));
socket.addEventListener("message", (event) => console.log(event.data));
```

<a id="tcp-grant-example"></a>

## Ejemplo de permiso para TCP

TCP usa un permiso de socket: el host y el puerto exactos a los que se conecta la app.

```json
{
  "capabilities": {
    "network": { "sockets": ["tcp.example.com:9000"] }
  }
}
```

```rust tabs
use std::{
    io::{Read, Write},
    net::TcpStream,
};

spawn(async move {
    let reply = blocking(|| -> std::io::Result<String> {
        let mut socket = TcpStream::connect(("tcp.example.com", 9000))?;
        socket.write_all(b"hello\n")?;
        let mut bytes = [0; 1024];
        let n = socket.read(&mut bytes)?;
        Ok(String::from_utf8_lossy(&bytes[..n]).into_owned())
    })
    .await;
    if let Ok(Ok(reply)) = reply {
        log::info!("{reply}");
    }
});
```

```tsx tabs
import { connect } from "net";

const socket = await connect({ host: "tcp.example.com", port: 9000 });
try {
  await socket.write("hello\n");
  const bytes = await socket.read(1024);
  if (bytes) console.log(new TextDecoder().decode(bytes));
} finally {
  socket.close();
}
```

## Gallery

Abre **Standard APIs** en `examples/gallery` para ejecutar operaciones de archivos, procesos hijo, TCP y ambas interfaces WebSocket, e inspeccionar los metadatos del host y los trabajos en cola. La acción de utilidades demuestra búferes, hashing, compresión y URLs de archivo. Cada acción muestra su resultado o error. Los archivos permanecen en un directorio temporal dentro del directorio de datos propio de Gallery y se eliminan tras la acción. Las acciones de TCP y WebSocket se conectan a servidores echo locales en los puertos 9876 y 9877. En la web, las acciones de archivos ejercitan OPFS, las utilidades se ejecutan en WebAssembly y ambas acciones de WebSocket usan conexiones del navegador; las acciones de procesos y TCP muestran los errores de plataforma tipados del host.

**AI Chat** de Gallery usa `process.spawn` para conversar en el escritorio mediante una CLI de Claude o Codex instalada localmente. Inicia sesión mediante la CLI en una terminal y luego elige el proveedor en el compositor. Las respuestas usan la conversación como contexto; Stop y salir de la pantalla terminan el proceso hijo. En la web y en móvil se ejecutan conversaciones con streaming guionizadas, que incluyen razonamiento, tarjetas de herramientas y recuperación de errores.
