---
title: "TextView"
description: "Компонент TextView: Markdown, HTML или документ из блоков, отображаемый с помощью нативного текста и представлений, со стилизацией по частям, для ответов AI-чата, статей и справочных страниц."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` показывает документ, написанный на Markdown, на HTML или в виде блоков, которые строит приложение: заголовки, абзацы, выделение, ссылки, списки и списки задач, цитаты и alerts GitHub, код, таблицы, изображения, формулы, сноски и раскрывающиеся блоки. Он создан для ответов ИИ-моделей в чате: ответ приходит потоком в виде Markdown, и каждый фрагмент показывает текст с уже применённым форматированием. Разбор выполняется на Rust, а документ рисуется элементами и представлениями [`Text`](./text.md).

Он сам отвечает за поведение и поставляется со своей типографикой для чтения: текст 15pt с просторными строками 25.5pt, заголовки semibold с отступом сверху, ссылки, подчёркнутые цветом `primary` темы, код шрифтом `font-mono` темы в рамке со скруглёнными углами, таблицы с линиями со всех сторон и тонированной строкой заголовка, цитаты с линией сбоку и alerts в виде тонированных блоков со значком в цветах alerts GitHub. Его цвета — токены темы (`foreground`, `muted-foreground`, `border`, `muted`, `primary` и `destructive` для предупреждения), поэтому тема и тёмное оформление действуют и здесь. Каждая часть принимает стили приложения поверх этих значений по умолчанию: `classes` и `styles` в TSX, типизированные стили по частям (`TextViewParts`) в Rust. В Rust его создаёт `nsh_base::text_view()`, в TSX — `<TextView>` из `nsh/base`.

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view, theme};
use nsh_core::prelude::*;

const README: &str = "# Release notes

**Faster lists** and a new `TextView`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with `TextViewParts`.";

fn release_notes() -> impl IntoElement {
    scroll().flex_1().child(
        text_view()
            .markdown(README)
            .on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| log::info!("open {url}"))
            .p_5()
            .text_base()
            .text_color(theme().foreground),
    )
}
```

```tsx tabs
import { mount, Scroll } from "nsh";
import { TextView } from "nsh/base";

const README = `# Release notes

**Faster lists** and a new \`TextView\`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with \`classes\`.`;

function App() {
  return (
    <Scroll class="flex-1" contentClass="p-5">
      <TextView
        markdown={README}
        class="text-base text-neutral-900 dark:text-neutral-100"
        classes={{
          heading1: "text-3xl",
          code: "rounded bg-neutral-100 dark:bg-neutral-800",
          link: "text-blue-600",
          alertTip: "border-l-4 border-green-600 pl-3",
        }}
        onLinkPress={({ url }) => console.log("open", url)}
      />
    </Scroll>
  );
}

mount(App);
```

В Rust `text_view()` создаёт его так же, как `view()` создаёт представление: сеттер для каждого свойства (`.markdown(..)`, `.options(..)`, `.selectable(..)`), замыкание для каждой render-функции (`.render_image(|image| ..)`), слушатель для каждого события (`.on_link_press(..)`) и типизированные методы стилей для корня (`.p_5()`, `.text_color(..)`), текстовые стили которого передаются всем частям.

<a id="built-on-text"></a>

## Построен на Text

`TextView` состоит из элементов [`Text`](./text.md), и его текст ведёт себя ровно так, как описано на странице Text. Каждый абзац, заголовок, ячейка таблицы и блок кода — это один нативный `Text`: один блок, который выполняет раскладку, переносит строки, следует масштабу шрифта и, с `selectable`, выделяется и копируется. Жирный, курсив, зачёркнутый текст и другие встроенные пометки — это его [спаны](./text.md#spans); встроенный код — спан с [фоном спана](./text.md#span-backgrounds), поэтому `code: "rounded bg-neutral-100"` даёт ему скруглённый фон; ссылки — это [нажимаемые спаны](./text.md#links); изображения и встроенные пользовательские узлы — это [встроенные вложения](./text.md#inline-views-and-images). Текстовые стили на корне передаются всем частям так же, как [текстовые стили](./text.md#text-styles) передаются от `Text` его спанам.

С `selectable` весь документ выделяется как единое целое, как веб-страница: перетаскивание (а на сенсорных экранах — долгое нажатие и маркеры) проходит от одного абзаца, элемента списка, ячейки или блока кода к следующему, а «Копировать» берёт текст из всех них. `selectable` `TextView` выделяется сам по себе; внутри [выделяемого представления](./text-selection.md) его выделение продолжается и в окружающие тексты и другие `TextView`.

Всё остальное добавляет `TextView`: чтение Markdown, HTML или документа в виде блоков, представления вокруг текстов (списки, цитаты, таблицы, блоки кода, раскрывающиеся блоки, сноски), потоковую передачу, стили по частям, render-функции и расширения.

<a id="the-document"></a>

## Документ

Содержимое задаётся одним из трёх свойств, которые читаются в таком порядке:

- **`markdown`**: CommonMark с дополнениями GitHub (таблицы, списки задач, зачёркивание, автоссылки, сноски, alerts), формулами (`$…$` и `$$…$$`) и HTML внутри Markdown.
- **`html`**: HTML в том виде, как его показывает режим чтения. Текст, структура и встроенное форматирование сохраняются; скрипты, стили, элементы форм и скрытые элементы отбрасываются. Подходит как фрагмент, так и целая страница (показывается её body).
- **`document`**: блоки, которые приложение строит или хранит: обычные объекты в TSX, `nsh_base::text_view::Document` в Rust ([Модель документа](#the-document-model)).

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{Block, Document, Inline};
use nsh_core::prelude::*;

fn shipping() -> impl IntoElement {
    text_view().html(r#"<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>"#)
}

fn total() -> impl IntoElement {
    text_view().document(Document::new(vec![
        Block::Heading { level: 2, content: vec![Inline::text("Total")], anchor: None },
        Block::paragraph(vec![Inline::Strong { content: vec![Inline::text("$42.00")] }]),
    ]))
}
```

