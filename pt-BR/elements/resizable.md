---
title: "Resizable"
description: "ResizablePanelGroup e ResizablePanel: painéis lado a lado ou empilhados, com uma alça entre cada dois painéis que o usuário arrasta para dividir o espaço. O grupo cuida do arrasto, dos limites dos painéis, do cursor de redimensionamento e do papel das alças para leitores de tela; os tamanhos, a aparência das alças e o conteúdo dos painéis ficam por conta do app."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---


# Resizable

A group redimensionável organiza painéis lado a lado ou empilhados, com uma alça em cada fronteira entre dois deles: uma barra lateral ao lado de um documento, um editor acima de seu console, uma lista ao lado de seu detalhe. O usuário arrasta uma alça para mover a fronteira, e cada painel permanece dentro dos tamanhos que o app permite. `ResizablePanelGroup` cuida do comportamento: o arrasto, que roda nativamente quadro a quadro, a divisão do espaço, o cursor de redimensionamento e uma área de toque maior para o dedo. A aparência é do app: uma alça é uma faixa sem linha, cor ou pegada próprias, e o que ela desenha é o indicador do app; os painéis são as views do app.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` e `ResizablePanel` vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Os painéis são os filhos diretos do group. Em Rust, `h_resizable()` e `v_resizable()` criam um group em cada eixo (`resizable_panel_group().axis(..)` recebe o eixo como valor) e `resizable_panel()` cria um painel, com um setter por prop, um listener por evento, os métodos de estilo tipados e `.child(..)` para o conteúdo; `.size_range(min..max)` define os dois limites de uma vez.

<a id="sizes"></a>

## Tamanhos

O `size` de um painel é o tamanho que ele deseja, dentro de seu `minSize` e seu `maxSize`. Os painéis sem tamanho dividem igualmente o que sobra, seja qual for o conteúdo; quando todos os painéis têm um tamanho, o espaço excedente é dividido em proporção a eles. Enquanto o usuário arrasta uma alça, o group move o espaço entre os painéis no core, sem JS no caminho:

- Aumentar o painel anterior à alça tira espaço dos painéis posteriores, do mais próximo ao mais distante, cada um até o seu `minSize`, pulando os que são `fixed`.
- Reduzi-lo abaixo de seu `minSize` tira espaço dos painéis anteriores.
- Nenhum painel cresce além de seu `maxSize`, e a soma dos painéis nunca ultrapassa o group.

Quando um arrasto termina tendo alterado os tamanhos, o group informa o tamanho de todos os painéis visíveis, na ordem em que estão dispostos (`onResize` no group), e cada painel cujo tamanho mudou informa o seu próprio (`onResize` no painel). Os painéis que um arrasto moveu mantêm os tamanhos do usuário até que o app passe um novo `size`; o app os preserva além da vida do group devolvendo os tamanhos informados como `size`, de modo que um layout restaurado do [armazenamento](../modules/nsh.md#storage) abre com os tamanhos em que o usuário o deixou. Apenas arrastos e ajustes de leitores de tela geram notificações: uma janela redimensionada ou um painel exibido ou oculto não notifica nada.

Quando o group cresce ou diminui (a janela é redimensionada), os painéis com tamanho o mantêm e os painéis sem tamanho absorvem a diferença. Quando o group é pequeno demais para os tamanhos, os painéis encolhem, exceto os `fixed` (uma barra lateral, um inspetor), e voltam aos seus tamanhos quando o espaço retorna. Um painel com `visible={false}` não ocupa espaço: os outros dividem o seu lugar, e ele volta ao seu tamanho quando é exibido de novo.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## Alças

Há uma alça em cada fronteira entre dois painéis visíveis: uma faixa de 9 pontos de espessura no sentido transversal ao eixo, centralizada na fronteira, com o cursor de redimensionamento do seu eixo. Em telas sensíveis ao toque, a área de toque se estende por mais 10 pontos para cada lado, de modo que mesmo uma linha de um ponto continua fácil de agarrar. A alça é um `group`: o que ela desenha é o indicador do app, estilizado com `handleClass` / `handleStyle`: 1 ponto de espessura e todo o comprimento da fronteira, então `bg-border` sozinho é uma linha fina em qualquer eixo, `w-[3px]` ou `h-[3px]` a engrossa, e suas classes `group-hover:` e `group-active:` acompanham o ponteiro sobre a faixa e o toque ou arrasto. Para mais do que uma linha (uma pegada de pontos, um ícone), `renderHandle` renderiza o conteúdo do indicador, recebendo `index`, `axis` e `state` da alça; ele é desenhado de novo quando o estado muda, algumas vezes por arrasto, nunca a cada movimento. Uma pegada animada é o thumb da alça (`handleThumbClass` / `handleThumbStyle`): uma view centralizada na linha, desenhada na vertical e girada um quarto de volta em uma linha horizontal, para que uma única classe sirva aos dois eixos, e que as classes `group-hover:` e `group-active:` exibem e fazem a transição; a alça permanece pressionada durante todo o arrasto, para onde quer que o ponteiro vá.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` mantém todas as alças onde estão (um layout travado).

