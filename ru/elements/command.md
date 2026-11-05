---
title: "Command"
description: "Command: палитра команд, поле поиска по командам приложения, которые фильтруются по мере ввода: палитра Cmd+K в диалоге, встроенное меню команд, поиск, на который отвечает приложение. Виртуализированный список, управление в первую очередь с клавиатуры, list box для скринридеров. Внешний вид каждой части определяется приложением."
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

Палитра команд — это поле поиска над списком команд: пользователь вводит несколько букв, список сужается до подходящих команд, стрелки перемещают выделение, а Return запускает выделенную команду. `Command` отвечает за поведение такой палитры: фильтрацию, секции, выделение, клавиатуру и то, что слышат пользователи screen reader. Фильтрация выполняется нативно, а строки виртуализированы: создаются только видимые строки, поэтому палитра из тысяч команд, файлов или эмодзи фильтруется при каждом нажатии клавиши. Внешний вид определяет приложение: команда сама ничего не рисует, приложение стилизует каждую часть (`itemClass`, `groupClass`, `searchClass`, ...) и рисует содержимое строк (`renderItem`: значок, подпись, клавиши сочетания).

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` происходит из [`nsh/base`](../modules/nsh-base.md), crate `nsh-base` в Rust. Запрос принадлежит приложению, если оно задаёт `query` и обновляет его в `onQueryChange`; без этого поле поиска хранит собственный запрос, начиная с `defaultQuery`. Элементы определяются по их `id`, собственному идентификатору приложения, но никогда по подписи: `onSelect({ id })` сообщает, какой из них выбрал пользователь. В Rust его создаёт `command()`: по одному сеттеру на каждое свойство (`.items(..)`, `.query(..)`, `.render_item(..)`), по одному методу-слушателю на каждое событие и типизированные методы стилей.

<a id="items"></a>

## Элементы

`items` — это команды по порядку, каждая из которых является `CommandItem`:

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | Что идентифицирует его в `onSelect` и `onHighlightChange`: уникален среди элементов. |
| `label` | `string` | Что показывает его строка, если её не рисует `renderItem`, что произносят screen reader и с чем сопоставляется запрос. |
| `keywords` | `string[]` | Дополнительные слова для сопоставления с запросом: синонимы, английское название рядом с переведённой подписью. |
| `group` | `string` | Его секция: соседние элементы одной группы показываются под заголовком с этим названием. |
| `shortcut` | `string` | Сочетание клавиш той же команды в записи [`keymap`](../modules/nsh.md#keymap) (`"mod+shift+p"`), которое покажет его строка. Приложение привязывает его через `keymap.bind`. |
| `disabled` | `boolean` | Его нельзя выбрать: клавиши его пропускают, нажатия ничего не делают, применяются стили `disabled:`. |
| `checked` | `boolean` | Он действует в данный момент (тема, язык): применяются стили `checked:`, а screen reader сообщают, что он отмечен. |

Запрос соответствует элементу, если его подпись или одно из ключевых слов содержит запрос, без учёта регистра и окружающих пробелов. Элементы сохраняют свой порядок, а секция без совпадений исчезает вместе со своим заголовком. `renderItem` получает `CommandEntry` для каждой видимой строки: поля элемента и `shortcutLabel` — его `shortcut` в том виде, в каком подсказки показывают его здесь (`⇧⌘P` на платформах Apple, `Ctrl+Shift+P` на остальных). Это то, чем является элемент, а выделение — это `focus:` строки: содержимое рисуется один раз для каждого элемента и сохраняет свои представления, пока выделение перемещается.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | Команды по порядку. |
| `query` | `.query(..)` | `string` | нет | Запрос (управляемый), который приложение задаёт в `onQueryChange`. |
| `defaultQuery` | `.default_query(..)` | `string` | нет | Начальный запрос, пока не задан `query`. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | Поле поиска над строками. Без него показываются все элементы, а команда становится одной остановкой фокуса клавиатуры с вводом для быстрого перехода. |
| `filterable` | `.filterable(..)` | `boolean` | `true` | Запрос фильтрует элементы. Если отключить, показываются все элементы: на поиск приложение отвечает само (результаты сервера задаются как `items`). Новый запрос по-прежнему выделяет первый элемент. |
| `loading` | `.loading(..)` | `boolean` | `false` | Выполняется поиск: `empty` ожидает, а список для screen reader занят. Покажите свой индикатор в `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | нет | Подсказка (placeholder) поля поиска. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Поле поиска получает фокус клавиатуры, как только показано: палитра, которая открывается для ввода. |
| `separator` | `.separator(..)` | `boolean` | `true` | Строка-разделитель между двумя показанными секциями, стилизуется через `separatorClass`; никогда не бывает первой, последней или двойной. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как screen reader называют список («Commands») и поле поиска, пока не задан `searchAccessibilityLabel`. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | Как screen reader называют поле поиска: что оно ищет («Search commands»). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | нет | Что показывается над полем поиска (заголовок) и под строками (подсказки по клавишам, счётчик). |
| `empty` | `.empty(..)` | `JSX.Element` | нет | Что показывается, когда нет ни одного элемента: запрос без совпадений, нет элементов. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | нет | Что показывается перед полем поиска и после него в его панели: значок поиска, индикатор загрузки, пока `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | нет | Содержимое строки для видимых строк; без него строка показывает подпись элемента. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | нет | Заголовок секции (`{ heading }`); без него заголовок показывает своё название. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Сама команда: её размер, рамка и поверхность. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Строка с `searchPrefix`, полем поиска и `searchSuffix`. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Поле поиска. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Прокручиваемая область со строками. Задайте ей высоту (`max-h-80` или команду с заданным размером): строки прокручиваются внутри неё, и создаются только видимые. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Строка каждого элемента и её состояния (ниже); стили текста применяются к подписи. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Заголовок каждой секции. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Каждый разделитель: высота и цвет линии. |

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | Пользователь выбрал элемент: Return или нажатие на его строку. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | Выделение переместилось (клавиши, указатель, новый запрос или новые элементы, `highlight`): чтобы показать предварительный просмотр того, что запустит Return. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | Пользователь ввёл текст в поле поиска или Escape очистил его. |
| `onCancel` | `.on_cancel(..)` | нет | Escape при пустом запросе: закройте то, что содержит команду (`open` диалога). |

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется через | Состояния |
|---|---|---|---|
| Команда | | `class`, `style` | |
| `header` | команда | элемент приложения | |
| Панель поиска | команда | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, поле поиска, `searchSuffix` | панель поиска | элементы приложения; `searchClass`, `searchStyle` | `focus:` поля |
| Список | команда | `listClass`, `listStyle` | |
| Заголовок секции | список | `groupClass`, `groupStyle`, `renderGroup` | |
| Разделитель | список | `separatorClass`, `separatorStyle` | |
| Строка | список | `itemClass`, `itemStyle` | `focus:` (выделена), `checked:`, `disabled:`, `hover:`, `active:` |
| Содержимое строки | строка | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:` под `group` в `itemClass` |
| `empty` | команда | элемент приложения | |
| `footer` | команда | элемент приложения | |

