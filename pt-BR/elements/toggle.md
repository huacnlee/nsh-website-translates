---
title: "Toggle"
description: "Toggle e ToggleGroup: um botão que fica ligado ou desligado, e uma barra de ferramentas com vários deles. Cada Toggle cuida dos pressionamentos, da ativação pelo teclado, do estado desabilitado e do seu papel e estado pressionado para leitores de tela; o grupo é uma barra de ferramentas com uma única parada no foco do teclado; a aparência e quais toggles estão pressionados ficam a cargo do app."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---


# Toggle

Um toggle é um botão que fica ligado ou desligado: negrito em uma barra de ferramentas de texto, uma estrela de favorito, uma opção de visualização. `Toggle` cuida do comportamento de um toggle: pressionamentos, ativação pelo teclado, o estado desabilitado e o papel de botão com seu estado pressionado para leitores de tela, que o anunciam como botão de alternância. Um `ToggleGroup` em volta de vários toggles é uma barra de ferramentas: leitores de tela a anunciam como tal, e o teclado a alcança em uma única parada e se move entre seus toggles com as setas. A aparência é do app: um toggle não tem cores, tamanhos, ícone ou rótulo próprios. Seus filhos são o ícone ou o rótulo do app, e as classes `aria-pressed:` no toggle, ou as classes `group-aria-pressed:` no que está dentro dele, acompanham seu estado.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` e `ToggleGroup` vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. O valor é do app: cada toggle recebe a informação de se está pressionado, um pressionamento informa o valor que pede com `onChange`, e o toggle mostra o `pressed` que o app devolve. O grupo também não guarda valor, então quantos toggles podem ficar pressionados também é decisão do app: qualquer quantidade (negrito, itálico e sublinhado) ou exatamente um (um alinhamento, um alternador de visualização), caso em que o app pressiona o toggle solicitado, solta os outros e mantém o pressionado pressionado. Em Rust, `toggle()` e `toggle_group()` os criam, com um setter por prop (`.pressed(..)`), um listener por evento (`.on_change(..)`), os métodos de estilo tipados e `.child(..)` para o conteúdo.

## Props

### Toggle

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | Ligado ou desligado: leitores de tela dizem que está pressionado, e os estilos `aria-pressed:` se aplicam. Um pressionamento informa o outro valor com `onChange`; o toggle mostra o valor que o app devolve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem pressionamentos e sem feedback de pressão; os estilos `disabled:` se aplicam, e leitores de tela dizem que está esmaecido. Um toggle em um `ToggleGroup` desabilitado também fica desabilitado. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do toggle enquanto está pressionado e não desabilitado, como classes `aria-pressed:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que leitores de tela dizem: o que o toggle liga, quando seus filhos não têm texto que diga isso (um ícone). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nenhum | Até onde, fora de seus limites, os pressionamentos ainda contam, em pontos: um número para todos os lados, ou os lados nomeados. Como o `hitSlop` de uma view. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O ícone ou rótulo do app, que os leitores de tela leem. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio toggle: a superfície em volta do conteúdo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do toggle enquanto um pressionamento está em andamento, com o ponteiro sobre ele, com foco ou desabilitado, como as classes `<state>:`. |

### ToggleGroup

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos os toggles do grupo ficam desabilitados, independentemente de seu próprio `disabled`. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os toggles do grupo e o que o app dispuser entre eles (um separador). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O layout e a aparência do grupo: uma coluna por padrão, `flex-row` para uma linha. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | O toggle foi pressionado: um toque, um clique, Espaço ou Return enquanto ele tem o foco do teclado, ou a ativação por um leitor de tela. `{ pressed }` é o valor que ele pede, o oposto de `pressed`. Roda antes de qualquer mudança: o toggle mostra o `pressed` que o app devolve. |

