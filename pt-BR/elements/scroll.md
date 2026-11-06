---
title: "Scroll"
description: "A scroll view nativa: rolagem vertical e horizontal, paginação e snapping, pull to refresh, zoom e eventos de rolagem."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---


# Scroll

`Scroll` é uma scroll view nativa (UIScrollView no iOS e no Mac Catalyst, um ScrollView no Android). Ela dispõe todos os seus
filhos como conteúdo e os rola de forma nativa: rolagem, arremesso (fling), efeito elástico e encaixe (snapping) rodam na plataforma, na
taxa de atualização da tela. Em Rust, crie uma com `scroll()`; em TSX, com `<Scroll>` de `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

Uma scroll view cria todos os filhos, o que serve bem para páginas de tamanho moderado. Para dados longos ou ilimitados, use uma
[lista](./list.md): ela cria as linhas próximas da área visível e as recicla.

Uma scroll view precisa de um tamanho limitado ao longo do seu eixo: dê a ela `flex: 1` (`.flex_1()`) ou uma altura dentro de um contêiner que
tenha uma. O conteúdo é disposto com a largura da scroll view (altura, quando horizontal) e tão alto (largo) quanto precisar.

## Props

Além das [props comuns](./index.md#common-props) (com `style` tipado como `ViewStyle`). Em Rust, as props de rolagem
são métodos da trait `Scrollable`, que as listas compartilham.

<a id="scrolling"></a>

### Rolagem

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Rola na horizontal. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | O usuário pode rolá-la. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | O indicador de rolagem aparece: o da plataforma ou a [barra integrada](./scrollbar.md#built-in-bars) do app, quando ele define um tema; um objeto é um tema próprio da view. No desktop e em navegadores desktop, uma view horizontal o mantém: é a barra de rolagem do mouse. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Rolagem além das bordas (overscroll). |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | Para em múltiplos da área visível. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | Para em múltiplos deste comprimento (0: desligado). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | Para nestes deslocamentos. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | Qual ponto de um item se alinha com a área visível com `snapToInterval`. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | Um arremesso (fling) avança no máximo um ponto de encaixe. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | plataforma | Com que rapidez um arremesso desacelera: a velocidade mantida por milissegundo (`normal` 0,998, `fast` 0,99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Espaço ao redor do conteúdo. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Onde ela começa. |
| `contentStyle` | os próprios estilos da view de conteúdo | `ViewStyle` | | O estilo de uma view ao redor dos filhos que rola junto com eles; `flexGrow: 1` faz com que ela tenha pelo menos a altura da área visível (um estado vazio centralizado). |
| `contentClass` | os próprios estilos da view de conteúdo | `string` | | O mesmo que classes, por exemplo `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Se arrastar dispensa o teclado. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Se um toque dispensa o teclado: `never` (o toque apenas o dispensa), `always` (ele permanece aberto), `handled` (ele permanece aberto quando algo trata o toque). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Um valor animado alimentado com o deslocamento da rolagem (eixo principal), para animações vinculadas à rolagem. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | Mínimo de milissegundos entre eventos `onScroll` (no máximo um por quadro de qualquer forma). |

<a id="pull-to-refresh"></a>

### Puxar para atualizar

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | O indicador de atualização aparece. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | O usuário puxou para atualizar: comece a carregar e defina `refreshing` até terminar. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | O app desenha seu próprio indicador, com `height` pontos de altura: o spinner da plataforma fica oculto, um puxão atualiza quando chega a `height`, e, durante a atualização, `height` é mantido acima do conteúdo. Uma altura igual ou menor que 0 significa nenhum. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | Um valor animado alimentado com o quanto a view é puxada além do topo (0 em repouso, crescendo com o puxão; o espaço mantido acima do conteúdo durante a atualização: `height` com `refreshIndicator`), para o indicador do app. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

<a id="zooming"></a>

### Zoom

Definir `maximumZoomScale` acima de `minimumZoomScale` (`.zoom_range(min, max)` em Rust) torna o conteúdo ampliável com um
gesto de pinça; ampliado, ele rola nos dois sentidos. As listas mantêm sua escala.

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | O menor zoom. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | O maior zoom. |
| `zoomScale` | `.zoom(..)` | `number` | | Aplica zoom a esta escala quando ela muda; caso contrário, o zoom do usuário é mantido. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | A pinça pode ultrapassar os limites e volta com efeito elástico. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | O usuário pode usar a pinça para dar zoom. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Conteúdo menor que a área visível (reduzido) é centralizado. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | O deslocamento mudou (no máximo uma vez por quadro e não mais que o intervalo de `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | O usuário começou / parou de arrastar. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Um deslizamento após o arrasto começou / parou. Um deslizamento interrompido por um novo arrasto ainda termina com `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | A rolagem chegou ao repouso. |
| `onRefresh` | `.on_refresh` | nenhum | Puxado para atualizar. |

`ScrollEvent` é `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (em Rust `offset`, `content_size`,
`size`, `zoom_scale`): o deslocamento, o tamanho do conteúdo (com zoom), o tamanho da área visível e a escala de zoom (1, a menos que a view
tenha zoom).

> [!TIP]
> Para mover algo com a posição de rolagem (um cabeçalho que encolhe, uma imagem com parallax), vincule `scrollValue` a um valor
> nativo e interpole-o em um estilo. Isso roda na thread de UI, na taxa de atualização da tela, enquanto `onScroll` é um evento por
> quadro no código do app. Veja [animação](../docs/animation.md).

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descrição |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | Rola até um deslocamento. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | Aplica zoom a `scale` (limitado aos limites) com o ponto do conteúdo (`x`, `y`, pontos sem zoom) no meio da área visível, ou ao redor do meio. Por exemplo, um toque duplo que amplia o ponto tocado. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## Teclado

Campos de entrada dentro de uma scroll view são mantidos fora da área do teclado de forma nativa: a scroll view recebe um inset inferior e rola até
o campo em foco por conta própria. Para conteúdo fora de scroll views, use [`env(keyboard-inset-height)`](./keyboard.md)
em um padding ou margin inferior. Veja [formulários e o teclado](../docs/forms-and-keyboard.md).

<a id="right-to-left"></a>

## Da direita para a esquerda

Scroll views horizontais começam na extremidade direita em layouts da direita para a esquerda e mantêm a distância dela quando o conteúdo
muda; seus filhos são espelhados.

<a id="platform-notes"></a>

## Notas por plataforma

- Android: o puxar para atualizar é desenhado pelo NSH (o overscroll continua nativo), `contentInset` é aplicado como padding, e
  `decelerationRate` molda os deslizamentos de encaixe.
- O Android aplica zoom com a scroll view própria do NSH, que escala o conteúdo a partir do canto superior esquerdo e rola nos dois sentidos.
  As pinças começam depois do vão mínimo do Android entre os dedos (cerca de 27 mm).
- No Mac Catalyst (idioma Mac), o NSH detecta o puxão e mostra seu spinner.
- O iOS redesenha textos e canvases na resolução ampliada quando um zoom termina.
