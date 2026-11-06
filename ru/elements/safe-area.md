---
title: "Безопасная область"
description: "Переменные окружения safe-area-inset и аксессоры safeArea и safeAreaInsets: контент не заходит под вырез, строку состояния, индикатор «Домой» и заголовки."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# Безопасная область

Безопасная область (safe area) не даёт контенту оказаться под вырезом или Dynamic Island, строкой состояния, индикатором «Домой», навигационным заголовком и строкой заголовка Mac Catalyst. Любое представление может учитывать её отступы с помощью CSS-функции `env()`:
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` и
`env(safe-area-inset-left)` в своих padding или margin. Это отступы корневого представления, в котором отображается узел:
внутри [NavPage](./nav-stack.md) это отступы под заголовком страницы, внутри [Dialog](./dialog.md) это отступы диалога, а в остальных случаях это безопасная область поверхности. В браузере корнем является страница, а переменные принадлежат самому браузеру.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

Цвет фона заполняет всю область, включая область за строкой состояния, а контент начинается под ней. Значения следуют за отступами: при повороте экрана, на другой странице или в другом диалоге padding обновляется нативно.

<a id="values"></a>

## Значения

| Значение | Пример | Что означает |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | Отступ. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | Отступ; длина подставляется вместо неизвестного имени, как в CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | Отступ плюс длина, для контента, который сохраняет собственные интервалы. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | То же самое. |

Они применяются к `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` и к тем же ключам `margin`. В Tailwind это произвольные значения утилит `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` и `m` (пробелы можно опустить): `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. Тип этих значений в TypeScript: `EnvValue`. См.
[справочник по стилям](../modules/style-reference.md).

В Rust их задают методы `Styled`: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, те же методы `m` и `.pt_safe_area_plus(px(16.0))`
(а также `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`) для отступа плюс длины.

<a id="choosing-the-edges"></a>

## Выбор сторон

Добавляйте отступ только с тех сторон, где он нужен, например когда нижний отступ обрабатывает панель вкладок или ваша собственная нижняя панель:

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## Где использовать

[NavPage](./nav-stack.md) с видимым непрозрачным заголовком уже размещает свой контент под заголовком, поэтому верхний отступ там равен 0. Отступы безопасной области нужны для:

- корня приложения без навигационного стека,
- страницы с `headerVisible={false}` или `headerTransparent`,
- контента полноэкранного [Dialog](./dialog.md),
- ваших собственных панелей у краёв экрана.

<a id="safearea-and-safeareainsets"></a>

## safeArea и safeAreaInsets

Когда числа нужны в коде, читайте их напрямую. Оба TSX-аксессора поступают из `nsh`, возвращают объект `Edges`
(`{ top, right, bottom, left }` в пунктах) и реактивны: код, который их читает, выполняется снова при их изменении, например при повороте экрана.

| TSX | Rust | Возвращает |
|---|---|---|
| `safeArea()` | `safe_area()` | Безопасная область поверхности: части, свободные от системного UI (вырез, индикатор «Домой», строка заголовка). |
| `safeAreaInsets()` | `cx.insets()` | Отступы там, где отображается компонент: отступы ближайшей страницы (под её заголовком), ближайшего диалога или, иначе, безопасная область поверхности. Это значения переменных `safe-area-inset-*`. В TSX вызывайте её внутри компонента; она возвращает аксессор. Rust-компонент вашего крейта читает их с помощью `cx.insets()`. |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

Для padding, равного самому отступу, проще использовать `env()`: он обновляется нативно, без выполнения кода.

<a id="platform-notes"></a>

## Особенности платформ

- **iOS**: отступы берутся из безопасной области UIKit: строка состояния, вырез или Dynamic Island и индикатор «Домой».
- **Android**: NSH сообщает те части системных панелей и выреза дисплея, которые перекрывают представление NSH. Когда NSH [встроен](../docs/android.md) под нативную панель инструментов, верхний отступ представления равен 0.
- **Mac Catalyst**: верхний отступ соответствует строке заголовка окна.
- **Настольные платформы (macOS, Windows, Linux, GPUI) и веб**: контент страницы начинается под её `header`, а диалог задаёт для своего контента собственные отступы, как и на телефонах.

<a id="related"></a>

## См. также

- [Клавиатура](./keyboard.md): `env(keyboard-inset-height)`, контент, удерживаемый над экранной клавиатурой.
- [Устройство и окружение](../docs/device-and-environment.md): безопасная область среди других значений устройства.
