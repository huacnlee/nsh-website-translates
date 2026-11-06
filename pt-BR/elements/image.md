---
title: "Image"
description: "O elemento que exibe uma imagem local ou remota, com placeholders, desfoque, transições de fade, tonalidade e eventos de carregamento."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---


# Image

`Image` mostra uma imagem dos assets do app ou de uma URL. As imagens são baixadas e decodificadas fora da thread principal, reduzidas ao tamanho em que a view as exibe e armazenadas em cache na memória. Imagens animadas GIF, WebP e APNG são reproduzidas. Em Rust, cria-se uma com `image(src)`; em TSX, com `<Image>` a partir de `nsh`.

```rust tabs
use nsh_core::prelude::*;

// assets/logo.png in the app's crate.
const LOGO: ImageAsset = asset!("logo.png");

view()
    .flex_row()
    .gap_3()
    .child(image(LOGO))
    .child(
        image("https://example.com/avatar.jpg")
            .placeholder(LOGO)
            .object_fit(ResizeMode::Cover)
            .size(px(64.0))
            .rounded_full(),
    )
```

```tsx tabs
import { Image, View } from "nsh";
import logo from "./assets/logo.png";

<View style={{ flexDirection: "row", gap: 12 }}>
  <Image src={logo} />
  <Image
    src="https://example.com/avatar.jpg"
    placeholder={logo}
    style={{ width: 64, height: 64, borderRadius: 32 }}
  />
</View>;
```

Um asset conhece seu próprio tamanho: sem largura nem altura, a imagem adota esse tamanho, e, com apenas uma das duas, a outra acompanha a proporção do asset. O tamanho de uma URL só é conhecido depois que ela carrega, então defina largura e altura para imagens remotas (ou uma proporção junto com uma das duas).

<a id="sources"></a>

## Fontes

A fonte (`src` e `placeholder`; `image(..)` e `.placeholder(..)` em Rust) aceita:

