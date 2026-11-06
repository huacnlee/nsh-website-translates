---
title: "Desempenho"
description: "Como o NSH mantém os apps rápidos (apps em Rust, um runtime nativo, travessias em lote, animações nativas, listas virtualizadas), o que isso significa para o seu código e como medir em modo headless e na tela."
order: 62
group: tools
source_hash: f8f220699bc54685
---


# Desempenho

Performance é a prioridade número um do NSH, e a maior parte dela é decidida pelo framework, não pelo seu app: o runtime é nativo, cada atualização cruza threads uma única vez, animações e virtualização de listas rodam sem JS, e um app escrito em Rust não executa JS algum. Esta página explica as regras que o NSH segue, o que elas significam para o código que você escreve, em Rust e em TSX, e como medir.

<a id="the-rules"></a>

## As regras

<a id="1-js-does-as-little-as-possible"></a>

### 1. O JS faz o mínimo possível

**Um app escrito em Rust é código nativo do início ao fim**: seus componentes, estado e handlers são compilados com o engine do NSH, e nenhum interpretador é executado ([Desenvolvendo com Rust](./rust.md)). Essa é a forma mais rápida de escrever um app, e a indicada para lógica de negócio exigente.

Em um app TSX, o QuickJS é um interpretador: pequeno, rápido para iniciar, e muito mais lento que código nativo em trabalho pesado. Por isso, no NSH, **somente o código do seu app é JS**. O grafo reativo (signals, valores computed, effects), o renderer que o seu JSX compilado chama, o motor de layout, a virtualização de listas, a animação e todo módulo que você importa são Rust. Parsing, diffing, layout e processamento de strings acontecem de forma nativa.

O efeito é mensurável. O mesmo app de contador no runtime JS anterior do NSH e no runtime nativo (builds de release):

| | Runtime JS anterior | Runtime nativo |
|---|---|---|
| Tamanho do bundle | 14 KB de JS / 19,6 KB de bytecode | 886 B de JS / 1,7 KB de bytecode |
| Avaliação do bundle | ~390 µs | ~95 µs |
| Tempo de JS de um toque (mediana) | ~14 µs | ~5 µs |
| Commit de um toque | ~22 µs | ~15 µs |
| Rolagem de uma lista de 1000 linhas, JS por frame de rebinding | ~150 µs | ~77 µs |

O mesmo vale para componentes: um botão escrito como componente Rust contra um botão TSX equivalente, 200 de cada:

| | Botão Rust: JS / core | Botão TSX: JS / core |
|---|---|---|
| Primeiro frame (ops) | 1,32 ms / 0,77 ms (1015) | 2,32 ms / 0,70 ms (2415) |
| Atualização dos 200 títulos (ops) | 0,42 ms / 0,42 ms (200) | 0,77 ms / 0,36 ms (600) |

(Medido em Apple silicon; a segunda tabela no runtime anterior. Ambas vêm das baselines de performance do NSH.)

**Para o seu código:** mantenha handlers de eventos e valores computed leves. Computação pesada (parsing de payloads grandes, ordenação de milhares de itens a cada tecla digitada) custa mais no QuickJS do que você talvez esteja acostumado no V8 ou no JavaScriptCore com JIT. Faça-a uma única vez, guarde o resultado em cache em um `computed`, ou tire-a do caminho da interação.

<a id="2-cross-threads-in-batches"></a>

### 2. Cruze threads em lotes

O código do seu app, Rust ou JS, roda em uma thread de engine, nunca na thread principal. Um turno, por exemplo um handler de evento com tudo o que ele altera, vira **um commit**: o runtime renderiza componentes, faz o layout, calcula o diff e produz um lote de operações de views nativas, que chega à thread principal em **um único salto**. Não há mensagem de bridge por view nem serialização por prop.

**Para o seu código:** você não precisa agrupar escritas por questões de performance; dez chamadas a `set` em um handler ainda produzem um único commit, em Rust e em TSX. Use `batch` quando quiser que effects e valores computed vejam todas as escritas de uma vez, em vez de rodarem após cada uma.

<a id="3-fine-grained-updates"></a>

### 3. Atualizações de granularidade fina

Os componentes rodam **uma vez**, tanto em Rust quanto em TSX. Depois disso, apenas os bindings que leem um signal rodam novamente quando ele muda: um texto, uma propriedade de estilo, um ramo de `when` (`<If>`), as linhas de `each` (`<Each>`). Nada re-renderiza uma subárvore inteira para descobrir o que mudou.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**Para o seu código:**

- Leia signals onde eles são usados (dentro de bindings, closures de `move ||` em Rust e expressões JSX em TSX, e em `computed` e `effect`), não no topo de um componente, para que o binding mais estreito seja atualizado.
- Use `each` / `<Each>` (linhas mantidas por chave) ou uma [lista virtual](./lists.md) para coleções; linhas refeitas a partir da coleção inteira (`dynamic` em Rust, um `.map()` simples em JSX) são todas recriadas a cada mudança.
- Derive valores com `computed` quando vários bindings os usam, para que sejam calculados uma vez por mudança.

Acrescentar um quarto item a uma lista de três itens, como o `nsh test --trace` mostra:

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

Veja [Reatividade](./reactivity.md).

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. Não envie o que não é necessário

O core envia apenas o que mudou: views novas não recebem estilo padrão nem máscara de eventos vazia, estilos e frames inalterados não são enviados, e uma mudança na cor do texto não refaz o layout do texto. Um toque que altera um número envia um único item de texto. Você pode ver isso na saída de `nsh test --trace` (abaixo).

