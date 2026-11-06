---
title: "Calendar"
description: "Компонент Calendar: выбор даты или диапазона дат из месяцев с днями, с представлениями месяца и года и поддержкой клавиатуры, стилизуемый приложением."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

Calendar выбирает дату или, с `range`, диапазон дат из месяцев, разложенных по неделям: срок в форме, ночи проживания, дни отчёта. Он показывает один месяц или несколько рядом, листает месяцы кнопками «Назад» и «Вперёд» и переключается на вид месяцев года или страницу лет, чтобы перейти далеко. Это тот же календарь, что во всплывающем окне [DatePicker](./date-picker.md), только отдельно на странице.

Календарь отвечает за поведение: значение (принадлежащее приложению или собственное), показанный месяц, виды, дни, которые нельзя выбрать, клавиатуру и то, что слышат скринридеры. Внешний вид задаёт приложение: оно стилизует заголовок, тело, каждый месяц, каждую строку и каждый элемент и рисует содержимое элементов (названия месяцев и дней недели, отметку сегодняшнего дня, полосу диапазона). Сетка занимает всю отведённую ей ширину, как столбцы таблицы: месяцы делят её между собой, а элементы строки делят строку поровну. Поэтому календарь в шторке телефона растягивается на весь экран, а календарь во всплывающем окне, размер которого определяется содержимым, сохраняет ширину своих элементов (`flex-none` в `itemClass` или `monthClass` оставляет элементу или месяцу его собственную ширину).

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` поставляется из [`nsh/base`](../modules/nsh-base.md) — крейта `nsh-base` для Rust. В Rust `calendar()` создаёт его с сеттером для каждого свойства (`.value(..)`, `.range(..)`, `.number_of_months(..)`) и слушателем для каждого события (`.on_change(..)`). Его значение — `Date` (`Date::Single`, `Date::Range`, из `chrono::NaiveDate` или пары таких значений), а отключаемые им дни — `Matcher`.

<a id="value"></a>

## Значение

Значение — это ISO-дата `"2026-10-28"`, как у HTML `<input type="date">`; с `range` это `[start, end]`, а `null` означает отсутствие даты. С `value` значением владеет приложение: календарь показывает его как выбранное и сообщает о выборе через `onChange({ value })`; чтобы следовать за выбором, приложение задаёт `value`. Если свойство не указано, календарь хранит собственное значение, вначале берёт его из `defaultValue`.

`onChange` сообщает только о полных значениях, как `Selected` у `gpui-base`: о нажатом дне или о конце диапазона.

- Без `range` нажатие на день выбирает его.
- С `range` первое нажатие начинает диапазон, а второе завершает его; дни между ними входят в диапазон (каждый `selected`, включая концы, см. [Элементы](#items)). Второе нажатие на более ранний день начинает диапазон заново с него, так же как и нажатие после того, как диапазон завершён. Неполный диапазон отображается, пока не будет завершён, и только тогда о нём сообщается.

Календарь открывается на месяце значения (для диапазона — на месяце его начала), а если значения нет — на текущем месяце.

<a id="months-and-views"></a>

## Месяцы и виды

`numberOfMonths` показывает столько месяцев рядом, начиная с показанного; «Назад» и «Вперёд» листают их по одному месяцу. `firstDayOfWeek` — день, с которого начинаются недели: от `0` (воскресенье, по умолчанию) до `6` (суббота).

В заголовке находятся «Назад», два переключателя и «Вперёд»:

- Вид дней показывает дни месяцев: каждый месяц — это столбец из строки дней недели и строк недель; дни предыдущего и следующего месяцев заполняют недели (`outside`, `data-outside`).
- Переключатель месяца (`monthToggle`) открывает вид месяцев: двенадцать месяцев по три в строке. Выбранный месяц показывается в виде дней.
- Переключатель года (`yearToggle`) открывает вид лет: страницу из 20 лет по пять в строке, «Назад» и «Вперёд» листают страницы. Выбранный год показывается в виде дней. `yearRange` — годы, по которым идут страницы, `[start, end)` (по умолчанию: от 50 лет до текущего года до 50 лет после него).

Если месяцев несколько, вместо переключателей заголовок показывает название каждого месяца (элемент `monthToggle`, не принимающий нажатий), как у `gpui-base`.

<a id="disabled-dates"></a>

## Недоступные даты

`disabledMatcher` — это дни, которые пользователь не может выбрать, `Matcher` у `gpui-base`, в одной из четырёх форм:

| Форма | Что отключает |
|---|---|
| `[0, 6]` | Указанные дни недели, `0` — воскресенье, `6` — суббота. |
| `{ before, after }` | Дни до `before` и после `after` (любую границу можно опустить). |
| `{ from, to }` | Дни от `from` до `to` включительно (опущенная граница означает открытый конец). |
| `(date) => boolean` | Дни, для которых функция возвращает `true`, получив ISO-дату каждого показанного дня. |

Функция вызывается один раз для каждого показанного дня, в следующем такте JS, и повторно для дня, на который уже ответила, не вызывается: при листании месяцев она запрашивается только для новых дней, поэтому её ответ должен быть чистой функцией даты. Если передать другую функцию, она будет вызвана заново. Недоступный день — `disabled:`: он не принимает нажатий, а Return и Space его не выбирают.

<a id="items"></a>

## Элементы

Каждая цель нажатия и каждая подпись календаря — это элемент: «Назад», переключатели, «Вперёд», дни недели, дни, месяцы и годы. Каждый рисуется в части, стилизуемой через `itemClass` и `itemStyle`, а её варианты следуют состоянию элемента:

| Вариант | Элемент |
|---|---|
| `selected:` | Выбран: дата, каждый день полного диапазона (включая концы, как в range calendar из React Aria), начало неполного диапазона, показанный месяц или год, переключатель открытого вида. Скринридеры озвучивают его как выбранный. |
| `disabled:` | Не принимает нажатий: недоступная дата, день недели, название месяца, «Назад» и «Вперёд» в виде месяцев или на границах лет. |
| `focus:` | Имеет фокус клавиатуры. |
| `data-range-start:`, `data-range-end:` | Первый или последний день полного диапазона (диапазон из одного дня — и тот и другой). |
| `data-range-middle:` | День внутри полного диапазона, не его конец. |
| `data-today:` | Сегодняшний день. |
| `data-outside:` | День предыдущего или следующего месяца, заполняющий недели. |

Варианты `data-*` — это варианты Tailwind (`data-range-start:` соответствует `[data-range-start]`), так же как календарь shadcn стилизует свои дни; при `group` в `itemClass` содержимое следует им с помощью `group-selected:`, `group-data-range-middle:` и так далее. `selected:` означает каждый день диапазона, поэтому концы диапазона получают свой вид поверх него (побеждают более поздние варианты: `data-*` идёт после `selected:`), а средние дни — свой:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` рисует содержимое элемента по тому, чем он является, `CalendarEntry`, и никогда по его состоянию: отрисовка выполняется один раз и сохраняется, пока элемент выбран, находится в фокусе или входит в диапазон, поэтому клавиши, выбор и фокус ничего не перерисовывают, а при листании месяцев каждый новый день рисуется по одному разу (день сохраняет свою отрисовку по месяцу и дате: при нескольких месяцах те, что остаются на экране, сохраняют свою).

