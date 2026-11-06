---
title: "Plot"
description: "O componente Plot de nsh/base/plot, suas marcas Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey e Treemap, seus PlotAxis e PlotLabel: gráficos desenhados nativamente a partir das linhas do app, com as escalas dos eixos e seus rótulos, textos nos pontos de dados, a linha, célula ou fatia sob o ponteiro, movimento e nenhum visual próprio."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

Um plot é a moldura de um gráfico: as linhas de dados que ele mostra, as escalas dos eixos x e y, o ponteiro sobre ele e o seu movimento. Suas marks desenham o que ele guarda: `Line` por uma série, `Area` entre uma série e uma linha de base, `Bar` por linha nas bandas de uma escala de bandas, `Rule` por linha de um início a um fim (o pavio de um candle), `Dot` por linha onde dois de seus valores se encontram (os pontos de um scatter, as bolhas de um gráfico de bolhas), `Cell` por linha nas bandas de duas categorias, colorida por seu valor (um heatmap), `Grid` de linhas atravessando, `Pie` das participações das linhas (um donut com um furo), `Arc` entre dois ângulos e `RadialLine` ao redor do centro com os anéis e os raios de `RadialGrid` atrás dele (um radar), `Sankey` de fluxos entre as linhas e `Treemap` de retângulos aninhados, com a área de cada folha igual ao seu valor (um mapa de mercado); `PlotAxis` rotula uma borda com os ticks de sua escala e `PlotLabel` escreve textos em pontos das escalas. Cada mark é um canvas que preenche o plot, desenhado nativamente a partir das linhas: as linhas do app são lidas uma única vez, quando ele as define, e depois escaladas, gravadas e desenhadas em Rust, de modo que um gráfico de mil pontos não executa nenhum JS por ponto. O ponteiro também é acompanhado em Rust: a linha de cruzamento, os pontos e o tooltip do hover se movem e aparecem e desaparecem gradualmente no animador da plataforma, e o app só fica sabendo de uma nova linha, nada além disso. A aparência é do app: as marks são pintadas com as propriedades de pintura do CSS para formas SVG (`stroke-*`, `fill-*`), `currentColor` onde nenhuma está definida, uma área ou uma barra mostra um fundo (um gradiente, `bg-linear-*`) dentro de sua forma, e as partes do hover (entre elas o ponto de cada mark) e os rótulos, as marcas de tick e as linhas dos eixos podem ser estilizados e preenchidos pelo app.

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis` e `PlotLabel` vêm de `nsh/base/plot`, um módulo próprio de [`nsh/base`](../modules/nsh-base.md) (em Rust, `nsh_base::plot`). Em TypeScript, as props de um plot são genéricas sobre o tipo de suas linhas: os nomes de campos são verificados em relação a elas, e uma função de uma linha recebe o tipo da linha. Em Rust, `plot()` cria um com um setter por prop, as linhas são um `Rows` (colunas de números por chave), os valores são um `RowAccessor` (uma chave ou uma função do índice da linha) e as marks recebem os métodos de pintura tipados (`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`).

## Plot

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (obrigatório) | As linhas, um objeto por ponto. As marks leem seus valores uma única vez, quando o app define as linhas; uma linha sem valor (um campo que não é um número, `null`) é ignorada. |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | o índice da linha | O que posiciona uma linha ao longo do eixo x em uma escala x `linear`. Uma escala `point` posiciona as linhas em ordem. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | nenhum | O que as marks desenham, a menos que nomeiem o seu próprio valor. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | Como o eixo x posiciona as linhas: `point` (em ordem, de forma uniforme da borda esquerda até a direita; uma única linha fica no meio), `linear` com um `domain` opcional, ou `band` (uma banda por linha, para barras, [Bar](#bar); ou uma banda por categoria, para células, [Cell](#cell)). Com uma escala y `band`, o padrão é `linear`, para barras horizontais. `reverse: true` a percorre a partir da borda direita ([Escalas invertidas](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | Como o eixo y posiciona os valores: o menor valor do domínio na borda inferior, o maior na borda superior. Sem um `domain`, a extensão do que as marks desenham. `band` distribui uma banda por linha a partir da borda superior para baixo, para barras horizontais. `reverse: true` a percorre no sentido oposto: o menor valor na borda superior, as linhas da borda inferior para cima ([Escalas invertidas](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | nenhum | Uma segunda escala y, `{ type: "linear", domain?, reverse? }`, para as marks que a nomeiam (`scale="y2"`): a escala da direita de um gráfico de eixo duplo ([Eixos duplos](#dual-axes)). Sem um `domain`, a extensão dos valores nela. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | Enquanto nenhuma das escalas y nomear um domínio e houver marks em ambas, as duas são ampliadas para os mesmos passos arredondados, de modo que seus ticks caiam nas mesmas linhas ([Eixos duplos](#dual-axes)). `false` mantém cada uma com a extensão de seus valores. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | O plot acompanha o ponteiro e o teclado: ele informa a linha sob o ponteiro e mostra as partes do hover, e é uma parada do Tab cujas teclas de seta movem o hover ([Teclado](#keyboard)). `false` desenha apenas as marks (um sparkline em uma lista), e os toques nele vão para as views ao redor. Se o plot oferece o teclado ou não é definido quando ele é criado. |
| `motion` | `.motion(..)` | `PlotMotion` | nenhum | O tempo do appear, o fade in e out do hover e a mola sobre a qual o hover desliza quando as teclas o movem (abaixo). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | nenhum | Ativa o appear: as marks são desenhadas progressivamente quando o plot é exibido pela primeira vez, e novamente sempre que este valor muda (outro símbolo, outro período). Dentro de um [`PlotAppearScope`](#plotappearscope), uma geração que terminou ali é exibida inteira de uma só vez. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem sobre o gráfico: o que ele mostra e o que se destaca. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | nenhum | O que os leitores de tela ouvem como seu valor: as palavras do app para a linha sob o ponteiro. |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A linha de cruzamento: uma view tão alta quanto o plot, centralizada na linha sob o ponteiro. Em uma escala de bandas, ela fica na banda da linha, com a mesma largura da banda (atravessando o plot em uma escala y de bandas). |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Os pontos do hover: uma view por `Line`, `Area` e `RadialLine`, centralizada em seu ponto na linha sob o ponteiro, e a de um `Dot` tão grande quanto o seu ponto sob o ponteiro. O `hoverDotClass` / `hoverDotStyle` de uma mark os substitui para o seu próprio ponto. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | nenhum | O tooltip do app, posicionado por `tooltipPlacement` e movido e esmaecido junto com a linha de cruzamento. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | Onde o tooltip fica: no topo do plot, centralizado na linha de cruzamento; ou ao lado do ponteiro, no lado da linha de cruzamento voltado para o meio do plot, abaixo do ponteiro na metade superior e acima dele na inferior. No topo, ele permanece entre as bordas esquerda e direita do plot (seu deslocamento a partir da borda superior é do app: uma etiqueta sob o plot assume a altura do plot e mais um pouco); ao lado do ponteiro, ele permanece dentro do plot. Com o teclado, ele vai ao lado do ponto da primeira linha ou área na linha (o meio da banda de uma barra, o meio da fatia de uma pie). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | A distância entre o tooltip e o que o posiciona: a borda superior para `"top"`, a linha de cruzamento e o ponteiro para `"pointer"`. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | nenhum | As cores das marks: das categorias que seu `color` lê, como o `scaleOrdinal` do d3 (`{ type: "ordinal", domain?, range, unknown? }`, [Cores por categoria](#colors-by-category)), ou dos números que o `value` de um `Cell` lê ao longo de uma rampa, como `scaleSequential` e `scaleDiverging` do d3 (`{ type: "sequential" \| "diverging", … }`, [Cores ao longo de uma rampa](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | nenhum | As marks, desenhadas em ordem umas sobre as outras, e o que quer que o app coloque sobre elas. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O tamanho e a aparência do plot; as marks herdam suas propriedades de pintura, como o CSS as herda. As classes `focus:` / `focus-visible:` e `focusStyle` desenham seu anel de foco. |

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | O ponteiro passou para outra linha: o índice da linha mais próxima dele ao longo do eixo x (ao longo do eixo y quando apenas ele tem bandas), da fatia do [pie](#pie-and-arc) sob ele, do [dot](#dot) cujo centro está mais próximo dele, da [cell](#cell) sob ele (no espaço entre duas células, a mais próxima) ou da linha de uma [radial line](#radialline-and-radialgrid) mais próxima dele por ângulo; `null` quando ele sai do plot (sobre um pie, suas fatias; sobre uma radial line, seu raio externo). |

`Scale` é `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear`
O `domain` de uma escala linear é a extensão de seus dois valores, em qualquer ordem; um domínio de um único valor o coloca no meio. O
`domain` de uma escala `band` são as categorias de suas bandas, em ordem ([Cell](#cell)); suas outras opções estão em [Bar](#bar).

Uma função de uma linha (`y={(d) => d.high - d.low}`) é chamada uma vez por linha quando as linhas ou a função mudam, no
próximo turno, nunca enquanto o plot desenha ou acompanha o ponteiro: mantenha-a pura (a mesma linha, o mesmo número). O nome
de um campo é lido sem nenhum JS.

<a id="reversed-scales"></a>

### Escalas invertidas

`reverse: true` percorre uma escala a partir da outra borda, como as escalas do visx aceitam `reverse` e as do d3 aceitam um range escrito
de trás para frente. No eixo x, a primeira linha, ou o menor valor do domínio, fica na borda direita; no eixo y, o
menor valor do domínio fica na borda superior e as linhas vão da borda inferior para cima. Tudo o que é posicionado na escala
a acompanha: as marks, a base das barras e o sentido em que crescem, a linha de base de uma área, as linhas de grade, os ticks de `PlotAxis`,
a linha que o hover encontra, as teclas de seta ([Teclado](#keyboard)) e as transições para um novo domínio. As barras pendem da borda
superior em uma escala y `linear` invertida, e as barras horizontais crescem para a esquerda a partir da borda direita em uma escala x `linear`
invertida:

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

Com o appear do plot, linhas e áreas são desenhadas progressivamente a partir da borda em que a escala x começa, a direita quando
ela está invertida.

<a id="dual-axes"></a>

### Eixos duplos

<!-- demo: el-plot-dual -->

Um plot tem uma segunda escala y para valores de outras unidades: volumes ao lado de um preço, receita ao lado de uma margem. Toda
parte que posiciona valores ao longo de y aceita `scale`: `"y"` (o padrão, o `yScale` do plot) ou `"y2"` (seu `y2Scale`). Um
`PlotAxis` à direita com `scale="y2"` o rotula:

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

O domínio de cada escala é o seu próprio: o `domain` do app, ou a extensão dos valores nela, e cada uma se move para um novo domínio
com `motion.update`. Enquanto nenhuma das escalas nomear um domínio, o plot distribui ambas no mesmo número de passos arredondados (1,
2 ou 5 vezes uma potência de dez, um passo para cada 32 pontos de altura, aproximadamente): quando ambas contêm zero, o zero cai na mesma
linha nas duas; caso contrário, uma escala que começa em zero (volumes) ganha seus passos extras para cima e a outra (um preço) em
ambos os lados. Os ticks dos eixos são esses passos, e um `Grid` sem `x` nem `y` desenha suas linhas neles, de modo que uma única
grade atende a ambos os eixos. `alignTicks={false}` desativa isso; um `domain` nomeado pelo app deixa ambas as escalas como estão.

O hover encontra uma linha; o ponto de cada mark fica em sua própria escala, e a leitura é do app, que lê ambos os valores
da linha que `onHoverChange` informa. Barras em ambas as escalas ficam lado a lado em cada banda, e um `stack` empilha apenas as
barras da sua escala. `y2Scale` é linear: um plot cujo eixo y tem bandas não tem segunda escala y.
<a id="line-area-and-grid"></a>

## Line, Area e Grid

| Mark | Prop | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | o `y` do plot | O que ele desenha: um ponto por linha com valor, ignorando as linhas sem valor. |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | as linhas do plot | Linhas de uma série própria (outros valores de x), posicionadas nas escalas do plot pelo seu próprio `x` (o índice da linha, sem ele). |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | Como ele conecta seus pontos: uma curva suave, segmentos retos ou degraus que mantêm cada valor até a linha seguinte. A borda inferior de uma área segue a mesma curva. |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Um ponto em cada ponto de dados: uma view centralizada nele, cujo tamanho, fundo e borda são definidos pelo app. |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` do plot | Seu ponto de hover, sobre o ponto da linha sob o ponteiro: o ponto de cada série na sua própria cor. Cada um substitui o do plot para este mark (a cor do mark sobre o tamanho e o anel do plot); `hidden` não mostra nenhum. |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | nenhum | Seu fundo: uma caixa em volta da sua forma (do primeiro ao último ponto, do ponto mais alto até a linha de base, ou até o ponto mais baixo da borda inferior em uma faixa) cujo fundo (`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`) aparece apenas dentro da forma, sob o seu `fill`. Com um fundo, `fill` é `none` onde nenhum estiver definido. |
| `Area` | `y1` | `string \| (d, index) => number` | o `y` do plot | O que forma a sua borda superior. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | a borda inferior da escala y | Sua borda inferior: um número é uma linha de base na escala y; um campo ou uma função dá a cada linha seu próprio valor inferior, o que transforma a área em uma faixa (do mínimo ao máximo de um dia, o intervalo de uma previsão). Sem ele, a área se fecha na borda onde ficam os menores valores da escala y: a borda inferior, ou a superior em uma escala invertida (uma área pendurada no topo). Uma linha sem valor em qualquer uma das bordas é ignorada. |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | A escala y ao longo da qual seus valores se distribuem: o `yScale` do plot ou o segundo, `y2Scale` ([Eixos duplos](#dual-axes)). |
| `Grid` | `x` | `number[]` | nenhum | Onde ficam suas linhas verticais, como valores da escala x (índices de linha em uma escala `point`). |
| `Grid` | `y` | `number[]` | nenhum | Onde ficam suas linhas horizontais, como valores da escala y. Sem `x` nem `y`, as linhas seguem as marcações da sua escala, onde um `PlotAxis` sem `ticks` as coloca (ao longo de x para barras horizontais). |
| `Grid` | `ticks` | `number` | o padrão do eixo | Aproximadamente quantas linhas ele desenha sem `x` nem `y`, como o `ticks` de um `PlotAxis`. |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | nenhum | A categoria de suas linhas, cuja cor vem do `colorScale` do plot: a categoria da primeira linha define o `stroke` da linha (o `fill` da área) onde nada o definir ([Cores por categoria](#colors-by-category)). |

Cada mark preenche o plot e pinta com suas [propriedades de pintura SVG](../modules/style-reference.md#svg-paint), as suas próprias
sobre as do plot, como o CSS as herda:

| Mark | Pinta com | Onde nenhuma estiver definida |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 de largura, sólida |
| `Area` | `fill` (sobre a sua parte `background`); sua borda superior `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor` (`none` ao lado de um fundo); sem traço |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 de largura, sólida; cada linha em pixels inteiros do dispositivo, de modo que uma linha fina permanece nítida |

Os valores que um `Line` ou um `Area` desenha, e também os `y0` de uma área (sua linha de base, ou o valor inferior de cada linha), formam o
domínio da escala y quando o plot não tem um; os de um grid não formam. Um mark só é redesenhado quando muda o que ele desenha (suas linhas,
valores, curva, o tamanho ou as escalas do plot, sua pintura); o ponteiro move as partes do hover e nunca redesenha um mark.

Uma faixa é uma `Area` cujo `y0` lê as linhas: sua borda superior percorre `y1`, sua borda inferior volta por `y0`, ambas
com o `curve` da área, e o appear desenha as duas a partir da borda de início. Seu ponto de hover fica na borda superior; um
`Line` sobre ela marca o valor do meio:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` é o do CSS, como em um navegador: uma cor. Um gradiente sob uma linha é o fundo de uma área, do mesmo modo que uma página exibe um
gradiente em uma forma (o `background-image` de uma caixa sob `clip-path`): `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` esmaece do ponto mais alto da área até a sua linha de base, com os tokens do tema e as cores da aparência
como o fundo de qualquer view.

## Bar

Um `Bar` desenha uma barra por linha na faixa da linha em uma escala `band`: na vertical em uma escala x de faixas, na horizontal em uma escala y de faixas
(a escala x então `linear`). Cada barra vai de `base` até o valor da linha na outra escala, de modo que um valor negativo
cresce para o outro lado, e uma linha sem valor não tem barra. Em uma escala de valores invertida, as barras crescem para baixo a partir da borda
superior ou para a esquerda a partir da direita, e uma escala de faixas invertida coloca a faixa da primeira linha à direita ou embaixo
([Escalas invertidas](#reversed-scales)).

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

Barras fora de uma pilha ficam lado a lado em cada faixa, na ordem dos marks; barras com o mesmo `stack` se empilham,
e a barra de cada linha começa onde termina a anterior na pilha:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | o `y` do plot | O que cada barra mostra. |
| `base` | `number \| string \| (d, index) => number` | `0` | O valor a partir do qual suas barras crescem, na escala de valores: um para todas as linhas, ou um campo ou função que dá a cada linha o seu próprio, de modo que cada barra vá da base da linha até o seu valor (uma linha sem base não tem barra). Ele conta no domínio. Uma pilha cresce a partir da base da sua primeira barra, linha por linha. |
| `stack` | `string` | nenhum | A pilha em que ele entra: as barras com o mesmo `stack` se empilham em ordem (uma linha sem valor não adiciona nada). |
| `scale` | `"y" \| "y2"` | `"y"` | A escala y ao longo da qual vão os valores de suas barras verticais ([Eixos duplos](#dual-axes)); barras em ambas ficam lado a lado, e uma pilha empilha apenas as barras da sua escala. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | O raio de cada canto de suas barras; `{ topLeft: 4, topRight: 4 }` arredonda as pontas das barras verticais. Um raio maior que a metade de uma barra se ajusta a ela. |
| `stagger` | `number` | `0` | Com o appear do plot, as barras começam uma após a outra, linha por linha, ao longo desta fração dele (0 a 0,95), e cada uma cresce durante o restante; 0 faz todas crescerem juntas. |
| `inactiveOpacity` | `number` | nenhum | A opacidade de suas barras fora da linha sob o ponteiro enquanto o ponteiro está sobre o plot, para que essa linha se destaque: ela surge e desaparece gradualmente com o hover e passa de barra em barra junto com ele. |
| `label` | `string \| (d, index) => string` | nenhum | O texto na extremidade de valor de cada barra: um campo (seu texto ou seu número) ou uma função que retorna o texto formatado pelo app. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | nenhum | A parte `label`: um texto centralizado na barra, acima da extremidade de uma barra vertical (abaixo de uma que cresce para baixo), depois de uma barra horizontal (antes de uma que cresce para trás). Seu padding é a sua distância da barra. |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | nenhum | Seu fundo: a caixa de cada barra, cujo fundo (`bg-linear-to-t from-… to-…`, da base da barra até o seu topo) aparece apenas dentro da barra, sob o seu `fill`. Com um fundo, `fill` é `none` onde nenhum estiver definido. |
| `color` | `string \| (d, index) => string` | nenhum | A categoria de cada barra, cuja cor vem do `colorScale` do plot: o `fill` da barra onde nada o definir ([Cores por categoria](#colors-by-category)). |

A escala de faixas distribui uma faixa por linha do plot, em ordem, ou uma faixa por categoria do seu `domain`, como faz o `scaleBand` do d3:

| Opção | Padrão | Descrição |
|---|---|---|
| `domain` | nenhum | As categorias de suas faixas, em ordem (o `scaleBand().domain()` do d3): um [`Cell`](#cell) vai na faixa da categoria da sua linha, e um `PlotAxis` escreve a categoria de cada faixa; uma categoria escrita duas vezes mantém o seu primeiro lugar. Sem ele, as faixas são as linhas ou, sobre células, as categorias que as células nomeiam ao longo do eixo, na ordem em que as linhas as trazem. |
| `paddingInner` | `0` | O espaço entre faixas vizinhas, uma fração do passo de cada faixa (0 a 1). |
| `paddingOuter` | `0` | O espaço antes da primeira faixa e depois da última, uma fração de um passo. A metade de `paddingInner` coloca o meio das faixas em passos iguais ao longo do plot. |
| `maxBandWidth` | nenhum | A maior largura que uma faixa pode ter, em pontos: poucas faixas em um plot largo permanecem estreitas, cada uma no meio do seu lugar. |
| `bandCount` | as linhas | As faixas para as quais o eixo é organizado quando há mais do que as linhas: as linhas ocupam as primeiras e mantêm sua largura e seu lugar à medida que as linhas chegam. |
| `groupPadding` | `0` | O espaço entre as barras lado a lado em uma faixa, uma fração do lugar de cada barra. |
| `reverse` | `false` | As faixas correm a partir da outra borda: a da primeira linha à direita do eixo x, embaixo no eixo y; as barras lado a lado em uma faixa mantêm sua ordem. |

Uma barra pinta com seu `fill` (`fill-*`; herdado do plot como o CSS herda), `currentColor` onde nenhum estiver definido
(a cor da sua categoria com `color`), e não mostra ponto de hover. Em uma escala de faixas, o hover encontra a faixa sob o ponteiro, e a linha de cruzamento do plot fica
nessa faixa, com a mesma largura dela: `crossLineClass="w-full h-full bg-foreground/5"` tinge a faixa, `w-px` mantém uma linha no
meio. Os valores e a base das barras formam o domínio da escala de valores quando o plot não tem um. Com o appear do plot, cada
barra cresce a partir da base da sua pilha; o movimento, o esmaecimento e o deslizamento rodam no animator da plataforma, e o
ponteiro não redesenha nenhuma barra.

### Ranges

<!-- demo: el-plot-ranges -->

Com `base` sendo um campo ou uma função, cada barra abrange dois valores da sua linha: o degrau de uma cascata (waterfall) do total acumulado
antes dele até o total depois, o corpo de uma vela do seu valor de abertura ao de fechamento, uma tarefa do seu início ao seu fim. Uma barra cresce
a partir da sua própria base ao aparecer, e seu rótulo fica na extremidade de valor, acima de uma barra que sobe e abaixo de uma que desce.

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

Um funil é feito de barras horizontais, centralizadas: `base={(d) => -d.users / 2}` e `value={(d) => d.users / 2}` em uma escala y de faixas.

## Rule

Um `Rule` desenha uma linha reta por linha ao longo do eixo de valores, de `base` até o valor da linha: no meio da faixa
da linha em uma escala de faixas (através do plot em uma escala y de faixas), na posição da linha ao longo do eixo x em uma escala de pontos ou
linear. O pavio de uma vela, o bigode de um box plot, uma barra de erro e a haste de um lollipop são rules; um candlestick é um `Bar` sobre
um `Rule`:

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | o `y` do plot | Onde cada linha termina. Uma linha sem valor não tem traço. |
| `base` | `number \| string \| (d, index) => number` | `0` | Onde cada linha começa: um valor para todas as linhas (a haste de um lollipop a partir da linha zero), ou um campo ou função que dá a cada linha o seu próprio (o mínimo de uma vela). Ele conta no domínio. |
| `scale` | `"y" \| "y2"` | `"y"` | A escala y ao longo da qual vão os seus valores ([Eixos duplos](#dual-axes)). |
| `stagger` | `number` | `0` | Com o appear do plot, as linhas começam uma após a outra, linha por linha, ao longo desta fração dele (0 a 0,95), e cada uma cresce a partir do seu início durante o restante. |
| `inactiveOpacity` | `number` | nenhum | A opacidade de suas linhas fora da linha sob o ponteiro enquanto o ponteiro está sobre o plot, como a de `Bar`. |
| `color` | `string \| (d, index) => string` | nenhum | A categoria de cada linha, cuja cor vem do `colorScale` do plot: o `stroke` da linha onde nada o definir. |

Uma rule traça com seu `stroke` (`stroke-*`, `strokeWidth`, `strokeDasharray`; herdado do plot como o CSS
herda), `currentColor` onde nenhum estiver definido, e não mostra ponto de hover. Seus valores e sua base formam o domínio da escala de valores quando
o plot não tem um; ela cresce a partir do seu início com o appear do plot e acompanha os domínios das escalas, no
animator da plataforma.
## Dot

<!-- demo: el-plot-dots -->

A marca `Dot` desenha um ponto por linha onde dois valores da linha se encontram: seu `x` ao longo de uma escala x `linear` e seu `value` ao longo do eixo y formam um gráfico de dispersão; em uma escala x de bandas, cada ponto fica no meio da banda de sua linha; em uma escala y de bandas (a escala x `linear`), seu valor corre ao longo de x e a banda de sua linha desce pelo gráfico, um dot plot. Seu raio `r` é um único número para todos os pontos, ou um valor de cada linha que `rScale` transforma em raio, um gráfico de bolhas. Uma linha sem valor não tem ponto.

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

Com `r` sendo um campo ou uma função, o valor de cada linha define o tamanho de seu ponto. `rScale={{ type: "sqrt", range: [min, max] }}` mapeia as raízes quadradas dos valores em raios em pontos, como o `scaleSqrt` do d3 faz, de modo que, com um intervalo a partir de 0, a área de uma bolha é proporcional ao seu valor; um intervalo a partir de mais que 0 mantém as menores bolhas visíveis. O domínio vai de 0 ao maior valor, a menos que a escala indique um. Os pontos maiores são desenhados primeiro, para que os menores continuem visíveis sobre eles:

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

Os valores de um ponto formam o domínio da escala de valores quando o gráfico não tem nenhum, sem se estender até 0, de modo que os eixos de um gráfico de dispersão se ajustem aos seus pontos. Dê ao gráfico `domain` com alguma folga ao redor dos valores quando os pontos forem grandes: uma bolha na borda do domínio é desenhada além da borda do gráfico.

Duas marcas nas mesmas bandas formam os gráficos que comparam dois valores de uma linha: um lollipop é um `Rule` de 0 sob um `Dot` em seu valor, e um dumbbell é um `Rule` de um valor ao outro com um `Dot` em cada extremidade, em uma escala y de bandas:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` do gráfico | Onde cada ponto fica ao longo do eixo de valores: no eixo y ou, em uma escala y de bandas, ao longo de x. Uma linha sem valor não tem ponto. |
| `r` | `number \| string \| (d, index) => number` | `3` | O raio dos pontos em pontos, ou um campo ou função que dê a cada linha um valor que `rScale` transforma em raio (sem ele, o valor é o raio). Uma linha cujo valor está ausente não tem ponto. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | nenhum | Como os valores de `r` viram raios: suas raízes quadradas sobre o `domain` (de 0 ao maior valor, se não houver um) para o `range` de raios, de modo que um intervalo a partir de 0 torna a área de cada ponto proporcional ao seu valor. Valores fora do domínio assumem os extremos do intervalo. |
| `stagger` | `number` | `0` | Com o appear do gráfico, os pontos começam a crescer um após o outro, linha por linha, ao longo desta fração dele (0 a 0.95); 0 os faz crescer juntos. |
| `inactiveOpacity` | `number` | nenhum | A opacidade dos demais pontos enquanto um está sob o ponteiro ou as teclas: eles esmaecem e voltam com o hover. |
| `color` | `string \| (d, index) => string` | nenhum | A categoria de cada ponto, cuja cor vem de `colorScale` do gráfico: o `fill` do ponto onde nada define uma ([Cores por categoria](#colors-by-category)). |
| `hitRadius` | `number` | `8` | Até que distância além da borda de um ponto o ponteiro ainda o encontra: entre os pontos dentro dessa distância, o ponteiro encontra aquele cujo centro está mais próximo dele (células de Voronoi), de modo que uma bolha pequena sobre uma grande é encontrada ao redor de seu próprio centro. A linha de um dot plot é encontrada de qualquer ponto ao longo dela com um raio tão grande quanto uma linha. |
| `scale` | `"y" \| "y2"` | `"y"` | A escala y ao longo da qual seus valores correm ([Eixos duplos](#dual-axes)); pontos em uma escala y de bandas põem seus valores ao longo de x. |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` do gráfico | A parte `hoverDot`: uma view tão larga e alta quanto o ponto sob o ponteiro, centralizada nele. `rounded-full outline-2 outline-offset-1` a contorna; `hidden` não mostra nenhuma para esta marca. |

Um ponto é preenchido com seu `fill` (`fill-*`; herdado do gráfico como o CSS herda), `currentColor` quando nenhum é definido (a cor de sua categoria com `color`), e é contornado com seu `stroke` quando um é definido (`stroke-*`, `strokeWidth`): um anel na cor do card mantém separados os pontos sobrepostos. Em um gráfico com pontos, o gráfico informa a linha do ponto cujo centro está mais próximo do ponteiro (`null` longe de todos os pontos), as teclas percorrem as linhas em sua ordem (ordene as linhas por x, e as teclas percorrem os pontos da esquerda para a direita), e a parte `hoverDot` marca o ponto. Com o appear do gráfico, os pontos crescem a partir do nada; com `motion.update`, eles se movem para seus novos valores e tamanhos, o ponto de uma nova linha cresce e o ponto de uma linha removida encolhe até sumir; tudo no animator da plataforma, sem nenhuma marca redesenhada.

## Cell

<!-- demo: el-plot-cells -->

A marca `Cell` desenha um retângulo por linha em duas bandas ao mesmo tempo: a banda de sua categoria `x` ao longo de uma escala x `band` e a banda de sua categoria `y` ao longo de uma escala y `band`, de modo que as linhas formam uma grade, um heatmap. Uma matriz de correlação, um calendário de retornos mensais e uma semana de negociações por hora são células. Cada célula preenche suas duas bandas, de modo que `paddingInner` e `paddingOuter` das escalas são os espaços entre e ao redor das células. Sua cor é seu `value` ao longo de `colorScale` do gráfico, uma rampa de cores ([Cores ao longo de uma rampa](#colors-along-a-ramp)), ou a cor de sua categoria `color` por meio de uma escala ordinal. As células ficam nas escalas x e y do gráfico.

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

O `domain` de uma escala de bandas nomeia as categorias de suas bandas em ordem, como o `scaleBand().domain()` do d3 faz: os meses de um calendário de janeiro a dezembro, cada um com sua banda, tenham ou não chegado suas linhas, de modo que março de 2026 acima é um espaço em branco na grade. Sem um domínio, as bandas são as categorias que as células nomeiam ao longo do eixo, na ordem em que as linhas as trazem (2025 acima de 2026). Um `PlotAxis` ao longo de uma escala de bandas de categorias escreve a categoria de cada banda, sem `format`.

Uma matriz de correlação nomeia os mesmos ativos ao longo dos dois eixos, com seu `domain` cobrindo todo o intervalo dos coeficientes, de modo que um coeficiente 0 assume o meio da rampa, quaisquer que sejam os ativos:

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | nenhum | A coluna de cada linha: um campo (seu texto ou seu número) ou uma função que retorna a categoria. A célula da linha vai na banda dessa categoria da escala x; uma linha sem categoria não tem célula. |
| `y` | `string \| (d, index) => string` | nenhum | A fileira de cada linha, como `x` ao longo da escala y. |
| `value` | `string \| (d, index) => number` | nenhum | O número de cada célula, que um `sequential` ou `diverging` `colorScale` transforma em sua cor. Uma linha sem número assume a cor `unknown` da escala e, sem ela, não tem célula. |
| `color` | `string \| (d, index) => string` | nenhum | A categoria de cada célula, cuja cor vem de um `ordinal` `colorScale` ([Cores por categoria](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | O raio de cada canto de suas células. |
| `stagger` | `number` | `0` | Com o appear do gráfico, as células começam a crescer uma após a outra, linha por linha, ao longo desta fração dele (0 a 0.95), cada uma a partir do meio no restante do tempo; 0 as faz crescer juntas. |
| `inactiveOpacity` | `number` | nenhum | A opacidade das demais células e de seus rótulos enquanto uma está sob o ponteiro ou as teclas: elas esmaecem e voltam com o hover. |
| `label` | `string \| (d, index) => string` | nenhum | A parte `label`: um texto no meio de cada célula, um campo (seu texto ou seu número) ou uma função que retorna o texto que o app formata. Cada rótulo aparece onde seu tamanho já diagramado cabe dentro da célula, de modo que um gráfico estreito mostra apenas as cores. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | nenhum | A fonte, o tamanho e a cor dos rótulos. Um rótulo em uma célula cuja cor `colorScale` é escura tem o atributo `data-dark` (onde o texto claro é mais legível), de modo que `data-dark:text-white` o escreve em cor clara ali. |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | nenhum | A parte `hoverCell`: uma view do tamanho da célula sob o ponteiro ou as teclas, sobre ela; `rounded-sm outline-2 outline-foreground` a contorna. Ela se move com o ponteiro no mesmo frame e desliza na spring `pointer` quando as teclas a movem. |

Uma célula é preenchida com sua cor de `colorScale` do gráfico quando o app não define `fill` (as classes e estilos `fill-*` vêm primeiro, herdados do gráfico como o CSS os herda), `currentColor` quando nada define uma, e é contornada com seu `stroke` quando um é definido. Em um gráfico com células, o gráfico informa a linha da célula sob o ponteiro e, no espaço entre duas células, a mais próxima; as teclas de seta percorrem a grade como ela aparece na tela ([Teclado](#keyboard)), e os leitores de tela percorrem as linhas em sua ordem. Com o appear do gráfico, as células crescem a partir do meio; com `motion.update`, a cor de uma célula desliza para a nova, a célula de uma nova linha cresce, a célula de uma linha removida encolhe até sumir, e as células se movem para suas novas bandas; tudo no animator da plataforma, sem nenhuma marca redesenhada.
<a id="pie-and-arc"></a>

## Pie e Arc

Um `Pie` divide uma volta em uma fatia por linha, cada uma com sua parte dos valores das linhas, no sentido horário a partir das 12 horas, na ordem das linhas, em torno do centro do plot. Um `innerRadius` o transforma em donut. Cada fatia é um canvas próprio, a parte `slice`, então cada uma pinta com suas próprias classes: `sliceClass` são as mesmas classes em todas as fatias, ou uma função da linha da fatia que dá a cada uma as suas. Sobre um pie, o plot informa a linha da fatia sob o ponteiro (nenhuma no buraco ou fora do anel), seu tooltip segue o ponteiro, e essa fatia cresce em `hoverLift` enquanto as outras esmaecem em `hoverDim`, no animator da plataforma com o `motion` do plot. Um `Arc` desenha um setor entre dois ângulos: a trilha e o valor de um gauge, ou um anel atrás de um pie.

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| Mark | Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | o `y` do plot | Quanto vale cada linha. Uma linha que vale zero, menos que zero ou que não tem número não gera fatia. |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radianos) | `0`, `2 * Math.PI` | Onde a primeira fatia começa e onde a última termina (as extremidades de um arc): radianos a partir das 12 horas, no sentido horário. Um `endAngle` abaixo de `startAngle` distribui as fatias de um pie no sentido contrário. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (radianos) | `0` | O ângulo entre fatias vizinhas na borda externa. Cada intervalo mantém essa largura (cerca de `padAngle * outerRadius` pontos) em qualquer raio, com as bordas paralelas, de modo que é tão largo no centro ou no buraco quanto na borda; uma fatia estreita demais para alcançar o centro termina onde suas bordas se encontram. Um pie de uma só fatia não tem intervalo. |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Os raios do buraco e da borda externa: em pontos, ou em porcentagem do maior círculo que o plot comporta (metade de seu lado menor). |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | O raio dos cantos de cada fatia (de um arc), em pontos, como o `arc.cornerRadius` do d3: cada canto é um círculo que toca a aresta e a borda externa ou o buraco, incluindo as bordas paralelas dos intervalos. Vale no máximo metade da espessura do anel, o que dá a um arc extremidades arredondadas, e em uma fatia estreita demais para dois cantos inteiros eles se encontram no meio dela. Um anel completo mantém apenas suas bordas arredondadas. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | nenhum | As classes de cada fatia (`fill-*`, `stroke-*`): as mesmas em todas as fatias, ou uma função da linha da fatia e de seu índice, chamada uma vez por linha quando as linhas ou a função mudam. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo de todas as fatias, acima de suas classes (`fill`, `stroke`, `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | Quanto a fatia sob o ponteiro cresce além das outras, em pontos: na spring `pointer` do plot, com fade de entrada e de saída acompanhando o hover. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (0 a 1) | `0` | Quanto as outras fatias esmaecem enquanto uma está sob o ponteiro, como fração de sua opacidade, com o fade do hover. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | nenhum | A categoria de cada fatia, sua cor vinda do `colorScale` do plot: o `fill` da fatia quando nada define uma ([Cores por categoria](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | nenhum | O texto ao lado de cada fatia: um campo (seu número) ou uma função que retorna o texto que o app formata. Uma linha cujo texto é vazio, ou uma fatia mais estreita que meio grau, fica sem texto. |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | A parte `label`: um texto fora do anel, na ponta de sua linha-guia, centralizado nela, depois dela na metade direita do pie e antes dela na esquerda. Seu padding é a distância até a ponta da linha. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | Quanto além da borda externa ficam os rótulos, em pontos. |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | nenhum | A parte `labelLine`: a linha-guia de cada rótulo, da borda externa no meio da fatia até o raio do rótulo, e então até o texto. Seu `stroke` (`currentColor` quando nenhum é definido), `strokeWidth` e `strokeDasharray`, iguais em todas as linhas ou uma função da linha da fatia; aparece quando recebe estilo. |

Uma fatia e um arc são preenchidos com `fill` (`currentColor` quando nenhum é definido, a cor da categoria da fatia com `color`) e têm suas bordas traçadas com `stroke` (nenhum quando nenhum é definido), os seus próprios sobre os do pie e os do plot, conforme o CSS os herda: um traço na cor da superfície (`stroke-card stroke-2`) também abre intervalos entre as fatias. Seus valores não participam das escalas do plot. As fatias de um pie só são desenhadas de novo quando as linhas, seus valores, os ângulos, os raios ou o tamanho do plot mudam; o ponteiro move a elevação e o fade no animator.

Plots com um pie normalmente posicionam o tooltip junto ao ponteiro (`tooltipPlacement="pointer"`), já que as linhas de um pie não têm lugar ao longo de um eixo: a linha de cruzamento e o tooltip seguem o ponteiro sobre ele, e ele não mostra pontos de hover. O centro de um donut é um elemento do próprio app sobreposto ao plot (o valor da fatia sob o ponteiro, ou o total), e o mesmo vale para sua legenda, com cada marcador na cor de sua fatia.

Os rótulos de um pie nomeiam suas fatias fora do anel: cada texto fica `labelGap` além da borda externa em direção ao meio de sua fatia (o centroide da fatia nesse raio), depois segue até esse raio no lado da fatia no pie, e uma linha-guia com estilo o liga à borda externa. Os rótulos entram junto com suas fatias no appear do plot e aparecem em fade ao final dele, movem-se com elas em `motion.update` e sobem com a fatia sob o ponteiro; tudo isso roda no animator da plataforma. Dê espaço aos rótulos no plot: um `outerRadius` abaixo de `"100%"`, ou espaço ao redor do plot. O conteúdo do próprio app sobre uma fatia é um elemento sobreposto ao plot, como o centro de um donut.

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## Cores por categoria

O `colorScale` de um plot dá cores às categorias, como o `scaleOrdinal` do d3, e o `color` de uma mark nomeia a categoria de cada linha: um campo (seu texto ou seu número) ou uma função da linha. As categorias do `domain` recebem as cores do `range` em ordem, e o intervalo recomeça de sua primeira cor quando o domínio é mais longo. Uma categoria fora do domínio recebe `unknown`; sem um, ela entra no domínio na primeira vez que uma mark a encontra (as marks em ordem, cada uma com suas linhas em ordem) e recebe a próxima cor, de modo que, sem nenhum `domain`, as categorias recebem as cores na ordem em que as linhas as trazem. As cores são do app: cores CSS, incluindo os tokens do tema.

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

Uma fatia, uma barra e um ponto recebem a cor de sua linha; um `Line` e um `Area` são uma série cada um e recebem a cor de sua primeira linha, de modo que uma linha de rows próprias (`data`) fica na cor de suas rows, e uma única escala mantém a cor de uma categoria igual em um pie, em barras e em linhas. A cor é o `fill` da mark (o `stroke` de uma linha) quando nada define uma, no lugar de `currentColor`: as classes e os estilos do app vêm primeiro, depois os da parte (`sliceClass`, `sliceStyle`), os da mark e os que ela herda do plot, de modo que `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` define uma fatia à parte enquanto a escala colore as outras. Ao lado de uma parte `background`, o `fill` de uma barra e de uma área continua `none`.

| `OrdinalScale` | Tipo | Padrão | Descrição |
|---|---|---|---|
| `type` | `"ordinal"` | (obrigatório) | O tipo de escala. |
| `domain` | `string[]` | nenhum | As categorias, em ordem. Uma categoria escrita duas vezes mantém seu primeiro lugar. |
| `range` | `string[]` | (obrigatório) | As cores, em ordem (cores CSS); a categoria `i` recebe a cor `i % range.length`. |
| `unknown` | `string` | nenhum | A cor de toda categoria fora do domínio; sem uma, cada uma recebe a próxima cor. |

<a id="colors-along-a-ramp"></a>

### Cores ao longo de uma rampa

Um `colorScale` de `type: "sequential"` ou `"diverging"` dá cores aos números ao longo de uma rampa, como o `scaleSequential` e o `scaleDiverging` do d3, para o `value` de um [`Cell`](#cell). Seu `range` são duas ou mais cores distribuídas uniformemente ao longo da rampa, da extremidade baixa até a alta, e misturadas em OKLab entre elas: os degraus parecem uniformes ao olho, e dois matizes se encontram por meio de sua própria mistura. Um valor além do `domain` recebe a extremidade da rampa, e uma linha sem valor recebe `unknown`.

`sequential` distribui seu `domain` por toda a rampa, sendo o domínio a extensão dos valores das células, a menos que o app indique um: contagens, volumes, atividade. `diverging` coloca seu `pivot` (0 por padrão) na cor do meio da rampa, com os valores abaixo dele ao longo da primeira metade e os acima dele ao longo da segunda: perdas em um matiz, ganhos em outro, um mês estável no meio neutro. A menos que o app indique um domínio, ele é a extensão dos valores igualada dos dois lados do pivô (o `symmetric` do Observable Plot), de modo que uma perda e um ganho do mesmo tamanho têm a mesma intensidade; uma matriz de correlação indica `domain: [-1, 1]`.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | Tipo | Padrão | Descrição |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (obrigatório) | O tipo de rampa. |
| `domain` | `[number, number]` | a extensão dos valores (igualada em torno do pivô para `diverging`) | Os valores das duas extremidades da rampa. |
| `pivot` | `number` | `0` | Somente `diverging`: o valor da cor do meio da rampa. |
| `range` | `string[]` | (obrigatório) | As cores ao longo da rampa, da extremidade baixa até a alta (cores CSS), misturadas em OKLab entre elas. |
| `unknown` | `string` | nenhum | A cor de uma linha sem valor; sem uma, essa linha não tem célula. |
<a id="radialline-and-radialgrid"></a>

## RadialLine e RadialGrid

Um `RadialLine` desenha uma série em torno do centro do plot: o polígono de um radar, ou uma linha em volta de um mostrador. Cada linha com valor é um ponto no ângulo da linha, tão afastado do centro quanto a escala y do plot coloca seu valor, de `innerRadius` (o menor valor do domínio) a `outerRadius` (o maior). Sem um `angle`, as linhas se distribuem uniformemente pela volta completa a partir das 12 horas, no sentido horário, em ordem; assim, seis linhas formam um hexágono; `closed` une o último ponto ao primeiro. Uma line traça o contorno de seus pontos e preenche sua área até `innerRadius` (por padrão, o centro), de modo que uma única marca é o contorno do radar e seu preenchimento translúcido. Um `RadialGrid` desenha a grade do radar atrás dele: `rings` em valores da escala y, polígonos pelos ângulos das linhas ou `circular`, e `spokes` até cada linha. Sobre uma radial line, o plot informa a linha cujo ângulo é o mais próximo do ângulo do ponteiro dentro do raio externo da line, e o hover dot de cada line fica sobre o ponto dela nessa linha.

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| Marca | Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | o `y` do plot | O que posiciona cada linha a partir do centro: um valor da escala y, de `innerRadius` no menor valor do domínio a `outerRadius` no maior. Uma linha sem esse valor é ignorada. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | as linhas distribuídas uniformemente pela volta | Onde cada linha fica em torno do centro: radianos a partir das 12 horas, no sentido horário. |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radianos) | `0`, `2 * Math.PI` | Onde as linhas ficam sem um `angle`: a partir de `startAngle`, de forma uniforme. Em uma volta completa, elas ficam separadas por um passo de `1 / rows` da volta, com a última um passo antes da primeira; em parte de uma volta, a primeira fica em `startAngle` e a última em `endAngle`. |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Onde ficam o menor e o maior valor do domínio y: em pontos, ou em porcentagem do maior círculo que o plot comporta (metade de seu lado menor), como os raios de um pie. A área de uma line é preenchida até `innerRadius`; os raios de uma grid vão entre os dois. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | Como ela conecta seus pontos: segmentos retos, uma curva suave (se fechada, um laço suave) ou degraus. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | Ela continua do último ponto de volta ao primeiro: o polígono de um radar. Se aberta, sua área se fecha no centro (ou ao longo de sua borda interna). |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Um ponto em cada vértice: uma view centralizada nele, cujo tamanho, fundo e borda são definidos pelo app. Os pontos crescem para fora e se movem com a line. |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Seu fundo: uma caixa em volta de seu círculo externo, cujo fundo (`bg-*`, um gradiente) aparece apenas dentro de sua área, sob seu `fill`, como o de uma area. |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | o `dotClass`, `dotStyle` do plot | Seu hover dot, sobre o ponto dela na linha sob o ponteiro, com o ponteiro no mesmo quadro e deslizando até a próxima linha com a spring `pointer` do plot quando as teclas avançam; `hidden` não mostra nenhum. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | nenhum | Onde ficam seus anéis, como valores da escala y: cada um tão afastado quanto uma radial line coloca esse valor. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | Uma linha de `innerRadius` a `outerRadius` no ângulo de cada linha. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | Seus anéis são círculos (arcos em parte de uma volta). Por padrão, são polígonos pelos ângulos das linhas, e círculos enquanto o plot tiver menos de três linhas. |

Uma radial line traça o contorno com `stroke`, `strokeWidth` e `strokeDasharray` (`currentColor`, com 1 de largura e sólido quando nenhum é definido) e preenche sua área com `fill` (nenhum quando não definido); uma radial grid traça o contorno como uma grid. A pintura delas é herdada do plot. Os valores de uma line, junto com 0, formam o domínio da escala y quando o plot não tem um; assim, um radar de valores positivos cresce a partir de seu centro; os anéis de uma grid não participam disso. Dê ao plot um `domain` y para manter fixos os anéis e a escala do radar enquanto os valores mudam.

Os rótulos em volta de um radar são elementos do app dispostos sobre o plot, assim como o centro de um donut. Sem um `angle`, a linha `i` de `n` fica em `a = 2π·i / n` a partir das 12 horas; assim, em um plot quadrado, uma caixa sem tamanho em `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)` (`r` uma porcentagem do lado do plot um pouco acima da metade da parcela do raio externo) marca o lugar além da borda, e o nome cresce a partir dela, afastando-se do centro: à direita dela na metade direita, à esquerda dela na metade esquerda, acima dela no topo e abaixo dela na base, como acima.

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

Um `Sankey` desenha fluxos entre as linhas do plot: cada linha é um nó e `links` nomeia os fluxos entre eles, `{
source, target, value }` with the indices of two rows in the plot's `data`. Ele os dispõe como o d3-sankey faz, no tamanho do plot: os nós em colunas (`nodeAlign`), cada um tão alto quanto o máximo que entra ou sai dele, com os nós de uma coluna separados por `nodePadding`, relaxados em direção a seus fluxos ao longo de `iterations` passagens; e uma faixa por ligação, da borda direita de sua origem à borda esquerda de seu destino, tão larga em cada ponta quanto sua parcela do lado daquele nó, de modo que os dois lados de cada nó fiquem cobertos mesmo onde seus fluxos de entrada e de saída diferem. Cada coluna é centralizada no plot, e uma sequência de colunas iguais de um só nó é levemente escalonada para que as faixas entre elas se curvem. `valueScale="sqrt"` dimensiona pela raiz quadrada dos valores, para que um único fluxo dominante não ofusque os pequenos.

Cada nó e cada faixa é um canvas próprio, as partes `node` e `link`, de modo que cada um pinta com suas próprias classes: `nodeClass` são as mesmas classes em todos os nós ou uma função da linha do nó, e `linkClass` as mesmas em todas as faixas ou uma função da ligação. A parte `linkBackground` mostra um fundo dentro de cada faixa, uma caixa de sua origem até seu destino: uma função da ligação dá a cada faixa um gradiente da cor de sua origem à cor de seu destino. As faixas são desenhadas sob os nós, e ambos são desenhados a partir da borda de entrada com o appear do plot.

Sobre um sankey, o plot informa o nó sob o ponteiro (`onHoverChange`, a linha do nó; nenhuma sobre uma faixa), seu tooltip acompanha o ponteiro, e as ligações não conectadas a esse nó esmaecem em `hoverDim`, no animator da plataforma com o `motion` do plot. As teclas percorrem os nós na ordem das linhas, com o tooltip ao lado do meio de cada nó. `nodeLabel` nomeia cada nó e `valueLabel` dá seu valor, o valor sobre o nome quando ambos são definidos: à esquerda de um nó na primeira coluna, à direita de um na última, centralizado acima de um entre elas, como o gráfico de `gpui-component` os posiciona; um rótulo ao lado de um nó permanece entre o topo e a base do plot, e um que ultrapassa a borda do plot fica no espaço que o app deixa em volta dele (sua margem). O padding da parte `nodeLabel` é o espaço até seu nó e suas classes definem seu texto (`max-w-20 truncate` corta um nome longo); os rótulos aparecem gradualmente com o appear. Quando o app altera os fluxos, cada nó e cada faixa se move de seu lugar antigo para o novo com o `motion.update` do plot, e seu rótulo junto: um nó novo nos fluxos cresce a partir de seu meio, uma ligação nova a partir de sua menor largura, e os que saem desaparecem de uma vez; uma mudança enquanto eles se movem continua de onde estão desenhados. As ligações são distinguidas por origem e destino, de modo que reordenar `links` não move nada.

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | obrigatório | Os fluxos: da linha `source` para a linha `target` (seus índices no `data` do plot), sendo `value` o seu tamanho. Um valor que não seja um número ou que seja menor que zero não transporta nada e não desenha faixa. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | A largura de cada nó, em pontos. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | O espaço entre os nós de uma coluna, em pontos; menor em uma coluna cheia demais para ele. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | Em qual coluna cada nó fica, como no d3-sankey: sua profundidade a partir da primeira coluna (`"left"`), o mais à direita que seus fluxos permitem (`"right"`), sua profundidade com um nó que apenas inicia fluxos ao lado de seus destinos (`"center"`), ou sua profundidade com os nós que encerram fluxos na última coluna (`"justify"`). |
| `iterations` | `.iterations(..)` | `number` | `6` | Quantas passagens relaxam os nós em direção a seus fluxos. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | Alturas e larguras proporcionais aos valores ou às suas raízes quadradas. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | A menor largura com que uma faixa é desenhada, em pontos, para que um fluxo pequeno continue visível. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | O raio dos cantos de cada nó, em pontos. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | nenhum | As classes de cada nó (`fill-*`, `stroke-*`): as mesmas em todos os nós, ou uma função da linha do nó e de seu índice, chamada uma vez por linha quando as linhas ou a função mudam. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo de cada nó, sobre suas classes. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | nenhum | As classes de cada faixa: as mesmas em todas as faixas, ou uma função da ligação e de seu índice em `links`. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo de cada faixa, sobre suas classes. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | nenhum | As classes do fundo de cada faixa (`bg-*`, um gradiente: `bg-linear-to-r from-… to-…`), mostrado dentro da faixa sobre uma caixa de sua origem até seu destino, sob seu `fill`. Com um fundo, o `fill` de uma faixa é `none` quando nenhum é definido. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do fundo de cada faixa, sobre suas classes. |
| `hoverDim` | `.hover_dim(..)` | `number` (0 a 1) | `0` | O quanto as ligações não conectadas ao nó sob o ponteiro esmaecem, como uma parcela de sua opacidade, com a spring `pointer` do plot e com o esmaecimento do hover. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | nenhum | O nome ao lado de cada nó: um campo, ou uma função da linha do nó e de seu índice. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | nenhum | O valor ao lado de cada nó, sobre seu nome: uma função de sua linha e do máximo que entra ou sai dele (nos valores das ligações, seja qual for o `valueScale`). |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | nenhum | As classes de cada rótulo, a parte `nodeLabel`: seu padding é o espaço até seu nó, e seus estilos de texto valem para as duas linhas. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | nenhum | O estilo de cada rótulo, sobre suas classes. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | nenhum | As classes da linha de valor, a parte `valueLabel`, sobre as do rótulo. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | nenhum | O estilo da linha de valor, sobre suas classes. |

Um nó e uma faixa são preenchidos com `fill` (`currentColor` quando nenhum é definido) e traçados com `stroke` (nenhum quando não definido), os seus próprios sobre os do sankey e do plot, conforme o CSS os herda. Um nó sem nenhum fluxo passando por ele tem um ponto de altura. O layout é executado novamente apenas quando as ligações, as opções ou o tamanho do plot mudam, nunca por causa do ponteiro ou do appear; a mudança de tamanho do plot não move nada. Ligações que formam um ciclo, ou que nomeiam uma linha que o plot não tem, não desenham nada e registram um aviso no log. Seus valores não participam das escalas do plot.
## Treemap

Um `Treemap` desenha as linhas do plot como uma hierarquia de retângulos aninhados: cada linha é um nó, seu `id` e o `parent` que ele nomeia formam a árvore (`stratify` do d3), a área de cada folha é proporcional ao seu `value`, e cada grupo é a caixa do que está sob ele, com valor igual à soma dos valores de suas folhas (seja qual for o que sua própria linha contenha). Uma linha sem `parent`, ou cujo pai não nomeia nenhuma linha, é um nó de nível superior; sem `id`, o id de uma linha é seu índice, então `parent` também pode nomear uma linha pelo índice. Uma árvore na forma aninhada que o gpt-vis escreve (`{ name, value, children }`) dá poucas linhas de código do app para virar linhas; não há limite de níveis.

Os retângulos são quadriculados (squarified), como o `treemapSquarify` do d3 os produz: os nós de cada nível em ordem de valor, do maior para o menor a partir do canto superior esquerdo (`sort="value"`), próximos da proporção `ratio` (a razão áurea); `sort="data"` mantém a ordem das linhas, de modo que os nós mantêm seus lugares quando seus valores mudam. `paddingInner` é o espaço entre irmãos, nunca ao longo das bordas externas do pai; `paddingOuter` é o espaço dentro de um grupo ao redor de seus filhos; `paddingTop` é uma faixa no topo de cada grupo, onde seu `groupLabel` é escrito. Cada um aceita um número para todos os níveis ou um por nível a partir do topo (`[3, 1]`: 3 entre os nós de nível superior, 1 abaixo deles). A faixa de um nível vai em todos os irmãos de um pai ou em nenhum, sendo omitida quando algum deles é pequeno demais para ela, para que os grupos de um nível tenham a mesma aparência.

Uma folha cujo valor é 0, menor que 0 ou não numérico não ocupa área: não é desenhada, não tem rótulo e não é encontrada pelo ponteiro, e o mesmo vale para um grupo cujas folhas são todas assim.
As áreas de um treemap são partes de um todo, então o app mostra o que ficou de fora com suas próprias palavras (uma nota sob o mapa).
Números negativos servem para cores: a variação do dia em um mapa de mercado.

A cor de um nó é a de sua linha no `colorScale` do plot: `colorValue` é um número ao longo de uma rampa (`sequential`, `diverging`: perdas em vermelho, ganhos em verde, neutro para estável, sobre a extensão dos valores sem `domain`), `color` é uma categoria (`ordinal`: `"parent"` colore as folhas de um grupo da mesma forma). As folhas são a parte `leaf` (`leafClass`, `leafStyle`) e os grupos são a parte `group` (`groupClass`, `groupStyle`), desenhados apenas com uma classe ou um estilo: um retângulo sob seus filhos, aparecendo nos espaços, no seu padding e na sua faixa. Cada parte é igual em todos os nós ou é uma função da linha do nó. `cornerRadii` arredonda todos os retângulos.

`label` escreve o nome de cada folha e `valueLabel` escreve seu valor abaixo dele, uma função da linha e de seu valor (o de um grupo é a soma de suas folhas): no canto superior esquerdo (`labelPlacement="start"`) ou no meio (`"center"`). A parte `label` é uma caixa do tamanho de sua folha: seu padding é o espaço a partir das bordas da folha e seu texto estiliza as linhas. O nome é cortado com reticências onde a folha é mais estreita e só é exibido onde cabe; o valor é exibido inteiro ou não é exibido. Um rótulo cuja folha tem cor escura recebe o atributo `data-dark`, para que `data-dark:text-white` o mantenha legível sobre um vermelho profundo.

Sobre um treemap, o plot informa o nó sob o ponteiro (`onHoverChange`, a linha do nó): uma folha, ou um grupo em sua faixa ou em seu padding; ao cruzar um espaço entre irmãos, um deles, para que o hover não pisque. Os demais esmaecem para `inactiveOpacity` (uma folha mantém seus grupos, um grupo mantém o que está sob ele), e a parte `hover`, uma view do tamanho do nó, o contorna. As setas movem para a folha ao lado na tela, e Home e End para a primeira e a última. Na entrada (appear) do plot, os nós de nível superior crescem a partir do centro, um após o outro com `stagger`; quando as linhas mudam, cada nó se move para sua nova caixa e cor com `motion.update`, identificado por seu `id`: um nó novo nas linhas cresce a partir do centro e um que sumiu encolhe para o seu. As escalas x e y do plot não são usadas.

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | o índice da linha | O id do nó de cada linha: o que `parent` nomeia e pelo que um nó é conhecido quando as linhas mudam. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | nenhum: toda linha é um nó de nível superior | O id do pai de cada linha; vazio, ou o id de nenhuma linha, para um nó de nível superior. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | obrigatório | O tamanho de cada folha; o de um grupo é a soma dos tamanhos de seus filhos. Uma folha com 0, menor que 0 ou não numérica não ocupa área. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | Irmãos do maior para o menor a partir do canto superior esquerdo, ou na ordem das linhas. |
| `ratio` | `.ratio(..)` | `number` | a razão áurea | A proporção da qual os retângulos se aproximam, no mínimo 1. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | O espaço entre irmãos, em pontos, por nível a partir do topo (o último vale para os níveis abaixo). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | O espaço dentro de cada grupo ao redor de seus filhos, por nível. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | A faixa no topo de cada grupo, para seu `groupLabel`, por nível; em todos os irmãos de um pai ou em nenhum. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | quadrado | O raio de cada canto de seus retângulos. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | nenhum | A categoria de cada nó, à qual um `ordinal` `colorScale` dá uma cor. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | nenhum | O número de cada nó, que um `sequential` ou `diverging` `colorScale` transforma em sua cor. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | nenhum | As classes de cada folha (`fill-*`, `stroke-*`), iguais em todas as folhas ou uma função de sua linha. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo de todas as folhas, sobre suas classes. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | nenhum | As classes de cada grupo, um retângulo sob seus filhos; grupos só são desenhados com uma classe ou um estilo. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo de todos os grupos, sobre suas classes. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (0 a 1) | nenhum | A opacidade dos nós fora do nó sob hover, e de seus rótulos, com o fade do hover. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | nenhum | O nome em cada folha, em uma linha, cortado com reticências. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | nenhum | O valor em cada folha, abaixo do nome, exibido apenas onde cabe inteiro. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | Os rótulos no canto superior esquerdo de suas folhas, ou no meio. |
| `labelClass` | `.label_class(..)` | `string` | nenhum | As classes do rótulo de cada folha, uma caixa do tamanho da folha: seu padding e estilos de texto; `data-dark:` em folhas escuras. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | nenhum | O estilo do rótulo de cada folha, sobre suas classes. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | nenhum | As classes da linha de valor, sobre as do rótulo. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | nenhum | O estilo da linha de valor, sobre suas classes. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | nenhum | O nome de cada grupo, em sua faixa, cortado com reticências. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | nenhum | As classes do rótulo de cada grupo, uma caixa do tamanho da faixa. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | nenhum | O estilo do rótulo de cada grupo, sobre suas classes. |
| `stagger` | `.stagger(..)` | `number` (0 a 0,95) | `0` | Como os nós de nível superior aparecem um após o outro: a fração da animação de entrada ao longo da qual eles começam. |
| `hoverClass` | `.hover_class(..)` | `string` | nenhum | As classes da parte `hover`, uma view do tamanho do nó sob hover, sobre ele (`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo da parte de hover, sobre suas classes. |

Um retângulo é preenchido com `fill` (a cor do `colorScale`, senão `currentColor`, onde nenhuma é definida) e é contornado com `stroke` (nenhum onde nenhum é definido), o seu próprio sobre os do treemap e do plot, como o CSS os herda. O layout é executado novamente apenas quando as linhas, as opções ou o tamanho do plot mudam, nunca por causa do ponteiro ou da animação de entrada; a mudança de tamanho do plot não move nada. Um `id` repetido, um `parent` que não nomeia nenhuma linha e uma linha que é seu próprio ancestral registram um aviso uma vez: a primeira linha mantém o id, a órfã é um nó de nível superior, o ciclo não é desenhado.

## PlotAxis

Um `PlotAxis` rotula uma borda do plot com os ticks da escala que essa borda carrega: as bordas inferior e superior carregam a escala x, as bordas esquerda e direita a escala y, como `axisBottom`, `axisTop`, `axisLeft` e `axisRight` do d3. Seus ticks vêm da escala: valores redondos em uma escala `linear` (1, 2 ou 5 vezes uma potência de dez, dentro do domínio), linhas em uma escala `point` ou `band`. Seus rótulos são textos que o layout do plot posiciona, então o app diz o que eles leem e como se parecem, e o layout os coloca no lugar: cada rótulo é centralizado em seu tick ao longo da borda. Ao longo das bordas inferior e superior, o primeiro e o último se movem para dentro apenas o necessário para ficarem dentro das extremidades do plot; ao lado das bordas esquerda e direita, todo rótulo permanece em seu tick, para ser lido como o de sua linha de grade, e, onde um rótulo próximo a uma extremidade passaria da borda superior ou inferior do plot, as escalas y lineares do plot começam essa distância para dentro dela (metade da altura do rótulo para um tick na extremidade), de modo que todo rótulo fique dentro do plot, sobre sua linha de grade.

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | A borda ao longo da qual ele corre: as bordas inferior e superior carregam os ticks da escala x, as bordas esquerda e direita os da escala y. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | A escala y que um eixo esquerdo ou direito rotula: o `yScale` do plot ou o segundo, `y2Scale` ([Eixos duplos](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | Onde seus rótulos ficam: além da borda, no espaço que o app deixa ao redor do plot, onde ficam longe das marcas; ou sobre o plot ao longo da borda, para que o plot mantenha seu tamanho inteiro (ao lado de uma borda esquerda ou direita, cada rótulo fica no lado superior de sua linha de grade). |
| `ticks` | `.ticks(..)` | `number` | `10` em uma escala `linear` (cada passo de escalas alinhadas), todas as linhas nas demais | Aproximadamente quantos ticks ele usa: em uma escala `linear`, valores redondos dentro do domínio, cerca dessa quantidade; em uma escala `point` ou `band`, essa quantidade de linhas distribuídas uniformemente da primeira à última. |
| `tickValues` | `.tick_values(..)` | `number[]` | nenhum | Os valores de seus ticks, no lugar de `ticks`: valores da escala, índices de linha em uma escala `point` ou `band` (`[0, 3, 6]` rotula uma a cada três linhas). Cada valor dentro do domínio recebe um tick. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | a categoria de uma faixa em uma escala de faixas de categorias, senão o valor, com as casas decimais que o passo entre ticks exige, milhares agrupados | O texto de cada tick: a função do app de seu valor (o índice de uma linha em uma escala `point` ou `band`) e de seu índice entre os ticks do eixo. |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | A parte `label`: um texto por tick, com fonte, cor e padding definidos pelo app; seu padding em direção ao plot é sua distância da borda (`pt-2` sob um eixo inferior). |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A parte `tick`: uma view por tick na borda, centralizada em seu tick e se estendendo em direção aos rótulos (`h-1 w-px bg-border` sob um eixo inferior); exibida quando estilizada. |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A parte `line`: uma view ao longo de toda a borda, no lado dos rótulos (`h-px bg-border` sob um eixo inferior); exibida quando estilizada. |

Do lado de fora, os rótulos ficam na margem do plot, como os eixos do d3 ficam nas margens de um gráfico: o plot mantém o tamanho que o app lhe dá, e o app lhe dá uma margem no lado do eixo tão profunda quanto os rótulos (`mb-6` para rótulos `pt-2 text-xs` sob ele), ou o padding do pai ali. Dois eixos na mesma borda rotulam cada um seus próprios valores, em seu próprio estilo: as extremidades de um intervalo esmaecidas e o meio mais firme.

`format` é chamado uma vez por tick quando os ticks ou a função mudam, no próximo turno, nunca enquanto o plot desenha ou segue o ponteiro: mantenha-o puro (o mesmo valor, o mesmo texto). Sem ele, um tick é lido como o d3 o escreve: `1,500`, `0.25`, `−2`. Em Rust, `plot_axis()` cria um eixo, e seu `format` é um `TickFormat::from_fn(|value, index| ..)`.
Um eixo não recebe ponteiro, e leitores de tela ouvem o plot, não seus rótulos.
## PlotLabel

Um `PlotLabel` escreve textos em pontos do plot: uma legenda sobre um pico, uma etiqueta no último ponto de uma linha, uma nota na ponta de uma linha de grade. Cada um dos seus `texts` nomeia seu ponto com valores das escalas do plot, como fazem as marcas: o índice de uma linha em uma escala `point` ou `band` (o meio da banda da linha), um valor em uma escala `linear`. A borda superior do texto fica sobre o ponto, e seu `align` faz o texto começar ali, ficar centralizado nele ou terminar ali. O layout do plot posiciona os textos, então eles acompanham o tamanho do plot; deslizam com os domínios das escalas (`motion.update`) e aparecem gradualmente com o appear.

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | Os textos que ele escreve, cada um em seu próprio ponto. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | A escala y da qual os `y` de seus textos são valores ([Eixos duplos](#dual-axes)). |

Cada texto é um `PlotText`:

| Campo | Tipo | Padrão | Descrição |
|---|---|---|---|
| `text` | `string` | | O que ele lê. |
| `x` | `number` | | Onde ele fica ao longo do eixo x: um valor da escala x, o índice de uma linha em uma escala `point` ou `band` (`0.5` fica a meio caminho entre as duas primeiras linhas). |
| `y` | `number` | | Onde sua borda superior fica ao longo do eixo y: um valor da escala y. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Como ele se posiciona em x a partir de seu ponto: começando nele, centralizado nele ou terminando nele. |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | nenhum | As classes e o estilo próprios do texto, sobrepostos ao que ele herda do label: sua caixa (o fundo e o padding de uma etiqueta) e sua distância do ponto. |

A aparência é a do app: o `class` do label dá a todos os textos os estilos de texto que eles herdam (fonte, tamanho, cor), e o `class` e o `style` próprios de um texto o estilizam individualmente. Um texto fica acima de seu ponto com `-translate-y-full`, e seu padding é a distância até o ponto (`pb-1`); uma etiqueta ao lado do último ponto de uma linha fica na margem que o app deixa naquele lado (`mr-12`), como os rótulos de um eixo. Em Rust, `plot_label()` cria um label, e cada texto é um `PlotText::new(text, x, y)` com `.align(PlotTextAlign::Center)`, `.class(..)` e `.style(..)`. O ponteiro atravessa os textos até o plot, e os leitores de tela leem o plot, cujo `accessibilityLabel` diz o que os textos apontam.

<a id="motion"></a>

## Movimento

O movimento é do app, e por padrão não há nenhum: tudo aparece de uma vez. `motion` recebe os tempos de [`nsh`](../modules/nsh.md#animation) (`{ duration, easing, delay }` e `{ stiffness, damping, mass }`):

| Chave | Tipo | O que se move |
|---|---|---|
| `appear` | timing | As marcas são desenhadas, com um `appearGeneration`: linhas e áreas a partir da borda de ataque, barras crescendo a partir da base (uma após a outra com o `stagger` de uma barra); pontos crescendo a partir do nada (um após o outro com o `stagger` de um ponto); células crescendo a partir do meio (uma após a outra com o `stagger` de uma célula); o anel de uma pie e de um arc varre no sentido horário a partir do início; uma linha radial cresce a partir de seu raio interno, com seus pontos; os nós e as fitas de um sankey a partir da borda de ataque, com seus rótulos aparecendo gradualmente. |
| `update` | timing | As marcas se movem para a nova forma quando o app a muda: pontos para seus novos valores e tamanhos, o ponto de uma nova linha crescendo e o de uma linha removida encolhendo até sumir; células para suas novas cores (misturadas em OKLab) e bandas, a célula de uma nova linha crescendo e a de uma linha removida encolhendo até sumir; os raios de uma pie e de um arc, de modo que o buraco de um donut abre e fecha, e seus ângulos, de modo que um gauge ou uma fatia varre até seu novo valor (`arcTween` do d3: os ângulos se movem, não o contorno; uma nova fatia se abre a partir de onde termina a anterior; uma mudança enquanto uma se move continua a partir de onde ela está desenhada); os pontos de uma linha radial para seus novos valores, ângulos e raios (uma nova linha crescendo a partir do raio interno), com os anéis de uma grade radial junto; e o domínio de uma escala linear, o `domain` do app ou a extensão dos valores das marcas conforme chegam as linhas, que desliza do antigo para o novo, junto com as marcas, as linhas de grade, os `PlotAxis` e os `PlotLabel`; e os nós, as fitas e os rótulos de um sankey, do layout dos fluxos antigos para o novo, com uma mudança enquanto se movem continuando a partir de onde estão desenhados. |
| `enter` | timing | As partes do hover aparecem gradualmente quando o ponteiro passa sobre o plot. |
| `exit` | timing | Elas desaparecem gradualmente depois que ele sai. |
| `pointer` | spring | Elas deslizam de uma linha para a próxima quando as teclas ou um leitor de tela percorrem o hover; a fatia de uma pie se levanta com ele. |

As partes do hover seguem o ponteiro no mesmo frame: conforme ele se move, a linha cruzada, os pontos e o tooltip ficam de imediato na linha sob ele, acompanhando a mão, enquanto o aparecer e o desaparecer gradual (`enter`, `exit`) continuam animados.

O movimento roda no animador da plataforma, sem JS por frame, e é concluído de imediato para quem pede movimento reduzido. Um plot que uma lista recria para uma linha que volta é desenhado de novo, a menos que um [`PlotAppearScope`](#plotappearscope) em volta da lista tenha visto seu appear terminar.

Um domínio se move como o d3 faz a transição do domínio de uma escala: a escala intermediária posiciona cada valor, então as marcas mantêm suas formas, as linhas de grade e as partes do hover se movem com elas, as barras mantêm seus cantos, e uma linha que entra com o novo domínio se move junto com as demais. Um gráfico ao vivo que ajusta sua escala y às suas linhas de tempos em tempos (com alguma folga, para que a grade fique parada entre os ajustes) desliza para cada novo ajuste com um timing `update`. Quando o tamanho do plot muda, as marcas assumem o novo tamanho de imediato.

Este é o movimento próprio do plot, os timings do que um gráfico move: o clip de suas marcas e as partes de seu hover. As entradas, saídas e chamadores de atenção de uma view são os presets e keyframes de [`createMotion`](../modules/nsh.md#createmotion), que um app ainda pode executar na view do plot ou nos elementos ao redor dele.

## PlotAppearScope

Uma lista recria o plot de uma linha cada vez que a linha volta à vista, então um sparkline com appear é desenhado de novo sempre que a lista rola de volta até ele. Um `PlotAppearScope` em volta da lista lembra os appears que terminaram nela: um plot recriado ali cujo `appearGeneration` terminou mostra suas marcas inteiras de imediato. Um plot é lembrado por sua geração, então o plot de cada linha recebe a sua própria, a chave da linha com o que quer que deva reproduzi-la de novo (`` `${symbol} ${period}` ``).

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | nenhum | Para o que o scope lembra: quando muda, o scope esquece e seus plots são desenhados de novo, onde estão. Dê a ele o nome do conteúdo, como uma watchlist ou uma conversa; sem um, o scope lembra enquanto for exibido. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O que ele contém: a lista, ou o que quer que recrie seus plots conforme entram e saem. |

Uma nova geração ainda desenha o plot, e o mesmo vale para um plot removido antes de seu appear terminar, desde o início. Quando um plot termina uma nova geração, seu scope esquece a anterior, então voltar a um período anterior desenha o plot de novo. A memória vai junto com o scope: um scope que não é mais exibido, ou um com um novo `id`, desenha seus plots de novo, e um plot lembra no scope mais interno ao seu redor. Sua aparência é a do app: `class` e `style` o dispõem como a de qualquer view (`flex-1` em volta de uma lista que preenche a tela). Em Rust, `plot_appear_scope()` cria um.

<a id="keyboard"></a>

## Teclado

Um plot interativo é uma parada do Tab (macOS, web), e enquanto tem o foco do teclado suas teclas movem o mesmo hover que o ponteiro: a linha cruzada, os pontos e o tooltip deslizam com o spring `pointer`, a fatia de uma pie se levanta, `onHoverChange` informa a linha, e os leitores de tela leem o `accessibilityValue` que o app fornece para ela. Seu anel de foco é o do app: uma classe `focus-visible:` ou um `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`).

| Teclas | O que fazem |
|---|---|
| Direita, Esquerda | Movem para a linha naquele lado: a próxima ou a anterior, ao contrário em uma escala x invertida, cuja primeira linha fica à direita (sobre uma pie, suas fatias na ordem das linhas; sobre um sankey, seus nós; sobre um treemap, a folha ao lado na tela, como fazem Cima e Baixo); sem nenhuma linha em hover, Direita começa na linha da extremidade esquerda e Esquerda na da extremidade direita (sobre uma pie, a primeira e a última fatia). |
| Home, End | Movem para a primeira ou a última linha. |
| Cima, Baixo | Sobre células: movem para a célula acima ou abaixo na mesma coluna. Sobre células, as teclas seguem a grade na tela (o data grid do WAI-ARIA): Direita e Esquerda movem para a próxima célula ao longo da linha, Home e End para a primeira e a última célula da linha; sem nenhuma célula em hover, a primeira tecla começa na célula do canto superior esquerdo (Esquerda, Cima e End na do canto inferior direito). Em uma borda, o hover permanece. |
| Escape | Limpa o hover. |

O plot responde às suas teclas enquanto tem o foco, e ao Escape enquanto uma linha está em hover; no restante do tempo elas vão para o app e para as views ao redor. Tirar o foco dele limpa um hover feito pelas teclas. O plot não recebe pressionamentos, então um plot dentro de um card pressionável deixa os pressionamentos para o card. Os leitores de tela também percorrem as linhas: o deslizar para cima e para baixo do VoiceOver, o rolar para frente e para trás do TalkBack, e todo leitor de tela que ofereça as ações `increment` e `decrement` de um elemento movem para a próxima e a anterior linha, na ordem das linhas também em uma escala invertida.

<a id="building-charts"></a>

## Construindo gráficos

Um gráfico é um plot, suas marcas, seus eixos e os elementos do próprio app ao redor deles. Dê à escala y um `domain` e ao seu eixo os valores da grade (`tickValues`): cada rótulo fica então em sua linha de grade. A linha cruzada, os pontos e o tooltip do hover são partes do plot, estilizadas e preenchidas pelo app; os valores da linha vão onde o app os mostra.

Grades ficam melhores como linhas finas sólidas com uma linha de base mais firme, o que deixa a linha tracejada livre para significar um valor de referência (o preço de abertura abaixo). Uma área fica mais leve como um véu que se desvanece em direção à sua linha de base do que como um preenchimento chapado. O ponto de hover de cada série assume a cor da série, e a cor da superfície onde o gráfico está como seu anel, de modo que se recorta da linha, e o tooltip fica no topo do plot, dentro de suas bordas na primeira e na última linha: um `domain` com espaço acima do maior valor o mantém longe da linha.

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

Um gráfico de barras fica melhor com as pontas das barras arredondadas e as bases retas (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`), as barras das outras linhas esmaecidas enquanto uma está em hover (`inactiveOpacity`) e sua banda com um tom (`crossLineClass`), e os valores em pequenos algarismos tabulares sobre as barras, com o total sobre uma pilha. Com `paddingOuter` metade de `paddingInner`, o meio das bandas cai em passos iguais, e um `PlotAxis` centraliza cada mês sob sua banda; um `maxBandWidth` mantém algumas barras estreitas em um card largo.

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

Um sparkline em uma linha de lista é um plot com `interactive={false}`: ele desenha suas marcas e não segue nenhum ponteiro.

<a id="accessibility"></a>

## Acessibilidade

- Um plot é um único elemento para os leitores de tela, com o papel de imagem e o `accessibilityLabel` do app; suas marcas, os rótulos de seus eixos, seus `PlotLabel`s e as partes do hover são partes dele e não dizem nada por si mesmas. Diga no rótulo o que o gráfico mostra e o que se destaca (o intervalo, o maior valor), e dê a `accessibilityValue` as palavras para a linha sob o ponteiro, para que o leitor de tela diga o valor conforme ele muda.
- A linha sob o ponteiro é informada com `onHoverChange` em plataformas com ponteiro (desktops, a web, um iPad com trackpad). Telas sensíveis ao toque não informam hover: mostre os valores de que um usuário de toque precisa nos elementos do próprio app, ou ofereça as linhas como texto ou lista onde os números importam.
- Sobre uma pie, a linha informada é a da fatia sob o ponteiro: dê a `accessibilityValue` seu nome, valor e proporção (`"Team, 340 seats, 34.0%"`), e diga o total e a maior proporção no rótulo. Sobre um radar, é o eixo mais próximo do ponteiro: dê a ele o nome do eixo e o valor de cada série ali.
- Um plot interativo é uma parada do foco do teclado cujas setas movem o hover ([Teclado](#keyboard)), e oferece aos leitores de tela `increment` e `decrement` para percorrer as linhas (o VoiceOver o lê como ajustável); um plot com `interactive={false}` não é nenhum dos dois, e não recebe pressionamentos em nenhum dos casos.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos e papéis em geral.
<a id="platform-notes"></a>

## Notas de plataforma

- Toda plataforma desenha as marcas do mesmo jeito, a partir de um desenho por marca gravado em Rust; uma mudança nas linhas redesenha, em um único lote, as marcas que as leem, e uma mudança em uma classe de pintura (a aparência, `dark:`) reenvia o desenho sem gravá-lo de novo.
- A animação de entrada recorta linhas e áreas, e faz crescer as barras, com valores que o animador da plataforma move; o esmaecimento de uma barra em relação à linha sob o hover é uma opacidade que o animador calcula a partir da posição do hover; as partes do hover são views que o animador move e esmaece, e ele mantém o tooltip dentro da área de plotagem a partir do tamanho dela e do tamanho do tooltip.
- O fundo de uma área é desenhado em seu próprio canvas, recortado no formato da área, com o mesmo gradiente que a plataforma desenha para o `bg-linear-*` de uma view; uma mudança em suas classes (a aparência, `dark:`) reenvia o desenho sem gravá-lo de novo.
- Um gráfico de pizza desenha cada fatia em seu próprio canvas; a fatia sob o ponteiro é encontrada em Rust a partir dos ângulos e raios das fatias, o destaque dela é um raio e o esmaecimento das demais é uma opacidade que o animador move, e a varredura da entrada move os ângulos das fatias do mesmo modo, de modo que nenhum dos dois grava um desenho de novo.
- A linha sob o ponteiro em uma linha radial é encontrada em Rust a partir dos ângulos de seus pontos; o ponto de hover é uma view que o animador posiciona na linha sob o ponteiro (deslizando na mola `pointer` conforme as chaves avançam), e enquanto a linha aparece ou se move para novos valores, seus pontos são números que o animador move a partir de onde estavam, de modo que a linha é gravada uma vez por mudança.
- Uma marca de pontos é desenhada em um único canvas; o ponto sob o ponteiro é encontrado em Rust a partir dos centros e raios dos pontos, e o ponto de hover é uma view que o animador posiciona sobre ele, do mesmo tamanho; o crescimento da entrada, os movimentos de uma mudança e o esmaecimento do hover são valores que o animador move, de modo que os pontos são gravados uma vez por mudança.
- Uma marca de células é desenhada em um único canvas; a célula sob o ponteiro é encontrada em Rust a partir das caixas das células, e a célula de hover é uma view que o animador posiciona sobre ela; o crescimento, as cores e os movimentos de uma mudança e o esmaecimento do hover são valores que o animador move, de modo que as células são gravadas uma vez por mudança. Cada rótulo é um texto da plataforma, exibido onde seu tamanho já calculado pelo layout cabe dentro da célula.
- Os rótulos, as marcas de graduação e a linha de um eixo são textos e views da própria plataforma, posicionados pelo layout em Rust a partir do tamanho e das escalas da área de plotagem: eles se movem junto com as marcas quando o tamanho da área muda, e um novo domínio escreve os rótulos de novo.
