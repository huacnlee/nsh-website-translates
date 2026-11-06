---
title: "Dock"
description: "DockArea: um espaço de trabalho acoplável com divisões, grupos de abas e docks nas bordas esquerda, direita e inferior, cujo layout são dados pertencentes ao app. A área gerencia o arrastar e soltar de abas, o redimensionamento, os docks, o zoom e o bloqueio, preserva o conteúdo de cada painel enquanto ele é movido e se adapta a celulares; a aparência e o conteúdo dos painéis ficam por conta do app."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---


# Dock

Uma área de docks é um espaço de trabalho que o usuário organiza: painéis em grupos de abas, grupos divididos lado a lado ou empilhados, e docks nas bordas esquerda, direita e inferior que abrem, fecham e redimensionam. Uma aba arrastada para outro grupo entra nele, arrastada para a borda de um grupo o divide, e cada painel mantém o que contém ao ser movido. `DockArea` é responsável pelo comportamento: arrastar e soltar abas, que roda de forma nativa quadro a quadro, redimensionar divisões e docks, abrir e fechar docks, zoom e o bloqueio. A aparência é do app: as abas, as barras de abas, as alças, o indicador de soltura e o conteúdo de cada painel são o que o app renderiza e estiliza, e a área não desenha nada por conta própria.

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` e os valores que ele recebe vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust
(`nsh_base::dock_area()`, os valores em `nsh_base::dock`). Em Rust, `dock_area()` o cria, com um setter por
prop, um listener por evento e os métodos de estilo tipados; `DockLayout` descreve um layout pelas chaves dos painéis
(`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`).

<a id="the-layout"></a>

## O layout

O layout é um valor, `DockAreaLayout`: o centro e um dock em cada uma das bordas esquerda, direita e inferior, cada um
opcional. Cada região é uma árvore com dois tipos de nó:

| Nó | Contém | Campos |
|---|---|---|
| `{ type: "split" }` | Outros nós, lado a lado (`axis: "horizontal"`) ou empilhados (`"vertical"`) | `children` e `sizes`: o comprimento de cada filho ao longo do eixo, em pontos, `null` para dividir o restante |
| `{ type: "tabs" }` | Painéis, por chave, um exibido por vez | `panels` (as chaves, na ordem das abas), `activeIndex` (a exibida, padrão 0) |

Um painel sempre vive em um grupo de abas: uma região com um painel é um grupo de abas de um só. A chave de um painel é a string do app para ele
(`"files"`, o id de um documento), e uma chave aparece uma única vez em todo o layout. Um dock (`DockRegion`) é sua árvore
(`layout`), seu tamanho transversal à borda (`size`, padrão 200, no mínimo 100), se está aberto (`open`, padrão `true`)
e se arrastar sua borda abaixo do menor tamanho o fecha (`collapsible`, padrão `true`).

Todo nó tem um `id`. Um layout que o app escreve pode omitir ids: a área os atribui, e todo layout que ela reporta
os traz. Devolver um layout reportado preserva a identidade de cada grupo, pela qual os métodos do ref nomeiam os grupos. A
área também organiza o que recebe: um grupo ou divisão vazio é removido, uma divisão de um só filho vira esse filho, uma divisão
dentro de uma divisão do mesmo eixo é incorporada ao pai, `activeIndex` permanece dentro do intervalo, e uma chave listada duas vezes mantém sua primeira
posição. Os layouts que ela reporta sempre estão nessa forma canônica.

O layout é do app (`layout`): toda mudança feita pelo usuário (uma aba selecionada, arrastada ou fechada, uma divisão ou dock
redimensionado, um dock aberto ou fechado) é reportada como o novo layout completo (`onLayoutChange`), e a área exibe o
layout que o app devolve. O app altera o layout passando um novo valor: um layout salvo restaurado, um
comando que reorganiza o espaço de trabalho. Uma área sem `layout` mantém o seu próprio, partindo de `defaultLayout`, e
continua reportando todas as mudanças.

<a id="panels-content"></a>

## Conteúdo dos painéis

O que um painel exibe é do app: `renderPanel` o renderiza a partir da chave do painel (`panel.id`). Todos os painéis de um grupo são
posicionados e apenas o exibido é mostrado, então trocar de aba preserva o conteúdo de cada painel; e quando um painel se move (para
outro grupo, para um dock, para um zoom e de volta), o mesmo conteúdo se move com ele: os signals que criou, o texto de um input, a posição de rolagem, a página de uma web view, tudo permanece. A área renderiza um painel uma vez, quando ele aparece pela primeira vez, e descarta o
conteúdo quando o painel deixa o layout (`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` define o que cada painel permite, por chave; um painel não listado permite tudo:

| Campo | Padrão | Descrição |
|---|---|---|
| `id` | | A chave do painel. |
| `closable` | `true` | Pode ser fechado. |
| `zoomable` | `true` | Seu grupo pode receber zoom enquanto ele está exibido. |
| `visible` | `true` | Ele é mostrado. Um painel oculto mantém seu lugar e volta para ele; um grupo ou divisão cujos painéis estão todos ocultos não ocupa espaço. |

<a id="tabs"></a>

## Abas

Cada grupo tem uma barra de abas com uma aba por painel visível, na ordem de seu `panels`. `renderTab` renderiza o que uma aba
mostra (seu título, um ícone, um botão de fechar do app); sem ele, uma aba mostra a chave do painel. A área a transforma na
aba: um toque a seleciona, um arrasto move seu painel, leitores de tela a anunciam como uma aba com seu estado de seleção, e as
classes `selected:` de `tabClass` estilizam a exibida. O valor de uma aba informa o que o app precisa para desenhá-la:

| Campo | Tipo | Descrição |
|---|---|---|
| `panel` | `string` | A chave do painel. |
| `group` | `number` | O id do grupo de abas em que ela está. |
| `index` | `number` | Sua posição entre as abas visíveis do grupo. |
| `active` | `boolean` | É a aba exibida do grupo. |
| `closable` | `boolean` | A área a fecharia: ela é fechável, a área não está bloqueada e seu grupo pode abrir mão dela. |
| `zoomed` | `boolean` | Seu grupo está com zoom. |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## Arrastar e soltar

Uma aba arrastada sobre um grupo mostra onde ela pousaria, e a soltura a coloca ali:

| Solta sobre | O painel |
|---|---|
| Uma barra de abas | Entra nesse grupo, entre as abas ao lado das quais é solto |
| O meio do conteúdo de um grupo | Entra nesse grupo |
| Uma borda do conteúdo de um grupo (os 35% externos de cada lado) | Divide esse grupo: um novo grupo só dele nesse lado |

Enquanto um arrasto paira, a área mostra o indicador de soltura sobre a parte do grupo que o painel ocuparia (todo o
conteúdo para entrar, metade dele para dividir): uma parte que o
app estiliza (`dropIndicatorClass`), com conteúdo próprio se o app renderizar algum (`renderDropIndicator`, que recebe o
`group`, o `side` que ele separa ou a barra de abas `index`). Ele se move para cada novo lugar de forma nativa, suavizando a transição e surgindo gradualmente em outro grupo enquanto o último desaparece (imediatamente quando o usuário pede menos movimento). O que acompanha o ponteiro ou o dedo também é do app
(`renderDragPreview`). Uma soltura é uma única mudança do layout, reportada uma vez; uma soltura que não mudaria nada não muda nada.

Uma área bloqueada, uma com zoom e o último painel de um grupo quando nada está ao lado do grupo não permitem arrastar.

## Docks

Um dock abre e fecha sem perder seus painéis nem seu tamanho: fechá-lo mantém sua árvore, e abri-lo mostra os
mesmos grupos no mesmo tamanho. A borda entre um dock e o centro é uma alça que o usuário arrasta para redimensionar o dock;
ele permanece com pelo menos 100 pontos e o centro mantém pelo menos 100 pontos, e um dock recolhível solto abaixo de 50 pontos
se fecha e guarda seu tamanho para quando abrir. A área sempre cabe em seus limites: um dock é exibido em seu `size` dentro do que
a área lhe deixa, e quando nem isso cabe, os docks encolhem junto com o restante e os tamanhos mínimos das divisões
cedem. `renderDock` desenha o chrome próprio de um dock antes de seu layout (uma faixa de título, um botão de recolher), recebendo seu
`placement`, `open`, `size` e `collapsible`; `dockClass` estiliza seu quadro.

Abra, feche e redimensione docks a partir do app pelo ref (`toggleDock`, `setDockOpen`, `setDockSize`), que funcionam
nas duas apresentações, ou escrevendo `open` e `size` do dock no layout que ele passa (`open` é o da
apresentação completa). `onDockOpenChange` reporta
cada vez que um dock é mostrado ou ocultado, medido em relação ao `open` do layout (uma área que é compacta desde o início reporta
cada dock aberto no layout como oculto), de modo que um alternador que parte do `open` do layout e segue `onDockOpenChange` sempre
mostra o estado do dock:

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

## Zoom

Um grupo com zoom preenche toda a área até que o zoom seja desfeito ou ele deixe o layout (`area.toggleZoom(group)`, e `area.toggleZoom()` para desfazer o
zoom), e `onZoomChange` reporta o painel que ele exibe, ou `null`. O zoom pertence ao grupo, então ele continua com zoom
quando seu painel exibido é fechado e o próximo assume. Um painel com `zoomable: false` impede que seu grupo receba
zoom enquanto ele está exibido.

<a id="locking"></a>

## Bloqueio

`locked` mantém a organização como está: sem arrastar abas, sem soltar, sem fechar. Selecionar abas, redimensionar e abrir e
fechar docks continuam funcionando, então um espaço de trabalho bloqueado ainda é um espaço de trabalho utilizável.

<a id="methods"></a>

## Métodos

`ref={area}` fornece os métodos da área (`DockAreaRef`), para comandos, atalhos e menus do app. Cada edição é
reportada com `onLayoutChange` como as do usuário. Um método que recebe um painel, um grupo, um índice de aba ou um dock que o layout
não tem deixa o layout como está e registra um aviso com o nome do método e o valor.

| Método | Descrição |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: o layout exibido. |
| `addPanel(panel, placement?, size?)` | Adiciona um painel a uma região (`"center"`, o padrão, `"left"`, `"right"`, `"bottom"`), em seu primeiro grupo de abas, exibido; um dock ausente é criado, com `size` de largura. Um painel que a área já contém é movido para lá. |
| `removePanel(panel)` | Remove um painel, independentemente do que suas opções dizem. |
| `closePanel(panel)` | Fecha um painel como sua aba faria: a menos que a área esteja bloqueada, o painel não seja fechável ou seja o último painel de um grupo sem nada ao lado. |
| `movePanel(panel, target)` | Move um painel para `target`: `{ group, side?, index?, activate?, size? }`, para o grupo de abas `group` (em `index`) ou para um novo grupo em seu `side` (`size` pontos ao longo da nova divisão). |
| `splitAt(group, panel, side)` | Coloca um painel em um novo grupo de abas em um lado (`"left"`, `"right"`, `"top"`, `"bottom"`) de um contêiner. |
| `selectPanel(panel)` | Exibe um painel em seu grupo. |
| `selectTab(group, index)` | Exibe uma aba de um grupo. |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | Abre ou fecha um dock. |
| `setDockSize(placement, size)` | Define o tamanho de um dock transversal à sua borda (no mínimo 100). |
| `toggleZoom(group?)` | Aplica zoom em um grupo, ou o desfaz quando ele já está com zoom; sem `group`, desfaz o zoom do grupo com zoom. |
| `zoomedGroup()` | `Promise<number \| null>`: o id do grupo com zoom. |
| `groupOf(panel)` | `Promise<number \| null>`: o id do grupo de abas que contém um painel. |

Em Rust, `component_ref::<DockArea>()` e `.component_ref(&r)` na área fornecem um ref cujo `r.api::<DockAreaApi>()` tem
os mesmos métodos em snake case.

<a id="saving-and-restoring"></a>

## Salvar e restaurar

Um layout reportado é um dado simples, então salvá-lo é `JSON.stringify(layout)` em [storage](../modules/nsh.md#storage),
e restaurá-lo é passar o valor analisado como `layout`. `onLayoutChange` reporta toda mudança, inclusive um redimensionamento e uma seleção de
aba, então grave no storage quando as mudanças se acalmarem (um temporizador curto reiniciado a cada relatório).

Em Rust, `DockAreaLayout::to_state` e `from_state` leem e gravam `DockAreaState`, o formato de arquivo de layout que
o dock de `gpui-base` também usa.

<a id="phones-and-narrow-windows"></a>

## Celulares e janelas estreitas

O dock se adapta à sua própria largura. Uma área com 600 pontos de largura ou mais (em uma janela no desktop, na web, em um tablet, em um
iPad em tela cheia, em um dobrável aberto) é o espaço de trabalho completo: divisões, grupos e docks lado a lado, como nos apps
multipainel de um tablet. Com o dedo em um celular ou tablet, o arrasto de uma aba começa com um toque longo, como no arrastar e soltar do iPadOS, de modo que uma barra de abas
ainda role com um deslize, e as alças ganham uma área de toque maior com a mesma aparência.

Uma área com menos de 600 pontos (em um celular, em um iPad no Slide Over, em uma janela estreita de desktop ou navegador, ou em uma
coluna estreita de uma área larga) apresenta o mesmo layout para uma tela, como as split views do iPad recolhem suas colunas e o painel de apoio do Material Design
vira uma bottom sheet:

- O centro mostra um grupo por vez, em tamanho total. Sua barra de abas lista todos os painéis visíveis do centro, e selecionar
  um painel de outro grupo faz desse grupo o exibido.
- Os docks esquerdo e direito são gavetas sobre o centro a partir de sua borda, tão largas quanto o dock, e o dock inferior é uma
  sheet tão alta quanto o dock. Um é mostrado por vez, quando o app o apresenta (`toggleDock`, `setDockOpen`, que
  dispensam o outro); ele desliza para dentro e para fora, e um toque em seu backdrop, Escape ou voltar o dispensam. Entrar na
  apresentação compacta não mostra nenhum.
- Uma aba arrastada (um dedo após um toque longo, um ponteiro imediatamente) se move dentro da barra de abas para reordená-la.

Todo painel continua posicionado nas duas apresentações, então a troca preserva seu conteúdo. A gaveta ou sheet exibida é
própria da apresentação compacta: o `open` do layout pertence à apresentação completa, e apresentar ou dispensar uma
gaveta não reporta `onLayoutChange`, de modo que uma área que volta a se alargar mostra os docks exatamente como estavam.
`onDockOpenChange` reporta ambos: um dock cujo `open` do layout muda na apresentação completa, uma gaveta ou sheet mostrada
ou dispensada na compacta, e cada dock cujo estado exibido muda quando a apresentação é trocada. Em
`renderDock`, `open` indica se o dock é mostrado na apresentação atual. O layout também continua sendo o mesmo valor,
então uma área que cruza 600 pontos (um dobrável abrindo, um iPad entrando no Split View, uma janela ou uma coluna redimensionada)
mantém cada painel onde estava, e o app salva um único layout. A largura da área decide depois que ela é posicionada (a
largura da janela a substitui antes disso), e `compact` escolhe a apresentação em vez da largura. As
gavetas, a sheet e o backdrop são partes que o app estiliza (`drawerClass`, `sheetClass`, `backdropClass`), como o
restante da área.

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | nenhum | O layout exibido (controlado): passe de volta o que `onLayoutChange` informa. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | um centro vazio | O layout inicial, quando `layout` não está definido; a partir daí a área mantém o seu próprio. |
| `locked` | `.locked(..)` | `boolean` | `false` | Nenhuma aba é arrastada, solta ou fechada. |
| `compact` | `.compact(..)` | `boolean` | por largura | A apresentação de celular (`true`) ou a completa (`false`); sem ela, compacta enquanto a área for mais estreita que 600 pontos. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | O que cada painel permite, por chave: `closable`, `zoomable`, `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | nenhum | O conteúdo de um painel, pela sua chave (`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | a chave | O que uma aba exibe. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | nenhum | O que há dentro do indicador de soltura: `group`, `side`, `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | nenhum | O chrome próprio de um dock, antes do seu layout: `placement`, `open` (exibido na apresentação atual), `size`, `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | nenhum | O que um centro vazio exibe. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | nenhum | O que acompanha o ponteiro ou o dedo enquanto uma aba é arrastada. |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O quadro de cada grupo de abas. |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada barra de abas (`flex-row` para uma linha). |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada aba; `selected:` para a exibida. |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O quadro de conteúdo de cada grupo, onde seus painéis são exibidos. |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador de soltura. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador de cada alça, entre os grupos de uma divisão e na borda de cada dock; `group-hover:` e `group-active:` acompanham a alça. Ele tem 1 ponto de espessura na alça e percorre todo o seu comprimento, a menos que se diga o contrário, então `bg-border` é uma linha fina em ambos os casos; `w-[3px]` / `h-[3px]` o engrossam. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O pegador de cada alça: uma empunhadura centralizada na linha, desenhada na vertical como em uma linha vertical e girada um quarto de volta em uma horizontal, de modo que uma única classe serve aos dois eixos. Ele continua sendo a mesma view enquanto a alça recebe hover, é pressionada e arrastada, então as classes `group-hover:` e `group-active:` fazem a transição dele (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O quadro de cada dock. |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Compacto: as gavetas dos docks laterais. |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Compacto: a folha do dock inferior. |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Compacto: o fundo atrás de uma gaveta ou folha aberta, cujo pressionamento a fecha. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para cada alça, entre os grupos de uma divisão e na borda de cada dock. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | Os [métodos](#methods) da área. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A própria área: seu tamanho no elemento pai (`flex-1`), seu fundo. Ela permanece dentro dos seus limites e não assume nenhum tamanho mínimo a partir do seu conteúdo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | O layout mudou (um arrasto, uma seleção, um redimensionamento, um dock aberto ou fechado, um método): `{ layout }`, o novo layout completo, com todos os ids. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: um painel passou a ser, ou deixou de ser, a aba exibida do seu grupo (um dock fechado não exibe nenhuma). Uma vez por mudança; um painel que sai não recebe `false`: `onPanelRemove` é o seu fim. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: um painel saiu da área definitivamente: fechado, removido ou ausente de um novo layout. Um painel que apenas muda de lugar nunca o recebe. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | Um grupo foi ampliado ou restaurado: `{ panel }`, o painel que ele exibe, ou `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: um dock foi exibido ou ocultado: o `open` do seu layout mudou na apresentação completa, sua gaveta ou folha foi exibida ou dispensada na compacta, ou a apresentação mudou. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| A área | | `class`, `style` | |
| Um grupo de abas | uma região | `groupClass`, `groupStyle` | |
| Uma barra de abas | um grupo | `tabBarClass`, `tabBarStyle` | |
| Uma aba | uma barra de abas | `tabClass`, `tabStyle`; `renderTab` | `selected:`, `active:`, `hover:` |
| O conteúdo de um grupo | um grupo | `contentClass`, `contentStyle`; `renderPanel` | |
| O indicador de uma alça | entre os grupos de uma divisão, na borda de um dock | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| O pegador de uma alça | centralizado na linha de uma alça | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (pressionado até o fim do arrasto) |
| Um dock | uma borda | `dockClass`, `dockStyle`; `renderDock` | |
| O indicador de soltura | sobre um grupo durante um arrasto | `dropIndicatorClass`, `dropIndicatorStyle`; `renderDropIndicator` | |
| A prévia do arrasto | sob o ponteiro ou o dedo | `renderDragPreview` | |
| O centro vazio | o centro | `renderEmpty` | |
| Uma gaveta, a folha, o fundo | sobre o centro, no modo compacto | `drawerClass`, `sheetClass`, `backdropClass` (e seus estilos) | |

<a id="accessibility"></a>

## Acessibilidade

- Cada aba é uma aba com seu estado de selecionada para os leitores de tela, como [`Tab`](./tabs.md) é, e ativá-la a
  seleciona. Seu rótulo é o texto que `renderTab` desenha.
- Toda alça, entre os grupos de uma divisão e na borda de cada dock, é um elemento ajustável com o rótulo
  `handleAccessibilityLabel`. As alças entre os grupos de uma divisão são as de [Resizable](./resizable.md): um leitor de tela
  as move 10 pontos por vez, informados com `onLayoutChange`.
- Na apresentação compacta, Escape e voltar dispensam a gaveta ou a folha exibida.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Um ponteiro (um mouse, um trackpad, uma caneta pairando sobre a tela) arrasta uma aba depois de se mover 4 pontos com o botão
  pressionado, em todas as plataformas: um iPad com trackpad e uma janela estreita de navegador controlada por um arrasto de mouse
  funcionam como um desktop. No macOS, Windows, Linux e GPUI todo toque conta como de um ponteiro, inclusive o de um dedo na
  tela sensível ao toque de um laptop.
- Um dedo no iOS, iPadOS e Android arrasta uma aba após um toque longo, como o arrastar e soltar do iPadOS, então um deslize sobre
  a barra de abas a rola.
- Desktops e a web: as alças mostram o cursor de redimensionamento do seu eixo.
- Celulares e áreas estreitas: a apresentação compacta, com gavetas e uma folha inferior.
- Todas as plataformas desenham o que o app estiliza: abas, barras de abas, alças, o indicador de soltura, docks, gavetas e a folha.
