---
title: "Pruebas"
description: "Prueba las apps sin interfaz gráfica (headless), en Rust con cargo test y nsh_testing o en TypeScript con nsh test: abre la app, pulsa, escribe, desplázate y espera como lo haría un usuario, simula (stub) la red y el almacenamiento, y lee las operaciones de vistas nativas y los tiempos que imprime --trace; testID para las pruebas de UI."
order: 61
group: tools
source_hash: c0e7414002b92551
---


# Pruebas

NSH ejecuta las apps en modo **headless**: el motor real (el mismo grafo reactivo, renderizador, componentes, layout y virtualización de listas que en un dispositivo, y QuickJS para TSX), con fotogramas de pantalla a 60 Hz, pero sin simulador, sin dispositivo y sin ventana. Se ejecuta en cualquier lugar donde se ejecute Cargo o la CLI, incluidas las máquinas de CI con Linux, y hace dos trabajos:

- ejecuta pruebas: cada una abre la app, da los pasos que daría un usuario (pulsar, escribir, desplazar) y comprueba lo que hay en pantalla. Las pruebas de una app Rust son Rust, y se ejecutan con `cargo test` y el crate `nsh-testing`; las pruebas escritas en TypeScript se ejecutan con `nsh test`, tanto para apps TSX como para apps Rust;
- con `--trace`, imprime cada operación que el runtime envía a las vistas nativas, con tiempos: lo que cuesta el primer fotograma, un toque o un fotograma de desplazamiento.

<a id="writing-tests"></a>

## Escribir pruebas

La misma prueba, en Rust y en TypeScript: abre la app con una lista de tareas vacía en su almacenamiento, escribe, pulsa y comprueba lo que muestra la pantalla.

```rust tabs
// tests/app/main.rs
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, MemoryStorage};

#[test]
fn adds_a_todo() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.storage = Some(MemoryStorage::new([("todos".to_owned(), "[]".to_owned())]));
    let mut app = Headless::start(config).unwrap();
    app.type_text("id:new-todo", "Buy milk").unwrap();
    app.press("text:Add").unwrap();
    app.wait_for("text:Buy milk").unwrap();
    assert!(app.screen().texts().contains(&"1 item left"));
}
```

```tsx tabs
// App.test.tsx
import { expect, open, test } from "nsh/test";

test("adds a todo", async () => {
  const app = await open("./App.tsx", { storage: { todos: "[]" } });
  await app.type("id:new-todo", "Buy milk");
  await app.press("text:Add");
  await app.waitFor("text:Buy milk");
  expect(app.texts()).toContain("1 item left");
});
```

<a id="tests-in-rust-with-cargo-test"></a>

## Pruebas en Rust con cargo test

Las pruebas de una app Rust son pruebas de integración de su crate, con `nsh-engine` y `nsh-testing` (sus features por defecto, sin QuickJS) como dev-dependencies:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` es un motor del tamaño de un teléfono (390×844 puntos) sin nada más configurado; sus campos establecen lo que establecen las opciones de `open` más abajo: `storage` (`MemoryStorage::new(entries)`), `network` (`StubNetwork`, más abajo), `viewport`, `environment` (la apariencia, la configuración regional, el movimiento reducido), `clock` (`Clock::manual(time)`, más abajo).
`nsh_testing::Headless::start(config)` inicia la app y mantiene un modelo de las vistas que muestra. Sus pasos son los de `nsh test` más abajo, con los mismos selectores, en Rust: `press`, `long_press`, `clear`, `type_text`, `submit`, `scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`, `set_system_time`, `set_viewport`, `set_clipboard` y `on_dialog`; `app.shows(text)` y `app.screen()` (`texts()`, `count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`) leen lo que hay en pantalla. Un paso devuelve un error con los textos en pantalla cuando no se puede dar.

`nsh_testing::tsx(entry, sets)` (feature `bundle`) abre del mismo modo el punto de entrada TSX de una app, compilado con los conjuntos de UI de NSH y del crate ([Construir con Rust](./rust.md#testing)). `examples/gallery-rs` prueba su raíz Rust de esta manera, un módulo por demo; `examples/rust-exports` prueba su punto de entrada TSX desde Rust.

`nsh test` también ejecuta estas pruebas: dado el directorio de una app con crates de Rust (`nsh.json` `"rust"`), ejecuta `cargo test` para cada crate antes de los archivos de prueba, y muestra y cuenta las pruebas de Rust junto con las de TypeScript (`✓ src/lib.rs › tests::adds`), en su resumen y en su informe `--junit`. Así, `nsh test` es el único comando para una app Rust, una app TSX con un crate y una app TSX sin él, y `nsh check` ejecuta igualmente `cargo check --all-targets` sobre los crates antes de comprobar los tipos del TypeScript.

<a id="tests-with-nsh-test"></a>

## Pruebas con nsh test

Un archivo de prueba es un archivo `*.test.tsx` o `*.test.ts` junto a tu código. Importa `nsh/test`, como lo hace `App.test.tsx` más arriba:

```sh
nsh test                      # every test file of the app in the current directory
nsh test App.test.tsx         # one file
nsh test --filter "adds"      # the tests whose name contains "adds"
```

```text
✓ App.test.tsx › adds a todo (84ms)
✗ App.test.tsx › keeps todos after a restart (312ms)
    expected ["Todos","0 items left"] to contain "1 item left"
    at <anonymous> (App.test.tsx:21:22)
    on screen: "Todos", "0 items left"
