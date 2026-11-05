---
title: "DatePicker"
description: "Компонент DatePicker: дата, диапазон дат или дата и время, выбираемые в календаре во всплывающем окне у элемента-триггера на компьютерах и в нижней панели на телефонах, с оформлением, которое задаёт приложение."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

Date picker задаёт дату из [Calendar](./calendar.md), который открывается от триггера приложения: срок выполнения, день рождения, с `range` — дни поездки, с `timePrecision` — дата и время суток. Как и [Select](./select.md), он открывается так, как ожидает каждое устройство:

- На десктопах и в десктопных браузерах — всплывающее окно у триггера; при открытии клавиатура попадает на дни.
- На телефонах и планшетах — панель внизу экрана поверх затемнения.

Поведением управляет пикер: значение (приложения или собственное), состояние открытия, календарь, время, пресеты, клавиатура и то, что слышат скринридеры. Внешний вид остаётся за приложением: оно рисует триггер (со значением, плейсхолдером, иконкой) и стилизует всплывающее окно, части календаря, пресеты и поле времени.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker` поставляется из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` на Rust. В Rust `date_picker()` создаёт его с сеттером на каждое свойство (`.value(..)`, `.range(..)`, `.time_precision(..)`) и слушателем на каждое событие (`.on_change(..)`). Его значение — `DateTime` (`DateTime::Single`, `DateTime::Range`, из `chrono` дат или дат со временем); `onChange` возвращает `PickedDate` — значение с точностью времени пикера.

<a id="value"></a>

## Значение

Значение имеет формы HTML-инпутов: дата ISO, `"2026-10-28"`, как у `<input type="date">`; с `range` — `[start, end]`; с `timePrecision` — дата и время, `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` при секундах), как у `<input type="datetime-local">`; `null` — отсутствие значения. С `value` значением владеет приложение: пикер показывает его и сообщает о каждом изменении через `onChange({ value })`; приложение задаёт `value`, чтобы следовать за ним. Если значение не указано, пикер хранит собственное, сначала из `defaultValue`.