```tsx tabs
<TextView html={`<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>`} />

<TextView document={{
  blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "Total" }] },
    { type: "paragraph", content: [{ type: "strong", content: [{ type: "text", text: "$42.00" }] }] },
  ],
}} />
```

`TextView` растёт вместе с содержимым. Для длинных документов поместите его в [`Scroll`](./scroll.md) (или в строку [`List`](./list.md)).

<a id="styling-the-parts"></a>

## Стилизация частей

`class` и `style` стилизуют корень — колонку блоков; текстовые стили, заданные там (цвет, размер, шрифт), передаются всем частям. Корень также является частью `root`: `styles.root` принимает текстовые стили с их типами (`style` типизируется как у представления), а `classes.root` — классы. `classes` принимает классы Tailwind по частям, а `styles` — инлайновые стили по частям. Классы части идут после её собственных стилей по умолчанию, поэтому имеют приоритет; её `styles` имеют приоритет над её классами. В Rust части принимают типизированные стили: `TextViewParts` даёт каждому `TextViewPart` функцию, уточняющую его стиль, для каждого `TextView` ниже предоставляющего её представления ([Типизированные стили частей](#typed-part-styles)), а корень принимает методы стилей. Высота строк в значениях по умолчанию задана в пунктах: класс, меняющий размер части, задаёт и её высоту строки (классы Tailwind `text-*` это делают).

```rust tabs
use nsh_base::{TextViewPart, TextViewParts, text_view, theme};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading, |s| s.text_color(rgb(0x0a0a0a)))
            .part(TextViewPart::Heading2, |s| s.text_xl().mt_2())
            .part(TextViewPart::Blockquote, |s| {
                s.border_l(px(2.0)).border_color(rgb(0xd4d4d4)).pl_3().text_color(rgb(0x525252))
            })
            .part(TextViewPart::CodeBlock, |s| s.rounded_lg().bg(rgb(0xf5f5f5)))
            .part(TextViewPart::CodeBlockHeader, |s| s.px_3().pt_2())
            .part(TextViewPart::CodeBlockCode, |s| s.p_3().text_size(px(13.0)))
            .part(TextViewPart::Table, |s| s.rounded_lg().border_1().border_color(rgb(0xe5e5e5)))
            .part(TextViewPart::TableHead, |s| s.bg(rgb(0xfafafa)))
            .part(TextViewPart::TableCell, |s| {
                s.px_3().py_2().border_t_1().border_color(rgb(0xe5e5e5))
            })
            .part(TextViewPart::TaskMarkerChecked, |s| s.text_color(rgb(0x16a34a)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
    text_view()
        .markdown(move || markdown.get())
        .gap_3()
        .text_size(px(15.0))
        .line_height(px(24.0))
        .text_color(rgb(0x262626))
        .font_family("Inter")
}
```

```tsx tabs
<TextView
  markdown={reply()}
  class="gap-3 text-[15px] leading-6 text-neutral-800"
  classes={{
    heading: "text-neutral-950",
    heading2: "text-xl mt-2",
    blockquote: "border-l-2 border-neutral-300 pl-3 text-neutral-600",
    codeBlock: "rounded-lg bg-neutral-100",
    codeBlockHeader: "px-3 pt-2",
    codeBlockCode: "p-3 text-[13px]",
    table: "rounded-lg border border-neutral-200",
    tableHead: "bg-neutral-50",
    tableCell: "px-3 py-2 border-t border-neutral-200",
    taskMarkerChecked: "text-green-600",
  }}
  styles={{ root: { fontFamily: "Inter" }, link: { color: "#2563eb" } }}
/>
```

Некоторые узлы состоят из нескольких частей, которые применяются по порядку: заголовок уровня 2 — это `heading`, затем `heading2`; alert — это `blockquote`, `alert`, затем его вид (`alertNote`, ...); маркер задачи — это `listMarker`, `taskMarker`, затем `taskMarkerChecked`, если задача выполнена; строка заголовка — это `tableRow`, затем `tableHead`, а её ячейки — `tableCell`, затем `tableHeaderCell`.

| Часть | Rust | Что это |
|---|---|---|
| `root` | `Root` | Сам текстовый вид — колонка его блоков; текстовые стили здесь передаются всем частям. |
| `paragraph` | `Paragraph` | Каждый абзац. |
| `heading` | `Heading` | Каждый заголовок, перед частью его уровня. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | Заголовки этого уровня (27, 20, 17, затем 15pt, semibold). |
| `blockquote` | `Blockquote` | Цитаты и alerts: колонка их блоков с линией сбоку. |
| `alert` | `Alert` | Каждый alert (`> [!NOTE]`), после `blockquote`: тонированный блок, строка из его значка и блоков. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | Alerts этого вида. |
| `alertIcon` | `AlertIcon` | Значок alert: кольцо с глифом цвета alert. |
| `list` | `List` | Каждый список: колонка его элементов. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | Нумерованные и маркированные списки, после `list`. |
| `listItem` | `ListItem` | Каждый элемент: строка из его маркера и блоков. |
| `listMarker` | `ListMarker` | Маркер элемента (`•`, `◦`, `▪` по глубине или `1.`), выровненный по правому краю в отступе перед элементом. |
| `taskMarker` | `TaskMarker` | Маркер элемента-задачи: квадрат, нарисованный как представление, заполняется `✓`, когда задача выполнена; после `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | Маркер выполненной задачи, после `taskMarker`. |
| `listItemContent` | `ListItemContent` | Колонка блоков элемента. |
| `codeBlock` | `CodeBlock` | Блоки кода: рамка со скруглёнными углами с кодом и заголовком над ним. |
| `codeBlockHeader` | `CodeBlockHeader` | Строка действий блока кода (`codeBlockActions`), плавающая над его правым верхним углом. |
| `codeBlockScroll` | `CodeBlockScroll` | Горизонтальная прокручиваемая область вокруг кода блока кода. |
| `codeBlockCode` | `CodeBlockCode` | Код блока кода (моноширинный, как написан). |
| `code` | `Code` | Код в тексте (моноширинный, на скруглённом фоне). |
| `keyboard` | `Keyboard` | Клавиши (`<kbd>`, как код). |
| `strong` | `Strong` | Жирный текст (semibold). |
| `emphasis` | `Emphasis` | Выделенный текст (курсив). |
| `strikethrough` | `Strikethrough` | Зачёркнутый текст. |
| `underline` | `Underline` | Подчёркнутый текст (`<u>`, `<ins>`). |
| `highlight` | `Highlight` | Подсвеченный текст (`<mark>`, на скруглённом жёлтом фоне). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | Верхний и нижний индекс (мельче). |
| `link` | `Link` | Ссылки (цвета `primary` темы, подчёркнутые). |
| `image` | `Image` | Изображения. |
| `math` | `Math` | Формулы в тексте, набираются, если нет `renderMath`. |
| `mathBlock` | `MathBlock` | Блоки формул, набираются и центрируются, если нет `renderMath`. |
| `table` | `Table` | Таблицы: содержимое `renderTableActions`, затем прокручиваемая область ячеек. |
| `tableScroll` | `TableScroll` | Горизонтальная прокручиваемая область ячеек таблицы: столбцы подгоняются под содержимое, если хватает места, переносятся вплоть до минимальной ширины, когда область уже, а за её пределами таблица прокручивается. |
| `tableRow` | `TableRow` | Каждая строка таблицы: представление позади её ячеек для фонов и границ (текстовые стили задаются в `tableCell`). |
| `tableHead` | `TableHead` | Строка заголовка, после `tableRow`. |
| `tableCell` | `TableCell` | Каждая ячейка. |
| `tableHeaderCell` | `TableHeaderCell` | Ячейки строки заголовка (мельче, приглушённые), после `tableCell`. |
| `rule` | `Rule` | Тематические разрывы: линия, нарисованная как верхняя граница. |
| `details` | `Details` | Раскрывающиеся блоки (`<details>`). |
| `summary` | `Summary` | Заголовок раскрывающегося блока; нажатие открывает и закрывает его. |
| `summaryMarker` | `SummaryMarker` | Маркер заголовка (`▸`, `▾`). |
| `footnotes` | `Footnotes` | Сноски после блоков: колонка. |
| `footnote` | `Footnote` | Сноска: строка из её номера и блоков. |
| `footnoteLabel` | `FootnoteLabel` | Номер сноски. |
| `footnoteReference` | `FootnoteReference` | Ссылка на сноску в тексте (её номер, мельче). |
| `custom` | `Custom` | Пользовательские узлы, показанные как их содержимое (если их не показывает ни одна render-функция). |

<a id="streaming-ai-replies"></a>

## Потоковые ответы ИИ

Передавайте ответ по мере его роста через `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` в Rust). Конец ещё поступающего текста часто оставляет синтаксис незакрытым (`**bold`, `` `код ``, `[ссылка](htt`, a table whose header just arrived); потоковый режим показывает его так, как он будет выглядеть после закрытия, поэтому читатель никогда не видит лишних `**` или `[`. Блоки хранятся по позиции: завершённые блоки сохраняют свои представления, а заново создаётся только блок, который пишется сейчас, поэтому обновление длинного ответа остаётся дешёвым.

`streamingCaret` следует за концом документа: встроенно в конце последнего текста, где бы ни заканчивался последний блок (абзац, элемент списка, блок кода, последняя ячейка таблицы), иначе — на отдельной строке после последнего блока (линия, содержимое render-функции). Уберите его, когда ответ завершён.

```rust tabs
use nsh_base::{MarkdownOptions, text_view};
use nsh_core::prelude::*;

/// A reply the app appends to as chunks arrive, with `done` set at the end.
fn reply(text: Signal<SharedString>, done: Signal<bool>) -> impl IntoElement {
    text_view()
        .markdown(move || text.get())
        .options(move || MarkdownOptions { streaming: !done.get(), ..Default::default() })
        .streaming_caret(when(
            move || !done.get(),
            || view().ml_0p5().h_4().w_2().rounded_sm().bg(rgb(0xa3a3a3)),
        ))
}
```

```tsx tabs
import { signal, View } from "nsh";
import { TextView } from "nsh/base";

function Reply(props: { stream: AsyncIterable<string> }) {
  const text = signal("");
  const done = signal(false);
  (async () => {
    for await (const chunk of props.stream) text.update((t) => t + chunk);
    done.set(true);
  })();
  return (
    <TextView
      markdown={text()}
      options={{ streaming: !done() }}
      streamingCaret={done() ? undefined : <View class="ml-0.5 h-4 w-2 rounded-sm bg-neutral-400" />}
    />
  );
}
```

Каретка — собственное представление приложения, поэтому она может мигать или пульсировать с помощью [API анимации `nsh`](../modules/nsh.md#animation), а новые блоки могут плавно появляться с помощью анимаций приложения.

<a id="links"></a>

## Ссылки

Ссылки — это [нажимаемые спаны](./text.md#links). Нажатие на ссылку вызывает `onLinkPress` с `{ url }`; приложение решает, что открыть (собственную страницу, [`WebView`](./web-view.md), прокрутку к заголовку). У заголовков есть якоря (как у GitHub: `## Getting started` — это `#getting-started`), поэтому ссылка на `#getting-started` приходит в виде этой строки, а ссылка на сноску приходит как `#footnote-<label>`.

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view};
use nsh_core::prelude::*;

fn doc(markdown: &'static str) -> impl IntoElement {
    text_view().markdown(markdown).on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| {
        match url.strip_prefix('#') {
            Some(anchor) => scroll_to_anchor(anchor),
            None => open_web(url),
        }
    })
}
```

```tsx tabs
<TextView
  markdown={doc}
  onLinkPress={({ url }) => {
    if (url.startsWith("#")) scrollToAnchor(url.slice(1));
    else nav.push({ name: "web", url });
  }}
/>
```

`scroll_to_anchor` и `open_web` (`scrollToAnchor` и `nav` в TSX) обозначают собственные функции приложения.

С `links="open"` нажатие на ссылку на другой сайт или приложение (URL со схемой: `https:`, `mailto:`, ...) также открывает её вне приложения через [`openUrl`](../modules/nsh.md#openurl) при наличии у приложения разрешения `openUrl`, после того как `onLinkPress` сообщил о нажатии; якоря в документе (`#…`) только передаются в обработчик. Значение по умолчанию, `"report"`, ничего не открывает.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## Render-функции

Render-функции добавляют в документ собственное содержимое приложения. Каждая принимает значение части и возвращает её содержимое (JSX в TSX, элемент в Rust); часть сохраняет то, что было отрисовано для неё, пока её значение не меняется, поэтому при потоковой передаче заново отрисовывается только пишущаяся часть.

| Свойство | Rust | Значение | Что заменяет или добавляет |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | Заменяет блок кода (собственная подсветка синтаксиса). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | Значок действия блока кода, принадлежащего приложению (`codeBlockActions`); кнопка вокруг него принадлежит `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | Добавляет содержимое над таблицей (копирование, экспорт). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | Заменяет формулу: `{ tex, display }`, `display` для блока `$$…$$`. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | Заменяет изображение (`{ src, alt, title }`): собственная загрузка, размеры, просмотрщик по нажатию. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | Показывает пользовательский узел по его `name` ([Расширения Markdown](#markdown-extensions)). |

Блоки кода несут действия над своим правым верхним углом, и все они нарисованы одинаково: это кнопки-призраки, фон которых виден при наведении или нажатии; на десктопах они показываются, пока над блоком находится указатель, а на сенсорных экранах — всегда. `copy` встроено: оно копирует код и на мгновение показывает галочку. Остальные действия принадлежат приложению: `renderCodeBlockAction` рисует их значок, а `onCodeBlockAction` сообщает об их нажатиях (о встроенном `copy` тоже, после копирования). `copy` записывает в буфер обмена так же, как это делает `Clipboard`, поэтому требуется разрешение приложения `clipboard` (`nsh.json`).

```rust tabs
use nsh_base::{TextViewCodeAction, TextViewCodeActionEvent, text_view};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .code_block_actions(vec![
            TextViewCodeAction::new("copy").with_label("Copy code"),
            TextViewCodeAction::new("run").with_label("Run"),
        ])
        .render_code_block_action(|_action: &TextViewCodeAction| text("▶").text_xs())
        .on_code_block_action(|event: &TextViewCodeActionEvent| {
            if event.id == "run" {
                run(&event.code.code);
            }
        })
}
```

```tsx tabs
import { Text } from "nsh";
import { TextView } from "nsh/base";

