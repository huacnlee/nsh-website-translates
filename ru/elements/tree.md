---
title: "Tree"
description: "Tree: элементы, содержащие другие элементы, которые можно разворачивать и сворачивать, с одним выбранным элементом: файлы проекта, боковая панель настроек, структура документа. Виртуализация, одна точка остановки клавиатурного фокуса, дерево для программ чтения с экрана. Внешний вид каждой строки определяется приложением."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# Tree

Tree показывает элементы, которые содержат другие элементы: файлы и папки проекта, разделы боковой панели настроек, структуру документа. `Tree` отвечает за поведение такого дерева: какие элементы раскрыты, какой выбран, как работает клавиатура и что слышат пользователи скринридеров. Строки дерева виртуализированы: создаются только видимые строки, а дочерние элементы свёрнутого элемента не создаются вовсе, поэтому дерево из тысяч элементов открывается и прокручивается мгновенно. Внешний вид определяет приложение: само дерево ничего не рисует, приложение стилизует каждую строку (`itemClass`) и рисует её содержимое (`renderItem`: значок, подпись с отступом по глубине элемента, шеврон, бейдж).

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` поставляется в [`nsh/base`](../modules/nsh-base.md), крейте `nsh-base` для Rust. Раскрытые элементы и выбранный элемент принадлежат приложению, если оно задаёт `expanded` и `selected` и обновляет их в `onExpandedChange` и `onSelectedChange`; без них дерево хранит собственное состояние, начиная с `defaultExpanded` и `defaultSelected`. Элементы идентифицируются по `id`, который задаёт приложение (путь, ключ записи), но никогда по подписи. В Rust дерево создаёт `tree()`: у него есть сеттер для каждого свойства (`.items(..)`, `.expanded(..)`, `.render_item(..)`), метод-слушатель для каждого события и типизированные методы стилей.

<a id="items"></a>

## Элементы

`items` задаёт элементы верхнего уровня, каждый из которых является `TreeItem`:

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string` | Идентифицирует элемент в `expanded`, `selected` и событиях: уникален в пределах дерева (повторно заданный id попадает в лог, и раскрывается или выбирается только первый элемент с ним). |
| `label` | `string` | Что показывает строка, если её не рисует `renderItem`, что произносят скринридеры и с чем сопоставляется поиск по набору текста. |
| `children` | `TreeItem[]` | Вложенные элементы по порядку. Если они есть, элемент является папкой: он раскрывается и сворачивается. |
| `disabled` | `boolean` | Пользователь не может выбрать, раскрыть или свернуть элемент: нажатия и клавиши его пропускают, применяются стили `disabled:`. Его дочерние элементы остаются такими, как задано в `expanded`. |

`renderItem` получает `TreeEntry` для каждой видимой строки: `id`, `label` и `disabled` элемента, его `depth` (0 на верхнем уровне, 1 под элементом верхнего уровня, …) и признак того, является ли он `folder`. Это описывает, чем является элемент, а состояния строки выражаются её классами: содержимое рисуется один раз для элемента и сохраняет свои представления, пока строка выбирается, раскрывается или сворачивается, поэтому шеврон поворачивается с переходом.

## Props

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | Элементы верхнего уровня, каждый со своими вложенными элементами. |
| `expanded` | `.expanded(..)` | `string[]` | нет | Идентификаторы раскрытых элементов (controlled). Элемент виден, пока раскрыты все элементы над ним. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | Раскрытые элементы в начале, пока не задан `expanded`. |
| `selected` | `.selected(..)` | `string \| null` | нет | Идентификатор выбранного элемента (controlled), `null`, если выбора нет. |
| `defaultSelected` | `.default_selected(..)` | `string` | нет | Выбранный элемент в начале, пока не задан `selected`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Дерево только для чтения: без нажатий и клавиш, без остановки фокуса клавиатуры, `disabled:` на каждой строке; оно показывает то, что задают `expanded` и `selected`. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | При раскрытии и сворачивании строки после элемента перемещаются на новые места с пружинной анимацией, выполняемой нативно. Отключается при включённом режиме уменьшения движения. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют дерево («Files»). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | нет | Содержимое строки для видимых строк; без него строка показывает подпись элемента. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | нет | Каждая строка: её высота, отступы, поверхность и состояния (см. ниже); стили текста применяются к подписи. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Прокручиваемая область со строками внутри дерева: её отступы и промежутки. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Само дерево. Задайте ему высоту (или `flex-1` в родителе, у которого она есть): строки прокручиваются внутри него, и создаются только видимые. |

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | Пользователь раскрыл или свернул элемент (нажатие, Return, Space, Right или Left, `revealItem`): передаются идентификаторы раскрытых элементов в том виде, какими они стали бы. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | Пользователь выбрал другой элемент (нажатие, стрелки, Home, End, поиск по набору текста). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | Пользователь раскрыл элемент с `id` после `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | Пользователь свернул элемент с `id` после `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | Пользователь выполнил действие над элементом с `id`: Return на выбранном элементе без дочерних, либо двойной щелчок или двойное касание на любом элементе, после собственных событий нажатия. Отключённые элементы и отключённое дерево его никогда не сообщают. |