- Одна дата: нажатие на день задаёт значение и закрывает всплывающее окно.
- С `range` первое нажатие начинает диапазон, а второе завершает его, как в [календаре](./calendar.md#value); полный диапазон задаёт значение и закрывает окно.
- С `timePrecision` (только для одной даты) под календарём показывается поле времени, и о каждом изменении времени сообщается. На десктопах выбор дня оставляет окно открытым для ввода времени и сообщает дату вместе со временем; повторное нажатие на выбранный день закрывает окно. На телефонах и планшетах касание дня выбирает его с текущим временем и закрывает панель, как при выборе одной даты; для ввода времени панель открывается снова. День, выбранный до того, как задано время, получает `defaultTime` (по умолчанию `00:00`). `hourCycle` — то, как поле считает часы.

`cleanable` добавляет кнопку очистки, пока есть значение: нажатие очищает его (`onChange({ value: null })`). Она идёт после триггера, а не внутри него, поэтому нажатие на неё никогда не открывает окно; приложение размещает её и наполняет (`clearButton`), как [кнопку очистки в Select](./select.md#value).

<a id="presets"></a>

## Пресеты

`presets` — кнопки рядом с календарём, задающие значение: «Сегодня», «Последние 7 дней», «Завтра в 9». Каждый из них — `{ label, value }`, `value` дату, диапазон или даты со временем, которые хранятся как заданы; нажатие задаёт значение и закрывает окно. `contentClass` раскладывает колонку пресетов и календарь со временем (строка, `flex-row`); `presetsClass` стилизует колонку, `presetClass` — каждую кнопку.

<a id="the-calendar"></a>

## Календарь

Каждое свойство [Calendar](./calendar.md), кроме его значения, передаётся пикеру: `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, части (от `headerClass` до `itemStyle`) и `renderItem`. `calendarClass` и `calendarStyle` стилизуют сам календарь. Его представления и клавиши такие же, как у календаря.

Строка времени (`timeClass`, `timeStyle`) содержит в начале `timeLabel` — слова приложения для него («Время»), а в конце — поле времени (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`): строку с элементами, выровненными по центру и разнесёнными по краям (`flex-row items-center justify-between`, как у `gpui-component`). Сегменты поля — это сегменты [TimeField](./time-field.md) (`segmentClass`, `separatorClass`, `renderSegment`).

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | нет | Значение, которым владеет приложение. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | Начальное значение, без `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Выбор диапазона дат. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | Состояние открытия: приложения или самого пикера. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Остаётся закрытым, не принимает нажатий и фокуса клавиатуры. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как его называют скринридеры. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` и время | Как скринридеры озвучивают значение, в формате `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | нет | Редактировать и время суток, с точностью до этого значения. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Как поле времени считает часы. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | Время, которое получает дата, пока пользователь его не задал. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Кнопка очистки, пока есть значение. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | Кнопки в окне, задающие значение. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | как у `Calendar` | как у `Calendar` | как у `Calendar` | Месяцы, недели, отключённые даты и годы календаря. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | как у `Calendar` | `string` | нет | Что говорят скринридеры для кнопок календаря «Предыдущий» и «Следующий». |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | как у `Select` | `"bottom"`, `"start"`, 0, 0 | Десктопы: где окно располагается относительно триггера. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Всплывающее окно (десктопы) или панель (сенсорные экраны). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Затемнение за панелью. |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Содержимое окна: пресеты рядом с календарём и время. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Колонка пресетов. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Кнопка каждого пресета. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Календарь. |
| `headerClass` … `itemStyle` | как у `Calendar` | как у `Calendar` | нет | Заголовок, тело, месяцы, строки и элементы календаря. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | нет | Каждый элемент календаря, который рисует приложение по тому, чем он является; его состояния — классы элементов, как у `Calendar`. |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Строка времени: подпись в начале, поле в конце. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | нет | Что строка времени показывает перед полем. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Поле времени. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | нет | Как скринридеры называют поле времени. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | как у `TimeField` | как у `TimeField` | нет | Сегменты поля времени и `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Кнопка очистки (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | нет | Содержимое кнопки очистки. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | нет | Как скринридеры называют кнопку очистки. |
| `trigger` | `.trigger(..)` | `JSX.Element` | нет | Что открывает окно при нажатии; окно размещается относительно него. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Представление вокруг триггера. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Значение изменилось (день, конец диапазона, пресет, время, кнопка очистки): `{ value }`. Задайте `value`, чтобы следовать за ним. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Окно открылось или закрылось, с указанием причины (`{ open, reason }`). Задайте `open`, чтобы следовать за ним. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | Окно показано или исчезло. |
| `onCancel` | `.on_cancel(..)` | Пользователь закрыл окно, ничего не выбрав (Escape или «назад», нажатие снаружи или на затемнение). |

<a id="parts"></a>

## Части

| Часть | Где | Стилизуется через |
|---|---|---|
| Триггер | представление пикера | собственный элемент приложения (`trigger`) |
| Кнопка очистки | представление пикера, после триггера (`cleanable`, пока есть значение) | `clearButtonClass`, `clearButtonStyle`; её содержимое — `clearButton` |
| Всплывающее окно или панель | поверх всего, у триггера (десктопы) или внизу (сенсорные экраны) | `popupClass`, `popupStyle` |
| Затемнение | за панелью (сенсорные экраны) | `backdropClass`, `backdropStyle` |
| Содержимое | всплывающее окно | `contentClass`, `contentStyle` |
| Пресеты | содержимое, первыми (`presets`) | `presetsClass`, `presetsStyle`; каждый — `presetClass`, `presetStyle` |
| Календарь | содержимое | `calendarClass`, `calendarStyle` и части [Calendar](./calendar.md#parts) |
| Строка времени | под календарём (`timePrecision`) | `timeClass`, `timeStyle`; её подпись — `timeLabel` |
| Поле времени | строка времени | `timeFieldClass`, `timeFieldStyle` и части [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## Клавиатура

| Клавиша | Действие |
|---|---|
| Return (на триггере) | Открывает окно или закрывает его. |
| Delete, Backspace (на триггере) | Очищает значение, пока окно закрыто. |
| Escape | Закрывает окно без выбора. |

В окне клавиши календаря перемещаются между днями и выбирают день (см. [Клавиатура](./calendar.md#keyboard)), а клавиши поля времени редактируют время (см. [Клавиатура](./time-field.md#keyboard)).

<a id="accessibility"></a>

## Доступность

- Для скринридеров триггер — combobox: его подпись — `accessibilityLabel`, его значение — дата в том виде, как её записывает `dateFormat` (по умолчанию `2026/10/28`, со временем при `timePrecision`), и он сообщает, развёрнуто ли окно. `disabled` приглушает его.
- Дни календаря — кнопки, названные по их датам ISO (см. [Доступность](./calendar.md#accessibility)); пресеты — кнопки, названные по их подписям; поле времени названо через `timeAccessibilityLabel`.
- Кнопка очистки — кнопка, названная через `clearButtonAccessibilityLabel`.

О подписях, ролях и объявлениях в целом см. [Доступность](../docs/accessibility.md).
