---
title: "Tailwind"
description: "Classes do Tailwind CSS resolvidas nativamente em TSX e seus equivalentes tipados em Rust - class e classList, variantes para estados pressionados, modo escuro e breakpoints, o tema em nsh.json e a verificação de classes em tempo de build."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---


# Tailwind

Os estilos do NSH seguem o Tailwind CSS 4. Em Rust, os utilitários do Tailwind são métodos de estilo tipados com os mesmos nomes e valores (`.p_4()` é `p-4`, `.rounded_2xl()` é `rounded-2xl`, `ZINC.shade(900)` é `zinc-900`). Em TSX, todo elemento aceita as próprias classes em `class`, resolvidas nativamente com base no tema padrão do Tailwind 4. Cada exemplo abaixo mostra primeiro os métodos tipados e depois as classes:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

Os métodos tipados são convertidos nas mesmas regras de estilo para as quais as classes são compiladas, sem nenhuma string para interpretar. Para as classes, nenhum CSS é gerado e nada é executado em JavaScript: a string é passada ao núcleo, que interpreta cada string de classes distinta uma única vez (e a mantém em cache), a transforma em regras de estilo e as aplica. As variantes que dependem de estado (pressionado, modo escuro, largura da janela) são reaplicadas pelo núcleo quando esse estado muda, e os estados de pressionado e de foco são rastreados nativamente, de modo que o feedback de `active:` (`.active(..)` em Rust) não faz nenhuma ida e volta ao seu código.

As classes e a [prop `style`](./styling.md) produzem os mesmos estilos nativos e podem ser combinadas. Esta página trata do que é específico das classes e de seus equivalentes tipados. A [referência do Tailwind](../modules/tailwind-reference.md) lista todos os utilitários compatíveis.

<a id="class-and-classlist"></a>

## class e classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** é uma string de classes. Pode ser dinâmica: ``class={`h-6 rounded bg-${color()}-500`}`` funciona, porque as classes são resolvidas em tempo de execução.
- **`classList`** mapeia classes para condições: uma classe é aplicada enquanto seu valor for verdadeiro. É aplicada depois de `class`.
- **Em Rust**, um método que recebe um closure ou um signal o acompanha (`.bg(move || ..)`), `.style_when(condition, |s| ..)` aplica estilos enquanto uma condição se mantém, e `.when(condition, |v| ..)` decide uma única vez, quando o elemento é criado.

Como os conflitos são resolvidos:

1. **As classes posteriores vencem** as anteriores na mesma string: `"p-2 p-4"` é `p-4`. Não há necessidade de `tailwind-merge`: um componente pode acrescentar o `class` que seu chamador passa. Em Rust, os métodos posteriores também vencem.
2. **As classes com variante são aplicadas depois das simples**, ordenadas pela ordem de variantes do Tailwind (`hover:` antes de `active:`, `max-*:` da mais larga para a mais estreita, breakpoints em ordem crescente, `dark:` por último), seja qual for sua posição na string. Como no Tailwind, a variante mais alta de uma classe decide, depois a seguinte mais alta, e uma classe com uma variante a mais vem depois: `dark:hover:bg-a dark:bg-b` é `bg-a` enquanto está com o ponteiro sobre ele no modo escuro, e `max-md:p-2 max-lg:p-4` é `p-2` abaixo de `md`. Como no CSS, `odd:bg-a last:bg-b` dá a uma última linha ímpar `bg-a`, porque o Tailwind ordena `odd` depois de `last`.
3. **`style` vence as classes.** Uma chave de estilo é a propriedade CSS de seu nome, a mesma que as classes definem, portanto substitui apenas essa propriedade: `style={{ paddingLeft: 8 }}` substitui `pl-4` e mantém `pr-4`.
4. `!` torna uma classe importante: `!p-0`.

Os componentes Rust (os de `nsh/base` e os do crate do próprio app) também aceitam `class` e `classList` a partir de TSX. Suas classes são mescladas depois dos estilos do próprio componente e vencem em caso de mesma precedência.

<a id="variants"></a>

## Variantes

