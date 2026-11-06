---
title: "Reaktivität"
description: "Signals, berechnete Werte, Effekte, Ressourcen, Batch, Untracked, Cleanup und Context in Rust und TSX – wie NSH genau das aktualisiert, was sich geändert hat, und welche Fehler es zu vermeiden gilt."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---


# Reaktivität

NSH aktualisiert die UI mit **Signals**: Werten, die wissen, wer sie liest. Ändert sich ein Signal, führt NSH genau die Berechnungen erneut aus, die es gelesen haben (ein Text, ein Style, ein Effect), und sonst nichts. Komponenten werden nicht neu gerendert. Das Modell stammt von Solid, und der Reaktivitätsgraph selbst ist nativ: Rust-Komponenten und TSX laufen auf demselben, in Rust geschriebenen Graphen, sodass auch bei TSX Scheduling, Abhängigkeitsverfolgung und Cleanup außerhalb des Interpreters stattfinden.

Rust-Komponenten beziehen alles auf dieser Seite aus dem Prelude; TSX importiert es aus `nsh`:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

## Signals

`signal(value)` erzeugt ein Signal. In Rust liest du es mit `get()`, in TSX durch Aufruf; `set` und `update` schreiben es:

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

Ein Lesezugriff innerhalb eines Tracking-Scopes (ein Binding, `computed`, `effect`) abonniert diesen Scope beim Signal. Ein Schreibzugriff benachrichtigt die Subscriber, wenn sich der Wert geändert hat: Verglichen wird in Rust mit `PartialEq`, in TSX mit `===`.

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

Ein Tippen aktualisiert den einen Textknoten, der `count` liest. `counter()` / `Counter` selbst läuft nur einmal. Ein Rust-Signal ist ein `Copy`-Handle, daher übernehmen Closures es mit `move` und können es frei verwenden.

Ein Signal kann jeden Schreibzugriff als Änderung zählen, und TSX kann Werte auf eigene Weise vergleichen:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

