---
title: "Arquitetura"
description: "Como um app NSH é executado: o pipeline de build, as threads do engine e principal, o caminho de uma mudança de signal até as views nativas, o grafo reativo nativo, o layout de texto e os crates."
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---


# Arquitetura

Esta página é para desenvolvedores de apps que querem saber o que acontece entre `count.set(1)` e um label mudando na tela, em um app escrito em Rust ou em TSX.
Você não precisa dela para escrever apps, mas ela explica por que o NSH se comporta como se comporta: por que os componentes rodam uma única vez, por que as animações continuam fluidas enquanto o JS está ocupado, por que a main thread nunca espera pelo seu código.

<a id="the-big-picture"></a>

## O panorama geral

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## Build: só o seu código vira JS

`nsh build`, `nsh dev` e os demais comandos empacotam o seu app com uma toolchain escrita em Rust (sem Node.js):

1. **Oxc** remove os tipos do TypeScript.
2. **O compilador JSX do NSH** transforma o JSX em chamadas diretas ao renderer nativo, na mesma passada. Props e filhos estáticos são definidos uma única vez; expressões que podem mudar (que chamam uma função ou leem uma propriedade) viram bindings que o renderer acompanha. Os componentes viram chamadas de função simples com um objeto de props cujas props mutáveis são getters.
3. **rolldown** empacota seus módulos em um único módulo ES. Os imports dos módulos do NSH (`nsh`, `nsh/mobile`, `nsh/base`, ...) continuam sendo imports: esses módulos são nativos, fornecidos pelo runtime. **O bundle contém apenas o código do seu app**; o exemplo do contador tem menos de 1 KB de JS.
4. O bundle é compilado para **bytecode** (`bundle.nshc`), que carrega mais rápido que o código-fonte, e um **source map** é composto ao longo de todas as etapas para que os stack traces apontem para as linhas do seu `.tsx`.

Imagens e fontes que você importa são coletadas como assets, e as declarações de tipos para o seu editor são escritas em `.nsh/types`.

Um app escrito em Rust não tem bundle: o Cargo compila o runner de cada target com o seu crate linkado, e o componente raiz que `nsh.json` indica roda nativamente no engine. Tudo o que está abaixo vale para ele também, com o código dos seus componentes rodando em Rust onde o de um app TSX rodaria no QuickJS.

<a id="running-two-threads-per-app"></a>

## Execução: duas threads por app

Cada app em execução (um `NshAppView` no iOS, um `NshView` no Android, a janela de um app empacotado) é um **engine** com sua própria **engine thread** e, no caso de TSX, sua própria VM QuickJS. Não há singletons globais, então vários apps podem rodar lado a lado em um mesmo app host.

<a id="the-engine-thread"></a>

### A engine thread

Tudo o que diz respeito à lógica do seu app acontece aqui:

- **O seu código** roda aqui: componentes, event handlers, timers, effects. Componentes Rust rodam nativamente; TSX roda no **QuickJS**.
- **O grafo reativo** (signals, valores computed, effects, owners, context) é nativo. Seus nós são objetos QuickJS de classes nativas, de modo que o garbage collector enxerga as referências através deles, mas o rastreamento de dependências e o agendamento de atualizações são feitos em Rust (seguindo o algoritmo do Solid 1.9).
- **O renderer** que o seu JSX compilado chama é nativo. Ele cria nós e transforma cada mudança em uma **op** colocada diretamente em uma fila nativa: sem JSON, sem mensagens por prop.
- **O core** mantém uma shadow tree com todos os nós. Quando um turno de JS termina, ele pega todas as ops enfileiradas de uma só vez e faz o **commit**: renderiza os componentes Rust (os de `nsh/base` e os do próprio app), resolve os insets de `env()` em padding e margin, reconstrói os textos alterados, calcula o layout com o **Taffy** (flexbox e grid, com column como padrão e sem shrinking), compara frames e estilos e produz um único **MountBatch**: a lista de operações de que as views nativas precisam.

<a id="the-main-thread"></a>

### A main thread

A main thread (UI) da plataforma aplica cada MountBatch em um único salto: cria as views, insere-as, define estilos e frames e entrega o texto já com layout calculado. Além disso, ela só faz o que precisa acontecer nela:

- **desenhar texto** que já teve o layout calculado na engine thread;
- **animações nativas**: os valores animados de `nsh` são conduzidos quadro a quadro (um `CADisplayLink` no iOS, um animator da UI thread no Android) e escritos diretamente nas views;
- **gestos e rolagem**: os toques viram eventos enviados à engine thread; `scrollValue` e `pan` alimentam valores animados no mesmo quadro.

**A main thread nunca espera pelo JS.** Quando o sistema precisa de uma resposta na hora (este texto pode mudar? o botão voltar pode fechar esta tela? este sheet pode ser fechado?), a resposta foi montada antes como uma prop, e o JS toma conhecimento dela depois, por meio de um evento. Uma engine thread ocupada pode atrasar atualizações, mas não pode congelar a rolagem, as animações nem os gestos do sistema.

<a id="from-a-tap-to-the-screen"></a>

## Do toque até a tela

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

No exemplo do contador, um toque custa cerca de 0,12 ms em um build release em um Mac, somando JS e commit, e produz um punhado de mount items (veja [Testes](./testing-and-trace.md)).

Em um app Rust, o handler é uma closure Rust (`count.set(count.get() + 1)`), e o mesmo grafo, commit e batch se seguem, sem interpretador no caminho.

Três propriedades decorrem desse design:

