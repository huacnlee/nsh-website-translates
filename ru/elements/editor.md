---
title: "Editor"
description: "Компонент Editor: редактор кода с подсветкой синтаксиса, нумерацией строк, несколькими курсорами, сворачиванием блоков, мягким переносом строк, поиском и заменой, диагностикой и декорациями, а также с привычными клавишами редакторов кода."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# Editor

`Editor` — редактор кода: подсветка синтаксиса для более чем пятидесяти языков, номера строк, несколько кареток, сворачивание, мягкий перенос строк, поиск и замена, диагностика и декорации, а также привычные для редакторов кода клавиши (перемещение и дублирование строк, комментарии, отступы, скобки и кавычки, которые закрываются по мере набора). Он работает с файлами любой длины: создаются только видимые строки, а подсветка обновляется построчно после каждой правки, так что длинный файл прокручивается и редактируется так же легко, как короткий. Ввод проходит через платформенный механизм ввода, поэтому методы ввода (пиньинь, кана, «мёртвые» клавиши) и экранные клавиатуры работают так же, как в любом текстовом поле.

Редактор отвечает за поведение и имеет собственный внешний вид, построенный на токенах темы: `font-mono` темы размером 13pt в строках высотой 20pt, номера строк цвета `muted-foreground`, едва заметная полоса `muted` за строками с кареткой, выделение оттенком `primary`, направляющие отступов цвета `border` и встроенные цвета синтаксиса, которые используют блоки кода [`TextView`](./text-view.md), в светлой и тёмной теме. Каждая часть берёт стили приложения поверх этих значений по умолчанию (`classes` и `styles`). В Rust редактор создаётся с помощью `nsh_base::editor()`, в TSX — с помощью `<Editor>` из `nsh/base`.

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

Редактор заполняет область, которую ему отводит приложение (`flex-1`, высота), и прокручивает текст внутри неё: по вертикали всегда, по горизонтали — когда строки длиннее области, либо вообще не прокручивает при `softWrap`, когда длинные строки переносятся по ширине редактора.

<a id="the-text"></a>

## Текст

- **Управляемый режим**: передайте `value` и задавайте его заново в `onChange`, который сообщает весь новый текст. Если приложение меняет `value` (загружен файл, получен результат форматтера), текст заменяется одной правкой, которую отмена возвращает целиком; каретки и свёрнутые блоки, находящиеся вдали от изменённого места, остаются на месте.
- **Неуправляемый режим**: передайте `defaultValue` и читайте текст из `onChange` или из `value()` ref.

Переводы строк — `\n`: `\r\n` и `\r` во входящем тексте превращаются в `\n`.

<a id="languages"></a>

## Языки

