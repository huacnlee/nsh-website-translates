---
title: "nsh"
description: "O módulo principal: signals, effects, context, mount, design tokens, animação, o ambiente, gestos, a área de transferência, armazenamento, o canal do host, atalhos de teclado, acessibilidade e os tipos de elemento e de estilo."
order: 2
source_hash: 0264c3f02c420628
---


# nsh

`nsh` é o módulo principal: a API reativa (signals, valores computados, effects, context), `mount`, `token`, os elementos host `View`, `Text`, `Scroll` e `Overlay`, [views selecionáveis](#selectable-views), [a área segura e o teclado](#safe-area-and-keyboard), [animação](#animation), [o dispositivo e seu ambiente](#device), [`PanResponder`](#panresponder), a [área de transferência](#clipboard), o [seletor de fotos](#picker), o [reconhecimento de fala](#speech), o [armazenamento](#storage), o [canal do host](#host), [atalhos de teclado](#keymap), [componentes e módulos nativos](#nativecomponent-and-nativemodule), [acessibilidade](#accessibility) e os tipos TypeScript de elementos, estilos e eventos. O grafo reativo em si roda nativamente em Rust; ler um signal é uma chamada ao runtime que custa alguns nanossegundos, e apenas as suas próprias closures rodam no interpretador JavaScript.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

A reatividade do NSH segue o mesmo modelo do SolidJS: uma função de componente roda **uma única vez**, e as partes da UI que leem signals são atualizadas no lugar quando esses signals mudam. Não há nova renderização do componente nem DOM virtual. Veja [Reatividade](../docs/reactivity.md) para o guia.

## signal

```ts
function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;

interface Signal<T> {
  (): T;                              // read (tracked)
  set(value: T): void;                // write
  update(fn: (value: T) => T): void;  // write from the current value
}

interface SignalOptions<T> {
  /** When a new value counts as a change (default `===`); `false`: always. */
  equals?: false | ((previous: T, next: T) => boolean);
}
```

Um signal guarda um valor. Chamá-lo lê o valor e, dentro de um escopo de rastreamento (expressões JSX, `computed`, `effect`), inscreve esse escopo nele. `set` e `update` o escrevem; tudo o que o leu é atualizado.

```tsx
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>Count: {count()}</Text>
      <Text onPress={() => count.update((n) => n + 1)}>Add one</Text>
    </View>
  );
}

mount(Counter);
```

Por padrão, uma escrita que seja `===` ao valor atual não faz nada. Passe `equals: false` para notificar a cada escrita (útil quando você muta um objeto no lugar e atribui o mesmo objeto de novo), ou a sua própria comparação:

```ts
const items = signal<string[]>([], { equals: false });
const point = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

## computed

```ts
function computed<T>(fn: (previous: T | undefined) => T, options?: SignalOptions<T>): Accessor<T>;

interface Accessor<T> {
  (): T;
}
```

Um valor derivado de signals. `fn` roda novamente quando um signal que ele leu muda; os leitores do valor computado só são atualizados quando o resultado muda (por `equals`, `===` por padrão). `fn` recebe o resultado anterior.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

Use `computed` quando uma derivação for cara ou for lida em vários lugares. Para uma expressão barata, uma função simples (`const full = () => first() + " " + last()`) é igualmente reativa.

## effect

```ts
function effect(fn: () => void): void;
```

Executa `fn` após a renderização, e de novo sempre que um signal que ele leu mudar. Use effects para efeitos colaterais: logs, timers, comunicação com módulos nativos. Um effect pertence ao componente (ou effect) em que foi criado e é descartado junto com ele.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Para desfazer algo antes de o effect rodar novamente (ou quando o componente for removido), chame [`cleanup`](#cleanup) dentro dele.

## batch

```ts
function batch<T>(fn: () => T): T;
```

Executa `fn` e aplica todas as suas escritas juntas no final, de modo que os leitores sejam atualizados uma vez, em vez de uma vez por escrita. Retorna o que `fn` retorna.

```ts
batch(() => {
  first.set("Grace");
  last.set("Hopper");
}); // `full` recomputes once
```

## untracked

```ts
function untracked<T>(fn: () => T): T;
```

Executa `fn` sem inscrever o escopo atual no que ele lê. Use-o para ler um signal dentro de um effect ou de uma expressão JSX sem depender dele.

```ts
effect(() => {
  // Runs again when `query` changes, not when `page` changes.
  search(query(), untracked(() => page()));
});
```

## cleanup

```ts
function cleanup(fn: () => void): void;
```

Registra `fn` para ser executado antes de o effect atual rodar novamente, ou quando o componente ou effect atual for removido.

```tsx
function Clock() {
  const now = signal(new Date());
  const timer = setInterval(() => now.set(new Date()), 1000);
  cleanup(() => clearInterval(timer));
  return <Text>{now().toLocaleTimeString()}</Text>;
}
```

## context

```ts
function context<T>(defaultValue: T): Context<T>;

interface Context<T> extends Accessor<T> {
  Provider: (props: { value: T; children?: JSX.Element }) => JSX.Element;
}
```

Um valor que um componente fornece a tudo o que ele renderiza, não importa a profundidade. Chamar o context (`Theme()`) lê o valor do provider mais próximo, ou `defaultValue` se não houver nenhum.

```tsx
import { context, mount, signal, Text, View } from "nsh";

const Theme = context<"light" | "dark">("light");

function Label(props: { text: string }) {
  return <Text style={{ color: Theme() === "dark" ? "#fff" : "#000" }}>{props.text}</Text>;
}

function App() {
  const dark = signal(false);
  return (
    <Theme.Provider value={dark() ? "dark" : "light"}>
      <View style={{ flex: 1, padding: 24, backgroundColor: dark() ? "#000" : "#fff" }}>
        <Label text="Hello" />
        <Text onPress={() => dark.update((d) => !d)}>Toggle</Text>
      </View>
    </Theme.Provider>
  );
}

mount(App);
```

## mount

```ts
function mount<P extends object>(app: Component<P>, props?: P): () => void;
```

Renderiza `app` na superfície (a janela, ou o `NshAppView` / `NshView` no qual o app está embutido) e retorna uma função que o remove. O arquivo de entrada de todo app termina com `mount(App)`.

```tsx
mount(App);
```

## split

```ts
function split<T extends object, K extends readonly (keyof T)[]>(
  props: T,
  keys: K,
): [Pick<T, K[number]>, Omit<T, K[number]>];
```

Divide um objeto de props nas props nomeadas em `keys` e no restante. As duas metades continuam reativas: props cujos valores mudam são getters, e `split` os mantém como getters. Use-o em um componente que trata algumas props por conta própria e repassa as outras. Desestruturar as props (`const { label } = props`) as leria uma vez só e perderia as atualizações.

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function LabeledInput(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input {...rest} />
    </View>
  );
}
```

## ErrorBoundary

```ts
function ErrorBoundary(props: {
  fallback: JSX.Element | ((error: unknown, reset: () => void) => JSX.Element);
  children?: JSX.Element;
}): JSX.Element;
```

Renderiza seus filhos, ou `fallback` quando algo abaixo deles lança um erro: o corpo de um componente, um binding, um effect ou um manipulador de eventos. A parte que falhou é removida e o fallback aparece em seu lugar. Uma função `fallback` é chamada como `fallback(error, reset)` com o valor lançado e `reset`, que renderiza os filhos novamente, independentemente dos parâmetros que ela declare; um elemento `fallback` é exibido como está. Uma falha vai para a boundary mais próxima acima dela, e uma falha em um fallback vai para a boundary acima dessa. Componentes Rust usam `catch_error` ([Limites de erro](../docs/reactivity.md#error-boundaries)).

```tsx
import { ErrorBoundary, Text, View } from "nsh";

function Feed() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>{error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Posts />
    </ErrorBoundary>
  );
}
```

## token

```ts
function token<K extends keyof Tokens>(name: K): Tokens[K];
```

O design token `name` do tema do app (`"theme"` em `nsh.json`, sobre os tokens do shadcn/ui) na aparência exibida:
uma cor como `#rrggbbaa`, um comprimento como um número de pontos, uma fonte como o nome da sua família. Os nomes são as variáveis CSS do tema
sem `--` (`primary`, `muted-foreground`, `radius`, `font-mono`, e os próprios do app, como `up`). A leitura é
reativa: um componente, memo ou effect que lê um token roda novamente quando o tema ou a aparência muda.
`Tokens` lista os tokens do app com seus tipos; o NSH o escreve em `.nsh/types/nsh/tokens.d.ts` a partir do tema. Para
classes, nomeie os tokens diretamente (`bg-primary`, `rounded-(--radius)`): [Tokens de tema](../docs/tailwind.md#theme-tokens).

```tsx
import { effect, token } from "nsh";

effect(() => console.log("primary is", token("primary"), "radius", token("radius")));
```

## View, Text, Scroll, Overlay

```ts
function View(props: ViewProps): JSX.Element;
function Text(props: TextProps): JSX.Element;
function Scroll(props: ScrollProps): JSX.Element;
function Overlay(props: OverlayProps): JSX.Element;
```

Os elementos host que `nsh` exporta, escritos como tags: `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (seus
filhos por cima da janela, posicionados em relação a uma âncora: [Overlay](../elements/overlay.md)). O compilador cria a
view nativa no lugar para uma tag que nomeia um deles por meio do seu import (inclusive com alias), então importá-los não custa
nada em tempo de execução. Eles são componentes como quaisquer outros, portanto também podem ser passados adiante (`const Tag = inline ? Text : View`).
`nsh` exporta os demais primitivos da mesma forma: [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) e [`Video`](./nsh-video.md), cada um com sua própria página de
referência. Suas props estão documentadas em [Elementos](../elements/index.md). O campo de entrada de texto, `Input`, vem de
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## Área segura e teclado

As variáveis de ambiente do CSS mantêm o conteúdo longe da UI do sistema, no padding e na margin de qualquer view
(`padding`, `paddingTop`, ..., as mesmas chaves de `margin`; os valores arbitrários `p*` / `m*` do Tailwind; os métodos `Styled`
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ... em Rust). Seus valores são `EnvValue`s:
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` e `calc(<length> + env(name))`.

| Variável | Valor |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | Os insets da view raiz em que o nó é renderizado: os da página mais próxima (abaixo do seu cabeçalho), os do diálogo mais próximo, ou então a área segura da superfície. Veja [Área segura](../elements/safe-area.md). |
| `keyboard-inset-height` | A altura do teclado virtual sobre a superfície, 0 enquanto ele está oculto; as mudanças são animadas nativamente junto com o teclado. Veja [Teclado](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea e safeAreaInsets

`safeArea()` é a área segura da superfície (`safe_area()` em Rust); `safeAreaInsets()` são os insets de onde um componente
é renderizado (`cx.insets()` em Rust), os valores das variáveis `safe-area-inset-*`. Ambos são `Edges` reativos
(`{ top, right, bottom, left }` em pontos). Veja
[safeArea e safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

<a id="keyboard-and-keyboardframe"></a>

### Keyboard e keyboardFrame

`Keyboard.dismiss()` oculta o teclado virtual (`dismiss_keyboard()` em Rust) e `keyboardFrame()` informa quanto
da tela ele cobre (`keyboard_height()` e `keyboard_duration()` em Rust). Veja
[Ocultando o teclado](../elements/keyboard.md#hiding-the-keyboard) e
[A altura do teclado](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## Views selecionáveis

`<View selectable>` (`view().selectable(true)` em Rust) faz com que os textos dentro dele sejam selecionados em conjunto, como os de uma página web:
uma única seleção percorre views, elementos `Text` e `TextView`s, em ordem de leitura. Veja
[Seleção de texto](../elements/text-selection.md).

<a id="animation"></a>

## Animação

A API de animação anima na thread de UI. Você cria um **valor animado**, o vincula (ou vincula valores derivados dele) a uma propriedade de estilo e inicia uma animação; a partir daí, cada frame é calculado nativamente, sem executar o código do app. Um engine ou uma thread JS ocupados não conseguem fazer a animação travar, e uma animação não custa ao app nenhum trabalho por frame. O código Rust usa `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` e `Easing` de `nsh_core::prelude` e vincula valores com os métodos `.bind_*` dos elementos; o TSX os importa de `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

Veja [Animação](../docs/animation.md) para o guia.

<a id="what-an-animated-value-can-drive"></a>

### O que um valor animado pode controlar

| Onde | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | O mesmo: um nó de cores. `borderColor` colore todos os lados; `color` de um `Text` colore o texto inteiro |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (graus) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` em steps: `transform: [{ translateX: value }]` |
| Posição de rolagem | `.scroll_value(&value)` em uma scroll view ou em uma lista | `<Scroll scrollValue={value}>` e `<List scrollValue={value}>` gravam o deslocamento de rolagem nele a cada frame |
| Gestos | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}` em qualquer elemento: o gesto grava os valores diretamente (veja [Toque e gestos](../docs/touch-and-gestures.md)) |
| Onde as views ficam fixas | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` em uma scroll view horizontal), `.bind_sticky_header_offset(&value)` em uma lista | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>`: views e cabeçalhos fixos ficam a essa distância do início da viewport, acompanhando o valor a cada frame |
| Canvas | um argumento animado de uma chamada de um painter | Qualquer argumento numérico ou de cor de uma chamada de desenho de [canvas](./nsh-canvas.md) |
| Shader | `.uniform(name, &value)` | Um membro de `struct Uniforms` de um [shader](../elements/shader.md): `uniforms={{ name: value }}` (números, ou um nó de cores para um `vec3f` / `vec4f`) |

Outras propriedades de estilo aceitam valores simples; para animar o próprio layout (tamanhos, posições no fluxo), use [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

Cria um valor animado começando em `value` (padrão `0`). Rust: `animated_value(value)`, um handle `Copy` mantido pelo componente que o criou.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let right = stored(false);
    let toggle = move || {
        let to_right = !right.get();
        right.replace(to_right);
        let _ = x.spring(if to_right { 200.0 } else { 0.0 }, Spring::default());
    };
    view()
        .flex_1()
        .p_6()
        .pt_12()
        .gap_4()
        .child(view().size(px(60.0)).rounded(px(12.0)).bg(rgb(0x6366f1)).bind_translate_x(&x))
        .child(text("Move").on_press(toggle))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  let right = false;
  const toggle = () => {
    right = !right;
    x.spring(right ? 200 : 0);
  };
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 48, gap: 16 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#6366f1", transform: [{ translateX: x }] }} />
      <Text onPress={toggle}>Move</Text>
    </View>
  );
}

mount(App);
```

> [!NOTE]
> Um valor animado vive na thread de UI e muda lá a cada frame, portanto o app o lê de forma assíncrona: `await value.getValue()` (ou o `{ value }` com que `stop()` é resolvido) fornece o valor naquele momento, e em Rust `value.value().await` em uma task. Mantenha o destino em uma variável ou em um signal quando o seu código precisar dele imediatamente, como acima. Os eventos de gesto informam os valores ao seu término (`PanEvent.value`).

### AnimatedValue

```ts
class AnimatedValue extends AnimatedNode {
  constructor(value: number);
  set(value: number): void;
  stop(): Promise<{ value: number }>;
  getValue(): Promise<number>;
  setOffset(offset: number): void;
  flattenOffset(): void;
  extractOffset(): void;
  timing(to: number, options?: { duration?: number; easing?: Easing; delay?: number }): Promise<{ finished: boolean }>;
  spring(to: number, options?: { stiffness?: number; damping?: number; mass?: number; velocity?: number }): Promise<{ finished: boolean }>;
  decay(options?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): Promise<{ finished: boolean }>;
  keyframes(keyframes: KeyframeValue[], options?: KeyframeTiming): Promise<{ finished: boolean }>;
}
```

| Método | Rust | Descrição |
|---|---|---|
| `set(value)` | `set(value)` | Salta para `value`, interrompendo qualquer animação em andamento. |
| `stop()` | `stop()`, depois `value().await` | Interrompe a animação em andamento no ponto em que está; resolve com `{ value }`, o valor naquele ponto. |
| `getValue()` | `value().await` | Resolve com o valor atual (com seu offset), lido na thread de UI. |
| `setOffset(offset)` | `set_offset(offset)` | Um offset somado ao valor: os bindings enxergam valor + offset; `set`, as animações e os arrastos movem o valor. |
| `flattenOffset()` | `flatten_offset()` | Soma o offset ao valor e o zera. |
| `extractOffset()` | `extract_offset()` | Move o valor para o offset e zera o valor (um arrasto então começa de onde o último terminou). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | Anima até `to` ao longo de uma curva de easing. `duration` em ms (padrão 300), `easing` (padrão `"easeInOut"`), `delay` em ms (padrão 0). |
| `spring(to, options)` | `spring(to, Spring { … })` | Faz uma mola até `to`. `stiffness` (padrão 170), `damping` (padrão 26), `mass` (padrão 1), `velocity` (velocidade inicial, unidades por segundo). |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Desliza a partir de `velocity` (unidades por segundo) e desacelera em `deceleration` por milissegundo (padrão 0.998). Use-o após um fling, com a velocidade de `onPanEnd`. Com `clamp: [min, max]` ele para em um limite, ou quica de volta a partir dele mantendo `bounce` (0..1, padrão 0) da sua velocidade. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | Reproduz [keyframes](#keyframes) como os keyframes CSS: um easing por segmento, `iterations` vezes em `direction`. |

Cada método de animação retorna uma promise que resolve com `{ finished }`: `true` quando a animação terminou, `false` quando foi interrompida (por `stop`, `set` ou outra animação do mesmo valor). Em Rust ele retorna um `AnimationEnd`, que uma task aguarda para obter o mesmo `bool`.

```rust tabs
let opacity = animated_value(1.0);
spawn(async move {
    if opacity.timing(0.0, 200.0, Easing::EaseInOut).await {
        visible.set(false);
    }
});
```

```tsx tabs
const opacity = createAnimatedValue(1);
const { finished } = await opacity.timing(0, { duration: 200 });
if (finished) visible.set(false);
```

### AnimatedNode

```ts
class AnimatedNode {
  interpolate(config: {
    inputRange: number[];
    outputRange: number[] | string[];
    extrapolate?: Extrapolation;
    extrapolateLeft?: Extrapolation;
    extrapolateRight?: Extrapolation;
    easing?: Easing;
  }): AnimatedNode;
  diffClamp(min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  add(b: AnimatedNode | number): AnimatedNode;
  sub(b: AnimatedNode | number): AnimatedNode;
  mul(b: AnimatedNode | number): AnimatedNode;
  div(b: AnimatedNode | number): AnimatedNode;
  mod(b: AnimatedNode | number): AnimatedNode;
}

type Extrapolation = "extend" | "clamp" | "identity";
```

Um nó do grafo de animação nativo: um `AnimatedValue`, ou um valor derivado de outros. Os nós derivados são avaliados na thread de UI sempre que suas entradas mudam.

| Método | Rust | Descrição |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Mapeia a entrada por meio de intervalos por partes. `outputRange` contém números, cores (`"#ff0000"`, `"rgba(…)"`) ou ângulos (`"45deg"`, `"1rad"`). Fora de `inputRange` ele limita por padrão; `extrapolate` (ou `extrapolateLeft` / `extrapolateRight`) pode ser `"extend"` (continuar a reta), `"clamp"` ou `"identity"` (repassar a entrada). `easing` molda cada segmento. Rust aceita números, cores do tema (que acompanham a aparência) e ângulos em graus para `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Acompanha as mudanças da entrada, mas mantém o resultado dentro de `min..max`: um cabeçalho que se oculta enquanto o conteúdo rola para cima e volta assim que rola para baixo. `snap: true` o acomoda no limite mais próximo em 200 ms quando sua scroll view para, em `max` somente depois que a entrada atingiu `max`. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | Aritmética com outro nó ou com uma constante. |
| `mod(b)` | `modulo(b)` | Módulo, nunca negativo para um `b` positivo (mantendo ângulos em 0..360). |

```rust tabs
let scroll_y = animated_value(0.0);
let header = scroll_y.diff_clamp(0.0, 44.0);

view()
    .flex_1()
    .child(scroll().scroll_value(&scroll_y).flex_1() /* rows */)
    .child(view().h(px(44.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 44);

<Scroll scrollValue={scroll} style={{ flex: 1 }}>{/* rows */}</Scroll>
<View style={{ height: 44, transform: [{ translateY: header.mul(-1) }] }} />
```

```rust tabs
let progress = animated_value(0.0);
let rotate = progress.interpolate(&[0.0, 1.0], &[0.0, 360.0]); // degrees, for bind_rotate
let color = progress.interpolate_colors(&[0.0, 0.5, 1.0], &[rgb(0x22c55e), rgb(0xeab308), rgb(0xef4444)]);
```

```tsx tabs
const progress = createAnimatedValue(0);
const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
const color = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["#22c55e", "#eab308", "#ef4444"] });
```
### Keyframes

```ts
interface Keyframe {
  offset?: number;          // 0..1 of an iteration; missing offsets spread evenly
  value: number | string;   // a number, or an angle ("45deg", "0.5turn") in degrees
  easing?: Easing;          // the segment that starts here
}
type KeyframeValue = number | string | Keyframe;

interface KeyframeTiming {
  duration?: number;        // one iteration, ms (300)
  delay?: number;           // before the first iteration, ms (0)
  easing?: Easing;          // segments without their own (CSS "ease")
  iterations?: number | "infinite";   // 1
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}
```

`value.keyframes(frames, options)` reproduz um valor por meio de keyframes e resolve com `{ finished }`, indicando se terminaram; `Animated.keyframes(value, { keyframes, ...options })` equivale a um passo de uma composição. Rust: `value.keyframes(frames, KeyframeTiming)` e `Animation::keyframes(&value, frames, KeyframeTiming)`, com `Keyframe::new(value)` (distribuídos uniformemente), `Keyframe::at(offset, value)` e `.ease(easing)`, e `KeyframeTiming::new(ms)` com `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` e `.direction(PlaybackDirection::…)`.

Eles são reproduzidos como os keyframes de CSS: um easing molda um segmento (o de um keyframe é o segmento que começa nele; o do timing vale para todos os outros); offsets ausentes nos keyframes são distribuídos uniformemente, o primeiro em 0 e o último em 1; cada iteração começa com um salto para o seu primeiro keyframe, e sem um keyframe em 0 o valor parte de onde está; durante um `delay` o valor mantém o primeiro keyframe (CSS `animation-fill-mode: backwards`); iterações para trás executam os segmentos de trás para frente, com as curvas invertidas; o valor permanece onde a última iteração o deixa.

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).iterations(Some(3)),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, iterations: 3 });
```

### createMotion

```ts
function createMotion(options?: MotionOptions): Motion;

interface MotionOptions extends MotionPlayOptions {
  initial?: { [C in MotionChannel]?: number };   // where channels start (the others at rest)
  enter?: MotionName | MotionSpec;   // start where it starts and play it at once
}

interface MotionPlayOptions extends KeyframeTiming {
  ignoreReduceMotion?: boolean;      // play even when the user asks for less motion
}

interface Motion {
  readonly opacity: AnimatedValue;
  readonly translateX: AnimatedValue;
  readonly translateY: AnimatedValue;
  readonly rotate: AnimatedValue;    // degrees
  readonly rotateX: AnimatedValue;
  readonly rotateY: AnimatedValue;
  readonly scale: AnimatedValue;
  readonly scaleX: AnimatedValue;
  readonly scaleY: AnimatedValue;
  readonly style: { opacity: AnimatedValue; transform: MotionTransform };
  readonly transform: MotionTransform;
  play(motion: MotionName | MotionSpec, options?: MotionPlayOptions): Promise<{ finished: boolean }>;
  animation(motion: MotionName | MotionSpec, options?: MotionPlayOptions): CompositeAnimation;
  stop(): void;
  reset(): void;
}
```

Cria um motion: um valor animado para cada canal da opacidade e da transformação de uma view, em repouso (opacidade e escalas 1, os demais 0), e motions para reproduzir nesses canais de forma nativa. Associe-o com `style={motion.style}`, ou aplique `motion.style` ou `motion.transform` com spread em um style; a transformação aplica suas translações, depois suas rotações, depois suas escalas, com `scale` incorporado em `scaleX` e `scaleY`: 7 dos 8 passos de transformação de uma view, o que deixa um para o seu (`[{ perspective: 600 }, ...motion.transform]` para flips 3D). `initial` define onde os canais começam (`{ opacity: 0 }`; os demais começam em repouso). Com `enter`, os canais que ele move começam onde esse motion começa (em `initial`) e ele é reproduzido imediatamente, com as demais opções como seu timing (`delay`, `duration`, ...). Um motion move apenas opacidade e transformação: aplicar `motion.style` com spread define o `opacity` da view, então associe apenas `motion.transform` para manter uma opacidade sua, e mova cores com um valor animado e `interpolate`. Rust: `motion()`, um handle `Copy` mantido pelo componente que o criou, associado com `.bind_motion(&m)`; `motion().entering(spec)` faz a entrada.

| Membro | Rust (`Motion`) | Descrição |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | Os valores animados dos canais. |
| `style`, `transform` | `.bind_motion(&m)` no elemento | As associações. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | Reproduz um preset pelo nome ou um [`MotionSpec`](#motions) nos canais; um novo interrompe o que está em reprodução. `options` alteram seu timing. Resolve com `{ finished }`: `true` quando terminou, `false` quando algo o interrompeu (`AnimationEnd` em Rust). |
| `animation(motion, options?)` | `animation(spec)` | O mesmo motion como um [`CompositeAnimation`](#animated), não iniciado, para compor: `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust: `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). Movimento reduzido é decidido no momento em que ele é criado. |
| `stop()` | `stop()` | Para onde está. |
| `reset()` | `reset()` | Para e devolve todos os canais ao repouso. |

Quando o usuário pede menos movimento (`reduceMotion()`), `play`, `animation` e `enter` chegam de uma vez ao ponto onde o motion termina, sem se mover, a menos que `ignoreReduceMotion` esteja definido (nas opções ou no motion).

```rust tabs
let card = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(80.0)));
view().size(px(120.0)).rounded(px(16.0)).bg(rgb(0x0969da)).bind_motion(&card).on_press(move || {
    card.play(MotionPreset::Pulse);
})
```

```tsx tabs
const card = createMotion({ enter: "fadeInUp", delay: 80 });
<View onPress={() => card.play("pulse")} style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }} />
```

### motions

```ts
const motions: Readonly<Record<MotionName, MotionPreset>>;

type MotionChannel = "opacity" | "translateX" | "translateY" | "rotate" | "rotateX" | "rotateY" | "scale" | "scaleX" | "scaleY";

interface MotionSpec extends KeyframeTiming {
  keyframes: { [C in MotionChannel]?: KeyframeValue[] } | MotionFrame[];
  ignoreReduceMotion?: boolean;
}
type MotionFrame = { [C in MotionChannel]?: number | string } & { offset?: number; easing?: Easing };

interface MotionPreset extends MotionSpec {
  kind: "enter" | "exit" | "attention" | "loop";
}
```

Os motions prontos como dados: `motion.play("shake")` reproduz `motions.shake`. `MotionName` é um entre `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (entrada); `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (saída); `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (atenção); `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (loop). [Animação](../docs/animation.md#presets) descreve cada um. Aplique um preset com spread para alterá-lo: `motion.play({ ...motions.fadeInUp, duration: 600 })`.

Um `MotionSpec` é um motion seu: os keyframes de cada canal (`{ opacity: [0, 1], translateY: [24, 0] }`), ou uma lista de frames como a Web Animations API os escreve (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, com um frame sem offset posicionado pela sua posição na lista), com o [timing de keyframes](#keyframes). Rust: `MotionSpec::new(KeyframeTiming)` com `.values(channel, values)` (distribuídos uniformemente), `.track(channel, keyframes)` e `.timing(|t| …)`; `MotionPreset::FadeInUp` (ou `.spec()`) é um preset, e `MotionChannel` nomeia os canais.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(MotionChannel::TranslateY, [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)]);
card.play(rise);
```

```tsx tabs
card.play({ duration: 400, keyframes: [{ opacity: 0, translateY: 24, easing: "easeOut" }, { opacity: 1, translateY: 0 }] });
```

### Animated

```ts
const Animated: {
  timing(value: AnimatedValue, config: { toValue: number; duration?: number; easing?: Easing; delay?: number }): CompositeAnimation;
  spring(value: AnimatedValue, config: { toValue: number; stiffness?: number; damping?: number; mass?: number; velocity?: number }): CompositeAnimation;
  decay(value: AnimatedValue, config?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): CompositeAnimation;
  sequence(list: CompositeAnimation[]): CompositeAnimation;
  parallel(list: CompositeAnimation[], config?: { stopTogether?: boolean }): CompositeAnimation;
  stagger(ms: number, list: CompositeAnimation[], config?: { from?: "first" | "last" | "center" | number }): CompositeAnimation;
  delay(ms: number): CompositeAnimation;
  loop(animation: CompositeAnimation, config?: { iterations?: number; resetBeforeIteration?: boolean }): CompositeAnimation;
  keyframes(value: AnimatedValue, config: KeyframeTiming & { keyframes: KeyframeValue[] }): CompositeAnimation;
  add(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  subtract(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  multiply(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  divide(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  modulo(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  diffClamp(a: AnimatedNode, min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  sampleSpring(config: SpringConfig & { from?: number }, fps?: number): number[];
  sampleDecay(config: DecayConfig & { from?: number }, fps?: number): number[];
};

interface CompositeAnimation {
  start(callback?: (result: { finished: boolean }) => void): Promise<{ finished: boolean }>;
  stop(): void;
  reset(): void;
}
```

`Animated` monta animações a partir de passos (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...). Nada é executado até `start()`; então a árvore inteira é executada de forma nativa, e cada passo começa na thread de UI no exato momento em que o anterior termina (sem intervalo de frame, sem ida e volta ao código do app entre os passos). Rust monta a mesma árvore com `Animation`.

| Função | Rust | Descrição |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | Uma animação de um valor; mesmas opções e padrões dos métodos de [`AnimatedValue`](#animatedvalue), com o alvo como `toValue`. |
| `sequence(list)` | `Animation::sequence(list)` | Executa as animações uma após a outra. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | Executa-as ao mesmo tempo. Com `stopTogether` (padrão `true`), parar uma para todas. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Executa-as em paralelo, cada uma começando `ms` depois da anterior, contado a partir de `from`: `"first"` (padrão), `"last"`, `"center"` (a do meio começa de imediato e as outras se espalham a partir dela; com uma quantidade par, os dois itens do meio começam de imediato) ou um índice (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Um valor por meio de [keyframes](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | Espera; útil dentro de `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | Repete `animation` por `iterations` vezes (para sempre por padrão), restaurando seus valores antes de cada execução, a menos que `resetBeforeIteration` seja `false`. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | os métodos do nó | O mesmo que os métodos de [`AnimatedNode`](#animatednode), como funções. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | Os valores de uma spring ou de um decay, um por frame (veja [Easing](#easing)). |

`CompositeAnimation`:

| Método | Rust (`Animation`) | Descrição |
|---|---|---|
| `start(callback?)` | `start()`, um `AnimationEnd` para aguardar | Executa (novamente). Resolve, e chama `callback`, uma única vez para a árvore inteira com `{ finished }`: se terminou em vez de ter sido interrompida. |
| `stop()` | `stop()` | Para onde está. |
| `reset()` | `reset()` | Para e restaura seus valores para onde estavam quando começou. |

```rust tabs
let ys: Vec<AnimatedValue> = (0..4).map(|_| animated_value(0.0)).collect();
let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -36.0, Timing::new(220.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);
let run = hop.start();
spawn(async move { log::info!("{}", if run.await { "done" } else { "stopped" }) });
```

```tsx tabs
const ys = [0, 1, 2, 3].map(() => createAnimatedValue(0));
const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -36, duration: 220, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);
hop.start(({ finished }) => console.log(finished ? "done" : "stopped"));
```

### Easing

```ts
type Easing =
  | "linear" | "ease" | "easeIn" | "easeOut" | "easeInOut"
  | [number, number, number, number]   // cubic Bézier x1, y1, x2, y2
  | EasingCurve
  | EasingSteps;                     // Easing.steps(…)

const Easing: {
  linear: Easing;
  ease: Easing;
  bezier(x1: number, y1: number, x2: number, y2: number): Easing;
  steps(count: number, position?: "jump-start" | "jump-end" | "jump-none" | "jump-both" | "start" | "end"): EasingSteps;
  in(e: Easing): Easing;
  out(e: Easing): Easing;
  inOut(e: Easing): Easing;
  sample(easing: Easing, count: number): number[];
  quad: EasingCurve;
  cubic: EasingCurve;
  poly(n?: number): EasingCurve;
  sin: EasingCurve;
  circle: EasingCurve;
  exp: EasingCurve;
  elastic(bounciness?: number): EasingCurve;
  back(s?: number): EasingCurve;
  bounce: EasingCurve;
};
```

Um easing é dado, não uma função do app: o runtime o avalia de forma nativa. Em Rust, é o enum `Easing`: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` e `Curve(curve, mode)`, com `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) e `EaseMode` (`In`, `Out`, `InOut`). Para desenhar um, `Easing.sample(easing, count)` (Rust: `nsh_core::element::sample_easing`) fornece seus valores em `count` pontos igualmente espaçados de 0 a 1; `Animated.sampleSpring` e `Animated.sampleDecay` (`sample_spring`, `sample_decay`) fornecem os valores de uma spring ou de um decay, um por frame (a `fps`, 60 por padrão) a partir de `from` (0) até terminar. Os três vêm do código nativo que as animações executam. Onde quer que `Easing` seja aceito em TSX, você pode passar um nome (`"easeOut"`), uma Bézier cúbica como quatro números, ou uma curva do objeto `Easing`.

| Curva | Rust | Forma |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` é 2 por padrão) |
| `sin` | `Curve::Sin` | Senoidal |
| `circle` | `Curve::Circle` | Circular |
| `exp` | `Curve::Exp` | Exponencial |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Ultrapassagem elástica (`bounciness` é 1 por padrão) |
| `back(s)` | `Curve::Back(s)` | Recua antes de avançar; `s` é a ultrapassagem (padrão 1.70158) |
| `bounce` | `Curve::Bounce` | Quica no final |

`Easing.steps(count, position)` equivale ao `steps()` do CSS: o valor salta entre `count` níveis em vez de se mover (um sprite quadro a quadro, um ponteiro que marca os segundos). `position` indica onde os saltos ocorrem: `"jump-end"` (o padrão, também `"end"`), `"jump-start"` (`"start"`), `"jump-none"` ou `"jump-both"`; Rust: `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

As curvas estão na forma "in" (lentas no início). `Easing.out(curve)` inverte uma, `Easing.inOut(curve)` a torna simétrica, `Easing.in(curve)` a mantém como está; em Rust, isso é o `EaseMode` de `Easing::Curve`.

```rust tabs
let _ = value.timing(1.0, 600.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
let _ = value.timing_with(1.0, Timing { easing: Easing::Bezier(0.2, 0.0, 0.0, 1.0), ..Timing::default() });
let _ = value.timing_with(1.0, Timing { easing: Easing::EaseOut, ..Timing::default() });
```

```tsx tabs
value.timing(1, { duration: 600, easing: Easing.out(Easing.back()) });
value.timing(1, { easing: Easing.bezier(0.2, 0, 0, 1) });
value.timing(1, { easing: "easeOut" });
```

### LayoutAnimation

```ts
const LayoutAnimation: {
  configureNext(config: LayoutAnimationConfig, onEnd?: () => void): void;
  create(duration: number, type?: LayoutAnimationType, property?: LayoutAnimationProperty): LayoutAnimationConfig;
  Types: { easeInEaseOut; spring; linear; easeIn; easeOut; keyboard };
  Properties: { opacity; scaleXY };
  Presets: { easeInEaseOut: LayoutAnimationConfig; linear: LayoutAnimationConfig; spring: LayoutAnimationConfig };
  easeInEaseOut(onEnd?: () => void): void;
  linear(onEnd?: () => void): void;
  spring(onEnd?: () => void): void;
};

interface LayoutAnimationConfig {
  duration: number;                // ms
  create?: LayoutAnimationAnimation;    // views inserted
  update?: LayoutAnimationAnimation;    // views moved or resized
  delete?: LayoutAnimationAnimation;    // views removed
}

interface LayoutAnimationAnimation {
  type?: "easeInEaseOut" | "spring" | "linear" | "easeIn" | "easeOut" | "keyboard";
  property?: "opacity" | "scaleXY" | "scale";
  duration?: number;
  delay?: number;
  springDamping?: number;          // 0..1, default 0.7
}
```

`LayoutAnimation.configureNext(config)` anima de forma nativa as mudanças de layout do próximo commit: views que se movem ou mudam de tamanho deslizam até seus novos frames, novas views aparecem (com fade ou escala de entrada, conforme `property`) e views removidas desaparecem. Chame logo antes da mudança de estado que altera o layout. Rust: `animate_layout(LayoutAnimation)`, com os presets de `nsh_core::element::LayoutAnimation` ou suas transições `create`, `update` e `delete`.

| Membro | Rust | Descrição |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anima as mudanças do próximo commit; `onEnd` é executado ao terminar. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | Uma configuração que usa a mesma curva nas três fases. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, com views aparecendo e sumindo com fade. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms em velocidade constante. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms; os frames têm efeito de spring (damping 0.4), as views aparecem e somem com fade linear. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | Atalhos para `configureNext(Presets.…)`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Os nomes, como constantes. |

```rust tabs
let open = signal(false);
let toggle = move || {
    animate_layout(LayoutAnimation::SPRING);
    open.update(|o| *o = !*o);
};

view()
    .child(text("Details").on_press(toggle))
    .child(when(move || open.get(), || text("Shown with a spring.")))
```

```tsx tabs
const open = signal(false);
const toggle = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  open.update((o) => !o);
};

<View>
  <Text onPress={toggle}>Details</Text>
  <If when={open()}>
    <Text>Shown with a spring.</Text>
  </If>
</View>
```

## Device

A API de device informa ao app sobre o dispositivo e seu ambiente. O código Rust chama as funções de `nsh_core::prelude` (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...); TSX as importa de `nsh`. O tamanho da janela, o esquema de cores, a escala de fonte, a razão de pixels, o locale e o estado do app são reativos: leia-os em um binding (uma closure passada a um elemento em Rust, JSX em TSX), `computed` ou `effect`, e o que os lê é atualizado quando a plataforma reporta uma mudança (rotação, redimensionamento da janela, troca para o modo escuro, mudança do tamanho do texto ou do idioma, mudança para uma tela de outra densidade, saída do app e retorno).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

Consulte o guia [Dispositivo e ambiente](../docs/device-and-environment.md).

### windowSize

```ts
const windowSize: Accessor<Size>;
```

O tamanho da superfície em pontos: a janela, ou o `NshAppView` / `NshView` incorporado. Reativo. Rust: `window() -> Size<Points>`.

```rust tabs
let wide = move || window().width >= px(600.0);

view().style_when(wide, |s| s.flex_row())
```

```tsx tabs
const wide = () => windowSize().width >= 600;

<View style={{ flexDirection: wide() ? "row" : "column" }}>{/* ... */}</View>
```

### colorScheme

```ts
const colorScheme: Accessor<"light" | "dark">;
```

A aparência exibida: a do sistema, a menos que o app tenha definido a sua (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). Reativo. Rust: `dark() -> bool`; as cores do tema (`AdaptiveColor`) e a variante de estilo `.dark(…)` a acompanham sem precisar lê-la. A variante `dark:` do Tailwind também a acompanha (veja [Tailwind](../docs/tailwind.md)).

```rust tabs
view().flex_1().bg(move || if dark() { black() } else { white() })
```

```tsx tabs
const dark = () => colorScheme() === "dark";

<View style={{ flex: 1, backgroundColor: dark() ? "#000" : "#fff" }} />
```

### fontScale

```ts
const fontScale: Accessor<number>;
```

O tamanho de texto preferido do usuário em relação ao padrão (`1` é o tamanho padrão; Dynamic Type no iOS, tamanho da fonte no Android), ou o tamanho de texto que o app hospedeiro define no lugar. Reativo. Rust: `font_scale() -> f32`. O texto já escala com ele, a menos que `allowFontScaling={false}`; leia-o quando outros tamanhos devam acompanhá-lo, como ícones ao lado de texto.

### locale

```ts
const locale: Accessor<string>;
```

O locale do usuário como uma tag BCP 47 (`"en-US"`, `"zh-Hans-CN"`), ou o locale que o app hospedeiro define no lugar. Reativo. Rust: `locale() -> Locale` (`locale().as_str()` é a tag). `Intl` formata para ele por padrão; leia-o para escolher as strings das suas próprias traduções ([Dispositivo e ambiente](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

Se o app está em uso, nos termos do `AppState` do React Native: `"active"` em primeiro plano e recebendo entrada, `"inactive"` enquanto visível sem o foco (outro app ou janela o tem, ou o sistema exibe algo sobre ele, como o seletor de apps ou uma chamada recebida), `"background"` enquanto não visível (em segundo plano, minimizado, uma aba de navegador oculta). Um app exibido dentro de um app nativo segue o estado desse app. Reativo. Rust: `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`).

Leia-o em um effect para pausar trabalho que ninguém vê e retomá-lo quando o app voltar:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

### setColorScheme

```ts
function setColorScheme(scheme: "light" | "dark" | "system"): void;
```

Exibe o app em `scheme` independentemente da aparência do sistema, de imediato: `colorScheme()`, as classes `dark:`, o tema dos componentes e os controles da plataforma (alertas, o estilo padrão da barra de status) a acompanham; `"system"` volta a seguir o sistema. `nsh.json` `"appearance"` a define desde o início. Rust: `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`).
### platform

```ts
const platform: Platform;

interface Platform {
  readonly os: "ios" | "android" | "macos" | "windows" | "linux" | "web";
  readonly version: string;
  readonly idiom: "phone" | "pad" | "mac" | "tv" | "desktop";
  readonly desktop: boolean;
  readonly catalyst: boolean;
  select<T>(spec: PlatformSelectSpec<T>): T | undefined;
}
```

A plataforma em que o app é executado, constante enquanto ele roda.

| Membro | Rust | Descrição |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` é a string do TS) | O sistema operacional. iOS, o simulador de iOS e o Mac Catalyst reportam `"ios"`, e os navegadores reportam `"web"`. |
| `version` | `os_version() -> (u16, u16)` | iOS e desktops: a versão do SO (`"17.5"`); Android: o nível da API (`"35"`); web: `"0.0"`. O Rust fornece as versões principal e secundária, ou o nível da API e 0 no Android. |
| `idiom` | `idiom() -> Idiom` | O tipo de dispositivo: `"desktop"` exatamente onde `desktop` é `true`; nos demais casos, `"phone"`, `"pad"` (um iPad, um tablet Android, o Mac Catalyst no idioma iPad), `"mac"` (o Mac Catalyst no idioma Mac do UIKit, um idioma mobile) ou `"tv"` (Apple TV, Android TV). |
| `desktop` | `is_desktop() -> bool` | Aplica-se o comportamento de desktop: macOS, Windows, Linux e navegadores com mouse e janela larga. As props `desktop={{…}}`, `select({ desktop })` e `idiom` `"desktop"` seguem todas esse valor. O Mac Catalyst executa o backend de iOS, então é mobile: as props `ios={{…}}` se aplicam nele. O `isAvailable` de [`nsh/desktop`](./nsh-desktop.md#isavailable) é a verificação mais restrita para as APIs de janela e menu, que existem no macOS, no Windows e no Linux. |
| `catalyst` | `is_catalyst() -> bool` | O app é executado no Mac Catalyst, no idioma Mac ou iPad (`os` é `"ios"`). |
| `select(spec)` | `match os() { … }` | O valor para esta plataforma (veja abaixo). |

```rust tabs
let columns = if is_desktop() { 3 } else { 1 };
```

```tsx tabs
const columns = platform.desktop ? 3 : 1;
```

#### platform.select

```ts
interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  macos?: T;
  windows?: T;
  linux?: T;
  web?: T;
  mobile?: T;   // platform.desktop false: iOS (Mac Catalyst included), Android, phone and tablet browsers
  desktop?: T;  // platform.desktop true: macOS, Windows, Linux, desktop browsers
  native?: T;   // every platform but the web
  default?: T;
}
```

Retorna o valor para o SO atual (`ios`, `android`, `web`, ...); senão `desktop` ou `mobile` (conforme `platform.desktop`); senão `native` (todas as plataformas, exceto a web); senão `default`; senão `undefined`. O código Rust usa match em `os()` (e em `is_desktop()` para `mobile` / `desktop`).

```rust tabs
use nsh_core::platform::Os;

let card = view().p_4();
let card = match os() {
    Os::Ios => card.shadow([BoxShadow {
        offset_y: px(2.0),
        blur: px(8.0),
        color: rgba(0x00000026).into(),
        ..BoxShadow::default()
    }]),
    Os::Android => card.elevation(px(4.0)),
    _ => card,
};
```

```tsx tabs
const shadow = platform.select({
  ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.15)" },
  android: { elevation: 4 },
});
```

> [!TIP]
> Para props que apenas uma plataforma possui, prefira as props `ios={{…}}` / `android={{…}}` dos elementos e componentes TSX em vez de ramificar com `platform` (veja [Código específico de plataforma](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

Pixels do dispositivo por ponto (p. ex. `3` na maioria dos iPhones). É reativo: muda quando a janela vai para uma tela de outra densidade (no Mac Catalyst, nos desktops ou em um monitor externo) e quando a configuração de tamanho de exibição do Android altera a densidade. Rust: `pixel_ratio() -> f32`, e `round_to_nearest_pixel(points)` para um comprimento em pixels inteiros do dispositivo; em TSX, esse comprimento é `Math.round(x * pixelRatio()) / pixelRatio()`.

```rust tabs
let hairline = move || px(1.0 / pixel_ratio());
```

```tsx tabs
const hairline = () => 1 / pixelRatio();
```

### openUrl

```ts
function openUrl(url: string): Promise<OpenUrlResult>;

interface OpenUrlResult {
  opened: boolean;
}
```

Abre `url` fora do app: uma página web no navegador, um link `mailto:` no app de e-mail, um link `tel:` no app de telefone e qualquer esquema que outro app tenha registrado (`maps:`, os links `lb://` próprios de um app host). Resolve com `{ opened }`, indicando se algo o abriu: `false` quando nenhum app trata o esquema. Rust: `open_url(url)` de `nsh_core::prelude`, uma resposta para aguardar em uma task (ou descartar), o mesmo `bool`.

```rust tabs
button()
    .child(text("Contact us"))
    .on_press(|| {
        spawn(async {
            if !open_url("mailto:help@example.com").await {
                log::warn!("no mail app");
            }
        });
    })
```

```tsx tabs
<Button
  onPress={async () => {
    const { opened } = await openUrl("mailto:help@example.com");
    if (!opened) {
      console.warn("no mail app");
    }
  }}
>
  <Text>Contact us</Text>
</Button>
```

- A URL é absoluta (tem um esquema). URLs que executariam código ou acessariam os dados do próprio app, `javascript:`, `data:`, `blob:`, `file:`, `about:` e `asset:`, rejeitam a promise com um `TypeError`, assim como endereços relativos. `openUrl` nunca lança exceção: toda falha rejeita.
- Um app que declara capabilities precisa de `openUrl`: `"openUrl": true` para todos os esquemas, ou `"openUrl": { "schemes": ["https", "mailto"] }` para os listados; as demais URLs rejeitam com um `Error` cujo `code` é `"ERR_ACCESS_DENIED"`, `permission` `"openUrl"` e `resource` a URL (veja [Sandbox e capabilities](../docs/sandbox-and-capabilities.md)). Em Rust, `open_url` responde `false` nesses casos e registra o motivo no log.
- O app que embute o Native Shell vê a URL primeiro e pode encaminhá-la ao seu próprio roteador (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url`; veja [iOS](../docs/ios.md#links-the-app-opens) e [Android](../docs/android.md#links-the-app-opens)). `opened` então é `true`.
- Cada plataforma a abre com seu próprio mecanismo: `UIApplication.open` no iOS (o application do app host quando embutido), uma intent `ACTION_VIEW` no Android, `NSWorkspace` no macOS, `ShellExecuteW` no Windows, `GtkUriLauncher` no Linux, o `open_url` do GPUI e uma nova aba na web. `nsh test` registra as URLs em vez de abri-las.
- Um [`TextView`](../elements/text-view.md) abre seus links dessa forma com `links="open"`.

<a id="layout-direction"></a>

### Direção do layout

A direção do layout segue o idioma do usuário: em um idioma da direita para a esquerda (árabe, hebraico, ...), o app é disposto da direita para a esquerda, as linhas partem da direita, e as propriedades de estilo `left` / `right` (`marginLeft`, `paddingRight`, ...) significam início e fim. As mudanças se aplicam imediatamente, sem reiniciar.

O estilo `direction` de uma view (`"ltr"`, `"rtl"` ou `"inherit"`, o padrão) define a direção da sua própria subárvore; em Rust, `.direction(LayoutDirection::..)`.

```rust tabs
view().direction(LayoutDirection::Rtl).flex_row().gap_2().child(text("First")).child(text("Second"))
```

```tsx tabs
<View style={{ direction: "rtl", flexDirection: "row", gap: 8 }}>
  <Text>First</Text>
  <Text>Second</Text>
</View>
```

<a id="related"></a>

### Relacionados

- Os safe area insets (Rust `safe_area()`; TSX `safeArea()`, `safeAreaInsets()`) e o teclado virtual (Rust `keyboard_height()`; TSX `keyboardFrame()`) estão em [Safe area e teclado](#safe-area-and-keyboard).
- As configurações de leitor de tela e de redução de movimento estão em [Acessibilidade](#accessibility).

## PanResponder

Pan responders são gestos de arrastar construídos sobre o sistema de gesture responder: o elemento reivindica os toques de um gesto e passa a recebê-los sozinho, junto com o estado do gesto, que acompanha para você o centroide dos toques, a distância percorrida e a velocidade. O código Rust os reivindica com `.claim_touches(TouchClaim::…)` e os escuta com listeners `.on_responder_*` cujo `ResponderEvent` carrega um `PanGesture`, tudo em `nsh_core::prelude`; o TSX importa `PanResponder` de `nsh`, cujos callbacks `onPanResponder…` recebem o evento de toque e o estado do gesto.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Um pan responder entrega cada movimento ao código do app, então é adequado para gestos que alteram o estado do app (reordenação, decisões de deslizar para excluir). Para mover uma view com o dedo, os valores de gesto nativos são mais rápidos: `.pan_values(x, y)`, `.pinch_value(scale)` e `.rotation_value(angle)` em Rust, as props `pan={{ x, y }}`, `pinch` e `rotation` em TSX. O arrasto grava [valores animados](#animation) na thread de UI e o app só é avisado quando o gesto começa e termina (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`). Veja [Toque e gestos](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Cria um pan responder. Espalhe seu `panHandlers` na view que deve receber o gesto. Em Rust, a view reivindica os toques e escuta por conta própria:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view().flex_1().child(
        view()
            .size(px(64.0))
            .rounded(px(32.0))
            .bg(rgb(0x6366f1))
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
                pos.set((x + e.gesture.delta.x.0, y + e.gesture.delta.y.0));
            })
            .on_responder_release(move |e: &ResponderEvent| {
                log::info!("released at {:.0} pt/s", e.gesture.vx);
            }),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function App() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => (start = pos()),
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log(`released at ${g.vx.toFixed(0)} pt/s`),
  });
  return (
    <View style={{ flex: 1 }}>
      <View
        {...pan.panHandlers}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#6366f1",
          transform: [{ translateX: pos().x }, { translateY: pos().y }],
        }}
      />
    </View>
  );
}

mount(App);
```

### Callbacks

Todo callback recebe o evento de toque (`GestureResponderEvent`, de [`nsh`](#types)) e o estado do gesto. Em Rust, uma reivindicação decide com `.ask(|request: &ClaimRequest| …)`, chamando `request.claim()` para assumir os toques (sem `ask` ela sempre os assume), e cada listener recebe um `ResponderEvent` cujo `gesture` é o estado.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Callback | Rust | Retorna | Chamado quando |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | Um dedo toca a tela: retorne `true` para se tornar o responder. Consultado da view tocada para fora. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | O mesmo, consultado de fora para dentro antes do de bubbling (um pai tomando o gesto de seus filhos). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | Um dedo se move: retorne `true` para se tornar o responder (p. ex. somente depois de `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | O mesmo, na fase de captura. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | Esta view agora é o responder: o gesto começa. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | Outra view é o responder e não quis ceder. |
| `onPanResponderStart` | `.on_responder_start(…)` | | Um dedo tocou a tela enquanto a view respondia. |
| `onPanResponderMove` | `.on_responder_move(…)` | | Os dedos se moveram. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | Um dedo foi levantado enquanto a view respondia. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | O último dedo foi levantado: o gesto terminou. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | Outra view (ou um gesto nativo, como uma scroll view) assumiu os toques. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` mantém | `boolean` | Outra view quer os toques: retorne `false` para mantê-los (padrão `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | Indica se as scroll views nativas devem ser impedidas de assumir os toques enquanto a view responde (padrão `true`). |

### PanResponderGestureState

```ts
interface PanResponderGestureState {
  stateID: number;
  moveX: number;               // latest centroid of the touches (surface points)
  moveY: number;
  x0: number;                  // the centroid when the responder was granted
  y0: number;
  dx: number;                  // distance moved since the grant
  dy: number;
  vx: number;                  // velocity, points per second
  vy: number;
  numberActiveTouches: number;
}
```

Rust: `PanGesture`, com pontos como `Point<Points>`.

| Campo | Rust | Descrição |
|---|---|---|
| `stateID` |  | Identifica o gesto. |
| `moveX`, `moveY` | `position` | Última posição do centroide dos toques, em pontos da superfície. |
| `x0`, `y0` | `origin` | Onde o centroide estava quando o responder foi concedido. |
| `dx`, `dy` | `delta` | Distância percorrida desde a concessão. |
| `vx`, `vy` | `vx`, `vy` | Velocidade em pontos por segundo. |
| `numberActiveTouches` | `active_touches` | Dedos na tela. |

<a id="inside-scroll-views"></a>

### Dentro de scroll views

Enquanto um pan responder é o responder, as scroll views nativas ao redor dele não rolam (`onShouldBlockNativeResponder` tem como padrão `true`). Para que um deslize horizontal conviva com a rolagem vertical, torne-se o responder apenas em movimentos horizontais:

```rust tabs
view()
    .claim_touches(TouchClaim::on_move().ask(|request: &ClaimRequest| {
        let d = request.event.gesture.delta;
        if d.x.0.abs() > 10.0 && d.x.0.abs() > d.y.0.abs() {
            request.claim();
        }
    }))
    .on_responder_move(move |e: &ResponderEvent| offset.set(e.gesture.delta.x.0))
    .on_responder_release(move |e: &ResponderEvent| {
        if e.gesture.delta.x.0.abs() > 120.0 { remove() } else { offset.set(0.0) }
    })
    .on_responder_terminate(move |_: &ResponderEvent| offset.set(0.0))
```

```tsx tabs
const swipe = PanResponder.create({
  onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
  onPanResponderMove: (_, g) => offset.set(g.dx),
  onPanResponderRelease: (_, g) => (Math.abs(g.dx) > 120 ? remove() : offset.set(0)),
  onPanResponderTerminate: () => offset.set(0),
});
```

Para um pan que a plataforma reconhece, `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` decide na thread principal conforme os dedos se movem. As props de responder subjacentes (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) também podem ser usadas diretamente em qualquer elemento; veja [Elementos](../elements/index.md).

## Clipboard

A API Clipboard lê e grava a área de transferência do sistema: texto em todo lugar (`UIPasteboard` no iOS, `ClipboardManager` no Android, `NSPasteboard`, GDK e a área de transferência do Win32 nos desktops, `navigator.clipboard` na web), imagens no iOS, nos desktops e na web, e os arquivos copiados em um gerenciador de arquivos nos desktops e no Mac Catalyst. O código Rust chama as funções de `nsh_core::prelude` (`set_clipboard`, `clipboard_string`, ...); o TSX importa `Clipboard` de `nsh`.

```rust tabs
use nsh_core::prelude::*; // set_clipboard, clipboard_string, clipboard_image, ...
use nsh_core::element::ClipboardImage;
```

```tsx tabs
import { Clipboard } from "nsh";
```

```ts
const Clipboard: {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  hasText(): Promise<boolean>;
  writeImage(src: string): Promise<void>;
  readImage(): Promise<ClipboardImage | null>;
  hasImage(): Promise<boolean>;
  readFiles(): Promise<string[]>;
};

interface ClipboardImage {
  url: string; // a URL that Image shows and fetch reads
  size: PixelSize; // in pixels
}
```

| TS | Rust (`nsh_core::prelude`) |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

As leituras em Rust retornam respostas para aguardar em uma task (`spawn`, ou uma função de módulo `async`); `ClipboardImage` é `nsh_core::element::ClipboardImage`, com `url` e `size` (um `Size<DevicePixels>`).

As imagens passam pela área de transferência no iOS, nos desktops e na web. No Android, a área de transferência carrega texto: `writeImage` e
`readImage` rejeitam com um `Error` cujo `code` é `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`, e `hasImage` resolve
`false`. Em Rust, `set_clipboard_image` deixa a área de transferência como está nesse caso e `clipboard_image` responde `None`.

O usuário também pode copiar por conta própria de um [texto selecionável](../elements/text.md); a API Clipboard serve para copiar a partir do código, como em um botão Copiar.

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

Coloca `text` na área de transferência, substituindo o que havia nela. Rust: `set_clipboard(text)`.

```rust tabs
use nsh_core::prelude::*;

fn copy_button(code: Signal<String>) -> impl IntoElement {
    let copied = signal(false);
    view()
        .role(AccessibilityRole::Button)
        .on_press(move || {
            set_clipboard(code.get());
            copied.set(true);
        })
        .child(text(move || if copied.get() { "Copied" } else { "Copy" }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Clipboard } from "nsh";

const copied = signal(false);

<View
  onPress={async () => {
    await Clipboard.writeText(code());
    copied.set(true);
  }}
>
  <Text>{copied() ? "Copied" : "Copy"}</Text>
</View>;
```

### Clipboard.readText

```ts
readText(): Promise<string>;
```

Resolve com o texto da área de transferência, ou `""` quando ela não contém nenhum. Rust: `clipboard_string()`. No iOS, ler a área de transferência pode exibir o aviso de colagem do sistema ("App colou de …"), e no Android 10 e posteriores somente o app em primeiro plano pode lê-la. Leia-a quando o usuário pedir para colar, não em toda tela.

```rust tabs
spawn(async move {
    let pasted = clipboard_string().await;
    if !pasted.is_empty() {
        code.set(pasted.trim().to_string());
    }
});
```

```tsx tabs
const pasted = await Clipboard.readText();
if (pasted) code.set(pasted.trim());
```

### Clipboard.hasText

```ts
hasText(): Promise<boolean>;
```

Resolve com a informação de se a área de transferência contém texto, sem lê-la: sem aviso de colagem no iOS. Rust: `clipboard_has_string()`. Use-o para decidir se deve exibir um botão Colar. Na web, os navegadores só informam isso lendo o conteúdo, então pode ser solicitada permissão ao usuário.

```rust tabs
let can_paste = signal(false);
spawn(async move { can_paste.set(clipboard_has_string().await) });
```

```tsx tabs
const canPaste = signal(false);
Clipboard.hasText().then((has) => canPaste.set(has));
```

### Clipboard.readImage

```ts
readImage(): Promise<ClipboardImage | null>;
```

Resolve com a imagem da área de transferência, ou `null` quando ela não contém nenhuma: uma captura de tela colada, ou uma imagem copiada em um navegador
ou em um editor de imagens. Rust: `clipboard_image()`, `None` quando não contém nenhuma. `url` é uma URL da imagem (PNG, ou o
JPEG, GIF, WebP ou BMP da própria área de transferência) que uma [`Image`](../elements/image.md) exibe como seu `src` e que `fetch` lê:
`fetch(url)` fornece seus bytes, para um upload. `size` (`width` e `height`) é seu tamanho em pixels, como decodificada. Assim como em
`readText`, leia-a quando o usuário pedir para colar. Imagens de até 48 MB (codificadas) são lidas, de modo que a imagem caiba na
memória do app; uma imagem maior rejeita com um `Error` cujo `code` é `"ERR_NSH_QUOTA_EXCEEDED"` (sua mensagem informa o tamanho da
imagem e o limite), enquanto `hasImage` resolve `true`. Rust: `clipboard_image()` responde `None` nesse caso.

```rust tabs
use base64::Engine as _;
use nsh_core::{element::ClipboardImage, prelude::*};

fn attachments() -> impl IntoElement {
    let attachments = signal(Vec::<ClipboardImage>::new());
    let paste = move || {
        spawn(async move {
            if let Some(image) = clipboard_image().await {
                attachments.update(|list| list.push(image));
            }
        });
    };
    view()
        .flex_row()
        .gap_2()
        .child(text("Paste").on_press(paste))
        .child(each(
            attachments,
            |shot: &ClipboardImage| shot.url.clone(),
            |shot, _| image(move || shot.with(|s| s.url.clone())).size(px(64.0)).rounded(px(8.0)),
        ))
}

async fn upload(image: &ClipboardImage) -> Result<HttpResponse, String> {
    let (_, data) = image.url.split_once(',').ok_or("not a data: URL")?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let request = HttpRequest::post("https://example.com/upload", bytes).header("Content-Type", "image/png");
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, View } from "nsh";
import { Clipboard, type ClipboardImage } from "nsh";

const attachments = signal<ClipboardImage[]>([]);

async function paste() {
  const image = await Clipboard.readImage();
  if (image) attachments.set([...attachments(), image]);
}

async function upload(image: ClipboardImage) {
  const body = new FormData();
  body.append("file", await (await fetch(image.url)).blob(), "screenshot.png");
  await fetch("https://example.com/upload", { method: "POST", body });
}

<View class="flex-row gap-2">
  <Each of={attachments()}>
    {(image) => <Image src={image().url} style={{ width: 64, height: 64, borderRadius: 8 }} />}
  </Each>
</View>;
```

Um app no estilo chat em que os usuários colam capturas de tela em um campo de composição associa o atalho de colar enquanto seu input tem o foco
e pega a imagem quando houver uma:

```rust tabs
use nsh_core::keymap::When;

on_key_with("mod+v", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| {
    spawn(async move {
        if clipboard_has_image().await {
            paste().await;
        } else {
            insert_text(&clipboard_string().await);
        }
    });
});
```

```tsx tabs
import { keymap } from "nsh";

keymap.bind("mod+v", async () => {
  if (await Clipboard.hasImage()) return paste();
  insertText(await Clipboard.readText());
}, { when: "always" });
```

### Clipboard.hasImage

```ts
hasImage(): Promise<boolean>;
```

Resolve com a informação de se a área de transferência contém uma imagem, sem lê-la: sem aviso de colagem no iOS. Rust:
`clipboard_has_image()`. No Android, resolve `false`.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

Coloca na área de transferência a imagem de `src`, uma URL `data:` em base64 ou a `url` que `readImage` forneceu, substituindo o que ela contém.
Rust: `set_clipboard_image(src)`. No Windows, aceita um PNG, o formato que navegadores, o Office e a Ferramenta de Captura leem. No
Android, rejeita com `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.

```rust tabs
set_clipboard_image(image.url.clone());
```

```tsx tabs
await Clipboard.writeImage(image.url);
```

### Clipboard.readFiles

```ts
readFiles(): Promise<string[]>;
```

Resolve com as URLs `file:` dos arquivos e pastas copiados em um gerenciador de arquivos (Finder, Explorer, Files), na
mesma ordem, ou `[]`: as mesmas URLs que um [drop de arquivos](../elements/view.md#desktop-file-drops) fornece. Rust: `clipboard_files()`.
Faça o parse de uma URL para obter seu caminho.

```rust tabs
let paths: Vec<std::path::PathBuf> = clipboard_files()
    .await
    .iter()
    .filter_map(|file| url::Url::parse(file).ok()?.to_file_path().ok())
    .collect();
```

```tsx tabs
const files = await Clipboard.readFiles();
const names = files.map((url) => decodeURIComponent(new URL(url).pathname.split("/").pop()!));
```

> [!NOTE]
> Quando seu app declara `capabilities` em `nsh.json`, a área de transferência precisa ser concedida com `"clipboard": true`. Sem isso, toda função de `Clipboard` rejeita com um `Error` cujo `code` é `"ERR_ACCESS_DENIED"`, `permission` `"clipboard"` e `resource` `""`, e nada chega à área de transferência do sistema. Em Rust, as gravações deixam a área de transferência como está e as leituras respondem o mesmo que uma área de transferência vazia (`""`, `None`, uma lista vazia, `false`), e a recusa é registrada no log. Veja [Sandbox e capabilities](../docs/sandbox-and-capabilities.md).
>
> ```tsx
> try {
>   await Clipboard.writeText(code());
> } catch (error) {
>   if (error.code === "ERR_ACCESS_DENIED") showHint("Copying is turned off for this app");
>   else throw error;
> }
> ```
## Picker

A API de picker mostra o seletor de fotos do sistema e entrega ao app as imagens escolhidas pelo usuário: o Photos picker no iOS (`PHPickerViewController`), o Photo Picker no Android, um painel de abertura ou diálogo de arquivo nos desktops e um file input em um navegador. No iOS e no Android o seletor roda fora do app e entrega apenas o que o usuário escolhe, então não precisa de permissão para a biblioteca de fotos. Cada imagem escolhida chega como um `File` (TSX) ou um `PickedFile` (Rust) cujos bytes permanecem nativos: mostre-a com `URL.createObjectURL(file)` em um [`Image`](../elements/image.md), envie-a com `fetch` e
`FormData`. O código Rust chama `pick_images` de `nsh_core::prelude`; o TSX importa `Picker` de `nsh`.

```rust tabs
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*; // pick_images
```

```tsx tabs
import { Picker, type PickedImage } from "nsh";
```

```ts
const Picker: {
  pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
};

interface PickImagesOptions {
  multiple?: boolean; // let the user pick several (false: one)
  limit?: number; // at most this many when multiple (up to 100)
  maxDimension?: number; // scale images whose longer side is longer, in pixels
  quality?: number; // JPEG quality from 0 to 1 (0.9)
  format?: "compatible" | "current"; // "compatible": HEIC and the like as JPEG
}

interface PickedImage {
  file: File; // name, type, size in bytes and the bytes
  size: PixelSize; // upright
}
```

| TS | Rust |
|---|---|
| `await Picker.pickImages(options)` | `pick_images(request).await -> Vec<PickedFile>` |
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit`: 0 para até 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

Mostra o seletor e resolve com as imagens escolhidas pelo usuário, na ordem em que foram escolhidas, ou com `[]` quando o usuário cancela.
Rust: `pick_images(request)`, uma resposta para aguardar em uma task (`spawn`, ou uma função de módulo de `async`). `pickImages`
nunca lança exceção: opções fora do intervalo (`limit: 0`, um `quality` fora de 0 a 1) rejeitam a promise com um `RangeError`, e uma
escolha que as capabilities do app não permitem rejeita com `ERR_ACCESS_DENIED` (abaixo). Um cancelamento é a resposta do usuário, não uma
falha: ele resolve `[]`.

As imagens chegam prontas para envio:

- **Formatos que todo navegador e servidor aceitam.** JPEG, PNG, GIF e WebP chegam como estão; uma foto armazenada em outro
  formato (HEIC em iPhones, HEIF, TIFF) chega como JPEG. `format: "current"` mantém o formato armazenado.
- **Reduzidas nativamente.** Com `maxDimension`, uma imagem cujo lado maior é maior que esse valor é reduzida para caber nele, na vertical, e
  codificada novamente: um PNG como PNG, qualquer outro como JPEG de `quality`. Fotos de celular têm de 12 a 48 megapixels; reduzi-las
  para 2048 pixels antes de um upload as deixa com algumas centenas de kilobytes. Um `quality` também recodifica JPEGs.
- **O que ela exibe.** `size` é o tamanho da imagem em pixels como ela aparece, com a orientação da câmera aplicada. Uma imagem que o NSH
  recodifica não carrega metadados (nem localização); uma que chega como está mantém os seus.

No Windows, no Linux e em janelas GPUI, o diálogo oferece os formatos que a requisição aceita (com `"compatible"`: JPEG, PNG,
GIF e WebP) e os arquivos chegam como estão armazenados, no tamanho original.

Um compositor de chat anexa uma foto, a exibe enquanto a mensagem é escrita e a envia quando a mensagem é enviada:

```rust tabs
use nsh_core::geometry::{DevicePixels, Percentage};
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*;

fn attach_button(attached: Signal<Option<PickedFile>>) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .accessibility_label("Choose a photo")
        .on_press(move || {
            let mut request = PickRequest::new(false, 1);
            request.max_dimension = Some(DevicePixels(2048));
            request.quality = Some(Percentage(0.85));
            let picked = pick_images(request);
            spawn(async move {
                if let Some(file) = picked.await.into_iter().next() {
                    attached.set(Some(file));
                }
            });
        })
        .child(text("Photo"))
}

async fn upload(file: &PickedFile) -> Result<HttpResponse, String> {
    let request = HttpRequest::post("https://example.com/upload", file.data.to_vec())
        .header("Content-Type", file.mime.as_str());
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, Text, View } from "nsh";
import { Picker } from "nsh";

const attached = signal<{ file: File; src: string } | null>(null);

async function choosePhoto() {
  const [picked] = await Picker.pickImages({ maxDimension: 2048, quality: 0.85 });
  if (picked) attached.set({ file: picked.file, src: URL.createObjectURL(picked.file) });
}

async function send(text: string) {
  const body = new FormData();
  body.append("text", text);
  if (attached()) body.append("photo", attached()!.file);
  await fetch("https://example.com/messages", { method: "POST", body });
  if (attached()) URL.revokeObjectURL(attached()!.src);
  attached.set(null);
}

<View class="flex-row items-center gap-2">
  <View role="button" accessibilityLabel="Choose a photo" onPress={choosePhoto}>
    <Text>Photo</Text>
  </View>
  <If when={attached()}>
    <Image src={attached()!.src} style={{ width: 48, height: 48, borderRadius: 8 }} />
  </If>
</View>;
```

Várias fotos de uma vez:

```rust tabs
let picked = pick_images(PickRequest::new(true, 9));
spawn(async move {
    let files = picked.await;
    photos.update(|list| list.extend(files));
});
```

```tsx tabs
const images = await Picker.pickImages({ multiple: true, limit: 9, maxDimension: 2048 });
photos.set([...photos(), ...images.map((image) => URL.createObjectURL(image.file))]);
```

<a id="embedding-apps"></a>

### Apps que incorporam o NSH

Um app que incorpora o NSH e tem um seletor próprio (com os álbuns do próprio app, por exemplo) responde às escolhas por conta própria: em
Rust, um `PickerBackend` (`nsh_core::picker`) entregue ao engine (`EngineConfig::picker`, ou `AppView::set_picker` em
apps GPUI e GPUI Kit) recebe o `PickRequest` de cada escolha e devolve os arquivos, e o seletor do sistema não
é mostrado. Os arquivos que ele devolve são completados como os da plataforma: cortados no limite da requisição, com tamanhos, tipos e
extensões lidos a partir de seus bytes.

<a id="tests"></a>

### Testes

`nsh test` responde às escolhas em execuções headless: `app.onPick(handler)` devolve os arquivos que o usuário escolhe (`{ name, type, data }`),
e sem um handler a escolha é cancelada. Veja [Testes](../docs/testing-and-trace.md).

> [!NOTE]
> Quando seu app declara `capabilities` em `nsh.json`, o seletor precisa ser concedido com `"picker": true`. Sem isso,
> `pickImages` não mostra nada e rejeita com um `Error` cujo `code` é `"ERR_ACCESS_DENIED"`, `permission`
> `"picker"` e `resource` `""`. Em Rust, `pick_images` responde sem arquivos e a recusa é registrada no log. Veja
> [Sandbox e capabilities](../docs/sandbox-and-capabilities.md).

## Speech

A API de speech transforma o que o usuário diz em texto (ditado): o app inicia uma sessão, a plataforma escuta o
microfone e a transcrição chega conforme cresce. O macOS e o iOS reconhecem a fala com o Speech framework do sistema; o
sistema pede ao usuário, uma única vez, acesso ao microfone e ao reconhecimento de fala. Em outras plataformas, uma sessão termina imediatamente
com o erro `"unavailable"`, então verifique `Speech.available()` antes de mostrar um botão de microfone. O código Rust chama
`recognize_speech` de `nsh_core::prelude`; o TSX importa `Speech` de `nsh`.

```rust tabs
use nsh_core::speech::{SpeechEvent, SpeechRequest};
```

```tsx tabs
import { Speech, type SpeechSession } from "nsh";
```

```ts
const Speech: {
  available(): Promise<boolean>;
  start(options?: SpeechOptions): SpeechSession;
};

interface SpeechOptions {
  /** The language spoken, a BCP 47 tag ("en-US", "zh-CN"); the user's when left out. */
  lang?: string;
  /** Results while the user speaks (true, the default), or only the final one. */
  interim?: boolean;
}

interface SpeechSession {
  on(event: "start", listener: () => void): () => void;
  on(event: "result", listener: (result: SpeechResult) => void): () => void;
  on(event: "end", listener: (end: SpeechEnd) => void): () => void;
  /** The whole transcript so far. */
  readonly text: string;
  readonly ended: boolean;
  stop(): void;
  abort(): void;
}

interface SpeechResult { text: string; isFinal: boolean }
interface SpeechEnd { text: string; error?: SpeechErrorCode }

type SpeechErrorCode =
  | "not-allowed" | "no-speech" | "audio-capture" | "network"
  | "language-not-supported" | "unavailable" | "failed";
```

| TSX | Rust |
|---|---|
| `await Speech.available()` | `speech_available().await -> bool` |
| `Speech.start(options)` | `recognize_speech(request) -> SpeechRecognition` |
| `session.on("result", ...)` | `recognition.next().await -> Option<SpeechEvent>` |
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (descartá-lo aborta) |

### Speech.start

Inicia uma sessão e a devolve imediatamente. Uma sessão informa, nesta ordem: `start` quando o microfone está ligado e o
reconhecedor escuta, `result` cada vez que a transcrição muda (`text` é sempre a transcrição inteira até o momento, de modo que o
app a mostra como está) e um único `end`, depois do qual nada mais chega. `stop()` para de escutar e deixa o reconhecedor
terminar o que ouviu: um último resultado com `isFinal: true`, depois `end`. `abort()` encerra a sessão imediatamente, sem
erro, e descarta o que não foi informado. Uma sessão roda por vez: iniciar outra aborta a que estiver rodando.

`end` carrega a última transcrição e, quando a sessão falhou, `error`, nomeado como na Web Speech API:

| `error` | Quando |
|---|---|
| `"not-allowed"` | O usuário ou o sistema não permite o microfone ou o reconhecimento de fala. |
| `"no-speech"` | Nada foi dito. |
| `"audio-capture"` | Não foi possível usar o microfone. |
| `"network"` | O reconhecedor precisa da rede e não conseguiu acessá-la. |
| `"language-not-supported"` | O reconhecedor não conhece `lang`. |
| `"unavailable"` | Esta plataforma não reconhece fala, ou não neste momento. |
| `"failed"` | O reconhecedor falhou por outro motivo. |

`start` lança um `TypeError` para opções de tipos errados e um `RangeError` para um `lang` que não é uma tag de idioma.

```tsx
import { signal, Speech, type SpeechSession } from "nsh";

const transcript = signal("");
let session: SpeechSession | null = null;

function toggle() {
  if (session && !session.ended) {
    session.stop();
    return;
  }
  session = Speech.start({ lang: "en-US" });
  session.on("result", ({ text }) => transcript.set(text));
  session.on("end", ({ text, error }) => {
    if (error) console.warn("dictation ended:", error);
    else transcript.set(text);
  });
}
```

```rust
use nsh_core::prelude::*;
use nsh_core::speech::{SpeechEvent, SpeechRequest};

async fn dictate() -> String {
    let mut recognition = recognize_speech(SpeechRequest::default());
    let mut text = String::new();
    while let Some(event) = recognition.next().await {
        match event {
            SpeechEvent::Result { text: heard, .. } => text = heard,
            SpeechEvent::End { .. } => break,
            _ => {}
        }
    }
    text
}
```

### Speech.available

Resolve `true` onde uma sessão pode rodar: no macOS e no iOS, e onde quer que o app que incorpora o NSH reconheça fala por conta própria.

### Info.plist

No macOS e no iOS, o sistema mostra por que o app quer o microfone e o reconhecimento de fala. `nsh package` e
`nsh run` escrevem `NSMicrophoneUsageDescription` e `NSSpeechRecognitionUsageDescription` no Info.plist do app
quando o app pode usar speech (sua concessão de `capabilities` `speech`, ou ele não declara nenhuma).

<a id="embedding-apps-1"></a>

### Apps que incorporam o NSH

Um app que incorpora o NSH e reconhece fala à sua maneira (com seu próprio engine ou serviço) responde às sessões por conta própria: em
Rust, um `SpeechBackend` (`nsh_core::speech`) entregue ao engine (`EngineConfig::speech`) recebe o
`SpeechRequest` de cada sessão e um `SpeechSink` ao qual ele informa a partir de qualquer thread, e devolve o `SpeechControl` com o qual o core encerra e
aborta a sessão. O reconhecedor da plataforma não é usado nesse caso.

<a id="tests-1"></a>

### Testes

`nsh test` executa sessões em um reconhecedor falso em execuções headless: uma sessão começa imediatamente, `app.hear(text)` informa
`text` como a transcrição até o momento, `app.endSpeech(error?)` a encerra e `app.speechRequests()` lista as sessões que o
app iniciou. Veja [Testes](../docs/testing-and-trace.md).

> [!NOTE]
> Quando seu app declara `capabilities` em `nsh.json`, speech precisa ser concedido com `"speech": true`. Sem isso,
> `Speech.start` lança um `Error` cujo `code` é `"ERR_ACCESS_DENIED"`, `permission` `"speech"` e `resource` `""`.
> Em Rust, a sessão termina com `not-allowed` e a recusa é registrada no log. Veja
> [Sandbox e capabilities](../docs/sandbox-and-capabilities.md).

## Storage

A API de storage mantém os dados do app no dispositivo: strings por chave de string, que continuam lá na próxima vez que o app iniciar. Use-a para configurações, rascunhos, a última aba que o usuário tinha aberta, um cache do que o servidor enviou — qualquer estado que deva sobreviver ao processo do app. O código Rust usa `nsh_core::storage::Storage`, o TSX importa `Storage` de `nsh`; ambos leem e escrevem as mesmas entradas, então um app com uma entrada em Rust e uma em TSX vê um único conjunto de dados.

```rust tabs
use nsh_core::storage::Storage;
```

```tsx tabs
import { Storage } from "nsh";
```

```ts
const Storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
};
```

| TS | Rust (`nsh_core::storage::Storage`) |
|---|---|
| `await Storage.getItem(key)` | `Storage::get_item(key) -> Option<String>` |
| `await Storage.setItem(key, value)` | `Storage::set_item(key, value) -> Result<(), StorageFull>` |
| `await Storage.removeItem(key)` | `Storage::remove_item(key)` |
| `await Storage.keys()` | `Storage::get_all_keys() -> Vec<String>` |
| `await Storage.clear()` | `Storage::clear()` |

As funções Rust são síncronas, pois as entradas ficam em memória: chame-as onde os componentes rodam (em seus corpos, handlers e tasks).

Cada app tem um storage próprio, de até 5 MB de chaves e valores. As chamadas rodam na ordem em que o app as faz, então um `getItem` depois de um `setItem` vê o novo valor sem esperar pela escrita. As leituras vêm da memória; as escritas chegam ao disco em segundo plano, algumas por vez.

| Plataforma | Onde os dados ficam |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` no contêiner do app |
| Android | `files/nsh/<app id>/storage.json` no diretório privado do app |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | O `localStorage` do navegador, sob chaves nomeadas com o id do app (`nsh:com.example.todo:…`) |

Um `storage.json` danificado é mantido como `storage.json.corrupt` ao lado dele, e o app inicia com um storage vazio; um que não pode ser lido deixa as alterações do app em memória, de modo que o arquivo nunca é substituído.

O id do app é o `id` em `nsh.json`, e ele viaja com o app: `nsh build` e `nsh package` o escrevem junto ao bundle, o dev server o envia e um pacote assinado carrega o id que o certificado de sua chave de release garante. Assim, todo app mantém seus próprios dados sem nenhuma configuração, onde quer que rode; um app sem id os mantém em `default`. Um app que incorpora o NSH pode escolher outro local (veja [Incorporação no iOS](../docs/ios.md) e [Incorporação no Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

Resolve com o valor de `key`, ou com `null` quando ela não tem valor. Rust: `Storage::get_item(key)`, `None` quando ela não tem valor.

```rust tabs
let theme = Storage::get_item("theme").unwrap_or_else(|| "system".into());
```

```tsx tabs
const theme = (await Storage.getItem("theme")) ?? "system";
```

### Storage.setItem

```ts
setItem(key: string, value: string): Promise<void>;
```

Define `key` como `value`, substituindo o que ela continha. Rejeita com um `Error` cujo `code` é `"ERR_NSH_QUOTA_EXCEEDED"` quando o storage passaria de 5 MB; o valor não é mantido nesse caso. Rust: `Storage::set_item(key, value)`, que nesse caso devolve `Err(StorageFull)`. Os valores são strings: mantenha dados estruturados como JSON (`serde_json::to_string` em Rust, `JSON.stringify` em TSX) e leia-os de volta (`serde_json::from_str`, `JSON.parse`).

```rust tabs
let draft = serde_json::json!({ "title": title.get(), "body": body.get() });
if let Err(full) = Storage::set_item("draft", draft.to_string()) {
    log::warn!("{full}");
}
```

```tsx tabs
Storage.setItem("draft", JSON.stringify({ title: title(), body: body() }));
```

### Storage.removeItem

```ts
removeItem(key: string): Promise<void>;
```

Remove `key` e seu valor. Remover uma chave que não tem valor não faz nada. Rust: `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

Resolve com todas as chaves, em ordem. Rust: `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

Remove todas as chaves do app, como quando o usuário sai da conta. Rust: `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### Mantendo um signal no dispositivo

Leia o valor armazenado quando o app inicia e depois o escreva de volta sempre que o signal mudar:

```rust tabs
use nsh_core::{storage::Storage, prelude::*};

#[component]
pub fn App() -> impl IntoElement {
    let saved = Storage::get_item("count").and_then(|n| n.parse().ok());
    let count = signal(saved.unwrap_or(0_u32));
    effect(move || {
        if let Err(full) = Storage::set_item("count", count.get().to_string()) {
            log::warn!("{full}");
        }
    });
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Pressed {} times", count.get())))
}
```

```tsx tabs
import { effect, mount, signal, Text, View } from "nsh";
import { Storage } from "nsh";

const count = signal(0);
const loaded = signal(false);
Storage.getItem("count").then((saved) => {
  count.set(Number(saved ?? 0));
  loaded.set(true);
});
effect(() => {
  if (loaded()) Storage.setItem("count", String(count()));
});

mount(() => (
  <View onPress={() => count.update((n) => n + 1)}>
    <Text>Pressed {count()} times</Text>
  </View>
));
```

## host

`host` alcança o app que incorpora o NSH: o app nativo em torno de um `NshAppView` / `NshView` ou, na web, a página que executa o player. O app chama as funções do host pelo nome com argumentos JSON e escuta os eventos que o host envia.

```ts
import { host } from "nsh";
```

```ts
const host: {
  readonly params: { readonly [key: string]: unknown };
  post(name: string, data?: unknown): void;
  available(): boolean;
  call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
  on(event: string, listener: (payload: unknown) => void): () => void;
};
```

### host.available

```ts
available(): boolean;
```

Indica se a plataforma tem um host que responde a chamadas. Na web, é `true` quando a página dá um host ao player ([O host na web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

Chama a função `name` do host com `args` (qualquer valor JSON; `null` sem um) e resolve com o que ela devolve. `host.call` nunca lança exceção: toda falha rejeita a promise, com um `Error` cujo `code` diz o que aconteceu (a mensagem é para pessoas e pode mudar):

| `code` | Quando |
|---|---|
| `ERR_NSH_HOST_ERROR` | A função do host falhou, ou o host não tem uma função `name`; a mensagem é a do host |
| `ERR_ACCESS_DENIED` | `name` não está na [capability `host`](#capability) do app; `permission` é `"host"`, `resource` o nome |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | A plataforma não tem host: `host.available()` é `false` |
| `ETIMEDOUT` | O host não respondeu a tempo |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 chamadas já aguardam as respostas do app que incorpora o NSH |

Um nome que não é válido (de 1 a 128 de `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`, sem `..`) rejeita com um `TypeError`.

Uma chamada espera 30 segundos pela resposta do host e depois rejeita com `ETIMEDOUT`; uma resposta que chega depois é descartada. `options.timeout` define a espera em milissegundos, `0` para nenhum limite; um timeout tão grande que o relógio nunca chega lá (cerca de 1e22 ms) também espera sem limite, e um valor negativo, `NaN` ou infinito rejeita a chamada com um `RangeError`. O tempo é o do app, como o de seus timers: em `nsh test` com um relógio manual, ele avança com o relógio.

```ts
const user = (await host.call("getUserInfo")) as { name: string };
const quote = await host.call("quote.refresh", { symbol: "AAPL" }, { timeout: 5000 }).catch((error) => {
  if (error.code === "ETIMEDOUT" || error.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") return null;
  throw error;
});
```

### host.on

```ts
on(event: string, listener: (payload: unknown) => void): () => void;
```

Eventos da plataforma chamam `listener` com o payload de cada `event` que o host envia, até que a função que `host.on` devolve seja chamada; um listener adicionado enquanto um componente renderiza é encerrado junto com o componente. Os eventos que o host envia antes de o app iniciar chegam assim que ele inicia, então os listeners registrados no nível superior do app os recebem; um evento enviado antes de um listener se registrar não é reenviado a ele. Leia o estado com o qual o app inicia por meio de `host.call` e acompanhe suas mudanças com `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### Capacidade

Toda função que o app chama deve estar listada no `capabilities.host` de `nsh.json`: nomes exatos ou prefixos terminados em `*`, ou `true` para todas. Isso vale para todo app, inclusive um sem outros `capabilities`: as funções do host nunca são concedidas por padrão. Uma chamada não concedida é rejeitada com `ERR_ACCESS_DENIED` e registrada em log, um `host.post` para um nome assim em um app hospedeiro lança o mesmo erro, e compilar um app que importa `host` de `nsh` sem `capabilities.host` gera um aviso. Eventos não precisam de concessão. Veja [Sandbox e capacidades](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### O host na web

Na web, a página é o host. A opção `host` de `createPlayer` responde às chamadas, e `player.hostEvent(event, payload)` envia eventos:

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

Um app publicado nomeia seu host em `nsh.json`: `web.host` é um módulo JS no diretório do app, relativo a `nsh.json`, que exporta `createHost(player)`, a qual retorna o objeto com `call`. `nsh package --target web` o publica junto com o site, `nsh run --target web` o executa na página de desenvolvimento, e `nsh test` o executa para os apps que seus testes abrem. `web.connect` lista os hosts que as requisições do próprio host alcançam, os quais a Content-Security-Policy da página permite junto com o `capabilities.network` do app. Veja [Web](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

Os parâmetros que o app hospedeiro definiu antes de iniciar o seu app, lidos de forma síncrona desde a primeira linha do seu código; `{}` quando ele não definiu nenhum. Eles permanecem os mesmos enquanto o app executa: pedidos posteriores chegam como eventos.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```

<a id="native-sdk-channel"></a>

### Canal do Native SDK

O `send` do Native SDK mantém os eventos até que o app escute, até 256. Quando o último listener para durante uma entrega, os eventos restantes continuam aguardando em ordem; eventos enviados durante o encerramento aguardam o próximo app carregado. `host.post(name, data)` entrega dados ao handler do Native SDK, cujo `isPost` distingue posts de chamadas.

<a id="the-embedding-apps-side"></a>

### O lado do app hospedeiro

Cada view mantém um canal para todos os apps que carrega. Defina os parâmetros antes de carregar, envie eventos a qualquer momento de qualquer thread e registre handlers por nome. Chamadas e posts exigem a concessão `capabilities.host` do app. Os handlers respondem uma vez, agora ou depois; uma resposta que nunca chega faz a chamada falhar.

```rust tabs
// Any platform's AppView (GPUI, macOS, Windows, Linux, iOS): its HostChannel.
use serde_json::json;

let host = view.host();
let mut params = serde_json::Map::new();
params.insert("conversation".into(), json!("42"));
host.set_params(params);
// Runs on the engine thread: answer at once, or move the call and answer later from any thread.
host.handle("user.profile", |call| {
    let id = call.data()["id"].clone();
    call.resolve(json!({ "id": id, "name": "Ada" }));
});
host.send("conversation.open", json!({ "id": "43" })).unwrap();
```

```swift tabs
appView.params = ["conversation": "42"]
try appView.loadBundle(at: bundleURL)

// On the main thread; return the answer, or throw to reject the call.
appView.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"]
    return ["id": id ?? NSNull(), "name": try await profiles.name(of: id)]
}
appView.handle("analytics") { data, _ in analytics.log(data) }
appView.send("conversation.open", ["id": "43"])
```

```java tabs
nsh.setParams(Map.of("conversation", "42"));
nsh.loadAssetBundle("nsh");

// On the UI thread; answer now or later, from any thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    profiles.load(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});
nsh.send("conversation.open", Map.of("id", "43"));
```

Veja [Embedding no iOS](../docs/ios.md#talking-to-the-app), [Embedding no Android](../docs/android.md#talking-to-the-app) e [GPUI](../docs/gpui.md).

> [!NOTE]
> Chamadas e posts do Native SDK usam a mesma [capacidade `host`](../docs/sandbox-and-capabilities.md#host) que as chamadas de plataforma. Um app Rust alcança o Rust do app hospedeiro diretamente, por meio das funções que ele registra ([`nativeModule`](#nativemodule) e imports Rust).

## keymap

O keymap vincula os atalhos de teclado do app: uma combinação de teclas como `"mod+k"` e a função que ela executa. O código Rust chama `on_key`, `on_key_with` e `key_label` de `nsh_core::prelude`; o TSX importa `keymap` de `nsh`. Ambos aceitam as mesmas combinações de teclas e seguem as mesmas regras.

```rust tabs
use nsh_core::prelude::*; // on_key, on_key_with, KeyOptions, key_label
```

```tsx tabs
import { keymap } from "nsh";
```

```ts
const keymap: {
  bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
  bind(bindings: Record<string, (e: { keystroke: string }) => void>, options?: KeyBindingOptions): () => void;
  label(keystroke: string): string;
};

interface KeyBindingOptions {
  when?: "always" | "notEditing";
  repeat?: boolean;
}
```

| TS | Rust |
|---|---|
| `keymap.bind(keystroke, handler)` | `on_key(keystroke, handler)` |
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)`; `when` é `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | um `on_key` por combinação de teclas |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Um vínculo em Rust vive tanto quanto o componente (o proprietário) que o criou; o handler recebe a combinação de teclas como foi escrita.

Os atalhos funcionam em macOS, Windows, Linux e em navegadores (as teclas do próprio navegador, como Ctrl+T ou Cmd+W, nunca chegam à página), e em iOS e Android com teclado físico: o de um iPad, o de um Mac executando um app de iPad, o de um tablet ou Chromebook, o do simulador e o do emulador. O mesmo código executa em todos os lugares; sem teclado, nenhuma tecla dispara os vínculos.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

Executa `handler` quando `keystroke` é pressionada e retorna uma função que remove o vínculo. O handler recebe `{ keystroke }`: a combinação de teclas como você a escreveu, com a mesma capitalização. Rust: `on_key(keystroke, handler)`, cujo handler recebe a própria combinação de teclas.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let open = signal(false);
    on_key("mod+k", move |_| open.set(true));
    on_key("escape", move |_| open.set(false));
    text(move || if open.get() { "Search…" } else { "Press ⌘K" })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(true));
keymap.bind("escape", () => open.set(false));

mount(() => <Text>{open() ? "Search…" : "Press ⌘K"}</Text>);
```

Passe um objeto para vincular várias combinações de teclas de uma vez; a função retornada remove todas. Em Rust, cada combinação de teclas é um `on_key`:

```rust tabs
on_key("mod+s", move |_| save());
on_key("mod+shift+p", move |_| open_palette());
on_key("f5", move |_| refresh());
```

```tsx tabs
const unbind = keymap.bind({
  "mod+s": save,
  "mod+shift+p": openPalette,
  f5: refresh,
});
```

Um vínculo criado enquanto um componente renderiza é removido junto com o componente, de modo que os atalhos de uma tela duram tanto quanto a tela:

```rust tabs
#[component]
fn Editor() -> impl IntoElement {
    on_key("mod+enter", move |_| send());
    input().multiline(true)
}
```

```tsx tabs
function Editor() {
  keymap.bind("mod+enter", send);
  return <Input multiline />;
}
```

Com o servidor de desenvolvimento, editar um módulo remove os vínculos criados pelo código de nível superior dele antes de executá-lo novamente, de modo que o hot reload nunca deixa atalhos obsoletos para trás.

### keymap.label

```ts
label(keystroke: string): string;
```

Retorna `keystroke` como menus e dicas o exibem onde o app executa: `"⇧⌘L"` em macOS e iOS (e em um navegador em um Mac, iPhone ou iPad), `"Ctrl+Shift+L"` em Windows, Linux e outros navegadores, para `"mod+shift+l"`. Rust: `key_label(keystroke)`. Use-o para mostrar os atalhos de um app com as teclas que funcionam:

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

Ele lança um `TypeError` para uma combinação de teclas inválida, assim como `bind`; `key_label` e `on_key` entram em panic com a mesma mensagem.

<a id="keystrokes"></a>

### Combinações de teclas

Uma combinação de teclas é formada por modificadores e uma tecla unidos por `+`: `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command e menos).

| Modificador | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (também `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (também `command`, `meta`, `super`, `win`) | Command (⌘) | Tecla Windows | Super |
| `ctrl` (também `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (também `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

O iOS segue o macOS (`mod` é Command) e o Android segue o Windows e o Linux (`mod` é Ctrl, `cmd` a tecla Meta). Em um navegador, as teclas seguem a plataforma em que o navegador executa: `mod` é Command em um Mac, iPhone ou iPad e Ctrl nos demais.

Use `mod` para os atalhos do próprio app: é a tecla que os apps de cada plataforma usam para eles (⌘K no macOS, Ctrl+K no Windows e no Linux), então uma única grafia serve para todos. A tecla Windows e Super pertencem em grande parte ao sistema, portanto `cmd` raramente é a escolha certa fora do macOS.

A tecla é uma letra, dígito ou tecla de pontuação, escrita como o caractere que ela digita em um teclado US sem Shift (`k`, `1`, `,`, `/`, `[`; `"shift+/"` para `?`, `"shift+k"` para Shift+K), ou um nome: `plus` (a tecla `=` / `+`, também escrita `=`), `minus` (também `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, as setas `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1` a `f24`. A capitalização não importa: `"Mod+Shift+K"` é `"mod+shift+k"`, e uma letra maiúscula é a mesma tecla, não Shift (`"mod+K"` é `"mod+k"`). Minúsculas são o estilo recomendado, usado nestas páginas. `"mod-k"` e `"mod++"` são erros cujas mensagens indicam a grafia correta. Os atalhos de menu em `nsh/desktop` aceitam as mesmas combinações de teclas.

Os atalhos funcionam com qualquer layout de teclado: em um layout cirílico ou grego, `mod+k` é a tecla que digita K em um layout US, assim como nos atalhos de menu.

`bind` lança um `TypeError` que diz o que há de errado com uma combinação de teclas inválida (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`) e recusa as combinações que o sistema reserva para si, de modo que um app nunca possa quebrá-las:

| Plataforma | Reservado |
|---|---|
| macOS, iOS | Cmd+Q (sair), Cmd+H (ocultar), Option+Cmd+H (ocultar outros), Cmd+M (minimizar), Ctrl+Cmd+F (tela cheia) |
| Linux, Windows, Android | Ctrl+Q (sair), Alt+F4 (fechar), F11 (tela cheia) |
| Web | Nenhum (o navegador mantém suas próprias teclas) |

<a id="while-typing"></a>

### Ao digitar

Um campo de texto com o foco do teclado precisa de suas teclas: digitar, mover o cursor, apagar, e selecionar tudo, recortar, copiar, colar, desfazer e refazer. Por isso, por padrão, um vínculo não dispara enquanto um campo de texto (ou uma web view) tem o foco se sua combinação de teclas for uma destas: teclas simples e teclas com apenas Shift ou Option, as setas, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, e `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`. As demais combinações com Command ou Control, e as teclas de função, disparam onde quer que esteja o foco.

`when` muda isso (Rust: `KeyOptions { when: When::Always, .. }`):

| `when` | Dispara |
|---|---|
| (padrão) | Como acima |
| `"always"` | Também em campos de texto, antes de o campo ver a tecla |
| `"notEditing"` | Nunca enquanto um campo de texto tem o foco |

```rust tabs
use nsh_core::keymap::When;

// Sends from the message field too.
on_key_with("mod+enter", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| send());
// Only when the user is not typing.
on_key_with("mod+e", KeyOptions { when: When::NotEditing, ..KeyOptions::default() }, move |_| archive());
```

```tsx tabs
// Sends from the message field too.
keymap.bind("mod+enter", send, { when: "always" });
// Only when the user is not typing.
keymap.bind("mod+e", archive, { when: "notEditing" });
```

No iOS e no Android, uma tecla com a qual um método de entrada está compondo (escolhendo um candidato, confirmando) continua pertencendo ao método de entrada. No backend GPUI, um componente nativo com o foco do teclado conta como um campo de texto, já que pode ser um editor de texto. Ele vê cada tecla primeiro: uma tecla que ele mesmo trata nunca chega aos vínculos, e os vínculos que disparam durante a edição de texto recebem as teclas que ele deixa passar.

<a id="which-binding-runs"></a>

### Qual vínculo é executado

Uma tecla que dispara um vínculo é consumida: ela não é digitada, o sistema não emite um sinal sonoro, e as teclas do próprio NSH não a veem (Escape voltando, Tab movendo o foco, as setas rolando). Quando vários vínculos têm a mesma combinação de teclas, executa o mais recente que pode disparar, de modo que um diálogo pode vincular Escape por cima do vínculo da tela, e o da tela volta quando o do diálogo sai. Os vínculos são verificados nativamente no instante em que a tecla é pressionada; o handler executa logo em seguida, na thread do engine (Rust) ou na thread JS (TSX).

Manter uma tecla pressionada dispara seu vínculo uma vez, até que a tecla seja solta; com `repeat: true` ele dispara novamente a cada repetição automática (para percorrer uma lista, por exemplo):

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

Os atalhos de menu cedem a um vínculo da mesma combinação de teclas: os do menu do aplicativo ([`nsh/desktop`](./nsh-desktop)) em todos os desktops e, no macOS, também os dos menus internos (Cmd+W, Cmd+C, ...). Enquanto você desenvolve com `nsh run`, Cmd+R / Ctrl+R sempre recarrega o app, mesmo que ele vincule `mod+r`; um app empacotado pode vinculá-la.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent e nativeModule

`nativeComponent` e `nativeModule` conectam seu app ao que o app hospedeiro fornece, por nome, em tempo de execução. Um app iOS ou Android que embute o NSH pode registrar suas próprias views (um mapa, um gráfico, uma prévia da câmera) por nome; `nativeComponent` dá a você um componente tipado para uma delas. Como o NSH renderiza com views nativas reais, tal componente fica na hierarquia de views como qualquer outra view: é posicionado pelo NSH, é recortado e rola junto com seus pais e se sobrepõe corretamente. Um app que embute o NSH a partir de Rust também pode registrar funções, classes e componentes Rust; `nativeModule` entrega tudo isso como um único objeto tipado. Seu app compila com o `nsh build` padrão em ambos os casos: o host conecta o que fornece quando executa o app. O código Rust posiciona uma view registrada com `native(name)` de `nsh_core::prelude`, define suas props com `.prop(name, value)` (um valor JSON, ou um signal ou closure de um), ou vincula uma a um valor animado com `.bind_prop(name, &value)`, escuta seus eventos com `.on_native_event(…)` e chama seus comandos por meio de um `ElementRef`; o TSX importa `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

Veja [Componentes nativos](../docs/native-components.md) para registrar o lado nativo, e [Embedding no iOS](../docs/ios.md) / [Embedding no Android](../docs/android.md).

### nativeComponent

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;

interface NativeComponentSpec<P, E> {
  /** Its own props: sent to the component (any JSON value), each when it changes. */
  props: readonly (keyof P & string)[];
  /** The events it emits. */
  events?: readonly (keyof E & string)[];
}
```

Retorna um componente para o componente nativo que o app hospedeiro registrou como `name` (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`). Rust: `native(name)`, uma view cujas props são valores JSON (`.prop("text", json!(…))`) e cujos eventos chegam como `NativeEvent { name, data }`.

- `P` é o tipo das suas próprias props. Cada prop listada em `spec.props` é enviada ao lado nativo como JSON quando muda; defini-la como `undefined` a remove.
- `E` mapeia nomes de eventos para seus payloads. Um evento `regionChange` vira a prop de handler `onRegionChange`.
- O componente também aceita todas as [props de view](../elements/view.md) exceto `children`: `style`, `class`, layout, acessibilidade, handlers de toque e `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### Tamanho

O componente é posicionado como uma view, no tamanho que seu estilo lhe dá. Onde o estilo deixa uma dimensão em aberto, ele usa o tamanho que o componente nativo informa (como uma imagem usa seu tamanho natural).

<a id="commands"></a>

#### Comandos

Seu `ref` recebe um `NativeComponentRef`; `ref.command(name, args)` chama o comando `name` do componente nativo com `args` (qualquer valor JSON). Rust: `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### Quando nada está registrado

Onde nada está registrado sob `name` (outro app hospedeiro, o host de desenvolvimento, o navegador), o componente renderiza uma view vazia e um aviso é registrado uma vez. Mantenha o app utilizável sem ele, ou verifique seu host antes de usá-lo.

<a id="example"></a>

### Exemplo

O badge aqui é uma view nativa do app hospedeiro, registrada como `embed.badge`. O NSH o posiciona, envia a ele `text` e `color`, recebe seus eventos `tap` e chama seu comando `pulse`:

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p_5()
        .gap_4()
        .child(
            native("embed.badge")
                .prop("text", json!("Tap the native badge"))
                .prop("color", json!("#8250df"))
                .element_ref(&badge)
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Tapped {}×", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, View } from "nsh";
import { nativeComponent } from "nsh";

const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", gap: 16 }}>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color="#8250df"
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
    </View>
  );
}

mount(App);
```
### nativeModule

```ts
function nativeModule<T extends object>(specifier: string): T;
```

Retorna as exportações do conjunto que o app host registrou como `specifier`: seus módulos, classes, funções e componentes Rust, em um único objeto. O app escreve o tipo `T` por conta própria, então nada sobre o host é necessário ao compilá-lo. O código Rust compilado junto com o crate do host chama essas funções como Rust; `nativeModule` é como o TSX chega até elas.

```ts
import { nativeModule, signal } from "nsh";

interface TradingApi {
  quote(symbol: string): number;
  placeOrder(symbol: string, quantity: number, side: "Buy" | "Sell"): Promise<Order>;
  on(event: "change", listener: (desk: Desk) => void): () => void;
}

const { Trading } = nativeModule<{ Trading: TradingApi }>("host/trading");

const price = Trading.quote("AAPL");

const desk = signal<Desk | null>(null);
Trading.on("change", (d) => desk.set(d));
```

- As chamadas funcionam como em um import de um conjunto: uma função Rust simples retorna seu valor imediatamente, uma função `async` retorna uma promise, e uma função que você passa é um callback que o Rust pode chamar depois. O Rust verifica cada argumento e lança um `TypeError` quando um argumento é inválido.
- Cada chamada com o mesmo `specifier` retorna o mesmo objeto.
- Quando nada está registrado em `specifier`, `nativeModule` lança um `ReferenceError` que o nomeia. Chame-a onde o app possa tratar o erro, ou apenas no host para o qual ela foi criada.

O host registra o conjunto a partir do Rust, com o `set_ui_sets` do crate da plataforma (junto aos conjuntos do próprio NSH) antes de iniciar suas views, ou `EngineConfig::ui_sets`:

```rust
use std::{cell::RefCell, rc::Rc};

use nsh_core::prelude::*;

pub struct Trading;

#[module]
impl Trading {
    /// A sample price.
    pub fn quote(symbol: String) -> Result<f64, String> { /* ... */ }

    /// Calls `listener` with the desk now and after every change
    /// (`change`, the one event), until the returned function is called
    /// or what called `on` goes.
    pub fn on(event: String, listener: Callback<Desk>, cx: CallCx<'_>) -> Result<Stop, String> {
        if event != "change" {
            return Err(format!("no Trading event `{event}`"));
        }
        let listener = Rc::new(RefCell::new(Some(listener)));
        let held = listener.clone();
        cx.start(async move {
            let mut desk = DESK.subscribe(); // a tokio watch channel the host keeps
            loop {
                let Some(listener) = held.borrow().clone() else { return };
                listener.post(desk.borrow_and_update().clone());
                if desk.changed().await.is_err() {
                    return;
                }
            }
        });
        Ok(Stop::new(move || drop(listener.take())))
    }
}

let mut trading = Registry::ui_set("host/trading");
trading.module::<Trading>();
nsh_platform_gpui::set_ui_sets(vec![nsh_base::registry(), trading]);
```

`on` é como o host mantém todos os apps em sincronia com seus próprios dados: a tarefa que ele inicia aguarda as mudanças do host e envia cada uma ao app, de modo que uma mudança feita pelo host, ou por qualquer app por meio de outra função, chega a todos os apps que estão escutando. O `Stop` que ele retorna é a função que `Trading.on` retorna no TSX: ela é executada uma vez, quando o app a chama ou quando aquilo que chamou `on` termina (um componente, ou a execução do módulo sob hot reload), e aqui remove o listener, encerrando a tarefa.

> [!NOTE]
> Props, eventos e argumentos de comandos chegam ao lado nativo como JSON. Componentes e funções registrados são código do próprio app host: os [limites e capacidades do sandbox](../docs/sandbox-and-capabilities.md) do NSH não se aplicam ao que eles fazem.

<a id="accessibility"></a>

## Acessibilidade

A API de acessibilidade lê as configurações de acessibilidade do usuário (se um leitor de tela está em execução, se ele pediu menos movimento) e se comunica com o leitor de tela. O código Rust chama `screen_reader()`, `reduce_motion()` e `announce_for_accessibility()` a partir de `nsh_core::prelude` e move o foco com um `ElementRef`; o TSX importa `screenReaderEnabled()`, `reduceMotion()`, `announce()` e `setAccessibilityFocus()` de `nsh`. As configurações são reativas: leia-as em um binding, `computed` ou `effect`, e o que as lê é atualizado quando o usuário as altera. As props de acessibilidade dos elementos (`accessibilityLabel`, `role`, ...) estão documentadas em [Elementos](../elements/index.md); o guia é [Acessibilidade](../docs/accessibility.md).

```rust tabs
use nsh_core::prelude::*; // screen_reader, reduce_motion, announce_for_accessibility, element_ref
```

```tsx tabs
import { announce, reduceMotion, screenReaderEnabled, setAccessibilityFocus } from "nsh";
```

### screenReaderEnabled

```ts
const screenReaderEnabled: Accessor<boolean>;
```

Indica se um leitor de tela (VoiceOver, TalkBack) está em execução. Reativo: o que o lê é atualizado quando o usuário liga ou desliga o leitor de tela. Rust: `screen_reader() -> bool`, reativo da mesma forma.

```rust tabs
when(move || !screen_reader(), || text("Swipe for the next photo"))
    .otherwise(move || text("Next photo").on_press(next))
```

```tsx tabs
<If when={!screenReaderEnabled()} else={<Text onPress={next}>Next photo</Text>}>
  <Text>Swipe for the next photo</Text>
</If>
```

### reduceMotion

```ts
const reduceMotion: Accessor<boolean>;
```

Indica se o usuário pediu menos movimento (Reduzir Movimento no iOS, Remover animações no Android). Reativo. Rust: `reduce_motion() -> bool`. As classes do Tailwind também o seguem, com a variante `motion-reduce:`.

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        let _ = panel.spring(0.0, Spring::default());
    }
};
```

```tsx tabs
const open = () => {
  if (reduceMotion()) panel.set(0);
  else panel.spring(0);
};
```

### announce

```ts
function announce(message: string): void;
```

O leitor de tela lê `message` (um anúncio do VoiceOver, do TalkBack). Use para resultados que aparecem sem que o foco se mova, como "Salvo". Rust: `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Move o foco do leitor de tela para `node` (o `ref` de um elemento). Rust: `ElementRef::set_accessibility_focus()`.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Saved() -> impl IntoElement {
    let note = element_ref();
    let save = move || {
        announce_for_accessibility("Saved");
        note.set_accessibility_focus();
    };
    // Runs again when the setting changes, until the component goes.
    effect(|| log::info!("screen reader {}", screen_reader()));
    view()
        .gap_2()
        .child(text("Save").role(AccessibilityRole::Button).on_press(save))
        .child(text("Your changes are kept on this device.").element_ref(&note))
}
```

```tsx tabs
import { effect, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Saved() {
  let note!: ViewRef;
  const save = () => {
    announce("Saved");
    setAccessibilityFocus(note);
  };
  // Runs again when the setting changes, until the component goes.
  effect(() => console.log("screen reader", screenReaderEnabled()));
  return (
    <View style={{ gap: 8 }}>
      <Text onPress={save} role="button">Save</Text>
      <Text ref={note}>Your changes are kept on this device.</Text>
    </View>
  );
}
```

<a id="types"></a>

## Tipos

`nsh` também exporta os tipos da API reativa e dos elementos host. Os mais usados:

| Tipo | O que é |
|---|---|
| `Accessor<T>` | Um valor legível: `() => T` |
| `Signal<T>` | Um `Accessor<T>` com `set` e `update` |
| `SignalOptions<T>` | Opções de `signal` e `computed` (`equals`) |
| `Context<T>` | O que `context` retorna |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | O namespace JSX (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | O que um `ref` recebe, o tipo próprio de cada elemento (`ViewRef` e os tipos sobre ele): foco, rolagem e outros comandos. `ViewRef` também é o que um elemento é (`JSX.Element`). Veja [métodos de ref](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | Props dos elementos host |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Objetos de estilo; veja a [referência de estilos](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | Valores dentro de estilos |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Payloads de eventos |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | Os formatos de que são feitos os payloads e as props, com os campos do GPUI (`nsh_core::geometry`) |
| `PixelSize` | O tamanho próprio de uma imagem ou de um vídeo em pixels (`onLoad`, `Image.getSize`, as imagens da área de transferência e do seletor), em que `Size` é em pontos |
| `ImageAsset` | O que a importação de um arquivo de imagem retorna (`{ url, size: Size, scales? }`; `scales` lista suas [variantes de densidade de pixels](../docs/images-and-assets.md#pixel-densities)) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Props de acessibilidade |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` aceita um estilo ou uma lista mesclada da esquerda para a direita, ignorando entradas falsy:

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