| Поле | Значение |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` или `"year"`. |
| `value` | Его номер: день месяца, месяц (от 1 до 12), год, день недели (от `0` — воскресенье до `6`); `0` для «Назад» и «Вперёд». |
| `date` | ISO-дата дня. |
| `year`, `month` | Год и месяц, которым он принадлежит: у дня — месяц, в чьих неделях он показан; у переключателя месяца или названия месяца — свои; у месяца в виде месяцев — свои; у переключателя года и у года — собственный год. `0` для «Назад», «Вперёд» и дней недели (и `month` для переключателя года и лет). |
| `today` | День является сегодняшним. |
| `outside` | День относится к предыдущему или следующему месяцу. |

Без `renderItem` элемент показывает свой номер, а «Назад» и «Вперёд» показывают `‹` и `›`, как у `gpui-base`; день недели тоже показывает свой номер, от `0` до `6`, поскольку названия месяцев и дней недели — слова приложения на языке приложения.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | нет | Значение, которым владеет приложение. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | Начальное значение, без `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Выбор диапазона: первое нажатие начинает его, второе завершает. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | Сколько месяцев показывается рядом. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | День, с которого начинаются недели: от `0` (воскресенье) до `6` (суббота). |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | нет | Даты, которые нельзя выбрать. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 50 лет в обе стороны | Годы, по которым листает вид лет, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | нет | Что скринридеры произносят для «Назад». |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | нет | Что скринридеры произносят для «Вперёд». |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Заголовок: «Назад», переключатели (или названия месяцев), «Вперёд». |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Тело: месяцы рядом или строки вида месяцев либо лет. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Каждый месяц вида дней. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Каждая строка: дни недели, неделя, строка месяцев или лет. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Каждый элемент: `selected:`, `disabled:`, `focus:`; у дня — `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([Элементы](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | нет | Содержимое элемента, которое приложение рисует по тому, чем является элемент; иначе — его номер. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Календарь: заголовок над телом. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Пользователь выбрал полное значение: `{ value }`, день или диапазон. Задайте `value`, чтобы следовать за ним. О `value`, переданном приложением, никогда не сообщается. |

<a id="parts"></a>

## Части

| Часть | Где находится | Стилизуется через |
|---|---|---|
| Календарь | корень | `class`, `style` |
| Заголовок | в календаре, первым | `headerClass`, `headerStyle` |
| Тело | в календаре, после заголовка | `bodyClass`, `bodyStyle` |
| Месяц | в теле (вид дней) | `monthClass`, `monthStyle` |
| Строка | в месяце или в теле (виды месяцев и лет) | `rowClass`, `rowStyle` |
| Элемент | в заголовке и строках | `itemClass`, `itemStyle`, `renderItem` (внутри `group-selected:`, `group-data-range-middle:`, ... под `group` в `itemClass`) |

<a id="keyboard"></a>

## Клавиатура

Дни образуют одну остановку Tab: фокус попадает на выбранный день, иначе на сегодняшний, иначе на первый показанный день. Далее:

| Клавиша | Действие |
|---|---|
| Left / Right | День до или после. |
| Up / Down | Тот же день неделей раньше или позже. |
| Home / End | Первый или последний день недели. |
| Page Up / Page Down | Тот же день месяцем раньше или позже. |
| Shift+Page Up / Shift+Page Down | Тот же день годом раньше или позже. |
| Return, Space | Выбирает день. |

В раскладке справа налево недели идут справа, поэтому Left — это следующий день, а Right — предыдущий; Up и Down сохраняют недели. При выходе за пределы показанных месяцев они листаются. «Назад», переключатели, «Вперёд», месяцы и годы принимают нажатия.
В `gpui-base` дни принимают только нажатия; клавиши — это клавиши NSH, по образцу диалога выбора даты из WAI-ARIA.

<a id="accessibility"></a>

## Доступность

- Каждый день — это кнопка, названная по его ISO-дате; она выбрана, пока это дата или день диапазона (включая концы, как в range calendar из React Aria), и затемнена, пока недоступна.
- «Назад» и «Вперёд» — это кнопки с названиями `previousAccessibilityLabel` и `nextAccessibilityLabel`; переключатели, месяцы и годы — кнопки, названные по тому, что они показывают.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Доступность](../docs/accessibility.md).
