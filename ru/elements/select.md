---
title: "Select"
description: "Компонент Select: выбор одного значения из списка элементов, всплывающее окно у триггера на десктопах и нижняя панель на телефонах, с поддержкой клавиатуры, быстрого поиска по набору текста, поиска и разделов, со стилями, задаваемыми приложением."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Select выбирает одно значение из списка элементов: настройку, фильтр, страну, часовой пояс. Список открывается триггером приложения и выглядит так, как ожидает пользователь на каждом устройстве:

- На настольных платформах и в браузерах на десктопе это всплывающее окно поверх триггера. Выбранная строка накладывается на триггер, поэтому выбранный заголовок остаётся на месте (позиция `item-aligned` из shadcn/ui). Окно по ширине равно триггеру (другую ширину задаёт `popupStyle` / `popupClass` приложения, как `menu_width` у `gpui-component`), а по высоте соответствует строкам, но не превышает свободного места на экране. Если ничего не выбрано, список открывается под триггером. Клавиатура перемещается по элементам и выбирает один из них.
- На телефонах и планшетах это нижняя панель (sheet) в нижней части экрана поверх подложки.

Select отвечает за поведение: значение (принадлежащее приложению или собственное), состояние открытости, клавиатуру, typeahead, поиск, секции, подсвеченную строку и то, что озвучивают screen readers. Внешний вид задаёт приложение: оно оформляет триггер, всплывающее окно, список, строки, заголовки секций и поле поиска или рисует строки само.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` поставляется в [`nsh/base`](../modules/nsh-base.md), крейте `nsh-base` в Rust. В Rust `select()` создаёт его с сеттером на каждое свойство (`.items(..)`, `.value(..)`, `.item_style(..)`) и обработчиком на каждое событие (`.on_change(..)`); `SelectItem::new(value, title)` создаёт элемент с `.disabled(..)` и `.group(..)`.

<a id="items"></a>

## Элементы

`items` задаёт список как данные: у каждого элемента есть `value` (уникальное среди элементов: именно оно устанавливается при выборе), `title` (что показывает его строка, с чем сопоставляются поиск и typeahead и что произносят screen readers) и, по желанию, `disabled` и `group`. Соседние элементы с одинаковым `group` образуют секцию под заголовком с этим названием:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

Строки образуют виртуализированный список в прокручиваемой области всплывающего окна: список из тысяч элементов отрисовывает только видимые строки, а окно прокручивается, когда строки выше доступного места.

<a id="value"></a>

## Значение

С `value` выбранным элементом владеет приложение: select показывает элемент с этим значением и сообщает о выборе через `onChange({ value })`; приложение устанавливает `value`, чтобы следовать за выбором, или хранит своё. `value={null}` означает, что ничего не выбрано. Если свойство не задано, select хранит собственное значение, сначала взятое из `defaultValue`. `onChange` сообщает об изменениях: повторный выбор уже выбранного элемента закрывает список.

`cleanable` добавляет кнопку очистки, пока элемент выбран: нажатие очищает значение (о чём сообщает `onChange({ value: null })`), а список остаётся закрытым. Кнопка находится в представлении select после триггера, а не внутри него, поэтому нажатие на неё никогда не открывает список. Приложение размещает её само (поверх конца триггера с помощью `absolute`, там, где был бы шеврон) и наполняет содержимым:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

Триггер — элемент приложения, поэтому он показывает всё, что приложение хочет для выбранного элемента: его название, значок, подсказку, пока ничего не выбрано. В TSX это передаваемый вами элемент: он является combobox и сам принимает нажатия, фокус клавиатуры, состояние раскрытия и `disabled`. Поэтому его собственные классы `active:`, `focus:` и `disabled:` следуют состоянию select, его собственный `onPress` тоже срабатывает, а список размещается относительно него и имеет такую же ширину.

<a id="open-state"></a>

## Состояние открытости

Без `open` select хранит собственное состояние открытости (начальное берётся из `defaultOpen`). С `open` им владеет приложение и изменяет его в `onOpenChange({ open, reason })`: `"triggerPress"` (нажатие на триггер или одна из его клавиш), `"select"` (выбор), `"pressOutside"`, `"backdropPress"` или `"cancel"` (Escape или «назад»). `onOpen` и `onClose` сообщают, когда список показан и когда он скрыт (для нижней панели — после того как она появилась и после того как исчезла), а `onCancel` — что пользователь закрыл список, ничего не выбрав.

<a id="search"></a>

## Поиск

`searchable` добавляет над элементами поле поиска: набранный текст фильтрует их по названию без учёта регистра, а секция без совпадений исчезает вместе со своим заголовком. Подсветка переходит на первое совпадение, клавиши продолжают её перемещать, пока фокус клавиатуры в поле, а Return выбирает подсвеченный элемент. `empty` — то, что показывает список, пока ничего не найдено:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

На настольных платформах поле поиска получает клавиатуру в момент открытия списка; на сенсорных экранах клавиатура появляется при нажатии на поле. Каждое открытие начинается с пустого поиска.

<a id="rows-the-app-draws"></a>

## Строки, которые рисует приложение

`itemClass` оформляет строку каждого элемента, которая показывает название элемента, пока `renderItem` не нарисует её иначе: `focus:` применяется к подсвеченной строке (там, где находятся клавиши или указатель), `selected:` — к выбранной, а `disabled:` — к отключённой. Чтобы нарисовать строку, передайте `renderItem`: он получает описание элемента ([`SelectEntry`](#types)) и возвращает содержимое строки для видимых строк. Состояние строки он никогда не получает: при `group` в `itemClass` содержимое следует состояниям строки через классы `group-focus:`, `group-selected:` и `group-disabled:`, поэтому отрисовка выполняется один раз на элемент, а перемещение подсветки или выбор ничего не перерисовывают. `renderGroup` рисует заголовок секции тем же способом:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Элементы по порядку. |
| `value` | `.value(..)` | `string \| null` | нет | `value` выбранного элемента, которым владеет приложение; `null` — ничего не выбрано. Если не задано, select хранит собственное значение. |
| `defaultValue` | `.default_value(..)` | `string` | нет | Начальное значение, без `value`. |
| `open` | `.open(..)` | `boolean` | нет | Открытость, которой владеет приложение. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Открыт ли список в начале, без `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | Поле поиска над элементами фильтрует их по названию. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | нет | Подсказка поля поиска. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | нет | Как screen readers называют поле поиска: что именно оно ищет. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Кнопка очистки, пока элемент выбран; нажатие очищает значение (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Список остаётся закрытым: триггер не принимает нажатия и фокус клавиатуры, к нему применяются стили `disabled:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как screen readers его называют: о чём этот выбор. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Десктопы: сторона триггера, с которой размещается список; другая сторона — если место есть только там. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Десктопы: как список выравнивается относительно триггера. |
| `offset` | `.offset(..)` | `number` | `0` | Десктопы: зазор между триггером и списком. |
| `margin` | `.margin(..)` | `number` | `0` | Десктопы: расстояние, которое список сохраняет до краёв безопасной области. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Всплывающее окно (десктопы) или нижняя панель (сенсорные экраны), в которых находится список. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Сенсорные экраны: подложка за нижней панелью. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Список — прокручиваемая область со строками. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Строка каждого элемента; её стили текста наследует название: `focus:` при подсветке, `selected:` при выборе, `disabled:`, пока элемент недоступен. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Заголовок каждой секции. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | нет | Поле поиска: его рамка и текст (`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Кнопка очистки (`cleanable`); `disabled:` вместе с select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | нет | Содержимое кнопки очистки: крестик, значок. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | нет | Как screen readers называют кнопку очистки. |
| `trigger` | `.trigger(..)` | `JSX.Element` | нет | То, что открывает список при нажатии; список размещается относительно него. |
| `empty` | `.empty(..)` | `JSX.Element` | нет | Что показывает список, пока нет ни одного элемента (поиск без совпадений). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | нет | Строка элемента, нарисованная приложением по описанию элемента (её состояния — классы строки); иначе — название элемента. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | нет | Заголовок секции, нарисованный приложением; иначе — её название. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Представление вокруг триггера. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Пользователь выбрал другой элемент (нажатие, Return или Space, typeahead на триггере): его `value`; `null`, если значение очистила кнопка очистки. Установите `value`, чтобы следовать за выбором. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Список открылся или закрылся, с указанием причины. Установите `open`, чтобы следовать за изменением. |
| `onOpen` | `.on_open(\|\| ..)` | Список показан; для нижней панели — после её появления. |
| `onClose` | `.on_close(\|\| ..)` | Список скрыт; для нижней панели — после её исчезновения. Также когда его закрыло приложение. |
| `onCancel` | `.on_cancel(\|\| ..)` | Пользователь закрыл список, ничего не выбрав (Escape или «назад», нажатие снаружи или на подложку). |

События приходят в таком порядке: `onChange` при выборе или `onCancel` при закрытии без выбора, затем `onOpenChange`, затем `onOpen` или `onClose`, когда список показан или скрыт.

<a id="types"></a>

<a id="types"></a>

## Типы

| Тип | Поля | Описание |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | Элемент `items`. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (элемента), `index: number` | Что получает `renderItem`: элемент и его индекс среди `items`, но никогда не его состояние (`focus:`, `selected:` и `disabled:` строки). |
| `SelectGroup` | `title: string` | Что получает `renderGroup`: `group` секции. |

В Rust это `nsh_base::SelectItem`, `SelectEntry` и `SelectGroup`; `value` — это `SelectValue` (`Controlled(Some(..))` для значения, `Controlled(None)` для `null`), который `.value(..)` создаёт из `Option<SharedString>` или строки.

<a id="parts"></a>

## Части

| Часть | Где находится | Чем оформляется |
|---|---|---|
| Триггер | представление select | собственный элемент приложения (`trigger`) |
| Кнопка очистки | представление select, после триггера (`cleanable`, пока элемент выбран) | `clearButtonClass`, `clearButtonStyle`; её содержимое — `clearButton` |
| Всплывающее окно или нижняя панель | поверх всего, у триггера (десктопы) или внизу (сенсорные экраны) | `popupClass`, `popupStyle` |
| Подложка | за нижней панелью (сенсорные экраны) | `backdropClass`, `backdropStyle` |
| Поле поиска | всплывающее окно, первым (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| Список | всплывающее окно, после поля поиска | `listClass`, `listStyle` |
| Заголовок секции | список, перед её элементами | `groupClass`, `groupStyle`, `renderGroup` |
| Строка элемента | список | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` внутри, под `group` в `itemClass`) |
| Пустое состояние | всплывающее окно, пока ни один элемент не показан | собственный элемент (`empty`) |

Всплывающее окно — это колонка: её высота зависит от поля поиска и строк, поэтому `max-h-*` на `popupClass` ограничивает её, а список прокручивается внутри.

<a id="keyboard"></a>

## Клавиатура

На настольных платформах Tab переводит фокус на триггер select, который не `disabled`. Когда список закрыт, Down, Up, Return и Space открывают его на выбранном элементе (если ничего не выбрано, Up открывает на последнем доступном элементе, а остальные клавиши — на первом), а буквы и цифры выбирают элемент, название которого начинается с набранного, как это делает нативный select. Когда список открыт:

| Клавиша | Действие |
|---|---|
| Down, Up | Следующий или предыдущий доступный элемент, по кругу. |
| Home, End | Первый или последний доступный элемент (собственные действия поля поиска, пока в нём фокус клавиатуры). |
| Page Down, Page Up | На страницу строк вперёд или назад. |
| Return | Выбирает подсвеченный элемент и закрывает список. |
| Space | Выбирает подсвеченный элемент (без поля поиска). |
| Буквы, цифры | Следующий элемент, название которого начинается с набранного за последнюю секунду (без поля поиска). |
| Escape | Закрывает список без выбора. |

После закрытия списка фокус клавиатуры возвращается на триггер, если только нажатие снаружи не перенесло его в другое место. Указатель подсвечивает строку, над которой проходит; подсвеченная строка прокручивается в видимую область при перемещении к ней клавишами.

<a id="on-each-device"></a>

## На каждом устройстве

| | Десктопы и браузеры на десктопе | Телефоны и планшеты |
| --- | --- | --- |
| Список | всплывающее окно поверх триггера, выбранная строка — на нём (под ним, если ничего не выбрано), по ширине равно триггеру, если только `popupStyle` не задаёт ширину, по высоте соответствует строкам, но не больше свободного места на экране | нижняя панель внизу поверх подложки, по высоте соответствует строкам, но не выше строки состояния |
| Закрытие | выбор, Escape, нажатие снаружи (оно передаётся дальше тому, что находится под указателем) | выбор, подложка, кнопка «назад» на Android |
| Поиск | поле получает клавиатуру при открытии списка | клавиатура появляется при нажатии на поле |
| Выбор | выбирает нажатие в момент опускания, поэтому поле поиска сохраняет клавиатуру | касание |

`popupClass` оформляет всплывающее окно на десктопах и нижнюю панель на телефонах; стиль, различающийся между ними, может сравнивать `platform.idiom` (`nsh/device`) с `"desktop"`.
<a id="accessibility"></a>

## Доступность

- Для программ чтения с экрана триггер является комбинированным списком (combobox): его метка — `accessibilityLabel`, его значение — название выбранного элемента, а также он сообщает, раскрыт ли список. `disabled` делает его приглушённым.
- Кнопка очистки — это кнопка с именем `clearButtonAccessibilityLabel`; она не является остановкой при навигации клавишей Tab.
- Поле поиска — это текстовое поле с именем `searchAccessibilityLabel`; его плейсхолдер — подсказка, которая отображается, пока поле пусто.
- Список — это listbox, а каждая строка — option с именем, соответствующим её названию; выбранный вариант отмечен как выбранный, а отключённый приглушён. Заголовки секций являются заголовками.
- Когда клавиши перемещают выделение, фокус программы чтения с экрана переходит на выделенную строку; пока клавиатурой управляет поле поиска, вместо этого озвучивается название выделенного элемента, чтобы ввод текста можно было продолжать.

Общие сведения о метках, ролях и озвучивании см. в разделе [Accessibility](../docs/accessibility.md).
