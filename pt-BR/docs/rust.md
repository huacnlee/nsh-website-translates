---
title: "Desenvolvendo com Rust"
description: "Escreva um app Native Shell inteiramente em Rust, sem QuickJS em nenhuma plataforma, ou em Rust com telas em TSX por cima: quando escolher cada abordagem e como as duas compartilham componentes e módulos."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---


# Desenvolvendo com Rust

Apps Native Shell são escritos em Rust, em TSX ou em ambos. Os três rodam no mesmo motor: o grafo reativo, o renderizador, o layout Taffy e os módulos nativos (navegação, diálogos, o teclado, a barra de status) são Rust em todos os casos, e cada plataforma renderiza com a sua própria UI. O que muda é a linguagem do seu próprio código e, com ela, se o app carrega uma VM JavaScript.

| | Rust | TSX | Rust com TSX |
|---|---|---|---|
| Sua UI, estado e handlers | Rust | TSX no QuickJS | Componentes e módulos em Rust, telas em TSX que os usam |
| O app executa | apenas o motor e o seu crate, em todas as plataformas e no navegador | QuickJS e o motor (no navegador, o engine JavaScript dele) | QuickJS e o motor, com o seu crate (no navegador, o engine JavaScript dele) |
| Ideal para | Apps médios e grandes com lógica de negócio exigente | Apps e módulos entregues em tempo de execução, iteração rápida | Um núcleo em Rust com partes que mudam com frequência |
| Edições | Rebuild e reinício | Hot updates | Hot updates para TSX, rebuild e reinício para Rust |
| Início | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## Escolhendo

**Rust** é ideal para apps cuja lógica de negócio é grande e exigente: trading, editores, ferramentas com muitos dados. Você ganha o sistema de tipos e as verificações em tempo de compilação do Rust em todo o app, o ecossistema do crates.io, desempenho nativo para o seu próprio código (e não só para o do NSH) e testes headless da UI real com `cargo test`. O app é Rust e código nativo do início ao fim: nenhuma VM JavaScript é distribuída com ele nem roda nele, em iOS, Android, macOS, Windows, Linux, GPUI e na web. Componentes são funções que rodam uma vez e vinculam signals ao que exibem, como em TSX ([Reatividade](./reactivity.md)), escritos com estilos tipados em vez de strings de classes.

**TSX** é ideal para UI que chega depois que o app é publicado: módulos que um app nativo carrega em tempo de execução, gerados por um modelo ou escritos por outra equipe, entregues como [pacotes assinados](./signed-packages.md) e executados em um sandbox configurado pelo host, com hot updates durante o desenvolvimento.

**Rust com TSX** mantém o núcleo em Rust e adiciona TSX onde compensa: telas, configurações, onboarding, experimentos, tudo que você itera com hot updates ou entrega em tempo de execução como um [pacote assinado](./signed-packages.md). O TSX importa seus componentes e módulos Rust como qualquer módulo NSH, de modo que as duas metades se encontram em interfaces tipadas. O TSX roda no QuickJS, que o app passa a carregar.

<a id="an-app-written-in-rust"></a>

## Um app escrito em Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` contém o app: componentes, estado, handlers, tarefas.

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

