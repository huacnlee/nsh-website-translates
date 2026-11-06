---
title: "Objetivos e princípios de design"
description: "Os objetivos do Native Shell: views e interações nativas, design controlado pelo app, componentes compartilhados, e Rust e TSX em um único engine."
order: 1.5
group: start
source_hash: bad49295450504d6
---

Native Shell fornece views e interação nativas em iOS, Android, macOS, Windows, Linux e na web. O app é dono do seu design visual. Um único modelo de componentes atende apps completos, funcionalidades incorporadas e UI entregue dinamicamente.

<a id="native-foundations-app-owned-design"></a>

## Fundações nativas, design controlado pelo app

O NSH se baseia nas views, no texto e na infraestrutura de entrada de cada plataforma, e adapta a interação ao dispositivo: navegação por teclado, entrada por ponteiro e toque, edição de texto, rolagem e acessibilidade ([Introdução](./index.md#what-native-means)).

O app define cores, tipografia, espaçamento, formas, feedback de estado e animação. Uma tela de configurações pode seguir a marca do app no iOS e no Android, enquanto a entrada e a navegação seguem as convenções de cada dispositivo. Designers refinam essa linguagem visual por meio de estilos e partes de componentes.

Uma view nativa é a base de renderização. Um controle com o estilo do sistema é uma escolha visual e comportamental específica. Os controles comuns do NSH expõem comportamento compartilhado e partes personalizáveis, para que as aplicações possam construir seus próprios design systems.

<a id="native-integration-in-practice"></a>

## Integração nativa na prática

A fundação nativa inclui renderização, animação orientada a quadros, entrada e semântica de acessibilidade. No iOS e no Android, [Input](../elements/input.md) usa campos de texto da plataforma: a plataforma cuida da edição, dos menus de seleção, dos métodos de entrada e dos serviços de preenchimento automático compatíveis. O app descreve o campo por meio de `autoComplete`, por exemplo `current-password` ou `postal-code`, e o sistema fornece as sugestões disponíveis de acordo com suas configurações e serviços ([Formulários e teclado](./forms-and-keyboard.md)). Estilizar o campo é compatível com manter essa integração com o sistema.

Essa é uma distinção arquitetural em relação a desenhar um campo de texto inteiramente dentro de um renderizador personalizado: um renderizador personalizado fornece sua própria integração com os serviços de edição e acessibilidade do sistema, enquanto o NSH usa controles de texto da plataforma onde o seu backend os oferece. A documentação de cada backend define sua integração, incluindo o editor próprio do NSH no Windows e o backend de incorporação GPUI ([Plataformas](./platforms.md)).

A separação entre comportamento de componente e design visual do [GPUI Kit](https://gpui-kit.com) inspira as camadas do NSH. O NSH expande esse princípio com a infraestrutura de views e de entrada da plataforma. Integração nativa e design controlado pelo app funcionam em conjunto ao longo de todo este modelo.

<a id="one-component-model-across-platforms"></a>

## Um modelo de componentes em todas as plataformas

Um switch significa a mesma coisa em um celular, em um desktop e na web. [`nsh/base`](../modules/nsh-base.md) fornece estado, tratamento de entrada, foco e acessibilidade; o app estiliza a trilha, o thumb e os estados do [Switch](../elements/switch.md). Botões, checkboxes e radios seguem o mesmo princípio.

| Responsabilidade | Local | Exemplo |
|---|---|---|
| Renderização, layout, reatividade e ambiente | `nsh-core`, `nsh` e módulos de runtime | Views, texto, signals, estilos |
| Comportamento compartilhado e estrutura acessível | `nsh-base`, importado como `nsh/base` em TSX | `Button`, `Checkbox`, `Switch`, `Tabs` |
| Design visual e componentes estilizados | O app ou uma biblioteca da comunidade | Controles com a marca, cards, linhas de formulário |
| Capacidades específicas de plataforma | `nsh/mobile`, `nsh/desktop` | Barra de navegação mobile, controles de janela no desktop |

Os controles comuns têm um único lar multiplataforma em `nsh/base`. Os módulos de plataforma têm escopo definido por finalidade e semântica da plataforma. [`TabBar`](../modules/nsh-mobile.md#tabbar) atende à navegação de nível superior no mobile; [`Tabs`](../elements/tabs.md) alterna conteúdo em abas entre plataformas. Seus papéis são distintos. `nsh/mobile` aceita capacidades com semântica de interação específica de mobile; diferenças na aparência, no tamanho, na cor ou na animação de um controle comum pertencem ao componente compartilhado e à estilização do app. Uma notificação ou um toast com papel compartilhado deve ser projetado primeiro em torno de um único contrato multiplataforma, com a apresentação adaptada internamente.

Um componente compartilhado pode adaptar sua interação internamente: um menu abre como popup no desktop e como sheet no celular, enquanto o app usa uma única API e fornece a sua aparência. Apresentações gerenciadas pelo sistema, como cabeçalhos de navegação e alertas, seguem as regras de apresentação documentadas de cada plataforma. Os apps podem expor seus próprios componentes e serviços nativos por meio das [interfaces de incorporação](./native-components.md).

<a id="the-unstyled-foundation-and-the-component-library-layer"></a>

## A fundação sem estilo e a camada de biblioteca de componentes

O NSH é dono das primitivas e da fundação sem estilo (`nsh-core` e `nsh-base`). Aplicações e bibliotecas de terceiros são donas da camada estilizada de biblioteca de componentes, o papel que `gpui-component` desempenha no [GPUI Kit](https://gpui-kit.com). Essa divisão dá a cada produto controle sobre sua linguagem visual, ao mesmo tempo em que reaproveita as partes difíceis da implementação de componentes.

A experiência por trás dessa escolha vem do [GPUI Kit](https://gpui-kit.com). Seus componentes estilizados surgiram do trabalho no Longbridge Pro. À medida que os aplicativos exigiam designs cada vez mais diferentes, a pressão por personalização levou os usuários a fazer forks dos componentes. Extrair a fundação compartilhada para `gpui-base` tornou o comportamento reutilizável entre esses designs. Os componentes estilizados continuam úteis como referência de design e para aplicações cujas necessidades cabem na sua superfície de personalização; a fundação dá às demais aplicações controle direto sobre a apresentação.

O NSH aplica essa lição desde o início. `nsh/base` é dono de comportamento complexo, interação, estado reativo, foco, acessibilidade e apresentação adaptativa, com testes na camada responsável por cada comportamento. Isso inclui estruturas maiores, como [Dock](../elements/dock.md). As aplicações constroem designs diversos sobre essa fundação por meio de estilos, estados, slots e partes. As contribuições de componentes seguem a mesma fronteira: padrões visuais e variantes com a marca pertencem a componentes da aplicação ou de terceiros. As apresentações gerenciadas pelo sistema documentadas e os padrões de leitura de `TextView` mantêm seus contratos específicos ([Arquitetura](./architecture.md#three-layers)).

<a id="what-the-gallery-demonstrates"></a>

### O que a Gallery demonstra

As demos do site e a Gallery são aplicativos de exemplo estilizados. Seus gradientes, sombras, cantos arredondados, transições e movimentos exercitam as capacidades de personalização do NSH e fornecem exemplos de código-fonte. Essas escolhas pertencem às demos e à Gallery; os componentes base reutilizáveis expõem o comportamento e as partes que ficam por baixo delas. As aplicações podem aproveitar os exemplos ou construir uma linguagem visual diferente.

Uma biblioteca estilizada distribuída de forma independente pertenceria à camada de aplicação/comunidade descrita acima. A estilização da Gallery ilustra uma direção de design; a adequação a um produto específico é uma decisão de design desse produto.

<a id="rust-and-tsx-on-one-engine"></a>

## Rust e TSX em um único motor

Apps em Rust, telas em TSX e projetos mistos compartilham primitivas, componentes base, signals e layout. Rust oferece lógica de aplicação compilada e componentes nativos reutilizáveis. TSX permite iteração rápida e módulos entregues em tempo de execução ([Criando com Rust](./rust.md)).

O motor atualiza os bindings que dependem de signals alterados e agrupa em lote as operações de view. O layout de texto, as animações nativas e a entrada pertencem ao motor e aos seus backends de plataforma ([Arquitetura](./architecture.md)). O desempenho é avaliado com cargas de trabalho de aplicações reproduzíveis ([Desempenho](./performance.md)).

<a id="embedding-dynamic-delivery-and-ai"></a>

## Incorporação, entrega dinâmica e IA

Um app nativo existente coloca uma view do NSH onde uma funcionalidade deve ficar e expõe seus próprios componentes nativos e serviços do host. Apps independentes usam o mesmo runtime e o mesmo modelo de componentes ([Plataformas](./platforms.md)).

Módulos TSX entregues dinamicamente são donos do seu estado, da sua lógica e do seu layout. Pacotes assinados estabelecem em quais publicadores o host confia; limites de sandbox e capacidades definem o que os módulos podem fazer. O host escolhe tanto a confiança quanto as permissões ([Pacotes assinados](./signed-packages.md), [Sandbox e capacidades](./sandbox-and-capabilities.md)).

A UI gerada por IA segue esse contrato: gerar TSX com base em APIs declaradas, verificá-lo e testá-lo, compilar e assinar o módulo, e então verificá-lo e executá-lo sob a política do host. Declarações geradas, documentação legível por modelos e testes via CLI tornam o fluxo de trabalho inspecionável e repetível ([Testes e rastreamento](./testing-and-trace.md)).

<a id="how-these-goals-guide-additions"></a>

## Como esses objetivos orientam novas adições

1. Estabeleça o comportamento do usuário e se ele é compartilhado entre plataformas.
2. Coloque o comportamento compartilhado na primitiva ou no componente base existente, expondo estado e partes para a personalização pelo app.
3. Coloque capacidades com semântica específica de plataforma no módulo da respectiva plataforma, documentando a aplicabilidade e a composição com a UI compartilhada.
4. Construa componentes estilizados no app ou na biblioteca da comunidade.
5. Verifique comportamento, acessibilidade, layout e entrada nas plataformas afetadas, e documente o contrato público nos dois idiomas.

Esses princípios mantêm o design visual flexível, as APIs de componentes compartilhados coerentes e a integração com a plataforma explícita à medida que o NSH cresce.
