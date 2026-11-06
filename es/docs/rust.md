---
title: "Compilar con Rust"
description: "Escribe una aplicación de Native Shell completamente en Rust, sin QuickJS en ninguna plataforma, o en Rust con pantallas TSX por encima: cuándo elegir cada opción y cómo comparten componentes y módulos."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---


# Compilar con Rust

Las apps de Native Shell se escriben en Rust, en TSX o en ambos. Los tres usan el mismo motor: el grafo reactivo, el renderizador, el layout de Taffy y los módulos nativos (navegación, diálogos, el teclado, la barra de estado) son Rust en todos los casos, y cada plataforma renderiza con su propia UI. Lo que cambia es el lenguaje de tu propio código y, con él, si la app incluye una VM de JavaScript.

| | Rust | TSX | Rust con TSX |
|---|---|---|---|
| Tu UI, estado y manejadores | Rust | TSX sobre QuickJS | Componentes y módulos en Rust, pantallas en TSX que los usan |
| La app ejecuta | solo el motor y tu crate, en todas las plataformas y en el navegador | QuickJS y el motor (en el navegador, su motor de JavaScript) | QuickJS y el motor, con tu crate (en el navegador, su motor de JavaScript) |
| Ideal para | Apps medianas y grandes con lógica de negocio exigente | Apps y módulos entregados en tiempo de ejecución, iteración rápida | Un núcleo en Rust con partes que cambian a menudo |
| Ediciones | Recompilar y reiniciar | Actualizaciones en caliente | Actualizaciones en caliente para TSX, recompilar y reiniciar para Rust |
| Inicio | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## Cómo elegir

**Rust** es ideal para apps cuya lógica de negocio es grande y exigente: trading, editores, herramientas con muchos datos. Obtienes el sistema de tipos de Rust y las comprobaciones en tiempo de compilación en toda la app, el ecosistema de crates.io, rendimiento nativo para tu propio código (no solo para el de NSH) y pruebas headless de la UI real con `cargo test`. La app es Rust y código nativo de principio a fin: ninguna VM de JavaScript se distribuye con ella ni se ejecuta en ella, en iOS, Android, macOS, Windows, Linux, GPUI y la web. Los componentes son funciones que se ejecutan una sola vez y enlazan signals con lo que muestran, como en TSX ([Reactividad](./reactivity.md)), escritas con estilos tipados en lugar de cadenas de clases.

**TSX** es ideal para una UI que llega después de que la app se publique: módulos que una app nativa carga en tiempo de ejecución, generados por un modelo o escritos por otro equipo, entregados como [paquetes firmados](./signed-packages.md) y ejecutados en un sandbox que configura el host, con actualizaciones en caliente mientras desarrollas.

**Rust con TSX** mantiene el núcleo en Rust y añade TSX donde aporta valor: pantallas, ajustes, onboarding, experimentos, todo lo que iteras con actualizaciones en caliente o entregas en tiempo de ejecución como [paquete firmado](./signed-packages.md). TSX importa tus componentes y módulos de Rust como cualquier módulo de NSH, de modo que las dos mitades se encuentran en interfaces tipadas. El TSX se ejecuta en QuickJS, que la app pasa a incluir.

<a id="an-app-written-in-rust"></a>

## Una app escrita en Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` contiene la app: componentes, estado, manejadores, tareas.

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

