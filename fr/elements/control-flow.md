---
title: "If / Each"
description: "Contrôle de flux : If affiche une branche selon une condition, Each affiche une ligne avec clé pour chaque élément d'une liste, en Rust et en TSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` et `Each` décident quels éléments existent : contenu conditionnel et contenu répété. Ils ne créent aucune vue native propre.
Le moteur de rendu natif ne met à jour que ce qui a changé : `If` remplace une branche quand sa condition bascule, `Each` ajoute, déplace et
supprime des lignes par clé au lieu de reconstruire la liste. Rust dispose de `when(..)`, `each(..)` et `dynamic(..)` dans
`nsh_core::prelude` ; TSX dispose de `<If>` et `<Each>`, des globales qui ne nécessitent aucun import.

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

En TSX, ce sont des globales (une liaison du même nom dans la portée prend leur place). Dans les expressions JSX, vous pouvez toujours utiliser
du JavaScript ordinaire (`cond ? a : b`, `items.map(…)`), et en Rust `dynamic(move || ..)` : ceux-ci recréent leurs éléments
à chaque fois que ce qu'ils lisent change, tandis que `If` et `Each` (`when` et `each` en Rust) conservent les éléments qui restent.

## If

Rend sa branche tant que la condition est vérifiée, sinon l'autre branche (ou rien).

| Prop | Rust | Type | Description |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | La condition : une valeur, un signal ou une fermeture en Rust ; en TSX, sa valeur de vérité. |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | Rendu tant que la condition `when` n'est pas remplie. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | Rendu tant que la condition `when` est remplie. En TSX, une fonction reçoit un accesseur de la valeur de `when`. |

Une branche est créée quand la condition bascule vers elle, et ce qu'elle a créé disparaît quand la condition bascule dans l'autre sens. Un `when` TSX qui passe d'une
valeur vraie à une autre (`user()` passant d'un objet à un autre) conserve la branche, et les expressions qu'elle contient
se mettent à jour d'elles-mêmes.

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

En TSX, un enfant de type fonction lit la valeur fournie par `when`, sans `null` ni `undefined` dans son type, de sorte que la branche n'a pas besoin de
`!`. En Rust, la branche lit elle-même le signal, ou `dynamic` transforme la valeur en éléments :

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

Rend une ligne pour chaque élément d'une liste.

| Prop | Rust | Type | Description |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | Les éléments : en Rust, un `Vec`, un signal d'un tel type ou une fermeture en renvoyant un. `null` et `undefined` ne rendent rien. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | L'identité d'un élément. Valeur par défaut en TSX : l'élément lui-même (objets par identité, primitives par valeur). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | Rend une ligne. |

La fonction de ligne reçoit des **accesseurs**, pas des valeurs : appelez `item()` et `index()` en TSX, `item.get()` et `index.get()` en
Rust (ce sont tous deux des `ReadSignal`). Quand les éléments changent, les lignes dont la clé est toujours présente sont conservées (et déplacées si leur position
a changé) ; leur élément et leur indice sont mis à jour, et seules les expressions qui les lisent sont réexécutées. Les nouvelles clés obtiennent de nouvelles lignes ; les lignes
dont la clé a disparu sont supprimées.

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

### Choisir une clé

- Les éléments remplacés par de nouveaux objets à chaque mise à jour (mises à jour immuables, `{ ...t, done: true }`) nécessitent un `key`, généralement un identifiant.
  Sans lui, chaque nouvel objet devient une nouvelle ligne et ses éléments sont recréés. Rust exige toujours une clé.
- En TSX, les tableaux de chaînes ou de nombres fonctionnent sans clé : ils sont comparés par valeur.
- Chaque ligne a son propre propriétaire : les effets et les nettoyages créés dans une ligne prennent fin quand la ligne est supprimée.

> [!NOTE]
> `Each` et `each` sont génériques : TypeScript infère le type des éléments à partir de `of`, et Rust à partir des éléments, de sorte que le `todo()` de la ligne et
> le paramètre `key` sont typés sans annotations.

<a id="each-or-a-list"></a>

## Each ou une liste

`Each` crée chaque ligne. C'est adapté pour quelques dizaines ou quelques centaines d'éléments, dans une vue ou une [vue défilante](./scroll.md).
Pour des données longues ou non bornées, utilisez une [liste](./list.md) : elle crée les lignes proches de la zone visible et les recycle.

Voir [JSX et composants](../docs/jsx-and-components.md) et [réactivité](../docs/reactivity.md) pour savoir comment les expressions
sont mises à jour.