<TextView
  markdown={reply()}
  codeBlockActions={[
    { id: "copy", label: "Copy code" },
    { id: "run", label: "Run" },
  ]}
  renderCodeBlockAction={(action) => <Text class="text-xs">▶</Text>}
  onCodeBlockAction={({ id, code }) => id === "run" && run(code.code)}
/>
```

Блоки кода подсвечиваются из коробки: для языка, указанного в ограждении (`ts`, `tsx`, `rust`, `python`, `bash`, `json`, `toml`, `yaml`, `diff` и ещё около двухсот), код показывается в палитре кода Allsum, светлой или тёмной в зависимости от оформления; блок без языка показывается без подсветки. Приложение с собственной подсветкой показывает свой код через `renderCodeBlock`, из собственного компонента или из своего Rust-крейта; представление на Rust передаёт `TextView` свой подсветчик через [`CodeHighlighter`](#syntax-highlighting). Вот код с собственной подсветкой приложения и изображение, заполняющее всю ширину:

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{CodeBlock, Image};
use nsh_base::TextViewMath;
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .render_code_block(|code: &CodeBlock| highlighted(code.language.clone(), code.code.clone()))
        .render_image(|img: &Image| {
            image(img.src.clone())
                .label(img.alt.clone())
                .aspect_ratio(16.0 / 9.0)
                .w_full()
                .rounded_lg()
        })
        .render_math(|math: &TextViewMath| math_view(math.tex.to_string(), math.display))
}
```

