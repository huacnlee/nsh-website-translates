---
title: "DiffView"
description: "Компонент DiffView: изменения между двумя текстами или в патче, в режиме рядом или в едином виде, с подсветкой изменённых слов внутри строк, со сворачиванием неизменённых строк в разделители, которые можно развернуть, с подсветкой синтаксиса, мягким переносом строк, действиями для отдельных изменений, выделением строк и аннотациями для ревью."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView` показывает изменения между двумя текстами так, как это делают инструменты код-ревью: рядом (split), со старым текстом слева и новым справа, строки выровнены, или единым списком (unified), где удалённые строки идут над добавленными. Внутри изменённой строки подсвечиваются изменившиеся слова, неизменённые строки между изменениями сворачиваются в разделители, которые можно развернуть, а текст подсвечивается цветами синтаксиса [`Editor`](./editor.md). Компонент показывает два текста (`oldValue` и `newValue`) или файлы unified diff (`patch`: вывод `git diff`, pull request), каждый под своим заголовком. Он предназначен для просмотра изменений, в том числе правок, предложенных ИИ: действия приложения над каждым изменением сохраняют его или откатывают. Создаются только строки в области видимости, поэтому длинный файл прокручивается так же легко, как короткий.

`DiffView` отвечает за поведение и имеет собственный внешний вид, построенный на токенах темы: `font-mono` темы размером 13pt в строках высотой 20pt, номера строк в `muted-foreground`, добавленные строки подкрашены зелёным, удалённые красным, изменившиеся слова более насыщенным оттенком, у края gutter каждой изменённой строки проходит полоса, а разделители лежат на `muted`. Каждая часть принимает стили приложения поверх этих значений по умолчанию (`classes` и `styles`). В Rust его создаёт `nsh_base::diff_view()`, в TSX — `<DiffView>` из `nsh/base`.

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

Представление заполняет блок, который выделяет ему приложение (`flex-1`, высота), и прокручивается внутри: по вертикали по строкам, а по горизонтали до самой длинной строки, причём обе стороны split-представления прокручиваются вместе. При `softWrap` длинные строки вместо этого переносятся по ширине стороны, а строка split-представления имеет высоту более высокой из своих сторон, поэтому стороны остаются выровненными.

<a id="two-texts-or-a-patch"></a>

## Два текста или патч

- **Два текста**: `oldValue` и `newValue`. Строки сравниваются как есть, поэтому добавленный или удалённый перевод строки в конце является изменением, как его показывает git.
- **Патч**: `patch`, unified diff одного или нескольких файлов (`git diff`, `git format-patch`, `diff -u`; переименования, режимы, новые, удалённые и бинарные файлы, а также сообщение коммита перед ним читаются так, как их пишет git). Представление показывает строки ханков с нумерацией как в файле, каждый ханк под разделителем с его заголовком (функция, в которой он находится), а каждый файл из нескольких под собственным заголовком ([Файлы патча](#files-of-a-patch)). Путь каждого файла определяет его язык, если `language` не задан.

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` задаёт язык так же, как `Editor`: именем, псевдонимом, расширением или именем файла (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## Файлы патча

Патч из нескольких файлов показывает каждый файл под строкой заголовка: по умолчанию это его путь (`old → new` при переименовании), числа добавленных и удалённых строк и `▾`. Нажатие на заголовок сворачивает файл до заголовка (`▸`) или разворачивает его. `renderFileHeader` рисует заголовки так, как нужно приложению (и показывает заголовок также над патчем из одного файла); ему передаётся файл (`DiffFile`): `index`, `path`, `oldPath` (имя, из которого файл переименован или скопирован), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (патч не показывает его строк), `added`, `deleted`, `hunks`, `firstHunk` и `collapsed`. Заголовок приложения вызывает `toggleFile(path)` ref; `collapseFile` и `expandFile` задают состояние, а каждое изменение сообщается через `onFileToggle({ file })`. Свёрнутый файл остаётся свёрнутым, пока он есть в новом `patch`.

Изменения нумеруются по всем файлам подряд: изменения файла — это с `firstHunk` по `firstHunk + hunks - 1`, и именно их используют `goToHunk`, `renderHunkActions` и `hunks()` (у `DiffHunk` поле `file` — индекс его файла, а его строки считаются внутри этого файла), а `stats()` суммирует изменения всех файлов. `goToHunk` сначала разворачивает свёрнутый файл.

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## Раскладка и изменения внутри строки

`layout` принимает значение `"split"` (по умолчанию: рядом, каждая удалённая строка напротив наиболее похожей на неё добавленной) или `"unified"` (одна колонка, удалённые строки изменения над добавленными, с обоими номерами строк). `inline` определяет, что подсвечивается внутри изменённой строки:

| `inline` | Что подсвечивается |
|---|---|
| `"wordAlt"` (по умолчанию) | Изменившиеся слова; если их разделяет один символ, они объединяются, так что изменённая фраза воспринимается как одно целое |
| `"word"` | Каждое изменившееся слово |
| `"char"` | Каждый изменившийся символ |
| `"none"` | Ничего: только оттенки строк |

Слова — это последовательности букв, цифр и `_`; каждый CJK-символ, каждая кана и каждый слог хангыля являются отдельным словом, поэтому изменённый символ в предложении выделяет только себя. Строка, изменившаяся почти целиком, показывается только с оттенком.

`indicators` отмечает изменённые строки рядом с их номерами: `"bars"` (по умолчанию, полоса у края gutter), `"classic"` (`+` и `−` перед текстом) или `"none"`. `background={false}` оставляет изменённые строки без оттенка, а `lineNumbers={false}` скрывает номера.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## Свёрнутые строки

Вокруг каждого изменения показываются `contextLines` неизменённых строк (по умолчанию 3); неизменённые строки между изменениями, а также перед первым и после последнего сворачиваются в разделитель, который сообщает, сколько строк он скрывает. Нажатие на него показывает все эти строки. `expandAll` показывает все строки; методы ref `expand`, `expandAll()` и `collapseAll()` раскрывают и сворачивают их из приложения.

`renderSeparator` рисует разделители так, как нужно приложению. Он получает разделитель (`DiffSeparator`): `gap` — индекс свёрнутого участка (0 перед первым изменением, `i` между изменениями `i - 1` и `i`), `lines` — сколько строк он скрывает, `first` и `last`, а для патча ещё и `header` ханка. `expand(gap, direction, lines)` показывает `"all"` его строки (по умолчанию), или `lines` (по умолчанию 20) `"up"` — прямо над изменением под разделителем, или `"down"` — прямо под изменением над ним. Первый разделитель разворачивается вверх, последний вниз.

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## Сохранение и откат изменений

`renderHunkActions` помещает действия приложения в правый верхний угол каждого видимого изменения; ему передаётся изменение (`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, строки нумеруются с 0, и `file` — индекс его файла в патче). Они вызывают ref: `revertHunk(index)` возвращает старые строки изменения в новый текст, `acceptHunk(index)` делает его новые строки частью старого текста. Представление сразу показывает результат и сообщает оба текста через `onChange({ change })` (`{ oldValue, newValue }`), которые приложение задаёт как props. Сохранение или откат правки ИИ по одному изменению выглядит так:

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

Здесь старый текст — это файл как он есть: сохранение изменения применяет его к файлу (`onApply`), откат убирает его из предложения. Представление, показывающее `patch`, показывает фрагменты файлов, и его изменения остаются как есть.

<a id="methods"></a>

## Методы

`ref={diff}` даёт доступ к методам представления (`DiffViewRef`). Методы, возвращающие значение (`hunks()`, `stats()`), в JS возвращают `Promise` с ним, поэтому применяйте к ним `await`: `const changes = await diff.hunks()`. Для чисел, отображаемых на экране, `onStatsChange` сообщает их по мере изменения. Метод, которому передано изменение, разделитель или файл, которых нет в diff, ничего не меняет и записывает предупреждение с именем метода и значением.

| Метод | Описание |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: изменения по порядку. |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, число добавленных и удалённых строк и число изменений. |
| `goToHunk(index)` | Прокручивает изменение `index` в область видимости, его первая строка оказывается вверху. |
| `revertHunk(index)` | Возвращает старые строки изменения `index` в новый текст и сообщает тексты (`onChange`). |
| `acceptHunk(index)` | Делает новые строки изменения `index` частью старого текста и сообщает тексты (`onChange`). |
| `expand(gap, direction?, lines?)` | Показывает строки, скрытые разделителем `gap`: `"all"` (по умолчанию) или `lines` (по умолчанию 20) `"up"` или `"down"`. |
| `expandAll()` | Показывает все неизменённые строки. |
| `collapseAll()` | Снова сворачивает неизменённые строки. |
| `nextHunk()` | `Promise<number \| null>`: прокручивает следующее изменение к верху и возвращает его индекс (после последнего — первое). |
| `previousHunk()` | `Promise<number \| null>`: прокручивает предыдущее изменение к верху и возвращает его индекс (перед первым — последнее). |
| `currentHunk()` | `Promise<number \| null>`: изменение, к которому перешли последним, пока представление остаётся там, иначе изменение вверху представления или первое из видимых. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: строки, выделенные по номерам строк. |
| `setSelectedLines(range)` | Выделяет строки одной стороны (`null`: никакие), без `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>`: текст выделенных строк. |
| `files()` | `Promise<DiffFile[]>`: файлы патча по порядку с их счётчиками (для двух текстов — пусто). |
| `scrollToFile(path)` | Прокручивает заголовок файла `path` к верху. |
| `collapseFile(path)` | Показывает только заголовок файла `path`. |
| `expandFile(path)` | Снова показывает строки файла `path`. |
| `toggleFile(path)` | Сворачивает файл `path` или разворачивает, если он свёрнут. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: где находится каждое изменение среди строк, по порядку ([Линейка обзора](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: насколько прокручены строки (`x` равно 0). |
| `setScrollOffset(offset)` | Сразу прокручивает строки до `offset.y`, насколько они позволяют, как бегунок следует за указателем, который его перетаскивает. |

`nextHunk()` и `previousHunk()` продолжают с изменения, к которому перешли, пока представление остаётся там, а иначе с верха представления, поэтому изменение ближе к концу, которое нельзя прокрутить к верху, всё равно учитывается. Кнопки следующего и предыдущего изменения со счётчиками из `onStatsChange`:

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## Линейка обзора

`onScroll({ offset, contentSize, size })` сообщает, где находятся строки, с ключами как у [`Scroll`](./scroll.md): `offset.y` — насколько они прокручены (строки прокручиваются по вертикали и имеют ширину представления, а стороны прокручиваются по горизонтали сами по себе: `offset.x` равно 0), `contentSize` — суммарный размер всех строк и `size` — размер области просмотра. Событие срабатывает, когда представление скомпоновано, и затем при каждом изменении любого из них: при прокрутке строк, при изменении размера представления и при изменении высоты строк (другие тексты, `layout`, `softWrap`, развёрнутый или свёрнутый файл или разделитель, скомпонованная аннотация). `hunkBounds()` возвращает, где находится каждое изменение среди строк (`DiffHunkBounds`: `{ index, bounds }`, `bounds` от верха его первой строки до низа последней, с аннотациями под ними, по всей ширине представления), для изменений, которые видны: у изменений свёрнутого файла строк нет. `onHunkBoundsChange({ hunkBounds })` выдаёт тот же список, когда представление скомпоновано, и затем каждый раз, когда изменение сдвигается или меняет размер, даже если высота строк остаётся прежней (одна изменённая строка превращается в другую): линейка рисует свои метки по нему, а не считывает их при `onScroll`. `scrollOffset()` считывает, насколько прокручены строки, а `setScrollOffset({ x, y })` сразу прокручивает строки до `y`, так что перетаскиваемый бегунок следует за указателем в том же кадре.

Вместе они образуют линейку обзора рядом с представлением, как в редакторах кода: метка для каждого изменения, бегунок над видимыми строками, а нажатие или перетаскивание прокручивает к нужному месту. Здесь линейка той же высоты, что и представление:

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

Значение `index` метки совпадает со значением изменения в `hunks()`, где `oldLines` и `newLines` отличают добавленное изменение (нет старых строк) от удалённого (нет новых строк), чтобы раскрасить метку.

<a id="review-comments"></a>

## Комментарии при ревью

Номера строк выделяют строки одной стороны: нажатие выделяет одну строку, нажатие с Shift расширяет выделение до неё, а перетаскивание мыши по номерам выделяет те, над которыми она проходит. `onLineSelectionChange` сообщает строки как `range` (`DiffLineRange`: `{ side, start, end }`, строки нумеруются с 0, `null` — если ничего не выбрано), а нажатие на номер также сообщает `onLineNumberPress({ line })` (`{ side, line }`). ref считывает выделение (`selectedLines()`, `selectedText()`) и задаёт его.

`annotations` помещает содержимое приложения под строками: каждый `{ id, side, line }` рисуется с помощью `renderAnnotation` на всю сторону своей строки (на всё представление в unified), той высоты, какую получит при компоновке, и виден, пока видна его строка. `renderAddAnnotation` — элемент управления приложения для добавления такого комментария, справа от gutter строки, над которой находится указатель, и последней выделенной строки; он получает выделенные строки, если его строка — одна из них, иначе эту строку.

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## Стилизация частей

`class` и `style` задают стиль контейнера представления. `classes` принимает классы Tailwind по частям, а `styles` — инлайн-стили по частям; классы части применяются после её собственных стилей по умолчанию, поэтому имеют над ними приоритет, а её `styles` имеют приоритет над её классами. Шрифт задаётся через `fontFamily`, `fontSize` и `lineHeight`.

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| Часть | Что это | По умолчанию |
|---|---|---|
| `side` | Каждая сторона (split) или единственная колонка (unified) | Линия `border` между сторонами |
| `gutter` | Номера строк и индикаторы стороны | |
| `lineNumber` | Каждый номер строки | По правому краю, `muted-foreground` |
| `lineNumberAdded` | Номера добавленных строк, после `lineNumber` | |
| `lineNumberDeleted` | Номера удалённых строк, после `lineNumber` | |
| `content` | Текст стороны рядом с полем номеров | 8pt до и после текста |
| `line` | Каждый ряд стороны | |
| `lineAdded` | Ряды добавленных строк, после `line` | Зелёный оттенок |
| `lineDeleted` | Ряды удалённых строк, после `line` | Красный оттенок |
| `filler` | Пустая половина split-ряда рядом со строкой, которой нет на другой стороне | Едва заметная заливка `muted` |
| `wordAdded` | Слова, изменённые внутри добавленной строки | Более насыщенный зелёный |
| `wordDeleted` | Слова, изменённые внутри удалённой строки | Более насыщенный красный |
| `indicatorAdded` | Полоса добавленной строки (`"bars"`) или `+` (`"classic"`) | Зелёная, шириной 3pt |
| `indicatorDeleted` | Полоса удалённой строки или `−` | Красная, шириной 3pt |
| `separator` | Разделитель свёрнутых строк или заголовок hunk в патче | `⋯` и количество на `muted` |
| `hunkActions` | Контейнер действий приложения над изменением | В правом верхнем углу изменения |
| `lineSelected` | Поверх рядов выделенных строк своей стороны | Цвет выделения темы (как у выделений `Editor`) |
| `annotation` | Контейнер аннотации под её строкой | На всю ширину стороны её строки |
| `addAnnotation` | Контейнер элемента добавления: шириной с поле номеров и высотой в строку | Элемент справа от него |
| `fileHeader` | Заголовок файла патча | Путь и счётчики на `secondary`, линия `border` снизу |

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | Старый текст. |
| `newValue` | `.new_value(..)` | `string` | | Новый текст. |
| `patch` | `.patch(..)` | `string` | | Unified diff одного или нескольких файлов; показывается, когда `oldValue` и `newValue` не заданы. |
| `language` | `.language(..)` | `string` | простой текст (для патча — язык каждого файла) | Название языка, его псевдоним, расширение или имя файла. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | Две стороны рядом или одна колонка. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | Что подсвечивается внутри изменённых строк. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | Как изменённые строки отмечаются рядом с их номерами. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | Неизменённые строки, показываемые вокруг каждого изменения. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | Показываются все неизменённые строки. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Номера строк. |
| `background` | `.background(..)` | `boolean` | `true` | Изменённые строки подкрашиваются. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` темы | Шрифт текста. |
| `fontSize` | `.font_size(..)` | `number` | `13` | Размер шрифта в пунктах. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | Высота ряда в пунктах. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | Отрисовывает разделители свёрнутых строк. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | Действия приложения для каждого изменения. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Длинные строки переносятся по ширине стороны. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | Содержимое приложения под строками: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | Отрисовывает аннотацию под её строкой. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | Элемент приложения для добавления аннотации рядом со строкой под курсором и последней выделенной строкой. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | Отрисовывает заголовок каждого файла патча высотой в один ряд. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | Классы Tailwind по частям. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | Инлайн-стили по частям, поверх классов. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | | Контейнер представления. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | Изменение сохранено или отменено: `{ change }`, текущие тексты (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | Нажат номер строки: `{ line }`, значение `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | Выделенные строки изменились: `{ range }`, значение `{ side, start, end }` или `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | Счётчики изменились: `{ stats }`, значение `{ added, deleted, hunks }`. Срабатывает один раз при создании представления и снова каждый раз, когда сравнение текстов даёт другие счётчики, — например, для строки «+8 −8 · 5 изменений». |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | Файл патча свёрнут или развёрнут (через его заголовок или ref): `{ file }`, текущее значение `DiffFile`. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | Ряды прокручены, либо изменился размер рядов или области просмотра: `{ offset, contentSize, size }`, как у `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` в Rust). Срабатывает после компоновки представления и снова при изменении любого из них. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | Изменилось положение изменений среди рядов: `{ hunkBounds }`, список, который возвращает `hunkBounds()`. Срабатывает после компоновки представления и снова, когда изменение сдвигается или меняет размер, независимо от того, сохранилась ли высота рядов, — например, для меток обзорной линейки. |

<a id="related"></a>

## См. также

- [Editor](./editor.md): редактор кода, чьи цвета синтаксиса и языки использует `DiffView`.
- [TextView](./text-view.md): документы Markdown и HTML, для текста вокруг ревью.
- [`nsh/base`](../modules/nsh-base.md): остальные базовые компоненты.
