---
title: "Fontes"
description: "A fonte do sistema e as famílias genéricas, listas de fallback, distribuição de arquivos .ttf, .otf, .woff e .woff2 a partir dos assets de um crate Rust ou de imports TSX, famílias com vários pesos e itálicos, e fontes em estilos tipados e classes Tailwind."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---


# Fontes

O texto usa a fonte do sistema (San Francisco no iOS, Roboto no Android), a menos que uma família de fontes diga o contrário (`.font_family(..)` em Rust, `fontFamily` em TSX). Uma família pode ser uma família genérica, uma fonte instalada no dispositivo ou um arquivo de fonte distribuído com o app.

<a id="system-and-generic-families"></a>

## Famílias do sistema e genéricas

| `fontFamily` | Fonte |
|---|---|
| (nenhuma), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | A fonte do sistema |
| `"serif"`, `"ui-serif"` | A fonte serifada do sistema (New York no iOS, Noto Serif no Android) |
| `"monospace"`, `"ui-monospace"` | A fonte monoespaçada do sistema (SF Mono no iOS) |
| `"ui-rounded"` | A fonte arredondada do sistema (SF Pro Rounded), somente no iOS |

A fonte do sistema respeita todos os pesos de 100 a 900. As classes `font-sans`, `font-serif` e `font-mono` do Tailwind correspondem às três primeiras linhas, e `font-sans` e `font-mono` correspondem às fontes do tema, quando ele as define ([Uma fonte padrão para o app](#a-default-font-for-the-app)).

Uma família instalada no dispositivo pode ser nomeada diretamente (`"Georgia"`, `"Avenir Next"` no iOS). As fontes instaladas variam entre plataformas e versões, então distribua com o app as fontes das quais o seu design depende. No iOS, uma família que não existe recorre à fonte do sistema, com um aviso no log (`font family 'X' is not available`); informe uma lista para escolher o que será usado no lugar ([Listas de fallback](#fallback-lists)).

<a id="shipping-a-font"></a>

## Distribuindo uma fonte

Um crate Rust distribui os arquivos do seu diretório `assets/`: `registry.assets(assets!())` na sua função `#[native_module]` distribui todos eles, e `asset!("fonts/Pacifico-Regular.ttf")` é um `FontAsset` cujo `family` é o nome da família da fonte, lido do arquivo quando o crate é compilado. Em TSX, importe um arquivo `.ttf`, `.otf`, `.woff` ou `.woff2`: a importação resulta no nome da família da fonte. De qualquer forma, a fonte é registrada antes do primeiro frame, portanto está pronta quando o texto é renderizado pela primeira vez. Arquivos WOFF e WOFF2 são fontes TrueType ou OpenType comprimidas (um arquivo WOFF2 costuma ter metade do tamanho do TrueType equivalente, o que economiza no pacote do app e nos downloads da web): o NSH os lê como as fontes que eles contêm, em todas as plataformas:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` e a importação TSX `Pacifico` são a string `"Pacifico"`: o nome da família armazenado no arquivo de fonte (seu nome tipográfico de família ou, na falta dele, o nome da família), e não o nome do arquivo. Usar o valor do asset em vez de escrever o nome à mão mantém os dois sincronizados; um arquivo ausente ou corrompido faz o build Rust falhar, e um arquivo importado com certeza é incluído no pacote.

Os arquivos são distribuídos com o app como qualquer outro [asset](./images-and-assets.md). As fontes são registradas apenas para o processo do app; elas não são instaladas no dispositivo.

> [!WARNING]
> Em TSX, uma importação cujo valor nunca é usado é removida pela eliminação de importações do TypeScript (import elision), e a fonte vai junto. Se você só se refere a uma família pelo nome (por exemplo, no tema do Tailwind), importe o arquivo pelo efeito colateral: `import "./fonts/Inter-Bold.ttf";`. Um crate Rust distribui todos os arquivos de `assets/` por meio de `assets!()`.

<a id="fallback-lists"></a>

## Listas de fallback

`fontFamily` aceita uma lista, como o CSS: famílias separadas por vírgulas, da mais preferida para a menos preferida, com o nome contendo espaços entre aspas ou não (`"Brand, 'Noto Sans SC', sans-serif"`), e um nome entre aspas mantendo suas vírgulas (`'ACME, Inc'`). O texto é composto na primeira família que a plataforma possui, e um caractere que essa família não tem (outro alfabeto, um símbolo) vem da próxima família da lista que o tiver e, depois, das fontes de fallback do sistema. Uma lista permite que uma fonte de marca que cobre apenas o alfabeto latino exiba chinês em uma fonte compatível, ou que se nomeie uma fonte que o app baixa junto com uma fonte do sistema para ser exibida até que ela chegue:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

Cada plataforma mantém a ordem da lista com seu próprio mecanismo de fontes: uma cascade list no iOS e no macOS, um font fallback no Windows (um por parágrafo: a lista do seu primeiro estilo), uma lista de famílias do Pango no Linux, a do navegador na web e os fallbacks do GPUI. No Android, o texto é composto na primeira família que ele possui; quando essa é uma fonte que o app registra, as fontes registradas que vêm depois dela na lista são seus fallbacks (Android 10 e posterior).

<a id="weights-and-italics"></a>

## Pesos e itálicos

Uma família geralmente vem em vários arquivos, um por peso e estilo. Distribua cada um (coloque-os em `assets/` em Rust, importe cada um em TSX); eles são registrados sob o mesmo nome de família, e o peso e o estilo escolhem a face:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

Quando nenhuma face registrada tem exatamente o peso solicitado, a mais próxima é usada. As plataformas diferem quando uma face está ausente:

| | iOS | Android |
|---|---|---|
| Peso sem face correspondente | A face registrada mais próxima | A face mais próxima, com o negrito sintético do Android quando aplicável |
| Itálico sem face itálica | A face vertical (sem inclinação) | Uma versão inclinada da face vertical |

Distribua as faces que você usa para obter o mesmo resultado em ambas.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Fontes em estilos tipados e classes do Tailwind

Em Rust, `.font_family(..)` aceita a família do asset em qualquer lugar onde um estilo é usado, e os métodos de peso (`.font_weight(FontWeight::SEMIBOLD)`) selecionam as faces. Para classes, nomeie suas famílias no tema do Tailwind em `nsh.json` para usá-las como classes `font-*`:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

Uma família arbitrária funciona sem uma entrada no tema: `font-[Pacifico]`. As classes de peso (`font-light`, `font-semibold`, `font-bold`, ...) selecionam faces como `fontWeight` faz. Os estilos de texto em uma view são repassados aos textos dentro dela, então `.font_family(INTER.family)` em uma view, ou `<View class="font-body">`, define a família de uma tela inteira.

<a id="a-default-font-for-the-app"></a>

## Uma fonte padrão para o app

`font-sans` do tema é a fonte do app: todo texto que não define uma família própria é desenhado com ela, tanto em componentes Rust quanto em TSX, como acontece em uma página web com o `--font-sans` do Tailwind. `font-mono` é a fonte monoespaçada, da classe `font-mono` e do código em `TextView`. Defina-as no tema do app (`"theme"` em `nsh.json`, [Rust](./rust.md#theme)) e distribua os arquivos de fonte como descrito acima:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

A primeira família da lista que não for genérica é a fonte; uma primeira família genérica (`system-ui`, `sans-serif`) é a fonte do sistema. A fonte também pode ser definida em um contêiner: os textos dentro dele a herdam.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## Recursos de fonte

`fontVariant` ativa recursos OpenType da fonte: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` e `"small-caps"` (`.tabular_nums()`, `.small_caps()`, ... em Rust; [Text](./text.md#text-styles)). A fonte precisa contê-los; as fontes do sistema os contêm.

<a id="related"></a>

## Relacionados

- [Text](./text.md): estilos de texto, tamanhos e a configuração de tamanho de texto do sistema.
- [Tailwind](./tailwind.md#theme): as chaves do tema.
- [Images and assets](./images-and-assets.md): como os arquivos do app são distribuídos.
