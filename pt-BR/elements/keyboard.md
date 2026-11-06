---
title: "Teclado"
description: "A variável de ambiente keyboard-inset-height, Keyboard.dismiss e a altura do teclado: conteúdo mantido acima do teclado virtual, movendo-se junto com ele."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---


# Teclado

`env(keyboard-inset-height)` é a altura do teclado virtual sobre a superfície, e vale 0 enquanto ele está oculto. Usada como padding ou margin inferior de uma view, ela mantém o conteúdo acima do teclado: quando o teclado aparece ou some, a view abre espaço com a altura dele, e a mudança é animada junto com o teclado, de forma nativa. Use-a para conteúdo fora de scroll views, como uma barra de mensagem na parte inferior de uma tela de chat; inputs dentro de uma [scroll view](./scroll.md) ou de uma [List](./list.md) são roladas até ficarem visíveis de forma nativa. Junto com ela vêm `Keyboard.dismiss()`, que oculta o teclado, e a altura do teclado, para layouts próprios.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

A altura total do teclado serve para uma view que chega até a parte inferior da tela, como o conteúdo de uma tela. Quando há algo abaixo dela, como uma tab bar, subtraia esse valor com um comprimento: `calc(env(keyboard-inset-height) + -49px)` mantém uma view acima de uma tab bar de 49 pt, e `calc(env(keyboard-inset-height) + 12px)` adiciona um espaçamento acima do teclado. Um padding é no mínimo 0.

<a id="padding-or-margin"></a>

## Padding ou margin

| Estilo | Como abre espaço |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | O conteúdo acima encolhe; o fundo continua chegando à parte inferior da tela. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | A view inteira, incluindo o fundo, termina no topo do teclado. |

A altura do teclado é somada ao comprimento apenas dentro da mesma declaração, de modo que uma view a combina com espaçamento próprio em `calc()`. Em Rust, `.pb_keyboard_plus(px(..))` e `.mb_keyboard_plus(px(..))` adicionam um comprimento.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

Aqui, uma tab bar de 49 pt abaixo da view já cobre parte da altura do teclado. Para desativar o espaço, deixe a variável fora do estilo, por exemplo com uma condição sobre um signal.

<a id="hiding-the-keyboard"></a>

## Ocultando o teclado

`Keyboard.dismiss()`, de `nsh`, remove o foco do input focado, o que oculta o teclado. Sem nenhum input focado, ele não altera nada. Componentes Rust chamam `dismiss_keyboard()`.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> Para ocultar o teclado quando o usuário arrasta uma scroll view, defina `keyboardDismissMode="on-drag"` ou `"interactive"` na [scroll view](./scroll.md) ou na [List](./list.md).

<a id="the-keyboards-height"></a>

## A altura do teclado

| TSX | Rust | Retorna |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | A altura do teclado virtual sobre a superfície do NSH, em pontos (0 enquanto ele está oculto), e a duração da animação de exibição ou ocultação dele, em milissegundos. |

Ambos são reativos: um effect, uma expressão JSX ou uma closure de estilo que os lê é executado novamente quando o teclado aparece, some ou muda de altura.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

A altura é a parte do teclado que se sobrepõe à superfície do NSH. Quando a própria janela encolhe por causa do teclado (uma activity do Android que se redimensiona), ou quando o NSH está embutido em uma view que termina acima do teclado, a altura é 0.

> [!NOTE]
> Para manter o conteúdo acima do teclado, `env(keyboard-inset-height)` é a forma mais simples: ele anima junto com o teclado, de forma nativa, sem executar código.

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: o espaço é animado com a duração própria do teclado e uma curva ease-in-ease-out.
- **Android**: onde a janela encolhe por causa do teclado (uma activity que se redimensiona), o conteúdo já termina acima do teclado e a variável vale 0. Onde o teclado se sobrepõe à view, ela abre espaço como no iOS.
- **Desktops e Mac Catalyst** usam teclado físico para digitar: a variável vale 0 e a view mantém o layout.
- **Web**: a variável é a do próprio navegador (a da VirtualKeyboard API).

Veja [Formulários e teclado](../docs/forms-and-keyboard.md) para ordem de foco, teclas de retorno e acessórios de input, e [Safe area](./safe-area.md) para as demais variáveis de ambiente.
