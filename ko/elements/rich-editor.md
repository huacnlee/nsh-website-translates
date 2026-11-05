---
title: "RichEditor"
description: "nsh/base의 리치 텍스트 에디터입니다. 앱의 스키마로 정의되는 문서, 명령, 플러그인, 히스토리, 키맵, 입력 규칙, Markdown을 ProseMirror의 아키텍처를 따라 제공하며, 상태는 Rust에서 관리합니다."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---


# RichEditor

`RichEditor`은 ProseMirror의 아키텍처를 따라 만든 리치 텍스트 에디터입니다. 앱은 스키마로 문서가 무엇으로 구성되는지(단락, 제목, 목록, 멘션 등 필요한 노드 및 마크 타입 무엇이든) 정의하고, 에디터는 모든 문서가 스키마에 맞게 유효하도록 유지합니다. 변경은 스텝이며 트랜잭션으로 묶이므로 실행 취소가 가능하고, 위치를 매핑할 수 있으며, JSON으로 전달됩니다. 동작은 플러그인(히스토리, 키맵, 입력 규칙, Markdown 단축키, 앱 자체의 플러그인)에서 나오고, 커맨드는 툴바가 실행하고 질의하는 값입니다. 에디터의 상태, 커맨드, 플러그인은 Rust에서 실행됩니다. 타이핑, 키 바인딩, 입력 규칙은 JS를 기다리지 않으며, 앱은 요청할 때 상태를 JSON으로 읽습니다.

에디터는 두 부분으로 구성됩니다. 상태를 소유하며 앱의 코드가 구동하는 세션(`createRichEditor`)과, 세션을 네이티브로 렌더링하고 플랫폼의 입력을 트랜잭션으로 바꾸는 뷰(`<RichEditor editor={…} />`)입니다. 하나의 세션을 여러 뷰가 보여 줄 수 있습니다.

