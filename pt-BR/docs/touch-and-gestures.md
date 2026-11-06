---
title: "Toque e gestos"
description: "Pressionamentos e feedback de pressionamento, áreas de toque, eventos de ponteiro, toques brutos, o sistema de responder, PanResponder e gestos nativos de arrastar, pinça e rotação."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---


# Toque e gestos

O NSH tem três níveis de tratamento de toque. **Pressionamentos** (`.on_press` em Rust, `onPress` em TSX e seus equivalentes) cobrem botões, linhas e links, com o feedback de pressionamento desenhado nativamente. **Gestos nativos** (pan, pinch e rotação) movem [valores animados](./animation.md#animated-values) na thread de UI, então um card arrastado acompanha o dedo mesmo quando o seu código está ocupado. **Toques brutos e o sistema de responders** (`.on_touch` e `.claim_touches` com os handlers `.on_responder_*` em Rust; `onTouchStart`, `onResponderMove` e `PanResponder` em TSX) dão ao seu código a posição de cada dedo, para tudo o que os outros dois níveis não conseguem expressar, como desenhar.

Escolha o nível mais alto que resolva o problema: quanto mais alto o nível, menos trabalho passa da thread de UI para o seu código.

<a id="presses"></a>

## Pressionamentos

Todo elemento aceita os handlers de pressionamento; não existe um componente "touchable" separado. Coloque `.on_press` / `onPress` em uma view, um texto, uma imagem ou qualquer outra coisa.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | Padrão | Descrição |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | O dedo foi levantado dentro da view (após um pressionamento, não um toque longo). |
| `.on_long_press(..)` | `onLongPress` | | O dedo permaneceu pressionado pelo tempo de espera do toque longo. O handler de pressionamento não é chamado em seguida. |
| `.on_press_down(..)` | `onPressDown` | | O pressionamento começou. |
| `.on_press_up(..)` | `onPressUp` | | O pressionamento terminou: o dedo foi levantado, deslizou para fora ou foi assumido por uma scroll view. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | Milissegundos antes de um pressionamento se tornar um toque longo. |
| `.disabled(..)` | `disabled` | `false` | Não recebe pressionamentos e não mostra feedback; aplica o estilo de desabilitado; leitores de tela anunciam que está desabilitado. |

Como os pressionamentos se comportam:

- **Apenas a view pressionável mais interna responde.** Uma linha pressionável que contém um botão pressionável não recebe o pressionamento quando o botão é pressionado.
- **Dentro de uma scroll view, o pressionamento espera cerca de 130 ms** antes de começar (e de mostrar o feedback), de modo que um arraste que começa em um botão rola a tela em vez de pressioná-lo.
- **Deslizar para fora cancela.** Mover o dedo para fora da view encerra o pressionamento com o handler de press-up e sem pressionamento.
- **Desabilitar remove os listeners de pressionamento** do que está montado, então a view não mostra nenhum feedback, e o estilo de desabilitado é aplicado (`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **Spans de texto aninhados com um handler de pressionamento são links.** O parágrafo é uma única view nativa; o pressionamento vai para o span sob o dedo. Veja [Text](./text.md).

<a id="press-feedback"></a>

## Feedback de pressionamento

O feedback de pressionamento é do app: são os estilos que a view assume enquanto está pressionada, com o ponteiro sobre ela, com foco ou desabilitada. Eles são aplicados nativamente no instante em que o estado muda, sem ida e volta até o seu código. Cada estado tem um método em Rust, uma prop de estilo em TSX e uma [variante do Tailwind](./tailwind.md):

| Rust | Prop TSX | Classe | Descrição |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | Enquanto pressionada. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | Enquanto um ponteiro está sobre ela (desktops, ponteiros do iPad, navegadores). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | Enquanto tem foco. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | Enquanto ela ou uma view dentro dela tem foco: a moldura de um campo ao redor do input que edita. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | Enquanto desabilitada. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | O ripple do Material no Android (`color`, `borderless`, `radius`, `foreground`), além dos estilos. |

Os estilos de estado são aplicados sobre os estilos próprios da view. Os estados posteriores vencem (hover, focus, active), o estilo de desabilitado vence todos, e os demais não se aplicam enquanto a view está desabilitada.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

Um ripple sem borda se espalha para fora da view, o que combina com botões de ícone: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. Veja [Platform-specific code](./platform-specific.md).

Com uma transição (`.transition()`, a classe `transition`), a mudança de estado é animada. `.group()` (a classe `group`) transforma uma view em um grupo, e `.group_active(..)` (`group-active:`) estiliza seus filhos enquanto ela está pressionada:

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## Áreas de toque: hitSlop

O hit slop (`.hit_slop(..)`, `hitSlop`) estende a área que recebe toques além dos limites da view, sem alterar o layout dela. Use-o em alvos pequenos, como botões de fechar e toggles.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | Descrição |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | Pontos adicionados ao redor dos limites. `EdgeInsets::all(..)` e um número em TSX se aplicam aos quatro lados. |

Mantenha a área estendida dentro dos limites do pai (dê à view pequena alguma margem ou padding ao redor): o hit testing chega a um filho através do pai, então um toque fora do pai nunca alcança o slop do filho.

<a id="children-outside-their-parent"></a>

## Filhos fora do pai

Um filho posicionado fora dos limites do pai (posicionado de forma absoluta com `overflow` deixado visível, como um dropdown abaixo do seu campo) recebe toques onde é desenhado, como qualquer outra view: o NSH faz nativamente o hit testing dos descendentes que se estendem para fora de uma view. Um pai que recorta o overflow também os recorta, e nesse caso eles não aparecem nem recebem toques ali. A área é calculada a partir do layout, então um filho movido para fora do pai por uma transformação só recebe toques dentro dos limites do pai.

Atenção à ordem de desenho: um dropdown só é desenhado sobre os irmãos do seu campo se o campo vier depois deles ou tiver um `z-index` maior, e os toques vão para o que é desenhado por cima.

## pointerEvents

A chave de estilo `pointerEvents` (`.pointer_events(..)` em Rust) decide quais views de uma subárvore podem ser o alvo de um toque. Ela é avaliada nativamente durante o hit testing, então não custa nada por toque.

| Rust | TSX | A view | Seus filhos |
|---|---|---|---|
| `PointerEvents::Auto` (padrão) | `"auto"` | Recebe toques | Recebem toques |
| `PointerEvents::None` | `"none"` | Nunca é o alvo | Nunca são o alvo, a menos que algum defina `"auto"`: os toques passam para o que está atrás |
| `PointerEvents::BoxNone` | `"box-none"` | Nunca é o alvo | Recebem toques |
| `PointerEvents::BoxOnly` | `"box-only"` | Recebe toques | Nunca são o alvo |

Os usos típicos: um overlay que não deve bloquear o que está embaixo dele (none), um container de tela cheia cujo espaço vazio deve deixar os toques passarem para o conteúdo atrás enquanto seus botões continuam funcionando (box-none), e uma linha que deve receber um pressionamento mesmo quando o dedo cai sobre um filho (box-only).

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` é herdado como o `pointer-events` do CSS: uma view dentro dele que define `"auto"` volta a receber toques. `"box-none"` e `"box-only"` se aplicam à view que os define. As classes do Tailwind `pointer-events-none` e `pointer-events-auto` definem `"none"` e `"auto"`, e, como chave de estilo, `pointerEvents` também aceita estilos de estado (`activeStyle`, ...) e variantes.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## Gestos nativos: pan, pinch e rotação

Para arrastes, pinças e rotações que movem algo na tela, vincule [valores animados](./animation.md#animated-values) ao gesto. O reconhecedor de gestos da plataforma escreve os valores na thread de UI e as views vinculadas a eles se movem no mesmo frame; seu código é avisado quando o gesto começa e termina.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | Descrição |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | Arrastes com um dedo movem esses valores, em pontos. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | Pinças com dois dedos controlam `scale` (um fator). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | Rotações com dois dedos controlam `angle`, em graus. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | O arraste começou / terminou, com um `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | A pinça começou / terminou: sua escala e velocidade (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | A rotação começou / terminou: seu ângulo (Rust: `GestureEvent<Radians>`) e velocidade. |

Um evento de pan tem a translação (`translation`, um `Point`: pontos desde o início), a velocidade (`velocity_x` / `velocity_y`; TSX: `velocity`, um `Point`: pontos por **segundo**) e os valores vinculados naquele momento (`value_x` / `value_y`; TSX: `value`, `{ x?, y? }` com os eixos que `pan` vincula).

O que o lado nativo faz por você:

- **Um arraste continua de onde o valor está.** No início, os valores são lidos e a translação é somada a eles; pegar um valor que ainda está sendo animado (uma spring voltando para casa) interrompe a animação onde ela está.
- **Um único eixo deixa o outro rolar.** Com apenas um valor horizontal vinculado, o arraste só começa quando o dedo se move mais na horizontal do que na vertical, então uma linha de deslize horizontal dentro de uma scroll view vertical ainda rola na vertical. Essa decisão é tomada nativamente quando o sistema pergunta se o gesto pode começar.
- **Pan, pinch e rotação rodam juntos** na mesma view: um card pode ser arrastado, pinçado e rotacionado ao mesmo tempo.
- **Velocidade de soltura para a física.** A velocidade do fim do pan alimenta diretamente a velocidade de uma spring ou de um decay; os valores permitem escolher um ponto de encaixe.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> Vincule valores animados ao gesto, em vez de acompanhá-lo pelo responder, sempre que o arraste apenas mover coisas. Com valores vinculados, um código de app ocupado não consegue fazer o arraste travar; com o responder, cada movimento é um evento para o seu código e uma atualização do que a view mostra.

<a id="raw-touches"></a>

## Toques brutos

Os handlers de toque informam cada dedo conforme ele toca a tela, se move e é levantado. São úteis para logging, hit testing personalizado e reação a multitoque; eles não reivindicam o toque (pressionamentos e scroll views continuam funcionando).

Em Rust, `.on_touch(..)` recebe todas as fases como um `TouchEvent`: seu `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), seu `timestamp` e seu `points`, cada dedo que está na tela, cada um com seu `id`, seu `location` na view em que tocou, sua posição `page` na superfície e `changed` para os dedos a que o evento se refere. Em TSX, cada fase tem seu próprio handler:

| TSX | Descrição |
|---|---|
| `onTouchStart` | Um dedo tocou a view ou algo dentro dela. |
| `onTouchMove` | Um dedo se moveu. Os movimentos são mesclados por turno do engine. |
| `onTouchEnd` | Um dedo foi levantado. |
| `onTouchCancel` | O sistema assumiu o toque (uma scroll view começou a rolar, chegou uma chamada). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | Os mesmos, chamados de fora para dentro, antes dos handlers de bubbling. |

Cada handler em TSX recebe um `GestureResponderEvent`:

| Campo | Descrição |
|---|---|
| `identifier` | Identifica o dedo enquanto ele está na tela. |
| `locationX`, `locationY` | Posição na view em que o dedo tocou (`target`). |
| `pageX`, `pageY` | Posição na superfície. |
| `target` | O id da view em que o dedo tocou. |
| `timestamp` | Milissegundos. |
| `touches` | Todos os dedos que estão na tela. |
| `changedTouches` | Os dedos a que este evento se refere. |
| `nativeEvent` | O próprio evento, então `e.nativeEvent.locationX` também funciona. |
| `stopPropagation()` | As views mais externas não veem este evento de toque. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### Onde está uma view: measure

A localização de um toque é relativa à view em que o dedo tocou, que pode ser filha da view que lhe interessa (o knob de um slider). Medir uma view diz onde ela está, para que você possa usar a posição na página. Em Rust, coloque um `element_ref()` na view e aguarde (await) seu `measure()`; em TSX, chame `measure()` na ref dela:

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

Ele é resolvido quando as mudanças feitas até o momento já passaram pelo layout: em Rust, para um `Measurement` (`frame`, o frame no pai como o handler de layout o informa, e `page`, o canto superior esquerdo), em TSX, para `{ bounds, pagePosition }`. O canto está na superfície, ou no diálogo em que a view está, nas mesmas coordenadas das posições de página dos toques. Os offsets das scroll views e listas ao redor são levados em conta; transformações (incluindo animações) não são. Ele é resolvido para `None` / `null` no caso de uma view que não está na tela.
<a id="the-responder-system"></a>

## O sistema de responder de gestos

Quando o seu código precisa assumir o controle de uma sequência de toques (desenhar com o dedo, um slider personalizado, um gesto que os reconhecedores nativos não oferecem), use o sistema de responder de gestos. Uma view de cada vez é o **responder** e recebe os movimentos; as views negociam entre si quem será ele.

Tornar-se o responder:

| Rust | TSX | Descrição |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` retornando `true` | Consultado quando um dedo toca a tela, do alvo para fora. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` retornando `true` | Consultado a cada movimento enquanto não há responder (ou para assumir o controle). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | Como o anterior, mas consultado de fora para dentro, antes dos de bubbling. Um pai o usa para tomar um toque de seus filhos. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | A versão para movimentos. |

Uma reivindicação é decidida apenas a partir da view, sem que nenhum código seu seja executado, a menos que ela peça: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` reivindica quando o listener chama `r.claim()`, decidindo com o gesto até o momento (`r.event.gesture`). Os handlers de TSX recebem o gesto como segundo argumento, `gestureState`, com os mesmos campos do [PanResponder](#panresponder) (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`). Um swipe que reivindica apenas movimentos horizontais: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. Essa decisão ainda chega um movimento atrasada, então uma scroll view ao redor pode começar a rolar primeiro; para arrastes dentro de scroll views, use a [ativação de pan](#pans-inside-scroll-views-panactivation).

Enquanto responde:

| Rust | TSX | Descrição |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | Esta view agora é o responder. Em Rust, por padrão as scroll views nativas ficam impedidas de pegar os toques (`TouchClaim::block_native(false)` permite que peguem); em TSX, retorne `true` para isso. |
| `.on_responder_reject(..)` | `onResponderReject` | Outra view é o responder e não quis ceder. |
| `.on_responder_start(..)` | `onResponderStart` | Outro dedo tocou a tela. |
| `.on_responder_move(..)` | `onResponderMove` | Um dedo se moveu. |
| `.on_responder_end(..)` | `onResponderEnd` | Um dedo foi levantado. |
| `.on_responder_release(..)` | `onResponderRelease` | O último dedo foi levantado: o gesto terminou. |
| `.keep_touches(true)` | `onResponderTerminationRequest` retornando `false` | Outra view quer os toques: mantenha-os (por padrão eles são cedidos). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | Outra view, ou um gesto nativo, tomou os toques. |

O responder de um componente Rust permanece pressionado desde a sua concessão até o fim de seus toques, para onde quer que o dedo ou o ponteiro vá, assim como o `:active` do CSS se mantém até que o botão seja solto: seus estilos `.active(..)` e as classes `group-active:` dentro dele mantêm a aparência durante todo o arraste (um handle de redimensionamento arrastado para fora da sua faixa).

Os handlers de Rust recebem um `ResponderEvent`: o `location` do dedo na view em que ele tocou, sua posição `page`, o `timestamp` e o `gesture` desde a concessão.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

Como funciona: uma view com qualquer handler de toque ou de responder escuta os toques de forma nativa; a plataforma reporta os toques sobre ela (e dentro dela) com o caminho das views que escutam, e a negociação roda no núcleo Rust do NSH, consultando as reivindicações e chamando seus handlers em ordem: primeiro as capturas, da view mais externa para dentro, depois as demais, do alvo para fora. Duas consequências:

- **Scroll views nativas e responders competem.** Enquanto um responder as bloqueia, as scroll views ao redor deixam de pegar os toques até que ele termine. Se uma scroll view nativa começar a arrastar primeiro, ela vence: o responder recebe o handler de terminate e os handlers de toque recebem um cancelamento.
- **Cada movimento é um evento para o seu código.** Arrastes conduzidos por responder são tão suaves quanto o seu código é rápido; para arrastes que apenas movem views, prefira [valores vinculados](#native-gestures-pan-pinch-and-rotation).

## PanResponder

Em Rust, os eventos do responder já carregam o gesto: `ResponderEvent::gesture` é um `PanGesture` com a distância desde o início, a velocidade e o número de dedos. Em TSX, `PanResponder` de `nsh` envolve o sistema de responder e adiciona o mesmo estado de gesto; aplique o seu `panHandlers` com spread em uma view.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

O estado do gesto:

| Rust (`PanGesture`) | TSX (`gestureState`) | Descrição |
|---|---|---|
| | `stateID` | Identifica o gesto. |
| `position` | `moveX`, `moveY` | A posição mais recente do centroide dos toques, em pontos da superfície. |
| `origin` | `x0`, `y0` | Onde o centroide estava quando o responder foi concedido. |
| `delta` | `dx`, `dy` | Distância percorrida desde a concessão. |
| `vx`, `vy` | `vx`, `vy` | Velocidade, em pontos por segundo. |
| `active_touches` | `numberActiveTouches` | Dedos na tela. |

`PanGesture::begin` e `PanGesture::update` acompanham um gesto a partir de toques brutos (`.on_touch`) em Rust. Os callbacks de TSX recebem `(event, gestureState)`: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` e `onShouldBlockNativeResponder`. O último tem como padrão `true`: um PanResponder concedido impede que as scroll views nativas peguem os seus toques.

<a id="pans-inside-scroll-views-panactivation"></a>

## Pans dentro de scroll views: panActivation

Um gráfico explorado lateralmente dentro de uma scroll view vertical precisa pegar os arrastes horizontais e deixar os verticais para a scroll view. Reivindicar o toque no início bloqueia a rolagem desde o primeiro pixel, e decidir nos movimentos em seu código é tarde demais: quando ele responde, a scroll view pode já ter tomado o toque. A ativação de pan (`TouchClaim::on_pan(..)`, `panActivation`) deixa a plataforma decidir na main thread, conforme o dedo se move:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | Descrição |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | O pan é ativado quando o dedo se move além desta distância do ponto em que tocou, ao longo daquele eixo (em qualquer direção, em pontos). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | O pan falha quando o dedo se move além desta distância primeiro: as scroll views ficam com os toques. |

`PanActivation::horizontal(active, fail)` e `PanActivation::vertical(active, fail)` definem os pares mais comuns. Sem offsets ativos, o pan é ativado após 10 pontos em qualquer direção. Até que seja ativado, as scroll views ao redor esperam por ele (iOS) e as outras reivindicações da view não são consultadas. Quando ele é ativado, as scroll views não podem mais pegar esses toques e a view se torna o responder (a concessão, depois os movimentos); quando falha, a scroll view rola normalmente. Em TSX, os `panHandlers` de `PanResponder` também funcionam com ele: aplique-os com spread ao lado da prop, e `onPanResponderGrant` é executado na ativação.

> [!NOTE]
> Toda velocidade é em pontos por segundo: `vx` / `vy` do gesto do responder, a velocidade de um pan e a de uma spring ou de um decay, de modo que `vx` vai para uma spring ou um decay como está.

<a id="why-some-answers-are-props"></a>

## Por que algumas respostas são props

A main thread nunca espera pelo seu código. Quando o sistema precisa de uma resposta na hora (este gesto de pan pode começar, este ponto atinge a view, este toque deve dispensar o teclado), o NSH responde de forma nativa a partir do que foi montado de antemão: os valores de pan vinculados (seus eixos), o valor de pinch, o hit slop, os eventos de ponteiro, a configuração de toques com teclado das scroll views, a ativação de pan. Seus handlers só ficam sabendo do que aconteceu depois. É por isso que essas são configurações declarativas em vez de callbacks, e por isso a negociação de responder, que executa o seu código, apenas decide entre responders e nunca bloqueia um gesto nativo.

<a id="related"></a>

## Veja também

- [`View`](../elements/view.md): todas as props de toque do elemento básico.
- [Animação](./animation.md): valores animados, springs e decay para movimento conduzido por gestos.
- [Rolagem](./scrolling.md): a configuração de toques com teclado, scroll views e gestos aninhados.
- [`PanResponder`](../modules/nsh.md#panresponder): a referência de `PanResponder`.
- [Acessibilidade](./accessibility.md): views pressionáveis são elementos de acessibilidade; dê a elas uma role e um label.
