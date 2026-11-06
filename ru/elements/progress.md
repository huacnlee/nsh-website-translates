---
title: "Progress"
description: "Компонент Progress: линейная полоса прогресса, которая сама задаёт свою роль, диапазон и значение для программ чтения с экрана, а также ширину индикатора по значению; дорожку и индикатор оформляет приложение."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

Progress показывает, как далеко продвинулась задача с известным объёмом (загрузка, выгрузка, шаг настройки), или, пока `indeterminate`, что выполняется задача с неизвестным объёмом. Он отвечает за то, что получают скринридеры: роль progress bar с диапазоном от 0 до 100 и значение, а также за ширину индикатора: `value` процентов от ширины дорожки. Внешний вид определяет приложение: у `Progress` нет собственных цветов, размеров, радиусов, анимации и подписи. Он состоит из дорожки с индикатором внутри, затем идут его дочерние элементы (подпись, значение в виде текста), а каждую часть стилизует приложение.

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` приходит из [`nsh/base`](../modules/nsh-base.md), crate `nsh-base` в Rust. Значение принадлежит приложению: полоса прогресса показывает `value`, которое передаёт приложение, ограниченное диапазоном от 0 до 100. В Rust `progress()` создаёт его с сеттером на каждое свойство (`.value(..)`, `.indicator_style(..)`), типизированными методами стилей для самой полосы прогресса и `.child(..)` для её подписи.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | Насколько продвинулась задача, в процентах от 0 до 100 (за пределами диапазона берётся ближайшая граница). Индикатор занимает эту долю ширины дорожки, и скринридеры озвучивают её. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Объём задачи неизвестен: скринридеры слышат progress bar без значения, а ширину индикатора задаёт приложение (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что говорят скринридеры: что именно выполняется, если в дочерних элементах нет текста, который это сообщает. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Дорожка: часть, которую заполняет индикатор. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Индикатор внутри дорожки: его высота, цвет и анимация. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое после дорожки: подпись или значение в виде текста, которые озвучивают скринридеры. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Сама полоса прогресса: столбец (или строка) вокруг дорожки и подписи. |

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется через |
|---|---|---|
| Полоса прогресса | | `class`, `style` |
| Дорожка | полоса прогресса, первой | `trackClass`, `trackStyle` |
| Индикатор | дорожка | `indicatorClass`, `indicatorStyle`; его ширина составляет `value` процентов от ширины дорожки |
| Подпись | полоса прогресса, после дорожки | собственные элементы (`children`) |

Индикатор начинается с ведущего края дорожки; `overflow-hidden` и радиус у дорожки скругляют его конец вместе с концом дорожки. Класс `w-*` или `width` в `indicatorStyle` заменяет ширину, заданную значением, так неопределённая полоса получает собственную ширину.

<a id="indeterminate"></a>

## Неопределённый режим

Пока объём неизвестен, задайте `indeterminate` и дайте индикатору ширину и анимацию приложения. Анимацию выбирает приложение, а `motion-reduce:` оставляет её неподвижной для тех, кто просит меньше движения:

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## Доступность

- Для скринридеров полоса прогресса является одним элементом с ролью `"progressbar"`, диапазоном от 0 до 100 и значением (VoiceOver и TalkBack произносят его в процентах); дорожка и индикатор являются его частями. Его подпись — это текст дочерних элементов; если его нет, задайте `accessibilityLabel`.
- Пока `indeterminate`, элемент сохраняет роль и диапазон, но не имеет значения (в браузере `aria-valuenow` опускается, как и положено для неопределённой полосы прогресса в ARIA).
- Он не принимает нажатий и не получает фокус клавиатуры: он только сообщает о ходе задачи, а элементы управления, которые запускают или останавливают задачу, остаются за приложением.

О подписях, ролях и объявлениях в целом см. [Доступность](../docs/accessibility.md).

<a id="platform-notes"></a>

## Особенности платформ

- Каждая платформа отрисовывает то, что стилизует приложение; ширина индикатора сразу следует за `value`, а изменение анимируется, если приложение это анимирует.
- Скринридеры: VoiceOver (iOS, macOS) озвучивает значение в процентах и сообщает, что полоса часто обновляется; TalkBack, UI Automation (Windows), специальные возможности GTK (Linux) и браузер (`aria-valuenow`) получают диапазон и значение.