Показывайте выделенную строку через `focus:` (см. [Руководства по дизайну](../docs/design-guides.md#interaction-states)).

## Ref

| Метод | Описание |
|---|---|
| `focus()` | Передаёт фокус клавиатуры полю поиска (если его нет — команде). |
| `highlight(id)` | Выделяет элемент с `id` и прокручивает его строку в область видимости; элемент, который не показан или отключён, остаётся как есть. |
| `matchedCount()` | `Promise<number>`: сколько элементов показывает запрос, включая отключённые. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## Палитра в диалоге

Поместите команду в [`Dialog`](./dialog.md) и откройте её сочетанием клавиш приложения. Сначала Escape очищает запрос; при пустом запросе срабатывает `onCancel`, в котором приложение закрывает диалог.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## Поиск, на который отвечает приложение

С `filterable={false}` показываются все элементы, которые передало приложение: приложение выполняет поиск в `onQueryChange` (сервер, база данных) и задаёт `items` с результатами, а `loading` — пока ждёт.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## Доступность

- У списка роль `"listbox"` с именем из `accessibilityLabel`; каждая строка — это `"option"` с именем из подписи её элемента, отмеченная и отключённая так же, как её элемент; заголовок секции — это `"header"`, разделитель скрыт.
- Поле поиска — текстовое поле с именем из `searchAccessibilityLabel` (иначе `accessibilityLabel`); его placeholder — это подсказка, которая показывается, пока поле пусто.
- Поле поиска сохраняет фокус клавиатуры, пока стрелки перемещают выделение, а screen reader произносят подпись выделенного элемента. Без поля поиска выделенная строка получает фокус screen reader.
- Пока `loading`, список занят.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Доступность](../docs/accessibility.md).

<a id="keyboard"></a>

## Клавиатура

| Клавиша | Действие |
|---|---|
| Ввод текста | Фильтрует элементы; выделяется первое подходящее доступное совпадение. |
| Down, Up | Выделяет следующий или предыдущий элемент, пропуская отключённые, от последнего к первому и обратно. |
| Page Down, Page Up | Перемещает выделение на число видимых строк. |
| Return | Выбирает выделенный элемент (`onSelect`). |
| Escape | Очищает запрос; при пустом запросе сообщает `onCancel`. |
| Home, End | Без поля поиска: первый или последний элемент (в поле они перемещают каретку). |
| Space, буквы, цифры | Без поля поиска: Space выбирает, буквы и цифры выделяют по быстрому вводу (typeahead). |

<a id="platform-notes"></a>

## Примечания по платформам

- Настольные платформы (macOS, Windows, Linux, GPUI) и веб: указатель выделяет строку, над которой проходит, а щелчок выбирает элемент в момент нажатия кнопки, поэтому поле поиска сохраняет фокус клавиатуры.
- iOS, Android и Mac Catalyst: касание выбирает строку, а клавиша return на клавиатуре выбирает выделенный элемент и оставляет поле для следующего запроса.
- Каждая платформа рисует то, что стилизует приложение: команду, её панель поиска, строки и их содержимое.