error 2 tests: 1 passed, 1 failed (0.9s)
```

Una prueba fallida muestra lo que se lanzó, en qué punto del archivo de prueba, y los textos en pantalla de la app que abrió. Cualquier fallo hace que `nsh test` termine con un código distinto de cero. `nsh init` crea un `App.test.tsx` con la app, y `nsh check` comprueba los tipos de los archivos de prueba junto con el resto (`.nsh/types` declara `nsh/test`).

Cada archivo de prueba se ejecuta en su propio motor, y sus pruebas se ejecutan una tras otra, en orden. `open` inicia la app en otro motor, nuevo cada vez, de modo que las pruebas nunca comparten estado; las apps que una prueba abrió se cierran cuando esta termina. Una prueba falla cuando lanza una excepción, cuando la promesa que devuelve se rechaza, y tras su tiempo límite: 30 segundos, o los milisegundos que indique el tercer argumento de `test` (`test("syncs", body, 60_000)`). Una app con crates de Rust propios (`nsh.json` `"rust"`) ejecuta sus pruebas en un runner headless que NSH compila con ellos, del mismo modo; en una app Rust (`nsh.json` `"root"`, [Construir con Rust](./rust.md)), `open(".")` inicia su componente raíz.

<a id="grouping-tests-and-setting-them-up"></a>

### Agrupar pruebas y prepararlas

`describe`, los hooks y las variantes de `test` funcionan como los de Jest:

```tsx
import { beforeEach, describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";

describe("the cart", () => {
  let app: App;
  beforeEach(async () => {
    app = await open("./App.tsx", { storage: { cart: "[]" } });
    await app.press("Cart");
  });

  test("starts empty", () => {
    expect(app.texts()).toContain("No items");
  });

  test.todo("applies a coupon");
});
```

| Función | Descripción |
|---|---|
| `describe(name, body)` | Agrupa las pruebas y los bloques que `body` declara (de una vez, al cargarse el archivo): sus nombres empiezan por `name` (`the cart › starts empty`), y los hooks que declara se ejecutan solo alrededor de ellas. Los bloques se pueden anidar. |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | Ejecutan `fn` antes / después de cada prueba del bloque en el que se declaran (el archivo, un `describe`): primero los `beforeEach` de los bloques exteriores, primero los `afterEach` de los interiores. Un `beforeEach` que falla hace fallar la prueba; `afterEach` se ejecuta en cualquier caso. |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | Ejecutan `fn` una vez antes de la primera prueba y después de la última de su bloque, cuando se ejecuta alguna de ellas. Un `beforeAll` que falla hace fallar las pruebas del bloque; un `afterAll` que falla se informa como un `<block> › afterAll` fallido. Una app que abre un `beforeAll` permanece abierta para las pruebas del bloque, y se cierra después de su `afterAll`. |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | Declara una prueba, o un bloque cuyas pruebas no se ejecutan: se informan como omitidas. |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | Mientras un archivo de prueba tenga alguno, solo se ejecutan esas pruebas y bloques; las demás del archivo se informan como omitidas. |
| `test.todo(name)` | Una prueba aún por escribir, que se informa como tal. |

Un hook puede ser `async`; su `timeout` es de 30 segundos salvo que se indique otro. Las pruebas y los hooks se declaran al cargarse el archivo: una prueba declarada dentro de otra prueba o de un hook lanza una excepción.

<a id="opening-the-app"></a>

### Abrir la app

`open(entry, options?)` compila la app en `entry` (relativo al archivo de prueba; cada punto de entrada se compila una vez por ejecución), la inicia en un viewport de 390×844 y se resuelve cuando se ha renderizado y está en reposo. Con `--target`, la app se ejecuta con las opciones tal como las da la prueba: si la plataforma de destino no puede respetar alguna, `open` se rechaza con `ERR_NSH_TEST_UNSUPPORTED`, indicando cuál (consulta [En una plataforma real](#on-a-real-platform)).

| Opción | Valor por defecto | Descripción |
|---|---|---|
| `storage` | vacío | Lo que contiene `Storage` al inicio: `{ todos: "[]" }`. |
| `network` | ninguno | Lo que reciben las peticiones de la app, por ruta: consulta [Simular la red](#stubbing-the-network). `"live"`: la red real, para sus peticiones, sockets y WebSockets. |
| `width`, `height` | 390, 844 | El viewport en puntos: en headless, la ventana de los escritorios, la página de la web. En iOS y Android la app ocupa la pantalla del dispositivo. |
| `safeArea` | 0 | Los insets del área segura en puntos: `{ top: 47, bottom: 34 }`. |
| `clipboard` | vacío | El texto del portapapeles al inicio. |
| `colorScheme` | `"light"` | La apariencia del sistema: `"light"` o `"dark"` (clases `colorScheme()`, `dark:`). |
| `locale` | `"en-US"` | La configuración regional del dispositivo, una etiqueta BCP 47 (`locale()`, el valor por defecto de `Intl`). |
| `reducedMotion` | `false` | El usuario pidió menos movimiento (`reduceMotion()`). |
| `platform` | `"ios"` | La plataforma como la que se ejecuta la app en headless: `"ios"`, `"android"`, o la de un escritorio, `"macos"`, `"windows"`, `"linux"`, o `"web"` en el idioma de escritorio (`platform.os`, props `ios={{…}}` / `android={{…}}` / `desktop={{…}}`, atajos de teclado). Con `--target`, la app se ejecuta como la plataforma de destino: `platform` de un escritorio en cualquier escritorio y en la web, siempre como escritorio (en el navegador con el idioma de escritorio a cualquier ancho, y `platform.os` se mantiene en `"web"`), `"ios"` y `"android"` como ellas mismas. |
| `clock` | el del sistema | Un reloj manual, cuyo tiempo avanza solo cuando la prueba lo avanza: `{}`, o `{ time }` para empezar en un `Date` (o en milisegundos desde la época Unix). Consulta [Controlar el tiempo](#controlling-time). |
| `host` | ninguno | La parte de la app anfitriona que la integra, que interpreta la prueba: `{ params, handlers }`. Consulta [Hacer de app anfitriona](#playing-the-host-app). |

<a id="playing-the-host-app"></a>

### Hacer de app anfitriona

Una app integrada en una app nativa se comunica con ella a través de [`host`](../modules/nsh.md#host). En una prueba, la prueba hace de app anfitriona: `host.params` da los parámetros de lanzamiento que la app lee al inicio, y `host.handlers` responde a los `host.call` de la app y escucha sus `host.post`, por nombre. Un handler es un valor, que responde a cada llamada, o una función de los datos de la llamada que devuelve la respuesta (o una promesa de ella). Lo que la función lanza rechaza la llamada, como lo hace el error de una app anfitriona. Una llamada de un nombre que `handlers` no enumera falla, como ocurre en una app anfitriona que no maneja ninguno.

```tsx
const app = await open("./App.tsx", {
  host: {
    params: { conversation: "c-42" },
    handlers: {
      "user.profile": async ({ id }) => ({ id, name: "Ada" }),
      "feature.flags": { search: true },
      analytics: null,
    },
  },
});
await app.press("Profile");
expect(app.host.calls()).toEqual([{ name: "user.profile", data: { id: 7 } }]);
expect(app.host.posts()).toEqual([{ name: "analytics", data: { screen: "profile" } }]);
// The app's `host.on("conversation.open", …)` hears it.
await app.host.send("conversation.open", { id: "c-43" });
expect(app.shows("Conversation c-43")).toBe(true);
```

`app.host.send(name, data)` envía un evento y luego espera hasta que la app está en reposo. `app.host.calls()` y `app.host.posts()` enumeran lo que recibieron los handlers, en orden: `name` y `data`.

Las URL que abre la app ([`openUrl`](../modules/nsh.md#openurl), los enlaces de un `TextView` con `links="open"`) se registran y se notifican a la app como abiertas, y no se abre nada en esta máquina. `app.openedUrls()` las enumera:

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### Simular la red

`network` enumera rutas por `"<METHOD> <URL>"` (una URL sola es un `GET`; `*` coincide con cualquier texto). Una petición con la que no coincide ninguna ruta falla, de modo que las pruebas nunca llegan a la red sin pedirlo. Una ruta es una respuesta, o una función de la petición que devuelve una (o una promesa de una); en Rust, `StubNetwork::new(routes)` acepta las mismas rutas, cada una un `StubResponse` o un `StubRoute::Handler`:

```rust tabs
use std::sync::Arc;
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, StubNetwork, StubResponse};

