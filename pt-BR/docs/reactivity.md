---
title: "Reatividade"
description: "Signals, valores computados, effects, resources, batch, untracked, cleanup e context em Rust e TSX - como o NSH atualiza exatamente o que mudou, e os erros a evitar."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---


# Reatividade

NSH atualiza a UI com **signals**: valores que sabem quem os lê. Quando um signal muda, o NSH executa novamente exatamente as computações que o leram (um texto, um estilo, um effect) e nada além disso. Os componentes não são renderizados de novo. O modelo é o do Solid, e o próprio grafo reativo é nativo: componentes Rust e TSX rodam no mesmo grafo, escrito em Rust, então também no TSX o agendamento, o rastreamento de dependências e a limpeza acontecem fora do interpretador.

Componentes Rust recebem tudo desta página do prelude; o TSX importa de `nsh`:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

## Signals

`signal(value)` cria um signal. Leia-o com `get()` em Rust e, no TSX, chamando-o; `set` e `update` o escrevem:

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

Uma leitura dentro de um escopo de rastreamento (um binding, `computed`, `effect`) inscreve esse escopo no signal. Uma escrita notifica os assinantes quando o valor mudou: a comparação é feita com `PartialEq` em Rust e com `===` no TSX.

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

Tocar atualiza o único nó de texto que lê `count`. `counter()` / `Counter` em si executa uma vez. Um signal em Rust é um handle `Copy`, então closures o recebem com `move` e o usam livremente.

Um signal pode contar toda escrita como mudança, e o TSX pode comparar valores do seu próprio jeito:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