`language` задаёт язык по названию, псевдониму, расширению или имени файла, в любом регистре: `"rust"`, `"rs"`, `"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. Он определяет подсветку, комментарий, который переключает `mod+/`, скобки, которые сопоставляются и задают отступ, пары, которые закрываются при наборе, символы, из которых состоят слова, и отступ по умолчанию: четыре пробела, два для веб-языков (JavaScript, TypeScript, JSON, HTML, CSS, YAML и других), табуляция для Go и Makefile. `tabSize` и `hardTabs` задают отступ для всех языков. Любое другое имя означает обычный текст, если только приложение не зарегистрировало его ([собственные языки](#your-own-languages)).

Языки: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL и Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### Собственные языки

Код на Rust может научить редакторы приложения новым языкам и подсвечивать любой язык собственным подсветчиком (грамматикой tree-sitter или парсером приложения). `register_language` регистрирует `EditorLanguage`: его название, псевдонимы, расширения и имена файлов, а также правила редактирования (комментарии, скобки, закрываемые при наборе пары, символы слов, отступы); `syntax` указывает встроенную грамматику, которой он будет подсвечиваться. `register_highlighter` назначает языку, встроенному или зарегистрированному, подсветчик приложения: тип, реализующий `EditorHighlighter`, который получает сведения о каждой правке (строки, байты и позиции в том виде, в каком их принимают правки tree-sitter) и возвращает токены каждой строки (`EditorToken`, либо capture tree-sitter или scope TextMate через `EditorToken::from_scope`) в пределах отведённого времени, вне потока UI. Редактор хранит токены, сдвигает их вместе с текстом при правках и заново запрашивает видимые строки, как и у встроенного подсветчика. `language` сначала ищет зарегистрированные языки по названию, псевдониму, расширению или пути, как в редакторах, так и в представлениях diff.

У каждого движка свои языки. Приложение на Rust регистрирует их в корне до монтирования редакторов; для приложения на TSX их регистрирует крейт приложения в setup его набора UI, который первым вызывает каждый движок, запускающий приложение.

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## Редактирование

Редактор работает так, как привыкли пользователи редакторов кода:

- **Несколько кареток.** Alt-клик (Option-клик) добавляет каретку, `mod+d` выделяет следующее вхождение выделенного, `mod+shift+l` — все вхождения, а клавиши добавления каретки добавляют её на строку выше или ниже. Набор, удаление, перемещение и любая команда действуют у каждой каретки; Escape возвращает одну. `undoSelection` (`cmd+u`, `ctrl+u`) возвращает выделения, бывшие до последнего перемещения.
- **Расширение выделения** по единицам с помощью `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`): слово, содержимое строки и строка целиком, содержимое пары скобок и пара целиком, строка, весь текст; `shrinkSelection` возвращает назад тем же путём. `splitSelectionIntoLines` (`shift+alt+i`) превращает выделение на нескольких строках в по одному выделению на строку.
- **Отступы.** Новая строка сохраняет отступ текущей и добавляет уровень после открывающей скобки (`:` в Python, `do` в Ruby и т. д.); Enter между парой скобок переносит закрывающую на отдельную строку. Tab и Shift+Tab увеличивают и уменьшают отступ выбранных строк; Backspace среди начальных пробелов возвращается к предыдущей позиции отступа. `autoIndent` отключает это поведение.
- **Скобки и кавычки** закрываются по мере набора, оборачивают выделение и пропускаются, если закрывающая набирается повторно (`autoClose`). Скобка у каретки и её пара обводятся рамкой.
- **Отмена** возвращает целые серии набора: слово, удаление, команду. Перемещение или нажатие начинает новый шаг.
- **Сворачивание.** Строка, за которой следуют строки с большим отступом, сворачивает их с маркером в жёлобе: `⌄` — свернуть, `›` и `⋯` после строки — развернуть. Каретка, перемещённая в свёрнутый блок, раскрывает его ([Сворачивание](#folding)).
- **Нажатия.** С указателем: клик ставит каретку, двойной клик выделяет слово, тройной — строку, Shift-клик расширяет выделение, а перетаскивание выделяет по единице, выбранной кликом. Перетаскивание с Alt+Shift (Option+Shift; на Linux также Control+Alt) выделяет блок: по одному выделению на строку между одними и теми же столбцами, которые продолжаются и за концом коротких строк. На сенсорных экранах касание ставит каретку, двойное касание или долгое нажатие выделяет слово под пальцем, а маркеры на концах выделения перемещают каждый конец вслед за пальцем (окружающий текст при этом по-прежнему прокручивается).
- **Буфер обмена.** Копирование и вырезание без выделения берут строки целиком, на которых стоят каретки, и при вставке они возвращаются как целые строки над строкой каретки.

`readOnly` сохраняет текст как есть, пока он остаётся выделенным, доступным для поиска и копирования.

<a id="keys"></a>

## Клавиши

Клавиши редактора работают, пока у него есть фокус; другие поля ввода сохраняют свои. `mod` — это Command в macOS и iOS и Control на остальных платформах (сочетания клавиш `keymap`).

| Клавиши (macOS) | Клавиши (Windows, Linux) | Команда |
|---|---|---|
| Стрелки, с Shift для выделения | Стрелки, с Shift для выделения | Перемещение по символам и строкам |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | Перемещение по словам |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | Первый непробельный символ строки (затем её начало) / конец строки |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | Начало / конец текста |
| `pageup` / `pagedown` | `pageup` / `pagedown` | Страница вверх / вниз |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | Удалить слово слева / справа |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | Удалить до начала / до конца строки |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Отменить / повторить |
| `cmd+a` | `ctrl+a` | Выделить всё |
| `cmd+l` | `ctrl+l` | Выделить строку (повторно: и следующую) |
| `cmd+d` | `ctrl+d` | Выделить следующее вхождение |
| `cmd+shift+l` | `ctrl+shift+l` | Выделить все вхождения |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | Добавить каретку выше / ниже |
| `escape` | `escape` | Вернуться к одному выделению |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | Переместить строки вверх / вниз |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | Дублировать строки вверх / вниз |
| `cmd+shift+k` | `ctrl+shift+k` | Удалить строки |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | Новая строка ниже / выше |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | Увеличить / уменьшить отступ |
| `cmd+/` | `ctrl+/` | Переключить строчный комментарий |
| `cmd+shift+\` | `ctrl+shift+\` | Перейти к парной скобке |
| `ctrl+j` | `ctrl+j` | Объединить строки |
| `ctrl+t` | | Поменять местами символы вокруг каретки |
| `ctrl+alt+left` / `ctrl+alt+right`, с Shift для выделения | | Перемещение по частям слова (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | Переключить блочный комментарий |
| `shift+alt+i` | `shift+alt+i` | Разбить выделение на строки |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | Расширить / сузить выделение |
| `cmd+u` | `ctrl+u` | Вернуться к предыдущим выделениям |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | Найти следующее / предыдущее совпадение |
| `cmd+e` | | Найти выделенное (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | Свернуть / развернуть строку каретки |
| `f12` | `f12` | Перейти к определению у каретки (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | Действия с кодом для выделения (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | Копировать / вырезать / вставить |

В macOS и iOS также работают текстовые клавиши Cocoa: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` перемещают, `ctrl+h` / `ctrl+d` удаляют.

