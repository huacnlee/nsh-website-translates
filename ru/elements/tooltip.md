---
title: "Tooltip"
description: "Компонент Tooltip: подсказка об элементе, в который он вложен, которая отображается на настольных платформах, когда указатель задерживается на элементе, и стилизуется приложением."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# Tooltip

Tooltip — это короткая подсказка рядом с тем, к чему она относится: что делает кнопка-иконка, полный текст усечённой надписи.
На десктопах и в десктопных браузерах она появляется, когда указатель задержался на своём триггере в течение `delay` (500 мс), и
скрывается, когда указатель уходит с триггера или нажимает на него. На телефонах и планшетах Tooltip показывается, только когда приложение само открывает его
(`open`). Она никогда не перехватывает указатель и нажатия, поэтому триггер работает точно так же, как и без неё.

`Tooltip` из [`nsh/base`](../modules/nsh-base.md) передаётся как свойство `tooltip`, которое есть у каждого элемента
([Общие свойства](index.md#tooltips)), как `.tooltip(..)` в GPUI: элемент — это то, на чём задерживается указатель и относительно чего
размещается подсказка. Сама подсказка — это всплывающее окошко: стилизуйте его через `class` / `style`, а его дочерние элементы — это то, что оно сообщает.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

По умолчанию она располагается над своим триггером (`placement`), с другой стороны, если места нет, и остаётся внутри безопасной
области. С `open` приложение само решает, когда её показывать: она следует за `onOpenChange`, который сообщает, что указатель задержался на
триггере или покинул его, и может показываться на любом устройстве.

Она появляется и исчезает вместе с вашими переходами: `startingClass` — её вид в первом кадре, а `endingClass` — её вид
после скрытия, который она сохраняет, пока выполняются классы `transition-*` её `class`; затем следует `onClose`.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | нет | Что она сообщает. |
| `class`, `style` | методы `.app_class(..)`, `Styled` | `string`, `StyleProp<ViewStyle>` | нет | Вид всплывающего окошка — самой подсказки. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Её вид в первом кадре: от него запускаются её переходы. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Её вид после скрытия: сохраняется, пока выполняются её переходы. |
| `open` | `.open(..)` | `boolean` | нет | Показана, управляется приложением. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Показана изначально, без `open`. |
| `delay` | `.delay(..)` | `number` | `500` | Миллисекунды, в течение которых указатель должен задержаться на триггере, прежде чем она появится; `Infinity`: сама никогда, только когда её открывает приложение. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Никогда не показывается. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Сторона триггера, с которой она располагается. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Как она выравнивается относительно триггера вдоль этой стороны. |
| `offset` | `.offset(..)` | `number` | `4` | Зазор между триггером и подсказкой. |
| `margin` | `.margin(..)` | `number` | `4` | Расстояние, которое она выдерживает от краёв безопасной области. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Указатель задержался на триггере, ушёл с него или нажал на него (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | Она показана. |
| `onClose` | `.on_close(\|\| ..)` | Она исчезла, после завершения выхода; также когда её скрыло приложение. |

<a id="accessibility"></a>

## Доступность

Tooltip дублирует для программ чтения с экрана то, что сообщает её триггер: задайте триггеру также `accessibilityLabel`, чтобы
подсказка была доступна всем.
