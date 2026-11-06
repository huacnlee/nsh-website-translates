---
title: "If / Each"
description: "Kontrollfluss: If rendert einen Zweig abhängig von einer Bedingung, Each rendert pro Element einer Liste eine Zeile mit Schlüssel, in Rust und TSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---


# If / Each

`If` und `Each` bestimmen, welche Elemente existieren: bedingte und wiederholte Inhalte. Sie erzeugen selbst keine native View.
Der native Renderer aktualisiert nur, was sich geändert hat: `If` tauscht einen Zweig aus, wenn seine Bedingung umschlägt, `Each` fügt Zeilen anhand des Schlüssels hinzu, verschiebt und entfernt sie, statt die Liste neu aufzubauen. Rust hat `when(..)`, `each(..)` und `dynamic(..)` in
`nsh_core::prelude`; TSX hat `<If>` und `<Each>`, Globals, die keinen Import benötigen.

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

In TSX sind sie Globals (eine Bindung gleichen Namens im Scope hat Vorrang). Innerhalb von JSX-Ausdrücken kannst du weiterhin
normales JavaScript verwenden (`cond ? a : b`, `items.map(…)`), in Rust `dynamic(move || ..)`: Diese erzeugen ihre Elemente
jedes Mal neu, wenn sich ändert, was sie lesen, während `If` und `Each` (`when` und `each` in Rust) die Elemente behalten, die bestehen bleiben.

## If

Rendert seinen Zweig, solange die Bedingung gilt, sonst den anderen Zweig (oder nichts).

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | Die Bedingung: in Rust ein Wert, ein Signal oder eine Closure; in TSX ihr Truthiness-Wert. |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | Wird gerendert, solange `when` nicht gilt. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | Wird gerendert, solange `when` gilt. In TSX erhält eine Funktion einen Accessor auf den Wert von `when`. |

Ein Zweig wird erzeugt, wenn die Bedingung zu ihm umschlägt, und was er erzeugt hat, verschwindet, wenn sie von ihm weg umschlägt. Ein TSX-`when`, das von einem truthy Wert zu einem anderen wechselt (`user()` wechselt von einem Objekt zu einem anderen), behält den Zweig, und die Ausdrücke darin aktualisieren sich selbstständig.

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

In TSX liest ein Funktions-Child den Wert, den `when` geliefert hat, ohne `null` oder `undefined` in seinem Typ, sodass der Zweig kein
`!` benötigt. In Rust liest der Zweig das Signal selbst, oder `dynamic` bildet den Wert auf Elemente ab:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

Rendert für jedes Element einer Liste eine Zeile.

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | Die Elemente: in Rust ein `Vec`, ein Signal eines solchen oder eine Closure, die eines zurückgibt. `null` und `undefined` rendern nichts. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | Die Identität eines Elements. Standard in TSX: das Element selbst (Objekte nach Identität, Primitive nach Wert). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | Rendert eine Zeile. |

Die Zeilenfunktion erhält **Accessors**, keine Werte: Rufe in TSX `item()` und `index()` auf, in
Rust `item.get()` und `index.get()` (beides sind `ReadSignal`s). Ändern sich die Elemente, bleiben Zeilen, deren Schlüssel weiterhin vorhanden ist, erhalten (und werden verschoben, wenn sich ihre Position geändert hat); ihr Element und ihr Index werden aktualisiert, und nur die Ausdrücke, die sie lesen, laufen erneut. Neue Schlüssel erhalten neue Zeilen; Zeilen, deren Schlüssel verschwunden ist, werden entfernt.

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

### Schlüssel wählen

- Elemente, die bei jeder Aktualisierung durch neue Objekte ersetzt werden (unveränderliche Updates, `{ ...t, done: true }`), benötigen ein `key`, meist eine ID.
  Ohne Schlüssel ist jedes neue Objekt eine neue Zeile, und ihre Elemente werden neu erzeugt. Rust verlangt immer einen Schlüssel.
- In TSX funktionieren Arrays aus Strings oder Zahlen ohne Schlüssel: Sie werden nach Wert verglichen.
- Jede Zeile hat ihren eigenen Owner: Effekte und Cleanups, die in einer Zeile erzeugt wurden, enden, wenn die Zeile entfernt wird.

> [!NOTE]
> `Each` und `each` sind generisch: TypeScript leitet den Elementtyp aus `of` ab, Rust aus den Elementen, sodass das `todo()` der Zeile und
> der Parameter `key` ohne Annotationen typisiert sind.

<a id="each-or-a-list"></a>

## Each oder eine Liste

`Each` erzeugt jede Zeile. Das passt für einige Dutzend oder wenige hundert Elemente, in einer View oder einer [Scroll View](./scroll.md).
Für lange oder unbegrenzte Daten verwende eine [Liste](./list.md): Sie erzeugt die Zeilen in der Nähe des Viewports und recycelt sie.

Wie Ausdrücke aktualisiert werden, siehst du unter [JSX und Komponenten](../docs/jsx-and-components.md) und [Reaktivität](../docs/reactivity.md).
