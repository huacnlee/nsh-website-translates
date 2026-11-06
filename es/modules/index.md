---
title: "Módulos"
description: "Los módulos que importa una aplicación NSH, qué exporta cada uno y cómo se organizan."
order: 1
source_hash: c212e0667eddb588
---


# Módulos

Una app NSH importa todo lo que usa desde un pequeño conjunto de módulos. Todos son nativos: el grafo reactivo, el renderizador y cada módulo están implementados en Rust dentro del runtime, y el bundler mantiene `import ... from "nsh/..."` como imports en lugar de copiar código en tu bundle. Tu bundle solo contiene tu propio código.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## Tres capas

La UI de NSH se construye en tres capas, igual que la de GPUI Kit (`gpui`, `gpui-base`, `gpui-component`):

| Capa | Módulos | Qué ofrece a una app |
|---|---|---|
| Primitivos | `nsh`, `nsh/mobile`, `nsh/desktop` | Reactividad, los elementos host, layout, listas, canvas, animación, gestos, información del dispositivo y las APIs propias de cada plataforma |
| Componentes base | [`nsh/base`](./nsh-base.md) | Componentes sin estilo que gestionan comportamiento, estado, foco y accesibilidad: un botón, documentos Markdown y HTML, pilas de navegación y diálogos, y los diálogos del sistema, en todas las plataformas |
| Biblioteca de componentes | la de tu app, o una de la comunidad | Botones, tarjetas, filas y pantallas con una apariencia propia |

La apariencia de una app es responsabilidad de la propia app. Su biblioteca de componentes es la tercera capa: componentes que escribe a partir de los [elementos host](../elements/index.md) y `nsh/base`, con estilos de `style`, clases de [Tailwind](../docs/tailwind.md) y su tema, componentes Rust que distribuye en [su propio crate](../docs/rust.md), o una biblioteca que la comunidad publica sobre la misma base.

No existe un módulo que lo agrupe todo: cada API vive en un único lugar. Las APIs de las plataformas móviles viven en `nsh/mobile` (iOS y Android) y las de los escritorios en `nsh/desktop` (macOS, Windows, Linux); ambos pueden importarse en todas las plataformas, de modo que un solo bundle funciona en todas partes (en las demás plataformas sus llamadas retornan de inmediato, y `platform.os` te indica en qué plataforma estás).

Los tipos se generan a partir del runtime: `nsh init`, `nsh build`, `nsh dev` y `nsh test` escriben `.nsh/types` junto a tu app, de modo que las declaraciones de TypeScript siempre coinciden con el runtime con el que compilas (consulta [Estructura del proyecto](../docs/project-structure.md)).

<a id="all-modules"></a>

## Todos los módulos

| Módulo | Exporta | Página |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary`; los primitivos `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (con `Image.getSize`, `Image.prefetch`), [`Canvas`](./nsh-canvas.md) (con `Path2D`, `CanvasRenderingContext2D`, `CanvasGradient`), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md); `safeArea`, `safeAreaInsets`; `Keyboard`, `keyboardFrame`; [animación](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`); [el entorno](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`); [`PanResponder`](./nsh.md#panresponder); [`Clipboard`](./nsh.md#clipboard); [`Picker`](./nsh.md#picker); [`Storage`](./nsh.md#storage); [`host`](./nsh.md#host) (`available`, `call`, `on`, además de los SDK nativos `params` y `post`); [`keymap`](./nsh.md#keymap) (atajos de teclado: `mod+k`, `ctrl+shift+p`, ...); [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (componentes y funciones que registra la app anfitriona); [accesibilidad](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`); los tipos de elementos, estilos, eventos y JSX (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input`; `TextView`; `createNavStack`, `NavStack`, `NavPage`, `Dialog`; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (la barra de pestañas del sistema, iOS y Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (título, barra de título, maximizar, pantalla completa), `titleBar`, `Menu` (menú de la aplicación, menús contextuales) | [nsh/desktop](./nsh-desktop.md) |
| Módulos estándar | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [Módulos estándar](./standard-modules.md) |
| Globales | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, temporizadores, `console`, `requestAnimationFrame`, ... (sin import) | [APIs globales](./globals.md) |

Páginas de referencia que no son módulos:

| Página | Contenido |
|---|---|
| [Referencia de estilos](./style-reference.md) | Cada clave de estilo, su tipo y su significado |
| [Referencia de Tailwind](./tailwind-reference.md) | Las utilidades y variantes de Tailwind que acepta `class` |

<a id="host-elements"></a>

## Elementos host

Los elementos host son componentes que se importan como todo lo demás: `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` y `Overlay` desde `nsh`, los componentes base (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) desde `nsh/base`, `InputAccessoryView` desde `nsh/mobile`. Solo `If` y `Each` son globales. El compilador crea los elementos en el sitio, por lo que los imports no cuestan nada en tiempo de ejecución. Sus props están documentadas en [Elementos](../elements/index.md).
