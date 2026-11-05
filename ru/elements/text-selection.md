---
title: "Выделение текста"
description: "Выделяемые представления: единое выделение across текстов внутри представления, между представлениями, элементами Text и TextView — так же, как выделяется текст на веб-странице."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# Выделение текста

[`View`](./view.md) с `selectable` делает так, что тексты внутри него выделяются вместе, как на веб-странице: одно выделение тянется от места в одном тексте до места в другом, через views, элементы [`Text`](./text.md) и [`TextView`](./text-view.md) в порядке чтения. Если сделать транскрипт чата выделяемым, выделение может начаться в одном сообщении и закончиться в следующем. Copy помещает выделенный текст в буфер обмена: тексты, расположенные рядом, разделяются табуляцией, остальные переводом строки. В Rust это задаётся через `view().selectable(true)`, в TSX через `<View selectable>`; можно ли выделить отдельный текст, определяет его стиль `userSelect`.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

Раскладка и внешний вид view определяются стилями приложения, а содержимое задаётся его дочерними элементами. Само выделение принадлежит платформе: view ничего не рисует для него сам.

<a id="a-chat-transcript"></a>

## Транскрипт чата

Транскрипт в одном выделяемом view выделяется как единая страница: перетаскивание начинается в одном ответе и заканчивается в другом, а Copy забирает текст каждого сообщения между ними.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## Как создаётся выделение

| Платформа | Как создаётся выделение |
|---|---|
| macOS, Windows, Linux, GPUI | Перетащите указатель по текстам; двойной щелчок выделяет слово, тройной абзац, а перетаскивание после них продолжает выделение по словам или абзацам. Shift+щелчок расширяет выделение. Ctrl / Cmd+A выделяет всё в view, Ctrl / Cmd+C копирует, Escape или нажатие вне view снимает выделение. |
| iOS, Android | Долгое нажатие выделяет слово; маркеры платформы расширяют выделение, а в её меню редактирования есть Copy и Select All. |
| Web | Собственное выделение браузера с его жестами, меню и сочетаниями клавиш. |

<a id="what-it-selects"></a>

## Что выделяется

- **Исключённые тексты**: текст с `userSelect: "none"` (`.select_none()` в Rust, класс `select-none`; например, метка или подпись кнопки) пропускается выделением и его жестами.
- **Вложенные views**: выделяемый view внутри другого является частью внешнего, поэтому одно выделение охватывает оба.
- **TextView**: [`TextView`](./text-view.md) с `selectable` выделяется как самостоятельный блок: его абзацы, элементы списков, ячейки и блоки кода выделяются вместе. Внутри выделяемого view он входит во внешнее выделение.
- **Отдельные тексты**: текст с `userSelect: "text"` вне выделяемых views выделяется сам по себе, как описано в [Text](./text.md#props).
- **Внешний вид** определяется подсветкой платформы в `selectionColor` каждого текста (`selection:text-*`).
- **Списки**: в виртуализированном [List](./list.md) выделение охватывает смонтированные строки; строки, переработанные за пределами видимой области, из выделения выпадают.

<a id="related"></a>

## См. также

- [View](./view.md): проп `selectable`.
- [Text](./text.md): `userSelect`, `selectionColor` и выделение отдельного текста.
- [TextView](./text-view.md): документы, блоки которых выделяются как одно целое.
