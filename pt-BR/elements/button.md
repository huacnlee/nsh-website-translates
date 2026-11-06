---
title: "Button"
description: "O componente Button: um alvo de toque que gerencia toques, os estados desabilitado e selecionado e seu papel para leitores de tela, estilizado pelo app."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---


# Button

Um botão é um alvo de pressão. Ele é responsável pelo comportamento: pressões, feedback de pressão por meio dos estilos de estado do app, os estados desabilitado e selecionado, foco do teclado e seu papel para leitores de tela. A aparência é do app: um `Button` não tem cores, tamanhos, preenchimentos nem rótulo próprios, então um mesmo componente se torna um botão primário, um botão de ícone, uma aba, um toggle de barra de ferramentas ou a linha de uma lista, dependendo dos estilos e dos filhos que você fornecer.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em TSX, sua aparência é definida por `class` e
`style`, com as variantes de estado `active:`, `hover:`, `focus:`, `selected:` e `disabled:` (ou os equivalentes
`activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` e `disabledStyle`). Em Rust, `button()` cria um botão como
`view()` cria uma view: um setter por prop (`.disabled(..)`, `.selected(..)`), um listener por evento (`.on_press(..)`),
os métodos de estilo tipados (`.px_4()`, `.bg(..)`) para a aparência, os métodos de estado (`.active(..)`, `.hover(..)`,
`.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) para os estados e `.child(..)` para o conteúdo.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem pressões e sem feedback de pressão; os estilos `disabled:` se aplicam e os leitores de tela informam que o botão está esmaecido. |
| `selected` | `.selected(..)` | `boolean` | `false` | Selecionado: um toggle ligado, a aba atual. Os leitores de tela informam isso. O app é responsável pelo valor e pela estilização. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nenhum | O estilo enquanto `selected` e não desabilitado, como classes `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem quando o conteúdo não basta, como em um ícone. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | O que o botão é para os leitores de tela quando nenhum componente `nsh/base` representa esse controle: `"link"` (abre uma URL), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nenhum | Até que distância fora de seus limites as pressões ainda contam, em pontos: um número para todos os lados, ou os lados nomeados. Como o `hitSlop` de uma view. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo: texto, um ícone, qualquer layout. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | Toda a sua aparência. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo enquanto pressionado, com hover, com foco ou desabilitado, como as classes `<state>:`. Os estados posteriores prevalecem; `disabled` prevalece sobre todos. |

Em Rust, cada prop é um setter que recebe um valor, um signal ou uma closure; as props omitidas mantêm seus valores padrão:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | O botão foi pressionado: um toque, um clique, Return ou Space enquanto ele tem o foco do teclado, ou a ativação por um leitor de tela. |
| `onPressDown` | `.on_press_down(\|\| ..)` | Uma pressão começou sobre ele. |
| `onPressUp` | `.on_press_up(\|\| ..)` | A pressão terminou: foi solta, saiu de cima do botão ou foi cancelada. |

`onPressDown` e `onPressUp` servem para um feedback de pressão próprio, como uma animação de mola ou um destaque que os estilos
de estado não expressam. Um botão desabilitado não reporta nenhum deles.

<a id="styling"></a>

## Estilização

A aparência de um botão é do seu app: é o app que decide o que é um botão primário ou secundário. Um par de pequenos componentes mantém
essa decisão em um só lugar:

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

As variantes de estado são aplicadas nativamente: uma pressão escurece o botão na thread principal, sem executar JS nem Rust.
Em Rust, os métodos de estado são as mesmas variantes: `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` e
`.disabled_style(..)` acompanham os estados do próprio botão. As cores do seu tema funcionam da mesma forma: `bg-primary` em TSX,
`theme().primary` em Rust (veja [Theme tokens](../docs/tailwind.md#theme-tokens)).

<a id="disabled"></a>

## Desabilitado

Um botão desabilitado não recebe pressões e não dá feedback, e os leitores de tela o anunciam como esmaecido. A aparência dele
quando desabilitado fica a seu critério, com classes `disabled:` ou `disabledStyle`:

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## Um toggle com selected

`selected` transforma um botão em um toggle: o botão de negrito de uma barra de ferramentas, um chip de filtro, a aba atual. O app mantém o valor,
o alterna em `onPress` e estiliza o estado selecionado; os leitores de tela anunciam o botão como selecionado.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

Uma linha de abas é [`Tabs`](./tabs.md) e um controle de ligado / desligado é [`Switch`](./switch.md), de `nsh/base`: eles cuidam do papel, do estado selecionado e do teclado do seu tipo, o que um `Button` com `role="tab"` ou `role="switch"` não faz.

<a id="a-small-target-with-hitslop"></a>

## Um alvo pequeno com hitSlop

Um botão de ícone pode ser menor que um dedo. `hitSlop` faz com que pressões que caem perto dele contem, em pontos além de cada lado,
sem alterar seu layout nem sua aparência: um número para todos os lados, ou os lados nomeados (`{ top: 8, bottom: 8 }`), como
o [`hitSlop` de uma view](./index.md#presses-and-feedback) os recebe.

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## Acessibilidade

- Um botão é um único elemento para os leitores de tela, com o papel `"button"`, a menos que `role` diga outra coisa. Seu rótulo é o
  conteúdo de texto; forneça `accessibilityLabel` quando o conteúdo for um ícone ou disser pouco.
- `disabled` e `selected` são anunciados como a plataforma os anuncia (VoiceOver, TalkBack, UI Automation, a
  árvore de acessibilidade do navegador).
- No macOS e na web, um botão é uma parada do foco do teclado: Tab chega até ele, Return e Space o pressionam, e
  os estilos `focus:` mostram onde está o foco.

Veja [Accessibility](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: uma pressão é um toque que termina sobre o botão; sair de cima dele a cancela, como nos
  botões do próprio sistema.
- Desktops (macOS, Windows, Linux, GPUI) e web: uma pressão é um clique. No macOS e na web, Return e Space também
  pressionam o botão que tem o foco do teclado. Os estilos `hover:` se aplicam sob o ponteiro de um mouse ou trackpad.
- Toda plataforma desenha o que o app estiliza: o feedback de pressão é `active:` / `activeStyle` ou uma animação sua.
