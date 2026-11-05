---
title: "Keyboard"
description: "Переменная окружения keyboard-inset-height, Keyboard.dismiss и высота клавиатуры: содержимое остаётся над экранной клавиатурой и перемещается вместе с ней."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# Клавиатура

`env(keyboard-inset-height)` — это высота программной клавиатуры над поверхностью, равная 0, пока клавиатура скрыта. Если использовать её как нижний padding или margin представления, содержимое остаётся над клавиатурой: когда клавиатура появляется или скрывается, представление освобождает место на её высоту, а изменение анимируется вместе с клавиатурой на уровне платформы. Используйте её для содержимого вне scroll view, например для панели сообщений внизу экрана чата; поля ввода внутри [scroll view](./scroll.md) или [List](./list.md) прокручиваются в область видимости средствами платформы. Вместе с ней доступны `Keyboard.dismiss()`, которая скрывает клавиатуру, и высота клавиатуры для собственных раскладок.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

Полная высота клавиатуры подходит для представления, которое доходит до нижнего края экрана, как, например, содержимое экрана. Если ниже есть что-то ещё, например tab bar, вычтите его с помощью длины: `calc(env(keyboard-inset-height) + -49px)` удерживает представление над tab bar высотой 49 pt, а `calc(env(keyboard-inset-height) + 12px)` добавляет отступ над клавиатурой. Значение padding не бывает меньше 0.

<a id="padding-or-margin"></a>

## Padding или margin

| Стиль | Как освобождается место |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | Содержимое сверху сжимается; фон по-прежнему доходит до нижнего края экрана. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | Всё представление, включая фон, заканчивается у верхнего края клавиатуры. |

Высота клавиатуры прибавляется к длине только в том же объявлении, поэтому представление объединяет её с собственными отступами в `calc()`. В Rust `.pb_keyboard_plus(px(..))` и `.mb_keyboard_plus(px(..))` добавляют длину.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

Здесь tab bar высотой 49 pt под представлением уже перекрывает часть высоты клавиатуры. Чтобы отключить освобождение места, не указывайте переменную в стиле, например с помощью условия на сигнале.

<a id="hiding-the-keyboard"></a>

## Скрытие клавиатуры

`Keyboard.dismiss()` из `nsh` снимает фокус с поля ввода, у которого он есть, и тем самым скрывает клавиатуру. Если ни одно поле ввода не в фокусе, ничего не меняется. Компоненты на Rust вызывают `dismiss_keyboard()`.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> Чтобы скрывать клавиатуру, когда пользователь перетаскивает scroll view, задайте `keyboardDismissMode="on-drag"` или `"interactive"` для [scroll view](./scroll.md) или [List](./list.md).

<a id="the-keyboards-height"></a>

## Высота клавиатуры

| TSX | Rust | Возвращает |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | Высоту программной клавиатуры над поверхностью NSH в пунктах (0, пока она скрыта) и длительность анимации её появления или скрытия в миллисекундах. |

Оба значения реактивны: эффект, JSX-выражение или замыкание стиля, которые их читают, выполняются заново, когда клавиатура появляется, скрывается или меняет высоту.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

Высота — это часть клавиатуры, которая перекрывает поверхность NSH. Когда само окно уменьшается из-за клавиатуры (activity на Android с изменением размера) или когда NSH встроен в представление, которое заканчивается выше клавиатуры, высота равна 0.

> [!NOTE]
> Чтобы удерживать содержимое над клавиатурой, проще использовать `env(keyboard-inset-height)`: она анимируется вместе с клавиатурой на уровне платформы, без выполнения кода.

<a id="platform-notes"></a>

## Особенности платформ

- **iOS**: место освобождается с анимацией той же длительности, что у самой клавиатуры, и с кривой ease-in-ease-out.
- **Android**: если окно уменьшается из-за клавиатуры (activity с изменением размера), содержимое уже заканчивается над клавиатурой, а переменная равна 0. Если клавиатура перекрывает представление, место освобождается так же, как на iOS.
- **Десктопы и Mac Catalyst**: ввод идёт с аппаратной клавиатуры, переменная равна 0, а раскладка представления не меняется.
- **Web**: переменная — собственная переменная браузера (из VirtualKeyboard API).

О порядке фокуса, клавишах Return и дополнительных панелях ввода см. [Формы и клавиатура](../docs/forms-and-keyboard.md), о других переменных окружения — [Safe area](./safe-area.md).