Выбор следует за стрелками, поэтому файловый менеджер открывает файл в `onAction`, а не в `onSelectedChange`: при перемещении по файлам они показываются в предпросмотре один за другим, а Return или двойной щелчок открывает тот, который нужен пользователю.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется с помощью | Состояния |
|---|---|---|---|
| Дерево | | `class`, `style` | |
| Список | дерево | `listClass`, `listStyle` | |
| Строка | список | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (раскрытая папка), `focus:` (пока дерево имеет фокус клавиатуры, строка, на которую действуют клавиши: выбранная строка, свёрнутый элемент, под которым скрыт выбор, или первая строка, пока ничего не выбрано), `disabled:`, `hover:`, `active:` |
| Содержимое строки | строка | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` под `group` в `itemClass` |

Показывайте выбранную строку с помощью `selected:`, а положение клавиатуры с помощью `focus:` (см. [Design guides](../docs/design-guides.md#interaction-states)). Рисуйте фокус внутри строки (`focus:outline-2 focus:-outline-offset-2`): список обрезает всё, что выходит за его края.

## Ref

| Метод | Описание |
|---|---|
| `focus()` | Получает фокус клавиатуры, как при переходе на дерево клавишей Tab. |
| `revealItem(id)` | Раскрывает элементы над элементом с `id` (сообщается через `onExpandedChange` и `onExpand`, начиная с самого внешнего) и прокручивает его строку в область видимости, когда она появляется: если приложение следует за изменением, сразу; если нет, запрос на этом заканчивается. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

## Disabled

Отключённый элемент не принимает нажатий, стрелки его пропускают, а скринридеры объявляют его как приглушённый. `disabled` на дереве делает его доступным только для чтения: оно показывает то, что говорит состояние приложения, и не принимает ввод.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## Доступность

- У дерева роль `"tree"`, его имя задаёт `accessibilityLabel`; каждая строка является `"treeitem"` с именем, равным подписи её элемента, а также с уровнем (глубина + 1), состоянием раскрытия (для папок), выбора и отключения.
- Когда дерево получает фокус клавиатуры и когда клавиши перемещают выбор, строка, на которую действуют клавиши, получает фокус скринридера.

Общие сведения о подписях, ролях и объявлениях см. в [Accessibility](../docs/accessibility.md).

<a id="keyboard"></a>

## Клавиатура

На десктопах и в вебе, где Tab переходит к представлениям, принимающим нажатия, `Tree` следует [шаблону WAI-ARIA tree view](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Клавиша | Действие |
|---|---|
| Tab, Shift+Tab | Входит в дерево за один шаг и выходит из него за один шаг; при возврате клавиши продолжают действовать с выбранной строки. Если ничего не выбрано, фокус показывается на первой строке, которую выбирает Down. |
| Down, Up | Выбирает следующую или предыдущую строку, пропуская отключённые элементы, от последней к первой и обратно. |
| Right | Раскрывает свёрнутую папку; на раскрытой выбирает её первый доступный дочерний элемент. |
| Left | Сворачивает раскрытую папку; в остальных случаях выбирает родителя. |
| Home, End | Выбирает первую или последнюю строку. |
| Return | Раскрывает или сворачивает выбранную папку; на элементе без дочерних выполняет над ним действие (`onAction`). |
| Space | Раскрывает или сворачивает выбранную папку. |
| Буквы, цифры | Выбирает следующую строку, подпись которой начинается с набранного. |

Пока выбор скрыт под свёрнутым элементом (приложение свернуло его), клавиши действуют на строку этого элемента: Right или Return раскрывает его, Down выбирает следующую за ним строку.

В раскладке справа налево строки идут от правого края, поэтому Left и Right меняются местами, как предписывает шаблон: Left раскрывает папку и входит в неё, Right сворачивает её и выбирает родителя. Up, Down, Home и End остаются прежними.

<a id="platform-notes"></a>

## Особенности платформ

- iOS, Android и Mac Catalyst: касание выбирает строку и раскрывает или сворачивает папку; двойное касание выполняет действие над элементом (`onAction`).
- Десктопы (macOS, Windows, Linux, GPUI) и веб: щелчок делает то же самое и передаёт дереву фокус клавиатуры, после чего в нём работают клавиши, описанные выше; двойной щелчок выполняет действие над элементом.
- На каждой платформе рисуется то, что стилизует приложение: дерево, его строки и их содержимое.