에디터의 커널은 Marijn Haverbeke의 [ProseMirror](https://prosemirror.net)를 Rust로 포팅한 것이며, 확장 레이어는 [Tiptap](https://tiptap.dev)을 따릅니다. 이들의 데이터 구조, 커맨드, 이름이 그대로 이어지므로 이미 알고 있는 지식도 그대로 통합니다. 둘 다 MIT 라이선스이며, 포팅된 부분에는 각각의 라이선스가 적용됩니다.

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

`schema` 없이 만든 에디터는 스타터 스키마(`starterSchema()`)를 사용하고, `plugins` 없이 만든 에디터는 스타터 킷(`starterKit()`: 스타터의 입력 규칙과 키 바인딩, 기본 키 바인딩, 히스토리)을 받습니다. 빈 `plugins` 배열은 플러그인이 전혀 없는 에디터를 만듭니다.

<a id="styling"></a>

## 스타일링

에디터는 앱의 룩으로 문서를 그립니다. `classes` 및 `styles` 항목으로 각 파트(`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker`, 표의 경우 `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`)와 타입별 노드(`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`)를 스타일링합니다. 노드 스펙의 `extra.listMarker` 값이 `"bullet"` 또는 `"ordered"`인 목록(스타터 스키마의 목록)의 항목은 `listMarker` 파트에 마커를 표시합니다. 마커는 깊이에 따라 `•`, `◦`, `▪` 중 하나이거나 목록의 `start`에서 시작하는 숫자이며, 항목 앞의 목록 들여쓰기 안에 놓입니다(브라우저가 `ul` 요소를 들여쓰는 것처럼 목록의 `pl-6`로 지정합니다).

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

`content` 파트는 에디터의 스크롤 뷰 안에 있는 문서의 박스입니다. 패딩(`content: "px-6 py-5"`)은 텍스트 주위의 여백이고, 스크롤 바는 에디터 자체의 가장자리를 따라 놓입니다. 에디터의 위나 아래를 넘어 선택하는 드래그는 문서를 함께 스크롤하며, 포인터가 멀리 갈수록 더 빠르게 스크롤합니다.

<a id="bubble-menu"></a>

### 버블 메뉴

Tiptap의 버블 메뉴에 해당하는 것이 `bubbleMenu`입니다. 선택 영역 옆에 앱의 콘텐츠를 보여 주며, 기본적으로 선택 영역 위(`bubbleMenuPlacement`, 공간이 없으면 반대쪽으로 뒤집힘)에 `bubbleMenuOffset`포인트(8) 간격으로, 텍스트가 스크롤될 때 따라가는 오버레이 안에 표시합니다. 앱은 표시하고자 하는 동안 세션의 상태에서 이를 전달합니다.

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

링크 메뉴는 캐럿 아래의 링크를 `chain([extendMarkRange("link"), command("setLink", { href })])` 커맨드로 편집하고, 같은 `extendMarkRange` 다음에 `command("unsetLink")` 커맨드로 제거합니다.

<a id="schemas"></a>

## 스키마

ProseMirror 형태의 스키마를 읽고, 문제가 있으면 무엇이 잘못되었는지 알려 주며 예외를 던지는 것이 `defineSchema(spec)`입니다. 노드 타입은 다음을 지정합니다: `content`(콘텐츠 표현식: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), `group`, `inline`인지 `atom`인지 여부, 허용하는 `marks`, 기본값과 검증이 있는 `attrs`(`"string"`, `"number"`, `"boolean"`). 첫 번째 블록 타입이 기본 타입으로, Enter가 만드는 것이자 필수 콘텐츠를 채우는 것입니다. 스펙이 알지 못하는 키는 해당 타입의 추가 데이터로 보존되어, 에디터 위에 구축된 프레임워크가 사용할 수 있습니다.

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

`RichSchema`의 멤버는 문서를 읽고 씁니다. `parse(content, format?)`(기본은 일반 텍스트, `"markdown"` 또는 JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)`(기본은 Markdown, `"text"`, `"json"`), 그리고 속성 기본값을 채운 문서를 반환하는 `check(doc)`가 있습니다. `nodes`, `marks`, `topNode`에는 해당 타입의 이름이 담깁니다. Markdown은 스타터 스키마의 이름(`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`)에 매핑됩니다.

<a id="commands"></a>

## 커맨드

커맨드는 값입니다. `toggleMark("bold")` 호출은 앱이 보관하고, 키에 바인딩하고, 에디터에 전달하는 객체를 만듭니다. `editor.run(command)` 호출은 커맨드를 실행하고 적용되었는지 여부를 반환하며, `editor.can(command)` 호출은 아무것도 변경하지 않고 적용 가능한지 묻습니다. 툴바가 버튼을 활성화하는 방법이 바로 이것입니다. `editor.isActive(name, attrs?)` 호출은 선택 영역에서 마크나 노드가 활성 상태인지 알려 줍니다(`isActive("heading", { level: 2 })`).

| 커맨드 | 동작 |
| --- | --- |
| `toggleMark(name, attrs?)` | 선택 영역에 마크를 추가하고, 이미 있으면 제거합니다. 커서 위치에서는 다음에 입력할 텍스트에 적용됩니다 |
| `setMark(name, attrs?)` / `unsetMark(name)` | 마크를 추가하거나 제거합니다 |
| `setBlockType(name, attrs?)` | 선택한 텍스트 블록을 특정 타입으로 만듭니다(`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | 선택한 블록을 노드(인용문)로 감쌉니다 / 부모 밖으로 끌어올립니다 |
| `wrapInList(name, attrs?)` | 선택한 블록을 목록으로 감쌉니다 |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | 목록 항목을 분할하거나, 들여쓰거나, 내어씁니다 |
| `undo()` / `redo()` | 변경을 실행 취소하거나 다시 실행합니다(`history()` 사용) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | 선택합니다 |
| `insertText(text)`, `insertContent(content, format?)` | 선택 영역 위에 텍스트나 콘텐츠를 삽입합니다 |
| `setNodeAttribute(pos, attr, value)` | 특정 위치에 있는 노드의 속성을 하나의 실행 취소 가능한 변경으로 설정합니다 |
| `command(name)` | 이름으로 지정하는 매개변수 없는 커맨드: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | 커맨드를 차례로 하나의 트랜잭션(실행 취소 한 단계)으로 실행하며, 모든 커맨드가 적용될 때만 적용됩니다 |
| `first(commands)` | 적용되는 첫 번째 커맨드를 실행합니다 |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## 세션

| 멤버 | 설명 |
| --- | --- |
| `state`, `doc`, `selection` | 상태, 문서, 선택 영역을 JSON으로 제공하며, 읽을 때 만들어집니다 |
| `revision` | 상태가 적용한 트랜잭션의 수 |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | UI가 에디터에 대해 보여 주는 정보 |
| `setContent(content, format?)` | 문서를 교체합니다. 하나의 실행 취소 가능한 변경으로 처리됩니다 |
| `insertContent(content, format?)` | 선택 영역 위에 콘텐츠를 삽입합니다 |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | 특정 포맷의 문서 |
| `dispatch(tr)` | JSON으로 주어진 트랜잭션을 적용합니다(현재 문서에 대한 스텝) |
| `on(event, listener)` | `event`마다 그 페이로드로 JS의 다음 턴에 `listener` 호출: `revision`(`{ revision }`, 모든 변경 후, 어떤 출처든), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. 리스너를 중지하는 함수를 반환하며, 컴포넌트가 렌더링되는 동안 추가한 리스너는 컴포넌트와 함께 중지됩니다 |
| `focus()`, `blur()` | 에디터를 보여 주는 뷰로, 또는 뷰에서 키보드 포커스를 이동합니다 |

위치는 ProseMirror와 같은 방식으로 셉니다. 텍스트는 UTF-16 코드 유닛 수만큼, 리프 노드는 1, 콘텐츠가 있는 노드는 양쪽 경계 2를 셉니다. 편집 후에도 유지되어야 하는 것은 노드의 속성이나 마크에 id를 담습니다. 위치 질의(`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...)는 문서 밖의 위치(유효 범위는 `0`부터 `doc.content.size`까지)에 대해 ProseMirror의 `resolve` 동작과 같이 `RangeError` 예외를 던지며, 아무것도 없는 곳에서는 `null` 값을 반환합니다(노드 끝에서는 `nodeAt`, 에디터를 보여 주는 뷰가 없으면 `coordsAtPos`). `run`, `can` 호출은 에디터가 알지 못하는 커맨드, 노드 또는 마크 타입에 대해 `TypeError` 예외를 던집니다.

<a id="taking-over-transactions"></a>

### 트랜잭션 가로채기

`editor.dispatchTransaction = (tr) => { … }` 호출 시 앱이 모든 트랜잭션을 직접 커밋합니다. 핸들러는 각 트랜잭션을 JSON으로 받아 `editor.applyTransaction(tr)` 호출로 커밋하거나 버립니다. 협업, 로깅, 앱의 검사를 통과해야 하는 트랜잭션에 사용하며, `null` 호출은 커밋을 다시 에디터에 넘깁니다. 핸들러는 JS의 다음 턴에 타이핑을 전달받으며, 문서는 커밋될 때 변경됩니다.

<a id="extensions"></a>

## 확장

확장은 Tiptap의 방식을 따릅니다. 각 확장은 노드 또는 마크 타입, 키 바인딩, 입력 규칙과 붙여넣기 규칙, 플러그인, 이름 있는 커맨드를 한꺼번에 제공하며, 확장으로 만든 에디터는 스키마, 키맵, 규칙, 커맨드 테이블을 확장에서 얻습니다. 내장 확장은 Tiptap과 같은 이름의 클래스이며, 그대로 쓰거나 설정해서 사용합니다.

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

`StarterKit` 확장은 `Document`, `Paragraph`, 텍스트 노드, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage`(Tiptap의 `Image`), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink`(Tiptap의 `Link`), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle`(Tiptap의 `TextStyle`), `TextAlign`, `History`, `TrailingNode`, `Typography`, `ListKeymap`를 제공합니다. 이 중 하나와 같은 이름의 옵션을 `false` 값으로 설정하면 해당 확장을 제외하고, 객체로 설정하면 해당 확장을 구성합니다(`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). 각 클래스의 `configure(options)` 및 `extend({...})` 호출은 `RichExtension` 하나를 만들며, 여기에는 `name`, `type`, `priority`, `options` 멤버가 있습니다. 모든 에디터는 코어 키맵(Enter, Backspace, Delete, 전체 선택)도 갖습니다.

각 확장은 Tiptap의 커맨드를 추가하며, 이는 `command(name, args)` 호출로 실행됩니다: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, 그리고 아래의 링크, 글자 수 세기, 제안(suggestion) 커맨드입니다.

목록 토글은 워드 프로세서의 목록 버튼처럼 목록 전체에 대해 동작합니다. 글머리 기호 목록 안에서 `toggleOrderedList`를 실행하면 중첩된 목록을 포함한 모든 수준이 번호 목록으로 바뀌고, 목록 자체의 토글은 선택한 블록을 둘러싼 모든 목록에서 꺼냅니다.

`extensions`의 순서는 우선순위가 같을 때의 우선순위입니다. 나중에 나열된 확장이 앞에 나열된 확장보다 먼저 키를 바인딩하며, 그 외의 경우에는 `priority` 값(기본값 100)이 순위를 정합니다. `extensions` 사용 시, 에디터의 `plugins` 항목은 확장의 플러그인 뒤에 옵니다.

<a id="the-apps-extensions"></a>

### 앱의 확장

확장은 `defineExtension` 호출로 만듭니다. 확장의 함수는 해당 확장으로 에디터를 만들 때 확장의 옵션과 함께 한 번 실행되며, 위의 팩토리가 만드는 것과 같은 커맨드, 규칙, 플러그인 데이터를 반환합니다.

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

`node` 또는 `mark`(`defineSchema`의 형태로)을 사용하면 노드 또는 마크 확장이 됩니다. `addGlobalAttributes` 항목은 다른 타입에 속성을 추가하고, `addProseMirrorPlugins` 항목은 플러그인을 반환하며(`RichEditorPlugin` 포함), `addPasteRules` 항목은 붙여넣은 텍스트용 `textRule` 및 `markRule` 규칙을 반환합니다. 내장 클래스의 `extend({...})` 항목은 클래스가 제공하는 부분을 대체합니다: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

앱의 크레이트는 Rust로 작성한 확장을 UI 세트를 통해 등록하며, JS는 이름으로 이를 가져옵니다:

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

`richExtension(name, options)` 호출은 내장 확장도 이름(`"text"`, `"bold"`, ...)으로 모두 찾아 줍니다.

<a id="plugins"></a>

## 플러그인

| 팩토리 | 추가하는 것 |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | 실행 취소 히스토리. `newGroupDelay` 밀리초(500) 이내의 변경은 함께 실행 취소됩니다 |
| `keymap(bindings)` | 키 이름으로 지정하는 커맨드: `"Mod-b"`(Apple 플랫폼에서는 Cmd, 그 외에서는 Ctrl), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter, Backspace, Delete, 전체 선택, 플랫폼의 텍스트 편집 키 |
| `starterKeymap()` | 스타터 스키마의 바인딩: 마크, 제목, 목록, 코드 블록, 하드 브레이크 |
| `inputRules(rules)` | 커서 앞에 입력한 텍스트가 규칙과 일치하면 규칙이 만드는 결과로 바뀌며, 바로 뒤에 Backspace를 누르면 되돌립니다 |
| `markdown(options?)` | 입력하는 동안의 Markdown, Markdown 붙여넣기, Markdown 복사(`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | 스타터의 입력 규칙과 바인딩, 기본 바인딩, 히스토리 |

목록에서 플러그인의 위치가 곧 우선순위입니다. 목록에서 앞에 있는 키맵과 입력 규칙이 키나 텍스트를 먼저 처리합니다. 입력 규칙은 `markdownRules()`(제목, 인용문, 목록, 코드 펜스, 구분선, 일반적인 마크), `typographyRules()`(스마트 따옴표, 말줄임표, 엠 대시), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)`, `textblockRule(match, node)`에서 제공됩니다. 규칙의 `match` 값은 끝이 `$` 패턴인 정규 표현식이며, 커서 앞의 텍스트와 대조됩니다.

<a id="the-apps-plugins"></a>

### 앱의 플러그인

`new RichEditorPlugin(key)` 호출은 동작을 앱이 정하는 플러그인을 만들며, 체이닝된 호출로 설정합니다.

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

- `captureKeys(keys, handler)`: `capturing` 값이 true인 동안 에디터가 이 키들을 소비하고, 바로 이어서 `handler`에 어떤 키가 눌렸는지 알려 줍니다. 키보드는 플러그인이 없을 때처럼 빠르게 유지됩니다.
- `editor.setDecorations(key, decorations)`: 문서를 변경하지 않고 뷰가 문서 위에 그리는 인라인 속성, 노드 속성, 위젯입니다. 다시 설정할 때까지 모든 변경을 따라갑니다.
- `filterTransaction(hook)` 및 `appendTransaction(hook)` 훅은 앱 자체의 호출(`run`, `dispatch`, `setContent` 등)이 만드는 트랜잭션을 해당 호출 안에서 확인합니다. `filterTransaction` 훅은 트랜잭션을 버릴 수 있고, `appendTransaction` 훅은 함께 적용할 트랜잭션을 하나 더 반환할 수 있습니다. `on("revision", …)` 훅은 타이핑을 포함한 모든 변경을 받습니다.
<a id="links-character-counts-and-suggestions"></a>

## 링크, 글자 수, 제안

세 가지 플러그인이 Tiptap의 Link, CharacterCount, Suggestion 동작을 모두 네이티브로 제공합니다.

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

- `link(options?)`: 공백이나 Enter 앞에 입력한 URL은 링크가 되며, 붙여넣은 텍스트 안의 URL도 마찬가지입니다(`autolink`). 선택 영역 위에 URL을 붙여넣으면 선택 영역에 링크가 걸립니다(`linkOnPaste`). Mod를 누른 채로 링크를 누르거나 에디터가 읽기 전용일 때 링크를 누르면 앱의 URL 처리를 통해 링크를 엽니다(`openOnClick`). `enableClickSelection`는 누르면 링크 전체를 선택합니다. URL은 프로토콜이 있든 없든 인식되며(`nsh.dev`, `https://nsh.dev/docs`, 이메일 주소), 호스트만 있는 경우에 붙는 프로토콜은 `defaultProtocol`입니다(`http`). 링크는 프로토콜 `http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` 및 `protocols`에 있는 프로토콜을 허용하므로, `setLink({ href })`, `toggleLink(attrs?)`, 자동 링크는 스크립트(`javascript:`)와 data URL을 거부합니다. `unsetLink()`는 선택 영역을 감싼 링크를 제거합니다.
- `characterCount(options?)`: `editor.characters(mode?)`는 텍스트의 문자 수(`"textSize"`, JS의 `length`처럼 UTF-16 단위)를 세거나 문서의 위치 수(`"nodeSize"`)를 세고, `editor.words()`는 단어 수(유니코드 단어 경계 기준)를 셉니다. `limit`를 지정하면 제한을 넘기게 되는 변경은 거부되고 붙여넣은 내용은 들어갈 만큼만 잘립니다. 처음 문서가 제한을 넘으면 잘립니다(`autoTrim`). `setCharacterLimit(limit)`는 제한을 변경하고 `editor.characterLimit`는 제한을 읽습니다.
- `suggestion(options?)`: 커서 앞에 입력된 트리거(`char`, 기본값은 `@`)를 추적합니다. `allowSpaces`는 쿼리에 공백을 허용하고, `allowedPrefixes`는 트리거 앞에 올 수 있는 문자를 지정하며(기본값은 공백, `anyPrefix`는 모든 문자를 허용), `startOfLine`는 트리거가 줄의 시작에 있어야 함을 요구합니다(`/` 명령 메뉴). `editor.suggestion(key)`는 `{ active, range, query, text, lastKey, keyCount }`를 제공하며, 활성 범위에는 앱의 `decorationClass`가 담깁니다(쿼리가 비어 있는 동안에는 `decorationEmptyClass`도 포함). 제안이 활성화된 동안 `captureKeys`의 키는 앱의 목록이 사용합니다. 에디터가 해당 키를 받아 마지막 키를 상태에 기록하며, Escape는 제안을 닫습니다(`exitSuggestion(key)`도 마찬가지입니다). `replaceSuggestion(content, key?)`는 트리거와 쿼리를 텍스트 또는 JSON 콘텐츠로 바꿉니다.
- `withMention(schema, { name?, char? })`는 Tiptap의 mention 노드를 추가합니다. `id`, `label`와 트리거를 가진 인라인 atom이며, 텍스트에서는 `@label`로, HTML에서는 `<span data-type="mention">`로 기록됩니다. `insertMention(range, id, label?)`는 제안의 범위를 mention과 공백으로 바꿉니다.

팝업은 앱이 제공합니다. 팝업은 제안의 상태를 읽고, `coordsAtPos(range.from)`에 자신을 배치하며, 항목을 앱 고유의 방식으로 그립니다.

<a id="tables"></a>

## 표

`TableKit`는 Tiptap의 표 기능인 `RichTable`(Tiptap의 `Table`), `RichTableRow`, `RichTableHeader`, `RichTableCell`를 제공합니다. `StarterKit` 옆에 추가합니다.

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

표는 옵션 `resizable`(true), `cellMinWidth`(25), `lastColumnResizable`(true), `allowTableNodeSelection`(false), `HTMLAttributes`를 받으며, `TableKit.configure({ tableHeader: false })`는 확장 하나를 제외합니다. 셀은 블록을 담을 수 있고 `colspan`, `rowspan`, `colwidth`(차지하는 열마다 포인트 단위의 너비)를 가지며, 행에는 `height`가 있습니다.

Tab과 Shift-Tab은 셀 사이를 이동하고, 마지막 셀에서 Tab을 누르면 행이 추가됩니다. 셀의 가장자리에서 방향키를 누르면 다음 셀로 이동하며, Shift와 방향키를 함께 누르거나 셀 위로 드래그하면 셀의 사각형 영역이 선택됩니다(`"cell"` 타입의 선택이며, 그 `anchor`와 `head`는 첫 번째 셀과 마지막 셀 앞의 위치입니다). Backspace와 Delete는 선택된 셀을 비우고, 모든 셀이 선택되어 있으면 표를 삭제합니다.

에디터에서 표는 셀로 이루어진 그리드입니다. 각 열은 셀의 `colwidth`만큼 넓고, 값이 없는 열은 남은 공간을 나눠 가지며(최소 `cellMinWidth` 너비), 각 행은 최소 `height` 높이를 가집니다. 모양은 테마에서 출발합니다. 1포인트 `border` 그리드, `muted` 위의 헤더 셀, 패딩이 있는 셀, 그리고 선택된 각 셀은 `selectedCell` 파트 아래에 선택 색상으로 표시됩니다. `classes.nodes`(`table`, `tableCell`, `tableHeader`)와 파트로 이 모든 것의 스타일을 바꿀 수 있습니다. 셀의 첫 줄이나 마지막 줄에서 위/아래 방향키를 누르면 위 또는 아래의 셀로 이동합니다.

문서를 편집할 수 있는 동안에는 다음과 같습니다.

- 데스크톱에서는 각 열의 오른쪽 테두리와 각 행의 아래쪽 테두리로 크기를 조절할 수 있습니다. 포인터가 크기 조절 커서와 `tableResizeHandle` 선을 표시하고, 표가 드래그를 따라가며, 놓으면 `colwidth` 또는 `height`가 한 번에 설정되어 실행 취소로 되돌릴 수 있습니다. `resizable: false`는 이 기능을 끄고, `lastColumnResizable: false`는 마지막 열의 너비를 유지합니다.
- 선택 영역이 들어 있는 표는 각 열 위의 위쪽 테두리와 각 행 옆의 왼쪽 테두리에 그립(`tableGrip`)을 표시합니다. 그립을 누르면 해당 열 또는 행이 선택되고, 데스크톱에서 드래그하면 놓일 위치(`tableDropIndicator`)가 표시되며 놓는 순간 그 위치로 이동합니다.

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

각 명령은 `nsh/base`의 헬퍼입니다.

- `insertTable({ rows, cols, withHeaderRow })`(기본값은 헤더 행이 있는 3 × 3)과 `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()`, `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()`, `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`, `goToPreviousCell()`, `fixTables()`: 마지막 명령은 셀이 누락되었거나 겹친 표를 복구합니다.
- `moveTableRow({ from, to, select })`와 `moveTableColumn({ from, to, select })`는 행 또는 열을 이동하며, 병합된 셀이 걸쳐 있는 행 또는 열도 함께 이동합니다. `setColumnWidth({ col, width })`와 `setRowHeight({ row, height })`는 크기를 지정하며(`null`는 내용에 맞게 크기를 지정), 이 명령들은 `table`(표 앞의 위치)를 받아 선택 영역이 속한 표가 아닌 다른 표에 적용할 수 있습니다.

표는 HTML(`<table>`와 `<th>` / `<td>`, `colspan`, `rowspan`, `data-colwidth`)과 Markdown으로 읽고 쓸 수 있습니다. 헤더 행이 있고 각 셀이 문단 하나인 표는 GFM 파이프 표로 기록되며, 그 외의 표는 HTML로 기록되어 다시 읽어도 동일합니다. 일반 텍스트에서 행은 탭으로 구분된 셀들의 한 줄입니다.
