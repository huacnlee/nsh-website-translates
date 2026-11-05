---
title: "Combobox"
description: "Компонент Combobox: одно или несколько значений, выбираемых из списка элементов, который фильтруется по мере ввода в поле; на компьютерах список открывается во всплывающем окне под полем, на телефонах — в нижней панели, а внешний вид задаётся приложением."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Combobox выбирает значения из списка элементов: одно или, с `multiple`, несколько. Например, теги записи, участников канала, языки документа. Его триггер — поле ввода: набор текста открывает список и фильтрует его, как это делает combobox в shadcn/ui. Это родственник [Select](./select.md), и список у них общий, но показывается так, как ожидает каждое устройство:

- На десктопах и в браузерах для десктопов это всплывающее окно под полем, такой же ширины, как поле (другую ширину задают `popupStyle` / `popupClass` приложения), и такой высоты, какую занимают строки, в пределах свободного места рядом.
- На телефонах и планшетах это панель в нижней части экрана поверх фона-подложки.

Combobox отвечает за поведение: значение (приложения или собственное), состояние открытия, клавиатуру, поиск, секции, подсвеченную строку и то, что слышат пользователи скринридеров. С `multiple` выбор переключает элемент в значении, а список остаётся открытым, так что несколько элементов выбираются за один раз. Внешний вид определяет приложение: оно оформляет поле, всплывающее окно, список, строки, заголовки секций, поле ввода и нижний блок или само рисует строки.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` поставляется из [`nsh/base`](../modules/nsh-base.md), crate `nsh-base` на Rust. В Rust `combobox()` создаёт его с сеттером для каждого свойства (`.items(..)`, `.value(..)`, `.multiple(..)`) и слушателем для каждого события (`.on_change(..)`). Его элементы такие же, как у `Select`: `SelectItem::new(value, title)` с `.disabled(..)` и `.group(..)`, в секциях, как у Select (см. [Элементы](./select.md#items)).

<a id="value"></a>

## Значение

Значение — это массив значений выбранных элементов. С `value` им владеет приложение: combobox показывает эти элементы выбранными и сообщает о каждом изменении через `onChange({ value })`; приложение устанавливает `value`, чтобы следовать за ним, или хранит своё. Если свойство опущено, combobox хранит собственное значение, сначала берётся из `defaultValue`.

- С `multiple` нажатие, Return или Space переключает подсвеченный элемент: включает в значение, если его там не было, и убирает, если был. Список остаётся открытым.
- Без него выбор заменяет значение значением этого элемента и закрывает список; повторный выбор уже выбранного элемента только закрывает список.

`onConfirm({ value })` сообщает значение при закрытии списка: один раз за открытие, как бы он ни закрылся (выбор, Escape, нажатие снаружи, кнопка-триггер), со значением в том виде, в каком его оставил пользователь. Cmd+Return на Mac (Ctrl+Return на других платформах) закрывает список и подтверждает выбор.

`cleanable` добавляет кнопку очистки, пока выбран хотя бы один элемент: нажатие опустошает значение (`onChange({ value: [] })`). Кнопка находится после поля ввода и перед кнопкой-триггером; нажатие на неё никогда не открывает список. Содержимое задаёт приложение, как у [кнопки очистки в Select](./select.md#value).

<a id="input"></a>

## Поле ввода

Триггер — это текстовое поле в строке combobox (её `class` и `style`: рамка и заливка поля), перед которым находится `prefix` приложения (выбранные элементы в виде чипов, иконка), а после него — кнопка очистки, `triggerButton` приложения (шеврон) и `suffix`.

- Набор текста открывает список и фильтрует элементы по заголовку без учёта регистра; пока ничего не найдено, показывается `empty`. Стрелки вниз и вверх тоже открывают список, нажатие на кнопку-триггер открывает и закрывает его, а на сенсорных экранах его открывает касание поля ввода.
- При одном значении поле ввода показывает заголовок выбранного элемента (`placeholder`, пока выбора нет). При получении фокуса текст в поле выделяется, поэтому набранное заменяет его.
- С `multiple` поле ввода показывает запрос; выбранные элементы показывает приложение, в `prefix` или рядом с combobox.

Запрос принадлежит самому combobox и при каждом открытии начинается с `defaultQuery` (иначе пустой) либо принадлежит приложению с `query`: `onQueryChange({ query })` сообщает набранный текст, а приложение устанавливает `query`, чтобы следовать за ним, фильтровать по-своему или предлагать начальную точку.

<a id="footer"></a>

## Нижний блок

`footer` — это содержимое под строками, в отдельной части (`footerClass`, `footerStyle`): действие («Управление тегами»), счётчик, подсказка. Он остаётся на месте, пока строки прокручиваются.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Элементы по порядку. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Выбор переключает элемент в значении, а список остаётся открытым. |
| `value` | `.value(..)` | `string[]` | нет | Значения выбранных элементов, которыми владеет приложение. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | Начальное значение, без `value`. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | Состояние открытия: приложения или собственное состояние combobox. |
| `placeholder` | `.placeholder(..)` | `string` | нет | Плейсхолдер поля ввода, пока оно пусто. |
| `query` | `.query(..)` | `string` | нет | Запрос, которым владеет приложение. |
| `defaultQuery` | `.default_query(..)` | `string` | нет | Запрос, с которого начинается каждое открытие, без `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Кнопка очистки, пока выбран хотя бы один элемент; нажатие опустошает значение. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Остаётся закрытым, не принимает нажатий и фокуса клавиатуры. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | О чём этот выбор, для скринридеров. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | как у `Select` | `"bottom"`, `"start"`, 0, 0 | Десктопы: где находится всплывающее окно относительно поля. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Всплывающее окно (десктопы) или панель (сенсорные экраны). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Фон-подложка за панелью. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Список, прокручиваемая область со строками. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Строка каждого элемента: `focus:`, пока она подсвечена, `selected:`, пока выбрана, `disabled:`, пока её нельзя выбрать. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Заголовок каждой секции. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | нет | Поле ввода: `focus:`, пока в нём редактируют текст, `disabled:` вместе с combobox. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Нижний блок под строками. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Кнопка очистки (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | нет | Содержимое кнопки очистки. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | нет | Как скринридеры называют кнопку очистки. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | нет | Кнопка после поля ввода (шеврон): нажатие открывает и закрывает список. |
| `prefix` | `.prefix(..)` | `JSX.Element` | нет | Содержимое перед полем ввода: чипы, иконка. |
| `suffix` | `.suffix(..)` | `JSX.Element` | нет | Содержимое после кнопки-триггера. |
| `empty` | `.empty(..)` | `JSX.Element` | нет | Что показывает список, пока нет ни одного элемента. |
| `footer` | `.footer(..)` | `JSX.Element` | нет | Что показывается под строками. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | нет | Строка элемента, которую рисует приложение по тому, чем является элемент, но не по его состоянию: содержимое следует за `group-focus:`, `group-selected:` и `group-disabled:` строки (`group` в `itemClass`), поэтому перемещение подсветки или переключение ничего не перерисовывает; в остальных случаях показывается заголовок элемента. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | нет | Заголовок секции, который рисует приложение; в остальных случаях показывается её название. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Поле: строка из префикса, поля ввода, кнопок и суффикса; список имеет такую же ширину. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Значение изменилось (выбор, переключение, кнопка очистки): `{ value }`, значения выбранных элементов. Установите `value`, чтобы следовать за ним. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | Список закрылся: `{ value }` в том виде, в каком оно есть на этот момент, один раз за открытие. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | Пользователь набрал текст в поле ввода: `{ query }`. Установите `query`, чтобы следовать за ним. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Список открылся или закрылся, с указанием причины (`{ open, reason }`). Установите `open`, чтобы следовать за ним. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | Список показан или исчез. |
| `onCancel` | `.on_cancel(..)` | Пользователь закрыл список без выбора, закрывающего его (Escape или «назад», нажатие снаружи или на фон-подложку). |

События приходят в таком порядке: `onChange` при выборе или `onCancel` при закрытии без выбора, затем `onOpenChange`, затем `onConfirm` при закрытии списка, затем `onOpen` или `onClose`, когда список показан или исчез.

<a id="parts"></a>

## Части

| Часть | Где | Стилизуется через |
|---|---|---|
| Поле | представление combobox, строка | `class`, `style` |
| Префикс | поле, первым | собственный элемент приложения (`prefix`) |
| Поле ввода | поле, после префикса | `inputClass`, `inputStyle`, `placeholder` |
| Кнопка очистки | поле, после поля ввода (`cleanable`, пока выбран хотя бы один элемент) | `clearButtonClass`, `clearButtonStyle`; её содержимое `clearButton` |
| Кнопка-триггер | поле, после кнопки очистки | собственный элемент приложения (`triggerButton`) |
| Суффикс | поле, последним | собственный элемент приложения (`suffix`) |
| Всплывающее окно или панель | поверх всего, под полем (десктопы) или внизу (сенсорные экраны) | `popupClass`, `popupStyle` |
| Фон-подложка | за панелью (сенсорные экраны) | `backdropClass`, `backdropStyle` |
| Список | всплывающее окно | `listClass`, `listStyle` |
| Заголовок секции | список, перед её элементами | `groupClass`, `groupStyle`, `renderGroup` |
| Строка элемента | список | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` внутри, под `group` в `itemClass`) |
| Пустое состояние | всплывающее окно, пока нет ни одного элемента | собственный элемент (`empty`) |
| Нижний блок | всплывающее окно, последним | `footerClass`, `footerStyle`; его содержимое `footer` |

<a id="keyboard"></a>

## Клавиатура

Клавиши такие же, как у Select (см. [Клавиатура](./select.md#keyboard)), пока фокус остаётся в поле ввода, со следующими отличиями: буквы и цифры вводятся в поле ввода и фильтруют список, а не работают как быстрый поиск по первым буквам; стрелки вниз и вверх открывают закрытый список; Return с `multiple` переключает подсвеченный элемент и оставляет список открытым; Cmd+Return на Mac (Ctrl+Return на других платформах) закрывает его и подтверждает выбор. Когда список закрывается на десктопах, фокус остаётся в поле ввода.

<a id="accessibility"></a>

## Доступность

- Для скринридеров поле ввода является combobox: его метка — `accessibilityLabel`, его значение — заголовки выбранных элементов через запятую, и оно сообщает, развёрнут ли список. `disabled` делает его неактивным.
- Список является listbox, а каждая строка — option с именем, равным её заголовку; выбранные варианты отмечены как выбранные, а отключённый показан неактивным. Заголовки секций являются заголовками.
- Кнопка очистки — это кнопка с именем `clearButtonAccessibilityLabel`; она не является остановкой при навигации клавишей Tab. Кнопка-триггер скрыта от скринридеров, так как поле ввода сообщает, открыт ли список, и тоже не является остановкой при навигации клавишей Tab.

Общие сведения о метках, ролях и объявлениях см. в разделе [Доступность](../docs/accessibility.md).
