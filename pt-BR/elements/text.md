---
title: "Texto"
description: "O elemento que desenha texto: spans aninhados, links, limites de linha, escala de fonte, views inline e eventos de layout de texto."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---


# Texto

`Text` desenha um parágrafo. É o elemento que mostra strings: uma string filha de um `View` não desenha nada. O parágrafo é composto nativamente (CoreText no iOS e no Mac Catalyst, `StaticLayout` no Android) e medido na thread do engine, de modo que a thread principal apenas o desenha. Rust cria um com `text(content)`, TSX com `<Text>` de `nsh`.

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` aceita uma string, um `SharedString`, um signal ou um closure (`text(move || format!("{} items", count.get()))`): um closure ou um signal atualiza o texto no próprio lugar quando o que ele lê muda.

## Spans

Um texto dentro de um texto é um span do mesmo parágrafo, não uma view separada. Os spans herdam os estilos de texto do parágrafo (`color`, `fontSize`, `fontWeight`, …) e sobrescrevem o que definem. O bloco inteiro é uma única view nativa. Em Rust, `text(..)` mostra seu conteúdo e depois seus filhos: `.child(text(..))` adiciona um span, `.child("…")` um trecho simples.

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

<a id="span-backgrounds"></a>

### Fundos de span

Um span com fundo preenche a caixa dos seus caracteres, atrás deles: tão alta quanto sua fonte (o ascent acima da linha de base e o descent abaixo dela, independentemente da altura de linha), e em cada linha em que ele quebra, sendo a parte de cada linha uma caixa própria com o raio de borda do span. Os spans dentro dele compartilham seu fundo, a menos que definam o próprio. É apenas desenho: o texto é disposto como se não houvesse fundo, e um texto selecionável copia os caracteres do span junto com o restante. O código inline é um span:

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

As classes do Tailwind funcionam da mesma forma: `<Text class="bg-gray-100 rounded">`. Padding e bordas são estilos de caixa e deixam os spans como estão; espaços dentro do span dão folga à caixa nas laterais.

### Links

Um span com um handler de toque é um link: um toque sobre seus caracteres vai para o span, um toque em outro ponto vai para o parágrafo.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

<a id="inline-views-and-images"></a>

### Views e imagens inline

Qualquer outro elemento dentro de um texto (uma view, uma imagem, mesmo dentro de spans) é um anexo inline: ele é disposto no próprio tamanho, fica sobre a linha de base (ou onde o seu estilo `verticalAlign` o colocar: `"text-top"`, `"text-bottom"`, `"middle"`, como no CSS; a linha cresce para acomodá-lo) e quebra junto com as palavras. Ele recebe toques próprios.

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
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
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Anexos cortados por `numberOfLines` ou por reticências ficam ocultos. Copiar um texto selecionável os deixa de fora.

<a id="whitespace"></a>

### Espaços em branco

O texto JSX segue as regras do React: as linhas são aparadas, exceto nas extremidades do texto, linhas só com espaços em branco são descartadas e as linhas restantes são unidas por um único espaço. Espaços dentro de uma mesma linha são mantidos (`{a} {b}` mantém seu espaço). Escreva `{" "}` ou uma expressão de string quando um span precisar de um espaço no início ou no fim. Strings em Rust são desenhadas como foram escritas.

## Props

Além das [props comuns](./index.md#common-props) (com `style` tipado como `TextStyle`):

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `numberOfLines` (estilo) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | O máximo de linhas exibidas; `0` mostra todas. |
| `textOverflow` (estilo) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | Como o texto que não cabe em `numberOfLines` é cortado: reticências no fim, no início ou no meio, ou corte simples. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | Segue a configuração de tamanho de texto do sistema. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | O limite superior da escala do sistema; `0` significa sem limite. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | Reduz a fonte até o texto caber em suas linhas (`numberOfLines`) e em sua caixa. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | O quanto `adjustsFontSizeToFit` reduz, no máximo (0..1; no mínimo 0.1). |
| `userSelect` (estilo) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: o usuário pode selecionar trechos do texto: um toque longo seleciona uma palavra, as alças a estendem, o menu de edição a copia. `"auto"` adota a configuração das views ao redor do texto; sem nenhuma definida, o texto não é selecionável, exceto em navegadores desktop, onde é, a menos que esteja dentro de um elemento interativo; `"none"` o mantém não selecionável também ali. |
| `selectionColor` (estilo) | `.selection_color(..)` | `ColorValue` | o destaque (accent) da plataforma | O realce e as alças da seleção. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | As linhas dispostas após cada layout. |

As classes do Tailwind `select-text`, `select-none` e `select-auto` definem `userSelect`, `line-clamp-*` define `numberOfLines`, `text-ellipsis` e `text-clip` definem `textOverflow`, e `truncate` é uma linha cortada com reticências. O realce e as alças da seleção usam a chave de estilo `selectionColor` (`selection:text-*`), o destaque (accent) da plataforma por padrão.

<a id="text-styles"></a>

## Estilos de texto

`TextStyle` acrescenta aos estilos de view: `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` ou 100–900), `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (`text-shadow` do CSS), `fontVariant`, `writingDirection`, `numberOfLines` e `textOverflow`. Em Rust, são métodos de `Styled`: `.text_color(..)`, `.text_size(..)` (ou `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`, `.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`, `.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` e os demais. Veja a [referência de estilos](../modules/style-reference.md#textstyle) e [texto](../docs/text.md).

A família da fonte é uma família do sistema ou um arquivo de fonte do app:

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

A fonte é registrada antes do primeiro frame. Veja [fontes](../docs/fonts.md).

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | Após cada layout do parágrafo. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (nenhum em Rust) | Como em [view](./view.md#events); em um span, toques sobre seus caracteres. |
| `onLayout` | `.on_layout` | `{ bounds }` | O frame do bloco mudou. |

`TextLayoutLine` é `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`, na caixa de conteúdo do texto:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust mede uma string antes de dispô-la com `measure_text(..)`.

<a id="ref-methods"></a>

## Métodos de ref

Nenhum próprio.

<a id="platform-notes"></a>

## Notas de plataforma

- A seleção permanece dentro de um único bloco de texto (um texto e seus spans). O iOS mostra seu menu de edição (Copy, Select All, Look Up, Translate, Share), o Android uma barra de ferramentas flutuante (Copy, Select all, Share).
- Decorações de texto que não sejam uma linha simples contínua (`double`, `dotted`, `dashed`, `wavy`) são desenhadas pelo NSH no iOS.
- Textos no iOS desenham fundos sólidos e sombras externas.
- `fontScale()` de [`nsh`](../modules/nsh.md#device) (`font_scale()` em Rust) informa a escala de texto atual do sistema.