Команды без клавиш по умолчанию, а также собственные команды приложения получают клавиши, которые приложение привязывает через [`keymap`](../modules/nsh.md#keymap), и выполняются через `run` ref:

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## Поиск и замена

`search` — то, что нужно найти: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. Совпадения подсвечиваются, а то, на котором стоит выделение, — сильнее; `onSearchChange` сообщает `{ result }`, `{ count, current, error }`: сколько всего совпадений, на каком из них стоит выделение (с 0) и почему регулярное выражение недопустимо. `findNext` и `findPrevious` выделяют следующее и предыдущее совпадение с переходом по кругу; `replace(text)` заменяет текущее совпадение и выделяет следующее, а `replaceAll(text)` заменяет все совпадения одной правкой и возвращает `{ count }` — их количество. В замене регулярного выражения на его группы ссылаются как `$1` и `${name}`.

`inSelection` ищет только внутри того, что было выделено в момент включения (внутри строк кареток, если выделения не было): область сохраняется, пока режим включён, в том числе при правках, пока выделение переходит от совпадения к совпадению. `findWithSelection` (`cmd+e` в macOS) сообщает выделенный текст или слово у каретки через `onFindWithSelection`, чтобы панель поиска взяла его как запрос.

Панель поиска — собственная для приложения:

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

<a id="diagnostics"></a>

## Диагностика

`diagnostics` отмечает проблемы, о которых сообщает языковой сервер или линтер: тонким волнистым подчёркиванием под каждым диапазоном цветом его уровня серьёзности (`error`, `warning`, `info`, `hint`). Позиции задаются строками и столбцами UTF-16, начиная с 0, как у языкового сервера, поэтому его диагностика проходит без преобразований. Отметки остаются на своём тексте, пока пользователь печатает, до тех пор, пока приложение не передаст новые; показ сообщений (список, всплывающая карточка у строки) остаётся за приложением.

Диагностика несёт и остальные поля `Diagnostic` языкового сервера. Её `tags` отображают текст так, как это делают языковые клиенты: код `unnecessary` (неиспользуемая переменная, недостижимый код) блёкнет, а код `deprecated` зачёркивается, в частях `unnecessaryText` и `deprecatedText`; подсказка с тегом отображается только в своём тексте. `codeDescription.href` — страница, описывающая её код (например, правило линтера), а `relatedInformation` перечисляет другие места, где о ней рассказано (`{ location: { uri?, range }, message }`): при наведении оба значения передаются приложению, которое показывает их в своей карточке и открывает страницу. Языковой сервер присылает теги числами (`1`, `2`); редактор принимает их имена.

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## Декорации

`decorations` стилизуют диапазоны, которые выбирает приложение: семантическая подсветка от языкового сервера, выполняемый оператор, строки, изменённые при ревью. `class` и `style` декорации задают стиль её текста; `lineClass` и `lineStyle` задают стиль строк, на которых она лежит, позади текста. Как и диагностика, декорации остаются на своём тексте при правках, пока приложение не задаст новые.

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### Метки в желобе и на обзорной линейке

`gutter` декорации ставит метку в полосе перед номерами строк, рядом с каждой строкой, которую покрывает её диапазон: строки, добавленные или изменённые в диффе системы контроля версий, или точка останова (пустой диапазон покрывает свою строку, как и с `lineClass`). С `placement: "before"` это линия поперёк полосы на границе перед началом диапазона, где строки были удалены. Ширина полосы — `gutterDecorationsWidth` пунктов (по умолчанию 3), и она остаётся, пока у декорации есть метка в желобе, поэтому текст не сдвигается, когда метки появляются и исчезают. Диапазон внутри свёрнутого блока отмечает строку этого блока.

`overviewRuler` декорации ставит метку на обзорной линейке — полосе вдоль правого края редактора шириной 14 пунктов (как у полосы прокрутки; другую ширину задаёт часть `overviewRuler`), которая, как в Monaco, отображает весь текст на свою высоту. Метка имеет высоту не менее 6 пунктов и занимает `lane` линейки: `left`, `center` (по умолчанию), `right` или `full`. Линейка показывается, пока у декорации есть на ней метка.

Каждая метка берёт `class` и `style` приложения, а без них рисуется цветом переднего плана. Обе следуют за правками так же, как диапазон декорации; правка, удаляющая отмеченный диапазон, оставляет на его месте пустой.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### Собственная подсветка

`token` декорации окрашивает её текст так, как встроенная подсветка окрашивает токен данного вида (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), вместо того, что нашёл там встроенный подсветчик: собственный подсветчик приложения (семантические токены языкового сервера, собственный парсер) сопоставляет свои токены с этими видами и получает цвета редактора для светлой и тёмной тем. Побеждает токен самой вложенной декорации; `class` и `style` применяются поверх него. `highlighting={false}` отключает встроенный подсветчик, так что текст окрашивают только токены приложения, а `language` по-прежнему определяет комментарии, скобки и отступы.

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## Сворачивание

Блоки сворачивания начинаются там, где строки сдвинуты глубже предыдущей. `foldRanges` даёт редактору собственные диапазоны приложения (`{ startLine, endLine }` — форма диапазонов сворачивания языкового сервера, которые передаются как есть): строка `startLine` показывает блок, а строки после неё до `endLine` сворачиваются. Они остаются на своих строках при правках, пока приложение не передаст новые.

Блоки вкладываются: при сворачивании блока вложенные в него остаются свёрнутыми, так что при разворачивании блока они выглядят как прежде. `foldRecursive` сворачивает блок и все блоки внутри него, `unfoldRecursive` разворачивает их все, `foldLevel(n)` сворачивает все блоки на уровне вложенности `n`, а `foldSelection` (или `foldRange(range)`) сворачивает любые строки, где бы ни начинались блоки. `onFoldChange` сообщает о свёрнутых диапазонах после каждого изменения, а `folds()` / `setFolds(ranges)` читают и восстанавливают их, чтобы хранить вместе с файлом.

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## Точки останова и контекстные меню

Нажатие на номер строки сообщает `onLineNumberPress({ line })` — место для точки останова, которую приложение рисует как декорацию. Вторичная кнопка (правый щелчок, Control-щелчок на Mac) сообщает `onContextMenu({ position, x, y })`: позицию в тексте под указателем и точку в корневом представлении, где приложение открывает собственное меню. На сенсорных экранах то же сообщают долгое нажатие, двойное касание, отпущенный маркер и касание выделения, с `selection`: рамка выделения в корневом представлении (`{ x, y, width, height }`), а также `x` / `y` в её верхней середине — для меню правки.

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## Языковые функции

Подсказки, информация при наведении, переход к определению и действия с кодом приходят от языкового сервера приложения. Редактор сам рисует список автодополнения, встроенное автодополнение и ссылку на определение, со своими клавишами; для остального он сообщает приложению моменты и места, а приложение рисует свои всплывающие окна ([`Overlay`](./overlay.md), привязанный к `pageBounds`).

<a id="completion"></a>

### Автодополнение

С `completion` редактор запрашивает у приложения варианты и показывает их списком под набираемым словом (над ним — у нижнего края окна):

- Ввод буквы, цифры или `_` в конце слова запрашивает варианты через `onCompletionRequest(event)`, триггер `"typing"`: у `event` есть `id`, `offset` и `position` курсора, `query` (набранная часть слова) и смещение `queryStart`, с которого оно начинается. Каждый из `completionTriggerCharacters` (`["."]`, `["::", "<"]`) после себя запрашивает варианты с пустым запросом, триггер `"character"` (и `character`), а `showCompletions()` или `run("showCompletions")` запрашивает варианты у курсора, триггер `"invoked"`.
- Приложение отвечает через `presentCompletions(event.id, items)`. Каждый элемент имеет форму `CompletionItem` языкового сервера: `label` и, по желанию, `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` и `range`. Показывается ответ на последний запрос; более ранний, а также ответ для слова, которое курсор уже покинул, отбрасывается.
- Дальнейший ввод фильтрует список на месте: запрос сопоставляется с `filterText` каждого элемента (иначе с его label) как буквы по порядку, без учёта регистра; сначала идут слова, начинающиеся с запроса, затем ближайшие совпадения, затем порядок по `sortText`. Совпавшие буквы выделяются. Передайте `incomplete: true` (`presentCompletions(id, items, true)`), чтобы редактор запрашивал варианты заново по мере ввода.
- Вверх и Вниз (а также Control+P / Control+N) перемещаются по списку, Page Up и Page Down — на страницу, Enter и Tab принимают вариант, Escape закрывает список. Указатель отмечает элемент, а щелчок (касание на сенсорных экранах) принимает его. `documentation` выбранного элемента показывается рядом со списком.
- Принятие заменяет `range` элемента (иначе запрос) его `insertText` (иначе label) одним шагом, который отменяется undo, у курсора и у каждого другого курсора с тем же текстом перед ним, и сообщает `onCompletionAccept({ item })`.
- Список закрывается, когда курсор покидает слово, при пробеле или другой пунктуации, когда редактор теряет фокус и когда курсор прокручивается за пределы видимой области.

Пауза в наборе (`inlineCompletionDelay`, по умолчанию 300 мс) при отсутствии списка запрашивает встроенное автодополнение: `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)` показывает `text` у курсора приглушённым цветом, Tab вставляет его, а Escape, правка или перемещение убирают.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### Наведения и нажатия

- `onHover(event)`: мышь остановилась над символом, ни одна кнопка не нажата (десктопы и веб; перетаскивание выделяет текст). У `event` есть `position`, его UTF-16 `offset`, `range` его слова, `pagePosition` указателя, `pageBounds` слова, зажатые `modifiers` и `diagnostics` в этом месте, сообщения которых показывает приложение. Переход к другому слову сразу сообщает о следующем наведении.
- `onHoverEnd()`: мышь покинула слово или редактор, либо текст изменился или прокрутился под ней.
- `onTextPress(event)`: символ был нажат после того, как редактор поставил в него курсор: `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` и `rangeBounds(range)`: где находятся курсор и диапазон, `{ bounds, pageBounds }` (в редакторе и в корневом представлении): там открывается всплывающее окно приложения.

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### Переход к определению и действия с кодом

Удерживаемая клавиша Mod (Command на macOS и iOS, Control на остальных платформах) превращает слова под мышью в ссылки, как в редакторах кода:

- Когда Mod удерживается над словом (нажата, пока мышь остановилась там, или мышь перешла туда с уже удерживаемой клавишей), редактор запрашивает через `onDefinitionRequest(event)`, триггер `"hover"`: у `event` есть `id`, `position` и `offset` символа и `range` слова. Отвечайте через `presentDefinitionLink(event.id, range)`, когда языковой сервер находит определение: диапазон подчёркивается (часть `definitionLink`), а указатель над ним становится рукой. Ссылка исчезает, когда Mod отпущена, мышь покидает её, текст меняется или прокручивается, либо по `hideDefinitionLink()`. Показывается ответ на последний запрос; более ранний отбрасывается.
- Щелчок с Mod по слову запрашивает определение с триггером `"press"`; при щелчке по ссылке курсор остаётся на месте. F12 (`goToDefinition`, `run("goToDefinition")`) запрашивает определение для слова у курсора, триггер `"key"`. Переход к определению выполняет приложение: `revealPosition` и `setSelections` для определения в том же тексте, собственная навигация — для другого файла.
- Mod+. (`showCodeActions`, `run("showCodeActions")`) сообщает `onCodeActionRequest({ range, position, bounds })`: основное выделение (начало первым), курсор и его рамку. Приложение запрашивает у языкового сервера действия, показывает своё меню в `bounds.pageBounds` ([`Menu`](./menu.md) или `Overlay`) и применяет правки выбранного действия через `edit(edits)`.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## Размер и прокрутка

С `minRows` и / или `maxRows` редактор растёт вместе с текстом: его высота равна высоте его строк, не менее `minRows` из них, а начиная с `maxRows` текст прокручивается, как в окне сообщения или ячейке блокнота. В остальных случаях размер задаёт приложение, а `scrollBeyondLastLine` позволяет тексту прокручиваться дальше последней строки: до экрана (`true`, по умолчанию), совсем нет (`false`) или на заданное число строк. При перемещении курсора вокруг него в поле зрения остаётся `cursorSurroundingLines` строк. Перетаскивание выделения за края редактора продолжает прокрутку, тем быстрее, чем дальше уходит указатель.

`showWhitespaces` показывает `·` для каждого пробела и `→` для каждой табуляции (часть `whitespace`), а `rulers` рисует линию в каждом из своих столбцов (часть `ruler`) как ориентиры длины строки.

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## Методы

`ref={editor}` даёт методы редактора (`EditorRef`) для кнопок, меню и клавиш приложения. Методы, возвращающие значение (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...), в JS возвращают `Promise` с ним, поэтому используйте `await`: `const text = await editor.value()`. Метод, которому передана строка за пределами текста (`fold`, `scrollToLine`, `goToLine`, ...), ничего не меняет и пишет в журнал предупреждение с именем метода и строкой.

| Метод | Описание |
|---|---|
| `focus()`, `blur()` | Берёт фокус или отдаёт его. |
| `value()` | `Promise<string>`: текст. |
| `setValue(value)` | Заменяет текст как правку, которую отменяет undo. |
| `insert(text)` | Вводит `text` в каждое выделение как есть (скобки не закрываются). |
| `edit(edits)` | Применяет замены `{ range, text }` (диапазоны текущего текста; замена, пересекающаяся с более ранней, пропускается) одним шагом, который отменяет undo; выделения смещаются вместе с окружающим текстом. Сюда идут правки действий с кодом и форматирования. |
| `selections()` | `Promise<EditorSelection[]>`: каждое выделение, `{ anchor, head }`, основное (новейшее) последним. |
| `setSelections(selections)` | Задаёт выделения (последнее — основное) и прокручивает основное в область видимости. |
| `run(command)` | Выполняет команду, как это сделали бы её клавиши ([Commands](#commands)). |
| `replace(text)` | Заменяет текущее совпадение и выделяет следующее. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: заменяет все совпадения одной правкой; `{ count }` — сколько их. |
| `fold(line)`, `unfold(line)` | Сворачивает строки под строкой `line` (с 0) или разворачивает их. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | Сворачивает блок на строке `line` и каждый блок внутри него или разворачивает их все. |
| `foldLevel(level)` | Сворачивает каждый блок на уровне вложенности `level` (1: самый внешний). |
| `foldRange(range)` | Сворачивает строки `range` (`{ startLine, endLine }`), где бы ни начинались блоки. |
| `folds()` | `Promise<EditorFoldRange[]>`: свёрнутые диапазоны, включая вложенные. |
| `setFolds(folds)` | Сворачивает ровно `folds`. |
| `scrollToLine(line)` | Прокручивает строку `line` в область видимости, разворачивая то, что её скрывает. |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: есть ли правка, которую можно отменить или повторить. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: рамка основного курсора, `{ bounds, pageBounds }`, в редакторе (с учётом прокрутки) и в корневом представлении; `null` до компоновки редактора. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: рамки `range`, по одной на каждую покрываемую строку. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: насколько прокручен текст; прокручивает его до `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>`: текст, который показывает область просмотра, от начала её первой строки до конца последней. |
| `selectedText()` | `Promise<string>`: текст основного выделения. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: между UTF-16-смещениями `value()` и позициями. |
| `revealPosition(position, center)` | Прокручивает `position` в область видимости, разворачивая то, что её скрывает; в середину — с `center`. |
| `goToLine(line)` | Ставит курсор в начало строки `line` (с 0) и прокручивает её в середину. |
| `showCompletions()` | Запрашивает варианты автодополнения у курсора, запросом служит слово перед ним ([Completion](#completion)). |
| `presentCompletions(id, items, incomplete?)` | Отвечает на запрос автодополнения `id`: список показывает `items`, отфильтрованные по набранному с тех пор; с `incomplete` дальнейший ввод запрашивает варианты заново. Без элементов список закрывается. |
| `hideCompletions()` | Закрывает список автодополнения. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | Отвечает на запрос встроенного автодополнения `id` через `text`, показываемое у курсора; убирает его. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | Отвечает на запрос определения `id` (триггер `"hover"`): `range` подчёркивается как ссылка ([Go to definition](#go-to-definition-and-code-actions)); скрывает её. |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### Команды

`run` принимает команды редактора по имени (`EditorCommand`):

| Команды | Что делают |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | Перемещают каретки. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | Расширяют выделения. |
| `moveToMatchingBracket` | К скобке, парной той, что находится у каретки. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | Выделяют. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | Перемещают или расширяют выделение на часть слова («горбы» camelCase, части snake_case). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | Перемещают или расширяют до пустой строки перед абзацем или после него. |
| `expandSelection`, `shrinkSelection` | Увеличивают выделения на одну единицу или возвращают назад. |
| `undoSelection`, `redoSelection` | Возврат к выделениям, бывшим до последнего перемещения, или снова вперёд. |
| `splitSelectionIntoLines` | Одно выделение на каждую строку каждого выделения. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | Добавляют каретку; возврат к одному выделению. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | Удаляют. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | Строки, отступы и комментарии. |
| `sortLinesAscending`, `sortLinesDescending` | Сортируют выделенные строки (все строки, если есть только каретка). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | Меняют регистр выделений (для каретки — её слова). |
| `trimTrailingWhitespace` | Удаляет пробельные символы в конце каждой строки. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | Переставляют. |
| `undo`, `redo` | Отмена и повтор. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | Сворачивают блок на строке каретки или всё. |
| `foldRecursive`, `unfoldRecursive` | Сворачивают блок каретки и все вложенные в него блоки или разворачивают их. |
| `foldSelection` | Сворачивают строки каждого выделения, охватывающего несколько строк. |
| `findNext`, `findPrevious` | Выделяют следующее или предыдущее совпадение `search`. |
| `findWithSelection` | Сообщает выделенный текст для панели поиска (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | Буфер обмена. |
| `showCompletions` | Запрашивает варианты автодополнения у каретки ([Автодополнение](#completion)). |
| `goToDefinition` | Запрашивает определение слова у каретки (`onDefinitionRequest`, триггер `"key"`). |
| `showCodeActions` | Запрашивает действия с кодом для выделения (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## Стилизация частей

`class` и `style` стилизуют блок редактора. `classes` принимает классы Tailwind по частям, а `styles` — встроенные стили по частям; классы части идут после её собственных стилей по умолчанию, поэтому имеют приоритет, а её `styles` имеют приоритет над её классами. Шрифт задаётся через `fontFamily`, `fontSize` и `lineHeight`; в нём редактор измеряет свой текст.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| Часть | Что это | По умолчанию |
|---|---|---|
| `gutter` | Колонка номеров строк и маркеров сворачивания | 12pt перед номерами, 4pt после маркеров |
| `lineNumber` | Каждый номер строки | По правому краю, `muted-foreground` |
| `activeLineNumber` | Номера строк с кареткой, после `lineNumber` | `foreground` |
| `foldMarker` | Маркер строки, где начинается блок сворачивания | `⌄`, `›` в свёрнутом виде, `muted-foreground` |
| `overviewRuler` | Обзорная линейка вдоль правого края, пока там есть метка декорации | нет |
| `content` | Область текста рядом с боковым полем | 4pt перед текстом |
| `line` | Каждая строка текста | |
| `activeLine` | Под строками с кареткой, ниже индикаторов прокрутки | `muted`, бледный |
| `selection` | Под выделенным текстом | Оттенок `primary` |
| `caret` | Каретки | Шириной 2pt, `foreground`, мигают |
| `composition` | Текст, который набирается через метод ввода | Подчёркнут |
| `searchMatch` | Совпадения `search` | Полупрозрачный янтарный |
| `currentSearchMatch` | Совпадение, на котором стоит выделение, после `searchMatch` | Более насыщенный янтарный |
| `matchingBracket` | Скобка у каретки и парная ей | Рамка 1pt |
| `indentGuide` | Направляющая на каждый уровень отступа | Линия 1pt цвета `border` |
| `foldPlaceholder` | Что свёрнутая строка показывает после своего текста | ` ⋯ `, `muted-foreground` |
| `placeholder` | Показывается, пока текст пуст | `muted-foreground` |
| `diagnosticError` | Линия под ошибкой | `destructive` |
| `diagnosticWarning` | Линия под предупреждением | Янтарная |
| `diagnosticInfo` | Линия под информационным сообщением | Синяя |
| `diagnosticHint` | Линия под подсказкой | `muted-foreground` |
| `unnecessaryText` | Текст диагностики `unnecessary` | `muted-foreground` |
| `deprecatedText` | Текст диагностики `deprecated` | Зачёркнут |
| `whitespace` | Метки пробелов и табуляций (`showWhitespaces`) | `·` и `→`, `muted-foreground` при 60 % |
| `ruler` | Линии `rulers` | Линия 1pt цвета `border` |
| `selectionHandle` | Ручки маркеров на концах выделения при касании | Точка 10pt цвета `primary` |
| `selectionHandleStart`, `selectionHandleEnd` | Ручка начала (над его строкой) и ручка конца (под ней), после `selectionHandle` | |
| `completionMenu` | Блок списка автодополнения | `popover`, `border` 1pt, скруглённые углы, тень |
| `completionItem` | Каждый элемент списка | Высота строки, отступ 8pt |
| `selectedCompletionItem` | Выбранный элемент, после `completionItem` | `accent` |
| `completionMatch` | Буквы метки, совпавшие с запросом | Полужирный, `primary` |
| `completionDetail` | Детали элемента, после его метки | По правому краю, `muted-foreground` |
| `completionKind` | Вид элемента, перед его меткой | Короткое имя (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | Документация выбранного элемента, рядом со списком | Как `completionMenu`, шириной не более 320pt |
| `inlineCompletion` | Встроенное автодополнение у каретки | `muted-foreground` |
| `definitionLink` | Подчёркивание ссылки на определение | Линия 1pt цвета `primary` под текстом |

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Текст, управляемый приложением (задайте его снова из `onChange`). |
| `defaultValue` | `.default_value(..)` | `string` | | Начальный текст, когда редактор хранит текст сам. |
| `language` | `.language(..)` | `string` | обычный текст | Название языка, псевдоним, расширение или имя файла ([Языки](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | Показывается, пока текст пуст. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | Текст можно выделять и копировать, но не менять. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Получает фокус при появлении. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Номера строк в боковом поле. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Длинные строки переносятся по ширине редактора. |
| `tabSize` | `.tab_size(..)` | `number` | по языку | Число колонок в табуляции и в уровне отступа. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | по языку | Отступы делаются табуляциями. |
| `folding` | `.folding(..)` | `boolean` | `true` | Строки с отступом сворачиваются маркерами бокового поля. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | по отступам | Где начинаются блоки сворачивания, задаёт приложение ([Сворачивание](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | Встроенная подсветка синтаксиса ([Собственная подсветка](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | Скобки и кавычки закрываются при вводе. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | Новая строка сохраняет отступ и добавляет отступ после открывающей скобки. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | Строки с кареткой подсвечиваются. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | Направляющие отступов. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | Текст прокручивается за последнюю строку: до одного экрана (`true`), вообще не прокручивается (`false`) или на указанное число строк. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` темы | Шрифт, которым текст рисуется и измеряется. |
| `fontSize` | `.font_size(..)` | `number` | `13` | Размер шрифта в пунктах. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | Высота строки в пунктах. |
| `search` | `.search(..)` | `EditorSearch` | | Что искать ([Поиск и замена](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | Проблемы для пометки ([Диагностика](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | Диапазоны, которые стилизует приложение ([Декорации](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | Ширина полосы меток декораций в боковом поле, в пунктах. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | Классы Tailwind по частям. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | Встроенные стили по частям, поверх классов. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | Как скринридеры называют редактор. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | Пробелы и табуляции отображаются как `·` и `→`. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | Колонки, у которых рисуется вертикальная линия. |
| `minRows` | `.min_rows(..)` | `number` | | Редактор растёт вместе с текстом, начиная с этого числа строк ([Размер и прокрутка](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | Редактор растёт вместе с текстом до этого числа строк, затем прокручивается. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | Число строк, остающихся в поле зрения выше и ниже каретки. |
| `completion` | `.completion(..)` | `boolean` | `false` | Редактор запрашивает подсказки и показывает их списком ([Автодополнение](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | Что ещё запрашивает автодополнение при вводе. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | Пауза в наборе в миллисекундах, после которой запрашивается встроенное автодополнение. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | | Блок редактора. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | Текст изменился: `{ value }` — весь новый текст. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | Выделения изменились: `{ selections }` — все, основное последним. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | Редактор получил или потерял фокус. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | Совпадения поиска изменились: `{ result }` — `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | Нажат номер строки: `{ line }` — строка, отсчёт с 0. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | Нажата дополнительная кнопка над текстом или касанием выделен текст: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | Указатель мыши остановился над символом ([Возможности языка](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | Наведение закончилось. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | Нажат символ: передаются его слово, модификаторы и число кликов. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | Выполнена команда `findWithSelection`: `{ query }` — текст для запроса панели поиска. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | Свёрнутые диапазоны изменились: `{ folds }` — все, включая вложенные. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | Редактор запрашивает автодополнение: `{ id, offset, position, query, queryStart, trigger, character? }` ([Автодополнение](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | Элемент принят и вставлен: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | Набор приостановлен: `{ id, offset, position }`, для встроенного автодополнения. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | Редактор запрашивает определение: `{ id, position, offset, range, trigger }` ([Переход к определению](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | Пользователь запросил действия с кодом: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## Доступность

Скринридеры называют редактор по его `accessibilityLabel`; его фокус устроен так же, как у текстового поля ввода, поэтому текстовые службы платформы (методы ввода, диктовка, экранные клавиатуры) работают в нём.

<a id="related"></a>

## См. также

- [TextView](./text-view.md): документы Markdown и HTML, блоки кода в которых используют те же цвета синтаксиса, что и редактор.
- [DiffView](./diff-view.md): изменения между двумя текстами в цветах синтаксиса редактора.
- [Input](./input.md): однострочные и многострочные текстовые поля со штатным редактированием платформы.
- [`keymap`](../modules/nsh.md#keymap): клавиши приложения для команд редактора.
- [`nsh/base`](../modules/nsh-base.md): остальные базовые компоненты.
