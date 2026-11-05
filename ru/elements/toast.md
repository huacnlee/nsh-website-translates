---
title: "Toast"
description: "Toast, ToastStack и ToastManager: toast-уведомления без стилей, как в gpui-base, семантический корневой элемент со статусом перехода, стек, который раскладывает уведомления по слоям, и их headless-жизненный цикл."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

Toast — это короткие сообщения, которые на некоторое время показываются поверх приложения: «Скопировано», «Черновик удалён · Отменить», «Не удалось отправить».
`nsh/base` предоставляет их поведение тремя неоформленными частями, так же как `gpui-base` в GPUI Kit:

- **`ToastManager`** хранит toast'ы по порядку вместе с их жизненным циклом: каждый toast сначала `"starting"`, затем `"present"` после того, как
  пройдёт длительность анимации; пока он показан и не поставлен на паузу, его тайм-аут отсчитывается, а после этого он остаётся `"ending"` в течение
  длительности выхода и затем удаляется.
- **`ToastStack`** измеряет свои toast'ы и раскладывает их от края, причём самый новый ближе всего к нему: в свёрнутом состоянии — перекрывающимися слоями, в развёрнутом — списком (когда на нём указатель или на нём палец); движение выполняется на пружинах.
- **`Toast`** — корень каждого toast'а: роль `alert`, его `transitionStatus` для стилей приложения, свайп, который запрашивает
  закрытие toast'а, и чтение скринридером его метки в момент появления.

Внешний вид и содержимое определяются приложением, как и удобный способ показать toast из любого места: приложение строит
собственный `toast(...)` поверх этих частей, как это сделано в галерее (`examples/gallery/toast.tsx`), и как уведомления GPUI Kit
построены на toast'ах `gpui-base`.

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`, `ToastStack` и `ToastManager` поставляются из [`nsh/base`](../modules/nsh-base.md). В Rust это
`toast`, `toast_stack` и `ToastManager` из `nsh_base`.

## ToastManager

Менеджер не имеет интерфейса: он ничего не отрисовывает и не запускает таймер. Приложение добавляет toast'ы, отрисовывает те,
что возвращает `visible(limit)`, вместе с их статусом и вызывает `advance` по таймеру, пока смонтирован хотя бы один toast, передавая `paused`,
пока стек развёрнут. В Rust это `ToastManager<I, T>` над идентификаторами и значениями приложения, с `Instant` для
каждого вызова; в TS это класс над строковыми идентификаторами и любыми JSON-значениями, работающий на часах движка (включая ручные часы
теста).

- `push(id, value, options)` добавляет самый новый toast, заменяя toast с тем же идентификатором (и возвращая его значение);
  `options.timeout` — время его показа в миллисекундах (не задано: он остаётся, пока его не закроют).
- `dismiss(id)` начинает выход toast'а; `dismissAll()` — выход каждого toast'а, возвращая их идентификаторы.
- `advance(paused)` продвигает жизненный цикл и сообщает, что изменилось: `presented`, `ending` (у них истёк тайм-аут),
  `removed` (вместе с их значениями) и `changed`.
- `visible(limit)` — это `limit` самых новых toast'ов, которые не завершаются, плюс завершающиеся, от самого старого; `entries()`
  (в Rust `iter()`) — все они; `get(id)`, `len()`, `isEmpty()`.

`ToastMotion` содержит токены обеих частей: `duration` (400 мс: крайний срок появления и отклик пружины стека),
`exitDuration` (200 мс), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0.05) и
`collapsedVisible` (3) — значения Sonner (`ToastMotion::sonner()` в Rust; пропущенные в TS поля сохраняют их).

## ToastStack

Дочерние элементы стека — его toast'ы, от самого старого. От своего края `placement` (по умолчанию `"topRight"`; нижние
привязки раскладывают элементы вверх) свёрнутые toast'ы перекрываются на расстоянии `collapsedPeek` друг от друга, каждый следующий
уже на `collapsedScaleStep`, и показываются только `collapsedVisible`; в развёрнутом состоянии они образуют список с интервалом `expandedGap`. Toast'ы, которые
появляются или уходят, а также разворачивание перемещаются критически демпфированными пружинами. Стек развёрнут, пока на нём указатель
или на нём палец (`onExpandedChange({ expanded })`; в Rust `ToastStackState`, который читается через `is_expanded()`), поэтому
приложение приостанавливает тайм-ауты, пока пользователь читает toast'ы или касается их.

Стек размещает приложение: в [Overlay](./overlay.md) у края, внутри безопасной области. Его `class` и `style`
задают его ширину. Пока в нём есть toast'ы, он реагирует на Escape и кнопку «Назад» в Android (`onCancel`; `closeOnEscape={false}`
оставляет их остальной части приложения): закрыть самый новый.

<a id="toast-1"></a>

## Toast

Toast — это роль `alert` вокруг содержимого приложения. Его `transitionStatus` задаёт менеджер, а классы его состояний
следуют за ним через `class`: `startingClass` в первом кадре, пока `"starting"`, чтобы его классы `transition` анимировались
от него (`starting:` в Tailwind, `@starting-style` в CSS); `endingClass`, пока `"ending"`, в течение длительности выхода;
`swipingClass`, пока указатель смахивает его (`transition-none` удерживает его под пальцем).

Палец или мышь, перетаскиваемые в сторону `swipeDirection` (по умолчанию `"right"`; `null` отключает свайп), перемещают его после того,
как указатель сдвинулся, чтобы его кнопки оставались кнопками; если отпустить дальше `swipeThreshold` точек (50) или резким движением, он уходит
дальше и запрашивает закрытие (`onDismissRequest`), а если не дотянуть — возвращается назад. Скринридер читает его
`accessibilityLabel` в момент появления.

<a id="toast-props"></a>

## Свойства Toast

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | Фаза его жизненного цикла. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | нет | Его классы в первом кадре, при завершении и при свайпе. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | Направление, в котором его смахивают. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | Как далеко должен пройти свайп, чтобы отпускание запросило закрытие. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что скринридер читает в момент появления. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | нет | Пользователь смахнул его. |

<a id="toaststack-props"></a>

## Свойства ToastStack

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | как в Sonner | Его токены анимации. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | Край, от которого он раскладывает элементы. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Реагирует на Escape и «Назад», пока содержит toast'ы. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | нет | Взаимодействие развернуло или свернуло его. |
| `onCancel` | `.on_cancel(..)` | `() => void` | нет | Escape или «Назад»: закрыть самый новый. |
