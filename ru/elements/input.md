---
title: "Input"
description: "Нативное текстовое поле: управляемый и неуправляемый текст, клавиатуры, автозаполнение, выделение, многострочные поля ввода и фокус."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` — нативное текстовое поле: UITextField (однострочное) или UITextView (многострочное) на iOS и Mac Catalyst, EditText на Android. Ввод, каретка, выделение, автокоррекция и автозаполнение — штатные средства платформы. В Rust его создаёт `nsh_base::input()`, в TSX — `<Input>` из `nsh/base`.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## Управляемый и неуправляемый режимы

- **Управляемый**: передайте `value` и обновляйте его в `onChange`. Приложение может переписать то, что ввёл пользователь (обрезать, отформатировать): текст сразу показывает правку и исправляется, когда приходит новое `value`. Каждая нативная правка несёт счётчик, а `value` от приложения применяется, если оно основано на последней правке, поэтому более новый ввод всегда побеждает медленное обновление.
- **Неуправляемый**: передайте `defaultValue` (`.default_value(..)` или ничего) и читайте текст из `onChange` или `onSubmit`.

Правила, которые должны соблюдаться во время ввода, — это props, обрабатываемые нативно: `maxLength` ограничивает длину, а `submitBehavior` определяет, что делает return. См. [формы и клавиатура](../docs/forms-and-keyboard.md).

## Props

Помимо [общих props](./index.md#common-props) (где `style` имеет тип `TextStyle`: применяются шрифт, цвет, выравнивание и стили вида):

<a id="text"></a>

### Текст

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Текст, управляемый приложением. |
| `defaultValue` | `.default_value(..)` | `string` | | Начальный текст. |
| `placeholder` | `.placeholder(..)` | `string` | | Показывается, пока поле пусто. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | Несколько строк; return вставляет перевод строки, если `submitBehavior` не указывает иное. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Полоса прокрутки многострочного поля: индикатор платформы или встроенная полоса приложения, если оно её задало ([Scrollbar](./scrollbar.md#built-in-bars)); объект — это собственная тема, `false` — без полосы. |
| `maxLength` | `.max_length(..)` | `number` | | Максимальное число символов, которое может ввести пользователь. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | Пользователь может выделять и копировать текст, но не менять его. |
| `masked` | `.masked(..)` | `boolean` | `false` | Текст скрыт (пароли). |
| `allowFontScaling` | | `boolean` | `true` | Следовать системному размеру текста. |
| `maxFontSizeMultiplier` | | `number` | `0` | Верхняя граница системного масштаба (0 — без ограничения). |

<a id="keyboard"></a>

### Клавиатура

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | Раскладка клавиатуры ([значения](../docs/forms-and-keyboard.md#keyboards-and-autofill); у `numbers-and-punctuation` на iOS есть знак минуса). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | Надпись на клавише return. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Автоматическая капитализация. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | Исправления системы. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | Что содержит поле, для автозаполнения на iOS, Android и в вебе: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | Что делает вставка: `"insert"` вставляет вставленный текст, `"report"` ничего не вставляет, чтобы приложение обработало то, о чём сообщает `onPaste`. Изображения и файлы никогда не вставляются. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (однострочное), `"newline"` (многострочное) | Что делает return: `"submit"` сообщает `onSubmit` и сохраняет фокус, `"blurAndSubmit"` также снимает фокус, `"newline"` вставляет перевод строки (многострочное; однострочное отправляет). Многострочное поле, которое отправляет, всё равно принимает переводы строк по Shift+Return или Option / Alt+Return на аппаратных клавиатурах. `"submit"` оставляет клавиатуру открытой (например, чтобы отправить несколько сообщений). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Получает фокус при появлении. |

<a id="caret-and-selection"></a>

### Каретка и выделение

| Prop | Rust | Тип | Описание |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | Каретка отображается (по умолчанию `true`; `false` скрывает её). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | Управляемое выделение в единицах UTF-16; `end` по умолчанию равно `start` (каретка). |

Каретка мигает, пока её окно показано и активно. В окнах GPUI на Linux она остаётся видимой после десяти секунд без ввода и перемещения, как в приложениях GTK, поэтому сфокусированное поле, оставленное без внимания, не тратит кадры.

<a id="colors"></a>

### Цвета

Цвета placeholder, каретки и подсветки выделения — это ключи стиля с соответствующими классами Tailwind и методы в Rust (UIKit окрашивает каретку и выделение одним цветом — цветом каретки, если он задан):

| Ключ стиля | Rust | Класс | Описание |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | Цвет placeholder. |
| `caretColor` | `.caret_color(..)` | `caret-*` | Цвет каретки. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | Цвет подсветки выделения. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| Ключ `ios` | Rust | Тип | Описание |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | Названия iOS для `autoComplete` (`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | `nativeID` для `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)), показываемый над клавиатурой, пока поле в фокусе. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | Внешний вид клавиатуры; `"default"` следует внешнему виду системы. Клавиатуры Android следуют системной теме. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | Пользователь изменил текст: `value` — текущий текст. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | Нажата клавиша return в поле, которое отправляет (однострочное или `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | нет | Поле получило / потеряло фокус. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | Каретка или выделение переместились (единицы UTF-16). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | Пользователь вставил: текст, его форматирование в виде HTML (Linux, веб), изображения (скриншот) в виде `File`, URL `file:` локальных файлов. Приходит до `onChange` для вставляемого текста ([формы и клавиатура](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | Каретка переместилась вместе с выделением либо при прокрутке или переносе текста: `bounds` — её положение в поле, `pageBounds` — в окне, `Overlay` у `anchor` ([формы и клавиатура](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | Перед изменением текста: `key` — набранный текст, `"Backspace"` или `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | Размер текста изменился (при ширине поля, если оно многострочное) по мере ввода; пустое поле сообщает об одной пустой строке независимо от placeholder. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | Композиция метода ввода началась, изменилась или закончилась: `text` — то, что набирается (пиньинь до выбора иероглифа, кана до преобразования), `""` после завершения. Зафиксированный текст доходит до `onChange` до завершения. |

Многострочное поле, которое растёт вместе с текстом:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Методы ref

| Метод | Rust | Описание |
|---|---|---|
| `focus()` | `focus()` | Фокусирует поле и показывает клавиатуру. |
| `blur()` | `blur()` | Снимает с него фокус. |
| `setSelection(start, end?)` | `set_selection(start, end)` | Выделяет `start..end` (единицы UTF-16); каретка, если они равны. |

Перевод фокуса на следующее поле по return:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`Keyboard.dismiss()` из `nsh` (`dismiss_keyboard()` в Rust) скрывает клавиатуру, в каком бы поле она ни была открыта.

<a id="platform-notes"></a>

## Примечания по платформам

- На macOS однострочный текст, placeholder и каретка используют метрики шрифта нативного поля и центрируются вместе внутри области содержимого. `lineHeight` участвует в раскладке; многострочные редакторы также используют его для интервалов между абзацами.
- Поля внутри [scroll view](./scroll.md#keyboard) нативно не заслоняются клавиатурой. В остальных случаях используйте нижний padding или margin, равный [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` отключает поле (без фокуса) и применяет стили отключённого состояния; поле с `readonly` сохраняет фокус и выделение.
- `inputAccessoryViewID` действует на iOS, где у клавиатуры есть панель аксессуаров.
