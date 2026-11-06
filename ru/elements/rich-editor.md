---
title: "RichEditor"
description: "Редактор форматированного текста из nsh/base: документы, определяемые схемой приложения, команды, плагины, история, keymaps, input rules и Markdown. Построен по архитектуре ProseMirror, а его состояние хранится в Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---

# RichEditor

`RichEditor` — это редактор форматированного текста, построенный по архитектуре ProseMirror. Приложение определяет, из чего состоит документ, с помощью схемы (абзацы, заголовки, списки, упоминания — любые нужные типы узлов и марок), а редактор следит, чтобы каждый документ ей соответствовал. Изменения — это шаги, сгруппированные в транзакции, поэтому их можно отменять, они отображают позиции и передаются как JSON. Поведение задают плагины (история, привязки клавиш, правила ввода, сочетания Markdown, собственные плагины приложения). Команды — это значения, которые панель инструментов выполняет и о которых спрашивает. Состояние редактора, его команды и плагины работают в Rust: набор текста, привязки клавиш и правила ввода никогда не ждут JS, а приложение читает состояние как JSON, когда запрашивает его.

У редактора две части: сессия (`createRichEditor`), которая владеет состоянием и которой управляет код приложения, и представление (`<RichEditor editor={…} />`), которое отображает сессию нативно и превращает ввод платформы в транзакции. Одну сессию могут показывать несколько представлений.