| Valor | Exemplo | Descrição |
|---|---|---|
| Um asset | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | Um `ImageAsset` `{ url, size, scales? }`, dimensionado em pontos: um arquivo `@2x` conta metade de seus pixels. Com `logo@2x.png` / `logo@3x.png` ao lado de `logo.png`, a variante correspondente à densidade de pixels da tela é carregada ([densidades de pixels](../docs/images-and-assets.md#pixel-densities)). É possível importar `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` e `.heic`, além de `.svg`, dimensionado por seus `width` e `height` ou `viewBox` ([imagens SVG](../docs/images-and-assets.md#svg-images)). |
| Uma URL | `"https://example.com/a.jpg"` | Baixada e armazenada em cache. Downloads da mesma URL são compartilhados entre views. |
| Um caminho de asset | `"asset:/images/a.png"` | Um arquivo dos assets do app. |
| Um URI `data:` | `"data:image/png;base64,iVBOR…"` | Bytes no próprio URI, em base64 ou com codificação percentual (`data:image/svg+xml,%3Csvg…`). |
| Uma URL `blob:` | `URL.createObjectURL(blob)` | Os bytes de um `Blob` ou `File` (TSX). A imagem os mantém: revogar a URL deixa uma imagem que continua sendo exibida por inteiro. |

Uma imagem criada a partir de bytes que o app já possui é exibida sem requisição. Um chat mostra uma foto escolhida a partir do blob enquanto ela é enviada e, depois, troca `src` para a URL da foto:

```rust tabs
// Bytes in a `data:` URI (an image the app made or received inline).
image(format!("data:image/png;base64,{encoded}")).size(px(64.0))
```

```tsx tabs
import { Image, signal } from "nsh";

const preview = URL.createObjectURL(photo); // the picked `File`
const src = signal(preview);
upload(photo).then((url) => {
  src.set(url);
  URL.revokeObjectURL(preview);
});

<Image src={src()} style={{ width: 240, height: 180 }} />;
```

Bytes iguais formam uma única imagem: a mesma imagem como URI `data:` e como blob é decodificada uma só vez e compartilha o cache.

Durante o desenvolvimento, os assets são servidos pelo servidor de desenvolvimento; `nsh build` e `nsh package` os copiam para dentro do app (um crate Rust distribui seu diretório `assets/` com `registry.assets(assets!())`). Veja [imagens e assets](../docs/images-and-assets.md).

> [!NOTE]
> Quando o app declara [capabilities](../docs/sandbox-and-capabilities.md), as imagens remotas são carregadas dos hosts listados; uma imagem de qualquer outro host não é requisitada e falha com `onError`, cujo `code` é `"ERR_ACCESS_DENIED"`. URIs `asset:`, URIs `data:` e URLs `blob:` sempre são carregados.

## Props

Além das [props comuns](./index.md#common-props) (com `style` tipado como `ImageStyle`):

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | A imagem. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | Exibido até que `src` seja carregado; o ideal é um asset local. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | Desfoca a imagem com este raio em pontos (aplicado uma única vez durante a decodificação, fora da thread principal). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | Por quanto tempo uma imagem carregada aparece em fade-in, em milissegundos. |
| `tintColor` (estilo) | `.tint_color(..)` | `ColorValue` | | Recolore uma imagem template (um ícone desenhado em uma só cor). |
| `objectFit` (estilo) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | Como a imagem se ajusta à sua caixa, como o `object-fit` do CSS (classes `object-*`): `"cover"` a preenche e corta, `"contain"` a encaixa dentro dela, `"fill"` a estica, `"none"` a exibe em seu tamanho natural, `"scale-down"` o mesmo, reduzida para caber quando é maior. |
| `objectPosition` (estilo) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | Onde a imagem fica em sua caixa depois que `objectFit` a dimensionou, como o `object-position` do CSS (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`); uma imagem que cobre a caixa é cortada ao redor dessa posição. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | O carregamento começou. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | Progresso do download em bytes (`total` é 0 quando desconhecido), no máximo a cada 100 ms. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | Carregada; o tamanho da imagem de origem em pixels (não o da imagem decodificada e reduzida; o tamanho de um SVG em pontos, [na web conforme medido pelo navegador](../docs/images-and-assets.md#svg-images)); para uma imagem com variantes, o da variante carregada. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | O carregamento falhou; `code` é `"ERR_ACCESS_DENIED"` para uma URL que as capabilities do app não permitem. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | Após `onLoad` ou `onError`. |

`ImageStyle` adiciona `tintColor` aos estilos da view, que recolore uma imagem template (um ícone desenhado em uma só cor), e `objectPosition`, que posiciona a imagem em sua caixa ([posição da imagem](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | nenhum | O carregamento começou. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | Chegaram bytes (no máximo a cada 100 ms). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | A imagem é exibida; o tamanho da origem em pixels (o de um SVG em pontos, [na web conforme medido pelo navegador](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, a mensagem) | O carregamento ou a decodificação falhou, ou o host está fora das capabilities do app (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | nenhum | Após `onLoad` ou `onError`. |

```rust tabs
let state = signal(SharedString::from("loading"));

image(url)
    .w_full()
    .aspect_ratio(16.0 / 9.0)
    .on_load(move |size: &Size<DevicePixels>| state.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| state.set(message.to_string().into()))
```

```tsx tabs
const state = signal("loading");
<Image
  src={url}
  style={{ width: "100%", aspectRatio: 16 / 9 }}
  onLoad={({ size }) => state.set(`${size.width}×${size.height} px`)}
  onError={(e) => state.set(e.message)}
/>;
```

Uma imagem com [variantes de densidade de pixels](../docs/images-and-assets.md#pixel-densities) carrega um de seus arquivos, e `onLoad` informa os pixels desse arquivo: 192×192 para `logo@3x.png` em uma tela 3×, para um `logo.png` de 64×64 pontos. Quando a densidade de pixels muda e a imagem carrega outra variante, ela também informa esse carregamento: `onLoadStart`, depois `onLoad` com o tamanho do novo arquivo (ou `onError`), depois `onLoadEnd`.

Para saber o tamanho de uma imagem ou carregá-la antes de exibi-la, TSX chama `Image.getSize(src)` e `Image.prefetch(src)` (o mesmo `Image` que renderiza o elemento os expõe; veja a [API Image](../modules/nsh-image.md)), e Rust usa `image_size(src)` e `prefetch_image(src)`, com await em uma task. Dada uma imagem importada com variantes, `Image.getSize` e `Image.prefetch` carregam a variante que esta tela exibe, e `getSize` retorna o tamanho do arquivo importado (64×64 para `logo.png`).

<a id="ref-methods"></a>

## Métodos de ref

Nenhum próprio.

<a id="platform-notes"></a>

## Notas de plataforma

- A chave de cache inclui o tamanho de decodificação e o raio de desfoque: a mesma URL exibida em dois tamanhos é decodificada duas vezes, mas baixada uma só vez.
- O iOS reproduz imagens animadas como uma animação de quadros-chave (até 600 quadros); uma imagem animada com tint mostra apenas o primeiro quadro.
- O Android reproduz imagens animadas a partir da API 28 (`AnimatedImageDrawable`), sem cache e sem desfoque.
- No Android, as bordas são desenhadas acima da imagem, como no iOS.
