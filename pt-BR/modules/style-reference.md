---
title: "Referência de estilos"
description: "Todas as chaves de estilo que o NSH aceita, agrupadas por LayoutStyle, ViewStyle, TextStyle, InputStyle e ImageStyle, com seu tipo e significado."
order: 16
source_hash: 012ce37fb9fe065c
---


# Referência de estilos

Esta página lista todas as chaves da prop `style` e o método de `Styled` que a define em Rust. Os componentes Rust estilizam elementos com métodos tipados, nomeados a partir dos utilitários do Tailwind (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`, de `nsh_core::prelude`), que são convertidos nas mesmas chaves; o TSX passa objetos `style` (e classes). A coluna Rust indica o método; a maioria deles aceita um valor, um signal ou uma closure, e `.style_when(…)` / `.style_with(…)` tornam qualquer um deles condicional. As chaves e seus tipos vêm das declarações geradas em `.nsh/types/nsh/types.d.ts`, então seu editor os verifica enquanto você digita. Uma chave de estilo corresponde à propriedade CSS de mesmo nome, igual à classe que a define: `paddingLeft` é o `padding-left` e o `pl-4` do CSS, `boxShadow` é `box-shadow` e `shadow-md`; algumas chaves usam nomes mais simples, que os apps costumam escrever (`paddingHorizontal` para `padding-inline`, `marginStart` para `margin-inline-start`, `numberOfLines` para `line-clamp`). Os números são pontos, e os recursos do CSS também estão disponíveis: grid, gradientes, sombras de caixa, filtros, modos de mesclagem, contornos, transformações, transições e animações com keyframes.

Para saber como aplicar estilos, combiná-los com classes e herdar estilos de texto, consulte [Styling](../docs/styling.md). Para a sintaxe das classes, consulte a [referência do Tailwind](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## As cinco interfaces

Cada interface estende a anterior:

| Interface | Estende | Usada por |
|---|---|---|
| `LayoutStyle` | | Layout de todos os elementos (flexbox, grid, tamanhos, espaçamento, posição) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, controles e todos os outros elementos |
| `TextStyle` | `ViewStyle` | `<Text>` e `<Input>` (e views, cujos estilos de texto passam para o texto dentro delas) |
| `InputStyle` | `TextStyle` | `<Input>`: acrescenta `placeholderColor` e `caretColor` |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style` também aceita um array; as entradas são mescladas da esquerda para a direita e as entradas falsy são ignoradas, então estilos condicionais não precisam de spread. Em Rust, `.style_when(condition, …)` adiciona estilos enquanto a condição for verdadeira:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> O `style` inline sempre prevalece sobre `class`. Definir uma chave como `null` ou `undefined` a redefine para o valor padrão.

<a id="how-style-keys-read"></a>

## Como as chaves de estilo funcionam

As chaves de estilo seguem o CSS, então um estilo e uma classe que nomeiam a mesma propriedade fazem a mesma coisa:

- **Direção do layout.** Uma view que não define `display` organiza seus filhos em coluna. `display: "flex"` é uma linha, a menos que `flexDirection` esteja definido, como no CSS e na classe `flex`. `flexShrink` é `0`, a menos que seja definido.
- **Lados físicos e lógicos.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` e `textAlign: "left"` mantêm o seu lado em layouts da direita para a esquerda. As chaves de início e fim (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), a família `borderTopStartRadius` e `textAlign: "start" | "end"` seguem a direção: o início inline é a esquerda em layouts da esquerda para a direita e a direita nos da direita para a esquerda.
- **Cores de borda.** Uma borda ou um contorno cuja largura está definida e cuja cor não está é desenhado na cor do texto (o `currentColor` do CSS).
- **Transformações.** `translate`, `rotate` e `scale` são propriedades independentes, e `transform` aceita a string de funções do CSS ou uma lista de passos cujas quantidades podem ser valores animados. Elas se compõem nesta ordem: `translate`, `rotate`, `scale` e, por fim, `transform`.

<a id="value-types"></a>

## Tipos de valor

| Tipo | Aceita | Rust |
|---|---|---|
| `number` | Pontos (independentes de densidade). `1` é um ponto no iOS e um dp no Android. | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (pontos), `` `${number}%` `` (do pai) ou `"auto"`. | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (pontos) ou `` `${number}%` ``. Sem `"auto"`. | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | Uma string de cor CSS: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()` ou uma cor CSS nomeada (`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, cores do tema (`theme().primary`) |
| `EnvValue` | Uma variável de ambiente em um padding ou margin: `env(name)`, `env(name, <length>)` (o comprimento substitui um nome desconhecido), `calc(env(name) + <length>)` ou `calc(<length> + env(name))`. Os nomes são `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Safe area](../elements/safe-area.md)) e `keyboard-inset-height` ([Keyboard](../elements/keyboard.md)). Aceita pelas chaves físicas de padding e margin e por seus atalhos. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | Um valor animado nativo ou um nó derivado dele (consulte [a API de animação de `nsh`](./nsh.md#animation)). Aceito por `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, pelos passos de uma lista `transform` e por `top` / `left` de uma view sticky; o valor então é animado na thread de UI, sem JS. | `AnimatedValue` / `AnimatedNode`, vinculado com `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... |

Strings com sintaxe CSS (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) aceitam comprimentos em `px` e números simples (ambos em pontos), `pt` (4/3 de ponto, como no CSS) ou `rem` (16 pontos).

## LayoutStyle

O layout é calculado em Rust (flexbox e CSS grid). Uma view que não define `display` é um contêiner flex cujos filhos se empilham em coluna; `display: "flex"` o torna uma linha, a menos que `flexDirection` esteja definido, como no CSS. Os elementos têm como padrão `flexShrink: 0`, `alignContent: "flex-start"` (grids: o `"normal"` do CSS), `alignItems: "stretch"` e nenhum tamanho mínimo automático. Consulte [Layout](../docs/layout.md).

<a id="display-and-position"></a>

### Display e posição

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | O layout dos filhos. `"flex"` os organiza em linha, a menos que `flexDirection` defina uma direção, como no CSS; uma view que não define display os organiza em coluna. `"none"` remove o elemento do layout e o oculta. `"block"` empilha os filhos como o layout de bloco do CSS. |
| `boxSizing` | `"border-box" \| "content-box"` | | As dimensões incluem bordas e padding, ou apenas o conteúdo. Padrão: `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` tira o elemento do fluxo e o posiciona por `top` / `right` / `bottom` / `left` em relação ao ancestral posicionado mais próximo (o pai, a menos que seja `"static"`). `"static"` permanece no fluxo e ignora os deslocamentos. `"fixed"` preserva o tipo do elemento e o organiza e monta em sua surface ou raiz de modal, mantendo-o no lugar enquanto o conteúdo ao redor rola. `"sticky"` permanece no fluxo e, enquanto seu pai estiver visível, fixa-se a `top` (`left` em uma scroll view horizontal) a partir do início da viewport da scroll view ao redor, até que seu fim encontre o da caixa de conteúdo do pai; é desenhado acima de seus irmãos do mesmo `zIndex`. Padrão: `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | Deslocamento a partir da borda superior do pai (absolute) ou da posição do próprio elemento (relative). Em uma view sticky, é onde ela se fixa, e um valor animado o move a cada frame. |
| `right` | `DimensionValue` | `.right(…)` | Deslocamento a partir da borda direita, em qualquer direção. |
| `bottom` | `DimensionValue` | `.bottom(…)` | Deslocamento a partir da borda inferior. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | Deslocamento a partir da borda esquerda, em qualquer direção. Em uma view sticky dentro de uma scroll view horizontal, é onde ela se fixa, e um valor animado o move a cada frame. |
| `start` | `DimensionValue` | | Deslocamento a partir da borda de início inline: esquerda em layouts da esquerda para a direita, direita nos da direita para a esquerda. |
| `end` | `DimensionValue` | | Deslocamento a partir da borda de fim inline: direita em layouts da esquerda para a direita, esquerda nos da direita para a esquerda. |
| `zIndex` | `number` | `.z_index(z)` | Ordem entre irmãos (estável para valores iguais); também é a ordem de empilhamento nativa. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | Direção do layout, herdada por padrão. Como no CSS, as propriedades `left` e `right` mantêm seus lados da direita para a esquerda, enquanto as de início / fim inline (`marginStart`, `end`, ...) assumem os lados que a direção lhes dá. |

### Flexbox

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | O eixo principal. Padrão: `"column"` para uma view que não define `display`, `"row"` quando `display: "flex"` está definido. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | Se os filhos quebram em várias linhas. Padrão: `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | Um único número, não o atalho do CSS: um número positivo define `flexGrow` com ele, `flexShrink: 1` e `flexBasis: 0`; `0` torna o elemento inflexível; um número negativo o encolhe até o tamanho mínimo. |
| `flexGrow` | `number` | `.flex_grow(f)` | Quanto do espaço livre o elemento ocupa. Padrão: `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | Quanto o elemento encolhe quando falta espaço. Padrão: `0`, e não `1` como no CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | O tamanho no eixo principal antes de o espaço livre ser distribuído. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | Distribuição dos filhos ao longo do eixo principal. Padrão: `"normal"`: `"flex-start"` em contêineres flex; em grids, as trilhas dimensionadas com `auto` se esticam. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | Alinhamento dos filhos no eixo cruzado. Padrão: `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | Substitui o `alignItems` do pai para este elemento. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | Distribuição das linhas quebradas (e das trilhas de grid) no eixo cruzado. Padrão: `"flex-start"` em contêineres flex e `"normal"` em grids, onde as trilhas dimensionadas com `auto` se esticam. `"start"` / `"end"` seguem a direção da escrita. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | Espaço entre linhas e colunas dos filhos. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | Espaço entre linhas. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | Espaço entre colunas. |

### Grid

Defina `display: "grid"` para organizar os filhos em um CSS grid. As listas de trilhas usam a sintaxe do CSS.

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Trilhas de coluna: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, nomes de linha (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Trilhas de linha, mesma sintaxe. |
| `gridAutoColumns` | `string` | | Tamanho das colunas criadas implicitamente. |
| `gridAutoRows` | `string` | | Tamanho das linhas criadas implicitamente. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | Como os itens sem posicionamento preenchem o grid. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Posicionamento de coluna: `"1 / 3"`, `"span 2"`, um número de linha ou um nome de linha (`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | Linha de coluna inicial. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | Linha de coluna final. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Posicionamento de linha, mesma sintaxe de `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | Linha de grid inicial. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | Linha de grid final. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Como os itens do grid se posicionam em suas áreas ao longo da linha. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Substitui `justifyItems` para este item. |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

<a id="size"></a>

### Tamanho

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | Largura. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | Altura. |
| `minWidth` | `LengthValue` | `.min_w(…)` | Largura mínima. |
| `minHeight` | `LengthValue` | `.min_h(…)` | Altura mínima. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | Largura máxima. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | Altura máxima. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | Largura dividida pela altura, um número (`1.5`) ou a razão do CSS (`"16 / 9"`); a dimensão ausente é calculada a partir da outra. `"auto"` não define nenhuma. |

### Margin

As margens aceitam `"auto"` (absorve o espaço livre, como no flexbox) e valores negativos. As chaves físicas (todas, exceto `marginStart` / `marginEnd`) também aceitam um `EnvValue`: `marginBottom: "env(keyboard-inset-height)"` (em Rust, `.mb_keyboard()`, `.mt_safe_area()`, ...).

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | Os quatro lados. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | Esquerda e direita. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | Superior e inferior. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | Superior. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | Direita. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | Inferior. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | Esquerda. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Início inline: esquerda em layouts da esquerda para a direita, direita nos da direita para a esquerda. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Fim inline: o lado oposto a `marginStart`. |

### Padding

As chaves físicas (todas, exceto `paddingStart` / `paddingEnd`) também aceitam um `EnvValue`: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (em Rust, `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Um padding é no mínimo 0.

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | Os quatro lados. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | Esquerda e direita. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | Superior e inferior. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | Superior. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | Direita. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | Inferior. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | Esquerda. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Início inline: esquerda em layouts da esquerda para a direita, direita nos da direita para a esquerda. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Fim inline: o lado oposto a `paddingStart`. |

## ViewStyle

Tudo o que é desenhado por uma view. Todas as chaves de `LayoutStyle` também se aplicam.

### Background

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | A cor de preenchimento. Aceita uma cor animada nativa. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` com `.gradient_from` / `_via` / `_to` | Gradientes CSS desenhados sobre a cor de fundo: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, vários separados por vírgulas. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### Bordas

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | Largura dos quatro lados. |
| `borderTopWidth` | `number` | `.border_t(w)` | Lado superior. |
| `borderRightWidth` | `number` | `.border_r(w)` | Lado direito. |
| `borderBottomWidth` | `number` | `.border_b(w)` | Lado inferior. |
| `borderLeftWidth` | `number` | `.border_l(w)` | Lado esquerdo. |
| `borderStartWidth` | `number` | `.border_s(w)` | Lado inicial da linha (esquerdo em layouts da esquerda para a direita, direito nos da direita para a esquerda). |
| `borderEndWidth` | `number` | `.border_e(w)` | Lado final da linha. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | Cor dos quatro lados. Aceita uma cor animada nativa. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | Lado superior. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | Lado direito. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | Lado inferior. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | Lado esquerdo. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | Lado inicial da linha. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | Lado final da linha. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | Estilo da linha. Padrão `"solid"`. `"none"` e `"hidden"` não desenham nem reservam espaço para borda, quaisquer que sejam as larguras, definidas antes ou depois, como no CSS. |

Um lado cuja largura está definida e cuja cor nada define é desenhado na cor do texto, o `currentColor` do CSS: `{ borderWidth: 1, color: "#2563eb" }` desenha uma borda azul. Os contornos (outlines) usam a cor do texto da mesma forma.

<a id="corners"></a>

### Cantos

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | Raio dos quatro cantos. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | Canto superior esquerdo. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | Canto superior direito. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | Canto inferior direito. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | Canto inferior esquerdo. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | Canto superior no lado inicial da linha. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | Canto superior no lado final da linha. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | Canto inferior no lado inicial da linha. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | Canto inferior no lado final da linha. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: cantos cuja curvatura se suaviza em direção às bordas, como os ícones de apps do iOS. Onde a caixa é pequena demais, a curva volta a ser circular, então pílulas continuam sendo pílulas. Funciona nas duas plataformas. |

<a id="outline"></a>

### Contorno

Um contorno é desenhado fora da borda e não ocupa espaço no layout.

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | Largura da linha. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | Cor da linha. Padrão: a cor do texto. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | Estilo da linha. |
| `outlineOffset` | `number` | `.outline_offset(o)` | Distância da borda; valores negativos o movem para dentro. |

<a id="shadows"></a>

### Sombras

Uma view projeta sombras com o `boxShadow` do CSS: várias camadas, spread e sombras internas (inset). As transições a animam (`transitionProperty: "boxShadow"`).

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | `box-shadow` do CSS: deslocamentos, blur, spread e cor, várias camadas separadas por vírgulas, `inset` para sombras internas; ou suas camadas como números, `[{ x, y, blur, spread, color, inset }]` (apenas `x` e `y` são obrigatórios); uma camada sem cor é desenhada na cor do texto, como o `currentColor` do CSS. `.shadow_color(c)` recolore as camadas de um preset ou de `.shadow(…)`. |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> No Android, as sombras precisam de um fundo: uma view com fundo transparente (texto sobre nada, por exemplo) não projeta sombra. Para a sombra material do Android, use a prop `android={{ elevation }}` em vez de um style.

<a id="opacity-visibility-and-overflow"></a>

### Opacidade, visibilidade e overflow

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | De 0 (invisível) a 1. Aceita um valor animado nativo. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | Views ocultas mantêm seu espaço no layout (diferente de `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` recorta os filhos aos limites da view (e aos cantos). |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: invisível enquanto uma rotação 3D a vira de costas. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | Onde uma view ou imagem dentro de um `<Text>` fica em sua linha, como o `vertical-align` do CSS: a base na linha de base (padrão), o topo ou a base no topo ou na base da fonte do texto, ou o meio a meia altura-x acima da linha de base. A linha cresce para acomodá-la. |

<a id="transforms"></a>

### Transformações

As transformações são as do CSS: as propriedades `translate`, `rotate` e `scale` e `transform`, compostas nessa ordem. Cada uma é uma propriedade própria, então o `scale` de um style substitui o `scale-*` de uma classe e mantém o `rotate-*` dela, e o `transform` de um style substitui as funções de transformação de uma classe (`rotate-x-*`, `skew-*`).

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | `translate` do CSS: x, depois y (`"10px 20px"`; porcentagens do tamanho da própria view, `"-50% 0"`). Um número são pontos ao longo de x. `[x, y]` aceita um número, uma string (`"50%"`, `"10px"`) ou um valor animado por eixo; um valor animado sozinho a move ao longo de x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | `rotate` do CSS: `"45deg"`, `"0.5turn"`, ou em torno de um eixo, `"x 90deg"`. Um número, e um valor animado, são graus em torno de z, no sentido horário. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | `scale` do CSS: `1.5`, `"150%"`, x e y (`"1 2"`). Um valor animado escala os dois eixos; `[x, y]` aceita um número ou um valor animado por eixo. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; passos animados: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (depois de toda transformação do style) | `transform` do CSS: `"translateX(10px) rotate(45deg) scale(1.5)"`, ou `"none"`. Funções: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. Comprimentos aceitam `px` (translações também `%`, do tamanho da própria view), ângulos `deg`, `rad` ou `turn`. Ou uma lista de passos cujas quantidades podem ser valores animados: o que a string não consegue comportar, como uma rotação 3D animada (`[{ perspective: 800 }, { rotateY: angle }]`), e os canais de um motion (`m.transform`). O `transform` de um style é de uma forma ou da outra, então uma perspectiva antes de passos animados é um passo da lista. Aplicado depois de `translate`, `rotate` e `scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | O ponto em torno do qual as transformações atuam: palavras-chave, porcentagens e comprimentos (`"top left"`, `"50% 0"`, `[10, 20]`). Padrão: o centro. |

Um `TransformStep` é um objeto com uma chave, aplicado na ordem da lista:

| Passo | Valor | Animado nativamente |
|---|---|---|
| `translateX`, `translateY` | `number` (pontos) | sim |
| `scale`, `scaleX`, `scaleY` | `number` (fator) | sim |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (graus) ou `string` (`"45deg"`, `"0.5rad"`) | sim |
| `skewX`, `skewY` | `number` (graus) ou `string` | não |
| `perspective` | `number` (pontos) | não |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

Um valor animado controla `translate`, `rotate` e `scale` diretamente, bem como os passos de uma lista `transform`:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> O Android não desenha skew: `skew()`, `skewX()` e `skewY()` deixam a view sem inclinação lá.

<a id="filters-and-blending"></a>

### Filtros e blending

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | Filtros CSS da view e de seu conteúdo: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | Filtros CSS do que está atrás da view, como `"blur(10px)"` para vidro fosco. |
| `maskImage` | `string` | | Um gradiente CSS cujo alpha decide quanto da view é desenhado, por inteiro onde é opaco e nada onde é transparente: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. Mascara tudo o que a view desenha, inclusive seu filtro de backdrop. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass atrás do conteúdo da view no iOS 26 e no macOS 26 e posteriores. `"regular"` usa o material padrão; `"clear"` pega menos cor do fundo. `"none"` é o padrão. Combine com `backdropFilter` para o desfoque exibido em versões anteriores do iOS e em outras plataformas. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | Como a view se mistura com o que está atrás dela. |

> [!WARNING]
> Limites por plataforma:
> - O iOS aplica apenas `opacity()`, `brightness()` até 1 e `drop-shadow()` a views. `<Image>` aceita todos os filtros de cor e `blur()`, aplicados enquanto a imagem é decodificada.
> - O desfoque `backdropFilter` no iOS usa um material do sistema em uma fração, uma aproximação do raio exato.
> - O Android exige a API 31 para `blur()`, `drop-shadow()` e `backdropFilter`; abaixo disso, só os filtros de cor se aplicam. Os blend modes exigem a API 29.

<a id="transitions"></a>

### Transições

Quando uma propriedade com transição muda (por um novo style, uma classe ou uma variante como `active:`), a plataforma a anima nativamente. Nenhum JS é executado durante a animação.

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | Propriedades separadas por vírgula que são animadas: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (todas as propriedades de transformação), `"boxShadow"`, `"borderRadius"`, `"borderWidth"`, ou `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | Milissegundos como número, ou `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | Atraso antes de a transição começar. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | A curva de easing. |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### Animações de keyframes

Animações de keyframes integradas, executadas nativamente (`animate-*` do Tailwind).

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | A animação. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Duração de uma iteração. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Atraso antes da primeira iteração. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | A curva de easing. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | Quantas vezes é executada. |

Para animações controladas por valores, gestos ou springs, use a API de animação do [`nsh`](./nsh.md#animation).

<a id="pointer-and-selection"></a>

### Ponteiro e seleção

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (toda palavra-chave de cursor do CSS, e `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | O formato do ponteiro sobre a view, para dispositivos apontadores (trackpads do iPad, Mac Catalyst, desktops). As palavras-chave diagonais de redimensionamento mantêm seu eixo: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) e `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, a web e GPUI mostram cursores diagonais; o AppKit os usa no macOS 15+, com uma mão aberta no macOS 14. O UIKit usa efeitos de ponteiro no iPad e no Mac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | Quais toques a view e as views dentro dela recebem (`pointer-events-none`, `pointer-events-auto`). `"none"`: nenhum, também para as views dentro dela, a menos que uma defina `"auto"`, herdado como no CSS. `"box-none"`: nenhum na própria view, as views dentro dela recebem os seus; `"box-only"`: a própria view os recebe, as views dentro dela nenhum (ambos do React Native, só para a view). Padrão `"auto"`. Veja [toque e gestos](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | Se um `<Text>` pode ser selecionado e copiado (`"text"`, `select-text`) ou não (`"none"`, `select-none`); o de uma view alcança os textos dentro dela que não definem nenhum. `"auto"` (`select-auto`), o padrão, deixa a decisão para a view ao redor, ou então para a plataforma. Veja [texto](../elements/text.md). |

<a id="svg-paint"></a>

### Pintura SVG

As propriedades de pintura do CSS para formas SVG, que qualquer elemento aceita e que os elementos dentro dele herdam, como em um navegador.
Elas pintam o que componentes Rust desenham em canvases.

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | Com o que as formas são preenchidas; `currentColor` é a cor do texto do elemento. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | Com o que os contornos das formas são pintados. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | A largura desses contornos, um comprimento (1 por padrão). |
| `strokeDasharray` | `number \| string` | — | Traços e espaços ao longo desses contornos: comprimentos separados por espaços ou vírgulas (`"4 2"`), uma lista de tamanho ímpar é repetida, ou `"none"`. |

## TextStyle

Os estilos de texto se aplicam a `<Text>` e `<Input>`. Eles também são herdados, como no CSS: propriedades de texto definidas em uma view passam para os textos e inputs dentro dela, e spans `<Text>` aninhados herdam do texto pai. Todas as chaves de `ViewStyle` também se aplicam. Veja [Texto](../docs/text.md).

<a id="font"></a>

### Fonte

| Chave | Tipo | Rust | Descrição |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | Cor do texto. Aceita uma cor animada nativa. Também é a cor das bordas e contornos que não definem nenhuma. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | Tamanho em pontos. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) ou 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | Uma família do sistema, ou o nome para o qual uma fonte importada é avaliada (`import Inter from "./Inter.ttf"`), ou uma lista deles, do mais preferido ao menos (`"Brand, 'Noto Sans SC', sans-serif"`). Veja [Fontes](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | Itálico. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | Formas de números e letras do OpenType, uma lista (`["tabular-nums"]`) ou os nomes do CSS separados por espaços (`"tabular-nums small-caps"`). `tabular-nums` mantém os dígitos com a mesma largura, útil para contadores e timers. |
<a id="spacing-and-alignment"></a>

### Espaçamento e alinhamento

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | Altura da linha, em pontos. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | Espaço extra entre os caracteres, em pontos. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | Alinhamento horizontal. `"left"` e `"right"` mantêm seus lados em layouts da direita para a esquerda; `"start"` e `"end"` seguem a direção. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | Direção base do texto; `"auto"` a obtém do conteúdo. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | Transformação de maiúsculas e minúsculas. |

> [!TIP]
> As classes `leading-*` e `tracking-*` do Tailwind definem a altura da linha como múltiplos do tamanho da fonte e o espaçamento entre letras em `em`, de modo que escalam com os tamanhos de `text-*`.

<a id="lines-and-overflow"></a>

### Linhas e overflow

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | O máximo de linhas que um `<Text>` exibe (`line-clamp` e `line-clamp-*` do CSS); `0` (`line-clamp-none`), o padrão, exibe todas. `truncate` é uma única linha cortada com reticências. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | Como um `<Text>` limitado é cortado: reticências no final (`"ellipsis"`, `text-ellipsis`, o padrão), cortado sem reticências (`"clip"`, `text-clip`), ou reticências no início ou no meio (caminhos de arquivos). |

<a id="decoration"></a>

### Decoração

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | Linhas desenhadas junto com o texto. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | Cor das linhas (por padrão, a cor do texto). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | Estilo da linha. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | Espessura da linha. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | Distância do sublinhado em relação à linha de base. |

<a id="placeholder-caret-and-selection"></a>

### Placeholder, cursor e seleção

`placeholderColor` e `caretColor` pertencem a `InputStyle`, o estilo de `<Input>`; `selectionColor` pertence a `TextStyle`, já que textos selecionáveis também o aceitam.

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` de um input | A cor do placeholder de um `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | Onde fica um texto menor que sua caixa (um `<Text>` com altura). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` de um input ou de um texto | O destaque de seleção e as alças de um `<Input>` ou de um `<Text>` selecionável (`selection:bg-*`); por padrão, a cor de destaque da plataforma. No iOS, também o cursor de um input, a menos que `caretColor` esteja definido (o UIKit aplica uma única cor a ambos). |
| `caretColor` | `ColorValue` | `.caret_color(c)` de um input | O cursor de um `<Input>` (`caret-*`); o padrão da plataforma quando não definido. |

<a id="text-shadow"></a>

### Sombra do texto

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | `text-shadow` do CSS: deslocamentos, desfoque e cor (`"0 1px 2px rgb(0 0 0 / 0.3)"`), ou suas camadas como números, `[{ x, y, blur, color }]`; várias camadas são desenhadas como a mais larga; uma camada sem cor é desenhada na cor do texto; `"none"`. |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> O iOS não desenha gradientes (`backgroundImage`) nem sombras de caixa internas (inset) em `<Text>`.

## ImageStyle

Todas as chaves de `ViewStyle`, mais:

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` de uma imagem | Recolore uma imagem template (todo pixel opaco assume essa cor), para ícones monocromáticos. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | `object-fit` do CSS: como uma imagem ou um vídeo se ajusta à sua caixa. `"cover"` a preenche e corta, `"contain"` a ajusta por dentro, `"fill"` a estica, `"none"` mantém o tamanho natural, `"scale-down"` é `"none"` ou `"contain"`, o que for menor. Por padrão, as imagens cobrem sua caixa e os vídeos ficam contidos nela. |
| `objectPosition` | `string` | `.object_position(p)`, `.object_top()`, ... de uma imagem | Onde a imagem fica em sua caixa depois que `objectFit` a dimensionou, como o `object-position` do CSS: palavras-chave, porcentagens e comprimentos (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). Uma imagem que cobre a caixa é cortada em torno dele. Por padrão, o centro. |

`objectFit` também se aplica a `<Video>`; veja [image](../elements/image.md) e [video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## Props que parecem estilos

A sombra material do Android é uma prop da plataforma, definida ao lado do estilo:

| Setting | Prop | Rust | Class |
|---|---|---|---|
| Sombra material (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## Relacionados

- [Styling](../docs/styling.md): `style`, `class`, herança e precedência.
- [Tailwind reference](./tailwind-reference.md): todos os utilitários e variantes compatíveis.
- [Layout](../docs/layout.md): flexbox e grid na prática.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): os elementos aos quais esses estilos se aplicam.

`width`, `height` e `flexBasis` também aceitam `"min-content"`, `"max-content"` e `"fit-content"`, calculados pelo Taffy.
