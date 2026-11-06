---
title: "Guias de Codificação"
description: "Convenções de arquitetura e codificação para apps e bibliotecas de componentes Native Shell mais fáceis de manter, em Rust e TSX."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---


# Guias de Codificação

Este guia descreve a arquitetura de aplicativos e os padrões de código que se mostraram duráveis em apps Native Shell. Ele é escrito tanto para engenheiros quanto para agentes de código: desenvolvedores de apps NSH (módulos TSX, componentes Rust, apps nativos que incorporam NSH) e autores de bibliotecas de componentes construídas sobre `nsh/base`. Leia primeiro os Guias de Design: a estrutura do código deve preservar a intenção do produto, não substituí-la.

Este é um guia normativo. **Deve** marca restrições de ciclo de vida, de correção ou de ecossistema; **deveria** indica a arquitetura padrão, e qualquer desvio exige um motivo concreto. O código-fonte atual, as páginas de referência e as declarações em `.nsh/types` continuam sendo a autoridade para as assinaturas exatas.

<a id="make-the-common-path-inexpensive"></a>

## Torne o caminho comum barato

**Princípio de design: escolha tipos e propriedade do framework de modo que o uso comum de componentes seja barato por padrão.** Os desenvolvedores devem poder construir e reutilizar UI sem adicionar um cache em cada ponto de chamada. Componentes que executam uma vez e [signals](./reactivity.md) lidos onde são usados são exemplos: um componente constrói sua parte da árvore uma única vez e, depois disso, apenas os bindings que leem um signal alterado são executados novamente, de modo que o caminho comum evita trabalho repetido. O grafo reativo, o renderizador, o layout e as listas são nativos, e um turno do código do app se torna um lote de operações nativas. Mesmo assim, pequenos custos se multiplicam entre elementos e atualizações, principalmente em TSX, cujo próprio código roda em um interpretador; meça os caminhos críticos excepcionais antes de adicionar caches ([Desempenho](./performance.md)). Nenhuma das escolhas promete custo zero. As [regras de propriedade de estado](#state-ownership) e as seções posteriores sobre renderização explicam a mecânica.

<a id="architecture-at-a-glance"></a>

## Arquitetura em resumo

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

As dependências apontam para baixo. As camadas superiores são donas do significado do domínio e da orquestração; as camadas inferiores são donas da apresentação ou do comportamento reutilizável. Não faça um componente reutilizável depender de uma página do app, nem uma biblioteca de componentes depender do tema de um único app ([Três camadas](./architecture.md#three-layers)).

Use estas fronteiras:

- **shell do app:** a entrada (`App.tsx`, ou `nsh.json` `"root"`) compõe a raiz e as pilhas de navegação, mantendo a lógica das páginas fora dela;
- **página:** um `NavPage` com seu conteúdo, seus diálogos e o trabalho que ela inicia;
- **componente do app:** um padrão repetido que conhece o domínio;
- **biblioteca de componentes:** UI estilizada e de uso geral, do próprio app ou da comunidade, construída sobre `nsh/base`;
- **`nsh/base`:** comportamento reutilizável sem apresentação de produto: navegação, diálogos, popovers, menus, sheets, um alvo de toque;
- **`nsh`:** as primitivas, os estilos, o layout, a reatividade e o ambiente.

<a id="lay-out-an-apps-files"></a>

### Organize os arquivos de um app

Os arquivos de um app seguem as convenções do NSH, então não há nada a configurar: `App.tsx` é a entrada e `nsh.json` fica ao lado dela; ambos são encontrados por convenção.

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` contém um arquivo por `NavPage`. Uma página só cresce para mais arquivos quando precisa.
- `components/` contém os componentes reutilizáveis do app, aqueles que várias páginas usam.
- `store.ts` contém o estado do app: seus signals e as funções que os alteram. As páginas leem os signals e chamam as funções.
- Os testes são arquivos `*.test.tsx` ao lado do que testam (`App.test.tsx`, `pages/Inbox.test.tsx`).
- `Cargo.toml` e `src/lib.rs` formam o crate do próprio app, com seus componentes Rust (`nsh.json` `"rust": "."`); seu `#[native_module]` em `src/lib.rs` nomeia o que o TSX importa. Um app escrito apenas em Rust é o mesmo projeto Cargo, com seu componente raiz em `src/lib.rs` ([Estrutura de projeto](./project-structure.md)).

O shell do app compõe as páginas, mas contém pouca lógica de página. As páginas leem os signals do store e chamam suas funções; elas nunca escrevem no estado de outra página. Mantenha os signals do store privados e exporte o que os lê e os altera, de modo que o estado mutável fique atrás de suas funções públicas:

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

Uma página pode manter o workspace e passar seu id para a busca; a busca não precisa de toda a coleção do workspace nem de seus signals privados. Um formato simples de dependências acíclicas é:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

As páginas podem depender do store e dos componentes, mas não do shell nem das partes privadas de outra página. Se uma página precisa alterar o que outra exibe, faça isso por meio do store. Essas fronteiras permitem que engenheiros diferentes ou agentes de IA trabalhem em páginas separadas em paralelo, com menos conflitos de arquivo e menos acoplamento de estado compartilhado; o store ainda exige coordenação.

<a id="bootstrap-and-root-ownership"></a>

## Bootstrap e propriedade da raiz

Monte o app uma única vez e dê à raiz a superfície inteira: uma entrada TSX chama `mount(App)`, um app Rust nomeia seu componente raiz em `nsh.json` (`"root": "App"`). A raiz preenche a superfície com `flex: 1` e um fundo vindo do tema:

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

A raiz coordena o que pertence à superfície inteira: a pilha de navegação, os diálogos, popovers, menus, sheets e tooltips exibidos sobre tudo o que está nela, e a safe area. Não monte uma segunda raiz para cada página dentro de uma mesma superfície. Uma superfície é um engine: cada `NshAppView`, `NshView` ou `AppView` que um app nativo incorpora executa sua própria VM, seu próprio estado de módulo e seu próprio grafo reativo, de modo que várias superfícies em um mesmo app host nunca compartilham estado por acidente.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## Entenda o que executa uma vez e o que executa de novo

O NSH é estado retido com construção declarativa, no modelo do Solid ([Reatividade](./reactivity.md)). Um signal sobrevive entre atualizações; o corpo de um componente descreve sua parte da árvore uma única vez, quando ele é criado. Mantenha essa distinção explícita:

| Você escreve | Executa | Executa de novo quando |
| --- | --- | --- |
| O corpo de um componente | Uma vez, quando é criado | Nunca |
| Um binding: um closure (Rust) ou uma expressão que chama ou lê uma propriedade (TSX) onde um valor é esperado | Uma vez | Um signal lido por ele muda; apenas aquela prop ou filho é atualizado |
| `computed(fn)` | Quando é criado | Um signal lido por ele muda |
| `effect(fn)` | Depois que os elementos da passagem existem | Um signal lido por ele muda |
| Uma linha de `each` / `<Each>` | Quando sua chave aparece pela primeira vez | Nunca; seus signals de item e de índice mudam |
| Uma célula de `virtual_list` / `<List>` | Uma vez por célula | Nunca; a célula recebe outras linhas |

- o componente que executa é o **owner**: effects, valores computados, tasks, timers, key bindings e cleanups criados enquanto ele executa pertencem a ele e são descartados junto com ele;
- o **contexto** (`provide_context` / `use_context`, `context()` e `<Ctx.Provider>`) dá um valor a uma subárvore sem implicar que os elementos que o leem sejam seus donos;
- o **`Scope`** de um componente Rust (`cx`) emite seus eventos e lê os insets que recebe;
- as **refs** (`element_ref()`, `ref`) nomeiam um elemento host para chamadas imperativas (`focus()`, `scroll_to()`, `measure()`);
- layout e medição são fases nativas posteriores; use `onLayout` e `measure()` somente quando a geometria resolvida for realmente necessária.

Nunca leia um contexto em um manipulador de evento ou em um timer, onde não há componente a partir do qual fazer a busca: leia-o no corpo e guarde o que ele forneceu. Retenha handles tipados (signals, resources, refs, ids de domínio), que são `Copy` em Rust e deixam de ter efeito quando seu owner desaparece.

<a id="choose-the-right-unit"></a>

## Escolha a unidade certa

<a id="use-a-plain-function-for-value-like-elements"></a>

### Use uma função simples para elementos do tipo valor

**Adote como padrão uma função simples para partes de UI leves e reutilizáveis.** O chamador fornece as props e os handlers atuais, a função devolve elementos e nada dela permanece além dos bindings que criou. Seus argumentos são suas props; o rótulo, o valor e os callbacks exibidos vêm do estado atual do chamador. Ela ainda executa uma vez, como qualquer componente: o que muda depois são seus bindings.

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### Use um componente para comportamento retido

Use um `#[component]` (ou um componente TSX que cria signals) quando uma parte da UI possui estado persistente ou um ciclo de vida independente: signals, effects, trabalho assíncrono, timers, key bindings. Crie esse estado no corpo do componente, uma única vez, nunca dentro de um binding.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

Um `#[component]` tem props tipadas (`#[derive(Props)]`) e eventos (`#[derive(Event)]`); o TSX o importa com declarações geradas a partir deles. O estado retido que o TSX usa com `new` (um ledger, um parser, uma sessão) é um `#[class]`, e as funções são um `#[module]` ([Criando com Rust](./rust.md#extending-a-rust-app-with-tsx)). Escreva em Rust as partes que o app mais usa, as bibliotecas de componentes e a lógica exigente, pois é código nativo de ponta a ponta; reserve o TSX para o que muda com frequência ou é entregue em tempo de execução.

Não transforme todo fragmento visual em um componente. As fronteiras de componentes têm custos de ciclo de vida e de coordenação; use-as onde a identidade retida importa.

<a id="elements-views-and-behavior-systems-are-different"></a>

### Elementos, views e sistemas de comportamento são diferentes

Não force todo componente em um único molde. O ecossistema contém:

- elementos semânticos como `Button`, `Switch` e `MenuItem`;
- raízes de comportamento composto como `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet` e `NavStack`;
- sistemas com estado como `Input`, `List`, `TextView` e o estado de uma pilha de navegação;
- infraestrutura como overlays e seu posicionamento, virtualização, rolagem, safe areas, o teclado e animação.

Um elemento pode ser internamente complexo e, mesmo assim, ser do tipo valor para quem o chama. Um sistema com estado pode expor funções de renderização para que os apps sejam donos da apresentação sem reimplementar o comportamento. Escolha a interface pública a partir do comportamento, não de quantas views aparecem em sua saída.

<a id="state-ownership"></a>

## Propriedade de estado

<a id="own-persistent-ui-text-with-103"></a>

### Seja dono do texto de UI persistente com `SharedString`

**Em Rust, deve-se preferir `SharedString` para o texto de UI retido entre atualizações ou closures de callback**, incluindo rótulos, títulos e placeholders de componentes: as props o recebem (`Prop<SharedString>`), e cloná-lo em um binding não copia o texto. Para um buffer de edição mutável ou um texto montado com formatação, use `String` e converta quando o resultado estiver pronto; para acesso temporário somente leitura durante uma chamada, use `&str`. Em TSX, as strings são valores do próprio app; mantenha o texto calculado a partir do estado em um `computed` ou em um closure, em vez de reconstruí-lo em vários lugares.

Para texto de resposta imutável que a UI vai reter, mantenha o valor recebido intacto e coloque o texto de apresentação derivado ou formatado em um valor de domínio separado, em vez de reescrever a resposta.

Coloque cada estado no menor owner capaz de mantê-lo correto:

- o estado de domínio pertence ao store (`store.ts`) ou ao crate do app;
- o estado transitório de view pertence ao componente que o renderiza, como um signal;
- o estado comportamental reutilizável pertence ao componente projetado para ele (um `Menu` ou `Popover` sem `open` mantém o seu próprio);
- o estado que uma subárvore compartilha é um signal fornecido por meio de [contexto](./reactivity.md#context);
- o que sobrevive a uma execução pertence ao [armazenamento](../modules/nsh.md#storage) ou a um servidor.

Prefira valores controlados para seleções e toggles comuns: passe o valor atual ao componente, receba uma solicitação de mudança, atualize o owner e os bindings acompanham. Um callback informa uma intenção; ele não deveria criar uma segunda fonte de verdade oculta.

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

Não há nada a notificar: escrever em um signal atualiza exatamente os bindings que o leem. Um componente Rust emite um evento semântico que seu owner deveria tratar com `cx.emit(..)`; um effect acompanha um signal enquanto seu owner viver. Escreva vários campos que formam uma única invariante em um único [`batch`](./reactivity.md#batch), para que effects e valores computados os vejam de uma só vez.

Um componente controlado do próprio app segue o mesmo contrato. Um stepper de quantidade, um controle de domínio escrito uma vez em Rust e usado a partir de Rust e de TSX:

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

O mesmo contrato em TSX, um componente em `components/`:

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### Mantenha os vínculos de propriedade e as assinaturas limitados

Um componente é dono do que cria, e tudo o que ele criou desaparece junto com ele: quando o ramo `<If>` é ocultado, sua linha
é removida ou sua página é desempilhada. Em Rust, tarefas, timers e intervalos (`spawn`, `set_timeout`, `set_interval`) e atalhos de
teclado (`on_key`) terminam junto com o dono sob o qual foram criados; em TSX, registre a parada com
[`cleanup`](./reactivity.md#cleanup) ou retorne-a do effect. Escutar é `on(event, listener)`
(`host.on(name, listener)`, `BackHandler.on("press", listener)`), que retorna uma função que interrompe a escuta
(`() => void`, a partir de Rust um `Stop`), e o que é registrado enquanto um componente renderiza desaparece com o componente, assim como
os atalhos de `keymap.bind`.

Quando algo continua rodando inesperadamente, inspecione primeiro os effects e valores computados criados fora de um componente (em
um manipulador de evento ou em um callback de timer eles não têm dono e vivem para sempre), os listeners registrados sem sua função de parada
e o trabalho iniciado a partir de um store que nenhum componente possui. Um carregamento `resource` descartado é abortado (`info.signal` em TSX);
ele não mantém seu componente vivo. Esses são lugares comuns para começar, não uma lista exaustiva.

Não escreva em um signal apenas porque um valor foi lido ou derivado. Evite escritas incondicionais a partir de um binding ou de um
effect que lê o mesmo signal: ele se executa novamente até que o NSH o interrompa com um erro. Um valor calculado a partir de outro
estado é um `computed`, não um effect que escreve em um segundo signal.

<a id="avoid-state-feedback-loops"></a>

### Evite loops de feedback de estado

Entrada de texto, seleção, filtros e popups controlados costumam ter dois caminhos: um dono externo atualiza o valor, e a
interação do usuário solicita um novo valor. Não envie de volta pelo callback do usuário um valor fornecido pelo dono durante a sincronização.
Leia o valor atual do dono sem rastreamento (untracked) ao tratar a ação do usuário (`props.value.get_untracked()` em Rust, como
acima; um manipulador de evento em TSX já é untracked) e compare-o com o próximo, de modo que cada mudança lógica seja reportada
uma única vez. Torne os callbacks seguros contra reentrância quando um callback puder fechar, substituir ou atualizar de forma síncrona o componente que
o invocou.

<a id="stable-identity"></a>

## Identidade estável

Uma key faz parte do comportamento. Ela dá a uma linha, uma página ou um controle repetido uma identidade estável, e decide qual deles mantém
seu estado, seu foco e suas medições quando os dados mudam.

- Use ids de domínio estáveis para linhas, abas, páginas e controles repetidos: `each(projects, |p| p.id, ..)`,
  `<Each of={projects()} key={(p) => p.id}>`, o `keyExtractor` de uma lista.
- Use o objeto dono como prefixo (namespace) nos test ids quando o mesmo controle se repete (`delete-${project.id}`).
- Nunca derive a identidade de um rótulo traduzido nem de um índice de lista mutável quando itens podem ser inseridos ou reordenados.
- Não gere uma key ou id aleatório novo durante a renderização.

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

Uma key alterada significa uma identidade de UI alterada. Trate esse reset como deliberado.

A mesma regra vale para rotas de navegação, keys de lista, keys de armazenamento e test ids. Uma rota que permanece em `setRoutes`
mantém sua página e seu estado; se dois comportamentos retidos de forma independente compartilham uma key, eles podem sobrescrever o
estado um do outro; se um comportamento muda de key a cada atualização, ele nunca acumula estado.

<a id="rendering-and-composition"></a>

## Renderização e composição

Mantenha o corpo de um componente declarativo: leia o estado atual, derive valores de apresentação e componha elementos. Mova operações de domínio,
parsing e mutações não triviais para funções nomeadas do store ou do crate do app.

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

Extraia um helper quando ele nomear uma região significativa e reduzir a quantidade de estado que o leitor precisa manter em mente de uma vez.
Extraia um novo componente quando a região tiver seu próprio contrato reutilizável ou ciclo de vida retido, e não apenas porque uma
cadeia de builders ou um bloco JSX está longo.

Use os métodos de estilo tipados e os builders dos componentes de forma consistente em Rust, e classes em TSX. Prefira
`.when(..)` / `.when_some(..)` (Rust) e `classList` (TSX) para pequenos refinamentos condicionais; use `when` / `<If>`
quando os ramos representarem interfaces substancialmente diferentes, pois um ternário dentro de uma closure reconstrói seu ramo novamente
sempre que qualquer coisa que ele leia mudar.

Componha a partir do componente semântico padrão antes de construir uma superfície personalizada. Não reproduza um menu, um popover, uma
sheet ou um diálogo a partir de views genéricas apenas para igualar uma captura de tela: `Menu`, `ContextMenu`, `Popover`, `Sheet`,
`Tooltip` e `Dialog` de `nsh/base` preservam o posicionamento, a transferência de foco, a navegação por teclado, a seleção, o estado
desabilitado, o fechamento com Escape e voltar, e o contrato de acessibilidade. Se o componente padrão não consegue expressar um
padrão válido e recorrente, melhore sua API explícita em vez de estilizar descendentes arbitrários em cada ponto de uso.

Funções de renderização fornecidas pelo código do app devem ser livres de efeitos colaterais. A linha de uma lista, o `TextView` de um `renderCodeBlock` ou os
itens de um menu podem ser executados sempre que seu dono precisar de uma célula, uma parte ou uma abertura. Elas não devem executar uma operação
de negócio, acrescentar dados nem iniciar uma assinatura sem limite.

<a id="behavior-and-presentation-boundary"></a>

## Fronteira entre comportamento e apresentação

A regra duradoura do Base é:

> O Base é dono do comportamento reutilizável e da estrutura necessária para implementá-lo. A camada de apresentação é dona da
> linguagem visual do produto.

"Sem estilo" não significa "uma view vazia". Posicionamento de overlays, navegação por teclado, edição, virtualização, navegação de volta,
fechamento e áreas seguras exigem estrutura e estado internos. Transferir esse trabalho para cada chamador não
criaria flexibilidade; duplicaria um comportamento frágil.

Por outro lado, o Base não deve escolher cores de marca, tipografia, densidade, ícones finais, variantes de componentes, strings nem
a composição da aplicação. Exponha a apresentação por meio de `class` / `style` na parte principal, `<part>Class` /
`<part>Style` para cada uma das outras partes, estilos de estado tipados (`active`, `hover`, `focus`, `selected`, `checked`, `disabled`),
slots nomeados (`trigger`, `header`, `footer`) e funções de renderização. Não inspecione descendentes arbitrários para descobrir
títulos, descrições ou botões de fechar: torne as partes semânticas explícitas e receba todo rótulo como prop ou como filho.

<a id="theme-and-styling"></a>

## Tema e estilização

Leia valores semânticos do tema e aplique o layout com os métodos de estilo tipados em Rust e classes Tailwind em TSX
([Tailwind](./tailwind.md), [tokens de tema](./tailwind.md#theme-tokens)):

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

Regras:

- não fixe no código cores de produto, raios de canto, espaçamentos nem a geometria de controles;
- o código do app não deve introduzir valores hex brutos, `rgb` / `rgba` ou `hsla`; leia uma cor semântica de `theme()` ou de uma
  classe de token (`bg-primary`), ou adicione o papel que falta ao arquivo de tema do app;
- o layout do app deve usar as escalas de espaçamento e de tipografia (`p-2`, `gap-3`, `w-64`, `text-sm`; `.p_2()`, `.gap_3()`,
  `.w_64()`, `.text_sm()`) em vez de valores arbitrários (`p-[13px]`, `px(13.0)`);
- as classes significam exatamente o que significam no Tailwind CSS v4, e os valores de estilo significam o que a
  [referência de estilos](../modules/style-reference.md) lhes atribui (os do CSS, em formas nativas: números são pontos); um
  aviso de `unknown class` é um problema a ser corrigido;
- use tokens semânticos para significado, não para a posição na paleta;
- mantenha a geometria independente de estado na cadeia comum do builder ou na string de classes;
- use `active:`, `hover:` e `focus:` (`.active(..)`, `.hover(..)`, `.focus(..)`) para estados de interação em tempo de execução;
  eles são aplicados nativamente, sem ida e volta ao código do app;
- use os estilos de estado semânticos de um componente (`selected:`, `checked:`, `disabled:`) para a aparência de marcado, selecionado, pressionado ou
  desabilitado;
- mantenha a propriedade do popup em estado explícito (`open` com `onOpenChange`) para que seu gatilho possa renderizar a aparência de aberto ou pressionado
  até o fechamento;
- mantenha as variantes de componentes poucas e significativas, em vez de adicionar uma variante para cada ponto de uso;
- vincule a estilização primária ao commit padrão real da área de decisão e à sua ação de return; não a derive
  da quantidade de ações, da frequência nem da posição na barra de ferramentas;
- mantenha as variantes de badge e alert semânticas e escassas. Metadados comuns permanecem neutros; não mapeie cada caso de enum
  ou seção para uma cor diferente apenas porque existe uma variante.

A precedência efetiva é: o estilo próprio do elemento, depois os estilos de estado, com os estados posteriores prevalecendo, e `disabled`
acima de todos. As camadas posteriores substituem apenas os campos que definem.

Prefira os tokens semânticos do tema para qualquer nova apresentação própria do app. Cada nome no arquivo de tema do app é um token, assim como
uma variável do `@theme` do Tailwind (`"up": "#16a34a"` gera `text-up`, `bg-up/30`, `token("up")` em TSX e
`theme().color("up")` em Rust), e o tema tem valores claros e escuros, de modo que um token acompanha a aparência sem nenhuma
classe `dark:`. Nomeie os tokens por papéis, não por componentes, para que não se tornem o ponto de extensão
de todo widget.

Altere o tema por meio do arquivo de tema do app (`nsh.json` `"theme"`), ou deixe que o app que o incorpora forneça o seu: classes
que nomeiam tokens e bindings Rust que leem `theme()` são reestilizados nativamente sempre que ele muda, sem nenhum JavaScript
em execução. O código que copia o valor de um token para um signal próprio deixa de acompanhá-lo.

Um anel de foco externo precisa de espaço físico. Um ancestral com `overflow: hidden` (`overflow-hidden`) o recorta. Prefira
layouts que deixem espaço; se um produto precisar recortar bastante, desenhe o estado de foco dentro do controle em vez de ocultar silenciosamente
todo o foco do teclado.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### O tamanho de texto do usuário é o zoom do app

O texto segue o tamanho de texto do usuário (Dynamic Type, a escala de fonte do Android, as configurações dos desktops): `fontScale()` em TSX,
`font_scale()` em Rust, ambos reativos. A escala tipográfica (`text-sm`, `text-base`: 16 pontos, o tamanho do corpo) define
a referência, e a configuração do usuário a escala. Isso segue deliberadamente
a parte útil do modelo do Tailwind: degraus nomeados de tipografia, espaçamento e tamanho em vez de constantes de pontos desconexas.

Deixe os contêineres de texto crescerem com o texto: dê a eles alturas mínimas e padding em vez de alturas fixas. Um componente
personalizado que combine texto escalado com geometria fixa ao redor deve documentar por que essa parte não deve crescer.

Trate todo valor de ponto arbitrário e todo construtor de cor bruta na UI do app como um problema de revisão. Aceite-os apenas para uma
fronteira física ou de plataforma documentada, geometria medida em tempo de execução, cor de raster ou de dados, ou a própria definição do tema.
Conveniência e igualar uma captura de tela não são exceções válidas.

Tudo o que for armazenado em cache a partir de um layout resolvido deve incluir a escala de fonte em sua chave de invalidação, diretamente ou por meio de uma
revisão que mude junto com ela: alturas de linha informadas a uma lista, medições de texto, geometria de popup, tamanhos de ícone derivados
do texto e métricas de canvas personalizadas.
<a id="events-commands-and-focus"></a>

## Eventos, comandos e foco

Use pressionamentos para ativação: `onPress`, `onLongPress`, `onPressDown` e `onPressUp` significam o mesmo com um dedo, uma caneta,
um mouse ou o teclado. Use handlers de toque e gestos apenas para o que acompanha o dedo (um pan, um arrasto). Use
atalhos de teclado (`keymap.bind`, `on_key`) e itens de menu para comandos que devem oferecer suporte a atalhos de teclas, menus ou
disparo a partir de várias entradas. Mantenha os handlers próximos da página que é dona do comando.

Modele cada comando lógico uma só vez. Um `Button`, um item de `Menu`, um item de `ContextMenu`, um item de menu do aplicativo de
`nsh/desktop` e um atalho de teclado devem chamar a mesma função do store, em vez de copiar cinco mutações.
Derive rótulo, ícone, atalho e estado desabilitado de uma única política de comando sempre que possível (`key_label("mod+s")`
escreve um atalho no formato da plataforma), para que os pontos de entrada não possam divergir. O menu é dono da navegação e da dispensa; a
página continua sendo dona de decidir se o comando é permitido e do que ele faz.

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

Preserve os papéis semânticos na escolha do elemento. Use `Button` para comandos, mesmo quando o tratamento desejado for discreto;
dê a ele um estilo discreto em vez de substituí-lo por um link. Os apps NSH reservam o papel `link` para destinos abertos fora
do app, como uma URL ou um endereço de e-mail; use navegação para um destino dentro do app e `Button` para um comando.

Interrompa a propagação (`stopPropagation()` em um evento de toque) somente quando uma interação aninhada precisar impedir que o elemento pai
trate o mesmo toque. Interrupções de propagação indiscriminadas quebram rolagem, pressionamentos e gestos de maneiras difíceis
de diagnosticar.

**A main thread nunca espera pelo código do app.** Quando o sistema precisa de uma resposta imediata (esta página pode ser removida da pilha, esta
sheet ou popover pode ser fechado, este texto pode mudar), o NSH responde nativamente a partir de props montadas previamente, e um evento
avisa o app depois. Portanto, uma decisão é uma prop, definida assim que é conhecida, e não um callback que retorna true ou false:
`popOnBack={!dirty()}` com `onBackPress` para confirmar ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)),
`closeOnEscape` e `closeOnBackdropPress` com `onCancel` para ser notificado da tentativa, `maxLength` em um input, `disabled` em
um botão.

O `shortcut` (`nsh/desktop`) de um item de menu vincula sua tecla enquanto o menu estiver definido, e o menu o exibe no estilo da
plataforma; um vínculo `keymap` com a mesma combinação de teclas tem precedência sobre ele. Dê a cada combinação de teclas um único dono e defina o menu
do aplicativo novamente quando seus itens ou atalhos mudarem.

Torne explícita a posse do foco:

- `Button`, `Switch` e itens de menu são pontos de parada de foco do teclado nos desktops e na web; construa controles sobre eles em vez
  de sobre views simples;
- mova o foco com o `focus()` de uma ref a partir de um evento ou de um effect que acompanhe uma mudança de estado, e mova o foco do leitor
  de tela com `set_accessibility_focus()` (Rust) ou `setAccessibilityFocus` a partir de `nsh` (TSX);
- renderize um estado `focus:` visível;
- não solicite foco incondicionalmente durante a renderização.

Widgets compostos devem implementar o modelo de navegação completo (movimento com setas, Home / End ou movimento por página quando
apropriado, confirmação, cancelamento e comportamento da tecla Tab) em vez de alguns atalhos isolados.

Overlays são dispensados a partir do topo: Escape e o botão voltar do Android vão para o overlay do topo que estiver escutando (`onCancel`).
Trate sequências rápidas de fechar e abrir sem agir sobre uma superfície intermediária que já está sendo fechada.

<a id="async-work-and-side-effects"></a>

## Trabalho assíncrono e efeitos colaterais

Inicie o trabalho assíncrono a partir de um evento, de um effect ou de um [`resource`](./reactivity.md#resource), e não como um efeito
colateral incondicional do corpo de um componente. Um effect rastreia apenas o que lê de forma síncrona: leia os signals primeiro e depois inicie
o trabalho. Quando o trabalho terminar, atualize o estado por meio de signals, aceite que o componente pode já não existir e escreva as mudanças
coerentes em conjunto.

Mantenha o trabalho recorrente sob um dono, para que o desaparecimento dele o cancele: tasks e timers de Rust terminam com seu dono, e os timers de TSX
são interrompidos em `cleanup`. Uma task única que precisa terminar de forma independente pode ser iniciada a partir do store, mas abre mão
desse cancelamento. Trate erros e requisições com falha de forma explícita.

Represente operações assíncronas com estados explícitos: o `state()` de um resource é `unresolved`, `pending`, `ready`,
`refreshing` ou `errored`. Preserve os dados anteriores utilizáveis durante a atualização: um resource mantém seu valor enquanto
carrega novamente. Evite envios destrutivos duplicados e exponha na UI os erros recuperáveis; não dependa de logs como feedback
para o usuário.

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

Tire do handler TSX o parsing ou a computação custosa: mova-o para um `computed`, para fora do caminho de interação, ou para Rust.
Os resultados podem chegar depois que a consulta, a página ou a seleção mudaram: um resource descarta carregamentos substituídos, e o trabalho
feito por você deve anexar uma revisão ou uma identidade e rejeitar resultados obsoletos, em vez de aplicá-los a um novo estado.

<a id="layout-measurement-and-scrolling"></a>

## Layout, medição e rolagem

Uma view organiza seus filhos em uma coluna, e os filhos se esticam por ela por padrão; `class="flex"` (`.flex_row()`)
é uma linha, como no CSS. Uma linha de controles precisa de seus filhos centralizados (`items-center`), o que deixa isso explícito. Uma linha de
colunas de altura total mantém o stretch padrão, de modo que a coluna preenche a altura da linha e seu cabeçalho permanece no topo:

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

A maior parte da UI deve usar layout em vez de medir por conta própria ([Layout](./layout.md)). A medição (`onLayout`, `measure()`)
é uma ferramenta de comportamento avançado para overlays, virtualização, editores, gráficos e componentes semelhantes cuja correção depende
da geometria resolvida.

- Coloque a medição e a geometria na camada que é dona do comportamento.
- Observe o layout somente quando o layout comum não conseguir expressar a relação.
- Nunca grave estado não relacionado do app a cada evento de layout.
- Trate os dados medidos como escopo de revisão; eles podem ficar obsoletos após mudanças de tamanho de texto, largura, tema ou conteúdo.
- Deixe que os overlays de `nsh/base` posicionem os popups: o posicionamento, a inversão e as margens da safe area seguem uma única política.

Para invariantes de alinhamento, prefira construção a correção: regiões irmãs devem consumir o mesmo token de espaçamento
ou o mesmo inset compartilhado, em vez de repetir literais iguais. Adicione verificações de geometria ou screenshots em uma plataforma real
(`nsh test --target`) para bordas, colunas e espaços repetidos críticos. Teste mais do que a janela padrão: um tamanho de texto grande
e a escala de exibição podem transformar coordenadas fracionárias em um deslocamento de um pixel, mesmo quando o screenshot padrão
parece alinhado.

Meça o resultado resolvido ao revisar a precisão, mas não codifique uma correção medida como um valor arbitrário.
Rastreie a divergência até padding duplicado, insets aninhados, posse da borda, métricas de fonte ou arredondamento, e então corrija o
dono estrutural.

Toda região rolável deve ter um único dono. Evite rolagem aninhada acidental no mesmo eixo. Entregue à scroll view
o elemento que é dono da página, do painel ou da lista inteira, para que seu indicador seja resolvido em relação à borda da região, e coloque o
inset do conteúdo dentro dela (`contentClass` / `contentStyle`) em vez de envolver a scroll view em um contêiner com padding. Um indicador
flutuando entre o conteúdo e o limite da página geralmente revela o dono de rolagem errado ou padding na camada errada. Mantenha distância da safe area e do teclado com `env(safe-area-inset-*)` e `env(keyboard-inset-height)` em
padding e margin (leia os valores com seus accessors), que acompanham a rotação e o teclado de forma nativa.

<a id="lists-tables-and-large-data"></a>

## Listas, tabelas e grandes volumes de dados

Use [`List`](./lists.md) (`virtual_list` em Rust) quando os dados puderem crescer além de uma coleção pequena e limitada. Mantenha a identidade da linha
separada da posição visível e evite copiar o conjunto de dados inteiro a cada atualização. Deixe a lista cuidar da
reciclagem, da coordenação da rolagem e do intervalo visível, enquanto as funções de linha cuidam da apresentação da linha.

Separe:

- dados de origem e ids de domínio;
- estado de filtragem e ordenação;
- estado de seleção;
- estado de rolagem;
- renderização das linhas.

Isso mantém as atualizações locais e evita que a árvore de views se torne o modelo de dados.

A virtualização é um contrato de comportamento, não apenas um botão de desempenho. Uma função de linha é executada uma vez por célula, e as células
são reutilizadas para outras linhas:

- **deve manter o estado por item em dados indexados por id**, e não em um signal criado dentro da linha, que viaja com a
  célula para o próximo item;
- **deve ler o item onde ele é usado**, nos bindings: um valor copiado no início da função de linha pertence à
  primeira linha que a célula exibiu;
- atualize de forma imutável em TSX (um novo array, itens inalterados reaproveitados, um item alterado como novo objeto) e forneça um
  `estimatedItemSize` próximo ao de uma linha típica;
- rolar até um item (`scrollToIndex`) funciona em coordenadas de dados, mesmo quando a maioria das linhas não existe.

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## Design de API pública

Para componentes reutilizáveis:

- as props estabelecem padrões válidos: `#[prop(default)]` ou `#[prop(default = …)]` em Rust, `??` onde a prop é lida em
  TSX;
- toda prop, evento e export tem um comentário de documentação; em Rust, ele se torna a declaração TypeScript que o TSX enxerga;
- os callbacks descrevem mudanças solicitadas e incluem detalhes do ponteiro somente quando forem significativos;
- partes, slots e funções de renderização explícitos são preferíveis a inspecionar descendentes arbitrários;
- adicionar comportamento reutilizável não deve forçar uma escolha visual no nível do produto.

Os apps são entregues aos apps host como pacotes assinados e talvez nunca sejam compilados novamente: toda versão posterior do NSH os executa
como estão. Aplique a mesma disciplina ao que um app ou uma biblioteca de componentes expõe a outros (as props
e eventos de seus componentes, os exports de seu crate, as funções que os componentes e módulos nativos de um app host recebem):

- as entradas ganham apenas membros opcionais; os tipos apenas se ampliam; padrões e comportamento permanecem (o novo comportamento é opt-in);
- uma função cujos parâmetros podem crescer recebe suas opções como um único objeto (`scrollTo({ x, y, animated })`), nunca como
  mais um parâmetro posicional; parâmetros que nunca crescerão, como o início e o fim de um intervalo, permanecem posicionais;
- um modo é uma união de strings, que pode ganhar valores, e não um booleano que mais tarde precise de um terceiro estado;
- um valor tem um único tipo: `version: string`, nunca `string | number`;
- o que uma função retorna é um objeto, que pode ganhar um campo, e não uma tupla ou um valor simples;
- uma função que retorna uma Promise reporta toda falha rejeitando-a, e uma falha que o chamador pode tratar carrega um
  `code`, como as do próprio NSH: os chamadores se ramificam por códigos, enquanto as mensagens são para pessoas e podem mudar;
- uma renomeação mantém o nome antigo como um alias `@deprecated` da mesma implementação.

Em Rust, campos privados são o padrão para estado comportamental que precisa evoluir sem quebrar os chamadores. Campos públicos
são apropriados para configuração deliberadamente em formato de registro e para dados serializados. Toda struct pública com campos públicos
deve carregar `#[non_exhaustive]` e implementar `Default`, para que os chamadores possam criar valores sem literais de struct exaustivos
e para que um campo possa ser adicionado sem quebrá-los.

Mantenha estáveis os caminhos de importação públicos ao reorganizar os internos: o especificador `#[native_module]` de um crate e seus exports,
e os exports de um módulo TSX, são o que outro código importa. Prefira a terminologia de controles da plataforma e a nomenclatura estabelecida do NSH
ao vocabulário de frameworks web.
<a id="platform-and-capability-boundaries"></a>

## Limites de plataforma e de capacidades

Não presuma que todas as plataformas oferecem os mesmos recursos. Barras de título e controles de janela, acessibilidade, área de transferência, haptics, física de rolagem, fontes e temporização podem ser diferentes. Um único bundle roda em todos os lugares ([Código específico de plataforma](./platform-specific.md)); coloque o código específico de plataforma onde o NSH oferece um lugar para ele e defina o comportamento de fallback:

- o que um elemento significa em todas as plataformas é uma prop de nível superior; um recurso de sistema próprio de uma plataforma vai em `ios={{…}}`, `android={{…}}`, `desktop={{…}}` ou `web={{…}}` (um método builder em Rust), em cada uma das plataformas que o têm, e somente o objeto da plataforma atual é aplicado;
- as APIs das plataformas móveis vêm de `nsh/mobile`, as dos desktops, de `nsh/desktop`;
- os estilos por plataforma são classes `ios:`, `android:` e `web:`.

Uma ramificação por plataforma deve preservar o contrato semântico, mesmo que a apresentação seja diferente. Por exemplo, um diálogo é uma sheet no iOS e uma camada sobre a janela nos desktops, mas o app ainda precisa de um estado de abertura coerente. Teste o comportamento compartilhado em modo headless e a parte da plataforma com `nsh test --target`. Dê a toda ramificação sobre um valor que o NSH informa (`platform.os`, um estado, um motivo) um `default`: versões futuras adicionam plataformas e casos, e um app entregue hoje roda neles ([Compatibilidade](./compatibility.md)).

Um app declara o que acessa fora da sua VM em `nsh.json` `"capabilities"`: os hosts de onde faz fetch, as páginas que uma web view exibe, a área de transferência, a barra de status ([Sandbox e Capabilities](./sandbox-and-capabilities.md)). Um app que será entregue dentro de outros apps lista exatamente o que usa e trata uma solicitação recusada como trata uma falha: um app host pode conceder menos do que o app declara. Uma chamada recusada falha com `code` `"ERR_ACCESS_DENIED"`, cujo `permission` nomeia a capacidade e cujo `resource` indica o que foi solicitado.

<a id="file-and-naming-conventions"></a>

## Convenções de arquivos e nomes

- Nomeie páginas e componentes a partir de conceitos do produto: `ProjectList`, `ProjectEditor`, `SettingsPage`.
- Nomeie os manipuladores de eventos pela intenção: `confirmDelete`, `openProject`, `onQueryChange`.
- Mantenha uma responsabilidade principal por módulo; divida um arquivo quando a propriedade do estado ou o ciclo de vida não puder mais ser compreendido sem ler comportamentos não relacionados.
- Mantenha juntos o módulo de um componente, suas props, seus eventos e seus testes focados quando eles mudam juntos.
- Documente invariantes e restrições de ciclo de vida surpreendentes; não narre chamadas óbvias de builder.
- Use `rustfmt` e satisfaça o Clippy em Rust, e `nsh check` em TSX. Evite atributos `allow` amplos que ocultem avisos não relacionados.

<a id="vocabulary-is-part-of-the-api"></a>

### O vocabulário faz parte da API

Use a mesma palavra para o mesmo conceito em todos os componentes. Antes de nomear uma prop ou um evento, procure o termo na própria API do NSH, depois no `gpui-base` do GPUI Kit, no GPUI e no `gpui-component`, e então nos controles das plataformas. O que uma primitiva exibe e as APIs globais tomam seus nomes do HTML, do DOM e do CSS (`src`, `html`, `placeholder`). Os nomes em Rust são `snake_case` e são traduzidos para `camelCase` em TSX (`on_open_change` vira `onOpenChange`); uma palavra continua sendo uma palavra (`readonly`, `multiline`).

| Conceito | Padrão de nomenclatura | Exemplo |
| --- | --- | --- |
| Um componente | Um substantivo, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| Suas props e eventos (Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| O objeto de estado de um comportamento | `<Control>State`, criado por `create<Control>` | `NavStackState`, `createNavStack` |
| Por que um valor mudou | `<Control>ChangeReason`, uma união de strings | `DialogChangeReason`: `"cancel"`, `"backdropPress"` |
| Um estado | Um adjetivo, positivo, sem o prefixo `is` | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| O que o usuário pode fazer | O adjetivo | `scrollable`, `zoomable`, `selectable`, `resizable` |
| Um recurso sem adjetivo | `<feature>Enabled` | `pagingEnabled` |
| Se uma parte é exibida | Um booleano com o nome da parte, padrão `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| Se um slot é exibido | `<slot>Visible`, padrão `true` | `headerVisible` (`header` é o slot de uma página) |
| Os estilos de uma parte | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| Os estilos de um estado | Classes `<state>Style`, `<state>:` | `activeStyle`, `disabled:` |
| Um slot | O que ele é | `header`, `footer`, `trigger`, `content`, `empty` |
| Conteúdo do app | `render<Part>` | `renderCodeBlock` |
| Uma flag de dispensa | `closeOn<Trigger>`, padrão `true` | `closeOnEscape`, `closeOnBackdropPress` |
| A mudança de um valor | `on<Value>Change({ <value>, ... })`, um objeto | `onChange({ value })`, `onOpenChange({ open, reason })` |
| Qualquer outro evento | `on<Event>`, no presente, um objeto | `onPress()`, `onSubmit({ text })` |
| Uma fase | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| O mouse sobre uma view | `Enter` / `Move` / `Leave`, os do DOM | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| Começar a escutar | `on(event, listener)`, retorna `() => void` | `host.on(name, l)`, `BackHandler.on("press", l)` |
| Um valor do ambiente | Um accessor, com `set<Value>` ao lado | `colorScheme()`, `setColorScheme` |
| Um booleano somente leitura | `is<Adjective>`, `has<Noun>` | `isAvailable` |

As props nunca são `is<Adjective>`: essa forma é para o que apenas lê um booleano (uma constante, um campo de um payload). Uma parte que é exibida recebe o nome da parte, nunca `<part>Shown`, `<part>Hidden` ou `shows<Part>`.

Um builder em Rust recebe e retorna `Self` e tem o nome da prop que define, sem `set_` (`.disabled(..)`, `.checked(..)`, `.on_change(..)`); a mutação in-place é `set_<field>` (`setRoutes`, `setColorScheme`). Um leitor booleano é `has<Noun>`, quando o valor contém algo, ou `is<Adjective>`, quando descreve um estado ou uma permissão. Prefira o adjetivo sempre que a ação tiver um: `isClosable` em vez de `canClose`, `isZoomable` em vez de `canZoom`. Quando a ação for uma locução verbal sem forma adjetiva, nomeie aquilo de que ela precisa: `hasDefinition`, não `canGoToDefinition`. Não adicione novos leitores `can`.

<a id="let-the-enclosing-name-carry-the-context"></a>

### Deixe o nome envolvente carregar o contexto

Um nome é lido dentro de algo: uma prop dentro do seu componente, um campo dentro do seu tipo. Nenhum dos dois repete o que o envolve (`contentStyle`, não `contentContainerStyle`; `backdropClass` de `Dialog`, não `dialogBackdropClass`). Mantenha os campos de um mesmo tipo no mesmo nível de abreviação.

<a id="use-precise-domain-words"></a>

### Use palavras de domínio precisas

- **selected** é pertencimento ou o item atual; **checked** e **pressed** são o valor de um checkbox ou de um toggle; **focused** é o alvo do teclado; **hovered** é a presença do ponteiro. Nunca os use de forma intercambiável.
- **open / close** é o estado de um overlay; **show / hide** é uma solicitação transitória; **expand / collapse** é estrutura.
- **disabled** bloqueia a interação; **readonly** permite selecionar e navegar, mas não editar; **loading** evita trabalho duplicado enquanto uma operação está em andamento.
- **press** é a ativação por qualquer entrada, e os eventos do NSH dizem press (`onPress`); **click** é o do mouse.
- **index** é uma posição; **id** é identidade. Não persista nem indexe dados reordenáveis por index.
- **value** é dado de domínio controlado; **state** é comportamento retido.
- **src** é o recurso que um elemento exibe (uma imagem, um vídeo, uma página); qualquer outro endereço é uma **url**.
- **role** diz o que uma escolha significa (`"cancel"`, `"destructive"`); a aparência é responsabilidade do app.

Evite nomes vagos como `data`, `item2`, `handleAction`, `updateUi`, `process`, `manager` ou `config` quando existir um termo de domínio mais específico.

<a id="type-and-module-style"></a>

### Estilo de tipos e módulos

- Os tipos em Rust são `UpperCamelCase`; módulos, funções, métodos, campos e variáveis locais são `snake_case`; constantes são `SCREAMING_SNAKE_CASE`. Nomeie os bindings de contexto como `cx`.
- Os componentes TSX e suas tags são `PascalCase`; props, funções e variáveis locais são `camelCase`. As primitivas vêm de `nsh`, os componentes base de `nsh/base`.
- Um módulo com o nome de um componente é dono da sua interface pública; divida seu estado, suas partes e seus testes em arquivos sem mudar o que os outros importam.
- Use nomes de módulo no singular para um único conceito de componente e nomes consagrados para famílias (`menu` para `Menu`, `MenuItem` e `Submenu`).
- Dê aos identificadores o sufixo `Id` e às coleções plurais significativos. Não alterne `idx`, `index` e `ix` em um mesmo subsistema.
- Nomeie predicados de forma positiva quando possível. Um estado positivo é mais fácil de compor do que vários negativos, mas mantenha termos consagrados como `disabled` onde correspondam à semântica do controle.

<a id="callback-and-event-wording"></a>

### Redação de callbacks e eventos

- Todo evento passa um objeto, mesmo com um único campo e também para a mudança de um valor, com os campos nomeados como as props que eles informam: `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`. Um campo posterior é então uma adição. Um tipo de dado da API é um campo, nunca o próprio payload (`onImagePress({ image })`); um evento sem nada a informar não passa nada.
- Nomeie o ato, não o passado nem uma solicitação: `onPress`, `onClose`, `onCancel`, `onBackPress`.
- Nomeie a intenção em vez da geometria quando o ato tem um nome: `onLoadMore`, não "o fim foi alcançado".
- Os pares de ciclo de vida são `onOpen` / `onClose`; as fases são `Start` / `End`, nunca `Begin`; o mouse sobre uma view é `onMouseEnter` / `onMouseMove` / `onMouseLeave` (os nomes do DOM), um arquivo arrastado sobre ela é `Enter` / `Leave`.
- Documente se um callback roda antes ou depois da mudança do estado do próprio componente e se ele pode reentrar no componente.

<a id="documentation-and-copy-style"></a>

### Estilo de documentação e de texto

A documentação pública deve começar pelo que um componente faz e por quem é dono do seu estado. Os exemplos devem usar APIs atuais e mostrar ids estáveis. Documente padrões, diferenças entre plataformas, comportamento de foco, ordem dos callbacks e quais props a main thread lê nativamente.

Siga as regras de linguagem da interface dos Design Guides para rótulos, comandos, diálogos de confirmação, capitalização e reticências. Mantenha um termo canônico para cada objeto de domínio, comando e estado.

As chaves de tradução descrevem uma intenção estável (`dialog.deleteProject.title`), não uma frase no idioma de origem nem uma coordenada de tela. Nunca monte uma frase a partir de fragmentos traduzidos nem reutilize uma chave para significados que por acaso compartilham o mesmo texto em inglês.

Localize a intenção, não a sintaxe. Dê a cada locale controle sobre a ordem das palavras, a pluralização, a pontuação e a quantidade de contexto de que precisa. Os testes devem detectar chaves ausentes e termos fixos inconsistentes; a revisão humana ainda decide se a repetição se justifica pelo contexto. Verifique cada string dentro do seu componente com conteúdo realista, expansão de texto e um tamanho de texto grande.

<a id="testing-strategy"></a>

## Estratégia de testes

Teste na camada mais baixa que consiga provar o comportamento ([Testes](./testing-and-trace.md)):

1. testes puros para transições de estado, formatação, parsing e ordenação (`cargo test` das funções de um crate, um arquivo de teste das funções do store);
2. testes headless de app para componentes, eventos e tempos de vida: o engine, o renderer, o layout e as listas reais, com frames de exibição a 60 Hz, em `nsh test` (`nsh/test`) ou `cargo test` (`nsh_testing::Headless`);
3. testes de interação para foco, teclado, ponteiro, layout e estado renderizado, com os passos que um usuário executa (`press`, `type`, `scroll`, `drag`, `keyboard.press`), em modo headless e em uma plataforma real (`nsh test --target macos`, `ios`, `android`, `web`, ...);
4. testes smoke de exemplos ou de apps para fluxos de trabalho completos, e `nsh test --trace` para o custo de uma interação.

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

Para um componente interativo, cubra o contrato semântico em vez dos detalhes de implementação: ativação por press e por teclado, mudanças de valor controlado, comportamento desabilitado, movimento de foco, contagem e ordem dos eventos, identidade estável e estados vazios ou de falha importantes. Simule a rede (rotas de `network`) e controle o tempo (um relógio manual) em vez de esperar pelos reais. Adicione um teste de regressão antes de corrigir um bug sempre que a falha puder ser reproduzida de forma determinística.

Encontre views como um usuário faz: por role e nome, rótulo ou texto (`role:button[Save]`, `label:Close`), e por um `testID` estável quando nada mais as nomeia. Os seletores são lidos novamente a cada passo, de modo que um passo nunca age sobre um snapshot obsoleto. Use screenshots (`app.screenshot`, em uma plataforma real) para fatos visuais que os seletores não conseguem expressar; use coordenadas apenas como último recurso. Relate separadamente as evidências automatizadas e as manuais.

<a id="performance-rules"></a>

## Regras de desempenho

- Não escreva estado incondicionalmente a partir de um binding ou de um effect que o lê.
- Evite criar signals, effects, key bindings e estruturas de dados caras dentro de bindings ou de funções de linha.
- Leia signals em bindings, para que uma mudança coerente atualize a menor parte possível da árvore.
- Use `List` para coleções longas e renderize apenas o intervalo visível.
- Evite clonar strings ou coleções grandes apenas para satisfazer uma closure; capture handles `Copy` ou dados compartilhados (`SharedString`, `Rc`).
- Mantenha leves os handlers e os valores computados em TSX; mova o trabalho pesado para fora do caminho da interação ou para o Rust.
- Meça com `nsh test --trace` antes de adicionar caches. Um cache deve ter um responsável claro pela invalidação.
- Mantenha o trabalho de animação limitado: valores animados na thread de UI em vez de signals escritos a cada frame, `scrollValue` em vez de um listener de rolagem ([Animação](./animation.md)), e respeite o movimento reduzido (`reduceMotion()`).
<a id="common-failure-modes"></a>

## Modos de falha comuns

Evite estes padrões:

- um único signal contendo o estado não relacionado do app;
- lógica de negócio e requisições de rede embutidas no corpo de um componente longo;
- chaves aleatórias ou baseadas em índice para conteúdo reordenável;
- estado por linha em signals criados dentro de uma linha `List`;
- ler uma prop ou um signal no corpo de um componente e esperar que ele seja atualizado;
- cores e raios literais que quebram temas personalizados e o modo escuro;
- views pressionáveis personalizadas quando um componente semântico já oferece foco, teclado, estado desabilitado e comportamento de acessibilidade;
- estado local duplicado que diverge de um valor controlado;
- effects que copiam um signal para outro e escritas que entram em loop através de um binding;
- uma decisão de que o sistema precisa na hora deixada para um callback, em vez de uma prop definida antecipadamente;
- scroll views aninhadas sem um responsável explícito;
- uma nova variante de componente para uma tela pontual;
- diálogos de confirmação para ações reversíveis e de baixo risco;
- testes que chamam funções internas, mas nunca pressionam, digitam nem rolam.

<a id="rules-for-coding-agents"></a>

## Regras para agentes de código

Antes de editar, um agente deve ler a implementação mais próxima, seus testes, as exportações públicas do módulo e a página de referência relevante. Ele deve pesquisar o código-fonte atual e `.nsh/types` em busca de assinaturas, em vez de traduzir por analogia um exemplo de React, React Native, CSS ou GPUI: os componentes do NSH são executados uma vez, e os bindings acompanham os signals que leem.

Para cada alteração, o agente deve ser capaz de nomear:

1. o responsável pelo comportamento e o responsável pela apresentação;
2. a identidade retida e o ciclo de vida do estado;
3. o contrato de pressionar, teclado, foco e acessibilidade;
4. o responsável pelo layout e pela rolagem;
5. os tokens de tema e as exceções intencionais;
6. o teste que falharia se o comportamento regredisse.

O código gerado deve ser revisado e testado por uma pessoa. "Compila" não é um critério de qualidade de UI, e uma refatoração ampla que apenas deixa o código gerado com aparência organizada não substitui a adequação à arquitetura do app.

<a id="implementation-checklist"></a>

## Checklist de implementação

Antes de abrir uma alteração para revisão, confirme que:

- a propriedade do estado e dos efeitos colaterais está explícita;
- a escolha entre uma função simples e um componente é deliberada, e props e signals são lidos onde são usados;
- elementos repetidos têm chaves estáveis baseadas no domínio e test ids estáveis;
- tokens de tema e a escala do Tailwind substituem literais visuais isolados;
- pressionar, atalhos de teclado, foco, estado desabilitado e overlays funcionam em conjunto;
- as decisões de que o sistema precisa na hora são props, definidas antecipadamente;
- os caminhos de carregamento, vazio, erro e cancelamento estão representados;
- conjuntos de dados longos usam `List`, com o estado por item mantido nos dados;
- adições à API pública apenas ampliam e preservam a direção das dependências e o encapsulamento;
- os testes comprovam o comportamento na camada apropriada, de forma headless e nas plataformas afetadas pela alteração;
- formatação, Clippy, `nsh check`, testes direcionados e exemplos relevantes passam.

Consulte [Primeiros passos](./getting-started.md) para a configuração do app, e as referências de [Elements](../elements/index.md) e [API](../modules/index.md) para detalhes atuais da API.
