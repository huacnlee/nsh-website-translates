---
title: "Module"
description: "Die Module, die eine NSH-App importiert, was jedes davon exportiert und wie sie organisiert sind."
order: 1
source_hash: c212e0667eddb588
---


# Module

Eine NSH-App importiert alles, was sie verwendet, aus einer kleinen Menge von Modulen. Sie sind alle nativ: Der reaktive Graph, der Renderer und jedes Modul sind in Rust innerhalb der Runtime implementiert, und der Bundler belässt `import ... from "nsh/..."` als Imports, statt Code in dein Bundle zu kopieren. Dein Bundle enthält nur deinen eigenen Code.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## Drei Schichten

Die UI von NSH ist in drei Schichten aufgebaut, genau wie die von GPUI Kit (`gpui`, `gpui-base`, `gpui-component`):

| Schicht | Module | Was sie einer App bietet |
|---|---|---|
| Primitive | `nsh`, `nsh/mobile`, `nsh/desktop` | Reaktivität, die Host-Elemente, Layout, Listen, Canvas, Animation, Gesten, Geräteinformationen und die plattformeigenen APIs |
| Basiskomponenten | [`nsh/base`](./nsh-base.md) | Ungestylte Komponenten, die Verhalten, Zustand, Fokus und Barrierefreiheit verantworten: ein Button, Markdown- und HTML-Dokumente, Navigationsstacks und Dialoge sowie die Systemdialoge, auf jeder Plattform |
| Komponentenbibliothek | die deiner App oder eine aus der Community | Buttons, Karten, Zeilen und Screens mit eigenem Look |

Das Erscheinungsbild einer App gehört der App selbst. Ihre Komponentenbibliothek ist die dritte Schicht: Komponenten, die sie aus den [Host-Elementen](../elements/index.md) und `nsh/base` schreibt und mit `style`, [Tailwind](../docs/tailwind.md)-Klassen und ihrem Theme gestaltet, Rust-Komponenten, die sie in [einem eigenen Crate](../docs/rust.md) ausliefert, oder eine Bibliothek, die die Community auf derselben Grundlage veröffentlicht.

Es gibt kein Sammelmodul: Jede API befindet sich an genau einer Stelle. Die APIs der mobilen Plattformen liegen in `nsh/mobile` (iOS und Android) und die der Desktops in `nsh/desktop` (macOS, Windows, Linux). Beide lassen sich auf jeder Plattform importieren, sodass ein Bundle überall läuft (auf anderen Plattformen kehren ihre Aufrufe sofort zurück, und `platform.os` verrät dir, auf welcher Plattform du dich befindest).

Typen werden aus der Runtime generiert: `nsh init`, `nsh build`, `nsh dev` und `nsh test` schreiben `.nsh/types` neben deine App, sodass die TypeScript-Deklarationen stets zur Runtime passen, mit der du baust (siehe [Projektstruktur](../docs/project-structure.md)).

<a id="all-modules"></a>

## Alle Module

| Modul | Exporte | Seite |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary`; die Primitive `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (mit `Image.getSize`, `Image.prefetch`), [`Canvas`](./nsh-canvas.md) (mit `Path2D`, `CanvasRenderingContext2D`, `CanvasGradient`), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md); `safeArea`, `safeAreaInsets`; `Keyboard`, `keyboardFrame`; [Animation](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`); [die Umgebung](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`); [`PanResponder`](./nsh.md#panresponder); [`Clipboard`](./nsh.md#clipboard); [`Picker`](./nsh.md#picker); [`Storage`](./nsh.md#storage); [`host`](./nsh.md#host) (`available`, `call`, `on`, sowie native SDK `params` und `post`); [`keymap`](./nsh.md#keymap) (Tastenkürzel: `mod+k`, `ctrl+shift+p`, ...); [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (Komponenten und Funktionen, die die einbettende App registriert); [Barrierefreiheit](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`); die Typen für Elemente, Styles, Events und JSX (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input`; `TextView`; `createNavStack`, `NavStack`, `NavPage`, `Dialog`; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (die Tab-Leiste des Systems, iOS und Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (Titel, Titelleiste, Maximieren, Vollbild), `titleBar`, `Menu` (Anwendungsmenü, Kontextmenüs) | [nsh/desktop](./nsh-desktop.md) |
| Standardmodule | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [Standardmodule](./standard-modules.md) |
| Globals | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, Timer, `console`, `requestAnimationFrame`, ... (ohne Import) | [Globale APIs](./globals.md) |

Referenzseiten, die keine Module sind:

| Seite | Inhalt |
|---|---|
| [Style-Referenz](./style-reference.md) | Jeder Style-Schlüssel, sein Typ und seine Bedeutung |
| [Tailwind-Referenz](./tailwind-reference.md) | Die Tailwind-Utilities und -Varianten, die `class` akzeptiert |

<a id="host-elements"></a>

## Host-Elemente

Die Host-Elemente sind Komponenten, die wie alles andere importiert werden: `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` und `Overlay` aus `nsh`, die Basiskomponenten (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) aus `nsh/base`, `InputAccessoryView` aus `nsh/mobile`. Nur `If` und `Each` sind Globals. Der Compiler erzeugt die Elemente direkt an Ort und Stelle, sodass die Imports zur Laufzeit nichts kosten. Ihre Props sind unter [Elemente](../elements/index.md) dokumentiert.