Elementos e componentes são criados do mesmo modo: uma função cria cada um (`view()`, `text(..)`, o `button()` de `nsh_base`, o `chart()` do seu `#[component] fn Chart`), e seus métodos definem suas props, um setter por prop (um valor, um signal ou uma closure), e seus listeners, um método por evento. Listeners são closures do respectivo evento (`move |text: &str| ..`), e `move || ..` para um evento sem dados; `.child(..)` recebe um elemento, ou um `Option`, um `Vec`, um array ou um iterador de elementos (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` nomeia a raiz, e `nsh` a monta:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` é o caminho do componente no crate (`App`, `shell::Gallery`; no primeiro, com [vários crates](#several-crates)); `"theme"` é o [tema](#theme) com o qual seus componentes são desenhados, e `"appearance"` se aplica a ele como em um app TSX. Com isso, `nsh run` e `nsh package` no diretório do app compilam o runner próprio do app para o alvo, com a raiz montada e sem QuickJS linkado:

| Alvo | O que executa |
|---|---|
| macOS, Windows, Linux | O runner de release com o seu crate, em uma janela; `nsh run` executa um build de debug e mostra os logs do app no terminal |
| iOS, simulador do iOS, Mac Catalyst | O runner do iOS com o seu crate, em um app |
| Android | O `libnsh.so` do app com o seu crate, iniciado pela activity do runtime |
| Web | `nsh.wasm` com o motor e o seu crate (3,3 MB para toda a galeria Rust, 0,75 MB com brotli); a página monta a raiz |

`nsh` compila o que o seu crate precisa e nada além disso: um pequeno programa com o seu crate e o núcleo do NSH que descreve seus componentes e módulos para a CLI, que então faz o resto sozinha, e o runner de cada alvo que você executa ou empacota. O primeiro build de um novo app Rust compila o seu crate e o núcleo do NSH, cerca de 60 crates. `nsh test` executa os testes do app em modo headless, em um runner do seu crate construído da mesma forma.

No Linux, o seu crate seleciona recursos opcionais da plataforma. Habilite `webview` na dependência `nsh-platform-linux` para usar web views; isso linka o WebKitGTK 6.0, que precisa estar instalado para compilar e executar o app. O runner gerado herda essa escolha por meio da unificação de features do Cargo.

Durante `nsh run`, uma alteração no código Rust do crate compila o runner novamente e reinicia o app; no navegador, a página aberta carrega o novo runtime sozinha. `cargo run` inicia a mesma raiz diretamente no backend desktop (`src/main.rs`), e apps nativos que embutem o NSH montam uma raiz Rust com `AppSource::Rust` no `AppView` de macOS, Windows, Linux, GPUI e iOS.

O código para todas as plataformas, inclusive a web, usa os serviços do NSH: `fetch` para HTTP ([Rede](./networking.md#from-rust-components)), `timer`, `set_timeout` e `set_interval` para esperar, `nsh_core::time::Instant` e `nsh_core::time::unix_ms()` para o relógio. `background` e `blocking` executam trabalho nas threads dos alvos nativos.

<a id="desktop-title-bars"></a>

## Barras de título no desktop

Apps Rust desenham suas próprias barras de título com `nsh_core::element::desktop`. Chame `set_title_bar(TitleBarStyle::Hidden, Some(height))`, marque o fundo da barra com `.window_drag(true)` e reserve o espaço dos controles nativos da janela com `title_bar()`. Seu `top` é a altura da barra, e `left` e `right` são as larguras ocupadas pelos controles do sistema. Lê-lo cria uma assinatura das mudanças, incluindo a tela cheia. A plataforma cuida do arraste da janela e do comportamento de clique duplo na barra de título configurado pelo usuário; `.window_drag(false)` mantém um filho fora da região de arraste do pai.

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` restaura a barra de título do sistema. `close_window()` segue o comportamento normal de fechamento de janela do host que embute o app. O módulo tem também as outras funções da janela (`set_title`, `minimize`, `toggle_full_screen`, ...) e os menus (`set_application_menu`, `popup_menu`): [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## Arquivos e pastas

Nos desktops, o código Rust exibe os diálogos de arquivo do sistema e entrega caminhos locais ao sistema, com cada resposta aguardada em uma tarefa: `pick_paths` com um `OpenDialog` (`OpenDialog::files()`, `::folders()` ou `::files_and_folders()`), `pick_save_path` com um `SaveDialog`, `open_path` (o app padrão do arquivo), `reveal_path` (o item selecionado no Finder, no File Explorer ou no gerenciador de arquivos) e `move_to_trash` (para onde o item foi, quando o macOS informa). Os diálogos respondem `Ok(None)` quando o usuário cancela e um erro quando não podem ser exibidos (no Linux sem um portal de seletor de arquivos, e no iOS, Android e na web, onde `open_path`, `reveal_path` e `move_to_trash` também respondem com um erro). Toda requisição que falha responde com o seu erro, nunca `false`.

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## Estendendo um app Rust com TSX

A função `#[native_module("app/native")]` do crate nomeia o que o TSX pode importar: componentes (`registry.register::<Chart>()`), módulos de funções (`registry.module::<Portfolio>()`, `#[module]` em uma unit struct e seu `impl`), classes (`registry.class::<Ledger>()`, `#[class]` em uma struct e seu `impl`) e assets; o atributo também cria `pub fn registry()` na raiz do crate, o mesmo conjunto para os seus testes e outro código Rust (`my_app_native::registry()`, ao lado de `nsh_base::registry()`). Em um `impl` `#[module]` ou `#[class]`, os `pub fn`s são exportados (`pub(crate)` também); funções sem visibilidade são helpers que ficam em Rust. As declarações TypeScript delas, incluindo os comentários de documentação, são geradas a partir dos tipos Rust em `.nsh/types`, de modo que o TSX é verificado contra elas por `nsh check` e pelo seu editor:

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

Cada export é documentado em TypeScript pelo comentário de documentação do item Rust que o nomeia: um componente pelo seu `#[component] fn` (`Chart`), um módulo e uma classe pela sua struct (`Portfolio`, `Ledger`), e props, eventos, funções e membros pelos seus próprios (um setter não precisa de nenhum além do getter). Os comentários de documentação da struct `Props` e do enum de eventos, e os dos blocos `impl`, ficam em Rust; um comentário de documentação em um bloco `impl` de `#[module]` ou `#[class]` é um erro de compilação, já que o TypeScript não o mostraria. Cada comando que grava `.nsh/types` avisa sobre um export que o TSX enxerga sem comentário de documentação, nomeando-o (`Ledger.add`, `Chart.range`).

O TypeScript mostra um comentário de documentação até o seu primeiro título. Notas para quem chama de Rust, como o que `&self` toma emprestado ou por que uma função recebe `cx`, ficam sob um título, `# Rust` (ou o `# Panics` do rustdoc, `# Examples`), e permanecem na documentação Rust:

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

Props são os campos da struct `Props` do componente e eventos são as variantes do seu enum `Event` (`onSelect`), ambos em camel case. O código Rust posiciona o mesmo componente com o seu construtor, um setter por prop e um método listener por evento: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. O conteúdo, os eventos e o estado próprios de um componente Rust permanecem em Rust; o TSX passa props e ouve eventos. Uma prop de tipo errado (`level={1.5}` para uma prop `u32`) gera um aviso, como em um elemento nativo: a prop mantém o seu valor e o restante do componente é renderizado.

Uma função ou um membro executa do modo que a sua assinatura Rust indica. Uma que não é `async` executa dentro da chamada TSX e retorna o seu valor (`Portfolio.total()` é um número, `ledger.balance` uma propriedade): ela calcula e mantém estado. Uma `async fn` retorna uma Promise e executa como uma tarefa com os serviços do NSH (`fetch`, `timer`, diálogos). Uma função de módulo que recebe `cx: &mut ModuleCx` alcança a plataforma em ordem com a UI (um toast, a barra de status), e o mesmo vale para um método de ref de componente; o tipo de retorno decide o que o TSX recebe: uma que retorna `()` resulta em `void`, sem resposta (o TSX a chama e segue em frente); uma que retorna `Result<(), E>` resulta em `Promise<void>`, que é rejeitada com a mensagem do `Err` (a chamada executa junto com as mudanças da UI, depois que a chamada TSX retornou, então a Promise carrega o seu erro; uma que ninguém aguarda nem captura é registrada como [rejeição não tratada](./dev-server-and-debugging.md#logs)); uma que retorna um valor resulta em `Promise<T>`. Argumentos e resultados são tipados a partir da assinatura: números, strings, `Option`, `Vec`, suas structs `#[derive(JsObject)]` e enums `#[derive(PropEnum)]`, instâncias das suas classes e funções TSX (`Callback<A, R>`, que o Rust chama de imediato dentro de uma chamada, ou depois com `post` e `call_async`; o TS vê `(value: number) => void` para um `Callback<f64>`, e `#[args(balance)] listener: Callback<f64>` nomeia o argumento, `(balance: number) => void`). Uma função que começa a escutar se chama `on(event, listener)` e retorna `Stop` (`Stop::new(|| …)`), que o TSX recebe como uma função que a interrompe (`() => void`); ela executa uma vez, quando o TSX a chama ou quando aquilo que chamou `on` deixa de existir (um componente, ou a execução do módulo sob hot reload). O handler de um evento recebe um único objeto: o valor de uma variante é o seu campo `value`, que `#[args(price)]` na variante nomeia (`onSelect({ price })`), e `#[args(open, reason)]` nomeia os campos de uma variante com vários. Um argumento de tipo errado lança um `TypeError` na chamada, ou rejeita a Promise de uma função que retorna uma Promise; um `Err` lança (ou rejeita) com a sua mensagem. O objeto de uma classe é dono do seu valor Rust: ele é liberado quando o objeto é coletado, ou imediatamente com `ledger.dispose()` (também `using ledger = new Ledger()`). Nomeie a entrada TSX para executá-la, `nsh run App.tsx` ou `nsh package App.tsx --target …`: edições em TSX são hot updates, edições em Rust recompilam e reiniciam o app. A CLI empacota e compila o TSX por conta própria, conhecendo os exports do seu crate a partir da descrição dele; os hosts de desenvolvimento e o runner headless de `nsh test` são construídos com o seu crate e o QuickJS.

`examples/rust-exports` no repositório é a referência para exportar: um pequeno app TSX cujo crate exporta um componente (props obrigatórias, com valor padrão e opcionais, um evento, filhos), um módulo (uma função de cada tipo) e uma classe (um construtor, métodos, um getter e um setter, um estático, um membro `async`, outra instância como argumento, um callback para o qual o Rust envia mensagens, `dispose()` e `using`), cada um com um curto comentário de documentação, além de testes, em Rust e em TypeScript (`App.test.tsx`), que percorrem o app e verificam o que cada um exibe.

`examples/gallery-rs` no repositório é um app Rust completo: todo demo é Rust, `nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` executa os testes dele em modo headless, e `cargo run -p gallery-native` o inicia no backend desktop.

<a id="render-functions-and-the-apps-classes"></a>

### Funções de renderização e as classes do app

Um componente desenha conteúdo do app para valores que ele tem (uma linha dos seus dados, um bloco de código de um documento) com uma função de renderização: uma prop `Option<Renderer<T>>`, em TypeScript `(value: T) => JSX.Element`. O componente chama `render(key, value)` onde o conteúdo deve ficar e recebe uma view que ele estiliza e posiciona como qualquer outra (dentro de uma `text(..)`, uma view inline). O conteúdo é mantido por chave enquanto o valor permanece igual, e renderizado novamente quando muda. Um pai em Rust passa uma closure ao setter da prop (`quote().render_badge(|symbol| ..)`), que cria o `Renderer` dela.

Os estilos em um componente são tipados; as classes Tailwind do app chegam a uma das suas partes por meio de uma prop de classes e `.app_class(..)` no elemento dessa parte. Elas se aplicam depois dos estilos próprios do elemento, com o tema do app, `dark:` e os estados, como `class` em um elemento faz.

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`TextView` em `nsh/base` é construído assim: seus `renderCodeBlock`, `renderMath`, ... são funções de renderização, e seus `classes` são as classes do app por parte ([TextView](../elements/text-view.md)).
<a id="testing"></a>

## Testes

Os testes de um app Rust o executam em modo headless, em `cargo test` ou em `nsh test`, com o mesmo driver: no engine real, sem janela, com frames de exibição a 60 Hz, de modo que timers, tarefas e animações rodem como na tela. O driver inicia o app, mantém um modelo das views que ele mostra e executa passos (`press`, `type_text`, `submit`, `scroll`, `wait_for`) em views nomeadas por seletores (um texto, um rótulo de acessibilidade ou um test id; `text:`, `label:`, `id:`); um passo que não pode ser executado falha com os textos presentes na tela.

Em `cargo test`, `nsh_testing::Headless` (as features padrão do nsh-testing, sem QuickJS) executa a raiz (`app.screen()`: os textos na tela, os comandos que ela enviou); `EngineConfig::new` é um engine do tamanho de um celular sem mais nada configurado. `nsh test` executa testes em TypeScript ([Testing](./testing-and-trace.md)) em um runner headless construído com seus crates, onde `open(".")` inicia a raiz de um app Rust:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

Uma entrada TSX é construída com a feature `bundle` de `nsh-testing`, como `nsh run` a constrói, contra os conjuntos de UI que seus hosts oferecem: os do NSH e o `registry()` de cada crate, que `#[native_module]` gera:

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

`nsh_testing::compile_tsx` constrói a entrada uma única vez para vários testes, e `nsh_testing::start` entrega os lotes a um teste que mantém seu próprio modelo da tela. `examples/rust-exports` testa sua entrada TSX dessa forma; `examples/gallery-rs` testa sua raiz Rust em TypeScript, com um arquivo de teste para cada demo, aproximadamente.

<a id="theme"></a>

## Tema

A aparência de um app é do próprio app: o NSH fornece as primitivas e os componentes base sem estilo de `nsh_base`, e seu crate é a camada estilizada por cima, a biblioteca de componentes do próprio app ([Three layers](./architecture.md#three-layers)). Os componentes Rust obtêm suas cores, raio de borda e fontes de um tema, `theme()` a partir de `nsh_base`, de modo que um único arquivo reestiliza todos os componentes do app. Cada cor tem um valor claro e um escuro; quando o sistema troca de aparência, um binding como `.bg(move || theme().primary)` muda de cor nativamente, sem render.

O tema contém os design tokens do [shadcn/ui](https://ui.shadcn.com/docs/theming), e seu padrão é o tema `neutral` do shadcn, uma paleta em preto e branco com raio de borda de 10 pt. Para usar o seu próprio, defina `"theme"` em `nsh.json` com o caminho de um arquivo de tema, relativo a `nsh.json`, ou com o conteúdo do tema em linha:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Um arquivo de tema é o `cssVars` do shadcn, o formato dos temas e dos registry items do shadcn, de modo que um tema exportado de [shadcn's themes](https://ui.shadcn.com/themes) ou do [tweakcn](https://tweakcn.com) funciona como está. `light` define os valores da aparência clara, `dark` os da escura e `theme` os de ambas:

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- Seu tema é aplicado sobre o tema padrão, então você lista apenas o que muda. Um valor que `light` define e `dark` omite é usado em ambas as aparências.
- Os valores são escritos como em CSS. Cores são qualquer cor CSS (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`), `color-mix(in oklab, var(--primary) 80%, white)`, ou outro token da mesma aparência, `var(--primary)` (com um fallback: `var(--brand, #7c3aed)`). Comprimentos são `rem` (16 pontos) ou `px` (pontos). Fontes são listas de famílias de fontes: usa-se a primeira família que não seja genérica, e uma primeira família genérica (`system-ui`, `sans-serif`) é a fonte do sistema.
- **Seus próprios tokens.** Qualquer outro nome é um token do app, como uma variável no `@theme` do Tailwind: `"up"` acima é `theme().color("up")` em Rust, `bg-up` / `text-up/70` em classes e `token("up")` em TSX ([Theme tokens](./tailwind.md#theme-tokens)). Um número como `"radius-card": "14px"` é `theme().number("radius-card")` e `rounded-(--radius-card)`.
- O bundler valida o tema durante o build: um arquivo ausente, um JSON inválido ou um tema diferente de `cssVars` faz o build falhar com um erro `nsh.json: theme: …`.

Os tokens, com seus valores padrão claro e escuro (`neutral` do shadcn):

| Token | `theme()` | Claro | Escuro | Função |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | O fundo do app e o texto sobre ele |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Cards e superfícies agrupadas, e o texto sobre eles |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popovers, menus e tooltips, e o texto sobre eles |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | A ação principal (um botão primário) e o texto sobre ela |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Ações secundárias e o texto sobre elas |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | Superfícies discretas; texto secundário: legendas, rótulos, placeholders |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Um item com hover ou destacado, como um item de menu ou uma linha de lista, e seu texto |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Ações destrutivas e erros |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Divisores e bordas |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | A borda dos inputs |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Anéis de foco |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | o mesmo | As séries de um gráfico |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | A superfície de uma sidebar, sua ação principal, seu item destacado, bordas e anel de foco |
| `radius` | `radius` | `0.625rem` (10 pt) | | O raio de borda |
| `font-sans` | `font_sans` | a fonte do sistema | | A fonte do app: todo texto que não define uma família própria |
| `font-mono` | `font_mono` | a fonte monoespaçada do sistema | | A fonte monoespaçada: `font-mono`, código em `TextView` |

<a id="several-crates"></a>

## Vários crates

O código Rust de um app pode ser dividido em crates, cada um importado por seu próprio specifier: `"rust"` recebe uma lista de caminhos de crates, e cada crate nela tem sua própria função `#[native_module]`.

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

Todo runner e todo host vinculam todos eles, e `.nsh/types` declara cada specifier. Os crates compartilham código por meio de dependências de caminho do Cargo (`shared = { path = "../shared" }`): um crate de componentes da empresa pode ser usado por vários crates e listado por vários apps, e apenas os crates listados em `"rust"` são exportados para TSX. Cada crate listado tem seu próprio nome de pacote e seu próprio specifier; `nsh` informa um repetido com os dois caminhos que o compartilham. O `"root"` de um app Rust é um componente do primeiro crate listado. Durante `nsh run` e `nsh dev`, uma mudança em qualquer um deles, ou em um crate do qual dependam por caminho, reconstrói o app e o reinicia.

<a id="browser-apis-on-the-web"></a>

## APIs do navegador na web

Na web, um crate pode chamar as APIs do navegador (um WebSocket, `IndexedDB`, …) por meio do wasm-bindgen e de `web-sys`; `nsh` constrói o glue de que elas precisam junto com o runtime. Veja [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## Veja também

- [Project structure](./project-structure.md): todas as chaves de `nsh.json`.
- [Web](./web.md#apps-with-rust-components): apps Rust no navegador.
- [Networking](./networking.md#from-rust-components): `fetch` a partir do Rust.
- [CLI](./cli.md#nsh-init): `nsh init --template rust` e `--template mixed`.
