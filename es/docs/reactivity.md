---
title: "Reactividad"
description: "Signals, valores computed, effects, resources, batch, untracked, cleanup y context en Rust y TSX: cómo NSH actualiza exactamente lo que ha cambiado y los errores que conviene evitar."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---


# Reactividad

NSH actualiza la UI con **señales**: valores que saben quién los lee. Cuando una señal cambia, NSH vuelve a ejecutar exactamente los cálculos que la leyeron (un texto, un estilo, un efecto) y nada más. Los componentes no se vuelven a renderizar. El modelo es el de Solid, y el grafo reactivo en sí es nativo: los componentes Rust y TSX se ejecutan sobre el mismo grafo, escrito en Rust, de modo que también en TSX la planificación, el seguimiento de dependencias y la limpieza ocurren fuera del intérprete.

Los componentes Rust toman todo lo de esta página del prelude; TSX lo importa de `nsh`:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## Señales

`signal(value)` crea una señal. Se lee con `get()` en Rust y llamándola en TSX; `set` y `update` la escriben:

```rust tabs
let count = signal(0);

count.get();                    // 0, and tracks the read
count.set(5);
count.update(|n| *n += 1);      // 6
```

```tsx tabs
const count = signal(0);

count();                     // 0, and tracks the read
count.set(5);
count.update((n) => n + 1);  // 6
```

Una lectura dentro de un ámbito de seguimiento (un binding, `computed`, `effect`) suscribe ese ámbito a la señal. Una escritura notifica a los suscriptores cuando el valor cambió: se compara con `PartialEq` en Rust y con `===` en TSX.

```rust tabs
fn counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Tapped {} times", count.get())))
}
```

```tsx tabs
function Counter() {
  const count = signal(0);
  return (
    <View onPress={() => count.update((n) => n + 1)}>
      <Text>Tapped {count()} times</Text>
    </View>
  );
}
```

Al pulsar se actualiza el único nodo de texto que lee `count`. `counter()` / `Counter` se ejecuta una sola vez. Una señal de Rust es un handle `Copy`, así que los closures la toman con `move` y la usan libremente.

Una señal puede contar cada escritura como un cambio, y TSX puede comparar valores a su manera:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

