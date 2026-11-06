---
title: "Imagens e assets"
description: "Exibindo imagens em Rust e TSX - os assets do app e arquivos @2x, imagens SVG, URLs remotas, modos de redimensionamento, placeholders, desfoque, tint, eventos de carregamento e como ler o tamanho de uma imagem ou fazer o prefetch dela."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---


# Imagens e assets

O elemento de imagem (`image(..)` em Rust, `<Image>` em TSX) mostra um bitmap ou um desenho SVG: um arquivo distribuído com o app ou uma imagem baixada de uma URL. As imagens são lidas e decodificadas fora da thread principal, reduzidas ao tamanho em que a view as exibe e mantidas em cache; a thread principal apenas exibe o resultado decodificado.

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

image(LOGO)
image("https://picsum.photos/seed/nsh/600/400").w_full().h(px(200.0)).rounded(px(12.0))
```

```tsx tabs
import { Image } from "nsh";
import logo from "./assets/logo@2x.png";

<Image src={logo} />
<Image src="https://picsum.photos/seed/nsh/600/400" style={{ width: "100%", height: 200, borderRadius: 12 }} />
```

As props do elemento estão listadas em [image](../elements/image.md).

<a id="images-in-the-app"></a>

## Imagens no app

Um crate Rust mantém seus arquivos no diretório `assets/`: `asset!("logo@2x.png")` (o caminho relativo a `assets/`) é um `ImageAsset`, `{ url, size, scales }`, lido quando o crate é compilado, e `registry.assets(assets!())` na função `#[native_module]` do crate distribui todos os arquivos do diretório com o app. Em TSX, importe um arquivo de imagem como um módulo: a importação fornece um `ImageAsset`, `{ url, size, scales? }`, e o bundler distribui o arquivo com o app:

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

// LOGO.url: "asset:/@my-app/logo@2x.png", LOGO.size: 64 × 64 points

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}
```

```tsx tabs
import logo from "./assets/logo@2x.png";