Los elementos y los componentes se crean de la misma manera: una función crea uno (`view()`, `text(..)`, el `button()` de `nsh_base`, el `chart()` de tu `#[component] fn Chart`), y sus métodos establecen sus props, un setter por prop (un valor, un signal o un closure), y sus listeners, un método por evento. Los listeners son closures de su evento (`move |text: &str| ..`), y `move || ..` para un evento sin datos; `.child(..)` acepta un elemento, o un `Option`, un `Vec`, un array o un iterador de elementos (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` nombra la raíz y `nsh` la monta:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` es la ruta del componente en el crate (`App`, `shell::Gallery`; en el primero con [varios crates](#several-crates)); `"theme"` es el [tema](#theme) con el que dibujan sus componentes, y `"appearance"` se le aplica igual que a una app TSX. Con eso, `nsh run` y `nsh package` en el directorio de la app compilan el runner propio de la app para el destino, con la raíz montada y sin QuickJS enlazado:

| Destino | Qué se ejecuta |
|---|---|
| macOS, Windows, Linux | El runner de release con tu crate, en una ventana; `nsh run` ejecuta una compilación de debug y muestra los logs de la app en la terminal |
| iOS, el simulador de iOS, Mac Catalyst | El runner de iOS con tu crate, en una app |
| Android | El `libnsh.so` de la app con tu crate, iniciado por la activity del runtime |
| Web | `nsh.wasm` con el motor y tu crate (3,3 MB para toda la galería de Rust, 0,75 MB con brotli); la página monta la raíz |

`nsh` compila lo que tu crate necesita y nada más: un programa pequeño con tu crate y el núcleo de NSH que describe sus componentes y módulos al CLI, que luego hace el resto por sí mismo, y el runner de cada destino que ejecutas o empaquetas. La primera compilación de una app Rust nueva compila tu crate y el núcleo de NSH, unos 60 crates. `nsh test` ejecuta las pruebas de la app en modo headless en un runner de tu crate compilado de la misma manera.

En Linux, tu crate selecciona funciones opcionales de la plataforma. Activa `webview` en tu dependencia `nsh-platform-linux` para usar web views; esto enlaza WebKitGTK 6.0, que debe estar instalado para compilar y ejecutar la app. El runner generado hereda esa elección mediante la unificación de features de Cargo.

Durante `nsh run`, un cambio en el código Rust del crate vuelve a compilar el runner y reinicia la app; en el navegador, la página abierta carga por sí sola el nuevo runtime. `cargo run` inicia la misma raíz directamente en el backend de escritorio (`src/main.rs`), y las apps nativas que integran NSH montan una raíz de Rust con `AppSource::Rust` en el `AppView` de macOS, Windows, Linux, GPUI y iOS.

El código para todas las plataformas, la web incluida, usa los servicios de NSH: `fetch` para HTTP ([Redes](./networking.md#from-rust-components)), `timer`, `set_timeout` y `set_interval` para esperar, `nsh_core::time::Instant` y `nsh_core::time::unix_ms()` para el reloj. `background` y `blocking` ejecutan trabajo en los hilos de los destinos nativos.

<a id="desktop-title-bars"></a>

## Barras de título de escritorio

Las apps Rust dibujan sus propias barras de título con `nsh_core::element::desktop`. Llama a `set_title_bar(TitleBarStyle::Hidden, Some(height))`, marca el fondo de la barra con `.window_drag(true)` y reserva el espacio de los controles nativos de la ventana con `title_bar()`. Su `top` es la altura de la barra, y `left` y `right` son los anchos ocupados por los controles del sistema. Al leerlo te suscribes a los cambios, incluido el de pantalla completa. La plataforma gestiona el arrastre de la ventana y el comportamiento del doble clic en la barra de título que el usuario haya configurado; `.window_drag(false)` mantiene a un hijo fuera de la región de arrastre de su padre.

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` restaura la barra de título del sistema. `close_window()` sigue el comportamiento normal de cierre de ventana del host que integra la app. El módulo también incluye las demás funciones de la ventana (`set_title`, `minimize`, `toggle_full_screen`, ...) y los menús (`set_application_menu`, `popup_menu`): [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## Archivos y carpetas

En los escritorios, el código Rust muestra los diálogos de archivos del sistema y entrega rutas locales al sistema, y cada respuesta se espera en una tarea: `pick_paths` con un `OpenDialog` (`OpenDialog::files()`, `::folders()` o `::files_and_folders()`), `pick_save_path` con un `SaveDialog`, `open_path` (la app predeterminada del archivo), `reveal_path` (el elemento seleccionado en Finder, el Explorador de archivos o el gestor de archivos) y `move_to_trash` (adónde fue el elemento, cuando macOS lo indica). Los diálogos responden `Ok(None)` cuando el usuario cancela y un error cuando no pueden mostrarse (en Linux sin un portal de selección de archivos, y en iOS, Android y la web, donde `open_path`, `reveal_path` y `move_to_trash` también responden un error). Toda solicitud que falla responde su error, nunca `false`.

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## Ampliar una app de Rust con TSX

La función `#[native_module("app/native")]` del crate nombra lo que TSX puede importar: componentes (`registry.register::<Chart>()`), módulos de funciones (`registry.module::<Portfolio>()`, `#[module]` sobre una unit struct y su `impl`), clases (`registry.class::<Ledger>()`, `#[class]` sobre una struct y su `impl`) y assets; el atributo también crea `pub fn registry()` en la raíz del crate, el mismo conjunto para tus pruebas y otro código Rust (`my_app_native::registry()`, junto a `nsh_base::registry()`). En un `impl` `#[module]` o `#[class]`, los `pub fn` se exportan (`pub(crate)` también); las funciones sin visibilidad son auxiliares que se quedan en Rust. Sus declaraciones de TypeScript, comentarios de documentación incluidos, se generan a partir de los tipos de Rust en `.nsh/types`, de modo que TSX se comprueba contra ellas con `nsh check` y tu editor:

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

Cada export se documenta en TypeScript con el comentario de documentación del elemento de Rust que lo nombra: un componente con su `#[component] fn` (`Chart`), un módulo y una clase con su struct (`Portfolio`, `Ledger`), y las props, eventos, funciones y miembros con los suyos (un setter no necesita ninguno además del de su getter). Los comentarios de documentación de la struct `Props` y del enum de eventos, y los de los bloques `impl`, se quedan en Rust; un comentario de documentación en un bloque `impl` de `#[module]` o `#[class]` es un error de compilación, ya que TypeScript no lo mostraría. Cada comando que escribe `.nsh/types` avisa de un export que TSX ve sin comentario de documentación, nombrándolo (`Ledger.add`, `Chart.range`).

TypeScript muestra un comentario de documentación hasta su primer encabezado. Las notas para quienes llaman desde Rust, como lo que toma prestado `&self` o por qué una función recibe `cx`, van bajo un encabezado, `# Rust` (o el `# Panics` de rustdoc, `# Examples`), y se quedan en la documentación de Rust:

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

Las props son los campos de la struct `Props` del componente y los eventos son las variantes de su enum `Event` (`onSelect`), ambos en camel case. El código Rust coloca el mismo componente con su constructor, un setter por prop y un método listener por evento: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. El contenido, los eventos y el estado propios de un componente de Rust se quedan en Rust; TSX pasa props y escucha eventos. Una prop de tipo incorrecto (`level={1.5}` para una prop `u32`) es una advertencia, como en un elemento integrado: la prop conserva su valor y el resto del componente se renderiza.

Una función o un miembro se ejecuta como indica su firma en Rust. Uno que no es `async` se ejecuta dentro de la llamada TSX y devuelve su valor (`Portfolio.total()` es un número, `ledger.balance` una propiedad): calcula y mantiene estado. Un `async fn` devuelve una Promise y se ejecuta como una tarea con los servicios de NSH (`fetch`, `timer`, diálogos). Una función de módulo que recibe `cx: &mut ModuleCx` llega a la plataforma en orden con la UI (un toast, la barra de estado), y lo mismo hace el método ref de un componente; su tipo de retorno decide lo que recibe TSX: uno que devuelve `()` da `void`, sin respuesta (TSX lo llama y sigue); uno que devuelve `Result<(), E>` da `Promise<void>`, que se rechaza con el mensaje del `Err` (la llamada se ejecuta con los cambios de la UI, después de que la llamada TSX haya retornado, por lo que la Promise lleva su error; una que nadie espera ni captura se registra como un [rechazo no controlado](./dev-server-and-debugging.md#logs)); uno que devuelve un valor da `Promise<T>`. Los argumentos y resultados se tipan a partir de la firma: números, strings, `Option`, `Vec`, tus structs `#[derive(JsObject)]` y enums `#[derive(PropEnum)]`, instancias de tus clases y funciones de TSX (`Callback<A, R>`, que Rust llama de inmediato dentro de una llamada, o más tarde con `post` y `call_async`; TS ve `(value: number) => void` para un `Callback<f64>`, y `#[args(balance)] listener: Callback<f64>` nombra el argumento, `(balance: number) => void`). Una función que empieza a escuchar se llama `on(event, listener)` y devuelve `Stop` (`Stop::new(|| …)`), que TSX recibe como una función que la detiene (`() => void`); se ejecuta una vez, cuando TSX la llama o cuando desaparece lo que llamó a `on` (un componente, o la ejecución del módulo bajo hot reload). El manejador de un evento recibe un solo objeto: el valor de una variante es su campo `value`, que `#[args(price)]` en la variante nombra (`onSelect({ price })`), y `#[args(open, reason)]` nombra los campos de una variante de varios. Un argumento de tipo incorrecto lanza un `TypeError` en la llamada, o rechaza la Promise de una que devuelve una Promise; un `Err` lanza (o rechaza) con su mensaje. El objeto de una clase es dueño de su valor de Rust: se libera cuando el objeto es recolectado, o de inmediato con `ledger.dispose()` (también `using ledger = new Ledger()`). Indica la entrada TSX para ejecutarla, `nsh run App.tsx` o `nsh package App.tsx --target …`: las ediciones de TSX son actualizaciones en caliente, las ediciones de Rust recompilan y reinician la app. El CLI empaqueta y compila el TSX por sí mismo, conociendo los exports de tu crate a partir de su descripción; los hosts de desarrollo y el runner headless de `nsh test` se compilan con tu crate y QuickJS.

`examples/rust-exports` en el repositorio es la referencia para exportar: una pequeña app TSX cuyo crate exporta un componente (props obligatorias, con valor por defecto y opcionales, un evento, hijos), un módulo (una función de cada tipo) y una clase (un constructor, métodos, un getter y un setter, un static, un miembro `async`, otra instancia como argumento, un callback al que Rust envía mensajes, `dispose()` y `using`), cada uno con un comentario de documentación breve, y pruebas, en Rust y en TypeScript (`App.test.tsx`), que recorren la app y comprueban lo que muestra cada uno.

`examples/gallery-rs` en el repositorio es una app Rust completa: cada demo es Rust, `nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` ejecuta sus pruebas en modo headless, y `cargo run -p gallery-native` la inicia en el backend de escritorio.

<a id="render-functions-and-the-apps-classes"></a>

### Funciones de render y las clases de la app

Un componente dibuja contenido de la app para los valores que tiene (una fila de sus datos, un bloque de código de un documento) con una función de render: una prop `Option<Renderer<T>>`, en TypeScript `(value: T) => JSX.Element`. El componente llama a `render(key, value)` donde va el contenido y obtiene una vista que estiliza y coloca como cualquier otra (dentro de un `text(..)`, una vista en línea). El contenido se conserva por clave mientras el valor sigue siendo igual, y se renderiza de nuevo cuando cambia. Un padre en Rust pasa un closure al setter de la prop (`quote().render_badge(|symbol| ..)`), que crea el `Renderer` a partir de él.

Los estilos de un componente son tipados; las clases de Tailwind de la app llegan a una de sus partes mediante una prop de clases y `.app_class(..)` en el elemento de esa parte. Se aplican después de los estilos propios del elemento, con el tema de la app, `dark:` y los estados, igual que lo hace `class` en un elemento.

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`TextView` en `nsh/base` está construido de esta manera: sus `renderCodeBlock`, `renderMath`, ... son funciones de render, y sus `classes` son las clases de la app por parte ([TextView](../elements/text-view.md)).
<a id="testing"></a>

## Pruebas

Las pruebas de una app Rust la ejecutan sin interfaz, en `cargo test` o en `nsh test`, con el mismo driver: sobre el motor real, sin ventana, con fotogramas de pantalla a 60 Hz, de modo que los temporizadores, las tareas y las animaciones se ejecutan como en pantalla. El driver inicia
la app, mantiene un modelo de las vistas que muestra y realiza pasos (`press`, `type_text`, `submit`, `scroll`, `wait_for`)
sobre vistas nombradas mediante selectores (un texto, una etiqueta de accesibilidad o un id de prueba; `text:`, `label:`, `id:`); un paso que
no puede realizarse falla e indica los textos en pantalla.

En `cargo test`, `nsh_testing::Headless` (las características por defecto de nsh-testing, sin QuickJS) ejecuta la raíz
(`app.screen()`: los textos en pantalla, los comandos que envió); `EngineConfig::new` es un motor del tamaño de un teléfono sin nada
más configurado. `nsh test` ejecuta pruebas de TypeScript ([Pruebas](./testing-and-trace.md)) en un runner sin interfaz construido con tus
crates, donde `open(".")` inicia la raíz de una app Rust:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

Una entrada TSX se construye con la característica `bundle` de `nsh-testing` como la construye `nsh run`, contra los conjuntos de UI que sirven sus hosts:
los de NSH y el `registry()` de cada crate, que `#[native_module]` genera:

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

`nsh_testing::compile_tsx` construye la entrada una sola vez para varias pruebas, y `nsh_testing::start` entrega los
lotes a una prueba que mantiene su propio modelo de la pantalla. `examples/rust-exports` prueba su entrada TSX de esta manera;
`examples/gallery-rs` prueba su raíz Rust en TypeScript, con un archivo de pruebas para casi cada demo.

<a id="theme"></a>

## Tema

El aspecto de una app es propio de la app: NSH proporciona las primitivas y los componentes base sin estilos de `nsh_base`, y
tu crate es la capa con estilos encima, la biblioteca de componentes propia de la app ([Tres capas](./architecture.md#three-layers)). Los componentes Rust toman sus colores, el radio de las esquinas y las fuentes de un tema, `theme()` desde
`nsh_base`, de modo que un solo archivo cambia el estilo de todos los componentes de la app. Cada color tiene un valor claro y uno oscuro;
cuando el sistema cambia de apariencia, un binding como `.bg(move || theme().primary)` cambia de color de forma nativa, sin
render.

El tema tiene los design tokens de [shadcn/ui](https://ui.shadcn.com/docs/theming), y su valor por defecto es el tema
`neutral` de shadcn, una paleta en blanco y negro con un radio de esquina de 10 pt. Para usar el tuyo, establece `"theme"` en `nsh.json`
con la ruta de un archivo de tema, relativa a `nsh.json`, o con el contenido del tema en línea:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Un archivo de tema es el `cssVars` de shadcn, el formato de los temas y los registry items de shadcn, por lo que un tema exportado desde
[los temas de shadcn](https://ui.shadcn.com/themes) o [tweakcn](https://tweakcn.com) funciona tal cual. `light` establece los
valores de la apariencia clara, `dark` los de la oscura y `theme` los de ambas:

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- Tu tema se aplica sobre el tema por defecto, así que solo enumeras lo que cambias. Un valor que `light` establece y `dark`
  omite se usa en ambas apariencias.
- Los valores se escriben como en CSS. Los colores son cualquier color CSS (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`),
  `color-mix(in oklab, var(--primary) 80%, white)`, u otro token de la misma apariencia, `var(--primary)` (con un
  valor de reserva: `var(--brand, #7c3aed)`). Las longitudes son `rem` (16 puntos) o `px` (puntos). Las fuentes son listas de familias tipográficas:
  se usa la primera familia que no sea genérica, y una primera familia genérica (`system-ui`, `sans-serif`) equivale a la
  fuente del sistema.
- **Tus propios tokens.** Cualquier otro nombre es un token de la app, igual que una variable en el `@theme` de Tailwind: el `"up"` anterior es
  `theme().color("up")` en Rust, `bg-up` / `text-up/70` en clases y `token("up")` en TSX
  ([Tokens de tema](./tailwind.md#theme-tokens)). Un número como `"radius-card": "14px"` es `theme().number("radius-card")`
  y `rounded-(--radius-card)`.
- El bundler comprueba el tema al compilar: un archivo ausente, un JSON no válido o un tema distinto de `cssVars` hace fallar la
  compilación con un error `nsh.json: theme: …`.

Los tokens, con sus valores claro y oscuro por defecto (`neutral` de shadcn):

| Token | `theme()` | Claro | Oscuro | Función |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | El fondo de la app y el texto sobre él |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Tarjetas y superficies agrupadas, y el texto sobre ellas |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popovers, menús y tooltips, y el texto sobre ellos |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | La acción principal (un botón primario) y el texto sobre ella |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Acciones secundarias y el texto sobre ellas |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | Superficies discretas; texto secundario: leyendas, etiquetas, marcadores de posición |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Un elemento con el cursor encima o resaltado, como un elemento de menú o una fila de lista, y su texto |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Acciones destructivas y errores |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Divisores y bordes |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | El borde de los campos de entrada |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Anillos de foco |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | los mismos | Las series de un gráfico |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | La superficie de una barra lateral, su acción principal, su elemento resaltado, los bordes y el anillo de foco |
| `radius` | `radius` | `0.625rem` (10 pt) | | El radio de las esquinas |
| `font-sans` | `font_sans` | la fuente del sistema | | La fuente de la app: todo texto que no establece una familia propia |
| `font-mono` | `font_mono` | la fuente monoespaciada del sistema | | La fuente monoespaciada: `font-mono`, el código en `TextView` |

<a id="several-crates"></a>

## Varios crates

El código Rust de una app puede dividirse en crates, cada uno importado mediante su propio especificador: `"rust"` toma una lista de rutas de
crates, y cada crate de la lista tiene su propia función `#[native_module]`.

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

Cada runner y cada host enlaza todos ellos, y `.nsh/types` declara cada especificador. Los crates comparten código mediante dependencias
de ruta de Cargo (`shared = { path = "../shared" }`): un crate de componentes de la empresa puede ser usado por varios crates
y figurar en varias apps, y solo los crates enumerados en `"rust"` se exportan a TSX. Cada crate enumerado tiene su propio nombre de
paquete y su propio especificador; `nsh` informa de uno repetido junto con las dos rutas que lo comparten. El
`"root"` de una app Rust es un componente del primer crate de la lista. Durante `nsh run` y `nsh dev`, un cambio en cualquiera de ellos, o en un
crate del que dependan por ruta, reconstruye la app y la reinicia.

<a id="browser-apis-on-the-web"></a>

## APIs del navegador en la web

En la web, un crate puede llamar a las APIs del navegador (un WebSocket, `IndexedDB`, …) mediante wasm-bindgen y `web-sys`;
`nsh` construye el código de enlace que necesitan junto con el runtime. Consulta [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## Véase también

- [Estructura del proyecto](./project-structure.md): todas las claves de `nsh.json`.
- [Web](./web.md#apps-with-rust-components): apps Rust en el navegador.
- [Redes](./networking.md#from-rust-components): `fetch` desde Rust.
- [CLI](./cli.md#nsh-init): `nsh init --template rust` y `--template mixed`.
