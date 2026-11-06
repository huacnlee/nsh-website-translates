---
title: "Animação"
description: "Motions (entradas, saídas, chamadores de atenção e loops prontos, ou seus próprios keyframes), transições de estilo e animações com keyframes, valores animados com timing, spring, decay e keyframes, interpolação, animações compostas, easing, animações de layout e o que roda na thread de UI, em Rust e TSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---


# Animação

Toda animação no NSH roda na thread de UI. Você a descreve uma vez, em Rust ou TSX, e a plataforma a executa quadro a quadro (Core Animation e um display link no iOS, o animador da thread de UI no Android) sem chamar de volta o seu código. Uma thread de engine ocupada não consegue fazer uma animação engasgar, e uma animação não consome nada do seu código enquanto roda.

Há seis ferramentas, da mais pronta à mais flexível:

| Ferramenta | Use para |
|---|---|
| [Motion](#motion) | Uma view que entra, sai, chama a atenção ou repete em loop: movimentos prontos (`fadeInUp`, `shake`, `pulse`, ...) ou keyframes próprios, sobre sua opacidade e transformação. |
| [Transições](#transitions) | Uma mudança de estilo que deve ser animada em vez de saltar: uma cor, uma opacidade, uma transformação. |
| [Animações por keyframes](#keyframe-animations) | Um spinner, um placeholder pulsante, uma dica que quica. |
| [Keyframes](#keyframes) | Qualquer valor animado por keyframes, como o CSS os executa: offsets, uma easing por segmento, iterações e uma direção. |
| [Valores animados](#animated-values) | Qualquer coisa conduzida por um valor ao longo do tempo: springs, gestos, posição de rolagem, sequências. |
| [Animações de layout](#layoutanimation) | Mudanças de tamanho e posição após uma atualização: itens inseridos, removidos, reordenados, um painel que se expande. |

## Motion

Um movimento move a opacidade e a transformação de uma view por keyframes, de forma nativa. Crie um no componente dono da view (`motion()` em Rust, `createMotion()` de `nsh` em TSX), vincule-o à view e execute nele um movimento pronto ou um seu. `enter` inicia a view onde um movimento começa e o executa de imediato, de modo que a view entra desde o primeiro quadro.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

Um movimento tem um valor animado por canal: `opacity` (0..1), `translateX` e `translateY` (pontos), `rotate`, `rotateX` e `rotateY` (graus), `scale`, `scaleX` e `scaleY`. Eles começam em repouso (opacidade e escalas em 1, o resto em 0) e são aplicados nesta ordem: translações, depois rotações, depois escalas, em torno da origem da transformação da view. Um movimento não tem aparência própria: ele move o que você estilizou.

Um movimento move apenas opacidade e transformação. Espalhar `m.style` define o `opacity` e o `transform` da view; para manter uma opacidade sua, vincule apenas os passos (`transform: m.transform`). Cores se movem com um valor animado e [`interpolate`](#interpolation).

| TSX | Rust | Descrição |
|---|---|---|
| `createMotion(options?)` | `motion()` | Um movimento com todos os canais em repouso. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | Onde os canais começam; os demais começam em repouso. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | Começa onde `enter` começa e o executa de imediato; as outras opções mudam sua temporização. `enter` define os canais que ele move, ao longo de `initial`. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | Vincula os canais: `m.style` é `{ opacity, transform }`, seu `transform` uma lista de sete passos (`scale` é incorporado em `scaleX` e `scaleY`). Eles são aplicados depois de `translate`, `rotate` e `scale` da view; uma perspectiva antes deles dá profundidade a um giro 3D: `transform: [{ perspective: 800 }, ...m.transform]`. Em Rust, a transformação do movimento é aplicada depois da transformação própria da view. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | O valor animado de um canal, para interpolar ou conduzir manualmente. |
| `m.play(motion, options?)` | `m.play(spec)` | Executa um preset ou um movimento seu; um novo interrompe o que está em execução. Resolve com `{ finished }`, `true` quando termina (`AnimationEnd` em Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | O mesmo movimento como uma [animação composta](#composite-animations), não iniciada, para sequenciar, escalonar ou repetir com outras. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | Executa mesmo quando o usuário pede menos movimento. |
| `m.stop()` | `m.stop()` | Para onde está. |
| `m.reset()` | `m.reset()` | Para e devolve todos os canais ao repouso. |

### Presets

Os movimentos prontos são dados: `motions` de `nsh` (`motions.fadeInUp` é o que `play("fadeInUp")` executa) e `MotionPreset` em Rust (`MotionPreset::FadeInUp.spec()`). As distâncias são em pontos, dimensionadas para controles e cards; para views maiores, escale os valores de um movimento ou escreva seus próprios keyframes. `swing` e as demais rotações giram em torno da origem da transformação da view: dê a uma placa que balança `transformOrigin: "top"` (`.origin_top()`).

**Entrada**: começam ocultos ou deslocados e terminam em repouso.

| TSX | Rust | Duração | Descrição |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | Aparece com fade. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | Aparece com fade, subindo até o lugar. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | Aparece com fade, descendo até o lugar. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | Aparece com fade, vindo da esquerda. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | Aparece com fade, vindo da direita. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | Aparece com fade, crescendo a partir de 90%. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | Surge com um pop: cresce a partir da metade do tamanho, passa do tamanho próprio e se acomoda. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | Entra quicando, ultrapassando duas vezes. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | Desliza de baixo para cima, sem fade (sheets, toasts). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | Desliza de cima para baixo, sem fade. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | Entra girando em torno do eixo horizontal. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | Entra girando em torno do eixo vertical. |

**Saída**: começam em repouso e terminam ocultos ou deslocados.

| TSX | Rust | Duração | Descrição |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | Desaparece com fade. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | Desaparece com fade, subindo. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | Desaparece com fade, descendo. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | Desaparece com fade para a esquerda. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | Desaparece com fade para a direita. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | Desaparece com fade, encolhendo até 90%. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | Sai com um pop: incha um pouco e depois encolhe até sumir. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | Desliza para baixo, saindo de vista, sem fade. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | Desliza para cima, saindo de vista, sem fade. |

**Atenção**: começam e terminam em repouso.

| TSX | Rust | Duração | Descrição |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | Sacode de lado a lado: uma senha errada, um campo inválido. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | Balança a cabeça: um não mais suave. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | Balança em torno do centro: algo a notar. |
| `swing` | `MotionPreset::Swing` | 900 ms | Balança a partir da borda superior, como uma placa. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | Cresce um pouco e volta: uma ênfase suave. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | Pulsa duas vezes, como um coração: uma curtida, um favorito. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | Comprime e estica como borracha. |
| `jello` | `MotionPreset::Jello` | 800 ms | Treme como gelatina. |
| `tada` | `MotionPreset::Tada` | 900 ms | Encolhe e depois cresce com um balanço: uma recompensa. |
| `jump` | `MotionPreset::Jump` | 700 ms | Pula e aterrissa com uma compressão. |
| `flash` | `MotionPreset::Flash` | 800 ms | Pisca duas vezes, sumindo e voltando. |

**Repetição**: repetem até serem interrompidos.

| TSX | Rust | Duração | Descrição |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | Dá uma volta, para sempre. |
| `float` | `MotionPreset::Float` | 1500 ms | Flutua para cima e para baixo, para sempre. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | Respira: cresce e esmaece um pouco, para sempre. |
| `sway` | `MotionPreset::Sway` | 1600 ms | Oscila em torno do centro, para sempre. |
| `bob` | `MotionPreset::Bob` | 1000 ms | Balança como uma bola quicando, para sempre. |
| `glow` | `MotionPreset::Glow` | 2000 ms | Brilha e apaga, para sempre. |

`play` aceita sobre ele as opções de temporização de um preset (`m.play("shake", { duration: 300 })`), e um preset pode ser espalhado em um movimento seu (`m.play({ ...motions.fadeInUp, duration: 600 })`). Em Rust, altere a spec de um preset: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### Movimentos próprios

Um movimento próprio é feito de keyframes por canal e uma única temporização (as opções de [keyframes](#keyframes)). Em TSX, escreva os keyframes de cada canal (`{ opacity: [0, 1] }`) ou uma lista de quadros como a Web Animations API os escreve (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), cada quadro com seu `offset` e seu `easing`. Em uma lista de quadros, um quadro sem offset fica onde sua posição na lista o coloca, e um canal segue os quadros que o nomeiam. Os ângulos podem ser strings (`"45deg"`, `"0.5turn"`). Em Rust, construa um `MotionSpec`.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### Entradas e listas escalonadas

Dê a cada linha um movimento de entrada, com um atraso que cresce com seu índice: linhas que aparecem juntas entram uma após a outra. Limite o atraso para que uma linha adicionada bem abaixo na lista não espere.

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

Movimentos também se compõem: `m.animation(..)` é um movimento como uma [animação composta](#composite-animations), não iniciada, de modo que `Animated.stagger` executa um grupo deles de forma nativa, contando a partir do primeiro item, do último, do centro ou de qualquer índice. Dê a eles um `initial` oculto (ou inicie-os onde o movimento começa) para que nada apareça antes da sua vez.

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

<a id="exits"></a>

### Saídas

Execute a saída, espere por ela e então remova a view. Uma [animação de layout](#layoutanimation) permite que as views ao redor fechem o espaço.

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

Os movimentos seguem por conta própria a configuração de [movimento reduzido](#reduced-motion) do usuário: quando o usuário pede menos movimento, o movimento chega de imediato ao ponto final, sem se mover.

<a id="transitions"></a>

## Transições

Diga o que animar e por quanto tempo (`.transition_all().duration(400.0)` em Rust, `transitionProperty` e `transitionDuration` em TSX), e as mudanças posteriores nessas propriedades são animadas de forma nativa, do que está na tela até o novo valor.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| Estilo | Rust | Tipo | Descrição |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | O que é animado, separado por vírgulas: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | Milissegundos como número, ou um tempo CSS. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | Antes de começar. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | A curva. |

Propriedades que fazem transição, por grupo: **cores** (cores de fundo, borda, contorno, sombra e texto, e stops de gradiente), **opacidade**, **transformação**, **sombras** (`box-shadow`) e **forma** (raio e largura da borda). Tanto os nomes CSS quanto suas formas em camel case funcionam (`background-color`, `backgroundColor`, `transform`, `scale`, ...). Mudanças de layout são animadas com [animações de layout](#layoutanimation).

Com Tailwind, a mesma coisa é `transition` (cores, opacidade, sombras e transformações), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, com `duration-*`, `delay-*` e `ease-*`. Combinado com o estado pressionado (`.active(..)`, `active:`), resulta em estados pressionados animados:

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

Uma transição parte do valor que está atualmente na tela, então mudar o destino novamente no meio do caminho faz uma curva suave.

<a id="keyframe-animations"></a>

## Animações por keyframes

Quatro animações por keyframes embutidas rodam de forma nativa, para sempre por padrão: `spin` (uma volta no sentido horário), `ping` (cresce até 2× e esmaece), `pulse` (esmaece até metade da opacidade e volta) e `bounce` (pula um quarto da própria altura e aterrissa).

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| Estilo | Rust | Tipo | Descrição |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` ou `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | A animação. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | Uma iteração. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | Antes de começar. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | como `transitionTimingFunction` | A curva. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | Padrão `"infinite"`. |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## Valores animados

Um valor animado é um número que vive na thread de UI. Crie um (`animated_value(..)` em Rust, `createAnimatedValue` de `nsh` em TSX), vincule-o a estilos e anime-o; as views vinculadas o seguem a cada quadro, sem uma atualização.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**O que pode ser vinculado:** `opacity` (`.bind_opacity(..)`); `backgroundColor`, `borderColor` (todos os lados) e o `color` de um texto (o texto inteiro), por meio de uma interpolação para cores (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate` (`[x, y]`, um valor por eixo), `rotate` (graus) e `scale` (`[x, y]` por eixo, ou um valor para ambos); e os passos de uma lista `transform`: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` e `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` em graus, `.bind_transform(kind, ..)` em Rust). Sombras mudam com [transições](#transitions). Um anel de foco ou um preço que pisca em verde é uma interpolação de cor vinculada à cor da borda ou do texto:

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

Valores animados também conduzem [desenhos em canvas](./canvas.md#driving-drawings-with-animated-values), recebem offsets de rolagem ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) e gestos ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

O valor é mantido vivo pelas views vinculadas a ele e pelo componente que o criou, de modo que uma vinculação permanece conectada independentemente de como suas variáveis vão e vêm. Crie valores animados no componente que é dono deles (não no nível do módulo quando cada instância precisa do seu próprio).
<a id="animatedvalue-methods"></a>

### Métodos de AnimatedValue

| TSX | Rust | Descrição |
|---|---|---|
| `set(value)` | `set(value)` | Salta para `value`, interrompendo qualquer animação. |
| `stop()` | `stop()` | Para a animação em execução onde ela está; em TSX, resolve com `{ value }`, o valor nesse ponto. |
| `getValue()` | `value()` | O valor atual, lido na thread de UI, onde ele se move (estabiliza em até um frame): uma promise em TSX, uma resposta aguardável em Rust. |
| `setOffset(offset)` | `set_offset(offset)` | Soma `offset` ao que o valor exibe: os bindings enxergam valor + offset, enquanto `set`, animações e arrastos movem o valor. |
| `flattenOffset()` | `flatten_offset()` | Soma o offset ao valor e zera o offset. |
| `extractOffset()` | `extract_offset()` | Move o valor para o offset e zera o valor: um arrasto então começa em 0, sobre o ponto onde o anterior parou. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | Anima até `to` ao longo de `duration` ms (padrão 300, easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | Faz uma mola (spring) até `to` (padrões: stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Desliza a partir de `velocity` (unidades por segundo) e desacelera (desaceleração padrão de 0,998 por ms). Com um clamp de `[min, max]`, ele para em um limite ou ricocheteia nele, mantendo `bounce` (0..1) da sua velocidade. |

Toda animação produz uma resposta que você pode aguardar, dizendo se ela terminou: `true` quando foi até o fim, `false` quando algo a interrompeu (`stop()`, `set()` ou uma nova animação no mesmo valor). Em TSX é `Promise<{ finished: boolean }>` e em Rust é `AnimationEnd`, que uma task aguarda com `bool`. Iniciar uma nova animação em um valor em movimento interrompe a antiga de forma suave: uma spring ou um decay sem velocidade continua com a velocidade atual do valor.

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

### Keyframes

`keyframes` reproduz um valor por meio de keyframes como os keyframes do CSS: `value.keyframes(frames, options)` em TSX, `value.keyframes(frames, KeyframeTiming)` em Rust (`Animated.keyframes(value, { keyframes, ... })` e `Animation::keyframes(..)` como um passo de uma [animação composta](#composite-animations)). Um keyframe é um número (ou uma string de ângulo, como `"90deg"`), distribuído uniformemente com os demais, ou `{ offset, value, easing }` (`Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)` em Rust).

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| Opção | Rust (`KeyframeTiming`) | Padrão | Descrição |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | Uma iteração, em milissegundos. |
| `delay` | `.delay(ms)` | 0 | Antes da primeira iteração. |
| `easing` | `.easing(easing)` | `ease` do CSS | A curva de cada segmento sem easing próprio. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | Quantas iterações, ou `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` ou `"alternate-reverse"`. |

Elas são reproduzidas como no CSS e na Web Animations API:

- Um easing molda cada segmento, não o conjunto: o `easing` de um keyframe molda o segmento que começa nele, e o `easing` do timing molda todos os outros segmentos.
- Keyframes sem offset são distribuídos uniformemente entre seus vizinhos; o primeiro tem 0 como padrão e o último, 1.
- Cada iteração começa com um salto para o seu primeiro keyframe. Sem um keyframe no offset 0, o valor parte de onde está.
- Durante um `delay`, o valor já assume o primeiro keyframe (`animation-fill-mode: backwards` do CSS), de modo que uma entrada atrasada mostra o seu primeiro frame em vez da view em repouso. Isso vale também para motions.
- `reverse` e as iterações reversas de `alternate` percorrem os segmentos de trás para frente, cada um com a sua curva invertida.
- O valor permanece onde a última iteração o deixa. A resposta informa se elas terminaram: `true` quando terminaram, `false` quando algo as interrompeu.

<a id="interpolation"></a>

### Interpolação

`interpolate` mapeia um valor, por segmentos lineares por partes, para números, cores ou ângulos, e retorna um novo nó que você pode vincular. Um único valor pode controlar várias propriedades. Em Rust, `interpolate(&input, &output)` mapeia para números, `interpolate_colors(&input, &colors)` para cores, e `interpolate_with(&input, output, Interpolation { .. })` recebe a extrapolação e o easing; em TSX, `value.interpolate({ inputRange, outputRange })` recebe tudo isso.

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| Opção | Rust | Descrição |
|---|---|---|
| `inputRange` | o slice de entrada | Pontos de entrada crescentes. |
| `outputRange` | o slice de saída, ou `AnimationOutput` | Uma saída por ponto: números, cores (`"#rrggbb"`, `"rgba(…)"`, nomeadas) ou ângulos (`"45deg"`, `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | Fora do intervalo de entrada: `"clamp"` (padrão), `"extend"` (continua os segmentos das extremidades) ou `"identity"` (repassa a entrada). |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | O mesmo, para um dos lados. |
| `easing` | `easing` | Molda cada segmento. |

> [!IMPORTANT]
> As interpolações fazem **clamp** por padrão: fora do intervalo de entrada, a saída permanece na extremidade mais próxima. Puxar uma scroll view além do topo, portanto, mantém um cabeçalho vinculado ao scroll no seu estado final. Passe `extrapolate: "extend"` (`Extrapolate::Extend`) quando quiser que a reta continue.

<a id="arithmetic-and-diffclamp"></a>

### Aritmética e diffClamp

Os nós se combinam com aritmética, também de forma nativa: `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (`a.modulo(b)` em Rust; nunca negativo para um `b` positivo, por exemplo ângulos em 0..360), onde `b` é um nó ou um número. Em TSX, `Animated.add`, `subtract`, `multiply`, `divide` e `modulo` são equivalentes, como funções.

`diffClamp(min, max)` (`diff_clamp`) acompanha as *mudanças* do nó, permanecendo dentro de `min..max`. Aplicado a um offset de scroll, ele cria um cabeçalho que se esconde conforme o conteúdo rola para cima e volta assim que ele rola para baixo:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

Com `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`), um cabeçalho deixado parcialmente visível quando a rolagem para completa o movimento: ele se acomoda totalmente visível ou totalmente oculto, o que estiver mais próximo, em 200 ms na thread de UI. Ele só se esconde depois que a página rolou pelo menos a sua altura, de modo que uma página rolada menos do que isso mostra o cabeçalho inteiro. Rolar de novo durante o movimento assume a partir de onde o cabeçalho está.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## Animações compostas

As animações são montadas a partir de passos (`Animation` em Rust, `Animated` de `nsh` em TSX) e a árvore inteira roda de forma nativa: cada passo começa na thread de UI no instante em que o anterior termina, sem intervalo e sem nenhum código seu no meio.

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | Descrição |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | Um passo de timing. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | Um passo de spring. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | Um passo de decay. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | Um após o outro. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | Todos ao mesmo tempo. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Todos ao mesmo tempo, cada um começando `ms` depois do anterior, contando a partir de `from`: `"first"` (o padrão), `"last"`, `"center"` (uma ondulação a partir do meio) ou um índice (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Um passo de [keyframes](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | Espera. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | Repete (para sempre por padrão; `None` em Rust). |

Uma animação composta tem `start()` (em TSX também com um callback e uma promise, ambos recebendo `{ finished }`; em Rust um `bool` aguardável; chamá-la de novo a executa de novo), `stop()` (para onde está) e `reset()` (para e devolve os seus valores para onde estavam quando ela começou). O callback é executado uma vez para a árvore inteira.

Uma animação em execução não mantém seus valores vivos: quando o componente que os possui desaparece (suas views e variáveis), um loop infinito termina junto com ele, e a sua resposta é que ela não terminou (`false`).

## Easing

As curvas de easing são dados, avaliados de forma nativa: `Easing` de `nsh` em TSX, o enum `Easing` em Rust.

| TSX | Rust | Descrição |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | Velocidade constante; o `ease` do CSS. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Senoidal, circular, exponencial. |
| `Easing.back(s?)` | `Curve::Back(s)` | Recua antes de partir (overshoot `s`, 1.70158 por padrão). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | Overshoot elástico. |
| `Easing.bounce` | `Curve::Bounce` | Quica no final. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | Uma curva de Bézier cúbica, como no CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | Salta entre `count` níveis em vez de se mover, como o `steps()` do CSS: um sprite quadro a quadro, um ponteiro que marca o tempo. `position` é `"jump-end"` (o padrão, também `"end"`), `"jump-start"` (`"start"`), `"jump-none"` ou `"jump-both"`. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | As curvas são curvas "in"; `out` e `inOut` as invertem. |

Em TSX, em qualquer lugar onde um easing é aceito, você também pode passar um nome (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) ou um array de Bézier `[x1, y1, x2, y2]`; em Rust, `Easing::EaseIn`, `Easing::EaseOut` e `Easing::EaseInOut` são as curvas do CSS.

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

`Easing.sample(easing, count)` (`sample_easing` em Rust) retorna a curva em `count` pontos igualmente espaçados de 0 a 1, e `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) os valores pelos quais uma spring ou um decay passa, um por frame (60 por segundo por padrão) a partir de `config.from` (0) até terminar. Eles são calculados pelo mesmo código nativo que as animações executam, de modo que um gráfico de uma curva mostra exatamente o que a animação faz:

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

Uma layout animation anima de forma nativa as mudanças de frame da **próxima** atualização: views que se movem ou mudam de tamanho deslizam até seus novos frames, novas views surgem com fade (ou escala) e views removidas somem com fade. Chame-a logo antes da mudança de estado: `animate_layout(..)` em Rust, `LayoutAnimation.configureNext(config)` em TSX.

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | Descrição |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anima as mudanças do próximo commit; em TSX, `onEnd` é executado ao terminar. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | Uma config com uma só curva para as três fases. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | Configs prontas. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout` com um preset | `configureNext` com um preset. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Os nomes, para montar configs. |

Uma config é `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` em Rust): `create` para views inseridas, `update` para as movidas ou redimensionadas, `delete` para as removidas. Cada fase é `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`), onde `type` é `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` ou `"keyboard"` (a curva própria do teclado virtual, cronometrada a partir do momento em que o teclado começou a se mover, para que o que abre espaço para ele se mova junto; `LayoutCurve::Keyboard`), `property` é o que views que aparecem e desaparecem animam (`"opacity"`, `"scaleXY"`, `"scale"`), e `springDamping` (0..1, 0,7 por padrão; `LayoutCurve::Spring { damping }`) define o overshoot da spring.

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

Uma layout animation cobre todos os frames que a atualização altera, em qualquer lugar da tela: uma lista que é atualizada ou dados ao vivo que chegam na mesma atualização se movem junto. Em um componente Rust, anime apenas o que a mudança de um elemento move com `ElementRef::animate_layout(transition)`: o frame do próprio elemento e o do seu conteúdo, e os das views que o seu tamanho empurra (seus irmãos e os deles, até a tela). Os demais frames da atualização mudam de uma vez. É assim que `Collapsible` e `AccordionPanel` de `nsh/base` revelam o seu conteúdo.

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## O que roda onde

| | Roda em | Seu código por frame |
|---|---|---|
| Transitions, animações de keyframes | Thread de UI | nenhum |
| Motions, keyframes, `timing` / `spring` / `decay`, composições | Thread de UI | nenhum; seu código é avisado quando terminam |
| `interpolate`, aritmética, `diffClamp` | Thread de UI | nenhum |
| `scrollValue`, `pan` / `pinch` / `rotation` | Thread de UI | nenhum; seu código é avisado do início e do fim |
| Layout animations | Thread de UI | nenhum |
| Loops de `requestAnimationFrame` (`request_animation_frame` em Rust), handlers de `onScroll`, `PanResponder` | seu código, depois uma atualização | a cada frame |

Recorra a `requestAnimationFrame` (um global em TSX, que acompanha o display) apenas para o que não pode ser descrito de antemão, como uma simulação de física no seu código. Tudo o que puder ser um animated value deve ser um.

<a id="reduced-motion"></a>

## Movimento reduzido

Quando o usuário pede menos movimento (iOS "Reduzir Movimento", Android "Remover animações"), `reduce_motion()` em Rust e `reduceMotion()` de `nsh` em TSX são `true`, e as variantes `motion-reduce:` / `motion-safe:` do Tailwind se aplicam.

As [motions](#motion) seguem a configuração por conta própria: `play` e `enter` chegam de imediato ao ponto onde a motion termina, sem se mover, e a resposta é que ela terminou (`true`), como para uma motion que foi reproduzida. Uma saída ainda termina oculta, uma entrada ainda termina em repouso. Passe `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` em Rust) para uma motion que carrega um significado de que o usuário precisa, como um indicador de progresso giratório.

Transitions, animações de keyframes, animated values, keyframes e composições são reproduzidos como escritos; use-os para escolher uma alternativa mais calma:

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

Veja [Acessibilidade](./accessibility.md#reduced-motion).

<a id="related"></a>

## Relacionados

- [API de animação de `nsh`](../modules/nsh.md#animation): a referência de TSX.
- [Toque e gestos](./touch-and-gestures.md): controlando animated values com o dedo.
- [Rolagem](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): animated values em desenhos.
- [Referência de estilo](../modules/style-reference.md): as chaves `transition*` e `animation*`.
