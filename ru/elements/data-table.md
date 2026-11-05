---
title: "DataTable"
description: "Компонент DataTable: таблица из строк и столбцов, которая прокручивается в обоих направлениях при любом количестве строк и столбцов, с закреплёнными, изменяемыми по размеру, перемещаемыми и сортируемыми столбцами, выделением строк, столбцов и ячеек, строками, которые приложение отдаёт постранично, метками групп, навигацией с клавиатуры и ячейками, которые рисует приложение."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` показывает строки и столбцы как электронная таблица и прокручивается в обе стороны при любом их числе. Создаются только видимые ячейки, поэтому таблица из миллиона строк и десяти тысяч столбцов прокручивается так же, как маленькая. Выделять можно строки, столбцы или ячейки, указателем и с клавиатуры. У столбцов фиксированная ширина, их размер меняется перетаскиванием края, порядок меняется перетаскиванием заголовка, они могут оставаться слева, пока остальные прокручиваются, и сортироваться. Заголовки можно разместить под подписями групп, а ячейку или заголовок может отрисовать приложение.

`DataTable` отвечает за раскладку, выравнивание, виртуализацию и взаимодействие. Отступы, цвета, рамки и обратную связь при выделении приложение задаёт своим частям через `classes` и `styles`. В Rust таблица создаётся через `nsh_base::data_table()`, в TSX через `<DataTable>` из `nsh/base`.

```rust tabs
use nsh_base::{DataTableColumn, data_table};
use nsh_core::prelude::*;

fn column(key: &str, title: &str) -> DataTableColumn {
    let mut column = DataTableColumn::default();
    column.key = key.into();
    column.title = Some(title.into());
    column
}

fn table() -> impl IntoElement {
    data_table()
        .columns(vec![column("name", "Name"), column("city", "City")])
        .flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DataTable, type DataTableColumn } from "nsh/base";

const columns: DataTableColumn[] = [
  { key: "name", title: "Name", width: 160, sortable: true },
  { key: "city", title: "City", width: 120 },
  { key: "score", title: "Score", width: 90, align: "end" },
];

const rows = [
  { name: "Ada", city: "Oslo", score: 91 },
  { name: "Grace", city: "Lima", score: 87 },
  { name: "Linus", city: "Kyoto", score: 78 },
];

function App() {
  return <DataTable columns={columns} data={rows} class="flex-1" />;
}

mount(App);
```

Таблица заполняет коробку, которую ей даёт приложение (`flex-1`, высота), и прокручивается внутри неё: по вертикали через строки, по горизонтали через столбцы, с полосами прокрутки (`scrollbar={false}` скрывает их, `bounces={false}` убирает отскок на краях там, где он есть на платформе).

<a id="rows-and-columns"></a>

## Строки и столбцы

`data` это строки: объекты, поля которых называют `key` столбцов, или массивы, которые столбцы индексируют по позиции. Числа, булевы значения и строки показываются как текст. В Rust строки передаются по одному полю за раз, каждое одного типа:
`DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. Столбец это
`DataTableColumn`:

