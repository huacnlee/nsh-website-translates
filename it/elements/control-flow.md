---
title: "If / Each"
description: "Controllo del flusso: If renderizza un ramo in base a una condizione, Each renderizza una riga con chiave per ogni elemento di una lista, in Rust e TSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` e `Each` decidono quali elementi esistono: contenuto condizionale e ripetuto. Non creano alcuna vista nativa propria.
Il renderer nativo aggiorna solo ciò che è cambiato: `If` sostituisce un ramo quando la sua condizione cambia, `Each` aggiunge, sposta e
rimuove le righe in base alla chiave invece di ricostruire la lista. Rust ha `when(..)`, `each(..)` e `dynamic(..)` in
`nsh_core::prelude`; TSX ha `<If>` e `<Each>`, globali che non richiedono alcun import.

```rust tabs
use nsh_core::prelude::*;

view()
    .child(
        when(move || user.with(|u| u.is_some()), move || {
            text(move || format!("Hello, {}", user.with(|u| u.as_ref().map(|u| u.name.clone()).unwrap_or_default())))
        })
        .otherwise(|| text("Signed out")),
    )
    .child(each(todos, |t: &Todo| t.id, |todo, _index| text(move || todo.get().title)))
```

```tsx tabs
<View>
  <If when={user()} else={<Text>Signed out</Text>}>
    {(u) => <Text>Hello, {u().name}</Text>}
  </If>
  <Each of={todos()}>{(todo) => <Text>{todo().title}</Text>}</Each>
</View>
```

In TSX sono globali (un binding con lo stesso nome nello scope prende il loro posto). All'interno delle espressioni JSX puoi comunque usare
JavaScript semplice (`cond ? a : b`, `items.map(…)`), e in Rust `dynamic(move || ..)`: queste ricreano i propri elementi
ogni volta che cambia ciò che leggono, mentre `If` e `Each` (`when` e `each` in Rust) mantengono gli elementi che restano.

## If

Renderizza il suo ramo finché la condizione è vera, altrimenti l'altro ramo (o niente).

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | La condizione: un valore, un signal o una closure in Rust; in TSX la sua truthiness. |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | Renderizzato finché `when` non è vera. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | Renderizzato finché `when` è vera. In TSX, una funzione riceve un accessor del valore di `when`. |

Un ramo viene creato quando la condizione passa a esso, e ciò che ha creato viene rimosso quando la condizione passa all'altro. Un `when` TSX che passa da
un valore truthy a un altro (`user()` che cambia da un oggetto a un altro) mantiene il ramo, e le espressioni al suo
interno si aggiornano da sole.

```rust tabs
let loading = signal(true);

when(move || !loading.get(), || profile())
    .otherwise(|| text("Loading…").text_color(rgb(0x6e7781)))
```

```tsx tabs
const loading = signal(true);

<If when={!loading()} else={<Text style={{ color: "#6e7781" }}>Loading…</Text>}>
  <Profile />
</If>;
```

In TSX, una funzione figlia legge il valore fornito da `when`, senza `null` o `undefined` nel suo tipo, quindi il ramo non ha bisogno di
`!`. In Rust, il ramo legge direttamente il signal, oppure `dynamic` mappa il valore in elementi:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

Renderizza una riga per ogni elemento di una lista.

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | Gli elementi: in Rust un `Vec`, un signal di uno o una closure che ne restituisce uno. `null` e `undefined` non renderizzano nulla. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | L'identità di un elemento. Predefinito in TSX: l'elemento stesso (oggetti per identità, primitivi per valore). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | Renderizza una riga. |

La funzione di riga riceve **accessor**, non valori: chiama `item()` e `index()` in TSX, `item.get()` e `index.get()` in
Rust (entrambi sono `ReadSignal`). Quando gli elementi cambiano, le righe la cui chiave è ancora presente vengono mantenute (e spostate se la loro posizione
è cambiata); il loro elemento e indice si aggiornano, e solo le espressioni che li leggono vengono rieseguite. Le nuove chiavi ottengono nuove righe; le righe
la cui chiave è sparita vengono rimosse.

```rust tabs
#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    title: String,
    done: bool,
}

let todos = signal(Vec::<Todo>::new());

each(todos, |t: &Todo| t.id, |todo, index| {
    view()
        .flex_row()
        .gap_2()
        .child(text(move || format!("{}.", index.get() + 1)))
        .child(
            text(move || todo.get().title)
                .style_when(move || todo.get().done, |s| s.line_through()),
        )
})
```

```tsx tabs
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

<Each of={todos()} key={(t: Todo) => t.id}>
  {(todo, index) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text>{index() + 1}.</Text>
      <Text style={{ textDecorationLine: todo().done ? "line-through" : "none" }}>{todo().title}</Text>
    </View>
  )}
</Each>;
```

<a id="choosing-a-key"></a>

### Scegliere una chiave

- Gli elementi sostituiti da nuovi oggetti a ogni aggiornamento (aggiornamenti immutabili, `{ ...t, done: true }`) richiedono un `key`, di solito un id.
  Senza di esso ogni nuovo oggetto è una nuova riga e i suoi elementi vengono ricreati. Rust richiede sempre una chiave.
- In TSX, gli array di stringhe o numeri funzionano senza chiave: vengono confrontati per valore.
- Ogni riga ha il proprio owner: gli effect e i cleanup creati in una riga terminano quando la riga viene rimossa.

> [!NOTE]
> `Each` e `each` sono generici: TypeScript deduce il tipo dell'elemento da `of`, e Rust dagli elementi, quindi il `todo()` della riga e
> il parametro `key` sono tipizzati senza annotazioni.

<a id="each-or-a-list"></a>

## Each o una lista

`Each` crea ogni riga. Va bene per decine o poche centinaia di elementi, in una vista o in una [scroll view](./scroll.md).
Per dati lunghi o illimitati, usa una [lista](./list.md): crea le righe vicino al viewport e le ricicla.

Vedi [JSX e componenti](../docs/jsx-and-components.md) e [reattività](../docs/reactivity.md) per capire come si aggiornano
le espressioni.
