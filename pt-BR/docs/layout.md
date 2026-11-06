---
title: "Layout"
description: "Flexbox com direção de coluna por padrão, CSS grid, tamanhos e porcentagens, proporção de aspecto, posicionamento absoluto, medição com onLayout, layouts responsivos e da direita para a esquerda, em Rust e TSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---


# Layout

NSH posiciona cada elemento com [Taffy](https://github.com/DioxusLabs/taffy), uma implementação em Rust de layout CSS flexbox, grid e block, configurada para que os filhos sejam empilhados verticalmente e não encolham por padrão. O layout é executado no núcleo, após cada turno do seu código, e somente os frames que mudaram são enviados às views nativas. O texto é medido pelo mecanismo de texto da plataforma na mesma thread, de modo que o layout nunca espera pela thread principal.

As propriedades de layout abaixo são propriedades de estilo. Em Rust, são métodos de estilo tipados (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`); em TSX, são chaves da prop `style`, e cada uma tem uma classe do [Tailwind](./tailwind.md) (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...). Ambas resultam nos mesmos estilos nativos.

## Flexbox

Uma view posiciona seus filhos com flexbox. Uma view que não define `display` empilha seus filhos em uma coluna; `display: "flex"` em um estilo cria uma linha, a menos que `flexDirection` esteja definido, exatamente como no CSS e como a classe `flex` do Tailwind. Quando nada os define, estes padrões se aplicam:

| Propriedade | Padrão do NSH | Padrão na web |
|---|---|---|
| `flexDirection` | `"column"` (uma view que não define `display`); `"row"` quando `display: "flex"` é definido | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (grids: `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| Propriedade | Valores | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | Eixo principal: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Eixo transversal: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | Alinhamento de um filho no eixo transversal; `"auto"` segue o `alignItems` do pai | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | Linhas de um contêiner com quebra | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | Uma abreviação com um único número (abaixo) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | Como no CSS | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | Espaço entre os filhos | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)` e os passos `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` e `flex-end` seguem a direção do flex; `start` e `end` seguem a direção de escrita, como no CSS (da direita para a esquerda, `start` é o lado direito), e `self-start` / `self-end` são os do próprio filho.

`flex` é a abreviação do CSS, assim como as classes `flex-*` do Tailwind: um número `n` significa crescer em `n`, encolher em 1 e começar de uma base 0, de modo que irmãos `flex: 1` (`.flex_1()` em Rust, `flex-1`) dividem o espaço igualmente, qualquer que seja o conteúdo; `"none"` equivale a `0 0 auto` (a view mantém seu tamanho), `"auto"` equivale a `1 1 auto`, `"initial"` equivale a `0 1 auto`, e crescimento, encolhimento e base podem ser escritos separadamente (`"2 0 50%"`, `"1 1 120px"`). Como os tamanhos mínimos têm padrão 0, `flex: 0` (`0 1 0`) encolhe uma view até o nada, a menos que `minWidth: "auto"` preserve o tamanho do conteúdo.

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

Como os tamanhos mínimos têm padrão 0, um texto `flex: 1` em uma linha encolhe e quebra, em vez de empurrar seus irmãos para fora. `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`, `.min_w(auto())` em Rust) é o mínimo automático do CSS: um item que encolhe para no menor tamanho do seu conteúdo, a palavra mais longa de um texto, como na web.

> [!NOTE]
> `display: "flex"` significa uma linha, tanto em um estilo quanto em uma classe (`flex`) e em Rust (`.flex()`), a menos que uma direção seja definida: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. Uma view sem `display` não precisa de nada para ser uma coluna.

<a id="sizes"></a>

## Tamanhos

| Propriedade | Valores | Rust |
|---|---|---|
| `width`, `height` | Pontos, uma porcentagem do pai (`"50%"`) ou `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, os passos `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Pontos ou porcentagens; `minWidth` / `minHeight` também aceitam `"auto"`, o menor tamanho do conteúdo | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | Largura dividida pela altura: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | Pontos ou porcentagens | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ... e os passos `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | Pontos, porcentagens ou `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

Em Rust, um comprimento é tipado: `px(16.0)` são 16 pontos, `relative(0.5)` é 50% do pai, `auto()` é `auto`. Os métodos de passo seguem a escala de espaçamento do Tailwind, de 4 pontos por passo (`.p_4()` são 16 pontos, `.gap_0p5()` são 2 pontos).

Sem um tamanho, uma view tem o tamanho do seu conteúdo (mais o preenchimento), esticada ao longo do eixo transversal do pai pelo `alignItems: "stretch"` padrão. As porcentagens são relativas ao tamanho do pai (para padding e margin, como no CSS, à sua largura).

`aspectRatio` define o tamanho da outra dimensão a partir da que é conhecida:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

Imagens dos assets do app têm um tamanho natural e são posicionadas com ele quando nenhum tamanho é informado ([Imagens e assets](./images-and-assets.md)). Imagens remotas não têm tamanho até serem carregadas: defina um para elas.

## Grid

`display: "grid"` (`.grid()` em Rust) posiciona os filhos em trilhas de grid do CSS:

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| Propriedade | Valores | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | Listas de trilhas do CSS: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, nomes de linha | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | Trilhas de colunas e linhas criadas implicitamente | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, um número ou nome de linha: `"content-start / content-end"`, `"2 col"` (a segunda linha chamada `col`), `"span col"` (até a próxima linha chamada `col`) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Números ou nomes de linha | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (números de linha) |
| `justifyItems`, `justifySelf` | Como os itens se posicionam em suas áreas ao longo da linha: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | Como os itens se posicionam em suas áreas ao longo da coluna | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | Como as trilhas se posicionam no grid ao longo da linha e da coluna | `.justify_*()` |

Os templates nomeiam suas linhas entre colchetes, com um ou vários nomes por linha, e os itens são posicionados por esses nomes, como no CSS (em Rust, pelos números das linhas):

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

Em um grid, `justifyContent` e `alignContent` têm como padrão o `"normal"` do CSS: trilhas dimensionadas com `auto` se esticam para preencher o contêiner, de modo que um grid com altura e sem template de linhas divide essa altura entre suas linhas. Um valor definido explicitamente (`"start"`, `"center"`, `"space-between"`, ...) posiciona as trilhas como no CSS. As classes de alinhamento definem exatamente o que o Tailwind CSS define: `content-start` (`align-content: flex-start`) e `place-content-start` agrupam as trilhas no início, e `content-normal` e `justify-normal` as esticam, como em um navegador.

`display: "block"` usa o layout de bloco do CSS (filhos empilhados, cada um tão largo quanto o contêiner), e `display: "none"` (`.hidden()`) remove a view do layout.

<a id="absolute-positioning"></a>

## Posicionamento absoluto

`position: "absolute"` (`.absolute()`) tira uma view do fluxo e a posiciona por `top`, `right`, `bottom` e `left`, relativos ao seu pai:

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

Os deslocamentos aceitam pontos e porcentagens (`.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)` em Rust). Uma view com `left` e `right` (ou `top` e `bottom`) e sem tamanho se estica entre eles. Irmãos posteriores são desenhados acima dos anteriores; `zIndex` (`.z_index(n)`) altera a ordem.

<a id="measuring"></a>

## Medição

`onLayout` (`.on_layout(..)`) informa o frame de uma view, relativo ao seu pai, após cada layout em que ele mudou:

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

O frame é dado em pontos: `Bounds<Points>` em Rust, `{ bounds }` em TSX, um `Bounds` (`{ origin: { x, y }, size: { width, height } }`). Para a janela inteira, leia `window()` em Rust ou `windowSize()` de [`nsh`](../modules/nsh.md#device) em TSX; ambos acompanham a rotação e o redimensionamento da janela, e um estilo que os lê muda junto com a janela:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Os breakpoints do Tailwind (`sm:`, `md:`, ...) e `portrait:` / `landscape:` dão o mesmo resultado sem código.

<a id="safe-areas"></a>

## Áreas seguras

A view raiz cobre a tela inteira, por baixo da barra de status e do indicador de início. Aplique às telas um preenchimento pelos insets da área segura com o `env()` do CSS (`paddingTop: "env(safe-area-inset-top)"`, Tailwind `pt-[env(safe-area-inset-top)]`, `.p_safe_area()` em Rust; veja [Área segura](../elements/safe-area.md)), ou leia os insets com `safe_area()` em Rust ou `safeArea()` / `safeAreaInsets()` em TSX e aplique-os você mesmo. As páginas de uma [pilha de navegação](./navigation.md) já ficam abaixo do seu cabeçalho.

<a id="right-to-left"></a>

## Da direita para a esquerda

A direção do layout do app segue o idioma do sistema, e o estilo `direction` de uma view (`"ltr"`, `"rtl"` ou `"inherit"`; `.direction(LayoutDirection::Rtl)` em Rust) define a direção da sua subárvore. Quando o app é posicionado da direita para a esquerda:

- as linhas correm a partir da direita;
- `left` e `right` mantêm seus lados, como em um navegador, tanto em chaves de estilo quanto em classes: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` e `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` permanecem à esquerda;
- as propriedades lógicas seguem a direção, sendo o início da linha o lado direito: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (`ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start` como classes; `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ... em Rust); `marginHorizontal` e `paddingHorizontal` definem ambos os lados;
- o texto com `textAlign: "auto"` é alinhado à direita, e os controles nativos são espelhados.

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

Mudanças na direção, do idioma ou de uma view, são aplicadas imediatamente, sem reiniciar. O estilo `direction` também mantém uma view e seus filhos em uma direção própria, por exemplo um número de telefone da esquerda para a direita. No Android, apps que incorporam o NSH precisam de `android:supportsRtl="true"` no manifesto para que os controles nativos sejam espelhados.

<a id="related"></a>

## Relacionados

- [Estilização](./styling.md): como os estilos se combinam.
- [Rolagem](./scrolling.md) e [Listas](./lists.md): conteúdo maior que a tela.
- [Referência de estilos](../modules/style-reference.md): cada propriedade de layout e seu tipo.
