---
title: "Servidor de desarrollo y depuración"
description: "Ejecuta aplicaciones Rust y TSX con nsh run y nsh dev, conecta simuladores, emuladores y dispositivos, y usa recompilaciones, hot module replacement, registros, la superposición de errores y stacks con source maps."
order: 60
group: tools
source_hash: bce9f1fee0870b27
---


# Servidor de desarrollo y depuración

Durante el desarrollo, NSH compila tu app en cada guardado. Una app Rust (`nsh.json` nombra su `"root"`) se compila en su
propio runner, que `nsh run` inicia; un cambio en su crate la compila de nuevo y reinicia la app. Una app TSX se envía a
cada host conectado, que se actualiza en el lugar. Dos comandos se encargan de esto:

- `nsh run` compila la app **y** la lanza: una ventana de Mac Catalyst o AppKit, una ventana GTK en Linux, una ventana Win32
  en Windows, un simulador de iOS, un dispositivo o emulador Android, o una página del navegador. Para TSX también inicia el servidor
  de desarrollo, al que se conecta el host de desarrollo.
- `nsh dev --server-only` inicia el servidor de desarrollo para TSX, para hosts que inicias tú mismo: tu propia app con el
  SDK de desarrollo, un dispositivo en la red o varios hosts a la vez.

```sh
# A Rust app, from its directory
nsh run                             # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run --target ios                # iOS simulator
nsh run --target android            # Android device or emulator

# A TSX app
nsh run App.tsx                     # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run App.tsx --target macos      # AppKit window (macOS)
nsh run App.tsx --target ios        # iOS simulator
nsh run App.tsx --target android    # Android device or emulator
nsh dev App.tsx --server-only       # server only
```

`nsh dev` también abre el host nativo por defecto; los hosts móviles usan `--target ios` o `--target android`.

## `nsh run`

| Flag | Description |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | Dónde ejecutar. Por defecto `macos` en macOS (AppKit), `linux` en Linux, `windows` en Windows. Una app Rust se ejecuta en todos ellos excepto en `gpui`, que incrusta su raíz en una app GPUI ([GPUI](./gpui.md)). |
| `--device <name or UDID>` | El simulador de iOS que se usará. Por defecto: uno ya iniciado; si no, el iPhone más reciente (que se inicia por ti). |
| `--port <port>` | Puerto del servidor de desarrollo. Por defecto 8790; si está ocupado, se usa el siguiente puerto libre. |
| `--release` | Sirve compilaciones de release de TSX (minificadas, sin información de depuración, sin actualizaciones en caliente). |
| `--trace` | Registra el tiempo de cada commit en el host (apps TSX). |

Qué hace cada destino:

- **`catalyst`** (macOS) ejecuta el host de desarrollo como una app de Mac. Detener `nsh run` (Ctrl-C, o `kill`) lo cierra, y
  cerrar la ventana termina `nsh run`.
- **`macos`** (macOS) ejecuta el host de desarrollo de AppKit, una app de escritorio en una ventana de 1200×800, de la misma manera; Cmd+R
  recarga la última compilación. Requiere macOS 14 o posterior ([macOS](./macos.md)).
- **`linux`** (Linux) ejecuta el host de desarrollo GTK en una ventana de 390×844, de la misma manera: detener `nsh run` lo
  cierra, y cerrar la ventana termina `nsh run`. Requiere GTK 4.14 o posterior ([Linux](./linux.md)).
- **`windows`** (Windows) ejecuta el host de desarrollo Win32 en una ventana de 1200×800, de la misma manera; el host nunca sobrevive a
  `nsh run`, ni siquiera cuando se cierra la consola. Requiere Windows 10 1809 o posterior ([Windows](./windows.md)).
- **`ios`** instala el host de desarrollo en el simulador, lo lanza apuntando al servidor de desarrollo y sigue observando.
  El simulador comparte la red del Mac, por lo que el host llega al servidor en `127.0.0.1`. Detener `nsh run` (Ctrl-C)
  cierra el host, que de otro modo se uniría a la siguiente sesión. Requiere Xcode.
