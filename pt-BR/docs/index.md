---
title: "Introdução"
description: "O que é o Native Shell: um framework de UI nativa com foco em Rust para iOS, Android, macOS, Windows, Linux e a web, com a interface e a interação próprias de cada plataforma."
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---


# Introdução

Native Shell (NSH, para abreviar) é um framework de UI nativa para todas as plataformas. Você cria um app uma vez, com um único modelo de app (componentes, signals, estilos e a mesma API em todos os lugares), e o NSH o executa em **iOS, Android, macOS, Windows, Linux e na web**, sempre como um app daquela plataforma: feito com as próprias views, editado com o próprio sistema de texto, usado do jeito que seus usuários esperam. Escreva o app inteiro em **Rust**, escreva telas em **TSX**, ou combine os dois em um único engine. Sobre o mesmo engine, apps que você já publicou podem receber novas UIs em tempo de execução, escritas pela sua equipe ou geradas por um modelo, como módulos assinados, em um sandbox configurado pelo host.

> [!IMPORTANT]
> O NSH fornece views e interação nativas; o app é dono do seu design visual. Componentes, estado e APIs são compartilhados entre plataformas, enquanto cores, tipografia, espaçamento e formas vêm do app. Entrada de texto, foco e menus seguem as convenções de interação de cada dispositivo. Veja [Objetivos e princípios de design](./goals.md).

<a id="what-native-means"></a>

## O que significa nativo

Nativo no NSH tem duas camadas: os fundamentos da plataforma e a interação da plataforma.

**Os fundamentos da plataforma.** Cada plataforma tem um backend próprio, construído sobre a UI que a plataforma já tem:

| Plataforma | Views | Texto | Entrada de texto |
|---|---|---|---|
| iOS | UIKit | CoreText | Os campos de texto e as views de texto do sistema |
| Android | Views do Android | `StaticLayout` | `EditText` |
| macOS | AppKit, Core Animation | CoreText | `NSTextField`, `NSTextView` |
| Windows | Janelas Win32 desenhadas com Direct2D | DirectWrite | O editor do NSH, com os métodos de entrada do sistema (IMM32) |
| Linux | GTK 4 | Pango | `Text` e `TextView` do GTK |
| Web | Elementos HTML estilizados com CSS | As fontes do navegador | Os inputs do navegador |

A seleção de texto e seu menu, os métodos de entrada, a acessibilidade e a rolagem vêm da plataforma, e o que uma nova versão do SO traz para eles chega ao app junto. Componentes nativos (um mapa, uma web view, um player de vídeo, qualquer view que o host registre) são mais uma view na mesma hierarquia, com layout, recorte e rolagem iguais aos das demais ([Componentes nativos](./native-components.md)).

**A interação da plataforma.** Os componentes que o NSH fornece em [`nsh/base`](../modules/nsh-base.md) se comportam como os usuários de cada dispositivo esperam, então o app os escreve uma única vez:

| | Desktops (e navegadores desktop) | Celulares e tablets |
|---|---|---|
| `Menu` | Um popup junto ao gatilho; os submenus se abrem em cascata ao lado do item | Uma sheet vinda da parte inferior; um submenu substitui os itens do seu menu |
| `ContextMenu` | Um clique com o botão direito o abre no ponteiro | Um dedo mantido pressionado no gatilho o abre como uma sheet |
| `Tooltip` | Exibido quando o ponteiro repousa sobre o gatilho | Exibido quando o app o abre |
| `Popover` | Um clique fora o fecha e alcança o que está sob o ponteiro | Um toque fora o fecha |

Páginas, diálogos, o teclado e a barra de status seguem a mesma ideia: as pilhas de navegação fazem push e pop com o movimento de cada plataforma, e o botão voltar, o Escape e o gesto de voltar deslizando fazem o que fazem em cada uma ([Navegação](./navigation.md)).

<a id="from-phone-to-desktop-to-web"></a>

## Do celular ao desktop e à web

