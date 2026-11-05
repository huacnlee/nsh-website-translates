---
title: "Формы и клавиатура"
description: "Ввод текста с помощью элемента input: управляемые и неуправляемые значения, типы клавиатуры, клавиша Return, фокус, выделение, растущие многострочные поля ввода и защита содержимого от перекрытия экранной клавиатурой."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# Формы и клавиатура

Ввод текста — это элемент input, `input()` в Rust и `<Input>` в TSX: UITextField или UITextView на iOS, EditText на Android. Набор текста, каретка, выделение, автокоррекция и автозаполнение принадлежат самой платформе; приложение получает текст через события и может им управлять. NSH также сам удерживает сфокусированные поля ввода над программной клавиатурой и предоставляет высоту клавиатуры как реактивное значение для случаев, с которыми он не справляется самостоятельно.

Поле ввода принимает стили, как любое view (типизированные методы стилей в Rust, стили и классы Tailwind в TSX), поэтому поля формы выглядят так, как нужно вашему приложению. Поле с подписью — это небольшой собственный компонент:

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## Управляемые и неуправляемые поля ввода

Поле ввода **управляемое**, когда вы передаёте его значение (`.value(..)`, в TSX `value`): оно показывает то, что хранит ваш сигнал, а сигнал вы обновляете из события изменения (`.on_change(..)`, в TSX `onChange`).

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

Поскольку значение в ваших руках, вы можете преобразовывать вводимый текст: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` переводит его в верхний регистр, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` оставляет только цифры.

<a id="input-methods"></a>

### Методы ввода

Китайский, японский и корейский методы ввода собирают текст перед фиксацией: пиньинь превращается в 腾 после выбора иероглифа. `onCompositionChange` (в Rust `.on_composition_change(..)`) сообщает о композиции по ходу набора: `{ composing: true, text: "teng" }`, пока пользователь печатает, и `{ composing: false, text: "" }`, когда она заканчивается; зафиксированный текст попадает в `onChange` до завершения. На iOS, Android, macOS и в вебе `onChange` также сообщает набираемый текст, так как эти системы хранят его в поле ввода; на Windows, Linux и GPUI он сообщает зафиксированный текст. Управляемое поле продолжает композицию независимо от того, что приложение делает со значением: `value`, заданный во время композиции, отображается после её завершения, поэтому поле, которое переводит текст в верхний регистр или фильтрует его, принимает пиньинь как есть.

Строка поиска, которая ищет только по зафиксированному тексту:

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

Поле ввода **неуправляемое**, если значение не передано: оно хранит собственный текст, начиная со значения по умолчанию (`.default_value(..)`, в TSX `defaultValue`), а читать его нужно из события изменения или отправки, когда он понадобится. Используйте это для полей, которые вы читаете только при отправке, например для пароля.

> [!NOTE]
> Управляемое поле никогда не теряет нажатия клавиш. Каждое нативное редактирование несёт счётчик правок, а `value`, пришедший из JS, применяется только если он отвечает на последнюю правку. Если JS работает медленно и пользователь тем временем набрал ещё текст, устаревшее значение отбрасывается и не перезаписывает более новый текст.

<a id="props"></a>

## Свойства

