---
title: "Dialog"
description: "O componente Dialog: uma superfície modal sobre todo o resto, para fluxos em tela cheia, sheets e diálogos estilizados pelo app."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---


# Dialog

A diálogo apresenta conteúdo sobre o restante do app em sua própria camada de janela nativa: um view controller apresentado no iOS e no Mac Catalyst, um Dialog no Android, uma camada sobre a janela inteira nos desktops e na web. É usado para fluxos em tela cheia, sheets e caixas de diálogo. Os gestos do próprio sistema (deslizar um sheet para baixo, o botão Voltar do Android, Escape) funcionam e são decididos nativamente. Em Rust, cria-se um com `nsh_base::dialog()`; em TSX, com `<Dialog>` de `nsh/base`.

O diálogo é dono do seu comportamento e deixa a aparência a cargo do app: seus estilos estilizam o popup (a view que contém os filhos), e em TSX `backdropClass` / `backdropStyle` adicionam um backdrop atrás dele.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

Em TSX, o diálogo é exibido enquanto `open` não for `false` e fechado quando se torna `false`. Em Rust, ele é apresentado enquanto estiver na view e dispensado quando sai dela, de modo que `when` o mantém. Em ambos os casos, ele entrega ao seu conteúdo os insets de área segura do diálogo, que as variáveis [`env(safe-area-inset-*)`](./safe-area.md) e `safeAreaInsets()` (`cx.insets()` em um componente Rust) lidas dentro dele refletem. [`Button`](./button.md), também de `nsh/base`, é um alvo de toque estilizado pelo app.

`nsh_core::prelude` também tem uma função `dialog` mais antiga, obsoleta: importe `nsh_base::dialog` pelo nome, como acima, e o import explícito toma o seu lugar. Para o alerta ou action sheet do sistema, use [`AlertDialog`](./alert-dialog.md).

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `open` | na view enquanto aberto (`when(open, ..)`) | `boolean` | `true` | Exibido enquanto for true. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | Como ele entra e sai. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | nenhum | Ele entra e sai por meio de um shader WGSL no lugar do seu `animation`: `shade(uv)` lê o que está atrás como `sample_from` e o diálogo como `sample_to` enquanto `nsh.progress` vai de 0 a 1 ao longo de `duration` milissegundos (350 por padrão), e de 1 de volta a 0 ao fechar. Quando o sistema pede menos movimento, ele usa o seu próprio `animation`. Veja [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | Sua forma no iOS: `fullScreen` cobre a tela com um fundo transparente; `pageSheet` e `formSheet` são sheets do sistema que mantêm visível o que está atrás (`formSheet` é um sheet menor e centralizado em telas grandes). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape e o botão Voltar do Android o fecham nativamente. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Um toque no backdrop o fecha. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | Deslizar um sheet para baixo (iOS, navegadores de celular) o fecha nativamente. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | nenhum | iOS e Android: a barra de status enquanto o diálogo está aberto, sobrepondo a das páginas ([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | Terminou de aparecer. |
| `onClose` | `.on_close(..)` | `() => void` | | Foi embora: o usuário o fechou ou o app o removeu. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | O usuário tentou fechá-lo (Escape, Voltar, um toque no backdrop, um deslize para baixo), quer uma flag `closeOn*` o tenha deixado fechar ou não. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | O usuário o fechou: mantenha `open` sincronizado aqui. Em Rust, `on_cancel` remove o diálogo da view. |
| `class`, `style` | métodos `Styled` | `string`, `StyleProp<ViewStyle>` | | O popup: a view que contém os filhos. |
| `backdropClass`, `backdropStyle` | uma view filha que preenche o diálogo | `string`, `StyleProp<ViewStyle>` | | Um backdrop que preenche o diálogo atrás do popup, presente quando qualquer um dos dois é definido. |
| `children` | `.child(..)` | `JSX.Element` | | O conteúdo. |

| Chave `ios` | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | a do apresentador | As orientações que o diálogo permite. |

| Chave `android` | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | O conteúdo alcança a área sob a barra de status; caso contrário, começa abaixo dela. |

<a id="opening-and-closing"></a>

## Abertura e fechamento

O estado do diálogo pertence ao app. Quando o usuário fecha o diálogo (Escape, o botão Voltar do Android, um toque no backdrop, um sheet deslizado para baixo), ele fecha nativamente e avisa o app, que ajusta o seu estado para corresponder: `onOpenChange({ open: false, reason })` em TSX, `on_cancel` em Rust. Em TSX, enquanto `open` permanecer `true`, o diálogo permanece fechado, e ele abre novamente quando `open` passa de `false` para `true`.

Cada flag `closeOn*` é lida nativamente quando o usuário age, já que a thread principal nunca espera pelo código do app. Para confirmar antes de fechar, defina as flags como `false`: a tentativa então chama `onCancel`, e o app fecha o diálogo por conta própria (em TSX definindo `open` como `false`, em Rust retirando-o da view):

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel` é chamado a cada tentativa, quer as flags deixem o diálogo fechar ou não.

<a id="a-dialog-with-a-backdrop"></a>

## Um diálogo com backdrop

Um diálogo com a apresentação `fullScreen` padrão exibe o que o app desenha: aqui, um backdrop escurecido e um card centralizado sobre ele. Um toque no backdrop o fecha:

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

Para o alerta ou action sheet do sistema, use [`AlertDialog`](./alert-dialog.md) de `nsh/base`.

<a id="ref-methods"></a>

## Métodos de ref

Nenhum.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS e Mac Catalyst: `presentation` escolhe a forma. `fullScreen` apresenta sobre a tela inteira com um fundo transparente; `pageSheet` e `formSheet` são sheets do sistema com o fundo do sistema, que acompanham o dedo ao serem deslizados para baixo (`closeOnSwipe`).
- Android: o diálogo preenche a janela e exibe o popup e o backdrop do app. O botão Voltar vai primeiro para o diálogo mais acima, antes das pilhas e dos listeners de `BackHandler`.
- Desktops (macOS, Windows, Linux, GPUI) e web: o diálogo é uma camada transparente sobre a janela inteira que exibe o popup e o backdrop do app. Escape é uma tentativa de fechar.
- `supportedOrientations` é do iOS; `statusBarTranslucent` é do Android. O conteúdo de um diálogo no Android começa abaixo da barra de status, a menos que `statusBarTranslucent` esteja definido.
