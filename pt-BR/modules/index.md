---
title: "Módulos"
description: "Os módulos que um app NSH importa, o que cada um exporta e como eles são organizados."
order: 1
source_hash: c212e0667eddb588
---


# Módulos

Um app NSH importa tudo o que usa de um pequeno conjunto de módulos. Todos são nativos: o grafo reativo, o renderizador e cada módulo são implementados em Rust dentro do runtime, e o bundler mantém `import ... from "nsh/..."` como imports em vez de copiar código para o seu bundle. Seu bundle contém apenas o seu próprio código.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## Três camadas

A UI do NSH é construída em três camadas, como a do GPUI Kit (`gpui`, `gpui-base`, `gpui-component`):

| Camada | Módulos | O que oferece a um app |
|---|---|---|
| Primitivas | `nsh`, `nsh/mobile`, `nsh/desktop` | Reatividade, os elementos host, layout, listas, canvas, animação, gestos, informações do dispositivo e as APIs próprias das plataformas |
| Componentes base | [`nsh/base`](./nsh-base.md) | Componentes sem estilo que cuidam de comportamento, estado, foco e acessibilidade: um botão, documentos Markdown e HTML, pilhas de navegação e diálogos, e os diálogos do sistema, em todas as plataformas |
| Biblioteca de componentes | a do seu app, ou uma da comunidade | Botões, cards, linhas e telas com uma aparência definida |

A aparência de um app é do próprio app. Sua biblioteca de componentes é a terceira camada: componentes que ele escreve a partir dos [elementos host](../elements/index.md) e de `nsh/base`, estilizados com `style`, classes [Tailwind](../docs/tailwind.md) e seu tema, componentes Rust distribuídos em [seu próprio crate](../docs/rust.md), ou uma biblioteca que a comunidade publica sobre a mesma base.

Não há um módulo que reúna tudo: cada API fica em exatamente um lugar. As APIs das plataformas móveis ficam em `nsh/mobile` (iOS e Android) e as dos desktops em `nsh/desktop` (macOS, Windows, Linux); ambos podem ser importados em qualquer plataforma, então um único bundle roda em todo lugar (nas outras plataformas, suas chamadas retornam imediatamente, e `platform.os` informa em qual plataforma você está).

Os tipos são gerados a partir do runtime: `nsh init`, `nsh build`, `nsh dev` e `nsh test` escrevem `.nsh/types` ao lado do seu app, de modo que as declarações TypeScript sempre correspondem ao runtime com o qual você compila (veja [Estrutura do projeto](../docs/project-structure.md)).

<a id="all-modules"></a>

## Todos os módulos

| Módulo | Exportações | Página |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary`; as primitivas `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (com `Image.getSize`, `Image.prefetch`), [`Canvas`](./nsh-canvas.md) (com `Path2D`, `CanvasRenderingContext2D`, `CanvasGradient`), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md); `safeArea`, `safeAreaInsets`; `Keyboard`, `keyboardFrame`; [animação](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`); [o ambiente](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`); [`PanResponder`](./nsh.md#panresponder); [`Clipboard`](./nsh.md#clipboard); [`Picker`](./nsh.md#picker); [`Storage`](./nsh.md#storage); [`host`](./nsh.md#host) (`available`, `call`, `on`, mais `params` e `post` do SDK nativo); [`keymap`](./nsh.md#keymap) (atalhos de teclado: `mod+k`, `ctrl+shift+p`, ...); [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (componentes e funções que o app hospedeiro registra); [acessibilidade](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`); os tipos de elementos, estilos, eventos e JSX (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input`; `TextView`; `createNavStack`, `NavStack`, `NavPage`, `Dialog`; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (a barra de abas do sistema, iOS e Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (título, barra de título, maximizar, tela cheia), `titleBar`, `Menu` (menu do aplicativo, menus de contexto) | [nsh/desktop](./nsh-desktop.md) |
| Módulos padrão | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [Módulos padrão](./standard-modules.md) |
| Globais | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, timers, `console`, `requestAnimationFrame`, ... (sem import) | [APIs globais](./globals.md) |

Páginas de referência que não são módulos:

| Página | O que cobre |
|---|---|
| [Referência de estilos](./style-reference.md) | Cada chave de estilo, seu tipo e significado |
| [Referência do Tailwind](./tailwind-reference.md) | As utilities e variantes do Tailwind que `class` aceita |

<a id="host-elements"></a>

## Elementos host

Os elementos host são componentes importados como todo o resto: `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` e `Overlay` de `nsh`, os componentes base (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) de `nsh/base`, `InputAccessoryView` de `nsh/mobile`. Apenas `If` e `Each` são globais. O compilador cria os elementos no local, então os imports não têm custo em tempo de execução. Suas props estão documentadas em [Elementos](../elements/index.md).