#[test]
fn adds_a_todo_on_the_server() {
    let mut todos = StubResponse::default();
    todos.status = 200;
    todos.headers = vec![("content-type".to_owned(), "application/json".to_owned())];
    todos.body = br#"[{ "id": 1, "title": "Walk" }]"#.to_vec();
    let mut created = StubResponse::default();
    created.status = 201;
    let mut offline = StubResponse::default();
    offline.error = Some("offline".to_owned());
    let network = Arc::new(StubNetwork::new([
        ("GET https://api.example.com/todos".to_owned(), todos),
        ("POST https://api.example.com/todos".to_owned(), created),
        ("GET https://api.example.com/sync".to_owned(), offline),
    ]));
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.network = Some(network.clone());
    let mut app = Headless::start(config).unwrap();
    app.press("Add").unwrap();
    let methods: Vec<String> = network.requests().iter().map(|r| r.method.clone()).collect();
    assert_eq!(methods, ["GET", "POST"]);
}
```

```tsx tabs
const app = await open("./App.tsx", {
  network: {
    "GET https://api.example.com/todos": { body: [{ id: 1, title: "Walk" }] },
    "POST https://api.example.com/todos": (request) => ({ status: 201, body: JSON.parse(request.body!) }),
    "GET https://api.example.com/todos/*": { status: 404 },
    "GET https://api.example.com/sync": { error: "offline" },
    "GET https://api.example.com/slow": { body: "done", delay: 2000 },
  },
});
await app.press("Add");
expect(app.requests().map((r) => r.method)).toEqual(["GET", "POST"]);
```

| Miembro de la respuesta | Valor por defecto | Descripción |
|---|---|---|
| `status` | 200 | El código de estado. |
| `headers` | ninguno | Nombres y valores de las cabeceras. |
| `body` | vacío | Una cadena, o un valor enviado como JSON (con `content-type: application/json` salvo que `headers` indiquen uno). |
| `error` | ninguno | La petición falla con este mensaje en su lugar, como cuando el dispositivo está sin conexión. |
| `delay` | 0 | Cuánto tarda la respuesta, en milisegundos; un paso no la espera, `waitFor` sí. Con un reloj manual, llega cuando el reloj la sobrepasa. |

La función de una ruta recibe la petición (`method`, `url`, `headers`, `body` como texto) y se ejecuta en el archivo de prueba, de modo que puede contar peticiones o responder a partir de lo que la prueba preparó. Una función que lanza una excepción hace fallar la petición y el paso que la originó. `app.requests()` enumera, del mismo modo, las peticiones que hizo la app, en orden.

Las conexiones también se quedan en la prueba: los sockets de la app (`net`) y los WebSockets (el global `WebSocket` y el módulo `websocket`) no abren ninguno salvo que `network` sea `"live"`. Tras las comprobaciones de capacidades que pasan las ejecuciones de la propia app, `net.connect` y `connect` del módulo `websocket` se rechazan con `code` `ERR_NSH_TEST_NETWORK`, y un `WebSocket` global dispara `error` y después `close` (1006, no limpio), como ante una conexión que la red rechazó. Con `"live"`, se conectan a la red real junto con las peticiones de la app. En Rust, `EngineConfig::refuse_connections` hace lo mismo para una app `Headless`: una función de aquello a lo que se conecta la app (la URL de un WebSocket, el `host:port` de un socket) que devuelve el error con el que falla su llamada.

<a id="controlling-time"></a>

### Controlar el tiempo

Con el reloj del sistema, los temporizadores y las animaciones nativas de una app tardan lo mismo que en un dispositivo, y también las pruebas que los esperan. Con un reloj manual (`EngineConfig::clock` en Rust, `clock` de `open` en TypeScript), la app se ejecuta con un reloj cuyo tiempo avanza solo cuando la prueba lo avanza, y de inmediato, como con los fake timers de Jest o el `page.clock` de Playwright. `app.clock` es ese reloj, y `null` cuando la app se ejecuta con el del sistema:

```rust tabs
use std::time::{Duration, SystemTime};
use nsh_engine::{Clock, EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn autosaves() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    // 2026-01-01T09:00:00Z
    config.clock = Clock::manual(SystemTime::UNIX_EPOCH + Duration::from_secs(1_767_258_000));
    let mut app = Headless::start(config).unwrap();
    app.type_text("label:Note", "Milk").unwrap();
    app.run_for(Duration::from_secs(10)).unwrap(); // the autosave, ten seconds later
    assert!(app.shows("Saved at 09:00:10"));
}
```

```tsx tabs
const app = await open("./App.tsx", { clock: { time: new Date("2026-01-01T09:00:00Z") } });
await app.type("label:Note", "Milk");
await app.clock!.runFor(10_000);           // the autosave, ten seconds later
expect(app.texts()).toContain("Saved at 09:00:10");
```

Un `StubNetwork` cuyas respuestas tienen un `delay` sigue a un reloj manual con `.with_clock(clock.clone())`. Los pasos siguientes son los de `nsh test`; `Headless` tiene cada uno de ellos (`run_for`, `fast_forward`, `set_system_time`).

| Paso | Descripción |
|---|---|
| `await app.clock.runFor(ms)` | Avanza el reloj `ms` milisegundos, un fotograma de pantalla cada vez. Los temporizadores, `requestAnimationFrame`, las animaciones nativas y las respuestas retrasadas se ejecutan según vencen, en orden, cada uno en su momento. Se resuelve cuando la app está en reposo. |
| `await app.clock.fastForward(ms)` | Avanza el reloj `ms` milisegundos de una vez, como lo hace un dispositivo que despierta de la suspensión: los temporizadores vencidos entretanto se ejecutan una vez cada uno. |
| `app.clock.setSystemTime(time)` | Establece la hora de pared (`Date.now()`, `new Date()`) en un `Date` o en milisegundos, sin mover ningún temporizador. |

`Date`, `performance.now()` y la fecha por defecto de `Intl` siguen al reloj. Los pasos terminan lo que está en marcha sin esperarlo: mientras la app pide fotogramas o una animación nativa está en curso, los fotogramas llegan uno tras otro, cada uno con el tiempo de un fotograma (1/60 s) más tarde en el reloj. Una transición de 300 ms tarda unos pocos milisegundos, y un temporizador que venza durante ella se ejecuta. Una animación que se repite indefinidamente (un spinner) se ejecuta junto con el reloj: gira según la prueba mueve el reloj. `app.wait(ms)` y una pulsación larga avanzan el reloj por su duración. Un temporizador que vence más tarde se ejecuta solo cuando la prueba mueve el reloj hasta ese punto. `waitFor` y `waitUntil` mueven el reloj mientras esperan, un fotograma de pantalla cada vez, mirando tras cada fotograma, de modo que lo que muestra un temporizador llega mientras lo esperan, en un instante: `waitFor("Saved", { timeout: 15_000 })` mueve el reloj hasta quince segundos como máximo. Su tiempo límite cuenta en ambos relojes: una espera avanza el reloj de la app como mucho esa cantidad, y se rechaza cuando ha pasado también ese tiempo real, de modo que lo que llega desde fuera de la app (la función de una ruta, la red) dispone de tanto tiempo como con el reloj del sistema. Las pruebas de la galería se ejecutan así (`examples/gallery/tests`): sus doce pruebas que esperan animaciones tardan 6 s en lugar de 28 s.
<a id="steps"></a>

### Pasos

Los pasos nombran las vistas con **selectores**, escritos como los de Playwright:

| Selector | Coincide con |
|---|---|
| `id:<testID>` | La vista con ese `testID`. |
| `label:<label>` | La vista con ese `accessibilityLabel`. |
| `text:<text>` | Un texto que lo dice (salvo los espacios a su alrededor), un tramo de un texto que recibe pulsaciones (un `<Text onPress>` anidado, el enlace de un `TextView`), o un input que lo contiene o, mientras está vacío, con ese placeholder. |
| `role:<role>`, `role:<role>[<name>]` | Una vista con ese `role` (`role:button`), y ese nombre: su etiqueta o, si no, los textos que contiene (`role:button[Save]`). |
| `view:<id>` | La vista con ese id en la salida de `--trace`. |
| cualquier otra cosa | Un `testID`, si no una etiqueta, si no un texto, tal como está escrito. |

Una parte que empieza con una palabra en minúsculas y dos puntos nombra un prefijo (`id`, `label`, `role`, `text`, `view`), de modo que
`tapped: solo` es un error de paso que los enumera. Un texto, una etiqueta o un test id que empieza así toma su prefijo, que
lee el resto tal como está escrito: `text:tapped: solo`, `label:note: draft`, `id:row:2`. Los selectores conservan su significado cuando
llegan nuevos prefijos.

`label:`, `text:` y el nombre de un rol también admiten una expresión regular: `text:/^Buy/i`, escrita en la sintaxis del crate `regex` de Rust
(clases, grupos, anclas y cuantificadores de JavaScript, evaluados en tiempo lineal; flags `i`, `m` y `s`). ` >> ` busca
dentro de lo que coincidió en la parte anterior (`id:cart >> role:button[Remove]`), y `nth=<n>` conserva una de las coincidencias, empezando en 0
(`text:Delete >> nth=1`). Un selector encuentra las vistas que un usuario miraría primero: en el modal superior, luego en pantalla,
y de una pila de navegación solo la pantalla superior. Coincide con lo que el usuario ve: vistas con un área, fuera de `visibility: hidden`, dentro de la ventana y
de las vistas que las recortan (`overflow: hidden`), o en cualquier punto del contenido de un scroll view que el usuario pueda desplazar, y que el
desplazamiento hace entrar (`opacity` y las transformaciones aparte, como en Playwright). Un paso que actúa sobre una vista (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`) necesita exactamente
una: un selector que coincide con varias hace fallar el paso, y el error indica cómo acotarlo.

