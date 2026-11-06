---
title: "Guías de programación"
description: "Arquitectura y convenciones de código para aplicaciones y bibliotecas de componentes de Native Shell fáciles de mantener, en Rust y TSX."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---


# Guías de programación

Esta guía describe la arquitectura de aplicación y los patrones de código que han demostrado ser duraderos en las apps de Native Shell. Está escrita tanto para ingenieros como para agentes de programación: desarrolladores de apps NSH (módulos TSX, componentes Rust, apps nativas que embeben NSH) y autores de bibliotecas de componentes construidas sobre `nsh/base`. Lee primero las Guías de diseño: la estructura del código debe preservar la intención del producto, no reemplazarla.

Esta es una guía normativa. **Must** (obligatorio) marca restricciones de ciclo de vida, de corrección o del ecosistema; **should** (recomendado) es la arquitectura por defecto y requiere una razón concreta para apartarse de ella. El código fuente actual, las páginas de referencia y las declaraciones de `.nsh/types` siguen siendo la autoridad para las firmas exactas.

<a id="make-the-common-path-inexpensive"></a>

## Haz barato el camino común

**Principio de diseño: elige los tipos del framework y la propiedad de modo que el uso ordinario de los componentes sea barato por defecto.** Los desarrolladores deben poder construir y reutilizar UI sin añadir una caché en cada punto de llamada. Los componentes que se ejecutan una sola vez y las [signals](./reactivity.md) que se leen donde se usan son ejemplos de ello: un componente construye su parte del árbol una sola vez y, después, solo se vuelven a ejecutar los bindings que leen una signal modificada, de modo que el camino común evita trabajo repetido. El grafo reactivo, el renderizador, el layout y las listas son nativos, y un turno del código de la app se convierte en un lote de operaciones nativas. Aun así, los costes pequeños se multiplican a través de elementos y actualizaciones, sobre todo en TSX, cuyo propio código se ejecuta en un intérprete; mide las rutas críticas excepcionales antes de añadir cachés ([Rendimiento](./performance.md)). Ninguna de las dos opciones promete coste cero. Las [reglas de propiedad del estado](#state-ownership) y las secciones posteriores sobre renderizado explican la mecánica.

<a id="architecture-at-a-glance"></a>

## La arquitectura de un vistazo

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

Las dependencias apuntan hacia abajo. Las capas superiores poseen el significado del dominio y la orquestación; las capas inferiores poseen la presentación o el comportamiento reutilizables. No hagas que un componente reutilizable dependa de una página de la app, ni que una biblioteca de componentes dependa del tema de una sola app ([Tres capas](./architecture.md#three-layers)).

Usa estos límites:

- **app shell:** la entrada (`App.tsx`, o `nsh.json` `"root"`) compone la raíz y las pilas de navegación, manteniendo fuera la lógica de las páginas;
- **página:** un `NavPage` con su contenido, sus diálogos y el trabajo que inicia;
- **componente de la app:** un patrón repetido que conoce el dominio;
- **biblioteca de componentes:** UI con estilo y de propósito general, la propia de la app o la de la comunidad, construida sobre `nsh/base`;
- **`nsh/base`:** comportamiento reutilizable sin presentación de producto: navegación, diálogos, popovers, menús, sheets, un objetivo de pulsación;
- **`nsh`:** las primitivas, los estilos, el layout, la reactividad y el entorno.

<a id="lay-out-an-apps-files"></a>

### Organiza los archivos de una app

Los archivos de una app siguen las convenciones de NSH, así que no hay nada que configurar: `App.tsx` es la entrada y `nsh.json` está a su lado, y ambos se encuentran por convención.

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` contiene un archivo por cada `NavPage`. Una página crece en más archivos solo cuando lo necesita.
- `components/` contiene los componentes reutilizables de la app, los que usan varias páginas.
- `store.ts` contiene el estado de la app: sus signals y las funciones que las modifican. Las páginas leen las signals y llaman a las funciones.
- Las pruebas son archivos `*.test.tsx` junto a lo que prueban (`App.test.tsx`, `pages/Inbox.test.tsx`).
- `Cargo.toml` y `src/lib.rs` son el crate propio de la app, con sus componentes Rust (`nsh.json` `"rust": "."`); su `#[native_module]` en `src/lib.rs` nombra lo que TSX importa. Una app escrita solo en Rust es el mismo proyecto Cargo, con su componente raíz en `src/lib.rs` ([Estructura del proyecto](./project-structure.md)).

El app shell compone las páginas pero contiene poca lógica de página. Las páginas leen las signals del store y llaman a sus funciones; nunca escriben el estado de otra página. Mantén privadas las signals del store y exporta lo que las lee y las modifica, de modo que el estado mutable quede detrás de sus funciones públicas:

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

Una página puede contener el workspace y pasar su id a la búsqueda; la búsqueda no necesita la colección completa del workspace ni sus signals privadas. Una forma sencilla de dependencias acíclicas es:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

Las páginas pueden depender del store y de los componentes, pero no del shell ni de las partes privadas de otra página. Si una página debe cambiar lo que muestra otra, hazlo a través del store. Estos límites permiten que distintos ingenieros o agentes de IA trabajen en páginas separadas en paralelo, con menos conflictos de archivos y menos acoplamiento de estado compartido; el store sigue requiriendo coordinación.

<a id="bootstrap-and-root-ownership"></a>

## Arranque y propiedad de la raíz

Monta la app una sola vez y dale a la raíz toda la superficie: una entrada TSX llama a `mount(App)`, una app Rust nombra su componente raíz en `nsh.json` (`"root": "App"`). La raíz llena la superficie con `flex: 1` y un fondo tomado del tema:

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

La raíz coordina lo que pertenece a toda la superficie: la pila de navegación, los diálogos, popovers, menús, sheets y tooltips que se muestran por encima de todo lo demás, y el área segura. No montes una segunda raíz para cada página dentro de una misma superficie. Una superficie es un motor: cada `NshAppView`, `NshView` o `AppView` que embebe una app nativa ejecuta su propia VM, su propio estado de módulo y su propio grafo reactivo, de modo que varias superficies en una misma app anfitriona nunca comparten estado por accidente.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## Comprende qué se ejecuta una vez y qué se vuelve a ejecutar

NSH es estado retenido con construcción declarativa, sobre el modelo de Solid ([Reactividad](./reactivity.md)). Una signal sobrevive entre actualizaciones; el cuerpo de un componente describe su parte del árbol una sola vez, cuando se crea. Mantén esa distinción explícita:

| Lo que escribes | Se ejecuta | Se vuelve a ejecutar cuando |
| --- | --- | --- |
| El cuerpo de un componente | Una vez, cuando se crea | Nunca |
| Un binding: un closure (Rust) o una expresión que llama a algo o lee una propiedad (TSX) en el lugar donde va un valor | Una vez | Cambia una signal que leyó; solo se actualiza esa prop o ese hijo |
| `computed(fn)` | Cuando se crea | Cambia una signal que leyó |
| `effect(fn)` | Después de que existan los elementos de la pasada | Cambia una signal que leyó |
| Una fila de `each` / `<Each>` | Cuando aparece por primera vez su clave | Nunca; cambian sus signals de ítem e índice |
| Una celda de `virtual_list` / `<List>` | Una vez por celda | Nunca; a la celda se le dan otras filas |

- el componente que se ejecuta es el **owner** (propietario): los efectos, valores computados, tareas, temporizadores, atajos de teclado y limpiezas creados mientras se ejecuta le pertenecen y se liberan con él;
- el **contexto** (`provide_context` / `use_context`, `context()` y `<Ctx.Provider>`) da un valor a un subárbol sin implicar que los elementos que lo leen sean sus propietarios;
- el **`Scope`** de un componente Rust (`cx`) emite sus eventos y lee los insets que se le dan;
- las **refs** (`element_ref()`, `ref`) nombran un elemento anfitrión para llamadas imperativas (`focus()`, `scroll_to()`, `measure()`);
- el layout y la medición son fases nativas posteriores; usa `onLayout` y `measure()` solo cuando la geometría resuelta sea realmente necesaria.

Nunca leas un contexto en un manejador de eventos ni en un temporizador, donde no hay un componente desde el cual buscarlo: léelo en el cuerpo y conserva lo que te dio. Retén handles tipados (signals, resources, refs, ids de dominio), que son `Copy` en Rust y dejan de hacer algo una vez que su propietario desaparece.

<a id="choose-the-right-unit"></a>

## Elige la unidad adecuada

<a id="use-a-plain-function-for-value-like-elements"></a>

### Usa una función simple para elementos de tipo valor

**Usa por defecto una función simple para piezas de UI ligeras y reutilizables.** El llamador proporciona las props y los manejadores actuales, la función devuelve elementos y de ella no queda nada salvo los bindings que creó. Sus argumentos son sus props; la etiqueta mostrada, el valor y los callbacks provienen del estado actual del llamador. Aun así se ejecuta una sola vez, como cualquier componente: lo que cambia después son sus bindings.

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### Usa un componente para comportamiento retenido

Usa un `#[component]` (o un componente TSX que cree signals) cuando una pieza de UI posea estado persistente o un ciclo de vida independiente: signals, efectos, trabajo asíncrono, temporizadores, atajos de teclado. Crea ese estado en el cuerpo del componente, una sola vez, nunca dentro de un binding.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

Un `#[component]` tiene props tipadas (`#[derive(Props)]`) y eventos (`#[derive(Event)]`); TSX lo importa con declaraciones generadas a partir de ellos. El estado retenido que TSX usa con `new` (un libro mayor, un parser, una sesión) es un `#[class]`, y las funciones son un `#[module]` ([Construir con Rust](./rust.md#extending-a-rust-app-with-tsx)). Escribe en Rust las partes que más usa una app, las bibliotecas de componentes y la lógica exigente, ya que es código nativo de principio a fin; reserva TSX para lo que cambia a menudo o se entrega en tiempo de ejecución.

No conviertas cada fragmento visual en un componente. Los límites de componente tienen costes de ciclo de vida y de coordinación; úsalos donde la identidad retenida importe.

<a id="elements-views-and-behavior-systems-are-different"></a>

### Los elementos, las vistas y los sistemas de comportamiento son distintos

No fuerces todos los componentes a una única plantilla. El ecosistema contiene:

- elementos semánticos como `Button`, `Switch` y `MenuItem`;
- raíces de comportamiento compuesto como `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet` y `NavStack`;
- sistemas con estado como `Input`, `List`, `TextView` y el estado de una pila de navegación;
- infraestructura como los overlays y su colocación, la virtualización, el scroll, las áreas seguras, el teclado y la animación.

Un elemento puede ser internamente complejo y aun así comportarse como un valor para su llamador. Un sistema con estado puede exponer funciones de renderizado para que las apps controlen la presentación sin reimplementar el comportamiento. Elige la frontera pública a partir del comportamiento, no a partir de cuántas vistas aparecen en su salida.

<a id="state-ownership"></a>

## Propiedad del estado

<a id="own-persistent-ui-text-with-103"></a>

### Posee el texto de UI persistente con `SharedString`

**En Rust, se debe preferir `SharedString` para el texto de UI retenido entre actualizaciones o closures de callbacks**, incluidas las etiquetas, los títulos y los placeholders de los componentes: las props lo aceptan (`Prop<SharedString>`), y clonarlo en un binding no copia el texto. Para un búfer de edición mutable o texto que se ensambla con formato, usa `String` y conviértelo cuando el resultado esté listo; para acceso temporal de solo lectura durante una llamada, usa `&str`. En TSX, las cadenas son valores propios de la app; mantén el texto calculado a partir del estado en un `computed` o en un closure en lugar de reconstruirlo en varios lugares.

Para el texto inmutable de una respuesta que la UI retendrá, conserva el valor recibido intacto y coloca el texto de presentación derivado o formateado en un valor de dominio separado, en lugar de reescribir la respuesta.

Pon cada estado en el propietario más estrecho que pueda mantenerlo correcto:

- el estado de dominio pertenece al store (`store.ts`) o al crate de la app;
- el estado transitorio de la vista pertenece al componente que lo renderiza, como una signal;
- el estado de comportamiento reutilizable pertenece al componente diseñado para ello (un `Menu` o `Popover` sin `open` mantiene el suyo propio);
- el estado que comparte un subárbol es una signal proporcionada mediante [contexto](./reactivity.md#context);
- lo que sobrevive a una ejecución pertenece al [almacenamiento](../modules/nsh.md#storage) o a un servidor.

Prefiere valores controlados para la selección y los toggles ordinarios: pasa el valor actual al componente, recibe un cambio solicitado, actualiza al propietario y los bindings siguen. Un callback informa de una intención; no debe crear una segunda fuente de verdad oculta.

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

No hay nada que notificar: escribir una signal actualiza exactamente los bindings que la leen. Un componente Rust emite un evento semántico que su propietario debe manejar con `cx.emit(..)`; un efecto sigue a una signal mientras viva su propietario. Escribe varios campos que forman una misma invariante en un único [`batch`](./reactivity.md#batch), para que los efectos y los valores computados los vean a la vez.

Un componente controlado propio de la app sigue el mismo contrato. Un stepper de cantidad, un control de dominio escrito una sola vez en Rust y colocado desde Rust y TSX:

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

El mismo contrato en TSX, un componente en `components/`:

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### Mantén acotados los vínculos de propiedad y las suscripciones

Un componente es dueño de lo que crea, y todo lo que creó desaparece con él: cuando se oculta su rama `<If>`, se elimina su fila o se quita su página de la pila. En Rust, las tareas, los temporizadores y los intervalos (`spawn`, `set_timeout`, `set_interval`) y los atajos de teclado (`on_key`) terminan junto con el propietario bajo el que se crearon; en TSX, registra la detención con [`cleanup`](./reactivity.md#cleanup) o devuélvela desde el efecto. Escuchar es `on(event, listener)` (`host.on(name, listener)`, `BackHandler.on("press", listener)`), que devuelve una función que lo detiene (`() => void`, desde Rust un `Stop`), y lo que se registra mientras un componente se renderiza desaparece con el componente, igual que los atajos de `keymap.bind`.

Cuando algo sigue ejecutándose de forma inesperada, inspecciona primero los efectos y los valores calculados creados fuera de un componente (en un manejador de eventos o en el callback de un temporizador no tienen propietario y viven para siempre), los listeners registrados sin su función de detención y el trabajo iniciado desde un store que ningún componente posee. Una carga `resource` descartada se aborta (`info.signal` en TSX); no mantiene vivo a su componente. Estos son lugares habituales por donde empezar, no una lista exhaustiva.

No escribas un signal solo porque se haya leído o derivado un valor. Evita las escrituras incondicionales desde un binding o un efecto que lee el mismo signal: se vuelve a ejecutar a sí mismo hasta que NSH lo detiene con un error. Un valor calculado a partir de otro estado es un `computed`, no un efecto que escribe un segundo signal.

<a id="avoid-state-feedback-loops"></a>

### Evita los bucles de retroalimentación de estado

Los campos de texto, la selección, los filtros y los popups controlados suelen tener dos vías: un propietario externo actualiza el valor y la interacción del usuario solicita un valor nuevo. No devuelvas un valor suministrado por el propietario a través del callback del usuario durante la sincronización. Lee el valor actual del propietario sin rastreo al gestionar la acción del usuario (`props.value.get_untracked()` en Rust, como se indicó antes; un manejador de eventos de TSX ya no rastrea) y compáralo con el siguiente, de modo que cada cambio lógico se notifique una sola vez. Haz que los callbacks sean seguros frente a la reentrada cuando un callback pueda cerrar, reemplazar o actualizar de forma síncrona el componente que lo invocó.

<a id="stable-identity"></a>

## Identidad estable

Una key forma parte del comportamiento. Da a una fila, una página o un control repetido una identidad estable, y decide cuál conserva su estado, su foco y sus mediciones cuando cambian los datos.

- Usa ids de dominio estables para filas, pestañas, páginas y controles repetidos: `each(projects, |p| p.id, ..)`, `<Each of={projects()} key={(p) => p.id}>`, el `keyExtractor` de una lista.
- Antepón a los ids de prueba el espacio de nombres del objeto que los posee cuando el mismo control se repite (`delete-${project.id}`).
- No derives nunca la identidad de una etiqueta traducida ni de un índice de lista mutable cuando se pueden insertar o reordenar elementos.
- No generes una key o un id aleatorio nuevo durante el renderizado.

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

Una key distinta significa una identidad de UI distinta. Trata ese reinicio como algo deliberado.

La misma regla se aplica a las rutas de navegación, las keys de listas, las keys de almacenamiento y los ids de prueba. Una ruta que permanece en `setRoutes` conserva su página y su estado; si dos comportamientos retenidos de forma independiente comparten una key, pueden sobrescribirse mutuamente el estado; si un comportamiento cambia de key en cada actualización, nunca acumula estado.

<a id="rendering-and-composition"></a>

## Renderizado y composición

Mantén el cuerpo de un componente declarativo: lee el estado actual, deriva los valores de presentación y compón elementos. Mueve las operaciones de dominio, el análisis sintáctico y las mutaciones no triviales a funciones con nombre del store o del crate de la app.

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

Extrae un helper cuando dé nombre a una región con significado y reduzca la cantidad de estado que el lector debe tener presente a la vez. Extrae un componente nuevo cuando la región tenga su propio contrato reutilizable o un ciclo de vida retenido, no simplemente porque una cadena de builders o un bloque de JSX sea larga.

Usa de forma coherente los métodos de estilo tipados y los builders de los componentes en Rust, y clases en TSX. Prefiere `.when(..)` / `.when_some(..)` (Rust) y `classList` (TSX) para refinamientos condicionales pequeños; usa `when` / `<If>` cuando las ramas representen interfaces sustancialmente distintas, ya que un ternario dentro de un closure vuelve a construir su rama cada vez que cambia cualquier cosa que lee.

Compón a partir del componente semántico estándar antes de construir una superficie personalizada. No reproduzcas un menú, un popover, una hoja o un diálogo con vistas genéricas solo para igualar una captura de pantalla: `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Tooltip` y `Dialog` de `nsh/base` conservan la colocación, la transferencia de foco, la navegación con teclado, la selección, el estado deshabilitado, el cierre con Escape y con atrás, y el contrato de accesibilidad. Si el componente estándar no puede expresar un patrón recurrente y válido, mejora su API explícita en lugar de aplicar estilos a descendientes arbitrarios en cada punto de uso.

Las funciones de renderizado suministradas por el código de la app deben carecer de efectos secundarios. La fila de una lista, el `renderCodeBlock` de un `TextView` o los elementos de un menú pueden ejecutarse siempre que su propietario necesite una celda, una parte o una apertura. No deben realizar una operación de negocio, añadir datos ni iniciar una suscripción sin límite.

<a id="behavior-and-presentation-boundary"></a>

## Frontera entre comportamiento y presentación

La regla duradera de Base es:

> Base es dueña del comportamiento reutilizable y de la estructura necesaria para implementarlo. La capa de presentación es dueña del lenguaje visual del producto.

"Sin estilos" no significa "una única vista vacía". La colocación de overlays, la navegación con teclado, la edición, la virtualización, la navegación hacia atrás, el cierre y las áreas seguras requieren estructura y estado internos. Trasladar ese trabajo a cada llamador no crearía flexibilidad; duplicaría un comportamiento frágil.

A la inversa, Base no debe elegir colores de marca, tipografía, densidad, iconos finales, variantes de componentes, cadenas de texto ni la composición de la aplicación. Expón la presentación mediante `class` / `style` en la parte principal, `<part>Class` / `<part>Style` para cada una de las demás partes, estilos de estado tipados (`active`, `hover`, `focus`, `selected`, `checked`, `disabled`), slots con nombre (`trigger`, `header`, `footer`) y funciones de renderizado. No inspecciones descendientes arbitrarios para descubrir títulos, descripciones o botones de cierre: haz explícitas las partes semánticas y recibe cada etiqueta como una prop o como un hijo.

<a id="theme-and-styling"></a>

## Tema y estilos

Lee los valores semánticos del tema y aplica el layout con los métodos de estilo tipados en Rust y con clases de Tailwind en TSX ([Tailwind](./tailwind.md), [tokens del tema](./tailwind.md#theme-tokens)):

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

Reglas:

- no codifiques de forma fija colores de producto, radios de esquina, espaciados ni la geometría de los controles;
- el código de la app no debe introducir valores hex sin procesar, `rgb` / `rgba` ni `hsla`; lee un color semántico de `theme()` o de una clase de token (`bg-primary`), o añade el rol que falta al archivo de tema de la app;
- el layout de la app debe usar las escalas de espaciado y de tipografía (`p-2`, `gap-3`, `w-64`, `text-sm`; `.p_2()`, `.gap_3()`, `.w_64()`, `.text_sm()`) en lugar de valores arbitrarios (`p-[13px]`, `px(13.0)`);
- las clases significan exactamente lo que significan en Tailwind CSS v4, y los valores de estilo lo que les asigna la [referencia de estilos](../modules/style-reference.md) (los de CSS, en formas nativas: los números son puntos); una advertencia `unknown class` es un hallazgo que se debe corregir;
- usa tokens semánticos para el significado, no para la posición en la paleta;
- mantén la geometría independiente del estado en la cadena de builders ordinaria o en la cadena de clases;
- usa `active:`, `hover:` y `focus:` (`.active(..)`, `.hover(..)`, `.focus(..)`) para los estados de interacción en tiempo de ejecución; se aplican de forma nativa, sin ida y vuelta al código de la app;
- usa los estilos de estado semánticos de un componente (`selected:`, `checked:`, `disabled:`) para la apariencia de marcado, seleccionado, pulsado o deshabilitado;
- mantén la propiedad del popup en un estado explícito (`open` con `onOpenChange`) para que su disparador pueda mostrar la apariencia de abierto o pulsado hasta que se cierre;
- mantén pocas y significativas las variantes de un componente, en lugar de añadir una variante por cada punto de uso;
- vincula el estilo primario a la confirmación predeterminada real del área de decisión y a su acción de la tecla Return; no lo derives del número de acciones, de su frecuencia ni de su posición en la barra de herramientas;
- mantén semánticas y escasas las variantes de badge y de alert. Los metadatos ordinarios permanecen neutros; no asignes un color distinto a cada caso de un enum o a cada sección solo porque exista una variante.

La precedencia efectiva es el estilo propio del elemento, luego los estilos de estado, ganando los estados posteriores, y `disabled` sobre todos ellos. Las capas posteriores solo reemplazan los campos que establecen.

Prefiere los tokens semánticos del tema para la nueva presentación propia de la app. Cada nombre del archivo de tema de la app es un token, igual que lo es una variable de `@theme` de Tailwind (`"up": "#16a34a"` da `text-up`, `bg-up/30`, `token("up")` en TSX y `theme().color("up")` en Rust), y el tema tiene valores claros y oscuros, de modo que un token sigue la apariencia sin ninguna clase `dark:`. Nombra los tokens según roles, no según componentes, para que no se conviertan en el punto de extensión de cada widget.

Cambia el tema mediante el archivo de tema de la app (`nsh.json` `"theme"`), o deja que la app que lo integra aporte el suyo: las clases que nombran tokens y los bindings de Rust que leen `theme()` se vuelven a estilizar de forma nativa cada vez que cambia, sin ejecutar JavaScript. El código que copia el valor de un token en un signal propio deja de seguirlo.

Un anillo de foco exterior necesita espacio físico. Un ancestro con `overflow: hidden` (`overflow-hidden`) lo recorta. Prefiere layouts que dejen espacio; si un producto debe recortar de forma intensa, dibuja el estado de foco dentro del control en lugar de ocultar en silencio todo el foco del teclado.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### El tamaño de texto del usuario es el zoom de la app

El texto sigue el tamaño de texto del usuario (Dynamic Type, la escala de fuente de Android, los ajustes de los escritorios): `fontScale()` en TSX, `font_scale()` en Rust, ambos reactivos. La escala tipográfica (`text-sm`, `text-base`: 16 puntos, el tamaño del cuerpo de texto) fija la referencia, y el ajuste del usuario la escala. Esto sigue deliberadamente la parte útil del modelo de Tailwind: pasos con nombre de tipografía, espaciado y tamaño en lugar de constantes de puntos inconexas.

Deja que los contenedores de texto crezcan con su texto: dales alturas mínimas y relleno en lugar de alturas fijas. Un componente personalizado que combine texto escalado con geometría fija a su alrededor debe documentar por qué esa parte no debe crecer.

Trata cada valor de puntos arbitrario y cada constructor de color sin procesar en la UI de la app como un hallazgo de revisión. Acéptalo solo para una frontera física o de plataforma documentada, geometría medida en tiempo de ejecución, color de imagen raster o de datos, o la propia definición del tema. La comodidad y el igualar una captura de pantalla no son excepciones válidas.

Todo lo que se almacene en caché a partir del layout resuelto debe incluir la escala de fuente en su clave de invalidación, directamente o mediante una revisión que cambie con ella: las alturas de fila que se comunicaron a una lista, las mediciones de texto, la geometría de los popups, los tamaños de icono derivados del texto y las métricas de canvas personalizadas.
<a id="events-commands-and-focus"></a>

## Eventos, comandos y foco

Usa presses para la activación: `onPress`, `onLongPress`, `onPressDown` y `onPressUp` significan lo mismo con un dedo, un lápiz, un ratón o el teclado. Usa manejadores táctiles y gestos solo para lo que sigue al dedo (un pan, un drag). Usa atajos de teclado (`keymap.bind`, `on_key`) y elementos de menú para los comandos que deban admitir combinaciones de teclas, menús o despacho desde múltiples entradas. Mantén los manejadores cerca de la página que es propietaria del comando.

Modela cada comando lógico una sola vez. Un `Button`, un elemento de `Menu`, un elemento de `ContextMenu`, un elemento del menú de la aplicación de `nsh/desktop` y un atajo de teclado deben llamar a la misma función del store en lugar de copiar cinco mutaciones. Deriva su etiqueta, icono, atajo y estado de deshabilitado de una única política de comando cuando sea práctico (`key_label("mod+s")` escribe un atajo al modo de cada plataforma), de modo que los puntos de entrada no puedan discrepar. El menú es responsable de la navegación y del cierre; la página sigue siendo responsable de decidir si el comando está permitido y de qué hace.

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

Conserva los roles semánticos al elegir el elemento. Usa `Button` para los comandos incluso cuando el tratamiento deseado sea discreto; dale un estilo discreto en lugar de sustituirlo por un enlace. Las apps de NSH reservan el rol `link` para destinos que se abren fuera de la app, como una URL o una dirección de correo electrónico; usa la navegación para un destino dentro de la app y `Button` para un comando.

Detén la propagación (`stopPropagation()` en un evento táctil) solo cuando una interacción anidada deba impedir que su padre procese el mismo toque. Las detenciones de propagación indiscriminadas rompen el desplazamiento, los presses y los gestos de maneras difíciles de diagnosticar.

**El hilo principal nunca espera al código de la app.** Cuando el sistema necesita una respuesta en el acto (si esta página puede cerrarse con pop, si esta sheet o popover puede cerrarse, si este texto puede cambiar), NSH responde de forma nativa a partir de props montadas de antemano, y un evento informa a la app después. Por tanto, una decisión es una prop, establecida en cuanto se conoce, no un callback que devuelve true o false: `popOnBack={!dirty()}` con `onBackPress` para confirmar ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)), `closeOnEscape` y `closeOnBackdropPress` con `onCancel` para enterarse del intento, `maxLength` en un input, `disabled` en un botón.

El `shortcut` (`nsh/desktop`) de un elemento de menú vincula su tecla mientras el menú esté establecido, y el menú lo muestra al estilo de la plataforma; un vínculo `keymap` de la misma combinación de teclas tiene prioridad sobre él. Asigna a cada combinación de teclas un único propietario, y vuelve a establecer el menú de la aplicación cuando cambien sus elementos o atajos.

Haz explícita la propiedad del foco:

- `Button`, `Switch` y los elementos de menú son paradas de foco de teclado en los escritorios y en la web; construye los controles sobre ellos en lugar de sobre vistas simples;
- mueve el foco con el `focus()` de una ref desde un evento o un efecto que siga a un cambio de estado, y mueve el del lector de pantalla con `set_accessibility_focus()` (Rust) o `setAccessibilityFocus` desde `nsh` (TSX);
- renderiza un estado `focus:` visible;
- no solicites el foco de forma incondicional durante el renderizado.

Los widgets compuestos deben implementar el modelo de navegación completo (movimiento con flechas, Home / End o movimiento por páginas donde corresponda, confirmación, cancelación y comportamiento de Tab) en lugar de unos pocos atajos aislados.

Los overlays se cierran desde arriba: Escape y el botón de retroceso de Android van al overlay superior que escucha (`onCancel`). Gestiona las secuencias rápidas de cierre y apertura sin actuar sobre una superficie intermedia que ya se está cerrando.

<a id="async-work-and-side-effects"></a>

## Trabajo asíncrono y efectos secundarios

Inicia el trabajo asíncrono desde un evento, un efecto o un [`resource`](./reactivity.md#resource), no como un efecto secundario incondicional del cuerpo de un componente. Un efecto solo rastrea lo que lee de forma síncrona: lee primero los signals y después inicia el trabajo. Cuando el trabajo termine, actualiza el estado mediante signals, asume que el componente puede haber desaparecido y escribe juntos los cambios coherentes.

Mantén el trabajo recurrente bajo un propietario para que su desaparición lo cancele: las tareas y los temporizadores de Rust terminan con su propietario, los temporizadores de TSX se detienen en `cleanup`. Una tarea de un solo uso que deba terminar de forma independiente puede iniciarse desde el store, pero renuncia a esa cancelación. Gestiona los errores y las solicitudes fallidas de forma explícita.

Representa las operaciones asíncronas con estados explícitos: el `state()` de un resource es `unresolved`, `pending`, `ready`, `refreshing` o `errored`. Conserva los datos anteriores utilizables durante la actualización: un resource mantiene su valor mientras se carga de nuevo. Evita los envíos destructivos duplicados y muestra en la UI los errores recuperables; no confíes en los logs como retroalimentación para el usuario.

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

Saca del camino de interacción el análisis sintáctico o el cálculo costosos de los manejadores TSX: llévalos a un `computed` o a Rust. Los resultados pueden llegar después de que la consulta, la página o la selección hayan cambiado: un resource descarta las cargas superadas, y el trabajo propio adjunta una revisión o una identidad y rechaza los resultados obsoletos en lugar de aplicarlos a un estado nuevo.

<a id="layout-measurement-and-scrolling"></a>

## Layout, medición y desplazamiento

Una vista dispone a sus hijos en una columna, y los hijos se estiran a lo ancho por defecto; `class="flex"` (`.flex_row()`) es una fila, como en CSS. Una fila de controles quiere a sus hijos centrados (`items-center`), que lo expresa así. Una fila de columnas de altura completa mantiene el estiramiento por defecto, de modo que una columna llena la altura de la fila y su encabezado queda arriba:

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

La mayor parte de la UI debe usar el layout en lugar de medirse a sí misma ([Layout](./layout.md)). La medición (`onLayout`, `measure()`) es una herramienta de comportamiento profundo para overlays, virtualización, editores, gráficos y componentes similares cuya corrección depende de la geometría resuelta.

- Coloca la medición y la geometría en la capa que es propietaria del comportamiento.
- Observa el layout solo cuando el layout ordinario no pueda expresar la relación.
- Nunca escribas estado de la app no relacionado en cada evento de layout.
- Trata los datos medidos como acotados a una revisión; pueden quedar obsoletos tras cambios de tamaño de texto, ancho, tema o contenido.
- Deja que los overlays de `nsh/base` coloquen los popups: su colocación, volteo y márgenes de área segura siguen una única política.

Para los invariantes de alineación, prefiere la construcción a la corrección: las regiones hermanas deben consumir el mismo token de espaciado o el mismo inset compartido en lugar de repetir literales iguales. Añade comprobaciones de geometría o capturas de pantalla en una plataforma real (`nsh test --target`) para los bordes, columnas y espacios repetidos críticos. Prueba más que la ventana por defecto: un tamaño de texto grande y el escalado de pantalla pueden convertir coordenadas fraccionarias en un desvío de un píxel incluso cuando la captura por defecto parece alineada.

Mide el resultado resuelto al revisar la precisión, pero no codifiques una corrección medida como un valor arbitrario. Rastrea la discrepancia hasta el padding duplicado, los insets anidados, la propiedad del borde, las métricas de la fuente o el redondeo, y luego corrige al propietario estructural.

Cada región desplazable debe tener un único propietario. Evita el desplazamiento anidado accidental en el mismo eje. Da al scroll view el elemento que es propietario de toda la página, panel o lista, de modo que su indicador se resuelva respecto al borde de la región, y coloca el inset del contenido dentro de él (`contentClass` / `contentStyle`) en lugar de envolver el scroll view en un contenedor con padding. Un indicador que flota entre el contenido y el límite de la página suele revelar un propietario de scroll equivocado o un padding en la capa equivocada. Mantente fuera del área segura y del teclado con `env(safe-area-inset-*)` y `env(keyboard-inset-height)` en padding y margin (lee los valores con sus accesores), que siguen la rotación y el teclado de forma nativa.

<a id="lists-tables-and-large-data"></a>

## Listas, tablas y datos grandes

Usa [`List`](./lists.md) (`virtual_list` en Rust) cuando los datos puedan crecer más allá de una colección pequeña y acotada. Mantén la identidad de las filas separada de la posición visible y evita copiar el conjunto de datos completo en cada actualización. Deja que la lista sea propietaria del reciclaje, de la coordinación del scroll y del rango visible, mientras las funciones de fila son propietarias de la presentación de la fila.

Separa:

- los datos de origen y los ids de dominio;
- el estado de filtrado y ordenación;
- el estado de selección;
- el estado de scroll;
- el renderizado de las filas.

Esto mantiene las actualizaciones locales e impide que el árbol de vistas se convierta en el modelo de datos.

La virtualización es un contrato de comportamiento, no solo un interruptor de rendimiento. Una función de fila se ejecuta una vez por celda, y las celdas se reutilizan para otras filas:

- **debes mantener el estado por elemento en datos indexados por id**, no en un signal creado dentro de la fila, que viaja con la celda al siguiente elemento;
- **debes leer el elemento donde se usa**, en los bindings: un valor copiado al principio de la función de fila pertenece a la primera fila que mostró la celda;
- actualiza de forma inmutable en TSX (un nuevo array, los elementos sin cambios reutilizados, un elemento modificado como un objeto nuevo), y da un `estimatedItemSize` cercano a la fila típica;
- el desplazamiento a un elemento (`scrollToIndex`) funciona en coordenadas de datos incluso cuando la mayoría de las filas no existen.

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## Diseño de la API pública

Para los componentes reutilizables:

- las props establecen valores por defecto válidos: `#[prop(default)]` o `#[prop(default = …)]` en Rust, `??` donde se lee la prop en TSX;
- cada prop, evento y export tiene un comentario de documentación; en Rust se convierte en la declaración de TypeScript que ve TSX;
- los callbacks describen los cambios solicitados e incluyen detalles del puntero solo cuando son significativos;
- son preferibles las partes, slots y funciones de render explícitos a inspeccionar descendientes arbitrarios;
- añadir comportamiento reutilizable no debe forzar una decisión visual a nivel de producto.

Las apps se entregan a las apps anfitrionas como paquetes firmados y puede que nunca se vuelvan a compilar: cada versión posterior de NSH las ejecuta tal cual. Aplica la misma disciplina a lo que una app o una biblioteca de componentes expone a otros (las props y eventos de sus componentes, los exports de su crate, las funciones que reciben los componentes y módulos nativos de una app anfitriona):

- las entradas solo ganan miembros opcionales; los tipos solo se amplían; los valores por defecto y el comportamiento permanecen (el comportamiento nuevo es opt-in);
- una función cuyos parámetros puedan crecer recibe sus opciones como un único objeto (`scrollTo({ x, y, animated })`), nunca un parámetro posicional adicional; los parámetros que nunca crecerán, como el inicio y el fin de un rango, permanecen posicionales;
- un modo es una unión de strings, que puede ganar valores, en lugar de un booleano que más tarde necesite un tercer estado;
- un valor tiene un solo tipo: `version: string`, nunca `string | number`;
- lo que devuelve una función es un objeto, que puede ganar un campo, en lugar de una tupla o un valor simple;
- una función que devuelve una Promise informa de cada fallo rechazándola, y un fallo que el llamador pueda gestionar lleva un `code`, como los propios de NSH: los llamadores se ramifican según los códigos, mientras que los mensajes son para las personas y pueden cambiar;
- un renombrado conserva el nombre antiguo como un alias `@deprecated` de la misma implementación.

En Rust, los campos privados son la opción por defecto para el estado de comportamiento que debe evolucionar sin romper a los llamadores. Los campos públicos son apropiados para la configuración deliberadamente tipo registro y para los datos serializados. Toda struct pública con campos públicos debe llevar `#[non_exhaustive]` e implementar `Default`, de modo que los llamadores puedan crear valores sin literales de struct exhaustivos y se pueda añadir un campo sin romperlos.

Mantén estables las rutas de importación públicas mientras reorganizas los internos: el especificador `#[native_module]` de un crate y sus exports, y los exports de un módulo TSX, son lo que otro código importa. Prefiere la terminología de controles de la plataforma y la nomenclatura establecida de NSH al vocabulario de los frameworks web.
<a id="platform-and-capability-boundaries"></a>

## Límites de plataforma y de capacidades

No asumas que todas las plataformas admiten las mismas funcionalidades. Las barras de título y los controles de ventana, la accesibilidad, el portapapeles, la háptica, la física del desplazamiento, las fuentes y los tiempos pueden variar. Un mismo bundle se ejecuta en todas partes ([Código específico de plataforma](./platform-specific.md)); coloca el código específico de plataforma donde NSH le da un lugar y define el comportamiento de respaldo:

- lo que un elemento significa en todas las plataformas es una prop de nivel superior; una función de sistema propia de una plataforma va en `ios={{…}}`, `android={{…}}`, `desktop={{…}}` o `web={{…}}` (un método builder en Rust), en cada una de las plataformas que la tienen, y solo se aplica el objeto de la plataforma actual;
- las APIs de las plataformas móviles provienen de `nsh/mobile`, y las de los escritorios de `nsh/desktop`;
- los estilos por plataforma son clases `ios:`, `android:` y `web:`.

Una rama de plataforma debe preservar el contrato semántico aunque la presentación difiera. Por ejemplo, un diálogo es una hoja (sheet) en iOS y una capa sobre la ventana en los escritorios, pero la app sigue necesitando un estado de apertura coherente. Prueba el comportamiento compartido en modo headless y la parte de cada plataforma con `nsh test --target`. Da a cada bifurcación sobre un valor que NSH reporta (`platform.os`, un estado, un motivo) un `default`: las versiones posteriores añaden plataformas y casos, y una app entregada hoy se ejecuta en ellos ([Compatibilidad](./compatibility.md)).

Una app declara lo que alcanza fuera de su VM en `nsh.json` `"capabilities"`: los hosts desde los que hace fetch, las páginas que muestra una web view, el portapapeles, la barra de estado ([Sandbox y capacidades](./sandbox-and-capabilities.md)). Una app que se entregará dentro de otras apps enumera exactamente lo que usa y trata una solicitud rechazada igual que una fallida: una app anfitriona puede conceder menos de lo que la app declara. Una llamada rechazada falla con `code` `"ERR_ACCESS_DENIED"`, con su `permission` indicando la capacidad y su `resource` lo que se solicitó.

<a id="file-and-naming-conventions"></a>

## Convenciones de archivos y nombres

- Nombra las páginas y los componentes según conceptos del producto: `ProjectList`, `ProjectEditor`, `SettingsPage`.
- Nombra los manejadores de eventos según la intención: `confirmDelete`, `openProject`, `onQueryChange`.
- Mantén una responsabilidad principal por módulo; divide un archivo cuando la propiedad del estado o el ciclo de vida ya no puedan entenderse sin leer comportamiento no relacionado.
- Mantén juntos el módulo de un componente, sus props, sus eventos y sus pruebas específicas cuando cambian juntos.
- Documenta los invariantes y las restricciones sorprendentes del ciclo de vida; no narres llamadas obvias a builders.
- Usa `rustfmt` y satisface a Clippy en Rust, y `nsh check` en TSX. Evita atributos `allow` amplios que oculten advertencias no relacionadas.

<a id="vocabulary-is-part-of-the-api"></a>

### El vocabulario forma parte de la API

Usa la misma palabra para el mismo concepto en todos los componentes. Antes de nombrar una prop o un evento, busca el término en la propia API de NSH, luego en `gpui-base` de GPUI Kit, en GPUI y en `gpui-component`, y después en los controles de las plataformas. Lo que muestra una primitiva y las APIs globales toman sus nombres de HTML, el DOM y CSS (`src`, `html`, `placeholder`). Los nombres en Rust son `snake_case` y se traducen a `camelCase` en TSX (`on_open_change` es `onOpenChange`); una palabra sigue siendo una sola palabra (`readonly`, `multiline`).

| Concepto | Patrón de nombre | Ejemplo |
| --- | --- | --- |
| Un componente | Un sustantivo, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| Sus props y eventos (Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| El objeto de estado de un comportamiento | `<Control>State`, creado por `create<Control>` | `NavStackState`, `createNavStack` |
| Por qué cambió un valor | `<Control>ChangeReason`, una unión de strings | `DialogChangeReason`: `"cancel"`, `"backdropPress"` |
| Un estado | Un adjetivo, positivo, sin prefijo `is` | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| Lo que el usuario puede hacer | El adjetivo | `scrollable`, `zoomable`, `selectable`, `resizable` |
| Una funcionalidad sin adjetivo | `<feature>Enabled` | `pagingEnabled` |
| Si una parte se muestra | Un booleano con el nombre de la parte, por defecto `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| Si un slot se muestra | `<slot>Visible`, por defecto `true` | `headerVisible` (`header` es el slot de una página) |
| Los estilos de una parte | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| Los estilos de un estado | Clases `<state>Style`, `<state>:` | `activeStyle`, `disabled:` |
| Un slot | Lo que es | `header`, `footer`, `trigger`, `content`, `empty` |
| Contenido de la app | `render<Part>` | `renderCodeBlock` |
| Un indicador de descarte | `closeOn<Trigger>`, por defecto `true` | `closeOnEscape`, `closeOnBackdropPress` |
| El cambio de un valor | `on<Value>Change({ <value>, ... })`, un solo objeto | `onChange({ value })`, `onOpenChange({ open, reason })` |
| Cualquier otro evento | `on<Event>`, en presente, un solo objeto | `onPress()`, `onSubmit({ text })` |
| Una fase | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| El mouse sobre una vista | `Enter` / `Move` / `Leave`, los del DOM | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| Empezar a escuchar | `on(event, listener)`, devuelve `() => void` | `host.on(name, l)`, `BackHandler.on("press", l)` |
| Un valor del entorno | Un accessor, con `set<Value>` a su lado | `colorScheme()`, `setColorScheme` |
| Un booleano de solo lectura | `is<Adjective>`, `has<Noun>` | `isAvailable` |

Las props nunca son `is<Adjective>`: esa forma es para lo que solo lee un booleano (una constante, un campo de un payload). Una parte que se muestra se nombra según la parte, nunca `<part>Shown`, `<part>Hidden` ni `shows<Part>`.

Un builder de Rust toma y devuelve `Self` y se nombra según la prop que establece, sin `set_` (`.disabled(..)`, `.checked(..)`, `.on_change(..)`); la mutación in situ es `set_<field>` (`setRoutes`, `setColorScheme`). Un lector booleano es `has<Noun>`, cuando el valor contiene algo, o `is<Adjective>`, cuando describe un estado o un permiso. Recurre al adjetivo siempre que la acción lo tenga: `isClosable` en lugar de `canClose`, `isZoomable` en lugar de `canZoom`. Cuando la acción es una frase verbal sin forma adjetiva, nombra lo que necesita: `hasDefinition`, no `canGoToDefinition`. No añadas nuevos lectores `can`.

<a id="let-the-enclosing-name-carry-the-context"></a>

### Deja que el nombre envolvente aporte el contexto

Un nombre se lee dentro de algo: una prop dentro de su componente, un campo dentro de su tipo. Ninguno repite lo que lo envuelve (`contentStyle`, no `contentContainerStyle`; el `backdropClass` de `Dialog`, no `dialogBackdropClass`). Mantén los campos de un mismo tipo al mismo nivel de abreviación.

<a id="use-precise-domain-words"></a>

### Usa palabras de dominio precisas

- **selected** es pertenencia o el elemento actual; **checked** y **pressed** son el valor de un checkbox o de un toggle; **focused** es el destino del teclado; **hovered** es la presencia del puntero. No los uses nunca de forma intercambiable.
- **open / close** es el estado de un overlay; **show / hide** una solicitud transitoria; **expand / collapse** la estructura.
- **disabled** bloquea la interacción; **readonly** permite seleccionar y navegar pero no editar; **loading** evita trabajo duplicado mientras se ejecuta una operación.
- **press** es la activación por cualquier entrada, y los eventos de NSH dicen press (`onPress`); **click** es el del mouse.
- **index** es una posición; **id** es identidad. No persistas ni indexes por índice datos reordenables.
- **value** es dato de dominio controlado; **state** es comportamiento retenido.
- **src** es el recurso que muestra un elemento (una imagen, un video, una página); cualquier otra dirección es una **url**.
- **role** indica lo que significa una opción (`"cancel"`, `"destructive"`); el aspecto visual es responsabilidad de la app.

Evita nombres vagos como `data`, `item2`, `handleAction`, `updateUi`, `process`, `manager` o `config` cuando exista un término de dominio más preciso.

<a id="type-and-module-style"></a>

### Estilo de tipos y módulos

- Los tipos de Rust son `UpperCamelCase`; los módulos, funciones, métodos, campos y locales `snake_case`; las constantes `SCREAMING_SNAKE_CASE`. Nombra los bindings de contexto `cx`.
- Los componentes TSX y sus etiquetas son `PascalCase`; las props, funciones y locales `camelCase`. Las primitivas provienen de `nsh`, los componentes base de `nsh/base`.
- Un módulo con el nombre de un componente es dueño de su interfaz pública; divide su estado, sus partes y sus pruebas en archivos sin cambiar lo que otros importan.
- Usa nombres de módulo en singular para un concepto de componente y nombres establecidos para las familias (`menu` para `Menu`, `MenuItem` y `Submenu`).
- Sufija los identificadores con `Id`, y las colecciones con plurales significativos. No alternes `idx`, `index` y `ix` en un mismo subsistema.
- Nombra los predicados en positivo cuando sea posible. Un estado positivo se compone más fácilmente que varios negativos, pero conserva términos establecidos como `disabled` donde coincidan con la semántica del control.

<a id="callback-and-event-wording"></a>

### Redacción de callbacks y eventos

- Todo evento pasa un solo objeto, incluso con un único campo y también para el cambio de un valor, con sus campos nombrados como las props que reportan: `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`. Así, un campo posterior es una adición. Un tipo de datos de la API es un campo, nunca el payload en sí (`onImagePress({ image })`); un evento sin nada que reportar no pasa nada.
- Nombra el acto, no el pasado ni una solicitud: `onPress`, `onClose`, `onCancel`, `onBackPress`.
- Nombra la intención en lugar de la geometría cuando el acto tiene nombre: `onLoadMore`, no "se alcanzó el final".
- Los pares de ciclo de vida son `onOpen` / `onClose`; las fases son `Start` / `End`, nunca `Begin`; el mouse sobre una vista es `onMouseEnter` / `onMouseMove` / `onMouseLeave` (los nombres del DOM), un archivo arrastrado sobre ella `Enter` / `Leave`.
- Documenta si un callback se ejecuta antes o después de que cambie el estado propio del componente, y si puede reentrar en el componente.

<a id="documentation-and-copy-style"></a>

### Estilo de documentación y textos

La documentación pública debe comenzar con lo que hace un componente y quién es dueño de su estado. Los ejemplos deben usar las APIs actuales y mostrar ids estables. Documenta los valores por defecto, las diferencias entre plataformas, el comportamiento del foco, el orden de los callbacks y qué props lee de forma nativa el hilo principal.

Sigue las reglas de lenguaje de interfaz de las Design Guides para etiquetas, comandos, diálogos de confirmación, mayúsculas y puntos suspensivos. Mantén un término canónico para cada objeto de dominio, comando y estado.

Las claves de traducción describen una intención estable (`dialog.deleteProject.title`), no una frase del idioma de origen ni una coordenada de pantalla. Nunca construyas una frase a partir de fragmentos traducidos ni reutilices una clave para significados que casualmente comparten el mismo texto en inglés.

Localiza la intención, no la sintaxis. Da a cada locale control sobre el orden de las palabras, la pluralización, la puntuación y la cantidad de contexto que necesita. Las pruebas deben detectar claves faltantes y términos fijos inconsistentes; la revisión humana sigue decidiendo si la repetición se justifica por el contexto. Verifica cada cadena dentro de su componente con contenido realista, expansión del texto y un tamaño de texto grande.

<a id="testing-strategy"></a>

## Estrategia de pruebas

Prueba en la capa más baja que pueda demostrar el comportamiento ([Pruebas](./testing-and-trace.md)):

1. pruebas puras para transiciones de estado, formato, parsing y ordenamiento (`cargo test` de las funciones de un crate, un archivo de pruebas de las funciones del store);
2. pruebas headless de la app para componentes, eventos y tiempos de vida: el motor real, el renderizador, el layout y las listas, con frames de pantalla a 60 Hz, en `nsh test` (`nsh/test`) o `cargo test` (`nsh_testing::Headless`);
3. pruebas de interacción para foco, teclado, puntero, layout y estado renderizado, con los pasos que da un usuario (`press`, `type`, `scroll`, `drag`, `keyboard.press`), en modo headless y en una plataforma real (`nsh test --target macos`, `ios`, `android`, `web`, ...);
4. pruebas smoke de ejemplos o de la app para flujos de trabajo completos, y `nsh test --trace` para lo que cuesta una interacción.

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

Para un componente interactivo, cubre el contrato semántico en lugar de sus detalles de implementación: activación por press y teclado, cambios de valor controlados, comportamiento deshabilitado, movimiento del foco, cantidad y orden de los eventos, identidad estable y los estados vacíos o de fallo importantes. Simula la red (rutas `network`) y controla el tiempo (un reloj manual) en lugar de esperar a los reales. Añade una prueba de regresión antes de corregir un bug siempre que el fallo pueda reproducirse de forma determinista.

Encuentra las vistas como lo hace un usuario: por rol y nombre, etiqueta o texto (`role:button[Save]`, `label:Close`), y por un `testID` estable cuando nada más las nombra. Los selectores se leen de nuevo en cada paso, de modo que un paso nunca actúa sobre una instantánea obsoleta. Usa capturas de pantalla (`app.screenshot`, en una plataforma real) para hechos visuales que los selectores no pueden expresar; usa coordenadas solo como último recurso. Informa por separado la evidencia automatizada y la manual.

<a id="performance-rules"></a>

## Reglas de rendimiento

- No escribas estado de forma incondicional desde un binding o un efecto que lo lee.
- Evita crear signals, efectos, key bindings y estructuras de datos costosas dentro de bindings o de funciones de fila.
- Lee los signals en los bindings, de modo que un cambio coherente actualice la parte más reducida del árbol.
- Usa `List` para colecciones largas y renderiza solo el rango visible.
- Evita clonar strings o colecciones grandes únicamente para satisfacer un closure; captura handles `Copy` o datos compartidos (`SharedString`, `Rc`).
- Mantén ligeros los handlers y los valores calculados de TSX; mueve el trabajo pesado fuera de la ruta de interacción o a Rust.
- Mide con `nsh test --trace` antes de añadir cachés. Una caché debe tener un responsable claro de la invalidación.
- Mantén acotado el trabajo de animación: valores animados en el hilo de UI en lugar de signals escritos en cada frame, `scrollValue` en lugar de un listener de scroll ([Animación](./animation.md)), y respeta el movimiento reducido (`reduceMotion()`).
<a id="common-failure-modes"></a>

## Modos de fallo comunes

Evita estos patrones:

- una señal que contiene el estado no relacionado de la aplicación;
- lógica de negocio y peticiones de red incrustadas en el cuerpo de un componente largo;
- claves aleatorias o basadas en el índice para contenido reordenable;
- estado por fila en señales creadas dentro de una fila `List`;
- leer una prop o una señal en el cuerpo de un componente y esperar que se actualice;
- colores y radios literales que rompen los temas personalizados y el modo oscuro;
- vistas pulsables personalizadas cuando ya existe un componente semántico que proporciona foco, teclado, estado deshabilitado y comportamiento de accesibilidad;
- estado local duplicado que se desincroniza de un valor controlado;
- efectos que copian una señal en otra, y escrituras que entran en bucle a través de un binding;
- una decisión que el sistema necesita en el momento, dejada a un callback en lugar de a una prop establecida de antemano;
- vistas de scroll anidadas sin una propiedad explícita;
- una nueva variante de componente para una pantalla puntual;
- diálogos de confirmación para acciones reversibles y de bajo riesgo;
- pruebas que llaman a funciones internas pero nunca pulsan, escriben ni se desplazan.

<a id="rules-for-coding-agents"></a>

## Reglas para agentes de programación

Antes de editar, un agente debe leer la implementación más cercana, sus pruebas, las exportaciones públicas del módulo y la página de referencia relevante. Debe buscar las firmas en el código fuente actual y en `.nsh/types` en lugar de traducir por analogía un ejemplo de React, React Native, CSS o GPUI: los componentes de NSH se ejecutan una sola vez, y los bindings siguen a las señales que leen.

Para cada cambio, el agente debería poder nombrar:

1. el responsable del comportamiento y el responsable de la presentación;
2. la identidad retenida y el ciclo de vida del estado;
3. el contrato de pulsación, teclado, foco y accesibilidad;
4. el responsable del layout y del scroll;
5. los tokens de tema y las excepciones intencionadas;
6. la prueba que fallaría si el comportamiento sufriera una regresión.

El código generado debe ser revisado y probado por una persona. "Compila" no es un criterio de calidad de la interfaz, y una refactorización amplia que solo logra que el código generado parezca ordenado no sustituye a ajustarse a la arquitectura de la aplicación.

<a id="implementation-checklist"></a>

## Lista de comprobación de implementación

Antes de abrir un cambio para revisión, confirma que:

- la propiedad del estado y de los efectos secundarios es explícita;
- se ha elegido deliberadamente entre una función simple y un componente, y las props y señales se leen donde se usan;
- los elementos repetidos tienen claves e identificadores de prueba estables basados en el dominio;
- los tokens de tema y la escala de Tailwind sustituyen a los literales visuales aislados;
- las pulsaciones, los atajos de teclado, el foco, el estado deshabilitado y las superposiciones funcionan en conjunto;
- las decisiones que el sistema necesita en el momento son props establecidas de antemano;
- se representan las rutas de carga, vacío, error y cancelación;
- los conjuntos de datos largos usan `List`, con el estado por elemento en los datos;
- las incorporaciones a la API pública solo la amplían, y preservan la dirección de las dependencias y la encapsulación;
- las pruebas demuestran el comportamiento en la capa adecuada, en modo headless y en las plataformas que toca el cambio;
- el formato, Clippy, `nsh check`, las pruebas específicas y los ejemplos relevantes pasan correctamente.

Consulta [Primeros pasos](./getting-started.md) para la configuración de la aplicación, y las referencias de [Elementos](../elements/index.md) y [API](../modules/index.md) para los detalles actuales de la API.
