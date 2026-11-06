---
title: "View"
description: "O elemento de contêiner básico: layout, planos de fundo, bordas, sombras, tratamento de toques e gestos."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---


# View

`View` é o bloco de construção de toda tela: um contêiner nativo (uma UIView no iOS e no Mac Catalyst, um ViewGroup no
Android) que organiza seus filhos com flexbox ou grid, desenha um plano de fundo, bordas, sombras e gradientes, e trata
pressionamentos. Botões, cards, linhas e telas são todos views. Rust cria uma com `view()`, TSX com `<View>` de `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

## Layout

Uma view organiza seus filhos com flexbox, com estes padrões: `flexDirection: "column"`, `flexShrink: 0`,
`alignContent: "flex-start"`, `position: "relative"`. `display: "grid"` (`.grid()` em Rust) muda para CSS grid e
`display: "block"` para layout em bloco. Os tamanhos são em pontos. Veja [layout](../docs/layout.md) e a
[referência de estilos](../modules/style-reference.md).

`display: "flex"` segue o CSS: em um estilo, como a classe `flex` e o `.flex()` do Rust, é uma linha, a menos que uma direção seja
definida (`flexDirection: "column"`, `flex-col`, `.flex_col()`). Uma view que não define display empilha seus filhos em uma coluna.

## Props

`View` tem uma prop própria, `selectable` (`.selectable(true)` em Rust): os textos dentro da view são selecionados juntos, como uma única seleção ([Seleção de texto](./text-selection.md)). As demais são as [props comuns](./index.md#common-props): seus estilos (`style`, `class`,
`classList`; os métodos de `Styled` em Rust), `disabled`, as props de pressionamento (`onPress`, `onLongPress`, `onPressDown`,
`onPressUp`, `delayLongPress`, `hitSlop`), os estilos de estado (`activeStyle`, `hoverStyle`,
`focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`,
`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, as
props de gestos (`pan`, `pinch`, `rotation` e seus eventos), as props de toque e de responder, as props de acessibilidade
e `ios` / `android` / `desktop`.

<a id="selectable-views"></a>

## Views selecionáveis

Com `selectable`, uma seleção percorre os elementos [`Text`](./text.md) e os [`TextView`](./text-view.md)s dentro
da view, na ordem de leitura; textos com `selectable={false}` ficam de fora, e uma view selecionável dentro de outra faz parte
da externa. Veja [Seleção de texto](./text-selection.md) para os gestos em cada plataforma.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## Feedback de pressionamento

Uma view pressionável é qualquer view com um handler de pressionamento. O feedback é do app: um estilo enquanto está pressionada, aplicado nativamente
enquanto o dedo está apoiado, sem ida e volta ao código do app. `hoverStyle`, `focusStyle` e `disabledStyle` fazem o
mesmo para os outros estados:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

No Android, `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` em Rust) adiciona o efeito ripple
do material (`borderless`, `radius` e `foreground` o ajustam).

`disabled` remove os listeners de pressionamento da view nativa (sem pressionamento, sem feedback) e aplica os estilos de desabilitado:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (nenhum em Rust) | Um toque terminou dentro da view. |
| `onLongPress` | `.on_long_press` | `PressEvent` (nenhum em Rust) | O dedo permaneceu apoiado por `delayLongPress` (500 ms). |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (nenhum em Rust) | Um dedo tocou / foi levantado ou saiu da view. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | O mouse entrou na view (ou em uma view dentro dela) / saiu dela ou da janela ([hover](./index.md#hover)); o de `onMouseLeave` é onde ele esteve por último. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | O mouse se moveu sobre a view (ou sobre uma view dentro dela), com ou sem botão pressionado, ou uma tecla modificadora foi pressionada ou solta enquanto ele repousa ali sem nenhum botão pressionado: `position`, `pagePosition` (`Point`s), `modifiers` e `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` ou `null`); no máximo uma vez por frame. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | O botão secundário foi pressionado sobre a view ([menus de contexto](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | nenhum | Um arrasto de arquivo local entrou no / saiu do destino ativo no desktop. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | Arquivos ou diretórios locais foram soltos no destino do desktop. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | O frame relativo ao pai mudou. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | Um arrasto vinculado com `pan` começou / terminou; `cancelled` é verdadeiro quando o sistema o cancela. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | Um gesto de pinça vinculado com `pinch` começou / terminou. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | Uma rotação vinculada com `rotation` começou / terminou. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | Uma ação de acessibilidade personalizada foi executada. |

Eventos de toque e de responder: veja as [props comuns](./index.md#raw-touches-and-the-responder-system).

<a id="desktop-file-drops"></a>

## Soltar arquivos no desktop

No AppKit, GTK, Win32 e GPUI, uma view com `onFileDrop` recebe arquivos e diretórios locais arrastados de outro
aplicativo. `onFileDragEnter` e `onFileDragLeave` acompanham o destino ativo; `onFileDrop` recebe
`{ uris: string[] }` na ordem da lista de arquivos nativa. Cada entrada é uma URL `file:` absoluta, com espaços e
caracteres não ASCII escapados. Faça o parse da URL para obter um caminho do sistema de arquivos, em vez de remover o prefixo manualmente.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

O ancestral habilitado mais próximo que estiver escutando `onFileDrop` recebe o arquivo solto. Uma raiz modal limita essa busca. `disabled`
remove os listeners de arrastar e soltar arquivos; saída, cancelamento, conclusão e remoção do destino limpam o estado ativo.
A aceitação usa a operação Copy e o estado nativo montado. O app decide se lê, abre ou transfere os
arquivos recebidos.

<a id="ref-methods"></a>

## Métodos de ref

A ref de uma view simples é um `ViewRef`: `focus()`, `blur()` e `measure()`. `ref` (`.element_ref(&handle)` em Rust) fornece o nó dela, por exemplo para passar a
`setAccessibilityFocus` ([API de acessibilidade de `nsh`](../modules/nsh.md#accessibility)), ou para medi-la
(`handle.measure()` em Rust).

<a id="views-inside-text"></a>

## Views dentro de texto

Uma view colocada dentro de um texto é um anexo inline: ela fica na linha de base, quebra junto com as palavras e recebe
pressionamentos próprios. Veja [texto](./text.md#inline-views-and-images).

<a id="platform-notes"></a>

## Notas por plataforma

- `boxShadow` desenha em todas as plataformas; `android={{ elevation }}` fornece, em vez disso, a sombra material do Android. No Android, uma sombra precisa de uma
  cor de fundo (uma view com fundo transparente não projeta sombra).
- `filter` em views: o iOS oferece suporte a `opacity()`, `brightness()` até 1 e `drop-shadow()` (imagens aceitam todos os filtros
  de cor e `blur()`); o Android oferece suporte a todos a partir da API 31, e aos filtros de cor abaixo dela.
- `backdropFilter: "blur(…)"` é um material do sistema no iOS (uma aproximação) e exige a API 31 no Android.
- O Android desenha transformações `translate`, `scale` e `rotate`; inclinações (`skew()`, `skewX()`, `skewY()`) se aplicam nas outras plataformas.
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) desenha cantos que se suavizam nas bordas (como
  os ícones de app do iOS), em ambas as plataformas.
- O estilo `cursor` se aplica onde há um ponteiro (Mac Catalyst, iPad com ponteiro, desktops).
