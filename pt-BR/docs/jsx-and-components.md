---
title: "JSX e componentes"
description: "Como o NSH descreve a UI em Rust e em TSX - elementos, componentes, props, filhos, fluxo de controle, refs e spreads - e como o compilador JSX e os builders do Rust criam os mesmos elementos nativos."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---


# JSX e componentes

Apps NSH descrevem sua UI com elementos e componentes, em Rust ou em TSX. Rust constrói elementos com funções e métodos builder tipados (`view().gap_4().child(..)`); TSX os escreve como JSX, que o compilador do NSH transforma em chamadas diretas ao mesmo renderizador nativo, sem React e sem DOM virtual. Em ambos os casos, um componente é uma função que executa uma vez para construir sua parte da árvore. O que mantém a UI atualizada depois disso é a [reatividade](./reactivity.md): os bindings que leem signals são acompanhados nativamente, e somente eles executam novamente.

<a id="elements"></a>

## Elementos

Cada um dos **elementos host** é sustentado por uma view nativa. Rust os cria com as funções do prelude; TSX os importa de `nsh` como componentes, e somente `If` e `Each` são globais que não precisam de import:

| Rust | TSX | View nativa | Página |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: uma caixa para layout, estilo e toques | [View](../elements/view.md) |
| `text(..)` | `<Text>` | Uma view de texto nativa; elementos de texto aninhados são spans | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | Uma view de imagem (assets locais e URLs) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | Uma lista virtualizada com reciclagem | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | Um desenho, uma página web, um player de vídeo | [Elementos](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` de `nsh/base` | Uma camada apresentada | [Elementos](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Controle de fluxo, sem view própria | [Controle de fluxo](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

Em Rust, os estilos são métodos tipados com os mesmos nomes das utilities do Tailwind (`.px_4()`, `.rounded_lg()`, `.bg(..)`), e
os listeners também são métodos (`.on_press(..)`); configurações exclusivas de plataforma têm métodos próprios. Em TSX, as props mantêm
seus nomes em camelCase (`onPress`, `allowFontScaling`, `backgroundColor`); todo elemento aceita `style`, `class` /
`classList` ([Tailwind](./tailwind.md)), `ref`, handlers de toque, props de acessibilidade e `testID`, e as props
exclusivas de plataforma vão em `ios={{…}}` e `android={{…}}`, onde apenas o objeto da plataforma atual é enviado:

```rust tabs
view()
    .rounded(px(12.0))
    .bg(move || theme().background)
    .on_press(move || open.set(true))
    .child(text("Open").font_weight(FontWeight::SEMIBOLD))
```

```tsx tabs
<View android={{ elevation: 4, ripple: { color: "#0001" } }} style={{ borderRadius: 12 }} onPress={() => open.set(true)}>
  <Text style={{ fontWeight: "600" }}>Open</Text>
</View>
```

As tags TSX são em PascalCase para que o TypeScript verifique cada uma contra o binding que ela nomeia: uma tag em minúsculas é verificada contra um único tipo global por nome, de modo que um componente genérico como `List` ou `Each` não conseguiria inferir o tipo de suas linhas a partir de `each` / `of`, e os componentes do próprio app não seriam tipados de forma alguma. Os imports não têm custo em tempo de execução: o compilador reconhece as primitivas por meio de seus imports (aliases também) e cria o elemento nativo no lugar, de modo que `<View>` é uma chamada direta ao renderizador e o import é removido do bundle. Uma tag em minúsculas é um erro de build que informa o que escrever:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> O texto só é exibido dentro de um elemento de texto: `text(..)` em Rust, `<Text>` em TSX. Uma string diretamente em um `<View>` não cria nenhuma view nativa e não é exibida.

<a id="components"></a>

## Componentes

A aparência de um app é do próprio app. O NSH oferece duas camadas: as primitivas (os elementos acima, estilos, classes Tailwind) e os componentes base sem estilo de [`nsh/base`](../modules/nsh-base.md) (`nsh_base` em Rust), que cuidam de comportamentos como navegação, diálogos, teclado, barra de status e safe areas. A terceira camada, a biblioteca de componentes, é sua: botões, cards e todas as outras peças da sua UI são componentes que você escreve sobre essas duas camadas, no crate do seu app ([Construindo com Rust](./rust.md)) ou em TSX, ou uma biblioteca da comunidade ([Três camadas](./architecture.md#three-layers)).

Um componente Rust é um `#[component] fn` que recebe sua struct de props (e, quando tem eventos, um `Scope` para emiti-los) e retorna seus elementos. `#[component]` também cria seu construtor, o nome da função em snake case: `Badge` é posicionado com `badge()`, assim como `view()` posiciona uma view, com um setter por prop (`.label(..)`, `.color(..)`: um valor, um signal ou uma closure). Um componente TSX é uma função que recebe um objeto de props e retorna JSX:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct BadgeProps {
    /// The text.
    pub label: Prop<SharedString>,
    /// The background (light blue when left out).
    #[prop(default = Hsla::from(rgb(0xddf4ff)))]
    pub color: Prop<Hsla>,
}