Ядро редактора — порт на Rust библиотеки [ProseMirror](https://prosemirror.net) авторства Marijn Haverbeke, а его слой расширений следует [Tiptap](https://tiptap.dev): их структуры данных, команды и имена перенесены, как и ваш опыт работы с ними. Обе библиотеки распространяются под лицензией MIT, и их лицензии действуют для портированного из них.

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

Без `schema` редактор использует стартовую схему (`starterSchema()`); без `plugins` он получает стартовый набор (`starterKit()`: правила ввода и привязки клавиш стартовой схемы, базовые привязки клавиш и история). Пустой массив `plugins` создаёт редактор вообще без плагинов.

<a id="styling"></a>

## Стилизация

Редактор рисует документ в стиле приложения: `classes` и `styles` стилизуют его части (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker`, а для таблиц `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`) и его узлы по типу (`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). Элементы списков, у которых node spec задаёт `extra.listMarker` в `"bullet"` или `"ordered"` (списки стартовой схемы), показывают маркер в части `listMarker`: `•`, `◦`, `▪` в зависимости от глубины, либо номера, начиная со значения `start` списка. Маркер размещается перед элементом, в отступе списка (`pl-6` у списка — так браузер делает отступ для `ul`).

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

Часть `content` — это блок документа внутри прокручиваемой области редактора: её padding (`content: "px-6 py-5"`) — это поля вокруг текста, а полоса прокрутки проходит по собственному краю редактора. Перетаскивание с выделением за верхнюю или нижнюю границу редактора прокручивает документ, и тем быстрее, чем дальше уходит указатель.

### Bubble menu

`bubbleMenu` — это bubble menu из Tiptap: содержимое приложения, показываемое рядом с выделением, по умолчанию над ним (`bubbleMenuPlacement`, с переключением на другую сторону, если места нет) на расстоянии `bubbleMenuOffset` пунктов (8), в оверлее, который следует за текстом при прокрутке. Приложение передаёт его, пока хочет его показывать, исходя из состояния сессии:

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

Меню ссылки редактирует ссылку под кареткой с помощью `chain([extendMarkRange("link"), command("setLink", { href })])` и удаляет её с помощью `command("unsetLink")` после того же `extendMarkRange`.

<a id="schemas"></a>

## Схемы

`defineSchema(spec)` читает схему в формате ProseMirror и выбрасывает исключение с описанием того, что в ней не так. Типы узлов задают свой `content` (выражение содержимого: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), свою `group`, являются ли они `inline` или `atom`, допустимые `marks` и свои `attrs` со значениями по умолчанию и валидацией (`"string"`, `"number"`, `"boolean"`). Первый блочный тип — тип по умолчанию: его создаёт Enter и им заполняется обязательное содержимое. Ключи, которых spec не знает, сохраняются как дополнительные данные типа — для фреймворков, построенных на редакторе.

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

`RichSchema` читает и записывает документы: `parse(content, format?)` (по умолчанию простой текст, `"markdown"` или JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (по умолчанию Markdown, `"text"`, `"json"`) и `check(doc)`, который возвращает документ с заполненными значениями атрибутов по умолчанию. `nodes`, `marks` и `topNode` задают имена его типов. Markdown сопоставляется с именами стартовой схемы (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`).

<a id="commands"></a>

## Команды

Команда — это значение: `toggleMark("bold")` создаёт объект, который приложение хранит, привязывает к клавишам и передаёт редактору. `editor.run(command)` выполняет её и возвращает, была ли она применена; `editor.can(command)` спрашивает, ничего не меняя, — так панель инструментов включает свои кнопки. `editor.isActive(name, attrs?)` сообщает, активна ли марка или узел в выделении (`isActive("heading", { level: 2 })`).

| Команда | Что делает |
| --- | --- |
| `toggleMark(name, attrs?)` | Добавляет марку к выделению или убирает её там, где она есть; у курсора — для следующего вводимого текста |
| `setMark(name, attrs?)` / `unsetMark(name)` | Добавляет или убирает марку |
| `setBlockType(name, attrs?)` | Превращает выделенные текстовые блоки в блоки заданного типа (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | Оборачивает выделенные блоки в узел (цитату) / поднимает их из родителя |
| `wrapInList(name, attrs?)` | Оборачивает выделенные блоки в список |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | Разделяет элементы списка, увеличивает или уменьшает их отступ |
| `undo()` / `redo()` | Отменяет или повторяет изменение (с `history()`) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | Выделяет |
| `insertText(text)`, `insertContent(content, format?)` | Вставляет текст или содержимое поверх выделения |
| `setNodeAttribute(pos, attr, value)` | Задаёт атрибут узла в заданной позиции как одно отменяемое изменение |
| `command(name)` | Команда без параметров по имени: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | Выполняет команды одну за другой как одну транзакцию (один шаг отмены); применяется, только если применилась каждая |
| `first(commands)` | Выполняет первую применимую команду |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## Сессия

| Элемент | Что это |
| --- | --- |
| `state`, `doc`, `selection` | Состояние, документ и выделение в виде JSON, создаваемого при чтении |
| `revision` | Сколько транзакций применило состояние |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | Что интерфейс показывает о редакторе |
| `setContent(content, format?)` | Заменяет документ как одно отменяемое изменение |
| `insertContent(content, format?)` | Вставляет содержимое поверх выделения |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | Документ в заданном формате |
| `dispatch(tr)` | Применяет транзакцию, заданную как JSON (её шаги применяются к текущему документу) |
| `on(event, listener)` | Вызывает `listener` с данными каждого `event` на следующем такте JS: `revision` (`{ revision }`, после каждого изменения, из любого источника), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. Возвращает функцию, которая останавливает подписку; слушатель, добавленный во время рендера компонента, останавливается вместе с компонентом |
| `focus()`, `blur()` | Переводит фокус клавиатуры на представления, показывающие редактор, или с них |

Позиции считаются так же, как в ProseMirror: текст считается в кодовых единицах UTF-16, листовой узел — за одну единицу, узел с содержимым — за две границы. Всё, что должно пережить правки, хранит id в атрибутах узла или в марке. Запрос позиции (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) выбрасывает `RangeError` для позиции вне документа (от `0` до `doc.content.size`), как `resolve` в ProseMirror, и возвращает `null`, когда там ничего нет (`nodeAt` в конце узла, `coordsAtPos`, если редактор не показывает ни одно представление). `run` и `can` выбрасывают `TypeError` для неизвестной редактору команды, типа узла или марки.

<a id="taking-over-transactions"></a>

### Перехват транзакций

`editor.dispatchTransaction = (tr) => { … }` заставляет приложение фиксировать каждую транзакцию самостоятельно: обработчик получает каждую как JSON и фиксирует её с помощью `editor.applyTransaction(tr)` либо отбрасывает. Это используют совместное редактирование, логирование и транзакции, которые должны пройти проверки приложения; `null` возвращает фиксацию редактору. Обработчик узнаёт о наборе текста на следующем такте JS, а документ меняется, когда обработчик фиксирует транзакцию.

<a id="extensions"></a>

## Расширения

Расширения устроены как в Tiptap: каждое приносит вместе свой тип узла или марки, привязки клавиш, правила ввода и вставки, плагины и именованные команды, а редактор, созданный из расширений, получает из них схему, keymap, правила и таблицу команд. Встроенные расширения — это классы с теми же именами, что в Tiptap; их используют как есть или настраивают:

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` приносит `Document`, `Paragraph`, текстовый узел, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (`Image` в Tiptap), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (`Link` в Tiptap), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (`TextStyle` в Tiptap), `TextAlign`, `History`, `TrailingNode`, `Typography` и `ListKeymap`. Опция с именем одного из них, установленная в `false`, исключает его, а объект настраивает его (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). `configure(options)` и `extend({...})` каждого класса создают `RichExtension`, у которого есть `name`, `type`, `priority` и `options`. Каждый редактор также получает базовый keymap (Enter, Backspace, Delete, выделить всё).

Каждое расширение добавляет команды Tiptap, которые выполняет `command(name, args)`: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, а также команды ссылок, подсчёта символов и suggestion, описанные ниже.

Переключатели списков работают с целыми списками, как кнопки списков в текстовом процессоре: `toggleOrderedList` в маркированном списке нумерует его на каждом уровне, включая вложенные списки, а собственный переключатель списка выводит выделенные блоки из каждого окружающего списка.

Порядок `extensions` определяет их приоритет среди равных: расширение, указанное позже, привязывает свои клавиши раньше предыдущих; `priority` (по умолчанию 100) ранжирует их иначе. С `extensions` `plugins` редактора идут после плагинов расширений.

<a id="the-apps-extensions"></a>

### Расширения приложения

`defineExtension` создаёт расширение. Его функции выполняются один раз, при создании редактора с этим расширением, получают опции расширения и возвращают данные: команды, правила и плагины, созданные описанными выше фабриками.

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` или `mark` (в форме `defineSchema`) делает его расширением узла или марки; `addGlobalAttributes` добавляет атрибуты другим типам; `addProseMirrorPlugins` возвращает плагины, включая `RichEditorPlugin`; `addPasteRules` возвращает правила `textRule` и `markRule` для вставляемого текста. `extend({...})` встроенного класса заменяет части, которые он даёт: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

Крейт приложения регистрирует расширения, написанные на Rust, через свой набор UI, и JS берёт их по имени:

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` также находит каждое встроенное расширение по его имени (`"text"`, `"bold"`, ...).

<a id="plugins"></a>

## Плагины

| Фабрика | Что добавляет |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | История отмены; изменения в пределах `newGroupDelay` миллисекунд (500) отменяются вместе |
| `keymap(bindings)` | Команды по имени клавиши: `"Mod-b"` (Cmd на платформах Apple, Ctrl на остальных), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter, Backspace, Delete, выделить всё и клавиши редактирования текста платформы |
| `starterKeymap()` | Привязки стартовой схемы: марки, заголовки, списки, блоки кода, жёсткие переносы |
| `inputRules(rules)` | Текст перед курсором, подходящий под правило, превращается в то, что создаёт правило; Backspace сразу после этого отменяет превращение |
| `markdown(options?)` | Markdown при наборе, вставка Markdown и копирование в Markdown (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | Правила ввода и привязки стартового набора, базовые привязки и история |

Положение плагина в списке — его приоритет: keymap и правила ввода, стоящие в списке раньше, обрабатывают клавишу или текст первыми. Правила ввода приходят из `markdownRules()` (заголовки, цитаты, списки, ограждения кода, горизонтальные линии, распространённые марки), `typographyRules()` (умные кавычки, многоточие, длинное тире), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` и `textblockRule(match, node)`. `match` правила — это регулярное выражение, оканчивающееся на `$`, которое сопоставляется с текстом перед курсором.

<a id="the-apps-plugins"></a>

### Плагины приложения

`new RichEditorPlugin(key)` создаёт плагин с поведением приложения, которое задаётся цепочкой вызовов:

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)`: пока `capturing` истинно, редактор перехватывает эти клавиши и сразу после этого сообщает `handler`, какая из них была нажата; клавиатура остаётся такой же быстрой, как без плагина.
- `editor.setDecorations(key, decorations)`: inline-атрибуты, атрибуты узлов и виджеты, которые представление рисует поверх документа, не меняя его. Они следуют за каждым изменением, пока не будут заданы заново.
- `filterTransaction(hook)` и `appendTransaction(hook)` видят транзакции, которые создают собственные вызовы приложения (`run`, `dispatch`, `setContent`, …) в этом вызове: `filterTransaction` может отбросить одну, `appendTransaction` может вернуть ещё одну для применения вместе с ней. `on("revision", …)` слышит каждое изменение, включая набор текста.
<a id="links-character-counts-and-suggestions"></a>

## Ссылки, подсчёт символов и подсказки

Три плагина реализуют поведение Link, CharacterCount и Suggestion из Tiptap, и всё это работает нативно:

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)`: URL, набранный перед пробелом или Enter, становится ссылкой, как и URL в вставленном тексте (`autolink`);
  URL, вставленный поверх выделения, превращает выделение в ссылку (`linkOnPaste`); нажатие на ссылку с зажатым Mod или при
  редакторе только для чтения открывает её через обработку URL приложения (`openOnClick`); `enableClickSelection` по нажатию выделяет
  всю ссылку. URL распознаются с протоколом и без него (`nsh.dev`, `https://nsh.dev/docs`, адреса электронной
  почты), а протокол, который получает голый хост, — `defaultProtocol` (`http`). Ссылки допускают протоколы `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` и те, что указаны в `protocols`, поэтому
  `setLink({ href })`, `toggleLink(attrs?)` и автоматическое создание ссылок не пропускают скрипты (`javascript:`) и data URL.
  `unsetLink()` убирает ссылку вокруг выделения.
- `characterCount(options?)`: `editor.characters(mode?)` считает символы текста (`"textSize"`, единицы UTF-16, как
  `length` в JS) или позиции документа (`"nodeSize"`); `editor.words()` считает слова (по границам слов Unicode). При заданном `limit` изменения, которые вышли бы за лимит, отклоняются, а вставляемое содержимое обрезается до допустимого объёма;
  первый документ, превышающий лимит, обрезается (`autoTrim`). `setCharacterLimit(limit)` меняет лимит, а
  `editor.characterLimit` читает его.
- `suggestion(options?)`: отслеживает триггер (`char`, по умолчанию `@`), набранный перед курсором. `allowSpaces` позволяет
  запросу содержать пробелы, `allowedPrefixes` перечисляет, что может стоять перед триггером (по умолчанию пробел; `anyPrefix` допускает
  что угодно), `startOfLine` требует, чтобы триггер стоял в начале строки (командное меню `/`). `editor.suggestion(key)` даёт
  `{ active, range, query, text, lastKey, keyCount }`; активный диапазон несёт `decorationClass` приложения (и
  `decorationEmptyClass`, пока запрос пуст). Пока подсказка активна, клавиши из `captureKeys` принадлежат
  списку приложения: редактор перехватывает их и записывает последнюю из них в состояние, а Escape закрывает
  подсказку (`exitSuggestion(key)` тоже). `replaceSuggestion(content, key?)` заменяет триггер и запрос
  текстом или JSON-содержимым.
- `withMention(schema, { name?, char? })` добавляет узел mention из Tiptap: встроенный атом с `id`, `label` и своим
  триггером, который записывается как `@label` в тексте и как `<span data-type="mention">` в HTML. `insertMention(range, id, label?)`
  заменяет диапазон подсказки на упоминание и пробел.

Всплывающее окно принадлежит приложению: оно читает состояние подсказки, размещается в `coordsAtPos(range.from)` и рисует
элементы по-своему.

<a id="tables"></a>

## Таблицы

`TableKit` приносит таблицы Tiptap: `RichTable` (`Table` в Tiptap), `RichTableRow`, `RichTableHeader` и
`RichTableCell`. Он добавляется рядом с `StarterKit`:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

Таблица принимает параметры `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) и `HTMLAttributes`; `TableKit.configure({ tableHeader: false })` позволяет исключить одно
расширение. Ячейки содержат блоки и имеют `colspan`, `rowspan` и `colwidth` (ширина в пунктах для каждого столбца, который они
занимают); у строк есть `height`.

Tab и Shift-Tab перемещают между ячейками, а Tab в последней ячейке добавляет строку. Клавиши со стрелками у края ячейки переходят в
соседнюю ячейку; Shift со стрелкой или перетаскивание через ячейки выделяет прямоугольник ячеек (выделение типа
`"cell"`, у которого `anchor` и `head` — позиции перед его первой и последней ячейками). Backspace и Delete очищают
выделенные ячейки и удаляют таблицу, если выделены все её ячейки.

В редакторе таблица представляет собой сетку из ячеек: каждый столбец имеет ширину, равную `colwidth` его ячеек, а столбцы без неё
делят оставшееся место (шириной не менее `cellMinWidth`), каждая строка не ниже своего `height`. Внешний вид по умолчанию берётся из темы: сетка
`border` толщиной 1 пункт, ячейки заголовка на `muted`, ячейки с отступами, а каждая выделенная ячейка закрашена частью `selectedCell` в
цвет выделения. `classes.nodes` (`table`, `tableCell`, `tableHeader`) и части позволяют изменить
весь этот внешний вид. Клавиши «Вверх» и «Вниз» на первой или последней строке ячейки переходят к ячейке выше или ниже.

Пока документ можно редактировать:

- На десктопах правая граница каждого столбца и нижняя граница каждой строки позволяют менять их размер: указатель показывает
  курсор изменения размера и линию `tableResizeHandle`, таблица следует за перетаскиванием, а при отпускании `colwidth` или
  `height` задаётся за один шаг, который отмена возвращает назад. `resizable: false` отключает это, `lastColumnResizable: false` сохраняет
  ширину последнего столбца.
- Таблица, в которой находится выделение, показывает рукоятки (`tableGrip`) на верхней границе над каждым столбцом и на левой границе
  рядом с каждой строкой. Нажатие на рукоятку выделяет этот столбец или строку; перетаскивание на десктопах показывает, куда он будет перемещён
  (`tableDropIndicator`), и при отпускании перемещает его туда.

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

Команды, каждая из которых является помощником `nsh/base`:

- `insertTable({ rows, cols, withHeaderRow })` (по умолчанию 3 × 3 со строкой заголовка) и `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()` и `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()` и `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` и `fixTables()`, который исправляет таблицы с отсутствующими или перекрывающимися ячейками.
- `moveTableRow({ from, to, select })` и `moveTableColumn({ from, to, select })` перемещают строку или столбец вместе
  со строками или столбцами, которые занимают их объединённые ячейки; `setColumnWidth({ col, width })` и
  `setRowHeight({ row, height })` задают их размер (`null` подгоняет размер под содержимое). Они принимают `table` — позицию
  перед таблицей, — чтобы действовать на таблицу, отличную от таблицы в выделении.

Таблицы читаются из HTML и записываются в него (`<table>` с `<th>` / `<td>`, `colspan`, `rowspan` и `data-colwidth`), а также в
Markdown: таблица со строкой заголовка, ячейки которой состоят каждая из одного абзаца, записывается как таблица GFM с вертикальными чертами, а любая другая таблица
записывается как её HTML, который читается обратно так же. В виде простого текста строка — это строка текста из её ячеек, разделённых табуляцией.