<a id="5-animate-natively"></a>

### 5. Anime de forma nativa

Uma animação conduzida pela thread de engine (um signal escrito a cada frame) custa um commit por frame, além de uma chamada de JS em TSX, e engasga quando a thread de engine está ocupada. Valores animados ([Animação](./animation.md): `animated_value` em Rust, a [API de animação do `nsh`](../modules/nsh.md#animation) em TSX) executam as animações de forma nativa:

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring` e `decay` rodam na thread de UI da plataforma, frame a frame, sem trabalho na thread de engine por frame.
- `scroll_value` (`scrollValue`) escreve um offset de rolagem em um valor animado no mesmo frame; um pan (`pan={{ x, y }}`) permite que arrastes movam uma view diretamente. Seu código é avisado do fim (a animação termina, o fim do pan recebe a velocidade).
- `Animated.sequence` / `parallel` / `stagger` / `loop` rodam como uma única árvore nativa: cada etapa começa no instante em que a anterior termina, sem intervalo esperando o JS.
- `LayoutAnimation.configureNext` anima de forma nativa os frames, inserções e remoções do próximo commit.

<a id="6-virtualize-long-lists"></a>

### 6. Virtualize listas longas

[`List`](./lists.md) mantém apenas as linhas próximas da viewport, recicla suas células e calcula posições, colunas, cabeçalhos fixos e viewability de forma nativa. Frames de rolagem que não revelam nenhuma linha nova não executam código seu e não produzem lote; um frame que faz o binding de uma nova linha da lista de fotos da galeria tem 4 operações e 4 mount items.

**Para o seu código:**

- Dê a `estimated_item_size` (`estimatedItemSize`) um valor próximo da altura real da linha.
- Mantenha o estado por item nos seus dados (indexado por id), não em signals criados dentro da linha: as células são reutilizadas para outros itens, e a posição da linha (`at.index()`; `item()` / `index()` em TSX) muda quando isso acontece.
- Mantenha as linhas baratas: uma linha faz binding uma vez por reciclagem, então seu código roda enquanto o usuário rola.
- Use `scroll_value` (`scrollValue`) em vez de `on_scroll` (`onScroll`) para effects que acompanham a posição de rolagem. Um listener de rolagem recebe no máximo um evento por turno do engine, mas cada um ainda é uma chamada ao seu código (ao JS, em TSX).

<a id="measuring"></a>

## Medindo

### Headless: `--trace`

Em um teste Rust, `EngineConfig::trace` registra as mesmas linhas de `perf` e `Headless::observe` enxerga cada lote ([Testes](./testing-and-trace.md#tracing-with-trace)). `nsh test --trace` as imprime para TSX:

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

O que observar:

- **ops** (operações que o seu JS enfileirou) e **mount items** (operações de views nativas): são determinísticos. Se um toque que deveria alterar um único label produz 40 itens, algo está recriando views que deveria atualizar.
- **event js**: o custo de JS de um handler e do que ele disparou.
- **commit**: o custo do core para renderizar componentes, fazer layout e calcular o diff.
- **list js**: JS gasto fazendo o binding das linhas da lista durante aquele commit.

Guia completo: [Testes](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### Em um dispositivo: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

registra as mesmas linhas de commit a partir do host real de um app TSX, com o motor de texto próprio da plataforma. `NshAppView(trace: true)` e `new NshView(context, true)` fazem o mesmo em um app embarcador.

<a id="on-screen-58"></a>

### Na tela: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(`AppOptions { fps: true, .. }` no `run_app` de um app Rust) mostra a taxa de frames e o custo de frames e commits sobre o app em execução, com CPU, GPU e memória ([macOS: monitor de desempenho](./macos.md#performance-monitor)). No Linux e no Windows, `--target linux --fps` e `--target windows --fps` registram as mesmas leituras uma vez por segundo, com o tempo de cada fase de um frame; `nsh test --target linux --fps -v` (ou `windows`) as captura enquanto um teste conduz o app.

> [!TIP]
> Medições isoladas são dominadas pelo estado de clock da CPU: uma thread que acabou de dormir roda mais devagar por algum tempo. Compare o mínimo de várias execuções, na mesma máquina, e prefira builds de release para medir tempo.

<a id="reference-numbers"></a>

## Números de referência

Números medidos, as baselines do NSH e a galeria página por página no Linux estão no [relatório de desempenho](./performance-report.md).

## Checklist

- Linguagem: escreva o app, ou as partes mais usadas dele, em Rust ([Desenvolvendo com Rust](./rust.md)); deixe o TSX para o que muda com frequência ou é entregue em tempo de execução.
- Interações: um toque altera um punhado de mount items, não dezenas.
- Listas: uma lista virtual (`virtual_list`, `List`) para qualquer coisa longa, com um tamanho de item estimado; estado por item nos dados.
- Animações: valores animados, não signals escritos a cada frame.
- Efeitos de rolagem: `scroll_value` (`scrollValue`), não um listener de rolagem.
- Handlers: nenhum trabalho pesado por tecla digitada ou por evento de rolagem; use cache em `computed`.

<a id="see-also"></a>

## Veja também

- [Relatório de desempenho](./performance-report.md)
- [Arquitetura](./architecture.md)
- [Testes](./testing-and-trace.md)
- [Listas](./lists.md), [Animação](./animation.md), [Reatividade](./reactivity.md)