- **Um turno é um commit.** Não importa quantos signals um handler altere, as views mudam uma única vez, juntas.
- **Componentes rodam uma única vez.** Apenas os bindings são reexecutados; não há re-render de componente nem diff de virtual DOM. O diff que sobra é o do core, sobre frames e estilos, em Rust.
- **Só as mudanças trafegam.** Estilos e frames inalterados não são enviados; views novas não recebem valores padrão.

<a id="text-laid-out-once-off-the-main-thread"></a>

## Texto: layout calculado uma vez, fora da main thread

O texto costuma ser a parte mais cara de uma UI. O NSH calcula o layout dele na engine thread com o text engine da própria plataforma, de modo que ele fica exatamente igual ao texto nativo:

1. **prepare**: um `<Text>` e seus spans aninhados viram uma única attributed string (CoreText nas plataformas Apple, `PrecomputedText` / `StaticLayout` no Android);
2. **measure** nas larguras que o layout pede; as medições são cacheadas por conteúdo e largura, então uma mudança apenas de cor não mede de novo;
3. **layout** no tamanho final.

A main thread recebe o resultado imutável e apenas o desenha. Um texto aninhado em um `<Text>` é um span, não uma view; strings fora de `<Text>` não renderizam nada.

<a id="lists"></a>

## Listas

`List` é virtualizada nativamente. O core decide quais linhas estão próximas da viewport, calcula posições, colunas e sticky headers, e recicla as células. Quando uma célula precisa de um item diferente, o runtime faz o binding (os accessors `item()` e `index()` da sua função de linha mudam); frames que não revelam nenhuma linha nova não chamam JS algum. Veja [Listas](./lists.md).

<a id="everything-else-the-runtime-does"></a>

## Tudo o mais que o runtime faz

- **Rede**: `fetch` e as demais APIs globais são classes nativas. As requisições vão para a stack HTTP da plataforma (`NSURLSession`, `HttpURLConnection`), com streaming nos dois sentidos.
- **Imagens** são baixadas e decodificadas fora da main thread, no tamanho da view, com cache em memória.
- **Limites e capacidades** são aplicados pelo runtime, em Rust: veja [Sandbox e capacidades](./sandbox-and-capabilities.md).
- **Hot module replacement** também é nativo: os patches são aplicados pelo runtime em bem menos de um milissegundo (veja [Servidor de desenvolvimento e depuração](./dev-server-and-debugging.md)).

<a id="three-layers"></a>

## Três camadas

A UI do NSH é construída em três camadas, como a do GPUI Kit:

| Camada | NSH | GPUI Kit | O que é |
|---|---|---|---|
| Primitivos | `nsh-core` e o runtime (`nsh`, `nsh/mobile`, `nsh/desktop`) | `gpui` | Os elementos host, estilos, layout, renderização, reatividade, o ambiente |
| Componentes base | `nsh-base` (`nsh/base`) | `gpui-base` | Componentes sem estilo que cuidam de comportamento, estado, foco, teclado e acessibilidade, e recebem sua aparência do app |
| Biblioteca de componentes | a do seu app, ou a da comunidade | `gpui-component` | Componentes estilizados: botões, cards, linhas com aparência própria |

As duas primeiras camadas são o Native Shell. A terceira é sua: um app constrói a própria biblioteca de componentes sobre `nsh/base` e os primitivos, em TSX ou como componentes Rust em [seu próprio crate](./rust.md), usa uma que a comunidade publica, ou estiliza a UI diretamente no app.

<a id="the-crates"></a>

## Os crates

O NSH é um workspace Rust. Você nunca precisa compilá-lo para escrever apps (a distribuição traz a CLI e runtimes pré-compilados), mas os nomes aparecem em logs e na documentação:

| Crate | O que é |
|---|---|
| `nsh-core` | O core independente de plataforma: shadow tree, estilos, layout Taffy, mesclagem de texto, virtualização de listas, mount items; valores CSS e Tailwind; o grafo de animação nativo (valores, interpolação, timing / spring / decay); o framework e o tema dos componentes Rust; os módulos Rust do runtime (`BackHandler` de `nsh/mobile`, ...). |
| `nsh-base` | `nsh/base`, os componentes base sem estilo (`gpui-base` do NSH): navegação, diálogos, controles e a status bar; apps Rust o usam como `nsh_base`. |
| `nsh-js` | O host QuickJS e o runtime do NSH: o grafo reativo, o renderer, todos os módulos nativos, as APIs globais, hot module replacement, limites; e as declarações TypeScript de tudo isso. |
| `nsh-engine` | A engine thread: conduz `nsh-js` e `nsh-core` e entrega um batch por quadro à plataforma. |
| `nsh-package` | Pacotes assinados: chaves, certificados, revogação, o trust store. |
| `nsh-bundler` | O bundler: rolldown, Oxc, o compilador JSX do NSH, source maps, verificação de classes Tailwind. |
| `nsh-dev` | O servidor de desenvolvimento e seu cliente. |
| `nsh-platform-ios` | O backend UIKit (iOS, simulador, Mac Catalyst): montagem de views, o text engine CoreText, entrada; o SDK de embedding. |
| `nsh-platform-android` | O backend Android: `libnsh.so` e o runtime Java (`NshView`, as views, imagens, rede). |
| `nsh-cli` | O comando `nsh`. |

A direção das dependências é `nsh-core` ← `nsh-js` ← `nsh-engine` ← plataformas; `nsh-base` se apoia em `nsh-core`. O core não depende de nenhuma plataforma nem de nenhum engine JS, o que permite que `nsh test` execute o runtime real em modo headless em qualquer máquina.

<a id="see-also"></a>

## Veja também

- [Desempenho](./performance.md)
- [Reatividade](./reactivity.md)