| Поле | Описание |
|---|---|
| `key` | Идентификатор столбца, уникальный среди столбцов: поле строк, которое показывают его ячейки, и имя, которое используют события и ref. |
| `title` | Текст заголовка. По умолчанию его `key`. |
| `width` | Ширина в пунктах. По умолчанию `120`. |
| `minWidth`, `maxWidth` | Самая узкая и самая широкая ширина, которую допускают перетаскивание или подгонка. По умолчанию `20` и `1200`. |
| `fitPadding` | Дополнительное место под отступы, значки или бейджи приложения; прибавляется к самому широкому тексту заголовка или ячейки при подгонке столбца. |
| `align` | `"start"` (по умолчанию), `"center"` или `"end"`, для чисел. Относится и к ячейкам, и к заголовку. |
| `sortable` | В заголовке есть кнопка сортировки, которая запрашивает сортировку (см. [Сортировка](#sorting)). |
| `fixed` | Остаётся слева, пока остальные столбцы прокручиваются под ним. Фиксированные столбцы идут перед остальными, в своём порядке. |
| `resizable`, `movable` | Можно ли менять его размер перетаскиванием края и перемещать перетаскиванием заголовка. По умолчанию значения `resizableColumns` и `movableColumns` таблицы. |
| `selectable` | Участвует ли он в выделении. Столбец кнопок или флажков задаёт `false`. По умолчанию `true`. |
| `cellClass` | Классы ячеек столбца, после классов части `cell`: отступы или выравнивание одного столбца. |
| `headerClass` | Классы заголовка столбца, после классов части `headerCell`. |
| `positiveClass` | Классы ячеек столбца со значением-ростом: число больше нуля или текст, начинающийся с `+`. |
| `negativeClass` | Классы ячеек столбца со значением-падением: число меньше нуля или текст, начинающийся с `-`. |

`rowHeight` это высота строки тела (по умолчанию `32`), а `headerHeight` высота строки заголовка (по умолчанию равна высоте строки). `rowHeader` добавляет слева столбец номеров строк, который выделяет строки. `stripe` применяет к нечётным строкам часть `rowOdd`.

<a id="group-labels"></a>

### Подписи групп

`groups` размещает подписи над столбцами, начиная с нижнего уровня. Каждый уровень это список `{ label, span }`, сумма охватов которых равна числу столбцов или числу элементов нижнего уровня.

```tsx
<DataTable
  columns={columns}
  data={rows}
  groups={[
    [{ label: "Person", span: 2 }, { label: "Result", span: 1 }],
  ]}
  class="flex-1"
/>
```

<a id="any-number-of-rows"></a>

## Любое число строк

Таблица запрашивает строки по позиции, а приложение их отдаёт. `rowCount` это общее число строк, `data` строки, которые есть у приложения, а `dataStart` позиция первой из них. Строки вне `data` пусты, пока приложение их не предоставит. `onVisibleRowsChange` сообщает о строках в области видимости, `{ range: { start, end } }`, на каждом шаге прокрутки, и это место, где стоит загружать страницу вокруг них.

```tsx
const ROWS = 1_000_000;
const page = signal({ start: 0, rows: load(0) });

<DataTable
  columns={columns}
  data={page().rows}
  dataStart={page().start}
  rowCount={ROWS}
  onVisibleRowsChange={({ range: { start, end } }) => {
    // Keep the rows in view inside the page held.
    const held = page();
    if (start < held.start || end > held.start + held.rows.length) {
      const first = Math.max(0, start - 200);
      page.set({ start: first, rows: load(first) });
    }
  }}
  class="flex-1"
/>
```

Для списка, который растёт с конца, задайте `hasMore`: `onLoadMore` срабатывает один раз для каждого числа строк, когда видимые строки подходят к последней ближе чем на `loadMoreThreshold` (по умолчанию `20`). Пока `loading` равно true, он ждёт, а слот `loadingView` показывается поверх строк. Слот `empty` показывается, когда строк нет.

При содержимом больше нескольких миллионов пунктов полосы прокрутки охватывают масштабированный диапазон, поэтому миллион строк всё равно прокручивается до каждой строки.

<a id="selection"></a>

## Выделение

Три переключателя определяют, что выделяет нажатие, как в gpui-component:

| Свойство | Нажатие выделяет | `selection` |
|---|---|---|
| `rowSelectable` (по умолчанию `true`) | Строку: любую её ячейку или заголовок строки | `{ row }` |
| `columnSelectable` (по умолчанию `true`) | Столбец: его заголовок | `{ column }` |
| `cellSelectable` (по умолчанию `false`) | Ячейку; заголовок строки (с ней по умолчанию показывается) выделяет строки | `{ row, column }` |

При `cellSelectable` и скрытом заголовке строки (`rowHeader={false}`) повторное нажатие на выделенную ячейку выделяет её строку. Нажатие с зажатым Shift или командной клавишей платформы выделяет строку, только пока `selectOnModifierPress` (по умолчанию `true`), поэтому приложение, которое ведёт собственное выделение нескольких строк, обрабатывает такие нажатия само: `onRowPress` сообщает о каждом нажатии в теле с его строкой, столбцом под указателем, числом нажатий в строке и зажатыми клавишами-модификаторами. Столбец, у которого `selectable` равно `false`, не выделяется сам и не выделяет свои ячейки.

Строки в данных нумеруются с 0, а столбец это его индекс среди `columns`, в каком бы порядке их ни расположил пользователь. `onSelectionChange` сообщает, что выделил пользователь (`null`, если ничего). Свойство `selection` задаёт выделение из приложения; если оно не задано, таблица хранит выделение сама. `onDoublePress` сообщает о строке, ячейке или заголовке, нажатых дважды, а `onContextMenu` о вторичном или долгом нажатии с точкой, в которой нужно открыть [`Menu`](./menu.md) приложения. Оба называют ячейку под указателем (её `row` и `column`), номер строки (только `row`) или заголовок (только `column`). До следующего нажатия ячейка, для которой запрошено меню, получает часть `cellActive`, а там, где ячейки не выделяются, её строка получает часть `rowActive`.

Для программ чтения с экрана таблица выглядит как сетка (с именем из `accessibilityLabel`) из заголовков столбцов и ячеек, где выделенные озвучиваются как выделенные.

<a id="keyboard"></a>

## Клавиатура

Нажатие на таблицу или переход к ней клавишей Tab (macOS, веб) отдаёт ей клавиатуру до следующего нажатия, перехода фокуса в другое место или `blur()`; `focus()` отдаёт клавиатуру таблице из приложения. Таблица занимает одну остановку Tab: внутри неё Tab перемещает выделение, а Escape возвращает клавиатуру.

| Клавиши | Что делают |
|---|---|
| Стрелки | Перемещают выделение на строку, столбец или ячейку, прокручивая его в область видимости. |
| Tab, Shift+Tab | Переходят к следующему или предыдущему столбцу. |
| Page Up, Page Down | Перемещают на страницу строк. |
| Home, End | Переходят к первому или последнему. |
| Escape | Снимает выделение, затем возвращает клавиатуру. |
| Сочетание копирования | Помещает текст выделения в буфер обмена (`copy()`). |

`loopSelection` (по умолчанию `true`) заставляет стрелки переходить через края.

<a id="sorting"></a>

## Сортировка

У столбца `sortable` в конце заголовка есть кнопка сортировки, небольшая ghost-кнопка, приглушённая, пока столбец не отсортирован. Нажатие сообщает следующую сортировку (`{ key, direction }`) по циклу: без сортировки, по возрастанию, по убыванию и снова без сортировки, с `onSortChange({ sort })` (`null`, чтобы сбросить). Таблица сама не переупорядочивает строки: приложение сортирует свои данные или просит у сервера строки в новом порядке и задаёт `sort`, чтобы заголовок это показал. Поскольку порядок принадлежит приложению, сортировка работает одинаково и для миллиона строк, которых у приложения нет.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  sort={sort()}
  onSortChange={({ sort: next }) => {
    sort.set(next ?? undefined);
    rows.set(sorted(people, next));
  }}
  class="flex-1"
/>
```

<a id="resizing-and-moving-columns"></a>

## Изменение размера и перемещение столбцов

Перетаскивание заднего края столбца меняет его ширину в пределах `minWidth` и `maxWidth`, а `onColumnResize({ key, width })` сообщает о каждом шаге. Двойное нажатие на край подряд подгоняет столбец под самый широкий текст и заголовок. Перетаскивание заголовка перемещает столбец, а линия показывает, куда он встанет; `onColumnMove` сообщает `{ key, from, to, order }`, где `order` это `key` всех столбцов в показанном порядке. Фиксированные столбцы остаются среди фиксированных. `resizableColumns` и `movableColumns` отключают оба действия для всей таблицы, а `resizable` и `movable` столбца имеют приоритет над ними.

<a id="live-data"></a>

## Живые данные

Таблица котировок меняется много раз в секунду. Приложение форматирует видимые строки и запас вокруг них (их оно узнаёт из `onVisibleRowsChange`) и передаёт их как `data` из `dataStart`, так что обновление стоит ровно столько, сколько занимает то, что на экране, при любом числе строк. Цвета роста и падения берутся из `positiveClass` и `negativeClass` столбца и применяются нативно к ячейкам, значение которых больше или меньше нуля (или текст которых начинается с `+` или `-`).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

Строки и столбцы это слоты, которые таблица создаёт один раз и сохраняет: прокрутка даёт им другие строки и столбцы для показа, поэтому прокрутка, сколь бы долгой она ни была, меняет только тексты и позиции.

<a id="drawing-cells-and-titles"></a>

## Отрисовка ячеек и заголовков

`renderCell` рисует собственные ячейки приложения там, где столбец не просто текст (бейдж, кнопка). Он вызывается только для видимых ячеек и получает `DataTableCell`: `row`, `column`, `key`, `text` (то, что показала бы таблица) и `selected`. Свои данные приложение находит по `row`. `renderHeaderCell` рисует заголовок по всей его ячейке и получает `DataTableHeaderCell`: `column`, `key`, `title`, `sort` (направление или его отсутствие) и `selected`.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  renderCell={(cell) =>
    cell.key === "status" ? (
      <View class={cell.text === "open" ? "rounded bg-green-500/20 px-2" : "rounded bg-muted px-2"}>
        <Text class="text-xs">{cell.text}</Text>
      </View>
    ) : (
      <Text class="px-2 text-sm">{cell.text}</Text>
    )
  }
  class="flex-1"
/>
```

`fontFamily` и `fontSize` (по умолчанию `14`) задают шрифт ячеек, в котором таблица также измеряет тексты для подгонки столбцов.

<a id="the-ref"></a>

## Ref

`ref` даёт `DataTableRef`. Метод, которому передали строку, столбец или ключ столбца, которых нет в таблице, ничего не меняет и пишет в лог предупреждение с названием метода и значением; `fitColumn` завершается отказом с `TypeError` для неизвестного ключа.

| Метод | Описание |
|---|---|
| `scrollToRow(row, animated?)` | Прокручивает строку в область видимости. |
| `scrollToColumn(key, animated?)` | Прокручивает столбец в область видимости. |
| `selection()` | Что выделено, `null`, если ничего. |
| `select(selection)` | Выделяет (`null`: ничего) и показывает в области видимости, без `onSelectionChange`. |
| `visibleRows()`, `visibleColumns()` | Строки и прокручиваемые столбцы в области видимости, как `{ start, end }` (`end` не входят). |
| `columnWidths()` | Текущие ширины в порядке `columns`. |
| `setColumnWidth(key, width)` | Задаёт ширину столбца в его пределах. |
| `fitColumn(key)` | Задаёт столбцу ширину, нужную его самому широкому тексту и заголовку среди видимых строк и до тысячи дополнительных вокруг них. Возвращает ширину. |
| `dump(start?, end?)` | Тексты переданных строк (по умолчанию всех имеющихся) и заголовков в том виде, как они показаны: `{ headers, rows }`, для экспорта. |
| `copy()` | Помещает текст выделения в буфер обмена: ячейки строки через табуляцию, ячейки столбца через переводы строк, текст ячейки. |
| `focus()`, `blur()` | Отдаёт клавиатуру таблице или забирает её. |
| `menuTarget()`, `clearMenuTarget()` | Для чего последний раз запрашивалось контекстное меню (`{ row?, column? }`, отмечено `cellActive` / `rowActive`) и снятие этой отметки, когда меню приложения закрывается. |

<a id="styling-the-parts"></a>

## Стилизация частей

`class` и `style` стилизуют коробку таблицы. `classes` принимает классы Tailwind по частям, а `styles` встроенные стили по частям; части задают структуру и выравнивание таблицы, их классы задают внешний вид, а `styles` имеют приоритет над классами.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  stripe
  class="flex-1 rounded-lg border border-border"
  classes={{
    header: "bg-secondary",
    headerCell: "pl-2 pr-1",
    headerContent: "gap-1",
    cell: "px-2",
    resizeHandle: "bg-border group-hover:bg-primary",
    sortAscending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    sortDescending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    rowSelected: "bg-primary/10",
    rowHover: "bg-muted/50",
    fixedEdge: "bg-border",
  }}
/>
```

| Часть | Что это |
|---|---|
| `root` | Коробка таблицы: её рамка, радиус и фон |
| `header` | Шапка поперёк таблицы, её строки подписей групп и заголовков |
| `groupCell` | Подпись группы над столбцами, которые она охватывает |
| `headerCell` | Ячейка заголовка каждого столбца |
| `headerContent` | Строка раскладки подписи и кнопки сортировки; задайте здесь их промежуток |
| `headerCellDragging` | Перетаскиваемый заголовок, после `headerCell` |
| `headerCellSorted` | Заголовок столбца, по которому отсортирована таблица, после `headerCell` |
| `headerCellSelected` | Заголовок выделенного столбца, после `headerCell` |
| `sortIndicator` | Кнопка сортировки сортируемого столбца |
| `sortAscending`, `sortDescending` | Её две стрелки-шевроны; `selected:` применяется к направлению текущей сортировки |
| `resizeHandle` | Линия на заднем краю столбца, которую перетаскивают для изменения размера |
| `moveIndicator` | Линия, где окажется перетаскиваемый столбец |
| `row` | Каждая строка тела |
| `rowOdd` | Нечётные строки, после `row` (`stripe`) |
| `rowHover` | Строка под указателем, после `row` |
| `rowSelected` | Выделенная строка, после `row` |
| `rowActive` | Строка, для которой запрошено контекстное меню, там, где ячейки не выделяются, до следующего нажатия, после `row` |
| `cell` | Каждая ячейка тела |
| `cellSelected` | Выделенная ячейка, после `cell` |
| `cellActive` | Ячейка, для которой запрошено контекстное меню, до следующего нажатия, после `cell` |
| `cellColumnSelected` | Ячейки выделенного столбца, после `cell` |
| `rowHeader` | Ячейки заголовков строк, номера строк |
| `rowHeaderCorner` | Угол над заголовками строк |
| `fixedEdge` | Линия на заднем краю фиксированных столбцов, над столбцами, которые прокручиваются под ними |
| `empty` | Коробка слота `empty` |
## Props

| Prop | Rust | Type | По умолчанию | Описание |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | Столбцы слева направо. Закреплённые идут первыми. |
| `data` | `.data(..)` | `Row[]` | `[]` | Строки: объекты по столбцу `key` или массивы по позиции. |
| `rowCount` | `.row_count(..)` | `number` | загруженные строки | Общее количество строк. |
| `dataStart` | `.data_start(..)` | `number` | `0` | Индекс первой строки в `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | Классы для заданных строк по их позиции в `data`: собственный вид строки без вызова JS для каждой строки. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | Высота строки тела таблицы в пунктах. |
| `headerHeight` | `.header_height(..)` | `number` | высота строки | Высота строки заголовка. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | Подписи над столбцами, начиная с нижнего уровня. |
| `sort` | `.sort(..)` | `DataTableSort` | | Поле, по которому отсортированы данные; отображается в заголовке. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | Нажатия и клавиши выбирают строки. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | Нажатие на заголовок выбирает его столбец, а горизонтальные клавиши перемещают между столбцами. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | Нажатия и клавиши выбирают ячейки. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Нажатие с зажатой клавишей Shift или Command выбирает строку. |
| `selection` | `.selection(..)` | `DataTableSelection` | | Что выбрано, если выбор задаёт приложение. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | Клавиши со стрелками переходят через границы. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Название таблицы для программ чтения с экрана. |
| `rowHeader` | `.row_header(..)` | `boolean` | отображается при `cellSelectable` | Столбец с номерами строк слева. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | Нечётные строки получают часть `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | Перетаскивание границы столбца меняет его ширину. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | Перетаскивание заголовка перемещает его столбец. |
| `loading` | `.loading(..)` | `boolean` | `false` | Таблица загружается: `onLoadMore` ожидает, а `loadingView` отображается. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | Есть ещё строки для загрузки. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | За сколько строк до последней срабатывает `onLoadMore`. |
| `fontFamily` | `.font_family(..)` | `string` | наследуется | Шрифт ячеек. |
| `fontSize` | `.font_size(..)` | `number` | `14` | Размер шрифта ячеек в пунктах. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Полосы прокрутки. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | Полоса прокрутки одной оси (горизонтальная — это полоса под таблицей на десктопах). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Отскакивает ли прокрутка на границах, если платформа это поддерживает. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | Отрисовывает видимые ячейки. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | Отрисовывает заголовки. |
| `empty` | `.empty(..)` | `JSX.Element` | | Что отображается, когда строк нет. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | Что отображается поверх строк, пока `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | Классы Tailwind по частям. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | Встроенные стили по частям, поверх классов. |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | | Контейнер таблицы. |

## Events

| Event | Rust | Описание |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | Пользователь изменил выбор: `{ selection }`, `{ row?, column? }` или `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | Нажата строка или ячейка: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | Строка, ячейка или заголовок нажаты дважды: `{ target }`, `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | Запрошено контекстное меню: `{ row?, column?, x, y }`, точка в корневом представлении. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | Нажата кнопка сортировки: `{ sort }`, следующая сортировка `{ key, direction }` или `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | Изменена ширина столбца (`{ key, width }`) на каждом шаге перетаскивания и ещё раз, когда её задаёт подгонка. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | Столбец перемещён: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | Изменились видимые строки: `{ range }`, `{ start, end }`. Загружайте строки здесь. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | Изменились видимые прокручиваемые столбцы: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | Видимые строки оказались в пределах `loadMoreThreshold` от последней, пока `hasMore` и не `loading`. |

## Related

- [Editor](./editor.md) и [DiffView](./diff-view.md): другие базовые компоненты для работы с большими объёмами данных.
- [Menu](./menu.md): меню, которое открывается из `onContextMenu`.
- [`nsh/base`](../modules/nsh-base.md): другие базовые компоненты.
