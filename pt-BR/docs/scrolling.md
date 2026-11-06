---
title: "Rolagem"
description: "Scroll views em Rust e TSX - paginação e snapping, zoom, pull to refresh, eventos de rolagem, efeitos vinculados à rolagem com scrollValue, o teclado em scroll views e rolagem via código."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---


# Rolagem

A scroll view (`scroll()` em Rust, `<Scroll>` em TSX) é a scroll view própria da plataforma (UIScrollView no iOS, uma ScrollView no Android): flings, bounces, o indicador de rolagem e o pull to refresh são nativos, e o snapping também. Seu código fica sabendo da rolagem por meio de eventos e pode vincular o offset a um [valor animado](./animation.md#animated-values) para criar efeitos que acompanham o dedo quadro a quadro.

Use uma scroll view para conteúdo de tamanho conhecido e moderado: uma página de configurações, um formulário, um artigo, uma linha de chips. Para dados longos ou ilimitados, use uma [lista](./lists.md), que recicla linhas e aceita as mesmas props de rolagem.

<a id="a-scroll-view"></a>

## Uma scroll view

Uma scroll view é a viewport; seus filhos são o conteúdo. A viewport precisa receber um tamanho do pai (normalmente `flex: 1`, `.flex_1()`), e o conteúdo é disposto na largura da viewport (vertical) ou na altura (horizontal) e tão longo quanto precisar.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

A view filha acima é o contêiner de conteúdo da scroll view; em TSX, `contentStyle` (ou `contentClass`) cria um para você, envolvendo os filhos em uma view com esse estilo, que rola junto com eles. `flexGrow: 1` (`.flex_grow(1.0)`) faz o conteúdo ter pelo menos a altura da viewport, de modo que um conteúdo curto possa ser centralizado e um conteúdo longo continue rolando:

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

Uma scroll view horizontal recebe `horizontal` (`.horizontal()`) e uma linha como filha:

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

Em idiomas da direita para a esquerda (veja [Dispositivo e ambiente](./device-and-environment.md#right-to-left)), uma scroll view horizontal começa na extremidade direita e mantém a distância a partir dela.

Os dedos arrastam as scroll views. No desktop (macOS, Windows, Linux) e no navegador, o mouse rola como nos apps de desktop: com a roda (Shift + roda rola na horizontal), o touchpad, o teclado e o indicador de rolagem, que aparece enquanto o mouse se move sobre a view e pode ser arrastado como uma barra de rolagem; os arrastos do mouse vão para os pans, responders e seleção de texto do app. As telas sensíveis ao toque em desktops arrastam as scroll views como os dedos fazem. As views horizontais mantêm o indicador nesses ambientes mesmo com `scrollbar={false}`, pois é por ele que um mouse sem roda horizontal as move.

<a id="behavior-props"></a>

### Props de comportamento

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Rola na lateral. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | O usuário pode rolá-la. A rolagem por código continua funcionando. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Overscroll além das bordas. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | O indicador de rolagem é exibido. No desktop e em navegadores de desktop, uma view horizontal o mantém: ele é a barra de rolagem do mouse. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Espaço ao redor do conteúdo, no qual é possível rolar. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Onde ela começa. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | o da plataforma | Com que rapidez um fling desacelera: `"normal"`, `"fast"` ou a velocidade mantida por milissegundo (`0.998` é normal, `0.99` é rápido; `0` é o padrão da plataforma). |

<a id="paging-and-snapping"></a>

## Paginação e snapping

O snapping é decidido de forma nativa quando o dedo é levantado, a partir do offset no momento da soltura, do deslize projetado e da velocidade; a scroll view então desliza até a parada escolhida, sem nenhum código seu envolvido.

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | Para em múltiplos do tamanho da viewport. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | Para em múltiplos deste comprimento (0: desligado). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | Para nestes offsets. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | Com `snapToInterval`: qual ponto de um item se alinha com a viewport. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | Um fling avança no máximo uma parada. |

Um pager: páginas com a mesma largura da scroll view e um indicador atualizado quando o deslize termina.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

Um carrossel de cards que se encaixam no centro, um card por fling:

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

As listas aceitam as mesmas props de snapping, o que as torna a melhor escolha para um carrossel longo.

<a id="scroll-events"></a>

## Eventos de rolagem

| Prop | Rust | Payload | Quando |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | O offset mudou. No máximo uma vez por quadro; `scrollEventThrottle` espaça mais os eventos. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | Mínimo de milissegundos entre eventos `onScroll`. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | O usuário começou a arrastar. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | O usuário levantou o dedo. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | O deslize após um fling começou. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | O deslize terminou (também quando um novo arrasto o interrompe). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | Uma rolagem do usuário parou: após o deslize, ou ao fim de um arrasto sem deslize. |

`ScrollEvent` traz o offset (`offset`, um `Point`; o mesmo em Rust), o tamanho do conteúdo, com zoom (`contentSize`, um `Size`; `content_size`), a viewport (`size`) e `zoomScale` (`zoom_scale`). Os outros eventos trazem o offset: `{ offset }` com um `Point` em TSX, um `Point<Points>` em Rust.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` executa seu código a cada quadro de uma rolagem (sujeito ao throttle). Para algo que só precisa *parecer* vinculado à rolagem, como um cabeçalho que desaparece gradualmente ou uma imagem com parallax, use [`scrollValue`](#scroll-linked-effects-scrollvalue): ele é executado inteiramente de forma nativa.

<a id="scroll-linked-effects-scrollvalue"></a>

## Efeitos vinculados à rolagem: scrollValue

`scrollValue` (`.scroll_value(&value)`) recebe um [valor animado](./animation.md#animated-values) e grava nele o offset de rolagem (ao longo do eixo principal) de forma nativa, no mesmo quadro em que o conteúdo se move. Vincule esse valor, ou nós derivados dele com `interpolate`, `diffClamp` (`diff_clamp`) ou aritmética, a estilos.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

Um cabeçalho que desliza para fora enquanto o conteúdo rola para cima e volta assim que ele rola para baixo é `diffClamp` do offset:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

Por padrão, as interpolações limitam o valor fora do intervalo de entrada, então puxar além do topo (um offset negativo) mantém o efeito no seu extremo; passe `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` em Rust) para um cabeçalho elástico que cresce conforme você puxa.

## Pull to refresh

`refreshing` e `onRefresh` (`.refreshing(..)` e `.on_refresh(..)`) adicionam o controle de pull-to-refresh da plataforma. O controle é exibido enquanto `refreshing` for verdadeiro; defina-o em `onRefresh` e limpe-o quando o trabalho terminar.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

No iOS, o controle é o UIRefreshControl; no idioma Mac do Mac Catalyst, o NSH exibe seu próprio spinner com o mesmo comportamento. As listas aceitam as mesmas props. No desktop e no navegador, o puxar é um gesto de tela sensível ao toque (ou de trackpad do macOS, que puxa além do topo), já que o mouse rola sem arrastar; ofereça outra forma de atualizar nesses ambientes, como um botão ou um atalho de teclado.

<a id="an-indicator-of-your-own"></a>

### Um indicador próprio

A aparência do puxar fica a critério do app. `refreshIndicator={{ height }}` indica que o app desenha seu próprio indicador, `height` pontos de altura: o spinner da plataforma fica oculto, um puxar atualiza assim que alcança `height`, e durante a atualização `height` ficam acima do conteúdo para o indicador. `pullValue` alimenta um valor animado com o quanto o conteúdo foi puxado além do topo: 0 em repouso, crescendo com o puxar, e `height` enquanto atualiza. Desenhe o indicador sobre o topo da scroll view e interpole seus estilos a partir do valor: eles acompanham o dedo na thread de UI, sem JS por quadro.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

Mantenha `height` dentro de metade da viewport: além do topo, o conteúdo resiste mais ao dedo quanto mais longe ele vai, e uma altura excessiva nunca é alcançada. No iOS, um indicador próprio do app substitui o UIRefreshControl pelo puxar que o próprio NSH detecta, como no idioma Mac.

<a id="zooming"></a>

## Zoom

Uma scroll view (as listas mantêm a escala 1) dá zoom quando sua escala máxima de zoom é maior que a mínima: o gesto de pinça escala o conteúdo e, com zoom aplicado, ele rola nos dois sentidos.

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | O menor zoom. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | O maior zoom; acima do mínimo, a pinça dá zoom. |
| `zoomScale` | `.zoom(scale)` | `number` | | Aplica zoom nesta escala quando a prop muda; caso contrário, o zoom do usuário é mantido. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | A pinça pode ultrapassar os limites e retorna com efeito de mola. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | O usuário pode fazer pinça para dar zoom. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Conteúdo menor que a viewport (com zoom reduzido) fica centralizado. |

O evento de rolagem informa a escala de zoom e o tamanho do conteúdo com zoom. Pelo código, `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` aplica zoom de modo que o ponto do conteúdo (em pontos sem zoom) fique no meio da viewport; o toque duplo para dar zoom é um handler de press que o chama:

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

Textos e canvases dentro de uma scroll view com zoom são desenhados novamente na nova resolução quando o zoom termina, de modo que permanecem nítidos no iOS. No Android, o NSH aplica o zoom com uma scroll view própria, que escala em torno do ponto focal da pinça, faz pan com qualquer número de dedos, faz fling e efeito elástico nas bordas e nos limites de zoom. O Android inicia uma pinça quando os dedos estão a cerca de 27 mm de distância, como faz o detector de gestos do sistema.

<a id="scrolling-from-code"></a>

## Rolando a partir do código

Dê à scroll view uma ref (`element_ref()` e `.element_ref(&scroller)` em Rust, um [`ref`](./jsx-and-components.md) em TSX) e chame seus métodos. Os comandos são executados depois do restante das alterações na mesma atualização, então rolar até um conteúdo que você acabou de adicionar funciona.

| Rust | TSX | Descrição |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Rola até um offset. Animado por padrão em TSX. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | Scroll views com zoom: aplica zoom em `scale` (limitado aos limites), em torno do ponto do conteúdo ou do meio. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

As listas adicionam `scrollToIndex`, `scrollToOffset` e `scrollToEnd`; veja [Listas](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## Scroll views e o teclado

O NSH mantém um input em foco visível por conta própria: quando o teclado aparece, a scroll view ao redor do input recebe um inset inferior com a altura do teclado e rola o input até ficar visível. Isso acontece de forma nativa, sem código no seu app. Use `env(keyboard-inset-height)` como padding inferior ([Conteúdo fora das scroll views](./forms-and-keyboard.md#content-outside-scroll-views)) para o conteúdo fora de scroll views, como uma barra de mensagem fixada na parte inferior.

Duas props decidem como a rolagem e os toques interagem com o teclado:

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Define se arrastar o conteúdo oculta o teclado. `"interactive"` faz o teclado acompanhar o dedo para baixo no iOS; no Android, comporta-se como `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | O que um toque faz enquanto o teclado está aberto. |

`keyboardShouldPersistTaps`:

- `"never"`: um toque fora do input em foco apenas oculta o teclado, e os botões recebem o toque seguinte. O usuário toca uma vez para dispensar e outra para pressionar.
- `"handled"`: um toque em algo que o trata (um botão) passa adiante e o teclado permanece; um toque em um espaço vazio o oculta. Geralmente a escolha certa para formulários.
- `"always"`: o teclado permanece aberto durante todos os toques.

Ambas são decididas de forma nativa quando o toque ou o arrasto acontece, sem esperar pelo seu código. Para ocultar o teclado pelo código, chame `dismiss_keyboard()` em Rust ou `Keyboard.dismiss()` de [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) em TSX.

<a id="nested-scroll-views"></a>

## Scroll views aninhadas

Uma scroll view horizontal dentro de uma vertical funciona como esperado: cada uma recebe os arrastos ao longo do seu próprio eixo. Duas scroll views no mesmo eixo também podem ser aninhadas (a interna rola primeiro). Responders que precisam do dedo, como um canvas de desenho dentro de uma scroll view, o mantêm longe das scroll views ao redor: `.keep_touches(true)` em Rust, `true` retornado de `onResponderGrant` em TSX; veja [Toque e gestos](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## Relacionados

- [Scroll](../elements/scroll.md): a referência do elemento, com todas as props e eventos.
- [Listas](./lists.md): listas virtualizadas com as mesmas props de rolagem.
- [Animação](./animation.md): valores animados, `interpolate` e `diffClamp` para efeitos vinculados à rolagem.
- [Formulários e o teclado](./forms-and-keyboard.md): inputs, foco e o teclado.
