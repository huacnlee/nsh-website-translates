---
title: "View"
description: "Базовый элемент-контейнер: компоновка, фоны, границы, тени, обработка нажатий и жесты."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` — основной строительный блок любого экрана: нативный контейнер (UIView на iOS и Mac Catalyst, ViewGroup на
Android), который раскладывает дочерние элементы с помощью flexbox или grid, рисует фон, границы, тени и градиенты и обрабатывает
нажатия. Кнопки, карточки, строки и экраны — всё это views. В Rust view создаётся с помощью `view()`, в TSX — с помощью `<View>` из `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

## Layout

View раскладывает дочерние элементы с помощью flexbox со следующими значениями по умолчанию: `flexDirection: "column"`, `flexShrink: 0`,
`alignContent: "flex-start"`, `position: "relative"`. `display: "grid"` (`.grid()` в Rust) переключает на CSS grid, а
`display: "block"` — на блочную раскладку. Размеры задаются в пунктах. См. [раскладку](../docs/layout.md) и
[справочник по стилям](../modules/style-reference.md).

`display: "flex"` следует CSS: в стиле, как класс `flex` и как `.flex()` в Rust, это строка, если не задано направление
(`flexDirection: "column"`, `flex-col`, `.flex_col()`). View, в котором display не задан, располагает дочерние элементы в столбец.

## Props

У `View` есть одно собственное свойство — `selectable` (`.selectable(true)` в Rust): тексты внутри view выделяются вместе, как единое выделение ([Выделение текста](./text-selection.md)). Остальные свойства — [общие свойства](./index.md#common-props): стили (`style`, `class`,
`classList`; методы `Styled` в Rust), `disabled`, свойства нажатия (`onPress`, `onLongPress`, `onPressDown`,
`onPressUp`, `delayLongPress`, `hitSlop`), стили состояний (`activeStyle`, `hoverStyle`,
`focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`,
`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`,
свойства жестов (`pan`, `pinch`, `rotation` и связанные с ними события), свойства касаний и responder, свойства доступности
и `ios` / `android` / `desktop`.

## Selectable views

При `selectable` выделение проходит по элементам [`Text`](./text.md) и [`TextView`](./text-view.md) внутри
view в порядке чтения; тексты с `selectable={false}` в выделение не попадают, а selectable view внутри другого входит в
состав внешнего. Жесты для каждой платформы см. в разделе [Выделение текста](./text-selection.md).

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

## Press feedback

Нажимаемый view — это любой view с обработчиком нажатия. Отклик задаёт приложение: стиль на время нажатия применяется нативно,
пока палец касается экрана, без обращения к коду приложения. `hoverStyle`, `focusStyle` и `disabledStyle` работают
так же для остальных состояний:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

На Android `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` в Rust) добавляет material
ripple (`borderless`, `radius` и `foreground` его настраивают).

`disabled` удаляет слушатели нажатий из нативного view (нет ни нажатия, ни отклика) и применяет стили отключённого состояния:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

## Events

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (в Rust нет) | Касание завершилось внутри view. |
| `onLongPress` | `.on_long_press` | `PressEvent` (в Rust нет) | Палец оставался прижатым в течение `delayLongPress` (500 мс). |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (в Rust нет) | Палец опустился / поднялся или ушёл за пределы view. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | Мышь вошла в область view (или view внутри него) / покинула её или окно ([hover](./index.md#hover)); у `onMouseLeave` это последняя позиция мыши. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | Мышь переместилась над view (или view внутри него) при нажатой кнопке или без неё, либо клавиша-модификатор была нажата или отпущена, пока мышь находится над view без нажатых кнопок: `position`, `pagePosition` (`Point`), `modifiers` и `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` или `null`); не чаще одного раза за кадр. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | Вторичная кнопка была нажата над view ([контекстные меню](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | нет | Перетаскивание локальных файлов вошло в активную область назначения на десктопе / покинуло её. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | Локальные файлы или каталоги были сброшены на область назначения на десктопе. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | Изменился frame относительно родителя. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | Перетаскивание, привязанное через `pan`, началось / закончилось; `cancelled` равно true, если система отменила его. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | Жест pinch, привязанный через `pinch`, начался / закончился. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | Жест поворота, привязанный через `rotation`, начался / закончился. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | Выполнено пользовательское действие доступности. |

События касаний и responder: см. [общие свойства](./index.md#raw-touches-and-the-responder-system).

## Desktop file drops

На AppKit, GTK, Win32 и GPUI view с `onFileDrop` принимает локальные файлы и каталоги, перетащенные из другого
приложения. `onFileDragEnter` и `onFileDragLeave` отслеживают активную область назначения; `onFileDrop` получает
`{ uris: string[] }` в том порядке, в каком их отдаёт нативный список файлов. Каждый элемент — абсолютный URL `file:` с экранированными пробелами и
не-ASCII-символами. Чтобы получить путь в файловой системе, разберите URL, а не удаляйте префикс вручную.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

Drop получает ближайший включённый предок, который слушает `onFileDrop`. Поиск ограничивается корнем модального окна. `disabled`
удаляет слушатели перетаскивания файлов; выход, отмена, завершение и удаление области назначения сбрасывают активное состояние.
Приём использует операцию Copy и смонтированное нативное состояние. Читать, открывать или передавать
полученные файлы — решает приложение.

## Ref methods

Ref простого view — это `ViewRef`: `focus()`, `blur()` и `measure()`. `ref` (`.element_ref(&handle)` в Rust) возвращает его узел, например чтобы передать в
`setAccessibilityFocus` ([API доступности `nsh`](../modules/nsh.md#accessibility)) или чтобы измерить его
(`handle.measure()` в Rust).

## Views inside text

View, помещённый внутрь текста, — это встроенное вложение: он располагается на базовой линии, переносится вместе со словами и
самостоятельно обрабатывает нажатия. См. [text](./text.md#inline-views-and-images).

## Platform notes

- `boxShadow` отрисовывается на всех платформах; `android={{ elevation }}` вместо этого включает material-тень Android. На Android для тени нужен
  цвет фона (view с прозрачным фоном тень не отбрасывает).
- `filter` для views: iOS поддерживает `opacity()`, `brightness()` до 1 и `drop-shadow()` (изображения принимают любые цветовые
  фильтры и `blur()`); Android поддерживает все начиная с API 31, а ниже — только цветовые фильтры.
- `backdropFilter: "blur(…)"` — системный материал на iOS (приближение) и требует API 31 на Android.
- Android отрисовывает трансформации `translate`, `scale` и `rotate`; наклоны (`skew()`, `skewX()`, `skewY()`) применяются на остальных платформах.
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) рисует углы, плавно переходящие в стороны (как
  у иконок приложений iOS), на обеих платформах.
- Стиль `cursor` применяется там, где есть указатель (Mac Catalyst, iPad с указателем, десктопы).