/// A small rounded label.
#[component]
pub fn Badge(props: BadgeProps) -> impl IntoElement {
    view()
        .rounded_full()
        .px(px(10.0))
        .py_1()
        .bg(move || props.color.get())
        .child(text(props.label).text_size(px(13.0)).font_weight(FontWeight::SEMIBOLD))
}

// Placed in another component's view:
badge()
    .label(move || format!("{} new", unread.get()))
    .color(rgb(0xfff8c5))
```

```tsx tabs
function Badge(props: { label: string; color?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: props.color ?? "#ddf4ff" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" }}>{props.label}</Text>
    </View>
  );
}

<Badge label={`${unread()} new`} color="#fff8c5" />
```

A função executa **uma vez**, quando o componente é criado, e não rastreia o que lê: não há re-renderização. O código em seu corpo (criar signals, iniciar effects, calcular constantes) executa uma única vez. Os elementos que ela retorna permanecem conectados às props e aos signals que leem, de modo que `Badge` acima atualiza seu texto sempre que `unread` muda, sem executar `Badge` novamente.

Escreva um `#[component]` quando a UI tiver props ou eventos próprios, ou quando uma entrada TSX o importar: um componente Rust é registrado sob seu tipo (`registry.register::<Badge>()`), com props tipadas a partir da struct ([Construindo com Rust](./rust.md#extending-a-rust-app-with-tsx)). Para um trecho de UI usado apenas por Rust, basta uma função simples que retorne `impl IntoElement`, com os argumentos sendo as props. Em TSX, um componente pode retornar um elemento, uma string ou número, um array, `null`, ou uma função que retorne qualquer um destes (que o renderizador acompanha); o tipo `Component<P>` de `nsh` descreve um deles:

```rust tabs
fn row(title: impl Into<SharedString>, content: impl IntoElement) -> impl IntoElement {
    view()
        .flex_row()
        .gap_2()
        .child(text(title.into()))
        .child(content)
}
```

```tsx tabs
import type { Component, JSX } from "nsh";
import { Text, View } from "nsh";

const Row: Component<{ title: string; children?: JSX.Element }> = (props) => (
  <View style={{ flexDirection: "row", gap: 8 }}>
    <Text>{props.title}</Text>
    {props.children}
  </View>
);
```

<a id="what-runs-again"></a>

### O que executa novamente

Um valor passado a um elemento é definido uma vez; um binding acompanha o que lê. Em Rust, um binding é uma closure (ou um signal, um memo, uma prop) passada onde um valor vai. Em TSX, o compilador decide para cada expressão no JSX: uma expressão muda quando **chama uma função ou lê uma propriedade** (fora de funções aninhadas), e todo o resto é definido uma vez:

```rust tabs
text(move || format!("{}", count.get()))     // follows count
text(props.title)                            // follows the prop
text(label.clone())                          // a plain value: set once
view().opacity(move || if busy.get() { 0.5_f32 } else { 1.0 })   // follows busy
```

```tsx tabs
<Text>{count()}</Text>              // follows count
<Text>{props.title}</Text>          // follows the prop
<Text>{user.name}</Text>            // re-read when something it depends on changes
<Text>{label}</Text>                // a plain variable: set once
<View style={{ opacity: busy() ? 0.5 : 1 }} />   // the style object is rebuilt when busy changes
```

Uma prop ou filho que muda é um pequeno effect nativo que define aquela prop ou substitui aquele filho. Em Rust, os estilos passam por diff, de modo que um estilo que muda envia apenas as propriedades que mudaram.

Handlers de eventos são definidos uma vez: uma closure em Rust, uma função ou um nome em TSX (`onPress={() => …}`, `onPress={save}`). Em TSX, as demais expressões são acompanhadas (`onPress={props.onPress}` acompanha a prop).

### Props

