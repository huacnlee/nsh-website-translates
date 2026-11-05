---
title: "Moduli"
description: "I moduli che un'app NSH importa, cosa esporta ciascuno di essi e come sono organizzati."
order: 1
source_hash: c212e0667eddb588
---

# Moduli

Un'app NSH importa tutto ciò che usa da un piccolo insieme di moduli. Sono tutti nativi: il grafo reattivo, il renderer e ogni modulo sono implementati in Rust all'interno del runtime, e il bundler mantiene `import ... from "nsh/..."` come import invece di copiare il codice nel bundle. Il bundle contiene solo il codice dell'app.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## Tre livelli

L'interfaccia di NSH è costruita su tre livelli, come quella di GPUI Kit (`gpui`, `gpui-base`, `gpui-component`):

| Livello | Moduli | Cosa offre a un'app |
|---|---|---|
| Primitive | `nsh`, `nsh/mobile`, `nsh/desktop` | Reattività, gli elementi host, layout, liste, canvas, animazione, gesture, informazioni sul dispositivo e le API proprie delle piattaforme |
| Componenti di base | [`nsh/base`](./nsh-base.md) | Componenti privi di stile che gestiscono comportamento, stato, focus e accessibilità: un pulsante, documenti Markdown e HTML, stack di navigazione e finestre di dialogo e i dialoghi di sistema, su ogni piattaforma |
| Libreria di componenti | quella della tua app, o una della community | Pulsanti, card, righe e schermate con un aspetto definito |

L'aspetto di un'app è responsabilità dell'app stessa. La sua libreria di componenti è il terzo livello: componenti che scrive a partire dagli [elementi host](../elements/index.md) e da `nsh/base`, con stili definiti tramite `style`, le classi [Tailwind](../docs/tailwind.md) e il proprio tema, componenti Rust distribuiti nel [proprio crate](../docs/rust.md), oppure una libreria pubblicata dalla community sulle stesse fondamenta.

Non esiste un modulo onnicomprensivo: ogni API vive in un solo posto. Le API delle piattaforme mobile si trovano in `nsh/mobile` (iOS e Android) e quelle dei desktop in `nsh/desktop` (macOS, Windows, Linux); entrambi possono essere importati su ogni piattaforma, quindi un solo bundle funziona ovunque (sulle altre piattaforme le loro chiamate ritornano immediatamente, e `platform.os` indica su quale piattaforma ci si trova).

I tipi sono generati dal runtime: `nsh init`, `nsh build`, `nsh dev` e `nsh test` scrivono `.nsh/types` accanto alla tua app, in modo che le dichiarazioni TypeScript corrispondano sempre al runtime con cui compili (vedi [Struttura del progetto](../docs/project-structure.md)).

<a id="all-modules"></a>

## Tutti i moduli

| Modulo | Esporta | Pagina |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary`; le primitive `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (con `Image.getSize`, `Image.prefetch`), [`Canvas`](./nsh-canvas.md) (con `Path2D`, `CanvasRenderingContext2D`, `CanvasGradient`), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md); `safeArea`, `safeAreaInsets`; `Keyboard`, `keyboardFrame`; [animazione](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`); [l'ambiente](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`); [`PanResponder`](./nsh.md#panresponder); [`Clipboard`](./nsh.md#clipboard); [`Picker`](./nsh.md#picker); [`Storage`](./nsh.md#storage); [`host`](./nsh.md#host) (`available`, `call`, `on`, più gli SDK nativi `params` e `post`); [`keymap`](./nsh.md#keymap) (scorciatoie da tastiera: `mod+k`, `ctrl+shift+p`, ...); [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (componenti e funzioni registrati dall'app che incorpora il runtime); [accessibilità](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`); i tipi di elementi, stili, eventi e JSX (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input`; `TextView`; `createNavStack`, `NavStack`, `NavPage`, `Dialog`; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (la tab bar di sistema, iOS e Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (titolo, barra del titolo, ingrandimento, schermo intero), `titleBar`, `Menu` (menu dell'applicazione, menu contestuali) | [nsh/desktop](./nsh-desktop.md) |
| Moduli standard | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [Moduli standard](./standard-modules.md) |
| Globali | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, timer, `console`, `requestAnimationFrame`, ... (senza import) | [API globali](./globals.md) |

Pagine di riferimento che non sono moduli:

| Pagina | Contenuto |
|---|---|
| [Riferimento degli stili](./style-reference.md) | Ogni chiave di stile, il suo tipo e il suo significato |
| [Riferimento Tailwind](./tailwind-reference.md) | Le utility e le varianti Tailwind accettate da `class` |

<a id="host-elements"></a>

## Elementi host

Gli elementi host sono componenti importati come tutto il resto: `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` e `Overlay` da `nsh`, i componenti di base (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) da `nsh/base`, `InputAccessoryView` da `nsh/mobile`. Solo `If` e `Each` sono globali. Il compilatore crea gli elementi sul posto, quindi gli import non hanno alcun costo a runtime. Le loro prop sono documentate in [Elementi](../elements/index.md).