Multiplataforma no NSH significa que cada dispositivo recebe o app que espera, e não a mesma tela ampliada ou reduzida:

- **Um único modelo de app.** Os componentes, o estado, a lógica de negócio e as telas do app são compartilhados; cada backend os mapeia para a sua plataforma.
- **Layouts que se remodelam.** Flexbox e CSS grid têm o layout calculado pelo [Taffy](https://github.com/DioxusLabs/taffy) em todas as plataformas, e os breakpoints do Tailwind (`md:`, `lg:`) e o tamanho da janela (`window()` em Rust) mudam a estrutura, não só o tamanho: um app de chat mostra a barra lateral, as conversas e as mensagens lado a lado em uma janela larga, e uma tela de cada vez em um celular ([Layout](./layout.md), [Tailwind](./tailwind.md)).
- **A entrada que cada dispositivo espera.** Ponteiro, hover, cliques com o botão direito, atalhos e foco no desktop; toques, gestos, teclado virtual e navegação entre páginas nos celulares. Quando um app quer algo próprio para cada plataforma, as props `desktop={{…}}` e `platform.select` permitem isso ([Código específico de plataforma](./platform-specific.md)).
- **Verificado em todos os alvos.** `nsh test` executa os testes do app em modo headless, e os mesmos testes em janelas macOS, Windows, Linux e GPUI, em um simulador de iOS, em um dispositivo Android ou em um navegador, com a entrada da própria plataforma ([Testes e tracing](./testing-and-trace.md)).

Pense em um app como um cliente de chat. Seu desenvolvedor o constrói no desktop com `nsh run`, abre-o em um simulador de iOS com `nsh run --target ios` para verificar o layout de celular e depois em um navegador com `nsh run --target web`, sempre com o mesmo projeto, e `nsh package` gera os apps instaláveis e o site. Uma única pessoa engenheira consegue carregar o que antes exigia uma equipe por plataforma, enquanto o backend é construído em paralelo.

<a id="rust-first"></a>

## Rust em primeiro lugar

O NSH é construído em Rust, e Rust é uma linguagem de primeira classe para escrever apps com ele:

- **Apps inteiros em Rust.** UI, lógica e componentes são Rust, compilados para código nativo em todas as plataformas, com a posse (ownership), os tipos, as threads e o ecossistema do crates.io do Rust. A computação roda em velocidade nativa, e o processamento de dados grandes, o parsing e o trabalho de sistema ficam na linguagem mais adequada para eles ([Building with Rust](./rust.md)).
- **TSX como segundo caminho.** O TSX serve para telas escritas rapidamente, plugins, apps pequenos e UI entregue em tempo de execução. Ele roda no mesmo engine que o Rust, com as mesmas primitivas, os mesmos componentes base e os mesmos signals.
- **Os dois juntos.** Um app Rust pode receber telas em TSX, e as telas em TSX importam os componentes, módulos e classes Rust do app.
- **Uma única toolchain.** Um único executável `nsh` cria, compila, verifica tipos, executa com hot reload, testa, empacota e assina apps para todos os alvos. Ele traz seu próprio bundler de TSX e seu próprio verificador de TypeScript, de modo que quem vem de Rust, Swift, Kotlin ou C++ instala o Rust e o `nsh`, e já pode trabalhar ([Instalação](./installation.md), [CLI](./cli.md)).

<a id="an-app"></a>

## Um app

O mesmo contador, em Rust e em TSX:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

Uma view (`view()`, `<View>`) se torna um `UIView` no iOS, um `ViewGroup` no Android, um `NSView` no macOS, um widget GTK no Linux, uma view retida desenhada com Direct2D no Windows e um elemento HTML na web; um texto se torna uma view de texto nativa, e o feedback de pressão do botão (`.active(..)`, `activeStyle`) roda na thread principal. Quando você toca, `count.update` altera um signal, e apenas o texto que o lê é atualizado: a função do componente não roda de novo. O app Rust é código nativo do começo ao fim; no app TSX, apenas o código do próprio módulo é JavaScript.

<a id="retained-views"></a>

## Views retidas

O NSH é retido (retained): cada elemento é uma view que a plataforma mantém, e uma atualização altera apenas o que mudou.

- **Atualizações de granularidade fina.** [Signals](./reactivity.md) como os do Solid, implementados nativamente: os componentes rodam uma vez, e uma mudança reexecuta apenas as expressões que leem o signal alterado.
- **Só o que mudou cruza threads.** As mudanças de um turno têm o layout calculado em conjunto e são entregues à thread principal como um único lote de operações de view por frame; estilos e frames inalterados não são enviados, e as views em que nada foi tocado permanecem como estão.
- **As animações rodam nativamente.** Animações de timing, spring e decay, gestos e valores vinculados à rolagem são avaliados no relógio de frames da plataforma, sem chamar o JS a cada frame ([Animação](./animation.md)).

Isso serve às telas de que a maioria dos apps é feita (chats, e-mail, formulários, listas, documentos, configurações, uma resposta de IA chegando em streaming), em que poucas views mudam por vez e o resto espera. Essas telas ficam quase ociosas entre as atualizações, e a rolagem e as animações sustentam 120 FPS em telas ProMotion. No [benchmark de desempenho do NSH](https://github.com/longbridge/nsh-perf-bench), uma tabela de cotações com 500 linhas atualizada 1.000 vezes por segundo usa 18% de um núcleo no Linux com NSH Rust, contra 20% para a mesma tela escrita diretamente no [GPUI Fast](https://github.com/longbridge/gpui-fast). A computação pesada pertence ao Rust: o TSX roda no QuickJS, um interpretador, enquanto um módulo Rust roda em velocidade nativa mesmo quando chamado pelo TSX; ordenar 100.000 linhas leva cerca de 3 ms dessa forma, como em Rust puro ([Desempenho](./performance.md)).

<a id="how-it-runs"></a>

## Como ele roda

A toolchain é um único binário `nsh`. Um app é escrito em Rust, em TSX ou em ambos, e cada um segue seu próprio caminho até o mesmo engine Rust.

<a id="rust-apps"></a>

### Apps Rust

Um app Rust é um crate, construído inteiramente com Rust e Native, sem runtime de JavaScript:

1. **Build.** `nsh` compila o runner de cada alvo (o app iOS, Android, macOS, Windows, Linux ou web) com o seu crate vinculado. Componentes, estado, handlers e o engine são compilados juntos em código nativo.
2. **Execução.** O componente raiz do app roda na thread do engine como Rust. O runner não tem engine de JavaScript: o QuickJS não faz parte de um app Rust em nenhuma plataforma.

<a id="tsx-apps"></a>

### Apps TSX

Um app TSX (um módulo) é um conjunto de arquivos `.tsx` / `.ts` com uma entrada, geralmente `App.tsx`:

1. **Build.** `nsh` agrupa os arquivos do módulo em um bundle (com rolldown e Oxc) e compila o JSX com seu próprio compilador. Os imports de `nsh` e `nsh/*` permanecem como imports: o runtime os fornece nativamente, de modo que o bundle contém apenas o seu código. O bundle é compilado para bytecode do QuickJS.
2. **Execução.** A thread do engine executa o bytecode no [QuickJS](https://github.com/quickjs-ng/quickjs), uma VM por view. O JSX compilado chama o renderizador nativo diretamente, e o JavaScript apenas descreve a UI e trata eventos; o parsing de estilos, a resolução de classes do Tailwind, o diff, o layout e o texto acontecem todos em Rust.

<a id="the-difference"></a>

### A diferença

| | App Rust | App TSX |
|---|---|---|
| Escrito em | Rust | TSX (TypeScript e JSX) |
| Compilado para | Código nativo, vinculado ao runner de cada alvo | Bytecode do QuickJS, carregado pelo runtime |
| Engine de JavaScript | Nenhum | QuickJS, uma VM por view |
| Durante o desenvolvimento (`nsh run`) | Recompilado e reiniciado a cada salvamento | Atualizações a quente a cada salvamento |
| Após o lançamento | Vai junto com o app | Também entregue em tempo de execução como pacotes assinados, em um sandbox |
| Serve para | Apps inteiros, computação pesada, trabalho de sistema | Telas escritas rapidamente, plugins, UI gerada por IA |

Os dois se combinam: um app Rust pode receber telas em TSX, e as telas em TSX importam seus componentes, módulos e classes Rust; um app assim vincula o QuickJS para executá-las ([Building with Rust](./rust.md)).

<a id="the-shared-engine"></a>

### O engine compartilhado

A partir do engine, os dois caminhos são iguais. As mudanças são coletadas por turno, têm o layout calculado com o Taffy (flexbox e CSS grid) e são entregues à thread principal como um único lote de operações de view por frame; a thread principal aplica o lote às views nativas. O texto é medido e disposto uma única vez na thread do engine (CoreText nas plataformas Apple, `StaticLayout` no Android, DirectWrite no Windows, Pango no Linux, as métricas de fonte do navegador na web) e apenas desenhado na thread principal.

Na web, o mesmo engine roda na página: o navegador exibe elementos HTML estilizados com CSS, faz a rolagem deles, seleciona o texto e trata a entrada, e `nsh package --target web` publica o app como um site estático cujos arquivos são nomeados pelo conteúdo, pronto para qualquer CDN ([Web](./web.md)).

> [!NOTE]
> A thread principal nunca espera pelo código do app. As perguntas que o sistema faz de forma síncrona (este input pode aceitar mais um caractere, o usuário pode voltar deslizando, esta sheet pode ser fechada) são respondidas nativamente a partir de props definidas de antemão, como `maxLength`, `popOnBack` ou `closeOnSwipe`. Os eventos chegam aos handlers do app depois.
<a id="dynamic-ui-and-ai-generated-ui"></a>

## UI dinâmica e UI gerada por IA

O NSH começou como uma forma de os apps nativos receberem UI depois do lançamento, e esse continua sendo um de seus principais usos. Um app incorpora um `NshAppView` (iOS), `NshView` (Android), `AppView` (apps macOS, Windows, Linux e GPUI) ou `createPlayer` (uma página web) no ponto onde um módulo deve aparecer, e o NSH executa módulos TSX dentro dele:

- **Entregue após o lançamento.** Um módulo é um pacote assinado (`.nshpkg`) que o app baixa em tempo de execução. O app verifica a assinatura com as chaves em que confia e com uma lista de revogação antes de executá-lo ([Pacotes assinados](./signed-packages.md)). O app host distribui o runtime; as equipes criam módulos com base na API dele e os entregam no próprio ritmo.
- **O host mantém o controle.** Cada módulo roda em sua própria VM QuickJS, com limites de memória, de tempo de chamada e de nós, e acessa apenas o que o host concede: hosts de rede, páginas web, a barra de status ([Sandbox e capacidades](./sandbox-and-capabilities.md)). Vários módulos rodam lado a lado.
- **Tem a aparência do restante do app.** Os módulos são renderizados com a UI própria da plataforma, e o host pode registrar suas próprias views nativas (um mapa, um player, um componente de design system) para os módulos usarem ([Componentes nativos](./native-components.md)).

O mesmo mecanismo permite que um app **responda com uma interface**. Um modelo escreve um pequeno módulo TSX (um formulário, um gráfico, um cartão de reserva), seu servidor o verifica, compila e assina, e o app o exibe de forma nativa:

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

No iOS, a parte do host são poucas linhas:

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## Amigável para IA

O NSH foi projetado para software escrito com IA, tanto apps inteiros quanto telas geradas:

- **Um modelo de app para todas as plataformas.** Um modelo aprende uma única forma de escrever UI, e o resultado roda em celulares, desktops e na web; o NSH adapta a interação a cada plataforma, de modo que nada precisa ser gerado seis vezes.
- **Rust ou TSX, conforme a tarefa.** Rust para apps inteiros e módulos críticos em desempenho, TSX para telas, plugins e UI gerada sob demanda, tudo em um único engine.
- **Um contrato preciso e gerado.** Cada elemento, prop, chave de estilo e módulo tem declarações TypeScript geradas a partir do código-fonte em Rust (`.nsh/types`), e as APIs em Rust são tipadas, de modo que o código gerado é verificado por um compilador. Esta documentação é servida em texto simples para modelos ([`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt)).
- **Uma única linha de comando para todo o ciclo.** Um agente cria o app, o compila, o executa em um destino, roda seus testes, lê o resultado, corrige e empacota, tudo por meio de `nsh`. O `nsh test` roda em modo headless, sem dispositivo, e relata erros e as views produzidas; o compilador também roda no mesmo processo (`nsh_bundler::compile_module`) e no navegador ([Playground](/playground)).
- **Seguro para executar quando não é confiável.** O código gerado e entregue em tempo de execução é código não confiável: ele chega assinado, roda em uma VM com limites e acessa apenas as capacidades que o host concede.

<a id="where-it-runs"></a>

## Onde roda

| Plataforma | Requer | Backend | Incorporado com |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Android views | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | Navegadores modernos | HTML | `createPlayer`, iframe |
| [GPUI](./gpui.md) | Desktops | GPUI | `AppView` (apps GPUI, GPUI Kit) |
| Mac Catalyst | macOS | UIKit | Para desenvolvimento (`--target catalyst`) |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell e GPUI Shell

A [Longbridge](https://longbridge.com) desenvolve o NSH para seus próprios clientes. A primeira necessidade era uma camada de plugins para o cliente mobile, e o [GPUI Shell](https://gpui-kit.com/shell), que torna os apps desktop [GPUI](https://gpui-kit.com) extensíveis em JavaScript, foi o ponto de partida. Em celulares, uma UI desenhada pelo próprio GPUI teria que reconstruir o que a plataforma já faz (a seleção de texto e seu menu, com Copiar, Compartilhar, Traduzir e Buscar, os métodos de entrada, a acessibilidade e os materiais visuais que cada versão do iOS traz), e cada equipe mobile teria que adotar uma nova stack de UI. Por isso, o NSH renderiza com a UI própria de cada plataforma, e deixou de ser uma camada de plugins para se tornar um framework para apps inteiros em todas as plataformas.

Os dois têm posicionamentos diferentes. O GPUI Shell estende aplicativos desktop GPUI; o Native Shell é um framework para apps nativos em celulares, desktops e na web, e seu backend GPUI incorpora apps NSH em apps GPUI e GPUI Kit ([GPUI](./gpui.md)).

<a id="how-it-compares"></a>

## Como se compara

Para apps inteiros, o NSH se situa entre frameworks multiplataforma como React Native, Flutter, Qt, GPUI, Slint, Electron e Tauri; para UI entregue após o lançamento, entre web views, UI orientada pelo servidor e containers de mini programas. Sua escolha é a UI e a interação próprias de cada plataforma sob um único modelo de app, com Rust como linguagem do app e TSX ao lado. [Comparação de abordagens](./comparison.md) examina cada uma.

<a id="next-steps"></a>

## Próximos passos

- [Instalação](./installation.md) e [Primeiros passos](./getting-started.md): instale o `nsh`, escreva um primeiro app em Rust ou TSX e execute-o em cada plataforma.
- [Desenvolvendo com Rust](./rust.md): apps escritos em Rust, e TSX sobre eles.
- [Plataformas](./platforms.md): o que roda onde, e como executar, empacotar e incorporar em cada plataforma.
- [JSX e componentes](./jsx-and-components.md) e [Reatividade](./reactivity.md): as duas ideias sobre as quais todo o resto se apoia, em Rust e TSX.
- [Pacotes assinados](./signed-packages.md) e [Sandbox e capacidades](./sandbox-and-capabilities.md): entregue módulos e decida o que eles podem fazer.