| Variante | Aplica-se quando | Rust |
|---|---|---|
| `active:` | A view está pressionada | `.active(\|s\| ..)` |
| `hover:` | Um ponteiro está sobre a view (ponteiros do iPad e do Mac) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | Um input está com foco | `.focus(\|s\| ..)` |
| `focus-within:` | A view ou um descendente está com foco (o conteúdo de um `Overlay` é descendente da view em que está) | `.focus_within(..)` |
| `disabled:`, `enabled:` | A prop `disabled` do elemento é verdadeira / falsa | `.disabled_style(\|s\| ..)` |
| `selected:` | O elemento está selecionado (em um `Button`: `selected`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | O elemento está marcado (`accessibilityState.checked` é `true`; `"mixed"` não está marcado) | `.checked_style(..)` |
| `indeterminate:` | O elemento está indeterminado (`accessibilityState.checked` é `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | O elemento está expandido (`accessibilityState.expanded` é `true`): o gatilho de um `Popover` ou de um `Menu` enquanto seu popup está aberto | `.expanded_style(..)` |
| `aria-pressed:` | O elemento é um botão de alternância que está ligado (`accessibilityState.pressed` é `true`; `"mixed"` não está pressionado). Diferente de `active:`, um pressionamento em andamento | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, não `"mixed"`) ou `selected` é `true`, como as variantes `aria-*` do Tailwind: depois das pseudoclasses, na ordem de seus nomes | |
| `data-<name>:` | O elemento tem o atributo `data-*` `name`, como as variantes booleanas `data-*` do Tailwind (`&[data-range-start]`): o que a parte de um componente mostra além de seus estados, como o dia de um calendário no início de um intervalo (`data-range-start:`). Depois das variantes `aria-*`, na ordem de seus nomes | `Interactive::project_data(name, ..)` define um na parte de um componente |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | O ancestral mais próximo com a classe `group` está nesse estado, ou tem esse atributo `data-*` | `.group()` no ancestral; `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` dentro |
| `group-active/name:` ... | O mesmo, para um ancestral marcado com `group/name` | `.group_named("name")`; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | A posição do próprio elemento entre seus irmãos. Para colorir o rótulo de uma linha pela posição da linha, coloque `last:text-*` na linha: o rótulo o herda | Rust simples a partir do índice da linha (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | Estiliza o placeholder de um input (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | Colore o destaque de seleção de um input ou de um texto selecionável, e dos que estão dentro do elemento (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | A aparência do sistema é escura | Um `AdaptiveColor`, ou `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | A janela tem pelo menos 640, 768, 1024, 1280, 1536 pontos de largura | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | A janela é mais estreita que o breakpoint | O mesmo, com `<` |
| `min-[600px]:`, `max-[600px]:` | Breakpoints arbitrários | O mesmo |
| `portrait:`, `landscape:` | A orientação da janela | `window().width > window().height` |
| `ios:`, `android:`, `web:` | A plataforma | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | A [direção do layout](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` em uma view |
| `motion-safe:`, `motion-reduce:` | A configuração de reduzir movimento do usuário | `reduce_motion()` |

As variantes se combinam: `dark:active:bg-zinc-700`, `md:landscape:flex-row`. Em Rust, um `AdaptiveColor` em um estilo `.active(..)` é `dark:active:`.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

`disabled` em qualquer elemento (`.disabled(..)` em Rust) aplica as classes `disabled:` (`.disabled_style(..)`) e remove seus handlers de pressionamento do que está montado, de modo que também não mostra feedback de pressionamento:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

Os breakpoints são comparados com a janela (a superfície na qual o NSH renderiza), não com o dispositivo: em uma split view do iPad ou em uma janela redimensionável, eles seguem a largura da janela, como `window()` faz.

<a id="what-differs-from-tailwind-on-the-web"></a>

## O que difere do Tailwind na web

- **As unidades são pontos.** `p-4` (`.p_4()`) equivale a 16 pontos (1 passo de espaçamento = 4pt, 1rem = 16pt). Valores arbitrários em `px` também são pontos: `p-[13px]` (`.p(px(13.0))`) é 13pt.
- **`flex` é uma linha**, como no CSS: `class="flex"` dispõe seus filhos em uma linha, a menos que uma classe de direção diga o contrário (em qualquer posição da string: `flex-col flex` é uma coluna). O `display: "flex"` de um estilo e o `.flex()` do Rust são linhas da mesma forma, e uma view que não define display mantém a coluna padrão do NSH. `block` e `flow-root` usam layout de bloco, assim como `inline` e `inline-block`, como um navegador os dispõe em um pai flex ou grid. Em Rust, `.flex_row()` e `.flex_col()` definem a direção.
- **As classes de texto em views são herdadas.** `text-*`, `font-*`, `leading-*`, `tracking-*` e os demais utilitários de texto em uma view (`.text_color(..)`, `.font_weight(..)`, ... em Rust) passam para os elementos de texto e de input dentro dela, como a herança do CSS faz: `<View class="text-white">` deixa seus rótulos brancos.
- **Toda view é uma caixa própria.** `overflow-x-hidden` e `overflow-y-hidden` recortam os dois eixos, como `overflow-hidden` faz (a rolagem é do elemento [scroll](../elements/scroll.md)); `invisible` oculta a view e tudo o que está nela; `mix-blend-*` mistura uma view com tudo o que foi desenhado atrás dela; as caixas `block` mantêm separadas suas próprias margens e as de seus filhos; uma view `absolute` é posicionada em seu ancestral posicionado mais próximo, como no CSS; `fixed` dispõe uma view em sua view raiz (os outros elementos são posicionados como `absolute`).
- **O texto mantém seus espaços em branco.** Espaços e quebras de linha em uma string são desenhados como foram escritos, e `whitespace-*` define a quebra de linha. O compilador JSX colapsa os espaços em branco do texto JSX literal, como o JSX faz.
- **As transições animam grupos de propriedades**: `transition` anima cores, opacidade, sombras e transformações, e `transition-all` também raios de cantos e larguras de borda. Filtros, filtros de fundo, gradientes e layout assumem seus novos valores de uma só vez.
- **`focus-visible:` é `focus:`**: aplica-se sempre que o elemento tem foco.
- **Os fundos de estado aparecem sobre os gradientes.** No CSS, um gradiente cobre `background-color`, então `active:bg-*` em uma superfície `bg-linear-*` nunca seria visto. No NSH, uma cor de fundo de `active:`, `hover:`, `focus:` ou `group-*:` substitui o gradiente enquanto esse estado se mantém (a menos que o estado defina um gradiente próprio, como `active:from-*`). O mesmo vale para `activeStyle` e os demais estilos de estado, e para as cores de fundo animadas.
- **As configurações de texto e de toque são chaves de estilo**: `line-clamp-*` define `numberOfLines`, `text-ellipsis` e `text-clip` definem `textOverflow`, `truncate` ambos, `select-*` define `userSelect` e `pointer-events-*` define `pointerEvents`, de modo que funcionam em variantes de estado e perdem para o `style` inline, como toda classe. `caret-*`, `placeholder:text-*` e `selection:bg-*` definem os estilos `caretColor`, `placeholderColor` e `selectionColor` da mesma forma. Em Rust, são métodos de `Styled` (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap` mantém um texto em uma única linha como classe. `object-*` definem os estilos `objectFit` e `objectPosition` de imagens e vídeos, que as chaves de um style substituem como quaisquer outras.
- **O conjunto compatível**: utilitários e variantes do Tailwind 4 que têm um significado nativo. As variantes `peer-*`, os pseudoelementos (`before:`, `after:`) e as propriedades arbitrárias (`[mask-type:luminance]`) são reportados como classes desconhecidas, assim como todo utilitário para o qual o NSH não tem significado nativo, de modo que uma classe nunca significa algo diferente do que significa em um navegador. Dicas de renderização (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) são aceitas e não mudam nada.

Todo o resto funciona como documentado pelo Tailwind 4: a paleta de cores, os modificadores de opacidade (`bg-black/40`), os valores arbitrários (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`; em `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` e nos utilitários `m` também as variáveis de ambiente, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, veja [Área segura](../elements/safe-area.md) e [Teclado](../elements/keyboard.md)), as frações (`w-1/2`, `translate-x-1/2`), sombras e rings, gradientes (`bg-linear-to-r`, `bg-radial`, `bg-conic` com `from-` / `via-` / `to-`), filtros, `backdrop-blur-*`, `mix-blend-*`, transformações, `transition-*` e `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce` e grid, cada um com seu método tipado em Rust. Os limites de plataforma de [filtros e blending](./styling.md#filters-and-blending) também se aplicam às classes.

<a id="theme"></a>

## Tema

As classes são resolvidas com base no tema padrão do Tailwind 4. Estenda-o em `nsh.json` sob `"tailwind"`; suas entradas são adicionadas às padrão (ou substituem a padrão de mesmo nome):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

Com este tema, `bg-brand-500`, `text-brand` (o tom `DEFAULT`), `border-ink`, `rounded-card`, `font-display` e `tablet:flex-row` são classes válidas.

| Chave | Valores | Gera |
|---|---|---|
| `colors` | Uma cor CSS, ou um objeto de tons (`"DEFAULT"` para o nome simples) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | Pontos por passo de espaçamento (padrão 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Pontos por `rem` em valores arbitrários (padrão 16) | |
| `breakpoints` | Pontos | Variantes `name:` |
| `container` | Pontos | Tamanhos `max-w-*` |
| `fontSize` | Pontos, ou `[size, lineHeight]` com a altura de linha como múltiplo do tamanho | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | Um nome de família (uma família do sistema ou o nome de uma [fonte importada](./fonts.md)) | `font-*` |
| `tracking` | Ems | `tracking-*` |
| `leading` | Múltiplos do tamanho da fonte | `leading-*` |
| `radius` | Pontos | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | Um `box-shadow` CSS | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | Pontos | `blur-*`, `backdrop-blur-*` |
| `perspective` | Pontos | `perspective-*` |
| `aspect` | Uma proporção (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

Chaves desconhecidas e valores inválidos são erros de build (`nsh.json: tailwind: unknown theme key 'colours'`). O tema é compilado no bundle e aplicado antes do primeiro frame.

O tema do Tailwind molda suas classes. Os métodos tipados mantêm as escalas padrão do Tailwind, de modo que um componente Rust tem a mesma aparência em todo app, e obtêm a aparência do app a partir dos design tokens de seu tema, `"theme"` em `nsh.json` ([Rust](./rust.md#theme)).
<a id="theme-tokens"></a>

## Tokens de tema

O tema do app (`"theme"` em `nsh.json`) guarda seus tokens de design: as cores do shadcn/ui (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), seu `radius`, suas fontes `font-sans` e `font-mono`, e qualquer token que o app adicione. As classes os nomeiam como o Tailwind nomeia as variáveis de um `@theme` CSS, os componentes Rust os leem com `theme()` de `nsh_base`, e o TSX os lê com `token()` de `nsh`, de modo que uma tela TSX e os componentes Rust seguem o mesmo tema:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

O nome de um token é o da sua variável CSS sem `--`, como o arquivo de tema o escreve: `muted-foreground`, `radius`, `chart-1`. Em Rust, os tokens do shadcn são métodos de `theme()` (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), e todo token é `theme().color("up")`, `theme().number("radius-card")` ou `theme().font("font-display")`.

| Forma | Recebe | Exemplo |
|---|---|---|
| Um nome de cor em qualquer utilitário de cor | Uma cor do tema, também com opacidade | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, o atalho de variável do Tailwind 4 | Uma cor do tema ou um número | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | O mesmo, com tipo, quando um utilitário aceita vários tipos de valor | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | As fontes do tema, quando ele as define | `font-mono` |

- **Seus próprios tokens.** Todo nome no arquivo de tema é um token, assim como toda variável de um `@theme` CSS: `"up": "#16a34a"` gera `bg-up`, `text-up` e `bg-up/30`; `"radius-card": "14px"` gera `rounded-(--radius-card)`; `"font-display": "Pacifico"` gera `font-(family-name:--font-display)`. Os comprimentos são em pontos; `(number:--name)` passa o número puro.
- **Fontes.** `font-sans` é a fonte do app: todo texto que não define uma família própria é desenhado com ela, como uma página é com o `--font-sans` do Tailwind. `font-mono` é a fonte de `font-mono` e do código em `TextView`. Quando não definidas, ambas são as fontes do sistema.
- **Ambas as aparências.** Um token tem o valor claro e o escuro do tema: `bg-primary`, `theme().primary` e `token("primary")` mudam sozinhos com a aparência, sem a classe `dark:`. Uma cor que o tema define em apenas uma aparência é usada nas duas.
- **Suas cores do Tailwind prevalecem.** Um nome em `"tailwind"` `colors` ou na paleta do Tailwind é essa cor, portanto `bg-primary` é um token de tema quando o tema do Tailwind não tem a cor `primary`.
- **O tema pode mudar enquanto o app executa.** Quando um app embutido em um app nativo recebe o tema desse app, e sempre que o tema muda, as classes que nomeiam tokens, os bindings Rust que leem `theme()` e o código TSX que lê `token()` são atualizados, sendo as classes e os bindings de forma nativa. Os tokens que o tema do app hospedeiro não tem mantêm os valores do `"theme"` do próprio app (e, depois, os do tema padrão). Um host que apenas adiciona sua marca fornece sobrescritas de tema, ou seja, os tokens que sua marca altera, no mesmo formato de arquivo ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), `AppView::set_theme_overrides` nos desktops).
- **Verificadas como as outras classes.** Um nome que não é token do tema padrão nem do `"theme"` do app é uma classe desconhecida na compilação (`unknown class 'bg-chart-up'`). Para usar um token que só o app hospedeiro fornece, dê a ele um valor também no `"theme"` do app: esse valor aparece quando o app executa sozinho.

As classes que nomeiam tokens são resolvidas uma vez por tema, como qualquer outra classe: desenhá-las custa o mesmo que uma cor da paleta.

<a id="445-in-tsx"></a>

### `token()` em TSX

`token(name)` de `nsh` é o valor de um token na aparência exibida: uma cor como `#rrggbbaa`, um comprimento como um número de pontos, uma fonte como o nome de sua família. É reativo, então o código que o lê em um componente, em um memo ou em um effect é executado novamente quando o tema ou a aparência muda, o que serve para valores que vão onde nenhuma classe vai, como um canvas ou um gráfico:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

Os nomes são tipados: o NSH escreve os tokens do app em `.nsh/types/nsh/tokens.d.ts` a partir do tema, de modo que `token("up")` é um `string` assim que `"up"` está no tema, e um nome que o tema não tem é um erro de tipo.

<a id="the-class-check"></a>

## A verificação de classes

`nsh build`, `nsh dev`, `nsh run` e `nsh test` verificam os nomes de classe estáticos no seu JSX (literais de string em `class` e as chaves de `classList`) com o mesmo parser e o mesmo tema que o runtime usa, e avisam sobre classes que não existem:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

Os avisos não fazem a compilação falhar. As classes construídas em tempo de execução (``bg-${color()}-500``) são verificadas quando o runtime as vê pela primeira vez, e ele registra cada classe desconhecida uma única vez (`unknown classes: ...`). Os métodos tipados são verificados pelo compilador Rust.

<a id="classes-or-styles"></a>

## Classes ou estilos?

Ambos são resolvidos nativamente e custam aproximadamente o mesmo. As classes são mais curtas e oferecem variantes (estados pressionados, modo escuro, breakpoints) sem código. Os estilos inline aceitam valores calculados em JavaScript e [valores animados nativos](./animation.md) (`opacity: fade`, `translate: [x, 0]`). A maioria dos apps TSX usa classes para a aparência estática e `style` para o que é calculado ou animado. Os componentes Rust usam métodos tipados para ambos e vinculam valores animados com `.bind_opacity(..)`, `.bind_translate_x(..)` e os demais bindings.

<a id="related"></a>

## Relacionados

- [Estilização](./styling.md): a prop de estilo, os métodos tipados e os limites de plataforma dos efeitos.
- [Referência do Tailwind](../modules/tailwind-reference.md): todos os utilitários e variantes.
- [Layout](./layout.md): flexbox e grid, também disponíveis como classes.