- **`android`** instala el APK del host de desarrollo (de nuevo solo cuando cambió el runtime), ejecuta
  `adb reverse tcp:<port> tcp:<port>` para que el `127.0.0.1` propio del dispositivo llegue al servidor, y lo inicia. Funciona con un
  emulador o un dispositivo USB. Requiere el Android SDK (`ANDROID_HOME`). Cuando `nsh run` termina (también con Ctrl-C), detiene el
  host y elimina ese reenvío de puertos, para que el host no se una a la siguiente sesión.

Cuando `nsh run` termina, sea como sea, detiene el host que inició: cierra la app Catalyst o el host de macOS, Linux o Windows, termina el
host de desarrollo en el simulador, o lo detiene a la fuerza en el dispositivo.

Para una app Rust, cada destino ejecuta el runner propio de la app, compilado con su crate: los escritorios, una compilación de depuración en el sitio, con
su salida en la terminal; iOS y Android, un paquete de ella, instalado. Para TSX los hosts son genéricos: ejecutan cualquier
app NSH que envíe el servidor, así que no hay nada que compilar por app (una app con un crate propio obtiene hosts compilados
con él).

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| Flag | Description |
|---|---|
| `--port <port>` | Puerto del servidor de desarrollo. Por defecto 8790 (el siguiente libre si está ocupado). |
| `--release` | Sirve compilaciones de release. |

Conecta los hosts a la URL impresa:

