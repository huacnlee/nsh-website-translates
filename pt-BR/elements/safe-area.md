---
title: "Área segura"
description: "As variáveis de ambiente safe-area-inset e os acessores safeArea e safeAreaInsets: conteúdo mantido afastado do notch, da barra de status, do indicador de início e dos cabeçalhos."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---


# Área segura

A safe area mantém o conteúdo longe do notch ou da Dynamic Island, da barra de status, do indicador de home, de um cabeçalho de navegação e da barra de título do Mac Catalyst. Qualquer view se ajusta a ela com o `env()` do CSS:
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` e
`env(safe-area-inset-left)`, em seu padding ou margin. Esses valores são os insets da view raiz em que o nó é renderizado:
dentro de uma [NavPage](./nav-stack.md), os insets abaixo do cabeçalho da página; dentro de um [Dialog](./dialog.md), os insets do
dialog; nos demais casos, a safe area da surface. Em um navegador, a página é a raiz e as variáveis são as do
próprio navegador.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

A cor de fundo preenche toda a área, inclusive a área atrás da barra de status, e o conteúdo começa abaixo
dela. Os valores acompanham os insets: ao girar o dispositivo ou ao mudar para outra página ou dialog, o padding é atualizado nativamente.

<a id="values"></a>

## Valores

| Valor | Exemplo | Significado |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | O inset. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | O inset; o comprimento substitui um nome desconhecido, como no CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | O inset mais um comprimento, para conteúdo que mantém seu próprio espaçamento. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | O mesmo. |

Eles se aplicam a `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` e às mesmas chaves de `margin`. No Tailwind, são valores arbitrários de `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` e das utilities `m` (os espaços podem ser omitidos): `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. O tipo TypeScript desses valores é `EnvValue`. Veja
[a referência de estilos](../modules/style-reference.md).

Em Rust, os métodos de `Styled` os definem: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, os mesmos métodos de `m` e `.pt_safe_area_plus(px(16.0))`
(e `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`) para um inset mais um comprimento.

<a id="choosing-the-edges"></a>

## Escolhendo as bordas

Aplique padding apenas nas bordas que precisam dele, por exemplo quando uma tab bar ou uma barra inferior própria trata o inset inferior:

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## Quando usar

Uma [NavPage](./nav-stack.md) com um cabeçalho visível e opaco já posiciona seu conteúdo abaixo do cabeçalho, então o inset
superior ali é 0. Os insets da safe area servem para:

- a raiz de um app sem pilha de navegação,
- uma página com `headerVisible={false}` ou `headerTransparent`,
- o conteúdo de um [Dialog](./dialog.md) em tela cheia,
- barras próprias nas bordas da tela.

## safeArea and safeAreaInsets

Quando você precisar dos números no código, leia-os diretamente. Ambos os accessors TSX vêm de `nsh`, retornam um objeto `Edges`
(`{ top, right, bottom, left }` em points) e são reativos: o código que os lê é executado novamente quando eles mudam, por
exemplo ao girar o dispositivo.

| TSX | Rust | Retorna |
|---|---|---|
| `safeArea()` | `safe_area()` | A safe area da surface: as partes livres da UI do sistema (notch, indicador de home, barra de título). |
| `safeAreaInsets()` | `cx.insets()` | Os insets do local onde o componente é renderizado: os da página mais próxima (abaixo do cabeçalho), os do dialog mais próximo ou, na ausência deles, a safe area da surface. Esses são os valores das variáveis `safe-area-inset-*`. Em TSX, chame-o dentro de um componente; ele retorna um accessor. Um componente Rust do seu crate os lê com `cx.insets()`. |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

Para aplicar padding com o próprio inset, `env()` é a forma mais simples: ele é atualizado nativamente, sem executar código.

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: os insets vêm da safe area do UIKit: a barra de status, o notch ou a Dynamic Island e o indicador
  de home.
- **Android**: o NSH informa as partes das barras do sistema e do display cutout que se sobrepõem à view do NSH. Quando o NSH está
  [incorporado](../docs/android.md) abaixo de uma toolbar nativa, o inset superior da view é 0.
- **Mac Catalyst**: o inset superior é a barra de título da janela.
- **Desktop (macOS, Windows, Linux, GPUI) e web**: o conteúdo de uma página começa abaixo de seu `header`, e um dialog
  fornece ao seu conteúdo insets próprios, como nos celulares.

<a id="related"></a>

## Relacionados

- [Teclado](./keyboard.md): `env(keyboard-inset-height)`, conteúdo mantido acima do teclado virtual.
- [Dispositivo e ambiente](../docs/device-and-environment.md): a safe area entre os demais valores do dispositivo.
