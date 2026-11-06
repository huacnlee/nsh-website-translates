---
title: "Texto"
description: "Exibindo texto com o elemento text em Rust e TSX - spans aninhados e links, views inline, fontes e decorações, truncamento, tamanho de texto do sistema, seleção e onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---


# Texto

Todo texto é exibido por elementos de texto: `text(..)` em Rust, `<Text>` em TSX. Um elemento de texto é um parágrafo, composto pelo mecanismo de texto da plataforma (CoreText nas plataformas Apple, `StaticLayout` no Android) na thread do engine quando é feito o layout, e desenhado apenas na thread principal. Elementos de texto aninhados são spans do mesmo parágrafo, não views separadas.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> Strings são exibidas por elementos de texto. Em TSX, uma string colocada diretamente em um `<View>` não é exibida: envolva-a em `<Text>`.

O elemento em si está documentado em [text](../elements/text.md); esta página trata de como usá-lo.

<a id="strings-and-whitespace"></a>

## Strings e espaços em branco

Em Rust, o conteúdo de um texto é uma string, exibida como escrita: `\n` quebra a linha. Conteúdo que lê signals é uma closure, e o texto é atualizado quando eles mudam. Em TSX, o texto JSX segue as mesmas regras do React: cada linha é aparada (trim), linhas que contêm apenas espaço em branco são descartadas e as linhas restantes são unidas com um único espaço. O espaço em branco dentro de uma linha é mantido, então `{first} {last}` mantém seu espaço. Use `{" "}` para um espaço no início ou no fim de uma linha e `{"\n"}` para uma quebra de linha:

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

Expressões no texto acompanham o que leem: `text(move || format!("{} items", count.get()))` e `<Text>{count()} items</Text>` são atualizados quando `count` muda.

<a id="spans-and-inheritance"></a>

## Spans e herança

Um texto dentro de um texto é um span. Ele herda o estilo de texto do pai e sobrescreve o que definir:

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

Os estilos de texto também são repassados a partir das views, como em CSS: `view().text_color(white()).text_sm()` em Rust e `<View class="text-white text-sm">` em TSX estilizam os elementos de texto e de entrada dentro delas.

### Links

Um span com um handler de press (`.on_press(..)` ou `.on_long_press(..)`; `onPress` ou `onLongPress`) é um link: um toque sobre seus caracteres vai para o span, um toque em outro lugar vai para o parágrafo. Links em spans aninhados também funcionam.

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Fundos de spans