logo; // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
```

Arquivos suportados: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` e `.svg` ([imagens SVG](#svg-images)).

**Os tamanhos são em pontos.** Um sufixo `@2x` ou `@3x` no nome do arquivo indica que o arquivo tem 2 ou 3 pixels por ponto, então `logo@2x.png` com 128×128 pixels é um asset de 64×64 pontos. Sem sufixo, um pixel equivale a um ponto. Um arquivo nomeado com sufixo é o que será exibido; um arquivo nomeado sem sufixo exibe suas [variantes de densidade de pixels](#pixel-densities) quando as tem.

**Tamanho natural.** Uma imagem vinda de um asset é disposta em seu tamanho natural quando o estilo deixa a largura ou a altura em aberto, portanto `image(LOGO)` e `<Image src={logo} />` não precisam de estilo. Defina uma dimensão e a proporção (aspect ratio), ou as duas, para dimensioná-la de outra forma.

Em Rust, um arquivo ausente ou corrompido faz o build falhar, e um arquivo alterado faz o crate ser compilado novamente. Em TSX, os assets são resolvidos relativamente ao módulo que os importa, e o `url` deles é relativo à raiz do app (o diretório da entrada). `nsh build` os copia para `out/assets/`, `nsh package` os coloca no app e, durante o desenvolvimento, o servidor de desenvolvimento os serve.

> [!TIP]
> Em TSX, `src` também aceita strings `asset:/path`, e os arquivos importados são os únicos cuja distribuição é garantida. Um caminho que nunca é importado funciona com o servidor de desenvolvimento, que serve todo o diretório do app, mas fica ausente nos apps empacotados. Importe todas as imagens que você usar. Um crate Rust distribui todo o seu diretório `assets/` por meio de `assets!()`.

<a id="pixel-densities"></a>

### Densidades de pixels

Nomeie o arquivo sem sufixo e coloque suas versões mais densas ao lado dele, e o app carrega a que melhor se ajusta à tela:

```text
assets/
├── logo.png       64×64 pixels
├── logo@2x.png    128×128
└── logo@3x.png    192×192
```

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

// LOGO.size: 64 × 64 points, LOGO.scales: [1.0, 2.0, 3.0]
```

```tsx tabs
import logo from "./assets/logo.png";

logo; // { url: "asset:/assets/logo.png", size: { width: 64, height: 64 }, scales: [1, 2, 3] }
```

- `asset!` e o bundler procuram os arquivos irmãos `@1.5x`, `@2x`, `@3x` e `@4x` de uma imagem nomeada sem sufixo. `scales` os lista, com 1 para o arquivo nomeado; uma imagem sem arquivos irmãos não tem escalas (em TSX ela é importada como `{ url, size }`). O bundler distribui os arquivos irmãos que encontra, e `assets!()` distribui o diretório inteiro.
- A imagem carrega a menor escala que seja pelo menos igual à razão de pixels da tela; se não houver, carrega a maior, como o React Native escolhe: `logo.png` em uma tela 1×, `logo@2x.png` em uma 2× e `logo@3x.png` em um celular 3× (e em 2,625). Na web, apenas esse arquivo é baixado.
- Quando a razão de pixels muda (uma janela movida para outra tela, zoom do navegador), as imagens cuja escolha muda são carregadas novamente, com seus [eventos de carregamento](#load-events). O tamanho delas continua sendo o do arquivo nomeado, em pontos.
- Uma variante cujos pixels não correspondem ao tamanho do arquivo nomeado multiplicado pela sua escala gera um aviso de build em TSX e faz o build falhar em Rust.
- Um arquivo nomeado com sufixo de densidade (`./logo@3x.png`, `asset!("logo@3x.png")`) é somente aquele arquivo.
- Uma [imagem SVG](#svg-images) é desenhada para a tela em qualquer razão, portanto não distribui variantes.

Um único arquivo também funciona: exporte-o na maior densidade de que você precisa (`@3x` para o resultado mais nítido em todos os celulares) e nomeie-o com o sufixo; as imagens são reduzidas para a tela na decodificação. As variantes permitem que cada tela baixe, decodifique e mantenha o arquivo que lhe convém.

<a id="svg-images"></a>

## Imagens SVG

Importe um arquivo `.svg` como qualquer imagem. Seu tamanho em pontos é dado por `width` e `height` (ou por um deles, com o outro obtido da proporção do `viewBox`); na falta deles, por `viewBox`: um pixel CSS do SVG é um ponto, e os sufixos `@2x` deixam os arquivos SVG como estão.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

Um SVG fica nítido no tamanho em que é exibido. O navegador o desenha como vetores; iOS, macOS e Android o desenham no tamanho em que a view o exibe, em pixels, quando a imagem carrega (como reduzem os bitmaps; uma view que cresce depois amplia esse desenho, até que a imagem carregue de novo); Windows, Linux e GPUI o desenham uma vez a quatro pixels por ponto (até 2048 pixels por lado) e o escalam para cada view. Todo o resto funciona como para bitmaps: `objectFit`, `tintColor` (através das formas opacas do SVG, de modo que ícones de uma cor acompanham o tema), filtros, `blurRadius`, placeholders, os eventos de carregamento, `Image.getSize` e `Image.prefetch`. `onLoad` e `Image.getSize` informam o tamanho de um SVG em pontos inteiros; a imagem é disposta em seu tamanho exato. Arquivos SVG remotos são carregados da mesma forma, pelos mesmos downloads e verificações de [capability](./sandbox-and-capabilities.md); o NSH reconhece um SVG pelo conteúdo (inclusive compactado com gzip, `.svgz`), seja qual for o final da URL.

**O que as plataformas nativas desenham.** iOS, macOS, Android, Windows, Linux e GPUI desenham SVGs com um único renderizador (resvg), portanto um desenho tem a mesma aparência em cada uma: formas e caminhos, preenchimentos e traços, gradientes e padrões, clip paths e máscaras, opacidade, filtros e transformações. Texto (`<text>`), animação (SMIL e CSS), imagens incorporadas (`<image>`) e HTML (`<foreignObject>`) aparecem no navegador; as plataformas nativas desenham o restante do SVG, estático, e `nsh build` indica os arquivos que usam esses recursos. Exporte o texto como contornos (paths) para obter o mesmo resultado em todos os lugares.

**Uma imagem autossuficiente.** Nas plataformas nativas, um SVG desenha apenas o que contém: arquivos, URLs, imagens `data:` e outros documentos que ele referencia são deixados de fora. As plataformas nativas desenham SVGs, inclusive os remotos, dentro de limites que mantêm a memória sob controle: um documento de até 16 MiB (um documento compactado, depois de descompactado), um desenho de até 8192 pixels por lado e 4096 × 4096 pixels no total (64 MiB; um desenho maior é desenhado menor) e camadas (grupos com opacidade, máscaras, clip paths e filtros, que o renderizador desenha separadamente) de até 256 MiB ao mesmo tempo. Um SVG que ultrapassa o limite de documento ou de camadas falha ao carregar, com `onError`.

**Tamanhos informados na web.** O navegador mede os SVGs por conta própria, importados ou remotos: `onLoad` e `Image.getSize` informam o `width` e o `height` de um SVG quando ele os tem e, caso contrário, o tamanho que o navegador lhe dá, que normalmente é derivado de um padrão de 300 × 150 e da proporção do `viewBox`. SVGs importados são dispostos no tamanho do bundler em todas as plataformas. Dê aos SVGs um `width` e um `height` para obter o mesmo tamanho informado em todos os lugares.

<a id="remote-images"></a>

## Imagens remotas

Passe ao elemento uma URL: uma string em Rust (um closure, para uma que muda) ou uma string de URL em TSX:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **Defina um tamanho para as imagens remotas.** O tamanho delas é desconhecido até que carreguem; sem largura e altura (ou uma delas e uma proporção), elas colapsam e ficam sem altura.
- **Uma cor de fundo** é exibida enquanto a imagem carrega; ou use um placeholder (abaixo).
- Os downloads são compartilhados: várias views que exibem a mesma URL a baixam uma só vez, mesmo quando a decodificam em tamanhos diferentes. Um download que ninguém mais aguarda é cancelado.
- As imagens decodificadas são mantidas em cache na memória (o cache é esvaziado sob pressão de memória), com chave composta por URL, tamanho de decodificação e raio de desfoque.
- Quando o app declara [capabilities](./sandbox-and-capabilities.md), o host da imagem deve ser permitido em `network`; uma imagem recusada falha com seu evento de erro.

<a id="kept-on-disk"></a>

### Mantidas em disco

As imagens baixadas também são mantidas em disco, como o servidor as enviou, de modo que um app que é aberto novamente (uma conversa cheia de avatares e fotos, um feed) exibe as imagens que já havia exibido sem baixá-las, inclusive offline. O app não precisa de nenhuma configuração: toda imagem com URL `http://` ou `https://` passa pelo cache em iOS, Android, macOS, Windows, Linux e GPUI e, no navegador, o próprio cache HTTP do navegador faz o mesmo.

O cache segue os cabeçalhos de cache HTTP do servidor:

- Uma imagem é mantida, a menos que a resposta diga `Cache-Control: no-store`.
- Ela é usada sem fazer requisição enquanto estiver atual (fresh): por `max-age`; na falta dele, até `Expires`; na falta deste, por um décimo do tempo desde `Last-Modified` (no máximo uma semana).
- Depois disso, ela é verificada com o servidor (`If-None-Match` com seu `ETag`, `If-Modified-Since` com seu `Last-Modified`): uma imagem inalterada (`304`) é usada novamente sem ser baixada, e uma imagem alterada a substitui.
- Quando a requisição falha (sem rede) ou o servidor responde com erro (`5xx`), a cópia mantida é exibida, a menos que a resposta tenha dito `must-revalidate` ou `no-cache`.

Cada app tem seu próprio cache de 256 MiB; ao ultrapassar esse limite, as imagens usadas há mais tempo são descartadas primeiro. Várias views, surfaces e processos de um mesmo app o compartilham com segurança. Apps que incorporam o Native Shell escolhem onde ele fica e qual o seu tamanho, ou o desativam:

```rust tabs
// macOS, Windows, Linux and GPUI: the AppView's options (or AppView::set_cache).
let mut cache = CacheOptions::at(CacheLocation::Dir(caches.join("nsh")));  // each app in <dir>/<app id>
cache.images = CachePolicy::MaxSize(ByteSize::mib(64));                     // CachePolicy::Off: none
let view = AppView::new(mtm, AppOptions { cache, ..AppOptions::default() });
```

```swift tabs
// iOS: NshAppView, before loading.
app.cacheOptions = NshCacheOptions(location: .directory(caches.appendingPathComponent("nsh")),
                                   images: .maxSize(megabytes: 64))   // .off: none
```

```java tabs
// Android: NshView, before loading.
nsh.setCacheOptions(NshCacheOptions.builder()
        .location(new File(getCacheDir(), "nsh"))
        .imagesMaxMegabytes(64)          // imagesOff(): none
        .build());
```

`CacheLocation::Off` (`.off`, `noDiskCache()`) não mantém nada em disco.

Por padrão, o cache fica no diretório de cache do sistema: `Library/Caches/nsh` no iOS, `nsh` no diretório de cache no Android, `~/Library/Caches` no macOS, `%LOCALAPPDATA%` no Windows e `$XDG_CACHE_HOME` (`~/.cache`) no Linux, cada app em `<app id>/images` nesse local. O sistema pode limpar esses diretórios quando precisar de espaço.

<a id="resize-modes"></a>

## Modos de redimensionamento

O estilo `objectFit`, o `object-fit` do CSS (`.object_fit(..)` em Rust), decide como uma imagem preenche uma caixa de formato diferente:

| Valor | Resultado |
|---|---|
| `"cover"` (`ResizeMode::Cover`, padrão) | Preenche a caixa, mantendo a proporção e cortando o que ultrapassa |
| `"contain"` (`ResizeMode::Contain`) | Cabe dentro da caixa, mantendo a proporção e deixando faixas vazias |
| `"fill"` (`ResizeMode::Stretch`) | Preenche a caixa exatamente, distorcendo a imagem |
| `"none"` (`ResizeMode::Center`) | Tamanho natural, posicionada em `objectPosition` (centralizada por padrão) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | Tamanho natural, reduzida para caber onde for maior |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

As classes do Tailwind `object-cover`, `object-contain`, `object-fill`, `object-none` e `object-scale-down` definem o mesmo estilo.

<a id="image-position"></a>

### Posição da imagem

O local onde a imagem já dimensionada fica em sua caixa é definido pelo estilo `objectPosition` (`.object_position(..)` e `.object_top()`, ... em Rust), o `object-position` do CSS: o centro, por padrão. Uma imagem que cobre a caixa é cortada em torno dessa posição, e uma imagem contida se move dentro de suas faixas. Ele aceita palavras-chave (`"top"`, `"left bottom"`), porcentagens e comprimentos (`"25% 75%"`, `"10px 0"`) e bordas com deslocamentos (`"right 10px bottom 20%"`). Dessa forma, uma foto alta em um balão de chat mostra o topo:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

As classes do Tailwind são as do próprio Tailwind: `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` e valores arbitrários (`object-[25%_75%]`).

<a id="styling-images"></a>

## Estilizando imagens

Imagens são views: aceitam raios de canto (inclusive por canto), bordas, sombras, opacidade e transformações. Os cantos recortam a imagem.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **Tint** (`.tint_color(..)` em Rust, o estilo `tintColor` em TSX) recolore os pixels opacos da imagem: use-o para ícones de uma cor que acompanham o tema.
- **Filtros** (`.grayscale(..)`, `.sepia(..)`, `.blur(..)`; `filter` em TSX) se aplicam às imagens em ambas as plataformas ([Filters](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## Placeholders, fade e desfoque

| Prop | Rust | Descrição |
|---|---|---|
| `placeholder` | `.placeholder(..)` | Uma imagem exibida até que `src` tenha carregado, uma URL ou um asset; o ideal é um asset local |
| `fadeDuration` | `.fade_duration(ms)` | Milissegundos ao longo dos quais a imagem carregada aparece gradualmente (fade in). Padrão: 0 no iOS, 300 no Android |
| `blurRadius` | `.blur_radius(px(..))` | Desfoca a imagem com este raio em pontos, aplicado uma vez na decodificação |

```rust tabs
image(move || format!("https://picsum.photos/seed/{}/300/300", id.get()))
    .placeholder(PLACEHOLDER)
    .fade_duration(250.0)
    .size(px(100.0))
    .rounded(px(12.0))
image(cover).blur_radius(px(16.0)).absolute().inset_0()
```

```tsx tabs
<Image
  src={`https://picsum.photos/seed/${id()}/300/300`}
  placeholder={placeholder}
  fadeDuration={250}
  style={{ width: 100, height: 100, borderRadius: 12 }}
/>
<Image src={cover} blurRadius={16} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
```

<a id="animated-images"></a>

## Imagens animadas

Arquivos GIF, WebP e APNG animados são reproduzidos automaticamente, como assets ou a partir de URLs. Eles aceitam os mesmos estilos, inclusive `objectFit`; uma imagem animada com tint mostra seu primeiro quadro no iOS.

<a id="load-events"></a>

## Eventos de carregamento

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | O carregamento começa |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` em bytes (`total` 0 quando desconhecido) | Durante um download, no máximo a cada 100 ms |
| `onLoad` | `.on_load(..)` | `{ size }` | A imagem está pronta; o tamanho da fonte em pixels (o de um SVG, em pontos, [na web conforme o navegador o mede](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (um `&str` em Rust) | O carregamento ou a decodificação falhou |
| `onLoadEnd` | `.on_load_end(..)` | | Depois de `onLoad` ou `onError` |

```rust tabs
let status = signal(SharedString::from("loading…"));

image(url)
    .on_load(move |size: &Size<DevicePixels>| status.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| status.set(message.to_owned().into()))
    .w(px(90.0))
    .h(px(60.0))
```

```tsx tabs
const status = signal("loading…");

<Image
  src={url}
  onLoad={({ size }) => status.set(`${size.width}×${size.height}`)}
  onError={(e) => status.set(e.message)}
  style={{ width: 90, height: 60 }}
/>
```

O evento de carregamento informa o tamanho da imagem de origem, não o tamanho em que ela foi decodificada.

Uma imagem com [variantes de densidade de pixels](#pixel-densities) carrega um de seus arquivos, e o evento de carregamento informa os pixels desse arquivo: 192×192 para `logo@3x.png` em uma tela 3×, enquanto `Image.getSize(logo)` resolve com os 64×64 do arquivo importado. Quando a razão de pixels muda e a imagem carrega outra variante, esse carregamento também informa seus eventos: `onLoadStart`, depois `onLoad` com o tamanho do novo arquivo (ou `onError`), depois `onLoadEnd`.
<a id="an-images-size-and-prefetching"></a>

## O tamanho de uma imagem e o prefetching

Imagens que não estão na tela podem ser medidas e carregadas com antecedência: `image_size(..)` e `prefetch_image(..)` em Rust, `Image.getSize` e `Image.prefetch` (no mesmo `Image` que renderiza o elemento) em TSX:

```rust tabs
spawn(async move {
    // Ok(ImageSize { width, height }), in pixels.
    let size = image_size("https://example.com/photo.jpg").await;
    // Ok(()) once the bytes are in memory.
    let loaded = prefetch_image("https://example.com/next.jpg").await;
});
```

```tsx tabs
import { Image } from "nsh";

const size = await Image.getSize("https://example.com/photo.jpg");   // { width, height } in pixels
await Image.prefetch("https://example.com/next.jpg");                // once the bytes are in memory
```

| Rust | TSX | Retorna |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | O tamanho da imagem em pixels (o de um SVG em pontos, [na web conforme o navegador o mede](#svg-images)); um erro quando ela não pode ser carregada |
| `prefetch_image(src)` | `Image.prefetch(src)` | Nada, assim que os bytes da imagem são carregados; um erro quando ela não pode ser carregada |

Em TSX, `src` é uma string de URL ou uma imagem importada. Para uma imagem importada com [variantes](#pixel-densities), ambos carregam a variante que as views carregam nesta tela, e `getSize` fornece o tamanho do arquivo importado. Ambos mantêm os bytes baixados para as views que exibirão a imagem em seguida, de modo que uma imagem pré-carregada antes de ser exibida aparece sem download.

Um uso comum é dimensionar uma imagem remota pela sua proporção:

```rust tabs
fn remote_image(url: &'static str) -> impl IntoElement {
    let ratio = signal(1.0_f32);
    spawn(async move {
        if let Ok(size) = image_size(url).await {
            ratio.set(size.width.0 as f32 / size.height.0 as f32);
        }
    });
    image(url).w_full().aspect_ratio(ratio)
}
```

```tsx tabs
function RemoteImage(props: { url: string }) {
  const ratio = signal(1);
  Image.getSize(props.url).then((s) => ratio.set(s.width / s.height));
  return <Image src={props.url} style={{ width: "100%", aspectRatio: ratio() }} />;
}
```

<a id="other-assets"></a>

## Outros assets

| Arquivo | Rust (`asset!`) | Import em TSX | Página |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | Um `FontAsset` com o nome da família | O nome da família da fonte | [Fontes](./fonts.md) |
| `.json` e outros arquivos | Um `FileAsset` com seu URI | `.json`: o valor já interpretado, incluído no script | [Estrutura do projeto](./project-structure.md#modules) |

Em ambos, as fontes são registradas antes do primeiro frame.

<a id="reading-a-file-at-run-time"></a>

### Ler um arquivo em tempo de execução

`fetch` lê um arquivo que o app distribui, pela sua URL `asset:/`, tanto em TSX quanto em Rust, em todas as plataformas. Uma imagem importada carrega a sua URL (`url`), e os arquivos de um crate Rust têm a deles a partir de `asset!` (`FileAsset::uri`) e `assets!()`:

```rust tabs
const GREETING: FileAsset = asset!("locales/en.txt");

#[component]
fn Greeting() -> impl IntoElement {
    let greeting = signal(String::new());
    spawn(async move {
        match fetch(GREETING.uri).await {
            Ok(response) => greeting.set(response.text()),
            Err(error) => greeting.set(error),
        }
    });
    text(move || greeting.get())
}
```

```tsx tabs
import flag from "./images/flag.png";

const bytes = await (await fetch(flag.url)).bytes();
```

O engine lê o arquivo dos arquivos do app fora da sua thread (do servidor de desenvolvimento durante `nsh run`), sem precisar de nenhuma capability: são os arquivos do próprio app. Um app web baixa o que a página não pré-carregou do local onde serve seus assets. A resposta é `200` com os bytes do arquivo, seu `Content-Length` e o `Content-Type` que a extensão indica (`image/png`, `application/json`, ...), e seu `url` é a URL `asset:/`, independentemente de como o arquivo chegou; um arquivo que o app não distribui é rejeitado como um erro de rede que o nomeia. A URL nomeia o arquivo pelo seu caminho dentro dos arquivos do app, e a requisição o lê com `GET` (ou `HEAD`): uma URL cujo caminho sai deles (`..`, um caminho absoluto) e uma requisição com outro método são rejeitadas da mesma forma, antes de qualquer coisa ser lida ou baixada.

<a id="a-modules-own-url"></a>

### A URL própria de um módulo

Em TSX, `import.meta.url` é a URL do módulo em que ele está escrito, então `new URL("./data.json", import.meta.url)` nomeia um arquivo ao lado dele. Os módulos de um app desktop local ou empacotado têm URLs `file:` no diretório do app, que `fs/promises` lê sob uma concessão de `${pluginDir}`; os de um app web são os da página; os de um app mobile empacotado são URLs `asset:/`, como as das imagens importadas. Importe uma imagem para distribuí-la: uma URL criada dessa forma nomeia o arquivo, mas não o empacota.

Imagens bitmap também são desenhadas em um canvas com `draw_image` / `drawImage` ([Canvas](./canvas.md)), e gradientes substituem muitas imagens decorativas ([Estilização](./styling.md#gradients)).

<a id="related"></a>

## Relacionados

- [Elemento image](../elements/image.md): todas as props, com `getSize` e `prefetch`.
- [Listas](./lists.md): listas longas de imagens reciclam suas views.