Uma tecla de seta de um `ToggleGroup` apenas move o foco do teclado: não pressiona nada. Um toggle desabilitado não informa nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| O grupo | | `class`, `style` de `ToggleGroup` | |
| O toggle | o grupo, ou qualquer lugar | `class`, `style` de `Toggle` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `pressedStyle`, `disabledStyle`, ...) |
| O ícone ou rótulo | o toggle | seus próprios elementos (`children`) | `group-aria-pressed:`, `group-disabled:` e as outras variantes `group-*:` com `group` no `class` do toggle |

`aria-pressed:` é o toggle estar ligado; `active:` é um pressionamento em andamento, ligado ou desligado. Mostre um toggle pressionado pela própria superfície dele: um preenchimento, uma pílula elevada, um ícone mais forte (veja [Guias de design](../docs/design-guides.md#interaction-states)).

<a id="segmented"></a>

## Segmentado

Um grupo cujos toggles são unidos, com um pressionado por vez, é um controle segmentado (um alternador de visualização): o app mantém um valor e pressiona o toggle que o nomeia. A aparência unida são as classes do app:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

<a id="disabled"></a>

## Desabilitado

Um toggle desabilitado não aceita pressionamentos, e leitores de tela o anunciam como esmaecido. Suas classes `disabled:` se aplicam sobre as `aria-pressed:`, e as classes `group-disabled:` dentro dele as acompanham. `disabled` em um `ToggleGroup` desabilita todos os toggles dentro dele, uma barra de ferramentas que o app trava:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## Um alvo pequeno com hitSlop

Um toggle de ícone pode ser menor que um dedo. `hitSlop` faz com que pressionamentos que caem perto dele contem, em pontos além de cada lado, sem mudar seu layout nem sua aparência: um número para todos os lados, ou os lados nomeados (`{ top: 8, bottom: 8 }`), como o [`hitSlop` de uma view](./index.md#presses-and-feedback) os recebe.

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## Acessibilidade

- Um toggle é um único elemento para leitores de tela, com o papel `"button"` e seu estado pressionado: um botão de alternância. Seu rótulo é o texto de seus filhos, ou `accessibilityLabel`.
- `ToggleGroup` tem o papel `"toolbar"`: leitores de tela ouvem os toggles dentro dele como uma única barra de ferramentas, cada um ainda como um elemento próprio.
- `disabled` é anunciado como a plataforma o anuncia (VoiceOver, TalkBack, UI Automation, a árvore de acessibilidade do navegador).
- No macOS e na web, o grupo é uma única parada do foco do teclado, e as setas se movem entre seus toggles (abaixo).

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

No macOS e na web, onde Tab alcança as views que aceitam pressionamentos, um `ToggleGroup` segue o [padrão de barra de ferramentas do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Tecla | O que faz |
|---|---|
| Tab, Shift+Tab | Entra no grupo pelo primeiro toggle pressionado (se nenhum estiver pressionado, pelo primeiro toggle que não esteja desabilitado) e sai dele em um único passo. |
| Direita, Baixo | Move o foco para o próximo toggle, do último para o primeiro. |
| Esquerda, Cima | Move o foco para o toggle anterior, do primeiro para o último. |
| Home, End | Move o foco para o primeiro ou para o último toggle. |
| Espaço, Return | Pressiona o toggle com foco. |

As setas ignoram toggles desabilitados e não pressionam nada: um toggle só muda quando é pressionado. Os dois pares de setas movem o foco, qualquer que seja o layout do grupo, que é uma classe do app. Em um layout da direita para a esquerda, Esquerda e Direita trocam de lugar: Esquerda move para o próximo toggle e Direita para o anterior; Cima, Baixo, Home e End mantêm o seu comportamento. Os estilos `focus:` mostram onde está o foco. Um `Toggle` fora de um `ToggleGroup` é uma parada própria.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um pressionamento é um toque que termina sobre o toggle, incluindo seu conteúdo.
- Desktops (macOS, Windows, Linux, GPUI) e web: um pressionamento é um clique. No macOS e na web, Espaço e Return também pressionam o toggle que tem o foco do teclado, e as setas, Home e End o movem ([Teclado](#keyboard)).
- Todas as plataformas desenham o que o app estiliza: os toggles, a superfície dos pressionados e a trilha do grupo.