As props de um componente Rust são os campos de sua struct `#[derive(Props)]`, cada um um `Prop<T>`: um valor, ou um binding que o pai passou. Leia um deles em um binding (`text(props.title)`, `move || props.title.get()`) para acompanhá-lo; `props.title.get()` no corpo o lê uma vez. Campos com `#[prop(default)]` ou `#[prop(default = …)]`, e `Option`s, são opcionais. O construtor inicia cada prop com seu valor padrão, e o pai chama os setters das que precisa: `badge().label("New")`.

Uma prop TSX que recebe uma expressão que muda é passada como um getter: ler `props.title` o chama, o que permite que o JSX que a lê a acompanhe. Props estáticas são valores simples. Em ambos os casos, as props são lidas onde são usadas:

```rust tabs
// Wrong: reads the prop once, when the component runs.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    let content = props.text.get();
    text(content)
}

// Right: binds the text to the prop.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    text(props.text)
}
```

```tsx tabs
// Wrong: reads the prop once, when the component runs.
function Title(props: { text: string }) {
  const { text } = props;
  return <Text>{text}</Text>;
}

// Right: reads it in JSX, which follows it.
function Title(props: { text: string }) {
  return <Text>{props.text}</Text>;
}
```

Um componente TSX que desestrutura suas props no parâmetro, `function Title({ text }: …)`, as lê da mesma forma, uma única vez, e o build avisa disso indicando as props a ler no lugar:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

Uma prop que o componente quer apenas uma vez, como um id com o qual ele começa, é lida no corpo (`props.id.get_untracked()`, `const { id } = props;`), o que deixa isso explícito.

Em TSX, o mesmo vale para valores padrão: escreva `props.color ?? "#ddf4ff"` no JSX em vez de desestruturar com um valor padrão. Para calcular algo a partir de props, use uma closure ou [`computed`](./reactivity.md#computed):

```rust tabs
#[component]
fn Price(props: PriceProps) -> impl IntoElement {
    let formatted = move || format!("${:.2}", props.cents.get() as f64 / 100.0);
    text(formatted)
}
```

```tsx tabs
function Price(props: { cents: number }) {
  const formatted = () => `$${(props.cents / 100).toFixed(2)}`;
  return <Text>{formatted()}</Text>;
}
```

<a id="children"></a>

### Filhos

O que um pai coloca em um componente chega como seus filhos: um campo `children: Prop<Children>` em Rust, que o pai preenche com `.child(..)`; `props.children` em TSX, um getter que constrói esses elementos quando lido:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct CardProps {
    /// The title.
    pub title: Prop<SharedString>,
    /// The content.
    pub children: Prop<Children>,
}

#[component]
pub fn Card(props: CardProps) -> impl IntoElement {
    view()
        .p(px(14.0))
        .rounded(px(12.0))
        .bg(move || theme().background)
        .gap_2()
        .child(text(props.title).font_weight(FontWeight::SEMIBOLD))
        .child(props.children)
}

card()
    .title("Account")
    .child(text(move || format!("Signed in as {}", user.get().name)))
```

```tsx tabs
function Card(props: { title: string; children?: JSX.Element }) {
  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#ffffff", gap: 8 }}>
      <Text style={{ fontWeight: "600" }}>{props.title}</Text>
      {props.children}
    </View>
  );
}

<Card title="Account">
  <Text>Signed in as {user().name}</Text>
</Card>
```

Em TSX, cada leitura de `props.children` constrói os filhos novamente (novas views nativas): leia-o uma vez, no lugar onde os filhos devem ficar. Entre vários filhos, aquele que muda (um `<If>`, um `<Each>`, `{cond() ? a : b}`) chega como uma função, e `{props.children}` atualiza somente esse: seus irmãos mantêm suas views, e um input mantém seu texto e foco. Fragments (`<>…</>`) agrupam elementos sem uma view.

Filhos também podem ser criados por uma função que o componente chama com argumentos, um render callback:

```rust tabs
fn repeat<E: IntoElement>(times: usize, row: impl Fn(usize) -> E) -> impl IntoElement {
    view().child((0..times).map(row))
}

repeat(3, |i| text(format!("Row {i}")))
```

```tsx tabs
function Repeat(props: { times: number; children: (i: number) => JSX.Element }) {
  return <View>{Array.from({ length: props.times }, (_, i) => props.children(i))}</View>;
}

