---
title: "If / Each"
description: "Control de flujo: If renderiza una rama según una condición y Each renderiza una fila con clave por cada elemento de una lista, en Rust y TSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---


# If / Each

`If` y `Each` deciden qué elementos existen: contenido condicional y repetido. No crean ninguna vista nativa propia.
El renderizador nativo actualiza solo lo que cambió: `If` intercambia una rama cuando su condición cambia, `Each` añade, mueve y
elimina filas por clave en lugar de reconstruir la lista. Rust tiene `when(..)`, `each(..)` y `dynamic(..)` en
`nsh_core::prelude`; TSX tiene `<If>` y `<Each>`, globales que no necesitan importación.

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

En TSX son globales (un binding con el mismo nombre en el ámbito ocupa su lugar). Dentro de expresiones JSX todavía puedes
usar JavaScript normal (`cond ? a : b`, `items.map(…)`), y en Rust `dynamic(move || ..)`: estos vuelven a crear sus elementos
cada vez que cambia lo que leen, mientras que `If` y `Each` (`when` y `each` en Rust) conservan los elementos que permanecen.

## If

Renderiza su rama mientras se cumple la condición; en caso contrario, la otra rama (o nada).

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | La condición: un valor, una signal o un closure en Rust; en TSX, su valor de verdad (truthiness). |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | Se renderiza mientras `when` no se cumple. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | Se renderiza mientras `when` se cumple. En TSX, una función recibe un accessor del valor de `when`. |

Una rama se crea cuando la condición cambia hacia ella, y lo que creó se elimina cuando cambia en sentido contrario. Un `when` de TSX que pasa
de un valor truthy a otro (`user()` cambiando de un objeto a otro) conserva la rama, y las expresiones dentro de
ella se actualizan por sí solas.

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

En TSX, un hijo de tipo función lee el valor que dio `when`, sin `null` ni `undefined` en su tipo, así que la rama no necesita
`!`. En Rust, la rama lee la signal directamente, o `dynamic` convierte el valor en elementos:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

Renderiza una fila por cada elemento de una lista.

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | Los elementos: en Rust un `Vec`, una signal de uno o un closure que devuelve uno. `null` y `undefined` no renderizan nada. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | La identidad de un elemento. Valor por defecto en TSX: el propio elemento (objetos por identidad, primitivos por valor). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | Renderiza una fila. |

La función de fila recibe **accessors**, no valores: llama a `item()` y `index()` en TSX, `item.get()` y `index.get()` en
Rust (ambos son `ReadSignal`s). Cuando los elementos cambian, las filas cuya clave sigue presente se conservan (y se mueven si su posición
cambió); su elemento e índice se actualizan, y solo vuelven a ejecutarse las expresiones que los leen. Las claves nuevas obtienen filas nuevas; las filas
cuya clave desapareció se eliminan.

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

### Elegir una clave

- Los elementos reemplazados por objetos nuevos en cada actualización (actualizaciones inmutables, `{ ...t, done: true }`) necesitan un `key`, normalmente un id.
  Sin él, cada objeto nuevo es una fila nueva y sus elementos se crean de nuevo. Rust siempre requiere una clave.
- En TSX, los arrays de strings o números funcionan sin clave: se comparan por valor.
- Cada fila tiene su propio owner: los effects y cleanups creados en una fila terminan cuando la fila se elimina.

> [!NOTE]
> `Each` y `each` son genéricos: TypeScript infiere el tipo del elemento a partir de `of`, y Rust a partir de los elementos, de modo que el `todo()` de la fila y
> el parámetro `key` quedan tipados sin anotaciones.

<a id="each-or-a-list"></a>

## Each o una list

`Each` crea todas las filas. Eso es adecuado para decenas o unos pocos cientos de elementos, en una view o una [scroll view](./scroll.md).
Para datos largos o ilimitados, usa una [list](./list.md): crea las filas cercanas al viewport y las recicla.

Consulta [JSX y componentes](../docs/jsx-and-components.md) y [reactividad](../docs/reactivity.md) para saber cómo se actualizan
las expresiones.