| Paso | Descripción |
|---|---|
| `await app.press(selector)` | Pulsa la vista, o la vista más cercana a su alrededor que recibe pulsaciones (el botón que rodea a un texto): `onPressDown`, `onPressUp`, `onPress`, dentro de un dedo que baja y se levanta, que oyen las vistas a su alrededor que escuchan toques (el `onPressOutside` de un overlay). Un tramo de un texto se pulsa sobre sus caracteres (`await app.press("Privacy policy")`), en headless y en iOS, Android y los escritorios. Una segunda pulsación sobre la misma vista en menos de 500 ms es su segundo clic (`clicks: 2`, una doble pulsación), tal como las plataformas los cuentan. Se rechaza cuando está deshabilitada. |
| `await app.longPress(selector)` | Mantiene un dedo sobre ella (o sobre la vista más cercana a su alrededor que recibe pulsaciones o toques) durante su `delayLongPress` (500 ms): `onPressDown`, `onLongPress`, `onPressUp`; no sigue ningún `onPress`. Los handlers de los toques oyen el dedo (se abre un `ContextMenu` o `Tooltip`). |
| `await app.clear(selector)` | Vacía el input, como al seleccionar todo y borrar. |
| `await app.type(selector, text)` | Escribe en el input (o en el primer input dentro de la vista; `text:` también coincide con el texto o el placeholder de un input) al final de lo que contiene, tecla por tecla: toma el foco y luego cada carácter es un `onKeyPress` y un `onChange`, dentro de `maxLength`. Un `\n` en un input de una sola línea es la tecla de retorno. |
| `await app.submit(selector)` | La tecla de retorno en el input, según indica su `submitBehavior`: `onSubmit` (y el foco sale de un input de una sola línea), o un salto de línea en uno multilínea. |
| `await app.scroll(selector, distance)` | Arrastra el scroll view o la lista (la vista, la que la rodea, o la primera dentro de ella) `distance` puntos a lo largo de su eje, 10 puntos por fotograma, dentro de su contenido, como puede hacer el usuario (`scrollable`). Un valor negativo desplaza hacia atrás. |
| `await app.hover(selector)` | Mueve el ratón sobre el centro de la vista: las vistas bajo él que dejó oyen `onMouseLeave`, aquellas sobre las que pasó oyen `onMouseEnter` y toman sus estilos `hover:`, y las que escuchan oyen `onMouseMove` con la posición donde está y sin ningún botón pulsado. Los escritorios y la web con cualquier ancho, incluido un navegador en formato de teléfono (headless: un escritorio o `"web"` `platform`); un teléfono iOS o Android no tiene ratón: allí se rechaza. |
| `await app.rightClick(selector)` | El botón secundario del ratón sobre el centro de la vista: ella, o la vista más cercana a su alrededor que escucha, oye `onContextMenu`. Los escritorios y la web (headless: un escritorio `platform`); un teléfono no tiene ratón: allí se rechaza. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | Pega en el input como lo hace el usuario con eso en el portapapeles: toma el foco y oye `onPaste` (`html` el mismo contenido con su formato, `files` son rutas cuyos bytes recibe como `File`s, `uris` `file:` URLs), y luego su texto entra como indica `pasteBehavior`. Headless, en macOS, en iOS y en la web; el portapapeles de la máquina queda como estaba. |
| `app.menu()` | Las acciones del menú contextual que muestra la app (`Menu.popup`): `label` (las de un submenú van después de la propia, `"Share > Mail"`), `disabled`, y `checked` para un elemento marcable; `null` cuando no hay ninguno abierto. |
| `await app.chooseMenuItem(label)` | Elige la acción del menú contextual abierto, como lo hace un clic sobre ella: la app oye `onMenu` (se ejecuta su `onSelect`) y luego el menú se cierra. Se rechaza cuando el elemento está deshabilitado o no existe. |
| `await app.closeMenu()` | Cierra el menú contextual abierto sin elegir nada, como lo hace Escape. |
| `await app.keyboard.press(keys)` | Pulsa una tecla con sus modificadores, como la nombra `keymap` (`"mod+k"`, `"shift+/"`, `"escape"`; `mod` es la tecla de comando de la plataforma), en un teclado físico, en todas las plataformas (los teléfonos y las tablets también tienen uno): el atajo de la app para esa tecla la oye (`keymap.bind`, `onKeyCommand`); si no, en macOS y en la web Tab y Shift+Tab mueven el foco del teclado entre los inputs y las vistas que reciben pulsaciones (estilos `onFocus`, `onBlur`, `focus:`) y Return o Space pulsa la vista en la que está el foco; si no, el input con foco recibe un carácter, Backspace o la tecla de retorno; si no, Escape retrocede. |
| `await app.keyboard.down(keys)` / `up(keys)` | Mantiene pulsadas teclas modificadoras (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, unidas por `+`) hasta `up`: las pulsaciones, los arrastres y los hovers entretanto las llevan, como un clic con Mod o un arrastre con Shift. Headless y en Linux por ahora. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | Arrastra como lo hace `drag` y mantiene el dedo abajo hasta `drop()`, que lo levanta donde está: los pasos intermedios ven la pantalla a mitad del arrastre (una vista previa del arrastre, una línea de soltado). Headless y en Linux por ahora. |
| `await app.dropFiles(selector, uris)` | Suelta archivos locales (URLs `file:`, como los arrastra un gestor de archivos) sobre el centro de la vista: ella, o la vista más cercana a su alrededor que escucha, oye `onFileDrop`. Escritorios, headless y Linux por ahora. |
| `await app.drag(selector, { x, y })` | Un dedo aterriza en el centro de la vista, reposa 100 ms, se desplaza `x`, `y` puntos, 10 por fotograma, y se levanta, tal como lo recibe la entrada de la plataforma: lo sigue un pan (`pan={{ x, y }}`, `onPanStart`, `onPanEnd` con la velocidad de suelta), las vistas que escuchan toques lo oyen (`onTouchStart`, `PanResponder`), un scroll view se desplaza con él y, si se tira lo bastante más allá de su parte superior, se actualiza (`onRefresh`), y una pulsación bajo él se cancela en cuanto se aleja. En los escritorios y la web es el ratón. |
| `await app.wait(ms)` | Deja que la app se ejecute durante `ms` milisegundos: temporizadores, animaciones, solicitudes. En un reloj manual, lo avanza `ms` (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | Se resuelve cuando una vista coincide, o con `{ state: "gone" }` cuando ninguna lo hace; se rechaza tras `timeout` ms (5000). En un reloj manual, lo avanza un fotograma de pantalla cada vez mientras espera, como máximo `timeout`. |
| `await app.waitUntil(condition, options?)` | Se resuelve cuando `condition()` devuelve true, comprobando de nuevo tras cada cambio de la app: para lo que ningún selector expresa (`() => app.storage().note === "Milk"`). En un reloj manual, lo avanza un fotograma de pantalla entre dos comprobaciones, como máximo `timeout`. |
| `app.shows(selector)` | Si una vista coincide ahora. |
| `app.count(selector)` | Cuántas vistas coinciden ahora. |
| `app.enabled(selector)` | Si la vista admite entrada: ni ella ni una vista a su alrededor está deshabilitada, y un input no está `readonly`. |
| `app.texts()` | Los textos en pantalla ahora, en orden. |
| `app.value(selector)` | El texto de un input, `null` cuando ninguno coincide. |
| `app.spanStyle(selector)` | El estilo resuelto del primer carácter coincidente, en headless y en cada `--target`: `color`, `backgroundColor` opcional, `fontSize`, `fontWeight`, `italic`, `underline` y `lineThrough`. Los colores son `#rrggbbaa`; los tamaños están en puntos. |
| `app.storage()` | Lo que contiene ahora el almacenamiento de la app. |
| `await app.back()` | Retrocede como lo hace el usuario (el botón de atrás de una cabecera, deslizar una hoja hacia abajo): la pila más interna del modal más reciente o, si no, de la pantalla, extrae su pantalla superior (`onDismiss`), o se lo pregunta a ella (`onBackRequest`) cuando tiene `preventBack`; sin una, el modal más reciente pide cerrarse (`onRequestClose`). Se rechaza cuando no hay nada de lo que retroceder. |
| `app.onDialog(handler)` | Responde a los diálogos que la app muestre a partir de ahora (`Alert.alert`, action sheets): `handler` recibe el diálogo (`title`, `message`, `buttons`, `cancelable`, `sheet`) y devuelve el texto del botón que se debe pulsar, o `null` para cerrarlo sin pulsar ninguno. |
| `app.dialogs()` | Los diálogos que la app mostró, en orden. |
| `app.onPick(handler)` | Responde a las selecciones que la app pida a partir de ahora (`Picker.pickImages`): `handler` recibe lo que pide la selección (`multiple`, `limit`, `maxDimension`, `quality`, `format`) y devuelve los archivos que elige el usuario (`{ name, type?, data: Uint8Array }`, entregados a la app tal cual), o `null` para cancelar. Sin un handler, las selecciones se cancelan. Ejecuciones headless. |
| `app.picks()` | Las selecciones que la app pidió, en orden. |
| `app.hear(text)` | El usuario dice `text` en la sesión de voz en curso (`Speech.start`): su `result` informa `text` como la transcripción completa hasta ahora. Ejecuciones headless. |
| `app.endSpeech(error?)` | Termina la sesión de voz en curso: con `error` (`"no-speech"`, `"network"`, ...) falla; si no, llegan un último resultado final y `end`, `no-speech` cuando no se oyó nada. Ejecuciones headless. |
| `app.speechRequests()` | Las sesiones de voz que la app inició, en orden: `lang` (`null` para la del usuario) y `interim`. |
| `app.clipboard()` | El texto que hay ahora en el portapapeles, `null` cuando no contiene ninguno. |
| `app.requests()` | Las solicitudes que hizo la app, en orden: `method`, `url`, `headers`, `body`. |
| `await app.host.send(name, data?)` | Envía a la app un evento de la app anfitriona (`host.on`) y luego espera hasta que todo queda en calma. Consulta [Simular la app anfitriona](#playing-the-host-app). |
| `app.host.calls()`, `app.host.posts()` | Las llamadas y publicaciones de la app que recibió el `host.handlers` de `open`, en orden: `name`, `data`. |
| `app.openedUrls()` | Las URLs que abrió la app (`openUrl`), en orden: registradas, nunca abiertas. |
| `await app.setViewport(width, height)` | Redimensiona el viewport, como lo hace girar el dispositivo o redimensionar una ventana (`windowSize()`). |
| `await app.setColorScheme(scheme)` | Cambia la apariencia del sistema a `"light"` o `"dark"`, como lo hace el usuario. |
| `await app.setLifecycle(state)` | Lleva la app a `"background"`, `"inactive"` o `"active"`, como lo hace el sistema cuando el usuario la deja, cambia a otra app o ventana y vuelve (`lifecycle()`). Solo en ejecuciones headless. |
| `await app.screenshot(path?)` | Una captura de la ventana de la app como PNG (un `Uint8Array`), guardada además en `path` en esta máquina cuando se indica (relativa al directorio actual). Solo una plataforma real dibuja la app: consulta [En una plataforma real](#on-a-real-platform). |

Un paso se resuelve cuando la app no ha renderizado nada durante 100 ms y no hay ninguna animación nativa en curso que termine por sí sola (2 s
como máximo, para las apps que renderizan todo el tiempo; en un reloj manual, también 2 s del tiempo de la app), de modo que lo que cambió está en
pantalla cuando se ejecuta la siguiente línea; usa `waitFor` para lo que llega después (una respuesta, un temporizador). En un reloj manual, un paso
no espera esos 100 ms: se resuelve en cuanto la app ha ejecutado todo lo que el paso y el tiempo del reloj dejaron
pendiente (temporizadores vencidos, promesas, una respuesta simulada contestada al instante) y no pide ningún fotograma, salvo que aún haya una solicitud en
curso, así que las pruebas con reloj manual se ejecutan sin pausas entre sus pasos. Lo que responde otro hilo (una llamada
`nsh/host`, una lectura de archivo, el trabajo de una tarea de Rust en un hilo) llega después de que el paso se resuelva: `waitFor` lo que
muestra. Una animación que se repite indefinidamente, como un spinner de carga, sigue ejecutándose en segundo plano mientras los pasos y `waitFor` continúan, igual que una animación
CSS infinita en las pruebas de un navegador. Un paso se rechaza, haciendo fallar la prueba, cuando nada coincide con su selector (el error enumera los textos en
pantalla), cuando la app lanzó una excepción entretanto y cuando la app pidió lo que solo responde una plataforma real.

Los fallos que una prueba puede esperar llevan un `code`, que se mantiene tal cual; sus mensajes son para personas y pueden cambiar, por lo que
una prueba debe comparar el código:

| `code` | El paso o la consulta |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | Nada en pantalla coincide con el selector, o el menú abierto no tiene tal elemento. |
| `ERR_NSH_TEST_DISABLED` | La vista que nombra el selector está deshabilitada (un scroll view que el usuario no puede desplazar, un elemento de menú deshabilitado). |
| `ETIMEDOUT` | `waitFor` o `waitUntil` se quedó sin tiempo, o la app no renderizó nada tras `open`. |
| `ERR_NSH_TEST_NO_BACK` | `back()` no encontró nada de lo que retroceder. |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` con `--target` recibió una opción que la plataforma de destino no puede cumplir: `width` o `height` en iOS y Android, el `platform` de un teléfono en un escritorio o en la web, el de un escritorio o el del otro teléfono en iOS o Android, `host.handlers`. El mensaje la nombra. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` lee un `<Text testID="guide">` anidado; `text:word` lee el primer carácter
de esa coincidencia. Acota las consultas con `id:note >> text:word` y selecciona coincidencias repetidas con `>> nth=0`.
La consulta informa de un error para un tramo inexistente, ambiguo o vacío. Actualizar el `testID` de un tramo reutiliza su disposición
de texto y conserva el recuento de callbacks de `onTextLayout`.
<a id="what-headless-runs-play-of-the-platform"></a>

### Qué hace de la plataforma una ejecución headless

Una ejecución headless tiene el runtime real y ninguna plataforma. Hace el papel de la plataforma que define el protocolo de NSH, y nada de lo que solo una plataforma real puede hacer:

- **Las animaciones nativas se ejecutan** fotograma a fotograma, hasta el final: se ejecutan los callbacks `start(callback)` y también lo que espera por ellos. Los bucles sin fin se ejecutan hasta que la app los detiene.
- **Volver atrás** saca pantallas de la pila y cierra modales como lo hace una plataforma (`app.back()`).
- **Los diálogos se responden**: con el `onDialog` de la prueba; si no, con su botón de cancelar; si no, se cierran cuando pueden cerrarse; un diálogo que solo responden sus otros botones hace fallar el paso que lo mostró hasta que la prueba indica cuál pulsar.
- **El portapapeles guarda texto**: lo que la app copia, que se lee de vuelta cuando pega (`clipboard` para empezar con algo).
- **El host de la página responde a `host`** cuando el `nsh.json` de la app nombra uno en `web.host` ([El host de la página](#the-pages-host)).
- **La app se ejecuta con sus capacidades**: lo que su `nsh.json` declara en `capabilities` se aplica como en un dispositivo, así que lo que no declara se rechaza.
- **Las URL se registran**: lo que la app abre se da por abierto, y `app.openedUrls()` lo lista.
- **Las selecciones se responden**: con los archivos de la prueba (`onPick`); si no, se cancelan, de modo que `Picker.pickImages` se resuelve con `[]`.
- **La voz la pone la prueba**: `Speech.available()` se resuelve con `true`, una sesión empieza de inmediato y oye lo que dice `hear`.
- **Los modales se muestran de inmediato**: `onShow` llega cuando se presenta uno.
- **Las imágenes no se cargan**: no llega ningún `onLoad` ni `onError`, y `Image.getSize` y `Image.prefetch` se rechazan.
- **Lo que solo responde una plataforma real hace fallar el paso**: una imagen o archivos en el portapapeles.

<a id="the-pages-host"></a>

### El host de la página

Una app publicada en la web obtiene su host de su página: `nsh.json` `web.host`, un módulo que exporta `createHost(player)` ([Web](./web.md#the-hosts-functions)). Las ejecuciones headless cargan ese módulo para cada app que abre una prueba, antes de que la app arranque, en un contexto de JavaScript propio (temporizadores y `console`, nada del navegador, sin imports): su `call` responde a [`host.call`](../modules/nsh.md#host) de la app, su `player.hostEvent` llega a `host.on`, y `host.available()` es `true`. Un `call` que lanza una excepción, se rechaza o devuelve algo que no es JSON rechaza la llamada de la app con su mensaje, como en la página, y los eventos enviados antes de que la app arranque llegan a sus listeners de nivel superior cuando lo hace. `--web-host <module>` nombra otro módulo. El `capabilities.host` de la app debe listar lo que llama, como en la página. El timeout de una llamada y los temporizadores propios del host se ejecutan con el tiempo de la app, de modo que un reloj manual los mueve (`app.clock.runFor`). En un navegador (`--target web`) la página de desarrollo ejecuta el `web.host` de `nsh.json` para cada app, igual que una página publicada; en las demás plataformas (`--target`) las apps no tienen host: `host.available()` es `false`.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` tiene una app, su host y sus pruebas.

<a id="expectations"></a>

### Expectativas

`expect(value)` comprueba valores como lo hace Jest, tal como los produjo JS: `toBe` es `Object.is`, `toEqual` compara miembro a miembro, y un `Date`, un `Map` o un `Uint8Array` se compara como lo que es. Cada comprobación lanza una excepción cuando no se cumple. `.not` las invierte: `expect(app.texts()).not.toContain("Error")`. Dada una función, `toThrow` comprueba lo que lanza al llamarla; dada una promesa, o una función que devuelve una, `rejects` y `resolves` comprueban con qué se resuelve, como en Jest: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| Comprobación | Se cumple cuando |
|---|---|
| `toBe(expected)` | El valor es `expected`, según dice `Object.is`: el mismo primitivo (`NaN` es `NaN`, `0` no es `-0`) o el mismo objeto. |
| `toEqual(expected)` | El valor es igual a `expected` miembro a miembro, como el `toEqual` de Jest: los objetos por sus propiedades enumerables propias (una propiedad que es `undefined` cuenta como ausente), los arrays elemento a elemento, las fechas por su tiempo, las expresiones regulares por su fuente y sus flags, los mapas y conjuntos por sus entradas en cualquier orden, los `ArrayBuffer` y los arrays tipados por sus bytes, los errores por nombre y mensaje; `NaN` es igual a `NaN`. Una instancia de una clase es igual a un objeto plano con sus propiedades. |
| `toMatchObject(subset)` | El valor tiene todas las propiedades de `subset`, cada una igual según dice `toEqual`, y los objetos que contiene coinciden a su vez; las demás propiedades no se miran, y los arrays coinciden elemento a elemento, todos ellos. |
| `toContain(item)` | Un array, un `Set`, un array tipado u otro iterable contiene `item` (`===`), o una cadena lo contiene. |
| `toContainEqual(item)` | Un array, un `Set` u otro iterable contiene un elemento igual a `item`, según dice `toEqual`. |
| `toBeTruthy()`, `toBeFalsy()` | El valor es truthy / falsy, tal como lo ve JS. |
| `toMatch(pattern)` | Una cadena contiene `pattern` (una cadena), o coincide con él (una `RegExp`, ejecutada por el motor de JS: look-behind, referencias hacia atrás y grupos con nombre funcionan como en JavaScript). |
| `toHaveLength(n)` | El `length` del valor es `n`: las unidades UTF-16 de una cadena, los elementos de un array o de un array tipado. |
| `toBeNull()` | El valor es `null`. |
| `toBeUndefined()`, `toBeDefined()` | El valor es `undefined` / cualquier otra cosa. |
| `toBeNaN()` | El valor es `NaN`. |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | Un número se compara así con `n`. |
| `toThrow(expected?)` | `expect(fn)`: llamar a `fn` lanza una excepción. Dado `expected`, el error coincide con él: su mensaje contiene una cadena o coincide con una `RegExp`; una clase de error (`TypeError`, una clase de la app) es el `name` del error, y `Error` coincide con cualquier error; un error tiene el mismo mensaje. |
| `rejects.toThrow(expected?)` | `expect(promise)`: la promesa se rechaza, con un error que coincide con `expected` según dice `toThrow`. |
| `rejects.toMatchObject(subset)` | `expect(promise)`: la promesa se rechaza con un valor que coincide con `subset` según dice `toMatchObject`: las propiedades propias de un error (`code`, `permission`, ...) con su `name` y su `message`. |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)`: la promesa se resuelve con un valor que cumple la comprobación. |

Una comprobación fallida dice qué obtuvo y qué esperaba, escrito como lo escribiría JS:
`expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

`rejects` y `resolves` también tienen un `.not` propio: `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### En una plataforma real

`nsh test --target macos` (o `linux`, `windows`, `gpui`, `web`, `ios`, `android`) ejecuta las mismas pruebas en el host de desarrollo de la plataforma en lugar de headless: cada `open` inicia la app en una ventana propia, con un directorio de datos nuevo, y los pasos actúan con la entrada propia de la plataforma sobre las vistas que nombran sus selectores, como hace Playwright en un navegador:

- una pulsación es un clic en el centro de la vista, una pulsación larga es un clic sostenido, `type` hace clic en el input y escribe sus teclas, `scroll` es un gesto de trackpad sobre la vista de scroll, `back` es lo que hace un usuario (Escape en macOS y Linux, el botón atrás del ratón en Windows y en GPUI, el botón atrás del navegador en la web, una hoja deslizada hacia abajo, el gesto de escape de VoiceOver mientras hay un menú, un popover o un `Sheet` abierto, y si no el botón atrás de la cabecera en iOS, el botón atrás en Android);
- una vista fuera de pantalla se desplaza primero hasta quedar visible, un gesto cada vez; en una pantalla táctil el dedo se posa donde la propia página lo admite, junto a las vistas que siguen un arrastre (un slider, un área de dibujo), como cuando un usuario hace scroll;
- los selectores, las esperas y las consultas ven el mismo modelo de la app que las ejecuciones headless, construido a partir de lo que dibuja el host, así que encuentran las mismas vistas;
- los diálogos son los propios de la plataforma: `app.dialogs()` los lee, y responder a uno (`onDialog`, o su botón de cancelar cuando la prueba no dice nada) pulsa su botón;
- `app.screenshot(path)` toma una imagen de la ventana.

```sh
nsh test --target macos                       # the app's tests in macOS windows
nsh test --target linux                       # in GTK windows (xvfb-run -a … on a machine without a display)
nsh test --target windows                     # in Win32 windows
nsh test --target ios                         # in an iOS simulator
nsh test --target android                     # on the Android device or emulator adb lists first
nsh test --target gpui                        # in GPUI windows (macOS, Windows, Linux)
nsh test --target web                         # in a headless Chrome, Edge or Chromium
nsh test tests/form.test.tsx --target macos   # one file
```

La ventana se abre con el tamaño del viewport (390 × 844 salvo que `open` indique otro), dentro de la pantalla; en iOS y Android la app ocupa la pantalla del dispositivo, con el tamaño del dispositivo. La app se ejecuta como la plataforma del destino (`platform.os`). Un `clock` manual funciona como en headless: `app.clock.runFor`, `fastForward` y `setSystemTime` mueven al instante el tiempo de la app (temporizadores, `requestAnimationFrame` separados por un fotograma, `Date`), `app.wait(ms)`, `waitFor` y `waitUntil` también lo mueven, y cada fotograma que muestra la plataforma lo mueve un fotograma (1/60 s), de modo que el tiempo de la app pasa mientras anima. Las animaciones propias de la plataforma, y el `delay` de una ruta, toman tiempo real. Las peticiones de la app llegan a la prueba como en headless: las rutas `network` las responden, una petición que no coincide con ninguna ruta falla, y `"live"` las deja pasar a la red del host; `app.requests()` las lista todas. Los sockets y WebSockets se conectan a la red del host con `"live"`, y de lo contrario se rechazan como en headless. `storage` está en el almacenamiento de la app cuando arranca, y `app.storage()` lo lee desde la app. `locale`, `reducedMotion` y `safeArea`, cuando `open` los proporciona (un valor por defecto incluido), contienen lo que informa la plataforma, y un `colorScheme` que se proporcione cambia la apariencia del sistema (`"light"` también); lo que omite es el de la plataforma, y las llamadas de la app al portapapeles se sirven desde el portapapeles propio de la prueba (`clipboard` es su texto al principio, `app.clipboard()` lo lee), de modo que el portapapeles de la máquina queda como estaba; el copiar y pegar propio de un input de texto usa el del sistema. `host.params` llega a la app, `app.host.send` envía eventos, y las URL que la app abre se registran para `app.openedUrls()` en lugar de abrirse. `host.handlers` se ejecuta headless, donde la prueba responde a las llamadas de la app. `open` comprueba sus opciones contra el destino: `width` y `height` en iOS y Android, un `platform` de otro tipo de dispositivo (el de un teléfono en un escritorio o en la web, el de un escritorio o el del otro teléfono en iOS o Android) y `host.handlers` se rechazan con `ERR_NSH_TEST_UNSUPPORTED`, de modo que una prueba se ejecuta tal como está escrita o dice lo que necesita. El `platform` de un escritorio (`"macos"` para el ratón y las teclas de un escritorio) se ejecuta en todos los destinos de escritorio y en la web, como la plataforma de ese destino y siempre como un escritorio: en el navegador la página arranca con el idioma de escritorio sea cual sea su ancho, mientras que sin un `platform` (o con `"web"`) mide su idioma como lo hace un navegador (un escritorio a partir de 600 puntos de ancho). Una app con crates de Rust propios se ejecuta en un host de desarrollo construido con sus crates, que NSH construye para la plataforma; el host de una app de Rust ejecuta su raíz, así que `open(".")` la inicia allí como lo hace en headless.

En la web, las apps se ejecutan en la página del host de desarrollo en un Chrome, Edge o Chromium headless: el instalado en esta máquina, o el ejecutable que nombra `--browser <PATH>` (se necesita un navegador: `nsh test` indica dónde buscó cuando no encuentra ninguno). Un navegador atiende toda la ejecución, y cada `open` obtiene una página con almacenamiento propio. La entrada es la entrada de confianza del navegador, como la de un usuario: clics de ratón, scroll con la rueda y teclas.

En iOS, las apps se ejecutan en el host de desarrollo en un simulador de iOS: el que esté arrancado, o si no el iPhone más reciente, que `nsh test` arranca. Los pasos son toques de un dedo y la escritura del teclado de software, tal como UIKit los recibe del dispositivo. `setColorScheme` cambia la apariencia del simulador, que `nsh test` restablece después de la app, y la pantalla tiene el tamaño del dispositivo simulado.

En Android, las apps se ejecutan en el host de desarrollo en el primer dispositivo o emulador que lista `adb devices`, con almacenamiento propio. Los pasos son toques de un dedo y teclas de un teclado, tal como las vistas de la app los reciben del dispositivo; `back` es el botón atrás del sistema. `setColorScheme` cambia el tema oscuro del dispositivo, que `nsh test` restablece después de la app.

<a id="steps-from-standard-input"></a>

### Pasos desde la entrada estándar

Dada la entrada de la app en lugar de pruebas, `nsh test` abre la app en la red real, la deja ejecutarse durante 1,2 s y luego toma los pasos que da la entrada estándar, con `app` la app:

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

Los 1,2 s permiten que se ejecute la recolección de basura en reposo del motor antes del primer paso, de modo que una app que suelta lo que todavía usa lo muestra: sus handlers dejan de funcionar.

Los ejemplos tienen pruebas desde las que empezar: `examples/gallery-rs` para una app de Rust (`cargo test`, un módulo por demo, y `App.test.tsx`), `examples/rust-exports` para una app con un crate de Rust, `examples/counter` y `examples/gallery/tests` (almacenamiento, inputs, una lista larga, peticiones simuladas, modo oscuro, un reloj manual) para apps TSX.

<a id="tracing-with---trace"></a>

## Trazado con --trace

`--trace` imprime cada lote de montaje de las apps que abren las pruebas, bajo el paso en el que llegó, y el tiempo de cada commit. En Rust, una prueba imprime lo mismo: `observe` le entrega cada lote con su paso, y `EngineConfig::trace` registra las líneas `perf` a través del crate `log` (target `nsh::perf`; instala un logger como `env_logger` en la prueba):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` acepta `--trace` sobre un archivo de pruebas, o sobre la entrada de la app con los pasos en la entrada estándar:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

Con `--target`, el trazado es el de la plataforma: los lotes que aplicó el host, bajo los pasos que los provocaron, y los tiempos propios del host de cada commit y evento, en el hardware del dispositivo.

Úsalo para:

- comprobar que una app (o una demo) compila, se evalúa y se renderiza sin errores;
- ver exactamente qué vistas nativas crea, mueve o actualiza un cambio, y cuántas;
- medir el coste del primer fotograma, de un toque y de cada fotograma de scroll;
- detectar regresiones en CI.
<a id="reading-the-output"></a>

### Leer la salida

Este es el ejemplo del contador con una pulsación (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), abreviado:

```text
✓ bundled App.tsx (3255 B in 6.2 ms)
perf commit: 56 ops, 271µs (list js 5µs), 49 mount items, 21 nodes
perf first frame: eval 187µs, total 820µs
── open(App.tsx): 49 items
   LayoutDirection { rtl: false }
   Create { id: 2, kind: View }
   Create { id: 4, kind: Text }
   Insert { parent: 2, child: 4, before: None }
   ...
   Frame { id: 2, x: 0, y: 0, w: 390, h: 844 }
   Frame { id: 4, x: 24, y: 64, w: 342, h: 34 }
   ...
   Text { id: 4, text: "nsh counter", content: 342x34 @ 0,0 }
   Text { id: 14, text: "0", content: 36x77 @ 0,0 }
perf event Press on view 26
perf event js: 413µs
perf commit: 10 ops, 672µs (list js 7µs), 7 mount items, 24 nodes
── press(+1): 7 items
   Create { id: 42, kind: Text }
   Insert { parent: 32, child: 42, before: None }
   Frame { id: 32, x: 24, y: 366, w: 342, h: 43 }
   Frame { id: 42, x: 0, y: 23, w: 342, h: 20 }
   Text { id: 14, text: "1", content: 36x77 @ 0,0 }
   Text { id: 42, text: "• 1", content: 342x20 @ 0,0 }
   Text { id: 34, text: "Recent values: 1", content: 342x17 @ 0,0 }
✓ App.tsx › steps (1.4s)
```

<a id="batches-and-mount-items"></a>

#### Lotes e ítems de montaje

Cada bloque `── step: N items` es un **lote de montaje**, bajo el paso en el que llegó: todo lo que la plataforma aplica a las vistas nativas en un fotograma,
en un solo salto al hilo principal. Las líneas que contiene son **ítems de montaje**:

| Ítem | Significado |
|---|---|
| `Create { id, kind }` | Crea una vista nativa (`View`, `Text`, `Image`, `Scroll`, ...). |
| `Insert { parent, child, before }` | Coloca una vista en su padre, antes de un hermano (`None`: al final). |
| `Remove` / `Delete` | Desvincula una vista de su padre / la libera. |
| `ViewStyle { id, style }` | La decoración de la vista: fondo, bordes, radio, sombra, opacidad, transformación, ... |
| `ViewProps { id, props }` | Ajustes de toque y accesibilidad, `testID`. |
| `Events { id, events }` | Qué eventos reporta la vista (`EventMask(1)` es la pulsación). |
| `Frame { id, x, y, w, h }` | Su posición y tamaño dentro de su padre, en puntos. |
| `Text { id, text, content }` | Texto ya maquetado para una vista de texto. |
| `Image { id, source, ... }` | Una imagen que se debe cargar. |

Solo se envía lo que cambió: un toque que cambia un número envía un único ítem `Text`; las vistas no reciben estilo por defecto ni máscara de eventos vacía; los fotogramas sin cambios no se envían. Un fotograma de desplazamiento que no revela ninguna fila nueva no produce **ningún lote**.

<a id="the-762-lines"></a>

#### Las líneas `perf`

| Línea | Significado |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | Tiempo de empaquetado y tamaño del bundle (ajustes de desarrollo). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | Un commit: las operaciones que JS puso en cola, el tiempo que empleó el núcleo (renderizar componentes, maquetar, calcular diferencias), el tiempo de JS dedicado a enlazar las filas de las listas, los ítems de montaje producidos y los nodos vivos. |
| `turn: 2640µs (timers and tasks 1964µs)` | Un turno que hizo commit: su tiempo total y lo que tardaron sus temporizadores de JS y las tareas de componentes Rust antes del commit (un componente Rust se renderiza durante el commit). |
| `first frame: eval 271µs, total 1235µs` | Tiempo para evaluar el bundle y desde el inicio hasta el primer lote. |
| `event Press on view 20` / `event js: 196µs` | Un evento despachado y el tiempo que tardó su manejador (y lo que provocó) en JS. |

> [!NOTE]
> El texto se mide sin interfaz con un motor de texto aproximado, por lo que los tamaños de texto difieren un poco de los de un dispositivo, que usa
> CoreText o el sistema de maquetación de texto de Android. La lógica de maquetación, el número de vistas y el número de operaciones son los mismos.

Los tiempos de una sola ejecución dependen mucho del estado del reloj de la CPU (una máquina que acaba de salir del reposo es lenta). Compara ejecuciones en
la misma máquina, fíjate en el mínimo de varias ejecuciones y confía más en los recuentos de operaciones y de ítems que en los microsegundos.

<a id="scrolling"></a>

### Desplazamiento

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` mueve la lista 10 puntos por fotograma, a 60 fotogramas por segundo, y se imprime el lote de cada fotograma:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

En una [lista](./lists.md), esto muestra la virtualización en acción: qué fotogramas enlazan filas nuevas, cuántas operaciones cuesta una fila y que los fotogramas que no revelan ninguna fila nueva no producen nada. Úsalo con una compilación release (`cargo test --release`, o `./target/release/nsh` en un checkout) para obtener tiempos representativos.

<a id="in-ci"></a>

### En CI

Las pruebas sin interfaz no necesitan dispositivo ni pantalla, así que se ejecutan en runners de Linux: `cargo test` para las pruebas de una app Rust y
`nsh test`, que no necesita nada más que la CLI. Cualquier prueba fallida hace que ambos terminen con un código distinto de cero: una prueba que
falla, una app que no compila o no renderiza nada, una excepción que la app lanza durante un paso.

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test                            # a Rust app's tests
      - run: nsh test --junit test-results.xml     # its TypeScript tests, or a TSX app's
```

(Instala la CLI de `nsh` en el runner igual que la instalas en local; consulta [Instalación](./installation.md).)

`--junit <FILE>` también escribe los resultados como un informe JUnit XML, que los servicios de CI (reporteros de pruebas de GitHub Actions,
GitLab, Jenkins, Azure Pipelines) muestran por prueba: un `testsuite` por archivo de prueba, un `testcase` por prueba, con lo que falló,
dónde y los textos en pantalla.

Para vigilar el rendimiento, registra los recuentos de ítems de unas pocas interacciones (las líneas `── … : N items` y los números `ops` /
`mount items` de `--trace`) y haz que falle cuando crezcan. Los recuentos son deterministas; los tiempos en máquinas de CI compartidas
no lo son.

> [!NOTE]
> Las pruebas se ejecutan bajo el `capabilities` que declara el `nsh.json` de la app, como en un dispositivo: lo que la app no declara también
> se rechaza en la prueba.

<a id="784-for-ui-tests"></a>

## `testID` para pruebas de UI

Las pruebas sin interfaz comprueban lo que renderiza el runtime, y sus selectores `id:` encuentran las vistas por test id. Para manejar la interfaz
nativa real con las herramientas de prueba de la plataforma (XCUITest, Espresso / UI Automator, Appium, Maestro), asigna un test id a las vistas:
`.test_id(…)` en Rust, `testID` en TSX:

```rust tabs
view()
    .test_id("add-to-cart")
    .p_3()
    .on_press(add)
    .child(text(move || format!("{} items", count.get())).test_id("cart-count"))
```

```tsx tabs
<View testID="add-to-cart" onPress={add} style={{ padding: 12 }}>
  <Text testID="cart-count">{`${count()} items`}</Text>
</View>
```

| Plataforma | Dónde va `testID` |
|---|---|
| iOS | El `accessibilityIdentifier` de la vista (`app.otherElements["add-to-cart"]` en XCUITest). |
| Android | El nombre del recurso del id de vista del nodo de accesibilidad (`By.res("add-to-cart")` en UI Automator). |

El test id es un método de todos los elementos en Rust, incluidos los elementos de los componentes (`button().test_id("save")`, que
nombra la raíz del componente), y `testID` una prop de todos los elementos y de todos los componentes Rust (`Button`, `Dialog`, ...). No cambia lo que dicen los lectores de pantalla;
usa `accessibilityLabel` para eso (consulta [Accesibilidad](./accessibility.md)). En la salida de `--trace` aparece en
el ítem `ViewProps` de la vista como `test_id: Some("add-to-cart")`.

<a id="see-also"></a>

## Véase también

- [Rendimiento](./performance.md): qué buscar en estos números
- [Servidor de desarrollo y depuración](./dev-server-and-debugging.md)
- [Arquitectura](./architecture.md): operaciones, commits y lotes de montaje
