---
title: "Reattività"
description: "Signal, valori computed, effect, resource, batch, untracked, cleanup e context in Rust e TSX: come NSH aggiorna esattamente ciò che è cambiato e gli errori da evitare."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# Reattività

NSH aggiorna la UI con i **signal**: valori che sanno chi li legge. Quando un signal cambia, NSH riesegue esattamente le computazioni che lo hanno letto (un testo, uno stile, un effect) e nient'altro. I componenti non vengono ri-renderizzati. Il modello è quello di Solid, e il grafo reattivo stesso è nativo: i componenti Rust e TSX girano sullo stesso grafo, scritto in Rust, quindi anche in TSX scheduling, tracciamento delle dipendenze e cleanup avvengono tutti fuori dall'interprete.

I componenti Rust prendono tutto ciò che è in questa pagina dal prelude; TSX lo importa da `nsh`:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## Signal

`signal(value)` crea un signal. Si legge con `get()` in Rust e chiamandolo in TSX; `set` e `update` lo scrivono:

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

Una lettura all'interno di uno scope di tracciamento (un binding, `computed`, `effect`) iscrive quello scope al signal. Una scrittura notifica i subscriber quando il valore è cambiato: il confronto avviene con `PartialEq` in Rust e con `===` in TSX.

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

Il tap aggiorna l'unico nodo di testo che legge `count`. `counter()` / `Counter` viene eseguito una sola volta. Un signal Rust è un handle `Copy`, quindi le closure lo prendono con `move` e lo usano liberamente.

Un signal può contare ogni scrittura come un cambiamento, e TSX può confrontare i valori a modo suo:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