In TSX startet `signal<T>()` ohne Wert als `undefined` und ist als `Signal<T | undefined>` typisiert; in Rust sagt ein `Option` dasselbe (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### Objekte und Arrays

In Rust ändert `update` den Wert direkt an Ort und Stelle und benachrichtigt die Leser; `set` ersetzt ihn. In TSX vergleichen Signals mit `===`, ein an Ort und Stelle veränderter Wert ist also keine Änderung: Schreibe ein neues Objekt oder Array.

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

`each` / `<Each>` vergibt Schlüssel für Zeilen pro Element, sodass die Änderung eines Elements nur diese Zeile neu aufbaut ([JSX und Komponenten](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` leitet einen Wert aus anderen Signals ab. Es führt `fn` aus, merkt sich das Ergebnis und führt es erneut aus, wenn sich ein gelesenes Signal ändert. Das Lesen funktioniert wie bei einem Signal:

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

Verwende `computed`, wenn ein abgeleiteter Wert an mehreren Stellen gelesen wird oder teuer zu berechnen ist: Es läuft pro Änderung einmal, egal wie viele Leser es hat, und die Leser werden nur benachrichtigt, wenn sich sein Ergebnis ändert. Für einen günstigen Wert, der nur einmal gelesen wird, genügt eine einfache Closure:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

In TSX erhält `fn` den vorherigen Wert (beim ersten Mal `undefined`), für Werte, die sich akkumulieren:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` führt `fn` aus und erneut, sobald sich ein gelesenes Signal ändert. Effects sind für Seiteneffekte gedacht: Logging, Timer, Netzwerkanfragen, imperative Aufrufe auf [Refs](./jsx-and-components.md#refs).

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

Ein Effect verfolgt die Lesezugriffe, die während seiner synchronen Ausführung stattfinden. Lesezugriffe in einem Task, einem `.then`-Callback oder nach einem `await` werden nicht verfolgt.

Ein Effect, der ein [Ref](./jsx-and-components.md#refs) aufruft, wirkt auf das Element, an dem das Ref hängt; in TSX laufen Effects, nachdem die im selben Durchlauf erzeugten Elemente existieren, sodass Refs gesetzt sind:

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
> Verwende keine Effects, um ein Signal mit einem anderen synchron zu halten (`effect(() => b.set(a() * 2))`). Verwende `computed`: Es ist nie veraltet und verursacht keinen zweiten Durchlauf. Ein Effect, der ein Signal schreibt, das er auch liest, läuft immer wieder von selbst, bis NSH ihn mit einem Fehler stoppt.

## resource

`resource(source, fetcher)` lädt einen Wert asynchron und merkt sich, wie weit der Ladevorgang ist, sodass eine Komponente Daten, einen Spinner oder einen Fehler anzeigt, ohne sie selbst zu verwalten:

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

`source` wird verfolgt: Sobald es einen neuen Wert liefert, lädt `fetcher(value, info)` erneut. In Rust ist es eine Closure, die ein `Option` zurückgibt, und `None` lädt nichts; in TSX ist es ein Accessor (ein Signal, eine Funktion) oder ein Wert, und `undefined`, `null` oder `false` laden nichts: für einen Nutzer, der noch nicht angemeldet ist, oder wenn nichts ausgewählt ist. Ohne Source übergibt Rust `|| Some(())`, und das `resource(fetcher)` von TSX lädt einmal und ruft `fetcher(info)` auf. Der Rust-Fetcher gibt ein `Result` zurück; der TSX-Fetcher einen Wert oder ein Promise, und ein throw gilt als Fehler.

| Rust | TSX | Bedeutung |
|---|---|---|
| `quote.get()` | `posts()` | Der neueste Wert: keiner, bevor der erste Ladevorgang endet; er bleibt beim erneuten Laden und nach einem Fehler erhalten. |
| `quote.loading()` | `posts.loading()` | Ob ein Ladevorgang läuft. |
| `quote.error()` | `posts.error()` | Der Fehler des letzten Ladevorgangs; keiner, sobald ein Ladevorgang einen Wert liefert. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (nichts zu laden), `Pending` (der erste Ladevorgang), `Ready`, `Refreshing` (lädt erneut, der Wert bleibt erhalten), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | Lädt erneut aus derselben Source: ein Retry, Pull-to-Refresh. |
| `quote.mutate(value)` | `posts.mutate(value)` | Setzt den Wert lokal ohne Laden, ein optimistisches Update, und löscht den Fehler. |

Eine Rust-Resource ist wie Signals ein `Copy`-Handle; die TSX-Member sind gebunden, daher funktionieren `onRefresh={posts.refetch}` und `const loading = posts.loading` so, wie sie sind.

Nur der neueste Ladevorgang zählt. Ein neuer verwirft den laufenden, ebenso das Verschwinden der Komponente; in TSX bricht `info.signal` das ihm übergebene `fetch` ab. Ein Ladevorgang, der endet, nachdem er abgelöst wurde, ändert nichts. `info.refetching` besagt, dass `refetch()` den Ladevorgang gestartet hat. `resource_with_value(value, source, fetcher)` in Rust und `{ initialValue }` in TSX geben der Resource von Anfang an einen Wert.

## cleanup

`cleanup(fn)` registriert `fn`, das ausgeführt wird, bevor der aktuelle Effect erneut läuft oder wenn die Komponente bzw. der Effect, zu dem es gehört, verschwindet:

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

In Rust enden Tasks, Timer und Intervalle (`spawn`, `set_timeout`, `set_interval`) bereits mit dem Owner, unter dem sie erzeugt wurden, sodass die eigene Uhr einer View kein Cleanup braucht:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

Ein TSX-Effect kann sein Cleanup auch zurückgeben, wie in React: Eine Funktion, die `fn` zurückgibt, läuft zu denselben Zeitpunkten wie eine, die es an `cleanup` übergibt.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Eine Komponente verschwindet, wenn sie nicht mehr gerendert wird: Ihr `when` / `<If>`-Zweig wird ausgeblendet, ihre `each` / `<Each>`-Zeile wird entfernt oder ihre Seite wird entfernt (pop). Alles, was sie erzeugt hat (Effects, Computed Values, Tasks, Cleanups, verschachtelte Komponenten), wird mit ihr entsorgt.

## batch

Jeder Schreibzugriff benachrichtigt seine Subscriber sofort. Damit mehrere Schreibzugriffe als eine Änderung zählen, packe sie in `batch`: Abhängige laufen einmal, nach dem letzten Schreibzugriff.

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

Event-Handler werden nicht automatisch gebündelt: Zwei Schreibzugriffe in einem Press-Handler führen einen Effect, der beide Signals liest, zweimal aus. `batch` gibt zurück, was seine Funktion zurückgibt.

## untracked

`untracked(fn)` führt `fn` aus, ohne das Gelesene zu abonnieren. Verwende es in einem Tracking-Scope, um einen Wert zu lesen, ohne von ihm abzuhängen:

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

Das `get_untracked()` von Rust liest ein einzelnes Signal auf dieselbe Weise. Ein Komponenten-Body ist bereits untracked: Das Lesen eines Signals dort liest es einmal.

## context

Ein Context ist ein Wert, den eine Komponente allem bereitstellt, was sie rendert, egal wie tief. In Rust stellt `provide_context(value)` einen Wert seines Typs bereit, und `use_context::<T>()` findet den nächstgelegenen; in TSX erzeugt `context(defaultValue)` einen Context, ein Aufruf liest den nächsten bereitgestellten Wert (oder den Default), und `<Ctx.Provider value>` stellt einen bereit:

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

Ein bereitgestellter Wert wird einmal gelesen, nämlich beim Nachschlagen. Um etwas bereitzustellen, das sich ändert, stelle ein Signal (oder ein Struct aus Signals) bereit und lies es in einem Binding:

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

Lies einen Context im Komponenten-Body (oder in Code, der läuft, während Komponenten erzeugt werden), nicht in einem Event-Handler oder einem Timer, wo es keine Komponente gibt, von der aus nachgeschlagen werden könnte. Rust-Komponenten beziehen auch das Theme der App auf diese Weise: `theme()` aus `nsh_base` ([Theme](./rust.md#theme)).

## Error Boundaries

Eine Error Boundary beschränkt einen Fehler in einem Teil einer View auf diesen Teil. Wirft etwas darunter (Rust: Panic) beim Rendern oder Ausführen, etwa der Body einer Komponente, ein Binding, ein Effect oder ein Event-Handler, wird der fehlgeschlagene Teil entfernt, und die Boundary zeigt stattdessen ihren Fallback; der Rest der View bleibt unverändert. In Rust ist es `catch_error(view, fallback)`; in TSX `<ErrorBoundary fallback>` aus `nsh`. Der Fallback erhält den Fehler (in TSX den geworfenen Wert selbst, meist ein `Error`) und ein Reset, das die View erneut rendert:

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

Ein Fehler geht an die nächste Boundary oberhalb der Stelle, an der er aufgetreten ist, und ein Fehler in einem Fallback an die Boundary darüber. Ohne Boundary wird der Fehler als nicht abgefangener Fehler gemeldet (das Development-Error-Overlay, das Log). In TSX wird ein `fallback`-Element unverändert angezeigt (`fallback={<Text>Unavailable</Text>}`), und eine Funktion wird mit dem Fehler und `reset` aufgerufen, unabhängig davon, welche Parameter sie deklariert.

<a id="what-runs-and-when"></a>

## Was wann läuft

| Du schreibst | Läuft | Läuft erneut, wenn |
|---|---|---|
| Komponenten-Body | Einmal, bei der Erzeugung | Nie (Hot Reload ausgenommen) |
| Ein Binding: eine Closure, die in Rust an `text`, einen Style oder eine Prop übergeben wird; `{expr}` oder `prop={expr}`, die in TSX eine Property aufruft oder liest | Einmal, wenn das Element erzeugt wird | sich ein gelesenes Signal ändert; nur diese Prop bzw. dieses Child wird aktualisiert |
| `computed(fn)` | Bei der Erzeugung | sich ein gelesenes Signal ändert |
| `effect(fn)` | Nachdem die Elemente des aktuellen Durchlaufs existieren | sich ein gelesenes Signal ändert |
| `when(cond, ..)` / `<If when>` | Bei der Erzeugung | sich ändert, ob die Bedingung zutrifft |
| `each(..)` / `<Each of>`-Zeile | Wenn ihr Schlüssel zum ersten Mal erscheint | Nie; stattdessen ändern sich ihre Item- und Index-Signals |

Die Umgebung ist auf dieselbe Weise reaktiv: `window()`, `dark()`, `font_scale()`, `safe_area()` und `keyboard_height()` in Rust, `windowSize()`, `colorScheme()` und `fontScale()` aus [`nsh`](../modules/nsh.md#device) sowie `safeArea()` und `keyboardFrame()` aus [`nsh`](../modules/nsh.md) in TSX, sodass Bindings, die sie lesen, Rotation, Dark Mode oder Tastatur folgen.

<a id="common-mistakes"></a>

## Häufige Fehler

**Ein Signal im Komponenten-Body lesen und Updates erwarten.**

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

**Props nur einmal lesen.** Eine Rust-Prop, die im Body mit `props.title.get()` gelesen wird, wird einmal gelesen; lies sie in einem Binding (`text(props.title)`, `move || props.title.get()`). In TSX liest `const { title } = props` `title` einmal: Lies `props.title` dort, wo du es verwendest, oder teile Props mit [`split`](./jsx-and-components.md#spreading-props) auf.

**In TSX mutieren statt setzen.** `list().push(x)` ändert das Array, benachrichtigt aber niemanden. Schreibe ein neues Array, wie es `update` in Rust für dich übernimmt.

**Zustand mit Effects ableiten.** `effect(() => total.set(price() * qty()))` funktioniert, lässt aber `total` zwischen dem Schreibzugriff und dem Effect veraltet und kostet einen zweiten Durchlauf. Verwende `computed`.

**Effects außerhalb von Komponenten erzeugen.** Effects und Computed Values gehören zu der Komponente, die sie erzeugt hat, und werden mit ihr entsorgt. In einem Event-Handler oder Timer-Callback erzeugt, haben sie keinen Owner und leben ewig. Erzeuge sie im Komponenten-Body und lass sie die Signals lesen, die sich ändern.

**Erwarten, dass asynchroner Code verfolgt wird.** Nur Lesezugriffe, die synchron während der Ausführung eines Effects oder Computed Values stattfinden, werden verfolgt. Lies zuerst die Signals und starte dann die asynchrone Arbeit.

<a id="related"></a>

## Siehe auch

- [JSX und Komponenten](./jsx-and-components.md): Komponenten, Props, `when` / `<If>` und `each` / `<Each>`, in Rust und TSX.
- [Entwickeln mit Rust](./rust.md): Rust-Apps, Tasks und das Theme.
- [Modulreferenz zu `nsh`](../modules/nsh.md): die Signatur jeder TSX-Funktion.
- [Animation](./animation.md): animierte Werte, die ohne Signals im UI-Thread animieren.