- **Tu propia app iOS**, enlazada con `NativeShellDev.xcframework`:
  `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`. Consulta [Embedding in iOS apps](./ios.md#development).
- **Tu propia app Android**, con `nsh-dev.aar`: `nsh.connectDevServer("ws://192.168.1.20:8790/ws")`, o
  `adb reverse tcp:8790 tcp:8790` y `ws://127.0.0.1:8790/ws`. Consulta [Embedding in Android apps](./android.md#development).

Se puede conectar cualquier número de hosts a la vez; cada compilación se envía a todos. Un host que se conecta más tarde recibe la
compilación actual de inmediato. Un host que no puede ejecutar la app, porque le falta un conjunto de UI que la app importa (un host de
desarrollo compilado para otra app), no recibe ninguna compilación: muestra el motivo, y la terminal imprime una línea `warn` con el comando que
instala el host de la app.

> [!NOTE]
> Un dispositivo en la LAN necesita llegar a tu computadora en el puerto del servidor de desarrollo: misma red, sin firewall de por medio.
> Los assets (imágenes, fuentes) se sirven por HTTP simple desde el mismo puerto.

<a id="rust-edits"></a>

## Ediciones de Rust

Rust es un lenguaje compilado: un cambio en el crate de una app, o en un crate del que depende por ruta, compila la app de nuevo, y `nsh run`
la reinicia con el código nuevo. El estado de la app empieza de cero; guarda lo que deba sobrevivir a un reinicio en
[storage](../modules/nsh.md#storage). Un error de compilación se imprime en la terminal, y el siguiente guardado que compile se ejecuta
de nuevo. En una app con Rust y TSX, las ediciones de TSX siguen siendo actualizaciones en caliente (más abajo) y las ediciones de Rust reinician la app.

## Hot module replacement

Las compilaciones de desarrollo de TSX mantienen un módulo por cada archivo fuente. Al guardar, NSH recompila, compara los módulos con la última
compilación correcta y envía un **patch** solo con los módulos que cambiaron. El host lo aplica en el lugar en mucho menos de un
milisegundo; desde que guardas un archivo hasta que ves el cambio pasan aproximadamente 120 ms.

Qué ocurre con tu app:

- **Solo se vuelven a renderizar los componentes que editaste.** Cada componente de nivel superior (una función con mayúscula inicial que devuelve JSX)
  está envuelto en un proxy estable. Cuando cambia su código (o el resto del código de su módulo, que puede usar), sus
  instancias se renderizan de nuevo con el código nuevo; los componentes cuyo código no cambió conservan sus instancias, y con ellas
  sus signals y su estado. Edita el estilo de un botón y la
  pantalla se queda donde estaba, con el mismo texto de entrada y la misma posición de scroll.
- **Los módulos que cambiaron se ejecutan de nuevo**, y también los módulos que importan un módulo cambiado que no puede asumir la actualización
  por sí mismo, hasta llegar a la entrada. Por lo tanto, el código a nivel de módulo se ejecuta de nuevo, salvo lo que conserva su estado:
- **Los signals de nivel superior y las pilas de navegación conservan su estado**: un `const` creado por `signal(…)` o `createNavStack(…)` al
  inicio de un módulo conserva su valor (una pila, sus páginas) entre ediciones, siempre que su propio inicializador sea el mismo;
  cambia el inicializador (`signal(0)` a `signal(10)`) para empezar de cero.
- **Los objetos `context()` de nivel superior conservan su identidad**, y toman el nuevo valor por defecto, de modo que los proveedores y consumidores en
  distintos módulos siguen coincidiendo.
- **Editar la entrada mantiene la app montada.** `mount(App)` (o `mount(() => <App />)`) ejecutado de nuevo con el mismo
  componente conserva lo que montó: solo se vuelven a renderizar los componentes que editaste. Edita `App` mismo y se renderiza
  de nuevo, con lo que renderiza (su propio estado empieza de cero), pero un navegador creado al inicio del módulo conserva sus
  rutas, así que una pantalla apilada sigue apilada. Una llamada a `mount` que cambió (otro componente, otras props) monta la app
  de nuevo.
- **Un componente que lanza una excepción** informa del error y no renderiza nada hasta que lo corrijas; el resto de la app sigue
  funcionando. El siguiente guardado correcto lo recupera.

El host **recarga toda la app** en lugar de aplicar el patch cuando:

- el cambio importa un módulo de NSH que la app en ejecución aún no había importado (por ejemplo, el primer `import … from "nsh"`);
- cambió el `capabilities` de la app en `nsh.json`;
- el host no está ejecutando la compilación en la que se basa el patch (acaba de conectarse, o una carga anterior falló);
- no se puede aplicar un patch.

> [!TIP]
> El estado que un componente conserva en sus propios signals se restablece cuando ese componente, o uno que lo renderiza, se edita. Guarda el
> estado que deba sobrevivir a las ediciones en signals de nivel superior (o en un módulo de store), y crea los navegadores al inicio de un módulo.

`--release` sirve compilaciones de release, sin actualizaciones en caliente: cada guardado recarga la app. Úsalo para comprobar la compilación minificada.
Todo lo que se carga desde un servidor de desarrollo, con `--release` o sin él, omite el endurecimiento del runtime (`eval` sigue disponible); consulta
[Sandbox and capabilities](./sandbox-and-capabilities.md#hardening).

## Logs

Una app Rust registra logs con el crate `log` (`log::info!`, `log::warn!`, `log::error!`): `nsh run` muestra las líneas en su
terminal, junto con la salida de la app, en los escritorios y en el simulador de iOS.

En TSX, `console.log`, `console.info`, `console.debug`, `console.warn` y `console.error` van al log nativo con
el target `js`. Mientras un host está conectado, sus líneas de log se reenvían a la terminal que ejecuta `nsh run` / `nsh dev`: tus
líneas `console.log` tal cual (con el nombre del dispositivo como prefijo cuando hay varios dispositivos conectados), las advertencias y
los errores después del nombre del dispositivo:

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` da formato a los valores como la consola de un navegador: las cadenas tal cual, los errores con su stack, las funciones por nombre,
los objetos y arrays como JSON. Cuando el host no está conectado, los logs van al log de la plataforma (la consola de Xcode / el
unified log en iOS, `adb logcat` en Android).

Una promesa que se rechaza y aún no tiene manejador cuando termina el trabajo que la rechazó (sus microtareas se ejecutaron) se
registra también como un error, como lo informa un navegador: una función `async` que lanza una excepción sin que nadie la espere con await, un
`Promise.reject(…)` que nadie captura, una llamada a Rust que falla sin que nada la esté esperando. La línea va a donde vaya
`console.error` (la terminal, el log de la plataforma, la consola del navegador en la web), con su stack apuntando a
tus fuentes:

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

Un manejador añadido más tarde en el mismo turno (`const p = load(); …; p.catch(…)`) cuenta como si la hubiera manejado. Usa await con la
promesa o dale un `.catch` donde el fallo importe.

El resto de la terminal es una línea por paso (`✓` terminado, `→` dónde conectarse, `•` qué hizo un dispositivo); la salida de
las herramientas que ejecuta NSH (cargo, los propios hosts) solo se imprime cuando una falla. `nsh run -v` (o `NSH_VERBOSE=1`)
imprime todo: cada línea de log con su nivel y origen, la salida de cargo y la de los propios hosts.

`--trace` añade el costo de cada commit:

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Consulta [Testing](./testing-and-trace.md) para saber qué significan estos números.

<a id="the-error-overlay"></a>

## El overlay de errores

Estos errores muestran un overlay rojo sobre la app en el host, con el mensaje y el stack:

- un fallo de compilación (un error de sintaxis, un elemento desconocido, un import que falta), con un marco de código que señala la línea;
- un error mientras se evalúa el bundle;
- una excepción no capturada en un manejador de eventos, un timer o un efecto.

Toca el overlay para descartarlo. También desaparece en la siguiente recarga correcta. Los fallos de compilación también se imprimen en la
terminal:

```text
error building App.tsx failed
App.tsx

  x <Buton> names nothing in scope
   ,-[3:11]
 2 | function App() {
 3 |   return <Buton />;
   :           ^^^^^
 4 | }
```

El bundler elimina los tipos de TypeScript sin comprobarlos; ejecuta [`nsh check`](./cli.md#nsh-check) (el compilador
nativo de TypeScript con el `tsconfig.json` `nsh init` escribe; no se necesita Node) o confía en tu editor para los errores de tipos.

En las compilaciones de release (una app que incrusta el SDK de release, una app empaquetada), los errores se registran y se pasan al manejador de errores
de la app host (`NshAppView.onError`, `NshView.setErrorListener`) pero no se muestran sobre la app.

<a id="source-maps-and-stack-traces"></a>

## Source maps y stack traces

El bundling genera un source map que compone todos los pasos (TypeScript → JSX → el bundle), y se envía junto con cada
compilación. Antes de imprimir o mostrar un stack trace, el runtime reescribe las posiciones del bundle a tus fuentes, de modo que los stacks
apuntan a `App.tsx:2:28`, no al bundle:

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` escribe el mapa como `bundle.js.map`; una app que incrusta y carga un bundle desde una carpeta lo lee junto al
bundle, y los [paquetes firmados](./signed-packages.md) también lo llevan, a menos que se mantenga junto al paquete y se aplique
con `nsh symbolicate` ([Errors from published packages](./signed-packages.md#errors-from-published-packages)).

<a id="debugging-tips"></a>

## Consejos de depuración

- **Nada se actualiza tras una edición**: revisa la terminal en busca de un error de compilación; el overlay también lo muestra en el host.
- **La app conserva un estado antiguo que esperabas que se restableciera**: el reemplazo en caliente conserva a propósito el estado de los componentes sin cambios, los
  signals de nivel superior y los navegadores. Reinicia con Ctrl-C y `nsh run`, o cambia el inicializador del estado.
- **Una petición falla solo en una compilación empaquetada o incrustada**: revisa las [capabilities](./sandbox-and-capabilities.md) de la app;
  los rechazos se registran con la clave que se debe añadir.
- **Algo va lento**: reprodúcelo en modo headless con [`nsh test --trace`](./testing-and-trace.md), que imprime cada
  operación de vista nativa, o ejecuta una app TSX con `--trace`.
- **Errores de tipos en el editor**: `nsh run` y `nsh dev` mantienen `.nsh/types` al día; consulta
  [Project structure](./project-structure.md).

<a id="see-also"></a>

## Véase también

- [CLI](./cli.md)
- [Testing](./testing-and-trace.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