```tsx tabs
import { Image, View } from "nsh";

<TextView
  markdown={reply()}
  renderCodeBlock={(code) => <Highlighted language={code.language} code={code.code} />}
  renderImage={(image) => (
    <Image src={image.src} accessibilityLabel={image.alt} class="aspect-video w-full rounded-lg" />
  )}
  renderMath={(math) => <MathView tex={math.tex} display={math.display} />}
/>
```

`Highlighted` и `MathView` (`highlighted` и `math_view` в Rust) обозначают собственные компоненты приложения (подсветчик, средство отрисовки формул или компонент его Rust-крейта). Без `renderMath` `TextView` сам набирает формулу (части `math` и `mathBlock`) с поддержкой TeX и шрифтами KaTeX, цветом текста, одинаково на всех платформах; TeX, который он не может прочитать, показывается как исходный текст моноширинным шрифтом.
<a id="markdown-extensions"></a>

## Расширения Markdown

`extensions` превращает синтаксис приложения в пользовательские узлы, которые показывает `renderCustom`. У каждого расширения есть `name`
(`name` создаваемых им узлов) и один из четырёх видов синтаксиса:

| Вид | Rust | Что находит | Узел |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | Регулярное выражение в тексте (синтаксис `regex` из Rust) вне кода и ссылок | Строчный; `text` — совпадение, `attributes` — его группы: `"1"`, `"2"`, … и именованные группы по имени |
| `language` | `MarkdownExtension::language(name, language)` | Блоки кода с ограждением на этом языке (```` ```chart ````) | A block; `text` is the code, `attributes.meta` — остальная часть info-строки |
| `tag` | `MarkdownExtension::tag(name, tag)` | HTML- или MDX-элементы с этим тегом в любом регистре (`<Callout kind="tip">`) | Его атрибуты и разобранное содержимое: `children` (блоки) для элемента на отдельных строках, `content` (строчное) внутри текста |
| `container` | `MarkdownExtension::container(name, container)` | Контейнеры `:::name` … `:::` | Блок из Markdown внутри (`children`); `:::note[Heads up]` даёт `attributes.label`, `{key=value}` — остальные атрибуты |

````rust tabs
use nsh_base::text_view::{CustomNode, Document};
use nsh_base::{MarkdownExtension, text_view};
use nsh_core::prelude::*;

const MESSAGE: &str = r#"Thanks @ada! Here are the numbers:

```chart
12, 19, 7, 25
```

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::"#;

fn custom(node: &CustomNode) -> AnyElement {
    match node.name.as_str() {
        "mention" => text(node.text.clone())
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x2563eb))
            .into_element(),
        "chart" => bar_chart(node.text.split(',').filter_map(|v| v.trim().parse().ok()).collect())
            .into_element(),
        "callout" => view()
            .rounded_lg()
            .bg(rgb(0xfffbeb))
            .p_3()
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
        _ => view()
            .gap_1()
            .border_l(px(4.0))
            .border_color(rgb(0x3b82f6))
            .pl_3()
            .child(
                text(node.attributes.get("label").cloned().unwrap_or_else(|| "Note".into()))
                    .font_weight(FontWeight::SEMIBOLD),
            )
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
    }
}

fn message() -> impl IntoElement {
    text_view()
        .markdown(MESSAGE)
        .extensions(vec![
            MarkdownExtension::pattern("mention", r"@(\w+)"),
            MarkdownExtension::language("chart", "chart"),
            MarkdownExtension::tag("callout", "callout"),
            MarkdownExtension::container("note", "note"),
        ])
        .render_custom(custom)
}
````

````tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";
import type { MarkdownExtension, TextViewCustomNode } from "nsh/base";

const extensions: MarkdownExtension[] = [
  { name: "mention", pattern: "@(\\w+)" },
  { name: "chart", language: "chart" },
  { name: "callout", tag: "callout" },
  { name: "note", container: "note" },
];

const message = `Thanks @ada! Here are the numbers:

\`\`\`chart
12, 19, 7, 25
\`\`\`

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::`;

function Custom(props: { node: TextViewCustomNode }) {
  const node = props.node;
  switch (node.name) {
    case "mention":
      return <Text class="font-semibold text-blue-600">{node.text}</Text>;
    case "chart":
      return <BarChart values={node.text!.split(",").map(Number)} />;
    case "callout":
      return (
        <View class="rounded-lg bg-amber-50 p-3">
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
    default:
      return (
        <View class="gap-1 border-l-4 border-blue-500 pl-3">
          <Text class="font-semibold">{node.attributes?.label ?? "Note"}</Text>
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
  }
}

<TextView markdown={message} extensions={extensions} renderCustom={(node) => <Custom node={node} />} />;
````

`BarChart` (в Rust — `bar_chart`) обозначает собственный график приложения. Группа шаблона упоминания находится в
`node.attributes?.["1"]` (в Rust `node.attributes["1"]`: `ada`), а всё совпадение целиком — в `node.text` (`@ada`). Пользовательский узел без функции отрисовки показывает своё содержимое.
Представление, возвращённое для строчного узла (чипа), располагается в своей строке согласно собственному `verticalAlign`: `align-middle`
(`verticalAlign: "middle"`) центрирует его относительно текста, а строка сохраняет `lineHeight` абзаца, если только представление не выше.

<a id="options"></a>

### Параметры

`options` выбирает синтаксис Markdown, который читается сверх CommonMark и GitHub; в Rust это `MarkdownOptions` с теми же
полями (`MarkdownOptions { streaming: true, ..Default::default() }`):

| Ключ | Тип | По умолчанию | Описание |
|---|---|---|---|
| `math` | `boolean` | `true` | Формулы: `$…$` в тексте, блоки `$$…$$`. |
| `html` | `boolean` | `true` | HTML внутри Markdown читается так же, как его читает проп `html`; `false` показывает его как текст. |
| `alerts` | `boolean` | `true` | Оповещения GitHub: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | YAML front matter (`---` … `---` в самом начале) становится пользовательским узлом `frontmatter`, у которого `text` — это YAML. |
| `mdx` | `boolean` | `false` | MDX: JSX-элементы — пользовательские узлы с именем по тегу, `{expressions}` — пользовательские узлы `expression`; необработанный HTML при этом читается как текст. |
| `streaming` | `boolean` | `false` | Текст ещё поступает: синтаксис, оставшийся открытым в его конце, показывается так, как будто он закрыт. |

<a id="the-document-model"></a>

## Модель документа

Проп `document` и значения функций отрисовки — обычные объекты, каждый узел помечен своим `type`. Типы
берутся из `nsh/base`: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` и `TextViewCustomNode`. В Rust это
типы `nsh_base::text_view` (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block` и `Inline` — перечисления, варианты которых совпадают с приведёнными ниже типами в PascalCase
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), с теми же полями в snake case.

| Блок `type` | Поля |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`, `"left"`, `"center"`, `"right"` для каждого столбца), `head` (ячейки), `rows?` (строки ячеек); ячейка — это `{ content }` |
| `rule` | |
| `details` | `open?`, `summary` (строчные), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| Строчный элемент `type` | Поля |
|---|---|
| `text` | `text` |
| `strong`, `emphasis`, `strikethrough`, `underline`, `highlight`, `superscript`, `subscript` | `content` |
| `code` | `code` |
| `keyboard` | `text` |
| `link` | `url`, `title?`, `content` |
| `image` | `src`, `alt?`, `title?` |
| `math` | `tex` |
| `break` | |
| `footnoteReference` | `label`, `index` |
| `custom` | как у блока |

У документа также есть `footnotes?`: `{ label, index, children }`, они показываются после блоков в порядке первого упоминания. Приложение может хранить ответы как документы, собирать их из собственных данных или подмешивать пользовательские узлы,
которые показывает `renderCustom`.

<a id="parsing-and-plain-text"></a>

### Разбор и простой текст

`TextView` также читает документы, не показывая их, синхронно:

| Функция | Rust | Возвращает |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | `TextViewDocument`, который показал бы проп `markdown`. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | `TextViewDocument`, который показал бы проп `html`. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | Текст документа без разметки: блоки разделены пустыми строками, элементы списков и строки таблиц — переводами строк, ячейки — табуляциями. |

Кнопка копирования всего ответа:

```rust tabs
use nsh_base::{TextView, button};
use nsh_core::prelude::*;

fn copy_reply(reply: Signal<SharedString>) -> impl IntoElement {
    button()
        .on_press(move || {
            let document = TextView::parse(reply.get().to_string(), None, None);
            set_clipboard(TextView::plain_text(document));
        })
        .child(text("Copy"))
}
```

```tsx tabs
<Button onPress={() => Clipboard.writeText(TextView.plainText(TextView.parse(reply())))}>
  <Text>Copy</Text>
</Button>
```

Приложение также может разобрать документ один раз и сохранить его (`document={doc}`) или изменить его перед показом.

<a id="in-rust"></a>

## В Rust

Представления на Rust используют тот же компонент из крейта `nsh-base`, а примеры выше приведены на их вкладках Rust. Три вещи
свойственны только Rust: подсветчик приложения, типизированные стили по частям и плагины Markdown; каждый из них передаётся каждому `TextView` ниже
по дереву представления с помощью `provide_context`. Типы документа находятся в `nsh_base::text_view`, где `Parser` также читает
документы с плагинами (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### Подсветка синтаксиса

`TextView` подсвечивает код с помощью syntect в палитре кода Allsum (функция `highlight` в `nsh-base`, включена по умолчанию);
большой блок сначала показывается без подсветки, а цвета получает, когда фоновый поток его подсветит.
`CodeHighlighter` — это подсветчик приложения, который используется вместо встроенного и передаётся каждому `TextView` ниже по дереву представления с помощью `provide_context`.
Он получает каждый блок кода и возвращает стили для диапазонов байтов его кода (по порядку, без пересечений; то, что они не охватывают,
остаётся обычным); `TextView` показывает код в виде спанов с этими стилями внутри своего обычного блока кода (заголовок, действия,
область прокрутки, части). Подсветчиком может быть что угодно, что превращает код в диапазоны со стилями: `tree-sitter`, syntect с
темой приложения, ...

```rust
use std::ops::Range;

use nsh_base::{CodeHighlighter, text_view::CodeBlock};
use nsh_core::{element::StyleRefinement, prelude::*};

/// The app's highlighter (here with syntect, set up once by the app).
fn highlight(code: &CodeBlock) -> Vec<(Range<usize>, StyleRefinement)> {
    my_syntect::ranges(code.language.as_deref(), &code.code)
        .map(|(range, color, bold)| {
            let style = StyleRefinement::default().text_color(color);
            (range, if bold { style.font_weight(FontWeight::BOLD) } else { style })
        })
        .collect()
}

fn chat() -> impl IntoElement {
    provide_context(CodeHighlighter::new(highlight));
    view().child(messages())
}
```

`my_syntect::ranges` обозначает связующий код приложения с его подсветчиком, а `messages` — представление чата в приложении.
`renderCodeBlock`, если задан, показывает блок кода вместо всего этого.

<a id="typed-part-styles"></a>

### Типизированные стили частей

`TextViewParts` стилизует части типизированными стилями вместо строк классов, для представлений на Rust: каждый `TextViewPart` (по одному на
часть из [таблицы выше](#styling-the-parts)) получает функцию, уточняющую свой `StyleRefinement`. Будучи переданными через
`provide_context`, они применяются к каждому `TextView` ниже по дереву, до его `classes` и `styles`; цвета темы, прочитанные в них,
следуют светлому и тёмному оформлению.

```rust
use nsh_base::{TextViewPart, TextViewParts, theme};
use nsh_core::prelude::*;

fn chat_parts() {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading1, |s| s.text_2xl().font_weight(FontWeight::BOLD))
            .part(TextViewPart::Code, |s| s.bg(theme().muted).rounded(px(4.0)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
}
```

<a id="markdown-plugins"></a>

### Плагины Markdown

`MarkdownPlugin` читает синтаксис Markdown в Rust: он получает каждый узел синтаксического дерева (`mdast` из markdown-rs) до того,
как его прочитает парсер, и возвращает собственное блочное или строчное содержимое, обычно `CustomNode`; он также может показывать
создаваемые им пользовательские узлы. Представление передаёт плагины каждому `TextView` ниже по дереву:

```rust
use nsh_base::text_view::{mdast, CustomNode, Inline, MarkdownPlugin, MarkdownPlugins, ParseContext};
use nsh_core::prelude::*;

struct Tickers;

impl MarkdownPlugin for Tickers {
    fn name(&self) -> &str {
        "tickers"
    }

    /// `$AAPL` in inline code becomes a ticker node.
    fn inline(&self, node: &mdast::Node, _cx: &mut ParseContext<'_>) -> Option<Inline> {
        let mdast::Node::InlineCode(code) = node else { return None };
        let symbol = code.value.strip_prefix('$')?;
        Some(Inline::Custom(CustomNode::new("ticker").with_text(symbol)))
    }

    fn render(&self, node: &CustomNode) -> Option<AnyElement> {
        (node.name == "ticker").then(|| text(node.text.clone()).font_weight(FontWeight::BOLD).into_element())
    }
}

fn chat() -> impl IntoElement {
    provide_context(MarkdownPlugins::new().with(Tickers));
    view().child(messages())
}
```

Сначала идёт `render` плагина, затем `renderCustom`, затем содержимое узла. `configure` включает больше
синтаксиса markdown-rs, а `ParseContext` читает дочерние элементы узла так же, как это делает парser.

## Props

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Документ в виде Markdown. |
| `html` | `.html(..)` | `string` | | Документ в виде HTML, если `markdown` не задан. |
| `document` | `.document(..)` | `TextViewDocument` | | Документ в виде блоков, если не заданы ни `markdown`, ни `html`. |
| `options` | `.options(..)` | `MarkdownOptions` | все значения по умолчанию | Читаемый синтаксис Markdown ([Параметры](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | Синтаксис приложения в виде пользовательских узлов ([Расширения Markdown](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | Классы Tailwind по частям. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | Инлайн-стили по частям (каждый — `StyleProp<TextStyle>`), поверх классов. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | Документ выделяется как единое целое: выделение проходит через его абзацы, заголовки, ячейки и блоки кода ([Выделение текста](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | Что делает нажатие на ссылку: сообщает о нём (`onLinkPress`), а при `"open"` ещё и открывает ссылку на другой сайт или приложение за пределами приложения ([Ссылки](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | Блоки кода показывают индикатор горизонтальной прокрутки. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | Таблицы показывают индикатор горизонтальной прокрутки. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | Показывается в конце документа: в той же строке после последнего текста, иначе на отдельной строке. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | Отображает пользовательские узлы. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | Отображает блоки кода. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | Действия в правом верхнем углу каждого блока кода: `{ id: "copy" }` встроено, остальные — приложения. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | Значок действия приложения. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | Содержимое над каждой таблицей. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | Отображает формулы. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | Отображает изображения. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | | Корень — колонка блоков; его стили текста передаются каждой части (типизированные стили текста: `styles.root`). |

В Rust классы и стили по частям — это `TextViewClasses` и `TextViewStyles`; представление на Rust обычно стилизует
части с помощью [`TextViewParts`](#typed-part-styles).

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | Нажата ссылка: `{ url }` — её URL, `#anchor` для заголовка, `#footnote-<label>` для сноски. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | Нажато действие блока кода (после того, как `copy` скопировал). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | Нажато изображение вне ссылки: `{ image }`, чтобы приложение показало его крупнее (собственный просмотрщик с масштабированием). |

<a id="accessibility"></a>

## Доступность

Скринридеры читают документ по порядку, текст за текстом. `TextView` задаёт структуре роли: заголовки — это
заголовки, ссылки — ссылки (их title служит подсказкой), маркеры задач — флажки с их состоянием, summary
раскрывающегося блока — кнопка, сообщающая, раскрыт ли он, а изображения озвучиваются по их альтернативному тексту.

<a id="related"></a>

## См. также

- [Text](./text.md): элемент, которым является каждый текст `TextView`, со своими спанами, ссылками, встроенными вложениями и выделением.
- [Выделение текста](./text-selection.md): одно выделение через несколько `TextView` и текстов.
- [`nsh/base`](../modules/nsh-base.md): остальные базовые компоненты.
- [Стилизация](../docs/styling.md) и [Tailwind](../docs/tailwind.md).