В Rust каждое свойство — это метод `input()` с именем в snake case (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`) со следующими собственными именами: `.keyboard_type(KeyboardType::Email)` и остальные варианты `KeyboardType`, `.auto_fill(AutoFill::Email)` для `autoComplete`, `.keyboard_appearance(..)` и `.input_accessory(..)` для свойств `ios={{ … }}`. Каждое событие — это метод `on_`: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `value` | `string` | | Текст, управляемый из JS. |
| `defaultValue` | `string` | | Начальный текст неуправляемого поля. |
| `placeholder` | `string` | | Показывается, пока поле пусто. |
| `masked` | `boolean` | `false` | Скрывает текст (пароли). |
| `keyboardType` | `KeyboardType` | `"default"` | Раскладка клавиатуры. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | Подпись клавиши return. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Автоматический регистр букв. |
| `autoCorrect` | `boolean` | `true` | Исправления системы. |
| `autoComplete` | `AutoComplete` | | Что содержит поле, для автозаполнения. |
| `multiline` | `boolean` | `false` | Несколько строк; return вставляет перевод строки, если `submitBehavior` не говорит иное. |
| `maxLength` | `number` | | Наибольшее число символов, которое может ввести пользователь. |
| `readonly` | `boolean` | `false` | Пользователь может выделять и копировать текст, но не менять его. |
| `autoFocus` | `boolean` | `false` | В фокусе при появлении. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | однострочное `"blurAndSubmit"`, многострочное `"newline"` | Что делает return: отправляет и сохраняет фокус, отправляет и снимает фокус или вставляет перевод строки (только многострочное). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | Что делает вставка: вставляет свой текст или ничего ([вставка](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | Каретка отображается; `false` скрывает её. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | Вид клавиатуры (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | Управляемое выделение в единицах UTF-16. |
| `allowFontScaling` | `boolean` | `true` | Следовать системному размеру текста. |
| `maxFontSizeMultiplier` | `number` | | Верхняя граница системного масштаба (0: без ограничения). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: панель над клавиатурой (см. ниже). |
| `ios={{ textContentType }}` | `TextContentType` | | Имена iOS для значений `autoComplete`. |

События:

| Событие | Данные | Когда |
|---|---|---|
| `onChange` | `{ value }` | Текст изменился: `value` — текущий текст. |
| `onSubmit` | `{ text }` | Нажата клавиша return в поле, которое отправляет (однострочное или `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | Поле получило / потеряло фокус. |
| `onSelectionChange` | `{ start, end }` | Каретка или выделение переместились (в единицах UTF-16). |
| `onPaste` | `{ text, html, files, uris }` | Пользователь вставил: текст, его HTML (Linux, веб), изображения как `File`, URL локальных файлов ([вставка](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | Каретка переместилась: где она в поле и в окне ([каретка](#the-caret)). |
| `onKeyPress` | `{ key }` | Перед изменением текста: `key` — набранный текст, `"Backspace"` или `"Enter"`. |
| `onContentSizeChange` | `{ size }` | Размер текста (`size`) изменился (при ширине поля, если оно многострочное) по мере набора; пустое поле сообщает об одной пустой строке независимо от плейсхолдера. |
| `onCompositionChange` | `{ composing, text }` | Композиция метода ввода началась, изменилась или закончилась (см. [Методы ввода](#input-methods)). |

Поле ввода стилизуется как текст: `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` и остальные [стили текста](./text.md), а также границы, отступы и фоны. Стиль фокуса (`.focus(|s| ..)` в Rust, вариант Tailwind `focus:` или `focusStyle` в TSX) применяется, пока поле в фокусе. Цвет плейсхолдера — `.placeholder_color(..)` (ключ стиля
`placeholderColor`, `placeholder:text-*`), цвет каретки — `.caret_color(..)` (`caretColor`, `caret-*`), а цвет подсветки выделения — `.selection_color(..)`
(`selectionColor`, `selection:text-*`); UIKit окрашивает каретку и выделение одним цветом, цветом каретки, если он задан:

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## Клавиатуры и автозаполнение

Тип клавиатуры (`.keyboard_type(..)`, в TSX `keyboardType`) выбирает раскладку:

| Rust | TSX | Клавиатура |
|---|---|---|
| `KeyboardType::Default` | `"default"` | Текстовая. |
| `KeyboardType::Email` | `"email-address"` | Текстовая с `@` и `.` под рукой. |
| `KeyboardType::Url` | `"url"` | Текстовая с `/` и `.com`. |
| `KeyboardType::Number` | `"number-pad"` | Только цифры: без знака и без десятичного разделителя (коды, PIN). |
| `KeyboardType::Decimal` | `"decimal-pad"` | Цифры и десятичный разделитель. |
| `KeyboardType::Numeric` | `"numeric"` | Как в React Native: десятичная панель iOS; на Android цифры со знаком и десятичным разделителем. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | Цифры, знак минус и пунктуация (клавиатура iOS с цифрами и пунктуацией; на Android цифры со знаком и десятичным разделителем). Используйте её для отрицательных чисел на iOS. |
| `KeyboardType::Phone` | `"phone-pad"` | Телефонная панель набора. |

На iOS `.keyboard_appearance(KeyboardAppearance::Dark)` (в TSX `ios={{ keyboardAppearance: "dark" }}`; или light, по умолчанию) задаёт клавиатуре светлый или тёмный вид независимо от внешнего вида системы, например для тёмного приложения при светлой теме. Клавиатуры Android всегда следуют теме системы.

Автозаполнение (`.auto_fill(AutoFill::Email)`, в TSX `autoComplete`) сообщает системе, что содержит поле, чтобы она могла предложить сохранённые имена, адреса, пароли и одноразовые коды из сообщений. У `AutoFill` в Rust есть вариант для каждого вида (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ... и `Off`). TSX принимает такие значения: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` и другие, а также `"off"`; собственные имена iOS (`"emailAddress"`, `"oneTimeCode"`, ...) тоже принимаются, в `autoComplete` или `ios={{ textContentType }}`.

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## Клавиша return и переход между полями

Тип клавиши return (`.return_key_type(ReturnKeyType::Next)`, в TSX `returnKeyType`) задаёт её подпись: default, done, go, next, search или send. Поведение отправки (`.submit_behavior(..)`, в TSX `submitBehavior`) определяет, что происходит при нажатии:

| Rust | TSX | Return | По умолчанию для |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | вызывает событие отправки, затем поле теряет фокус | однострочных полей |
| `SubmitBehavior::Submit` | `"submit"` | вызывает событие отправки; поле сохраняет фокус | |
| `SubmitBehavior::Newline` | `"newline"` | вставляет перевод строки (только многострочные поля) | многострочных полей |

Многострочное поле с `"submit"` или `"blurAndSubmit"` отправляет по return, как поля ввода в чатах, и при этом переносит строки; на аппаратной клавиатуре (компьютеры, Mac, клавиатура планшета) Shift+Return или Option / Alt+Return вставляет перевод строки. Return, который фиксирует композицию метода ввода (например, китайского или японского), только фиксирует её и никогда не отправляет.

Чтобы перейти к следующему полю, храните ref'ы полей (`element_ref()` и `.element_ref(&r)` в Rust, `ref` в TSX) и вызывайте `focus()`:

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

Отправка без потери фокуса (`SubmitBehavior::Submit`, `submitBehavior="submit"`) в первом поле удерживает клавиатуру на экране, пока фокус переходит, поэтому она не скрывается и не появляется снова. Поле чата, которое отправляет по return и остаётся в фокусе, отправляет так же (см. поле для сообщений [ниже](#content-outside-scroll-views)).

И максимальная длина, и поведение отправки применяются на нативной стороне: платформа спрашивает «можно ли добавить этот символ?» и «должен ли return завершить редактирование?» по ходу набора, а NSH отвечает по свойствам, не дожидаясь JS.

<a id="focus-from-code"></a>

## Фокус из кода

У ref поля ввода есть:

| Rust | TSX | Описание |
|---|---|---|
| `focus()` | `focus()` | Передаёт полю фокус и показывает клавиатуру. |
| `blur()` | `blur()` | Снимает фокус. |
| `set_selection(start, end)` | `setSelection(start, end?)` | Выделяет `start..end` (в единицах UTF-16); каретка, если они равны (TSX: без `end`). |

На macOS и в вебе `focus()` и `blur()` у ref представления, принимающего нажатия, перемещают фокус клавиатуры так же, как Tab ([фокус клавиатуры](../elements/index.md#keyboard-focus)).

`dismiss_keyboard()` в Rust и `Keyboard.dismiss()` из `nsh` в TSX снимают фокус с того поля, в котором он находится:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## Выделение

Событие выделения (`.on_selection_change(..)`, в TSX `onSelectionChange`) сообщает о каретке и выделении; `set_selection` у ref или выделенный диапазон (`.selected_range(..)`, в TSX `selectedRange`) задают их. Позиции измеряются в кодовых единицах UTF-16, как индексы строк в JavaScript, поэтому в TSX `text.slice(start, end)` — это выделенный текст; в Rust делайте срез по единицам UTF-16 текста.

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## Каретка

Событие каретки (`.on_caret_move(..)`, в TSX `onCaretMove`) сообщает, где находится каретка, чтобы то, что относится к ней,
могло открываться рядом: подсказки для упоминания через `@`, меню слэш-команды, выбор эмодзи. `bounds` — это `Bounds`
в поле ввода (`origin` и `size`, с учётом отступов и прокрутки поля), шириной с каретку, как её рисует платформа, и
высотой со свою строку; `pageBounds` — тот же прямоугольник в окне (или в диалоге, где находится поле), который
оверлей принимает как свой `anchor`. Событие приходит, пока поле в фокусе, при каждом перемещении каретки: вместе с
выделением, а также когда текст поля прокручивается или переносится на другие строки. В Rust оверлей размещается
относительно прямоугольника с помощью `.anchor_bounds(..)`.

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` — это положение каретки на момент события: страница, прокручиваемая под полем, двигает поле, но
не посылает события, поэтому закрывайте подсказки при прокрутке или привязывайте их к самому полю.

<a id="pasting-images-and-files"></a>

## Вставка изображений и файлов

Событие вставки (`.on_paste(..)`, в TSX `onPaste`) сообщает, что вставил пользователь — сочетанием клавиш, пунктом меню
«Вставить» или клавиатурой с изображениями: `text`, `html`, `files` и `uris`. `html` — то же содержимое с форматированием, как его скопировал
браузер, офисный пакет или редактор форматированного текста (на Linux и в вебе). `files` — то, что буфер обмена хранил как данные, например
снимок экрана или изображение, скопированное со страницы или из другого приложения: `File`, байты которых приложение может загрузить или показать, с именем
`image.png` (или своим типом). `uris` — это URL `file:` файлов, скопированных в файловом менеджере, как при перетаскивании файла.
Платформа читает буфер обмена в момент вставки и только тогда.

Поле само вставляет вставленный текст, как и всегда: событие приходит раньше `onChange` для этого текста.
Изображения и файлы никогда не вставляются, так как поле хранит текст. Если `pasteBehavior` равно `"report"`, поле ничего
не вставляет, а приложение решает, что делать со вставкой: отправить длинный текст как вложение или вставить очищенную версию.
Поле решает сразу, по свойству, потому что система спрашивает его на месте.

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

Загружайте вставленный файл как любой `File`, с помощью `fetch` и `FormData` (`form.append("image", file)`); его байты остаются
на нативной стороне, пока не будут отправлены. На Android клавиатуры, вставляющие изображения (GIF, стикеры), сообщают о них так же. На
Linux буфер обмена читается асинхронно, поэтому событие может прийти после `onChange` для вставляемого им текста.
Маскированные поля на macOS сохраняют собственную вставку AppKit и ничего не сообщают.

<a id="multiline-inputs-that-grow"></a>

## Растущие многострочные поля

Многострочное поле (`.multiline(true)`, в TSX `multiline`) прокручивает текст внутри своей высоты. Чтобы оно росло вместе с содержимым, передайте высоту из события размера содержимого (`.on_content_size_change(..)`, в TSX `onContentSizeChange`) обратно в его стиль, задав предел:

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

Сообщаемая высота относится к тексту (при ширине поля), поэтому вертикальные отступы добавляйте сами, как выше.
<a id="keeping-inputs-above-the-keyboard"></a>

## Как удерживать поля ввода над клавиатурой

<a id="inside-scroll-views-automatic"></a>

### Внутри прокручиваемых представлений: автоматически

Когда клавиатура появляется над сфокусированным полем ввода, находящимся внутри прокручиваемого представления или списка, NSH задаёт прокручиваемому представлению нижний отступ, равный высоте клавиатуры, и прокручивает поле в область видимости. Это работает нативно и не требует кода. Длинная форма — это просто прокручиваемое представление с полями ввода:

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

Режим скрытия клавиатуры (`.keyboard_dismiss_mode(..)`, в TSX `keyboardDismissMode`: нет, при перетаскивании, интерактивный) позволяет скрывать клавиатуру перетаскиванием формы; обработанные нажатия (`.keyboard_taps(KeyboardTaps::Handled)`, в TSX `keyboardShouldPersistTaps="handled"`) позволяют нажатию на кнопку сработать, пока клавиатура открыта, а не просто скрыть её. См. [Прокрутка](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### Содержимое вне прокручиваемых представлений

На iOS, когда клавиатура закрывает сфокусированное поле ввода, не находящееся ни в одном прокручиваемом представлении, NSH сдвигает содержимое его экрана (или диалога) вверх, пока поле не окажется чуть выше клавиатуры, по кривой анимации клавиатуры, и возвращает обратно, когда клавиатура скрывается или поле теряет фокус, как это делает SwiftUI (на Android окно в режиме `adjustPan` сдвигается системой). Это происходит только для того, что остаётся закрытым при собственной раскладке приложения: приложение, которое само освобождает место, как показано ниже, повторно не сдвигается.

При этом сдвигается вся страница. Панель сообщений, закреплённая внизу экрана, должна подниматься вместе с клавиатурой, а содержимое над ней — сжиматься. Для этого добавьте нижний отступ экрана с помощью CSS `env(keyboard-inset-height)` (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`): он освобождает внизу место, равное высоте клавиатуры, и анимируется нативно вместе с клавиатурой.

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

Отступ (`.pb_keyboard()`) сжимает содержимое выше, а фон при этом доходит до нижнего края экрана; нижний внешний отступ (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) заканчивает всё представление у верхнего края клавиатуры. `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) добавляет длину, например минус высоту панели вкладок под представлением.

Полная высота подходит для представления, которое доходит до нижнего края поверхности, как содержимое экрана. На хосте Android, где окно изменяет размер под клавиатуру, сжимается само окно, а переменная равна 0. См. [Клавиатура](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### Аксессор клавиатуры

`keyboard_height()` и `keyboard_duration()` в Rust, а также `keyboardFrame()` из `nsh` в TSX (`{ height, duration }`) реактивны: они возвращают, насколько клавиатура заходит на поверхность (0, когда она скрыта; нижняя безопасная область под ней включена), и длительность её анимации в миллисекундах. Используйте их для любых нестандартных случаев: скрыть плавающую кнопку во время набора или задать размер панели. Всё, что зависит от них и меняется в том обновлении, в котором начинается движение клавиатуры, перемещается вместе с клавиатурой, по её кривой и с отсчётом времени от начала её движения (`LayoutCurve::Keyboard`), как это делает `env(keyboard-inset-height)`; анимация, которую приложение задаёт для этого обновления (`LayoutAnimation.configureNext`), имеет приоритет.

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## Панель над клавиатурой (iOS): InputAccessoryView

`input_accessory_view(id)` в Rust и `InputAccessoryView` из `nsh/mobile` в TSX показывают панель, прикреплённую к верхнему краю клавиатуры, пока в фокусе находится поле ввода, которое на неё ссылается: это `inputAccessoryView` из iOS. Она нативно движется вместе с клавиатурой, в том числе при интерактивном скрытии. Она не занимает места там, где размещена в дереве; поля ввода ссылаются на неё по её id (`.input_accessory(id)`, в TSX `ios={{ inputAccessoryViewID }}` и `nativeID`):

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

Панель имеет ширину окна и высоту своего содержимого. Аксессуары ввода существуют только в iOS: на Android панель — это пустое скрытое представление, поэтому там эти элементы управления нужно разместить в другом месте, например над полем ввода (`os() == Os::Android` в Rust, `platform.os === "android"` в TSX).

<a id="related"></a>

## См. также

- [`Input`](../elements/input.md): справочник по элементу.
- [Клавиатура](../elements/keyboard.md) и [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [Прокрутка](./scrolling.md#scroll-views-and-the-keyboard): скрытие клавиатуры и нажатия в прокручиваемых представлениях.
