---
title: "Модули"
description: "Модули, которые импортирует приложение NSH, что экспортирует каждый из них и как они организованы."
order: 1
source_hash: c212e0667eddb588
---

# Модули

Приложение NSH импортирует всё, что использует, из небольшого набора модулей. Все они нативные: реактивный граф, рендерер и каждый модуль реализованы на Rust внутри рантайма, а бандлер оставляет `import ... from "nsh/..."` как импорты и не копирует код в ваш бандл. Ваш бандл содержит только ваш собственный код.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## Три слоя

UI в NSH строится из трёх слоёв, как и в GPUI Kit (`gpui`, `gpui-base`, `gpui-component`):

| Слой | Модули | Что получает приложение |
|---|---|---|
| Примитивы | `nsh`, `nsh/mobile`, `nsh/desktop` | Реактивность, host-элементы, раскладка, списки, canvas, анимация, жесты, информация об устройстве и собственные API платформ |
| Базовые компоненты | [`nsh/base`](./nsh-base.md) | Компоненты без стилей, которые отвечают за поведение, состояние, фокус и доступность: кнопка, документы Markdown и HTML, стеки навигации, диалоги и системные диалоги на каждой платформе |
| Библиотека компонентов | ваша собственная или из сообщества | Кнопки, карточки, строки и экраны с внешним видом |

Внешний вид приложения определяет само приложение. Его библиотека компонентов — это третий слой: компоненты, которые приложение пишет из [host-элементов](../elements/index.md) и `nsh/base` и стилизует с помощью `style`, классов [Tailwind](../docs/tailwind.md) и своей темы, компоненты на Rust, которые оно поставляет в [собственном крейте](../docs/rust.md), или библиотека, опубликованная сообществом на той же основе.

Универсального модуля «всё в одном» нет: каждый API находится ровно в одном месте. API мобильных платформ находятся в `nsh/mobile` (iOS и Android), а API десктопов — в `nsh/desktop` (macOS, Windows, Linux). Оба модуля можно импортировать на любой платформе, поэтому один бандл работает везде (на других платформах их вызовы сразу возвращаются, а `platform.os` сообщает, на какой платформе вы работаете).

Типы генерируются из рантайма: `nsh init`, `nsh build`, `nsh dev` и `nsh test` записывают `.nsh/types` рядом с вашим приложением, поэтому объявления TypeScript всегда соответствуют рантайму, с которым вы собираете проект (см. [Структура проекта](../docs/project-structure.md)).

<a id="all-modules"></a>

## Все модули

| Модуль | Экспорты | Страница |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary`; примитивы `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (вместе с `Image.getSize`, `Image.prefetch`), [`Canvas`](./nsh-canvas.md) (вместе с `Path2D`, `CanvasRenderingContext2D`, `CanvasGradient`), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md); `safeArea`, `safeAreaInsets`; `Keyboard`, `keyboardFrame`; [анимация](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`); [окружение](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`); [`PanResponder`](./nsh.md#panresponder); [`Clipboard`](./nsh.md#clipboard); [`Picker`](./nsh.md#picker); [`Storage`](./nsh.md#storage); [`host`](./nsh.md#host) (`available`, `call`, `on`, а также нативные SDK `params` и `post`); [`keymap`](./nsh.md#keymap) (сочетания клавиш: `mod+k`, `ctrl+shift+p`, ...); [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (компоненты и функции, которые регистрирует встраивающее приложение); [доступность](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`); типы элементов, стилей, событий и JSX (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input`; `TextView`; `createNavStack`, `NavStack`, `NavPage`, `Dialog`; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (системная панель вкладок, iOS и Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (заголовок, строка заголовка, разворачивание, полноэкранный режим), `titleBar`, `Menu` (меню приложения, контекстные меню) | [nsh/desktop](./nsh-desktop.md) |
| Стандартные модули | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [Стандартные модули](./standard-modules.md) |
| Глобальные | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, таймеры, `console`, `requestAnimationFrame`, ... (импорт не нужен) | [Глобальные API](./globals.md) |

Справочные страницы, которые не являются модулями:

| Страница | Что описывает |
|---|---|
| [Справочник по стилям](./style-reference.md) | Каждый ключ стиля, его тип и значение |
| [Справочник по Tailwind](./tailwind-reference.md) | Утилиты и варианты Tailwind, которые принимает `class` |

<a id="host-elements"></a>

## Host-элементы

Host-элементы — это компоненты, которые импортируются так же, как и всё остальное: `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` и `Overlay` из `nsh`, базовые компоненты (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) из `nsh/base`, `InputAccessoryView` из `nsh/mobile`. Глобальными являются только `If` и `Each`. Компилятор создаёт элементы на месте, поэтому импорты ничего не стоят во время выполнения. Их свойства описаны в разделе [Элементы](../elements/index.md).
