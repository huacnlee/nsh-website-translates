---
title: "Estilização"
description: "Métodos de estilo tipados em Rust e a prop style em TSX - flexbox, grid e efeitos CSS - cores, bordas, cantos, sombras, gradientes, filtros, transformações e transições, com diferenças entre plataformas."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---


# Estilização

Todo elemento é estilizado com os mesmos estilos nativos, escritos de duas maneiras. Em Rust, os estilos são métodos tipados encadeados no elemento (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`); em TSX, uma prop `style` com propriedades em camelCase, ou [classes do Tailwind](./tailwind.md). Ambas incluem recursos do CSS como sombras de caixa, gradientes, filtros, contornos, transições e grid, e apenas as propriedades que mudaram são enviadas à view nativa.

As três formas escrevem um único conjunto de propriedades e significam a mesma coisa. Os nomes são os do CSS (alguns usam os nomes mais simples que os apps costumam escrever, como `paddingHorizontal`, `marginStart` e `numberOfLines`), e os valores CSS (cores, gradientes, filtros, sombras, transformações, palavras-chave de alinhamento) e as utilities do Tailwind significam o que significam na web, com cada método Rust e cada utility definindo o que o Tailwind CSS 4 gera para ela, de modo que o que você sabe da web continua valendo: `paddingLeft` é `padding-left` e `pl-4`, `boxShadow` é `box-shadow`, `display: "flex"` é uma linha, assim como a classe `flex`. O restante é feito para apps nativos: os comprimentos são em points (`16`, `"50%"`, `"auto"`; as classes aceitam `rem` e as demais unidades do CSS), os padrões são os do layout nativo (listados abaixo), um valor que muda recebe números em vez de uma string (`translate: [x, 0]`, as camadas de uma sombra), e o que as plataformas fazem além do CSS tem suas próprias [extensões](#extensions).

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

Esta página cobre como os estilos se combinam e as propriedades visuais. As propriedades de layout (flexbox, grid, tamanhos, posições) estão em [Layout](./layout.md), as propriedades de texto em [Texto](./text.md), e todas as propriedades com seus tipos estão listadas na [referência de estilos](../modules/style-reference.md).

<a id="combining-styles"></a>

## Combinando estilos

Em Rust, estilos compartilhados são funções que recebem um elemento e o devolvem estilizado, e as condições são Rust comum: `.when(condition, |v| ..)` para o que já se sabe quando o elemento é criado, `.style_when(signal, |s| ..)` para estilos que mudam enquanto o app executa. Em TSX, `style` recebe um objeto, ou um array de objetos mesclados da esquerda para a direita; entradas falsy (`false`, `null`, `undefined`) são ignoradas, o que deixa os estilos condicionais curtos:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

Em TSX, defina estilos compartilhados como constantes fora dos componentes (com `as const`, para que o TypeScript mantenha tipos literais como `"row"`). Um objeto simples basta: os estilos são interpretados em Rust a cada vez que são definidos, a partir de objetos que ninguém precisa registrar.

Um estilo que lê signals os acompanha: em Rust, passe um closure ao método (`.bg(move || ..)`), e somente aquela propriedade é definida novamente quando os signals mudam; em TSX, uma expressão de estilo que lê signals é reconstruída, e o NSH envia apenas as propriedades cujos valores diferem:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

Quando um elemento TSX tem ambos, `style` vence `class`: as classes são aplicadas primeiro, e depois o estilo inline por cima. Uma chave definida como `undefined` não define nada (`backgroundColor: active ? accent : undefined` mantém a cor da classe quando inativo); `null` define o valor padrão. Em Rust, um método posterior vence um anterior para a mesma propriedade.

Dentro de um mesmo estilo (um objeto, ou um array mesclado em um só), a ordem das chaves não faz diferença: uma propriedade mais específica vence sua forma abreviada, `borderTopWidth` sobre `borderWidth`, `borderLeftColor` sobre `borderColor`, `marginTop` sobre `marginVertical` sobre `margin` (o mesmo vale para padding), `rowGap` sobre `gap`, `flexGrow` sobre `flex`, `gridColumnStart` sobre `gridColumn`. Uma propriedade específica definida como `null` nesse caso mostra o valor da forma abreviada.

<a id="units-and-values"></a>

## Unidades e valores

- **Comprimentos são em points** (pixels independentes de densidade): `px(100.0)` em Rust e `width: 100` em TSX equivalem a 100pt, que são 200 ou 300 pixels físicos em uma tela 2× ou 3×.
- **Porcentagens** (`relative(0.5)` em Rust, `"50%"` em TSX) são relativas ao pai, para tamanhos, posições, margens e paddings ([Layout](./layout.md)).
- **Ângulos** são `deg(45.0)`, `radians(0.5)` ou `turn(0.25)` em Rust, e graus como números ou strings com unidade em TSX: `45`, `"45deg"`, `"0.5rad"`; os `rotate` e `transform` do CSS também aceitam `"0.25turn"`, e dentro de uma string `transform` todo ângulo tem sua unidade.
- **Durações** são em milissegundos: `.duration(150.0)` em Rust, números ou strings (`"150ms"`, `"0.2s"`) em TSX.

<a id="defaults"></a>

## Padrões

Onde nada define uma propriedade, valem os padrões do NSH:

| | Padrão |
|---|---|
| Layout dos filhos de uma view | uma coluna (um contêiner flex com `flexDirection: "column"`); `display: "flex"` cria uma linha, a menos que `flexDirection` esteja definido, como no CSS |
| `flexShrink` | `0` (os filhos não encolhem, a menos que seja pedido) |
| `alignContent` | `"flex-start"` (em grids, o `"normal"` do CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | transparente |
| Texto | preto, 14pt, peso 400 |
| Cor de borda e de contorno | a cor do texto (o `currentColor` do CSS) |

Views novas não carregam nenhum estilo até que você lhes dê um, então wrappers sem estilo não custam nada no lado nativo.

<a id="colors"></a>

## Cores

Em Rust, as cores são valores tipados: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, e a paleta do Tailwind como `nsh_core::element::palette` (`BLUE.shade(500)`). Os métodos de cor recebem um `AdaptiveColor`, um valor claro e um escuro: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` alterna com a aparência do sistema de forma nativa, sem renderização. As cores do tema do app (`theme().primary` de `nsh_base`) também são adaptativas ([Rust](./rust.md#theme)).

Em TSX, as propriedades de cor aceitam strings de cor CSS:

| Forma | Exemplo |
|---|---|
| Hex | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| Nomeadas | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: a cor do texto, também dentro de um gradiente, de uma sombra, de um `drop-shadow()` ou de um `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`); as classes a escrevem `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

Para o modo escuro em TSX, leia [`colorScheme()`](../modules/nsh.md#device) de `nsh`, um accessor que acompanha a aparência do sistema, ou use a variante `dark:` do Tailwind:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Para estilos que não são cores, `.dark(|s| ..)` em Rust aplica estilos na aparência escura, e `dark()` lê a aparência. A cor de texto padrão é preta em ambas as aparências: defina as cores explicitamente em apps que suportam o modo escuro.

<a id="borders-and-corners"></a>

## Bordas e cantos

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Larguras e cores** por lado: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., que mantêm seu lado em qualquer direção; e `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, que seguem a [direção do layout](./layout.md#right-to-left) (`.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ... em Rust).
- **A cor** de um lado cuja largura está definida e cuja cor não está é a cor do texto, como o `currentColor` do CSS: `{ borderWidth: 1, color: "#0969da" }` desenha uma borda azul.
- **Raios** por canto: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, e `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (superior inicial, superior final, inferior inicial, inferior final), que seguem a [direção do layout](./layout.md#right-to-left) (`.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)` em Rust, e os presets `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) desenha cantos cuja curvatura se suaviza nas bordas, como os ícones de apps do iOS, em ambas as plataformas. Uma pílula (`borderRadius` de metade da altura) continua sendo uma pílula.
- **`overflow: "hidden"`** (`.overflow_hidden()`) recorta os filhos na forma arredondada. O que é recortado também é recortado no layout: não chega ao tamanho de conteúdo de uma scroll view envolvente, então uma caixa que posiciona um filho mais largo que ela mesma e o reduz com um `transform` (transformações não afetam o layout) deixa a scroll view em paz.

Raios maiores que metade do lado são limitados, então `borderRadius: 9999` (`.rounded_full()`) cria um círculo ou uma pílula.

<a id="shadows"></a>

## Sombras

As views projetam o `boxShadow` do CSS, e o Android acrescenta sua elevação do Material:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` segue o CSS: `offsetX offsetY blur spread color`, `inset` para sombras internas. Também aceita suas camadas como números, a forma para valores que mudam, que não constrói nenhuma string: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (apenas `x` e `y` são obrigatórios; uma camada sem cor usa a cor do texto). Rust recebe as camadas, `.shadow([BoxShadow { .. }])`. As sombras seguem a forma arredondada da view, e uma transição as anima (`transitionProperty: "boxShadow"`, `.transition_shadow()`). Os presets do Tailwind são `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... em Rust, e `.shadow_color(..)` recolore suas camadas. Uma sombra que segue o conteúdo de uma view transparente (os glifos de um ícone, por exemplo) é um `filter: "drop-shadow(...)"` ([Filtros](#filters-and-blending)); o texto tem `textShadow` ([Texto](./text.md)).

> [!NOTE]
> No Android, as sombras precisam de um fundo: uma view com fundo transparente (um texto sem fundo, por exemplo) não projeta sombra.

<a id="gradients"></a>

## Gradientes

`backgroundImage` aceita gradientes CSS, desenhados sobre a cor de fundo; em Rust, `.bg_linear(angle)`, `.bg_radial()` e `.bg_conic(angle)` com as paradas `.gradient_from(..)`, `.gradient_via(..)` e `.gradient_to(..)`, assim como o `bg-linear-*` do Tailwind com `from-*`, `via-*` e `to-*`. Em TSX, vários gradientes são separados por vírgulas.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

As paradas de cor são posicionadas por porcentagens ou comprimentos (`px`, `pt`, `rem`; números simples são points) ao longo de um gradiente linear ou radial, e por porcentagens ou ângulos (`deg`, `turn`, `rad`, `grad`) ao redor de um gradiente cônico. Uma parada com duas posições (`#8250df 0 12px`) é uma faixa de uma só cor, assim como duas paradas na mesma posição. Os comprimentos são medidos ao longo da linha do gradiente no tamanho atual da view, então uma faixa de 12px continua com 12px de largura quando a view é redimensionada.

As cores se misturam entre as paradas como no CSS: no espaço que o gradiente nomeia (`linear-gradient(in oklab, …)`; também `srgb`, `srgb-linear`, `xyz`, `oklch` com um método de matiz como `longer hue`, e `hsl`), e caso contrário em sRGB quando toda cor é hex, `rgb()`, `hsl()` ou nomeada, e em Oklab quando alguma é `oklch()`, `oklab()`, `lab()`, `lch()` ou `color()`.

Elementos de texto não desenham gradientes no iOS.

<a id="filters-and-blending"></a>

## Filtros e mesclagem

| Propriedade | Valor | Rust |
|---|---|---|
| `filter` | Filtros CSS da view e de seu conteúdo: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (sem cor, na cor do texto, como no CSS); vários separados por espaços | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | Filtros do que está atrás da view: `"blur(10px)"` (vidro fosco) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` ou `"clear"` para o Liquid Glass da Apple no iOS 26 e macOS 26 e posteriores; `"none"` (o padrão) usa `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | Como a view se mescla com o que está atrás dela: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

O suporte varia entre plataformas:

| | iOS | Android |
|---|---|---|
| `filter` em views | `opacity`, `brightness` até 1 e somente `drop-shadow` | Todos, a partir do Android 12 (API 31); abaixo disso, somente filtros de cor |
| `filter` em imagens | Todos os filtros de cor e `blur` | Como em views |
| `backdropFilter` | Um material de blur do sistema, aproximando o raio | A partir do Android 12 (API 31) |
| `mixBlendMode` | Sim | A partir do Android 10 (API 29) |

A web, o Windows e o Linux aplicam todos os filtros às views, o macOS como o iOS; o GPUI desenha os filtros de cor e `drop-shadow()`. O backdrop filter é um blur no iOS, macOS e Android, e todos os filtros na web e no Windows; Linux e GPUI não desenham nenhum, e o GPUI desenha as views no modo de mesclagem normal. De um `filter` com vários `drop-shadow()`s, iOS, macOS e Android desenham o último. `mixBlendMode` mescla a view com tudo o que foi desenhado atrás dela.

No iOS, `ios={{ backdropMaterial: "regular" }}` seleciona o material do sistema usado por um blur de `backdropFilter`. Os valores são `"ultraThin"` (o padrão), `"thin"`, `"regular"`, `"thick"` e `"chrome"`. Combine a prop com um raio de blur positivo para exibir o material. Rust usa `.backdrop_material(BackdropMaterial::Regular)` junto com `.backdrop_blur(px(30.0))`. O raio aproxima a intensidade do material: o NSH aplica uma fração do material escolhido, atingindo a intensidade total em 30 points. A variante clara ou escura segue a cor de fundo da view. Essas opções correspondem aos [materiais de blur do sistema](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) da Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` desenha o Liquid Glass atrás do conteúdo de uma view no iOS 26 e macOS 26 e posteriores. `"regular"` usa o material padrão; `"clear"` pega menos cor do fundo. Combine-o com `backdropFilter` para o blur exibido em versões anteriores do iOS e em outras plataformas. O vidro segue o tamanho e os cantos arredondados da view.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Contornos, opacidade e visibilidade

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): uma linha fora da borda que não ocupa espaço (offsets negativos desenham por dentro). `outlineStyle: "none"` (ou `"hidden"`, `.outline_none()`) oculta o contorno qualquer que seja sua largura, como no CSS.
- `opacity` (`.opacity(n)`): de 0 a 1, aplicada à view e a seus filhos.
- `visibility: "hidden"` (`.invisible()` em Rust): a view não é desenhada, mas mantém seu espaço, e os leitores de tela a ignoram, junto com sua subárvore, como em um navegador. `display: "none"` (`.hidden()`) a remove do layout.
- `zIndex` (`.z_index(n)`): a ordem entre irmãos, também a ordem de empilhamento nativa (estável para valores iguais).
- `cursor` (`.cursor(..)`, `.cursor_pointer()`): o formato do ponteiro sobre a view, para ponteiros e desktops.
<a id="transforms"></a>

## Transformações

As transformações seguem o CSS. Em TSX, `translate`, `rotate` e `scale` são propriedades independentes e `transform` aceita a string de funções do CSS ou uma lista de etapas. Elas são compostas na ordem do CSS, `translate`, depois `rotate`, depois `scale`, depois `transform`, independentemente da ordem das chaves. Em Rust, as transformações são métodos (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...) compostos na mesma ordem:

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| Propriedade | Valor |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (porcentagens do tamanho da própria view), um número (pontos ao longo de x) ou `[x, y]` com um número, uma string ou um valor animado por eixo |
| `rotate` | `"45deg"`, `"0.25turn"`, em torno de um eixo `"x 90deg"`, um número (graus) ou um valor animado (graus) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x e y), um valor animado (ambos os eixos) ou `[x, y]` |
| `transform` | Funções do CSS: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`; comprimentos em `px` (translações também em `%`), ângulos em `deg`, `rad` ou `turn`; `"none"`; ou uma lista de etapas (`[{ perspective: 800 }, { rotateY: angle }]`) cujas quantidades podem ser valores animados |

Cada uma é uma propriedade independente, como acontece com as classes: o `scale` de um estilo substitui uma classe `scale-95` e mantém seu `rotate-3`. Valores animados movem `translate`, `rotate` e `scale` de forma nativa. Para o que a string do CSS não consegue expressar com uma quantidade animada, como uma rotação 3D, passe a `transform` uma lista de etapas: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` e `perspective` ([Animação](./animation.md)). O `transform` de um estilo é de uma forma ou de outra, então uma perspectiva antes de etapas animadas é uma etapa da lista.

O `.perspective(..)` do Rust é a propriedade `perspective` do CSS, como o `perspective-*` do Tailwind: ele dá profundidade aos filhos da view, enquanto a função `perspective()` de um `transform` se aplica à transformação da própria view. `transformOrigin` aceita palavras-chave, porcentagens e comprimentos (`"top left"`, `"50% 0"`, `[10, 20]`; `.origin_top_left()`, `.transform_origin(..)` em Rust); o padrão é o centro. As transformações não afetam o layout: os irmãos são posicionados como se a view não tivesse sido transformada.

O Android não tem transformações de inclinação (skew).

<a id="transitions"></a>

## Transições

Uma view anima as mudanças do próprio estilo quando você indica o que animar. A animação roda de forma nativa; nenhum código seu é executado a cada frame.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| Propriedade | Valor | Rust |
|---|---|---|
| `transitionProperty` | O que anima: `"all"`, ou nomes separados por vírgulas: cores (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (todas as propriedades de transformação), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | Igual à duração | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

Tamanhos e posições fazem parte do layout, não do estilo, e não têm transição; anime mudanças de layout com `LayoutAnimation` ou controle valores com animações nativas ([Animação](./animation.md)).

<a id="keyframe-animations"></a>

### Animações de keyframes

`animationName` executa nativamente uma das animações de keyframes embutidas do Tailwind: `"spin"`, `"ping"`, `"pulse"` ou `"bounce"`, com `animationDuration`, `animationDelay`, `animationTimingFunction` e `animationIterationCount` (um número ou `"infinite"`), em qualquer ordem. Em Rust, `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` e `.animate_bounce()` as executam com a temporização do Tailwind, e `.animation(KeyframeAnimation::new(..))` com a sua própria:

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## Feedback de pressão

O feedback de pressão são os estilos do app para o estado pressionado, aplicados de forma nativa, sem ida e volta ao seu código; os estados de hover, foco e desabilitado recebem estilos da mesma maneira (`.hover(..)`, `.focus(..)`, `.disabled_style(..)` em Rust; `hoverStyle`, `focusStyle` e `disabledStyle`, ou `hover:`, `focus:`, `disabled:`, em TSX):

| Rust | TSX | Efeito enquanto pressionado |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | A view esmaece até esta opacidade |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | O fundo passa a ter esta cor |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | O ripple do Material no Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | Qualquer estilo |

Veja [Toque e gestos](./touch-and-gestures.md).

<a id="extensions"></a>

## Extensões

Estas chaves e classes trazem o que as plataformas nativas oferecem além do CSS:

| Chave | Classe | O que faz |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | A cor do placeholder de um `<Input>` |
| `selectionColor` | `selection:bg-*` | O destaque de seleção de um `<Input>` ou de um `<Text>` selecionável |
| `tintColor` | `tint-*` | Recolore os pixels opacos de um `<Image>` (imagens template, ícones) |
| `borderCurve` | | `"continuous"`: cantos que se suavizam nas bordas, como os do sistema (cantos contínuos da Apple) |
| `glassEffect` | | O Liquid Glass da Apple atrás da view no iOS 26 e no macOS 26, o `backdropFilter` nos demais |
| `writingDirection` | | A direção base de um texto, `"auto"` (o padrão: a partir do conteúdo, como fazem as views de texto das plataformas), `"ltr"` ou `"rtl"`; `direction` define a do layout |
| `textAlignVertical` | | Onde fica o texto mais curto que sua caixa `<Text>`: `"top"` (o padrão), `"center"` ou `"bottom"` |
| `textAlign: "auto"` | | O lado natural do texto, conforme sua direção (o padrão) |
| `selectedStyle` | `selected:` | O estilo enquanto `accessibilityState.selected` for `true` (um `Button` selecionado, uma aba) |
| | `ios:`, `android:`, `web:` | Classes para uma plataforma (`ios:pt-2`) |

Valores que mudam também aceitam números onde o CSS aceita uma string: `transform` como uma lista de etapas, `translate` e `scale` como `[x, y]`, `boxShadow` e `textShadow` como camadas.

<a id="related"></a>

## Relacionados

- [Tailwind](./tailwind.md): os mesmos estilos como classes, com variantes para modo escuro, estados de pressão e breakpoints, e seus equivalentes tipados.
- [Layout](./layout.md) e [Texto](./text.md).
- [Referência de estilos](../modules/style-reference.md): todas as propriedades de estilo e seus tipos.
