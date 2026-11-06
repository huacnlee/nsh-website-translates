---
title: "Referência do Tailwind"
description: "Todos os utilitários e variantes do Tailwind que o NSH resolve nativamente, a sintaxe de valores arbitrários e como estender o tema em nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---


# Referência do Tailwind

Todo elemento aceita classes do Tailwind CSS na prop `class` (e as condicionais em `classList`). O NSH as resolve em Rust contra o tema padrão do Tailwind 4: o JS passa apenas a string, cada string distinta é analisada uma vez e armazenada em cache, e variantes como `dark:` ou `active:` são reavaliadas nativamente quando a aparência, o tamanho da janela ou o estado de pressionamento muda, sem executar nenhum JS.

Cada utilitário define exatamente o que o Tailwind CSS 4 gera para ele, com o mesmo significado de um navegador. Esta página lista o que é suportado. Para uma introdução, veja [Tailwind](../docs/tailwind.md); para as chaves de estilo que os utilitários definem, veja a [Referência de estilos](./style-reference.md).

Componentes Rust não recebem strings de classe: eles estilizam elementos com os métodos tipados de `Styled` (`nsh_core::prelude`), nomeados a partir desses utilitários e resolvendo para os mesmos valores, incluindo as escalas padrão do Tailwind (`px-4` é `.px_4()`, `rounded-2xl` `.rounded_2xl()`, `shadow-md` `.shadow_md()`, `bg-linear-to-br` `.bg_linear_to_br()`). Cores são valores: cores do tema, ou a paleta do Tailwind como `nsh_core::element::palette` (`ZINC.shade(800)` é `zinc-800`). Variantes são métodos que recebem um closure de estilos: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)` e `.style_when(condition, …)` para as demais. A [Referência de estilos](./style-reference.md) indica o método de cada chave de estilo.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Como as classes se combinam

- **O último vence.** Entre utilitários do mesmo nível de variante, o que vem depois na string vence: `"p-4 p-2"` é `p-2`. Um componente pode receber uma prop `class` e anexá-la às suas próprias classes sem `tailwind-merge`.
- **Variantes se aplicam depois dos utilitários simples**, na ordem de variantes do Tailwind: `group-*:` (pelo estado e depois pelo nome do grupo), `selection:`, `placeholder:`, posição (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (por nome), movimento, `max-*:` breakpoints do mais largo ao mais estreito, depois breakpoints em ordem crescente, orientação, direção, `dark:` e, por fim, plataforma. A variante mais alta de uma classe decide, depois a próxima mais alta, e uma variante adicional vem depois (`dark:hover:` depois de `dark:`), como o Tailwind as ordena. Assim, `"active:bg-red-500 bg-blue-500"` fica vermelho enquanto pressionado.
- **`style` vence as classes.** O `style` inline é aplicado sobre as classes resolvidas. Uma chave de estilo é a propriedade CSS de mesmo nome, a mesma que os utilitários definem, então ela substitui essa propriedade e nada mais: `style={{ paddingLeft: 8 }}` vence `pl-4` e mantém `pr-4`. Um utilitário important (`!p-4` ou `p-4!`) também vence o estilo inline.
- **Estilos de texto são herdados.** Utilitários de texto em uma view (`text-white`, `font-bold`, `text-center`, ...) passam para os elementos `<Text>` e `<Input>` dentro dela, como no CSS.
- **Display é o do CSS.** `flex` e `inline-flex` criam uma linha, a menos que um utilitário de direção diga o contrário, onde quer que ele esteja na string (`flex-col flex` é uma coluna). O `display: "flex"` de um estilo é uma linha da mesma forma; views que não definem display mantêm o padrão de coluna do NSH.

<a id="units-and-the-theme"></a>

## Unidades e o tema

Os comprimentos são em pontos (`1` = um ponto no iOS, um dp no Android). O `1rem` do Tailwind equivale a 16 pontos, então o tema coincide com o da web na mesma densidade: um passo de espaçamento são 4 pontos (`p-4` = 16 pontos), `text-base` são 16 pontos.

<a id="spacing-values"></a>

### Valores de espaçamento

Utilitários que recebem um valor de espaçamento (padding, margin, gap, inset, largura, altura, `basis`, `translate`, `leading`) aceitam:

| Valor | Exemplo | Resultado |
|---|---|---|
| Passos (quartos de passo permitidos) | `p-4`, `gap-1.5`, `m-0.25` | passo × 4 pontos |
| `px` | `p-px`, `-mt-px` | 1 ponto |
| `0` | `m-0` | 0 |
| Fração (inset, largura, altura, `basis`, `translate`) | `w-1/2`, `left-1/3` | porcentagem do pai |
| `full` (o mesmo) | `w-full`, `inset-full` | 100% |
| `auto` (margin, inset, largura, altura, basis) | `mx-auto`, `w-auto` | `"auto"` |
| Arbitrário | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | o comprimento informado |

Margens, insets, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, linhas de grid e ângulos de gradiente aceitam um `-` inicial para valores negativos: `-mt-2`, `-translate-x-1/2`, `-rotate-6`. O Tailwind não tem forma negativa para os demais (`-p-4`, `-gap-2`, `-w-4`), e o NSH também não.

<a id="colors"></a>

### Cores

A paleta completa do Tailwind 4 está embutida: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, cada uma nos tons `50`, `100`–`900`, `950`; mais `black`, `white` e `transparent`. Suas próprias cores vêm de `nsh.json` (veja [Personalização do tema](#theme-customization)).

Todo utilitário de cor aceita:

| Forma | Exemplo |
|---|---|
| Uma cor do tema | `bg-sky-500`, `text-brand` |
| Um modificador de opacidade (porcentagem) | `bg-black/50`, `ring-black/5` |
| Uma opacidade arbitrária | `text-black/[0.35]` |
| Uma cor arbitrária | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Uma cor arbitrária com modificador | `bg-[rgb(0_0_255)]/25` |

`currentColor` e `inherit` não são valores de cor. Como em um navegador, uma borda, um outline ou um ring sem classe de cor é desenhado na cor do texto do elemento, a própria ou a herdada (`<View class="text-white"><View class="border ring-2" /></View>` desenha ambos de branco), e o mesmo vale para uma borda cuja largura é definida pela prop `style` sem cor.

<a id="arbitrary-values"></a>

## Valores arbitrários

Colchetes passam um valor que o tema não tem: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` representa um espaço (`grid-cols-[1fr_2fr]`); escreva `\_` para um sublinhado literal.
- Comprimentos: um número puro ou `px` (pontos), `pt` (4/3 de ponto, como no CSS), `rem` (16 pontos) e `%` onde porcentagens fazem sentido.
- Ângulos (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`.
- Tempos (`duration-[...]`, `delay-[...]`): `ms` ou `s`; um número puro é em milissegundos.
- Dicas de tipo resolvem valores ambíguos: `text-[length:22px]` é um tamanho, `text-[color:#333]` uma cor; `border-[length:3px]` idem.

Propriedades CSS arbitrárias (`[mask-type:luminance]`) não são suportadas.

## Layout

| Classe | Define |
|---|---|
| `flex`, `inline-flex` | `display: "flex"` e uma linha, a menos que haja um utilitário de direção |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | layout em bloco ou um contexto de formatação de bloco independente |
| `box-border`, `box-content` | as dimensões incluem bordas e padding, ou apenas o conteúdo |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | tamanhos intrínsecos do Taffy: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: o que um navegador calcula para eles em um pai flex ou grid |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: no fluxo, com seus insets ignorados; descendentes absolutos usam o ancestral posicionado mais próximo |
| `sticky` | `position: "sticky"`: no fluxo, gruda em `top` (`left` em uma scroll view horizontal) dentro da scroll view ao redor enquanto seu pai estiver visível |
| `fixed` | `position: "fixed"`: um elemento posicionado na caixa da sua view raiz (a janela ou seu modal) acima dos filhos dessa view raiz, parado no lugar enquanto o que está ao redor rola |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | o deslocamento correspondente |
| `start-<n>`, `end-<n>` | `start` / `end` (conforme a direção) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` é 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (mantém seu espaço) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, none) |

A rolagem é um elemento, não uma classe: `overflow-auto` e `overflow-scroll` não são suportados; use [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox e grid

| Classe | Define |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1, shrink 1, basis 0 |
| `flex-<n>` | grow n, shrink 1, basis 0 |
| `flex-auto` | grow 1, shrink 1, basis auto |
| `flex-initial` | grow 0, shrink 1, basis auto |
| `flex-none` | grow 0, shrink 0, basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | a abreviação do CSS: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (sem valor: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (sem valor: 1) |
| `basis-<n>` | `flexBasis` (espaçamento, fração, `full`, `auto`, arbitrário) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` e `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` e `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` e `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (e negativo) | uma margem em cada filho, exceto o último: a margem final (`space-x`) ou a inferior (`space-y`), sob as margens do próprio filho, como no Tailwind CSS; ela se soma a um `gap` |
| `space-x-reverse`, `space-y-reverse` | a margem do lado inicial / superior (filhos em ordem inversa) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (e `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (e `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## Espaçamento

| Classe | Define |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (conforme a direção) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (conforme a direção) |

<a id="sizing"></a>

## Dimensionamento

| Classe | Define |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (espaçamento, fração, `full`, `auto`, arbitrário) |
| `size-<n>` | `width` e `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | o limite correspondente |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | a largura da janela (também em `min-w-` / `max-w-`) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | a altura da janela (também em `min-h-` / `max-h-`) |
| `w-auto`, `h-auto` | `auto` (dimensionado pelo conteúdo) |
| `max-w-none`, `max-h-none` | sem limite |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | uma largura de contêiner (abaixo) |

Larguras de contêiner (pontos): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280; `prose` é 65 vezes a largura do `0` da fonte do elemento (o `65ch` do CSS), como no Tailwind CSS.

<a id="typography"></a>

## Tipografia

<a id="font"></a>

### Fonte

| Classe | Define |
|---|---|
| `font-sans` | a fonte do sistema |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | um peso numérico, caso contrário uma família: `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (elas se combinam; `normal-nums` redefine as formas numéricas) |

<a id="size-color-and-line-height"></a>

### Tamanho, cor e altura de linha

`text-<size>` define o tamanho da fonte e a altura de linha correspondente do Tailwind, que uma classe `leading-*` substitui onde quer que esteja na string e qualquer que seja sua variante (`leading-tight md:text-lg` mantém a entrelinha justa):

| Classe | Tamanho | Altura de linha |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Classe | Define |
|---|---|
| `text-<size>/<leading>` | tamanho e altura de linha: `text-sm/6` (24 pontos), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | `lineHeight` como múltiplo do tamanho da fonte |
| `leading-<n>`, `leading-[<length>]` | `lineHeight` em pontos (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` como múltiplo do tamanho da fonte (`leading-[1.5]`), herdado como esse multiplicador; `em` e `%` calculam um comprimento no tamanho de fonte do elemento antes da herança |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | `letterSpacing` relativo ao tamanho da fonte |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Alinhamento, caixa e quebra de linha

| Classe | Define |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: o início ou o fim da linha na direção do layout |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (views e imagens dentro de um texto) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | uma linha, reticências no final, sem quebra, `overflow: hidden` (em uma view: seus textos não quebram) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` mostra todas as linhas) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | as linhas nunca quebram; em uma view, as linhas dos textos dentro dela (herdado, como o `white-space` do CSS) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | as linhas quebram (o balanceamento não é feito) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`; em uma view, dos textos dentro dela que não definem nenhum |
| `select-auto` | `userSelect: "auto"`: a view ao redor decide, como o `user-select: auto` do CSS (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### Decoração e sombra

| Classe | Define |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | uma sombra de texto do tema (uma camada: a mais larga das do tema); o modificador é o alfa das camadas: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | sua cor, com o alfa do tamanho |
| `text-shadow-none` | a remove |

As sombras de texto do Tailwind têm várias camadas; nativamente, uma sombra é desenhada: a camada mais larga.

### Inputs

| Classe | Define |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (o destaque da seleção de um input ou de um texto selecionável, e dos que estão dentro do elemento) |
| `caret-<color>` | a cor do cursor |

<a id="backgrounds"></a>

## Fundos

| Classe | Define |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | um gradiente linear em direção a um lado ou canto (`bg-gradient-to-*` é o nome na v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | um gradiente linear em um ângulo: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | um gradiente radial a partir do centro |
| `bg-conic`, `bg-conic-<angle>` | um gradiente cônico, opcionalmente começando em um ângulo |
| `from-<color>`, `via-<color>`, `to-<color>` | as paradas do gradiente (por padrão, transparentes nas extremidades) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | posições das paradas: `via-40%`, `from-[15%]` |
| `bg-none` | remove o gradiente |

As utilitárias de gradiente misturam suas cores em Oklab, como o Tailwind CSS as escreve (`in oklab`); em uma posição arbitrária (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`), seguem o padrão do CSS: Oklab com as cores da paleta e sRGB quando todas as paradas são cores hex, `rgb()`, `hsl()` ou nomeadas.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## Bordas

| Classe | Define |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (sem valor: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (com `-<n>` ou sem valor) | as larguras dos lados correspondentes |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` e as cores por lado |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: nenhuma borda, independentemente das classes de largura, em qualquer ordem (`md:border-solid` a mostra novamente) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (sem valor: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | os cantos correspondentes |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | cantos de início / fim (sensíveis à direção): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (sem valor: 1), sólida a menos que uma classe de estilo esteja em qualquer lugar da string (`outline-dashed outline-2` é tracejada, `outline-none outline-2` não desenha nada) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`; um estilo sozinho tem a largura medium do CSS, 3 pontos |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

Tamanhos de raio (pontos): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### Anéis

Anéis são sombras de caixa com espalhamento, desenhadas fora da borda sem ocupar espaço.

| Classe | Define |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | um anel dessa largura (sem valor: 1) |
| `ring-<color>` | sua cor (por padrão, a cor do texto do elemento) |
| `ring-inset` | desenha o anel por dentro |
| `ring-offset-<n>`, `ring-offset-<color>` | um espaço entre o elemento e o anel (por padrão, branco) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | um anel interno |

<a id="effects"></a>

## Efeitos

| Classe | Define |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | `boxShadow` do tema; o modificador é o alfa das camadas: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | uma sombra arbitrária: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | recolore as camadas da sombra, com o alfa do tamanho: `shadow-indigo-500/40` |
| `shadow-none` | sem sombra |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | uma sombra interna |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

Sombras, anéis e sombras internas se combinam em uma única lista `boxShadow`, como no CSS. Uma cor de sombra substitui a cor de cada camada, inclusive o alfa, como o `--tw-shadow-color` do Tailwind: `shadow-md shadow-red-500` é uma sombra vermelha opaca, `shadow-md/20 shadow-red-500` uma a 20%.

<a id="filters"></a>

## Filtros

| Classe | Define |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | fatores percentuais: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | sem valor: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>` em qualquer um | um `drop-shadow()` por camada, depois dos outros filtros; uma cor substitui a das camadas, com o alfa do tamanho; web, Linux, Windows e GPUI desenham todas as camadas, iOS, macOS e Android desenham a mais larga |
| `drop-shadow-none` | o remove |
| `filter-none` | remove todos os filtros |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | desfoca o que está atrás da view |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | filtros de backdrop |
| `backdrop-filter-none` | os remove |

> [!WARNING]
> O iOS aplica apenas `opacity`, `brightness` até 1 e `drop-shadow` a views; `<Image>` aceita todos os filtros de cor e `blur`. O Android precisa da API 31 para `blur`, `drop-shadow` e desfoque de backdrop. Veja a [Referência de estilo](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## Transformações

| Classe | Define |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (espaçamento, `full`, frações do tamanho do próprio elemento: `-translate-x-1/2`, arbitrário) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | rotação 3D (em `transform`, depois da translação, da rotação e da escala) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100` espelha |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | inclinação (skew), em `transform` (não no Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | profundidade para as rotações 3D dos filhos do elemento, vista a partir do seu centro (`perspective` do CSS: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | limpa as rotações 3D e as inclinações (`transform: none` do CSS) |
| `translate-none`, `rotate-none`, `scale-none` | limpa a translação, a rotação, a escala |

As utilitárias de transformação se compõem como no CSS: `translate-*`, `rotate-*` e `scale-*` definem as propriedades `translate`, `rotate` e `scale` e se combinam independentemente da ordem; depois, `transform` é aplicado (`rotate-x-*`, `skew-*`). As chaves de mesmo nome da prop `style` substituem apenas a própria propriedade: `style={{ scale: 1.1 }}` substitui `scale-95` e mantém `rotate-3`. `transform`, `transform-gpu`, `transform-cpu` e `transform-flat` são aceitas e não fazem nada: o NSH compõe todas as transformações da mesma forma, de maneira plana. As translações por uma fração do tamanho são resolvidas em relação ao frame do elemento e o acompanham quando ele é redimensionado.

<a id="transitions-and-animation"></a>

## Transições e animação

| Classe | Define |
|---|---|
| `transition` | cores, opacidade, sombra e transformação; 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | as propriedades animadas |
| `transition-none` | sem transição |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | uma animação nativa por keyframes, repetida indefinidamente |
| `animate-none` | a interrompe |

As transições rodam na thread de UI quando um valor muda, inclusive quando uma variante passa a corresponder ou deixa de corresponder, então `transition active:scale-95` anima o toque sem JS. Envolva as animações em `motion-safe:` para respeitar a configuração de redução de movimento.

<a id="interactivity"></a>

## Interatividade

| Classe | Define |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: se a view é alvo de toques e do ponteiro, herdado como no CSS: dentro de uma view `pointer-events-none`, uma view `pointer-events-auto` volta a ser alvo |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (toda palavra-chave de cursor do CSS) |
| `select-none`, `select-text`, `select-auto` | seleção de texto (veja Tipografia) |

## SVG

| Classe | Define |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` é `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## Imagens

| Classe | Define |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` estica, `none` mantém o tamanho natural, posicionada em `objectPosition`, `scale-down` é o mesmo, reduzido para caber onde for maior); imagens e vídeos |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... equivalem a `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (recolore imagens template) |

<a id="accepted-without-effect"></a>

## Aceitos sem efeito

Estas utilitárias são dicas de renderização, ou aquilo que toda view nativa já é; são interpretadas sem aviso e não mudam nada: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. Rolagem, snapping e overscroll são props de [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## Não suportado

Variantes `peer-*`, pseudoelementos (`before:`, `after:`), propriedades arbitrárias (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, container queries, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, restrições intrínsecas de mín/máx (como `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` e `isolate` são classes desconhecidas. `nsh build` e `nsh dev` avisam sobre as classes desconhecidas que encontram no seu código-fonte (`file:line:col: unknown class '...'`), e o runtime registra cada classe desconhecida uma única vez.

<a id="variants"></a>

## Variantes

As variantes tornam uma utilitária condicional: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. Elas se empilham (`dark:active:bg-zinc-700`) e são avaliadas nativamente sempre que aquilo de que dependem muda.

<a id="appearance-and-environment"></a>

### Aparência e ambiente

| Variante | Aplica-se quando | Rust |
|---|---|---|
| `dark:` | a aparência é escura | `.dark(\|s\| …)` |
| `ios:` | executando no iOS ou Mac Catalyst | `.when(os() == Os::Ios, …)` |
| `android:` | executando no Android | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | a janela é mais alta que larga / mais larga que alta | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | a direção do layout | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | o usuário não pediu / pediu movimento reduzido | `.style_when(reduce_motion, …)` |

### Breakpoints

Os breakpoints comparam a largura da janela em pontos.

| Variante | Largura mínima |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| Forma | Exemplo | Aplica-se quando |
|---|---|---|
| `<bp>:` | `md:p-8` | largura ≥ breakpoint |
| `max-<bp>:` | `max-md:p-1` | largura < breakpoint |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | largura ≥ o comprimento |
| `max-[<length>]:` | `max-[400px]:text-sm` | largura < o comprimento |

Um celular em modo retrato (390 pontos de largura) não corresponde a nenhum dos breakpoints padrão; um tablet ou um celular em modo paisagem corresponde a vários. Em Rust, um breakpoint é uma condição sobre a janela: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` é `md:p-8`.

<a id="interaction-states"></a>

### Estados de interação

Os estados são rastreados pela plataforma apenas para os elementos cujas classes os usam, e as mudanças são aplicadas nativamente, sem ida e volta ao JS.

| Variante | Aplica-se quando | Rust |
|---|---|---|
| `active:` | o elemento está pressionado | `.active(\|s\| …)` |
| `hover:` | um ponteiro está sobre ele (ponteiro do iPad, Mac Catalyst, mouse no Android) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | o input tem foco | `.focus(\|s\| …)` |
| `focus-within:` | o elemento ou um descendente tem foco (o conteúdo de um `Overlay` é descendente do elemento em que ele está) | `.focus_within(…)` |
| `disabled:` | o elemento tem a prop `disabled` | `.disabled_style(\|s\| …)` |
| `enabled:` | o elemento não tem a prop `disabled` |  |
| `selected:` | o elemento está selecionado: o `selected` de um `Button`, ou `accessibilityState.selected` |  |
| `checked:` | o elemento está marcado: `accessibilityState.checked` é `true` (`"mixed"` não está marcado) |  |
| `indeterminate:` | o elemento está indeterminado: `accessibilityState.checked` é `"mixed"` |  |
| `aria-expanded:` | o elemento está expandido: `accessibilityState.expanded` é `true` (o gatilho de um `Popover` ou `Menu` enquanto seu popup está aberto) |  |
| `aria-pressed:` | o elemento é um botão de alternância que está ligado: `accessibilityState.pressed` é `true` (`"mixed"` não está pressionado; não é `active:`, um toque em andamento) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | o elemento está ocupado: `accessibilityState.busy` é `true` |  |
| `aria-checked:` | o elemento está marcado: `accessibilityState.checked` é `true`, como `checked:` |  |
| `aria-selected:` | o elemento está selecionado: `accessibilityState.selected` é `true`, como `selected:` |  |
| `data-<name>:` | o elemento tem o atributo booleano `data-*` `name` (`&[data-<name>]` do Tailwind; nomes com letras minúsculas, dígitos e `-`): o que a parte de um componente mostra além de seus estados, como o dia de um calendário no início de um intervalo `data-range-start` | `Interactive::project_data(name, …)` define um |

Os mesmos estados como objetos de estilo são as props `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` e `pressedStyle` de todo elemento (e o `selectedStyle` de um `Button`); elas prevalecem sobre o estilo e as classes do elemento.

`disabled` funciona em qualquer elemento: aplica `disabled:` e remove os handlers de toque do elemento, então também não mostra feedback de toque.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### Grupos

Marque um ancestral com `group` e estilize os descendentes de acordo com o estado dele usando `group-<state>:`. Dê nomes aos grupos para aninhá-los: `group/card` e `group-hover/card:`.

| Variante | Aplica quando o grupo está | Rust |
|---|---|---|
| `group-active:` | pressionado | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | com o ponteiro sobre ele | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | focado |  |
| `group-focus-within:` | focado ou contendo o foco | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | desabilitado |  |
| `group-selected:` | selecionado |  |
| `group-checked:` | marcado |  |
| `group-indeterminate:` | indeterminado |  |
| `group-aria-expanded:` | expandido |  |
| `group-aria-pressed:` | um botão de alternância que está ativado |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | ocupado, marcado, selecionado |  |
| `group-data-<name>:` | que exibe o atributo `data-*` `name` |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### Posição entre irmãos

| Variante | Aplica-se a |
|---|---|
| `first:` | o primeiro filho |
| `last:` | o último filho |
| `only:` | o filho único |
| `odd:` | o 1º, 3º, ... filho |
| `even:` | o 2º, 4º, ... filho |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Placeholder e seleção

`placeholder:` se aplica ao placeholder de um `<Input>` e aceita apenas uma cor de texto: `placeholder:text-zinc-400` (a chave de estilo `placeholderColor`). `selection:` se aplica à seleção de um `<Input>` ou de um `<Text>` selecionável e, em qualquer elemento, aos elementos dentro dele (`& *::selection` do Tailwind; vale o do elemento mais próximo), e aceita o seu fundo, o destaque: `selection:bg-violet-200` (a chave de estilo `selectionColor`, que também colore o cursor de um input nas plataformas que o desenham em uma única cor).

<a id="important"></a>

### Importante

`!` antes ou depois de um utilitário (`!p-4`, `p-4!`) faz com que ele prevaleça sobre qualquer outra classe e sobre o `style` inline.

<a id="theme-customization"></a>

## Personalização do tema

Estenda o tema no objeto `"tailwind"` do `nsh.json` do seu app. Entradas com um nome novo são adicionadas; entradas com um nome já existente substituem o padrão. Os comprimentos são em pontos. O tema é verificado quando o app é empacotado: uma chave desconhecida ou um valor inválido causa um erro de build.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

Com esse tema, `bg-brand-500`, `bg-brand` (o tom `DEFAULT`), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` e `max-w-content` funcionam.

| Chave | Valor | Usado por |
|---|---|---|
| `colors` | `{ name: color }` ou `{ name: { shade: color } }`; `DEFAULT` nomeia a cor sem tom. Qualquer sintaxe de cor CSS. | todo utilitário de cor |
| `spacing` | pontos por passo (padrão 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | pontos por `rem` (padrão 16) | |
| `breakpoints` | `{ name: width }` | variantes de breakpoint (ordenadas por largura) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (uma família do sistema ou o nome de uma fonte incluída no app) | `font-*` |
| `fontSize` | `{ name: size }` ou `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> O tema do Tailwind molda apenas as classes do seu app. Os tokens de design do app (as cores do shadcn/ui, `radius`, as fontes e os do próprio app) são o tema dele, a chave `"theme"` de `nsh.json`, com a qual os componentes Rust desenham; veja [Rust](../docs/rust.md#theme). As classes referenciam esses tokens como o Tailwind nomeia as variáveis `@theme` (`bg-primary`, `bg-up/30`, `rounded-(--radius)`): veja [Tokens de tema](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## Relacionados

- [Tailwind](../docs/tailwind.md): o guia.
- [Estilização](../docs/styling.md): `class`, `classList`, `style` e como eles se combinam.
- [Referência de estilos](./style-reference.md): as chaves de estilo que os utilitários definem.