En TSX, `signal<T>()` sin valor empieza como `undefined` y se tipa como `Signal<T | undefined>`; en Rust, un
`Option` dice lo mismo (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### Objetos y arrays

En Rust, `update` cambia el valor en el lugar y notifica a los lectores; `set` lo reemplaza. En TSX, las señales se comparan con `===`, así que un valor mutado en el lugar no es un cambio: escribe un objeto o array nuevo.

```rust tabs
let todos = signal(Vec::<Todo>::new());

todos.update(|list| list.push(Todo { id: 3, title: "New".into(), done: false }));   // notifies
todos.update(|list| {
    if let Some(todo) = list.iter_mut().find(|t| t.id == id) {
        todo.done = true;
    }
});
```

```tsx tabs
const todos = signal<Todo[]>([]);

todos.update((list) => [...list, { id: 3, title: "New" }]);                 // notifies
todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: true } : t)));

todos().push(item);    // does not notify anyone
todos.set(todos());    // still the same array: no change
```

`each` / `<Each>` identifica las filas por elemento, de modo que cambiar un elemento reconstruye solo esa fila ([JSX y componentes](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` deriva un valor a partir de otras señales. Ejecuta `fn`, recuerda el resultado y lo ejecuta de nuevo cuando cambia una señal que leyó. Leerlo es como leer una señal:

```rust tabs
let price = signal(12);
let quantity = signal(2);
let total = computed(move || price.get() * quantity.get());

text(move || format!("Total: {}", total.get()))
```

```tsx tabs
const price = signal(12);
const quantity = signal(2);
const total = computed(() => price() * quantity());

<Text>Total: {total()}</Text>
```

Usa `computed` cuando un valor derivado se lee en varios sitios o es costoso: se ejecuta una vez por cambio sin importar cuántos lectores tenga, y los lectores solo reciben notificación cuando cambia su resultado. Para un valor barato que se lee una sola vez, basta un closure simple:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

En TSX, `fn` recibe el valor anterior (`undefined` la primera vez), para valores que se acumulan:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` ejecuta `fn`, y de nuevo cada vez que cambia una señal que leyó. Los effects sirven para efectos secundarios: logging, temporizadores, peticiones de red, llamadas imperativas sobre [refs](./jsx-and-components.md#refs).

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// What to search for.
    pub query: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let results = signal(Vec::<SharedString>::new());
    effect(move || {
        let q = props.query.get();          // tracked: runs again when the prop changes
        if q.is_empty() {
            return;
        }
        spawn(async move {
            if let Ok(response) = fetch(format!("https://api.example.com/search?q={q}")).await {
                results.set(response.text().lines().map(|line| SharedString::from(line.to_owned())).collect());
            }
        });
    });
    view().child(each(results, |item| item.clone(), |item, _| text(item)))
}
```

```tsx tabs
function Search(props: { query: string }) {
  const results = signal<string[]>([]);
  effect(() => {
    const q = props.query;          // tracked: runs again when the prop changes
    if (!q) return;
    fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => results.set(data.items));
  });
  return <Each of={results()}>{(item) => <Text>{item()}</Text>}</Each>;
}
```

Un effect rastrea las lecturas hechas mientras se ejecuta de forma síncrona. Las lecturas en una tarea, en un callback de `.then` o después de un `await` no se rastrean.

Un effect que llama a un [ref](./jsx-and-components.md#refs) actúa sobre el elemento en el que está el ref; en TSX, los effects se ejecutan después de que existan los elementos creados en la misma pasada, de modo que los refs ya están asignados:

```rust tabs
let input = element_ref();
effect(move || {
    if editing.get() {
        input.focus();
    }
});
```

```tsx tabs
let input: InputRef | undefined;
effect(() => {
  if (editing()) input?.focus();
});
```

> [!TIP]
> No uses effects para mantener una señal sincronizada con otra (`effect(() => b.set(a() * 2))`). Usa `computed`: nunca está desactualizado y no provoca una segunda pasada. Un effect que escribe una señal que también lee se ejecuta a sí mismo una y otra vez hasta que NSH lo detiene con un error.

## resource

`resource(source, fetcher)` carga un valor de forma asíncrona y guarda en qué punto está la carga, de modo que un componente muestra datos, un spinner o un error sin gestionarlos él mismo:

```rust tabs
let url = signal(SharedString::from("https://api.example.com/quote"));
let quote = resource(move || Some(url.get()), |url, _info| async move {
    let response = fetch(url.to_string()).await?;
    if !response.ok() {
        return Err(format!("HTTP {}", response.status()));
    }
    Ok(response.text())
});

view()
    .child(text(move || match (quote.get(), quote.error()) {
        (_, Some(error)) => format!("Failed: {error}"),
        (Some(quote), None) => quote,
        (None, None) => "Loading…".to_owned(),
    }))
    .child(text("Reload").on_press(move || quote.refetch()))
```

```tsx tabs
import { List, resource, signal, Text } from "nsh";

type Post = { id: number; title: string };

const url = signal("https://jsonplaceholder.typicode.com/posts?_limit=20");
const posts = resource(url, async (u, { signal }) => {
  const response = await fetch(u, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Post[];
});

<If when={posts.error()}>
  <Text>Failed: {String(posts.error())}</Text>
</If>
<List
  each={posts() ?? []}
  refreshing={posts.state() === "refreshing"}
  onRefresh={posts.refetch}
>
  {(post) => <Text>{post().title}</Text>}
</List>
```

`source` se rastrea: cada vez que da un valor nuevo, `fetcher(value, info)` vuelve a cargar. En Rust es un closure que devuelve un `Option`, y `None` no carga nada; en TSX es un accessor (una señal, una función) o un valor, y `undefined`, `null` o `false` no cargan nada: para un usuario que aún no ha iniciado sesión o cuando no se ha elegido nada. Sin fuente, Rust pasa `|| Some(())`, y el `resource(fetcher)` de TSX carga una vez, llamando a `fetcher(info)`. El fetcher de Rust devuelve un `Result`; el de TSX, un valor o una promesa, y un throw es un fallo.

| Rust | TSX | Qué es |
|---|---|---|
| `quote.get()` | `posts()` | El último valor: ninguno antes de que termine la primera carga, se conserva mientras se vuelve a cargar y tras un fallo. |
| `quote.loading()` | `posts.loading()` | Si hay una carga en curso. |
| `quote.error()` | `posts.error()` | El error de la última carga, ninguno una vez que una carga da un valor. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (nada que cargar), `Pending` (la primera carga), `Ready`, `Refreshing` (volviendo a cargar, con el valor conservado), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | Vuelve a cargar desde la misma fuente: un reintento, tirar para actualizar. |
| `quote.mutate(value)` | `posts.mutate(value)` | Establece el valor aquí sin cargar, una actualización optimista, y borra el error. |

Un resource de Rust es un handle `Copy`, igual que las señales; los miembros de TSX están enlazados (bound), así que `onRefresh={posts.refetch}` y `const loading = posts.loading` funcionan tal cual.

Solo cuenta la última carga. Una nueva descarta la que está en curso, y también lo hace que el componente desaparezca; en TSX, `info.signal` aborta el `fetch` que recibe. Una carga que termina después de haber sido reemplazada no cambia nada. `info.refetching` indica que `refetch()` inició la carga. `resource_with_value(value, source, fetcher)` en Rust y `{ initialValue }` en TSX dan al resource un valor desde el principio.

## cleanup

`cleanup(fn)` registra `fn` para que se ejecute antes de que el effect actual vuelva a ejecutarse, o cuando el componente o effect al que pertenece desaparece:

```rust tabs
effect(move || {
    if !running.get() {
        return;
    }
    let ticker = spawn(async move {
        loop {
            timer(Duration::from_millis(100)).await;
            tick();
        }
    });
    cleanup(move || ticker.cancel());   // before the next run, or on removal
});
```

```tsx tabs
function Clock() {
  const now = signal(Date.now());
  const id = setInterval(() => now.set(Date.now()), 1000);
  cleanup(() => clearInterval(id));       // when Clock is removed
  return <Text>{new Date(now()).toLocaleTimeString()}</Text>;
}

effect(() => {
  if (!running()) return;
  const id = setInterval(tick, 100);
  cleanup(() => clearInterval(id));       // before the next run, or on removal
});
```

En Rust, las tareas, los temporizadores y los intervalos (`spawn`, `set_timeout`, `set_interval`) ya terminan con el owner bajo el que se crearon, así que el reloj propio de una vista no necesita limpieza:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

Un effect de TSX también puede devolver su limpieza, como en React: una función que `fn` devuelve se ejecuta en los mismos momentos que una que se pasa a `cleanup`.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Un componente desaparece cuando deja de renderizarse: su rama `when` / `<If>` se oculta, su fila `each` / `<Each>` se elimina o su página se saca de la pila. Todo lo que creó (effects, valores computed, tareas, limpiezas, componentes anidados) se libera con él.

## batch

Cada escritura notifica a sus suscriptores de inmediato. Para que varias escrituras cuenten como un solo cambio, envuélvelas en `batch`: los dependientes se ejecutan una vez, después de la última escritura.

```rust tabs
let save = move || {
    batch(|| {
        first_name.set(form.first.clone());
        last_name.set(form.last.clone());
        dirty.set(false);
    })
};
```

```tsx tabs
const save = () =>
  batch(() => {
    firstName.set(form.first);
    lastName.set(form.last);
    dirty.set(false);
  });
```

Los manejadores de eventos no se agrupan automáticamente: dos escrituras en un handler de pulsación ejecutan dos veces un effect que lee ambas señales. `batch` devuelve lo que devuelve su función.

## untracked

`untracked(fn)` ejecuta `fn` sin suscribirse a lo que lee. Úsalo en un ámbito de seguimiento para leer un valor sin depender de él:

```rust tabs
effect(move || {
    let q = query.get();                          // runs again when query changes
    let filters = untracked(|| active_filters.get());   // read, but not a reason to run again
    search(q, filters);
});
```

```tsx tabs
effect(() => {
  const q = query();                     // runs again when query changes
  const filters = untracked(activeFilters); // read, but not a reason to run again
  search(q, filters);
});
```

El `get_untracked()` de Rust lee una señal de la misma manera. El cuerpo de un componente ya es no rastreado: leer una señal allí la lee una sola vez.

## context

Un contexto es un valor que un componente proporciona a todo lo que renderiza, por profundo que sea. En Rust, `provide_context(value)` proporciona un valor de su tipo, y `use_context::<T>()` encuentra el más cercano; en TSX, `context(defaultValue)` crea un contexto, llamarlo lee el valor proporcionado más cercano (o el predeterminado), y `<Ctx.Provider value>` proporciona uno:

```rust tabs
#[derive(Clone, Copy)]
struct Dark(bool);

fn label(content: &'static str) -> impl IntoElement {
    let dark = use_context::<Dark>().is_some_and(|d| d.0);
    text(content).text_color(if dark { rgb(0xffffff) } else { rgb(0x1f2328) })
}

fn screen() -> impl IntoElement {
    provide_context(Dark(true));
    view().child(label("Hello"))
}
```

```tsx tabs
const Theme = context<"light" | "dark">("light");

function Label(props: { children: string }) {
  const theme = Theme();
  return <Text style={{ color: theme === "dark" ? "#ffffff" : "#1f2328" }}>{props.children}</Text>;
}

mount(() => (
  <Theme.Provider value="dark">
    <Label>Hello</Label>
  </Theme.Provider>
));
```

Un valor proporcionado se lee una vez, cuando se busca. Para proporcionar algo que cambia, proporciona una señal (o un struct de señales) y léela en un binding:

```rust tabs
#[derive(Clone, Copy)]
struct Accent(Signal<Hsla>);

#[component]
fn App() -> impl IntoElement {
    provide_context(Accent(signal(rgb(0x0969da).into())));
    view().child(swatch())
}

fn swatch() -> impl IntoElement {
    let Accent(accent) = use_context::<Accent>().expect("an accent");
    view()
        .w(px(40.0))
        .h(px(40.0))
        .bg(move || accent.get())
        .on_press(move || accent.set(rgb(0x8250df).into()))
}
```

```tsx tabs
const Accent = context(signal("#0969da"));

function App() {
  const accent = signal("#0969da");
  return (
    <Accent.Provider value={accent}>
      <Swatch />
    </Accent.Provider>
  );
}

function Swatch() {
  const accent = Accent();
  return <View onPress={() => accent.set("#8250df")} style={{ width: 40, height: 40, backgroundColor: accent() }} />;
}
```

Lee un contexto en el cuerpo de un componente (o en código que se ejecuta mientras se crean componentes), no en un manejador de eventos ni en un temporizador, donde no hay un componente desde el que buscarlo. Los componentes Rust también reciben así el tema de la app: `theme()` de `nsh_base` ([Tema](./rust.md#theme)).

<a id="error-boundaries"></a>

## Límites de error

Un límite de error mantiene un fallo en una parte de una vista dentro de esa parte. Cuando algo debajo de él lanza una excepción (en Rust: un panic) al renderizarse o ejecutarse, como el cuerpo de un componente, un binding, un effect o un manejador de eventos, la parte que falló se elimina y el límite muestra su fallback en su lugar; el resto de la vista queda como está. En Rust es `catch_error(view, fallback)`; en TSX, `<ErrorBoundary fallback>` de `nsh`. El fallback recibe el error (en TSX el valor lanzado tal cual, normalmente un `Error`) y un reset que vuelve a renderizar la vista:

```rust tabs
fn profile_card(user: Signal<Option<User>>) -> impl IntoElement {
    catch_error(
        move || profile(user),
        |error, reset| {
            view()
                .child(text(format!("Something went wrong: {error}")))
                .child(text("Try again").on_press(move || reset.reset()))
        },
    )
}
```

```tsx tabs
import { ErrorBoundary, Text, View } from "nsh";

function ProfileCard(props: { user: User | undefined }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>Something went wrong: {error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Profile user={props.user} />
    </ErrorBoundary>
  );
}
```

Un fallo va al límite más cercano por encima de donde ocurrió, y uno en un fallback, al límite que está por encima de ese. Sin límite, el fallo se reporta como un error no capturado (el overlay de errores de desarrollo, el log). En TSX, un elemento `fallback` se muestra tal cual (`fallback={<Text>Unavailable</Text>}`), y una función se llama con el error y `reset`, sean cuales sean los parámetros que declare.

<a id="what-runs-and-when"></a>

## Qué se ejecuta y cuándo

| Escribes | Se ejecuta | Se vuelve a ejecutar cuando |
|---|---|---|
| Cuerpo del componente | Una vez, cuando se crea | Nunca (salvo hot reload) |
| Un binding: un closure dado a `text`, un estilo o una prop en Rust; `{expr}` o `prop={expr}` que llama a una función o lee una propiedad en TSX | Una vez, cuando se crea el elemento | Cambia una señal que leyó; solo se actualiza esa prop o ese hijo |
| `computed(fn)` | Al crearse | Cambia una señal que leyó |
| `effect(fn)` | Después de que existan los elementos de la pasada actual | Cambia una señal que leyó |
| `when(cond, ..)` / `<If when>` | Al crearse | Cambia si la condición se cumple |
| Fila de `each(..)` / `<Each of>` | Cuando su clave aparece por primera vez | Nunca; en su lugar cambian sus señales de item e index |

El entorno es reactivo de la misma manera: `window()`, `dark()`, `font_scale()`, `safe_area()` y `keyboard_height()` en Rust, `windowSize()`, `colorScheme()` y `fontScale()` de [`nsh`](../modules/nsh.md#device) y `safeArea()` y `keyboardFrame()` de [`nsh`](../modules/nsh.md) en TSX, de modo que los bindings que los leen siguen la rotación, el modo oscuro o el teclado.

<a id="common-mistakes"></a>

## Errores comunes

**Leer una señal en el cuerpo del componente y esperar actualizaciones.**

```rust tabs
fn bad() -> impl IntoElement {
    let n = count.get();                       // read once
    text(format!("{n}"))                       // never changes
}

fn good() -> impl IntoElement {
    text(move || format!("{}", count.get()))   // a binding: follows count
}
```

```tsx tabs
function Bad() {
  const n = count();           // read once
  return <Text>{n}</Text>;     // never changes
}

function Good() {
  return <Text>{count()}</Text>;
}
```

**Leer las props una sola vez.** Una prop de Rust leída con `props.title.get()` en el cuerpo se lee una vez; léela en un binding (`text(props.title)`, `move || props.title.get()`). En TSX, `const { title } = props` lee `title` una sola vez: lee `props.title` donde lo uses, o divide las props con [`split`](./jsx-and-components.md#spreading-props).

**Mutar en lugar de asignar, en TSX.** `list().push(x)` cambia el array pero no notifica a nadie. Escribe un array nuevo, como hace por ti el `update` de Rust.

**Derivar estado con effects.** `effect(() => total.set(price() * qty()))` funciona, pero deja `total` desactualizado entre la escritura y el effect, y cuesta una segunda pasada. Usa `computed`.

**Crear effects fuera de componentes.** Los effects y los valores computed pertenecen al componente que los creó y se liberan con él. Si se crean en un manejador de eventos o en un callback de temporizador, no tienen owner y viven para siempre. Créalos en el cuerpo de un componente y deja que lean las señales que cambian.

**Esperar que el código asíncrono se rastree.** Solo se rastrean las lecturas hechas de forma síncrona mientras se ejecuta un effect o un valor computed. Lee primero las señales y luego inicia el trabajo asíncrono.

<a id="related"></a>

## Relacionado

- [JSX y componentes](./jsx-and-components.md): componentes, props, `when` / `<If>` y `each` / `<Each>`, en Rust y TSX.
- [Creación con Rust](./rust.md): apps en Rust, tareas y el tema.
- [Referencia del módulo `nsh`](../modules/nsh.md): la firma de cada función de TSX.
- [Animación](./animation.md): valores animados que se animan en el hilo de la UI sin señales.