## Props

### ResizablePanelGroup

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Lado a lado (as alças são arrastadas para a esquerda e a direita) ou empilhados (para cima e para baixo). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem arrastos: as alças permanecem onde estão. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador de cada alça, na fronteira, dentro da faixa da alça: 1 ponto de espessura e todo o comprimento da fronteira, a menos que se diga o contrário (`w-[3px]`, `h-[3px]`); `group-hover:` e `group-active:` acompanham a faixa. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O thumb de cada alça: uma pegada centralizada na linha, desenhada na vertical como em uma linha vertical e girada um quarto de volta em uma horizontal, para que uma única classe sirva aos dois eixos. Ele continua sendo a mesma view enquanto a alça recebe hover, é pressionada e arrastada, então as classes `group-hover:` e `group-active:` fazem a transição dele (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | nenhum | O que há dentro de cada indicador, desenhado de novo quando o `state` da alça muda. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para cada alça: o que ela redimensiona. Eles a ajustam de 10 em 10 pontos. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os `ResizablePanel`s, seus filhos diretos. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | `size-full` | O próprio group; ele preenche o pai, a menos que sua classe diga o contrário. |

### ResizablePanel

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | nenhum | O comprimento desejado ao longo do eixo do group, em pontos, dentro de `minSize` e `maxSize`; um novo valor o redimensiona. Sem um valor, ele divide o que sobra. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | O menor tamanho que ele assume. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | sem limite | O maior tamanho que ele assume. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | Mantém seu tamanho quando o group é pequeno demais para os painéis; arrastar a própria alça ainda o redimensiona. Recebe um `size`. |
| `visible` | `.visible(..)` | `boolean` | `true` | Oculto, ele não ocupa espaço e os outros dividem o seu lugar. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Seu conteúdo. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A superfície do próprio painel. Seu tamanho ao longo do eixo é definido pelo group. |

### ResizeHandleContext

| Campo | Tipo | Descrição |
|---|---|---|
| `index` | `number` | A fronteira após o `index`º painel visível. |
| `axis` | `"horizontal" \| "vertical"` | O eixo ao longo do qual ela redimensiona. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | A distância que o ponteiro ou o dedo percorreu com ela. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | Um arrasto terminou e moveu uma alça, ou um leitor de tela ajustou uma: `sizes`, o tamanho de cada painel visível, na ordem em que estão dispostos (da esquerda para a direita, de cima para baixo). |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | Um arrasto terminou e alterou o tamanho deste painel: `size`, o novo tamanho, para devolver como seu `size`. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| O group | | `ResizablePanelGroup` de `class`, `style` | |
| Um painel | o group | `ResizablePanel` de `class`, `style` | |
| O indicador de uma alça | a faixa da alça, em uma fronteira | `handleClass`, `handleStyle`, `renderHandle` | `group-hover:` sob um ponteiro, `group-active:` enquanto pressionada ou arrastada; `state` em `renderHandle` |
| O thumb de uma alça | centralizado na linha de uma alça | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (pressionado até o fim do arrasto) |

<a id="accessibility"></a>

## Acessibilidade

- Cada alça é um elemento ajustável para leitores de tela, com `handleAccessibilityLabel` como rótulo. Seu valor é o tamanho do painel anterior, dentro de `minSize` e `maxSize` desse painel.
- Deslizar para cima ou para baixo sobre uma alça com o VoiceOver, ou usar as teclas de volume do TalkBack, a move 10 pontos, como um arrasto faria; o group notifica o movimento com `onResize`. As alças de um group `disabled` permanecem onde estão.
- O conteúdo dos painéis é do app e é lido como em qualquer outro lugar.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Desktops (macOS, Windows, Linux, GPUI) e web: o ponteiro sobre uma alça mostra o cursor de redimensionamento de coluna ou de linha, e um arrasto com o mouse ou o touchpad move a fronteira.
- iOS, Android e Mac Catalyst: um dedo arrasta a alça, dentro de uma área de toque 10 pontos mais larga de cada lado do que a faixa.
- Em layouts da direita para a esquerda, os painéis e seus tamanhos seguem a ordem do layout.
- Todas as plataformas desenham o que o app estiliza: os indicadores e os painéis.
- As divisões do [Dock](./dock.md) são groups redimensionáveis: elas são redimensionadas da mesma forma.