In TSX, `signal<T>()` senza un valore parte da `undefined` ed è tipizzato `Signal<T | undefined>`; in Rust, un
`Option` dice la stessa cosa (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### Oggetti e array

In Rust, `update` modifica il valore sul posto e notifica i lettori; `set` lo sostituisce. In TSX i signal confrontano con `===`, quindi un valore mutato sul posto non è un cambiamento: scrivi un nuovo oggetto o array.

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

`each` / `<Each>` identifica le righe tramite l'elemento, quindi modificare un elemento ricostruisce solo quella riga ([JSX e componenti](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` deriva un valore da altri signal. Esegue `fn`, ricorda il risultato e lo riesegue quando cambia un signal che ha letto. Leggerlo è come leggere un signal:

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

Usa `computed` quando un valore derivato viene letto in più punti o è costoso da calcolare: viene eseguito una sola volta per cambiamento, indipendentemente dal numero di lettori, e i lettori vengono notificati solo quando il suo risultato cambia. Per un valore economico letto una sola volta, basta una semplice closure:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

In TSX, `fn` riceve il valore precedente (`undefined` la prima volta), per i valori che si accumulano:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` esegue `fn`, e lo riesegue ogni volta che cambia un signal che ha letto. Gli effect servono per gli effetti collaterali: logging, timer, richieste di rete, chiamate imperative sui [ref](./jsx-and-components.md#refs).

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

Un effect traccia le letture effettuate mentre viene eseguito in modo sincrono. Le letture in un task, in una callback `.then` o dopo un `await` non vengono tracciate.

Un effect che chiama un [ref](./jsx-and-components.md#refs) agisce sull'elemento a cui il ref è associato; in TSX, gli effect vengono eseguiti dopo che gli elementi creati nello stesso passaggio esistono, quindi i ref sono impostati:

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
> Non usare gli effect per mantenere un signal sincronizzato con un altro (`effect(() => b.set(a() * 2))`). Usa `computed`: non è mai obsoleto e non causa un secondo passaggio. Un effect che scrive un signal che legge a sua volta si riesegue ripetutamente finché NSH non lo interrompe con un errore.

## resource

`resource(source, fetcher)` carica un valore in modo asincrono e tiene traccia dello stato del caricamento, così un componente mostra dati, uno spinner o un errore senza doverli gestire da sé:

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

`source` è tracciato: ogni volta che produce un nuovo valore, `fetcher(value, info)` carica di nuovo. In Rust è una closure che restituisce un `Option`, e `None` non carica nulla; in TSX è un accessor (un signal, una funzione) o un valore, e `undefined`, `null` o `false` non caricano nulla: per un utente non ancora autenticato o senza alcuna selezione. Senza sorgente, Rust passa `|| Some(())`, e il `resource(fetcher)` di TSX carica una sola volta, chiamando `fetcher(info)`. Il fetcher Rust restituisce un `Result`; quello TSX un valore o una promise, e un throw è un fallimento.

| Rust | TSX | Cos'è |
|---|---|---|
| `quote.get()` | `posts()` | L'ultimo valore: nessuno prima della fine del primo caricamento, mantenuto durante un nuovo caricamento e dopo un fallimento. |
| `quote.loading()` | `posts.loading()` | Se un caricamento è in corso. |
| `quote.error()` | `posts.error()` | L'errore dell'ultimo caricamento, nessuno una volta che un caricamento restituisce un valore. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (niente da caricare), `Pending` (il primo caricamento), `Ready`, `Refreshing` (nuovo caricamento, valore mantenuto), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | Carica di nuovo dalla stessa sorgente: un retry, un pull to refresh. |
| `quote.mutate(value)` | `posts.mutate(value)` | Imposta qui il valore senza caricare, un aggiornamento ottimistico, e azzera l'errore. |

Una resource Rust è un handle `Copy`, come i signal; i membri TSX sono bound, quindi `onRefresh={posts.refetch}` e `const loading = posts.loading` funzionano così come sono.

Conta solo l'ultimo caricamento. Uno nuovo scarta quello in corso, e lo stesso vale quando il componente scompare; in TSX, `info.signal` interrompe il `fetch` che riceve. Un caricamento che termina dopo essere stato superato non cambia nulla. `info.refetching` indica che `refetch()` ha avviato il caricamento. `resource_with_value(value, source, fetcher)` in Rust e `{ initialValue }` in TSX danno alla resource un valore fin dall'inizio.

## cleanup

`cleanup(fn)` registra `fn` perché venga eseguito prima che l'effect corrente venga rieseguito, o quando il componente o l'effect a cui appartiene scompare:

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

In Rust, task, timer e interval (`spawn`, `set_timeout`, `set_interval`) terminano già insieme all'owner sotto cui sono stati creati, quindi il clock di una view non richiede cleanup:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

Un effect TSX può anche restituire il proprio cleanup, come in React: una funzione restituita da `fn` viene eseguita negli stessi momenti di una passata a `cleanup`.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Un componente scompare quando non viene più renderizzato: il suo ramo `when` / `<If>` viene nascosto, la sua riga `each` / `<Each>` viene rimossa o la sua pagina viene estratta dallo stack. Tutto ciò che ha creato (effect, computed, task, cleanup, componenti annidati) viene eliminato insieme a lui.

## batch

Ogni scrittura notifica subito i suoi subscriber. Per far contare più scritture come un unico cambiamento, racchiudile in `batch`: i dipendenti vengono eseguiti una sola volta, dopo l'ultima scrittura.

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

Gli event handler non sono raggruppati automaticamente: due scritture in un handler di pressione eseguono due volte un effect che legge entrambi i signal. `batch` restituisce ciò che restituisce la sua funzione.

## untracked

`untracked(fn)` esegue `fn` senza iscriversi a ciò che legge. Usalo in uno scope di tracciamento per leggere un valore senza dipenderne:

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

`get_untracked()` di Rust legge un singolo signal allo stesso modo. Il corpo di un componente è già untracked: leggere un signal al suo interno lo legge una sola volta.

## context

Un context è un valore che un componente fornisce a tutto ciò che renderizza, a qualsiasi profondità. In Rust, `provide_context(value)` fornisce un valore del proprio tipo e `use_context::<T>()` trova il più vicino; in TSX, `context(defaultValue)` crea un context, chiamarlo legge il valore fornito più vicino (o quello di default) e `<Ctx.Provider value>` ne fornisce uno:

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

Un valore fornito viene letto una sola volta, nel momento in cui viene cercato. Per fornire qualcosa che cambia, fornisci un signal (o una struct di signal) e leggilo in un binding:

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

Leggi un context nel corpo di un componente (o in codice eseguito mentre i componenti vengono creati), non in un event handler o in un timer, dove non c'è alcun componente da cui cercarlo. Anche i componenti Rust ricevono il tema dell'app in questo modo: `theme()` da `nsh_base` ([Tema](./rust.md#theme)).

<a id="error-boundaries"></a>

## Error boundary

Un error boundary circoscrive un fallimento a una sola parte di una view. Quando qualcosa al di sotto lancia un'eccezione (in Rust: va in panic) durante il rendering o l'esecuzione, ad esempio il corpo di un componente, un binding, un effect o un event handler, la parte fallita viene rimossa e il boundary mostra al suo posto il proprio fallback; il resto della view resta invariato. In Rust è `catch_error(view, fallback)`; in TSX, `<ErrorBoundary fallback>` da `nsh`. Il fallback riceve l'errore (in TSX il valore lanciato stesso, di solito un `Error`) e un reset che renderizza di nuovo la view:

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

Un fallimento va al boundary più vicino sopra il punto in cui è avvenuto, e uno in un fallback va al boundary ancora sopra. Senza un boundary, il fallimento viene segnalato come errore non gestito (l'overlay degli errori di sviluppo, il log). In TSX, un elemento `fallback` viene mostrato così com'è (`fallback={<Text>Unavailable</Text>}`), e una funzione viene chiamata con l'errore e `reset`, qualunque parametro dichiari.

<a id="what-runs-and-when"></a>

## Cosa viene eseguito, e quando

| Cosa scrivi | Viene eseguito | Viene rieseguito quando |
|---|---|---|
| Corpo del componente | Una volta, alla creazione | Mai (a parte l'hot reload) |
| Un binding: una closure passata a `text`, uno stile o una prop in Rust; `{expr}` o `prop={expr}` che chiama o legge una proprietà in TSX | Una volta, alla creazione dell'elemento | Cambia un signal che ha letto; viene aggiornata solo quella prop o quel figlio |
| `computed(fn)` | Alla creazione | Cambia un signal che ha letto |
| `effect(fn)` | Dopo che gli elementi del passaggio corrente esistono | Cambia un signal che ha letto |
| `when(cond, ..)` / `<If when>` | Alla creazione | Cambia il fatto che la condizione sia vera |
| Riga di `each(..)` / `<Each of>` | Quando la sua chiave compare per la prima volta | Mai; cambiano invece i suoi signal di elemento e indice |

L'ambiente è reattivo allo stesso modo: `window()`, `dark()`, `font_scale()`, `safe_area()` e `keyboard_height()` in Rust, `windowSize()`, `colorScheme()` e `fontScale()` da [`nsh`](../modules/nsh.md#device) e `safeArea()` e `keyboardFrame()` da [`nsh`](../modules/nsh.md) in TSX, così i binding che li leggono seguono la rotazione, la dark mode o la tastiera.

<a id="common-mistakes"></a>

## Errori comuni

**Leggere un signal nel corpo del componente e aspettarsi aggiornamenti.**

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

**Leggere le prop una sola volta.** Una prop Rust letta con `props.title.get()` nel corpo viene letta una sola volta; leggila in un binding (`text(props.title)`, `move || props.title.get()`). In TSX, `const { title } = props` legge `title` una sola volta: leggi `props.title` dove lo usi, oppure dividi le prop con [`split`](./jsx-and-components.md#spreading-props).

**Mutare invece di impostare, in TSX.** `list().push(x)` modifica l'array ma non notifica nessuno. Scrivi un nuovo array, come fa per te `update` di Rust.

**Derivare lo stato con gli effect.** `effect(() => total.set(price() * qty()))` funziona, ma lascia `total` obsoleto tra la scrittura e l'effect, e costa un secondo passaggio. Usa `computed`.

**Creare effect fuori dai componenti.** Gli effect e i computed appartengono al componente che li ha creati e vengono eliminati con esso. Se creati in un event handler o in una callback di un timer, non hanno alcun owner e vivono per sempre. Creali nel corpo di un componente e lascia che leggano i signal che cambiano.

**Aspettarsi che il codice asincrono venga tracciato.** Vengono tracciate solo le letture effettuate in modo sincrono mentre un effect o un computed è in esecuzione. Leggi prima i signal, poi avvia il lavoro asincrono.

<a id="related"></a>

## Correlati

- [JSX e componenti](./jsx-and-components.md): componenti, prop, `when` / `<If>` e `each` / `<Each>`, in Rust e TSX.
- [Sviluppo con Rust](./rust.md): app Rust, task e tema.
- [Riferimento del modulo `nsh`](../modules/nsh.md): la firma di ogni funzione TSX.
- [Animazione](./animation.md): valori animati che si animano sul thread della UI senza signal.