<Repeat times={3}>{(i) => <Text>Row {i}</Text>}</Repeat>
```

<a id="control-flow"></a>

## Controle de fluxo

`when` e `each` em Rust, `<If>` e `<Each>` em TSX, são controles de fluxo embutidos. Eles não renderizam nenhuma view própria.

```rust tabs
when(move || user.get().is_some(), move || {
    text(move || format!("Hello, {}", user.get().map(|u| u.name).unwrap_or_default()))
})
.otherwise(|| text("Signed out"))

each(todos, |todo| todo.id, |todo, index| {
    text(move || format!("{}. {}", index.get() + 1, todo.get().title))
})
```

```tsx tabs
<If when={user()} else={<Text>Signed out</Text>}>
  {(u) => <Text>Hello, {u().name}</Text>}
</If>

<Each of={todos()} key={(t) => t.id}>
  {(todo, index) => (
    <Text>
      {index() + 1}. {todo().title}
    </Text>
  )}
</Each>
```

- **`when`** / **`<If>`** mostra seu ramo enquanto a condição for verdadeira, e caso contrário o ramo `otherwise` / `else`. Ele renderiza um ramo novamente apenas quando muda se a condição é verdadeira, e não toda vez que a condição é reavaliada. Em TSX, um filho função recebe um accessor do valor de `when`, tipado sem `null` e `undefined`: `u()` é o usuário enquanto o ramo é exibido, e o acompanha quando ele muda.
- **`each`** / **`<Each>`** renderiza uma linha por item, criada pela sua função de linha. As linhas são mantidas por chave (Rust: a função de chave; TSX: `key`, por padrão o próprio item, objetos por identidade e primitivos por valor): quando a lista muda, as linhas mantidas são movidas em vez de reconstruídas, e novas linhas são criadas apenas para chaves novas. A função de linha recebe **signals** do item e de seu índice (`todo.get()` e `index.get()` em Rust, `todo()` e `index()` em TSX), porque o item e a posição de uma linha mantida podem mudar. Em TSX, `key="index"` (ou `key={(item, i) => i}`) mantém as linhas por posição: uma lista de strings que muda no lugar, como texto recebido em streaming, mantém suas linhas e apenas o `item()` delas muda.

Uma escolha feita em uma closure (`dynamic(move || if busy.get() { … } else { … })` em Rust, um ternário ou `&&` em TSX) constrói seu ramo novamente toda vez que qualquer coisa que ela lê muda. Prefira `when` / `<If>` quando um ramo tiver mais do que alguns elementos.

Para listas longas ou infinitas, use [`List`](./lists.md) (`virtual_list` em Rust): ele cria views apenas para as linhas na tela e as recicla. Veja [Controle de fluxo](../elements/control-flow.md) para os detalhes.

## Refs

Um ref nomeia um elemento host para chamadas imperativas: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([onde uma view está](./touch-and-gestures.md#where-a-view-is-measure)), ... Em Rust, `element_ref()` cria um e `.element_ref(&handle)` o coloca em um elemento; em TSX, `ref` fornece o ref do elemento, cujo tipo é o do próprio elemento (`InputRef` aqui, `ViewRef` para um `View`; veja [métodos de ref](../elements/index.md#ref-methods)):

```rust tabs
fn search() -> impl IntoElement {
    let field = element_ref();
    view()
        .child(input().element_ref(&field).placeholder("Search"))
        .child(text("Focus").on_press(move || field.focus()))
}
```

```tsx tabs
import type { InputRef } from "nsh";
import { Text, View } from "nsh";
import { Input } from "nsh/base";

function Search() {
  let input: InputRef | undefined;
  return (
    <View>
      <Input ref={input} placeholder="Search" />
      <View onPress={() => input?.focus()}>
        <Text>Focus</Text>
      </View>
    </View>
  );
}
```

Um ref Rust é um handle `Copy`; suas chamadas vão para o elemento que o carrega, e não fazem nada quando seu dono deixa de existir. Em TSX, aquilo que `ref={…}` nomeia recebe o nó:

- uma variável declarada com `let` o recebe por atribuição;
- um campo (`ref={refs.input}`, `ref={refs[name]}`) o recebe por atribuição;
- um [signal](./reactivity.md) é definido com ele, de modo que o que lê o signal o acompanha;
- uma função é chamada com ele (`<Scroll ref={(node) => (scroller = node)} />`).

Um `const` ou um import guarda um signal ou uma função, como em `const input = signal<InputRef>()` com `<Input ref={input} />` e `input()?.focus()`; um que guarde qualquer outra coisa é reportado quando o elemento é criado, com o que escrever.

O ref é definido quando o elemento é criado, antes de o componente retornar, de modo que está disponível em [effects](./reactivity.md#effect) e em handlers de eventos. As chamadas são enviadas à view em ordem, junto com as mudanças feitas antes delas. Os componentes base e os componentes Rust do seu próprio crate também aceitam `ref` (em Rust `component_ref()`, colocado no elemento com `.component_ref(&r)`: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## Espalhando props

Em Rust, um pai chama os setters das props de que precisa e as demais mantêm seus valores padrão, e um wrapper repassa seus próprios `Prop`s como estão (`card().title(props.title)`): um `Prop` continua acompanhando o que recebeu.

Em TSX, espalhe um objeto de props em um elemento ou componente com `{...props}`. Getters continuam sendo getters, de modo que as props espalhadas continuam acompanhando o que leem. Para ficar com algumas props e repassar o resto, use `split`:

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function Field(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} {...rest} />
    </View>
  );
}

<Field label="Email" value={email()} onChange={({ value }) => email.set(value)} keyboardType="email-address" />
```

