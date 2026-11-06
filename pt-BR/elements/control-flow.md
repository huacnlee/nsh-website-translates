---
title: "If / Each"
description: "Fluxo de controle: If renderiza um ramo de acordo com uma condição, Each renderiza uma linha com chave para cada item de uma lista, em Rust e TSX."
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---


# If / Each

`If` e `Each` decidem quais elementos existem: conteúdo condicional e repetido. Eles não criam nenhuma view nativa própria.
O renderer nativo atualiza apenas o que mudou: `If` troca um branch quando a condição muda, e `Each` adiciona, move e
remove linhas por chave em vez de reconstruir a lista. Rust tem `when(..)`, `each(..)` e `dynamic(..)` em
`nsh_core::prelude`; TSX tem `<If>` e `<Each>`, globais que não precisam de import.

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

Em TSX, eles são globais (um binding de mesmo nome no escopo toma o lugar deles). Dentro de expressões JSX você ainda pode
usar JavaScript puro (`cond ? a : b`, `items.map(…)`), e em Rust `dynamic(move || ..)`: essas construções recriam seus elementos
toda vez que o que elas leem muda, enquanto `If` e `Each` (`when` e `each` em Rust) mantêm os elementos que permanecem.

## If

Renderiza seu branch enquanto a condição for verdadeira; caso contrário, renderiza o outro branch (ou nada).

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | A condição: um valor, um signal ou uma closure em Rust; em TSX, sua veracidade (truthiness). |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | Renderizado enquanto `when` não for verdadeiro. |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | Renderizado enquanto `when` for verdadeiro. Em TSX, uma função recebe um accessor do valor de `when`. |

Um branch é criado quando a condição muda para ele, e o que ele criou é removido quando a condição muda para o outro. Um `when` em TSX que passa
de um valor truthy para outro (`user()` mudando de um objeto para outro) mantém o branch, e as expressões dentro
dele se atualizam sozinhas.

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

Em TSX, um filho do tipo função lê o valor que `when` forneceu, sem `null` ou `undefined` em seu tipo, portanto o branch não precisa de
`!`. Em Rust, o branch lê o próprio signal, ou `dynamic` mapeia o valor para elementos:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

Renderiza uma linha para cada item de uma lista.

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | Os itens: em Rust, um `Vec`, um signal de um ou uma closure que retorna um. `null` e `undefined` não renderizam nada. |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | A identidade de um item. Padrão em TSX: o próprio item (objetos por identidade, primitivos por valor). |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | Renderiza uma linha. |

A função de linha recebe **accessors**, não valores: chame `item()` e `index()` em TSX, `item.get()` e `index.get()` em
Rust (ambos são `ReadSignal`s). Quando os itens mudam, as linhas cuja chave ainda existe são mantidas (e movidas se a posição
mudou); o item e o índice delas são atualizados, e apenas as expressões que os leem são executadas novamente. Chaves novas ganham linhas novas; linhas
cuja chave desapareceu são removidas.

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

### Escolhendo uma chave

- Itens substituídos por novos objetos a cada atualização (atualizações imutáveis, `{ ...t, done: true }`) precisam de um `key`, geralmente um id.
  Sem ele, cada novo objeto vira uma nova linha e seus elementos são recriados. Rust sempre exige uma chave.
- Em TSX, arrays de strings ou números funcionam sem chave: eles são comparados por valor.
- Cada linha tem seu próprio owner: effects e cleanups criados em uma linha terminam quando a linha é removida.

> [!NOTE]
> `Each` e `each` são genéricos: o TypeScript infere o tipo do item a partir de `of`, e o Rust a partir dos itens, então o `todo()` da linha e
> o parâmetro `key` são tipados sem anotações.

<a id="each-or-a-list"></a>

## Each ou uma lista

`Each` cria todas as linhas. Isso é adequado para dezenas ou algumas centenas de itens, em uma view ou em uma [scroll view](./scroll.md).
Para dados longos ou ilimitados, use uma [list](./list.md): ela cria as linhas próximas da viewport e as recicla.

Veja [JSX e componentes](../docs/jsx-and-components.md) e [reatividade](../docs/reactivity.md) para saber como as expressões
são atualizadas.