A cor de fundo e o raio de borda de um span pintam uma caixa atrás de seus caracteres em cada linha que ele ocupa, com a altura da sua fonte; o texto tem o mesmo layout e é copiado inteiro, então código inline é um span ([elemento text](../elements/text.md#span-backgrounds)):

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### Views e imagens dentro do texto

Qualquer elemento que não seja um texto dentro de um texto é disposto inline, sobre a linha de base, e quebra junto com as palavras. Ele pode receber toques próprios:

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Elementos inline cortados por `numberOfLines` ou por reticências ficam ocultos; ao copiar o texto, eles são deixados de fora. O texto dentro de um elemento inline assume a cor do texto ao redor, assim como o `color` do CSS alcança um inline block, a menos que defina a sua própria (o badge `LIVE` acima faz isso); sua fonte e altura de linha continuam sendo as dele.

A chave de estilo `verticalAlign` posiciona um elemento inline em sua linha, como o `vertical-align` do CSS posiciona uma imagem: `"baseline"` (o padrão) apoia a base do elemento na linha de base, `"text-top"` e `"text-bottom"` colocam seu topo ou sua base no topo ou na base da fonte do texto, e `"middle"` o centraliza à metade da altura-x da fonte acima da linha de base. A linha cresce para acomodar o elemento sempre que ele ultrapassa a fonte, também com um `lineHeight` fixo. Um ícone no início de um parágrafo que deve se alinhar à base do texto, como o `ImageSpan` do Android o desenha, usa `"text-bottom"`. As classes são `align-baseline`, `align-text-top`, `align-text-bottom` e `align-middle`; em Rust, `.align_text_bottom()` e os outros de mesmos nomes.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## Estilos de texto

| Propriedade | Valores | Rust |
|---|---|---|
| `color` | Uma [cor](./styling.md#colors). Padrão: preto | `.text_color(..)` |
| `fontSize` | Pontos. Padrão: 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700) ou `100`–`900` (número ou string) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: emojis coloridos permanecem retos | `.italic()` |
| `fontFamily` | Uma família do sistema, uma família genérica ou uma [fonte importada](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Pontos | `.line_height(px(..))` |
| `letterSpacing` | Pontos | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` e `right` mantêm seus lados esquerdo e direito, `start` e `end` seguem a direção | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: onde fica o texto menor que sua caixa | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | Cor; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Pontos ou `"auto"` (a espessura também aceita `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | `text-shadow` do CSS, uma sombra atrás dos glifos: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (deslocamentos, desfoque, cor), ou suas camadas como números, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`; várias camadas são desenhadas como a mais larga | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | Recursos OpenType: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: a direção base do parágrafo | `.writing_direction(WritingDirection::Rtl)` |

Um elemento de texto também é uma view: ele aceita fundos, bordas, cantos, padding e os demais [estilos de view](./styling.md).

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` dá a todos os dígitos a mesma largura, o que evita que contadores e preços fiquem tremendo quando mudam.

<a id="truncation"></a>

## Truncamento

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Chave de estilo / prop | Rust | Descrição |
|---|---|---|
| `numberOfLines` (estilo) | `.number_of_lines(n)` | O máximo de linhas exibidas; `0` (padrão) mostra todas |
| `textOverflow` (estilo) | `.text_overflow(EllipsizeMode::Middle)` | Como o texto que não cabe é cortado: reticências no fim (`"ellipsis"`, padrão), no início (`"ellipsis-start"`) ou no meio (`"ellipsis-middle"`), ou `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | Reduz a fonte até o texto caber em suas linhas e em sua caixa |
| `minimumFontScale` | | Quanto `adjustsFontSizeToFit` pode reduzir (0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

As classes Tailwind `line-clamp-*`, `text-ellipsis` e `text-clip` definem as mesmas chaves, e `truncate` (`.truncate()`) é uma linha cortada com reticências; como chaves de estilo, elas também aceitam estilos de estado e variantes.

<a id="system-text-size"></a>

## Tamanho de texto do sistema

Por padrão, o texto segue a configuração de tamanho de texto do usuário (Dynamic Type no iOS, tamanho da fonte no Android).

| Prop | Rust | Descrição |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` mantém o tamanho fixo. Padrão: `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | A maior escala aplicada, p. ex. `1.5`. `0` significa sem limite |

`font_scale()` em Rust e `fontScale()` de [`nsh`](../modules/nsh.md#device) em TSX são a escala atual e mudam quando o usuário altera a configuração. Os inputs também aceitam `allowFontScaling` e `maxFontSizeMultiplier`.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

Prefira limitar a escala a desativá-la: texto grande é uma configuração de acessibilidade da qual as pessoas dependem.

<a id="selection"></a>

## Seleção

A chave de estilo `userSelect: "text"` (`.select_text()`, a classe `select-text`) permite ao usuário selecionar e copiar o texto, como nas views de texto do próprio sistema: um toque longo seleciona a palavra sob o dedo, as alças movem as extremidades da seleção, e o menu de edição oferece Copiar e Selecionar Tudo (o iOS adiciona Consultar, Traduzir e Compartilhar; o Android, Compartilhar). Uma seleção permanece dentro de um único bloco de texto. A chave de estilo `selectionColor` (`.selection_color(..)`, `selection:text-*`) define a cor do destaque e das alças. `userSelect` definido em uma view alcança os textos dentro dela que não definem nenhum.

Em navegadores desktop, o texto é selecionável por padrão, como em uma página web, exceto dentro de elementos interativos (views com handlers de press ou de toque, como botões e linhas pressionáveis); `userSelect: "none"` (`.select_none()`, a classe `select-none`) mantém um texto não selecionável nesses casos. Navegadores de celular e tablet seguem a regra nativa.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

Para copiar a partir do código (um botão Copiar), use `set_clipboard(..)` em Rust ou [`Clipboard`](../modules/nsh.md#clipboard) em TSX.

## onTextLayout

`onTextLayout` (o evento `TextLayout` em Rust) informa as linhas já dispostas após cada layout, na caixa de conteúdo do texto:

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

Cada linha tem `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` e `xHeight` (`cap_height` e `x_height` em Rust). Use-o para mostrar um botão "Ler mais" somente quando o texto foi cortado, ou para alinhar outro conteúdo a uma linha de base.

<a id="accessibility"></a>

## Acessibilidade

Um elemento de texto é lido pelos leitores de tela como seu conteúdo. Atribua um role ao texto que atua como título (`.role(AccessibilityRole::Header)`, `role="header"`) e aos links (`AccessibilityRole::Link`, `role="link"`). Consulte [Acessibilidade](./accessibility.md).

<a id="related"></a>

## Relacionados

- [Fontes](./fonts.md): fontes personalizadas e pesos.
- [elemento text](../elements/text.md): todas as props.
- [Formulários e teclado](./forms-and-keyboard.md): entrada de texto.