No TSX, `signal<T>()` sem valor começa como `undefined` e tem o tipo `Signal<T | undefined>`; em Rust, um
`Option` diz o mesmo (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### Objetos e arrays

Em Rust, `update` altera o valor no lugar e notifica os leitores; `set` o substitui. No TSX, os signals comparam com `===`, então um valor mutado no lugar não conta como mudança: escreva um novo objeto ou array.

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

`each` / `<Each>` indexa as linhas por item, então alterar um item reconstrói apenas aquela linha ([JSX e componentes](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` deriva um valor de outros signals. Ele executa `fn`, guarda o resultado e executa de novo quando um signal que ele leu muda. Lê-lo é como ler um signal:

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

Use `computed` quando um valor derivado é lido em vários lugares ou é caro de calcular: ele executa uma vez por mudança, não importa quantos leitores tenha, e os leitores só são notificados quando o resultado muda. Para um valor barato lido uma vez, uma closure simples basta:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

No TSX, `fn` recebe o valor anterior (`undefined` na primeira vez), para valores que se acumulam:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` executa `fn` e executa de novo sempre que um signal que ele leu muda. Effects servem para efeitos colaterais: logging, timers, requisições de rede, chamadas imperativas em [refs](./jsx-and-components.md#refs).

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

Um effect rastreia as leituras feitas enquanto executa de forma síncrona. Leituras em uma task, em um callback de `.then` ou depois de um `await` não são rastreadas.

Um effect que chama uma [ref](./jsx-and-components.md#refs) age sobre o elemento em que a ref está; no TSX, os effects executam depois que os elementos criados na mesma passada existem, então as refs já estão definidas:

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
> Não use effects para manter um signal sincronizado com outro (`effect(() => b.set(a() * 2))`). Use `computed`: ele nunca fica desatualizado e não causa uma segunda passada. Um effect que escreve em um signal que ele também lê executa a si mesmo repetidamente até o NSH interrompê-lo com um erro.

## resource

`resource(source, fetcher)` carrega um valor de forma assíncrona e guarda em que ponto o carregamento está, de modo que um componente mostra dados, um spinner ou um erro sem precisar gerenciá-los por conta própria:

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

`source` é rastreado: sempre que ele produz um novo valor, `fetcher(value, info)` carrega de novo. Em Rust, é uma closure que retorna um `Option`, e `None` não carrega nada; no TSX, é um accessor (um signal, uma função) ou um valor, e `undefined`, `null` ou `false` não carregam nada: serve para um usuário que ainda não entrou ou quando nada foi escolhido. Sem source, Rust passa `|| Some(())`, e o `resource(fetcher)` do TSX carrega uma vez, chamando `fetcher(info)`. O fetcher em Rust retorna um `Result`; o do TSX retorna um valor ou uma promise, e um throw é uma falha.

| Rust | TSX | O que é |
|---|---|---|
| `quote.get()` | `posts()` | O valor mais recente: nenhum antes de o primeiro carregamento terminar, mantido durante um novo carregamento e após uma falha. |
| `quote.loading()` | `posts.loading()` | Se um carregamento está em execução. |
| `quote.error()` | `posts.error()` | O erro do último carregamento, nenhum quando um carregamento produz um valor. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (nada a carregar), `Pending` (o primeiro carregamento), `Ready`, `Refreshing` (carregando de novo, com o valor mantido), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | Carrega de novo a partir da mesma source: uma nova tentativa, um pull to refresh. |
| `quote.mutate(value)` | `posts.mutate(value)` | Define o valor localmente, sem carregar, como uma atualização otimista, e limpa o erro. |

Um resource em Rust é um handle `Copy`, assim como os signals; os membros do TSX já são vinculados, então `onRefresh={posts.refetch}` e `const loading = posts.loading` funcionam como estão.

Só o último carregamento conta. Um novo carregamento descarta o que estava em execução, e o componente deixar de existir também o descarta; no TSX, `info.signal` aborta o `fetch` que recebe. Um carregamento que termina depois de ter sido substituído não muda nada. `info.refetching` indica que `refetch()` iniciou o carregamento. `resource_with_value(value, source, fetcher)` em Rust e `{ initialValue }` no TSX dão ao resource um valor desde o início.

## cleanup

`cleanup(fn)` registra `fn` para executar antes de o effect atual executar de novo, ou quando o componente ou o effect ao qual pertence deixa de existir:

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

Em Rust, tasks, timers e intervals (`spawn`, `set_timeout`, `set_interval`) já terminam junto com o owner sob o qual foram criados, então o relógio de uma view não precisa de cleanup:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

Um effect do TSX também pode retornar seu cleanup, como no React: uma função que `fn` retorna executa nos mesmos momentos que uma passada a `cleanup`.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Um componente deixa de existir quando não é mais renderizado: seu branch `when` / `<If>` é ocultado, sua linha `each` / `<Each>` é removida ou sua página é desempilhada. Tudo o que ele criou (effects, valores computed, tasks, cleanups, componentes aninhados) é descartado junto com ele.

## batch

Cada escrita notifica seus assinantes imediatamente. Para que várias escritas contem como uma única mudança, envolva-as em `batch`: os dependentes executam uma vez, após a última escrita.

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

Os handlers de evento não são agrupados automaticamente: duas escritas em um handler de press executam duas vezes um effect que lê ambos os signals. `batch` retorna o que sua função retorna.

## untracked

`untracked(fn)` executa `fn` sem se inscrever no que ele lê. Use-o em um escopo de rastreamento para ler um valor sem depender dele:

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

O `get_untracked()` do Rust lê um único signal da mesma forma. O corpo de um componente já é untracked: ler um signal ali o lê uma vez.

## context

Um context é um valor que um componente fornece a tudo o que ele renderiza, por mais profundo que seja. Em Rust, `provide_context(value)` fornece um valor do seu tipo, e `use_context::<T>()` encontra o mais próximo; no TSX, `context(defaultValue)` cria um context, chamá-lo lê o valor fornecido mais próximo (ou o padrão), e `<Ctx.Provider value>` fornece um valor:

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

Um valor fornecido é lido uma vez, quando é consultado. Para fornecer algo que muda, forneça um signal (ou uma struct de signals) e leia-o em um binding:

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

Leia um context no corpo de um componente (ou em código que executa enquanto os componentes estão sendo criados), não em um handler de evento nem em um timer, onde não há componente a partir do qual consultá-lo. Componentes Rust também recebem o tema do app dessa forma: `theme()` de `nsh_base` ([Tema](./rust.md#theme)).

## Error boundaries

Um error boundary mantém uma falha em uma parte de uma view restrita a essa parte. Quando algo sob ele lança um erro (em Rust: entra em panic) ao renderizar ou executar, como o corpo de um componente, um binding, um effect ou um handler de evento, a parte que falhou é removida e o boundary mostra seu fallback no lugar; o resto da view permanece como está. Em Rust, é `catch_error(view, fallback)`; no TSX, `<ErrorBoundary fallback>` de `nsh`. O fallback recebe o erro (no TSX, o próprio valor lançado, geralmente um `Error`) e um reset que renderiza a view de novo:

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

Uma falha vai para o boundary mais próximo acima de onde ocorreu, e uma falha em um fallback vai para o boundary acima desse. Sem um boundary, a falha é reportada como erro não capturado (o overlay de erro de desenvolvimento, o log). No TSX, um elemento `fallback` é exibido como está (`fallback={<Text>Unavailable</Text>}`), e uma função é chamada com o erro e `reset`, quaisquer que sejam os parâmetros que ela declare.

<a id="what-runs-and-when"></a>

## O que executa e quando

| Você escreve | Executa | Executa de novo quando |
|---|---|---|
| Corpo do componente | Uma vez, quando é criado | Nunca (exceto hot reload) |
| Um binding: uma closure passada a `text`, um estilo ou uma prop em Rust; `{expr}` ou `prop={expr}` que chama ou lê uma propriedade no TSX | Uma vez, quando o elemento é criado | Um signal que ele leu muda; apenas aquela prop ou filho é atualizado |
| `computed(fn)` | Quando é criado | Um signal que ele leu muda |
| `effect(fn)` | Depois que os elementos da passada atual existem | Um signal que ele leu muda |
| `when(cond, ..)` / `<If when>` | Quando é criado | Muda o resultado da condição |
| Linha de `each(..)` / `<Each of>` | Quando sua chave aparece pela primeira vez | Nunca; em vez disso, mudam seus signals de item e de índice |

O ambiente é reativo da mesma forma: `window()`, `dark()`, `font_scale()`, `safe_area()` e `keyboard_height()` em Rust; `windowSize()`, `colorScheme()` e `fontScale()` de [`nsh`](../modules/nsh.md#device) e `safeArea()` e `keyboardFrame()` de [`nsh`](../modules/nsh.md) no TSX. Assim, os bindings que os leem acompanham a rotação, o modo escuro ou o teclado.

<a id="common-mistakes"></a>

## Erros comuns

**Ler um signal no corpo do componente e esperar atualizações.**

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

**Ler props uma só vez.** Uma prop Rust lida com `props.title.get()` no corpo é lida uma vez; leia-a em um binding (`text(props.title)`, `move || props.title.get()`). No TSX, `const { title } = props` lê `title` uma vez: leia `props.title` onde for usá-lo, ou divida as props com [`split`](./jsx-and-components.md#spreading-props).

**Mutar em vez de definir, no TSX.** `list().push(x)` altera o array, mas não notifica ninguém. Escreva um novo array, como o `update` do Rust faz por você.

**Derivar estado com effects.** `effect(() => total.set(price() * qty()))` funciona, mas deixa `total` desatualizado entre a escrita e o effect, e custa uma segunda passada. Use `computed`.

**Criar effects fora de componentes.** Effects e valores computed pertencem ao componente que os criou e são descartados junto com ele. Se forem criados em um handler de evento ou em um callback de timer, não têm owner e vivem para sempre. Crie-os no corpo de um componente e deixe que leiam os signals que mudam.

**Esperar que código assíncrono seja rastreado.** Só são rastreadas as leituras feitas de forma síncrona enquanto um effect ou um valor computed executa. Leia os signals primeiro e depois inicie o trabalho assíncrono.

<a id="related"></a>

## Relacionados

- [JSX e componentes](./jsx-and-components.md): componentes, props, `when` / `<If>` e `each` / `<Each>`, em Rust e TSX.
- [Criando com Rust](./rust.md): apps Rust, tasks e o tema.
- [Referência do módulo `nsh`](../modules/nsh.md): a assinatura de cada função TSX.
- [Animação](./animation.md): valores animados que animam na thread de UI, sem signals.