`split(props, keys)` retorna `[picked, rest]`, ambos ainda lendo diretamente das props originais (desestruturar `{ label, ...rest } = props` leria cada prop uma vez). As props de elemento que vêm depois no JSX prevalecem sobre as anteriores.

`<If>` e `<Each>` não aceitam props espalhadas, e filhos espalhados (`{...items}`) não são suportados: use `<Each>` ou uma expressão de array.

<a id="tags-and-names"></a>

## Tags e nomes

Um elemento Rust é o que quer que o código chame: a função de uma primitiva, o construtor de um componente (`badge()`, `nsh_base::button()`), ou uma função sua. Uma tag TSX nomeia um binding no escopo, como de costume: `<Badge />`, `<Theme.Provider>`, um `<Button>` seu. Uma tag que não nomeia nada no escopo é um erro de build, exceto `<If>` e `<Each>`, que são globais.

```rust tabs
/// The app's button: a press target styled by the app.
fn primary_button(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_5()
        .py_3()
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text(title).text_base().font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

primary_button("Save", save)
```

```tsx tabs
import { Text, View } from "nsh";

function Button(props: { title: string; onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} role="button" class="rounded-lg bg-blue-600 px-5 py-3">
      <Text class="text-base font-semibold text-white">{props.title}</Text>
    </View>
  );
}

<Button title="Save" onPress={save} />
```

`nsh_base` e seu `Button` (`button()` em Rust, `<Button>` de `nsh/base`) é o alvo de pressionamento sem estilo, com os estados desabilitado e selecionado e sua acessibilidade; o app lhe dá a aparência: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

Em TSX, seus bindings prevalecem sobre os globais: um componente chamado `Each` no escopo faz de `<Each>` esse componente. Uma primitiva é reconhecida pelo seu import, de modo que `import { View as Box } from "nsh"` faz de `<Box>` uma view, e um componente seu chamado `Text` é apenas o seu componente. As primitivas também são componentes de verdade: `const Tag = inline ? Text : View;` e depois `<Tag>…</Tag>` funciona.

Os componentes são tipados por suas próprias declarações: as structs de props do Rust são verificadas pelo compilador, e o TypeScript verifica as props de um componente TSX onde quer que ele seja usado, sem nada a gerar. Um componente Rust que uma entrada TSX importa recebe declarações TypeScript geradas a partir de sua struct.

<a id="mounting-and-the-root"></a>

## Montagem e raiz

A raiz de um app Rust é o componente que `nsh.json` nomeia em `"root"`; `nsh run` e `nsh package` o montam. Uma entrada TSX chama `mount(App)` para renderizar o componente raiz (`mount(App, props)` lhe passa props). A view raiz preenche a superfície (a janela, ou a view em que um app embute o NSH). Dê à raiz `flex: 1` para que ela preencha a tela, e uma cor de fundo: o fundo da própria superfície depende da plataforma.

```rust tabs
// nsh.json: { "rust": ".", "root": "App" }
#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(home())
}
```

```tsx tabs
mount(() => (
  <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <App />
  </View>
));
```
<a id="related"></a>

## Relacionado

- [Reatividade](./reactivity.md): signals, effects, context.
- [Elementos](../elements/index.md): todos os elementos host e suas props.
- [Estilização](./styling.md) e [Tailwind](./tailwind.md): a aparência dos seus componentes.
- [Building with Rust](./rust.md): apps em Rust, componentes no crate do seu próprio app e TSX por cima.
