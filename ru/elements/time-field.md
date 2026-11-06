---
title: "TimeField"
description: "Компонент TimeField: время суток, которое редактируется по сегментам (часы, минуты и секунды) с помощью клавиатуры или цифровой клавиатуры телефона и оформляется приложением."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

Поле времени редактирует время суток по сегментам: час, минуту, с `precision="second"` секунду, а с `hourCycle="h12"` — AM или PM. Время напоминания, начало встречи, часы работы магазина. Это то самое время под календарем [DatePicker](./date-picker.md) с `timePrecision`, только отдельно на странице.

Поведение определяет само поле: время (приложения или собственное), какой сегмент редактируют клавиши, ввод и пошаговое изменение цифр, а также то, что слышат пользователи скринридеров. Внешний вид определяет приложение: оно стилизует сегменты и `:` между ними или рисует сегменты самостоятельно.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField` берется из [`nsh/base`](../modules/nsh-base.md) — crate `nsh-base` для Rust. В Rust `time_field()` создает поле с сеттером для каждого свойства (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) и слушателем для каждого события (`.on_change(..)`). Его время — это `TimeOfDay`, то есть `chrono::NaiveTime`.

<a id="value"></a>

## Значение

Значение — это время суток в 24-часовом формате, как у HTML `<input type="time">`: `"HH:MM"` или `"HH:MM:SS"` с `precision="second"`, в зависимости от того, какое `hourCycle` показывает поле. С `value` значением владеет приложение: поле показывает его и сообщает о каждой правке через `onChange({ value })`, а приложение обновляет `value`, чтобы следовать за ней. Если свойство не задано, поле хранит собственное время, сначала из `defaultValue` (по умолчанию `00:00`).

`precision` — наименьшая единица, которую редактирует поле: `"minute"` (по умолчанию) или `"second"`. `hourCycle` определяет, как поле считает часы: `"h23"` (по умолчанию) — от 00 до 23, `"h12"` — от 12 до 11 с сегментом AM/PM после чисел.

<a id="editing"></a>

## Редактирование

Выбран один сегмент, и клавиши редактируют его так же, как поле времени в `gpui-base`:

- Вверх и Вниз изменяют сегмент на единицу и переходят по кругу (с 59 на 00) без переноса в следующий сегмент.
- Цифры вводятся в сегмент по две: цифра, которая не может начинать более длинное значение (`7` в часах), завершает сегмент и переходит к следующему.
- `a` и `p` задают AM и PM.
- Backspace и Delete сбрасывают сегмент.

Нажатие на сегмент выбирает его. Нажатие на выбранный сегмент AM/PM переключает его, так как на телефонах нет клавиш `a` и `p`. Клавиши обрабатывает одно прозрачное нативное текстовое поле за сегментами, как у [OtpInput](./otp-input.md): на телефонах и планшетах оно вызывает цифровую клавиатуру.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | нет | Время, которым владеет приложение. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | Начальное время, без `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | Наименьшая редактируемая единица. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Как поле считает часы; `"h12"` добавляет сегмент AM/PM. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Без фокуса и без редактирования; стили `disabled:` применяются к полю и его сегментам. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют поле. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Каждый сегмент: `focus:` у выбранного, пока поле в фокусе, `disabled:` вместе с полем; с `group` его содержимое следует за ними (`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Каждый `:` между числами. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | нет | Содержимое сегмента, которое приложение рисует по тому, что он показывает; иначе — его подпись. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Поле вокруг своих сегментов (строка). |

`renderSegment` получает `TimeFieldSegmentEntry`: `segment` (`"hour"`, `"minute"`, `"second"` или `"period"`), `value` (час по часам поля, минута или секунда; `0` для AM и `1` для PM) и `label` (две цифры или `AM` / `PM`). Состояние сегмента он не получает никогда: сегмент находится в состоянии `focus:`, пока его редактируют клавиши, и в состоянии `disabled:` вместе с полем, а при `group` в `segmentClass` его содержимое следует за `group-focus:` и `group-disabled:`. Поэтому сегмент перерисовывается, только когда меняется его значение; переходы между сегментами и появление или потеря фокуса ничего не перерисовывают:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Пользователь изменил время: `{ value }`. Задайте `value`, чтобы следовать за ним. `value`, переданное приложением, никогда не сообщается. |

<a id="parts"></a>

## Части

| Часть | Где | Чем стилизуется |
|---|---|---|
| Поле | корень, строка | `class`, `style` |
| Сегмент | поле: час, минута, секунда, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` внутри, под `group` в `segmentClass`) |
| Разделитель | поле, между двумя числами | `separatorClass`, `separatorStyle` |

<a id="keyboard"></a>

## Клавиатура

Tab переводит фокус на поле с выбранным сегментом. Далее:

| Клавиша | Действие |
|---|---|
| Влево / Вправо | Предыдущий или следующий сегмент. |
| Tab / Shift+Tab | Следующий или предыдущий сегмент; Tab из последнего и Shift+Tab из первого выходят из поля. |
| Вверх / Вниз | Изменяет сегмент на единицу по кругу. |
| 0–9 | Вводит цифры в сегмент. |
| A / P | AM или PM. |
| Backspace, Delete | Сбрасывает сегмент. |

<a id="accessibility"></a>

## Доступность

- Поле является текстовым полем с именем из `accessibilityLabel`; скринридеры зачитывают время, которое оно показывает. `disabled` делает его приглушенным.
- На телефонах и планшетах показывается цифровая клавиатура.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).
